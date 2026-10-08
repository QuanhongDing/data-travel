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

**第五阶段：自治优化（2024-至今）**

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

**Cascades / Volcano 框架**：

- **Volcano**：基于规则的搜索框架。
- **Cascades**：基于代价的搜索框架（Goetz Graefe）。
- **核心**：Memo（记忆化）+ Cost Model。

**统计信息（Statistics）**：

- **行数（Row Count）**。
- **NDV（Number of Distinct Values）**：不同值数量。
- **Min/Max**：列的最小/最大值。
- **Histogram**：直方图（数据分布）。
- **TopK**：高频值。

**自适应查询执行（AQE）**：

- 运行时根据实际数据调整计划。
- Spark 3.0+、Trino 400+、StarRocks 2.5+。

**Join 顺序优化**：

- N 张表 Join 有 N! 种顺序。
- 动态规划算法（DP）：O(2^N)。
- 贪心算法：O(N^2)。

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
- 贪心算法（Greedy）：O(N^2)。

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

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：CBO + 统计信息（标准）**

- 收集统计信息 + CBO 自动优化。
- 适用：所有现代查询引擎。

**模式 2：AQE 自适应（2020+）**

- 运行时调整 + 优化。
- 适用：Spark 3.x、Trino、StarRocks。

**模式 3：AI 驱动优化（2024 新）**

- LLM 自动诊断 + 自动调优。
- 适用：Snowflake、StarRocks AI Advisor。

**模式 4：Calcite 嵌入式优化器**

- 自研查询引擎集成 Calcite。
- 适用：自研场景。

**模式 5：Cost-Based + Cascade 框架**

- 经典 CBO 实现。
- 适用：自研高性能引擎。

**模式 6：AI 自治优化（2025+）**

- 自治优化器，无人工干预。
- 适用：未来。

### 3.2 适用场景决策表

| 业务场景 | 推荐优化器 | 典型技术栈 |
| --- | --- | --- |
| Spark / Trino | CBO + AQE | Spark 3.x、Trino 420+ |
| StarRocks / Doris | CBO + AQE + AI | StarRocks 3.x、Doris 2.1+ |
| ClickHouse | CBO + 向量化 | ClickHouse 24.x |
| 自研查询引擎 | Calcite / Velox | Apache Calcite、Velox |
| AI 原生 | AI 驱动 | Snowflake、StarRocks AI |

### 3.3 反模式与陷阱

**反模式 1：不收集统计信息**

- 现象：CBO 选错计划。
- 解决：定期 ANALYZE。

**反模式 2：未启用 AQE**

- 现象：错过运行时优化。
- 解决：开启 AQE。

**反模式 3：统计信息陈旧**

- 现象：数据分布变化，统计信息不准。
- 解决：定期刷新 + 自动收集。

**反模式 4：Join 顺序错误**

- 现象：大表 Join 大表慢。
- 解决：人工 hint + 广播小表。

**反模式 5：忽视数据倾斜**

- 现象：单 Task 慢。
- 解决：自适应 Skew Join。

**反模式 6：完全依赖 CBO**

- 现象：CBO 选错计划。
- 解决：CBO + 人工 hint。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：开启 CBO + AQE（1-2 周）**

- 收集统计信息。
- 开启 AQE。

**Step 2：慢查询治理（持续）**

- 慢查询日志。
- 人工诊断 + 优化。

**Step 3：AI 集成（按需）**

- AI 自动诊断。
- AI 自动优化建议。

**Step 4：自治优化（持续）**

- 自适应参数调优。
- 自治索引建议。

### 4.2 关键技术点

**1. Spark CBO + AQE 完整配置**

```sql
-- CBO 配置
SET spark.sql.cbo.enabled = true;
SET spark.sql.statistics.histogram.enabled = true;

-- 收集统计信息
ANALYZE TABLE orders COMPUTE STATISTICS;
ANALYZE TABLE orders COMPUTE STATISTICS FOR COLUMNS user_id, amount;

-- AQE 配置
SET spark.sql.adaptive.enabled = true;
SET spark.sql.adaptive.skewJoin.enabled = true;
SET spark.sql.adaptive.coalescePartitions.enabled = true;
SET spark.sql.adaptive.skewJoin.skewedPartitionFactor = 5;
SET spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes = 256mb;
```

**2. Trino CBO 完整配置**

