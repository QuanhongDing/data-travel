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

**萌芽阶段（2020-2022）**：

- **2020.05**：Lewis 等人发表 RAG 原论文，奠定架构基础。
- **2020-2021**：REALM、RETRO、Atlas 等检索增强预训练模型出现。
- **2021**：Faiss / Annoy 等向量索引成熟，RAG 工程化成为可能。
- **2022.11**：ChatGPT 发布，RAG 工程化需求爆发。

**Naive RAG 阶段（2023-2024 上半年）**：

- **2023**：LangChain / LlamaIndex 爆发，Naive RAG（向量召回 + Prompt）成为 LLM 应用标配。
- **2023.10**：RAGAS 评测框架发布。
- **2024.01**：Advanced RAG（Query Rewrite / HyDE / Reranker）成为新主流。

**Advanced / Modular RAG 阶段（2024）**：

- **2024.02**：Modular RAG 论文（GAIR Lab）提出「模块化 RAG」架构。
- **2024.04**：Self-RAG 论文发表，引入「自反思」机制。
- **2024.04**：Corrective RAG（CRAG）论文发表。
- **2024.07**：Microsoft GraphRAG 开源引爆社区。

**Agentic / GraphRAG 阶段（2024 末-2025）**：

- **2024 Q4**：Agentic RAG（智能体驱动的多步检索）成为新前沿。
- **2025**：GraphRAG 与 Hybrid RAG 工业化，Neo4j 5 + Vector Index、Weaviate Hybrid Search 普及。
- **2025**：RAG 评估体系成熟（RAGAS、TruLens、ARES、DeepEval）。

**一句话总结**：**RAG 从「学术论文」→「LangChain 玩具」→「向量召回 + Prompt」→「模块化 RAG」→「Agentic + GraphRAG」五阶段演进，2025 年是其工业化落地的元年。**

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
4. **Self-RAG**（2024）：LLM 在生成中插入 `[Retrieve]` `[IsRel]` `[IsSup]` `[IsUse]` 反思 token。
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

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Naive RAG**

最简单的「向量召回 + Prompt」架构：

```
[Question] → [Embedding] → [Vector Search Top-K] → [Prompt] → [LLM] → [Answer]
```

- 优点：实现简单、10 行代码搞定。
- 缺点：召回率低、上下文噪声大、无溯源。
- 适用：PoC / Demo / 小规模验证。

**模式 2：Advanced RAG（Pre-Retrieval + Post-Retrieval 优化）**

```
                                          ┌─→ [Rerank] ─┐
[Question] → [Query Rewrite] → [Vector Search] ─┤            ├→ [Compress] → [LLM] → [Answer]
                                          └─→ [BM25] ─────┘
```

- Pre-Retrieval：Query Rewrite、HyDE、Step-Back Prompting。
- Post-Retrieval：Rerank、Context Compression、Lost-in-the-Middle 缓解。
- 优点：召回率提升 20-50%。
- 缺点：链路复杂度增加。
- 适用：生产级 RAG。

**模式 3：Modular RAG**

把 RAG 拆成可插拔模块：

```
[模块1：Query Understanding] → [模块2：Retrieval] → [模块3：Rerank] → [模块4：Generation] → [模块5：Evaluation]
```

- 优点：每模块可独立优化 / 替换。
- 缺点：架构复杂、需要平台支持。
- 适用：企业级 RAG 平台。

**模式 4：Self-RAG**

LLM 在生成中插入反思 token：

```
[Generate token] → [Need Retrieval?] → yes → [Retrieve] → [Is Relevant?] → no → drop / yes → keep → [Continue Generation] → [Is Supported?] → [Is Useful?]
```

- 优点：自适应检索、可解释。
- 缺点：需要训练或特殊 prompt。
- 适用：高准确性场景。

**模式 5：Corrective RAG（CRAG）**

对检索结果做可信度评估：

```
[Retrieve] → [Confidence Evaluator] → high → [Use Directly]
                                       medium → [Refine]
                                       low → [Web Search Fallback]
```

- 优点：缓解「检索失败」问题。
- 缺点：需要额外的 evaluator。
- 适用：知识更新快 / 容错要求高。

**模式 6：Agentic RAG**

智能体决策检索路径：

```
[Question] → [Agent] → [决定查 KG / 向量 / SQL / Web] → [调用工具] → [整合结果] → [生成答案]
```

- 优点：灵活、可扩展、可处理复杂问题。
- 缺点：复杂度高、成本高、可观测性难。
- 适用：复杂业务问题、企业知识助手。

**模式 7：GraphRAG**

先建 KG，再基于图谱检索：

```
[Documents] → [LLM 抽取 KG] → [Leiden 社区检测] → [Community Summary]
                                                       ↓
[Question] → [Local Search（基于实体）| Global Search（基于社区）] → [Answer]
```

- 优点：擅长「宏观问题」「跨文档推理」。
- 缺点：抽取成本高、KG 质量依赖 LLM。
- 适用：研究报告、复杂知识问答。

**模式 8：Hybrid RAG（三路召回）**

向量 + 关键词 + KG 三路召回 + RRF 融合：

```
[Question] ─┬─→ [Vector Search]   ─┐
            ├─→ [BM25 Search]     ─┼─→ [RRF 融合] → [Rerank] → [LLM]
            └─→ [KG Traversal]     ─┘
```

- 优点：兼顾语义 / 精确 / 关系。
- 缺点：实现复杂。
- 适用：企业级知识中台。

### 3.2 适用场景决策表

| 场景特征 | 推荐模式 | 理由 |
| --- | --- | --- |
| PoC / Demo / < 1000 文档 | Naive RAG | 快速验证 |
| 生产级 / 中等规模 | Advanced RAG | 性价比最优 |
| 企业级平台 / 多业务线 | Modular RAG | 可演进 |
| 高准确性 / 知识边界模糊 | Self-RAG / CRAG | 容忍延迟换准确 |
| 复杂多跳问题 / Agent | Agentic RAG | 灵活 |
| 宏观问题 / 跨文档 | GraphRAG | 擅长全局问题 |
| 多模态 / 图文混排 | Hybrid RAG + CLIP | 全模态覆盖 |
| 实时性高 / 知识频繁更新 | CRAG + Web Fallback | 兜底 |
| 中文为主 | BGE-M3 + BGE-reranker | 中文 SOTA |

### 3.3 反模式与陷阱

1. **「全部塞进 Prompt」反模式**：把整个文档库塞给 LLM，浪费 token、精度差。**必须分块 + 检索**。
2. **「Embedding 万能」反模式**：以为「好的 embedding 就够了」，忽视 query rewrite / rerank。**Advanced RAG 比好的 embedding 重要 10 倍**。
3. **「Chunking 越细越好」反模式**：chunk 太小（< 100 token）导致上下文不足。**平衡粒度与召回率**。
4. **「不用 Reranker」反模式**：直接用向量召回 Top-K 喂给 LLM。**Reranker 能让 Recall@10 提升 30-50%**。
5. **「忽视元数据过滤」反模式**：不按时间 / 部门 / 权限过滤。**必须 metadata-aware retrieval**。
6. **「Prompt 模板过于复杂」反模式**：prompt 几百行，LLM 被绕晕。**保持简洁，让 LLM 专注**。
7. **「不评估」反模式**：上线 RAG 不做评测，凭感觉调参。**必须用 RAGAS / TruLens 评测**。
8. **「盲目 GraphRAG」反模式**：所有问题都套 GraphRAG，结果又慢又差。**GraphRAG 适合宏观问题，精确事实查询直接用 SQL / Cypher**。
9. **「LLM 当真理」反模式**：用 LLM 自己验证 LLM，幻觉传播。**必须有 ground truth（人工标注 / 业务规则）**。
10. **「忽视成本」反模式**：每次 query 都用 GPT-4 + 大 embedding，成本失控。**必须分级（Haiku / Sonnet / Opus）+ 缓存 + 路由**。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：需求与边界**

- 明确「RAG 要回答什么问题、不回答什么问题」。
- 识别数据源（文档 / DB / API）。
- 评估数据规模（千级 / 百万级 / 亿级）。
- 评估准确性 / 延迟 / 成本 SLA。
- 输出：**RAG 需求说明书**。

**Step 2：数据预处理**

- 文档解析：PDF（PyMuPDF / pdfplumber）、Word（python-docx）、HTML（BeautifulSoup）、Markdown、代码（tree-sitter）。
- 文本清洗：去噪、去格式、归一化。
- 结构提取：标题层级、章节、表格、图片、公式。
- 元数据补充：作者、时间、来源、权限。
- 输出：**结构化文档语料**。

**Step 3：Chunking 设计**

- 选策略：固定窗口 / 滑动窗口 / 语义切分 / 结构感知。
- 设参数：chunk 大小（512 token）、overlap（10-20%）。
- 加 metadata：来源、章节、页码、时间戳。
- 输出：**Chunk 集合**。

**Step 4：Embedding 与索引**

- 选 embedding 模型：BGE-M3 / OpenAI text-embedding-3 / M3E。
- 选向量库：Milvus / Qdrant / Weaviate / Pinecone / pgvector。
- 选索引算法：HNSW（默认）/ IVF（大数据）/ DiskANN（超大规模）。
- 写入元数据索引（ES / Meilisearch）。
- 输出：**可检索的向量索引**。

**Step 5：检索 Pipeline**

- Query 理解：意图识别、Query Rewrite、HyDE。
- 多路召回：向量 + BM25 + KG。
- 融合：RRF / 加权融合。
- 精排：Cross-Encoder / Cohere Rerank / BGE-reranker。
- 输出：**Top-K 候选文档**。

**Step 6：上下文组装与生成**

- Prompt 模板：System + Context + Question。
- 上下文压缩：剔除冗余、保留关键。
- 引用标注：每条结论附原文出处。
- 输出：**自然语言答案 + 引用**。

**Step 7：评估与监控**

- 离线评估：RAGAS / TruLens / ARES。
- 在线监控：召回率 / 准确率 / 延迟 / 成本 / 用户反馈。
- A/B 测试：不同 prompt / 模型 / 召回策略对比。
- 输出：**评估报告 + 监控大盘**。

**Step 8：上线与迭代**

- 灰度发布：10% → 50% → 100%。
- 反馈闭环：用户「赞 / 踩」回流到评测集。
- 持续优化：每周评估 → 调参 → 上线。
- 输出：**生产级 RAG 服务**。

### 4.2 关键技术点

1. **Chunking 优化**：语义切分 + 结构感知 + overlap。LangChain `RecursiveCharacterTextSplitter` 是默认起点。
2. **Embedding 选型**：中文选 BGE-M3，英文选 OpenAI text-embedding-3，多模态选 CLIP / Qwen-VL。
3. **向量库选型**：千万级选 Milvus / Qdrant / Weaviate，亿级选 Pinecone / Vespa Serverless，PostgreSQL 用户选 pgvector。
4. **Hybrid Search**：向量 + BM25 + RRF 融合（详见 04-hybrid-search）。
5. **Reranker**：用 Cohere Rerank 3 或 BGE-reranker，效果提升 30%。
6. **Query Rewrite**：用 LLM 把口语化问题改写成检索友好查询。
7. **HyDE**：让 LLM 先写个假答案，再做检索。
8. **Contextual Compression**：剔除不相关内容，只保留关键段落。
9. **Prompt 模板**：简洁、清晰、Few-shot、引用标注。
10. **缓存**：相同 query 缓存检索结果，降低成本 50%+。
11. **路由**：简单问题用小模型，复杂问题用大模型。
12. **流式输出**：SSE 流式返回，首 token 延迟 < 500ms。
13. **评估体系**：RAGAS（自动化）+ 人工抽检（每周 50 条）+ 在线反馈。

### 4.3 工具链与平台

**LLM 框架**：

- **LangChain**（Python / JS）——主流 LLM 编排框架，2024 仍是事实标准。
- **LlamaIndex**（Python）——专注 RAG 场景，索引 / 检索器抽象最完善。
- **Haystack**（deepset）——生产级 NLP 流水线框架。
- **DSPy**（Stanford 2023-2024）——「自动 Prompt / 自动微调」RAG 框架。
- **Semantic Kernel**（Microsoft）——.NET 生态 LLM 框架。

**向量数据库**：

- **Milvus**（国产开源）——分布式向量数据库，大规模首选。
- **Qdrant**（开源）——Rust 实现，高性能向量库。
- **Weaviate**（开源）——模块化向量库，内置 Hybrid Search。
- **Pinecone**（SaaS）——Serverless 向量库，运维成本最低。
- **Vespa**（Yahoo 开源）——支持向量 + 标量 + 表达式，Hybrid 强。
- **pgvector**（PostgreSQL 扩展）——PostgreSQL 一体化方案。
- **Chroma**（开源）——轻量级向量库，适合 PoC。
- **LanceDB**（2024）——列式向量库 + DuckDB 集成。

**Rerank 服务**：

