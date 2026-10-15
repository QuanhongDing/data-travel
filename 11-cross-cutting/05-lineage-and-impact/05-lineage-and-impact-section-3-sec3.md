> 本文件是 **05-lineage-and-impact.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](05-lineage-and-impact.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：SQL 解析自动采集**

经典方案，通过解析 SQL 提取依赖：

```
SQL → Parser → AST → 依赖提取 → 血缘存储

工具：
- Apache Spark SQL Lineage
- SQLFlow (阿里巴巴开源)
- Cube Lineage
- sqlfluff
- Apache Calcite
```

**模式 2：OpenLineage 统一规范**

跨工具血缘互通：

```
ETL 工具 → OpenLineage Event → Marquez / DataHub / Atlas

工具：
- Spark OpenLineage Spark Listener
- Airflow OpenLineage Provider
- dbt OpenLineage
- Flink OpenLineage
```

**模式 3：Hook 机制实时采集**

在数仓 / 引擎层加 hook：

```
Hive / Spark / Flink → Hook → 血缘存储

工具：
- Hive Hooks
- Spark Listener
- Flink Metric Reporter
```

**模式 4：联邦化血缘**

跨云 / 跨系统的统一血缘：

```
数据源 1 → 本地血缘存储 → Federation API
数据源 2 → 本地血缘存储 → Federation API
数据源 3 → 本地血缘存储 → Federation API
                              ↓
                      统一血缘图谱
```

代表：**Databricks Lakehouse Federation、阿里云 DataWorks 联邦血缘、AWS Glue Data Catalog 跨账户**。

**模式 5：LLM 辅助血缘**

用 LLM 自动补全 + 查询血缘：

- 自然语言查询血缘：「订单表的数据从哪来」
- LLM 自动补全缺失血缘（基于代码、注释、文档）
- 智能问询 + 可视化

代表：**阿里云 DataWorks 智能血缘、Atlan AI、Collibra AI**。

### 3.2 适用场景决策表

| 场景 | 推荐模式 | 理由 |
| --- | --- | --- |
| **传统数仓 / Hive** | 模式 1（SQL 解析）+ 模式 3（Hook） | 成熟稳定 |
| **数据湖 / Spark** | 模式 2（OpenLineage）+ 模式 3 | 跨工具、生态好 |
| **实时数仓 / Flink** | 模式 3（Hook）+ 模式 2 | 流处理需要实时 |
| **多云 / Data Mesh** | 模式 4（联邦化） | 跨域、跨云 |
| **AI 时代** | 模式 5（LLM 辅助）+ 模式 2 | 自然语言 + 标准 |
| **早期 0→1** | 模式 1（SQL 解析）+ 开源工具 | 低成本起步 |

### 3.3 反模式与陷阱

1. **"血缘采集不全"**：自动采集只能覆盖 60-80%，剩 20-40% 漏。**正确做法**：人工 + LLM 补全。
2. **"血缘不更新"**：采集一次就用半年，没跟上变化。**正确做法**：实时采集（Hook）+ 版本管理。
3. **"只有表级血缘，没有字段级"**：粒度太粗，影响分析不准。**正确做法**：投入资源做字段级血缘。
4. **"血缘是孤岛"**：血缘系统与质量 / 安全 / 成本不联动。**正确做法**：血缘作为底座，与其他能力打通。
5. **"忽视跨域血缘"**：跨云 / 跨账号血缘断链。**正确做法**：联邦化血缘。
6. **"可视化很漂亮但不可查询"**：只做 UI，没做 API。**正确做法**：API 优先，UI 次之。

---
