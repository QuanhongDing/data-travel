# 选型决策框架（Trade-off Frameworks）

> **一句话定位**：性能 / 成本 / 团队匹配度 / 生态 / 可治理性 / 风险——多维权衡而非「拍脑袋」。

> 本文是 data-travel 项目 [Ch13 · 决策与权衡](../../README.md) 的子章节（**02 选型决策框架**）。覆盖 R6 工程能力（决策维度）中「**多准则选型决策**」相关的理论、方法、框架与 AI 时代演进。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 选型时为什么总在「拍脑袋」？ | §1.2 |
| CAP / PACELC 定理怎么用？ | §2.1 |
| 多准则决策怎么量化？ | §3.2 / §3.3 |
| 决策矩阵 / 加权打分怎么做？ | §4 |
| AI 时代选型决策有什么新方法？ | §5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：选型决策框架（Trade-off Frameworks）是一套用于在多个候选方案中做多维权衡的结构化方法。它融合了决策论（Decision Theory）、多准则决策分析（MCDA, Multi-Criteria Decision Analysis）、工程经济学（Engineering Economics），核心是把直觉决策转化为可量化、可追溯、可复用的工程实践。

**工程定义**：在数据架构师手里，选型决策框架是「**让『我觉得』变成『我有数据』**」的方法集，包含三个核心要素：

1. **多维度评估**：性能 / 成本 / 团队匹配度 / 生态 / 可治理性 / 风险——6 个最常用维度。
2. **量化方法**：加权打分、AHP、Cost-Benefit Analysis、PACELC 扩展。
3. **可视化决策**：决策矩阵（Decision Matrix）、雷达图（Radar Chart）、Trade-off Tables。

### 1.2 为什么需要

**业务 / 工程痛点**：

- **「为什么选 Kafka 不选 Pulsar？」——答不上来**——选型依据主观。
- **「CTO 喜欢 Go，所有系统都迁 Java」**——权威偏误（详见 §08）。
- **「6 个团队各选一个消息队列，结果 5 种消息总线」**——缺乏组织级选型框架。
- **「选了一个性能最好的工具，团队不会用，半途而废」**——忽略「团队匹配度」维度。
- **「选了一个便宜的方案，但维护成本是 TCO 的 10 倍」**——只看初始成本，不看 TCO。
- **「拍脑袋选型，3 个月后推翻」**——选型无 ADR 追溯。

**为什么是「资深架构师」核心能力**：

- P5/P6：写代码——关注「代码正确」。
- P7：模块——关注「模块设计合理」。
- P8：系统——关注「系统稳定」。
- **资深架构师 / 准资深架构师：关注「选型可被组织复用、可被未来质疑」——这是选型决策框架的本质**。

### 1.3 在 AI 时代数据架构中的位置

```
       ┌─────── Ch13 · 决策与权衡 ───────┐
       │                                  │
       │  ADR(01) ←── 选型框架(02)        │
       │   ↓           ↓                  │
       │ 自研(03) ←─ 选型框架(02)         │
       │   ↓           ↓                  │
       │ 战略(05) ←── 选型框架(02)        │
       │                                  │
       └──────────────────────────────────┘
                       ↓
            选型框架是「决策的量化工具」
```

**与其他子主题的关系**：

- **ADR（01）**：选型决策框架的输出是 ADR 的 Considered Options + Decision Outcome 字段。
- **自研 vs 采购（03）**：选型框架是自研 vs 采购决策的核心方法。
- **技术战略（05）**：组织级技术雷达 = 组织级选型框架的产物。
- **风险评估（04）**：选型时必须评估每个选项的风险。
- **决策心理学（08）**：选型要对抗锚定 / 确认偏误。

**一句话判断**：**「拍脑袋选型是 P7；用决策矩阵选型是 P8；建立组织级选型框架是资深架构师——选型框架是个人能力升级为组织能力的工具」**。

### 1.4 演进历程

- **1950s-1960s**：Simon 的「有限理性」+「满意即可」理论奠基。
- **1970s-1980s**：Saaty 提出 AHP（层次分析法）；Von Winterfeldt 发展 MCDA。
- **1980s-1990s**：CAP 定理（Eric Brewer 1998-1999）成为分布式系统选型基础。
- **2000s**：Cost-Benefit Analysis 在企业 IT 决策中普及；TOGAF / Zachman 框架推广。
- **2010s**：Tech Radar（ThoughtWorks 2010+）成为组织级选型指南；敏捷决策推动轻量化框架。
- **2014**：AWS Well-Architected Framework 5 根支柱（Operational Excellence / Security / Reliability / Performance Efficiency / Sustainability）成为云架构选型标准。
- **2020-2024**：AI / ML 选型（模型、向量库、Agent 框架）催生新决策维度（幻觉率、合规、成本）；**2022** 年 Decision Intelligence 进入 Gartner 顶级战略技术趋势（以当年清单原文为准），AI 辅助选型。

---

## 2. 核心原理

### 2.1 关键概念定义

