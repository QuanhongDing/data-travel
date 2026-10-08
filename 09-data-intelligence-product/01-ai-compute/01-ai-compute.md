# AI 计算平台（AI Compute Platform）

> **一句话定位**：把分散的 GPU / 算力 / 数据 / 模型 / 框架封装成「业务可一键消费」的产品化能力——从训练到推理、从特征到模型市场、从 AutoML 到 Serverless Inference。

> 本文是 data-travel 项目 [Ch9 · 数据智能产品](../../README.md) 的子章节（**01 AI 计算平台**）。覆盖 **R5 数据智能类产品认知** 能力领域中「**AI 计算平台 / MLOps / 特征平台 / 模型市场 / Serverless Inference**」相关的工程化、产品化与 AI 时代前沿。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| AI 计算平台是什么？与传统数据平台、PAAS 的区别是什么？ | §1 |
| 训练 / 推理 / 特征 / 模型市场四大子系统的核心原理 | §2 |
| 如何选型 AutoML、MLOps、Feature Store、模型服务的模式？ | §3 |
| AI 计算平台从 0 到 1 的工程落地步骤 | §4 |
| 2024-2025 大模型时代，AI 计算平台如何演进？ | §5 |
| 头部企业的真实案例与踩坑经验 | §6 |
| AI 计算平台 vs 数据中台 / Lakehouse / iPaaS 怎么选？ | §7 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：AI 计算平台（AI Compute Platform / MLOps Platform）是企业级「**AI 工程化基础设施**」，把模型从「数据科学家笔记本里的 .pkl 文件」变成「业务系统可调用的稳定服务」。它是云计算时代的中间层：底层是 IaaS（裸金属 / 虚拟机 / 容器），上层是业务应用（推荐 / 风控 / 智能问答 / Agent），平台层负责把「算力 + 数据 + 框架 + 模型 + 流程」打包成产品。

**工程定义**：AI 计算平台在数据架构师手里，是一份由 **6 层 + 12 子系统** 组成的能力矩阵：

- **L1 基础设施层**：GPU 池（NVIDIA H100 / A100 / 国产卡）、CPU 池、RDMA 网络、存储（并行文件系统 + 对象存储）。
- **L2 资源调度层**：Kubernetes / KubeRay / Volcano / YARN / Slurm。
- **L3 训练框架层**：PyTorch / TensorFlow / JAX + DeepSpeed / Megatron / FSDP + Ray / Horovod。
- **L4 数据 / 特征层**：数据湖 + Feature Store（Feast / Tecton / 阿里特征平台）+ 样本库（Sample Store）。
- **L5 模型生命周期层**：AutoML（FLAML / AutoGluon / NNI）、训练任务管理（Experiment Tracking + Workflow）、模型注册（Model Registry）。
- **L6 服务 / 消费层**：推理服务（TorchServe / Triton / vLLM / KServe）、Serverless Inference、模型市场（Model Marketplace）、LLM Gateway。

**解决的核心问题**：

1. **GPU 算力碎片化**：N 团队重复采购、资源闲置率 70%+，缺统一调度。
2. **数据科学家到生产的最后一公里**：训练好的模型 80% 沉在笔记本里，无法上线。
3. **特征 / 模型复用难**：同一特征被 5 个团队各算一遍，结果还不一致。
4. **模型版本失控**：没有模型注册表，不知道线上跑的是哪个版本。
5. **推理成本失控**：GPU 推理贵但无治理，QPS 与成本没人能讲清。
6. **LLM 时代的算力博弈**：千亿模型训练一次 1000 万 USD，单卡推理成本仍高企。

**与传统数据平台的边界**：

| 维度 | 传统数据平台（数仓 / Lakehouse） | AI 计算平台 |
| --- | --- | --- |
| 核心负载 | SQL 聚合、ETL、Ad-hoc 查询 | 训练、推理、特征工程、模型服务 |
| 数据形态 | 结构化为主 | 结构化 + 非结构化（图 / 文 / 音 / 视频） |
| 算力 | CPU 为主 | GPU / TPU / NPU 为主 |
| 用户 | 数据分析师 / 数据工程师 | 数据科学家 / 算法工程师 / 业务开发 |
| 交付物 | 指标 / 报表 / API | 模型 / 预测 / 推理服务 |
| 性能指标 | 查询时延、吞吐 | 训练时长、推理 QPS、模型 AUC / F1 |
| 治理对象 | 表 / 字段 / 指标 | 特征 / 模型 / 实验 / 推理服务 |

### 1.2 为什么需要

**业务驱动力**：

- **AI 应用规模化**：从单点推荐到 Agent 时代，AI 模型需求从「5 个团队 10 个模型」变成「100 个团队 10000 个模型」。
- **大模型算力稀缺**：H100 单卡 3-4 万 USD，千亿模型训练 1000+ 卡起步，必须池化共享。
- **推理成本压力**：单条 LLM 调用 $0.01，QPS 1 万就是月百万 USD，必须有推理优化（量化 / 蒸馏 / 缓存）。
- **合规与可解释**：金融 / 医疗 / 政企要求模型可追溯、可审计、可解释，需要模型注册 + 推理血缘。
- **MLOps 成为事实标准**：Google、Microsoft、AWS、阿里、字节都在做 MLOps 平台。

**痛点**：

1. **「AI 烟囱」**：每个团队一套训练 / 部署工具，复用率为 0。
2. **「训练-上线鸿沟」**：训练用 PyTorch，部署用 C++，转换成本高。
3. **「特征不一致」**：离线训练用特征 A，线上推理用特征 B，效果断崖。
4. **「GPU 黑盒」**：算力被谁用了、用多久、为什么贵，没人能讲清。
5. **「模型版本失控」**：线上 5 个版本的模型在跑，谁都不敢下掉。
6. **「LLM 推理贵」**：单次调用 $0.01，业务用不起。

**AI 时代的新诉求**：

