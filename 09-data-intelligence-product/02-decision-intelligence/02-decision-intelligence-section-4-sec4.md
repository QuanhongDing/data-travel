> 本文件是 **02-decision-intelligence.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](02-decision-intelligence.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务边界与决策场景识别**

- 圈定决策智能要支撑的业务场景（营销 / 风控 / 运营 / 增长 / 产品）。
- 识别核心决策点（如「是否发放优惠券」「是否放贷」「库存补货量」）。
- 评估决策频率、延迟要求、决策精度。
- 输出：**决策智能规划书（DIP = Decision Intelligence Plan）**。

**Step 2：决策架构设计**

- 设计 4 层决策栈（Sense / Analyze / Decide / Act & Learn）。
- 设计决策引擎架构（规则 + 模型 + Agent）。
- 设计实时 / 离线决策链路。
- 输出：**决策智能架构图**。

**Step 3：决策引擎选型与搭建**

- 选型规则引擎（Drools / Easy Rules / DMN）。
- 选型模型部署平台（Triton / vLLM / 自研）。
- 选型 Agent 框架（LangGraph / AutoGen / 自研）。
- 选型实时计算（Flink / Kafka Streams）。
- 输出：**决策引擎集群**。

**Step 4：特征 / 模型 / 规则接入**

- 接入特征平台（Feast / Tecton / 自研）。
- 接入模型市场 / Model Registry（MLflow / 自研）。
- 接入业务规则（业务方管理 + 工程师实现）。
- 接入知识图谱（GraphRAG / 行业 KG）。
- 输出：**决策能力池**。

**Step 5：决策链路编排**

- 编排决策流（规则 → 模型 → LLM → Agent）。
- 配置决策条件 / 阈值 / 路由策略。
- 配置决策可解释性（XAI / 因果链 / LLM 解释）。
- 输出：**决策流定义（YAML / DSL / 代码）**。

**Step 6：决策执行与反馈**

- 暴露决策 API（gRPC / REST / SDK）。
- 集成业务系统（触达 / 风控 / 营销 / 运营）。
- 建立 A/B 实验框架。
- 建立效果归因 + 决策 ROI。
- 输出：**决策应用 + 反馈闭环**。

**Step 7：决策可观测与治理**

- 部署决策监控（决策 QPS / 转化率 / 异常率）。
- 部署决策血缘（Input → Decision → Output）。
- 部署决策审计（全链路日志）。
- 建立决策 SLA（决策延迟 < X ms、准确率 > Y%、ROI > Z%）。
- 输出：**决策治理体系**。

### 4.2 关键技术点

1. **规则引擎**：Drools（Java 生态首选）、Easy Rules（轻量）、Aviator（Java 表达式）、QLExpress（阿里）、Groovy（脚本化）、Apache Urule（开源国产）。
2. **DMN 标准**：OMG DMN 1.4（2024）、Camunda DMN、Drools DMN、IBM ODM DMN。
3. **ML 模型部署**：Triton（多框架）、TorchServe（PyTorch）、vLLM（LLM）、TensorRT-LLM（NVIDIA 优化）。
4. **实时计算**：Flink + Kafka + Redis / HBase + Flink SQL + Flink CEP。
5. **在线学习**：FTRL（CTR 预估）、FTRL-Proximal、Online Gradient Descent、Contextual Bandit（LinUCB / NeuralUCB）。
6. **强化学习**：RLlib（Ray）、Stable-Baselines3、DeepMind Acme。
7. **因果推断**：EconML（微软）、CausalML（Uber）、DoWhy（微软）、CausalImpact（Google）、Causalinference（Python）。
8. **A/B 实验**：火山引擎 A/B、字节 A/B、阿里 A/B、Optimizely、Eppo、Statsig、AB Tasty。
9. **LLM for Decision**：LangChain、LangGraph、LlamaIndex、OpenAI Function Calling、Anthropic Tool Use。
10. **Agent for Decision**：AutoGen（微软）、CrewAI、LangGraph、MetaGPT、ChatDev、OpenAI Swarm。
11. **可解释 AI**：SHAP、LIME、Integrated Gradients、Anchors、Counterfactual Explanation、Alibi（开源）。
12. **决策可观测**：Arize Phoenix、WhyLabs、Langfuse、Helicone、Evidently AI。
13. **决策治理**：决策版本管理、决策审批、决策审计、决策回滚、决策 SLA。

### 4.3 工具链与平台（含 2024-2025 新工具）

**规则引擎**：

- **Drools**（Red Hat）——Java 生态事实标准，BRMS。
- **Easy Rules**——轻量 Java 规则引擎。
- **Aviator**——Java 表达式求值。
- **QLExpress**（阿里）——国产规则引擎。
- **Groovy**——脚本化规则引擎。
- **Apache Urule**（开源国产）——国产规则引擎 + 决策表。
- **Camunda**（商业 + 开源）——BPM + DMN。
- **IBM Operational Decision Manager (ODM)**——商业 BRMS。

**决策智能平台（2024-2025）**：

- **Diwo**——公司级决策智能平台。
- **Aera Technology**——企业认知决策平台。
- **Tellius**——决策智能 BI 平台。
- **Pecan AI**——预测决策平台。
- **Quantiphi**——决策智能咨询 + 平台。
- **Databricks AI/BI**——决策智能 + BI 一体化平台。
- **DataRobot**——AutoML + 决策平台。
- **Domino Data Lab**——企业 MLOps + 决策平台。
- **SAS Decision Manager**——SAS 决策管理。
- **阿里云决策引擎**——阿里 PAI 决策引擎。
- **字节智能决策**——字节 AI 决策平台。
- **蚂蚁决策大脑**——蚂蚁集团金融决策平台。
- **平安智慧决策**——平安集团决策平台。

**实时计算 / 流处理**：

- **Apache Flink**——实时计算事实标准。
- **Apache Kafka** / **Pulsar**——消息队列。
- **Apache Spark Streaming** / **Structured Streaming**——微批处理。
- **Materialize**——流式 SQL 数据库。
- **RisingWave**——国产流式数据库。

**在线学习 / 强化学习**：

- **Vowpal Wabbit (VW)**——在线学习框架，Yahoo/Microsoft 贡献。
- **RLlib (Ray)**——分布式强化学习。
- **Stable-Baselines3**——RL 算法库。
- **Dieter / Contextual Bandit Library**——Contextual Bandit 实现。

**因果推断**：

- **DoWhy**（微软）——因果推断端到端。
- **EconML**（微软）——机器学习因果效应估计。
- **CausalML**（Uber）——因果 ML 库。
- **CausalImpact**（Google）——贝叶斯因果效应。
- **Ananke**（因果推断）——因果图 + 反事实。

**A/B 实验**：

- **火山引擎 A/B**（字节）——国内 A/B 实验事实标准。
- **Optimizely**——商业 A/B 实验平台。
- **Eppo**——开源 + 商业 A/B 实验。
- **Statsig**——商业 A/B 实验平台。
- **GrowthBook**——开源 A/B 实验平台。
- **AB Tasty**——商业 A/B 实验平台。

**LLM for Decision（2024-2025）**：

- **LangChain** + **LangGraph**——LLM 决策编排。
- **LlamaIndex**——LLM + RAG 决策。
- **AutoGen**（微软）——Multi-Agent 决策。
- **CrewAI**——Multi-Agent 协作。
- **MetaGPT**——Multi-Agent 软件工程。
- **OpenAI Swarm**——轻量 Multi-Agent 框架。
- **Anthropic Claude Tool Use**——Agent 工具调用。

**可解释 AI（XAI）**：

- **SHAP**——事实标准解释库。
- **LIME**——局部可解释模型。
- **Alibi**（开源）——XAI 库。
- **InterpretML**（微软）——可解释 ML 库。
- **Captum**（Meta）——PyTorch 模型解释。
- **What-If Tool**（Google）——交互式模型分析。

### 4.4 代码 / 示例

**示例 1：基于 Drools + DMN 的规则决策（Java）**

```java
// LoanEligibility.dmn
// DMN 决策表：信贷审批
[
  {
    "input": "applicant.creditScore",
    "input": "applicant.income",
    "input": "applicant.loanAmount",
    "output": "eligibility",
    "rule": [
      {"when": "creditScore >= 750 && income >= 100000 && loanAmount <= 500000", "then": "APPROVED"},
      {"when": "creditScore >= 700 && income >= 150000", "then": "APPROVED"},
      {"when": "creditScore >= 650 && income >= 200000", "then": "MANUAL_REVIEW"},
      {"when": "creditScore < 600", "then": "REJECTED"},
      {"otherwise": "MANUAL_REVIEW"}
    ]
  }
]

// Java 调用
KieContainer kieContainer = KieServices.Factory.get().newKieClasspathContainer();
KieSession kieSession = kieContainer.newKieSession();

Applicant applicant = new Applicant("Alice", 720, 120000, 300000);
kieSession.insert(applicant);
kieSession.fireAllRules();

assertEquals("APPROVED", applicant.getEligibility());
```

**示例 2：基于 Easy Rules 的轻量规则（Java）**

```java
// 定义规则
@Rule(name = "high-value-customer-discount")
public class HighValueCustomerDiscountRule {
    @Condition
    public boolean when(@Fact("customer") Customer customer) {
        return customer.getTotalSpent() > 10000;
    }

    @Action
    public void then(@Fact("order") Order order) {
        order.applyDiscount(0.15); // 15% 折扣
    }
}

// 引擎组装
RulesEngine rulesEngine = new DefaultRulesEngine();
rulesEngine.registerRule(new HighValueCustomerDiscountRule());

Facts facts = new Facts();
facts.put("customer", new Customer("Alice", 15000));
facts.put("order", new Order(1000));

rulesEngine.fire(facts);
```

**示例 3：基于 SHAP 的 ML 决策解释（Python）**

```python
import shap
import xgboost
from sklearn.datasets import make_classification

# 训练模型
X, y = make_classification(n_samples=10000, n_features=20, random_state=42)
model = xgboost.XGBClassifier().fit(X, y)

# SHAP 解释
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

# 单个决策解释
sample_idx = 0
print(f"Prediction: {model.predict_proba(X[sample_idx:sample_idx+1])[0][1]:.3f}")
print(f"Base value: {explainer.expected_value:.3f}")
print(f"Feature contributions:")
feature_names = [f"feature_{i}" for i in range(X.shape[1])]
for name, value, shap_val in zip(feature_names, X[sample_idx], shap_values[sample_idx]):
    print(f"  {name}: {value:.3f} → SHAP={shap_val:+.3f}")

# 可视化
shap.plots.waterfall(shap_values[sample_idx])
shap.plots.force(shap_values[sample_idx])
```

**示例 4：基于 Contextual Bandit 的在线学习决策（Python + Vowpal Wabbit）**

```python
from vowpalwabbit import pyvw

# 初始化 Contextual Bandit
vw = pyvw.vw("--cb_explore_adf --epsilon 0.1 --power_t 0.5")

# 用户特征 → 多臂（不同优惠券）
def get_context_features(user, arms):
    features = []
    for arm in arms:
        # 每个 arm 的特征：用户画像 + 优惠券类型
        feat = "|u user_age user_spend user_segment |a coupon_type coupon_value coupon_min_order"
        features.append(feat)
    return features

def get_cost_reward(arm, user):
    # 实际场景：根据用户反馈计算成本 / 奖励
    # 转化 = 奖励 +1，未转化 = 成本 0
    if user.clicked and user.converted(arm):
        return 1.0
    else:
        return 0.0

# 实时决策循环
arms = ["10_off", "20_off", "30_off", "free_shipping", "no_coupon"]
for user in user_stream:
    context = get_context_features(user, arms)
    
    # VW 决策（探索 + 利用）
    chosen_arm_idx = vw.predict(context)
    chosen_arm = arms[chosen_arm_idx]
    
    # 执行决策并获得反馈
    reward = get_cost_reward(chosen_arm, user)
    
    # VW 学习
    example = f"{1.0 - reward} {chosen_arm_idx + 1} | " + " ".join(context)
    vw.learn(example)
```

**示例 5：基于 LangGraph 的 LLM 决策流（Python）**

```python
from langgraph.graph import StateGraph, END
from langchain.chat_models import ChatOpenAI
from typing import TypedDict, Literal

# 决策状态
class DecisionState(TypedDict):
    user_query: str
    intent: str
    risk_score: float
    rule_result: str
    llm_reasoning: str
    final_decision: str

# 节点 1：意图识别
def identify_intent(state: DecisionState) -> DecisionState:
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    response = llm.invoke(f"识别以下用户查询的意图：{state['user_query']}")
    state['intent'] = response.content
    return state

# 节点 2：规则匹配
def match_rules(state: DecisionState) -> DecisionState:
    # 调用规则引擎（Drools / Easy Rules）
    state['rule_result'] = "RULE_MATCH: 高风险用户"
    return state

# 节点 3：ML 模型预测
def predict_risk(state: DecisionState) -> DecisionState:
    # 调用 ML 模型（XGBoost 风控模型）
    state['risk_score'] = 0.85
    return state

# 节点 4：LLM 决策推理
def llm_decision(state: DecisionState) -> DecisionState:
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    prompt = f"""
    用户查询：{state['user_query']}
    意图：{state['intent']}
    规则结果：{state['rule_result']}
    风险评分：{state['risk_score']}
    
    请基于以上信息给出最终决策：
    1. 决策结果（APPROVE / REJECT / MANUAL_REVIEW）
    2. 决策理由（50 字以内）
    3. 建议跟进措施
    """
    response = llm.invoke(prompt)
    state['llm_reasoning'] = response.content
    return state

# 决策图编排
workflow = StateGraph(DecisionState)
workflow.add_node("identify_intent", identify_intent)
workflow.add_node("match_rules", match_rules)
workflow.add_node("predict_risk", predict_risk)
workflow.add_node("llm_decision", llm_decision)

workflow.set_entry_point("identify_intent")
workflow.add_edge("identify_intent", "match_rules")
workflow.add_edge("match_rules", "predict_risk")
workflow.add_edge("predict_risk", "llm_decision")
workflow.add_edge("llm_decision", END)

app = workflow.compile()
result = app.invoke({"user_query": "用户申请信用卡"})
print(result['llm_reasoning'])
```

**示例 6：基于 EconML 的因果决策（Python）**

```python
from econml.dml import LinearDML
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
import numpy as np

# 模拟数据：营销活动对用户转化的因果效应
np.random.seed(42)
n = 10000
X = np.random.randn(n, 10)  # 用户特征
T = np.random.binomial(1, 0.5, n)  # 处理（是否发优惠券）
Y = 0.3 * T + 0.5 * X[:, 0] - 0.2 * X[:, 1] + np.random.randn(n) * 0.5  # 转化

# 训练 DML 模型
dml = LinearDML(
    model_y=GradientBoostingRegressor(),
    model_t=GradientBoostingClassifier(),
    random_state=42,
)
dml.fit(Y, T, X=X)

# 因果效应估计
treatment_effect = dml.effect(X)
print(f"Average Treatment Effect: {dml.ate_inference().mean_point:.3f}")
print(f"95% CI: {dml.ate_inference().conf_int_mean}")

# 异质因果效应（不同用户群体不同效应）
for i in range(min(5, len(X))):
    print(f"User {i}: ATE = {treatment_effect[i]:.3f}")
```

---
