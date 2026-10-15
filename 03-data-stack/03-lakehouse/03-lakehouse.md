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

> 本节针对「湖仓一体（Lakehouse）」章节，整理自真实架构师面试高频考点与 data-travel 项目读者的反馈。
>
> **每题按五段式作答**：考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料。参考答案优先引用**头部互联网企业与开源社区的公开架构实践**（Netflix / Uber / Meta / LinkedIn / Databricks / Snowflake / Apache Iceberg / Apache Hudi / Delta Lake 社区 / 阿里 MaxCompute / 字节 DataFinder / 招行 / 平安 / 米哈游 / 美的 / 永辉 / 微医 等），便于读者进一步溯源。
>
> 题号采用章节自编码 `LH-Q`（LakeHouse-Question），便于本章节内交叉引用。

### 8.1 全景视图

| 题号 | 主题 | 主/辅 |
| --- | --- | :---: |
| §LH-1 | Iceberg / Hudi / Delta / Paimon 四大表格式差异与选型 | 主 |
| §LH-2 | 湖仓分层（Bronze / Silver / Gold / Medallion）设计 | 主 |
| §LH-3 | Hive Metastore vs Unity Catalog vs Polaris / Nessie 元数据治理 | 主 |
| §LH-4 | COW 与 MOR 写模型及流批一体落地取舍 | 主 |
| §LH-5 | 增量处理 vs 全量重算在湖仓上的工程路径 | 主 |
| §LH-6 | 存算分离架构下对象存储 + Catalog + 计算引擎的协同 | 主 |
| §LH-7 | AI 时代 Lakehouse：向量 / RAG / Schema Evolution 与 Time Travel | 辅 |

| 题号 | 难度 |
| --- | :---: |
| §LH-1 | ★★★★☆ |
| §LH-2 | ★★★☆☆ |
| §LH-3 | ★★★★☆ |
| §LH-4 | ★★★★★ |
| §LH-5 | ★★★★☆ |
| §LH-6 | ★★★★☆ |
| §LH-7 | ★★★★☆ |

### 8.2 题目详解

#### §LH-1 Iceberg / Hudi / Delta Lake / Paimon 四大表格式在 ACID、写模型和引擎生态上的核心差异是什么？一家中大型企业应当如何做选型？

**1. 考察点**

- 是否理解「表格式（Table Format）」是湖仓一层的**语义层**——把 Parquet/ORC 这种文件格式提升为具备 Schema、ACID、Time Travel 的「表」。这是判断候选人是否真正理解湖仓的关键。
- 能否说清四家各自的设计哲学（Netflix / Uber / Databricks / Alibaba-Flink 生态）背后的**取舍原点**，而不是只背特性对比表。
- 是否区分**写模型（COW / MOR / LSM）**与**主键索引**这两个最影响工程代价的维度，并把 CDC 场景、AI 场景、跨引擎场景对号入座。
- 加分项：能结合 Delta UniForm（2024）的「一份数据三协议」演进方向、Paimon 1.0 2024 毕业、Iceberg V3 规范的行级删除等 2024-2025 关键事件，谈**收敛趋势**而非四家并存。

**2. 参考答案框架**

**第一层：先回到「为什么需要表格式」这一原点。** 在 Parquet 上直接建 Hive 表时，任何一次写入都会重写分区目录、`MSCK REPAIR` 才会感知新文件、并发写会留下半成品文件——这是 2017 年前数据湖的常态。表格式的使命是**用一次原子提交换得跨引擎可读的快照**，所以考察底层一定要看「提交是原子的吗」以及「快照是 publisher 还是 transaction」。

**第二层：四家的设计原点对比。**

- **Apache Iceberg（Netflix / Apple 主导）**：设计原点是「让任何引擎都能安全读」。Catalog 与物理路径完全解耦，metadata 文件层级 `metadata.json -> manifest list -> manifest -> data file`。**写模型默认 COW**，Spark / Trino / Flink / StarRocks 全兼容，社区最广。**代价**是主键索引弱、依赖墨菲条（`MERGE INTO`）做 upsert，性能不如 Hudi MOR。
- **Apache Hudi（Uber 主导）**：设计原点是「CDC 主键 upsert」。Timeline + Record-Level Index 让 upsert 在 PB 级也能秒级完成，**MOR 默认**让写快读时合并。代价是 Flink 集成偏后、社区贡献者比 Iceberg 少。Uber 把 Hudi 用在 UberEats 的实时订单流，是 CDC 路线最深的工业案例。
- **Delta Lake（Databricks）**：设计原点是「Spark 之上最强 ACID」。Transaction Log（`_delta_log`）以 JSON+Parquet 维护，**Spark API 集成最深**，配合 Unity Catalog 与 Vector Search 形成 AI 一体化闭环。**代价**是 Flink 写入生态比较薄（2024 之前的痛点）；2024 年的 **Delta UniForm** 通过写一份 Delta 同时发布 Iceberg/Hudi 元数据开始回应这一问题。
- **Apache Paimon（Alibaba / Flink 生态）**：设计原点是「流批一体的 LSM 树」。LSM 让流式写入天然防小文件、Changelog Producer 输出变更流直接驱动物化视图增量刷新。代价是 Trino / StarRocks 的批端兼容性还在追赶。

**第三层：选型的四个真实约束。**

1. **引擎偏好**：Flink 为主线选 Paimon；Spark 为主线选 Delta；跨引擎 / Trino 联邦选 Iceberg。
2. **更新频率**：CDC upsert 密集（电商订单、用户画像）选 Hudi MOR；普通批处理 + 偶发 upsert 选 Iceberg / Delta。
3. **生态与人才**：选表格式就是选社区，建议优先选公司已有团队经验的；最差的选择是为了「先进性」换一个团队都不熟的格式。
4. **总拥有成本**：含 Catalog 选型（Hive Metastore / Glue / Unity Catalog / Polaris / Nessie）、Compaction 成本、跨云一致性。Netflix 公开数据显示 Iceberg 替代 Hive 后存储成本下降 60%、查询提升 5 倍，是工业最常被引用的 ROI 锚点。

**第四层：工程上的多格式共存现实。** 真实大厂往往**不止一种格式**：阿里用 Paimon 做实时入湖 + Iceberg 做离线主仓；字节 DataFinder 用 Paimon+Flink+StarRocks 跑秒级实时数仓；招行湖仓建设用 Iceberg 做统一底座、辅以 Hudi MOR 处理高频额度变更；Databricks 2024 推 Delta UniForm 试图用「一份 Delta 三协议读」抹平差异。

**第五层：2024-2025 的关键收敛信号。**

- **Delta UniForm（2024 SIGMOD 论文）**：写一次 Delta，下游可选 Iceberg / Hudi 协议读。
- **Iceberg V3 规范（2024）**：行级删除 + Variant 类型 + 向量类型，缩小与 Delta 的「能力差」。
- **Paimon 1.0 Apache 毕业（2024）+ Paimon 1.1（2025）**：LSM 调优、Changelog 增强，确认「流批一体底座」路线。

选型不再是非此即彼，而要回答「**主用谁、补位谁、互认层怎么搭**」。

**3. 常见陷阱**

- **把表格式与文件格式混为一谈。** 说成「Iceberg 是一种列式存储」直接 0 分——Parquet 才是列存，Iceberg 是它之上的元数据 + 表语义层。
- **只列差异不下结论。** 面试官问「如何选型」，只对比不说建议 = 没答。
- **忽略写模型的引擎成本。** 谈 MOR 不谈读时合并的代价，谈 COW 不谈写放大——容易显得没真做过。
- **把 Paimon 当成「中国版 Iceberg」。** Paimon 主战场是流批一体的 LSM 引擎，国内阿里内部已有规模化工业案例，但海外社区覆盖不及 Iceberg。
- **忽略 Delta UniForm 这种互认协议的趋势。** 2024 年后再讲「四家必须三选一」就显得过时。

**4. 追问预测**

