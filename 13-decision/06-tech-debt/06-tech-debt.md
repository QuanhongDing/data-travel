# 技术债管理（Tech Debt Management）

> **一句话定位**：识别 + 量化 + 优先级 + 还债节奏——管理技术债而非被技术债管理。

> 本文是 data-travel 项目 [Ch13 · 决策与权衡](../../README.md) 的子章节（**06 技术债**）。覆盖 R6 工程能力（决策维度）中「**技术债识别 / 量化 / 优先级 / 偿还**」相关的理论、模式、工程实践与 AI 时代演进。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 什么是技术债？为什么要管理？ | §1 |
| 技术债怎么识别和分类？ | §2.1 / §3 |
| 技术债如何量化？ | §2.2 |
| 还债节奏怎么定？ | §4.3 |
| 怎么向业务方解释技术债？ | §6.2 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：技术债（Technical Debt）由 Ward Cunningham 于 1992 年首次提出，用金融债务的隐喻描述「为获得短期收益而做出的次优技术决策所产生的长期成本」。Martin Fowler 2004 年扩展该概念，提出「技术债象限」（Deliberate / Inadvertent × Reckless / Prudent），将技术债系统化为工程管理问题。

**工程定义**：在数据架构师手里，技术债是「**代码 / 架构 / 数据中所有『用未来的成本换今天的收益』的选择**」，包含五种形态：

| 形态 | 描述 | 典型例子 |
| --- | --- | --- |
| 代码债 | 代码质量问题 | 硬编码、缺少测试、重复代码 |
| 架构债 | 架构设计问题 | 单点、过度耦合、缺抽象 |
| 数据债 | 数据质量问题 | 无主数据、无 schema、无血缘 |
| 基础设施债 | 运维 / 部署问题 | 手工部署、监控缺失、文档缺失 |
| AI 债 | 模型 / 智能体问题 | Prompt 硬编码、无评估、无监控 |

### 1.2 为什么需要

**业务 / 工程痛点**：

- **「改一个 Bug 引发 3 个 Bug」**——技术债到达临界点，开发效率指数下降。
- **「新人看不懂代码」**——文档 / 注释缺失，技术债组织传递风险。
- **「每次升级都像赌博」**——缺乏测试，技术债成为业务连续性风险。
- **「重构无从下手」**——不知道技术债在哪里、多严重。
- **「业务方不理解为什么要还债」**——技术债沟通失败，老板看不到价值。
- **「无限拖延」**——「等有时间就还」，结果永远没时间。

**为什么是「资深架构师」核心能力**：

- P5/P6：写代码——关注「代码正确」。
- P7：模块——关注「模块设计合理」。
- P8：系统——关注「系统稳定」。
- **资深架构师 / 准资深架构师：关注「系统稳定 + 业务连续 + 长期成本」——这是技术债管理的本质**。

### 1.3 在 AI 时代数据架构中的位置

```
       ┌─────── Ch13 · 决策与权衡 ───────┐
       │                                  │
       │  ADR(01) ←── 技术债(06)          │
       │   ↓           ↓                  │
       │ 自研(03) ←─ 技术债(06)           │
       │   ↓           ↓                  │
       │ 战略(05) ←── 技术债(06)          │
       │                                  │
       └──────────────────────────────────┘
                       ↓
            技术债是「决策的长期成本」
```

**与其他子主题的关系**：

- **ADR（01）**：技术债的「产生」和「偿还」都是 ADR 的 Consequences。
- **自研 vs 采购（03）**：伪自研 = 技术债来源。
- **技术战略（05）**：技术债预算 + 偿还节奏是技术战略的一部分。
- **架构评审（07）**：评审发现的技术问题 = 技术债的入口。
- **决策心理学（08）**：沉没成本谬误让技术债无限拖延。

**一句话判断**：**「看不见技术债的是 P7，看见但不管的是 P8，主动管理技术债的是资深架构师」**。

### 1.4 演进历程

