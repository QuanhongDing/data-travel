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

**PostgreSQL + 向量扩展（2017-2023）**：

- **2017**：pgvector 0.1（开源 PostgreSQL 向量扩展）。
- **2020**：Weaviate + PostgreSQL 集成。
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
- **Half-Precision Vector（pgvector 0.6+）**：半精度向量（float16），省内存。
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
ORDER BY embedding <=> $1  -- 向量距离排序（<=> 是 L2 距离）
LIMIT 10;
```

`<=>` 是 pgvector 的距离算子（L2 距离），其他算子：
- `<->`：余弦距离（pgvector 0.7+ 用 `<=>` 表示余弦）。
- `<#>`：内积距离。
- `<=>`：欧氏距离（L2）。

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
| `<=>` | 0.7+ | 余弦距离 |

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

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：PostgreSQL + pgvector（最主流）**

PostgreSQL 加 pgvector 扩展，单库解决 80% AI 场景。

- **优点**：生态成熟、SQL 兼容、事务一致。
- **缺点**：规模上限（千万级）。
- **适用**：中小规模 RAG、推荐、AI 应用。

**模式 2：云厂商 AI 原生 DB**

Snowflake Cortex、Databricks Vector Search、AWS Aurora + pgvector。

- **优点**：云原生、托管。
- **缺点**：云锁定。
- **适用**：云上应用。

**模式 3：多模型原生 DB**

SurrealDB / SingleStore / TigerData，原生支持文档 + 图 + 向量 + 时序。

- **优点**：多模型统一。
- **缺点**：生态不如 PostgreSQL。
- **适用**：复杂多模型场景。

**模式 4：传统 DB 厂商拥抱 AI**

Oracle 23ai、SQL Server、PostgreSQL + pgvector。

- **优点**：企业 IT 友好、合规。
- **缺点**：成本较高。
- **适用**：大型企业、传统行业。

**模式 5：分布式 AI 原生 DB**

TiDB Vector、CockroachDB + 向量扩展。

- **优点**：分布式、可扩展。
- **缺点**：向量性能略低。
- **适用**：分布式 OLTP + AI。

**模式 6：嵌入式 / 客户端 AI 原生**

DuckDB VSS、Chroma、SQLite + sqlite-vss。

- **优点**：轻量、嵌入式。
- **缺点**：单机。
- **适用**：PoC、本地应用。

### 3.2 适用场景决策表

| 场景特征 | 推荐模式 | 理由 |
| --- | --- | --- |
| 中小规模 RAG / 推荐 | PostgreSQL + pgvector | 性价比最优 |
| 云原生 / SaaS | Snowflake / Databricks | 托管 |
| 多模型（文档 + 图 + 向量） | SurrealDB / SingleStore | 多模型 |
| 大型企业 / 传统行业 | Oracle 23ai / DB2 + 向量 | 合规 |
| 分布式 OLTP + AI | TiDB Vector | 分布式 |
| PoC / 本地应用 | DuckDB VSS / Chroma | 轻量 |
| 时序 + 向量 | TigerData（TimescaleDB） | 时序扩展 |
| 亿级以上 | 转向专用向量库 / 向量湖 | 规模 |

### 3.3 反模式与陷阱

1. **「亿级向量用 pgvector」反模式**：pgvector 亿级慢。**亿级以上用专用向量库**。
2. **「无索引」反模式**：直接顺序扫描。**必须 HNSW / IVF 索引**。
3. **「FP32 不压缩」反模式**：浪费存储。**必须 float16 / bit 量化**。
4. **「SQL 写法低效」反模式**：`ORDER BY ... LIMIT 10` 不加索引。**必须用向量索引**。
5. **「融合查询无优化」反模式**：标量过滤后再向量排序，未联合优化。**必须用 HNSW + 标量过滤**。
6. **「忽视事务一致性」反模式**：向量写入与业务表分离。**必须同库事务**。
7. **「盲目追求新特性」反模式**：用 Oracle 23ai 而团队不熟 Oracle。**用团队熟悉的数据库**。
8. **「忽视备份恢复」反模式**：向量数据无备份。**必须 PITR + 跨区域复制**。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：场景与规模评估**

- 评估数据规模（百万 / 千万 / 亿）。
- 评估查询模式（语义检索 / 融合查询 / 多模态）。
- 评估 SLA（延迟 / 召回率）。
- 输出：**AI 原生数据库需求说明书**。

**Step 2：数据库选型**

- 评估 PostgreSQL + pgvector / SurrealDB / 云厂商方案。
- 评估团队熟悉度、生态、成本。
- 输出：**选型 ADR**。

**Step 3：Schema 设计**

- 设计混合表（结构化 + 向量 + JSON）。
- 设计索引（标量 + 向量）。
- 设计分区（按时间 / 类别）。
- 输出：**Schema DDL**。

