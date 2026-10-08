# Lakehouse 湖仓一体

> **一句话定位**：融合数据湖的开放低成本与数据仓库的 ACID / Schema 治理，让一份数据同时支撑 BI / AI / 流批，是 2020-2025 数据栈的事实标准。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**03 Lakehouse**）。覆盖 **R4 数据全栈协同** 能力领域中「Lakehouse 架构、开放表格式、ACID 与 Time Travel、AI 时代演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| Lakehouse 到底是什么？跟数据湖 / 数仓的本质区别？ | §1.1 |
| 四大表格式（Delta / Iceberg / Hudi / Paimon）怎么选？ | §3.1、§7.1 |
| ACID / Schema Evolution / Time Travel 的原理？ | §2.1、§2.3 |
| 湖仓一体怎么落地？关键步骤是什么？ | §4.1 |
| Iceberg V3 / Paimon 1.0 有哪些 2024-2025 新特性？ | §5.3 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**（Databricks, 2020）：Lakehouse 是一种**结合数据湖的低成本 / 开放存储与数据仓库的 ACID 事务 / Schema 治理** 的新型数据架构。它通过**开放表格式（Open Table Format）** 在数据湖之上提供类数仓的强一致性、Schema 演进、时间旅行等能力。

**工程定义**：在数据架构师手里，Lakehouse 是**一份以对象存储为底座、以开放表格式（Iceberg / Hudi / Delta / Paimon）为语义层、可同时服务 BI 查询与 AI 训练的统一数据资产**。它的核心特征：

- **一份数据，多种引擎**：同一份 Iceberg 表，Spark / Flink / Trino / StarRocks 都可读写。
- **ACID 事务**：跨引擎的强一致性，避免数据湖的"小文件 / 部分写"问题。
- **Schema Evolution**：列增删改不断链，下游兼容。
- **Time Travel**：快照回溯，可查询任意历史时刻。
- **Hidden Partitioning**：用户不感知分区细节，自动剪裁。
- **开放存储**：数据存 OSS / S3 / COS，不被厂商锁定。

### 1.2 为什么需要

**业务驱动力**：

- **"湖"与"仓"的痛点都需解决**：数据湖灵活但性能差、治理弱；数据仓库性能好但成本高、不灵活。**两者都需要**。
- **一份数据多场景复用**：同一份 Parquet 既要支持 BI 高频查询，又要支持 AI 训练采样。
- **避免数据复制**：传统架构中"湖 → 仓"需要数据复制，Lakehouse 让一份数据多场景共享。
- **简化架构**：减少 ETL 链路、减少存储副本、降低运维成本。
- **AI 时代数据栈底座**：AI 训练需要原始 + 加工数据，Lakehouse 提供一体化资产。

**痛点（没有 Lakehouse 的代价）**：

1. **湖仓割裂**：数据在湖 + 仓各存一份，成本翻倍、口径不一致。
2. **传统数仓无法存非结构化**：图片、视频、Embedding 无法入库。
3. **数据湖无法支持高频 BI**：查询性能差、CBO 不成熟。
4. **跨引擎数据孤岛**：Spark 写的数据 Presto 读不到、Hive 写的数据 Flink 改不动。
5. **Schema 演进困难**：传统 Hive 表加字段需要重建，Lakehouse 原生支持。

**AI 时代的新诉求**：

- **统一 AI + BI 数据底座**：同一份数据支撑特征工程 + 实时查询。
- **向量原生支持**：Iceberg V3、Paimon 都开始集成向量类型。
- **流批一体**：Paimon + Flink 实现"一份存储 + 一份计算"。
- **可追溯 / 可复现**：AI 训练数据需要 Time Travel + 血缘。

### 1.3 在 AI 时代数据架构中的位置

```
[业务系统 / 日志 / IoT]
        ↓ (CDC / 流式)
[Lakehouse 存储层（OSS/S3 + Iceberg/Paimon/Hudi/Delta）]
        ├── Bronze（原始）
        ├── Silver（清洗整合）
        └── Gold（精化聚合）
        ↓
[多引擎消费]
  ├── 批量分析（Spark / Trino）
  ├── 实时查询（StarRocks / Doris / ClickHouse）
  ├── 流计算（Flink）
  └── AI / RAG（向量检索 + LLM）
```

**Lakehouse 是"数据从生产到消费"的统一中间层**：上游对接原始数据流，下游对接所有计算引擎。它让数据"一份存储、多处消费"。

### 1.4 演进历程

**第一阶段：概念萌芽（2017-2019）**

- 2017：Delta Lake 0.2 发布（Databricks），提出"Open Table Format"思想。
- 2018：Netflix 开源 Iceberg（前身），解决 Hive 表的事务问题。
- 2019：Uber 开源 Hudi，针对更新密集场景。

**第二阶段：三国杀形成（2020-2022）**

- 2020：Databricks 提出 Lakehouse 概念。Iceberg 进入 Apache 孵化器。
- 2021：Iceberg 1.0、Hudi 0.10。表格式大战开始。
- 2022：Apache Paimon（前 Flink Table Store）进入战场，主打流批一体。
- **2022-2023**：社区分裂——Delta 偏 Databricks、Iceberg 偏 Trino/Snowflake、Hudi 偏 Uber、Paimon 偏 Flink。

**第三阶段：标准化与生态整合（2023-2024）**

- 2023：Snowflake 推出 Iceberg Tables，三大云厂商全部支持 Iceberg。
- 2024：Apache Paimon 1.0 毕业，进入 Apache 顶级项目。
- 2024：Delta UniForm（一份 Delta 数据支持 Iceberg / Hudi 读取）。
- 2024：Iceberg V3 规范发布，支持行级删除、增量读取、向量类型。

**第四阶段：AI 原生湖仓（2024-至今）**

- 2024：Databricks Unity Catalog + AI Functions + Vector Search 集成。
- 2024-2025：Snowflake Cortex + Iceberg Tables + AI 原生函数。
- 2025：Lakehouse 成为企业数据栈默认架构。
- 2025：多模态 Lakehouse（结构化 + 文本 + 图像 + 向量统一）。

**一句话总结**：**Lakehouse 从"Databricks 的私有概念"→"开放表格式三国杀"→"云厂商全面支持"→"AI 原生"四阶段演进，今天已是企业数据栈的事实标准。**

---

## 2. 核心原理

### 2.1 关键概念定义

**开放表格式（Open Table Format）**：在文件格式（Parquet / ORC）之上的"表语义层"，提供：
- **Schema 管理**：表的 schema 与文件解耦，schema 演进不断链。
- **ACID 事务**：并发读写不冲突、失败可回滚。
- **元数据管理**：统一的 manifest / catalog，跟踪所有文件。
- **Time Travel**：保留历史快照，支持任意时刻查询。
- **Partition Evolution**：分区策略可演进（重命名、合并、删除分区）。

