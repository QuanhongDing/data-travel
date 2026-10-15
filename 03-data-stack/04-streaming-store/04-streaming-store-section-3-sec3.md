> 本文件是 **04-streaming-store.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](04-streaming-store.md)。

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
