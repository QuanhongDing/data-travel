# RAG 架构（RAG Architecture）

> **一句话定位**：检索增强生成——把向量召回 + 关键词召回 + 知识图谱 + LLM 生成组合成的端到端架构，是 LLM 应用「事实层」的事实标准。

> 本文是 data-travel 项目 [Ch4 · 数据资产化与智能检索](../../README.md) 的子章节（05 RAG 架构）。覆盖 **核心职责② 企业私有数据资产化与智能检索** 相关的「端到端检索增强生成（RAG）」架构。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| RAG 是什么、为什么需要、跟传统 QA 有什么不同？ | §1 |
| Naive/Advanced/Modular/Agentic/Graph RAG 的原理与差异？ | §2、§3 |
| Chunking、Embedding、Reranker、Hybrid Search 怎么选型？ | §4 |
| 2024-2025 的 Self-RAG、CRAG、GraphRAG、Agentic RAG 演进？ | §5 |
| 真实落地中常见的踩坑与评测方法？ | §6 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：检索增强生成（Retrieval-Augmented Generation, RAG）由 Facebook AI（Meta）在 2020 年的论文《Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks》中首次系统化提出。它通过在 LLM 生成之前引入一个**外部知识检索器**，把「事实知识」从模型参数外置到可检索的索引中，从而缓解 LLM 的「知识截止 + 幻觉 + 不可溯源」三大问题。

**工程定义**：在数据架构师手里，RAG 是**一条从用户问题出发、经过召回 → 精排 → 上下文组装 → LLM 生成的端到端检索增强流水线**。它的核心是把企业私有数据（文档 / 代码 / 报表 / 数据库）变成 LLM 可消费的「外部事实层」。

**RAG 解决的核心问题**：

1. **LLM 的「知识截止」**：LLM 训练数据有截止日，企业内部知识 LLM 完全没见过。
2. **LLM 的「幻觉」**：LLM 会「一本正经胡说八道」，RAG 用事实兜底。
3. **LLM 的「不可溯源」**：业务要求「答案从哪里来」，RAG 给出引用。
4. **LLM 的「上下文窗口有限」**：长文档不可能全部塞进 prompt，RAG 只取相关片段。
5. **数据的「实时性」**：业务数据每天都在变，RAG 可以毫秒级拉取最新事实。

**与传统 QA / 检索的区别**：

| 维度 | 传统关键词检索 | 传统 QA 系统 | RAG |
| --- | --- | --- | --- |
| 输入 | 关键词 | 自然语言问题 | 自然语言问题 |
| 输出 | 文档列表 | 结构化答案 | 自然语言 + 引用 |
| 知识源 | 倒排索引 | 规则 / 知识库 | 向量 + 倒排 + KG + DB |
| 语义理解 | 弱 | 中 | 强 |
| 可解释性 | 中 | 弱 | 强（可溯源） |
| 实时性 | 强 | 弱 | 强 |
| LLM 依赖 | 无 | 无 | 必须 |
| 适用规模 | 全网 | 垂直领域 | 企业私有 + 通用 |

### 1.2 为什么需要

**业务驱动力**：

- **企业私有数据无法被通用 LLM 触达**：法律 / 医疗 / 金融 / 制造行业的私有数据无法上传给第三方 LLM 训练。
- **「答案要可解释」**：监管 / 合规场景要求每条结论可追溯到原始证据。
- **「长文档问答」**：一份 500 页招股书不可能塞进 prompt，需要先检索再生成。
- **「实时业务」**：商品价格 / 库存 / 订单状态每秒钟都在变，必须实时检索。
- **「成本控制」**：相比 Fine-tuning（百万级训练成本），RAG 只需构建索引（十万级成本）。

**痛点**：

1. **Fine-tuning 不能解决「知识更新」**：微调后的模型很快过期。
2. **Prompt Engineering 不能解决「私有数据」**：再长的 prompt 也无法塞下 100 万份文档。
3. **长上下文 LLM 不能解决「成本 / 精度」**：1M token 上下文模型慢且贵，且无法精准定位。
4. **LLM Tool-use 复杂但收益有限**：工具调用本身就需要 RAG 兜底。
5. **单一向量召回召回率不足**：相似度检索无法处理「精确匹配」「多跳推理」「时效过滤」。

**AI 时代的新诉求**：

- **Agent 必须有事实层**：Agent 决策不能靠「猜」，必须有 RAG 兜底。
- **「可解释 AI」**：监管要求每条 AI 结论可追溯，RAG 是唯一选择。
- **「多模态 RAG」**：图像 / 视频 / 音频 / 表格也要可被 RAG 检索。
- **「GraphRAG」**：传统 Vector RAG 做不了多跳推理，KG 增强的 GraphRAG 是 2024 主流。

