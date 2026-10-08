# 统一查询网关（Unified Query Gateway）

> **一句话定位**：联邦查询 + 跨源 JOIN + 向量 + 图谱——单 SQL 跨数据源查询，让 AI 应用一站式获取数据。

> 本文是 data-travel 项目 [Ch4 · 数据资产化与智能检索](../../README.md) 的子章节（09 统一查询网关）。覆盖 **核心职责② 企业私有数据资产化与智能检索** 中「**跨源查询联邦**」相关的引擎、架构、AI 集成与演进。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 统一查询网关和数据虚拟化有什么区别？ | §1 |
| Trino / Presto / Starburst / Denodo 的原理？ | §2、§3 |
| 如何在网关中集成向量 + 图谱 + 结构化？ | §4 |
| AI 时代统一查询网关的新趋势？ | §5 |
| 企业级落地与踩坑？ | §6 |

---

## 1. 概念与定位

### 1.1 是什么

**学术 / 工业定义**：统一查询网关（Unified Query Gateway）是**基于联邦查询引擎（Trino / Presto / Apache Calcite）的跨源查询系统**，让用户用单条 SQL 查询多个数据源（MySQL / Hive / Iceberg / Elasticsearch / S3 / 向量库 / 图库），无需 ETL 同步。它实现了「**Data Virtualization（数据虚拟化）**」+「**Query Federation（查询联邦）**」+「**AI 数据消费**」的统一。

**工程定义**：在数据架构师手里，统一查询网关是**一份跨源数据查询的中枢**：

- **单 SQL 跨源**：`SELECT * FROM hive.sales JOIN mysql.users ON ...`。
- **联邦查询**：把查询下推到各数据源执行，结果汇聚。
- **向量化执行**：内存计算、Pipeline、并行。
- **统一目录**：跨源元数据统一管理。
- **AI 集成**：LLM 通过统一网关查询，向量 + 结构化联合。

**统一查询网关 vs 数据虚拟化**：

| 维度 | 数据虚拟化 | 统一查询网关 |
| --- | --- | --- |
| 范围 | 单一数据源抽象 | 跨源联邦 |
| 性能 | 中 | 中（部分场景差） |
| 工具 | Denodo / Dremio | Trino / Presto / Starburst |
| 适用 | BI / 报表 | AI / Agent / 数据探索 |

### 1.2 为什么需要

**业务驱动力**：

- **「跨源 JOIN 复杂」**：业务表在 MySQL，用户画像在 Hive，向量在 Milvus，无法 JOIN。
- **「ETL 同步延迟」**：跨源数据用 ETL 同步，业务等不起。
- **「数据科学家探索」**：临时分析需要快速跨源查询。
- **「AI 时代一站式」**：Agent 需要单 SQL 跨源获取数据。
- **「避免数据搬迁」**：数据留在原系统，查询下推。

**痛点**：

1. **「跨源 JOIN 难」**：业务表 + 向量表 + 图谱需要 JOIN。
2. **「ETL 链路过长」**：同步延迟 1 小时 +，业务等不及。
3. **「多套查询系统」**：BI 用 Presto，AI 用 Milvus，临时分析用 Hive。
4. **「无统一 SQL 入口」**：开发者需要懂多套方言。
5. **「Agent 跨源查询难」**：Agent 需要单 SQL 跨源。

**AI 时代的新诉求**：

- **「Agent + 跨源」**：Agent 单 SQL 跨 MySQL + Milvus + Neo4j。
- **「Text-to-SQL + 联邦」**：LLM 把自然语言转跨源 SQL。
- **「向量 + 结构化 JOIN」**：商品向量 + 用户行为表 JOIN。
- **「实时数据联邦」**：流式数据也能跨源查询。

### 1.3 在 AI 时代数据架构中的位置

```
   [用户 / Agent / LLM]
        ↓
   [统一查询网关] ← 本文
   Trino / Presto / Starburst / Denodo
        ↓
   ┌────────┬────────┬────────┐
[关系库]  [湖仓]   [向量库]   [图库]
   ↓        ↓        ↓        ↓
   [MySQL] [Iceberg] [Milvus] [Neo4j]
```

