> 本文件是 **07-architecture-decisions.md** 的子文件（§8. 面试真题集）。完整章节请回到 [index](07-architecture-decisions.md)。

## 8. 面试真题集

> 本节整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题，题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题。
>
> **每题按五段式作答**：考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料。参考答案优先引用**头部互联网企业的公开架构实践**（Netflix / Uber / Meta / LinkedIn / Confluent / 阿里 / 字节 / 招行 等），便于读者按机构与主题自行检索核验；其中以「具体企业名 + 具体数字」形式给出、本节未附文档名与链接的条目，均属【经验】档表述，引用时请自行查证。

### 8.1 全景视图

> 本节整合 7 个原 PDF 子章节、共 7 道真题，覆盖「数据栈架构决策」核心主题：基础范式选型（数仓 / 湖 / 湖仓）、流批架构演进（Lambda / Kappa / 流批一体）、表格式选型（Iceberg / Hudi / Delta / Paimon）、OLAP 引擎选型（Doris / StarRocks / ClickHouse / Snowflake / BigQuery）、计算引擎选型（Spark / Flink / Trino）、调度系统选型（Airflow / DolphinScheduler / Azkaban）、ADR 工程化落地。下表按主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §10.1 | 数仓 / 数据湖 / 湖仓 选型 | 10.1.1 | 1 | 主 |
| §10.2 | Lambda / Kappa / 流批一体 | 10.2.1 | 1 | 主 |
| §11.1 | 表格式选型（Iceberg/Hudi/Delta/Paimon） | 11.1.1 | 1 | 主 |
| §11.2 | OLAP 引擎选型 | 11.2.1 | 1 | 主 |
| §11.3 | 计算引擎（Spark/Flink/Trino） | 11.3.1 | 1 | 辅 |
| §12.4 | 调度系统选型 | 12.4.1 | 1 | 辅 |
| §13.5 | ADR 工程化 | 13.5.1 | 1 | 主 |

| 题号 | 难度 | 主题 |
| --- | :---: | --- |
| §10.1.1 | ★★★★☆ | 数仓 / 数据湖 / 湖仓 三大范式选型 |
| §10.2.1 | ★★★★★ | Lambda / Kappa / 流批一体 演进与权衡 |
| §11.1.1 | ★★★★☆ | Iceberg / Hudi / Delta / Paimon 表格式选型 |
| §11.2.1 | ★★★★☆ | OLAP 引擎选型（Doris/StarRocks/ClickHouse/Snowflake/BigQuery） |
| §11.3.1 | ★★★☆☆ | Spark / Flink / Trino 计算引擎分工 |
| §12.4.1 | ★★★☆☆ | Airflow / DolphinScheduler / Azkaban 调度选型 |
| §13.5.1 | ★★★★☆ | ADR 在 AI 时代的工程化落地 |

### 8.2 §10.1 数仓 / 数据湖 / 湖仓 三大范式选型

> 本主题考察「数据栈架构决策的入口基本功」：从数据仓库（强治理 / 高成本）、数据湖（低成本 / 弱治理）到湖仓一体（融合）的范式跃迁。架构师必须能根据「数据量、实时性、AI 友好度、团队能力」给出选型依据，并能用真实案例（Snowflake / Databricks / 阿里 / 字节 / 招行）佐证。

---

#### §10.1.1 请系统对比数据仓库、数据湖、湖仓一体（Lakehouse）三种架构范式的本质差异，并结合企业规模与业务诉求给出可量化的选型决策框架。

**1. 考察点**

- 是否理解三种范式的**存储介质差异**：数仓（专有存储 + 列存 + 压缩）、数据湖（对象存储 + 开放格式）、湖仓（开放格式 + 表格式 ACID）。
- 是否能从「**数据量级、实时性、AI 友好度、治理成熟度、TCO**」五个维度量化对比，而不是停留在"概念辨析"。
- 是否能用**决策矩阵**（或决策树）给出可操作的选型 SOP，而不是只背优缺点。
- 加分项：能讲清"为什么 2024 年后湖仓成为事实标准"——开放表格式（Iceberg/Hudi/Delta/Paimon）+ 多引擎共享（Spark/Flink/Trino/StarRocks）的工程突破。

**2. 参考答案框架**

**第一层：定义与存储边界。**

- **数据仓库（Data Warehouse）**：以 Snowflake / Redshift / Teradata / MaxCompute 为代表，强 Schema、专有存储或优化列存（Snowflake 微分区）、高压缩比、高并发 BI 友好。**代价**：存算耦合或存算分离但存储私有、与 AI/ML 生态脱节。
- **数据湖（Data Lake）**：以 S3/OSS + `Parquet/ORC` 为代表，开放格式、低成本、弹性大、支持 AI 训练（直接读 Parquet 进 PyTorch / TensorFlow）。**代价**：弱治理（小文件、孤儿文件、Schema 不一致），易形成"数据沼泽"。
- **湖仓一体（Lakehouse）**：以 Databricks / Iceberg + Spark / Flink + StarRocks 为代表，**对象存储 + 开放表格式 + 多引擎共享**，兼具湖的灵活与仓的治理。**代价**：架构复杂度高、需要专业团队、运维成熟度仍在演进。

**第二层：五维度量化对比。**

| 维度 | 数据仓库 | 数据湖 | 湖仓一体 |
| --- | :---: | :---: | :---: |
| 数据量级 | TB–P | EB 级 | EB 级 |
| 实时性 | 分钟级 | 小时–天级 | 秒–分钟级 |
| AI 友好 | 弱（专有格式） | 强（Parquet/Arrow） | 强 |
| 治理成熟度 | 高 | 低（数据沼泽风险） | 中–高 |
| TCO（5 年） | 高 | 低 | 中（运维成本补） |

**第三层：决策矩阵（按企业规模 + 业务诉求）。**

- **金融/电信/政府（强治理优先、数据量 TB–PB、AI 需求弱）** → **数据仓库**。**招行** 在核心交易分析采用 GaussDB / Teradata + MaxCompute 双轨，强审计 + 低延迟 BI。
- **互联网 / 电商（日志多 + AI 重 + 数据 PB–EB）** → **湖仓一体**。**字节跳动 ByteLake** 用 OSS + Iceberg + Spark/Flink + StarRocks/ClickHouse，PB 级替代传统 Lambda，成本与性能均有显著改善（【经验】档：本节无法给出可溯源的降幅与倍数）。
- **创业公司 / 数据量 < 10TB、只报表** → **云数仓（Snowflake / BigQuery）**。免运维、按查询付费，**Snowflake 在 SaaS 行业** 被广泛采用、占据领先份额，以 DWaaS 模式承载了大量客户（【经验】档：本节无法给出可溯源的市场份额数字）。
- **跨国集团 / 多云合规** → **联邦湖仓**。**Databricks Unity Catalog + Iceberg** 提供跨云统一的元数据治理。

**第四层：场景反推与演进路径。**

- **0 → 1 阶段**：业务简单，**数仓**优先（Hive / MaxCompute / Snowflake），快速交付 BI。
- **1 → 10 阶段**：日志 / 埋点 / 行为数据暴涨 → 引入**数据湖**（OSS + Parquet）。
- **10 → 100 阶段**：湖治理恶化 + AI 训练 + 实时查询 → **湖仓一体**（Iceberg + 多引擎）。
- **AI 原生阶段**：向量检索 + LLM + Agent 介入 → **AI 原生湖仓**（Lakehouse + LanceDB + Milvus）。

**第五层：典型反例与经验。**

- **不要一上来就上 Lakehouse**：创业公司年交易额 100 万，上 Iceberg + Spark + Flink + StarRocks 全家桶是过度设计。**Uber** 在 2015 年早期用 Hive + Presto，2018 年才迁移到 Lakehouse 体系。
- **不要把数仓当银弹**：Snowflake 不擅长 AI 训练（数据需导出 Parquet 再喂模型），**Databricks** 通过 Delta + MLflow 解决"仓 + AI 一体化"。
- **阿里 OneData + MaxCompute + Hologres**：双引擎数仓 + 实时数仓组合，承载双 11 PB 级数据；**Hologres** 提供秒级 OLAP 查询，**MaxCompute** 提供离线批量。

**3. 常见陷阱**

- **把"湖仓"等同于"湖 + 仓"两个产品堆叠**。真正的湖仓是**一份数据 + 多种计算**（Iceberg + Spark/Flink/StarRocks），不是把 Hive 和 Snowflake 同时买。
- **以为"湖成本一定低"**。湖存储成本低，但**治理成本高**（小文件、孤儿文件、Schema 漂移）——运维人力可能抵消存储节省。
- **混淆"湖仓"与"数据中台"**。数据中台是**组织 + 流程 + 平台**三位一体，湖仓只是其中的"存储 + 计算"层。
- **以为数仓不能做 AI**。**Snowflake Cortex** + **Databricks AI Functions** 已让数仓内置 ML/LLM 能力，但湖的开源生态（PyTorch / Ray / MLflow）在 AI 训练上仍占优。
- **决策无据**。架构师凭经验选型，写不出 ADR——后续团队接手时无法解释"为什么当初选 Iceberg 而不是 Hudi"。

