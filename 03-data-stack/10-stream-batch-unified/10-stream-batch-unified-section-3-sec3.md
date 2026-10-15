> 本文件是 **10-stream-batch-unified.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](10-stream-batch-unified.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Flink + Paimon 流批一体（最主流）**

- Flink 同时跑流批，Paimon 同时支持流批读写。
- 适用：实时数仓 + Lakehouse。

**模式 2：Flink + Iceberg V3 流批**

- Flink 流批 + Iceberg V3 行级删除 + 增量读取。
- 适用：Lakehouse + 流批融合。

**模式 3：Spark Structured Streaming + Delta 流批**

- Spark 同时跑流批，Delta 同时支持流批读写。
- 适用：Databricks 生态。

**模式 4：Apache Beam 跨引擎流批**

- 同一份 Beam 代码运行在 Flink / Spark / Dataflow。
- 适用：多云、可移植性。

**模式 5：Flink CDC + Iceberg/Paimon 实时入湖**

- Flink CDC 实时入湖，Trino/StarRocks 批量查询。
- 适用：实时 Lakehouse。

**模式 6：Materialize 流式 SQL 数据库**

- 流式 SQL + 实时物化视图。
- 适用：流式数仓。

### 3.2 适用场景决策表

| 业务场景 | 推荐模式 | 典型技术栈 |
| --- | --- | --- |
| 实时数仓 + Lakehouse | Flink + Paimon | Flink + Paimon + StarRocks |
| 跨云 / 可移植 | Apache Beam | Beam + Flink / Spark |
| Databricks 生态 | Spark + Delta | Spark Structured Streaming + Delta |
| 实时入湖 + 查询 | Flink CDC + Iceberg | Flink CDC + Iceberg + Trino |
| 流式 SQL 数仓 | Materialize | Materialize + Postgres |
| 多引擎统一 | Beam / Flink | Beam + Flink + Iceberg |
| 流批 + AI 原生 | Flink + AI Functions | Flink + LLM + Paimon |

### 3.3 反模式与陷阱

**反模式 1：强行流批一体**

- 业务其实只需流或只需批，硬上流批一体。
- **正确**：业务驱动选型。

**反模式 2：选错表格式**

- 选 Delta 但 Flink 集成差。
- **正确**：Flink 选 Paimon，Spark 选 Delta，跨引擎选 Iceberg。

**反模式 3：忽视 Changelog**

- 表格式未开启 Changelog，流式查询不到变更。
- **正确**：Paimon 开启 Changelog Producer。

**反模式 4：状态爆炸**

- 流模式状态无限增长。
- **正确**：TTL + 合理 Key 设计。

**反模式 5：性能预期过高**

- 流批一体不是万能药，性能可能弱于专用流。
- **正确**：评估性能 + 测试。

**反模式 6：忽视 Schema Evolution**

- 上游改字段，流批都不通。
- **正确**：Schema Evolution + CI/CD 测试。

---
