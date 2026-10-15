# 混合检索（Hybrid Search）

> **一句话定位**：BM25 + 向量 + 知识图谱——多路召回、RRF 融合、精排，把「语义匹配」和「精确匹配」和「关系推理」三件套合一，是 2024 年 RAG 召回的事实标准架构。

> 本文是 data-travel 项目 [Ch4 · 数据资产化与智能检索](../../README.md) 的子章节（04 混合检索）。覆盖 **核心职责② 企业私有数据资产化与智能检索** 中「**多路召回与精排**」相关的算法、融合策略、评估与 AI 时代演进。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 混合检索是什么、为什么需要？ | §1 |
| BM25 + 向量 + KG 的数学原理？ | §2 |
| RRF 融合 / 加权融合 / 精排 怎么设计？ | §3 |
| BGE-M3、Cohere Rerank 3、Sparse-Dense Hybrid 怎么选？ | §4 |
| 2024-2025 Late Interaction / ColBERT / 混合检索新趋势？ | §5 |
| 混合检索召回率评估与落地？ | §6 |

---

## 1. 概念与定位

### 1.1 是什么

**学术 / 工业定义**：混合检索（Hybrid Search）是 2023-2024 年成为 RAG 召回事实标准的架构，它**同时使用多种检索方式（BM25 / 向量 / 知识图谱 / 结构化 SQL）做召回，再用融合算法（RRF / 加权）合并结果，最后用精排模型（Cohere Rerank 3 / BGE-reranker）做精细排序**。它突破了「单一向量召回」的局限，把「语义匹配」「精确匹配」「关系推理」三件套合一，是企业级 RAG 的必备基础设施。

**工程定义**：在数据架构师手里，混合检索是**一份「多路召回 + 融合 + 精排」的标准架构**：

- **多路召回**：向量（语义）+ BM25（关键词）+ KG（关系）+ SQL（精确）。
- **融合**：RRF（Reciprocal Rank Fusion）是最常用算法。
- **精排**：Cross-Encoder / Cohere Rerank 3 / BGE-reranker / ColBERT。
- **元数据过滤**：时间、权限、来源、分类。

**混合检索 vs 单一向量检索**：

| 维度 | 向量检索 | 混合检索 |
| --- | --- | --- |
| 语义匹配 | **5** | **5** |
| 精确匹配 | 2 | **5** |
| 实体匹配（型号、ID） | 1 | **5** |
| 多跳推理 | 1 | 4（+ KG） |
| 时效过滤 | 2 | **5** |
| 召回率 | 70-85% | 90-99% |
| 工程复杂度 | 3 | 4 |
| 延迟 | 50ms | 100-200ms |
| 适用 | 通用 | 企业级 |

### 1.2 为什么需要

**业务驱动力**：

- **「向量召回召回率不够」**：相似度 ≠ 相关性，单一向量召回漏掉精确匹配。
- **「实体 / 型号 / ID 必须精确」**：「iPhone 15 Pro Max」必须精确匹配，不能相似度。
- **「时效性」**：用户问「最新政策」，必须按时间过滤。
- **「关系推理」**：用户问「张三的同事的导师的论文」，需要 KG 多跳。
- **「企业级 RAG 标准」**：2024 年企业级 RAG 标配。

**痛点**：

1. **「向量检索漏召回」**：精确关键词漏掉，召回率 70%。
2. **「实体错配」**：型号 / ID / 时间错位。
3. **「无关系推理」**：多跳问题答不上。
4. **「无时效性」**：旧文档干扰。
5. **「粗排不准」**：向量召回的 Top-K 喂给 LLM，噪声大。

**AI 时代的新诉求**：

- **「Agent 需要精准检索」**：Agent 多步决策，召回不准会失败。
- **「RAG 召回率必须高」**：工业级 RAG 要求 Recall@10 > 90%。
- **「多模态融合」**：向量 + 全文 + KG + 结构化混合。
- **「Late Interaction 精排」**：ColBERTv2 / SPLADE++ 提升精排。

### 1.3 在 AI 时代数据架构中的位置

```
   [用户问题]
        ↓
   [Query Understanding]
   意图识别 / Query Rewrite / HyDE
        ↓
   ┌────────┼────────┐
   ↓        ↓        ↓
[向量]  [BM25]  [KG/SQL]
   ↓        ↓        ↓
   └────────┼────────┘
        ↓
   [RRF 融合 / 加权融合]
        ↓
   [精排：Reranker]
        ↓
   [Top-K 给 LLM]
```