**4. 追问预测**

- **「数据量 100TB 是否需要上 Lakehouse？」** 答：不必。100TB 量级 Hive + Spark 完全胜任；Lakehouse 真正的优势要到 PB 级、多团队协作时才显现。
- **「Snowflake 与 Databricks 的本质区别？」** 答：Snowflake 是**云数仓产品化**（专有存储 + 计算资源池化）；Databricks 是**湖仓 + AI 平台**（开放格式 + Spark + MLflow + LLM）。前者 BI 体验最佳，后者 AI 生态最佳。
- **「湖仓时代 BI 工具怎么选？」** 答：BI 工具与湖仓解耦——Tableau / Power BI / FineBI / 网易有数 都可直连 Iceberg/Delta。**字节 DataFinder** + 内部 BI 工具直连 StarRocks 提供亚秒查询。
- **「数据沼泽如何治理？」** 答：① 入湖前 **Schema 校验**（Confluent SR / Apache Gravitino）；② 入湖后 **生命周期**（Iceberg expire + remove_orphan）；③ 使用 **Lakehouse 治理平台**（Unity Catalog / Gravitino / DataHub）。

**5. 参考资料**

- Apache Iceberg 官方规范 V3——表格式 + ACID + 多引擎的官方定义。
- Databricks Engineering Blog《What is a Lakehouse?》——Lakehouse 原始论文与工业实践。
- Snowflake 官方文档《Architecture Overview》——存算分离 + 微分区（Micro-Partition）的数仓架构。
- Martin Kleppmann《Designing Data-Intensive Applications》第 3 部分「Derived Data」——数据栈架构的形式化讨论。
- **Netflix Keystone 数据栈** —— Netflix EB 级数据用 Kafka + Flink + Iceberg + Pinot 流批一体替代传统 Lambda。
- **Uber 从 Hive 到 Lakehouse 的演进** —— Uber 2018–2024 期间从 Hive + Presto 迁移到 Iceberg + Spark 的工程实践。
- **字节跳动 ByteLake** —— 字节跳动自研 Lakehouse 平台，PB 级替代 Lambda，成本与性能均有显著改善（【经验】档：本节无法给出可溯源的降幅与倍数）。
- **阿里 MaxCompute + Hologres 双引擎** —— 阿里双 11 期间 PB 级数仓 + 秒级 OLAP 实时查询的双引擎架构。
- **Snowflake Cortex 与 Databricks AI Functions** —— 数仓原生 AI 能力的两条路径对比。
- **招行 GaussDB + MaxCompute 双轨数仓** —— 金融强治理场景的数仓选型案例。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §10.2.1 请从一致性、实时性、复杂度、成本四个维度系统对比 Lambda、Kappa、流批一体三种架构范式，并结合金融、电商、AI 三个场景说明各自的最佳实践与演进路径。

**1. 考察点**

- 是否能讲清三种范式的**核心抽象差异**：Lambda（批流并行 + 合并）、Kappa（纯流 + 重放）、流批一体（一份代码 + 一份存储）。
- 是否能用**CAP 定理**视角分析一致性权衡（Lambda 牺牲 C、Kappa 优先 C、流批一体靠 Iceberg/Paimon ACID 拿 C）。
- 是否能针对**金融（强一致 + 实时）**、**电商（高吞吐 + 准实时）**、**AI（高吞吐 + 重计算）** 三个场景给出可落地方案。
- 加分项：能讲清"**Paimon / Iceberg V2 流批读写**"如何让 Kappa 与流批一体合流，以及"Medallion 架构"在 Lakehouse 上的落地。

**2. 参考答案框架**

**第一层：三种范式的形式化定义。**

- **Lambda 架构**（Nathan Marz, 2011）：**批处理层（Batch Layer）+ 速度层（Speed Layer）+ 服务层（Serving Layer）**。批层保证全量准确性，速度层保证实时性，服务层做合并（按时间窗口）。**优**：成熟稳定、准确；**劣**：双链路维护成本高（同一业务写两遍逻辑）。
- **Kappa 架构**（Jay Kreps, 2014）：**只保留流处理层**，用 Kafka 等可重放存储替代批层；不行就重放（重置 offset 重新消费）。**优**：架构简洁；**劣**：历史计算能力弱（PB 级重放数小时）、对流引擎强依赖。
- **流批一体（Stream-Batch Unified）**：**一份代码 + 一份存储**，Flink / Spark 同一份 SQL / DataStream 同时跑流与批；Paimon / Iceberg 流批读写原生支持。**优**：架构最简 + 一致性最强；**劣**：对引擎和表格式有特定要求（不能跑在 Hive 老版本上）。

**第二层：四维度量化对比。**

| 维度 | Lambda | Kappa | 流批一体 |
| --- | :---: | :---: | :---: |
| 一致性 | 4（合并近似） | 5（EOS） | 5（表格式 ACID） |
| 实时性 | 4（流层秒级） | 5（毫秒） | 5（流层毫秒、批层分钟） |
| 复杂度 | 3（双链路） | 4（单链路） | 5（一份代码） |
| 成本 | 3（双链路资源） | 5（单链路） | 4（统一资源池） |
| AI 友好 | 2（数据需先落批） | 3（数据落 Kafka） | 5（Lakehouse + 向量） |

**第三层：场景化选型。**

- **金融 / 支付（强一致 + 实时）**：
  - 推荐 **Lambda + Iceberg**（批层做 T+1 对账、流层做实时风控）+ 严格审计。
  - **招行** 在交易分析采用 Lambda 架构，**Hudi/Iceberg 落地 + Kafka + Flink** 双链路；下游监管报表走批层、对账走流层。
  - **微众银行** 用 Kappa 架构做秒级风控，Kafka + Flink + Iceberg 端到端 EOS（Exactly-Once Semantics）。
- **电商 / 互联网（高吞吐 + 准实时 + AI）**：
  - 推荐 **流批一体（Flink + Paimon + StarRocks）** 或 **Lakehouse（Iceberg + Spark/Flink + StarRocks）**。
  - **Netflix Keystone**（Kafka + Flink + Iceberg + Pinot）EB 级数据用 Lakehouse 流批融合，支撑 AB 测试。
  - **字节 ByteLake** 用 OSS + Iceberg + Spark/Flink + StarRocks/ClickHouse，替代传统 Lambda，成本有显著下降（【经验】档：本节无法给出可溯源的降幅数字）。
- **AI 平台 / 训练（高吞吐 + 重计算 + 复现性）**：
  - 推荐 **流批一体 + Lakehouse + AI 原生**。
  - **Databricks Data Intelligence Platform**（2024）Lakehouse + MLflow + LLM 一体化，AI 原生架构标杆。
  - **米哈游** 用 Iceberg + Spark/Flink + StarRocks 训练特征表，每次训练用 snapshot tag 复现。

**第四层：演进路径（Lambda → Kappa → 流批一体）。**

- **阶段 1（0 → 1）**：业务简单，**Lambda** 双链路快速跑通；批层 Hive + Spark、流层 Storm/Flink。
- **阶段 2（1 → 10）**：数据量 PB 化、双链路维护成本剧增 → **Kappa** 或 **流批一体**。
  - 选 **Kappa**：纯实时业务（日志、监控），Kafka + Flink，重放历史用 Kafka Tiered Storage + Flink 状态重启。
  - 选 **流批一体**：混合业务（实时 + 离线），Flink + Paimon + StarRocks，代码复用率最高。
- **阶段 3（10 → 100）**：AI 训练 + Agent 介入 → **AI 原生架构**（Lakehouse + 向量库 + LLM）。

**第五层：常见工程权衡。**

- **Lambda 的合并复杂度**：批流结果如何按时间窗口合并、晚到事件（late event）如何处理——是 Lambda 落地最大难点。**LinkedIn** 在 Lambda 实践中开发了专门的"merge view"服务做窗口合并。
- **Kappa 的重放成本**：PB 级数据重放耗时以小时计（【经验】档：时长随数据量与集群规模而异，本节无法给出可溯源的统一数字）——必须在 Kafka 上配 Tiered Storage（S3/OSS）+ Flink 增量 checkpoint。**Netflix Keystone** 用 Kafka Tiered Storage 把重放耗时显著压缩（【经验】档：本节无法给出可溯源的压缩前后时长数字）。
- **流批一体的引擎约束**：Flink 流模式 + 批模式要求引擎统一版本；Paimon 0.9+ 才支持完整的流批读写。**阿里 Flink + Paimon** 是阿里云实时计算 Flink 版上的生产可用组合（【经验】档：本节未附该组合的官方出处与 SLA，引用时请以阿里云官方文档为准）。