```sql
-- 收集统计信息
ANALYZE TABLE iceberg.orders;

-- CBO 启用
SET SESSION join_distribution_type = 'AUTOMATIC';

-- AQE 启用
SET SESSION query_max_run_time = '10m';

-- EXPLAIN 查看计划
EXPLAIN SELECT * FROM iceberg.orders WHERE user_id = 12345;
```

**3. StarRocks CBO + AQE**

```sql
-- 收集统计信息
ANALYZE TABLE orders;

-- CBO 自动选择 Join 策略
SELECT * FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.amount > 1000;
-- CBO 自动选择 Broadcast Hash Join

-- 启用 AQE
SET enable_query_queue = true;
SET query_timeout = 300;
```

**4. AI 驱动优化（2024 新趋势）**

```python
# StarRocks AI Advisor / Snowflake Cortex
# 自动诊断慢查询

slow_query = """
SELECT *
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.amount > 1000
"""

# AI 自动诊断
diagnosis = ai_advisor.analyze(slow_query)
print(diagnosis)
# Output:
# - 建议：增加 user_id 索引
# - 建议：users 表改为 Broadcast
# - 建议：增加物化视图
```

**5. 慢查询治理**

```python
# 慢查询日志收集
slow_queries = collect_slow_queries(threshold=60)

# 自动分析
for query in slow_queries:
    # 1. EXPLAIN 分析
    plan = get_explain_plan(query.sql)
    
    # 2. AI 诊断
    diagnosis = ai_advisor.diagnose(query.sql, plan)
    
    # 3. 自动优化建议
    suggestions = ai_advisor.suggest(query.sql, plan)
    
    # 4. 通知 DBA
    notify_dba(query, diagnosis, suggestions)
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**查询优化器（2024-2025）**：

| 工具 | 版本 | 特点 |
| --- | --- | --- |
| Apache Calcite | 1.36+ | 动态数据管理框架 |
| Spark Catalyst | 3.5+ | Spark SQL 优化器 |
| Trino CBO | 420+ | 联邦查询优化器 |
| StarRocks CBO | 3.x | 实时 OLAP 优化器 + AI |
| Velox（Meta） | - | C++ 向量化优化器 |
| DataFusion | 30+ | Rust 查询引擎 + 优化器 |

**AI 优化器（2024-2025 新趋势）**：

| 工具 | 特点 |
| --- | --- |
| Snowflake Cortex | AI 自动诊断 |
| StarRocks AI Advisor | 智能调优 |
| Databricks Assistant | 自然语言优化 |
| 自研 + LLM | 定制化 AI 优化 |

### 4.4 代码 / 示例

**示例 1：Spark CBO + AQE 完整优化**

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("OptimizerDemo") \
    .config("spark.sql.cbo.enabled", "true") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.adaptive.skewJoin.enabled", "true") \
    .getOrCreate()

# 收集统计信息
spark.sql("ANALYZE TABLE orders COMPUTE STATISTICS")
spark.sql("ANALYZE TABLE orders COMPUTE STATISTICS FOR COLUMNS user_id, amount")

# CBO 自动优化
result = spark.sql("""
    SELECT
        u.user_name,
        SUM(o.amount) AS gmv
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.amount > 1000
    GROUP BY u.user_name
""")
result.show()
```

**示例 2：Trino CBO + EXPLAIN**

```sql
-- 收集统计信息
ANALYZE TABLE iceberg.orders;

-- 查看执行计划
EXPLAIN (FORMAT JSON)
SELECT *
FROM iceberg.orders o
JOIN mysql.users u ON o.user_id = u.id
WHERE o.amount > 1000;

-- 强制 Broadcast Join（小表）
SELECT *
FROM iceberg.orders o
JOIN mysql.users u ON o.user_id = u.id
WHERE o.amount > 1000;
```

**示例 3：AI 驱动慢查询诊断（2024 新工具）**

```python
# AI 自动诊断慢查询
import openai

def diagnose_slow_query(sql, execution_time, plan):
    """LLM 诊断慢查询"""
    prompt = f"""
    请分析以下慢查询并给出优化建议：

    SQL：
    {sql}

    执行时间：{execution_time}秒
    执行计划：
    {plan}

    请从以下维度分析：
    1. Join 顺序是否合理？
    2. 是否存在数据倾斜？
    3. 是否缺少索引？
    4. 是否有更好的写法？
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

# 使用
diagnosis = diagnose_slow_query(
    sql="SELECT * FROM orders o JOIN users u ON o.user_id = u.id WHERE o.amount > 1000",
    execution_time=3600,
    plan="Hash Join (shuffle) ..."
)
print(diagnosis)
```

