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

- [§3. 设计模式与范式](07-architecture-decisions-section-3-sec3.md)
- [§4. 工程实现](07-architecture-decisions-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](07-architecture-decisions-section-5-ai.md)
- [§6. 落地实践](07-architecture-decisions-section-6-sec6.md)
- [§7. 与其他方法对比](07-architecture-decisions-section-7-sec7.md)
- [§8. 面试真题集](07-architecture-decisions-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](07-architecture-decisions-section-3-sec3.md)
- [§4. 工程实现](07-architecture-decisions-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](07-architecture-decisions-section-5-ai.md)
- [§6. 落地实践](07-architecture-decisions-section-6-sec6.md)
- [§7. 与其他方法对比](07-architecture-decisions-section-7-sec7.md)
- [§8. 面试真题集](07-architecture-decisions-section-8-sec8.md)

---
