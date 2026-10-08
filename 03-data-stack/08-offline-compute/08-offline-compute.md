# 离线计算（Offline Compute）

> **一句话定位**：以 Spark / Hive / Presto / DuckDB 为核心的批量数据处理引擎，是企业 T+1 数据产出的主力算力。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**08 离线计算**）。覆盖 **R4 数据全栈协同** 能力领域中「离线计算引擎、批处理优化、DuckDB 等新趋势、AI 时代演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 离线计算 vs 实时计算的本质区别？ | §1.1 |
| Hive / Spark / Presto / Trino / DuckDB 怎么选？ | §7.1 |
| Spark 3.5+ / 4.0 有哪些 2024-2025 新特性？ | §5.3 |
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
- **延迟较高**：分钟级到小时级（vs 实时秒级）。

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

- 2018：Presto 拆分出 Trino。
- 2019-2020：Trino 主导联邦查询。
- 2021：Spark 3.x、Trino 400+。

**第四阶段：AI 原生与内嵌 OLAP（2022-至今）**

- 2022：DuckDB 1.0 出现（内嵌 OLAP）。
- 2023：Spark 3.5+、Trino 420+。
- 2024：Spark 4.0 路线图、DuckDB 1.x 主流。
- 2025：AI 原生计算（LLM 驱动的 Spark 调优）。

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
- **MMPP（Multi-Massively Parallel Processing）**：支持多机并行。

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
- Trino（前 PrestoDB）：社区分叉后主导。

**DuckDB vs Spark**：

- DuckDB：单机 / 嵌入 / AI 场景。
- Spark：分布式 / 大数据场景。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Hive on Spark**

- Hive 翻译为 Spark 执行。
- 适用：传统企业。

**模式 2：Spark SQL 直连**

- Spark 直接读 Iceberg / Hive / Parquet。
- 适用：现代数据栈。

**模式 3：Spark + Iceberg + Trino**

- Spark 写入 Iceberg，Trino 查询。
- 适用：Lakehouse。

**模式 4：Trino 联邦查询**

- Trino 跨 Hive + MySQL + Kafka。
- 适用：联邦分析。

**模式 5：DuckDB 内嵌分析**

- 本地 / 嵌入场景。
- 适用：AI / 小数据 / Notebook。

**模式 6：Spark Structured Streaming（离线语义）**

- Trigger.Once 模式：流式接口 + 离线语义。
- 适用：流批融合。

**模式 7：MaxCompute（阿里）**

- 阿里自研离线计算。
- 适用：阿里系业务。

**模式 8：Spark 4.0 + AI Functions**

- Spark 内置 AI Functions（向量化、LLM）。
- 适用：AI 原生离线。

### 3.2 适用场景决策表

| 业务场景 | 推荐引擎 | 典型技术栈 |
| --- | --- | --- |
| T+1 报表 | Spark SQL / Hive on Spark | Hive + Spark + Iceberg |
| 实时 + 离线统一 | Spark + Flink | Spark Structured Streaming + Flink |
| 联邦查询 | Trino | Trino + 多 Connector |
| Lakehouse | Spark + Iceberg + Trino | Iceberg + Spark + Trino + StarRocks |
| AI / Notebook | DuckDB | DuckDB + Parquet + Python |
| 阿里系业务 | MaxCompute | MaxCompute + DataWorks |
| 大数据 ETL | Spark | Spark + Iceberg + Flink |
| 即席查询 | StarRocks / Doris | StarRocks + Iceberg 外表 |

### 3.3 反模式与陷阱

**反模式 1：使用 RDD 编程**

- 新项目还用 RDD，丧失 DataFrame 优化。
- **正确**：优先 DataFrame / Spark SQL。

**反模式 2：忽视数据倾斜**

- 作业慢、内存溢出。
- **正确**：AQE + 两阶段聚合 + 广播 Join。

**反模式 3：小文件未治理**

- 千万级小文件，Spark 启动慢。
- **正确**：合并 + 写 Iceberg / Paimon 自动合并。

**反模式 4：未启用 AQE**

- 错失自适应优化机会。
- **正确**：Spark 3.x 默认开启 AQE。