- **「Delta UniForm 和 Iceberg V3 都是「一份数据多协议读」，它们解决的问题有何本质差异？」** 答：UniForm 是从 Delta 出发在 commit 时同步发出 Iceberg/Hudi 元数据，保持 Delta 写入主路径；Iceberg V3 是规范本身扩展（行级删除 + 向量），让任何对接 V3 的引擎天然支持新语义。前者解决**多协议互认**，后者解决**单协议能力上限**。
- **「Paimon 的 LSM 写模型和小文件治理是什么关系？为什么它被称作自然不产生小文件？」** 答：LSM 用追加写 + 后台 compaction 的天然结构，写入先落小文件，由后台线程合并成大文件，整个生命周期对小文件是「应收尽收」——Hudi / Iceberg 需要额外的 Compaction 调度（Paimon 几乎不用）。
- **「如果公司要求 5 年内不绑定单一厂商，技术栈怎么搭？」** 答：底座用对象存储 + Iceberg 协议；Catalog 用开源 Polaris 或 Nessie；引擎层用 Trino 做联邦查询；写端按场景拆分——CDC 走 Flink+Paimon、批走 Spark+Iceberg。这是「格式中立 + 引擎多元化」的最大公约数栈。
- **「华米欧薇大厂为什么不用 Delta Lake？」** 答：历史包袱（Spark 主导 vs Flink 主导）+ Delta 与 Databricks 商业版深度绑定 + 国内合规要求多云中立。当前国内主流是 Iceberg + Paimon + Hudi 三足鼎立，而非 Delta。

**5. 参考资料**

- Apache Iceberg 官方规范文档（v1 / v2 / v3）——表格式层级、清单文件、隐藏分区等概念的权威出处。
- Apache Hudi RFC-33 与 Timeline Server 设计文档（2024）——Uber 公开的 Hudi 1.0 架构演进。
- Delta Lake 官方文档及《Delta UniForm: One Storage, Multiple Protocols》SIGMOD 2024 论文。
- Apache Paimon VLDB 2024 论文《Paimon: A LSM Tree Based Stream-Batch Unified Table Store》。
- Netflix Technology Blog「Migrating to Iceberg at Netflix Scale」——PB 级 Hive→Iceberg 迁移的工程笔记。
- Uber Engineering「Hudi: Building Reliable Data Lakes at Uber」——增量 upsert 与 Timeline 的原始设计动机。
- Databricks《The Data Lakehouse》技术白皮书——「Lakehouse」概念的原始定义与架构哲学。
- **阿里云 MaxCompute + Paimon + Flink 一体化方案** —— Paimon 1.0 落地的国内官方背书。
- **字节跳动 DataFinder 实时湖仓** —— Paimon + Flink + StarRocks 实时 OLAP 的端到端案例。
- **招商银行湖仓一体建设** —— 用 Iceberg 统一底座、Hudi 补位高频额度变更的金融业实践。
- **微医医疗数据湖仓** —— 用 Iceberg + StarRocks 跑医保实时对账与 AI 影像特征检索。

---

#### §LH-2 湖仓一体架构如何做分层设计？Bronze / Silver / Gold（Medallion）分层的核心思想、工程落地要点与典型陷阱分别是什么？

**1. 考察点**

- 是否理解 Medallion 不是「一种约 定的格式」，而是**对数据加工链路的责任划分**——Bronze 原样、Silver 清洗、Gold 服务化。
- 能否说清三层在 **流批一体** 下的形态变化（不只是离线数仓的专属）。
- 是否区分「数据资产层（Bronze / Silver / Gold）」与「引擎层（Spark / Flink / Trino）」——很多团队把分层当物理分层挂在引擎上，做错了一次返工一个月。
- 加分项：能给出**衰减因子**（每层是上一层的百分之多少数据量）与**迟到数据 / 重处理策略**。

**2. 参考答案框架**

**第一层：Medallion 的原始定义。** Bronze / Silver / Gold 是 Databricks 在 Lakehouse 体系中提出的**数据资产分层**约定：

- **Bronze（青铜，原样层）**：从源系统原样落地的数据，**保留 schema 与历史**。CDC Binlog、日志、API 推送都直接落。任何 schema 变更在这里都不拒绝。
- **Silver（白银，清洗整合层）**：经清洗（去重、类型纠正、维度补齐）后的可重用的明细数据。这一层引入**业务主键与一致性维度**，开始具备下游复用的价值。
- **Gold（黄金，应用层）**：按业务场景聚合的结果，**面向报表 / API / 算法特征**。可能是一张聚合表、可能是一个物化视图、可能直接是向量库的输入。

**第二层：与 ODS/DWD/DWS/ADS 的对应关系。**

| 湖仓术语 | 数仓术语 | 职责 |
| --- | --- | --- |
| Bronze | ODS | 原样落地、可重算 |
| Silver | DWD/DWS | 清洗整合、维度补齐 |
| Gold | ADS | 面向场景的交付物 |

但湖仓相比传统数仓有三点不同：**Bronze 本身具备 Time Travel**（湖表元数据支持快照回溯，ODS 必须依赖全量重刷）、**Silver 不必等 Gold 跑完**（流式链路让清洗独立成链）、**Gold 可以直接是向量或特征**（AI 时代的额外消费者）。

**第三层：工程落地要点——五个关键决策。**

1. **每一层用不用同一种表格式？** 多数团队选择 Bronze 与 Silver 用 Iceberg/Paimon（适合增量 CDC 入湖），Gold 用 StarRocks/Doris（适合高并发查询）。**Databricks Unity Catalog 视角下三层都是 Delta**，差异在治理策略与生命周期。
2. **Bronze 是否要分区？** 必备分区，否则流式写入时单目录文件爆炸。建议按 `dt` 或事件时间分区，分桶按主键。
3. **Silver 怎么保证幂等？** 关键是主键合并（`MERGE INTO` / Paimon 主键 / Hudi upsert），并显式声明「迟到数据可以被重新打点」。
4. **Gold 是物理表还是物化视图？** 国内大厂多选物理表（写入控制在调度内）以获得稳定 SLA；Databricks 用 Delta Live Tables + Materialized View 做流式增量刷新，国内逐步追赶。
5. **三层的元数据是否要统一治理？** 必须——Unity Catalog / Polaris / DataHub 把三层作为一个「数据资产树」管起来，不要让每层各管各的。

**第四层：流批一体下的形态变化。**

- 流批一体的真正意思是**Bronze 与 Silver 之间的边界不再区分批流链路**，Flink 流式入湖 + Spark 批补全用同一份 Bronze；Spark 写 Silver 消费同一份 Bronze；Flink + Materialized View 实时刷新 Gold。
- Paimon 在这一场景有独特优势——它**天然是 LSM**，LSM 的 Changelog 流直接驱动 Silver → Gold 增量刷新，省掉「重算 Silver 用全量」的口径代价。

**第五层：典型陷阱。**

1. **Bronze 当中间表用。** Bronze 是「原样」 不是 「过程快照」，有人把 Bronze 当 ODS 用来做关联计算，三天后数据口径全乱。
2. **Silver 没有边界。** Silver 不是 DWS，不能在 Silver 大量聚合。**判断标准**：这层能不能用任一维度切分？不能就该下移到 Gold。
3. **Gold 被广泛共享却取名「ads_xxx」。** 一旦一张 Gold 表被多张报表共享，就退化成了「事实 DWS」，分层开始失效，建议上提到 Silver/中间层。
4. **忘掉了维度建模。** Gold 直接是聚合表，但仍然要承接 Silver 的一致性维度——这是 Kimball 的「一致性维度总线」原则在湖仓的延续，Databricks 的 Lakehouse 没有否定维度建模，只是把它挪到了 Gold 内。

**第六层：典型范式对比。**

