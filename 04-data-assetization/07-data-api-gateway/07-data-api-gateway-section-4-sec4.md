> 本文件是 **07-data-api-gateway.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](07-data-api-gateway.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：需求分析**

- 评估 API 数量、QPS、数据敏感度。
- 识别合规要求（等保 / GDPR / 行业法规）。
- 输出：**API 网关需求说明书**。

**Step 2：网关选型**

- 自研 vs 开源（Kong / APISIX / Tyk / Envoy）。
- 评估性能、插件生态、运维成本。
- 输出：**选型决策书（ADR）**。

**Step 3：路由与负载均衡**

- 配置路由规则（path / header / method）。
- 配置负载均衡（轮询 / 加权 / 一致性哈希）。
- 配置健康检查。
- 输出：**路由配置**。

**Step 4：鉴权与权限**

- 集成身份系统（OAuth 2.0 / JWT / SSO）。
- 实现行级 / 列级权限（OPA / Casbin）。
- 输出：**权限模型**。

**Step 5：限流与配额**

- 配置限流规则（QPS / 数据量 / 调用方）。
- 配置熔断策略（错误率 / 慢调用）。
- 配置降级策略（默认值 / 缓存）。
- 输出：**限流 / 熔断配置**。

**Step 6：缓存策略**

- 配置结果集缓存（Redis）。
- 配置 CDN（静态响应）。
- 配置物化（高频 API 预计算）。
- 输出：**缓存配置**。

**Step 7：可观测**

- 接入 Prometheus / Grafana。
- 接入 Jaeger / Zipkin（链路追踪）。
- 接入 ELK / Loki（日志）。
- 输出：**监控大盘**。

**Step 8：安全防护**

- 配置 WAF 规则。
- 配置数据脱敏（手机号 / 身份证 / 邮箱）。
- 配置防爬虫 / 防注入。
- 输出：**安全策略**。

**Step 9：上线与灰度**

- 灰度发布（10% → 50% → 100%）。
- A/B 测试不同策略。
- 监控异常并回滚。
- 输出：**生产级 API 网关**。

### 4.2 关键技术点

1. **高性能网关**：APISIX（基于 Nginx + Lua）、Envoy（C++）、Kong（OpenResty）。
2. **限流算法**：令牌桶（Guava / Sentinel）、滑动窗口（Redis Lua）。
3. **鉴权框架**：OAuth 2.0（Keycloak / Auth0）、JWT（jjwt）。
4. **权限引擎**：OPA（Open Policy Agent）、Casbin。
5. **数据脱敏**：动态脱敏（Apache ShardingSphere）。
6. **熔断器**：Resilience4j、Hystrix（已停止维护）、Sentinel。
7. **缓存**：Redis（结果集）、Caffeine（本地）、CDN（静态）。
8. **可观测**：Prometheus + Grafana + Jaeger + ELK。
9. **WAF**：ModSecurity、Cloudflare WAF、阿里云 WAF。
10. **灰度发布**：按 header / 用户 / 流量比例。
11. **API 聚合**：BFF（Backend for Frontend）模式。
12. **AI Gateway**：MCP 网关（2024）、Token 计量、Prompt 注入防护。

### 4.3 工具链与平台

**开源 API 网关**：

- **Kong**（开源 + 商业）——基于 OpenResty，插件生态丰富。
- **Apache APISIX**（国产开源）——云原生、高性能、插件丰富。
- **Tyk**（开源）——Go 语言、轻量。
- **KrakenD**（开源）——高性能 API 聚合。
- **Gravitee**（开源）——API 生命周期管理。
- **Ambassador / Emissary-Ingress**（开源）——Envoy 上层封装。

**云原生网关**：

- **Envoy**（Lyft 开源）——Service Mesh 事实标准。
- **Istio Gateway**（Envoy 上层）——Service Mesh API 网关。
- **Linkerd**（Buoyant 开源）——Service Mesh。
- **Traefik**（开源）——云原生反向代理。
- **HAProxy**（开源）——经典负载均衡。

**API 网关 SaaS**：

- **AWS API Gateway**——托管 API 网关。
- **Azure API Management**——Azure 生态。
- **Google Cloud API Gateway**——GCP 生态。
- **阿里云 API 网关**——国内云。
- **腾讯云 API 网关**——国内云。

**WAF / 安全**：

- **ModSecurity**（开源）——WAF 标准。
- **Cloudflare WAF**（商业）——云 WAF。
- **AWS WAF**（商业）——AWS WAF。

**限流 / 熔断**：

- **Sentinel**（阿里开源）——限流 / 熔断 / 降级。
- **Resilience4j**（开源）——Java 熔断器。
- **Hystrix**（Netflix，已停止维护）——历史经典。
- **Envoy Circuit Breaker**——Envoy 内置。

**可观测**：

- **Prometheus + Grafana**——指标 + 大盘。
- **Jaeger / Zipkin**——链路追踪。
- **ELK / Loki**——日志。

**权限**：

- **OPA（Open Policy Agent）**——策略引擎。
- **Casbin**——权限框架。
- **Keycloak**——身份认证。

**GraphQL Gateway**：

- **Hasura**——PostgreSQL 自动 GraphQL。
- **Apollo Federation**——GraphQL 联邦。
- **GraphQL Mesh**——多源 GraphQL。

### 4.4 代码 / 示例

**示例 1：APISIX 配置**

```yaml
# APISIX Route 配置
routes:
  - uri: /api/v1/metric/*
    upstream:
      type: roundrobin
      nodes:
        - host: oneservice-1
          port: 8000
          weight: 1
        - host: oneservice-2
          port: 8000
          weight: 1
    plugins:
      jwt-auth:
        key: user-key
      limit-count:
        count: 1000
        time_window: 60
        rejected_code: 429
        key: remote_addr
      prometheus:
        prefer_name: true
      cors:
        allow_origins:
          - "https://*.company.com"
        allow_methods:
          - GET
          - POST
```

**示例 2：Kong + JWT 插件**

```bash
# 添加服务
curl -X POST http://kong:8001/services \
  --data name=oneservice \
  --data url=http://oneservice:8000

# 添加路由
curl -X POST http://kong:8001/services/oneservice/routes \
  --data paths[]=/api/v1/metric

# 添加 JWT 插件
curl -X POST http://kong:8001/services/oneservice/plugins \
  --data name=jwt

# 添加限流插件
curl -X POST http://kong:8001/services/oneservice/plugins \
  --data name=rate-limiting \
  --data config.minute=1000 \
  --data config.policy=local
```

**示例 3：FastAPI 中间件（限流 + 鉴权 + 计量）**

```python
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import jwt
import time
import redis

app = FastAPI()
redis_client = redis.Redis(host='redis', port=6379)

# 限流中间件
@app.middleware("http")
async def rate_limit(request: Request, call_next):
    api_key = request.headers.get("X-API-Key", "anonymous")
    window = 60  # 60 秒
    limit = 1000  # 1000 次
    
    key = f"ratelimit:{api_key}:{int(time.time() // window)}"
    count = redis_client.incr(key)
    redis_client.expire(key, window)
    
    if count > limit:
        raise HTTPException(429, "Too Many Requests")
    
    response = await call_next(request)
    return response

# 鉴权中间件
@app.middleware("http")
async def auth(request: Request, call_next):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    try:
        user = jwt.decode(token, "secret", algorithms=["HS256"])
        request.state.user = user
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Unauthorized")
    
    return await call_next(request)

# 计量中间件
@app.middleware("http")
async def metering(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    
    redis_client.hincrby("metering:requests", request.state.user["sub"], 1)
    redis_client.hincrbyfloat("metering:duration", request.state.user["sub"], duration)
    
    return response
```

**示例 4：Sentinel 限流（Java）**

```java
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.alibaba.csp.sentinel.slots.block.RuleConstant;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRule;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRuleManager;

@SpringBootApplication
public class DataGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(DataGatewayApplication.class, args);
        initFlowRules();
    }

    private static void initFlowRules() {
        List<FlowRule> rules = new ArrayList<>();
        FlowRule rule = new FlowRule("/api/v1/metric/gmv");
        rule.setGrade(RuleConstant.FLOW_GRADE_QPS);
        rule.setCount(1000); // 1000 QPS
        rules.add(rule);
        FlowRuleManager.loadRules(rules);
    }
}

@RestController
public class MetricController {
    @SentinelResource(value = "getMetric", blockHandler = "handleBlock")
    @GetMapping("/api/v1/metric/{name}")
    public Metric getMetric(@PathVariable String name) {
        return metricService.get(name);
    }

    public Metric handleBlock(String name, BlockException ex) {
        return Metric.empty(); // 降级返回空
    }
}
```

---
