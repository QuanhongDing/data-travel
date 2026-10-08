# 流批一体（Stream-Batch Unified）

> **一句话定位**：让一份代码同时处理流和批、一份存储同时支持流式读写，是实时数仓与 Lakehouse 的"架构终极形态"。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**10 流批一体**）。覆盖 **R4 数据全栈协同** 能力领域中「流批融合引擎、统一存储、Beam / Paimon / Iceberg 流批读写、AI 时代演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 流批一体 vs Lambda / Kappa 的本质区别？ | §1.1 |
| 哪些引擎 / 存储真正支持流批一体？ | §2.1 |
| Apache Beam / Flink / Spark 怎么选？ | §7.1 |
| Iceberg / Hudi / Paimon 流批读写差异？ | §3.1 |
| 2024-2025 流批一体最新趋势？ | §5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：流批一体（Stream-Batch Unified）是一种**用同一套编程模型、同一份代码、同一份存储同时处理流式数据和批量数据**的架构范式。它消除了 Lambda 架构的"双链路"问题，让流和批真正融合。

**工程定义**：在数据架构师手里，流批一体是**一份让 Flink + Paimon / Iceberg 等组合实现"一份代码、一份存储、一份查询"的能力**。核心特征：

- **统一编程模型**：同一份 SQL / 同一份 DataStream 代码。
- **统一存储**：一份 Iceberg / Paimon 表同时支持流式写入 + 批量读取。
- **统一计算引擎**：Flink / Spark 同一引擎同时跑流批。
- **统一查询**：Trino / StarRocks 同一查询引擎。

**与 Lambda / Kappa 的本质区别**：

| 维度 | Lambda | Kappa | 流批一体 |
| --- | --- | --- | --- |
| 计算引擎 | 流 + 批双引擎 | 单一流引擎 | 同一引擎 |
| 代码 | 两份（流 + 批） | 一份（流） | 一份（流批） |
| 存储 | 双份（流存 + 批存） | 单一（Kafka） | 单一（Lakehouse） |
| 复杂度 | 高（双链路） | 中（重放机制） | 低（一份代码） |
| 性能 | 高（各链路最优） | 中（依赖流引擎） | 中高（取决于表格式） |

### 1.2 为什么需要

**业务驱动力**：

- **Lambda 痛点**：双链路开发成本高、维护复杂。
- **代码复用**：一份代码多处使用。
- **存储统一**：避免数据重复（流存 + 批存）。
- **治理简化**：统一血缘、统一质量、统一安全。
- **AI 时代需要**：AI 训练需要全量历史数据，实时业务需要增量数据——一份数据满足两者。

**痛点（没有流批一体的代价）**：

1. **双链路开发**：同样逻辑写两遍（流 + 批），容易不一致。
2. **数据重复**：流存一份 + 批存一份，成本翻倍。
3. **口径不一致**：流批逻辑差异导致数据打架。
4. **运维复杂**：两个引擎、两套集群。

**AI 时代的新诉求**：

- **实时 + 离线训练**：模型同时需要实时特征 + 离线全量特征。
- **统一资产**：AI 数据不需要区分流批。
- **Agent 实时决策**：需要流批融合的事件流。

### 1.3 在 AI 时代数据架构中的位置

```
[业务系统 / 日志 / IoT]
        ↓
[流批一体存储：Paimon / Iceberg / Hudi]
        ↓
[流批一体计算：Flink / Spark]
        ↓
[统一查询：Trino / StarRocks / Doris]
        ↓
[BI / AI / Agent]
```

**流批一体是数据栈的"融合层"**：让数据从流动到沉淀到消费全程统一。

### 1.4 演进历程

**第一阶段：Lambda 双链路（2010-2018）**

- Hadoop + Storm + Kafka Lambda。
- 双链路、双代码、双存储。

**第二阶段：Kappa 单链路（2014-2020）**

- Kafka + Flink 单一链路。
- 但 Kappa 仍有局限（历史计算重放慢）。

**第三阶段：流批一体萌芽（2018-2022）**

- 2018：Apache Beam 统一流批 API。
- 2019：Spark Structured Streaming Trigger.Once。
- 2020：Iceberg 流批读写萌芽。
- 2021：Flink + Iceberg 流批集成。

**第四阶段：流批一体成熟（2022-2024）**

- 2022：Apache Paimon（前 Flink Table Store）出现，主打流批一体。
- 2023：Paimon 0.7+ / Iceberg V2 流批成熟。
- 2024：Paimon 1.0 毕业、Iceberg V3。

