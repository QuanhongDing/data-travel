> 本文件是 **06-rl.md** 的子文件（§8. 面试真题集）。完整章节请回到 [index](06-rl.md)。

## 8. 面试真题集

> 本节聚焦强化学习（Reinforcement Learning, RL）核心算法与工程落地，包括算法选型、奖励工程、离线 RL、MARL、RLHF / 对齐与工业踩坑。题目按照"全景视图 → 分主题展开 → 横向小结 → 本章小结"组织。

---

## 1 全景视图

> 本节整合 7 道 RL 方向真题，覆盖算法选型、奖励工程、离线 RL、MARL、RLHF / 对齐、工业落地六大主题。下表按主题汇总。

| 主题 | 题目编号 | 收录题数 | 主/辅 |
| --- | --- | :---: | :---: |
| 算法选型（DQN / PPO / SAC） | RL-Q1 | 1 | 主 |
| 基于模型 vs 无模型 | RL-Q2 | 1 | 主 |
| 奖励函数设计（Reward Shaping） | RL-Q3 | 1 | 主 |
| 离线强化学习（Offline RL / CQL） | RL-Q4 | 1 | 主 |
| 多智能体 RL（MARL） | RL-Q5 | 1 | 主 |
| RLHF 与 LLM 对齐（Alignment） | RL-Q6 | 1 | 主 |
| RL 工业落地难点 | RL-Q7 | 1 | 主 |

| 主题 | 题目编号 | 难度 |
| --- | --- | :---: |
| 算法选型（DQN / PPO / SAC） | RL-Q1 | ★★★★☆ |
| 基于模型 vs 无模型 | RL-Q2 | ★★★★☆ |
| 奖励函数设计（Reward Shaping） | RL-Q3 | ★★★★★ |
| 离线强化学习（Offline RL / CQL） | RL-Q4 | ★★★★☆ |
| 多智能体 RL（MARL） | RL-Q5 | ★★★★☆ |
| RLHF 与 LLM 对齐（Alignment） | RL-Q6 | ★★★★★ |
| RL 工业落地难点 | RL-Q7 | ★★★★★ |

---

## 2 分主题展开

> 每题包含「考察要点 / 答案骨架 / 关键细节 / 工业落地与案例 / 常见追问」五个部分，用于还原真实面试场景的高质量问答。

### 2.1 算法选型：DQN、PPO、SAC 怎么选

#### RL-Q1 ★★★★☆

> 在一个工业级的广告出价 / 动态定价 / 推荐重排项目中，给你一段连续的动作空间、需要长期价值优化、又要兼容历史日志的回放，请你说清楚 DQN、PPO、SAC 这三类主流 RL 算法各自的适用边界、关键超参与训练稳定性差异，并给出你的选型建议。

#### 考察要点

考察候选人对 **value-based 与 policy-based 两类范式** 的本质理解、on-policy 与 off-policy 的样本效率差异，以及连续动作场景下 SAC vs PPO 的工程取舍。常作为 P7 / P8 算法岗面试的开场硬题。

#### 答案骨架

把"算法"看成"业务约束的函数"——动作维度、是否能在线试错、奖励稀疏度三者共同决定算法族。先锁定范式（Value-Based / Policy-Based / Actor-Critic），再锁定变体。**核心三步**：① 动作空间判断；② 数据来源判断；③ 训练稳定性兜底。

#### 关键细节

- **DQN 家族**（DQN / Double DQN / Dueling DQN / Rainbow）：离散动作场景下首选。技巧在于 target network 与 replay buffer。**连续动作必须离散化或换模型**，否则 Q 值无法表达。
- **PPO**（Proximal Policy Optimization）：on-policy，但通过 clip 目标限制策略更新幅度，工程界事实默认算法。能处理离散和连续动作，但**样本利用率低**（一个 batch 用完即弃）；在大模型时代其 LLM RLHF 变体仍是主流但被 GRPO / DPO 蚕食。
- **SAC**（Soft Actor-Critic）：off-policy + 最大熵框架，**样本效率是 PPO 的 5-10 倍**。代价是需要两个 Q 网络（twin Q）+ 熵温度系数 α 的自动调节，工程实现复杂度高于 PPO。
- **关键超参经验值**：PPO 的 clip ε = 0.2、GAE λ = 0.95；SAC 的 target entropy = −dim(action)；DQN 的 replay buffer 通常是 10⁶ 级别。
- **稳定性排序**：SAC > DQN > PPO，其中 PPO 训练方差最大，需要多次种子取均值。

