# OLAP 引擎（OLAP Engine）

> **一句话定位**：面向多维分析、即席查询、亚秒级响应的列存向量化查询引擎，是 BI / 实时数仓 / 报表系统的"心脏"。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**11 OLAP 引擎**）。覆盖 **R4 数据全栈协同** 能力领域中「OLAP 引擎架构、向量化执行、实时数仓查询、AI 时代演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| OLAP 引擎跟普通数据库的本质区别？ | §1.1 |
| StarRocks / Doris / ClickHouse / Druid 怎么选？ | §7.1 |
| 向量化执行、CBO、CodeGen 是什么原理？ | §2.1、§2.3 |
| 实时数仓的 OLAP 引擎如何落地？ | §4.1 |
| 2024-2025 新趋势（DuckDB、SelectDB、StarRocks 3.x）？ | §5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：OLAP（Online Analytical Processing）引擎是一种**面向多维分析、复杂聚合、即席查询的高性能查询系统**。与 OLTP（事务处理）不同，OLAP 优化的是"读多写少、聚合密集"的场景。

**工程定义**：在数据架构师手里，OLAP 引擎是**一份以列存 + 向量化执行 + CBO 优化器为核心、对 PB 级数据进行亚秒级多维分析**的查询能力。核心特征：

- **列式存储**：只读需要的列，I/O 降低 10-100x。
- **向量化执行**：SIMD + Pipeline，CPU 利用率提升 5-20x。
- **CBO 优化器**：基于代价的智能执行计划。
- **MPP 架构**：分布式并行计算。
- **实时写入**：支持秒级实时数据写入（Kafka / CDC）。
- **多维分析**：OLAP Cube / Rollup / Materialized View。

**与 OLTP 数据库的本质区别**：

| 维度 | OLTP（MySQL / PostgreSQL） | OLAP（StarRocks / Doris / ClickHouse） |
| --- | --- | --- |
| 业务目标 | 事务处理 | 分析查询 |
| 数据模型 | 范式化（3NF） | 维度建模（星型） |
| 写入模式 | 高并发单行 | 批量 / 微批 |
| 查询模式 | 点查 / 主键 | 全表扫描 + 聚合 |
| 索引 | B+ 树 | 列存 + 压缩 + Zone Map |
| 一致性 | 强 ACID | 最终一致 / 时序一致 |
| 数据规模 | GB-TB | TB-PB-EB |

### 1.2 为什么需要

**业务驱动力**：

- **BI 自助分析**：分析师需要秒级响应。
- **实时报表**：双 11 大屏秒级刷新。
- **多维分析**：任意维度任意指标的即席查询。
- **大宽表查询**：亿级大表的快速聚合。
- **实时监控**：业务指标实时查询。

**痛点（没有 OLAP 引擎的代价）**：

1. **业务库崩溃**：复杂分析查询拖垮 OLTP。
2. **传统数仓慢**：Hive + Spark 分钟级延迟，无法满足实时需求。
3. **交互式差**：分析师等待时间长，效率低。
4. **实时能力弱**：T+1 数据无法支撑实时决策。

**AI 时代的新诉求**：

- **实时特征查询**：在线推理需要毫秒级特征查询。
- **向量检索集成**：OLAP + 向量索引融合。
- **Agent 即席查询**：智能体直接发起 OLAP 查询。
- **自然语言查询**：LLM → OLAP SQL。

### 1.3 在 AI 时代数据架构中的位置

```
[实时数仓 / Lakehouse]
        ↓
[OLAP 引擎：StarRocks / Doris / ClickHouse]
        ↓
[BI / 实时报表 / 实时监控 / Agent 查询]
```

**OLAP 引擎是数据栈的"分析心脏"**：把数据变成可交互的洞察。

### 1.4 演进历程

**第一阶段：传统 OLAP（1993-2010）**

- 1993：E.F. Codd 提出 OLAP 概念。
- 1995：Oracle Express、IBM Essbase。
- 2000s：Microsoft Analysis Services（SSAS）、SAP BW。

**第二阶段：MPP 数据库（2010-2015）**

- 2010：Greenplum 开源。
- 2012：Amazon Redshift。
- 2014：Impala 1.0、Presto 0.1。

**第三阶段：列存 + 向量化（2015-2020）**