- **Trade-off（权衡）**：在多个相互冲突的目标间做取舍（如性能 vs 成本）。
- **CAP Theorem（CAP 定理）**：Brewer 定理——网络分区（P）发生时，在 Consistency 与 Availability 之间二选一（不是「三选二」）。
- **PACELC**：CAP 的扩展——分区时（P）选 A 或 C；无分区时（E）仍要在延迟（L）与一致性（C）之间选。
- **Multi-Criteria Decision Analysis（MCDA）**：多准则决策分析。
- **Weighted Scoring Model（加权打分）**：每个维度按权重打分求总分。
- **Decision Matrix（决策矩阵）**：表格化的多准则对比。
- **Cost-Benefit Analysis（CBA）**：成本收益分析——货币化所有收益 / 成本。
- **Total Cost of Ownership（TCO）**：总拥有成本——含初始成本 + 运营成本 + 维护成本 + 培训成本 + 机会成本。
- **AHP（Analytic Hierarchy Process）**：层次分析法——Saaty 提出的多准则权重计算方法。
- **Trade-off Table**：Steve McConnell 提出的权衡表格——把每个 trade-off 显式化。
- **Reversibility（可逆性）**：决策的「可逆成本」（详见 §08）。
- **Tech Radar（技术雷达）**：组织级技术选型指南（ThoughtWorks / Gartner 风格）。
- **Reference Architecture（参考架构）**：组织级架构蓝图（AWS Well-Architected / Google SRE）。
- **Pugh Matrix**：基于「基准选项」的多准则评估方法。
- **TOPSIS**：逼近理想解排序法——选「距离最优解最近、距离最劣解最远」的方案。
- **ELECTRE**：淘汰与选择法——基于「优于关系」的决策方法。
- **Utility Function（效用函数）**：用决策论建模每个选项的「满意度」。
- **Sensitivity Analysis（敏感性分析）**：分析决策结论对权重的敏感性。
- **Scenario Analysis（场景分析）**：构造多种未来场景评估选项。
- **Risk-adjusted Return（风险调整收益）**：考虑风险后的回报。
- **Engineering Trade-off**：工程权衡（性能 vs 成本 vs 复杂度 vs 可维护性）。
- **Architecture Decision Matrix**：架构决策矩阵——多准则加权打分。

### 2.2 数学 / 形式化基础

**CAP 定理**：

```
网络分区（P）发生时，C（Consistency）与 A（Availability）只能二选一。
```

- CA：传统单机数据库（MySQL 主从）。
- CP：牺牲可用性保一致性（ZooKeeper、etcd）。
- AP：牺牲一致性保可用性（Cassandra、DynamoDB）。

**PACELC 扩展**：

```
若有分区（P）：在 A 与 C 间选。
若无分区（E）：在延迟（L）与一致性（C）间选。
```

→ 即使无分区也要在延迟 vs 一致性间选（如 Google Spanner 选 C）。

**加权打分（Weighted Scoring）**：

```
Score_i = Σ w_j × s_{ij}
其中：
- w_j = 第 j 个维度的权重（Σw = 1）
- s_{ij} = 选项 i 在维度 j 的分数（1-5 或 1-10）
- i = 候选选项，j = 评估维度
```

**AHP 层次分析法**：

1. 建立层次结构（目标 → 准则 → 子准则 → 选项）。
2. 两两比较准则，构造判断矩阵。
3. 计算权重向量（特征向量法）。
4. 一致性检验（CR < 0.1）。
5. 计算每个选项的最终得分。

**Cost-Benefit Analysis（CBA）**：

```
NPV = Σ (Benefit_t - Cost_t) / (1 + r)^t
其中 r = 折现率，t = 年份。
选 NPV > 0 且最大的选项。
```

**敏感性分析**：

```
ΔScore_i / Δw_j = s_{ij}
若权重 w_j 微调时 Score_i 变化大 → 决策对 w_j 敏感。
```

### 2.3 关键算法 / 方法

1. **加权打分（Weighted Scoring）**——最常用，简单。
2. **Decision Matrix**——表格化多准则对比。
3. **AHP**——层次分析法（Saaty）。
4. **TOPSIS**——逼近理想解排序法。
5. **Pugh Matrix**——基于基准选项的相对打分。
6. **Cost-Benefit Analysis（CBA）**——货币化所有收益 / 成本。
7. **TCO Analysis**——总拥有成本。
8. **Sensitivity Analysis**——敏感性分析。
9. **Scenario Analysis**——场景分析。
10. **Risk-adjusted Scoring**——风险调整打分。
11. **Trade-off Tables（Steve McConnell）**——显式化所有 trade-off。
12. **CAP / PACELC**——分布式系统选型基础。
13. **AI 辅助选型**——LLM 推荐选项 + 打分。
14. **Decision Intelligence Platform**——选型决策图谱。
15. **Multi-vote / NPV / IRR**——财务选型指标。

### 2.4 与相邻概念的关系

- **选型决策框架 vs ADR**：选型框架是「决策方法」，ADR 是「决策记录」——选型决策的产物是 ADR。
- **选型决策框架 vs 风险评估**：选型评估「哪个选项好」，风险评估「每个选项的风险」。
- **选型决策框架 vs 自研 vs 采购**：自研 vs 采购是选型的特例（make / buy）。
- **选型决策框架 vs 技术战略**：技术战略 = 组织级选型框架的宏观对齐。
- **选型决策框架 vs 架构评审**：架构评审是对已有选型的 review，选型框架是选型过程的方法。

> 💡 **思考锚点**：把你最近一次真实选型的决策矩阵按 2.2 走一遍——先写出 6 个维度的权重（Σw = 1），再用 ΔScore_i / Δw_j = s_ij 做敏感性检验：如果「团队匹配度」或「成本」的权重上调一档就翻转了排序，你这个结论是「我有数据」，还是换了算法的「我觉得」？AHP 那一步的 CR 你算到了多少（阈值 0.1）？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](02-tradeoff-frameworks-section-3-sec3.md)
- [§4. 工程实现](02-tradeoff-frameworks-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](02-tradeoff-frameworks-section-5-ai.md)
- [§6. 落地实践](02-tradeoff-frameworks-section-6-sec6.md)
- [§7. 与其他方法对比](02-tradeoff-frameworks-section-7-sec7.md)
- [§8. 面试真题集](02-tradeoff-frameworks-section-8-sec8.md)

---
