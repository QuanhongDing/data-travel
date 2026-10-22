# Ch3 · 数据全栈基础设施

> **一句话定位**：采集 / 集成 / 流转 / 样本库 / 评估 / 反馈——让数据"采得进来、存得下、算得动、流得出去"。

## 画像映射

本章对应 **R4 数据全栈协同** 能力（招聘要求第 4 条）：

- 深刻理解数据全栈协同体系：采集 / 集成、数据流转、样本库建设、评估、反馈（**样本库**见 [§16](./16-sample-library/16-sample-library.md)）
- 离线 / 实时 / 流批一体的架构选型
- 治理（Ch8 重点）、可观测（Ch11 重点）的基础底座

> P7 会"用工具"，P8 会"搭集群"，**资深数据架构师会"建闭环"**——让数据从产生到消费"长期、可靠、可控"地跑。

## 基本信息

- **难度**：★★★☆☆
- **推荐角色**：数据全栈架构师 / 平台架构师 / 数据工程师
- **前置章节**：[Ch1 · 建模方法论](../01-modeling/)；[Ch2 · 数据科学与算法](../02-data-science/)
- **后续章节**：[Ch4 · 企业级数据资产化与智能检索](../04-data-assetization/)（向量化资产化建立在全栈之上）

## 本章要回答的核心问题

1. **数据采集与集成怎么选型？** CDC（Debezium / Flink CDC）vs ETL（DataX / Airflow / DolphinScheduler）——什么时候用哪个？
2. **数据湖 / 数据仓库 / Lakehouse 三种架构怎么选？** Iceberg / Hudi / Paimon / Delta Lake 的能力差异与场景适配？
3. **离线 vs 实时 vs 流批一体怎么取舍？** Spark / Flink / Flink + Iceberg 的工程边界与一致性保障？
4. **数据流转怎么设计？** 双向同步、binlog 订阅、Schema Evolution、Time Travel——如何保证"上游改表，下游不爆炸"？
5. **样本库怎么搭？** Label Studio / 自研标注平台——特征回填、样本血缘、版本管理？（见 [§16 样本库](./16-sample-library/16-sample-library.md)）
6. **OLAP 引擎怎么选？** ClickHouse / Doris / StarRocks / Trino / Presto——不同查询模式下的最优引擎？
7. **数据漂移、特征穿越、效果下降怎么归因？** 全链路的可观测、可追溯能力如何构建？

## 子主题

- [ ] **[数据仓库](01-data-warehouse/01-data-warehouse.md)**：传统数仓（Greenplum / ClickHouse / Doris），分层（ODS / DWD / DWS / ADS）
- [ ] **[数据湖](02-data-lake/02-data-lake.md)**：HDFS / S3 / OSS 上的开放格式，Schema-on-Read
- [ ] **[Lakehouse](03-lakehouse/03-lakehouse.md)**：Iceberg / Hudi / Paimon / Delta Lake——融合湖与仓的优势
- [ ] **[流式存储](04-streaming-store/04-streaming-store.md)**：Kafka / Pulsar / RocketMQ——消息中间件与流式存储
- [ ] **[冷热分层](05-cold-hot-tiering/05-cold-hot-tiering.md)**：OSS 冷热分层、生命周期管理、成本与性能平衡
- [ ] **[Schema 演进与 Time Travel](06-schema-and-time-travel/06-schema-and-time-travel.md)**：Schema Evolution、版本回滚、Time Travel 查询
- [ ] **[架构决策](07-architecture-decisions/07-architecture-decisions.md)**：Lambda / Kappa / 湖仓一体的架构选型方法论
- [ ] **[离线计算](08-offline-compute/08-offline-compute.md)**：Spark / Hive / MapReduce——批处理核心引擎
- [ ] **[实时计算](09-realtime-compute/09-realtime-compute.md)**：Flink / Spark Streaming——流处理核心引擎
- [ ] **[流批一体](10-stream-batch-unified/10-stream-batch-unified.md)**：Flink + Iceberg / Hudi——一套代码、一份存储
- [ ] **[OLAP 引擎](./11-olap-engine/README.md)**：ClickHouse / Doris / StarRocks / Trino——多维分析与即席查询
- [ ] **[调度系统](12-scheduler/12-scheduler.md)**：Airflow / DolphinScheduler / 阿里 DataWorks——DAG 编排与依赖管理
- [ ] **[查询引擎](13-query-engine/13-query-engine.md)**：Trino / Presto / Impala——跨源联邦查询
- [ ] **[查询优化器](14-optimizer/14-optimizer.md)**：CBO / RBO、统计信息、代价模型——慢查询治理
- [ ] **[OneData 思想](./15-one-data/README.md)**：阿里中台统一数据标准与模型方法论
- [ ] **[样本库](16-sample-library/16-sample-library.md)**：训练与评测样本的资产化——标注工程（口径载体 / 一致性诊断 / 弱监督 / 主动学习）· **点时特征回填**（防穿越）· 切分与快照（防三种泄漏）· 污染检查与数据来源台账

