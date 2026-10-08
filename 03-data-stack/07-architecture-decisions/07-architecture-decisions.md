# 架构决策（Lambda / Kappa / Lakehouse）

> **一句话定位**：在 Lambda、Kappa、Lakehouse、流批一体等架构范式中做出正确的选型决策，是资深数据架构师的核心能力。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**07 架构决策**）。覆盖 **R4 数据全栈协同** 能力领域中「数据架构范式、选型决策框架、Medallion 架构、AI 时代演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| Lambda / Kappa / Lakehouse 三种架构的本质区别？ | §1.1 |
| 为什么 Lambda 架构被批判？什么时候还该用？ | §3.3 |
| Medallion（Bronze/Silver/Gold）怎么落地？ | §3.1 |
| 选型决策框架如何搭建？ | §4.1 |
| 2024-2025 流批一体的最新趋势？ | §5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：

- **Lambda 架构**（Nathan Marz, 2011）：将数据处理分为**批处理层（Batch Layer）+ 速度层（Speed Layer）+ 服务层（Serving Layer）**。批层保证全量准确性，速度层保证实时性，两层合并输出。
- **Kappa 架构**（Jay Kreps, 2014）：简化 Lambda，**只保留流处理层**，用 Kafka 等可重放存储替代批层。
- **Lakehouse 架构**（Databricks, 2020）：融合数据湖 + 数据仓库，让一份数据同时支持 BI + AI。
- **流批一体（Stream-Batch Unified）**：Flink / Spark 等计算引擎统一流批，一份代码、一份存储。

**工程定义**：在数据架构师手里，架构决策是**根据业务需求（实时性 / 一致性 / 成本 / 复杂度）选择合适的架构范式**。核心特征：

- **业务驱动**：从业务需求出发，不是技术驱动。
- **权衡取舍**：每个架构都有优缺点，没有"银弹"。
- **可演进**：架构随业务演进（Lambda → Kappa → Lakehouse）。
- **可治理**：所有架构都需要治理、可观测、可演进。

### 1.2 为什么需要

**业务驱动力**：

- **业务多样性**：不同业务对实时性 / 一致性 / 成本要求不同。
- **技术演进**：Lambda → Kappa → Lakehouse，技术在演进。
- **避免决策失误**：选错架构导致返工（成本百万级）。
- **决策可解释**：架构决策需要可解释、可追溯（ADR）。
- **AI 时代演进**：传统架构无法满足 AI 需求。

**痛点（没有架构决策框架的代价）**：

1. **选错架构**：实时业务用了 Lambda，成本翻倍；全量业务用了 Kappa，延迟高。
2. **架构僵化**：业务变了架构不变，效率下降。
3. **决策无据**：架构师凭经验决策，无法解释。
4. **重复建设**：每条业务线独立选型，浪费资源。
5. **缺乏 ADR**：架构决策没有文档记录。

**AI 时代的新诉求**：

- **AI 原生架构**：AI 应用需要 Lakehouse + 向量库 + LLM。
- **Agent 友好**：架构需支持 Agent 调用（统一 API）。
- **自治决策**：AI 辅助架构决策。

### 1.3 在 AI 时代数据架构中的位置

```
业务需求
  ↓
架构决策（Lambda / Kappa / Lakehouse / 流批一体）
  ↓
技术选型（存储 + 计算 + 查询）
  ↓
落地实施
```

**架构决策是数据栈的"灵魂"**：决定了整个技术栈的方向。

### 1.4 演进历程

**第一阶段：Hadoop 单层（2006-2012）**

- Hadoop + Hive + MR 单一架构。
- T+1 批量处理。

**第二阶段：Lambda 架构（2011-2018）**

- 2011：Nathan Marz 提出 Lambda。
- 2013-2016：Storm + Hadoop Lambda 落地。
- 2017-2018：Flink + Spark Streaming 替代 Storm。

**第三阶段：Kappa 架构（2014-2020）**

- 2014：Jay Kreps 提出 Kappa。
- 2015-2018：Kafka + Flink Kappa 实践。
- 2019-2020：Kafka + Flink + Iceberg 流批一体萌芽。

**第四阶段：Lakehouse 主流（2020-2024）**

