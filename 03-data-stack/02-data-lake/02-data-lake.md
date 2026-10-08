# 数据湖（Data Lake）

> **一句话定位**：以原始形态存储多源异构数据的"蓄水池"，是湖仓一体与 AI 时代数据资产的物理底座。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**02 数据湖**）。覆盖 **R4 数据全栈协同** 能力领域中「数据湖的存储架构、文件格式、湖仓演进、AI 时代角色」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 数据湖是什么？跟数据仓库的本质区别？ | §1.1 |
| 数据湖为什么可能变成"数据沼泽"？ | §3.3 |
| HDFS vs 对象存储（S3/OSS/COS）怎么选？ | §4.3 |
| 开放表格式（Delta / Iceberg / Hudi / Paimon）是什么？ | §2.1 |
| 数据湖如何与 AI / 向量化结合？ | §5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**（James Dixon, 2010, Pentaho CTO）：数据湖（Data Lake）是一种**以原始形态存储海量多源异构数据的存储系统**，包括结构化、半结构化、非结构化数据。与数据仓库的"Schema-on-Write"不同，数据湖采用"**Schema-on-Read**"——数据写入时不校验 schema，读取时才解析。

**工程定义**：在数据架构师手里，数据湖是**一份以对象存储 / HDFS 为底座、以开放格式（Parquet / ORC / Avro / JSON）为载体、配合表格式（Iceberg / Hudi / Paimon）实现 ACID 的企业级数据存储层**。它的核心特征是：

- **原始形态存储**：不预先建模、不做清洗，保留所有原始信息。
- **多源异构**：日志、JSON、Parquet、图片、视频、Embedding 都可以存。
- **Schema-on-Read**：写入快、读取时按需解析。
- **成本低**：对象存储（$0.023/GB/月，S3 Standard-IA）比传统数仓便宜 10-100 倍。
- **可演化为数仓**：通过表格式 + 查询引擎实现 Lakehouse。

**与数据仓库的本质区别**：

| 维度 | 数据湖 | 数据仓库 |
| --- | --- | --- |
| 数据形态 | 原始数据 | 清洗建模后数据 |
| Schema 策略 | Schema-on-Read | Schema-on-Write |
| 数据类型 | 多源异构 | 结构化为主 |
| 存储成本 | 低（对象存储 / 压缩） | 中高（专用存储） |
| 查询性能 | 较低（需扫描 / 物化视图） | 高（列存 + 索引 + CBO） |
| 用户群体 | 数据科学家、分析师 | 业务 BI、决策层 |
| 适用阶段 | 探索性分析、AI 训练 | 决策性分析、报表 |
| 治理难度 | 高（数据沼泽风险） | 低（结构清晰） |

### 1.2 为什么需要

**业务驱动力**：

- **多源异构数据爆炸**：业务系统日志（JSON）、关系数据库（Binlog）、IoT 设备（时序）、社交媒体（文本）、图像视频（Binary）——传统数仓无法容纳。
- **AI 训练需要原始数据**：算法工程师需要"未加工"的数据做特征工程，数据湖提供。
- **成本压力**：PB 级数据用专用数仓存储成本 $500K/月，用对象存储 $30K/月。
- **探索性分析**：业务变化快，未必知道未来需要哪些维度，原始数据保留灵活性。
- **合规与可追溯**：原始数据保留，满足"GDPR 删除权""审计回溯"等要求。

**痛点（没有数据湖的代价）**：

1. **数据孤岛**：每种数据格式都需要专门存储（日志系统、图数据库、文档库）。
2. **历史数据丢失**：原始日志清洗后丢弃，无法回溯。
3. **AI 训练样本不足**：原始数据被清洗掉，算法无法用。
4. **成本失控**：每个业务系统独立存储，资源浪费。
5. **探索性分析无法做**：业务想看新维度时，找不到原始数据。

**AI 时代的新诉求**：

- **Embedding 存储**：LLM 的向量数据需要规模化、低成本存储。
- **非结构化数据资产化**：文档、图片、视频成为 AI 的核心输入。
- **多模态数据湖**：结构化 + 非结构化 + 向量统一存储。
- **可追溯的训练样本**：保留原始数据用于模型复现、合规审计。

### 1.3 在 AI 时代数据架构中的位置

```
[IoT / 日志 / 业务库 / 第三方 API]
        ↓
[原始采集层（Kafka / CDC / Filebeat）]
        ↓
[数据湖（HDFS / S3 / OSS）]
        ├── 原始区（Raw / Bronze）—— Schema-on-Read
        ├── 加工区（Silver）—— 轻度清洗
        └── 消费区（Gold）—— 面向 AI / BI / Agent
        ↓
[AI / BI / Agent]
```

**数据湖是数据栈的"原材料仓"**：上游对接原始数据流，下游对接 AI / BI / Agent。它让"原始数据"长期可保留、可加工、可重放。

**关键关系**：

