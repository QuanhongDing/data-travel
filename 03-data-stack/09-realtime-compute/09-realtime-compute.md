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

**第三阶段：Flink 时代（2014-2022）**

- 2014：Flink 从 Apache 孵化器毕业，成为顶级项目。
- 2016：Flink 1.0 发布【公开：Apache Flink 官方发布记录；「1.0 发布」与「2014 年毕业为顶级项目」是两件事，早期资料常把两者并作一行】。
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

- [§3. 设计模式与范式](09-realtime-compute-section-3-sec3.md)
- [§4. 工程实现](09-realtime-compute-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](09-realtime-compute-section-5-ai.md)
- [§6. 落地实践](09-realtime-compute-section-6-sec6.md)
- [§7. 与其他方法对比](09-realtime-compute-section-7-sec7.md)
- [§8. 面试真题集](09-realtime-compute-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](09-realtime-compute-section-3-sec3.md)
- [§4. 工程实现](09-realtime-compute-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](09-realtime-compute-section-5-ai.md)
- [§6. 落地实践](09-realtime-compute-section-6-sec6.md)
- [§7. 与其他方法对比](09-realtime-compute-section-7-sec7.md)
- [§8. 面试真题集](09-realtime-compute-section-8-sec8.md)

---
