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

> 本节整合自《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）题库与公开工业实践，按"AI 算力全景视图 → 六大主题分题 → 本章小结"组织。每题沿用五段式：**考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料**。参考案例优先引用 OpenAI / Anthropic / DeepMind / Meta / Google (TPU) / Microsoft / Amazon (Trainium) / NVIDIA (MIG) / 阿里 (PAI 灵骏) / 字节 (ByteFSDP) / 华为 (昇腾) / 寒武纪 / 智谱 / 月之暗面 / 阶跃 等头部企业与芯片厂商的公开架构实践。

---

### 8.1 全景视图

| 主题 | 题号范围 | 收录题数 | 难度区间 | 在 AI 算力能力域中的角色 |
| --- | --- | :---: | :---: | --- |
| GPU / MIG 虚拟化与算力池化 | §9.1.1 | 1 | ★★★★☆ | 资源底座 |
| 大模型分布式训练（DDP / TP / PP / ZeRO） | §9.1.2 | 1 | ★★★★★ | 训练主线 |
| LLM 推理优化（PagedAttention / 量化 / 投机解码） | §9.1.3 | 1 | ★★★★★ | 推理主线 |
| AI 算力调度（Gang / 拓扑感知 / 混部） | §9.1.4 | 1 | ★★★★☆ | 工程枢纽 |
| 算力成本治理（FinOps for AI / Serverless） | §9.1.5 | 1 | ★★★★☆ | 商业可持续 |
| 国产化算力适配（昇腾 / 寒武纪 / 海光） | §9.1.6 | 1 | ★★★★☆ | 合规与供应链 |

---

### 8.2 §9.1 AI 算力核心主题

> 本节围绕「AI 算力」从资源底座、训练/推理主线、工程枢纽到成本与合规的六大主题。面试官通常从「GPU 虚拟化与池化」切入，下钻到「分布式训练 / 推理优化」两条主线，再深入到「调度与成本治理」的工程化能力，并最终落到「国产化适配」的合规与供应链议题。题号沿用原题库编号体系，便于读者回溯。

---

#### §9.1.1 在 GPU 集群中，如何通过 MIG（Multi-Instance GPU）与算力池化把单卡利用率从 30% 提升到 70%+？虚拟化、Time-Slicing、MIG 三种方案的边界是什么？

**1. 考察点**

- 是否理解 GPU 利用率低的**根因**——不是「卡不够」，而是「显存与算力被独占式分配，小任务把大卡浪费掉」。
- 能否区分**硬件层切分**（MIG / MPS）、**驱动层切分**（CUDA MPS / vGPU）、**应用层切分**（Time-Slicing / rGPU）三种粒度，并说清各自的隔离性边界。
- 是否知道 MIG 的**硬约束**——A100 最多 7 个实例、H100 最多 7 个、Blackwell B200/GB200 域级 NVL72 互联打破单卡限制——以及不同实例规格（1g.5gb / 2g.10gb / 3g.20gb / 4g.20gb / 7g.40gb）的算力 / 显存配比。
- 加分项：能给出具体场景的算力配比案例（如 LLM 推理 7B/13B/70B 在 MIG 实例上的承载）。

**2. 参考答案框架**

**第一层：先定义问题——为什么 GPU 利用率长期低于 40%。** 核心矛盾是「**独占式分配 + 显存即上限 + 算力峰值与均值差距大**」三件套：

- 一张 H100 80GB，被某个 7B 推理进程独占，显存只用了 30%，但其他任务拿不到这张卡——结果「卡空闲、人排队」。
- 训练任务的算力峰值集中在前向 / 反向，IO / 通信阶段空载；推理任务的算力峰值集中在 Prefill，Decode 阶段空载——单卡「时间维度」的浪费也很严重。
- 加上 N 团队各自采购、调度策略各异的烟囱模式，集群利用率 30% 是行业常态，顶尖公司（如 NVIDIA 内部、阿里 PAI、字节 ByteFSDP）能做到 70%+。

**第二层：三种虚拟化方案的工程边界。**

| 方案 | 层级 | 隔离粒度 | 隔离性 | 适用场景 | 限制 |
| --- | --- | --- | --- | --- | --- |
| **MIG（Multi-Instance GPU）** | **硬件层** | 显存 + 算力 + 解码器 | **强**（每实例独立 SM、显存、L2 缓存分区） | 生产级多租户推理、小模型并发训练 | 必须是 Ampere 架构（A100/A30）+ 专属驱动；H100 同样支持；最多 7 个实例；不支持 MIG 实例间 NVLink 全速互联 |
| **CUDA MPS（Multi-Process Service）** | **驱动层** | 仅算力（SM 时间片） | **弱**（显存共享，靠应用自管理；故障会全网段崩溃） | 同任务内多进程（小模型多 stream / 多实验并行） | 不隔离显存；进程崩溃影响整个 GPU |
| **Time-Slicing（rGPU / vGPU）** | **应用层** | 时间片 | **最弱**（多个任务轮流占用整卡，零算力隔离） | PoC、调试、Notebook 共享 | 显存仍独占；本质上没解决显存浪费 |

**第三层：MIG 的工程细节。** 以 NVIDIA A100 40/80GB 为例：

- **实例规格**（Compute Instance）：1g.5gb（5GB 显存，1/7 算力）、2g.10gb、3g.20gb、4g.20gb、7g.40gb（独占整张卡）。每实例独立 SM、独立 L2 缓存分区、独立显存。
- **配置工具**：`nvidia-smi mig -i 0 -cgi 3g.20gb,3g.20gb` 创建 2 个 3g.20gb 实例；`nvidia-smi mig -dci` 删除实例；`nvidia-smi mig -lgi` 查看实例。
- **K8s 集成：通过 NVIDIA Device Plugin with MIG，`nvidia.com/mig-1g.5gb: 1` 这种 extended resource 调度**。
- **H100 升级**：H100 在 MIG 基础上支持 **MIG-GPU**（Multi-Instance GPU）与 **Multi-Process Service** 双模式；Blackwell B200/GB200 通过 NVL72 机柜级互联，单实例可横跨 72 卡，单卡 MIG 仍然有效但**域级（Domain）**成为新的切分单位。

**第四层：池化的工程闭环——从「卡」到「算力」。** 把 GPU 池化的关键不只是切分，而是「**池子 + 调度 + 计量**」三件套：

- **池子**：Volcano / KubeRay 把物理卡抽象为可切分资源池；MIG 实例、CPU、内存、RDMA 网络拓扑都进入资源画像。
- **调度**：Gang Scheduling（分布式训练必须 N 卡同时启动）+ 拓扑感知（同节点 > 同机柜 > 跨机柜）+ 抢占式调度（P0 任务可抢占 P2）。
- **计量**：按 MIG 实例 × 时长 × 显存容量计费，让「谁用了多少」可追溯、可优化。

**第五层：工业实证。** **NVIDIA 内部**用 MIG 把 H100 切 7 个实例，每个实例跑独立推理任务，整卡利用率从 40% 提升到 80%+。**阿里云 PAI 灵骏**提供 GPU 池化能力，支持 MIG + 拓扑感知调度，把万卡集群利用率从 30% 推到 75%。**字节 ByteFSDP** 配套自研调度器，把推理 GPU 利用率从 40% 提升到 75%。**AWS EC2 / Neuron** 用 Trainium + Inferentia 配合 vGPU，把 GPU 实例成本降到 NVIDIA 同规格的 50-70%。

**3. 常见陷阱**

