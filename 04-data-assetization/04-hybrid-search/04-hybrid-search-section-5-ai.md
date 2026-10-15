> 本文件是 **04-hybrid-search.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](04-hybrid-search.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：BGE-M3 类多功能 Embedding**

单模型同时输出 dense / sparse / colbert，简化架构：

- BGE-M3（BAAI 2024）。
- NV-Embed（NVIDIA 2024）。

**方向 2：Late Interaction 工业化**

ColBERTv2 / ColPali 普及：

- ColBERTv2：晚交互 SOTA。
- ColPali：晚交互用于多模态文档。

**方向 3：Agentic Hybrid Search**

智能体决定检索策略：

- LangGraph + 多工具。
- AutoGen + 检索决策。

**方向 4：Query Understanding 智能化**

LLM 深度参与：

- Query Rewrite。
- HyDE。
- Step-Back。
- Multi-Query（生成多个查询）。

**方向 5：多模态混合检索**

向量 + BM25 + OCR + ASR 融合检索。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

- **混合检索 + RAG**：混合检索是 RAG 的召回层。
- **混合检索 + 向量湖**：在大规模向量湖上做混合检索。
- **混合检索 + GraphRAG**：KG 召回 + 向量召回 + BM25 召回三路。
- **混合检索 + Agent**：Agent 工具调用多路召回。

### 5.3 学术与工业最新进展（2024-2025）

- **BGE-M3**（2024）—— 多功能 SOTA。
- **Cohere Rerank 3**（2024）—— 多语言 Rerank SOTA。
- **ColBERTv2**（2024）—— 晚交互 SOTA。
- **Vespa Hybrid Search**（2024）—— 一体化混合检索。
- **Weaviate Hybrid Search**（2024）—— 内置 RRF。
- **SPLADE++**（2024）—— 稀疏 + 扩展。
- **Jina Rerank**（2024）—— 多语言 Rerank。
- **LangGraph + Hybrid**（2024）—— Agent 驱动混合检索。

### 5.4 未来 3-5 年趋势

1. **「多功能 Embedding 成为默认」**：BGE-M3 / NV-Embed 类单模型覆盖。
2. **「Late Interaction 主流化」**：ColBERTv2 工业级部署。
3. **「Agentic Hybrid Search 普及」**：智能体决定检索策略。
4. **「融合算法标准化」**：RRF 成为事实标准。
5. **「多模态混合检索」**：向量 + BM25 + OCR + ASR 融合。

---
