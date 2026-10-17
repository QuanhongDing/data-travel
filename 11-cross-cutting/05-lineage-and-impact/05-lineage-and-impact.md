# 数据血缘与影响分析（Data Lineage & Impact Analysis）

> **一句话定位**：把"数据从哪里来、到哪里去、被谁消费"沉淀为可查询、可视化、可推理的血缘图谱——它既是数据治理的"地图"，也是故障定位与变更管理的"导航仪"。

> 本文是 data-travel 项目 [Ch11 · 横切工程](../../README.md) 的子章节（**05 数据血缘与影响分析**）。覆盖 **R7 横切能力（质量 / 可观测 / 成本 / 安全）** 中「数据血缘」的自动采集、字段级血缘、影响分析、根因分析、与 RAG / GraphRAG 的结合，以及 DataHub / Apache Atlas / OpenLineage / Unity Catalog / Marquez / 字节 DataFinder 等关键工具。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 数据血缘是什么？跟数据可观测性什么关系？ | §1.1、§1.3 |
| 血缘有哪几层？表级 / 字段级 / 任务级怎么选？ | §2.1、§3.1 |
| 血缘怎么自动采集？SQL 解析 / OpenLineage 怎么用？ | §2.3、§4.1 |
| 字段级血缘怎么落地？业界怎么做？ | §4.2、§4.4 |
| 影响分析怎么做？上游变更如何感知下游？ | §3.1、§4.3 |
| 根因分析怎么跟血缘结合？故障定位怎么做？ | §4.3、§5.2 |
| DataHub vs Atlas vs Unity Catalog vs OpenLineage 怎么选？ | §4.4、§7.1 |
| 血缘与 RAG / GraphRAG / LLM 怎么结合？ | §5.1、§5.2 |
| 血缘在 AI 时代的演进方向？ | §5.3、§5.4 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：数据血缘（Data Lineage）指数据从源头到目的地的流转路径与变换历史。在元数据管理标准中，W3C PROV（Provenance Ontology，2013）定义了血缘的三元组模型：实体（Entity）、活动（Activity）、代理（Agent），构成"数据从哪里来、被谁处理、被怎样变换"的语义网络。

**工程定义**：在数据架构师手里，数据血缘是一份**可查询、可视化、可推理、可治理**的"数据世界地图"，包含三要素：

1. **数据资产（Asset）**：表、字段、文件、报表、指标、模型。
2. **流转关系（Flow）**：从源头到目的地的变换过程（SQL、ETL、Flink Job、API）。
3. **元数据（Metadata）**：Owner、SLA、SLO、分类分级、生命周期、标签。

**三层血缘模型**：

| 层级 | 描述 | 采集难度 | 价值 |
| --- | --- | --- | --- |
| **表级血缘** | 表 A → 表 B | 低（SQL 解析） | 中（粗粒度定位） |
| **字段级血缘** | A.col1 → B.col2 | 中（深度 SQL 解析） | 高（精确影响分析） |
| **任务级血缘** | Job X → 表 A（生产者）/ 表 B（消费者） | 低（日志/调度） | 中（运维） |

**关键术语**：

| 概念 | 定义 |
| --- | --- |
| **上游（Upstream）** | 数据的源头 |
| **下游（Downstream）** | 数据的消费者 |
| **字段血缘（Column Lineage）** | 字段级流转路径 |
| **影响分析（Impact Analysis）** | 上游变更影响哪些下游 |
| **根因分析（Root Cause Analysis）** | 下游异常，定位上游根因 |
| **OpenLineage** | 统一血缘规范（LF AI & Data） |
| **Marquez** | OpenLineage 参考实现 |
| **DataHub** | LinkedIn 开源元数据平台 |
| **Unity Catalog** | Databricks 元数据 + 血缘 |
| **血缘图谱** | 数据流转的有向图 |
| **元数据（Metadata）** | 描述数据的数据 |
| **业务血缘（Business Lineage）** | 从业务视角看数据流转 |
| **技术血缘（Technical Lineage）** | 从技术视角看数据流转 |

### 1.2 为什么需要

**业务驱动力**：

1. **故障定位刚需**：数据出错时，"上游谁变了、下游谁受影响"是第一个要回答的问题。
2. **变更管理刚需**：源头表加字段 / 改类型，下游是否兼容？影响哪些报表？——没有血缘就是盲改。
3. **合规与审计**：GDPR / 个保法 / SOX / HIPAA 要求"数据可追溯"——血缘是核心证据。
4. **数据治理基础**：数据资产目录、数据质量、数据安全的"底层设施"——没有血缘，治理无根基。
5. **AI 时代放大需求**：RAG / 微调需要"知道数据从哪来、是否可信"——血缘是 AI 数据可信度的基础。

