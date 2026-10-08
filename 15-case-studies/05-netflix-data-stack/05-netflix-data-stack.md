# Netflix 数据栈 案例研究

> **一句话定位**：Netflix 用 15 年时间构建了一套以「Iceberg 表格式 + Spark/Flink + Maestro 调度 + Data Mesh 自治」为核心的现代化数据栈，是大规模数据栈 + 工程师自治文化最值得借鉴的海外样本。

> 本文是 data-travel 项目 [Ch15 · 案例库](../../README.md) 的子章节（**05-Netflix 数据栈**）。标准化案例结构：背景 → 挑战 → 架构演进 → 关键决策 → 踩坑 → 复用经验。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| Netflix 数据栈的整体形态 | §3.1、§3.2、§3.3、§3.4 |
| Iceberg 表格式选型原因 | §4.1 |
| Keystone 实时管道 | §4.2 |
| Maestro 调度系统 | §4.3 |
| Spark/Flink 集成与 Netflix 优化 | §4.4 |
| Metaflow ML 框架 | §4.5 |
| Netflix Data Mesh 实践 | §4.6 |
| 实时数仓与 Iceberg | §4.7 |
| ML Platform 演化 | §4.8 |
| 踩过哪些坑 | §5.1、§5.2、§5.3 |
| 哪些经验值得学 | §6.1、§6.3 |

---

## 1. 背景

### 1.1 公司 / 业务 / 时间

Netflix 成立于 1997 年（从 DVD 租赁起步），2007 年推出流媒体服务，至今 28 年。数据栈演进的关键时间节点：

- **2007–2012：流媒体起步**。从 Oracle + Hadoop 起步，S3 + EMR + Hive 为主。
- **2013：Netflix OSS 开源**。开始对外开源工具（Spinnaker、Chaos Monkey 等）。
- **2015：Apache Kafka 大规模使用**。日处理 1 万亿条消息（PB 级）。
- **2017：Iceberg 立项**。Ryan Blue 在 Netflix 内部开始研发 Iceberg 表格式。
- **2018：Apache Iceberg 开源**。Netflix 把 Iceberg 捐赠给 Apache 基金会。
- **2019：Metaflow 升级**。Netflix 开源 Metaflow（ML 框架），大幅升级 ML 工程化能力。
- **2020：Iceberg 全面铺开**。Netflix 内部 100% 数据栈基于 Iceberg。
- **2021：Maestro 调度发布**。Netflix 开源 Maestro（工作流调度系统）。
- **2022：Data Mesh 实践**。Netflix 内部推进 Data Mesh，数据所有权分散到业务团队。
- **2023：GenAI 应用**。Netflix 内部广泛使用 LLM 做内容理解 / 推荐 / 营销。
- **2024：Iceberg 1.5 / 2.0 发布**。Iceberg 成为事实标准。
- **2025：实时数仓 + AI Native**。

### 1.2 行业与监管

- **流媒体行业**：版权、地区限制、内容审核。
- **金融监管**：合规要求严格。
- **数据合规**：GDPR / CCPA / 全球多法域。
- **等保**：对外服务必须满足等保。

### 1.3 团队规模与组织

- **Netflix 数据团队**约 **1000+ 人**。
- **数据平台部**（DIE - Data Infrastructure Engineering）：约 200+ 人。
- **ML 平台团队**：约 100+ 人。
- **应用数据团队**：约 700+ 人，分散在内容、推荐、广告、运营、增长等。
- **组织文化**：**"自由与责任"（Freedom & Responsibility）** + **"高人才密度"** + **"工程师自治"**。

---

## 2. 挑战

### 2.1 业务挑战

#### 2.1.1 全球用户规模

Netflix 全球用户 2.6 亿+（2024），日活 1 亿+，每天产生 PB 级用户行为数据。

#### 2.1.2 多内容形态

电影、剧集、综艺、动画、游戏——内容形态多样，需要不同的数据模型。

#### 2.1.3 推荐系统复杂度

Netflix 首页推荐（Top 10、推荐位、相似推荐）的准确度直接决定用户留存。

#### 2.1.4 全球多区域

190+ 国家运营，不同地区的内容、价格、推荐算法都不同。

### 2.2 技术挑战

#### 2.2.1 海量数据