- **把 Time-Slicing 当成 MIG。** 二者粒度完全不同——Time-Slicing 是「轮流用整卡」，MIG 是「同时独立用部分卡」。前者没有真正的并行，后者是真正的并行。
- **忽略 MIG 不支持 NVLink 跨实例互联。** 训练任务如果用 MIG 切 7 个实例，跨实例通信会退化为 PCIe，**张量并行跑在 MIG 上是反模式**——这是把 MIG 用错的最大陷阱。
- **认为「切得越细越好」。** 切得越细，单实例算力越弱——1g.5gb 实例只能跑 7B 量化后的推理，跑不动训练。**切分粒度必须匹配工作负载**。
- **忽略驱动 / 内核版本约束。** MIG 必须在 NVIDIA 专有驱动下启用，且 K8s Device Plugin 必须明确开启 MIG 模式——很多团队「卡不支持 MIG」其实是「没启用 MIG profile」。
- **不区分 MIG 与 MPS。** MPS 只切算力不切显存，对显存敏感的多任务并发场景没有帮助。

**4. 追问预测**

- **「MIG 切分后，监控怎么做？」** 答：用 **DCGM Exporter** 按 MIG 实例采集利用率（`DCGM_FI_DEV_GPU_UTIL` 按 instance 维度），Prometheus 抓取后 Grafana 按团队 / 项目展示——这是把「按卡计费」落到「按 MIG 实例计费」的前提。
- **「7B 推理跑在 1g.5gb 实例上能撑多少 QPS？」** 答：vLLM + AWQ INT4 量化 + Continuous Batching，单实例 1g.5gb 大约 5-15 QPS（512 token 输出）；切 4g.20gb 实例可达 30-60 QPS——选规格的关键是「并发请求数 × 单请求 token 数 × 模型规模」。
- **「H100 MIG 和 A100 MIG 有什么差别？」** 答：H100 增加 **MIG-GPU**（每实例独占 PCIe 通道）、**Confidential Computing**（机密计算）、**Sparsity-Aware**（稀疏加速）；Blackwell B200 支持 **MIG + 软件定义可分片**（动态调整实例规格）。
- **「国产卡支持 MIG 吗？」** 答：华为昇腾 910C 通过 **CANN 软件栈**提供「**虚拟 NPU**」（类似 MIG）；寒武纪思元 590 提供 **MLU 虚拟化**；海光 DCU 兼容 CUDA 生态，可借助 `cGPU`（阿里自研）做软件层虚拟化。但成熟度与生态远不及 NVIDIA MIG。

**5. 参考资料**

- NVIDIA 官方文档《Multi-Instance GPU User Guide》——MIG 的权威定义与配置指南。
- NVIDIA DCGM Exporter 项目文档——GPU 与 MIG 实例级监控的开源实现。
- 阿里云 PAI 灵骏公开技术材料——国产 GPU 池化与拓扑感知调度的代表。
- 字节跳动 ByteFSDP 团队公开演讲——大模型分布式训练与 GPU 调度协同优化的工业实证。
- **Meta Llama 3.1 训练集群** —— 24K H100 集群 + MIG 实例组合用于推理服务，整卡利用率从 50% 提升到 80%+，是头部 LLM 厂商 MIG 用法的典范。
- **阿里 PAI 推理服务** —— 把 H100 切 4g.20gb 实例跑 Qwen 2.5 系列推理，单实例支撑 50 QPS，万卡集群整体利用率 75%+，是国产 LLM 推理池化的代表。
- **AWS Trainium / Inferentia 推理池化** —— 自研芯片 + Neuron SDK + vGPU 软件层池化，单价比 NVIDIA 同规格低 30-50%。
- **Google TPU v5p Pod** —— 通过 **Multislice**（多切片互联）实现「跨机柜级」切分，4096 芯片级 Pod 利用率达 70%+，是 TPU 路线对 MIG 的回应。
- **CoreWeave GPU 云** —— 2024 年估值 190 亿美元，专门做 AI 优化的 GPU 云，NVIDIA 投资；用 MIG + 自研调度支撑 OpenAI / Mistral / Cohere 等头部 AI 公司。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §9.1.2 千亿参数大模型训练时，如何选型数据并行（DDP）/ 张量并行（TP）/ 流水并行（PP）/ ZeRO / FSDP？请说明 Meta Llama 3.1 405B 是怎么组合的，以及为什么？

**1. 考察点**

- 是否理解分布式训练的**核心矛盾**——显存容量、通信带宽、同步开销三者不可同时最优。
- 能否说清 DDP / TP / PP / ZeRO / FSDP 五种并行策略的**适用边界**，以及 **3D 并行（TP + PP + DDP）**的组合逻辑。
- 是否知道 Meta Llama 3.1 405B 的真实工程参数——24K H100 集群、54 天训练、3D 并行 + FSDP 混合。
- 加分项：能解释 MoE（Mixtral / DeepSeek V3）对分布式训练提出的新挑战——专家并行 + 通信拓扑。

**2. 参考答案框架**

**第一层：先定义问题——千亿模型的显存压力。** 405B 参数的 Llama 3.1，训练阶段需要存储的参数 / 梯度 / 优化器状态总量：

- **参数（FP16）**：405B × 2 byte = 810 GB。
- **梯度（FP16）**：405B × 2 byte = 810 GB。
- **优化器状态（AdamW：FP32 主权重 + 一阶 + 二阶动量）**：405B × 12 byte = 4.86 TB。
- **激活值（Activation）**：依 batch size 与 sequence length，典型 1-5 TB。
- **总计**：**7-12 TB / 卡**——单卡 H100 80GB 完全无法承载。

所以「分布式训练」不是为了「跑得更快」，本质上是为了「**单卡装不下**」。

**第二层：五种并行策略的工程边界。**

| 策略 | 切分对象 | 通信开销 | 显存节省 | 适用边界 | 限制 |
| --- | --- | --- | --- | --- | --- |
| **DDP（Data Parallel）** | 数据 batch | AllReduce 梯度 | 不省显存（每卡全模型） | 模型 < 单卡显存（典型 < 13B） | 模型大了放不下 |
| **TP（Tensor Parallel）** | 单层参数（矩阵切分） | AllGather / ReduceScatter 每层 | 显存减少 N 倍（卡数） | 单层大（>10B）或 NVLink 强互联 | 跨机通信瓶颈；常限制单机 8 卡 |
| **PP（Pipeline Parallel）** | 模型层（stage） | 点对点 Send/Recv | 显存减少 N 倍（stage 数） | 模型深（>50 层）或层间大 | 流水线气泡（bubble）；负载不均 |
| **ZeRO-1/2/3** | 优化器状态 / 梯度 / 参数 | AllGather 按需 | 节省 3-4 倍（ZeRO-3 等价 FSDP） | 模型 13B-200B + 显存不足 | 通信量增加；小模型反而慢 |
| **FSDP（Fully Sharded Data Parallel）** | 参数 + 梯度 + 优化器状态（全分片） | AllGather 通信 | 等价 ZeRO-3 | 模型 13B-500B | 与 TP / PP 组合复杂 |

**第三层：3D 并行的组合逻辑。** 千亿模型的标准组合是 **TP + PP + DP（DDP）**：

- **TP（张量并行）**：在单机 8 卡内做张量切分，利用 NVLink / NVSwitch 高速互联。每卡分 1/8 张量，通信走 NVLink（900 GB/s），开销可接受。
- **PP（流水并行）**：把模型按层切分到多机（如 8-16 stage），用 micro-batch 流水线填满气泡。前向 / 反向像流水线，前 stage 算完第一个 micro-batch 就传给下一 stage。
- **DP（数据并行）**：把 TP+PP 整体作为一组，复制多组（如 16A / 32A），跑不同 batch 数据。组间 AllReduce 梯度同步。

