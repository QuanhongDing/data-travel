> 本文件是 **05-netflix-data-stack.md** 的子文件（§4. 关键决策）。完整章节请回到 [index](05-netflix-data-stack.md)。

## 4. 关键决策

### 4.1 决策 1：为什么 Iceberg 而不是 Hive / Delta Lake？

#### 4.1.1 决策路径

- **方案 A：Hive 表格式**：成熟但有严重问题。
- **方案 B：Delta Lake**：Databricks 2019 开源，基于 Spark 生态。
- **方案 C（最终选择）：Iceberg**：Netflix 自研，2018 开源。

#### 4.1.2 关键 Trade-off

| 维度 | Hive | Delta Lake | Iceberg |
| --- | --- | --- | --- |
| ACID | 无 | 有 | 有 |
| Schema Evolution | 弱 | 有 | 强 |
| Time Travel | 无 | 有 | 有 |
| 隐藏分区 | 无 | 无 | 有 |
| 流批一体 | 弱 | 中 | 强 |
| 引擎支持 | Hive / Spark | Spark 为主 | Spark / Flink / Trino 多引擎 |
| 社区治理 | Apache | Databricks 主控 | Apache 开放 |

**决策**：Iceberg。

**理由**：

1. **多引擎支持**：Netflix 数据栈同时使用 Spark / Flink / Trino，Delta Lake 偏 Spark 生态，Iceberg 多引擎。
2. **开放治理**：Netflix 不想被 Databricks 锁死，Apache 开放治理更合适。
3. **隐藏分区**：Netflix 时间序列数据量大，隐藏分区优化查询。
4. **流批一体**：Iceberg + Flink 流批一体成熟。

#### 4.1.3 验证

Iceberg 2024 年成为 Apache 顶级项目，Databricks / Snowflake / AWS / Google Cloud 等大厂都集成 Iceberg。

### 4.2 决策 2：Keystone 实时管道

#### 4.2.1 Keystone 定位

Netflix Keystone 是基于 Kafka + Flink 的实时数据管道，2017 年开始大规模使用。

#### 4.2.2 架构

```
[应用] → [Kafka] → [Flink] → [Iceberg] → [下游服务]
         (持久化) (实时计算) (表格式) (消费)
```

#### 4.2.3 关键能力

- **Exactly-Once 语义**：保证数据不丢不重。
- **Schema Registry**：基于 Apache Avro，统一 Schema 管理。
- **多租户隔离**：支持多团队共享 Kafka 集群。
- **自动监控**：自动监控 + 告警。

### 4.3 决策 3：Maestro 调度系统

#### 4.3.1 Maestro 核心

Maestro 是 Netflix 2021 年开源的工作流调度系统，对标 Apache Airflow。

#### 4.3.2 关键能力

- **统一 DAG 模型**：所有工作流用统一 DAG 描述。
- **多触发方式**：
  - 时间触发（如每天凌晨 2 点跑）。
  - 事件触发（如 Kafka 消息触发）。
  - API 触发（如 API 调用触发）。
- **可视化编辑**：拖拽即可完成 DAG。
- **回填**：一键回填历史时间范围。
- **SLA 管理**：每个工作流可定义 SLA。

#### 4.3.3 与 Airflow 对比

| 维度 | Airflow | Maestro |
| --- | --- | --- |
| DAG 模型 | 灵活但复杂 | 统一 |
| 触发方式 | 时间为主 | 时间 / 事件 / API |
| 可视化 | 一般 | 强 |
| Netflix 适配 | 弱 | 强 |
| 社区 | Apache 大 | Netflix 自有 |

### 4.4 决策 4：Spark / Flink 集成

#### 4.4.1 Spark 优化

Netflix 对 Spark 做了大量优化（贡献给上游）：

- **Dynamic Allocation**：基于负载动态扩缩容。
- **Adaptive Query Execution（AQE）**：运行时自适应优化。
- **Off-Heap Memory**：减少 GC 压力。
- **S3 优化**：针对 S3 的多线程读取。

#### 4.4.2 Flink 优化

Netflix 也是 Flink 大用户：

- **Flink State Backend**：基于 RocksDB + 自研优化。
- **Exactly-Once**：通过 Kafka 事务 + Flink Checkpoint 实现。
- **大状态优化**：单任务 TB 级 State。

### 4.5 决策 5：Metaflow ML 框架

#### 4.5.1 Metaflow 定位

Netflix 2019 年开源的 ML 框架，对标 AWS SageMaker + Kubeflow + MLflow。

#### 4.5.2 关键能力

- **Python 优先**：让数据科学家用熟悉的 Python 写 ML。
- **本地 + 云端一致**：本地开发、云端部署，代码无需修改。
- **Step 抽象**：每个 ML 任务用 Step 描述，自动构建 DAG。
- **数据版本管理**：自动管理训练数据版本。
- **实验管理**：基于 DAG 的实验管理。

#### 4.5.3 关键技术

- **Metaflow Client**：Python SDK，本地开发。
- **Metaflow Service**：云端执行环境。
- **Metaflow UI**：可视化 UI。

### 4.6 决策 6：Data Mesh 实践

#### 4.6.1 Data Mesh 核心理念

Data Mesh 是 Zhamak Dehghani 2019 年提出的数据架构范式，核心理念：

- **数据所有权分散**：每个业务团队拥有自己的数据。
- **数据产品化**：每个数据集都是"数据产品"。
- **联邦治理**：跨团队治理通过"联邦委员会"。
- **自助平台**：基础设施平台化。

#### 4.6.2 Netflix 实践

Netflix 是 Data Mesh 的早期实践者：

- **数据产品目录**：所有数据集注册到统一目录。
- **数据 Owner**：每个数据集有 Owner。
- **数据 SLA**：每个数据集有 SLA。
- **联邦治理委员会**：跨团队数据治理。

#### 4.6.3 价值

- **业务团队自主**：业务团队可以自主决定数据模型。
- **基础设施共享**：所有团队共享统一基础设施（Iceberg + Spark/Flink + Maestro）。
- **跨团队协作**：通过"数据产品"实现跨团队协作。

### 4.7 决策 7：实时数仓

#### 4.7.1 实时数仓架构

```
[Kafka] → [Flink] → [Iceberg] → [Trino] → [BI]
   (流)    (实时)    (表格式)    (查询)      (消费)
```

#### 4.7.2 关键能力

- **流批一体**：同一份 Iceberg 表可以同时被 Flink 写、Spark / Trino 读。
- **低延迟写入**：Flink 写 Iceberg 延迟 < 1 秒。
- **高并发查询**：Trino 查 Iceberg 并发能力强。

### 4.8 决策 8：ML Platform

#### 4.8.1 ML Platform 架构

```
[数据] → [特征平台] → [Metaflow] → [训练] → [部署] → [推理]
         (Iceberg)   (Python)     (Spark)    (Docker) (在线)
```

#### 4.8.2 核心组件

- **特征平台**：基于 Iceberg + Redis。
- **Metaflow**：ML 框架。
- **训练集群**：基于 Kubernetes + Spark。
- **部署平台**：基于容器。
- **推理平台**：基于 Netflix Titus + 自研。

---