- **上游**：Ch1 建模、Ch3 数据全栈、Ch4 数据资产化（向量 / 图谱）。
- **下游**：Ch4-06 OneService、Ch4-10 指标平台、Ch5 Agent 平台。
- **横向**：与数据目录（Ch4-08）、数据 API 网关（Ch4-07）深度协同。

**一句话判断**：**「不会建统一查询网关，做不好跨源 AI 应用」——统一查询网关是 AI 时代数据架构师的「数据虚拟化层」必修课。**

### 1.4 演进历程

**传统数据虚拟化（2000-2015）**：

- Denodo（2003 创立）、Informatica、IBM InfoSphere。

**Presto / Trino 时代（2013-2020）**：

- **2013**：Facebook Presto 开源（后来成为 Trino）。
- **2020**：Presto 创始人离开 Facebook，成立 Trino（starburstdata/trino）。
- **2015-2020**：Presto 在 Uber / Twitter / Facebook 大规模生产。

**云原生联邦查询（2020-2024）**：

- **2020+**：Starburst Enterprise（商业 Trino 发行版）。
- **2022+**：Dremio Sonar（云原生查询）。
- **2023+**：Snowflake / Databricks 内置联邦查询。

**AI 原生统一查询（2024+）**：

- **2024**：Trino + 向量 Connector。
- **2024**：Apache Calcite + 向量算子。
- **2024-2025**：AI 增强联邦查询（LLM 优化查询计划、Text-to-SQL）。

---

## 2. 核心原理

### 2.1 关键概念定义

- **联邦查询（Federated Query）**：跨多个数据源的查询。
- **查询下推（Predicate Pushdown）**：把过滤条件下推到数据源执行。
- **查询拼接（Query Federation）**：跨源 JOIN 在网关层执行。
- **Data Virtualization（数据虚拟化）**：不搬迁数据，逻辑访问。
- **Connector / Catalog**：Trino 中连接特定数据源的接口。
- **Apache Calcite**：动态数据管理框架，SQL 解析 + 优化。
- **MPP（Massively Parallel Processing）**：大规模并行处理。
- **向量化执行（Vectorized Execution）**：Pipeline + 批处理算子。
- **CBO（Cost-Based Optimizer）**：基于成本的优化器。
- **Materialized View（物化视图）**：预计算结果加速查询。
- **Connector 生态**：Hive / Iceberg / MySQL / PostgreSQL / Elasticsearch / Kafka / Delta / S3 / Milvus / Pinecone / Neo4j。
- **Starburst**：商业 Trino 发行版（含 Iceberg / Delta / 安全增强）。
- **Dremio**：云原生联邦查询 + Lakehouse。
- **Denodo**：数据虚拟化平台（商业）。
- **Apache Pinot**：实时 OLAP（联邦查询源）。
- **ClickHouse**：高性能 OLAP（联邦查询源）。

### 2.2 数学 / 形式化基础

**联邦查询的形式化**：

```
Query: SELECT * FROM A JOIN B ON A.id = B.aid
       WHERE A.date = '2025-10-08'

执行计划：
1. 在 A 数据源执行：SELECT * FROM A WHERE date = '2025-10-08'
2. 在 B 数据源执行：SELECT id, aid FROM B（按需）
3. 在 Trino 协调节点执行 JOIN

→ 优化器会决定哪些子查询下推，哪些上拉
```

**向量化执行的数学**：

```
传统：row-at-a-time（每行处理）
向量化：column-at-a-time（每列批处理）

每次处理 1024 行：
for batch in chunks(1024):
    filter = batch[col1] > 100
    selected = batch[filter]
    aggregate(selected)
```

**查询下推的形式化**：

