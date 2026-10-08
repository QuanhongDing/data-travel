# 实时计算（Realtime Compute）

> **一句话定位**：以 Flink / Spark Streaming / Kafka Streams 为核心的低延迟、状态化、Exactly-Once 流处理引擎，是实时数据栈的"实时算力"。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**09 实时计算**）。覆盖 **R4 数据全栈协同** 能力领域中「流处理引擎、状态管理、Exactly-Once、Flink CDC、AI 时代演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 实时计算 vs 离线计算的本质区别？ | §1.1 |
| Flink / Spark Streaming / Kafka Streams 怎么选？ | §7.1 |
| Flink 1.19+ / 2.0 有哪些 2024-2025 新特性？ | §5.3 |
| Exactly-Once 怎么实现？ | §2.3 |
| Flink CDC 怎么落地？ | §4.2 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：实时计算（Realtime Compute / Stream Processing）是一种**对持续到达的事件流进行低延迟（毫秒 - 秒级）、状态化、Exactly-Once 处理**的计算范式。它强调**实时性优先、准确性兼顾**。

**工程定义**：在数据架构师手里，实时计算是**一份以 Flink / Spark Streaming 为核心、对 TB 级流数据进行秒级产出**的处理能力。核心特征：

- **事件驱动**：处理持续到达的事件流。
- **低延迟**：毫秒 - 秒级延迟。
- **状态化**：维护计算状态（聚合、Join、CEP）。
- **Exactly-Once**：精确一次语义（去重、不漏）。
- **反压处理**：背压机制（Backpressure）。

**与离线计算的本质区别**：见 §08 章 §1.1。

### 1.2 为什么需要

**业务驱动力**：

- **实时监控**：业务指标秒级刷新。
- **实时推荐**：用户行为 → 实时特征 → 实时推荐。
- **实时风控**：交易 → 实时风控 → 秒级决策。
- **实时告警**：异常事件秒级告警。
- **实时看板**：双 11 大屏实时刷新。

**痛点（没有实时计算的代价）**：

1. **业务决策滞后**：T+1 数据无法支撑实时决策。
2. **风控失效**：欺诈交易事后才发现。
3. **用户体验差**：推荐延迟 1 小时。

**AI 时代的新诉求**：

- **实时特征**：在线推理需要实时特征。
- **流式 Embedding**：实时文档向量化。
- **Agent 决策**：智能体需要实时事件流。
- **在线学习**：模型实时更新。

### 1.3 在 AI 时代数据架构中的位置

```
[Kafka / Pulsar]
        ↓
[实时计算：Flink / Spark Streaming]
        ├── 流式 ETL
        ├── 实时聚合
        ├── 实时特征
        └── 流式 Embedding
        ↓
[实时数仓 / 特征库 / 在线推理 / Agent]
```

**实时计算是实时数据栈的"实时算力"**：把数据从"流动"变成"可用"。

### 1.4 演进历程

**第一阶段：Storm 时代（2011-2016）**

- 2011：Twitter 开源 Storm，实时流处理鼻祖。
- 2013-2016：Storm + Kafka + HBase Lambda 架构。

**第二阶段：Spark Streaming（2014-2018）**

- 2014：Spark Streaming（微批模型）。
- 2016：Spark Structured Streaming。
- 2017-2018：Spark Streaming 主导实时。

**第三阶段：Flink 时代（2016-2022）**

- 2016：Flink 1.0，Apache 顶级项目。
- 2018：Flink 1.5 + Blink 合并，阿里主导。
- 2020：Flink 1.11 + CDC，Flink 中文社区壮大。

**第四阶段：流批一体（2022-2024）**

- 2022：Flink + Iceberg / Hudi 流批一体。
- 2023：Flink 1.17 / 1.18，Paimon 衍生。
- 2024：Flink 1.19+、Decodable SaaS。

**第五阶段：AI 原生（2024-至今）**

- 2024：Flink + AI Functions、Flink 2.0 路线。
- 2025：流式 LLM / 流式 Agent。

**一句话总结**：**实时计算从"Storm 微流"→"Spark 微批"→"Flink 真正流"→"流批一体"→"AI 原生"五阶段演进，今天 Flink 是事实标准。**

---

## 2. 核心原理

### 2.1 关键概念定义

**流（Stream）**：无界、连续的事件序列。

**窗口（Window）**：

- **滚动窗口（Tumbling）**：固定大小、无重叠。
- **滑动窗口（Sliding）**：固定大小、可重叠。
- **会话窗口（Session）**：基于事件间隔。
- **全局窗口（Global）**：所有事件一个窗口。

**水位线（Watermark）**：

- 衡量事件时间进度的机制。
- 解决乱序事件问题。
- `Watermark(t)` 表示「t 时刻之前的事件都到了」。

**状态（State）**：

- **Keyed State**：按 key 分区的状态（ValueState / ListState / MapState）。
- **Operator State**：算子状态（源/汇算子）。

**状态后端（State Backend）**：