**反模式 5：Hive 性能问题**

- Hive 默认 MR 太慢。
- **正确**：Hive on Tez / Hive on Spark。

**反模式 6：Spark 资源调度不合理**

- Executor 内存 / Core 配置不当。
- **正确**：动态分配 + 合理分区。

**反模式 7：滥用 UDF**

- 自定义 UDF 失去优化机会。
- **正确**：优先内置函数 + 必要时 Pandas UDF。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型引擎（1-2 周）**

- 通用：Spark。
- 联邦：Trino。
- 内嵌：DuckDB。
- 阿里：MaxCompute。

**Step 2：集群规划（2-4 周）**

- 节点数（按数据量 / 业务）。
- Executor 内存 / Core 配置。
- 动态分配。

**Step 3：SQL / DataFrame 编程规范（1-2 周）**

- 优先 DataFrame。
- AQE 开启。
- 分区剪裁、列剪裁。

**Step 4：数据倾斜治理（持续）**

- AQE 自动处理。
- 手动优化两阶段聚合。

**Step 5：监控 + 调优（持续）**

- Spark UI / History Server。
- Ganglia / Prometheus + Grafana。

**Step 6：AI 集成（按需）**

- Spark AI Functions。
- DuckDB + LLM。

### 4.2 关键技术点

**1. Spark AQE 配置**

```sql
-- 开启 AQE
SET spark.sql.adaptive.enabled = true;
SET spark.sql.adaptive.skewJoin.enabled = true;
SET spark.sql.adaptive.coalescePartitions.enabled = true;
SET spark.sql.adaptive.skewJoin.skewedPartitionFactor = 5;
SET spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes = 256mb;
```

**2. 数据倾斜治理**

```python
# 两阶段聚合（Salting）
from pyspark.sql.functions import concat, lit, rand

# 加盐
salted_df = df.withColumn("salt_key", concat(col("user_id"), lit("_"), (rand() * 10).cast("int")))

# 局部聚合
partial_agg = salted_df.groupBy("salt_key", "user_id") \
    .agg({"amount": "sum"})

# 全局聚合
final_agg = partial_agg.groupBy("user_id") \
    .agg({"sum(amount)": "sum"})
```

**3. Spark + Iceberg**

```python
# Spark + Iceberg 写入
df.writeTo("iceberg.orders") \
    .partitionedBy(days("order_time")) \
    .createOrReplace()

# Time Travel
df_yesterday = spark.read \
    .option("as-of-timestamp", "2025-01-15 10:00:00") \
    .table("iceberg.orders")
```

**4. DuckDB 内嵌分析**

```python
import duckdb

# 直接查询 Parquet
result = duckdb.query("""
    SELECT
        region,
        SUM(amount) AS gmv,
        COUNT(DISTINCT user_id) AS users
    FROM read_parquet('s3://lake/orders/*.parquet')
    WHERE order_time BETWEEN '2025-01-01' AND '2025-01-31'
    GROUP BY region
    ORDER BY gmv DESC
""").to_df()
```

**5. Spark 4.0 新特性（2024 路线图）**

- **Spark Connect**：解耦 Driver / Executor，远程连接。
- **Structured Streaming 改进**：流批融合。
- **AI Functions**：内置 Embedding / LLM。
- **Spark SQL 增强**：Variant 类型、向量类型。

### 4.3 工具链与平台（含 2024-2025 新工具）

**离线计算引擎（2024-2025）**：

| 工具 | 版本 | 特点 |
| --- | --- | --- |
| Apache Spark | 3.5+（4.0 路线） | 主流离线引擎 |
| Apache Hive | 3.x | 传统 SQL-on-Hadoop |
| Trino | 420+ | 联邦查询 |
| Presto | 0.28x（停滞） | Trino 前身 |
| DuckDB | 1.x | 内嵌 OLAP，AI 时代新宠 |
| MaxCompute（阿里） | - | 云原生离线 |

**资源调度**：

- YARN：传统。
- K8s：云原生。
- 自研（字节 / Netflix）。

**辅助工具**：

- Apache Zeppelin / Jupyter：Notebook。
- Apache Livy：Spark REST。
- Apache Kyuubi：多租户 Spark SQL 网关。

