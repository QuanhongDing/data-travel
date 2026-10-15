> 本文件是 **06-uber-data-architecture.md** 的子文件（§7. 与同类案例对比）。完整章节请回到 [index](06-uber-data-architecture.md)。

## 7. 与同类案例对比

### 7.1 对比维度

| 维度 | Uber | Netflix | Airbnb | 美团 |
| --- | --- | --- | --- | --- |
| 主导思想 | Marketplace + 实时 | 数据自由 + 自治 | 数据科学家友好 | 业务落地 + 全栈 |
| 表格式 | Hudi | Iceberg | Iceberg | Iceberg |
| 实时 | Kafka + Flink | Kafka + Flink | Kafka + Spark | Kafka + Flink |
| ML 平台 | Michelangelo | Metaflow | MLflow | PAI |
| 调度 | Airflow | Maestro | Airflow | Dolphin |
| 存储 | Cassandra / Schemaless | S3 | S3 | HDFS / OSS |

### 7.2 取舍

- **Uber = Marketplace 实时性 + CDC 友好**——适合需要 CDC + Update/Delete 的场景。
- **Netflix = 自由 + 自治**——适合多引擎 + 灵活组织。
- **Airbnb = 数据科学家友好**——适合数据科学家协作。
- **美团 = 业务落地 + 全栈**——适合强业务驱动。

**对架构师的启示**：

- **学 Hudi 思路**——CDC + Update/Delete 是关键。
- **学 Michelangelo 思路**——把 ML 工程化做成"基础设施"。
- **学实时调度架构**——Marketplace 实时性是核心。
- **学 Data Mesh 思路**——但要按企业实际裁剪。

---