- **MemoryStateBackend**：内存（开发用）。
- **FsStateBackend**：文件系统（生产用）。
- **RocksDBStateBackend**：RocksDB（大数据量）。

**Checkpoint**：

- 周期性持久化算子状态。
- 实现容错 + Exactly-Once。

**Savepoint**：

- 手动触发的 Checkpoint。
- 用于版本管理、升级。

**Exactly-Once 语义**：

- 每条事件只被处理一次，不重不漏。
- 实现：Flink Checkpoint + Kafka EOS + 幂等 Sink。

**反压（Backpressure）**：

- 下游处理速度 < 上游流入速度。
- Flink 通过信用机制（Credit-based）自动反压。

**Flink CDC**：

- 基于数据库 binlog 的实时变更捕获。
- 无需 Debezium，Flink 原生支持。

### 2.2 数学 / 形式化基础

**事件时间 vs 处理时间**：

- **Event Time**：事件实际发生时间。
- **Processing Time**：算子处理时间。
- **Ingestion Time**：数据进入 Flink 的时间。

**Watermark 的数学定义**：

```
Watermark(t) = max(arrival_time) - max_out_of_orderness
```

Watermark 表示「t 时刻之前的事件基本都到了」。

**Checkpoint 的形式化（Chandy-Lamport 算法）**：

- **Barrier**：Checkpoint 边界标记，随数据流传播。
- **对齐（Alignment）**：Barrier 到达时，算子等待所有输入 Barrier 到齐。
- **快照**：Barrier 对齐后，异步持久化状态。
- **恢复**：从最近 Checkpoint 恢复。

**Exactly-Once 的实现原理**：

```
Source EOS + Checkpoint + Sink Two-Phase Commit = End-to-End EOS
```

- **Source EOS**：Kafka offset 在 Checkpoint 中持久化。
- **Sink Two-Phase Commit**：预写 + 提交（Kafka Transaction / 文件 Two-Phase）。

**窗口数学**：

- 滚动窗口：W(t) = [t, t + window_size)
- 滑动窗口：W(t) = [t - window_slide, t + window_size - window_slide)

### 2.3 关键算法 / 方法

**1. Flink 流处理核心 API**：

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(60000);  // 1 分钟 Checkpoint

DataStream<Order> orders = env
    .addSource(new FlinkKafkaConsumer<>("orders", new OrderDeserializer(), kafkaProps))
    .keyBy(order -> order.userId)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .reduce(new OrderReduce());

orders.addSink(new ClickHouseSink());
env.execute("Realtime Order");
```

**2. Watermark + Event Time**：

```java
DataStream<Order> orders = env
    .addSource(...)
    .assignTimestampsAndWatermarks(
        WatermarkStrategy.<Order>forBoundedOutOfOrderness(Duration.ofSeconds(5))
            .withTimestampAssigner((order, ts) -> order.getOrderTime())
    );
```

**3. Flink Checkpoint + State**：

```java
// Checkpoint 配置
env.enableCheckpointing(60000);  // 1 分钟
env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
env.getCheckpointConfig().setMinPauseBetweenCheckpoints(500);
env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);
env.setStateBackend(new RocksDBStateBackend("s3://checkpoints"));
```

**4. Flink CDC**：

```java
// MySQL CDC Source
MySqlSource<String> source = MySqlSource.<String>builder()
    .hostname("mysql-host")
    .port(3306)
    .databaseList("orders")
    .tableList("orders.order_info")
    .username("cdc")
    .password("***")
    .deserializer(new JsonDebeziumDeserializationSchema())
    .build();

env.fromSource(source, WatermarkStrategy.noWatermarks(), "MySQL CDC")
   .addSink(new IcebergSink());
```

**5. Spark Structured Streaming**：

```python
df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "orders") \
    .load()

result = df.selectExpr("CAST(value AS STRING)").groupBy("user_id").count()

query = result.writeStream \
    .format("iceberg") \
    .option("path", "iceberg.user_orders") \
    .outputMode("complete") \
    .trigger(processingTime="1 minute") \
    .start()
```

**6. Kafka Streams**：

```java
StreamsBuilder builder = new StreamsBuilder();
KStream<String, Order> orders = builder.stream("orders");
KTable<String, Long> userOrderCount = orders
    .groupBy((key, order) -> order.getUserId().toString())
    .count();