**3. 常见陷阱**

- **盲目追求 Lambda 双链路**。业务其实只需实时（如实时大屏），非要 Lambda 跑全量批，浪费资源。**正确**：业务驱动选型，纯实时优先 Kappa。
- **盲目追求 Kappa**。业务有大量 T+1 历史报表（如月度财务），强上 Kappa 需长时间重放历史数据（【经验】档：重放时长随数据量与集群规模而异，本节无法给出可溯源的统一数字）——Lambda 更合适。
- **混淆"流批一体"与"流批并存"**。流批并存 = Lambda；流批一体 = 一份代码。**字节跳动** 早期踩过这个坑，2018 年后统一到 Flink + Paimon 流批一体。
- **忽视 Iceberg V2 流批读写**。Iceberg V2 + Flink 才支持完整流批；V1 只有 Spark Streaming 近似实现。**阿里 Flink + Iceberg** 在 V2 后才进入生产可用阶段。
- **架构僵化**。业务变了架构不变——架构师必须有 ADR + 季度 Review 机制。

**4. 追问预测**

- **「Lambda 架构是否已经过时？」** 答：没有。**金融 / 监管场景** Lambda 仍是事实标准（强审计 + 批流合并）。Lambda 的"过时"主要在互联网场景，湖仓 + 流批一体更优。
- **「Kappa 如何处理 PB 级历史计算？」** 答：① Kafka Tiered Storage 把老数据下沉到 S3/OSS；② Flink Savepoint + 重启 from-savepoint；③ 关键指标走预聚合（分钟级 / 小时级）避免全量重算。
- **「流批一体落地最大的坑是什么？」** 答：引擎版本一致性 + 表格式选型（Paimon / Iceberg V2 / Delta）+ Flink 状态后端（rocksdb vs filesystem）。**阿里** 在 Flink 1.15 后才稳定支持 Paimon 流批一体。
- **「Lambda 能否一步迁移到流批一体？」** 答：可以但风险大。**推荐路径**：Lambda → Lakehouse（Iceberg + Flink + Spark 跑同一份数据）→ 流批一体（去掉 Spark 批、Flink 同时跑流批）。

**5. 参考资料**

- Nathan Marz《How to Beat the CAP Theorem》——Lambda 架构原始论文。
- Jay Kreps《Questioning the Lambda Architecture》——Kappa 架构原始论文与"为什么 Lambda 复杂"。
- Databricks《Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics》——Lakehouse 原始论文。
- Apache Flink 官方文档《Streaming Concepts》——流批一体的工程基础。
- Apache Paimon 官方文档《Streaming Lakehouse》——Paimon 流批一体的实现细节。
- **Netflix Keystone（Kafka + Flink + Iceberg + Pinot）** —— Netflix EB 级数据用 Lakehouse 流批融合替代 Lambda 的工程实践。
- **字节跳动 ByteLake** —— 字节跳动自研 Lakehouse，PB 级替代 Lambda，成本与性能均有显著改善（【经验】档：本节无法给出可溯源的降幅与倍数）。
- **LinkedIn Lambda 合并实践** —— LinkedIn 内部"merge view"服务做批流窗口合并，是工业级 Lambda 标杆。
- **阿里 MaxCompute + Hologres 双引擎** —— 阿里双 11 期间 PB 级数仓 + 实时 OLAP，Lambda + Kappa 混合架构。
- **微众银行 Kappa 实时风控** —— 微众银行秒级风控用 Kappa 架构，Kafka + Flink + Iceberg 端到端 EOS。
- **米哈游 Iceberg + StarRocks AI 训练** —— 米哈游训练特征表用 Iceberg snapshot tag 做训练复现。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §11.1.1 请从表格式底层（文件布局 + 元数据 + ACID + 流批读写）四个维度系统对比 Apache Iceberg、Apache Hudi、Delta Lake、Apache Paimon 四种湖仓表格式，并结合实时数仓、离线分析、AI 训练三个场景说明选型决策。

**1. 考察点**

- 是否能讲清四种表格式的**底层架构差异**：Iceberg 的 manifest list、Hudi 的 Timeline、Delta 的 `_delta_log`、Paimon 的 LSM 树。
- 是否能用「**ACID 实现机制 + 流批读写 + Compaction 策略 + 生态成熟度**」四个维度量化对比。
- 是否能针对**实时数仓（Flink CDC）**、**离线分析（Spark 批）**、**AI 训练（snapshot 复现）** 三个场景给出可落地方案。
- 加分项：能讲清"**Paimon 之于 Iceberg**"——Paimon 是 Flink 社区专为流批一体设计的下一代表格式，LSM 树 + 主键索引对 CDC 场景更友好。

**2. 参考答案框架**

**第一层：底层文件布局。**

- **Iceberg**：分层元数据 = `metadata.json`（当前 schema + snapshot 列表 + partition spec）+ 每个 snapshot 指向一个 `manifest list` + 每个 manifest 指向一组 Parquet/ORC/Avro 数据文件。**字段 ID 永久存储**——schema 演进通过字段 ID 不变性保证 Backward 兼容。
- **Hudi**：基于 Timeline（commit / delta_commit / compaction / replace_commit）+ Commit Metadata（`.hoodie` 元数据文件）。Copy-on-Write（CoW）每次 commit 生成新 base file；Merge-on-Read（MoR）保留 base + log 文件，**Hudi 内建 `_hoodie_commit_time` / `_hoodie_file_name` 字段**供 Time Travel。
- **Delta Lake**：单层元数据 = `_delta_log/00000000000000000001.json`（每个事务一个 JSON）+ `00000000000000000010.checkpoint.parquet` 快照。JSON 是 append-only 顺序写；Schema + AddFile / RemoveFile 都在 JSON 中追加。
- **Paimon**：基于 **LSM 树**（Log-Structured Merge Tree）+ 主键索引（类似 RocksDB / HBase），**专为流批一体设计**。数据先写 Log File，再后台 Compact 成 Sorted Run / Level 文件；主键索引支持高效点查 + 更新删除。**Flink CDC 场景**写入性能明显优于 Iceberg/Hudi（【经验】档：倍数随写入模式、主键更新比例与并发而异，本节无法给出可溯源的统一数字）。

**第二层：四维度量化对比。**

| 维度 | Iceberg | Hudi | Delta Lake | Paimon |
| --- | :---: | :---: | :---: | :---: |
| ACID 实现 | Snapshot Isolation（MVCC） | MVCC（Timeline） | Optimistic Concurrency | LSM + 主键 |
| 流批读写 | V2+ Flink 流读 / Spark 流批 | MoR / CoW + Flink | Structured Streaming | Flink 流批原生 |
| Compaction | rewrite_data_files | schedule + run | OPTIMIZE | FLINK AUTO COMPACT |
| 生态成熟度 | 高（多引擎） | 中（Spark 主导） | 高（Databricks 一手） | 中（增长中） |
| CDC 性能 | 中 | 中（MoR） | 中 | 高（LSM） |
| AI 友好 | 高（snapshot tag） | 中 | 中（Databricks MLflow） | 中 |

**第三层：场景化选型。**

- **实时数仓（Flink CDC + Kafka）**：
  - 推荐 **Paimon**（Flink 社区首选）+ **Iceberg V2**（多引擎兼容）。
  - **字节跳动** 在实时数仓用 Paimon（Flink CDC → Paimon → StarRocks），**米哈游** 用 Paimon 落地实时游戏事件分析。
  - **Apache Flink 官方推荐**：Flink CDC + Paimon 是官方推荐组合，2024 年后逐步替代 Iceberg/Hudi 在流式场景的位置。
- **离线分析（Spark 批 + 多引擎共享）**：
  - 推荐 **Iceberg**（多引擎 + 标准开放）+ **Delta Lake**（Databricks 生态）。
  - **Netflix** 用 Iceberg 做离线分析 + AI 训练，**阿里 DataWorks** 用 Iceberg 做双 11 大数据离线分析。
  - **Databricks 用户** 默认 Delta（与 MLflow / Unity Catalog 无缝集成）。
- **AI 训练（snapshot 复现 + 多框架共享）**：
  - 推荐 **Iceberg V3**（snapshot tag + Variant 类型 + Row Lineage）+ **Delta Lake**（Databricks MLflow 一体化）。
  - **Netflix** 训练特征表用 Iceberg V3 + snapshot tag，**Databricks** 用 Delta + MLflow run params 做训练复现。
- **金融强审计（永久保留 + 严格回滚）**：
  - 推荐 **Delta Lake**（Databricks）+ 严格保留策略（365 天）。
  - **Stripe** 用 Delta 做支付账本回滚，"用户投诉一笔 90 天前的订单 → 找到 version number → 分钟级恢复"。
  - **招行** 用 Delta Lake 生产 SOP 规定 VACUUM 前必须确认无未关闭工单。

