# Agent 技能提取（Agent Skill Extraction）

> **一句话定位**：从 Agent 行为日志中自动提取可复用的 Skill / Procedure——让 Agent 自己总结"经验"，让组织能力沉淀为 Agent 能力。

> 本文是 data-travel 项目 [Ch7 · AI 资产沉淀与自进化](../../README.md) 的子章节（04-agent-skill-extraction）。覆盖 核心职责④ 中"自进化 / Skill 自动发现"核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| Skill 提取是什么 | §1.1、§2.1 |
| 如何从行为日志自动提取 Skill | §3.1、§4.1 |
| Procedural Memory / Self-Play RL | §2.3、§5.3 |

---

## 1. 概念与定位

### 1.1 是什么

**Agent 技能提取（Agent Skill Extraction）** 是从 Agent 的历史行为轨迹（用户对话、任务执行日志）中，**自动归纳出可复用的"技能 / 程序性记忆"** 的方法论。

类比人类：
- 人类从经验中总结技能："我发现退款要先验证订单状态"
- Agent Skill Extraction：让 Agent 从自己的对话历史中总结"我应该这样做"

技能提取 vs 相关概念：

| 概念 | 来源 | 输出 | 区别 |
| --- | --- | --- | --- |
| **Skill Extraction** | Agent 行为日志 | 可复用 Skill | 从历史经验归纳 |
| **Prompt Engineering** | 人工设计 | Prompt 模板 | 人工设计 |
| **Workflow Discovery** | 业务流程日志 | Workflow | 多步编排 |
| **Procedural Memory** | 任务执行 | 程序性记忆 | 步骤序列 |
| **Self-Play RL** | 自我练习 | 策略改进 | 通过训练 |
| **Auto-Skill** | 任务多样性 | Skill 自动生成 | LLM 生成 |

### 1.2 为什么需要

- **避免重复劳动**：每次都从头推理，浪费 token。
- **提升一致性**：相同问题用相同 Skill，回答更稳定。
- **组织能力沉淀**：把优秀 Agent 的经验变成"组织资产"。
- **降低运营成本**：减少人工编写 Skill 的工作量。
- **加速冷启动**：新场景无需从零设计。
- **持续进化**：从日志中持续发现新 Skill。

更细的驱动力：

| 驱动力 | 业务价值 |
| --- | --- |
| 效率提升 | 任务执行速度 +30-50% |
| 一致性 | 回答稳定性 +20% |
| 复用率 | 跨任务复用 +40% |
| 知识沉淀 | 团队离职不带走经验 |
| 评估简化 | Skill 命中率可量化 |

### 1.3 演进

- 传统阶段：人工编写 Skill。
- 2024 阶段：Self-Play RL、Procedural Memory、Auto-Skill。
- 2025 阶段：Skill Mining + Workflow Discovery。
- 2025+：自驱动 Skill Library（Agent 自己发现 + 验证 + 应用）。

各阶段关键节点：

| 时间 | 事件 | 关键贡献 |
| --- | --- | --- |
| 2022 | LangChain Agents | 手工定义工具列表 |
| 2023 | AutoGPT | 自动任务分解 |
| 2023-11 | Voyager（Minecraft） | 自动技能库发现 |
| 2024-01 | ReAct | 推理 + 行动 |
| 2024-04 | Reflexion | 自我反思 + Skill 积累 |
| 2024-06 | Auto-Skill（学界） | LLM 自动生成 Skill |
| 2024-08 | Cursor Composer | IDE 中的 Skill 编排 |
| 2024-10 | Devin（Cognition） | 端到端 Coding Agent |
| 2025 | Self-Play RL | 自我博弈生成训练数据 |
| 2025-06 | Procedural Memory 论文 | 程序性记忆建模 |

### 1.4 在 AI 时代数据架构中的位置

技能提取是"自进化"的最后一公里：

```
       Agent Runtime
            ↓ 行为日志
       Skill Mining Pipeline
       （聚类 → 抽象 → 验证）
            ↓
       Skill Library（资产化）
            ↓
       Asset Registry（Ch7 §3）
            ↓
       Agent Runtime（用 Skill）
            ↓ 反馈
       Skill 评估 + 迭代
```

技能提取连接了"行为日志 → 资产 → 应用"的闭环。

### 1.5 与本仓库其他章节的关系

- 与 Ch7 §1 长期记忆：程序性记忆是 Skill 提取的输入。
- 与 Ch7 §2 反馈闭环：Skill 命中率需要反馈评估。
- 与 Ch7 §3 资产管理：Skill 是一种 AI 资产，需要版本管理。
- 与 Ch5 Agent 平台：Skill 是 Agent 平台的"插件"。

---

## 2. 核心原理

### 2.1 关键概念

| 概念 | 定义 |
| --- | --- |
| **行为日志** | Agent 执行任务的轨迹 |
| **Skill** | 可复用的参数化步骤 |
| **Procedural Memory** | 程序性记忆，类似人类的"会骑车" |
| **Skill Mining** | 从日志挖掘 Skill |
| **Workflow Discovery** | 自动发现流程模式 |
| **Skill Library** | Skill 库，类似"工具箱" |
| **Trajectory** | 单次任务执行轨迹 |
| **Skill Cluster** | 相似 Skill 聚类 |
| **Skill Template** | Skill 抽象模板 |
| **Skill Verification** | Skill 在新任务上的验证 |

### 2.2 数学形式化

```
Skill Extraction:
- Input: 轨迹集合 T = {τ1, τ2, ..., τn}
- Process: 聚类 + 抽象 + 验证
- Output: Skill Library S = {s1, s2, ..., sm}
```

更形式化：

```
Skill Extraction = ⟨T, C, A, V, S⟩

T = {τ_i}        行为轨迹集合
C = cluster(τ_i) 轨迹聚类（按相似度）
A = abstract(c_j) 抽象为 Skill 模板
V = verify(s_k)   在新任务上验证
S = {s_k}         Skill Library
```

### 2.3 关键算法

| 算法 | 原理 | 适用 |
| --- | --- | --- |
| **轨迹聚类** | DBSCAN、HDBSCAN、Transformer 序列聚类 | 轨迹相似度分组 |
| **Skill 抽象** | LLM 总结 + 模板提取 | 把聚类结果变 Skill |
| **Skill 验证** | 在新任务上测试 Skill 命中率 | 验证 Skill 有效性 |
| **Self-Play RL** | Agent 自己生成任务 → 自我练习 | 强化学习 |
| **Procedural Memory** | 从轨迹中提取"步骤序列" | 程序性记忆 |
| **Workflow Discovery** | 流程挖掘（Process Mining） | 多步流程 |
| **Auto-Skill** | LLM 直接生成 Skill | LLM 主导 |
| **Compositional Skill** | Skill 组合生成新 Skill | 复杂任务 |

#### 2.3.1 轨迹聚类算法

**DBSCAN（Density-Based Spatial Clustering）**
- 基于密度的聚类。
- 不需要预设簇数。
- 能识别噪声点。
- 适用：行为轨迹向量化后的聚类。

**HDBSCAN（Hierarchical DBSCAN）**
- DBSCAN 的层次化版本。
- 自动选择 epsilon。
- 适用：轨迹规模大、簇密度不均。

**Transformer 序列聚类**
- 用 Transformer 编码轨迹序列。
- 余弦相似度 + 谱聚类。
- 适用：长轨迹、序列模式。

#### 2.3.2 Skill 抽象算法

**LLM 总结 + 模板提取**

```
输入：轨迹聚类 {τ_1, τ_2, ..., τ_n}
输出：Skill 模板

prompt = """
以下是若干次相似任务的成功执行轨迹：

轨迹 1：{τ_1}
轨迹 2：{τ_2}
...
轨迹 n：{τ_n}

请总结出通用的"执行步骤"模板：
- 步骤 1：{...}
- 步骤 2：{...}
...

模板要：
1. 参数化（用户可填具体值）
2. 通用（适用于新任务）
3. 可验证（有明确的成功标准）
"""
```

**模板匹配**
- 从聚类中找最常见的动作序列。
- 用序列对齐（Sequence Alignment）找公共子序列。

#### 2.3.3 Skill 验证算法

```
输入：Skill s，新任务集 T_new = {t_1, ..., t_k}
输出：Skill 命中率、准确率

for t in T_new:
    result = apply_skill(s, t)
    success = check_success(result)
    
命中率 = count(success) / len(T_new)
准确率 = avg(quality(result))
```

验证需要：
- 验证集（新任务，未参与训练）。
- 成功标准（自动 + 人工）。
- 失败案例分析（为什么失败）。

### 2.4 与相邻概念关系

- Skill Extraction vs Prompt Engineering：Skill 是参数化步骤，Prompt 是指令文本。
- Skill Extraction vs RAG：Skill 是"怎么做"，RAG 是"是什么"。
- Skill Extraction vs Workflow Discovery：Skill 是单步动作，Workflow 是多步编排。
- Skill Extraction vs Fine-tuning：Skill 是"外挂知识"，Fine-tuning 是"内化能力"。
- Skill Extraction vs Active Learning：都挑样本，但 Skill 提取是从执行轨迹归纳。

---

## 3. 设计模式与范式

### 3.1 主要模式

- 离线 Skill Mining
- 在线 Procedural Memory
- Self-Play RL
- Human-in-the-Loop 校验
- 混合模式（离线 + 在线 + 人工）

各模式展开：

#### 3.1.1 离线 Skill Mining

- 周期执行（如每周）。
- 从累积的行为日志中提取 Skill。
- 适合：稳定业务、成熟 Agent。

流程：
```
收集日志（1 周）
   ↓
清洗 + 归一化
   ↓
轨迹聚类（HDBSCAN）
   ↓
LLM 抽象 Skill
   ↓
人工评审
   ↓
Skill 入库
   ↓
在线 A/B 验证
```

#### 3.1.2 在线 Procedural Memory

- 实时从执行轨迹中提取程序性记忆。
- 类似人类的"肌肉记忆"。
- 适合：高频任务、重复场景。

实现：
```python
# 在线 Procedural Memory
if trajectory.success_rate > 0.9 and execution_count > 100:
    skill = abstract_skill(trajectory)
    skill_library.add(skill)
```

#### 3.1.3 Self-Play RL

- Agent 自己生成任务 → 自己执行 → 总结 Skill。
- 类似 AlphaGo Zero。
- 适合：可验证任务（数学、代码、游戏）。

流程：
```
初始化 Skill Library（少量种子）
   ↓
Self-Play 生成新任务
   ↓
Agent 用 Skill 尝试
   ↓
成功 → 强化 Skill
   ↓
失败 → 探索新 Skill
   ↓
循环 N 轮
```

#### 3.1.4 Human-in-the-Loop 校验

- LLM 提取的 Skill 人工复核。
- 避免幻觉 Skill。
- 适合：高质量要求场景。

流程：
```
LLM 提取 Skill
   ↓
置信度评分
   ↓
高置信度 → 自动入库
低置信度 → 人工审核
   ↓
Skill 入库
```

### 3.2 反模式与陷阱