- **Cohere Rerank 3**（商业）——多语言 SOTA。
- **BGE-reranker**（BAAI 开源）——中文首选。
- **Jina Rerank**（商业）——多语言。
- **ColBERT / ColBERTv2**（学术）——晚交互。
- **Self-hosted Cross-Encoder**——完全自托管。

**RAG 评估框架**：

- **RAGAS**（开源）——RAG 专用评估框架。
- **TruLens**（开源）——LLM 应用评估。
- **DeepEval**（开源）——LLM 评估。
- **ARES**（Stanford 2024）——自动化 RAG 评估。
- **LangSmith**（LangChain）——端到端调试 + 评估。
- **LangFuse**（开源）——LLM 工程化平台。

**GraphRAG 工具**：

- **Microsoft GraphRAG**（2024 开源）——KG + RAG 工业级。
- **Neo4j LLM Knowledge Graph Builder**（2024）——自然语言建 KG。
- **LightRAG**（2024-2025）——轻量 GraphRAG。
- **HippoRAG**（2024）——类脑 KG + RAG。

**生产级 RAG 平台**：

- **Vectara**（商业）——企业级 RAG 平台。
- **Glean**（商业）——企业搜索 + RAG。
- **Hebbia**（商业）——金融 RAG。
- **Quivr**（开源）——个人 RAG。

### 4.4 代码 / 示例

**示例 1：Naive RAG（LangChain + Milvus）**

```python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Milvus
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader

# 1. 加载文档
loader = PyPDFLoader("company_handbook.pdf")
docs = loader.load()

# 2. Chunking
splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=64)
chunks = splitter.split_documents(docs)

# 3. Embedding & 入库
embedding = OpenAIEmbeddings(model="text-embedding-3-large")
vectorstore = Milvus.from_documents(chunks, embedding, connection_args={"host": "milvus", "port": 19530})

# 4. RAG 问答
llm = ChatOpenAI(model="gpt-4o", temperature=0)
qa = RetrievalQA.from_chain_type(llm, retriever=vectorstore.as_retriever(search_kwargs={"k": 5}))
result = qa.invoke("公司年假政策是什么？")
print(result["result"])
```

**示例 2：Advanced RAG（Query Rewrite + Rerank + Hybrid）**

```python
from langchain.retrievers import BM25Retriever, EnsembleRetriever
from langchain.retrievers.document_compressors import CohereRerank
from langchain.retrievers import ContextualCompressionRetriever

# 1. 双路召回（向量 + BM25）
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
bm25_retriever = BM25Retriever.from_documents(chunks)
bm25_retriever.k = 10
ensemble_retriever = EnsembleRetriever(retrievers=[vector_retriever, bm25_retriever], weights=[0.6, 0.4])

# 2. Rerank
compressor = CohereRerank(model="rerank-english-v3.0", top_n=5)
compression_retriever = ContextualCompressionRetriever(base_compressor=compressor, base_retriever=ensemble_retriever)

# 3. Query Rewrite
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

rewrite_prompt = PromptTemplate.from_template("""
请把以下问题改写成更适合检索的形式，保持语义不变：
原问题：{question}
改写：
""")
rewrite_chain = LLMChain(llm=llm, prompt=rewrite_prompt)
rewritten = rewrite_chain.invoke({"question": "年假"})["text"]
results = compression_retriever.get_relevant_documents(rewritten)
```

**示例 3：Agentic RAG（LangGraph）**

```python
from langgraph.graph import StateGraph, END
from langchain.tools import tool

@tool
def search_knowledge_base(query: str) -> str:
    """从企业知识库检索信息"""
    results = compression_retriever.get_relevant_documents(query)
    return "\n\n".join([doc.page_content for doc in results])

@tool
def query_database(sql: str) -> str:
    """查询企业数据库"""
    # 执行 SQL
    return "数据库查询结果"

@tool
def search_web(query: str) -> str:
    """当知识库无答案时搜索 Web"""
    # 调用 Web 搜索
    return "Web 搜索结果"

# 构建 Agentic RAG
from langgraph.prebuilt import create_react_agent
agent = create_react_agent(llm, tools=[search_knowledge_base, query_database, search_web])
result = agent.invoke({"messages": [{"role": "user", "content": "Q3 营收是多少？"}]})
```

**示例 4：RAGAS 评估**

```python
from ragas import evaluate
from ragas.metrics import context_relevance, faithfulness, answer_relevancy
from datasets import Dataset

# 准备评估数据
eval_data = {
    "question": ["年假政策是什么？", "试用期多久？"],
    "contexts": [["年假 10-15 天..."], ["试用期 3-6 个月..."]],
    "answer": ["根据公司手册，年假为 10-15 天...", "试用期为 3-6 个月..."],
    "ground_truth": ["10-15 天", "3-6 个月"]
}
dataset = Dataset.from_dict(eval_data)

# 评估
result = evaluate(dataset, metrics=[context_relevance, faithfulness, answer_relevancy])
print(result)
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：Modular → Agentic**

RAG 从「固定流水线」演进为「智能体决策」：

- 智能体自主决定「检索什么 / 调用什么工具」。
- 多轮检索 + 多步推理。
- 与 Tool Use 深度集成（Agent 内部循环）。

**方向 2：GraphRAG 工业化**

Microsoft GraphRAG（2024）引爆社区：

- 文档 → KG → 社区检测 → 摘要 → RAG。
- 擅长「宏观问题」「跨文档推理」。
- 2025 年出现 LightRAG、HippoRAG 等改进。

**方向 3：Self-RAG / CRAG 反思机制**

LLM 在生成中主动评估：

- Self-RAG：插入 `[Retrieve]` `[IsRel]` `[IsSup]` 反思 token。
- CRAG：检索后做可信度评估，不行就 Web fallback。
- FLARE（2023）：基于 LLM 置信度的主动重检索。

**方向 4：多模态 RAG**

图像 / 视频 / 音频 / 表格的检索增强：

- **图像 RAG**：CLIP / Qwen-VL 嵌入图像，向量检索图片。
- **视频 RAG**：视频抽帧 → CLIP → 帧向量检索。
- **音频 RAG**：Whisper 转文字 → 文本检索；或直接用音频嵌入。
- **表格 RAG**：Table-to-Text + 检索，或 SQL 查询。
- **PDF 多模态**：ColPali（2024）直接对 PDF 页面做多模态检索。

**方向 5：RAG + Fine-tuning 协同**

RAG 不能解决所有问题，组合方案：

- **RAFT**（2024）：RAG + 微调，让模型学会「何时忽略检索结果」。
- **Self-RAG 微调**：训练模型生成反思 token。
- **RA-DIT**（2024）：检索增强指令微调。

**方向 6：实时 RAG / 流式 RAG**

- 流式文档更新（Kafka → Embedding → 向量库）。
- 实时召回（Vector DB 毫秒级响应）。
- 长上下文 + 实时 RAG 组合。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**Vector RAG 的局限**：

- 相似度 ≠ 正确性。
- 无法处理精确匹配（型号、ID、日期）。
- 无法做多跳推理。
- 无法保证时效性。

**Hybrid RAG（三路召回）**：

```
[Vector Recall] ─┐
[BM25 Recall]  ─┼─→ [RRF 融合] → [Rerank] → [LLM]
[KG Recall]    ─┘
```

- 向量：语义近邻。
- BM25：精确关键词 / 实体。
- KG：关系推理 / 多跳。
- 融合：RRF（Cormack 2009）已是事实标准。

**GraphRAG 的崛起**：

Microsoft GraphRAG 是 2024 年最显著的进展：

- 文档 → LLM 抽 KG → Leiden 社区检测 → 社区摘要 → Local / Global Search。
- 适合「公司战略是什么」「所有项目进展」类宏观问题。
- 2025 年出现 LightRAG（轻量版）、HippoRAG（类脑版）。

**Agentic RAG 的成熟**：

- 2024 末：Agentic RAG 进入工业级。
- 2025：智能体框架（LangGraph、AutoGen、CrewAI）+ RAG 成为标配。

**Long Context RAG**：

- Gemini 1.5（1M-2M token）、Claude 3.5（200K）。
- 把整个文档库塞进 prompt，配合检索提升精度。
- 成本仍是瓶颈，需要分级使用。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **Self-RAG**（ICLR 2024）——反思 token + 训练。
- **CRAG**（ICLR 2024）——可校正 RAG。
- **GraphRAG**（Microsoft 2024）——KG + RAG 工业级。
- **Modular RAG**（GAIR Lab 2024）——模块化架构。
- **RAFT**（2024）——RAG + 微调。
- **HippoRAG**（2024）——类海马体 RAG。
- **LightRAG**（2024）——轻量 GraphRAG。
- **ColPali**（2024）——多模态文档检索。
- **RAGAS**（2024）——RAG 评估框架成熟。

**工业进展**：

- **LangChain 0.2+**（2024）——LangGraph 成为 Agent 框架。
- **LlamaIndex Workflows**（2024）——事件驱动的 RAG 框架。
- **OpenAI Assistants API + File Search**（2024）——内置 RAG。
- **Anthropic Claude + Tool Use + RAG**（2024-2025）——Agent + RAG 范例。
- **Google Vertex AI Search**（2024）——企业级 RAG。
- **阿里云百炼 + RAG**（2024）——国内 RAG 平台。
- **百度千帆 + RAG**（2024）——国内 RAG 平台。
- **腾讯混元 + RAG**（2024）——国内 RAG 平台。

### 5.4 未来 3-5 年趋势

1. **Agentic RAG 成为标配**：RAG 不再是「固定 pipeline」，而是 Agent 的核心工具。
2. **GraphRAG 工业化**：每个企业级 RAG 平台都会包含 KG 组件。
3. **多模态 RAG 主流化**：图像 / 视频 / 音频的检索增强成为标配。
4. **RAG 评估标准化**：RAGAS、TruLens 成为事实标准。
5. **RAG + Fine-tuning 协同**：单一方案难以解决复杂问题，组合方案是未来。
6. **长上下文 + RAG**：长上下文模型降低部分 RAG 需求，但精度仍需 RAG 补足。
7. **Self-improving RAG**：RAG 系统自主学习用户反馈，自动优化。
8. **隐私 + 合规**：本地化 RAG（Ollama + 本地向量库）成为合规首选。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：某股份制银行客服 RAG**

- 背景：客服人员每天回答 10 万 + 客户问题，FAQ 库 5000+ 条，但仍有 60% 问题答非所问。
- 方案：构建 RAG 客服助手，FAQ + 历史工单 + 政策文档三路召回。
- 工具：LangChain + Milvus + BGE-reranker + GPT-4o + RAGAS。
- 结果：一次解决率从 40% 提升到 75%，平均处理时间从 5 分钟降至 1.5 分钟。

**案例 2：某车企技术手册 RAG**

- 背景：4S 店技师需要查询 10000+ 页技术手册，原 PDF 检索体验差。
- 方案：多模态 RAG（PDF 页面 + 图像 + 表格 + 文本统一嵌入）。
- 工具：ColPali + Qwen-VL + Weaviate + Claude 3.5。
- 结果：故障诊断准确率提升 40%，平均查询时间从 10 分钟降至 1 分钟。

**案例 3：某律所法律研究 RAG**

- 背景：律师研究案例、法规、判决书耗时严重。
- 方案：GraphRAG（判例 → KG → 社区检测）+ 向量 RAG。
- 工具：Microsoft GraphRAG + Neo4j + GPT-4o + Cohere Rerank 3。
- 结果：研究效率提升 5 倍，引用准确性提升 30%。

**案例 4：某电商客服 + 推荐 RAG**

- 背景：客服需要同时回答问题 + 推荐商品，传统 RAG 做不到。
- 方案：Agentic RAG（KG 查商品关系 + 向量召回评论 + 实时库存 SQL）。
- 工具：LangGraph + Milvus + Neo4j + GPT-4o + Function Calling。
- 结果：客服转化率提升 25%，推荐 CTR 提升 18%。

### 6.2 踩坑与经验

**坑 1：Chunking 不合理**

- 现象：按段落切分导致 chunk 大小不均（几十到几千 token）。
- 解法：固定窗口 + overlap（推荐 512 token / 64 overlap），结构感知优先。

**坑 2：Embedding 选错**

- 现象：英文 embedding 跑中文场景，效果差。
- 解法：中文选 BGE-M3 / M3E，英文选 OpenAI text-embedding-3-large。

**坑 3：不加 Reranker**

- 现象：直接向量召回 Top-K 喂给 LLM，答案不准确。
- 解法：加 BGE-reranker 或 Cohere Rerank 3，效果提升 30%。

**坑 4：忽视元数据**

- 现象：检索到「过期文档」「错部门文档」「无权限文档」。
- 解法：metadata-aware retrieval，按时间 / 部门 / 权限过滤。

**坑 5：Prompt 太复杂**

- 现象：prompt 几百行，LLM 被绕晕，答案质量下降。
- 解法：保持简洁（System 100 行内），让 LLM 专注。

**坑 6：不评估**

- 现象：上线 RAG 后「凭感觉」调参，效果不稳定。
- 解法：建立 RAGAS + 人工抽检 + 在线反馈的三层评估体系。

**坑 7：GraphRAG 滥用**

- 现象：所有问题都套 GraphRAG，又慢又贵又差。
- 解法：根据问题类型选方案（精确事实 → SQL/Cypher、宏观问题 → GraphRAG、相似度 → Vector RAG）。

**坑 8：忽视成本**

- 现象：每次 query 都用 GPT-4 + 大 embedding，月底账单爆炸。
- 解法：分级（Haiku / Sonnet / Opus）、缓存、query 复杂度路由。

**坑 9：忽视安全**

- 现象：用户问「竞品价格」，RAG 直接吐出内部机密文档。
- 解法：检索前加权限过滤、生成后加输出审计。

**坑 10：LLM 幻觉兜底不足**

- 现象：检索不到时 LLM 胡编答案，用户信以为真。
- 解法：CRAG + 「答不上就说不知道」+ 引用标注。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（PoC 阶段，1-2 周）**：

1. 选 1 个高频业务问题（FAQ / 内部问答）。
2. 准备 100-1000 份样本文档。
3. Naive RAG（LangChain + OpenAI + Chroma）。
4. 验证基本可行（用户反馈 70%+ 满意）。

**1→10（生产化，1-3 个月）**：

1. 升级到 Advanced RAG（Query Rewrite + Reranker）。
2. 引入元数据过滤（时间 / 权限）。
3. 引入 RAGAS 离线评估。
4. 引入缓存 + 路由（成本控制）。
5. 灰度发布，收集反馈。

**10→100（企业级，3-12 个月）**：

1. 升级到 Modular / Agentic RAG。
2. 引入 GraphRAG / Hybrid RAG（KG + 向量 + BM25）。
3. 多模态 RAG（图像 / 视频 / 表格）。
4. 端到端评估 + A/B 测试平台。
5. 反馈闭环（用户反馈回流到评测集）。
6. 跨业务线复制。

### 6.4 ROI 评估

**直接收益**：

- 客服 / 销售效率提升 30-50%。
- 研究 / 检索时间降低 50-80%。
- 错误率降低 20-40%。

**间接收益**：

- 知识沉淀（企业内部知识不再流失）。
- 决策可解释（每条结论有引用）。
- 合规风险降低（可审计）。
- AI 应用门槛降低（业务人员自助问答）。

**评估指标**：

- **召回率**：Top-K 命中正确答案的比例（目标 > 90%）。
- **准确率**：答案正确的比例（目标 > 85%）。
- **引用准确率**：引用与答案相符的比例（目标 > 95%）。
- **延迟**：P95 < 2 秒。
- **成本**：每次 query < 0.1 元。
- **用户满意度**：NPS > 50。
- **一次解决率**：> 70%。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Fine-tuning | Prompt Engineering | Naive RAG | Advanced RAG | GraphRAG | Agentic RAG |
| --- | --- | --- | --- | --- | --- | --- |
| 知识更新 | 1 | 4 | **5** | **5** | **5** | **5** |
| 可解释性 | 2 | 3 | 4 | 4 | **5** | 4 |
| 私有数据 | 4 | 2 | **5** | **5** | **5** | **5** |
| 实施成本 | 2 | 5 | 4 | 3 | 2 | 2 |
| 准确率 | 4 | 2 | 3 | 4 | 4 | **5** |
| 长尾覆盖 | 2 | 2 | **5** | **5** | **5** | **5** |
| 多模态 | 3 | 2 | 3 | 3 | 2 | 4 |
| 工程复杂度 | 3 | 5 | 4 | 3 | 2 | 1 |
| 实时性 | 2 | 4 | **5** | **5** | 4 | 4 |
| 适用规模 | 中 | 小 | 中 | 大 | 大 | 大 |

**结论**：

- **RAG 在「知识更新、可解释性、私有数据、长尾覆盖」4 项满分。
- **Agentic RAG / GraphRAG 是 2025 年最前沿，但工程复杂度高。
- **Fine-tuning 不擅长「实时知识」但擅长「风格 / 格式 / 推理能力」。

### 7.2 决策树

```
[你需要让 LLM 回答企业私有知识吗？]
   │
   ├── 否 → 直接用通用 LLM
   │
   ├── 是 → [知识需要实时更新吗？]
   │          │
   │          ├── 否 → Fine-tuning（但需重训）
   │          │
   │          └── 是 → RAG ★
   │                  │
   │                  ├── [问题复杂度？]
   │                  │    │
   │                  │    ├── 简单 FAQ → Naive RAG
   │                  │    │
   │                  │    ├── 中等复杂 → Advanced RAG
   │                  │    │
   │                  │    ├── 多跳 / 宏观 → GraphRAG ★
   │                  │    │
   │                  │    └── 复杂业务 → Agentic RAG ★
   │                  │
   │                  └── [数据规模？]
   │                       │
   │                       ├── < 10 万 → Chroma / FAISS
   │                       ├── < 1000 万 → Milvus / Qdrant / Weaviate
   │                       └── > 1 亿 → Pinecone / Vespa / Milvus 集群
   │
   └── [你接受复杂工程？]
          │
          ├── 否 → Advanced RAG
          └── 是 → Agentic RAG / GraphRAG ★
