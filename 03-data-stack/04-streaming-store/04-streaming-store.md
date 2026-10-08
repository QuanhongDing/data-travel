# 流式存储（Streaming Store）

> **一句话定位**：以 Kafka / Pulsar / RocketMQ 为核心的高吞吐、低延迟、可持久化的消息与流式数据基础设施，是实时数据栈的"数据主干道"。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**04 流式存储**）。覆盖 **R4 数据全栈协同** 能力领域中「流式消息中间件、流存储、分层存储、AI 时代演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 流式存储与传统消息队列的本质区别？ | §1.1 |
| Kafka / Pulsar / RocketMQ 怎么选？ | §7.1 |
| Tiered Storage（分层存储）原理是什么？ | §2.1 |
| Kafka 3.7+ 的 KRaft、AutoMQ、Warpstream 有哪些新趋势？ | §5.3 |
| 流批一体存储（Pravega / Fluss）怎么落地？ | §3.1 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：流式存储（Streaming Store）是一种**支持高吞吐、低延迟、持久化、可重放的消息与流数据基础设施**。它既是消息中间件（解耦生产者/消费者），也是流式存储（保留历史可回溯查询），还是流处理引擎的"输入层"。

**工程定义**：在数据架构师手里，流式存储是**一份长期持久、按顺序写入、可回放、可水平扩展、支持 Exactly-Once 的流式数据主干道**。它的核心特征：

- **高吞吐**：单集群百万级 QPS。
- **低延迟**：毫秒级 P99 延迟。
- **持久化**：数据持久化在磁盘，可保留数天到数年。
- **顺序保证**：分区内有序（partition 内 FIFO）。
- **可重放**：消费者可指定 offset 重放历史。
- **Exactly-Once**：精确一次语义（与计算引擎协作）。

**与传统消息队列（MQ）的本质区别**：

| 维度 | 传统 MQ（RabbitMQ / ActiveMQ） | 流式存储（Kafka / Pulsar） |
| --- | --- | --- |
| 核心模型 | 队列（Queue）+ 消息确认 | 日志（Log）+ offset |
| 消费模式 | 一次性消费，ACK 后删除 | 可重放，可保留历史 |
| 吞吐 | 万级 QPS | 百万级 QPS |
| 适用场景 | 业务解耦、异步通知 | 流处理、事件溯源、日志聚合 |
| 数据保留 | 短（消费即删） | 长（可保留数天~数年） |
| 流处理能力 | 弱（需外部引擎） | 强（Kafka Streams / Pulsar Functions） |

### 1.2 为什么需要

**业务驱动力**：

- **实时数据接入**：业务事件（订单、点击、支付）需要毫秒级响应。
- **解耦生产消费**：业务系统产生数据，下游多个消费者（数仓、风控、推荐）独立消费。
- **流批一体存储**：Flink / Spark Streaming 直接消费，无需额外 ETL。
- **事件溯源**：保留全量历史事件，支持数据回溯、审计、复现。
- **削峰填谷**：业务高峰时缓存数据，低峰时消费。

**痛点（没有流式存储的代价）**：

1. **业务系统直接调下游**：耦合严重，一个慢的下游拖垮全链路。
2. **数据无法回溯**：消息消费即丢，事故排查无法追溯。
3. **实时数仓缺失**：没有流式数据源，Flink 无米下锅。
4. **多消费者重复开发**：每个下游都要单独接业务系统。
5. **峰值冲击**：业务高峰时数据库崩溃。

**AI 时代的新诉求**：

- **Agent 事件流**：智能体产生的事件（tool call、thought、action）需要持久化、可回放。
- **RAG 实时索引**：文档变更实时同步到向量库。
- **流式特征工程**：实时计算用户特征，喂给在线推理。
- **LLM 流式输出**：Token 级流式响应需要流式基础设施。

### 1.3 在 AI 时代数据架构中的位置