**第五阶段：AI 原生流批一体（2024-至今）**

- 2024：Flink + AI Functions、流式 LLM。
- 2024-2025：Agent 实时事件流。

**一句话总结**：**流批一体从"Lambda 双链路"→"Kappa 单链路"→"统一 API"→"统一存储"→"AI 原生"五阶段演进，今天 Paimon + Flink 是事实标准。**

---

## 2. 核心原理

### 2.1 关键概念定义

**流批一体的核心要素**：

1. **统一编程模型**：同一份 SQL / DataStream 代码。
2. **统一存储**：一份表同时支持流式写入 + 批量读取。
3. **统一计算引擎**：Flink / Spark 同时跑流批。
4. **统一元数据**：一份 Catalog（Iceberg / Paimon）。

**Apache Beam**：

- 统一流批 API 的抽象层。
- 可运行在 Flink / Spark / Google Cloud Dataflow。
- 代表：Batch Mode + Streaming Mode。

**Flink 流批一体**：

- Flink 1.12+ 统一流批 API（DataStream + Table API）。
- Flink 同时支持流 + 批模式（Execution Mode）。

**Spark Structured Streaming**：

- 统一流批（Trigger.Once / Available Now = 批模式）。
- 同一份 DataFrame 代码。

**Paimon（原 Flink Table Store）**：

- Flink 生态原生的流式表格式。
- 内置 Changelog 流，支持流批读写。

**Iceberg V2 流批**：

- Iceberg V2 引入 Row-Level Deletes，支持流式写入。
- V3 强化增量读取。

**Hudi 流批**：

- MOR（Merge-on-Read）支持流式写入。
- 内置 Changelog 流。

### 2.2 数学 / 形式化基础

**流批一体的形式化**：

```
Query = Code(Logic, DataSource)
DataSource ∈ {Stream, Batch}
```

流批一体的核心：DataSource 可以是流或批，但 Logic 一致。

**Changelog 流（CDC）的形式化**：

```
Changelog = Sequence of (Insert, Update, Delete) Operations
```

Paimon / Hudi / Iceberg V3 都通过 Changelog 流实现流批统一。

**Paimon LSM Tree 的形式化**：

- **L0（最新）**：新写入的数据（小文件）。
- **L1-LN**：合并后的数据（按 Key 排序）。
- **Compaction**：定期合并 L0 → L1 → L2。
- **读时合并**：查询时从 LSM 各层合并读取。

**Flink 流批一体的实现**：

```
Source: Stream (Kafka) | Batch (Hive)
Engine: Flink
Sink: Iceberg / Paimon (支持流批读写)
```

**Exactly-Once 的形式化**：

- Flink Checkpoint + 幂等 Sink + 2PC。
- 实现端到端 EOS。

### 2.3 关键算法 / 方法

**1. Flink + Paimon 流批一体**

```java
// Flink + Paimon 流批一体
TableEnvironment tEnv = ...;

// 定义 Kafka 源
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

// 定义 Paimon 表
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
      'changelog-producer' = 'input'
    )
""");

// 流模式：实时入湖
tEnv.executeSql("""
    INSERT INTO paimon_orders
    SELECT * FROM kafka_orders
""");

// 批模式：通过 Spark 读 Paimon
spark.read.format("paimon").load("s3://lake/paimon/orders").show();
```

**2. Apache Beam 统一流批**

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

# 同一份代码同时跑流批
with beam.Pipeline(options=PipelineOptions()) as p:
    (p
     | beam.io.ReadFromKafka(...)  # 流模式
     | beam.Map(parse_order)
     | beam.GroupByKey()
     | beam.io.WriteToParquet(...)  # 批 Sink
    )
```

**3. Spark Structured Streaming 流批融合**

```python
# Spark 流批融合（Trigger.Once = 批语义）
streaming_df = spark.readStream \
    .format("kafka") \
    .option("subscribe", "orders") \
    .load()

# Trigger.Once 模式（流式接口 + 离线语义）
query = streaming_df.writeStream \
    .format("iceberg") \
    .option("path", "iceberg.orders") \
    .option("checkpointLocation", "s3://checkpoints/orders") \
    .trigger(availableNow=True) \
    .start()

# 批模式（Spark SQL）
batch_df = spark.read.format("iceberg").load("iceberg.orders")
```

**4. Iceberg V3 流批读写**

```sql
-- Iceberg V3 增量读取（流模式）
SELECT * FROM iceberg.orders
WHERE _updated_at > '2025-01-15';

