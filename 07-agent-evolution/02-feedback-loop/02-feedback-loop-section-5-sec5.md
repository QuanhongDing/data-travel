> 本文件是 **02-feedback-loop.md** 的子文件（§5. 前沿演进）。完整章节请回到 [index](02-feedback-loop.md)。

## 5. 前沿演进

### 5.1 LLM/Agent 时代的演进

- **RLHF → DPO → GRPO**：偏好学习算法演进。
- **Constitutional AI**（Anthropic）：用 LLM 替代人类标注。
- **Self-Improvement**：Self-Play、Self-Refine。
- **Online DPO**：实时反馈驱动实时训练。
- **Multi-Modal Feedback**：语音 / 表情 / 行为多模态反馈。
- **Feedback-Driven RAG**：反馈直接驱动 RAG 检索优化。
- **Agent Self-Critique**：Agent 自我评估 + 自我修正。

### 5.2 与 RAG / GraphRAG 的结合

- 反馈驱动的 RAG：基于用户反馈优化检索。
- GraphRAG 反馈：用户纠正图谱关系。
- 反馈驱动的记忆：反馈评分长期记忆的重要性（与 Ch7 §1 联动）。
- 反馈驱动的资产：反馈评分 AI 资产的价值（与 Ch7 §3 联动）。

### 5.3 2024-2025 进展

- DeepSeek-R1（GRPO，2025-01）
- Anthropic Constitutional AI（2024）
- OpenAI o1 / o3 推理能力来自 RL
- Llama 3.1、Qwen 2.5 的 RLHF 改进
- Self-Play 在数学 / 代码任务突破
- Online DPO 工业落地

### 5.4 未来 3-5 年趋势

- 反馈闭环自动化（Self-Improvement）
- RL 与 Self-Play 结合
- 在线学习 + Agent 平台融合
- 多模态反馈（语音 / 表情 / 行为）
- 反馈数据治理成为 AI 治理核心议题
- 跨 Agent 反馈共享（联邦学习）

### 5.5 学术与工业前沿论文

| 论文 / 系统 | 时间 | 贡献 |
| --- | --- | --- |
| **InstructGPT** | 2022 | RLHF 三阶段 |
| **DPO** | 2023 | 直接偏好优化 |
| **KTO** | 2024 | 单点偏好 |
| **IPO** | 2024 | 防过拟合 |
| **GRPO（DeepSeek-R1）** | 2025 | 组内相对优化 |
| **Constitutional AI** | 2022 | LLM 替代人类 |
| **Self-Refine** | 2023 | 自我反思修正 |
| **WebGPT** | 2021 | 人类反馈驱动的搜索 |
| **Anthropic HH-RLHF** | 2022 | 有害性偏好数据 |
| **OpenAI o1 / o3** | 2024-2025 | RL 推理突破 |

### 5.6 工业产品地图（2025）

| 产品 | 反馈机制 | 特色 |
| --- | --- | --- |
| ChatGPT | 👍 / 👎 + 显式"记住 X" | 大规模反馈数据 |
| Claude | 反馈 + Constitutional AI | 安全对齐 |
| Cursor | Accept / Reject | 代码接受率 |
| Devin | 任务级反馈 | 端到端任务 |
| 豆包 | 点赞 + 任务完成度 | 大规模反馈 |
| 通义千问 | 点赞 + DPO 训练 | 在线学习 |
| DeepSeek | GRPO 训练 | 推理能力 |

---
