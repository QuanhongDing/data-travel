> 本文件是 **04-capacity-planning.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](04-capacity-planning.md)。

## 4. 工程实现

### 4.1 落地步骤

#### 阶段 1：数据采集（1-2 个月）

1. **指标采集**：QPS、CPU、内存、存储、网络、GPU 利用率。
2. **业务指标**：DAU、订单量、GMV、模型推理 QPS。
3. **历史数据**：至少 1 年的历史数据。

#### 阶段 2：预测建模（2-3 个月）

1. **基线预测**：用 Prophet 预测基线流量。
2. **业务叠加**：把业务增长、营销活动叠加到基线。
3. **峰值预测**：用历史大促数据预测峰值。
4. **GPU 预测**：按推理 QPS × Token 数 / GPU 吞吐计算。

#### 阶段 3：资源评估（1 个月）

1. **应用层资源**：Pod 数、实例类型。
2. **数据层资源**：存储量、IOPS、带宽。
3. **基础设施资源**：CPU、内存、网络、GPU。
4. **AI 层资源**：GPU、推理服务、向量库。

#### 阶段 4：采购与调度（持续）

1. **预留实例**：基线资源（70-80%）。
2. **弹性扩容**：峰值资源（20-30%）。
3. **Spot Instance**：可中断任务。
4. **跨云调度**：利用价格差异。

#### 阶段 5：持续优化（持续）

1. **预测准确性评估**：预测 vs 实际。
2. **资源利用率优化**：调高 / 调低资源。
3. **AI 辅助决策**：自动推荐优化方案。

### 4.2 关键技术点

#### 1. Prophet 时间序列预测

```python
from prophet import Prophet
import pandas as pd

# 加载历史数据
df = pd.read_csv("history.csv")  # ds, y

# 创建模型
model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=True,
    holidays=holidays_df  # 自定义节假日（双11、618）
)

# 训练
model.fit(df)

# 预测未来 12 个月
future = model.make_future_dataframe(periods=365)
forecast = model.predict(future)

# 提取预测值
predicted_qps = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
```

#### 2. Kubernetes HPA + KEDA

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

#### 3. 业务叠加预测

```python
# 基线流量 + 业务增量
baseline_qps = 50000  # 历史均值
business_growth = 1.3  # 业务增长 30%
promotion_boost = 2.0  # 大促提升 100%

# 峰值流量预测
predicted_peak_qps = baseline_qps * business_growth * promotion_boost
# = 130,000 QPS

# 资源需求
single_pod_capacity = 5000  # 单 Pod 承载
safe_margin = 1.3  # 30% 安全冗余

required_pods = predicted_peak_qps / single_pod_capacity * safe_margin
# = 33.8 ≈ 34 个 Pod
```

#### 4. GPU 资源规划

```python
# LLM 推理 GPU 需求估算
def estimate_gpu_count(
    inference_qps: int,
    avg_tokens_per_request: int,
    gpu_throughput: int,  # tokens/second
    gpu_utilization: float = 0.7,
    safety_margin: float = 1.3
) -> int:
    """
    例：100 QPS × 500 tokens/req / (5000 tokens/sec × 0.7) × 1.3 ≈ 19 个 GPU
    """
    required_capacity = inference_qps * avg_tokens_per_request
    single_gpu_capacity = gpu_throughput * gpu_utilization
    base_count = required_capacity / single_gpu_capacity
    return int(base_count * safety_margin) + 1

# 用 GPT-4 类似的吞吐（5000 tokens/sec）估算
gpu_count = estimate_gpu_count(
    inference_qps=100,
    avg_tokens_per_request=500,
    gpu_throughput=5000
)
```

### 4.3 工具链与平台（含 2024-2025 新工具）

#### 时间序列预测

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **Prophet** | Facebook（开源） | 业务型时间序列，易用 |
| **ARIMA** | 经典方法 | 解释性好，需要平稳序列 |
| **LSTM** | 深度学习 | 非线性，需要大量数据 |
| **Transformer** | 深度学习 | 长上下文，效果最好 |
| **AutoML** | 各大云厂商 | 自动选择最佳模型 |
| **Amazon Forecast** | AWS | 云厂商托管预测服务 |
| **阿里云 PAI** | 阿里云 | 阿里云机器学习平台 |

