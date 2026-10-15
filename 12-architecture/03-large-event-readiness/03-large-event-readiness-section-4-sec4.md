> 本文件是 **03-large-event-readiness.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](03-large-event-readiness.md)。

## 4. 工程实现

### 4.1 落地步骤

#### 阶段 1：3 个月前——预案制定

1. **业务预测**：与业务团队对齐大促计划（GMV、订单量、营销活动）。
2. **峰值预估**：用 ARIMA/Prophet 预测峰值 QPS，叠加业务增量。
3. **容量评估**：基于峰值预估，计算所需 Pod / DB / Cache / MQ / 带宽。
4. **资源采购**：提前向云厂商提交扩容工单（特别是 GPU、带宽）。
5. **架构评审**：识别单点、薄弱链路，制定改造计划。

#### 阶段 2：1 个月前——封板 + 压测

1. **代码封板**：冻结非必要发布，只允许 P0 bug 修复。
2. **全链路压测**：录制生产流量 → 影子表隔离 → 回放 → 观察系统表现。
3. **限流策略调优**：按链路分级设定阈值。
4. **降级开关演练**：每个开关由 owner 演练一遍。
5. **预案演练**：DB 故障、缓存击穿、MQ 堆积等预案演练。
6. **弹性扩容测试**：模拟流量激增，验证扩容时间 < 5 分钟。

#### 阶段 3：1 周前——预热 + 演练

1. **缓存预热**：把热点数据加载到缓存。
2. **DB 连接池预热**：把连接池打满，避免冷启动。
3. **JIT 预热**：让 JVM 把热点代码 JIT 编译好。
4. **GPU 预热**：把模型加载到 GPU 显存。
5. **GameDay**：全员故障演练日，模拟真实故障。

#### 阶段 4：当天——作战

1. **值班就位**：7×24h 现场值班，明确升级路径。
2. **实时监控**：大屏展示核心指标（QPS、RT、错误率、资源利用率）。
3. **黄金 5 分钟**：任何故障必须 5 分钟内有人响应。
4. **按预案执行**：严格执行 Runbook，避免临场发挥。
5. **实时决策**：超出预案的决策由 PMO 拍板。

#### 阶段 5：1 周后——复盘

1. **故障收集**：所有故障（包括"差点故障"）记录。
2. **RCA（Root Cause Analysis）**：每个故障做根因分析。
3. **行动项**：转化为可执行的改进项，明确 owner 和 deadline。
4. **组织能力沉淀**：把经验固化为工具、文档、培训。
5. **奖励与问责**：对优秀响应者奖励，对失职者问责。

### 4.2 关键技术点

#### 限流实现（Sentinel）

```java
// Sentinel：定义资源 + 限流规则
@SentinelResource(value = "createOrder", blockHandler = "createOrderBlockHandler")
public Order createOrder(OrderRequest req) {
    // 业务逻辑
    return orderService.create(req);
}

public Order createOrderBlockHandler(OrderRequest req, BlockException ex) {
    // 限流后的降级逻辑
    throw new OrderRateLimitException("下单太火爆，请稍后重试");
}

// 配置规则：1000 QPS 限流，超过则触发降级
FlowRule rule = new FlowRule("createOrder")
    .setGrade(RuleConstant.FLOW_GRADE_QPS)
    .setCount(1000);
FlowRuleManager.loadRules(Collections.singletonList(rule));
```

#### 熔断实现（Resilience4j）

```java
// Resilience4j：熔断器 + 重试 + 降级
CircuitBreaker circuitBreaker = CircuitBreaker.ofDefaults("paymentService");

Supplier<PaymentResult> decoratedSupplier = Decorators
    .ofSupplier(() -> paymentService.charge(order))
    .withCircuitBreaker(circuitBreaker)
    .withFallback(List.of(CallNotPermittedException.class, 
                          TimeoutException.class),
                 e -> PaymentResult.deferred("支付繁忙，请稍后重试"))
    .decorate();

PaymentResult result = decoratedSupplier.get();
```

#### 弹性扩容（Kubernetes HPA + KEDA）

```yaml
# HPA：基于 CPU 的水平扩容
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 10
  maxReplicas: 1000
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

```yaml
# KEDA：基于 Kafka Lag 的弹性扩容
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: kafka-consumer-scaler
spec:
  scaleTargetRef:
    name: order-consumer
  minReplicaCount: 5
  maxReplicaCount: 500
  triggers:
  - type: kafka
    metadata:
      bootstrapServers: kafka:9092
      consumerGroup: order-consumer-group
      topic: order-events
      lagThreshold: '100'
```

#### 流量染色（全链路压测）

```java
// 压测流量染色：识别 + 路由
public class TrafficColoringFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain) {
        HttpServletRequest httpReq = (HttpServletRequest) req;
        String stressTest = httpReq.getHeader("X-Stress-Test");
        