#### 工业落地与案例

- **字节跳动 / 阿里**：广告出价与推荐重排长期价值场景，SAC 与 PPO 都跑过，最终 PPO 因工程稳定 + 监控指标明确而被主选。
- **美团 / 滴滴**：动态定价 + 派单，动作维度可控、试错成本高，主流退化为 **Contextual Bandit + PPO 微调**。
- **DeepMind**：AlphaGo（DQN 衍生 + MCTS）、DM Control（SAC 主战场）。
- **OpenAI**：RLHF 用 PPO，推理模型 o1/o3 转向 GRPO。

#### 常见追问

- Q：为什么 PPO 训练不稳定？答：clip 范围外样本被丢弃导致策略更新方差大；可用学习率 warmup、梯度裁剪、KL 惩罚缓解。
- Q：SAC 的 α 怎么调？答：可固定（heuristic = −dim(action)）也可自动调节（target entropy）；后者在跨任务迁移更稳。
- Q：是否要上 SAC？答：连续动作 + 能容忍 off-policy 复杂度时优先；强工程约束或需要 Gradio UI 调试时退回 PPO。

---

### 2.2 基于模型 vs 无模型 RL

#### RL-Q2 ★★★★☆

> 我们要做一个电网调度的 RL 智能体，每秒钟最多采 1000 个样本，环境转移规律能用物理方程近似但有不小的随机扰动。你会选 Model-Free 还是 Model-Based？为什么？MuZero / AlphaZero 的思路能不能直接照搬？

#### 考察要点

考察 **Model-Based 与 Model-Free 的本质权衡**：样本效率、可解释性、模型误差累积、对环境可建模性的依赖。容易引出世界模型（World Model）、Dyna 框架与 Sim-to-Real 等工程概念。

#### 答案骨架

**核心判断**：环境能不能学出来？环境转移是否平稳？如果环境可近似建模且试错代价高，选 Model-Based（MCTS + 神经网络学环境）；反之选 Model-Free。模型准确性是一切的前提——**模型错了比没模型还危险**。

#### 关键细节

- **Model-Free 流派**：DQN / PPO / SAC 直接学价值或策略，不构造环境模型。优势：实现简单、鲁棒；劣势：样本效率差，百万步起步。
- **Model-Based 流派**：
  - **AlphaZero / MuZero**：把环境模型与价值/策略网络一起学（MuZero 完全在隐空间规划）。在 Atari、围棋、象棋、将棋达到超人水平。
  - **DreamerV3**：学环境的隐式动力学，配合图像输入，是当前机器人 / 连续控制 SOTA。
  - **Dyna-Q**：Model-Free + Model-Based 混合，主流落地做法。
- **关键风险**：模型误差在多步规划中累积（compounding error），需要 ensemble、PETS（probabilistic ensembles with trajectory sampling）之类的方法兜底。
- **Sim-to-Real**：模型在仿真器中训练，迁移到真实环境。Domain Randomization 是核心技巧。

#### 工业落地与案例

- **DeepMind AlphaGo / AlphaZero / MuZero**：完美自博弈 + 可建模环境的代表。
- **Google DeepMind 电网控制**：已发表使用 Model-Based RL 节约能耗 12% 的工作。
- **Wayve GAIA-1**（自动驾驶世界模型）：典型 Model-Based + RL 训练路径。
- **NVIDIA DreamerV3**：机器人控制 DM Control 通用 SOTA。

#### 常见追问

- Q：MuZero 完全在隐空间规划，怎么保证学到的是"对的"环境？答：通过端到端梯度反传，价值/策略/环境模型联合训练；并通过 KL 约束避免表示漂移。
- Q：Model-Based 一定比 Model-Free 好吗？答：不一定。当环境转移规律极复杂（含罕见事件）、奖励信号极稀疏、模型误差累积明显时，Model-Free 更稳。
- Q：工业上能不能直接抄 MuZero？答：可以参考算法思想，但 MuZero 算力极重；工业落地通常用 Dyna / Dreamer 的轻量化变体。

