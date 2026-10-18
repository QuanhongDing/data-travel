# 决策智能（Decision Intelligence）

> **一句话定位**：把「规则 + 模型 + LLM Agent + 业务经验」封装成可量化、可解释、可实时、可进化的决策引擎——让每一次业务决策都可度量、可优化、可审计。

> 本文是 data-travel 项目 [Ch9 · 数据智能产品](../../README.md) 的子章节（**02 决策智能**）。覆盖 **R5 数据智能类产品认知** 能力领域中「**决策智能 / 规则引擎 / ML 模型 / Real-Time Decisioning / 营销决策 / 风控决策 / Agent for Decision**」相关的设计模式、工程实现与 AI 时代前沿。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 决策智能是什么？与传统 BI / 决策支持系统的区别是什么？ | §1 |
| 规则引擎 / ML 模型 / LLM Agent / 因果推断的核心原理 | §2 |
| 决策智能的设计模式与反模式 | §3 |
| 决策智能平台从 0 到 1 的工程落地步骤 | §4 |
| 2024-2025 大模型时代，决策智能如何演进？ | §5 |
| 头部企业的真实案例与踩坑经验 | §6 |
| 决策智能 vs 推荐系统 vs 风控系统的取舍 | §7 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：决策智能（Decision Intelligence, DI）是 Gartner 2022 年提出的战略科技趋势，是「**将数据科学、决策科学、社会科学、行为科学、人工智能结合的工程学科**，目的是建立可量化、可解释、可审计、可进化的决策系统」。它不是单一技术，而是「**决策全链路工程方法论 + 技术体系**」。

**工程定义**：决策智能在数据架构师手里，是一份由 **4 层决策栈 + 6 类决策场景** 组成的能力矩阵：

**4 层决策栈**：

- **L1 决策感知层（Sense）**：用户行为、业务事件、外部数据（市场 / 舆情 / 法规）。
- **L2 决策分析层（Analyze）**：特征工程、规则匹配、ML 预测、LLM 推理、因果推断。
- **L3 决策执行层（Decide）**：决策引擎（规则 + 模型 + Agent 编排），输出「做什么 / 不做什么」。
- **L4 决策反馈层（Act & Learn）**：A/B 实验、效果归因、模型迭代、规则更新、Agent 进化。

**6 类决策场景**：

- **营销决策（Marketing Decision）**：优惠券发放、用户分群、触达时机 / 渠道 / 创意、个性化推荐。
- **风控决策（Risk Decision）**：信贷审批、反欺诈、反洗钱、交易拦截。
- **运营决策（Operations Decision）**：库存补货、运力调度、动态定价、促销排期。
- **增长决策（Growth Decision）**：A/B 实验、新功能发布优先级、增长黑客策略。
- **产品决策（Product Decision）**：功能排序、UI 改版、推荐排序、搜索排序。
- **战略决策（Strategy Decision）**：投资组合、市场进入、组织调整（DI + LLM Agent + 知识图谱）。

**解决的核心问题**：

1. **业务经验无法规模化——「老专家离职后业务崩盘」**：决策智能把经验沉淀为规则 + 模型 + Prompt。
2. **决策不可量化——「老板拍脑袋、业务拍大腿」**：决策智能让每一次决策可量化、可对比。
3. **决策不可解释——「模型黑盒，监管合规难过」**：决策智能强调可解释性（XAI + 因果推断）。
4. **决策不可实时——「T+1 报表，比赛结束了」**：决策智能强调实时化（Flink + 实时规则 + 实时模型）。
5. **决策不可进化——「模型上线后效果衰减」**：决策智能强调持续学习 + A/B 实验 + 闭环反馈。

**与传统决策支持系统（DSS）的边界**：

| 维度 | 传统 DSS / BI | 决策智能（DI） |
| --- | --- | --- |
| 决策主体 | 人（管理者看报表做决策） | 人 + 机器协同（部分决策由系统自动执行） |
| 数据来源 | 历史数据 / 内部数据 | 历史 + 实时 + 外部 + LLM |
| 决策延迟 | T+1 / T+7 | 报告 / 分钟级 / 秒级 / 毫秒级 |
| 决策粒度 | 宏观 / 群体 | 微观 / 单用户 / 单事件 |
| 决策方法 | 统计 + OLAP + 简单规则 | 规则 + ML + LLM + 因果 + 多臂老虎机 |
| 决策执行 | 人工执行 | 自动执行 + 人工审核 |
| 反馈闭环 | 无 / 弱 | A/B 实验 + 效果归因 + 模型迭代 |

