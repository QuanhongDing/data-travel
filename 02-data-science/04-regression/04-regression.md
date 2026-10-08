# 回归算法（Regression）

> **一句话定位**：从线性回归到深度学习与因果回归——把"预测一个连续值"问题抽象为可量化的映射模型，是销量预测、评分预估、时空建模的基石。

> 本文是 data-travel 项目 [Ch2 · 数据科学与算法](../../README.md) 的子章节（**04 回归算法**）。覆盖 R2 数据科学算法 领域中"回归（Regression）"相关的核心原理、设计模式、工程实现与 AI 时代演进。

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

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：线性回归优先（Linear-First）**

- 默认用 OLS / Ridge / Lasso 起步。原因：可解释、训练快、特征重要性清晰。
- 适合：低维、强可解释、特征少、关系线性。
- 工具：scikit-learn、Statsmodels。

**模式 2：GBDT 主导（GBDT-Dominant）**

- 用 XGBoost / LightGBM / CatBoost 作为结构化数据回归主力。
- 适合：表格数据、特征工程到位、需要高精度。
- 优势：精度高、特征重要性、对缺失值 / 类别特征鲁棒。
- 局限：模型大、推理延迟高。

**模式 3：深度学习特化（DL-Specialized）**

- 神经网络 / Transformer 做回归。
- 适合：高维、特征复杂、有大量数据、需要高精度。
- 优势：精度天花板高、自动特征学习。
- 局限：训练成本高、可解释性差。

**模式 4：时序专用（TS-Specialized）**

- ARIMA / Prophet / 时序 Transformer。
- 适合：强时序依赖、季节性、节假日效应。
- 工具：Prophet / DeepAR / PatchTST / Chronos。

**模式 5：贝叶斯回归（Bayesian）**

- 给出预测的不确定性区间。
- 适合：风险敏感、医疗、金融、决策。
- 优势：不确定性估计。
- 工具：PyMC / Stan / GPyTorch。

**模式 6：分位数回归（Quantile）**

- 预测分位数（如 90 分位数）。
- 适合：风险预警（预测最大可能销量）、库存管理（90 分位备货）。
- 优势：分布信息丰富。

**模式 7：因果回归（Causal）**

- CATE / Uplift 估计。
- 适合：营销决策、A/B 测试分析、政策评估。
- 优势：因果性、可解释政策建议。

**模式 8：混合架构（Hybrid）**

- 时序特征 + GBDT（非线性部分）+ 线性回归（趋势）。
- 适合：复杂业务预测（销量 = 趋势 × 季节性 × 促销 + 噪声）。

**模式 9：物理信息回归（PINN）**

- 在损失中加入物理约束（如能量守恒、热传导方程）。
- 适合：科学计算、工程仿真。
- 工具：DeepXDE / PyTorch + 自定义约束。

**模式 10：LLM 增强（LLM-Augmented）**

- LLM 提取非结构化特征 + GBDT 回归。
- 适合：需要文本特征（评论、商品描述）的预测。
- 优势：融合 LLM 语义理解 + GBDT 精度。

### 3.2 适用场景决策表

| 业务特征 | 推荐算法 | 理由 |
| --- | --- | --- |
| 低维 + 线性关系 + 可解释 | OLS / Ridge / Lasso | 简单优先 |
| 表格数据 + 中等规模 | XGBoost / LightGBM / CatBoost | 工业默认 |
| 高维 + 大数据 + 强非线性 | 深度学习 / Transformer | 高精度 |
| 强时序依赖 + 季节性 | Prophet / ARIMA / 时序 Transformer | 时序专用 |
| 需要不确定性估计 | Bayesian Regression / GP / Conformal | 风险敏感 |
| 异质处理效应 / 因果推断 | Causal Forest / T-Learner / X-Learner | 因果 |
| 90 分位数 / 风险预警 | Quantile Regression | 分布信息 |
| 长文本数值预测 | LLM Embedding + 回归头 | 融合语义 |
| 实时性要求高 | 简单 LR / FM / 双塔 | 推理快 |
| 物理约束场景 | PINN / 物理引导回归 | 科学计算 |
| 分布漂移明显 | 在线学习 / 鲁棒回归 | 适应漂移 |
| 数据极少（< 100） | Ridge / Bayesian Ridge | 小样本 |
| 多任务联合 | MMoE / PLE / Multi-Task | 共享特征 |
| 自变量有强异方差 | WLS / GLS | 加权最小二乘 |
| 含分类特征多 | CatBoost | 原生支持 |
| 高维稀疏（文本） | Embedding + LightGBM | 维度灾难缓解 |

### 3.3 反模式与陷阱

