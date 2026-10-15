> 本文件是 **01-cell-based-architecture.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](01-cell-based-architecture.md)。

## 4. 工程实现

### 4.1 落地步骤

#### 阶段 1：业务域切分（1-2 个月）

1. **识别业务键**：userId / orderId / region。
2. **估算 Cell 数量**：基于峰值 QPS 和单 Cell 容量。
3. **设计路由规则**：Hash 算法、容灾策略。

#### 阶段 2：数据切分（2-3 个月）

1. **DB 水平切分**：按业务键水平切到 N 个 DB。
2. **Cache 切分**：Redis Cluster 按业务键分片。
3. **MQ 切分**：Kafka Topic 按业务键分区。

#### 阶段 3：路由层（1-2 个月）

1. **单元化路由网关**：基于 userId 路由到固定 Cell。
2. **流量染色**：识别请求来源（生产 / 压测）。
3. **跨 Cell 调用处理**：消息中心 / 配置中心。

#### 阶段 4：演练验证（持续）

1. **单 Cell 故障演练**：kill 一个 Cell，观察流量切换。
2. **数据一致性验证**：跨 Cell 数据一致性检查。
3. **流量调度演练**：动态调整 Cell 流量。

### 4.2 关键技术点

#### 1. 单元化路由（Spring Cloud Gateway）

```java
// 单元化路由：根据 userId 路由到固定 Cell
@Component
public class CellRoutingFilter implements GlobalFilter {
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        
        // 从请求头获取 userId
        String userId = request.getHeaders().getFirst("X-User-Id");
        if (userId == null) {
            // 匿名用户走默认 Cell
            userId = "anonymous";
        }
        
        // 计算 Cell ID
        int cellId = Math.abs(userId.hashCode()) % 12;
        
        // 路由到 Cell
        String cellName = "cell-" + cellId;
        
        // 修改请求路径，加上 cell 前缀
        ServerHttpRequest mutatedRequest = request.mutate()
            .header("X-Cell-Id", String.valueOf(cellId))
            .build();
        
        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }
}
```

#### 2. 一致性 Hash 路由

```python
import hashlib

class CellRouter:
    def __init__(self, cell_count=12, virtual_nodes=200):
        self.cell_count = cell_count
        self.virtual_nodes = virtual_nodes
        # 虚拟节点：{hash: cell_id}
        self.ring = {}
        for cell_id in range(cell_count):
            for v_node in range(virtual_nodes):
                key = f"cell-{cell_id}-vnode-{v_node}"
                hash_value = int(hashlib.md5(key.encode()).hexdigest(), 16)
                self.ring[hash_value] = cell_id
        # 排序
        self.sorted_keys = sorted(self.ring.keys())
    
    def get_cell(self, user_id):
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        # 二分查找第一个 >= hash_value 的位置
        idx = bisect.bisect_right(self.sorted_keys, hash_value)
        if idx == len(self.sorted_keys):
            idx = 0
        return self.ring[self.sorted_keys[idx]]
```

#### 3. 流量染色（生产 / 压测 / 灰度）

```java
// 流量染色 Filter
public class TrafficColoringFilter implements Filter {
    
    private static final String STRESS_HEADER = "X-Stress-Test";
    private static final String GRAY_HEADER = "X-Gray-User";
    
    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain) {
        HttpServletRequest httpReq = (HttpServletRequest) req;
        
        // 压测流量
        if ("true".equals(httpReq.getHeader(STRESS_HEADER))) {
            RequestContext.setStress(true);
        }
        
        // 灰度流量
        String grayUser = httpReq.getHeader(GRAY_HEADER);
        if (grayUser != null) {
            RequestContext.setGrayUser(grayUser);
        }
        
        try {
            chain.doFilter(req, resp);
        } finally {
            RequestContext.clear();
        }
    }
}
```

#### 4. 数据库水平切分（ShardingSphere）

```yaml
# ShardingSphere 数据分片规则
rules:
- !SHARDING
  tables:
    orders:
      actualDataNodes: ds_${0..11}.orders_${0..1}
      databaseStrategy:
        standard:
          shardingColumn: user_id
          shardingAlgorithmName: cell_mod
      tableStrategy:
        standard:
          shardingColumn: order_id
          shardingAlgorithmName: order_hash
  shardingAlgorithms:
    cell_mod:
      type: MOD
      props:
        sharding-count: 12
```

### 4.3 工具链与平台（含 2024-2025 新工具）

| 类别 | 工具 | 特点 |
| --- | --- | --- |
| **路由层** | Spring Cloud Gateway、Kong、Envoy | 单元化路由 |
| **DB 分片** | ShardingSphere、Vitess、MyCat | 数据库水平切分 |
| **配置中心** | Apollo、Nacos、Consul | 全局配置 |
| **服务发现** | Eureka、Consul、Nacos | 服务发现 |
| **流量调度** | Istio、Linkerd、阿里云 AHAS | 服务网格层流量调度 |
| **AI 单元化** | NVIDIA MIG、阿里云 cGPU、vGPU | GPU 池化 |

### 4.4 代码 / 示例

#### 完整单元化路由示例

```java
// Spring Boot 单元化路由完整实现
@RestController
public class OrderController {
    
    @Autowired
    private OrderService orderService;
    
    @PostMapping("/orders")
    public Order createOrder(@RequestBody OrderRequest req, 
                              @RequestHeader("X-User-Id") String userId) {
        // 1. 计算 Cell ID
        int cellId = CellRouter.getCell(userId);
        
        // 2. 设置上下文
        RequestContext.setCellId(cellId);
        RequestContext.setUserId(userId);
        
        // 3. 写入当前 Cell（一致性 Hash 保证）
        Order order = orderService.createOrder(req);
        
        return order;
    }
    
    @GetMapping("/orders/{orderId}")
    public Order getOrder(@PathVariable String orderId,
                           @RequestHeader("X-User-Id") String userId) {
        // 同 Cell 读取
        int cellId = CellRouter.getCell(userId);
        RequestContext.setCellId(cellId);
        
        return orderService.getOrder(orderId);
    }
}
```

---
