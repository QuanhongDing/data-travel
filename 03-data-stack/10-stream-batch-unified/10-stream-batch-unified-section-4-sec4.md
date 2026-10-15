> 本文件是 **10-stream-batch-unified.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](10-stream-batch-unified.md)。

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
