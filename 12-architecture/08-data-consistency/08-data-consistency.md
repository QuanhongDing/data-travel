# 数据一致性（Data Consistency）

> **一句话定位**：在分布式系统中，权衡 CAP 后选择合适的一致性模型（强一致 / 最终一致），用 Paxos / Raft / 2PC / TCC / Saga / Outbox 等协议实现——是分布式架构师"必修课"。

> 本文是 data-travel 项目 [Ch12 · 架构与高可用](../../README.md) 的子章节（**08 数据一致性**）。覆盖 R6 工程能力 + 大规模场景 相关的**分布式一致性工程**。

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

- 2004：Spanner 论文（Google）。
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

---

## 3. 设计模式与范式

### 3.1 主要模式

#### 模式 1：强一致模式（CP）

适用：金融、库存、订单。

- 用 Paxos / Raft 实现。
- 用 2PC / 3PC 实现分布式事务。
- 用 Global Database（CockroachDB / TiDB）。

#### 模式 2：最终一致模式（AP）

适用：社交、评论、日志。

- 用 CDC 异步同步。
- 用 Saga 拆分长事务。
- 用 Outbox 模式。

#### 模式 3：TCC 模式

适用：电商交易、强一致但性能敏感。

- Try：预留资源。
- Confirm：确认执行。
- Cancel：取消释放。

#### 模式 4：Saga 模式

适用：长事务、跨服务。

- 正向操作 + 补偿操作。
- 编排（事件驱动）或编制（协调器）。

#### 模式 5：Outbox 模式

适用：消息 + 本地事务。

- 本地消息表 + 异步发布。
- 实现"事务性消息"。

#### 模式 6：Event Sourcing

适用：审计需求、回溯需求。

- 不存当前状态，存事件流。
- 通过回放事件得到状态。

#### 模式 7：CQRS

适用：读写性能差异大。

- 写模型 + 读模型分离。
- 异步同步读模型。

#### 模式 8：AI 时代的一致性

- **向量检索一致性**：最终一致。
- **Agent 状态一致性**：单 Cell 集中。
- **推理结果一致性**：相同输入 = 相同输出。

### 3.2 适用场景决策表

| 场景 | 推荐模式 | 理由 |
| --- | --- | --- |
| 金融交易 | 强一致（2PC / TCC） | 不能出错 |
| 电商库存 | TCC / Saga | 一致性 + 性能 |
| 订单 | TCC + Outbox | 一致性 + 消息可靠 |
| 社交 | 最终一致 | 高可用优先 |
| 日志 | Event Sourcing | 审计 + 回溯 |
| AI 推理 | 链路内一致 + 链路外最终一致 | 性能优先 |
| 智能体 | 状态机 + Checkpoint | 一致性 + 恢复 |

### 3.3 反模式与陷阱

#### 反模式 1：滥用 2PC

**症状**：所有分布式事务都用 2PC。

**风险**：2PC 阻塞、协调器单点、性能差。

**正解**：根据业务选择 TCC / Saga / Outbox。

#### 反模式 2：忽视幂等性

**症状**：重复消息导致重复扣款。

**正解**：所有消息 / 调用都有幂等设计。

#### 反模式 3：跨服务大事务

**症状**：一个事务涉及 10+ 服务。

**风险**：长事务、性能差、难调试。

**正解**：Saga 拆分大事务。

#### 反模式 4：忽视网络分区

**症状**：假设网络永远可用。

**正解**：CAP 权衡，明确 P 发生时的策略。

#### 反模式 5：AI 链路的一致性失控

**症状**：Agent 状态不一致，导致决策错误。

**正解**：Agent 状态集中 + Checkpoint。

---

## 4. 工程实现

### 4.1 落地步骤

#### 阶段 1：业务分级（1 个月）

1. 强一致业务（金融 / 库存）。
2. 最终一致业务（社交 / 评论）。
3. 弱一致业务（日志 / 推荐）。

