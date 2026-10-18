# Agent 长期记忆（Long-Term Memory）

> **一句话定位**：让 Agent 不只活在"当下对话"——跨会话、跨任务、跨用户记住关键上下文，让 Agent 越用越懂你。

> 本文是 data-travel 项目 [Ch7 · AI 资产沉淀与自进化](../../README.md) 的子章节（01-long-term-memory）。覆盖核心职责④ AI 资产沉淀与自进化系统中"记忆资产"核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| Agent 为什么需要长期记忆 | §1.1、§1.2 |
| 短期 / 工作 / 长期 / 情景 / 程序性五种记忆如何划分 | §2.1 |
| MemGPT、Mem0、Letta 等架构怎么选 | §3.1、§4.3 |
| 长期记忆的隐私与安全怎么保 | §5.2、§6.1 与 §6.4 |
| 我的业务该选哪种记忆方案 | §7.5 |

---

## 1. 概念与定位

### 1.1 是什么

**Agent 长期记忆（Long-Term Memory, LTM）** 是 Agent 系统中独立于"当前对话上下文窗口"之外的、**持久化、可检索、可更新** 的记忆系统。它解决 LLM Agent 一个根本性局限：**单次对话有上下文窗口限制（8K-2M-token），跨会话就清零**。

类比人类记忆：

| 人类记忆 | Agent 长期记忆 | 工程映射 |
| --- | --- | --- |
| 工作记忆（几秒-几分钟） | 当前上下文窗口 | LLM Context Window |
| 短期记忆（几小时-几天） | Session Memory | Redis / DB 会话存储 |
| 长期记忆（几月-几年） | User Memory / Global Memory | 向量库 + 知识图谱 |
| 情景记忆（"上次我们去..."） | Episodic Memory | 时间戳 + 事件序列存储 |
| 程序性记忆（"我会骑自行车"） | Procedural Memory / Skill Library | Skill 库 + 工具调用模板 |

补充说明 5 种记忆的工程含义：

- **工作记忆（Working Memory）**：即 LLM 当前推理所用的 KV cache 与 prompt。容量小（一般 8K-128K token），但是推理路径上的"主角"。它由系统提示 + 用户本轮输入 + 检索召回 + 历史若干轮对话共同拼接，是当下回答的唯一"事实来源"。
- **短期记忆（Short-Term / Session Memory）**：跨工具调用、跨多轮但仍处于"一个会话内"的记忆。一般由 Redis、KVStore、Postgres 中的 sessions 表承载，键通常是 thread_id 或 session_id，TTL 从 24h 到 30 天不等。
- **长期记忆（Long-Term / User Memory）**：跨会话、跨用户的"用户/组织"层面的记忆。存储在向量库 + 关系库 + 知识图谱中，按 user_id 隔离，理论上无限期保留。
- **情景记忆（Episodic Memory）**：以"事件 + 时间 + 上下文"为粒度的记忆。强调"某次发生了什么"，对调试 Agent 行为、复盘错误、做反事实推理至关重要。
- **程序性记忆（Procedural Memory）**：从经验中沉淀的"怎么做"的步骤。对应 Agent 平台的 Skill / Workflow / Tool 模板库，与本仓库 Ch7 §4「Agent 技能提取」是同一类资产的不同视角。

### 1.2 为什么需要

**业务驱动力**：
1. **个性化体验**：用户希望 Agent "记得住我"——知道我是高级会员、知道我的偏好、知道我们的历史交互。
2. **跨任务连续性**：复杂任务往往是多轮、多日的（"昨天讨论的那个项目，今天继续"）。
3. **组织知识沉淀**：Agent 与团队的交互应该沉淀为组织可复用的知识。

**痛点（没有 LTM 的失败案例）**：
- 某客服 Agent 用户每次都要重新描述问题——用户崩溃、转化率下降 30%。
- 某研发 Copilot 不记得用户的技术栈，每次推荐都用错的语言——接受率下降 50%。
- 某 BI Agent 不记得用户上次看的指标，每次都要重新查询——效率下降 70%。

更系统的失败模式归类：