userOrderCount.toStream().to("user_order_count");
```

**7. 反压处理**：

- **Flink**：自动反压（Credit-based）。
- **Spark Streaming**：通过 Backpressure 配置。
- **Kafka Streams**：通过缓冲和限流。

### 2.4 与相邻概念的关系

**实时 vs 离线**：见 §08 章 §1.1。

**Flink vs Spark Streaming**：

- **Flink**：真正的流处理（Event Time、状态、窗口）。
- **Spark Streaming**：微批（Mini-Batch）。

**Flink vs Kafka Streams**：

- **Flink**：重量级、完整流处理引擎。
- **Kafka Streams**：轻量级、嵌入 Kafka 应用。

**Flink CDC vs Debezium**：

- **Flink CDC**：Flink 原生支持，简化链路。
- **Debezium**：独立服务，通过 Kafka Connect。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Lambda 架构（流 + 批）**

- 实时层 Flink + 批处理层 Spark。
- 适用：传统实时业务。

**模式 2：Kappa 架构（仅流）**

- 全部数据走 Kafka + Flink。
- 适用：纯实时。

**模式 3：流批一体（Flink + Iceberg/Paimon）**

- Flink 同时跑流批，存储用 Iceberg / Paimon。
- 适用：现代数据栈。

**模式 4：Flink CDC 实时入湖**

- Flink CDC → Iceberg / Paimon。
- 适用：实时数仓 + Lakehouse。

**模式 5：实时特征工程**

- Flink 实时计算 → 特征库（Feast / Tecton）。
- 适用：在线推理。

**模式 6：流式 ML / 在线学习**

- Flink 实时特征 + 模型在线学习。
- 适用：实时推荐 / 风控。

**模式 7：流式 LLM / Agent**

- Flink 实时事件 → LLM 处理。
- 适用：AI Agent 实时决策。

### 3.2 适用场景决策表

| 业务场景 | 推荐引擎 | 典型技术栈 |
| --- | --- | --- |
| 复杂流处理（CEP） | Flink | Flink + RocksDB + Kafka |
| 实时数仓 | Flink + Paimon | Flink + Kafka + Paimon + StarRocks |
| 实时监控 | Flink / Spark Streaming | Flink + ClickHouse |
| 实时特征 | Flink + Feast | Flink + Kafka + Feast |
| 简单流处理 | Kafka Streams | Kafka Streams |
| 流批一体 | Flink + Iceberg | Flink + Iceberg + Kafka |
| 实时入湖 | Flink CDC | Flink CDC + Iceberg/Paimon |
| AI Agent 实时 | Flink + LLM | Flink + Kafka + LLM |

### 3.3 反模式与陷阱

**反模式 1：忽视状态管理**

- 状态爆炸导致 OOM。
- **正确**：合理 State Backend + TTL。

**反模式 2：未启用 Checkpoint**

- 故障后数据丢失。
- **正确**：启用 Checkpoint + Exactly-Once。

**反模式 3：窗口设置不合理**

- 窗口过大 → 状态爆炸。
- 窗口过小 → 数据不完整。
- **正确**：合理窗口 + Watermark。

**反模式 4：数据倾斜**

- 部分 Task 处理慢。
- **正确**：rebalance + 自定义分区。

**反模式 5：滥用 Timer**

- Timer 过多 → 调度慢。
- **正确**：减少 Timer，使用窗口代替。

**反模式 6：未做反压监控**

- 反压导致延迟高。
- **正确**：Flink Web UI + 监控告警。

**反模式 7：依赖过时 API**

- 使用 Flink 弃用的 API。
- **正确**：升级 Flink 版本，使用最新 API。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型引擎（1-2 周）**

- 复杂流处理：Flink。
- 简单流处理：Kafka Streams。
- 微批：Spark Streaming。

**Step 2：集群规划（2-4 周）**

- JobManager / TaskManager。
- 内存 / CPU 配置。
- State Backend 选型。

**Step 3：Checkpoint 配置（1-2 周）**

- 间隔（1-5 分钟）。
- 状态后端（RocksDB）。
- 持久化（HDFS / S3）。

**Step 4：Flink CDC 接入（2-4 周）**

- MySQL / PostgreSQL binlog。
- Schema Evolution。
- 异常处理。

**Step 5：监控告警（1-2 周）**

- Flink Web UI + Prometheus + Grafana。
- Checkpoint 失败、延迟、状态大小。

**Step 6：AI 集成（按需）**

- 实时特征 + LLM。
- 流式 Agent。

### 4.2 关键技术点

**1. Flink Checkpoint 配置**

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

env.enableCheckpointing(60000);  // 1 分钟
env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
env.getCheckpointConfig().setMinPauseBetweenCheckpoints(500);
env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);
env.getCheckpointConfig().setTolerableCheckpointFailureNumber(3);
env.getCheckpointConfig().setExternalizedCheckpointRetention(
    ExternalizedCheckpointRetention.RETAIN_ON_CANCELLATION
);
env.setStateBackend(new RocksDBStateBackend("s3://flink-checkpoints"));
```

**2. Flink CDC 实时入湖**

```java
// Flink CDC → Iceberg
TableEnvironment tEnv = ...;

tEnv.executeSql("""
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

tEnv.executeSql("""
    CREATE TABLE iceberg_orders (...)
    WITH (
      'connector' = 'iceberg',
      'catalog-name' = 'hive_prod',
      'uri' = 'thrift://metastore:9083'
    )
""");

tEnv.executeSql("INSERT INTO iceberg_orders SELECT * FROM orders_cdc");
```

**3. Flink Watermark + Event Time**

