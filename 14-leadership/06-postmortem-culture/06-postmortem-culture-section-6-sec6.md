> 本文件是 **06-postmortem-culture.md** 的子文件（§6. 落地实践）。完整章节请回到 [index](06-postmortem-culture.md)。

## 6. 落地实践

### 6.1 真实案例

**案例 1：Google SRE 的 Blameless Postmortem**

- **背景**：Google 自 2003 年建立 SRE 团队，Blameless Postmortem 是其核心实践。
- **做法**：
  - 所有故障必须 24 小时内 Postmortem。
  - 公开 Postmortem（Google SRE 官网）。
  - 聚焦系统、避免指责任。
  - Action Items 必须可执行、可验证。
- **效果**：Google 99.99%+ 可用性、组织学习能力行业标杆。

**案例 2：Etsy 的 Blameless 文化**

- **背景**：Etsy 2012 年由 John Allspaw 推行 Blameless Postmortem。
- **做法**：
  - 明确「**Postmortem ≠ 追责**」。
  - 5 Whys 找到根因。
  - Action Items 跟踪闭环。
- **效果**：Etsy 团队心理安全、故障响应速度行业领先。

**案例 3：Netflix 的 Chaos + Postmortem**

- **背景**：Netflix 自 2011 年推行 Chaos Engineering + Blameless Postmortem。
- **做法**：
  - Chaos Monkey 主动注入故障。
  - Postmortem + Just Culture。
  - Action Items 30 天闭环。
- **效果**：Netflix 在 AWS 上稳定运行、故障响应极快。

**案例 4：阿里巴巴 3721 原则**

- **背景**：阿里故障响应的「**3721 原则**」。
- **做法**：
  - **3 分钟**：On-call 必须 3 分钟内响应。
  - **7 分钟**：30 分钟内定位根因。
  - **2 小时**：4 小时内恢复（不同等级）。
  - **1 天**：24 小时内 Postmortem。
- **效果**：阿里大促稳定性行业领先。

### 6.2 踩坑与经验

**踩坑 1：追责文化盛行**

- **原因**：传统 IT / 国企文化。
- **经验**：
  - **高管公开示范**：CEO 公开分享自己的失误。
  - **明确制度**：复盘 ≠ 追责。
  - **奖惩脱钩**：复盘不直接影响绩效。

**踩坑 2：Action Items 不闭环**

- **原因**：没有跟踪机制。
- **经验**：
  - **跟踪看板**：每周 Review。
  - **30/60/90 天复盘**。
  - **Owner + Due Date 必须明确**。

**踩坑 3：故障重复发生**

- **原因**：知识没沉淀。
- **经验**：
  - **知识图谱化**：Postmortem 作为 RAG 知识库。
  - **新员工 Onboarding**：必读近 6 个月 Postmortem。
  - **Runbook 维护**。

**踩坑 4：过度复盘**

- **原因**：每次故障都长篇大论。
- **经验**：
  - **分级复盘**：P0/P1 详细、P2 简化、P3 可选。
  - **时间控制**：≤ 1 小时。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（0-10 人）**：

1. 简化 Postmortem 流程。
2. 关键故障做 Postmortem。
3. 故障知识靠经验口耳相传。

**1→10（10-50 人）**：

1. 建立 On-call + War Room。
2. Postmortem 模板 + Action Items 跟踪。
3. 故障知识库（Confluence / Notion）。

**10→100（50-200 人）**：

1. AI 辅助复盘。
2. 故障知识图谱 + RAG。
3. 跨团队故障共享。

### 6.4 ROI 评估

**投入**：

- On-call 团队：5-10 人轮班。
- Postmortem 工具：PagerDuty + Confluence（¥100/人/年）。
- AI 工具：Rootly / Incident.io（~$20/人/年）。

**产出**：

- **故障率下降**：成熟复盘文化可使故障率下降 30-50%。
- **MTTR 缩短**：从小时级到分钟级。
- **组织学习**：故障不重复发生。
- **心理安全**：团队幸福感提升。

**评估指标**：

| 指标 | 行业基线 | 优秀水平 |
| --- | --- | --- |
| P0 故障率 | 季度 1-2 次 | 半年 1 次 |
| MTTR（P0） | 1-4 小时 | < 30 分钟 |
| Action Items 闭环率 | 50-60% | 90%+ |
| 故障重复率 | 10-20% | < 5% |
| Postmortem 公开率 | 20-30% | 80%+ |

---
