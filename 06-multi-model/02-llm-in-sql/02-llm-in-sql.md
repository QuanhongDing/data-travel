# LLM in SQL（数据库内嵌 LLM 与 AI Functions）

> **一句话定位**：把 LLM 嵌入 SQL 引擎——让"自然语言"和"语义计算"成为 SQL 的一等公民，让数据不出仓就能完成分类、摘要、生成、检索等 AI 任务。

> 本文是 data-travel 项目 [Ch6 · 多模型编排与工具调用](../../README.md) 的子章节（**02 LLM in SQL**）。覆盖 **核心职责③ 多模型编排与工具链调度** 中"数据库内嵌 LLM / AI Functions / 自然语言查询"相关的 Snowflake Cortex、Databricks AI Functions、阿里 PolarDB AI、腾讯 TDSQL-AI 等工程实践。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| LLM in SQL 是什么？和传统 ETL + LLM 有什么区别？ | §1.1、§1.2 |
| 为什么 2024-2025 各大数据库厂商都在推 AI Functions？ | §1.2、§1.4 |
| LLM in SQL 在 AI 时代数据架构里的位置 | §1.3 |
| 主流 AI Functions 的能力与边界 | §2.x、§4.3 |
| 自然语言查询（NL2SQL）在数据库内的落地 | §3.2.4 |
| 决策表：什么场景用 AI Function | §3.3 |
| 反模式与陷阱（最常踩的 10 个坑） | §3.5 |
| 从 0 到 1 怎么落地 LLM in SQL？ | §4.1 |
| 关键技术点（模型路由、成本控制、向量+SQL 融合） | §4.2 |
| 工具链与平台（Snowflake Cortex、Databricks AI Functions、阿里 PolarDB AI） | §4.3 |
| 代码示例（Snowflake / Databricks / Postgres pgai） | §4.5 |
| AI 时代演进方向（Agent + AI Function、Self-Hosted LLM） | §5.1 |
| 与 RAG / 向量库的融合 | §5.3 |
| 2024-2025 学术工业进展 | §5.4 |
| 未来 3-5 年趋势 | §5.6 |
| 真实案例（Snowflake Cortex、Databricks ai_query、阿里 MaxCompute PAI UDF、MotherDuck） | §6 落地实践 §2.1–§2.4 |
| 踩坑经验 | §6 落地实践 §2.6 |
| 0→1 / 1→10 / 10→100 落地路径 | §6 落地实践 §2.5 |
| ROI 评估 | §6 落地实践 §2.7 |
| LLM in SQL 与传统 ETL + LLM / 外部分析库对比 | §7.1、§7.2、§7.3 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：LLM in SQL 是 2023-2024 年兴起的一种"数据库内嵌 AI"（In-Database AI）范式，特指将大语言模型能力（文本分类、实体抽取、文本生成、向量嵌入、语义检索）作为 SQL 函数暴露给用户，让分析师可以直接用 SQL 完成传统需要调用外部 Python / ETL 才能完成的 AI 任务。其学术前身可追溯到 2018 年的"in-database machine learning"（如 BigQuery ML、Apache MADlib），但 LLM in SQL 是其在生成式 AI 时代的延伸。

**工程定义**：LLM in SQL 是**把 LLM 作为 SQL 引擎的内置算子（Operator）**，提供 5 类核心能力：

1. **AI Functions（标量函数）**：在 SQL 中调用 LLM 做单行 / 多行处理。如 `ai_classify(text, labels)`、`ai_summarize(text)`、`ai_extract(text, fields)`、`ai_generate_text(prompt)`。
2. **Embeddings（向量生成）**：在 SQL 中把文本转为向量。如 `ai_embed(text, model='bge-m3')`。
3. **Vector Search（向量检索）**：在 SQL 中做向量相似度搜索。如 `ai_search(query, table, top_k=10)`。
4. **NL2SQL（Cortex Analyst）**：自然语言转 SQL，让用户问"上周 GMV 是多少"自动生成 SQL。
5. **Forecasting / Anomaly Detection（预测 / 异常）**：数据库内置预测模型，零外部依赖。

**解决的核心问题**：

