# ADR（架构决策记录）

> **一句话定位**：把每一次重大架构决策写下来——让决策可追溯、可质疑、可被未来复用。

> 本文是 data-travel 项目 [Ch13 · 决策与权衡](../../README.md) 的子章节（**01 ADR**）。覆盖 R6 工程能力（决策维度）中「**架构决策记录**」相关的模板、流程、组织实践与 AI 时代演进。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| ADR 是什么？为什么必须有？ | §1 |
| ADR 包含哪些字段？有哪些主流模板？ | §2.1 / §3.2 |
| 团队 / 组织级 ADR 流程怎么设计？ | §4.1 |
| 怎样把 AI 引入 ADR 撰写与评审？ | §5 |
| 真实工业级 ADR 库长什么样？ | §6 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：Architecture Decision Record（ADR，架构决策记录）是一种轻量级文档，用于记录一次特定的架构决策——包括决策的**上下文（Context）**、**选项（Options）**、**决策（Decision）**与**后果（Consequences）**。其概念由 Michael Nygard 在 2011 年发表的博客文章《Documenting Architecture Decisions》中首次系统化，是敏捷 / 演进式架构（Evolutionary Architecture）运动的核心产物。

**工程定义**：在数据架构师 / 智能体平台架构师手里，ADR 是一份**记录「为什么这样做」而非「做了什么」的 Markdown 文档**，具备四个本质特征：

1. **不可变（Immutable）**：决策一旦做出，ADR 状态转为「Accepted」后不再修改；如需修正，写一份新的 ADR 并 supersede 旧的。
2. **可追溯（Traceable）**：每条 ADR 有唯一编号（如 `ADR-0007`），可在 git、CI、文档中双向链接。
3. **可讨论（Discussable）**：通过 Pull Request / Review 流程，让决策过程本身成为团队对齐工具。
4. **可被未来质疑（Future-questionable）**：当上下文变化时，后人可基于 ADR 重新评估并 supersede。

### 1.2 为什么需要

**业务 / 工程痛点**：

- **「为什么当时这么选？」**——三个月后没人记得决策依据，重做轮子或重复争论。
- **「同一问题被讨论三次」**——团队新人不知道历史决策，重提老问题。
- **「架构师个人崇拜」**——决策只在某个人的脑子里，组织无法在他离开后继续。
- **「架构腐烂」**——没有 ADR 约束，团队每个角落都按各自偏好写代码，半年后无法统一。
- **「跨团队冲突」**——A 团队选了 Kafka 做事件总线，B 团队选了 Pulsar，没有 ADR 协调，对齐成本爆炸。

**为什么是「决策维度」的分水岭**：

- P5/P6 写代码：关注「怎么实现」。
- P7 主导模块：关注「模块怎么设计」。
- P8 主导系统：关注「系统怎么演进」。
- **资深架构师 / 准资深架构师：关注「决策是否可被团队复用、可被未来质疑」**——这就是 ADR 的本质。

### 1.3 在 AI 时代数据架构中的位置

```
┌────────────────────────────────────────────┐
│  Ch13 · 决策与权衡                           │
│  ├─ 01 ADR（决策记录）        ← 本文        │
│  ├─ 02 选型决策框架                          │
│  ├─ 03 自研 vs 采购                          │
│  ├─ 04 风险评估                              │
│  ├─ 05 技术战略                              │
│  ├─ 06 技术债                                │
│  ├─ 07 架构评审                              │
│  ├─ 08 决策心理学                            │
│  └─ 09 跨团队决策                            │
└────────────────────────────────────────────┘
       ↓                       ↓
   决策流程                  决策内容
 （怎么记下来）              （怎么选对）
```

**与其他子主题的关系**：

- **ADR 是「容器」**：选型决策框架（02）、自研 vs 采购（03）、风险评估（04）——所有这些**决策内容**都需要装进 ADR。
- **ADR 是「过程产物」**：技术战略（05）是宏观路线图；技术债（06）是状态盘点；架构评审（07）是决策**之前的把关**；ADR 是评审**之后的归档**。
- **ADR 是「反认知偏差工具」**：决策心理学（08）揭示了锚定、确认偏误、沉没成本等陷阱；ADR 通过强制记录「选项」「理由」让决策过程可被复盘。
- **ADR 是「跨团队决策的落地器」**：跨团队决策（09）的最终产物往往是 ADR 编号 + 引用。

**一句话判断**：**「不写 ADR 的架构师，永远只能做个人的英雄；写 ADR 的架构师，才能让组织变可复制」。**

### 1.4 演进历程

- **2011**：Michael Nygard 提出 ADR 概念与四段式模板。
- **2014**：ThoughtWorks 技术雷达收录 ADR 实践（"Trial"）。
- **2017**：MADR（Markdown Any Decision Records）模板发布，强调 Markdown-first。
- **2018**：Y-statements（"In the context of ... facing ... we decided for ... to achieve ... accepting ..."）结构化模板流行。
- **2020**：GitHub / GitLab 把 ADR 模板（`.github/adr-template.md` / `docs/adr/`）纳入工程实践标准。
- **2022**：CNCF TAG App Delivery 把 ADR 列为推荐实践。
- **2023-2024**：AI 辅助 ADR 起草 / 评审工具出现（如 ADR-Assistant、AdrGPT、GitHub Copilot for ADR）。
- **2025**：组织级 ADR 库 + AI 决策助手（Decision Intelligence）+ 自动化 supersede 检测成为前沿。

