> 本文件是 **06-uber-data-architecture.md** 的子文件（§3. 架构演进）。完整章节请回到 [index](06-uber-data-architecture.md)。

## 3. 架构演进

### 3.1 V1.0：传统数据库 + Hadoop（2009–2013）

**形态**：

```
[MySQL / MongoDB] → [Hadoop + Hive] → [Tableau]
```

**问题**：

- MySQL 单库容量上限。
- Hive 表格式问题。
- 没有统一的实时计算。

### 3.2 V2.0：Schemaless + Cassandra（2013–2017）

**关键事件**：

- 2013：Schemaless 立项（基于 MySQL）。
- 2014：Cassandra 大规模使用。
- 2015：实时调度平台 V1。

**Schemaless 核心**：

- 基于 MySQL 的水平扩展方案。
- 解决单库容量问题。
- **被 Uber 多个团队使用**。

**Cassandra 核心**：

- 解决"高写入吞吐"问题。
- 用于司机位置、乘客请求等场景。

### 3.3 V3.0：Apache Hudi + Docstore（2016–2020）

**关键事件**：

- 2016：Hoodie（后来的 Hudi）在 Uber 立项。
- 2017：Michelangelo ML 平台上线。
- 2018：实时数仓 V1。
- 2019：Docstore 立项。
- 2020：Hudi 进入 Apache 孵化。

**Hudi 核心**：

- **Update / Delete 支持**：基于 Copy-on-Write / Merge-on-Read。
- **ACID 事务**：保证数据一致性。
- **Time Travel**：可回溯历史版本。
- **CDC（Change Data Capture）**：支持 MySQL / Cassandra 的 CDC。

### 3.4 V4.0：Hudi + 实时数仓 + AI（2020–2024）

**关键事件**：

- 2020：实时数仓 V2 全面铺开。
- 2021：Hudi 0.6 发布。
- 2022：Data Mesh 内部讨论。
- 2023：Hudi 1.0 发布，GenAI 应用。
- 2024：Uber AI Platform + 大模型。

**架构**：

```
[业务系统] → [Kafka] → [Flink] → [Hudi] → [Spark / Trino] → [BI / ML]
   (事件)    (消息)    (实时)   (表格式)   (查询)          (消费)
```

### 3.5 V5.0：AI Native 数据栈（2023–2025）

**关键事件**：

- 2023：Uber 内部广泛使用大模型（OpenAI / Claude / 开源模型）。
- 2024：Uber AI Platform 发布，整合 ML + LLM。
- 2025：实时 AI 数据栈（实时特征 + 大模型）。

---
