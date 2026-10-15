> 本文件是 **09-failure-cases.md** 的子文件（§4. FailOps 失败运营方法论）。完整章节请回到 [index](09-failure-cases.md)。

## 4. FailOps 失败运营方法论

### 4.1 什么是 FailOps

FailOps 是从 SRE（Site Reliability Engineering）演化而来的"失败运营"实践，核心理念是"**把失败当常态，主动发现失败并恢复**"。

### 4.2 FailOps 关键实践

#### 4.2.1 混沌工程（Chaos Engineering）

- **核心理念**：主动在生产环境注入故障，验证系统韧性。
- **代表工具**：Chaos Monkey、ChaosBlade、Gremlin。
- **应用场景**：
  - 验证容灾切换。
  - 验证熔断机制。
  - 验证限流机制。

#### 4.2.2 应急响应（Incident Response）

- **关键流程**：
  - 检测（Detection）：监控系统检测异常。
  - 响应（Response）：应急小组响应。
  - 缓解（Mitigation）：采取措施缓解。
  - 恢复（Recovery）：恢复正常。
  - 复盘（Postmortem）：总结教训。
- **关键岗位**：
  - Incident Commander：指挥官。
  - Communications Lead：沟通。
  - Operations Lead：操作。
  - Subject Matter Expert：领域专家。

#### 4.2.3 复盘（Postmortem）

- **核心理念**：**"无指责"（Blameless）复盘**——找到根因，不追究个人。
- **关键输出**：
  - 时间线（Timeline）。
  - 根因分析（Root Cause）。
  - 教训（Lessons Learned）。
  - 改进项（Action Items）。
- **关键约束**：
  - 必须在 1–2 周内完成。
  - 必须有具体改进项。
  - 改进项必须有 owner 和 deadline。

#### 4.2.4 主动防御

- **预演**：定期演练应急流程。
- **灰度发布**：所有变更灰度。
- **熔断 + 降级**：必须有熔断降级机制。
- **回退机制**：必须有回退方案。

### 4.3 FailOps 工具链

- **混沌工程**：Chaos Monkey / ChaosBlade / Gremlin。
- **监控**：Prometheus / Grafana / Datadog。
- **告警**：PagerDuty / OpsGenie。
- **应急沟通**：Zoom / 钉钉 / Slack。
- **复盘文档**：Confluence / Notion。
- **变更管理**：Spinnaker / Argo CD / Jenkins。

---
