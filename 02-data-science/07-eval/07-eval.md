# 效果评估与 A/B 实验（Evaluation & A/B Testing）

> **一句话定位**：离线指标 + 在线 A/B + 因果推断——衡量模型价值的唯一标尺，是 ML 工程化闭环的最后一公里。

> 本文是 data-travel 项目 [Ch2 · 数据科学与算法](../../README.md) 的子章节（**07 效果评估与 A/B 实验**）。覆盖 R2 数据科学算法 领域中"模型评估、效果衡量、A/B 实验、因果推断"相关的核心原理、设计模式、工程实现与 AI 时代演进。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 离线评估指标（AUC / NDCG / MAE）怎么选？业务怎么对齐？ | §2.2 / §2.3 / §3.2 |
| A/B 测试怎么设计？流量分层、SRM 检验怎么做？ | §3.1 / §4.1 / §4.2 |
| Interleaving / 多臂老虎机 / 方差缩减 / CUPED 怎么用？ | §2.3 / §4.2 |
| LLM 怎么评估（HELM / AlpacaEval / Arena / AI-as-Judge）？ | §5.1 / §5.3 |
| Agent 评估（WebArena / SWE-bench）怎么做？ | §5.1 / §5.3 |
| 因果推断与 A/B 测试的关系是什么？ | §2.3 / §5.1 / §7 对比 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：效果评估（Evaluation）是衡量 ML 系统价值的核心环节——通过离线指标、在线 A/B 测试、归因分析、因果推断等方法，判断模型是否真正带来业务价值。

**工程定义**：在数据架构师手里，效果评估是**"业务问题 → 模型问题 → 业务问题"闭环的关键**。它告诉你：这个模型的离线指标好 ≠ 业务价值高；这个 A/B 测试胜出 ≠ 因果有效；这个 LLM 输出"看起来对" ≠ 真的对——所有"证明模型价值"的问题，本质上都是评估。

**解决的业务问题**：

| 业务域 | 典型评估问题 | 评估方法 |
| --- | --- | --- |
| 推荐 / 广告 | 新模型是否带来 CTR / GMV 提升？ | A/B 测试 + 业务指标 |
| 搜索 | 新算法是否提升搜索质量？ | NDCG / MRR + 在线 A/B |
| 风控 | 新规则是否降低欺诈损失？ | 反事实推断 + 历史回放 |
| 内容审核 | 新模型是否提升审核准确率？ | 准确率 / 召回率 + 人工 review |
| LLM 应用 | ChatGPT 哪个版本更好？ | HELM / AlpacaEval / Arena |
| AI Agent | 哪个 Agent 在 WebArena 表现更好？ | WebArena / SWE-bench |
| 营销 | 新活动 ROI 提升多少？ | 因果推断 + CUPED |
| 运营 | 新策略对 GMV 影响多大？ | 双重差分（DID）/ 合成控制 |

**离线评估 vs 在线 A/B 测试**：

| 维度 | 离线评估 | 在线 A/B 测试 |
| --- | --- | --- |
| 数据 | 历史数据 | 真实流量 |
| 速度 | 快（小时 - 天） | 慢（天 - 周） |
| 成本 | 低 | 高（损失机会成本） |
| 真实性 | 中（历史 ≠ 未来） | **高（真实场景）** |
| 决策 | 不能上线 | **可上线决策** |
| 风险 | 低 | 高（直接影响业务） |

**因果推断 vs 相关分析**：

- **相关分析**：A 模型 AUC 高 → 可能带来业务价值（但不一定）。
- **因果推断**：A 模型上线后，业务指标提升 X%（且这是因果关系）。

### 1.2 为什么需要

**业务驱动力**：

- **离线高大上、上线垮掉**是 ML 系统第一灾难。**只有 A/B 测试 + 因果推断能避免这种灾难**。
- **"统计显著但业务无感"**是数据科学家最常踩的坑。**业务对齐是评估的核心**。
- **LLM 时代评估更复杂**。LLM 输出开放文本，没有标准答案，需要 LLM-as-Judge / Human Eval。
- **AI Agent 评估是 2024 新前沿**。WebArena / SWE-bench 评估 Agent 在真实环境中的能力。
- **合规与可解释性**：GDPR / 等保 2.0 要求算法可解释、可追溯、可审计。

**痛点**：

1. **离线 / 在线不对齐**：AUC 提升 1%，但 CTR 没动。
2. **A/B 测试周期长**：动辄 2 周 - 2 个月，业务变化快。
3. **流量不够**：小业务 A/B 测试需要很长时间才能统计显著。
4. **SRM（Sample Ratio Mismatch）**：流量分配偏离预期，导致结论错误。
5. **多重比较问题**：同时测试 10 个指标，至少 1 个假阳性。
6. **新奇效应（Novelty Effect）**：新模型上线初期效果好，长期效果下降。
7. **长尾评估**：少数长尾样本效果差，被平均掩盖。
8. **因果推断与相关混淆**：广告投放多时销量好，但因果方向可能反过来。
9. **LLM 评估不稳定**：LLM-as-Judge 评分波动大。
10. **Agent 评估困难**：Agent 多步决策，结果难复现。

### 1.3 在 AI 时代数据架构中的位置

**与上下游模块的关系**：

```
[模型训练] ─→ [离线评估] ─→ [预上线]
   ↓                            ↓
   └─→ [A/B 测试] ─→ [因果推断] ─→ [全量上线]
        ↓
   [业务指标监控 + 反馈回流]
```

**在数据架构中的角色**：

- **ML 闭环最后一公里**：评估决定模型是否上线。
- **决策依据**：评估结果是产品 / 业务 / 技术的共同语言。
- **合规保障**：评估可解释性满足等保 2.0 / GDPR。
- **AI 时代新能力**：LLM 评估、Agent 评估、因果推断是 2024+ 核心能力。

**与 LLM 的边界**：

- **LLM 评估**用 LLM-as-Judge + Human Eval + Arena。
- **Agent 评估**用 WebArena / SWE-bench 等基准。
- **传统 ML 评估**用 A/B 测试 + 业务指标 + 因果推断。

**一句话判断**：**会建模是 P7，会评估是 P8——评估是数据架构师"判断价值"的硬功夫，是连接"技术"与"业务"的桥梁。**

### 1.4 演进历程

**传统统计评估阶段（1900s–2010）**：

- 1900s：Pearson / Fisher 提出**统计检验**（t 检验 / 卡方检验）。
- 1920s：**A/B 测试**在农业 / 医学领域普及。
- 1990s：互联网公司把 A/B 测试标准化（Google / Amazon / Microsoft）。
- 2000s：**方差缩减**（CUPED）、**多重比较校正**（Bonferroni / FDR）。

**ML 评估普及（2010–2018）**：

- 2010：Netflix Prize 让 RMSE / NDCG 成为推荐系统标准指标。
- 2012：Kaggle 推动 GBDT 评估指标标准化（LogLoss / AUC）。
- 2014：**Interleaving** 方法（Yahoo / Microsoft）解决 A/B 测试慢问题。
- 2016：**Google Overlapping Experiment** 框架支持多变量实验。

**因果推断阶段（2018+）**：

- 2018：DML（Double Machine Learning）成为因果推断标准方法。
- 2019：Causal Forest 工业化。
- 2020：**合成控制法**（Synthetic Control）在大数据场景普及。
- 2021：**DR-Learner**（Doubly Robust Learner）。

**LLM 评估阶段（2022+）**：

- 2022：HELM（Stanford）——LLM 综合评估。
- 2023：AlpacaEval / MT-Bench / Chatbot Arena——LLM 对话评估。
- 2023：OpenAI Evals——开源 LLM 评估框架。
- 2024：**AI-as-Judge**（GPT-4 评估 LLM）成为标配。
- 2024：Anthropic / Google 推出内部 LLM 评估平台。

**Agent 评估阶段（2023+）**：

- 2023：**WebArena**（CMU）——Agent Web 任务评估。
- 2024：**SWE-bench**——Agent 代码任务评估。
- 2024：**AgentBench**——Agent 综合评测。
- 2025：**GAIA / ToolBench**——Agent 多步推理评估。

**一句话总结**：**评估从"统计检验"到"ML 评估"到"因果推断"到"LLM / Agent 评估"四阶段演进，今天的 AI 时代是"LLM 评估 + Agent 评估 + 因果推断"的混合范式。**

---

## 2. 核心原理

### 2.1 关键概念定义

- **评估指标（Metric）**：衡量模型效果的量化指标。
- **离线评估（Offline Evaluation）**：在历史数据上评估。
- **在线评估（Online Evaluation）**：在真实流量上评估（A/B 测试）。
- **A/B 测试（A/B Testing）**：随机分组对照实验。
- **流量分层（Layer / Domain）**：不同实验在不同流量层。
- **实验分流（Traffic Allocation）**：把用户随机分到不同组。
- **哈希分桶（Hash Bucket）**：基于用户 ID 哈希分桶，保证稳定分组。
- **SRM（Sample Ratio Mismatch）**：实际流量分配比例偏离预期。
- **p-value**：在原假设为真时，观察到当前结果或更极端结果的概率。
- **统计显著性（Statistical Significance）**：p-value < α（通常 α=0.05）。
- **功效（Power）**：正确拒绝原假设的概率（1-β，通常 0.8）。
- **效应量（Effect Size）**：实际差异的大小（Cohen's d / 相对提升）。
- **置信区间（Confidence Interval）**：效应量的可信范围。
- **CUPED（Controlled-experiment Using Pre-Existing Data）**：用历史数据缩减方差。
- **方差缩减（Variance Reduction）**：提升 A/B 测试效率。
- **Interleaving**：把两个实验的候选混合展示，加快评估。
- **多重比较（Multiple Testing）**：同时测多个指标时，假阳性率升高。
- **Bonferroni 校正**：α / n 校正。
- **FDR 校正**（False Discovery Rate）：BH / BY 校正。
- **新奇效应（Novelty Effect）**：新模型上线初期因新奇效果好。
- **学习效应（Learning Effect）**：用户逐渐适应新系统，效果提升。
- **因果推断（Causal Inference）**：从相关推断因果。
- **ATE（Average Treatment Effect）**：平均处理效应。
- **CATE（Conditional ATE）**：条件平均处理效应。
- **ITE（Individual TE）**：个体处理效应。
- **DID（Difference-in-Differences）**：双重差分。
- **PSM（Propensity Score Matching）**：倾向得分匹配。
- **IV（Instrumental Variable）**：工具变量。
- **RCT（Randomized Controlled Trial）**：随机对照实验，金标准。
- **合成控制（Synthetic Control）**：用其他单元加权构造"对照组"。
- **HELM（Holistic Evaluation of Language Models）**：Stanford LLM 综合评估。
- **AlpacaEval**：基于 GPT-4 自动评估 LLM。
- **MT-Bench / Chatbot Arena**：LLM 对话排名。
- **AI-as-Judge**：用 LLM 评估 LLM。
- **WebArena / SWE-bench**：Agent 评估基准。
- **归因分析（Attribution Analysis）**：把转化归因到触点。
- **因果归因（Casual Attribution）**：用因果推断做归因。
- **NDCG（Normalized DCG）**：归一化折损累积增益。
- **MRR（Mean Reciprocal Rank）**：平均倒数排名。
- **MAP（Mean Average Precision）**：平均精度均值。
- **GAUC（Group AUC）**：分组 AUC，推荐专用。
- **LogLoss**：对数损失。
- **AUC**：ROC 曲线下面积。
- **PR-AUC**：PR 曲线下面积。
- **MAE / RMSE**：回归评估。
- **R² / Adjusted R²**：回归解释方差。
- **MAPE / SMAPE**：回归百分比误差。

### 2.2 数学 / 形式化基础

**A/B 测试的数学框架**：

两组样本：实验组 $X_1, \ldots, X_n$（处理 T），对照组 $Y_1, \ldots, Y_m$（无处理 C）。

原假设 $H_0: \mu_T = \mu_C$。

**t 检验**（连续指标，方差相等）：

$$t = \frac{\bar{X} - \bar{Y}}{s_p \sqrt{1/n + 1/m}}$$

其中 $s_p^2 = \frac{(n-1)s_X^2 + (m-1)s_Y^2}{n+m-2}$ 是合并方差。

**z 检验**（大样本，比例类指标）：

$$z = \frac{\hat{p}_T - \hat{p}_C}{\sqrt{\hat{p}(1-\hat{p})(1/n + 1/m)}}$$

**样本量计算**：

$$n = \frac{(z_{\alpha/2} + z_\beta)^2 \cdot 2\sigma^2}{\delta^2}$$

其中 $\delta$ 是最小可检测效应（MDE）。

**CUPED 方差缩减**：

$$\tilde{Y}_i = Y_i - \theta (X_i - \bar{X})$$

其中 $X_i$ 是协变量（如用户预期间指标），$\theta = \text{Cov}(Y, X) / \text{Var}(X)$。

缩减后方差：$\text{Var}(\tilde{Y}) = (1 - \rho^2) \text{Var}(Y)$，$\rho$ 是 $Y$ 与 $X$ 的相关系数。

**多重比较校正（Bonferroni）**：

若测试 $k$ 个指标，调整显著性水平 $\alpha' = \alpha / k$。

**FDR 校正（Benjamini-Hochberg）**：

按 p-value 排序，找最大 $i$ 使得 $p_{(i)} \leq i \cdot \alpha / k$，拒绝所有 $p \leq p_{(i)}$ 的假设。

**因果推断的数学框架**：

**ATE**：

$$\text{ATE} = E[Y(1) - Y(0)]$$

其中 $Y(1)$ 是处理下的结果，$Y(0)$ 是无处理的结果（反事实）。

**PSM**：

1. 估计倾向得分 $e(x) = P(T=1 \mid X=x)$。
2. 按 $e(x)$ 匹配处理 / 对照样本。
3. 计算匹配后的平均差异。

**DML（Double Machine Learning）**：

估计两个 ML 模型：
$$\hat{Y} = m(X) + \epsilon_1, \quad T = e(X) + \epsilon_2$$

残差化：
$$\tilde{Y} = Y - \hat{Y}, \quad \tilde{T} = T - \hat{e}(X)$$

回归：
$$\text{ATE} = \frac{\text{Cov}(\tilde{Y}, \tilde{T})}{\text{Var}(\tilde{T})}$$