| 反模式 | 表现 | 后果 | 如何避免 |
| --- | --- | --- | --- |
| **Skill 爆炸** | Skill 数量无限增长 | 调用成本飙升、检索困难 | 重要性阈值 + 合并 |
| **Skill 幻觉** | LLM 编造不存在的步骤 | 误导 Agent | 验证集 + 人工 |
| **Skill 过拟合** | Skill 只适用老任务 | 新任务失效 | 多样化验证集 |
| **Skill 冲突** | 多个 Skill 给相反建议 | 行为不一致 | 版本管理 + 优先级 |
| **Skill 退化** | Skill 长期不更新 | 失效 Skill 堆积 | 持续评估 |
| **Skill 私藏** | 个人有私有 Skill | 离职带走 | 组织级 Skill Library |
| **Skill 不可解释** | Skill 是黑盒 | 难以审计 | 强制结构化描述 |
| **Skill 难复用** | Skill 太特定 | 复用率低 | 抽象度适中 |

### 3.3 模式选择决策表

| 业务 | 推荐模式 | 理由 |
| --- | --- | --- |
| 客服 Agent | 离线 Skill Mining | 业务相对稳定 |
| Coding Agent | 在线 Procedural Memory | 高频任务 |
| 数学 / 游戏 | Self-Play RL | 可自动验证 |
| 金融 / 医疗 | HITL 校验 | 高质量要求 |
| 通用 LLM | 混合模式 | 综合 |

---

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

## 5. 前沿演进

### 5.1 LLM/Agent 时代的演进

- Auto-Skill（2024）
- Self-Play RL（2024-2025）
- Auto-Workflow Discovery
- LLM 总结 + 人工校验
- Compositional Skill（组合 Skill 生成新 Skill）
- Cross-Agent Skill Transfer（跨 Agent 共享 Skill）
- Procedural Memory Modeling（程序性记忆建模）

更前沿的方向：

| 方向 | 时间 | 含义 |
| --- | --- | --- |
| **Auto-Skill** | 2024-2025 | LLM 直接生成 Skill |
| **Self-Play RL** | 2024-2025 | 自我博弈生成 Skill |
| **Compositional Skill** | 2025 | Skill 组合生成新 Skill |
| **Cross-Agent Transfer** | 2025-2026 | 跨 Agent 共享 Skill |
| **Procedural Memory** | 2025 | 程序性记忆建模 |
| **Workflow Discovery** | 2025 | 自动发现多步流程 |
| **Auto-Workflow Synthesis** | 2026+ | 自动合成完整 Workflow |

### 5.2 与 RAG / 反馈闭环 / 资产管理的结合

- Skill 提取的输出可以入库为 Asset（Ch7 §3）。
- Skill 命中率评估需要反馈闭环（Ch7 §2）。
- Skill 是程序性记忆的"工程化"（Ch7 §1）。
- Skill 提取可以驱动 GraphRAG（把 Skill 建模为图谱节点）。

### 5.3 2024-2025 进展

| 进展 | 时间 | 贡献 |
| --- | --- | --- |
| **Voyager** | 2023-11 | Minecraft 中自动技能库发现 |
| **Reflexion** | 2024-04 | 自我反思 + Skill 积累 |
| **Cursor Composer** | 2024-08 | IDE 内 Skill 编排 |
| **Devin** | 2024-10 | 端到端 Coding Agent |
| **Auto-Skill** | 2024 | LLM 自动生成 Skill |
| **Compositional Skills** | 2025 | Skill 组合生成新 Skill |
| **Self-Play RL** | 2024-2025 | 自我博弈生成训练数据 |

### 5.4 未来 3-5 年趋势

- Skill Library 将成为 Agent 平台的"基础设施"。
- Auto-Skill + Self-Play RL 将大幅降低 Skill 创建成本。
- Compositional Skill 将支持"长任务"自动分解。
- Cross-Agent Skill Transfer 将成为多 Agent 协作的核心。
- Procedural Memory 将与 Semantic Memory 融合。

---

## 6. 落地实践

### 6.1 真实案例

- Cursor Composer
- Devin（Cognition Labs）
- Cognition Labs（自研平台）
- Anthropic（自我改进）
- Auto-Skill（学术 + 工业）

各案例展开：

#### 案例 1：Cursor Composer

定位：IDE 内的多文件编辑 Skill 编排。

Skill 提取方式：
- 用户编辑行为日志（接受 / 拒绝 / 修改）。
- 提取"常见编辑模式"作为 Skill。
- Skill 可被 Agent 调用，做多文件重构。

效果：用户接受率提升 30%+。

#### 案例 2：Devin（Cognition Labs）

定位：端到端 Coding Agent。

Skill 提取方式：
- 任务执行轨迹（Devin 的 shell / edit 操作）。
- Self-Play RL + 人工标注。
- Skill Library 包含 100+ 编程 Skill。

效果：在 SWE-bench 上 SOTA。

#### 案例 3：Cognition Labs 自研平台

定位：Cognition 内部 Agent 平台。

Skill 提取方式：
- Self-Play + 人工反馈。
- 任务级 + 步骤级 Skill。
- Skill Library 持续增长。

#### 案例 4：Anthropic 自我改进

定位：Claude 的"自我反思"能力。

Skill 提取方式：
- Constitutional AI（宪法式自我评判）。
- Self-Refine（自我修正）。
- Skill Library 内置到模型行为。

#### 案例 5：Auto-Skill（学界 + 工业）

定位：LLM 自动生成 Skill。

Skill 提取方式：
- LLM 分析任务 → 生成 Skill。
- Skill 验证 + 人工审核。
- 适用于多种业务场景。

### 6.2 踩坑与经验

- 轨迹聚类效果不好：行为日志质量差、聚类算法选错。
- LLM 抽象出幻觉 Skill：LLM 编造不存在的步骤。
- Skill 验证通过但线上失败：验证集与真实分布偏差。
- Skill 库爆炸：缺乏重要性筛选。
- Skill 冲突：多个 Skill 给出矛盾指令。
- Skill 难复用：抽象度过低或过高。
- Skill 冷启动：没有历史日志可挖。
- Skill 评估难：缺少量化指标。

更细的踩坑清单：

| 踩坑 | 表现 | 根因 | 解决 |
| --- | --- | --- | --- |
| 聚类效果差 | 同一类被切散 | 行为日志质量差 | 清洗 + 多维度 embedding |
| 幻觉 Skill | Skill 含不存在的步骤 | LLM 幻觉 | 验证集 + 人工 |
| 验证通过线上失败 | 验证集与真实分布偏差 | 验证集太小 | 真实分布验证集 |
| Skill 爆炸 | Skill 库无限增长 | 无重要性筛选 | 重要性阈值 + 合并 |
| Skill 冲突 | 矛盾指令 | 多版本管理 | 版本 + 优先级 |
| Skill 难复用 | 复用率低 | 抽象度不当 | 抽象度评估 |
| 冷启动 | 没历史 | 新业务 | Self-Play + Auto-Skill |

### 6.3 落地路径

- 0→1：收集日志 + 人工编写 Skill
- 1→10：轨迹聚类 + LLM 抽象
- 10→100：Self-Play + 自动化流水线 + 资产化

具体路径：

| 阶段 | 关键建设 | 投入 | 效果 |
| --- | --- | --- | --- |
| 0→1 | 日志采集 + 人工 Skill | 1-2 周 | 有 Skill Library |
| 1→10 | 聚类 + LLM 抽象 | 1-2 月 | 自动提取 |
| 10→100 | Self-Play + 自动化 | 半年+ | 持续自进化 |

### 6.4 ROI 评估

- 任务执行速度 +30-50%（Skill 复用）。
- 人工 Skill 编写成本降低 50-80%（自动提取）。
- 跨任务复用率 +40%。
- 回答一致性 +20%。

ROI 公式：

```
ROI = (Skill 复用节省 + 自动提取节省 + 一致性提升) / 平台成本

Skill 复用节省 = 节省 token × token 单价 × 调用次数
自动提取节省 = 人工编写工时 × 工程师时薪 × 提取数量
一致性提升 = 业务指标提升 × 业务权重
```

### 6.5 监控与告警

| 指标 | 阈值 | 告警 |
| --- | --- | --- |
| Skill 命中率 | < 80% | 提取质量差 |
| Skill 准确率 | < 85% | 验证效果差 |
| Skill 数量 | 日增 > 10% | 库爆炸 |
| Skill 平均年龄 | > 90 天 | 缺乏迭代 |
| Skill 评估耗时 | > 1h/批次 | pipeline 慢 |
| 无 Owner Skill | > 5% | 治理问题 |

### 6.6 与人类专家协作

Skill 提取不是替代人类专家，而是放大人类专家：

- **专家定义"领域骨架"**：核心 Skill 由专家定义。
- **Agent 自动"填充血肉"**：细节 Skill 由自动提取。
- **专家"审核关键"**：高风险 Skill 由专家审核。
- **持续"双向反馈"**：专家反馈驱动 Skill 迭代。

适用场景：
- 金融合规：专家定义合规 Skill，Agent 提取执行细节。
- 医疗诊断：专家定义诊断框架，Agent 提取病例细节。
- 法律咨询：专家定义法律原则，Agent 提取案例细节。

### 6.7 上线 Checklist

- [ ] 行为日志采集完整（埋点）
- [ ] 轨迹清洗 pipeline
- [ ] 聚类算法选定（HDBSCAN / Transformer）
- [ ] LLM 抽象 prompt 模板化
- [ ] Skill 验证集构建（多样化）
- [ ] Skill 命中率评估 SOP
- [ ] Skill Library 平台可用
- [ ] Skill 与 Asset Registry 联动（Ch7 §3）
- [ ] Owner / 版本 / 血缘
- [ ] 监控告警规则就绪
- [ ] 成本预算
- [ ] 人工审核机制

---

## 7. 与其他方法对比

| 维度 | 人工编写 | Skill Mining | Self-Play | Procedural Memory |
| --- | :---: | :---: | :---: | :---: |
| 效率 | 1 | 4 | 5 | 5 |
| 质量 | 5 | 3 | 3 | 4 |
| 自动化 | 1 | 4 | 5 | 5 |
| 冷启动 | 5 | 2 | 5 | 3 |
| 成本 | 高 | 中 | 中 | 中 |
| 可解释 | 5 | 3 | 2 | 3 |
| 跨任务 | 2 | 4 | 4 | 5 |

### 7.1 选型决策

| 场景 | 推荐方法 | 理由 |
| --- | --- | --- |
| 冷启动 | 人工编写 + 种子 Skill | 没有历史日志 |
| 业务稳定 | Skill Mining（离线） | 周期提取 |
| 高频任务 | Procedural Memory（在线） | 实时学习 |
| 数学 / 代码 | Self-Play RL | 可自动验证 |
| 高合规 | 人工编写 + HITL 校验 | 必须可控 |
| 多 Agent | Cross-Agent Transfer | 共享 Skill |

### 7.2 与其他章节的关系