**Snapshot（快照）**：表在某一时刻的完整状态。Lakehouse 通过快照实现 Time Travel。

**Manifest（清单文件）**：记录一个快照包含哪些数据文件 + 删除文件 + 分区信息。

**Schema Evolution**：列增删改时不影响已有数据，下游读取自动适配。

**Hidden Partitioning**：用户用业务字段（如 `order_time`）查询时，表格式自动按底层分区（如 `days(order_time)`）剪裁文件，用户无需感知。

**Time Travel**：通过 `snapshot-id` 或 `AS OF timestamp` 查询历史状态。

**Copy-on-Write（COW）**：写入时复制整个文件 + 改写。读快写慢。Hudi / Iceberg 默认。

**Merge-on-Read（MOR）**：写入时只追加增量文件 + delta log，读取时合并。写快读慢。Hudi 主打。

**Compaction**：把小文件合并成大文件，提升查询性能、降低元数据压力。

**Z-Order**：多维数据聚簇算法，让多个列的查询都能命中文件级剪裁。

### 2.2 数学 / 形式化基础

**快照隔离（Snapshot Isolation）的形式化**：

- 每个事务开始时获取一个一致性快照。
- 事务内的读操作都在该快照上，避免读到并发写的中间状态。
- 写操作在提交时检查是否有冲突（write-write conflict），若有则回滚。

**ACID 的工程化实现**：

| 特性 | 实现机制 |
| --- | --- |
| Atomicity | 事务日志（commit / abort），失败回滚 |
| Consistency | Schema 校验 + 主键唯一约束 |
| Isolation | MVCC（多版本并发控制）+ Snapshot Isolation |
| Durability | 数据文件 + 元数据文件持久化（WAL 模式可选） |

**MVCC（多版本并发控制）**：

- 每次写入创建新版本，旧版本保留。
- 读操作基于自己的快照版本读，看不到并发写的中间状态。
- 优点：读写不互斥，并发高。
- 缺点：需要定期清理旧版本（Vacuum / Expire Snapshots）。

**File Pruning 的数学原理**：

- 表格式的 manifest 文件包含每个数据文件的统计信息（min/max、null count、NDV）。
- 查询时，比较 WHERE 条件值与统计信息，跳过不匹配的文件。
- **剪裁率**：通常 80-99%，I/O 降低 1-2 个数量级。

**Hidden Partitioning 的剪裁算法**：

- 表定义：`PARTITIONED BY (days(order_time))`
- 用户查询：`WHERE order_time = '2025-01-15'` → 自动转换为 `partition = '2025-01-15'`
- 文件清单直接跳过其他分区 → O(1) 剪裁。

### 2.3 关键算法 / 方法

**1. Iceberg 的核心机制**：

- **Catalog**：统一管理表（Iceberg REST / Hive / Glue / Nessie / Polaris）。
- **Metadata 文件层级**：`metadata.json → manifest list → manifest file → data file`。
- **写入流程**：写入新数据文件 → 生成 manifest → 生成 manifest list → 原子提交到 catalog。
- **读取流程**：catalog 找 current snapshot → 加载 manifest list → 加载 manifest → 评估剪裁 → 读取数据。

**2. Hudi 的核心机制**：

- **Timeline**：所有操作的时序记录（commit / clean / delta_commit / rollback）。
- **表类型**：
  - **Copy-on-Write (COW)**：每次写入重写 parquet 文件，读快写慢。
  - **Merge-on-Read (MOR)**：基础 parquet + delta log（avro），读时合并，写快读慢。
- **索引**：bloom filter + 记录级索引，加速 upsert。

**3. Delta Lake 的核心机制**：

- **Transaction Log（_delta_log）**：JSON / Parquet 格式的事务日志。
- **Optimistic Concurrency**：基于乐观锁的并发控制，写入时检查冲突。
- **Z-Order + Vacuum**：聚簇优化 + 清理过期文件。

**4. Paimon 的核心机制**：

- **LSM Tree**：日志结构合并树，写入快（小文件自动合并）。
- **流批一体**：原生支持 Flink 流式读写 + Spark 批量读写。
- **主键合并**：内置主键索引，upsert 高效。
- **Changelog Producer**：内置变更日志流，支持物化视图增量刷新。

**5. Schema Evolution 算法**：

- 添加列（Add Column）：新列存默认值或 NULL，旧数据自动补齐。
- 删除列（Drop Column）：标记删除，保留历史兼容性。
- 重命名列（Rename Column）：更新 schema 映射，读取时映射。
- 类型变更（Type Widening）：int → bigint 安全；string → int 不安全（需 cast）。

**6. Compaction 算法**：

- **Bin-packing**：把多个小文件打包成大文件，控制目标文件大小。
- **Sort-merge**：按某列排序后合并，提升后续查询的剪裁率。
- **Z-Order 合并**：多维聚簇合并，平衡多个查询模式的剪裁。

### 2.4 与相邻概念的关系

**Lakehouse vs 数据湖**：

- 数据湖 = 原始 + 无 ACID + 无 Schema 治理。
- Lakehouse = 数据湖 + 表格式（ACID + Schema + 治理）。
- **Lakehouse 是数据湖的"升级版"**。

**Lakehouse vs 数据仓库**：

- 数据仓库 = 专用存储 + 列存 + 完整 ACID + 高性能。
- Lakehouse = 开放存储 + 表格式 + 跨引擎 + 灵活。
- **性能差距缩小**：Lakehouse + StarRocks / Doris 已接近传统数仓。

**Iceberg vs Hudi vs Delta vs Paimon 对比**：

| 维度 | Iceberg | Hudi | Delta Lake | Paimon |
| --- | --- | --- | --- | --- |
| 母公司 | Netflix / Apple | Uber | Databricks | Alibaba / Flink |
| 核心优势 | 社区活跃、Trino/Snowflake 深度支持 | 更新密集场景强 | Spark 生态最深 | Flink 生态原生、流批一体 |
| 写模型 | Copy-on-Write | COW + MOR | COW | LSM（流式） |
| 主键索引 | 弱 | 强 | 中 | 强 |
| 时间旅行 | 强 | 强 | 强 | 中 |
| 模式演进 | 强 | 中 | 强 | 强 |
| Schema 演进 | 强 | 强 | 强 | 强 |
| 流式写入 | 中 | 强 | 中 | 极强 |
| Flink 集成 | 中 | 中 | 中 | 极强 |
| 2024-2025 状态 | V3 规范、向量类型 | 1.0 稳定 | Delta UniForm | 1.0 毕业 |

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Iceberg + Spark/Flink + Trino（最常见）**