1. **数据不出仓**：敏感数据不需要离开数仓就能做 AI 处理，满足金融、医疗、政务合规。
2. **降低 AI 工程门槛**：分析师不用学 Python / PyTorch / LangChain，用 SQL 就能调 AI。
3. **提升数据处理吞吐量**：批量 AI 处理（如百万条评论分类）直接在 MPP 引擎内并行，比 Python 单机快 10-100x。
4. **统一数据 + AI 工作流**：SQL 既能算 SUM，也能算 Embedding，ETL 链路简化。
5. **AI 推理成本可控**：数据库厂商统一调度 LLM，比每个业务方自己调 API 便宜 50%+。

**与传统 ETL + LLM 架构的边界**：

| 维度 | 传统 ETL + LLM | LLM in SQL |
| --- | --- | --- |
| 数据流转 | ETL → Python → LLM API → 结果回库 | SQL 内直接调用 LLM |
| 数据出仓 | 必须出仓（到 Python 环境） | 数据不出仓 |
| 并行能力 | 取决于 Python 并行（多进程 / Spark） | 原生 MPP 并行（10-100x） |
| 工程门槛 | 高（Python / PyTorch / LangChain） | 低（SQL 即可） |
| 成本控制 | 弱（每个业务方自己调 API） | 强（数据库统一调度） |
| 合规友好 | 弱 | **强（数据不出仓）** |
| 模型切换 | 改代码 | 改 SQL 函数参数 |
| 灵活性 | **高（任意 Python）** | 中（受限于数据库支持的算子） |

**一句话判断**：**P7 会用 Python 调 LLM、P8 会用 ETL 跑 LLM 批处理、P9 会用 LLM in SQL 让数据不出仓就能 AI——LLM in SQL 是 AI 时代"数据不出仓"的工程答案**。

### 1.2 为什么需要

**业务驱动力**：

1. **数据合规要求**：金融、医疗、政务场景要求"数据不出仓"。2024 年《数据安全法》《个人信息保护法》强化执行，"数据出仓"成为合规红线。
2. **AI 工程门槛过高**：传统 ETL + LLM 需要 Python + PyTorch + ETL 工具，90% 分析师不会。SQL 是数据工作者的通用语言，会 SQL 的人比会 Python 多 10 倍。
3. **批处理性能瓶颈**：百万级文本分类在 Python 单机跑 24 小时，在 MPP 数据库内 30 分钟搞定。
4. **统一 AI 工作流**：分析师希望"AI 算子和 SQL 算子在同一个查询里"——`SELECT ai_classify(review) FROM ...`，而不是 ETL + Python + 回库 + JOIN。
5. **AI 推理成本压力**：每个业务方各自调 LLM API，浪费巨大；数据库统一调度，按 token 计费清晰可控。

**痛点**：

1. **数据出仓合规风险**：金融、医疗、政务场景数据不能离开企业内网，外部 LLM API 用不了。
2. **ETL + LLM 链路长**：数据 ETL 到 Python → 调 LLM → 结果回库 → JOIN，至少 4 步。
3. **批量 AI 处理慢**：Python 串行处理 100 万条文本耗时过长，无法满足实时分析需求。
4. **AI 工程门槛高**：SQL 工程师无法上手 LLM，需要学 Python / PyTorch / LangChain。
5. **模型管理混乱**：每个业务方自己部署 LLM，版本管理、效果评估、A/B 测试困难。
6. **成本不可控**：LLM API 调用的 token 成本难审计、难分摊。

**AI 时代的新诉求**：

- **数据不出仓**：敏感数据 AI 处理在数据库内完成。
- **SQL 是 AI 一等公民**：分析师用熟悉的 SQL 调 LLM。
- **MPP 并行加速**：批处理性能比 Python 快 10-100x。
- **AI 算子标准化**：`ai_classify` / `ai_summarize` / `ai_embed` 跨厂商统一接口。
- **模型统一调度**：企业级模型路由 + 成本分摊。

### 1.3 在 AI 时代数据架构中的位置

**与其他数据 / AI 组件的关系**：

```
            [业务用户 / 分析师]
                │
                ↓ 自然语言 / SQL
            [Data Agent]
                │
                ├──→ [LLM in SQL]（数据不出仓，做分类/摘要/向量/检索）★
                ├──→ [外部 LLM API]（GPT-4/Claude 用于通用对话/创作）
                ├──→ [RAG + 向量库]（知识检索）
                └──→ [BI 工具]（可视化）
                        │
                        ↓
                [数仓 / 湖仓 / 业务库]
```