- 2020：Databricks Lakehouse 概念。
- 2021-2022：Iceberg / Hudi / Delta 三足鼎立。
- 2023-2024：Lakehouse 成为事实标准。

**第五阶段：AI 原生架构（2024-至今）**

- 2024：Lakehouse + 向量库 + LLM 融合。
- 2024-2025：AI 原生决策（LLM 辅助选型）。
- 2025：自治架构（Self-Driving Architecture）。

**一句话总结**：**架构范式从"Hadoop 单层"→"Lambda 双层"→"Kappa 单层"→"Lakehouse 融合"→"AI 原生"五阶段演进，今天 Lakehouse 是主流，AI 原生是未来。**

---

## 2. 核心原理

### 2.1 关键概念定义

**Lambda 架构**：

- **批处理层（Batch Layer）**：全量数据、历史计算，Hadoop/Spark。
- **速度层（Speed Layer）**：增量数据、实时计算，Storm/Flink。
- **服务层（Serving Layer）**：合并两层输出，Druid/HBase。
- **优缺点**：准确（批）+ 实时（流），但**双链路维护复杂**。

**Kappa 架构**：

- **单一流处理层**：所有数据走流，Kafka + Flink。
- **可重放存储**：Kafka 长期保留，可重新消费。
- **优缺点**：架构简单，但**历史计算能力弱**。

**Lakehouse 架构**：

- **统一存储**：对象存储 + 开放表格式（Iceberg/Hudi/Delta/Paimon）。
- **多种计算**：Spark/Flink/Trino/StarRocks 共享一份数据。
- **优缺点**：灵活 + 性能 + 治理好，但**架构复杂度高**。

**流批一体（Stream-Batch Unified）**：

- **统一引擎**：Flink / Spark 同一份代码同时跑流 + 批。
- **统一存储**：Iceberg / Hudi / Paimon 同时支持流批读写。
- **优缺点**：架构最简，但**对引擎 / 存储有特定要求**。

**Medallion 架构（Bronze / Silver / Gold）**：

- **Bronze（原始）**：原始数据，几乎不处理。
- **Silver（清洗）**：清洗、整合、统一口径。
- **Gold（精化）**：面向应用的精化数据。

**Event Sourcing（事件溯源）**：

- 所有状态用事件流记录，不直接存储状态。
- 通过回放事件重建状态。

**CQRS（Command Query Responsibility Segregation）**：

- 读写分离，写走流，读走专门查询层。
- 与 Kappa / Lakehouse 结合紧密。

### 2.2 数学 / 形式化基础

**Lambda 架构的一致性模型**：

- 批层：最终一致性（T+1 全量准确）。
- 速度层：实时（近似准确）。
- 合并：服务层做合并（基于时间窗口）。

**Kappa 架构的一致性模型**：

- 流层：端到端 Exactly-Once。
- 重放历史：从指定 offset 重新消费。
- 状态重建：从 checkpoint + offset 重启。

**Lakehouse 的一致性模型**：

- 表格式 ACID：Snapshot Isolation。
- 跨引擎：MVCC（多版本并发控制）。

**CAP 定理的工程权衡**：

- Lambda：牺牲 C（一致性），保证 A + P（实时性 + 分区容错）。
- Kappa：保证 C（端到端 EOS）+ A，但牺牲 P 弱。
- Lakehouse：三者兼顾，但工程复杂。

### 2.3 关键算法 / 方法

**1. Lambda 批流合并**：

```python
# 服务层合并批 + 流
def get_view(query):
    batch_result = batch_view.query(query)  # 批层（全量准确）
    stream_result = speed_view.query(query)  # 速度层（实时增量）
    return merge(batch_result, stream_result, window=batch_window)
```

**2. Kappa 状态重建**：

```java
// Flink 从指定 offset 重新消费
StreamExecutionEnvironment env = ...;
env.setStartTime(Instant.parse("2025-01-01T00:00:00Z"));  // 重置启动时间
env.fromSource(kafkaSource, ...).process(...).sinkTo(...);
```

**3. Lakehouse 跨引擎查询**：

```sql
-- Iceberg 表可被多个引擎查询
-- Spark
SELECT * FROM iceberg.orders;

-- Trino
SELECT * FROM iceberg.iceberg.orders;

-- StarRocks
SELECT * FROM orders_iceberg;
```

