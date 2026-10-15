> 本文件是 **01-long-term-memory.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](01-long-term-memory.md)。

## 4. 工程实现

### 4.1 落地步骤

1. **明确记忆范围** → 单会话 / 跨会话 / 跨用户？
2. **选择记忆模式** → RAG / Mem0 / MemGPT / 知识图谱？
3. **搭建存储层** → 向量库 + 关系库 + 缓存
4. **设计检索 API** → query → top-k 记忆
5. **接入 Agent 框架** → LangChain / LangGraph Memory 模块
6. **加入遗忘机制** → 时间衰减 + 用户主动删除
7. **监控与评估** → 记忆准确率、检索命中率、成本
8. **合规审计** → 写入读取审计、GDPR 删除支持

更细的工程步骤（按 0→1 / 1→10 / 10→100 分阶段）：

| 阶段 | 目标 | 关键产出 | 周期 |
| --- | --- | --- | --- |
| 0→1 | 跑通最小记忆闭环 | Session Memory + 提取 prompt | 1-2 周 |
| 1→10 | 接入结构化记忆 | Mem0 / Zep / 向量库 | 1-2 月 |
| 10→100 | 自研 + 合规 + 监控 | 自研记忆层 + KG + 遗忘 + 审计 | 半年+ |

### 4.2 关键技术点

- **记忆提取**：LLM 从对话中提取事实（实体、关系、属性、事件）
- **记忆存储**：向量 + 关系 + 时间戳的三元组存储
- **记忆检索**：Embedding 相似度 + 时间衰减 + 重要性加权
- **记忆压缩**：定期摘要压缩长历史，控制成本
- **记忆遗忘**：GDPR / 个保法合规要求
- **记忆冲突解决**：版本号 + 最近更新优先
- **记忆隔离**：多租户场景严格隔离
- **记忆去重**：相似度阈值合并重复事实
- **记忆血缘**：每条记忆的来源对话、提取模型、写入时间可追溯
- **记忆冷热分层**：热数据 Redis / 向量库 / PG；冷数据 S3 / OSS + 离线索引

### 4.3 工具链与平台

| 类别 | 工具 |
| --- | --- |
| **专用记忆框架** | Mem0（2024）、Letta（前身 MemGPT，2024）、Zep、MemoryBank、Cognee |
| **向量数据库** | Milvus、Qdrant、Weaviate、Pinecone、pgvector |
| **知识图谱** | Neo4j、NebulaGraph、Apache Jena、Oxigraph |
| **Agent 框架 Memory 模块** | LangChain Memory、LangGraph Checkpoint、AutoGen Memory |
| **缓存 / Session** | Redis、DragonflyDB、Memcached |
| **评估工具** | Langfuse、Helicone、Arize Phoenix、Mem0 Eval |
| **Embedding 模型** | OpenAI text-embedding-3-large、BGE-M3、Cohere embed-v3 |
| **重排模型** | Cohere Rerank 3、BGE Reranker |

各工具的特点对比：

| 工具 | 类型 | 特点 | 适用 |
| --- | --- | --- | --- |
| Mem0 | 提取式记忆 | 自动 ADD/UPDATE/DELETE | 个性化推荐 |
| Letta | 分页式记忆 | 模拟 OS 虚拟内存 | 长对话 |
| Zep | 时序事实 | 时间衰减 + 重要性 | 跨会话连续 |
| MemoryBank | 压缩式记忆 | 类 Ebbinghaus 遗忘曲线 | 成本敏感 |
| Cognee | 混合式记忆 | KG + 向量混合 | 复杂推理 |
| LangGraph | Checkpoint | 工程化 Agent 状态 | 流程编排 |

### 4.4 代码示例

Mem0 风格记忆：

```python
from mem0 import Memory

m = Memory()

# 提取并存储记忆
m.add("用户是 VIP 客户，偏好高端商品", user_id="alice")
m.add("用户上个月咨询过退款政策", user_id="alice")

# 检索记忆
related = m.search("用户偏好什么？", user_id="alice", limit=5)
# 返回：["VIP 客户，偏好高端商品", "上个月咨询过退款政策"]
```

LangGraph Checkpoint：

```python
from langgraph.checkpoint.postgres import PostgresSaver

checkpointer = PostgresSaver.from_conn_string("postgresql://...")
graph = builder.compile(checkpointer=checkpointer)

# 多轮对话自动持久化
config = {"configurable": {"thread_id": "user-123"}}
result = graph.invoke({"messages": [...]}, config=config)
```

Letta 分页记忆示意：

```python
from letta import create_client

client = create_client()
agent = client.create_agent(
    memory_mode="memgpt",
    core_memory_limit=4096,      # Core 限制 4K
    archival_memory_size=10_000  # Archival 容量
)

# Agent 自动管理 Core / Archival 之间的换入换出
response = client.send_message(agent.id, "我住在北京海淀")
```

Zep 时序事实：

```python
from zep_client import ZepClient

z = ZepClient(url="https://...", api_key=os.environ["ZEP_API_KEY"])

# 添加记忆
z.memory.add(
    session_id="user-123",
    messages=[{"role": "user", "content": "我最近失眠，想看医生"}],
)

# 检索时序事实
facts = z.memory.search(session_id="user-123", query="用户最近的健康问题")
# 返回：["用户最近失眠", "想看医生"] + 时间戳 + 重要性
```

### 4.5 自研记忆层（10→100 阶段）

当通用框架不够用时（金融、医疗、跨境合规等），需要自研。一个典型的自研记忆层架构：

```
┌────────────────────────────────────────────────────┐
│                  Agent Runtime                      │
│   (LangGraph / AutoGen / 自研)                       │
└─────────────────────┬───────────────────────────────┘
                      │ Memory API (read/write/search/forget)
┌─────────────────────▼───────────────────────────────┐
│              Memory Layer (自研)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Extraction │  │   Storage   │  │  Retrieval  │  │
│  │  Pipeline   │  │   Layer     │  │   Engine    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│         Vector DB + KG + KV + Cold Storage           │
│  Milvus / Neo4j / Postgres / S3                      │
└─────────────────────────────────────────────────────┘
```

自研记忆层的关键模块：

| 模块 | 职责 | 关键技术 |
| --- | --- | --- |
| Extraction | 从对话提取事实 | LLM + schema 强约束 |
| Storage | 多模态存储 | 向量 + 关系 + 时序 |
| Retrieval | 混合检索 | 向量 + BM25 + KG + rerank |
| Importance | 评分 | LLM 评分 + 行为反馈 |
| Forgetting | 主动遗忘 | 时间衰减 + GDPR API |
| Audit | 审计日志 | 全量写入读取日志 |

---