**第四层：演进路径与生态判断。**

- **Iceberg**：定位"**开放表格式标准**"，多引擎（Spark/Flink/Trino/StarRocks/Doris）共享，**2024 年事实标准**。
- **Delta**：定位"**Databricks 一手生态**"，Spark 体验最佳，**Unity Catalog** + **MLflow** 闭环，外部引擎通过 Delta UniForm 接入。
- **Hudi**：定位"**CDC + 增量处理**"，Uber 一手孵化，**MoR 表在 CDC 场景仍有优势**，但生态增量被 Paimon 蚕食。
- **Paimon**：定位"**Flink 流批一体 + LSM 高性能**"，阿里 + Flink 社区共同推进，**2024–2025 增势领先**（【经验】档：本节无法给出可溯源的采用率与增速数据），CDC 场景首选。

**第五层：常见工程权衡。**

- **Iceberg 的 Hidden Partition**：自动按时间/字段分区，无需手动指定，**Netflix** 大幅降低 SQL 维护成本。
- **Hudi MoR 表的 Time Travel**：base + log 合并读才能拿到一致性视图，查询性能差但写入快——适合 **CDC 实时接入**（Uber 用 Hudi MoR 接入 MySQL binlog）。
- **Delta 的 Checkpoint Parquet**：每 10 commit 生成 checkpoint.parquet 加速启动，**Databricks Unity Catalog** 自动管理 checkpoints + log retention。
- **Paimon 的 LSM 写放大**：高频 Compaction 会带来写放大，需调优 `num-sorted-run` / `compaction.interval`。

**3. 常见陷阱**

- **以为"表格式差异不大"**。Iceberg 的 Hidden Partition、Hudi 的 MoR/CoW、Delta 的 UniForm、Paimon 的 LSM 是**根本性的工程差异**——选错表格式重写代价巨大。
- **以为 Iceberg V1 支持完整流读**。Iceberg V1 只有 Spark Streaming 近似流读，**V2 才有 Flink 流读完整支持**——必须升级到 V2。
- **混淆 Hudi MoR 与 CoW 的查询延迟**。MoR 写入快但查询慢，CoW 写入慢但查询快——CDC 场景选 MoR、报表场景选 CoW。
- **Paimon 0.8 之前的流批写不完整**。必须升级到 **Paimon 0.9+** 才支持完整流批读写 + 主键索引 + LSM Compaction。
- **以为 Delta 只支持 Databricks 生态**。**Delta UniForm** 让 Delta 数据支持 Iceberg / Hudi 引擎读取——一份 Delta 数据可在 Trino、StarRocks、Doris 上查询。

**4. 追问预测**

- **「Paimon 与 Iceberg 选哪个？」** 答：纯 Flink 实时场景选 **Paimon**（CDC + 流批一体）；多引擎（Spark/Flink/Trino）混合场景选 **Iceberg**（生态成熟）。
- **「Iceberg V3 的 Variant 类型有什么价值？」** 答：Variant 是半结构化数据（JSON / BSON / Protobuf），存储为 Parquet 二进制列；schema 演进时 metadata.json 更新 Variant 定义，旧数据仍可读。**AI 场景** 用 Variant 存 LLM 输出 + 埋点。
- **「Hudi 是否会被 Paimon 取代？」** 答：Hudi MoR 在 CDC 仍有优势，但增量处理被 Paimon 蚕食。**Uber 内部** 同时使用 Hudi（CDC）+ Paimon（实时数仓），两套并存。
- **「表格式选型错了怎么办？」** 答：表格式之间可通过 **Delta UniForm**（Delta → Iceberg / Hudi）或 **Iceberg REST Catalog** 迁移，但 schema 重映射 + 数据重写代价不小——选型必须有 POC + ADR。

**5. 参考资料**

- Apache Iceberg 规范 V2/V3——manifest list / snapshot / metadata.json 的官方定义。
- Apache Hudi 官方文档——Timeline / Commit / MoR / CoW 的工程实现。
- Delta Lake 官方文档《Time Travel》+《UniForm》——`_delta_log` + checkpoint + 跨引擎读取。
- Apache Paimon 官方文档《Streaming Lakehouse》——LSM 树 + 主键索引 + 流批读写。
- Netflix Tech Blog《Iceberg V3 at Netflix》——Netflix 训练特征表用 Iceberg V3 + snapshot tag 复现。
- **Uber Hudi CDC + Time Travel** —— Uber 用 Hudi MoR 接入 MySQL binlog，Timeline 提供秒级回滚。
- **字节跳动 Paimon + Iceberg 双轨** —— 字节跳动在实时数仓用 Paimon、离线数仓用 Iceberg，两套 Time Travel 互为备份。
- **阿里 Flink + Paimon 实时数仓** —— 阿里云实时计算 Flink 版默认推荐 Paimon（【经验】档：本节未附该组合的官方出处与 SLA，引用时请以阿里云官方文档为准）。
- **米哈游 Paimon 实时游戏事件** —— 米哈游用 Paimon 落地实时游戏事件分析，CDC + 流批一体。
- **Databricks Delta + MLflow 一体化** —— Databricks MLflow run params 引用 Delta snapshot tag 做训练复现。
- **Stripe Delta 支付账本回滚** —— Stripe 用 Delta Lake 做支付账本回滚，分钟级定位任意历史 version。
- **招行 Delta Lake 生产 SOP** —— 招行金融场景 Delta Lake 的"VACUUM 前必须确认无未关闭工单"硬性规范。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §11.2.1 请从存储架构、查询模型、写入吞吐、JOIN 能力、生态成熟度五个维度系统对比 Apache Doris、StarRocks、ClickHouse、Snowflake、Google BigQuery 五种主流 OLAP 引擎，并结合实时大屏、Ad-hoc 分析、湖仓加速三个场景说明选型决策。

**1. 考察点**

- 是否能讲清五种 OLAP 引擎的**架构差异**：Doris / StarRocks 的 MPP + 向量化、ClickHouse 的列存 + 预聚合、Snowflake 的存算分离 + 微分区、BigQuery 的无服务器 + Dremel / Capacitor / Jupiter 三层架构。
- 是否能用「**写入吞吐、查询延迟、JOIN 能力、并发能力、TCO**」五个维度量化对比，而不是停留在"性能快慢"。
- 是否能针对**实时大屏（高并发 + 低延迟）**、**Ad-hoc 分析（高吞吐 + 灵活 JOIN）**、**湖仓加速（Iceberg/Hudi 直接查询）** 三个场景给出可落地方案。
- 加分项：能讲清"**StarRocks 之于 Doris**"——StarRocks 是 Doris 的下一代演进（向量化 + CBO + Lakehouse 直读），Doris 2020 年后逐步融合 StarRocks 的设计哲学。

**2. 参考答案框架**

**第一层：底层架构对比。**

- **Apache Doris**：MPP 架构 + 列存 + 向量化执行；前端 FE（Frontend）做 SQL 解析 + 调度，后端 BE（Backend）做存储 + 计算。**优**：MySQL 协议兼容、运维简单、单表查询极快；**劣**：JOIN 复杂场景弱于 StarRocks，Lakehouse 直读能力 2023 年后补齐。
- **StarRocks**：从 Doris 演进而来（早期叫 DorisDB），**CBO 优化器 + 向量化 + Lakehouse 直读**；FE + BE + CN（CN 为存算分离模式下的计算节点）多层架构。**优**：复杂 JOIN 强、湖仓直读（Iceberg/Hudi/Paimon）+ 主键模型 + 实时更新；**劣**：运维复杂度高于 Doris。
- **ClickHouse**：列存 + 预聚合（Materialized View）+ 向量化；早期是单分片架构，后引入 Distributed 集群。**优**：单表查询极快、压缩比高、写入吞吐大；**劣**：JOIN 能力弱（早期版本不支持分布式 JOIN）、生态相对独立。
- **Snowflake**：存算分离 + 微分区（Micro-Partition）+ 多云集群（AWS/Azure/GCP）。**优**：免运维、按查询付费、自动扩缩容、Time Travel 内置；**劣**：成本高（大型查询按秒计费）、专有存储不擅长 AI 训练。
- **Google BigQuery**：无服务器（Serverless）+ Dremel 查询引擎 + Capacitor 列存 / Jupiter 网络（存算分离三层架构）。**优**：按查询计费 + 自动扩缩容 + 与 GCP 生态深度集成；**劣**：冷查询延迟较高、专有云（GCP 主导）。

**第二层：五维度量化对比。**

