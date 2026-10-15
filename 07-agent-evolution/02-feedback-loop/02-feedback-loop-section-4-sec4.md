> 本文件是 **02-feedback-loop.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](02-feedback-loop.md)。

## 4. 工程实现

### 4.1 落地步骤

1. 反馈采集设计（显式 + 隐式）
2. 反馈存储（Feedback Lake）
3. 反馈清洗、归因
4. 训练数据生成
5. 模型迭代（DPO / GRPO / Online）
6. A/B 测试、灰度
7. 监控、回滚
8. 反馈本身的质量治理

### 4.2 关键技术点

- 反馈 API 设计
- Feedback Lake（专用存储）
- 标注平台（Label Studio、Scale AI）
- A/B 测试平台（火山引擎、Optimizely）
- Eval 平台（Langfuse、Helicone）
- Reward Model 训练
- PPO / DPO / GRPO 训练框架（TRL、OpenRLHF）
- 在线学习框架（FTRL、Bandit）
- 反馈数据治理（去噪、归因、漂移检测）

### 4.3 工具链

Label Studio、Scale AI、Snorkel、Argilla、Langfuse、Helicone、Arize Phoenix、火山引擎 A/B、Statsig、GrowthBook、Optimizely。

更细的工具分类：

| 类别 | 工具 | 用途 |
| --- | --- | --- |
| 标注平台 | Label Studio、Scale AI、Snorkel、Argilla | HITL 数据标注 |
| Eval / 监控 | Langfuse、Helicone、Arize Phoenix | LLM 评估与可观测 |
| A/B 平台 | 火山引擎、Optimizely、Statsig、GrowthBook | 在线实验 |
| 偏好数据 | Argilla、Hugging Face H4 | 偏好对收集 |
| 训练框架 | TRL、OpenRLHF、LLaMA-Factory | RLHF / DPO / GRPO |
| 在线学习 | FTRL、BanditLib、Vowpal Wabbit | 流式训练 |
| Self-Improvement | Self-Play 框架、Constitutional AI 库 | 自我进化 |

### 4.4 代码示例

```python
from trl import DPOTrainer, DPOConfig

# DPO 训练
trainer = DPOTrainer(
    model=model,
    ref_model=ref_model,
    args=DPOConfig(output_dir="./dpo-output"),
    train_dataset=preference_dataset,  # {"prompt": ..., "chosen": ..., "rejected": ...}
)
trainer.train()
```

GRPO 训练（示意）：

```python
from trl import GRPOTrainer, GRPOConfig

trainer = GRPOTrainer(
    model=model,
    reward_funcs=[accuracy_reward, format_reward],
    args=GRPOConfig(
        output_dir="./grpo-output",
        num_generations=8,        # 组大小
        beta=0.04,                # KL 系数
    ),
    train_dataset=math_dataset,
)
trainer.train()
```

Feedback Lake 写入：

```python
# 显式反馈
feedback_lake.write(
    user_id="alice",
    session_id="s-123",
    turn_id=3,
    feedback_type="explicit",
    rating=5,
    comment="回答非常清楚",
    prompt=prompt,
    response=response,
)

# 隐式反馈
feedback_lake.write(
    user_id="alice",
    session_id="s-123",
    turn_id=3,
    feedback_type="implicit",
    signal="copy",  # 用户复制了回答
    prompt=prompt,
    response=response,
)
```

A/B 测试分流（示意）：

```python
import hashlib

def assign_group(user_id, experiment_name):
    h = hashlib.md5(f"{user_id}-{experiment_name}".encode()).hexdigest()
    return "treatment" if int(h, 16) % 100 < 50 else "control"
```

### 4.5 反馈数据 schema

```sql
CREATE TABLE feedback_event (
    id            BIGSERIAL PRIMARY KEY,
    user_id       VARCHAR(64) NOT NULL,
    session_id    VARCHAR(64),
    turn_id       INT,
    timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 反馈内容
    feedback_type VARCHAR(32) NOT NULL,  -- explicit / implicit / derived
    signal        VARCHAR(64) NOT NULL,  -- rating / copy / accept / reject / ...
    value         FLOAT,                  -- 数值（评分 / 概率）

    -- 上下文
    prompt        TEXT,
    response      TEXT,
    model         VARCHAR(64),
    prompt_version VARCHAR(32),

    -- 归因
    experiment_id VARCHAR(64),
    group         VARCHAR(32),

    -- 治理
    pii_masked    BOOLEAN DEFAULT FALSE,
    consent       BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_user_ts ON feedback_event(user_id, timestamp DESC);
CREATE INDEX idx_experiment ON feedback_event(experiment_id, group);
```

---