-- Iceberg 批量读取（批模式）
SELECT * FROM iceberg.orders
WHERE order_time BETWEEN '2025-01-01' AND '2025-01-31';
```

**5. Hudi 流批读写**

```sql
-- Hudi MOR 模式流式增量
SELECT * FROM hudi_orders
WHERE `_hoodie_commit_time` > '20250115100000';

-- Hudi 批量查询
SELECT * FROM hudi_orders WHERE dt = '2025-01-15';
```

### 2.4 与相邻概念的关系

**流批一体 vs Lambda**：见 §1.1。

**流批一体 vs Kappa**：

- Kappa = 单一流引擎。
- 流批一体 = 同一引擎流批 + 同一存储流批。

**Paimon vs Iceberg vs Hudi（流批读写）**：

- Paimon：流批最强（Flink 生态）。
- Iceberg V3：流批中等（V3 增强）。
- Hudi：MOR 流批强。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Flink + Paimon 流批一体（最主流）**

- Flink 同时跑流批，Paimon 同时支持流批读写。
- 适用：实时数仓 + Lakehouse。

**模式 2：Flink + Iceberg V3 流批**

- Flink 流批 + Iceberg V3 行级删除 + 增量读取。
- 适用：Lakehouse + 流批融合。

**模式 3：Spark Structured Streaming + Delta 流批**

- Spark 同时跑流批，Delta 同时支持流批读写。
- 适用：Databricks 生态。

**模式 4：Apache Beam 跨引擎流批**

- 同一份 Beam 代码运行在 Flink / Spark / Dataflow。
- 适用：多云、可移植性。

**模式 5：Flink CDC + Iceberg/Paimon 实时入湖**

- Flink CDC 实时入湖，Trino/StarRocks 批量查询。
- 适用：实时 Lakehouse。

**模式 6：Materialize 流式 SQL 数据库**

- 流式 SQL + 实时物化视图。
- 适用：流式数仓。

### 3.2 适用场景决策表

| 业务场景 | 推荐模式 | 典型技术栈 |
| --- | --- | --- |
| 实时数仓 + Lakehouse | Flink + Paimon | Flink + Paimon + StarRocks |
| 跨云 / 可移植 | Apache Beam | Beam + Flink / Spark |
| Databricks 生态 | Spark + Delta | Spark Structured Streaming + Delta |
| 实时入湖 + 查询 | Flink CDC + Iceberg | Flink CDC + Iceberg + Trino |
| 流式 SQL 数仓 | Materialize | Materialize + Postgres |
| 多引擎统一 | Beam / Flink | Beam + Flink + Iceberg |
| 流批 + AI 原生 | Flink + AI Functions | Flink + LLM + Paimon |

### 3.3 反模式与陷阱

**反模式 1：强行流批一体**

- 业务其实只需流或只需批，硬上流批一体。
- **正确**：业务驱动选型。

**反模式 2：选错表格式**

- 选 Delta 但 Flink 集成差。
- **正确**：Flink 选 Paimon，Spark 选 Delta，跨引擎选 Iceberg。

**反模式 3：忽视 Changelog**

- 表格式未开启 Changelog，流式查询不到变更。
- **正确**：Paimon 开启 Changelog Producer。

**反模式 4：状态爆炸**

- 流模式状态无限增长。
- **正确**：TTL + 合理 Key 设计。

**反模式 5：性能预期过高**

- 流批一体不是万能药，性能可能弱于专用流。
- **正确**：评估性能 + 测试。

**反模式 6：忽视 Schema Evolution**

- 上游改字段，流批都不通。
- **正确**：Schema Evolution + CI/CD 测试。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型引擎 + 表格式（1-2 周）**

- 引擎：Flink / Spark / Beam。
- 表格式：Paimon / Iceberg / Hudi / Delta。

**Step 2：搭建存储（2-4 周）**

- 对象存储 + Catalog。
- Paimon / Iceberg / Hudi / Delta。

**Step 3：流批一体化开发（4-8 周）**

- Flink + Paimon 流批一体。
- 流批共用同一份代码。

**Step 4：实时入湖 + 批量查询（4-8 周）**

- Flink CDC 入湖。
- Trino / StarRocks 批量查询。

**Step 5：治理 + 监控（持续）**

- 元数据 + 血缘。
- 监控告警。

**Step 6：AI 集成（按需）**

- 流式 LLM / Agent。

### 4.2 关键技术点

**1. Flink + Paimon 流批一体**

```java
// 流批一体配置
tEnv.getConfig().set("table.exec.source.idle-timeout", "10s");

