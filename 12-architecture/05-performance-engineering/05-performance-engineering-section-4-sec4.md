> 本文件是 **05-performance-engineering.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](05-performance-engineering.md)。

## 4. 工程实现

### 4.1 落地步骤

#### 阶段 1：性能基线（1 个月）

1. **建立性能基线**：当前 QPS / P99 / 资源利用率。
2. **建立监控**：APM + Trace + Metrics。
3. **定义 SLO**：可用性 99.95%、P99 < 500ms。

#### 阶段 2：瓶颈识别（1-2 个月）

1. **链路追踪**：识别慢调用。
2. **火焰图**：识别 CPU 热点。
3. **慢查询分析**：识别慢 SQL。
4. **资源分析**：CPU / 内存 / IO / 网络。

#### 阶段 3：分层优化（2-3 个月）

1. **前端优化**：CDN、资源合并、懒加载。
2. **网络优化**：HTTP/2、TLS 1.3、gRPC。
3. **应用优化**：JVM 调优、缓存、异步化。
4. **数据库优化**：索引、SQL、读写分离、分库分表。
5. **AI 推理优化**：量化、vLLM、KV Cache。

#### 阶段 4：压测验证（持续）

1. **单链路压测**：JMeter、k6。
2. **全链路压测**：PTS、AHAS。
3. **优化前后对比**：验证优化效果。

#### 阶段 5：持续监控（持续）

1. **性能 Dashboard**：实时监控 P99 / QPS / 资源利用率。
2. **性能告警**：性能回归自动告警。
3. **定期 Review**：月度性能 Review。

### 4.2 关键技术点

#### 1. 链路追踪（OpenTelemetry）

```python
# OpenTelemetry 自动追踪
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# 设置 Tracer
provider = TracerProvider()
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="jaeger:4317"))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)

# 自动追踪 HTTP 请求
@tracer.start_as_current_span("process_order")
def process_order(order_id):
    # 自动追踪数据库、Redis、外部 API 调用
    order = db.query(order_id)
    payment = payment_api.charge(order)
    return {"order": order, "payment": payment}
```

#### 2. JVM 调优（G1 GC）

```bash
# G1 GC 调优参数
java -Xms4g -Xmx4g \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -XX:G1HeapRegionSize=16m \
     -XX:+G1UseAdaptiveIHOP \
     -XX:InitiatingHeapOccupancyPercent=45 \
     -jar app.jar
```

#### 3. SQL 优化（执行计划）

```sql
-- 慢查询优化前：全表扫描
EXPLAIN SELECT * FROM orders WHERE user_id = 12345;
-- type: ALL, rows: 1000000

-- 添加索引
CREATE INDEX idx_user_id ON orders(user_id);

-- 优化后：索引扫描
EXPLAIN SELECT * FROM orders WHERE user_id = 12345;
-- type: ref, rows: 10
```

#### 4. AI 推理优化（vLLM）

```python
# vLLM 高性能推理
from vllm import LLM, SamplingParams

# 加载模型（自动优化）
llm = LLM(
    model="meta-llama/Llama-2-70b-hf",
    tensor_parallel_size=4,  # 4 GPU 并行
    gpu_memory_utilization=0.9,  # 使用 90% GPU 显存
    quantization="awq",  # 量化
    enforce_eager=False,  # 使用 CUDA Graph
)

# 连续批处理推理
prompts = ["Prompt 1", "Prompt 2", ..., "Prompt 1000"]
sampling_params = SamplingParams(temperature=0.7, max_tokens=100)

# 自动连续批处理（vLLM 核心优化）
outputs = llm.generate(prompts, sampling_params)
```

#### 5. HTTP/3 + QUIC

```nginx
# Nginx HTTP/3 配置
server {
    listen 443 quic reuseport;
    listen 443 ssl http2;
    add_header Alt-Svc 'h3=":443"; ma=86400';
    ssl_protocols TLSv1.3;
    
    # 0-RTT
    ssl_early_data on;
}
```

### 4.3 工具链与平台（含 2024-2025 新工具）

| 类别 | 工具 | 特点 |
| --- | --- | --- |
| **APM** | Datadog、New Relic、阿里云 ARMS、腾讯 CAT | 应用性能监控 |
| **Trace** | Jaeger、Zipkin、SkyWalking、OpenTelemetry | 链路追踪 |
| **Profile** | perf、async-profiler、FlameGraph、bpf | CPU 性能分析 |
| **压测** | k6、JMeter、Locust、Gatling | 压测工具 |
| **JVM 调优** | async-profiler、JFR、VisualVM | JVM 工具 |
| **数据库优化** | EXPLAIN、pt-query-digest、慢查询日志 | SQL 优化 |
| **AI 推理优化** | vLLM、TensorRT-LLM、ONNX Runtime | LLM 推理优化 |
| **HTTP 协议** | HTTP/3、QUIC、gRPC | 高性能网络 |

### 4.4 代码 / 示例

#### Spring Boot + Micrometer 性能监控

```java
// Micrometer 性能监控
@RestController
public class OrderController {
    
    private final MeterRegistry registry;
    private final Counter orderCounter;
    private final Timer orderTimer;
    
    public OrderController(MeterRegistry registry) {
        this.registry = registry;
        this.orderCounter = registry.counter("orders.created");
        this.orderTimer = registry.timer("orders.latency");
    }
    
    @PostMapping("/orders")
    public Order createOrder(@RequestBody OrderRequest req) {
        return orderTimer.record(() -> {
            Order order = orderService.create(req);
            orderCounter.increment();
            return order;
        });
    }
}
```

#### AI 推理服务优化（量化 + 连续批处理）

```python
# 完整的 AI 推理优化 Pipeline
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from awq import AutoAWQForCausalLM

# 1. 加载模型（量化）
model_path = "meta-llama/Llama-2-13b-hf"
quant_path = "Llama-2-13b-awq"

# 量化（INT4，模型缩小 4 倍）
model = AutoAWQForCausalLM.from_pretrained(model_path)
quant_config = {"zero_point": True, "q_group_size": 128}
model.quantize(tokenizer, quant_config=quant_config)
model.save_quantized(quant_path)

# 2. 加载量化模型
model = AutoAWQForCausalLM.from_quantized(quant_path)
tokenizer = AutoTokenizer.from_pretrained(quant_path)

# 3. 推理（连续批处理）
def batch_generate(prompts, batch_size=32):
    outputs = []
    for i in range(0, len(prompts), batch_size):
        batch = prompts[i:i+batch_size]
        inputs = tokenizer(batch, return_tensors="pt", padding=True).to("cuda")
        result = model.generate(
            **inputs,
            max_new_tokens=100,
            do_sample=True,
            temperature=0.7,
        )
        outputs.extend(tokenizer.batch_decode(result, skip_special_tokens=True))
    return outputs
```

---
