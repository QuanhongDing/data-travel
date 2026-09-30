# Ch6 · DataAgent

> **一句话定位**：如何让 AI Agent 安全、可控、可审计地操作数据。

## 基本信息

- **难度**：★★★★★
- **推荐角色**：AI 应用工程师、架构师
- **前置章节**：[Ch5 · 数据服务能力平台](../05-data-service-platform/)（建议）
- **后续章节**：[后记 · 趋势与思考](../99-outro/)

## 本章要回答的核心问题

1. DataAgent 的边界在哪里？它和「直接让 LLM 跑 SQL」有什么区别？
2. 单 Agent vs Multi-Agent、MCP vs Function Calling 该怎么选？
3. Text-to-SQL 的常见陷阱与防御策略是什么？
4. 如何把「指标平台」作为 Agent 的工具，而不是「万能 SQL 工具」？

## 子主题（占位）

- [ ] **原理与概念**：Agent 架构（Plan-Execute-Observe-Reflect）、Tool Calling / MCP、Text-to-SQL、Query Agent / Insight Agent / Metric Agent、Human-in-the-Loop、Guardrails
- [ ] **架构决策**：单 Agent vs Multi-Agent；MCP vs Function Calling；SQL 生成 vs 语义层指标
- [ ] **实战搭建**：基于 MCP + 查询网关搭一个「业务问数 Agent」；含权限 / SQL 校验 / 结果解释
- [ ] **调优与踩坑**：Prompt Engineering、Self-Correction、错误恢复、可观测
- [ ] **参考架构与小结**：DataAgent 的安全边界与落地路径

> 文件命名建议：`principles.md` / `architecture.md` / `hands-on.md` / `tuning.md` / `summary.md` / `refs.md`。

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 进入 [后记 · 趋势与思考](../99-outro/)
