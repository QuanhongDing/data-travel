> 本文件是 **09-realtime-compute.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](09-realtime-compute.md)。

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
