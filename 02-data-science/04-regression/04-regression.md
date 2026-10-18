# 回归算法（Regression）

> **一句话定位**：从线性回归到深度学习与因果回归——把"预测一个连续值"问题抽象为可量化的映射模型，是销量预测、评分预估、时空建模的基石。

> 本文是 data-travel 项目 [Ch2 · 数据科学与算法](../../README.md) 的子章节（**04 回归算法**）。覆盖 R2 数据科学算法领域中"回归（Regression）"相关的核心原理、设计模式、工程实现与 AI 时代演进。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 回归任务的数学本质是什么？损失函数为什么选 MSE / MAE / Huber？ | §2.2 |
| 线性回归 / GBDT / 深度学习 / 时序模型怎么选？ | §3.2 决策表 |
| 过拟合怎么办？正则化怎么选？ | §3.3 反模式 / §4.2 |
| 销量预测 / 时序建模 / 评分预估怎么做？ | §4 工程 / §6 案例 |
| 因果推断和回归有什么关系？ | §5.1 / §5.3 |
| 分位数回归、贝叶斯回归、自回归有什么特殊场景？ | §2.3 / §5 前沿 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：回归（Regression）是监督学习的另一核心任务——给定输入 $x \in \mathcal{X}$ 与连续标签 $y \in \mathbb{R}$，学习映射 $f: \mathcal{X} \rightarrow \mathbb{R}$，使得对未见样本的预测误差最小。

**工程定义**：在数据架构师手里，回归是**把"预测一个数值"问题抽象为可量化模型**的工具。它告诉你：明天销量会是多少？这位客户 LTV 多少分？这支股票未来收益？这件商品合理定价是多少？——所有"预测连续值"的问题，本质上都是回归。

**解决的业务问题**：

| 业务域 | 典型回归问题 | 输出 |
| --- | --- | --- |
| 电商 / 零售 | 销量预测、需求预测、GMV 预估 | 未来 7/30/90 天销量 |
| 推荐 | 评分预估（CVR 数值化）、CTR 数值化 | 用户-物品偏好度 |
| 金融 | 股价预测、信用评分、风险敞口 | 数值 / 概率 |
| 物流 | 时效预估、配送时长、运费 | 分钟 / 元 |
| 内容 | 完播率预估、互动率预测 | 概率 / 比例 |
| 时序 | 异常检测分、流量预测 | 数值 |
| 因果 | CATE / ATE 估计、异质处理效应 | 数值 |
| 运营 | 用户 LTV、流失概率 | 数值 |
| 自动驾驶 | 路径规划、轨迹预测 | 坐标 / 速度 |

**回归 vs 分类（Classification）**：

| 维度 | 回归 | 分类 |
| --- | --- | --- |
| 输出 | $\mathbb{R}$（连续值） | 离散类别 |
| 损失 | MSE / MAE / Huber | Cross-Entropy / Hinge |
| 评估 | MAE / RMSE / R² / MAPE | Accuracy / AUC / F1 |
| 业务含义 | 预测"多少" | 判断"是 / 否 / 哪一类" |
| 模型共享 | LR / GBDT 同时支持回归与分类 | — |

**回归 vs 时序预测**：

- 回归是**通用的输入-输出映射**，不限时序。
- 时序预测是回归的**特例**，强调时间依赖（ARIMA / Prophet / Transformer for TS）。

### 1.2 为什么需要

**业务驱动力**：

- **几乎所有量化决策都需要"预测一个数"**。库存多少合适？价格定多少？给客户授信多少额度？——本质都是回归。
- **商业智能（BI）的核心是预测**。从"过去发生了什么"（描述性）到"为什么会发生"（诊断性）到"未来会发生什么"（预测性），回归是预测性 BI 的核心。
- **因果推断的基础设施**。CATE / ATE 估计、Uplift 建模都基于回归技术。
- **LLM 时代，回归作为辅助**。LLM 主要做生成与分类，回归仍是"结构化数值预测"的主力（如销量、评分、时长）。

**痛点**：

