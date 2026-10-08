# Ch1 · 建模方法论

> **一句话定位**：从业务过程到数据模型，再扩展到本体建模、知识图谱与图数据推理——AI 时代数据架构师的第一道分水岭。

## 画像映射

本章对应 **R3 数据建模** 能力（数仓 + 知识图谱 + 本体建模 + 图数据推理）：

- **数仓建模**：维度建模（Kimball）、Data Vault、Anchor Modeling、数仓分层（ODS / DWD / DWS / ADS）、OneData、OneID
- **知识图谱构建**：实体识别、关系抽取、属性对齐、图谱融合与质量评估
- **本体建模（Ontology）**：RDF / OWL、概念体系、属性约束、推理规则、多源实体统一
- **图数据推理**：图神经网络（GNN）、路径推理、子图匹配、图算法（PageRank / Community Detection）

> P7 会"建表"，P8 会"建模型"，**资深数据架构师会"建体系"**——数仓 + 本体 + 图谱 三位一体。

## 基本信息

- **难度**：★★★☆☆
- **推荐角色**：数据架构师 / 数据科学家
- **前置章节**：无（建议先读 [序章](../00-introduction/)）
- **后续章节**：[Ch2 · 数据科学与算法](../02-data-science/)；**数据全栈 / 数据资产化 / AI 智能体** 章节都以本章为建模基础

## 本章要回答的核心问题

1. **业务过程如何识别？** 业务架构→数据架构的映射方法是什么？
2. **建模方法怎么选？** 维度建模（Kimball）、Data Vault、Anchor Modeling 各自适用什么场景？
3. **数仓分层（ODS / DWD / DWS / ADS）怎么落地？** OneData 思想如何打通业务过程→指标体系→数据模型？
4. **OneID 主数据怎么做？** 跨域用户打通、ID-Mapping 算法有哪些坑？
5. **本体建模（Ontology）什么时候用？** RDF / OWL 概念体系、属性约束、推理规则与传统 ER / 维度建模的本质差异？
6. **知识图谱怎么构建？** 实体识别、关系抽取、属性对齐、图谱融合（KG Fusion）的工程化链路？
7. **图数据推理（Graph Reasoning）解决什么？** 图神经网络（GNN）、路径推理、子图匹配在推荐 / 风控 / 反欺诈场景的落地？

## 子主题列表

- [ ] **[业务过程建模](./01-business-process-modeling.md)**：业务架构→数据架构的映射方法（事件→事实→维度）
- [ ] **[维度建模（Kimball）](./02-dimensional-modeling.md)**：事实表、维度表、星型 / 雪花 / 星座模型
- [ ] **[Data Vault](./03-data-vault/README.md)**：Hub-Link-Satellite 三件套，敏捷数仓的另一种选择
- [ ] **[Anchor Modeling](./04-anchor-modeling/README.md)**：高度可演化的第 6 范式
- [ ] **[本体建模（Ontology）](./05-ontology-modeling/README.md)**：RDF / OWL、概念体系、属性约束、多源实体统一
- [ ] **[知识图谱构建](./06-knowledge-graph/README.md)**：实体抽取、关系抽取、图谱融合、Neo4j / NebulaGraph / TigerGraph
- [ ] **[图数据推理](./07-graph-reasoning/README.md)**：图神经网络（GNN）、路径推理、子图匹配、推荐与风控
- [ ] **[OneData 思想](./08-one-data/README.md)**：阿里中台统一数据标准与模型的方法论
- [ ] **[OneID 主数据](./09-one-id/README.md)**：跨域用户打通、ID-Mapping 算法（设备 ID、手机号、身份证等）
- [ ] **[指标体系设计](./10-metric-system/README.md)**：原子指标 + 时间周期 + 业务修饰 = 派生指标
- [ ] **[数据模型管理](./11-model-management/README.md)**：命名规范、版本管理、Owner 制度、模型评审
- [ ] **[DataWorks / 阿里中台工具链实战](./12-hands-on.md)**