- **LLM 训练 / 微调**：千亿参数起步，必须支持分布式训练（数据并行 / 张量并行 / 流水并行）+ 显存优化（ZeRO / FSDP / 量化感知训练）。
- **LLM 推理服务**：高 QPS + 低延迟 + 低成本 → vLLM / TensorRT-LLM / TGI / SGLang 等专用推理引擎。
- **LLM 算力调度**：GPU 共享（Multi-Instance GPU MIG）/ 池化 / Serverless。
- **LLM 评估体系**：A/B / 排行榜 / 人类反馈 / 业务指标。
- **LLM Agent 平台化**：把 LLM + 工具 + 记忆 + 规划做成可产品化平台。

### 1.3 在 AI 时代数据架构中的位置

```
                [业务应用层]
                  ↑
        ┌─────────┼─────────┐
        ↓         ↓         ↓
    智能 BI     智能 Agent   智能决策
        │         │         │
        └─────────┼─────────┘
                  ↓
           ┌──────┴──────┐
           ↓             ↓
     [AI 计算平台]   [数据智能产品]
   (训练/推理/特征) (标签/BI/精细化)
           │             │
           └──────┬──────┘
                  ↓
        [数据基础设施层]
   (数仓 / Lakehouse / 向量 / 图谱)
                  ↓
        [云原生 / GPU 池 / 网络 / 存储]
```

- **AI 计算平台** 与 **数据智能产品** 是姐妹：前者偏「让 AI 能力被构建」，后者偏「让 AI 能力被消费」。
- **AI 计算平台** 与 **数据基础设施** 是上下游：AI 平台消费数仓 / Lakehouse 的特征数据。
- **AI 计算平台** 与 **AI 智能体平台** 是子集关系：AI 计算平台包含模型训练 / 推理 / 部署；AI 智能体平台在其上构建 LLM + 工具 + 记忆 + 规划。

**在企业级 AI 工程体系中的角色**：

- **对数据科学家**：是「训练 + 实验管理 + 协作」的一站式环境。
- **对算法工程师**：是「分布式训练 + 推理优化 + 部署上线」的生产线。
- **对业务开发**：是「模型 + 推理 API + 监控 + 成本」的可控消费方。
- **对架构师**：是「AI 算力 + 模型 + 服务的治理中心」。

**一句话判断**：**会写 PyTorch 是 P6，会搭训练流水线是 P7，会建 AI 计算平台是 P8，会把 AI 计算产品化是 P9——AI 时代，平台化是硬分水岭。**

### 1.4 演进历程

**传统阶段（2010-2015）**：

- 2010：AWS 推出 EC2 GPU 实例，算法工程师开始上云。
- 2012：AlexNet 引爆深度学习，GPU 需求暴涨。
- 2014：TensorFlow 1.0 发布（Google），成为事实标准。
- 2015：Kubernetes 1.0 发布，AI 平台开始容器化。

**云原生阶段（2016-2020）**：

- 2016：Databricks MLflow 开源，MLOps 概念诞生。
- 2017：Google TPU 2.0、AWS SageMaker 发布，云厂商深度学习服务起势。
- 2018：Uber Michelangelo、Facebook FBLearner Flow 大规模公开，AI 平台内部化。
- 2019：阿里 PAI、腾讯 TI-One、华为 ModelArts 上线，国内云厂商入场。
- 2020：Kubeflow 1.0、Ray 1.0 成熟，KubeRay 成为 GPU 调度标配。

**大模型阶段（2021+，LLM 驱动）**：

- 2021-2022：Megatron-Turing NLG（530B）、PaLM（540B）等千亿模型出现，分布式训练成为必须。
- 2023：ChatGPT 引爆，LLM 推理服务规模化（vLLM、TGI、TensorRT-LLM 成熟）。
- 2024：Llama 3、Qwen 2.5、Claude 3.5、Gemini 1.5 等开源 + 闭源大模型爆发，AI 计算平台从「传统 ML 平台」演化为「LLM 训练 + 推理 + 微调 + Agent 一体化平台」。
- 2024-2025：Serverless Inference（MosaicML、Replicate、Modal）、GPU 池化（CoreWeave、Lambda）、AI 计算「水电煤气化」加速。
- 2025：NVIDIA Blackwell B200 / GB200 发布，单机 8 卡 → 机柜级 NVL72 域互联；国产卡（华为昇腾 910C、寒武纪、燧原）进入规模化部署。

**一句话总结**：**AI 计算平台从「GPU 资源池」→「MLOps 工程平台」→「LLM + Serverless + 国产化适配」三阶段演进，今天是「AI 水电煤气」基础设施化的关键节点。**

---

## 2. 核心原理

### 2.1 关键概念定义