// 流模式（实时入湖）
tEnv.executeSql("""
    INSERT INTO paimon_orders
    SELECT * FROM kafka_orders
""");

// 批模式（历史回放）
TableEnv batchEnv = TableEnvironment.create(EnvironmentSettings.inBatchMode());
batchEnv.executeSql("""
    SELECT * FROM paimon_orders
    WHERE ts BETWEEN '2025-01-01' AND '2025-01-31'
""");
```

**2. Flink + Iceberg V3 流批读写**

```sql
-- 流模式：增量读取
SELECT * FROM iceberg.orders
WHERE _updated_at > '2025-01-15';

-- 流模式：写入
INSERT INTO iceberg.orders VALUES (1, 100, 99.99, NOW());

-- 批模式：批量读取
SELECT * FROM iceberg.orders WHERE order_time BETWEEN '2025-01-01' AND '2025-01-31';
```

**3. Changelog 流（Paimon）**

```java
// 开启 Changelog Producer
tEnv.executeSql("""
    CREATE TABLE paimon_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      PRIMARY KEY (order_id) NOT ENFORCED
    ) WITH (
      'connector' = 'paimon',
      'path' = 's3://lake/paimon/orders',
      'changelog-producer' = 'input',  -- 开启 Changelog
      'sink.bucket-num' = '8'
    )
""");
```

**4. Spark Structured Streaming Trigger.Once**

```python
# Trigger.Once 模式（流式接口 + 离线语义）
streaming_df = spark.readStream \
    .format("kafka") \
    .option("subscribe", "orders") \
    .load()

query = streaming_df.writeStream \
    .format("iceberg") \
    .option("path", "iceberg.orders") \
    .option("checkpointLocation", "s3://checkpoints/orders") \
    .trigger(availableNow=True) \  # 类似 Trigger.Once
    .start()

query.awaitTermination()
```

**5. Apache Beam 跨引擎流批**

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions, StandardOptions

options = PipelineOptions()
options.view_as(StandardOptions).streaming = True  # 流模式
# options.view_as(StandardOptions).streaming = False  # 批模式

with beam.Pipeline(options=options) as p:
    (p
     | 'Read' >> beam.io.ReadFromKafka(...)
     | 'Parse' >> beam.Map(parse)
     | 'Aggregate' >> beam.GroupByKey()
     | 'Write' >> beam.io.WriteToIceberg(...)
    )
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**流批一体引擎（2024-2025）**：

| 工具 | 版本 | 特点 |
| --- | --- | --- |
| Apache Flink | 1.19+ | 流批事实标准 |
| Apache Spark Structured Streaming | 3.5+ | 同一引擎流批 |
| Apache Beam | 2.5x | 跨引擎统一 API |
| Apache Paimon | 1.1 | Flink 生态原生流批 |
| Materialize | 1.x | 流式 SQL 数仓 |
| Decodable | - | 流式 SaaS |

**流批一体表格式**：

| 工具 | 特点 |
| --- | --- |
| Apache Paimon | 流批最强、Flink 生态 |
| Apache Iceberg V3 | 流批增强、行级删除 |
| Apache Hudi | MOR 流批强、CDC 友好 |
| Delta Lake | Spark 生态深、Delta UniForm |

**查询引擎**：

- Trino：跨 Iceberg / Paimon / Hudi / Delta 联邦。
- StarRocks 3.x：Iceberg / Paimon 外表查询。
- Doris 2.1+：Iceberg / Hive 外表查询。

### 4.4 代码 / 示例

**示例 1：Flink + Paimon 流批一体完整案例**

```java
// Flink + Paimon 流批一体
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(60000);  // 1 分钟 Checkpoint

EnvironmentSettings settings = EnvironmentSettings.inStreamingMode();
TableEnvironment tEnv = TableEnvironment.create(settings);
tEnv.getConfig().set("table.exec.source.idle-timeout", "10s");

// 1. Kafka 源
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

// 2. Paimon 表（带主键 + Changelog）
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
      'changelog-producer' = 'input',
      'sink.bucket-num' = '8'
    )
""");

// 3. 流模式（实时入湖）
tEnv.executeSql("""
    INSERT INTO paimon_orders
    SELECT * FROM kafka_orders
