# Ch3 · 数据全栈基础设施

> **一句话定位**：采集 / 集成 / 流转 / 样本库 / 评估 / 反馈——让数据"采得进来、存得下、算得动、流得出去"。

## 画像映射

本章对应 **R4 数据全栈协同** 能力（招聘要求第 4 条）：

- 深刻理解数据全栈协同体系：采集 / 集成、数据流转、样本库建设、评估、反馈
- 离线 / 实时 / 流批一体的架构选型
- 治理（Ch8 重点）、可观测（Ch11 重点）的基础底座

> P7 会"用工具"，P8 会"搭集群"，**资深数据架构师会"建闭环"**——让数据从产生到消费"长期、可靠、可控"地跑。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：数据全栈架构师 / 平台架构师 / 数据工程师
- **前置章节**：[Ch1 · 建模方法论](../01-modeling/)；[Ch2 · 数据科学与算法](../02-data-science/)
- **后续章节**：[Ch4 · 企业级数据资产化与智能检索](../04-data-assetization/)（向量化资产化建立在全栈之上）

## 本章要回答的核心问题

1. **数据采集与集成怎么选型？** CDC（Debezium / Flink CDC）vs ETL（DataX / Airflow / DolphinScheduler）——什么时候用哪个？
2. **数据湖 / 数据仓库 / Lakehouse 三种架构怎么选？** Iceberg / Hudi / Paimon / Delta Lake 的能力差异与场景适配？
3. **离线 vs 实时 vs 流批一体怎么取舍？** Spark / Flink / Flink + Iceberg 的工程边界与一致性保障？
4. **数据流转怎么设计？** 双向同步、binlog 订阅、Schema Evolution、Time Travel——如何保证"上游改表，下游不爆炸"？
5. **样本库怎么搭？** Label Studio / 自研标注平台——特征回填、样本血缘、版本管理？
6. **OLAP 引擎怎么选？** ClickHouse / Doris / StarRocks / Trino / Presto——不同查询模式下的最优引擎？
7. **数据漂移、特征穿越、效果下降怎么归因？** 全链路的可观测、可追溯能力如何构建？

## 子主题

- [ ] **[数据仓库](./data-warehouse/README.md)**：传统数仓（Greenplum / ClickHouse / Doris），分层（ODS / DWD / DWS / ADS）
- [ ] **[数据湖](./data-lake/README.md)**：HDFS / S3 / OSS 上的开放格式，Schema-on-Read
- [ ] **[Lakehouse](./lakehouse/README.md)**：Iceberg / Hudi / Paimon / Delta Lake——融合湖与仓的优势
- [ ] **[流式存储](./streaming-store/README.md)**：Kafka / Pulsar / RocketMQ——消息中间件与流式存储
- [ ] **[冷热分层](./cold-hot-tiering/README.md)**：OSS 冷热分层、生命周期管理、成本与性能平衡
- [ ] **[Schema 与 Time Travel](./schema-and-time-travel/README.md)**：Schema Evolution、版本回滚、Time Travel 查询
- [ ] **[架构决策](./architecture-decisions/README.md)**：Lambda / Kappa / 湖仓一体的架构选型方法论
- [ ] **[离线计算](./offline-compute/README.md)**：Spark / Hive / MapReduce——批处理核心引擎
- [ ] **[实时计算](./realtime-compute/README.md)**：Flink / Spark Streaming——流处理核心引擎
- [ ] **[流批一体](./stream-batch-unified/README.md)**：Flink + Iceberg / Hudi——一套代码、一份存储
- [ ] **[OLAP 引擎](./olap-engine/README.md)**：ClickHouse / Doris / StarRocks / Trino——多维分析与即席查询
- [ ] **[调度系统](./scheduler/README.md)**：Airflow / DolphinScheduler / 阿里 DataWorks——DAG 编排与依赖管理
- [ ] **[查询引擎](./query-engine/README.md)**：Trino / Presto / Impala——跨源联邦查询
- [ ] **[查询优化器](./optimizer/README.md)**：CBO / RBO、统计信息、代价模型——慢查询治理
- [ ] **[OneData 思想](./one-data/README.md)**：阿里中台统一数据标准与模型方法论

> 文件命名建议：`data-warehouse.md` / `data-lake.md` / `lakehouse.md` / `streaming-store.md` / `cold-hot-tiering.md` / `schema-and-time-travel.md` / `architecture-decisions.md` / `offline-compute.md` / `realtime-compute.md` / `stream-batch-unified.md` / `olap-engine.md` / `scheduler.md` / `query-engine.md` / `optimizer.md` / `one-data.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 选型合适的采集与集成工具（CDC vs ETL），并设计全链路数据流转
- 在数据仓库、数据湖、Lakehouse 三种架构间做出正确的选型决策
- 区分离线、实时、流批一体三种计算范式的工程边界
- 用 Flink CDC + Iceberg + Airflow 搭建完整的数据全链路
- 选型合适的 OLAP 引擎（ClickHouse / Doris / StarRocks / Trino），并做查询优化
- 搭建样本库与特征回填机制，应对数据漂移、特征穿越、效果下降
- 把数据全栈设计为"可治理、可观测、可计量、可演进"的系统

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch4 · 企业级数据资产化与智能检索](../04-data-assetization/) 学习 Embedding 与 RAG
- 进入 [Ch11 · 横切工程](../11-cross-cutting/) 学习数据可观测与血缘（核心横线）