- **GPU 资源池（GPU Pool）**：将物理 GPU 通过虚拟化（MIG / vGPU）/ 池化（GPU Sharing）形成可被多个任务共享的资源池。**目标**：把 GPU 利用率从 30% 提升到 70%+。
- **分布式训练（Distributed Training）**：把训练任务拆分到多卡 / 多机维度上。**数据并行（DDP）**：每卡一份模型副本，分发不同 batch；**张量并行（TP）**：把单层参数切到多卡；**流水并行（PP）**：把模型分层切到多卡；**3D 并行 + ZeRO / FSDP**：超大规模模型训练的事实标准。
- **混合精度训练（Mixed Precision Training）**：FP32 + FP16 + BF16 混合，节省显存 + 加速计算。代表：NVIDIA Apex、DeepSpeed。
- **梯度累积（Gradient Accumulation）**：小 batch 模拟大 batch，节省显存。
- **检查点（Checkpoint）**：训练过程中的模型 / 优化器状态快照。**断点续训**、**故障恢复**的基础。
- **实验管理（Experiment Tracking / Tracking）**：记录每次训练的参数、指标、产物，便于对比与复现。代表：MLflow、W&B、TensorBoard。
- **模型注册表（Model Registry）**：模型版本管理 + 阶段（Staging / Production / Archived）+ 元数据（训练数据 / 评估指标 / Owner）。
- **特征平台 / Feature Store（Feature Store）**：把特征作为「一等公民」统一管理，统一离线 / 在线一致性。代表：Feast、Tecton、阿里特征平台（PAI FeatureStore）、字节 ByteFG。
- **样本库（Sample Store）**：管理训练样本的数据湖，支持版本管理、特征对齐、样本拼接。代表：PAI SampleStore、Tecton。
- **AutoML / AutoML 平台**：自动特征工程、自动模型选择、自动超参调优。代表：FLAML、AutoGluon、NNI、H2O、阿里 PAI AutoML。
- **推理服务（Inference Serving）**：把训练好的模型封装为可调用的 API。代表：TorchServe、Triton Inference Server、TF Serving、BentoML、Seldon Core。
- **Serverless Inference**：按需启动、弹性伸缩、按调用计费。代表：AWS Lambda + SageMaker、Modal、Replicate、阿里 PAI EAS Serverless。
- **LLM 推理引擎（LLM Inference Engine）**：针对 Transformer 解码（Decode）优化的高吞吐推理框架。代表：vLLM（PagedAttention）、TensorRT-LLM、TGI、SGLang、LMDeploy。
- **量化（Quantization）**：把 FP32 / FP16 模型量化到 INT8 / INT4 / FP8，减少显存 + 加速推理。代表：GPTQ、AWQ、BitsAndBytes、TensorRT-LLM。
- **KV Cache（键值缓存）**：Transformer 解码阶段缓存历史 token 的 K/V，避免重复计算。vLLM 的 PagedAttention 把 KV Cache 分页管理，提升利用率。
- **Speculative Decoding（投机解码）**：用小模型 draft，大模型 verify，加速 2-4 倍。
- **持续训练（Continual Training）**：模型上线后持续用新数据微调，避免「模型老化」。
- **A/B 实验（Online Experiment）**：新模型与旧模型同时在线分流，对比业务指标。
- **影子模式（Shadow Mode）**：新模型在生产流量下「只算不用」，积累离线评估数据。
- **模型市场（Model Marketplace）**：把预训练模型 / 行业模型 / 自研模型作为商品上架、下架、计费、共享。代表：Hugging Face Hub、Replicate、Civitai、阿里 PAI 模型市场。
- **AI 算力调度（AI Compute Scheduling）**：GPU 任务的调度与抢占。代表：Volcano（K8s 增强）、KubeRay（Ray on K8s）、YARN（大数据混部）。
- **MLOps**：Machine Learning Operations，覆盖从数据 → 训练 → 部署 → 监控的全链路工程实践。
- **LLMOps**：LLM 时代的 MLOps，关注预训练、微调、对齐、推理、评估、Agent 工程化。
- **AI 算力即服务（AI Compute as a Service）**：把 GPU / 训练 / 推理作为「水电煤气」按需消费。代表：CoreWeave、Lambda Labs、RunPod、阿里云灵骏、腾讯云星脉、火山引擎机器学习平台。

### 2.2 数学 / 形式化基础

AI 计算平台的「核心数学」在不同子系统各异：

**分布式训练的数学**：

- **数据并行（DDP）**：每卡独立算梯度 → AllReduce 同步梯度 → 各自更新参数。**通信开销**：N 卡同步，AllReduce 通信量是 `2 * (N-1) / N * S`（S 是参数量），近似 O(S)。
- **张量并行（TP）**：把矩阵乘法切到多卡，例 Y = XA → A 切分为 [A1, A2]，分别在卡 1、卡 2 算 → AllReduce 汇总。**通信模式**：Split → Compute → AllGather / ReduceScatter。
- **流水并行（PP）**：把模型切分为多个 stage，每 stage 放一卡（或多卡），前向 / 反向像流水线。**气泡（bubble）**：流水线空载时间，与 micro-batch 数相关。
- **ZeRO（Zero Redundancy Optimizer）**：把优化器状态、梯度、参数分片到多卡，节省显存 3-4 倍。代表：DeepSpeed ZeRO-1/2/3。
- **FSDP（Fully Sharded Data Parallel）**：PyTorch 原生的全分片数据并行，等价于 ZeRO-3。

数学上，分布式训练的核心是 **梯度同步 + 通信拓扑** 的最优化：最小化通信量、最大化 GPU 利用率、最小化同步开销。

**混合精度训练的数学**：

- 主权重 FP32，前向 / 反向 FP16，Loss Scaling 避免梯度下溢。
- 数学保证：FP16 算术在数值范围 `±65504` 内，FP32 主权重保留精度。

**推理优化的数学**：

- **量化**：把 FP32 张量映射到 INT8：`x_q = round(x / scale) + zero_point`，反量化 `x = (x_q - zero_point) * scale`。误差分析：量化噪声 ≈ `|scale| / 2`。
- **KV Cache 内存**：每个 token 的 KV 占 `2 * num_layers * num_heads * head_dim * dtype_size`，例如 7B 模型、FP16、单 token 约 0.5 MB。一个 32k 上下文序列约 16 GB。
- **vLLM PagedAttention**：把 KV Cache 分页（page），类比 OS 虚拟内存，提升显存利用率 2-4 倍。

**特征平台的数学**：

- **Point-in-Time Correctness**：特征查询必须返回「事件发生时刻」的取值，避免未来信息泄漏（Feature Leakage）。
- **离线 / 在线一致性**：离线特征（batch）与在线特征（stream）必须算出相同结果，否则训练 / 推理错位。

### 2.3 关键算法 / 方法

**1. GPU 调度算法：**

- **FIFO / Priority Queue**：基础调度。
- **Gang Scheduling（协同调度）**：分布式训练必须「N 卡同时启动」，K8s 默认不满足，Volcano / KubeRay 提供。
- **Time-Slicing**：把一张 GPU 时间片切给多个任务（适合 inference）。
- **MIG（Multi-Instance GPU）**：A100/H100 原生支持的硬件切分，每实例独立显存 + 算力。
- **GPU Sharing（vGPU / rGPU）**：软件层虚拟化（如阿里云 cGPU、腾讯云 vGPU）。

