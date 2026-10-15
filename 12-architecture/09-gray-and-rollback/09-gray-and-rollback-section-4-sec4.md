> 本文件是 **09-gray-and-rollback.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](09-gray-and-rollback.md)。

## 4. 工程实现

### 4.1 落地步骤

#### 阶段 1：基础设施

1. **CI/CD Pipeline**：Jenkins / GitLab CI / GitHub Actions / Argo CD。
2. **镜像仓库**：Harbor / Docker Hub / 阿里云 ACR。
3. **配置中心**：Apollo / Nacos / Spring Cloud Config。
4. **监控告警**：Prometheus + Grafana / 阿里云 ARMS。
5. **日志系统**：ELK / Loki / SLS。

#### 阶段 2：灰度发布平台

1. **流量调度能力**：Nginx / Envoy / Istio / Ribbon。
2. **灰度策略**：按用户 ID、地域、白名单的灰度规则。
3. **指标观察**：实时观察新版本的 QPS、延迟、错误率。
4. **自动回滚**：基于指标的自动回滚机制。

#### 阶段 3：Feature Flag 平台

1. **Flag 管理**：Flag 的创建、修改、删除、归档。
2. **Flag 评估**：高性能（< 10ms）、一致性（同用户始终命中同一版本）。
3. **Flag 治理**：Owner 制度、定期清理、过期提醒。

#### 阶段 4：A/B 测试平台

1. **实验管理**：实验的创建、配置、启动、停止。
2. **流量分配**：哈希分流（同用户始终命中同一桶）。
3. **指标分析**：实时统计、自动显著性检验。
4. **结果可视化**：A/B 报表、显著性检验报告。

#### 阶段 5：数据灰度 / 模型灰度

1. **数据迁移工具**：双写平台、影子表工具、Online Schema Migration。
2. **模型灰度平台**：影子模型、金丝雀、A/B 测试。
3. **回滚预案**：数据回滚（Binlog 反向）、模型回滚（保留旧模型）。

#### 阶段 6：组织与流程

1. **发布规范**：发布窗口（如周二周四）、发布审批、变更评审。
2. **回滚演练**：定期演练回滚流程（季度/GameDay）。
4. **监控值班**：发布期间值班人员就位。

### 4.2 关键技术点

#### 1. 流量调度（Nginx）

```nginx
# Nginx 灰度：金丝雀 5% 流量到新版本
upstream backend_v1 {
    server backend-v1:8080;
}

upstream backend_v2 {
    server backend-v2:8080;
}

split_clients "${arg_user_id}" $backend {
    5%     backend_v2;  
    *      backend_v1;
}

server {
    listen 80;
    location / {
        proxy_pass http://$backend;
    }
}
```

#### 2. 流量调度（Istio VirtualService）

```yaml
# Istio：金丝雀 10% 流量到 v2
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - match:
    - headers:
        x-canary: exact: "true"
    route:
    - destination:
        host: order-service
        subset: v2
  - route:
    - destination:
        host: order-service
        subset: v1
      weight: 90
    - destination:
        host: order-service
        subset: v2
      weight: 10
```

#### 3. Argo Rollouts（金丝雀自动发布）

```yaml
# Argo Rollouts：金丝雀 + 自动回滚
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: order-service
spec:
  strategy:
    canary:
      steps:
      - setWeight: 5
      - pause: {duration: 5m}
      - setWeight: 10
      - pause: {duration: 5m}
      - setWeight: 30
      - pause: {duration: 5m}
      - setWeight: 60
      - pause: {duration: 5m}
      - setWeight: 100
      canaryMetrics:
      - name: error-rate
        provider:
          prometheus:
            address: http://prometheus:9090
            query: |
              sum(rate(http_requests_total{status=~"5.."}[5m]))
              / sum(rate(http_requests_total[5m]))
        threshold: 0.01
        interval: 30s
```

#### 4. Feature Flag（Apollo + Spring Boot）

```java
// Apollo Feature Flag 客户端
@Component
public class FeatureFlags {
    
    @ApolloConfig
    private Config config;
    
    public boolean isFeatureEnabled(String flagName, String userId) {
        boolean globalEnabled = config.getBooleanProperty(flagName, false);
        if (!globalEnabled) return false;
        
        int percentage = config.getIntProperty(flagName + ".percentage", 0);
        int userBucket = Math.abs(userId.hashCode()) % 100;
        return userBucket < percentage;
    }
}

// 使用
if (featureFlags.isFeatureEnabled("new-payment-flow", user.getId())) {
    return newPaymentService.charge(order);
} else {
    return oldPaymentService.charge(order);
}
```

#### 5. 数据灰度（双写 + 影子表）

```java
// 双写：新旧表同时写
@Transactional
public void createOrder(Order order) {
    // 写主表
    orderRepository.create(order);
    
    // 写影子表（仅灰度期间）
    if (graySwitch.isDataGrayEnabled("order_table_v2")) {
        orderV2Repository.create(order.toV2());
    }
}

// 读路径：按灰度比例切流量
public Order getOrder(Long orderId) {
    if (graySwitch.shouldUseV2(orderId)) {
        return orderV2Repository.findById(orderId);
    } else {
        return orderRepository.findById(orderId);
    }
}
```

### 4.3 工具链与平台（含 2024-2025 新工具）

#### 灰度发布平台

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **Spinnaker** | Netflix（开源） | 企业级灰度发布平台，老牌 |
| **Argo Rollouts** | Intuit（CNCF） | Kubernetes 渐进式交付，新生代事实标准 |
| **Flagger** | Weaveworks（CNCF） | Kubernetes 自动化金丝雀发布 |
| **LaunchDarkly** | LaunchDarkly | 商业 Feature Flag 平台领导者 |
| **Unleash** | Unleash（开源） | 开源 Feature Flag |
| **GrowthBook** | GrowthBook（开源） | 开源 A/B 测试 + Feature Flag |

