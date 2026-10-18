# 数据目录（Data Catalog）

> **一句话定位**：企业数据资产的「可发现 + 可理解 + 可信任 + 可治理」中枢——让业务方能找到数据、理解数据、安全消费数据。

> 本文是 data-travel 项目 [Ch4 · 数据资产化与智能检索](../../README.md) 的子章节（08 数据目录）。覆盖 **核心职责② 企业私有数据资产化与智能检索** 中「**数据资产的可发现性与治理**」相关的设计模式与工程实践。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 数据目录是什么、和元数据管理有什么区别？ | §1 |
| DataHub / Atlas / OpenMetadata / Unity Catalog 怎么选？ | §4 |
| 数据血缘、标签、Owner、资产评分怎么落地？ | §2、§3 |
| AI 增强的数据目录（自然语言搜索、自动文档）？ | §5 |
| 企业级落地路径与踩坑？ | §6 |

---

## 1. 概念与定位

### 1.1 是什么

**学术 / 工业定义**：数据目录（Data Catalog）是企业数据资产的「**统一目录系统**」，它把分散在不同系统（数仓、湖仓、数据库、BI、应用）的元数据（技术元数据、业务元数据、血缘、标签、Owner、文档）聚合、索引、关联，并提供「**可发现 + 可理解 + 可信任 + 可治理**」的能力。它是数据治理的「**前台**」，是数据中台的「**门面**」。

**工程定义**：在数据架构师手里，数据目录是**一份数据资产的可发现性 + 治理能力**：

- **可发现**：业务方通过搜索 / 浏览找到所需数据。
- **可理解**：表 / 字段 / 指标的含义、口径、用法可被理解。
- **可信任**：数据质量、Owner、权限、使用情况可被信任。
- **可治理**：血缘、分类分级、生命周期、合规可被管理。

**数据目录 vs 元数据管理**：

| 维度 | 元数据管理 | 数据目录 |
| --- | --- | --- |
| 范围 | 技术元数据为主 | 技术 + 业务 + 管理元数据 |
| 用户 | 数据团队 | 全员（业务 / 数据 / AI） |
| 核心能力 | 采集、存储、查询 | 可发现、可理解、可治理 |
| 输出 | 元数据库 | 用户友好的目录 UI + API |
| 工具 | Atlas、DataHub | DataHub、OpenMetadata、Unity Catalog |

数据目录是元数据管理的「**产品化**」——把元数据变成「人人可用」的资产。

### 1.2 为什么需要

**业务驱动力**：

- **「找数难」**：业务方不知道「数据在哪」「找谁要」。
- **「懂数难」**：表名 / 字段名晦涩，缺少业务解释。
- **「用数难」**：不知道数据质量、时效、口径。
- **「管数难」**：不知道谁在用、谁负责、合规风险。
- **「AI 时代新需求」**：LLM 需要结构化元数据，Agent 需要数据资产可发现。

**痛点**：

1. **「数据沼泽」**：企业有 10000+ 张表，业务方找不到。
2. **「表名无语义」**：表名如 `t_2023_q4_order_fact_dwd_v2`，业务方看不懂。
3. **「口径混乱」**：同一指标在不同表中定义不同，无 Owner。
4. **「血缘断裂」**：数据来源不可追溯，问题排查困难。
5. **「无权限可见」**：不知道数据是否涉密，合规风险高。
6. **「AI 数据不可见」**：Agent 不知道有哪些 API / 表可用。

**AI 时代的新诉求**：

- **LLM 需要元数据**：Agent 决策前需要查「有什么数据」。
- **自然语言搜索**：业务方说「找上季度的销售数据」，目录返回。
- **自动文档生成**：LLM 自动生成表 / 字段的业务解释。
- **资产评分自动化**：AI 自动评估数据质量 + 价值。

### 1.3 在 AI 时代数据架构中的位置

```
   [数据源：DB / 湖仓 / API / 文档 / 向量库]
                ↓
   [元数据采集层] ← Ch11 横切工程
                ↓
   [数据目录平台] ← 本文（DataHub / Atlas / OpenMetadata）
                ↓
   [用户：业务方 / 数据团队 / AI Agent / LLM]
```

