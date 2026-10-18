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
- 2023：Trino 420+、Iceberg V3 支持（V3 规范本身的年份以 Apache Iceberg 官方表规范页当前内容为准；本书按 2024 年侧记，见 [03-lakehouse](../03-lakehouse/03-lakehouse.md) 的时间线）。
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

- [§3. 设计模式与范式](13-query-engine-section-3-sec3.md)
- [§4. 工程实现](13-query-engine-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](13-query-engine-section-5-ai.md)
- [§6. 落地实践](13-query-engine-section-6-sec6.md)
- [§7. 与其他方法对比](13-query-engine-section-7-sec7.md)
- [§8. 面试真题集](13-query-engine-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](13-query-engine-section-3-sec3.md)
- [§4. 工程实现](13-query-engine-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](13-query-engine-section-5-ai.md)
- [§6. 落地实践](13-query-engine-section-6-sec6.md)
- [§7. 与其他方法对比](13-query-engine-section-7-sec7.md)
- [§8. 面试真题集](13-query-engine-section-8-sec8.md)

---
