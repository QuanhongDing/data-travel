> 本文件是 **08-offline-compute.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](08-offline-compute.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：AI 驱动的 Spark 调优**

- LLM 分析 Spark UI → 自动调优。
- 工具：Sparklens + LLM、自研。

**演进方向 2：Spark AI Functions（2024 路线）**

- Spark 内置 Embedding / LLM。
- 一份 SQL 同时做 ETL + AI。
- 工具：Apache Spark 4.0。

**演进方向 3：DuckDB 内嵌 AI**

- DuckDB + LanceDB + LLM。
- Notebook 原型 / 小数据分析。

**演进方向 4：LLM 辅助 SQL 生成**

- 自然语言 → SQL → Spark / DuckDB。
- 工具：Databricks Assistant、Snowflake Cortex Analyst。

**演进方向 5：自治离线计算**

- AI 自动监控、自动调优、自动恢复。
- 工具：自研 + LLM。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**Spark + RAG**：

- Spark 批量 Embedding → 向量库。
- 工具：Spark AI Functions、LangChain Spark Integration。

**Spark + 向量库**：

- Spark 批量写入 Milvus / Pinecone / LanceDB。
- 工具：LanceDB Connector。

**Spark + GraphRAG**：

- Spark 抽取实体关系 → Neo4j。
- 工具：Neo4j Spark Connector。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **DuckDB 论文（VLDB 2024）**：内嵌 OLAP 架构。
- **Spark 4.0 路线图（2024）**：Spark Connect、AI Functions。
- **Trino 论文（SIGMOD 2024）**：联邦查询架构。

**工业进展**：

- **Apache Spark 3.5（2024）**：Spark Connect GA、AQE 增强。
- **DuckDB 1.x（2024）**：MMPP 多机并行、向量类型。
- **Trino 420+（2024）**：Iceberg V3、向量类型。

### 5.4 未来 3-5 年趋势

**趋势 1：AI 原生计算**

- Spark / DuckDB 内置 AI Functions。
- LLM 成为一等公民。

**趋势 2：内嵌 OLAP 主流**

- DuckDB / DataFusion 内嵌引擎。
- Notebook / 边缘计算场景。

**趋势 3：自治离线**

- AI 自动调优。
- 自治 Spark。

**趋势 4：联邦查询主流**

- Trino 跨云、跨源。
- 联邦 Lakehouse。

---
