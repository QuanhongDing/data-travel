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

- [ ] **[业务过程建模](./01-business-process-modeling/README.md)**：业务架构→数据架构的映射方法（事件→事实→维度）
- [ ] **[维度建模（Kimball）](./02-dimensional-modeling/README.md)**：事实表、维度表、星型 / 雪花 / 星座模型
- [ ] **[Data Vault](./03-data-vault/README.md)**：Hub-Link-Satellite 三件套，敏捷数仓的另一种选择
- [ ] **[Anchor Modeling](./04-anchor-modeling/README.md)**：高度可演化的第 6 范式
- [ ] **[本体建模（Ontology）](./05-ontology-modeling/README.md)**：RDF / OWL、概念体系、属性约束、多源实体统一
- [ ] **[知识图谱构建](./06-knowledge-graph/README.md)**：实体抽取、关系抽取、图谱融合、Neo4j / NebulaGraph / TigerGraph
- [ ] **[图数据推理](./07-graph-reasoning/README.md)**：图神经网络（GNN）、路径推理、子图匹配、推荐与风控
- [ ] **[OneData 思想](./08-one-data/README.md)**：阿里中台统一数据标准与模型的方法论
- [ ] **[OneID 主数据](./09-one-id/README.md)**：跨域用户打通、ID-Mapping 算法（设备 ID、手机号、身份证等）
- [ ] **[指标体系设计](./10-metric-system/README.md)**：原子指标 + 时间周期 + 业务修饰 = 派生指标
- [ ] **[数据模型管理](./11-model-management/README.md)**：命名规范、版本管理、Owner 制度、模型评审
- [ ] **[DataWorks / 阿里中台工具链实战](./12-hands-on/README.md)**

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

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch2 · 数据科学与算法](../02-data-science/) 继续阅读