| 维度 | Doris | StarRocks | ClickHouse | Snowflake | BigQuery |
| --- | :---: | :---: | :---: | :---: | :---: |
| 写入吞吐 | 中 | 中–高 | 高（单表） | 中 | 中 |
| 单表查询 | 高 | 高 | 极高 | 高 | 高 |
| JOIN 能力 | 中–高 | 高 | 中（弱） | 高 | 高 |
| 并发能力 | 中 | 高 | 中 | 极高（自动扩） | 极高 |
| 湖仓直读 | 弱 | 高（原生） | 中（External Table） | 中（Iceberg） | 中（BigLake） |
| TCO（5 年） | 低（自建） | 中（自建） | 低（自建） | 高（云付费） | 中（云付费） |
| 运维复杂度 | 低 | 中 | 中 | 极低 | 极低 |

**第三层：场景化选型。**

- **实时大屏（高并发 + 亚秒延迟 + 数据量 TB 级）**：
  - 推荐 **StarRocks / Doris**（自建）+ **ClickHouse**（超高写入吞吐）。
  - **小米 / 快手 / 字节跳动** 用 Doris / StarRocks 支撑亿级 DAU 实时大屏，**米哈游** 用 ClickHouse 支撑游戏运营实时监控。
  - **永辉超市** 用 Doris 支撑新零售实时库存大屏；**美的集团** 用 Doris 做工业互联网实时监控。
- **Ad-hoc 分析（高吞吐 + 灵活 JOIN + 数据量 PB 级）**：
  - 推荐 **StarRocks**（JOIN 强 + 湖仓直读）+ **Snowflake**（免运维）。
  - **携程 / 哔哩哔哩** 用 StarRocks 替代传统 Hive + Presto 做 Ad-hoc 分析；**Snowflake** 在 SaaS 行业占据领先份额，Ad-hoc 体验最佳（【经验】档：本节无法给出可溯源的市场份额数字）。
  - **平安集团** 用 StarRocks + Iceberg 做风控分析，复杂 JOIN 性能明显优于 Presto（【经验】档：倍数随查询形态与数据布局而异，本节无法给出可溯源的统一数字）。
- **湖仓加速（Iceberg/Hudi/Paimon 直接查询）**：
  - 推荐 **StarRocks**（原生湖仓直读）+ **Trino**（联邦查询）。
  - **字节跳动** 用 StarRocks + Iceberg 做湖仓加速，**Netflix** 用 StarRocks 替代部分 Hive 查询。
  - **Databricks** 用 Photon engine + Delta 做湖仓加速；**Snowflake** 用 Iceberg Table 做湖仓加速。

**第四层：演进路径与生态判断。**

- **Doris**：定位"**MySQL 兼容 + 单表极致 + 运维简单**"，**Apache 顶级项目**（2022），中文社区最强。
- **StarRocks**：定位"**JOIN 强 + 湖仓直读 + 实时更新**"，**社区开源 + CelerData 商业发行**（Apache 2.0 许可），中国 + 北美双轨。
- **ClickHouse**：定位"**单表极致 + 写入吞吐 + 预聚合**"，**俄罗斯 Yandex 开源**，北美生态强。
- **Snowflake**：定位"**云数仓产品化 + 免运维**"，**SaaS 行业占据领先份额**，DWaaS 标杆（【经验】档：本节无法给出可溯源的市场份额数字）。
- **BigQuery**：定位"**无服务器 + GCP 生态**"，**Google 内部生态**，GCP 客户首选。

**第五层：常见工程权衡。**

- **Doris vs StarRocks 的运维门槛**：Doris 单 binary 部署 + MySQL 协议，运维简单；StarRocks 多层架构（FE + BE + CN），运维复杂度更高但 JOIN 性能更强。
- **ClickHouse 的 JOIN 弱**：ClickHouse 早期版本不支持分布式 JOIN，**2022 年后** 引入 Distributed JOIN 但仍弱于 StarRocks。**米哈游** 在 ClickHouse 上做"宽表预聚合"规避 JOIN。
- **Snowflake 的成本控制**：Snowflake 按秒计费 + 自动扩缩容，**大型查询** 单次花费可达数千美元量级（【经验】档：金额随扫描量、并发与折扣而异，本节无法给出可溯源的统一数字）——必须配 Resource Monitor + 自动化 Query Tag。
- **BigQuery 的冷查询**：BigQuery 是按列扫描计费，**冷查询延迟** 为数十秒量级（冷数据未命中缓存，需从 Capacitor 列存直接读取）；**热查询** 延迟为秒级（【经验】档：绝对值随扫描量、缓存命中与并发而异，本节无法给出可溯源的统一数字）。

**3. 常见陷阱**

- **以为 ClickHouse 能做所有 OLAP 场景**。ClickHouse JOIN 弱、并发弱（单 query 多核）、运维复杂（多分片 + Zookeeper）——不适合 Ad-hoc 分析，只适合单表 + 预聚合。
- **以为 Doris 与 StarRocks 完全等价**。Doris 单 binary + MySQL 协议 = 运维简单；StarRocks JOIN + 湖仓直读 + 实时更新 = 性能更强。**小米 / 美的 / 永辉** 用 Doris（简单），**携程 / 平安 / 字节** 用 StarRocks（复杂）。
- **以为 Snowflake 一定比自建贵**。Snowflake 在**中等查询量**场景下比自建 StarRocks + 运维团队便宜；**大型查询量**场景下自建更划算。**TCO 对比必须按 5 年**。
- **以为 BigQuery 只服务 GCP 客户**。BigQuery 通过 **BigQuery Omni** 支持 AWS/Azure 数据源，**多云场景**也可考虑。
- **湖仓直读性能 ≠ 物理表性能**。StarRocks + Iceberg 直读比 StarRocks 内部表性能明显更低（【经验】档：倍数随扫描量、分区裁剪效果与文件布局而异，本节无法给出可溯源的统一数字）；**关键查询仍需导入 StarRocks 内部表**。

**4. 追问预测**

- **「实时大屏 1000 QPS、亚秒延迟选哪个？」** 答：**StarRocks** / **Doris** 自建为主；**ClickHouse** 适合单表预聚合场景；**Snowflake** 适合"中等并发 + 免运维"。
- **「JOIN 性能谁最强？」** 答：**StarRocks** + **Snowflake** + **BigQuery** 三家最强（Doris 次之，ClickHouse 最弱）。复杂 JOIN 场景优先 StarRocks。
- **「湖仓直读会替代物理表吗？」** 答：**不会**。湖仓直读性能明显低于物理表（【经验】档：倍数随查询形态而异，本节无法给出可溯源的统一数字）；**关键查询**仍走物理表，**临时查询 / 探索式查询**走湖仓直读。
- **「OLAP 引擎选型错了能换吗？」** 答：能但代价大。SQL 方言不同（StarRocks SQL vs ClickHouse SQL vs Snowflake SQL 等）、数据迁移成本高——必须 POC + ADR。

**5. 参考资料**

- Apache Doris 官方文档《Architecture》——FE + BE + MPP 架构。
- StarRocks 官方文档《CBO Optimizer》——向量化 + CBO + 湖仓直读。
- ClickHouse 官方文档《Distributed Query》——Distributed JOIN 的最新实现。
- Snowflake 官方文档《Micro-Partitions》——存算分离 + 微分区。
- Google BigQuery 官方文档《Capacitor》——Dremel / Capacitor / Jupiter 三层存储与执行分离架构。
- **小米 / 快手 / 字节跳动 Doris 实时大屏** —— 亿级 DAU 实时大屏用 Doris / StarRocks 支撑。
- **米哈游 ClickHouse 游戏运营** —— ClickHouse 支撑游戏运营实时监控，宽表预聚合规避 JOIN 弱。
- **携程 / 哔哩哔哩 StarRocks Ad-hoc** —— StarRocks 替代 Hive + Presto 做 Ad-hoc 分析。
- **Snowflake SaaS 行业领先份额** —— Snowflake 在 SaaS 行业占据领先份额，DWaaS 标杆（【经验】档：本节无法给出可溯源的市场份额数字）。
- **永辉超市 Doris 新零售** —— 永辉用 Doris 支撑新零售实时库存大屏。
- **美的集团 Doris 工业互联网** —— 美的用 Doris 做工业互联网实时监控。
- **平安集团 StarRocks + Iceberg 风控** —— 平安用 StarRocks + Iceberg 做风控分析，JOIN 性能明显优于 Presto（【经验】档：倍数本节无法给出可溯源的统一数字）。
- **字节跳动 StarRocks + Iceberg 湖仓加速** —— 字节用 StarRocks + Iceberg 做湖仓加速，替代部分 Hive 查询。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §11.3.1 请从计算模型、生态成熟度、流批一体能力、AI 集成四个维度对比 Apache Spark、Apache Flink、Trino/Presto 三种主流计算引擎，并结合离线批、实时流、Ad-hoc 查询三个场景说明分工协作。

**1. 考察点**