---

## 2. 核心原理

### 2.1 关键概念定义

- **ADR（Architecture Decision Record）**：记录一次架构决策的文档单元。**一条决策 = 一份 ADR**。
- **MADR（Markdown Any Decision Records）**：Markdown-first 的 ADR 模板，强调人类可读。
- **Y-statement**：单句结构化决策陈述——「In the context of \<context\>, facing \<concern\>, we decided for \<option\>, to achieve \<goal\>, accepting \<consequences\>」。
- **RFC（Request For Comments）**：决策**之前**的讨论文档（与 ADR 互补）。RFC 是「提议」，ADR 是「最终决定」。
- **ADL（Architecture Decision Log）**：组织所有 ADR 的索引库。
- **Status（状态）**：ADR 的生命周期——Proposed / Accepted / Deprecated / Superseded by ADR-XXXX。
- **Supersede（取代）**：当决策被推翻时，写一份新 ADR 并将旧的标记为 Superseded，建立**决策族谱**。
- **Lightweight ADR**：只记录核心字段（标题、状态、上下文、决策、后果），适用于敏捷团队。
- **Full ADR**：完整记录所有候选选项、评估矩阵、利弊分析，适用于复杂 / 长期决策。
- **Decision Owner**：决策的最终负责人（不是「谁写的 ADR」，而是「谁拍板」）。
- **ADR Review**：对 ADR 的评审——可以是 PR Review，也可以是 Architecture Review Board。
- **ADR Index**：组织 / 团队 ADR 列表页（README.md 表格），通常按编号或主题组织。
- **Decision Traceability（决策可追溯性）**：从代码 / 文档反查到 ADR，或从 ADR 反查到影响范围的链路。

### 2.2 数学 / 形式化基础

ADR 在形式上是一份**结构化文档**，但其底层逻辑可以数学化为：

- **决策论（Decision Theory）**：在不确定环境下选择最优行动——ADR 的「Options」+「Consequences」本质上是决策树的文本化。
- **Multi-Criteria Decision Analysis（MCDA）**：多准则决策分析——ADR 的「评估矩阵」是其离散化版本。
- **Cost-Benefit Analysis（CBA）**：成本收益分析——ADR 的「Consequences」分为 Positive 与 Negative 两类。
- **Information Foraging Theory**：信息觅食理论——ADR 的存在降低了后人「重新觅食」的认知成本。
- **Option Theory（期权理论）**：把决策视为「购买一个未来行动期权」——ADR 的 Reversibility 字段反映「期权价值」。

### 2.3 关键算法 / 方法

虽然 ADR 不是算法，但其评审与组织可以借助：

1. **加权打分（Weighted Scoring）**：对候选选项按多准则打分，用于 ADR 决策段。
2. **决策矩阵（Decision Matrix）**：把 ADR 的 Options + Criteria 表格化，便于量化。
3. **AHP（Analytic Hierarchy Process）**：层次分析法——用于复杂 ADR 的多准则排序。
4. **Delphi 法**：多轮匿名专家评估——用于高风险 ADR 的选项筛选。
5. **Pre-Mortem（事前验尸）**：假设决策已经失败，反推失败原因——在 ADR 评审中加入。
6. **Reversibility Analysis（可逆性分析）**：评估决策的可逆成本，影响 ADR 的「轻量 vs 完整」选择。
7. **Supersede Detection（基于历史的关联检测）**：用文本相似度 / KG 关联检测 ADR 之间的 supersede 关系。

### 2.4 与相邻概念的关系

- **ADR vs RFC**：RFC 是「提议 / 讨论」（决策前），ADR 是「决策 / 归档」（决策后）。RFC 可被接受（accepted）后转为 ADR。
- **ADR vs Design Doc**：Design Doc 描述「系统怎么设计」，ADR 描述「为什么这么设计」——前者是 blueprint，后者是 decision log。
- **ADR vs Runbook**：Runbook 是「操作手册」（怎么用），ADR 是「决策手册」（为什么这样建）。
- **ADR vs Postmortem**：Postmortem 是「事后复盘」（出错了），ADR 是「事前记录」（要做决策了）。
- **ADR vs Architecture Review**：架构评审是「评审会议」（流程），ADR 是「评审的产出物」（文档）。
- **ADR vs 维基百科 / 知识库**：知识库描述「事实」，ADR 描述「决策 + 上下文」——ADR 是知识库的子集，但更强调**可追溯与可质疑**。

> 💡 **思考锚点**：把你团队最近一次真正落地的架构决策拿出来，用 §2.3 的 Reversibility Analysis 判一下它的可逆成本——不可逆的决策，你们走的是「轻量 ADR」还是「完整 ADR」？本节说这个选择应由可逆性决定；你那份记录按这个口径该是哪一种，实际写成的又是哪一种？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](01-adr-section-3-sec3.md)
- [§4. 工程实现](01-adr-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](01-adr-section-5-ai.md)
- [§6. 落地实践](01-adr-section-6-sec6.md)
- [§7. 与其他方法对比](01-adr-section-7-sec7.md)
- [§8. 面试真题集](01-adr-section-8-sec8.md)

---