**2. 分布式训练算法：**

- **数据并行（DDP）**：单机多卡首选。
- **张量并行（TP）**：大模型单层大（>10B）必须。
- **流水并行（PP）**：超深模型（>50 层）。
- **3D 并行**：TP + PP + DDP 组合，千亿模型标配。
- **ZeRO / FSDP**：显存优化，200B 模型训练必备。
- **LoRA / QLoRA**：参数高效微调，单卡可微调 7B 模型。
- **DeepSpeed**：微软开源分布式训练框架，集成 ZeRO + 3D 并行 + 推理优化。

**3. 推理优化算法：**

- **量化（Quantization）**：FP32 → FP16/BF16 → INT8 → INT4 → FP8/NVFP4。代表：GPTQ（INT4 后训练量化）、AWQ（激活感知权重量化）、SmoothQuant、TensorRT-LLM。
- **KV Cache 优化**：PagedAttention（vLLM）、FlashAttention（IO 优化）、Multi-Query Attention / Grouped-Query Attention（参数量优化）。
- **Continuous Batching**：连续批处理，提升吞吐量 5-20 倍。
- **Speculative Decoding**：投机解码，提升 2-4 倍。
- **算子融合（Operator Fusion）**：Transformer Engine / FlashAttention / cuBLAS。
- **Tensor Parallelism for Inference**：推理时把模型切到多卡，扩展 batch。

**4. AutoML 算法：**

- **超参搜索**：Grid Search、Random Search、Bayesian Optimization（Hyperopt、Optuna）、Population Based Training。
- **神经网络架构搜索（NAS）**：ENAS、DARTS、Once-for-All。
- **AutoML 框架**：FLAML（轻量）、AutoGluon（多模态）、NNI（微软）、H2O.ai、阿里 PAI AutoML。

**5. 特征工程自动化：**

- **自动化特征工程**：Featuretools（DFS 深度特征合成）、AutoFE。
- **特征选择**：基于重要性（XGBoost SHAP）、基于相关性、基于嵌入式模型。
- **特征平台**：Feast（开源）、Tecton（商业）、阿里 PAI FeatureStore、字节 ByteFG、腾讯 TI FeatureStore。

**6. 资源调度算法：**

- **Kubernetes 默认调度**：FIFO + 资源匹配，不感知 GPU 拓扑。
- **Volcano**：K8s 增强调度器，支持 Gang Scheduling / Fair Share / Queue。
- **KubeRay**：把 Ray 跑在 K8s 上，原生支持分布式训练调度。
- **Slurm**：HPC 老牌调度器，超算 / 国家级 AI 平台首选。
- **YARN**：大数据混部调度，训练 + 推理 + 离线作业混部。

**7. 推理服务化算法：**

- **TorchServe**：PyTorch 原生服务化。
- **Triton Inference Server**：NVIDIA 开源，多框架（PyTorch / TF / ONNX / TensorRT）融合。
- **vLLM / TGI / SGLang**：LLM 专用推理引擎，PagedAttention + Continuous Batching。
- **KServe**：K8s 原生 Serverless Inference。
- **BentoML**：模型打包 + 服务化。

### 2.4 与相邻概念的关系

- **AI 计算平台 vs 数据中台**：数据中台是「数据资产化」，AI 计算平台是「模型生产化」。数据中台消费原始数据 → AI 计算平台消费数据中台，产出模型。
- **AI 计算平台 vs Lakehouse**：Lakehouse 提供「数据底座」，AI 计算平台在之上构建「AI 能力」。Lakehouse 负责存储 + 查询，AI 计算平台负责训练 + 推理。
- **AI 计算平台 vs AI 智能体平台**：AI 计算平台是「AI 模型的生产线」，AI 智能体平台是「AI Agent 的组装与运行平台」。智能体平台消费 AI 计算平台产出的 LLM / 工具 / Prompt。
- **AI 计算平台 vs 传统 PaaS**：传统 PaaS 是「应用部署平台」，AI 计算平台是「AI 任务调度 + 模型服务」专用 PaaS。
- **AI 计算平台 vs Serverless**：Serverless 是「按需函数计算」，AI 计算平台中 Serverless Inference 只是其中一种模式。
- **AI 计算平台 vs 算力网络**：算力网络（Compute Network）是「跨地域 / 跨厂商的算力调度」，AI 计算平台是企业内的算力调度。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：传统 ML 平台（Classical MLOps）**

围绕 XGBoost / LightGBM / 传统深度学习（CNN / RNN）展开，强调特征工程 + 模型训练 + 模型部署。

- 优点：成熟度高、社区丰富、成本可控。
- 缺点：不擅长 LLM、Agent 等新场景。
- 适用：推荐 / 风控 / 反欺诈 / 智能营销。

**模式 2：LLM 一体化平台（LLMOps / Foundation Model Platform）**

围绕 LLM 训练 / 微调 / 推理 / 评估展开，强调分布式训练 + 推理优化 + Prompt 管理。

- 优点：支持大模型全链路。
- 缺点：算力成本高、技术门槛高。
- 适用：通用 LLM、行业 LLM、Agent。

**模式 3：Serverless AI 平台**

按需启动、弹性伸缩、按调用计费。代表：Modal、Replicate、AWS Lambda + SageMaker、阿里 PAI EAS Serverless。

- 优点：开发者体验好、初创友好。
- 缺点：定制能力弱、成本可控性差。
- 适用：中小规模推理、PoC、API 化场景。

**模式 4：GPU 算力池化平台**

把 GPU 资源池化，按任务调度。代表：CoreWeave、Lambda Labs、阿里云灵骏、火山引擎机器学习平台。

- 优点：算力利用率高、调度灵活。
- 缺点：需要工程化能力、运维复杂。
- 适用：超大规模 AI 计算中心。

**模式 5：垂直行业 AI 平台**

