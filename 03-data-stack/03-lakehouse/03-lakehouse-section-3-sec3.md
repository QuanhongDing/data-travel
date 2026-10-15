> 本文件是 **03-lakehouse.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](03-lakehouse.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Iceberg + Spark/Flink + Trino（最常见）**

- 跨引擎最强、社区最大。
- 适用：通用场景、Trino 联邦查询为主。
- 典型栈：S3/OSS + Iceberg + Spark/Flink + Trino + StarRocks/Doris。

**模式 2：Paimon + Flink（流批一体首选）**

- Flink 生态原生、流批一体。
- 适用：实时入湖 + 流计算。
- 典型栈：OSS + Paimon + Flink + StarRocks。

**模式 3：Delta Lake + Databricks（AI/ML 一体化）**

- Spark 生态最深、Unity Catalog。
- 适用：AI/ML 训练、AI 平台。
- 典型栈：S3 + Delta + Databricks + MLflow + Vector Search。

**模式 4：Hudi + CDC（更新密集场景）**

- 强主键索引、MOR 写快。
- 适用：CDC 实时入湖、频繁 upsert。
- 典型栈：OSS + Hudi + Flink CDC + Spark。

**模式 5：多表格式共存（Iceberg 主 + Paimon 流）**

- 主用 Iceberg，实时场景用 Paimon。
- 适用：复杂业务，混合场景。

**模式 6：Medallion 架构（铜银金）**

- Bronze（原始）+ Silver（清洗）+ Gold（应用）。
- 适用：所有 Lakehouse 项目的基础范式。

**模式 7：Lakehouse + 实时 OLAP**

- Lakehouse 做存储层 + StarRocks/Doris 做查询层。
- 适用：实时 BI、秒级查询。

### 3.2 适用场景决策表

| 业务场景 | 推荐模式 | 典型技术栈 |
| --- | --- | --- |
| 跨引擎、联邦查询 | Iceberg + Trino | S3/OSS + Iceberg + Trino + Spark/Flink |
| 实时入湖、流批一体 | Paimon + Flink | OSS + Paimon + Flink + StarRocks |
| AI / 机器学习 | Delta Lake + Databricks | S3 + Delta + Databricks + MLflow |
| CDC 频繁 upsert | Hudi MOR + Flink CDC | OSS + Hudi + Flink CDC |
| 通用场景 | Iceberg（默认） | S3/OSS + Iceberg + Spark/Flink + StarRocks |
| 多模态 AI | Iceberg V3 + LanceDB | OSS + Iceberg V3 + LanceDB + LLM |
| 跨国 / 多云 | Iceberg + 统一 Catalog | 多云 OSS/S3 + Iceberg + Polaris/Nessie |

### 3.3 反模式与陷阱

**反模式 1：选错表格式**

- 选了 Delta 但 Flink 写入兼容性差。
- **正确**：根据引擎偏好选——Flink 选 Paimon、Spark 选 Delta、跨引擎选 Iceberg。

**反模式 2：不建 Catalog**

- 用本地文件系统 + Iceberg，metadata 不统一。
- **正确**：用 Hive Metastore / Glue / Nessie / Polaris 统一管理。

**反模式 3：忽视 Compaction**

- 小文件爆炸，元数据压力、查询慢。
- **正确**：定期 Compaction + 流式入湖用 Paimon（LSM 自动合并）。

**反模式 4：Schema Evolution 不规范**

- 直接删列、改类型，下游崩。
- **正确**：遵循"列可加、类型可展宽、列慎删"原则。

**反模式 5：把所有表都建在 Lakehouse**

- 高频小事务也用 Lakehouse，性能差。
- **正确**：高频小事务用 OLTP（MySQL / PostgreSQL）+ Lakehouse 跑分析。

**反模式 6：忽视 Time Travel 成本**

- 保留过多快照，存储爆炸。
- **正确**：定期 Expire Snapshots（默认 7 天）+ Vacuum 过期文件。

**反模式 7：分区过度膨胀**

- 一张表 10000 个分区，planner 卡死。
- **正确**：合理分区 + Hidden Partitioning。

---
