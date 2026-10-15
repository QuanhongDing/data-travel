# 知识图谱构建（Knowledge Graph）

> **一句话定位**：把多源异构数据抽成「实体—关系—属性」图结构并提供推理与查询能力，是 AI 时代数据架构师处理关联查询、推荐风控与 GraphRAG 的核心武器。

> 本文是 data-travel 项目 [Ch1 · 建模方法论](../../README.md) 的子章节（**06 知识图谱**）。覆盖 **R3 数据建模** 能力领域中「**知识图谱（Knowledge Graph）**」相关的 schema 设计、抽取 pipeline、图存储、推理与 AI 时代演化。

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：知识图谱（Knowledge Graph, KG）一词由 Google 在 2012 年提出，用以描述其搜索结果背后的「事物及其关系」的语义网络。从学术渊源看，KG 是早期 Semantic Web（1998-2008，Tim Berners-Lee 提出）的工程化落地，核心是用**有向标记图**承载世界知识，每条边对应一个 RDF 三元组（主体-谓词-客体）。

**工程定义**：知识图谱在数据架构师手里，是**一份可机器查询、可推理、可演化的多源语义图**。它由三部分组成：

- **节点（Vertex / Node）**：实体（Entity）或概念（Concept）。例如「客户张三」「订单 #20251008001」「苹果公司」。
- **边（Edge / Relationship）**：实体间的关系（带方向、可能带属性）。例如「张三 下单 订单 #20251008001」「订单 #20251008001 包含 商品 iPhone 15」。
- **属性（Property / Attribute）**：实体或边的描述。例如「张三的年龄 30」「下单时间 2025-10-08」「下单金额 12,999 元」。

**解决的核心问题**：

1. **关联查询**：传统 SQL 做 3-5 跳 JOIN 性能崩溃，图数据库做多跳遍历是 O(V+E) 复杂度。
2. **关系推理**：发现「A 是 B 的供应商，B 是 C 的母公司」可以推出「A 与 C 是间接关联」。这是 SQL 难以表达的「关系上的关系」。
3. **多源融合**：CRM、ERP、客服、文档等多源数据统一建模为一张图，自然支持跨源关联。
4. **可解释的 AI**：图谱提供「事实 + 路径」的可解释性，是 GraphRAG / 推理引擎的基础。

**与传统关系数据库 / 数仓的边界**：

| 维度 | 关系数据库 / 数仓 | 知识图谱 |
| --- | --- | --- |
| 核心模型 | 表 + JOIN | 图 + 遍历 |
| 典型查询 | 聚合、筛选、分组 | 多跳遍历、模式匹配、子图匹配 |
| 典型负载 | 大数据量聚合 | 复杂关联查询 |
| 扩展性 | 垂直扩展 + 分库分表 | 横向扩展（原生分布式图） |
| Schema 灵活度 | 强 schema（DDL） | 弱 schema / schema-less / 半结构化 |
| 推理能力 | 弱 | 强（图算法 + GNN） |
| AI 友好度 | 中 | **高（GraphRAG / GNN）** |

### 1.2 为什么需要

**业务驱动力**：

- **关联密集型业务的崛起**：反欺诈、推荐、智能问答、情报分析、社交网络、设备/IoT 关联——这些业务的核心是「关系」而非「聚合」。
- **数据复杂度的爆炸**：传统 20 张表能描述的业务，今天需要 200+ 实体类型、2000+ 关系类型，SQL 模型已经力不从心。
- **AI 应用的「事实层」需求**：LLM 的幻觉问题需要「事实层」兜底，知识图谱是首选。
- **可解释性要求**：金融、医疗、合规场景需要「为什么是这个结论」，图谱的路径 + 推理天然可解释。

**痛点**：

1. **SQL 多跳 JOIN 性能灾难**：3 跳 JOIN 已经让数据库崩溃，5 跳根本无法写。
2. **「关系」散落**：业务关系散落在 100+ 张表的不同字段里，没有统一的「关系视图」。
3. **跨域融合难**：不同业务域用不同的「客户」「订单」概念，对齐成本高。
4. **LLM 的「知识截止 + 幻觉」**：大模型知识有截止日，会胡说八道，需要外部知识库。
5. **推荐 / 风控的「冷启动」**：没有足够的用户行为数据时，需要基于「实体关系」做冷启动推理。

