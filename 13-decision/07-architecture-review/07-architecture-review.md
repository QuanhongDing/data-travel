# 架构评审（Architecture Review）

> **一句话定位**：流程 + 清单 + 反模式案例——让架构评审从「走过场」变成「真把关」。

> 本文是 data-travel 项目 [Ch13 · 决策与权衡](../../README.md) 的子章节（**07 架构评审**）。覆盖 R6 工程能力（决策维度）中「**架构评审流程 + 评审清单 + 反模式**」相关的理论、方法、流程与 AI 时代演进。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 架构评审为什么常常走过场？ | §1.2 / §3.3 |
| 架构评审的标准流程是什么？ | §4 |
| 评审 Checklist 怎么写？ | §4.3 / §4.4 |
| 反模式案例有哪些？ | §3.3 / §6.2 |
| AI 时代如何做架构评审？ | §5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：架构评审（Architecture Review）是对软件 / 数据架构设计进行系统性、专家级审查的过程，确保架构满足业务需求、技术约束、质量标准、可治理性与可演化性。其前身可追溯到 1970s 的 Design Review，2000s 后演化出多种方法论：ATAM（Architecture Tradeoff Analysis Method, SEI 2000）、CBAM（Cost Benefit Analysis Method）、Active Reviews for Intermediate Designs（ARID, 2005）。

**工程定义**：在数据架构师手里，架构评审是「**在编码 / 实施前，对架构决策进行集体把关的工程仪式**」，包含五个核心要素：

1. **评审对象**：方案 / 设计 / 决策（RFC / ADR / Design Doc）。
2. **评审流程**：提报 → 预审 → 正式评审 → 决议 → 跟进。
3. **评审清单（Checklist）**：标准化的检查项。
4. **评审会议**：多人参与的结构化会议。
5. **评审产出**：评审意见 + 决策（接受 / 修订 / 拒绝）。

### 1.2 为什么需要

**业务 / 工程痛点**：

- **「架构腐烂」**：方案看起来 OK，但扩展性 / 治理 / 安全有问题——编码后才发现。
- **「一言堂」**：某架构师个人拍板，团队无人挑战——后续实施才发现问题。
- **「走过场评审」**：评审会只是流程，无人真正评估——Reviewer 不写实质意见。
- **「评审标准不一」**：每个 Reviewer 标准不同，方案无所适从。
- **「评审滞后」**：实施到一半才发现架构问题——返工成本巨大。
- **「跨团队盲区」**：方案只在自己团队评审，跨团队影响未识别。
- **「没有决策」**：评审讨论很多，但无明确决议。

**为什么是「资深架构师」核心能力**：

- P5/P6：写代码——关注「代码正确」。
- P7：模块——关注「模块设计合理」。
- P8：系统——关注「系统稳定」。
- **资深架构师 / 准资深架构师：关注「组织级架构治理 + 评审把关」——这是架构评审的本质**。

### 1.3 在 AI 时代数据架构中的位置

```
       ┌─────── Ch13 · 决策与权衡 ───────┐
       │                                  │
       │  ADR(01) ←── 架构评审(07)        │
       │   ↓           ↓                  │
       │ 选型(02) ←─ 架构评审(07)         │
       │   ↓           ↓                  │
       │ 跨团队(09) ←─ 架构评审(07)       │
       │                                  │
       └──────────────────────────────────┘
                       ↓
            架构评审是「决策的集体把关」
```

**与其他子主题的关系**：

- **ADR（01）**：架构评审的产物往往是 ADR（接受 / 修订 / supersede）。
- **选型框架（02）**：架构评审会用 Decision Matrix 评估方案。
- **风险评估（04）**：架构评审包含 FMEA / 风险评估环节。
- **跨团队决策（09）**：架构评审是跨团队决策的载体（Architecture Board）。
- **决策心理学（08）**：架构评审要对抗群体思维、权威偏误。

**一句话判断**：**「不做架构评审是 P7，做但走过场是 P8，做且真把关是资深架构师——架构评审是个人决策升级为组织决策的关键仪式」**。

### 1.4 演进历程

- **1970s**：Design Review 在硬件 / 航天领域成熟（NASA / 国防部）。
- **1990s**：软件 Design Review 在企业 IT 普及。
- **2000**：ATAM（SEI）成为架构评审标准方法。
- **2005**：ARID（Active Reviews for Intermediate Designs）出现。
- **2010s**：架构评审纳入敏捷 / DevOps 实践（Continuous Review）。
- **2014**：AWS Well-Architected Review 成为云架构评审标杆。
- **2018**：CNCF TAG App Delivery 推动跨团队架构评审标准化。
- **2020-2024**：AI / 智能体架构评审成熟（LLM 引入评审）。
- **2024-2025**：AI 辅助架构评审（GitHub Copilot / Claude / 智能体辅助）成为新趋势。