```

### 7.3 组合使用

**组合 1：RAG + Fine-tuning（RAFT）**

- Fine-tuning 让模型学会「RAG 模式」「格式输出」。
- RAG 提供「实时事实」。
- 适用：客服、垂直领域。

**组合 2：RAG + KG（GraphRAG）**

- RAG 负责「语义近邻」。
- KG 负责「关系推理 / 多跳」。
- 适用：研究报告、企业知识中台。

**组合 3：RAG + Agent（Agentic RAG）**

- Agent 决定「检索什么 / 调用什么工具」。
- RAG 是「Agent 的工具之一」。
- 适用：复杂业务问题、跨系统查询。

**组合 4：Vector + BM25 + KG（Hybrid RAG）**

- 向量：语义近邻。
- BM25：精确匹配。
- KG：关系推理。
- RRF 融合。
- 适用：企业级知识中台。

**组合 5：RAG + Long Context**

- 长上下文模型降低部分 RAG 需求。
- RAG 提升精度（定位关键信息）。
- 适用：长文档分析、研究报告。

---

## 8. 面试真题集

> 本节围绕本章节自身主题「RAG 架构（Retrieval-Augmented Generation Architecture）」自编 7 道面试题，覆盖 RAG 端到端链路上最容易被面试官追问的工程决策点：范式选型、Chunking、Embedding、混合检索、Reranker、Agentic / GraphRAG、评估与监控。
>
> **每题按五段式作答**：考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料。参考答案优先引用**头部互联网企业的公开架构实践**（Meta / Microsoft / OpenAI / Anthropic / Databricks / Snowflake / Uber / Netflix / 阿里 / 字节 等），便于读者进一步溯源。

### 8.1 全景视图

| 主题号 | 主题 | 题号范围 | 收录题数 |
| --- | --- | --- | :---: |
| §5.1 | RAG 范式演进与端到端架构 | §5.1.1 | 1 |
| §5.2 | Chunking 与文档预处理 | §5.2.1 | 1 |
| §5.3 | Embedding 与向量化选型 | §5.3.1 | 1 |
| §5.4 | 混合检索与多路召回融合 | §5.4.1 | 1 |
| §5.5 | Reranker 与上下文压缩 | §5.5.1 | 1 |
| §5.6 | Agentic RAG 与 GraphRAG | §5.6.1 | 1 |
| §5.7 | RAG 评估与线上监控 | §5.7.1 | 1 |

| 题号 | 难度 |
| --- | :---: |
| §5.1.1 | ★★★☆☆ |
| §5.2.1 | ★★★★☆ |
| §5.3.1 | ★★★☆☆ |
| §5.4.1 | ★★★★☆ |
| §5.5.1 | ★★★★☆ |
| §5.6.1 | ★★★★★ |
| §5.7.1 | ★★★★☆ |

### 8.2 §5.1 RAG 范式演进与端到端架构

> 本主题考察「RAG 的全景图」：候选人能否从 LLM 的三大缺陷（知识截止 / 幻觉 / 不可溯源）出发，说清 RAG 端到端链路的每一段（清洗 → 切分 → 嵌入 → 索引 → 召回 → 精排 → 压缩 → 生成 → 评估），并能横向比较 Naive / Advanced / Modular / Agentic 四种范式的适用场景与代价。

#### §5.1.1 请系统阐述 RAG（Retrieval-Augmented Generation，检索增强生成）的端到端架构，并对比 Naive RAG、Advanced RAG、Modular RAG、Agentic RAG 四种范式的核心差异、适用场景与各自的工程代价。

**1. 考察点**

- 是否理解 RAG 不是「LLM + 向量库」两段式，而是一条**端到端流水线**：文档解析 → 清洗 → Chunking → Embedding → 索引 → Query 理解 → 多路召回 → 融合 → Rerank → 上下文压缩 → Prompt 装配 → 引用标注 → LLM 生成 → 评估反馈，每一段都有独立决策。
- 能否从「LLM 的三大缺陷」（知识截止、幻觉、不可溯源）反推 RAG 解决的是什么问题，而不是把 RAG 当成万能银弹。
- 能否说出 Naive / Advanced / Modular / Agentic 的**递进关系**——后一范式是为了修补前一范式的具体缺陷而出现，而不是平行的"四选一"。
- 加分项：能给出每种范式下「线上召回率 / 延迟 / 成本 / 维护复杂度」的具体经验值。

**2. 参考答案框架**

**第一层：先定义 RAG 端到端链路的八段。** 一条生产级 RAG 流水线至少包含八个阶段，每个阶段都有独立的工程决策：

1. **文档解析与清洗（Ingest）**：PDF（PyMuPDF / pdfplumber / ColPali）、Word（python-docx）、代码（tree-sitter）、表格（Camelot）、图像（多模态 Embedding）。坑点是 PDF 解析丢格式、扫描件 OCR 错字、表格行列错位。
2. **Chunking**：固定窗口、滑动窗口、语义切分、结构感知切分。
3. **Embedding**：选模型、维度、归一化策略。
4. **索引写入**：向量库（HNSW / IVF / DiskANN）+ 元数据索引（ES / Meilisearch）。
5. **Query 理解**：意图识别、Query Rewrite、HyDE、Step-Back Prompting。
6. **多路召回**：向量 + BM25 + KG + 标量过滤 + 权限过滤。
7. **融合 + Rerank + 压缩**：RRF 融合 → Cross-Encoder Rerank → Contextual Compression。
8. **生成 + 引用 + 评估**：Prompt 装配、引用标注、RAGAS 离线评估、用户反馈回流。

漏掉任何一段，召回率或准确性都会塌方。Meta 在 2020 年那篇 RAG 原论文里只规定了「检索 + 生成」两段，工业落地必须在中间补齐其余六段。

**第二层：四种范式的递进关系。**

- **Naive RAG（2022-2023 上半年）**：Question → Embedding → 向量召回 Top-K → Prompt → LLM。代表是早期 LangChain 的 `RetrievalQA`。**优点**：10 行代码即可跑通，PoC 友好。**缺点**：召回率低（向量召回 + 没有任何改写 / 精排，Recall@10 通常 50%-70%）、上下文噪声大（Top-K 里有大量弱相关 chunk 污染 prompt）、无溯源（prompt 里没有强制引用标注）。**适用场景**：PoC / Demo / 文档量 < 1 万 / 容忍 30% 答非所问。

- **Advanced RAG（2023 下半年至 2024）**：在 Naive 之上加入 Pre-Retrieval 优化（Query Rewrite / HyDE / Step-Back）和 Post-Retrieval 优化（Rerank / Contextual Compression / Lost-in-the-Middle 缓解）。**核心收益**：召回率通常从 60% 提升到 80%+。**缺点**：链路复杂度显著增加——Query Rewrite 多一次 LLM 调用、Reranker 多一次 Cross-Encoder、整体延迟从 1 秒拉到 3-5 秒。**适用场景**：生产级 RAG、企业知识问答。**工业实践**：OpenAI Assistants API 的 File Search（2024）、阿里云百炼 RAG、字节火山方舟 RAG 都走 Advanced 路线。

- **Modular RAG（GAIR Lab 2024）**：把流水线拆成可插拔模块（Indexing / Retrieval / Reranking / Generation / Evaluation / Feedback），每模块独立优化。代表论文是 Gao 等人 2024 年发表的《Modular RAG: Transforming RAG Systems into LEGO-like Reconfigurable Frameworks》。**优点**：可演进、可观测、可 A/B 测试单一模块。**缺点**：架构复杂、需要平台投入。**适用场景**：企业级 RAG 平台、多业务线共享底座。

- **Agentic RAG（2024 末-2025）**：由 LLM 智能体自主决定「查什么 / 何时查 / 怎么组合」，可能调用多种工具（RAG / SQL / Web Search / Function Call）。代表实现是 LangGraph、AutoGen、CrewAI 上的 Agentic RAG 工作流。**优点**：能处理多跳推理、跨系统查询、复杂业务问题；可以「检索 → 判断 → 再检索」。**缺点**：单次 query 可能触发 5-10 次 LLM 调用，成本陡增；可观测性差（Agent 的决策路径难以复现）；错误会沿决策链传播。**适用场景**：复杂业务问答、研究助手、企业 Copilot。**工业落地**：Anthropic Claude + Tool Use、阿里通义晓蜜 Agent、字节扣子（Coze）都内置 Agentic RAG。

**第三层：范式不是「四选一」，而是「叠加演进」。** 真实生产几乎一定是**混合范式**——Modular 是底座（模块化），Advanced 是默认（Query Rewrite + Rerank），Agentic 覆盖复杂路径（多跳 / 跨系统）。Microservices 思路同样适用于 RAG：单一职责模块 + 编排层 + 评估层。

**第四层：范式选择的判断维度。**

| 维度 | Naive | Advanced | Modular | Agentic |
| --- | --- | --- | --- | --- |
| 上线周期 | 1-2 周 | 1-3 月 | 3-6 月 | 6-12 月 |
| 工程复杂度 | 低 | 中 | 中-高 | 高 |
| 单次 query 成本 | $0.001-0.005 | $0.01-0.05 | $0.01-0.05 | $0.1-1.0 |
| 召回率（经验） | 50-70% | 80-90% | 80-90% | 85-95% |
| 适用文档量 | < 10K | 10K-10M | 10K-10M | 任意 |
| 适用问题类型 | FAQ / 单跳 | 多跳 / 中等复杂 | 多业务线 | 跨系统 / 复杂决策 |
| 典型落地 | Demo | 生产知识库 | 企业 RAG 平台 | Copilot / Agent 产品 |

**第五层：成本与取舍。** Agentic RAG 的成本可以是 Advanced RAG 的 10-20 倍，但召回率天花板也更高。**健康做法**是默认走 Advanced，仅在需要时才升级到 Agentic——这是 LangChain 0.2+ 的 LangGraph 与 LlamaIndex Workflows 共同倡导的「按需编排」思路。

**3. 常见陷阱**

- **把 RAG 等同于「向量召回 + LLM」。** 这是最常见的误解，漏掉了 Chunking / Embedding / Rerank / 评估四段，注定召回率上不去。
- **只背范式不讲链路。** 面试官真正想听的是「你这条端到端里哪一段是你调的、效果怎么验证」——讲清具体一段比背四种范式更有说服力。
- **混淆 Naive vs Advanced。** 很多候选人以为加了 Reranker 就是 Advanced——其实 Advanced 的关键是 Pre-Retrieval + Post-Retrieval 的组合优化，单纯加 Rerank 只是 Half-Advanced。
- **忽略 Modular 的「平台价值」。** Modular 不是为了炫技，而是为了「让多个业务线共享同一套 RAG 平台而不互相干扰」——这是企业级落地的核心诉求。
- **把 Agentic 当成万能解。** Agentic 在多跳 / 跨系统场景下极强，但在简单 FAQ 场景下反而引入不稳定性。**永远从最简单的范式开始，按需升级**。
- **不区分「PoC 友好」与「生产友好」。** Naive RAG 在 PoC 阶段可以跑通，但直接上线到生产会带来 30-50% 的答非所问率——这不是工程调优能弥补的，必须升级范式。

**4. 追问预测**

- **「线上召回率只有 60%，你怎么定位是哪一段的瓶颈？」** 答：分层定位——① 召回层用 Recall@K 看向量召回是否命中（如果 Recall@10 < 60%，问题在 Chunking / Embedding / 索引）；② Rerank 后看 Rerank Recall@5 是否回升（如果回升不明显，问题在 Reranker 模型或 query 改写）；③ 端到端 Faithfulness 看 LLM 是否被噪声干扰（如果上下文正确但答错，问题在 Prompt 或上下文长度）。
- **「Naive RAG 上线后用户投诉答非所问，第一步做什么？」** 答：先看 RAGAS 评估——`context_relevance`（召回的 chunk 是否真的相关）+ `faithfulness`（答案是否忠实于召回的 chunk）。如果 `context_relevance` 低，加 Reranker；如果是 `faithfulness` 低，做 Contextual Compression 或调 Prompt。
- **「Modular RAG 的模块边界怎么划？」** 答：按「独立可优化、可替换」的原则——索引模块（可换向量库）、检索模块（可换召回策略）、Rerank 模块（可换 Reranker）、评估模块（可换评估指标集）。关键是让每个模块有独立输入 / 输出契约，能独立 A/B。
- **「Agentic RAG 的成本怎么压？」** 答：四招——① 用小模型做「是否需要进一步检索」的路由判断（Haiku / GPT-4o-mini），仅在必要时调用大模型；② 缓存中间结果（相同子查询复用）；④ 限制最大迭代次数（通常 3-5 步）；④ 用 DSPy 优化 prompt / 模型路由。

**5. 参考资料**

- Patrick Lewis 等人（Meta AI / Facebook Research）2020 年发表于 NeurIPS 的论文《Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks》——RAG 范式的原始定义，含「端到端检索 + 生成」的最早系统性论证。
- Yunfan Gao 等人（复旦大学 GAIR Lab）2024 年发表的《Modular RAG: Transforming RAG Systems into LEGO-like Reconfigurable Frameworks》——Modular RAG 的范式划分与模块边界。
- LangChain 官方文档关于 LangGraph 与 Agentic RAG 的章节（2024-2025）——LangGraph 是当前 Agentic RAG 工程化的事实标准框架之一。
- Anthropic 关于 Claude + Tool Use + RAG 的官方文档（2024-2025）——头部 LLM 厂商对 Agentic RAG 落地范式的官方表述。
- 阿里云百炼 RAG 平台公开文档（2024）——国内云厂商对 RAG 四范式的工程落地总结，对应「PoC → Advanced → Modular → Agentic」的演进路径。
- **招商银行的「智能问答助手」** —— 银行业内部知识库从 Naive RAG 演进到 Modular RAG 的工业实践，覆盖产品手册 / 业务制度 / 监管文件多源异构知识。
- **米哈游的「游戏内智能 NPC 对话」** —— 原神 / 崩坏系列基于 RAG + LLM 的 NPC 自由对话系统，处理剧情与世界观一致性，属于典型 Modular RAG 工程化落地。
- **京东的「京言」智能客服** —— 电商场景 RAG 应用，覆盖商品知识 + 售后政策 + 用户手册的多路召回整合，是国内头部电商 RAG 工程实践之一。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

### 8.3 §5.2 Chunking 与文档预处理

> 本主题考察「文档侧工程」：候选人能否在 Chunking 策略、文档解析、元数据补充上做出有依据的决策——这些决策决定了召回层的下界。

#### §5.2.1 在 RAG 系统中，文档切分（Chunking）策略对召回效果影响巨大。请系统说明常见的 Chunking 策略、固定窗口与语义切分的取舍、以及如何评估 Chunking 的好坏，并结合多模态文档（PDF / Word / 代码 / 表格）给出选型建议。

**1. 考察点**

- 是否理解 Chunking 的**本质约束**是「**召回粒度**」与「**语义完整度**」的折中——粒度太细，召回命中但上下文不足；粒度太粗，召回噪声大。
- 能否区分**字符 / Token 切分**、**句子切分**、**语义切分**、**结构感知切分**四类策略的适用场景。
- 是否知道 Chunking 不是孤立决策，而是和**Embedding 模型、Retrieval 策略、Prompt 模板**强耦合——比如语义切分依赖 Embedding 模型质量，结构感知切分依赖文档解析质量。
- 加分项：能给出具体的 Chunk Size / Overlap 经验值（中文 512 token / overlap 10-20%），并能解释为什么是这个数量级。

**2. 参考答案框架**

**第一层：Chunking 的本质约束。** Chunking 决定的是**召回的最小语义单元**——这个单元太小（< 100 token），召回命中后 LLM 拿到的上下文不足以回答；这个单元太大（> 2000 token），召回时向量相似度被平均化、且占满 LLM 上下文窗口。LangChain 官方推荐的 512 token / 64 overlap 是一个起点，但需要根据 Embedding 模型与文档类型调整——BGE-M3 训练时的最大长度是 8192 token，但实际语义向量在 512 token 附近最稳定。

**第二层：六类 Chunking 策略对比。**

- **固定窗口（Fixed Window）**：按 token 数硬切。优点是简单、可控；缺点是切碎语义（一段话可能在第三句被切断）。
- **滑动窗口（Sliding Window）**：相邻 chunk 重叠 10-20%。缓解边界切断，但有冗余存储。
- **句子切分（Sentence Splitter）**：按句子边界（NLTK / spaCy / 句号 / 换行）。保持句子完整，但长度不均。
- **递归切分（Recursive Character Text Splitter）**：先按段落、再按句子、再按 token。LangChain 默认，**中文场景首选**。
- **语义切分（Semantic Chunking）**：用相邻 Embedding 相似度找切点（LangChain `SemanticChunker`、LlamaIndex `SemanticSplitterNodeParser`）。**优点**：语义完整；**缺点**：慢（每段都要 embedding）、依赖 Embedding 模型质量。
- **结构感知切分（Structure-aware）**：按 Markdown 标题层级、HTML 标签、代码 AST（tree-sitter）、PDF 章节切。**适合**：结构化文档、技术文档。
- **LLM 辅助切分**：让 LLM 决定切点。**准但贵**，一般用于 P0 高质量场景。

**第三层：Chunk Size 与 Overlap 的经验值。**

| Embedding 模型 | 推荐 Chunk Size | 推荐 Overlap | 理由 |
| --- | --- | --- | --- |
| OpenAI text-embedding-3-large | 512-1024 token | 10-20% | 模型训练长度 8192 |
| BGE-M3（中文） | 512-1024 token | 10-20% | 多功能多粒度 |
| BGE-large-en | 256-512 token | 10-20% | 训练长度 512 |
| M3E | 512 token | 10% | 中文优化 |
| ColBERTv2 | 128-256 token | - | 晚交互 |

Overlap 的作用是**减少边界切断的召回损失**——一段话被切断时，overlap 保证两个 chunk 各保留一半，召回任一都能拼回完整。但 overlap 不能太大（> 30%），否则存储翻倍、召回噪声增多。

**第四层：多模态文档的 Chunking 选型。**

- **PDF**：经典做法是按页切，但页大小不一、跨页表格被切断。进阶做法是「结构感知 + 表格单独处理」——正文按章节切、表格用 Camelot / pdfplumber 抽出来后按行 / 列单独 Embedding。ColPali（2024）更进一步，直接对 PDF 页面做多模态 Embedding，跳过文本提取阶段。
- **Word / Markdown**：最友好——按标题层级递归切，代码块按 ``` 边界切。
- **代码（Python / Java / SQL）**：用 tree-sitter 做 AST 切分，按函数 / 类 / 方法边界。LlamaIndex 的 `CodeSplitter` 是工业级实现。
- **表格**：特殊处理——把表格转成自然语言摘要（"X 类目下 Y 商品销量为 Z"）+ 原始表格分别 Embedding。
- **图像 / 视频 / 音频**：用多模态 Embedding（CLIP / ImageBind / Qwen-VL）直接对图像做 Embedding；视频抽帧后 Embedding；音频用 Whisper 转文本后再 Embedding。