```
[业务系统 / IoT / 移动 App]
        ↓
[流式存储：Kafka / Pulsar / RocketMQ]
        ├── Topic 1：订单事件
        ├── Topic 2：用户行为
        ├── Topic 3：日志
        └── ...
        ↓
[实时计算：Flink / Spark Streaming]
        ↓
[实时数仓 / 向量库 / 在线服务]
        ↓
[Agent / 在线推理 / 监控告警]
```

**流式存储是实时数据栈的"主干道"**：上游对接业务系统，下游对接实时计算、AI 推理、Agent。

### 1.4 演进历程

**第一阶段：传统 MQ 时代（2000-2010）**

- 2000s：RabbitMQ（AMQP）、ActiveMQ、IBM MQ。
- 特点：队列模型、ACK 后删除、适合任务分发。

**第二阶段：日志型流存储（2010-2015）**

- 2010：LinkedIn 开源 Kafka，引入"日志（Log）+ offset"模型。
- 2013：Kafka 0.8 加入 replication，0.10 加入 Streams API。
- 2014：Yahoo 开源 Pulsar，引入"计算存储分离"。

**第三阶段：流批一体与生态扩张（2015-2020）**

- 2015：RocketMQ 阿里开源（后捐 Apache）。
- 2017：Kafka 引入 Connect、KSQL（流式 SQL）。
- 2018：Pulsar 引入 Functions、IO Connector。
- 2019：Kafka 2.0+、Kafka Streams 成熟。

**第四阶段：云原生与分层存储（2020-2025）**

- 2020：Kafka Tiered Storage（KIP-405）。
- 2021：Pulsar 分层存储成熟（支持 S3/OSS）。
- 2022：Kafka KRaft（去 ZooKeeper）。
- 2023：AutoMQ、Warpstream（云原生无 Kafka 协议）。
- 2024：Apache Fluss（前 Flink Table Store 衍生）流式存储。
- 2025：Kafka 4.0（KIP-1030、KIP-1080）、流批一体存储成熟。

**一句话总结**：**流式存储从"传统 MQ"→"日志型 Kafka"→"计算存储分离 Pulsar"→"云原生无服务器 AutoMQ"四阶段演进，今天已与 Lakehouse 深度融合。**

---

## 2. 核心原理

### 2.1 关键概念定义

**Producer / Consumer**：生产者 / 消费者。Producer 写入 Topic，Consumer 订阅消费。

**Topic**：消息主题。逻辑上的消息分类。物理上由多个 Partition 组成。

**Partition**：分区。Kafka / Pulsar 的并行单位。每个 Partition 是一个有序日志。

**Offset**：偏移量。Partition 内每条消息的唯一序号。Consumer 通过 offset 跟踪消费位置。

**Consumer Group**：消费者组。组内消费者共同消费一个 Topic，每个 Partition 只被组内一个消费者消费。

**Broker**：Kafka / Pulsar 的服务节点，负责消息的接收、存储、转发。

**Replication**：副本。每个 Partition 有多个副本（leader + followers），保证高可用。

**ISR（In-Sync Replicas）**：同步副本集合。Leader 维护的、已同步的副本集合，写入需 ISR 确认。

**ACK 机制**：

- **acks=0**：不等待确认，最快，可能丢。
- **acks=1**：等待 leader 写入确认，可能丢（leader 挂掉）。
- **acks=all**：等待所有 ISR 写入确认，最安全。

**Exactly-Once 语义（EOS）**：

- **At-Most-Once**：最多一次（可能丢）。
- **At-Least-Once**：至少一次（可能重）。
- **Exactly-Once**：精确一次（不丢不重，需 Kafka + Flink 协作）。

**Tiered Storage（分层存储）**：把冷数据从 Broker 本地磁盘卸载到对象存储（S3/OSS），热数据保留本地。突破单集群存储上限。

**Compute-Storage Separation**：计算与存储分离。Broker 只负责计算（读写），存储交给 BookKeeper（Pulsar）或对象存储（Kafka Tiered Storage）。

**Change Data Capture（CDC）**：捕获数据库变更。基于 binlog / redo log 实时同步到流式存储。

