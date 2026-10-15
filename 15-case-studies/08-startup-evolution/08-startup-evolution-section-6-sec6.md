> 本文件是 **08-startup-evolution.md** 的子文件（§6. 复用经验）。完整章节请回到 [index](08-startup-evolution.md)。

## 6. 复用经验

### 6.1 适合谁学

#### 6.1.1 早期初创公司（种子轮 / A 轮）

- **典型**：所有早期公司。
- **原因**：需要"低投入 + 快速启动"。

#### 6.1.2 成长期公司（B / C 轮）

- **典型**：SaaS、AI、电商。
- **原因**：需要"现代数据栈 + 可扩展"。

#### 6.1.3 AI 原生公司

- **典型**：Anthropic、Cursor、Cognition。
- **原因**：AI 原生公司数据栈不同于传统。

### 6.2 不适合谁学

#### 6.2.1 成熟大公司

- **反例**：阿里、字节、Netflix。
- **原因**：成熟大公司有自研需求，初创栈不够。

#### 6.2.2 强监管业务

- **反例**：金融、医疗、政务。
- **原因**：监管要求超出初创栈能力。

### 6.3 关键可复用资产

#### 6.3.1 早期栈（A 轮）

- **分析工具**：Mixpanel / Amplitude / Heap。
- **A/B 测试**：GrowthBook / Statsig / PostHog。
- **监控**：Datadog / Sentry / LogRocket。

#### 6.3.2 成长期栈（B / C 轮）

- **数据仓库**：Snowflake / BigQuery / Databricks。
- **数据转换**：dbt。
- **BI**：Looker / Mode / Metabase。
- **ML 平台**：Weights & Biases / MLflow / SageMaker。
- **特征平台**：Feast / Tecton。

#### 6.3.3 AI 原生栈

- **LLM 框架**：LangChain / LlamaIndex。
- **向量数据库**：Pinecone / Weaviate / Qdrant。
- **AI 评估**：Arize / Phoenix / LangSmith。

### 6.4 复用清单（Checklist）

#### 6.4.1 早期阶段

- [ ] 是否使用了 SaaS 分析工具？
- [ ] 是否定义了留存指标（DAU / WAU / MAU）？
- [ ] 是否有 A/B 测试能力？
- [ ] 数据栈工程师 < 1 人？

#### 6.4.2 成长期

- [ ] 是否有云数仓（Snowflake / BigQuery）？
- [ ] 是否有 dbt 标准化？
- [ ] 是否有 BI 平台（Looker / Mode）？
- [ ] 是否有事件采集（Segment / Snowplow）？
- [ ] 是否有 A/B 测试平台（Statsig / GrowthBook）？

#### 6.4.3 后期阶段

- [ ] 是否有 Lakehouse（Databricks）？
- [ ] 是否有流批一体（Flink + Iceberg）？
- [ ] 是否有 ML 平台（MLflow / SageMaker）？
- [ ] 是否有特征平台（Feast / Tecton）？
- [ ] 是否有 AI Native 能力（LLM + RAG）？

#### 6.4.4 AI 原生阶段

- [ ] 是否有 LLM 框架（LangChain / LlamaIndex）？
- [ ] 是否有向量数据库？
- [ ] 是否有 AI 评估？
- [ ] 是否有 Agent 平台？

---