**以 Llama 3.1 405B 为例的并行配置（Meta 公开数据）**：
- **硬件**：24,576 张 H100，RoCE 网络互联。
- **并行策略**：TP=8（单机 8 卡）+ PP=16（16 stage）+ DP=192（24K/8/16）。
- **优化**：FSDP 进一步分片优化器状态、混合精度（FP16/BF16）、Activation Checkpointing（用计算换显存）、Async Checkpoint 保存到并行文件系统。
- **训练时长**：54 天（实际可能更长，包含调试与重启）。
- **关键工程**：Checkpoint 每 N 分钟保存到并行文件系统（GPFS），断点续训时间 < 30 分钟；RoCE 网络调优让 NCCL 通信效率 > 80%。

**第四层：ZeRO / FSDP 的进一步优化。** ZeRO 把优化器状态（ZeRO-1）、梯度（ZeRO-2）、参数（ZeRO-3）逐级分片到 DP 维度——ZeRO-3 等价 FSDP 的全分片，**显存节省近 N 倍**（N 为 DP 数）。代价是通信量增加（每个 step 多一次 AllGather）。对 70B-200B 模型，FSDP + TP + Activation Checkpointing 是主流组合。

**第五层：MoE 与新挑战。** DeepSeek V3（671B 总参 / 37B 激活）、Mixtral 8×7B 等 MoE 模型给分布式训练提出新问题：

- **专家并行（Expert Parallel, EP）**：把 256 个专家分散到不同卡，token 通过 All-to-All 路由到对应专家卡。
- **通信模式**：All-to-All（每 token 可能去任意专家），与 TP 的 AllGather / ReduceScatter 不同。
- **负载均衡**：专家热度不均，需要 **Expert Parallelism Load Balancing** 调度器动态调整。

**工业实证**：**Meta Llama 3.1 405B** —— 24K H100 + 3D 并行 + FSDP + 54 天训练，是开源 LLM 的标杆。**DeepSeek V3** —— 自研 DualPipe + Expert Parallel + FP8 混合精度，训练 2.788M H800 小时，成本 550 万 USD（极低）。**阿里 PAI 通义千问 Qwen 2.5** —— 万卡 H100/A100 + 3D 并行 + 自研 FSDP 实现。**Anthropic Claude 3.5 / 3.7** —— 训练集群规模未公开，但行业猜测含数十万 H100 + Trainium 组合。**Google Gemini 1.5 / 2.0** —— 用 TPU v5p Pod + Multislice 训练，4096 芯片级 Pod 利用率 70%+。

**3. 常见陷阱**

- **混淆 DDP 与 TP。** DDP 是「**每卡一份完整模型 + 切数据**」，TP 是「**切模型 + 协同算**」。前者卡间通信是 AllReduce 梯度，后者每层都要 AllGather / ReduceScatter。
- **以为 PP 越多越好。** PP 的气泡开销与 stage 数相关——stage 越多，气泡越大。**经验值**：PP stage 数 ≤ 模型层数 / 10。
- **忽略 NVLink 拓扑。** 张量并行必须跑在 NVLink 域内（单机 8 卡），跨机做 TP 通信瓶颈严重，**TP 通常限制单机**。
- **盲目用 FSDP 加速小模型训练。** FSDP 对 7B 模型反而比 DDP 慢，因为额外通信开销。**FSDP 适合 13B+ 模型**。
- **混淆 ZeRO-3 与 FSDP。** 二者本质等价，但 FSDP 是 PyTorch 原生（与 torch.compile / Dynamo 集成更好），ZeRO-3 是 DeepSpeed 实现（生态成熟、调参灵活）。
- **MoE 模型用 TP 切专家。** MoE 专家并行是 **All-to-All**，不是 TP 的 AllGather——必须用专门的 MoE 训练框架（DeepSpeed-MoE / Megatron-Core + 专家并行）。

**4. 追问预测**

- **「70B 模型训练最少需要多少卡？」** 答：用 FSDP + TP=8 + Activation Checkpointing，单机 8 卡 H100 80GB 可以启动训练（batch size 1），但效率低；推荐 **2-4 机 16-32 卡**做 TP×DP，性能最优。
- **「3D 并行的最优配比怎么定？」** 答：先确定总卡数 N，再分三层：(1) TP 受 NVLink 限制为 8（单机）；(2) PP 受气泡约束为 4-16（看模型深度，70B 通常 8 stage）；(3) DP = N / (TP × PP)。Llama 405B：TP=8 / PP=16 / DP=192 = 24576 卡。
- **「断点续训（Resume Training）怎么做？」** 答：保存 **DDP 状态**（model + optimizer + scheduler + step + dataloader state）+ **PP 切分位置** + **FSDP 分片 metadata** 到并行文件系统（GPFS / JuiceFS），每 N 步保存一次，加载时必须用相同并行配置。Meta Llama 405B 每 30 分钟保存一次，30 秒内可恢复。
- **「通信瓶颈怎么诊断？」** 答：用 **NSight Systems / NCCL Debug** 看 AllReduce / AllGather 时间占比；若超过 30%，意味着通信是瓶颈，方案：换 NVLink / InfiniBand、检查 NCCL 版本、减少 PP / TP 规模。
- **「MoE 训练和 Dense 训练的关键区别？」** 答：MoE 多一层 **All-to-All 专家路由** + **负载均衡**（专家热度不均），通信模式从 TP 的点对点变成跨卡全互联；DeepSeek V3 的 DualPipe 把 All-to-All 与 TP/PP 通信重叠，通信利用率提升 2-3 倍。

**5. 参考资料**

- Meta AI《Llama 3.1 405B 技术报告》（公开版）——24K H100 + 3D 并行 + FSDP 的完整工程细节，是本题最权威的工业案例。
- Microsoft DeepSpeed 官方文档与 DeepSpeed-MoE 仓库——ZeRO-1/2/3 + MoE 训练的工业实现。
- NVIDIA Megatron-LM 仓库——张量并行 + 流水并行的标准实现，是 TP/PP 的权威参考。
- PyTorch FSDP 官方文档——FSDP 调参、Activation Checkpointing、CPU Offload 的最佳实践。
- DeepSeek V3 技术报告——MoE + FP8 + DualPipe 的极致工程优化，2.788M H800 小时训练成本仅 550 万 USD，是 MoE 训练的国产标杆。
- **阿里 PAI 通义千问 Qwen 2.5 训练** —— 万卡 H100 + 3D 并行 + 自研 FSDP，72B 模型单次训练成本 < 200 万 USD，是国产 LLM 训练的代表。
- **Google Gemini 1.5 / 2.0** —— TPU v5p Pod + Multislice 训练 4096 芯片级，MoE 架构 + 多模态一体训练，是闭源 LLM TPU 路线的代表。
- **Anthropic Claude 3.5 / 3.7 训练** —— 行业猜测含数十万 H100 + Trainium 组合，是闭源 LLM 算力规模的标杆。
- **月之暗面 Kimi K2 / 阶跃 Step-2 / 智谱 GLM-4** —— 国产闭源 / 半开源 LLM，用国产 + NVIDIA 混合集群训练，是国产 LLM 算力多元化的代表。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §9.1.3 LLM 推理服务中，PagedAttention / Continuous Batching / 投机解码（Speculative Decoding）/ INT4 量化各自的优化原理是什么？组合使用能把单卡吞吐提升多少倍？

**1. 考察点**