```
原查询：SELECT * FROM users WHERE age > 30 AND city = 'Beijing'
下推：SELECT * FROM users WHERE age > 30 AND city = 'Beijing'  -- 整条下推到 MySQL
不部分下推：SELECT age, city FROM users  -- 只投影下推，filter 上拉
```

**CBO 的数学**：

```
cost(plan) = Σ_{operator} rows_processed × cpu_cost_per_row + io_cost + network_cost

选择 cost 最小的 plan。
```

### 2.3 关键算法 / 方法

**查询优化器**：

1. **RBO（Rule-Based Optimizer）**：基于规则的优化。
2. **CBO（Cost-Based Optimizer）**：基于成本的优化（Trino 默认）。
3. **Adaptive Query Execution**：运行时自适应（Spark / Trino 21+）。

**查询下推策略**：

1. **Predicate Pushdown**：过滤条件下推。
2. **Projection Pushdown**：投影下推。
3. **Limit Pushdown**：LIMIT 下推。
4. **Aggregate Pushdown**：聚合下推（部分支持）。

**联邦 JOIN 算法**：

1. **Broadcast Join**：小表广播到大节点。
2. **Partitioned Join**：双方分区 JOIN。
3. **Shuffle Join**：跨节点 Shuffle。

**向量化执行关键技术**：

1. **Pipeline**：算子流水线并行。
2. **批处理**：1024 行一批。
3. **CodeGen**：动态生成算子代码（Velox / Gluten）。
4. **内存管理**：Off-heap / 列式缓存。

**物化视图策略**：

1. **定时刷新**：每天 / 每小时。
2. **增量刷新**：监听数据变更。
3. **查询重写**：自动用物化视图替换查询。

### 2.4 与相邻概念的关系

- **统一查询网关 vs 数据虚拟化**：数据虚拟化是统一查询网关的子集（更多 BI 场景）。
- **统一查询网关 vs ETL**：ETL 是物理搬运，统一查询网关是逻辑访问。
- **统一查询网关 vs 数据目录**：数据目录管理元数据，网关执行查询。
- **统一查询网关 vs 数据 API 网关**：网关执行 SQL，网关执行 API 流量治理。
- **统一查询网关 vs 向量湖**：向量湖是大规模向量存储，网关可以联邦查询向量湖。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Trino / Presto 联邦查询**

最主流的联邦查询引擎。

- **优点**：成熟、生态丰富、性能强。
- **缺点**：运维复杂。
- **适用**：大规模跨源查询。

**模式 2：Dremio 云原生 Lakehouse**

云原生联邦查询 + Iceberg。

- **优点**：云原生、UI 友好。
- **缺点**：商业（部分开源）。
- **适用**：云上数据中台。

**模式 3：Denodo 数据虚拟化**

企业级数据虚拟化平台。

- **优点**：成熟、企业级特性。
- **缺点**：商业、贵。
- **适用**：大型企业。

**模式 4：Starburst Enterprise**

商业 Trino 发行版。

- **优点**：Trino + 企业级增强（安全 / 监控）。
- **缺点**：商业。
- **适用**：中大型企业。

**模式 5：Apache Calcite 自研**

基于 Calcite 自研统一查询网关。

- **优点**：定制化。
- **缺点**：投入大。
- **适用**：云厂商 / 大型互联网公司。

**模式 6：AI 原生网关**

Trino + 向量 Connector + KG Connector + LLM 优化。

- **优点**：一站式 AI 数据查询。
- **缺点**：生态尚不成熟。
- **适用**：AI 原生应用。

### 3.2 适用场景决策表

| 场景特征 | 推荐模式 | 理由 |
| --- | --- | --- |
| 大规模跨源查询 | Trino / Presto | 成熟生态 |
| 云原生 Lakehouse | Dremio | 云原生 |
| 大型企业 / 强治理 | Denodo / Starburst | 企业级 |
| 自研 / 云厂商 | Apache Calcite 自研 | 定制化 |
| AI 原生应用 | Trino + 向量 / KG Connector | 一站式 |
| 临时分析 | Trino | 灵活 |

### 3.3 反模式与陷阱

