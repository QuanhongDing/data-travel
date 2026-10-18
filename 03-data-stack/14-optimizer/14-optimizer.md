# 查询优化器（Query Optimizer）

> **一句话定位**：以 Calcite / CBO / Cascades / AI 驱动优化器为核心的智能查询计划生成器，是查询引擎与 OLAP 引擎的"大脑"。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**14 查询优化器**）。覆盖 **R4 数据全栈协同** 能力领域中「RBO / CBO / 自适应执行、AI 驱动优化、统计信息管理」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| CBO 和 RBO 的本质区别？ | §1.1 |
| Cascades / Volcano 优化器框架是什么？ | §2.1 |
| 自适应查询执行（AQE）怎么落地？ | §4.1 |
| 2024-2025 AI 驱动的查询优化新趋势？ | §5 |
| 慢查询治理的最佳实践？ | §4.2 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：查询优化器（Query Optimizer）是**将用户 SQL 转换为最优执行计划的引擎**。它通过规则（RBO）或代价模型（CBO）选择最优的 Join 顺序、Join 策略、聚合算法等。

**工程定义**：在数据架构师手里，查询优化器是**一份让 PB 级查询从分钟级降到秒级的"计划生成器"**。核心特征：

- **逻辑计划优化**：子查询消除、谓词下推、列剪裁。
- **物理计划优化**：Join 顺序、Join 算法（Broadcast Hash / Sort Merge）、并行度。
- **代价估算**：基于统计信息估算 I/O、CPU、Network。
- **自适应执行**：运行时根据实际数据量调整计划。
- **AI 增强**：LLM 预测查询模式、自动优化。

### 1.2 为什么需要

**业务驱动力**：

- **慢查询治理**：PB 级查询需要从分钟级降到秒级。
- **自适应执行**：不同数据量需要不同策略。
- **资源优化**：减少 Shuffle、避免 OOM。
- **AI 时代**：LLM 自动调优成为可能。

**痛点（没有优化器的代价）**：

1. **慢查询**：错误 Join 顺序导致小时级查询。
2. **资源浪费**：大 Shuffle 占满网络。
3. **OOM 频繁**：内存估算错误。
4. **人工调优**：每条慢查询都靠 DBA 手工优化。

**AI 时代的新诉求**：

- **自治优化**：LLM 自动调优。
- **预测优化**：基于历史查询预测优化策略。
- **自然语言优化**：用户说"为什么这个查询慢"→ 自动诊断。

### 1.3 在 AI 时代数据架构中的位置

```
[SQL]
  ↓
[Parser 解析]
  ↓
[Optimizer 优化] ← RBO + CBO + AQE + AI
  ↓
[Execution 执行]
  ↓
[结果]
```

**查询优化器是查询引擎的"大脑"**：决定查询快慢。

### 1.4 演进历程

**第一阶段：基于规则的优化器（1970-2000）**

- System R 优化器（IBM）。
- 启发式规则：谓词下推、列剪裁。

**第二阶段：基于代价的优化器（1990-2010）**

- Volcano / Cascades 框架（Goetz Graefe）。
- 代价模型 + 统计信息。

**第三阶段：现代 CBO（2010-2020）**

- Spark Catalyst、Calcite、Trino CBO。
- 自适应执行（AQE）。

**第四阶段：AI 增强（2020-至今）**

- 2020：Spark 3.0 AQE。
- 2022：Trino AQE、CBO 增强。
- 2024：AI 驱动优化（Snowflake、StarRocks）。

**第五阶段：自治优化（2024-至今；目前是方向，§5.2.3 按成熟度判为 L3 观望）**

- 2024：LLM 自动调优。
- 2025：自治优化器（Self-Driving Optimizer）。

**一句话总结**：**查询优化器从"RBO"→"CBO"→"AQE"→"AI 增强"→"自治优化"五阶段演进，今天 AI 增强成为新趋势。**

---

## 2. 核心原理

### 2.1 关键概念定义

**RBO（Rule-Based Optimizer）**：

- 基于启发式规则。
- 优点：稳定、可预测。
- 缺点：忽略数据分布。

**CBO（Cost-Based Optimizer）**：

- 基于代价模型。
- 需要统计信息（行数、NDV、Min/Max、Histogram）。
- 优点：考虑数据分布。
- 缺点：统计信息陈旧导致错误计划。

**Cascades / Volcano 框架**（两者都是**代价驱动**的搜索框架，区别在搜索与规则的通用程度）：

- **Volcano**：优化器生成器（Goetz Graefe）——用变换规则扩展计划空间，按代价搜索并剪枝。
- **Cascades**：Volcano 之后的通用框架（同一作者）——把"逻辑等价"与"物理实现"分层存入 Memo，规则集与搜索调度更通用。
- **核心**：Memo（记忆化）+ Cost Model。

**统计信息（Statistics）**：

- **行数（Row Count）**。
- **NDV（Number of Distinct Values）**：不同值数量。
- **Min/Max**：列的最小/最大值。
- **Histogram**：直方图（数据分布）。
- **TopK**：高频值。

**自适应查询执行（AQE）**：

- 运行时根据实际数据调整计划。
- Spark 3.0+、Trino、StarRocks（Trino 与 StarRocks 的版本以各自官方发布说明为准）。