```java
DataStream<Order> orders = env
    .addSource(kafkaSource)
    .assignTimestampsAndWatermarks(
        WatermarkStrategy
            .<Order>forBoundedOutOfOrderness(Duration.ofSeconds(5))
            .withTimestampAssigner((order, recordTimestamp) -> 
                order.getOrderTime().toEpochMilli())
    )
    .keyBy(Order::getUserId)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .aggregate(new OrderAggregate());
```

**4. 实时特征工程**

```java
// Flink 实时特征计算
DataStream<UserFeature> features = orders
    .keyBy(Order::getUserId)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .aggregate(new UserFeatureAggregate());

// 写入特征库（Feast / Tecton / 自研）
features.addSink(new FeatureStoreSink());
```

**5. 反压处理**

```java
// Flink 自动反压
env.getConfig().setBufferTimeout(10);  // 缓冲超时

// 检查反压
// Flink Web UI → Backpressure tab
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**流处理引擎（2024-2025）**：

| 工具 | 版本 | 特点 |
| --- | --- | --- |
| Apache Flink | 1.19+ | 事实标准流处理 |
| Apache Spark Structured Streaming | 3.5+ | 微批流处理 |
| Apache Kafka Streams | 3.7+ | 轻量级、嵌入式 |
| Apache Beam | 2.5x | 跨引擎统一 API |
| Materialize | - | 实时数仓（流式 SQL） |
| Decodable（2024） | - | 流式 SaaS |

**Flink CDC**：

| 工具 | 特点 |
| --- | --- |
| Flink CDC | Flink 原生、MySQL / PostgreSQL / MongoDB |
| Debezium | 独立 CDC、Kafka Connect |
| Canal | 阿里系、MySQL Binlog |

**资源调度**：

- YARN：传统。
- K8s：云原生（Flink Operator）。
- Standalone：开发。

**Flink 平台**：

- 阿里云实时计算 Flink 版（VVR）。
- AWS Kinesis Data Analytics。
- 腾讯云流计算 Oceanus。

### 4.4 代码 / 示例

**示例 1：Flink + Kafka + Iceberg 完整实时数仓**

```java
// Flink CDC 实时入湖
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(60000);

EnvironmentSettings settings = EnvironmentSettings.inStreamingMode();
TableEnvironment tEnv = TableEnvironment.create(settings);
tEnv.getConfig().set("table.exec.source.idle-timeout", "10s");

// MySQL CDC Source
MySqlSource<String> source = MySqlSource.<String>builder()
    .hostname("mysql-host")
    .port(3306)
    .databaseList("shop")
    .tableList("shop.orders")
    .username("cdc")
    .password("***")
    .deserializer(new JsonDebeziumDeserializationSchema())
    .build();

DataStream<String> stream = env.fromSource(
    source, WatermarkStrategy.noWatermarks(), "MySQL CDC"
);

// 写入 Iceberg
tEnv.executeSql("""
    CREATE TABLE iceberg_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      order_time TIMESTAMP(3)
    ) WITH (
      'connector' = 'iceberg',
      'catalog-name' = 'hive_prod',
      'uri' = 'thrift://metastore:9083'
    )
""");

tEnv.createTemporaryView("orders_cdc", stream);
tEnv.executeSql("""
    INSERT INTO iceberg_orders
    SELECT
      CAST(JSON_VALUE(value, '$.order_id') AS BIGINT) AS order_id,
      CAST(JSON_VALUE(value, '$.user_id') AS BIGINT) AS user_id,
      CAST(JSON_VALUE(value, '$.amount') AS DECIMAL(18,2)) AS amount,
      TO_TIMESTAMP(JSON_VALUE(value, '$.order_time')) AS order_time
    FROM orders_cdc
""");
```

**示例 2：Flink + Paimon 流批一体（2024 主流）**

```java
// Flink + Paimon 流式入湖
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

tEnv.executeSql("""
    CREATE TABLE paimon_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      ts TIMESTAMP(3),
      PRIMARY KEY (order_id) NOT ENFORCED
    ) WITH (
      'connector' = 'paimon',
      'path' = 's3://lake/paimon/orders'
    )
""");

// 流式 INSERT（带 Changelog）
tEnv.executeSql("""
    INSERT INTO paimon_orders
    SELECT * FROM kafka_orders
""");
```

**示例 3：Flink 实时特征工程**

```java
// 实时计算用户最近 5 分钟订单 GMV
DataStream<Order> orders = ...;

DataStream<UserFeature> features = orders
    .keyBy(Order::getUserId)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .aggregate(new FeatureAggregate());

// 写入特征库
features.addSink(new FeatureStoreSink());

// Aggregate Function
public static class FeatureAggregate implements AggregateFunction<Order, UserFeatureAccumulator, UserFeature> {
    @Override
    public UserFeatureAccumulator createAccumulator() {
        return new UserFeatureAccumulator();
    }
    
    @Override
    public UserFeatureAccumulator add(Order order, UserFeatureAccumulator acc) {
        acc.gmv += order.getAmount();
        acc.orders += 1;
        return acc;
    }
    