1. **「跨源 JOIN 当 ETL」反模式**：把网关当 ETL 用。**网关适合临时分析、跨源 JOIN；ETL 适合批处理**。
2. **「无下推」反模式**：所有数据上拉到网关。**必须查询下推**。
3. **「小数据源过度查询」反模式**：频繁跨源查询小数据源。**必须缓存 / 物化**。
4. **「无 CBO」反模式**：用 RBO 优化。**必须 CBO**。
5. **「资源无隔离」反模式**：大查询影响小查询。**必须资源组 / 队列**。
6. **「无成本控制」反模式**：联邦查询扫全表。**必须 LIMIT + 配额**。
7. **「无监控」反模式**：跨源查询慢不知道为什么。**必须有查询 trace + 慢查询日志**。
8. **「AI 安全失控」反模式**：Agent 跨源查询无权限管控。**必须行级 / 列级权限**。

---

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

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：Text-to-SQL + 联邦查询**

LLM 把自然语言转跨源 SQL：

- Snowflake Cortex Analyst。
- Databricks Genie。
- 自研 + Trino。

**方向 2：AI 原生 Connector**

Trino + 向量 / KG / 多模态 Connector。

**方向 3：AI 增强查询优化**

LLM 辅助查询计划优化：

- 智能索引推荐。
- 智能 Join 顺序。
- 自然语言查询计划解释。

**方向 4：Agent 联邦查询**

Agent 用 Trino 作为统一数据源，单 SQL 跨源获取。

**方向 5：实时联邦查询**

流式数据 + 联邦查询，Kafka + Trino。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

- **Trino + RAG**：跨结构化 + 向量 + KG 联邦检索。
- **Trino + 向量湖**：联邦查询向量湖。
- **Trino + GraphRAG**：跨 KG + 向量混合查询。
- **Trino + Agent**：Agent 工具调用 Trino。

### 5.3 学术与工业最新进展（2024-2025）

- **Trino 430+**（2024）—— Iceberg 物化视图 + 向量化执行。
- **Starburst Galaxy**（2024）—— 云原生 Trino。
- **Dremio Sonar**（2024）—— 云原生 Lakehouse。
- **Trino + Velox**（Meta 开源 2024）—— 向量化执行引擎。
- **Apache Gluten**（2023-2024）—— Trino + Velox 集成。
- **Snowflake Cortex Analyst**（2024）—— 自然语言查询。
- **Databricks Genie**（2024）—— 自然语言查询。

### 5.4 未来 3-5 年趋势

1. **「AI 原生联邦查询」**：LLM + Trino + 向量 + KG 一体化。
2. **「Text-to-SQL 主流化」**：自然语言直接跨源查询。
3. **「向量化执行普及」**：Trino + Velox + Gluten。
4. **「Lakehouse + 联邦」**：Iceberg 物化视图 + Trino 联邦。
5. **「Agent 联邦查询」**：智能体默认使用统一查询网关。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：某互联网公司 Trino 联邦查询**

- 背景：MySQL + Hive + Elasticsearch 跨源查询慢。
- 方案：部署 Trino，60+ Connector，CBO 优化。
- 工具：Trino 430 + Hive + MySQL + Elasticsearch + Iceberg。
- 结果：跨源查询效率提升 10 倍。

**案例 2：某金融公司 Starburst Enterprise**

- 背景：合规 + 跨源 + 高安全。
- 方案：Starburst Enterprise（Trino + 安全增强）。
- 工具：Starburst + Iceberg + 行级权限。
- 结果：合规审计通过，跨源查询覆盖 200+ 数据源。

**案例 3：某电商公司 Trino + 向量**

- 背景：商品向量 + 用户行为表 + 订单表跨源查询。
- 方案：Trino + Milvus Connector + MySQL + Iceberg。
- 工具：Trino + Milvus + MySQL + Iceberg + GPT-4o。
- 结果：「找北京 + 高客单 + 语义相似商品」单 SQL 完成。

