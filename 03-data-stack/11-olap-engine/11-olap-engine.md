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
- 2012：Impala（Cloudera）。
- 2013：Presto 0.1（Facebook）。

**第三阶段：列存 + 向量化（2015-2020）**

- 2016：ClickHouse 1.0（俄罗斯 Yandex）。
- 2017：Apache Doris 0.x（原 Palo）。
- 2017：Apache Druid（实时 OLAP）。
- 2018：StarRocks 开源（原 Doris 团队分叉）。

**第四阶段：实时 OLAP（2020-2024）**

- 2020：StarRocks 1.x、Doris 1.0。
- 2022：StarRocks 2.x、Doris 1.2+、ClickHouse 22.x。
- 2023：StarRocks 3.0（存算分离）。
- 2024：SelectDB Cloud、Apache Doris 2.1。

**第五阶段：AI 原生 OLAP（2024-至今）**

- 2024：StarRocks 3.x + 向量索引、Doris 2.1 + AI Functions。
- 2024：Snowflake Cortex + Vector、Databricks Vector Search。
- 2025：「AI 原生 OLAP」的两项代表性能力（自然语言查询、自治优化）尚未既成——前者在评测与原型层（L2），后者仍是路线图（L3），成熟度见 §5。

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
    for (int i = 0; i < n; i += 1024) {                    // 每批 1024 行（N=1024-8192 的批大小）
        for (int j = i; j < i + 1024 && j < n; j += 8) {   // 批内：一条 SIMD 指令处理 8 个 int32（256 bit）
            __m256i va = _mm256_load_si256((__m256i*)(a + j));
            __m256i vb = _mm256_load_si256((__m256i*)(b + j));
            __m256i vr = _mm256_add_epi32(va, vb);
            _mm256_store_si256((__m256i*)(result + j), vr);
        }
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

> 💡 **思考锚点**：给你的慢查询做一次代价拆解：按本节 CBO 的 Cost = α×I/O + β×CPU + γ×Network，估一下这条查询的时间主要落在哪一项。如果瓶颈是 γ×Network（Shuffle），那上一次「换个更快的 OLAP 引擎」——列存压缩 5-10x、向量化执行 5-20x 这两笔收益——有多少真正作用在了这条查询上？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](11-olap-engine-section-3-sec3.md)
- [§4. 工程实现](11-olap-engine-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](11-olap-engine-section-5-ai.md)
- [§6. 落地实践](11-olap-engine-section-6-sec6.md)
- [§7. 与其他方法对比](11-olap-engine-section-7-sec7.md)
- [§8. 面试真题集](11-olap-engine-section-8-sec8.md)

---
