> 本文件是 **07-airbnb-data-architecture.md** 的子文件（§7. 与同类案例对比）。完整章节请回到 [index](07-airbnb-data-architecture.md)。

## 7. 与同类案例对比

### 7.1 对比维度

| 维度 | Airbnb | Netflix | Uber | 美团 |
| --- | --- | --- | --- | --- |
| 主导思想 | 数据科学家友好 + 元数据治理 | 数据自由 + 自治 | Marketplace + 实时 | 业务落地 + 全栈 |
| 调度 | Airflow | Maestro | Airflow | Catmaid / Dolphin |
| 指标平台 | Minerva | 内部 | 内部 | Quick BI / Quick Audience |
| 元数据 | Dataportal | 内部 | 内部 | 内部 |
| 表格式 | Iceberg | Iceberg | Hudi | Iceberg |
| 实时 | Kafka + Spark | Kafka + Flink | Kafka + Flink | Kafka + Flink |

### 7.2 取舍

- **Airbnb = 数据科学家友好 + 治理成熟**——把"指标 + 元数据"做到极致。
- **Netflix = 数据自由 + 自治**——给团队最大灵活度。
- **Uber = Marketplace 实时性**——把实时性做到极致。
- **美团 = 业务落地 + 全栈**——把 ML 工程化做成基础设施。

**对架构师的启示**：

- **学 Minerva 思路**——指标集中管理是普适需求。
- **学 Dataportal 思路**——元数据治理是普适需求。
- **学 Airflow 思路**——工作流调度的"Python 优先"理念。
- **学"ER + 维度模型"思路**——核心实体稳定 + 维度灵活。

---