**案例 4：某 AI 公司 Agent + Trino**

- 背景：Agent 需要跨 MySQL + Milvus + Neo4j 查询。
- 方案：Trino 作为 Agent Tool，统一联邦查询。
- 工具：Trino + MySQL + Milvus + Neo4j + LangChain。
- 结果：Agent 数据查询成功率从 60% 提升到 90%。

### 6.2 踩坑与经验

**坑 1：跨源 JOIN 当 ETL**

- 现象：用 Trino 做 ETL，性能差。
- 解法：Trino 用于临时分析，ETL 用 Spark / Flink。

**坑 2：无查询下推**

- 现象：所有数据上拉到 Trino。
- 解法：配置 pushdown、列裁剪、分区裁剪。

**坑 3：资源无隔离**

- 现象：大查询影响小查询。
- 解法：资源组（resource groups）。

**坑 4：无成本控制**

- 现象：扫描全表，成本失控。
- 解法：LIMIT、配额、计费。

**坑 5：无监控**

- 现象：慢查询不知道在哪。
- 解法：Query Trace + Prometheus + Grafana。

**坑 6：Agent 安全失控**

- 现象：Agent 跨源查询无权限管控。
- 解法：行级 / 列级权限 + 审计。

**坑 7：Iceberg 物化视图不刷新**

- 现象：物化视图陈旧。
- 解法：定时刷新 + 增量刷新。

**坑 8：Connector 版本不匹配**

- 现象：Trino 升级后 Connector 失败。
- 解法：统一版本管理 + 测试。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（PoC，1-2 周）**：

1. 部署 Trino 集群（Coordinator + 3 Worker）。
2. 配置 3-5 个 Connector（Hive / MySQL / Elasticsearch）。
3. 验证基本跨源查询。

**1→10（业务化，1-3 个月）**：

1. 接入 10+ 数据源。
2. CBO + 资源组 + 监控。
3. 物化视图。

**10→100（企业级，3-12 个月）**：

1. 60+ Connector。
2. 向量 / KG Connector。
3. AI 集成（Text-to-SQL + Agent）。
4. 行级 / 列级权限 + 审计。

### 6.4 ROI 评估

- **跨源查询效率**：从小时级到秒级。
- **数据科学家生产力**：临时分析效率提升 5 倍。
- **AI 应用门槛**：Agent 跨源查询零门槛。
- **存储成本**：避免 ETL 重复存储。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | ETL 同步 | 数据复制 | 联邦查询 | 统一查询网关 |
| --- | --- | --- | --- | --- |
| 数据新鲜度 | 2 | 3 | **5** | **5** |
| 跨源 JOIN | 3 | 4 | 4 | **5** |
| 性能 | **5** | **5** | 3 | 4 |
| 存储成本 | 2 | 2 | **5** | **5** |
| 灵活性 | 2 | 2 | 4 | **5** |
| AI 集成 | 3 | 3 | 3 | **5** |
| 工程复杂度 | 3 | 3 | 4 | 4 |

### 7.2 决策树

```
[需要跨源查询吗？]
   │
   ├── 否 → 直接查单一数据源
   │
   ├── 是 → [实时性要求？]
   │          │
   │          ├── 高 → 联邦查询（Trino）★
   │          │
   │          └── 低 → ETL 同步 / 数据复制
   │
   └── [需要 AI 集成？]
          │
          ├── 否 → Trino / Presto
          └── 是 → Trino + AI Connector
```

### 7.3 组合使用

- **统一查询网关 + RAG**：跨结构化 + 向量 + KG 联邦检索。
- **统一查询网关 + 数据目录**：跨源元数据统一。
- **统一查询网关 + 数据 API 网关**：联邦查询结果 API 化。
- **统一查询网关 + Agent**：Agent 工具调用统一查询。

---

## 8. 面试真题集

> 本节内容待补充。题源待与原 PDF《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）题库对齐。读者可参考本节结构，按"全景视图 → 分主题展开 → 横向小结 → 本章小结"四段式自检。