| 失败模式 | 业务表现 | 量化影响 | 根因 |
| --- | --- | --- | --- |
| 重复提问 | 用户每次重新交代背景 | CSAT 下降 15-25% | 无跨会话记忆 |
| 上下文丢失 | 长任务中断后无法续接 | 任务放弃率上升 30% | 工作记忆未持久化 |
| 推荐发散 | 不基于历史偏好 | CTR 下降 20% | 无用户偏好记忆 |
| 错误重复 | 同一幻觉反复出现 | 错误率居高 | 无情景记忆做反事实 |
| 合规风险 | 用户要求遗忘但做不到 | 法律处罚 | 无主动遗忘机制 |

**AI 时代新诉求**：
1. **结构化记忆**：记忆不再是"对话日志"，而是结构化的实体 / 关系 / 时间戳。
2. **可推理记忆**：Agent 应该能基于记忆做推理（"基于用户过去 3 个月行为，推荐 XX"）。
3. **可遗忘机制**：合规要求记忆可被遗忘（GDPR、个保法）。
4. **跨主体共享**：团队 / 项目 / 组织的记忆如何在多 Agent 间共享与隔离。
5. **可审计**：每一笔记忆的写入、读取、修改都有审计日志。

### 1.3 在 AI 时代数据架构中的位置

长期记忆位于"Agent 框架"与"数据资产"的交叉点：

```
       Agent 框架（LangChain / LangGraph / AutoGen）
            ↓ 持久化需求
       长期记忆层（Mem0 / Letta / Zep）
            ↓ 数据资产化
       数据资产（向量库 + 关系库 + 知识图谱）
            ↓ 治理
       AI 治理（Ch8）
```

进一步展开记忆层的数据流：

```
用户消息 → 短期会话缓冲（Redis）
        → 工作记忆（Context Window）
        → 提取器（LLM Extract / Mem0 ADD/DELETE/UPDATE）
        → 长期记忆存储（Vector + KG + KV）
        → 重要性评分（重要性函数 f）
        → 检索器（Query → Top-K → 注入 Prompt）
        → 主动遗忘（GDPR / 时间衰减）
```

### 1.4 演进历程

- **传统阶段（2020-2023）**：RAG 为主，把"知识"塞进向量库，没有真正的"记忆"概念。
- **初级阶段（2023-2024）**：LangChain Memory 模块、对话历史压缩。
- **突破阶段（2024）**：MemGPT（2023-12）提出"分页记忆 + 层次化记忆"；Mem0（2024-10）开源；Letta（前身 MemGPT）2024 成立公司。
- **成熟阶段（2025）**：长期记忆成为 Agent 平台标配，与 RAG、知识图谱融合。
- **AI 治理融合（2025+）**：记忆写入 / 读取进入合规体系，跨 Agent 共享进入"记忆联邦"研究阶段。

更细的演进时间线：

| 时间 | 事件 | 关键贡献 |
| --- | --- | --- |
| 2023-06 | LangChain ConversationBufferMemory | "类 Buffer" 的最朴素记忆 |
| 2023-11 | LangChain ConversationSummaryMemory | 摘要压缩，控制 token |
| 2023-12 | MemGPT 论文（UC Berkeley） | 操作系统式分页 + 层次化记忆 |
| 2024-07 | Zep 1.0 | 时序事实抽取 + 时间衰减 |
| 2024-10 | Mem0 开源 | 提取式记忆 + ADD/DELETE/UPDATE |
| 2024-11 | Letta 公司化 | MemGPT 工程化平台 |
| 2025-02 | Cognee | 知识图谱 + 记忆的混合存储 |
| 2025-05 | Anthropic Memory API | Claude 跨会话"项目记忆"上线 |
| 2025-08 | OpenAI Memory（ChatGPT） | 用户偏好 + 显式"记住 X" |
| 2025-Q4 | 多模态记忆（图像、语音） | 走出纯文本 |

---

## 2. 核心原理

### 2.1 关键概念定义