- 是否理解 LLM 推理的**两个阶段瓶颈**——Prefill（计算密集）vs Decode（IO/显存密集），对应不同的优化策略。
- 能否说清 PagedAttention 解决「**KV Cache 显存碎片化**」、Continuous Batching 解决「**请求内气泡**」、Speculative Decoding 解决「**串行解码**」、INT4 量化解决「**显存与算力折中**」的工程含义。
- 是否知道 vLLM / TensorRT-LLM / TGI / SGLang 等推理引擎的差异化定位。
- 加分项：能给出具体场景的优化组合案例（如 70B 模型在 H100 上 INT4 + Speculative + PagedAttention 的吞吐数据）。

**2. 参考答案框架**

**第一层：先理解 LLM 推理的两个阶段。** Transformer 自回归解码有完全不同的瓶颈：

- **Prefill 阶段**：一次处理整条 prompt（如 1024 token），算力密集——GEMM 占主导，GPU 利用率高，对延迟不敏感。
- **Decode 阶段**：逐 token 生成，每 token 都要读 KV Cache——IO / 显存带宽密集，GPU 算力利用率极低（典型 5-15%）。

一张 H100 80GB 跑 70B 模型（FP16）：

- 模型权重占 140 GB → 必须张量并行到 2 卡（80GB × 2 = 160GB）。
- KV Cache：每 token 占 `2 × num_layers × num_heads × head_dim × dtype_size` = 2 × 80 × 64 × 128 × 2 byte ≈ **2.5 MB / token**。
- 单请求 32k 上下文：32k × 2.5 MB ≈ 80 GB——单卡显存被 KV Cache 占满。

**第二层：四大优化技术原理。**

- **PagedAttention（vLLM，2023）**：把 KV Cache 类比 OS 虚拟内存「分页」管理——把 KV Cache 切成固定大小 page（如 16 token / page），显存按需分配，避免传统连续分配带来的内部碎片。**收益**：显存利用率从 30-40% 提升到 80%+，吞吐量提升 2-4 倍。
- **Continuous Batching（vLLM / TGI / TensorRT-LLM）**：传统 static batching 必须等所有请求生成完才换下一批，**气泡时间占比 30-50%**。Continuous Batching 在每一步解码后动态插入新请求，**气泡时间吞吐 5-20 倍**。这是 LLM 推理吞吐提升最大的单项技术。
- **Speculative Decoding（投机解码）**：用小模型（如 7B）快速生成 K 个候选 token，大模型（70B）一次 verify K 个——如果接受率高，可以一次前进 K 步，**串行解码加速 2-4 倍**。代表方法：EAGLE、Medusa、Lookahead Decoding、DeepMind SpecDec。
- **INT4 / FP8 量化**：把 FP16 模型量化到 INT4（AWQ / GPTQ）或 FP8（H100 原生），显存减半 / 减半，算力在 H100 上 2x 加速。**代价**：精度损失约 1-3%（PPL 略升），需要校准数据集。

**第三层：组合使用的工程收益。** 以 70B 模型在单卡 H100 上推理为例（假设张量并行 2 卡 / INT4 量化 + vLLM）：

- **基线**：FP16 + static batching，约 **30 tokens/s**。
- **+ Continuous Batching**：约 **150 tokens/s**（5 倍）。
- **+ PagedAttention**：约 **300 tokens/s**（再加 2 倍）。
- **+ INT4 量化**：约 **500 tokens/s**（再加 1.7 倍，单卡可装下 70B 不用张量并行）。
- **+ Speculative Decoding**：约 **1500 tokens/s**（再加 3 倍）。

**组合优化后总收益**：从 30 tokens/s 提升到 1500 tokens/s，**单卡吞吐提升约 50 倍**。这是 vLLM 1.0+ 工程优化的真实水平。

**第四层：推理引擎的差异化定位。**

| 引擎 | 出品方 | 核心特性 | 适用场景 |
| --- | --- | --- | --- |
| **vLLM** | UC Berkeley | PagedAttention + Continuous Batching | 通用 LLM 推理、生产首选 |
| **TensorRT-LLM** | NVIDIA | FP8 + 算子融合 + NVIDIA GPU 深度优化 | NVIDIA GPU 极致性能 |
| **TGI（Text Generation Inference）** | Hugging Face | Rust 核心 + Continuous Batching | Hugging Face 生态集成 |
| **SGLang** | UC Berkeley | RadixAttention + 结构化生成 | 多轮对话 + Function Calling |
| **LMDeploy** | 上海人工智能实验室 | 国产 LLM 推理优化 + TurboMind | 国产 LLM + NVIDIA / 昇腾 |
| **DeepSpeed-MII** | Microsoft | DeepSpeed 推理优化 + 0 冗余优化器 | 微软 Azure 集成 |

**第五层：冷启动与延迟优化。** Continuous Batching 解决吞吐，但**首 token 延迟（TTFT）**和**流式延迟（ITL）**仍是用户体验关键：

- **TTFT 优化**：减少 Prefill 时间（计算密集）——用 FlashAttention、Long Context 处理（paged + sliding window）、Prompt Cache。
- **ITL 优化**：减少 Decode 时间——Speculative Decoding、Quantization、Batch Decoding。
- **冷启动优化**：Serverless Inference 场景下，首请求延迟受模型加载时间影响——用 **Persistent Container + Model Cache + Warm Pool** 把冷启动压到 < 1s。

**第六层：工业实证。** **OpenAI GPT-4o / o1** —— 闭源，疑似 Multi-model + Continuous Batching + Speculative Decoding + 自研芯片（可能含 Trainium 协处理）。**Anthropic Claude 3.5 / 3.7** —— 自研推理优化 + Trainium / H100 混合，单卡吞吐业界领先。**Meta Llama 3.1 405B 推理** —— 单卡 FP4 量化可跑，vLLM 推理 P99 < 200ms。**字节豆包 / 阿里通义 / 智谱 GLM-4** —— 用 vLLM / LMDeploy 国产推理引擎，单卡吞吐对标 OpenAI 同规格 70%-80%。

**3. 常见陷阱**

- **混淆 PagedAttention 与 FlashAttention。** 前者是 **KV Cache 显存分页**（vLLM 提出），后者是 **Attention 计算 IO 优化**（Tri Dao 提出）——前者管显存，后者管算力。
- **以为 Continuous Batching 等价于 Dynamic Batching。** 传统 dynamic batching 是「batch 内所有请求同步前进」，仍有气泡；Continuous Batching 是「每个 step 独立调度，可增删请求」。
- **盲目追求量化精度损失最小。** INT4 量化损失 1-3% PPL，但业务侧 **A/B 实验**后实际业务指标差异 < 1%——量化 ROI 通常远大于精度损失。
- **混淆 Speculative Decoding 与 Multi-Token Prediction。** 前者用独立 draft 模型，后者用主模型自身的 head——前者通用，后者只适用训练过的模型。
- **首 token 延迟只看模型加载。** 实际 TTFT = 排队 + Prefill + 启动，首请求排队可能 > 10s；必须配**请求队列 + 优先级调度**。

**4. 追问预测**

- **「Speculative Decoding 的接受率不高会怎样？」** 答：若接受率 < 50%，反而比正常解码慢——因为 draft 模型白算了。需要根据场景动态调整 draft token 数（3-10 个），或训练专用的 draft 模型（如 EAGLE 用主模型 hidden state）。
- **「INT4 量化后线上精度掉得厉害怎么办？」** 答：先用 **AWQ（激活感知权重量化）** 而非 GPTQ；保留 5-10% 「敏感层」为 FP16（**Mixed Quantization**）；在业务侧做 **A/B 实验**对比 INT4 vs FP16 实际指标；用 **QAT（Quantization-Aware Training）** 微调保持精度。
- **「MoE 模型的推理优化有什么特殊点？」** 答：MoE 推理时只有激活专家参与计算（37B 激活 / 671B 总参），KV Cache 与激活都按激活专家数算——**比同规模 Dense 模型节省 5-10 倍算力**。但 All-to-All 专家路由仍是瓶颈，需要专门优化（如 SGLang 的 RadixAttention + 专家缓存）。
- **「长上下文（128k+）推理怎么做？」** 答：用 **Sliding Window Attention**（Mistral）+ **Ring Attention**（跨设备 KV Cache 分片）+ **PagedAttention**（显存分页）；避免把 128k KV Cache 全装在单卡——典型做法是按 head / layer 切到多卡。
- **「推理成本能优化到什么程度？」** 答：从基线 FP16 + static batching 到 INT4 + Speculative + PagedAttention + Continuous Batching，**单 token 成本可降低 10-30 倍**。字节豆包自研推理优化后，单 token 成本约 OpenAI 同规格的 1/5-1/3。

