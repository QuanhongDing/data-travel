# 离线计算（Offline Compute）

> **一句话定位**：以 Spark / Hive / Presto / DuckDB 为核心的批量数据处理引擎，是企业 T+1 数据产出的主力算力。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**08 离线计算**）。覆盖 **R4 数据全栈协同** 能力领域中「离线计算引擎、批处理优化、DuckDB 等新趋势、AI 时代演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 离线计算 vs 实时计算的本质区别？ | §1.1 |
| Hive / Spark / Presto / Trino / DuckDB 怎么选？ | §7.1 |
| Spark 3.5+ / 4.0 有哪些 2024-2025 新特性？ | §5.4；成熟度与机制见 §5.1 表、§5.2.1 |
| 数据倾斜怎么治理？ | §4.2 |
| DuckDB 为何成为 2024 AI 时代新宠？ | §5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：离线计算（Offline Compute / Batch Processing）是一种**对全量数据进行批量处理、产出延迟为分钟级到天级**的计算范式。它强调**准确性优先、吞吐量优先**。

**工程定义**：在数据架构师手里，离线计算是**一份以 Spark / Hive / Presto 为核心、对 PB 级数据进行 T+1 批量产出**的处理能力。核心特征：

- **全量数据**：处理历史全量数据（vs 实时增量）。
- **高吞吐**：单作业处理 TB-PB 级数据。
- **强准确**：以最终一致性为准、产出准确结果。
- **成本敏感**：长时运行、需优化成本。
- **延迟较高**：分钟级到天级（vs 实时秒级）。

**与实时计算的本质区别**：

| 维度 | 离线计算 | 实时计算 |
| --- | --- | --- |
| 数据范围 | 全量历史 | 增量 + 近期窗口 |
| 延迟 | 分钟级 - 天级 | 毫秒 - 秒级 |
| 准确性 | 最终一致 | 近似（窗口聚合） |
| 资源使用 | 长时间占用 | 持续运行 |
| 适用场景 | 报表 / 全量分析 / AI 训练 | 实时监控 / 实时推荐 / 风控 |
| 引擎 | Spark / Hive / Presto / Trino / DuckDB | Flink / Spark Streaming / Kafka Streams |

### 1.2 为什么需要

**业务驱动力**：

- **T+1 报表**：传统企业的核心数据产出。
- **AI 训练**：模型训练需要全量历史数据。
- **历史分析**：年度复盘、合规审计。
- **数据冷备**：离线全量备份 + 实时增量。
- **多维分析**：复杂多表 JOIN / OLAP 查询。

**痛点（没有离线计算的代价）**：

1. **数据无法 T+1 产出**：业务等不到数据。
2. **AI 训练无法进行**：没有全量历史数据。
3. **历史分析缺失**：无法做年度复盘。
4. **实时成本高**：所有业务上实时，成本爆炸。

**AI 时代的新诉求**：

- **训练样本准备**：AI 训练需要批量 ETL。
- **Embedding 批量生成**：离线计算大规模文本 Embedding。
- **特征回填**：历史特征批量计算。
- **数据复现**：Time Travel + 离线计算复现数据。

### 1.3 在 AI 时代数据架构中的位置

```
[数据湖 / 数据仓库]
        ↓
[离线计算：Spark / Hive / Presto / DuckDB]
        ↓
[DWS / ADS / 特征库 / 训练样本]
        ↓
[BI / AI / Agent]
```

**离线计算是数据栈的"主力算力"**：承担 80% 的数据加工任务。

### 1.4 演进历程

**第一阶段：MapReduce（2006-2014）**

- 2006：Google 发表 MapReduce 论文。
- 2008：Hadoop 1.0 开源。
- 2010：Hive 出现（SQL-on-Hadoop）。
- 2012-2014：MapReduce 主导，资源调度 YARN。

**第二阶段：Spark 时代（2014-2020）**

- 2014：Spark 1.x 成熟，替代 MapReduce。
- 2016：Spark SQL + DataFrame + Catalyst。
- 2018：Spark Structured Streaming 2.x。
- 2020：Spark 3.0 + Adaptive Query Execution（AQE）。

