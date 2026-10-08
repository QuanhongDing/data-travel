# 查询引擎（Query Engine）

> **一句话定位**：以 Trino / Presto / Impala / DataFusion 为核心的跨源联邦查询系统，是企业"一份查询、访问所有数据"的统一入口。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**13 查询引擎**）。覆盖 **R4 数据全栈协同** 能力领域中「联邦查询、跨源集成、Calcite 优化、AI 时代演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 查询引擎 vs OLAP 引擎的本质区别？ | §1.1 |
| Trino / Presto / Impala / DataFusion 怎么选？ | §7.1 |
| Calcite / CBO / 自适应执行是什么原理？ | §2.1、§2.3 |
| 联邦查询如何落地？ | §4.1 |
| 2024-2025 新趋势？ | §5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：查询引擎（Query Engine）是一种**对多源异构数据进行统一 SQL 查询、跨源联邦访问**的系统。它通过 Connector 抽象层屏蔽底层存储差异，让用户用一份 SQL 访问所有数据。

**工程定义**：在数据架构师手里，查询引擎是**一份以 Trino / Presto 为核心、跨 Hive / Iceberg / MySQL / Kafka / S3 等多源做联邦查询**的入口能力。核心特征：

- **联邦查询**：一份 SQL 跨多个数据源。
- **Connector 架构**：通过插件支持新数据源。
- **MPP 执行**：分布式并行计算。
- **ANSI SQL**：标准 SQL 兼容。
- **存算分离**：计算节点无状态、存储分离。

**与 OLAP 引擎的本质区别**：

| 维度 | 查询引擎（Trino） | OLAP 引擎（StarRocks） |
| --- | --- | --- |
| 核心能力 | 联邦跨源查询 | 单源高性能聚合 |
| 存储 | 多源（无本地存储） | 列存（本地或分离） |
| 性能 | 中（网络拉数据） | 高（本地计算） |
| 适用 | 即席跨源分析 | 固定查询模式 |
| 写入 | 不擅长（少部分支持） | 强（实时写入） |

### 1.2 为什么需要

**业务驱动力**：

- **数据孤岛**：业务数据散落在 Hive、MySQL、Kafka、ES，需要统一查询。
- **即席分析**：分析师临时需要跨多个数据源查询。
- **避免数据复制**：不需要把所有数据 ETL 到一个地方。
- **现代化数据栈**：Data Mesh / Data Fabric 趋势。

**痛点（没有查询引擎的代价）**：

1. **数据孤岛**：跨源查询需要写脚本 ETL。
2. **数据复制**：每个查询需求都建一份副本。
3. **口径不一致**：跨源口径混乱。
4. **效率低下**：分析师等不到数据。

**AI 时代的新诉求**：

- **统一数据访问**：AI Agent 需要统一查询接口。
- **多模态联邦**：结构化 + 非结构化 + 向量统一查询。
- **自然语言查询**：NL → SQL → 跨源查询。

### 1.3 在 AI 时代数据架构中的位置

```
[多源数据：Hive / Iceberg / MySQL / Kafka / S3 / ES]
        ↓
[查询引擎：Trino / Presto]
        ↓
[BI / 即席分析 / Agent / LLM]
```

**查询引擎是数据栈的"统一入口"**：让所有数据可被发现、可被查询。

### 1.4 演进历程

**第一阶段：单源查询（2000-2010）**

- 传统 RDBMS（MySQL、Oracle）单源查询。
- 跨源需要 ETL。

**第二阶段：SQL-on-Hadoop（2010-2015）**

- 2012：Impala（Cloudera）。
- 2013：Presto（Facebook）。
- 2014：Hive + Tez。

**第三阶段：联邦查询（2015-2020）**

- 2015：Presto 加 Connector（Hive、MySQL、Kafka）。
- 2018：Presto 分叉出 Trino。
- 2019：Trino 主导联邦查询。

**第四阶段：Lakehouse 集成（2020-2024）**

- 2020：Trino + Iceberg 深度集成。
- 2021：Trino 400+、Iceberg V2 支持。
- 2023：Trino 420+、Iceberg V3 支持。
- 2024：DataFusion 30+、Arrow 集成。

**第五阶段：AI 原生（2024-至今）**

- 2024：Trino + 向量索引。
- 2025：AI 原生联邦查询。

**一句话总结**：**查询引擎从"单源 SQL"→"SQL-on-Hadoop"→"联邦查询"→"Lakehouse 集成"→"AI 原生"五阶段演进，今天 Trino 是事实标准。**

---

## 2. 核心原理