| 范式 | 典型实践者 | 三层的实现细节 |
| --- | --- | --- |
| Delta Lake + Unity Catalog | Databricks、Databricks 客户 | 三层都是 Delta，Gold 用 DLT |
| Iceberg + Trino/Spark | Netflix、LinkedIn、招行 | Bronze/Silver Iceberg，Gold 转 StarRocks |
| Paimon + Flink | 阿里 DLF、字节 DataFinder | Paimon 跑 Bronze+Silver，StarRocks 跑 Gold |
| Hudi + Flink CDC | 美的、Uber 等 CDC 重场景 | Hudi MOR 跑 Bronze+Silver |

**3. 常见陷阱**

- **把分层当成物理表分目录。** 分层的本质是**责任划分**，不是「gold.db.xxx_table」。可以在一个 schema 内通过命名约定分层（`silver.fact_orders`、`gold.user_daily_gmv`）。
- **Bronze 立刻做字段标准化。** Bronze 一旦改变 schema 就丢掉了「源系统的样子」，CDC 链路回溯会断。标准化推迟到 Silver。
- **Gold 用 Hive 跑批。** 高频查询用 Hive/Spark 批做 Gold，查询延迟太高。Gold 的物理形态必须是 OLAP（StarRocks/Doris）或流式物化视图（Paimon + Flink）。
- **忘记迟到数据。** Bronze 必须显式声明可重处理，否则一份 CDC 重放会把 Silver 写两遍。
- **把 SCD 藏在 Bronze。** SCD 是 Silver 之后的工作，不要让它干扰 Bronze 的「原样落地」原则。

**4. 追问预测**

- **「为什么不要把 Gold 表直接对接 OLAP 引擎？『三层』会不会被 StarRocks 的物化视图吃掉？」** 答：不会。Gold 在湖仓语义层，OLAP 的物化视图是物理实现；Gold 可以是「逻辑定义 + 物化加速」，OLAP 物化视图只是承载它的形态之一。
- **「Silver 主键合并时上游数据延迟到达 1 天，怎么处理？」** 答：Bronze 必须带事件时间戳，Silver 用事件时间窗口 + late-arrival 容差；Hudi / Paimon / Iceberg 都支持「回填指定 snapshot」的能力，但**业务上必须有 SLA**——Silver 的重处理必须靠调度原子完成，不能依赖手跑。
- **「Gold 是用流式还是批式刷新更合适？」** 答：高频、低延迟诉求的用流式（Paimon Changelog / Flink + Materialized View）；可以 T+1 的用批（Spark + Iceberg + schedule）。商业项目通常两种并存：实时 Gold + 日终修正。
- **「三层之间的元数据怎么打通信任链？」** 答：使用 OpenLineage / DataHub 记录每条 Gold 字段的来源列 + 转换表达式；Unity Catalog 内置列级血缘是当前最完整的方案，国内用阿里 DataWorks / 字节 DataFinder 的血缘模块。

**5. 参考资料**

- Databricks《Refining Data in the Lakehouse with Bronze/Silver/Gold》——Medallion 原始定义与适用边界。
- 《大数据之路：阿里巴巴大数据实践》——OneData 体系下 ODS/DWD/DWS/ADS 与湖仓分层的对应。
- Apache Iceberg 官方文档「branch / tag / snapshot」章节——Bronze 流式入湖的回填与多版本能力。
- Apache Paimon Changelog Producer 文档——流批一体下的 Silver→Gold 增量链路。
- Netflix、LinkedIn、Databricks 等公开技术博客中的「Lakehouse 分层落地」经验帖。
- **Databricks Lakehouse 平台 + Unity Catalog** —— Medallion 配合 Unity Catalog 是商业实践最完整的范式。
- **阿里云 Data Lake Formation（DLF）+ Paimon** —— 国内 Paimon 流式三层架构的官方落地。
- **字节跳动 DataFinder 三层实时湖仓** —— Bronze 用 Paimon 流式、Silver 用 Spark 微批、Gold 用 StarRocks OLAP。
- **招行湖仓分层（Iceberg + StarRocks）** —— Bronze 原样、Silver 维度建模、Gold 直接上 StarRocks 做实时服务。
- **米哈游游戏日志三层（Kafka→Paimon→StarRocks）** —— 高 QPS 在线场景的三层压缩与查询加速。
- **美的工业数据三层（IoT→Hudi→Doris）** —— 工业时序场景 Bronze 用 Hudi MOR、Gold 用 Doris 实时 OLAP。

---

#### §LH-3 Hive Metastore / Unity Catalog / Polaris / Nessie 这几种 Catalog 在湖仓体系中各自承担什么角色？元数据治理为何决定了湖仓能否「跨引擎」？

**1. 考察点**

- 是否理解 Catalog 是湖仓的**「大脑」**——它存的不是数据，而是「数据在哪里、有什么 Schema、用什么版本」。Catalog 一倒，湖就瘫。
- 能否说清 Hive Metastore 的**历史遗产**与**当下瓶颈**（连接池 / 高可用 / 元数据膨胀）。
- 是否区分**行级权限**（Ranger / Lake Formation）与**Catalog 治理**（Unity Catalog / Polaris）——这是面试最常被考察的。
- 加分项：能把 2024 年 Polaris 开源、Unity Catalog 跨表格式这件事放进「数据资产编目权」之争的坐标系里。

**2. 参考答案框架**

**第一层：Catalog 到底管什么。** 湖表的物理文件都在对象存储上，引擎要读取它们，必须先查到三件事：**库表空间名、表对应的元数据文件位置、当前的最新 snapshot/版本**。Catalog 就是这张「表名到物理路径」的映射表——表面上只是一个 Thrift 服务或 REST API，实际上是整个湖仓的统一大脑。

**第二层：三种主流 Catalog 的本质差异。**

- **Hive Metastore（HMS）**：来自 2010 前的 RDBMS 时代，**基于 Thrift + RDBMS**。优点是与 Hive/Spark 深度集成、生态成熟、上手成本低。**代价**有三：① 没有原生的 Git-like 分支能力；② 没有原生的多表格式抽象（Iceberg/Hudi 都通过适配器桥接）；③ 元数据库（MySQL/Postgres）在大规模分区下成为瓶颈（10 万级分区就开始卡）。这是绝大多数国内公司从 Hive 迁移到湖仓时第一道坎。
- **Nessie**：来自 Dremio 的开源项目，**Git-for-data** 思想，Catalog 不仅存元数据，还提供**分支与标签（branch / tag）**能力。允许「在分支上修改表」，合并后切回主干——本质是把研发协同模式带进了数据建模。代价是生态覆盖还在追赶 HMS。
- **Unity Catalog（Databricks）**：商业血统，**在 Databricks 平台一体化落地**。2023-2024 年开源了核心代码，可以独立部署。它最大的优势是**跨表格式抽象 + 内置数据血缘 + 行级权限模型**——把 Hive 时代散在 Atlas + Ranger + Hive Metastore 的能力合并到一个治理面。
- **Apache Polaris（Snowflake 2024 开源）**：**REST Catalog** 路线，连接对象存储 + 多表格式。优势是**与 Snowflake Iceberg Tables 对齐**，多云中立。代价是 1.0 刚刚发，生态还在完善。

**第三层：为什么 Catalog 决定了「跨引擎」。** 同一份 Iceberg 表可以被 Spark 写、Trino 读、StarRocks 物化——前提是所有这些引擎**都连同一个 Catalog**。Catalog 一旦分裂（HMS 上 Spark 写了一份、Nessie 上另一份），数据就开始出现「两份真相」，湖仓的「一份数据多引擎」承诺就破了。这是 Unity Catalog、Polaris 这些新 Catalog 都把「跨引擎抽象」做成核心特性，而非附件的原因。

**第四层：与行级权限的关系。** Catalog 管的是「**有哪些表、表里有哪些列、谁是数据的来源**」，但**谁能看某一行**是另一个层次的事——它由 **Ranger / Lake Formation / Unity Catalog 内置权限** 承担。把这两件事混为一谈是常见误区。

