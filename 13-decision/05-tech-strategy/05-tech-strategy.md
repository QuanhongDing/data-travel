# 技术战略与路线图（Tech Strategy & Roadmap）

> **一句话定位**：3-5 年路线图 + 技术雷达 + 技术投资组合——让老板和团队都买账的技术战略。

> 本文是 data-travel 项目 [Ch13 · 决策与权衡](../../README.md) 的子章节（**05 技术战略**）。覆盖 R6 工程能力（决策维度）+ R8 行业经验沉淀中「**技术战略规划 + 路线图制定 + 技术投资组合**」相关的理论、方法、工具与 AI 时代演进。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 什么是技术战略？为什么需要？ | §1 |
| 3-5 年技术路线图怎么写？ | §4.1 / §4.4 |
| 技术雷达（Gartner / ThoughtWorks）怎么用？ | §3.2 |
| 技术投资组合怎么管理？ | §3.3 |
| 技术战略怎么向老板 / 业务方汇报？ | §6.2 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：技术战略（Technology Strategy）是组织为实现长期目标，对技术资源、技术能力、技术方向做出的系统性规划与承诺。它源于战略管理学（Michael Porter, 1980s）+ 创新管理学（Christensen, 1997），核心是把技术从「成本中心」升级为「战略资产」。

**工程定义**：在数据架构师 / 智能体平台架构师手里，技术战略是一份「**把老板、业务、团队都拉齐的技术 3-5 年规划**」，包含五个核心要素：

1. **技术愿景（Vision）**：3-5 年后技术要长成什么样。
2. **技术路线图（Roadmap）**：分阶段实现愿景的路径。
3. **技术投资组合（Portfolio）**：资源如何在不同技术领域分配。
4. **技术雷达（Radar）**：哪些技术值得投入 / 试用 / 暂缓。
5. **战略沟通**：让老板、业务、团队都 buy in。

### 1.2 为什么需要

**业务 / 工程痛点**：

- **「老板看不到技术价值」**——技术战略没翻译成业务价值。
- **「技术投入被砍」**——平时不汇报，关键时刻没预算。
- **「团队失方向」**——没有 3-5 年目标，做一天算一天。
- **「重复造轮子」**——多个团队自研同一组件。
- **「技术债堆积」**——只投新功能，不投还债。
- **「跟风选型」**——今天 All-in Kafka，明天 All-in Pulsar。
- **「战略无法落地」**——3-5 年战略太抽象，团队不知道怎么干。

**为什么是「资深架构师 / 准资深架构师」必备能力**：

- P5/P6：写代码——关注「代码正确」。
- P7：模块——关注「模块设计合理」。
- P8：系统——关注「系统稳定」。
- **资深架构师 / 准资深架构师：关注「技术 + 业务 + 组织对齐」——这是技术战略的本质**。

### 1.3 在 AI 时代数据架构中的位置

```
       ┌─────── Ch13 · 决策与权衡 ───────┐
       │                                  │
       │  ADR(01) ←── 技术战略(05)        │
       │   ↓           ↓                  │
       │ 选型(02) ←─ 技术战略(05)         │
       │   ↓           ↓                  │
       │ 自研(03) ←── 技术战略(05)        │
       │   ↓           ↓                  │
       │ 技术债(06) ←─ 技术战略(05)       │
       │                                  │
       └──────────────────────────────────┘
                       ↓
            技术战略是「决策的宏观背景」
```

**与其他子主题的关系**：

- **ADR（01）**：技术战略决定组织级 ADR 方向。
- **选型框架（02）**：技术战略 = 组织级选型框架的宏观对齐。
- **自研 vs 采购（03）**：技术战略决定哪些核心能力必自研。
- **技术债（06）**：技术战略包含技术债预算。
- **架构评审（07）**：架构评审对齐技术战略。
- **跨团队决策（09）**：技术战略是跨团队决策的宏观依据。

**一句话判断**：**「写不了代码是 P5/P6；写得动代码是 P7；能设计系统是 P8；能规划 3-5 年技术战略是资深架构师——技术战略是个人能力升级为组织战略的关键跃迁」**。

### 1.4 演进历程

- **1980s**：Michael Porter《Competitive Strategy》奠基——把技术纳入战略。
- **1990s**：Christensen《The Innovator's Dilemma》（1997）——颠覆性创新理论。
- **2000s**：Gartner 技术成熟度曲线（Hype Cycle）成为技术战略标准工具。
- **2010**：ThoughtWorks Tech Radar 发布，每半年更新。
- **2010-2014**：Gartner Magic Quadrant 普及；AWS Well-Architected Framework 发布。
- **2018**：CNCF TAG App Delivery 把技术战略纳入云原生治理。
- **2020**：AI / 机器学习工程化（MLOps）成为技术战略新主题。
- **2023-2025**：生成式 AI（LLM / Agent）成为技术战略最热门话题。
- **2024-2025**：AI 技术战略 / AI Governance / Decision Intelligence 标准化。

---

## 2. 核心原理

### 2.1 关键概念定义