1. **「特征工程不到位就上深度学习」反模式**：原始特征直接喂神经网络，效果差。**结构化数据先做特征工程，深度学习是 XGBoost 跑不动 / 精度不够时的备选**。
2. **「用 accuracy 评估回归」反模式**：回归没有 accuracy。**必须用 MAE / RMSE / R² / MAPE + 业务自定义指标**。
3. **「不考虑业务量纲」反模式**：MAE 优化的是"预测值与真实值的绝对差"，但业务可能更关心"相对误差"。**用业务目标函数加权（如高销量商品权重高）**。
4. **「MAPE 在 y=0 附近失效」反模式**：y=0 时 MAPE = ∞。**用 SMAPE（对称 MAPE）或业务自定义指标**。
5. **「过拟合靠加大模型容量」反模式**：模型越大，过拟合越严重。**正则化（L1/L2/Dropout）+ 早停 + 交叉验证**。
6. **「不区分训练 / 验证 / 测试集」反模式**：直接 8:2 切分，时序数据泄露未来信息。**时间切分 + 严格隔离**。
7. **「线性回归直接上原始特征」反模式**：原始特征有非线性 / 交互，OLS 效果差。**特征工程（多项式 / 交叉 / 分箱）**。
8. **「外推完全失败」反模式**：训练数据 0-100，预测 1000-10000，模型完全失效。**约束输出范围 / 用历史最大值截断**。
9. **「时序数据用普通回归」反模式**：忽略时间依赖，模型不知道"未来"概念。**用时序模型（ARIMA / Prophet / 时序 Transformer）**。
10. **「因果关系当相关关系用」反模式**：训练数据中"广告投放"和"销量"相关，但因果方向可能是"销量高的产品投更多广告"。**因果回归 / 工具变量 / RCT 是正解**。
11. **「不处理异常值」反模式**：极端值主导 MSE，导致模型偏向大值。**用 Huber Loss / Winsorize（缩尾）/ 异常值处理**。
12. **「预测平均值不用分位数」反模式**：业务可能关心"最大可能"或"最小可能"（如库存、风险）。**分位数回归**。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务问题抽象**

- 把业务问题转化为"输入 → 连续输出"的回归问题。
- 明确输出含义（数值 / 概率 / 时间）、业务可接受误差范围、评估指标。
- 输出：**问题定义文档**。

**Step 2：数据准备与样本构建**

- 收集历史数据（时序：足够长的历史；非时序：足够多样本）。
- 处理缺失值（删除 / 填充 / 插值）。
- 处理异常值（Winsorize / 删除 / 用 Huber Loss）。
- 输出：**训练集 / 验证集 / 测试集**。

**Step 3：特征工程**

- 数值特征：标准化 / 分箱 / 缺失值填充。
- 时序特征：滞后值、滑动窗口、差分、季节性分解。
- 类别特征：One-Hot / Target Encoding / 嵌入。
- 交叉特征：手动交叉或用 FM / DeepFM 自动学习。
- 输出：**特征 pipeline + Feature Store**。

**Step 4：模型选型与基线**

- 用 §3.2 决策表选 1-3 个候选模型。
- 跑基线（OLS / LightGBM），建立性能下限。
- 输出：**基线报告**（MAE / RMSE / R²）。

**Step 5：模型调优**

- 超参调优（Grid / Random / Bayesian）。
- 损失函数选择（MSE / MAE / Huber / 分位数）。
- 正则化强度（L1 / L2）。
- 输出：**调优报告**。

**Step 6：模型评估**

- 离线评估：MAE / RMSE / R² / MAPE / 业务指标。
- 时序评估：滚动预测 / 跨期评估。
- 错误分析：分业务场景看预测误差。
- 输出：**评估报告 + 错误分析**。

**Step 7：模型上线**

- 模型序列化（Pickle / PMML / ONNX）。
- 在线服务（TF Serving / Triton / 自研）。
- 性能压测（QPS / 延迟）。
- 灰度发布 / A/B 测试。
- 输出：**上线报告 + A/B 实验报告**。

**Step 8：监控与闭环**

- 模型监控：输入分布、输出分布、预测误差实时。
- 漂移检测：Data Drift / Concept Drift。
- 反馈回流：真实值回流，模型定期重训。
- 输出：**监控 dashboard + 重训 pipeline**。

### 4.2 关键技术点

**特征工程关键技术**：

1. **缺失值处理**：删除 / 均值填充 / 中位数填充 / 前向填充（时序）/ 模型预测填充。
2. **异常值处理**：Winsorize（缩尾）、IQR 检测、Z-Score、Isolation Forest。
3. **标准化**：StandardScaler、MinMaxScaler、RobustScaler、Log 变换（偏态分布）。
4. **分箱**：等频分箱、等距分箱、卡方分箱、决策树分箱。
5. **交叉特征**：手动构造（如 AND(x1, x2)）、FM / DeepFM 自动。
6. **时序特征**：滞后值（lag）、滑动窗口（rolling）、差分（diff）、季节性分解（STL）、傅里叶特征。
7. **特征选择**：方差过滤、相关系数、L1 正则、树模型 importance、SHAP、递归特征消除（RFE）。

**训练关键技术**：

