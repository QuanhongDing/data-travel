> 本文件是 **04-hybrid-search.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](04-hybrid-search.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：向量 + BM25 双路召回（最经典）**

```
[Query] → [Vector Recall] + [BM25 Recall] → [RRF 融合] → [Rerank] → [Top-K]
```

- **优点**：简单高效，召回率提升 20-30%。
- **缺点**：无多跳推理。
- **适用**：90% RAG 场景。

**模式 2：向量 + BM25 + KG 三路召回**

```
[Query] → [Vector] + [BM25] + [KG Traversal] → [RRF] → [Rerank]
```

- **优点**：兼顾语义 + 精确 + 关系。
- **缺点**：复杂度高。
- **适用**：企业知识中台。

**模式 3：BGE-M3 多功能 Embedding**

BGE-M3 同时输出 dense / sparse / colbert 三种向量，单模型搞定混合检索。

- **优点**：单模型、单库。
- **缺点**：依赖 BGE-M3 能力。
- **适用**：中文 + 多语言场景。

**模式 4：Late Interaction 精排**

向量召回 + ColBERT 精排：

```
[Query] → [Bi-Encoder 召回 Top-100] → [ColBERT 精排 Top-10] → [LLM]
```

- **优点**：精度极高。
- **缺点**：存储大（每个 token 一个向量）。
- **适用**：高价值 RAG。

**模式 5：Agentic Hybrid Search**

智能体决定检索策略：

```
[Query] → [Agent] → [决定查向量 / BM25 / KG / Web] → [调用] → [整合]
```

- **优点**：灵活。
- **缺点**：复杂、成本高。
- **适用**：复杂业务问题。

**模式 6：结构化 + 向量融合**

PostgreSQL + pgvector 模式（详见 [03-ai-native-db](../03-ai-native-db/03-ai-native-db.md)）：

```
SELECT ... FROM products WHERE category = 'phone' ORDER BY embedding <=> $1 LIMIT 10
```

### 3.2 适用场景决策表

| 场景特征 | 推荐模式 | 理由 |
| --- | --- | --- |
| 中文 RAG / 通用 | 向量 + BM25 + BGE-reranker | 性价比 |
| 多语言 / 跨境 | BGE-M3 多功能 | 多语言 |
| 高精度 RAG | Late Interaction（ColBERT） | 精度 |
| 企业知识中台 / 多跳 | 向量 + BM25 + KG | 全场景 |
| 中小规模 AI 应用 | PostgreSQL + pgvector | 简化 |
| 复杂业务 / Agent | Agentic Hybrid Search | 灵活 |
| 实时性高 | 向量 + BM25（无 Rerank） | 速度 |

### 3.3 反模式与陷阱

1. **「单一向量检索」反模式**：召回率不足。**必须 BM25 + 向量**。
2. **「无 Reranker」反模式**：粗排直接喂 LLM。**必须加 Reranker**。
3. **「加权融合不标准化」反模式**：BM25 分数 0-1000，向量相似度 0-1，无法加权。**必须 RRF 或归一化**。
4. **「盲目调权重」反模式**：凭感觉调权重。**必须有评测集**。
5. **「无元数据过滤」反模式**：检索到过期 / 错权限 / 错部门。**必须有 metadata-aware**。
6. **「过度精排」反模式**：精排太慢。**必须 Top-100 召回 + Top-10 精排**。
7. **「无 Query 理解」反模式**：口语化问题检索失败。**必须有 Query Rewrite / HyDE**。
8. **「忽视 HyDE / Query Rewrite」反模式**：召回率低。**必须有 Query 理解**。
9. **「无融合评测」反模式**：融合效果不如单一。**必须有 Recall@K / MRR / nDCG 评测**。
10. **「忽视成本」反模式**：Reranker 每次调用收费。**必须有缓存 + 路由**。

---