### 2.1 关键概念定义

**Connector**：Trino 的数据源插件。HDFS / MySQL / Kafka / Iceberg / Hive / ES 等。

**Coordinator / Worker**：

- **Coordinator**：接收查询、解析、规划、分发。
- **Worker**：执行 Task、拉取数据、计算。

**Stage / Task / Driver**：

- **Stage**：执行计划的阶段。
- **Task**：Stage 中的并行任务。
- **Driver**：Task 中的具体执行单元。

**Exchange**：

- Stage 间数据传输（HASH / BROADCAST）。

**CBO（Cost-Based Optimizer）**：

- 基于代价的查询优化。
- 统计信息驱动。

**AQE（Adaptive Query Execution）**：

- 自适应查询执行（运行时调优）。

**Calcite**：

- Apache 动态数据管理框架。
- Trino / Spark SQL / Flink SQL 都基于 Calcite。

**DataFusion**：

- Rust 编写的查询引擎（Arrow 原生）。
- 高性能、可嵌入。

**谓词下推（Predicate Pushdown）**：

- 把 WHERE 条件下推到数据源层。
- 减少数据传输。

**列剪裁（Column Pruning）**：

- 只读需要的列。

### 2.2 数学 / 形式化基础

**查询优化的数学模型**：

```
Cost(plan) = Σ (Cost(Stage_i))
Stage Cost = CPU + IO + Network
```

CBO 通过统计信息估算 Cost，选择最低 Cost 的计划。

**Join 顺序优化**：

- N 张表 Join 有 N! 种顺序。
- **动态规划**：O(2^N) 复杂度。
- **贪心算法**：O(N^2) 复杂度。

**Predicate Pushdown 的剪裁率**：

```
剪裁率 = (总数据量 - 过滤后数据量) / 总数据量
```

通常 80-99%。

**DataFusion 的向量化执行**：

- Arrow 内存格式 + SIMD。
- 加速比：5-20x。

### 2.3 关键算法 / 方法

**1. Trino 联邦查询**

```sql
-- 跨 Hive + MySQL + Kafka
SELECT
    o.order_id,
    o.amount,
    c.user_name,
    c.email,
    k.event_type
FROM hive.sales.orders o
JOIN mysql.crm.customers c ON o.user_id = c.id
LEFT JOIN kafka.events.user_events k ON o.user_id = k.user_id
WHERE o.dt = '2025-01-01';
```

**2. Calcite 优化器**

```java
// Calcite 解析 SQL → 优化 → 执行
RelNode logicalPlan = ...;
RelOptPlanner planner = ...;
RelNode optimizedPlan = planner.optimize(logicalPlan);
```

**3. Trino + Iceberg V3**

```sql
-- Trino 查询 Iceberg V3
SELECT * FROM iceberg.iceberg.orders
WHERE order_time BETWEEN '2025-01-01' AND '2025-01-31';

-- 增量读取
SELECT * FROM iceberg.iceberg.orders
WHERE _updated_at > '2025-01-15';
```

**4. DataFusion Python 嵌入**

```python
import datafusion

# 创建上下文
ctx = datafusion.SessionContext()

# 注册数据
df = ctx.from_pandas(pandas_df)

# SQL 查询
result = ctx.sql("""
    SELECT region, SUM(amount) AS gmv
    FROM df
    GROUP BY region
""").to_pandas()
```

**5. 谓词下推**

```sql
-- Trino 自动下推
SELECT * FROM iceberg.orders WHERE user_id = 12345 AND order_time > '2025-01-15';
-- → Trino 自动把 user_id 和 order_time 下推到 Iceberg 层
-- → 只读相关数据文件
```

**6. AQE（Adaptive Query Execution）**

```sql
-- Trino AQE 自动运行时优化
SET SESSION query_max_run_time = '10m';
-- → Trino 根据运行时统计信息自动调整 Stage 数、并行度
```

### 2.4 与相邻概念的关系

**查询引擎 vs OLAP 引擎**：见 §1.1。

**查询引擎 vs 数据虚拟化（Data Virtualization）**：

- 查询引擎：拉数据到计算引擎。
- 数据虚拟化：在源端计算，只传结果。

**Trino vs Presto**：

- Trino（社区主导）：原 PrestoDB。
- Presto（Meta / Ahana）：停滞。

**Trino vs Spark SQL**：

- Trino：交互式查询（MPP）。
- Spark SQL：批处理（Micro-Batch）。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Trino 联邦查询（标准）**

- 一个 Trino 集群 + 多 Connector。
- 适用：跨源即席查询。