### 1.2 为什么需要

**业务驱动力**：

- **决策频率爆炸**：电商 1 天 100 亿次个性化推荐 / 营销决策；信贷 1 秒 10 万次风控决策。
- **决策精度要求提升**：从「拍脑袋」到「数据驱动」，从「粗放」到「精细化」。
- **决策实时化要求**：动态定价、欺诈拦截、个性化推荐要求秒级 / 毫秒级响应。
- **合规与可解释**：GDPR、等保 2.0/3.0、《个人信息保护法》要求决策可解释、可审计。
- **大模型赋能决策**：LLM 让「自然语言描述决策」「因果推断」「决策解释」成为可能。

**痛点**：

1. **「规则散落」**：业务规则散落在 100+ 处代码、Excel、邮件里，没人能讲清「为什么是这个决策」。
2. **「模型黑盒」**：ML 模型上线后效果衰减，决策不可解释，合规难过。
3. **「决策与执行脱节」**：BI 出报表，运营手动执行，决策链路长。
4. **「不可量化」**：决策效果归因难，AB 实验缺失，决策 ROI 讲不清。
5. **「实时性差」**：T+1 数据 + 离线模型，决策延迟大。
6. **「无法跨域协同」**：营销、风控、产品决策各自为战，无法形成合力。

**AI 时代的新诉求**：

- **LLM 增强决策**：LLM 让「自然语言查询业务规则」「自然语言解释决策」「多步规划决策」成为可能。
- **Agent for Decision**：智能体自主感知环境、做决策、执行、反馈。
- **因果推断 + ML**：从「相关」到「因果」，决策更稳健。
- **强化学习决策**：多臂老虎机、Contextual Bandit、深度强化学习，让决策在线学习。

### 1.3 在 AI 时代数据架构中的位置

```
                [业务应用层]
                  ↑
        ┌─────────┼─────────┐
        ↓         ↓         ↓
    营销决策   风控决策   运营决策
        │         │         │
        └─────────┼─────────┘
                  ↓
           [决策智能平台]
       (规则 + 模型 + Agent + 因果)
                  │
        ┌─────────┼─────────┐
        ↓         ↓         ↓
     特征平台   模型市场   知识图谱
                  ↓
        [数据基础设施层]
   (数仓 / Lakehouse / 实时计算)
```

- **决策智能平台** 与 **AI 计算平台** 是上下游：AI 计算平台产出模型，决策智能平台消费模型。
- **决策智能平台** 与 **数据智能产品** 是姐妹：决策智能是「实时化、自动化」，数据智能产品是「产品化、业务化」。
- **决策智能平台** 与 **AI 智能体平台** 是交叉：Agent for Decision 是决策智能的子集；决策智能是 Agent 的子能力。

**在企业级数据 / AI 工程体系中的角色**：

- **对业务方**：是「数据驱动决策」的工具——每个业务决策都有数据 / 模型 / 解释支撑。
- **对算法工程师**：是「模型 + 规则 + Agent」的一体化决策平台。
- **对架构师**：是「实时 + 可解释 + 可进化」的业务决策中枢。

**一句话判断**：**会做 BI 是 P6，会做推荐 / 风控模型是 P7，会做决策智能平台是 P8——AI 时代，决策智能是「数据→业务价值」的最后一公里。**

### 1.4 演进历程

**传统阶段（1990s–2010）**：

- 1990s：决策支持系统（DSS）、OLAP、Executive Information System（EIS）。
- 2000s：商业智能（BI）、数据仓库、ETL、报表工具（Cognos、BO、MSTR）。
- 2005-2010：Drools、Jess 等规则引擎商业化。
- 2008-2010：Hadoop / Spark 兴起，BI 与大数据结合。

**智能化阶段（2011-2020）**：

- 2011-2015：随机森林 / XGBoost 等 ML 模型广泛用于决策（信贷 / 反欺诈）。
- 2015-2018：深度学习用于推荐 / 排序决策（YouTube DNN、Wide & Deep）。
- 2017-2020：Real-Time Decisioning（实时决策）兴起——Flink + 规则引擎 + 实时模型（Apache Urule、Easy Rules、Inrule、Spark Streaming）。
- 2018-2020：因果推断（Causal Inference）成熟——DML、Double Machine Learning、CausalForest。