""");

// 4. 批模式（历史查询，通过 Spark）
spark.read.format("paimon").load("s3://lake/paimon/orders").show();
```

**示例 2：Flink CDC + Iceberg V3 流批一体**

```java
// Flink CDC → Iceberg V3
tEnv.executeSql("""
    CREATE TABLE mysql_orders (
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

tEnv.executeSql("""
    CREATE TABLE iceberg_orders (...)
    WITH (
      'connector' = 'iceberg',
      'format-version' = '3',
      'write.upsert.enabled' = 'true'
    )
""");

// 流模式（CDC 写入）
tEnv.executeSql("INSERT INTO iceberg_orders SELECT * FROM mysql_orders");

// 批模式（Trino 增量读取）
SELECT * FROM iceberg.orders WHERE _updated_at > '2025-01-15';
```

**示例 3：Spark Structured Streaming 流批融合**

```python
# Spark + Iceberg 流批融合
streaming_df = spark.readStream \
    .format("kafka") \
    .option("subscribe", "orders") \
    .load()

# 流式接口 + 离线语义（Trigger.Once）
query = streaming_df.writeStream \
    .format("iceberg") \
    .option("path", "iceberg.orders") \
    .option("checkpointLocation", "s3://checkpoints/orders") \
    .trigger(availableNow=True) \  # 处理完所有数据后停止（批语义）
    .start()

# 批查询
batch_df = spark.read.format("iceberg").load("iceberg.orders")
```

**示例 4：Materialize 流式 SQL 数仓**

```sql
-- Materialize 创建流式视图
CREATE MATERIALIZED VIEW order_summary AS
SELECT
    user_id,
    COUNT(*) AS orders,
    SUM(amount) AS gmv
FROM orders_stream
GROUP BY user_id;

-- 实时查询（自动增量更新）
SELECT * FROM order_summary WHERE user_id = 12345;
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：流批一体 + AI Functions**

- Flink 内置 LLM、Embedding。
- 同一份代码同时跑 ETL + AI。
- 工具：Flink AI Functions（2024 路线）。

**演进方向 2：流式 Agent**

- Flink 实时事件 → Agent 决策。
- 工具：Flink + LangChain / AutoGen。

**演进方向 3：流式 RAG**

- Flink 实时处理 → Embedding → 向量库。
- 工具：Flink + LanceDB / Milvus。

**演进方向 4：统一流批 + 联邦**

- 跨云、跨引擎流批一体。
- 工具：Apache Beam + Iceberg REST。

**演进方向 5：自治流批**

- AI 自动调优、自适应。
- 自治 Flink。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**流式 RAG**：

- Flink 流批一体 + Embedding + 向量库。
- 工具：Flink + LanceDB。

**流式 GraphRAG**：

- Flink 实时事件 → 知识图谱。
- 工具：Flink + Neo4j。

**流批 + 向量库**：

- 流批一体存储 + 向量索引。
- 工具：Paimon + LanceDB。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **Apache Paimon 论文（VLDB 2024）**：流批融合 LSM Tree。
- **Apache Beam 论文（2024）**：跨引擎统一 API。
- **Materialize 论文（SIGMOD 2024）**：流式 SQL 物化视图。

**工业进展**：

- **Apache Paimon 1.1（2024）**：Changelog 增强、流批读写优化。
- **Apache Flink 1.19+（2024）**：流批 SQL 增强。
- **Materialize 1.x（2024）**：流式 SQL 数仓商业化。
- **Decodable（2024）**：流式 SaaS。
- **Apache Fluss（前 Flink Table Store 衍生，2024）**：流式原生存储新项目。

### 5.4 未来 3-5 年趋势

**趋势 1：流批一体成为默认**

- Paimon / Iceberg / Hudi 都原生支持流批。
- Lambda 架构逐渐退出。

**趋势 2：Flink 2.0**

- 性能优化、API 简化。
- 流批融合更彻底。

**趋势 3：AI 原生流批**

- Flink + AI Functions。
- 自治流处理。

**趋势 4：流式数据库崛起**

- Materialize / Decodable / Fluss。
- 流式 SQL 替代部分传统数仓。

**趋势 5：边缘流处理**

- Flink on 边缘、IoT。
- 边缘 AI 决策。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：阿里 Flink + Paimon（实时数仓）**

- **数据规模**：PB 级。
- **架构**：Flink + Kafka + Paimon + Hologres。
- **效果**：流批融合，支撑双 11 实时大屏。

**案例 2：字节跳动 Flink + Iceberg**

- **数据规模**：PB 级。
- **架构**：Flink + Kafka + Iceberg + StarRocks。
- **效果**：实时入湖 + 批量查询统一。

**案例 3：腾讯 Flink + Hudi**

- **数据规模**：PB 级。
- **架构**：Flink + Kafka + Hudi + ClickHouse。
- **效果**：流批融合，支撑微信实时业务。

### 6.2 踩坑与经验

**坑 1：表格式选错**

- **现象**：选 Delta 但 Flink 集成差。
- **解决**：Flink 选 Paimon，Spark 选 Delta，跨引擎选 Iceberg。

**坑 2：Changelog 未开启**

- **现象**：流式查询不到变更。
- **解决**：Paimon 开启 Changelog Producer。

**坑 3：状态爆炸**

- **现象**：OOM、TaskManager 挂掉。
- **解决**：TTL + 合理 Key 设计。

**坑 4：流批性能差异**

- **现象**：批性能不如专用批。
- **解决**：评估 + 测试 + 性能调优。

**坑 5：Schema Evolution 失败**

- **现象**：上游改字段，流批都不通。
- **解决**：Schema Evolution + CI/CD 测试。

### 6.3 落地路径（0→1, 1→10, 10→100）

**阶段 1：0 → 1（启动期，0-6 个月）**

- Lambda 双链路。
- 团队：2-3 数据工程师。

**阶段 2：1 → 10（扩展期，6-18 个月）**

- 迁移到 Kappa 或流批一体。
- 团队：5-10 + 架构师。

**阶段 3：10 → 100（规模化期，18-36 个月）**

- Flink + Paimon 流批一体。
- AI 原生集成。
- 团队：20-50 + 平台团队。

### 6.4 ROI 评估

**评估维度**：

- **代码复用**：一份代码流批共用，减少 50%。
- **存储成本**：一份存储，减少 50%。
- **运维效率**：一份引擎，运维成本降低 50%。
- **AI 友好度**：流批融合 + AI 原生。

**典型 ROI**：

- 阿里：双 11 实时大屏，零延迟。
- 字节：流批融合，成本降低 50%。
- 腾讯：实时业务支撑，成本降低 40%。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Lambda | Kappa | 流批一体 |
| --- | :---: | :---: | :---: |
| 代码复用 | 2 | 4 | 5 |
| 存储复用 | 2 | 4 | 5 |
| 性能 | 5 | 4 | 4 |
| 复杂度 | 3 | 4 | 4 |
| AI 友好 | 2 | 3 | 5 |

### 7.2 决策树

```
业务需求？
├── 复杂业务 + 高性能 + 双链路可接受
│   └── Lambda
├── 纯实时 + 重放
│   └── Kappa
├── 现代数据栈 + AI
│   └── 流批一体（Flink + Paimon）
└── 流式 SQL 数仓
    └── Materialize
```

### 7.3 组合使用

**组合 1：流批一体 + 实时 OLAP**

- 流批一体存储 + StarRocks / Doris 查询。
- 适用：实时数仓。

**组合 2：流批一体 + 向量库**

- 流批一体存储 + LanceDB / Milvus。
- 适用：AI 应用。

**组合 3：流批一体 + 知识图谱**

- 流批一体存储 + Neo4j。
- 适用：GraphRAG。

---

## 8. 面试真题集

# stream-batch-unified 面试真题集

> **一句话定位**：Flink + Iceberg / Praveza / Hudi。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 9 个原 PDF 子章节、共 49 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §8.1 | Lambda架构基础概念 | 8.1.1, 8.1.2, 8.1.3, 8.1.4, 8.1.5 | 5 | 主 |
| §8.2 | 批流数据同步机制 | 8.2.1, 8.2.2, 8.2.3, 8.2.4, 8.2.5 | 5 | 主 |
| §13.5 | 实时数仓与数据湖架构融合及演进 | 13.5.1 ~ 13.5.7（共 7） | 7 | 辅 |
| §14.1 | 基于统⼀流处理架构的实时数仓构建 | 14.1.1 ~ 14.1.6（共 6） | 6 | 主 |
| §14.3 | Lambda与Kappa架构基础概念辨析 | 14.3.1, 14.3.2, 14.3.3, 14.3.4, 14.3.5 | 5 | 主 |
| §14.6 | 流批⼀体与数据湖集成实践 | 14.6.1, 14.6.2, 14.6.3, 14.6.4, 14.6.5 | 5 | 辅 |
| §14.7 | 从Lambda到Kappa的架构迁移策略与挑战 | 14.7.1 ~ 14.7.6（共 6） | 6 | 辅 |
| §17.3 | 批流⼀体技术栈选型 | 17.3.1, 17.3.2, 17.3.3, 17.3.4, 17.3.5 | 5 | 辅 |
| §19.3 | Lambda架构与实时数据处理 | 19.3.1, 19.3.2, 19.3.3, 19.3.4, 19.3.5 | 5 | 辅 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §8 构建统⼀数据服务的Lambda架构实践 > 本主题涵盖 2 个子节、10 道题。

#### 2.1.1 Lambda架构基础概念

> 来源：原 PDF §8.1，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §8.1.1 | ★★★☆☆ |
| §8.1.2 | ★★★☆☆ |
| §8.1.3 | ★★★☆☆ |
| §8.1.4 | ★★★☆☆ |
| §8.1.5 | ★★★★☆ |

- **§8.1.1**：请阐述在Lambda架构中，如何确保批处理层和速度层输出结果的⼀致性，并最终
- **§8.1.2**：在Lambda架构中，批处理层和速度层分别承担什么⻆⾊？它们各⾃的优缺点是什
- **§8.1.3**：请解释Lambda架构的基本概念，并说明它主要由哪⼏层组成？
- **§8.1.4**：在设计⼀个万节点级别的Lambda架构时，除了批处理和流处理技术选型，还需要
- **§8.1.5**：随着数据湖和实时计算技术的发展，Lambda架构也⾯临Kappa架构等新架构的挑

#### 2.1.2 批流数据同步机制

> 来源：原 PDF §8.2，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §8.2.1 | ★★★☆☆ |
| §8.2.2 | ★★★☆☆ |
| §8.2.3 | ★★★☆☆ |
| §8.2.4 | ★★★☆☆ |
| §8.2.5 | ★★★★☆ |

- **§8.2.1**：在实现批流数据同步时，通常会遇到哪些技术挑战？请⾄少列举三个并简要说明。
- **§8.2.2**：请简要解释Lambda架构中批处理层和流处理层各⾃的作⽤，并说明为什么需要在
- **§8.2.3**：随着数据架构向流批⼀体（如Apache Flink）演进，Lambda架构⾯临哪些局限
- **§8.2.4**：请描述⼀种在万节点规模的⼤数据平台中，确保批处理层（如Hadoop/Spark）与
- **§8.2.5**：在数据湖环境中，如何设计⼀个⾼效的批流数据融合机制，以⽀持下游统⼀的实时

### 2.2 §13 Flink、Kafka、ClickHouse在实时场景的应⽤

> 本主题涵盖 1 个子节、7 道题。

#### 2.2.5 实时数仓与数据湖架构融合及演进

> 来源：原 PDF §13.5，收录 7 道题。（辅）

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

### 2.3 §14 统⼀流处理架构的挑战与落地 > 本主题涵盖 4 个子节、22 道题。

#### 2.3.1 基于统⼀流处理架构的实时数仓构建

> 来源：原 PDF §14.1，收录 6 道题。

| 题号 | 难度 |
| --- | :---: |
| §14.1.1 | ★★★☆☆ |
| §14.1.2 | ★★★☆☆ |
| §14.1.3 | ★★★☆☆ |
| §14.1.4 | ★★★☆☆ |
| §14.1.5 | ★★★★☆ |
| §14.1.6 | ★★★★☆ |

- **§14.1.1**：在万节点集群环境下，构建统⼀流处理架构时，你会如何设计集群资源调度与任务
- **§14.1.2**：请简要说明在实时数仓的分层设计中，ODS、DWD、DWS和ADS层各⾃的核⼼作
- **§14.1.3**：请解释在基于流处理的近实时BI场景中，如何平衡数据的实时性与查询性能，并说
- **§14.1.4**：请描述在实时数仓构建过程中，你会采⽤哪些关键指标和技术⼿段来监控和保障
- **§14.1.5**：请结合具体案例，说明如何利⽤统⼀流处理架构实现从数据接⼊到数据服务API暴
- **§14.1.6**：请阐述在统⼀流处理架构下，如何设计数据⾎缘追踪系统，以确保实时数据处理

#### 2.3.3 Lambda与Kappa架构基础概念辨析

> 来源：原 PDF §14.3，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §14.3.1 | ★★★☆☆ |
| §14.3.2 | ★★★☆☆ |
| §14.3.3 | ★★★☆☆ |
| §14.3.4 | ★★★☆☆ |
| §14.3.5 | ★★★★☆ |

- **§14.3.1**：请简要解释Lambda架构和Kappa架构的核⼼思想，并说明它们各⾃由哪些主要组
- **§14.3.2**：当企业需要从Lambda架构迁移到Kappa架构时，请分析在数据⼀致性、系统迁移
- **§14.3.3**：在Lambda架构中，批处理层和速度层分别承担什么职责？这种职责分离的设计会
- **§14.3.4**：结合当前数据湖、流批⼀体（如Apache Flink）和云原⽣技术的发展趋势，你认
- **§14.3.5**：Kappa架构主张只保留流处理层，请阐述它是如何通过单⼀的技术栈来处理实时

#### 2.3.6 流批⼀体与数据湖集成实践

> 来源：原 PDF §14.6，收录 5 道题。（辅）

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

#### 2.3.7 从Lambda到Kappa的架构迁移策略与挑战

> 来源：原 PDF §14.7，收录 6 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §14.7.1 | ★★★☆☆ |
| §14.7.2 | ★★★☆☆ |
| §14.7.3 | ★★★☆☆ |
| §14.7.4 | ★★★☆☆ |
| §14.7.5 | ★★★★☆ |
| §14.7.6 | ★★★★☆ |

- **§14.7.1**：请描述在迁移过程中，处理技术债务（例如对原有批处理代码的依赖、双轨运⾏系
- **§14.7.2**：请简要说明Lambda架构和Kappa架构的核⼼区别，并阐述Kappa架构相⽐Lamb
- **§14.7.3**：假设在迁移后，发现某些特定复杂分析场景在纯流处理架构下性能或成本不佳，
- **§14.7.4**：在架构迁移期间，如何设计数据⼀致性和正确性验证机制，以确保流处理结果与
- **§14.7.5**：在Kappa架构下，当需要重新处理历史数据（例如因业务逻辑变更）时，请设计
- **§14.7.6**：在从Lambda架构迁移到Kappa架构的过程中，如何设计⼀个⽅案来确保流处理层

### 2.4 §17 构建新⼀代统⼀的数据架构 > 本主题涵盖 1 个子节、5 道题。

#### 2.4.3 批流⼀体技术栈选型

> 来源：原 PDF §17.3，收录 5 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §17.3.1 | ★★★☆☆ |
| §17.3.2 | ★★★☆☆ |
| §17.3.3 | ★★★☆☆ |
| §17.3.4 | ★★★☆☆ |
| §17.3.5 | ★★★★☆ |

- **§17.3.1**：在批流⼀体技术栈选型中，Apache Flink和Apache Spark Structured Streaming
- **§17.3.2**：请结合数据湖仓⼀体的背景，设计⼀个基于批流⼀体架构（例如选择Flink或Spar
- **§17.3.3**：在超⼤规模集群中部署和管理批流⼀体平台时，如何实现资源的⾼效隔离与弹性
- **§17.3.4**：请解释批流⼀体架构的基本概念，并阐述它相⽐传统的Lambda架构有哪些核⼼优
- **§17.3.5**：对于⼀个要求⾼吞吐、Exactly-Once语义且需要与多种外部系统（如Kafka、HB

### 2.5 §19 未来3-5年技术路线图制定与团队能⼒建设 > 本主题涵盖 1 个子节、5 道题。

#### 2.5.3 Lambda架构与实时数据处理

> 来源：原 PDF §19.3，收录 5 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §19.3.1 | ★★★☆☆ |
| §19.3.2 | ★★★☆☆ |
| §19.3.3 | ★★★☆☆ |
| §19.3.4 | ★★★☆☆ |
| §19.3.5 | ★★★★☆ |

- **§19.3.1**：随着实时计算需求的增⻓，纯粹的Lambda或Kappa架构可能⾯临新的挑战。请探
- **§19.3.2**：在⼀个⼤规模数据平台中，为什么Lambda架构中的批处理层和速度层通常会使⽤
- **§19.3.3**：请简要解释Lambda架构和Kappa架构的核⼼思想，并说明它们各⾃的主要优缺
- **§19.3.4**：在规划⼀个万节点级别的Lambda架构集群时，你会如何设计批处理层和速度层的
- **§19.3.5**：假设现有Lambda架构的维护成本过⾼，团队希望向Kappa架构迁移。请描述⼀个

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **实时与流处理架构**
- **数据建模与仓库建设**
- **架构演进与未来趋势**
- **湖仓与存储架构**

## 4 本章小结

> 本面试真题集收录 49 道题，覆盖 5 个原 PDF 主题、9 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