### 4.4 代码 / 示例

**示例 1：Spark + Iceberg + AQE**

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum, count

spark = SparkSession.builder \
    .appName("OfflineLakehouse") \
    .config("spark.sql.catalog.iceberg", "org.apache.iceberg.spark.SparkCatalog") \
    .config("spark.sql.catalog.iceberg.type", "hive") \
    .config("spark.sql.catalog.iceberg.uri", "thrift://metastore:9083") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.adaptive.skewJoin.enabled", "true") \
    .getOrCreate()

# 读取 Iceberg 表
df = spark.read.table("iceberg.silver.orders")

# 离线聚合（Gold 层）
gold_df = df.groupBy("user_id", "dt") \
    .agg(
        sum("amount").alias("gmv"),
        count("order_id").alias("orders")
    )

# 写入 Iceberg Gold
gold_df.writeTo("iceberg.gold.user_daily_orders") \
    .partitionedBy("dt") \
    .createOrReplace()
```

**示例 2：DuckDB AI 时代分析（2024 新工具）**

```python
import duckdb

# 直接读 Parquet + 向量化计算
result = duckdb.query("""
    SELECT
        region,
        product_category,
        SUM(amount) AS gmv,
        COUNT(DISTINCT user_id) AS unique_users,
        AVG(amount) AS avg_order
    FROM read_parquet('s3://lake/orders/dt=2025-01-01/*.parquet')
    WHERE order_status = 'paid'
    GROUP BY region, product_category
    ORDER BY gmv DESC
    LIMIT 100
""").to_df()

print(result.head())

# DuckDB + Pandas（嵌入分析）
import pandas as pd
df = pd.read_parquet("s3://lake/orders/dt=2025-01-01/")
result = duckdb.query("""
    SELECT region, SUM(amount) FROM df GROUP BY region
""").to_df()
```

**示例 3：Trino 联邦查询**

```sql
-- Trino 跨源查询（Hive + MySQL + Kafka）
SELECT
    o.order_id,
    o.amount,
    c.user_name,
    c.email,
    k.event_type
FROM hive.sales.orders o
JOIN mysql.crm.customers c ON o.user_id = c.id
LEFT JOIN kafka.events.user_events k ON o.user_id = k.user_id
WHERE o.dt = '2025-01-01';
```

**示例 4：Spark Structured Streaming（流批融合）**

```python
# Spark Structured Streaming Trigger.Once 模式（流式接口 + 离线语义）
streaming_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "orders") \
    .load()

# 离线语义：只处理一次（Trigger.Once）
query = streaming_df.writeStream \
    .format("iceberg") \
    .option("path", "iceberg.orders") \
    .option("checkpointLocation", "s3://checkpoints/orders") \
    .trigger(availableNow=True) \  # 类似 Trigger.Once，处理完所有数据后停止
    .start()
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：AI 驱动的 Spark 调优**

- LLM 分析 Spark UI → 自动调优。
- 工具：Sparklens + LLM、自研。

**演进方向 2：Spark AI Functions（2024 路线）**

- Spark 内置 Embedding / LLM。
- 一份 SQL 同时做 ETL + AI。
- 工具：Apache Spark 4.0。

**演进方向 3：DuckDB 内嵌 AI**

- DuckDB + LanceDB + LLM。
- Notebook 原型 / 小数据分析。

**演进方向 4：LLM 辅助 SQL 生成**

- 自然语言 → SQL → Spark / DuckDB。
- 工具：Databricks Assistant、Snowflake Cortex Analyst。

**演进方向 5：自治离线计算**

- AI 自动监控、自动调优、自动恢复。
- 工具：自研 + LLM。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**Spark + RAG**：

- Spark 批量 Embedding → 向量库。
- 工具：Spark AI Functions、LangChain Spark Integration。

**Spark + 向量库**：

- Spark 批量写入 Milvus / Pinecone / LanceDB。
- 工具：LanceDB Connector。

**Spark + GraphRAG**：

- Spark 抽取实体关系 → Neo4j。
- 工具：Neo4j Spark Connector。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **DuckDB 论文（VLDB 2024）**：内嵌 OLAP 架构。
- **Spark 4.0 路线图（2024）**：Spark Connect、AI Functions。
- **Trino 论文（SIGMOD 2024）**：联邦查询架构。