- 跨引擎最强、社区最大。
- 适用：通用场景、Trino 联邦查询为主。
- 典型栈：S3/OSS + Iceberg + Spark/Flink + Trino + StarRocks/Doris。

**模式 2：Paimon + Flink（流批一体首选）**

- Flink 生态原生、流批一体。
- 适用：实时入湖 + 流计算。
- 典型栈：OSS + Paimon + Flink + StarRocks。

**模式 3：Delta Lake + Databricks（AI/ML 一体化）**

- Spark 生态最深、Unity Catalog。
- 适用：AI/ML 训练、AI 平台。
- 典型栈：S3 + Delta + Databricks + MLflow + Vector Search。

**模式 4：Hudi + CDC（更新密集场景）**

- 强主键索引、MOR 写快。
- 适用：CDC 实时入湖、频繁 upsert。
- 典型栈：OSS + Hudi + Flink CDC + Spark。

**模式 5：多表格式共存（Iceberg 主 + Paimon 流）**

- 主用 Iceberg，实时场景用 Paimon。
- 适用：复杂业务，混合场景。

**模式 6：Medallion 架构（铜银金）**

- Bronze（原始）+ Silver（清洗）+ Gold（应用）。
- 适用：所有 Lakehouse 项目的基础范式。

**模式 7：Lakehouse + 实时 OLAP**

- Lakehouse 做存储层 + StarRocks/Doris 做查询层。
- 适用：实时 BI、秒级查询。

### 3.2 适用场景决策表

| 业务场景 | 推荐模式 | 典型技术栈 |
| --- | --- | --- |
| 跨引擎、联邦查询 | Iceberg + Trino | S3/OSS + Iceberg + Trino + Spark/Flink |
| 实时入湖、流批一体 | Paimon + Flink | OSS + Paimon + Flink + StarRocks |
| AI / 机器学习 | Delta Lake + Databricks | S3 + Delta + Databricks + MLflow |
| CDC 频繁 upsert | Hudi MOR + Flink CDC | OSS + Hudi + Flink CDC |
| 通用场景 | Iceberg（默认） | S3/OSS + Iceberg + Spark/Flink + StarRocks |
| 多模态 AI | Iceberg V3 + LanceDB | OSS + Iceberg V3 + LanceDB + LLM |
| 跨国 / 多云 | Iceberg + 统一 Catalog | 多云 OSS/S3 + Iceberg + Polaris/Nessie |

### 3.3 反模式与陷阱

**反模式 1：选错表格式**

- 选了 Delta 但 Flink 写入兼容性差。
- **正确**：根据引擎偏好选——Flink 选 Paimon、Spark 选 Delta、跨引擎选 Iceberg。

**反模式 2：不建 Catalog**

- 用本地文件系统 + Iceberg，metadata 不统一。
- **正确**：用 Hive Metastore / Glue / Nessie / Polaris 统一管理。

**反模式 3：忽视 Compaction**

- 小文件爆炸，元数据压力、查询慢。
- **正确**：定期 Compaction + 流式入湖用 Paimon（LSM 自动合并）。

**反模式 4：Schema Evolution 不规范**

- 直接删列、改类型，下游崩。
- **正确**：遵循"列可加、类型可展宽、列慎删"原则。

**反模式 5：把所有表都建在 Lakehouse**

- 高频小事务也用 Lakehouse，性能差。
- **正确**：高频小事务用 OLTP（MySQL / PostgreSQL）+ Lakehouse 跑分析。

**反模式 6：忽视 Time Travel 成本**

- 保留过多快照，存储爆炸。
- **正确**：定期 Expire Snapshots（默认 7 天）+ Vacuum 过期文件。

**反模式 7：分区过度膨胀**

- 一张表 10000 个分区，planner 卡死。
- **正确**：合理分区 + Hidden Partitioning。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型存储底座（1-2 周）**

- 云端：S3 / OSS / COS。
- 本地：MinIO。
- 混合云：Multi-Cloud Gateway。

**Step 2：选定表格式（1-2 周）**

- 默认：Iceberg（社区最大）。
- Flink 流批一体：Paimon。
- Spark 深度集成：Delta。
- CDC 频繁：Hudi。

**Step 3：搭建 Catalog（1-2 周）**

- Hive Metastore（成熟、广泛支持）。
- AWS Glue（AWS 原生）。
- Nessie（Git-like，多分支实验）。
- Polaris（Snowflake 开源，REST 接口）。

**Step 4：建立分层（2-4 周）**

- Bronze（原始）→ Silver（清洗）→ Gold（应用）。

**Step 5：搭建入湖链路（4-8 周）**

- 离线：DataX / Sqoop / Spark。
- 实时：Flink CDC / Kafka Connect。
- 流式：Flink + Paimon / Flink + Iceberg。

**Step 6：搭建查询层（2-4 周）**

- 批量：Trino / Spark SQL。
- 即席：StarRocks / Doris / ClickHouse（外表模式）。
- AI：LanceDB / Milvus（向量检索）。

**Step 7：建立治理（持续）**

- 元数据：Unity Catalog / Apache Atlas。
- 血缘：OpenLineage / DataHub。
- 质量：Great Expectations / Soda。
- 权限：Apache Ranger / Lake Formation。

### 4.2 关键技术点

**1. Iceberg 表创建与写入**

```sql
-- 创建 Iceberg 表
CREATE TABLE iceberg.orders (
  order_id    BIGINT,
  user_id     BIGINT,
  amount      DECIMAL(18,2),
  order_time  TIMESTAMP
) PARTITIONED BY (days(order_time))
STORED AS ICEBERG;

-- Time Travel
SELECT * FROM iceberg.orders
FOR SYSTEM_TIME AS OF '2025-01-15 10:00:00';

-- Schema Evolution
ALTER TABLE iceberg.orders
ADD COLUMN coupon_amount DECIMAL(18,2);

-- 隐藏分区（无需感知）
SELECT * FROM iceberg.orders
WHERE order_time BETWEEN '2025-01-01' AND '2025-01-31';
```

**2. Paimon 流式入湖**

```java
// Flink + Paimon 流式写入
tEnv.executeSql("""
    CREATE TABLE paimon_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      ts TIMESTAMP(3),
      PRIMARY KEY (order_id) NOT ENFORCED
    ) WITH (
      'connector' = 'paimon',
      'path' = 's3://lake/paimon/orders',
      'sink.bucket-num' = '8',
      'changelog-producer' = 'input'
    )
""");

tEnv.executeSql("""
    INSERT INTO paimon_orders
    SELECT * FROM kafka_orders
""");
```

