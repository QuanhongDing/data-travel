# 数据一致性（Data Consistency）

> **一句话定位**：在分布式系统中，权衡 CAP 后选择合适的一致性模型（强一致 / 最终一致），用 Paxos / Raft / 2PC / TCC / Saga / Outbox 等协议实现——是分布式架构师"必修课"。

> 本文是 data-travel 项目 [Ch12 · 架构与高可用](../../README.md) 的子章节（**08 数据一致性**）。覆盖 R6 工程能力 + 大规模场景相关的**分布式一致性工程**。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| CAP 怎么权衡？强一致 vs 最终一致怎么选？ | §1.2、§3.2 |
| Paxos / Raft 怎么理解？ | §2.1、§4.2 |
| 分布式事务（2PC / TCC / Saga）怎么选？ | §3.1、§3.2 |
| Outbox / CDC / Event Sourcing 怎么用？ | §4.2 |
| AI 时代数据一致性有什么新挑战？ | §5 |
| 真实案例：阿里 / 字节 / Google Spanner | §6.1 |

---

## 1. 概念与定位

### 1.1 是什么

**数据一致性（Data Consistency）**是**在分布式系统中，确保多个副本 / 多个服务 / 多个 Region 看到的数据是一致的**——是分布式系统的"灵魂问题"。

它由五个层次组成：

1. **强一致（Strong Consistency）**：所有节点同时看到最新写入。
2. **弱一致（Weak Consistency）**：不保证何时能看到最新写入。
3. **最终一致（Eventual Consistency）**：保证最终能看到最新写入（无时间保证）。
4. **因果一致（Causal Consistency）**：有因果关系的操作保证顺序。
5. **读己之写（Read-your-writes）**：自己写的数据自己能立即读到。

**CAP 理论（Eric Brewer, 2000）**：

分布式系统三选二：
- **C（Consistency）**：强一致性
- **A（Availability）**：可用性
- **P（Partition Tolerance）**：分区容忍

实践：P 必须满足（网络分区不可避免），所以只能在 C 和 A 之间权衡。

### 1.2 为什么需要

**业务驱动力**：

- **金融交易**：资金不能丢、不能错、不能双扣。
- **电商库存**：不能超卖、不能少卖。
- **AI 时代**：智能体决策需要一致的事实。
- **跨 Region**：多 Region 写入需要一致性协议。
- **微服务**：跨服务调用需要分布式事务。

**痛点**：

1. **分布式事务复杂**：2PC / TCC / Saga 难实现、难调试。
2. **CAP 难权衡**：C 和 A 难两全。
3. **数据冲突**：多 Region 写入同一数据冲突。
4. **幂等性**：重复消息、重复调用难处理。
5. **性能 vs 一致性**：强一致性能差。

### 1.3 在 AI 时代数据架构中的位置

**在分布式体系中的位置**：

```
[单机事务] → [分布式事务] → [一致性协议] → [AI 时代的一致性]
```

**与其他章的关系**：

- **Ch12 §01 单元化**：单元化避免跨单元写入冲突。
- **Ch12 §02 异地多活**：异地多活需要一致性协议。
- **Ch12 §07 容灾**：容灾切换需要一致性保障。
- **Ch5 智能体平台**：智能体决策需要事实一致性。

### 1.4 演进历程

**传统阶段（1970s-2000s）**：

- 1976：CAP 雏形。
- 1989：2PC（Two-Phase Commit）。
- 1998：Paxos 论文（Lamport）。
- 1999：BASE 理论。

**云原生阶段（2000s-2020）**：

- 2012：Spanner 论文（Google）。
- 2014：Raft 论文（Diego Ongaro）。
- 2016：Apache Kafka Exactly-Once 语义。
- 2017：CockroachDB 1.0。

**AI 时代（2020+）**：

- 2020：向量检索一致性。
- 2023：智能体状态一致性。
- 2024：AI 推理结果一致性。
- 2025+：Self-Consistent AI 系统。

---

## 2. 核心原理

### 2.1 关键概念定义

- **CAP 理论**：C、A、P 三选二。
- **BASE 理论**：Basically Available、Soft state、Eventual consistency。
- **强一致（Strong Consistency）**：所有节点同时看到最新写入。
- **最终一致（Eventual Consistency）**：保证最终一致（无时间保证）。
- **因果一致（Causal Consistency）**：有因果关系的一致。
- **线性一致性（Linearizability）**：所有操作看起来像在一个单点上执行。
- **顺序一致性（Sequential Consistency）**：所有操作顺序一致。
- **Paxos / Raft**：分布式一致性算法。
- **2PC（Two-Phase Commit）**：两阶段提交。
- **3PC（Three-Phase Commit）**：三阶段提交。
- **TCC（Try-Confirm-Cancel）**：补偿型分布式事务。
- **Saga**：长事务拆分模式。
- **Outbox 模式**：本地消息表模式。
- **CDC（Change Data Capture）**：变更数据捕获。
- **Event Sourcing**：事件溯源。
- **CQRS（Command Query Responsibility Segregation）**：命令查询职责分离。
- **幂等性（Idempotency）**：重复操作结果相同。
- **向量时钟（Vector Clock）**：用于检测冲突。
- **CRDT**：无冲突复制数据类型。
- **Quorum**：多数派（NWR 策略）。
- **MVCC（Multi-Version Concurrency Control）**：多版本并发控制。
- **2PL（Two-Phase Locking）**：两阶段锁。
- **SSI（Serializable Snapshot Isolation）**：可序列化快照隔离。
- **ACID**：原子性、一致性、隔离性、持久性（数据库事务）。
- **分布式锁（Distributed Lock）**：跨节点的锁。
- **全局时钟（TrueTime / HLC）**：全局同步时钟。