**DID（双重差分）**：

$$\text{ATE}_{DID} = (Y_{T,\text{post}} - Y_{T,\text{pre}}) - (Y_{C,\text{post}} - Y_{C,\text{pre}})$$

**评估指标的数学定义**：

- **Precision**：$TP / (TP + FP)$
- **Recall**：$TP / (TP + FN)$
- **F1**：$2 \cdot P \cdot R / (P + R)$
- **AUC**：ROC 曲线下面积。
- **NDCG@k**：$NDCG@k = \frac{DCG@k}{IDCG@k}$，其中 $DCG@k = \sum_{i=1}^k \frac{rel_i}{\log_2(i+1)}$。

### 2.3 关键算法 / 方法

**A/B 测试**：

1. **t 检验 / z 检验**——经典统计检验。
2. **非参数检验**（Mann-Whitney U / Wilcoxon）——非正态分布。
3. **Bootstrap**——重采样估计置信区间。
4. **Bayesian A/B 测试**——用 Beta 分布 + 后验概率。
5. **CUPED**——方差缩减。
6. **多重比较校正**（Bonferroni / BH / FDR）。

**方差缩减**：

7. **CUPED**（2013，Microsoft）——协方差缩减。
8. **Stratified Sampling**——分层抽样。
9. **Regression Adjustment**——回归调整。
10. **Switchback / Switchback Designs**——切换设计。

**Interleaving**：

11. **Balanced Interleaving**——平衡混合。
12. **Team Draft Interleaving**——团队草稿。
13. **Probabilistic Interleaving**——概率混合。

**多臂老虎机**：

14. **ε-greedy**——探索 ε 概率。
15. **UCB**（Upper Confidence Bound）——基于置信上界。
16. **Thompson Sampling**——基于后验采样。
17. **Contextual Bandit**——带上下文的 Bandit。

**因果推断**：

18. **RCT**——随机对照实验，金标准。
19. **PSM**——倾向得分匹配。
20. **IV / 2SLS**——工具变量。
21. **DID**——双重差分。
22. **Synthetic Control**——合成控制法。
23. **Causal Forest**（2018）——异质处理效应。
24. **DML**（2018）——Double Machine Learning。
25. **DR-Learner**——双重稳健学习。
26. **T-Learner / S-Learner / X-Learner**——Uplift 建模。

**归因分析**：

27. **Last-Touch Attribution**——最后一次触点归因。
28. **First-Touch Attribution**——第一次触点归因。
29. **Linear Attribution**——线性归因。
30. **Time-Decay Attribution**——时间衰减。
31. **Shapley Value Attribution**——基于博弈论的归因。
32. **Data-Driven Attribution**——数据驱动归因。

**LLM 评估**：

33. **BLEU / ROUGE**——传统文本相似度。
34. **BERTScore**——基于 BERT 的相似度。
35. **HELM**（2022，Stanford）——LLM 综合评估。
36. **AlpacaEval**（2023）——基于 GPT-4 自动评估。
37. **MT-Bench**（2023）——多轮对话评估。
38. **Chatbot Arena**（2023，LMSYS）——人类偏好排名。
39. **OpenAI Evals**（2023）——开源 LLM 评估。
40. **AI-as-Judge**（2024）——用 LLM 评估 LLM。
41. **Process Reward Model（PRM）**（2024）——推理步骤评估。

**Agent 评估**：

42. **WebArena**（2023，CMU）——Agent Web 任务。
43. **SWE-bench**（2024，Princeton）——Agent 代码任务。
44. **AgentBench**（2024，THU）——Agent 综合评测。
45. **GAIA**（2024，Meta）——Agent 多步推理。
46. **ToolBench**（2023）——Agent Tool 使用。

### 2.4 与相邻概念的关系

- **离线评估 vs 在线 A/B**：离线快但失真，在线真实但慢。
- **A/B 测试 vs 因果推断**：A/B 测试是因果推断的金标准；因果推断是 A/B 测试的扩展。
- **归因分析 vs 因果推断**：归因分析是描述性，因果推断是因果性。
- **LLM 评估 vs 传统 ML 评估**：传统 ML 评估用准确率，LLM 评估用语义相似度 / 偏好。
- **Agent 评估 vs LLM 评估**：LLM 评估看输出，Agent 评估看多步决策结果。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：离线 → 在线两阶段（Offline-Online Pipeline）**

- 离线评估 → 候选模型筛选。
- A/B 测试 → 真实流量验证。
- 因果推断 → 最终归因。
- 适合：标准 ML 上线流程。

**模式 2：Interleaving 加速（Interleaving-First）**

- 用 Interleaving 快速比较两个模型。
- 比 A/B 测试快 10-100 倍。
- 适合：搜索 / 推荐排序。

**模式 3：多臂老虎机（Bandit）**

- 用 Bandit 做实时探索-利用。
- 适合：内容推荐 / 营销 / 动态定价。
- 优势：实时、最小化损失。

**模式 4：方差缩减（CUPED）**

- 用 CUPED 缩减 A/B 测试方差，提升灵敏度。
- 适合：流量小的实验。

**模式 5：因果推断（Caual Inference）**

- 不能做 A/B 测试时，用因果推断（PSM / DID / DML）。
- 适合：政策评估、营销归因、不能随机化的场景。

**模式 6：LLM 评估（LLM-as-Judge + Human Eval）**

- AI-as-Judge + 人类评估。
- 适合：ChatGPT / Claude 等对话模型。

**模式 7：Agent 评估（WebArena / SWE-bench）**

- Agent 在真实环境完成任务评估。
- 适合：AI Agent 平台。

**模式 8：流量分层（Layered Experimentation）**

- 不同层做不同实验，互不干扰。
- 适合：大型公司多团队并行实验。
- 工具：Google Overlapping Experiment、字节 ABT、阿里 POE。

**模式 9：自动评估（Auto-Evaluation）**

- 离线指标 + 在线 A/B + 因果推断 + LLM-as-Judge 自动化。
- 适合：CI/CD 流水线。

**模式 10：Holdout + 长期监控（Holdout）**

- 留 5-10% 流量做长期监控。
- 适合：避免新奇效应误判。

### 3.2 适用场景决策表

| 业务特征 | 推荐评估方法 | 理由 |
| --- | --- | --- |
| 标准 ML 模型上线 | 离线 + A/B 测试 + 业务指标 | 标准流程 |
| 流量小、需快速决策 | Interleaving / CUPED | 加速 |
| 实时个性化 | Contextual Bandit | 实时 |
| 不能随机化 | 因果推断（PSM / DID / DML） | 准实验 |
| 政策效果 | DID / Synthetic Control | 政策评估 |
| 营销归因 | Shapley Value / Data-Driven Attribution | 多触点 |
| LLM 对话 | AlpacaEval / Arena / AI-as-Judge | LLM 评估 |
| LLM 推理（数学 / 代码） | PRM / Pass@k | 推理评估 |
| AI Agent | WebArena / SWE-bench | Agent 评估 |
| 搜索排序 | Interleaving + NDCG | 搜索评估 |
| 推荐排序 | A/B 测试 + CTR / GMV + GAUC | 推荐评估 |
| 长期效果 | Holdout + 长期监控 | 避免新奇效应 |
| 多团队并行 | 流量分层（Layered） | 互不干扰 |
| 多指标 | FDR / Bonferroni | 多重比较 |
| LLM-as-Judge 校准 | Human Eval + 一致性 | 校准 LLM Judge |
| 公平性 | 反事实公平性评估 | 公平性 |

### 3.3 反模式与陷阱

1. **「只看离线 AUC」反模式**：AUC 0.85 → 0.86，业务完全没动。**A/B 测试是唯一标尺**。
2. **「A/B 测试时间太短」反模式**：3 天看结果，被新奇效应骗。**至少覆盖 1-2 个完整周期**。
3. **「忽视 SRM」反模式**：流量分配偏离预期，结论错误。**必须每天检查 SRM**。
4. **「多重比较不管」反模式**：测 10 个指标，p=0.04 看起来显著，实际是假阳性。**用 Bonferroni / FDR 校正**。
5. **「样本量不够硬上」反模式**：流量只有 1000，硬要做 A/B，统计功效不够。**先计算最小样本量**。
6. **「把 Interleaving 当 A/B」反模式**：Interleaving 只适合搜索 / 推荐排序，不能替代 A/B。**Interleaving + A/B 组合**。
7. **「新奇效应误判」反模式**：上线第 1 周效果好，长期效果下降。**必须 Holdout 长期监控**。
8. **「相关 = 因果」反模式**：投放多时销量好，因果方向可能反过来。**用 RCT / IV / DML 做因果**。
9. **「LLM-as-Judge 不校准」反模式**：GPT-4 评估波动大，不能直接用。**用 Human Eval 校准 + 一致性**。
10. **「Agent 评估只看最终结果」反模式**：Agent 多步决策失败可能是中间某步错。**必须过程评估**。
11. **「无 Holdout」反模式**：所有流量都在做实验，没有对照组。**必须留 5-10% Holdout**。
12. **「LLM 评估无 Golden Set」反模式**：LLM 输出没有标准答案，随机评估。**必须建立 Golden Set + 持续更新**。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务目标与指标对齐**

- 明确业务目标（CTR / GMV / 时长 / 满意度）。
- 选定评估指标（AUC / NDCG / GMV）。
- 离线指标 vs 业务指标映射。
- 输出：**评估指标体系文档**。

**Step 2：离线评估**

- 建立离线评估 pipeline（数据 + 模型 + 指标计算）。
- 多指标对比（LogLoss / AUC / NDCG / MAE）。
- 错误分析（分场景看效果）。
- 输出：**离线评估报告**。

**Step 3：A/B 测试设计**

- 计算最小样本量（MDE + α + β）。
- 设计流量分层（Layer / Domain）。
- 设计实验分组（实验组 / 对照组 + 比例）。
- 预估实验周期（流量 × 样本量）。
- 输出：**A/B 测试方案**。

**Step 4：A/B 测试执行**

- 配置实验（分流、参数、流量）。
- 监控 SRM（每天检查）。
- 监控指标（核心 + 护栏指标）。
- 输出：**实验配置 + 监控 dashboard**。

**Step 5：因果推断（可选）**

- 实验组 / 对照组反事实分析。
- 长期效果评估（Holdout）。
- 异质性分析（CATE）。
- 输出：**因果推断报告**。

**Step 6：归因分析**

- 转化归因（最后 / 首次 / 线性 / Shapley）。
- 多触点贡献度。
- ROI 评估。
- 输出：**归因分析报告**。

**Step 7：决策与上线**

- 综合离线 + A/B + 因果 + 归因结果。
- 决策：全量 / 灰度 / 回滚。
- 输出：**上线决策报告**。

**Step 8：长期监控**

- Holdout 长期监控（30-90 天）。
- 漂移检测（数据漂移 / 概念漂移）。
- 持续评估（CI/CD）。
- 输出：**监控 dashboard + 自动化 pipeline**。

### 4.2 关键技术点

**A/B 测试关键技术**：

1. **流量分层（Layer）**：不同层做不同实验，互不干扰。
2. **哈希分桶**：基于用户 ID 哈希分桶，保证稳定分组。
3. **SRM 检测**：每天检查流量分配比例（Chi-square 检验）。
4. **样本量计算**：基于 MDE + α + β 计算。
5. **多重比较校正**：Bonferroni / FDR / BH。
6. **新奇效应处理**：Holdout 长期监控。
7. **学习效应**：保留学习时间后再评估。

**方差缩减关键技术**：

8. **CUPED**（Microsoft 2013）——协方差缩减。
9. **Stratified Sampling**——分层抽样。
10. **Regression Adjustment**——回归调整。
11. **Switchback**——切换设计（适合用户级不可分）。

**Bandit 关键技术**：

12. **ε-greedy**——简单探索。
13. **UCB**——基于置信上界。
14. **Thompson Sampling**——基于后验采样。
15. **Contextual Bandit**——带上下文的 Bandit。

**Interleaving 关键技术**：

16. **Balanced Interleaving**——平衡混合。
17. **Team Draft Interleaving**——团队草稿。
18. **Probabilistic Interleaving**——概率混合。
19. **Interleaving + A/B**——组合使用。

**因果推断关键技术**：

20. **RCT**——金标准。
21. **PSM**——倾向得分匹配。
22. **IV / 2SLS**——工具变量。
23. **DID**——双重差分。
24. **Synthetic Control**——合成控制。
25. **Causal Forest**——异质处理效应。
26. **DML**——Double ML。
27. **DR-Learner**——双重稳健。

**LLM 评估关键技术**：

28. **Golden Set 建设**：高质量评估数据集。
29. **AI-as-Judge 校准**：用 Human Eval 校准 LLM 评分。
30. **多维度评估**：准确性、安全性、流畅性、有用性。
31. **持续评估**：CI/CD 中加入 LLM 评估。
32. **一致性（Agreement）**：LLM-Judge vs Human 一致性。

**Agent 评估关键技术**：

33. **真实环境任务**：WebArena / SWE-bench。
34. **过程评估**：每步决策 + 最终结果。
35. **Tool 使用效率**：成功率 + 步数。
36. **安全性**：避免破坏性操作。

### 4.3 工具链与平台

**A/B 测试平台**：

- **Google Optimize**（已停用）——Google A/B 测试。
- **Optimizely**（商业）——A/B 测试平台。
- **VWO**（商业）——A/B 测试。
- **AB Tasty**（商业）——A/B 测试。
- **字节 ABT**（内部）——字节 A/B 平台。
- **阿里 POE / 阿里云 A/B 平台**（商业）——阿里 A/B。
- **腾讯 TGA**（内部）——腾讯 A/B 平台。
- **美团 A/B 平台**（内部）——美团。
- **京东 A/B 平台**（内部）——京东。

**开源 A/B 测试**：

- **GrowthBook**（开源）——A/B 测试 + Feature Flag。
- **Unleash**（开源）——Feature Flag + A/B。
- **Statsig**（商业 + 部分开源）——Feature Flag + A/B。
- **Eppo**（商业）——A/B 测试。
- **PlanOut**（Meta / 开源）——实验框架。

**因果推断库**：

