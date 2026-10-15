> 本文件是 **02-multi-region.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](02-multi-region.md)。

## 4. 工程实现

### 4.1 落地步骤

#### 阶段 1：业务分级

1. **核心业务**：必须异地多活（如下单、支付）。
2. **重要业务**：同城双活（如商品详情）。
3. **一般业务**：Active-Passive（如评论、推荐）。
4. **内部业务**：单 Region（成本优先）。

#### 阶段 2：数据分层

1. **强一致数据**：订单、支付 → 同城双活 + Global Database。
2. **最终一致数据**：商品、库存 → 异地多活 + CDC 同步。
3. **弱一致数据**：评论、日志 → Active-Active + 异步同步。
4. **不可同步数据**：用户密码、密钥 → 单 Region + 加密存储。

#### 阶段 3：同步链路设计

1. **同步通道**：CDC / binlog / 消息队列 / 自研同步工具。
2. **冲突解决**：LWW / 向量时钟 / CRDT / 应用层。
3. **数据校验**：定期对账、发现数据不一致。

#### 阶段 4：流量调度

1. **DNS 调度**：粗粒度（Region 级）。
2. **GSLB**：中粒度（地域级 + 网络质量）。
3. **服务网格**：细粒度（服务级 / 用户级）。

#### 阶段 5：演练验证

1. **单 Region 故障演练**：模拟 Region A 故障，观察流量切到 Region B。
2. **数据同步演练**：验证同步链路、数据一致性。
3. **冲突解决演练**：制造冲突，验证解决策略。

### 4.2 关键技术点

#### 1. CDC 同步（Debezium）

```yaml
# Debezium MySQL Source
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaConnector
metadata:
  name: mysql-source-connector
spec:
  class: io.debezium.connector.mysql.MySqlConnector
  config:
    database.hostname: mysql.region-a.local
    database.port: 3306
    database.user: debezium
    database.password: ${DEPLOY_PASSWORD}  # env var reference
    database.server.id: 184054
    database.server.name: region-a-mysql
    database.include.list: mydb
    table.include.list: mydb.orders,mydb.payments
    snapshot.mode: initial
```

#### 2. Pulsar 跨 Region 复制

```bash
# 在 cluster-a 创建 namespace 并开启跨集群复制
pulsar-admin namespaces create-cluster-subscription \
  --cluster cluster-a \
  --tenant public \
  --namespace my-namespace

# cluster-b 订阅 cluster-a 的数据
pulsar-admin namespaces set-clusters \
  --tenant public \
  --namespace my-namespace \
  --clusters cluster-a,cluster-b
```

#### 3. 向量时钟冲突检测

```python
class VectorClock:
    def __init__(self, regions):
        self.clock = {r: 0 for r in regions}
    
    def increment(self, region):
        self.clock[region] += 1
    
    def merge(self, other):
        for r in self.clock:
            self.clock[r] = max(self.clock[r], other.clock[r])
    
    def is_concurrent(self, other):
        # A 在 B 之前：如果 A 的每个分量 ≤ B，且至少一个 < B
        a_before_b = all(self.clock[r] <= other.clock[r] for r in self.clock) \
                     and any(self.clock[r] < other.clock[r] for r in self.clock)
        b_before_a = all(other.clock[r] <= self.clock[r] for r in self.clock) \
                     and any(other.clock[r] < self.clock[r] for r in self.clock)
        return not (a_before_b or b_before_a)
```

#### 4. CRDT：G-Counter

```python
# G-Counter：每个 Region 独立计数，合并时取最大值
class GCounter:
    def __init__(self, regions):
        self.counters = {r: 0 for r in regions}
    
    def increment(self, region, value=1):
        self.counters[region] += value
    
    def merge(self, other):
        for r in self.counters:
            self.counters[r] = max(self.counters[r], other.counters[r])
    
    def value(self):
        return sum(self.counters.values())
```

### 4.3 工具链与平台（含 2024-2025 新工具）

#### Global Database

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **Google Spanner** | Google | 全球强一致，TrueTime 专利 |
| **CockroachDB** | Cockroach Labs | 开源 Spanner 风格，PostgreSQL 兼容 |
| **YugabyteDB** | Yugabyte | PostgreSQL / Cassandra 兼容 |
| **TiDB** | PingCAP | MySQL 兼容，国内主流 |
| **OceanBase** | 蚂蚁 | 国产化，金融级 |
| **AWS Aurora Global Database** | AWS | 跨 Region 复制，< 1s RPO |
| **Azure Cosmos DB** | Microsoft | 多模型，全球分布 |
| **Google Cloud Spanner** | Google Cloud | 云上 Spanner |

#### CDC 工具

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **Debezium** | 开源 | CDC 平台，基于 binlog |
| **Maxwell** | 开源 | MySQL binlog 解析 |
| **阿里 DTS** | 阿里云 | 数据传输服务，商业化 |
| **腾讯 DTS** | 腾讯云 | 数据传输服务 |
| **Apache SeaTunnel** | Apache | 大数据同步 |
| **DataX** | 阿里 | 批量数据迁移 |
| **Canal** | 阿里 | MySQL binlog 增量订阅 |

#### 流量调度

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **AWS Route 53** | AWS | DNS + GSLB |
| **阿里云 DNS** | 阿里云 | DNS + GSLB |
| **Cloudflare** | Cloudflare | DNS + Anycast |
| **NS1** | NS1 | DNS + GSLB |
| **F5 BIG-IP DNS** | F5 | 商业 GSLB |
| **Istio** | 开源 | 服务网格层流量调度 |

### 4.4 代码 / 示例

#### Spring Boot 多数据源 + LWW

```java
// 多 Region 写入，LWW 冲突解决
@Service
public class MultiRegionOrderService {
    
    @Autowired
    @Qualifier("regionADataSource")
    private DataSource regionA;
    
    @Autowired
    @Qualifier("regionBDataSource")
    private DataSource regionB;
    
    @Transactional
    public Order createOrder(Order order) {
        // 1. 写入本地 Region（Region A）
        order.setTimestamp(Instant.now());
        order.setRegion("region-a");
        orderRepositoryA.save(order);
        
        // 2. 异步同步到 Region B（CDC / MQ）
        kafkaTemplate.send("order-updates", order);
        
        return order;
    }
    
    @KafkaListener(topics = "order-updates")
    public void syncOrder(Order order) {
        // 接收其他 Region 的更新，应用 LWW
        Order existing = orderRepositoryB.findById(order.getId()).orElse(null);
        if (existing == null || order.getTimestamp().isAfter(existing.getTimestamp())) {
            order.setRegion("region-b");
            orderRepositoryB.save(order);
        }
    }
}
```

#### CockroachDB 跨 Region 部署

```sql
-- 创建跨 Region 的表
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INT NOT NULL,
    amount DECIMAL NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
) WITH (
    constraint_schema = 'INTERLEAVE IN PARENT users (user_id)',
    locality = 'GLOBAL'
);

-- 用户表按 Region 分区
CREATE TABLE users (
    id INT PRIMARY KEY,
    region STRING NOT NULL,
    'name' STRING NOT NULL
) WITH (
    locality = 'REGIONAL BY region'
);
```

---