#### 阶段 2：协议选型（1-2 个月）

1. 强一致 → Paxos / Raft / Global DB。
2. 最终一致 → Saga / Outbox / CDC。
3. 跨服务 → TCC / Saga。

#### 阶段 3：实现（2-3 个月）

1. 分布式事务框架（Seata、DTM）。
2. 一致性协议（自研或开源）。
3. 幂等性设计。

#### 阶段 4：演练验证（持续）

1. 网络分区演练。
2. 协调器故障演练。
3. 数据冲突演练。

### 4.2 关键技术点

#### 1. Seata TCC 模式

```java
// Seata TCC 示例
@LocalTCC
public interface OrderTccService {
    
    @TwoPhaseBusinessAction(name = "createOrder", 
                                      commitMethod = "commit", 
                                      rollbackMethod = "rollback")
    boolean tryCreate(OrderRequest req);
    
    boolean commit(BusinessActionContext ctx);
    
    boolean rollback(BusinessActionContext ctx);
}

@Service
public class OrderTccServiceImpl implements OrderTccService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private InventoryClient inventoryClient;
    
    @Override
    public boolean tryCreate(OrderRequest req) {
        // Try：预留资源
        orderRepository.prepare(req);
        inventoryClient.prepareReserve(req);
        return true;
    }
    
    @Override
    public boolean commit(BusinessActionContext ctx) {
        // Confirm：确认执行
        OrderRequest req = (OrderRequest) ctx.getActionContext("req");
        orderRepository.confirm(req);
        return true;
    }
    
    @Override
    public boolean rollback(BusinessActionContext ctx) {
        // Cancel：取消释放
        OrderRequest req = (OrderRequest) ctx.getActionContext("req");
        orderRepository.cancel(req);
        inventoryClient.cancelReserve(req);
        return true;
    }
}
```

#### 2. Outbox 模式

```java
// Outbox：本地消息表 + 异步发布
@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private OutboxRepository outboxRepository;
    
    @Transactional
    public Order createOrder(OrderRequest req) {
        // 1. 创建订单
        Order order = orderRepository.save(req.toOrder());
        
        // 2. 写入 Outbox（同一事务）
        OutboxMessage msg = new OutboxMessage();
        msg.setTopic("order.created");
        msg.setPayload(order.toJson());
        outboxRepository.save(msg);
        
        return order;
    }
}

// 定时任务：发布 Outbox
@Scheduled(fixedDelay = 1000)
public void publishOutbox() {
    List<OutboxMessage> msgs = outboxRepository.findUnpublished();
    for (OutboxMessage msg : msgs) {
        kafkaTemplate.send(msg.getTopic(), msg.getPayload());
        msg.setPublished(true);
        outboxRepository.save(msg);
    }
}
```

#### 3. Raft 共识（etcd 风格）

```python
# Raft 简化实现（伪代码）
class RaftNode:
    def __init__(self):
        self.current_term = 0
        self.voted_for = None
        self.log = []
        self.commit_index = -1
        self.role = "Follower"
    
    def become_candidate(self):
        self.current_term += 1
        self.voted_for = self.id
        self.role = "Candidate"
        # 发送 RequestVote RPC
        votes = self.request_votes_from_peers()
        if votes > len(self.peers) / 2:
            self.become_leader()
    
    def become_leader(self):
        self.role = "Leader"
        # 开始心跳
        self.start_heartbeat()
    
    def append_entries(self, entries):
        # 复制日志到 Follower
        for peer in self.peers:
            peer.append_entries_rpc(
                term=self.current_term,
                entries=entries,
                prev_log_index=len(self.log) - 1,
                prev_log_term=self.log[-1].term if self.log else 0
            )
        # 等待多数派确认
        if self.majority_acked():
            self.commit_index = len(self.log) - 1
```

### 4.3 工具链与平台（含 2024-2025 新工具）