- 日均 PB 级数据写入。
- 日均万亿级事件流。
- 单表 PB 级容量。

#### 2.2.2 表格式痛点

2018 年以前 Netflix 使用 Hive 表格式，但 Hive 表格式有严重问题：

- **ACID 缺失**——并发读写不安全。
- **Schema Evolution** 不灵活。
- **分区爆炸**——大量小文件问题。
- **Time Travel** 不支持。

#### 2.2.3 实时计算挑战

推荐延迟 < 200ms，实时特征管道需要支撑**百万级 QPS**。

#### 2.2.4 跨区域数据合规

全球数据合规要求严格，**欧洲数据必须存在欧洲**，**美国数据必须存在美国**。

### 2.3 组织挑战

#### 2.3.1 工程师自治 vs 集中化

Netflix 文化强调"工程师自治"，但数据栈需要一定的标准化——如何平衡？

#### 2.3.2 数据所有权分散

Data Mesh 思想下，数据所有权应该分散到业务团队——但 Netflix 内部推进缓慢，阻力大。

#### 2.3.3 多团队协作

Netflix 有 30+ 团队需要数据共享，**需要"中心化协作层"** 但不强制集中。

---

## 3. 架构演进

### 3.1 V1.0：传统数仓（2007–2015）

**形态**：

```
[Oracle / MySQL] → [Hadoop + Hive] → [EMR] → [Tableau / 自研 BI]
```

**问题**：

- Hive 表格式问题严重（ACID、Schema Evolution）。
- S3 上数据没有事务保证。
- Spark 1.x 性能不佳。

**教训**：Netflix 在传统数仓阶段吃尽 Hive 表格式的亏。

### 3.2 V2.0：S3 + Iceberg 立项（2015–2018）

**关键事件**：

- 2015：Netflix 全面拥抱 AWS S3 作为存储。
- 2016：开始探索表格式选型（Hive / Parquet / 自研）。
- 2017：Ryan Blue 立项 Iceberg。
- 2018：Apache Iceberg 开源。

**Iceberg 关键创新**：

- **ACID 事务**：基于 Snapshot 隔离。
- **Schema Evolution**：灵活增减字段。
- **Time Travel**：可回溯到历史版本。
- **分区演进**：可动态调整分区。
- **隐藏分区（Hidden Partition）**：自动按时间查询优化。

### 3.3 V3.0：Iceberg + Spark + Flink（2018–2021）

**关键事件**：

- 2018：Iceberg 0.1.0 发布。
- 2019：Netflix 内部开始大规模使用 Iceberg。
- 2020：Netflix 内部 100% 数据栈基于 Iceberg。
- 2021：Iceberg 1.0 发布，Netflix 持续贡献。

**架构**：

```
[Kafka] → [Flink] → [Iceberg] → [Spark / Trino] → [BI / ML]
   (流)     (实时)   (表格式)     (查询)            (消费)
```

**关键能力**：

- **流批一体**：Kafka → Flink → Iceberg，同一份代码跑批 + 流。
- **ACID 事务**：保证数据一致性。
- **Time Travel**：可回溯历史版本。
- **Schema Evolution**：可灵活变更 Schema。

### 3.4 V4.0：Maestro + Data Mesh（2021–2024）

**关键事件**：

- 2021：Netflix 开源 Maestro（工作流调度系统）。
- 2022：Netflix 内部推进 Data Mesh 实践。
- 2023：Iceberg 1.3 发布，REST Catalog 标准化。
- 2024：Iceberg 2.0 发布，向量化读取优化。

**Maestro 核心能力**：

- **统一 DAG**：所有工作流用同一套 DAG 模型描述。
- **多触发方式**：时间触发 / 事件触发 / API 触发。
- **可视化界面**：所有工作流可视化编辑。
- **回填支持**：一键回填历史时间范围。

**Data Mesh 实践**：

- **数据所有权分散**：每个业务团队拥有自己的数据。
- **数据产品化**：每个数据集都是"数据产品"，有 Owner、文档、SLA。
- **联邦治理**：跨团队数据治理通过"联邦委员会"。
- **自助平台**：基础设施平台化，业务团队自助消费。

### 3.5 V5.0：AI Native 数据栈（2023–2025）

**关键事件**：