8. **正则化**：L1 / L2 / ElasticNet / Dropout / Label Smoothing。
9. **损失函数**：MSE / MAE / Huber / 分位数 Loss / 自定义 Loss。
10. **优化器**：SGD / Adam / AdamW / Lookahead。
11. **学习率调度**：Warmup + Cosine / Linear / ReduceLROnPlateau。
12. **Early Stopping**：验证集 loss 不再下降时停止。
13. **梯度累积**：小显存模拟大 batch。
14. **分布式训练**：PS 架构 / AllReduce（PyTorch DDP / Horovod）。
15. **混合精度**：FP16 + FP32，训练速度提升 2-3 倍。

**推理关键技术**：

16. **模型压缩**：量化（INT8 / INT4）、剪枝、蒸馏（如 DistilBERT → 小模型）。
17. **推理加速**：ONNX Runtime、TensorRT、TVM。
18. **批处理**：多个请求合并推理，提升吞吐。
19. **缓存**：高频查询结果缓存。

**时序预测关键技术**：

20. **季节性分解**：STL（Seasonal-Trend-Loess）。
21. **差分**：一阶 / 季节性差分，让序列平稳。
22. **滞后值特征**：lag-1, lag-7, lag-30（根据业务周期）。
23. **滚动特征**：rolling mean / std / min / max。
24. **节假日特征**：业务日历（中国春节、618、双 11）。
25. **多步预测策略**：Recursive / Direct / Multi-Output。

**因果推断关键技术**：

26. **倾向得分（Propensity Score）**：PSM 匹配 / 加权。
27. **DML（Double ML）**：部分线性回归 + ML 残差化。
28. **工具变量（IV）**：2SLS / GMM。
29. **Synthetic Control**：合成对照组。
30. **RCT 数据**：随机实验的金标准。

**LLM 辅助关键技术**：

31. **特征生成**：LLM 从文本提取结构化数值（如评论情感 1-10）。
32. **Embedding + 回归**：Sentence-BERT 提 embedding + MLP 回归。
33. **Chronos / TimeGPT**：LLM 风格的时序基础模型。

### 4.3 工具链与平台

**线性回归库**：

- **scikit-learn**（Python / 开源）——LinearRegression / Ridge / Lasso / ElasticNet。
- **Statsmodels**（Python / 开源）——统计推断导向，含 OLS / WLS / GLS / ARIMA。
- **scipy.stats**——基础统计。

**GBDT 库**：

- **XGBoost / LightGBM / CatBoost**——见 Ch2-02 分类章节。

**深度学习框架**：

- **PyTorch / TensorFlow**——见 Ch2-02 章节。
- **PaddlePaddle / MindSpore**——国产化。

**时序预测库**：

- **Prophet**（Facebook / 开源）——时序预测事实标准之一。
- **statsmodels**（Python / 开源）——ARIMA / SARIMAX。
- **pmdarima**（Python / 开源）——Auto-ARIMA。
- **Darts**（Python / 开源）——时序预测统一库（含 ARIMA / Prophet / Transformer）。
- **sktime**（Python / 开源）——时序预测 / 分类统一库。
- **NeuralForecast**（Nixtla / 开源）——时序深度学习库。
- **TimeSeriesForecast**（Nixtla / 开源）——AutoML 时序预测。

**深度学习时序模型**：

- **Informer / Autoformer**（开源）——长序列 Transformer。
- **PatchTST**（ICLR 2023）——Patch 化 Transformer。
- **TimesNet**（2023）——时序 SOTA。
- **iTransformer**（2024）——反转 Transformer。
- **Chronos**（Amazon 2024）——LLM 风格时序基础模型。
- **Lag-Llama**（2024）——开源时序基础模型。
- **TimeGPT-1**（Nixtla 2024）——商业时序基础模型。

**贝叶斯 / 不确定性库**：

- **PyMC**（Python / 开源）——贝叶斯建模。
- **Stan**（C++/Python / 开源）——贝叶斯推断。
- **GPyTorch**（Python / 开源）——高斯过程。
- **BoTorch**（PyTorch / 开源）——贝叶斯优化。
- **MAPIE**（Python / 开源）——Conformal Prediction。

**因果推断库**：

- **DoWhy**（Microsoft / 开源）——因果推断端到端框架。
- **EconML**（Microsoft / 开源）——CATE / Uplift 建模。
- **CausalML**（Uber / 开源）——Uplift 建模工业库。
- **CausalForest**（开源）——Causal Forest 实现。
- **PyWhy**（开源）——因果推断统一平台。

**LLM / Embedding 库**：

- **HuggingFace Transformers**——LLM / Embedding 首选。
- **Sentence Transformers**——文本 Embedding。
- **OpenAI Embedding API**——商业 Embedding。
- **LangChain / LlamaIndex**——LLM 应用框架。
- **DSPy**——LLM 程序化优化。

**AutoML 平台**：

- **AutoGluon**（Amazon / 开源）——结构化数据 AutoML。
- **FLAML**（Microsoft / 开源）——AutoML 库。
- **H2O.ai**（商业）——AutoML 平台。
- **PyCaret**（Python / 开源）——低代码 ML。

