> 本文件是 **05-rag-architecture.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](05-rag-architecture.md)。

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
