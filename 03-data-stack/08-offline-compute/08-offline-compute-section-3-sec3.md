> 本文件是 **08-offline-compute.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](08-offline-compute.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Hive on Spark**

- Hive 翻译为 Spark 执行。
- 适用：传统企业。

**模式 2：Spark SQL 直连**

- Spark 直接读 Iceberg / Hive / Parquet。
- 适用：现代数据栈。

**模式 3：Spark + Iceberg + Trino**

- Spark 写入 Iceberg，Trino 查询。
- 适用：Lakehouse。

**模式 4：Trino 联邦查询**

- Trino 跨 Hive + MySQL + Kafka。
- 适用：联邦分析。

**模式 5：DuckDB 内嵌分析**

- 本地 / 嵌入场景。
- 适用：AI / 小数据 / Notebook。

**模式 6：Spark Structured Streaming（离线语义）**

- Trigger.Once 模式：流式接口 + 离线语义。
- 适用：流批融合。

**模式 7：MaxCompute（阿里）**

- 阿里自研离线计算。
- 适用：阿里系业务。

**模式 8：Spark 4.0 + AI Functions**

- Spark 内置 AI Functions（向量化、LLM）。
- 适用：AI 原生离线。

### 3.2 适用场景决策表

| 业务场景 | 推荐引擎 | 典型技术栈 |
| --- | --- | --- |
| T+1 报表 | Spark SQL / Hive on Spark | Hive + Spark + Iceberg |
| 实时 + 离线统一 | Spark + Flink | Spark Structured Streaming + Flink |
| 联邦查询 | Trino | Trino + 多 Connector |
| Lakehouse | Spark + Iceberg + Trino | Iceberg + Spark + Trino + StarRocks |
| AI / Notebook | DuckDB | DuckDB + Parquet + Python |
| 阿里系业务 | MaxCompute | MaxCompute + DataWorks |
| 大数据 ETL | Spark | Spark + Iceberg + Flink |
| 即席查询 | StarRocks / Doris | StarRocks + Iceberg 外表 |

### 3.3 反模式与陷阱

**反模式 1：使用 RDD 编程**

- 新项目还用 RDD，丧失 DataFrame 优化。
- **正确**：优先 DataFrame / Spark SQL。

**反模式 2：忽视数据倾斜**

- 作业慢、内存溢出。
- **正确**：AQE + 两阶段聚合 + 广播 Join。

**反模式 3：小文件未治理**

- 千万级小文件，Spark 启动慢。
- **正确**：合并 + 写 Iceberg / Paimon 自动合并。

**反模式 4：未启用 AQE**

- 错失自适应优化机会。
- **正确**：Spark 3.x 默认开启 AQE。

**反模式 5：Hive 性能问题**

- Hive 默认 MR 太慢。
- **正确**：Hive on Tez / Hive on Spark。

**反模式 6：Spark 资源调度不合理**

- Executor 内存 / Core 配置不当。
- **正确**：动态分配 + 合理分区。

**反模式 7：滥用 UDF**

- 自定义 UDF 失去优化机会。
- **正确**：优先内置函数 + 必要时 Pandas UDF。

---