**第五层：典型选型路径。**

- **从 Hive 平迁上来 + 单一引擎（Spark）**：用 HMS 是最低成本的选择，但**必须升级到 HMS 3.x 并做 HA + 连接池**。
- **跨 Spark / Trino / Flink**：HMS 可以撑，但要接受 REST 接口的取舍；Nessie 在三引擎都能识别的情况下是更好的选择。
- **Databricks 体系**：Unity Catalog 与平台深度绑定，跨表格式 + 血缘 + 权限一台全包。
- **多云中立 + Snowflake 已有投入**：Polaris（开源 REST Catalog）。
- **需要分支实验 + ETL 可重放**：Nessie 的 Git-like 能力几乎是唯一选择。

**第六层：2024 之后的演进。**

- **Unity Catalog 开源 + Delta UniForm** 让「一份 Delta、Iceberg/Hudi 读」成为可能，Catalog 成为治理交接点。
- **Polaris 1.0** 把「REST Catalog 即标准」往前推了一大步，预计 2025-2026 三家云（AWS / Azure / GCP）的云上湖仓服务都会对接。
- **Nessie / Lakehouse Federation** 开始支持外部源（Snowflake / BigQuery）接入，从「湖内 Catalog」向「跨源联邦」演进。

**3. 常见陷阱**

- **把 Catalog 当成「元数据库 + 一张表」。** 它必须提供 **ACID 接口、版本管理、跨表格式抽象**——背概念忘掉了这三个核心就成了「我用 MySQL 也可以」。
- **把 HMS 当无可救药的旧系统。** HMS 在 99% 的场景下仍可用，关键在 **HA、连接池、避免分区膨胀**。
- **混淆 Catalog 与血缘系统。** Catalog 不做血缘，DataHub / OpenLineage 做血缘——它们经常一起出现在架构图里，但是两个产品。
- **行级权限与 Catalog 混为一谈。** Catalog 管「在哪里」，权限管「谁能看」，架构错位会留下安全漏洞。
- **选型只看「开源还是商业」。** 应该先看**引擎栈**——Spark 主导选 HMS/Unity、跨引擎选 Nessie/Polaris。

**4. 追问预测**

- **「HMS 撑不住时如何做迁移？在线迁移还是切割迁移？」** 答：通常用**双写 + 切换**——新集群起 Nessie/Unity，旧表保留 HMS 只读，下游逐表切换；Icberg 表通过 `register_table` 命令把元数据接到新 Catalog，不用动物理数据。永远不要一次性 DDL 重导。
- **「Unity Catalog 开源后，跟商业版权限差距大吗？」** 答：核心元数据抽象已开源，但商业版有更强的跨工作区访问控制 + 集中审计；纯开源版可用，但企业级审计与 SSO 集成需要二次开发。
- **「如果 Iceberg 表存放在 AWS S3，Polar Catalog 部署在自建 K8s，会不会有跨云风险？」** 答：有。Catalog 必须与对象存储同地域，且建议使用 VPC 私链 + 密钥托管；跨云会引入明显的连接延迟与合规风险。
- **「Nessie 分支在生产环境到底有没有用？」** 答：在「实验性回填」与「ETL 修复」场景非常有用——把异常数据修复跑在分支上，验证合并后一次性生效，不污染线上表。

**5. 参考资料**

- Apache Hive Metastore 官方文档 + Cloudera / Hortonworks 的 HA 部署手册——传统 HMS 的工程基线。
- Project Nessie 官方文档及 Git-for-Data 论文——分支与合并在元数据层的实现。
- Databricks Unity Catalog 开源代码（GitHub）——跨表格式抽象与血缘模型的标准实现。
- Apache Polaris 1.0 release notes（Apache 2024-2025）——REST Catalog 标准化的关键节点。
- Netflix Technology Blog「Data Catalog and Discovery at Netflix」——亿级 Catalog 的工程权衡。
- LinkedIn DataHub 项目文档——血缘 + Catalog 的开源自建路径。
- **Databricks Unity Catalog 跨表格式治理** —— Delta + Iceberg + Hudi 统一编目的商业落地。
- **阿里云 Data Lake Formation（DLF）多 Catalog 联邦** —— 国内多账号 / 多地域下 Catalog 联邦的工程方案。
- **Snowflake Iceberg Tables + Polaris 开源版** —— 商业云数仓转向开源 Catalog 的关键一步。
- **招行湖仓治理平台** —— 基于 Unity Catalog 改良的内部数据目录 + 权限一体化。
- **LinkedIn DataHub** —— 联邦血缘 + 跨 Catalog 的开源自建案例，是当下 Catalog 治理最被工业界复制的范式。

---

#### §LH-4 Copy-on-Write（COW）与 Merge-on-Read（MOR）写模型的工作原理是什么？在 CDC 入湖与流批一体场景下，写模型的选择有什么样的工程取舍？

**1. 考察点**

- 是否能从「**写放大 vs 读放大**」的根上理解 COW 与 MOR，而不是背特性。
- 能否说清 Hudi 的 Timeline + Record Index、MOR 的 base file + log file、读时合并怎么实现。
- 是否能把 **Paimon 的 LSM 实现**与 Hudi MOR 的「读合并」做一个清晰映射。
- 加分项：能结合 Iceberg V3 的**行级删除（delete files）**展望 COW/MOR 的边界是否在融合。

**2. 参考答案框架**

**第一层：先回到写模型的本质。** 湖表的所有写最终都要落到 Parquet/ORC 这类不可变文件上，新数据可以 **覆盖旧文件**（COW）也可以 **追加合并**（MOR）。两种策略体现了「**写代价 vs 读代价**」的根本取舍——任何湖仓选型都是这两类的博弈。

**第二层：COW 的工作原理。**

- 任何 upsert 都触发**重写受影响的 base 文件**。一批 1000 行 upsert 进来，即使只动 5 行，也要把这 5 行所在的 Parquet 整文件重写。
- 写时复制把「重算」提前到写入期，所以读端**永远是最新基线文件**，查询性能接近「直接读 Parquet」。
- 代价：写放大极高（CDC 场景下写入量是变更量的 5-50 倍），小文件爆炸风险大，所以 COW 必须搭配 **Compaction 调度**。

**第三层：MOR 的工作原理。**

- upsert 时不重写 base file，而是把变更写入 **log file（Avro / Parquet delta）**，并维护一个**记录级索引**（record index）加速查询时定位。
- 读端查询需要做 **read-time merge**：定位 base file + 找到对应 log file + 按主键合并。
- 代价：读端要做合并，性能比 COW 略低；要靠 **Compaction** 定期把 log file 合并回 base file，否则 log file 数量爆炸。
- Hudi 是 MOR 工业实践的代表；Timeline 上的 `delta_commit` 与 `commit` 区分了「只写 log」与「合并回写 base」两种 commit 语义。

**第四层：Paimon 与 Hudi 的关键差异。**

| 维度 | Hudi MOR | Paimon LSM |
| --- | --- | --- |
| 索引结构 | Record Level Index（FLINK_STATE / Bloom） | 分桶 + 主键 SORTED |
| Compaction 调度 | Offline / inline / async 三种策略 | 后台自动 compaction |
| Changelog 流 | 不内置（要靠 Debezium） | 内置 Changelog Producer |
| Flink 集成深度 | 中 | 极深 |
| 跨引擎批读 | Spark / Trino 都支持 | Spark / Trino / StarRocks 追赶中 |

Paimon 本质是**把 LSM 树结构搬到了湖表**：写入先入 memtable，flush 成 level-0 文件，后台 compaction 合并到更高 level。这与 Hudi MOR 的「base + log」是殊途同归——都是为了用结构换写性能。

**第五层：场景化选型。**

- **全量重写（T+1 全量刷新）**：COW 即可，运维最简单。
- **CDC 高频小变更（订单状态、额度变更）**：MOR 性能优势明显，5-10 倍写放大削减。
- **低频大变更（用户画像夜间全量）**：COW 更省心，不需要每天手动 compaction。
- **流批一体实时入湖**：Paimon 的 LSM 是当下最优解——LSM 把 background compaction 自然化 + Changelog 让下游增量刷新成为可能。

