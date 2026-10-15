> 本文件是 **06-rl.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](06-rl.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务问题抽象为 MDP**

- 把业务问题转化为 $(\mathcal{S}, \mathcal{A}, P, R, \gamma)$。
- 明确：状态空间、动作空间、奖励信号、折扣因子。
- 输出：**MDP 设计文档**。

**Step 2：环境搭建（模拟器 / 真实环境）**

- 搭建模拟器（Gym / MuJoCo / 自研）。
- 或直接在生产环境（成本高、风险大）。
- 输出：**环境接口 + 数据采集**。

**Step 3：奖励函数设计**

- 与业务 KPI 严格对齐。
- 奖励塑形（Reward Shaping）。
- 多重奖励 + 约束（避免奖励黑客）。
- 输出：**奖励函数 + 评估指标**。

**Step 4：算法选型与基线**

- 用 §3.2 决策表选 1-3 个候选算法。
- 跑基线（随机策略 / Behavior Cloning / 监督学习）。
- 输出：**基线报告**。

**Step 5：策略训练**

- 训练循环：环境交互 → 数据采集 → 模型更新。
- 监控：累积奖励、策略熵、价值损失、KL 散度。
- 输出：**训练曲线 + 模型 checkpoint**。

**Step 6：策略评估**

- 离线评估：在历史数据上回放（Offline RL Eval）。
- 模拟评估：在模拟器中测试（Sim Eval）。
- A/B 测试：小流量真实环境测试。
- 输出：**评估报告**。

**Step 7：策略上线**

- 影子模式（Shadow Mode）：先跑但不生效。
- 灰度发布：小流量验证。
- 实时监控：累积奖励、Q 值分布、状态分布。
- 输出：**上线报告 + 监控 dashboard**。

**Step 8：闭环与迭代**

- 反馈回流：真实奖励回流到训练数据。
- 漂移检测：环境分布变化。
- 定期重训：周 / 月粒度。
- 输出：**持续迭代 pipeline**。

### 4.2 关键技术点

**环境关键技术**：

1. **模拟器（Gym / MuJoCo / Isaac Gym）**：训练的核心，模拟器越真实训练越好。
2. **Domain Randomization**：随机化环境参数，提升鲁棒性。
3. **Sim-to-Real**：从模拟器迁移到真实环境。
4. **环境并行化**：多环境并行采样，提升训练效率。

**训练关键技术**：

5. **Replay Buffer**：存储 $(s, a, r, s', done)$，Off-Policy 训练用。
6. **Target Network**：稳定 Q 值估计，定期更新。
7. **Prioritized Experience Replay**（PER）——按优先级采样，提升学习效率。
8. **N-Step Return**：多步 TD target，平衡偏差方差。
9. **GAE（Generalized Advantage Estimation）**——Advantage 的平滑估计。
10. **梯度裁剪（Gradient Clipping）**——防止梯度爆炸。
11. **学习率调度**：Warmup + Decay。
12. **熵正则化**：鼓励探索，防止策略过拟合。
13. **奖励标准化（Reward Normalization）**：稳定训练。

**LLM RL 关键技术**：

14. **RLHF Pipeline**：
    - Step 1: SFT（监督微调）。
    - Step 2: 训练奖励模型（RM）。
    - Step 3: PPO 训练。
15. **DPO（Direct Preference Optimization）**：
    - 直接用偏好数据训练，无需 RM + RL。
    - 更稳定、更简单。
16. **GRPO（Group Relative Policy Optimization）**：
    - 用组内相对优势，去掉 Critic。
    - 显存需求降低，适合 LLM 大模型。
17. **Process Reward Model（PRM）**：
    - 在推理步骤级别给奖励。
    - 提升 LLM 推理能力。

**Agent RL 关键技术**：

18. **Tool Use RL**：训练 Agent 选择 + 调用 Tool。
19. **Multi-Step Reasoning RL**：训练 Agent 多步推理。
20. **Self-Reflection RL**：训练 Agent 自我反思。
21. **Curriculum Learning**：由易到难训练。
22. **Process Supervision**：过程监督（每步奖励）vs Outcome Supervision（最终奖励）。

**部署关键技术**：

23. **模型服务**：TF Serving、Triton、Ray Serve、vLLM。
24. **在线决策**：低延迟实时决策（毫秒级）。
25. **A/B 测试**：RL 策略 vs Baseline。
26. **影子模式**：策略并行运行但不生效。

### 4.3 工具链与平台

**RL 框架**：

- **Stable Baselines3**（Python / 开源）——经典 RL 算法集合（DQN / PPO / SAC）。
- **RLlib**（Ray / 开源）——分布式 RL 框架。
- **Tianshou**（Python / 开源）——PyTorch 实现的 RL 框架。
- **Acme**（DeepMind / 开源）——DeepMind RL 框架。
- **Spinning Up**（OpenAI / 开源）——RL 入门 + 实现。
- **CleanRL**（开源）——单文件 RL 实现，适合学习。
- **TorchRL**（PyTorch / 开源）——PyTorch 官方 RL 库。

**模拟器**：

- **Gymnasium**（OpenAI / 开源）——RL 模拟器事实标准。
- **MuJoCo**（DeepMind / 开源）——物理仿真。
- **Isaac Gym**（NVIDIA / 开源）——GPU 并行仿真。
- **WebArena**（CMU / 开源）——Agent Web 环境。
- **SWE-bench**（Princeton / 开源）——Agent 代码环境。
- **AgentBench**（THU / 开源）——Agent 综合评测。

**LLM RL 工具**：

- **TRL**（HuggingFace / 开源）——Transformer RL 库（PPO / DPO / GRPO）。
- **DeepSpeed-Chat**（Microsoft / 开源）——LLM RLHF 训练。
- **LLaMA-Factory**（开源）——LLM 微调 + DPO/PPO。
- **OpenRLHF**（开源）——高性能 RLHF 训练。
- **trlx**（CarperAI / 开源）——早期 RLHF 库。
- **RLHFWorkflow**（开源）——RLHF 工作流。

**Bandit 库**：

- **MABwiser**（Python / 开源）——Multi-Armed Bandit。
- **Vowpal Wabbit**（Microsoft / 开源）——Bandit + Contextual Bandit。
- **scikit-learn**（部分 Bandit 支持）。

**Offline RL**：

- **d3rlpy**（Python / 开源）——Offline RL + Online RL。
- **CORL**（开源）——Offline RL 算法集合。
- **RLtools**（开源）——RL 工具。

**训练平台**：

- **Weights & Biases**——实验管理 + RL 训练可视化。
- **MLflow + Ray**——分布式 RL 训练。
- **Alibaba PAI**（阿里云）——RL 训练支持。
- **AWS DeepRacer**——自动驾驶 RL 平台。
- **Google Vertex AI RL**——托管 RL 平台。

**2024-2025 新工具**：

- **GRPO**（DeepSeek 2024）——LLM 推理训练主流。
- **OpenAI o1 / o3**（2024）——大规模 RL 训练 LLM 推理。
- **Anthropic Constitutional AI**（2022-2024）——RLAIF 范式。
- **Agent Q**（2024）——Agent 搜索 + RL。
- **Reflexion**（2023-2024）——Agent 自我反思。
- **Voyager**（NVIDIA 2023）——Minecraft 终身学习 Agent。
- **DeepSeek-R1**（2025）——GRPO 训练的 LLM 推理模型。
- **Qwen2.5 RL**（阿里 2024）——RLHF + GRPO 训练。
- **MAVIS**（2024）——数学专用 RL 训练。
- **RStar-Math**（Microsoft 2024）——数学推理 RL。

### 4.4 代码 / 示例

**示例 1：Contextual Bandit（推荐粗排）**

```python
import numpy as np
from vowpalwabbit import pyvw

# Contextual Bandit（Vowpal Wabbit）
class ContextualBandit:
    def __init__(self, n_arms, n_features):
        self.n_arms = n_arms
        self.n_features = n_features
        self.vw = pyvw.vw("--cb_explore_adf --epsilon 0.1")

    def predict(self, context_features: list[list[float]]) -> int:
        """预测最优 arm"""
        examples = []
        for arm_id in range(self.n_arms):
            # 每个 arm 一个 example，共享 context
            example = "|f features_" + " ".join(
                f"{i}:{v}" for i, v in enumerate(context_features[0])
            )
            if arm_id > 0:
                example = "shared |f" + " ".join(
                    f"{i}:{v}" for i, v in enumerate(context_features[0])
                )
            examples.append(example)

        return self.vw.predict(examples)

    def update(self, context_features, chosen_arm, reward):
        """在线更新"""
        # VW 的在线学习接口
        self.vw.learn(context_features, chosen_arm, reward)
```

**示例 2：DQN（CartPole）**

```python
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import random
from collections import deque
import gymnasium as gym

class DQN(nn.Module):
    def __init__(self, state_dim, action_dim, hidden=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Linear(hidden, action_dim)
        )

    def forward(self, x):
        return self.net(x)

class ReplayBuffer:
    def __init__(self, capacity=10000):
        self.buffer = deque(maxlen=capacity)

    def push(self, state, action, reward, next_state, done):
        self.buffer.append((state, action, reward, next_state, done))

    def sample(self, batch_size):
        return random.sample(self.buffer, batch_size)

    def __len__(self):
        return len(self.buffer)

# 训练
env = gym.make("CartPole-v1")
state_dim = env.observation_space.shape[0]
action_dim = env.action_space.n

policy_net = DQN(state_dim, action_dim)
target_net = DQN(state_dim, action_dim)
target_net.load_state_dict(policy_net.state_dict())
optimizer = optim.Adam(policy_net.parameters(), lr=1e-3)
buffer = ReplayBuffer(10000)

epsilon = 0.1
gamma = 0.99
batch_size = 64
target_update = 10

for episode in range(500):
    state, _ = env.reset()
    total_reward = 0
    for t in range(200):
        # ε-greedy
        if random.random() < epsilon:
            action = env.action_space.sample()
        else:
            with torch.no_grad():
                q_values = policy_net(torch.tensor(state, dtype=torch.float32))
                action = q_values.argmax().item()

        next_state, reward, done, _, _ = env.step(action)
        buffer.push(state, action, reward, next_state, done)
        total_reward += reward

        if len(buffer) > batch_size:
            # 采样训练
            batch = buffer.sample(batch_size)
            states, actions, rewards, next_states, dones = zip(*batch)
            states = torch.tensor(np.array(states), dtype=torch.float32)
            actions = torch.tensor(actions, dtype=torch.int64)
            rewards = torch.tensor(rewards, dtype=torch.float32)
            next_states = torch.tensor(np.array(next_states), dtype=torch.float32)
            dones = torch.tensor(dones, dtype=torch.float32)

            q_values = policy_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)
            next_q_values = target_net(next_states).max(1)[0].detach()
            target = rewards + gamma * next_q_values * (1 - dones)

            loss = nn.MSELoss()(q_values, target)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        if done:
            break
        state = next_state

    # 更新 target network
    if episode % target_update == 0:
        target_net.load_state_dict(policy_net.state_dict())

    print(f"Episode {episode}, Reward: {total_reward}")
```

**示例 3：PPO（连续动作 - Pendulum）**

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.distributions import Normal
import gymnasium as gym

class PPOActorCritic(nn.Module):
    def __init__(self, state_dim, action_dim, hidden=64):
        super().__init__()
        # Actor
        self.actor = nn.Sequential(
            nn.Linear(state_dim, hidden), nn.Tanh(),
            nn.Linear(hidden, hidden), nn.Tanh(),
            nn.Linear(hidden, action_dim)
        )
        # Critic
        self.critic = nn.Sequential(
            nn.Linear(state_dim, hidden), nn.Tanh(),
            nn.Linear(hidden, hidden), nn.Tanh(),
            nn.Linear(hidden, 1)
        )
        # log_std 可学习
        self.log_std = nn.Parameter(torch.zeros(action_dim))

    def forward(self, x):
        mu = self.actor(x)
        std = torch.exp(self.log_std)
        dist = Normal(mu, std)
        value = self.critic(x)
        return dist, value

# PPO 训练循环
def ppo_train():
    env = gym.make("Pendulum-v1")
    state_dim = env.observation_space.shape[0]
    action_dim = env.action_space.shape[0]

    model = PPOActorCritic(state_dim, action_dim)
    optimizer = optim.Adam(model.parameters(), lr=3e-4)

    gamma = 0.99
    clip_eps = 0.2
    K_epochs = 4
    eps_per_update = 20
    max_t = 200

    for update in range(200):
        states_buf, actions_buf, rewards_buf, logprobs_buf = [], [], [], []
        values_buf, dones_buf = [], []

        for _ in range(eps_per_update):
            state, _ = env.reset()
            for t in range(max_t):
                with torch.no_grad():
                    dist, value = model(torch.tensor(state, dtype=torch.float32))
                    action = dist.sample()
                    logprob = dist.log_prob(action).sum()

                next_state, reward, done, _, _ = env.step(action.numpy())

                states_buf.append(state)
                actions_buf.append(action.numpy())
                rewards_buf.append(reward)
                logprobs_buf.append(logprob.item())
                values_buf.append(value.item())
                dones_buf.append(done)

                state = next_state
                if done:
                    break

        # GAE 计算
        returns = []
        advantages = []
        gae = 0
        next_value = 0
        for t in reversed(range(len(rewards_buf))):
            if dones_buf[t]:
                gae = 0
                next_value = 0
            delta = rewards_buf[t] + gamma * next_value - values_buf[t]
            gae = delta + gamma * 0.95 * gae
            advantages.insert(0, gae)
            returns.insert(0, gae + values_buf[t])
            next_value = values_buf[t]

        # PPO 更新
        states = torch.tensor(np.array(states_buf), dtype=torch.float32)
        actions = torch.tensor(np.array(actions_buf), dtype=torch.float32)
        old_logprobs = torch.tensor(logprobs_buf, dtype=torch.float32)
        returns = torch.tensor(returns, dtype=torch.float32)
        advantages = torch.tensor(advantages, dtype=torch.float32)
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        for _ in range(K_epochs):
            dist, values = model(states)
            logprobs = dist.log_prob(actions).sum(-1)
            entropy = dist.entropy().sum(-1).mean()

            ratio = torch.exp(logprobs - old_logprobs)
            surr1 = ratio * advantages
            surr2 = torch.clamp(ratio, 1 - clip_eps, 1 + clip_eps) * advantages
            policy_loss = -torch.min(surr1, surr2).mean()
            value_loss = ((returns - values.squeeze()) ** 2).mean()

            loss = policy_loss + 0.5 * value_loss - 0.01 * entropy

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

ppo_train()
```

**示例 4：RLHF / DPO 微调 LLM**

```python
# DPO 训练（更简单、更稳定）
from trl import DPOTrainer, DPOConfig
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-7B-Instruct")
ref_model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-7B-Instruct")  # 参考模型
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-7B-Instruct")

# 偏好数据：prompt, chosen (好回答), rejected (差回答)
train_dataset = [
    {
        "prompt": "解释什么是 RAG",
        "chosen": "RAG 是检索增强生成...",
        "rejected": "RAG 就是搜索。"
    },
    # ...
]

config = DPOConfig(
    beta=0.1,
    learning_rate=1e-5,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    num_train_epochs=1,
    fp16=True,
)

trainer = DPOTrainer(
    model=model,
    ref_model=ref_model,
    args=config,
    train_dataset=train_dataset,
    tokenizer=tokenizer,
)
trainer.train()
```

**示例 5：GRPO（DeepSeek-R1 风格）**

```python
# GRPO 简化实现（去掉 Critic）
import torch
import torch.nn.functional as F

def grpo_loss(policy_model, ref_model, prompts, responses, rewards, group_size=4):
    """
    GRPO: Group Relative Policy Optimization
    - 用组内相对优势替代 Critic
    - 同一 prompt 生成 group_size 个回答
    - 用组内奖励的归一化值作为优势
    """
    # 1. 计算组内相对优势
    rewards_group = rewards.view(-1, group_size)
    advantages = (rewards_group - rewards_group.mean(dim=1, keepdim=True)) / (
        rewards_group.std(dim=1, keepdim=True) + 1e-8
    )
    advantages = advantages.view(-1)

    # 2. 计算新策略 log prob
    new_logprobs = compute_logprobs(policy_model, prompts, responses)

    # 3. 计算参考策略 log prob
    with torch.no_grad():
        ref_logprobs = compute_logprobs(ref_model, prompts, responses)

    # 4. PPO-style ratio
    ratio = torch.exp(new_logprobs - ref_logprobs)

    # 5. PPO clipped objective
    surr1 = ratio * advantages
    surr2 = torch.clamp(ratio, 1 - 0.2, 1 + 0.2) * advantages
    policy_loss = -torch.min(surr1, surr2).mean()

    # 6. KL 散度惩罚（可选）
    kl = (ref_logprobs - new_logprobs).mean()
    total_loss = policy_loss + 0.04 * kl

    return total_loss
```

**示例 6：Agent RL（Tool Use）**

```python
# Agent RL 框架（简化）
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

class ToolUseAgent:
    """训练 Agent 通过 RL 学习 Tool 调用"""
    def __init__(self, llm, tools):
        self.llm = llm
        self.tools = tools  # {"search": search_fn, "code": code_fn, ...}

    def step(self, prompt, max_steps=10):
        """执行一个 episode"""
        history = prompt
        total_reward = 0

        for step in range(max_steps):
            # LLM 决定动作（Tool 调用或回答）
            response = self.llm.generate(history)
            tool_name, tool_args = parse_tool_call(response)

            if tool_name is None:
                # 最终回答
                final_answer = response
                break

            # 执行 Tool
            if tool_name in self.tools:
                tool_result = self.tools[tool_name](**tool_args)
                history += f"\nTool: {tool_name}\nResult: {tool_result}"

        # 计算奖励（基于最终答案 + 中间步骤）
        reward = self.compute_reward(final_answer, gold_answer, history)
        return history, reward

    def compute_reward(self, final, gold, history):
        """奖励函数：答案正确性 + Tool 使用效率"""
        answer_reward = 1.0 if final == gold else 0.0
        # 步骤惩罚（鼓励简短路径）
        step_penalty = -0.01 * history.count("Tool:")
        return answer_reward + step_penalty

# 用 PPO 训练 Agent
def train_agent_rl(agent, episodes=1000):
    optimizer = torch.optim.Adam(agent.llm.parameters(), lr=1e-5)

    for episode in range(episodes):
        prompt, gold_answer = sample_task()
        history, reward = agent.step(prompt)
        # PPO 更新（基于 trajectory 的策略梯度）
        # ... （详见 PPO 实现）
```

---