- **1992**：Ward Cunningham 提出 Technical Debt 概念（OOPSLA 大会）。
- **2004**：Martin Fowler 提出 Technical Debt Quadrant（刻意 vs 无意 × 鲁莽 vs 谨慎）。
- **2009**：Steve McConnell《Managing Technical Debt》系统化。
- **2012**：Philippe Kruchten / Robert Nord / Ipek Ozkaya 提出技术债管理框架。
- **2014**：Cutter Consortium / CAST / SonarQube 等工具推动技术债度量。
- **2018**：Stripe 报告指出开发者 33% 时间在处理技术债。
- **2020-2024**：AI / ML 时代出现新形态——AI 债（模型 / Prompt / Agent 技术债）。
- **2024-2025**：AI 辅助技术债识别（SonarQube AI、Snyk Code AI）+ 技术债 + LLM。

---

## 2. 核心原理

### 2.1 关键概念定义

- **Technical Debt（技术债）**：用金融债务隐喻技术决策的长期成本。
- **Technical Debt Quadrant（技术债象限）**：Martin Fowler 四象限。
- **Debt Principal（债务本金）**：当下技术问题的「一次性偿还成本」。
- **Debt Interest（债务利息）**：持续付出的维护 / 修复成本。
- **Deliberate Tech Debt（刻意技术债）**：知情下产生的技术债（如 MVP 妥协）。
- **Inadvertent Tech Debt（无意技术债）**：不知情下产生的技术债（如当时不知道更好方案）。
- **Reckless Tech Debt（鲁莽技术债）**：明知故犯（如「没时间测试」）。
- **Prudent Tech Debt（谨慎技术债）**：知情权衡（如 MVP 妥协 + 还债计划）。
- **Tech Debt Backlog（技术债 Backlog）**：所有技术债的列表。
- **Tech Debt Map（技术债地图）**：可视化技术债分布（按模块 / 类型）。
- **Tech Debt Quantification（技术债量化）**：用成本 / 时间度量技术债。
- **Tech Debt Budget（技术债预算）**：组织允许的技术债「总额」。
- **Tech Debt Sprint（技术债 Sprint）**：专门还债的 Sprint。
- **Tech Debt Ratio（技术债比率）**：还债成本 / 重写成本（SonarQube 指标）。
- **Code Churn（代码变更率）**：代码变更频繁度——技术债的代理指标。
- **Cyclomatic Complexity（圈复杂度）**：代码复杂度——技术债的代理指标。
- **Coverage（覆盖率）**：测试覆盖率——技术债的代理指标。
- **Duplication（重复率）**：代码重复率——技术债的代理指标。
- **SQALE（Software Quality Assessment based on Lifecycle Expectations）**：技术债量化方法。
- **AI Tech Debt**：AI / LLM 应用特有的技术债（Prompt 硬编码、模型无评估、Agent 无监控）。
- **Data Debt（数据债）**：数据质量 / 元数据 / 血缘缺失的技术债。
- **Tech Debt Burndown（技术债燃烧图）**：类似 Sprint Burndown，展示技术债随时间减少。
- **Refactoring（重构）**：不改变外部行为的前提下改善代码——还债的核心手段。

### 2.2 数学 / 形式化基础

**技术债量化（SQALE 方法）**：

```
Technical Debt = Σ (Remediation Cost_i × Weight_i)
其中：
- Remediation Cost_i = 修复第 i 类技术问题的人时 / 钱时
- Weight_i = 第 i 类技术问题的严重性权重
```

**技术债比率（SonarQube）**：

```
Tech Debt Ratio = Tech Debt / Development Cost
其中 Development Cost = 代码行数 × 行业基准开发成本
```

→ 行业基准 < 5%（优秀）；5-10%（良好）；10-20%（一般）；> 20%（糟糕）。

**技术债利息（年度）**：

```
Annual Interest = Tech Debt × Interest Rate
其中 Interest Rate ≈ 25%（业界经验值）
```

→ 1000 万技术债 → 每年 250 万利息（开发效率损失）。