1. **过拟合**：模型过拟合训练数据，测试集效果差。**需要正则化 + 交叉验证**。
2. **特征工程**：回归效果高度依赖特征工程。**特征交叉 / 多项式 / 时序特征**。
3. **数据稀疏**：长尾样本少，模型学到噪声。**需要降采样 / 加权 / 数据增强**。
4. **分布漂移**：训练数据分布与预测时分布不同。**需要在线学习 / 分布鲁棒回归**。
5. **非平稳性**：时序数据均值方差随时间变化。**需要差分 / 平稳化 / 时序模型**。
6. **非线性**：线性回归无法捕捉复杂关系。**需要 GBDT / 深度学习**。
7. **评估与业务对齐**：MAE / RMSE 优化目标与业务目标不一致。**需要业务自定义损失**。
8. **外推能力差**：模型在训练数据范围外预测完全失效。**需要约束回归 / 物理信息回归**。

### 1.3 在 AI 时代数据架构中的位置

**与上下游模块的关系**：

```
[历史数据 / 时序数据]
   ↓
[特征工程] ─→ 数值 / 时序 / 类别特征
   ↓
[回归模型训练] ─→ 数值预测
   ↓
[业务决策]
   ├── 销量 → 库存 / 采购
   ├── 价格 → 定价 / 促销
   ├── 评分 → 排序 / 推荐
   ├── 时长 → 调度 / 资源
   └── 风险 → 风控 / 授信
```

**在数据架构中的角色**：

- **BI / 数据产品**：回归是预测性 BI 的核心算子。
- **决策引擎**：回归输出是定价、调度、库存等决策的输入。
- **因果推断**：回归是 CATE / Uplift 的基础。
- **AI Agent**：Agent 的 reward 函数估计本质是回归。

**与 LLM 的边界**：

- **LLM 擅长**：自然语言量化评分、生成回归标签、长文本数值提取。
- **专用回归模型擅长**：高频低延迟、高精度、大数据量、严格可解释的场景。
- **最佳实践**：LLM 用于"难以结构化"的预测（用户情感打分），专用回归用于"高频结构化"预测（销量、时长）。

**一句话判断**：**会分类是 P7，会回归是 P7+，会用因果回归是 P8——回归是"从预测到决策"的桥梁，是数据架构师商业智能能力的核心。**

### 1.4 演进历程

**传统回归阶段（1800s–2000s）**：

- 1805：Legendre / Gauss 提出**最小二乘法**（OLS）——回归分析起点。
- 1898：Pearson 提出**相关系数**。
- 1922：Fisher 提出**最大似然估计**。
- 1970：Hoerl & Kennard 提出**Ridge 回归**（L2 正则）。
- 1996：Tibshirani 提出**Lasso 回归**（L1 正则 + 特征选择）。

**集成学习阶段（2000s–2015）**：

- 2001：Breiman 提出**Random Forest**。
- 2001：Friedman 提出**Gradient Boosting Machine**（GBM）。
- 2014-2018：XGBoost / LightGBM / CatBoost 让 GBDT 成为回归 SOTA。

**深度学习阶段（2016+）**：

- 2017：Uber 推出 **DeepETA**（ETA 预估的深度学习）。
- 2018：**DeepAR**（Amazon）——时序预测的 RNN 自回归。
- 2020：**N-BEATS** / **N-HiTS**（Element AI）——时序预测的深度学习基础模型。
- 2021：**Informer**——长序列时序 Transformer。
- 2022：**PatchTST**（ICLR 2023）——时序 Transformer 的 Patch 化。
- 2023：**TimesNet** / **iTransformer**——时序基础模型。

**因果与前沿阶段（2018+）**：

- 2018：**Causal Forest**（Wager & Athey）——异质处理效应估计。
- 2019：**Meta-Learners**（T-Learner / S-Learner / X-Learner）——Uplift 建模。
- 2020：**Dragonnet**（Shi et al.）——因果推断的深度学习。
- 2024：**CATE Foundation Models**——基础模型驱动的因果回归。
- 2025：**LLM + 回归融合**——LLM 作为特征生成器 + GBDT 作为回归器。

**一句话总结**：**回归从"最小二乘"到"正则化"到"集成学习"到"深度学习"到"因果推断"五阶段演进，今天的 AI 时代是"深度学习 + GBDT + 因果回归 + LLM 辅助"的混合架构。**

---

## 2. 核心原理

### 2.1 关键概念定义