- 2016：ClickHouse 1.0（俄罗斯 Yandex）。
- 2017：Apache Doris 0.x（原 Palo）。
- 2017：Apache Druid（实时 OLAP）。
- 2018：StarRocks 开源（原 Doris 团队分叉）。

**第四阶段：实时 OLAP（2020-2024）**

- 2020：StarRocks 1.x、Doris 1.0。
- 2022：StarRocks 2.x、Doris 1.2+、ClickHouse 23.x。
- 2023：StarRocks 3.0（存算分离）。
- 2024：SelectDB Cloud、Apache Doris 2.1。

**第五阶段：AI 原生 OLAP（2024-至今）**

- 2024：StarRocks 3.x + 向量索引、Doris 2.1 + AI Functions。
- 2024：Snowflake Cortex + Vector、Databricks Vector Search。
- 2025：AI 原生 OLAP（自然语言查询、自治优化）。

**一句话总结**：**OLAP 引擎从"传统 OLAP"→"MPP 数据库"→"列存向量化"→"实时 OLAP"→"AI 原生"五阶段演进，今天 StarRocks / Doris / ClickHouse 三足鼎立。**

---

## 2. 核心原理

### 2.1 关键概念定义

**列式存储（Columnar Storage）**：

- 数据按列存储（同列连续）。
- 优点：高压缩、列剪裁、谓词下推。
- 缺点：单行写入性能弱。

**向量化执行（Vectorized Execution）**：

- 一次处理一批行（1024-8192 行）。
- SIMD 指令（CPU 单指令多数据）。
- CPU 流水线优化。

**MPP（Massively Parallel Processing）**：

- 多节点并行计算，每个节点处理一部分数据。
- Shuffle + Broadcast。

**CBO（Cost-Based Optimizer）**：

- 基于代价（I/O + CPU + Network）选择最优执行计划。
- 统计信息：行数、NDV、Min/Max、Histogram。

**Codegen（Code Generation）**：

- 运行时生成优化代码（JIT）。
- 减少解释开销。
- 代表：Spark Tungsten、ClickHouse。

**Materialized View（物化视图）**：

- 预计算查询结果，查询时直接读取。
- 自动刷新策略：全量 / 增量 / 按需。

**Cube / Rollup**：

- 预计算所有维度组合的聚合。
- 存储爆炸，需谨慎。

**Zone Map（Min/Max 索引）**：

- 每个数据块（Segment）的列统计信息。
- 查询时跳过不匹配块。

**Bloom Filter**：

- 概率性数据结构，快速判断元素是否在集合中。
- 用于 Join 优化、过滤。

**字典编码（Dictionary Encoding）**：

- 把字符串映射到整数 ID。
- 减少存储 + 加速计算。

**实时写入**：

- 摄入：Kafka / MySQL CDC / Stream Load。
- 写入延迟：秒级。

**向量化索引（Vector Index）**：

- 2024 新趋势：OLAP + 向量检索融合。
- 代表：StarRocks 向量索引、Snowflake Vector Search。

### 2.2 数学 / 形式化基础

**列存的压缩比**：

- 同列数据同质性强 → 字典编码 + 行程编码。
- 压缩比：5-10x（vs 行存 2-3x）。

**向量化执行的加速比**：

- 传统 Volcano 模型：1 行 1 次函数调用。
- 向量化模型：N 行 1 次函数调用（N=1024-8192）。
- **加速比**：分支预测 + SIMD + 流水线，5-20x。

**CBO 代价模型**：

```
Cost(plan) = α × I/O + β × CPU + γ × Network
```

- α/β/γ：权重因子。
- I/O/CPU/Network：从统计信息估算。

**并行度（Parallelism）的扩展性**：

- Amdahl 定律：`Speedup ≤ 1 / (s + p/n)`。
- 串行部分 s 越低，扩展性越好。
- OLAP 通常 s < 5%，扩展性好。

**Cube 的存储复杂度**：

- N 个维度，每个维度 K_i 个值。
- **存储复杂度**：O(∏ K_i)。
- **维度爆炸风险**：8 个维度 × 1000 值 = 10^24 种组合。

### 2.3 关键算法 / 方法

**1. 向量化执行**：

```cpp
// 向量化加法（伪代码）
void vectorized_add(int* a, int* b, int* result, int n) {
    for (int i = 0; i < n; i += 1024) {
        // SIMD 处理 1024 个元素
        __m256i va = _mm256_load_si256((__m256i*)(a + i));
        __m256i vb = _mm256_load_si256((__m256i*)(b + i));
        __m256i vr = _mm256_add_epi32(va, vb);
        _mm256_store_si256((__m256i*)(result + i), vr);
    }
}
```