**3. Schema Evolution 最佳实践**

```sql
-- 安全操作
ALTER TABLE orders ADD COLUMN new_col STRING;
ALTER TABLE orders ALTER COLUMN amount TYPE BIGINT; -- 兼容性变更

-- 不安全操作（需谨慎）
ALTER TABLE orders DROP COLUMN old_col; -- 标记删除，旧数据可能错乱
ALTER TABLE orders ALTER COLUMN s TYPE INT; -- string → int 失败
```

**4. Compaction 与优化**

```sql
-- Iceberg 数据文件合并
CALL iceberg.system.rewrite_data_files(
  table => 'orders',
  strategy => 'sort',
  sort_order => 'zorder[order_time, user_id]',
  options => map('min-input-files', '10', 'target-file-size-bytes', '536870912')
);

-- 清理过期快照
CALL iceberg.system.expire_snapshots(
  table => 'orders',
  older_than => TIMESTAMP '2025-01-01 00:00:00',
  retain_last => 10
);

-- 清理孤立文件
CALL iceberg.system.remove_orphan_files(
  table => 'orders',
  older_than => TIMESTAMP '2024-12-01 00:00:00'
);
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**表格式（2024-2025 最新版本）**：

| 工具 | 版本 | 2024-2025 新特性 |
| --- | --- | --- |
| Apache Iceberg | 1.6.x | V3 规范：行级删除、增量读取、向量类型、Variant 类型 |
| Apache Hudi | 1.0 | Timeline Server、Lakehood 集成 |
| Delta Lake | 3.2.x | Delta UniForm（一份数据多引擎读取） |
| Apache Paimon | 1.1 | LSM 优化、主键索引、流批融合 |

**Catalog（2024-2025）**：

| 工具 | 特点 |
| --- | --- |
| Hive Metastore | 传统成熟、广泛支持 |
| AWS Glue Catalog | AWS 原生 |
| Nessie | Git-like 多分支 |
| Polaris（Snowflake） | REST Catalog、2024 开源 |
| Unity Catalog（Databricks） | 统一治理、跨表格式 |

**查询引擎**（详见 §13）：

- Trino 420+：Iceberg V3 原生支持。
- Spark 3.5+：Iceberg / Hudi / Delta / Paimon 全支持。
- Flink 1.19+：Paimon / Iceberg 流批一体。
- StarRocks 3.x：Iceberg 外表查询、Paimon 外表查询。
- Doris 2.1+：Iceberg / Hive 外表查询。

**云厂商 Lakehouse 服务（2024-2025）**：

- **Databricks Data Intelligence Platform**：Lakehouse + AI + Unity Catalog。
- **Snowflake Iceberg Tables**：三云全支持 Iceberg。
- **阿里云 DLF（Data Lake Formation）**：OSS + Iceberg/Paimon/Hudi 一站式。
- **腾讯云 DLC（Data Lake Compute）**：COS + Iceberg + Spark。
- **华为云 DWS Lakehouse**：MRS + Iceberg。
- **AWS Lake Formation**：S3 + Glue + Iceberg/Hudi。

### 4.4 代码 / 示例

**示例 1：完整 Lakehouse 架构（Iceberg + Spark + Trino + StarRocks）**

```python
# PySpark 写入 Iceberg
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("LakehouseDemo") \
    .config("spark.sql.catalog.iceberg", "org.apache.iceberg.spark.SparkCatalog") \
    .config("spark.sql.catalog.iceberg.type", "hive") \
    .config("spark.sql.catalog.iceberg.uri", "thrift://metastore:9083") \
    .config("spark.sql.catalog.iceberg.warehouse", "s3://lake/warehouse") \
    .getOrCreate()

# 1. Bronze 层：原始数据
raw_df = spark.read.parquet("s3://raw/orders/dt=2025-01-01/")
raw_df.writeTo("iceberg.bronze.orders").createOrReplace()

# 2. Silver 层：清洗 + 维度建模
silver_df = raw_df \
    .filter("amount > 0") \
    .dropDuplicates(["order_id"]) \
    .withColumn("user_id", col("user_id").cast("bigint"))

silver_df.writeTo("iceberg.silver.orders") \
    .partitionedBy(days("order_time")) \
    .createOrReplace()

# 3. Gold 层：聚合
gold_df = silver_df.groupBy("user_id", "dt") \
    .agg(sum("amount").alias("gmv"), count("order_id").alias("orders"))

gold_df.writeTo("iceberg.gold.user_daily_orders") \
    .partitionedBy("dt") \
    .createOrReplace()
```

```sql
-- Trino 查询 Iceberg Lakehouse
SELECT
    region,
    SUM(gmv) AS total_gmv,
    COUNT(DISTINCT user_id) AS users
FROM iceberg.iceberg.gold.user_daily_orders
WHERE dt BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY region
ORDER BY total_gmv DESC;
```

```sql
-- StarRocks 外表查询 Iceberg（实时 BI）
CREATE EXTERNAL TABLE orders_iceberg
ENGINE = ICEBERG
PROPERTIES (
    "iceberg.catalog.type" = "hive",
    "iceberg.catalog.uri" = "thrift://metastore:9083",
    "iceberg.database" = "gold",
    "iceberg.table" = "user_daily_orders"
);

SELECT region, SUM(gmv)
FROM orders_iceberg
WHERE dt = '2025-01-15'
GROUP BY region;
```

**示例 2：Iceberg V3 向量类型（2024 新特性）**

```python
# Iceberg V3 支持向量类型（Beta 阶段）
spark.sql("""
    CREATE TABLE products_with_vectors (
        id BIGINT,
        name STRING,
        price DECIMAL(18, 2),
        description_embedding ARRAY<FLOAT>  -- 向量类型
    ) USING iceberg
""")

# 写入向量
df_with_vectors.writeTo("products_with_vectors").append()

# 向量检索（需配合外部向量库）
# ... 检索最近邻
```

**示例 3：Paimon 流批一体（2024 毕业项目）**

```java
// Flink + Paimon 流式入湖 + 批量查询
TableEnvironment tEnv = ...;

// 1. 定义 Kafka 源
tEnv.executeSql("""
    CREATE TABLE kafka_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      ts TIMESTAMP(3)
    ) WITH (
      'connector' = 'kafka',
      'topic' = 'orders',
      'format' = 'json'
    )
""");