围绕金融 / 医疗 / 制造 / 政务行业需求构建。代表：蚂蚁金融大脑、平安 AI 平台、医联智云。

- 优点：行业 Know-how 深、合规强。
- 缺点：通用性差、迁移难。
- 适用：行业头部企业。

**模式 6：开源一体化平台**

开源 + 自托管路线，代表：Kubeflow、MLflow、Metaflow、Ray + Anyscale。

- 优点：自主可控、可定制。
- 缺点：运维成本高、企业级特性弱。
- 适用：技术团队强、自研投入大的企业。

**模式 7：联邦 / 多云 AI 平台**

跨云、跨集群的 AI 算力调度。代表：Anyscale（多云 Ray）、阿里云 PAI + 灵骏 + 神龙、AWS SageMaker + Outposts。

- 优点：避免供应商锁定、容灾。
- 缺点：复杂度高、成本不一定降低。
- 适用：大型企业、跨国企业。

### 3.2 适用场景决策表

| 业务特征 | 推荐模式 | 理由 |
| --- | --- | --- |
| 推荐 / 风控 / 反欺诈 / 智能营销 | 模式 1：传统 ML 平台 | 成熟、稳定、成本可控 |
| 通用 LLM / 行业 LLM / Agent | 模式 2：LLM 一体化平台 | 必须支持分布式训练 + 推理优化 |
| 创业团队 / 中小规模推理 / PoC | 模式 3：Serverless AI | 零运维、按需付费 |
| 超大规模训练（万卡） | 模式 4：GPU 算力池化 | 必须资源池化 + 拓扑感知 |
| 金融 / 医疗 / 政务 | 模式 5：垂直行业 AI 平台 | 合规 + 行业 Know-how |
| 技术团队强、自研投入大 | 模式 6：开源一体化 | 自主可控 |
| 大型跨国企业 | 模式 7：联邦 / 多云 | 容灾 + 避免锁定 |

### 3.3 反模式与陷阱

1. **「烟囱式采购」反模式**：每个团队采购自己的 GPU，结果闲置 70%。**必须集中算力、统一调度**。
2. **「Notebook 直接上线」反模式**：训练好的 .pkl 直接放 API 服务，没有版本管理、没有 A/B 实验。**必须 Model Registry + 推理服务化**。
3. **「特征不一致」反模式**：离线用 Pandas 算特征，线上用 Spark 算，结果不一致。**必须 Feature Store 保证 point-in-time correctness**。
4. **「盲目上 LLM」反模式**：所有问题都套 LLM，成本爆表。**必须区分场景：分类 / 推荐用小模型，复杂推理用 LLM**。
5. **「推理裸奔」反模式**：直接用 PyTorch / TF 裸服务，无 GPU 利用率优化。**必须用 vLLM / Triton / TensorRT-LLM**。
6. **「训练-推理不可控」反模式**：训练有资源管理，推理裸奔。**必须训推一体治理**。
7. **「忽略 GPU 拓扑」反模式**：分布式训练不考虑 NVLink / NCCL 拓扑，通信瓶颈。**必须 NodeLocal / 拓扑感知调度**。
8. **「缺少 MLOps 文化」反模式**：技术上平台齐全，但团队不愿意用，仍然「野生」训练。**必须从一把手工程**。
9. **「国产化替代盲区」反模式**：只适配 NVIDIA 卡，遇到等保 / 国产化要求时无从下手。**必须双栈适配（NVIDIA + 国产 NPU）**。
10. **「盲目追求万卡集群」反模式**：堆 1 万卡但调度算法跟不上，利用率只有 20%。**必须算力规模与调度能力匹配**。

---

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

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：LLM 训练 / 微调全链路平台化**

LLM 时代，AI 计算平台从「传统 ML」进化为「LLM 全链路」：

- **预训练**：千亿参数起步，3D 并行 + ZeRO-3 + 流水并行 + 混合精度是标配。
- **微调（SFT / DPO / PPO / RLHF / RLAIF）**：LoRA / QLoRA 让单卡微调 70B 成为可能；RLHF 框架（DeepSpeed-Chat、trl）成熟。
- **对齐**：RLHF / DPO / ORPO 等对齐算法集成。
- **评估**：MT-Bench / AlpacaEval / MMLU / HumanEval 等公开榜单 + 业务指标。

代表平台：阿里云 PAI-LLM、字节 ByteFSDP、Meta Llama Factory、Hugging Face TRL + PEFT。

**方向 2：推理优化成为主战场**

LLM 推理是 2024-2025 年的「工程制高点」：

- **量化**：FP32 → FP16/BF16 → INT8 → INT4 → FP8（NVIDIA H100/B200 原生）→ NVFP4（Blackwell）。
- **KV Cache 优化**：PagedAttention（vLLM）、Multi-Query Attention、Grouped-Query Attention、Sliding Window Attention。
- **Continuous Batching**：吞吐量提升 5-20 倍（vLLM、TGI、TensorRT-LLM 标配）。
- **Speculative Decoding**：用小模型 draft，大模型 verify，加速 2-4 倍。
- **算子融合**：Transformer Engine（FP8 算子）、FlashAttention、cuBLASLt。
- **端侧推理**：MLC LLM、llama.cpp、Ollama、CoreML，让 LLM 跑在 PC / 手机 / 嵌入式。

**方向 3：Serverless Inference 普及**

Serverless Inference 把「GPU 推理」做成「水电煤气」：

- **Modal、Replicate、Beam**：Serverless 推理平台，按调用计费。
- **AWS Lambda + SageMaker**：Serverless 推理。
- **阿里 PAI EAS Serverless**：国产 Serverless 推理。
- **RunPod、Vast.ai**：Serverless GPU。

**工程最佳实践**：Serverless 适合「调用量波动大、冷启动容忍秒级」的场景。对于延迟敏感（< 100ms）或高 QPS（> 1000）场景，专用推理服务更优。

**方向 4：AI 算力水电煤气化**

GPU 从「稀缺资源」变成「水电煤气」：