**AI 原生阶段（2021+，LLM + Agent 驱动）**：

- 2021-2022：决策智能（Decision Intelligence）概念成熟，Gartner 把 DI 列为战略科技趋势。
- 2022-2023：因果 AI（Causal AI）、可解释 AI（XAI）、强化学习决策（Multi-Armed Bandit）广泛落地。
- 2023-2024：LLM for Decision 兴起——LLM 解释决策、LLM 推理决策、LLM 生成决策规则。
- 2024-2025：Agent for Decision（智能体决策）成为前沿——Multi-Agent 框架（AutoGen、CrewAI、LangGraph）让决策从「单点智能」走向「协同智能」。
- 2025：决策智能平台（Decision Intelligence Platform, DIP）兴起——Diwo、Zeta、Aera、Tellius、Quantiphi、阿里决策引擎、字节智能决策、蚂蚁决策大脑、平安智慧决策。

**一句话总结**：**决策智能从「DSS → BI → ML 决策 → 实时决策」演进，今天是「AI Native + 实时 + 因果 + 可解释 + 自动化」的关键节点；Agent 决策是 2024–2025 兴起的前沿探索方向，成熟度仍低（[§5.2.2](02-decision-intelligence-section-5-ai.md) 判 L3），只记录、不进架构排期。**

---

## 2. 核心原理

### 2.1 关键概念定义

- **决策引擎（Decision Engine）**：决策智能的核心组件，根据「输入数据 + 规则 + 模型 + 上下文」输出「决策结果」。
- **规则引擎（Rule Engine）**：基于 if-then-else 规则的决策组件。代表：Drools、Easy Rules、Aviator、QLExpress、Apache Urule、Groovy。
- **决策表（Decision Table）**：用表格组织规则，列是条件，行是决策结果。优势：业务方易于理解。
- **决策树（Decision Tree）**：用树形组织规则，从根到叶子逐步匹配。
- **决策流（Decision Flow / DMN）**：用流程图编排多个决策步骤。代表标准：OMG DMN（Decision Model and Notation）。
- **DMN（Decision Model and Notation）**：OMG 标准，定义决策模型的图形化语言。包含 DRD（Decision Requirements Diagram）、Decision、Business Knowledge Model、Input Data 等元素。
- **Drools**：Java 生态最流行的规则引擎，支持 DRL（Drools Rule Language）、决策表、DMN。
- **BRMS（Business Rule Management System）**：业务规则管理系统，强调业务方管理规则。代表：Drools + jBPM、IBM Operational Decision Manager、Red Hat Decision Manager。
- **ML 模型决策（ML-based Decision）**：用机器学习模型（XGBoost / LightGBM / DNN）做决策。代表：信贷评分卡、反欺诈模型、推荐模型。
- **实时决策（Real-Time Decisioning, RTD）**：秒级 / 毫秒级响应决策。技术栈：Flink + 实时规则引擎 + 在线学习模型。
- **批量决策（Batch Decisioning）**：离线批量计算决策结果（如每日用户分群）。技术栈：Spark + 离线规则 + 离线模型。
- **边缘决策（Edge Decisioning）**：在端侧（手机 / IoT / 边缘节点）做决策，减少延迟、保护隐私。
- **因果推断（Causal Inference）**：从「相关」到「因果」，回答「如果做了 X，结果会怎样」。代表方法：DML（Double Machine Learning）、CausalForest、IV（工具变量）、DID（双重差分）、RDD（断点回归）、PSM（倾向得分匹配）。
- **A/B 实验（A/B Testing）**：把用户随机分组，分别用 A / B 方案，对比效果。代表框架：火山引擎 A/B、字节 A/B、阿里 A/B、Optimizely。
- **多臂老虎机（Multi-Armed Bandit, MAB）**：在线学习决策算法，在「探索」与「利用」之间权衡。代表：Epsilon-Greedy、UCB、Thompson Sampling、Contextual Bandit、LinUCB。
- **强化学习决策（Reinforcement Learning Decision）**：用 RL 训练决策策略，适用于序贯决策。代表：DQN、PPO、SAC，应用在动态定价、游戏 AI、推荐系统。
- **可解释 AI（Explainable AI, XAI）**：解释模型决策。代表方法：SHAP、LIME、Integrated Gradients、Counterfactual Explanation。
- **决策可解释性（Decision Interpretability）**：让业务方理解「为什么是这个决策」。包括：特征重要性、决策路径、反事实解释、因果链解释。
- **LLM for Decision**：用 LLM 做决策——LLM 理解业务上下文、生成规则、解释决策。代表：LLM-as-Decision-Maker、LLM-as-Rule-Generator、Chain-of-Thought Decision。
- **Agent for Decision**：智能体自主决策——感知、规划、执行、反馈。代表：AutoGen、CrewAI、LangGraph、MetaGPT、ChatDev。
- **实时特征（Real-Time Feature）**：实时计算的决策特征。技术栈：Flink + Kafka + Redis / HBase。
- **决策可观测（Decision Observability）**：决策链路追踪、效果归因、模型 / 规则衰减告警。
- **决策 ROI（Decision ROI）**：决策效果的量化——每 USD 决策投入产出多少业务价值。
- **Diwo**（公司级 Decision Intelligence 平台）：代表商业平台。
- **Aera Technology**（公司级 Decision Intelligence 平台）：代表商业平台。
- **Zeta Global**（营销决策平台）：代表垂直应用。
- **Quantiphi**（决策智能咨询 + 平台）：代表服务商。
- **Tellius**（决策智能 BI 平台）：代表商业平台。
- **Pecan AI**（预测决策平台）：代表商业平台。