**2. CBO 优化器**：

```sql
-- 统计信息
ANALYZE TABLE orders UPDATE HISTOGRAM ON amount, user_id;

-- CBO 自动选择最优 Join 顺序
SELECT * FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.amount > 1000;
-- CBO 自动选择 Broadcast Hash Join（小表 users 广播）
```

**3. 物化视图**：

```sql
-- StarRocks 物化视图
CREATE MATERIALIZED VIEW order_summary
DISTRIBUTED BY HASH(user_id)
AS SELECT
    user_id,
    dt,
    SUM(amount) AS gmv,
    COUNT(*) AS orders
FROM orders
GROUP BY user_id, dt;

-- 查询时自动命中
SELECT * FROM order_summary WHERE user_id = 12345;
```

**4. StarRocks / Doris 数据模型**：

```sql
-- Doris Unique Key 模型（upsert）
CREATE TABLE orders (
    order_id BIGINT,
    user_id BIGINT,
    amount DECIMAL(18, 2),
    order_time DATETIME,
    -- 主键
    UNIQUE KEY(order_id)
)
DISTRIBUTED BY HASH(order_id) BUCKETS 16
PROPERTIES ("replication_num" = "3");

-- StarRocks 主键模型
CREATE TABLE orders (
    order_id BIGINT,
    user_id BIGINT,
    amount DECIMAL(18, 2),
    order_time DATETIME,
    PRIMARY KEY (order_id)
)
DISTRIBUTED BY HASH(order_id) BUCKETS 16;
```

**5. ClickHouse MergeTree 引擎**：

```sql
-- ClickHouse ReplacingMergeTree（upsert）
CREATE TABLE orders (
    order_id Int64,
    user_id Int64,
    amount Decimal(18, 2),
    order_time DateTime
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(order_time)
ORDER BY (order_id, order_time);
```

**6. 向量索引（2024 新特性）**：

```sql
-- StarRocks 3.x 向量索引
ALTER TABLE products ADD COLUMN description_embedding ARRAY<FLOAT>;
CREATE VECTOR INDEX idx_embedding ON products(description_embedding);

-- 向量检索
SELECT * FROM products
ORDER BY l2_distance(description_embedding, [0.1, 0.2, ...])
LIMIT 10;
```

### 2.4 与相邻概念的关系

**OLAP 引擎 vs 查询引擎（Trino / Presto）**：

- OLAP 引擎：列存 + 向量化 + 强 schema，性能极致。
- 查询引擎：联邦查询 + 多源 + 灵活。
- **OLAP 适合固定查询模式，查询引擎适合即席跨源**。

**OLAP 引擎 vs 传统数仓**：

- 传统数仓：离线、T+1、专用存储。
- OLAP 引擎：实时、亚秒级、列存。

**OLAP 引擎 vs 时序数据库（TDengine / InfluxDB）**：

- OLAP 引擎：多维分析、聚合查询。
- 时序数据库：时序数据、监控指标。

**StarRocks vs Doris vs ClickHouse**：

| 维度 | StarRocks | Doris | ClickHouse |
| --- | --- | --- | --- |
| 母公司 | CelerData / 鼎石 | 百度 | Yandex |
| 架构 | 存算分离（3.x） | 存算一体 / 分离 | 存算一体 |
| 实时写入 | 强（主键模型） | 强（Unique Key） | 中（ReplacingMergeTree） |
| 向量化 | 强（向量化 3.0） | 强（向量化） | 强（向量化） |
| Join 性能 | 极强 | 强 | 中（Join 弱） |
| 物化视图 | 极强（自动增量） | 强 | 弱 |
| 多租户 | 强 | 强 | 中 |
| 云原生 | 强（3.x） | 中 | 中 |

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：实时 OLAP（Kafka → OLAP）**

- Kafka → Flink → OLAP（StarRocks / Doris / ClickHouse）。
- 适用：实时报表、实时大屏。

**模式 2：Lakehouse 外表查询**

- OLAP 查询 Iceberg / Hudi / Paimon 外表。
- 适用：Lakehouse + 实时查询。

**模式 3：物化视图加速**

- 预聚合 + 自动增量刷新。
- 适用：固定查询模式。

