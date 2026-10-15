> 本文件是 **13-query-engine.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](13-query-engine.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型引擎（1-2 周）**

- 跨源：Trino。
- 内嵌：DataFusion。
- 传统：Impala / PrestoDB。

**Step 2：集群部署（2-4 周）**

- Coordinator / Worker。
- 高可用部署。

**Step 3：Connector 配置（2-4 周）**

- Hive / Iceberg / MySQL / Kafka。
- 认证 + 权限。

**Step 4：CBO 优化（持续）**

- 统计信息收集。
- 慢查询治理。

**Step 5：监控 + 调优（持续）**

- Trino Web UI。
- Prometheus + Grafana。

**Step 6：AI 集成（按需）**

- AI 驱动的查询优化。
- 自然语言查询。

### 4.2 关键技术点

**1. Trino 部署**

```yaml
# docker-compose.yml
services:
  trino-coordinator:
    image: trinodb/trino:420
    ports:
      - "8080:8080"
    volumes:
      - ./etc:/etc/trino
  
  trino-worker:
    image: trinodb/trino:420
    environment:
      - COORDINATOR_URL=http://trino-coordinator:8080
```

**2. Trino Iceberg Connector**

```properties
# etc/catalog/iceberg.properties
connector.name=iceberg
hive.metastore.uri=thrift://metastore:9083
iceberg.catalog.type=hive
warehouse=s3://lake/warehouse
```

**3. Trino MySQL Connector**

```properties
# etc/catalog/mysql.properties
connector.name=mysql
connection-url=jdbc:mysql://mysql:3306
connection-user=user
connection-password=password
```

**4. Trino CBO 统计信息**

```sql
-- 收集统计信息
ANALYZE TABLE iceberg.orders;

-- CBO 自动选择最优计划
EXPLAIN (FORMAT JSON) SELECT * FROM iceberg.orders WHERE user_id = 12345;
```

**5. DataFusion Python 嵌入（2024 新工具）**

```python
import datafusion
import pyarrow as pa

# 创建 DataFusion Context
ctx = datafusion.SessionContext()

# 从 PyArrow 加载数据
table = pa.table({
    "order_id": [1, 2, 3],
    "amount": [99.99, 199.99, 299.99],
})
ctx.from_arrow(table).show()

# SQL 查询
result = ctx.sql("""
    SELECT SUM(amount) AS total
    FROM table
    WHERE order_id > 1
""").to_pandas()
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**查询引擎（2024-2025）**：

| 工具 | 版本 | 特点 |
| --- | --- | --- |
| Trino | 420+ | 联邦查询事实标准 |
| PrestoDB | 0.28x | 停滞 |
| Apache Impala | 4.x | CDH 生态 |
| Apache Calcite | 1.36+ | SQL 解析优化框架 |
| DataFusion | 30+ | Rust 内嵌查询引擎 |

**Connector 生态**：

- Trino：300+ Connector（Hive、Iceberg、MySQL、Kafka、ES、Redis...）。

**BI 工具**：

- Apache Superset、Grafana、Metabase。

### 4.4 代码 / 示例

**示例 1：Trino + Iceberg 联邦查询**

```sql
-- Trino 跨 Iceberg + MySQL 查询
SELECT
    o.order_id,
    o.amount,
    c.user_name,
    c.email
FROM iceberg.sales.orders o
JOIN mysql.crm.customers c ON o.user_id = c.id
WHERE o.dt BETWEEN '2025-01-01' AND '2025-01-31'
  AND c.vip_level = 'gold';
```

**示例 2：Trino + Kafka 流式查询**

```sql
-- Trino 查询 Kafka 流
SELECT
    user_id,
    COUNT(*) AS events,
    SUM(amount) AS total_amount
FROM kafka.events.orders_stream
WHERE $partition >= '2025-01-15'
GROUP BY user_id;
```

**示例 3：Trino 优化查询**

```sql
-- 收集统计信息
ANALYZE iceberg.orders;

-- 启用 CBO
SET SESSION join_distribution_type = 'AUTOMATIC';

-- 启用 AQE
SET SESSION query_max_run_time = '10m';

-- EXPLAIN 查看计划
EXPLAIN SELECT * FROM iceberg.orders WHERE user_id = 12345;
```

**示例 4：DataFusion 内嵌（AI 时代新工具）**

```python
import datafusion
import pyarrow as pa

# 创建 DataFusion Context
ctx = datafusion.SessionContext()

# 注册多个数据源
orders = pa.table({
    "order_id": [1, 2, 3, 4],
    "user_id": [100, 100, 200, 200],
    "amount": [99.99, 199.99, 299.99, 399.99],
})

users = pa.table({
    "user_id": [100, 200],
    "user_name": ["Alice", "Bob"],
})

ctx.from_arrow(orders).show()
ctx.from_arrow(users).show()

# 跨源查询
result = ctx.sql("""
    SELECT u.user_name, SUM(o.amount) AS gmv
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    GROUP BY u.user_name
""").to_pandas()
print(result)
```

---
