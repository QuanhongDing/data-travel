> 本文件是 **08-startup-evolution.md** 的子文件（§4. 关键决策）。完整章节请回到 [index](08-startup-evolution.md)。

## 4. 关键决策

### 4.1 决策 1：Postgres + dbt + Snowflake 现代化栈

#### 4.1.1 推荐栈

```
[Postgres] → [dbt] → [Snowflake / BigQuery] → [Looker / Mode]
   (业务库)   (转换)   (数据仓库)               (BI)
```

#### 4.1.2 优势

- **快速启动**——1–2 周可以上线。
- **运维成本低**——完全 SaaS 化。
- **生态成熟**——dbt 社区、Looker 社区。
- **人才易找**——容易招聘熟悉 dbt + Snowflake 的工程师。

#### 4.1.3 适合场景

- **A 轮 → B 轮**。
- **业务量级 TB 级**。
- **团队规模 100 人以下**。

#### 4.1.4 关键工具

- **[Snowflake](https://www.snowflake.com/)** / **[BigQuery](https://cloud.google.com/bigquery)** / **[Redshift](https://aws.amazon.com/redshift/)** —— 云数仓。
- **[dbt](https://www.getdbt.com/)** —— 数据转换。
- **[Fivetran](https://www.fivetran.com/)** / **[Airbyte](https://airbyte.com/)** —— 数据集成。
- **[Looker](https://looker.com/)** / **[Mode](https://mode.com/)** / **[Metabase](https://www.metabase.com/)** —— BI。
- **[Segment](https://segment.com/)** —— 用户行为采集。

### 4.2 决策 2：Databricks Lakehouse 路径

#### 4.2.1 推荐栈

```
[业务系统] → [Kafka] → [Databricks] → [ML / BI]
              (流)      (Lakehouse)    (消费)
```

#### 4.2.2 优势

- **Lakehouse 一体化**——数据湖 + 数据仓库 + ML 平台。
- **Spark 生态**——成熟的大数据生态。
- **ML 平台原生**——MLflow + Feature Store。

#### 4.2.3 适合场景

- **B 轮 → C 轮**。
- **业务量级 PB 级**。
- **强 ML 需求**。
- **多模数据**（图像、视频、文本）。

#### 4.2.4 关键工具

- **[Databricks](https://www.databricks.com/)** —— Lakehouse 平台。
- **[Delta Lake](https://delta.io/)** —— 表格式。
- **[MLflow](https://mlflow.org/)** —— 模型管理。
- **[Spark](https://spark.apache.org/)** —— 离线计算。
- **[Flink](https://flink.apache.org/)** —— 实时计算。

### 4.3 决策 3：AI Native 数据栈

#### 4.3.1 推荐栈

```
[业务系统] → [事件流] → [Lakehouse] → [RAG + Agent + 评估]
              (实时)    (存储)         (AI)
```

#### 4.3.2 关键能力

- **数据 → 知识**：结构化数据自动转化为知识。
- **RAG**：基于私有数据的检索增强。
- **Agent**：自动化工作流。
- **评估**：AI 应用评估指标。

#### 4.3.3 关键工具

- **[LangChain](https://www.langchain.com/)** / **[LlamaIndex](https://www.llamaindex.ai/)** —— LLM 框架。
- **[Pinecone](https://www.pinecone.io/)** / **[Weaviate](https://weaviate.io/)** / **[Qdrant](https://qdrant.tech/)** —— 向量数据库。
- **[Arize](https://arize.com/)** / **[Phoenix](https://phoenix.arize.com/)** —— AI 评估。

### 4.4 决策 4：Anthropic 数据栈（参考）

#### 4.4.1 Anthropic 业务

Anthropic 是 Claude 母公司，2021 年成立，是 AI 公司中的"后起之秀"。

#### 4.4.2 Anthropic 数据栈特点

- **数据来源多样**——模型训练、用户反馈、内部数据。
- **强合规**——AI 训练数据合规要求高。
- **大规模 GPU 训练**——数据 + 模型一体化。

#### 4.4.3 Anthropic 数据栈演进

- 2021：起步阶段，基于 AWS + 自研工具。
- 2023：Claude 2 发布，数据栈规模化。
- 2024：Claude 3 发布，AI Native 数据栈。
- 2025：Claude 4 / 4.5，多模态 + Agent。

#### 4.4.4 启示

- **AI 公司必须从第一天就考虑数据合规**。
- **数据栈与模型训练一体化**——避免数据 / 模型脱节。
- **大规模训练需要 GPU + 数据流水线**。

### 4.5 决策 5：Cursor / Cognition 数据栈（参考）

#### 4.5.1 Cursor 业务

Cursor 是 AI 编程工具（基于 VSCode fork），2023 年成立，2024 年 ARR 数千万美元。

#### 4.5.2 Cursor 数据栈特点

- **极简团队**——20–50 人。
- **AI Native**——从一开始就用 LLM 做产品决策。

#### 4.5.3 Cursor 数据栈

- **后端**：基于 Postgres + 自研 API。
- **AI**：基于 OpenAI / Anthropic / 自研模型。
- **监控**：基于 Datadog + 自研。
- **数据**：基本不用数据仓库，用 SaaS 分析工具。

#### 4.5.4 Cognition（Cognition Labs）数据栈

- **Devin** 是 Cognition Labs 的 AI 软件工程师产品。
- **数据栈极简**——数据驱动 + 快速迭代。

#### 4.5.5 启示

- **AI 原生公司不需要传统数据栈**——SaaS 分析工具够用。
- **数据驱动 = 产品迭代速度**——AI 公司核心。
- **快速迭代 > 完美架构**。

### 4.6 决策 6：Notion / Figma 数据栈（参考）

#### 4.6.1 Notion 业务

Notion 是协作工具，2020 年估值 20 亿美元。

#### 4.6.2 Notion 数据栈

- **业务库**：基于 Postgres。
- **数据仓库**：基于 Snowflake。
- **数据转换**：基于 dbt。
- **BI**：基于自研工具 + Looker。

#### 4.6.3 Figma 业务

Figma 是设计协作工具，2022 年被 Adobe 收购（失败）。

#### 4.6.4 Figma 数据栈

- **业务库**：基于 Postgres + 自研 KV。
- **实时协作**：基于 CRDT（Conflict-free Replicated Data Types）。
- **数据仓库**：基于 Snowflake。
- **监控**：基于自研工具。

#### 4.6.5 启示

- **SaaS 公司的"标准栈"**：Postgres + Snowflake + dbt + Looker。
- **不需要重数据栈**——A/B 测试 + SaaS 分析够用。

---
