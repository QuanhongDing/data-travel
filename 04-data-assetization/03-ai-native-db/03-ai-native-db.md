# AI 原生数据库（AI-Native Database）

> **一句话定位**：把向量当成一等公民——结构化 + 向量 + JSON + 全文统一查询，单库解决 AI 全场景。

> 本文是 data-travel 项目 [Ch4 · 数据资产化与智能检索](../../README.md) 的子章节（03 AI 原生数据库）。覆盖 **核心职责② 企业私有数据资产化与智能检索** 中「**结构化 + 向量融合数据库**」相关的架构、引擎、查询优化与 AI 时代演进。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| AI 原生数据库是什么、和专有向量库有什么区别？ | §1 |
| PostgreSQL + pgvector vs TigerData vs SurrealDB 怎么选？ | §4 |
| 向量查询优化、融合查询、AI 原生查询的实现？ | §2、§3 |
| 2024-2025 AI 原生数据库的新趋势（Oracle 23ai 等）？ | §5 |
| 企业级落地路径与踩坑？ | §6 |

---

## 1. 概念与定位

### 1.1 是什么

**学术 / 工业定义**：AI 原生数据库（AI-Native Database）是 2023-2024 年兴起的新一代数据库形态，它**原生把向量当成一等公民**，与结构化数据、JSON、全文检索、地理空间、图等数据类型在同一数据库中统一存储、统一查询、统一优化。它突破了「关系数据库 + 独立向量数据库」的烟囱架构，把 AI 数据与传统数据合二为一。

**工程定义**：在数据架构师手里，AI 原生数据库是**一份单库解决 AI 全场景**的方案：

- **向量 + 结构化**：同一表有 varchar、int、vector 列，统一查询。
- **融合查询**：SQL 中同时使用 WHERE + 向量相似度。
- **统一优化器**：向量化执行 + 标量过滤 + 索引联动。
- **多模态数据类型**：vector / json / text / geo / graph。
- **AI 原生算子**：内置 Embedding 生成、向量距离计算、混合排序。

**AI 原生数据库 vs 传统数据库 + 向量库**：

| 维度 | 传统 DB + 独立向量库 | AI 原生数据库 |
| --- | --- | --- |
| 架构 | 烟囱（DB + Vector DB） | 单库统一 |
| 跨库 JOIN | 复杂（ETL / API） | 天然 SQL JOIN |
| 事务一致性 | 最终一致 | 强一致 |
| 运维 | 两套系统 | 一套系统 |
| 性能 | 跨库慢 | 单库快 |
| 适用规模 | 大 | 中（百万 - 千万级） |
| 工具 | MySQL + Milvus | PostgreSQL + pgvector / SurrealDB |

### 1.2 为什么需要

**业务驱动力**：

- **「数据烟囱」**：业务方要查「北京 + 高客单 + 语义相似」，跨库 JOIN 复杂。
- **「事务一致性」**：向量数据需要和业务数据强一致（如下单后立即可被检索）。
- **「运维成本」**：多套系统运维成本高（DB + Vector DB + ES + KG）。
- **「单库开发体验」**：开发者用一套 SQL 解决所有问题。
- **「LLM 时代的融合查询」**：Agent 需要「SQL + 向量 + 全文」一体化。

**痛点**：

1. **「跨库 JOIN 复杂」**：业务表在 MySQL，向量在 Milvus，跨库 JOIN 要 ETL。
2. **「数据一致性难」**：向量更新滞后于业务表，检索到过期数据。
3. **「事务边界」**：向量写入不是事务的一部分，可能部分失败。
4. **「运维复杂」**：多套系统备份、监控、扩缩容。
5. **「学习成本」**：开发者需要懂多套系统。

**AI 时代的新诉求**：

- **「融合 SQL」**：`SELECT * FROM products WHERE category = 'phone' ORDER BY embedding <=> $1 LIMIT 10`。
- **「强一致 RAG」**：业务写入后立即可被 RAG 检索。
- **「Agent 友好」**：Agent 用单库 API 完成所有查询。
- **「AI 原生算子」**：内置 Embedding、向量计算、混合排序。

### 1.3 在 AI 时代数据架构中的位置

