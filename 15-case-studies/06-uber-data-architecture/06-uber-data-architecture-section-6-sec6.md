> 本文件是 **06-uber-data-architecture.md** 的子文件（§6. 复用经验）。完整章节请回到 [index](06-uber-data-architecture.md)。

## 6. 复用经验

### 6.1 适合谁学

#### 6.1.1 强实时业务（出行 / 外卖 / 物流）

- **典型**：Uber、美团外卖、滴滴、Instacart。
- **原因**：实时调度 + 实时特征是核心竞争力。

#### 6.1.2 Marketplace 业务

- **典型**：双边平台（乘客 + 司机、买家 + 卖家）。
- **原因**：Marketplace 实时匹配是核心场景。

#### 6.1.3 全球化业务

- **典型**：跨国业务、多区域运营。
- **原因**：多区域数据合规 + 联邦查询成熟。

#### 6.1.4 强 ML 工程化需求

- **典型**：大型互联网公司、AI 公司。
- **原因**：Michelangelo 思路值得借鉴。

### 6.2 不适合谁学

#### 6.2.1 数据规模小的初创公司

- **反例**：日活 < 100 万。
- **原因**：Cassandra / Hudi 复杂度过高。

#### 6.2.2 单一业务线

- **反例**：单业务 B 端 SaaS。
- **原因**：不需要 Marketplace 实时性。

#### 6.2.3 弱 ML 需求

- **反例**：传统企业内部系统。
- **原因**：Michelangelo 价值小。

### 6.3 关键可复用资产

#### 6.3.1 开源项目

- **[Apache Hudi](https://hudi.apache.org/)**：Uber 主导的表格式。
- **[Apache Cassandra](https://cassandra.apache.org/)**：Uber 大规模使用。
- **[Apache Kafka](https://kafka.apache.org/)**：Uber 是 Kafka 早期用户。
- **[Apache Flink](https://flink.apache.org/)**：实时计算。
- **[Horovod](https://github.com/horovod/horovod)**：Uber 开源的分布式训练框架。
- **[Apache Spark](https://spark.apache.org/)**：Uber 大规模使用。
- **[MLflow](https://mlflow.org/)**：模型生命周期管理。
- **[Michelangelo](https://www.uber.com/blog/michelangelo-machine-learning-platform/)**：Uber 博客开源介绍。

#### 6.3.2 关键技术

- **存储选型**：Cassandra（高写入）+ Schemaless（自研 KV）。
- **表格式**：Hudi（CDC + Upsert 友好）。
- **调度系统**：Apache Airflow。
- **ML 平台**：Michelangelo 思路 + MLflow。
- **联邦治理**：Data Mesh + 联邦委员会。

### 6.4 复用清单（Checklist）

#### 6.4.1 存储层

- [ ] 是否有"统一 KV 存储"？（Cassandra / 自研）
- [ ] 是否有"水平扩展能力"？
- [ ] 是否有"跨机房副本同步"？

#### 6.4.2 表格式层

- [ ] 是否有"统一表格式"？（Hudi / Iceberg / Delta Lake）
- [ ] 是否有"CDC 能力"？
- [ ] 是否有"Update / Delete"支持？

#### 6.4.3 计算层

- [ ] 是否有"实时计算引擎"？（Flink）
- [ ] 是否有"离线计算引擎"？（Spark）
- [ ] 是否有"统一调度"？（Airflow / Maestro）

#### 6.4.4 ML 层

- [ ] 是否有"特征平台"？
- [ ] 是否有"模型训练平台"？
- [ ] 是否有"模型部署平台"？
- [ ] 是否有"模型监控"？

#### 6.4.5 治理层

- [ ] 是否有"数据产品目录"？
- [ ] 是否有"数据 Owner 机制"？
- [ ] 是否有"数据 SLA"？

#### 6.4.6 合规层

- [ ] 是否有"数据本地化"能力？
- [ ] 是否有"联邦查询"能力？
- [ ] 是否有"数据删除权"能力？

---