- **上游**：Ch4-02 向量湖、Ch4-03 AI 原生数据库、Ch4-09 统一查询网关。
- **下游**：Ch4-05 RAG、Ch5 Agent 平台。
- **横向**：与 Ch1 知识图谱、Ch3 数据全栈深度协同。

**一句话判断**：**「不会做混合检索，做不好企业级 RAG」——混合检索是 RAG 召回率提升 30%+ 的关键武器。**

### 1.4 演进历程

**传统信息检索阶段（1990-2015）**：

- **1995**：BM25（Robertson）成为经典。
- **2000s**：TF-IDF、PageRank、Lucene / Elasticsearch。

**向量检索阶段（2017-2022）**：

- **2017**：Facebook FAISS。
- **2019-2021**：Milvus / Pinecone / Weaviate 商业化。

**混合检索萌芽（2020-2023）**：

- **2020**：Hybrid Search 在 Weaviate / Vespa 出现。
- **2021**：BM25 + 向量融合成 RAG 标配。
- **2022**：Cohere Rerank 商业化。

**混合检索成熟（2023-2024）**：

- **2023**：RRF（Cormack 2009）成为融合事实标准。
- **2023**：BGE-reranker、Cohere Rerank 3 普及。
- **2024**：Late Interaction（ColBERTv2 / SPLADE++）成熟。

**AI 原生混合检索（2024+）**：

- **2024**：Agentic Hybrid Search（智能体决定检索策略）。
- **2024**：多模态混合检索（向量 + 全文 + KG + 结构化）。
- **2025**：BGE-M3（多功能 Embedding）成为新 SOTA。

---

## 2. 核心原理

### 2.1 关键概念定义

- **BM25（Best Matching 25）**：经典词频统计检索算法（Robertson 1995）。
- **TF-IDF（Term Frequency-Inverse Document Frequency）**：经典词权重算法。
- **向量检索（Vector Search）**：基于 Embedding 相似度的检索（详见 [01-multimodal-db](./01-multimodal-db.md)）。
- **稀疏向量（Sparse Vector / SPLADE）**：词级别的稀疏向量（SPLADE / SPLADE++）。
- **稠密向量（Dense Vector）**：句级别的稠密 Embedding。
- **RRF（Reciprocal Rank Fusion）**：倒数排名融合（Cormack 2009），无需分数标准化。
- **Hybrid Score**：加权融合（需要分数归一化）。
- **Reranker / Cross-Encoder**：把 query + doc 拼接过 BERT，输出相关性分数。
- **Cohere Rerank 3**：商业 Reranker，多语言 SOTA。
- **BGE-reranker**：BAAI 开源 Reranker，中文 SOTA。
- **ColBERT / ColBERTv2**：晚交互（Late Interaction）Reranker。
- **Late Interaction**：把 query 和 doc 编码成 token 级向量，再细粒度匹配。
- **Hybrid Retrieval**：多路召回融合。
- **Recall@K**：Top-K 中包含正确答案的比例。
- **MRR（Mean Reciprocal Rank）**：第一个正确答案排名的倒数平均。
- **nDCG**：归一化折损累计增益。
- **HyDE（Hypothetical Document Embeddings）**：让 LLM 假写答案再检索。
- **Query Rewrite**：LLM 把问题改写成更适合检索的形式。
- **Step-Back Prompting**：让 LLM 先抽象再检索。
- **Multi-hop QA**：需要多跳推理的问答。
- **BGE-M3（BAAI）**：多功能（Multi-Functionality / Multi-Linguality / Multi-Granularity）Embedding。
- **SPLADE / SPLADE++**：稀疏 + 上下文扩展的检索模型。

### 2.2 数学 / 形式化基础

**BM25 的数学**：

```
BM25(q, d) = Σ_{t ∈ q} IDF(t) · (f(t, d) · (k1 + 1)) / (f(t, d) + k1 · (1 - b + b · |d| / avgdl))

其中：
- f(t, d)：词 t 在文档 d 中的词频
- |d|：文档 d 的长度
- avgdl：平均文档长度
- IDF(t) = log((N - df(t) + 0.5) / (df(t) + 0.5))
- k1：词频饱和参数（通常 1.5）
- b：文档长度归一化参数（通常 0.75）
```

**向量相似度的数学**：

```
cos(v, q) = (v · q) / (||v|| × ||q||)
L2(v, q) = ||v - q||
IP(v, q) = v · q
```

