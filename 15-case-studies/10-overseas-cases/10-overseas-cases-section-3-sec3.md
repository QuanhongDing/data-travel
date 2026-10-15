> 本文件是 **10-overseas-cases.md** 的子文件（§3. 架构演进（分案例））。完整章节请回到 [index](10-overseas-cases.md)。

## 3. 架构演进（分案例）

### 3.1 Databricks：从 Lakehouse 到 AI Platform

#### 3.1.1 公司背景

Databricks 成立于 2013 年，由 Apache Spark 创始团队创立，2024 年估值 620 亿美元，是数据基础设施领域估值最高的创业公司之一。

#### 3.1.2 演进路径

- **2013–2016**：Apache Spark 商业化。
- **2017–2019**：Lakehouse 概念提出，Delta Lake 开源。
- **2020–2022**：Lakehouse 全面商业化，MLflow / Feature Store / Databricks SQL 等产品线铺开。
- **2023**：Dolly 开源大模型，AI Platform 起步。
- **2024**：MosaicML 收购（30 亿美元），AI Platform 全面升级。
- **2025**：Agent Platform 发布，全面 AI Native。

#### 3.1.3 核心产品

- **Databricks Lakehouse Platform**：Lakehouse 一体化平台。
- **Databricks SQL**：SQL 数仓能力。
- **Delta Lake**：表格式。
- **MLflow**：ML 生命周期管理。
- **Feature Store**：特征管理平台。
- **MosaicML**：大模型训练 + 推理。
- **Databricks AI Functions**：AI Function 调用。

#### 3.1.4 关键创新

- **Lakehouse 概念**：数据湖 + 数据仓库一体化。
- **Delta Lake 表格式**：ACID + Schema Evolution + Time Travel。
- **统一治理**：Unity Catalog 跨所有数据资产统一治理。
- **AI Platform**：从数据到模型到应用一体化。

### 3.2 Snowflake：从数据仓库到数据共享 + AI

#### 3.2.1 公司背景

Snowflake 成立于 2012 年，2020 年上市，2024 年市值约 500 亿美元。

#### 3.2.2 演进路径

- **2012–2014**：云数仓概念起步。
- **2015–2019**：产品化 + 上市。
- **2020**：上市，估值 700 亿美元。
- **2021–2023**：数据共享 + 数据市场 + 数据应用。
- **2024**：AI Data Cloud 战略，全面 AI 化。
- **2025**：AI 全栈 + Agent Platform。

#### 3.2.3 核心产品

- **Snowflake Data Cloud**：云数仓 + 数据共享。
- **Snowpark**：Python / Java / Scala 编程模型。
- **Data Marketplace**：数据共享市场。
- **Snowflake Cortex**：AI Function 服务。
- **Streamlit**：数据应用开发。
- **Snowflake Iceberg**：表格式（2024）。

#### 3.2.4 关键创新

- **存算分离**：存储与计算独立扩展。
- **数据共享**：跨组织数据共享是革命性创新。
- **多云**：支持 AWS / Azure / GCP。
- **AI Functions**：在数仓内调用 AI 模型。

### 3.3 Stripe：财务数据架构

#### 3.3.1 公司背景

Stripe 成立于 2011 年，是全球最大的在线支付公司之一，2024 年估值 950 亿美元。

#### 3.3.2 演进路径

- **2011–2015**：起步，基于 Ruby + Postgres。
- **2016–2018**：数据栈系统化，Hive + Spark + Presto。
- **2019–2022**：实时化，Flink + Kafka。
- **2023+**：AI Native，财务 + AI。

#### 3.3.3 核心产品

- **Stripe Payments**：支付 API。
- **Stripe Billing**：订阅计费。
- **Stripe Connect**：多商户平台。
- **Stripe Sigma**：数据分析。
- **Stripe Atlas**：创业公司注册。
- **Stripe Tax**：税务自动化。

#### 3.3.4 数据架构

- **业务库**：基于 Postgres + 自研（财务一致性）。
- **数据仓库**：基于自研 + Snowflake / BigQuery。
- **实时计算**：基于 Kafka + Flink。
- **BI**：基于自研 + Looker。
- **ML**：基于自研平台。

#### 3.3.5 关键创新

- **财务一致性**：财务数据 100% 一致。
- **API 化**：所有能力 API 化。
- **开发者友好**：极致的文档 + 工具。

### 3.4 LinkedIn：大数据 + AI

#### 3.4.1 公司背景

LinkedIn 成立于 2003 年，2016 年被 Microsoft 收购。9 亿+ 用户，是职业社交领域最大的平台。

#### 3.4.2 演进路径

- **2003–2010**：起步，Oracle + Hadoop。
- **2011–2015**：Kafka + Samza 大规模使用。
- **2016–2020**：被 Microsoft 收购后深度整合 Azure。
- **2021–2024**：AI + 推荐系统升级。
- **2025**：AI Native。

#### 3.4.3 核心产品

- **LinkedIn Profile**：个人资料。
- **LinkedIn Feed**：信息流推荐。
- **LinkedIn Recruiter**：招聘工具。
- **LinkedIn Sales Navigator**：销售工具。
- **LinkedIn Learning**：在线学习。