- 2023：Netflix 内部广泛使用大模型（OpenAI / Claude）。
- 2024：Netflix 发布内部 GenAI 应用（内容理解、营销文案、客服）。
- 2025：Netflix 探索"AI 原生数据栈"。

**AI Native 演进**：

- **数据 → 知识**：结构化数据 + LLM 转化为知识。
- **指标 → Agent**：指标平台成为 Agent 工具集。
- **Data Mesh → AI Mesh**：数据 + 模型 + 智能体的联邦治理。

---

## 4. 关键决策

### 4.1 决策 1：为什么 Iceberg 而不是 Hive / Delta Lake？

#### 4.1.1 决策路径

- **方案 A：Hive 表格式**：成熟但有严重问题。
- **方案 B：Delta Lake**：Databricks 2019 开源，基于 Spark 生态。
- **方案 C（最终选择）：Iceberg**：Netflix 自研，2018 开源。

#### 4.1.2 关键 Trade-off

| 维度 | Hive | Delta Lake | Iceberg |
| --- | --- | --- | --- |
| ACID | 无 | 有 | 有 |
| Schema Evolution | 弱 | 有 | 强 |
| Time Travel | 无 | 有 | 有 |
| 隐藏分区 | 无 | 无 | 有 |
| 流批一体 | 弱 | 中 | 强 |
| 引擎支持 | Hive / Spark | Spark 为主 | Spark / Flink / Trino 多引擎 |
| 社区治理 | Apache | Databricks 主控 | Apache 开放 |

**决策**：Iceberg。

**理由**：

1. **多引擎支持**：Netflix 数据栈同时使用 Spark / Flink / Trino，Delta Lake 偏 Spark 生态，Iceberg 多引擎。
2. **开放治理**：Netflix 不想被 Databricks 锁死，Apache 开放治理更合适。
3. **隐藏分区**：Netflix 时间序列数据量大，隐藏分区优化查询。
4. **流批一体**：Iceberg + Flink 流批一体成熟。

#### 4.1.3 验证

Iceberg 2024 年成为 Apache 顶级项目，Databricks / Snowflake / AWS / Google Cloud 等大厂都集成 Iceberg。

### 4.2 决策 2：Keystone 实时管道

#### 4.2.1 Keystone 定位

Netflix Keystone 是基于 Kafka + Flink 的实时数据管道，2017 年开始大规模使用。

#### 4.2.2 架构

```
[应用] → [Kafka] → [Flink] → [Iceberg] → [下游服务]
         (持久化) (实时计算) (表格式) (消费)
```

#### 4.2.3 关键能力

- **Exactly-Once 语义**：保证数据不丢不重。
- **Schema Registry**：基于 Apache Avro，统一 Schema 管理。
- **多租户隔离**：支持多团队共享 Kafka 集群。
- **自动监控**：自动监控 + 告警。

### 4.3 决策 3：Maestro 调度系统

#### 4.3.1 Maestro 核心

Maestro 是 Netflix 2021 年开源的工作流调度系统，对标 Apache Airflow。

#### 4.3.2 关键能力

- **统一 DAG 模型**：所有工作流用统一 DAG 描述。
- **多触发方式**：
  - 时间触发（如每天凌晨 2 点跑）。
  - 事件触发（如 Kafka 消息触发）。
  - API 触发（如 API 调用触发）。
- **可视化编辑**：拖拽即可完成 DAG。
- **回填**：一键回填历史时间范围。
- **SLA 管理**：每个工作流可定义 SLA。

#### 4.3.3 与 Airflow 对比

| 维度 | Airflow | Maestro |
| --- | --- | --- |
| DAG 模型 | 灵活但复杂 | 统一 |
| 触发方式 | 时间为主 | 时间 / 事件 / API |
| 可视化 | 一般 | 强 |
| Netflix 适配 | 弱 | 强 |
| 社区 | Apache 大 | Netflix 自有 |

### 4.4 决策 4：Spark / Flink 集成

#### 4.4.1 Spark 优化

Netflix 对 Spark 做了大量优化（贡献给上游）：

- **Dynamic Allocation**：基于负载动态扩缩容。
- **Adaptive Query Execution（AQE）**：运行时自适应优化。
- **Off-Heap Memory**：减少 GC 压力。
- **S3 优化**：针对 S3 的多线程读取。

#### 4.4.2 Flink 优化

