> 本文件是 **07-eval.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](07-eval.md)。

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