**模式 4：Cube / Rollup（谨慎）**

- 预计算所有维度组合。
- 适用：固定高频 OLAP。

**模式 5：OLAP + 向量检索（2024 新）**

- OLAP + 向量索引 + 联合查询。
- 适用：AI 应用。

**模式 6：OLAP + 指标语义层**

- 指标定义独立 + OLAP 查询。
- 适用：Headless BI。

**模式 7：云原生 OLAP**

- 存算分离、弹性扩缩容。
- 代表：SelectDB Cloud、Snowflake、BigQuery。

### 3.2 适用场景决策表

| 业务场景 | 推荐引擎 | 典型技术栈 |
| --- | --- | --- |
| 实时大屏 / 实时报表 | StarRocks / Doris | Kafka + Flink + StarRocks |
| 多维分析 | StarRocks / Doris | StarRocks + Iceberg |
| 大宽表聚合 | ClickHouse | ClickHouse 单表 |
| 实时写入 + 查询 | StarRocks | Kafka + StarRocks 主键模型 |
| 云原生 | SelectDB / Snowflake | SelectDB Cloud / Snowflake |
| AI / 向量检索 | StarRocks 3.x / Snowflake | StarRocks + 向量索引 |
| 即席联邦查询 | Trino | Trino + 多 Connector |
| 指标语义层 | Any OLAP + MetricFlow | MetricFlow + Cube + OLAP |

### 3.3 反模式与陷阱

**反模式 1：用 OLTP 做 OLAP**

- 在 MySQL 上跑复杂分析，数据库崩溃。
- **正确**：OLTP + OLAP 分离。

**反模式 2：过度依赖 Cube**

- 所有查询都建 Cube，存储爆炸。
- **正确**：MV 为主，Cube 谨慎。

**反模式 3：忽视数据倾斜**

- 部分 Tablet 处理数据过多。
- **正确**：合理分桶 + 随机分桶。

**反模式 4：未优化 Join**

- 大表 Join 大表，性能崩溃。
- **正确**：Broadcast Join（小心内存）+ Colocation Join。

**反模式 5：实时写入不当**

- 频繁小批次写入，导致版本过多。
- **正确**：攒批写入（5-30 秒）。

**反模式 6：未做冷热分层**

- 所有数据都存 SSD，成本高。
- **正确**：冷数据存对象存储 / HDD。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型引擎（2-4 周）**

- 实时报表：StarRocks / Doris。
- 大宽表：ClickHouse。
- 云原生：SelectDB / Snowflake。
- AI：StarRocks 3.x + 向量。

**Step 2：集群规划（1-2 周）**

- FE / BE 节点（StarRocks / Doris）。
- ClickHouse 节点。
- 副本数 3。

**Step 3：建表与建模（2-4 周）**

- 维度建模（事实表 + 维度表）。
- 分桶策略。
- 数据模型（主键 / 聚合 / Unique）。

**Step 4：数据接入（4-8 周）**

- Kafka / Flink 实时接入。
- Iceberg / Hive 外表查询。
- MySQL CDC 实时同步。

**Step 5：物化视图 + 查询优化（持续）**

- MV 加速高频查询。
- CBO 统计信息收集。

**Step 6：监控 + 调优（持续）**

- FE / BE 监控。
- 慢查询治理。

### 4.2 关键技术点

**1. StarRocks 实时数仓**

```sql
-- StarRocks 主键模型（实时更新）
CREATE TABLE orders (
    order_id BIGINT,
    user_id BIGINT,
    amount DECIMAL(18, 2),
    order_time DATETIME,
    PRIMARY KEY (order_id)
)
DISTRIBUTED BY HASH(order_id) BUCKETS 16
PROPERTIES ("replication_num" = "3");

-- Stream Load（Kafka 实时）
STREAM LOAD FROM KAFKA (
    "kafka_broker_list" = "kafka:9092",
    "kafka_topic" = "orders",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**2. Doris 实时数仓**

```sql
-- Doris Unique Key 模型
CREATE TABLE orders (
    order_id BIGINT,
    user_id BIGINT,
    amount DECIMAL(18, 2),
    order_time DATETIME,
    UNIQUE KEY(order_id)
)
DISTRIBUTED BY HASH(order_id) BUCKETS 16
PROPERTIES ("replication_num" = "3");