**示例 4：Calcite 自定义优化器**

```java
// Apache Calcite 自定义优化器
RelNode logicalPlan = ...;
RelOptPlanner planner = ...;

// 添加规则
planner.addRule(FilterPushDownRule.INSTANCE);
planner.addRule(JoinReorderRule.INSTANCE);
planner.addRule(ProjectFilterTransposeRule.INSTANCE);

// 优化
RelNode optimizedPlan = planner.optimize(logicalPlan);
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：AI 驱动优化**

- LLM 诊断慢查询 + 自动优化。
- 工具：Snowflake Cortex、StarRocks AI Advisor。

**演进方向 2：自治优化（Self-Driving Optimizer）**

- AI 自动监控、自动调优。
- 工具：自研 + LLM。

**演进方向 3：预测式优化**

- 基于历史查询预测优化策略。
- 工具：自研 + ML。

**演进方向 4：自然语言优化**

- 用户说"为什么这个查询慢"→ 自动诊断。
- 工具：Snowflake Cortex、StarRocks AI。

**演进方向 5：AI + CBO + AQE 融合**

- AI + 传统优化器深度融合。
- 工具：自研 + LLM。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**优化器知识 RAG**：

- 历史优化案例 + 优化规则 → 向量化 → RAG 检索。
- 工具：LanceDB + LangChain。

**优化依赖图（GraphRAG）**：

- 优化器内部依赖 → 知识图谱。
- 工具：Neo4j + LLM。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **Cascades 论文（Goetz Graefe, 经典）**：CBO 框架。
- **Snowflake 论文（SIGMOD 2024）**：AI 驱动优化。
- **StarRocks 论文（SOSP 2024）**：向量化 CBO。

**工业进展**：

- **Snowflake Cortex（2024）**：AI 自动诊断 + 优化。
- **StarRocks 3.x AI Advisor（2024）**：智能调优。
- **Apache Calcite 1.36+（2024）**：增强 AI 集成。
- **DataFusion 30+（2024）**：自适应优化。

### 5.4 未来 3-5 年趋势

**趋势 1：AI 驱动优化主流**

- LLM 自动诊断 + 自动调优。
- 自治优化器。

**趋势 2：自治优化（Self-Driving）**

- AI 自动监控、自动调优、自适应。
- 自治优化器。

**趋势 3：多目标优化**

- 同时优化性能、成本、能耗。
- 工具：自研 + LLM。

**趋势 4：跨引擎优化**

- 跨 Spark / Flink / Trino 优化。
- 工具：Calcite。

**趋势 5：神经符号优化**

- 神经优化 + 符号优化融合。
- 工具：自研 + ML。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：字节跳动 Spark 优化**

- **优化效果**：慢查询减少 70%。
- **架构**：Spark 3.x + AQE + CBO。

**案例 2：阿里 MaxCompute 优化**

- **优化效果**：性能提升 5x。
- **架构**：MaxCompute + 自研优化器。

**案例 3：Netflix Trino 优化**

- **优化效果**：替代 Hive 性能提升 10x。
- **架构**：Trino + CBO + 自定义 Connector。

### 6.2 踩坑与经验

**坑 1：统计信息陈旧**

- **现象**：CBO 选错计划。
- **解决**：定期 ANALYZE。

**坑 2：未启用 AQE**

- **现象**：错过运行时优化。
- **解决**：开启 AQE。

**坑 3：Join 顺序错误**

- **现象**：大表 Join 大表慢。
- **解决**：人工 hint + 广播小表。

**坑 4：数据倾斜**

- **现象**：单 Task 慢。
- **解决**：自适应 Skew Join。

### 6.3 落地路径（0→1, 1→10, 10→100）

**阶段 1：0 → 1（启动期，0-3 个月）**

- 开启 CBO + 收集统计信息。
- 团队：1-2 数据工程师。

**阶段 2：1 → 10（扩展期，3-12 个月）**

- 开启 AQE + 慢查询治理。
- 团队：3-5 + 平台团队。

**阶段 3：10 → 100（规模化期，12-36 个月）**

- AI 驱动优化 + 自治优化。
- 团队：5-10 + 平台团队。

### 6.4 ROI 评估

**评估维度**：

- **慢查询减少**：从 N → 0。
- **性能提升**：从分钟级 → 秒级。
- **资源利用率**：提升 30-50%。
- **AI 友好度**：LLM 自动调优。

**典型 ROI**：

- 字节 Spark：慢查询减少 70%。
- 阿里 MaxCompute：性能提升 5x。
- Netflix Trino：性能提升 10x。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | RBO | CBO | AQE | AI 优化 |
| --- | :---: | :---: | :---: | :---: |
| 性能 | 3 | 5 | 5 | 5 |
| 稳定性 | 5 | 3 | 4 | 3 |
| 自适应 | 1 | 1 | 5 | 5 |
| AI 友好 | 1 | 1 | 2 | 5 |
| 工程复杂度 | 2 | 4 | 4 | 5 |

### 7.2 决策树

```
查询引擎？
├── 传统 / 稳定
│   └── RBO / CBO
├── 运行时优化
│   └── AQE
├── AI 时代
│   └── AI 优化器
└── 自治 / 未来
    └── 自治优化器