**技术债 ROI（还债决策）**：

```
Payback = Debt Principal / Annual Interest Saving
ROI = (Annual Interest Saving - Annual Payback Cost) / Annual Payback Cost
```

### 2.3 关键算法 / 方法

1. **SQALE**——标准化量化方法。
2. **Technical Debt Quadrant**——Martin Fowler 分类。
3. **Tech Debt Backlog**——产品 Backlog 风格的债单。
4. **Tech Debt Sprint**——专门还债。
5. **Tech Debt Budget**——组织级预算。
6. **Tech Debt Map**——可视化分布。
7. **Tech Debt Burndown**——燃烧图。
8. **Code Quality Gates**——代码质量门禁。
9. **Refactoring Patterns**——重构模式（Martin Fowler《Refactoring》）。
10. **Strangler Fig Pattern**——绞杀者模式（用新系统逐步替代旧系统）。
11. **Branch by Abstraction**——抽象分支（重构渐进路径）。
12. **AI 辅助识别**——LLM 识别代码 / 架构技术债。
13. **AI Tech Debt 检测**——Prompt 漂移 / 模型漂移检测。

### 2.4 与相邻概念的关系

- **技术债 vs 设计缺陷**：技术债是「知情 / 无知权衡」，设计缺陷是「不知情的错误」。
- **技术债 vs Bug**：Bug 是「已知的错误」，技术债是「选择的不完美」。
- **技术债 vs 技术风险**：技术债是「已存的现状」，技术风险是「未来的不确定性」（详见 §04）。
- **技术债 vs 架构腐化**：架构腐化是技术债在架构层的体现。
- **技术债 vs AI 债**：AI 债是技术债在 AI 层的特例。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Martin Fowler 技术债象限**

| | Deliberate（刻意） | Inadvertent（无意） |
| --- | --- | --- |
| **Prudent（谨慎）** | "我们现在 MVP，后续偿还" + 有还债计划 | "我们当时不知道更好方案" |
| **Reckless（鲁莽）** | "没时间设计，先写代码" + 无还债计划 | "什么是技术债？" |

- **Deliberate + Prudent**：知情权衡 → 可管理。
- **Deliberate + Reckless**：明知故犯 → 必须治理。
- **Inadvertent + Prudent**：事后学习 → 通过复盘减少。
- **Inadvertent + Reckless**：能力不足 → 通过培训减少。

**模式 2：技术债 Backlog（产品 Backlog 风格）**

```
- DEBT-001：核心服务缺少单元测试（覆盖率 30%）— 高优先级
- DEBT-002：订单系统单库单表，无分库分表 — 中优先级
- DEBT-003：监控缺失，关键路径无告警 — 高优先级
- DEBT-004：文档缺失，新人上手需 1 个月 — 中优先级
- DEBT-005：AI Prompt 硬编码在代码中 — 中优先级
```

每条含：ID、描述、优先级、本金、利息、Owner、还债计划。

**模式 3：技术债地图（Tech Debt Map）**

可视化技术债分布：

| 模块 | 技术债 / 千行 | 利息 / 年 | 优先级 |
| --- | --- | --- | --- |
| 订单系统 | 30 | 200 万 | 高 |
| 用户系统 | 15 | 80 万 | 中 |
| 营销系统 | 50 | 300 万 | 极高 |

**模式 4：技术债预算（Tech Debt Budget）**

组织允许的技术债「总额」（如 1500 万 / 团队 / 年）。

- 新功能上线必须评估技术债增量。
- 超过预算必须先还债再上功能。

**模式 5：技术债 Sprint（还债 Sprint）**

每季度 1 个 Sprint 专门还债（10-20% 团队容量）。

- Sprint 内容：从 Backlog 选高优先级债单。
- 效果：可度量、可追溯。

**模式 6：Strangler Fig Pattern（绞杀者模式）**

渐进重构：用新系统逐步替代旧系统。