**Step 4：Embedding 集成**

- 集成 Embedding 服务（OpenAI / BGE / 通义）。
- 创建向量化 UDF。
- 离线 + 实时双链路。
- 输出：**可向量化写入的数据库**。

**Step 5：融合查询实现**

- 实现融合查询（标量过滤 + 向量排序）。
- 实现混合排序（RRF / 加权）。
- 性能调优（索引 + 查询重写）。
- 输出：**可用的 AI 查询接口**。

**Step 6：性能测试**

- 召回率评估（Recall@K）。
- 延迟测试（P50 / P95 / P99）。
- 并发测试。
- 输出：**性能基线**。

**Step 7：上线与监控**

- 灰度发布。
- 监控（QPS / 延迟 / 召回率 / 错误率）。
- 告警 + 自动扩容。
- 输出：**生产级 AI 原生数据库**。

### 4.2 关键技术点

1. **pgvector 安装与配置**：CREATE EXTENSION vector。
2. **HNSW 索引**：CREATE INDEX ... USING hnsw。
3. **融合查询**：标量过滤 + 向量排序。
4. **量化压缩**：float16 / bit。
5. **分区表**：按时间 / 类别分区。
6. **向量化 UDF**：PL/Python + OpenAI。
7. **混合排序**：RRF / 加权。
8. **事务一致性**：同库事务。
9. **备份恢复**：PITR + 跨区域复制。
10. **可观测**：pg_stat_statements + Prometheus。

### 4.3 工具链与平台

**PostgreSQL 生态**：

- **PostgreSQL + pgvector**（开源）—— 主流 AI 原生方案。
- **Supabase**（开源 + SaaS）—— PostgreSQL + pgvector 托管。
- **Neon**（商业）—— Serverless PostgreSQL + pgvector。
- **TimescaleDB + pgvector**（开源）—— 时序 + 向量（pgvectorscale）。

**云厂商 AI 原生 DB**：

- **Snowflake Cortex Search**（SaaS）—— 云原生 AI。
- **Databricks Vector Search**（SaaS）—— 湖仓 + 向量。
- **AWS Aurora + pgvector**（云）—— AWS 生态。
- **Azure Cosmos DB**（云）—— 多模型。
- **阿里云 PolarDB**（云）—— PG 兼容 + 向量。
- **腾讯云 CynosDB**（云）—— PG 兼容 + 向量。

**多模型原生 DB**：

- **SurrealDB**（开源）—— 文档 + 图 + 向量 + 时序。
- **SingleStore**（商业）—— HTAP + 向量。
- **ArangoDB**（开源）—— 多模型。
- **Cosmos DB**（Azure）—— 多模型。

**传统 DB + 向量**：

- **Oracle 23ai AI Vector Search**（商业）—— 企业级。
- **SQL Server + 向量**（商业）—— 微软生态。
- **TiDB Vector**（开源）—— 分布式 + 向量。

**嵌入式 / 轻量**：

- **DuckDB VSS**（开源）—— 嵌入式 + 向量。
- **Chroma**（开源）—— Python 原生。
- **SQLite + sqlite-vss**（开源）—— 嵌入式。
- **LanceDB Embedded**（开源）—— Python 原生。

### 4.4 代码 / 示例

**示例 1：pgvector 安装与建表**

```sql
-- 安装扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 建表
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  price INT,
  embedding vector(1024),  -- BGE-M3 1024 维
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 分区表
CREATE TABLE products_partitioned (
  LIKE products INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE products_2025_q4 PARTITION OF products_partitioned
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- 创建 HNSW 索引
CREATE INDEX ON products USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 创建标量索引
CREATE INDEX ON products (category);
CREATE INDEX ON products (price);

-- halfvec 压缩（pgvector 0.7+）
ALTER TABLE products ALTER COLUMN embedding TYPE halfvec(1024);
CREATE INDEX ON products USING hnsw (embedding halfvec_cosine_ops);
```

**示例 2：融合查询**

```sql
-- 标量过滤 + 向量排序
SELECT id, name, price, category
FROM products
WHERE category = 'phone'
  AND price BETWEEN 1000 AND 5000
  AND embedding <=> $1 < 0.3  -- 余弦距离 < 0.3
ORDER BY embedding <=> $1
LIMIT 10;

-- 混合排序（RRF）
WITH semantic AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> $1) AS rank
  FROM products
  WHERE category = 'phone'
),
keyword AS (
  SELECT id, ROW_NUMBER() OVER (
    ORDER BY ts_rank(to_tsvector('english', name || ' ' || description), query) DESC
  ) AS rank
  FROM products, to_tsquery('english', 'smartphone | camera') query
  WHERE category = 'phone'
)
SELECT p.id, p.name, p.price,
  (1.0 / (60 + s.rank)) + (1.0 / (60 + k.rank)) AS rrf_score
FROM semantic s
JOIN keyword k USING (id)
JOIN products p USING (id)
ORDER BY rrf_score DESC
LIMIT 10;
```

