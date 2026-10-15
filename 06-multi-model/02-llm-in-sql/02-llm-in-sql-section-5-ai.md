> 本文件是 **02-llm-in-sql.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](02-llm-in-sql.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：AI Functions 标准化**

2024-2025 各大数据库厂商加速 AI Function 标准化：

- Snowflake Cortex（ai_classify / ai_summarize / ai_extract / ai_embed / ai_generate）。
- Databricks AI Functions（同上）。
- 阿里 PolarDB AI。
- PostgreSQL pgai。
- ClickHouse AI。
- DuckDB ai_functions。

目标是"AI 算子跨数据库统一接口"。

**方向 2：Self-Hosted LLM 集成**

数据不出仓需求驱动 Self-Hosted LLM 集成：

- vLLM / Ollama / SGLang 提供高吞吐推理。
- 数据库通过 HTTP API 调用企业内网 LLM。
- 阿里云 PAI、腾讯 TI 平台、火山方舟提供托管推理。

**方向 3：Cortex Analyst / NL2SQL 内嵌**

NL2SQL 不再是 Data Agent 的专属能力，数据库内嵌 NL2SQL：

- Snowflake Cortex Analyst（2024）。
- Databricks Genie（2024）。
- 阿里 PolarDB 自然语言查询。

**方向 4：Multi-Model Routing**

数据库内自动路由不同 LLM：

- 小任务（分类、摘要）用小模型。
- 大任务（生成、推理）用大模型。
- 敏感数据用自托管，非敏感用 GPT-4。
- 实时用低延迟模型，离线用高精度模型。

**方向 5：Cortex Agents / Multi-Agent + AI Function**

2025 年 Snowflake Cortex Agents / Databricks Genie 都开始融合 Multi-Agent：

- Router Agent → SQL Agent / RAG Agent / AI Function Agent。
- 每个 Agent 单一职责，可独立调度。
- 与传统 BI / RAG / 工具调用深度融合。

**方向 6：Fine-Tuning 内嵌**

数据库厂商内置 LLM Fine-Tuning：

- Snowflake Cortex Fine-Tuning。
- Databricks Mosaic AI Fine-Tuning。
- 用户可在数据库内微调行业模型。

**方向 7：文档 / 多模态 AI Function**

从纯文本扩展到多模态：

- ai_parse_doc（PDF / 图片解析）。
- ai_ocr（图片转文本）。
- ai_extract_table（表格抽取）。
- ai_video_summary（视频摘要）。

**方向 8：In-Database Inference 硬件加速**

GPU / TPU 内嵌数据库：

- Snowflake Cortex GPU 加速（NVIDIA A100）。
- Databricks GPU 集群。
- ClickHouse GPU 加速。
- 数据库厂商自研 AI 芯片（如阿里含光 800）。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**LLM in SQL + 向量检索**：

```
用户问题
   ↓
[SQL 查询：向量召回 + 元数据过滤 + 聚合]
   ↓
[AI Function：基于检索内容生成答案]
   ↓
最终答案
```

典型场景：

```sql
-- Step 1: 向量检索召回 Top-K
WITH retrieved AS (
    SELECT doc_id, content
    FROM knowledge_docs
    ORDER BY ai_embed(:query, 'bge-m3') <=> embedding
    LIMIT 5
)
-- Step 2: 用 LLM 生成答案
SELECT ai_generate_text(
    CONCAT('基于以下文档回答问题：', STRING_AGG(content, '\n\n'),
           '\n\n问题：', :user_query)
) AS answer
FROM retrieved;
```

**LLM in SQL + GraphRAG**：

- Snowflake Cortex + GraphRAG（2025）——向量 + 图谱融合。
- Databricks Genie + Knowledge Graph（2025）。
- 用 KG 找实体，用 SQL 查事实。

**LLM in SQL + Data Agent**：

- Data Agent 调度 LLM in SQL（数据不出仓 + 批量快）。
- Data Agent 调度外部 LLM（生成 / 创作）。
- Data Agent 调度 BI 工具（可视化）。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **In-Database AI** 论文（SIGMOD 2024）——数据库内嵌 LLM 的系统设计。
- **Vector Database + LLM**（VLDB 2024）——向量检索与 LLM 融合。
- **NL2SQL**（ACL 2024）——自然语言转 SQL 进展。
- **ai_functions 标准化提案**（2024）——跨数据库 AI Function 标准化。

**工业进展（2024）**：

- **Snowflake Cortex GA**（2023-11 → 2024 全面升级）。
- **Snowflake Cortex Analyst GA**（2024-05）。
- **Databricks AI Functions GA**（2024-04）。
- **Databricks Genie**（2024）——Lakehouse 自然语言查询。
- **阿里 PolarDB AI**（2024-06）——国内首款 AI Function 数据库。
- **PostgreSQL pgai 发布**（2025-01）——开源生态完善。
- **ClickHouse AI Functions**（2024）——OLAP 数据库 AI 化。
- **DuckDB ai_functions**（2024）——本地嵌入式数据库 AI 化。

**2025 趋势**：

- **Multi-Model Routing 标准化**。
- **Self-Hosted LLM 集成深化**。
- **Cortex Agents / Multi-Agent + AI Function 融合**。
- **Fine-Tuning 内嵌**。
- **多模态 AI Function**（文档 / 图片 / 视频）。
- **硬件加速**（GPU / 专用 AI 芯片）。
- **跨厂商标准化**（ai_classify 跨数据库统一接口）。

### 5.4 未来 3-5 年趋势

1. **「AI 算子跨数据库统一接口」**：3-5 年内 ai_classify / ai_summarize / ai_embed 跨厂商统一，类似 SQL 标准化。
2. **「Self-Hosted LLM 默认化」**：60%+ 企业将部署自托管 LLM，数据不出仓成为硬约束。
3. **「Multi-Model Routing 智能调度」**：数据库自动根据任务 / 成本 / 合规选择模型，用户无感。
4. **「Fine-Tuning 内嵌到数据库」**：行业模型微调将集成到数据库，无需外部 ML 平台。
5. **「多模态 AI Function 主流化」**：文档 / 图片 / 视频 / 音频的 AI 处理将嵌入数据库。
6. **「GPU / 专用 AI 芯片内嵌数据库」**：数据库厂商将集成专用 AI 硬件，提升推理性能 10x-100x。
7. **「AI Function + Agent 融合」**：传统 SQL + AI Function + Agent 工作流三件套成为数据平台标配。
8. **「合规原生支持」**：数据库原生支持等保 2.0/3.0、GDPR、《数据安全法》合规要求。

---