**4. 流批一体（Paimon + Flink）**：

```java
// 同一份代码同时跑流批
TableEnvironment tEnv = ...;

// 批模式
Table batchResult = tEnv.from("paimon.orders")
    .filter($("dt").between("2025-01-01", "2025-01-31"))
    .select($("region"), $("amount").sum());

// 流模式
tEnv.executeSql("""
    INSERT INTO paimon_orders
    SELECT * FROM kafka_orders
""");
```

**5. 架构决策记录（ADR）**：

```markdown
# ADR-001: 选择 Lakehouse 而非 Lambda

## 状态
- Accepted

## 背景
- 业务：实时数仓 + 历史分析 + AI 训练

## 决策
- 采用 Lakehouse 架构（Iceberg + Spark/Flink + StarRocks）

## 后果
- 优点：一份数据多引擎、ACID、性能好
- 缺点：架构复杂度高、需要专业团队

## 备选方案
- Lambda：双链路维护成本高
- Kappa：历史计算能力弱
```

### 2.4 与相邻概念的关系

**Lambda vs Kappa**：

- Lambda：批 + 流并行，双链路。
- Kappa：只流，不行就重放。
- **Kappa 简化了 Lambda，但增加了对流引擎的依赖**。

**Lakehouse vs Lambda/Kappa**：

- Lakehouse = 融合方案：存储层支持流批 + 计算层支持流批。
- Lambda/Kappa = 计算范式：Lambda 强调双链路、Kappa 强调单一链路。

**Lakehouse vs 数据仓库**：

- 数据仓库：结构化、强治理、高成本。
- Lakehouse：开放、灵活、低成本。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Lambda 架构（经典）**

- 批层 + 速度层 + 服务层。
- 适用：T+1 全量 + 实时增量（金融、对账）。
- 典型栈：Hadoop + Spark + Kafka + Flink + Druid。

**模式 2：Kappa 架构（简化）**

- 单一流层。
- 适用：纯实时业务（日志、监控）。
- 典型栈：Kafka + Flink。

**模式 3：Lakehouse 架构（融合）**

- 统一存储 + 多种计算。
- 适用：现代数据栈。
- 典型栈：OSS/S3 + Iceberg/Hudi/Paimon + Spark/Flink/Trino + StarRocks/Doris。

**模式 4：流批一体（Flink + Paimon）**

- 统一计算 + 统一存储。
- 适用：实时数仓。
- 典型栈：Kafka + Flink + Paimon + StarRocks。

**模式 5：Medallion 架构（Bronze/Silver/Gold）**

- 三层数据。
- 适用：所有数据湖项目。

**模式 6：Event Sourcing + CQRS**

- 事件溯源 + 读写分离。
- 适用：审计严格场景（金融、医疗）。

**模式 7：AI 原生架构（Lakehouse + 向量库 + LLM）**

- 数据栈 + AI 栈融合。
- 适用：AI 时代。

**模式 8：自治架构（Self-Driving）**

- AI 驱动的自动决策。
- 适用：未来。

### 3.2 适用场景决策表

| 业务场景 | 推荐架构 | 典型技术栈 |
| --- | --- | --- |
| T+1 报表 + 实时监控 | Lambda | Hadoop + Spark + Kafka + Flink |
| 纯实时（日志、监控） | Kappa | Kafka + Flink |
| 现代数据栈（BI + AI） | Lakehouse | Iceberg/Paimon + Spark/Flink + Trino |
| 实时数仓 | 流批一体 | Kafka + Flink + Paimon + StarRocks |
| 金融审计 | Event Sourcing + Lambda | Kafka + Flink + Iceberg |
| AI 平台 | AI 原生架构 | Lakehouse + 向量库 + LLM |
| 多模态 | Lakehouse + LanceDB | Iceberg V3 + LanceDB |
| 跨国合规 | Lakehouse + 联邦 | 多云 Iceberg + Unity Catalog |

### 3.3 反模式与陷阱

**反模式 1：盲目追求 Lambda**

- 业务其实只需实时，非要 Lambda 双链路。
- **正确**：业务驱动选型。

**反模式 2：盲目追求 Kappa**

