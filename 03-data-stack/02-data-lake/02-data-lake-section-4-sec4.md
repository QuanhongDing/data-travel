> 本文件是 **02-data-lake.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](02-data-lake.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型存储底座（2-4 周）**

- 云端：S3 / OSS / COS。
- 本地：MinIO / HDFS / Ceph。
- 混合云：Multi-Cloud Gateway。

**Step 2：选定表格式（1-2 周）**

- 通用场景：Iceberg（最流行、社区最活跃）。
- 流批一体：Paimon（Flink 生态原生）。
- Spark 深度集成：Delta Lake。
- 更新密集：Hudi。

**Step 3：建立分层（2-4 周）**

- Bronze（原始） → Silver（清洗） → Gold（应用）。
- 每层有清晰的 schema 和责任。

**Step 4：搭建入湖链路（4-8 周）**

- 离线入湖：DataX / Sqoop / Spark。
- 实时入湖：Flink CDC / Kafka Connect / Vector。
- 文件入湖：OSS 事件 / SQS / 定时同步。

**Step 5：建设查询层（2-4 周）**

- 批量查询：Trino / Spark SQL。
- 即席查询：StarRocks / Doris / ClickHouse。
- AI 检索：LanceDB / Milvus / Pinecone。

**Step 6：建立治理（持续）**

- 元数据：Apache Atlas / DataHub / Unity Catalog。
- 血缘：OpenLineage / DataHub。
- 质量：Great Expectations / Soda。
- 权限：Apache Ranger / AWS Lake Formation。

### 4.2 关键技术点

**1. Iceberg 表格式（核心）**

```sql
-- 创建 Iceberg 表
CREATE TABLE iceberg.orders (
  order_id    BIGINT,
  user_id     BIGINT,
  amount      DECIMAL(18,2),
  order_time  TIMESTAMP
) PARTITIONED BY (days(order_time))
STORED AS ICEBERG;

-- 写入（CTAS）
INSERT INTO iceberg.orders
SELECT * FROM hive.orders WHERE dt = '2025-01-01';

-- Time Travel
SELECT * FROM iceberg.orders
FOR SYSTEM_TIME AS OF '2025-01-15 10:00:00';

-- Schema Evolution（添加列）
ALTER TABLE iceberg.orders
ADD COLUMN coupon_amount DECIMAL(18,2);
```

**2. Iceberg 隐藏分区（Hidden Partitioning）**

```sql
-- 用户不需要知道分区字段
SELECT * FROM iceberg.orders
WHERE order_time BETWEEN '2025-01-01' AND '2025-01-31';
-- Iceberg 自动按 days(order_time) 分区剪裁
```

**3. CDC 入湖（Flink + Iceberg）**

```java
// Flink CDC → Iceberg
StreamExecutionEnvironment env = ...;

TableResult result = env.executeSql("""
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

env.executeSql("""
    CREATE TABLE iceberg_orders (...)
    WITH (
      'connector' = 'iceberg',
      'catalog-name' = 'hive_prod',
      'uri' = 'thrift://hive-metastore:9083',
      'warehouse' = 's3://lake/warehouse'
    )
""");

env.executeSql("INSERT INTO iceberg_orders SELECT * FROM orders_cdc");
```

**4. 数据压缩与生命周期**

```sql
-- Iceberg 自动合并小文件
CALL iceberg.system.rewrite_data_files(
  table => 'iceberg.orders',
  strategy => 'sort',
  sort_order => 'zorder[order_time, user_id]',
  options => map('min-input-files', '10', 'max-concurrent-file-group-rewrites', '5')
);

-- 清理过期快照
CALL iceberg.system.expire_snapshots(
  table => 'iceberg.orders',
  older_than => TIMESTAMP '2025-01-01 00:00:00',
  retain_last => 10
);
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**存储底座**：

| 工具 | 特点 | 适用 |
| --- | --- | --- |
| HDFS | 传统、成熟 | 本地数据中心 |
| AWS S3 | 云对象存储标杆 | AWS 云 |
| 阿里云 OSS | 阿里云原生 | 阿里云 |
| 腾讯云 COS | 腾讯云原生 | 腾讯云 |
| MinIO | 开源对象存储 | 私有云 |
| Ceph | 统一存储（HDFS/S3/Block） | 混合云 |
| Ozone | HDFS 继任者 | Hadoop 生态 |

**开放表格式（2024-2025）**：

| 工具 | 母公司 | 特点 | 最新版本 |
| --- | --- | --- | --- |
| Apache Iceberg | Apache | 社区最大、Trino/Spark/Flink 全支持 | 1.6.x（2024） |
| Apache Hudi | Apache | 更新密集场景强、CDC 友好 | 0.15.x（2024） |
| Delta Lake | Databricks | Spark 生态最深、Unity Catalog | 3.2.x（2024） |
| Apache Paimon | Apache | Flink 生态原生、流批一体 | 1.1.x（2024 毕业） |

**查询引擎**（详见 §13）：

| 工具 | 特点 |
| --- | --- |
| Trino | 联邦查询、Iceberg/Hudi/Delta 全支持 |
| Spark SQL | 大数据主流、生态最全 |
| Flink | 流批一体、流式湖仓 |
| DuckDB | 内嵌 OLAP、AI 时代新宠 |
| StarRocks | 实时 OLAP、Iceberg 外表查询 |

**AI 工具（2024-2025 新趋势）**：

| 工具 | 特点 |
| --- | --- |
| LanceDB | 列式多模态数据湖、专为 AI 设计 |
| Milvus | 向量数据库、可与 Iceberg 集成 |
| Pinecone | 托管向量数据库 |
| Qdrant | 开源向量数据库 |
| ChromaDB | 轻量级向量数据库 |

### 4.4 代码 / 示例

**示例 1：Apache Iceberg + Spark 完整数据湖**

```python
# PySpark + Iceberg
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("IcebergLake") \
    .config("spark.sql.catalog.prod", "org.apache.iceberg.spark.SparkCatalog") \
    .config("spark.sql.catalog.prod.type", "hive") \
    .config("spark.sql.catalog.prod.uri", "thrift://metastore:9083") \
    .config("spark.sql.catalog.prod.warehouse", "s3://lake/warehouse") \
    .getOrCreate()

# 写入数据湖（Bronze）
df = spark.read.parquet("s3://raw/orders/dt=2025-01-01/")
df.writeTo("prod.bronze.orders").createOrReplace()

# 清洗（Silver）
silver_df = df.filter("amount > 0").dropDuplicates(["order_id"])
silver_df.writeTo("prod.silver.orders").createOrReplace()

# 聚合（Gold）
gold_df = silver_df.groupBy("user_id") \
    .agg({"amount": "sum", "order_id": "count"})
gold_df.writeTo("prod.gold.user_orders").createOrReplace()

# Time Travel
historical = spark.read.option("snapshot-id", "1234567890") \
    .table("prod.silver.orders")
```

**示例 2：LanceDB 多模态数据湖（2024 新趋势）**

```python
import lancedb
import pyarrow as pa

# 连接到 LanceDB
db = lancedb.connect("s3://lake/lancedb")

# 创建多模态表（结构化 + 文本 + 向量 + 图像）
table = db.create_table("products", [
    {
        "id": 1,
        "name": "iPhone 15",
        "price": 999.0,
        "description": "Apple smartphone...",
        "description_embedding": [...],  # 文本向量
        "image_bytes": b"...",  # 图像二进制
        "image_embedding": [...],  # 图像向量
    }
], mode="overwrite")

# 混合检索：向量 + 过滤
results = table.search([0.1, 0.2, ...]) \
    .where("price < 1000") \
    .limit(10) \
    .to_pandas()
```

**示例 3：Flink + Paimon 流式数据湖（2024 新工具）**

```java
// Flink + Paimon 流式入湖
TableEnvironment tEnv = ...;

tEnv.executeSql("""
    CREATE TABLE kafka_source (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      ts TIMESTAMP(3)
    ) WITH (
      'connector' = 'kafka',
      'topic' = 'orders',
      'properties.bootstrap.servers' = 'kafka:9092',
      'format' = 'json'
    )
""");

tEnv.executeSql("""
    CREATE TABLE paimon_sink (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      ts TIMESTAMP(3)
    ) WITH (
      'connector' = 'paimon',
      'path' = 's3://lake/paimon/orders',
      'sink.bucket-num' = '8'
    )
""");

tEnv.executeSql("""
    INSERT INTO paimon_sink
    SELECT * FROM kafka_source
""");
```

---