**第六层：Iceberg V3 的「第三种」写模型。** Iceberg V3 引入**行级删除（Row-level Deletes / Delete Files）**，本质是**独立的 delete file + base file + read-time merge**——它在保留「读简单版」的同时允许流式高频删除。从这个角度看 Iceberg V3 也开始接受「读时合并」的代价以换取灵活，是 COW/MOR 边界融合的信号。

**第七层：工程师真正关心的「代价」。**

- **MOR 读时合并的代价**：在 compaction 不及时的情况下，单个查询要合并 5-10 个 delta 文件，可能引入 2-3 倍耗时——所以必须监控 `delta_file_count` 这一关键指标。
- **COW 的写放大**：CDC 业务单条变更的写入量是 5-20 倍原始记录大小，意味着存储与 IOPS 都会膨胀，必须评估对象存储的 PUT 限额。
- **Compaction 的「抖动」**：统一调度的 compaction 任务在 T+0 时段集中执行，反而可能跑输下游查询——一般推荐 **异步 compaction + 资源隔离**。

**3. 常见陷阱**

- **MOR 没有 compaction。** 很多团队配了 MOR 却忘了跑 compaction，几个月后查询越来越慢才意识到——log file 数量无止境增长。
- **COW 配 CDC 也能撑。** 答案能撑，但**代价巨大**，单条变更放大 5-20 倍，存储与写入吞吐都会被破坏。
- **把 Paimon 当 Hudi 的复刻。** Paimon 是 LSM 树，更接近 RocksDB / LevelDB 的工程结构；Hudi MOR 是「log + base」，调度逻辑不一样。
- **用 MOR 跑离线全量重算。** 全量刷新的场景不需要 MOR 的写优势，反而被读时合并拖累。
- **COW/MOR 选型一次定终身。** Iceberg V3（行级删除）+ Delta UniForm 让这件事可以**分场景混用**。

**4. 追问预测**

- **「MOR 的 compaction 该跑在什么时机？怎么避免影响在线查询？」** 答：推荐**内嵌调度 + 异步触发**——`hoodie.compact.inline` + `hoodie.compact.schedule.inline` 联合控制；或者用单独的「compactor」Spark/Flink 任务与查询任务跑在**不同资源池**；业界常见做法是引入 Flink 流跑的「compaction 任务」与查询解耦。
- **「Paimon 的 Changelog 流与 Debezium 的 CDC 是什么关系？」** 答：Debezium 是数据采集层（采 MySQL binlog 转换成 CDC 流），Paimon 是落地与消费层（落湖表后输出 Changelog）；两层可组合，即 Paimon 可以直接消费 Debezium，也可以消费 Flink CDC 的 canal/debezium-json。
- **「Iceberg V3 引入 delete files，是不是意味着 COW 时代结束？」** 答：不会。V3 的 delete files 让 Iceberg 同时具备 COW 的「简单读」与 MOR 的「高频删」——本质是从「单一写模型」演化为「按操作类型选择最优写模式」。
- **「10 亿级 CDC 数据量，MOR 一天攒 1 万个 delta 文件，怎么救？」** 答：**立刻手动 compaction** 把所有 delta 文件合并成 base；然后**调整 compaction 调度频率**到「每小时一次」；同步监控 `delta_file_count` 与 `read_time` 关系，建立自动扩容触发策略。

**5. 参考资料**

- Apache Hudi 官方文档「Table Types: COW vs MOR」——两种写模型的原始设计动机。
- Apache Paimon LSM 实现细节（VLDB 2024 论文与源码注释）——LSM 在湖表层的工程映射。
- Apache Iceberg V3 规范与「Row-Level Deletes」RFC——COW/MOR 边界融合的官方时间线。
- Delta Lake 官方文档中「Optimistic Concurrency」与「Z-Order」章节——商业产品的 Compaction 策略。
- Uber Engineering「Building Hudi's First Production MOR Use Case」——MOR 在 UberEats 实时订单的落地细节。
- **美的工业互联网 Hudi MOR 实践** —— 设备状态每分钟级变更，Hudi MOR 替代原 COW Hive 表后写入性能提升 10 倍。
- **招商银行额度变更实时入湖（Hudi MOR + Flink CDC）** —— 高频额度变更场景下的 MOR 调优经验。
- **字节跳动 DataFinder + Paimon LSM** —— Paimon 在流式入湖与实时 OLAP 一体的落地。
- **Netflix Iceberg V3 行级删除调研** —— V3 在流式更新场景下的早期生产案例。

---

#### §LH-5 在 PB 级数据规模下，湖仓如何用「增量处理（Incremental Processing）」替代「全量重算」，两者的工程代价比与正确性边界分别是什么？

**1. 考察点**

- 是否理解「**全量重算的隐性成本**」——并非「逻辑简单所以就用全量」，而是数据量线性增长后**计算资源 + 调度窗口**会成为天花板。Netflix 公开数据：Iceberg 迁移后查询提速 3-10x 就是因为把每日全量重算改为增量读。
- 能否区分**三种增量**：① 文件级增量（新增数据文件）② 主键级增量（CDC upsert 的 row-level diff）③ 表格式支持的 snapshot / changelog 增量（Iceberg V2 `append`/`overwrite`、`__delta__` 等）。
- 是否能把 **Flink CDC + 湖表增量读 + 流批一体存储** 串成一条链路，而不是只看引擎层。
- 加分项：能区分**端到端增量（end-to-end incremental）**与**单作业增量（per-job incremental）**的代际差异。

**2. 参考答案框架**

**第一层：先回答「为什么不要默认全量重算」。** 工业数据增长曲线是**线性增长**的——10 TB 涨到 100 TB 再涨到 1 PB，可能只用了 36 个月。但每日的**真实变更**只有 1-3%。全量重算意味着每天对 100% 数据做计算，但只有 3% 数据有变化——这中间的 97% 是浪费。在 PB 量级，这种浪费**直接表现为预算**。

**第二层：增量处理的三种实现路径。**

- **路径 A：CDC + 流式入湖 + 主键合并**——上游 MySQL 用 Flink CDC / Debezium 采集 binlog，落 Hudi/Paimon 湖表；下游 Spark 用 `MERGE INTO` 或 changelog 增量读，**只处理当天变更的记录**。
- **路径 B：表格式快照增量**——Iceberg V2/V3 支持 `incremental` between snapshot range，从 snapshotA 推到 snapshotB 之间新增的文件，**不依赖 CDC**；Spark 直接 `df.read.format("iceberg").option("start-snapshot", "3020192024xxxx")` 拿到增量文件集合。
- **路径 C：湖表 changelog 直接驱动下游**——Paimon 内置 Changelog Producer 持续输出 `+I / +U / -D` 流，下游 Flink 作业直接消费，**不需要 Spark 批重算**。

**第三层：端到端增量 vs 单作业增量。**

- **单作业增量**：仅在 ETL 链路的某一个环节使用了增量读取或写入。这是最常见的版本——能减少局部成本，但**端到端仍是「半增量半全量」**。
- **端到端增量**：从采集（CDC）→ 落湖（Iceberg/Paimon）→ 计算（Spark/Flink 增量读 + 增量物化）→ 服务（StarRocks 实时刷新或 Kafka changelog 推送）。Netflix、Uber、LinkedIn 都在做这件事——本质是把「每日全量重算」换成「实时增量 + 低频回填」。

**第四层：正确性边界——三个最容易踩的雷。**