- 是否能讲清三种引擎的**核心定位差异**：Spark（批 + 离线 ETL）、Flink（流 + 实时计算）、Trino/Presto（Ad-hoc 联邦查询）。
- 是否能用「**批处理吞吐、流处理延迟、查询并发、AI 集成**」四个维度量化对比。
- 是否能针对**离线批（ETL + 数据加工）**、**实时流（CDC + 实时计算）**、**Ad-hoc 查询（联邦查询）** 三个场景给出可落地方案。
- 加分项：能讲清"**Spark Structured Streaming 与 Flink 的本质差异**"——Spark 是微批（micro-batch）近似流、Flink 是原生流（native streaming）。

**2. 参考答案框架**

**第一层：核心定位差异。**

- **Apache Spark**：基于 RDD + DataFrame + DataSet 的**通用批处理引擎**，通过 Spark Structured Streaming 提供微批（micro-batch）流处理。**核心场景**：离线 ETL + 数据加工 + 机器学习（MLlib + MLflow 集成）。
- **Apache Flink**：基于 DataStream + Table API 的**原生流处理引擎**，通过批模式（batch mode）模拟批处理。**核心场景**：实时计算（毫秒级延迟）+ Flink CDC（数据库变更捕获）+ 流批一体。
- **Trino/Presto**：基于 ANSI SQL 的**联邦查询引擎**（原 PrestoDB 团队创建 Trino），从 Hive Metastore / RDBMS / Kafka / Iceberg / S3 直接查询。**核心场景**：Ad-hoc 查询 + 跨数据源联邦查询。

**第二层：四维度量化对比。**

| 维度 | Spark | Flink | Trino/Presto |
| --- | :---: | :---: | :---: |
| 计算模型 | 批（微批流） | 原生流（批模式） | 联邦查询 |
| 批处理吞吐 | 极高 | 高（批模式） | 中（不擅长深 ETL） |
| 流处理延迟 | 秒级（微批） | 毫秒级 | 不擅长 |
| 查询并发 | 中（一个 Driver） | 高（JobManager） | 高（Coordinator） |
| 生态成熟度 | 极高 | 高（流） | 高（查询） |
| AI 集成 | 高（MLlib / MLflow） | 中 | 中 |
| 湖仓直读 | 高 | 高 | 极高（联邦） |

**第三层：场景化分工协作。**

- **离线批（ETL + 数据加工 + AI 训练）**：
  - **Spark** 是事实标准——RDD/DataFrame API + Spark SQL + MLlib + Structured Streaming。
  - **Databricks** 是 Spark 商业化标杆；**阿里 MaxCompute** 兼容 Spark API；**字节跳动** 用 Spark 做离线数据加工。
  - **Uber** 用 Spark 做离线 ETL + 特征工程，**Netflix** 用 Spark 做大规模数据加工。
- **实时流（CDC + 实时计算 + 实时大屏）**：
  - **Flink** 是事实标准——DataStream API + Table API + Flink CDC + 状态后端（RocksDB）。
  - **字节跳动** 用 Flink 做实时大屏（双 11 + 春晚红包），**阿里** 用 Flink 做实时计算（双 11 GMV 大屏）。
  - **米哈游** 用 Flink 做游戏事件实时处理，**微众银行** 用 Flink 做秒级风控。
- **Ad-hoc 查询（联邦查询 + 跨数据源）**：
  - **Trino/Presto** 是事实标准——ANSI SQL + Connector 联邦（Hive/Iceberg/MySQL/Kafka/S3）。
  - **Netflix** 用 Presto/Trino 做 Ad-hoc 查询，**Uber** 用 Presto 做交互式分析。
  - **字节跳动** 用 Trino 做内部 BI 探索查询，**LinkedIn** 用 Presto 做数据探索。

**第四层：流批一体的工程实践。**

- **Spark Structured Streaming** 提供微批流处理（trigger interval），**Spark 2.3（2018）** 引入 Continuous Processing（毫秒级，但长期处于实验性、功能受限）。
- **Flink** 在 1.15+ 完整支持流批一体（流模式 + 批模式），代码复用率最高。
- **Paimon / Iceberg V2 + Flink** 是当前主流流批一体组合。
- **Spark + Delta Lake + Structured Streaming** 是 Databricks 的流批一体路径。

**第五层：AI 时代的演进方向。**

- **Spark + MLflow** 仍是 AI 训练的事实标准，**Databricks** 通过 Delta + MLflow 闭环。
- **Flink + AI** 通过 Flink ML（流式机器学习）+ Flink + LLM 集成，**阿里 + Flink** 在 Flink ML 投入较多。
- **Trino + AI** 通过 Trino + LLM 集成（TrinoGPT）做 NL2SQL。
- **大模型时代新趋势**：**Spark + Ray** 分布式计算、**Flink + Flink AI** 流式机器学习、**Trino + LLM** 智能查询。

**3. 常见陷阱**

- **把 Spark 当万能引擎**。Spark Structured Streaming 是微批流，**毫秒级实时** 必须用 Flink；**联邦查询** 必须用 Trino/Presto。**字节跳动** 早期用 Spark Streaming 做实时，2018 年后切换到 Flink。
- **把 Flink 当万能引擎**。Flink 批模式虽支持，但**批处理吞吐** 仍弱于 Spark；**离线 ETL 首选 Spark**。
- **把 Trino/Presto 当数据仓库**。Trino/Presto 是查询引擎，**不做存储**；底层数据仍在 Hive/Iceberg/RDBMS。
- **混淆 PrestoDB 与 Trino**。**PrestoDB**（Facebook 维护）与 **Trino**（原 PrestoSQL 团队独立）已分叉，Trino 更活跃，**新项目选 Trino**。
- **忽视 Flink 状态后端**。Flink 默认状态后端是 HashMapStateBackend，**生产环境必须用 RocksDBStateBackend**（支持大状态 + 增量 checkpoint）。

**4. 追问预测**

- **「流批一体选 Spark 还是 Flink？」** 答：**Flink + Paimon**（流批一体首选）或 **Spark + Delta + Structured Streaming**（Databricks 生态）。纯流处理首选 Flink，纯批处理首选 Spark。
- **「Flink CDC 与 Spark CDC 怎么选？」** 答：**Flink CDC**（Flink CDC 2.x + Flink 1.14+）是事实标准，支持 MySQL/PostgreSQL/MongoDB 全量 + 增量；**Spark CDC** 通过 Spark Streaming + Debezium 实现，复杂度高于 Flink。
- **「Trino 与 StarRocks 怎么分工？」** 答：Trino 做**联邦查询 + 探索式**（多数据源），StarRocks 做**高性能 OLAP**（单数据源 + 湖仓加速）。**字节跳动** 同时使用两者互补。
- **「AI 训练数据加工用哪个？」** 答：**Spark** 是事实标准（MLlib + MLflow + Structured Streaming），**Databricks Data Intelligence Platform** 是工业级参考架构。

**5. 参考资料**

- Apache Spark 官方文档《Structured Streaming》——微批流处理 + Continuous Processing。
- Apache Flink 官方文档《Streaming Concepts》——原生流处理 + 流批一体。
- Trino 官方文档《Connectors》——联邦查询 + 多数据源。
- Databricks Engineering Blog《Data Intelligence Platform》——Spark + Delta + MLflow 一体化。
- **Databricks Spark + Delta + MLflow** —— Databricks Data Intelligence Platform 工业级参考架构。
- **字节跳动 Flink 实时大屏** —— 字节用 Flink 支撑双 11 + 春晚红包实时大屏。
- **阿里 Flink + MaxCompute 实时计算** —— 阿里双 11 期间 Flink + MaxCompute + Hologres 实时大屏。
- **Netflix Presto/Trino Ad-hoc 查询** —— Netflix EB 级数据用 Presto/Trino 做 Ad-hoc 查询。
- **Uber Spark 离线 ETL + 特征工程** —— Uber 用 Spark 做离线 ETL + 特征工程。
- **LinkedIn Presto 数据探索** —— LinkedIn 用 Presto 做内部数据探索。
- **米哈游 Flink 游戏事件实时处理** —— 米哈游用 Flink 做游戏事件实时处理 + CDC。
- **微众银行 Flink 秒级风控** —— 微众银行用 Flink + Kafka + Iceberg 做秒级风控。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §12.4.1 请从架构模型、扩展性、容错机制、生态成熟度四个维度系统对比 Apache Airflow、Apache DolphinScheduler、LinkedIn Azkaban 三种主流调度系统，并结合 DAG 复杂度、多团队多租户、云原生三个场景说明选型决策。

**1. 考察点**

- 是否能讲清三种调度系统的**架构差异**：Airflow（Python DAG + Executor）、DolphinScheduler（可视化 DAG + Master/Worker）、Azkaban（Web 调度 + Executor）。
- 是否能用「**DAG 复杂度、多租户、扩展性、容错**」四个维度量化对比。
- 是否能针对**复杂 DAG（多分支 + 循环）**、**多团队多租户**、**云原生（K8s + Argo）** 三个场景给出可落地方案。
- 加分项：能讲清"**Airflow 与 K8s 的集成**"——Airflow 通过 KubernetesExecutor / CeleryExecutor 在 K8s 上跑 task；**Argo Workflows** 是 K8s 原生 DAG。

