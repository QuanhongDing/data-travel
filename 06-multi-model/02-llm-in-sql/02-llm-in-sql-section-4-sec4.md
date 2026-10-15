> 本文件是 **02-llm-in-sql.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](02-llm-in-sql.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：场景识别与 ROI 评估**

- 识别适合 LLM in SQL 的场景（文本分类、摘要、实体抽取、向量检索、NL2SQL）。
- 评估 ROI（vs Python + 外部 API）：成本、性能、合规优势。
- 输出：**LLM in SQL 应用矩阵**。

**Step 2：数据库 / 平台选型**

- 评估数据库厂商支持（Snowflake Cortex / Databricks AI Functions / 阿里 PolarDB AI / PostgreSQL pgai / ClickHouse / DuckDB）。
- 评估模型支持（内置模型 / BYO-LLM / 自托管）。
- 评估成本（Token 计费、存储、计算）。
- 输出：**选型决策 ADR**。

**Step 3：模型路由与配额设计**

- 设计模型路由（任务 / 成本 / 合规 / 延迟）。
- 配置 Token 配额（每用户 / 部门 / 项目）。
- 配置成本告警（超过阈值告警）。
- 输出：**模型路由配置 + 配额策略**。

**Step 4：数据接入与权限配置**

- 准备数据表（含原始文本 / 文档）。
- 配置 AI 算子访问权限。
- 配置敏感数据脱敏规则。
- 输出：**可调用的数据 + 权限**。

**Step 5：AI Function 测试与 Prompt 调优**

- 在小数据集（1000-10000 行）测试 AI Function。
- 调优 Prompt（准确性、成本、延迟）。
- 评估缓存效果。
- 输出：**Prompt 模板 + 评估报告**。

**Step 6：批处理 Pipeline 部署**

- 构建离线批处理 ETL（基于 Airflow / DolphinScheduler）。
- 配置批处理调度（每天 / 每周）。
- 配置结果持久化（存到事实表）。
- 输出：**批处理 Pipeline**。

**Step 7：实时查询上线**

- 上线 AI Function 实时查询。
- 配置超时降级。
- 配置审计日志。
- 输出：**实时 AI Function 服务**。

**Step 8：可观测与成本监控**

- 集成 Langfuse / Phoenix（LLM 可观测）。
- 集成 CloudWatch / Prometheus（数据库可观测）。
- 配置 Token 用量、成本、延迟仪表盘。
- 配置告警（Token 超限、成本超预算）。
- 输出：**可观测的 LLM in SQL 平台**。

### 4.2 关键技术点

**1. AI Function 性能优化**

- **Batching**：每次 batch 32/64 行，降低 token 成本 30-50%。
- **Caching**：基于 input hash 的精确缓存 + 基于 embedding 的语义缓存，命中率 20-50%。
- **Predicate Push-Down**：先过滤再 AI，减少 80% 调用次数。
- **Partition Pruning**：按分区裁剪数据，减少 90% 扫描量。

**2. 模型路由**

- **任务路由**：小任务用小模型（GPT-4o-mini）、复杂任务用大模型（GPT-4）。
- **成本路由**：低预算用本地 Qwen 7B、高预算用 GPT-4。
- **合规路由**：敏感数据用自托管、非敏感用 GPT-4。
- **延迟路由**：实时用小模型、异步用大模型。

**3. 向量 + SQL 融合**

- **HNSW 索引**：ANN 检索，10x-100x 加速。
- **混合检索**：向量召回 + 关键词过滤 + 元数据过滤。
- **向量 JOIN**：两个向量表相似度 JOIN。
- **向量聚合**：按相似度聚类，统计每个聚类。

**4. NL2SQL 落地**

- **Schema RAG**：基于向量检索相关表 / 列。
- **指标语义层**：dbt Semantic Layer / Cube.js / MetricFlow。
- **Self-Correction**：执行失败 / 结果异常自动重试。
- **多轮精修**：与业务用户多轮对话确认需求。

**5. 安全与合规**

- **行级权限**：用户只能查自己有权限的数据（Postgres RLS / Snowflake Row Access Policy）。
- **列级权限**：敏感列脱敏（身份证、手机号 mask）。
- **Token 配额**：每用户 / 部门每日 token 用量上限。
- **审计日志**：所有 AI 调用记录，含 input / output / token / latency。
- **Prompt 注入检测**：检测并阻断恶意 Prompt。

**6. 成本控制**

- **分层路由**：小模型（GPT-4o-mini）+ 大模型（GPT-4）。
- **缓存**：精确缓存 + 语义缓存。
- **批处理**：batching 降低 token 成本。
- **Prompt 压缩**：精简 Prompt，节省 token。

**7. 可观测**

- **Langfuse / Phoenix**：LLM 可观测（Trace、Token、Prompt 版本）。
- **CloudWatch / Prometheus**：数据库可观测（Query 延迟、CPU、内存）。
- **Token 用量仪表盘**：按用户 / 部门 / 项目 / 模型展示。
- **成本仪表盘**：按日 / 周 / 月统计成本。

**8. 模型版本管理**

- **统一模型注册**：所有 AI Function 使用统一模型版本。
- **A/B 测试**：不同模型 / Prompt 对比效果。
- **效果评估**：基于 BIRD / Spider 内部评估集。
- **回滚机制**：新模型上线失败可快速回滚。

### 4.3 工具链与平台（含 2024-2025 新工具）

**Snowflake Cortex**：

- **AI Functions**：ai_classify / ai_summarize / ai_extract / ai_translate / ai_sentiment / ai_embed / ai_generate_text。
- **Cortex Analyst**：NL2SQL 引擎（基于 dbt Semantic Layer）。
- **Cortex Search**：混合检索（向量 + 关键词）。
- **模型支持**：Claude 3.5/4、GPT-4o、Mistral Large、Llama 3.3、Snowflake Arctic。
- **BYO-LLM**：支持自定义 LLM endpoint。
- **Cortex Fine-Tuning**：模型微调服务。
- **Cortex Agents**（2025）：Multi-Agent + AI Function。

**Databricks AI Functions**：

- **AI Functions**：ai_classify / ai_summarize / ai_extract / ai_translate / ai_fixgrammar / ai_mask / ai_query（NL2SQL）。
- **Databricks Genie**（2024）：自然语言查询 Lakehouse。
- **模型支持**：Meta Llama 3.3、OpenAI GPT-4o、Anthropic Claude 3.5。
- **BYO-LLM**：支持自定义模型 endpoint。
- **Vector Search**：内置向量检索 + SQL 集成。
- **Mosaic AI**：模型微调 / 部署平台。

**阿里云 PolarDB AI**：

- **AI Function**：ai_generate / ai_classify / ai_extract / ai_embed / ai_sentiment。
- **PolarDB for AI**：向量 + 全文 + 关系数据融合。
- **模型支持**：通义千问 Qwen2.5、Qwen-VL、Qwen-Coder。
- **BYO-LLM**：支持自定义模型。

**腾讯云 TDSQL-AI**：

- **AI Function**：ai_generate / ai_embed / ai_search。
- **TDSQL 智能体平台**：对接混元大模型。

**PostgreSQL pgai**（2025）：

- **扩展名**：`pgai`（Timescale / pgvector 团队）。
- **能力**：任意 LLM 嵌入 SQL、向量 + AI Function 融合。
- **模型支持**：OpenAI / Anthropic / Cohere / Ollama（自托管）。
- **开源**：Apache 2.0 协议。

**ClickHouse AI Functions**（2024+）：

- **AI Function**：ai_classify / ai_summarize / ai_embed（基于 LLM API）。
- **ClickHouse Cloud**：内置模型托管。
- **ClickHouse + LangChain 集成**。

**DuckDB ai_functions**（2024+）：

- **本地 AI Function**：ai_classify / ai_embed / ai_generate_text。
- **本地 LLM**：Ollama 集成，本地推理。
- **开源**：MIT 协议。

**向量数据库（专用，对比）**：

- **Milvus**（国产开源）。
- **Pinecone**（云）。
- **Weaviate**（开源，含 AI Function）。
- **Qdrant**（开源）。
- **pgvector**（PostgreSQL 插件）。

**LLM 推理框架（自托管）**：

- **vLLM**（UC Berkeley）：高吞吐量 LLM 推理。
- **Ollama**：本地 LLM 运行。
- **LM Studio**：本地 LLM 桌面应用。
- **TGI（HuggingFace TGI）**：Transformer 推理服务。
- **SGLang**（2024）：UC Berkeley 新一代 LLM 推理。
- **TensorRT-LLM**（NVIDIA）：GPU 加速 LLM 推理。

**可观测与成本**：

- **Langfuse**（开源）。
- **Phoenix**（Arize）。
- **Helicone**（成本优化）。
- **Snowflake ACCOUNT_USAGE**（内置）。
- **Databricks System Tables**（内置）。

**NL2SQL / Cortex Analyst**：

- **Snowflake Cortex Analyst**（2024-05 GA）。
- **Databricks Genie**（2024）。
- **阿里 PolarDB 自然语言查询**。
- **百度 Sugar NL2SQL**。

### 4.4 代码 / 示例

**示例 1：Snowflake Cortex AI Functions**

```sql
-- 1. 文本分类
SELECT
    review_id,
    review_text,
    SNOWFLAKE.CORTEX.AI_CLASSIFY(
        review_text,
        ['positive', 'negative', 'neutral']
    ) AS sentiment
FROM reviews
WHERE product_id = 'P001'
LIMIT 100;

-- 2. 文本摘要
SELECT
    article_id,
    SNOWFLAKE.CORTEX.AI_SUMMARIZE(article_text, 100) AS summary
FROM articles
WHERE publish_date > '2025-10-01';

-- 3. 实体抽取
SELECT
    contract_id,
    SNOWFLAKE.CORTEX.AI_EXTRACT(
        contract_text,
        ['party_name', 'effective_date', 'amount', 'jurisdiction']
    ) AS extracted
FROM contracts;

-- 4. 向量嵌入
CREATE TABLE docs_with_embedding AS
SELECT
    doc_id,
    doc_text,
    SNOWFLAKE.CORTEX.AI_EMBED(
        'e5-base-v2',
        doc_text
    ) AS embedding
FROM documents;

-- 5. 混合检索（Cortex Search）
CREATE CORTEX SEARCH SERVICE doc_search
ON documents
ATTRIBUTES title, category, author
WAREHOUSE = compute_wh
TARGET_LAG = '1 hour'
AS (
    SELECT
        doc_id,
        title,
        content,
        category,
        author
    FROM documents
);

-- 6. NL2SQL（Cortex Analyst）
-- 用户在 Snowflake Intelligence 输入：
--   "上周华东地区的 GMV 是多少？"
-- Cortex Analyst 自动生成：
-- SELECT SUM(order_amount)
-- FROM orders
-- WHERE region = 'East China'
--   AND order_date BETWEEN '2025-09-29' AND '2025-10-05';
```

**示例 2：Databricks AI Functions**

```sql
-- 1. 文本分类（情感分析）
SELECT
    review_id,
    ai_classify(review_text, ARRAY('positive', 'negative', 'neutral')) AS sentiment
FROM reviews;

-- 2. 文本生成（自定义 Prompt）
SELECT
    review_id,
    ai_generate_text(
        CONCAT('用一句话总结以下评论：', review_text)
    ) AS summary
FROM reviews;

-- 3. 实体抽取
SELECT
    contract_id,
    ai_extract(
        contract_text,
        ARRAY('party_name', 'effective_date', 'amount')
    ) AS extracted_fields
FROM contracts;

-- 4. 向量嵌入 + 检索
-- 创建向量索引
CREATE TABLE docs_with_vectors AS
SELECT
    doc_id,
    doc_text,
    ai_embed('databricks-bge-large-en', doc_text) AS embedding
FROM documents;

-- 创建向量索引
CREATE VECTOR INDEX doc_idx
ON docs_with_vectors(embedding)
USING HNSW;

-- 向量检索
SELECT doc_id, doc_text,
       vector_distance(
           ai_embed('databricks-bge-large-en', :query),
           embedding
       ) AS distance
FROM docs_with_vectors
ORDER BY distance ASC
LIMIT 10;

-- 5. NL2SQL（ai_query）
SELECT ai_query(
    'databricks-dbrx-instruct',
    CONCAT('基于以下 schema 生成 SQL：',
           (SELECT GROUP_CONCAT(column_name) FROM information_schema.columns WHERE table_name='orders'),
           '问题：上周华东地区 GMV 是多少？')
) AS generated_sql;
```

**示例 3：PostgreSQL pgai（开源版）**

```sql
-- 安装扩展
CREATE EXTENSION IF NOT EXISTS pgai;

-- 配置 LLM
SELECT pgai.set_model('openai', 'gpt-4o-mini');

-- 1. 文本分类
SELECT
    review_id,
    pgai.classify(review_text, ARRAY['positive','negative','neutral']) AS sentiment
FROM reviews;

-- 2. 向量嵌入
ALTER TABLE documents ADD COLUMN embedding vector(1536);
UPDATE documents
SET embedding = pgai.embed('openai-text-embedding-3-small', doc_text);

-- 3. 混合查询（向量 + SQL）
WITH query_vec AS (
    SELECT pgai.embed('openai-text-embedding-3-small', :query) AS qvec
)
SELECT
    d.doc_id,
    d.title,
    d.content,
    d.embedding <=> q.qvec AS distance
FROM documents d, query_vec q
WHERE d.category = 'technical'
ORDER BY distance ASC
LIMIT 10;
```

**示例 4：阿里云 PolarDB AI**

```sql
-- 1. 文本生成
SELECT
    product_id,
    ai_generate(
        CONCAT('为商品', :product_name, '生成一段 50 字的营销文案')
    ) AS marketing_copy
FROM products;

-- 2. 向量嵌入
ALTER TABLE knowledge_docs ADD COLUMN embedding vector(1024);
UPDATE knowledge_docs
SET embedding = ai_embed(:doc_text, 'qwen2.5-7b-embedding');

-- 3. 混合检索
SELECT
    doc_id,
    title,
    content,
    ai_match(:query, 'bge-m3') AS relevance_score
FROM knowledge_docs
WHERE created_at > '2025-09-01'
ORDER BY relevance_score DESC
LIMIT 10;
```

**示例 5：Python + 自托管 LLM（Ollama）+ DuckDB（本地）**

```python
import duckdb
import ollama

# 连接 DuckDB（本地）
con = duckdb.connect("analytics.db")

# 安装 ai_functions 扩展
con.install_extension("ai_functions")
con.load_extension("ai_functions")

# 配置本地 LLM
con.execute("""
    SET ai_functions_ollama_host = 'http://localhost:11434';
    SET ai_functions_model = 'qwen2.5:7b';
""")

# AI Functions
result = con.execute("""
    SELECT
        review_id,
        ai_classify(review_text, ['positive','negative','neutral']) AS sentiment,
        ai_summarize(review_text) AS summary
    FROM reviews
    LIMIT 100;
""").fetchall()

for row in result:
    print(row)
```

---
