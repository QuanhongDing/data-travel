# 风险评估（Risk Assessment）

> **一句话定位**：FMEA + 故障树 + Bowtie + 概率影响矩阵——把「如果出事」变成「出事我能扛」。

> 本文是 data-travel 项目 [Ch13 · 决策与权衡](../../README.md) 的子章节（**04 风险评估**）。覆盖 R6 工程能力（决策维度）中「**风险识别 / 评估 / 缓解 / 监控**」相关的理论、模式、工程实践与 AI 时代演进。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 风险评估有哪些方法？FMEA / FTA / Bowtie 怎么选？ | §1 / §3 |
| 如何量化一个风险？P × I 矩阵怎么用？ | §2.2 |
| 风险评估怎么落到工程？ | §4 |
| AI 时代风险评估有哪些新趋势？ | §5 |
| 数据架构师该做哪些风险预判？ | §6.3（微软 STRIDE 威胁建模） |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：风险评估（Risk Assessment）是识别、分析、评价系统或项目潜在风险的系统化方法。国际标准 ISO 31000 将风险定义为「**不确定性对目标的影响**」（effect of uncertainty on objectives），由两个要素构成：**概率（Probability）** 与 **影响（Impact）**。

**工程定义**：在数据架构师手里，风险评估是一套**「先想清楚会出什么事、出事后怎么办」的结构化思维**，包含四个步骤：

1. **识别（Identify）**：列出所有可能的风险事件。
2. **分析（Analyze）**：评估每个风险的概率与影响（量化或半量化）。
3. **应对（Respond）**：制定避免 / 转移 / 缓解 / 接受策略。
4. **监控（Monitor）**：建立指标 + 告警 + 复盘机制。

### 1.2 为什么需要

**业务 / 工程痛点**：

- **「黑天鹅」出现时手足无措**：没有预案，故障扩散到全公司。
- **「过度自信」**：架构师认为「系统很稳」，实际多个单点未识别。
- **「风险 vs 成本」失衡**：要么过度保守（所有风险都缓解，成本爆炸），要么过度激进（所有风险都接受，事故频发）。
- **「跨团队风险盲区」**：A 团队认为风险在 B 团队，结果出事故时没人响应。
- **「风险 vs 业务」割裂**：技术风险未与业务损失对齐，老板觉得「不痛」。

**为什么是「资深架构师」的核心能力**：

- P5/P6：写代码——关注「功能正确」。
- P7：模块——关注「模块可用」。
- P8：系统——关注「系统稳定」。
- **资深架构师：关注「系统稳定 + 业务连续 + 合规 + 声誉」——这是风险评估的本质**。

### 1.3 在 AI 时代数据架构中的位置

```
       ┌─────── Ch13 · 决策与权衡 ───────┐
       │                                  │
       │  ADR(01) ←── 风险评估(04)        │
       │   ↓           ↓                  │
       │ 选型(02) ←─ 风险评估(04)         │
       │   ↓           ↓                  │
       │ 自研(03) ←─ 风险评估(04)         │
       │   ↓           ↓                  │
       │ 战略(05) ─── 风险评估(04)        │
       │                                  │
       └──────────────────────────────────┘
                       ↓
            风险评估是决策的「前置把关」
```

**与其他子主题的关系**：

- **ADR（01）**：每条 ADR 的 Consequences 字段本质上是「风险评估的产物」。
- **选型框架（02）**：选型决策 = 多准则评分 + 风险评分。
- **自研 vs 采购（03）**：自研风险（团队能力、维护成本）vs 采购风险（供应商锁定、合规）。
- **技术战略（05）**：3-5 年路线图必须包含「风险地图」。
- **架构评审（07）**：评审清单包含「风险评估 Checklist」。

**一句话判断**：**「不评估风险的架构师是赌徒，能评估风险的架构师是棋手」**。

### 1.4 演进历程

- **1950s-1960s**：美国军方 / NASA 发展 FMEA（Failure Mode and Effects Analysis）。
- **1960s**：贝尔实验室发展故障树分析（FTA, Fault Tree Analysis）。
- **1970s**：化工 / 核电行业广泛使用 HAZOP（Hazard and Operability Study）。
- **1990s**：金融行业引入 VAR（Value at Risk）量化模型。
- **2000s**：ISO 31000 风险管理标准发布；现行版本为 **ISO 31000:2018《Risk management — Guidelines》**（版本沿革以 ISO 官方发布为准）。
- **2010s**：DevOps / SRE 引入风险评估（Error Budget、SLO）。
- **2012**：NIST SP 800-30 Rev.1《Guide for Conducting Risk Assessments》。
- **2020s**：AI / ML 风险评估（AI RMF, 2023 NIST AI 100-1）。
- **2024-2025**：LLM 风险评估（幻觉、数据泄露、模型滥用）、AI 辅助 FMEA、量子风险评估。

---

## 2. 核心原理

### 2.1 关键概念定义