### 2.2 数学 / 形式化基础

**CAP 定理**：

```
∄ (C ∧ A) 当 P 发生时

即：在网络分区发生时，不能同时保证强一致和可用性。
```

**PACELC 定理**：

```
如果没有分区（PA）：在 Latency 和 Consistency 之间权衡
如果有分区（PC）：在 Availability 和 Consistency 之间权衡
```

**NWR 策略（Quorum）**：

```
R + W > N：强一致
- N：副本数
- W：写入副本数
- R：读取副本数

例：N=3，W=2，R=2：写入 2 个节点，读取 2 个节点，强一致
```

**Paxos 算法**：

```
Phase 1 (Prepare)：
- Proposer 选择提案编号 n，向多数派发送 Prepare(n)
- Acceptor 收到 Prepare(n)，如果 n > 已见过的最大编号，承诺不再接受 < n 的提案

Phase 2 (Accept)：
- Proposer 收到多数派承诺，发送 Accept(n, value)
- Acceptor 收到 Accept(n, value)，如果 n >= 已承诺的最大编号，接受

Phase 3 (Decide)：
- Acceptor 接受 Accept 后，通知 Learner
- Learner 收到多数派通知，学习该值
```

**Raft 算法**：

```
Leader Election：
- Follower 超时未收到心跳 → 变成 Candidate
- Candidate 获得多数派投票 → 变成 Leader
- Term 递增，每次选举一个 Term

Log Replication：
- Leader 接收客户端请求
- Leader 复制日志到 Follower
- Wait for majority → commit

Safety：
- 只有 Leader 能 commit
- 只有包含最新日志的节点能成为 Leader
```

**2PC 协议**：

```
Phase 1 (Prepare)：
- Coordinator 向所有参与者发送 Prepare
- 参与者写入 undo / redo 日志，返回 Yes/No

Phase 2 (Commit/Rollback）：
- Coordinator 收集所有响应
- 全 Yes → 发送 Commit
- 任一 No → 发送 Rollback
- 参与者执行 Commit/Rollback

问题：Coordinator 故障 → 阻塞
```

**Saga 模式**：

```
长事务 = T1 + T2 + T3 + ... + Tn

每个 Ti 有对应的补偿 Ci
正向：T1 → T2 → T3 → ... → Tn
反向（C1, C2, ...）：失败时按反序补偿

两种协调方式：
- 编排（Choreography）：事件驱动，无中心
- 编制（Orchestration）：中心化协调器
```

### 2.3 关键算法 / 方法

1. **一致性协议**：
   - **Paxos**：Lamport 提出的分布式共识算法，难理解但被广泛使用。
   - **Raft**：Paxos 的简化版，易理解，是分布式系统的事实标准。
   - **ZAB**：ZooKeeper 的原子广播协议。
   - **PBFT**：Practical Byzantine Fault Tolerance，拜占庭容错。

2. **分布式事务模式**：
   - **2PC**：强一致，但阻塞。
   - **3PC**：减少阻塞，但仍有缺陷。
   - **TCC**：补偿型，性能好但开发复杂。
   - **Saga**：长事务拆分，最终一致。
   - **Outbox**：本地消息表 + 异步发布。
   - **CDC**：基于 binlog 的同步。
   - **Event Sourcing**：事件溯源。

3. **冲突解决**：
   - **LWW（Last-Write-Wins）**：基于时间戳。
   - **向量时钟**：检测冲突。
   - **CRDT**：数学保证最终一致。
   - **应用层解决**：业务层决定。

4. **一致性级别**：
   - **Read-your-writes**：自己读自己写。
   - **Monotonic reads**：单调读。
   - **Monotonic writes**：单调写。
   - **Causal consistency**：因果一致。

5. **AI 时代的一致性**：
   - **向量索引一致性**：向量数据库的最终一致。
   - **Agent 状态一致性**：智能体状态的同步。
   - **Prompt 一致性**：相同 Prompt 走缓存。
   - **推理结果一致性**：相同输入产生相同输出。

### 2.4 与相邻概念的关系

| 相邻概念 | 关系 | 关键差异 |
| --- | --- | --- |
| 异地多活（Ch12 §02） | 应用 | 异地多活需要一致性协议 |
| 单元化（Ch12 §01） | 物理基础 | 单元化降低一致性复杂度 |
| 容灾（Ch12 §07） | 应用 | 容灾切换需要一致性 |
| 数据复制 | 基础 | 数据复制是一致性的实现手段 |

> 💡 **思考锚点**：挑你们系统里最吃重的一次跨库写（下单 + 扣库存 + 记账这类），按 §2.3 认一下它现在走的是 2PC、TCC 还是 Saga——2PC 强一致但阻塞、Saga 最终一致不阻塞；在你们真实的 QPS 与故障率下，你打算把阻塞窗口压到多少毫秒，或把最终一致窗口放宽到多少秒？

---

- [§3. 设计模式与范式](08-data-consistency-section-3-sec3.md)
- [§4. 工程实现](08-data-consistency-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](08-data-consistency-section-5-ai.md)
- [§6. 落地实践](08-data-consistency-section-6-sec6.md)
- [§7. 与其他方法对比](08-data-consistency-section-7-sec7.md)
- [§8. 面试真题集](08-data-consistency-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](08-data-consistency-section-3-sec3.md)
- [§4. 工程实现](08-data-consistency-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](08-data-consistency-section-5-ai.md)
- [§6. 落地实践](08-data-consistency-section-6-sec6.md)
- [§7. 与其他方法对比](08-data-consistency-section-7-sec7.md)
- [§8. 面试真题集](08-data-consistency-section-8-sec8.md)

---