```
旧系统 ──→ [路由层] ──→ 新系统
              │
              └── 逐步迁移
```

适用：大型遗留系统重构（如单机 → 微服务）。

**模式 7：Branch by Abstraction（抽象分支）**

```
旧实现 ──→ [抽象层] ──→ 新实现
              │
              └── 逐步切换
```

适用：核心组件重构（如 ORM 切换）。

**模式 8：Code Quality Gates（质量门禁）**

CI / CD 中加入质量门禁：
- 覆盖率 < 80% → 禁止合并。
- SonarQube Tech Debt Ratio > 10% → 禁止合并。
- 圈复杂度 > 15 → 禁止合并。
- 代码重复率 > 5% → 禁止合并。

**模式 9：AI Tech Debt 治理**

AI 应用特有技术债：

| AI 债 | 检测 | 治理 |
| --- | --- | --- |
| Prompt 硬编码 | 代码扫描 | Prompt Registry |
| 模型无版本 | ML Metadata | Model Registry |
| 模型无监控 | Drift 检测 | Model Monitoring |
| 模型无评估 | 评估缺失 | Eval Pipeline |
| Agent 无审计 | 日志缺失 | Agent Trace |
| 数据漂移 | 漂移检测 | Data Drift Monitor |

**模式 10：Tech Debt Burndown（燃烧图）**

类似 Sprint Burndown，展示技术债随时间减少：

```
技术债 / 万
│
│ ●
│   ●●
│       ●●●
│            ●●●●
│                 ●●●●●
└───────────────────────── 时间
       Q1     Q2     Q3
```

### 3.2 适用场景决策表

| 场景 | 推荐方法 | 理由 |
| --- | --- | --- |
| 技术债识别 | Tech Debt Map + AI 辅助 | 可视化 + 自动化 |
| 技术债量化 | SQALE + SonarQube | 标准化 |
| 偿债优先级 | Tech Debt Backlog + ROI | 可治理 |
| 还债节奏 | Tech Debt Sprint + Budget | 可持续 |
| 遗留系统重构 | Strangler Fig + Branch by Abstraction | 渐进 |
| AI 应用 | AI Tech Debt 治理 | AI 特有 |
| 高质量门禁 | Code Quality Gates | 自动化 |

### 3.3 反模式与陷阱

1. **「看不见技术债」**：只关注功能，忽视质量。**Tech Debt Map + 定期盘点**。
2. **「无限拖延」**：「等有时间就还」，结果永远没时间。**强制 Tech Debt Sprint**。
3. **「过度还债」**：把所有时间都用于还债，业务停滞。**Tech Debt Budget + 优先级**。
4. **「不知情技术债」**：没有 Tech Debt Backlog。**强制录入**。
5. **「业务方不理解」**：技术债沟通失败。**翻译成业务成本（利息）**。
6. **「沉没成本陷阱」**：旧代码不值得还债，但坚持还债。**评估还债 ROI**。
7. **「AI 债忽视」**：AI 应用特有的技术债被忽视。**AI Tech Debt 治理**。
8. **「不量化」**：所有技术债都「高 / 中 / 低」，无法排序。**强制 SQALE 量化**。
9. **「无 Owner」**：技术债列出但无人负责。**每条必须有 Owner**。

---

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

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

- **AI 辅助识别技术债**：LLM 自动识别代码 / 架构 / 数据 / AI 债。
- **AI Tech Debt 标准化**：AI 债的分类、量化、治理标准化。
- **AI Code Review**：自动 PR Review（GitHub Copilot / Cursor）。
- **AI 重构助手**：LLM 辅助重构（识别坏味道 + 自动重构）。
- **Prompt Registry**：Prompt 版本管理成为基础设施。
- **Model Registry**：模型版本管理标准化。
- **Agent Observability**：Agent Trace / Debug / Monitor 成为标准。
- **AI Debt-as-Code**：AI 债自动检测 + 告警。
- **Tech Debt Graph**：技术债图谱，跨模块推理。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

