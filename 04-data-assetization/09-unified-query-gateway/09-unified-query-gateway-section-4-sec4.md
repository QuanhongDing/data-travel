> 本文件是 **09-unified-query-gateway.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](09-unified-query-gateway.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：需求分析**

- 评估数据源数量和类型。
- 评估跨源查询场景。
- 评估 SLA（延迟 / 并发）。
- 输出：**统一查询网关需求说明书**。

**Step 2：引擎选型**

- 评估 Trino / Starburst / Dremio / Denodo。
- 评估团队能力、成本、运维。
- 输出：**技术选型 ADR**。

**Step 3：Connector 配置**

- 配置各数据源 Connector（Hive / MySQL / Elasticsearch / Milvus / Neo4j）。
- 配置认证、连接池。
- 输出：**可联邦查询的数据源**。

**Step 4：元数据集成**

- 把 Connector 元数据注册到数据目录。
- 配置统一 Catalog。
- 输出：**统一的元数据视图**。

**Step 5：查询优化**

- 启用 CBO。
- 配置资源组（隔离大查询）。
- 配置 LIMIT 和配额。
- 输出：**可治理的查询网关**。

**Step 6：性能优化**

- 物化视图。
- 查询下推配置。
- 向量化执行参数。
- 输出：**高性能查询网关**。

**Step 7：可观测**

- 慢查询日志。
- Query Trace。
- Prometheus + Grafana。
- 输出：**可观测的统一查询网关**。

**Step 8：AI 集成**

- 集成 LLM（Text-to-SQL）。
- 把网关注册到 Agent Tool。
- 输出：**AI 原生查询网关**。

### 4.2 关键技术点

1. **Trino 集群**：Coordinator + Worker。
2. **Connector 生态**：60+ 官方 Connector。
3. **CBO 优化**：statistics、cost-based join reordering。
4. **资源组**：按业务 / 租户隔离。
5. **查询下推**：predicate / projection / limit。
6. **物化视图**：Iceberg + Trino 物化视图。
7. **向量化执行**：Velox / Gluten。
8. **可观测**：JMX + Prometheus + Query Trace。
9. **AI 集成**：Text-to-SQL + Agent Tool。
10. **安全**：认证 / 授权 / 行级 / 列级权限。

### 4.3 工具链与平台

**开源联邦查询**：

- **Trino**（Linux Foundation）—— 主流开源联邦查询。
- **Presto**（Linux Foundation）—— Trino 前身，仍在维护。
- **Apache Calcite**（ASF）—— 动态数据管理框架。

**商业联邦查询**：

- **Starburst Enterprise**（商业）—— Trino 商业版。
- **Dremio**（商业 + 部分开源）—— 云原生 Lakehouse。
- **Denodo**（商业）—— 企业级数据虚拟化。

**Connector 生态**：

- 关系数据库：MySQL / PostgreSQL / Oracle / SQL Server。
- 大数据：Hive / Spark / Iceberg / Delta / Hudi。
- 云存储：S3 / Azure Blob / OSS / GCS。
- NoSQL：Elasticsearch / MongoDB / Cassandra。
- 向量：Milvus / Pinecone / Qdrant。
- 图：Neo4j / NebulaGraph。
- 实时：Kafka / Pulsar / Kinesis。
- OLAP：ClickHouse / Pinot / Druid。

**AI 增强工具**：

- **Snowflake Cortex Analyst**（2024）—— 自然语言查询。
- **Databricks Genie**（2024）—— 自然语言查询。
- **Trino AI Functions**（2024）—— LLM 内置函数。

### 4.4 代码 / 示例

**示例 1：Trino 跨源 JOIN**

```sql
-- Trino 跨 Hive + MySQL JOIN
SELECT
  u.user_id,
  u.name,
  h.page_views,
  h.last_visit
FROM
  hive.ecommerce.users u
JOIN
  mysql.analytics.user_events h
  ON u.user_id = h.user_id
WHERE
  u.city = 'Beijing'
  AND h.event_date >= DATE '2025-10-01'
ORDER BY
  h.page_views DESC
LIMIT 100;
```

**示例 2：Trino 向量检索（Milvus Connector）**

```sql
-- 假设已配置 milvus catalog
-- 跨 MySQL + Milvus 向量检索
SELECT
  p.product_id,
  p.name,
  p.price,
  v.distance
FROM
  mysql.ecommerce.products p,
  milvus.product_embeddings v
WHERE
  v.id = CAST(p.product_id AS BIGINT)
  AND v.embedding <=> CAST($1 AS ARRAY<DOUBLE>) < 0.3
ORDER BY
  v.distance ASC
LIMIT 10;
```

**示例 3：Trino Iceberg 物化视图**

```sql
-- 创建物化视图
CREATE MATERIALIZED VIEW top_products AS
SELECT
  product_id,
  SUM(amount) AS total_amount
FROM
  iceberg.sales.orders
WHERE
  order_date >= DATE '2025-10-01'
GROUP BY
  product_id;

-- 刷新物化视图
REFRESH MATERIALIZED VIEW top_products;

-- 自动查询重写
SELECT * FROM top_products ORDER BY total_amount DESC LIMIT 10;
```

**示例 4：Trino + LLM 集成（Function Calling）**

```python
from trino.dbapi import connect
import openai

# 1. 连接 Trino
conn = connect(host="trino", port=8080, user="agent", catalog="hive")

# 2. 用 LLM 把自然语言转 SQL
llm = openai.OpenAI()
schema = """
Table: hive.ecommerce.orders
Columns: order_id (bigint), user_id (bigint), amount (double), order_date (date)
"""

response = llm.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": f"你是 SQL 助手。基于 schema 生成 Trino SQL：{schema}"},
        {"role": "user", "content": "上个季度北京用户订单总金额"}
    ]
)

sql = response.choices[0].message.content
print(f"生成的 SQL: {sql}")

# 3. 执行 SQL
cur = conn.cursor()
cur.execute(sql)
results = cur.fetchall()
for row in results:
    print(row)
```

**示例 5：Starburst 配置**

```yaml
# Trino 配置文件
coordinator:
  name: "trino-coordinator"

discovery:
  uri: "http://trino-coordinator:8080"

http-server:
  port: 8080

query:
  max-memory: "50GB"
  max-memory-per-node: "8GB"

# Catalog 配置
catalogs:
  hive:
    connector.name: "hive"
    hive.metastore.uri: "thrift://hive-metastore:9083"
    hive.s3.endpoint: "http://minio:9000"
    hive.s3.path-style-access: "true"

  milvus:
    connector.name: "milvus"
    connection.host: "milvus"
    connection.port: 19530

  neo4j:
    connector.name: "neo4j"
    connection.uri: "bolt://neo4j:7687"
```

---