- **vs 数据仓库**：数据湖 = 原材料；数据仓库 = 加工后的成品。
- **vs Lakehouse**：Lakehouse = 数据湖 + 数据仓库能力（详见 §3 章）。
- **vs 数据沼泽**：数据沼泽 = 没有治理的数据湖 = 数据湖的反面。

### 1.4 演进历程

**第一阶段：Hadoop 数据湖（2010-2018）**

- 2010：Hadoop 1.0 成熟，HDFS + MapReduce 成为数据湖雏形。
- 2013：Hive 出现，SQL-on-Hadoop 让分析师可用。
- 2015：Spark 取代 MapReduce 成为主流计算引擎。
- 2016：AWS S3 + Athena 让"无 Hadoop"的数据湖成为可能。
- **问题**：缺乏 ACID、元数据管理弱、易变成数据沼泽。

**第二阶段：云原生数据湖（2016-2020）**

- 2017：Delta Lake 0.2 发布（Databricks），Lakehouse 雏形。
- 2018：Apache Iceberg 0.1，Hudi 0.5 加入竞争。
- 2019：Netflix / Apple / LinkedIn 大规模 Iceberg 落地。
- 2020：对象存储成本下降 + 开放表格式成熟，云数据湖爆发。

**第三阶段：Lakehouse 主流化（2020-2024）**

- 2020：Databricks 提出 Lakehouse 概念，Delta Lake 1.0。
- 2021：Iceberg 1.0、Hudi 0.10、表格式"三国杀"开始。
- 2022：Apache Paimon（前 Flink Table Store）进入战场。
- 2023：Snowflake 推出 Iceberg Tables，三大云厂商全部支持 Iceberg。
- 2024：Paimon 1.0 毕业，Lakehouse 成为事实标准。

**第四阶段：AI 原生数据湖（2024-至今）**

- 2024：向量数据湖（Vector Data Lake）兴起——Iceberg / Delta 支持向量类型。
- 2024-2025：Lakehouse + AI Functions 集成（Databricks AI Functions、Snowflake Cortex）。
- 2025：多模态数据湖（结构化 + 文本 + 图像 + 向量统一存储）。
- 2025：AutoMQ、Confluent Warpstream 等"无 Kafka"消息层简化数据湖入湖。

**一句话总结**：**数据湖从"Hadoop 文件系统"→"云原生对象存储"→"Lakehouse"→"AI 原生多模态"四阶段演进，今天已是企业数据栈的核心底座。**

---

## 2. 核心原理

### 2.1 关键概念定义

**HDFS（Hadoop Distributed File System）**：Hadoop 生态的分布式文件系统。核心设计：数据块（默认 128MB）、副本（默认 3 份）、NameNode（元数据）+ DataNode（数据）。

**对象存储（Object Storage）**：扁平化、无目录层级、通过 HTTP RESTful API 访问的存储。代表：AWS S3、阿里云 OSS、腾讯云 COS、MinIO（私有化）。优势：无限扩展、11 个 9 持久性、成本极低。

**列式存储格式（Columnar File Format）**：

- **Parquet**：2013 年 Twitter + Cloudera 开源，Dremel 论文工程化，支持嵌套 schema、列存、谓词下推、字典编码、行程编码。是数据湖的事实标准格式。
- **ORC**（Optimized Row Columnar）：Hive 生态原生，比 Parquet 压缩比略高。
- **Avro**：行存格式，适合 schema 演进、序列化和 Kafka 消息。

**开放表格式（Open Table Format）**：在文件格式之上的"表语义层"，提供 ACID、Schema Evolution、Time Travel、Partition Evolution。详见 §3 章。

**Zone / Layer（数据湖分层）**：

- **Raw Zone / Bronze（原始层）**：原始数据，几乎不处理。
- **Cleansed Zone / Silver（清洗层）**：清洗、整合后的数据。
- **Curated Zone / Gold（精化层）**：面向应用的精化数据（聚合、宽表、立方体）。

**Schema-on-Read**：写入时不校验 schema，读取时按需解析。优点：写入快、灵活性高。缺点：易出错、需要治理。

**Schema-on-Write**：写入时强制 schema（如传统数仓）。优点：数据一致性高。缺点：灵活性差、改 schema 麻烦。

**Medallion Architecture（铜银金架构）**：Databricks 提出的数据湖分层范式（Bronze / Silver / Gold）。

**Data Swamp（数据沼泽）**：缺乏治理的数据湖——数据无主、口径混乱、不可信、无法使用。**数据湖最大的风险**。

### 2.2 数学 / 形式化基础

**数据湖存储的理论基础**：

- **CAP 定理**：分布式系统中一致性（C）、可用性（A）、分区容错（P）三者不可兼得。
- **对象存储的一致性模型**：强一致性（read-after-write）。
- **最终一致性 vs 强一致性**：数据湖写入和读取的一致性保障。

**数据压缩的数学原理**：