---

## 2. 核心原理

### 2.1 关键概念定义

- **Architecture Review（架构评审）**：对架构设计进行集体评估的过程。
- **Design Review**：更广义的「设计评审」（含代码 / 数据库设计）。
- **ATAM（Architecture Tradeoff Analysis Method）**：SEI 提出的架构评审方法，识别质量属性 + 权衡。
- **CBAM（Cost Benefit Analysis Method）**：基于成本的架构评审。
- **ARID（Active Reviews for Intermediate Designs）**：在设计中进行的「主动评审」。
- **Lightweight Review**：轻量级评审（异步 / PR / Checklist）。
- **Formal Review**：正式评审（会议 / 多人 / 投票）。
- **Architecture Board**：架构评审委员会（跨团队）。
- **Tech Radar**：技术雷达（组织级选型指南）。
- **Checklist**：评审清单——结构化的检查项。
- **Quality Attributes（质量属性）**：性能 / 可用性 / 安全 / 可维护性 / 可扩展性 / 可演化性。
- **Stakeholder**：评审中的利益相关方（业务 / 工程 / 安全 / 合规 / 运维）。
- **Reviewer**：评审人（架构师 / 资深工程师 / 业务代表 / 安全）。
- **Approver**：批准人（最终决策权）。
- **Pre-Mortem**：事前验尸（详见 §08）。
- **Decision Outcome**：评审决议（接受 / 修订 / 拒绝 / 推迟）。
- **Follow-up Action**：评审后续行动项。
- **ADR**：架构评审后的决策记录（详见 §01）。
- **Living Architecture Review**：持续架构评审（伴随架构生命周期）。
- **AI-assisted Review**：AI 辅助架构评审。
- **GenAI Code Review**：AI 生成的代码评审（GitHub Copilot PR Review）。
- **Lightweight ADR + Living Review**：轻量级 ADR + 持续评审。

### 2.2 数学 / 形式化基础

**ATAM 评估方法**：

```
Utility = Σ w_i × Score_i（质量属性加权打分）
其中：
- w_i = 第 i 个质量属性的权重（来自 Stakeholder 共识）
- Score_i = 第 i 个质量属性的评分（1-5）
```

**架构决策净收益**：

```
Net Benefit = Σ_i (Benefit_i - Cost_i) × Discount_i
其中 Discount_i 反映时间折现。
```

**评审会议效率**：

```
Review Efficiency = Decisions per Hour
Review Coverage = (# Quality Attributes covered) / (# Total Quality Attributes)
Review Depth = Average Discussion Time per Question
```

**评审 Checklist 覆盖率**：

```
Checklist Coverage = (# Items with concrete feedback) / (# Total Items)
```

### 2.3 关键算法 / 方法

1. **ATAM（Architecture Tradeoff Analysis Method）**——质量属性 + 权衡。
2. **CBAM（Cost Benefit Analysis Method）**——成本收益。
3. **ARID**——设计阶段的主动评审。
4. **Lightweight Review（PR Review）**——异步、轻量。
5. **Formal Review（评审会议）**——正式、多人。
6. **Architecture Review Board**——跨团队治理。
7. **AWS Well-Architected Review**——云架构评审。
8. **Continuous Review**——持续评审（伴随架构生命周期）。
9. **Pre-Mortem**——事前验尸（详见 §08）。
10. **Red Team / Blue Team**——对抗性评审（详见 §08）。
11. **Scenario-based Review**——场景驱动评审。
12. **AI-assisted Review**——AI 辅助评审。

### 2.4 与相邻概念的关系

- **架构评审 vs 选型决策**：选型是「选哪个」，评审是「这个好不好」。
- **架构评审 vs 风险评估**：评审包含风险评估，但更广（含质量 / 治理）。
- **架构评审 vs ADR**：评审是「过程」，ADR 是「产物」。
- **架构评审 vs Code Review**：Code Review 关注代码，架构评审关注架构 / 设计。
- **架构评审 vs 架构治理**：治理是「长期机制」，评审是「单次活动」。

---

- [§3. 设计模式与范式](07-architecture-review-section-3-sec3.md)
- [§4. 工程实现](07-architecture-review-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](07-architecture-review-section-5-ai.md)
- [§6. 落地实践](07-architecture-review-section-6-sec6.md)
- [§7. 与其他方法对比](07-architecture-review-section-7-sec7.md)
- [§8. 面试真题集](07-architecture-review-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](07-architecture-review-section-3-sec3.md)
- [§4. 工程实现](07-architecture-review-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](07-architecture-review-section-5-ai.md)
- [§6. 落地实践](07-architecture-review-section-6-sec6.md)
- [§7. 与其他方法对比](07-architecture-review-section-7-sec7.md)
- [§8. 面试真题集](07-architecture-review-section-8-sec8.md)

---
