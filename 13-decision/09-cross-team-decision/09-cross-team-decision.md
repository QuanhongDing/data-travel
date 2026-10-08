# 跨团队技术决策（Cross-Team Decision Making）

> **一句话定位**：RACI + RFC + 委员会 + 共识构建——让跨团队决策从「扯皮」变成「可治理」。

> 本文是 data-travel 项目 [Ch13 · 决策与权衡](../../README.md) 的子章节（**09 跨团队技术决策**）。覆盖 R6 工程能力（决策维度）中「**组织级技术决策流程**」相关的理论、流程、模式与 AI 时代演进。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 跨团队决策为什么难？ | §1.2 |
| RACI / DACI / RAPID 怎么用？ | §2.1 / §3 |
| RFC / 委员会 / 共识怎么搭？ | §4 |
| 跨团队冲突怎么解？ | §4.3 |
| AI 时代跨团队决策有什么新趋势？ | §5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：跨团队决策（Cross-Team Decision Making）研究多个团队（跨职能 / 跨 BU / 跨地域）如何在共享目标、信息不完全、利益冲突的环境下达成可执行的决策。涉及组织行为学（Organizational Behavior）、管理学（Management Science）、博弈论（Game Theory）三个学科。

**工程定义**：在数据架构师手里，跨团队决策是一套**「把分散的决策权 + 利益冲突 + 信息盲区对齐到可执行结果」的工程实践**，包含三个核心要素：

1. **决策权分配**：谁拍板（Accountable）？谁执行（Responsible）？谁被咨询（Consulted）？谁被通知（Informed）？——RACI。
2. **决策流程**：RFC → 评审 → 投票 → 接受 → ADR 归档。
3. **共识构建**：利益相关方管理、冲突解决、共识机制。

### 1.2 为什么需要

**业务 / 工程痛点**：

- **「A 团队选 Kafka，B 团队选 Pulsar，互通时互转」**——缺乏组织级选型决策。
- **「数据团队建了指标体系，业务团队不用，半年后没人维护」**——缺乏业务咨询。
- **「性能优化推不动，因为影响其他团队的 SLA」**——缺乏跨团队权衡。
- **「三个团队都想当 owner，结果谁都不做」**——决策权不清晰。
- **「老板一言堂，无人敢反对」**——缺乏多元化 Reviewer。
- **「决策做出但执行不下去，因为没被通知的人不配合」**——缺乏 Informed 环节。

**为什么是「资深架构师」的核心能力**：

- P5/P6：写代码——关注「代码正确」。
- P7：模块——关注「模块设计合理」。
- P8：系统——关注「系统稳定」。
- **资深架构师 / 准资深架构师：关注「跨组织可执行」——这是跨团队决策的本质**。

### 1.3 在 AI 时代数据架构中的位置

```
       ┌─────── Ch13 · 决策与权衡 ───────┐
       │                                  │
       │  ADR(01) ←── 跨团队决策(09)      │
       │   ↓           ↓                  │
       │ 评审(07) ←─ 跨团队决策(09)       │
       │   ↓           ↓                  │
       │ 战略(05) ←── 跨团队决策(09)      │
       │                                  │
       └──────────────────────────────────┘
                       ↓
            跨团队决策是「决策的组织载体」
```

**与其他子主题的关系**：

- **ADR（01）**：跨团队决策的最终产物往往是一份组织级 ADR。
- **架构评审（07）**：评审会议是跨团队决策的重要载体。
- **技术战略（05）**：3-5 年路线图需要跨团队共识。
- **决策心理学（08）**：群体思维、权威偏误是跨团队决策的常见陷阱。
- **风险评估（04）**：跨团队风险需要共享 Risk Register。

**一句话判断**：**「能做技术决策的是 P8，能做跨组织技术决策的是资深架构师——跨团队决策是个人能力升级为组织能力的关键」**。

### 1.4 演进历程

- **1950s-1960s**：组织行为学奠基（McGregor X-Y 理论）。
- **1970s**：DACI / RAPID 决策框架提出（Bain & Company）。
- **1980s-1990s**：RACI 矩阵广泛应用于项目管理（PMI）。
- **2000s**：敏捷开发推动轻量级决策（Scrum、SAFe）。
- **2010s**：开源治理模式（Linux Foundation、CNCF）的跨组织决策实践。
- **2014**：Google「Site Reliability Engineering」把决策推给「最接近问题的人」。
- **2018**：Spotify Squad / Tribe / Chapter / Guild 模型成熟。
- **2020**：GitHub / GitLab 的 RFC + ADR 流程成为开源 / 互联网公司主流。
- **2022-2024**：架构委员会（Architecture Board）+ 跨团队 RFC 平台普及。
- **2024-2025**：AI 辅助跨团队决策（AI 协调员、AI 共识构建）。