- 业务有大量历史计算需求，强上 Kappa 重放慢。
- **正确**：Lambda / Lakehouse 更适合。

**反模式 3：架构僵化**

- 业务变了架构不变。
- **正确**：架构随业务演进（ADR + 定期 review）。

**反模式 4：决策无据**

- 架构师凭经验决策，无法解释。
- **正确**：ADR + 决策矩阵。

**反模式 5：忽视治理**

- 选了最潮的架构但无治理。
- **正确**：架构 + 治理（血缘 / 质量 / 安全）一起做。

**反模式 6：缺乏可观测**

- 架构跑起来但出问题不知道。
- **正确**：监控告警 + 全链路追踪。

---

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

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：AI 驱动的架构决策**

- LLM 读取业务需求 → 架构推荐。
- 工具：自研 + LLM。
- **价值**：降低决策门槛。

**演进方向 2：AI 原生架构**

- Lakehouse + 向量库 + LLM 融合。
- 工具：Databricks Data Intelligence Platform、Snowflake Cortex。

**演进方向 3：自治架构（Self-Driving Architecture）**

- AI 自动监控、自动调优、自动演进。
- 工具：Snowflake Auto-Tuning、Databricks Auto-ML。

**演进方向 4：Agent 触达的架构**

- Agent 通过统一 API 调用架构。
- 工具：MCP（Model Context Protocol）。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**架构决策知识库（RAG）**：

- 历史 ADR + 决策矩阵 → 向量化 → RAG 检索。
- 工具：LanceDB + LangChain。

**架构依赖图（GraphRAG）**：

- 架构组件关系 → 知识图谱 → GraphRAG 查询。
- 工具：Neo4j + LLM。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **Lakehouse 论文（CIDR 2023）**：融合数据湖 + 数据仓库。
- **Paimon 论文（VLDB 2024）**：流批融合表格式。
- **Flink 2.0 路线图（2024）**：流批一体引擎进化。

**工业进展**：

- **Databricks Data Intelligence Platform（2024）**：AI 原生 Lakehouse。
- **Snowflake Cortex（2024）**：LLM + 向量 + 数据栈融合。
- **Apache Paimon 1.1（2024）**：流批融合成熟。

### 5.4 未来 3-5 年趋势

**趋势 1：AI 原生架构主流**

- Lakehouse + AI 默认集成。
- LLM、向量检索成为第一公民。

**趋势 2：自治架构**

- AI 自动决策、自动调优。
- 自治数据栈。

**趋势 3：流批一体成熟**

- Paimon / Iceberg 流批读写成熟。
- Lambda 架构逐渐退出。

**趋势 4：联邦架构**

- 跨云、跨国、跨厂商统一治理。
- 联邦 Lakehouse。

**趋势 5：架构即代码**

- 架构定义用代码管理（Terraform / Pulumi）。
- AI 辅助架构治理。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：字节跳动 ByteLake（Lakehouse 落地）**

- **数据规模**：PB 级。
- **架构**：OSS + Iceberg + Spark/Flink + StarRocks/ClickHouse。
- **效果**：替代 Lambda，成本降低 40%，性能提升 10x。

**案例 2：Netflix Keystone（流批一体）**

- **数据规模**：EB 级。
- **架构**：Kafka + Flink + Iceberg + Pinot。
- **效果**：实时 + 历史统一，支撑 AB 测试。

**案例 3：阿里 MaxCompute + Hologres（实时数仓）**

- **数据规模**：EB 级。
- **架构**：MaxCompute（离线）+ Hologres（实时）。
- **效果**：流批融合，支撑双 11。

### 6.2 踩坑与经验

**坑 1：架构僵化**

- **现象**：选了 Lambda 后业务变了，架构不变。
- **解决**：架构随业务演进（ADR + 季度 Review）。

**坑 2：决策无据**

- **现象**：架构师凭经验决策，无法解释。
- **解决**：ADR + 决策矩阵。

**坑 3：架构过度设计**

- **现象**：选了最潮的架构但实际用不到。
- **解决**：业务驱动选型，避免过度。

**坑 4：缺乏治理**

- **现象**：架构跑起来但数据无治理。
- **解决**：架构 + 治理一起做。

**坑 5：团队能力跟不上**