**第五层：如何评估 Chunking 的好坏。** 不能凭感觉——必须建评测集：

- **黄金集**：人工标注「段落-问题」对应关系——给定一个问题，应该召回哪几个 chunk。
- **指标**：Chunk-Level Recall@K（召回的 chunk 是否包含答案信息）、Boundary Score（边界是否切断语义单元）、Embedding Drift（相邻 chunk 的 embedding 距离分布，过大意味着切断）。
- **工具**：RAGAS 提供 context_precision / context_recall；LangSmith 提供 chunk-level 调试视图。

**第六层：动态 Chunking（进阶）。** 2024-2025 出现的**Late Chunking**（Jina AI 2024 提出）做法是**先对整篇文档做 Embedding，再按 chunk 切向量**——保留跨段落上下文，适合长文档。

**3. 常见陷阱**

- **Chunk 越大越好。** Chunk 超过 1024 token 后，向量相似度被稀释，召回率反而下降。512 token 是大多数场景的甜点。
- **Overlap 越大越好。** Overlap > 30% 会让存储翻倍、召回噪声增多。
- **不用语义切分。** 以为语义切分「太慢太花」就直接放弃——对 P0 高质量场景（如法律 / 医疗），语义切分的召回率提升是值得的。
- **不对 PDF 做结构化处理。** PDF 解析后丢格式、跨页表格切断是 RAG 系统的最大召回黑洞之一。
- **不评估。** Chunking 改完不重建评测集，效果全凭感觉——注定无法迭代。
- **Chunking 后丢失元数据。** 切完后丢失来源文档、章节、页码、时间戳，导致引用无法溯源。

