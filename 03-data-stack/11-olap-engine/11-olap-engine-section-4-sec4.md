> 本文件是 **11-olap-engine.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](11-olap-engine.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型引擎（2-4 周）**

- 实时报表：StarRocks / Doris。
- 大宽表：ClickHouse。
- 云原生：SelectDB / Snowflake。
- AI：StarRocks 3.x + 向量。

**Step 2：集群规划（1-2 周）**

- FE / BE 节点（StarRocks / Doris）。
- ClickHouse 节点。
- 副本数 3。

**Step 3：建表与建模（2-4 周）**

- 维度建模（事实表 + 维度表）。
- 分桶策略。
- 数据模型（主键 / 聚合 / Unique）。

**Step 4：数据接入（4-8 周）**

- Kafka / Flink 实时接入。
- Iceberg / Hive 外表查询。
- MySQL CDC 实时同步。

**Step 5：物化视图 + 查询优化（持续）**

- MV 加速高频查询。
- CBO 统计信息收集。

**Step 6：监控 + 调优（持续）**

- FE / BE 监控。
- 慢查询治理。

### 4.2 关键技术点

**1. StarRocks 实时数仓**

```sql
-- StarRocks 主键模型（实时更新）
CREATE TABLE orders (
    order_id BIGINT,
    user_id BIGINT,
    amount DECIMAL(18, 2),
    order_time DATETIME,
    PRIMARY KEY (order_id)
)
DISTRIBUTED BY HASH(order_id) BUCKETS 16
PROPERTIES ("replication_num" = "3");

-- Stream Load（Kafka 实时）
STREAM LOAD FROM KAFKA (
    "kafka_broker_list" = "kafka:9092",
    "kafka_topic" = "orders",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**2. Doris 实时数仓**

```sql
-- Doris Unique Key 模型
CREATE TABLE orders (
    order_id BIGINT,
    user_id BIGINT,
    amount DECIMAL(18, 2),
    order_time DATETIME,
    UNIQUE KEY(order_id)
)
DISTRIBUTED BY HASH(order_id) BUCKETS 16
PROPERTIES ("replication_num" = "3");

-- Routine Load（Kafka 实时）
CREATE ROUTINE LOAD orders_load ON orders
COLUMNS (order_id, user_id, amount, order_time)
PROPERTIES (
    "desired_concurrent_number" = "3",
    "max_error_number" = "1000"
)
FROM KAFKA (
    "kafka_broker_list" = "kafka:9092",
    "kafka_topic" = "orders"
);
```

**3. ClickHouse 实时数仓**

```sql
-- ClickHouse ReplacingMergeTree（upsert）
CREATE TABLE orders (
    order_id Int64,
    user_id Int64,
    amount Decimal(18, 2),
    order_time DateTime
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(order_time)
ORDER BY (order_id, order_time);

-- Kafka 表引擎（实时摄入）
CREATE TABLE orders_kafka (
    order_id Int64,
    user_id Int64,
    amount Decimal(18, 2),
    order_time DateTime
)
ENGINE = Kafka()
SETTINGS kafka_broker_list = 'kafka:9092',
         kafka_topic = 'orders',
         kafka_format = 'JSONEachRow',
         kafka_group_name = 'clickhouse-consumer';

-- 物化视图（实时同步）
CREATE MATERIALIZED VIEW orders_mv TO orders AS
SELECT * FROM orders_kafka;
```

**4. 物化视图（自动增量）**

```sql
-- StarRocks 自动增量物化视图
CREATE MATERIALIZED VIEW order_summary
DISTRIBUTED BY HASH(user_id)
REFRESH ASYNC
AS SELECT
    user_id,
    dt,
    SUM(amount) AS gmv,
    COUNT(*) AS orders
FROM orders
GROUP BY user_id, dt;
```

**5. 向量索引（2024 新特性）**

```sql
-- StarRocks 3.x 向量索引
ALTER TABLE products ADD COLUMN description_embedding ARRAY<FLOAT>;
CREATE VECTOR INDEX idx_embedding ON products(description_embedding);

-- 向量检索
SELECT product_id, product_name,
    l2_distance(description_embedding, [0.1, 0.2, ...]) AS distance
FROM products
ORDER BY distance ASC
LIMIT 10;
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**OLAP 引擎（2024-2025）**：

| 工具 | 版本 | 特点 |
| --- | --- | --- |
| Apache Doris | 2.1+ / 3.0 | 国产开源、存算分离 |
| StarRocks | 3.x | 国产开源、Cloud Native + 向量索引 |
| ClickHouse | 24.x | 单表性能极致、SharedMergeTree |
| SelectDB Cloud | - | 云原生实时数仓 |
| Apache Druid | - | 实时 OLAP |
| Apache Pinot | - | 实时 OLAP |
| Trino | 420+ | 联邦查询 |
| DuckDB | 1.x | 内嵌 OLAP |

**实时接入**：

- Kafka / Flink：主流摄入。
- Stream Load（StarRocks）、Routine Load（Doris）、Kafka Engine（ClickHouse）。

**生态工具**：

- StreamX / SeaTunnel：实时摄入平台。
- DBT + OLAP：SQL 化建模。
- Apache Superset / Grafana：BI 工具。

### 4.4 代码 / 示例

**示例 1：StarRocks + Flink 实时数仓**

```java
// Flink → StarRocks
TableEnvironment tEnv = ...;

tEnv.executeSql("""
    CREATE TABLE kafka_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      order_time TIMESTAMP(3)
    ) WITH (
      'connector' = 'kafka',
      'topic' = 'orders',
      'format' = 'json'
    )
""");

tEnv.executeSql("""
    CREATE TABLE starrocks_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      order_time TIMESTAMP(3),
      PRIMARY KEY (order_id) NOT ENFORCED
    ) WITH (
      'connector' = 'starrocks',
      'jdbc-url' = 'jdbc:mysql://starrocks-fe:9030',
      'load-url' = 'starrocks-be:8040',
      'database-name' = 'shop',
      'table-name' = 'orders'
    )
""");

tEnv.executeSql("""
    INSERT INTO starrocks_orders
    SELECT * FROM kafka_orders
""");
```

**示例 2：Doris Routine Load（Kafka 实时摄入）**

```sql
-- Doris Routine Load
CREATE ROUTINE LOAD shop.orders_load ON shop.orders
COLUMNS (order_id, user_id, amount, order_time),
ORDER BY order_id
PROPERTIES (
    "desired_concurrent_number" = "3",
    "max_error_number" = "1000"
)
FROM KAFKA (
    "kafka_broker_list" = "kafka:9092",
    "kafka_topic" = "orders",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**示例 3：ClickHouse 向量化查询**

```sql
-- ClickHouse 列存 + 向量化
SELECT
    region,
    product_category,
    sum(amount) AS gmv,
    count(DISTINCT user_id) AS unique_users,
    avg(amount) AS avg_order
FROM orders
WHERE order_time BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY region, product_category
ORDER BY gmv DESC
LIMIT 100;

-- 利用 Zone Map 跳过数据块
SELECT * FROM orders WHERE order_id = 12345;
-- → ClickHouse 自动用 order_id 索引跳过 99% 数据块
```

**示例 4：DuckDB 内嵌 OLAP（2024 AI 时代）**

```python
import duckdb

# 直接查询 Parquet
result = duckdb.query("""
    SELECT
        region,
        SUM(amount) AS gmv,
        COUNT(DISTINCT user_id) AS users
    FROM read_parquet('s3://lake/orders/dt=2025-01-01/*.parquet')
    WHERE order_status = 'paid'
    GROUP BY region
    ORDER BY gmv DESC
""").to_df()

# DuckDB + Pandas（嵌入分析）
import pandas as pd
df = pd.read_parquet("s3://lake/orders/dt=2025-01-01/")
result = duckdb.query("""
    SELECT region, SUM(amount) FROM df GROUP BY region
""").to_df()
```

---