**5. 参考资料**

- vLLM 官方论文《PagedAttention: Virtual Memory for LLM Serving》（SOSP 2023）——PagedAttention 与 Continuous Batching 的原始论文。
- Tri Dao《FlashAttention》系列论文——FlashAttention / FlashAttention-2 / FlashAttention-3 的原始论文与算子优化。
- Yaniv Leviathan 等《Speculative Decoding》论文——投机解码的原始论文。
- NVIDIA TensorRT-LLM 官方文档——FP8 + 算子融合的工业实现。
- DeepMind SpecDec 论文与 EAGLE 论文——投机解码的最新进展。
- **OpenAI GPT-4o / o1 推理** —— 闭源，工业界推理优化的天花板；用 Multi-model + Speculative + 自研芯片。
- **Anthropic Claude 3.5 / 3.7 推理** —— 自研推理优化 + Trainium / H100 混合，延迟与吞吐业界领先。
- **Meta Llama 3.1 405B 推理** —— 用 vLLM + FP4 量化 + 2-4 卡张量并行，单 GPU 可跑 405B 模型。
- **字节豆包推理** —— 自研 vLLM 改进版 + 量化，单 token 成本约 OpenAI 同规格的 1/5-1/3。
- **智谱 GLM-4 / 月之暗面 Kimi / 阶跃 Step-2** —— 国产闭源 / 半开源 LLM 推理平台，国产 + 国产推理引擎的代表。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §9.1.4 在万卡 GPU 集群中，如何设计 AI 算力调度器？为什么 Kubernetes 默认调度器不满足分布式训练，Gang Scheduling / 拓扑感知 / 抢占式调度各自解决什么痛点？

**1. 考察点**

- 是否理解 K8s 默认调度器对 GPU 的**根本短板**——不感知拓扑、不支持协同调度、抢占粒度粗。
- 能否说清 Volcano / KubeRay / YARN / Slurm 四大调度器的**差异化定位**与适用场景。
- 是否知道 Gang Scheduling（协同调度）、Topology-Aware Scheduling（拓扑感知）、Preemption（抢占）三大核心机制的工程含义。
- 加分项：能给出真实场景的调度参数（队列配比、抢占优先级、拓扑亲和性规则）。

**2. 参考答案框架**

**第一层：先定义问题——K8s 默认调度器为什么不够。** K8s 默认调度器对 AI 任务有三个根本缺陷：

- **不感知 GPU 拓扑**：8 卡 H100 节点的 NVLink 是内部 900 GB/s 互联，但 K8s 默认只看「几卡」，不看「这些卡是不是同一节点的同 NVLink 域」。结果 8 卡分布式训练被分配到 8 个不同节点，通信退化为跨机网络（10-100 GB/s），**训练慢 5-10 倍**。
- **不感知协同调度**：分布式训练必须「**N 卡同时启动**」才能跑，K8s 默认调度会让「先分配到 N-1 卡、后卡永远排不到」的队头阻塞（**TCP-style deadlock-like waiting**）。
- **抢占粒度粗**：K8s 抢占是整 Pod 抢占，不能「**先抢 1 卡、保留其他 N-1 卡**」；对推理 + 训练混部场景，**整 Pod 抢占会中断线上推理**。

**第二层：四大调度器的差异化定位。**

| 调度器 | 出品 | 核心特性 | 适用场景 |
| --- | --- | --- | --- |
| **Volcano** | 华为云开源 | Gang Scheduling + Fair Share + Queue + Topology-Aware | 通用 AI / 大数据 / K8s 原生 |
| **KubeRay** | Anyscale + 社区 | Ray on K8s + Actor 调度 + 分布式训练感知 | Ray 生态 / 分布式训练 |
| **YARN** | Hadoop 原生 | Capacity Scheduler + Fair Scheduler + Label-based | 大数据 + AI 混部 / 传统大厂 |
| **Slurm** | HPC 社区 | Backfill + Topology-Aware + Multi-Cluster | 超算 / 国家级 AI 平台 / Slurm 老用户 |

**第三层：三大核心机制的工程含义。**

- **Gang Scheduling（协同调度）**：把分布式训练任务的「所有 Pod」当一个 Gang 整体调度——**要么全部分配、要么全部分配失败、不会部分分配**。Volcano 通过 `podgroup` 资源 + `minMember` 字段实现。**典型场景**：8 卡 DDP 训练，必须 8 卡同时启动，否则 NCCL 通信初始化失败。
- **Topology-Aware Scheduling（拓扑感知）**：调度时考虑 GPU 的物理拓扑（NVLink 域 / PCIe 通道 / InfiniBand 域）。Volcano / Slurm 都支持。**优先级规则**：同节点 > 同机柜 > 同可用区 > 跨可用区。**典型场景**：张量并行限制在单机 8 卡（NVLink），数据并行可跨机（InfiniBand）。
- **Preemption（抢占式调度）**：低优先级任务可被高优先级抢占。K8s 原生 `PriorityClass` + Volcano 扩展实现。**典型策略**：推理任务优先级 > 训练任务；P0 训练任务优先级 > P1 训练；被抢占任务回到队列队头，**不丢失进度**（断点续训配合）。

**第四层：典型架构——Volcano 调度 AI 任务的 4 层。**

```
[业务方提交训练任务] 
    ↓
[Volcano Queue（队列）] → 配额管理 / 公平调度
    ↓
[Volcano PodGroup（Gang）] → 协同调度 / 最小成员数
    ↓
[Scheduler Framework] → Gang / Topology / Binpack / DRF
    ↓
[Scheduler Plugin] → gpu / mig / topology / sla / capacity / overcommit
    ↓
[Node（GPU）] → NVLink 域 / InfiniBand 域 / MIG 实例
```

**第五层：混部（Co-location）的工程化。** 头部厂商的真实做法是**训练 + 推理 + 离线作业混部**：

- **训练任务**：占用整卡（或 MIG 实例），优先级 P1，可被 P0 抢占。
- **推理任务**：占用 MIG 实例（如 1g.5gb），优先级 P0，不可被抢占。
- **离线作业**：占用剩余 CPU / 内存 / 空闲 GPU 时间片，优先级 P2。
- **资源隔离**：用 **NVIDIA MPS** + **CPU Manager** + **Memory QoS** 做硬隔离，避免相互干扰。
- **调度器协同**：Volcano Queue + PriorityClass + 自研 capacity plugin 实现精细化配额。

**第六层：工业实证。** **阿里云 PAI 灵骏** —— Volcano 增强版 + 自研 topology 插件，支撑万卡集群训练，调度延迟 < 30s。**字节 ByteFSDP / 机器学习平台** —— 自研调度器（类似 Volcano）+ Ray on K8s，训练任务排队 < 5 分钟。**Google TPU v5p Pod + Multislice** —— 4096 芯片级 Pod 调度器，跨机柜协同调度，训练利用率 70%+。**Meta Llama 3.1 405B** —— 自研调度器 + 24K H100 集群，调度效率业界领先。