    @Override
    public UserFeature getResult(UserFeatureAccumulator acc) {
        return new UserFeature(acc.userId, acc.gmv, acc.orders);
    }
    
    @Override
    public UserFeatureAccumulator merge(UserFeatureAccumulator a, UserFeatureAccumulator b) {
        a.gmv += b.gmv;
        a.orders += b.orders;
        return a;
    }
}
```

**示例 4：Flink 反压监控**

```bash
# Flink Web UI 监控
http://jobmanager:8081

# 反压指标（REST API）
curl http://taskmanager:8081/...

# Prometheus 集成
curl http://jobmanager:8081/metrics
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：Flink + AI Functions**

- Flink 集成 LLM、Embedding。
- 流式 LLM 调用。
- 工具：Flink AI Functions（2024 路线）。

**演进方向 2：流式 RAG**

- Flink 实时处理 → Embedding → 向量库 → RAG。
- 工具：Flink + LanceDB / Milvus。

**演进方向 3：流式 Agent**

- Flink 实时事件 → Agent 决策。
- 工具：Flink + LangChain / AutoGen。

**演进方向 4：实时特征工程**

- Flink + Feast / Tecton。
- 在线学习（Online Learning）。

**演进方向 5：Flink 2.0 路线**

- 性能优化、API 简化。
- 自适应调度。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**流式 RAG**：

- Flink 处理文档流 → Embedding → 向量库。
- 工具：Flink AI Functions + LanceDB。

**流式 GraphRAG**：

- Flink 实时事件 → 实体关系抽取 → 知识图谱。
- 工具：Flink + Neo4j Connector。

**实时特征 + 向量库**：

- Flink 实时特征 → 在线推理。
- 工具：Flink + Feast + Milvus。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **Flink 论文（VLDB 2024）**：流处理引擎架构演进。
- **Flink CDC 论文（2024）**：Flink 原生 CDC 优化。
- **Flink 2.0 路线图（2024）**：自适应调度、API 简化。

**工业进展**：

- **Apache Flink 1.19+（2024）**：Adaptive Scheduler、SQL 增强。
- **Apache Flink CDC 3.x（2024）**：无锁读取、Paimon 集成。
- **Materialize 1.x（2024）**：流式 SQL 数据库。
- **Decodable（2024）**：流式 SaaS。

### 5.4 未来 3-5 年趋势

**趋势 1：Flink 2.0**

- 性能优化、API 简化。
- 自适应调度。

**趋势 2：流式 AI / Agent**

- Flink + LLM / Agent 成为主流。
- 实时智能决策。

**趋势 3：流批一体成熟**

- Flink + Paimon / Iceberg。
- 流批不再分家。

**趋势 4：自治流处理**

- AI 自动调优、自适应。
- 自治 Flink。

**趋势 5：边缘流处理**

- Flink on 边缘（IoT 设备）。
- 边缘 AI。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：阿里 Blink + Flink（双 11 实时大屏）**

- **数据规模**：万亿级事件。
- **架构**：Blink + Flink + Hologres。
- **效果**：秒级实时大屏。

**案例 2：字节跳动 Flink（万亿级实时）**

- **数据规模**：PB 级。
- **架构**：Flink + Kafka + ClickHouse。
- **效果**：支撑抖音、TikTok 实时业务。

**案例 3：Netflix Flink + Iceberg**

- **数据规模**：EB 级。
- **架构**：Flink + Iceberg + Pinot。
- **效果**：实时 AB 测试。

### 6.2 踩坑与经验

**坑 1：状态爆炸**

- **现象**：OOM、TaskManager 挂掉。
- **解决**：RocksDB + TTL + 合理 Key 设计。

**坑 2：Checkpoint 失败**

- **现象**：作业失败、数据丢失。
- **解决**：持久化到 S3/OSS + 监控告警。

**坑 3：数据倾斜**

- **现象**：部分 Task 慢。
- **解决**：rebalance + 自定义分区。

**坑 4：窗口设置不合理**

- **现象**：窗口内数据不完整 / 状态爆炸。
- **解决**：合理窗口 + Watermark。

**坑 5：CDC Schema 变更**

- **现象**：上游加字段，下游失败。
- **解决**：Flink CDC Schema Evolution。

**坑 6：反压未监控**

- **现象**：延迟高、不知原因。
- **解决**：Flink Web UI + 监控告警。

### 6.3 落地路径（0→1, 1→10, 10→100）

**阶段 1：0 → 1（启动期，0-6 个月）**

- Flink + Kafka + 简单 Sink。
- 团队：2-3 数据工程师。

**阶段 2：1 → 10（扩展期，6-18 个月）**

- Flink CDC + Iceberg / Paimon。
- 流批一体。
- 团队：5-10 + 架构师。

**阶段 3：10 → 100（规模化期，18-36 个月）**

- AI 原生 Flink + 实时特征。
- 团队：20-50 + 平台团队。

### 6.4 ROI 评估

**评估维度**：