### 1.3 在 AI 时代数据架构中的位置

**RAG 在数据架构中的角色**：

```
   [数据源]           [预处理]           [索引层]           [检索层]
   文档/DB/API  → 清洗/切分/嵌入  → 向量库/ES/KG  → 召回/精排/融合
                                                            ↓
                                          [LLM 增强生成层] ← 用户问题
                                                            ↓
                                                        [答案+引用]
```

- **上游**：依赖 Ch1（建模）+ Ch3（数据全栈）的预处理与索引。
- **下游**：被 Ch5（智能体平台）+ Ch7（自进化）+ Ch9（数据智能产品）调用。
- **横向**：与向量库 / KG / 全文检索 / 元数据目录深度协同。

**RAG 在 AI 平台中的位置**：

- **是 Agent 的核心工具**：Agent 的「事实查询」几乎都通过 RAG 完成。
- **是 LLM 应用的「事实层」**：所有需要「准确性 + 可解释性」的 LLM 应用都要 RAG。
- **是企业数据资产化的「变现路径」**：RAG 让「数据」变成「可被 LLM 消费的知识」。

**一句话判断**：**LLM 是「大脑」，RAG 是「外接大脑」，向量库是「海马体」，知识图谱是「长期记忆」。没有 RAG 的 LLM 是「失忆的天才」，没有向量库的 RAG 是「翻字典」。**

### 1.4 演进历程

**萌芽阶段**：

- **2020.05**：Lewis 等人发表 RAG 原论文，奠定架构基础。
- **2020-2022**：REALM、RETRO、Atlas 等检索增强预训练模型出现。
- **2021**：Faiss / Annoy 等向量索引成熟，RAG 工程化成为可能。
- **2022.11**：ChatGPT 发布，RAG 工程化需求爆发。

**Naive RAG 阶段**：

- **2023**：LangChain / LlamaIndex 爆发，Naive RAG（向量召回 + Prompt）成为 LLM 应用标配。
- **2023.10**：RAGAS 评测框架发布。
- **2024.01**：Advanced RAG（Query Rewrite / HyDE / Reranker）成为新主流。

**Advanced / Modular RAG 阶段**：

- **2024**：Modular RAG 预印本（GAIR Lab）提出「模块化 RAG」架构。
- **2024**：Self-RAG 收录于 ICLR 2024（2023 年预印本），引入「自反思」机制。
- **2024**：Corrective RAG（CRAG）预印本发表。
- **2024.07**：Microsoft GraphRAG 开源引爆社区。

**Agentic / GraphRAG 阶段（2024 末-2025）**：

- **2024 Q4**：Agentic RAG（智能体驱动的多步检索）成为新前沿。
- **2025**：GraphRAG 与 Hybrid RAG 工业化，Neo4j 5 + Vector Index、Weaviate Hybrid Search 普及。
- **2025**：RAG 评估体系成熟（RAGAS、TruLens、ARES、DeepEval）。

**一句话总结**：**RAG 的演进路径是「学术论文」→「LangChain 玩具」→「向量召回 + Prompt」→「模块化 RAG」→「Agentic + GraphRAG」，2025 年是其工业化落地的元年。**

---

## 2. 核心原理

### 2.1 关键概念定义

- **Chunk（分块 / 切片）**：把长文档切成多个可独立检索的「段」。常见策略：固定窗口、滑动窗口、语义切分、结构感知切分。
- **Embedding（嵌入）**：把文本 / 图像 / 音频映射到高维向量空间。常用模型：OpenAI text-embedding-3、BGE-M3、M3E、CLIP、ImageBind。
- **向量索引（Vector Index）**：高效检索「最近邻」的索引结构。常见算法：HNSW、IVF、PQ、DiskANN（2023-2024）。
- **检索器（Retriever）**：从索引中召回候选文档的组件。可以是向量 / 关键词 / KG / SQL。
- **Reranker（精排器）**：对召回结果做精细排序的模型。常见模型：Cohere Rerank 3、BGE-reranker、ColBERT、Cross-Encoder。
- **Prompt Template**：把「问题 + 上下文」组装成 LLM 输入的模板。
- **Context Window（上下文窗口）**：LLM 一次能处理的最大 token 数（GPT-4o 128K、Claude 3.5 200K、Gemini 1.5 1M-2M）。
- **Top-K / Top-N**：检索返回前 K / N 个候选。
- **Recall@K**：在前 K 个候选中命中正确答案的比例。
- **MRR（Mean Reciprocal Rank）**：第一个正确答案排名的倒数的平均。
- **nDCG（Normalized Discounted Cumulative Gain）**：考虑排序质量的评估指标。
- **HyDE（Hypothetical Document Embeddings）**：让 LLM 先「假写一个答案」，再用答案做检索。
- **Query Rewrite**：用 LLM 把用户问题改写成更适合检索的查询。
- **Contextual Compression**：把检索到的内容压缩到最小必要信息。
- **Self-RAG**：让 LLM 在生成中插入「反思 token」，决定是否需要再检索。
- **Corrective RAG（CRAG）**：对检索结果做「可信度评估」，不可信则触发重检索或 Web 搜索。
- **Agentic RAG**：由智能体决策「检索什么 / 何时检索 / 如何组合」。
- **GraphRAG**：先用 LLM 构建知识图谱，再基于图谱做检索（Microsoft 2024）。
- **Multi-hop QA**：需要多步推理才能回答的问题。
- **RAGAS**：RAG 评估框架（Context Relevance / Answer Faithfulness / Answer Relevance）。
- **TruLens**：LLM 应用评估框架（context relevance / groundedness / answer relevance）。