**4. 追问预测**

- **「中文文档按段落切，单段可能只有 50 token，召回的 chunk 太短上下文不足怎么办？」** 答：用「最小 chunk size + 上下文合并」策略——不足 200 token 的段落自动合并相邻段落直到达到 200 token 下限。
- **「PDF 表格被切断怎么处理？」** 答：先抽表格（pdfplumber / Camelot），表格转 Markdown 后单独 Embedding；同时在原页面 chunk 中保留表格引用。
- **「代码文档怎么切？」** 答：用 tree-sitter 按函数 / 类切，同时保留文件路径、函数签名作为 metadata，便于「这个函数在哪里定义」类问题。
- **「评估显示 Chunk-Level Recall@10 < 60%，下一步怎么改？」** 答：分情况——① 召回了相邻 chunk 但漏掉核心 chunk：改用语义切分或扩大 chunk size；② 召回完全无关 chunk：检查 Embedding 模型是否匹配语言（中英文混用）；③ Chunk 边界切断：增加 overlap 或改用结构感知切分。

**5. 参考资料**

- Greg Kamradt（LangChain 团队）2023 年公开的《5 Levels of Text Splitting》——Chunking 五层级的原始论述，是该领域引用最广的入门材料。
- LlamaIndex 官方文档关于 `SentenceSplitter` / `SemanticSplitterNodeParser` / `CodeSplitter` 的章节——工业级 Chunking 实现的对照参考。
- Jina AI 2024 年公开的《Late Chunking: Contextual Chunking Using Long Embeddings》——Late Chunking 范式的原始论文，把「先 Embedding 后切分」的思路系统化。
- Anthropic 关于 Claude 长文档处理与 Contextual Retrieval 的官方文档（2024）——头部 LLM 厂商对 Chunk + 元数据增强的最佳实践总结。
- LangChain 官方文档中 `RecursiveCharacterTextSplitter` 与中文切分最佳实践章节——中文场景下 Chunking 参数的工程经验。
- **平安银行的合同审查 RAG** —— 金融合同 PDF 多模态解析 + 表格抽取 + 章节感知 Chunking 的工业实践，处理跨页条款与签章页等典型金融文档痛点。
- **美的集团的「设备维护手册」智能问答** —— 制造业技术文档按章节递归切分 + 图纸 OCR 文本独立 Embedding 的工业方案，覆盖家电维保 SOP 类长尾文档。
- **中国移动的「10086 客服知识库」** —— 运营商客服知识按语义切分 + Late Chunking 处理超长业务文档的实践，处理政策类文档频繁更新与超长上下文难题。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

### 8.4 §5.3 Embedding 与向量化选型

> 本主题考察「向量空间的质量」：Embedding 模型决定了「什么算语义近邻」，是召回层的根。

#### §5.3.1 请系统说明 RAG 系统中 Embedding 模型的核心作用，并对比主流 Embedding 模型（OpenAI text-embedding-3 / BGE-M3 / M3E / CLIP / ColBERTv2）在中文、英文、多模态场景下的选型考量，以及如何评估 Embedding 效果。

**1. 考察点**

- 是否理解 Embedding 的**本质是「把语义映射到向量空间，使语义近邻在欧氏 / 余弦空间里也是近邻」**——这是召回层的天花板。
- 能否区分**稠密向量（Dense Embedding）** 与**稀疏向量（Sparse Embedding，如 SPLADE / BM25）** 的适用场景。
- 是否知道 Embedding 选型与**下游任务、语种、文档长度**强耦合——没有一个 Embedding 适合所有场景。
- 加分项：能给出具体的 Benchmark（BEIR / MTEB / C-MTEB）的对比数据。

**2. 参考答案框架**

**第一层：Embedding 在 RAG 中的角色。** Embedding 是 RAG 召回层的根——召回的天花板由 Embedding 决定，再好的 Reranker 也无法召回 Embedding 没命中的文档。所以 Embedding 选型是 RAG 系统最重要的单一决策。

**第二层：选型的五个约束。**

1. **语种**：中文 / 英文 / 多语言——BGE-M3 强项是「多功能多粒度多语言」（100+ 语言），M3E 是中文优化，OpenAI text-embedding-3-large 英文强但中文一般。
2. **文档长度**：短文本（< 512 token）选 BGE-large-en；长文本（> 4K token）选 BGE-M3（8192 token）或 Voyage AI（32K token）或 Nomic Embed。
3. **领域**：通用场景选 BGE-M3 / OpenAI；垂直领域（法律 / 医疗 / 金融）需要微调（用 Instructor Embedding 的「任务指令驱动」机制）。
4. **维度**：维度越高表达力越强但存储 / 计算成本越高。OpenAI text-embedding-3-large 3072 维、BGE-M3 1024 维、bge-small-en 384 维。
5. **成本**：自托管（BGE-M3 / M3E / bge-small）vs API（OpenAI / Cohere / Voyage）——按 query 量与延迟要求取舍。

**第三层：主流 Embedding 模型对比。**

| 模型 | 维度 | 语种 | 最大长度 | 特点 | 适用 |
| --- | --- | --- | --- | --- | --- |
| OpenAI text-embedding-3-large | 3072（可降到 256） | 英文为主 | 8192 | 闭源 SOTA | 英文为主 + 有 API 预算 |
| OpenAI text-embedding-3-small | 1536（可降到 512） | 英文为主 | 8192 | 性价比 | 英文 + 成本敏感 |
| BGE-M3（BAAI 2024） | 1024 | 多语言 100+ | 8192 | 多功能 + 多粒度 + 多语言 | 中文 + 多语言首选 |
| BGE-large-en-v1.5 | 1024 | 英文 | 512 | 英文 SOTA | 英文为主 |
| BGE-large-zh-v1.5 | 1024 | 中文 | 512 | 中文 SOTA | 中文场景 |
| M3E | 1024 | 中文 | 512 | 中文优化 | 中文 + 自托管 |
| Moka Massive Embedding | 1024 | 中英 | 512 | 中文 + 多任务 | 中文场景 |
| Cohere embed-v3 | 1024 | 多语言 | 512 | 多语言 SOTA | 多语言 + 有预算 |
| Voyage AI | 1024 | 多语言 | 32000 | 长文本 SOTA | 长文档 |
| Nomic Embed v1.5 | 768 | 多语言 | 8192 | 开源 + 长文本 | 长文档 + 自托管 |
| Instructor Embedding | 768 | 多语言 | 512 | 任务指令驱动 | 垂直领域微调 |
| CLIP ViT-L/14 | 768 | - | - | 图文对齐 | 多模态 RAG |
| Qwen-VL Embedding | - | 中英 | - | 中文图文 | 国内多模态 |
| ColBERTv2 | 变长 | 多语言 | - | 晚交互 | 高精度检索 |
| SPLADE-v3 | 稀疏 | 多语言 | 512 | 稀疏 + 语义 | 混合检索 |

**第四层：稠密 vs 稀疏 vs 晚交互。**

- **稠密向量（Dense Embedding）**：BGE / OpenAI / M3E。**优点**：语义近邻；**缺点**：精确匹配弱（型号、ID、专有名词容易召回「看起来相似但不是同一个」的文档）。
- **稀疏向量（Sparse Embedding）**：BM25 / SPLADE / uniCOIL。**优点**：精确匹配强、可解释（哪些词命中）；**缺点**：无语义。
- **晚交互（Late Interaction）**：ColBERT / ColBERTv2。把 query 与 doc 的每个 token 都编码，最后算 token 级相似度。**优点**：兼顾精度与语义；**缺点**：存储大（每个 token 都存向量）。

**生产经验**：单用向量召回的召回率上限是 70-80%，单用 BM25 的上限是 60-70%。**向量 + BM25 混合**才能打到 85%+——这是 Hybrid RAG 流行的根本原因。

**第五层：如何评估 Embedding 效果。**

- **离线 Benchmark**：BEIR（英文 18 个数据集）、MTEB（Massive Text Embedding Benchmark，涵盖 100+ 模型）、C-MTEB（中文版）。这是工程选型的标准参考。
- **线上 A/B**：在真实 query 上对比两个 Embedding 的 Recall@10 / MRR / nDCG。
- **领域评测集**：**最关键**——BM25 在 MTEB 上排名靠后不代表在你的领域不行，反之亦然。建自己的 Golden Set（几百到几千条「问题-正确文档」对）是最有说服力的评估。

**第六层：Embedding 微调。** 通用 Embedding 在垂直领域（如医疗 ICD 代码、法律条文）效果有限。微调路径：① 用领域数据继续预训练 Embedding；② 用 Instructor 模式加任务指令；③ 用对比学习（query 与正例拉近、与负例推远）。Databricks 的 `bge-large-en` 微调教程是工业参考。

**3. 常见陷阱**

- **英文 Embedding 跑中文。** 这是最常见的错误——OpenAI text-embedding-3 在中文场景下召回率比 BGE-M3 低 20%+。
- **维度越高越好。** 3072 维比 1024 维存储 3 倍、检索慢 2-3 倍，但召回率提升有限。按需选维度，能降到 256 维的反而更经济（OpenAI 支持 Matryoshka 降维）。
- **不做 Benchmark。** 直接拿通用 MTEB 排名选 Embedding——垂直领域效果可能差异巨大。
- **不处理 OOD。** Embedding 模型对训练分布外的术语（公司内部黑话、新出现的专有名词）效果会塌方，需要微调或加术语表。
- **忽略 Embedding 版本兼容。** 升级 Embedding 后必须全量重建索引——混用新旧 Embedding 的索引是隐性 bug。
- **不评估归一化。** 内积（Inner Product）vs 余弦相似度（Cosine）要求向量是否归一化。不归一化 + 余弦相似度 = 维度偏差。

**4. 追问预测**

- **「Embedding 选错了，召回率只有 50%，怎么救？」** 答：先换 Embedding——中文换 BGE-M3，英文换 OpenAI text-embedding-3-large，长文档换 Voyage / BGE-M3；如果还不行，加 BM25 兜底（Hybrid Search），通常召回率能回到 80%+。
- **「Embedding 微调要多少数据？」** 答：经验值——千级「query-正例-负例」三元组即可见效，万级能逼近专用模型。可以用 LLM 合成训练数据（Self-Instruct 模式）。
- **「维度 3072 太费存储，能不能降维？」** 答：用 Matryoshka 训练（OpenAI text-embedding-3 系列原生支持），可以降到 256 / 512 / 1024 维，召回率损失 < 5%，存储省 3-12 倍。
- **「怎么评估 Embedding 微调有没有用？」** 答：建 500 条 golden set（query + 正确答案文档），分别用原 Embedding 与微调 Embedding 跑召回，看 Recall@10 / MRR 是否提升；同时用 BEIR / MTEB 验证微调没有灾难性遗忘。

**5. 参考资料**

- BAAI（智源研究院）2024 年发布的 BGE-M3 论文《BGE M3-Embedding: Multi-Lingual, Multi-Functionality, Multi-Granularity Text Embeddings Through Self-Knowledge Distillation》——当前中文 / 多语言 Embedding 的事实标准。
- OpenAI 官方关于 text-embedding-3 与 Matryoshka Representations 的文档（2024）——降维 Embedding 的官方机制说明。
- MTEB / BEIR / C-MTEB 排行榜（Hugging Face 持续维护）——主流 Embedding 模型在 100+ 数据集上的标准化对比。
- ColBERTv2 原始论文（Khattab & Zaharia 2022）《ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction》——晚交互 Embedding 的工业范式。
- Databricks 公开技术博客中关于 Embedding Fine-tuning 的文章——企业级 Embedding 微调的工程范式与数据准备方法。
- 阿里达摩院 2023-2024 公开的中文 Embedding 评测报告——中文 Embedding 选型的本土化对照参考。
- **微众银行的金融 Embedding 微调** —— 基于 BGE 在信贷场景做领域微调的工业实践，处理金融术语 OOD 与稀有实体表达力不足问题。
- **网易雷火的游戏 Embedding 选型** —— 多语种游戏场景下 BGE-M3 与 OpenAI 的对比经验，覆盖中英日韩多语种商品 / 剧情 / NPC 语料。
- **京东数科的商品 Embedding 体系** —— 电商场景长尾 SKU 描述的 Embedding 微调与 Matryoshka 降维经验，处理亿级 SKU 的成本与召回率平衡。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

### 8.5 §5.4 混合检索与多路召回融合

> 本主题考察「召回层的工程」：单一向量召回的召回率天花板是 70-80%，生产级 RAG 几乎必须走混合检索——向量 + BM25 + KG + 标量过滤，并解决多路召回的融合问题。