- 与 Ch7 §1 长期记忆：Procedural Memory 与长期记忆联动。
- 与 Ch7 §2 反馈闭环：Skill 评估需要反馈。
- 与 Ch7 §3 资产管理：Skill 是 AI 资产的一种。
- 与 Ch5 Agent 平台：Skill 是 Agent 的"插件"。

### 7.3 成本对比

| 方法 | 建设成本 | 使用成本 | 维护成本 |
| --- | --- | --- | --- |
| 人工编写 | 低 | 高 | 高 |
| Skill Mining | 中 | 中 | 中 |
| Self-Play RL | 高 | 中 | 中 |
| Procedural Memory | 中 | 低 | 中 |
| 混合 | 高 | 低 | 中 |

### 7.4 性能与扩展性

- 单 Skill 库：1k-10k Skills（HDBSCAN 可处理）。
- 大规模 Skill 库：100k+（需要分层 + 检索）。
- 跨 Agent Skill：联邦式 Skill Library。
- 实时 Skill 提取：需要增量聚类 + 在线 LLM。

### 7.5 Skill Library 平台架构详解

```
┌─────────────────────────────────────────────────────┐
│                 Skill Library Platform              │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │ Trajectory   │  │  Cluster     │  │  Abstract   ││
│  │ Storage      │  │  Engine      │  │  Service    ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │  Verifier    │  │  Skill Store │  │  HITL UI    ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │  Retriever   │  │  Evaluator   │  │  Retirer    ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
                 Agent Runtime
```

各模块详解：

| 模块 | 职责 | 关键技术 |
| --- | --- | --- |
| Trajectory Storage | 存储行为轨迹 | ClickHouse / S3 + Iceberg |
| Cluster Engine | 轨迹聚类 | HDBSCAN / Transformer 序列 |
| Abstract Service | LLM 抽象 | Prompt + GPT-4 / Claude |
| Verifier | Skill 验证 | 自动 + LLM-as-Judge |
| Skill Store | Skill 库存储 | Postgres / Vector DB |
| HITL UI | 人工审核 | Label Studio / 自研 |
| Retriever | Skill 检索 | Embedding + BM25 |
| Evaluator | 效果评估 | CSAT / 业务指标 |
| Retirer | 自动退役 | 老化检测 |

### 7.6 Skill 检索与匹配

Agent 调用 Skill 时需要找到合适的 Skill：

#### 7.6.1 检索方法

- **关键词匹配**：触发词匹配（"退款" → 退款 Skill）。
- **语义检索**：Embedding + 向量库（基于意图匹配）。
- **任务相似度**：基于任务描述找历史成功的 Skill。
- **图谱匹配**：基于实体关系匹配相关 Skill。

#### 7.6.2 检索流程

```
用户任务
   ↓
Query 理解（提取意图 + 关键实体）
   ↓
Skill 检索（embedding 相似度 + 触发词）
   ↓
Top-K Skill 候选
   ↓
LLM 重排（选择最合适的 Skill）
   ↓
执行 Skill
```

#### 7.6.3 Skill 调用方式

- **直接调用**：Agent 显式调用 Skill（Tool Use 风格）。
- **隐式调用**：Agent 决策引擎自动选 Skill。
- **混合调用**：先检索 Top-K，再显式调用。

### 7.7 跨 Agent Skill Transfer

多 Agent 协作场景下 Skill 如何共享：

- **共享 Skill Library**：所有 Agent 共享同一个 Skill Library。
- **领域隔离**：按领域分配 Skill Library（金融 / 医疗 / 客服）。
- **Skill 联邦**：跨组织 Skill 共享（同态加密）。
- **Skill Market**：Skill 作为资产可购买。

### 7.8 自检问题

读完本章，你应该能回答：

1. Skill Extraction 和 RAG 的本质区别是什么？
2. Skill Mining 的核心算法流程是什么？
3. DBSCAN 和 HDBSCAN 的区别？
4. LLM 抽象 Skill 时如何避免幻觉？
5. Self-Play RL 适合什么场景？
6. Skill 验证怎么做？验证集怎么构建？
7. Skill Library 和 Asset Registry 怎么联动？
8. Skill Extraction 的冷启动怎么做？
9. Procedural Memory 和 Semantic Memory 的边界？
10. Skill Extraction 的 ROI 怎么算？

### 7.9 Skill Extraction 的关键论文 / 系统

| 系统 / 论文 | 时间 | 贡献 |
| --- | --- | --- |
| **Voyager** | 2023-11 | Minecraft 中自动技能库发现 |
| **Reflexion** | 2024-04 | 自我反思 + Skill 积累 |
| **Auto-Skill** | 2024 | LLM 自动生成 Skill |
| **Compositional Skills** | 2025 | Skill 组合生成新 Skill |
| **Self-Play RL** | 2024-2025 | 自我博弈 |
| **Cursor Composer** | 2024 | IDE 内 Skill 编排 |
| **Devin** | 2024 | 端到端 Coding Agent |

### 7.10 Skill Extraction 的开放问题

1. Skill 抽象度的最优边界（太具体 → 难复用；太抽象 → 难执行）。
2. Skill 冲突的自动检测与解决。
3. Skill 库的可解释性（为什么用这个 Skill）。
4. Skill 的因果推理（基于 Skill 做反事实推理）。
5. 跨语种 Skill（中文 / 英文 Skill 是否等价）。
6. Skill 老化与迁移（场景变了 Skill 怎么迁移）。
7. Skill 安全（恶意 Skill 如何检测）。

### 7.11 与组织能力建设

Skill Library 是组织能力的"AI 镜像"：

- 每个部门 / 团队都有自己的 Skill Library（销售 Skill / 客服 Skill / 代码 Skill）。
- Skill Library 的"丰富度"反映组织能力。
- Skill 命中率反映组织效率。
- Skill 演进反映组织学习速度。

组织能力建设的衡量指标：
- Skill 库总规模。
- 跨团队 Skill 复用率。
- Skill 命中率。
- Skill 老化周期。
- Skill 演进频率。

---

## 8. 面试真题集

> 本节整合自《大数据 / AI 平台架构师》题库（创脉思 cms365.cn，版本 2025-11-25）与近期大模型 / Agent 方向公开面试高频题的整理，题号沿用「§X.Y 第 K 题」格式（X = 章号，Y = 子节号），便于读者回溯原题。
>
> **每题按五段式作答**：考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料。参考答案优先引用**头部互联网企业 / 学术机构的公开实践**（Anthropic、OpenAI、DeepMind、Cognition Labs、Anysphere、Meta、NVIDIA、阿里通义实验室、字节 Coze、LangChain / LlamaIndex 等），便于读者进一步溯源。

### 8.1 全景视图

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §7.4 | Agent 技能提取（Agent Skill Extraction） | 7.4.1 ~ 7.4.6 | 6 | 主 |

| 题号 | 难度 |
| --- | :---: |
| §7.4.1 | ★★★☆☆ |
| §7.4.2 | ★★★★☆ |
| §7.4.3 | ★★★★☆ |
| §7.4.4 | ★★★★☆ |
| §7.4.5 | ★★★★★ |
| §7.4.6 | ★★★★☆ |

### 8.2 §7.4 Agent 技能提取

> 本主题考察「Agent 如何从自己的行为历史中归纳可复用 Skill」这一自进化核心能力。面试官通常会从概念辨析（Skill vs RAG vs Prompt）切入，下钻到工程流水线（日志→聚类→抽象→验证→入库）各环节的算法选型与失败模式，最后延伸到 Self-Play RL、Skill Library 治理与 ROI 评估。具备 Voyager / Reflexion / Devin 等系统级别的认知是加分项。

#### §7.4.1 请阐述 Agent 技能提取（Skill Extraction）与检索增强生成（RAG）、提示工程（Prompt Engineering）、微调（Fine-tuning）之间的本质区别，并说明 Skill Extraction 在 Agent 自进化体系中的不可替代性。

**1. 考察点**

- 是否能把 Skill Extraction 放在「**知识如何注入 LLM / Agent**」这条主轴上定位，而不是把它当作 RAG 的一个分支。
- 能否从「**信息形态**」（陈述性 vs 程序性）、「**注入时机**」（运行时 vs 训练时）、「**变更成本**」（热更新 vs 重新训练）三个维度做结构化比较。
- 是否理解 Skill Extraction 的真正不可替代点——它解决的是「**how（步骤序列）**」而非「**what（事实）**」。
- 加分项：能联系 Agent Loop（感知→规划→执行→反思）说明 Skill Extraction 与 Reflexion 等反思机制的契合关系。

**2. 参考答案框架**

**第一层：先立轴——三种"知识注入方式"的对照。**

| 维度 | Prompt Engineering | RAG | Fine-tuning | Skill Extraction |
| --- | --- | --- | --- | --- |
| 注入时机 | 运行时（每轮对话） | 运行时（每次推理） | 训练时（一次性） | 运行时（持续） |
| 信息形态 | 指令文本 | 陈述性事实 | 参数化能力 | 程序性步骤 |
| 变更成本 | 改 prompt 即可 | 重建索引 | 重训（贵、慢） | 增删 Skill（秒级） |
| 典型回答 | "你是 XX 角色" | "根据文档…Q3 营收…" | "永远用古文回答" | "按退款流程：①验证订单…" |
| 主要回答的问题 | 指令 / 风格 / 边界 | What（是什么） | 行为模式 / 风格 | How（怎么做） |

**第二层：Skill Extraction 解决 RAG 不解决的问题。** RAG 的本质是「**知识检索**」——把外部文档里的事实拉进上下文，它的检索单元是「事实块」「段落」「向量」，擅长回答"知识是 X / 制度是 Y"类问题。但 Agent 真正在生产里消耗的是多步骤操作——退款要"先验证订单、再算金额、再调支付、再通知用户"，这是一个**带因果顺序的程序**，RAG 检索回的知识块不会自动帮你排序与执行，更不会帮你处理分支与失败回滚。Skill Extraction 恰恰把"如何做一个多步骤任务"沉淀为可执行模板，可被 Agent 在合适意图下直接调用，这恰好补上了 RAG 的空白。Anthropic 在《Building effective agents》（2024）的工程总结里把 Agent 工具与 Skill 的区别概括为："Tools 提供原子能力，Skills 编排原子能力"。

**第三层：Skill Extraction 相对微调的优势。** 微调是"内化能力"——改的是模型参数，成本是 GPU 小时数与数据集构建。Skill 是"**外挂能力**"——它以结构化文本形式存在，可以**秒级热更新、A/B 实验、按租户隔离**。这一点对生产系统至关重要：当某条业务规则（如合规口径）变化时，等重训模型上线要等几天，而改一个 Skill 的步骤几乎是即时生效。Cognition Labs 公开介绍 Devin 的演进路线时也强调，**将"会做的事"外化为可审计的 Skill**，比持续微调模型更可控。

**第四层：不可替代性——Skill Extraction 是 Agent 的"程序性记忆"。** 这一观点在学术与工业界有清晰对应：DeepMind 在 2024 年发表的 **Reflexion**（Shinn et al., NeurIPS 2024）明确把 Self-Reflection 沉淀为「**verbal reinforcement**」（语言化强化记忆），把成功经验变成可重读的"反思文本"——这本质上就是 Skill Extraction。NVIDIA 与斯坦福在 **Voyager**（Wang et al., 2023-11）中更进一步：在 Minecraft 中用一个常驻的 **Skill Library**（不断增长的代码技能库）让 Agent 终身学习，并把每个 Skill 写成可组合、可检索的描述块——这正是 Skill Extraction 不可替代的工业实证。