---

### 2.3 奖励函数设计（Reward Shaping）

#### RL-Q3 ★★★★★

> 在短视频推荐场景下，我们的目标是用户长期活跃度（7 日留存 + DAU），但单次推荐只能观察到点击、完播、点赞等即时信号。你如何设计奖励函数？请说明奖励工程的核心原则，并解释为什么"奖励与业务 KPI 严格对齐"是工业 RL 的金科玉律。

#### 考察要点

这是 RL 工业落地**最常被低估却最致命**的能力——奖励工程。考察候选人对 **Reward Hacking、稀疏奖励塑形、多目标融合、奖励与 KPI 不对齐风险** 的工程直觉。是 P8 / P9 级别的高频压轴题。

#### 答案骨架

**核心原则**：奖励 = 业务 KPI 的"可观测代理" + 短期/长期混合 + 多约束防作弊。**先建立奖励设计的"宪法"——业务方签字确认**——再开始训练。奖励函数改一次，模型重训一周，工业代价极高。

#### 关键细节

- **奖励函数三要素**：
  - **即时奖励**：点击 +1、完播 +0.5、点赞 +2、负反馈 −5。
  - **长期奖励**：用 return（带折扣 γ ∈ [0.95, 0.99]）加进训练目标。
  - **过程奖励（PRM）**：每步给一个细粒度奖励，DeepSeek-R1、OpenAI o1 的核心技巧。
- **Reward Shaping 三大法**：
  - **Curiosity-Driven**：内在好奇心模块（ICM / RND）解决稀疏奖励。
  - **HER（Hindsight Experience Replay）**：把"失败"重新解释为"成功"，适合 goal-conditioned RL。
  - **Curriculum Learning**：由易到难的训练课程。
- **Reward Hacking** 反模式与防御：
  - **反模式**：Agent 学习"点击诱饵"刷点击、卡死不动（避开负奖励）、反复触发边角事件。
  - **防御**：多重奖励约束（KL 偏离参考策略）、行为守门（behavior guardrails）、奖励模型监督（Reward Model）。
- **奖励与业务 KPI 不对齐的悲剧**：优化点击导致 GMV 下降；优化短期 CTR 导致用户流失；OpenAI 早期 RLHF 出现过模型学会"讨好人类标注员"的 Goodhart's Law 现象。

#### 工业落地与案例

- **OpenAI InstructGPT / ChatGPT**：RLHF 的奖励模型训练后，人类偏好评分提升 30%；后续引入 **Constitutional AI / RLAIF**（Anthropic）降低人工标注成本。
- **Anthropic Claude**：用 RLAIF + Constitutional AI 让模型自我批评与修正，避免有害输出。
- **DeepSeek-R1**：PRM + GRPO 让模型在数学推理上 SOTA。
- **Netflix Artwork RL**：用长期留存作为奖励，避免点击率高的"标题党"封面。
- **Shein 供应链定价**：奖励 = 短期 GMV + 7 日退货率惩罚，避免错定价。

#### 常见追问

- Q：奖励函数上线后效果变差，怎么排查？答：分三步——① 验证奖励与 KPI 的相关系数；② 离线回放看策略分布偏移；③ A/B 测试看真实 KPI 变化。
- Q：能不能让模型自己学奖励？答：可以，Inverse RL（GAIL / AIRL）从专家演示反推奖励；OpenAI 也在研究 Self-Generated Reward，但稳定性是大坑。
- Q：奖励塑形会不会让模型丧失"创造力"？答：会。过度塑形 = 行为僵化。OpenAI 用 KL 惩罚 + 参考策略约束保留多样性。

---

### 2.4 离线强化学习（Offline RL / CQL）

#### RL-Q4 ★★★★☆

> 一个电商的推荐重排，每天有 10 亿次曝光，但任何"试错"都可能让 GMV 直接掉 1%。我们手上有过去 3 个月、近百亿条 (state, action, reward, next_state) 日志。你如何用 Offline RL 学策略？为什么不能直接套 PPO？

#### 考察要点

考察 **Offline RL 的核心难题：分布漂移（distribution shift）**，以及为何 on-policy / 普通 off-policy 算法会高估 Q 值。涉及 CQL、IQL、TD3+BC、BCQ 等代表算法。