### 2.2 数学 / 形式化基础

RAG 的数学本质是「**条件概率生成 + 信息检索**」。

给定用户问题 `q`，目标是最大化「在已知检索到的证据 `D` 下生成正确答案 `a`」的对数似然：

```
P(a | q, D) = P(a | q, d_1, d_2, ..., d_k)
           = P_LLM(a | prompt(q, d_1, ..., d_k))
```

其中 `D = {d_1, d_2, ..., d_k}` 是从语料库 `C` 中检索出的 Top-K 文档：

```
D = TopK_K( sim(q, d) | d ∈ C )
```

`sim(q, d)` 可以是：
- **向量相似度**：`sim(q, d) = cos(emb(q), emb(d))`
- **BM25**：`sim(q, d) = BM25(q, d)`（基于词频 / 文档频率 / 文档长度）
- **混合相似度**：`sim(q, d) = α · cos(q, d) + β · BM25(q, d)`
- **RRF 融合**：`score(d) = Σ_{r ∈ retrievers} 1 / (k + rank_r(d))`，k 是常数（通常 60）。

**Reranker 的数学**：

```
rerank_score(q, d) = CrossEncoder(q, d)
```

Cross-Encoder 把「问题 + 文档」拼在一起过 BERT，比双塔 Bi-Encoder 准但慢。

**GraphRAG 的数学**：

```
KG = Extract(text) → { (h, r, t) }
Communities = Leiden(KG)
Summaries = { LLM_summarize(c) | c ∈ Communities }
Answer = LocalSearch(q, KG) ∨ GlobalSearch(q, Summaries)
```

### 2.3 关键算法 / 方法

**Chunking 算法**：

| 算法 | 原理 | 优缺点 |
| --- | --- | --- |
| 固定窗口 | 按 token 数切分（500 / 1000） | 简单，但可能切碎语义 |
| 滑动窗口 | 相邻 chunk 有 overlap（10-20%） | 缓解边界切断，但有冗余 |
| 句子切分 | 按句子边界切分（NLTK / spaCy） | 保持句子完整，但长度不均 |
| 语义切分 | 用 embedding 相邻相似度找切点 | 语义完整，但慢 |
| 结构感知切分 | 按 Markdown / HTML / 代码语法切 | 适合结构化文档 |
| LLM 辅助切分 | 让 LLM 决定切分点 | 准但贵 |
| 递归切分 | 先按段落，再按句子，再按 token | 兼顾长度与语义（LangChain 默认） |

**Embedding 模型**：

| 模型 | 维度 | 特点 | 适用 |
| --- | --- | --- | --- |
| OpenAI text-embedding-3-large | 3072 | 通用、性能强 | 英文为主 |
| BGE-M3（BAAI 2024） | 1024 | 多语言 / 多功能 / 多粒度 | 中文 + 多语言首选 |
| M3E | 1024 | 中文优化 | 中文场景 |
| BGE-reranker-large | - | 精排 | 召回后精排 |
| Cohere Rerank 3 | - | 商业精排 | 多语言 |
| CLIP | 512 / 768 | 图文对齐 | 多模态 RAG |
| OpenCLIP | 512 / 1024 | 开源 CLIP | 多模态 |
| Qwen-VL Embedding | - | 中文图文 | 国内多模态 |
| ColBERT / ColBERTv2 | 变长 | 晚交互 | 高精度检索 |
| SPLADE / SPLADE++ | 稀疏 | 稀疏 + 语义 | 混合检索 |
| Voyage AI | 1024 | 长文本（32K） | 长文档 |
| Nomic Embed | 768 | 长文本 + 可定制 | 长文档 |
| Instructor Embedding | 768 | 任务指令驱动 | 多任务 |

**检索算法**：