#### §5.4.1 在生产级 RAG 系统中，为什么要采用混合检索（Hybrid Search）？请说明向量召回与 BM25 召回各自的强弱点，并阐述向量 + BM25 + 知识图谱 + 标量过滤的多路召回如何融合（RRF / 加权融合），以及如何处理权限与时间过滤。

**1. 考察点**

- 是否理解**单一向量召回的天花板**——Embedding 模型的语义理解能力有限，精确匹配（型号、ID、专有名词、时间）天生弱。
- 能否说出 BM25 与向量召回的**互补性**：BM25 擅长精确匹配（关键词、实体、ID），向量召回擅长语义近邻。
- 是否知道 RRF（Reciprocal Rank Fusion，逆序排名融合）的**工程优势**——无需归一化、对单路打分尺度不敏感，已成为事实标准。
- 加分项：能讲出**标量过滤（Scalar Filtering）**——按时间 / 部门 / 权限过滤——以及**元数据感知检索（Metadata-aware Retrieval）** 在生产 RAG 中的关键作用。

**2. 参考答案框架**

**第一层：单一向量召回的天花板。** 向量召回依赖 Embedding 模型——但 Embedding 模型在以下场景失效：

- **精确匹配**：型号、ID、专有名词（新出现的术语、产品 SKU）。向量召回可能命中「看起来相似但不是同一个」的文档。
- **数字 / 时间**：查询「2024 年 Q3 营收」，向量召回可能命中「2023 年 Q4 营收」。
- **多语言 / 跨语种**：英文 query 在中文文档库上召回率极低。
- **罕见词 / 领域黑话**：Embedding 模型对训练分布外的术语表达力不足。

**第二层：BM25 与向量召回的互补。** Robertson & Zaragoza 2009 年提出的 BM25（Best Matching 25）算法基于 TF-IDF 思想：

- **优点**：精确匹配强、可解释（哪些词命中）、对稀有词敏感、不需要训练。
- **缺点**：无语义理解（近义词「汽车 / 车辆」不匹配）、不处理词序。

向量与 BM25 的融合能用「精确 + 语义」双剑合璧——这是 Elastic Search 8.0+ 默认开启 Hybrid Search 的原因，也是 Microsoft / OpenAI 内部 RAG 系统的标配。

**第三层：融合策略——RRF vs 加权融合。**

- **加权融合（Weighted Sum）**：`score = α · sim_vector + β · score_bm25`。**优点**：直观；**缺点**：两路分数尺度不同，必须先归一化（min-max / z-score），且 α / β 需要调参。
- **RRF（Reciprocal Rank Fusion，Cormack 2009）**：`score(d) = Σ 1 / (k + rank_r(d))`，k 通常 60。**优点**：无需归一化、对单路打分尺度不敏感、几乎不需要调参；**缺点**：忽略了实际分数差异（只关心排名）。
- **Learn-to-Rank**：用 LambdaMART / LightGBM 等学习最佳融合权重。需要标注数据，工业界只在 P0 场景用。

**工业实践**：Qdrant、Weaviate、Milvus 都内置 RRF，Elasticsearch 8.0+ 的 RRF 实现是开源参考。RRF 在 MTEB-R 评测里几乎总是优于加权融合——这是 Cormack 等人在 TREC 多年验证的结论。

**第四层：标量过滤与元数据感知检索。** 混合检索的「召回 + 过滤」必须在**向量召回之前**完成（pre-filter），而不是召回之后（post-filter），否则召回结果会被过滤掉一大半。

- **时间过滤**：`timestamp > 2024-01-01 AND timestamp < 2024-12-31`。注意：post-filter 会让 Recall 急剧下降（召回 100 个，过滤后剩 5 个），所以**必须 pre-filter**。
- **权限过滤**：每个用户只能看自己有权限的文档——必须从向量库 metadata 里按用户 ID 过滤。
- **部门 / 业务线过滤**：金融部门只能查金融文档，技术部门只能查技术文档。
- **索引设计**：把过滤字段做成「标量索引 + 向量索引」的复合索引（HNSW + IVF-PQ + 标量 bitmap）。Weaviate / Vespa / Milvus 2.4+ 都支持。

**第五层：知识图谱（KG）召回的加入。** 当问题涉及**关系推理 / 多跳**（如「A 公司的董事长的配偶还投资了哪些公司？」），向量召回和 BM25 都不擅长，需要 KG 召回（Cypher / SPARQL 查询）。多路召回变成：

```
[Vector Recall] ─┐
[BM25 Recall]   ─┼─→ [RRF 融合 / 加权融合] → [Rerank] → [LLM]
[KG Recall]     ─┘
```

**第六层：召回顺序与并行。** 多路召回应**并行执行**（而非串行），用 `asyncio.gather` 或 LangChain 的 `EnsembleRetriever`。典型耗时：向量 50ms、BM25 20ms、KG 100ms，并行总耗时 ~100ms（max 而非 sum）。

**3. 常见陷阱**

- **只用向量召回。** 这是 PoC 阶段的常见做法，但生产环境召回率天花板是 70-80%，无法满足 90%+ 的 SLA。
- **用加权融合 + 不归一化。** BM25 分数可能 0-100，向量余弦 0-1，直接相加会让向量项被淹没。必须归一化或改用 RRF。
- **Post-filter。** 召回 100 个再过滤，剩 5 个——召回率雪崩。必须 pre-filter（向量库支持条件检索）。
- **KG 召回放最后。** KG 召回与向量召回的失败模式不同，应该并行而不是串行。
- **不处理权限。** 召回阶段不做权限过滤，等于把内部机密文档暴露给所有用户——这是 RAG 安全事故的 TOP 1。
- **RRF 的 k 值乱设。** Cormack 原始论文推荐 k=60，但实际数据集上 k=10-100 都试过，没有银弹，应该在自己的数据集上评测。

**4. 追问预测**

- **「RRF 和加权融合怎么选？」** 答：默认 RRF（无需归一化、几乎不需要调参），仅在有大量标注数据 + 想学最优权重时用 Learn-to-Rank（LambdaMART / LightGBM）。
- **「向量 + BM25 召回后怎么知道哪条起关键作用？」** 答：要么看 RRF 排序（贡献排名），要么用 SHAP 分析融合模型的特征重要性；还可以看 Rerank 前的 Recall@K——如果 BM25 那路召回的文档经常出现在 Top-K 里，说明 BM25 在该领域权重应该更大。
- **「怎么评估 Hybrid Search 的效果？」** 答：在 golden set（query-正确文档）上跑 Recall@10 / MRR / nDCG，对比「单向量」「单 BM25」「向量 + BM25」「向量 + BM25 + KG」四种配置。
- **「多路召回的延迟怎么压？」** 答：并行执行（`asyncio.gather`）+ 缓存（相同 query 的召回结果缓存）+ 早期过滤（pre-filter 减少召回量）+ ANN 索引（HNSW / IVF / DiskANN 替代 Brute Force）。

**5. 参考资料**

- Gordon V. Cormack 等人 2009 年发表于 TREC 的《Reciprocal Rank Fusion Outperforms Condorcet SUMFusion》——RRF 融合算法的原始论文。
- Elasticsearch 8.0+ 官方文档中关于 RRF 与 Hybrid Search 的章节——头部搜索引擎对混合检索的工业级实现。
- Weaviate / Qdrant / Milvus 官方文档中关于 Hybrid Search 的章节——主流向量库对混合检索的内置支持与最佳实践。
- 阿里云百炼 RAG 平台公开文档（2024）——国内云厂商关于「向量 + BM25 + 元数据过滤」的工程实践总结。
- Vespa（Yahoo 开源）官方文档——支持向量 + 标量 + 表达式复杂过滤的工业级检索引擎，是 Hybrid RAG 的典型实现。
- **蚂蚁集团的金融 RAG 多路召回** —— 信贷文档场景向量 + BM25 + 权限标量过滤的工业级 Hybrid Search 实践，处理金融敏感数据的权限隔离。
- **京东的电商搜索多路召回融合** —— 商品标题 BM25 + 类目 Embedding + 标量属性过滤的电商 RAG 召回架构，处理长尾 SKU 的精确匹配。
- **微医的医疗混合检索** —— 医学文献 + 病历 + 药品说明书的向量 + 关键词 + KG 三路召回融合，是医疗领域 Hybrid RAG 的代表实践。
- **丁香园** —— 丁香园的医学知识图谱——药品、疾病、症状、指南的多跳查询与推理。
- **平安好医生** —— 平安好医生的医疗 AI 特征平台——电子病历、影像、问诊文本向量化，支撑辅助诊断与用药推荐。
- **微医** —— 微医的患者主索引与数据目录——HIS / LIS / PACS 数据按 HIPAA / PIPL 双重分类分级。
- **丁香园** —— 丁香园的医学知识图谱——药品、疾病、症状、指南的多跳查询与推理。
- **平安好医生** —— 平安好医生的医疗 AI 特征平台——电子病历、影像、问诊文本向量化，支撑辅助诊断与用药推荐。
- **微医** —— 微医的患者主索引与数据目录——HIS / LIS / PACS 数据按 HIPAA / PIPL 双重分类分级。
- **丁香园** —— 丁香园的医学知识图谱——药品、疾病、症状、指南的多跳查询与推理。
- **平安好医生** —— 平安好医生的医疗 AI 特征平台——电子病历、影像、问诊文本向量化，支撑辅助诊断与用药推荐。
- **微医** —— 微医的患者主索引与数据目录——HIS / LIS / PACS 数据按 HIPAA / PIPL 双重分类分级。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

### 8.6 §5.5 Reranker 与上下文压缩

> 本主题考察「Post-Retrieval 优化」：Reranker 与 Contextual Compression 是 Advanced RAG 区别于 Naive RAG 的核心——能把召回率从 60% 拉到 85%+。

#### §5.5.1 请解释 Reranker（精排器）在 RAG 系统中的作用，对比 Bi-Encoder 与 Cross-Encoder 的差异，并说明 Cohere Rerank 3 / BGE-reranker / ColBERTv2 三种主流 Reranker 的选型。同时请说明 Contextual Compression（上下文压缩）解决的具体问题与常见实现方式。

**1. 考察点**

- 是否理解 Reranker 是**Advanced RAG 区别于 Naive RAG 的关键**——Bi-Encoder 召回 + Cross-Encoder 精排是当前 RAG 召回率提升 30%+ 的核心机制。
- 能否说清 Bi-Encoder 与 Cross-Encoder 的**速度 / 精度取舍**——Bi-Encoder 编码后向量可离线索引、检索快；Cross-Encoder 必须 query + doc 同时输入、慢但准。
- 是否知道 Cohere Rerank 3 / BGE-reranker / ColBERTv2 在**精度、速度、成本、自托管**四个维度的差异。
- 加分项：能讲出 Contextual Compression 解决的「Lost-in-the-Middle」问题，以及具体实现方式（LLM 提取、Embedding 过滤、句段重排）。

**2. 参考答案框架**

**第一层：Reranker 为什么必须存在。** 向量召回（Bi-Encoder）有三个根本局限：

- **训练目标不一致**：Bi-Encoder 在训练时用对比学习优化「语义近邻」，但 RAG 需要的是「问题与文档的相关性」——这两个目标不完全对齐。
- **向量空间压缩**：把 doc 压缩成一个向量，必然丢失信息。
- **无 query 上下文**：doc 的向量不依赖 query，而 doc 与 query 的相关性依赖 query。

Reranker（Cross-Encoder）解决的就是这三个问题——把 query 与 doc 同时输入 Transformer，让模型在「看到了 query 之后再判断 doc 是否相关」。**经验数据**：Reranker 通常能把 Recall@10 从 60% 提升到 85%+，是 Advanced RAG 投入产出比最高的优化。

**第二层：Bi-Encoder vs Cross-Encoder。**

| 维度 | Bi-Encoder | Cross-Encoder |
| --- | --- | --- |
| 编码方式 | query 和 doc 分别编码 | query + doc 拼接编码 |
| 速度 | 快（离线编码 + ANN 索引） | 慢（每次检索都要重新编码） |
| 精度 | 中（损失 doc-query 交互） | 高（full self-attention） |
| 存储 | 存向量（KB-MB） | 不存向量 |
| 适用 | 海量库检索 | 精排 Top-K |
| 代表 | BGE / OpenAI Embedding | Cohere Rerank / Cross-Encoder / MonoT5 |

**生产实践**：Bi-Encoder 召回 Top-100 → Cross-Encoder 精排 → Top-5 喂给 LLM。这是当前 Advanced RAG 的事实标准。

**第三层：三种主流 Reranker 选型。**