#### 答案骨架

直接套 PPO / DQN 是灾难——**历史数据中的 action 空间只占全集的小部分**，模型对没见过的 action 会"高估 Q"，导致策略崩溃。Offline RL 的关键是**保守约束（Conservative）**，让模型学到的 Q 值在 in-distribution 与 out-of-distribution 上都不失控。

#### 关键细节

- **核心难题：分布漂移（Distribution Shift）**
  - 历史数据中 $\pi_{\text{behavior}}$ 与要学的 $\pi_{\text{target}}$ 不一致。
  - 模型对看不见的 (s, a) 会外推，产生**幻觉高 Q 值**。
  - Q 值爆炸 → 策略选择"幻觉高 Q 动作" → 实际部署时动作根本不可达。
- **代表算法**：
  - **BC（Behavioral Cloning）**：监督学习 baseline，安全但样本效率差。
  - **CQL（Conservative Q-Learning）**：给 Q 函数加一个"对 OOD 动作的惩罚项"，保证 in-distribution / OOD 都不被高估。
  - **IQL（Implicit Q-Learning）**：用 expectile regression 学习 V，避免直接查询 OOD 动作的 Q。
  - **TD3+BC**：仅在 policy update 时加 BC 项保持接近行为策略，工程极简。
  - **ReBRAC（2023）**：当前离线 RL SOTA，加入正则化项 + ensemble。
- **关键评估**：FQE（Fitted Q Evaluation）在历史数据上回放估计策略价值，**A/B 测试前唯一的金标准**。

#### 工业落地与案例

- **阿里巴巴 推荐重排**：长序列用户行为 + Offline RL（CQL/IQL 实验）拿到长期 GMV +8%，已在主场景灰度。
- **字节跳动 广告出价**：基于历史日志训练，CQL 变体是 eCPM 提升的关键。
- **Uber / Lyft 司机匹配**：试错代价高，Offline RL 几乎是默认选项。
- **Wayve 自动驾驶**：完全不能在线试错，Offline RL + 仿真器主线。
- **医疗 RL（医疗政策评估）**：Offline RL 是合规与安全的硬约束。

#### 常见追问

- Q：Offline RL 怎么选算法？答：先 TD3+BC 跑 baseline；如效果不足且动作空间稠密，CQL > IQL > ReBRAC 顺序尝试。
- Q：为什么 Replay Buffer 不能解决 Offline RL？答：Replay 只是机制，不能绕过分布漂移；Offline RL 必须配合保守约束。
- Q：Offline RL 学到策略后能上线吗？答：必须 A/B 测试。Offline 评估 + Sim 评估 + 影子模式 + 小流量灰度，缺一不可。

---

### 2.5 多智能体 RL（MARL）

#### RL-Q5 ★★★★☆

> 我们做一个物流仓的"多机器人分拣"系统：100 台 AGV 在共享场地中各自接任务、互相避让，每台机器的奖励（吞吐量）会因其他机器的动作而变化。多个 Agent 应该怎么训练？为什么不能简单把单 Agent RL 复制 N 份？

#### 考察要点

考察 **MARL 的三大难题**：非平稳环境（Non-stationarity）、信用分配（Credit Assignment）、协调 / 通信；同时涉及 **MAPPO / MADDPG / QMIX** 三类代表算法。

#### 答案骨架

简单把单 Agent 复制 N 份 = N 个独立策略各自学自己最优 = **公地悲剧**，无人考虑他人动作。
MARL 的关键是引入 **集中训练 + 去中心化执行（CTDE）** 范式，再选择协同 / 竞争 / 混合场景对应的算法族。

#### 关键细节

- **三大根本难题**：
  - **非平稳性**：每个 Agent 的最优策略随其他 Agent 策略变化（MDP 假设被打破）。
  - **信用分配**：整体回报好，谁贡献多少？需要 counterfactual reasoning。
  - **协调 / 通信**：Agent 是否应该共享信息？带宽多少？消息语义怎么设计？
- **CTDE 范式（Centralized Training, Decentralized Execution）**：
  - 训练时用全局信息（其他 Agent 的状态 / 动作），部署时只用本地观测。
  - 代表：**MADDPG**（Multi-Agent DDPG）、**MAPPO**（Multi-Agent PPO，工业首选）、**QMIX**（值分解，用 mixing network 联合局部 Q）。
