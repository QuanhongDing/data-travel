> 本文件是 **01-embedding-and-retrieval.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](01-embedding-and-retrieval.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：场景识别与需求分析**

- 识别 RAG / 推荐 / 搜索的具体场景。
- 评估数据规模（文档量、查询量、QPS 需求）。
- 评估精度要求（粗排 / 精排）。
- 输出：**Embedding 需求规格说明书（Embedding Requirements Specification, ERS）**。

**Step 2：Embedding 模型选型**

- 评估候选模型（OpenAI text-embedding-3 / BGE-M3 / Cohere Embed v3 / Snowflake Arctic / Nomic / ColBERT）。
- 在 MTEB / 内部数据集上评测。
- 考虑成本（API 价格 / 自托管 GPU）、延迟、合规。
- 输出：**选型决策 ADR**。

**Step 3：向量数据库选型**

- 评估向量数据库（Milvus / Qdrant / Weaviate / Pinecone / pgvector / Chroma）。
- 评估规模（10M / 100M / 1B+ 向量）。
- 评估功能（HNSW / IVF / PQ / Hybrid / Rerank 内置）。
- 输出：**向量库选型决策 ADR**。

**Step 4：Embedding Pipeline 建设**

- 离线批量 Embedding（Airflow / Spark / Ray）。
- 文档分块策略（按 token / 段落 / 语义）。
- Embedding 缓存（避免重复计算）。
- 输出：**离线 Embedding Pipeline**。

**Step 5：索引构建与更新**

- 构建 HNSW / IVF 索引。
- 配置副本、分片、备份。
- 设计增量更新策略（追加 / 删除 / 更新）。
- 输出：**可用的向量索引**。

**Step 6：检索服务部署**

- 暴露 ANN 检索 API。
- 集成 Reranker（Cohere Rerank 3 / BGE Reranker）。
- 集成 BM25（如需 Hybrid）。
- 输出：**检索 API 服务**。

**Step 7：Hybrid RAG 集成**

- 集成向量检索 + 关键词检索。
- 集成 LLM 生成层。
- 集成 Prompt 模板。
- 输出：**端到端 RAG 系统**。

**Step 8：评估与可观测**

- 建立评估集（MTEB 子集 + 内部业务集）。
- 配置监控（QPS、延迟、命中率、成本）。
- 建立用户反馈闭环。
- 输出：**可观测的 Embedding + 检索平台**。

### 4.2 关键技术点

**1. Embedding 模型选型原则**：

- **精度优先场景**：Cohere Embed v3、Snowflake Arctic Embed、OpenAI text-embedding-3-large。
- **多语言场景**：BGE-M3（开源、中文 SOTA）、multilingual-E5、Cohere Embed v3。
- **长文本场景**：BGE-M3（8192 token）、Nomic Embed v1.5（8192）、ColBERT v2。
- **成本敏感场景**：BGE-small、GTE-small、自托管小模型。
- **多模态场景**：CLIP、Visualized BGE、ColPali。
- **Late Interaction**：ColBERT v2（长文档精确）。

**2. 文档分块（Chunking）策略**：

- **按 Token 固定分块**（512 token / 256 重叠）：简单、通用。
- **按段落 / 标题分块**：保留语义完整性。
- **按语义分块**（基于 Embedding 相似度）：高质量，但慢。
- **按结构分块**（Markdown / PDF 章节）：适合文档知识库。
- **大小**：典型 256-1024 token，重叠 10-20%。
- **元数据**：保留 doc_id、chunk_id、source、timestamp。

**3. ANN 索引调优**：

- **HNSW**：`M=16-64`，`ef_construction=200-400`，`ef_search=50-200`。召回率与速度权衡。
- **IVF**：聚类数 $k = 4\sqrt{n}$，probe 数 8-32。
- **PQ**：子向量数 $m = 32-64$，码本大小 256。压缩比 10-100x。
- **混合索引**：HNSW + PQ（内存优化）、DiskANN（磁盘优化）。

**4. Reranking 集成**：

- **Cohere Rerank 3**：商业 API，多语言，Cross-Encoder。
- **BGE Reranker v2-m3**：开源，多语言，长文本。
- **Jina Reranker**：开源。
- **LLM Rerank**：GPT-4 / Claude 做精排（成本高）。
- **策略**：Top-100 粗排 → Top-10 精排。

**5. Hybrid 检索融合**：

- **RRF**（Reciprocal Rank Fusion）：$\text{score}(d) = \sum \frac{1}{k + \text{rank}_i(d)}$，简单有效。
- **加权融合**：$\text{score}(d) = \alpha \cdot \text{vec_score}(d) + (1-\alpha) \cdot \text{bm25_score}(d)$。
- **Cohere Rerank** 内置 Hybrid。

**6. Fine-Tuning 技巧**：

- **Hard Negative Mining**：用 BM25 + Embedding 召回边界作为 Hard Negative。
- **In-Batch Negatives**：同 batch 样本互为负例。
- **Matryoshka Loss**：支持维度截断。
- **Instruction Tuning**：用不同 prefix 支持多任务。
- **领域数据合成**：用 GPT-4 / Claude 合成领域训练数据。

**7. 可观测与监控**：

- **检索延迟**（P50 / P95 / P99）。
- **召回率 / 准确率**（基于标注集）。
- **Embedding 成本**（Token 用量、API 调用次数）。
- **索引大小**、内存使用。
- **用户反馈**（点赞 / 点踩 / 标注）。

### 4.3 工具链与平台

**Embedding 模型（API）**：

- **OpenAI text-embedding-3-small**（2024）——1536 维（可截断到 512），性价比高。
- **OpenAI text-embedding-3-large**（2024）——3072 维，SOTA。
- **OpenAI text-embedding-ada-002**（2022）——1536 维，经典。
- **Cohere Embed v3**（2024）——1024 维，多语言，Matryoshka。
- **Voyage AI Embeddings**（2024）——专注企业级检索。
- **AWS Bedrock Embeddings**（Titan Embeddings v2）——AWS 托管。

**Embedding 模型（开源）**：

- **BGE-M3**（智源，2024）——多语言（100+）、多功能（dense / sparse / multi-vector）、长文本（8192）。
- **BGE-large-en-v1.5**（智源，2023）——英文 SOTA。
- **bge-small-en-v1.5**——轻量。
- **GTE-Qwen2-7B-instruct**（阿里 2024）——基于 Qwen2，强大。
- **Nomic Embed Text v1.5**（2024）——长上下文 8192，Matryoshka。
- **Nomic Embed Vision v1.5**——多模态。
- **Snowflake Arctic Embed**（2024）——SOTA 检索模型。
- **mxbai-embed-large**（MixedBread 2024）——SOTA 之一。
- **Jina Embeddings v3**（2024）——多任务，8192 token。
- **multilingual-E5**（微软 2024）——多语言 SOTA。
- **M3E**（Moka AI 2023）——中文 SOTA，开源。
- **text2vec**（Chinese 2023）——中文开源。
- **ColBERT v2**（Stanford 2024）——Late Interaction，长文档 SOTA。
- **ColPali**（2024）——文档图像 Late Interaction。
- **SPLADE++**（Naver 2023）——学习型稀疏向量。

**Rerank 模型**：

- **Cohere Rerank 3**（2024）——商业 API，多语言 SOTA。
- **Cohere Rerank 3.5**（2024）——更快、更便宜。
- **BGE Reranker v2-m3**（智源 2024）——开源，多语言。
- **BGE Reranker v2-gemma**（2024）——基于 Gemma。
- **Jina Reranker**（2024）——开源，长文本。
- **mixedbread Rerank**（2024）。

**向量数据库**：

- **Milvus**（国产开源，2024+ SOTA）——亿级向量、HNSW / IVF / GPU 加速。
- **Qdrant**（开源）——Rust 实现，高性能。
- **Weaviate**（开源）——内置 Hybrid 检索、模块化。
- **Pinecone**（云）——Serverless，企业级托管。
- **pgvector**（PostgreSQL 扩展）——与 PG 集成。
- **Chroma**（轻量开源）——适合原型。
- **Vespa**（Yahoo）——大规模企业级。
- **Marqo**（开源）——端到端 Embedding 平台。
- **LanceDB**（开源）——嵌入式向量库。
- **Elasticsearch dense_vector**（8.x+）——与 ES 集成。
- **OpenSearch k-NN**（AWS）——ES 兼容。
- **TiDB Vector**（PingCAP）——HTAP + 向量。
- **阿里云 VectorDB**（2024）——阿里云原生。
- **腾讯 VectorDB**（2024）——腾讯云原生。

**LLM 推理框架（自托管 Embedding）**：

- **vLLM**（UC Berkeley）——高吞吐 Embedding 推理。
- **Text Embeddings Inference**（HuggingFace TGI）——TEI 专用。
- **SGLang**（2024）——高性能 Embedding 推理。
- **Ollama**——本地 Embedding（轻量场景）。
- **LM Studio**——本地桌面。

**Hybrid 检索平台**：

- **Elasticsearch + ELSER**（2024）——BM25 + 向量混合。
- **OpenSearch + Neural Search**（2024）——AWS。
- **Vespa**——Hybrid 检索引擎。
- **Weaviate**——内置 Hybrid。
- **Cohere Rerank + 自建**——商业 Hybrid。

**可观测与评估**：

- **Langfuse**（开源）——LLM + 检索可观测。
- **Phoenix**（Arize）——RAG 评估。
- **RAGAS**（开源）——RAG 评估框架。
- **LangSmith**（LangChain）——RAG Trace + 评估。
- **Arize Phoenix**——Embedding Drift 检测。
- **MTEB Leaderboard**（HuggingFace）——Embedding 模型排行榜。
- **C-MTEB**（智源）——中文 Embedding 评测。

### 4.4 代码 / 示例

**示例 1：OpenAI Embedding + 向量检索（Python）**

```python
import os
import numpy as np
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

# 1. 初始化
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
qdrant = QdrantClient(host="localhost", port=6333)

# 2. 创建 collection
qdrant.create_collection(
    collection_name="docs",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
)

# 3. 文档 Embedding + 入库
documents = [
    {"id": "doc1", "text": "苹果公司发布 iPhone 16", "source": "news"},
    {"id": "doc2", "text": "Apple Inc. launched new iPhone", "source": "news"},
    {"id": "doc3", "text": "华为发布 Mate 70", "source": "news"},
]

def embed_text(text: str, model: str = "text-embedding-3-small", dimensions: int = 1536) -> list:
    """Embedding 文本"""
    response = client.embeddings.create(
        model=model,
        input=text,
        dimensions=dimensions,
    )
    return response.data[0].embedding

points = []
for doc in documents:
    vector = embed_text(doc["text"])
    points.append(PointStruct(id=doc["id"], vector=vector, payload=doc))

qdrant.upsert(collection_name="docs", points=points)

# 4. 检索
query = "Apple 最新手机"
query_vector = embed_text(query)

results = qdrant.search(
    collection_name="docs",
    query_vector=query_vector,
    limit=3,
)

for r in results:
    print(f"Score: {r.score:.3f} | {r.payload['text']}")
# Score: 0.876 | Apple Inc. launched new iPhone
# Score: 0.821 | 苹果公司发布 iPhone 16
# Score: 0.412 | 华为发布 Mate 70
```

**示例 2：BGE-M3 多语言 Embedding（开源）**

```python
from FlagEmbedding import BGEM3FlagModel
import torch

# 1. 加载模型
model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)
# 支持 dense / sparse / multi-vector 三种模式

# 2. 多语言 Embedding
sentences = [
    "苹果公司发布 iPhone 16",          # 中文
    "Apple Inc. launched new iPhone",   # 英文
    "Appleは新型iPhoneを発表しました",  # 日文
]

# Dense 向量（1024 维）
embeddings = model.encode(
    sentences,
    return_dense=True,
    return_sparse=False,
    return_colbert_vecs=False,
)
dense_vecs = embeddings["dense_vecs"]  # numpy array (3, 1024)
print(f"Dense shape: {dense_vecs.shape}")

# 多向量（ColBERT 风格）
multi_vec = model.encode(
    sentences,
    return_dense=False,
    return_sparse=False,
    return_colbert_vecs=True,
)
colbert_vecs = multi_vec["colbert_vecs"]  # list of tensors

# Sparse 向量（类似 SPLADE）
sparse = model.encode(
    sentences,
    return_dense=False,
    return_sparse=True,
    return_colbert_vecs=False,
)
```

**示例 3：Cohere Embed v3 + Cohere Rerank 3（完整 RAG）**

```python
import cohere
import os
from typing import List

co = cohere.Client(api_key=os.environ["COHERE_API_KEY"])

# 1. Embedding 文档
documents = [
    {"id": "1", "text": "苹果公司发布 iPhone 16，售价 7999 元起"},
    {"id": "2", "text": "华为发布 Mate 70，搭载麒麟 9100 芯片"},
    {"id": "3", "text": "小米发布 SU7 Ultra 电动跑车"},
    {"id": "4", "text": "Apple's iPhone 16 features A18 chip"},
]

doc_response = co.embed(
    texts=[d["text"] for d in documents],
    model="embed-english-v3.0",
    input_type="search_document",
    embedding_types=["float"],
)
doc_vectors = doc_response.embeddings.float

# 2. 粗排（向量检索 Top-100）
query = "Apple 最新手机有什么特点"
query_response = co.embed(
    texts=[query],
    model="embed-english-v3.0",
    input_type="search_query",
    embedding_types=["float"],
)
query_vector = query_response.embeddings.float[0]

# 计算余弦相似度
import numpy as np
query_arr = np.array(query_vector)
scores = []
for i, doc_vec in enumerate(doc_vectors):
    doc_arr = np.array(doc_vec)
    sim = np.dot(query_arr, doc_arr) / (np.linalg.norm(query_arr) * np.linalg.norm(doc_arr))
    scores.append((i, sim))

# 排序取 Top-100
top_100 = sorted(scores, key=lambda x: x[1], reverse=True)[:100]

# 3. 精排（Cohere Rerank 3）
rerank_docs = [documents[i[0]]["text"] for i in top_100]
rerank_response = co.rerank(
    query=query,
    documents=rerank_docs,
    model="rerank-english-v3.0",
    top_n=3,
)

for r in rerank_response.results:
    print(f"Rerank Score: {r.relevance_score:.3f} | {rerank_docs[r.index]}")
```

**示例 4：ColBERT v2 Late Interaction（长文档检索）**

```python
from colbert import Searcher, ColBERTConfig

# 1. 配置 ColBERT
config = ColBERTConfig(
    doc_maxlen=512,
    query_maxlen=64,
    nbits=2,  # 2-bit 压缩
    kmeans_niters=4,
)

# 2. 创建 Searcher（假设已构建索引）
searcher = Searcher(index="colbertv2.0", config=config, checkpoint="colbert-ir/colbertv2.0")

# 3. 检索
query = "Apple iPhone 16 评测"
results = searcher.search(query, k=10)

for passage_id, rank, score in zip(*results):
    passage = searcher.collection[passage_id]
    print(f"Rank {rank} | Score {score:.3f} | {passage[:200]}...")
```

**示例 5：Hybrid Retrieval（向量 + BM25 + Rerank）**

```python
from elasticsearch import Elasticsearch
from sentence_transformers import SentenceTransformer
import numpy as np

es = Elasticsearch(["http://localhost:9200"])
encoder = SentenceTransformer("BAAI/bge-m3")

def hybrid_search(query: str, top_k: int = 10, alpha: float = 0.7) -> list:
    """混合检索：向量 + BM25，加权融合"""

    # 1. 向量检索
    query_vec = encoder.encode(query).tolist()
    vec_results = es.search(
        index="docs",
        knn={
            "field": "embedding",
            "query_vector": query_vec,
            "k": 50,
            "num_candidates": 200,
        },
    )
    vec_scores = {hit["_id"]: hit["_score"] for hit in vec_results["hits"]["hits"]}

    # 2. BM25 检索
    bm25_results = es.search(
        index="docs",
        query={
            "multi_match": {
                "query": query,
                "fields": ["title^2", "content"],
            }
        },
        size=50,
    )
    bm25_scores = {hit["_id"]: hit["_score"] for hit in bm25_results["hits"]["hits"]}

    # 3. 归一化 + 加权融合
    def normalize(scores):
        if not scores:
            return {}
        max_s = max(scores.values())
        min_s = min(scores.values())
        if max_s == min_s:
            return {k: 1.0 for k in scores}
        return {k: (v - min_s) / (max_s - min_s) for k, v in scores.items()}

    vec_norm = normalize(vec_scores)
    bm25_norm = normalize(bm25_scores)

    all_ids = set(vec_norm.keys()) | set(bm25_norm.keys())
    fused_scores = {}
    for doc_id in all_ids:
        vec_s = vec_norm.get(doc_id, 0)
        bm25_s = bm25_norm.get(doc_id, 0)
        fused_scores[doc_id] = alpha * vec_s + (1 - alpha) * bm25_s

    # 4. 排序返回
    ranked = sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
    return ranked

# 使用
results = hybrid_search("Apple iPhone 16 评测", top_k=5)
```

---