**RRF 融合的数学**：

```
RRF_score(d) = Σ_{r ∈ retrievers} 1 / (k + rank_r(d))

其中：
- rank_r(d)：文档 d 在 retriever r 中的排名
- k：常数（通常 60）
```

RRF 的优点：无需分数标准化、不同尺度的相似度可直接融合。

**加权融合的数学**：

```
Hybrid_score(d) = Σ_{r ∈ retrievers} w_r · normalize(score_r(d))

其中：
- normalize()：min-max / z-score / rank 归一化
- w_r：retriever r 的权重
```

**Cross-Encoder Rerank 的数学**：

```
rerank_score(q, d) = CrossEncoder(concat(q, d))
```

Cross-Encoder 把 q 和 d 拼接后过 BERT，最后一层是分类头输出 0-1 分数。

**Late Interaction（ColBERT）的数学**：

```
score(q, d) = Σ_{q_token ∈ q} max_{d_token ∈ d} <q_emb(q_token), d_emb(d_token)>
```

每个 query token 与最相似的 doc token 匹配，再求和。

**BGE-M3 的多功能**：

- **Multi-Functionality**：支持 dense / sparse / colbert 三种向量。
- **Multi-Linguality**：支持 100+ 语言。
- **Multi-Granularity**：支持短句 - 长文档。

### 2.3 关键算法 / 方法

**BM25 系列**：

| 算法 | 特点 |
| --- | --- |
| BM25 | 经典、Elasticsearch / OpenSearch 默认 |
| BM25+ | BM25 改进版，避免负分数 |
| BM25F | 多字段 BM25 |
| TF-IDF | 经典、已被 BM25 取代 |

**向量模型**：

| 模型 | 维度 | 特点 |
| --- | --- | --- |
| BGE-M3 | 1024 | 多功能（dense / sparse / colbert） |
| BGE-large | 1024 | 中文 SOTA |
| OpenAI text-embedding-3 | 3072 | 通用 |
| M3E | 1024 | 中文 |
| SPLADE++ | 30522 | 稀疏 + 扩展 |
| ColBERTv2 | 变长 | 晚交互 |
| E5 / BGE-en | 1024 | 英文 |

**Rerank 模型**：

| 模型 | 特点 |
| --- | --- |
| Cohere Rerank 3 | 商业、多语言 SOTA |
| BGE-reranker-v2 | 开源、中文 SOTA |
| Jina Rerank | 商业、多语言 |
| ColBERT / ColBERTv2 | 学术、晚交互 |
| RankT5 / MonoT5 | 经典 |
| LLM-as-Reranker | GPT-4 / Claude 排序 |

**融合算法**：

| 算法 | 公式 | 优点 |
| --- | --- | --- |
| RRF | Σ 1/(k+rank) | 无需标准化 |
| Weighted Sum | Σ w·norm(score) | 可解释 |
| Borda Count | Σ (N - rank) | 简单 |
| Condorcet | 配对比较 | 公平 |
| CombMNZ | Σ score × 非零数 | 重视多源命中 |

### 2.4 与相邻概念的关系

- **混合检索 vs 向量检索**：混合检索包含向量 + 多种。
- **混合检索 vs RAG**：RAG 是「检索 + 生成」流水线，混合检索是 RAG 的召回层。
- **混合检索 vs 知识图谱**：KG 是「关系推理」，混合检索是融合向量 + BM25 + KG。
- **混合检索 vs Late Interaction**：Late Interaction 是精排的一种，混合检索包含 Late Interaction。
- **混合检索 vs Agentic RAG**：Agentic RAG 是「智能体决定检索策略」，混合检索是「预设多路召回」。

---

- [§3. 设计模式与范式](04-hybrid-search-section-3-sec3.md)
- [§4. 工程实现](04-hybrid-search-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](04-hybrid-search-section-5-ai.md)
- [§6. 落地实践](04-hybrid-search-section-6-sec6.md)
- [§7. 与其他方法对比](04-hybrid-search-section-7-sec7.md)
- [§8. 面试真题集](04-hybrid-search-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](04-hybrid-search-section-3-sec3.md)
- [§4. 工程实现](04-hybrid-search-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](04-hybrid-search-section-5-ai.md)
- [§6. 落地实践](04-hybrid-search-section-6-sec6.md)
- [§7. 与其他方法对比](04-hybrid-search-section-7-sec7.md)
- [§8. 面试真题集](04-hybrid-search-section-8-sec8.md)

---