**在数仓 / 湖仓 / 智能体平台中的角色**：

- **数仓 / 湖仓**：LLM in SQL 是数据层之上的"AI 算子层"，让 SQL 直接具备 AI 能力。
- **数据中台**：LLM in SQL 是 OneMetric / OneData 的"AI 延伸"——指标可以自带 AI 解读。
- **智能体平台**：LLM in SQL 是 Data Agent 的"结构化查询工具"——比 Python + pandas 更快、更合规。
- **RAG 体系**：LLM in SQL 是"向量 + SQL 融合"的核心载体——向量检索结果用 SQL 聚合。

**与外部 LLM API 的协同**：

```
                   [统一模型网关（Ch6 · 多模型编排）]
                              │
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
    [外部 LLM API]    [LLM in SQL]     [Self-Hosted LLM]
    (GPT-4/Claude)   (Snowflake/       (vLLM/Ollama)
                       Databricks)       ↓
                              ↓         [私有化部署]
                        [数据库内]
```

**一句话判断**：**LLM in SQL = AI 算子 + 向量算子 + 自然语言算子内嵌到 SQL 引擎——让数据不出仓、AI 工程门槛降到 SQL 级别**。

### 1.4 演进历程

**传统 SQL 阶段（1980s-2015）**：

- 1970s：System R、Ingres 关系数据库诞生。
- 1986：SQL-86 标准。
- 2010s：MPP 数据库成熟（Teradata、Snowflake、BigQuery）。

**In-Database ML 阶段（2017-2022）**：

- 2017：BigQuery ML 发布，SQL 内调机器学习。
- 2018：Microsoft SQL Server 集成 R / Python。
- 2019：Databricks SQL Analytics。
- 2020-2022：MADlib、Apache MADlib（Greenplum）、Snowflake UDFs（用户自定义函数）。

**In-Database AI / LLM 阶段（2023+）**：

- 2023-06：Snowflake Cortex 预览版，AI Functions 雏形。
- 2023-11：Snowflake Cortex GA，含 ai_classify / ai_summarize / ai_extract。
- 2024-04：Databricks AI Functions GA，含 ai_classify / ai_summarize / ai_translate。
- 2024-05：Snowflake Cortex Analyst（NL2SQL）GA。
- 2024-06：阿里云 PolarDB AI Function 发布，含 ai_generate / ai_embed。
- 2025-01：PostgreSQL pgai（pgvector 团队）发布，把任意 LLM 嵌入 SQL。
- 2025-03：Databricks Genie（NL2SQL + AI Functions 融合）。
- 2025-05：Snowflake Cortex 2.0，集成 Claude 4 / GPT-5。

**一句话总结**：**LLM in SQL 从「传统 SQL → In-Database ML → In-Database LLM」三阶段演进，今天正处于 In-Database LLM 的爆发期——数据库厂商正在把 SQL 重新定义为 AI 一等公民**。

---

## 2. 核心原理

### 2.1 关键概念定义

- **AI Function（AI 函数）**：在 SQL 中调用的标量/聚合函数。如 `ai_classify(text, labels)`、`ai_summarize(text)`、`ai_generate_text(prompt)`。
- **Vector Embedding Function（向量嵌入函数）**：把文本转为向量的 SQL 函数。如 `ai_embed(text, model='bge-m3')`。
- **Vector Search（向量检索）**：在 SQL 中做 ANN（Approximate Nearest Neighbor）检索。如 `ai_search(query_embedding, table, top_k=10)`。
- **Hybrid Search（混合检索）**：向量检索 + 关键词检索 + 元数据过滤的混合。如 `ai_hybrid_search(...)`。
- **NL2SQL / Text-to-SQL**：自然语言转 SQL。Snowflake Cortex Analyst、Databricks Genie 都是这类。
- **Model Serving（模型托管）**：数据库厂商内置的 LLM 推理服务，无需用户自己部署。
- **BYO-LLM（Bring Your Own LLM）**：用户自带 LLM（如 GPT-4 / Claude / 通义）接入数据库 AI Function。
- **Self-Hosted LLM（自托管 LLM）**：在企业内网部署开源 LLM（如 Qwen / DeepSeek / Llama 3），数据库通过 vLLM / Ollama 调用。
- **Cortex（Snowflake）**：Snowflake 的 AI 平台品牌。
- **AI Functions（Databricks）**：Databricks 的 SQL 内 AI 函数套件。
- **PolarDB AI（阿里云）**：阿里云 PolarDB 的 AI Function 套件。
- **pgai（PostgreSQL）**：Timescale / pgvector 团队推出的 PostgreSQL AI 扩展。
- **RAG + SQL 融合**：向量检索结果用 SQL 聚合 / 关联 / JOIN。
- **Token Accounting（Token 计费）**：数据库按 token 用量计费 / 配额管理。
- **数据不出仓（Data Egress Free）**：AI 推理在数据库内网完成，数据不上传到外部 LLM。

