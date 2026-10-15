> 本文件是 **04-agent-skill-extraction.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](04-agent-skill-extraction.md)。

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
