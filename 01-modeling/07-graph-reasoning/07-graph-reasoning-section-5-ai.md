> 本文件是 **07-graph-reasoning.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](07-graph-reasoning.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

2024-2025 图推理最显著的变化，是它从"纯 GNN 模型"变成了"**GNN + KG + LLM**"三件套：

1. **LLM-as-Reasoner over KG**：让 LLM 调用图数据库（SPARQL / Cypher）做精确推理，而不是让它凭空推理。
   - 代表：ToG（Think-on-Graph, 2024）、RoG（2024）、KG-GPT、StructGPT。
   - 工业价值：把"幻觉 + 不可解释"的 LLM 变成"基于事实 + 可溯源"的系统。

2. **GraphRAG**：用图替代或增强向量召回，做 RAG。
   - 代表：Microsoft GraphRAG（社区发现 + LLM 总结）、Ant Group GraphRAG、Neo4j NaLLM、NebulaGraph GraphRAG、LightRAG、FastGraphRAG。
   - 工业价值：解决"长文档总结 / 多跳问答 / 跨文档推理"。

3. **Graph Foundation Model（GFM）**：图上的预训练范式。
   - 代表：OpenGraph、OFA、G-Retriever、LLaGA、GraphGPT、UniGraph。
   - 工业价值：跨业务、跨域的通用图能力，降低单业务建模成本。

4. **LLM 工具调用 + 图**：让 LLM 通过 Function Calling 调用图查询算子（最短路径、社区发现、节点查找、子图匹配）。
   - 代表：LangGraph、LlamaIndex GraphRAG、Neo4j MCP Server（2025）。
   - 工业价值：把图推理嵌入到 Agent 工作流里。

5. **图上的可解释 Agent**：GNN + 路径证据 + LLM 自然语言解释 = "可解释 AI"。
   - 代表：Ant Group XAI、风控场景解释器。

6. **图上的联邦学习 / 隐私计算**：跨企业图推理。
   - 代表：蚂蚁摩斯（MORSE）联邦图学习、阿里 PPU + 图、GraphFed。

7. **图 + 多模态**：文本图、图像图、3D 点云图、视频图。
   - 代表：VideoGraph、SceneGraph、ProteinGNN。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

这是 2024-2026 RAG 架构最热的演进方向。三种 RAG 路线对比：

| 路线 | 优势 | 劣势 | 适用 |
| --- | --- | --- | --- |
| **Naive RAG（向量）** | 简单、便宜、语义召回强 | 不擅长多跳、不擅长结构化关系 | FAQ、简单问答 |
| **Hybrid RAG（向量 + BM25 + 重排）** | 召回率高 | 仍无结构化推理 | 中等复杂度问答 |
| **GraphRAG（图 + LLM）** | 多跳推理、结构化、可解释 | 成本高、图构建贵 | 复杂问答、长文档总结 |

GraphRAG 的标准实现（Microsoft 版本）：

```
文档集
  ↓
切片（500-1000 token）
  ↓
LLM 抽取实体 + 关系 + 属性
  ↓
构建 KG（实体 = 节点，关系 = 边）
  ↓
Leiden 社区发现（自动分层聚类）
  ↓
对每个社区用 LLM 生成 summary
  ↓
社区 summary 索引
  ↓
用户问题
  ↓
检索相关社区
  ↓
社区 summary + 原始 chunks 喂给 LLM
  ↓
答案（含溯源）
```

2025 年 GraphRAG 的演进：

- **LightRAG**（HKU）：轻量、增量友好。
- **FastGraphRAG**（2025）：用 Kùzu 嵌入式图数据库，速度提升 5-10 倍。
- **Ant GraphRAG**：蚂蚁金融场景，结合向量 + KG + LLM-as-Judge。
- **Multi-Modal GraphRAG**：支持图像、表格、视频。
- **Streaming GraphRAG**：实时流式更新。

### 5.3 学术与工业最新进展（2024-2025）

**学术热点（2024-2025 顶会论文方向）**：

1. **Graph Foundation Model**：
   - OpenGraph（Stanford, NeurIPS 2024）
   - OFA（SNAP, ICLR 2024）
   - G-Retriever（UIUC, NeurIPS 2024）
   - LLaGA（SNAP, ICLR 2025）
   - AnyGraph（KDD 2025）
   - UniGraph（KDD 2025）

2. **Graph Transformer**：
   - GraphGPS（NeurIPS 2022 至今仍是 baseline）
   - Graphormer（Microsoft）
   - SGFormer（2024）
   - Exphormer（2023）
   - NodeFormer（2023）
   - Polynormer（2024）

3. **LLM + Graph**：
   - ToG / Think-on-Graph（ICLR 2024）
   - RoG / Retrieval-augmented On Graphs（2024）
   - GraphGPT（OpenBMB, 2024）
   - LLaGA（NeurIPS 2024）
   - HiGPT（Heterogeneous Graph + LLM, 2024）

4. **GraphRAG**：
   - Microsoft GraphRAG（2024）
   - LightRAG（SIGIR 2025）
   - FastGraphRAG（2025）
   - KG-RAG（2024）

5. **可解释 GNN**：
   - GNNExplainer、PGExplainer、CF-GNNExplainer
   - ProtGNN（子图原型）
   - SubgraphX
   - GNNInterpreter

6. **大规模图训练**：
   - GraphScope（阿里，KDD 2024）
   - DistDGL（AWS，OSDI 2024）
   - MariusGNN（Meta）
   - PaGraph（清华）

**工业进展**：

- **阿里 GraphScope**：2024 年发布 2.0 + AutoML，开箱即用。
- **蚂蚁 Ant Graph Learn**：2024 年开源，已在金融风控场景全面落地。
- **字节 ByteGraph**：2024-2025 内部大规模使用。
- **美团 MeituanGNN**：2024 年开源（部分）。
- **微软 GraphRAG**：2024 年开源，引发 GraphRAG 浪潮。
- **Neo4j 5.x + LLM**：2024-2025 主推 NaLLM、Cypher LLM 插件。
- **NebulaGraph 3.6 + GraphRAG**：2024 年发布。
- **Kùzu**：2024-2025 新兴嵌入式图数据库，专注 GraphRAG。

### 5.4 未来 3-5 年趋势

资深架构师读到这里必须能判断"哪些是炒作、哪些是真趋势"：

1. **真趋势：Graph Foundation Model 成为主流**
   - 预训练 backbone + 下游任务微调会从 NLP 蔓延到图。
   - 标志：3 年内会出现"图 Hugging Face"——模型 + 数据集 + Benchmark 一站式平台。

2. **真趋势：GraphRAG 成为 RAG 默认架构之一**
   - 不是"GraphRAG 取代向量 RAG"，而是"两者合体"。
   - 标志：所有一线 RAG 框架（LangChain、LlamaIndex、Haystack）默认支持 GraphRAG 插件。

3. **真趋势：图上的 Agent Memory**
   - 智能体长期记忆本质是图（实体 + 关系 + 时间）。
   - 标志：LangGraph、LlamaIndex、AutoGen 默认用图做 Memory。

4. **真趋势：图作为"AI 资产化"的载体**
   - OneData 4.0（详见 08-one-data.md）会把 KG 纳入企业 AI 资产目录。
   - 标志：数据资产平台（Dataphin、DataWorks、DataFinder）原生支持 KG 管理。

5. **半趋势：图上联邦学习 / 隐私计算**
   - 合规驱动，但工程复杂度高，落地慢。
   - 标志：金融、政务、医疗的"跨机构"图推理会有标准化方案。

6. **半趋势：3D / 视频 / 多模态图**
   - 研究活跃，工业落地受限于算力。

7. **可能炒作：图 + 量子计算**
   - 量子算法在图上有理论加速，但工程上还远。

8. **可能炒作：图 AGI**
   - "图能通向 AGI"——过度乐观。图是结构化信号，但 AGI 是更宏大的命题。

---