- **现象**：选了 Lakehouse 但团队不会用。
- **解决**：培训 + POC + 灰度。

### 6.3 落地路径（0→1, 1→10, 10→100）

**阶段 1：0 → 1（启动期，0-6 个月）**

- 选型 Lambda 或 Kappa（业务相对简单）。
- 团队：2-5 数据工程师。

**阶段 2：1 → 10（扩展期，6-18 个月）**

- 迁移到 Lakehouse 或流批一体。
- 团队：5-15 + 架构师。

**阶段 3：10 → 100（规模化期，18-36 个月）**

- AI 原生架构。
- 团队：20-50 + 治理团队。

### 6.4 ROI 评估

**评估维度**：

- **性能提升**：Lakehouse 比 Lambda 性能提升 3-10x。
- **成本降低**：流批一体成本降低 40%。
- **业务上线速度**：Lakehouse 比 Lambda 快 3-5x。
- **AI 友好度**：Lakehouse 比 Lambda 强。

**典型 ROI**：

- 字节 ByteLake：成本降低 40%，性能提升 10x。
- Netflix Keystone：实时性提升 10x。
- 阿里 MaxCompute + Hologres：支撑双 11 实时大屏。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Lambda | Kappa | Lakehouse | 流批一体 |
| --- | :---: | :---: | :---: | :---: |
| 实时性 | 4 | 5 | 5 | 5 |
| 一致性 | 5 | 4 | 5 | 5 |
| 成本 | 3 | 5 | 5 | 4 |
| 复杂度 | 3 | 4 | 4 | 5 |
| AI 友好 | 2 | 3 | 5 | 4 |
| 成熟度 | 5 | 4 | 4 | 4 |

### 7.2 决策树

```
业务需求？
├── 强一致性 + 实时（金融）
│   └── Lambda 或 Lakehouse
├── 纯实时 + 重放（日志）
│   └── Kappa
├── 现代数据栈 + AI
│   └── Lakehouse
├── 实时数仓 + 流批融合
│   └── 流批一体（Flink + Paimon）
└── AI 原生
    └── Lakehouse + 向量库 + LLM
```

### 7.3 组合使用

**组合 1：Lambda → Lakehouse 迁移**

- 旧 Lambda → 新 Lakehouse。
- 适用：架构演进。

**组合 2：Lakehouse + Kappa**

- Lakehouse 存全量，Kappa 处理实时。
- 适用：混合业务。

**组合 3：Lakehouse + 流批一体**

- Lakehouse 存储 + Flink/Paimon 计算。
- 适用：现代数据栈。

**组合 4：AI 原生架构**

- Lakehouse + 向量库 + LLM + Agent。
- 适用：AI 时代。

---

## 8. 面试真题集

# architecture-decisions 面试真题集

> **一句话定位**：什么时候必须分离，什么时候必须一体。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 4 个原 PDF 子章节、共 22 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §3.1 | 基础组件与参数认知 | 3.1.1 ~ 3.1.6（共 6） | 6 | 主 |
| §9.6 | 调度器与数据平台架构集成 | 9.6.1 ~ 9.6.7（共 7） | 7 | 辅 |
| §12.1 | 计算存储分离基础 | 12.1.1, 12.1.2, 12.1.3, 12.1.4 | 4 | 主 |
| §12.3 | 弹性伸缩机制 | 12.3.1, 12.3.2, 12.3.3, 12.3.4, 12.3.5 | 5 | 辅 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §3 存储与资源管理的性能优化 > 本主题涵盖 1 个子节、6 道题。

#### 2.1.1 基础组件与参数认知

> 来源：原 PDF §3.1，收录 6 道题。

| 题号 | 难度 |
| --- | :---: |
| §3.1.1 | ★★★☆☆ |
| §3.1.2 | ★★★☆☆ |
| §3.1.3 | ★★★☆☆ |
| §3.1.4 | ★★★☆☆ |
| §3.1.5 | ★★★★☆ |
| §3.1.6 | ★★★★☆ |