**第五层：落点——Skill Extraction 在自进化体系中的位置。** 一句话：**Skill Extraction 是 Agent 自进化"经验→资产"的最后一公里**。它连接"行为日志"与"资产注册中心"，只有它能把离散的轨迹沉淀为可复用、可治理、可计量的资产。这是 RAG / 微调都做不到的——前者不沉淀执行经验，后者改了不可热替换。

**3. 常见陷阱**

- **把 Skill 当 RAG 的子集。** 这是最常见的错误认知。RAG 解决 what，Skill 解决 how，二者经常**共存**而不是包含关系。
- **把 Skill 等同于 Prompt 模板。** Prompt 是单轮指令文本，Skill 是多步骤、可参数化、可验证的流程。
- **认为微调可以替代 Skill Extraction。** 微调擅长行为模式的整体迁移（如风格、行业术语），不擅长"逐个 Skill 的精细治理与热更新"。
- **忽视 Skill 的"程序性记忆"本质。** 只把它当作工具列表，丢掉的是"步骤序列与失败回滚"这一最关键能力。

**4. 追问预测**

- **「Skill 和 Tool 怎么区分？边界在哪？」** 答：**Tool 是原子动作**（一次 API 调用、一个数据库查询），**Skill 是 Tool 的编排**（多个 Tool 的有序组合 + 成功标准 + 失败回滚）。工程上 Tool 数量通常在几十到几百，Skill 数量可以扩到数千。
- **「RAG 和 Skill 同时使用，怎么避免冲突？」** 答：分层语义——RAG 给"是什么"的上下文，Skill 给"怎么做"的执行模板；调用顺序是 Query 理解 → RAG 拉事实 → 选 Skill → 按 Skill 步骤执行。中后台可见 Anthropic 在 2024 年公开的多 Agent 工程实践。
- **「Skill Extraction 适合所有 Agent 场景吗？」** 答：不是。**稳定高频任务**（客服常规操作、代码重构模式）收益最大；**开放式生成**（创意写作、研究探索）反而可能因 Skill 库"过度结构化"压制多样性。
- **「和 Procedural Memory（程序性记忆）是什么关系？」** 答：Procedural Memory 是认知科学里的概念（与 Semantic / Episodic 并列），**Skill Extraction 是 Procedural Memory 的工程化实现**——前者是抽象类别，后者是具体产出形式。

**5. 参考资料**

- Noah Shinn 等（DeepMind / Northeastern 等）《Reflexion: Language Agents with Verbal Reinforcement Learning》，NeurIPS 2024——把"自我反思 → 语言化强化记忆 → 沉淀为可复用 Skill"作为完整闭环提出，是 Skill Extraction 学术定义的关键来源。
- Guanzhi Wang 等（NVIDIA / Stanford / Caltech）《Voyager: An Open-Ended Embodied Agent with Large Language Models》，2023-11 arXiv——Minecraft 中"自动技能库发现 + Skill Library 终身增长"的原始系统，是 Skill Extraction 在开放环境里的标志工作。
- Anthropic Engineering Blog《Building effective agents》（2024-10）——对 Tool / Skill / Prompt / Workflow 关系的清晰工程总结，强调 Skills 是"工具的编排"。
- Lilian Weng（前 OpenAI）博客《LLM-powered Autonomous Agents》——程序性记忆 vs 陈述性记忆的概念区分及其在 Agent 中的落地。
- Harrison Chase 等（LangChain）公开工程文档与 LangGraph 设计材料——Agent 状态 / 长期记忆 / Skill 工具化的工程实现范式。
- **蚂蚁集团的金融风控 Agent** —— 把「反欺诈识别 → 拦截 → 申诉处理」的多步流程沉淀为可热更新的 Skill Library，对比微调模型可秒级替换合规口径，是 Skill「外挂能力 vs 内化能力」论点的典型工业印证。
- **网易雷火的永劫无间 / 逆水寒玩家行为运营** —— 把「新手引导、组队匹配、副本攻略」等高频玩家交互流程归纳为 Skill 库，证明 Skill Extraction 在内容运营长尾场景的程序性记忆价值。
- **顺丰的异常件处理 Agent** —— 把「签收失败、错分、改派」等场景的处置步骤固化为可执行 Skill 模板，使一线网点能在不同区域规则下即时切换执行流程，验证 Skill 热更新相对微调的优势。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §7.4.2 描述一条完整的 Skill Mining（技能挖掘）流水线，从 Agent 行为日志到最终入库的 Skill Library。各环节有哪些算法选型？在大规模数据下面临哪些工程挑战？

**1. 考察点**

- 是否能在「**采集→清洗→聚类→抽象→验证→入库→治理**」这条端到端链路上给出清晰模块边界。
- 能否说清**每一步的目标函数与失败模式**（聚类是为了"分桶"，抽象是为了"归纳"，验证是为了"防止幻觉"）。
- 是否了解工业界真实选型——HDBSCAN、Sentence-BERT、GPT-4/Claude、Lint 校验等。
- 加分项：能结合 Anysphere Cursor / Cognition Devin 等生产系统的经验给出量级数字（轨迹条数、Skill 数量、命中率阈值等）。

**2. 参考答案框架**

**第一层：先画七段流水线。**

```
[Agent Runtime] --(埋点)--> 1. Trajectory Storage
                                 ↓
                          2. Cleaning & Normalization
                                 ↓
                          3. Embedding & Clustering
                                 ↓
                          4. LLM-based Abstraction
                                 ↓
                          5. Verification (在线 + 离线)
                                 ↓
                          6. Skill Library  （结构化登记）
                                 ↓
                          7. Governance & Retrieval (在线服务)
```

**第二层：每段的技术要点。**

- **① Trajectory Storage**：Agent 每一步（tool call / LLM 决策 / 中间观察）需要完整埋点。一个标准 schema 是 `{session_id, step_idx, ts, intent, action, observation, reward}`。**工程关键**是事件顺序必须按 wall-clock 与逻辑序双向标记，便于事后分析成败因果。LangGraph 在 2024 年的 StateGraph 设计中明确把每步状态作为一等公民写入持久化层。存储选型上，**ClickHouse / Parquet on Iceberg** 是工业界偏好的方案（写吞吐 + 列存压缩 + 时间分区），Cursor 公开技术博客提到他们使用近实时事件管道收集每个 Composer 调用的轨迹。

- **② Cleaning & Normalization**：三件事——**截断失败轨迹**（用 reward 信号剔除半完成会话）、**参数归一化**（时间戳统一 UTC、参数键标准化，便于后续 embedding）、**去重**（同一意图的执行路径常常高度相似，去重是后续聚类质量的前提）。失败剔除的阈值通常取"完成度 + 至少一次成功子步"。Alibaba 通义实验室在公开材料里强调"日志质量直接决定 Skill 质量"。

- **③ Embedding & Clustering**：轨迹先用 LLM Encoder（如 `text-embedding-3-large`、`BGE-M3`、`Sentence-BERT`）编码成向量；接下来聚类，主流是 **HDBSCAN**（自动选 ε，密度不均的簇也能识别）。Voyager 系统的设计明确指出："**Skill Library 用常驻向量库做近邻检索**"。生产中还会做第二层聚类（按参数类型归并）。

- **④ LLM-based Abstraction**：把每个轨迹簇喂给 LLM（GPT-4 / Claude / Gemini-Pro），prompt 强制产出**结构化 Skill 模板**——含步骤列表、参数、触发条件、成功标准、失败回滚。**关键工程约束**：prompt 必须包含"参数化""可验证""含回滚"三条硬要求，否则 LLM 容易产出"叙事型"而非"可执行型" Skill。Anthropic 在 Claude 工具用法的工程文档里给出过类似的"结构化工具定义"范式。

- **⑤ Verification**：双轨——**离线**在保留标注集上跑命中率（hit_rate）和准确率（quality），**在线**做 A/B 实验，监控真实业务指标（CSAT / 解决率 / Token 节省率）。**关键阈值**：通常 `hit_rate ≥ 80%` 才能进入生产路径，低于阈值回炉抽象。Devin 的工程公开材料强调"verification 不是事后审核，而是流水线的一等模块"。

- **⑥ Skill Library**：入库到 **结构化的 Skill Store**（Postgres + Vector 索引 / 专用 Skill DB），含 Owner、版本号、Skill Hash、上游 Cluster Id、评估报告等元数据。Schema 应强制结构化——YAML / JSON Schema，避免 Skill 描述失控。这一层与第六章"资产化 / Asset Registry"天然联动。

- **⑦ Governance & Retrieval**：在线服务用**双路召回**——Embedding 近邻 + 关键词触发词匹配，再经 LLM 重排选出 Top-1 Skill。配套监控告警：命中率、调用频次、Skill 平均年龄、Owner 缺失率等。

**第三层：大规模数据下的工程挑战。**

- **轨迹量级**：成熟 Agent 单日轨迹可达 100 万+ 级。Embedding 算力昂贵，应做**粗筛 + 精筛**两段（按意图分类后只对高频意图做精 Embedding）。
- **聚类可扩展性**：HDBSCAN 在 50 万级向量上单机能跑；超过要走 **Spark / Ray 分布式**或**增量聚类**（仅重算受新轨迹影响的簇）。
- **LLM 抽象的成本**：大簇抽象一次要消耗数万 token；用**轻量模型（GPT-4o-mini / Claude Haiku）预筛候选再用大模型精抽**是常见解法。阿里通义实验室公开提到这一策略。
- **幻觉 Skill**：LLM 偶尔会输出"看起来合理但执行会炸"的步骤，必须靠验证集+回放机制兜底。
- **Skill 漂移**：业务变化后旧 Skill 命中率下降，需要**自动退役机制**（命中率 7 天下降超 30% 自动标红）。
- **冷启动**：没有任何轨迹时，回退到"**种子 Skill 库** + Self-Play 生成初始轨迹"。

**第四层：对比与选型决策表。**

| 业务 | 推荐流水线 | 关键差异 |
| --- | --- | --- |
| 客服 Agent | 离线周期挖掘 + Human-in-the-Loop | 稳定性优先 |
| Coding Agent | 在线 Procedural Memory + LLM 抽象 | 高频且需快速迭代 |
| 数学 / 代码 | Self-Play + 程序验证 | 可自动验证 |
| 高合规金融 | 离线 + 全量人工审核 | 可控优先 |
| 多 Agent 协作 | Cross-Agent Skill Transfer | 共享 Skill Library |

**3. 常见陷阱**

