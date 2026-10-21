# 术语表（Glossary）

> **一句话定位**：把全书中反复出现的 80+ 核心术语集中定义一遍，方便跨章节跳读时随时回查。

> 本文是 data-travel 项目 [序章](../README.md) 的子章节（04 术语表），按主题分类组织，重点扩充 AI 时代相关术语（智能体 / RAG / 向量数据库 / MCP / 等保等）。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 术语表是什么、为什么需要（跨章节统一口径 / 降低阅读门槛 / 跨角色沟通）？ | §1 |
| 80+ 核心术语按主题怎么查（数据基础与建模 / 大数据栈 / AI·LLM·Agent / 治理与安全 / 架构与运维 / 横切能力）？ | §2 |
| 怎么用、怎么增补，有哪些反模式？ | §3 |
| 怎么维护、引用规范、怎么检索？ | §4 |
| AI 时代新增了哪些术语、未来趋势？ | §5 |
| 落地案例 / 踩坑 / ROI，以及和其他章节什么关系？ | §6、§7 |

---

## 1. 概念与定位

### 1.1 是什么

**术语表（Glossary）** 是项目的「跨章节词典」：收录全书中反复出现、读者可能不熟悉、需要统一理解的核心术语。AI 时代项目尤其要扩充「智能体 / RAG / 向量数据库 / MCP / 等保」等新兴术语。

### 1.2 为什么需要

- **跨章节统一口径**：避免「数据湖」在不同章节指不同事物。
- **降低阅读门槛**：对不熟悉 LLM / Agent 的传统数据架构师，术语表是「词典」。
- **跨角色沟通**：架构师 / 工程师 / 产品 / 业务对同一术语的理解对齐。

### 1.3 在 AI 时代数据架构中的位置

```
       4 能力域（Ch1-Ch15）
              ↓ 引用
       术语表（本章，集中定义）
              ↓ 支撑
       跨角色 / 跨章节沟通
```

### 1.4 演进历程

- **传统数据术语**：ETL / ODS / DWD / DWS / ADS / SCD。
- **大数据术语**：Hadoop / Spark / Flink / Kafka / Iceberg。
- **AI 时代新增术语**：LLM / RAG / Agent / Vector DB / Embedding / MCP / Prompt / Token / Hallucination。

---

## 2. 核心术语（按主题分类）

### 2.1 数据基础与建模

| 术语 | 全称 | 简释 |
| --- | --- | --- |
| **ODS** | Operational Data Store | 操作数据层，贴源存储 |
| **DWD** | Data Warehouse Detail | 明细层，原子粒度事实 |
| **DWS** | Data Warehouse Summary | 汇总层，主题聚合 |
| **ADS** | Application Data Store | 应用层，面向消费 |
| **SCD** | Slowly Changing Dimension | 缓慢变化维 |
| **OneData（OneModel / OneID / OneService）** | 阿里 OneData 三件套 | 大数据治理方法论 |
| **Data Vault** | — | 敏捷数仓建模方法 |
| **Anchor Modeling** | — | 时序建模，6NF 极端范式 |
| **Entity-Relationship** | E-R | 实体关系模型 |

### 2.2 大数据栈

| 术语 | 全称 | 简释 |
| --- | --- | --- |
| **Lakehouse** | — | 湖仓一体 |
| **Hudi** | Hadoop Upserts Deletes Incrementals | Uber 开源表格式 |
| **Iceberg** | — | Netflix 开源表格式 |
| **Delta Lake** | — | Databricks 开源表格式 |
| **Paimon** | — | 阿里开源表格式（Flink 生态） |
| **Flink** | — | 流处理引擎 |
| **Spark** | — | 批处理引擎 |
| **Kafka** | — | 分布式消息队列 |
| **Presto / Trino** | — | 分布式查询引擎 |
| **Doris / StarRocks / ClickHouse** | — | OLAP 引擎 |
| **Hudi COW / MOR** | Copy On Write / Merge On Read | 两种写入模型 |

### 2.3 AI / LLM / Agent

| 术语 | 全称 | 简释 |
| --- | --- | --- |
| **LLM** | Large Language Model | 大语言模型 |
| **RAG** | Retrieval-Augmented Generation | 检索增强生成 |
| **Agent** | — | 智能体，能自主调用工具的 LLM 系统 |
| **MCP** | Model Context Protocol | Anthropic 提出的 Agent 工具协议 |
| **Prompt** | — | 提示词 |
| **Token** | — | 模型处理的最小语义单元 |
| **Embedding** | — | 文本 / 图像的稠密向量表示 |
| **Vector DB** | — | 向量数据库（Milvus / Qdrant / Weaviate / pgvector） |
| **Hallucination** | — | 幻觉，模型生成不真实内容 |
| **Fine-tuning** | — | 微调，在小数据上调整模型参数 |
| **RLHF** | RL from Human Feedback | 基于人类反馈的强化学习 |
| **DPO** | Direct Preference Optimization | 直接偏好优化 |
| **Function Calling** | — | 模型调用外部函数 / 工具 |
| **Chain-of-Thought (CoT)** | — | 思维链推理 |
| **RAGAS / TruLens** | — | RAG 评估框架 |
| **Self-RAG / CRAG** | — | RAG 改进变体 |