**模式 2：Trino + Iceberg（Lakehouse）**

- Trino 查询 Iceberg 外表。
- 适用：Lakehouse + 即席查询。

**模式 3：Trino + Hive 兼容（传统）**

- Trino 查询 Hive Metastore。
- 适用：传统企业。

**模式 4：DataFusion 内嵌（AI / Edge）**

- Rust 内嵌查询引擎。
- 适用：AI 应用、边缘计算。

**模式 5：PrestoDB + 自定义 Connector**

- 自定义 Connector 接入内部系统。
- 适用：定制化场景。

**模式 6：Impala + Kudu（实时）**

- 实时查询（列存 + 行存混合）。
- 适用：CDH 生态。

### 3.2 适用场景决策表

| 业务场景 | 推荐引擎 | 典型技术栈 |
| --- | --- | --- |
| 跨源即席查询 | Trino | Trino + Hive / MySQL / Kafka |
| Lakehouse 即席查询 | Trino | Trino + Iceberg |
| 传统 Hadoop 生态 | Trino / Impala | Trino + Hive |
| AI / 内嵌 | DataFusion | DataFusion + Arrow + Python |
| 大宽表聚合 | ClickHouse / StarRocks | 专用 OLAP |
| 自定义数据源 | 自研 + Trino Connector | Trino + 自研 |

### 3.3 反模式与陷阱

**反模式 1：用 Trino 做高频大查询**

- Trino 是查询引擎，不是 OLAP。
- **正确**：高频大查询用 StarRocks / Doris。

**反模式 2：未优化 Connector**

- 跨源查询慢。
- **正确**：谓词下推 + 列剪裁 + 分区剪裁。

**反模式 3：Join 顺序差**

- 大表 Join 大表崩溃。
- **正确**：CBO 统计信息 + 广播小表。

**反模式 4：忽视资源管理**

- 大查询占用所有 Worker。
- **正确**：Resource Group 隔离。

**反模式 5：未启用 AQE**

- 错失运行时优化。
- **正确**：开启 AQE。

---

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

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：自然语言查询**

- LLM → SQL → 查询引擎。
- 工具：Trino + LLM / Databricks Genie / Snowflake Cortex。

**演进方向 2：AI 驱动的查询优化**

- LLM 预测查询模式、自动优化。
- 工具：Trino + LLM。

**演进方向 3：自治查询引擎**

- AI 自动调优、自适应。
- 工具：自研 + LLM。

**演进方向 4：联邦向量检索**

- 结构化 + 向量统一查询。
- 工具：Trino + LanceDB / Milvus。

**演进方向 5：嵌入式 OLAP（DataFusion）**

- Rust / Python 内嵌查询引擎。
- 工具：DataFusion + Arrow。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**查询引擎 + RAG**：

- 查询引擎 + 向量库 + LLM。
- 工具：Trino + LanceDB + LLM。

**查询引擎 + GraphRAG**：

- 查询引擎 + 知识图谱。
- 工具：Trino + Neo4j + LLM。

**统一查询接口**：

- Trino 统一查询接口，AI Agent 通过 SQL 查询所有数据。
- 工具：MCP（Model Context Protocol）+ Trino。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **Trino 论文（SIGMOD 2024）**：联邦查询架构。
- **DataFusion 论文（SIGMOD 2024）**：Arrow 原生查询引擎。
- **Calcite 论文（VLDB 2024）**：动态数据管理框架。

**工业进展**：

- **Trino 420+（2024）**：Iceberg V3、向量索引。
- **DataFusion 30+（2024）**：Python / Rust 内嵌。
- **Apache Impala 4.x（2024）**：Iceberg 集成。

### 5.4 未来 3-5 年趋势

**趋势 1：联邦查询 + 向量**

- 统一查询接口支持结构化 + 向量。
- 工具：Trino + LanceDB。

**趋势 2：嵌入式查询引擎**

- DuckDB / DataFusion 内嵌。
- Notebook / 边缘计算。

**趋势 3：AI 原生查询**

- LLM 驱动、自然语言查询。
- 自治查询优化。

**趋势 4：联邦数据网格**

- 跨域、跨云、跨厂商统一查询。
- Data Mesh 架构。

**趋势 5：高性能向量化**

- Arrow + SIMD。
- DataFusion / Velox。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：字节跳动 Trino 联邦查询**

- **数据规模**：PB 级。
- **架构**：Trino + Iceberg + MySQL + Kafka。
- **效果**：跨源即席查询秒级响应。

**案例 2：Netflix Trino + Iceberg**

