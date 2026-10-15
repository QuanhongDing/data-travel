> 本文件是 **14-optimizer.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](14-optimizer.md)。

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