### 2.4 数据治理与安全

| 术语 | 全称 | 简释 |
| --- | --- | --- |
| **DQC** | Data Quality Center | 数据质量中心 |
| **DAMA DMBOK** | — | 数据管理知识体系 |
| **等保 2.0 / 3.0** | 网络安全等级保护 | 中国合规标准（现行对照以等保 2.0 为准；「等保 3.0」尚无正式标准号与实施日期，不得当作已实施的现行标准） |
| **GDPR** | General Data Protection Regulation | 欧盟数据保护条例 |
| **PIPL** | Personal Information Protection Law | 中国个人信息保护法 |
| **HIPAA** | Health Insurance Portability and Accountability Act | 美国医疗数据保护法 |
| **DLP** | Data Loss Prevention | 数据防泄漏 |
| **ABAC / RBAC** | Attribute / Role Based Access Control | 权限模型 |
| **去标识化 / 匿名化** | De-identification / Anonymization | 隐私保护技术 |
| **差分隐私 (DP)** | Differential Privacy | 隐私计算技术 |
| **联邦学习 (FL)** | Federated Learning | 跨方建模 |
| **PSI / PIR** | Private Set Intersection / Private Information Retrieval | 隐私集合求交 / 隐私信息检索 |

### 2.5 架构与运维

| 术语 | 全称 | 简释 |
| --- | --- | --- |
| **CAP / PACELC** | — | 一致性 / 可用性 / 分区容错取舍 |
| **Saga / 2PC / TCC** | — | 分布式事务模式 |
| **CQRS** | Command Query Responsibility Segregation | 命令查询分离 |
| **Event Sourcing** | — | 事件溯源 |
| **Cell-Based Architecture** | — | 单元化架构 |
| **Service Mesh** | — | 服务网格（Istio / Linkerd）|
| **SLO / SLI / SLA** | — | 服务质量目标 / 指标 / 协议 |
| **SRE** | Site Reliability Engineering | 站点可靠性工程 |
| **Chaos Engineering** | — | 混沌工程 |
| **FinOps** | Financial Operations | 云财务运营 |
| **RPO / RTO** | Recovery Point / Time Objective | 恢复点 / 时间目标 |

### 2.6 横切能力（可治理 / 可观测 / 可计量 / 可演进）

| 术语 | 全称 | 简释 |
| --- | --- | --- |
| **OPA** | Open Policy Agent | 策略引擎 |
| **OpenTelemetry** | OTel | 可观测性标准 |
| **Prometheus** | — | 监控指标系统 |
| **Grafana** | — | 监控可视化 |
| **Jaeger / Zipkin** | — | 分布式追踪 |
| **DataHub / Atlas / Unity Catalog** | — | 数据血缘 / 元数据目录 |
| **Apache Ranger** | — | 数据权限管理 |
| **Semantic Versioning** | SemVer | 语义化版本 |

---

## 3. 设计与落地

### 3.1 使用方式

- **遇到不懂的术语**：在术语表搜索（Ctrl+F）。
- **跨章节同义**：每个术语在本书中含义一致，参见"本表"。

### 3.2 增补原则

- 新增术语必须出现在至少 1 个章节中。
- 缩写第一次出现时给出全称。
- AI 时代新增术语优先扩充（智能体 / RAG / MCP / 等保）。

### 3.3 反模式

- **每章重复定义**：定义在术语表，章节内直接引用。
- **使用模糊术语**：「数据中台」「数字化转型」等含义不清的词，避免使用。

---

## 4. 工程实现

### 4.1 维护方式

- 在 `00-introduction/04-glossary/04-glossary.md` 集中维护。
- 跨章节新增术语时，先在本表登记。
- 每半年 review 一次，删除过时的、补充新的。

### 4.2 引用规范

```markdown
- 首次出现：完整中英文 + 缩写（如 "RAG（Retrieval-Augmented Generation）"）
- 后续出现：只用缩写
- 跨章节引用：「参见 [00/04 术语表](../04-glossary/04-glossary.md)」
```

### 4.3 检索

- 术语集中在本章正文（`00-introduction/04-glossary/04-glossary.md`），可直接全文搜索。
- Obsidian / VSCode 等编辑器的全文搜索。

---

## 5. 前沿演进（AI 时代）

### 5.1 新增术语来源

- **大模型发布**：每出新模型（新架构 / 新训练方法 / 新评测），更新术语。
- **开源项目**：MCP / A2A / ANP 等新协议 → 补充。
- **监管法规**：EU AI Act / 中国生成式 AI 管理办法 → 补充合规术语。

