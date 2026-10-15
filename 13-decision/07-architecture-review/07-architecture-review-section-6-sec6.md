> 本文件是 **07-architecture-review.md** 的子文件（§6. 落地实践）。完整章节请回到 [index](07-architecture-review.md)。

## 6. 落地实践

### 6.1 真实案例

**案例 1：Amazon 的 Bar Raiser Review**

Amazon 的 Bar Raiser Review 是业界著名的架构评审实践：

- 每个重要决策必须 Bar Raiser Reviewer（资深员工，独立于团队）。
- Reviewer 用 Amazon Leadership Principles + 技术原则评估。
- Reviewer 有权拒绝（即使团队同意）。
- 关键：Reviewer 独立性 + 严格标准。

**案例 2：Google 的 Design Review**

Google 的 Design Review 实践：

- 大型项目必须经过 2-3 轮 Design Review。
- Reviewer 包括架构师 + 安全 + SRE + 业务代表。
- 必须 ADR 记录。
- 关键：多轮 + 多角色 + ADR。

**案例 3：阿里巴巴的 521 架构评审**

阿里在大促前的架构评审：

- 大促前 3 个月：所有架构变更必须通过架构评审。
- 评审委员会 5-10 人，含资深架构师 + 业务代表。
- 评审 Checklist 含 521 项检查点。
- 关键：强制性 + 标准化 + 业务驱动。

**案例 4：Microsoft 的 Architecture Review Board**

微软 Azure 的 ARB：

- 所有 Azure 服务必须 ARB Review。
- Reviewer 跨团队（架构师 + 安全 + SRE + 业务）。
- 输出：架构白皮书 + 最佳实践。
- 关键：跨团队 + 标准化 + 持续治理。

### 6.2 踩坑与经验

1. **「走过场」**：评审只是流程。**强制 Reviewer 写实质意见**。
2. **「一言堂」**：权威定调。**强制 Devil's Advocate + 匿名投票**。
3. **「标准不一」**：Reviewer 标准不同。**标准化 Checklist**。
4. **「评审滞后」**：实施到一半。**评审前置到 RFC**。
5. **「无决议」**：讨论多无决策。**强制决议（接受 / 修订 / 拒绝）**。
6. **「无人跟进」**：Follow-up 无主。**强制 Owner + 截止日期**。
7. **「群体思维」**：评审无人异议。**强制反对意见**。
8. **「业务方缺席」**：纯技术评审。**强制业务方 Reviewer**。
9. **「AI 滥用」**：AI 自动通过。**AI 辅助 + 人类把关**。
10. **「形式主义 Checklist」**：走过场。**强制每项有结论**。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（10 人以下团队）**：

- Lightweight Review（PR）；
- 评审 Checklist 入门；
- ADR 强制。

**1→10（10-50 人）**：

- Formal Review 流程；
- 评审委员会（月度）；
- AI 辅助评审（GitHub Copilot PR Review）；
- Pre-Mortem 集成。

**10→100（50+ 人）**：

- ATAM（战略级）；
- Architecture Review Board；
- AI 辅助 + 持续评审；
- 评审历史 KG；
- 季度架构评审（Architecture Board）。

### 6.4 ROI 评估

**直接收益**：

- 架构腐烂减少：40-60%；
- 重大事故减少：30-50%；
- 跨团队对齐效率：50%+；
- 决策可被未来质疑（ADR）。

**间接收益**：

- 组织架构治理能力沉淀；
- 团队架构能力提升；
- 跨团队协作文化；
- 战略对齐。

**成本**：

- 流程成本：每次评审 +1-2 小时；
- 工具成本：低（GitHub / Confluence 已足够）；
- 培训成本：内部 Workshop。

---