| 概念 | 定义 | 一句话解释 |
| --- | --- | --- |
| **短期记忆（STM）** | 当前会话内的对话历史 | "这次对话我们聊了什么" |
| **工作记忆（WM）** | 当前任务相关上下文 | "现在正在做订单核对" |
| **长期记忆（LTM）** | 跨会话持久化的记忆 | "上周用户偏好 XXX" |
| **情景记忆（Episodic）** | 具体事件 + 时间戳 + 上下文 | "2024-10-08 用户问过退款流程" |
| **语义记忆（Semantic）** | 抽象知识、概念 | "VIP 用户 90 天未登录会流失" |
| **程序性记忆（Procedural）** | 技能、动作序列 | "调用退款 API 的步骤" |
| **记忆检索** | 基于 query 找到相关记忆 | "用户最近一次提问" |
| **记忆压缩** | 把冗长历史压缩为摘要 | "过去 100 条对话 → 10 条要点" |
| **记忆遗忘** | 删除 / 模糊化过期记忆 | "GDPR 要求删除用户记忆" |
| **记忆冲突解决** | 多个记忆冲突时的优先级 | "用户改地址后覆盖旧地址" |
| **记忆重要性** | 记忆的"值得长期保留"程度 | f: E → [0, 1] |
| **记忆时间衰减** | 越久远的记忆权重越低 | recency(e) = exp(-λ · Δt) |
| **记忆嵌入** | 把记忆文本转为向量 | 768/1024/3072 维 |
| **记忆分页（Paging）** | 类 OS 虚拟内存的层次化存储 | Core / Archived 分层 |

### 2.2 数学/形式化基础

长期记忆可被形式化为一个**带时间维度的检索系统**：

```
M = ⟨E, T, R, F, G⟩

M     = 记忆系统
E     = 记忆条目 {e1, e2, ..., en}
T     = 时间戳 ti ∈ R+（毫秒时间戳）
R     = 记忆关系（"指代"、"时序"、"因果"）
F     = 重要性函数 f: E → [0, 1]（哪些值得长期保留）
G     = 检索函数 g: Q × E → [0, 1]（给定 query 返回相关记忆）
```

记忆写入策略：

```
m_new = llm_extract(user_msg)
       ∧ if f(m_new) > θ then store(m_new, t=now)
       ∧ if conflict(m_new, m_old) then resolve(m_new, m_old)
```

记忆检索策略（Mem0 风格）：

```
retrieved = g(query, M)
           = top_k( cosine(embed(query), embed(e_i))
                    + α · recency(e_i)
                    + β · importance(e_i) )
```

进一步细化评分函数：

```
score(q, e) = w1 · sim(q, e)
            + w2 · recency(e)
            + w3 · importance(e)
            + w4 · confidence(e)
            + w5 · access_count_normalized(e)

其中：
  sim(q, e)        = 余弦相似度 / BM25
  recency(e)       = exp(-λ · (now - t_e))，λ 控制衰减速度
  importance(e)    = LLM 评出的重要性 ∈ [0, 1]
  confidence(e)    = 提取置信度
  access_count     = 历史被检索次数（隐式反馈）
```

### 2.3 关键算法/方法

| 方法 | 原理 | 适用边界 |
| --- | --- | --- |
| **MemGPT 分页记忆** | 类似 OS 虚拟内存，context 之外的内容"换页"到存储 | 长对话、复杂任务 |
| **Mem0 提取式记忆** | LLM 自动从对话中提取"事实"作为记忆 | 个性化推荐、客服 |
| **Zep 时间感知记忆** | 提取事实 + 时间衰减 + 重要性评分 | 跨会话连续性 |
| **MemoryBank 压缩记忆** | 定期摘要压缩长对话历史 | 成本敏感场景 |
| **向量检索 + 重排** | 简单 RAG 风格，加 rerank | 简单场景、知识问答 |
| **知识图谱记忆** | 实体关系建模 | 复杂推理场景 |
| **遗忘机制** | 时间衰减 / 重要性筛选 / 用户主动删除 | 合规场景 |
| **Cognee 混合记忆** | KG + 向量混合检索 | 复杂推理 + 事实抽取 |
| **Self-Edit Memory** | Agent 自己回顾并修正记忆 | 长期自进化 |
| **Episodic Memory + ReAct** | 复盘历史决策做反事实推理 | 高风险场景 |

### 2.4 与相邻概念的关系

- **长期记忆 vs RAG**：RAG 是"知识检索"（静态文档），LTM 是"个人 / 上下文检索"（动态对话历史）。
- **长期记忆 vs Session Storage**：Session Storage 只在单次会话有效，LTM 跨会话持久化。
- **长期记忆 vs Fine-tuning**：Fine-tuning 把知识"编入"模型权重（静态、难更新），LTM 把知识"外挂"在存储中（动态、易更新）。
- **长期记忆 vs Knowledge Graph**：KG 偏静态 schema，LTM 偏动态增量写入；二者可融合为"知识图谱记忆"（Cognee 路线）。
- **长期记忆 vs Context Caching**：Context Caching 是 prompt cache 的命中率优化（短期、成本优化），LTM 是业务级的语义层持久化（长期、业务连续性）。

