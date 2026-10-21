# 反馈闭环（Feedback Loop）

> **一句话定位**：把用户的每一次点击、每一次纠正、每一次"没用"——变成模型迭代的燃料，让 Agent 越用越聪明。

> 本文是 data-travel 项目 [Ch7 · AI 资产沉淀与自进化](../../README.md) 的子章节（02 反馈闭环）。覆盖核心职责④ AI 资产沉淀与自进化系统中"反馈数据采集 → 模型迭代"闭环核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 反馈闭环是什么，为什么必须有 | §1.1、§1.2 |
| Human-in-the-Loop / RLHF / DPO / GRPO 怎么选 | §2.1、§2.2 |
| 反馈数据怎么采集、清洗、归因 | §4.1、§4.2 |
| AI 产品的 A/B 测试怎么做 | §4.1、§4.2 |

---

## 1. 概念与定位

### 1.1 是什么

**反馈闭环（Feedback Loop）** 是 AI 系统中把"用户行为 / 人类反馈"持续回流到训练 / 评估环节的工程闭环。它是 AI 系统的"自进化"基础设施。

核心环节：

```
用户交互 → 反馈采集 → 反馈清洗 → 归因分析 → 训练数据 → 模型迭代 → 重新部署
```

进一步拆解核心环节的工程要素：

| 环节 | 输入 | 输出 | 关键问题 |
| --- | --- | --- | --- |
| 反馈采集 | 用户交互日志、显式打分 | 原始反馈流 | 采集什么？颗粒度？ |
| 反馈清洗 | 原始反馈流 | 干净反馈 | 噪声 / 漂移 / 恶意 |
| 归因分析 | 干净反馈 | 归因结果 | 哪个动作 / Prompt 错了？ |
| 训练数据 | 归因结果 + 偏好标注 | 训练样本 | preference / 演示 / 纠错 |
| 模型迭代 | 训练样本 | 新模型 / 新 Prompt | RLHF / DPO / GRPO |
| 重新部署 | 新模型 | 在线服务 | A/B / 灰度 / 回滚 |

### 1.2 为什么需要

- **业务驱动力**：模型上线后如果没有反馈，准确性随数据漂移逐步下降。
- **合规要求**：金融、医疗行业要求"模型有人监管"。
- **AI 产品成熟度**：没有反馈闭环的 AI 产品只是"一次性玩具"。

**痛点**：
- 某 LLM 应用上线 6 个月效果下降 40%——没有反馈数据采集。
- 某推荐系统用户投诉激增——没有用户主动反馈机制。
- 某客服 Agent 重复犯错——没有纠错回流。

更系统的失败模式：

| 失败模式 | 表现 | 根因 |
| --- | --- | --- |
| 模型漂移 | 准确性随时间下降 | 数据分布变化但无反馈 |
| 偏好失真 | 模型偏好与用户偏好脱节 | 无显式反馈通道 |
| 错误反复 | 同一错误反复出现 | 无纠错数据回流 |
| 用户流失 | 用户放弃使用 | 满意度无可观测指标 |
| 合规失败 | 不符合"人参与"监管 | 无 HITL 痕迹 |

**AI 时代新诉求**：
- 反馈实时化（用户当下反馈→秒级响应）。
- 反馈多模化（语音 / 表情 / 行为 / 评分）。
- 反馈语义化（用户说"答非所问"→映射到具体检索失败）。
- 反馈自驱动（Agent 自我评估 → 自我修正）。
- 反馈治理化（反馈数据本身也是 AI 治理对象）。

### 1.3 演进

- 传统阶段：用户调研、A/B 测试（Yahoo、Google）。
- ML 阶段：隐式反馈（点击、停留时长）。
- LLM 阶段：RLHF、DPO、GRPO、Human-in-the-Loop、Eval-Driven Development。
- Agent 阶段：Self-Improvement、Constitutional AI、Online DPO。

各阶段关键节点：

| 阶段 | 时间 | 关键事件 |
| --- | --- | --- |
| 传统 A/B 测试 | 2000-2010 | Google / Yahoo 流量分层实验 |
| 隐式反馈 ML | 2010-2015 | CTR 模型 + 行为日志 |
| RLHF 兴起 | 2017-2022 | Christiano 2017、InstructGPT 2022 |
| DPO 替代 | 2023 | Rafailov 2023 直接偏好优化 |
| GRPO 提出 → 突破 | 2024-2025 | DeepSeekMath 提出，DeepSeek-R1 组内相对优化 |
| Self-Improvement | 2024-2025 | Self-Play / Self-Refine / Constitutional AI |
| Online Learning | 2025+ | 实时反馈驱动实时训练 |

### 1.4 在 AI 时代数据架构中的位置