### 2.2 数学 / 形式化基础

**Partition 内的顺序保证**：

- 同一 Partition 内：消息严格 FIFO。
- 不同 Partition 间：无顺序保证。
- **生产选 partition key 的关键**：保证同一业务实体（如 user_id）落到同一 partition，保证有序。

**吞吐模型**：

- 单 Partition 吞吐：~10 MB/s（写入）+ ~30 MB/s（读取）。
- N Partition 吞吐：N × 单 Partition。
- **设计原则**：Partition 数 ≥ 峰值吞吐 / 单 Partition 吞吐。

**副本一致性模型**：

- Kafka 默认：Leader 写入 + 异步复制 followers。
- Kafka acks=all：Leader 等待所有 ISR 同步后才返回。
- **强一致 vs 最终一致**：acks=all 是强一致；acks=1 是最终一致。

**EOS 的实现原理**：

- Kafka 端：事务性 Producer（Exactly-Once across partitions）。
- Flink 端：Two-Phase Commit（2PC）+ 幂等写入。
- 端到端：Kafka Transaction + Flink Checkpoint + 幂等 Sink。

**Tiered Storage 的数学原理**：

- 本地磁盘：昂贵（$200/TB/年），快（亚毫秒）。
- 对象存储：便宜（$23/TB/年 Standard-IA），慢（10-100ms）。
- **分层策略**：本地存最近 1 小时 / 1 天（热），对象存储存历史（冷）。
- **成本节省**：冷数据存储成本降低 80%+。

### 2.3 关键算法 / 方法

**1. Kafka 的存储引擎**：

- **顺序写入（Sequential Write）**：磁盘顺序写性能接近内存（HDD 100 MB/s，SSD 500 MB/s+）。
- **零拷贝（Zero-Copy, sendfile）**：PageCache 直接发送到网卡，跳过用户态。
- **PageCache**：操作系统页缓存，热点数据无需磁盘 IO。
- **Log Segment**：Partition 物理上分成多个 Segment 文件（默认 1 GB），便于清理。

**2. Kafka 的复制协议**：

- **Leader Election**：基于 ZooKeeper（旧）/ KRaft（新）选举 Leader。
- **High Watermark**：Consumer 只能读到 High Watermark 之前的数据。
- **Log End Offset（LEO）**：Partition 当前最新 offset。

**3. Kafka KRaft**：

- 2022 年 Kafka 2.8 引入，2023 年 Kafka 3.3 默认支持。
- 用 Raft 协议替代 ZooKeeper 做元数据管理。
- **优势**：部署简单（无 ZK 集群）、启动快（秒级）、元数据可扩展。

**4. Pulsar 的计算存储分离**：

- **Broker**：无状态计算节点（读写）。
- **BookKeeper**：有状态存储节点（Ackermann 协议，Ledger 存储）。
- **ZooKeeper**：元数据管理。
- **优势**：独立扩展计算 / 存储、故障恢复快（Broker 挂了无需复制数据）。

**5. Tiered Storage**：

- **Kafka Tiered Storage（KIP-405, 2020）**：本地存最近 Segment，远端对象存冷 Segment。
- **Pulsar Tiered Storage**：所有数据存 BookKeeper + 异步卸载到 S3。
- **优势**：突破单集群存储上限（PB → EB）、冷数据成本降低 80%。

**6. 流批一体存储（Streaming + Lakehouse）**：

- **Paimon**：基于 LSM Tree 的流式表格式，Kafka + Flink → Paimon → 实时查询。
- **Apache Fluss（前 Flink Table Store 衍生）**：流式原生存储，毫秒级延迟。

### 2.4 与相邻概念的关系

**流式存储 vs 传统 MQ**：

- MQ：一次性消费、ACK 后删除。
- 流式存储：可重放、长期保留。
- **流式存储包含 MQ**，但更强。

**流式存储 vs 实时数仓**：

- 流式存储 = 流动的数据（事件流）。
- 实时数仓 = 静态的聚合（ODS/DWD/DWS/ADS）。
- **流式存储是实时数仓的"输入层"**。