- **熵（Entropy）**：数据的信息量上限。
- **列存的压缩比**：同列数据同质性强，字典编码 + 行程编码可达 5-10x 压缩。
- **存储成本**：压缩前 Parquet $30/TB/月，压缩后 $3-6/TB/月。

**列存的查询加速原理**：

- 假设查询 `SELECT user_id FROM order WHERE date = '2025-01-01'`
- 行存：需要读所有列的所有行 → 100 GB 扫描
- 列存：只读 date 列 + user_id 列 → 1 GB 扫描
- 加速比：100x（典型）

**数据局部性（Data Locality）的数学原理**：

- **计算成本** = 网络传输成本 + CPU 计算成本
- **本地计算**：消除网络成本，但要求数据提前分布
- **非本地计算**：网络瓶颈，但灵活性高

### 2.3 关键算法 / 方法

**1. 开放表格式（详见 §3 章）**

- Delta Lake：基于事务日志（_delta_log）的乐观并发控制。
- Iceberg：基于 manifest list + manifest file 的快照隔离。
- Hudi：基于 Timeline（commit/clean/delta/rollback）的并发控制。
- Paimon：基于 LSM Tree 的流式表格式。

**2. 增量数据处理（CDC）**

- 基于 Binlog 的 CDC（Debezium / Flink CDC / Canal）。
- 基于 Log 的 CDC（Kafka → 数据湖）。
- 基于 Trigger 的 CDC（数据库触发器）。

**3. 数据压缩与编码**

- **字典编码（Dictionary Encoding）**：把重复值映射到小整数。
- **行程编码（Run-Length Encoding）**：连续相同值压缩为（值，长度）。
- **位图编码（Bitmap Encoding）**：用于低基数列的快速过滤。
- **ZSTD / Snappy 压缩**：通用压缩算法。

**4. 分区策略（Partitioning）**

- **时间分区**：`dt=2025-01-01`，适合时序数据。
- **哈希分区**：按 user_id 哈希，适合用户行为数据。
- **复合分区**：时间 + 类别，灵活但管理复杂。

**5. 小文件合并（Compaction）**

- 数据湖大量小文件导致 NameNode / 元数据压力大。
- 合并策略：Bin-packing、Sort-merge、时间窗口。
- 工具：Iceberg `rewrite_data_files`、Hudi `compaction`、Delta `OPTIMIZE`。

**6. 查询优化（详见 §13 章）**

- **谓词下推（Predicate Pushdown）**：WHERE 条件下推到文件层 / 列层。
- **列剪裁（Column Pruning）**：只读需要的列。
- **统计信息收集**：NDV（不同值数）、Min/Max、Histogram。
- **向量化执行**：Parquet + Arrow + SIMD。

### 2.4 与相邻概念的关系

**数据湖 vs 数据沼泽**：

- 数据湖 = 有治理的多源数据存储。
- 数据沼泽 = 无治理的数据湖（数据混乱、不可信、无法使用）。
- **数据湖必须治理**，否则必然退化为数据沼泽。

**数据湖 vs Lakehouse**：

- 数据湖 = 原始 + 无 ACID。
- Lakehouse = 数据湖 + ACID + Schema 治理 + 性能优化。
- **Lakehouse 是数据湖的"进化形态"**。

**数据湖 vs 数据仓库**：

- 数据湖 = 原材料、灵活、低成本。
- 数据仓库 = 成品、稳定、高性能。
- **现代趋势**：湖仓一体融合两者。

**HDFS vs 对象存储**：

| 维度 | HDFS | 对象存储（S3/OSS/COS） |
| --- | --- | --- |
| 扩展性 | 千节点上限 | 无限扩展 |
| 成本 | 高（需要专有硬件） | 低（按量计费） |
| 性能 | 高（本地访问） | 中（HTTP / 网络） |
| 一致性 | 强 | 强（read-after-write） |
| 适用 | 本地数据中心 | 云端 / 混合云 |
| 运维复杂度 | 高 | 低 |

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：传统 Hadoop 数据湖**

- HDFS + Hive + Spark SQL + MR。
- 优点：成熟稳定、开源生态完整。
- 缺点：缺乏 ACID、改 schema 困难、运维复杂。
- 适用：传统企业、本地数据中心。

**模式 2：云原生数据湖**

- S3/OSS/COS + Spark/Flink + Iceberg/Hudi/Delta + Trino/StarRocks。
- 优点：弹性、成本低、易扩展。
- 缺点：网络延迟、数据安全。
- 适用：云上企业、SaaS 公司。

**模式 3：Lakehouse（湖仓一体）**

- 对象存储 + 开放表格式（Iceberg/Hudi/Paimon）+ 计算引擎（Spark/Flink/Trino）+ OLAP（StarRocks/Doris）。
- 优点：兼具湖的灵活 + 仓的性能和治理。
- 缺点：复杂度较高、需要专业团队。
- 适用：大多数现代企业。

**模式 4：Medallion（铜银金架构）**

