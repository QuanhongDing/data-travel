> 本文件是 **03-lakehouse.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](03-lakehouse.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型存储底座（1-2 周）**

- 云端：S3 / OSS / COS。
- 本地：MinIO。
- 混合云：Multi-Cloud Gateway。

**Step 2：选定表格式（1-2 周）**

- 默认：Iceberg（社区最大）。
- Flink 流批一体：Paimon。
- Spark 深度集成：Delta。
- CDC 频繁：Hudi。

**Step 3：搭建 Catalog（1-2 周）**

- Hive Metastore（成熟、广泛支持）。
- AWS Glue（AWS 原生）。
- Nessie（Git-like，多分支实验）。
- Polaris（Snowflake 开源，REST 接口）。

**Step 4：建立分层（2-4 周）**

- Bronze（原始）→ Silver（清洗）→ Gold（应用）。

**Step 5：搭建入湖链路（4-8 周）**

- 离线：DataX / Sqoop / Spark。
- 实时：Flink CDC / Kafka Connect。
- 流式：Flink + Paimon / Flink + Iceberg。

**Step 6：搭建查询层（2-4 周）**

- 批量：Trino / Spark SQL。
- 即席：StarRocks / Doris / ClickHouse（外表模式）。
- AI：LanceDB / Milvus（向量检索）。

**Step 7：建立治理（持续）**

- 元数据：Unity Catalog / Apache Atlas。
- 血缘：OpenLineage / DataHub。
- 质量：Great Expectations / Soda。
- 权限：Apache Ranger / Lake Formation。

### 4.2 关键技术点

**1. Iceberg 表创建与写入**

```sql
-- 创建 Iceberg 表
CREATE TABLE iceberg.orders (
  order_id    BIGINT,
  user_id     BIGINT,
  amount      DECIMAL(18,2),
  order_time  TIMESTAMP
) PARTITIONED BY (days(order_time))
STORED AS ICEBERG;

-- Time Travel
SELECT * FROM iceberg.orders
FOR SYSTEM_TIME AS OF '2025-01-15 10:00:00';

-- Schema Evolution
ALTER TABLE iceberg.orders
ADD COLUMN coupon_amount DECIMAL(18,2);

-- 隐藏分区（无需感知）
SELECT * FROM iceberg.orders
WHERE order_time BETWEEN '2025-01-01' AND '2025-01-31';
```

**2. Paimon 流式入湖**

```java
// Flink + Paimon 流式写入
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
      'sink.bucket-num' = '8',
      'changelog-producer' = 'input'
    )
""");

tEnv.executeSql("""
    INSERT INTO paimon_orders
    SELECT * FROM kafka_orders
""");
```

**3. Schema Evolution 最佳实践**

```sql
-- 安全操作
ALTER TABLE orders ADD COLUMN new_col STRING;
ALTER TABLE orders ALTER COLUMN amount TYPE BIGINT; -- 兼容性变更

-- 不安全操作（需谨慎）
ALTER TABLE orders DROP COLUMN old_col; -- 标记删除，旧数据可能错乱
ALTER TABLE orders ALTER COLUMN s TYPE INT; -- string → int 失败
```

**4. Compaction 与优化**

```sql
-- Iceberg 数据文件合并
CALL iceberg.system.rewrite_data_files(
  table => 'orders',
  strategy => 'sort',
  sort_order => 'zorder[order_time, user_id]',
  options => map('min-input-files', '10', 'target-file-size-bytes', '536870912')
);

-- 清理过期快照
CALL iceberg.system.expire_snapshots(
  table => 'orders',
  older_than => TIMESTAMP '2025-01-01 00:00:00',
  retain_last => 10
);

-- 清理孤立文件
CALL iceberg.system.remove_orphan_files(
  table => 'orders',
  older_than => TIMESTAMP '2024-12-01 00:00:00'
);
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**表格式（2024-2025 最新版本）**：

| 工具 | 版本 | 2024-2025 新特性 |
| --- | --- | --- |
| Apache Iceberg | 1.6.x | V3 规范：行级删除、增量读取、向量类型、Variant 类型 |
| Apache Hudi | 1.0 | Timeline Server、Lakehood 集成 |
| Delta Lake | 3.2.x | Delta UniForm（一份数据多引擎读取） |
| Apache Paimon | 1.1 | LSM 优化、主键索引、流批融合 |

**Catalog（2024-2025）**：

| 工具 | 特点 |
| --- | --- |
| Hive Metastore | 传统成熟、广泛支持 |
| AWS Glue Catalog | AWS 原生 |
| Nessie | Git-like 多分支 |
| Polaris（Snowflake） | REST Catalog、2024 开源 |
| Unity Catalog（Databricks） | 统一治理、跨表格式 |

**查询引擎**（详见 §13）：

- Trino 420+：Iceberg V3 原生支持。
- Spark 3.5+：Iceberg / Hudi / Delta / Paimon 全支持。
- Flink 1.19+：Paimon / Iceberg 流批一体。
- StarRocks 3.x：Iceberg 外表查询、Paimon 外表查询。
- Doris 2.1+：Iceberg / Hive 外表查询。

**云厂商 Lakehouse 服务（2024-2025）**：

- **Databricks Data Intelligence Platform**：Lakehouse + AI + Unity Catalog。
- **Snowflake Iceberg Tables**：三云全支持 Iceberg。
- **阿里云 DLF（Data Lake Formation）**：OSS + Iceberg/Paimon/Hudi 一站式。
- **腾讯云 DLC（Data Lake Compute）**：COS + Iceberg + Spark。
- **华为云 DWS Lakehouse**：MRS + Iceberg。
- **AWS Lake Formation**：S3 + Glue + Iceberg/Hudi。

### 4.4 代码 / 示例

**示例 1：完整 Lakehouse 架构（Iceberg + Spark + Trino + StarRocks）**

```python
# PySpark 写入 Iceberg
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("LakehouseDemo") \
    .config("spark.sql.catalog.iceberg", "org.apache.iceberg.spark.SparkCatalog") \
    .config("spark.sql.catalog.iceberg.type", "hive") \
    .config("spark.sql.catalog.iceberg.uri", "thrift://metastore:9083") \
    .config("spark.sql.catalog.iceberg.warehouse", "s3://lake/warehouse") \
    .getOrCreate()

# 1. Bronze 层：原始数据
raw_df = spark.read.parquet("s3://raw/orders/dt=2025-01-01/")
raw_df.writeTo("iceberg.bronze.orders").createOrReplace()

# 2. Silver 层：清洗 + 维度建模
silver_df = raw_df \
    .filter("amount > 0") \
    .dropDuplicates(["order_id"]) \
    .withColumn("user_id", col("user_id").cast("bigint"))

silver_df.writeTo("iceberg.silver.orders") \
    .partitionedBy(days("order_time")) \
    .createOrReplace()

# 3. Gold 层：聚合
gold_df = silver_df.groupBy("user_id", "dt") \
    .agg(sum("amount").alias("gmv"), count("order_id").alias("orders"))

gold_df.writeTo("iceberg.gold.user_daily_orders") \
    .partitionedBy("dt") \
    .createOrReplace()
```

```sql
-- Trino 查询 Iceberg Lakehouse
SELECT
    region,
    SUM(gmv) AS total_gmv,
    COUNT(DISTINCT user_id) AS users
FROM iceberg.iceberg.gold.user_daily_orders
WHERE dt BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY region
ORDER BY total_gmv DESC;
```

```sql
-- StarRocks 外表查询 Iceberg（实时 BI）
CREATE EXTERNAL TABLE orders_iceberg
ENGINE = ICEBERG
PROPERTIES (
    "iceberg.catalog.type" = "hive",
    "iceberg.catalog.uri" = "thrift://metastore:9083",
    "iceberg.database" = "gold",
    "iceberg.table" = "user_daily_orders"
);

SELECT region, SUM(gmv)
FROM orders_iceberg
WHERE dt = '2025-01-15'
GROUP BY region;
```

**示例 2：Iceberg V3 向量类型（2024 新特性）**

```python
# Iceberg V3 支持向量类型（Beta 阶段）
spark.sql("""
    CREATE TABLE products_with_vectors (
        id BIGINT,
        name STRING,
        price DECIMAL(18, 2),
        description_embedding ARRAY<FLOAT>  -- 向量类型
    ) USING iceberg
""")

# 写入向量
df_with_vectors.writeTo("products_with_vectors").append()

# 向量检索（需配合外部向量库）
# ... 检索最近邻
```

**示例 3：Paimon 流批一体（2024 毕业项目）**

```java
// Flink + Paimon 流式入湖 + 批量查询
TableEnvironment tEnv = ...;

// 1. 定义 Kafka 源
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

// 2. 定义 Paimon 表（含主键）
tEnv.executeSql("""
    CREATE TABLE paimon_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      PRIMARY KEY (order_id) NOT ENFORCED
    ) WITH (
      'connector' = 'paimon',
      'path' = 's3://lake/paimon/orders'
    )
""");

// 3. 流式 INSERT（Changelog 流）
tEnv.executeSql("""
    INSERT INTO paimon_orders
    SELECT order_id, user_id, amount FROM kafka_orders
""");

// 4. 批量查询（通过 Spark）
spark.read.format("paimon").load("s3://lake/paimon/orders").show();
```

---