**流式存储 vs Lakehouse**：

- 流式存储：事件流（短期/长期保留）。
- Lakehouse：表数据（结构化）。
- **流批一体趋势**：Kafka → Flink → Paimon/Iceberg → Lakehouse。

**Kafka vs Pulsar vs RocketMQ 对比**：

| 维度 | Kafka | Pulsar | RocketMQ |
| --- | --- | --- | --- |
| 母公司 | Confluent / Apache | Yahoo / StreamNative | 阿里 / Apache |
| 架构 | 单体（Broker + 磁盘） | 计算存储分离（Broker + BookKeeper） | 单体（Broker + 磁盘） |
| 协议 | Kafka Protocol | 自有（兼容 Kafka） | RocketMQ Protocol |
| 扩展性 | 扩 Partition 重平衡 | 独立扩展计算和存储 | 扩 Broker |
| Tiered Storage | 2020+ | 2018+ | 2022+ |
| 适用 | 大数据流处理 | 云原生 / 多租户 | 阿里系业务、事务消息 |
| 社区活跃度 | 最高 | 中 | 高（国内） |

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Kafka 经典架构（单体）**

- Kafka Cluster（3-10 Broker）+ ZooKeeper（旧）或 KRaft（新）。
- 适用：传统企业、本地部署。

**模式 2：Kafka KRaft 无 ZK 架构（2022+）**

- Kafka 3.3+ 默认 KRaft，去 ZooKeeper。
- 优势：部署简单、启动快。
- 适用：所有新建 Kafka 集群。

**模式 3：Kafka Tiered Storage（分层存储）**

- 本地存最近 1 天 + 对象存历史。
- 优势：单集群 PB → EB、成本降低 80%。
- 适用：长期保留场景（合规、审计）。

**模式 4：Pulsar 计算存储分离**

- Broker（计算）+ BookKeeper（存储）+ ZooKeeper（元数据）。
- 优势：独立扩展、故障恢复快。
- 适用：云原生、多租户。

**模式 5：AutoMQ / Warpstream（云原生无服务器）**

- 兼容 Kafka 协议，存储直接用对象存储（S3/OSS）。
- 无 Broker 本地磁盘，弹性扩缩容。
- 适用：云上业务、Serverless 场景。

**模式 6：RocketMQ 事务消息**

- 支持事务消息（半消息 + 本地事务 + Broker 回查）。
- 适用：金融、电商订单、分布式事务。

**模式 7：流批一体存储（Paimon / Fluss）**

- Kafka + Flink → Paimon/Fluss → Lakehouse。
- 适用：实时数仓 + Lakehouse 融合。

**模式 8：Event Sourcing（事件溯源）**

- 所有业务状态用事件流记录。
- 适用：审计、回溯、复现。

### 3.2 适用场景决策表

| 业务场景 | 推荐模式 | 典型技术栈 |
| --- | --- | --- |
| 传统企业本地部署 | Kafka 单体 | Kafka + ZK/KRaft |
| 云原生 / 多租户 | Pulsar 计算存储分离 | Pulsar + BookKeeper + ZK |
| 阿里系业务 / 事务消息 | RocketMQ | RocketMQ + NameServer |
| 云上 Serverless | AutoMQ / Warpstream | AutoMQ + S3/OSS |
| 长期保留 / 合规 | Kafka Tiered Storage | Kafka + S3/OSS |
| 流批一体 / 实时数仓 | Kafka + Paimon/Fluss | Kafka + Flink + Paimon |
| AI Agent 事件流 | Kafka + 长保留 | Kafka 4.0 + Tiered |
| 海量日志采集 | Kafka / Pulsar + Connect | Kafka + Kafka Connect + S3 |

### 3.3 反模式与陷阱

**反模式 1：Topic 设计过细 / 过粗**

- Topic 过细：管理成本高、消费效率低。
- Topic 过粗：消费者粒度粗、浪费带宽。
- **正确**：按业务域划分 Topic（如 orders / users / payments），避免 Topic 数量爆炸。