- **实时性提升**：业务响应时间从 T+1 → 秒级。
- **决策效率**：实时决策支撑业务。
- **AI 友好度**：流式 AI / Agent。
- **成本控制**：Flink 资源利用率优化。

**典型 ROI**：

- 阿里 Blink：双 11 万亿级消息、零延迟。
- 字节 Flink：支撑全平台实时业务。
- Netflix：实时 AB 测试提升 10x。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Flink | Spark Streaming | Kafka Streams | Storm |
| --- | :---: | :---: | :---: | :---: |
| 实时性 | 5 | 4 | 5 | 5 |
| 状态管理 | 5 | 4 | 4 | 2 |
| Exactly-Once | 5 | 3 | 4 | 2 |
| 生态 | 5 | 5 | 4 | 3 |
| AI 友好 | 4 | 4 | 3 | 2 |

### 7.2 决策树

```
业务需求？
├── 复杂流处理（CEP / 状态）
│   └── Flink
├── 微批流处理
│   └── Spark Streaming
├── 简单流处理
│   └── Kafka Streams
└── AI 原生
    └── Flink + AI Functions
```

### 7.3 组合使用

**组合 1：Flink + Kafka + Paimon**

- Flink 流处理 + Paimon 实时数仓。
- 适用：实时数仓。

**组合 2：Flink + CDC + Iceberg**

- CDC 实时入湖。
- 适用：实时 Lakehouse。

**组合 3：Flink + ClickHouse**

- Flink 实时计算 + ClickHouse 实时查询。
- 适用：实时监控。

**组合 4：Flink + 特征库**

- 实时特征 + 在线推理。
- 适用：实时推荐 / 风控。

---

## 8. 面试真题集

# realtime-compute 面试真题集

> **一句话定位**：Flink / Blink 状态管理、Checkpoint、Exactly-Once、反压。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 10 个原 PDF 子章节、共 52 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §2.2 | 实时数据接⼊与流式采集 | 2.2.1, 2.2.2, 2.2.3, 2.2.4 | 4 | 辅 |
| §6.2 | Spark Streaming 基础与 DStream | 6.2.1 ~ 6.2.6（共 6） | 6 | 主 |
| §6.5 | Spark Streaming ⾼级特性与容错机制 | 6.5.1 ~ 6.5.7（共 7） | 7 | 主 |
| §13.1 | 实时数据处理核⼼组件基础概念与特性 | 13.1.1 ~ 13.1.6（共 6） | 6 | 主 |
| §13.2 | Flink与Kafka集成开发与数据流转 | 13.2.1, 13.2.2, 13.2.3, 13.2.4 | 4 | 主 |
| §13.3 | 实时数仓分层架构设计与数据建模 | 13.3.1, 13.3.2, 13.3.3, 13.3.4, 13.3.5 | 5 | 主 |
| §13.4 | 实时链路性能优化与稳定性保障 | 13.4.1 ~ 13.4.6（共 6） | 6 | 辅 |
| §14.4 | 流处理框架技术选型与对⽐ | 14.4.1, 14.4.2, 14.4.3, 14.4.4 | 4 | 辅 |
| §14.5 | ⼤规模集群下的流处理管道设计与调优 | 14.5.1, 14.5.2, 14.5.3, 14.5.4, 14.5.5 | 5 | 辅 |
| §18.4 | 实时特征计算与流式处理 | 18.4.1, 18.4.2, 18.4.3, 18.4.4, 18.4.5 | 5 | 辅 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §2 多源异构数据的实时与批量接⼊ > 本主题涵盖 1 个子节、4 道题。

#### 2.1.2 实时数据接⼊与流式采集

> 来源：原 PDF §2.2，收录 4 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §2.2.1 | ★★★☆☆ |
| §2.2.2 | ★★★☆☆ |
| §2.2.3 | ★★★☆☆ |
| §2.2.4 | ★★★☆☆ |

- **§2.2.1**：假设现在有⼀个业务场景，需要处理来⾃数千个数据源、峰值每秒百万级的异构数
- **§2.2.2**：在设计⼀个⾼吞吐、低延迟的实时数据接⼊管道时，除了消息队列本身，还需要考
- **§2.2.3**：请列举并简要说明在万节点⼤数据集群中，实时数据接⼊环节常⽤的三种主流消息
- **§2.2.4**：请⽐较Flink和Spark Streaming在实时数据接⼊与处理架构上的核⼼差异，并说明

### 2.2 §6 ⼤规模数据处理应⽤的开发与优化 > 本主题涵盖 2 个子节、13 道题。

#### 2.2.2 Spark Streaming 基础与 DStream

> 来源：原 PDF §6.2，收录 6 道题。

| 题号 | 难度 |
| --- | :---: |
| §6.2.1 | ★★★☆☆ |
| §6.2.2 | ★★★☆☆ |
| §6.2.3 | ★★★☆☆ |
| §6.2.4 | ★★★☆☆ |
| §6.2.5 | ★★★★☆ |
| §6.2.6 | ★★★★☆ |