| 类别 | 工具 | 特点 |
| --- | --- | --- |
| **分布式事务** | Seata、DTM、ByteTCC | TCC / Saga / AT 模式 |
| **一致性协议** | etcd、ZooKeeper、Consul | Raft / ZAB |
| **Global DB** | CockroachDB、TiDB、OceanBase | 全球分布式数据库 |
| **CDC** | Debezium、Maxwell、Canal | 变更数据捕获 |
| **消息队列** | Kafka、RocketMQ、Pulsar | 事务性消息 |

### 4.4 代码 / 示例

#### Saga 模式（编排式）

```java
// Saga 编排式
@Service
public class OrderSaga {
    
    @Autowired
    private SagaEngine sagaEngine;
    
    public void createOrder(OrderRequest req) {
        SagaDefinition saga = new SagaDefinition("createOrder")
            .step("createOrder")
                .action(orderService::create)
                .compensation(orderService::cancel)
            .step("reserveInventory")
                .action(() -> inventoryService.reserve(req))
                .compensation(() -> inventoryService.cancelReserve(req))
            .step("chargePayment")
                .action(() -> paymentService.charge(req))
                .compensation(() -> paymentService.refund(req))
            .step("sendNotification")
                .action(() -> notificationService.send(req))
                .compensation(() -> notificationService.cancel(req));
        
        sagaEngine.execute(saga, req);
    }
}
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

#### 1. 向量检索一致性

- **向量索引最终一致**：跨 Region 异步同步。
- **CRDT 向量索引**：自动冲突解决。

#### 2. Agent 状态一致性

- **Agent Checkpoint**：定期快照，恢复时回放。
- **状态机复制**：Agent 状态用 Raft 复制。
- **Actor 模型**：单 Actor 处理消息，避免并发问题。

#### 3. 推理结果一致性

- **相同输入 = 相同输出**：temperature = 0。
- **Prompt 缓存**：相同 Prompt 走缓存。
- **RAG 一致性**：知识库更新同步。

#### 4. AI 辅助一致性决策

- **AI 决策 CAP**：根据业务自动选择 CAP。
- **AI 异常检测**：检测一致性异常。
- **AI 自动修复**：自动修复不一致。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

RAG 一致性的挑战：

```
知识库更新 → Embedding 重新生成 → 向量索引更新 → LLM Prompt 缓存失效
```

**RAG 一致性策略**：

- **最终一致**：知识库更新后异步更新 Embedding / 向量索引。
- **版本标签**：知识库用版本号标记，检索时用对应版本。
- **缓存失效**：Prompt 缓存用知识库版本号作为 key。

### 5.3 学术与工业最新进展（2024-2025）

- **Google 2024**：Spanner 跨大洲强一致升级。
- **CockroachDB 2024**：跨 Region 事务优化。
- **TiDB 2024**：HTAP + 多 Region 强一致。
- **阿里 OceanBase 2024**：AI 时代一致性增强。
- **字节跳动 2024**：自研一致性协议。

### 5.4 未来 3-5 年趋势

1. **AI 主导的一致性**：AI 自动决策 CAP。
2. **跨链一致性**：跨区块链的一致性。
3. **Self-Consistent AI**：AI 系统自一致性。
4. **边缘一致性**：边缘 + 云端协同一致。

---

## 6. 落地实践

### 6.1 真实案例

#### 案例 1：阿里 Seata

**场景**：阿里电商分布式事务。

**关键实践**：

- **AT 模式**：自动补偿（基于 SQL 解析）。
- **TCC 模式**：高性能（手动实现）。
- **Saga 模式**：长事务（编排式）。
- **XA 模式**：强一致（数据库 XA）。

**结果**：阿里电商分布式事务标准化。

#### 案例 2：Google Spanner

**场景**：Google 内部全球分布式数据库。

**关键实践**：

- **TrueTime**：GPS + 原子钟，区间 1-7ms。
- **Paxos**：跨 Region 复制。
- **2PC + TrueTime**：跨 Region 强一致。

**结果**：Google 全球业务跨大洲强一致。

### 6.2 踩坑与经验

#### 坑 1：2PC 阻塞

**解决**：避免长事务，用 Saga 替代。

#### 坑 2：幂等性缺失

**解决**：所有消息 / 调用都有幂等键。

#### 坑 3：协调器单点

**解决**：用 Raft / Paxos 实现协调器高可用。

#### 坑 4：跨 Region 强同步性能差

**解决**：跨 Region 用最终一致，Region 内强一致。

### 6.3 落地路径（0→1, 1→10, 10→100）

#### 0→1

1. 业务分级。
2. 协议选型。
3. 第一个分布式事务。

#### 1→10

1. 分布式事务框架。
2. 一致性协议。
3. 幂等性设计。

#### 10→100

1. 跨 Region 一致性。
2. AI 辅助一致性。
3. 自适应一致性。

### 6.4 ROI 评估

#### 收益维度

- **业务正确性**：避免资金损失、订单错误。
- **用户体验**：避免重复扣款、超卖。

#### 投入维度

- **开发成本**：分布式事务框架开发。
- **性能成本**：强一致性能损失。
- **运维成本**：协调器维护。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 2PC | TCC | Saga | Outbox | CDC |
| --- | :---: | :---: | :---: | :---: | :---: |
| 强一致 | 5 | 5 | 3 | 4 | 2 |
| 性能 | 2 | 4 | 4 | 4 | 5 |
| 复杂度 | 3 | 4 | 3 | 3 | 4 |
| 适用性 | 3 | 4 | 5 | 5 | 5 |
| **综合推荐度** | ★★★ | ★★★★ | ★★★★ | ★★★★★ | ★★★★ |

### 7.2 决策树

```
你的业务对一致性要求？
├─ 强一致 → 2PC / TCC / Global DB
├─ 最终一致 → Saga / Outbox / CDC
└─ 弱一致 → Event Sourcing / 异步消息