- **§3.1.1**：请阐述HDFS Federation的设计初衷，它是如何解决单⼀NameNode架构的扩展性
- **§3.1.2**：在YARN中，调度器（Scheduler）和应⽤程序管理器（ApplicationMaster）是如
- **§3.1.3**：当⾯对⼀个万节点规模的Hadoop集群时，为了优化HDFS写⼊性能和YARN的资源
- **§3.1.4**：在YARN架构中，ResourceManager和NodeManager分别承担什么⻆⾊？请描述
- **§3.1.5**：请解释HDFS的副本放置策略，并说明在典型的跨机架部署中，它是如何保证数据
- **§3.1.6**：请简要说明HDFS中NameNode和DataNode各⾃的核⼼职责是什么？

### 2.2 §9 YARN Capacity/Fair Scheduler的深度配置 > 本主题涵盖 1 个子节、7 道题。

#### 2.2.6 调度器与数据平台架构集成

> 来源：原 PDF §9.6，收录 7 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §9.6.1 | ★★★☆☆ |
| §9.6.2 | ★★★☆☆ |
| §9.6.3 | ★★★☆☆ |
| §9.6.4 | ★★★☆☆ |
| §9.6.5 | ★★★★☆ |
| §9.6.6 | ★★★★☆ |
| §9.6.7 | ★★★★★ |

- **§9.6.1**：假设⼀个关键业务报表因资源竞争⽽延迟，但同时集群整体资源利⽤率却不⾼，请
- **§9.6.2**：在规划⼀个万节点级别的Hadoop/Spark集群时，为了应对数据湖中数据量和⽤户
- **§9.6.3**：请简要说明在⼤数据平台中，YARN Capacity Scheduler和Fair Scheduler的主要
- **§9.6.4**：请阐述如何将YARN的资源调度与数据湖的元数据管理、数据⽣命周期策略以及数
- **§9.6.5**：当数据平台同时运⾏着⾼优先级的实时数据分析任务和⼤量的后台数据挖掘任务
- **§9.6.6**：请描述在配置YARN Capacity Scheduler的多级队列时，如何设计队列层级和资源
- **§9.6.7**：在⼀个采⽤Lambda架构的数据平台中，如何通过YARN调度器来分别保障批处理

### 2.3 §12 计算存储分离、冷热数据分层与弹性伸缩 > 本主题涵盖 2 个子节、9 道题。

#### 2.3.1 计算存储分离基础

> 来源：原 PDF §12.1，收录 4 道题。

| 题号 | 难度 |
| --- | :---: |
| §12.1.1 | ★★★☆☆ |
| §12.1.2 | ★★★☆☆ |
| §12.1.3 | ★★★☆☆ |
| §12.1.4 | ★★★☆☆ |

- **§12.1.1**：在计算存储分离的架构下，如何设计数据本地性策略以平衡⽹络开销与计算性能？
- **§12.1.2**：在规划⼀个万节点规模的集群时，采⽤计算存储分离架构可以带来哪些核⼼优
- **§12.1.3**：请描述在实现计算存储分离架构的过程中，可能会遇到哪些典型的技术挑战或瓶
- **§12.1.4**：请解释在 Hadoop/Spark 集群中，计算存储分离的基本概念是什么，并说明它与

#### 2.3.3 弹性伸缩机制

> 来源：原 PDF §12.3，收录 5 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §12.3.1 | ★★★☆☆ |
| §12.3.2 | ★★★☆☆ |
| §12.3.3 | ★★★☆☆ |
| §12.3.4 | ★★★☆☆ |
| §12.3.5 | ★★★★☆ |

- **§12.3.1**：假设你负责的⼤数据平台需要⽀持突发的、⾼并发的计算任务，请详细说明你会
- **§12.3.2**：请分析在Lambda架构中，批处理层和速度层分别应如何应⽤弹性伸缩机制，并讨
- **§12.3.3**：请解释什么是弹性伸缩机制，并说明它在⼤数据平台资源管理中的主要作⽤是什
- **§12.3.4**：请结合数据湖的冷热数据分层场景，阐述如何设计弹性伸缩策略以优化集群成本
- **§12.3.5**：请描述在万节点规模的Hadoop/Spark集群中，实现弹性伸缩通常需要考虑哪些

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **架构演进与未来趋势**
- **湖仓与存储架构**
- **资源调度与多租户隔离**

## 4 本章小结

> 本面试真题集收录 22 道题，覆盖 3 个原 PDF 主题、4 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