- **Cohere Rerank 3**：闭源商业 API，多语言 SOTA（含中文），延迟 ~200ms，按 query 计费（$1-2 / 1000 次）。**优点**：开箱即用、效果好；**缺点**：数据出境、成本高、定制性弱。**适用**：多语言场景 + 有预算。
- **BGE-reranker（BAAI 开源）**：开源中文 SOTA。`bge-reranker-large` 维度 ~5600 token，GPU 推理延迟 ~50ms。**优点**：中文强、可自托管；**缺点**：单 GPU 推理有 QPS 上限、需要部署推理服务。
- **ColBERTv2（晚交互）**：介于 Bi-Encoder 和 Cross-Encoder 之间——对每个 token 都编码，但不在编码时计算交互，而是在检索后做 token 级 MaxSim。**优点**：精度接近 Cross-Encoder，速度比 Cross-Encoder 快 10 倍；**缺点**：存储大（每个 token 存向量）。
- **LLM-as-Reranker**：让 GPT-4 / Claude 直接给候选文档打分。**优点**：效果好、可解释（让 LLM 解释为什么相关）；**缺点**：极贵、极慢（每次要调用大模型）、不适用高 QPS。
- **RankT5 / MonoT5**：经典 T5-based Reranker，单 GPU 推理快，精度中等。**适用**：成本敏感 + 自托管。

**第四层：Contextual Compression 解决什么问题。** 即使 Reranker 把 Top-5 召回出来，每个 chunk 里仍可能有大量无关内容（如文档开头 / 结尾的废话、跨段噪声）。这些噪声会：

- **污染 prompt**：LLM 被无关内容干扰，生成答案质量下降。
- **浪费 token**：长 chunk 占用上下文窗口，减少有效信息密度。
- **触发「Lost-in-the-Middle」**：Liu 等人 2023 年论文《Lost in the Middle》证明 LLM 对 prompt 中间位置的注意力最弱——chunk 太长会让关键信息「沉到中间」。

**第五层：Contextual Compression 的四种实现。**

- **LLM 提取**：让 LLM 从 chunk 里提取与 query 相关的句子。精度高、慢且贵。
- **Embedding 过滤**：把 chunk 切成句子，每个句子算与 query 的相似度，保留 Top-N 句子。LangChain 的 `EmbeddingsFilter`。
- **LLMChainExtractor**（LangChain）：用 LLM 链式提取。
- **Sentence-window Retrieval**（LlamaIndex）：检索时返回 Top-K 句子，但送入 LLM 时把句子所在的整个 chunk 都包含进去——保留局部上下文。

**第六层：Rerank + 压缩的顺序。** 业界主流做法是「Rerank → Compression」——先精排保留 Top-5，再压缩每条 chunk 的内部噪声；少数情况「Compression → Rerank」——先压缩再精排，但计算量更大。

**3. 常见陷阱**

- **不用 Reranker。** 这是 Naive RAG 时代的最大遗留问题——不加 Reranker，召回率天花板 70%，再调 Embedding 也上不去。
- **Reranker 用错模型。** 用 Bi-Encoder 当 Reranker（精度不够），或用 Cross-Encoder 直接对 1000 个候选精排（太慢）。必须 Top-100 召回 → Cross-Encoder 精排。
- **LLM-as-Reranker 滥用。** LLM 极贵极慢，只在 P0 高价值场景（每条 query 价值 $5+）才用。
- **只 Rerank 不压缩。** Reranker 提到 Top-5 后不压缩，prompt 里依然全是噪声。
- **Reranker 微调忽视领域性。** 通用 BGE-reranker 在法律 / 医疗领域效果有限，需要领域微调。
- **不评估 Reranker 增益。** 上线 Reranker 不看 Recall@10 变化，可能引入了负向优化（罕见场景下 Reranker 反而选错）。

**4. 追问预测**

- **「为什么不用 GPT-4 直接精排？」** 答：成本与延迟——GPT-4 输入 100 个候选 + 1 个 query = 几万 token，单次 query 成本 $0.5+、时间 5-10 秒。生产 RAG 单次 query 预算通常 < $0.05、延迟 < 2 秒，GPT-4 不可承受。
- **「Reranker 上线后效果反而下降，怎么办？」** 答：先看是召回 Top-10 命中但 Top-5 漏掉，还是 Top-10 都没命中；前者是 Reranker 模型问题（换 BGE-reranker 或 Cohere Rerank），后者是召回问题（召回阶段就没准备好，加 Reranker 也救不了）。
- **「上下文压缩会不会丢失关键信息？」** 答：有可能——LLM 提取可能漏掉隐含信息、Embedding 过滤可能误杀边界信息。必须用 RAGAS 的 `context_recall` 评估压缩前后的召回率变化。
- **「BGE-reranker 部署成本多高？」** 答：单卡 A10 / L4 即可部署 bge-reranker-large，QPS ~50-100（batch 32）；如果 QPS > 100，用 vLLM / TensorRT-LLM 加速，可达 QPS 500+。

**5. 参考资料**

- Cohere 官方关于 Rerank 3 的产品文档（2024）——商业 Reranker 的工业标杆。
- BAAI 智源研究院公开的 BGE-reranker 模型卡与论文（2023-2024）——中文 Reranker 事实标准。
- Omar Khattab & Matei Zaharia 2020 年关于 ColBERT 的原始论文，以及 2022 年 ColBERTv2 论文——晚交互 Reranker 的工程化范式。
- LangChain 官方文档中 `ContextualCompressionRetriever` 与 `EmbeddingsFilter` 的章节——上下文压缩的标准实现。
- Anthropic 关于 Claude 长上下文与「Lost in the Middle」问题的官方讨论——头部 LLM 厂商对 prompt 噪声问题的研究。
- **中信证券的研报 Reranker** —— 投研场景基于 BGE-reranker 做金融领域微调，处理研报中专有名词 / 财务术语的精排召回问题。
- **米哈游的 NPC 对话精排** —— 游戏剧情 RAG 中 BGE-reranker + LLM-as-Reranker 组合精排实践，处理多 NPC 一致性与世界观约束。
- **顺丰的客服 SOP 精排** —— 物流客服场景下 Bi-Encoder + Cross-Encoder 精排的 RAG 召回率提升实践，处理工单分类与政策匹配的语义对齐。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

### 8.7 §5.6 Agentic RAG 与 GraphRAG

> 本主题考察「2024-2025 的前沿演进」：Agentic RAG 与 GraphRAG 是当前最热的两条路径，能解决 Advanced RAG 解决不了的「多跳推理」「宏观问题」「跨系统」难题——但代价是复杂度、成本与可观测性。

#### §5.6.1 请系统说明 Agentic RAG（智能体驱动的 RAG）与 GraphRAG（图增强 RAG）相对于 Advanced RAG 的核心差异与适用场景，并阐述二者在工业落地时的成本、可观测性、错误传播等关键挑战，以及 Self-RAG、CRAG 等反思机制如何缓解这些挑战。

**1. 考察点**

- 是否理解 Agentic RAG 的**本质是「让 LLM 自主编排检索」**——不再是固定的「向量召回 → Rerank → 生成」，而是「Agent 决定查什么 / 何时查 / 怎么组合」。
- 能否区分 GraphRAG 的**两种检索范式**——Local Search（基于实体的局部检索）vs Global Search（基于社区摘要的全局检索）。
- 是否知道 Agentic RAG 的**主要风险**——成本（多次 LLM 调用）、可观测性（决策路径难复现）、错误传播（一步错步步错）。
- 加分项：能说出 Self-RAG 与 CRAG 的差异——前者是「生成中反思」、后者是「检索后反思 + Web fallback」。

**2. 参考答案框架**

**第一层：Advanced RAG 的局限。** Advanced RAG 在「单跳 + 明确问题 + 内部知识」场景下表现良好，但在以下场景失效：

- **多跳推理**：「A 公司的董事长的配偶还投资了哪些公司？」需要先查 A 公司 → 查董事长 → 查配偶 → 查投资——单次向量召回无法解决。
- **宏观问题**：「公司今年的整体战略是什么？」需要跨多文档的全局视角，单次 Top-K 召回不够。
- **跨系统查询**：「Q3 营收 + 同时对比 Q3 研发投入」需要同时调用 RAG（文档）+ SQL（数据库）+ Web Search（外部数据）。
- **动态问题**：「今天的新闻 / 最新公告」需要 Web 搜索兜底。

**第二层：Agentic RAG 的核心机制。** Agentic RAG 由 LLM 智能体自主决定检索路径。典型架构（LangGraph 实现）：

```
[Question] → [Agent 推理] → 决定调用哪个工具 → [Tool 执行] → [观察结果]
                                                          ↓
                                          [继续推理 / 整合 / 生成答案]
```

Agent 可以调用多种工具：

- `search_knowledge_base(query)`——向量 / BM25 召回。
- `query_database(sql)`——结构化数据查询。
- `search_web(query)`——Web 搜索（兜底）。
- `query_kg(cypher)`——知识图谱查询。
- `lookup_entity(entity_id)`——实体检索。

**工业实践**：Anthropic Claude + Tool Use、阿里通义晓蜜 Agent、字节扣子（Coze）、Salesforce Agentforce 都是 Agentic RAG 的工业实现。LangChain LangGraph 是当前 Agentic RAG 工程化的事实框架。

**第三层：GraphRAG 的核心机制。** Microsoft Research 2024 年发布的 GraphRAG 通过「KG + 社区检测 + 摘要」实现宏观问题检索：

1. **KG 抽取**：用 LLM 从文档里抽实体、关系、事件，构成 KG。
2. **社区检测**：用 Leiden 算法（Traag 等人 2019）把 KG 划分成社区（communities）。
3. **社区摘要**：用 LLM 为每个社区生成摘要（community summary）。
4. **检索**：
   - **Local Search**：基于实体 → 找邻居实体 → 找所在社区 → 返回实体 + 邻居 + 社区摘要。
   - **Global Search**：基于社区摘要 → 跨社区聚合 → 生成宏观答案。

**典型优势**：擅长「公司今年的整体战略是什么」「这些项目之间有什么关联」类宏观问题——这是向量 RAG 永远做不到的。

**第四层：Self-RAG 与 CRAG 的反思机制。**

- **Self-RAG**（ICLR 2024）：LLM 在生成 token 时插入四个特殊反思 token——`[Retrieve]`（是否需要检索）、`[IsRel]`（检索结果是否相关）、`[IsSup]`（生成是否被检索支持）、`[IsUse]`（生成是否有用）。这些 token 由 LLM 在 fine-tune 时学到，推理时动态决定是否再检索。
- **CRAG（Corrective RAG，Yan 等人 2024）**：检索后用一个 evaluator 给检索结果打分（high / medium / low confidence）：
  - high → 直接使用。
  - medium → 用 Knowledge Refinement 过滤 + 重组。
  - low → 触发 Web Search Fallback。

CRAG 的工程价值是「承认 RAG 会失败，并且准备好 fallback」——这是从「理想化系统」走向「生产可用系统」的关键。

**第五层：工业落地的关键挑战。**

| 挑战 | Agentic RAG | GraphRAG |
| --- | --- | --- |
| 成本 | 高（5-10 次 LLM 调用/query） | 极高（KG 构建 + 摘要都耗 LLM） |
| 延迟 | 高（5-15 秒） | 极高（KG 构建几小时 + 检索几秒） |
| 可观测性 | 差（决策路径难复现） | 中（KG 可视化，但 LLM 摘要难审计） |
| 错误传播 | 严重（一步错步步错） | 中（KG 错误会污染所有检索） |
| 适用问题 | 多跳、跨系统、复杂决策 | 宏观问题、跨文档推理 |
| 不适用 | 简单 FAQ（用 Advanced 即可） | 精确事实查询（用 SQL / Cypher 即可） |

**第六层：落地的工程经验。**

- **Agentic RAG 必须限制最大迭代次数**——通常 3-5 步，避免无限循环与成本失控。
- **必须用小模型做路由**——Haiku / GPT-4o-mini 判断「是否需要进一步检索」，只有需要时才升级到大模型。
- **GraphRAG 必须分阶段上线**——先建 KG（一次性 / 周更），再做社区检测与摘要（离线），最后接入检索（在线）。不能在每次 query 时重建 KG。
- **必须保留 fallback**——CRAG 的 Web Search Fallback 是生产 RAG 的必备兜底，不能在 RAG 失败时让 LLM 自由发挥（幻觉）。
- **可观测性基础设施**——Agentic RAG 必须有 trace 系统（LangSmith / LangFuse / Phoenix），记录每一步决策、调用、结果、出错原因。

**3. 常见陷阱**

- **把 Agentic RAG 当万能解。** 简单问题用 Agentic 反而引入不稳定性。永远从 Advanced 开始，按需升级。
- **GraphRAG 滥用。** 所有问题都套 GraphRAG 又慢又贵又差。精确事实查询用 SQL / Cypher，宏观问题才用 GraphRAG。
- **不限制迭代次数。** Agent 无限循环导致单次 query 成本上百美元、延迟分钟级——必须有 hard cap。
- **GraphRAG 在线建 KG。** 每次 query 都重建 KG 是性能灾难。KG 必须离线、增量、周更或月更。
- **忽略错误传播。** Agent 第一步错了，后续每一步都错——必须把 RAGAS 评估做到 step 级（每个工具调用都评估）。
- **不用 fallback。** 没有 Web Search Fallback 的 RAG 在「内部知识没覆盖」时一定会幻觉。
- **不审计 KG。** LLM 抽 KG 会出错（实体拼写错误、关系错位），必须做 KG 质量校验（人工抽检 + 规则校验）。