### 2.5 记忆的数据建模

长期记忆的存储 schema 不同于传统 KV / 表。常见的数据模型有三种。

#### 2.5.1 事实三元组模型（Mem0 / Zep 风格）

```
记忆条目 = {
  id            : uuid
  user_id       : string           # 多租户隔离
  session_id    : string | null    # 来源会话
  fact          : string           # 提取出的事实
  subject       : string           # 主语
  predicate     : string           # 谓语
  object        : string           # 宾语
  importance    : float ∈ [0, 1]   # 重要性
  confidence    : float ∈ [0, 1]   # 提取置信度
  embedding     : vector[768..3072]# 语义向量
  created_at    : timestamp
  updated_at    : timestamp
  expires_at    : timestamp | null # 主动遗忘
  source        : "user_msg" | "inferred" | "external"
  metadata      : jsonb            # 业务属性
}
```

典型查询：

```sql
-- 找和"咖啡"相关的偏好
SELECT * FROM memory
WHERE user_id = 'alice'
  AND predicate IN ('preference', 'habit')
  AND embedding <-> embed('咖啡') < 0.3
ORDER BY importance DESC, updated_at DESC
LIMIT 10;
```

#### 2.5.2 情景事件模型（Episodic Memory 风格）

```
事件 = {
  id          : uuid
  user_id     : string
  ts          : timestamp
  event_type  : "user_query" | "agent_action" | "tool_call" | "feedback"
  actor       : "user" | "agent" | "tool"
  payload     : jsonb            # 完整内容
  context     : jsonb            # 上下文（topic / intent）
  outcome     : "success" | "fail" | "neutral"
  feedback    : jsonb | null     # 用户反馈（点赞/点踩）
}
```

适合做复盘、反事实推理、A/B 归因。

#### 2.5.3 图谱实体模型（KG Memory 风格）

```
节点（User / Order / Product / Topic ...）
边（purchased / viewed / complained / preferred ...）
边属性 {ts, weight, source, confidence}
```

适合做"基于历史行为的复杂推理"。

三种模型对比：

| 模型 | 优点 | 缺点 | 代表系统 |
| --- | --- | --- | --- |
| 事实三元组 | 简单、易检索 | 缺上下文、缺关系 | Mem0, Zep |
| 情景事件 | 完整、可复盘 | 体积大、检索慢 | Langfuse, Helicone |
| 图谱实体 | 可推理 | 工程复杂、写入慢 | Cognee, Neo4j-based |

#### 2.5.4 物理存储选择

| 数据类型 | 存储 | 理由 |
| --- | --- | --- |
| 向量 | Milvus / Qdrant / pgvector | 高维相似度检索 |
| 事实 / 关系 | Postgres / Neo4j | 强 schema + JOIN |
| 原始事件 | ClickHouse / S3 + Iceberg | 高吞吐、列存 |
| 缓存 | Redis | 热数据 |
| 冷数据 | S3 / OSS + 离线索引 | 成本低 |

> 💡 **思考锚点**：把你的 Agent 真正要记的东西按 §2.5 的三种模型归一次类——它更像 2.5.1 的事实三元组、2.5.2 的情景事件，还是 2.5.3 的图谱实体？定完类再看 2.5.4 的选型表：你为它选的那档存储，能不能同时接住这类记忆的查询形态（相似检索 / 复盘 / 多跳推理）与写入频率？接不住的那一项，你打算用什么补？

---

- [§3. 设计模式与范式](01-long-term-memory-section-3-sec3.md)
- [§4. 工程实现](01-long-term-memory-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](01-long-term-memory-section-5-ai.md)
- [§6. 落地实践](01-long-term-memory-section-6-sec6.md)
- [§7. 与其他方法对比](01-long-term-memory-section-7-sec7.md)
- [§8. 面试真题集](01-long-term-memory-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](01-long-term-memory-section-3-sec3.md)
- [§4. 工程实现](01-long-term-memory-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](01-long-term-memory-section-5-ai.md)
- [§6. 落地实践](01-long-term-memory-section-6-sec6.md)
- [§7. 与其他方法对比](01-long-term-memory-section-7-sec7.md)
- [§8. 面试真题集](01-long-term-memory-section-8-sec8.md)

---