---

## 2. 核心原理

### 2.1 关键概念定义

- **RACI Matrix**：决策权分配矩阵——Responsible / Accountable / Consulted / Informed。
- **DACI**：Driver / Approver / Contributor / Informed（Atlassian 推广）。
- **RAPID**：Recommend / Agree / Provide input / Decide（Bain & Company）。
- **Stakeholder Management**：利益相关方管理——识别 + 分析 + 沟通。
- **Consensus Building**：共识构建——寻找「所有人都能接受」的方案。
- **RFC（Request For Comments）**：跨团队决策的「提议文档」。
- **Architecture Board（架构委员会）**：跨团队技术决策的治理机构。
- **Tech Radar（技术雷达）**：组织级技术选型指南（ThoughtWorks 风格）。
- **Decision Authority（决策权）**：对决策负最终责任的权力。
- **Delegation of Authority（授权）**：把决策权下放给更接近问题的人。
- **Conflict Resolution（冲突解决）**：跨团队冲突的解决机制。
- **Decision Owner**：决策的最终负责人（与 ADR 中的 Deciders 区分）。
- **Vote / Voting**：决策方式（多数 / 一致 / 加权 / 资深）。
- **Escalation（升级）**：决策被阻塞时向上升级。
- **Decision Log**：决策日志（与 ADR 互补）。
- **Cross-functional Team（跨职能团队）**：产品 / 工程 / 设计 / 数据 / 安全 等跨职能。
- **Federation（联邦化）**：多个独立组织协同决策（开源社区、数据网格）。
- **Working Backwards（逆向工作法）**：从客户体验反推决策（Amazon）。
- **Steering Committee（指导委员会）**：跨团队决策的治理机构。
- **Decision Framework（决策框架）**：决策方法论（如 DACI、RAPID、CACI）。

### 2.2 数学 / 形式化基础

**决策权分配（Mathematical Perspective）**：

- **集中决策**：信息集中处理，效率高但易失真。
- **分散决策**：信息本地化，但易碎片化。
- **最优决策权分配 = 信息 × 激励 × 协调成本**（Williamson 交易成本理论）。

**投票机制**：

- **简单多数**：50%+1，决策快但易被多数压制少数。
- **绝对多数**：2/3 或 3/5，更稳健但决策慢。
- **加权投票**：按 stake 加权，平衡利益。
- **一致同意**：所有人同意，最稳健但易瘫痪。

**博弈论视角**：

- **Nash Equilibrium（纳什均衡）**：所有人不改变策略的状态。
- **Pareto Optimal（帕累托最优）**：无人能在不损他人情况下改善自己。
- **囚徒困境**：跨团队决策中常见——局部最优 vs 全局最优。

**共识算法**：

- **Raft / Paxos**：分布式系统中的共识算法（启发跨团队共识机制）。
- **Quorum（法定人数）**：跨团队决策的最低参与人数。

### 2.3 关键算法 / 方法

虽然跨团队决策不是算法，但有一些方法：

1. **RACI 矩阵**：决策权分配。
2. **DACI 框架**：Atlassian 决策框架。
3. **RAPID 决策框架**：Bain 决策框架。
4. **Vroom-Yetton Decision Model**：决策风格（独裁 vs 协商 vs 共识）。
5. **Stakeholder Power-Interest Grid**：利益相关方权力 × 兴趣矩阵。
6. **Consensus Building Workshop**：共识工作坊。
7. **Nominal Group Technique（NGT）**：名义群体法——独立思考 + 集中讨论。
8. **Delphi Technique**：多轮匿名专家评估。
9. **Multi-Criteria Decision Analysis（MCDA）**：多准则决策分析（详见 02-tradeoff-frameworks）。
10. **Roman Voting（罗马投票）**：每个团队一票，部分反对制。
11. **Steering Committee Escalation**：升级到指导委员会。
12. **Working Backwards（PR/FAQ）**：逆向工作法。
13. **AI-assisted Consensus Building**：AI 协调员 + 共识构建。
14. **Sociocracy / Holacracy（适合社群众决策）**。