- **因变量（Target / y）**：要预测的连续变量。
- **自变量（Feature / x）**：用于预测的输入特征。
- **残差（Residual）**：$y - \hat{y}$，模型预测与真实值的差。
- **拟合（Fitting）**：训练模型找到最优参数的过程。
- **过拟合（Overfitting）**：模型在训练集表现好但测试集差。
- **欠拟合（Underfitting）**：模型在训练集和测试集都表现差。
- **偏差-方差权衡（Bias-Variance Tradeoff）**：模型复杂度的两难——简单模型偏差大方差小，复杂模型偏差小方差大。
- **正则化（Regularization）**：在损失函数中加入参数惩罚项（L1 / L2 / ElasticNet），防止过拟合。
- **交叉验证（Cross-Validation）**：K-Fold / Leave-One-Out，评估模型泛化能力。
- **MSE（Mean Squared Error）**：$\frac{1}{N}\sum (y - \hat{y})^2$，对大误差敏感。
- **MAE（Mean Absolute Error）**：$\frac{1}{N}\sum |y - \hat{y}|$，对异常值鲁棒。
- **RMSE（Root Mean Squared Error）**：$\sqrt{MSE}$，与 y 同尺度。
- **MAPE（Mean Absolute Percentage Error）**：$\frac{100\%}{N}\sum |y - \hat{y}|/|y|$，相对误差，但 y=0 时失效。
- **R²（Coefficient of Determination）**：$1 - \frac{\sum(y-\hat{y})^2}{\sum(y-\bar{y})^2}$，解释方差比例，0~1 越大越好。
- **Huber Loss**：MSE + MAE 的混合，对异常值鲁棒且可微。
- **分位数回归（Quantile Regression）**：预测 y 的中位数 / 分位数（如 90 分位），而非均值。
- **贝叶斯回归（Bayesian Regression）**：参数有先验分布，输出后验分布（不确定性估计）。
- **岭回归（Ridge）**：L2 正则化，处理共线性。
- **Lasso**：L1 正则化，自动特征选择。
- **ElasticNet**：L1 + L2 混合。
- **多项式回归（Polynomial Regression）**：用多项式特征扩展线性回归。
- **样条回归（Spline Regression）**：用样条基函数拟合非线性。
- **K 近邻回归（KNN Regression）**：取 K 个最近样本的平均值。
- **决策树回归（CART Regression）**：用树结构做回归。
- **随机森林回归（Random Forest Regression）**：多棵树的平均值。
- **GBDT 回归（Gradient Boosting Regression）**：Boosting 多棵树。
- **SVR（Support Vector Regression）**：SVM 的回归版本。
- **神经网络回归（Neural Network Regression）**：深度学习回归。
- **自回归（Autoregression, AR）**：$y_t = \sum \phi_i y_{t-i} + \epsilon_t$，时序经典。
- **ARIMA**：AR + 差分（I） + MA（移动平均）。
- **Prophet**（Facebook 2017）：基于加法模型的时序预测，自动处理节假日、趋势。
- **因果森林（Causal Forest）**：CATE 估计的集成方法。
- **T-Learner / S-Learner / X-Learner**：Uplift 建模的 Meta-Learner 框架。
- **CATE（Conditional Average Treatment Effect）**：条件平均处理效应。
- **ATE（Average Treatment Effect）**：平均处理效应。
- **DML（Double Machine Learning）**：因果推断的 ML 框架。
- **DR-Learner（Doubly Robust Learner）**：因果推断的稳健估计。

### 2.2 数学 / 形式化基础

**线性回归（OLS）**：

$$\hat{y} = w^T x + b$$

**目标**：最小化 MSE：

$$\mathcal{L}_{MSE} = \frac{1}{N}\sum_{i=1}^N (y_i - \hat{y}_i)^2$$

**闭式解**：

$$w = (X^T X)^{-1} X^T y$$

**问题**：特征共线性时 $X^T X$ 不可逆，需要正则化。

**Ridge 回归（L2 正则）**：

$$\mathcal{L}_{Ridge} = \frac{1}{N}\sum (y_i - \hat{y}_i)^2 + \lambda \|w\|_2^2$$

闭式解：$w = (X^T X + \lambda I)^{-1} X^T y$

**Lasso 回归（L1 正则）**：

$$\mathcal{L}_{Lasso} = \frac{1}{N}\sum (y_i - \hat{y}_i)^2 + \lambda \|w\|_1$$

无闭式解，需用坐标下降 / LARS 算法。L1 产生稀疏解，自动特征选择。

**ElasticNet（L1 + L2）**：

$$\mathcal{L}_{EN} = \frac{1}{N}\sum (y_i - \hat{y}_i)^2 + \lambda_1 \|w\|_1 + \lambda_2 \|w\|_2^2$$