**2024-2025 新工具**：

- **Chronos**（Amazon 2024）——LLM 风格时序基础模型。
- **TimeGPT**（Nixtla 2024）——商业时序基础模型服务。
- **Lag-Llama**（2024）——开源时序基础模型。
- **TimesFM**（Google 2024）——Google 时序基础模型。
- **MOIRAI**（Salesforce 2024）——通用时序基础模型。
- **UniTime**（2024）——统一时序基础模型。
- **Foundation Models for Causal Inference**（2024）——因果基础模型。

### 4.4 代码 / 示例

**示例 1：LightGBM 回归（销量预测）**

```python
import lightgbm as lgb
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

# 时序切分（不能用随机 K-Fold，会泄露未来信息）
tscv = TimeSeriesSplit(n_splits=5)

# 训练
params = {
    'objective': 'regression',
    'metric': 'mae',
    'learning_rate': 0.05,
    'num_leaves': 31,
    'feature_fraction': 0.8,
    'bagging_fraction': 0.8,
    'bagging_freq': 5,
    'min_child_samples': 20,
    'lambda_l1': 0.1,
    'lambda_l2': 0.1,
    'verbose': -1
}

train_data = lgb.Dataset(X_train, label=y_train)
valid_data = lgb.Dataset(X_valid, label=y_valid, reference=train_data)

bst = lgb.train(
    params,
    train_data,
    num_boost_round=2000,
    valid_sets=[valid_data],
    callbacks=[lgb.early_stopping(100), lgb.log_evaluation(100)]
)

# 预测
y_pred = bst.predict(X_test, num_iteration=bst.best_iteration)

# 评估
print(f"MAE: {mean_absolute_error(y_test, y_pred):.2f}")
print(f"RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.2f}")
print(f"R²: {r2_score(y_test, y_pred):.4f}")

# 特征重要性
import matplotlib.pyplot as plt
lgb.plot_importance(bst, max_num_features=20)
plt.show()
```

**示例 2：分位数回归（LightGBM）**

```python
import lightgbm as lgb

# 训练 P50（中位数）和 P90（90 分位数）
quantiles = [0.5, 0.9]
models = {}

for q in quantiles:
    params = {
        'objective': 'quantile',
        'alpha': q,
        'metric': 'quantile',
        'learning_rate': 0.05,
        'num_leaves': 31,
        'verbose': -1
    }
    train_data = lgb.Dataset(X_train, label=y_train)
    valid_data = lgb.Dataset(X_valid, label=y_valid, reference=train_data)
    models[q] = lgb.train(
        params, train_data, num_boost_round=1000,
        valid_sets=[valid_data],
        callbacks=[lgb.early_stopping(50)]
    )

# 预测
y_p50 = models[0.5].predict(X_test)
y_p90 = models[0.9].predict(X_test)

# 90 分位回归：90% 概率实际值 < y_p90（用于风险预警、备货决策）
```

**示例 3：Prophet 时序预测**

```python
from prophet import Prophet
import pandas as pd

# 数据准备：ds (date), y (value)
df = pd.read_csv('sales.csv')
df.columns = ['ds', 'y']

# 训练
model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False,
    seasonality_mode='additive',
    changepoint_prior_scale=0.05  # 趋势变化灵活度
)
model.add_country_holidays(country_name='CN')  # 中国节假日

# 业务事件（可选）
# model = model.add_seasonality(name='monthly', period=30.5, fourier_order=5)

model.fit(df)

# 预测未来 30 天
future = model.make_future_dataframe(periods=30)
forecast = model.predict(future)

# 可视化
model.plot(forecast)
model.plot_components(forecast)  # 趋势 / 季节性 / 节假日分解
```

**示例 4：贝叶斯线性回归（不确定性区间）**

```python
import pymc as pm
import numpy as np

with pm.Model() as model:
    # 先验
    w = pm.Normal('w', mu=0, sigma=1, shape=X_train.shape[1])
    sigma = pm.HalfNormal('sigma', sigma=1)

    # 似然
    mu = pm.math.dot(X_train, w)
    y_obs = pm.Normal('y_obs', mu=mu, sigma=sigma, observed=y_train)

    # 采样
    trace = pm.sample(2000, tune=1000, return_inferencedata=True)

# 后验预测
with model:
    pm.set_data({"X_train": X_test})  # 切换到测试集
    posterior_predictive = pm.sample_posterior_predictive(trace)

# 后验预测均值 + 置信区间
y_pred = posterior_predictive.posterior_predictive['y_obs'].mean(dim=['chain', 'draw']).values
y_lower = np.percentile(posterior_predictive.posterior_predictive['y_obs'].values, 2.5, axis=(0,1))
y_upper = np.percentile(posterior_predictive.posterior_predictive['y_obs'].values, 97.5, axis=(0,1))
```

**示例 5：因果 Forest（CATE 估计）**