// 2. 定义 Paimon 表（含主键）
tEnv.executeSql("""
    CREATE TABLE paimon_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      PRIMARY KEY (order_id) NOT ENFORCED
    ) WITH (
      'connector' = 'paimon',
      'path' = 's3://lake/paimon/orders'
    )
""");

// 3. 流式 INSERT（Changelog 流）
tEnv.executeSql("""
    INSERT INTO paimon_orders
    SELECT order_id, user_id, amount FROM kafka_orders
""");

// 4. 批量查询（通过 Spark）
spark.read.format("paimon").load("s3://lake/paimon/orders").show();
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：AI 驱动的表格式优化**

- LLM 预测查询模式，自动选择 Compaction 策略、Z-Order 列。
- 代表：Snowflake Query Insights、StarRocks AI Advisor。
- **2024 趋势**：自治 Lakehouse（Self-Driving Lakehouse）。

**演进方向 2：向量原生 Lakehouse**

- Iceberg V3、Paimon 集成向量类型。
- LanceDB、Delta Vector 等多模态表格式出现。
- **价值**：结构化 + 向量统一存储、统一检索。

**演进方向 3：AI 驱动的元数据管理**

- LLM 自动提取字段含义、值域、关联关系。
- 自动生成数据字典、自动补全文档。
- **价值**：降低元数据维护成本。

**演进方向 4：自然语言查询**

- 用户用自然语言查询 Lakehouse。
- 代表：Databricks Genie、Snowflake Cortex Analyst。
- **链路**：NL → 指标语义层 → SQL → 执行。

**演进方向 5：Agent 触达 Lakehouse**

- Agent 通过统一 API 直接查询 Lakehouse（无需 SQL）。
- 自动选择查询引擎、自动优化计划。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**Lakehouse + RAG**：

- Lakehouse 存原始文档 + Embedding。
- 检索时直接读 Lakehouse，生成上下文给 LLM。
- 工具：LanceDB + Iceberg、Delta Vector Search。

**Lakehouse + 向量库**：

- Lakehouse 存结构化数据，向量库存 Embedding。
- 联合查询（Trino + Milvus Connector）。
- **2024 趋势**：向量库 + Lakehouse 融合（避免数据复制）。

**Lakehouse + GraphRAG**：

- Lakehouse 存原始文本 + 实体。
- LLM 抽取关系 → 知识图谱。
- GraphRAG 检索关联 + LLM 生成答案。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **Apache Iceberg V3 规范（2024）**：行级删除、增量读取、Variant 类型、向量类型支持。
- **Apache Paimon 论文（VLDB 2024）**：LSM Tree + 流批融合的表格式设计。
- **Delta UniForm 论文（SIGMOD 2024）**：一份 Delta 数据支持 Iceberg / Hudi 读取。
- **Apache Hudi Timeline Server 论文（2024）**：元数据服务化、Hudi 1.0 架构升级。

**工业进展**：

- **Databricks Data Intelligence Platform（2024）**：Unity Catalog + AI Functions + Vector Search。
- **Snowflake Iceberg Tables（2024）**：三云全支持 Iceberg、Snowpark + AI。
- **Apache Paimon 1.0 毕业（2024）**：Flink 生态流式表格式正式毕业。
- **阿里云 DLF + Paimon（2024）**：OSS + Paimon 流式湖仓商业化。
- **Apache Polaris 1.0（2024）**：Snowflake 开源的 REST Catalog。
- **LanceDB 1.0（2024）**：多模态列式数据库，专为 AI 设计。

### 5.4 未来 3-5 年趋势

**趋势 1：Iceberg 成为主流标准**

- Iceberg V3、V4 持续演进，社区最大、生态最广。
- 可能成为 Lakehouse 表格式的事实标准。

**趋势 2：AI 原生 Lakehouse**

- 向量 + 结构化 + 文本 + 图像统一存储。
- AI Functions 内置于 Lakehouse 引擎。

**趋势 3：自治 Lakehouse**

- 自动 Compaction、自动优化、自动扩容。
- LLM + ML 驱动的自管理。

**趋势 4：实时 Lakehouse（Real-Time Lakehouse）**

- 端到端延迟 < 1 秒。
- 流批一体表格式（Paimon）+ 流计算（Flink）+ 实时 OLAP（StarRocks/Doris）。

**趋势 5：联邦 Lakehouse**

- 跨云、跨国、跨厂商的统一 Catalog。
- 统一查询（Trino Federation）。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：Netflix Iceberg 大规模落地**

- **数据规模**：PB 级，每天数万亿事件。
- **架构**：S3 + Iceberg + Spark/Flink + Trino + Pinot。
- **效果**：替代 Hive 后查询性能提升 3-10x，存储成本降低 60%。

**案例 2：Apple Iceberg（隐私优先）**

- **数据规模**：EB 级。
- **架构**：自研存储 + Iceberg + 自研查询引擎。
- **亮点**：差分隐私 + 端侧计算 + 联邦学习。

**案例 3：LinkedIn Iceberg（数据治理）**

- **数据规模**：PB 级。
- **架构**：HDFS → S3 + Iceberg + Spark + Pinot。
- **效果**：替代传统 Hive，ETL 时间减少 70%。

**案例 4：字节跳动 Paimon 流式湖仓**

- **数据规模**：PB 级。
- **架构**：OSS + Paimon + Flink + StarRocks。
- **亮点**：实时入湖 + 实时 OLAP，端到端延迟 < 1 秒。

**案例 5：阿里云 DLF + Paimon**

- **数据规模**：服务上千家企业客户。
- **架构**：OSS + Paimon/Iceberg + Flink/Spark + Hologres/StarRocks。
- **效果**：湖仓一体标准化方案，一键开通。

### 6.2 踩坑与经验

**坑 1：表格式选错**

- **现象**：选了 Delta 但 Flink 写入失败。
- **解决**：根据引擎偏好选——Flink 选 Paimon、Spark 选 Delta、跨引擎选 Iceberg。

**坑 2：小文件爆炸**

- **现象**：千万级小文件，元数据压力。
- **解决**：定期 Compaction + 流式入湖用 Paimon。

**坑 3：Catalog 单点**

- **现象**：Hive Metastore 挂了，全集群瘫痪。
- **解决**：用 Glue / Nessie / Polaris 等云原生 Catalog + 高可用部署。

**坑 4：Time Travel 成本失控**

- **现象**：保留 1 年快照，存储翻倍。
- **解决**：定期 Expire Snapshots + Vacuum。

**坑 5：Schema 演进不规范**

- **现象**：上游删列，下游崩。
- **解决**：规范 Schema 演进流程（详 §3.3）。

**坑 6：分区过度膨胀**

