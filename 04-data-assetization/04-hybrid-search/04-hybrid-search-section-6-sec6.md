> 本文件是 **04-hybrid-search.md** 的子文件（§6. 落地实践）。完整章节请回到 [index](04-hybrid-search.md)。

## 6. 落地实践

### 6.1 真实案例

**案例 1：某 SaaS 公司混合检索 RAG**

- 背景：百万级文档 RAG，单向量召回率 70%。
- 方案：向量 + BM25 + Reranker，RRF 融合。
- 工具：Milvus + Elasticsearch + Cohere Rerank 3 + LangChain。
- 结果：Recall@10 从 70% 提升到 95%，用户满意度提升 40%。

**案例 2：某电商客服 RAG**

- 背景：商品 + FAQ + 政策文档异构，召回不准。
- 方案：向量 + BM25 + 标签 + 元数据过滤。
- 工具：BGE-M3 + Elasticsearch + Cohere Rerank 3。
- 结果：客服一次解决率从 60% 提升到 85%。

**案例 3：某金融研报 RAG**

- 背景：研报 + 公告 + 新闻，需要精确匹配 + 多跳推理。
- 方案：向量 + BM25 + KG + Reranker。
- 工具：BGE-M3 + Elasticsearch + Neo4j + Cohere Rerank 3。
- 结果：研报问答准确率从 65% 提升到 90%。

**案例 4：某医院临床知识库**

- 背景：临床指南 + 病历 + 检验报告，召回率不足。
- 方案：BGE-M3 多功能 + Reranker + Late Interaction。
- 工具：BGE-M3 + Elasticsearch + BGE-reranker + ColBERTv2。
- 结果：临床问答准确率提升 35%。

### 6.2 踩坑与经验

**坑 1：融合权重难调**

- 现象：向量权重 0.6 / BM25 权重 0.4，凭感觉调。
- 解法：构建评测集，自动调权重（Optuna / DSPy）。

**坑 2：无 Reranker**

- 现象：粗排直接喂 LLM，噪声大。
- 解法：Top-100 召回 + Top-10 精排。

**坑 3：无元数据过滤**

- 现象：检索到过期 / 错权限文档。
- 解法：metadata-aware retrieval + 权限过滤。

**坑 4：Query 不优化**

- 现象：口语化问题检索失败。
- 解法：Query Rewrite / HyDE / Step-Back。

**坑 5：BM25 引擎选错**

- 现象：选 MongoDB 而不是 Elasticsearch，BM25 效果差。
- 解法：用专门 BM25 引擎（ES / OpenSearch / Meilisearch）。

**坑 6：精排模型选错**

- 现象：用 Cohere Rerank 跑中文，效果差。
- 解法：中文用 BGE-reranker，多语言用 Cohere Rerank 3。

**坑 7：忽视评测**

- 现象：凭感觉调参，效果不稳定。
- 解法：构建评测集 + Recall@K + A/B 测试。

**坑 8：成本失控**

- 现象：每次精排调用 Reranker 收费，成本爆炸。
- 解法：缓存 + 路由（简单问题不精排）。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（PoC，1-2 周）**：

1. 单一向量检索（LangChain + Milvus）。
2. 验证基本可行。

**1→10（业务化，1-3 个月）**：

1. 加 BM25 召回 + RRF 融合。
2. 加 Reranker。
3. 加元数据过滤。
4. 评测体系。

**10→100（企业级，3-12 个月）**：

1. 加 KG 召回。
2. Late Interaction（ColBERTv2）。
3. Agentic Hybrid Search。
4. 多模态融合。
5. AI 增强评测（LLM-as-Judge）。

### 6.4 ROI 评估

- **召回率**：从 70% 提升到 90%+。
- **用户满意度**：NPS 提升 30%+。
- **成本**：精排 + 缓存后单位查询成本可控。
- **业务影响**：一次解决率 / CTR / 转化率提升。

---
