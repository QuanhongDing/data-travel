> 本文件是 **01-data-warehouse.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](01-data-warehouse.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：分层建模（ODS / DWD / DWS / ADS）**

```
ODS（贴源层）
  - 保留原始 schema，几乎不做清洗
  - 用于快速回溯 + 故障排查
  ↓
DWD（明细层 / Data Warehouse Detail）
  - 清洗、整合、统一口径
  - 维度建模的事实表 + 维度表
  - 保留最细粒度
  ↓
DWS（汇总层 / Data Warehouse Summary）
  - 按主题（用户、商品、订单）轻度聚合
  - 公共汇总粒度（一天 / 一周 / 一月）
  - 跨域对齐的指标
  ↓
ADS（应用层 / Application Data Service）
  - 面向具体应用（报表 / 标签 / 推荐 / 风控）
  - 高度汇总，宽表 / 立方体
```

**适用**：所有企业数仓建设的标准范式。

**模式 2：One Big Table（OBT）宽表**

- 一张超宽事实表（200+ 列），包含所有维度和度量。
- 优点：单表查询无 JOIN，性能极佳。
- 缺点：维护成本高、Schema 演进难、存储浪费。
- 适用：中小数据量 + 高频分析（如 BI 自助分析）。

**模式 3：实时数仓分层（ODS / DWD / DWS / ADS）**

- 与离线一致，但每层都用实时技术：
  - ODS：Kafka（Binlog / Log）
  - DWD：Flink + Iceberg / Hudi（流式 ETL）
  - DWS：Flink 实时聚合 + Iceberg 物化视图
  - ADS：ClickHouse / Doris / StarRocks（实时 OLAP）

**模式 4：指标语义层（Metric Layer）**

- 把"指标定义"独立成一层（Headless BI / Metric Platform）。
- 工具：Daft、MetricFlow、阿里云指标平台、Apache Doris Cube。
- 价值：一次定义，多处复用；口径统一；可观测可治理。

**模式 5：湖仓一体（Lakehouse）**

- 详见 §3 章。把数据湖的开放性 + 数据仓库的 ACID / Schema 治理融合。
- 典型组合：S3/OSS + Iceberg/Hudi/Paimon + Spark/Flink + Trino/StarRocks。

**模式 6：Data Vault 建模**

- 详见 Ch1。Hub-Link-Satellite 三件套，灵活动态扩展。
- 适用：合规要求高、变化频繁的企业（金融、保险、医疗）。

**模式 7：Cube / 预计算立方体**

- 预计算所有维度组合的聚合，查询 O(1)。
- 工具：Apache Kylin、StarRocks Cube、Doris Rollup。
- 代价：存储爆炸、刷新延迟、Schema 演进难。
- 适用：固定查询模式 + 亚秒级响应要求。

### 3.2 适用场景决策表

| 业务场景 | 推荐模式 | 典型技术栈 |
| --- | --- | --- |
| 传统企业 BI 报表 | 分层建模 + 离线数仓 | Hive + Spark SQL + Doris/StarRocks |
| 互联网高并发自助分析 | 实时数仓分层 | Kafka + Flink + Iceberg + Doris |
| TB 级以下小数据深度分析 | OBT 宽表 + 立方体 | ClickHouse 单表 |
| 跨域大型企业（银行/保险） | Data Vault + 分层 | Snowflake / Oracle Exadata + Data Vault 工具 |
| AI / 特征工程 | 数仓 DWS + Feature Store | Iceberg + Feast / Tecton / 自研 |
| 自然语言查询（NL2SQL） | 指标语义层 + 立方体 | MetricFlow + Cube + LLM |
| 海量历史数据分析 | 湖仓一体 + 列存 | Iceberg + Trino + 对象存储 |
| 金融合规审计 | Data Vault + 历史快照 | Snowflake / Oracle + VaultSpeed |

### 3.3 反模式与陷阱

**反模式 1：烟囱式数仓**

- 每个部门独立建数仓，口径不一致，重复抽取。
- **正确**：建企业级公共层（OneModel / 数据中台），部门建数据集市。

**反模式 2：过度分层**

- 7-8 层数仓，每层数据量都很小，ETL 链路冗长。
- **正确**：4 层即可（ODS/DWD/DWS/ADS），必要时 5 层（加 DIM 维度层）。

**反模式 3：忽视数据治理**

- 没有主数据管理（MDM），同一"客户"在 10 张表里 ID 不同。
- **正确**：建立 OneID 主数据体系，统一关键维度。

**反模式 4：历史数据归档失败**

- 数仓越积越大，性能越来越差。
- **正确**：建立冷热分层（Hot/Warm/Cold/Archive），详见 §5 章。

**反模式 5：维度爆炸**

- 一个事实表关联 50+ 维度表，JOIN 性能崩溃。
- **正确**：合并维度（退化维度）、拆分星型、使用 OBT。

**反模式 6：缺乏数据质量监控**

- ETL 失败 / 数据漂移无人发现，业务报表数据错误。
- **正确**：建立全链路数据质量监控（详见 Ch11）。

**反模式 7：Cube 滥用**

- 任何查询都建 Cube，存储爆炸、刷新链复杂。
- **正确**：Cube 只用于固定高频的 OLAP 场景，其余用 MV。

**反模式 8：实时数仓"为实时而实时"**

- 业务实际 T+1 足够，但硬上 Flink + Kafka，成本翻倍。
- **正确**：业务驱动选型，详见 §7 决策树。

---
