> 本文件是 **07-architecture-decisions.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](07-architecture-decisions.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Lambda 架构（经典）**

- 批层 + 速度层 + 服务层。
- 适用：T+1 全量 + 实时增量（金融、对账）。
- 典型栈：Hadoop + Spark + Kafka + Flink + Druid。

**模式 2：Kappa 架构（简化）**

- 单一流层。
- 适用：纯实时业务（日志、监控）。
- 典型栈：Kafka + Flink。

**模式 3：Lakehouse 架构（融合）**

- 统一存储 + 多种计算。
- 适用：现代数据栈。
- 典型栈：OSS/S3 + Iceberg/Hudi/Paimon + Spark/Flink/Trino + StarRocks/Doris。

**模式 4：流批一体（Flink + Paimon）**

- 统一计算 + 统一存储。
- 适用：实时数仓。
- 典型栈：Kafka + Flink + Paimon + StarRocks。

**模式 5：Medallion 架构（Bronze/Silver/Gold）**

- 三层数据。
- 适用：所有数据湖项目。

**模式 6：Event Sourcing + CQRS**

- 事件溯源 + 读写分离。
- 适用：审计严格场景（金融、医疗）。

**模式 7：AI 原生架构（Lakehouse + 向量库 + LLM）**

- 数据栈 + AI 栈融合。
- 适用：AI 时代。

**模式 8：自治架构（Self-Driving）**

- AI 驱动的自动决策。
- 适用：未来。

### 3.2 适用场景决策表

| 业务场景 | 推荐架构 | 典型技术栈 |
| --- | --- | --- |
| T+1 报表 + 实时监控 | Lambda | Hadoop + Spark + Kafka + Flink |
| 纯实时（日志、监控） | Kappa | Kafka + Flink |
| 现代数据栈（BI + AI） | Lakehouse | Iceberg/Paimon + Spark/Flink + Trino |
| 实时数仓 | 流批一体 | Kafka + Flink + Paimon + StarRocks |
| 金融审计 | Event Sourcing + Lambda | Kafka + Flink + Iceberg |
| AI 平台 | AI 原生架构 | Lakehouse + 向量库 + LLM |
| 多模态 | Lakehouse + LanceDB | Iceberg V3 + LanceDB |
| 跨国合规 | Lakehouse + 联邦 | 多云 Iceberg + Unity Catalog |

### 3.3 反模式与陷阱

**反模式 1：盲目追求 Lambda**

- 业务其实只需实时，非要 Lambda 双链路。
- **正确**：业务驱动选型。

**反模式 2：盲目追求 Kappa**

- 业务有大量历史计算需求，强上 Kappa 重放慢。
- **正确**：Lambda / Lakehouse 更适合。

**反模式 3：架构僵化**

- 业务变了架构不变。
- **正确**：架构随业务演进（ADR + 定期 review）。

**反模式 4：决策无据**

- 架构师凭经验决策，无法解释。
- **正确**：ADR + 决策矩阵。

**反模式 5：忽视治理**

- 选了最潮的架构但无治理。
- **正确**：架构 + 治理（血缘 / 质量 / 安全）一起做。

**反模式 6：缺乏可观测**

- 架构跑起来但出问题不知道。
- **正确**：监控告警 + 全链路追踪。

---