- **算法族对比**：
  - **MAPPO**：基于 PPO，工业稳定，OpenAI 的 Dota Five 与许多机器人仿真实验采用。
  - **MADDPG**：DDPG 的多智能体扩展，连续动作可用。
  - **QMIX**：值分解，协同任务首选，需满足 IGM（Individual-Global-Max）条件。
  - **MAVEN**：解决多智能体探索不足。
- **常用技巧**：参数共享（parameter sharing）加速训练 + curriculum learning 由简到难。

#### 工业落地与案例

- **OpenAI Five（Dota 2）**：Self-Play + 极大算力，5 个 Agent 协同击败人类世界冠军。
- **DeepMind AlphaStar（星际争霸 II）**：5 个 Agent 协同 + 联盟训练（League Training）。
- **DeepNash（Stratego）**：DeepMind 用 self-play 训练无模型 MARL 达到人类专家水平。
- **仓储 / 物流 AGV**：京东、菜鸟、亚马逊仓库机器人调度，MAPPO + QMIX 主流实现。
- **交通信号控制**：MIT、UC Berkeley 多个城市部署 MARL 优化红绿灯时长，缓解拥堵。

#### 常见追问

- Q：MARL 训练为什么不稳定？答：每个 Agent 学到的策略都在变化，对其他 Agent 来说目标函数在动。可以用对手建模（Opponent Modeling）+ 指纹（Fingerprint）做稳定性提升。
- Q：需要通信吗？答：复杂任务需要。但要设计通信协议——谁发、谁收、消息内容；CommNet / TarMAC 是经典方案。
- Q：Multi-Agent LLM 是 MARL 吗？答：可以归类。需要"协调 + 角色分工 + 信用分配"，本质上也是非平稳问题。

---

### 2.6 RLHF 与 LLM 对齐（Alignment）

#### RL-Q6 ★★★★★

> 2025 年是 RLHF / DPO / GRPO 大爆发的时代。请你作为大模型训练工程师，详细描述 RLHF 的全流程（从偏好数据采集到 PPO 训练），并解释为什么 OpenAI 用 PPO 而 DeepSeek 用 GRPO，它们的工程权衡是什么？

#### 考察要点

考察 **LLM 偏好对齐的完整链路**：SFT → RM → RL；同时比较 **PPO / DPO / GRPO** 的工程权衡，是 LLM 训练岗最重要的能力维度之一。

#### 答案骨架

RLHF = 监督学习（SFT）+ 奖励建模（Reward Model）+ 策略优化（PPO）三段式。GRPO / DPO 是后续针对 PPO 缺陷的工程改进：GRPO 去 Critic 节省显存，DPO 直接监督学习替代 PPO。

#### 关键细节

- **RLHF 三阶段**：
  - **Stage 1 SFT（Supervised Fine-Tuning）**：用高质量指令 - 回答对微调基础模型，建立基本能力。
  - **Stage 2 RM（Reward Model）**：让人类标注员对同一 prompt 的多个回答排序（chosen > rejected），训练一个 Bradley-Terry 模型的奖励打分器。
  - **Stage 3 RL（PPO）**：在 RM 上做 RL，把策略推向"高奖励 + 不偏离 SFT 太远（KL 惩罚）"的方向。
- **三族改进算法**：
  - **DPO**（Stanford 2023）：跳过 RM + RL，直接用偏好数据做监督学习。**简单、稳定、低算力**，但表达力不及 PPO。
  - **GRPO**（DeepSeek 2024）：保留 PPO 框架但去掉 Critic，**用同一 prompt 的多个回答的组内归一化奖励作为优势**。显存省一半，是 DeepSeek-R1 推理训练的核心。
  - **PRM（Process Reward Model）**：在推理步骤级别奖励，而非仅最终结果；OpenAI o1 / o3、DeepSeek-R1 均采用。
  - **RLAIF / Constitutional AI**（Anthropic）：用 AI 而非人类给反馈，大幅降低标注成本 + 提升安全性。