- **现象**：1 万个分区，planner 卡死。
- **解决**：合理分区 + Hidden Partitioning。

**坑 7：流批链路不一致**

- **现象**：实时数据 + 离线数据对不上。
- **解决**：Paimon / Iceberg 流批一体引擎 + 端到端 Exactly-Once。

### 6.3 落地路径（0→1, 1→10, 10→100）

**阶段 1：0 → 1（启动期，0-6 个月）**

- 选 Iceberg + S3/OSS + Spark + Trino。
- 建 Bronze / Silver / Gold 三层。
- 团队：2-3 数据工程师。

**阶段 2：1 → 10（扩展期，6-18 个月）**

- 引入 Flink 流式入湖 + 实时 OLAP。
- 建立 Catalog + 治理体系。
- 团队：5-10 数据工程师 + 1 架构师。

**阶段 3：10 → 100（规模化期，18-36 个月）**

- 多表格式（Paimon + Iceberg + Delta）。
- 多模态（结构化 + 向量 + 文本）。
- AI 原生治理 + 自治优化。
- 团队：20-50 数据工程师 + 治理团队。

### 6.4 ROI 评估

**评估维度**：

- **存储成本**：Lakehouse 比专用数仓便宜 60-80%。
- **查询性能**：Iceberg + Trino 比 Hive 提升 3-10x。
- **业务上线速度**：新业务接入时间从 1 个月 → 1 周。
- **AI 训练效率**：原始数据保留，AI 训练样本准备时间减少 50%+。

**典型 ROI**：

- Netflix Iceberg：存储成本降低 60%，查询性能提升 5x。
- LinkedIn Iceberg：ETL 时间减少 70%。
- 字节 Paimon：实时性提升 10x，成本降低 40%。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 数据湖 | 数据仓库 | Lakehouse |
| --- | :---: | :---: | :---: |
| 存储成本 | 5 | 2 | 5 |
| 多源异构 | 5 | 2 | 5 |
| ACID 保障 | 1 | 5 | 4 |
| 查询性能 | 2 | 5 | 4 |
| Schema 治理 | 1 | 5 | 4 |
| 跨引擎兼容 | 3 | 2 | 5 |
| AI 友好度 | 4 | 2 | 5 |
| 工程复杂度 | 3 | 3 | 4 |

### 7.2 决策树

```
业务需求？
├── 数据量大 + 多源异构 + AI 友好
│   └── Lakehouse（Iceberg / Paimon + Trino/Flink + StarRocks）
├── 传统 BI + 报表为主
│   └── 数据仓库（Snowflake / BigQuery / Doris）
├── 超低成本 + 不需要治理
│   └── 数据湖（MinIO + Spark）
└── AI 平台 + 多模态
    └── AI 原生 Lakehouse（Iceberg V3 + LanceDB + LLM）
```

### 7.3 组合使用

**组合 1：Lakehouse + 实时 OLAP**

- Lakehouse 做存储层，StarRocks/Doris 做查询层。
- 适用：实时 BI、秒级查询。

**组合 2：Lakehouse + 传统数仓**

- Lakehouse 存原始 + 历史，数据仓库存精化。
- 适用：超大规模企业。

**组合 3：Iceberg + Paimon（混合）**

- Iceberg 做离线主仓，Paimon 做实时入湖。
- 适用：复杂业务、混合场景。

**组合 4：Lakehouse + 向量库**

- Lakehouse 存结构化，向量库存 Embedding。
- 联合查询。
- 适用：AI 应用。

**组合 5：Lakehouse + 知识图谱**

- Lakehouse 存原始文本 + 实体。
- 知识图谱存关系。
- GraphRAG。
- 适用：AI 智能问答。

---

## 8. 面试真题集

# lakehouse 面试真题集

> **一句话定位**：Lakehouse 的工程实践（MinIO + Iceberg + Trino 实战）。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 13 个原 PDF 子章节、共 70 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §2.5 | 统⼀接⼊与湖仓⼀体架构规划 | 2.5.1 ~ 2.5.7（共 7） | 7 | 主 |
| §4.4 | 数据湖仓⼀体化与 Lambda 架构 | 4.4.1, 4.4.2, 4.4.3, 4.4.4, 4.4.5 | 5 | 主 |
| §6.6 | Spark 与数据湖集成及 Lambda 架构 | 6.6.1 ~ 6.6.7（共 7） | 7 | 主 |
| §7.1 | 数据湖表格式基础与核⼼价值 | 7.1.1, 7.1.2, 7.1.3, 7.1.4, 7.1.5 | 5 | 主 |
| §7.2 | 三⼤表格式核⼼特性对⽐ | 7.2.1, 7.2.2, 7.2.3, 7.2.4 | 4 | 辅 |
| §8.3 | 数据湖与Lambda架构融合 | 8.3.1, 8.3.2, 8.3.3, 8.3.4, 8.3.5 | 5 | 主 |
| §12.4 | 数据湖与Lambda架构成本优化 | 12.4.1, 12.4.2, 12.4.3, 12.4.4, 12.4.5 | 5 | 主 |
| §13.5 | 实时数仓与数据湖架构融合及演进 | 13.5.1 ~ 13.5.7（共 7） | 7 | 主 |
| §14.6 | 流批⼀体与数据湖集成实践 | 14.6.1, 14.6.2, 14.6.3, 14.6.4, 14.6.5 | 5 | 主 |
| §16.1 | 存储⽅案与数据持久化 | 16.1.1 ~ 16.1.6（共 6） | 6 | 辅 |
| §16.5 | 数据湖与 Lambda 架构的云原⽣实践 | 16.5.1 ~ 16.5.6（共 6） | 6 | 主 |
| §17.2 | 数据湖与数据仓库的融合 | 17.2.1, 17.2.2, 17.2.3, 17.2.4 | 4 | 主 |
| §19.2 | 数据湖与数据仓库的对⽐与应⽤ | 19.2.1, 19.2.2, 19.2.3, 19.2.4 | 4 | 辅 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §2 多源异构数据的实时与批量接⼊ > 本主题涵盖 1 个子节、7 道题。

#### 2.1.5 统⼀接⼊与湖仓⼀体架构规划

> 来源：原 PDF §2.5，收录 7 道题。

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

### 2.2 §4 基于Hive/Spark SQL的数据仓库建设 > 本主题涵盖 1 个子节、5 道题。

#### 2.2.4 数据湖仓⼀体化与 Lambda 架构

> 来源：原 PDF §4.4，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §4.4.1 | ★★★☆☆ |
| §4.4.2 | ★★★☆☆ |
| §4.4.3 | ★★★☆☆ |
| §4.4.4 | ★★★☆☆ |
| §4.4.5 | ★★★★☆ |