- **§6.2.1**：在处理⼤规模实时数据流时，DStream 的背压机制（Backpressure）有什么作
- **§6.2.2**：在 Spark Streaming 应⽤中，窗⼝操作（Window Operations）的主要作⽤是什
- **§6.2.3**：请分析在使⽤ DStream API 时，可能导致数据延迟或处理性能瓶颈的常⻅因素，
- **§6.2.4**：请简要说明 Spark Streaming 的基本⼯作原理，并解释微批次处理模式的含义。
- **§6.2.5**：请阐述在 Spark Streaming 中，如何通过设置检查点（Checkpointing）机制来确
- **§6.2.6**：请描述 DStream 的核⼼概念，并说明它与 RDD 之间的关系。

#### 2.2.5 Spark Streaming ⾼级特性与容错机制

> 来源：原 PDF §6.5，收录 7 道题。

| 题号 | 难度 |
| --- | :---: |
| §6.5.1 | ★★★☆☆ |
| §6.5.2 | ★★★☆☆ |
| §6.5.3 | ★★★☆☆ |
| §6.5.4 | ★★★☆☆ |
| §6.5.5 | ★★★★☆ |
| §6.5.6 | ★★★★☆ |
| §6.5.7 | ★★★★★ |

- **§6.5.1**：请简要说明 Spark Streaming 与 Kafka 集成时，Direct API 和 Receiver-based
- **§6.5.2**：请解释在 Spark Streaming 与 Kafka 的集成中，'⾄少⼀次'（At-Least-Once）
- **§6.5.3**：为了实现 Spark Streaming 从 Kafka 消费数据时的 Exactly-Once 语义，需要协
- **§6.5.4**：在启⽤ Spark Streaming 的 WAL（Write-Ahead Log）功能时，它如何与 Kafka
- **§6.5.5**：请分析在超⼤规模（例如万节点级别）Spark 集群上运⾏ Spark Streaming 应⽤
- **§6.5.6**：在 Spark Streaming 应⽤中，如何通过设置检查点（Checkpointing）机制来实现
- **§6.5.7**：当 Spark Streaming 应⽤在处理 Kafka 数据过程中发⽣故障并重启后，如何确保

### 2.3 §13 Flink、Kafka、ClickHouse在实时场景的应⽤

> 本主题涵盖 4 个子节、21 道题。

#### 2.3.1 实时数据处理核⼼组件基础概念与特性

> 来源：原 PDF §13.1，收录 6 道题。

| 题号 | 难度 |
| --- | :---: |
| §13.1.1 | ★★★☆☆ |
| §13.1.2 | ★★★☆☆ |
| §13.1.3 | ★★★☆☆ |
| §13.1.4 | ★★★☆☆ |
| §13.1.5 | ★★★★☆ |
| §13.1.6 | ★★★★☆ |

- **§13.1.1**：请简要说明Flink、Kafka和ClickHouse在实时数据处理链路中各⾃扮演的主要⻆⾊
- **§13.1.2**：请解释Flink中的状态（State）是什么，并说明在实时数据处理中，为什么状态管
- **§13.1.3**：请⽐较Kafka与传统消息队列（如RabbitMQ）在设计和应⽤场景上的主要区别，
- **§13.1.4**：请详细描述Flink如何通过其检查点（Checkpoint）机制实现端到端的精确⼀次
- **§13.1.5**：请设计⼀个⾼可⽤、低延迟的实时数据处理架构，该架构需要整合Flink进⾏实时
- **§13.1.6**：在构建实时数仓时，为何经常选择将ClickHouse作为OLAP引擎？请结合其存储引

#### 2.3.2 Flink与Kafka集成开发与数据流转

> 来源：原 PDF §13.2，收录 4 道题。

| 题号 | 难度 |
| --- | :---: |
| §13.2.1 | ★★★☆☆ |
| §13.2.2 | ★★★☆☆ |
| §13.2.3 | ★★★☆☆ |
| §13.2.4 | ★★★☆☆ |

- **§13.2.1**：请简要说明Flink与Kafka集成的常⻅⽅式，并描述在实时数据消费场景中，Flink
- **§13.2.2**：当Flink从Kafka消费数据时，如果数据格式为JSON，请阐述在Flink程序中通常如
- **§13.2.3**：请详细解释在Flink与Kafka集成的数据流转管道中，如何实现端到端的Exactly-O
- **§13.2.4**：在⼀个⾼并发的实时数据处理场景中，如果Flink消费Kafka主题时出现数据倾斜

#### 2.3.3 实时数仓分层架构设计与数据建模

> 来源：原 PDF §13.3，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §13.3.1 | ★★★☆☆ |
| §13.3.2 | ★★★☆☆ |
| §13.3.3 | ★★★☆☆ |
| §13.3.4 | ★★★☆☆ |
| §13.3.5 | ★★★★☆ |

