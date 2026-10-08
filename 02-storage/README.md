# Ch2 · 存储范式

> **一句话定位**：从数仓到 AI 原生数据库，理解每一代存储引擎的设计取舍。

## 基本信息

- **难度**：★★★☆☆
- **推荐角色**：数据工程师、平台架构师
- **前置章节**：[Ch1 · 建模方法论](../01-modeling/)（建议）
- **后续章节**：[Ch3 · 计算范式](../03-compute/)

## 本章要回答的核心问题

1. 数仓 / 数据湖 / 湖仓一体的本质区别是什么？什么时候该选谁？
2. Iceberg / Hudi / Paimon / Delta 这些 Table Format 解决了什么问题？
3. 多模态数据（文档 / 时序 / 图 / KV / 搜索）该怎么选型与协同？
4. 向量库（Milvus / Qdrant）和向量湖（Vector Lake）的本质区别是什么？
5. **AI 原生数据库**是什么？PostgreSQL + pgvector + ParadeDB 这类一体化方案能否取代专有向量库？
6. 流式存储（Praveza / Fluss / Kafka Streams）如何与湖仓协同？

## 子主题（占位）

- [ ] **数据仓库**：Hive / MaxCompute / Doris / StarRocks / ClickHouse
- [ ] **数据湖**：Iceberg / Hudi / Paimon / Delta Lake 的设计取舍
- [ ] **湖仓一体**：Lakehouse 的工程实践（MinIO + Iceberg + Trino 实战）
- [ ] **多模态数据库**：MongoDB（文档）/ InfluxDB & TimescaleDB（时序）/ Neo4j & NebulaGraph（图）/ Elasticsearch & OpenSearch（搜索）/ TiDB & CockroachDB（HTAP）/ Redis（KV）
- [ ] **向量库与向量湖**：Milvus / Qdrant / Weaviate / pgvector 的工程取舍
- [ ] **AI 原生数据库**：PostgreSQL + pgvector + ParadeDB / DuckDB VSS / TiDB 向量化
- [ ] **流式存储**：Praveza / Fluss / Materialize / Kafka Streams
- [ ] **存算分离 vs 存算一体**：什么时候必须分离，什么时候必须一体
- [ ] **Schema Evolution / Time Travel / Hidden Partitioning**
- [ ] **冷热分层与成本优化**

> 文件命名建议：`data-warehouse.md` / `data-lake.md` / `lakehouse.md` / `multimodal-db.md` / `vector-lake.md` / `ai-native-db.md` / `streaming-store.md` / `architecture-decisions.md` / `hands-on.md` / `tuning.md` / `summary.md` / `refs.md`。

## 与 P9 能力的对应

存储范式是数据架构师的"工具箱"。P9 不需要会写每种引擎的源码，但必须能：

- **3 分钟内判断**一个业务场景该选哪类存储
- **说出每种引擎的 2-3 个致命缺陷**（如 Doris 不擅长超高并发点查、Iceberg 的小文件问题）
- **理解存算分离的成本结构**（存储费用 vs 计算费用的 trade-off）
- **判断 AI 原生数据库是否会取代专有向量库**（2026 年的核心争议）

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch3 · 计算范式](../03-compute/) 继续阅读
