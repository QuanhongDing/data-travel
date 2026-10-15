> 本文件是 **06-rl.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](06-rl.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Bandit 起步（Bandit-First）**

- 用 Multi-Armed Bandit / Contextual Bandit 起步。
- 适合：单步决策、A/B 测试、推荐 / 广告粗排、动态定价。
- 优势：简单、收敛快、可解释。
- 局限：无法建模序列依赖。

**模式 2：DQN / Value-Based**

- 用 DQN / Rainbow DQN 做离散动作决策。
- 适合：游戏 AI、离散动作决策。
- 优势：off-policy 样本效率高。
- 局限：连续动作难处理。

**模式 3：Policy Gradient / Actor-Critic**

- 用 PPO / SAC / A3C 做连续动作决策。
- 适合：机器人控制、自动驾驶、连续动作推荐 / 定价。
- 优势：连续动作友好、策略自然。
- 局限：on-policy 样本效率低（PPO / SAC 是例外）。

**模式 4：Model-Based RL**

- 学环境模型 + 规划（MCTS / AlphaZero）。
- 适合：围棋、棋牌、可建模环境。
- 优势：样本效率高、可解释。
- 局限：模型学习难。

**模式 5：Offline RL**

- 从历史数据学策略，不直接在线试错。
- 适合：医疗、自动驾驶、推荐系统（不能随便试错）。
- 优势：安全、样本丰富。
- 局限：分布漂移问题。

**模式 6：Inverse RL / Imitation Learning**

- 从专家演示反推奖励函数。
- 适合：自动驾驶（人类驾驶数据）、机器人（人类演示）。
- 优势：无需设计奖励。

**模式 7：Multi-Agent RL（MARL）**

- 多智能体协同 / 竞争 / 混合。
- 适合：游戏、交通调度、机器人协作。
- 优势：复杂场景建模。
- 局限：训练不稳定。

**模式 8：Self-Play RL**

- 智能体自我博弈。
- 适合：围棋、棋牌、对抗游戏。
- 优势：无需人类数据。
- 局限：局部最优（需要 population）。

**模式 9：RL for LLM（RLHF / DPO / GRPO）**

- 用 RL 训练 LLM 与人类偏好对齐。
- 适合：ChatGPT、Claude、Gemini 等所有对话模型。
- 优势：人类偏好对齐、效果好。

**模式 10：Agent RL（Tool Use / Multi-Step Reasoning）**

- 智能体通过 RL 学习多步推理 + Tool 调用。
- 适合：WebArena、SWE-bench、Agent 平台。
- 优势：长期规划能力。

**模式 11：Hierarchical RL**

- 分层策略（高层定目标，低层执行动作）。
- 适合：长期任务、稀疏奖励。
- 优势：解决稀疏奖励。

### 3.2 适用场景决策表

| 业务特征 | 推荐算法 | 理由 |
| --- | --- | --- |
| 单步决策 + 探索有限 | Multi-Armed Bandit / UCB / Thompson Sampling | 简单优先 |
| 单步决策 + 有上下文特征 | Contextual Bandit / Neural Bandit | 引入特征 |
| 离散动作 + 游戏 / 推荐 | DQN / Rainbow DQN | Value-Based |
| 连续动作 + 控制 | DDPG / TD3 / SAC | Policy-Based |
| 大规模 + 通用 | PPO / A3C | 工业默认 |
| 围棋 / 棋牌 | AlphaZero / MuZero | MCTS + 自我博弈 |
| 安全敏感 + 历史数据丰富 | CQL / IQL / TD3+BC | 离线 RL |
| 人类演示数据丰富 | GAIL / AIRL / IRL | 模仿学习 |
| 多智能体协同 | MADDPG / MAPPO / QMIX | 多智能体 |
| LLM 偏好对齐 | PPO (RLHF) / DPO / GRPO | LLM RL |
| Agent 多步决策 | PPO / REINFORCE + WebArena | Agent RL |
| 稀疏奖励 + 长任务 | Hierarchical RL / Curiosity-Driven | 分层 / 探索 |
| 工业控制 / 机器人 | PPO / SAC + Domain Randomization | 鲁棒性 |
| 推荐 / 广告（长期价值） | Deep RL + Off-Policy Correction | 长期优化 |
| 动态定价 | Contextual Bandit / PPO | 价格决策 |

### 3.3 反模式与陷阱

1. **「奖励函数拍脑袋」反模式**：用"点击 +1 / 跳出 -1"等简单奖励，导致 Agent 学习"作弊"（如点击诱饵）。**奖励工程（Reward Shaping）是 RL 系统的核心**。
2. **「稀疏奖励直接训练」反模式**：奖励只在任务完成时给出，Agent 完全学不会。**需要奖励塑形（Curiosity-Driven / HER）**。
3. **「On-Policy 用历史数据」反模式**：PPO 是 on-policy，不能用 Replay Buffer 装历史数据。**Off-Policy 用 SAC / DQN**。
4. **「忽略探索」反模式**：$\epsilon$-greedy 的 $\epsilon$ 设 0，Agent 陷入局部最优。**必须保证探索**。
5. **「离线 RL 用 on-policy 算法」反模式**：用 PPO 跑离线数据，效果差（分布漂移）。**离线场景用 CQL / IQL**。
6. **「奖励黑客」反模式**：Agent 发现奖励函数漏洞刷分（如卡死不动 = 0 奖励避免负奖励）。**奖励工程 + 多重奖励约束**。
7. **「训练不稳定」反模式**：RL 训练随机性大，不同种子结果差异巨大。**多次种子 + 调超参 + 学习率调度**。
8. **「直接上线不验证」反模式**：RL 策略直接生产环境试错，造成巨大损失。**必须离线评估 + 影子模式 + 灰度发布**。
9. **「样本效率低盲目上 GPU」反模式**：百万次环境交互还不够，堆 GPU 也跑不动。**换 Model-Based / Offline RL / Imitation Learning**。
10. **「奖励函数与业务目标不对齐」反模式**：RL 优化"点击"，但业务要"GMV"。**奖励函数必须与业务 KPI 严格对齐**。
11. **「LLM RLHF 用 PPO 训练 LLM 不稳定」反模式**：PPO 训练 LLM 容易崩溃。**用 DPO / GRPO / 稳定训练技巧**。
12. **「多智能体 = 简单堆叠」反模式**：多个单 Agent 不等于 Multi-Agent。**MARL 需要协同 / 通信 / 信用分配**。

---
