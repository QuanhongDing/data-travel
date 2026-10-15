> 本文件是 **04-streaming-store.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](04-streaming-store.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型（2-4 周）**

- 通用：Kafka（生态最大）。
- 云原生 / 多租户：Pulsar。
- 阿里系：RocketMQ。
- 云上 Serverless：AutoMQ / Warpstream。

**Step 2：集群规划（1-2 周）**

- Broker 数：3-10（取决于峰值吞吐）。
- Partition 数：预估未来 1-2 年峰值。
- 副本数：3（生产环境）。
- 磁盘：NVMe SSD（Kafka 顺序写 + PageCache）。

**Step 3：网络与安全（1-2 周）**

- 内网带宽 ≥ 10 Gbps。
- SASL / SSL 认证。
- ACL 权限控制。

**Step 4：Schema 管理（1-2 周）**

- Confluent Schema Registry / Karapace / 自研。
- Avro / Protobuf（推荐）。

**Step 5：监控告警（1-2 周）**

- Kafka Exporter + Prometheus + Grafana。
- Consumer Lag、Broker 健康、Disk、Network。

**Step 6：分层存储（如需要，2-4 周）**

- Kafka Tiered Storage 配置 S3/OSS。
- Pulsar Tiered Storage 配置 S3/OSS。

**Step 7：测试与上线（2-4 周）**

- 压测（生产者 / 消费者 / Broker）。
- 故障演练（Broker 宕机、网络分区）。
- 灰度上线。

### 4.2 关键技术点

**1. Kafka KRaft 集群配置**

```properties
# server.properties (Kafka 3.3+ KRaft)
process.roles=broker,controller
node.id=1
controller.quorum.voters=1@kafka-1:9093,2@kafka-2:9093,3@kafka-3:9093
listeners=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
advertised.listeners=PLAINTEXT://kafka-1:9092

# Tiered Storage (Kafka 3.6+)
tiered.storage.enable=true
tiered.storage.local.retention.ms=86400000  # 本地保留 1 天
tiered.storage.remote.storage.system=s3
tiered.storage.s3.bucket.name=my-kafka-tiered
tiered.storage.s3.region=us-east-1
```

**2. Avro / Protobuf + Schema Registry**

```java
// Producer with Schema Registry
Properties props = new Properties();
props.put("bootstrap.servers", "kafka:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "io.confluent.kafka.serializers.KafkaAvroSerializer");
props.put("schema.registry.url", "http://schema-registry:8081");

Producer<String, Order> producer = new KafkaProducer<>(props);

Order order = new Order(1L, 100L, new BigDecimal("99.99"));
ProducerRecord<String, Order> record = new ProducerRecord<>("orders", order.getId().toString(), order);
producer.send(record);
```

**3. Consumer Group + 幂等**

```java
// Consumer with manual commit + idempotent processing
Properties props = new Properties();
props.put("bootstrap.servers", "kafka:9092");
props.put("group.id", "order-processor");
props.put("enable.auto.commit", "false");
props.put("isolation.level", "read_committed");

KafkaConsumer<String, Order> consumer = new KafkaConsumer<>(props);
consumer.subscribe(List.of("orders"));

while (true) {
    ConsumerRecords<String, Order> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, Order> record : records) {
        // 幂等处理：按主键去重
        if (isProcessed(record.key())) continue;
        processOrder(record.value());
        markProcessed(record.key());
    }
    consumer.commitSync();  // 手动提交 offset
}
```

**4. Exactly-Once 端到端**

```java
// Flink + Kafka EOS
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(60000); // 1 分钟
env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);

KafkaSource<String> source = KafkaSource.<String>builder()
    .setBootstrapServers("kafka:9092")
    .setGroupId("flink-consumer")
    .setTopics("orders")
    .setStartingOffsets(OffsetsInitializer.committedOffsets())
    .setValueOnlyDeserializer(new SimpleStringSchema())
    .build();

KafkaSink<String> sink = KafkaSink.<String>builder()
    .setBootstrapServers("kafka:9092")
    .setRecordSerializer(KafkaRecordSerializationSchema.builder()
        .setTopic("processed-orders")
        .setValueSerializationSchema(new SimpleStringSchema())
        .build())
    .setDeliveryGuarantee(DeliveryGuarantee.EXACTLY_ONCE)
    .setTransactionalIdPrefix("flink-tx-")
    .build();

env.fromSource(source, WatermarkStrategy.noWatermarks(), "Kafka Source")
   .map(this::process)
   .sinkTo(sink);
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**消息中间件（2024-2025）**：

| 工具 | 版本 | 2024-2025 新特性 |
| --- | --- | --- |
| Apache Kafka | 3.7+ | KRaft 默认、Tiered Storage 稳定、Kafka 4.0 路线 |
| Apache Pulsar | 3.2+ | 分层存储成熟、Kafka 协议兼容 |
| Apache RocketMQ | 5.3+ | Controller 模式（去 NameServer）、事务消息优化 |
| AutoMQ（2024 新） | 1.x | 兼容 Kafka 协议 + 100% 对象存储 + Serverless |
| Warpstream（2024） | 1.x | 无 Broker，存 S3/Kafka 协议兼容 |
| Confluent Cloud | - | 托管 Kafka、Tiered Storage |
| StreamNative Cloud | - | 托管 Pulsar |

**Schema 管理**：

| 工具 | 特点 |
| --- | --- |
| Confluent Schema Registry | 业界标准、Avro / JSON / Protobuf |
| Karapace | 开源 Schema Registry 替代 |
| Apicurio | 开源、支持更多格式 |
| 自研（数据库 + Service） | 灵活、可定制 |

**CDC 工具**（流式存储的数据源）：

| 工具 | 特点 |
| --- | --- |
| Debezium | MySQL / PostgreSQL / MongoDB CDC |
| Flink CDC | 国产、深度集成 Flink |
| Canal | 阿里系、MySQL Binlog |
| Maxwell | MySQL Binlog |

**流批一体存储（2024-2025）**：

| 工具 | 特点 |
| --- | --- |
| Apache Paimon | LSM Tree + 流批一体 |
| Apache Fluss（前 Flink Table Store 衍生） | 流式原生、毫秒级延迟 |
| Apache Hudi | MOR 模式流式 |
| Apache Iceberg | 弱流式（依赖 Flink 写入） |

### 4.4 代码 / 示例

**示例 1：完整 Kafka 流式架构（含分层存储）**

```yaml
# docker-compose.yml
services:
  kafka-1:
    image: apache/kafka:3.7.0
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka-1:9093,2@kafka-2:9093,3@kafka-3:9093
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka-1:9092
      KAFKA_TIERED_STORAGE_ENABLE: "true"
      KAFKA_TIERED_STORAGE_LOCAL_RETENTION_MS: "86400000"
      KAFKA_TIERED_STORAGE_S3_BUCKET_NAME: my-kafka-tiered
      KAFKA_TIERED_STORAGE_S3_REGION: us-east-1
```

**示例 2：Flink + Paimon 流批一体（2024 新工具）**

```java
// Flink + Paimon 实时入湖
tEnv.executeSql("""
    CREATE TABLE kafka_orders (
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

// 端到端 EOS
tEnv.executeSql("""
    INSERT INTO paimon_orders
    SELECT order_id, user_id, amount, ts
    FROM kafka_orders
""");
```

**示例 3：AutoMQ 云原生 Kafka（2024 新工具）**

```yaml
# AutoMQ 完全兼容 Kafka 协议，存储 100% 在对象存储
# 启动 AutoMQ
docker run -d \
  -e AUTO_MQ_LISTENER=PLAINTEXT://0.0.0.0:9092 \
  -e AUTO_MQ_S3_BUCKET=my-bucket \
  -e AUTO_MQ_S3_REGION=us-east-1 \
  automq/automq:latest
```

**示例 4：Schema Evolution with Avro**

```json
{
  "type": "record",
  "name": "Order",
  "namespace": "com.example",
  "fields": [
    {"name": "order_id", "type": "long"},
    {"name": "user_id", "type": "long"},
    {"name": "amount", "type": "decimal", "precision": 18, "scale": 2},
    {"name": "order_time", "type": "long", "logicalType": "timestamp-millis"}
  ]
}
```

---
