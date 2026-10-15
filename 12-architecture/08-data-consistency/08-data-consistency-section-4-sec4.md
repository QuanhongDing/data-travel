> 本文件是 **08-data-consistency.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](08-data-consistency.md)。

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
