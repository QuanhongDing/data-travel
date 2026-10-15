> 本文件是 **04-regression.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](04-regression.md)。

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