- Bronze（原始）+ Silver（清洗）+ Gold（应用）。
- 优点：分层清晰、易治理。
- 缺点：可能分层过度。
- 适用：所有数据湖项目。

**模式 5：多模态数据湖**

- 结构化 + 非结构化 + 向量统一存储。
- 工具：Iceberg / Delta + Milvus / Pinecone / LanceDB。
- 优点：AI 时代标准。
- 缺点：复杂度高。

**模式 6：实时数据湖（Streaming Lake）**

- Kafka/Pulsar + Flink + Paimon/Iceberg。
- 优点：实时入湖、查询实时。
- 缺点：链路复杂。

### 3.2 适用场景决策表

| 业务场景 | 推荐模式 | 典型技术栈 |
| --- | --- | --- |
| 传统企业本地数据中心 | 传统 Hadoop 数据湖 | HDFS + Hive + Spark |
| 互联网云上企业 | 云原生数据湖 / Lakehouse | S3 + Iceberg + Spark/Flink + Trino |
| 大型集团统一数据平台 | Lakehouse | OSS + Paimon + Flink + StarRocks |
| AI / 机器学习 | 多模态数据湖 | Iceberg + LanceDB + Milvus |
| 实时数据 + 历史分析 | 实时数据湖 | Kafka + Flink + Paimon |
| 跨国 / 跨云 | 联邦数据湖 | 多云 Iceberg + 统一 Catalog |
| 个人 / 小团队 | 轻量级数据湖 | MinIO + DuckDB |

### 3.3 反模式与陷阱

**反模式 1：数据沼泽（Data Swamp）**

- 缺乏治理，数据写入无人负责、口径混乱、无人信任。
- **正确**：建立治理体系——元数据、血缘、质量、生命周期。

**反模式 2：直接把数据湖当数据仓库用**

- 数据湖上跑全量分析查询，性能差、成本高。
- **正确**：湖仓分层——湖存原始，仓存加工。

**反模式 3：忽视 Schema 演进**

- 上游字段改了，下游消费全部失败。
- **正确**：使用 Iceberg / Hudi 等支持 Schema Evolution 的表格式。

**反模式 4：小文件爆炸**

- 每个小任务生成几千个小文件，NameNode / 元数据压力大。
- **正确**：定期 Compaction（合并）+ 控制任务粒度。

**反模式 5：分区过度膨胀**

- 一张表 10000 个分区，查询 planner 卡死。
- **正确**：合理分区（按时间，保留 1-3 年）+ 分区过滤。

**反模式 6：忽视数据安全**

- 数据湖直接暴露给所有用户，PII 数据泄露。
- **正确**：行级 / 列级权限控制（Apache Ranger / AWS Lake Formation）。

**反模式 7：缺乏生命周期管理**

- 冷数据长期占用昂贵存储。
- **正确**：自动分层（Hot → Warm → Cold → Archive）。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型存储底座（2-4 周）**

- 云端：S3 / OSS / COS。
- 本地：MinIO / HDFS / Ceph。
- 混合云：Multi-Cloud Gateway。

**Step 2：选定表格式（1-2 周）**

- 通用场景：Iceberg（最流行、社区最活跃）。
- 流批一体：Paimon（Flink 生态原生）。
- Spark 深度集成：Delta Lake。
- 更新密集：Hudi。

**Step 3：建立分层（2-4 周）**

- Bronze（原始） → Silver（清洗） → Gold（应用）。
- 每层有清晰的 schema 和责任。

**Step 4：搭建入湖链路（4-8 周）**

- 离线入湖：DataX / Sqoop / Spark。
- 实时入湖：Flink CDC / Kafka Connect / Vector。
- 文件入湖：OSS 事件 / SQS / 定时同步。

**Step 5：建设查询层（2-4 周）**

- 批量查询：Trino / Spark SQL。
- 即席查询：StarRocks / Doris / ClickHouse。
- AI 检索：LanceDB / Milvus / Pinecone。

**Step 6：建立治理（持续）**

- 元数据：Apache Atlas / DataHub / Unity Catalog。
- 血缘：OpenLineage / DataHub。
- 质量：Great Expectations / Soda。
- 权限：Apache Ranger / AWS Lake Formation。

### 4.2 关键技术点

**1. Iceberg 表格式（核心）**

```sql
-- 创建 Iceberg 表
CREATE TABLE iceberg.orders (
  order_id    BIGINT,
  user_id     BIGINT,
  amount      DECIMAL(18,2),
  order_time  TIMESTAMP
) PARTITIONED BY (days(order_time))
STORED AS ICEBERG;

-- 写入（CTAS）
INSERT INTO iceberg.orders
SELECT * FROM hive.orders WHERE dt = '2025-01-01';

-- Time Travel
SELECT * FROM iceberg.orders
FOR SYSTEM_TIME AS OF '2025-01-15 10:00:00';

-- Schema Evolution（添加列）
ALTER TABLE iceberg.orders
ADD COLUMN coupon_amount DECIMAL(18,2);
```

