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
| 跨团队冲突怎么解？ | §4.2 |
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
- **1960s-1970s**：责任分配矩阵的形式在项目管理实践中成型（RACI 的前身）。
- **1980s-1990s**：RACI 矩阵广泛应用于项目管理（PMI）。
- **2000s**：敏捷开发推动轻量级决策（Scrum、SAFe）。
- **2010s**：开源治理模式（Linux Foundation、CNCF）的跨组织决策实践；决策角色框架的变体成型——RAPID（Bain & Company，原始定义见其 2010 年《Reinventing Decision Making》）与 DACI（由 Atlassian 推广）把「谁推进、谁批准、谁能否决」拆成可分配的角色（见 §3.2.2 / §3.2.3）。
- **2012**：Spotify 公开 Squad / Tribe / Chapter / Guild 模型（见 §3.2.11）。
- **2016**：Google《Site Reliability Engineering》一书把「把决策推给最接近问题的人」写成成文原则（书为 2016 年出版；Google 内部的相关实践早于此，但成文与公开以该书为标志）。
- **2020**：GitHub / GitLab 的 RFC + ADR 流程成为开源 / 互联网公司主流。
- **2022-2024**：架构委员会（Architecture Board）+ 跨团队 RFC 平台普及。
- **2024-2025**：出现 AI 辅助跨团队决策的尝试（AI 协调员、AI 共识构建）——按本章 §5 定级仍为 **L3**（无公开生产案例），不要在治理流程里给它预留位置（§5.1 判据②）。

---

## 2. 核心原理

### 2.1 关键概念定义

- **RACI Matrix**：决策权分配矩阵——Responsible / Accountable / Consulted / Informed。
- **DACI**：Driver / Approver / Contributor / Informed（Atlassian 推广）。
- **RAPID**：Recommend / Agree / Perform / Input / Decide（Bain & Company）。
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
- **Cross-functional Team（跨职能团队）**：产品 / 工程 / 设计 / 数据 / 安全等跨职能。
- **Federation（联邦化）**：多个独立组织协同决策（开源社区、数据网格）。
- **Working Backwards（逆向工作法）**：从客户体验反推决策（Amazon）。
- **Steering Committee（指导委员会）**：跨团队决策的治理机构。
- **Decision Framework（决策框架）**：决策方法论（如 RACI、DACI、RAPID）。

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
14. **Sociocracy / Holacracy（适合小型组织与社群）**：无等效异议即通过——用角色与圈子替代传统层级。

### 2.4 与相邻概念的关系

- **跨团队决策 vs ADR**：ADR 是「决策记录」，跨团队决策是「决策过程」——跨团队决策的产物往往是组织级 ADR。
- **跨团队决策 vs 架构评审**：评审会议是跨团队决策的载体之一。
- **跨团队决策 vs 项目管理**：项目管理关注「执行」，跨团队决策关注「决策」。
- **跨团队决策 vs 组织设计**：组织设计（矩阵 / 联邦 / 中心化）影响跨团队决策效率。
- **跨团队决策 vs 冲突管理**：冲突管理是跨团队决策的子问题。
- **跨团队决策 vs 谈判**：谈判是跨团队决策的工具之一。

> 💡 **思考锚点**：你们跨团队拍板时实际用的那套规则，落在 §2.2 四档投票（简单多数 / 绝对多数 / 加权 / 一致同意）里的哪一档？再按「最优决策权分配 = 信息 × 激励 × 协调成本」量一次——你现在协调成本高，是因为信息没下放到最接近问题的人手里，还是因为选了「一致同意」这一档、本身就把决策拖瘫痪了？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](09-cross-team-decision-section-3-sec3.md)
- [§4. 工程实现](09-cross-team-decision-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](09-cross-team-decision-section-5-ai.md)
- [§6. 落地实践](09-cross-team-decision-section-6-sec6.md)
- [§7. 与其他方法对比](09-cross-team-decision-section-7-sec7.md)
- [§8. 面试真题集](09-cross-team-decision-section-8-sec8.md)

---
