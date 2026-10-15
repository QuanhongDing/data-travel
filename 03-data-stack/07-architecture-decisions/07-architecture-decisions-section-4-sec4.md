> 本文件是 **07-architecture-decisions.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](07-architecture-decisions.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务需求分析（2-4 周）**

- 实时性要求？
- 数据量？
- 一致性要求？
- AI 需求？
- 成本预算？

**Step 2：架构选型（1-2 周）**

- 用决策矩阵评估。
- 输出 ADR。

**Step 3：技术选型（2-4 周）**

- 存储 + 计算 + 查询。
- POC 验证。

**Step 4：架构落地（4-12 周）**

- 分阶段实施。
- 灰度上线。

**Step 5：治理 + 监控（持续）**

- 血缘 / 质量 / 安全。
- 监控告警。

**Step 6：定期 Review（季度）**

- 架构是否还适配业务？
- 需要演进吗？

### 4.2 关键技术点

**1. 决策矩阵**

```python
# 架构决策矩阵
def select_architecture(requirements):
    score = {
        'Lambda': {'real_time': 4, 'consistency': 5, 'cost': 3, 'complexity': 3},
        'Kappa': {'real_time': 5, 'consistency': 4, 'cost': 5, 'complexity': 4},
        'Lakehouse': {'real_time': 5, 'consistency': 5, 'cost': 5, 'complexity': 4},
        'Stream-Batch-Unified': {'real_time': 5, 'consistency': 5, 'cost': 4, 'complexity': 5},
    }
    
    # 按业务需求加权
    weights = {
        'real_time': 0.4 if requirements.real_time_critical else 0.2,
        'consistency': 0.3,
        'cost': 0.2,
        'complexity': 0.1
    }
    
    best = max(score, key=lambda k: sum(score[k][d] * weights[d] for d in weights))
    return best
```

**2. Medallion 架构落地**

```sql
-- Bronze：原始数据
CREATE TABLE bronze.orders (...);

-- Silver：清洗整合
CREATE TABLE silver.orders AS
SELECT
  order_id, user_id, amount, order_time,
  -- 维度填充
  COALESCE(user_dim.user_name, 'unknown') AS user_name
FROM bronze.orders
LEFT JOIN silver.user_dim ON ...;

-- Gold：精化聚合
CREATE TABLE gold.user_daily_orders AS
SELECT
  user_id, dt,
  SUM(amount) AS gmv,
  COUNT(order_id) AS orders
FROM silver.orders
GROUP BY user_id, dt;
```

**3. 流批一体（Flink + Paimon）**

```java
// 同一份代码同时跑流批
tEnv.executeSql("""
    INSERT INTO paimon_orders
    SELECT * FROM kafka_orders  -- 流模式
""");

// 批模式（历史回放）
Table batch = tEnv.from("kafka_orders")
    .filter($("ts").between("2025-01-01", "2025-01-31"));
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**Lambda 工具**：

- 批层：Hadoop / Hive / Spark。
- 流层：Kafka / Flink / Spark Streaming。
- 服务层：Druid / HBase / Pinot。

**Kappa 工具**：

- 存储：Kafka + Tiered Storage / Pulsar。
- 计算：Flink / Kafka Streams。

**Lakehouse 工具（2024-2025）**：

- 存储：Iceberg / Hudi / Delta / Paimon。
- 计算：Spark / Flink / Trino。
- 查询：StarRocks / Doris / ClickHouse。
- Catalog：Hive Metastore / Glue / Polaris / Unity Catalog。

**流批一体工具**：

- Flink + Paimon / Iceberg / Hudi。
- Spark Structured Streaming + Delta / Iceberg。

**决策工具**：

- ADR 模板（Git + Markdown）。
- 决策矩阵（Python + 评分模型）。
- AI 辅助决策（LLM）。

### 4.4 代码 / 示例

**示例 1：架构决策矩阵**

```python
# decision_matrix.py
import pandas as pd

def architecture_decision(requirements):
    architectures = {
        'Lambda': {
            'real_time': 4,
            'consistency': 5,
            'cost': 3,
            'complexity': 3,
            'ai_friendly': 2,
        },
        'Kappa': {
            'real_time': 5,
            'consistency': 4,
            'cost': 5,
            'complexity': 4,
            'ai_friendly': 3,
        },
        'Lakehouse': {
            'real_time': 5,
            'consistency': 5,
            'cost': 5,
            'complexity': 4,
            'ai_friendly': 5,
        },
        'Stream-Batch-Unified': {
            'real_time': 5,
            'consistency': 5,
            'cost': 4,
            'complexity': 5,
            'ai_friendly': 4,
        },
    }
    
    df = pd.DataFrame(architectures).T
    weights = {
        'real_time': requirements.get('real_time_weight', 0.3),
        'consistency': requirements.get('consistency_weight', 0.3),
        'cost': requirements.get('cost_weight', 0.2),
        'complexity': requirements.get('complexity_weight', 0.1),
        'ai_friendly': requirements.get('ai_friendly_weight', 0.1),
    }
    
    df['score'] = df.apply(lambda r: sum(r[d] * weights[d] for d in weights), axis=1)
    return df.sort_values('score', ascending=False)

print(architecture_decision({'real_time_weight': 0.5, 'ai_friendly_weight': 0.2}))
```

**示例 2：Lakehouse 流批一体（Paimon）**

```java
// Flink + Paimon 流批一体
TableEnvironment tEnv = TableEnvironment.create(EnvironmentSettings.inStreamingMode());

// 1. 定义 Kafka 源
tEnv.executeSql("""
    CREATE TABLE kafka_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      ts TIMESTAMP(3)
    ) WITH (
      'connector' = 'kafka',
      'topic' = 'orders',
      'format' = 'json'
    )
""");

// 2. 定义 Paimon 表（支持流批读写）
tEnv.executeSql("""
    CREATE TABLE paimon_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      ts TIMESTAMP(3),
      PRIMARY KEY (order_id) NOT ENFORCED
    ) WITH (
      'connector' = 'paimon',
      'path' = 's3://lake/paimon/orders'
    )
""");

// 3. 流模式（实时入湖）
tEnv.executeSql("INSERT INTO paimon_orders SELECT * FROM kafka_orders");

// 4. 批模式（历史查询，通过 Spark）
spark.read.format("paimon").load("s3://lake/paimon/orders").show();
```

**示例 3：ADR 模板**

```markdown
# ADR-001: 选择 Lakehouse 而非 Lambda

**状态**: Accepted
**日期**: 2025-01-15
**决策者**: 数据架构组

## 背景
- 业务需要：实时数仓 + 历史分析 + AI 训练
- 数据规模：PB 级
- 团队规模：20+ 数据工程师

## 决策
- 采用 Lakehouse 架构
- 存储：OSS + Iceberg + Paimon
- 计算：Spark + Flink
- 查询：StarRocks + Trino
- 治理：Unity Catalog

## 备选方案

### 选项 A: Lambda 架构
- 优点：成熟、稳定
- 缺点：双链路维护成本高、不支持 AI 训练

### 选项 B: Kappa 架构
- 优点：架构简单
- 缺点：历史计算能力弱、不适合 PB 级

### 选项 C: Lakehouse 架构（推荐）
- 优点：一份数据多引擎、ACID、AI 友好
- 缺点：架构复杂度高、需要专业团队

## 后果
- 优点：性能 + 灵活性 + AI 友好
- 缺点：需要培训团队
- 风险：Paimon 生态还在演进

## 演进路径
- Q1: POC + 团队培训
- Q2: 核心业务上线
- Q3: 全业务迁移
- Q4: 优化 + AI 集成
```

---