- **CoreWeave**：2024 年估值 190 亿美元，专门做 GPU 云。
- **Nebius、Together AI、Crusoe**：AI 专用云。
- **国家算力网络**：中国「东数西算」工程，国家级 AI 算力调度。
- **边缘 AI 算力**：5G + 边缘 GPU（NVIDIA Jetson、华为 Atlas），边缘 AI 推理。

**方向 5：Agent 工程化对 AI 计算平台的反作用**

Agent 时代，AI 计算平台必须支持：

- **LLM 多模型路由**：根据任务路由不同模型（小模型 + 大模型组合）。
- **工具调用**：LLM 调用外部工具（数据库 / API / 函数），需要 AI 平台与 Agent 平台集成。
- **记忆与状态**：Agent 的记忆需要存储（向量 / KV / DB），AI 平台需要提供持久化能力。
- **多 Agent 协作**：Multi-Agent 框架（AutoGen、CrewAI、LangGraph）对 AI 平台的资源调度提出新要求。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**LLM + AI 计算平台的边界**：

- **RAG 是消费侧**：LLM 通过 RAG 检索增强，对 AI 计算平台是「LLM 推理请求 + 检索结果」。
- **向量库是消费侧**：AI 计算平台产出 Embedding 模型，部署到向量库。
- **GraphRAG 是消费侧**：基于知识图谱增强 LLM，对 AI 计算平台是「图谱构建 + 图查询服务」。

**AI 计算平台在 RAG 时代的新角色**：

1. **Embedding 模型服务**：BGE、Qwen3-Embedding、Cohere Embed 等 Embedding 模型作为推理服务部署。
2. **Reranker 模型服务**：BGE Reranker、Cohere Rerank 等 Rerank 模型作为推理服务部署。
3. **LLM 推理优化**：低延迟 RAG 需要 LLM 推理 < 100ms，必须 Streaming + 投机解码 + KV Cache 优化。
4. **多模态 Embedding**：CLIP、InternVL 等多模态 Embedding 模型服务。

**最佳实践**：

- **RAG 链路一体化**：Embedding → Rerank → LLM 推理，三段都在 AI 计算平台内部完成。
- **GPU 资源共享**：Embedding / Rerank / LLM 推理共享 GPU 池。
- **低延迟链路**：Streaming + KV Cache + 预加载 + 投机解码。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **Distributed Training**：2024-2025 年持续优化 3D 并行 + ZeRO，NCCL 2.x / NCCLX（Meta）、Gloo 升级。
- **Inference Optimization**：PagedAttention（vLLM）、FlashAttention 3（2024）、SpecDec（投机解码）论文爆发。
- **Quantization**：SmoothQuant、AWQ、GPTQ、KV Quantization 等持续优化。
- **Speculative Decoding**：EAGLE、Medusa、Lookahead Decoding 等新方法。
- **MoE 模型**：Mixtral、DeepSeek-V3 等 MoE 架构给分布式训练提出新要求。
- **Long Context**：RoPE Scaling、YaRN、LongLoRA 等长上下文训练方法。
- **Multi-Modal LLM**：LLaVA、InternVL、Qwen-VL 等多模态 LLM 的训练 / 推理优化。

**工业进展（2024-2025）**：

- **vLLM 1.0**（2024-2025）——PagedAttention + Continuous Batching 成为 LLM 推理事实标准，单 GPU 吞吐量提升 16-32 倍。
- **NVIDIA Blackwell B200 / GB200**（2024 发布）——单卡 2080 TFLOPS（FP4），NVL72 机柜级 72 GPU 互联。
- **Modal、Replicate、Beam**（2024）——Serverless AI 普及。
- **CoreWeave IPO**（2025 计划）——GPU 云上市公司。
- **Hugging Face TRL + PEFT**（2024-2025）——LLM 微调事实标准。
- **阿里云 PAI-LLM**（2024）——国产 LLM 一体化平台。
- **字节 ByteFSDP**（2024）——字节自研分布式训练框架，对标 DeepSpeed。
- **Meta Llama 3.1 / 3.2 / 3.3**（2024-2025）——开源 LLM 标杆。
- **Qwen 2.5 / Qwen 3**（2024-2025）——阿里开源 LLM 系列。
- **DeepSeek V2.5 / V3 / R1**（2024-2025）——国产开源 LLM + MoE 架构。
- **Anthropic Claude 3.5 Sonnet / 3.7 Sonnet**（2024-2025）——闭源 LLM 标杆。
- **OpenAI o1 / o3**（2024-2025）——推理增强 LLM。
- **Google Gemini 1.5 / 2.0**（2024-2025）——多模态 LLM 标杆。
- **国产化进展**：华为昇腾 910C、寒武纪、燧原规模化部署，CANN 软件栈成熟。

### 5.4 未来 3-5 年趋势

1. **「AI 水电煤气」全面落地**：GPU 算力变成按需付费的基础设施，初创公司可以零成本启动 AI 项目。
2. **「LLM 推理即基础设施」**：vLLM / TensorRT-LLM 类引擎成为云原生标配，类似 nginx / envoy 之于 HTTP。
3. **「Serverless + GPU」成熟**：Serverless Inference 解决冷启动问题，P99 < 1s。
4. **「多模态大模型平台化」**：CLIP 类模型 + LLM + 视觉模型深度集成，多模态 AI 成为平台标配。
5. **「Agent 计算平台」独立**：Multi-Agent 框架需要新的算力调度范式（消息队列 + 状态管理 + 工具调用），Agent 计算平台可能成为 AI 计算平台的子平台。
6. **「国产化深度优化」**：昇腾 + CANN、寒武纪 + 燧原 + MLU 软件栈成熟，国产 GPU 训练千亿模型成为可能。
7. **「AI 算力网络」**：国家级 / 跨企业的算力调度，类似电力网络。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：阿里云 PAI（Platform of AI）**