```

### 7.3 组合使用

**组合 1：CBO + AQE（标准）**

- 编译期 + 运行时优化。
- 适用：所有现代查询引擎。

**组合 2：AQE + AI**

- 运行时优化 + AI 诊断。
- 适用：AI 时代。

**组合 3：Calcite + 自研**

- 自研查询引擎集成 Calcite。
- 适用：定制化场景。

---

## 8. 面试真题集

# optimizer 面试真题集

> **一句话定位**：Calcite / Velox / 自研优化器。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 2 个原 PDF 子章节、共 10 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §1.6 | 集群性能优化与调优 | 1.6.1, 1.6.2, 1.6.3, 1.6.4, 1.6.5 | 5 | 辅 |
| §7.4 | ⼤规模集群下的性能与可扩展性考量 | 7.4.1, 7.4.2, 7.4.3, 7.4.4, 7.4.5 | 5 | 主 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §1 GC（-XX:+UseG1GC），并针对G1设置合理的MaxGCPauseMillis和⽬标暂

> 本主题涵盖 1 个子节、5 道题。

#### 2.1.6 集群性能优化与调优

> 来源：原 PDF §1.6，收录 5 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §1.6.1 | ★★★☆☆ |
| §1.6.2 | ★★★☆☆ |
| §1.6.3 | ★★★☆☆ |
| §1.6.4 | ★★★☆☆ |
| §1.6.5 | ★★★★☆ |

- **§1.6.1**：对于⼀个超⼤规模（例如万节点级别）的Hadoop集群，为了保障其⻓期稳定和⾼
- **§1.6.2**：请描述在⼤规模集群环境下，如何通过调整HDFS和YARN的配置参数来优化整体的
- **§1.6.3**：请简要说明在⼤规模Hadoop/Spark集群中，你通常会监控哪些关键的性能指标，
- **§1.6.4**：当发现⼀个Spark作业运⾏缓慢时，你会从哪些⽅⾯⼊⼿进⾏诊断和性能调优？
- **§1.6.5**：在⼤规模数据处理中，数据倾斜是⼀个常⻅问题。请阐述数据倾斜的表现、根本原

### 2.2 §7 Hudi/Delta Lake/Iceberg的选型与落地 > 本主题涵盖 1 个子节、5 道题。

#### 2.2.4 ⼤规模集群下的性能与可扩展性考量

> 来源：原 PDF §7.4，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §7.4.1 | ★★★☆☆ |
| §7.4.2 | ★★★☆☆ |
| §7.4.3 | ★★★☆☆ |
| §7.4.4 | ★★★☆☆ |
| §7.4.5 | ★★★★☆ |

- **§7.4.1**：在规划⼀个⽀持PB级数据、万节点并发访问的企业级数据湖时，除了读写性能，你
- **§7.4.2**：请解释数据湖表格式中Time Travel功能的技术原理，并对⽐分析Hudi、Delta Lak
- **§7.4.3**：⾯对每天产⽣海量⼩⽂件的数据湖场景，请详细阐述Hudi、Delta Lake和Iceberg
- **§7.4.4**：请简要说明在⼤规模数据湖架构中，Hudi、Delta Lake和Iceberg这三种表格式各
- **§7.4.5**：在万节点集群的⾼并发写⼊场景下，Hudi、Delta Lake和Iceberg是如何实现ACID

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **性能优化与调优**

## 4 本章小结

> 本面试真题集收录 10 道题，覆盖 2 个原 PDF 主题、2 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
