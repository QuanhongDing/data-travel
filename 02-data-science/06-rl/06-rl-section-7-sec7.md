> 本文件是 **06-rl.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](06-rl.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Bandit | DQN | PPO | SAC | Offline RL | Inverse RL |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| 简单性 | 5 | 3 | 3 | 3 | 2 | 2 |
| 离散动作 | 5 | 5 | 4 | 3 | 4 | 4 |
| 连续动作 | 2 | 1 | 4 | 5 | 4 | 4 |
| 样本效率 | 4 | 3 | 2 | 4 | 5 | 4 |
| 安全性 | 3 | 2 | 2 | 2 | 5 | 4 |
| 可解释性 | 4 | 2 | 2 | 2 | 2 | 4 |
| 工业成熟度 | 4 | 3 | 4 | 3 | 3 | 2 |
| LLM 训练适配 | 1 | 1 | 4 | 1 | 1 | 1 |
| 多智能体 | 3 | 3 | 4 | 3 | 2 | 2 |

**结论**：

- **单步决策**：Bandit。
- **离散动作**：DQN / Rainbow。
- **连续动作**：PPO / SAC。
- **安全场景**：Offline RL（CQL / IQL）。
- **人类演示**：Inverse RL（GAIL / AIRL）。
- **LLM 训练**：PPO / DPO / GRPO。

### 7.2 决策树

```
[RL 任务]
   │
   ├── [单步决策？]
   │     ├── 是 → Bandit / Contextual Bandit
   │     └── 否 → 继续
   │
   ├── [动作空间？]
   │     ├── 离散 → DQN / Rainbow DQN
   │     └── 连续 → PPO / SAC
   │
   ├── [能否在线试错？]
   │     ├── 是 → Online RL（PPO / SAC / DQN）
   │     └── 否 → Offline RL（CQL / IQL / TD3+BC）
   │
   ├── [有无专家演示？]
   │     ├── 有 → Inverse RL（GAIL / AIRL）
   │     └── 无 → 继续
   │
   ├── [LLM 训练？]
   │     ├── 是 → PPO / DPO / GRPO
   │     └── 否 → 继续
   │
   ├── [多智能体？]
   │     ├── 是 → MAPPO / MADDPG
   │     └── 否 → 继续
   │
   └── [可建模环境？]
         ├── 是 → AlphaZero / MuZero / DreamerV3
         └── 否 → Model-Free RL
```

### 7.3 组合使用

**组合 1：Bandit + RL（粗排 + 精排）**

- Bandit 做粗排（探索新策略）。
- RL 做精排（长期价值优化）。
- 优势：探索 + 利用平衡。

**组合 2：SFT + RLHF（LLM 训练）**

- SFT 打基础能力。
- RLHF / DPO / GRPO 对齐人类偏好。
- 优势：能力 + 对齐。

**组合 3：Imitation Learning + RL（Offline → Online）**

- IL 从专家演示学初始策略。
- Online RL 微调优化。
- 优势：冷启动 + 持续优化。

**组合 4：Multi-Agent + LLM（Agent 协同）**

- 多 LLM Agent 通过 MARL 协同。
- 优势：复杂任务协同。

**组合 5：World Model + RL（Model-Based）**

- 学环境模型 + RL 规划。
- 优势：样本效率高、可解释。

**组合 6：LLM + Bandit（推荐 + 对话）**

- LLM 生成候选。
- Bandit 选最优。
- 优势：探索 + 利用平衡。

---
