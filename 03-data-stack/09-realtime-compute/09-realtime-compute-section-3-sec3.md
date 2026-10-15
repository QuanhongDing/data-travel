> 本文件是 **09-realtime-compute.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](09-realtime-compute.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Lambda 架构（流 + 批）**

- 实时层 Flink + 批处理层 Spark。
- 适用：传统实时业务。

**模式 2：Kappa 架构（仅流）**

- 全部数据走 Kafka + Flink。
- 适用：纯实时。

**模式 3：流批一体（Flink + Iceberg/Paimon）**

- Flink 同时跑流批，存储用 Iceberg / Paimon。
- 适用：现代数据栈。

**模式 4：Flink CDC 实时入湖**

- Flink CDC → Iceberg / Paimon。
- 适用：实时数仓 + Lakehouse。

**模式 5：实时特征工程**

- Flink 实时计算 → 特征库（Feast / Tecton）。
- 适用：在线推理。

**模式 6：流式 ML / 在线学习**

- Flink 实时特征 + 模型在线学习。
- 适用：实时推荐 / 风控。

**模式 7：流式 LLM / Agent**

- Flink 实时事件 → LLM 处理。
- 适用：AI Agent 实时决策。

### 3.2 适用场景决策表

| 业务场景 | 推荐引擎 | 典型技术栈 |
| --- | --- | --- |
| 复杂流处理（CEP） | Flink | Flink + RocksDB + Kafka |
| 实时数仓 | Flink + Paimon | Flink + Kafka + Paimon + StarRocks |
| 实时监控 | Flink / Spark Streaming | Flink + ClickHouse |
| 实时特征 | Flink + Feast | Flink + Kafka + Feast |
| 简单流处理 | Kafka Streams | Kafka Streams |
| 流批一体 | Flink + Iceberg | Flink + Iceberg + Kafka |
| 实时入湖 | Flink CDC | Flink CDC + Iceberg/Paimon |
| AI Agent 实时 | Flink + LLM | Flink + Kafka + LLM |

### 3.3 反模式与陷阱

**反模式 1：忽视状态管理**

- 状态爆炸导致 OOM。
- **正确**：合理 State Backend + TTL。

**反模式 2：未启用 Checkpoint**

- 故障后数据丢失。
- **正确**：启用 Checkpoint + Exactly-Once。

**反模式 3：窗口设置不合理**

- 窗口过大 → 状态爆炸。
- 窗口过小 → 数据不完整。
- **正确**：合理窗口 + Watermark。

**反模式 4：数据倾斜**

- 部分 Task 处理慢。
- **正确**：rebalance + 自定义分区。

**反模式 5：滥用 Timer**

- Timer 过多 → 调度慢。
- **正确**：减少 Timer，使用窗口代替。

**反模式 6：未做反压监控**

- 反压导致延迟高。
- **正确**：Flink Web UI + 监控告警。

**反模式 7：依赖过时 API**

- 使用 Flink 弃用的 API。
- **正确**：升级 Flink 版本，使用最新 API。

---
