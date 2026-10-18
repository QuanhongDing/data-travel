# 效果评估与 A/B 实验（Evaluation & A/B Testing）

> **一句话定位**：离线指标 + 在线 A/B + 因果推断——衡量模型价值的唯一标尺，是 ML 工程化闭环的最后一公里。

> 本文是 data-travel 项目 [Ch2 · 数据科学与算法](../../README.md) 的子章节（**07 效果评估与 A/B 实验**）。覆盖 R2 数据科学算法领域中"模型评估、效果衡量、A/B 实验、因果推断"相关的核心原理、设计模式、工程实现与 AI 时代演进。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 离线评估指标（AUC / NDCG / MAE）怎么选？业务怎么对齐？ | §2.1 / §2.2 / §3.2 |
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
- 2000s：**方差缩减**、**多重比较校正**（Bonferroni / FDR）。

**ML 评估普及（2006–2018）**：

- 2006：Netflix Prize 让 RMSE 成为推荐系统标准指标。
- 2008：**Interleaving** 方法（Yahoo / Microsoft）解决 A/B 测试慢问题。
- 2010：**Google Overlapping Experiment** 框架支持多变量实验。
- 2012：Kaggle 推动 GBDT 评估指标标准化（LogLoss / AUC）。

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
- 2023–2024：**GAIA / ToolBench**——Agent 多步推理评估。

**一句话总结**：**评估从"统计检验"到"ML 评估"到"因果推断"到"LLM 评估"再到"Agent 评估"五阶段演进，今天的 AI 时代是"LLM 评估 + Agent 评估 + 因果推断"的混合范式。**

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

> 💡 **思考锚点**：把你们最依赖的那条评估结论按 §2.4 的「离线 vs 在线 A/B」分类——若在线，你是用 §2.3 的 CUPED（2013，Microsoft）做方差缩减，还是裸跑 t 检验（没缩方差，拿同样显著性就得把样本量抬高）？若离线，你的裁判是 BLEU / ROUGE 这类传统文本相似度，还是像 Chatbot Arena（2023，LMSYS）那样带人类偏好排名的？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](07-eval-section-3-sec3.md)
- [§4. 工程实现](07-eval-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](07-eval-section-5-ai.md)
- [§6. 落地实践](07-eval-section-6-sec6.md)
- [§7. 与其他方法对比](07-eval-section-7-sec7.md)
- [§8. 面试真题集](07-eval-section-8-sec8.md)

---