- **Tech Debt + RAG**：技术债沟通时 RAG 检索历史案例 + 类似债单。
- **Tech Debt + 向量库**：所有技术债文档向量化，相似债单检索。
- **Tech Debt + KG**：技术债 + 模块 + Owner + 影响范围建成 KG——可推理「某模块的所有技术债 + 影响」。
- **Tech Debt + GraphRAG**：跨模块技术债级联推理。

### 5.3 学术与工业最新进展（2024-2025）

- **2024**：Stepsize 等技术债 Backlog 平台兴起。
- **2024**：SonarQube AI CodeFix 自动修复技术债。
- **2024**：GitHub Copilot 自动识别代码 smell。
- **2024**：AI Tech Debt 成为 IEEE / ACM 研究热点。
- **2025**：Anthropic / OpenAI / Google 发布 AI Agent 可观测性标准。
- **2025**：AI 债治理纳入 AI RMF（NIST）。

### 5.4 未来 3-5 年趋势

- **AI 自动还债**：LLM 自动识别 + 重构 + 测试。
- **AI Tech Debt 标准化**：分类、量化、治理标准化。
- **Tech Debt Graph**：组织级技术债图谱。
- **Code Quality Gates AI 化**：AI 自动评审 + 修复。
- **AI Constitutional Debt**：AI 应用合规债成为治理重点。
- **可持续性技术债**：碳排放 / ESG 技术债治理。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：Stripe 技术债报告（2018）**

Stripe 2018 年发布开发者体验报告，指出开发者 33% 时间在处理技术债。报告推动了整个行业对技术债的关注。

**案例 2：Amazon 的「Working Backwards + Tech Debt」**

Amazon 在每个项目 Pre-Mortem 中识别技术债：

- 决策时同步评估技术债增量；
- 技术债预算（每 Sprint 20% 容量用于还债）；
- 季度技术债 Review。

**案例 3：Google 的「Code Health」指标**

Google 内部 Code Health 指标：

- 覆盖率 / 复杂度 / 重复率 / 测试稳定性。
- 团队级 Code Health 评分；
- 与绩效挂钩。

**案例 4：阿里巴巴的 521 架构治理（双 11）**

阿里在双 11 大促前的技术债治理：

- 大促前 3 个月：技术债清零（核心路径）。
- 大促中：禁止合并技术债。
- 大促后：还债 + 复盘。

**案例 5：Netflix 的「自由与责任」文化**

Netflix 文化中：

- 团队自主决定技术债优先级；
- 通过 Performance Review 倒逼还债；
- 高绩效团队技术债健康。

### 6.2 踩坑与经验

1. **「看不见技术债」**：只关注功能，忽视质量。**Tech Debt Map + 定期盘点**。
2. **「无限拖延」**：「等有时间就还」。**强制 Tech Debt Sprint**。
3. **「过度还债」**：业务停滞。**Tech Debt Budget + 优先级**。
4. **「业务方不理解」**：沟通失败。**翻译成业务成本（利息）**。
5. **「沉没成本陷阱」**：旧代码不值得还债但坚持。**评估还债 ROI**。
6. **「AI 债忽视」**：AI 应用特有技术债。**AI Tech Debt 治理**。
7. **「不量化」**：无法优先级。**强制 SQALE**。
8. **「无 Owner」**：技术债列了但没人负责。**每条必须有 Owner**。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（10 人以下团队）**：

- Tech Debt Backlog（Jira / GitHub Issue）；
- SonarQube 入门；
- Code Quality Gates 入门；
- 每季度 1 个 Tech Debt Sprint。

**1→10（10-50 人）**：

- Tech Debt Map 可视化；
- SQALE 量化；
- Tech Debt Budget（团队级）；
- Tech Debt Review 季度会议；
- AI 辅助识别。

**10→100（50+ 人）**：

- 组织级 Tech Debt 战略；
- Tech Debt Graph；
- AI Tech Debt 治理；
- Tech Debt 绩效挂钩；
- AI 自动还债（LLM 辅助重构）。

