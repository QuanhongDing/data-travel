# 流式存储（Streaming Store）

> **一句话定位**：以 Kafka / Pulsar / RocketMQ 为核心的高吞吐、低延迟、可持久化的消息与流式数据基础设施，是实时数据栈的"数据主干道"。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**04 流式存储**）。覆盖 **R4 数据全栈协同** 能力领域中「流式消息中间件、流存储、分层存储、AI 时代演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 流式存储与传统消息队列的本质区别？ | §1.1 |
| Kafka / Pulsar / RocketMQ 怎么选？ | §7.1 判据、§7.6 选型矩阵 |
| Tiered Storage（分层存储）原理是什么？ | §2.1 |
| Kafka 3.7+ 的 KRaft、AutoMQ、Warpstream 有哪些新趋势？ | §5.1 表第 9 / 11 行、§5.4 |
| 流批一体存储（Paimon / Fluss）怎么落地？ | §3.2.7 |

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

**第二阶段：日志型流存储（2011-2015）**

- 2011：LinkedIn 开源 Kafka，引入"日志（Log）+ offset"模型。
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
- 2024：Apache Fluss 流式存储。
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

- Kafka 2.8 以早期访问形态引入，Kafka 3.3 宣布生产可用。
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
- **Apache Fluss**：流式原生存储，毫秒级延迟。

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

> 💡 **思考锚点**：把你手上的场景按 §2.4 那几张对比表过一遍：它落在「一次性消费、ACK 后删除」的 MQ 一侧，还是需要「可重放、长期保留」的一侧？若在后者，再问 Kafka / Pulsar / RocketMQ 那张表里你真正要用到的是哪一列——是 Kafka 的「扩 Partition 重平衡」，还是 Pulsar 的「计算存储分离、独立扩展计算和存储」？选错这一列，之后付的是长期运维成本。你选的是哪一列？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](04-streaming-store-section-3-sec3.md)
- [§4. 工程实现](04-streaming-store-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](04-streaming-store-section-5-ai.md)
- [§6. 落地实践](04-streaming-store-section-6-sec6.md)
- [§7. 与其他方法对比](04-streaming-store-section-7-sec7.md)
- [§8. 面试真题集](04-streaming-store-section-8-sec8.md)

---
