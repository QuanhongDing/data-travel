> 本文件是 **04-agent-skill-extraction.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](04-agent-skill-extraction.md)。

## 7. 与其他方法对比

| 维度 | 人工编写 | Skill Mining | Self-Play | Procedural Memory |
| --- | :---: | :---: | :---: | :---: |
| 效率 | 1 | 4 | 5 | 5 |
| 质量 | 5 | 3 | 3 | 4 |
| 自动化 | 1 | 4 | 5 | 5 |
| 冷启动 | 5 | 2 | 5 | 3 |
| 成本 | 高 | 中 | 中 | 中 |
| 可解释 | 5 | 3 | 2 | 3 |
| 跨任务 | 2 | 4 | 4 | 5 |

### 7.1 选型决策

| 场景 | 推荐方法 | 理由 |
| --- | --- | --- |
| 冷启动 | 人工编写 + 种子 Skill | 没有历史日志 |
| 业务稳定 | Skill Mining（离线） | 周期提取 |
| 高频任务 | Procedural Memory（在线） | 实时学习 |
| 数学 / 代码 | Self-Play RL | 可自动验证 |
| 高合规 | 人工编写 + HITL 校验 | 必须可控 |
| 多 Agent | Cross-Agent Transfer | 共享 Skill |

### 7.2 与其他章节的关系

- 与 Ch7 §1 长期记忆：Procedural Memory 与长期记忆联动。
- 与 Ch7 §2 反馈闭环：Skill 评估需要反馈。
- 与 Ch7 §3 资产管理：Skill 是 AI 资产的一种。
- 与 Ch5 Agent 平台：Skill 是 Agent 的"插件"。

### 7.3 成本对比

| 方法 | 建设成本 | 使用成本 | 维护成本 |
| --- | --- | --- | --- |
| 人工编写 | 低 | 高 | 高 |
| Skill Mining | 中 | 中 | 中 |
| Self-Play RL | 高 | 中 | 中 |
| Procedural Memory | 中 | 低 | 中 |
| 混合 | 高 | 低 | 中 |

### 7.4 性能与扩展性

- 单 Skill 库：1k-10k Skills（HDBSCAN 可处理）。
- 大规模 Skill 库：100k+（需要分层 + 检索）。
- 跨 Agent Skill：联邦式 Skill Library。
- 实时 Skill 提取：需要增量聚类 + 在线 LLM。

### 7.5 Skill Library 平台架构详解

```
┌─────────────────────────────────────────────────────┐
│                 Skill Library Platform              │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │ Trajectory   │  │  Cluster     │  │  Abstract   ││
│  │ Storage      │  │  Engine      │  │  Service    ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │  Verifier    │  │  Skill Store │  │  HITL UI    ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │  Retriever   │  │  Evaluator   │  │  Retirer    ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
                 Agent Runtime
```

各模块详解：

| 模块 | 职责 | 关键技术 |
| --- | --- | --- |
| Trajectory Storage | 存储行为轨迹 | ClickHouse / S3 + Iceberg |
| Cluster Engine | 轨迹聚类 | HDBSCAN / Transformer 序列 |
| Abstract Service | LLM 抽象 | Prompt + GPT-4 / Claude |
| Verifier | Skill 验证 | 自动 + LLM-as-Judge |
| Skill Store | Skill 库存储 | Postgres / Vector DB |
| HITL UI | 人工审核 | Label Studio / 自研 |
| Retriever | Skill 检索 | Embedding + BM25 |
| Evaluator | 效果评估 | CSAT / 业务指标 |
| Retirer | 自动退役 | 老化检测 |

### 7.6 Skill 检索与匹配

Agent 调用 Skill 时需要找到合适的 Skill：

#### 7.6.1 检索方法

- **关键词匹配**：触发词匹配（"退款" → 退款 Skill）。
- **语义检索**：Embedding + 向量库（基于意图匹配）。
- **任务相似度**：基于任务描述找历史成功的 Skill。
- **图谱匹配**：基于实体关系匹配相关 Skill。

#### 7.6.2 检索流程

```
用户任务
   ↓
Query 理解（提取意图 + 关键实体）
   ↓
Skill 检索（embedding 相似度 + 触发词）
   ↓
Top-K Skill 候选
   ↓
LLM 重排（选择最合适的 Skill）
   ↓
执行 Skill
```

#### 7.6.3 Skill 调用方式

- **直接调用**：Agent 显式调用 Skill（Tool Use 风格）。
- **隐式调用**：Agent 决策引擎自动选 Skill。
- **混合调用**：先检索 Top-K，再显式调用。

### 7.7 跨 Agent Skill Transfer

多 Agent 协作场景下 Skill 如何共享：

- **共享 Skill Library**：所有 Agent 共享同一个 Skill Library。
- **领域隔离**：按领域分配 Skill Library（金融 / 医疗 / 客服）。
- **Skill 联邦**：跨组织 Skill 共享（同态加密）。
- **Skill Market**：Skill 作为资产可购买。

### 7.8 自检问题

读完本章，你应该能回答：

1. Skill Extraction 和 RAG 的本质区别是什么？
2. Skill Mining 的核心算法流程是什么？
3. DBSCAN 和 HDBSCAN 的区别？
4. LLM 抽象 Skill 时如何避免幻觉？
5. Self-Play RL 适合什么场景？
6. Skill 验证怎么做？验证集怎么构建？
7. Skill Library 和 Asset Registry 怎么联动？
8. Skill Extraction 的冷启动怎么做？
9. Procedural Memory 和 Semantic Memory 的边界？
10. Skill Extraction 的 ROI 怎么算？

### 7.9 Skill Extraction 的关键论文 / 系统

| 系统 / 论文 | 时间 | 贡献 |
| --- | --- | --- |
| **Voyager** | 2023-11 | Minecraft 中自动技能库发现 |
| **Reflexion** | 2024-04 | 自我反思 + Skill 积累 |
| **Auto-Skill** | 2024 | LLM 自动生成 Skill |
| **Compositional Skills** | 2025 | Skill 组合生成新 Skill |
| **Self-Play RL** | 2024-2025 | 自我博弈 |
| **Cursor Composer** | 2024 | IDE 内 Skill 编排 |
| **Devin** | 2024 | 端到端 Coding Agent |

### 7.10 Skill Extraction 的开放问题

1. Skill 抽象度的最优边界（太具体 → 难复用；太抽象 → 难执行）。
2. Skill 冲突的自动检测与解决。
3. Skill 库的可解释性（为什么用这个 Skill）。
4. Skill 的因果推理（基于 Skill 做反事实推理）。
5. 跨语种 Skill（中文 / 英文 Skill 是否等价）。
6. Skill 老化与迁移（场景变了 Skill 怎么迁移）。
7. Skill 安全（恶意 Skill 如何检测）。

### 7.11 与组织能力建设

Skill Library 是组织能力的"AI 镜像"：

- 每个部门 / 团队都有自己的 Skill Library（销售 Skill / 客服 Skill / 代码 Skill）。
- Skill Library 的"丰富度"反映组织能力。
- Skill 命中率反映组织效率。
- Skill 演进反映组织学习速度。

组织能力建设的衡量指标：
- Skill 库总规模。
- 跨团队 Skill 复用率。
- Skill 命中率。
- Skill 老化周期。
- Skill 演进频率。

---