> 文件命名建议（不强制）：`business-process-modeling.md` / `dimensional-modeling.md` / `data-vault.md` / `anchor-modeling.md` / `ontology-modeling.md` / `knowledge-graph.md` / `graph-reasoning.md` / `one-data.md` / `one-id.md` / `metric-system.md` / `model-management.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 识别核心业务过程，并将业务架构映射为可建模的数据架构
- 选型合适的数仓建模方法（Kimball / Data Vault / Anchor），并落地数仓分层（ODS / DWD / DWS / ADS）
- 用 OneData / OneID 打通指标体系与主数据
- 区分**传统数据建模 vs 本体建模 vs 知识图谱**的适用场景与边界
- 设计知识图谱 schema（实体 / 关系 / 属性）并选择合适的图数据库（Neo4j / NebulaGraph / TigerGraph）
- 用图数据推理（图神经网络、路径推理、子图匹配）解决推荐 / 风控 / 反欺诈的工程问题
- 建立数据模型治理（命名规范、版本管理、Owner 制度、模型评审）

## 推荐资料

> 本节整理 Ch1 推荐阅读：经典书 + 工业白皮书 + 2024–2025 学术/工程前沿。
> 配合各子章「前沿演进」一节使用，先骨架再前沿。

### 经典书目（建模方法论基石）

| 书 | 作者 | 重点章节 | 阅读建议 |
| --- | --- | --- | --- |
| *The Data Warehouse Toolkit*（3rd Ed.） | Ralph Kimball | 全书 | 维度建模圣经，星型 / 缓慢变化维的源头 |
| *Building the Data Warehouse* | Bill Inmon | 全书 | 自顶向下 ER 数仓的源头 |
| *Modeling the Agile Data Warehouse with Data Vault* | Dan Linstedt | 全书 | Data Vault 2.0 标准教材 |
| *Anchor Modeling: Agile modeling for Big Data* | Olle Regardt | 全书 | 第 6 范式 / Anchor Modeling |
| *A Semantic Web Primer*（3rd Ed.） | Grigoris Antoniou | Ch.2–6 | RDF / OWL / SPARQL 入门 |
| *Ontology Engineering* | Valentina Presutti | 全书 | 本体工程方法论 |
| *Knowledge Graphs: Fundamentals, Techniques, and Applications* | Hogan et al. | 全书 | KG 系统综述（免费在线） |
| *Graph Neural Networks: Foundations, Frontiers, and Applications* | Wu et al. | 全书 | GNN 综述（中文版亦有） |
| *Designing Data-Intensive Applications* | Martin Kleppmann | Ch.2–5 | 不在 Ch1 但建模底层思想互补 |

### 工业白皮书 / 公开资料

- *《阿里大数据之路》*（阿里数据团队，2017 / 2021 修订版）：OneData / OneID / OneService 的工业化范式
- *《数据中台架构：企业级数据资产化方法论与实践》*（机械工业，2020）
- *Databricks Lakehouse Platform 白皮书*（2021 / 2023 修订）：湖仓一体与 Data Lakehouse
- *Snowflake / Iceberg / Apache Hudi 官方文档*：表格式（table format）的设计哲学对比
- *Neo4j / NebulaGraph / TigerGraph 官方白皮书*：图数据库三大流派
- *Microsoft GraphRAG 论文与代码库*（2024）：GraphRAG 工程化里程碑
- *Google Knowledge Graph Search API 文档*：工业级 KG 案例

### 2024–2025 前沿（论文 / 产品 / 开源）

- *Graph Foundation Models（GFM）* 系列论文（2024–2025）：跨图统一预训练
- *Microsoft GraphRAG*（2024）：基于 KG 增强的 RAG 检索
- *Neo4j LLM Knowledge Graph Builder*（2024）：自然语言 → KG 一键构建
- *Apache Jena / RDF4J / OWL API*：本体建模工具链
- *dbt Semantic Layer / Cube / Airbnb Minerva*：Metric 语义层
- *OpenMetadata / DataHub / Unity Catalog*：AI 时代的模型与资产目录
- *OWL 2 Profiles（RL / EL / QL）*：大规模本体推理
- *OpenAI Structured Outputs / Anthropic Tool Use*：LLM 输出结构化建模

### 学习路径建议

1. **入门（1–2 周）**：Kimball《Toolkit》Ch.1–5 + 本章 `02-dimensional-modeling.md` + `01-business-process-modeling.md`
2. **进阶（3–4 周）**：Inmon + Data Vault + Anchor Modeling 三本书互参；本章 `03-data-vault.md` / `04-anchor-modeling.md`
3. **本体与 KG（4–6 周）**：Antoniou + Hogan + Neo4j 实操；本章 `05–07` 三篇
4. **中台与指标（2 周）**：阿里《大数据之路》+ dbt Semantic Layer 文档；本章 `08–10` 三篇
5. **治理与前沿（持续）**：跟踪 OpenMetadata / GraphRAG / GFM 进展；本章 `11-model-management.md`

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch2 · 数据科学与算法](../02-data-science/) 继续阅读
