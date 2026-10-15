> 本文件是 **03-ai-native-db.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](03-ai-native-db.md)。

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
