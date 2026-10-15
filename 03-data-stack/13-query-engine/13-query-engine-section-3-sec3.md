> 本文件是 **13-query-engine.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](13-query-engine.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Trino 联邦查询（标准）**

- 一个 Trino 集群 + 多 Connector。
- 适用：跨源即席查询。

**模式 2：Trino + Iceberg（Lakehouse）**

- Trino 查询 Iceberg 外表。
- 适用：Lakehouse + 即席查询。

**模式 3：Trino + Hive 兼容（传统）**

- Trino 查询 Hive Metastore。
- 适用：传统企业。

**模式 4：DataFusion 内嵌（AI / Edge）**

- Rust 内嵌查询引擎。
- 适用：AI 应用、边缘计算。

**模式 5：PrestoDB + 自定义 Connector**

- 自定义 Connector 接入内部系统。
- 适用：定制化场景。

**模式 6：Impala + Kudu（实时）**

- 实时查询（列存 + 行存混合）。
- 适用：CDH 生态。

### 3.2 适用场景决策表

| 业务场景 | 推荐引擎 | 典型技术栈 |
| --- | --- | --- |
| 跨源即席查询 | Trino | Trino + Hive / MySQL / Kafka |
| Lakehouse 即席查询 | Trino | Trino + Iceberg |
| 传统 Hadoop 生态 | Trino / Impala | Trino + Hive |
| AI / 内嵌 | DataFusion | DataFusion + Arrow + Python |
| 大宽表聚合 | ClickHouse / StarRocks | 专用 OLAP |
| 自定义数据源 | 自研 + Trino Connector | Trino + 自研 |

### 3.3 反模式与陷阱

**反模式 1：用 Trino 做高频大查询**

- Trino 是查询引擎，不是 OLAP。
- **正确**：高频大查询用 StarRocks / Doris。

**反模式 2：未优化 Connector**

- 跨源查询慢。
- **正确**：谓词下推 + 列剪裁 + 分区剪裁。

**反模式 3：Join 顺序差**

- 大表 Join 大表崩溃。
- **正确**：CBO 统计信息 + 广播小表。

**反模式 4：忽视资源管理**

- 大查询占用所有 Worker。
- **正确**：Resource Group 隔离。

**反模式 5：未启用 AQE**

- 错失运行时优化。
- **正确**：开启 AQE。

---