```
   [AI 原生数据库] ← 本文
   PostgreSQL + pgvector / SurrealDB / TigerData / Oracle 23ai / TiDB Vector
        ↑
   单库统一：SQL + 向量 + JSON + 全文 + 图
        ↓
   [RAG / Agent / 推荐 / 搜索]
```

- **上游**：Ch1 建模、Ch3 数据全栈。
- **下游**：Ch4-04 混合检索、Ch4-05 RAG、Ch5 Agent 平台。
- **横向**：与 Ch4-02 向量湖（规模更大场景）、Ch4-09 统一查询网关（跨源场景）协同。

**一句话判断**：**「AI 原生数据库是中小规模 AI 应用的甜蜜点」——单库解决 80% 问题，超大规模再考虑专用向量湖。**

### 1.4 演进历程

**PostgreSQL + 向量扩展（2020-2023）**：

- **2020**：Weaviate + PostgreSQL 集成。
- **2021**：pgvector 0.1（开源 PostgreSQL 向量扩展）。
- **2022**：Supabase + pgvector 流行。

**数据库厂商拥抱 AI（2023-2024）**：

- **2023**：Oracle 23c（后改名 23ai）—— 内置 AI Vector Search。
- **2023**：Snowflake Cortex —— 内置向量搜索。
- **2023**：Databricks Vector Search —— 内置湖仓 + 向量。
- **2024**：TiDB Vector、PolarDB IMCI 向量版。
- **2024**：SurrealDB 2.x —— 多模型原生。
- **2024**：TigerData（TimescaleDB 团队）—— 时序 + 向量。

**AI 原生数据库新势力（2024-2025）**：

- **2024**：SingleStore 8.0 —— HTAP + 向量。
- **2024**：Weaviate Embedded —— 嵌入式向量库。
- **2024**：Chroma 0.5+ —— LangChain 集成强化。
- **2025**：AI 原生数据库成为中型企业默认选择。

---

## 2. 核心原理

### 2.1 关键概念定义

- **AI 原生数据库（AI-Native Database）**：把向量作为一等公民的数据库。
- **向量类型（Vector Type）**：数据库内置的向量数据类型（pgvector 的 `vector(N)`）。
- **融合查询（Hybrid Query）**：在同一查询中混合结构化过滤 + 向量相似度。
- **向量化执行（Vectorized Execution）**：查询优化器向量化执行算子。
- **HNSW Index（pgvector 0.5+）**：pgvector 支持 HNSW 索引。
- **IVFFlat Index**：pgvector 的 IVF 索引。
- **Half-Precision Vector（pgvector 0.7+）**：半精度向量（float16），省内存。
- **Binary Quantization（pgvector 0.7+）**：二进制量化，压缩 32 倍。
- **DiskANN in PostgreSQL**：PostgreSQL + pgvectorscale（TimescaleDB）。
- **Oracle 23ai AI Vector Search**：Oracle 内置向量搜索。
- **Snowflake Cortex Search**：Snowflake 内置向量。
- **SingleStore VECTOR**：SingleStore 内置向量类型。
- **SurrealDB**：原生多模型数据库（文档 + 图 + 向量 + 时序）。
- **TigerData（TimescaleDB）**：时序 + 向量。
- **AI 原生查询（AI-Native Query）**：用自然语言 / Embedding 直接查询（Snowflake Cortex Analyst）。
- **向量化 UDF（Vectorized UDF）**：数据库内置的自定义 Embedding 函数。
- **多模态融合查询**：向量 + JSON + 全文 + 图的统一查询。

### 2.2 数学 / 形式化基础

**向量类型的数学**：

```
CREATE TABLE products (
  id BIGINT PRIMARY KEY,
  name VARCHAR,
  category VARCHAR,
  price INT,
  embedding vector(768)  -- 768 维向量
);

CREATE INDEX ON products USING hnsw (embedding vector_cosine_ops);
```

**融合查询的数学**：

```
SELECT id, name
FROM products
WHERE category = 'phone' AND price < 5000  -- 标量过滤
ORDER BY embedding <=> $1  -- 向量距离排序（<=> 是余弦距离）
LIMIT 10;
```

`<=>` 是 pgvector 的距离算子（余弦距离），其他算子：
- `<->`：L2 距离。
- `<#>`：内积距离。

**HNSW 在 pgvector 的实现**：

pgvector 0.5+ 支持 HNSW：