- 背景：阿里集团内部 AI 平台，支撑淘宝 / 支付宝 / 菜鸟 / 阿里云的全栈 AI 需求。
- 方案：PAI 平台包括 PAI-DSW（开发环境）、PAI-Studio（可视化建模）、PAI-EAS（在线推理）、PAI-AutoML（自动建模）、PAI-FeatureStore（特征平台）、PAI-ModelMarket（模型市场）、PAI-LLM（LLM 全链路）、PAI-Blade（推理优化）。
- 工具：自研 + 开源（Kubeflow、Ray、DeepSpeed、vLLM）。
- 结果：服务 10万+ 算法工程师，日均训练任务 10万+，推理 QPS 亿级。

**案例 2：字节跳动 ByteFSDP / 机器学习平台**

- 背景：字节全公司 AI 平台，支撑抖音 / TikTok / 西瓜视频 / 飞书的全栈 AI 场景。
- 方案：ByteFSDP（自研分布式训练框架）+ 字节机器学习平台（训练 + 推理 + 特征 + 模型市场）。
- 工具：自研 + K8s + Ray + vLLM + 自研推理优化。
- 结果：千亿模型训练周期从 60 天压缩到 14 天；推理 GPU 利用率从 40% 提升到 75%。

**案例 3：蚂蚁集团金融 AI 平台**

- 背景：蚂蚁集团金融大脑，支撑花呗 / 借呗 / 保险 / 财富的全栈 AI 场景。
- 方案：金融级 AI 平台，强调合规 + 可解释 + 安全 + 国产化适配。
- 工具：自研 + 华为昇腾 + 蚂蚁图数据库 TuGraph + 自研推理引擎。
- 结果：日均训练任务 5万+；推理 P99 < 50ms；国产化适配 100%。

**案例 4：Meta Llama 系列大模型训练基础设施**

- 背景：Meta 开源 LLM 标杆（Llama 2 / 3 / 3.1 / 3.2 / 3.3），千亿参数训练。
- 方案：基于 RoCE 网络 + 24K H100 集群 + FSDP + 流水并行 + 混合精度 + Checkpoint 优化。
- 工具：PyTorch + FSDP + Megatron-LM + 自研。
- 结果：405B 模型在 24K H100 集群上训练 54 天；推理优化后 Llama 3.1 405B 单 GPU 可跑（FP4 量化）。

**案例 5：CoreWeave GPU 云**

- 背景：美国 GPU 云独角兽，2024 年估值 190 亿美元，NVIDIA 投资。
- 方案：专门为 AI 优化的 GPU 云，基于 Kubernetes + 自研调度 + InfiniBand 网络。
- 工具：CoreWeave Cloud + 自研调度 + NVIDIA GPU。
- 结果：服务 OpenAI / Mistral / Cohere 等头部 AI 公司，2024 年收入超 10 亿美元。

### 6.2 踩坑与经验

**坑 1：GPU 调度不感知拓扑**

- 现象：8 卡分布式训练只用到 PCIe 带宽，训练慢 10 倍。
- 解法：使用 Volcano / KubeRay 的拓扑感知调度，把同一节点内的 GPU 优先分配给同一任务。

**坑 2：LLM 推理 OOM**

- 现象：7B 模型推理正常，70B 模型 OOM。
- 解法：张量并行 + 量化（INT4）+ KV Cache 分页（vLLM PagedAttention）+ 梯度检查点。

**坑 3：Feature Store 离线 / 在线不一致**

- 现象：离线 AUC 0.9，线上 AUC 0.6。
- 解法：使用 Feast / Tecton 等支持 Point-in-Time Correctness 的 Feature Store；离线 / 在线用同一份代码（Beam / Spark / Flink 双写）。

**坑 4：模型版本失控**

- 现象：线上同时跑 10 个版本的模型，无法回滚。
- 解法：MLflow Model Registry + 强制模型注册 + A/B 实验管理 + 灰度发布。

**坑 5：GPU 资源空闲浪费**

- 现象：GPU 利用率 30%，一半时间空转。
- 解法：MIG 切分（一张 H100 切 7 个 MIG，每 MIG 独立任务）+ 推理 / 训练混部 + 抢占式调度。

**坑 6：LLM 推理成本爆表**

- 现象：日均 1 亿 token 推理，月成本 500 万 USD。
- 解法：量化（INT4）+ 投机解码 + 缓存（语义缓存 / KV Cache 复用）+ 小模型路由（简单任务用 7B，复杂任务用 70B）。

**坑 7：训练 Checkpoint 丢失**

- 现象：训练 7 天后集群故障，Checkpoint 没保存，损失 7 天。
- 解法：分布式 Checkpoint（每 N 步保存到并行文件系统）+ Checkpoint 异步上传 OSS + 断点续训。

**坑 8：国产化适配不充分**

- 现象：等保 / 国产化要求下，AI 平台只能适配 NVIDIA 卡，无法满足国产 NPU。
- 解法：双栈适配（CUDA + CANN/MLU/ROCm）+ 抽象层（自研硬件抽象层）+ 渐进迁移（先用国产卡跑推理，再跑训练）。

**坑 9：MLOps 平台没人用**

- 现象：投入 1000 万 USD 搭建 MLOps 平台，但团队继续「野生」训练。
- 解法：从一把手工程 → 高管推 Pilot → 强制接入 → 持续运营 → 提供最佳用户体验。

**坑 10：LLM 训练 / 推理安全合规**

- 现象：LLM 训练数据敏感，推理输出不可控。
- 解法：数据脱敏 + 训练数据合规审计 + 推理输出过滤 + 推理水印 + 全链路审计。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（单点试点，1-3 个月）**：

1. 选定 1 个核心业务场景（如推荐 / 风控）。
2. 采购少量 GPU（A100 / H100）建立训练集群。
3. 部署 Kubeflow / MLflow / vLLM 等基础工具。
4. 训练 1-3 个模型上线。
5. 验证 ROI。

**1→10（部门级扩展，3-9 个月）**：