**反模式 2：Partition 数不足**

- 单 Partition 吞吐 10 MB/s 封顶，Partition 数 = 峰值吞吐 / 10 MB/s。
- **正确**：预估未来 1-2 年峰值，预留 2x Partition 数。

**反模式 3：副本数不足**

- 副本数 = 1：单点故障。
- 副本数 = 2：脑裂风险。
- **正确**：副本数 ≥ 3。

**反模式 4：忽视 ACK 设置**

- acks=1：可能丢消息（leader 挂掉时未同步）。
- **正确**：关键业务用 acks=all。

**反模式 5：消费者未做幂等**

- 重试 / 重平衡时重复消费。
- **正确**：Consumer 端幂等（主键去重 / 状态表）。

**反模式 6：未做监控告警**

- Lag 突增、Broker 挂了才发现。
- **正确**：Consumer Lag / Broker 健康 / Disk 监控。

**反模式 7：不分层存储**

- 所有数据存本地磁盘，存储成本失控。
- **正确**：Tiered Storage（本地热 + 对象冷）。

**反模式 8：滥用 Topic 数量**

- 1000+ Topic，运维成本爆炸。
- **正确**：合并相关 Topic + 用 Schema（Avro / Protobuf）。

---

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

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：Agent 事件流基础设施**

- LLM Agent 产生的事件（thought / tool_call / action）需要持久化、可回放、可调试。
- **架构**：Agent → Kafka → 持久化 + Trace + Replay。
- **2024-2025 趋势**：AutoMQ、Warpstream 让 Agent 事件流更便宜。

**演进方向 2：流式 RAG 索引**

- 文档变更 → Embedding → 向量库 → 实时索引。
- **链路**：Kafka → Flink → Embedding → Milvus / LanceDB。
- **价值**：RAG 知识实时更新。

**演进方向 3：流式特征工程**

- 用户行为 → Kafka → Flink → 特征计算 → 实时特征库（Feast / Tecton）。
- **价值**：在线推理实时特征。

**演进方向 4：LLM 流式输出**

- LLM Token 级流式响应（ChatGPT 风格）。
- **基础设施**：流式存储 + 流式网关（如 SSE、WebSocket + Kafka）。

**演进方向 5：AI 驱动的 Kafka 运维**

- LLM 预测流量、自动扩缩容、自动调优。
- **2024 趋势**：AutoMQ / Warpstream 自动扩缩。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**流式 RAG（Streaming RAG）**：

- 文档变更 → Kafka → Flink Embedding → 向量库。
- 检索时直接读向量库，实时性高。
- **2024 案例**：Confluent Cloud + Pinecone + LangChain。

**流式 GraphRAG**：

- 事件流 → LLM 抽取实体关系 → 知识图谱。
- 适合：实时情报分析、关联推理。

**AI 驱动的 CDC + 流式存储**：

- 数据库变更 → CDC → Kafka → LLM 处理 → 写入下游。
- **2024 案例**：Flink CDC + OpenAI 提取客户情感。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **AutoMQ 论文（SOSP 2024）**：云原生无服务器 Kafka 架构，100% 对象存储。
- **Warpstream 论文（NSDI 2024）**：无 Broker 的流式存储，S3 原生。
- **Apache Paimon 论文（VLDB 2024）**：LSM Tree + 流批融合。
- **Kafka 4.0 路线图（2024）**：KIP-1030、KIP-1080 性能优化。

**工业进展**：

- **Confluent Cloud + Tiered Storage GA（2024）**：托管 Kafka 分层存储成熟。
- **Apache Kafka 3.7+ KRaft 稳定（2024）**：KRaft 成为默认。
- **AutoMQ 1.x GA（2024）**：云原生 Kafka 商业化。
- **StreamNative Cloud（2024）**：托管 Pulsar 全球扩张。
- **Apache Fluss（前 Flink Table Store 衍生）（2024）**：流式原生存储新项目。

### 5.4 未来 3-5 年趋势