**第三阶段：联邦查询与多引擎（2018-2022）**

- 2018：Presto 社区分叉出 PrestoSQL（2020 年更名为 Trino）。
- 2019-2020：PrestoSQL 发布首个独立 release，联邦查询的社区主线转向这一支。
- 2021：Spark 3.x、Trino 400+。

**第四阶段：AI 原生与内嵌 OLAP（2022-至今）**

- 2023：Spark 3.5+、Trino 420+。
- 2024：Spark 4.0 路线图、DuckDB 1.0 发布（内嵌 OLAP）。
- 2025：AI 原生计算（LLM 驱动的 Spark 调优）进入议题讨论；按 §5 判据仍属观望档（L3，记录即可，不要在架构里为它预留假设）。

**一句话总结**：**离线计算从"MapReduce"→"Spark 革命"→"联邦查询"→"AI 原生 + 内嵌 OLAP"四阶段演进，今天 Spark + DuckDB + Trino 三足鼎立。**

---

## 2. 核心原理

### 2.1 关键概念定义

**Spark Core**：

- **RDD（Resilient Distributed Dataset）**：弹性分布式数据集。不可变、分区、可并行计算。
- **DAG（Directed Acyclic Graph）**：有向无环图。Spark 作业的执行图。
- **Stage**：DAG 中的阶段。Shuffle 划分 Stage。
- **Task**：Stage 中的具体执行单元。

**Spark SQL**：

- **DataFrame**：带 schema 的分布式数据集。
- **Dataset**：类型安全的 DataFrame（Scala / Java）。
- **Catalyst Optimizer**：Spark SQL 的查询优化器。
- **Tungsten**：Spark 的执行引擎（内存管理、CodeGen、向量计算）。

**Hive**：

- **HQL（HiveQL）**：Hive 的 SQL 方言。
- **Metastore**：Hive 的元数据服务。
- **执行引擎**：MapReduce / Tez / Spark。

**Presto / Trino**：

- **Coordinator**：Trino 协调节点（接收查询、规划、分发）。
- **Worker**：Trino 工作节点（执行 Task）。
- **Connector**：Trino 的数据源连接器（Hive / Iceberg / Kafka / MySQL）。

**DuckDB**：

- **内嵌 OLAP**：类似 SQLite，进程内运行。
- **向量化执行**：列式 + 向量。
- **Morsel 驱动执行**：单机内多核并行；不含多机执行组件（扩展轴见 §7.3.3）。

**Tez**：

- **DAG 执行框架**：比 MapReduce 更高效。
- 适用：Hive on Tez。

**数据倾斜（Data Skew）**：

- 部分 Task 处理数据远多于其他 Task。
- 导致：长尾 Task、作业慢、内存溢出。

**Shuffle**：

- 数据在节点间重新分布。
- 是 Spark / Hive 的最大性能瓶颈。

**小文件问题**：

- 大量小文件（KB 级）。
- 启动开销 > 处理时间。

### 2.2 数学 / 形式化基础

**Spark 作业执行模型**：

```
DAG = (Vertices, Edges)
Vertices = Stages
Edges = Shuffle Dependence
Stage = {Task_1, Task_2, ..., Task_n}
Task = Partition Processing
```

**RDD Lineage（血缘）**：

- 每个 RDD 记录其父 RDD + 转换算子。
- 容错：丢失分区时根据 Lineage 重新计算。

**AQE（Adaptive Query Execution）原理**：

- 运行时收集统计信息（Stage 完成后）。
- 动态调整：Join 策略、Partition 数、Shuffle 分区数。
- **效果**：减少 Shuffle + 优化 Join 顺序。

**Catalyst 优化器的代价模型**：

```
Cost(plan) = α × I/O + β × CPU + γ × Network
```

CBO 根据统计信息（行数、基数、NDV）选择最低代价计划。

**DuckDB 向量化执行的数学原理**：

- 一次处理 1024-8192 行（batch）。
- SIMD 指令 + 列存 + CPU 流水线。
- 加速比：5-20x。

### 2.3 关键算法 / 方法

