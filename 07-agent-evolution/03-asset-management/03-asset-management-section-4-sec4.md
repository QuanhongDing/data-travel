> 本文件是 **03-asset-management.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](03-asset-management.md)。

## 4. 工程实现

### 4.1 落地步骤

1. 资产盘点（Prompt、Skill、Workflow 全部入册）
2. 版本管理（Git 化）
3. 评审流程
4. 发布平台
5. 使用统计
6. 评估反馈
7. 资产市场（Marketplace）
8. 治理：血缘 / 权限 / 退役

### 4.2 关键技术点

- Prompt 版本化、变量化
- Skill 抽象、测试、文档
- Workflow 可视化编排
- 资产血缘、影响分析
- 资产权限、Owner 制度
- 资产价值评估、ROI 计算
- 资产搜索、推荐
- 资产评估、A/B 测试

### 4.3 工具链

GPT Store、Coze、通义、星图、LangChain Hub、Dust、PromptLayer、Replicate

### 4.4 代码示例

#### 4.4.1 Prompt 资产化

```python
from langchain.prompts import PromptTemplate

# 资产化的 Prompt
prompt_asset = PromptTemplate(
    template="你是 {role}，请用 {tone} 语气回答以下问题：\n\n{question}",
    input_variables=["role", "tone", "question"],
    metadata={
        "owner": "alice@company.com",
        "version": "1.2.0",
        "tags": ["客服", "通用"],
        "created_at": "2025-01-15",
    },
)

# 调用
formatted = prompt_asset.format(
    role="退款客服",
    tone="友好",
    question="如何申请退款？"
)
```

#### 4.4.2 Skill 资产化

```python
from langchain.tools import Tool

# 资产化的 Skill
refund_skill = Tool(
    name="refund_api",
    description="查询订单退款状态",
    func=refund_api_call,
    metadata={
        "owner": "ops@company.com",
        "version": "2.0.0",
        "schema": {
            "input": {"order_id": "string"},
            "output": {"status": "string", "amount": "number"},
        },
        "tags": ["退款", "API"],
    },
)
```

#### 4.4.3 Workflow 资产化（LangGraph）

```python
from langgraph.graph import StateGraph

# 资产化的 Workflow
workflow = StateGraph(MyState)
workflow.add_node("query_data", query_data_skill)
workflow.add_node("analyze", analyze_skill)
workflow.add_node("report", report_skill)

workflow.add_metadata({
    "owner": "bi@company.com",
    "version": "1.0.0",
    "tags": ["BI", "报告"],
})
```

#### 4.4.4 资产评估示例

```python
asset_eval = {
    "asset_id": "prompt-refund-v1.2.0",
    "metrics": {
        "csat": 0.92,
        "task_completion": 0.85,
        "cost_per_call": 0.002,
        "violation_rate": 0.001,
    },
    "ab_test": {
        "vs_previous": "+5% csat",
        "p_value": 0.012,
    },
    "evaluator": "auto+human",
    "evaluated_at": "2025-10-01",
}
```

### 4.5 资产管理平台架构

```
┌─────────────────────────────────────────────────────┐
│                AI Asset Management Platform          │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │ Asset Registry│  │ Version Ctrl │  │  Marketplace││
│  └──────────────┘  └──────────────┘  └─────────────┘│
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │   Eval Hub   │  │ Lineage Track│  │  Access Ctrl││
│  └──────────────┘  └──────────────┘  └─────────────┘│
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │ Search/Recom │  │  Usage Stats │  │  Retirement ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
              Agent Runtime
```

各模块职责：

| 模块 | 职责 |
| --- | --- |
| Asset Registry | 资产注册、查询、检索 |
| Version Control | SemVer 版本管理 |
| Marketplace | 资产市场、计费 |
| Eval Hub | 离线 / 在线评估 |
| Lineage Tracker | 血缘、影响分析 |
| Access Control | 权限、配额 |
| Search/Recom | 资产搜索、推荐 |
| Usage Stats | 调用统计、成本 |
| Retirement | 自动 / 手动退役 |

### 4.6 资产 Schema 规范

```yaml
apiVersion: ai-asset/v1
kind: Prompt
metadata:
  name: customer-service-refund
  owner: alice@company.com
  version: 1.2.0
  tags: [客服, 退款]
  createdAt: 2025-01-15
  updatedAt: 2025-09-20
spec:
  template: |
    你是退款客服 {agent_name}。
    请用 {tone} 语气回答用户问题。
    {question}
  variables:
    - name: agent_name
      type: string
      required: true
    - name: tone
      type: string
      default: 友好
    - name: question
      type: string
      required: true
  model:
    provider: openai
    name: gpt-4o
    temperature: 0.7
  eval:
    dataset: eval/customer-service-v1.jsonl
    metrics: [accuracy, safety, style]
status:
  phase: published
  usageCount: 12345
  satisfaction: 0.92
```

---