**2. 参考答案框架**

**第一层：核心架构差异。**

- **Apache Airflow**：Python DAG（DAG 即 Python 代码）+ Executor（SequentialExecutor / LocalExecutor / CeleryExecutor / KubernetesExecutor / CeleryKubernetesExecutor）+ Scheduler + Web Server。**核心哲学**："**Configuration as Code**"，DAG 用 Python 定义。
- **Apache DolphinScheduler**：可视化 DAG（DAG 通过拖拽生成）+ Master/Worker（去中心化架构）+ Zookeeper 注册中心 + 任务队列（Task Queue）。**核心哲学**："**DAG as UI**"，DAG 通过 Web 拖拽生成。
- **LinkedIn Azkaban**：Web 调度（上传 ZIP 包 + .job 文件）+ Executor（Executor Server）+ MySQL 元数据存储。**核心哲学**："**DAG as File**"，DAG 通过 .job 文件定义。

**第二层：四维度量化对比。**

| 维度 | Airflow | DolphinScheduler | Azkaban |
| --- | :---: | :---: | :---: |
| DAG 定义 | Python 代码 | 可视化拖拽 | .job 文件 |
| DAG 复杂度 | 极高（动态 DAG） | 高（静态 DAG） | 中（静态 DAG） |
| 多租户 | 中（Pool + RBAC） | 高（租户 + 权限 + 资源） | 低（单租户） |
| 扩展性 | 高（Operator 插件） | 中 | 低 |
| 容错机制 | 高（Retry + SLA） | 高（失败重试 + 告警） | 中 |
| 云原生 | 高（K8s Executor） | 中 | 低 |
| 生态成熟度 | 极高（Plugin 生态） | 中（中国生态强） | 中（LinkedIn 维护） |
| 学习曲线 | 陡（Python + DAG） | 中（Web 操作） | 平缓 |

**第三层：场景化选型。**

- **复杂 DAG（多分支 + 动态生成 + Python 配置）**：
  - 推荐 **Airflow**——Python DAG + 动态 DAG（DagBag）+ Jinja 模板。
  - **LinkedIn** 是 Airflow 的主要使用者，**Airbnb** 起源，**Uber** 用 Airflow 做离线调度。
  - **Netflix** 早期用过 Airflow，后自研统一工作流编排层 Maestro（多后端执行——Maestro 不是基于 Airflow 的二次开发）。
- **多团队多租户（多业务线 + 资源隔离 + 权限管控）**：
  - 推荐 **DolphinScheduler**——租户 + 用户 + 资源 + 权限四层模型。
  - **Apache DolphinScheduler** 是中国 Apache 顶级项目（2021），**阿里 / 字节跳动 / 美团 / 招行** 等中国企业大量使用。
  - **永辉超市 / 美的集团** 用 DolphinScheduler 做多团队多租户调度。
- **LinkedIn 存量 Hadoop 集群（轻量 + 稳定）**：
  - 推荐 **Azkaban**——轻量、稳定、运维简单。
  - **LinkedIn** 是 Azkaban 的主要使用者，**Hadoop 生态**默认调度。

**第四层：云原生调度演进。**

- **Airflow + K8s Executor**：通过 `KubernetesExecutor` 在 K8s 上动态创建 Pod 运行 Task——**字节跳动 / Uber** 在云上用 Airflow + K8s 做调度。
- **Argo Workflows**：K8s 原生 DAG（CRD + Container），**Kubernetes 原生调度**首选。
- **Apache DolphinScheduler + K8s**：通过 K8s 资源池做弹性，**阿里云 + DolphinScheduler** 提供 K8s 集成。
- **Temporal**：分布式工作流引擎，**高复杂度 + 多步骤**场景首选。

**第五层：常见工程权衡。**

- **Airflow 的 DAG 膨胀**：DAG 数量到数千个后，Web Server 加载明显变慢（【经验】档：阈值随 DAG 复杂度与解析方式而异，本节无法给出可溯源的统一数字）——必须按业务域拆分 Airflow 集群 + 多 Web Server。**LinkedIn** 内部用 10+ Airflow 集群。
- **DolphinScheduler 的 DAG 复杂度**：DolphinScheduler 强项是"**可视化 + 多租户**"，弱项是"**动态 DAG**"——复杂 Python DAG 仍需 Airflow。
- **Azkaban 的扩展性**：Azkaban 单 Executor Server 容量有限（数千任务规模后性能下降，【经验】档：阈值随任务类型与并发而异，本节无法给出可溯源的统一数字），**LinkedIn 内部** 多集群部署。
- **云原生调度的选型**：**K8s 上简单 DAG** → Argo Workflows；**K8s 上复杂 DAG + 数据集成** → Airflow + K8s Executor。

**3. 常见陷阱**

- **以为 Airflow = 万能调度**。Airflow DAG 膨胀后 Web Server 慢 + Scheduler 单点是问题；**多 Airflow 集群** + **多 Web Server** 必须架构设计。
- **以为 DolphinScheduler 是 Airflow 平替**。DolphinScheduler 是**多租户 + 可视化**优先，**动态 DAG + Python** 不如 Airflow 灵活。
- **以为 Azkaban 过时**。**LinkedIn 内部** 仍在大规模跑 Azkaban（存量 Hadoop 集群），**Hadoop 生态** Azkaban 是经典。
- **忽视 DAG 版本控制**。Airflow 通过 Git 管理 DAG，DolphinScheduler 通过资源中心管理，**DAG 必须走 Git + CI/CD**。
- **以为 K8s 上调度简单**。**Airflow K8s Executor** 每次 Task 创建 Pod 有数秒级开销（【经验】档：绝对值随镜像拉取与集群负载而异，本节无法给出可溯源的统一数字），**短任务** 不适合——必须用 Celery Executor。

**4. 追问预测**

- **「Airflow vs DolphinScheduler 选哪个？」** 答：**复杂 DAG + Python 动态**选 Airflow；**多租户 + 可视化**选 DolphinScheduler。**中国企业** 多 DolphinScheduler（阿里/字节/美团/招行）；**海外企业** 多 Airflow（LinkedIn/Uber/Netflix）。
- **「云原生调度怎么选？」** 答：**K8s 原生 + 容器化** 选 Argo Workflows；**K8s + 数据集成** 选 Airflow + K8s Executor；**多租户** 选 DolphinScheduler + K8s。
- **「DAG 怎么管理版本？」** 答：Airflow 通过 Git + CI/CD；DolphinScheduler 通过资源中心 + Git 同步；Azkaban 通过 ZIP 包 + 版本号。**关键：DAG 必须可追溯 + 可回滚**。
- **「调度系统故障了怎么办？」** 答：① 主备调度（Master/Worker 主备）；② Task 级重试（retry + backoff）；③ 告警 + oncall（PagerDuty / 钉钉 / 飞书）；④ SLA 监控（任务延迟告警）。

**5. 参考资料**

- Apache Airflow 官方文档《Architecture》——DAG + Executor + Scheduler。
- Apache DolphinScheduler 官方文档《Architecture》——Master/Worker + Zookeeper。
- LinkedIn Azkaban 官方文档——Web 调度 + Executor。
- Argo Workflows 官方文档《Kubernetes Native Workflows》——K8s 原生 DAG。
- **LinkedIn Airflow 调度平台** —— LinkedIn 用 Airflow 调度大规模数据流水线，10+ 集群分业务域。
- **Netflix Maestro** —— Netflix 自研的统一工作流编排层（多后端执行），承载其大规模数据调度，支撑 EB 级数据。
- **Uber Airflow 离线调度** —— Uber 用 Airflow 做离线调度，K8s Executor 弹性伸缩。
- **阿里 / 字节 / 美团 / 招行 DolphinScheduler** —— 中国企业大量使用 DolphinScheduler 做多租户调度。
- **永辉超市 / 美的集团 DolphinScheduler** —— 多团队多租户调度场景，资源隔离 + 权限管控。
- **LinkedIn Azkaban Hadoop 生态** —— LinkedIn 内部大规模跑 Azkaban，存量 Hadoop 集群调度。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §13.5.1 在 AI 时代数据架构决策中，ADR（架构决策记录）如何从"文档化"走向"工程化 + 智能化"？请设计一套可落地的 ADR 工程化框架，并说明 ADR 与决策矩阵、知识库、AI 辅助选型的协同关系。

**1. 考察点**

- 是否理解 ADR（Architecture Decision Record）的**核心要素**：状态、背景、决策、备选方案、后果、演进路径。
- 是否能从"**文档化 → 工程化 → 智能化**"三阶段演进视角讲清 ADR 的演进。
- 是否能设计一套可落地的 **ADR 工具链**（Git + Markdown + CI + AI 助手）。
- 加分项：能讲清"**AI 辅助 ADR**"——LLM 读取业务需求 + 历史 ADR → 推荐架构；**Snowflake Cortex / Databricks Genie** 是工业级参考。

