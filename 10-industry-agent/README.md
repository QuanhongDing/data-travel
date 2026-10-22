# Ch10 · 行业智能体

> **一句话定位**：把通用 AI 变成**懂行业的 AI**——行业情报 / 代码助手 / 办公自动化的垂直行业智能体。

## 画像映射

本章对应 **核心职责⑤ 行业情报智能体与精准分发** + **加分项（行业 AI 智能体 / 代码智能助手 / 自动化办公平台）**：

- 7×24h 自动化情报采集 / 清洗 / 语义分类 / AI 摘要 / 个性化推送 —— 见 [§02 行业情报智能体](02-industry-intelligence-agent/02-industry-intelligence-agent.md)
- 代码智能助手（类似 Cursor / Copilot）、自动化办公平台 —— 见 [§03 代码智能助手](03-code-intelligence-assistant/03-code-intelligence-assistant.md) 与 [§04 办公自动化智能体](04-office-automation-agent/04-office-automation-agent.md)
- 行业知识图谱、行业 Prompt 工程、行业评估体系 —— 本章不单列主题，做法分别落在 [Ch1 §06 知识图谱构建](../01-modeling/06-knowledge-graph/06-knowledge-graph.md)、各主题 §4 的模板与提示示例、[Ch2 §07 效果评估](../02-data-science/07-eval/07-eval.md)
- 行业 Agent 协作（Multi-Agent）—— 本章不单列主题：多 Agent 仲裁在本书按判据评为 L3（无通行做法），见 [Ch5 §02 平台架构的前沿演进一节](../05-agent-platform/02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md)

> P7 会"做 Agent"，P8 会"做垂直 Agent"，**资深架构师会"做行业智能体平台"**——把通用能力变成行业生产力。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：AI 架构师 / 行业专家 + 技术 Leader
- **前置章节**：[Ch5 · AI 智能体平台架构](../05-agent-platform/)（行业 Agent 建立在通用 Agent 之上）；[Ch9 · 数据智能产品](../09-data-intelligence-product/)（行业产品化的基础）
- **后续章节**：[Ch11 · 横切工程](../11-cross-cutting/)（行业级可观测）；[Ch15 · 案例库](../15-case-studies/)（看真实行业案例）

## 本章要回答的核心问题

1. **行业知识图谱怎么构建？** ——**本书不按行业给出实体关系建模差异**（金融 / 医疗 / 制造 / 半导体的行业事实无公开可溯源材料，本书不编）。本章给的是**可迁移的构建方法与判据**，见 [Ch1 §06 知识图谱构建](../01-modeling/06-knowledge-graph/06-knowledge-graph.md)；行业特有的实体与关系需你从自有业务语料中抽取。
2. **行业情报智能体怎么搭建？** 7×24h 采集、清洗、分类、摘要、推送——端到端情报流水线？
3. **行业 Prompt 怎么设计？** 行业术语、行业规范、行业禁忌——把通用 Prompt 变成行业 Prompt？
4. **行业评估体系怎么搭？** 行业准确性、合规性、可解释性——如何量化"懂行"的程度？**本书给的是评估口径的搭法**（把通用指标迁到行业轴上），**不给具体行业的准确率基线**——基线只能由你自己的标注样本产出。
5. **代码智能助手怎么实现？** 类似 Cursor / Copilot——代码补全、代码生成、代码审查、Code Agent？
6. **自动化办公平台怎么设计？** 文档处理 / 流程审批 / 数据录入 / 跨系统集成——让 AI 替代重复性工作？
7. **多模态 AI 怎么落地？** 文 / 图 / 音 / 视频 / 3D——多模态理解与生成的工程化？

## 子主题

- [ ] **[多模态 AI](./01-multimodal-ai/README.md)**：文 / 图 / 音 / 视频 / 3D——多模态理解与生成的工程化
- [ ] **[行业情报智能体](02-industry-intelligence-agent/02-industry-intelligence-agent.md)**：7×24 情报链路——信源清单与授权边界、增量与断供检测、事件簇去重、带引用回指的摘要、频控与个性化分发、反馈回流
- [ ] **[代码智能助手](03-code-intelligence-assistant/03-code-intelligence-assistant.md)**：以仓库为语料——补全的延迟与接受率、符号与引用索引、上下文预算、审查的规则与模型分工、沙箱验证、私有代码不出域
- [ ] **[办公自动化智能体](04-office-automation-agent/04-office-automation-agent.md)**：文档结构抽取与字段级置信度、流程状态机与审批留痕、幂等与补偿动作、RPA 与 Agent 的分工、权限与出网合规、介入率与返工率

> 文件命名建议：`multimodal-ai.md` / `industry-intelligence-agent.md` / `code-intelligence-assistant.md` / `office-automation.md` / `industry-knowledge-graph.md` / `industry-prompt-engineering.md` / `industry-evaluation.md` / `multi-agent-collaboration.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 构建行业知识图谱**的方法与判据**（行业特有的实体与关系需从自有业务语料抽取——本书不按行业给实体清单）
- 搭建行业情报智能体（7×24h 采集 / 清洗 / 分类 / 摘要 / 推送）
- 设计行业 Prompt（术语 / 规范 / 禁忌），让 AI 真正"懂行"
- 搭建行业评估体系（把准确性 / 合规性 / 可解释性迁到行业轴上；行业基线需自建样本）
- 实现代码智能助手（代码补全 / 生成 / 审查 / Code Agent）
- 设计自动化办公平台（文档 / 审批 / 数据录入 / 跨系统集成）
- 落地多模态 AI（文 / 图 / 音 / 视频 / 3D）的工程化能力
- **把通用 AI 变成懂行业的 AI**——这是行业智能体的核心价值

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch11 · 横切工程](../11-cross-cutting/) 学习行业级可观测与血缘
- 进入 [Ch15 · 案例库](../15-case-studies/) 看真实行业智能体案例