**示例 3：向量化 UDF（pgvector + OpenAI）**

```sql
-- 安装 PL/Python
CREATE EXTENSION plpython3u;

-- 创建向量化函数
CREATE OR REPLACE FUNCTION embed(text) RETURNS vector(1536)
LANGUAGE plpython3u AS $$
  import openai
  response = openai.Embedding.create(
    input=text,
    model='text-embedding-3-small'
  )
  return response['data'][0]['embedding']
$$;

-- 自动 Embedding 触发器
CREATE OR REPLACE FUNCTION auto_embed() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.embedding := embed(NEW.name || ' ' || COALESCE(NEW.description, ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_auto_embed
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION auto_embed();

-- 直接语义查询
SELECT name FROM products
ORDER BY embedding <=> embed('high quality smartphone camera')
LIMIT 10;
```

**示例 4：SurrealDB 多模型查询**

```sql
-- SurrealDB：文档 + 向量 + 图 + 时序

-- 创建表（带向量字段）
DEFINE TABLE products SCHEMAFULL;
DEFINE FIELD name ON products TYPE string;
DEFINE FIELD description ON products TYPE string;
DEFINE FIELD embedding ON products TYPE array<float>;

-- 写入数据
CREATE products:1 SET
  name = 'iPhone 15',
  description = 'High quality smartphone',
  embedding = [0.1, 0.2, ..., 0.5];

-- 向量检索
SELECT name, vector::distance::cosine(embedding, $embedding) AS dist
FROM products
ORDER BY dist ASC
LIMIT 10;

-- 图查询（产品 - 类别 - 订单）
SELECT ->purchased_by->user.name AS buyers
FROM products:1;

-- 多模型联合
SELECT name, count(<-purchased_by) AS buyer_count, vector::similarity::cosine(embedding, $1) AS score
FROM products
WHERE category = 'phone'
ORDER BY score DESC
LIMIT 10;
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：AI 原生查询**

自然语言直接查询数据库：

- **Snowflake Cortex Analyst**（2024）—— 自然语言 → SQL + 指标。
- **Databricks Genie**（2024）—— 自然语言 → SQL。
- **阿里通义 + PolarDB**（2024）—— 中文自然语言查询。

**方向 2：向量化 UDF 普及**

数据库内置自定义 Embedding 函数，自动向量化写入。

**方向 3：AI 原生优化器**

查询优化器原生支持向量 + 标量联合优化：

- pgvector HNSW + 标量过滤。
- Oracle 23ai AI Vector Search 优化器。

**方向 4：多模态融合查询**

向量 + JSON + 全文 + 图统一查询：

- SurrealDB 模式。
- 多模型数据库。

**方向 5：AI 增强的数据库运维**

LLM 辅助数据库运维（自动调优 / 自动诊断 / 自动 SQL 优化）。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

- **AI 原生 DB + RAG**：单库 RAG，简化架构。
- **AI 原生 DB + 向量库**：中小规模用 AI 原生 DB，亿级用向量库。
- **AI 原生 DB + GraphRAG**：SurrealDB 支持向量 + 图。
- **AI 原生 DB + Agent**：Agent 用单库 API 完成所有查询。

### 5.3 学术与工业最新进展（2024-2025）

- **Oracle 23ai**（2024）—— 企业级 AI 原生 DB。
- **Snowflake Cortex Search**（2024）—— 云原生 AI 搜索。
- **Databricks Vector Search**（2024）—— 湖仓 + 向量。
- **SurrealDB 2.x**（2024）—— 多模型原生。
- **TiDB Vector**（2024）—— 分布式 + 向量。
- **pgvector 0.7+**（2024）—— halfvec + bit 量化。
- **TigerData**（TimescaleDB 2024）—— 时序 + 向量。
- **SingleStore 8.0**（2024）—— HTAP + 向量。

### 5.4 未来 3-5 年趋势

1. **「AI 原生 DB 成为中小企业首选」**：单库解决 80% AI 场景。
2. **「云厂商主导 AI 原生 DB」**：Snowflake / Databricks / Oracle 23ai 普及。
3. **「AI 原生查询成熟」**：自然语言直接查询成为标配。
4. **「向量化 UDF 标准化」**：自动 Embedding 写入成为数据库标配。
5. **「多模型融合主流化」**：SurrealDB 类多模型 DB 崛起。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：某 SaaS 公司 PostgreSQL + pgvector**

- 背景：千万级文档 RAG，需要 SQL + 向量融合。
- 方案：PostgreSQL + pgvector + HNSW + OpenAI Embedding。
- 工具：PostgreSQL 16 + pgvector 0.7 + BGE-M3 + FastAPI。
- 结果：单库解决 80% 场景，延迟 < 50ms，成本降低 50%。

**案例 2：某金融公司 Oracle 23ai**

- 背景：金融级合规，需要企业级 AI 数据库。
- 方案：Oracle 23ai + AI Vector Search。
- 工具：Oracle 23ai + Cohere Embed + Oracle APEX。
- 结果：金融合规 + AI 能力一体化。

**案例 3：某零售公司 SurrealDB**

- 背景：商品 + 用户 + 订单 + 关系，需要多模型。
- 方案：SurrealDB 统一文档 + 图 + 向量。
- 工具：SurrealDB + GPT-4o + LangChain。
- 结果：多模型查询效率提升 5 倍。

**案例 4：某互联网公司 Snowflake Cortex**

- 背景：云上 SaaS，需要自然语言查询指标。
- 方案：Snowflake + Cortex Analyst + Snowflake Cortex Search。
- 工具：Snowflake + Anthropic Claude。
- 结果：业务自助分析率从 30% 提升到 80%。

### 6.2 踩坑与经验

**坑 1：规模超过千万**

- 现象：pgvector 千万级后查询变慢。
- 解法：转向专用向量库（Milvus / Pinecone）或向量湖。

**坑 2：FP32 浪费存储**

- 现象：千万向量占用 30GB+ 内存。
- 解法：halfvec（2 倍压缩）+ bit（32 倍压缩）。

**坑 3：融合查询慢**

- 现象：标量过滤 + 向量排序慢。
- 解法：用 HNSW 索引 + 标量预过滤。

**坑 4：实时更新慢**

- 现象：频繁 INSERT 后查询变慢。
- 解法：定期 VACUUM + 索引重建。

**坑 5：事务边界**

- 现象：向量写入失败但业务表已更新。
- 解法：同库事务（pgvector 原生支持）。

**坑 6：备份恢复慢**

- 现象：向量数据备份占用大量空间。
- 解法：增量备份 + 压缩。

**坑 7：忽视权限**

- 现象：所有用户能查所有向量。
- 解法：行级 + 列级权限。

**坑 8：模型升级重建**

- 现象：Embedding 模型升级，全量重建。
- 解法：版本管理 + 双字段并存。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（PoC，1-2 周）**：

1. PostgreSQL + pgvector。
2. 1 万 - 10 万向量。
3. HNSW 索引。
4. 验证基本可行。

**1→10（业务化，1-3 个月）**：

1. 百万级向量。
2. 融合查询 + 混合排序。
3. 向量化 UDF。
4. 监控 + 治理。

**10→100（企业级，3-12 个月）**：

1. 千万级向量。
2. halfvec / bit 量化。
3. 多租户 + 备份 + 跨区域复制。
4. 转向云原生或专用向量库。

### 6.4 ROI 评估

- **架构简化**：从 5 套系统到 1 套。
- **运维成本**：降低 50%+。
- **数据一致性**：强一致 RAG。
- **开发效率**：单 SQL 解决复杂查询。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 关系数据库 | 专有向量库 | AI 原生 DB | 向量湖 |
| --- | --- | --- | --- | --- |
| 结构化 + 向量融合 | 1 | 2 | **5** | 3 |
| 事务一致性 | **5** | 2 | **5** | 3 |
| 单库运维 | **5** | 2 | **5** | 2 |
| 规模上限 | **5** | 4 | 3 | **5** |
| 生态成熟度 | **5** | 4 | 3 | 3 |
| 成本 | **5** | 2 | 4 | 3 |
| SQL 友好 | **5** | 1 | **5** | 2 |
| 实时性 | **5** | **5** | 4 | 3 |

### 7.2 决策树

```
[你的 AI 场景规模？]
   │
   ├── < 100 万 → AI 原生 DB（PostgreSQL + pgvector）★ 性价比最高
   │
   ├── 100 万 - 1 亿 → AI 原生 DB + 优化 或 专有向量库
   │
   └── > 1 亿 → 向量湖 / Serverless Vector DB
       │
       └── [需要与结构化数据 JOIN？]
            │
            ├── 是 → Lakehouse + Vector
            └── 否 → Serverless Vector DB
```

### 7.3 组合使用

- **AI 原生 DB + RAG**：单库 RAG，简化架构。
- **AI 原生 DB + 向量湖**：中小规模 + 大规模混合。
- **AI 原生 DB + 数据 API 网关**：OneService + AI 原生 DB。
- **AI 原生 DB + Agent**：Agent 单库 API。

---

## 8. 面试真题集

> 本节内容待补充。题源待与原 PDF《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）题库对齐。读者可参考本节结构，按"全景视图 → 分主题展开 → 横向小结 → 本章小结"四段式自检。
