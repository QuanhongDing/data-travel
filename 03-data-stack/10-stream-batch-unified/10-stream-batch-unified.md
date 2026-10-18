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
-- Iceberg 批量读取（批模式）：按时间范围过滤，剪裁在元数据层完成
SELECT * FROM iceberg.orders
WHERE order_time BETWEEN '2025-01-01' AND '2025-01-31';
```

**增量读取（流模式）不是一条通用 SQL**：Iceberg 的增量语义是「取两个快照之间新增的数据文件」（V3 规范的能力条目之一，见 [03-lakehouse](../03-lakehouse/03-lakehouse.md) 的时间线），不是对某个「更新时间列」做 WHERE 过滤；引擎侧用什么语法把它暴露出来随版本变化，按你所装版本的连接器文档核对。

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

- [§3. 设计模式与范式](10-stream-batch-unified-section-3-sec3.md)
- [§4. 工程实现](10-stream-batch-unified-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](10-stream-batch-unified-section-5-ai.md)
- [§6. 落地实践](10-stream-batch-unified-section-6-sec6.md)
- [§7. 与其他方法对比](10-stream-batch-unified-section-7-sec7.md)
- [§8. 面试真题集](10-stream-batch-unified-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](10-stream-batch-unified-section-3-sec3.md)
- [§4. 工程实现](10-stream-batch-unified-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](10-stream-batch-unified-section-5-ai.md)
- [§6. 落地实践](10-stream-batch-unified-section-6-sec6.md)
- [§7. 与其他方法对比](10-stream-batch-unified-section-7-sec7.md)
- [§8. 面试真题集](10-stream-batch-unified-section-8-sec8.md)

---
