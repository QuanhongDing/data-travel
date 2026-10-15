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

- [§3. 设计模式与范式](09-unified-query-gateway-section-3-sec3.md)
- [§4. 工程实现](09-unified-query-gateway-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](09-unified-query-gateway-section-5-ai.md)
- [§6. 落地实践](09-unified-query-gateway-section-6-sec6.md)
- [§7. 与其他方法对比](09-unified-query-gateway-section-7-sec7.md)
- [§8. 面试真题集](09-unified-query-gateway-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](09-unified-query-gateway-section-3-sec3.md)
- [§4. 工程实现](09-unified-query-gateway-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](09-unified-query-gateway-section-5-ai.md)
- [§6. 落地实践](09-unified-query-gateway-section-6-sec6.md)
- [§7. 与其他方法对比](09-unified-query-gateway-section-7-sec7.md)
- [§8. 面试真题集](09-unified-query-gateway-section-8-sec8.md)

---
