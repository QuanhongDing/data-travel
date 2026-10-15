> 本文件是 **09-realtime-compute.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](09-realtime-compute.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**演进方向 1：Flink + AI Functions**

- Flink 集成 LLM、Embedding。
- 流式 LLM 调用。
- 工具：Flink AI Functions（2024 路线）。

**演进方向 2：流式 RAG**

- Flink 实时处理 → Embedding → 向量库 → RAG。
- 工具：Flink + LanceDB / Milvus。

**演进方向 3：流式 Agent**

- Flink 实时事件 → Agent 决策。
- 工具：Flink + LangChain / AutoGen。

**演进方向 4：实时特征工程**

- Flink + Feast / Tecton。
- 在线学习（Online Learning）。

**演进方向 5：Flink 2.0 路线**

- 性能优化、API 简化。
- 自适应调度。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**流式 RAG**：

- Flink 处理文档流 → Embedding → 向量库。
- 工具：Flink AI Functions + LanceDB。

**流式 GraphRAG**：

- Flink 实时事件 → 实体关系抽取 → 知识图谱。
- 工具：Flink + Neo4j Connector。

**实时特征 + 向量库**：

- Flink 实时特征 → 在线推理。
- 工具：Flink + Feast + Milvus。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **Flink 论文（VLDB 2024）**：流处理引擎架构演进。
- **Flink CDC 论文（2024）**：Flink 原生 CDC 优化。
- **Flink 2.0 路线图（2024）**：自适应调度、API 简化。

**工业进展**：

- **Apache Flink 1.19+（2024）**：Adaptive Scheduler、SQL 增强。
- **Apache Flink CDC 3.x（2024）**：无锁读取、Paimon 集成。
- **Materialize 1.x（2024）**：流式 SQL 数据库。
- **Decodable（2024）**：流式 SaaS。

### 5.4 未来 3-5 年趋势

**趋势 1：Flink 2.0**

- 性能优化、API 简化。
- 自适应调度。

**趋势 2：流式 AI / Agent**

- Flink + LLM / Agent 成为主流。
- 实时智能决策。

**趋势 3：流批一体成熟**

- Flink + Paimon / Iceberg。
- 流批不再分家。

**趋势 4：自治流处理**

- AI 自动调优、自适应。
- 自治 Flink。

**趋势 5：边缘流处理**

- Flink on 边缘（IoT 设备）。
- 边缘 AI。

---