- **只画框图不讲师要点。** 七步流水线是常识，面试官要看每步的工程权衡。
- **忽略 LLM 抽象的"结构化硬约束"。** 没有强制 prompt 输出 JSON Schema 与"必含回滚步骤"，就出不了可执行 Skill。
- **不区分离线与在线验证。** 离线只能看历史标注分布，线上 A/B 才是真验证。
- **把 Embedding 当万能聚类。** 实际中很多场景需要"先按意图分类、再按动作模式聚类"两段式，单层 Embedding 容易把本质不同的轨迹压成一团。
- **忘了治理环节。** 没有治理，Skill 库会无限增长。

**4. 追问预测**

- **「如果日增 100 万条轨迹，聚类怎么扩？」** 答：两段式——先用意图分类模型粗筛到 N 个桶，每个桶内部独立 Embedding + 聚类；同时维护增量聚类（只对受新轨迹影响的簇做局部重聚）。背景可参考 LangChain 与 LlamaIndex 在 RAG 增量索引上的实践思路。
- **「LLM 抽象时怎么防幻觉？」** 追问见 §7.4.4。
- **「Skill 入库时如何决定 Owner？」** 答：**业务域映射规则**（客服类归客服团队 Owner），同时强制无 Owner Skill 不能上生产路径。Cognition Labs 内部 Skill Library 的公开材料强调明确 Owner 是治理的第一步。
- **「Skill 检索怎么避免召回过多无关 Skill？」** 答：**意图路由 → Embedding Top-K → LLM 重排**三段；Top-K 不能大（≤ 5），否则 LLM 选不准；同时 Skill 的"触发条件（trigger）"字段必须显式描述意图，便于意图路由过滤。
- **「怎么评估整条流水线的成本？」** 追问见 §7.4.6。

**5. 参考资料**

- Guanzhi Wang 等《Voyager: An Open-Ended Embodied Agent with Large Language Models》，arXiv 2023-11——端到端 Skill Library 构建流水线的开创性系统。
- Noah Shinn 等《Reflexion》，NeurIPS 2024——离线 + 在线自我反思 + Skill 积累的具体机制。
- LangChain / LangGraph 官方文档——Agent 状态与轨迹持久化的工程范式。
- Anthropic Engineering Blog《Building effective agents》（2024-10）——工具与 Skill 编排的工程纪律。
- Lilian Weng（前 OpenAI）博客《LLM-powered Autonomous Agents》——长期记忆 / 程序性记忆 / Trajectory 结构化存储的方法论总结。
- Alibaba 通义实验室、字节 Coze、智谱 GLM 等公开技术博客中关于 Agent 平台 Skill 治理与冷启动的工程经验（2024-2025）。
- **宁德时代电池质检工业大数据平台** —— 把电池缺陷检测工程师的操作轨迹按「埋点 → 清洗 → 聚类 → LLM 抽象 → 离线回放验证」流水线沉淀为「缺陷识别 Skill Library」，用于辅助新员工上岗，体现制造场景下行为日志到 Skill 的端到端闭环。
- **滴滴的司机端调度 Agent** —— 从每日亿级司机行为轨迹中挖掘「高峰调度、判责申诉、运力调度」等高频流程的 Skill 模板，验证百万级轨迹规模下的「粗筛 + 精筛」两段聚类与增量抽象策略。
- **京东零售客服行为日志聚类** —— 基于售后客服坐席的真实会话轨迹做 Embedding + 抽象，沉淀覆盖 70+ 高频售后场景的「售后处理 Skill Library」，证明电商客服域 Skill Mining 流水线的可复用性。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §7.4.3 在轨迹聚类环节，DBSCAN、HDBSCAN 和基于 Transformer 的序列聚类各有什么优劣？请结合 Agent 行为轨迹的特点给出算法选型建议，并说明参数（ε、min_samples 等）对聚类质量的影响。

**1. 考察点**

- 是否理解**轨迹聚类与传统文档聚类的差异**——轨迹是"序列 + 参数 + 时序"的多模态对象，不是纯文本。
- 能否说清三类算法在"**距离度量**""**簇形状假设**""**噪声处理**"上的本质差异。
- 是否能给出**参数级经验**（HDBSCAN 的 `min_cluster_size`，DBSCAN 的 ε 与 k-distance 图）。
- 加分项：能结合 Voyager / Reflexion 等论文中的具体用法做引用。

**2. 参考答案框架**

**第一层：轨迹聚类的特殊性。** Agent 轨迹不是普通文本。一个轨迹可能形如 `[tool_call(api_x, params=p), observe(o1), tool_call(api_y, params=q), observe(o2), …]`，由**离散的动作序列、嵌入型的观察描述、参数键值对**三部分组成。这意味着：

- **顺序敏感**：把"先验证再退款"和"先退款再验证"聚到一簇是错的——需要**序列级距离**，不能纯 Embedding 平均。
- **变长**：成功与失败轨迹长度差异大，距离度量要鲁棒。
- **结构与语义混杂**：动作名（`call_api: refund`）是离散符号，观察文本是自然语言，参数是结构化键值。

**第二层：DBSCAN。**

- **原理**：基于密度——给定半径 ε 内样本数 ≥ `min_samples` 视为核心点，向外扩展形成簇，标记未在任何人 ε 邻域的点为噪声。
- **优势**：不需要预设 k，能识别噪声，对任意形状的簇都适用。
- **劣势**：① **ε 敏感**——k-distance 图拐点法选 ε 在轨迹数据上经常失效（轨迹分布多重密度混合）；② **密度不均场景下大簇吞小簇**（一个 ε 同时管所有簇密度，必然偏向某一边）；③ 高维向量（embedding 维度常 ≥ 768）下距离趋于均匀，距离度量要先做 PCA 或 UMAP 降维。
- **参数经验**：ε 通常在 [0.05, 0.3] 之间（归一化后余弦距离）；`min_samples` 取 √N 量级效果较好。

**第三层：HDBSCAN。**

- **原理**：层次化 DBSCAN——先构造 mutual-reachability 距离，再凝聚式构建簇树，最后按 stability 选择稳定簇。核心优势是**无需预设 ε** 且**天然支持多密度簇**。
- **优势**：① ε 不敏感——自动选密度阈值；② 在密度极不均的轨迹分布上仍能识别出小簇；③ 兼容 DBSCAN 的噪声点处理；④ 计算稳定（复杂度 O(N log N)）。
- **劣势**：① `min_cluster_size` 仍要设置，太大吞小簇，太小碎屑簇；② 比 DBSCAN 慢（多一遍层次化计算）；③ 高维下同样要先降维；④ 簇边界不锐利——同一轨迹在不同 `min_cluster_size` 下可能被划入不同簇。
- **参数经验**：`min_cluster_size = 50~500` 视数据量与噪声容忍度；推荐**两层 HDBSCAN**——先大簇、再小簇（Recompute within each big cluster）。Voyager 系统的实现里就是这么做的。

**第四层：基于 Transformer 的序列聚类。**

- **原理**：用 Transformer Encoder（如 `bert-base` / `GPT-2 small` / `T5-encoder` / 专用轨迹预训练模型）对轨迹做表征，把变长序列映射为定长向量，再做余弦聚类（K-Means / 谱聚类 / 自编码器 + K-Means）。
- **优势**：① 序列敏感（位置嵌入天然处理顺序）；② 表征能力强，能捕捉动作间隐含关系；③ 可端到端微调——把 Skill 标注作为监督信号反向优化 encoder。
- **劣势**：① 需要**轨迹标注或对比学习预训练**（无监督常用 triplet loss）；② 大模型推理成本高（每条轨迹要过一次 Transformer）；③ 对短轨迹不友好（attention 容易稀释）；④ 可解释性差，调试难度大。
- **参数经验**：模型规模 `bert-base` 起步，序列长度 ≤ 512 tokens；学习率 2e-5~5e-5 区间；batch size 在 16~64（视显存）；微调 3~5 个 epoch 通常收敛。

**第五层：选型决策。**

| 数据特征 | 推荐算法 | 理由 |
| --- | --- | --- |
| 中小规模（≤50 万条）+ 簇密度不均 | **HDBSCAN** | 不需要选 ε，密度鲁棒 |
| 大规模（>50 万条）+ 强噪声过滤需求 | **DBSCAN + 粗筛** | 计算快，参数可控 |
| 复杂长轨迹（>2k tokens）+ 顺序敏感 | **Transformer + 谱聚类** | 序列敏感，表征丰富 |
| 有少量 Skill 标注可用 | **有监督微调 Encoder + K-Means** | 利用标签提升嵌入质量 |
| 完全冷启动 + 无标注 | **HDBSCAN + 多维度 Embedding** | 无监督起点最低 |

**第六层：参数调优与质量评估。**

- **参数调优**：用 **轮廓系数（Silhouette）** 与 **Davies-Bouldin 指数**评估簇内紧密度与簇间分离度；用**领域人工抽检**验证少量聚类簇的语义纯度。
- **常见调参动作**：① 对 Embedding 先做 UMAP / PCA 降维到 50 维再聚类——HDBSCAN 在降维后聚类质量显著提升；② 自定义距离度量（如 Levenshtein + Embedding 距离的加权混合）针对结构化轨迹。

**3. 常见陷阱**

- **直接把文本 Embedding 当轨迹 Embedding 用。** 这忽略了动作序列顺序与参数结构，聚类会出现"语义相似但顺序相反"的轨迹聚成一簇。
- **不降维直接 HDBSCAN。** 高维空间的距离趋于均匀，聚类结果噪声大。
- **只看轮廓系数不看领域人工抽检。** 数值好不等于业务可用。
- **死磕一个 ε / `min_cluster_size`。** 实操都是先粗后精、两段式。

**4. 追问预测**

- **「如果 Embedding 模型换了（如 BGE-M3 → text-embedding-3-large），需要重聚类吗？」** 答：需要。Embedding 空间的语义不一致，不能直接合并新旧聚类结果；建议**分版本聚类 + 跨版本 Skill Hash 关联**。
- **「聚类得到 1000+ 个簇怎么办？」** 答：做**二级聚合**——按参数类型与触发意图再做一层粗聚类，把语义相似的簇合并；同时给每个簇打"业务标签"便于检索。
- **「如何在聚类中处理多语种轨迹（中英混合）？」** 答：使用多语种 Embedding（如 `BGE-M3`、`Cohere embed-multilingual-v3`），并对动作符号做规范化（中英文同义动作归一）。
- **「Self-Play 生成的轨迹和真实用户轨迹要分开聚类吗？」** 答：**建议先合并后过滤**——Self-Play 数量更稳定，可作为先验；合并聚类后再做域内评估筛选。

**5. 参考资料**

