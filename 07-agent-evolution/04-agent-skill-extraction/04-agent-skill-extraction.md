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

> 本节内容待补充。题源待与原 PDF《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）题库对齐。读者可参考本节结构，按"全景视图 → 分主题展开 → 横向小结 → 本章小结"四段式自检。

读者可以自检的常见面试问题：

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

参考答案要点：

1. RAG 是"是什么"（知识检索），Skill Extraction 是"怎么做"（动作归纳）。
2. 收集日志 → 清洗 → 聚类（HDBSCAN）→ LLM 抽象 → 验证 → 入库。
3. HDBSCAN 是层次化 DBSCAN，自动选 epsilon，簇密度不均时更稳定。
4. 验证集 + 人工审核 + 置信度阈值 + 多模型交叉验证。
5. 可自动验证的任务（数学、代码、游戏），不需人工标注。
6. 在新任务集上跑 Skill，成功率 + 准确率；验证集要多样化、覆盖真实分布。
7. Skill Library 输出 Skill 到 Asset Registry，关联版本、Owner、评估报告。
8. 人工编写种子 Skill + Auto-Skill + Self-Play。
9. Semantic Memory 是抽象知识（"VIP 用户..."），Procedural Memory 是步骤序列（"先验证、再退款..."）。
10. ROI = (Skill 复用节省 + 自动提取节省 + 一致性提升) / 平台成本。
