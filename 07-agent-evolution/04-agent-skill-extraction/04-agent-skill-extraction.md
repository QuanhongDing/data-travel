# Agent 技能提取（Agent Skill Extraction）

> **一句话定位**：从 Agent 行为日志中自动提取可复用的 Skill / Procedure——让 Agent 自己总结"经验"，让组织能力沉淀为 Agent 能力。

> 本文是 data-travel 项目 [Ch7 · AI 资产沉淀与自进化](../../README.md) 的子章节（04-agent-skill-extraction）。覆盖核心职责④ 中"自进化 / Skill 自动发现"核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| Skill 提取是什么 | §1.1、§2.1 |
| 如何从行为日志自动提取 Skill | §3.1、§4.1 |
| Procedural Memory / Self-Play RL | §2.3、§5.4 |

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
- 2024 阶段：Self-Play RL、Auto-Skill。
- 2025 阶段：Procedural Memory 建模、Skill Mining + Workflow Discovery。
- 2025+：自驱动 Skill Library（Agent 自己发现 + 验证 + 应用）。

各阶段关键节点：

| 时间 | 事件 | 关键贡献 |
| --- | --- | --- |
| 2022 | LangChain Agents | 手工定义工具列表 |
| 2022 | ReAct | 推理 + 行动 |
| 2023 | AutoGPT | 自动任务分解 |
| 2023 | Reflexion | 自我反思 + Skill 积累 |
| 2023-11 | Voyager（Minecraft） | 自动技能库发现 |
| 2024 | Self-Play RL | 自我博弈生成训练数据 |
| 2024-06 | Auto-Skill（学界） | LLM 自动生成 Skill |
| 2024-08 | Cursor Composer | IDE 中的 Skill 编排 |
| 2024-10 | Devin（Cognition） | 端到端 Coding Agent |
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

> 💡 **思考锚点**：从你 Agent 最近的一批执行轨迹里挑一簇相似任务，按 2.3.3 给它算一次命中率 = count(success) / len(T_new)——你的新任务集分得够干净吗？若 2.3.1 的密度阈值把长尾任务都划成噪声点，你抽象出的 Skill 模板还适用于新任务，还是只把训练轨迹背了一遍？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](04-agent-skill-extraction-section-3-sec3.md)
- [§4. 工程实现](04-agent-skill-extraction-section-4-sec4.md)
- [§5. 前沿演进](04-agent-skill-extraction-section-5-sec5.md)
- [§6. 落地实践](04-agent-skill-extraction-section-6-sec6.md)
- [§7. 与其他方法对比](04-agent-skill-extraction-section-7-sec7.md)
- [§8. 面试真题集](04-agent-skill-extraction-section-8-sec8.md)

---