### 5.2 与 RAG 的结合

- 术语表 → 向量化 → 个人 RAG 学习助手。
- 读者问"什么是 RAG？" → 助手引用本章。

### 5.3 学术与工业最新进展（2024-2025）

- **OpenAI o1 / o3**：推理模型。
- **Claude 3.5 / 3.7 Sonnet**：长上下文 + 工具调用。
- **Anthropic MCP**：Agent 工具协议事实标准。
- **DeepSeek-R1**：开源推理模型。
- **Gemini 2.0**：多模态原生。

### 5.4 未来 3-5 年趋势

- 术语爆炸 → 自动化术语图谱。
- 多模态原生 → 视觉 / 音频术语独立。
- Agent 标准化 → MCP / A2A 等协议统一。

---

## 6. 落地实践

### 6.1 真实案例

- **Microsoft Azure 文档术语表**：跨产品统一术语。
- **Apple 人机界面指南术语表**：跨产品 UI 术语统一。
- **Google 机器学习术语表**：跨产品 ML 术语。

### 6.2 踩坑与经验

- 术语表是"活的"，需要持续维护。
- 不要把所有术语都收进来——只收跨章节反复出现的。
- 缩写与全称要一一对应。

### 6.3 落地路径

- 0→1：每章新增术语时登记。
- 1→10：定期 review 合并 / 删除。
- 10→100：术语图谱化（GraphRAG 化）。

### 6.4 ROI 评估

> 本节的比例是行业公开实践的**量级参考**【经验】，不是对某个组织的实测结果——照抄数字立项之前，先在自己的组织里量一遍基线。

- 跨角色沟通效率提升 30%。
- 跨章节阅读时术语不再卡壳。
- 维护成本：每季度 0.5 人日。

---

## 7. 与其他章节的关系

| 章节 | 与术语表的关系 |
| --- | --- |
| 00/01 能力地图 | 术语表是「通用语言」层 |
| 00/02 横切主题 | 横线名（治理 / 观测 / 计量 / 演进）是术语 |
| Ch1-Ch15 | 章节内使用术语，跨章节查本表 |
| 99 趋势 | 未来新增术语来源 |

> 💡 **思考锚点**：翻你自己那份术语表，数出「只在一章出现过一次」的条目有几个——本节的增补原则要求「新增术语必须出现在至少 1 个章节中」、踩坑经验要求「只收跨章节反复出现的」；这些单次词条只在推高每季度 0.5 人日的维护成本，却分不到那 30% 的跨角色沟通收益，你会先砍哪一批？

---

## 8. 面试真题集

> 序章不直接出面试题，但术语理解是面试开篇的元能力。本节给出 2 道关于术语理解的元问题。

### 8.1 全景视图

| 主题号 | 主题 | 题号 | 难度 |
| --- | --- | --- | :---: |
| §序章.4 | 术语表 | 序.1 ~ 序.2 | ★☆☆☆☆ |

### 8.2 分主题展开

#### 序.1 解释 Lakehouse / Lake House / Data Lake / Data Lakehouse 四个概念的关系。

**1. 考察点**：对数据架构核心术语的精确理解。

**2. 参考答案框架**
- **Data Lake**：原始数据湖（Hudi / Iceberg / Delta 之前的方案）。
- **Lake House / Data Lakehouse**：湖仓一体，融 OLAP 能力的数据湖。
- 关系：Lakehouse 是 Lake 的演进，统一了"存储 + 分析"两层。

**3. 常见陷阱**：把所有 lake 概念混为一谈。

**4. 追问预测**：Lakehouse 是否会被 Data Mesh 取代？

**5. 参考资料**：Ch1 / Ch3 湖仓一体章节 / Iceberg 官方文档。

---

#### 序.2 解释 RAG / Fine-tuning / Prompt Engineering 三者的关系与适用场景。

**1. 考察点**：对 AI 时代核心术语的精确理解。

**2. 参考答案框架**
- **Prompt Engineering**：用 prompt 调教模型，无需改模型。
- **RAG**：检索增强，模型不变，扩展上下文。
- **Fine-tuning**：微调模型权重。
- 选择：轻 → 重；成本低 → 高；可解释 → 不可解释。

**3. 常见陷阱**：以为 RAG 能替代所有 Fine-tuning。

**4. 追问预测**：何时该用 RAG，何时该 Fine-tuning？

**5. 参考资料**：Ch4 数据资产化 / Ch5 智能体平台 / Anthropic / OpenAI 文档。

---

### 8.3 本章小结

术语表是「跨章节的通用语言」：让架构师 / 工程师 / 产品 / 业务对同一术语理解一致。本书特别扩充了 AI 时代术语（智能体 / RAG / MCP / 等保），是 AI 时代数据架构师的「术语词典」。

### 8.4 返回

- 返回 [序章章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
