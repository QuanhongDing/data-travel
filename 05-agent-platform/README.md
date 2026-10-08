# Ch5 · AI 智能体平台架构

> **一句话定位**：企业级私有化 AI 智能体平台从 0 到 1——安全可控 / 可编排 / 自进化的整体架构。

## 画像映射

本章对应 **核心职责① AI 智能体平台整体架构**：

- 私有化部署、企业级 AI 基础设施 0→1
- 安全可控、可编排、自进化的平台能力
- 智能体架构（ReAct / Plan-Execute / Reflexion）、框架（LangChain / AutoGPT / OpenClaw）、MCP 协议

> P7 会"接 API 调 Agent"，P8 会"搭 Agent Demo"，**资深架构师会"建企业级 Agent 平台"**——把单 Agent 编排成可生产、可治理、可演进的企业平台。

## 基本信息

- **难度**：★★★★★
- **推荐角色**：AI 架构师 / 平台架构师 / 技术负责人
- **前置章节**：[Ch4 · 企业级数据资产化与智能检索](../04-data-assetization/)（Agent 依赖 RAG 与数据资产）
- **后续章节**：[Ch6 · 多模型编排与工具调用](../06-multi-model/)（Agent 的核心调度层）；[Ch7 · AI 资产沉淀与自进化](../07-agent-evolution/)（自进化闭环）

## 本章要回答的核心问题

1. **智能体（Agent）的核心架构模式有哪些？** ReAct / Plan-Execute / Reflexion / Multi-Agent 各自的适用场景与边界？
2. **智能体框架怎么选型？** LangChain / LangGraph / AutoGPT / AutoGen / OpenClaw / CrewAI——能力差异与生产可用性？
3. **MCP（Model Context Protocol）协议怎么落地？** 工具（Tool）/ 资源（Resource）/ 提示（Prompt）三件套的标准化接入？
4. **单 Agent vs Multi-Agent 怎么取舍？** 集中式编排 vs 去中心化协同——任务可分解性、调试复杂度、可观测性？
5. **私有化部署 vs SaaS 怎么选？** 国产化适配、网络隔离、数据合规——企业级硬约束如何满足？
6. **Agent 的可靠性如何保障？** Prompt 工程、Token 成本、可观测性、容错与重试、Hallucination 抑制？
7. **工具调用（Function Calling / Tool Use）怎么设计？** JSON Schema 标准化、参数校验、副作用隔离、权限控制？

## 子主题

- [ ] **[Data Agent](./01-data-agent.md)**：面向数据分析的智能体（Text2SQL + 数据可视化 + 指标解读），AI 时代数据架构师的核心交付物

> 文件命名建议：`data-agent.md` / `agent-architecture.md` / `langchain-framework.md` / `mcp-protocol.md` / `multi-agent-orchestration.md` / `function-calling.md` / `prompt-engineering.md` / `reliability-and-observability.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 区分单 Agent 与 Multi-Agent 模式，并选择合适的智能体架构（ReAct / Plan-Execute / Reflexion）
- 在 LangChain / AutoGPT / OpenClaw 等框架间做出选型决策
- 落地 MCP 协议，实现工具 / 资源 / 提示的标准化接入
- 设计 Function Calling 的工具链（JSON Schema / 参数校验 / 副作用隔离）
- 把 Demo 级的 Agent 编排成可生产的企业级平台（可靠性 / 可观测 / 成本）
- 满足私有化部署的国产化、网络隔离、数据合规要求
- **从单 Agent 到企业级 Agent 平台**——这是 AI 时代架构师的核心交付能力

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch6 · 多模型编排与工具调用](../06-multi-model/) 学习多模型路由
- 进入 [Ch7 · AI 资产沉淀与自进化](../07-agent-evolution/) 学习自进化闭环