**工业进展**：

- **Apache Spark 3.5（2024）**：Spark Connect GA、AQE 增强。
- **DuckDB 1.x（2024）**：MMPP 多机并行、向量类型。
- **Trino 420+（2024）**：Iceberg V3、向量类型。

### 5.4 未来 3-5 年趋势

**趋势 1：AI 原生计算**

- Spark / DuckDB 内置 AI Functions。
- LLM 成为一等公民。

**趋势 2：内嵌 OLAP 主流**

- DuckDB / DataFusion 内嵌引擎。
- Notebook / 边缘计算场景。

**趋势 3：自治离线**

- AI 自动调优。
- 自治 Spark。

**趋势 4：联邦查询主流**

- Trino 跨云、跨源。
- 联邦 Lakehouse。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：字节跳动 Spark on K8s**

- **数据规模**：PB 级。
- **架构**：Spark on K8s + Iceberg + 自研调度。
- **效果**：弹性伸缩、成本降低 50%。

**案例 2：Netflix Spark + Iceberg**

- **数据规模**：EB 级。
- **架构**：Spark + Iceberg + Trino。
- **效果**：替代 Hive 性能提升 10x。

**案例 3：DuckDB 在 AI 平台**

- **场景**：Notebook / 数据科学。
- **效果**：替代 Pandas 性能提升 10-100x。

### 6.2 踩坑与经验

**坑 1：数据倾斜**

- **现象**：作业慢、内存溢出。
- **解决**：AQE + 两阶段聚合 + 广播 Join。

**坑 2：小文件**

- **现象**：作业启动慢。
- **解决**：合并 + 写 Iceberg 自动合并。

**坑 3：OOM（内存溢出）**

- **现象**：Executor 挂掉。
- **解决**：合理内存 + 动态分配。

**坑 4：Shuffle 数据量爆炸**

- **现象**：网络 IO 成为瓶颈。
- **解决**：减少 Shuffle + 广播小表。

**坑 5：Hive 性能差**

- **现象**：Hive MR 慢。
- **解决**：Hive on Tez / Hive on Spark。

### 6.3 落地路径（0→1, 1→10, 10→100）

**阶段 1：0 → 1（启动期，0-6 个月）**

- Spark + Hive。
- 团队：3-5 数据工程师。

**阶段 2：1 → 10（扩展期，6-18 个月）**

- Spark + Iceberg + AQE。
- 团队：5-15 数据工程师。

**阶段 3：10 → 100（规模化期，18-36 个月）**

- AI 原生 Spark + DuckDB。
- 团队：20-50 + 平台团队。

### 6.4 ROI 评估

**评估维度**：

- **性能提升**：Iceberg + AQE 性能提升 3-10x。
- **成本降低**：Spark on K8s 成本降低 50%。
- **业务上线速度**：DuckDB 提速 10-100x。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Spark | Hive | Trino | DuckDB |
| --- | :---: | :---: | :---: | :---: |
| 性能 | 5 | 3 | 5 | 5 |
| 扩展性 | 5 | 5 | 5 | 2 |
| 易用性 | 4 | 3 | 4 | 5 |
| AI 友好 | 4 | 2 | 3 | 5 |
| 内嵌能力 | 1 | 1 | 1 | 5 |

### 7.2 决策树

```
数据规模？
├── < GB
│   └── DuckDB（内嵌）
├── GB - TB
│   ├── 单机 → DuckDB
│   └── 分布式 → Spark / Trino
└── > TB
    └── Spark + Iceberg + Trino
```

### 7.3 组合使用

**组合 1：Spark + Iceberg + Trino**

- Spark 写入 Iceberg，Trino 查询。
- 适用：Lakehouse。

**组合 2：Spark + DuckDB**

- Spark 大数据 ETL，DuckDB 交互分析。
- 适用：混合场景。

**组合 3：Hive + Spark + Trino**

- Hive 兼容历史，Spark 计算，Trino 查询。
- 适用：传统企业迁移。

---

## 8. 面试真题集