- **DoWhy**（Microsoft / 开源）——因果推断端到端。
- **EconML**（Microsoft / 开源）——CATE / Uplift。
- **CausalML**（Uber / 开源）——Uplift 建模工业库。
- **PyWhy**（开源）——因果推断统一平台。

**LLM 评估工具**：

- **HELM**（Stanford / 开源）——LLM 综合评估。
- **AlpacaEval**（Stanford / 开源）——LLM 自动评估。
- **MT-Bench / Chatbot Arena**（LMSYS / 开源）——LLM 排名。
- **OpenAI Evals**（开源）——LLM 评估框架。
- **Anthropic Evals**（开源）——Claude 评估。
- **lm-evaluation-harness**（EleutherAI / 开源）——LLM 评估。
- **Baidu EvalScope**（2024）——国产 LLM 评估。
- **阿里 EvaluatE**（2024）——国产 LLM 评估。

**Agent 评估工具**：

- **WebArena**（CMU / 开源）——Agent Web 评估。
- **SWE-bench**（Princeton / 开源）——Agent 代码评估。
- **AgentBench**（THU / 开源）——Agent 综合评估。
- **GAIA**（Meta / 开源）——Agent 多步推理。
- **ToolBench**（开源）——Agent Tool 评估。

**实验管理**：

- **MLflow**（开源）——ML 实验管理。
- **Weights & Biases**（商业）——ML 实验管理。
- **Neptune.ai**（商业）——ML 实验管理。
- **Aim**（开源）——ML 实验管理。

**统计计算库**：

- **scipy.stats**（Python / 开源）——统计检验。
- **statsmodels**（Python / 开源）——统计模型。
- **Pingouin**（Python / 开源）——统计检验。
- **R**——统计计算。

**2024-2025 新工具**：

- **Anthropic Evals**（2024）——Claude 评估。
- **OpenAI Evals**（2024）——多模态评估。
- **Google Vertex AI Evaluation**（2024）——LLM 评估服务。
- **阿里云 PAI Eval**（2024）——国产 LLM 评估。
- **字节豆包 Eval**（2024）——LLM 评估。
- **腾讯混元 Eval**（2024）——LLM 评估。

### 4.4 代码 / 示例

**示例 1：A/B 测试样本量计算**

```python
import numpy as np
from scipy import stats

def sample_size(baseline_rate, mde, alpha=0.05, power=0.8):
    """计算 A/B 测试样本量"""
    z_alpha = stats.norm.ppf(1 - alpha / 2)
    z_beta = stats.norm.ppf(power)

    p1 = baseline_rate
    p2 = baseline_rate + mde
    p_pool = (p1 + p2) / 2

    n = ((z_alpha * np.sqrt(2 * p_pool * (1 - p_pool)) +
          z_beta * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) / (mde ** 2)
    return int(np.ceil(n))

# 假设 baseline CTR 5%，想检测 1% 相对提升
baseline = 0.05
mde = 0.005  # 绝对提升
n = sample_size(baseline, mde)
print(f"每组样本量 = {n}, 总样本量 = {2 * n}")
```

**示例 2：A/B 测试显著性检验**

```python
import numpy as np
from scipy import stats

def ab_test(control, treatment, alpha=0.05):
    """A/B 测试 t 检验"""
    n_c, n_t = len(control), len(treatment)
    mean_c, mean_t = np.mean(control), np.mean(treatment)
    std_c, std_t = np.std(control, ddof=1), np.std(treatment, ddof=1)

    # 合并方差
    se = np.sqrt(std_c**2 / n_c + std_t**2 / n_t)
    t_stat = (mean_t - mean_c) / se
    p_value = 2 * (1 - stats.t.cdf(abs(t_stat), df=n_c + n_t - 2))

    # 置信区间
    z = stats.norm.ppf(1 - alpha / 2)
    ci_low = (mean_t - mean_c) - z * se
    ci_high = (mean_t - mean_c) + z * se

    return {
        "control_mean": mean_c,
        "treatment_mean": mean_t,
        "diff": mean_t - mean_c,
        "relative_lift": (mean_t - mean_c) / mean_c,
        "p_value": p_value,
        "significant": p_value < alpha,
        "ci_95": (ci_low, ci_high),
    }

# 使用
control = np.random.normal(0.05, 0.01, 10000)  # 对照组 CTR 5%
treatment = np.random.normal(0.055, 0.01, 10000)  # 实验组 CTR 5.5%
result = ab_test(control, treatment)
print(result)
```

**示例 3：CUPED 方差缩减**

```python
import numpy as np

def cuped(y, x, theta=None):
    """CUPED 方差缩减"""
    if theta is None:
        theta = np.cov(y, x)[0, 1] / np.var(x)
    y_cuped = y - theta * (x - np.mean(x))
    return y_cuped, theta

# 模拟：预期间指标 vs 当前指标
pre_period = np.random.normal(0.05, 0.01, 10000)
post_period = np.random.normal(0.052, 0.01, 10000)

# 普通 A/B 测试
from scipy import stats
t_stat = (np.mean(post_period) - np.mean(pre_period)) / np.std(post_period) * np.sqrt(10000)
print(f"普通方差: {np.var(post_period):.6f}")

# CUPED
y_cuped, theta = cuped(post_period, pre_period)
print(f"CUPED 方差: {np.var(y_cuped):.6f}")
print(f"方差缩减比例: {1 - np.var(y_cuped) / np.var(post_period):.2%}")
```

**示例 4：因果推断（DID 双重差分）**

```python
import numpy as np
import pandas as pd

def did_estimate(data, treatment_col, time_col, outcome_col):
    """DID 估计"""
    # 处理前后均分
    pre_t = data[(data[treatment_col] == 1) & (data[time_col] == 'pre')][outcome_col].mean()
    post_t = data[(data[treatment_col] == 1) & (data[time_col] == 'post')][outcome_col].mean()
    pre_c = data[(data[treatment_col] == 0) & (data[time_col] == 'pre')][outcome_col].mean()
    post_c = data[(data[treatment_col] == 0) & (data[time_col] == 'post')][outcome_col].mean()

    # DID = (处理组前后差) - (对照组前后差)
    did = (post_t - pre_t) - (post_c - pre_c)
    return {
        "treatment_pre": pre_t,
        "treatment_post": post_t,
        "control_pre": pre_c,
        "control_post": post_c,
        "did_effect": did,
        "relative_effect": did / pre_t,
    }

# 模拟数据
np.random.seed(42)
data = pd.DataFrame({
    'group': np.random.choice([0, 1], 1000),
    'time': np.random.choice(['pre', 'post'], 1000),
    'outcome': np.random.normal(0.1, 0.05, 1000)
})
# 处理组在 post 时期 +5%
data.loc[(data['group'] == 1) & (data['time'] == 'post'), 'outcome'] += 0.05

result = did_estimate(data, 'group', 'time', 'outcome')
print(result)
```

**示例 5：LLM 评估（AI-as-Judge）**

```python
import openai
import json

def llm_as_judge(prompt: str, response: str, reference: str = None) -> dict:
    """用 GPT-4 评估 LLM 输出"""
    client = openai.OpenAI(api_key="sk-...")

    eval_prompt = f"""请评估以下 LLM 输出的质量（1-10 分）：

任务：{prompt}
LLM 输出：{response}
{f"参考答案：{reference}" if reference else ""}

请按以下维度评分（JSON 格式）：
- accuracy：准确性 (1-10)
- relevance：相关性 (1-10)
- helpfulness：有用性 (1-10)
- safety：安全性 (1-10)
- overall：总分 (1-10)
- reason：评分理由

只输出 JSON，不要其他内容。"""

    response_eval = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": eval_prompt}],
        temperature=0
    )
    return json.loads(response_eval.choices[0].message.content)

# 使用
result = llm_as_judge(
    prompt="解释什么是 RAG",
    response="RAG 是检索增强生成...",
    reference="RAG 通过检索外部知识增强 LLM 生成的准确性..."
)
print(result)
```

**示例 6：LLM 评估一致性（LLM-as-Judge vs Human）**

```python
from scipy.stats import pearsonr, spearmanr
import numpy as np

def judge_human_agreement(human_scores, llm_scores):
    """计算 LLM-as-Judge 与人类评分的一致性"""
    pearson_r, _ = pearsonr(human_scores, llm_scores)
    spearman_r, _ = spearmanr(human_scores, llm_scores)
    return {
        "pearson": pearson_r,
        "spearman": spearman_r,
        "n_samples": len(human_scores),
    }

# 模拟数据
np.random.seed(42)
human = np.random.normal(7, 1.5, 100)
llm = human + np.random.normal(0, 0.5, 100)  # LLM 与人类评分相关

result = judge_human_agreement(human, llm)
print(result)
```

**示例 7：Bandit Thompson Sampling**