### 2.4 与相邻概念的关系

- **跨团队决策 vs ADR**：ADR 是「决策记录」，跨团队决策是「决策过程」——跨团队决策的产物往往是组织级 ADR。
- **跨团队决策 vs 架构评审**：评审会议是跨团队决策的载体之一。
- **跨团队决策 vs 项目管理**：项目管理关注「执行」，跨团队决策关注「决策」。
- **跨团队决策 vs 组织设计**：组织设计（矩阵 / 联邦 / 中心化）影响跨团队决策效率。
- **跨团队决策 vs 冲突管理**：冲突管理是跨团队决策的子问题。
- **跨团队决策 vs 谈判**：谈判是跨团队决策的工具之一。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：RACI 矩阵（最经典）**

| 决策 | R（执行） | A（负责） | C（咨询） | I（通知） |
| --- | --- | --- | --- | --- |
| 选型 Kafka | 数据平台组 | 首席架构师 | 业务方、安全 | 全公司 |
| 性能优化 | 数据平台组 | 架构师 | DBA、业务方 | 工程团队 |
| 合规变更 | 安全团队 | CISO | 法务、业务方 | 董事会 |

- **优点**：简单、清晰、易落地。
- **缺点**：只解决「谁参与」，不解决「怎么做决策」。
- **适用**：中小型组织、单项目决策。

**模式 2：DACI 框架（Atlassian）**

- **D（Driver）**：驱动者——推动决策过程。
- **A（Approver）**：批准者——有最终决策权（通常 1 人）。
- **C（Contributor）**：贡献者——提供意见、方案、评审。
- **I（Informed）**：被通知者——决策后告知。

- **优点**：明确 Approver，避免「多人决策」。
- **缺点**：Driver 与 Approver 可能冲突。
- **适用**：跨团队决策、产品决策。

**模式 3：RAPID 决策框架（Bain & Company）**

- **R（Recommend）**：推荐方案的人。
- **A（Agree）**：必须同意的人（财务、法务、合规）。
- **P（Provide input）**：提供意见的人。
- **I（Input）**：被通知的人。
- **D（Decide）**：最终拍板的人（与 DACI 的 A 同义）。

- **优点**：明确决策权 + 必经节点。
- **缺点**：流程较重。
- **适用**：大型企业、战略级决策。

**模式 4：RFC + ADR（开源 / 互联网公司主流）**

```
业务需求 → RFC 起草（提议）
       → 评审会议（多人 Review）
       → 接受（accepted）
       → ADR 归档（决策记录）
       → 实施 + 复盘
```

- **优点**：透明、可追溯、共识构建。
- **缺点**：流程较慢。
- **适用**：开源社区、互联网公司、平台团队。

**模式 5：Architecture Board（架构委员会）**

- 由 5-10 名资深架构师组成。
- 定期评审重大架构决策。
- 输出：架构白皮书、技术雷达、ADR 审批。

- **优点**：组织级治理。
- **缺点**：可能变成官僚机构。
- **适用**：大型企业、组织级治理。

**模式 6：Tech Radar（技术雷达）**

ThoughtWorks 风格的技术选型指南：

- **Adopt**：推荐采用。
- **Trial**：可以试用。
- **Assess**：值得研究。
- **Hold**：暂不推荐。

- **优点**：组织级技术选型对齐。
- **缺点**：可能滞后于技术发展。
- **适用**：技术战略治理。

**模式 7：Stakeholder Power-Interest Grid**

```
       高权力
         │
   管理  │  重点
   关注  │
   ──────┼────── 利益相关方
         │
   最小  │  保持
   努力  │  告知
         │
       低权力
```

- **优点**：明确沟通策略。
- **缺点**：主观判断。
- **适用**：大型跨团队项目。

**模式 8：Working Backwards（PR/FAQ，Amazon）**

```
1. 写 Press Release（虚构的客户公告）
2. 写 FAQ（客户 + 内部 FAQ）
3. 从客户体验反推决策
4. 决策前 5 天 Review 全部 PR/FAQ
```

- **优点**：从客户价值反推，避免「技术自嗨」。
- **缺点**：不适用于非客户场景。
- **适用**：产品 / 平台型决策。

**模式 9：Consensus Building Workshop**

- 1-3 天的集中工作坊。
- 利益相关方共同识别问题、列举选项、评估、达成共识。
- 引导师（Facilitator）中立。