你的性能要求？
├─ 高 → TCC / Saga
├─ 中 → Outbox
└─ 低 → 2PC
```

### 7.3 组合使用

- **2PC + TCC**：核心用 2PC，边缘用 TCC。
- **Saga + Outbox**：Saga 拆分 + Outbox 消息。
- **CDC + Event Sourcing**：CDC 触发事件流。
- **一致性 + 单元化**：单元化降低一致性复杂度。
- **一致性 + AI**：AI 链路的一致性保障。

---

## 8. 面试真题集

> 本节保留原题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真题集，便于读者交叉查阅。

# data-consistency 面试真题集

> **一句话定位**：强一致 vs 最终一致、CAP 权衡、Paxos / Raft 工程实践。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 6 个原 PDF 子章节、共 36 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | :---: | :---: | :---: |
| §6.5 | Spark Streaming ⾼级特性与容错机制 | 6.5.1 ~ 6.5.7（共 7） | 7 | 辅 |
| §8.5 | ⼤规模集群性能与容错 | 8.5.1 ~ 8.5.7（共 7） | 7 | 主 |
| §10.2 | 跨机架数据分布与容错 | 10.2.1, 10.2.2, 10.2.3, 10.2.4, 10.2.5 | 5 | 主 |
| §17.6 | 数据⼀致性与容错机制 | 17.6.1 ~ 17.6.7（共 7） | 7 | 主 |
| §20.2 | 数据⼀致性模型与CAP理论 | 20.2.1, 20.2.2, 20.2.3, 20.2.4, 20.2.5 | 5 | 主 |
| §20.4 | 数据冲突检测与解决策略 | 20.4.1, 20.4.2, 20.4.3, 20.4.4, 20.4.5 | 5 | 主 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §6 ⼤规模数据处理应⽤的开发与优化 > 本主题涵盖 1 个子节、7 道题。

#### 2.1.5 Spark Streaming ⾼级特性与容错机制

> 来源：原 PDF §6.5，收录 7 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §6.5.1 | ★★★☆☆ |
| §6.5.2 | ★★★☆☆ |
| §6.5.3 | ★★★☆☆ |
| §6.5.4 | ★★★☆☆ |
| §6.5.5 | ★★★★☆ |
| §6.5.6 | ★★★★☆ |
| §6.5.7 | ★★★★★ |

- **§6.5.1**：请简要说明 Spark Streaming 与 Kafka 集成时，Direct API 和 Receiver-based
- **§6.5.2**：请解释在 Spark Streaming 与 Kafka 的集成中，'⾄少⼀次'（At-Least-Once）
- **§6.5.3**：为了实现 Spark Streaming 从 Kafka 消费数据时的 Exactly-Once 语义，需要协
- **§6.5.4**：在启⽤ Spark Streaming 的 WAL（Write-Ahead Log）功能时，它如何与 Kafka
- **§6.5.5**：请分析在超⼤规模（例如万节点级别）Spark 集群上运⾏ Spark Streaming 应⽤
- **§6.5.6**：在 Spark Streaming 应⽤中，如何通过设置检查点（Checkpointing）机制来实现
- **§6.5.7**：当 Spark Streaming 应⽤在处理 Kafka 数据过程中发⽣故障并重启后，如何确保

### 2.2 §8 构建统⼀数据服务的Lambda架构实践 > 本主题涵盖 1 个子节、7 道题。

#### 2.2.5 ⼤规模集群性能与容错

> 来源：原 PDF §8.5，收录 7 道题。

| 题号 | 难度 |
| --- | :---: |
| §8.5.1 | ★★★☆☆ |
| §8.5.2 | ★★★☆☆ |
| §8.5.3 | ★★★☆☆ |
| §8.5.4 | ★★★☆☆ |
| §8.5.5 | ★★★★☆ |
| §8.5.6 | ★★★★☆ |
| §8.5.7 | ★★★★★ |

- **§8.5.1**：在万节点规模的Hadoop/Spark集群中，请列举三种常⻅的性能瓶颈，并简要说明
- **§8.5.2**：针对Lambda架构中批层（如使⽤HDFS）和流层（如使⽤Kafka）的数据存储，请
- **§8.5.3**：请解释在超⼤规模集群下，数据本地性（Data Locality）对Spark作业性能的关键
- **§8.5.4**：在万节点集群中，如何利⽤现代硬件技术（如Optane持久内存、RDMA⽹络）和
- **§8.5.5**：请描述在Lambda架构中，批层和流层的数据⼀致性是如何保证的？当出现数据不
- **§8.5.6**：在规划⼀个⽀持Lambda架构的万节点数据平台时，你会如何设计集群的资源调度
- **§8.5.7**：假设⼀个万节点集群的某个机架⽹络发⽣故障，请阐述⼀个⾃动化的故障检测与恢

### 2.3 §10 应对节点、机架乃⾄数据中⼼级别故障 > 本主题涵盖 1 个子节、5 道题。

#### 2.3.2 跨机架数据分布与容错

> 来源：原 PDF §10.2，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §10.2.1 | ★★★☆☆ |
| §10.2.2 | ★★★☆☆ |
| §10.2.3 | ★★★☆☆ |
| §10.2.4 | ★★★☆☆ |
| §10.2.5 | ★★★★☆ |

- **§10.2.1**：在规划跨数据中⼼的⼤数据集群时，除了数据复制，还有哪些关键策略可以⽤于
- **§10.2.2**：在设计HDFS数据块存储策略时，如何通过配置机架感知来提升数据的可靠性和读
- **§10.2.3**：请描述在YARN集群中，当某个计算任务的⼀个容器（Container）因其所在机架
- **§10.2.4**：假设⼀个关键的数据处理流⽔线需要跨多个机架运⾏，请设计⼀套详细的监控与
- **§10.2.5**：请阐述在万节点规模的Spark集群中，如何设计和优化数据本地性策略，以最⼩化

### 2.4 §17 构建新⼀代统⼀的数据架构 > 本主题涵盖 1 个子节、7 道题。

#### 2.4.6 数据⼀致性与容错机制

> 来源：原 PDF §17.6，收录 7 道题。

| 题号 | 难度 |
| --- | :---: |
| §17.6.1 | ★★★☆☆ |
| §17.6.2 | ★★★☆☆ |
| §17.6.3 | ★★★☆☆ |
| §17.6.4 | ★★★☆☆ |
| §17.6.5 | ★★★★☆ |
| §17.6.6 | ★★★★☆ |
| §17.6.7 | ★★★★★ |

- **§17.6.1**：请解释在数据处理系统中，'⾄少⼀次'（At-Least-Once）、'⾄多⼀次'（At-Most
- **§17.6.2**：在数据湖仓⼀体（Lakehouse）架构中，像Apache Iceberg或Delta Lake这样的
- **§17.6.3**：在构建⼀个⽀持端到端精确⼀次处理（End-to-End Exactly-Once）的流处理管
- **§17.6.4**：请描述Apache Spark Structured Streaming是如何通过检查点（Checkpointin
- **§17.6.5**：当设计⼀个万节点级别的批流⼀体（Batch-Streaming Unification）数据平台
- **§17.6.6**：请对⽐分析在Kafka Connect、Debezium等CDC（Change Data Capture）⼯具
- **§17.6.7**：请阐述在Apache Flink中实现精确⼀次语义（Exactly-Once Semantics）所依赖

### 2.5 §20 全球化业务下的数据同步与⼀致性保障 > 本主题涵盖 2 个子节、10 道题。

#### 2.5.2 数据⼀致性模型与CAP理论

> 来源：原 PDF §20.2，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §20.2.1 | ★★★☆☆ |
| §20.2.2 | ★★★☆☆ |
| §20.2.3 | ★★★☆☆ |
| §20.2.4 | ★★★☆☆ |
| §20.2.5 | ★★★★☆ |

- **§20.2.1**：在设计⼀个跨地域数据同步系统时，如果业务要求⾼可⽤性并能容忍短暂的数据
- **§20.2.2**：请对⽐分析强⼀致性和最终⼀致性在实现机制、性能开销和适⽤业务场景⽅⾯的
- **§20.2.3**：假设你负责的跨地域⼤数据平台需要同时⽀持强⼀致性要求的⾦融交易数据和最
- **§20.2.4**：在⼀个全球化电商平台的订单系统中，如何设计数据同步⽅案来保证跨地域数据
- **§20.2.5**：请解释在分布式系统中，CAP理论中的C、A、P分别代表什么含义，并简要说明

#### 2.5.4 数据冲突检测与解决策略

> 来源：原 PDF §20.4，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §20.4.1 | ★★★☆☆ |
| §20.4.2 | ★★★☆☆ |
| §20.4.3 | ★★★☆☆ |
| §20.4.4 | ★★★☆☆ |
| §20.4.5 | ★★★★☆ |

- **§20.4.1**：在⼀个跨地域多中⼼的分布式系统中，如果采⽤向量时钟来检测数据冲突，请描
- **§20.4.2**：假设你正在为⼀个全球性电商平台设计数据同步⽅案，该平台在亚洲、欧洲和美
- **§20.4.3**：请解释 Last-Write-Win (LWW) 这种数据冲突解决策略的基本原理，并分析它在
- **§20.4.4**：在全球化业务的数据同步场景中，数据冲突是⼀个常⻇问题，请解释什么是数据
- **§20.4.5**：请解释向量时钟（Vector Clock）的⼯作原理，并说明它相⽐于 Last-Write-Wi

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **性能优化与调优**
- **技术决策与战略**
- **集群容错与故障恢复**

## 4 本章小结

> 本面试真题集收录 36 道题，覆盖 5 个原 PDF 主题、6 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [12-architecture 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)