```python
import numpy as np

class ThompsonSampling:
    """Thompson Sampling 用于 A/B/n 测试"""
    def __init__(self, n_arms):
        self.n_arms = n_arms
        self.alpha = np.ones(n_arms)  # Beta 分布参数
        self.beta = np.ones(n_arms)

    def select(self):
        """Thompson Sampling 选择"""
        samples = np.array([
            np.random.beta(self.alpha[i], self.beta[i])
            for i in range(self.n_arms)
        ])
        return np.argmax(samples)

    def update(self, arm, reward):
        """更新参数"""
        if reward == 1:
            self.alpha[arm] += 1
        else:
            self.beta[arm] += 1

    def get_probabilities(self):
        """获取各 arm 的后验均值"""
        return self.alpha / (self.alpha + self.beta)
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：LLM 评估体系**

2022-2024 LLM 评估体系成熟：

- **HELM**（Stanford 2022）——LLM 综合评估（准确性、安全性、偏见、效率）。
- **AlpacaEval**（Stanford 2023）——基于 GPT-4 自动评估。
- **MT-Bench**（LMSYS 2023）——多轮对话评估。
- **Chatbot Arena**（LMSYS 2023）——人类偏好排名（Elo 评分）。
- **AI-as-Judge**（2024）——LLM 评估 LLM。

**评估维度**：

- 准确性（事实性、推理能力）。
- 安全性（有害输出、偏见）。
- 有用性（任务完成度）。
- 流畅性（语言质量）。
- 鲁棒性（对抗样本）。
- 多语言能力。
- 长上下文能力。
- 多模态能力。

**方向 2：Agent 评估基准**

2023-2025 Agent 评估基准爆发：

- **WebArena**（CMU 2023）——Agent Web 任务（购物、订票、查询）。
- **SWE-bench**（Princeton 2024）——Agent 代码任务（GitHub Issue）。
- **AgentBench**（THU 2024）——Agent 综合评测（8 类任务）。
- **GAIA**（Meta 2024）——Agent 多步推理。
- **ToolBench**（2023）——Agent Tool 使用。
- **OSWorld**（2024）——Agent 操作系统任务。
- **AndroidWorld**（2024）——Agent Android 任务。

**方向 3：因果推断与 LLM 评估**

- LLM 评估中的"评估偏差"用因果推断修正。
- AI-as-Judge 的"位置偏差"（先答 vs 后答）。
- LLM 评估的"自我偏好"（GPT-4 评估 GPT-4 输出更宽容）。

**方向 4：实时评估与监控**

- 在线 A/B 测试 + LLM 评估 + 因果推断实时化。
- 持续评估（Continuous Evaluation）——CI/CD 中自动评估。
- 漂移检测 + 自动重训。

**方向 5：评估即服务（Evaluation as a Service）**

- LLM 评估 API（OpenAI / Anthropic / 阿里）。
- 因果推断 API。
- Agent 评估平台。

**方向 6：多模态评估**

- 图像生成（CLIP Score / FID）。
- 视频生成（VBench）。
- 多模态 LLM（MMMU / MMBench）。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**RAG 评估**：

- **检索质量**：Recall / Precision / NDCG。
- **生成质量**：AI-as-Judge + Human Eval。
- **端到端**：RAGAS / TruLens 框架。

**工具**：

- **RAGAS**（开源）——RAG 评估框架。
- **TruLens**（开源）——RAG / LLM 评估。
- **LangSmith**（LangChain）——LLM 应用评估。
- **Phoenix**（Arize）——LLM 可观测性。

**GraphRAG 评估**：

- 检索准确率、推理准确率。
- 多跳推理评估。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **HELM**（Stanford 2022）——LLM 综合评估。
- **AlpacaEval 2.0**（Stanford 2024）——改进版 LLM 评估。
- **MT-Bench / Arena**（LMSYS 2024）——LLM 排名。
- **WebArena**（CMU 2023）——Agent Web 评估。
- **SWE-bench**（Princeton 2024）——Agent 代码评估。
- **AgentBench**（THU 2024）——Agent 综合评测。
- **RAGAS**（2024）——RAG 评估。
- **Process Reward Model**（2024）——推理步骤评估。

**工业进展**：

- **OpenAI Evals**（2024）——LLM 评估框架。
- **Anthropic Evals**（2024）——Claude 评估。
- **Google Vertex AI Evaluation**（2024）——LLM 评估服务。
- **阿里云 PAI Eval**（2024）——国产 LLM 评估。
- **字节豆包 Eval**（2024）——LLM 评估。
- **腾讯混元 Eval**（2024）——LLM 评估。
- **百度 EvalScope**（2024）——国产 LLM 评估。
- **Weights & Biases Prompts**（2024）——Prompt 评估。
- **LangSmith**（LangChain 2024）——LLM 应用评估。
- **Phoenix**（Arize 2024）——LLM 可观测性。
- **TruLens**（2024）——LLM / RAG 评估。
- **RAGAS**（2024）——RAG 评估。

**企业落地案例**：

- **字节跳动**：用 ABT A/B 平台 + 因果推断 + LLM 评估，模型上线效率 +3 倍。
- **阿里巴巴**：用 POE + AI-as-Judge，LLM 评估效率 +5 倍。
- **美团**：用 A/B 平台 + Cuped，实验效率 +50%。
- **OpenAI**：用 Arena + Evals，LLM 排名领先。
- **Anthropic**：用 Evals + Constitutional AI，Claude 安全对齐。

### 5.4 未来 3-5 年趋势

1. **「LLM 评估标准化」**：HELM / AlpacaEval / Arena 成为事实标准。
2. **「Agent 评估基准成熟」**：WebArena / SWE-bench / AgentBench 成为 Agent 评估事实标准。
3. **「AI-as-Judge 普及」**：用 LLM 评估 LLM 成为主流，但需校准。
4. **「因果推断工业化」**：DML / Causal Forest 成为商业决策标配。
5. **「评估即服务」**：评估 API + 评估 SaaS 化。
6. **「持续评估」**：CI/CD + 自动评估 + 自动重训。
7. **「多模态评估」**：图像 / 视频 / 多模态 LLM 评估标准化。
8. **「公平性评估」**：算法公平性、可解释性成为强制。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：某头部电商的 A/B 测试平台**

- 背景：日均 1000+ 实验，多团队并行。
- 方案：流量分层 + 哈希分桶 + SRM 检测 + 多重比较校正 + CUPED。
- 工具：自研 ABT 平台 + 阿里 POE 借鉴。
- 结果：实验效率 +50%，SRM 问题下降 80%。

**案例 2：某短视频平台的 Interleaving**

- 背景：搜索 / 推荐排序 A/B 测试太慢。
- 方案：Interleaving + A/B 双层验证。
- 工具：Team Draft Interleaving + 自研 A/B 平台。
- 结果：实验周期 -70%，灵敏度 +5 倍。

**案例 3：某 LLM 公司的 LLM 评估平台**

- 背景：训练多个 LLM 版本，需要快速评估。
- 方案：HELM + AlpacaEval + Arena + AI-as-Judge + Human Eval。
- 工具：自研 Eval 平台 + LMSYS Arena。
- 结果：评估周期 -60%，LLM 选择效率 +3 倍。

**案例 4：某 Agent 公司的 Agent 评估**

- 背景：训练 Agent 在 Web / 代码任务上表现。
- 方案：WebArena + SWE-bench + 自研任务集。
- 工具：WebArena + SWE-bench + LangSmith。
- 结果：Agent 任务成功率 +20%，评估覆盖率 +3 倍。

**案例 5：某银行的市场营销因果推断**

- 背景：营销活动效果评估。
- 方案：Causal Forest + DML + PSM。
- 工具：DoWhy + EconML + CausalML。
- 结果：营销 ROI 评估准确度 +25%。

### 6.2 踩坑与经验

**坑 1：SRM 隐藏错误**

- 现象：流量分配 50:50，实际 47:53，结论不可信。
- 解法：每天 Chi-square 检测 SRM，偏离超阈值立即报警。

**坑 2：多重比较假阳性**

- 现象：测 10 个指标，至少 1 个 p<0.05，结论错误。
- 解法：Bonferroni / FDR 校正。

**坑 3：新奇效应**

- 现象：上线第 1 周效果好，长期下降。
- 解法：Holdout 长期监控 30-90 天。

**坑 4：LLM-as-Judge 偏差**

- 现象：GPT-4 评估 GPT-4 输出更宽容。
- 解法：用 Human Eval 校准 + 一致性检测。

**坑 5：Agent 评估只看结果**

- 现象：Agent 最终任务失败，但不知道哪一步错。
- 解法：过程评估（每步决策 + Tool 使用）。

**坑 6：相关 = 因果**

- 现象：投放多时销量好，因果方向反过来。
- 解法：用 RCT / IV / DML 做因果。

**坑 7：流量不够硬上 A/B**

- 现象：流量只有 1000，硬上 A/B，统计功效不够。
- 解法：先计算最小样本量，不够就用 Interleaving / CUPED。

**坑 8：LLM 评估无 Golden Set**

- 现象：LLM 输出无标准答案，随机评估。
- 解法：建立 Golden Set + 持续更新。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（单点验证，1-3 个月）**：

1. 选 1 个 ML 模型建立离线评估。
2. 建立 A/B 测试 pipeline。
3. 用 CUPED 缩减方差。
4. 部署上线 + 监控。

**1→10（部门级，3-9 个月）**：

1. 扩展到 10+ 模型评估。
2. 引入 Interleaving + 因果推断。
3. 流量分层 + 多团队协作。
4. Holdout 长期监控。

**10→100（企业级，9-24 个月）**：

1. 评估平台化（A/B + 因果 + LLM + Agent）。
2. 持续评估（CI/CD）。
3. 评估即服务（API / SaaS）。
4. 多模态评估（图 / 文 / 视频）。
5. 公平性 / 可解释性 / 合规评估。

### 6.4 ROI 评估

**直接收益**：

- 模型上线决策准确率提升（避免翻车）。
- 业务价值证明（说服业务方）。
- 实验效率提升（节省时间成本）。

**间接收益**：

- ML 闭环成熟（评估 → 决策 → 反馈）。
- 合规与可解释性。
- AI 时代新能力（LLM / Agent 评估）。

**评估指标**：

- **业务指标**：CTR / GMV / 时长 / 满意度。
- **技术指标**：实验周期 / 灵敏度 / SRM 通过率 / 因果准确度。
- **闭环指标**：评估覆盖率 / 持续评估完成率。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 离线评估 | A/B 测试 | Interleaving | Bandit | 因果推断 | LLM 评估 |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| 速度 | 5 | 2 | 4 | 5 | 3 | 3 |
| 真实性 | 2 | 5 | 5 | 5 | 4 | 3 |
| 因果性 | 1 | 5 | 3 | 4 | 5 | 1 |
| 工程成本 | 2 | 4 | 3 | 4 | 5 | 3 |
| 业务对齐 | 3 | 5 | 4 | 4 | 5 | 3 |
| 长期评估 | 1 | 5 | 2 | 5 | 4 | 2 |
| AI 时代适配 | 2 | 3 | 3 | 4 | 4 | 5 |

**结论**：

- **标准上线**：离线 + A/B + 业务指标。
- **快速迭代**：Interleaving + CUPED。
- **实时个性化**：Bandit。
- **不能随机化**：因果推断。
- **LLM 评估**：HELM / AlpacaEval / Arena。
- **Agent 评估**：WebArena / SWE-bench。

### 7.2 决策树

```
[评估任务]
   │
   ├── [评估什么？]
   │     ├── 传统 ML 模型 → A/B 测试 + 业务指标
   │     ├── LLM → HELM / AlpacaEval / Arena
   │     └── Agent → WebArena / SWE-bench
   │
   ├── [评估阶段？]
   │     ├── 预上线 → 离线评估 + Interleaving
   │     └── 全量上线 → A/B 测试 + 因果推断
   │
   ├── [流量大小？]
   │     ├── 大 → A/B 测试
   │     ├── 中 → Interleaving + CUPED
   │     └── 小 → Contextual Bandit
   │
   ├── [能否随机化？]
   │     ├── 能 → RCT / A/B 测试
   │     └── 不能 → 因果推断（PSM / DID / DML）
   │
   ├── [是否多指标？]
   │     ├── 是 → FDR / Bonferroni 校正
   │     └── 否 → 单指标 t 检验
   │
   └── [是否长期？]
         ├── 是 → Holdout + 长期监控
         └── 否 → 短周期实验