**2. Iceberg 隐藏分区（Hidden Partitioning）**

```sql
-- 用户不需要知道分区字段
SELECT * FROM iceberg.orders
WHERE order_time BETWEEN '2025-01-01' AND '2025-01-31';
-- Iceberg 自动按 days(order_time) 分区剪裁
```

**3. CDC 入湖（Flink + Iceberg）**

```java
// Flink CDC → Iceberg
StreamExecutionEnvironment env = ...;

TableResult result = env.executeSql("""
    CREATE TABLE orders_cdc (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      order_time TIMESTAMP(3)
    ) WITH (
      'connector' = 'mysql-cdc',
      'hostname' = 'mysql-host',
      'port' = '3306',
      'username' = 'cdc',
      'password' = '***',
      'database-name' = 'shop',
      'table-name' = 'orders'
    )
""");

env.executeSql("""
    CREATE TABLE iceberg_orders (...)
    WITH (
      'connector' = 'iceberg',
      'catalog-name' = 'hive_prod',
      'uri' = 'thrift://hive-metastore:9083',
      'warehouse' = 's3://lake/warehouse'
    )
""");

env.executeSql("INSERT INTO iceberg_orders SELECT * FROM orders_cdc");
```

**4. 数据压缩与生命周期**

```sql
-- Iceberg 自动合并小文件
CALL iceberg.system.rewrite_data_files(
  table => 'iceberg.orders',
  strategy => 'sort',
  sort_order => 'zorder[order_time, user_id]',
  options => map('min-input-files', '10', 'max-concurrent-file-group-rewrites', '5')
);

-- 清理过期快照
CALL iceberg.system.expire_snapshots(
  table => 'iceberg.orders',
  older_than => TIMESTAMP '2025-01-01 00:00:00',
  retain_last => 10
);
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**存储底座**：

| 工具 | 特点 | 适用 |
| --- | --- | --- |
| HDFS | 传统、成熟 | 本地数据中心 |
| AWS S3 | 云对象存储标杆 | AWS 云 |
| 阿里云 OSS | 阿里云原生 | 阿里云 |
| 腾讯云 COS | 腾讯云原生 | 腾讯云 |
| MinIO | 开源对象存储 | 私有云 |
| Ceph | 统一存储（HDFS/S3/Block） | 混合云 |
| Ozone | HDFS 继任者 | Hadoop 生态 |

**开放表格式（2024-2025）**：

| 工具 | 母公司 | 特点 | 最新版本 |
| --- | --- | --- | --- |
| Apache Iceberg | Apache | 社区最大、Trino/Spark/Flink 全支持 | 1.6.x（2024） |
| Apache Hudi | Apache | 更新密集场景强、CDC 友好 | 0.15.x（2024） |
| Delta Lake | Databricks | Spark 生态最深、Unity Catalog | 3.2.x（2024） |
| Apache Paimon | Apache | Flink 生态原生、流批一体 | 1.1.x（2024 毕业） |

**查询引擎**（详见 §13）：

| 工具 | 特点 |
| --- | --- |
| Trino | 联邦查询、Iceberg/Hudi/Delta 全支持 |
| Spark SQL | 大数据主流、生态最全 |
| Flink | 流批一体、流式湖仓 |
| DuckDB | 内嵌 OLAP、AI 时代新宠 |
| StarRocks | 实时 OLAP、Iceberg 外表查询 |

**AI 工具（2024-2025 新趋势）**：

| 工具 | 特点 |
| --- | --- |
| LanceDB | 列式多模态数据湖、专为 AI 设计 |
| Milvus | 向量数据库、可与 Iceberg 集成 |
| Pinecone | 托管向量数据库 |
| Qdrant | 开源向量数据库 |
| ChromaDB | 轻量级向量数据库 |

### 4.4 代码 / 示例

**示例 1：Apache Iceberg + Spark 完整数据湖**

```python
# PySpark + Iceberg
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("IcebergLake") \
    .config("spark.sql.catalog.prod", "org.apache.iceberg.spark.SparkCatalog") \
    .config("spark.sql.catalog.prod.type", "hive") \
    .config("spark.sql.catalog.prod.uri", "thrift://metastore:9083") \
    .config("spark.sql.catalog.prod.warehouse", "s3://lake/warehouse") \
    .getOrCreate()

# 写入数据湖（Bronze）
df = spark.read.parquet("s3://raw/orders/dt=2025-01-01/")
df.writeTo("prod.bronze.orders").createOrReplace()

# 清洗（Silver）
silver_df = df.filter("amount > 0").dropDuplicates(["order_id"])
silver_df.writeTo("prod.silver.orders").createOrReplace()

# 聚合（Gold）
gold_df = silver_df.groupBy("user_id") \
    .agg({"amount": "sum", "order_id": "count"})
gold_df.writeTo("prod.gold.user_orders").createOrReplace()

# Time Travel
historical = spark.read.option("snapshot-id", "1234567890") \
    .table("prod.silver.orders")
