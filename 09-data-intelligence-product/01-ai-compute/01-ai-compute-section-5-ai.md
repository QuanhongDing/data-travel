> 本文件是 **01-ai-compute.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](01-ai-compute.md)。

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
