> 本文件是 **01-ai-compute.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](01-ai-compute.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务边界与算力规划**

- 圈定 AI 计算平台要支撑的业务（推荐 / 风控 / LLM / Agent / 行业模型）。
- 评估算力需求（训练 QPS / 推理 QPS / 数据规模）。
- 决定自建 vs 采购云服务。
- 输出：**AI 计算平台规划书（CAP = Compute AI Platform Plan）**。

**Step 2：基础设施层建设**

- 采购 GPU 资源（H100 / A100 / 国产卡）。
- 部署并行文件系统（Lustre / GPFS / JuiceFS / 阿里 CPFS）。
- 部署 RDMA 高性能网络（RoCE / InfiniBand）。
- 部署 K8s 集群（自建 / 云托管 EKS / ACK / TKE）。
- 输出：**AI 基础设施**。

**Step 3：资源调度层搭建**

- 选择调度器（Volcano / KubeRay / YARN / Slurm）。
- 部署 GPU Operator（NVIDIA device plugin + MIG 插件）。
- 配置 Gang Scheduling、Queue、Fair Share。
- 接入监控（DCGM Exporter + Prometheus + Grafana）。
- 输出：**可被多团队共享的 GPU 资源池**。

**Step 4：数据 / 特征层构建**

- 部署数据湖（OSS / S3 / HDFS）。
- 部署 Feature Store（Feast / Tecton / 自研）。
- 建立样本库（Sample Store）。
- 建立特征 lineage（特征 → 模型 → 推理的全链路追踪）。
- 输出：**特征平台 + 样本库**。

**Step 5：训练框架层搭建**

- 提供 Notebook / IDE（VS Code on K8s / Jupyter on K8s / Code Server）。
- 集成分布式训练框架（PyTorch + DeepSpeed / Megatron / Ray）。
- 集成实验管理（MLflow / W&B / 自研）。
- 集成 AutoML 工具（FLAML / AutoGluon / NNI）。
- 输出：**训练环境**。

**Step 6：模型生命周期层构建**

- 部署 Model Registry（MLflow / 自研）。
- 部署 CI/CD for ML（GitOps for ML）。
- 建立模型评估流水线（离线评估 + 在线 A/B）。
- 建立模型版本管理（Staging / Production / Archived）。
- 输出：**模型管理平台**。

**Step 7：推理服务层构建**

- 选择推理框架（Triton / vLLM / TGI / TensorRT-LLM）。
- 部署推理服务网关（KServe / Seldon / 自研）。
- 部署 GPU 共享 / MIG / 池化能力。
- 部署 Serverless Inference（可选）。
- 输出：**推理服务平台**。

**Step 8：模型市场 / 消费层**

- 部署模型市场（Model Marketplace）。
- 暴露统一推理 API（OpenAI 兼容 / 自定义）。
- 建立模型卡片（Model Card）、使用说明、计费。
- 集成 LLM Gateway、Agent 平台。
- 输出：**AI 能力产品化**。

**Step 9：可观测与治理**

- 部署模型监控（数据漂移 / 概念漂移 / 推理延迟 / QPS）。
- 部署 GPU 监控（利用率 / 显存 / 温度 / 故障）。
- 部署成本监控（按团队 / 项目 / 模型计费）。
- 建立 SLA（推理 P99 延迟 < 200ms、利用率 > 70%）。
- 输出：**AI 平台可观测**。

### 4.2 关键技术点

1. **GPU 资源调度**：Volcano（Gang Scheduling + Fair Share）、KubeRay（Ray on K8s）、YARN、Slurm。**核心**：拓扑感知、Gang Scheduling、MIG 支持、抢占式调度。
2. **分布式训练**：PyTorch DDP + DeepSpeed ZeRO-3 + Megatron-LM TP/PP + Ray。**核心**：3D 并行、断点续训、Checkpoint 优化。
3. **推理优化**：vLLM（PagedAttention）+ Continuous Batching + TensorRT-LLM + Speculative Decoding + INT4/INT8 量化。**核心**：高吞吐、低延迟。
4. **Feature Store**：Feast（开源）/ Tecton（商业）/ 阿里 PAI FeatureStore。**核心**：Point-in-Time Correctness、离线 / 在线一致性、特征复用。
5. **Model Registry**：MLflow Model Registry / 自研。**核心**：模型版本 + 阶段 + 血缘 + 评估。
6. **AutoML**：FLAML（轻量首选）/ AutoGluon（多模态）/ NNI（微软）。**核心**：低成本超参搜索 + NAS。
7. **推理服务化**：Triton（多框架）+ KServe（K8s 原生）+ BentoML（打包）。**核心**：多框架支持、自动扩缩容、流量切分。
8. **LLM 推理**：vLLM（TGI + TensorRT-LLM）+ LoRA 热加载 + Continuous Batching。**核心**：高 QPS、低延迟、多模型复用 GPU。
9. **Serverless Inference**：Modal / Replicate / 阿里 PAI EAS Serverless / KServe + Knative。**核心**：冷启动优化 + 自动伸缩。
10. **模型监控**：Evidently AI / Arize / WhyLabs / 自研。**核心**：数据漂移检测 + 性能衰减告警。
11. **可观测**：DCGM Exporter（GPU 监控）+ Prometheus + Grafana + Langfuse（LLM 链路）。
12. **国产化适配**：昇腾 NPU（华为）/ 寒武纪 / 燧原 / 海光 DCU。**核心**：双栈适配（CUDA + CANN / MLU）。

### 4.3 工具链与平台（含 2024-2025 新工具）

**训练框架**：

- **PyTorch**（Meta 开源）——深度学习事实标准。
- **TensorFlow**（Google）——工业级深度学习框架。
- **JAX**（Google）——函数式深度学习框架，TPU 首选。
- **MindSpore**（华为）——国产深度学习框架，昇腾 NPU 原生。
- **PaddlePaddle**（百度）——国产深度学习框架。

**分布式训练**：

- **DeepSpeed**（微软）——ZeRO + 3D 并行 + 推理优化。
- **Megatron-LM**（NVIDIA）——张量并行 + 流水并行。
- **FSDP**（PyTorch 原生）——全分片数据并行。
- **Horovod**（Uber）——分布式训练老牌框架。
- **Ray**（Anyscale）——分布式计算统一框架，训练 + 推理 + 数据。

**AutoML**：

- **FLAML**（微软）——轻量 AutoML 库。
- **AutoGluon**（AWS）——多模态 AutoML。
- **NNI**（微软）——AutoML + NAS 平台。
- **Optuna**——超参优化首选。
- **H2O.ai**——商业 AutoML 平台。

**Feature Store**：

- **Feast**（Linux Foundation 开源）——Feature Store 事实标准开源。
- **Tecton**（商业）——企业级 Feature Store。
- **阿里 PAI FeatureStore**——阿里云原生。
- **字节 ByteFG**——字节跳动内部使用。
- **腾讯 TI FeatureStore**——腾讯云。

**Model Registry / MLOps**：

- **MLflow**（Linux Foundation）——MLOps 事实标准。
- **Weights & Biases（W&B）**——实验管理 + 模型管理 SaaS。
- **Neptune.ai**——实验管理 + 模型管理 SaaS。
- **DVC**——数据 + 模型版本管理。
- **SageMaker**（AWS）——端到端 MLOps 平台。
- **Vertex AI**（Google）——端到端 MLOps 平台。
- **Azure ML**（Microsoft）——端到端 MLOps 平台。
- **阿里 PAI**——端到端 MLOps 平台。
- **腾讯 TI-One**——端到端 MLOps 平台。
- **华为 ModelArts**——端到端 MLOps 平台。

**推理服务**：

- **TorchServe**（Meta + AWS）——PyTorch 推理服务化。
- **TensorFlow Serving**（Google）——TF 推理服务化。
- **NVIDIA Triton Inference Server**——多框架推理服务化。
- **TorchServe** + **BentoML**——Python 推理打包。
- **Seldon Core**——K8s 推理服务化。
- **KServe**（K8s 原生 Serverless Inference）。

**LLM 推理引擎（2024-2025）**：

- **vLLM**（UC Berkeley 开源）——PagedAttention + Continuous Batching，事实标准。
- **TensorRT-LLM**（NVIDIA）——NVIDIA GPU 推理优化。
- **TGI**（Hugging Face）——Transformer 生成推理。
- **SGLang**（UC Berkeley）——结构化生成 + RadixAttention。
- **LMDeploy**（上海人工智能实验室）——国产 LLM 推理引擎。
- **DeepSpeed-MII**（微软）——LLM 推理优化。
- **MLC LLM**——端侧 LLM 推理。

**模型市场**：

- **Hugging Face Hub**——模型 + 数据集 + Spaces 事实标准。
- **Replicate**——云端模型 API 市场。
- **Civitai**——AI 模型（图像）社区市场。
- **ModelScope**（阿里）——国产模型市场。
- **PAI 模型市场**（阿里云）——商业模型市场。
- **AWS SageMaker JumpStart**——预训练模型市场。

**GPU 算力池化**：

- **CoreWeave**（美国，2024 年估值 190 亿美元）——GPU 云。
- **Lambda Labs**——GPU 云 + 集群。
- **RunPod**——Serverless GPU。
- **Modal**——Serverless AI。
- **Replicate**——Serverless 模型推理。
- **阿里云灵骏**——GPU 池化。
- **腾讯云星脉**——GPU 池化。
- **火山引擎机器学习平台**——字节 GPU 池化。

**AI 计算国产化（2024-2025 重点）**：

- **华为昇腾 910C / 昇腾 910B**——国产 AI 芯片主力。
- **寒武纪思元 590**——国产 AI 芯片。
- **燧原 S60 / S70**——国产 AI 芯片。
- **海光 DCU**——兼容 CUDA 生态。
- **摩尔线程 MTT S4000**——国产 GPU。
- **壁仞 BR104**——国产 GPU。

**AI 计算监控**：

- **Prometheus + DCGM Exporter**——GPU 监控事实标准。
- **Grafana**——可视化。
- **Langfuse**（开源，2024）——LLM 链路追踪。
- **Helicone**（2024）——LLM 可观测 SaaS。
- **Arize Phoenix**（2024）——LLM 评估 + 可观测。
- **Evidently AI**——ML 监控 + 漂移检测。

### 4.4 代码 / 示例

**示例 1：基于 vLLM 部署 LLM 推理服务（生产级）**

```python
from vllm import LLM, SamplingParams
from vllm.entrypoints.openai.api_server import serve_http

# 配置 LLM 引擎
llm = LLM(
    model="Qwen/Qwen2.5-72B-Instruct",
    tensor_parallel_size=4,  # 4 卡张量并行
    gpu_memory_utilization=0.9,
    max_model_len=32768,
    enforce_eager=False,
    quantization="awq",  # AWQ INT4 量化
    dtype="float16",
)

# 配置采样参数
sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.8,
    max_tokens=2048,
)

# 启动 OpenAI 兼容 HTTP 服务
serve_http(
    llm,
    host="0.0.0.0",
    port=8000,
    log_level="info",
    served_model_name="qwen-72b",
)
```

**示例 2：基于 PyTorch + DeepSpeed 训练大模型**

```python
# deepspeed_config.json
{
  "train_batch_size": 1024,
  "gradient_accumulation_steps": 16,
  "fp16": {"enabled": true},
  "bf16": {"enabled": false},
  "zero_optimization": {
    "stage": 3,
    "offload_optimizer": {"device": "cpu"},
    "offload_param": {"device": "cpu"}
  },
  "optimizer": {
    "type": "AdamW",
    "params": {"lr": 1e-4, "betas": [0.9, 0.95]}
  }
}

# train.py
import deepspeed
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.1-8B")
model_engine, optimizer, _, scheduler = deepspeed.initialize(
    args=args,
    model=model,
    model_parameters=model.parameters(),
    config="deepspeed_config.json",
)

for step, batch in enumerate(dataloader):
    outputs = model_engine(**batch)
    loss = outputs.loss
    model_engine.backward(loss)
    model_engine.step()
```

**示例 3：基于 Feast 的特征平台（离线 + 在线一致性）**

```python
# feature_store.yaml
project: customer_features
registry: data/registry.db
provider: local
online_store:
  type: redis
  connection_string: localhost:6379
offline_store:
  type: file

# features.py
from feast import Entity, Feature, FeatureView, FileSource, ValueType

customer = Entity(name="customer_id", value_type=ValueType.INT64)

customer_stats_source = FileSource(
    path="data/customer_stats.parquet",
    event_timestamp_column="event_timestamp",
)

customer_stats_fv = FeatureView(
    name="customer_stats",
    entities=[customer],
    ttl=timedelta(days=7),
    features=[
        Feature(name="total_orders_30d", dtype=ValueType.INT64),
        Feature(name="total_spend_30d", dtype=ValueType.FLOAT),
        Feature(name="churn_probability", dtype=ValueType.FLOAT),
    ],
    online=True,
    source=customer_stats_source,
)

# 离线获取训练特征（Point-in-Time Correct）
train_df = store.get_historical_features(
    entity_df=entity_df,
    features=[
        "customer_stats:total_orders_30d",
        "customer_stats:total_spend_30d",
        "customer_stats:churn_probability",
    ],
).to_df()

# 在线获取推理特征
online_features = store.get_online_features(
    features=[
        "customer_stats:total_orders_30d",
        "customer_stats:total_spend_30d",
    ],
    entity_rows=[{"customer_id": 12345}],
).to_dict()
```

**示例 4：基于 KubeRay 的 GPU 集群调度（YAML）**

```yaml
apiVersion: ray.io/v1alpha1
kind: RayCluster
metadata:
  name: training-cluster
spec:
  rayVersion: '2.30.0'
  headGroupSpec:
    rayStartParams:
      dashboard-host: '0.0.0.0'
    template:
      spec:
        containers:
        - name: ray-head
          image: rayproject/ray-ml:2.30.0-py311-gpu
          resources:
            limits:
              cpu: "8"
              memory: "32Gi"
              nvidia.com/gpu: "1"
  workerGroupSpecs:
  - groupName: gpu-workers
    replicas: 8
    minReplicas: 2
    maxReplicas: 16
    rayStartParams: {}
    template:
      spec:
        containers:
        - name: ray-worker
          image: rayproject/ray-ml:2.30.0-py311-gpu
          resources:
            limits:
              cpu: "32"
              memory: "128Gi"
              nvidia.com/gpu: "8"
---
apiVersion: ray.io/v1alpha1
kind: RayJob
metadata:
  name: llama3-finetune
spec:
  clusterSelector:
    ray.io/cluster-name: training-cluster
  submitter:
    jobCommand: "python train.py --model meta-llama/Llama-3.1-8B --epochs 3"
  runtimeEnv: |
    pip:
      - torch==2.4.0
      - transformers==4.45.0
      - peft==0.13.0
```

**示例 5：基于 Triton 的多模型推理服务**

```python
# config.pbtxt (Triton 模型配置)
name: "ensemble_model"
platform: "ensemble"
input [
  {
    name: "INPUT0"
    data_type: TYPE_FP32
    dims: [128]
  }
]
output [
  {
    name: "OUTPUT0"
    data_type: TYPE_FP32
    dims: [10]
  }
]
ensemble_scheduling {
  step [
    {
      model_name: "feature_extractor"
      model_version: -1
      input_map: {
        key: "INPUT0"
        value: "input"
      }
      output_map: {
        key: "feature"
        value: "FEATURE_OUT"
      }
    },
    {
      model_name: "classifier"
      model_version: -1
      input_map: {
        key: "FEATURE_OUT"
        value: "input"
      }
      output_map: {
        key: "probs"
        value: "OUTPUT0"
      }
    }
  ]
}
```

---