-- Routine Load（Kafka 实时）
CREATE ROUTINE LOAD orders_load ON orders
COLUMNS (order_id, user_id, amount, order_time)
PROPERTIES (
    "desired_concurrent_number" = "3",
    "max_error_number" = "1000"
)
FROM KAFKA (
    "kafka_broker_list" = "kafka:9092",
    "kafka_topic" = "orders"
);
```

**3. ClickHouse 实时数仓**

```sql
-- ClickHouse ReplacingMergeTree（upsert）
CREATE TABLE orders (
    order_id Int64,
    user_id Int64,
    amount Decimal(18, 2),
    order_time DateTime
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(order_time)
ORDER BY (order_id, order_time);

-- Kafka 表引擎（实时摄入）
CREATE TABLE orders_kafka (
    order_id Int64,
    user_id Int64,
    amount Decimal(18, 2),
    order_time DateTime
)
ENGINE = Kafka()
SETTINGS kafka_broker_list = 'kafka:9092',
         kafka_topic = 'orders',
         kafka_format = 'JSONEachRow',
         kafka_group_name = 'clickhouse-consumer';

-- 物化视图（实时同步）
CREATE MATERIALIZED VIEW orders_mv TO orders AS
SELECT * FROM orders_kafka;
```

**4. 物化视图（自动增量）**

```sql
-- StarRocks 自动增量物化视图
CREATE MATERIALIZED VIEW order_summary
DISTRIBUTED BY HASH(user_id)
REFRESH ASYNC
AS SELECT
    user_id,
    dt,
    SUM(amount) AS gmv,
    COUNT(*) AS orders
FROM orders
GROUP BY user_id, dt;
```

**5. 向量索引（2024 新特性）**

```sql
-- StarRocks 3.x 向量索引
ALTER TABLE products ADD COLUMN description_embedding ARRAY<FLOAT>;
CREATE VECTOR INDEX idx_embedding ON products(description_embedding);

-- 向量检索
SELECT product_id, product_name,
    l2_distance(description_embedding, [0.1, 0.2, ...]) AS distance
FROM products
ORDER BY distance ASC
LIMIT 10;
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**OLAP 引擎（2024-2025）**：

| 工具 | 版本 | 特点 |
| --- | --- | --- |
| Apache Doris | 2.1+ / 3.0 | 国产开源、存算分离 |
| StarRocks | 3.x | 国产开源、Cloud Native + 向量索引 |
| ClickHouse | 24.x | 单表性能极致、SharedMergeTree |
| SelectDB Cloud | - | 云原生实时数仓 |
| Apache Druid | - | 实时 OLAP |
| Apache Pinot | - | 实时 OLAP |
| Trino | 420+ | 联邦查询 |
| DuckDB | 1.x | 内嵌 OLAP |

**实时接入**：

- Kafka / Flink：主流摄入。
- Stream Load（StarRocks）、Routine Load（Doris）、Kafka Engine（ClickHouse）。

**生态工具**：

- StreamX / SeaTunnel：实时摄入平台。
- DBT + OLAP：SQL 化建模。
- Apache Superset / Grafana：BI 工具。

### 4.4 代码 / 示例

**示例 1：StarRocks + Flink 实时数仓**

```java
// Flink → StarRocks
TableEnvironment tEnv = ...;

tEnv.executeSql("""
    CREATE TABLE kafka_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      order_time TIMESTAMP(3)
    ) WITH (
      'connector' = 'kafka',
      'topic' = 'orders',
      'format' = 'json'
    )
""");

tEnv.executeSql("""
    CREATE TABLE starrocks_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      order_time TIMESTAMP(3),
      PRIMARY KEY (order_id) NOT ENFORCED
    ) WITH (
      'connector' = 'starrocks',
      'jdbc-url' = 'jdbc:mysql://starrocks-fe:9030',
      'load-url' = 'starrocks-be:8040',
      'database-name' = 'shop',
      'table-name' = 'orders'
    )
""");

tEnv.executeSql("""
    INSERT INTO starrocks_orders
    SELECT * FROM kafka_orders
""");
```

**示例 2：Doris Routine Load（Kafka 实时摄入）**

```sql
-- Doris Routine Load
CREATE ROUTINE LOAD shop.orders_load ON shop.orders
COLUMNS (order_id, user_id, amount, order_time),
ORDER BY order_id
PROPERTIES (
    "desired_concurrent_number" = "3",
    "max_error_number" = "1000"
)
FROM KAFKA (
    "kafka_broker_list" = "kafka:9092",
    "kafka_topic" = "orders",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**示例 3：ClickHouse 向量化查询**

```sql
-- ClickHouse 列存 + 向量化
SELECT
    region,
    product_category,
    sum(amount) AS gmv,
    count(DISTINCT user_id) AS unique_users,
    avg(amount) AS avg_order
FROM orders
WHERE order_time BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY region, product_category
ORDER BY gmv DESC
LIMIT 100;

-- 利用 Zone Map 跳过数据块
SELECT * FROM orders WHERE order_id = 12345;
-- → ClickHouse 自动用 order_id 索引跳过 99% 数据块
```

**示例 4：DuckDB 内嵌 OLAP（2024 AI 时代）**

```python
import duckdb

# 直接查询 Parquet
result = duckdb.query("""
    SELECT
        region,
        SUM(amount) AS gmv,
        COUNT(DISTINCT user_id) AS users
    FROM read_parquet('s3://lake/orders/dt=2025-01-01/*.parquet')
    WHERE order_status = 'paid'
    GROUP BY region
    ORDER BY gmv DESC
""").to_df()

# DuckDB + Pandas（嵌入分析）
import pandas as pd
df = pd.read_parquet("s3://lake/orders/dt=2025-01-01/")
result = duckdb.query("""
    SELECT region, SUM(amount) FROM df GROUP BY region
""").to_df()
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：自然语言查询（Text-to-SQL）**

- 用户自然语言 → OLAP SQL。
- 工具：Databricks Genie、Snowflake Cortex Analyst、StarRocks AI。

**演进方向 2：OLAP + 向量检索融合**

- 结构化 + 向量统一存储、统一检索。
- 工具：StarRocks 3.x 向量索引、Snowflake Vector Search。

**演进方向 3：AI 驱动的查询优化**

- LLM 预测查询模式、自动优化。
- 工具：Snowflake Query Insights、StarRocks AI Advisor。

**演进方向 4：自治 OLAP（Self-Driving OLAP）**

- AI 自动监控、自动调优、自动扩容。
- 工具：Snowflake Auto-Tuning、StarRocks Auto-Optimization。

**演进方向 5：AI 原生 OLAP**

- OLAP + LLM Functions。
- 工具：Snowflake Cortex、Databricks AI Functions。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**OLAP + RAG**：

- OLAP 结构化事实 + 向量库非结构化检索。
- 工具：StarRocks + LanceDB + LLM。

**OLAP + GraphRAG**：

- OLAP 事实 + 知识图谱。
- 工具：StarRocks + Neo4j + LLM。

**OLAP + 实时特征**：

- OLAP 实时查询 + 特征库。
- 工具：StarRocks + Feast。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **StarRocks 论文（SOSP 2024）**：向量化 + CBO + 物化视图架构。
- **Doris 论文（SIGMOD 2024）**：MPP 架构演进。
- **ClickHouse 论文（VLDB 2024）**：MergeTree + 向量化。

**工业进展**：

- **StarRocks 3.x（2024-2025）**：存算分离、向量索引、AI 优化。
- **Apache Doris 2.1 / 3.0（2024-2025）**：存算分离、向量化 3.0。
- **ClickHouse 24.x（2024）**：SharedMergeTree、Kafka 引擎增强。
- **SelectDB Cloud（2024）**：对标 Snowflake 的云原生 OLAP。

### 5.4 未来 3-5 年趋势

**趋势 1：OLAP + AI 默认集成**

- 所有 OLAP 都集成向量索引 + LLM Functions。
- AI 时代 OLAP 标准能力。

**趋势 2：自治 OLAP**

- AI 自动调优、自适应查询。
- 自治 OLAP 引擎。

**趋势 3：云原生 OLAP**

- 存算分离成为默认。
- 多云、混合云原生支持。

**趋势 4：实时 OLAP + 流批融合**

- OLAP 原生支持流批读写。
- 实时数仓 + 离线分析统一。

**趋势 5：内嵌 OLAP 主流**

- DuckDB / DataFusion 内嵌引擎。
- 边缘计算 + Notebook 原型。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：小红书 StarRocks（实时数仓）**

- **数据规模**：PB 级。
- **架构**：Kafka + Flink + StarRocks。
- **效果**：实时报表秒级刷新。

**案例 2：京东 Doris（电商实时分析）**

- **数据规模**：PB 级。
- **架构**：MySQL CDC + Flink + Doris。
- **效果**：替代传统数仓，性能提升 10x。

**案例 3：字节 ClickHouse（监控）**

- **数据规模**：PB 级。
- **架构**：Kafka + ClickHouse。
- **效果**：亿级监控指标实时查询。

**案例 4：腾讯 SelectDB Cloud**

- **数据规模**：服务多家企业。
- **架构**：云原生 OLAP。
- **效果**：TCO 降低 50%。

### 6.2 踩坑与经验

**坑 1：数据倾斜**

- **现象**：部分 Tablet 慢。
- **解决**：合理分桶 + RANDOM 分桶。

**坑 2：Join 性能差**

- **现象**：大表 Join 慢。
- **解决**：Broadcast Join + Colocation Join。

**坑 3：实时写入版本过多**

- **现象**：频繁小批次写入。
- **解决**：攒批写入（5-30 秒）。

**坑 4：Cube 爆炸**

- **现象**：存储爆炸。
- **正确**：MV 为主，Cube 谨慎。

**坑 5：未做监控**

- **现象**：故障不知。
- **解决**：FE/BE 监控 + 慢查询治理。

**坑 6：冷数据成本高**

- **现象**：所有数据存 SSD。
- **解决**：冷热分层（HDD / 对象存储）。

### 6.3 落地路径（0→1, 1→10, 10→100）

**阶段 1：0 → 1（启动期，0-6 个月）**

- 选型 ClickHouse / StarRocks。
- 团队：2-3 数据工程师。

**阶段 2：1 → 10（扩展期，6-18 个月）**

- 实时接入（Kafka + Flink）。
- 物化视图加速。
- 团队：5-10 + 架构师。

**阶段 3：10 → 100（规模化期，18-36 个月）**

- 多引擎共存（StarRocks + ClickHouse + Doris）。
- AI 集成（向量索引 + LLM）。
- 团队：20-50 + 平台团队。

### 6.4 ROI 评估

**评估维度**：

- **查询性能**：从分钟级 → 亚秒级。
- **业务响应**：实时报表支持。
- **AI 友好度**：向量索引 + LLM。
- **成本控制**：云原生 + 冷热分层。

**典型 ROI**：

- 小红书：实时报表秒级刷新。
- 京东：性能提升 10x。
- 字节：亿级监控实时查询。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | StarRocks | Doris | ClickHouse | Trino | DuckDB |
| --- | :---: | :---: | :---: | :---: | :---: |
| 查询性能 | 5 | 5 | 5 | 4 | 5 |
| 实时写入 | 5 | 5 | 3 | 2 | 1 |
| Join 性能 | 5 | 5 | 3 | 4 | 5 |
| 物化视图 | 5 | 4 | 2 | 1 | 1 |
| 联邦查询 | 2 | 2 | 1 | 5 | 3 |
| AI 友好 | 4 | 4 | 3 | 3 | 5 |
| 内嵌能力 | 1 | 1 | 1 | 1 | 5 |

### 7.2 决策树

```
数据规模 + 查询模式？
├── 单表大宽表聚合
│   └── ClickHouse
├── 多表 Join + 实时
│   └── StarRocks / Doris
├── 联邦跨源查询
│   └── Trino
├── 内嵌 / Notebook
│   └── DuckDB
└── AI 应用
    └── StarRocks 3.x + 向量索引
```

### 7.3 组合使用

**组合 1：StarRocks + Iceberg 外表**

- StarRocks 查询 Iceberg 外表。
- 适用：Lakehouse + 实时查询。

**组合 2：ClickHouse + StarRocks**

- ClickHouse 存明细，StarRocks 存聚合。
- 适用：分层查询。

**组合 3：DuckDB + StarRocks**

- DuckDB 本地原型，StarRocks 生产。
- 适用：开发 + 生产。

**组合 4：OLAP + 向量库 + LLM**

- OLAP + LanceDB + LLM。
- 适用：AI 应用。

---

## 8. 面试真题集

> **一句话定位**：ClickHouse / Doris / StarRocks / Druid / Pinot / Trino 的工程取舍。
>
> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。
>
> 本子章节暂无匹配原 PDF 子章节，归入跨章节综合题库，建议直接查阅 [Ch3 章节目录](../README.md) 与 [Ch13 OLAP 引擎关联章节](../13-query-engine/)。
