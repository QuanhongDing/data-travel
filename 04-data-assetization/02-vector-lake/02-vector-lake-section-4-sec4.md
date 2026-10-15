> 本文件是 **02-vector-lake.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](02-vector-lake.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：规模与 SLA 评估**

- 评估向量规模（百万 / 千万 / 亿 / 十亿）。
- 召回延迟 SLA（10ms / 100ms / 1s）。
- 召回精度 SLA（90% / 95% / 99%）。
- 成本预算。
- 输出：**向量湖需求说明书**。

**Step 2：引擎选型**

- 选向量引擎（Milvus / Pinecone / Qdrant / Weaviate / Vespa / LanceDB）。
- 选索引算法（HNSW / IVF / DiskANN / SPANN）。
- 选压缩策略（FP32 / FP16 / INT8 / PQ）。
- 输出：**技术选型 ADR**。

**Step 3：存储架构**

- 选对象存储（S3 / OSS / MinIO）。
- 选元数据存储（MySQL / PostgreSQL）。
- 选事件流（Kafka / Pulsar）。
- 输出：**存储架构图**。

**Step 4：Embedding Pipeline**

- 选 Embedding 模型（BGE-M3 / OpenAI text-embedding-3）。
- 选调度（Airflow / DolphinScheduler）。
- 离线批量 + 实时流式双链路。
- 输出：**向量化 ETL**。

**Step 5：索引构建**

- 配置分片数（按规模 / QPS）。
- 配置副本数（通常 3）。
- 配置压缩（INT8 / PQ）。
- 配置冷热分层。
- 输出：**可用向量湖**。

**Step 6：检索服务**

- API 化（REST / gRPC）。
- 多路召回（向量 + BM25 + KG）。
- 精排（Cohere Rerank / BGE-reranker）。
- 输出：**检索 API**。

**Step 7：可观测与治理**

- Prometheus / Grafana 监控（QPS / 延迟 / 命中率 / 成本）。
- 数据血缘（向量 → Chunk → 文档）。
- 分类分级 + 权限。
- 输出：**可观测 + 可治理的向量湖**。

### 4.2 关键技术点

1. **存算分离**：Milvus 2.x / Pinecone Serverless / Vespa 模式。
2. **索引算法**：HNSW / IVF / DiskANN / SPANN。
3. **压缩**：INT8 / PQ / RaBitQ。
4. **Sharding**：按 ID Hash / 按向量聚类。
5. **Replication**：3 副本 / Quorum。
6. **冷热分层**：热数据内存 / SSD，温数据 SSD，冷数据归档。
7. **实时更新**：CDC + 流式 Embedding + 增量索引。
8. **多租户**：按业务分库 + 配额。
9. **召回评估**：Recall@K / MRR / nDCG。
10. **成本优化**：量化 + 冷热分层 + Serverless。

### 4.3 工具链与平台

**向量湖引擎**：

- **Milvus**（国产开源）——分布式、存算分离、ANN 丰富。
- **Pinecone**（SaaS）——Serverless、基于 DiskANN。
- **Weaviate**（开源 + SaaS）——模块化、Hybrid Search。
- **Qdrant**（开源）——Rust 实现、高性能。
- **Vespa**（Yahoo 开源）——支持向量 + 表达式 + Hybrid。
- **LanceDB**（2024 开源）——列式向量库、DuckDB 集成。
- **Marqo**（开源）——端到端向量 + 多模态。

**ANN 算法库**：

- **FAISS**（Meta 开源）——最经典的 ANN 库。
- **ScaNN**（Google 开源）——量化 + 各向异性。
- **DiskANN**（Microsoft 开源）——SSD 上的 ANN。
- **SPANN**（Microsoft 开源）——基于 SSD 的近似最近邻。
- **HNSWlib**（开源）——HNSW 实现。
- **Annoy**（Spotify 开源）——随机投影树。

**湖仓 + 向量**：

- **Apache Iceberg** + 向量列。
- **Delta Lake** + 向量（Databricks Vector Search）。
- **Apache Hudi** + 向量。
- **LanceDB + Iceberg**（2024）。

**向量压缩**：

- **PQ**（FAISS / Milvus 内置）。
- **SQ**（Milvus / Qdrant 内置）。
- **RaBitQ**（2024 SOTA）。

**可观测**：

- **Prometheus + Grafana**。
- **Vector Lake Observability**（Milvus Insight、Pinecone Console）。

### 4.4 代码 / 示例

**示例 1：Milvus 分布式部署（Docker Compose）**

```yaml
# Milvus 分布式
version: '3.5'
services:
  etcd:
    image: quay.io/coreos/etcd:v3.5.0
    environment:
      ETCD_AUTO_COMPACTION_MODE: revision
      ETCD_AUTO_COMPACTION_RETENTION: "1000"

  minio:
    image: minio/minio:latest
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    command: minio server /minio_data

  pulsar:
    image: apachepulsar/pulsar:2.8.2

  proxy:
    image: milvusdb/milvus:v2.4.0
    command: ["milvus", "run", "proxy"]
    ports:
      - "19530:19530"

  querynode:
    image: milvusdb/milvus:v2.4.0
    command: ["milvus", "run", "querynode"]
    deploy:
      replicas: 3

  datanode:
    image: milvusdb/milvus:v2.4.0
    command: ["milvus", "run", "datanode"]
    deploy:
      replicas: 3

  indexnode:
    image: milvusdb/milvus:v2.4.0
    command: ["milvus", "run", "indexnode"]
```

**示例 2：Milvus 向量入库 + 检索**

```python
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility
import numpy as np

# 连接 Milvus
connections.connect(host="milvus", port=19530)

# 创建 Collection（十亿级配置）
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1024),
    FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=2048),
    FieldSchema(name="source", dtype=DataType.VARCHAR, max_length=128),
]
schema = CollectionSchema(fields=fields)
collection = Collection("vector_lake", schema)

# 创建 DiskANN 索引（SSD 上十亿级）
collection.create_index(
    field_name="embedding",
    index_params={
        "metric_type": "IP",
        "index_type": "DISKANN",
        "params": {
            "max_degree": 56,        # 每节点最大邻居数
            "search_list_size": 100, # 搜索时候选数
            "PQ_code_budget_gb": 0   # 不使用 PQ
        }
    }
)

# 批量插入（百万级）
embeddings = np.random.rand(1_000_000, 1024).astype('float32')
texts = ["doc_" + str(i) for i in range(1_000_000)]
sources = ["wiki", "ecommerce", "doc"] * (1_000_000 // 3 + 1)
collection.insert([embeddings, texts[:1_000_000], sources[:1_000_000]])

# 加载到内存（querynode）
collection.load()

# 检索
query = np.random.rand(1, 1024).astype('float32')
results = collection.search(
    data=query,
    anns_field="embedding",
    param={"metric_type": "IP", "search_list_size": 100},
    limit=10,
    expr='source == "wiki"',
    output_fields=["text", "source"]
)
for hit in results[0]:
    print(f"id={hit.id}, distance={hit.distance}, text={hit.entity.get('text')[:50]}")
```

**示例 3：LanceDB + DuckDB 湖仓集成**

```python
import lancedb
import pyarrow as pa
import duckdb

# 连接 LanceDB
db = lancedb.connect("s3://lancedb-bucket/vector-lake")

# 创建表（向量列 + 元数据列）
data = pa.table({
    "id": [1, 2, 3, 4, 5],
    "text": ["hello", "world", "foo", "bar", "baz"],
    "embedding": [[0.1]*1024, [0.2]*1024, [0.3]*1024, [0.4]*1024, [0.5]*1024],
    "category": ["greeting", "greeting", "code", "code", "code"],
    "timestamp": [1234567890, 1234567891, 1234567892, 1234567893, 1234567894]
})
table = db.create_table("documents", data=data, mode="overwrite")

# 向量检索
results = table.search([0.15]*1024).limit(3).to_pandas()
print(results)

# DuckDB JOIN（向量 + 结构化）
duck_con = duckdb.connect()
duck_con.execute("INSTALL lance; LOAD lance;")
result = duck_con.execute("""
    SELECT d.id, d.text, d.category
    FROM lance_scan('s3://lancedb-bucket/vector-lake/documents') d
    WHERE d.category = 'code'
    ORDER BY array_distance(d.embedding, [0.15]*1024) ASC
    LIMIT 5
""").fetchall()
print(result)
```

**示例 4：DiskANN 索引构建**

```python
import diskannpy as dap

# 构建 DiskANN 索引（SSD 上十亿级）
vectors = np.random.rand(100_000_000, 768).astype('float32')  # 1 亿向量

# 索引构建参数
index = dap.build_memory_index(
    data=vectors,
    distance_metric="mips",  # 内积
    index_directory="/ssd/diskann_index",
    complexity=64,           # 图复杂度
    graph_degree=32,         # 每个节点最大邻居数
    num_threads=32
)

# 搜索
query = np.random.rand(1, 768).astype('float32')
ids, distances = dap.search(
    query=query,
    index_path="/ssd/diskann_index",
    num_neighbors=10,
    l_search=100             # 搜索候选数
)
print(ids, distances)
```

---