> 文件命名建议：`data-warehouse.md` / `data-lake.md` / `lakehouse.md` / `streaming-store.md` / `cold-hot-tiering.md` / `schema-and-time-travel.md` / `architecture-decisions.md` / `offline-compute.md` / `realtime-compute.md` / `stream-batch-unified.md` / `olap-engine.md` / `scheduler.md` / `query-engine.md` / `optimizer.md` / `one-data.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 选型合适的采集与集成工具（CDC vs ETL），并设计全链路数据流转
- 在数据仓库、数据湖、Lakehouse 三种架构间做出正确的选型决策
- 区分离线、实时、流批一体三种计算范式的工程边界
- 用 Flink CDC + Iceberg + Airflow 搭建完整的数据全链路
- 选型合适的 OLAP 引擎（ClickHouse / Doris / StarRocks / Trino），并做查询优化
- 搭建样本库与特征回填机制，应对数据漂移、特征穿越、效果下降——[§16](./16-sample-library/16-sample-library.md)
- 把数据全栈设计为"可治理、可观测、可计量、可演进"的系统

## 推荐资料

> 本节是**本章的索引**，不是一份新书单：下列每一条都是本章各主题正文与 §8（面试真题集）「参考资料」里**已经引用过**的书、论文、标准与官方文档，按「经典 → 工业材料 → 前沿」三段归拢到一处，便于按图索骥。
> 本书不提供链接（无网络环境）。每条后面的核验入口是它的**题名 / 文档名——按题名自行检索**即可核到；带会议与年份的论文，会议与年份以论文集页面为准；本章 §8 已就地标注「出处待核验」的条目，引用前请自行查证。

### 经典书目（每条按题名自行检索核验）

| 书 | 作者 / 团队 | 本章对应主题 | 读法 |
| --- | --- | --- | --- |
| *The Data Warehouse Toolkit* | Ralph Kimball | [数据仓库](./01-data-warehouse/01-data-warehouse.md)、[OneData](./15-one-data/README.md) | 星型模型与一致性维度的源头；重点看它与 OBT 宽表的差异，不照抄模型 |
| *Building the Data Warehouse* | Bill Inmon | [数据仓库](./01-data-warehouse/01-data-warehouse.md)、[OneData](./15-one-data/README.md) | 自顶向下 ER / 范式化路线的对立观点，与 Kimball 对照读 |
| *大数据之路：阿里巴巴大数据实践* | 阿里数据技术团队 | [数据仓库](./01-data-warehouse/01-data-warehouse.md)、[数据湖](./02-data-lake/02-data-lake.md)、[OneData](./15-one-data/README.md) | 分层规范、命名与准入规则的国内范本；量化收益的章节以原书为准 |
| *Designing Data-Intensive Applications* | Martin Kleppmann | [Schema 演进与 Time Travel](./06-schema-and-time-travel/06-schema-and-time-travel.md)、[架构决策](./07-architecture-decisions/07-architecture-decisions.md) | 只读「Encoding and Evolution」与「Derived Data」两处，其余与本章无关 |
| *Big Data: Principles and Best Practices of Scalable Realtime Data Systems* | Nathan Marz、James Warren | [架构决策](./07-architecture-decisions/07-architecture-decisions.md) | Lambda 三层的原始定义；与 Kreps 的批评同读 |
| *Kafka: The Definitive Guide* | Confluent 团队 | [流式存储](./04-streaming-store/04-streaming-store.md) | Consumer Group 与 offset 管理的权威材料；章号以原书目录为准 |
| *Data Mesh: Delivering Data-Driven Value at Scale* | Zhamak Dehghani | [OneData](./15-one-data/README.md) | 与中心化 OneData 路线对照：域自治 vs 中心裁决 |
| *企业数据中台建设实战* | 阿里数据中台公开培训材料 | [OneData](./15-one-data/README.md) | 组织设计与阶段路径，与《大数据之路》互为表里 |

### 经典论文（原始论述；每条按题名自行检索核验）

- *Data Cube: A Relational Aggregation Operator Generalizing Group-By, Cross-Tab, and Sub-Totals*（Jim Gray 等）【公开，1997】——Cube 的数学定义，[数据仓库](./01-data-warehouse/01-data-warehouse.md) 里物化视图路线的起点。
- *The Snowflake Elastic Data Warehouse*（Snowflake 团队）【公开，SIGMOD 2016】——存算分离 + 虚拟数仓的原始论述；见 [数据仓库](./01-data-warehouse/01-data-warehouse.md)、[OLAP 引擎](./11-olap-engine/README.md)。
- *Dremel: Interactive Analysis of Web-Scale Datasets*【公开，VLDB 2010】——列式嵌套格式的原始出处；见 [数据湖](./02-data-lake/02-data-lake.md)。
- *Finding a needle in Haystack: Facebook's photo storage*（Meta 团队）【公开，2010；会议归属待核——按题名回论文集页面核准，本书不在此写死会议】——小文件 + 冷热分层的经典工业案例；见 [冷热分层](./05-cold-hot-tiering/05-cold-hot-tiering.md)。
- *Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics*（Armbrust 等）【公开，CIDR 2021】——Lakehouse 形态的原始论述；见 [Lakehouse](./03-lakehouse/03-lakehouse.md)、[架构决策](./07-architecture-decisions/07-architecture-decisions.md)。
- *Delta Lake: High-Performance ACID Table Storage over Cloud Object Stores*（Armbrust 等）【公开，VLDB 2020】——事务日志形态表格式的设计论文；见 [数据湖](./02-data-lake/02-data-lake.md)、[Lakehouse](./03-lakehouse/03-lakehouse.md)。
- *Resilient Distributed Datasets: A Fault-Tolerant Abstraction for In-Memory Cluster Computing*（Matei Zaharia 等）【公开，NSDI 2012】——RDD 与 lineage 重算；见 [离线计算](./08-offline-compute/08-offline-compute.md)。
- *Scaling the Facebook Data Warehouse to 300 PB*（Meta）【公开，年份与会议待核：书内记为 SIGMOD 2013，本书他处另将一批「Meta 300 PB」表述记为 SIGMOD 2022，是否同一篇本书无法离线判定；引用前请按会议论文库核对】——超大规模数仓在存储、调度与元数据上的权衡；见 [离线计算](./08-offline-compute/08-offline-compute.md)。
- *Apache Flink: Stream and Batch Processing in a Single Engine*（Paris Carbone 等）【公开，2015】——「同一个引擎、两种执行模式」的公开出处；见 [流批一体](./10-stream-batch-unified/10-stream-batch-unified.md)。
- *Lightweight Asynchronous Snapshots for Distributed Dataflows*（Paris Carbone 等）【公开】——Flink Checkpoint 的原始算法论文；见 [实时计算](./09-realtime-compute/09-realtime-compute.md)。
- *Structured Streaming: A Declarative API for Real-Time Applications in Apache Spark*【公开，SIGMOD 2018】——Spark 流批统一的官方论述；见 [实时计算](./09-realtime-compute/09-realtime-compute.md)。
- *The Dataflow Model*（Akidau 等）【公开，VLDB 2015】——事件时间、水位线、触发与累积模式的形式化；见 [实时计算](./09-realtime-compute/09-realtime-compute.md)。
- *Streaming 102: The World Beyond Batch*（Tyler Akidau）【公开，2017】——事件时间 + 水位线模型的完整讲述；见 [实时计算](./09-realtime-compute/09-realtime-compute.md)。
- *Questioning the Lambda Architecture*（Jay Kreps）【公开，2014】与 *How to Beat the CAP Theorem*（Nathan Marz）——Kappa 与 Lambda 两侧的论证；见 [架构决策](./07-architecture-decisions/07-architecture-decisions.md)。
- *Presto: SQL on Everything*【公开，ICDE 2019】——Coordinator / Worker 模型的原始出处；见 [查询引擎](./13-query-engine/13-query-engine.md)。
- *Impala: A Modern, Open-Source SQL Engine for Hadoop*（Kornacker 等）【公开，CIDR 2015】——CBO + 向量化在工业界的演进路径；见 [查询引擎](./13-query-engine/13-query-engine.md)、[OLAP 引擎](./11-olap-engine/README.md)。
- *ClickHouse—Lightweight Data Warehouse for Analytical Queries* 与 *StarRocks: A Cost-Based Optimizer for Fast Analytics*（各团队架构论文）——会议与年份请按题名在论文集页面核验；见 [OLAP 引擎](./11-olap-engine/README.md)。
- *Access Path Selection in a Relational Database Management System*（Selinger 等）【公开，SIGMOD 1979】——基于代价的关联顺序枚举的源头；见 [查询优化器](./14-optimizer/14-optimizer.md)。
- *The Cascades Framework for Query Optimization*（Goetz Graefe）【公开，1995】与 *Volcano—An Extensible and Parallel Query Evaluation System*【公开，IEEE TKDE 1994】——两代优化器框架；见 [查询优化器](./14-optimizer/14-optimizer.md)。
- *Spark SQL: Relational Data Processing in Spark*——Catalyst 优化器的设计论文；见 [查询优化器](./14-optimizer/14-optimizer.md)。
- *Documenting Architecture Decisions*（Michael Nygard）——ADR 的原始定义与方法论；见 [架构决策](./07-architecture-decisions/07-architecture-decisions.md)。

### 工业材料（官方文档 / 规范 / 白皮书；每条按文档名自行检索核验）

**表格式与对象存储**

- Apache Iceberg 官方规范（v1 / v2 / v3）与「REST Catalog Spec」——表格式的权威定义与开放 Catalog 协议；见 [Lakehouse](./03-lakehouse/03-lakehouse.md)、[数据湖](./02-data-lake/02-data-lake.md)。
- Apache Hudi 官方文档「Storage Types / Timeline / Compaction」——COW / MOR 与增量查询的标准解释；见 [Lakehouse](./03-lakehouse/03-lakehouse.md)。
- Delta Lake 官方文档（Time Travel / OPTIMIZE / UniForm）与 Databricks 官方工程文档《Delta UniForm: One Storage Format for All Engines》——注意 UniForm 是官方文档而非会议论文，勿记作某会议论文；见 [Lakehouse](./03-lakehouse/03-lakehouse.md)。
- Project Nessie 官方文档——分支与合并在元数据层的实现；见 [Lakehouse](./03-lakehouse/03-lakehouse.md)。
- Apache HDFS 官方文档 Heterogeneous Storage 与 Erasure Coding 章节、Apache Ozone 官方文档——存储策略与 EC 编码；见 [冷热分层](./05-cold-hot-tiering/05-cold-hot-tiering.md)。
- Apache Parquet 与 Apache ORC 官方文档——列存格式、Page Index、Bloom Filter 的权威出处；见 [冷热分层](./05-cold-hot-tiering/05-cold-hot-tiering.md)。
- AWS S3 Storage Classes 官方文档与阿里云 OSS 存储类型与生命周期规则官方文档——对象存储分层的两套权威口径；见 [冷热分层](./05-cold-hot-tiering/05-cold-hot-tiering.md)。

**采集、流与 Schema**

- Apache Kafka 官方文档「Design」「Transactions」「Log Compaction」章节——sendfile / PageCache、幂等 producer 与事务的官方论述；见 [流式存储](./04-streaming-store/04-streaming-store.md)。
- Debezium 与 Flink CDC 官方文档——CDC 采集层的标准工具；见 [数据湖](./02-data-lake/02-data-lake.md)、[实时计算](./09-realtime-compute/09-realtime-compute.md)。
- Apache Avro 规范（Schema Resolution 章节）——兼容性规则的官方定义；见 [Schema 演进与 Time Travel](./06-schema-and-time-travel/06-schema-and-time-travel.md)。
- Confluent Schema Registry 官方文档与《Schema Registry — Avro vs Protobuf vs JSON Schema》白皮书、Apicurio 官方文档《Schema Registry Overview》——注册中心的两种实现；见 [Schema 演进与 Time Travel](./06-schema-and-time-travel/06-schema-and-time-travel.md)。

**计算引擎**

- Apache Flink 官方文档「Streaming Concepts」「state backends」「timely stream processing」「CDC Connectors」章节；见 [实时计算](./09-realtime-compute/09-realtime-compute.md)、[流批一体](./10-stream-batch-unified/10-stream-batch-unified.md)。
- Apache Spark 官方文档「Adaptive Query Execution」「Performance Tuning」「Structured Streaming」「Cluster Mode Overview / Spark on YARN」章节；见 [离线计算](./08-offline-compute/08-offline-compute.md)。
- Apache Hive 官方文档「Hive on Spark / Execution Engine」与 Hive Metastore 架构章节、Apache Tez 官方文档——多执行引擎与 DAG 框架；见 [离线计算](./08-offline-compute/08-offline-compute.md)。
- Apache Celeborn（Remote Shuffle Service）、Volcano / Apache YuniKorn、Kubeflow Spark Operator 官方文档——K8s 上的 shuffle 与作业调度；见 [离线计算](./08-offline-compute/08-offline-compute.md)。

**OLAP 与查询**

- Apache Doris、StarRocks、ClickHouse 官方文档（数据模型、物化视图、索引与向量化执行章节）、Apache Kylin 官方文档；见 [OLAP 引擎](./11-olap-engine/README.md)。
- Trino 官方文档（Architecture / Connector SPI / Resource Groups / Memory Management 章节）与《Trino Engineering Blog》；见 [查询引擎](./13-query-engine/13-query-engine.md)。
- Apache Calcite 官方文档（HepPlanner 与 VolcanoPlanner 章节）——两种优化器范式的开源实现；见 [查询优化器](./14-optimizer/14-optimizer.md)。
- Snowflake 官方文档（Architecture Overview / Micro-Partitions / Dynamic Tables）与 Google BigQuery 官方文档（Capacitor / Slot 调度章节）；见 [数据仓库](./01-data-warehouse/01-data-warehouse.md)、[OLAP 引擎](./11-olap-engine/README.md)。
- TPC-H 与 TPC-DS 标准基准的官方规范——测试口径的原文；厂商公布成绩的口径与配置不一，引用前按规范核对成绩单；见 [OLAP 引擎](./11-olap-engine/README.md)。

**调度与治理**

- Apache Airflow 官方文档（Executors / Datasets / SLA）、Apache DolphinScheduler 官方文档（Master / Worker / Registry）、Argo Workflows 官方文档（Kubernetes Native Workflows）、LinkedIn Azkaban 官方文档；见 [调度系统](./12-scheduler/12-scheduler.md)。
- Google SRE 手册关于 SLI / SLO / SLA 与错误预算的章节——基线 SLO 的理论来源；见 [调度系统](./12-scheduler/12-scheduler.md)。
- LinkedIn DataHub 官方文档、Apache Atlas 官方文档（Type System / Classification）、OpenLineage 官方文档（Spec）——元数据与血缘的标准与实现；见 [数据湖](./02-data-lake/02-data-lake.md)。
- AWS Lake Formation 与 AWS Glue 官方文档、Databricks Unity Catalog 官方文档及《Unity Catalog: Unified Governance for Data and AI》——商业治理产品的参考实现；见 [数据湖](./02-data-lake/02-data-lake.md)。
- dbt 官方文档（staging / intermediate / marts、Semantic Layer、metrics 章节）、MetricFlow 与 Cube 官方文档——云原生分层与指标语义层；见 [数据仓库](./01-data-warehouse/01-data-warehouse.md)、[OneData](./15-one-data/README.md)。
- 阿里云 DataWorks 与 MaxCompute 官方文档、阿里 DataWorks《数据治理白皮书》——国内治理运营与回滚工程实践；见 [Schema 演进与 Time Travel](./06-schema-and-time-travel/06-schema-and-time-travel.md)、[OneData](./15-one-data/README.md)。
- MADR（Markdown Any Decision Records）官方文档——工业级 ADR 模板；见 [架构决策](./07-architecture-decisions/07-architecture-decisions.md)。

### 2024–2025 前沿（本章正文已具名；每条按题名自行检索核验）

- Apache Paimon 的论文《Paimon: A LSM Tree Based Stream-Batch Unified Table Store》【公开，VLDB 2024】与官方文档《Streaming Lakehouse》《LSM Tree / Compaction》《Schema Management》——LSM 表格式的流批融合；题名与作者以项目官网 publications 页为准；见 [Lakehouse](./03-lakehouse/03-lakehouse.md)、[流批一体](./10-stream-batch-unified/10-stream-batch-unified.md)。
- Apache Iceberg V3 规范【公开，书内记为 2024】与「Variant / Vector Type」「Row-Level Deletes」RFC——表格式原生的类型与行级删除演进；向量类型是否进入规范，须回规范的类型章节核对；见 [Lakehouse](./03-lakehouse/03-lakehouse.md)、[Schema 演进与 Time Travel](./06-schema-and-time-travel/06-schema-and-time-travel.md)。
- Databricks Mosaic AI 官方文档、Snowflake Cortex 官方文档、Databricks《Unity Catalog for AI/ML》白皮书——湖仓与向量检索 / AI Functions 的融合形态；见 [Lakehouse](./03-lakehouse/03-lakehouse.md)、[OLAP 引擎](./11-olap-engine/README.md)。
- LanceDB 官方文档与代码仓库——多模态列式存储 + ANN 索引的工业实现；见 [Lakehouse](./03-lakehouse/03-lakehouse.md)。
- Apache Velox（Meta 开源的向量化执行库）官方仓库与文档——执行层的演进；见 [查询引擎](./13-query-engine/13-query-engine.md)、[OLAP 引擎](./11-olap-engine/README.md)。
- Materialize 团队「Incremental Snapshot for Change Data Capture」【公开，arXiv: 2406.02176】——增量快照算法的原始论文；见 [实时计算](./09-realtime-compute/09-realtime-compute.md)。
- Netflix Tech Blog 的《Iceberg V3 at Netflix》《Hidden Partitioning in Iceberg at Netflix》《Time Travel for ML Reproducibility》等条目——本章正文引用它时已就地标注【出处待核验：仅有平台与标题，缺作者、年份与链接】，引用前请自行查证；见 [Schema 演进与 Time Travel](./06-schema-and-time-travel/06-schema-and-time-travel.md)、[架构决策](./07-architecture-decisions/07-architecture-decisions.md)。

### §16 样本库可归拢的具名材料

- *Snorkel*——本书内弱监督的具名形态，适用条件见 [Ch1 · 知识图谱](../01-modeling/06-knowledge-graph/06-knowledge-graph-section-4-sec4.md)【公开】；按题名自行检索。
- *Cohen's / Fleiss' Kappa*——标注一致性的经典统计量（实现口径用 `sklearn.cohen_kappa_score`【公开】）；全书统一的分档读法见 [Ch7 · 反馈闭环](../07-agent-evolution/02-feedback-loop/02-feedback-loop-section-8-sec8.md)；按题名自行检索。
- *Datasheets for Datasets* 与 *Model Cards for Model Reporting*——数据集与模型的文档化规范，工程化版本是 Data Provenance Initiative【公开】；见 [Ch11 · 数据血缘](../11-cross-cutting/09-data-lineage/09-data-lineage-section-5-ai.md)；按题名自行检索。
- **这一项本章不再补**：标注 / 主动学习平台侧，§16 只给到「平台能力行」并明写「主动学习在本书内没有具名产品」，因此**不具名具体框架、不给文档名与年份**——按【经验】档读，以你所选框架的官方文档当前版本为准。

### 学习路径建议

按「先骨架、再分工、后前沿」的顺序读，路径都指回本章的主题正文：

1. **先立骨架**：[数据仓库](./01-data-warehouse/01-data-warehouse.md) → [数据湖](./02-data-lake/02-data-lake.md) → [Lakehouse](./03-lakehouse/03-lakehouse.md) 三篇连读，配上面表里的 Kimball / Inmon / 《大数据之路》。
2. **再补采集与流转**：[流式存储](./04-streaming-store/04-streaming-store.md) → [Schema 演进与 Time Travel](./06-schema-and-time-travel/06-schema-and-time-travel.md)；官方文档以 Kafka「Design」、Avro 规范、Confluent Schema Registry 三处为准。
3. **算力两翼**：[离线计算](./08-offline-compute/08-offline-compute.md) → [实时计算](./09-realtime-compute/09-realtime-compute.md) → [流批一体](./10-stream-batch-unified/10-stream-batch-unified.md)；理论侧配 RDD、Dataflow Model、异步快照三篇论文。
4. **分析与服务**：[OLAP 引擎](./11-olap-engine/README.md) → [查询引擎](./13-query-engine/13-query-engine.md) → [查询优化器](./14-optimizer/14-optimizer.md)；优化器这一环必须配 Selinger 与 Graefe 的原始论文，否则只能背参数。
5. **成本与决策**：[冷热分层](./05-cold-hot-tiering/05-cold-hot-tiering.md) → [调度系统](./12-scheduler/12-scheduler.md) → [架构决策](./07-architecture-decisions/07-architecture-decisions.md)；ADR 模板从写下第一篇架构决策记录开始用。
6. **体系与样本**：[OneData](./15-one-data/README.md) → [样本库](./16-sample-library/16-sample-library.md)；样本库侧本章可归拢的具名材料见上一小节，其余按它给出的跨章节指针走。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch4 · 企业级数据资产化与智能检索](../04-data-assetization/) 学习 Embedding 与 RAG
- 进入 [Ch11 · 横切工程](../11-cross-cutting/) 学习数据可观测与血缘（核心横线）