```python
from econml.dml import CausalForestDML
from sklearn.ensemble import RandomForestRegressor

# Causal Forest DML（CATE 估计 + 置信区间）
est = CausalForestDML(
    model_y=RandomForestRegressor(n_estimators=100, random_state=0),
    model_t=RandomForestRegressor(n_estimators=100, random_state=0),
    discrete_treatment=False,
    cv=5,
    random_state=0
)

# X: 协变量, T: 处理变量 (treatment), y: 结果变量
est.fit(y_train, T_train, X=X_train, W=None)

# CATE 估计（个体处理效应）
cate = est.effect(X_test)

# 置信区间
cate_interval = est.effect_interval(X_test, alpha=0.05)

# 特征重要性
print(est.feature_importances_)

# 异质性分析
# 将 X_test 分为高 CATE / 低 CATE 两组，对比业务效果
```

**示例 6：T-Learner Uplift 建模**

```python
from causalml.inference.tree import UpliftRandomForestClassifier
import numpy as np

# 数据：X (特征), treatment (处理组标签), y (结果)
uplift_model = UpliftRandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_leaf=20,
    evaluationFunction='KL'  # KL 散度作为 uplift 评估
)
uplift_model.fit(X_train, treatment=T_train, y=y_train)

# 预测每个用户的 uplift（处理组 vs 对照组期望差）
uplift_scores = uplift_model.predict(X_test)

# 业务应用：选 uplift 高的用户群投放营销
high_uplift_threshold = np.percentile(uplift_scores, 80)
target_users = np.where(uplift_scores >= high_uplift_threshold)[0]
```

**示例 7：Chronos 时序基础模型（2024 新工具）**

```python
import torch
from chronos import ChronosBoltPipeline

# 加载预训练时序基础模型
pipeline = ChronosBoltPipeline.from_pretrained(
    "amazon/chronos-bolt-small",
    device_map="cuda",
    torch_dtype=torch.bfloat16,
)

# 时序预测（无需训练！）
context = torch.tensor(y_train[-100:])  # 用最后 100 个时间步
quantile_levels = [0.1, 0.5, 0.9]
forecast = pipeline.predict(
    context=context,
    prediction_length=30,  # 预测未来 30 个时间步
    quantile_levels=quantile_levels
)

# 输出分位数预测
low, median, high = forecast[0][..., 0], forecast[0][..., 1], forecast[0][..., 2]
```

**示例 8：MLP 深度学习回归 + 自定义 Loss**

```python
import torch
import torch.nn as nn

class HuberRegression(nn.Module):
    """深度学习回归 + Huber Loss"""
    def __init__(self, input_dim, hidden_dims=[128, 64, 32]):
        super().__init__()
        layers = []
        prev_dim = input_dim
        for hidden_dim in hidden_dims:
            layers += [
                nn.Linear(prev_dim, hidden_dim),
                nn.ReLU(),
                nn.BatchNorm1d(hidden_dim),
                nn.Dropout(0.2)
            ]
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, 1))
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return self.net(x).squeeze(-1)

# 训练
model = HuberRegression(input_dim=X_train.shape[1])
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
criterion = nn.HuberLoss(delta=1.0)  # Huber Loss，对异常值鲁棒

for epoch in range(100):
    model.train()
    optimizer.zero_grad()
    y_pred = model(X_train_tensor)
    loss = criterion(y_pred, y_train_tensor)
    loss.backward()
    optimizer.step()
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：时序基础模型（Time Series Foundation Models）**

2024 年开始出现"LLM 风格的时序基础模型"：

- **Chronos**（Amazon 2024）——把时序 token 化为离散值，用 Transformer 训练成"时序 LLM"。
- **TimeGPT**（Nixtla 2024）——商业时序基础模型 API。
- **Lag-Llama**（2024）——开源时序基础模型，基于滞后特征。
- **TimesFM**（Google 2024）——Google 时序基础模型。
- **MOIRAI**（Salesforce 2024）——通用时序基础模型。
- **UniTime**（2024）——统一时序基础模型。

**优势**：零样本预测、跨域迁移、效果接近专用模型。

**方向 2：LLM 增强回归（LLM-Augmented Regression）**

LLM 不是直接做回归（数值精度差），而是作为"特征生成器"：

```python
# LLM 从文本提取数值特征
def extract_features(text: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{
            "role": "user",
            "content": f"""从以下文本提取数值特征（JSON）：
- sentiment: -1 到 1
- urgency: 0 到 10
- price_sensitivity: 0 到 10

文本：{text}"""
        }]
    )
    return json.loads(response.choices[0].message.content)