1. **迟到数据。** 上游 CDC 链路中**事件时间 14 天前**的数据突然到达（典型场景：上游修复了 binlog 后重放）。全量重算天然能消化；增量链路必须**显式声明 late-arrival 窗口 + 主动回填策略**。Iceberg 的 `expire_snapshot` + 回写机制可以补，但需要治理工具支持。
2. **删除语义。** 增量链路是否处理 `-D`？很多人忘了处理删除语义，结果下游物化视图有「幽灵订单」。Paimon Changelog Producer 默认输出 `+I / -U / -D` 三态，下游必须正确订阅 `ALL` 而不是 `INSERT`。
3. **Schema 变更。** 上游加字段，增量链路必须**同时同步 schema** 而不仅仅同步数据。Iceberg 的 schema evolution 是隐式支持的（snapshot 内自带 schema），但下游消费增量文件前必须检查 schema 兼容。

**第五层：成本对比与典型 ROI。**

- Netflix：Hive → Iceberg，存储成本下降 60%、查询性能提升 5 倍（数据公开）。
- LinkedIn：Hudi 增量入湖替代每日全量重算，**资源消耗下降 70%**。
- Uber：Hudi MOR 替代传统 MapReduce 日全量，**单作业时长从小时级降到分钟级**。
- 国内某大厂（公开数据）：用 Iceberg + Flink CDC 替换原 T+1 全量，**日节省约 30 万核时**（具体数字行业有差，但量级可信）。

**第六层：增量处理落地的四道工序。**

1. **选表格式**：Iceberg（社区）和 Paimon（流批一体）是最佳候选，Delta / Hudi 也能做但有特定工程问题。
2. **接 CDC**：Flink CDC / Debezium 采集 binlog，落湖表时按主键合并。
3. **下游增量读**：Spark 用 `MERGE INTO` + Iceberg incremental read；Flink 用 changelog 流。
4. **回填链路**：保留一个周期（比如每日凌晨）跑一次小批回填对账，确保「昨天的增量链路没漏数据」。

**3. 常见陷阱**

- **把「增量读」等同于「不要全量」。** 增量读是省了一部分资源，但**回填链路必须保留**——纯增量太激进，会因为迟到数据 + 处理 bug 累积误差。
- **忽略 Schema 演进。** 增量链路最容易因为 schema 演进错位崩——上下 schema 不一致会让一行处理失败整批挂起。
- **删除语义被丢掉。** 只 upsert 不处理 -D，下游「幽灵记录」会引发业务事故。
- **回填窗口设计太激进。** 单批 1 小时窗口 + CDC 链路 14 天的 late-arrival 意味着回填链路必须能追上 14 天；窗口设计保守一点更稳。
- **只用 Iceberg 文件级增量，忘了 CDC。** 文件级增量省了 ETL 写入的 CPU，但**用户真正变更的数据**是 CDC；两者必须组合。

**4. 追问预测**

- **「Iceberg incremental read 与 Flink CDC 增量处理可以并存吗？」** 答：可以。Flink CDC 解决「上游到 Bronze」的增量；Iceberg incremental read 解决「Bronze 到 Silver」的增量；**两个增量跨层组合是工业最稳的链路**。
- **「Paimon Changelog 流如果丢失或重复怎么补救？」** 答：Paimon Changelog 默认有 **snapshot 幂等** + **状态后端持久化**；Flink 消费端启用 `exactly-once` sink 即可；如果真丢，依靠 `FOR SYSTEM_TIME AS OF` 从湖表回放特定 snapshot 重算。
- **「增量链路会不会让我们失去审计能力？」** 答：不会，反而得到更强的能力。湖表的 snapshot + 流处理的状态都自带审计；问题不是「能不能审计」，而是「如何让审计员看懂这些状态」——答案是 OpenLineage + DataHub。
- **「回填作业要保留多久历史？」** 答：建议**至少 7 天，最大 30 天**。7 天覆盖典型 late-arrival + 周末数据延迟；30 天覆盖大的回溯性变更。上限可以根据存储成本与业务需求调整。

**5. 参考资料**

- Apache Iceberg 官方文档「Incremental Read」——start-snapshot / end-snapshot 的标准语义。
- Apache Hudi「MOR + CDC」教程——CDC + Record-Level Index 在 PB 级场景的实战。
- Apache Paimon Changelog Producer 与「Stream-Batch Unified」文档——流批一体增量链路的实现。
- Flink CDC 官方文档（GitHub `apache/flink-cdc`）——MySQL/PostgreSQL/MongoDB 的 CDC 连接器。
- Netflix「Using Iceberg's Incremental Processing for Cost Reduction」——Netflix 公开的增量处理收益数据。
- Uber Engineering「Incremental ETL with Hudi」——Hudi 增量处理在 Uber 的实操。
- LinkedIn Hudi vs Hive 全量重算对比——公开的 ROI 数据。
- **Netflix Iceberg 增量处理（公开技术博客）** —— PB 级 Hive → Iceberg 增量替代全量的最大量级案例。
- **LinkedIn Hudi 实践（公开技术博客）** —— 70% 资源消耗下降的具体路径。
- **Uber Hudi MOR 增量入湖（公开技术博客）** —— UberEats 实时订单的全增量切换过程。
- **招商银行湖仓增量 ETL（Iceberg + Flink CDC）** —— 国内金融业增量化链路的标准流程。
- **字节跳动 DataFinder 端到端增量** —— 实时分层都走增量通道的工业实践。
- **米哈游游戏日志增量处理（Kafka→Paimon→StarRocks）** —— 游戏行业高 QPS 场景下的增量稳定化方案。

---

#### §LH-6 湖仓「存算分离」架构的本质是什么？对象存储 + Catalog + 多类计算引擎如何在松耦合下保证一致性、性能与可扩展性？

**1. 考察点**

- 是否理解「存算分离」与「存算一体」的本质差异——存算一体是「数据在哪计算在哪」，存算分离是「数据永远在对象存储上、计算可以任意起停」。
- 能否说清**一致性由谁负责**——是对象存储、Catalog、还是引擎？三者的责任边界。
- 是否理解**对象存储的语义不是文件系统**——最终一致性、S3 GET 的 `If-Match` / `If-None-Match` 等能力对湖表协议的影响。
- 加分项：能把云原生 K8s 上的 Spark Operator / Flink Operator 与存算分离的弹性优势串起来。

**2. 参考答案框架**

**第一层：存算分离的价值原点。** 传统数仓（如 Teradata / Oracle Exadata）走存算一体路线——计算节点同时挂本地 NVMe 存储，性能极佳，但**算力与存储不能独立扩缩容**。在云时代，业务波峰波谷比例常常 3-10 倍，**算力与存储按一比一部署**意味着大量浪费。湖仓的存算分离用对象存储承担「数据永久层」，让算力按需启停，用 Catalog 统一协调——这是**云原生数据栈的根假设**。

**第二层：三层架构的责任边界。**

- **对象存储（S3 / OSS / COS / GCS / MinIO）**：承担「数据落盘 + 高可靠 + 跨地域复制」。**不提供**原子写、文件锁、并发控制——这些都由上层协议承担。
- **Catalog**：承担「哪个表名对应哪一组文件 + 当前是哪个 snapshot」——是分布式协调的「事实表」。
- **计算引擎（Spark / Flink / Trino / StarRocks）**：承担「读 Catalog → 拉对象存储数据 → 计算」。引擎无状态、可以随时扩缩容。

这种分工让「**存不被算影响**」「**算不被存拖累**」「**Catalog 是唯一的协调点**」——三件事的相对独立正是云原生的红利所在。

**第三层：Catalog 在一致性上的核心作用。** 对象存储本身是最终一致的——S3 在 PUT 后**可能在毫秒到秒级才**让所有节点可见，且不提供读时锁。Catalog 通过**原子 commit 协议**弥补：

- **Iceberg 的 commit protocol**：所有写入完成后发起一次 `commit`，把新 manifest list 写入对象存储，并发引擎在 commit 时通过「乐观锁」检查「我要覆盖的 metadata.json 是否还是同一个版本」——若不是则回滚重试。这是著名的 **Iceberg concurrency model**。
- **Delta Lake 的 optimistic concurrency**：与 Iceberg 类似，但日志格式不同（`xxx.json`）。
- **Hudi 的 Timeline**：每一次 commit 都被记录在 Timeline 上，commit 之间的冲突由 Timeline Server 仲裁。