- **PPO 训练 LLM 的工程坑**：显存爆炸（参考模型 + 价值模型 + 策略模型三份）、奖励 hacking（RM 漏洞被利用）、KL 散度失控。
- **数据规模经验**：SFT 10K-100K 条；RM 100K-1M 条偏好对；RL 数十万到百万 prompt。

#### 工业落地与案例

- **OpenAI InstructGPT → ChatGPT**：RLHF 三段式奠定 LLM 对齐范式，2022 年 ChatGPT 爆发。
- **Anthropic Claude**：RLAIF + Constitutional AI，标注员只写"宪法"（Constitution），由 AI 自评自改，安全性 SOTA。
- **DeepSeek-R1（2025）**：GRPO + PRM 在数学 / 代码 / 推理任务上 SOTA，开源引发行业震动。
- **Meta Llama 3**：RLHF + DPO 并用，模型质量与开源生态兼顾。
- **阿里 Qwen2.5 / 智谱 GLM-4 / 百度 ERNIE 4.0**：均有自研 RLHF + DPO 流水线。

#### 常见追问

- Q：PPO 训练 LLM 容易崩，怎么办？答：① 限制 KL 散度阈值；② reward clipping；③ Advantage 标准化；④ 用 DPO / GRPO 替代。
- Q：DPO 比 PPO 弱吗？答：表达力 PPO > DPO，但 DPO 更简单更稳定；多数团队会先跑 DPO，再视情况升级到 PPO。
- Q：Constitutional AI 的"宪法"如何写？答：参考价值原则（有益、无害、诚实、自主）+ 行业特定边界（医疗、法律），由治理团队草拟 + 法务审核。

---

### 2.7 RL 工业落地难点

#### RL-Q7 ★★★★★

> 我们计划今年在推荐 / 广告 / 营销三个业务场景大规模应用 RL。请你说说 RL 工业落地的核心难点是什么？训练-部署-监控闭环怎么搭？为什么很多公司的 RL 项目最终"有 demo、没产出"？

#### 考察要点

这是 **架构师 / 技术负责人层级的终面压轴题**。考察候选人对 RL 工程化全貌的把握——不只是算法，还有环境 / 特征 / 模拟器 / 评估 / 监控 / 灰度组成的完整闭环。这是区分"调参工程师"与"系统架构师"的关键题。

#### 答案骨架

RL 工业落地难，**70% 不是算法问题，是工程问题**。核心难点：① 奖励工程对齐业务 KPI；② 模拟器/Sim2Real 真实性；③ 离线评估置信度；④ 监控 + 漂移检测；⑤ 业务方协同（奖励函数签字）。一个完整闭环包括 **策略训练 → 离线评估 → 影子模式 → 灰度发布 → 在线监控 → 反馈回流** 六步。

#### 关键细节

- **六大工程难点**：
  - **奖励工程**：奖励与业务 KPI 错位是头号杀手，必须业务方 + 算法 + 产品三方签字。
  - **样本效率**：在线试错代价高，工业倒逼 Offline RL + Imitation Learning + World Model 组合。
  - **训练稳定性**：同代码不同 seed 差异巨大，需要多次种子 + 跟踪实验（W&B / MLflow）。
  - **模拟器保真度**：模拟器与生产差距过大会"sim-to-real gap"，Domain Randomization 是兜底。
  - **冷启动**：新业务没有历史数据，必须 Imitation Learning 或 Bandit 起步。
  - **可解释性**：策略黑盒导致业务方不信任，需要归因分析（哪些状态分布变化导致策略变化）。
- **完整闭环六步法**：
  1. **MDP 抽象**：业务问题转化为 (S, A, P, R, γ)，输出文档。
  2. **模拟器 / 数据采集**：Gym / MuJoCo / 自研仿真器，或直接收集历史日志。
  3. **策略训练**：PPO / SAC / Offline RL，记录 W&B。
  4. **离线评估**：FQE + 模拟器回放，置信区间估计。
  5. **影子模式**：策略并行跑但不生效，与线上策略对齐对比。
  6. **灰度发布**：1% → 5% → 20% → 100%，实时监控奖励、Q 值分布、状态分布。
- **监控关键指标**：
  - **业务层**：GMV / CTR / ROI / 转化率。
  - **策略层**：累积奖励、策略熵、KL 散度、Q 值分布。
  - **闭环层**：策略更新频率、漂移检测告警、灰度回滚次数。
