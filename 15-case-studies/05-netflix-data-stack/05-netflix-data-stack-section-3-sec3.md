> 本文件是 **05-netflix-data-stack.md** 的子文件（§3. 架构演进）。完整章节请回到 [index](05-netflix-data-stack.md)。

## 3. 架构演进

### 3.1 V1.0：传统数仓（2007–2015）

**形态**：

```
[Oracle / MySQL] → [Hadoop + Hive] → [EMR] → [Tableau / 自研 BI]
```

**问题**：

- Hive 表格式问题严重（ACID、Schema Evolution）。
- S3 上数据没有事务保证。
- Spark 1.x 性能不佳。

**教训**：Netflix 在传统数仓阶段吃尽 Hive 表格式的亏。

### 3.2 V2.0：S3 + Iceberg 立项（2015–2018）

**关键事件**：

- 2015：Netflix 全面拥抱 AWS S3 作为存储。
- 2016：开始探索表格式选型（Hive / Parquet / 自研）。
- 2017：Ryan Blue 立项 Iceberg。
- 2018：Apache Iceberg 开源。

**Iceberg 关键创新**：

- **ACID 事务**：基于 Snapshot 隔离。
- **Schema Evolution**：灵活增减字段。
- **Time Travel**：可回溯到历史版本。
- **分区演进**：可动态调整分区。
- **隐藏分区（Hidden Partition）**：自动按时间查询优化。

### 3.3 V3.0：Iceberg + Spark + Flink（2018–2021）

**关键事件**：

- 2018：Iceberg 0.1.0 发布。
- 2019：Netflix 内部开始大规模使用 Iceberg。
- 2020：Netflix 内部 100% 数据栈基于 Iceberg。
- 2021：Iceberg 1.0 发布，Netflix 持续贡献。

**架构**：

```
[Kafka] → [Flink] → [Iceberg] → [Spark / Trino] → [BI / ML]
   (流)     (实时)   (表格式)     (查询)            (消费)
```

**关键能力**：

- **流批一体**：Kafka → Flink → Iceberg，同一份代码跑批 + 流。
- **ACID 事务**：保证数据一致性。
- **Time Travel**：可回溯历史版本。
- **Schema Evolution**：可灵活变更 Schema。

### 3.4 V4.0：Maestro + Data Mesh（2021–2024）

**关键事件**：

- 2022 年前后：Netflix 自研并开源 Maestro（工作流调度系统；开源仓库地址本书未给出）；公开材料的年份口径不一——2022 年之说见 Netflix 工程博客，2021 年开源之说本书未核到出处，不锁定单一值。
- 2022：Netflix 内部推进 Data Mesh 实践。
- 2023：Iceberg 1.3 发布，REST Catalog 标准化。
- 2024：Iceberg 2.0 发布，向量化读取优化。

**Maestro 核心能力**：

- **统一 DAG**：所有工作流用同一套 DAG 模型描述。
- **多触发方式**：时间触发 / 事件触发 / API 触发。
- **可视化界面**：所有工作流可视化编辑。
- **回填支持**：一键回填历史时间范围。

**Data Mesh 实践**：

- **数据所有权分散**：每个业务团队拥有自己的数据。
- **数据产品化**：每个数据集都是"数据产品"，有 Owner、文档、SLA。
- **联邦治理**：跨团队数据治理通过"联邦委员会"。
- **自助平台**：基础设施平台化，业务团队自助消费。

### 3.5 V5.0：AI Native 数据栈（2023–2025）

**关键事件**：

- 2023：Netflix 内部广泛使用大模型（OpenAI / Claude）。
- 2024：Netflix 发布内部 GenAI 应用（内容理解、营销文案、客服）。
- 2025：Netflix 探索"AI 原生数据栈"。

**AI Native 演进**：

- **数据 → 知识**：结构化数据 + LLM 转化为知识。
- **指标 → Agent**：指标平台成为 Agent 工具集。
- **Data Mesh → AI Mesh**：数据 + 模型 + 智能体的联邦治理。

---