反馈闭环是 AI 系统的"血液循环"，无处不在：

```
       业务系统（Agent / App）
            ↓ 用户行为 + 显式反馈
       反馈采集层（埋点 + SDK）
            ↓
       Feedback Lake（原始反馈）
            ↓ 清洗 + 归因
       训练数据工厂（偏好对 / 演示 / 纠错）
            ↓ 训练
       模型 / Prompt 仓库
            ↓ A/B + 灰度
       部署回业务系统
```

反馈闭环跨越本仓库多个章节：
- 与 Ch3 数据全栈基础设施（Feedback Lake 是 Ch3 数据基础设施的延伸）。
- 与 Ch5 Agent 平台（反馈是 Agent 自进化的输入）。
- 与 Ch6 多模型编排（不同模型需要不同反馈信号）。
- 与 Ch7 长期记忆（记忆的"重要性评分"依赖反馈）。
- 与 Ch7 资产管理（资产评估依赖反馈）。
- 与 Ch7 技能提取（优秀会话筛选依赖反馈）。
- 与 Ch8 AI 治理（反馈数据是审计对象）。

---

## 2. 核心原理

### 2.1 关键概念

| 概念 | 定义 | 例子 |
| --- | --- | --- |
| **显式反馈** | 用户主动评分 / 标注 | 点赞 / 点踩 / 评分 |
| **隐式反馈** | 用户行为信号 | 点击 / 停留 / 复制 / 分享 |
| **Human-in-the-Loop（HITL）** | 人在关键决策点介入 | 标注、审核、纠错 |
| **RLHF** | Reinforcement Learning from Human Feedback | ChatGPT 早期训练 |
| **DPO** | Direct Preference Optimization | 不需要 RL 的偏好学习 |
| **GRPO** | Group Relative Policy Optimization | DeepSeek-R1 训练 |
| **A/B 测试** | 对照实验 | 50% 流量看新版 |
| **Interleaving** | 交叉展示 | 同时展示 A、B 结果 |
| **Eval-Driven Development** | 评估驱动开发 | 测试集是 CI 的一部分 |
| **Reward Model** | 奖励模型 | 给 LLM 输出打分 |
| **Preference Pair** | 偏好对 | (prompt, chosen, rejected) |
| **Online Learning** | 在线学习 | 流式更新模型 |
| **Contextual Bandit** | 上下文老虎机 | 个性化推荐 |
| **Self-Improvement** | 自我进化 | Self-Play / Self-Refine |
| **Constitutional AI** | 宪法式 AI | LLM 替代人类标注 |

### 2.2 关键算法

| 算法 | 原理 | 适用 |
| --- | --- | --- |
| **RLHF** | PPO + Reward Model | 通用 LLM 对齐 |
| **DPO** | 直接优化偏好 | 替代 RLHF，更稳定 |
| **GRPO** | 组内相对优化 | DeepSeek-R1 |
| **KTO** | Kahneman-Tversky Optimization | 不需要成对偏好 |
| **IPO** | Identity Preference Optimization | 防过拟合 |
| **Online Learning** | 流式更新 | 推荐、风控 |
| **Contextual Bandit** | 上下文老虎机 | 个性化推荐 |
| **Self-Play** | 自我博弈 | 游戏 / 推理 |
| **Self-Refine** | 自我反思修正 | 生成任务 |
| **Constitutional AI** | LLM 按宪法自我评判 | 安全 / 价值观对齐 |

#### 2.2.1 RLHF 详解（PPO + Reward Model）

RLHF 是 ChatGPT 早期对齐的核心方法，分三步：

**Step 1：SFT（Supervised Fine-Tuning）**
- 用人工撰写的"理想回答"做监督微调。
- 让模型先学会"基本能听人话"。

**Step 2：Reward Model 训练**
- 收集偏好数据：(prompt, response_A, response_B, human_preference)。
- 训练 Reward Model：给定 (prompt, response) 输出一个分数。
- 损失函数：Bradley-Terry 模型。

**Step 3：PPO 强化学习**
- 用 PPO 算法最大化 Reward Model 的期望奖励。
- 同时加 KL 散度惩罚，避免模型偏离太远。

```
max  E[RM(prompt, response)] - β · KL(π || π_ref)
```

#### 2.2.2 DPO 详解

DPO 直接优化偏好，不需要 Reward Model，也不需要 PPO。

核心公式：

```
L_DPO = -log σ( β · log(π_θ(chosen|x)/π_ref(chosen|x))
              - β · log(π_θ(rejected|x)/π_ref(rejected|x)) )
```

优点：
- 训练简单（一阶段，不需要 Reward Model）。
- 训练稳定（不需要 PPO 的复杂调参）。
- 显存友好。

