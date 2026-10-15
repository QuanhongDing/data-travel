> 本文件是 **10-overseas-cases.md** 的子文件（§6. 复用经验）。完整章节请回到 [index](10-overseas-cases.md)。

## 6. 复用经验

### 6.1 适合谁学

#### 6.1.1 出海 / 全球化业务

- **典型**：跨境电商、SaaS 出海。
- **原因**：必须了解海外架构。

#### 6.1.2 强 ML / AI 需求

- **典型**：AI 公司、智能应用。
- **原因**：海外 AI 平台领先。

#### 6.1.3 数据密集型业务

- **典型**：金融、广告、电商。
- **原因**：海外 Lakehouse 成熟。

### 6.2 不适合谁学

#### 6.2.1 国内传统企业

- **反例**：制造业、传统金融。
- **原因**：海外架构在国内水土不服。

#### 6.2.2 单一业务线初创公司

- **反例**：早期 SaaS。
- **原因**：投入产出比低。

### 6.3 关键可复用资产

#### 6.3.1 数据基础设施

- **Databricks**：Lakehouse。
- **Snowflake**：云数仓 + 数据共享。
- **Apache Iceberg**：表格式。
- **Apache Kafka**：消息流。
- **Apache Flink**：实时计算。
- **Apache Spark**：离线计算。
- **Delta Lake**：表格式。
- **Apache Hudi**：表格式。

#### 6.3.2 AI 平台

- **OpenAI API**：GPT-4 / GPT-4o / o1。
- **Anthropic Claude API**：Claude 3 / 3.5 / 4 / 4.5。
- **MCP**：智能体工具协议。
- **LangChain / LlamaIndex**：LLM 框架。
- **Pinecone / Weaviate / Qdrant**：向量数据库。

#### 6.3.3 SaaS 数据栈

- **Postgres + dbt + Snowflake**：现代数据栈。
- **Looker / Mode / Hex**：BI。
- **Segment / Snowplow**：事件采集。

### 6.4 复用清单（Checklist）

#### 6.4.1 数据基础设施层

- [ ] 是否评估过 Databricks / Snowflake / Iceberg？
- [ ] 是否选择了统一表格式？
- [ ] 是否有数据共享能力？
- [ ] 是否有数据血缘 + 治理？

#### 6.4.2 AI 平台层

- [ ] 是否有 LLM 接入（OpenAI / Anthropic / 开源）？
- [ ] 是否有 RAG 框架（LangChain / LlamaIndex）？
- [ ] 是否有向量数据库？
- [ ] 是否有 AI 评估？
- [ ] 是否有 Agent 平台？

#### 6.4.3 数据合规层

- [ ] 是否有"用户数据不用于训练"策略？
- [ ] 是否有数据本地化能力？
- [ ] 是否有审计日志？
- [ ] 是否有 GDPR / CCPA 合规？

#### 6.4.4 商业模式层

- [ ] 是否有 API 计费能力？
- [ ] 是否有数据市场？
- [ ] 是否有"按使用量计费"能力？

---
