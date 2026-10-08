# Ch5 · AI 原生数据栈

> **一句话定位**：Feature Store、RAG、DataAgent、决策智能——AI 时代数据架构师必须掌握的新一代数据栈。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：AI 应用工程师、架构师
- **前置章节**：[Ch4 · 数据中台与服务化](../04-data-mesh-and-middleware/)（建议）
- **后续章节**：[Ch6 · 横切工程](../06-cross-cutting-engineering/)

## 本章要回答的核心问题

1. **Feature Store** 是什么？为什么说它是 AI 时代的"指标平台"？
2. **RAG** 架构的工程难点有哪些？向量检索只是其中一环
3. **DataAgent** 和"直接让 LLM 跑 SQL"有什么区别？安全边界在哪？
4. **决策智能** 是什么？为什么它是 AI for BI 的下一站？
5. **AI 时代的数据治理**有哪些新挑战？训练数据版本、模型血缘、提示词治理
6. **AI 原生数据库**（pgvector / DuckDB VSS / Snowflake Cortex）能否取代专有向量库？

## 子主题（占位）

- [ ] **Feature Store**：Feast / Tecton / 阿里 FeatureDB / ByteFS，离线特征与在线特征一致性
- [ ] **RAG 架构**：向量检索 + BM25 + 标量过滤 + Reranker + 上下文压缩
- [ ] **Embedding 与向量检索**：Embedding 模型选型、HNSW/IVF/ScaANN、量化（PQ/SQ）
- [ ] **混合检索**：向量 + 全文 + 标量过滤的统一查询
- [ ] **DataAgent**：单 Agent vs Multi-Agent、MCP vs Function Calling、Text-to-SQL 陷阱
- [ ] **决策智能**：强化学习 + 数据、因果推断、业务大脑
- [ ] **AI 数据治理**：训练数据版本（DVC / LakeFS）、模型血缘、提示词治理
- [ ] **AI 原生数据库**：PostgreSQL + pgvector / DuckDB VSS / Snowflake Cortex / Databricks AI Functions
- [ ] **LLM 与数据库的融合**：AI Function in SQL、自然语言查询
- [ ] **多模态 AI**：多模态 Embedding、视觉理解、跨模态检索

> 文件命名建议：`feature-store.md` / `rag-architecture.md` / `embedding-and-retrieval.md` / `hybrid-search.md` / `data-agent.md` / `decision-intelligence.md` / `ai-data-governance.md` / `ai-native-db.md` / `llm-in-sql.md` / `multimodal-ai.md` / `hands-on.md` / `summary.md` / `refs.md`。

## 与 P9 能力的对应

> **2026 年的 P9 数据架构师 = 60% 数据 + 40% AI**。

这一章是 P9 区别于上一代数据架构师的关键。P9 必须能：

- **设计 Feature Store 而非临时拼凑特征**：在线/离线特征一致性是 AI 工程的"魔咒"
- **设计 AI 原生数据治理**：训练数据版本、模型血缘、提示词治理、embedding 反演防御
- **判断 AI 原生数据库 vs 专有向量库**：2026 年的核心争议，影响未来 3-5 年的技术栈选型
- **设计 DataAgent 的安全边界**：把指标平台作为 Agent 的工具，而非"万能 SQL 工具"
- **规划从 BI 到决策智能的演进**：从"看数据"到"AI 辅助决策"再到"AI 自动决策"

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch6 · 横切工程](../06-cross-cutting-engineering/) 继续阅读