**痛点**：

1. **"数据流转说不清楚"**：100 张表、20 个团队、500 个任务，没有统一视图。
2. **"改一处动全身"**：上游改了，下游没感知，故障常常 N 天后才发现。
3. **"血缘采集成本高"**：人工维护血缘不可持续，自动采集难。
4. **"血缘不准确"**：自动采集漏一半，人工维护又过期。
5. **"字段血缘难落地"**：业界能做到 100% 字段血缘的团队极少。

### 1.3 在 AI 时代数据架构中的位置

```
                  [业务]
                    ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   业务血缘              技术血缘
   (业务视角)            (SQL/Job)
        ↓                   ↓
        └─────────┬─────────┘
                    ↓
            数据血缘图谱
                    ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   影响分析              根因分析
   (Impact)             (RCA)
        ↓                   ↓
        └─────────┬─────────┘
                    ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   治理决策              AI 应用
   (变更/SLA)           (RAG/训练)
```

**血缘与可观测性的关系**：

```
数据可观测性：
  异常检测 → 定位到表 / 字段
  血缘 → 找到上游 / 下游
  影响分析 → 评估变更影响
  RCA → 找到根因
```

**血缘是"地图"**，可观测性是"导航"——两者结合才能从"发现问题"到"解决问题"。

**与其他横切能力的关系**：

- **数据质量**（§1）：血缘 + 质量 = 故障定位。
- **可观测性**（§4）：血缘是可观测性的"定位工具"。
- **数据安全**（§2）：血缘 + 分类分级 = 敏感数据流转地图。
- **数据成本**（§3）：血缘 + 成本 = 单表 / 单团队成本归因。

**一句话判断**：**P7 会让数据"跑起来"，P8 会让数据"跑得稳"，资深数据架构师会让数据"跑得透明、可控、可信"——血缘是透明性的基础设施。**

### 1.4 演进历程

**传统阶段（2000s–2010）**：

- 2005-2010：数据仓库时代，血缘靠 Excel + Visio 人工维护。
- 2010：Informatica、IBM InfoSphere 等商业血缘工具出现。
- 2012：Apache Hive Hooks 机制实现粗粒度血缘。

**大数据时代（2010–2020）**：

- 2015：Apache Atlas（Hortonworks 出品）开源。
- 2015：WhereHows（LinkedIn 出品）成为 DataHub 前身。
- 2016：Apache Griffin 与血缘集成。
- 2019：Databricks 开源 Delta Lake，时间旅行 + 血缘雏形。
- 2019：DataHub（LinkedIn）正式开源。
- 2020：Unity Catalog（Databricks）发布。

**AI 与统一规范时代（2020–2025）**：

- 2021：OpenLineage 项目启动（LF AI & Data 孵化）。
- 2022：Marquez 成为 OpenLineage 参考实现。
- 2023：OpenLineage 1.0 GA，跨工具血缘互通成为可能。
- 2024：Databricks 推出 Lakehouse Federation，血缘跨云联邦化。
- 2024-2025：AI 驱动血缘（LLM 自动补全血缘 + 智能问询）成为新趋势。
- 2025：阿里云 DataWorks 推出"智能血缘"，LLM 辅助血缘补全。

---

## 2. 核心原理

### 2.1 关键概念定义

| 概念 | 定义 | 与血缘的关系 |
| --- | --- | --- |
| **元数据（Metadata）** | 描述数据的数据 | 血缘是元数据的子集 |
| **数据目录（Catalog）** | 元数据的统一管理 | 血缘是目录的核心组件 |
| **数据字典（Data Dictionary）** | 表 / 字段含义说明 | 血缘关联业务语义 |
| **数据资产（Data Asset）** | 有价值的数据资源 | 血缘描述资产间关系 |
| **ETL（Extract-Transform-Load）** | 数据抽取转换加载 | 血缘记录 ETL 过程 |
| **ELT（Extract-Load-Transform）** | 先抽取加载再转换 | 血缘记录 ELT 过程 |
| **视图（View）** | SQL 定义的虚拟表 | 血缘记录视图依赖 |
| **物化视图（Materialized View）** | 预计算物理化的视图 | 血缘记录物化过程 |
| **数据副本（Replica）** | 跨地域 / 跨云副本 | 血缘记录副本关系 |
| **数据共享（Data Sharing）** | 跨团队 / 跨公司共享 | 血缘记录共享关系 |
| **数据湖（Lake）** | 原始数据存储 | 血缘记录湖到仓的加工 |
| **数据仓库（Warehouse）** | 结构化数据存储 | 血缘记录仓内流转 |

### 2.2 数学/形式化基础

**血缘图形式化**：

