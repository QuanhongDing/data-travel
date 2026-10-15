> 本文件是 **07-airbnb-data-architecture.md** 的子文件（§3. 架构演进）。完整章节请回到 [index](07-airbnb-data-architecture.md)。

## 3. 架构演进

### 3.1 V1.0：传统数仓（2008–2013）

**形态**：

```
[MySQL] → [Hadoop + Hive] → [Tableau / Excel]
```

**问题**：

- 数据孤岛。
- 指标泛滥。
- 数据质量差。

### 3.2 V2.0：Airflow + Minerva 立项（2013–2016）

**关键事件**：

- 2014：Airflow 立项，2015 开源。
- 2015：Minerva 立项。
- 2016：Dataportal V1。

**Airflow 核心**：

- **Python 优先**：用 Python 写 DAG。
- **可扩展**：Operator 机制，支持各种数据源。
- **可视化**：Web UI 可视化 DAG。

**Minerva 立项背景**：

- 2015 年 Airbnb 内部指标泛滥。
- 需要"指标集中管理"。

### 3.3 V3.0：Minerva + Dataportal 全面铺开（2016–2020）

**关键事件**：

- 2016：Minerva V1 + Dataportal V1。
- 2018：Minerva V2 + Dataportal V2。
- 2019：Minerva 全面铺开。
- 2020：Dataportal 成为元数据核心。

**架构**：

```
[源数据] → [Airflow] → [Hive / Spark] → [Hive 表] → [Minerva 指标] → [BI]
             (调度)      (计算)          (存储)       (定义)          (消费)
```

### 3.4 V4.0：实时数仓 + ML Platform（2020–2024）

**关键事件**：

- 2020：实时数仓 V1（Kafka + Spark Streaming + Hive）。
- 2021：ML Platform V3（Bighead）。
- 2022：实时数仓 V2（Kafka + Flink + Iceberg）。
- 2023：数据质量平台 + GenAI 应用。
- 2024：AI Native 数据栈。

### 3.5 V5.0：AI Native（2023–2025）

**关键事件**：

- 2023：GenAI 应用（基于 OpenAI / Claude）。
- 2024：AI Native 数据栈。
- 2025：实时 AI + Agent 化数据。

---
