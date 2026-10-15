> 本文件是 **11-olap-engine.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](11-olap-engine.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：实时 OLAP（Kafka → OLAP）**

- Kafka → Flink → OLAP（StarRocks / Doris / ClickHouse）。
- 适用：实时报表、实时大屏。

**模式 2：Lakehouse 外表查询**

- OLAP 查询 Iceberg / Hudi / Paimon 外表。
- 适用：Lakehouse + 实时查询。

**模式 3：物化视图加速**

- 预聚合 + 自动增量刷新。
- 适用：固定查询模式。

**模式 4：Cube / Rollup（谨慎）**

- 预计算所有维度组合。
- 适用：固定高频 OLAP。

**模式 5：OLAP + 向量检索（2024 新）**

- OLAP + 向量索引 + 联合查询。
- 适用：AI 应用。

**模式 6：OLAP + 指标语义层**

- 指标定义独立 + OLAP 查询。
- 适用：Headless BI。

**模式 7：云原生 OLAP**

- 存算分离、弹性扩缩容。
- 代表：SelectDB Cloud、Snowflake、BigQuery。

### 3.2 适用场景决策表

| 业务场景 | 推荐引擎 | 典型技术栈 |
| --- | --- | --- |
| 实时大屏 / 实时报表 | StarRocks / Doris | Kafka + Flink + StarRocks |
| 多维分析 | StarRocks / Doris | StarRocks + Iceberg |
| 大宽表聚合 | ClickHouse | ClickHouse 单表 |
| 实时写入 + 查询 | StarRocks | Kafka + StarRocks 主键模型 |
| 云原生 | SelectDB / Snowflake | SelectDB Cloud / Snowflake |
| AI / 向量检索 | StarRocks 3.x / Snowflake | StarRocks + 向量索引 |
| 即席联邦查询 | Trino | Trino + 多 Connector |
| 指标语义层 | Any OLAP + MetricFlow | MetricFlow + Cube + OLAP |

### 3.3 反模式与陷阱

**反模式 1：用 OLTP 做 OLAP**

- 在 MySQL 上跑复杂分析，数据库崩溃。
- **正确**：OLTP + OLAP 分离。

**反模式 2：过度依赖 Cube**

- 所有查询都建 Cube，存储爆炸。
- **正确**：MV 为主，Cube 谨慎。

**反模式 3：忽视数据倾斜**

- 部分 Tablet 处理数据过多。
- **正确**：合理分桶 + 随机分桶。

**反模式 4：未优化 Join**

- 大表 Join 大表，性能崩溃。
- **正确**：Broadcast Join（小心内存）+ Colocation Join。

**反模式 5：实时写入不当**

- 频繁小批次写入，导致版本过多。
- **正确**：攒批写入（5-30 秒）。

**反模式 6：未做冷热分层**

- 所有数据都存 SSD，成本高。
- **正确**：冷数据存对象存储 / HDD。

---
