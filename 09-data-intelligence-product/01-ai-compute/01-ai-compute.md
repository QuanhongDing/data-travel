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
| AI 计算平台 vs 数据中台 / Lakehouse 怎么选？ | §7 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：AI 计算平台（AI Compute Platform / MLOps Platform）是企业级「**AI 工程化基础设施**」，把模型从「数据科学家笔记本里的 .pkl 文件」变成「业务系统可调用的稳定服务」。它是云计算时代的中间层：底层是 IaaS（裸金属 / 虚拟机 / 容器），上层是业务应用（推荐 / 风控 / 智能问答 / Agent），平台层负责把「算力 + 数据 + 框架 + 模型 + 流程」打包成产品。

**工程定义**：AI 计算平台在数据架构师手里，是一份由 **6 层 + 12 子系统** 组成的能力矩阵：

- **第一层：基础设施**：GPU 池（NVIDIA H100 / A100 / 国产卡）、CPU 池、RDMA 网络、存储（并行文件系统 + 对象存储）。
- **第二层：资源调度**：Kubernetes / KubeRay / Volcano / YARN / Slurm。
- **第三层：训练框架**：PyTorch / TensorFlow / JAX + DeepSpeed / Megatron / FSDP + Ray / Horovod。
- **第四层：数据 / 特征**：数据湖 + Feature Store（Feast / Tecton / 阿里特征平台）+ 样本库（Sample Store）。
- **第五层：模型生命周期**：AutoML（FLAML / AutoGluon / NNI）、训练任务管理（Experiment Tracking + Workflow）、模型注册（Model Registry）。
- **第六层：服务 / 消费**：推理服务（TorchServe / Triton / vLLM / KServe）、Serverless Inference、模型市场（Model Marketplace）、LLM Gateway。

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
- **推理成本压力**：单条 LLM 调用 $0.01，QPS 1 万按整月摊开（$0.01 × 10⁴ × 约 2.6×10⁶ 秒/月 ≈ 2.6 亿美元）就是亿美元量级的月成本，必须有推理优化（量化 / 蒸馏 / 缓存）。
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
- 2015：TensorFlow 开源发布（Google），成为事实标准。
- 2015：Kubernetes 1.0 发布，AI 平台开始容器化。

**云原生阶段（2016-2020）**：

- 2016：MLOps 概念诞生；Databricks 于 2018 年 6 月开源 MLflow（实验追踪与模型注册的通用件）。
- 2017：Google TPU 2.0、AWS SageMaker 发布，云厂商深度学习服务起势。
- 2018：Uber Michelangelo（平台架构于 2017 年 9 月由 Uber 工程博客公开）、Facebook FBLearner Flow 等内部 AI 平台进入规模化，AI 平台内部化。
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

> 💡 **思考锚点**：算一下你自己的推理账单——单条调用成本 × 峰值 QPS，是否逼近 §1.2 那个「$0.01 × 1 万 QPS = 亿美元量级月成本」的量级？若逼近，再翻 §2.2 的 KV Cache 账：7B 模型 FP16 单 token 约 0.5 MB、32k 上下文约 16 GB，你靠 PagedAttention 或量化把这笔显存摊薄了没有——还是仍在按节点堆 GPU？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](01-ai-compute-section-3-sec3.md)
- [§4. 工程实现](01-ai-compute-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](01-ai-compute-section-5-ai.md)
- [§6. 落地实践](01-ai-compute-section-6-sec6.md)
- [§7. 与其他方法对比](01-ai-compute-section-7-sec7.md)
- [§8. 面试真题集](01-ai-compute-section-8-sec8.md)

---