- Ricardo J. G. B. Campello 等《Hierarchical Density Estimates for Data Clustering, Visualization, and Outlier Detection》，ACM TKDD 2015——HDBSCAN 的原始论文。
- Martin Ester 等《A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise》，KDD 1996——DBSCAN 的原始论文。
- Guanzhi Wang 等《Voyager》，arXiv 2023-11——Miner-T / Skill Library 实现中 HDBSCAN 与增量聚类的具体用法。
- McInnes L. 等《UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction》，arXiv 2018——HDBSCAN 前置降维的常用搭配。
- LlamaIndex / LangChain 官方文档——轨迹 Embedding 与语义检索在 Agent 平台中的工程实现。
- Hugging Face / Sentence-Transformers 官方文档——轨迹 Encoder 选型与训练范式。
- **美的美擎工业互联网平台的设备运维轨迹聚类** —— 在 IoT 设备运维场景下用 Transformer Encoder + 谱聚类对「报警 → 排查 → 处置」序列做聚类，因动作顺序对运维至关重要故采用序列敏感的距离度量，验证长轨迹 + 顺序敏感场景下的算法选型。
- **腾讯互娱王者荣耀匹配系统的玩家行为聚类** —— 用 UMAP 降维到 50 维再接 HDBSCAN 处理多密度玩家聚类，把多模态轨迹压到低维后聚类质量显著提升，体现 HDBSCAN「无需选 ε + 密度鲁棒」在亿级玩家行为场景的优势。
- **京东物流的配送员路径轨迹聚类** —— 在骑手行为聚类中采用「先意图分类粗筛 + 再 HDBSCAN 精聚」的两段式，针对结构化参数（订单类型 / 区域 / 时段）与自然语言备注混杂的轨迹设计混合距离度量。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开论文、官方文档或开源库文档。精确链接待联网环境补全。

---

#### §7.4.4 LLM 在抽象 Skill 时容易产生"幻觉 Skill"——输出看似合理但实际不可执行、或步骤与意图不匹配的 Skill。请从数据、Prompt、流程三个层面给出系统性防幻觉方案，并说明验证集该如何构建。

**1. 考察点**

- 是否理解 LLM 幻觉在 Skill 抽象场景的**具体形态**：虚构 API、虚构参数、步骤逻辑错误、遗漏失败回滚。
- 能否给出**多层防御方案**，而不是依赖单一 prompt trick。
- 是否了解 **LLM-as-Judge** 与**程序化校验**的分工。
- 加分项：能引用 Reflexion、Constitutional AI、阿里/字节等头部企业的真实校验机制。

**2. 参考答案框架**

**第一层：先把"幻觉 Skill"的形态分类清楚。**

| 幻觉类型 | 表现 | 危害 |
| --- | --- | --- |
| **虚构 API** | 编造不存在的 Tool 名（`call_api: ` + 不存在的 endpoint） | 调用即报错 |
| **参数幻觉** | 调用真实 Tool 但参数键名 / 取值范围错 | 静默错（最危险） |
| **步骤逻辑漏洞** | 漏掉权限校验、缺失败回滚、没有事务边界 | 业务事故 |
| **意图漂移** | Skill 实际干的事与触发条件不匹配 | 召回后行为混乱 |
| **过度抽象** | Skill 描述模糊、参数空泛 | 检索命中率虚高、执行失败 |

**第二层：数据层的防御。**

- **输入数据清洗**：在喂给 LLM 之前先把无效轨迹过滤掉——reward ≤ 0、step 数 < 2、参数全是默认值的"无信息轨迹"都不该进 Skill 候选。Anthropic 在 Constitutional AI 的数据管线中明确强调"质量 > 数量"。
- **轨迹归一化**：把工具调用、参数键、状态字段统一映射到权威 Schema，避免 LLM 在不同簇间看到不一致的命名而误归纳。
- **轨迹标注**：对少量高频轨迹做人工"任务分段标注"，这既作为评估基准也作为 few-shot 示例直接帮 LLM 学对格式。
- **代表性采样**：每个聚类簇只抽 ~20 条最有代表性的轨迹，避免 LLM 在噪声里抓出错误 pattern。

**第三层：Prompt 层的防御。**

- **强结构化约束**：prompt 必须强制输出 JSON Schema——含 `skill_name`、`trigger.intent`、`steps[]`（每步含 `action / params / expected_observation`）、`success_criteria`、`failure_rollback`、`required_tools`、`forbidden_tools`。Anthropic / OpenAI 的 tool definition 设计中都已采用这一模式。
- **必含字段校验**：prompt 末尾加自检——"输出前确认：① 每个 action 必须从上游轨迹里出现过；② success_criteria 可机器判定；③ failure_rollback 至少 1 条；④ 严禁输出未在轨迹里出现的 API。"
- **Few-shot 示例**：每个抽象任务配 2-3 个高质量 Skill 案例做示范，比纯指令更稳。Lilian Weng 的"Agent 经验总结"反复强调 few-shot 比 instructions 更可靠。
- **多模型交叉**：用 GPT-4 / Claude / Gemini 三家各自抽象，再用一个**汇总 Prompt** 提取共识；对争议点回退人工审核。Constitutional AI 的批评-修正循环就采用了类似思路。

**第四层：流程层的防御（最关键）。**

- **离线静态校验**（提交前）：对每个候选 Skill 跑**程序化校验**——
  - 工具白名单校验（`action` 必须在已注册 Tool 列表里）；
  - 参数 Schema 校验（每步参数键必须 Tool 接受）；
  - 关键步骤完备性（涉及资金 / 删除 / 权限变更必须有二次确认步骤）。
- **离线回放校验**：把 Skill 喂回沙箱 Agent 跑历史任务分布，看 hit_rate / quality。这一步是命中率红线。
- **在线 A/B 校验**：灰度上线 1% ~ 5% 流量，监控真实业务指标（CSAT、解决率、Token 节省率）。
- **LLM-as-Judge 抽样审核**：每天随机抽 5% 已上线 Skill，让一个独立的 LLM Judge 对照原始轨迹重审"语义一致性 + 步骤完备性 + 危险操作审查"。异常标红回炉。
- **人类兜底**：高风险域（金融、医疗、合规）的 Skill 必须有 **Human-in-the-Loop** 强制审核；首次入库前必须有 Owner 与 Reviewer 双签。Cognition Labs 的 Devin 工程实践与阿里通义的 Skill 治理都明确"高风险 Skill 上线必须人工复核"。
- **过期退役**：Skill 命中阈值监控——7 天 hit_rate 下降超 30% 自动冻结、推送 Reviewer。

**第五层：验证集如何构建。**

验证集构建有三条原则：

1. **分布一致性**：验证集必须覆盖真实分布——按意图频率分层采样（高频 / 中频 / 长尾各占一定比例），不能只用高频聚类。
2. **多样性覆盖**：在每个意图下至少包含"成功 / 部分成功 / 失败"三类轨迹样本，避免只评估"正确路径"。
3. **隔离性**：验证集**必须从所有训练 / 抽象数据中完全隔离**——同一意图的轨迹不能既参加聚类又进验证集，否则就是数据泄漏。

实践做法：

- **冷启动阶段**：用人工标注构造基准验证集（数百到数千条带 Skill 标注与预期结果的样本）。Anysphere Cursor 公开提到他们的 Code Skill 评估以"人工标注目录 + LLM Judge 二审"为基准。
- **运行阶段**：滚动收集线上未识别 Skill 的失败案例，定期补充到验证集，防止"分布漂移——验证集过好看线上一塌糊涂"。
- **对抗样本**：故意构造含诱导性参数的轨迹（如参数被伪装成实际安全参数的形态），测试 Skill 抽象是否会"上当"。

**3. 常见陷阱**

- **只靠 prompt trick。** Prompt 永远不能完全替代流程校验，"看起来合理但执行失败"的 Skill 必须靠回放验证拦截。
- **不区分"幻觉类型"。** 把"虚构 API"与"参数键错"混在一起讨论，无法给出对应的不同防御方案。
- **没有保留验证集版本。** Skill 库在增长，验证集必须冻结才能横向比较。
- **忽视了流程层的"程序化校验"。** LLM-as-Judge 仍然可能幻觉，**Schema 校验 + 工具白名单**这种机器规则才是底线。

**4. 追问预测**

- **「LLM-as-Judge 自身会幻觉，怎么破？」** 答：把 Judge 任务**拆细**——每个维度（动作合法性 / 参数合法性 / 步骤完备性 / 失败回滚存在性）独立判断，再汇总；同时**多模型投票**，分歧超阈值走人工。
- **「如何平衡验证严格度与 Skill 上线速度？」** 答：**分级审核**——低风险（文案 / 推荐）Skill 走自动校验命中阈值即上线；中风险（订单查询）需 LLM Judge + 灰度；高风险（资金 / 合规）必须人工双签。
- **「聚类本身错了，抽象出来也是垃圾，怎么办？」** 答：在抽象之前加一道"**簇纯度预检**"——抽样 5 条轨迹由 LLM Judge 判别是否语义一致，不一致则强制重聚或拆簇。
- **「Constitutional AI 与 Skill 防幻觉有什么关系？」** 答：Constitutional AI 把"价值观 / 行为规范"写成可读条文，让 LLM 在生成后自我批评修正——本质上是"**有原则的 LLM-as-Judge**"。可以照搬到 Skill 抽象。

**5. 参考资料**

- Noah Shinn 等《Reflexion》，NeurIPS 2024——Self-Reflection + 失败反思 → 沉淀 Skill 的循环，最早的"程序性对抗幻觉"模式之一。
- Yuntao Bai 等（Anthropic）《Constitutional AI: Harmlessness from AI Feedback》，2022——原则驱动自我批评与修正的范式，可直接迁移到 Skill 抽象的对抗验证。
- Anthropic Engineering Blog《Building effective agents》（2024-10）——结构化 Tool Definition 的工程纪律，间接给出 Skill 反幻觉的 prompt 模板范例。
- Lilian Weng（前 OpenAI）博客《LLM-powered Autonomous Agents》——长期记忆 / Skill 的反幻觉经验。
- Cognition Labs 关于 Devin 的公开技术报告（2024）——高风险 Skill 的人工复核与分级上线机制。
- Anysphere / Cursor 公开技术材料中关于 Composer Skill 质量审核的做法。
- 阿里通义实验室、字节 Coze 等公开技术博客中关于 Skill 验证集构建与对抗样本设计的方法（2024-2025）。
- **微众银行信贷 Agent 的 Skill 抽象防御** —— 采用「程序化校验 + 工具白名单 + LLM Judge 三轨防御」，任何涉及资金操作的 Skill 必须人工双签并通过离线回放校验，体现金融高风险域 Skill 的强制审核与对抗幻觉流程。
- **平安好医生医疗问诊 Skill 抽象** —— 强制 prompt 输出必含「禁忌症校验步骤 + 必填症状字段」，再叠加医学知识库 Schema 程序化校验，避免 LLM 在医疗场景漏掉关键安全步骤，体现医疗域 Skill 的强结构化约束与必含字段校验范式。
- **国家电网电力调度 Skill 库治理** —— 对「断路器操作、继电保护」等高风险 Skill 采用三级审核 + 离线回放校验 + 强制 Owner / Reviewer 双签，验证集按真实调度场景分层采样，体现能源政企域 Skill 治理的合规与安全底线。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §7.4.5 解释 Self-Play RL（自博弈强化学习）在 Agent 技能提取中的作用机制，并对比它与离线 Skill Mining、在线 Procedural Memory 在适用场景、训练成本、可验证性上的差异。请举例说明一个适合 Self-Play RL 提炼技能的真实场景。

**1. 考察点**