**3. 常见陷阱**

- **把 Gang Scheduling 当成「先来先服务」。** Gang 是「**全或无**」语义，不是 FIFO。
- **忽略拓扑亲和性的代价。** 拓扑感知调度会让集群碎片化——必须配 **Binpack 策略**让碎片集中；同时配置 **Descheduler** 定期重平衡。
- **抢占不配合断点续训。** 没有断点续训的抢占 = 数据丢失；训练任务必须每 N 步保存 Checkpoint 到并行文件系统。
- **K8s 默认调度器直接用于大模型训练。** 8 卡 DDP 训练在默认 K8s 上 50% 概率失败（部分 Pod 排不到），**必须用 Volcano / KubeRay 替换默认调度器**。
- **混部不隔离导致线上推理抖动。** 推理任务被训练干扰 → 用户感知卡顿；必须用 **MIG + 资源 QoS + cgroup 隔离**。

**4. 追问预测**

- **「Volcano 和 KubeRay 怎么选？」** 答：用 Ray 做分布式训练 / RL / 数据处理选 KubeRay；用 PyTorch DDP / DeepSpeed / 自研训练选 Volcano。两者也可组合（Volcano 调度 Gang，KubeRay 管理 Ray Cluster）。
- **「调度延迟怎么压？」** 答：四个优化——(1) Gang 调度优化（minMember 准实时检查）；(2) 拓扑预计算（缓存常用拓扑组合）；(4) 调度决策异步化（plugin 并行执行）；(4) 预测性调度（提前预留资源）。阿里 PAI 调度延迟 < 30s。
- **「Slurm 和 K8s 怎么选？」** 答：超算 / 国家级 AI 平台选 Slurm（拓扑感知最强）；互联网公司 + 云原生选 K8s + Volcano（生态成熟）；HPC + 云原生融合场景可考虑 **K8s + Volcano + Slurm bridge**。
- **「跨集群调度怎么做？」** 答：用 **Karmada / Volcano Multi-Cluster / Cluster API** 做跨集群调度；调度器抽象 Global Queue + Local Scheduler 两级调度。CoreWeave / Lambda Labs 等 GPU 云厂商用类似架构支持多地域 GPU 池化。

**5. 参考资料**

- Volcano 官方文档与 GitHub 仓库——K8s 增强调度器的工业实现，Gang Scheduling / Fair Share 的标准实现。
- KubeRay 官方文档——Ray on K8s 的标准实现，分布式训练 + RL 场景的首选。
- Slurm 官方文档——HPC 老牌调度器，超算 / 国家级 AI 平台的事实标准。
- NVIDIA GPU Operator 官方文档——K8s 上 GPU 设备插件、MIG、Time-Slicing 的标准集成。
- **阿里云 PAI 灵骏** —— Volcano 增强版 + 自研 topology 插件，支撑万卡集群训练，调度延迟 < 30s。
- **字节 ByteFSDP / 机器学习平台** —— 自研调度器 + Ray on K8s，推理 GPU 利用率 40% → 75%。
- **Google TPU v5p Pod + Multislice** —— 4096 芯片级 Pod 调度器，跨机柜协同调度。
- **AWS SageMaker / HyperPod** —— 端到端 ML 平台 + 集群调度，自研调度器支撑 EC2 GPU 池化。
- **Microsoft Azure ML** —— 端到端 ML 平台 + ND H100 v5 集群调度，与 OpenAI 算力基础设施同源。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开文档、官方仓库或企业公开技术博客。精确链接待联网环境补全。

---

#### §9.1.5 LLM 推理成本居高不下（月产 200 万 USD），如何系统性地把单 Token 成本压到 1/10？请从量化 / 投机解码 / 缓存 / 模型路由 / Serverless 五个维度拆解。

**1. 考察点**

- 是否理解 LLM 推理成本的**结构性原因**——70B 模型 FP16 单 token 算力成本约 OpenAI 公开定价的 50-100 倍。
- 能否从「**单 token 算力成本 × QPS × 月调用量**」三层分解成本，并对应优化手段。
- 是否知道量化 / 投机解码 / 缓存（KV Cache 复用 / 语义缓存）/ 模型路由 / Serverless 五个维度的**独立收益与组合收益**。
- 加分项：能给具体的成本模型（如「日均 1 亿 token / 月成本 X USD / 优化后 Y USD」）。

**2. 参考答案框架**

**第一层：先量化成本结构。** LLM 推理成本 = **单 token 算力成本 × QPS × 调用时长**。以 70B 模型、H100 集群、月调用量 1 亿 token 为例：

- **裸推理（PyTorch + FP16 + static batching）**：单 token 算力成本约 `0.0001 USD/token`；月成本 `1e8 × 0.0001 = 10,000 USD`（万级）。
- **优化后（vLLM + INT4 + Speculative + Cache + Routing）**：单 token 算力成本约 `0.00001 USD/token`；月成本 `1,000 USD`（千级）。
- **加上 KV Cache 复用**：重复请求（如同一 Prompt 模板）从 80% 命中下降到 5%，月成本进一步压缩。

**第二层：五个优化维度的独立收益。**

| 优化维度 | 原理 | 收益倍数 | 工程代价 |
| --- | --- | --- | --- |
| **INT4 / FP8 量化** | FP16 → INT4 / FP8，显存 + 算力减半 | 1.5-2x 吞吐 | 精度损失 1-3%（需 AWQ / QAT） |
| **Speculative Decoding** | 小模型 draft + 大模型 verify | 2-4x 加速 | 需训练 / 选择 draft 模型 |
| **KV Cache 复用** | 同 prefix 请求复用 KV Cache（如 system prompt） | 5-10x（命中场景） | 工程复杂度高（RadixAttention） |
| **语义缓存** | 同语义请求复用结果（如 FAQ） | 10-100x（命中场景） | 需 Embedding + 向量库 |
| **模型路由（小模型优先）** | 简单任务用 7B、复杂任务用 70B | 3-5x（混合负载） | 需任务分类器 |

**第三层：组合使用的工程收益。** 五段式场景化优化（按场景优先级组合）：

- **场景 A：高频同 prefix 请求（如 system prompt + few-shot）**：KV Cache 复用（RadixAttention）+ Continuous Batching——**单 token 成本降低 10-20 倍**。
- **场景 B：FAQ / 客服类请求**：语义缓存（命中直接返回）+ 小模型（7B）——**单 token 成本降低 100 倍**。
- **场景 C：复杂推理请求（数学 / 代码 / 长文）**：投机解码 + INT4 量化 + 模型路由（先 7B 试探，超时转 70B）——**单 token 成本降低 5-10 倍**。
- **场景 D：弹性突发流量（白天高峰 / 夜间低谷）**：Serverless Inference + Spot GPU + 弹性伸缩——**非高峰时段成本降低 5-10 倍**。

**第四层：Serverless Inference 的成本计算。** Serverless 把「**GPU 永远在线**」变成「**按调用付费**」：

- **AWS Lambda + SageMaker**：按调用次数 + 调用时长计费，冷启动 1-5s。
- **Modal / Replicate**：按 GPU 实例 × 调用时长计费，按秒粒度。
- **阿里 PAI EAS Serverless**：按 QPS × 时长计费，国产化首选。
- **冷启动优化**：Persistent Container + Model Warm Pool + Snapshot 加载（vLLM 支持）——冷启动压到 < 1s。

**第五层：成本监控与 FinOps。** 把成本治理落到工程化：