        if ("true".equals(stressTest)) {
            // 压测流量：路由到影子服务
            RequestContext.setShadow(true);
            // 写到影子表
            DataSourceContextHolder.set("shadowDS");
        }
        
        chain.doFilter(req, resp);
    }
}
```

### 4.3 工具链与平台（含 2024-2025 新工具）

#### 全链路压测平台

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **AHAS**（应用高可用服务） | 阿里云 | 阿里内部 PTS 商业化，全链路压测 + 流量染色 + 影子表 |
| **PTS**（Performance Testing Service） | 阿里云 | 云压测服务，支持百万级并发 |
| **Locust** | 开源 | Python 编写，分布式压测，灵活 |
| **JMeter** | Apache | 老牌压测工具，GUI + CLI |
| **Gatling** | 开源 | Scala 编写，高性能，DSL 友好 |
| **k6** | Grafana Labs（2024） | Go 编写，云原生压测，趋势上升 |
| **Vegeta** | 开源 | Go 编写，简单 HTTP 压测 |

#### 限流降级框架

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **Sentinel** | 阿里 | Java/Go/C++，流量控制 + 熔断降级 + 系统自适应保护，中文友好 |
| **Resilience4j** | 开源 | Java 8+，轻量，函数式编程 |
| **Hystrix** | Netflix | 已停止维护，不推荐新项目 |
| **Polly** | 开源 | .NET 生态 |
| **Istio** | 开源 | 服务网格层熔断，对应用透明 |

#### 弹性扩容

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **Kubernetes HPA/VPA/CA** | CNCF | 编排层标准方案 |
| **KEDA** | CNCF | 事件驱动弹性 |
| **阿里云 ESS** | 阿里云 | 云厂商弹性伸缩 |
| **AWS Auto Scaling** | AWS | 云厂商弹性伸缩 |
| **Spotinst / Ocean** | Spot.io | Spot Instance 编排 |

#### 监控告警

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **Prometheus + Grafana** | CNCF | 事实标准 |
| **阿里云 ARMS** | 阿里云 | 阿里内部 EagleEye 商业化 |
| **Datadog** | Datadog | SaaS 一体化监控 |
| **New Relic** | New Relic | APM 老牌 |
| **OpenTelemetry** | CNCF | 统一的可观测性标准 |

### 4.4 代码 / 示例

#### Sentinel + Spring Boot 大促配置

```java
// 大促期间的限流规则配置（动态下发）
@Configuration
public class SentinelConfig {
    
    @PostConstruct
    public void initRules() {
        // 核心链路：下单 5000 QPS
        FlowRule orderRule = new FlowRule("createOrder")
            .setGrade(RuleConstant.FLOW_GRADE_QPS)
            .setCount(5000)
            .setControlBehavior(RuleConstant.CONTROL_BEHAVIOR_REJECT);
        
        // 重要链路：商品详情 10000 QPS
        FlowRule productRule = new FlowRule("getProduct")
            .setGrade(RuleConstant.FLOW_GRADE_QPS)
            .setCount(10000);
        
        // 非核心链路：推荐 2000 QPS（可降级）
        FlowRule recommendRule = new FlowRule("getRecommend")
            .setGrade(RuleConstant.FLOW_GRADE_QPS)
            .setCount(2000)
            .setControlBehavior(RuleConstant.CONTROL_BEHAVIOR_DEFAULT);
        
        FlowRuleManager.loadRules(Arrays.asList(orderRule, productRule, recommendRule));
        
        // 熔断规则：调用支付服务
        DegradeRule paymentRule = new DegradeRule("callPaymentService")
            .setGrade(RuleConstant.DEGRADE_GRADE_EXCEPTION_COUNT)
            .setCount(50)  // 异常数
            .setStatIntervalMs(1000)  // 统计窗口 1s
            .setTimeWindow(10);  // 熔断时长 10s
        
        DegradeRuleManager.loadRules(Collections.singletonList(paymentRule));
    }
}
```

#### AI 时代的智能体链路降级（2024+ 新模式）

```python
# 智能体链路降级：大模型 → 中模型 → 小模型 → 规则
class AgentDegradationChain:
    def __init__(self):
        self.primary = GPT4Service()       # 主链路
        self.secondary = ClaudeService()    # 备链路（多模型路由）
        self.tertiary = LocalLLMService()  # 本地小模型
        self.fallback = RuleEngine()       # 规则兜底
    
    async def invoke(self, prompt: str) -> str:
        for level, service in enumerate([self.primary, self.secondary, 
                                         self.tertiary, self.fallback]):
            try:
                # 每一级都有超时控制
                async with timeout(max_timeout_ms[level]):
                    return await service.invoke(prompt)
            except (TimeoutError, ServiceUnavailable) as e:
                logger.warning(f"Level {level} failed: {e}")
                if level == len(self.services) - 1:
                    return "服务繁忙，请稍后重试"
                continue
        return "服务繁忙，请稍后重试"
```

---
