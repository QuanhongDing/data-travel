> 本文件是 **08-offline-compute.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](08-offline-compute.md)。

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