#### 3.4.4 数据架构

- **业务库**：基于 Espresso + Oracle + MySQL。
- **数据仓库**：基于 Hadoop + Hive + Spark。
- **实时计算**：基于 Kafka + Samza + Flink。
- **Graph**：基于 LinkedIn 的社交图谱。
- **ML**：基于自研平台 + AI。

#### 3.4.5 开源贡献

- **Apache Kafka**：LinkedIn 创立。
- **Apache Samza**：流处理框架。
- **Apache Pinot**：实时 OLAP。
- **Apache Helix**：集群管理。
- **Apache Avro**：数据序列化。
- **Project Voldemort**：KV 存储。

### 3.5 Anthropic：Claude Engineering

#### 3.5.1 公司背景

Anthropic 成立于 2021 年，由 OpenAI 前员工创立，总部位于旧金山，是 AI 安全研究公司，2024 年估值 184 亿美元。

#### 3.5.2 演进路径

- **2021–2022**：起步，Claude 1.0 训练。
- **2023**：Claude 2 发布，企业版。
- **2024**：Claude 3 系列（Haiku / Sonnet / Opus），对标 GPT-4。
- **2024 后半年**：Claude 3.5 Sonnet，性能大幅提升。
- **2025**：Claude 4 / 4.5，多模态 + Agent。

#### 3.5.3 核心产品

- **Claude.ai**：对话产品。
- **Claude API**：开发者 API。
- **Claude Enterprise**：企业版（含数据增强、合规）。
- **Claude Code**：代码助手（对标 GitHub Copilot）。
- **Model Context Protocol（MCP）**：智能体工具协议。
- **Computer Use**：智能体操作电脑。

#### 3.5.4 数据架构特点

- **训练数据**：
  - 大规模公开数据（万亿 token）。
  - 合成数据（SFT 训练）。
  - 用户反馈数据（RLHF）。
  - 红队对抗数据（安全训练）。

- **数据合规**：
  - 用户数据严格隔离。
  - 数据不用于模型训练（除非用户授权）。
  - 数据本地化（企业版）。

- **AI 服务**：
  - Prompt Caching：降低成本。
  - Tool Use：智能体工具调用。
  - Batch Processing：批量处理。
  - Streaming：流式响应。

#### 3.5.5 关键创新

- **Constitutional AI**：基于原则的 AI 安全。
- **MCP（Model Context Protocol）**：智能体工具协议标准。
- **Computer Use**：智能体操作电脑。
- **Prompt Caching**：成本优化。
- **AI 安全**：Anthropic 是 AI 安全领域的领导者。

### 3.6 OpenAI：Engineering 演进

#### 3.6.1 公司背景

OpenAI 成立于 2015 年，2024 年估值 1570 亿美元，是 AI 领域的领导者。

#### 3.6.2 演进路径

- **2015–2019**：研究阶段，GPT-1 / GPT-2。
- **2020**：GPT-3 发布。
- **2022**：ChatGPT 发布，引爆 AI 革命。
- **2023**：GPT-4 发布。
- **2024**：GPT-4o（多模态）、o1（推理）。
- **2025**：o3 / o4 推理模型，Agent SDK。

#### 3.6.3 核心产品

- **ChatGPT**：对话产品。
- **OpenAI API**：开发者 API。
- **GPT-4 / GPT-4o / o1**：模型系列。
- **DALL-E**：图像生成。
- **Sora**：视频生成。
- **Whisper**：语音识别。
- **Agent SDK / Swarm**：智能体框架。
- **Custom GPTs**：自定义 GPT。

#### 3.6.4 Engineering 演进

- **2020–2022**：基础架构搭建。
- **2023**：GPT-4 训练基础设施。
- **2024**：推理优化 + 多模态。
- **2025**：推理模型 + Agent。

#### 3.6.5 关键创新

- **GPT 系列模型**：开创大模型时代。
- **ChatGPT**：对话式 AI 普及。
- **o1 / o3**：推理模型（Chain-of-Thought）。
- **多模态**：GPT-4o 原生多模态。
- **Agent SDK**：智能体开发框架。

### 3.7 Slack / Notion：SaaS 数据架构

#### 3.7.1 Slack

- **业务**：企业协作平台，2024 年被 Salesforce 收购。
- **数据栈**：
  - 业务库：基于 Vitess（MySQL 分片）。
  - 数据仓库：基于自研 + Snowflake。
  - 实时：基于 Kafka + Flink。
  - AI：基于 OpenAI + Claude。

#### 3.7.2 Notion

- **业务**：协作工具，2021 年估值 100 亿美元。
- **数据栈**：
  - 业务库：基于 Postgres + 自研。
  - 数据仓库：基于 Snowflake。
  - 数据转换：基于 dbt。
  - AI：基于 OpenAI + Claude（Notion AI）。

#### 3.7.3 Figma

- **业务**：设计协作工具，2022 年被 Adobe 收购（失败）。
- **数据栈**：
  - 业务库：基于 Postgres + 自研 CRDT。
  - 实时协作：基于 CRDT + OT 算法。
  - 数据仓库：基于 Snowflake。

---