- **优点**：深度共识、跨团队对齐。
- **缺点**：耗时长、成本高。
- **适用**：跨 BU 重大决策、组织变革。

**模式 10：Sociocracy / Holacracy**

- **Sociocracy**：等效决策 + 同意决策（无反对即通过）。
- **Holacracy**：角色 + 圈子，无传统层级。

- **优点**：高度包容。
- **缺点**：决策慢。
- **适用**：小团队、社群。

**模式 11：Cross-functional Squad（Spotify 模型）**

- Squad（小队）：跨职能自治团队。
- Tribe（部落）：相关 Squad 集合。
- Chapter（专业组）：同专业跨 Squad。
- Guild（公会）：跨 Tribe 兴趣组。

- **优点**：自治 + 对齐。
- **缺点**：规模化时失灵。
- **适用**：产品研发组织。

**模式 12：Federation（联邦化治理）**

- 各团队 / BU 独立决策。
- 通过 Federation Agreement 对齐跨团队议题。
- 类似开源社区（Linux Foundation、CNCF）。

- **优点**：高度自治。
- **缺点**：跨团队决策效率低。
- **适用**：多 BU 企业、开源社区、数据网格。

### 3.2 适用场景决策表

| 团队规模 | 决策类型 | 推荐模式 | 理由 |
| --- | --- | --- | --- |
| 5-20 人 | 任意 | RACI | 简单 |
| 20-100 人 | 产品决策 | DACI | 明确 Approver |
| 100-500 人 | 战略决策 | RAPID | 完整节点 |
| 任意 | 开源 / 平台 | RFC + ADR | 透明可追溯 |
| 500+ 人 | 组织治理 | Architecture Board + Tech Radar | 治理 |
| 跨 BU | 共识构建 | Working Backwards + Workshop | 共识 |
| 跨地域 | 时区差异大 | 异步 RFC + 异步投票 | 时区友好 |
| 跨组织 | 联邦化 | Federation Agreement | 自治对齐 |

### 3.3 反模式与陷阱

1. **「无人拍板」**：多个 Owner，没有最终决策者。**强制 RACI 中 A 只有 1 人**。
2. **「一言堂」**：老板定调，无人敢反对。**匿名投票 + Devil's Advocate**。
3. **「扯皮会」**：决策会被无限拖延。**设截止日期 + Escalation 机制**。
4. **「形式评审」**：走过场。**强制 Reviewer 写「反对意见」**。
5. **「忽视 Informed」**：决策后没通知相关人。**强制 I 环节**。
6. **「跨团队决策不写 ADR」**：决策过程不可追溯。**强制 ADR 归档**。
7. **「群体思维」**：决策会上无人反对。**强制 Devil's Advocate**。
8. **「沉默成本陷阱」**：跨团队项目烂尾但继续投。**建立 Kill Criteria**。
9. **「官僚化」**：所有决策都要走 4 周流程。**按风险分级**。
10. **「无人 Review」**：跨团队决策只在自己组评审。**强制跨组 Reviewer**。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：建立 RACI / DACI 模板**

- 在 Confluence / Notion 建立组织级 RACI 模板。
- 每个跨团队决策都必须填 RACI 表。
- 强制 A（Accountable）只有 1 人。

**Step 2：建立 RFC 流程**

- 仓库 `docs/rfcs/` 或独立 RFC 平台。
- 模板：上下文、提议选项、影响分析、回滚方案、Owner、Reviewers。
- PR 化提交 + Reviewers 制度。
- 截止日期（RFC 进入「Final Comment Period」）。

**Step 3：建立 ADR 归档**

- 跨团队决策接受后写 ADR（详见 §1-adr）。
- ADR 中明确 Owner + Reviewers + Informed。
- ADR Index 中标记「跨团队决策」标签。

**Step 4：建立 Architecture Board**

- 5-10 名资深架构师（含安全 / 数据 / 业务代表）。
- 每周 / 双周会议。
- 评审重大 RFC + ADR。
- 输出：架构白皮书、技术雷达。

**Step 5：建立 Stakeholder Map**

- 识别所有利益相关方（团队 / 个人 / 角色）。
- 用 Power-Interest Grid 分类。
- 制定沟通策略（管理 / 重点 / 最小 / 告知）。

**Step 6：建立 Escalation 流程**

```
决策阻塞
  ↓
Level 1：团队内部解决（24 小时）
  ↓
Level 2：跨团队 Lead 协商（48 小时）
  ↓
Level 3：Architecture Board 评审（1 周）
  ↓
Level 4：高管决策（CTO / VP）
```