- **数据规模**：EB 级。
- **架构**：Trino + Iceberg + 自研 Connector。
- **效果**：替代 Hive + Spark 即席查询。

### 6.2 踩坑与经验

**坑 1：跨源 Join 慢**

- **现象**：MySQL + Hive Join 慢。
- **解决**：谓词下推 + 广播小表。

**坑 2：未做统计信息**

- **现象**：CBO 选错 Join 顺序。
- **解决**：ANALYZE 收集统计信息。

**坑 3：未做资源隔离**

- **现象**：大查询占用所有资源。
- **解决**：Resource Group 隔离。

**坑 4：Connector 兼容性**

- **现象**：自定义 Connector 报错。
- **解决**：版本匹配 + 测试。

### 6.3 落地路径（0→1, 1→10, 10→100）

**阶段 1：0 → 1（启动期，0-3 个月）**

- 部署 Trino + Hive / Iceberg。
- 团队：1-2 数据工程师。

**阶段 2：1 → 10（扩展期，3-12 个月）**

- 添加更多 Connector（MySQL / Kafka）。
- 团队：3-5 数据工程师。

**阶段 3：10 → 100（规模化期，12-36 个月）**

- 联邦查询 + AI 集成。
- 团队：5-10 + 平台团队。

### 6.4 ROI 评估

**评估维度**：

- **跨源查询能力**：数据孤岛解决。
- **查询效率**：即席查询秒级。
- **数据复制减少**：避免 ETL 副本。
- **AI 友好度**：LLM 统一接口。

**典型 ROI**：

- 字节 Trino：跨源即席查询覆盖 90% 业务。
- Netflix Trino：替代 Hive 性能提升 10x。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Trino | Presto | Impala | DataFusion | DuckDB |
| --- | :---: | :---: | :---: | :---: | :---: |
| 联邦查询 | 5 | 5 | 3 | 3 | 2 |
| 性能 | 4 | 4 | 4 | 5 | 5 |
| 内嵌能力 | 1 | 1 | 1 | 5 | 5 |
| AI 友好 | 4 | 3 | 2 | 5 | 5 |
| 易用性 | 4 | 4 | 3 | 4 | 5 |

### 7.2 决策树

```
场景？
├── 跨源即席查询
│   └── Trino
├── 内嵌 / Notebook
│   └── DataFusion / DuckDB
├── 传统 CDH 生态
│   └── Impala
└── AI 原生
    └── DataFusion + Arrow
```

### 7.3 组合使用

**组合 1：Trino + Iceberg + OLAP**

- Trino 跨源 + Iceberg 存储 + StarRocks 高频查询。
- 适用：现代数据栈。

**组合 2：Trino + DataFusion**

- Trino 联邦 + DataFusion 内嵌。
- 适用：混合场景。

**组合 3：Trino + AI Agent**

- Trino 提供统一查询接口。
- Agent 通过 SQL 查询所有数据。

---

## 8. 面试真题集

# query-engine 面试真题集

> **一句话定位**：Trino / Presto / Impala 的工程取舍。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 1 个原 PDF 子章节、共 5 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §6.3 | Spark SQL 与结构化数据处理 | 6.3.1, 6.3.2, 6.3.3, 6.3.4, 6.3.5 | 5 | 辅 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §6 ⼤规模数据处理应⽤的开发与优化 > 本主题涵盖 1 个子节、5 道题。

#### 2.1.3 Spark SQL 与结构化数据处理

> 来源：原 PDF §6.3，收录 5 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §6.3.1 | ★★★☆☆ |
| §6.3.2 | ★★★☆☆ |
| §6.3.3 | ★★★☆☆ |
| §6.3.4 | ★★★☆☆ |
| §6.3.5 | ★★★★☆ |

- **§6.3.1**：当⾯对⼀个复杂的多表关联查询任务时，在 Spark SQL 中你会采取哪些策略来避
- **§6.3.2**：请解释 Spark SQL 相对于传统的 Spark RDD 编程有哪些主要优势？
- **§6.3.3**：请说明在 Spark SQL 中，DataFrame 和 Dataset 之间的主要区别与联系是什
- **§6.3.4**：请描述 Spark SQL 中 Catalyst 优化器的⼯作流程，并举例说明它如何通过逻辑计
- **§6.3.5**：在处理⼤规模结构化数据时，如何通过 Spark SQL 进⾏⾼效的数据分区和分桶以

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **数据建模与仓库建设**

## 4 本章小结

> 本面试真题集收录 5 道题，覆盖 1 个原 PDF 主题、1 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