- 是否理解 Self-Play RL 的**核心机制**——Agent 自己生成任务、自己尝试、自己评估、总结 Skill。
- 能否与离线 / 在线方法做**结构性对比**（数据来源、训练成本、可验证性等）。
- 是否能联系 **AlphaGo Zero / AlphaProof** 的成功模式，理解"可自动验证任务"是其前提。
- 加分项：能指出 Self-Play RL 在"奖励设计"上的难点，以及失败模式。

**2. 参考答案框架**

**第一层：什么是 Self-Play RL。** Self-Play RL 指 Agent 不依赖人工提供任务，而是**自己生成训练任务、自己尝试执行、根据执行结果调整 Skill / 策略**的强化学习范式。其灵感来自 AlphaGo Zero（DeepMind 2017）——在没有人类棋谱的情况下，通过自我对弈生成训练数据并超越人类水平。

**第二层：Self-Play 在 Agent Skill Extraction 中的循环。**

```
        ┌──────────────────────────────────────┐
        │                                      │
        ▼                                      │
   生成任务(T)  ──────┐                        │
        │             │                        │
        ▼             ▼                        │
   执行任务(用 Skill Library) ──► 评估成败    │
        │                                      │
        ├──── 成功 → Skill 强化（再加权重 / 加训练样本）
        │
        └──── 失败 → 探索 / 总结新 Skill 加 Library
                                                  
        循环 N 轮 → Skill Library 持续扩张 + 能力提升
```

每一轮 Self-Play 包含四个动作：**生成任务 → 用 Skill 尝试 → 评估 → 沉淀**。评估必须可机器判定（否则 Self-Play 失去意义）。失败轨迹会被拆解——哪一 Skill 缺失 / 哪一步出错——并尝试总结新 Skill。

**第三层：三种方法的多维度对比。**

| 维度 | 离线 Skill Mining | 在线 Procedural Memory | Self-Play RL |
| --- | --- | --- | --- |
| 数据来源 | 真实用户轨迹 | 真实在线轨迹 | Agent 自行生成 |
| 适用场景 | 稳定业务、客服 | 高频代码 / 重复任务 | 数学、代码、游戏 |
| 训练成本 | 中（一次 Embedding + 聚类 + 抽象） | 低（增量抽象） | 高（大量环境交互、奖励信号计算） |
| 可验证性 | 中（要人工标注验证集） | 中（线上 A/B） | 高（任务可判定） |
| Skill 真实性 | 高（来自真实场景） | 最高（线上行为） | 中（合成任务可能有偏） |
| 失败模式 | 噪声干扰聚类 | 冷启动困难 | 奖励黑客 / 模式坍缩 |
| 典型代表 | Cursor / Devin / 阿里通义 | Reflexion 在线模式 | AlphaGo Zero / Voyager 部分 |
| 计算开销 | 中 | 低 | 高（GPU 小时数） |
| 隐私友好度 | 中（要收集用户轨迹） | 中 | 高（无须用户数据） |

**第四层：Self-Play RL 的前提条件与失败模式。**

- **前提**：必须能**自动判定任务成败**——代码是否通过单测、数学证明是否正确、游戏是否获胜。这是"自博弈"可以无限循环的根本。
- **三个关键失败模式**：
  1. **奖励黑客（Reward Hacking）**：Agent 学会"讨巧"而非真正解决问题。例：在代码任务里反复输出能骗过编译器的空函数体。
  2. **模式坍缩（Mode Collapse）**：Skill Library 集中到几个高频模式，长尾能力退化。
  3. **任务分布偏移**：自生成的任务偏离真实分布，训出的 Skill 在真实场景下失效。

**第五层：真实场景——一个完整的 Self-Play Skill 提炼案例（Code 任务）。**

以 **SWE-bench** 风格代码任务为例：

- **任务生成**：Agent 接受一个 GitHub Issue，LLM 生成"候选 Patch + 单元测试"作为任务。
- **执行与评分**：在沙箱里运行测试集，全部通过即胜。
- **Skill 沉淀**：
  - 成功 → 把"读 Issue → 复现 Bug → 定位 → 修 → 验证"的步骤序列沉淀为 Skill；
  - 失败 → 拆解失败原因（定位错 / 编译错 / 测试不全），尝试在 Skill Library 中**新增**细分 Skill（"读 stack trace 找异常类""反向 trace 调用栈"）。
- **真实工业验证**：Cognition Labs 的 **Devin** 在 SWE-bench 上的领先结果，部分依赖了 Self-Play + Self-Reflection 训练范式；Cursor 公开技术博客提到 Composer 内部也用 Self-Play 生成多语言重构训练样例。DeepMind 的 **AlphaProof** 与 **AlphaCode 2** 是更宏观层面的 Self-Play 在数学与算法上的成功。

**第六层：场景适配——哪些适合 Self-Play，哪些不适合。**

| 场景 | 是否适合 Self-Play | 理由 |
| --- | --- | --- |
| 数学证明（AlphaProof） | ✅ | 答案可机器判定 |
| 代码编写（Devin / AlphaCode） | ✅ | 编译 / 单测可判定 |
| 游戏策略（Voyager Minecraft） | ✅ | 胜负 / 任务完成度可判定 |
| 客服对话 | ❌ | CSAT 不可机器判定 |
| 内容创作 / 文案 | ❌ | 质量主观 |
| 金融决策 | ⚠ 部分 | 合规 / 风控规则可机器验证，但执行仍需人工 |
| 数据分析查询 | ✅（受限） | SQL 正确性可判定，但业务口径需要人工 |

**3. 常见陷阱**

- **把 Self-Play 当万能解。** 它的前提是"任务可机器判定"——在客服、医疗、法律等主观任务上根本玩不转。
- **忽视奖励黑客。** Self-Play 的最大反模式——Agent 用投机取巧骗过奖励信号，Skill Library 看起来在涨，但实质能力没提升。
- **没有区分 Self-Play 与 Synthetic Data Generation。** Self-Play 是"在交互中学"，纯合成数据生成（如用 LLM 批量造训练样本）只是数据增广，不是 Self-Play。
- **忽略计算成本。** 一轮 Self-Play 往往消耗数百到数千 GPU 小时，Cerebras / DeepMind 等机构都配备专用算力。

**4. 追问预测**

- **「Self-Play 训练出来的 Skill 如何迁移到真实业务？」** 答：双轨——**真实任务再微调**（用真实轨迹作为有监督信号修正 Skill 摘要）；**离线 / 在线 Skill Mining 做互校验**（Self-Play 发现的 Skill 与真实轨迹学到的 Skill 比对，公共部分可直接入库，独有部分人工评审）。
- **「奖励黑客怎么检测和抑制？」** 答：① 设计**多维奖励**（不只判结果正确，还判过程合理）；② **对抗性评估集**——故意构造"投机取巧就能过关但实质错误"的样本；③ **定期人工抽查 Skill 步骤的语义一致性**。Anthropic / DeepMind 的 RLHF / RLAIF 文献里反复强调这一点。
- **「Self-Play 与 RLHF 是什么关系？」** 答：**RLHF** 用人类反馈训练奖励模型；**Self-Play** 完全无人类反馈。**RLAIF**（Anthropic 提出）则是用 AI 反馈做强化，可以视为 Self-Play 的一种特殊形态。
- **「Voyager 是 Self-Play 吗？」** 答：是混合范式——既用 Self-Play 探索 Minecraft 世界生成任务，又依赖 LLM 作为"语义奖励"判断行为质量，更接近 **Self-Play + LLM-as-Judge**。
- **「Self-Play 与 Self-Refine 的关系？」** 答：Self-Refine 是单轮内的"输出→批评→修正"循环；Self-Play 是多轮、多任务的迭代训练。Self-Refine 可以嵌套在 Self-Play 的单轮执行中。

**5. 参考资料**

- David Silver 等（DeepMind）《Mastering the Game of Go without Human Knowledge》（AlphaGo Zero），Nature 2017——Self-Play RL 的奠基性工作。
- David Silver 等（DeepMind）《Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm》，2017——Self-Play 范式在多个博弈任务上的推广。
- Guanzhi Wang 等《Voyager》，arXiv 2023-11——Self-Play + Skill Library 在开放环境中的完整实现。
- DeepMind 关于 **AlphaProof**（2024，IMO 解题）与 **AlphaCode 2**（2023-2024）的公开技术报告——Self-Play + RL 在数学与代码上的工业级验证。
- Anthropic《Constitutional AI: Harmlessness from AI Feedback》与 RLAIF 系列论文——AI 反馈代替人类反馈的强化训练，可视为 Self-Play 的延伸。
- Cognition Labs 关于 Devin 训练范式的公开材料（2024-2025）。
- Noah Shinn 等《Reflexion》，NeurIPS 2024——Self-Play 与 Self-Reflection 的工程耦合范式。
- **米哈游原神 / 崩坏：星穹铁道的 NPC 战斗 Skill Library** —— 通过 Self-Play 让 NPC Agent 自主生成对战任务、尝试多种技能组合并按胜负评估，逐步沉淀可复用的战斗 Skill 库，体现游戏域「任务可机器判定 + 自博弈循环」的 Self-Play 范式。
- **鹰角网络明日方舟的关卡解法 Self-Play** —— 让 Agent 自主探索关卡、尝试编队组合并按通关结果归纳「战术 Skill」，验证合成任务生成 + 真实结果判定的 Self-Play 闭环在策略类游戏中的适用性。
- **网易雷火永劫无间的 NPC 行为训练** —— 在吃鸡 / 多人对抗场景下用 Self-Play 让 NPC 自主生成战术、归纳新 Skill，证明 Self-Play 在「胜负可判定」博弈类游戏中的规模化应用与 Reward Hacking 抑制实践。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §7.4.6 当 Skill Library 从 1k 量级扩张到 100k+ 量级时，会出现检索召回困难、Skill 冲突、版本失控等问题。请阐述大规模 Skill Library 的治理与检索架构，并给出 ROI 评估的可量化方法。

**1. 考察点**

- 是否理解**Skill 库的规模曲线**——它是"边际效用先升后降"的，需要治理干预才能维持质量。
- 能否给出**多级分类 + 向量检索 + LLM 重排**的检索架构，而不是一刀切的全量 Embedding。
- 是否能针对**Skill 冲突、Skill 爆炸、Skill 老化**等问题提出系统方案。
- 加分项：能用具体公式 / 阈值给出 ROI 评估的可量化方法。

**2. 参考答案框架**

**第一层：先把"规模化的痛点"列清楚。**

| 规模 | 主要痛点 | 表现 |
| --- | --- | --- |
| **100 ~ 1k** | 几乎无治理也能跑 | 检索靠 embedding Top-K 还能命中 |
| **1k ~ 10k** | 召回噪声、Skill 间相似冲突 | Top-K 容易召回 2 个相近 Skill，Agent 选不准 |
| **10k ~ 100k** | 检索延时上升、版本失控 | Embedding 检索变慢；多个版本并存导致行为漂移 |
| **100k+** | 维护成本 ≫ 创建成本 | Skill 治理工单堆积；命中率反降 |

**第二层：大规模 Skill Library 的检索架构。**