**趋势 1：Serverless 流式存储成为主流**

- AutoMQ / Warpstream 让 Kafka 变 Serverless。
- 用户无需关心 Broker、磁盘、扩缩容。

**趋势 2：流批一体存储成熟**

- Paimon / Fluss 与 Lakehouse 深度融合。
- 一份存储、一套计算、流批共享。

**趋势 3：AI 原生事件流**

- LLM 直接消费 Kafka（structured output）。
- Agent 事件流成为基础设施。

**趋势 4：Tiered Storage 成为标配**

- 长期保留场景下，分层存储是默认选项。
- 单集群存储上限从 PB 提升到 EB。

**趋势 5：KRaft / 无元数据服务**

- 去 ZooKeeper / 去元数据服务是趋势。
- Pulsar / RocketMQ 也在跟进。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：LinkedIn Kafka（PB 级流式存储）**

- **数据规模**：每天数万亿消息。
- **架构**：Kafka Cluster + Tiered Storage + 自研监控。
- **效果**：支撑 LinkedIn 全平台实时数据。

**案例 2：Netflix Keystone**

- **数据规模**：每天数万亿事件。
- **架构**：Kafka + Flink + Iceberg + Pinot。
- **效果**：实时仪表盘秒级刷新。

**案例 3：腾讯 Kafka 集群（万台规模）**

- **数据规模**：数百万 QPS。
- **架构**：Kafka KRaft + Tiered Storage + 自研监控。
- **效果**：支撑微信、QQ、游戏实时数据。

**案例 4：阿里 RocketMQ（万亿级）**

- **数据规模**：每天万亿级消息。
- **架构**：RocketMQ + Controller 模式 + 多级存储。
- **效果**：支撑双 11 全链路。

### 6.2 踩坑与经验

**坑 1：Consumer Lag 失控**

- **现象**：Lag 越来越大，消费跟不上。
- **解决**：增加 Partition / Consumer + 优化消费逻辑 + 监控告警。

**坑 2：消息丢失**

- **现象**：业务反馈数据丢失。
- **解决**：acks=all + 同步复制 + Consumer 幂等。

**坑 3：磁盘打爆**

- **现象**：本地磁盘写满，集群不可用。
- **解决**：Tiered Storage（本地存最近 + 对象存历史）。

**坑 4：ZK 集群成为瓶颈**

- **现象**：ZK 集群成为 Kafka 元数据瓶颈。
- **解决**：KRaft（Kafka 3.3+）。

**坑 5：消息积压**

- **现象**：突发流量导致积压。
- **解决**：流控（限流）、降级、自动扩 Consumer。

**坑 6：Schema 不兼容**

- **现象**：上游字段改了，下游消费失败。
- **解决**：Schema Registry + Avro / Protobuf 演进规则。

**坑 7：网络分区**

- **现象**：Kafka 节点网络抖动，集群异常。
- **解决**：多 AZ 部署 + 网络冗余。

### 6.3 落地路径（0→1, 1→10, 10→100）

**阶段 1：0 → 1（启动期，0-3 个月）**

- 单 Kafka 集群，3-5 Broker，10-50 Partition。
- 团队：2 数据工程师。

**阶段 2：1 → 10（扩展期，3-12 个月）**

- 多 Kafka 集群（按业务域）。
- 引入 Schema Registry + 监控。
- 团队：5-10 数据工程师。

**阶段 3：10 → 100（规模化期，12-36 个月）**

- Tiered Storage + 多 AZ + 跨地域。
- KRaft 改造 + Serverless（AutoMQ/Warpstream）。
- 团队：10-20 + 平台团队。

### 6.4 ROI 评估

**评估维度**：

- **实时性提升**：业务响应时间从 T+1 → 秒级。
- **可靠性提升**：消息丢失率从 1% → 0.01%。
- **成本控制**：Tiered Storage 让存储成本降低 80%。
- **运维效率**：KRaft / AutoMQ 让运维成本降低 50%。

**典型 ROI**：