- **§4.4.1**：请结合实际案例，说明在万节点规模的 Hadoop/Spark 集群上，如何规划和优化
- **§4.4.2**：请解释数据湖和数据仓库在数据存储和处理⽅式上的主要区别是什么？
- **§4.4.3**：请描述 Lambda 架构的基本组成和数据处理流程，并说明它在处理⼤规模数据时
- **§4.4.4**：请阐述在数据湖仓⼀体化架构中，表格式（如 Iceberg、Hudi）扮演了什么关键⻆
- **§4.4.5**：在基于 Iceberg 或 Hudi 构建数据湖仓时，如何设计和实施⼀套⾼效的增量数据摄

### 2.3 §6 ⼤规模数据处理应⽤的开发与优化 > 本主题涵盖 1 个子节、7 道题。

#### 2.3.6 Spark 与数据湖集成及 Lambda 架构

> 来源：原 PDF §6.6，收录 7 道题。

| 题号 | 难度 |
| --- | :---: |
| §6.6.1 | ★★★☆☆ |
| §6.6.2 | ★★★☆☆ |
| §6.6.3 | ★★★☆☆ |
| §6.6.4 | ★★★☆☆ |
| §6.6.5 | ★★★★☆ |
| §6.6.6 | ★★★★☆ |
| §6.6.7 | ★★★★★ |

- **§6.6.1**：请描述在将 Spark 应⽤与 Delta Lake 集成时，为了保证数据的⼀致性和可靠性，
- **§6.6.2**：请设计⼀个结合了 Spark、Delta Lake 和 Lambda 架构的端到端数据平台⽅案，
- **§6.6.3**：请简要说明 Spark 与数据湖（如 Delta Lake 或 Iceberg）集⽤的核⼼优势是什
- **§6.6.4**：请说明在万节点规模的 Spark 集群上，当数据湖（例如 Iceberg 表）中的⼩⽂件
- **§6.6.5**：请解释在 Lambda 架构实践中，如何利⽤ Spark Structured Streaming 来构建和
- **§6.6.6**：请阐述在 Lambda 架构中，批处理层和速度层分别扮演什么⻆⾊，以及它们是如
- **§6.6.7**：请分析在超⼤规模 Spark 集群上运⾏与数据湖集成的复杂 ETL 作业时，可能遇到

### 2.4 §7 Hudi/Delta Lake/Iceberg的选型与落地 > 本主题涵盖 2 个子节、9 道题。

#### 2.4.1 数据湖表格式基础与核⼼价值

> 来源：原 PDF §7.1，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §7.1.1 | ★★★☆☆ |
| §7.1.2 | ★★★☆☆ |
| §7.1.3 | ★★★☆☆ |
| §7.1.4 | ★★★☆☆ |
| §7.1.5 | ★★★★☆ |

- **§7.1.1**：请列举并⽐较⽬前主流的三种数据湖表格式（Hudi, Delta Lake, Iceberg）各⾃的
- **§7.1.2**：请简要说明数据湖表格式的基本概念，并阐述它相⽐传统数据湖⽅案（如直接在H
- **§7.1.3**：在数据湖架构中，ACID事务特性对于保证数据⼀致性⾄关重要。请详细解释数据湖
- **§7.1.4**：随着数据规模和复杂度的增⻓，数据湖表格式的查询性能优化成为⼀个关键问题。
- **§7.1.5**：假设你正在为⼀个需要同时⽀持⾼吞吐实时数据写⼊（如CDC流）和⾼效历史数据

#### 2.4.2 三⼤表格式核⼼特性对⽐

> 来源：原 PDF §7.2，收录 4 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §7.2.1 | ★★★☆☆ |
| §7.2.2 | ★★★☆☆ |
| §7.2.3 | ★★★☆☆ |
| §7.2.4 | ★★★☆☆ |

- **§7.2.1**：请⽐较Hudi、Delta Lake和Iceberg在实现数据更新和删除操作时所采⽤的模式，
- **§7.2.2**：请简要说明Hudi、Delta Lake和Iceberg这三种数据湖表格式在ACID事务⽀持⽅⾯
- **§.2.3**：请详细阐述Hudi、Delta Lake和Iceberg在Schema演进策略上的不同，并说明这
- **§7.2.4**：结合⼀个需要同时满⾜实时数据摄取和历史数据回溯分析的场景，请阐述你如何基

### 2.5 §8 构建统⼀数据服务的Lambda架构实践 > 本主题涵盖 1 个子节、5 道题。

#### 2.5.3 数据湖与Lambda架构融合

> 来源：原 PDF §8.3，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §8.3.1 | ★★★☆☆ |
| §8.3.2 | ★★★☆☆ |
| §8.3.3 | ★★★☆☆ |
| §8.3.4 | ★★★☆☆ |
| §8.3.5 | ★★★★☆ |

- **§8.3.1**：在将数据湖与Lambda架构融合的设计中，数据湖通常扮演什么⻆⾊？这种融合设
- **§8.3.2**：请描述在Lambda架构实践中，如何确保批处理层和速度层输出结果的⼀致性，并
- **§8.3.3**：请解释Lambda架构的基本原理，并说明批处理层和速度层各⾃的作⽤是什么？
- **§8.3.4**：随着流处理技术的演进，有⼈提出Kappa架构可以替代Lambda架构。请分析在什
- **§8.3.5**：在万节点规模的Hadoop/Spark集群上实施Lambda架构时，你会如何设计数据治

### 2.6 §12 计算存储分离、冷热数据分层与弹性伸缩 > 本主题涵盖 1 个子节、5 道题。

#### 2.6.4 数据湖与Lambda架构成本优化

> 来源：原 PDF §12.4，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §12.4.1 | ★★★☆☆ |
| §12.4.2 | ★★★☆☆ |
| §12.4.3 | ★★★☆☆ |
| §12.4.4 | ★★★☆☆ |
| §12.4.5 | ★★★★☆ |

- **§12.4.1**：在当前云原⽣和存算分离的趋势下，数据湖与Lambda架构的融合部署⾯临哪些新
- **§12.4.2**：请描述在Lambda架构中，批处理层和速度层分别可能产⽣哪些主要的成本构成，
- **§12.4.3**：请解释数据湖和Lambda架构的基本概念，并说明它们在成本优化⽅⾯各⾃扮演了
- **§12.4.4**：在数据湖架构中，针对冷热数据分层，通常采⽤哪些策略和技术⼿段来降低存储
- **§12.4.5**：假设你负责⼀个⼤规模数据平台，数据量持续增⻓且查询模式复杂多变。请设计