缺点：
- 仍需要成对偏好数据。
- 在推理能力上不如 GRPO。

#### 2.2.3 GRPO 详解（DeepSeek-R1）

GRPO 用"组内相对"代替"绝对奖励"：

- 对每个 prompt 采样一组 responses (group size N)。
- 对组内每个 response 计算相对优势：advantage_i = (r_i - mean(r)) / std(r)。
- 用 PPO 风格的损失 + 相对优势更新。

优点：
- 不需要单独训练 Reward Model（用规则或简单评分）。
- 推理 / 数学任务上表现强（DeepSeek-R1 验证）。
- 训练效率高。

缺点：
- 需要组内多样性（group size 较大时才好）。
- 对评分规则敏感。

#### 2.2.4 KTO 详解

KTO（Kahneman-Tversky Optimization）不需要成对偏好，只需要"单点 desirability"（这条 response 好还是不好）。

借鉴 Kahneman-Tversky 的"损失厌恶"理论：

```
L_KTO = w_desired · (1 - σ(β · r_θ(x, y_desired))) + 
        w_undesired · σ(β · r_θ(x, y_undesired))
```

适用：用户只点了"好/不好"，没给成对比较。

#### 2.2.5 IPO 详解

IPO（Identity Preference Optimization）解决 DPO 的过拟合问题。

```
L_IPO = (log(π_θ(chosen)/π_ref(chosen)) - log(π_θ(rejected)/π_ref(rejected)) - 1/(2β))²
```

适用：偏好数据质量不高、容易过拟合的场景。

#### 2.2.6 Online Learning 详解

流式 / 实时更新模型，常见两种：

- **FTRL（Follow The Regularized Leader）**：Google 用于广告 CTR，适合稀疏大规模特征。
- **Contextual Bandit**：每个决策点选 action，奖励来自用户反馈（点击/转化）。LinUCB / Thompson Sampling。

适用：推荐 / 搜索 / 个性化。

#### 2.2.7 Self-Improvement 详解

Agent 不依赖外部反馈，自己评估 / 修正：

- **Self-Play**：Agent 自己生成任务、自己练习（AlphaGo Zero 范式）。
- **Self-Refine**：Agent 生成 → 自我批评 → 自我修正（迭代 N 轮）。
- **Constitutional AI**：用 LLM 替代人类做"宪法式"评判。

### 2.3 与相邻概念关系

- 反馈闭环 vs A/B 测试：A/B 测试是反馈采集的子集。
- 反馈闭环 vs MLOps：MLOps 是更宽的工程闭环，反馈是其中一环。
- 反馈闭环 vs 数据质量：反馈数据本身也需要质量治理。
- 反馈闭环 vs RL：RL 是反馈驱动训练的一种算法，反馈闭环是更宽的工程体系。
- 反馈闭环 vs Active Learning：Active Learning 是"主动挑样让人标"，反馈闭环更宽（含被动反馈）。
- 反馈闭环 vs Eval：Eval 是反馈的一种形式（离线 / 在线）。

### 2.4 数学形式化

把反馈闭环形式化：

```
反馈系统 = ⟨A, F, P, T, E, R⟩

A  = Agent / 模型
F  = 反馈采集函数 F: (context, action) → feedback
P  = 偏好数据 P = {(x_i, y_i^+, y_i^-)} 或 {(x_i, y_i, score_i)}
T  = 训练算法（RLHF / DPO / GRPO / ...）
E  = 评估指标（accuracy / CSAT / CTR / ...）
R  = 部署策略（A/B / 灰度 / 全量）
```

闭环：

```
A_{t+1} = T(P_t, A_t)         # 用当前偏好数据训练下一版
P_{t+1} = F(A_{t+1})          # 用下一版采集新反馈
E_t = eval(A_t)               # 在线 / 离线评估
A_best = argmax_{A_t} E_t     # 选最优版上线
```

> 💡 **思考锚点**：把你手上的 Agent 拆成 ⟨A, F, P, T, E, R⟩ 六件、逐件指认负责人，然后回答：你的偏好数据 P 拿得到成对样本 (prompt, chosen, rejected) 吗？拿得到，DPO 一阶段就能替代 RLHF；拿不到，是不是该换 KTO，而不是硬凑一对样本去喂那套 Reward Model + PPO？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](02-feedback-loop-section-3-sec3.md)
- [§4. 工程实现](02-feedback-loop-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](02-feedback-loop-section-5-sec5.md)
- [§6. 落地实践](02-feedback-loop-section-6-sec6.md)
- [§7. 与其他方法对比](02-feedback-loop-section-7-sec7.md)
- [§8. 面试真题集](02-feedback-loop-section-8-sec8.md)

---