- **风险（Risk）**：不确定性对目标的影响 = `Risk = P × I`（概率 × 影响）。
- **威胁（Threat）**：能造成损害的来源（如黑客攻击、硬件故障）。
- **脆弱性（Vulnerability）**：系统易被威胁利用的弱点（如未打补丁、未加密）。
- **风险登记册（Risk Register）**：所有识别风险的清单（ID、描述、P、I、应对策略、Owner）。
- **FMEA（Failure Mode and Effects Analysis）**：失效模式与影响分析——逐组件识别失效模式、影响、原因、检测方法。
- **RPN（Risk Priority Number）**：FMEA 的风险优先级数 = `Severity × Occurrence × Detection`（每项 1-10）。
- **FTA（Fault Tree Analysis）**：故障树分析——从顶层「不希望事件」反推到底层原因（用 AND / OR 逻辑门）。
- **Bowtie Analysis（领结分析）**：把威胁、后果、预防 / 缓解措施画成「领结」形图。
- **HAZOP（Hazard and Operability Study）**：危险与可操作性研究——化工 / 过程行业标准。
- **概率影响矩阵（Probability-Impact Matrix）**：把风险按 P × I 二维评分，分五档（极低 / 低 / 中 / 高 / 极高）。
- **ERM（Enterprise Risk Management）**：企业风险管理——全公司层面的风险管理体系。
- **Risk Appetite（风险偏好）**：组织愿意接受的风险水平（由董事会 / 高管定）。
- **Risk Tolerance（风险容忍度）**：具体可接受风险偏差范围。
- **Inherent Risk vs Residual Risk**：固有风险（无控制）vs 残留风险（控制后）。
- **Risk Treatment（风险应对）**：四象限——Avoid（避免）/ Transfer（转移）/ Mitigate（缓解）/ Accept（接受）。
- **Monte Carlo Simulation**：蒙特卡洛模拟——用概率分布采样评估风险。
- **AI RMF（AI Risk Management Framework）**：AI RMF 1.0（NIST AI 100-1，2023-01）；生成式 AI 专题文件 AI 600-1 于 2024-07 另发。
- **Redundancy（冗余）**：通过备份 / 多副本降低单点故障概率。
- **Fault Isolation（故障隔离）**：通过限流 / 熔断 / 隔离舱壁降低影响扩散。

### 2.2 数学 / 形式化基础

**基本公式**：

```
Risk = P(Event) × Impact(Event)
RPN = Severity × Occurrence × Detection
Residual Risk = Inherent Risk × (1 - Control Effectiveness)
```

**概率影响矩阵（5×5）**：

| | I=1（极小） | I=2（较小） | I=3（中） | I=4（较大） | I=5（极大） |
| --- | --- | --- | --- | --- | --- |
| P=5（极可能） | 中 | 高 | 高 | 极高 | 极高 |
| P=4（较可能） | 中 | 中 | 高 | 高 | 极高 |
| P=3（可能） | 低 | 中 | 中 | 高 | 高 |
| P=2（不太可能） | 低 | 低 | 中 | 中 | 高 |
| P=1（极不可能） | 极低 | 低 | 低 | 中 | 中 |

**蒙特卡洛模拟**：

```python
import numpy as np
# 模拟某项目工期风险：最优 6 个月、最可能 9 个月、最差 18 个月
durations = np.random.triangular(6, 9, 18, size=10000)
print(f"P50: {np.percentile(durations, 50):.1f} months")
print(f"P90: {np.percentile(durations, 90):.1f} months")
```

**期望货币价值（EMV, Expected Monetary Value）**：

```
EMV(Risk) = P × I（其中 I 为货币化影响）
决策：选 EMV 最大（或负 EMV 最小）的选项。
```

### 2.3 关键算法 / 方法

1. **FMEA（失效模式与影响分析）**——逐组件失效模式清单。
2. **FTA（故障树分析）**——逻辑门树（AND / OR）。
3. **Bowtie Analysis**——可视化「威胁→事件→后果」+ 两侧屏障。
4. **HAZOP**——化工 / 过程行业。
5. **概率影响矩阵（P-I Matrix）**——半定量风险评级。
6. **Monte Carlo Simulation**——概率分布采样。
7. **Bayesian Network**——贝叶斯网络——条件概率推理。
8. **Markov Chain**——马尔可夫链——状态转移风险建模。
9. **Real Options Analysis（实物期权）**——决策灵活性估值。
10. **Cyber Risk Quantification (CRQ)**——网络安全量化（FAIR 框架）。
11. **AI Risk Assessment**——AI 模型风险评估（偏见、稳健性、隐私）。
12. **Resilience Engineering**——韧性工程（吸收 + 恢复 + 适应能力）。
13. **Stress Testing**——压力测试（极端场景模拟）。
14. **Chaos Engineering**——混沌工程（Netflix Chaos Monkey 风格）。
15. **Risk Register + Heatmap**——风险登记册 + 热力图。

### 2.4 与相邻概念的关系

- **风险评估 vs 不确定性管理**：风险评估聚焦「已知未知」（known unknowns），不确定性管理聚焦「未知未知」（unknown unknowns）。
- **风险评估 vs 决策分析**：决策分析聚焦「选项优劣」，风险评估聚焦「未来结果分布」。
- **风险评估 vs 架构评审**：架构评审关注「方案是否合理」，风险评估关注「方案可能出什么问题」。
- **风险评估 vs SRE / SLO**：SRE 用 Error Budget 量化「可接受风险」，与风险评估天然融合。
- **风险评估 vs 合规审计**：合规审计是「必须做的事」（外部强制），风险评估是「应该做的事」（内部驱动）。
- **风险评估 vs 业务连续性（BCP）**：BCP 关注「灾难后如何恢复」，风险评估关注「灾难如何预防 + 影响评估」。

> 💡 **思考锚点**：用 §2.4 那条分界审一遍你最近一次做的风险评估——它列的是「已知未知」（FMEA 式逐组件失效清单，可枚举、可概率化），还是也覆盖了「未知未知」（无先例的失效）？再对照 SRE 的 Error Budget：你的结论有没有被折成一个可接受数值，还是停在 P-I 矩阵那种半定量评级上？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](04-risk-assessment-section-3-sec3.md)
- [§4. 工程实现](04-risk-assessment-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](04-risk-assessment-section-5-ai.md)
- [§6. 落地实践](04-risk-assessment-section-6-sec6.md)
- [§7. 与其他方法对比](04-risk-assessment-section-7-sec7.md)
- [§8. 面试真题集](04-risk-assessment-section-8-sec8.md)

---