### 2.2 数学 / 形式化基础

**决策函数的数学**：

决策本质是一个**函数 `D: Context × Features → Action`**。决策智能的目标是逼近这个最优函数 `D*`。

- **规则决策**：D 是 `if-then-else` 的布尔组合。
- **ML 决策**：D 是参数化函数 `f(x; θ)`，通过损失函数 `L(θ) = E[(y, f(x; θ))²]` 学习。
- **强化学习决策**：D 是策略 `π(a|s)`，目标是最大化累积奖励 `G = Σ γ^t r_t`。
- **多臂老虎机**：目标是最大化累积奖励，同时最小化「遗憾（Regret）」`R(T) = Σ_t (μ* - μ_{a_t})`。
- **因果决策**：D 是因果效应估计 `E[Y | do(X)]`。
- **LLM 决策**：D 是 `LLM(prompt + context) → action`，本质是基于语言模型的概率生成。

**决策优化的数学**：

- **期望值决策（Expected Value Decision）**：`E[U] = Σ p_i * u_i`，选择期望效用最大的决策。
- **风险调整决策（Risk-Adjusted Decision）**：`E[U] - λ * Var(U)`，考虑风险。
- **多目标决策（Multi-Objective Decision）**：Pareto 最优，权衡多个目标（如收益 vs 风险）。

**因果推断的数学**：

- **潜在结果框架（Potential Outcome Framework, Rubin Causal Model）**：`Y_i(1)` 是处理组潜在结果，`Y_i(0)` 是对照组潜在结果。**因果效应** `τ = E[Y(1) - Y(0)]`。
- **DML（Double Machine Learning）**：先 ML 估计条件期望，再做因果估计。处理高维混杂变量。
- **IV（工具变量）**：用与处理相关、与结果无关的工具变量识别因果。
- **DID（双重差分）**：用处理前后 + 处理对照组差异识别因果。

**A/B 实验的数学**：

- **样本量计算**：`n = (z_{α/2} + z_β)² * (σ² + σ²) / δ²`，其中 δ 是检测的最小效应。
- **统计显著性**：p-value < 0.05，拒绝原假设（H0：A = B）。
- **置信区间**：95% CI [A - 1.96 * SE, A + 1.96 * SE]。

### 2.3 关键算法 / 方法

**1. 规则引擎算法：**

- **RETE 算法（Rete Algorithm）**：Drools 的核心算法，构建「节点 + 共享内存」网络，高效匹配规则。复杂度 O(α × β)，其中 α 是规则数，β 是事实数。
- **RETE-II / TREAT / LEAPS**：RETE 算法的改进版。
- **决策表（Decision Table）**：基于 hit-policy（FIRST / UNIQUE / PRIORITY / RULE ORDER）的决策算法。
- **DMN 模型**：基于 DRD 图的执行引擎。代表：Drools DMN、Camunda DMN。