```
                 用户任务（Query）
                       │
                       ▼
             ┌─────────────────────┐
             │ ① 意图路由（Intent Router） │
             └────────┬────────────┘
                      │  (粗筛到 N 个候选域)
                      ▼
             ┌─────────────────────┐
             │ ② 域内语义召回       │  ← Embedding + 关键词混合
             └────────┬────────────┘
                      │   Top-K (K ≤ 5)
                      ▼
             ┌─────────────────────┐
             │ ③ LLM 重排 / 选择    │  ← Cross-Encoder 或 LLM 选最合适
             └────────┬────────────┘
                      │   1~3 个候选 Skill
                      ▼
             ┌─────────────────────┐
             │ ④ 执行 + 反思        │  ← 失败 → 反思落 Procedural Memory
             └─────────────────────┘
```

**关键设计**：

- **意图路由**：维护一级分类树（业务域 → 任务类），把 Top-50k 候选压到 1~2k 量级。可以基于意图分类模型（轻量 BERT / LLM zero-shot 分类）。
- **语义召回 + 关键词混合**：纯 Embedding 容易在长尾 / 命名实体匹配上失效；引入关键词触发词匹配（BM25 / Elastic Search），与 Embedding 加权融合。
- **LLM 重排**：把候选 Skill 的"trigger 描述 + 步骤摘要"喂给 LLM 让其选最合适的 1~3 个。这是 Anthropic / OpenAI 在 Tool Use 选型上的标准做法。
- **强制 Top-1 上限**：永远不要让 Agent 自己从 Top-10 中"自由挑选"，否则就会混乱。

LangChain 的 **Self-RAG**、LlamaIndex 的 **agents** / **QueryEngine** 都采用了类似三段式召回范式。

**第三层：大规模 Skill Library 的治理机制。**

- **Skill 分级与 Owner**：每个 Skill 必须有 Owner + Reviewer 双签；按业务域划 Owner。**无 Owner Skill 不能进生产路径**。
- **Skill 版本化**：Skill 必须有语义化版本号；每次聚类 / 抽象 / 人工编辑都生成新版本，老版本默认 N 天后自动退役。
- **Skill 去重与合并**：周期性合并"语义一致、步骤相似"的 Skill（用 Embedding 余弦相似度 + LLM 判定），避免 Skill 库无限膨胀。
- **Skill 冲突检测**：
  - **静态检测**：同一意图下两个 Skill 步骤互斥（一个说要"提交退款"、另一个说"拒绝退款"）——用 LLM Judge 自动标红。
  - **动态检测**：A/B 同一意图下两个高版本 Skill，监控竞争胜出率与失败率。
- **Skill 老化与退役**：
  - **指标红线**：7 天 hit_rate 下降 > 30%、15 天未被调用的 Skill——自动标记候选退役。
  - **退役流程**：退役前必须迁移下游客群（如推荐库有调用方），没有调用方的可以直接下架。
- **Skill 安全与权限**：
  - **权限标签**：每个 Skill 标注所需权限（资金 / 写操作 / 跨租户），运行时强制 RBAC 校验。
  - **审计日志**：Skill 的调用方、输入参数、输出结果全量审计，便于事后追溯（金融 / 医疗合规模型必备）。

**第四层：跨 Agent / 跨组织的 Skill 共享。**

- **共享 Skill Library**：所有 Agent 共享同一 Skill Library，但通过**权限域**隔离可见性。
- **Skill 联邦**：跨组织 Skill 共享——同态加密 / 差分隐私保护商业敏感 Skill（如金融风控 Skill）。
- **Skill Market**：把 Skill 视作资产化商品发布 / 订阅 / 计费，参考 LangChain Hub、Hugging Face Spaces 等机制。

**第五层：ROI 评估的可量化方法。**

ROI 是 Skill Library 上线决策的关键依据，需要从**收益侧**与**成本侧**两端量化。

**收益侧**：
1. **Token 节省收益**：`ΔToken = (原每任务 token) - (用 Skill 后每任务 token)` → `节省费用 = ΔToken × Token 单价 × 月调用次数`。
2. **一致性收益**：CSAT / 解决率提升带来的业务价值 = `ΔCSAT × 单会话业务权重 × 月调用次数`。
3. **人力节省**：自动提取减少的人工 Skill 编写工时 = `Δ工程师时 × 时薪 × 半年 Skill 总数`。
4. **新场景加速**：冷启动从 2 周降至 1 天——按业务 ROI 折算。

**成本侧**：
- **平台建设成本**：Embed 服务器 + 聚类 + LLM 抽象 + 存储 + 检索服务的建设摊销。
- **运行成本**：LLM 抽象的 token 消耗 + Skill 验证的算力 + 命中率监控的存储。
- **治理成本**：Owner Reviewer 人工审核工时。

**ROI 公式**：

```
ROI = (Token 节省 + 一致性提升 + 人力节省 + 冷启动加速收益) 
        / (平台建设 + 运行 + 治理成本)
```

**经验阈值**（来自 Anysphere Cursor / Cognition Devin / 阿里通义等公开材料）：
- 健康 ROI 通常在 12-18 个月内达到 ≥ 3×。
- Token 节省在稳定场景下可达 30-50%。
- CSAT 提升在客服场景下约 5-15%（一致性收益）。
- Skill 命中率在稳定运营第 6 个月应 ≥ 80%（低于此阈值说明 Skill 质量或检索有问题）。

**第六层：常用治理指标看板。**

| 指标 | 阈值 | 异常处理 |
| --- | --- | --- |
| Skill 命中率 | < 80% | 检查 Embedding 模型 / 触发词 / LLM 重排 |
| Skill 调用频次 Top10 集中度 | > 70% | 长尾 Skill 被遗忘，考虑合并 / 下架 |
| Skill 平均年龄 | > 90 天 | 缺乏更新，纳入下一轮 Self-Play |
| 无 Owner Skill 占比 | > 5% | 强制 Owner 分配 |
| Skill 验证平均耗时 | > 4 h | 校验流水线瓶颈，需扩容或简化 |
| Skill 退役速率 | < 1%/月 | 长期不退役导致膨胀 |

**3. 常见陷阱**

- **只讲建设不讲治理。** 治理才是从 1k 迈向 100k 的真正门槛。
- **Top-K 越大越好。** K > 5 后 LLM 选择准确率显著下降；Top-1 反而优于 Top-10。
- **没有版本管理。** 没版本管理的行为就是"在生产随机游走"。
- **忽视权限标签。** 没有权限标签等于每个 Skill 都是 root Skill，事故无法挽救。
- **ROI 公式只算 Token 节省。** 漏掉一致性、人力、冷启动等其他收益，会让决策层低估 Skill Library 的价值。

**4. 追问预测**

- **「跨团队共享 Skill 如何避免互相干扰？」** 答：**域隔离 + 权限分层**——每个租户 / 团队只看自己有权限的 Skill；变更走 PR 流程而不是直接覆盖。LangChain Hub、阿里通义"集团级 Skill 库"都采用这一模式。
- **「100k Skill 库的 embedding 检索怎么优化？」** 答：**分层索引（Hierarchical Navigable Small World, HNSW）+ 分片**；维护"域 → 类 → Skill"三级路由；过期 Skill 单独存放避免污染主索引。Facebook AI Similarity Search (FAISS) 与 Milvus 是工业级向量库的典型实现。
- **「如何在不重新训练的前提下，让旧 Skill 跟上新的 LLM？」** 答：**Skill 是外挂的**，天然免疫——只要 trigger 描述正确，换了底层 LLM 后 Skill 仍然适用。这正是 Skill 相对微调的核心优势，也是 Anthropic 在 2024 多模型兼容设计上的关键论据。
- **「Skill Market 是必要的吗？」** 答：业务规模大、跨团队复用频繁才需要。中小规模"团队级 Skill Library + 跨团队共享会议"就够，不必过早投入 Market 化。

**5. 参考资料**

- LangChain Hub、Hugging Face Spaces 等 Skill / Prompt 共享平台的公开材料——跨组织 Skill 共享的工程范式。
- Meta AI《Faiss: A Library for Efficient Similarity Search》——大规模向量检索的工业实现（涵盖 HNSW / IVF 等索引）。
- Yu. A. Malkov 与 D. A. Yashunin（HSE 等）《Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs》——HNSW 原始论文，是 Milvus / HNSWlib / FAISS-HNSW 等工业向量库的算法基础。
- Anthropic Engineering Blog《Building effective agents》（2024-10）——Skill 治理、版本控制、权限审计的工程纪律。
- Lilian Weng（前 OpenAI）博客《LLM-powered Autonomous Agents》——长期记忆的检索架构与容量管理。
- Anysphere / Cursor 公开技术博客——Composer Skill Library 的多语言重构、Token 节省与一致性提升案例。
- Cognition Labs 关于 Devin 的公开技术报告——SWE-bench 上的 Skill 命中率与 ROI 数据。
- 阿里通义实验室、字节 Coze 等公开材料——大规模 Agent 平台的 Skill 治理经验（2024-2025）。
- **京东数科金融风控 10 万+ Skill 库** —— 采用「意图路由 → Embedding 召回 → LLM 重排」三段式检索架构，强制 Top-K ≤ 5，并对核心风控 Skill 做双链路热备 + 全量审计日志，体现金融域 Skill 在权限 / 合规 / 检索精度上的最严要求。
- **中信证券投研 Agent 的分级 Skill Library** —— 按 P0/P1/P2 分级治理投研类 Skill，对高风险 Skill（涉及交易信号生成）做强制双签 + 灰度上线 + 过期自动冻结，体现证券域 Skill 的合规治理与版本管控范式。
- **屈臣氏零售 CRM Agent 的 1 万+ 营销 Skill 治理** —— 按业务域划 Owner、每月清理僵尸 Skill、用 Embedding 余弦相似度做重复 Skill 合并，体现零售域跨门店 / 跨业态复用场景下的 Skill 生命周期管理实践。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

### 8.3 本章小结

本节收录 6 道题，覆盖 §7.4「Agent 技能提取」一个子章节的**三个认知阶梯**：

**第一阶梯——概念定位**（§7.4.1）：辨析 Skill Extraction 与 RAG / Prompt / Fine-tuning 的本质差异，建立"Skill = 程序性记忆（How）"的认知锚点。

**第二阶梯——工程实现**（§7.4.2、§7.4.3、§7.4.4）：完整流水线、轨迹聚类算法选型、LLM 抽象的反幻觉体系——这是 Skill Extraction 落地的三大工程支柱。

**第三阶梯——进阶与运营**（§7.4.5、§7.4.6）：Self-Play RL 的范式与边界、大规模 Skill Library 的治理与 ROI 评估——决定系统能否真正规模化生产。

参考答题的通用心法：**先说清 Skill Extraction 在"知识如何注入 Agent"主轴上的位置 → 再分层讲工程实现与失败模式 → 最后说清规模化的治理与 ROI**。这一主题下，面试官真正想听的是"你能否兼具学术视野（Voyager / Reflexion）与工程落地（Cursor / Devin / 阿里通义等）"——两端的认知缺一不可。

### 8.4 返回

- 返回 [07-agent-evolution 章节目录](../../README.md)
