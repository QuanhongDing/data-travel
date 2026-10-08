# Ch4 · 企业级数据资产化与智能检索

> **一句话定位**：把企业私有多源异构数据（文档 / 代码 / 报表 / 音视频）转化为可被 AI 检索的语义资产。

## 画像映射

本章对应 **核心职责② 企业私有数据资产化与智能检索**：

- 多源异构数据（文档 / 代码 / 报表 / 音视频）的统一清洗、结构化、语义化编码
- 基于向量数据库构建高可用语义索引体系
- 召回 + 精排 + 生成的端到端 RAG 架构

> P7 会"做 RAG demo"，P8 会"调 Embedding"，**资深数据架构师会"建语义资产体系"**——让企业私有数据变成 AI 可消费的知识。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：AI 架构师 / 数据架构师 / 知识图谱工程师
- **前置章节**：[Ch1 · 建模方法论](../01-modeling/)（图谱建模）；[Ch2 · 数据科学与算法](../02-data-science/)（Embedding 选型）
- **后续章节**：[Ch5 · AI 智能体平台架构](../05-agent-platform/)（RAG 是 Agent 的核心能力）；[Ch8 · AI 治理与安全](../08-ai-governance/)（资产治理是安全的前置）

## 本章要回答的核心问题

1. **多源异构数据怎么统一清洗？** 文档（PDF / Word / Markdown）/ 代码（Python / Java / SQL）/ 报表（Excel / 仪表盘）/ 音视频——不同模态的预处理链路？
2. **向量化与语义编码怎么选型？** OpenAI text-embedding-3 / BGE / M3E / CLIP / Whisper——不同模态的 Embedding 选型？
3. **Chunking 策略怎么设计？** 固定窗口 / 滑动窗口 / 语义切分 / 结构感知切分——如何平衡召回率与上下文完整度？
4. **向量数据库 vs AI 原生数据库怎么选？** 专有向量库（Milvus / Pinecone / Weaviate / Qdrant）vs PostgreSQL + pgvector / DuckDB VSS？
5. **RAG 架构怎么演进？** 朴素 RAG → 高级 RAG（Query Rewrite / Reranker / HyDE）→ Agentic RAG——什么时候用哪个？
6. **混合检索怎么设计？** BM25 + 向量 + 知识图谱 + 规则——如何融合多路召回？
7. **元数据与数据目录怎么治理？** DataHub / Apache Atlas / 阿里 DataWorks——资产怎么"可发现"？

## 子主题

- [ ] **[多模态数据库](./01-multimodal-db/README.md)**：文档 / 音视频 / 图文的统一存储与检索
- [ ] **[向量湖](./02-vector-lake/README.md)**：Iceberg + 向量列 / Milvus 集群——向量数据的湖仓化
- [ ] **[AI 原生数据库](./03-ai-native-db/README.md)**：PostgreSQL + pgvector / DuckDB VSS / TiDB Vector——把向量当成一等公民
- [ ] **[混合检索](./04-hybrid-search/README.md)**：BM25 + 向量 + 知识图谱——多路召回与精排
- [ ] **[RAG 架构](./05-rag-architecture.md)**：朴素 RAG / 高级 RAG / Agentic RAG——端到端检索增强生成
- [ ] **[OneService 数据服务化](./06-one-service.md)**：阿里中台 OneService 思想——指标 / 标签 / API 的统一服务
- [ ] **[数据 API 网关](./07-data-api-gateway.md)**：限流 / 鉴权 / 计量 / 缓存——数据 API 的统一入口
- [ ] **[数据目录](./08-data-catalog.md)**：DataHub / Atlas / DataWorks——资产的可发现与可理解
- [ ] **[统一查询网关](./09-unified-query-gateway/README.md)**：跨源联邦查询（Trino / Presto + 向量库 + 图库）
- [ ] **[指标平台](./10-metric-platform/README.md)**：原子指标 / 派生指标 / 指标服务化——数据资产化的核心载体

> 文件命名建议：`multimodal-db.md` / `vector-lake.md` / `ai-native-db.md` / `hybrid-search.md` / `rag-architecture.md` / `one-service.md` / `data-api-gateway.md` / `data-catalog.md` / `unified-query-gateway.md` / `metric-platform.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 设计多源异构数据的统一预处理链路（清洗 → 切分 → 嵌入 → 入库）
- 在专有向量库与 AI 原生数据库之间做出正确的选型决策
- 搭建 RAG 架构的端到端链路（嵌入 / 索引 / 召回 / 精排 / 生成）
- 选型 Chunking 策略（固定 / 滑动 / 语义 / 结构感知），并评估 Recall@K
- 用 Reranker / HyDE / Query Rewrite 提升高级 RAG 效果
- 设计数据 API 网关（限流 / 鉴权 / 计量 / 缓存），让数据资产可服务化
- 搭建数据目录与元数据治理体系，让资产"可发现、可理解、可信任"
- **让企业私有数据变成 AI 可消费的知识**——这是 AI 时代数据架构师的核心能力

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch5 · AI 智能体平台架构](../05-agent-platform/) 学习 Agent 平台
- 进入 [Ch6 · 多模型编排与工具调用](../06-multi-model/) 学习多模型协同
