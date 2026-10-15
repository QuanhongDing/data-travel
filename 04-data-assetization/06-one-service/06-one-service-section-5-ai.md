> 本文件是 **06-one-service.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](06-one-service.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：Text-to-API**

LLM 把自然语言转 API 调用：

- Snowflake Cortex Analyst（2024）。
- Databricks Genie（2024）。
- 国内：阿里 Quick BI、腾讯 BI、百度 BI + LLM。

核心是「指标 schema 注入 + LLM + 校验 + 执行」。

**方向 2：Function Calling 数据服务**

把 OneService API 注册为 Agent Tool：

- OpenAI Function Calling。
- Anthropic Tool Use。
- MCP（Model Context Protocol）让 OneService 成为 Agent 通用数据源。

**方向 3：自然语言驱动的指标平台**

指标定义本身用 LLM 辅助：

- 业务方说「我要新用户 GMV」，LLM 推荐「原子指标 + 修饰词」。
- 自动生成 SQL + 物化策略。

**方向 4：Agent-driven 数据服务**

智能体自主维护 OneService：

- 监听表结构变更，自动更新 API。
- 监听指标异常，自动排查数据源。
- 自动生成 API 文档、OpenAPI Schema。

**方向 5：Semantic Layer + AI**

dbt Semantic Layer、Cube 等「语义层」与 LLM 深度集成：

- 业务方问「收入」，Semantic Layer 给出统一口径，LLM 组织答案。
- 跨数据源统一指标口径。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

- **RAG + OneService**：RAG 负责「文档问答」，OneService 负责「结构化数据问答」。
- **Text-to-API + RAG**：混合 RAG（向量 + API），LLM 决定走哪条。
- **GraphRAG + OneService**：GraphRAG 处理关联推理，OneService 处理指标聚合。
- **Agent + OneService + RAG**：Agent 同时调用 RAG（文档）和 OneService（指标）。

### 5.3 学术与工业最新进展（2024-2025）

- **Snowflake Cortex Analyst**（2024）——自然语言查询指标。
- **Databricks Genie**（2024）——自然语言查询数据。
- **dbt Semantic Layer**（2024）——指标定义 + 服务化。
- **Cube**（2024）——指标 API 平台成熟。
- **MCP（Model Context Protocol）**（2024）——让 OneService 成为 Agent 通用数据源。
- **Hasura DDN**（2024）——数据 API 网关 + GraphQL。
- **阿里 Quick BI + AI**（2024）——国内 Text-to-API。

### 5.4 未来 3-5 年趋势

1. **「OneService 即 AI 基础设施」**：每个 AI 平台都依赖 OneService。
2. **「Text-to-API 成为标配」**：业务方无需写 SQL，直接对话。
3. **「Semantic Layer 标准化」**：dbt / Cube 等成为事实标准。
4. **「Function Calling 数据源标准化」**：MCP 让 OneService 成为 Agent 通用数据源。
5. **「AI 增强指标治理」**：LLM 辅助指标定义、口径校验、异常检测。
6. **「实时 OneService」**：流式数据 + API 实时返回。

---