血缘是一个有向无环图（DAG）：

$$
G = (V, E)
$$

其中 $V$ 是节点集合（表 / 字段 / 任务），$E$ 是边集合（依赖关系）。

**节点**：

$$
v = (\text{type}, \text{identifier}, \text{metadata})
$$

其中 $\text{type} \in \{\text{table}, \text{column}, \text{job}, \text{report}, \text{model}\}$。

**边**：

$$
e = (v_{\text{source}}, v_{\text{target}}, \text{transformation}, \text{timestamp})
$$

其中 $\text{transformation}$ 描述数据变换规则。

**影响分析算法**：

设 $u$ 是变更的上游节点，$D$ 是所有下游节点集合：

$$
D = \{v \in V : \text{hasPath}(u, v)\}
$$

可用 **BFS / DFS** 反向遍历血缘图。

**根因分析算法**：

设 $a$ 是异常节点，$R$ 是根因候选集合：

$$
R = \{v \in V : \text{anomalyScore}(v) > \theta \land \text{hasPath}(v, a)\}
$$

常用 **PageRank** 变体给候选根因打分。

### 2.3 关键算法/方法

**1. 血缘采集方法**：

| 方法 | 描述 | 适用 | 优劣势 |
| --- | --- | --- | --- |
| **SQL 解析** | 解析 SQL 提取依赖 | Hive、Spark SQL、Trino | 准确但受 SQL 复杂度限制 |
| **日志解析** | 解析 ETL 任务日志 | Airflow、DolphinScheduler | 易实现，依赖日志规范 |
| **Hook 机制** | 接入 DB / 数仓 hook | Hive Hook、Spark Listener | 实时性好，但需集成 |
| **ETL 工具 API** | 调用 ETL 工具 API | dbt、Airbyte、Fivetran | 标准统一，工具支持 |
| **OpenLineage** | 统一规范 | 跨工具 | 标准、生态 |
| **LLM 补全** | 用 LLM 自动识别 | 复杂 ETL | 新兴，准确率待提升 |

**2. 字段血缘算法**：

```python
# 简化版 SQL 解析示例
import sqlparse
from sqlparse.sql import Identifier, Function, Parenthesis

def extract_column_lineage(sql: str) -> dict:
    """
    提取字段血缘：
    input: SELECT a, b AS c FROM t1 JOIN t2 ON ...
    output: {
        "output_columns": {"c": ["t1.b"]},
        "input_tables": ["t1", "t2"]
    }
    """
    parsed = sqlparse.parse(sql)[0]
    # ... 简化逻辑
    pass

# 业界主流方案：
# - Apache Spark SQL Lineage
# - SQLFlow (阿里巴巴开源)
# - sqlfluff + 自研
# - Databricks Column Lineage
# - Cube.js Cube Lineage
```

**3. 影响分析算法**：

- **BFS 反向遍历**：从变更节点出发，反向 BFS 找到所有下游。
- **依赖图算法**：Tarjan 算法找强连通分量，避免循环依赖。
- **剪枝优化**：基于团队 / 域剪枝，减少遍历范围。

**4. 根因分析算法**：

- **PageRank**：在血缘图中按重要度排序候选根因。
- **贝叶斯网络**：基于因果关系的概率推理。
- **社区发现**：Louvain 算法识别异常聚类。
- **随机游走**：从异常节点反向游走，概率最高的为根因。

### 2.4 与相邻概念的关系

- **vs 数据目录（Catalog）**：目录是"数据资产清单"，血缘是"资产之间的关系"。
- **vs 数据可观测性**：可观测性是"数据是否健康"，血缘是"数据从哪来 / 到哪去"。
- **vs 数据治理（Governance）**：治理是顶层框架，血缘是其中一个执行领域。
- **vs 影响分析（Impact Analysis）**：影响分析是血缘的下游应用之一。

---

- [§3. 设计模式与范式](05-lineage-and-impact-section-3-sec3.md)
- [§4. 工程实现](05-lineage-and-impact-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](05-lineage-and-impact-section-5-ai.md)
- [§6. 落地实践](05-lineage-and-impact-section-6-sec6.md)
- [§7. 与其他方法对比](05-lineage-and-impact-section-7-sec7.md)
- [§8. 面试真题集](05-lineage-and-impact-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](05-lineage-and-impact-section-3-sec3.md)
- [§4. 工程实现](05-lineage-and-impact-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](05-lineage-and-impact-section-5-ai.md)
- [§6. 落地实践](05-lineage-and-impact-section-6-sec6.md)
- [§7. 与其他方法对比](05-lineage-and-impact-section-7-sec7.md)
- [§8. 面试真题集](05-lineage-and-impact-section-8-sec8.md)

---