- LinkedIn Kafka：支撑万亿级消息，运维团队 < 10 人。
- 阿里 RocketMQ：双 11 万亿级消息，零故障。
- AutoMQ：相比自建 Kafka，TCO 降低 50-70%。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Kafka | Pulsar | RocketMQ | AutoMQ |
| --- | :---: | :---: | :---: | :---: |
| 吞吐 | 5 | 5 | 4 | 5 |
| 延迟 | 5 | 5 | 4 | 5 |
| 扩展性 | 4 | 5 | 4 | 5 |
| Tiered Storage | 4 | 5 | 3 | 5 |
| Serverless | 2 | 3 | 2 | 5 |
| 事务消息 | 3 | 3 | 5 | 3 |
| 生态 | 5 | 4 | 4 | 4 |
| 运维复杂度 | 3 | 4 | 3 | 2 |

### 7.2 决策树

```
业务需求？
├── 需要事务消息？
│   ├── 是 → RocketMQ
│   └── 否
│       ├── 云原生 / 多租户
│       │   └── Pulsar
│       ├── 云上 Serverless
│       │   └── AutoMQ / Warpstream
│       └── 传统部署
│           └── Kafka（默认）
```

### 7.3 组合使用

**组合 1：Kafka + Flink + Lakehouse**

- Kafka 流式数据 → Flink 处理 → Paimon / Iceberg 入湖。
- 适用：实时数仓 + Lakehouse。

**组合 2：Kafka + CDC + 数据湖**

- 数据库 CDC → Kafka → 数据湖（Iceberg / Hudi）。
- 适用：实时入湖。

**组合 3：Kafka + RocketMQ**

- Kafka 做流式数据主干道，RocketMQ 做事务消息。
- 适用：阿里系业务。

**组合 4：Kafka + Tiered Storage + 离线数仓**

- Kafka Tiered 冷数据直接被 Spark 离线读取。
- 适用：流批一体。

---

## 8. 面试真题集

# streaming-store 面试真题集

> **一句话定位**：Praveza / Fluss / Materialize / Kafka Streams。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 3 个原 PDF 子章节、共 14 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §2.1 | 数据源与批量采集基础 | 2.1.1, 2.1.2, 2.1.3, 2.1.4 | 4 | 辅 |
| §2.2 | 实时数据接⼊与流式采集 | 2.2.1, 2.2.2, 2.2.3, 2.2.4 | 4 | 主 |
| §13.1 | 实时数据处理核⼼组件基础概念与特性 | 13.1.1 ~ 13.1.6（共 6） | 6 | 辅 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §2 多源异构数据的实时与批量接⼊ > 本主题涵盖 2 个子节、8 道题。

#### 2.1.1 数据源与批量采集基础

> 来源：原 PDF §2.1，收录 4 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §2.1.1 | ★★★☆☆ |
| §2.1.2 | ★★★☆☆ |
| §2.1.3 | ★★★☆☆ |
| §2.1.4 | ★★★☆☆ |

- **§2.1.1**：请列举并简要说明在⼤数据平台中，常⻅的三种数据源类型及其典型的数据格式。
- **§2.1.2**：在设计和实施⼀个从传统关系型数据库到⼤数据平台的批量数据抽取⽅案时，除了
- **§2.1.3**：请描述在Hadoop⽣态系统中，Sqoop和Flume这两种⼯具的主要区别以及它们各
- **§2.1.4**：当需要从多个异构数据源（例如：业务数据库、⽇志⽂件、第三⽅API）进⾏批量

#### 2.1.2 实时数据接⼊与流式采集

> 来源：原 PDF §2.2，收录 4 道题。

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

### 2.2 §13 Flink、Kafka、ClickHouse在实时场景的应⽤

> 本主题涵盖 1 个子节、6 道题。

#### 2.2.1 实时数据处理核⼼组件基础概念与特性

> 来源：原 PDF §13.1，收录 6 道题。（辅）

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

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **实时与流处理架构**

## 4 本章小结

> 本面试真题集收录 14 道题，覆盖 2 个原 PDF 主题、3 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
