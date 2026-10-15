> 本文件是 **02-data-lake.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](02-data-lake.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：传统 Hadoop 数据湖**

- HDFS + Hive + Spark SQL + MR。
- 优点：成熟稳定、开源生态完整。
- 缺点：缺乏 ACID、改 schema 困难、运维复杂。
- 适用：传统企业、本地数据中心。

**模式 2：云原生数据湖**

- S3/OSS/COS + Spark/Flink + Iceberg/Hudi/Delta + Trino/StarRocks。
- 优点：弹性、成本低、易扩展。
- 缺点：网络延迟、数据安全。
- 适用：云上企业、SaaS 公司。

**模式 3：Lakehouse（湖仓一体）**

- 对象存储 + 开放表格式（Iceberg/Hudi/Paimon）+ 计算引擎（Spark/Flink/Trino）+ OLAP（StarRocks/Doris）。
- 优点：兼具湖的灵活 + 仓的性能和治理。
- 缺点：复杂度较高、需要专业团队。
- 适用：大多数现代企业。

**模式 4：Medallion（铜银金架构）**

- Bronze（原始）+ Silver（清洗）+ Gold（应用）。
- 优点：分层清晰、易治理。
- 缺点：可能分层过度。
- 适用：所有数据湖项目。

**模式 5：多模态数据湖**

- 结构化 + 非结构化 + 向量统一存储。
- 工具：Iceberg / Delta + Milvus / Pinecone / LanceDB。
- 优点：AI 时代标准。
- 缺点：复杂度高。

**模式 6：实时数据湖（Streaming Lake）**

- Kafka/Pulsar + Flink + Paimon/Iceberg。
- 优点：实时入湖、查询实时。
- 缺点：链路复杂。

### 3.2 适用场景决策表

| 业务场景 | 推荐模式 | 典型技术栈 |
| --- | --- | --- |
| 传统企业本地数据中心 | 传统 Hadoop 数据湖 | HDFS + Hive + Spark |
| 互联网云上企业 | 云原生数据湖 / Lakehouse | S3 + Iceberg + Spark/Flink + Trino |
| 大型集团统一数据平台 | Lakehouse | OSS + Paimon + Flink + StarRocks |
| AI / 机器学习 | 多模态数据湖 | Iceberg + LanceDB + Milvus |
| 实时数据 + 历史分析 | 实时数据湖 | Kafka + Flink + Paimon |
| 跨国 / 跨云 | 联邦数据湖 | 多云 Iceberg + 统一 Catalog |
| 个人 / 小团队 | 轻量级数据湖 | MinIO + DuckDB |

### 3.3 反模式与陷阱

**反模式 1：数据沼泽（Data Swamp）**

- 缺乏治理，数据写入无人负责、口径混乱、无人信任。
- **正确**：建立治理体系——元数据、血缘、质量、生命周期。

**反模式 2：直接把数据湖当数据仓库用**

- 数据湖上跑全量分析查询，性能差、成本高。
- **正确**：湖仓分层——湖存原始，仓存加工。

**反模式 3：忽视 Schema 演进**

- 上游字段改了，下游消费全部失败。
- **正确**：使用 Iceberg / Hudi 等支持 Schema Evolution 的表格式。

**反模式 4：小文件爆炸**

- 每个小任务生成几千个小文件，NameNode / 元数据压力大。
- **正确**：定期 Compaction（合并）+ 控制任务粒度。

**反模式 5：分区过度膨胀**

- 一张表 10000 个分区，查询 planner 卡死。
- **正确**：合理分区（按时间，保留 1-3 年）+ 分区过滤。

**反模式 6：忽视数据安全**

- 数据湖直接暴露给所有用户，PII 数据泄露。
- **正确**：行级 / 列级权限控制（Apache Ranger / AWS Lake Formation）。

**反模式 7：缺乏生命周期管理**

- 冷数据长期占用昂贵存储。
- **正确**：自动分层（Hot → Warm → Cold → Archive）。

---
