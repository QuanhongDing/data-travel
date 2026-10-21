# Ch9 · 数据智能产品

> **一句话定位**：让 AI 不只在后台——变成业务可消费的产品：智能标签 / 智能 BI / 精细化运营 / 预测决策。

## 画像映射

本章对应 **R5 数据智能类产品认知**（招聘要求第 5 条）：

- 智能标签（事实标签 / 模型标签 / 预测标签）—— 见 [§04 智能标签与标签平台](./04-smart-tag-platform/04-smart-tag-platform.md)
- 智能 BI（自然语言查询 NL2SQL / 自动洞察）—— **本章正文未单列主题**，相关工程做法见 [Ch4 §05 RAG 架构](../04-data-assetization/05-rag-architecture/05-rag-architecture.md)（自然语言到查询的检索侧）与 [Ch5 §01 Data Agent](../05-agent-platform/01-data-agent/01-data-agent.md)（Text2SQL 的 Agent 化）
- 精细化运营（人群运营 / 触达策略）—— **人群圈选**见 [§04 的「人群圈选」一节](./04-smart-tag-platform/04-smart-tag-platform.md)；**A/B 与效果归因**见 [§02 决策智能](./02-decision-intelligence/02-decision-intelligence.md)；**触达策略**本章未单列主题
- 预测决策（推荐 / 营销 / 风控）—— 见 [§02 决策智能](./02-decision-intelligence/02-decision-intelligence.md)

> P7 会"做模型"，P8 会"做平台"，**资深架构师会"做产品"**——让 AI 能力从"内部工具"变成"业务可消费的产品"。

> **本章的覆盖状态（如实标注）**：本章现有 4 个主题承接的是 **R5 的前两项 + 预测决策**；「智能 BI（NL2SQL）」与「精细化运营」中的**触达策略**两项，本章正文**没有单列主题**——它们目前分散在其他章节（见上表的指向）。这是**已知的覆盖缺口**，不是疏漏遗漏。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：数据架构师 / 产品架构师 / AI 架构师
- **前置章节**：[Ch4 · 企业级数据资产化与智能检索](../04-data-assetization/)（数据资产是产品的原料）；[Ch7 · AI 资产沉淀与自进化](../07-agent-evolution/)（自进化让产品越来越好）
- **后续章节**：[Ch10 · 行业智能体](../10-industry-agent/)（智能产品的行业化升级）；[Ch15 · 案例库](../15-case-studies/)（看真实产品案例）

## 本章要回答的核心问题

1. **智能标签体系怎么设计？** 事实标签（基础属性）/ 模型标签（行为偏好）/ 预测标签（流失概率）——三类标签的工程化链路？（见 [§04](./04-smart-tag-platform/04-smart-tag-platform.md)）
2. **标签平台怎么搭建？** 实时标签（流式计算）vs 离线标签（批处理）——如何平衡实时性与计算成本？（见 [§04 的「离线 / 在线同源」](./04-smart-tag-platform/04-smart-tag-platform.md)）
3. **智能 BI 怎么实现 NL2SQL？** Text2SQL / Text2Metrics / 自动洞察——从自然语言到可执行查询的全链路？（**本章正文未覆盖**；检索侧见 [Ch4 §05](../04-data-assetization/05-rag-architecture/05-rag-architecture.md)，Agent 化见 [Ch5 §01](../05-agent-platform/01-data-agent/01-data-agent.md)，评测基准见该主题 §5）
4. **精细化运营怎么设计？** 人群圈选、触达策略、A/B 实验、效果归因——如何用数据驱动业务决策？（**人群圈选**见 [§04](./04-smart-tag-platform/04-smart-tag-platform.md)；**A/B 与归因**见 [§02](./02-decision-intelligence/02-decision-intelligence.md)；**触达策略本章未覆盖**）
5. **预测决策系统怎么搭建？** 规则引擎 vs ML 模型 vs LLM Agent——不同决策场景的技术选型？（见 [§02](./02-decision-intelligence/02-decision-intelligence.md)）
6. **数据中台与数据网格（Data Mesh）怎么选？** 中心化 vs 联邦化——大型组织的"数据组织"难题？（见 [§03](./03-data-mesh/03-data-mesh.md)）
7. **AI 计算平台怎么设计？** 训练平台 / 推理平台 / 模型市场——把 AI 能力产品化？（见 [§01](./01-ai-compute/01-ai-compute.md)）

## 子主题

- [ ] **[AI 计算平台](./01-ai-compute/README.md)**：训练 / 推理 / 模型市场——AI 能力的产品化
- [ ] **[决策智能](./02-decision-intelligence/README.md)**：规则引擎 / ML 模型 / LLM Agent——预测决策系统的设计与实现
- [ ] **[数据网格（Data Mesh）](./03-data-mesh/README.md)**：领域驱动的数据所有权 / 自助式数据平台 / 联邦治理
- [ ] **[智能标签与标签平台](./04-smart-tag-platform/README.md)**：标签口径（事实 / 模型 / 预测）· 离线与实时同源 · 标签服务 · 准入等级与退役 · 人群圈选——把"这个实体是什么"做成可解释、可申诉、可治理的资产

> 文件命名建议：`ai-compute.md` / `decision-intelligence.md` / `data-mesh.md` / `intelligent-tagging.md` / `intelligent-bi-nl2sql.md` / `operation-platform.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 设计智能标签体系（事实 / 模型 / 预测三类），并搭建标签平台——[§04](./04-smart-tag-platform/04-smart-tag-platform.md)
- 选型实时 vs 离线标签的工程方案（Flink / Spark / 向量库）——[§04 的「离线 / 在线同源」与「选型决策树」](./04-smart-tag-platform/04-smart-tag-platform.md)
- 实现 NL2SQL / Text2Metrics，把自然语言转化为可执行查询——**本章未覆盖**（见 [Ch4 §05](../04-data-assetization/05-rag-architecture/05-rag-architecture.md) / [Ch5 §01](../05-agent-platform/01-data-agent/01-data-agent.md)）
- 设计精细化运营系统（人群圈选 / 触达策略 / 效果归因）——**人群圈选**见 [§04](./04-smart-tag-platform/04-smart-tag-platform.md)，**A/B 与归因**见 [§02](./02-decision-intelligence/02-decision-intelligence.md)，**触达策略本章未覆盖**
- 搭建预测决策系统（规则引擎 / ML / LLM Agent），并与业务系统集成——[§02](./02-decision-intelligence/02-decision-intelligence.md)
- 评估数据中台 vs 数据网格的取舍，给出组织级数据架构建议——[§03](./03-data-mesh/03-data-mesh.md)
- 搭建 AI 计算平台（训练 / 推理 / 模型市场），让 AI 能力产品化——[§01](./01-ai-compute/01-ai-compute.md)
- **把模糊业务问题转化为可量化指标**——这是数据智能产品的核心能力

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch10 · 行业智能体](../10-industry-agent/) 学习智能产品的行业化
- 进入 [Ch15 · 案例库](../15-case-studies/) 看真实数据智能产品案例