# 用 LLM 提取的特征 + 结构化特征 → GBDT 回归
features = extract_features(comment_text)
X = np.hstack([structured_features, [features['sentiment'], features['urgency'], features['price_sensitivity']]])
y_pred = gbm.predict(X)
```

**方向 3：因果推断与基础模型**

- 因果推断基础模型（Foundation Models for Causal Inference）——用大模型预训练 + 因果微调。
- LLM 做工具变量识别（自动从文本中找 IV）。
- Causal Forest + LLM Embedding 提升 CATE 估计精度。

**方向 4：物理信息回归（PINN）**

物理信息神经网络（Physics-Informed Neural Networks）：

```python
# PINN 示例（热传导方程）
def pinn_loss(model, x, t):
    u = model(x, t)  # 预测温度
    u_t = torch.autograd.grad(u, t, grad_outputs=torch.ones_like(u), create_graph=True)[0]
    u_x = torch.autograd.grad(u, x, grad_outputs=torch.ones_like(u), create_graph=True)[0]
    u_xx = torch.autograd.grad(u_x, x, grad_outputs=torch.ones_like(u_x), create_graph=True)[0]

    # 物理方程：u_t = alpha * u_xx
    alpha = 0.01
    residual = u_t - alpha * u_xx
    physics_loss = (residual ** 2).mean()
    return physics_loss
```

**应用**：天气预报、流体仿真、材料科学、医疗仿真。

**方向 5：可解释回归（Explainable AI for Regression）**

- SHAP（SHapley Additive exPlanations）——基于博弈论的特征贡献度。
- LIME（Local Interpretable Model-agnostic Explanations）——局部线性近似。
- Anchor / 反事实解释——"如果 X 变化，y 会怎么变"。
- EBM（Explainable Boosting Machine）——可解释 + 高精度。

**应用**：金融风控（必须解释每个预测）、医疗、政策评估。

**方向 6：Agent 驱动的回归**

智能体自主发现回归任务：

- 智能体扫描业务数据，自动提议"这里需要回归"。
- 智能体选算法、调参、评估、上线。
- 智能体持续监控 + 自动重训。
- 人类只需定义业务目标。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**回归 + RAG**：

- 用 RAG 检索历史相似场景作为回归上下文。
- 用 LLM 总结相似场景的预测结果 + 解释。

**典型架构**：

```
新场景
   ↓
[检索相似历史场景 top-k]
   ↓
[相似场景的预测结果作为参考]
   ↓
