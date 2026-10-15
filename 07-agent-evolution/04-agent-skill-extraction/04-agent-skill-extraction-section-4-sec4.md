> 本文件是 **04-agent-skill-extraction.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](04-agent-skill-extraction.md)。

## 4. 工程实现

### 4.1 落地步骤

1. 收集 Agent 行为日志
2. 轨迹清洗、归一化
3. 聚类、抽象
4. LLM 总结 Skill
5. Skill 测试、验证
6. Skill 入库、版本化
7. 持续更新

详细工程步骤：

| 阶段 | 输入 | 输出 | 关键问题 |
| --- | --- | --- | --- |
| 收集日志 | Agent Runtime | 原始轨迹 | 埋点完整性 |
| 清洗 | 原始轨迹 | 干净轨迹 | 去噪、去重 |
| 聚类 | 干净轨迹 | 轨迹簇 | 算法选择 |
| 抽象 | 轨迹簇 | Skill 候选 | LLM prompt |
| 验证 | Skill 候选 | 有效 Skill | 验证集 |
| 入库 | 有效 Skill | Skill Library | 版本管理 |
| 持续更新 | 新轨迹 | 新 Skill | 增量更新 |

### 4.2 关键技术点

- 行为日志采集（agent run trace）
- 轨迹向量化（用 LLM encoder）
- 聚类（HDBSCAN / Transformer）
- LLM 抽象（Prompt Engineering）
- Skill 验证（自动 + 人工）
- Skill 版本化（与 Ch7 §3 联动）
- Skill 检索（基于任务匹配 Skill）

### 4.3 关键工具

- Cursor Composer
- Devin
- Cognition Labs
- Self-Play RL 框架
- HDBSCAN
- LangChain / LangGraph
- LlamaIndex（Agent 框架）

工具对比：

| 工具 | 类型 | 特点 | 适用 |
| --- | --- | --- | --- |
| **Cursor Composer** | Coding Agent | IDE 内 Skill 编排 | 代码任务 |
| **Devin** | Coding Agent | 端到端任务 | 复杂编程 |
| **Cognition Labs** | AI 公司 | Devin 背后 | 自研平台 |
| **Voyager** | Minecraft Agent | 自动技能库 | 游戏场景 |
| **Reflexion** | 自我反思 | Skill 积累 | 推理任务 |
| **LangChain / LangGraph** | Agent 框架 | Skill 编排 | 通用 |
| **LlamaIndex** | RAG + Agent | 工具调用 | 数据任务 |

### 4.4 代码示例

#### 4.4.1 轨迹聚类

```python
import hdbscan
from sentence_transformers import SentenceTransformer

# 1. 加载模型
encoder = SentenceTransformer('all-MiniLM-L6-v2')

# 2. 轨迹向量化
trajectories = [...]  # List of trajectory strings
embeddings = encoder.encode(trajectories)

# 3. 聚类
clusterer = hdbscan.HDBSCAN(min_cluster_size=10)
cluster_labels = clusterer.fit_predict(embeddings)

# 4. 输出聚类
clusters = {}
for traj, label in zip(trajectories, cluster_labels):
    if label not in clusters:
        clusters[label] = []
    clusters[label].append(traj)
```

#### 4.4.2 LLM 抽象 Skill

```python
import openai

def abstract_skill(cluster_trajectories):
    prompt = f"""
以下是若干次相似任务的成功执行轨迹：

轨迹列表：
{chr(10).join([f"- {t}" for t in cluster_trajectories[:20]])}

请总结出通用的执行步骤模板：
1. 步骤描述
2. 步骤描述
...

模板要：
1. 参数化（用 {{变量}} 占位）
2. 通用（适用于相似任务）
3. 可验证（有明确成功标准）

输出 JSON：
{{
  "skill_name": "...",
  "steps": [
    {{"step": "...", "params": [...]}}
  ],
  "success_criteria": "..."
}}
"""
    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content
```

#### 4.4.3 Skill 验证

```python
def verify_skill(skill, validation_tasks):
    success_count = 0
    results = []
    
    for task in validation_tasks:
        result = apply_skill(skill, task)
        success = check_success(result, task.expected)
        if success:
            success_count += 1
        results.append({"task": task, "success": success, "result": result})
    
    hit_rate = success_count / len(validation_tasks)
    return {"hit_rate": hit_rate, "results": results}
```

#### 4.4.4 Self-Play RL（简化）

```python
def self_play_loop(agent, skill_library, n_rounds=100):
    for round in range(n_rounds):
        # 1. Agent 生成任务
        task = agent.generate_task()
        
        # 2. Agent 尝试执行（可能用 Skill Library）
        result = agent.execute(task, skill_library)
        
        # 3. 评估
        success = evaluate(task, result)
        
        # 4. 强化 / 探索
        if success:
            skill_library.reinforce(used_skills)
        else:
            new_skill = extract_skill(result.trajectory)
            skill_library.add(new_skill)
```

### 4.5 Skill Library Schema

```yaml
apiVersion: ai-skill/v1
kind: Skill
metadata:
  name: refund-order
  owner: alice@company.com
  version: 1.2.0
  tags: [客服, 退款]
  createdAt: 2025-01-15
  source:
    trajectory_count: 1247
    success_rate: 0.92
    last_updated: 2025-09-20
spec:
  description: 处理用户退款请求
  trigger:
    intent: "refund_request"
    keywords: ["退款", "退钱"]
  steps:
    - step: "验证订单状态"
      action: "call_api:order_api.get_status"
      params:
        - order_id
    - step: "计算退款金额"
      action: "compute:refund_amount"
      params:
        - order_id
        - reason
    - step: "提交退款申请"
      action: "call_api:payment_api.refund"
      params:
        - order_id
        - amount
    - step: "通知用户"
      action: "send_notification"
      params:
        - user_id
        - message
  success_criteria:
    - refund_status == "approved"
    - user_acknowledged == true
  eval:
    hit_rate: 0.92
    avg_quality: 0.87
```

### 4.6 Skill Mining 平台架构

```
┌─────────────────────────────────────────────────────┐
│                Skill Mining Platform                │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │  Trajectory  │  │   Cluster    │  │   Abstract  ││
│  │  Collector   │  │   Engine     │  │     LLM     ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │   Verifier   │  │  Skill Lib   │  │  HITL UI    ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
                 Agent Runtime
```

---
