> 本文件是 **07-architecture-review.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](07-architecture-review.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：ATAM（Architecture Tradeoff Analysis Method）**

SEI 2000 提出的经典架构评审方法，9 步：

1. 介绍 ATAM（30 分钟）。
2. 介绍业务动机（30 分钟）。
3. 介绍架构（60 分钟）。
4. 识别架构方法（30 分钟）。
5. 生成质量属性效用树（60 分钟）。
6. 分析架构方法（120 分钟）。
7. 头脑风暴场景（60 分钟）。
8. 分析场景（60 分钟）。
9. 总结结果（30 分钟）。

**适用**：战略级 / 大型项目（首次架构评估）。

**模式 2：Lightweight Review（轻量评审）**

```
PR / Merge Request
  ↓
异步评审（Reviewer 在 PR 上写评论）
  ↓
Author 修改 → 重新评审
  ↓
合并
```

- **优点**：快速、低成本、可持续。
- **缺点**：缺乏深度、适合不复杂变更。
- **适用**：日常开发 / 小变更。

**模式 3：Formal Review（正式评审）**

```
架构师提报方案（RFC / Design Doc）
  ↓
预审（资深架构师 Review）
  ↓
正式评审会议（2 小时，5-8 人）
  ↓
决议（接受 / 修订 / 拒绝）
  ↓
ADR 归档
```

- **优点**：深度、多视角、可决策。
- **缺点**：耗时、低频。
- **适用**：重大变更 / 战略级。

**模式 4：AWS Well-Architected Review**

按 6 根支柱评审（Operation Excellence / Security / Reliability / Performance Efficiency / Cost Optimization / Sustainability）：

- 每个支柱用 Checklist 评审。
- 识别高风险项（High Risk Items, HRIs）。
- 输出改进建议。

**模式 5：Continuous Review（持续评审）**

把评审嵌入到架构生命周期：

```
架构设计 → RFC 评审 → 实施 Review（PR 级）→ 上线评审（Go-Live Review）→ 运营 Review（Postmortem / 季度评审）
```

- **优点**：覆盖全生命周期。
- **缺点**：流程重。
- **适用**：大型组织 / 关键系统。

**模式 6：Scenario-based Review（场景驱动评审）**

构造关键场景（如「双 11 大促」「数据库故障」「供应商宕机」），评审方案在场景下的表现。

- **优点**：实战导向。
- **缺点**：场景构造主观。
- **适用**：高可用 / 高一致性系统。

**模式 7：Pre-Mortem Review**

评审会议开始时，先做 Pre-Mortem：

- 假设 6 个月后方案失败。
- 所有参与者独立列举失败原因。
- 评估哪些可预防，修订方案。

**模式 8：Architecture Review Board**

跨团队架构委员会：

- 5-10 名资深架构师（含安全 / 数据 / 业务代表）。
- 每月 / 双周评审重大方案。
- 输出：架构白皮书、技术雷达、ADR 审批。

**模式 9：Lightweight ADR + Living Review**

把 ADR 与 PR Review 融合：

- ADR 是 RFC 的「轻量化版本」。
- PR Review 时检查 ADR 一致性。
- 持续 Review（Living）。

**模式 10：AI-assisted Review**

AI 辅助评审：

- LLM 自动检查 Checklist 完整性。
- LLM 识别常见反模式。
- AI 红队对抗攻击。
- 人类 Reviewer 把关。

### 3.2 适用场景决策表

| 评审类型 | 推荐方法 | 理由 |
| --- | --- | --- |
| 日常开发 | Lightweight Review（PR） | 快速 |
| 中型变更 | Formal Review + Checklist | 深度 |
| 战略级 / 大型 | ATAM | 完整 |
| 云架构 | AWS Well-Architected | 标准化 |
| 高可用系统 | Scenario-based Review | 实战 |
| 跨团队 | Architecture Board | 治理 |
| AI 智能体 | AI-assisted Review + Pre-Mortem | AI 特有 |

### 3.3 反模式与陷阱

1. **「走过场」**：评审只是流程，无人真评。**强制 Reviewer 写实质意见**。
2. **「一言堂」**：某权威定调，无人挑战。**强制 Devil's Advocate + 匿名投票**。
3. **「标准不一」**：每个 Reviewer 标准不同。**标准化 Checklist**。
4. **「评审滞后」**：实施到一半才评审。**评审前置到 RFC 阶段**。
5. **「无决议」**：讨论很多但无决策。**强制决议（接受 / 修订 / 拒绝）**。
6. **「无人跟进」**：评审意见无 Follow-up。**Follow-up Action 强制 Owner + 截止日期**。
7. **「群体思维」**：评审会无人异议。**强制反对意见**。
8. **「业务方缺席」**：纯技术评审，忽略业务。**强制业务方 Reviewer**。
9. **「AI 滥用」**：AI 自动通过所有评审。**AI 辅助 + 人类把关**。
10. **「形式主义 Checklist」**：Checklist 走过场。**强制每项有结论**。

---