[回归模型 + LLM 综合预测]
```

**应用**：股价预测（检索相似市场环境）、销量预测（检索相似营销活动）。

**因果推断 + RAG**：

- 用 RAG 检索"类似业务场景的因果分析报告"。
- LLM 综合判断当前场景的因果效应。

**应用**：政策效果评估、营销决策。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **Chronos**（Amazon 2024，ICML）——时序基础模型。
- **TimeGPT**（Nixtla 2024）——时序基础模型服务。
- **TimesFM**（Google 2024）——Google 时序基础模型。
- **MOIRAI**（Salesforce 2024）——通用时序基础模型。
- **PatchTST**（ICLR 2023）——时序 Transformer SOTA。
- **iTransformer**（2024）——反转 Transformer for TS。
- **TimesNet**（2023）——时序 SOTA。
- **Causal Foundation Models**（2024）——因果基础模型。
- **Conformal Prediction**（2024）——分布无关的不确定性估计。
- **Physics-Informed Neural Networks**（2024 持续迭代）。

**工业进展**：

- **Amazon Chronos**（2024）——时序基础模型开源。
- **Nixtla TimeGPT**（2024）——商业时序基础模型 API。
- **Google TimesFM**（2024）——Google 时序基础模型。
- **Salesforce MOIRAI**（2024）——多任务时序基础模型。
- **OpenAI text-embedding-3**（2024）——高质量 Embedding 用于回归。
- **Anthropic Claude 3.5**（2024）——结构化输出用于回归。
- **阿里 PAI 时序预测**（2024）——国产化时序平台。
- **腾讯智能钛时序**（2024）——国产化时序平台。
- **华为云时序分析**（2024）——盘古大模型 for 时序。
- **字节豆包时序**（2024）——多模态时序。
- **Microsoft EconML**（2024）——因果推断持续迭代。
- **Uber CausalML**（2024）——Uplift 建模。

**企业落地案例**：

- **亚马逊**：用 Chronos 做库存预测，覆盖 1 亿+ SKU。
- **沃尔玛**：用 Prophet + Chronos 做需求预测，预测准确率 +20%。
- **联合利华**：用因果 Forest 做促销效果评估，营销 ROI +15%。
- **阿里巴巴**：用时序 Transformer 做 GMV 预测，预测准确率 +15%。
- **美团**：用 LightGBM + 时序特征做配送时长预估，误差 -10%。
- **京东**：用 DML 做营销因果效应评估，决策更稳健。
- **蚂蚁集团**：用 Bayesian 回归做风控评分，决策可解释。

### 5.4 未来 3-5 年趋势

1. **「时序基础模型化」**：Chronos / TimeGPT / Lag-Llama 让时序预测"零样本 + 通用"成为现实。
2. **「LLM + 回归混合」**：LLM 提取非结构化特征 + GBDT / 深度学习做回归，融合语义与精度。
3. **「因果推断普及」**：因果回归（Causal Forest / DML）成为商业决策标配。
4. **「可解释回归成为强制」**：金融、医疗、政务领域回归模型必须可解释（SHAP / LIME）。
5. **「物理信息回归」**：PINN 在科学计算、工程仿真领域爆发。
6. **「不确定性估计标配」**：贝叶斯 / Conformal Prediction 让回归输出"区间"而非"点"。
7. **「Agent-driven 回归」**：智能体自主发现、训练、部署回归模型。
8. **「隐私保护回归」**：联邦回归在跨域协作中普及。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：某头部电商的销量预测**

- 背景：1 万+ SKU，日粒度，未来 30 天预测。
- 方案：时序特征（滞后 / 滑动 / 节假日）+ GBDT（LightGBM）+ Prophet 集成。
- 工具：Prophet + LightGBM + 自研特征平台 + Flink 实时特征。
- 结果：预测准确率（MAPE）从 25% 降至 12%，库存周转率 +18%。

**案例 2：某出行公司的 ETA 预估**

- 背景：千万级订单 / 日，分钟级 ETA 预估。
- 方案：Wide & Deep 深度学习 + 时空特征 + 多任务学习。
- 工具：TF Serving + 自研深度学习平台。
- 结果：ETA 误差从 8 分钟降至 5 分钟，用户体验 +20%。

**案例 3：某股份制银行的风控评分**

- 背景：信贷申请评分卡。
- 方案：Logistic 回归 + WOE 编码 + 分数校准 + SHAP 解释。
- 工具：自研评分卡平台 + SHAP 解释器。
- 结果：AUC 0.78，分数校准后 KS 0.45，通过监管验收。

**案例 4：某短视频平台的完播率预测**

- 背景：每条视频的完播率预估，影响推荐排序。
- 方案：Wide & Deep + 多任务（CTR + 完播 + 互动）+ 因果 Forest 评估 A/B。
- 工具：TF + CausalML。
- 结果：完播率预估 AUC +10%，推荐 GMV +8%。

**案例 5：某零售连锁的需求预测**

- 背景：1000+ 门店，万级 SKU，周粒度需求预测。
- 方案：Prophet + 时序 Transformer + GBDT 集成 + Chronos 零样本。
- 工具：Prophet + PatchTST + Chronos + 自研 pipeline。
- 结果：预测准确率 +25%，缺货率 -40%。

**案例 6：某 SaaS 公司的 LTV 预测**

- 背景：客户生命周期价值（LTV）预测，影响获客预算。
- 方案：BG/NBD 模型 + Gamma-Gamma + LightGBM 修正。
- 工具：lifetimes 库 + LightGBM。
- 结果：LTV 预测误差 -15%，获客 ROI +20%。

### 6.2 踩坑与经验

**坑 1：时序数据随机切分导致未来泄露**

- 现象：用普通 train_test_split，测试集"看见"未来，MAE 极低，上线翻车。
- 解法：必须用 TimeSeriesSplit + 严格时间切分。

**坑 2：MAPE 在低销量 SKU 失效**

- 现象：低销量 SKU 的 MAPE = 500%，误导模型调优。
- 解法：用 SMAPE 或 MAE 替代，或对低销量 SKU 加权。

**坑 3：忽视业务季节性**

- 现象：618 / 双 11 / 春节销量大涨，模型预测完全失效。
- 解法：业务日历特征 + 节假日特征 + 营销活动特征。

**坑 4：异常值导致 MSE 主导**

- 现象：少量极端值让 MSE 主导训练，模型偏向大值。
- 解法：Winsorize + Huber Loss + 异常值检测。

**坑 5：因果关系当相关用**

- 现象：投放越多销量越好，但反向可能是"销量越好投越多"。
- 解法：用 RCT / 工具变量 / Causal Forest 做因果推断。

**坑 6：外推完全失败**

- 现象：训练数据 0-100，预测 1000 时模型给出无意义结果。
- 解法：用历史最大值截断 + 约束输出范围。

**坑 7：不处理异方差**

- 现象：高销量商品预测误差大，低销量商品预测误差小，但模型平均优化。
- 解法：用 WLS / GLS / 加权 MSE。

**坑 8：时序模型部署后不更新**

- 现象：模型部署后 6 个月，效果断崖式下降（业务变了）。
- 解法：定期重训 + 漂移检测 + 在线学习。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（单点验证，1-3 个月）**：

1. 选 1 个具体回归问题（如"日销量预测"）。
2. 准备 3-12 个月历史数据。
3. 用 OLS / LightGBM 跑 baseline。
4. 用 MAE / RMSE 评估。
5. 部署上线 + 灰度验证。

**1→10（部门级，3-9 个月）**：

1. 扩展到 5-10 个回归任务。
2. 引入深度学习 / Transformer。
3. 建立 Feature Store + 特征工程流水线。
4. 建立 A/B 测试框架。
5. 模型监控 + 定期重训。

**10→100（企业级，9-24 个月）**：

1. 多任务学习（销量 + 价格 + 库存）。
2. 时序基础模型（Chronos / TimeGPT）+ GBDT 集成。
3. 因果推断（Causal Forest / DML）支持决策。
4. AutoML 自动化（AutoGluon / FLAML）。
5. 跨部门预测平台（特征 + 算法 + 评估 + 应用）。

### 6.4 ROI 评估

**直接收益**：

- 预测精度提升（MAPE -10% ~ -30%）。
- 业务损失下降（库存、缺货、过期）。
- 决策质量提升（定价、营销、调度）。

**间接收益**：

- 数据闭环成熟（数据 + 特征 + 模型 + 反馈）。
- 因果决策能力（从预测到决策）。
- AI 基础设施完善（Feature Store / Model Registry / 监控）。

**评估指标**：

- **业务指标**：缺货率 / 库存周转 / 营销 ROI / 客户满意度。
- **技术指标**：MAE / RMSE / R² / MAPE / SMAPE。
- **闭环指标**：预测偏差 / 反馈延迟 / 模型重训周期。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | OLS/Ridge/Lasso | GBDT | 深度学习 | 时序 Transformer | 贝叶斯回归 | 因果 Forest |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| 精度 | 2 | 4 | 5 | 5 | 3 | 4 |
| 训练速度 | 5 | 4 | 2 | 2 | 3 | 3 |
| 推理速度 | 5 | 4 | 3 | 3 | 3 | 4 |
| 可解释性 | 5 | 4 | 1 | 1 | 4 | 4 |
| 处理非线性 | 1 | 4 | 5 | 5 | 2 | 4 |
| 不确定性估计 | 1 | 1 | 1 | 1 | 5 | 3 |
| 因果推断 | 1 | 2 | 2 | 2 | 3 | 5 |
| 时序能力 | 1 | 2 | 3 | 5 | 2 | 1 |
| 大数据可扩展 | 5 | 5 | 4 | 3 | 2 | 3 |
| 工程门槛 | 2 | 2 | 4 | 4 | 4 | 4 |

**结论**：

- **简单场景**：OLS / Ridge / Lasso（可解释 + 快）。
- **表格数据**：GBDT 三件套（精度 + 效率）。
- **时序数据**：Prophet / Transformer（时序专用）。
- **决策支持**：因果 Forest / DML（因果性）。
- **风险敏感**：贝叶斯回归（不确定性）。

### 7.2 决策树

```
[回归任务]
   │
   ├── [数据是时序？]
   │     ├── 是 → §3.2 时序决策表
   │     └── 否 → 继续
   │
   ├── [是否需要因果推断？]
   │     ├── 是 → Causal Forest / DML / T-Learner
   │     └── 否 → 继续
   │
   ├── [是否需要不确定性？]
   │     ├── 是 → Bayesian Regression / Conformal / Quantile
   │     └── 否 → 继续
   │
   ├── [数据规模与特征？]
   │     ├── 低维 + 线性 → OLS / Ridge / Lasso
   │     ├── 表格数据 → GBDT
   │     └── 高维 + 强非线性 → 深度学习
   │
   ├── [是否需要可解释？]
   │     ├── 是 → Ridge / Lasso / GBDT + SHAP
   │     └── 否 → 深度学习
   │
   └── [实时性？]
         ├── 高频 → LR / FM
         └── 普通 → GBDT / 深度学习
