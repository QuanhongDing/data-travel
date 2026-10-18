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
| Iceberg V3 / Paimon 1.0 有哪些 2024-2025 新特性？ | §5.1 表、§5.4 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**（Databricks, 2020）：Lakehouse 是一种**结合数据湖的低成本 / 开放存储与数据仓库的 ACID 事务 / Schema 治理** 的新型数据架构。它通过**开放表格式（Open Table Format）** 在数据湖之上提供类数仓的强一致性、Schema 演进、时间旅行等能力。

**工程定义**：在数据架构师手里，Lakehouse 是**一份以对象存储为底座、以开放表格式（Iceberg / Hudi / Delta / Paimon）为语义层、可同时服务 BI 查询与 AI 训练的统一数据资产**。它的核心特征：

- **一份数据，多种引擎**：同一份 Iceberg 表，Spark / Flink / Trino / StarRocks 都可读写。
- **ACID 事务**：跨引擎的强一致性，避免数据湖的"小文件 / 部分写"问题。
- **Schema Evolution**：列增删改不断链，下游兼容。
- **Time Travel**：快照回溯，可查询任意历史时刻。
- **Hidden Partitioning**：用户不感知分区细节，自动剪裁（Iceberg 特性；Hudi / Delta 用显式分区列，无等价物）。
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
- **向量原生支持**：Iceberg、Paimon 一类表格式都在向「把向量变成湖表的一列」演进；规范里到底有没有向量类型，须回各自的规范类型章节核对（见 [§5.1](03-lakehouse-section-5-ai.md)）。
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

- 2017：Uber 开源 Hudi，针对更新密集场景。
- 2018：Netflix 开源 Iceberg（前身），解决 Hive 表的事务问题。
- 2019：Databricks 开源 Delta Lake，提出“Open Table Format”思想。

**第二阶段：三国杀形成（2020-2022）**

- 2020：Databricks 提出 Lakehouse 概念。Iceberg 毕业为 Apache 顶级项目。
- 2021：Iceberg 1.0、Hudi 0.10。表格式大战开始。
- 2022：Apache Paimon（前 Flink Table Store）进入战场，主打流批一体。
- **2022-2023**：社区分裂——Delta 偏 Databricks、Iceberg 偏 Trino/Snowflake、Hudi 偏 Uber、Paimon 偏 Flink。

**第三阶段：标准化与生态整合（2023-2024）**

- 2023-2024：Snowflake 推出 Iceberg Tables，三大云厂商全部支持 Iceberg（该年份本书内两处口径不一，记 2023 与 2024 两种，以 Snowflake 官方发布说明为准）。
- 2023：Delta UniForm 随 Delta Lake 3.0 公布（一份 Delta 数据支持 Iceberg / Hudi 读取；出处见 §5.4，该能力不是会议论文）。
- 2024：Apache Paimon 1.0 毕业，进入 Apache 顶级项目。
- 2024：Iceberg V3 规范发布，在 v2 已有的行级删除之上加入删除向量、增量读取与 Variant 类型。

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

**Hidden Partitioning**：Iceberg 中，用户用业务字段（如 `order_time`）查询时，表格式自动按底层分区（如 `days(order_time)`）剪裁文件，用户无需感知（这是 Iceberg 的特性，Hudi / Delta 无等价物）。

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
| Schema 演进 | 强 | 强 | 强 | 强 |
| 流式写入 | 中 | 强 | 中 | 极强 |
| Flink 集成 | 中 | 中 | 中 | 极强 |
| 2024-2025 状态 | V3 规范（删除向量 / Variant） | 1.0 稳定 | Delta UniForm | 1.0 毕业 |

> 💡 **思考锚点**：把你的表格式代回 §2.4 那张对比表，数三个格——写模型是 Copy-on-Write 还是 LSM、主键索引落在「弱 / 中 / 强」哪一档、流式写入是「中」还是「极强」。若你的场景是高频增量更新、这三格却都落在中低档，本节那句「Lakehouse 是数据湖的升级版」对你还成不成立，你打算先补哪一格？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§2. 核心原理（深度版）](03-lakehouse-section-2-deep-principles.md)
- [§3. 设计模式与范式](03-lakehouse-section-3-sec3.md)
- [§4. 工程实现](03-lakehouse-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](03-lakehouse-section-5-ai.md)
- [§6. 落地实践](03-lakehouse-section-6-sec6.md)
- [§7. 与其他方法对比](03-lakehouse-section-7-sec7.md)
- [§8. 面试真题集](03-lakehouse-section-8-sec8.md)

---