```

### 7.3 组合使用

**组合 1：离线 + A/B + 因果（标准 ML 上线）**

- 离线筛选候选。
- A/B 测试验证。
- 因果推断确认。

**组合 2：Interleaving + A/B（搜索 / 推荐）**

- Interleaving 快速筛选。
- A/B 测试确认。

**组合 3：CUPED + Bandit（小流量）**

- CUPED 缩减方差。
- Bandit 实时决策。

**组合 4：LLM-as-Judge + Human Eval（LLM 评估）**

- AI-as-Judge 快速评估。
- Human Eval 校准。

**组合 5：WebArena + SWE-bench（Agent 评估）**

- WebArena 测 Web 能力。
- SWE-bench 测代码能力。

**组合 6：DID + Causal Forest（政策 / 营销）**

- DID 评估平均效应。
- Causal Forest 评估异质性。

**组合 7：HELM + Arena（LLM 综合评估）**

- HELM 综合能力评估。
- Arena 人类偏好排名。

---

## 8. 面试真题集

> 本节由资深技术作者针对「效果评估与 A/B 实验」主题原创编写，按五段式作答：考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料。参考企业实践覆盖 Google / Netflix / LinkedIn / Meta（Experimentation Platform）/ Microsoft（ExP）/ Airbnb / Uber / Booking / Amazon / 阿里（ABTest / ABT）/ 字节（DataTester）/ 美团 / 京东 / 招行 / 平安 / 米哈游 / 网易雷火 / Shein 等。

### 8.1 全景视图

> 本节整合 6 道原创真题，覆盖效果评估六大高频考点：离线在线不对齐、A/B 工程设计、Interleaving、因果推断、LLM/Agent 评估、新奇效应与长期效果。

| 题号 | 主题 | 主/辅 |
| --- | --- | :---: |
| §7.1 | 离线评估与在线 A/B 的关系（offline-online correlation） | 主 |
| §7.2 | A/B 测试的工程设计（流量分层 / SRM / 样本量 / 多重比较） | 主 |
| §7.3 | Interleaving 与 A/B 的选型与组合 | 主 |
| §7.4 | 不能 A/B 时如何评估——因果推断（PSM / DID / DML） | 主 |
| §7.5 | LLM 与 Agent 评估的新范式（HELM / AlpacaEval / WebArena） | 主 |
| §7.6 | 新奇效应、Holdout 与长期效果（冷启动 / 留存评估） | 主 |

| 题号 | 难度 |
| --- | :---: |
| §7.1 | ★★★★☆ |
| §7.2 | ★★★★☆ |
| §7.3 | ★★★☆☆ |
| §7.4 | ★★★★☆ |
| §7.5 | ★★★★★ |
| §7.6 | ★★★★☆ |

---

### 8.2 分主题展开

#### §7.1 离线评估与在线 A/B 的关系——为什么 AUC 涨了 1%，业务却不动？

**1. 考察点**

- 是否理解离线评估（Offline Evaluation）与在线 A/B（Online A/B）评估是**两个不同的实验**——离线评估测的是「模型在历史数据上的预测质量」，在线 A/B 测的是「模型在真实用户行为中的因果影响」。两者之间只是**相关性，不是因果**。
- 能否说出**离线/在线不对齐的根因**：① 数据分布漂移（训练集 ≠ 未来流量）；② 反馈闭环（模型上线后改变用户行为，历史数据被污染）；③ 代理指标失真（Offline AUC 只衡量排序质量，不衡量用户满意度）；④ 指标定义错位（离线 LogLoss 下降 ≠ 在线 CTR 提升）。
- 是否知道**如何诊断不对齐**：Holdout 长期监控、离线-在线相关性分析（offline-online correlation）、分桶对比、PSI / KS 漂移检测。
- 是否能给出**工程上的对齐手段**：指标映射（LogLoss → NDCG → CTR）、加权采样（让离线分布贴近线上）、Counterfactual 评估（用日志回放做无偏估计）。
- 加分项：能区分「在线涨了但离线没涨」（可能是偶然波动 / 新奇效应）与「离线涨了但在线没涨」（可能是过拟合 / 代理指标失真）——这两个问题对应完全不同的处置策略。

**2. 参考答案框架**

**第一层：先定义两者的目标与真实差异。** 离线评估用历史日志 + 训练好的模型，给出 AUC / NDCG / LogLoss 等指标。它的优势是**快（小时 - 天级）、便宜、可复现**，但本质是「模型在历史快照上的预测能力」。在线 A/B 测试把模型部署到真实流量上，观察真实用户在真实场景中的行为变化。它**慢（天 - 周级）、贵（损失机会成本）、有方差**，但能直接回答「这个模型上线后业务能不能涨」。两者的目标函数不同：**离线优化的是「预测」，在线优化的是「行为」**。

**第二层：离线/在线不对齐的五大根因。**

1. **数据分布漂移**：训练集是 1 个月前的数据，但模型服务的是今天的流量。季节性（双 11 / 春节）、人群迁移（新用户涌入）、竞品变化（对手上新功能）都会让分布发生漂移。Netflix 在推荐系统上长期坚持「时间切片回测」——每次模型上线前用最近 7 天的真实流量回放，比用全量历史更接近真实场景。
2. **反馈闭环（Feedback Loop）**：模型上线后，**用户的下一步行为是被当前模型塑造的**。例如推荐系统上线后，用户点击的全是模型排序靠前的内容，下一次训练数据里就没有「用户没看到但可能更喜欢」的内容。这就是「曝光偏差（Exposure Bias）」。阿里在 2018 年开始用 IPS（Inverse Propensity Scoring）做无偏离线评估，本质就是用因果推断把曝光偏差从离线指标里剥离。
3. **代理指标失真**：离线 AUC 衡量的是「模型把正样本排在负样本前面的能力」，但业务关心的是「用户因为看到推荐而点击 / 购买」。AUC 涨 1% 可能是把「男 / 女」这种无关特征排得更准，但用户根本不在乎。Booking 在 OTA 场景里发现，AUC 与在线转化率的相关性只有 0.3 左右，必须用 NDCG + 多样性 + 新颖性组合才能逼近在线指标。
4. **新奇效应（Novelty Effect）**：新模型上线初期用户出于新鲜感行为变化，但 2-4 周后回归正常。这导致**离线 / 在线短期对齐但长期背离**。Google 在搜索排序上长期保留 1-2% 的 Holdout 流量，用 30-90 天的长窗口评估，避免被新奇效应误导。
5. **指标定义错位**：离线用 LogLoss（追求概率校准），在线看 CTR（追求排序质量）。这两个目标甚至可能是矛盾的——LogLoss 最低的模型不一定是 CTR 最高的。LinkedIn 在信息流推荐里同时维护「离线 LogLoss + 在线 CTR + 长期 7 日留存」三个目标函数，用 Pareto 多目标优化做权衡。

**第三层：诊断与对齐的工程手段。**

- **离线-在线相关性分析**：把同一批候选模型同时跑离线评估 + 小流量在线 A/B，画出离线指标 vs 在线指标的散点图，计算 Pearson / Spearman 相关系数。Meta 的 Experimentation 平台把这做成自动化报表「Online-Offline Correlation Dashboard」，任何离线指标上线前必须先验证与在线指标的相关性 > 0.7。
- **Holdout 长期监控**：留 5-10% 流量不参与任何实验，作为「基线对照组」，用 30-90 天的长窗口观察新模型在新奇效应消退后的真实效果。这是 Google / Microsoft / Amazon 通用做法。
- **分桶对比**：离线评估时按用户分群（新用户 / 老用户 / 高活 / 低活）分别评估，找到离线涨但在线不涨的人群。Airbnb 在搜索排序上发现，离线 NDCG 涨 1% 主要来自老用户，对新用户没帮助——于是把离线评估按「新用户 NDCG」加权。
- **PSI / KS 漂移检测**：上线后实时监控「线上样本特征分布 vs 训练集分布」的差异（PSI > 0.2 视为严重漂移），漂移严重的模型即使离线指标再好也要回炉。
- **Counterfactual 评估（反事实评估）**：用日志回放 + IPS / Doubly Robust 估计「如果换模型，原本没曝光的内容会发生什么」。这是 Netflix / YouTube / 字节在推荐系统上长期使用的方法，能在不做 A/B 的情况下给出接近在线的无偏估计。

**第四层：业务对齐的策略——指标金字塔。** 健康的效果评估体系应该有一个**指标金字塔**：

- **塔顶（北极星指标）**：唯一业务目标（如 GMV、留存、满意度）。
- **塔身（业务过程指标）**：CTR / CVR / 时长 / 复购等。
- **塔基（模型 / 离线指标）**：AUC / NDCG / LogLoss / 召回率。

模型只优化塔基指标，但塔基 → 塔身 → 塔顶必须有清晰的**因果链 + 量化映射**。微软 ExP 平台在每次实验里强制要求填写「假设的因果链」（Hypothesis），例如「模型 X 优化停留时间 → 停留时间提升 5% → 7 日留存提升 2%」，事后用实际数据验证假设成立——这是把「离线指标与业务对齐」做成可追溯流程的标准做法。

**3. 常见陷阱**

- **「AUC 高 = 模型好」**是评估领域第一反模式。AUC 衡量排序能力，不衡量业务价值。一个把「男生排在女生前面」的模型 AUC 可能很高，但用户满意度可能暴跌。
- **把离线/在线不对齐归结为「模型不够准」**。更深层的原因是指标定义错位、反馈闭环、代理指标失真。只调模型不改指标体系，永远对齐不了。
- **不做长期监控只看首周数据**。新奇效应会让首周数据失真，2-4 周后效果往往下降 30-50%。LinkedIn 在信息流改版时曾因为只看首周数据上线了新版本，结果 6 周后用户留存反而下降。
- **只做整体相关性分析不做分桶对比**。整体相关可能掩盖局部失真——Airbnb 的案例就是整体涨但新用户跌，必须分桶看。

**4. 追问预测**

- **「你刚提到 Holdout 流量留 5-10%，会不会影响业务？业务方同意吗？」** 答：Holdout 是行业最佳实践，5% 的损失换来的是「不被假象误导」的决策能力。Google 长期留 1% 做 Holdout，Netflix 留 5%，这是用业务指标波动换长期决策质量。要说服业务方的关键是「一次翻车的损失远大于 5% 长期损失」。
- **「反馈闭环怎么破？IPS 在工业上怎么落地？」** 答：IPS 的核心是「对曝光过的样本加权 1/p(曝光)，对没曝光的样本用模型预测」。工业落地难点是「曝光概率 p 怎么估」——通常用一个简单的 propensity model（LR / 浅层 GBT），定期重训。阿里 / 字节 / 快手在推荐系统上都有专门的 IPS 服务。
- **「Off-Policy Evaluation（OPE）在工业上可信吗？」** 答：OPE（Counterfactual 评估的一种）在工业上有 0.7-0.9 的可信度，能「避免明显翻车」但不能替代 A/B。Meta 内部的做法是「OPE + 1% 小流量 A/B」组合：OPE 筛选掉 80% 差模型，剩下 20% 进 A/B 验证，节省 80% 的实验流量。
- **「如果业务方要求『不上 A/B 直接全量』怎么办？」** 答：拒绝并解释风险。可以用历史数据 + 离线评估 + OPE 三件套做「无 A/B 评估」，但必须明确告知「这是相关不是因果，最终验证必须靠 A/B 或因果推断」。招行 / 平安在风控场景有专门的「无 A/B 评估」流程，但都附有「最终决策风险等级上」标注。

**5. 参考资料**

- Google 团队关于「Long-term A/B Testing」的公开分享——Holdout 与新奇效应在搜索 / 广告场景的处理范式。
- Netflix Technology Blog「Counterfactual Evaluation for Recommendation Systems」——OPE / IPS 在推荐系统的工业化实践，是反事实评估最权威的工业案例。
- Meta「Experimentation Platform」系列公开文章——Online-Offline Correlation Dashboard 的设计原理与因果链假设机制。
- Microsoft ExP（Experimentation Platform）公开文档——「Hypothesis 链」与指标金字塔的工程化实现。
- LinkedIn Engineering Blog 关于「7-Day Retention Metric」的文章——长期效果指标如何替代首周 CTR 成为决策依据。
- Airbnb Engineering Blog「Online-Offline Correlation in Search Ranking」——分桶对比如何发现新用户失真的真实案例。
- 阿里 OneService / ABT 平台公开技术分享——IPS 反事实评估在淘宝推荐的落地。
- 字节 DataTester 公开材料——反馈闭环与曝光偏差在抖音 / TikTok 推荐的处理。
- **美团 A/B 平台的长期效果评估机制** —— 美团在外卖推荐上要求所有实验至少跑 14 天，避免新奇效应误判，是国内生活服务行业长期效果评估的代表。
- **京东双 11 的离线-在线指标双轨制** —— 大促前用离线 + 小流量 A/B 双重验证，CTR / GMV / NDCG 三指标对照，是电商大促场景的指标金字塔实践。
- **招行信用卡风控模型的无 A/B 评估流程** —— 风控上线必须做反事实评估（IPS + 历史回放），明确标注决策风险等级，是金融场景无 A/B 评估的典型范式。
- **平安寿险的因果推断与 A/B 组合** —— 保险定价不能随意 A/B，用 PSM + DID 做历史先评估，小流量 A/B 做最终确认，是保险场景因果推断的标准组合。
- **Shein 的快速 ABTest + 长期 GMV 监控** —— 跨境时尚 SKU 迭代极快（每日数千 SKU），要求所有实验同时看首周 CTR 与 30 日 GMV 留存，是快时尚行业长短期指标结合的代表。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **京东零售** —— 京东零售双 11 实时特征极限压力——KV 热点、Flink 反压、Schema 演进的工程化解法。
- **唯品会** —— 唯品会特卖场景的数据平台——日清模式 + 离线数仓 + 实时推荐三层结构。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。

---

#### §7.2 A/B 测试的工程设计——流量分层、SRM、样本量、多重比较如何协同？

**1. 考察点**

- 是否理解 A/B 测试是一个**工程系统**，不是简单的「分两组跑一下」——它包含**流量分配（哈希分桶）、流量分层（Layer）、SRM 检测、样本量计算、多重比较校正、护栏指标、新奇效应处理**等子系统，每个子系统出问题都会让实验结论失真。
- 能否说清**哈希分桶与流量分层**的设计原理：为什么基于用户 ID 哈希能保证「同一用户始终在同一组」？为什么不同实验要在不同 Layer 互不干扰？
- 是否理解**SRM（Sample Ratio Mismatch）** 是 A/B 测试最常见也最隐蔽的工程事故——流量分配偏离预期会让所有统计推断失效。
- 能否正确推导**样本量公式**（基于 MDE / α / β）并说清实际工程中如何估算方差。
- 是否知道**多重比较校正**（Bonferroni / FDR / BH）在多指标实验中的必要性。
- 加分项：能给出 CUPED 方差缩减、CUPAC、Switchback 等高级技巧的具体适用场景。

**2. 参考答案框架**

**第一层：A/B 测试的工程系统组成。** 一个工业级 A/B 平台至少包含六大子系统：

1. **流量分配**：基于用户 / 设备 / 会话 ID 哈希分桶，保证「同一用户始终在同一组」（避免用户跨组造成的体验不一致与统计污染）。
2. **流量分层（Layered Experimentation）**：不同实验运行在不同 Layer（每层独立哈希），同一用户可以同时在不同层接受不同实验处理，互不干扰。
3. **SRM 检测**：每天检查实际流量分配比例是否与预期一致（Chi-square 检验 / 贝叶斯 SRM 检测），偏离超阈值立即报警。
4. **样本量计算**：基于 MDE（最小可检测效应）+ α（第一类错误）+ β（第二类错误）反推每组需要的样本量，进而估算实验周期。
5. **多重比较校正**：同时测多个指标时，用 Bonferroni / BH-FDR 校正避免假阳性。
6. **护栏指标 + 新奇效应处理**：监控核心 + 护栏指标（防止实验组破坏基础体验），Holdout 长期监控避免新奇效应误判。

**第二层：哈希分桶与流量分层。**

- **哈希分桶原理**：把用户 ID 经过哈希函数映射到 [0, 9999] 的桶空间，再按比例分配。例如对照组 = 0-4999，实验组 A = 5000-7499，实验组 B = 7500-9999。关键约束是**哈希函数稳定 + 用户 ID 不变**——只要这两个条件满足，同一用户永远在同组。
- **为什么必须哈希？**：基于时间 / 顺序分配会让「早上来的用户和晚上来的用户分到不同组」，引入选择偏差。哈希分桶是唯一能保证「随机性 + 稳定性」的方法。
- **流量分层**：Google 在 2016 年的 Overlapping Experiment 框架中提出「Layer」概念。每层独立哈希，层与层之间**正交**——例如「UI 层」「算法层」「推荐层」三层可以同时跑三个实验，同一用户在三层中分别独立分组。
- **层数限制**：层数越多，单层流量越分散，统计功效越低。Google 一般控制在 5-10 层，字节 ABT 平台控制 3-5 层，Meta 控制 5-8 层。

**第三层：SRM（Sample Ratio Mismatch）。**

- **什么是 SRM**：实验配置 50:50 分流，实际 47:53。表面看差距不大，但这是**严重事故**——它意味着分流逻辑有 bug，或用户被某种规则过滤掉，导致两组人群本就不等价。
- **常见原因**：① 哈希函数选错（哈希碰撞不均）；② 实验组加载失败，部分用户被剔除；③ 实验配置变更后未同步；④ 客户端缓存导致部分用户实际未进入实验。
- **检测方法**：每天对实际分流比例做 Chi-square 检验，p-value < 0.001 视为严重 SRM。Booking 内部还有一套贝叶斯 SRM 检测，能在 SRM 早期（24 小时内）发现异常。
- **处置**：发现 SRM 立即停止实验，定位 bug，重新配置后从头开始。不要在 SRM 实验上做统计修正——结论不可信。

**第四层：样本量计算。** 公式（连续指标）：

$$n = \frac{(z_{\alpha/2} + z_\beta)^2 \cdot 2\sigma^2}{\delta^2}$$

其中 δ 是 MDE（绝对差异），σ 是指标方差。比例类指标（CTR）用对应的 z 检验公式。

- **MDE 的选择**：太小 → 需要海量样本；太大 → 只能检测大变化，错过小改进。MinMDE 通常是「业务可感知的最小变化」，例如 CTR 0.1% 绝对提升、GMV 1% 相对提升。
- **基线方差的估算**：用历史数据估算，不能拍脑袋。Uber 在实验平台上提供「Sample Size Calculator」工具，输入基线均值 / 方差 / MDE 直接给出样本量。
- **实验周期估算**：样本量 ÷ 日均进入实验的用户数 = 最小实验天数。要覆盖 1-2 个完整业务周期（周 / 月），避免周末效应 / 季节效应。

**第五层：多重比较校正。**

- **Bonferroni 校正**：α' = α / k（k 是指标数），最保守，适用于指标间独立。
- **BH-FDR（Benjamini-Hochberg）**：控制假发现率，按 p-value 排序后逐步判断，是更精细的校正方法。
- **为什么必须做**：同时测 10 个指标，即使所有指标真的没差异，至少 1 个 p < 0.05 的概率是 1 - (1-0.05)^10 ≈ 40%——结论完全不可信。Meta 内部默认对所有指标做 FDR 校正。

**第六层：CUPED 方差缩减与 Switchback 设计。**

- **CUPED（Controlled-experiment Using Pre-Existing Data）**：用用户预期间指标做协变量，缩减后验方差。Microsoft 在 2013 年提出，能把方差缩减 30-50%，相当于把样本量需求降低一半。
- **Switchback 设计**：当用户级随机化不可行（如社交网络效应）时，改用时间段随机化——例如每天切换一次实验组 / 对照组。Uber 在司机端算法实验大量使用 Switchback，因为司机 / 乘客有强网络效应。
- **CUPAC**（CUPED for multiple Arm Comparison）：CUPED 扩展到 A/B/n 场景，处理多组比较时的协变量共享问题。

**3. 常见陷阱**

- **把 A/B 测试当「分两组跑一下」**。这是工程师最常见的误解。真正的 A/B 测试是工程系统，每个子系统都可能翻车。
- **只看实验周期不看样本量**。3 天跑完 ≠ 3 天能下结论。如果样本量不够，3 天跑出的「显著差异」完全是噪声。
- **忽视 SRM**。SRM 是 A/B 测试最隐蔽的事故——结论看上去正常，但实际是错的。Booking / Uber 内部都有专门的 SRM 监控 dashboard。
- **多重比较不管**。同时测 10 个指标，至少 1 个假阳性，必须做 Bonferroni / FDR。
- **实验配置变更中途调整流量比例**。这会破坏 SRM 与样本量假设，所有推论失效。Google 严格要求「实验配置变更 = 实验重开」。

**4. 追问预测**

- **「流量分层时，同一层内多个实验能同时跑吗？会互相污染吗？」** 答：层内不能同时跑多个实验（同一用户同一时间只能接受一个实验处理），但同一用户在不同层可以同时接受不同实验。字节 ABT 平台 / 阿里 POE 都有层内互斥机制。
- **「CUPED 的协变量怎么选？选错了会怎样？」** 答：协变量必须与目标指标强相关（Pearson > 0.5）且不随实验变化（pre-period）。选错了反而放大方差。Microsoft 内部用历史 30 天的同指标均值作为协变量，效果最好。
- **「Switchback 怎么决定切换频率？」** 答：切换频率 = 业务最小可观察周期 / 2。例如网约车 1 天一个完整周期，Switchback 用 12 小时切换；外卖用 6 小时切换。Uber 的工程经验是「切换频率 × 2 < 业务周期」是底线。
- **「如果实验需要测 100 个指标，多重比较怎么做？」** 答：用 BH-FDR 控制假发现率，或先做主指标（OEC）确认主结论，再对其他指标做探索性分析（不做强校正）。Meta / Google 都用「主 OEC + 护栏指标 + 探索指标」三层结构。

**5. 参考资料**

- Google「Overlapping Experiment Infrastructure」论文（2016）——流量分层（Layer）的原始设计与工程实现，是分层实验的必读文献。
- Microsoft「Controlled Experiments Using Pre-Existing Data」（CUPED, 2013）——方差缩减的工业论文，A/B 测试提速的标志性方法。
- Kohavi / Deng / Frasca / Walker 等「Online Controlled Experiments at Large Scale」（ACM SIGKDD 2013 & 2019 系列）——A/B 测试工程实践的圣经级论文。
- Booking.com Experimentation 平台公开分享——贝叶斯 SRM 检测与多层实验的真实案例。
- Meta Experimentation Platform 公开文档——多重比较与主 OEC 设计的标准做法。
- Uber Engineering「Switchback Experiments」系列——出行行业 Switchback 设计的工程经验。
- 阿里 ABT / DataTester 公开技术分享——国内电商 A/B 平台的 SRM 与多重比较实践。
- 字节 ABT 平台公开材料——层内互斥 + 流量分层在短视频场景的落地。
- **美团 A/B 平台的 CUPED 落地** —— 美团在外卖推荐上用 CUPED 把实验效率提升 50%，是国内 CUPED 落地的代表案例。
- **京东双 11 的 A/B 流量分层与隔离** —— 大促期间多团队并行实验，用流量分层做隔离，P0/P1/P2 分级，是电商大促 A/B 平台的标准做法。
- **网易雷火游戏的 A/B 与 Switchback** —— 游戏内有强社交效应（玩家匹配），Switchback 是常用方案，对应 Switchback 设计在游戏行业的落地。
- **米哈游原神的 A/B 长期效果监控** —— 游戏版本更新效果要 7-30 天才能稳定，要求所有实验跑 ≥14 天避免新奇效应。
- **招行 ZHI 信用卡营销的 A/B + 多重比较** —— 同时测 5 个营销文案 + 3 个优惠力度，用 FDR 校正，避免假阳性。
- **Shein 的快速 A/B 平台** —— 跨境时尚 SKU 极快迭代，要求实验周期 ≤ 7 天，靠 CUPED + 流量分层实现。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **京东零售** —— 京东零售双 11 实时特征极限压力——KV 热点、Flink 反压、Schema 演进的工程化解法。
- **唯品会** —— 唯品会特卖场景的数据平台——日清模式 + 离线数仓 + 实时推荐三层结构。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。

---

#### §7.3 Interleaving 与 A/B 的选型与组合——为什么搜索排序先用 Interleaving，A/B 兜底？

**1. 考察点**

- 是否理解**Interleaving 与 A/B 的本质区别**：A/B 是「两个模型各自服务一群用户，互不干扰」，Interleaving 是「把两个模型的候选混合展示给同一群用户，观察用户偏好」。前者速度慢但能测因果，后者速度快但只测偏好。
- 能否说清 Interleaving 的**适用边界**——为什么只适合排序（搜索 / 推荐），不适合其他场景。
- 是否知道三种主流 Interleaving 方法：**Balanced Interleaving、Team Draft Interleaving、Probabilistic Interleaving** 的原理与差异。
- 能否说清**Interleaving 与 A/B 的组合**：Interleaving 快速筛选 → A/B 因果验证的两阶段范式。
- 加分项：能区分**Position Bias**（位置偏差）与**Presentation Bias**（展示偏差），并说清 Interleaving 如何消除前者但不能消除后者。

**2. 参考答案框架**

**第一层：Interleaving 是什么、为什么出现。** A/B 测试的核心痛点是**慢**——搜索排序场景下，A/B 测试要数周才能判断两个排序模型的优劣。Interleaving 把两个模型的候选**混合展示**给同一群用户，从用户的点击行为直接推断偏好，速度比 A/B 快 10-100 倍。

典型 Interleaving 流程：

1. 模型 A 生成候选列表 [a1, a2, a3, ...]。
2. 模型 B 生成候选列表 [b1, b2, b3, ...]。
3. 按某种规则（如 Team Draft）把两者混合展示给用户。
4. 统计用户点击归属（哪个模型的候选被点击更多）。
5. 偏好比 = 模型 A 点击数 / 模型 B 点击数。

**第二层：三种 Interleaving 方法。**

1. **Balanced Interleaving**：按比例交替抽取两个模型的候选。例如 5 个位置，奇数位取 A、偶数位取 B。优点是简单，缺点是位置偏差严重——用户更倾向点击靠前的位置，B 永远只能拿偶数位。
2. **Team Draft Interleaving**：让两个模型「选球员」——模型 A 选第一个位置时确定某个候选，模型 B 选第二个位置时确定另一个候选，依此类推。这是目前工业主流（Microsoft / Yahoo / Google 用），优点是位置均衡，缺点是可能出现「同一候选被两个模型同时选中」的冲突。
3. **Probabilistic Interleaving**：按概率混合——位置 i 来自 A 的概率是 σ(β · rel_i)，rel 是相关性分数。优点是数学优雅，缺点是工程实现复杂、对相关性分数敏感。

**第三层：Interleaving 的适用边界。** Interleaving **只适合排序场景**（搜索 / 推荐 / 广告），不适合其他场景：

- 不适合**分类 / 回归**：用户没有「多选一」的交互，只有单一预测结果。
- 不适合**生成式任务**（LLM）：输出是长文本，没法混合。
- 不适合**决策场景**（风控定价）：决策有外部效应（用户不能同时看到两个定价）。
- 不适合**带延迟反馈的场景**（游戏）：用户行为反馈链路长，Interleaving 优势消失。

**第四层：Position Bias vs Presentation Bias。**

- **Position Bias（位置偏差）**：用户倾向点击靠前的位置，不管内容如何。
- **Presentation Bias（展示偏差）**：用户倾向点击被展示更多的内容。
- Interleaving 通过**让两个模型的位置均衡**，能消除 Position Bias；但若两个模型的候选有重叠（都展示同一内容），Presentation Bias 仍然存在——这会导致 Interleaving 的结论失真。

**第五层：Interleaving + A/B 的两阶段范式。**

1. **Interleaving 阶段（快速筛选）**：用 Interleaving 在 1-3 天内快速比较多个候选模型，淘汰明显差的，留下 2-3 个。
2. **A/B 阶段（因果验证）**：用 Interleaving 选出的 Top 2-3 模型做正式 A/B 测试，跑 7-14 天，下最终结论。

这是 Google / Yahoo / Microsoft 在搜索排序上的标准做法。Netflix / YouTube / Spotify 在推荐系统上也沿用这个范式，但 Interleaving 的混合策略改为「按相关性分数加权混合」，适配推荐排序的特殊性。

**第六层：工程上的注意事项。**

- **公平性约束**：Interleaving 必须保证两个模型的展示量严格相等（Team Draft Interleaving 能保证，Balanced 不能）。
- **去重处理**：如果两个模型的 Top 候选有 80% 重叠，Interleaving 退化成「让用户选择相同的 80%」——必须先做候选去重再混合。
- **新奇效应屏蔽**：Interleaving 不适合长期效果评估，2-3 天即可，长期评估必须用 A/B 或 Holdout。
- **不能测因果**：Interleaving 只测「用户偏好」，不测「业务因果」（比如 GMV / 留存）。A/B 才能测因果。

**3. 常见陷阱**

- **把 Interleaving 当 A/B 替代品**。Interleaving 只测偏好，不能替代因果 A/B。任何对业务有重大影响的决策，最终必须 A/B 验证。
- **用 Balanced Interleaving**。位置偏差会让实验结论失真，Team Draft Interleaving 才是工业主流。
- **不处理候选重叠**。两个模型 Top 10 重叠 80% 时，Interleaving 几乎失效——必须先做去重。
- **用 Interleaving 测长期效果**。Interleaving 速度快但只适合短期偏好，长期效果必须 A/B + Holdout。

**4. 追问预测**

- **「Interleaving 怎么选方法？」** 答：默认 Team Draft Interleaving；如果团队对数学敏感且有相关性分数，可以用 Probabilistic；不要用 Balanced。
- **「LLM 输出能用 Interleaving 吗？」** 答：不能。LLM 输出是长文本，不能像列表一样混合。LLM 评估必须用 LLM-as-Judge / Arena。
- **「Interleaving 与 Bandit 的区别？」** 答：Interleaving 是「在同一用户上做偏好比较」，Bandit 是「在多用户上做探索-利用权衡」。两者解决不同问题。
- **「如果两个模型的 Top 候选完全相同，怎么比较？」** 答：Interleaving 失效。必须用 A/B 测试更敏感的指标（CTR / CVR），或加大候选列表深度（看 Top 100 vs Top 1000）。

**5. 参考资料**

- Microsoft「Team Draft Interleaving」（Yahoo 2009 + Microsoft 2012 系列论文）——Interleaving 的原始设计与实验对比，是搜索排序实验的经典文献。
- Google「Interleaving for Search Ranking」公开分享——Interleaving + A/B 的两阶段范式在 Google Search 的实践。
- Netflix「Sleeve Interleaving」公开文章——推荐排序场景下 Interleaving 的变种设计。
- Booking.com「Interleaving Experiments」公开分享——OTA 场景下 Interleaving 的特殊处理（候选重叠 + 公平性）。
- Spotify Research「Interleaving in Music Recommendation」——音乐推荐 Interleaving 的工程化经验。
- 字节跳动 ABT 平台「Interleaving 加速」内部实践——抖音 / TikTok 排序实验用 Interleaving 把实验周期从 7 天压缩到 1 天。
- **阿里巴巴搜索的 Interleaving + A/B** —— 淘宝搜索排序用 Interleaving 筛选候选，A/B 验证最终效果，是国内电商搜索的标准范式。
- **美团搜索的 Interleaving** —— 美团在外卖 / 到店搜索排序上用 Interleaving 提升实验效率。
- **京东搜索的 Interleaving + 长期监控** —— 京东商品搜索排序用 Interleaving 快速迭代，Holdout 长期监控避免新奇效应。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **丁香园** —— 丁香园的医学知识图谱——药品、疾病、症状、指南的多跳查询与推理。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。

---

#### §7.4 不能 A/B 时如何评估——因果推断（PSM / DID / DML）的工业落地

**1. 考察点**

- 是否理解**为什么需要因果推断**——不是所有业务场景都能 A/B。A/B 测试的前提是「可随机化 + 可控流量」，但很多场景这两个条件都不满足：① 风控定价不能随意 A/B（合规风险）；② 政策类评估（监管 / 政策调整）不能 A/B；③ 营销归因涉及多触点，难做随机化；④ 隐私敏感场景（医疗 / 金融）不能简单 A/B。
- 能否说清**因果推断 vs 相关分析 vs A/B 测试**的三者关系：A/B 是因果推断的金标准，因果推断是 A/B 的扩展，相关分析只是表象。
- 是否理解**PSM（倾向得分匹配）、DID（双重差分）、IV（工具变量）、Synthetic Control（合成控制）、DML（Double Machine Learning）、Causal Forest** 等主流因果方法的差异。
- 能否针对具体业务场景选对方法：营销归因 → PSM；政策评估 → DID；隐私敏感 → DML；异质性分析 → Causal Forest。
- 加分项：能给出因果推断在工业上的**真实陷阱**——平行趋势假设、工具变量合法性、PSM 的共同支撑问题，以及如何诊断违反假设。

**2. 参考答案框架**

**第一层：因果推断的基本框架——反事实问题。** 因果推断的核心是回答反事实问题：「如果这个用户当时没接受处理，会发生什么？」用数学表达就是 ATE = E[Y(1) - Y(0)]——处理下的真实结果与反事实结果的差。

- **Y(1)**：处理下的真实结果（可观测）。
- **Y(0)**：未处理的真实结果（不可观测，只能估计）。

因果推断的所有方法都在解决「如何估计 Y(0)」。

**第二层：为什么需要因果推断而非 A/B？** A/B 测试是因果推断的金标准，但工业上很多场景 A/B 不可行：

1. **合规与伦理风险**：风控模型不能让 50% 用户用旧规则、50% 用户用新规则——欺诈用户可能趁机作案。保险定价不能让一半用户享受新价格——合规上构成价格歧视。
2. **政策类评估**：监管政策（限贷、限购）调整只能用「政策前后对比」，不能 A/B。
3. **多触点营销归因**：用户从看到广告到下单可能经历 10+ 个触点，无法对每个触点单独 A/B。
4. **样本量不足**：长尾场景（如某些疾病 / 罕见用户行为）样本量不足，A/B 永远跑不出显著。
5. **业务变化太快**：业务策略每周都在变，A/B 跟不上节奏。

**第三层：六大因果推断方法。**

1. **PSM（Propensity Score Matching）**：
   - **原理**：估计每个样本「被处理的概率」（倾向得分），按倾向得分匹配处理 / 对照样本。匹配后的两组人群「除了处理不同，其他都相似」，差异可归因于处理。
   - **适用**：营销活动效果评估、单次政策评估。
   - **陷阱**：共同支撑（Common Support）问题——若处理组 / 对照组倾向得分分布不重叠，匹配无效。必须先做倾向得分分布图。
2. **DID（Difference-in-Differences，双重差分）**：
   - **原理**：用「处理组前后变化 - 对照组前后变化」去除共同趋势。核心假设是**平行趋势（Parallel Trend）**——若没有处理，处理组和对照组的变化趋势相同。
   - **适用**：政策评估、地区差异分析、有明确处理前后时点的场景。
   - **陷阱**：平行趋势假设难以验证，可用「处理前多个时点的趋势图」做敏感性分析。
3. **IV（Instrumental Variable，工具变量）**：
   - **原理**：找一个「只影响处理、不直接影响结果」的变量 Z（工具变量），用 Z 解释处理的「外生变化」来估计因果效应。
   - **适用**：处理变量有内生性（受未观测因素影响）的场景。
   - **陷阱**：工具变量的合法性很难证明——必须给出「Z 与误差项不相关」的理论依据。
4. **Synthetic Control（合成控制）**：
   - **原理**：用多个对照单元的加权组合构造「反事实的对照组」，适用于单受处理单元（如某个城市、某个国家）。
   - **适用**：单城试点 / 单个国家政策的评估。
   - **陷阱**：合成权重必须稳健，可用「留一法」做敏感性分析。
5. **DML（Double Machine Learning，2018 Chernozhukov）**：
   - **原理**：用两个 ML 模型分别预测 Y（结果）和 T（处理），把残差交叉回归——核心是「用 ML 处理高维控制变量，但不引入正则化偏差」。
   - **适用**：高维控制变量、复杂非线性场景。
   - **陷阱**：模型过拟合会放大偏差，必须用交叉拟合（Cross-Fitting）。
6. **Causal Forest / DR-Learner（异质处理效应）**：
   - **原理**：估计「不同人群的处理效应差异」（CATE / ITE），用因果森林 / DR-Learner 做异质性分析。
   - **适用**：营销个性化定价、风控差异化策略。
   - **陷阱**：样本量需求大，异质性估计稳定性差，必须做置信区间。

**第四层：因果推断在工业上的真实落地路径。**

1. **定义反事实问题**：明确「处理是什么」「结果是什么」「控制变量是什么」。
2. **选择方法**：根据「可不可随机化」「处理是单时点还是多时点」「是否有工具变量」选方法。
3. **数据准备**：构建处理 / 对照 / 控制变量数据集，做分布检查（处理组 / 对照组在处理前是否相似）。
4. **模型估计**：跑因果模型，做敏感性分析（违反假设时结论会变多少）。
5. **业务解释**：把因果效应翻译成业务语言（GMV 提升 X%、ROI 提升 Y%）。
6. **小流量 A/B 验证**：在合规允许的范围内做小流量 A/B 验证因果推断结论。

**第五层：工业案例。**

- **LinkedIn 营销归因**：用 PSM + Shapley Value Attribution 评估多个营销触点的贡献度，避免「最后点击归因」造成的误判。
- **Uber 司机补贴效果评估**：用 DID 评估补贴政策调整对司机接单率的影响，处理「政策前后 + 不同城市」的差异。
- **Booking 价格弹性估计**：用 DML 估计不同用户对酒店价格的敏感度，做个性化定价。
- **招行信用卡营销效果**：用 PSM + DID 组合评估「满减券 vs 折扣券」的真实 ROI。
- **美团外卖配送费定价**：用 Causal Forest 估计不同区域 / 不同用户的配送费弹性，做差异化定价。
- **Shein 跨境物流时效**：用 Synthetic Control 评估「某条新物流线路」上线对整体时效的影响。
- **网易雷火游戏付费设计**：用 PSM 评估「首充礼包」对长期付费的因果效应，避免「短期刺激但长期伤害 LTV」的设计。
- **米哈游原神抽卡机制**：用 Causal Forest 分析不同玩家群体对抽卡概率的敏感度，做差异化概率展示。

**3. 常见陷阱**

- **「相关 = 因果」**是因果推断最常见的反模式。营销活动期间销量好，可能是因为活动期间本来就有大促，必须用 DID 去掉共同趋势。
- **平行趋势假设不验证**。DID 的核心假设是平行趋势，若处理组和对照组在处理前趋势就不一致，结论无效。必须用处理前多个时点的趋势图做检验。
- **共同支撑不够**。PSM 要求处理 / 对照的倾向得分分布重叠，若处理组某个得分区间没有对照样本，匹配失败，必须剔除或重新设计。
- **DML 不做交叉拟合**。DML 必须用样本分割 / 交叉拟合避免过拟合，否则会放大偏差。
- **忽视业务含义**。因果效应大小不能脱离业务——「GMV 提升 0.01%」可能是统计显著，但业务无感。

**4. 追问预测**

- **「DID 怎么验证平行趋势？」** 答：用处理前多个时点画处理组 vs 对照组的趋势图，看是否平行；进一步用「处理前 1 期做 placebo test」——假装在那提前 1 个时点处理，看是否有显著效应，没有则平行趋势假设成立。
- **「PSM 与回归调整的区别？」** 答：PSM 是「匹配相似样本后做差」，回归调整是「直接回归控制变量」。前者稳健但损失样本，后者高效但依赖函数形式。Microsoft / Uber 在工业上偏好回归调整 + DML 组合。
- **「DML 在工业上难落地吗？」** 答：技术上不难（EconML / DoWhy 库都有现成实现），难的是「控制变量的完备性」——若遗漏关键变量，DML 偏差会放大。
- **「Causal Forest 给出的 CATE 怎么用？」** 答：直接用于个性化决策。例如 Causal Forest 发现「25-35 岁女性对满减券响应最强」，就把满减券定向给这群人。CATE 是因果推断的「商业落地接口」。

**5. 参考资料**

- Guido Imbens / Donald Rubin《Causal Inference for Statistics, Social, and Biomedical Sciences》——因果推断的圣经级教材。
- Victor Chernozhukov 等「Double Machine Learning for Treatment Effect Estimation」（2018）——DML 的原始论文，工业 DML 落地的标准参考。
- Susan Athey / Stefan Wager「Generalized Random Forests」（2018）——Causal Forest 的原始论文，异质处理效应的工业基础。
- Microsoft EconML 官方文档——DML / Causal Forest / DR-Learner 的工业实现。
- Uber CausalML 库公开文档——Uplift 建模在出行行业的落地。
- LinkedIn Engineering Blog「Marketing Attribution」——PSM + Shapley 在营销归因的实践。
- 阿里数据技术团队关于 OneData 的公开材料——营销因果推断在国内电商的应用。
- **招行信用卡营销的因果评估** —— 招行用 PSM + DID 评估各种营销活动的真实 ROI，是国内金融营销因果推断的典型案例。
- **平安寿险定价的因果推断** —— 平安用 Causal Forest 做差异化定价，避免定价歧视的合规风险，是保险行业因果推断的代表。
- **美团外卖配送费定价的 Causal Forest** —— 美团用 Causal Forest 估计不同区域的配送费弹性，做差异化定价。
- **Shein 跨境物流的 Synthetic Control** —— Shein 用合成控制法评估新物流线路对整体时效的影响。
- **网易雷火游戏的 PSM 评估** —— 网易雷火用 PSM 评估付费设计对长期 LTV 的因果效应，避免短期刺激长期伤害的设计。
- **米哈游原神的 Causal Forest** —— 米哈游用 Causal Forest 分析不同玩家对抽卡概率的敏感度。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。

---

#### §7.5 LLM 与 Agent 评估的新范式——HELM / AlpacaEval / AI-as-Judge / WebArena / SWE-bench

**1. 考察点**

- 是否理解**LLM 评估与传统 ML 评估的本质差异**：传统 ML 有标准答案（分类 / 回归），LLM 输出是开放文本，**没有标准答案**——评估标准从「准确性」转向「有用性 / 安全性 / 流畅性 / 多样性」等多维度。
- 能否说清**主流 LLM 评估基准**：HELM（Stanford 2022，综合能力）、AlpacaEval（Stanford 2023，GPT-4 自动评估）、MT-Bench（LMSYS 2023，多轮对话）、Chatbot Arena（LMSYS 2023，人类偏好排名）、OpenAI Evals（2023，开源框架）、lm-evaluation-harness（EleutherAI）。
- 是否理解**AI-as-Judge**（用 LLM 评估 LLM）的**优势与陷阱**：优势是快（小时级）、便宜、可规模化；陷阱是**位置偏差、自我偏好偏差、长度偏差**。
- 能否说清**Agent 评估**与传统 LLM 评估的区别——Agent 评估看**多步决策结果 + 过程决策 + 工具使用效率**，不只看最终输出。
- 是否知道**主流 Agent 评估基准**：WebArena（CMU 2023，Web 任务）、SWE-bench（Princeton 2024，代码任务）、AgentBench（THU 2024，综合）、GAIA（Meta 2024，多步推理）、ToolBench（工具使用）。
- 加分项：能区分**Process Reward Model（PRM，过程奖励模型）**与**Outcome Reward Model（ORM，结果奖励模型）**——前者评估推理步骤，后者只评估最终答案。

**2. 参考答案框架**

**第一层：LLM 评估的特殊性。** 传统 ML 评估的核心问题是「模型预测 vs 标准答案的距离」——有明确目标函数（LogLoss / RMSE）。LLM 评估的核心问题是「生成文本的质量」——**没有标准答案**，只有「相对偏好」。这导致 LLM 评估必须采用新范式：

- **基于相似度**：BLEU / ROUGE / BERTScore（与参考答案的文本相似度）。
- **基于偏好**：人类偏好对比（A/B 投票）、Elo 排名。
- **基于 LLM**：AI-as-Judge（用 GPT-4 等强模型评估弱模型输出）。
- **基于任务**：特定任务的客观指标（数学 Pass@k、代码 Pass@k）。

**第二层：六大主流 LLM 评估基准。**

1. **HELM（Holistic Evaluation of Language Models, Stanford 2022）**：
   - **特点**：综合能力评估，覆盖准确性、安全性、偏见、效率、鲁棒性等 7 大类 30+ 指标。
   - **适用**：模型综合能力对比、模型选型。
   - **陷阱**：指标多但每个模型表现可能不同维度——必须看综合分数，不能只看单项。

2. **AlpacaEval（Stanford 2023）**：
   - **特点**：基于 GPT-4 自动评估的胜率（Win Rate），覆盖指令遵循任务。
   - **适用**：快速对比聊天模型的指令遵循能力。
   - **陷阱**：GPT-4 评估 GPT-4 自己的输出会有**自我偏好偏差**——用 GPT-4 评估 GPT-4 的胜率比评估 Claude 更宽容。

4. **MT-Bench / Chatbot Arena（LMSYS 2023）**：
   - **MT-Bench**：80 个多轮对话任务，GPT-4 评估两个模型的对话质量。
   - **Chatbot Arena**：人类用户投票两个模型，A/B 投票 + Elo 排名。是当前 LLM 排名最权威的人类偏好基准。
   - **陷阱**：Arena 的投票人群偏技术开发者，与普通用户偏好有偏差。

5. **OpenAI Evals（2023，开源）**：
   - **特点**：开源 LLM 评估框架，支持多种任务的标准化评估。
   - **适用**：自定义 LLM 评估、企业内部模型评估。

6. **lm-evaluation-harness（EleutherAI）**：
   - **特点**：最广泛使用的开源 LLM 评估框架，覆盖 200+ 任务。
   - **适用**：学术与开源 LLM 的标准评估。

7. **AI-as-Judge（2024 普及）**：
   - **原理**：用 GPT-4 / Claude 等强模型评估弱模型输出。
   - **陷阱**：三大偏差——**位置偏差**（先评估的得分高）、**自我偏好偏差**（同源模型得分高）、**长度偏差**（更长的输出得分高）。
   - **校准方法**：用 Human Eval 校准 LLM Judge，计算 Judge-Human 一致性（Spearman 相关系数）。Microsoft 在 Phi-3 论文里详细讨论了 LLM Judge 校准流程。

**第三层：Agent 评估的特殊性。** Agent 评估不是「最终输出对不对」，而是「多步决策 + 工具使用 + 长期目标」的综合评估：

- **最终任务完成率**（Success Rate）。
- **过程决策质量**（每步决策是否合理）。
- **工具使用效率**（完成任务用了几步、调用了几个工具）。
- **安全性**（是否做了破坏性操作）。
- **可复现性**（同样任务不同次运行的稳定性）。

**第四层：五大主流 Agent 评估基准。**

1. **WebArena（CMU 2023）**：
   - **特点**：基于真实 Web 环境的 Agent 评估（购物、订票、查询、社交等）。
   - **指标**：任务成功率、平均交互步数。
   - **适用**：通用 Agent 在 Web 场景的能力评估。

2. **SWE-bench（Princeton 2024）**：
   - **特点**：基于真实 GitHub Issue 的代码 Agent 评估——Agent 必须读懂 Issue + 修改代码 + 通过测试。
   - **指标**：Issue 解决率（Pass Rate）。
   - **适用**：代码 Agent（Cursor / Devin / Copilot）的核心评估。

3. **AgentBench（THU 2024）**：
   - **特点**：综合 Agent 评测，覆盖 8 类任务（Web、DB、Knowledge Graph、Operating System、Digital Game 等）。
   - **适用**：通用 Agent 综合能力对比。

4. **GAIA（Meta 2024）**：
   - **特点**：多步推理 Agent 评估，需要调用多个工具、阅读多个文档、推理多步才能得出答案。
   - **适用**：复杂推理 Agent。

5. **ToolBench（2023）**：
   - **特点**：Agent 工具使用能力评估——能否正确选择工具、组合工具、调用工具。
   - **适用**：Tool-augmented Agent。

**第五层：工业落地的关键流程。**

1. **建立 Golden Set**：准备高质量评估数据集（人工标注 / 已知答案），覆盖核心能力维度。
2. **多维度评估**：准确性、安全性、流畅性、有用性、鲁棒性、长上下文、多语言、多模态。
3. **AI-as-Judge + Human Eval 双轨**：AI-as-Judge 快速筛选，Human Eval 校准。
4. **持续评估（CI/CD）**：把 LLM 评估嵌入 CI/CD，每次模型变更自动跑评估。
5. **漂移检测**：监控线上 LLM 输出分布变化，发现退化立即报警。
6. **过程评估 vs 结果评估**：Agent 必须做过程评估，每步决策可追溯。

**3. 常见陷阱**

- **只看 HELM 总分**。HELM 7 类 30+ 指标，单一总分掩盖细节。必须看分维度。
- **用 AlpacaEval 评估自家模型时用 GPT-4 当 Judge**。GPT-4 评估 GPT-4 系模型有自我偏好偏差，胜率虚高。正确做法是用 Claude / Gemini 当 Judge。
- **AI-as-Judge 不做 Human Eval 校准**。LLM Judge 不校准直接用，结论不可信。必须用 Human Eval 校准，计算 Judge-Human 一致性。
- **Agent 评估只看最终任务成功率**。Agent 多步决策失败可能是中间某步错，必须做过程评估。
- **LLM 评估无 Golden Set**。LLM 输出没有标准答案，随机评估。必须建立 Golden Set + 持续更新。
- **把 LLM-as-Judge 直接用于线上决策**。LLM Judge 适合「筛选候选」，不适合「最终决策」——最终决策必须 Human Eval 或 A/B。

**4. 追问预测**

- **「LLM-as-Judge 的偏差怎么校准？」** 答：三大偏差对应三种校准方法——位置偏差用「随机交换评估顺序」；自我偏好偏差用「不同源 Judge」；长度偏差用「标准化长度后评估」。最终用 Human Eval 计算 Judge-Human 的 Spearman 相关系数。
- **「SWE-bench 在工业上可信吗？」** 答：SWE-bench 是 GitHub 真实 Issue，覆盖真实代码场景，是目前代码 Agent 最权威的评估。但工业内部模型评估必须加企业内部代码库 + 业务场景的私有 benchmark。
- **「Agent 评估为什么不能只看最终结果？」** 答：因为 Agent 失败的原因多种多样——选错工具、参数错误、推理偏差、执行顺序错。只看最终结果无法定位问题，必须做过程评估（每步决策 + 工具调用可追溯）。
- **「LLM 评估与传统 ML 评估如何结合？」** 答：LLM 应用往往是「LLM + 传统 ML」组合——例如推荐系统的「LLM 生成解释 + 传统 ML 做排序」。评估时必须分别评估两者，再加上端到端的联合评估。

**5. 参考资料**

- Stanford HELM 官方论文（2022）——LLM 综合评估的奠基性工作。
- Stanford AlpacaEval 官方仓库与论文（2023）——GPT-4 自动评估的标准化框架。
- LMSYS Chatbot Arena 官方论文与排行榜（2023-2024）——人类偏好排名的事实标准。
- Microsoft Phi-3 技术报告——LLM-as-Judge 校准流程的详细讨论。
- Princeton SWE-bench 官方论文（2024）——Agent 代码任务评估的事实标准。
- CMU WebArena 官方论文（2023）——Agent Web 任务评估的奠基性工作。
- THU AgentBench 官方论文（2024）——综合 Agent 评测的标准。
- Meta GAIA 官方论文（2024）——Agent 多步推理评估。
- OpenAI / Anthropic / Google 的内部 Eval 公开材料——头部 LLM 公司的内部评估流程。
- 阿里云 PAI Eval / 字节豆包 Eval / 百度 EvalScope 公开文档——国产 LLM 评估框架。
- **OpenAI 的 Evals 框架与 Arena 实践** —— OpenAI 用 Evals + Arena 评估 GPT 系列，是头部 LLM 公司评估的标准。
- **Anthropic 的 Constitutional AI 评估** —— Anthropic 用 Constitutional AI 做 Claude 的安全评估，是 LLM 安全对齐的代表性方法。
- **字节豆包模型的综合评估** —— 字节用 HELM + Arena + 自研任务评估豆包模型，是国内 LLM 评估的代表。
- **阿里通义千问的评估体系** —— 阿里用 PAI Eval + Arena + 内部任务评估通义系列。
- **Shein 的 LLM 客服评估** —— Shein 用 LLM 客服 + AI-as-Judge 监控服务质量。
- **丁香园** —— 丁香园的医学知识图谱——药品、疾病、症状、指南的多跳查询与推理。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。

---

#### §7.6 新奇效应、Holdout 与长期效果——为什么「上线即衰退」是评估的第二灾难？

**1. 考察点**

- 是否理解**新奇效应（Novelty Effect）**：新模型上线初期用户出于新鲜感行为变化，但 2-4 周后回归正常。这导致**短期 A/B 显著、长期效果下降**，是评估领域仅次于「离线高大上、上线垮掉」的第二大灾难。
- 能否说清**学习效应（Learning Effect）** 与新奇效应的区别——新奇效应是「用户对变化本身的兴趣」，学习效应是「用户逐渐适应新系统后效率提升」。前者短期有、长期无；后者长期持续。
- 是否理解**Holdout 流量**的设计原理——为什么必须留 5-10% 流量不做任何实验，用 30-90 天长窗口评估？为什么 Holdout 是「避免新奇效应误判」的标准解法？
- 能否区分**冷启动评估**与一般评估的差异——冷启动样本量少、用户行为不稳定，必须用特殊方法（Bandit / 探索奖励 / 单独流量层）。
- 能否说清**长期效果指标**的设计——为什么 GMV / 留存比首周 CTR 更可信？LinkedIn 的「7 日留存」、Amazon 的「30 日复购」、Booking 的「30 日再订率」是怎么来的？
- 加分项：能给出**漂移检测（Drift Detection）** 与**持续评估（Continuous Evaluation）** 在工业上的具体实践。

**2. 参考答案框架**

**第一层：新奇效应与学习效应——长期评估的物理学。**

- **新奇效应（Novelty Effect）**：用户对「变化本身」产生兴趣，新模型上线初期效果好，但用户习惯后效果回归正常。典型表现——首页改版首周 +10% CTR，2 周后回到 +1%。
- **学习效应（Learning Effect）**：用户逐渐适应新系统，效率随时间提升。典型表现——搜索引擎改版首周 -5% CTR（用户找不到入口），4 周后 +8% CTR（用户已熟练）。
- **两者的混淆**会让评估完全错误。新奇效应需要「Holdout 长期监控」抵消；学习效应需要「保留学习时间窗口再评估」。两者方向相反但都是「短期 ≠ 长期」。

**第二层：Holdout 流量的工程设计。**

- **核心思想**：留 5-10% 流量不做任何实验，作为「基线对照组」。所有实验组 vs Holdout 对比，而不是 vs 同期的另一实验组。
- **为什么必须**：同期实验组 vs 实验组的对比会被「季节变化 / 节日效应」污染；Holdout vs 实验组才能反映「纯处理效应」。
- **保留期**：30-90 天。Google 长期留 1% Holdout 流量，保留期 90 天；Microsoft 留 5%，保留期 30 天；Booking 留 5%，保留期 60 天。
- **代价**：5% 流量不参与实验 = 5% 的潜在业务损失。但一次翻车的损失远大于 5% 长期损失——Netflix / Amazon / Google 都把 Holdout 视为「决策质量保险」。
- **工程实现**：Holdout 流量通过独立的 Layer 哈希分桶，与所有实验正交，不受任何实验影响。

**第三层：冷启动评估的特殊性。**

冷启动（用户 / 内容 / 商品是新的）场景的评估面临三大难题：

1. **样本量不足**：新用户 / 新内容样本量极小，传统 A/B 需要数月才能跑出显著。
2. **用户行为不稳定**：新用户行为正在演化，短期内行为与长期行为可能完全相反。
3. **反馈闭环**：新用户 / 新内容的反馈数据本身就被当前模型塑造，未来行为依赖「探索」。

冷启动评估的工程方案：

- **Bandit（多臂老虎机）**：用 ε-greedy / UCB / Thompson Sampling 实时探索-利用，弥补样本量不足。Spotify / Netflix 在新内容冷启动大量使用 Bandit。
- **探索奖励（Exploration Bonus）**：在推荐排序时给「未被充分曝光的新内容」额外加分，主动收集反馈。
- **单独流量层**：把冷启动流量单独成层，避免与常规流量实验互相干扰。Booking / 美团 Booking 对新酒店都有单独冷启动流量层。
- **代理指标 + 长期验证**：短期用「CTR / 点击率」做代理，长期用「30 日 LTV / 30 日留存」做验证。
- **CUPED 强化**：冷启动用户没有历史协变量，用「相似用户群」的历史均值做协变量，强行应用 CUPED。

**第四层：长期效果指标体系。**

| 业务 | 短期指标 | 长期指标 | 设计逻辑 |
| --- | --- | --- | --- |
| 短视频 | 首条 CTR、7 日留存 | 30 日留存、年度活跃 | 短视频要快速抓眼球，但靠留存变现 |
| 电商 | 当日 GMV、CTR | 30 日复购、年度 GMV | 短期 GMV 受促销影响，长期 GMV 看粘性 |
| 内容平台 | 当日 DAU、时长 | 月度活跃、年度留存 | 内容粘性要月度才能稳定 |
| SaaS | 当日登录、试用转化 | 30 日付费转化、年度续费 | SaaS 价值在长期订阅 |
| 游戏 | 首日在线、首充转化 | 30 日留存、终身 LTV | 游戏价值在 LTV，必须看长期 |

LinkedIn 在信息流改版时发现首周 +5% CTR 但 6 周后 -3% 留存——立刻下线，避免了灾难。Netflix 用「30 日留存」作为推荐系统的核心指标，而不是首日点击。Amazon 用「30 日复购」衡量商品推荐效果。Booking 用「30 日再订率」衡量酒店推荐。

**第五层：漂移检测与持续评估。**

- **数据漂移（Data Drift）**：线上数据分布 vs 训练集分布的差异。PSI > 0.2 视为严重漂移。
- **概念漂移（Concept Drift）**：输入-输出关系变化（例如疫情期间的购买行为变化）。模型准确率下降。
- **性能漂移（Performance Drift）**：模型上线后效果逐渐下降（数据 / 概念漂移的累积）。
- **持续评估（Continuous Evaluation）**：把评估嵌入 CI/CD，每次数据 / 模型变更自动评估；漂移检测 + 自动重训触发。Uber / Netflix / 阿里在工业上都有完整的持续评估 pipeline。

**3. 常见陷阱**

- **「首周数据显著就上线」**。新奇效应让首周数据失真，2-4 周后效果可能下降 30-50%。LinkedIn 信息流改版首周 +5% CTR 但 6 周后 -3% 留存的真实案例。
- **不留 Holdout 流量**。所有流量都在做实验，没有对照组。一旦出现「上线即衰退」，无法回溯基线。
- **冷启动用常规 A/B**。冷启动样本量小、用户行为不稳定，常规 A/B 永远跑不出显著。必须用 Bandit / 探索奖励 / 单独流量层。
- **只看短期指标不看长期**。CTR / GMV 是短期真相，30 日留存 / 30 日复购才是长期真相。健康体系必须同时看短期 + 长期。
- **漂移检测不自动化**。手动监控漂移永远滞后，必须自动化——模型上线后实时监控，漂移超阈值自动报警 / 自动重训。

**4. 追问预测**

- **「Holdout 流量损失怎么平衡？」** 答：5% 是行业惯例，业务与决策需要协商。关键是「一次翻车损失远大于 5% 长期损失」——把 Holdout 当「决策保险」。
- **「冷启动 Bandit 怎么避免「探索伤害体验」？」** 答：探索比例要小（ε = 5-10%），且探索内容要「质量不低于基线」——只探索「可能更好」的内容，不探索「明显差」的内容。Spotify 在新歌推荐上用 Thompson Sampling，自动收敛到「好歌多曝光、差歌少曝光」。
- **「30 天长期评估跟不上业务节奏怎么办？」** 答：双轨制——核心指标（CTR / GMV）7 天快速迭代，长期指标（30 日留存）做小流量验证 + 后置决策。同时用 CUPED + Interleaving 加快短期评估。
- **「持续评估的工程成本？」** 答：每次模型变更自动跑评估 + 漂移检测 + 自动报警。Netflix / Uber / 阿里都有完整 pipeline。成本主要是评估 pipeline 的维护，每年 0.5-1 个工程师即可。

**5. 参考资料**

- Google 关于「Long-term A/B Testing」与「Holdout」的公开分享——长期 A/B 测试的事实标准。
- LinkedIn Engineering Blog「Why Long-Term Metrics Matter」——7 日留存指标的起源。
- Netflix Technology Blog「Long-term Recommendation Evaluation」——30 日留存作为推荐核心指标的实践。
- Amazon「Customer Retention Metrics」公开材料——30 日复购作为长期效果指标的实践。
- Booking.com Experimentation 公开分享——30 日再订率作为酒店推荐的长期指标。
- Spotify Research「Bandit Algorithms for Cold Start」——音乐冷启动的 Bandit 应用。
- Uber Engineering「Drift Detection in ML Systems」——漂移检测的工业实践。
- Netflix Technology Blog「Continuous Evaluation」——持续评估 pipeline 的工程化。
- 阿里 ABT 平台「长期效果评估」内部实践——电商场景长期效果的指标体系。
- 字节 DataTester「Holdout + 长期监控」内部实践——短视频场景的新奇效应处理。
- **美团外卖的冷启动 Bandit** —— 美团对新商家用 Thompson Sampling 做冷启动推荐，是国内生活服务冷启动的代表。
- **京东新商品的冷启动探索** —— 京东用探索奖励 + Bandit 让新商品获得合理曝光，是电商冷启动的代表。
- **米哈游原神的 7 日 / 30 日留存评估** —— 米哈游要求所有版本更新至少评估 30 日留存，避免新奇效应误判。
- **网易雷火游戏的 LTV 长期评估** —— 网易雷火用 30 日 / 90 日 LTV 评估付费设计，避免短期刺激长期伤害。
- **Shein 的 30 日 GMV 长期监控** —— Shein 要求所有商品实验同时看首周 CTR 与 30 日 GMV，是快时尚长短期结合的代表。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。

---

### 8.3 本章小结

> 本面试真题集收录 6 道原创题，覆盖「效果评估与 A/B 实验」六大高频考点：离线在线不对齐、A/B 工程设计、Interleaving、因果推断、LLM/Agent 评估、新奇效应与长期效果。六道题构成一条完整的下钻链路——**离线与在线（指标对齐）→ A/B 工程（统计正确）→ Interleaving（加速）→ 因果推断（无 A/B）→ LLM/Agent（新范式）→ 长期效果（时间维度）**。
>
> 答题心法：**评估不是单点指标，是体系；评估不是一次实验，是长期流程；评估不是技术问题，是业务问题。** 面试官真正想听的是「你为什么这么选 + 选错了怎么救 + 工业上谁这么做过」，而不是「有哪几种方法」。

### 8.4 推荐学习路径

1. 先看「§8.1 全景视图」了解题目分布
2. 按「§8.2 分主题展开」逐题作答，每题按 5 段式（考察点 → 框架 → 陷阱 → 追问 → 参考）
3. 最后用「§8.3 本章小结」回顾横切主题（指标体系、工程系统、新范式、时间维度）

### 8.5 返回

- 返回 [02-data-science 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