- **按团队 / 项目计费**：每个推理请求打 team_id / project_id tag，按 token 数 × 单价计入对应团队。
- **实时成本看板**：Grafana + 自研 cost exporter，按小时 / 天展示 `team_id → 成本`。
- **告警与配额**：单团队月预算告警、超过配额自动降级（路由到小模型）。
- **模型 ROI 评估**：每模型贡献的业务价值（GMV / CTR / 用户满意度）/ 算力成本，淘汰 ROI 低的模型。

**第六层：工业实证。** **OpenAI / Anthropic 闭源 API** —— 综合使用 INT4 + Speculative + Cache + Routing，单 token 公开定价约 `0.000003-0.000015 USD/token`（GPT-4o / Claude 3.5）。**字节豆包 / 阿里通义** —— 自研推理优化后，单 token 成本约 OpenAI 同规格的 1/5-1/3。**Modal / Replicate** —— Serverless GPU 推理，初创公司月成本从自建 GPU 的 50,000 USD 降到 Serverless 的 5,000-15,000 USD。**AWS Inferentia 数字** —— Trainium 推理成本比 NVIDIA 同规格低 30-50%，Spot GPU 进一步降 60-90%。

**3. 常见陷阱**

- **只看单 token 算力成本不看 QPS。** 单 token 成本降低 10x，但 QPS 涨 5x，实际成本只降一半——必须看**总成本**。
- **把量化当成「免费」。** INT4 量化需要校准数据集 + 业务 A/B 实验，工程投入 > 1 人月；精度损失可能在某些场景 > 5%（如长文本数学）。
- **忽略冷启动成本。** Serverless Inference 在低 QPS 场景反而更贵（冷启动 1-5s，每次启动都要付出 token 数计费）。
- **不做语义缓存的命中率监控。** 命中率 < 50% 的语义缓存 ROI 为负——必须监控命中率、动态调整阈值。
- **盲目追求小模型路由。** 简单任务用 7B，但分类错误会让用户体验崩；必须配**任务分类器 + 置信度阈值 + fallback 大模型**。

**4. 追问预测**

- **「语义缓存的命中率怎么提升？」** 答：(1) 调整 Embedding 模型（领域微调）；(2) 调相似度阈值（cosine 0.85-0.95）；(3) 多级缓存（精确匹配 → 模糊匹配 → Embedding）；(4) Cache 预热（高频请求提前写）。
- **「Spot GPU 风险怎么控？」** 答：Spot 会被 AWS / 云厂商随时回收——必须配**检查点 + 快速重启 + 多 AZ 备份**；训练任务不适用 Spot（损失 Checkpoint），推理任务适合 Spot（无状态）。
- **「模型路由的分类器怎么做？」** 答：可用小 LLM（如 7B）做意图分类，或用规则（关键词 + 长度 + 复杂度评分）；准确率 > 90% 才建议上线，否则宁可全用大模型。
- **「FinOps for AI 和传统 FinOps 的区别？」** 答：传统 FinOps 管 IaaS / PaaS 资源（CPU / 内存 / 存储），按月付；FinOps for AI 管 GPU + 模型 + 推理 QPS，按 token / 推理时长 / 模型版本计费——粒度更细、变化更快。
- **「推理成本占 AI 项目总成本的比例？」** 答：典型 AI 项目成本 = 训练成本（一次性，占 30%）+ 推理成本（持续性，占 60%）+ 数据 / 标注（占 10%）。**推理成本是 AI 项目的最大持续支出**，必须重点治理。

**5. 参考资料**

- vLLM 官方文档关于 PagedAttention + Continuous Batching + Speculative Decoding 的成本模型——单 token 成本优化的工程基线。
- Anthropic Claude API 定价文档与公开技术博客——闭源 LLM 推理成本优化的代表。
- Modal / Replicate 公开博客——Serverless GPU 推理的成本模型与冷启动优化。
- AWS Inferentia / Trainium 官方文档——自研芯片推理的定价与 ROI 数据。
- **OpenAI GPT-4o / o1 推理定价** —— 闭源 API 定价天花板，token 单价公开透明。
- **Anthropic Claude 3.5 / 3.7 推理** —— 闭源 API，自研推理优化 + 自研芯片。
- **字节豆包 / 阿里通义 / 智谱 GLM-4** —— 国产 LLM 推理，单 token 成本约 OpenAI 同规格的 1/5-1/3。
- **月之暗面 Kimi / 阶跃 Step-2** —— 国产闭源 LLM 推理，成本治理工业实践的代表。
- **CoreWeave / Lambda Labs / RunPod** —— GPU 云 + Serverless 推理服务，定价比云厂商低 30-60%。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上参考资料均指向公开文档、官方定价或企业公开技术博客。精确链接待联网环境补全。

---

#### §9.1.6 在等保 / 信创合规要求下，如何做国产 AI 算力适配？华为昇腾 / 寒武纪 / 海光 DCU 的软件栈成熟度如何？CUDA → CANN / MLU / ROCm 迁移路径是什么？

**1. 考察点**

- 是否理解国产 AI 算力适配的**合规驱动**——等保 2.0/3.0、《算法推荐管理规定》、信创要求（金融 / 政企 / 央企）。
- 能否对比华为昇腾（CANN）/ 寒武纪（MLU）/ 海光 DCU（ROCm 兼容）三大国产芯片的**软件栈成熟度**。
- 是否知道 CUDA → 国产软件栈的**迁移路径**（算子替换 / 框架适配 / 双栈部署）。
- 加分项：能给出真实迁移案例（如从 NVIDIA H100 迁移到昇腾 910C 的工程量、精度损失、性能损耗）。

**2. 参考答案框架**

**第一层：先定义问题——为什么必须国产化适配。** 国产化是**合规刚需 + 供应链安全**双重驱动：

- **合规**：金融 / 政企 / 央企必须满足等保 2.0/3.0 + 信创要求——AI 算力必须在国产芯片 / 国产服务器 / 国产 OS / 国产数据库上跑。
- **供应链安全**：H100 / H200 在 2022-2025 受出口管制约束，国内万卡集群面临「卡荒」；昇腾 910C / 寒武纪思元 590 / 海光 DCU 是国产替代主力。
- **成本考量**：国产卡单价比 H100 低 50-70%，但软件栈成熟度差距大。

**第二层：三大国产芯片 + 软件栈对比。**

| 厂商 | 芯片 | 算力（FP16） | 软件栈 | 生态成熟度 | 适用场景 |
| --- | --- | --- | --- | :---: | --- |
| **华为昇腾** | 910B / 910C | 910B: 780 TFLOPS / 910C: 940 TFLOPS | **CANN**（Compute Architecture for Neural Network） | **★★★★** | 训练 + 推理；国产 LLM 首选 |
| **寒武纪** | 思元 590 / 思元 690 | 590: 256 TFLOPS / 690: 512 TFLOPS | **MLU + Bang C** | **★★★** | 推理为主；训练需自研 |
| **海光 DCU** | Z100 / K100 | Z100: 24 TFLOPS / K100: 100 TFLOPS | **ROCm 兼容（DTK）** | **★★** | 兼容 CUDA 生态；推理 + 小模型训练 |

**第三层：CUDA → 国产软件栈的迁移路径。**

