> 本文件是 **06-schema-and-time-travel.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](06-schema-and-time-travel.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型 Schema 管理工具（1-2 周）**

- 消息：Confluent Schema Registry / Karapace。
- 表：Iceberg / Hudi / Delta / Paimon。
- 元数据：Unity Catalog / DataHub。

**Step 2：设计 Schema 演进规则（1-2 周）**

- 兼容性规则（Backward / Forward / Full）。
- 命名规范。
- 变更流程（PR + Review）。

**Step 3：搭建 Schema Registry（1-2 周）**

- Confluent Schema Registry（K8s / Docker）。
- Karapace（开源替代）。
- 配置兼容性策略。

**Step 4：表格式 + Schema Evolution（2-4 周）**

- Iceberg ID-based Schema。
- 字段命名规范。
- 变更 SOP。

**Step 5：Time Travel 配置（1-2 周）**

- 快照保留策略。
- 清理规则。
- 监控告警。

**Step 6：CI/CD 集成（持续）**

- Schema PR Review。
- 兼容性测试。
- 灰度发布。

### 4.2 关键技术点

**1. Iceberg Schema Evolution**

```sql
-- 加列
ALTER TABLE orders ADD COLUMN coupon_amount DECIMAL(18,2);

-- 重命名（ID-based）
ALTER TABLE orders RENAME COLUMN old_name TO new_name;

-- 类型扩展
ALTER TABLE orders ALTER COLUMN amount TYPE BIGINT;

-- Time Travel
SELECT * FROM orders
FOR SYSTEM_TIME AS OF '2025-01-15 10:00:00';

-- 隐藏分区
SELECT * FROM orders
WHERE order_time BETWEEN '2025-01-01' AND '2025-01-31';
```

**2. Confluent Schema Registry**

```bash
# 启动 Schema Registry
docker run -d \
  -e SCHEMA_REGISTRY_HOST_NAME=schema-registry \
  -e SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS=kafka:9092 \
  confluentinc/cp-schema-registry:latest

# 注册 Schema
curl -X POST http://localhost:8081/subjects/orders-value/versions \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  --data '{"schema": "{\"type\":\"record\",\"name\":\"Order\",\"fields\":[...]}"}'

# 兼容性检查
curl -X POST http://localhost:8081/subjects/orders-value/versions \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  --data '{"schema": "{...new schema...}"}'
# 返回 200 OK / 409 Conflict（兼容性失败）
```

**3. Delta Lake Time Travel**

```python
# Time Travel
df_v1 = spark.read.format("delta") \
    .option("versionAsOf", 123) \
    .table("orders")

df_v2 = spark.read.format("delta") \
    .option("timestampAsOf", "2025-01-15") \
    .table("orders")

# 恢复误操作
df_v1.write.format("delta").mode("overwrite").saveAsTable("orders")
```

**4. Iceberg V3 新特性（2024）**

```sql
-- Variant 类型（半结构化）
ALTER TABLE orders ADD COLUMN metadata VARIANT;

-- 向量类型（AI 集成）
ALTER TABLE products ADD COLUMN description_embedding ARRAY<FLOAT>;

-- 行级删除（更高效）
DELETE FROM orders WHERE order_time < '2025-01-01';
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**Schema Registry（2024-2025）**：

| 工具 | 特点 |
| --- | --- |
| Confluent Schema Registry | 业界标准、商业版成熟 |
| Karapace | 开源兼容版 |
| Apicurio | 开源、支持更多格式 |
| 自研（DB + Service） | 灵活、可定制 |

**Lakehouse 表格式**：

- Iceberg V3（2024）：Variant、Vector、行级删除。
- Delta Lake 3.2（2024）：Delta UniForm、列映射。
- Hudi 1.0（2024）：Timeline Server、Schema Checkpoint。
- Paimon 1.1（2024）：主键演进、Schema 校验。

**元数据目录**：

- Unity Catalog（Databricks，2024）：跨表格式统一治理。
- Polaris（Snowflake，2024）：REST Catalog。
- DataHub（开源）：元数据 + 血缘。
- Apache Atlas（开源）：传统 Hadoop 生态。

### 4.4 代码 / 示例

**示例 1：完整 Iceberg Schema Evolution + Time Travel**

```python
# PySpark + Iceberg
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("SchemaEvolution") \
    .config("spark.sql.catalog.iceberg", "org.apache.iceberg.spark.SparkCatalog") \
    .config("spark.sql.catalog.iceberg.type", "hive") \
    .config("spark.sql.catalog.iceberg.uri", "thrift://metastore:9083") \
    .getOrCreate()

# 1. 创建表
spark.sql("""
    CREATE TABLE iceberg.orders (
        order_id BIGINT,
        user_id BIGINT,
        amount DECIMAL(18, 2),
        order_time TIMESTAMP
    ) PARTITIONED BY (days(order_time))
    STORED AS ICEBERG
""")

# 2. 加列（Schema Evolution）
spark.sql("""
    ALTER TABLE iceberg.orders
    ADD COLUMN coupon_amount DECIMAL(18, 2)
""")

# 3. 重命名（ID-based）
spark.sql("""
    ALTER TABLE iceberg.orders
    RENAME COLUMN coupon_amount TO discount_amount
""")

# 4. Time Travel 查询
df_yesterday = spark.read \
    .option("as-of-timestamp", "2025-01-15 10:00:00") \
    .table("iceberg.orders")

# 5. Snapshot ID 查询
df_snapshot = spark.read \
    .option("snapshot-id", "1234567890") \
    .table("iceberg.orders")
```

**示例 2：Schema Registry + Avro**

```java
// Avro + Schema Registry
Properties props = new Properties();
props.put("bootstrap.servers", "kafka:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "io.confluent.kafka.serializers.KafkaAvroSerializer");
props.put("schema.registry.url", "http://schema-registry:8081");
props.put("auto.register.schemas", "true");

KafkaProducer<String, Order> producer = new KafkaProducer<>(props);

// 序列化时自动注册 schema
Order order = new Order(1L, 100L, new BigDecimal("99.99"));
producer.send(new ProducerRecord<>("orders", order));

// Consumer 自动按最新 schema 反序列化
KafkaConsumer<String, Order> consumer = new KafkaConsumer<>(props);
consumer.subscribe(List.of("orders"));
```

**示例 3：Delta Lake Time Travel + 恢复**

```python
# Delta Lake Time Travel
# 查看历史版本
spark.sql("DESCRIBE HISTORY orders").show(truncate=False)

# 查询历史版本
df_old = spark.read.format("delta").option("versionAsOf", 5).table("orders")

# 恢复误操作
spark.read.format("delta") \
    .option("versionAsOf", 5) \
    .table("orders") \
    .write.format("delta") \
    .mode("overwrite") \
    .saveAsTable("orders")
```

**示例 4：Iceberg V3 Variant + Vector（2024 新特性）**

```sql
-- V3 Variant 类型（半结构化数据）
ALTER TABLE user_events ADD COLUMN metadata VARIANT;

-- 写入 JSON 数据
INSERT INTO user_events VALUES
  (1, '{"source": "web", "browser": "chrome", "tags": ["vip", "new"]}');

-- V3 向量类型（AI 集成）
ALTER TABLE products ADD COLUMN description_embedding ARRAY<FLOAT>;
```

---
