> 本文件是 **04-hybrid-search.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](04-hybrid-search.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：召回需求分析**

- 评估数据集规模。
- 评估查询类型（语义 / 精确 / 多跳）。
- 评估 SLA（召回率 / 延迟）。
- 输出：**混合检索需求说明书**。

**Step 2：召回模型选型**

- Embedding 模型（BGE-M3 / OpenAI / Cohere）。
- BM25 引擎（Elasticsearch / OpenSearch）。
- KG 引擎（Neo4j / NebulaGraph）。
- 输出：**技术选型**。

**Step 3：召回 Pipeline**

- 向量召回（Milvus / Pinecone / pgvector）。
- BM25 召回（Elasticsearch）。
- KG 召回（Cypher / SPARQL）。
- 元数据过滤。
- 输出：**多路召回**。

**Step 4：融合策略**

- 选融合算法（RRF / 加权）。
- 设权重（初始等权，逐步调优）。
- 输出：**融合 Pipeline**。

**Step 5：精排**

- 选 Reranker（Cohere Rerank 3 / BGE-reranker / ColBERT）。
- 召回 Top-100 → 精排 Top-10。
- 输出：**精排结果**。

**Step 6：Query 理解**

- Query Rewrite（LLM）。
- HyDE（LLM 假写答案再检索）。
- Step-Back（抽象再检索）。
- 输出：**优化后的查询**。

**Step 7：评测体系**

- 构建评测集（1000+ query + ground truth）。
- Recall@K / MRR / nDCG 自动评测。
- A/B 测试。
- 输出：**评测报告**。

**Step 8：上线与监控**

- 灰度发布。
- 监控（召回率 / 延迟 / 成本）。
- 持续优化。
- 输出：**生产级混合检索**。

### 4.2 关键技术点

1. **BM25 引擎**：Elasticsearch / OpenSearch / Meilisearch。
2. **向量引擎**：Milvus / Qdrant / Weaviate / pgvector。
3. **KG 引擎**：Neo4j / NebulaGraph。
4. **Embedding 模型**：BGE-M3 / OpenAI text-embedding-3 / Cohere Embed v3。
5. **Reranker**：Cohere Rerank 3 / BGE-reranker / ColBERTv2。
6. **融合算法**：RRF（首选）/ 加权 / Condorcet。
7. **Query 理解**：Query Rewrite / HyDE / Step-Back。
8. **元数据过滤**：时间 / 权限 / 来源。
9. **评测**：Recall@K / MRR / nDCG。
10. **缓存**：相同 query 缓存结果。

### 4.3 工具链与平台

**混合检索框架**：

- **LangChain**（开源）—— 主流 LLM 编排，支持多路召回 + RRF。
- **LlamaIndex**（开源）—— RAG 专用，支持混合检索。
- **Haystack**（deepset 开源）—— 工业级 RAG。
- **DSPy**（Stanford 开源）—— 自动 Prompt + 优化。
- **Vespa**（Yahoo 开源）—— 一体化向量 + BM25 + Hybrid。
- **Weaviate**（开源）—— 内置 Hybrid Search。

**向量库**：

- Milvus / Qdrant / Weaviate / Pinecone / pgvector / LanceDB（详见 [02-vector-lake](../02-vector-lake/02-vector-lake.md)）。

**BM25 引擎**：

- **Elasticsearch**（开源）—— BM25 事实标准。
- **OpenSearch**（AWS 开源）—— ES 分支。
- **Meilisearch**（开源）—— 轻量 BM25。
- **Typesense**（开源）—— 轻量 BM25。

**Embedding 服务**：

- **BGE-M3**（BAAI 开源）—— 多功能 SOTA。
- **OpenAI text-embedding-3**（商业）—— 通用。
- **Cohere Embed v3**（商业）—— 多语言。
- **Jina Embeddings v3**（商业）—— 多语言。
- **通义 Embedding**（阿里商业）—— 中文。
- **文心 Embedding**（百度商业）—— 中文。

**Rerank 服务**：

- **Cohere Rerank 3**（商业）—— 多语言 SOTA。
- **BGE-reranker-v2**（BAAI 开源）—— 中文 SOTA。
- **Jina Rerank**（商业）—— 多语言。
- **ColBERTv2**（开源）—— 晚交互。
- **RankZephyr**（开源）—— 学术 Rerank。

### 4.4 代码 / 示例

**示例 1：LangChain + RRF 混合检索**

```python
from langchain.retrievers import BM25Retriever, EnsembleRetriever
from langchain.retrievers.document_compressors import CohereRerank
from langchain.retrievers import ContextualCompressionRetriever
from langchain.embeddings import HuggingFaceBgeEmbeddings
from langchain.vectorstores import Milvus
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 1. 加载 + Chunking
loader = PyPDFLoader("company.pdf")
docs = loader.load()
splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=64)
chunks = splitter.split_documents(docs)

# 2. Embedding + 向量库
embedding = HuggingFaceBgeEmbeddings(model_name="BAAI/bge-m3")
vectorstore = Milvus.from_documents(chunks, embedding, connection_args={"host": "milvus"})

# 3. 双路召回（向量 + BM25）
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
bm25_retriever = BM25Retriever.from_documents(chunks)
bm25_retriever.k = 10

# 4. RRF 融合
ensemble_retriever = EnsembleRetriever(
    retrievers=[vector_retriever, bm25_retriever],
    weights=[0.6, 0.4]  # 加权融合，RRF 自动
)

# 5. Reranker（精排）
compressor = CohereRerank(model="rerank-multilingual-v3.0", top_n=5)
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=ensemble_retriever
)

# 6. 检索
results = compression_retriever.get_relevant_documents("公司年假政策")
for doc in results:
    print(doc.page_content[:100])
```

**示例 2：BGE-M3 多功能 Embedding**

```python
from FlagEmbedding import BGEM3FlagModel

# 加载 BGE-M3
model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)

# 同时输出 dense / sparse / colbert 三种向量
texts = ["hello world", "goodbye world"]
output = model.encode(texts, return_dense=True, return_sparse=True, return_colbert_vecs=True)

# dense 向量（语义检索）
dense_vecs = output['dense_vecs']

# sparse 向量（BM25-like）
sparse_vecs = output['sparse_vecs']

# colbert 向量（晚交互）
colbert_vecs = output['colbert_vecs']

# dense + sparse 融合检索
from scipy.sparse import csr_matrix
import numpy as np

# sparse 转倒排索引
def sparse_to_dict(sparse):
    indices = sparse.nonzero()
    return {idx: val for idx, val in zip(indices[1], sparse[indices])}

# 融合分数
def hybrid_score(dense_query, sparse_query, dense_doc, sparse_doc, alpha=0.5):
    dense_score = np.dot(dense_query, dense_doc)
    sparse_score = sum(
        sparse_query.get(k, 0) * sparse_doc.get(k, 0)
        for k in set(sparse_query) & set(sparse_doc)
    )
    return alpha * dense_score + (1 - alpha) * sparse_score
```

**示例 3：Weaviate Hybrid Search**

```python
import weaviate

client = weaviate.Client("http://weaviate:8080")

# Hybrid Search（内置 RRF 融合）
result = (
    client.query
    .get("Document", ["title", "content", "source"])
    .with_hybrid(
        query="公司年假政策",
        alpha=0.6,  # 向量权重（0=纯 BM25，1=纯向量）
        fusion_type="relativeScore"  # RRF / relativeScore
    )
    .with_limit(10)
    .do()
)

for doc in result["data"]["Get"]["Document"]:
    print(f"{doc['title']}: {doc['content'][:100]}")
```

**示例 4：Vespa 混合检索 + Late Interaction**

```python
from vespa.application import Vespa
from vespa.io import VespaQueryResponse

app = Vespa(url="http://vespa:8080")

# Vespa 同时支持 BM25 + ColBERT + Rerank
result = app.query(
    yql="select * from documents where ({targetHits:100}nearestNeighbor(embedding,q)) or ({targetHits:100}userQuery())",
    ranking="hybrid_colbert_rerank",
    query="公司年假政策",
    hits=10
)
print(result.hits)
```

**示例 5：手写 RRF 融合**

```python
def rrf(rankings, k=60):
    """rankings: {retriever_name: [doc_id, ...]}"""
    scores = {}
    for retriever, docs in rankings.items():
        for rank, doc_id in enumerate(docs, start=1):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
    return sorted(scores.items(), key=lambda x: -x[1])

# 示例：向量召回 + BM25 召回
vector_ranking = ["doc1", "doc3", "doc2", "doc5"]  # 向量召回的排名
bm25_ranking = ["doc2", "doc1", "doc4", "doc5"]    # BM25 召回的排名

rankings = {
    "vector": vector_ranking,
    "bm25": bm25_ranking
}

fused = rrf(rankings)
print(fused)  # [(doc1, 0.032), (doc2, 0.031), ...]
```

---
