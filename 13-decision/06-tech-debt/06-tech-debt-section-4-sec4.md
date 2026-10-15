> 本文件是 **06-tech-debt.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](06-tech-debt.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：建立技术债 Backlog**

- 用 Jira / GitHub Issue 建立技术债 Backlog。
- 模板：标题、优先级、本金、利息、Owner、还债计划。
- 强制录入：新功能上线必须评估技术债增量。

**Step 2：定期盘点**

- 每月盘点：新增 / 偿还 / 总技术债。
- 季度评审：Top 10 技术债 + 还债计划。
- 半年回顾：技术债战略对齐。

**Step 3：可视化（Tech Debt Map）**

- 用工具（SonarQube Dashboard、Grafana）画 Tech Debt Map。
- 按模块 / 类型 / 优先级分布。
- 同步给业务方（翻译成业务成本）。

**Step 4：还债优先级**

- 用 ROI（利息 - 本金）排序。
- 高利息 + 低本金 → 优先还债。
- 低利息 + 高本金 → 推迟或重写。

**Step 5：还债节奏**

- 每季度 1 个 Tech Debt Sprint（10-20% 团队容量）。
- 或每周固定 1-2 天还债时间。
- 高优先级技术债在常规 Sprint 中穿插。

**Step 6：Code Quality Gates**

- CI 强制门禁（覆盖率 / 复杂度 / 重复率 / SonarQube Ratio）。
- PR 合并前必须通过门禁。
- 监控趋势，告警恶化。

**Step 7：业务沟通**

- 把技术债翻译成业务成本（年利息）。
- 季度汇报：技术债 + 还债进度。
- 战略对齐：技术债预算 / 偿还计划。

**Step 8：长期治理**

- Tech Debt Budget（组织级）。
- 战略级技术债（如遗留系统重写）写入技术战略。
- AI Tech Debt 治理。

### 4.2 关键技术点

1. **SonarQube / SonarCloud**——代码质量 + 技术债度量。
2. **CodeClimate**——代码质量平台。
3. **CAST Highlight / CAST Imaging**——技术债企业级度量。
4. **Stepsize**——技术债 Backlog 平台（2024）。
5. **Snyk Code / Semgrep**——代码安全 + 质量。
6. **GitHub Code Quality API / GitLab Code Quality**——代码质量门禁。
7. **Refactoring Patterns**——Martin Fowler 重构模式。
8. **AI 辅助识别**——LLM 识别代码 / 架构技术债。
9. **AI Tech Debt 检测**：WhyLabs / Arize（Model Drift）、LangSmith（Agent Trace）。
10. **Tech Debt Dashboard**——Grafana + 自建指标。

### 4.3 工具链与平台

**代码质量 / 技术债度量**：

- **SonarQube / SonarCloud**——行业标准。
- **CodeClimate**——SaaS 代码质量。
- **CAST Highlight**——企业级技术债。
- **Stepsize**——技术债 Backlog（2024 新工具）。
- **Snyk Code**——代码安全 + 质量。
- **DeepSource**——自动化代码审查。

**代码分析**：

- **GitHub CodeQL**——代码查询。
- **GitLab Code Quality**——内置质量门禁。
- **Semgrep**——静态分析。
- **Codacy**——代码质量自动化。

**AI Tech Debt 治理**：

- **WhyLabs / Arize AI**——Model Drift 监控。
- **LangSmith / LangChain**——Agent Trace。
- **Weights & Biases**——ML 实验跟踪。
- **MLflow**——Model Registry。
- **PromptLayer / Helicone**——Prompt 版本管理。

**重构 / 渐进迁移**：

- **Martin Fowler《Refactoring》**——经典方法。
- **Sam Newman《Building Microservices》**——Strangler Fig。
- **GitHub Copilot / Cursor**——AI 辅助重构。

**可视化 / 仪表盘**：

- **Grafana**——自定义技术债 Dashboard。
- **SonarQube Dashboard**——技术债可视化。
- **Stepsize Dashboard**——技术债 Backlog 可视化。

### 4.4 代码 / 示例

**示例 1：技术债 Backlog**

```yaml
- id: DEBT-001
  title: 核心订单服务缺少单元测试
  priority: 高
  principal: 80 人时（约 40 万）
  interest_per_year: 100 万（每改一处需 1 人天排查）
  owner: @张三
  repayment_plan: Q3 完成 80% 覆盖率
  status: 进行中

- id: DEBT-002
  title: 订单系统单库单表，无分库分表
  priority: 极高
  principal: 200 人时（约 100 万）
  interest_per_year: 业务瓶颈 + 大促风险 500 万
  owner: @李四
  repayment_plan: Q4 完成 ShardingSphere 接入
  status: 待开始

- id: DEBT-003
  title: AI Prompt 硬编码在代码中
  priority: 中
  principal: 20 人时（约 10 万）
  interest_per_year: 50 万（Prompt 维护成本 + 模型切换成本）
  owner: @王五
  repayment_plan: Q3 接入 PromptLayer / 自建 Prompt Registry
  status: 待开始
```

**示例 2：Tech Debt Map**

| 模块 | 技术债 / 千行 | 本金 | 利息 / 年 | 优先级 |
| --- | --- | --- | --- | --- |
| 订单系统 | 35 | 80 万 | 200 万 | 极高 |
| 用户系统 | 18 | 40 万 | 80 万 | 中 |
| 营销系统 | 50 | 120 万 | 300 万 | 高 |
| AI 平台 | 25 | 60 万 | 150 万 | 中 |
| 数据湖 | 15 | 30 万 | 60 万 | 低 |

**示例 3：Code Quality Gates（GitHub Actions）**

```yaml
name: Code Quality Gate
on: [pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@v2
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

      - name: Quality Gate
        uses: sonarsource/sonarqube-quality-gate-action@v2
        # 失败条件：
        # - Tech Debt Ratio > 10%
        # - Coverage < 80%
        # - Duplications > 5%
        # - Cyclomatic Complexity > 15
```

**示例 4：技术债 ROI 计算**

| 技术债 | 本金 | 利息 / 年 | 偿还成本 / 年 | 净收益 / 年 | ROI |
| --- | --- | --- | --- | --- | --- |
| DEBT-001 | 40 万 | 100 万 | 50 万 | 50 万 | 100% |
| DEBT-002 | 100 万 | 500 万 | 200 万 | 300 万 | 150% |
| DEBT-003 | 10 万 | 50 万 | 15 万 | 35 万 | 233% |

→ DEBT-003 ROI 最高，优先偿还。

**示例 5：Strangler Fig Pattern（绞杀者模式）**

```
旧单体应用（订单系统）
       │
       └── [API Gateway / 路由层]
                │
                ├── /order/query  → 旧系统（暂留）
                ├── /order/create → 新系统（已迁移）
                ├── /order/pay    → 新系统（已迁移）
                └── /order/cancel → 旧系统（暂留）
                       │
                       └── 逐步迁移：每次迁移 1 个接口
```

**示例 6：AI Tech Debt 检测（Python）**

```python
from langsmith import Client
import os

client = Client(api_key=os.environ["LANGSMITH_API_KEY"])

def detect_ai_tech_debt(project_name: str) -> dict:
    """检测 AI 智能体应用的技术债。"""
    runs = client.list_runs(project_name=project_name, limit=1000)
    
    debts = {
        "prompt_hardcoded": [],
        "model_drift": [],
        "agent_no_trace": [],
        "evaluation_missing": [],
    }
    
    for run in runs:
        # 1. Prompt 硬编码
        if "prompt_version" not in run.metadata:
            debts["prompt_hardcoded"].append(run.id)
        
        # 2. Model Drift
        if "model_version" not in run.metadata:
            debts["model_drift"].append(run.id)
        
        # 3. Agent Trace
        if run.run_type == "agent" and not run.metadata.get("trace_id"):
            debts["agent_no_trace"].append(run.id)
        
        # 4. 评估缺失
        if not run.metadata.get("evaluation_result"):
            debts["evaluation_missing"].append(run.id)
    
    return {
        "prompt_hardcoded_count": len(debts["prompt_hardcoded"]),
        "model_drift_count": len(debts["model_drift"]),
        "agent_no_trace_count": len(debts["agent_no_trace"]),
        "evaluation_missing_count": len(debts["evaluation_missing"]),
        "total_ai_tech_debt": sum(len(v) for v in debts.values()),
    }

# 使用
debts = detect_ai_tech_debt("ai-agent-platform-prod")
print(debts)
```

**示例 7：Tech Debt Burndown**

```
技术债 / 万
│
│  ● 1500
│  │
│  │     ●● 1200
│  │        │
│  │        │    ●●● 900
│  │        │       │
│  │        │       │    ●●●● 600
│  │        │       │       │
│  │        │       │       │     ●●●●● 300
│  │        │       │       │        │
└──┴────────┴───────┴───────┴────────┴─── 时间
     Q1     Q2       Q3      Q4      Q5
   （技术债目标：每季度减少 300 万）
```

---