**Join 顺序优化**：

- N 张表 Join 有 N! 种顺序。
- 动态规划算法（DP）：O(2^N)。
- 贪心算法：O(N^2 log N)。

**Join 算法**：

- **Broadcast Hash Join**：小表广播到大 Task。
- **Shuffle Hash Join**：按 Key Shuffle + Hash。
- **Sort Merge Join**：排序后归并。
- **Nested Loop Join**：嵌套循环（小数据集）。

**谓词下推（Predicate Pushdown）**：

- WHERE 条件下推到存储层。
- 减少 I/O。

**列剪裁（Column Pruning）**：

- 只读需要的列。

**子查询消除**：

- 把 IN/EXISTS 转为 JOIN。

### 2.2 数学 / 形式化基础

**Cascades 优化器的数学模型**：

```
Plan = LogicalPlan + PhysicalProperties
Cost(Plan) = Σ (Cost(Operator_i))
BestPlan = argmin Cost(Plan)
```

**CBO 代价估算**：

```
Cost = α × I/O + β × CPU + γ × Network

I/O = (Row × ColumnWidth) / CompressionRatio
CPU = Row × PerRowCost
Network = Shuffle × ShuffleDataSize
```

**统计信息的形式化**：

- **行数估计**：基于直方图 + 基数估计。
- **选择率（Selectivity）**：`filtered_rows = total_rows × selectivity`。
- **NDV 估计**：HyperLogLog / Sampling。

**AQE 的运行时调整**：

- Stage 完成后，收集实际数据量。
- 动态调整：Join 策略、并行度、Shuffle 分区数。

**Join 顺序的复杂度**：

- 动态规划（DP）：O(2^N)。
- 贪心算法（Greedy）：O(N^2 log N)。

### 2.3 关键算法 / 方法

**1. Spark Catalyst 优化器**

```sql
-- Spark 自动优化
SELECT *
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.amount > 1000;

-- Catalyst 自动应用：
-- 1. 谓词下推：amount > 1000 下推到 orders
-- 2. 列剪裁：只读需要的列
-- 3. Join 顺序：选择最优 Join 顺序
```

**2. Trino CBO**

```sql
-- 收集统计信息
ANALYZE TABLE iceberg.orders;

-- CBO 自动选择最优计划
EXPLAIN SELECT * FROM iceberg.orders WHERE user_id = 12345;
```

**3. Spark AQE**

```sql
SET spark.sql.adaptive.enabled = true;
SET spark.sql.adaptive.skewJoin.enabled = true;
SET spark.sql.adaptive.coalescePartitions.enabled = true;
SET spark.sql.adaptive.skewJoin.skewedPartitionFactor = 5;
SET spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes = 256mb;
```

**4. StarRocks CBO**

```sql
-- 收集统计信息
ANALYZE TABLE orders;

-- CBO 自动选择最优 Join 策略
SELECT * FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.amount > 1000;
-- CBO 自动选择 Broadcast Hash Join（小表 users 广播）
```

**5. AI 驱动的优化（Snowflake / StarRocks）**

```python
# Snowflake Query Insights
# LLM 自动诊断慢查询

slow_query = """
SELECT * FROM orders WHERE ... -- 慢查询
"""

# LLM 自动建议：
# - 增加索引
# - 调整分区
# - 改写 SQL
# - 增加物化视图
```

**6. 慢查询治理**

```python
# 1. 收集慢查询日志
slow_queries = [
    {
        'sql': 'SELECT ...',
        'execution_time': 3600,
        'rows_scanned': 1000000000,
        'shuffle_bytes': 100_000_000_000,
    }
]

# 2. AI 自动诊断
diagnosis = llm.invoke(f"""
请分析这条慢查询：{slow_queries[0]['sql']}
执行时间：{slow_queries[0]['execution_time']}秒
扫描行数：{slow_queries[0]['rows_scanned']}

建议优化方向。
""")

# 3. 自动生成优化建议
print(diagnosis)
```

### 2.4 与相邻概念的关系

**优化器 vs 查询引擎**：

- 优化器：负责生成最优执行计划。
- 查询引擎：负责执行。

**RBO vs CBO**：

- RBO：规则驱动，稳定。
- CBO：代价驱动，需要统计信息。

**CBO vs AQE**：

- CBO：编译期优化。
- AQE：运行时优化。

> 💡 **思考锚点**：数一下你最慢那条 SQL 参与 Join 的表有几个——CBO 排 Join 顺序是 O(2^N) 的 DP（§2.2），N 到多少你们会退回 O(N² log N) 的贪心？更要紧的是统计信息（NDV / 直方图）上次 ANALYZE 是什么时候：它过期后 CBO 估的 filtered_rows 已经偏了，你还指望它替你选对 Broadcast Hash Join 吗？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](14-optimizer-section-3-sec3.md)
- [§4. 工程实现](14-optimizer-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](14-optimizer-section-5-ai.md)
- [§6. 落地实践](14-optimizer-section-6-sec6.md)
- [§7. 与其他方法对比](14-optimizer-section-7-sec7.md)
- [§8. 面试真题集](14-optimizer-section-8-sec8.md)

---