**多项式回归**：

$$\hat{y} = w_0 + w_1 x + w_2 x^2 + \ldots + w_d x^d$$

特征扩展到多项式空间，仍用线性回归求解。

**梯度下降**：

$$\theta \leftarrow \theta - \eta \frac{\partial \mathcal{L}}{\partial \theta}$$

- BGD（Batch GD）：用全量数据。
- SGD（Stochastic GD）：用单样本。
- Mini-Batch GD：用小批量，工业默认。

**学习率调度**：Step Decay / Exponential Decay / Cosine Annealing。

**Adam 优化器**（深度学习默认）：

$$m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t$$
$$v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2$$
$$\theta_t = \theta_{t-1} - \eta \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}$$

**损失函数**：

- **MSE**：$\mathcal{L} = \frac{1}{N}\sum (y-\hat{y})^2$，对大误差敏感。
- **MAE**：$\mathcal{L} = \frac{1}{N}\sum |y-\hat{y}|$，对异常值鲁棒但在 0 点不可微。
- **Huber**：$\mathcal{L} = \begin{cases} \frac{1}{2}(y-\hat{y})^2 & |y-\hat{y}| \leq \delta \\ \delta|y-\hat{y}| - \frac{1}{2}\delta^2 & \text{otherwise} \end{cases}$，综合 MSE + MAE 优点。
- **Quantile Loss**（分位数回归）：

$$\mathcal{L}_\tau = \sum_{y_i \geq \hat{y}_i} \tau (y_i - \hat{y}_i) + \sum_{y_i < \hat{y}_i} (1-\tau)(\hat{y}_i - y_i)$$

预测第 $\tau$ 分位数（如 0.5 = 中位数，0.9 = 90 分位）。

**GBDT 回归**：

XGBoost 回归的损失函数（二阶泰勒展开）：

$$\mathcal{L}^{(m)} = \sum_{i=1}^N \left[ g_i f_m(x_i) + \frac{1}{2} h_i f_m(x_i)^2 \right] + \Omega(f_m)$$

其中 $g_i = \partial \ell / \partial \hat{y}_i$，$h_i = \partial^2 \ell / \partial \hat{y}_i^2$。

**贝叶斯线性回归**：

参数有先验 $w \sim \mathcal{N}(0, \sigma_w^2 I)$，似然 $y \sim \mathcal{N}(w^T x, \sigma_n^2)$。

后验：$w \mid X, y \sim \mathcal{N}(\mu_{post}, \Sigma_{post})$，其中：

$$\mu_{post} = \sigma_n^{-2} \Sigma_{post} X^T y$$
$$\Sigma_{post}^{-1} = \sigma_n^{-2} X^T X + \sigma_w^{-2} I$$

**优势**：能给出预测的**不确定性区间**。

**因果回归（Causal Forest）**：

CATE 估计：$\hat{\tau}(x) = E[Y(1) - Y(0) \mid X = x]$

Causal Forest 用 Honest Tree（用部分样本建树，部分样本估叶）估计 $\hat{\tau}(x)$。

**时间序列（ARIMA）**：

$$y_t = c + \phi_1 y_{t-1} + \phi_2 y_{t-2} + \ldots + \phi_p y_{t-p} + \theta_1 \epsilon_{t-1} + \ldots + \theta_q \epsilon_{t-q} + \epsilon_t$$

AR（自回归）+ I（差分）+ MA（移动平均）。

### 2.3 关键算法 / 方法

**线性家族**：

1. **OLS（普通最小二乘）**——线性回归的 baseline。可解释、共线性敏感。
2. **Ridge（L2）**——抗共线性，参数都收缩。
3. **Lasso（L1）**——特征选择，参数稀疏。
4. **ElasticNet**——L1 + L2，特征多 + 相关性强时首选。
5. **Bayesian Ridge**——贝叶斯线性回归，自适应正则化。
6. **多项式回归**——非线性扩展，degree 太大易过拟合。

**集成学习家族**：

7. **Random Forest Regressor**——抗过拟合、可解释、特征重要性。
8. **XGBoost Regressor**——结构化数据回归 SOTA。
9. **LightGBM Regressor**——速度最快。
10. **CatBoost Regressor**——类别特征友好。
11. **Extra Trees**——随机性更强，速度更快。

**深度学习家族**：