Netflix 也是 Flink 大用户：

- **Flink State Backend**：基于 RocksDB + 自研优化。
- **Exactly-Once**：通过 Kafka 事务 + Flink Checkpoint 实现。
- **大状态优化**：单任务 TB 级 State。

### 4.5 决策 5：Metaflow ML 框架

#### 4.5.1 Metaflow 定位

Netflix 2019 年开源的 ML 框架，对标 AWS SageMaker + Kubeflow + MLflow。

#### 4.5.2 关键能力

- **Python 优先**：让数据科学家用熟悉的 Python 写 ML。
- **本地 + 云端一致**：本地开发、云端部署，代码无需修改。
- **Step 抽象**：每个 ML 任务用 Step 描述，自动构建 DAG。
- **数据版本管理**：自动管理训练数据版本。
- **实验管理**：基于 DAG 的实验管理。

#### 4.5.3 关键技术

- **Metaflow Client**：Python SDK，本地开发。
- **Metaflow Service**：云端执行环境。
- **Metaflow UI**：可视化 UI。

### 4.6 决策 6：Data Mesh 实践

#### 4.6.1 Data Mesh 核心理念

Data Mesh 是 Zhamak Dehghani 2019 年提出的数据架构范式，核心理念：

- **数据所有权分散**：每个业务团队拥有自己的数据。
- **数据产品化**：每个数据集都是"数据产品"。
- **联邦治理**：跨团队治理通过"联邦委员会"。
- **自助平台**：基础设施平台化。

#### 4.6.2 Netflix 实践

Netflix 是 Data Mesh 的早期实践者：

- **数据产品目录**：所有数据集注册到统一目录。
- **数据 Owner**：每个数据集有 Owner。
- **数据 SLA**：每个数据集有 SLA。
- **联邦治理委员会**：跨团队数据治理。

#### 4.6.3 价值

- **业务团队自主**：业务团队可以自主决定数据模型。
- **基础设施共享**：所有团队共享统一基础设施（Iceberg + Spark/Flink + Maestro）。
- **跨团队协作**：通过"数据产品"实现跨团队协作。

### 4.7 决策 7：实时数仓

#### 4.7.1 实时数仓架构

```
[Kafka] → [Flink] → [Iceberg] → [Trino] → [BI]
   (流)    (实时)    (表格式)    (查询)      (消费)
```

#### 4.7.2 关键能力

- **流批一体**：同一份 Iceberg 表可以同时被 Flink 写、Spark / Trino 读。
- **低延迟写入**：Flink 写 Iceberg 延迟 < 1 秒。
- **高并发查询**：Trino 查 Iceberg 并发能力强。

### 4.8 决策 8：ML Platform

#### 4.8.1 ML Platform 架构

```
[数据] → [特征平台] → [Metaflow] → [训练] → [部署] → [推理]
         (Iceberg)   (Python)     (Spark)    (Docker) (在线)
```

#### 4.8.2 核心组件

- **特征平台**：基于 Iceberg + Redis。
- **Metaflow**：ML 框架。
- **训练集群**：基于 Kubernetes + Spark。
- **部署平台**：基于容器。
- **推理平台**：基于 Netflix Titus + 自研。

---

## 5. 踩坑与教训

### 5.1 坑 1：Hive 表格式的"元数据爆炸"

**问题**：2015 年 Netflix Hive 表元数据达到 **百万级 partition**，Hive Metastore 性能崩溃。

**根因**：

- Hive Metastore 单机存储所有 partition 元数据。
- 分区过细（按小时 + 业务 + 用户类型），partition 爆炸。
- 查询时元数据查询延迟高。

**教训**：

- **必须控制 partition 数量**——避免 partition 爆炸。
- **必须自研元数据层**——不依赖 Hive Metastore。

**修正**：Iceberg 的元数据基于 manifest 文件，不依赖 Hive Metastore。

### 5.2 坑 2：Iceberg "破坏性升级"问题

**问题**：2019 年 Netflix 升级 Iceberg 0.11 → 0.12 时，遇到数据文件兼容性问题。

**根因**：

- Iceberg 在快速发展期，文件格式版本变化频繁。
- 老数据文件需要重写。

**教训**：

- **开源表格式还在快速发展**——升级需要谨慎。
- **必须保留回退能力**——升级后能快速回退。
- **必须有"双写窗口"**——新旧版本并存。