```

**示例 2：LanceDB 多模态数据湖（2024 新趋势）**

```python
import lancedb
import pyarrow as pa

# 连接到 LanceDB
db = lancedb.connect("s3://lake/lancedb")

# 创建多模态表（结构化 + 文本 + 向量 + 图像）
table = db.create_table("products", [
    {
        "id": 1,
        "name": "iPhone 15",
        "price": 999.0,
        "description": "Apple smartphone...",
        "description_embedding": [...],  # 文本向量
        "image_bytes": b"...",  # 图像二进制
        "image_embedding": [...],  # 图像向量
    }
], mode="overwrite")

# 混合检索：向量 + 过滤
results = table.search([0.1, 0.2, ...]) \
    .where("price < 1000") \
    .limit(10) \
    .to_pandas()
```

**示例 3：Flink + Paimon 流式数据湖（2024 新工具）**

```java
// Flink + Paimon 流式入湖
TableEnvironment tEnv = ...;

tEnv.executeSql("""
    CREATE TABLE kafka_source (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      ts TIMESTAMP(3)
    ) WITH (
      'connector' = 'kafka',
      'topic' = 'orders',
      'properties.bootstrap.servers' = 'kafka:9092',
      'format' = 'json'
    )
""");

tEnv.executeSql("""
    CREATE TABLE paimon_sink (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      ts TIMESTAMP(3)
    ) WITH (
      'connector' = 'paimon',
      'path' = 's3://lake/paimon/orders',
      'sink.bucket-num' = '8'
    )
""");

tEnv.executeSql("""
    INSERT INTO paimon_sink
    SELECT * FROM kafka_source
""");
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：向量原生数据湖**

- 传统数据湖以 Parquet 为主，向量数据散落。
- 2024 新趋势：LanceDB、Iceberg V3（支持向量类型）、Delta Vector。
- **价值**：结构化 + 非结构化 + 向量统一存储、统一检索。

**演进方向 2：AI 驱动的元数据管理**

- LLM 自动提取元数据（schema 描述、字段含义、值域）。
- 代表：Unity Catalog + Genie、Snowflake Cortex + Auto-Metadata。
- **价值**：降低元数据维护成本、提升数据可发现性。

**演进方向 3：AI 驱动的数据治理**

- LLM 自动识别敏感数据（PII）、自动分类、自动打标签。
- 代表：AWS Lake Formation + Macie、Snowflake Horizon Catalog。
- **价值**：合规自动化、降低人工成本。

**演进方向 4：自然语言入湖**

- 用户说"把订单数据入湖"，系统自动配置入湖链路。
- 代表：Databricks Assistant、Snowflake Cortex。

**演进方向 5：Agent 触达的数据湖**

- Agent 通过统一 API 直接访问数据湖（无需 SQL）。
- 代表：Databricks Genie、Snowflake Cortex Analyst、阿里云通义数智。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**RAG + 数据湖**：

- 数据湖存储原始文档 → 自动 Embedding → 向量索引 → RAG 检索。
- 工具：LanceDB、Pinecone + Iceberg 集成。
- **2024 趋势**：Lakehouse + 向量库融合（如 Databricks Vector Search）。

**GraphRAG + 数据湖**：

- 数据湖存储原始文本 → LLM 抽取实体关系 → 知识图谱 → GraphRAG。
- 工具：Neo4j + Iceberg / Hudi。
- **价值**：数据湖为 GraphRAG 提供高质量原始数据。

**多模态 RAG + 数据湖**：

- 文本 / 图像 / 表格 / 向量统一存储在数据湖。
- 检索时按模态分别 Embedding + 融合。
- 代表：LanceDB、Milvus + Iceberg。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **Apache Iceberg V3（2024）**：支持行级删除（Row-Level Deletes）、增量读取、向量类型。
- **Apache Paimon 论文（VLDB 2024）**：LSM Tree + 流批融合的表格式设计。
- **Delta Lake 3.0 论文（2024）**：Delta UniForm（一份数据支持三种查询引擎）。
- **LanceDB 论文（NeurIPS 2024）**：多模态列式数据格式，专为 AI 设计。

**工业进展**：

- **Databricks Lakehouse Platform（2024）**：Unity Catalog + AI Functions + Vector Search 一体化。
- **Snowflake Iceberg Tables（2024）**：三云全支持 Iceberg。
- **Apache Paimon 1.0 毕业（2024）**：Flink 生态流式表格式正式毕业。
- **LanceDB 1.0（2024）**：开源多模态列式数据库，专为 AI 设计。
- **腾讯云 / 阿里云 Lakehouse 解决方案（2024-2025）**：国内云厂商全面支持 Lakehouse。

### 5.4 未来 3-5 年趋势

**趋势 1：Lakehouse 成为事实标准**

- Iceberg / Paimon 主流化，Delta 跟随。
- 未来 5 年，新建数据平台默认就是 Lakehouse。

**趋势 2：AI 原生数据湖**