#### 配置中心

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **Apollo** | 携程（开源） | 国内主流，配置 + Feature Flag |
| **Nacos** | 阿里（开源） | 注册中心 + 配置中心 |
| **Spring Cloud Config** | Pivotal | Spring 生态标配 |
| **Consul** | HashiCorp | KV + 服务发现 |

#### 服务网格

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **Istio** | Google（开源） | 服务网格事实标准，流量调度强 |
| **Linkerd** | Buoyant（开源） | 轻量服务网格 |
| **Envoy** | Lyft（开源） | L7 代理，Istio 数据面 |

#### 数据迁移工具

| 工具 | 用途 |
| --- | --- |
| **gh-ost** | MySQL Online Schema Migration |
| **pt-online-schema-change** | Percona 的 OSD 工具 |
| **pg_repack** | PostgreSQL Online Table Rewrite |
| **Apache SeaTunnel** | 大数据同步，CDC + 批量 |
| **DataX** | 阿里开源，批量数据迁移 |
| **Debezium** | CDC 平台，基于 Binlog |

#### AI 模型灰度平台

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **MLflow** | Databricks（开源） | ML 生命周期管理 |
| **KServe** | CNCF | Kubernetes 模型服务 |
| **Seldon Core** | Seldon（开源） | Kubernetes 模型部署 |
| **BentoML** | BentoML（开源） | ML 模型打包和服务化 |
| **TFX** | Google | TensorFlow Extended，端到端 ML 平台 |

#### A/B 测试平台

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **GrowthBook** | 开源 | A/B 测试 + Feature Flag 一体 |
| **Optimizely** | Optimizely | 商业 A/B 测试领导者 |
| **AB Tasty** | AB Tasty | 商业 |
| **自研** | 阿里/字节/美团 | 大厂自研，深度定制 |

### 4.4 代码 / 示例

#### Spring Boot + Apollo Feature Flag 完整示例

```java
// FeatureFlagService：统一 Feature Flag 入口
@Service
public class FeatureFlagService {
    
    @Autowired
    private Config config;  // Apollo Config
    
    public boolean isEnabled(String flagKey, String userId) {
        // 全局开关
        boolean globalEnabled = config.getBooleanProperty(
            flagKey + ".enabled", false);
        if (!globalEnabled) return false;
        
        // 灰度比例
        int percentage = config.getIntProperty(
            flagKey + ".percentage", 0);
        
        // 白名单（白名单用户总是命中）
        String whitelist = config.getProperty(
            flagKey + ".whitelist", "");
        if (whitelist.contains(userId)) return true;
        
        // 一致性 Hash
        int bucket = Math.abs((flagKey + userId).hashCode()) % 100;
        return bucket < percentage;
    }
}

// 使用
@RestController
public class PaymentController {
    
    @Autowired
    private FeatureFlagService featureFlags;
    
    @PostMapping("/pay")
    public PaymentResult pay(@RequestBody PaymentRequest req) {
        String userId = req.getUserId();
        
        if (featureFlags.isEnabled("payment.new-flow", userId)) {
            // 新流程（灰度中）
            return newPaymentFlow.process(req);
        } else {
            // 旧流程（稳定）
            return oldPaymentFlow.process(req);
        }
    }
}
```

#### Argo Rollouts + Prometheus 自动回滚示例

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: recommendation-service
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 5
      - pause: {duration: 10m}
      - setWeight: 25
      - pause: {duration: 10m}
      - setWeight: 50
      - pause: {duration: 10m}
      - setWeight: 75
      - pause: {duration: 10m}
      canaryMetrics:
      - name: error-rate
        provider:
          prometheus:
            address: http://prometheus.monitoring:9090
            query: |
              sum(rate(
                http_requests_total{
                  job="recommendation-service",
                  status=~"5.."
                }[5m]
              ))
              / sum(rate(
                http_requests_total{
                  job="recommendation-service"
                }[5m]
              ))
        threshold: 0.01
      - name: p99-latency
        provider:
          prometheus:
            address: http://prometheus.monitoring:9090
            query: |
              histogram_quantile(0.99,
                sum(rate(
                  http_request_duration_seconds_bucket{
                    job="recommendation-service"
                  }[5m]
                )) by (le)
              )
        threshold: 0.5
```

#### AI Agent Prompt 灰度示例

```python
# Prompt 灰度：不同用户用不同 Prompt
class PromptGrayService:
    def __init__(self):
        self.config_center = ApolloClient()
        self.prompt_versions = {
            "v1": PromptV1(),  # 稳定版
            "v2": PromptV2(),  # 实验版
            "v3": PromptV3(),  # 最新实验版
        }
    
    def get_prompt(self, user_id: str, scene: str) -> Prompt:
        # 按用户 ID Hash 到固定版本
        bucket = hash(user_id) % 100
        
        # 灰度策略：v1 80%, v2 15%, v3 5%
        if bucket < 80:
            version = "v1"
        elif bucket < 95:
            version = "v2"
        else:
            version = "v3"
        
        prompt = self.prompt_versions[version]
        
        # 记录实验数据（用于 A/B 分析）
        metrics_client.increment(
            "prompt.exposure",
            tags={"version": version, "scene": scene}
        )
        
        return prompt
    
    async def invoke_agent(self, user_id: str, query: str):
        prompt = self.get_prompt(user_id, "qa")
        return await agent.invoke(prompt=prompt, query=query)
```

---
