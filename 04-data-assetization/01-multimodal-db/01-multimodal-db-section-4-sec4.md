> 本文件是 **01-multimodal-db.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](01-multimodal-db.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：模态清点**

- 盘点企业数据模态（文本 / 图像 / 音频 / 视频 / 表格 / 3D）。
- 评估每种模态的规模、增长、价值。
- 输出：**多模态资产清单**。

**Step 2：预处理 Pipeline**

- OCR（PaddleOCR / Tesseract）。
- ASR（Whisper / Paraformer）。
- 抽帧（ffmpeg，1 帧/秒或关键帧）。
- 文档结构化（PyMuPDF / Unstructured）。
- 输出：**结构化 + 文本化的多模态数据**。

**Step 3：Embedding 模型选型**

- 图文：CLIP / OpenCLIP / BGE-VL / Qwen-VL。
- 音文：CLAP / Whisper Embedding。
- 文档：ColPali / LayoutLMv3。
- 视频：VideoCLIP / InternVideo。
- 输出：**多模态向量库**。

**Step 4：存储架构**

- 选向量库（Milvus / Qdrant / Weaviate / pgvector）。
- 原文件存 OSS / S3。
- 元数据存 PostgreSQL。
- 选多模态 DB（SurrealDB / Weaviate）或自建组合。
- 输出：**可检索的多模态数据库**。

**Step 5：检索 Pipeline**

- 跨模态检索（以文搜图 / 以图搜文 / 多模态混合）。
- 元数据过滤（时间 / 来源 / 权限）。
- 精排（CLIP-ViT-L / 多模态 Reranker）。
- 输出：**Top-K 多模态结果**。

**Step 6：多模态 RAG**

- 把检索结果喂给多模态 LLM（GPT-4V / Claude 3.5 / Qwen-VL）。
- 生成答案 + 引用。
- 输出：**多模态问答系统**。

**Step 7：评估与监控**

- 多模态检索评估（Recall@K / mAP）。
- OCR / ASR 准确率评估。
- 端到端问答效果。
- 输出：**评估报告 + 监控大盘**。

### 4.2 关键技术点

1. **多模态 Embedding**：CLIP / ImageBind / Qwen-VL，统一向量空间。
2. **OCR / ASR 工具链**：PaddleOCR / Whisper。
3. **视频处理**：ffmpeg 抽帧、关键帧检测、VideoCLIP / InternVideo Embedding。
4. **向量库**：Milvus / Qdrant / Weaviate / pgvector。
5. **对象存储**：OSS / S3 / MinIO。
6. **多模态 LLM**：GPT-4V / Claude 3.5 Vision / Qwen-VL / InternVL。
7. **元数据管理**：PostgreSQL + 数据目录。
8. **跨模态检索**：统一向量空间 + 元数据过滤。
9. **多模态 Reranker**：CLIP-ViT-L / 多模态 Cross-Encoder。
10. **多模态 RAG**：ColPali / LayoutLMv3 / GPT-4V + RAG。

### 4.3 工具链与平台

**多模态原生数据库**：

- **SurrealDB**（开源）——支持多模态 + 向量 + 图。
- **Weaviate**（开源）——模块化多模态（CLIP / ViT / Bark）。
- **TigerData / TigerGraph**（商业）——多模态图数据库。
- **Aerokog**（开源）——多模态 OLAP。
- **SingleStore**（商业）——多模态 HTAP。

**通用向量库（多模态支持）**：

- **Milvus**（国产开源）——分布式、多模态。
- **Qdrant**（开源）——高性能、支持多模态。
- **Weaviate**（开源）——模块化多模态。
- **Pinecone**（SaaS）——Serverless、多模态。
- **pgvector**（PostgreSQL）——一体化方案。

**文档数据库（多模态支持）**：

- **MongoDB Atlas**（商业 + 云）——支持向量搜索 + 多模态。
- **ArangoDB**（开源）——多模型数据库。
- **Cosmos DB**（Azure）——多模型。

**多模态 Embedding 服务**：

- **OpenAI CLIP / GPT-4V Embedding**（商业）——图文。
- **阿里通义 Qwen-VL**（商业）——中文图文。
- **BGE-VL**（BAAI 开源）——中文图文。
- **Jina CLIP**（开源）——多语言。
- **Cohere Embed v3**（商业）——多语言。
- **Replicate**（SaaS）——多模型 Embedding。

**多模态 RAG 工具**：

- **ColPali**（2024 开源）——多模态文档检索。
- **Unstructured.io**（开源）——多模态文档解析。
- **PaddleOCR + LangChain**（开源）——中文 OCR + RAG。
- **GPT-4V + RAG**（商业）——多模态问答。
- **Qwen-VL + RAG**（阿里）——中文多模态问答。

### 4.4 代码 / 示例

**示例 1：CLIP 图文检索（Python）**

```python
from transformers import CLIPProcessor, CLIPModel
import torch
from PIL import Image

model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-large-patch14")

# 文本查询 → 图像检索
texts = ["a cat", "a dog", "a car"]
images = [Image.open(f"image_{i}.jpg") for i in range(10)]

inputs = processor(text=texts, images=images, return_tensors="pt", padding=True)
outputs = model(**inputs)
logits_per_image = outputs.logits_per_image  # 图像-文本相似度
probs = logits_per_image.softmax(dim=1)  # 概率

for i, image in enumerate(images):
    print(f"Image {i}: {probs[i].tolist()}")
```

**示例 2：Milvus 多模态检索**

```python
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType
import clip
import torch

# 连接 Milvus
connections.connect(host="milvus", port=19530)

# 定义 schema（多模态）
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True),
    FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=512),
    FieldSchema(name="image_path", dtype=DataType.VARCHAR, max_length=256),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=512),
    FieldSchema(name="modality", dtype=DataType.VARCHAR, max_length=16),
    FieldSchema(name="timestamp", dtype=DataType.INT64),
]
schema = CollectionSchema(fields=fields, description="multimodal collection")
collection = Collection("multimodal", schema)

# 创建索引
collection.create_index("embedding", {
    "index_type": "IVF_FLAT",
    "metric_type": "IP",
    "params": {"nlist": 1024}
})

# 用 CLIP 编码图像
model, preprocess = clip.load("ViT-B/32")
image = preprocess(Image.open("image.jpg")).unsqueeze(0)
image_embedding = model.encode_image(image).tolist()[0]

# 插入数据
collection.insert([[1], ["a cat"], ["image.jpg"], [image_embedding], ["image"], [1234567890]])

# 以文搜图
text_embedding = model.encode_text(clip.tokenize(["a cat"])).tolist()[0]
results = collection.search(
    data=[text_embedding],
    anns_field="embedding",
    param={"metric_type": "IP"},
    limit=5,
    expr='modality == "image"'
)
```

**示例 3：多模态文档 RAG（ColPali + LangChain）**

```python
from colpali_engine.models import ColPali
from colpali_engine.indexing import index_documents
from byaldi import RAGRetrieval

# 加载 ColPali 多模态文档检索模型
rag = RAGRetrieval(model="vidore/colpali-v1.2")
rag.index(input_path="documents/", index_name="docs")

# 多模态文档检索
results = rag.search(query="Q3 营收是多少？", k=5)

# 把检索到的页面 + 问题喂给多模态 LLM
from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": [
            {"type": "text", "text": "Q3 营收是多少？请基于以下页面回答："},
            *[{"type": "image_url", "image_url": {"url": r.image_url}} for r in results],
        ]}
    ]
)
print(response.choices[0].message.content)
```

**示例 4：视频 RAG（抽帧 + CLIP）**

```python
import ffmpeg
import clip
import torch
from PIL import Image

# 视频抽帧
stream = ffmpeg.input("video.mp4")
stream = ffmpeg.output(stream, "frame_%04d.jpg", vf="fps=1")  # 1 帧/秒
ffmpeg.run(stream)

# 每帧 CLIP 编码
model, preprocess = clip.load("ViT-B/32")
video_embeddings = []
for i in range(100):
    image = preprocess(Image.open(f"frame_{i:04d}.jpg")).unsqueeze(0)
    embedding = model.encode_image(image)
    video_embeddings.append((i, embedding))

# 入 Milvus
collection.insert([...])

# 文本检索视频
text_emb = model.encode_text(clip.tokenize(["a person running"]))
results = collection.search(data=text_emb.tolist(), anns_field="embedding", limit=5)
# 返回 Top-K 帧 → 拼接成视频片段
```

---