**1. Spark RDD 编程**：

```python
# PySpark RDD
rdd = sc.textFile("hdfs:///data/orders")
pairs = rdd.map(lambda line: (line.split(",")[0], int(line.split(",")[1])))
result = pairs.reduceByKey(lambda a, b: a + b)
result.saveAsTextFile("hdfs:///data/output")
```

**2. Spark SQL + DataFrame**：

```python
df = spark.read.parquet("s3://lake/orders")
df.filter("amount > 0") \
  .groupBy("user_id") \
  .agg({"amount": "sum", "order_id": "count"}) \
  .write.parquet("s3://lake/user_summary")
```

**3. Catalyst 优化器**：

- **逻辑计划**：解析 → 分析 → 优化。
- **物理计划**：根据代价选择执行策略。
- **代码生成**：Tungsten 生成 JVM bytecode。

**4. AQE（Adaptive Query Execution）**：

```sql
-- 开启 AQE
SET spark.sql.adaptive.enabled = true;
SET spark.sql.adaptive.skewJoin.enabled = true;
SET spark.sql.adaptive.coalescePartitions.enabled = true;
```

**5. 数据倾斜治理**：

- **两阶段聚合（Salting）**：随机前缀 + 局部聚合 + 全局聚合。
- **广播 Join**：小表广播到大 Task。
- **过滤倾斜 Key**：先过滤后聚合。
- **自适应分区**：AQE 自动调整。

**6. DuckDB 内嵌分析（2024 新趋势）**：

```python
import duckdb

# 直接读取 Parquet 分析
result = duckdb.query("""
    SELECT region, SUM(amount) AS gmv
    FROM read_parquet('s3://lake/orders/*.parquet')
    GROUP BY region
""").to_df()
```

**7. Trino 联邦查询**：

```sql
-- Trino 跨源查询
SELECT *
FROM hive.sales.orders o
JOIN mysql.crm.customers c ON o.user_id = c.id
WHERE o.dt = '2025-01-01';
```

### 2.4 与相邻概念的关系

**离线 vs 实时**：见 §1.1。

**离线 vs 交互式查询**：

- 离线：定时跑批，产出 T+1。
- 交互式查询（OLAP）：Ad-hoc 即席查询，Doris / StarRocks / Trino。

**Spark vs Hive**：

- Hive：HQL + 翻译为 MR/Tez/Spark。
- Spark：通用计算引擎，原生 DataFrame。

**Spark vs Flink**：

- Spark：批为主（Structured Streaming 流处理较弱）。
- Flink：流为主（批处理也能做）。

**Presto vs Trino**：

- Presto（已停滞）：原 Facebook 项目。
- Trino（2020 年更名）：社区分叉后主导。

**DuckDB vs Spark**：

- DuckDB：单机 / 嵌入 / AI 场景。
- Spark：分布式 / 大数据场景。

> 💡 **思考锚点**：按 §2.4 的「DuckDB vs Spark」边界先量一道题——你要分析的那份 Parquet 单机内存装得下吗？装得下就按 §2.3 用 DuckDB 内嵌直读，省掉一整条分布式作业；装不下再看 Spark 作业是不是卡在倾斜上——你开了 `spark.sql.adaptive.skewJoin.enabled` 吗，还是还在手搓 Salting 随机前缀？

---

- [§3. 设计模式与范式](08-offline-compute-section-3-sec3.md)
- [§4. 工程实现](08-offline-compute-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](08-offline-compute-section-5-ai.md)
- [§6. 落地实践](08-offline-compute-section-6-sec6.md)
- [§7. 与其他方法对比](08-offline-compute-section-7-sec7.md)
- [§8. 面试真题集](08-offline-compute-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](08-offline-compute-section-3-sec3.md)
- [§4. 工程实现](08-offline-compute-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](08-offline-compute-section-5-ai.md)
- [§6. 落地实践](08-offline-compute-section-6-sec6.md)
- [§7. 与其他方法对比](08-offline-compute-section-7-sec7.md)
- [§8. 面试真题集](08-offline-compute-section-8-sec8.md)

---