**AI 时代的新诉求**：

- **可检索的结构化知识**：RAG 需要「可被检索的结构化知识」，图谱是首选。
- **可推理的事实层**：LLM 需要「事实校验层」，图谱提供。
- **可解释的 Agent**：智能体在做决策时需要「为什么」，图谱的路径天然可解释。
- **Agent-driven 构建**：智能体自主从数据 / 文档抽取实体关系，构建 KG。

### 1.3 在 AI 时代数据架构中的位置

**与其他建模方法的关系**：

```
        [业务过程建模]
              ↓
       ┌──────┼──────┐
       ↓      ↓      ↓
   维度建模  本体建模  知识图谱 ←── 实例层
   （事实层）（语义层）（关联层）
       └──────┼──────┘
              ↓
       AI / 智能体可消费的知识
```

- **本体建模**：定义 KG 的 schema（Class、Property、Axiom）。
- **知识图谱**：填充实例（Entity、Relationship、Attribute）。
- **维度建模**：提供底层事实数据，KG 实例从 DWD 层抽取。
- **图数据推理**：基于 KG 做关联推理（路径、子图匹配、GNN）。

**在数仓 / 湖仓 / 智能体平台中的角色**：

- **数仓**：KG 是 DWS / ADS 之上的「**关联层**」，弥补数仓在多跳关联查询上的短板。
- **湖仓**：KG 提供「**语义网络**」视图，让湖仓从「数据湖」升级为「**知识湖**」。
- **智能体平台**：KG 是智能体的「**事实层 + 关系推理引擎**」——GraphRAG 的核心组件。

**一句话判断**：**会做数仓是 P7，会做数据中台是 P8，会做知识图谱是 P9——KG 是 AI 时代「关联密集型业务」的分水岭。**

### 1.4 演进历程

**传统阶段（1990s–2010）**：

- 1990s：Symbolic AI 的专家系统、Semantic Web 的 RDF 标准。
- 2006：Tim Berners-Lee 提出 Linked Data 原则（4 条规则）。
- 2007：DBpedia 项目启动，从 Wikipedia 抽取结构化知识。
- 2010：Freebase 知识图谱（被 Google 收购）。

**大数据阶段（2010-2020）**：

- 2012：Google 正式命名「Knowledge Graph」，并在搜索中部署。
- 2013–2015：Neo4j、Titan（后被 Datastax 收购）、OrientDB 等图数据库商业化。
- 2017：阿里、华为、百度大规模构建行业知识图谱。
- 2018–2020：KG Embedding（TransE、TransR、RotatE）、GNN（GCN、GAT、R-GCN）成熟。

**AI 原生阶段（2020+，LLM + Agent 驱动）**：

- 2020–2022：KG Embedding + 推荐 / 风控 / 反欺诈大规模落地。
- 2023：KGQA（KG-based Question Answering）与 LLM 结合。
- 2024：Microsoft GraphRAG 把 KG + RAG 推向工业级。
- 2024–2025：Agent-driven KG Construction（智能体自主构建图谱）、KG + LLM 双向增强。
- 2025：Neuro-Symbolic KG（图谱 + LLM 协同推理）成为前沿方向。

**一句话总结**：**知识图谱从「学术语义网」→「搜索引擎 → 工业级关联数据 → AI 时代的事实层与推理引擎」四阶段演进，今天是它真正的黄金期。**

---

## 2. 核心原理

### 2.1 关键概念定义