# offline-compute 面试真题集

> **一句话定位**：MaxCompute / Spark / Hive / Presto on Hive。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 3 个原 PDF 子章节、共 15 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §4.3 | ETL 开发与性能调优 | 4.3.1, 4.3.2, 4.3.3, 4.3.4, 4.3.5 | 5 | 辅 |
| §6.1 | Spark Core 基础与 RDD 编程 | 6.1.1, 6.1.2, 6.1.3, 6.1.4, 6.1.5 | 5 | 主 |
| §6.3 | Spark SQL 与结构化数据处理 | 6.3.1, 6.3.2, 6.3.3, 6.3.4, 6.3.5 | 5 | 主 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §4 基于Hive/Spark SQL的数据仓库建设 > 本主题涵盖 1 个子节、5 道题。

#### 2.1.3 ETL 开发与性能调优

> 来源：原 PDF §4.3，收录 5 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §4.3.1 | ★★★☆☆ |
| §4.3.2 | ★★★☆☆ |
| §4.3.3 | ★★★☆☆ |
| §4.3.4 | ★★★☆☆ |
| §4.3.5 | ★★★★☆ |

- **§4.3.1**：当发现⼀个关键的⽇常Hive ETL任务运⾏时间突然从1⼩时延⻓到4⼩时，请阐述你
- **§4.3.2**：请解释在Hive/Spark SQL的ETL开发中，数据倾斜现象是什么，并列举两种常⻅
- **§4.3.3**：在处理⼤规模数据时，如何使⽤Spark SQL的分布式计算能⼒来优化⼀个包含多表
- **§4.3.4**：请设计⼀个基于Spark Structured Streaming的实时ETL流程，该流程需要从Kafk
- **§4.3.5**：请描述在Hive SQL中，MapJoin通常适⽤于什么场景，以及它为什么能够提升ETL

### 2.2 §6 ⼤规模数据处理应⽤的开发与优化 > 本主题涵盖 2 个子节、10 道题。

#### 2.2.1 Spark Core 基础与 RDD 编程

> 来源：原 PDF §6.1，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §6.1.1 | ★★★☆☆ |
| §6.1.2 | ★★★☆☆ |
| §6.1.3 | ★★★☆☆ |
| §6.1.4 | ★★★☆☆ |
| §6.1.5 | ★★★★☆ |

- **§6.1.1**：请解释Spark中RDD的基本概念，并说明RDD的五⼤主要特性。
- **§6.1.2**：请描述Spark中宽依赖和窄依赖的区别，并分别举例说明它们各⾃会出现在哪些转
- **§6.1.3**：请对⽐分析Spark中的`reduceByKey`和`groupByKey`这两个算⼦在执⾏流程、Sh
- **§6.1.4**：在实际项⽬中，如果遇到⼀个Spark作业因为数据倾斜导致运⾏缓慢，你会如何定
- **§6.1.5**：请详细说明Spark任务执⾏过程中，从RDD的创建到最终结果输出，数据是如何在

#### 2.2.3 Spark SQL 与结构化数据处理

> 来源：原 PDF §6.3，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §6.3.1 | ★★★☆☆ |
| §6.3.2 | ★★★☆☆ |
| §6.3.3 | ★★★☆☆ |
| §6.3.4 | ★★★☆☆ |
| §6.3.5 | ★★★★☆ |

- **§6.3.1**：当⾯对⼀个复杂的多表关联查询任务时，在 Spark SQL 中你会采取哪些策略来避
- **§6.3.2**：请解释 Spark SQL 相对于传统的 Spark RDD 编程有哪些主要优势？
- **§6.3.3**：请说明在 Spark SQL 中，DataFrame 和 Dataset 之间的主要区别与联系是什
- **§6.3.4**：请描述 Spark SQL 中 Catalyst 优化器的⼯作流程，并举例说明它如何通过逻辑计
- **§6.3.5**：在处理⼤规模结构化数据时，如何通过 Spark SQL 进⾏⾼效的数据分区和分桶以

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **性能优化与调优**
- **数据建模与仓库建设**

## 4 本章小结

> 本面试真题集收录 15 道题，覆盖 2 个原 PDF 主题、3 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
