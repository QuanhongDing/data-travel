> 本文件是 **02-feedback-loop.md** 的子文件（§6. 落地实践）。完整章节请回到 [index](02-feedback-loop.md)。

## 6. 落地实践

### 6.1 真实案例

- DeepSeek-R1：GRPO 训练取得 SOTA 推理能力。
- ChatGPT：RLHF 早期奠基者。
- 字节豆包：大规模反馈数据 + 持续训练。
- 阿里通义：千问 DPO + 在线学习。
- Cursor：Accept/Reject 直接训练 Copilot。

更细的案例分析：

#### 案例 1：DeepSeek-R1（GRPO 推理突破）

背景：传统 SFT + RLHF 在数学 / 代码推理任务上受限。

方案：
- 用 GRPO（组内相对优势）训练。
- Reward 用规则（答案对不对 + 推理格式）。
- 不需要 Reward Model，节省显存。

效果：在 MATH、Codeforces、GPQA 等基准上 SOTA。

关键经验：
- Group Size 要够大（≥8）才能稳定。
- Reward 设计要"稀疏但准确"。
- 训练数据要"高难度"才有意义。

#### 案例 2：ChatGPT（RLHF 奠基）

背景：InstructGPT（2022）开创 RLHF 范式。

方案：
- Step 1：SFT（人工撰写理想回答）。
- Step 2：Reward Model（人类偏好打分）。
- Step 3：PPO（最大化奖励 + KL 惩罚）。

效果：人类偏好胜出率大幅提升。

关键经验：
- 偏好数据质量 > 数量。
- KL 系数要平衡（防漂移）。
- 持续在线更新（每月发版）。

#### 案例 3：Cursor（代码接受率训练）

背景：代码 Copilot 需要"用户接受率"作为反馈。

方案：
- 用户接受 Tab → 接受率 +1。
- 用户跳过 / 修改 → 接受率 -1。
- 用接受率数据微调（DPO）。

效果：代码接受率从 20% → 40%+。

#### 案例 4：豆包（大规模反馈）

背景：字节豆包日活千万，反馈数据规模极大。

方案：
- 显式点赞 / 点踩。
- 隐式：复制、修改、追问、停留。
- 反馈驱动 Prompt + 模型迭代。

效果：用户满意度持续提升。

#### 案例 5：通义千问（DPO + Online Learning）

背景：阿里通义需要快速迭代。

方案：
- 离线：DPO 训练。
- 在线：FTRL 风格的 Prompt 在线调优。

效果：模型快速迭代 + 个性化提升。

### 6.2 踩坑

- 反馈延迟导致模型僵化。
- 反馈数据漂移导致模型偏差。
- 标注一致性差导致训练信号噪声。
- 反馈归因错误导致优化错向。
- 反馈恶意刷量（攻击 / 竞争对手）。
- 反馈单一指标导致"指标好看但用户体验差"。

更细的踩坑清单：

| 踩坑 | 表现 | 根因 | 解决 |
| --- | --- | --- | --- |
| 反馈延迟 | 模型跟不上新趋势 | 反馈→训练慢 | Online Learning |
| 反馈漂移 | 模型偏差越走越远 | 数据分布变化 | 漂移检测 + 重训 |
| 标注一致性差 | 同一回答多人打分冲突 | 标注规范不统一 | 标注规范 + 培训 |
| 反馈归因错 | 优化了错的组件 | 归因模型不准 | 反事实推理 |
| 恶意刷量 | 训练信号被污染 | 攻击 | 异常检测 + 限流 |
| 指标好看体验差 | 点赞变多但用户流失 | 单一指标 | 多维度指标体系 |

### 6.3 落地路径

0→1：A/B 测试 + 显式反馈；1→10：Feedback Lake + 标注平台；10→100：Online Learning + Agent 自治。

具体路径：

| 阶段 | 关键建设 | 投入 | 效果 |
| --- | --- | --- | --- |
| 0→1 | A/B + 显式反馈 | 1-2 周 | 能看出版本差异 |
| 1→10 | Feedback Lake + Eval | 1-2 月 | 能持续优化 |
| 10→100 | Online Learning + 自驱动 | 半年+ | 自进化 |

### 6.4 ROI

- 推荐系统：反馈闭环后 CTR 提升 10-30%。
- LLM 应用：用户满意度提升 20%+。
- Coding Agent：代码接受率提升 30%+。
- 客服 Agent：解决率提升 15-25%。
- 教育 Agent：续课率提升 10-20%。

### 6.5 A/B 测试细节

#### 6.5.1 实验设计

- **流量分层**：用户级 / 会话级 / 请求级。
- **样本量计算**：用 power analysis 算最小样本量。
- **显著性检验**：t-test、bootstrap、sequential testing。
- **多臂老虎机**：动态分流（Thompson Sampling）。

#### 6.5.2 常用指标

- **主指标**：CSAT、CTR、转化率、任务完成率。
- **护栏指标**：响应延迟、错误率、成本、合规违规率。
- **长期指标**：留存、LTV、推荐满意度。