### 2.7 §13 Flink、Kafka、ClickHouse在实时场景的应⽤

> 本主题涵盖 1 个子节、7 道题。

#### 2.7.5 实时数仓与数据湖架构融合及演进

> 来源：原 PDF §13.5，收录 7 道题。

| 题号 | 难度 |
| --- | :---: |
| §13.5.1 | ★★★☆☆ |
| §13.5.2 | ★★★☆☆ |
| §13.5.3 | ★★★☆☆ |
| §13.5.4 | ★★★☆☆ |
| §13.5.5 | ★★★★☆ |
| §13.5.6 | ★★★★☆ |
| §13.5.7 | ★★★★★ |

- **§13.5.1**：请解释流批⼀体架构的核⼼思想，并阐述 Flink 是如何通过其统⼀的运⾏时引擎来
- **§13.5.2**：请描述⼀个结合了 Flink、Kafka 和 ClickHouse 的实时数据分析场景的端到端架
- **§13.5.3**：请分析传统 Lambda 架构的痛点，并阐述基于 Flink 和现代数据湖技术（如 Iceb
- **§13.5.4**：请讨论在实时湖仓⼀体架构中，如何利⽤ Flink 和 Apache Iceberg（或 Hudi）
- **§13.5.5**：请阐述 Flink CDC 的⼯作原理，并说明它在实时数据⼊湖⼊仓过程中的核⼼价
- **§13.5.6**：请对⽐分析 Apache Iceberg 和 Apache Hudi 这两种数据湖格式在实时场景下的
- **§13.5.7**：请解释在实时数仓架构中，Flink 和 Kafka 分别扮演什么⻆⾊，以及它们是如何

### 2.8 §14 统⼀流处理架构的挑战与落地 > 本主题涵盖 1 个子节、5 道题。

#### 2.8.6 流批⼀体与数据湖集成实践

> 来源：原 PDF §14.6，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §14.6.1 | ★★★☆☆ |
| §14.6.2 | ★★★☆☆ |
| §14.6.3 | ★★★☆☆ |
| §14.6.4 | ★★★☆☆ |
| §14.6.5 | ★★★★☆ |

- **§14.6.1**：假设你需要将⼀个现有的Lambda架构系统迁移到基于Iceberg或Hudi的流批⼀体
- **§14.6.2**：请描述Apache Iceberg或Apache Hudi这类数据湖表格式是如何⽀持流式数据写
- **§14.6.3**：在设计⼀个基于数据湖的流批⼀体数仓时，如何利⽤Iceberg或Hudi的表格式来统
- **§14.6.4**：请解释流批⼀体架构的核⼼思想，并阐述它相⽐传统的Lambda架构有哪些主要优
- **§14.6.5**：请分析在超⼤规模数据平台下，采⽤流批⼀体架构并结合数据湖表格式可能⾯临

### 2.9 §16 Kubernetes上运⾏⼤数据组件的实践与思考 > 本主题涵盖 2 个子节、12 道题。

#### 2.9.1 存储⽅案与数据持久化

> 来源：原 PDF §16.1，收录 6 道题。（辅）

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

#### 2.9.5 数据湖与 Lambda 架构的云原⽣实践

> 来源：原 PDF §16.5，收录 6 道题。

| 题号 | 难度 |
| --- | :---: |
| §16.5.1 | ★★★☆☆ |
| §16.5.2 | ★★★☆☆ |
| §16.5.3 | ★★★☆☆ |
| §16.5.4 | ★★★☆☆ |
| §16.5.5 | ★★★★☆ |
| §16.5.6 | ★★★★☆ |

- **§16.5.1**：请探讨在万节点级别的Kubernetes集群上运⾏⼤规模Spark作业时，可能遇到的⽹
- **§16.5.2**：请解释数据湖与Lambda架构的基本概念，并说明它们各⾃在⼤数据处理中的主要
- **§16.5.3**：请描述在Kubernetes环境中实现⼀个⽀持Lambda架构的数据平台时，你会如何
- **§16.5.4**：在云原⽣数据湖架构中，如何利⽤Kubernetes的特性（如Operator、Helm、CR
- **§16.5.5**：随着数据湖和流批⼀体架构的发展，Lambda架构在某些场景下被认为过于复杂。
- **§16.5.6**：在Kubernetes上部署⼤数据组件（例如Spark或Flink）时，与在传统物理机或虚

### 2.10 §17 构建新⼀代统⼀的数据架构 > 本主题涵盖 1 个子节、4 道题。

#### 2.10.2 数据湖与数据仓库的融合

> 来源：原 PDF §17.2，收录 4 道题。

| 题号 | 难度 |
| --- | :---: |
| §17.2.1 | ★★★☆☆ |
| §17.2.2 | ★★★☆☆ |
| §17.2.3 | ★★★☆☆ |
| §17.2.4 | ★★★☆☆ |

- **§17.2.1**：在设计⼀个⽀持万节点级别的湖仓⼀体平台时，你会如何规划和解决元数据管理、
- **§17.2.2**：在湖仓⼀体架构中，数据湖和数据仓库分别扮演什么⻆⾊？它们是如何协同⼯作
- **§17.2.3**：请阐述数据湖和数据仓库在数据存储和处理⽅式上的主要区别是什么？
- **§17.2.4**：请结合⼀个具体的业务场景，说明选择湖仓⼀体架构相⽐传统分离架构能带来哪

### 2.11 §19 未来3-5年技术路线图制定与团队能⼒建设 > 本主题涵盖 1 个子节、4 道题。

#### 2.11.2 数据湖与数据仓库的对⽐与应⽤

> 来源：原 PDF §19.2，收录 4 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §19.2.1 | ★★★☆☆ |
| §19.2.2 | ★★★☆☆ |
| §19.2.3 | ★★★☆☆ |
| §19.2.4 | ★★★☆☆ |

- **§19.2.1**：请简要说明数据湖和数据仓库在数据存储和处理⽅式上的主要区别是什么？
- **§19.2.2**：随着数据湖仓⼀体化（Lakehouse）概念的兴起，你认为它如何结合了数据湖和
- **§19.2.3**：请解释数据湖架构中可能出现的'数据沼泽'问题，并详细说明你作为架构师会采取
- **§19.2.4**：在实际项⽬中，如何根据业务需求来决定是采⽤数据湖、数据仓库还是两者结合

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **实时与流处理架构**
- **性能优化与调优**
- **数据建模与仓库建设**
- **架构演进与未来趋势**
- **湖仓与存储架构**

## 4 本章小结

> 本面试真题集收录 70 道题，覆盖 11 个原 PDF 主题、13 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