### 2.2 数学 / 形式化基础

LLM in SQL 在数学上是「**算子扩展（Operator Extension）**」问题——把 LLM 视为 SQL 引擎的新算子，参与查询优化、执行、调度。

**形式化定义**：

给定 SQL 查询 $Q$：

```sql
SELECT ai_classify(review_text, ['positive','negative','neutral']) AS sentiment
FROM reviews
WHERE product_id = 'P001';
```

可以形式化为：

- 输入：表 $T$（含 $n$ 行 `review_text`）、AI 算子集合 $\mathcal{A} = \{\text{ai\_classify}, \text{ai\_summarize}, \text{ai\_embed}, ...\}$。
- 输出：扩展表 $T'$，新增 AI 算子结果列。
- 执行模型：MPP 引擎并行执行 AI 算子，每行调用一次 LLM（或 batched LLM 调用）。

**关键优化问题**：

1. **Batching（批处理）**：把多行合并为一个 LLM 调用（如一次 batch=32），降低 token 成本和延迟。
2. **Caching（缓存）**：相同输入的 AI 结果缓存（基于输入 hash）。
3. **Push-Down（算子下推）**：AI 算子下推到存储层，避免数据移动。
4. **Cost-Based Optimization（基于代价的优化）**：AI 算子成本（token、延迟）纳入 CBO 优化器。
5. **Predicate Push-Down（谓词下推）**：先过滤再 AI，降低调用次数。

**AI 算子的代价模型**：

给定 AI 算子 $f$，其代价为：

$$\text{Cost}(f, n) = n \times \text{TokenCost}(f) + \text{NetworkCost}(f) + \text{CacheHit}(f)$$

其中：

- $n$ 是行数。
- $\text{TokenCost}(f)$ 是单次调用的 token 成本。
- $\text{NetworkCost}(f)$ 是 LLM 推理的网络 / 推理延迟。
- $\text{CacheHit}(f)$ 是缓存命中率。

**向量检索的形式化**：

给定查询向量 $q \in \mathbb{R}^d$ 和表 $T$（含向量列 $v \in \mathbb{R}^d$），目标是找到 top-k 个最近邻：

$$\text{TopK}(q, T) = \arg\min_{v_i \in T} \text{Distance}(q, v_i)$$

距离函数通常是余弦相似度或欧氏距离。索引算法包括 HNSW、IVF、PQ。

### 2.3 关键算法 / 方法

**1. AI Function 范式**

- **Classify（分类）**：输入文本 + 标签列表 → 分类结果。`ai_classify(text, labels)`。
- **Summarize（摘要）**：输入长文本 → 摘要。`ai_summarize(text, max_words=100)`。
- **Extract（抽取）**：输入文本 + 字段定义 → 结构化字段。`ai_extract(text, ['name','email','phone'])`。
- **Generate（生成）**：输入 prompt → 生成文本。`ai_generate_text(prompt)`。
- **Translate（翻译）**：输入文本 + 目标语言 → 翻译。`ai_translate(text, target='en')`。
- **Sentiment（情感）**：输入文本 → 情感分数。`ai_sentiment(text)`。
- **Embed（嵌入）**：输入文本 → 向量。`ai_embed(text, model='bge-m3')`。
- **Parse Document（文档解析）**：输入 PDF / 图片 → 结构化字段。`ai_parse_doc(file_url)`。