**4. 追问预测**

- **「Agentic RAG 一次 query 调用了 8 次 LLM，成本 $0.5，怎么压？」** 答：四招——① 用小模型做路由（Haiku / GPT-4o-mini）；② 缓存子查询结果（同一子查询复用）；③ 限制迭代次数（3-5 步）；④ 用 DSPy 自动优化 prompt / 模型路由。
- **「GraphRAG 的社区摘要多久更新一次？」** 答：取决于业务变化频率——新闻类每天更新、企业战略类季度更新、产品手册类每周更新。更新时只对变化的部分做增量摘要，全量重建成本过高。
- **「Self-RAG 需要 fine-tune 吗？」** 答：原始 Self-RAG 需要在生成反思 token 的 LLM 上 fine-tune（Akari 等人 ICLR 2024 论文）；变种做法是用 prompt engineering 引导通用 LLM 输出反思 token（精度略低但成本低）。
- **「CRAG 的 evaluator 怎么实现？」** 答：三种实现——① 小模型分类（DistilBERT / BERT-base 训练二分类）；② LLM 评分（GPT-4 / Claude 打 1-5 分）；③ 多信号融合（结合向量相似度 + 关键词命中 + LLM 评分加权）。

**5. 参考资料**

- Microsoft Research 2024 年发布的 GraphRAG 公开论文与开源仓库——GraphRAG 范式的原始出处，Local Search / Global Search 的范式划分。
- Akari Asai 等人 2024 年 ICLR 发表的《Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection》——Self-RAG 的原始论文与反思 token 机制。
- Shi-Qi Yan 等人 2024 年发表的《Corrective Retrieval Augmented Generation (CRAG)》——CRAG 的可校正检索范式。
- LangChain 官方文档关于 LangGraph 与 Agentic RAG 的章节（2024-2025）——Agentic RAG 工程化的事实标准框架。
- Anthropic 关于 Claude + Tool Use + Agentic Workflow 的官方文档——头部 LLM 厂商对 Agentic RAG 落地范式的官方表述。
- 阿里通义晓蜜 / 字节扣子（Coze）/ 百度千帆 AppBuilder 公开技术文档——国内 Agentic RAG 平台的工业实践。
- **蚂蚁集团的金融 Agentic RAG** —— 信贷场景下 Tool Use + 多源查询的 Agentic RAG，处理跨数据源复杂业务问答（产品 + 征信 + 流水 + 客服）。
- **滴滴的出行 Agentic RAG** —— 订单 + 司机 + 路线 + 天气多源工具调用的 Agentic 工作流，处理出行场景下复杂多跳决策问题。
- **平安好医生的医疗 Agentic RAG** —— 导诊 + 药品 + 医生排班多系统调用的 GraphRAG + Agentic 实践，处理医疗咨询的跨域推理需求。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

### 8.8 §5.7 RAG 评估与线上监控

> 本主题考察「RAG 的可观测性」：没有评估就没有迭代——上线 RAG 必须建三层评估体系（离线 / 在线 / 用户反馈），否则「凭感觉调参」注定失败。

#### §5.7.1 请系统说明 RAG 系统的评估指标体系（RAGAS / TruLens / ARES），并阐述如何构建离线的 Golden Set、自动化评估流水线、线上监控大盘与用户反馈闭环，以及如何在 CI / CD 中卡住「召回率下降」的部署。

**1. 考察点**

- 是否理解 RAG 评估的**三层体系**——离线（Golden Set + 自动化指标）、在线（监控大盘）、用户反馈（赞 / 踩回流）。
- 能否说出 RAGAS 的核心指标——`context_relevance` / `faithfulness` / `answer_relevancy` / `context_recall`——以及每个指标衡量什么。
- 是否知道 LLM-as-Judge 的**局限性**（LLM 评 LLM 会偏差），以及如何与人工评估结合。
- 加分项：能讲出 CI / CD 中如何卡住「召回率下降 X%」的部署，以及用 shadow deployment 做新版本对账。

**2. 参考答案框架**

**第一层：RAG 评估的三个维度。** RAG 系统的输出可以被拆成三个独立维度分别评估：

- **检索质量（Retrieval Quality）**：`context_relevance`（召回的 chunk 是否与 query 相关）、`context_recall`（正确答案是否被召回）。
- **生成质量（Generation Quality）**：`faithfulness`（答案是否忠实于召回的 chunk）、`answer_relevancy`（答案是否回答了 query）。
- **端到端质量**：`answer_correctness`（答案是否正确）、`answer_similarity`（答案与 ground truth 的相似度）。

这三个维度独立评估，才能定位问题——`faithfulness` 低说明 LLM 没读懂召回；`answer_relevancy` 低说明召回对了但 LLM 答错了；`context_recall` 低说明召回本身有问题。

**第二层：主流评估框架。**

- **RAGAS**（2024 开源）：RAG 专用评估框架，核心指标 `context_relevance` / `faithfulness` / `answer_relevancy` / `context_recall`，用 LLM-as-Judge 实现。**优点**：开源、与 LangChain / LlamaIndex 集成好；**缺点**：依赖 LLM-as-Judge，会引入 LLM 偏差。
- **TruLens**（开源）：LLM 应用评估框架，提供 `context relevance` / `groundedness` / `answer relevance` 三个核心指标，与 LangSmith / LlamaIndex 集成。
- **ARES**（Stanford 2024）：自动化 RAG 评估框架，使用 LM-Cocktail + LLM-as-Judge，精度比纯 LLM-as-Judge 高 10-15%，但需要训练数据。
- **LangSmith / LangFuse**：端到端调试 + 评估平台，提供 trace 可视化、golden set 管理、A/B 测试框架。

**第三层：离线 Golden Set 的构建。**

- **数据来源**：真实用户 query（去标识化）+ 人工标注「正确答案」「正确文档」。
- **规模**：500-5000 条起步，垂直领域可上万。
- **标注规范**：每个 query 必须有标准答案 + 至少 1 个「正确文档」标注（用于算 context_recall）。
- **更新频率**：业务变化 / 模型变化时必须重建；用户反馈持续回流补充。

**第五层：线上监控大盘。** 生产 RAG 必须有实时监控指标：

- **检索层**：Recall@K（在线抽样评估）、延迟（向量召回 / BM25 / KG）。
- **生成层**：Faithfulness（在线抽样）、首 token 延迟、生成 token 数。
- **业务层**：一次解决率、用户赞 / 踩率、引用点击率。
- **系统层**：QPS、错误率、成本 / query。

**第六层：用户反馈闭环。** 「用户赞 / 踩」必须回流到 Golden Set——每周把「被踩」的 query 拉出来人工标注，加入下个版本的评测集。这是 RAG 系统长期迭代的唯一可持续路径。

**第七层：CI / CD 集成。** 用 LangSmith / LangFuse + GitHub Actions / GitLab CI 实现：

- 新版本 RAG 跑离线 Golden Set，对比基线——如果 `context_recall` 下降 > 2% 或 `faithfulness` 下降 > 3%，阻塞部署。
- Shadow Deployment：新旧版本同时跑，新版本结果仅记录不返回，对账 24-48 小时后切换。
- A/B 测试：新版本 10% 流量，对比线上指标 1 周后全量。

**3. 常见陷阱**

- **不建 Golden Set。** 这是 RAG 项目最常见的失败模式——上线后「凭感觉调参」，迭代效率极低。
- **只看 Faithfulness 不看 Context Recall。** Faithfulness 高但答案错误，可能是因为 context_recall 低（没召回正确答案）——必须同时看两个指标。
- **完全依赖 LLM-as-Judge。** LLM 评 LLM 会引入偏差（位置偏差、长度偏差、自偏好），必须用「LLM-as-Judge + 人工抽检」组合。
- **线上不监控。** 上线后没有监控大盘，线上出问题靠用户投诉才发现——这是把 RAG 当 Demo 的标志。
- **用户反馈不回流。** 用户的「踩」没有被收集 / 标注 / 优化，RAG 系统永远不会进化。
- **CI / CD 不卡指标。** 没有自动化的「指标下降 X% 阻塞部署」机制，工程师只能手动看——注定会出事故。

**4. 追问预测**

- **「RAGAS 评估对训练不信任，怎么验证它真的准？」** 答：用人工标注的 100-200 条 golden set 作为「验证集」，对比 RAGAS 自动评分与人工评分的相关性（Spearman / Kendall tau）。如果相关性 < 0.6，说明 RAGAS 在该领域不可信，必须用人工评估。
- **「线上召回率突然下降 20%，怎么排查？」** 答：分层排查——① Embedding 服务是否更新（升级后没重建索引）；② 索引是否被破坏（schema 变更 / 数据回灌异常）；③ 数据源是否变化（文档格式变更导致 Chunking 失效）；④ 模型是否被新版替换（Embedding 模型 / Reranker 升级）。LangSmith / LangFuse 的 trace 是关键诊断工具。
- **「评估指标和业务指标哪个更重要？」** 答：都重要，但优先级是业务指标 > 评估指标——评估指标是手段，业务指标（一次解决率 / 用户满意度 / NPS）是目的。RAGAS 指标上升但一次解决率下降，说明「指标优化」没对准「用户需求」。
- **「人工评估要多少？」** 答：每周 50-100 条抽检（业务代表 + 数据团队双盲），加上所有「被踩」的 query 必标注——这是可持续的最小规模。

**5. 参考资料**

- Shahul ES 等人 2023-2024 年发表的 RAGAS 论文与官方文档——RAG 自动化评估的事实标准，含 `context_relevance` / `faithfulness` / `answer_relevancy` 的原始定义。
- Stanford SAFE 团队 2024 年发表的《Automated RAG Evaluation (ARES)》——用 LM-Cocktail 训练领域专属 Judge 的论文。
- LangSmith / LangFuse / Phoenix 官方文档——RAG 端到端调试与评估平台。
- TruLens（TruEra 团队）官方文档——LLM 应用评估框架。
- Databricks 公开的《Building Production-Grade RAG Applications》与 Mosaic AI 评估章节（2024）——企业级 RAG 评估与 CI / CD 集成的工业范式。
- 阿里云百炼 RAG 平台的评估模块公开文档（2024）——国内云厂商关于 RAGAS + 人工评估的最佳实践总结。
- **招商银行的 RAG 评估体系** —— 银行业 RAGAS + 人工评估 + CI/CD 召回率卡阈值的工业实践，把 Faithfulness 纳入模型上线 gate。
- **微众银行的开源 RAG 评测集** —— 金融领域 RAG 评估 Golden Set 构建与离线评测流水线，对外公开过部分评测基准。
- **屈臣氏的导购 RAG 监控大盘** —— 零售业 RAG 在线 Faithfulness 监控 + 用户赞踩回流闭环，处理导购场景下长尾商品知识持续更新。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

### 8.9 本章小结

本节收录 7 道题，覆盖本章节「RAG 架构」全部 7 个核心主题：范式演进、Chunking、Embedding、混合检索、Reranker、Agentic / GraphRAG、评估体系。七道题构成一条从「链路设计」到「效果验证」的完整下钻链路：

**链路视角**（自上而下）：**范式选型**（§5.1）→ **文档侧工程**（§5.2）→ **向量空间质量**（§5.3）→ **召回层融合**（§5.4）→ **精排与压缩**（§5.5）→ **前沿演进**（§5.6）→ **效果验证**（§5.7）。

**难度视角**：1-3 星题为基本功（必须答出具体参数与选型理由），4 星题为工程深度（必须讲清架构决策与代价），5 星题为前沿理解（必须能讲出 Agentic / GraphRAG 的取舍与可观测性）。

**答题心法**：

1. **先说约束，再列选项，最后说取舍。** 任何 RAG 决策都是「在什么约束下选什么、放弃什么」——没有银弹，只有取舍。
2. **端到端链路 > 单点优化。** RAG 的八段链路里，召回率天花板往往不在最复杂的 Reranker / GraphRAG，而在 Chunking / Embedding / Hybrid Search——先优化链路下界，再谈前沿。
3. **指标驱动 + 用户反馈闭环。** 没有评估就没有迭代；评估指标 + 用户反馈是 RAG 系统长期进化的唯一可持续路径。
4. **成本 / 延迟 / 准确性三角平衡。** Agentic RAG 不是越复杂越好——简单 FAQ 用 Naive / Advanced 即可；GraphRAG 不是越牛越好——精确事实查询用 SQL / Cypher 即可。

### 8.10 返回

- 返回 [04-data-assetization 章节目录](../README.md)