#### Kubernetes 弹性扩容

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **Kubernetes HPA/VPA/CA** | CNCF | 编排层标准方案 |
| **KEDA** | CNCF | 事件驱动弹性 |
| **Cluster Autoscaler** | CNCF | 节点级扩容 |
| **阿里云 ESS** | 阿里云 | 云厂商弹性伸缩 |
| **AWS Auto Scaling** | AWS | 云厂商弹性伸缩 |
| **Spotinst / Ocean** | Spot.io | Spot Instance 编排 |

#### GPU 资源管理

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **NVIDIA GPU Operator** | NVIDIA | K8s GPU 管理 |
| **阿里云 cGPU** | 阿里云 | GPU 共享 |
| **阿里云灵骏** | 阿里云 | AI 集群 |
| **AWS Inferentia** | AWS | 推理优化芯片 |
| **TPU** | Google | Google AI 芯片 |
| **vGPU** | NVIDIA | 虚拟 GPU |
| **MIG** | NVIDIA | Multi-Instance GPU（A100） |

#### 成本优化

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **Kubecost** | Kubecost（开源） | K8s 成本监控 |
| **Spot.io** | Spot.io | Spot Instance 编排 |
| **CAST.ai** | CAST.ai | 自动 K8s 成本优化 |
| **AWS Cost Explorer** | AWS | 云成本分析 |
| **阿里云成本中心** | 阿里云 | 云成本分析 |

### 4.4 代码 / 示例

#### Prophet + 业务叠加 + 资源评估 完整示例

```python
import pandas as pd
from prophet import Prophet

# 1. 历史数据加载
df = pd.read_csv("history.csv")  # 列：ds, y

# 2. 自定义节假日（双11、618、双12）
holidays = pd.DataFrame({
    'holiday': ['double11', 'double618', 'double12'],
    'ds': pd.to_datetime([
        '2022-11-11', '2022-06-18', '2022-12-12',
        '2023-11-11', '2023-06-18', '2023-12-12',
        '2024-11-11', '2024-06-18', '2024-12-12',
    ]),
    'lower_window': 0,
    'upper_window': 1,
})

# 3. Prophet 模型
model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False,
    holidays=holidays,
    changepoint_prior_scale=0.05,
)

model.fit(df)

# 4. 预测未来 12 个月
future = model.make_future_dataframe(periods=365)
forecast = model.predict(future)

# 5. 提取峰值（11月）
november_forecast = forecast[forecast['ds'].dt.month == 11]
peak_qps = november_forecast['yhat_upper'].max()

# 6. 资源评估
single_pod_capacity = 5000  # QPS
safe_margin = 1.3

required_pods = int(peak_qps / single_pod_capacity * safe_margin)

# 7. 资源采购建议
print(f"预测峰值 QPS：{peak_qps:.0f}")
print(f"建议 Pod 数：{required_pods}")
print(f"预留实例：{int(required_pods * 0.7)} 台（基线）")
print(f"弹性扩容：{int(required_pods * 0.3)} 台（峰值）")
```

#### GPU 资源池化（多租户共享）

```yaml
# NVIDIA GPU Operator + MIG（A100 多实例 GPU）
apiVersion: v1
kind: ConfigMap
metadata:
  name: mig-config
data:
  config.yaml: |
    version: v1
    mig-config: |
      - device-filter: ["nvidia.com/A100"]
        mig-devices:
          "0":
            - "1g.5gb"
            - "1g.5gb"
            - "1g.5gb"
            - "2g.10gb"
            - "3g.20gb"
---
# 多个 Pod 共享一个 A100
apiVersion: v1
kind: Pod
metadata:
  name: inference-pod-1
spec:
  containers:
  - name: inference
    image: inference-service:latest
    resources:
      limits:
        nvidia.com/mig-1g.5gb: 1
```

---