- **实体（Entity）**：KG 中的节点，对应真实世界的「事物」。例如「客户张三」「订单 #123」「北京」。每个实体有唯一标识（URI / IRI）。
- **关系（Relationship）**：连接两个实体的边，通常带方向和类型。例如「张三-住在-北京」（类型：`residesIn`）。
- **属性（Attribute）**：实体或关系的「描述字段」。例如「张三.age = 30」「张三-住在-北京.since = 2010」。
- **概念 / 类（Class / Concept）**：实体的抽象类型。例如「客户」「订单」「城市」。
- **本体（Ontology）**：KG 的 schema 层（参见前文 05 本体建模）。
- **三元组（Triple）**：KG 的基本数据单位（主体-谓词-客体），对应图中的「边」。
- **RDF / RDFs / OWL**：W3C 标准，是 KG 的语义基础（详见 05 章）。
- **属性图（Property Graph）**：图数据库主流模型（Neo4j 风格），节点和边都可以带任意属性。区别于纯 RDF 三元组模型。
- **Cypher / nGQL / GQL / SPARQL**：图查询语言。Cypher（Neo4j）、nGQL（NebulaGraph）、GQL（ISO 标准，2024 发布）、SPARQL（RDF）。
- **图嵌入（Graph Embedding）**：把节点 / 边 / 子图映射到向量空间。代表方法：TransE、TransR、RotatE、ComplEx、Node2Vec、GraphSAGE。
- **图神经网络（GNN）**：在图上做深度学习。代表模型：GCN、GAT、R-GCN（关系图）、HAN（异构图）。
- **KG Embedding**：专门为 KG 设计的嵌入，考虑关系类型与语义。代表方法：TransE（平移）、DistMult、ComplEx、RotatE。
- **实体识别（NER, Named Entity Recognition）**：从文本中识别实体边界与类型。例如从「张三于 2010 年在北京工作」识别出 `张三（人名）、2010（时间）、北京（地点）`。
- **关系抽取（RE, Relation Extraction）**：从文本中识别实体间的关系类型。例如识别「张三-居住-北京」关系为 `residesIn`。
- **属性对齐（Property Alignment）**：把不同数据源的同一概念 / 属性 / 关系映射到 KG 中的同一节点。例如 CRM 的 `customer_id` 与 ERP 的 `party_no` 映射到 KG 的 `Customer` 节点。
- **实体链接（Entity Linking）**：把文本中的「mention」映射到 KG 中的具体实体。例如「苹果」→ `Apple_Inc` 或 `Apple_Fruit`（消歧）。
- **KG Fusion（图谱融合）**：把多个来源的 KG 合并成一个，常用算法：PARIS、HolOn、Silk。
- **图谱质量评估**：评估 KG 的正确性、覆盖率、一致性。常用指标：accuracy、coverage、consistency、completeness。
- **路径推理（Path Reasoning）**：通过 KG 中实体的连接路径做推理。例如「A 的朋友的朋友是 B」→ 推断 A 与 B 存在 2 度关系。
- **子图匹配（Subgraph Matching）**：在 KG 中查找与给定模式匹配的子图。例如「找出所有在北京工作、毕业于清华、年龄 30-35 的客户」。
- **图算法**：PageRank、Community Detection、Shortest Path、Centrality、Connected Components 等经典图算法。

### 2.2 数学 / 形式化基础

KG 在数学上是「**有向标记多重图**」——节点集 V + 边集 E，边有方向与类型（label）。RDF 模型进一步把边视为「带标签的有序三元组」(s, p, o)，对应图上的同态查询语义。Cypher 的 MATCH 子句本质上是「带变量的图模式匹配」，等价于图同态（Graph Homomorphism）。

KG Embedding 把 KG 嵌入到向量空间，数学上是对「关系三元组」的代数约束。TransE 的核心是 `h + r ≈ t`（头实体 + 关系 ≈ 尾实体），这是基于关系「平移不变性」的几何假设；RotatE 把关系视为复数空间中的相位旋转 `t = h ∘ r`，能建模对称 / 反对称 / 组合关系。

GNN 的数学基础是「**图上的消息传递（Message Passing）**」：每个节点从邻居聚合特征，更新自身表示，再传递给下一层邻居。本质是「图上的卷积 / 注意力」，与 CNN 在欧式空间上的卷积类似。

### 2.3 关键算法 / 方法

1. **实体识别（NER）**：
   - 规则法：正则表达式、词典匹配（高准确率、低召回率）。
   - 传统 ML：CRF、HMM（中等性能）。
   - 深度学习：BiLSTM-CRF、SpanBERT（2019）、Flair。
   - LLM：GPT-4 / Claude 直接 NER（2024+），性能最好但成本高。

