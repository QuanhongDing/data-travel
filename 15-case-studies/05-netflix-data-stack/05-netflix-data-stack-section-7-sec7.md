> 本文件是 **05-netflix-data-stack.md** 的子文件（§7. 与同类案例对比）。完整章节请回到 [index](05-netflix-data-stack.md)。

## 7. 与同类案例对比

### 7.1 对比维度

| 维度 | Netflix | Databricks | Uber | Airbnb |
| --- | --- | --- | --- | --- |
| 主导思想 | 数据自由 + 自治 | 一体化 Lakehouse | 数据平台 + 工程师友好 | 数据科学家友好 |
| 表格式 | Iceberg | Delta Lake | Hudi | Iceberg |
| 调度 | Maestro | Databricks Workflows | Apache Airflow | Airflow |
| ML 框架 | Metaflow | MLflow + Databricks | Michelangelo | MLflow |
| 实时 | Kafka + Flink | Structured Streaming | Kafka + Flink | Kafka + Spark |
| 治理 | Data Mesh | Unity Catalog | 数据平台 | Minerva |

### 7.2 取舍

- **Netflix = 自由 + 自治 + 创新**——给团队最大灵活度。
- **Databricks = 一体化 + 商业化**——把 Lakehouse 作为商业产品。
- **Uber = 平台 + 工程师友好**——让工程师高效工作。
- **Airbnb = 数据科学家友好 + 协作**——让数据科学家高效协作。

**对架构师的启示**：

- **学 Iceberg**——它已成为事实标准。
- **学 Maestro 思路**——统一 DAG + 多触发方式。
- **学 Metaflow 思路**——ML 框架的 Python 优先理念。
- **学 Data Mesh 思路**——但要按企业实际裁剪。

---
