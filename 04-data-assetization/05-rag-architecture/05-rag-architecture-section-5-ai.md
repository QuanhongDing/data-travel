> 本文件是 **05-rag-architecture.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](05-rag-architecture.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：Modular → Agentic**

RAG 从「固定流水线」演进为「智能体决策」：

- 智能体自主决定「检索什么 / 调用什么工具」。
- 多轮检索 + 多步推理。
- 与 Tool Use 深度集成（Agent 内部循环）。

**方向 2：GraphRAG 工业化**

Microsoft GraphRAG（2024）引爆社区：

- 文档 → KG → 社区检测 → 摘要 → RAG。
- 擅长「宏观问题」「跨文档推理」。
- 2025 年出现 LightRAG、HippoRAG 等改进。

**方向 3：Self-RAG / CRAG 反思机制**

LLM 在生成中主动评估：

- Self-RAG：插入 `[Retrieve]` `[IsRel]` `[IsSup]` 反思 token。
- CRAG：检索后做可信度评估，不行就 Web fallback。
- FLARE（2023）：基于 LLM 置信度的主动重检索。

**方向 4：多模态 RAG**

图像 / 视频 / 音频 / 表格的检索增强：

- **图像 RAG**：CLIP / Qwen-VL 嵌入图像，向量检索图片。
- **视频 RAG**：视频抽帧 → CLIP → 帧向量检索。
- **音频 RAG**：Whisper 转文字 → 文本检索；或直接用音频嵌入。
- **表格 RAG**：Table-to-Text + 检索，或 SQL 查询。
- **PDF 多模态**：ColPali（2024）直接对 PDF 页面做多模态检索。

**方向 5：RAG + Fine-tuning 协同**

RAG 不能解决所有问题，组合方案：

- **RAFT**（2024）：RAG + 微调，让模型学会「何时忽略检索结果」。
- **Self-RAG 微调**：训练模型生成反思 token。
- **RA-DIT**（2024）：检索增强指令微调。

**方向 6：实时 RAG / 流式 RAG**

- 流式文档更新（Kafka → Embedding → 向量库）。
- 实时召回（Vector DB 毫秒级响应）。
- 长上下文 + 实时 RAG 组合。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**Vector RAG 的局限**：

- 相似度 ≠ 正确性。
- 无法处理精确匹配（型号、ID、日期）。
- 无法做多跳推理。
- 无法保证时效性。

**Hybrid RAG（三路召回）**：

```
[Vector Recall] ─┐
[BM25 Recall]  ─┼─→ [RRF 融合] → [Rerank] → [LLM]
[KG Recall]    ─┘
```

- 向量：语义近邻。
- BM25：精确关键词 / 实体。
- KG：关系推理 / 多跳。
- 融合：RRF（Cormack 2009）已是事实标准。

**GraphRAG 的崛起**：

Microsoft GraphRAG 是 2024 年最显著的进展：

- 文档 → LLM 抽 KG → Leiden 社区检测 → 社区摘要 → Local / Global Search。
- 适合「公司战略是什么」「所有项目进展」类宏观问题。
- 2025 年出现 LightRAG（轻量版）、HippoRAG（类脑版）。

**Agentic RAG 的成熟**：

- 2024 末：Agentic RAG 进入工业级。
- 2025：智能体框架（LangGraph、AutoGen、CrewAI）+ RAG 成为标配。

**Long Context RAG**：

- Gemini 1.5（1M-2M token）、Claude 3.5（200K）。
- 把整个文档库塞进 prompt，配合检索提升精度。
- 成本仍是瓶颈，需要分级使用。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **Self-RAG**（ICLR 2024）——反思 token + 训练。
- **CRAG**（ICLR 2024）——可校正 RAG。
- **GraphRAG**（Microsoft 2024）——KG + RAG 工业级。
- **Modular RAG**（GAIR Lab 2024）——模块化架构。
- **RAFT**（2024）——RAG + 微调。
- **HippoRAG**（2024）——类海马体 RAG。
- **LightRAG**（2024）——轻量 GraphRAG。
- **ColPali**（2024）——多模态文档检索。
- **RAGAS**（2024）——RAG 评估框架成熟。

**工业进展**：

- **LangChain 0.2+**（2024）——LangGraph 成为 Agent 框架。
- **LlamaIndex Workflows**（2024）——事件驱动的 RAG 框架。
- **OpenAI Assistants API + File Search**（2024）——内置 RAG。
- **Anthropic Claude + Tool Use + RAG**（2024-2025）——Agent + RAG 范例。
- **Google Vertex AI Search**（2024）——企业级 RAG。
- **阿里云百炼 + RAG**（2024）——国内 RAG 平台。
- **百度千帆 + RAG**（2024）——国内 RAG 平台。
- **腾讯混元 + RAG**（2024）——国内 RAG 平台。

### 5.4 未来 3-5 年趋势

1. **Agentic RAG 成为标配**：RAG 不再是「固定 pipeline」，而是 Agent 的核心工具。
2. **GraphRAG 工业化**：每个企业级 RAG 平台都会包含 KG 组件。
3. **多模态 RAG 主流化**：图像 / 视频 / 音频的检索增强成为标配。
4. **RAG 评估标准化**：RAGAS、TruLens 成为事实标准。
5. **RAG + Fine-tuning 协同**：单一方案难以解决复杂问题，组合方案是未来。
6. **长上下文 + RAG**：长上下文模型降低部分 RAG 需求，但精度仍需 RAG 补足。
7. **Self-improving RAG**：RAG 系统自主学习用户反馈，自动优化。
8. **隐私 + 合规**：本地化 RAG（Ollama + 本地向量库）成为合规首选。

---
