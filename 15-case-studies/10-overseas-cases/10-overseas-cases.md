# 海外案例研究 案例研究

> **一句话定位**：从 Databricks Lakehouse / Snowflake 数据共享 / Stripe 财务数据架构 / LinkedIn 大数据 / Anthropic Claude Engineering / OpenAI Engineering 等海外头部案例中，看清 2024–2025 年数据架构 + AI 平台的前沿趋势。

> 本文是 data-travel 项目 [Ch15 · 案例库](../../README.md) 的子章节（**10-海外案例研究**）。标准化案例结构：背景 → 挑战 → 架构演进 → 关键决策 → 踩坑 → 复用经验。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 海外头部公司的整体技术架构 | §3.1、§3.2、§3.3 |
| Databricks Lakehouse 演进 | §4.1 |
| Snowflake 数据共享 + AI | §4.2 |
| Stripe 财务数据架构 | §4.3 |
| LinkedIn 大数据 + AI | §4.4 |
| Anthropic Claude Engineering | §4.5 |
| OpenAI Engineering 演进 | §4.6 |
| Slack / Notion 数据架构 | §4.7 |
| AI Native 海外趋势 | §5 |
| 复用清单 | §6.4 |

---

## 1. 背景

### 1.1 为什么需要研究海外案例

海外头部公司（尤其是美国硅谷）往往走在数据架构 + AI 平台的前沿：

1. **前沿技术**：Lakehouse / Vector DB / LLM Serving / Agent Platform 都是海外率先成熟。
2. **不同视角**：海外公司的演进路径与国内不同（如 Netflix Iceberg vs 阿里 MaxCompute）。
3. **跨市场参考**：出海 / 全球化需要了解海外架构。
4. **AI 公司前沿**：Anthropic / OpenAI / Cursor 等 AI 公司的数据架构代表了"AI Native"的未来形态。

### 1.2 海外案例分类

| 类别 | 公司 | 核心主题 |
| --- | --- | --- |
| **数据基础设施** | Databricks、Snowflake | Lakehouse + 数据共享 |
| **AI 平台** | Anthropic、OpenAI | Claude / GPT 工程化 |
| **应用 SaaS** | Stripe、Slack、Notion、Figma | 数据驱动业务 |
| **社交平台** | LinkedIn、Meta | 大数据 + AI |
| **开发者工具** | Cursor、Vercel、Replit | AI 原生开发 |
| **搜索 + 推荐** | Pinterest、Reddit | 内容推荐 |

---

## 2. 挑战

### 2.1 业务挑战

#### 2.1.1 全球化

海外公司基本从 Day 1 就考虑全球化——多区域、多语言、多法规。

#### 2.1.2 合规复杂

GDPR / CCPA / HIPAA / SOC 2 / 等保——海外公司面临的合规复杂度比国内更高。

#### 2.1.3 多业务 / 多 BU

Stripe（支付）、Slack（协作）、LinkedIn（社交+招聘）——海外公司业务多样化程度高。

### 2.2 技术挑战

#### 2.2.1 规模化

Netflix 1.5 亿用户、LinkedIn 9 亿用户、Meta 30 亿用户——规模化是常态。

#### 2.2.2 数据合规

- 欧洲数据本地化。
- 用户删除权（Right to be Forgotten）。
- 数据血缘可追溯。

#### 2.2.3 AI 工程化

AI 公司（Anthropic / OpenAI）面临"模型 + 数据 + 推理"全栈挑战。

### 2.3 组织挑战

#### 2.3.1 远程办公

2020 年后海外公司大量远程办公，**协作模式变化**。

#### 2.3.2 全球化团队

跨时区、跨语言、跨文化协同。

---

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

## 4. 关键决策

### 4.1 决策 1：Databricks Lakehouse vs Snowflake 数据仓库

#### 4.1.1 决策路径

- **方案 A：传统数仓**（Teradata / Oracle Exadata）——成熟但昂贵。
- **方案 B：云数仓**（Snowflake / BigQuery）——按需付费。
- **方案 C：Lakehouse**（Databricks）——数据湖 + 数据仓库一体化。

#### 4.1.2 Trade-off

| 维度 | Snowflake | Databricks |
| --- | --- | --- |
| 核心定位 | 云数仓 | Lakehouse |
| 多模数据 | 中 | 强 |
| ML 能力 | 中 | 强 |
| AI 能力 | 中（Cortex） | 强（AI Platform） |
| 数据共享 | 强 | 中 |
| 商业化 | 早成熟 | 较新 |