- **上游**：Ch1（建模）、Ch3（数据全栈）、Ch11（横切工程）。
- **下游**：Ch4-06 OneService、Ch4-09 统一查询网关、Ch5 AI 智能体平台、Ch6 多模型编排。
- **横向**：与数据治理（Ch8）、可观测（Ch11）、AI 治理（Ch8）深度协同。

**一句话判断**：**「没有数据目录就没有数据中台」——数据目录是数据中台的「Google 搜索 + Wikipedia + 权限管理」三合一。AI 时代，没有数据目录，Agent 就成了「睁眼瞎」。**

### 1.4 演进历程

**传统元数据阶段（2000-2015）**：

- 企业元数据库（IBM InfoSphere、Informatica）。
- 散落在 BI 工具、数据建模工具。
- 无统一视图。

**大数据目录阶段（2015-2020）**：

- 2015：Apache Atlas（Apache 开源）——Hadoop 生态元数据。
- 2019：Amundsen（Lyft 开源）——基于 Neo4j + Elasticsearch。
- 2019：DataHub（LinkedIn 开源）——基于 Kafka + Elasticsearch + MySQL。

**云原生 + AI 阶段（2020+）**：

- 2021：DataHub 2.0，事件驱动的元数据架构。
- 2021：OpenMetadata（OpenMetadata 开源）——统一元数据平台。
- Unity Catalog（Databricks）——湖仓一体目录，2021 年发布【公开：Data+AI Summit 2021 的 Unity Catalog 发布公告】。
- 2023：阿里 DataWorks、HoloMeta（国内大数据目录）。
- 2024：AI 增强数据目录（自然语言搜索 / 自动文档生成）。

**AI 原生阶段（2024+）**：

- 2024：Snowflake Horizon Catalog、AWS Glue Data Catalog 升级。
- 2024-2025：LLM 嵌入数据目录（自然语言搜索、自动文档、资产问答）。
- 2025：Atlan、Secoda、Collibra 等 AI 增强目录成熟。

---

## 2. 核心原理

### 2.1 关键概念定义

- **技术元数据（Technical Metadata）**：表名、字段名、类型、schema、partition、存储位置、统计信息。
- **业务元数据（Business Metadata）**：业务名、业务定义、Owner、文档、标签、使用说明。
- **管理元数据（Management Metadata）**：分类分级、权限、生命周期、SLA、合规标签。
- **操作元数据（Operational Metadata）**：访问日志、查询模式、ETL 状态。
- **血缘（Lineage）**：数据从哪里来（上游）、到哪里去（下游），表级 + 字段级。
- **标签（Tag）**：业务标签（如「客户」「交易」）、技术标签（如「PII」「密级」）。
- **Owner / Steward**：数据负责人（生产方）、数据管家（治理方）。
- **数据契约（Data Contract）**：生产方与消费方的 SLA 协议（Schema、口径、频率）。
- **数据质量（Data Quality）**：完整性、准确性、一致性、时效性。
- **资产评分（Asset Score）**：数据资产的价值评分（使用频率、关键性、合规风险）。
- **分类分级（Classification）**：按敏感度分级（公开 / 内部 / 机密 / 高密）。
- **生命周期（Lifecycle）**：数据从创建到销毁的全过程（生产 → 使用 → 归档 → 删除）。
- **资产发现（Discovery）**：搜索 / 浏览找到数据资产。
- **资产理解（Understanding）**：理解数据含义 / 口径 / 用法。
- **资产治理（Governance）**：血缘 / 权限 / 合规 / 生命周期的管理。

### 2.2 数学 / 形式化基础

数据目录本质是「**元数据的元数据**」——即一个关于元数据的知识图谱。

**元数据模型**：

```
Asset = {
  id: UUID,
  type: Table|Field|Dashboard|API|MLModel,
  name: str,
  display_name: str,
  description: str,
  owner: User,
  tags: [Tag],
  schema: Schema,
  lineage: [LineageEdge],
  quality_metrics: {completeness, accuracy, ...},
  classification: Public|Internal|Confidential|HighConfidential,
  lifecycle: Created|Active|Archived|Deprecated,
  access_count_30d: int,
  ... }
```

**血缘模型**：