- 数据湖原生支持 Embedding、文本、图像、多模态。
- 向量检索 + 关系查询一体化。

**趋势 3：自治数据湖**

- 自动 Compaction、自动优化、自动治理。
- LLM 驱动的数据湖自管理。

**趋势 4：联邦数据湖**

- 跨云、跨国、跨厂商的数据湖联邦查询。
- 统一 Catalog + 统一查询（Trino Federation）。

**趋势 5：实时数据湖**

- 流批一体表格式（Paimon）+ 流计算（Flink）。
- 数据湖实时性达到秒级。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：Netflix 数据湖（Iceberg 大规模落地）**

- **数据规模**：PB 级，每天数万亿事件。
- **架构**：S3 + Iceberg + Spark/Flink + Trino + Pinot。
- **效果**：支撑 AB 测试、内容推荐、运营分析全场景。

**案例 2：Apple 数据湖（隐私优先）**

- **数据规模**：EB 级，全球用户数据。
- **架构**：自研存储 + Iceberg + 自研查询引擎。
- **亮点**：差分隐私 + 端侧计算 + 联邦学习。

**案例 3：LinkedIn 数据湖（Iceberg 深度集成）**

- **数据规模**：PB 级。
- **架构**：HDFS → S3 + Iceberg + Spark + Pinot。
- **效果**：替代传统 Hive，查询性能提升 3-10x。

**案例 4：字节跳动数据湖（Lakehouse 实践）**

- **数据规模**：PB 级。
- **架构**：OSS + Iceberg/Hudi + Spark/Flink + StarRocks/ClickHouse。
- **亮点**：实时入湖 + 实时 OLAP 融合。

### 6.2 踩坑与经验

**坑 1：数据沼泽**

- **现象**：数据写入后无人维护，口径混乱。
- **解决**：建立元数据治理（Atlas / DataHub）+ 数据 owner 制度 + 质量监控。

**坑 2：小文件爆炸**

- **现象**：千万级小文件，元数据压力。
- **解决**：定期 Compaction + 流式入湖用 Paimon（LSM 自动合并）。

**坑 3：表格式选错**

- **现象**：选 Delta Lake 但 Flink 写入兼容性差。
- **解决**：明确业务场景——Flink 流式选 Paimon，Spark 批量选 Delta，跨引擎选 Iceberg。

**坑 4：Schema 演进失败**

- **现象**：上游加字段，下游全部报错。
- **解决**：使用 Iceberg / Hudi 的 Schema Evolution，原生支持列增删改。

**坑 5：分区过度膨胀**

- **现象**：1 万个分区，查询慢。
- **解决**：合理分区 + Iceberg 隐藏分区（避免用户感知分区）。

**坑 6：成本失控**

- **现象**：存储成本飙升。
- **解决**：自动分层（Hot/Warm/Cold）+ 压缩 + 生命周期管理。

### 6.3 落地路径（0→1, 1→10, 10→100）

**阶段 1：0 → 1（启动期，0-6 个月）**

- 选定对象存储 + Iceberg + Spark。
- 建 Bronze / Silver / Gold 三层。
- 团队：2-3 数据工程师。

**阶段 2：1 → 10（扩展期，6-18 个月）**

- 引入 Flink 流式入湖。
- 引入 StarRocks / Doris 实时查询。
- 建立元数据 + 血缘 + 质量治理。
- 团队：5-10 数据工程师 + 1 架构师。

**阶段 3：10 → 100（规模化期，18-36 个月）**

- 多模态数据湖（结构化 + 非结构化 + 向量）。
- 跨云 / 跨国联邦数据湖。
- AI 原生治理 + 自动优化。
- 团队：20-50 数据工程师 + 治理团队。

### 6.4 ROI 评估

**评估维度**：

- **存储成本降低**：PB 级数据成本从 $500K/月（专用数仓）→ $30K/月（对象存储 + Iceberg）。
- **AI 训练效率**：原始数据保留，AI 训练样本准备时间减少 50%+。
- **业务上线速度**：新业务接入时间从 1 个月 → 1 周。
- **查询性能提升**：Iceberg + Trino 查询性能比 Hive 提升 3-10x。

**典型 ROI**：

- Netflix Iceberg：存储成本降低 60%，查询性能提升 5x。
- LinkedIn Iceberg：ETL 时间减少 70%。
- 字节 Lakehouse：实时性提升 10x，成本降低 40%。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | HDFS 数据湖 | 对象存储数据湖 | Lakehouse | 数据仓库 |
| --- | :---: | :---: | :---: | :---: |
| 扩展性 | 3 | 5 | 5 | 3 |
| 成本 | 2 | 5 | 5 | 2 |
| 多源异构支持 | 4 | 5 | 5 | 2 |
| ACID 保障 | 1 | 1 | 4 | 5 |
| 查询性能 | 2 | 3 | 4 | 5 |
| 治理成熟度 | 2 | 3 | 4 | 5 |
| AI 友好度 | 3 | 4 | 5 | 3 |