| 算法 | 原理 | 特点 |
| --- | --- | --- |
| Brute Force | 遍历所有向量算相似度 | 准但慢 |
| IVF（Inverted File） | K-means 聚类，只搜最近类 | 快但近似 |
| HNSW（Hierarchical NSW） | 分层导航小世界图 | 主流方案，内存索引 |
| PQ（Product Quantization） | 向量量化压缩 | 省内存，损失精度 |
| Annoy | 随机投影树 | Spotify 出品 |
| ScaNN | 量化 + 各向异性 | Google 出品 |
| DiskANN（2023-2024） | SSD 上的 ANN | 十亿级向量，成本低 |
| Vamana | DiskANN 同源 | DiskANN 核心算法 |

**Rerank 算法**：

| 算法 | 原理 | 特点 |
| --- | --- | --- |
| Cross-Encoder | 把 q + d 拼接过 BERT | 准但慢 |
| Bi-Encoder | q 与 d 分别编码再算相似度 | 快但粗 |
| ColBERT / ColBERTv2 | 晚交互（token 级相似度） | 兼顾精度与速度 |
| Cohere Rerank 3 | 商业闭源 | 多语言、SOTA |
| BGE-reranker | 开源 | 中文首选 |
| LLM-as-Reranker | 让 LLM 排序 | 准但贵 |
| RankT5 / MonoT5 | T5 排序 | 经典 |

**RAG 范式**：

1. **Naive RAG**：用户问题 → Embedding → 向量召回 Top-K → 拼 Prompt → LLM 生成。
2. **Advanced RAG**：Naive + Query Rewrite / HyDE / Reranker / Context Compression。
3. **Modular RAG**（GAIR Lab 2024）：把 RAG 拆成「可插拔模块」（索引 / 检索 / 重排 / 生成 / 反馈）。
4. **Self-RAG**（2023 年预印本、ICLR 2024）：LLM 在生成中插入 `[Retrieve]` `[IsRel]` `[IsSup]` `[IsUse]` 反思 token。
5. **Corrective RAG（CRAG）**（2024）：检索后做可信度评估，不行就触发 Web 搜索或重检索。
6. **Agentic RAG**（2024-2025）：智能体决定「查什么、何时查、怎么组合」。
7. **GraphRAG**（Microsoft 2024）：先建 KG，再基于图谱做 Local / Global Search。

### 2.4 与相邻概念的关系

- **RAG vs Fine-tuning**：RAG 是「外接知识」，Fine-tuning 是「内化知识」。RAG 适合「实时 / 可解释」场景，Fine-tuning 适合「风格 / 格式 / 推理能力」调整。
- **RAG vs Long Context**：长上下文 LLM 不能替代 RAG——成本高、精度低、无法溯源。RAG + 长上下文是组合。
- **RAG vs Prompt Engineering**：Prompt 是「LLM 输入模板」，RAG 是「外部知识接入」。Prompt + RAG 是组合。
- **RAG vs Tool Use**：Tool Use 是「让 LLM 调用外部 API」，RAG 是「让 LLM 查询外部知识」。Tool Use 包含 RAG，但 RAG 更轻量。
- **RAG vs Agent**：Agent 是「自主决策的智能体」，RAG 是「Agent 的工具之一」。Agent 通常包含 RAG。
- **RAG vs Search Engine**：搜索引擎返回「链接列表」，RAG 返回「自然语言答案 + 引用」。RAG 是 Search + LLM。
- **RAG vs KG QA**：KG QA 是「基于结构化知识图谱的问答」，RAG 是「基于任意知识源的问答」。GraphRAG 是两者的融合。

> 💡 **思考锚点**：把你线上 RAG 的 chunk 大小与 overlap 报出来（例如固定窗口 500 / 1000、overlap 10–20%）——当你想靠调大 Top-K 提召回时，涨的是向量召回的 Recall@K，还是要靠 Cross-Encoder 重排来补救？后者准但慢，你准备让哪一项指标先恶化来换这次召回？

---

- [§3. 设计模式与范式](05-rag-architecture-section-3-sec3.md)
- [§4. 工程实现](05-rag-architecture-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](05-rag-architecture-section-5-ai.md)
- [§6. 落地实践](05-rag-architecture-section-6-sec6.md)
- [§7. 与其他方法对比](05-rag-architecture-section-7-sec7.md)
- [§8. 面试真题集](05-rag-architecture-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](05-rag-architecture-section-3-sec3.md)
- [§4. 工程实现](05-rag-architecture-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](05-rag-architecture-section-5-ai.md)
- [§6. 落地实践](05-rag-architecture-section-6-sec6.md)
- [§7. 与其他方法对比](05-rag-architecture-section-7-sec7.md)
- [§8. 面试真题集](05-rag-architecture-section-8-sec8.md)

---