- **技术战略（Technology Strategy）**：组织对技术的长期规划与承诺。
- **技术愿景（Vision）**：3-5 年后技术状态的可视化描述。
- **技术路线图（Roadmap）**：分阶段实现愿景的时间线。
- **技术雷达（Tech Radar）**：技术成熟度评估（ThoughtWorks / Gartner 风格）。
- **Hype Cycle（Gartner）**：技术成熟度 5 阶段曲线（Innovation Trigger → Peak → Trough → Slope → Plateau）。
- **技术投资组合（Portfolio）**：资源（人 / 钱）在不同技术领域的分配。
- **McKinsey Three Horizons**：投资 / 转型 / 储备三层组合。
- **Wardley Maps（Simon Wardley）**：技术价值链可视化（Genesis → Custom → Product → Commodity）。
- **Build vs Buy vs Partner**：自研 / 采购 / 合作三选项。
- **Core-Edge-Spot（Gartner）**：核心 / 边缘 / 机会三选项（详见 §03）。
- **Technology Readiness Level（TRL）**：NASA 提出的技术成熟度 1-9 级。
- **Strategic Fit（战略契合度）**：技术与业务目标的对齐度。
- **Strategic Agility（战略敏捷）**：快速调整技术战略的能力。
- **Pivot（战略转向）**：重大调整技术战略。
- **Moat（护城河）**：技术差异化优势。
- **Disruption（颠覆性创新）**：Christensen 提出的「低端颠覆 / 新市场颠覆」。
- **Crossing the Chasm（跨越鸿沟）**：Geoffrey Moore——早期采用者向早期大众跨越。
- **Open Strategy**：开放战略——开源 / 公开技术战略。
- **AI Strategy（AI 战略）**：AI 时代的特有战略（数据 / 算法 / 算力 + 治理）。
- **AI Governance Strategy（AI 治理战略）**：AI 伦理、合规、安全的战略。
- **AI-First Strategy（AI 优先战略）**：把 AI 作为核心战略（如 Google / Anthropic）。
- **Decision Intelligence（决策智能）**：把决策作为战略资产（Gartner 2025 趋势）。

### 2.2 数学 / 形式化基础

**技术投资组合（McKinsey Three Horizons）**：

```
H1（核心业务）：70% 资源 → 维护 + 优化
H2（新兴业务）：20% 资源 → 拓展 + 试验
H3（未来业务）：10% 资源 → 探索 + 储备
```

**Hype Cycle 5 阶段**：

```
Innovation Trigger → Peak of Inflated Expectations → Trough of Disillusionment → Slope of Enlightenment → Plateau of Productivity
```

**Wardley Map 4 阶段**：

```
Genesis（创世）→ Custom（定制）→ Product（产品）→ Commodity（商品）
```

→ 战略选择：从 Commodity（采购）到 Genesis（自研）的层级。

**技术成熟度（TRL）**：

```
TRL 1：基础研究
TRL 2-3：技术概念验证
TRL 4-5：实验室验证
TRL 6：相关环境演示
TRL 7：运营环境演示
TRL 8-9：商业化部署
```

**战略对齐矩阵**：

```
技术影响力 = w1 × 业务价值 + w2 × 技术差异化 + w3 × 团队能力 + w4 × 战略契合度
```

### 2.3 关键算法 / 方法

1. **Hype Cycle（Gartner）**——技术成熟度评估。
2. **Tech Radar（ThoughtWorks）**——Adopt / Trial / Assess / Hold 四象限。
3. **McKinsey Three Horizons**——投资组合分层。
4. **Wardley Maps**——价值链可视化。
5. **TRL**——NASA 技术成熟度。
6. **Build-Buy-Partner**——三选项战略。
7. **Core-Edge-Spot**——Gartner 三层战略。
8. **Porter's Five Forces**——竞争分析（用于技术战略）。
9. **SWOT Analysis**——优势 / 劣势 / 机会 / 威胁。
10. **OKR（Objectives & Key Results）**——目标对齐。
1. **Balanced Scorecard（平衡计分卡）**——战略度量。
2. **AI Strategy Canvas**——AI 战略画布。
3. **Decision Intelligence Strategy**——决策智能战略。
4. **AI Constitutional Strategy**——AI 宪法战略。

### 2.4 与相邻概念的关系

- **技术战略 vs 业务战略**：业务战略是上层；技术战略是对齐业务战略的下层。
- **技术战略 vs 技术路线图**：战略是「做什么」，路线图是「什么时候做」。
- **技术战略 vs 技术债管理**：战略决定技术债预算；技术债是战略落地的副产品。
- **技术战略 vs 架构评审**：战略对齐评审标准；评审是战略落地的把关。
- **技术战略 vs 选型决策**：战略决定选型框架；选型是战略的具体落地。

---

- [§3. 设计模式与范式](05-tech-strategy-section-3-sec3.md)
- [§4. 工程实现](05-tech-strategy-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](05-tech-strategy-section-5-ai.md)
- [§6. 落地实践](05-tech-strategy-section-6-sec6.md)
- [§7. 与其他方法对比](05-tech-strategy-section-7-sec7.md)
- [§8. 面试真题集](05-tech-strategy-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](05-tech-strategy-section-3-sec3.md)
- [§4. 工程实现](05-tech-strategy-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](05-tech-strategy-section-5-ai.md)
- [§6. 落地实践](05-tech-strategy-section-6-sec6.md)
- [§7. 与其他方法对比](05-tech-strategy-section-7-sec7.md)
- [§8. 面试真题集](05-tech-strategy-section-8-sec8.md)

---