**修正**：Netflix 建立"Iceberg 升级灰度机制"——先在 1% 数据上升级，验证后再全量。

### 5.3 坑 3：S3 一致性问题

**问题**：2018 年 S3 偶发的"强一致性"问题（list 不一致）导致 Iceberg 误判数据重复。

**根因**：

- 当时 S3 只有"最终一致性"。
- Iceberg 依赖 list 操作发现数据文件。

**教训**：

- **AWS S3 在 2020 后才提供强一致性**——之前必须自己解决。
- **必须自研"重试 + 校验"机制**——发现 S3 list 不一致时重试。

**修正**：Netflix 自研 S3Vfs（基于 List一致性校验）。

### 5.4 坑 4：Metaflow 学习曲线

**问题**：Netflix 内部 Metaflow 推广困难，数据科学家习惯用 Jupyter + Pandas。

**根因**：

- Metaflow 的"Step 抽象"对数据科学家陌生。
- 数据科学家喜欢"自由探索"，不喜欢"标准化框架"。

**教训**：

- **ML 框架必须"友好"**——不能强制科学家用不熟悉的范式。
- **必须支持"渐进式迁移"**——让科学家一步步迁移。

**修正**：Netflix 建立"Metaflow + Jupyter 混合模式"——Jupyter 探索 + Metaflow 标准化。

### 5.5 坑 5：Data Mesh 推进缓慢

**问题**：2022–2024 年 Netflix 内部 Data Mesh 推进缓慢，部分团队仍然用"集中数仓"。

**根因**：

- 集中数仓团队不愿意放弃权力。
- 业务团队不愿意承担数据所有权。

**教训**：

- **Data Mesh 是"文化变革"**——技术只是表面。
- **必须从"小试点"开始**——先在 1–2 个团队验证，再推广。
- **必须有"激励机制"**——业务团队承担数据所有权需要激励。

---

## 6. 复用经验

### 6.1 适合谁学

#### 6.1.1 大规模数据栈（PB 级）

- **典型**：日活 1000 万+、日数据 TB 级。
- **原因**：Iceberg + Spark/Flink 是规模化首选。

#### 6.1.2 多引擎需求（Spark / Flink / Trino）

- **典型**：同时使用多种计算引擎。
- **原因**：Iceberg 多引擎支持。

#### 6.1.3 强自治文化团队

- **典型**：高人才密度、工程师友好的公司。
- **原因**：Metaflow / Data Mesh 需要工程师自治文化。

#### 6.1.4 全球 / 多区域业务

- **典型**：跨国企业、跨境业务。
- **原因**：Iceberg + 多区域架构成熟。

### 6.2 不适合谁学

#### 6.2.1 数据规模小的公司

- **反例**：日活 < 100 万、日数据 < 100 GB。
- **原因**：Iceberg 复杂度过高，原生 Parquet 够用。

#### 6.2.2 单一引擎需求

- **反例**：只用 Spark 的公司。
- **原因**：Delta Lake 更合适。

#### 6.2.3 弱自治文化团队

- **反例**：传统央企、制造业。
- **原因**：Metaflow / Data Mesh 推进困难。

### 6.3 关键可复用资产

#### 6.3.1 开源项目

