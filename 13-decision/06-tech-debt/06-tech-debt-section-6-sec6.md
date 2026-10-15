> 本文件是 **06-tech-debt.md** 的子文件（§6. 落地实践）。完整章节请回到 [index](06-tech-debt.md)。

## 6. 落地实践

### 6.1 真实案例

**案例 1：Stripe 技术债报告（2018）**

Stripe 2018 年发布开发者体验报告，指出开发者 33% 时间在处理技术债。报告推动了整个行业对技术债的关注。

**案例 2：Amazon 的「Working Backwards + Tech Debt」**

Amazon 在每个项目 Pre-Mortem 中识别技术债：

- 决策时同步评估技术债增量；
- 技术债预算（每 Sprint 20% 容量用于还债）；
- 季度技术债 Review。

**案例 3：Google 的「Code Health」指标**

Google 内部 Code Health 指标：

- 覆盖率 / 复杂度 / 重复率 / 测试稳定性。
- 团队级 Code Health 评分；
- 与绩效挂钩。

**案例 4：阿里巴巴的 521 架构治理（双 11）**

阿里在双 11 大促前的技术债治理：

- 大促前 3 个月：技术债清零（核心路径）。
- 大促中：禁止合并技术债。
- 大促后：还债 + 复盘。

**案例 5：Netflix 的「自由与责任」文化**

Netflix 文化中：

- 团队自主决定技术债优先级；
- 通过 Performance Review 倒逼还债；
- 高绩效团队技术债健康。

### 6.2 踩坑与经验

1. **「看不见技术债」**：只关注功能，忽视质量。**Tech Debt Map + 定期盘点**。
2. **「无限拖延」**：「等有时间就还」。**强制 Tech Debt Sprint**。
3. **「过度还债」**：业务停滞。**Tech Debt Budget + 优先级**。
4. **「业务方不理解」**：沟通失败。**翻译成业务成本（利息）**。
5. **「沉没成本陷阱」**：旧代码不值得还债但坚持。**评估还债 ROI**。
6. **「AI 债忽视」**：AI 应用特有技术债。**AI Tech Debt 治理**。
7. **「不量化」**：无法优先级。**强制 SQALE**。
8. **「无 Owner」**：技术债列了但没人负责。**每条必须有 Owner**。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（10 人以下团队）**：

- Tech Debt Backlog（Jira / GitHub Issue）；
- SonarQube 入门；
- Code Quality Gates 入门；
- 每季度 1 个 Tech Debt Sprint。

**1→10（10-50 人）**：

- Tech Debt Map 可视化；
- SQALE 量化；
- Tech Debt Budget（团队级）；
- Tech Debt Review 季度会议；
- AI 辅助识别。

**10→100（50+ 人）**：

- 组织级 Tech Debt 战略；
- Tech Debt Graph；
- AI Tech Debt 治理；
- Tech Debt 绩效挂钩；
- AI 自动还债（LLM 辅助重构）。

### 6.4 ROI 评估

**直接收益**：

- 开发效率提升：30-50%；
- 故障率下降：40-60%；
- 新人上手时间缩短：50%；
- 业务连续性提升（大促零故障）。

**间接收益**：

- 团队士气提升；
- 招聘卖点；
- 技术品牌；
- 战略自主性。

**成本**：

- 工具成本：低（SonarQube 社区版免费）；
- 时间成本：每季度 10-20% 容量；
- 培训成本：内部 Workshop。

---