### 7.2 决策树

```
数据规模？
├── < TB
│   └── DuckDB / SQLite（无需数据湖）
├── TB - PB
│   ├── 云上 → 对象存储 + Iceberg + Spark/Flink + Trino
│   └── 本地 → MinIO + Iceberg + Spark/Flink
├── > PB
│   └── Lakehouse（OSS/S3 + Paimon/Iceberg + Flink + StarRocks）
└── EB 级
    └── 多云联邦数据湖 + 自研优化
```

### 7.3 组合使用

**组合 1：数据湖 + 数据仓库（湖仓一体）**

- 数据湖存原始，数据仓库存加工。
- 同一查询引擎跨湖仓查询。
- 适用：超大规模企业。

**组合 2：数据湖 + 向量库**

- 数据湖存结构化，向量库存 Embedding。
- 联合查询（Trino + Milvus Connector）。
- 适用：AI 应用。

**组合 3：数据湖 + 实时数仓**

- 数据湖存全量历史，实时数仓存近实时聚合。
- 流批融合架构。
- 适用：实时业务场景。

**组合 4：数据湖 + 知识图谱**

- 数据湖存原始数据，知识图谱存实体关系。
- GraphRAG 全链路。
- 适用：AI 智能问答。

---

## 8. 面试真题集

# data-lake 面试真题集

> **一句话定位**：Iceberg / Hudi / Paimon / Delta Lake 的设计取舍。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 2 个原 PDF 子章节、共 13 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §2.5 | 统⼀接⼊与湖仓⼀体架构规划 | 2.5.1 ~ 2.5.7（共 7） | 7 | 辅 |
| §16.1 | 存储⽅案与数据持久化 | 16.1.1 ~ 16.1.6（共 6） | 6 | 主 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §2 多源异构数据的实时与批量接⼊ > 本主题涵盖 1 个子节、7 道题。

#### 2.1.5 统⼀接⼊与湖仓⼀体架构规划

> 来源：原 PDF §2.5，收录 7 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §2.5.1 | ★★★☆☆ |
| §2.5.2 | ★★★☆☆ |
| §2.5.3 | ★★★☆☆ |
| §2.5.4 | ★★★☆☆ |
| §2.5.5 | ★★★★☆ |
| §2.5.6 | ★★★★☆ |
| §2.5.7 | ★★★★★ |

- **§2.5.1**：湖仓⼀体（Lakehouse）架构是近年来的⼀个重要趋势，请阐述其核⼼设计理念，
- **§2.5.2**：请阐述Lambda架构的基本组成和数据处理流程，并说明为什么它需要同时维护实
- **§2.5.3**：请简要解释数据湖与数据仓库的核⼼区别，并说明它们各⾃在⼤数据平台中的典型
- **§2.5.4**：请对⽐分析Kappa架构与Lambda架构的优缺点，并结合⼀个具体业务场景（如实
- **§2.5.5**：当需要将来⾃数百个不同业务系统的、格式各异（如数据库Binlog、⽇志⽂件、Io
- **§2.5.6**：在规划⼀个⽀持万节点规模的数据平台时，你会如何设计统⼀的数据接⼊层，以同
- **§2.5.7**：在超⼤规模数据平台中，数据⾎缘和数据治理⾄关重要。请描述你如何在⼀个融合

### 2.2 §16 Kubernetes上运⾏⼤数据组件的实践与思考 > 本主题涵盖 1 个子节、6 道题。

#### 2.2.1 存储⽅案与数据持久化

> 来源：原 PDF §16.1，收录 6 道题。

| 题号 | 难度 |
| --- | :---: |
| §16.1.1 | ★★★☆☆ |
| §16.1.2 | ★★★☆☆ |
| §16.1.3 | ★★★☆☆ |
| §16.1.4 | ★★★☆☆ |
| §16.1.5 | ★★★★☆ |
| §16.1.6 | ★★★★☆ |

- **§16.1.1**：假设你需要管理⼀个运⾏在 Kubernetes 上的多租户⼤数据平台，不同业务部⻔的
- **§16.1.2**：请解释 Kubernetes 中 Persistent Volume (PV) 和 Persistent Volume Claim (P
- **§16.1.3**：对于像 Apache Kafka 这样⾼吞吐、低延迟的⼤数据组件，在 Kubernetes 环境
- **§16.1.4**：当设计⼀个在 Kubernetes 上运⾏的⾼可⽤ HDFS 集群时，你会如何规划和配置
- **§16.1.5**：在⼤数据平台中，数据本地化（Data Locality）是提升计算性能的关键。请阐述
- **§16.1.6**：在 Kubernetes 上部署有状态的⼤数据组件（如 HDFS 的 DataNode）时，你会

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **架构演进与未来趋势**
- **湖仓与存储架构**

## 4 本章小结

> 本面试真题集收录 13 道题，覆盖 2 个原 PDF 主题、2 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
