> 本文件是 **09-cross-team-decision.md** 的子文件（§6. 落地实践）。完整章节请回到 [index](09-cross-team-decision.md)。

## 6. 落地实践

### 6.1 真实案例

**案例 1：Google 的 Site Reliability Engineering 决策模式**

Google SRE 推崇「把决策推给最接近问题的人」：
- 团队级决策：团队自主。
- 跨团队决策：SRE Lead 协商。
- 组织级决策：Architecture Board。
- 关键：决策权下放 + 升级机制明确。

**案例 2：Amazon 的 Working Backwards + 升级机制**

Amazon 用 PR/FAQ + 升级机制做跨团队决策：
- 决策前：写 PR/FAQ。
- 决策阻塞：升级到 VP。
- 关键：决策权清晰 + 数据驱动。

**案例 3：CNCF 的跨组织治理**

CNCF（云原生计算基金会）作为联邦化治理典范：
- 各项目独立决策（自治）。
- 跨项目议题通过 TOC（Technical Oversight Committee）治理。
- 关键：Federation Agreement + 委员会机制。

**案例 4：阿里巴巴的架构委员会**

阿里巴巴集团架构委员会（2018+）：
- 集团 10+ 资深架构师组成。
- 每月评审重大架构决策。
- 输出：技术雷达、白皮书、组织级 ADR。
- 关键：架构委员会 + RFC + ADR 闭环。

**案例 5：Spotify 的 Squad / Tribe 模型**

Spotify 跨团队决策模型：
- Squad 自主决策。
- Tribe 内跨 Squad 协调。
- Guild 跨 Tribe 协调。
- Chapter 同专业对齐。
- 关键：自治 + 多层协调。

### 6.2 踩坑与经验

1. **「无人拍板」**：多个 Owner，没有最终决策者。**强制 RACI 中 A 只有 1 人**。
2. **「一言堂」**：老板定调，无人敢反对。**匿名投票 + Devil's Advocate**。
3. **「扯皮会」**：决策会被无限拖延。**设截止日期 + Escalation 机制**。
4. **「形式评审」**：走过场。**强制 Reviewer 写「反对意见」**。
5. **「忽视 Informed」**：决策后没通知相关人。**强制 I 环节**。
6. **「群体思维」**：决策会上无人反对。**强制 Devil's Advocate + 匿名投票**。
7. **「官僚化」**：所有决策都要走 4 周流程。**按风险分级（Type 1 / Type 2）**。
8. **「无人 Review」**：跨团队决策只在自己组评审。**强制跨组 Reviewer**。
9. **「决策不写 ADR」**：决策过程不可追溯。**强制 ADR 归档**。
10. **「Stakeholder 识别遗漏」**：漏掉关键 Stakeholder。**用 AI 辅助 + 多人 review**。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（10 人以下团队）**：

- RACI 模板 + ADR 起步；
- 跨团队决策 PR 化 + Reviewer 制度。

**1→10（10-50 人）**：

- DACI 框架 + RFC 流程；
- Stakeholder Map 工具；
- Escalation 机制（Level 1-2）；
- 跨团队 Standup。

**10→100（50+ 人）**：

- Architecture Board；
- 组织级 RFC + ADR 平台；
- 跨团队沟通机制（Slack 频道 + 月度分享会）；
- AI 辅助 Stakeholder 分析 + RFC 起草。

**100+（500+ 人 / 多 BU）**：

- Federation 治理；
- 组织级决策图谱；
- 跨 BU 共识工作坊；
- AI 协调员。

### 6.4 ROI 评估

**直接收益**：

- 跨团队冲突减少：50-70%；
- 决策速度提升（避免扯皮）：30-50%；
- 决策可执行性提升：40-60%；
- 跨团队对齐效率提升：50%+。

**间接收益**：

- 组织决策能力沉淀；
- 减少「老板一言堂」；
- 跨团队协作文化；
- 战略对齐。

**成本**：

- 流程成本：每条跨团队 RFC 需多 1-2 小时；
- 工具成本：低（Jira / Slack / Miro 已足够）；
- 培训成本：内部 Workshop。

---