```

### 7.3 组合使用

**组合 1：线性 + GBDT（残差学习）**

- 线性回归捕捉趋势，GBDT 拟合残差。
- 优势：精度 + 可解释。
- 适用：销量预测（含趋势 + 非线性）。

**组合 2：Prophet + LightGBM（趋势 + 残差）**

- Prophet 分解趋势 + 季节性，LightGBM 拟合残差。
- 优势：可解释 + 精度。
- 适用：销量、流量。

**组合 3：因果 Forest + 业务决策**

- Causal Forest 估计 CATE，按 CATE 分群决策。
- 优势：因果性 + 决策可解释。
- 适用：营销、政策、风控。

**组合 4：贝叶斯 + GBDT（不确定性 + 精度）**

- GBDT 预测均值，贝叶斯估计不确定性。
- 优势：精度 + 风险评估。
- 适用：风控、库存。

**组合 5：LLM Embedding + LightGBM（语义 + 结构化）**

- LLM 提 embedding + 结构化特征 → LightGBM 回归。
- 优势：融合语义 + 结构化数据。
- 适用：评论评分、商品定价。

**组合 6：时序基础模型 + 微调**

- Chronos / Lag-Llama 零样本预测 + 业务微调。
- 优势：通用 + 业务适配。
- 适用：跨域时序预测。

---

## 8. 面试真题集

> 本节内容待补充。题源待与原 PDF《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）题库对齐。读者可参考本节结构，按"全景视图 → 分主题展开 → 横向小结 → 本章小结"四段式自检。