### 6.4 ROI 评估

**直接收益**：

- 开发效率提升：30-50%；
- 故障率下降：40-60%；
- 新人上手时间缩短：50%；
- 业务连续性提升（大促零故障）。

**间接收益**：

- 团队士气提升；
- 招聘卖点；
- 技术品牌；
- 战略自主性。

**成本**：

- 工具成本：低（SonarQube 社区版免费）；
- 时间成本：每季度 10-20% 容量；
- 培训成本：内部 Workshop。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 不管理 | Tech Debt Map | SQALE | Strangler Fig | AI 辅助 |
| --- | --- | --- | --- | --- | --- |
| 识别能力 | 1 | 4 | 4 | 2 | **5** |
| 量化程度 | 1 | 3 | **5** | 2 | 4 |
| 重构风险 | 1 | 2 | 2 | **5** | 3 |
| 团队接受度 | **5** | 3 | 3 | 3 | 4 |
| 适用规模 | 任意 | 小中 | 中 | 大 | 任意 |
| AI 友好度 | 1 | 2 | 3 | 2 | **5** |

### 7.2 决策树

```
你需要治理技术债
        │
        ├── 是遗留系统重构？
        │       │
        │       ├── 大型遗留 → Strangler Fig / Branch by Abstraction
        │       └── 小型遗留 → 直接重构
        │
        ├── 需要还债优先级？
        │       │
        │       └── → SQALE + Tech Debt Map + ROI
        │
        ├── 需要持续治理？
        │       │
        │       └── → Tech Debt Backlog + Sprint + Quality Gates
        │
        ├── 是 AI 应用？
        │       │
        │       └── → AI Tech Debt 治理（Prompt / Model / Agent）
        │
        └── 想用 AI 加速？
                └── → LLM 识别 + LLM 重构 + AI Code Review
```

### 7.3 组合使用

- **Tech Debt Backlog + SQALE**：列表 + 量化。
- **Tech Debt Map + Quality Gates**：可视化 + 自动化。
- **Strangler Fig + Branch by Abstraction**：渐进重构。
- **AI 辅助 + 人类 Reviewer**：LLM 加速 + 工程师把关。
- **Tech Debt + AI 治理**：传统债 + AI 债统一管理。

---

# tech-debt 面试真题集

> **一句话定位**：识别、量化、优先级、还债节奏。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 1 个原 PDF 子章节、共 5 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §19.4 | ⼤规模集群的资源管理与性能优化 | 19.4.1, 19.4.2, 19.4.3, 19.4.4, 19.4.5 | 5 | 主 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §19 未来3-5年技术路线图制定与团队能⼒建设 > 本主题涵盖 1 个子节、5 道题。

#### 2.1.4 ⼤规模集群的资源管理与性能优化

> 来源：原 PDF §19.4，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §19.4.1 | ★★★☆☆ |
| §19.4.2 | ★★★☆☆ |
| §19.4.3 | ★★★☆☆ |
| §19.4.4 | ★★★☆☆ |
| §19.4.5 | ★★★★☆ |

- **§19.4.1**：请阐述在超⼤规模集群中，数据本地性（Data Locality）对作业性能的影响，以
- **§19.4.2**：请描述当发现⼀个Spark作业运⾏缓慢时，你通常会从哪些⽅⾯⼊⼿进⾏性能瓶颈
- **§19.4.3**：在管理⼀个万节点级别的数据平台时，为了优化整体资源利⽤率和降低运营成
- **§19.4.4**：假设集群中出现⼤量⼩⽂件，导致NameNode内存压⼒过⼤和作业执⾏效率低
- **§19.4.5**：请解释在⼤规模Hadoop/Spark集群中，资源管理器（如YARN）的主要作⽤是什

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **性能优化与调优**
- **资源调度与多租户隔离**

## 4 本章小结

> 本面试真题集收录 5 道题，覆盖 1 个原 PDF 主题、1 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [13-decision 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)