1. 扩展到 10+ 模型，多框架（PyTorch / TF / XGBoost）共存。
2. 部署 Feature Store + Model Registry。
3. 建立 CI/CD for ML。
4. 部署推理服务平台（Triton / vLLM）。
5. 建立模型监控 + GPU 监控。
6. 上线 Serverless Inference。

**10→100（企业级 / 跨域，9-24 个月）**：

1. 全公司统一算力池化（Volcano / KubeRay）。
2. 全公司统一训练 / 推理 / 特征 / 模型市场。
3. LLM 一体化平台（训练 + 微调 + 推理 + 评估）。
4. 国产化适配（NVIDIA + 昇腾 / 寒武纪双栈）。
5. 跨云 / 跨地域容灾。
6. Agent 平台集成。

### 6.4 ROI 评估

**直接收益**：

- **AI 应用规模化**：从「5 个团队 10 个模型」到「100 个团队 1000 个模型」。
- **GPU 利用率提升**：从 30% 提升到 70%+，相当于算力成本降低 60%。
- **模型上线周期**：从「3 个月」压缩到「1 周」。
- **LLM 推理成本**：通过量化 / 投机解码 / 缓存，成本降低 50-80%。

**间接收益**：

- **研发效率提升**：AI 工程师不再重复造轮子，专注业务。
- **模型质量提升**：Feature Store + Model Registry + A/B 实验，模型效果提升 10-30%。
- **合规与安全**：模型可追溯、可审计、可解释，满足金融 / 医疗 / 政企合规。
- **国产化适配**：满足等保 2.0 / 3.0 + 信创要求。

**评估指标**：

- **GPU 利用率**：目标 > 70%（训练 > 60%，推理 > 80%）。
- **模型上线周期**：目标 < 1 周（从数据准备到推理上线）。
- **推理 P99 延迟**：目标 < 200ms（LLM 推理 < 2s Streaming）。
- **模型复用率**：目标 > 50%（特征 / 模型 / 实验复用）。
- **AI 应用规模化**：模型数量 ×10、推理 QPS ×100。
- **ROI**：每 USD 算力投入产出 > 5 USD 业务价值。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 传统数据平台 | 数据中台 | 数据湖 / Lakehouse | AI 计算平台 | AI 智能体平台 |
| --- | --- | --- | --- | --- | --- |
| 核心负载 | SQL 聚合 | 数据资产化 | 数据存储 + 查询 | 训练 + 推理 | Agent 编排 |
| 数据形态 | 结构化 | 结构化 | 多模态 | 多模态 | 多模态 |
| 用户 | 数据分析师 | 数据团队 | 数据团队 | 数据科学家 | 业务开发 |
| 算力 | CPU | CPU | CPU + GPU | GPU 为主 | GPU + CPU |
| 性能指标 | 查询时延 | 资产复用率 | 查询 QPS | 训练时长、推理 QPS | Agent 任务成功率 |
| 治理对象 | 表 / 字段 | 指标 / 标签 | 表 / 文件 | 特征 / 模型 / 实验 | Prompt / 工具 / 记忆 |
| 工具成熟度 | 5 | 4 | 4 | 4 | 3 |
| 学习曲线 | 2 | 3 | 3 | **5（陡）** | 4 |
| LLM 支持 | 1 | 2 | 2 | **5** | **5** |
| Agent 支持 | 1 | 1 | 1 | 2 | **5** |
| 工程门槛 | 3 | 4 | 4 | **5（高）** | 4 |

**结论**：

- **AI 计算平台** 在「训练 + 推理、LLM 支持、特征 / 模型治理」3 项满分。
- **AI 计算平台** 在「传统 SQL 聚合、低门槛」2 项劣势——但可以通过组合传统数据平台弥补。

### 7.2 决策树

```
[你要构建的核心能力是什么？]
   │
   ├── 「我要做 BI / 指标体系 / Ad-hoc 查询」→ 传统数据平台 / 数据中台
   │
   ├── 「我要做数据湖 / 湖仓 / 多模态存储」→ Lakehouse（Iceberg / Hudi / Delta）
   │
   ├── 「我要训练 / 部署 AI 模型」→ AI 计算平台 ★
   │
   ├── 「我要做 LLM 训练 / 微调 / 推理」→ AI 计算平台（LLM 子平台）★
   │
   ├── 「我要做 Agent 编排 / 多 Agent 协作」→ AI 智能体平台
   │
   └── 「我要做企业级 AI 全栈」→ 数据中台 + AI 计算平台 + AI 智能体平台三件套 ★
```

### 7.3 组合使用

**组合 1：AI 计算平台 + 数据中台**

- 数据中台：消费原始数据，产出指标 / 标签 / 特征。
- AI 计算平台：消费数据中台特征，产出模型 / 推理服务。
- 适用：传统行业（金融 / 零售 / 制造）AI 转型。

**组合 2：AI 计算平台 + Lakehouse**

- Lakehouse：提供多模态数据底座（结构化 + 非结构化）。
- AI 计算平台：消费 Lakehouse 数据，训练 / 推理。
- 适用：互联网 / 媒体 / 自动驾驶。

**组合 3：AI 计算平台 + AI 智能体平台**

- AI 计算平台：提供 LLM + 工具 + 推理能力。
- AI 智能体平台：基于 LLM + 工具 + 记忆 + 规划构建 Agent。
- 适用：所有 Agent 应用场景。

**组合 4：AI 计算平台 + 国产 NPU 适配**

- NVIDIA GPU：主力算力。
- 华为昇腾 / 寒武纪 / 燧原：等保 / 信创要求下的替代算力。
- 适用：政企 / 金融 / 央企。

**组合 5：AI 计算平台 + Serverless AI**

- Serverless AI：PoC / 中小规模推理 / 按需付费。
- AI 计算平台：大规模训练 + 核心推理。
- 适用：互联网公司 / 创业团队 / 创新业务。

---

## 8. 面试真题集

> 本节内容待补充。题源待与原 PDF《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）题库对齐。读者可参考本节结构，按"全景视图 → 分主题展开 → 横向小结 → 本章小结"四段式自检。