- **[Apache Iceberg](https://iceberg.apache.org/)**：Netflix 主导的表格式。
- **[Apache Kafka](https://kafka.apache.org/)**：Netflix 是 Kafka 大用户。
- **[Apache Flink](https://flink.apache.org/)**：实时计算。
- **[Apache Spark](https://spark.apache.org/)**：离线计算。
- **[Netflix Maestro](https://github.com/Netflix/maestro)**：工作流调度。
- **[Netflix Metaflow](https://github.com/Netflix/metaflow)**：ML 框架。
- **[Trino](https://trino.io/)**：查询引擎（Netflix 编）。
- **[Apache Iceberg REST Catalog](https://github.com/apache/iceberg)**：Iceberg 元数据服务。

#### 6.3.2 关键技术

- **表格式选型**：Iceberg（多引擎）+ Delta Lake（Spark 生态）。
- **流批一体**：Kafka + Flink + Iceberg。
- **调度系统**：Maestro / Airflow。
- **ML 框架**：Metaflow / MLflow / Kubeflow。
- **联邦治理**：Data Mesh + 联邦委员会。

### 6.4 复用清单（Checklist）

#### 6.4.1 表格式层

- [ ] 是否评估过 Iceberg / Delta Lake / Hive？
- [ ] 是否选定了统一表格式？
- [ ] 是否有"表格式升级灰度机制"？

#### 6.4.2 计算层

- [ ] 是否有统一离线计算引擎（Spark / Hive）？
- [ ] 是否有统一实时计算引擎（Flink）？
- [ ] 是否有流批一体能力？
- [ ] 是否有统一调度系统（Maestro / Airflow）？

#### 6.4.3 存储层

- [ ] 是否有统一存储（S3 / OSS / HDFS）？
- [ ] 是否有统一元数据服务（Iceberg REST Catalog）？
- [ ] 是否有强一致性保障？

#### 6.4.4 ML 层

- [ ] 是否有 ML 框架（Metaflow / MLflow）？
- [ ] 是否有训练平台（Kubernetes + Spark）？
- [ ] 是否有推理平台（容器服务）？

#### 6.4.5 治理层

- [ ] 是否有"数据产品目录"？
- [ ] 是否有"数据 Owner 机制"？
- [ ] 是否有"数据 SLA"？
- [ ] 是否有"联邦治理委员会"？

---

## 7. 与同类案例对比

### 7.1 对比维度

| 维度 | Netflix | Databricks | Uber | Airbnb |
| --- | --- | --- | --- | --- |
| 主导思想 | 数据自由 + 自治 | 一体化 Lakehouse | 数据平台 + 工程师友好 | 数据科学家友好 |
| 表格式 | Iceberg | Delta Lake | Hudi | Iceberg |
| 调度 | Maestro | Databricks Workflows | Apache Airflow | Airflow |
| ML 框架 | Metaflow | MLflow + Databricks | Michelangelo | MLflow |
| 实时 | Kafka + Flink | Structured Streaming | Kafka + Flink | Kafka + Spark |
| 治理 | Data Mesh | Unity Catalog | 数据平台 | Minerva |

### 7.2 取舍

- **Netflix = 自由 + 自治 + 创新**——给团队最大灵活度。
- **Databricks = 一体化 + 商业化**——把 Lakehouse 作为商业产品。
- **Uber = 平台 + 工程师友好**——让工程师高效工作。
- **Airbnb = 数据科学家友好 + 协作**——让数据科学家高效协作。

**对架构师的启示**：

- **学 Iceberg**——它已成为事实标准。
- **学 Maestro 思路**——统一 DAG + 多触发方式。
- **学 Metaflow 思路**——ML 框架的 Python 优先理念。
- **学 Data Mesh 思路**——但要按企业实际裁剪。

---

## 8. 面试真题集

> 本节内容待补充。题源待与原 PDF《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）题库对齐。

### 8.1 候选题目方向

- Iceberg 表格式的核心创新（ACID、Schema Evolution、Time Travel、隐藏分区）？
- Iceberg vs Delta Lake vs Hudi 的取舍？
- Netflix Keystone 实时管道架构？
- Maestro 调度系统的核心设计（统一 DAG + 多触发）？
- Metaflow 的 Python 优先 + Step 抽象？
- Data Mesh 的四大原则与 Netflix 实践？
- Iceberg 流批一体（Kafka + Flink + Iceberg）的实现原理？
- Netflix 在 S3 上构建数据湖的一致性保障？
- Iceberg 元数据服务（REST Catalog）的设计？
- Data Mesh 推进的阻力与解决方案？

---

## 9. 参考资料

- **官方资料**：
  - Netflix Tech Blog：https://netflixtechblog.com/
  - Netflix OSS GitHub：https://github.com/Netflix
  - Apache Iceberg：https://iceberg.apache.org/
- **学术论文**：
  - SIGMOD / VLDB 多篇 Netflix 数据栈论文
- **演讲**：
  - Strata Data Conference Netflix 演讲
  - QCon Netflix 技术演讲
- **媒体**：
  - InfoQ《Netflix 数据栈演进》
  - The New Stack《Netflix Data Mesh 实践》

> **上一章**：[美团特征平台](../04-meituan-feature-store/) > **下一章**：[Uber 数据架构](../06-uber-data-architecture/)