**2. 参考答案框架**

**第一层：ADR 核心要素。**

ADR 是 Michael Nygard 在 2011 年提出的架构决策文档化方法论，核心要素包括：

- **状态（Status）**：Proposed / Accepted / Deprecated / Superseded。
- **背景（Context）**：业务诉求 + 技术约束 + 团队能力 + 时间窗口。
- **决策（Decision）**：选了什么方案 + 关键参数 + 责任人。
- **备选方案（Alternatives）**：至少 2 个备选方案 + 优缺点对比。
- **后果（Consequences）**：优点、缺点、风险、依赖。
- **演进路径（Evolution）**：未来何时 review、何时可能演进。

**第二层：ADR 三阶段演进。**

- **阶段 1：文档化（2011–2020）**：
  - ADR 通过 Git + Markdown 管理，人工编写。
  - **典型实践**：Michael Nygard ADR 模板、AWS ADR 模板、Microsoft Azure ADR 模板。
  - **痛点**：编写成本高（架构师不愿写）、检索难、复用低。
- **阶段 2：工程化（2020–2024）**：
  - ADR 与 CI/CD 集成（CI 检查 ADR 是否更新）、ADR 与决策矩阵联动（评分模型量化决策）、ADR 与知识库集成（Confluence / Notion）。
  - **典型实践**：LinkedIn ADR + Git + CI、Databricks ADR + Decision Matrix、字节跳动 ADR + 内部 Wiki。
  - **工具链**：ADR 模板（Markdown / MADR）+ CI 校验 + Decision Matrix（Python + Pandas）+ 知识库索引。
- **阶段 3：智能化（2024–至今）**：
  - **AI 辅助 ADR**——LLM 读取业务需求 + 历史 ADR → 推荐架构。
  - **AI 辅助检索**——RAG 检索历史 ADR，新决策自动找到相似案例。
  - **AI 辅助 review**——LLM 自动 review ADR 质量（背景完整、备选方案覆盖、后果量化）。
  - **典型实践**：Databricks Genie（AI 辅助架构决策）、Snowflake Cortex（AI 辅助数据决策）、自研 LLM ADR 助手。

**第三层：ADR 工程化工具链设计。**

```yaml
# ADR 工具链
tools:
  adr_template:
    type: "MADR (Markdown Any Decision Records)"
    path: "docs/adr/"
    format: "NNNN-short-title.md"
    
  git:
    branch_strategy: "feat/adr-NNNN-title"
    pr_required: true
    reviewer: "架构组"
    
  ci:
    adr_lint: "校验 ADR 必填字段"
    decision_matrix_check: "校验决策矩阵是否更新"
    knowledge_base_sync: "自动同步 ADR 到 Confluence / Notion"
    
  decision_matrix:
    type: "Python + Pandas"
    path: "tools/decision_matrix.py"
    output: "推荐架构 + 评分"
    
  ai_assistant:
    type: "LLM + RAG"
    base_model: "Claude / GPT-4 / Qwen / DeepSeek"
    knowledge_base: "历史 ADR + 决策矩阵 + 案例库"
    output: "架构推荐 + ADR 草稿"
```

**第四层：ADR 与决策矩阵、知识库、AI 辅助选型的协同。**

- **ADR + 决策矩阵**：ADR 中的"备选方案"必须由决策矩阵量化评分，每个方案有清晰分数。
- **ADR + 知识库**：历史 ADR 自动同步到知识库，新 ADR 自动检索相似案例。
- **ADR + AI 辅助**：LLM 读取业务需求 → RAG 检索历史 ADR → 生成候选架构 + ADR 草稿 → 架构师 review → 决策。
- **闭环**：ADR 完成后自动回流到决策矩阵（更新权重 + 评分），AI 模型基于反馈持续学习。

**第五层：典型工业实践。**

- **Databricks Genie**：AI 辅助架构决策 + 自动生成 ADR 草稿，**Databricks Data Intelligence Platform** 的核心组件。
- **Snowflake Cortex**：LLM + 向量 + 数据栈融合，**AI 辅助数据决策**，自动推荐架构 + 评估风险。
- **LinkedIn ADR 工程化**：ADR + Git + CI + Decision Matrix，**LinkedIn 内部** 强制要求重大架构决策必须 ADR + 决策矩阵。
- **字节跳动 ADR + AI 助手**：字节跳动内部 ADR 平台与 AI 助手集成，**架构师通过对话生成 ADR 草稿**。
- **微众银行 ADR + 监管**：金融场景 ADR 必须包含"监管影响" + "审计要求" + "回滚方案"——监管级 ADR。
- **招行 ADR + 风险评估**：招行 ADR 必须包含"风险矩阵" + "应急预案" + "灰度方案"——金融级 ADR。

**3. 常见陷阱**

- **ADR 变成"文档摆设"**。ADR 写完就归档，没人看没人用——必须**强制 review + 强制归档 + 强制检索**。
- **决策矩阵与 ADR 脱节**。决策矩阵是定量评估，ADR 是定性记录，两者必须绑定——**决策矩阵的评分必须出现在 ADR 中**。
- **AI 辅助决策被滥用**。LLM 不能替代架构师决策，只能**辅助决策**——AI 给推荐，架构师 review，**最终决策权仍在架构师**。
- **ADR 不被安全文化**。**金融 / 医疗 / 政企** 场景 ADR 必须包含**安全 + 合规 + 审计**——监管级 ADR 不能省。
- **ADR 与架构演进脱节**。ADR 必须有"演进路径" + "Review 计划"——**架构 Review 频率** 必须写进 ADR。

**4. 追问预测**

- **「ADR 与决策矩阵的关系？」** 答：决策矩阵是**定量评估**（评分模型），ADR 是**定性记录**（决策文档）。两者绑定：决策矩阵评分 → ADR 备选方案 → ADR 决策。
- **「AI 辅助选型的边界？」** 答：AI 只能辅助**信息收集 + 候选方案生成 + 风险评估**；**最终决策必须架构师做**——AI 不能替代架构师的责任。
- **「金融场景 ADR 的特殊性？」** 答：金融场景 ADR 必须包含**监管影响 + 审计要求 + 回滚方案 + 应急预案 + 灰度方案**——监管级 ADR 在审批与留痕要求上远严于互联网团队的做法（【经验】档：严格程度随监管口径而异，本节无法给出可溯源的量化倍数）。
- **「ADR 模板怎么选？」** 答：**MADR（Markdown Any Decision Records）** 是工业级标准模板，包含完整 6 要素；**AWS ADR 模板** + **Azure ADR 模板** 是云厂商参考；**自研模板** 需基于 MADR 演进。

**5. 参考资料**

- Michael Nygard《Documenting Architecture Decisions》——ADR 原始定义与方法论。
- MADR（Markdown Any Decision Records）官方文档——工业级 ADR 模板。
- Databricks Engineering Blog《Data Intelligence Platform》——AI 辅助架构决策。
- Snowflake Cortex 官方文档——LLM + 向量 + 数据栈融合。
- **Databricks Genie（AI 辅助架构决策）** —— Databricks Data Intelligence Platform 的核心组件，AI 辅助 ADR 生成。
- **Snowflake Cortex（AI 辅助数据决策）** —— LLM + 向量 + 数据栈融合，自动推荐架构 + 评估风险。
- **LinkedIn ADR 工程化实践** —— LinkedIn 内部强制要求重大架构决策必须 ADR + 决策矩阵。
- **字节跳动 ADR + AI 助手** —— 字节跳动内部 ADR 平台与 AI 助手集成，对话生成 ADR 草稿。
- **微众银行监管级 ADR** —— 金融场景 ADR 必须包含监管影响 + 审计要求 + 回滚方案。
- **招行金融级 ADR** —— 招行 ADR 包含风险矩阵 + 应急预案 + 灰度方案，金融级 ADR 标杆。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **架构演进与未来趋势**：数仓 → 数据湖 → 湖仓 → AI 原生，Lambda → Kappa → 流批一体。
- **湖仓与存储架构**：Iceberg / Hudi / Delta / Paimon 表格式选型，Lakehouse + 开放表格式 + 多引擎。
- **资源调度与多租户隔离**：Airflow / DolphinScheduler / Azkaban 多租户与云原生调度。
- **OLAP 与查询性能**：Doris / StarRocks / ClickHouse / Snowflake / BigQuery 选型与场景适配。
- **计算引擎分工**：Spark（批 + AI）/ Flink（流 + CDC）/ Trino（Ad-hoc + 联邦）。
- **决策工程化**：ADR + 决策矩阵 + AI 辅助选型的协同闭环。

## 4 本章小结

> 本面试真题集收录 7 道题，覆盖 7 个原 PDF 主题、4 个核心架构决策维度。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#81-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#82-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