- **Step 1：抽象层适配**。在 PyTorch / TensorFlow 上加抽象层（如 **cGPU**、**torch_npu**、**flagscale**），让上层框架代码不改，下层根据硬件路由到不同运行时。
- **Step 2：算子替换**。把 CUDA kernel 替换为 CANN 的 Ascend C / MLU 的 Bang C / DCU 的 HIP。**核心算子**（GEMM、Attention、Softmax）优先替换；**辅助算子**（IO、padding）后置替换。
- **Step 3：分布式训练适配**。把 NCCL 替换为 **HCCL**（华为集合通信库）/ **CNCL**（寒武纪集合通信库）。3D 并行 + FSDP 在 CANN / MLU 上需要重新调优。
- **Step 4：推理引擎适配**。vLLM / TensorRT-LLM 需要加 CANN / MLU backend——目前 vLLM 已支持昇腾 NPU，社区版支持 MLU。
- **Step 5：性能调优**。包括算子融合、内存优化、通信优化——昇腾有 **Ascend C 图引擎**、寒武纪有 **MagicMind 推理引擎**。

**第四层：双栈部署的工程模式。** 国产化迁移的**现实路径**是**双栈 + 渐进迁移**：

- **双栈适配**：NVIDIA GPU（主力）+ 国产 NPU（信创 / 备份）共存，推理服务通过硬件路由（DCGM + 自研 router）分发。
- **渐进迁移**：先用国产卡跑推理（精度损失可控），再用国产卡跑小模型训练（70B 以下），最后用国产 GPU 跑大模型训练（200B+，昇腾 910C 是首选）。
- **混合集群**：NVIDIA + 昇腾 + 海光混合部署，训练任务按硬件能力路由。

**第五层：精度与性能损失的真实数据。** 这是国产化最敏感的工程问题：

- **训练精度**：昇腾 910C 训练 LLaMA-65B 精度与 H100 差距 < 0.5% PPL；寒武纪思元 590 训练 LLaMA-13B 差距 < 1%；海光 DCU Z100 训练 7B 差距 < 2%。
- **推理性能**：昇腾 910C 推理 LLaMA-70B INT8 单卡性能约为 H100 的 60-70%；寒武纪思元 590 推理 13B 单卡性能约为 H100 的 50-60%。
- **分布式训练**：昇腾 HCCL + 910C 万卡集群训练 LLaMA-72B，与 H100 + NCCL 集群性能差距 < 20%（2024-2025 进展）。

**第六层：工业实证。** **华为昇腾 + 盘古大模型** —— 华为云用昇腾 910C + CANN 训练盘古 LLM，国产化率 100%，是国内最大国产 AI 算力实践。**蚂蚁集团金融 AI 平台** —— 华为昇腾 + 自研图数据库 TuGraph + 自研推理引擎，国产化适配 100%，是金融行业国产化代表。**寒武纪 + 智谱 AI GLM-4** —— 思元 590 + 590 推理引擎，国产推理平台代表。**阿里 PAI + 灵骏 + 通义千问** —— 双栈适配（NVIDIA + 昇腾），国产化率 80%+。**海光 DCU + 月之暗面 Kimi / 阶跃 Step-2** —— 国产化推理的探索路径。

**3. 常见陷阱**

- **把「国产化」当成「替换 NVIDIA」。** 国产化是合规 + 供应链安全，不是性能替代——**昇腾 910C 算力约为 H100 的 70-80%，单卡推理性能约为 60-70%**，必须客观看待。
- **忽略软件栈成熟度。** 很多国产芯片硬件参数亮眼，但软件栈（CANN / MLU / DTK）文档不全、社区小、bug 多——**实际可用性 < 官方宣传**。迁移工程量远大于预期。
- **迁移前不做精度评估。** 浮点精度（FP16 vs BF16 vs INT8）差异、算子实现差异（reduce / softmax / attention）都可能导致模型精度损失 > 5%。**必须先跑精度评估，再做性能迁移**。
- **忽略集合通信库差异。** NCCL → HCCL / CNCL 不仅是 API 改名，**AllReduce / AllGather 的实现算法不同**，大规模分布式训练可能慢 20-50%。
- **不做双栈部署导致业务停服。** 国产化迁移必须**双栈并行**，避免「迁移期间业务停服」或「迁移后发现问题无回退」。

**4. 追问预测**

- **「昇腾 910C 和 H100 在训练 LLaMA-72B 上性能差距多大？」** 答：单卡性能约为 H100 的 60-70%；万卡集群训练周期约为 H100 集群的 1.3-1.5 倍。**差距在缩小**（2024 差距 2 倍 → 2025 差距 1.3 倍）。
- **「CUDA 代码迁移到 CANN 的工程量多大？」** 答：(1) 纯 PyTorch / Transformers 代码（无自定义 kernel）迁移成本约 1-2 人周，主要是环境配置 + 性能调优；(2) 含自定义 CUDA kernel 的代码迁移成本约 1-3 人月，需要算子重写 + 调试。
- **「国产推理能跑 LLaMA-405B 吗？」** 答：单卡昇腾 910C 跑不动（80GB 显存不够 405B FP16），需要 **多卡张量并行（4-8 卡 910C）+ 量化（INT4）**——精度可接受，性能约为 H100 集群的 50-60%。
- **「信创合规下能不能完全不用 NVIDIA？」** 答：合规上必须 100% 国产化（金融 / 央企），但实际生产中 **NVIDIA + 国产双栈**更常见——NVIDIA 跑前沿研发、国产跑生产部署。建议：核心研发保 NVIDIA + 信创生产用国产，双栈并行。
- **「国产软件栈未来 3-5 年的演进趋势？」** 答：CANN / MLU / DTK 软件栈成熟度会持续提升，**对标 CUDA 的可用性时间表是 2026-2028**；国产 LLM 训练 + 推理将逐步从「可用」走向「好用」。

**5. 参考资料**

- 华为昇腾官方文档与 CANN 仓库——CANN 软件栈的工业实现，对标 CUDA 的国产替代。
- 寒武纪官方文档与 MLU + Bang C 仓库——寒武纪 MLU 软件栈，工业落地较成熟。
- 海光 DCU 官方文档与 DTK 仓库——ROCm 兼容路线，国产软件栈第三条路径。
- 华为云盘古大模型公开技术材料——国产化 LLM 训练 + 推理的工业标杆。
- **华为昇腾 + 盘古大模型** —— 国产化率 100%，国内最大国产 AI 算力实践。
- **蚂蚁集团金融 AI 平台** —— 国产化适配 100%，金融行业国产化代表。
- **寒武纪 + 智谱 AI GLM-4** —— 思元 590 + 国产推理引擎，国产推理平台代表。
- **阿里 PAI + 灵骏 + 通义千问 Qwen** —— 双栈适配（NVIDIA + 昇腾），国产化率 80%+。
- **月之暗面 Kimi / 阶跃 Step-2** —— 探索国产 + 国产推理的多元化路径。
- **字节 ByteFSDP + 火山引擎** —— 部分国产化适配（推理用国产 + 训练主力 NVIDIA）。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。

> 注：以上参考资料均指向公开文档、官方仓库或企业公开技术博客。精确链接待联网环境补全。

---

### 8.3 本章小结

本节收录 6 道题，覆盖「AI 算力」能力域的六大主题，横切主题为**算力工程化与商业可持续**。六道题构成一条完整的下钻链路：**资源底座（MIG / 池化）→ 训练主线（DDP / TP / PP / ZeRO）→ 推理主线（PagedAttention / 量化 / Speculative）→ 工程枢纽（调度）→ 商业可持续（成本）→ 合规与供应链（国产化）**。

参考答题的通用心法：**先说清约束（算力 / 显存 / 通信 / 合规），再说清选项（多种并行 / 优化 / 调度 / 国产方案），最后说清取舍（性能 vs 成本 vs 合规）**。这一主题下的所有问题，面试官真正想听的都不是「你会几种技术」，而是「**为什么这么选，以及你能不能把 7B 跑到 H100 上、把 70B 跑到昇腾上、把 405B 跑到万卡集群上**」。

---

### 8.4 返回

- 返回 [01 AI 计算平台](../README.md)