**2. ML 模型决策算法：**

- **分类模型**：逻辑回归（LR）、决策树（DT）、随机森林（RF）、XGBoost / LightGBM、神经网络（DNN）。
- **排序模型**：LambdaMART、ListNet、DPR（Deep Personalized Ranking）、DIN、DIEN、SIM。
- **预测模型**：LSTM / Transformer 用于销量预测、流量预测、需求预测。
- **多任务模型**：Shared-Bottom、MMoE、PLE、ESMM。

**3. 因果推断算法：**

- **倾向得分匹配（PSM）**：用 LR / GBDT 估计 propensity score，再做匹配。
- **DML（Double Machine Learning）**：Neyman 正交 + ML 残差化，处理高维混杂。
- **CausalForest**：基于随机森林的异质因果效应估计。
- **Meta-Learners**：S-Learner、T-Learner、X-Learner。
- **工具变量（IV）**：2SLS、GMM。

**4. 在线学习决策算法：**

- **多臂老虎机（MAB）**：Epsilon-Greedy、UCB、Thompson Sampling。
- **Contextual Bandit**：LinUCB、NeuralUCB、Epoch-Greedy。
- **强化学习**：DQN、PPO、SAC、A3C。

**5. 实时决策算法：**

- **实时规则**：Drools Fusion、Easy Rules、Flink CEP（Complex Event Processing）。
- **实时模型**：在线学习（Online Gradient Descent、FTRL）、FTRL-Proximal（用于 CTR 预估）。
- **实时特征**：Flink + Kafka + Redis / HBase。

**6. LLM for Decision 算法：**

- **Prompt Engineering**：Zero-shot / Few-shot / Chain-of-Thought（CoT）/ Self-Consistency。
- **LLM-as-Rule-Generator**：用 LLM 从历史决策生成规则。
- **LLM-as-Decision-Reasoner**：用 LLM 解释决策（XAI）。
- **LLM-as-Decision-Maker**：用 LLM 直接做决策（如对话式推荐、对话式营销）。

**7. Agent for Decision 算法：**

- **ReAct**：Reason + Act 循环，让 LLM 推理 + 工具调用。
- **Reflexion**：Agent 反思 + 修正。
- **AutoGen**：Multi-Agent 对话框架。
- **LangGraph**：基于图编排的 Agent 框架。
- **MetaGPT**：Multi-Agent 协作框架。

### 2.4 与相邻概念的关系

- **决策智能 vs 推荐系统**：推荐系统是决策智能的子集（个性化推荐是营销决策的一种）。决策智能还包括风控、运营、增长等场景。
- **决策智能 vs BI**：BI 是「看数据做决策」，决策智能是「系统自动做决策 + 业务方决策辅助」。
- **决策智能 vs 风控系统**：风控是决策智能的子集（风控决策）。决策智能还包括营销、运营等。
- **决策智能 vs 自动化办公**：自动化办公偏向流程自动化（RPA），决策智能偏向认知决策（Agent）。
- **决策智能 vs AI 智能体**：智能体是「感知 + 决策 + 行动 + 反馈」的自主系统，决策智能是「智能体的核心能力」之一。
- **决策智能 vs 量化决策**：量化决策是「数学优化 + 统计建模」的决策方法，决策智能是「规则 + 模型 + LLM + Agent + 因果 + 在线学习」的综合工程学科。

> 💡 **思考锚点**：挑你手上一个真实决策点，它该归进本节的哪一支——规则、ML、在线学习（MAB），还是因果 E[Y|do(X)]？走 A/B 要先按 n 公式算出满足 δ 的样本量与 p<0.05 的判定线，走 MAB 要接受 Regret R(T) 的累积；若你的场景既不能随机分组、样本量也够不到那条线，你手上是不是只剩更慢、更难的因果推断这一支？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](02-decision-intelligence-section-3-sec3.md)
- [§4. 工程实现](02-decision-intelligence-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](02-decision-intelligence-section-5-ai.md)
- [§6. 落地实践](02-decision-intelligence-section-6-sec6.md)
- [§7. 与其他方法对比](02-decision-intelligence-section-7-sec7.md)
- [§8. 面试真题集](02-decision-intelligence-section-8-sec8.md)

---