2. **关系抽取（RE）**：
   - 流水线（Pipeline）：先 NER，再 RE（误差累积）。
   - 联合抽取（Joint）：NER + RE 同时做（BERT-based Joint Extraction）。
   - 远程监督（Distant Supervision）：用已有 KG 自动标注训练数据（噪声大）。
   - LLM：Few-shot 抽取 + 自验证（2024 新趋势）。

3. **实体链接（Entity Linking）**：
   - 基于候选生成（基于字符串 / 上下文）+ 排序（基于嵌入 / 知识）。
   - 代表模型：BLINK（基于 BERT 双塔）、End-to-End EL。

4. **KG 嵌入**：
   - 平移模型：TransE、TransH、TransR、TransD。
   - 双线性模型：DistMult、ComplEx、ANALOGY。
   - 旋转模型：RotatE（2019，关系视为复数旋转）。
   - 图神经网络：R-GCN（关系图卷积）、HAN（异构图注意力）、CompGCN。

5. **KG 融合**：
   - PARIS（概率对齐，经典方法）。
   - HolOn、Silk（基于属性相似度的对齐）。
   - BERTMap、LLM-based Alignment（2024+）。

6. **图算法**：
   - PageRank（节点重要性）。
   - Community Detection（Louvain、Leiden、Label Propagation）。
   - Shortest Path、Dijkstra、A*。
   - Connected Components、Centrality（介数、接近度、特征向量）。

7. **路径推理**：
   - PathRank（基于随机游走）。
   - PRA（Path Ranking Algorithm，经典）。
   - DeepPath（基于强化学习的路径推理）。
   - 规则学习：AIME、AMIE 3（归纳 KG 规则）。

8. **图神经网络（GNN）**：
   - GCN（图卷积网络）。
   - GAT（图注意力网络）。
   - R-GCN（关系图卷积，处理多关系 KG）。
   - GraphSAGE（归纳式 GNN，支持新节点）。
   - HAN（异构图注意力网络）。

### 2.4 与相邻概念的关系

- **知识图谱 vs 本体**：本体是 KG 的 schema（Class / Property / Axiom），KG 是本体的实例化（Entity / Relationship / Attribute）。**没有本体的 KG 是「数据沼泽」，没有 KG 的本体是「空架子」**。
- **知识图谱 vs 关系数据库**：图数据库原生支持多跳遍历与图算法，关系数据库依赖 JOIN（性能差）。但 RDBMS 在聚合查询上更优。
- **知识图谱 vs 向量数据库**：向量数据库擅长「语义相似度」检索，知识图谱擅长「关系推理」。Hybrid 架构（向量 + 图谱）是 2024 年的主流。
- **知识图谱 vs 大模型**：大模型是「隐式 / 概率 / 不可溯源」的知识载体，知识图谱是「显式 / 形式化 / 可推理 / 可溯源」的知识载体。两者互补（Neuro-Symbolic）。
- **知识图谱 vs 主数据（OneID）**：OneID 是 KG 的一个特例（关注实体标识与合并）。KG 比 OneID 更广（含关系、属性、推理）。
- **知识图谱 vs 图数据库**：图数据库是存储 / 查询引擎，知识图谱是「数据 + 语义 + 应用」的综合体。可以基于图数据库 / 三元组库 / 关系数据库构建 KG。

---

- [§3. 设计模式与范式](06-knowledge-graph-section-3-sec3.md)
- [§4. 工程实现](06-knowledge-graph-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](06-knowledge-graph-section-5-ai.md)
- [§6. 落地实践](06-knowledge-graph-section-6-sec6.md)
- [§7. 与其他方法对比](06-knowledge-graph-section-7-sec7.md)
- [§8. 面试真题集](06-knowledge-graph-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](06-knowledge-graph-section-3-sec3.md)
- [§4. 工程实现](06-knowledge-graph-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](06-knowledge-graph-section-5-ai.md)
- [§6. 落地实践](06-knowledge-graph-section-6-sec6.md)
- [§7. 与其他方法对比](06-knowledge-graph-section-7-sec7.md)
- [§8. 面试真题集](06-knowledge-graph-section-8-sec8.md)

---
