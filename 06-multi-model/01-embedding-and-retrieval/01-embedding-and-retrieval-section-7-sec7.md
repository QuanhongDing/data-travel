> 本文件是 **01-embedding-and-retrieval.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](01-embedding-and-retrieval.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | BM25 全文检索 | 传统 RAG（无 Rerank） | 向量检索 + Rerank | GraphRAG |
| --- | --- | --- | --- | :---: |
| 语义匹配 | 2 | 4 | **5** | 5 |
| 精确匹配 | **5** | 3 | 4 | 4 |
| 长文档 | 3 | 2 | **5** | 4 |
| 多语言 | 2 | 3 | **5** | 4 |
| 多模态 | 1 | 2 | **5** | 3 |
| 推理能力 | 1 | 2 | 3 | **5** |
| 可解释性 | **5** | 3 | 2 | 4 |
| 性能（亿级） | **5** | 4 | 4 | 3 |
| 工程门槛 | **5** | 3 | 3 | 2 |
| 工具成熟度 | **5** | 4 | **5** | 3 |

**结论**：

- **Embedding + Rerank 在「语义匹配、长文档、多语言、多模态、工具成熟度」5 项满分**。
- **Embedding + Rerank 在「精确匹配、可解释性、性能、工程门槛」4 项劣势**——Hybrid 检索 + Late Interaction 可弥补。

### 7.2 决策树

```
[AI 检索需求]
   │
   ├── 「精确关键词搜索 + 小规模」→ BM25（Elasticsearch）
   │
   ├── 「语义搜索 + 中等规模（百万级）」→ 向量检索 + Rerank ★
   │
   ├── 「长文档 / 法律 / 医疗检索」→ Late Interaction（ColBERT v2）
   │
   ├── 「跨语言 / 跨境业务」→ BGE-M3 / multilingual-E5 ★
   │
   ├── 「多模态（图搜 / 视频搜）」→ CLIP / Visualized BGE ★
   │
   ├── 「企业级 RAG（生产环境）」→ Hybrid + Rerank ★
   │
   ├── 「复杂推理 / 关系问答」→ GraphRAG ★
   │
   └── 「极致精度 + 高价值」→ 多级 Reranking（ColBERT + Reranker）★
```

### 7.3 组合使用

**组合 1：Embedding + BM25（Hybrid Retrieval）**

- 向量：语义匹配。
- BM25：精确匹配。
- 融合：RRF / 加权。
- 适用：企业级 RAG（事实标准）。

**组合 2：Bi-Encoder + Cross-Encoder（召回 + 精排）**

- Bi-Encoder：粗排 Top-100。
- Cross-Encoder：精排 Top-10。
- 适用：精度要求高的场景。

**组合 3：Late Interaction + Rerank（高精度长文档）**

- ColBERT v2：长文档 token 级匹配。
- Reranker：精排 Top-10。
- 适用：法律 / 医疗 / 金融。

**组合 4：多模态 Embedding + Hybrid**

- 跨模态检索（图搜、视频搜）。
- 适用：电商、内容平台。

**组合 5：Embedding + GraphRAG**

- 向量：实体召回。
- 图谱：关系推理。
- 适用：复杂问答、推荐、风控。

**组合 6：Embedding + Agent**

- Agent 自主调用 Embedding + Rerank。
- 适用：复杂 RAG、Self-RAG。

**组合 7：Embedding + 多模型编排（Ch6 主题）**

- 多 Embedding 模型路由（按任务 / 语言 / 模态）。
- 适用：跨国 / 多业务企业。

---