**Step 7：建立共识工作坊机制**

- 重大跨团队决策召开共识工作坊。
- 中立 Facilitator 主持。
- 1-3 天集中讨论。
- 输出：共识方案 + ADR。

**Step 8：建立跨团队沟通机制**

- 跨团队 Standup（每周 30 分钟）。
- 跨团队 Slack 频道。
- 月度跨团队分享会。
- 季度跨团队规划会。

### 4.2 关键技术点

1. **RACI 工具**：RACI Matrix 模板（Excel / Confluence）。
2. **RFC 平台**：GitHub PR、GitLab MR、Custom RFC Platform。
3. **ADR 平台**（详见 §1-adr）：log4brains、MADR、Backstage ADR Plugin。
4. **架构委员会会议管理**：议程模板、会议纪要模板、决策记录。
5. **Stakeholder Map 工具**：Miro、Figma、Lucidchart。
6. **投票工具**：Mentimeter、Sli.do、Poll Everywhere。
7. **共识工作坊工具**：Miro、FigJam、Klaxoon。
8. **升级机制**：Jira Service Management、ServiceNow。
9. **跨团队沟通**：Slack、Microsoft Teams、飞书、钉钉。
10. **AI 辅助**：LLM 起草 RFC、AI 协调员、共识构建助手。

### 4.3 工具链与平台

**RFC / ADR 平台**：

- **GitHub / GitLab PR**——RFC 评审主流方式。
- **Google Docs / Confluence**——传统企业折中。
- **Notion Database**——结构化 RFC + ADR。
- **Log4brains**——ADR 静态站点。
- **Backstage ADR Plugin**——Spotify Backstage 集成。
- **Custom RFC Platform**（如 GitLab Handbook）。

**Stakeholder Map 工具**：

- **Miro**——白板 + 协作。
- **Figma**——协作设计。
- **Lucidchart**——流程图 / 矩阵图。
- **Mural**——视觉协作。

**架构委员会工具**：

- **Confluence + Meeting Notes**——会议纪要。
- **Jira + Architecture Theme**——决策跟踪。
- **Slack Channel #arch-board**——实时沟通。

**投票 / 共识工具**：

- **Mentimeter**——匿名投票。
- **Sli.do**——匿名提问 / 投票。
- **Loomio**——协作决策。
- **Poll Everywhere**——实时投票。

**AI 辅助（2024-2025）**：

- **Claude / GPT-4**——RFC 起草、ADR 评审、Stakeholder 分析。
- **Decision Intelligence Platforms**——跨团队决策图谱。
- **AI Facilitator**——共识工作坊 AI 主持。
- **Anthropic Constitutional AI**——AI 决策「宪法」。
- **Pol.is**——大规模群体意见聚合。

**跨团队沟通**：

- **Slack / Microsoft Teams / 飞书 / 钉钉**——即时沟通。
- **Zoom / 腾讯会议**——视频会议。
- **Miro / Mural**——异步白板。

### 4.4 代码 / 示例

**示例 1：RACI 矩阵**

| 决策 | R（执行） | A（负责） | C（咨询） | I（通知） |
| --- | --- | --- | --- | --- |
| 选型 Kafka vs Pulsar | 数据平台组 | 首席架构师 | 业务方、安全、运维 | 全公司 |
| 性能优化（成本 100w） | 数据平台组 | 架构师 | DBA、业务方、CFO | 工程团队 |
| 合规变更（PII 加密） | 安全团队 | CISO | 法务、业务方、CTO | 董事会、客户 |
| 新模型上线（GPT-4o） | AI 平台组 | AI 架构师 | 业务方、合规、安全 | 全公司 |

**示例 2：DACI 框架应用**

```
## DACI for ADR-0015：选用 GPT-4o 作为主力模型

- **D（Driver）**：@李架构（推动 ADR 起草、评审、合并）
- **A（Approver）**：@王首席架构师（最终拍板）
- **C（Contributors）**：
  - @张博士（AI 科学家）——模型能力评估
  - @赵组长（业务方）——业务影响评估
  - @钱组长（安全）——合规评估
  - @孙组长（成本）——成本评估
- **I（Informed）**：
  - 全平台工程团队
  - 业务部门负责人
  - 法务 / 合规

## 时间表
- W1：Driver 起草 DACI + ADR 草稿
- W2：Contributors 评审 + 修改
- W3：Approver 拍板
- W4：ADR 合并 + Informed 通知
```