**第四层：性能优化的「分离代价」。** 存算分离的代价是**网络 I/O**——一次查询需要从对象存储拉多次数据，而对象存储的延迟通常在 10-50 ms 范围（即使 S3 Standard 也如此）。三条优化路径：

1. **本地缓存**：Spark 的 `spark.sql.iceberg.locality.enabled`、Trino 的 Hive Cache、StarRocks 的 Data Cache 都是把热数据缓存在计算节点的本地 NVMe。
2. **文件粒度优化**：把对象存储的请求粒度从「单行」变为「大文件」（128-512 MB 的 Parquet + ZSTD）。
3. **Compaction + Z-Order**：让查询只命中少数文件，减少 GET 次数。

**第五层：典型架构栈。** 不同企业的存算分离落地差异较大：

- **Netflix**：S3 + Iceberg + Spark/Flink + Trino/Pinot/Presto。S3 是统一存储层，Trino 是查询联邦。
- **Uber**：对象存储 + Hudi + Flink CDC + Spark。Hudi 在 Uber 深度集成对象存储。
- **Databricks**：S3 + Delta + Unity Catalog + Photon 引擎。商用 DBFS 抽象对象存储。
- **阿里云 DLF**：OSS + Iceberg/Paimon + Flink/Spark + Hologres/StarRocks。
- **招行**：自建 OSS 兼容存储 + Iceberg + Spark/Flink + StarRocks。
- **微医**：对象存储 + Iceberg + StarRocks + Milvus 向量查询（混部在统一 K8s 集群）。

**第六层：K8s 上的存算分离。** 存算分离 + K8s 是天然的搭档——Spark Operator、Flink Operator 让计算任务按 K8s Deployment 启停；持久层完全不在容器内，只通过对象存储协议访问。这种架构让**大促期计算资源 10 倍扩展**、非峰值期归零成为可能。

**3. 常见陷阱**

- **把对象存储当 HDFS 用。** HDFS 提供文件锁、append、short-circuit read；对象存储不提供——直接按 HDFS 思维设计湖仓会让并发冲突频发。
- **忽略数据本地性。** 存算分离不是「数据放在远端无所谓」，对象存储的 GET 延迟是真实成本，**热数据必须能进入本地缓存**。
- **把 Catalog 当可选项。** Catalog 倒了整个集群瘫。生产环境必须 HA + 监控 + 自动恢复。
- **用对象存储存小文件。** 每 GB 数万个文件就 S3 PUT/LIST 极限打爆——必须靠 Compaction + 文件粒度控制。
- **跨地域复制没设计。** 存算分离让「跨云」、「跨地域」成为可能，但同时也让「一致性地狱」成为可能；必须显式设计复制策略与 RTO。

**4. 追问预测**

- **「如果用 MinIO 替代 S3，Catalog 层和引擎层会受影响吗？」** 答：通常不影响。MinIO 提供 S3 兼容 API，对象存储语义不变；HMS/Unity/Polaris 都不依赖特定云厂商。但**强烈建议**配 S3 兼容模式而非 MinIO 的特定优化，否则跨云迁移会很痛。
- **「存算分离下，Catalog 数据库（RDBMS 部分）怎么 HA？」** 答：典型三层 HA ——① Catalog 服务无状态、可水平扩；② 后端 RDBMS 用主从或 RDS；③ 元数据对象存储与 Catalog 内部表分离，避免循环依赖。Unity Catalog / Polaris / Nessie 都给出 HA 参考部署。
- **「S3 List 操作慢慢变慢，怎么避免？」** 答：**避免依赖 List**——所有表格式都通过 manifest list / manifest file 直接定位文件，几乎不依赖对象存储 List；只有 name node 性能不佳时才退化到 List。监控 `slow_list_request` 指标。
- **「存算分离对实时查询意味着什么？」** 答：意味着实时查询要么接受 GET 延迟（秒级查询变 100-300ms 起步延迟），要么用 StarRocks / Doris 在本地缓存层承担实时性。StarRocks 的 Data Cache 实际上就是为了**在存算分离下还提供毫秒级查询**。

**5. 参考资料**

- 《Cloud-Native Data Engineering with Apache Iceberg》——存算分离在 Iceberg 上的完整工程范式。
- Netflix Technology Blog「Storage-Compute Decoupled Lakehouse」——Netflix 公开的存算分离演进路径。
- Uber Engineering「Disaggregated Storage with Hudi」——Hudi 在对象存储下的工程权衡。
- Databricks 《Lakehouse Platform Reference Architecture》——商业产品的存算分离白皮书。
- 阿里云 DLF 技术文档（OSS + Iceberg/Paimon）——国内云上的存算分离标准架构。
- AWS Lake Formation 官方文档——云原生湖仓的工程范式。
- **Netflix S3 + Iceberg + Trino 存算分离（公开技术博客）** —— PB 级数据下的三层松耦合案例。
- **Databricks Storage-Compute Decoupled Reference Architecture** —— 商业平台的存算分离实现细节。
- **阿里云 DLF + OSS + 多种表格式** —— 国内最完整的存算分离方案。
- **招行湖仓（基于 OSS + Iceberg + Spark/Flink）** —— 金融业自建对象存储兼容 + Iceberg 落地的实践。
- **Snowflake 多云存储层（Snowflake Iceberg Tables + S3/Blob/GCS）** —— 跨云对象存储的标准做法。

---

#### §LH-7 在 AI 时代，Lakehouse 如何承载向量 / RAG / 训练数据管理？Time Travel、Schema Evolution 在 AI 场景下被赋予了哪些新的角色？

**1. 考察点**

- 是否理解 AI 时代数据需求的**三个新特征**：① 多模态（结构化 + 文本 + 图像 + 向量）；② 可追溯（训练数据可重现 / 数据血缘保留 / 可解释）；③ 高频演进（schema 反复变、embedding 模型迭代）。
- 能否说清 Iceberg V3 的 Variant / Vector 类型、Paimon 的 Changelog 在 RAG 中的角色。
- 是否能把 **Lakehouse → 向量库 / 特征平台 / Agent 平台** 的连接讲清楚——这是 2024-2025 一线架构师高频题。
- 加分项：能把 LanceDB / Delta Vector Search / Snowflake Cortex 这类「向量能力嵌入表格式」的产品放进地图里。

**2. 参考答案框架**

**第一层：AI 时代数据需求的根本变化。** 传统数仓服务 BI 报表，写入少、查询多；AI 服务**训练 + 推理 + RAG**，数据流是**训练数据回溯 + 推理上下文检索 + 反馈回流**。三件事共同要求：

- 训练数据**可重放**（同样的输入，同样的参数，可重现实验）——**Time Travel 必备**。
- 推理数据**不被污染**（实时数据进来不能污染训练集）——**分支（branch）能力**。
- 特征 / Embedding**与原数据同源**（避免数据复制导致漂移）——**湖仓一体化**。
- Schema / 模型**快速演进**（新模型上线 schema 全变）——**Schema Evolution**。

**第二层：Lakehouse 的三件原生能力 — Time Travel、Schema Evolution、Hidden Partitioning — 在 AI 场景的新角色。**

- **Time Travel**：训练数据按「特定 snapshot」回放。比如 2025-01-15 的 Iceberg 表 + 当时的向量索引，可以重放训练。这让模型可重现可审计，**直接对应监管对 AI 的可解释要求**（欧盟 AI Act / 国内生成式 AI 管理办法）。
- **Schema Evolution**：Embedding 模型从 bert-base 到 text-embedding-3 输出维度从 768 变 1024，Iceberg 的 schema evolution 允许「列类型变更」+ 「新列加入」而不破坏下游；Paimon 通过 LSM 自动处理新维度。
- **Hidden Partitioning**：训练时按「事件时间分区」「用户分桶」自动剪裁，**海量训练数据可秒级定位**。