12. **MLP**——简单深度回归。
13. **Wide & Deep**——记忆 + 泛化（推荐 + 回归通用）。
14. **DeepFM / xDeepFM**——特征自动交叉。
15. **Transformer for Regression**——文本 / 时序数值预测。
16. **TabNet / SAINT / FT-Transformer**——表格深度学习。

**时序家族**：

17. **ARIMA / SARIMA**——经典时序模型。
18. **Prophet**（Facebook 2017）——加法模型，自动节假日。
19. **DeepAR**（Amazon 2018）——自回归 RNN。
20. **N-BEATS / N-HiTS**（2020）——时序基础模型。
21. **Informer / Autoformer**——长序列 Transformer。
22. **PatchTST**（2023）——Patch 化时序 Transformer。
23. **TimesNet / iTransformer**（2023-2024）——时序 SOTA。
24. **Chronos**（Amazon 2024）——LLM 风格的时序基础模型。
25. **TimeGPT**（Nixtla 2024）——时序基础模型服务。
26. **Lag-Llama**（2024）——开源时序基础模型。

**贝叶斯 / 分位数 / 不确定性**：

27. **Bayesian Linear Regression**——后验分布。
28. **Gaussian Process Regression**——非参数贝叶斯回归。
29. **Quantile Regression**（LightGBM / XGBoost 支持）——分位数预测。
30. **Conformal Prediction**——分布无关的不确定性估计。

**因果推断家族**：

31. **T-Learner / S-Learner / X-Learner**——Uplift 建模 Meta-Learner。
32. **Causal Forest / Causal Tree**（Wager & Athey 2018）——异质处理效应。
33. **Dragonnet**（Shi et al. 2020）——因果推断深度学习。
34. **DML（Double Machine Learning）**（Chernozhukov et al. 2018）——稳健因果效应。
35. **CFR / TARNet**——治疗效果回归。
36. **ITE / CATE Estimation**——个体 / 条件处理效应。
37. **Instrumental Variable Regression**（2SLS / GMM）——工具变量回归。
38. **Synthetic Control Method**——合成控制法。

**LLM 辅助**：

39. **LLM 提取数值特征**——从文本提取结构化数值。
40. **LLM 回归打标**——LLM 对主观维度打分（如"用户满意度"1-10）。
41. **LLM Embedding + 回归头**——LLM 提 embedding + MLP 回归头。
42. **Chronos / TimeGPT**（2024）——LLM 风格的时序基础模型。

### 2.4 与相邻概念的关系

- **回归 vs 分类**：输出连续 vs 离散，损失不同。两者可互通（回归 → 阈值 → 分类；分类概率 → 期望 → 回归）。
- **回归 vs 时序**：时序是回归的特例，强调时间依赖。ARIMA / Prophet / 时序 Transformer 都是时序回归。
- **回归 vs 因果推断**：传统回归是相关性，因果回归追求因果性。**因果回归 = 回归 + 处理变量 + 异质性建模**。
- **回归 vs 排序学习**：回归输出绝对值，排序输出相对顺序。学习排序（LambdaRank / ListMLE）是推荐核心。
- **回归 vs 强化学习**：强化学习的 value function 估计本质是回归（Bellman 方程）。
- **回归 vs 优化**：回归预测"是多少"，优化找"最大 / 最小"。回归模型常作为优化问题的目标函数。

> 💡 **思考锚点**：数一下你们线上真正在跑的回归任务，逐个归到 §2.3 的四大家族（线性 / 集成 / 深度 / 时序）——有几个是你主动选型选的，有几个是默认习惯带进来的？再挑一个要拿它驱动决策的模型问 §2.4：它给的是点估计，还是 Quantile Regression / Conformal Prediction 那种区间——没有区间，你凭什么判断这一次的预测该不该信？

---

- [§3. 设计模式与范式](04-regression-section-3-sec3.md)
- [§4. 工程实现](04-regression-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](04-regression-section-5-ai.md)
- [§6. 落地实践](04-regression-section-6-sec6.md)
- [§7. 与其他方法对比](04-regression-section-7-sec7.md)
- [§8. 面试真题集](04-regression-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](04-regression-section-3-sec3.md)
- [§4. 工程实现](04-regression-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](04-regression-section-5-ai.md)
- [§6. 落地实践](04-regression-section-6-sec6.md)
- [§7. 与其他方法对比](04-regression-section-7-sec7.md)
- [§8. 面试真题集](04-regression-section-8-sec8.md)

---