**决策依据**：

- **强 ML / AI**：选 Databricks。
- **强数据共享**：选 Snowflake。
- **强多模数据**：选 Databricks。
- **纯 SQL 数仓**：选 Snowflake。

### 4.2 决策 2：Snowflake 数据共享的价值

#### 4.2.1 数据共享场景

- **跨组织数据共享**：供应商 + 客户。
- **跨云数据共享**：AWS 用户 + Azure 用户。
- **数据市场**：第三方数据交易。

#### 4.2.2 关键创新

- **无需复制数据**：基于"shared database"概念。
- **跨云**：AWS / Azure / GCP 数据共享。
- **数据市场**：Snowflake Data Marketplace。

### 4.3 决策 3：Stripe 的财务一致性

#### 4.3.1 财务一致性挑战

- **强一致性**：财务数据必须 100% 准确。
- **可审计**：每笔交易可追溯。
- **可重放**：可重放历史交易。

#### 4.3.2 实现方式

- **基于 Postgres + 自研**：事务性最强。
- **不可变账本**：所有交易不可变。
- **强审计**：每笔交易有完整审计日志。
- **实时对账**：实时对账机制。

### 4.4 决策 4：Anthropic 数据合规

#### 4.4.1 Anthropic 的数据原则

- **用户数据不用于训练**（除非用户授权）。
- **数据本地化**（企业版）。
- **严格访问控制**（基于角色 + 资源）。
- **完整审计**（所有操作可追溯）。

#### 4.4.2 实现方式

- **数据隔离**：每个客户数据物理隔离。
- **加密**：静态 + 传输加密。
- **访问控制**：基于 RBAC + ABAC。
- **审计日志**：所有操作有日志。

### 4.5 决策 5：OpenAI Agent 演进

#### 4.5.1 Agent 演进路径

- **GPT-3**：基础模型。
- **ChatGPT**：对话。
- **Function Calling**：工具调用。
- **Custom GPTs**：自定义 GPT。
- **Agent SDK**：智能体框架。
- **Swarm**：多智能体协同。

#### 4.5.2 关键创新

- **Function Calling**：工具调用标准。
- **Custom GPTs**：低代码智能体。
- **Agent SDK**：编程式智能体。
- **Swarm**：多智能体协同。

---

## 5. AI Native 趋势（2024–2025）

### 5.1 AI Native 数据架构趋势

#### 5.1.1 数据 → 知识

- **RAG**：检索增强生成。
- **知识图谱 + LLM**：结构化知识。
- **Embedding + Vector DB**：向量检索。

#### 5.1.2 模型 → 应用

- **Function Calling**：LLM 调用工具。
- **Agent**：LLM 自主决策。
- **Multi-Agent**：多智能体协同。

#### 5.1.3 评估 → 自动化

- **AI 评估指标**：准确率、延迟、成本。
- **Auto-Evaluation**：自动化评估。
- **Continuous Training**：持续训练。

### 5.2 AI 平台趋势

#### 5.2.1 一体化平台

- **Databricks AI Platform**：数据 + 模型 + 应用。
- **Snowflake Cortex**：数仓内 AI。
- **Anthropic Claude API**：模型 + 工具。

#### 5.2.2 智能体平台

- **OpenAI Agent SDK**：编程式智能体。
- **Anthropic MCP**：工具协议。
- **LangChain / LlamaIndex**：LLM 框架。

#### 5.2.3 多模态

- **GPT-4o**：原生多模态。
- **Claude 3.5 Sonnet**：多模态理解。
- **DALL-E / Sora**：图像 + 视频生成。

### 5.3 商业模式趋势

#### 5.3.1 API 经济

- **按 Token 计费**：OpenAI / Anthropic / Cohere。
- **按请求计费**：传统 SaaS。
- **混合计费**：基础 + 用量。

#### 5.3.2 数据市场

- **Snowflake Marketplace**：数据交易。
- **Databricks Marketplace**：模型 + 数据交易。
- **Hugging Face**：模型市场。

---

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

## 7. 与同类案例对比

### 7.1 对比维度

