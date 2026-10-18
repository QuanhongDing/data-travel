# 自研 vs 采购（Build vs Buy）

> **一句话定位**：决策矩阵 + TCO + 伪自研陷阱识别——什么必须自研、什么可以采购、什么是「伪自研」。

> 本文是 data-travel 项目 [Ch13 · 决策与权衡](../../README.md) 的子章节（**03 自研 vs 采购**）。覆盖 R6 工程能力（决策维度）中「**Make or Buy 决策**」相关的理论、方法、ROI 评估与 AI 时代演进。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 自研 vs 采购怎么选？ | §1.2 / §3 |
| 什么是「伪自研」陷阱？ | §3.2.5 / §3.5 反模式表 |
| TCO / NPV / ROI 怎么算？ | §2.2 / §4.5 |
| 战略自主性如何评估？ | §3.2 |
| AI 时代的自研 vs 采购有什么新趋势？ | §5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：自研 vs 采购（Make or Buy）决策是企业战略管理的经典问题。它源于 Williamson 的交易成本理论（Transaction Cost Economics, TCE）——企业决定是「自己生产」还是「从市场购买」某项产品 / 服务。Vladimir Protsenko（1960s）首次在企业战略层系统化该问题，Rein Peterson（1970s）提出 TCO（Total Cost of Ownership）框架。

**工程定义**：在数据架构师手里，自研 vs 采购决策是一套**「在『掌控感』与『效率』之间找平衡」的方法集**，包含五个核心要素：

1. **能力维度**：核心能力 vs 辅助能力。
2. **成本维度**：TCO 3 年 / 5 年计算。
3. **战略维度**：战略自主性 vs 供应商锁定。
4. **时间维度**：上线时间 vs 长期成本。
5. **风险维度**：技术风险 + 合规风险 + 业务连续性。

### 1.2 为什么需要

**业务 / 工程痛点**：

- **「伪自研」陷阱**：为了「掌控感」自研，结果只是「外壳套了一层的开源」——维护成本爆炸。
- **「盲目采购」**：所有都用 SaaS，结果供应商锁定 + 数据合规失控 + 成本失控。
- **「维护成本爆炸」**：自研组件维护团队人力 = 业务 3 倍，但没人评估。
- **「战略自主性误判」**：把非核心能力当核心能力，结果战略失焦。
- **「上线时间压力」**：因为「采购周期长」而自研，结果质量差、维护差。
- **「TCO 计算错误」**：只看初始成本，忽略 5 年 TCO。

**为什么是「资深架构师」核心能力**：

- P5/P6：写代码——关注「代码正确」。
- P7：模块——关注「模块设计合理」。
- P8：系统——关注「系统稳定」。
- **资深架构师 / 准资深架构师：关注「自研 vs 采购的全局最优 + 长期战略」——这是 P8 → 资深架构师的跃迁点**。

### 1.3 在 AI 时代数据架构中的位置

```
       ┌─────── Ch13 · 决策与权衡 ───────┐
       │                                  │
       │  ADR(01) ←── 自研 vs 采购(03)    │
       │   ↓           ↓                  │
       │ 选型(02) ←─ 自研 vs 采购(03)     │
       │   ↓           ↓                  │
       │ 战略(05) ←── 自研 vs 采购(03)    │
       │                                  │
       └──────────────────────────────────┘
                       ↓
            自研 vs 采购是「战略 + 战术的双重决策」
```

**与其他子主题的关系**：

- **ADR（01）**：自研 vs 采购决策的产物是 ADR（含 TCO 计算）。
- **选型框架（02）**：自研 vs 采购是选型决策的特例（make / buy）。
- **风险评估（04）**：评估自研的技术风险 + 采购的供应商风险。
- **技术战略（05）**：组织级「核心能力 vs 非核心能力」战略决定自研 vs 采购策略。
- **技术债（06）**：伪自研 = 技术债的来源。

**一句话判断**：**「拍脑袋自研是 P7；用 TCO + 战略分析是 P8；建立『核心能力必自研、非核心能力必嫁接』原则是资深架构师」**。

### 1.4 演进历程

- **1960s**：Vladimir Protsenko 提出 Make or Buy 决策。
- **1970s**：TCO（Total Cost of Ownership）框架（Rein Peterson）。
- **1980s**：Williamson 的交易成本理论（TCE）。
- **1990s**：企业 IT 领域 Make or Buy 决策普及（ERP / CRM 选型）。
- **2000s**：SaaS 兴起（Salesforce / Workday），「采购 vs 自研」再次升温。
- **2010s**：开源 vs 自研 vs SaaS 三方对比。
- **2020+**：云原生时代，「采购」从 SaaS 扩展到云服务（DB / Cache / MQ）。
- **2023-2025**：AI / LLM 时代出现新选项——基础模型 API（OpenAI / Anthropic）+ 垂直领域微调 + Agent 框架。

---

## 2. 核心原理

### 2.1 关键概念定义