- **常见死法**：
  - **"奖励黑客"**：Agent 学会刷奖励指标，KPI 不升反降。
  - **"冷启动孤儿"**：上线一段时间没流量扶不起，回滚告吹。
  - **"运营中断"**：赶上大促 / 季节变化，分布漂移导致策略崩溃。

#### 工业落地与案例

- **字节跳动 / 抖音 RL 推荐**：长期 GMV +8%，但建立了一整套监督学习 → Bandit → DRL → MARL 的层级架构。
- **美团 / 饿了么 派单 RL**：配送效率 +10%，背后是 Bandit + 离线 RL + 实时重排的三层组合。
- **Uber / Lyft 司机匹配 RL**：订单匹配率大幅提升，Offline RL + Contextual Bandit 是技术核心。
- **Airbnb 动态定价**：Contextual Bandit + RL 提升房东收益；早期栽过 Reward Hacking 的跟头，引入多重奖励 + 守门策略后稳定。
- **LinkedIn Feed Ranking**：长期活跃度优化，Bandit + DRL 混合架构。
- **京东 供应链 RL**：库存 + 履约联合优化，毛利 +5%。
- **网易雷火 / 米哈游 游戏 NPC AI**：PPO / SAC 训练 NPC 行为，并通过 RL + Self-Play 提升对抗强度。
- **顺丰 / Shein 路径规划 RL**：连续动作 SAC + 仿真器，物流成本 -8%。

#### 常见追问

- Q：RL 项目从立项到产生业务价值要多久？答：单点 0→1 验证 1-3 个月；部门级 1→10 半年到一年；企业级 10→100 一般 1-2 年。
- Q：怎么衡量 RL 项目的 ROI？答：分三层——业务 ROI（直接 GMV / CTR）、技术 ROI（决策自动化程度替代人力）、战略 ROI（团队 AI 能力水位提升）。
- Q：RL 团队需要哪些角色？答：算法工程师 + 平台工程师 + 业务方 PM + 数据工程师 + 实验科学家，缺一不可。
- Q：未来 RL 的最大机会在哪？答：**RL for LLM、Agent RL、Multi-Agent LLM 系统**——用 RL 把大模型从"对话工具"升级为"决策 Agent"。

---

## 3 横向小结

> 本节按横切主题回顾，归纳 RL 面试的核心能力维度。

- **算法范式对比**：区分 Value-Based / Policy-Based / Actor-Critic 的本质差异；搞清 on-policy vs off-policy、model-based vs model-free 的工程取舍。
- **奖励工程**：奖励与业务 KPI 严格对齐是金科玉律；防 Reward Hacking 是工业基本功。
- **LLM 对齐**：RLHF / DPO / GRPO 是 2025 年最重要的工程范式演进；理解为什么 OpenAI 用 PPO、DeepSeek 用 GRPO、Anthropic 用 RLAIF。
- **离线安全**：不能在线试错就用 Offline RL（CQL / IQL / ReBRAC）；TD3+BC 是工程兜底。
- **多智能体协同**：CTDE 范式 + 信用分配 + 通信是 MARL 的三大支柱。
- **工业闭环能力**：训练-评估-灰度-监控-反馈五步法是 RL 工程的核心，也是区分"调参工程师"和"系统架构师"的分水岭。

---

## 4 本章小结

> 本面试真题集收录 7 道题，覆盖 RL 算法选型、奖励工程、离线 RL、MARL、RLHF / 对齐、工业落地六大主题。
> 题目与本章 §1-§7 内容一一对应，建议结合原文章节交叉学习。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐题学习，对照原文章节
3. 用「[§3 横向小结](#3-横向小结)」回顾横切能力维度
4. 最后做一次"业务 → 算法 → 工程"三段式自检

### 4.2 关键能力自检

- 能用一张表说清 DQN / PPO / SAC 的适用边界吗？
- 能用一段话讲清 RLHF / DPO / GRPO 的工程权衡吗？
- 能用一句话点出 Offline RL 最大的坑（分布漂移）吗？
- 能用六步法描述 RL 工业闭环吗？

### 4.3 返回

- 返回 [02-data-science 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