| 维度 | Databricks | Snowflake | Anthropic | OpenAI |
| --- | --- | --- | --- | --- |
| 定位 | Lakehouse + AI | 数据仓库 + 共享 | AI 安全 + 模型 | AI 能力 + 模型 |
| 核心创新 | Lakehouse | 数据共享 | Constitutional AI | GPT + ChatGPT |
| AI 能力 | AI Platform | Cortex | Claude API | GPT API |
| 商业化 | 企业 + 平台 | 数据共享市场 | API + 企业 | API + ChatGPT |

### 7.2 取舍

- **Databricks = 一体化 + AI 强**——适合需要数据 + AI 一体化的企业。
- **Snowflake = 数仓 + 数据共享强**——适合需要数据共享的企业。
- **Anthropic = AI 安全 + 协议**——适合需要安全 + 工具协议的 AI 应用。
- **OpenAI = AI 能力 + 生态**——适合需要最强 AI 能力的应用。

**对架构师的启示**：

- **学 Databricks Lakehouse 思路**——数据 + AI 一体化是趋势。
- **学 Snowflake 数据共享思路**——跨组织数据共享是革命。
- **学 Anthropic MCP 协议**——智能体工具协议标准。
- **学 OpenAI Agent SDK**——智能体编程框架。
- **学海外 AI Native 演进**——避免落后于时代。

---

## 8. 面试真题集

> 本节内容待补充。题源待与原 PDF《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）题库对齐。

### 8.1 候选题目方向

- Databricks Lakehouse vs Snowflake 的核心差异？
- Snowflake 数据共享（Data Sharing）的实现原理？
- Stripe 的财务一致性架构？
- LinkedIn 大数据架构（Kafka / Samza / Pinot）？
- Anthropic Claude 的工程化挑战？
- OpenAI o1 / o3 推理模型的技术创新？
- Anthropic MCP（Model Context Protocol）的设计与价值？
- AI Native 数据架构 2024–2025 的趋势？
- 海外公司 AI 平台与国内 AI 平台的对比？
- 出海业务的数据架构选择？

---

## 9. 参考资料

### 9.1 官方资料

- **Databricks**：https://www.databricks.com/
- **Snowflake**：https://www.snowflake.com/
- **Anthropic**：https://www.anthropic.com/
- **OpenAI**：https://openai.com/
- **Stripe**：https://stripe.com/
- **LinkedIn Engineering**：https://engineering.linkedin.com/

### 9.2 学术论文

- SIGMOD / VLDB / OSDI 多篇 Lakehouse / Vector DB 论文。
- Anthropic Constitutional AI 论文。
- OpenAI GPT / o1 技术报告。

### 9.3 演讲

- Databricks Data + AI Summit。
- Snowflake Summit。
- OpenAI DevDay。
- Anthropic Build with Claude。

### 9.4 媒体

- The New Stack《Databricks / Snowflake 演进》。
- InfoQ《Anthropic Claude 工程化》。
- Wired《OpenAI 演进史》。

---

## 10. 总结与下一步

### 10.1 本章总结

本章 10 个子案例覆盖了：

1. **国内巨头**：阿里数据中台、双 11 稳定性、字节数据架构、美团特征平台。
2. **海外巨头**：Netflix、Uber、Airbnb 数据栈。
3. **演进路径**：初创公司 0 → 独角兽的演进路径。
4. **失败反思**：8 个真实的失败案例 + FailOps 方法论。
5. **海外前沿**：Databricks、Snowflake、Anthropic、OpenAI 等海外头部案例。

### 10.2 案例阅读建议

| 角色 | 必读案例 | 选读案例 |
| --- | --- | --- |
| 数据架构师 | 01 阿里中台 / 02 双 11 / 03 字节 | 05 Netflix / 06 Uber / 07 Airbnb |
| 数据科学家 | 04 美团特征 / 03 字节 | 08 Startup / 10 海外 |
| 平台架构师 | 05 Netflix / 06 Uber / 10 海外 | 03 字节 / 04 美团 |
| 团队负责人 | 09 失败案例 / 01 阿里 | 08 Startup / 10 海外 |
| 准资深 | 09 失败案例 / 13 决策与权衡 | 全部 |

### 10.3 下一步

- 进入 [后记 · 趋势与思考](../../99-outro/) 收尾。
- 或选择其他角色路径深入学习。

> **回到 [根目录](../../README.md) 选择其他角色路径**