**示例 3：RFC 模板**

```markdown
# RFC-{编号}：{标题}

## 摘要
{一句话提议}

## 动机
{为什么需要这个决策}

## 提议
{具体方案}

## 选项对比
| 维度 | 选项 A | 选项 B | 选项 C |
| --- | --- | --- | --- | --- |
| 性能 | ... | ... | ... |
| 成本 | ... | ... | ... |
| 团队 | ... | ... | ... |

## 影响范围
- 涉及团队：{列表}
- 影响系统：{列表}
- 回滚方案：{描述}

## 风险与缓解
| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| ... | ... | ... | ... |

## Reviewers
- @张三（必须 Review）
- @李四（必须 Review）
- @王五（建议 Review）

## 时间表
- Final Comment Period：{日期}
- Approver 拍板：{日期}
- 实施：{日期}

## 开放问题
- {问题 1}
- {问题 2}
```

**示例 4：Stakeholder Map**

```
                高权力
                  │
                  │
       ┌──────────┼──────────┐
       │  CTO     │  CFO     │  ← 管理（重点沟通）
       │  业务VP  │  安全VP  │
   ────┼──────────┼──────────┼──── 利益
       │  安全Lead│  业务Lead│
       │  数据Lead│  AI Lead │
       └──────────┼──────────┘
                  │
                  │
                低权力

- **管理 / 重点沟通**：CTO、CFO、VP（高权力 / 高利益）
- **关键 Lead**：安全Lead、数据Lead、业务Lead（中等权力 / 高利益）
- **最小努力**：执行层（低权力 / 中等利益）
- **告知**：边缘团队（低权力 / 低利益）
```

**示例 5：Escalation 流程**

```
Level 1：团队内部解决（24 小时）
  ├── 决策阻塞
  ├── Lead 召集内部会议
  └── 输出：内部决议 / 升级

Level 2：跨团队 Lead 协商（48 小时）
  ├── 升级到跨团队 Lead
  ├── 联合会议
  └── 输出：跨团队共识 / 升级

Level 3：Architecture Board 评审（1 周）
  ├── 升级到 Architecture Board
  ├── 评审会议
  └── 输出：架构委员会决议 / 升级

Level 4：高管决策（CTO / VP）
  ├── 升级到高管
  ├── 高管会议
  └── 输出：最终决策
```

**示例 6：AI 辅助 Stakeholder 分析（Python / Claude）**

