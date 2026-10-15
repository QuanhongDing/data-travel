> 本文件是 **05-rag-architecture.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](05-rag-architecture.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Naive RAG**

最简单的「向量召回 + Prompt」架构：

```
[Question] → [Embedding] → [Vector Search Top-K] → [Prompt] → [LLM] → [Answer]
```

- 优点：实现简单、10 行代码搞定。
- 缺点：召回率低、上下文噪声大、无溯源。
- 适用：PoC / Demo / 小规模验证。

**模式 2：Advanced RAG（Pre-Retrieval + Post-Retrieval 优化）**

```
                                          ┌─→ [Rerank] ─┐
[Question] → [Query Rewrite] → [Vector Search] ─┤            ├→ [Compress] → [LLM] → [Answer]
                                          └─→ [BM25] ─────┘
```

- Pre-Retrieval：Query Rewrite、HyDE、Step-Back Prompting。
- Post-Retrieval：Rerank、Context Compression、Lost-in-the-Middle 缓解。
- 优点：召回率提升 20-50%。
- 缺点：链路复杂度增加。
- 适用：生产级 RAG。

**模式 3：Modular RAG**

把 RAG 拆成可插拔模块：

```
[模块1：Query Understanding] → [模块2：Retrieval] → [模块3：Rerank] → [模块4：Generation] → [模块5：Evaluation]
```

- 优点：每模块可独立优化 / 替换。
- 缺点：架构复杂、需要平台支持。
- 适用：企业级 RAG 平台。

**模式 4：Self-RAG**

LLM 在生成中插入反思 token：

```
[Generate token] → [Need Retrieval?] → yes → [Retrieve] → [Is Relevant?] → no → drop / yes → keep → [Continue Generation] → [Is Supported?] → [Is Useful?]
```

- 优点：自适应检索、可解释。
- 缺点：需要训练或特殊 prompt。
- 适用：高准确性场景。

**模式 5：Corrective RAG（CRAG）**

对检索结果做可信度评估：

```
[Retrieve] → [Confidence Evaluator] → high → [Use Directly]
                                       medium → [Refine]
                                       low → [Web Search Fallback]
```

- 优点：缓解「检索失败」问题。
- 缺点：需要额外的 evaluator。
- 适用：知识更新快 / 容错要求高。

**模式 6：Agentic RAG**

智能体决策检索路径：

```
[Question] → [Agent] → [决定查 KG / 向量 / SQL / Web] → [调用工具] → [整合结果] → [生成答案]
```

- 优点：灵活、可扩展、可处理复杂问题。
- 缺点：复杂度高、成本高、可观测性难。
- 适用：复杂业务问题、企业知识助手。

**模式 7：GraphRAG**

先建 KG，再基于图谱检索：

```
[Documents] → [LLM 抽取 KG] → [Leiden 社区检测] → [Community Summary]
                                                       ↓
[Question] → [Local Search（基于实体）| Global Search（基于社区）] → [Answer]
```

- 优点：擅长「宏观问题」「跨文档推理」。
- 缺点：抽取成本高、KG 质量依赖 LLM。
- 适用：研究报告、复杂知识问答。

**模式 8：Hybrid RAG（三路召回）**

向量 + 关键词 + KG 三路召回 + RRF 融合：

```
[Question] ─┬─→ [Vector Search]   ─┐
            ├─→ [BM25 Search]     ─┼─→ [RRF 融合] → [Rerank] → [LLM]
            └─→ [KG Traversal]     ─┘
```

- 优点：兼顾语义 / 精确 / 关系。
- 缺点：实现复杂。
- 适用：企业级知识中台。

### 3.2 适用场景决策表

| 场景特征 | 推荐模式 | 理由 |
| --- | --- | --- |
| PoC / Demo / < 1000 文档 | Naive RAG | 快速验证 |
| 生产级 / 中等规模 | Advanced RAG | 性价比最优 |
| 企业级平台 / 多业务线 | Modular RAG | 可演进 |
| 高准确性 / 知识边界模糊 | Self-RAG / CRAG | 容忍延迟换准确 |
| 复杂多跳问题 / Agent | Agentic RAG | 灵活 |
| 宏观问题 / 跨文档 | GraphRAG | 擅长全局问题 |
| 多模态 / 图文混排 | Hybrid RAG + CLIP | 全模态覆盖 |
| 实时性高 / 知识频繁更新 | CRAG + Web Fallback | 兜底 |
| 中文为主 | BGE-M3 + BGE-reranker | 中文 SOTA |

### 3.3 反模式与陷阱

1. **「全部塞进 Prompt」反模式**：把整个文档库塞给 LLM，浪费 token、精度差。**必须分块 + 检索**。
2. **「Embedding 万能」反模式**：以为「好的 embedding 就够了」，忽视 query rewrite / rerank。**Advanced RAG 比好的 embedding 重要 10 倍**。
3. **「Chunking 越细越好」反模式**：chunk 太小（< 100 token）导致上下文不足。**平衡粒度与召回率**。
4. **「不用 Reranker」反模式**：直接用向量召回 Top-K 喂给 LLM。**Reranker 能让 Recall@10 提升 30-50%**。
5. **「忽视元数据过滤」反模式**：不按时间 / 部门 / 权限过滤。**必须 metadata-aware retrieval**。
6. **「Prompt 模板过于复杂」反模式**：prompt 几百行，LLM 被绕晕。**保持简洁，让 LLM 专注**。
7. **「不评估」反模式**：上线 RAG 不做评测，凭感觉调参。**必须用 RAGAS / TruLens 评测**。
8. **「盲目 GraphRAG」反模式**：所有问题都套 GraphRAG，结果又慢又差。**GraphRAG 适合宏观问题，精确事实查询直接用 SQL / Cypher**。
9. **「LLM 当真理」反模式**：用 LLM 自己验证 LLM，幻觉传播。**必须有 ground truth（人工标注 / 业务规则）**。
10. **「忽视成本」反模式**：每次 query 都用 GPT-4 + 大 embedding，成本失控。**必须分级（Haiku / Sonnet / Opus）+ 缓存 + 路由**。

---