**第三层：向量能力的嵌入路径。**

- **路径 A：向量外挂**——湖仓存结构化，向量库（Milvus / LanceDB / Pinecone）存 Embedding。**代价**：双存储、双写入、双删除。
- **路径 B：Iceberg V3 Variant / Vector 类型**——Iceberg V3 在 2024 引入 Variant 与向量类型原生支持，可以把 Embedding 与原数据放在同一份表里。**目前**（截至 2025）尚在早期阶段，但方向明确。
- **路径 C：LanceDB 模式**——LanceDB 设计为「AI 原生列式存储」，结构化 + 向量 + 文本统一在一份文件里。与 Iceberg / Delta 互补，常作为湖仓的「向量旁路」。
- **路径 D：Delta Vector Search**——Databricks Unity Catalog 内置向量检索能力，背后是 Lance + 高效 ANN 索引；这是当前最商业落地的方案。

**第四层：RAG 链路上的 Lakehouse 位置。**

- 原始文档 / Chunks：**Bronze**（落 Iceberg/Paimon）→ 文本切分 → 存向量（Sidecar 或主存）。
- Embedding 计算：**Silver**（Flink 流式 / Spark 批式）→ 写回湖表 + 写向量索引。
- 检索时：检索向量索引 → 拿到 `chunk_id` → 回到湖表读原始文本 → 入 prompt → 进 LLM。
- 这一切都在**同一份 Bronze 数据**上发生——避免了传统「向量库独立、数据复制多份」的痛点。

**第五层：训练数据管理的工程诉求。**

- **可追溯**：哪个 snapshot 进过哪个模型版本？回答这个问题的方法是把 Iceberg snapshot + 模型版本号一起存进模型仓库（MLflow / Weights & Biases）。
- **可复现**：训练任务启动时显式记录 Iceberg snapshot ID，回放时取同样 snapshot 即可重跑。
- **可治理**：训练数据中是否含敏感信息？需要把 PII 标记作为湖表 schema 的一部分，**训练前过滤**。
- **可反馈**：用户点过否决的样例要回流训练集，需要 Iceberg 的 branch 能力（不影响训练主分支）。

**第六层：典型工业落地。**

- **Snowflake Cortex + Iceberg Tables**：让结构化数据具备 LLM 函数能力，文本生成 + 向量检索 + Cortex Search 一台全包。
- **Databricks Unity Catalog + Vector Search + AI Functions**：把模型版本、训练数据、向量索引统一治理。
- **阿里 PAI + Paimon**：把训练任务与湖表落 Atomic 关联；模型上线与 Iceberg snapshot 强一致。
- **招行 AI 中台 + Iceberg + Milvus**：把湖仓作为「特征 + Embedding + 训练语料」统一底座。
- **微医医疗 AI 数据**：医学影像、诊断文本、Embedding 全部走 Iceberg + 向量外挂；Time Travel 让模型可重现。

**3. 常见陷阱**

- **把向量与湖仓当作两个独立系统。** 这样会让数据反复复制，索引同步成本巨大；应当追求「**同源存储 + 多种索引**」。
- **Time Travel 永远不清理。** 训练数据的可重放要求历史保留，但**无限保留**会让存储爆炸；合理做法是按任务级别设保留期（如 90 天）。
- **Schema Evolution 不规范。** AI 场景最常见的 schema 演进是 embedding 维度变更，必须**严格用安全变更**——`int → bigint` / `array<float>` 加列，不做不兼容变更。
- **RAG 链路把原文本丢了。** 很多人只存 Embedding 不存原文本，导致「为什么召回这个 chunk」无法回答。**Bronze 必须原文本与 Embedding 都保留**。
- **LLM 生成的标注回流没有治理。** LLM 标的数据会污染训练集——必须分支上做实验，验证后再合并到主分支。

**4. 追问预测**

- **「RAG 召回准但溯源说不清楚，怎么解决？」** 答：在 Bronze 阶段保留**原始 chunk 与 chunk_id** 的对应关系，Iceberg 索引主键就是 chunk_id；向量检索拿到 chunk_id 后回查 Iceberg 拿原文，**双向可解释**。
- **「Embedding 模型频繁升级，向量索引如何重建？」** 答：避免「全量重建」，采用**双写 + 切流**——新模型向 Iceberg 新列写新 Embedding，下游检索用同一 chunk_id 取不同 Embedding；观测质量确认稳定后切到新列，旧列 expire snapshot。
- **「Iceberg V3 向量类型能用了吗？」** 答：能用，但生态还在追赶。2025 年早期阶段建议**Iceberg 存文本 + 旁路向量库**为主；Vector 类型用作长期演进方向。
- **「训练数据合规审计怎么设计？」** 答：把 PII 字段标记为「敏感」列；湖表权限层（Unity Catalog / Lake Formation）按列授权；训练任务启动前由权限服务**断言「当前 session 没有 PII 可见性」**；Time Travel 给审计员回放能力，让合规检查可重现。

**5. 参考资料**

- Apache Iceberg V3 规范（2024）与「Variant / Vector Type」RFC——表格式原生支持向量类型的官方时间线。
- LanceDB 官方文档与 GitHub——多模态列式存储 + ANN 索引的工业级实现。
- Databricks「Unity Catalog for AI/ML」白皮书——Lakehouse + AI Functions + Vector Search 的一体化范式。
- Snowflake Cortex + Iceberg Tables 官方文档——商业云数仓的 AI 原生演进。
- Apache Paimon VLDB 2024 论文及 Changelog 在 RAG 中的应用章节。
- OpenLineage + DataHub 的 AI 治理模块——AI 场景下血缘与可重现性的开源工具集。
- **Databricks Vector Search + Unity Catalog** —— 商业 Lakehouse + 向量检索的一体化案例。
- **Snowflake Cortex + Iceberg Tables + Snowpark Container** —— 商业云数仓的 AI 化完整路径。
- **阿里 PAI + Paimon 训练数据管理** —— 国内 AI 平台 + 湖仓的标准化范式。
- **LanceDB 与 Iceberg 的工程化连接** —— 主流的「湖仓 + 向量外挂」开源路径。
- **招行 AI 中台 + Iceberg + Milvus（侧挂向量库）** —— 金融业 AI 中台的典型双存储范式。
- **微医医疗 AI 数据（Iceberg + 向量库 + Time Travel）** —— 医疗行业合规 + 可重放 + 向量召回的代表性场景。
- **永辉零售 AI 推荐（Paimon 流式 + 向量库）** —— 零售 AI 推荐的湖仓与向量侧挂。
- **米哈游智能 NPC 训练数据（Iceberg Time Travel 重放）** —— 游戏行业 AI 数据可重放的真实案例。

### 8.3 本章小结

本节收录 7 道题，覆盖湖仓一体的七个核心横切主题：表格式对比与选型、分层架构、Catalog 治理、写模型取舍、增量处理、存算分离、AI 原生演进。七道题构成一条从「**选谁**（LH-1）→**怎么落**（LH-2/3）→**怎么写**（LH-4）→**怎么算**（LH-5）→**怎么放**（LH-6）→**怎么用 AI**（LH-7）」的下钻链路，正好覆盖一名湖仓架构师从入门到面试表达所需的全套心智模型。

**通用答题心法**：

- 先答**取舍**（为什么这么选），再答**特性**（有哪些能力），不要背对比表。
- 必引用至少 1-2 个工业案例（Netflix / Uber / Databricks / Snowflake / 阿里 / 字节 / 招行 / 微医 等），证明你触过真实系统。
- 必说**代价**，任何技术选型都有代价，只讲优点是低分答案。
- 必看 2024-2025 的进展：Iceberg V3、Paimon 1.0、Delta UniForm、Polaris 1.0——这些是当下及未来一年的高频考点。

### 8.4 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