#### 6.5.3 进阶实验方法

- **CUPED**（Controlled-experiment Using Pre-Experiment Data）：用实验前数据降方差。
- **Interleaving**：交叉展示两个版本的结果，让用户直接选（适合排序）。
- **Switchback**：周期性切换 control / treatment（适合网络效应）。
- **Multi-Armed Bandit**：动态流量分配，最大化探索 / 利用。

### 6.6 Eval-Driven Development（评估驱动开发）

LLM 应用版本的"测试驱动开发"：

```
1. 写测试集（Eval Set）
2. 写评估指标（自动 + 人工）
3. 跑 baseline
4. 改 Prompt / 模型
5. 跑评估，看是否提升
6. CI/CD 集成
```

评估集设计原则：
- **覆盖业务核心场景**（≥100 条）。
- **包含对抗 / 边界 case**（≥20%）。
- **定期更新**（避免过拟合评估集）。
- **多维度评分**（准确 / 相关 / 安全 / 风格）。

### 6.7 反馈数据治理

反馈数据本身也是数据资产，需要治理：

- **去噪**：异常检测、刷量识别。
- **脱敏**：PII 去除 / 加密。
- **归一**：多源反馈统一 schema。
- **归因**：把反馈映射到具体组件 / Prompt / 模型版本。
- **审计**：谁在什么时候写了 / 改了 / 删了反馈。
- **漂移检测**：反馈分布异常检测（KL 散度、PSI）。

### 6.8 HITL 平台架构

Human-in-the-Loop 平台的工程要素：

```
┌─────────────────────────────────────────────────────┐
│                  HITL Platform                       │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │  Task Queue  │  │ Annotator UI │  │  QA Review  ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │ Reward Model │  │  Active Learn│  │  Audit Log  ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
              Training Data Warehouse
```

HITL 平台的关键能力：
- 任务分发（按标注员能力 / 配额）。
- 标注一致性（多人标注 + Kappa 一致性检验）。
- 标注质量（黄金题目测试 + 培训）。
- 主动学习（挑最有价值的样本让人标）。
- 标注审计（provenance / 时长 / 修改轨迹）。
- 隐私保护（标注员只看到脱敏数据）。

主流 HITL 平台：
- Label Studio（开源、自托管）
- Scale AI（商业、高质量）
- Snorkel（弱监督 + 编程化标注）
- Argilla（开源、LLM 友好）
- Scale GenAI Platform（端到端 GenAI 标注）

### 6.9 Online Learning 工程实践

在线学习是把反馈实时回流到模型的关键技术：

#### 6.9.1 特征侧在线学习

- FTRL：Google 用于广告 CTR 在线学习。
- 带 Sparsity 的 FTRL：模型稀疏、特征自动选择。
- Online Lasso / Ridge：简单线性模型在线更新。

适用：推荐 / 广告 / 搜索 CTR。

#### 6.9.2 LLM 侧在线学习

- Online DPO：实时反馈驱动实时 DPO 训练（分钟级）。
- Prompt 在线优化：基于反馈调整 Prompt 模板 / Few-shot。
- Embedding 在线微调：基于反馈微调检索 embedding。

适用：个性化对话 / 客服 / Copilot。

#### 6.9.3 Bandit 探索

- LinUCB：上下文老虎机。
- Thompson Sampling：贝叶斯探索。
- ε-greedy：简单 ε 概率探索。
- Contextual Bandit：考虑上下文。

适用：探索-利用平衡、新功能灰度。

### 6.10 反馈系统的演进路径

```
0→1（最小反馈）：
  - A/B 测试 + 显式反馈（点赞 / 点踩）
  - 反馈写入 Feedback Lake
  - 每周复盘，人工调 Prompt

1→10（数据化反馈）：
  - Feedback Lake + 归因分析
  - DPO / GRPO 训练 pipeline
  - Eval-Driven Development
  - 每月发版

10→100（自进化反馈）：
  - Online Learning（实时反馈）
  - HITL 标注 + Active Learning
  - Self-Improvement（Self-Play / Self-Refine）
  - Constitutional AI（LLM 替代部分人类标注）
  - 多目标优化（CSAT × CTR × 合规）
  - 持续发版 + 灰度
```

### 6.11 反馈驱动 RAG（Feedback-Driven RAG）

反馈可以直接驱动 RAG 优化：

- 检索失败 → 重新训练 embedding 或调整 chunking。
- 用户纠正 → 写入知识库 / 反馈驱动 KG 演化。
- 用户偏好 → 检索时加权相关文档。

工程实现：

```python
# 用户点踩 → 反馈驱动 RAG
if feedback == "reject" and reason == "irrelevant":
    # 把这条 query 标记为失败 case
    eval_set.add(query, response, expected="better")
    # 触发 embedding 重训（每周 / 每月）
    if failure_rate > 0.1:
        schedule_embedding_retrain()
```

---