**2. 模型路由**

- **基于任务路由**：分类任务用小模型（GPT-4o-mini / Claude Haiku），复杂推理用大模型（GPT-4 / Claude Opus）。
- **基于成本路由**：小预算用本地模型（Qwen 7B），大预算用 GPT-4。
- **基于合规路由**：敏感数据用自托管 LLM，非敏感数据用 GPT-4。
- **基于延迟路由**：实时任务用小模型，异步任务用大模型。

**3. 批处理（Batching）**

- **行内批处理**：把多行合并为一次 LLM 调用（batch=32），token 成本降低 50%+。
- **请求合并**：跨用户 / 跨查询合并 LLM 调用。
- **异步并发**：MPP 引擎并行调度，几十 / 几百个并发调用。

**4. 缓存策略**

- **精确缓存**：基于输入 hash，相同输入直接返回缓存。
- **语义缓存**：基于向量相似度，相似输入复用结果。
- **TTL 缓存**：设置过期时间，避免永久缓存陈旧结果。

**5. 向量 + SQL 融合**

- **向量索引**：HNSW / IVF / PQ 索引，毫秒级响应。
- **混合查询**：向量召回 + 关键词过滤 + 元数据过滤 + 聚合。
- **向量化 JOIN**：两个向量表做相似度 JOIN。
- **向量聚合**：按相似度分组，统计每个聚类的数量。

**6. NL2SQL（自然语言转 SQL）**

- **基于 Embedding 的 Schema Linking**：检索相关表 / 列。
- **基于 LLM 的 SQL 生成**：GPT-4 / Claude / DeepSeek-Coder。
- **Self-Correction**：执行失败 / 结果异常自动反思。
- **指标语义层集成**：dbt Semantic Layer / Cube.js / MetricFlow 嵌入查询。

**8. 安全与权限**

- **行级权限**：用户只能查自己有权限的数据。
- **敏感列脱敏**：身份证、手机号自动 mask。
- **Token 配额**：每用户 / 部门每日 token 用量上限。
- **审计日志**：所有 AI 调用记录，含输入 / 输出 / token 用量。
- **Prompt 注入防护**：检测并阻断恶意 Prompt。

### 2.4 与相邻概念的关系

- **LLM in SQL vs 外部 LLM API**：LLM in SQL 是"内嵌"，外部 API 是"调用"。前者数据不出仓、批量快、合规友好；后者灵活、模型丰富。
- **LLM in SQL vs In-Database ML**：In-Database ML 用 SQL 跑传统 ML（线性回归、决策树）；LLM in SQL 用 SQL 跑生成式 AI。前者是结构化预测，后者是语义理解。
- **LLM in SQL vs Data Agent**：LLM in SQL 是"SQL 内的 AI 算子"；Data Agent 是"自然语言到 SQL 的智能体"。前者是工具，后者是调用工具的主体。
- **LLM in SQL vs Python + LangChain**：前者 SQL 即可，后者需要 Python 工程栈。前者门槛低、性能高、合规强；后者灵活、生态丰富。
- **LLM in SQL vs 向量数据库（专用）**：LLM in SQL 内嵌向量检索；专用向量数据库（Pinecone / Milvus）专注向量。前者一体化，后者极致性能。
- **LLM in SQL vs ETL + 外部 AI**：前者数据不出仓、链路短；后者灵活、可任意模型组合。

---

- [§3. 设计模式与范式](02-llm-in-sql-section-3-sec3.md)
- [§4. 工程实现](02-llm-in-sql-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](02-llm-in-sql-section-5-ai.md)
- [§6. 落地实践](02-llm-in-sql-section-6-sec6.md)
- [§7. 与其他方法对比](02-llm-in-sql-section-7-sec7.md)
- [§8. 面试真题集](02-llm-in-sql-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](02-llm-in-sql-section-3-sec3.md)
- [§4. 工程实现](02-llm-in-sql-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](02-llm-in-sql-section-5-ai.md)
- [§6. 落地实践](02-llm-in-sql-section-6-sec6.md)
- [§7. 与其他方法对比](02-llm-in-sql-section-7-sec7.md)
- [§8. 面试真题集](02-llm-in-sql-section-8-sec8.md)

---