```python
import anthropic
import os

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def analyze_stakeholders(decision_description: str) -> str:
    """基于决策描述，分析利益相关方。"""
    prompt = f"""你是一名组织行为学专家，请基于以下决策描述，进行利益相关方分析。

## 决策描述
{decision_description}

请输出：
1. **利益相关方清单**（角色 / 团队 / 个人）；
2. **Power-Interest Grid**（每个相关方的权力 × 兴趣评分 1-5）；
3. **沟通策略**（管理 / 重点 / 最小努力 / 告知）；
4. **潜在冲突**（谁可能反对？为什么？）；
5. **共识构建建议**。

输出 Markdown 报告。"""

    msg = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

# 使用
analysis = analyze_stakeholders(
    decision_description="我们计划将所有 AI 应用从单模型 GPT-4 迁移到 Claude + GPT-4o + 通义多模型路由策略。涉及成本、合规、业务能力、SLA 多个维度。"
)
print(analysis)
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

- **AI 协调员（AI Facilitator）**：AI 主持共识工作坊，引导讨论、识别共识点。
- **AI 起草 RFC**：基于上下文让 LLM 起草 RFC 草稿。
- **AI 决策助手**：基于历史跨团队决策，推荐 Stakeholder Map、Escalation 路径。
- **AI Stakeholder 分析**：自动识别利益相关方、潜在冲突、共识构建策略。
- **跨地域异步决策**：AI 帮助时区差异团队做异步决策。
- **AI 治理协调**：AI 协调 Architecture Board 议程、评审材料。
- **Decision Graph（决策图谱）**：所有跨团队决策建成 KG——可推理「类似决策的历史 Stakeholder + 共识模式」。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

- **RFC + 向量库**：所有历史 RFC 向量化，检索类似 RFC + 复用共识模式。
- **Stakeholder + KG**：Stakeholder Map + 决策历史建成 KG——可推理「某类决策涉及哪些 Stakeholder + 共识策略」。
- **Decision Graph + GraphRAG**：跨团队决策的复杂问题用 GraphRAG 推理。
- **RFC + RAG**：起草新 RFC 时 RAG 检索类似历史 RFC + ADR。

### 5.3 学术与工业最新进展（2024-2025）

- **2024**：Gartner 把 Decision Intelligence 列为顶级战略技术趋势——跨团队决策是核心场景。
- **2024**：Anthropic / OpenAI / Google 推出企业级 AI 决策助手（含跨团队协调）。
- **2024**：CNCF TAG App Delivery 推动跨团队架构治理标准化。
- **2024-2025**：开源治理模式（Linux Foundation、CNCF）成熟。
- **2025**：AI Agent 协调跨团队决策成为研究热点。

### 5.4 未来 3-5 年趋势

- **AI 辅助跨团队决策普及**：每个 Architecture Board 配 AI 助手。
- **异步决策成为主流**：跨地域团队的异步 RFC + 异步投票。
- **Decision Graph（决策图谱）平台化**：组织级决策 KG 成为决策基础设施。
- **联邦治理（Federation）**：跨企业、跨组织决策（数据网格、开放数据）。
- **AI Constitutional Governance**：用 AI「宪法」约束跨团队决策流程。
- **跨文化决策**：全球化团队的跨文化决策差异研究 + AI 辅助。

---

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

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 临时会议 | RACI | DACI | RAPID | RFC + ADR | AI 辅助 |
| --- | --- | --- | --- | --- | --- | --- |
| 决策权清晰 | 1 | **5** | **5** | **5** | 4 | 4 |
| 共识构建 | 2 | 2 | 3 | 3 | **5** | 4 |
| 可追溯性 | 1 | 2 | 2 | 2 | **5** | 4 |
| 跨团队适用 | 2 | 3 | 4 | 4 | **5** | 4 |
| 实施成本 | **5** | 4 | 4 | 3 | 3 | 4 |
| AI 友好度 | 1 | 2 | 2 | 2 | 3 | **5** |
| 适用规模 | 任意 | 小 | 中 | 大 | 任意 | 任意 |

### 7.2 决策树

```
你需要做跨团队决策
        │
        ├── 决策类型？
        │       ├── 单团队 → 标准 ADR
        │       └── 跨团队 → RACI + DACI
        │
        ├── 决策重要性？
        │       ├── 战略级 → RAPID + Architecture Board
        │       ├── 产品级 → DACI + RFC
        │       └── 战术级 → RACI + ADR
        │
        ├── 跨地域 / 异步？
        │       └── 是 → 异步 RFC + 异步投票
        │
        ├── 跨 BU / 跨组织？
        │       └── 是 → Federation Agreement + Consensus Workshop
        │
        └── 想用 AI 辅助？
                └── 是 → AI Stakeholder 分析 + AI 起草 RFC + Decision Graph
