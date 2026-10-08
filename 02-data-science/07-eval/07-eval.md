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

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 2 个原 PDF 子章节、共 12 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §17.7 | 数据架构与AI/ML集成 | 17.7.1 ~ 17.7.7（共 7） | 7 | 辅 |
| §18.2 | MLOps核⼼概念与流程 | 18.2.1, 18.2.2, 18.2.3, 18.2.4, 18.2.5 | 5 | 主 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §17 构建新⼀代统⼀的数据架构 > 本主题涵盖 1 个子节、7 道题。

#### 2.1.7 数据架构与AI/ML集成

> 来源：原 PDF §17.7，收录 7 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §17.7.1 | ★★★☆☆ |
| §17.7.2 | ★★★☆☆ |
| §17.7.3 | ★★★☆☆ |
| §17.7.4 | ★★★☆☆ |
| §17.7.5 | ★★★★☆ |
| §17.7.6 | ★★★★☆ |
| §17.7.7 | ★★★★★ |

- **§17.7.1**：请分析在数据湖仓⼀体架构中，将AI/ML的元数据（如实验记录、模型版本、特征
- **§17.7.2**：为了⽀持实时机器学习场景，数据架构需要处理⾼吞吐、低延迟的特征数据流。
- **§17.7.3**：请⽐较在批流⼀体架构下，⽀持模型训练与模型推理（特别是实时推理）的数据
- **§17.7.4**：随着⼤语⾔模型等⽣成式AI技术的兴起，数据架构需要如何演进以⽀撑这类模型
- **§17.7.5**：在⼤规模数据平台上，如何设计⼀个兼顾效率与安全的机制，以管理AI/ML模型训
- **§17.7.6**：请阐述在数据湖仓⼀体架构中，数据和模型的⽣命周期管理通常包含哪些关键阶
- **§17.7.7**：在设计⽀持AI/ML⼯作流的数据架构时，除了考虑数据存储和计算性能，还需要关

### 2.2 §18 ⼤数据平台如何赋能MLOps与特征⼯程 > 本主题涵盖 1 个子节、5 道题。

#### 2.2.2 MLOps核⼼概念与流程

> 来源：原 PDF §18.2，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §18.2.1 | ★★★☆☆ |
| §18.2.2 | ★★★☆☆ |
| §18.2.3 | ★★★☆☆ |
| §18.2.4 | ★★★☆☆ |
| §18.2.5 | ★★★★☆ |

- **§18.2.1**：请描述⼀个典型的MLOps流程，并说明⼤数据平台在其中的哪些环节起到关键⽀
- **§18.2.2**：请阐述在⼤数据平台上构建模型训练流⽔线时，如何实现数据版本、特征版本和
- **§18.2.3**：在⼤规模机器学习场景下，如何利⽤⼤数据平台（如Spark）进⾏⾼效的分布式特
- **§18.2.4**：在万节点集群环境中，部署和监控数百个机器学习模型服务时会⾯临哪些挑战？
- **§18.2.5**：请解释MLOps的基本概念，并说明它在⼤数据平台中的作⽤。

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **AI/ML 集成与治理**
- **实时与流处理架构**
- **架构演进与未来趋势**

## 4 本章小结

> 本面试真题集收录 12 道题，覆盖 2 个原 PDF 主题、2 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [02-data-science 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
