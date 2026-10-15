> 本文件是 **11-olap-engine.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](11-olap-engine.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：自然语言查询（Text-to-SQL）**

- 用户自然语言 → OLAP SQL。
- 工具：Databricks Genie、Snowflake Cortex Analyst、StarRocks AI。

**演进方向 2：OLAP + 向量检索融合**

- 结构化 + 向量统一存储、统一检索。
- 工具：StarRocks 3.x 向量索引、Snowflake Vector Search。

**演进方向 3：AI 驱动的查询优化**

- LLM 预测查询模式、自动优化。
- 工具：Snowflake Query Insights、StarRocks AI Advisor。

**演进方向 4：自治 OLAP（Self-Driving OLAP）**

- AI 自动监控、自动调优、自动扩容。
- 工具：Snowflake Auto-Tuning、StarRocks Auto-Optimization。

**演进方向 5：AI 原生 OLAP**

- OLAP + LLM Functions。
- 工具：Snowflake Cortex、Databricks AI Functions。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**OLAP + RAG**：

- OLAP 结构化事实 + 向量库非结构化检索。
- 工具：StarRocks + LanceDB + LLM。

**OLAP + GraphRAG**：

- OLAP 事实 + 知识图谱。
- 工具：StarRocks + Neo4j + LLM。

**OLAP + 实时特征**：

- OLAP 实时查询 + 特征库。
- 工具：StarRocks + Feast。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **StarRocks 论文（SOSP 2024）**：向量化 + CBO + 物化视图架构。
- **Doris 论文（SIGMOD 2024）**：MPP 架构演进。
- **ClickHouse 论文（VLDB 2024）**：MergeTree + 向量化。

**工业进展**：

- **StarRocks 3.x（2024-2025）**：存算分离、向量索引、AI 优化。
- **Apache Doris 2.1 / 3.0（2024-2025）**：存算分离、向量化 3.0。
- **ClickHouse 24.x（2024）**：SharedMergeTree、Kafka 引擎增强。
- **SelectDB Cloud（2024）**：对标 Snowflake 的云原生 OLAP。

### 5.4 未来 3-5 年趋势

**趋势 1：OLAP + AI 默认集成**

- 所有 OLAP 都集成向量索引 + LLM Functions。
- AI 时代 OLAP 标准能力。

**趋势 2：自治 OLAP**

- AI 自动调优、自适应查询。
- 自治 OLAP 引擎。

**趋势 3：云原生 OLAP**

- 存算分离成为默认。
- 多云、混合云原生支持。

**趋势 4：实时 OLAP + 流批融合**

- OLAP 原生支持流批读写。
- 实时数仓 + 离线分析统一。

**趋势 5：内嵌 OLAP 主流**

- DuckDB / DataFusion 内嵌引擎。
- 边缘计算 + Notebook 原型。

---