```
LineageEdge = {
  source: AssetID,
  target: AssetID,
  transformation: SQL|Python|Spark|Flink,
  job_id: str,
  schedule: Cron,
  ... }
```

**资产评分**：

```
AssetScore = w1 × UsageScore + w2 × QualityScore + w3 × CriticalityScore + w4 × ComplianceRisk
```

其中每个维度由具体指标加权计算。

**自然语言搜索的数学**：

```
Query → Embedding → Vector Search (元数据向量库) → Top-K Candidates
                                   ↓
                          LLM Rerank + 意图理解 → 返回资产
```

### 2.3 关键算法 / 方法

**元数据采集方法**：

1. **数据库直连**：JDBC / ODBC 直连 DB，提取 schema、统计信息。
2. **ETL 解析**：解析 Spark / Flink / Airflow 代码，提取血缘。
3. **Query Log 解析**：解析 Presto / Hive / Spark 查询日志，提取实际使用模式。
4. **事件流**：通过 Kafka / Pulsar 实时采集元数据变更事件。
5. **API 集成**：从 BI / 报表 / ML 平台 API 拉取元数据。

**血缘解析方法**：

1. **SQL 静态解析**：解析 SQL AST，提取表级血缘（Apache Calcite、sqlparse）。
2. **SQL 运行时解析**：通过 Hook 拦截实际执行 SQL，提取血缘。
3. **字段级血缘**：列级依赖分析（依赖图算法）。
4. **跨语言血缘**：Spark / Flink / Python 联合解析。

**资产发现方法**：

1. **关键词搜索**：倒排索引（Elasticsearch）。
2. **语义搜索**：向量检索（Embedding + 向量库）。
3. **过滤浏览**：按标签 / 分类 / Owner / 数据域浏览。
4. **自然语言搜索**：LLM 理解查询 + 资产召回 + 重排。
5. **推荐系统**：基于访问模式推荐相似资产。

**自动文档生成**：

1. **LLM 自动生成业务解释**。
2. **基于样例数据生成字段说明**。
3. **基于查询模式生成使用示例**。
4. **基于血缘生成上下游说明**。

**资产评分算法**：

1. **使用频次**：访问次数、查询次数、API 调用次数。
2. **关键性**：下游依赖数、关键业务关联度。
3. **质量评分**：完整性、准确性、时效性。
4. **合规风险**：PII 字段数、敏感度等级。

### 2.4 与相邻概念的关系

- **数据目录 vs 元数据管理**：数据目录是元数据管理的「产品化」，强调用户友好。
- **数据目录 vs 数据资产平台**：数据资产平台包含目录 + 计算 + 服务化，目录是其子集。
- **数据目录 vs BI 平台**：BI 是「数据消费」，目录是「数据发现」。
- **数据目录 vs 知识图谱**：目录是「资产的图」，KG 是「实体的图」。目录用图数据库存储血缘。
- **数据目录 vs 数据安全**：目录登记分类分级，安全执行权限控制。
- **数据目录 vs AI 数据平台**：AI 数据平台包含目录 + RAG + Agent Tool，目录是其基础。

> 💡 **思考锚点**：按 2.3 的资产评分四因子（使用频次、下游依赖数、质量、PII 敏感度）给你目录里最重要的那批表各打一次分——你现在的采集真拿到了 access_count_30d 与下游依赖数，还是四个因子里有两个只能靠人工填？

---

- [§3. 设计模式与范式](08-data-catalog-section-3-sec3.md)
- [§4. 工程实现](08-data-catalog-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](08-data-catalog-section-5-ai.md)
- [§6. 落地实践](08-data-catalog-section-6-sec6.md)
- [§7. 与其他方法对比](08-data-catalog-section-7-sec7.md)
- [§8. 面试真题集](08-data-catalog-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](08-data-catalog-section-3-sec3.md)
- [§4. 工程实现](08-data-catalog-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](08-data-catalog-section-5-ai.md)
- [§6. 落地实践](08-data-catalog-section-6-sec6.md)
- [§7. 与其他方法对比](08-data-catalog-section-7-sec7.md)
- [§8. 面试真题集](08-data-catalog-section-8-sec8.md)

---