```

### 7.3 组合使用

- **RACI + DACI**：基础决策权分配 + 明确 Approver。
- **DACI + RFC**：决策框架 + 透明流程。
- **RFC + ADR**：决策过程 + 决策归档。
- **Stakeholder Map + Consensus Workshop**：利益相关方管理 + 共识构建。
- **Architecture Board + Tech Radar**：组织治理 + 技术选型。
- **AI 辅助 + 人类 Facilitator**：AI 加速 + 人类把关。
- **Decision Graph + GraphRAG**：决策图谱推理。

---

## 8. 面试真题集

> 跨团队技术决策是「资深架构师」区别于「高级架构师」的关键能力——能否协调多方利益、推动决策可执行，决定你能否从「个人能力」升级为「组织能力」。本节将通过 12 道真题，从理论、流程、组织实践到 AI 时代演进，完整覆盖跨团队决策面试考点。

### 8.1 决策框架基础

#### Q1. RACI 中的 R/A/C/I 分别代表什么？为什么 A 只能有 1 人？

**参考答案要点**：
- R（Responsible）= 执行者；A（Accountable）= 最终负责人；C（Consulted）= 被咨询者；I（Informed）= 被通知者。
- A 只能有 1 人：避免「多人决策」变成「无人决策」（责任稀释效应）。
- 反例：A 有 3 人 → 决策拖延 / 互相推诿。

#### Q2. DACI 与 RAPID 框架的区别是什么？

**参考答案要点**：
- DACI：Driver（推动者）/ Approver（批准者）/ Contributor（贡献者）/ Informed。
- RAPID：Recommend / Agree / Provide input / Decide（Bain & Company）。
- 区别：RAPID 强调「必经节点」（Agree 是必经的），DACI 强调「角色分工」。

### 8.2 决策流程

#### Q3. RFC + ADR 流程是什么？为什么这个组合有效？

**参考答案要点**：
- 流程：业务需求 → RFC 起草 → 评审 → 接受 → ADR 归档 → 实施 → 复盘。
- 为什么有效：RFC 透明 + 多人 Review + ADR 可追溯。
- 适用：开源 / 互联网公司、平台团队。

#### Q4. Architecture Board 的职责是什么？怎么避免它变成官僚机构？

**参考答案要点**：
- 职责：评审重大架构决策、输出技术雷达、维护 ADR 库、组织级治理。
- 避免官僚化：评审频次适中（每月 / 双周）、评审材料提前送达、强制 5 分钟决策 / 项、决策权下放给团队（Board 只评审 Top 决策）。

### 8.3 Stakeholder 与共识

#### Q5. Stakeholder Power-Interest Grid 是什么？4 个象限分别用什么策略？

**参考答案要点**：
- 4 象限：高权力 × 高利益 = 管理（重点沟通）；高权力 × 低利益 = 重点（保持满意）；低权力 × 高利益 = 告知（保持参与）；低权力 × 低利益 = 最小努力（监控）。
- 关键：根据象限调整沟通频次 + 内容。

#### Q6. Consensus Building Workshop 怎么开？有什么关键角色？

**参考答案要点**：
- 关键角色：Facilitator（中立引导师，重要！）、Sponsor（决策发起人）、Stakeholder（利益相关方）、Scribe（记录员）。
- 流程：开场 → 识别问题 → 列举选项 → 评估 → 共识 → ADR。
- 关键：Facilitator 必须中立；时间盒（避免拖延）。

### 8.4 冲突解决

#### Q7. 跨团队决策冲突有哪些常见原因？如何解决？

**参考答案要点**：
- 常见原因：目标不一致（局部最优 vs 全局最优）、信息不对称、资源竞争、政治。
- 解决方法：Stakeholder Map + 数据驱动 + Working Backwards + Escalation + 第三方调解（Facilitator）。

#### Q8. 什么是 Escalation（升级）机制？为什么要设多级？

**参考答案要点**：
- Escalation：决策被阻塞时向上升级。
- 为什么多级：避免小事升级到高管（过度升级）、确保问题能在最低层解决（最小干预）。
- 典型 4 级：团队内部 → 跨团队 Lead → Architecture Board → 高管。

### 8.5 组织设计

#### Q9. Spotify 的 Squad / Tribe / Chapter / Guild 模型的优劣是什么？

**参考答案要点**：
- 优点：自治 + 多层对齐（小团队快速决策 + 大组织对齐）。
- 缺点：规模化时失灵（200+ 人难以维持文化）；Squad 之间可能「各说各话」。
- 适用：产品研发组织；不适用于运维 / 平台型组织。

#### Q10. 集中化 vs 联邦化决策的优劣？什么场景用哪个？

**参考答案要点**：
- 集中化：决策权集中（CTO / 首席架构师）。优点：一致性强；缺点：决策慢、信息不对称。
- 联邦化：决策权分散（各团队 / BU 自治）。优点：决策快、本地化；缺点：易碎片化。
- 场景：集中化用于战略 / 全局对齐；联邦化用于本地化业务。

### 8.6 AI 时代的跨团队决策

#### Q11. AI 如何辅助跨团队决策？请描述 3 个场景。

**参考答案要点**：
- AI Stakeholder 分析：自动识别利益相关方 + 评估权力 / 利益。
- AI 起草 RFC：基于上下文起草 RFC 草稿，节省撰写时间。
- AI 协调员：主持共识工作坊，引导讨论、识别共识点。
- 限制：AI 不可作为 Approver，必须人类拍板。

#### Q12. 什么是 Decision Graph（决策图谱）？它如何提升跨团队决策？

**参考答案要点**：
- Decision Graph = 组织所有跨团队决策的 KG——决策 + Stakeholder + 共识模式 + 后果。
- 价值：跨团队决策时检索类似历史决策、复用共识模式、预测潜在冲突。
- 工具：Neo4j / NebulaGraph + RAG / GraphRAG。

---

> **返回**：
> - [13-decision 章节目录](../README.md)
> - [项目根目录](../../README.md)