- **§13.3.1**：假设业务要求对万亿级别的实时数据在任意维度和指标上进⾏亚秒级查询，同时
- **§13.3.2**：请简要说明实时数仓中常⻅的ODS、DWD、DWS、ADS分层分别代表什么，以及
- **§13.3.3**：在基于Flink和ClickHouse构建实时数仓时，为什么通常会将DWD层明细数据存⼊
- **§13.3.4**：请描述在实时数仓的ODS到DWD层数据处理过程中，如何使⽤Flink处理Kafka中
- **§13.3.5**：当实时数仓中某个核⼼DWS层宽表的数据来源涉及多个不同刷新频率的流（如⼀

#### 2.3.4 实时链路性能优化与稳定性保障

> 来源：原 PDF §13.4，收录 6 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §13.4.1 | ★★★☆☆ |
| §13.4.2 | ★★★☆☆ |
| §13.4.3 | ★★★☆☆ |
| §13.4.4 | ★★★☆☆ |
| §13.4.5 | ★★★★☆ |
| §13.4.6 | ★★★★☆ |

- **§13.4.1**：请分析在Flink作业中，状态后端（State Backend）的不同选型（如RocksDB和H
- **§13.4.2**：ClickHouse的MergeTree系列表引擎有多种，请阐述在实时数据写⼊和查询场景
- **§13.4.3**：请简要说明Flink的Checkpoint机制是如何⼯作的，以及它在保证实时计算任务状
- **§13.4.4**：在Kafka中，如何根据业务场景和数据特性来设计合理的分区策略，以提升实时数
- **§13.4.5**：在⼀个⼤规模实时数仓场景中，如何设计端到端的Exactly-Once语义保证，涵盖
- **§13.4.6**：当Flink实时任务出现反压（Backpressure）时，你通常会从哪些⽅⾯进⾏排查和

### 2.4 §14 统⼀流处理架构的挑战与落地 > 本主题涵盖 2 个子节、9 道题。

#### 2.4.4 流处理框架技术选型与对⽐

> 来源：原 PDF §14.4，收录 4 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §14.4.1 | ★★★☆☆ |
| §14.4.2 | ★★★☆☆ |
| §14.4.3 | ★★★☆☆ |
| §14.4.4 | ★★★☆☆ |

- **§14.4.1**：请简要说明 Flink、Spark Streaming 和 Kafka Streams 这三种流处理框架各⾃
- **§14.4.2**：请深⼊分析 Flink 的流处理引擎在状态管理和容错机制⽅⾯，相⽐ Spark Streami
- **14.4.3**：假设你需要设计⼀个能够同时⽀撑实时推荐、实时⻛控和实时数据湖⼊湖的流处
- **§14.4.4**：在构建⼀个要求低延迟、⾼吞吐且需要精确⼀次（Exactly-Once）语义的实时数

#### 2.4.5 ⼤规模集群下的流处理管道设计与调优

> 来源：原 PDF §14.5，收录 5 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §14.5.1 | ★★★☆☆ |
| §14.5.2 | ★★★☆☆ |
| §14.5.3 | ★★★☆☆ |
| §14.5.4 | ★★★☆☆ |
| §14.5.5 | ★★★★☆ |

- **§14.5.1**：请描述在Lambda架构中，批处理层和速度层是如何协同⼯作的？并分析在什么业
- **§14.5.2**：请解释在流处理系统中，什么是数据倾斜？它通常会导致哪些具体问题？
- **§14.5.3**：假设你设计的⼀个实时数据管道，在业务⾼峰期出现了严重的处理延迟和数据积
- **§14.5.4**：在万节点规模的Spark Streaming或Flink集群中，为了保证端到端的精确⼀次（E
- **§14.5.5**：当流处理管道出现背压（Backpressure）时，通常有哪些应对策略？请简要说明

### 2.5 §18 ⼤数据平台如何赋能MLOps与特征⼯程 > 本主题涵盖 1 个子节、5 道题。

#### 2.5.4 实时特征计算与流式处理

> 来源：原 PDF §18.4，收录 5 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §18.4.1 | ★★★☆☆ |
| §18.4.2 | ★★★☆☆ |
| §18.4.3 | ★★★☆☆ |
| §18.4.4 | ★★★☆☆ |
| §18.4.5 | ★★★★☆ |

- **§18.4.1**：请列举并⽐较两种常⻅的流式处理框架（例如 Flink 和 Spark Streaming）在实时
- **§18.4.2**：请描述在构建⼀个实时特征平台时，如何设计特征存储（Feature Store）的架
- **§18.4.3**：请解释什么是实时特征计算，并说明它在机器学习模型推理阶段的重要性。
- **§18.4.4**：请说明在实时特征计算中，如何处理迟到数据（Late Data）以及如何保证特征计
- **§18.4.5**：请结合⼀个具体的业务场景（如实时推荐系统或⻛控系统），阐述如何设计和优化

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **AI/ML 集成与治理**
- **实时与流处理架构**
- **性能优化与调优**
- **数据建模与仓库建设**
- **架构演进与未来趋势**
- **集群容错与故障恢复**

## 4 本章小结

> 本面试真题集收录 52 道题，覆盖 5 个原 PDF 主题、10 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