```
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

参数：
- `m`：每个节点最大邻居数（默认 16，越大越准但慢）。
- `ef_construction`：构建时候选数（默认 64，越大越准但慢）。
- `ef_search`：查询时候选数（默认 40）。

**向量压缩**：

| 算法 | pgvector 版本 | 压缩比 |
| --- | --- | --- |
| float32 | 0.1+ | 1× |
| float16（halfvec） | 0.7+ | 2× |
| bit（binary） | 0.7+ | 32× |

**AI 原生查询（Snowflake Cortex Analyst）**：

```
SELECT SNOWFLAKE.CORTEX.COMPLETE(
  'mistral-large',
  CONCAT('请基于以下数据回答：', question)
) AS answer
FROM products_with_embeddings
WHERE VECTOR_COSINE_SIMILARITY(embedding, $1) > 0.7
LIMIT 5;
```

### 2.3 关键算法 / 方法

**pgvector 索引算法**：

| 索引 | 版本 | 召回率 | 速度 | 内存 |
| --- | --- | --- | --- | --- |
| IVFFlat | 0.1+ | 95% | 中 | 中 |
| HNSW | 0.5+ | 99% | 快 | 高 |
| HNSW + halfvec | 0.7+ | 98% | 快 | 中 |
| HNSW + bit | 0.7+ | 90% | 快 | 低 |

**距离算子**：

| 算子 | pgvector | 含义 |
| --- | --- | --- |
| `<->` | 0.1+ | L2 距离 |
| `<#>` | 0.1+ | 内积 |
| `<=>` | 0.1+ | 余弦距离 |

**向量化 UDF**：

```
-- PostgreSQL + pgvector + OpenAI
CREATE OR REPLACE FUNCTION embed(text) RETURNS vector(1536)
LANGUAGE plpython3u AS $$
  import openai
  response = openai.Embedding.create(input=text, model='text-embedding-3-small')
  return response['data'][0]['embedding']
$$;

SELECT name FROM products
WHERE embedding <=> embed('high quality smartphone') < 0.3;
```

**混合排序（Hybrid Sort）**：

```
WITH semantic AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> $1) AS r_semantic
  FROM products WHERE category = 'phone'
),
keyword AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector(name), query) DESC) AS r_keyword
  FROM products, to_tsquery('smartphone | camera') query
  WHERE category = 'phone'
)
SELECT p.id, p.name, (1.0 / (60 + r_semantic)) + (1.0 / (60 + r_keyword)) AS rrf_score
FROM semantic s JOIN keyword k USING (id)
JOIN products p USING (id)
ORDER BY rrf_score DESC LIMIT 10;
```

### 2.4 与相邻概念的关系

- **AI 原生数据库 vs 向量数据库**：AI 原生数据库 = 关系数据库 + 向量数据库，向量数据库专注向量。
- **AI 原生数据库 vs 向量湖**：AI 原生数据库面向中小规模（百万 - 千万级），向量湖面向十亿级。
- **AI 原生数据库 vs 关系数据库**：关系数据库无向量能力，AI 原生数据库原生向量。
- **AI 原生数据库 vs 数据湖**：数据湖存原始数据，AI 原生数据库是「可查询 + 可分析」层。
- **AI 原生数据库 vs RAG**：RAG 是「检索 + 生成」流水线，AI 原生数据库是 RAG 的检索层。

> 💡 **思考锚点**：你的向量规模落在 §2.4 的哪一档——百万–千万（AI 原生库），还是到亿级（该往向量湖走）？在这个规模上，把 §2.3 表里三行代回去算一次内存：HNSW 的 99% 召回要「高内存」，你的单机放得下吗？放不下时要降到 halfvec 的 98% 还是 bit 的 90%——掉下去的这几档召回，对你那条 RRF 混合排序的最终结果影响多大，你能用一个数说出来吗？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](03-ai-native-db-section-3-sec3.md)
- [§4. 工程实现](03-ai-native-db-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](03-ai-native-db-section-5-ai.md)
- [§6. 落地实践](03-ai-native-db-section-6-sec6.md)
- [§7. 与其他方法对比](03-ai-native-db-section-7-sec7.md)
- [§8. 面试真题集](03-ai-native-db-section-8-sec8.md)

---