- **Make or Buy（自研 vs 采购）**：企业决定「自己生产」还是「从外部购买」的决策。
- **Total Cost of Ownership（TCO）**：总拥有成本 = 初始成本 + 运营成本 + 维护成本 + 培训成本 + 机会成本 + 退役成本。
- **Net Present Value（NPV）**：净现值 = 未来现金流的折现值 - 初始投资。
- **Internal Rate of Return（IRR）**：内部收益率——使 NPV = 0 的折现率。
- **Return on Investment（ROI）**：投资回报率 = (收益 - 成本) / 成本。
- **Strategic Autonomy（战略自主性）**：核心能力不被供应商 / 开源社区「卡脖子」的程度。
- **Vendor Lock-in（供应商锁定）**：难以切换供应商的状态——切换成本极高。
- **Pseudo-Self-Built（伪自研）**：表面「自研」，实际「外壳套了一层开源」——无战略价值。
- **Core Capability（核心能力）**：构成业务差异化的能力（如推荐算法 / 风控模型）。
- **Non-core Capability（非核心能力）**：通用能力（如通用 CRUD / 通用 ETL）。
- **Time-to-Market（TTM）**：上市时间 / 上线时间。
- **Switching Cost（切换成本）**：从方案 A 切换到方案 B 的成本。
- **Open Source（开源）**：自研 / 采购的中间态——有源码但需自己运维。
- **Managed Service（托管服务）**：基于开源的商业托管（如 Confluent Cloud = Kafka 托管）。
- **Build-Operate-Transfer（BOT）**：建设-运营-转让模式（自研 + 后期采购）。
- **Make-Buy-Mix（自研-采购混合）**：核心自研 + 边缘采购的混合模式。
- **Build for Differentiation（差异化自研）**：自研核心能力，构建差异化。
- **Buy for Parity（采购追平）**：采购通用能力，追平对手。
- **Core-Edge-Spot（核心-边缘-机会）**：Gartner 决策框架。
- **Build vs Partner vs Buy**：三选项决策（自研 / 合作 / 采购）。
- **Make-or-Buy Decision Tree**：自研 vs 采购决策树（McKinsey 风格）。

### 2.2 数学 / 形式化基础

**TCO 计算**：

```
TCO_3yr = 初始成本 + Σ (年度运营成本 × 年份) - 残余价值
       = C_init + (C_op + C_maint + C_train) × 3 + C_opp + C_decom - V_residual
```

**NPV / IRR / ROI**：

```
NPV = -C_init + Σ (Benefit_t - Cost_t) / (1 + r)^t
ROI = (Total Benefit - Total Cost) / Total Cost × 100%
IRR：使 NPV = 0 的 r
```

**Payback Period（投资回收期）**：

```
Payback = C_init / (Benefit_per_year - Cost_per_year)
```

**Make-or-Buy Score（McKinsey 简化）**：

```
Score_Make = w1 × (Strategic Value) + w2 × (Capability Fit) + w3 × (TCO Advantage) + w4 × (Time-to-Market)
Score_Buy = w1 × (Vendor Reliability) + w2 × (TCO Advantage) + w3 × (Time-to-Market) + w4 × (Switching Cost Score)

Decision：
- 若 Score_Make > Score_Buy + 1.0 → 自研
- 若 Score_Buy > Score_Make + 1.0 → 采购
- 否则 → 混合（核心自研 + 边缘采购）
```

**风险调整 NPV**：

```
Risk-adjusted NPV = NPV × (1 - P_failure × Loss_factor)
其中 P_failure = 失败概率，Loss_factor = 失败时的损失比例
```

### 2.3 关键算法 / 方法

1. **TCO 计算**——总拥有成本。
2. **NPV / IRR / ROI**——财务量化。
3. **Decision Matrix + Sensitivity Analysis**——多准则打分。
4. **Core-Edge-Spot Framework**——Gartner 核心 / 边缘 / 机会。
5. **Build-Operate-Transfer（BOT）**——分阶段模式。
6. **Risk-adjusted Scoring**——风险调整打分。
7. **Monte Carlo Simulation**——不确定性分析。
8. **Make-or-Buy Decision Tree**——决策树。
9. **Strategic Capability Mapping**——战略能力地图。
10. **Vendor Lock-in Assessment**——供应商锁定评估。
11. **AI-assisted Make-or-Buy**——AI 辅助决策。
12. **Build-vs-Buy-as-Code**——决策即代码（2024+）。

### 2.4 与相邻概念的关系

- **自研 vs 采购 vs 选型**：选型是「在多个产品中选一个」，自研 vs 采购是「自建还是买现成」。
- **自研 vs 采购 vs 合作**：自研（自己建）/ 采购（买现成的）/ 合作（共建 / BOT）。
- **自研 vs 采购 vs 开源**：开源是介于自研与采购之间的中间态——有源码但需自运维。
- **自研 vs 采购 vs SaaS**：SaaS 是采购的现代形态——无需运维、按用量付费。
- **自研 vs 采购 vs 托管**：托管（如 Confluent Cloud）是采购 + 运维外包。

> 💡 **思考锚点**：按 §2.2 的 Make-or-Buy 打分，给你的核心能力项（如推荐 / 风控）算一次：Score_Make 比 Score_Buy 高多少？如果两边差距不到 1.0，本节判据把它归到「混合」档——而你的组织实际按哪一档在投钱、排期？

---

- [§3. 设计模式与范式](03-build-vs-buy-section-3-sec3.md)
- [§4. 工程实现](03-build-vs-buy-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](03-build-vs-buy-section-5-ai.md)
- [§6. 落地实践](03-build-vs-buy-section-6-sec6.md)
- [§7. 与其他方法对比](03-build-vs-buy-section-7-sec7.md)
- [§8. 面试真题集](03-build-vs-buy-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](03-build-vs-buy-section-3-sec3.md)
- [§4. 工程实现](03-build-vs-buy-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](03-build-vs-buy-section-5-ai.md)
- [§6. 落地实践](03-build-vs-buy-section-6-sec6.md)
- [§7. 与其他方法对比](03-build-vs-buy-section-7-sec7.md)
- [§8. 面试真题集](03-build-vs-buy-section-8-sec8.md)

---
