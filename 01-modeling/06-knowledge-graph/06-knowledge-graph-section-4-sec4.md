> 本文件是 **06-knowledge-graph.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](06-knowledge-graph.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务边界与领域识别**

- 圈定 KG 要覆盖的业务域（建议从一个域开始，如「客户域」「产品域」）。
- 识别核心实体类型（5-30 个起步）。
- 识别核心关系类型（10-50 个起步）。
- 输出：**KG 范围说明书（KG Requirements Specification, KGRS）**。

**Step 2：Schema 设计**

- 设计实体类型 / 关系类型 / 属性。
- 优先复用本体（FOAF、Schema.org、FIBO、SNOMED CT、UFO 等）。
- 决定用 RDF 三元组模型还是属性图模型（Cypher 风格）。
- 决定本体驱动 vs 开放抽取策略。
- 输出：**KG Schema（OWL 或 Cypher DDL）**。

**Step 3：数据源识别与对接**

- 列出所有相关数据源（业务库、数仓、日志、文档、API、第三方）。
- 评估每个数据源的「KG 可抽取价值」。
- 设计 ETL 链路：从数据源 → 中间层 → KG 实例。
- 决定是批处理（Airflow / DolphinScheduler）还是流处理（Flink / Kafka Streams）。

**Step 4：抽取 pipeline 构建**

- 实体识别（NER）：基于规则 / ML / LLM。
- 关系抽取（RE）：基于规则 / ML / LLM。
- 实体链接（Entity Linking）：基于字符串 / 嵌入 / LLM。
- 属性对齐（Property Alignment）：跨源 schema 对齐。
- 输出：**候选三元组集合**。

**Step 5：质量校验**

- 语法校验：三元组是否符合 schema。
- 语义校验：SHACL、本体约束、reasoner 校验。
- 业务校验：专家抽检（10% 抽样）、业务规则校验。
- 输出：**可信三元组集合 + 校验报告**。

**Step 6：图存储与索引**

- 选择图数据库（Neo4j / NebulaGraph / TigerGraph / JanusGraph / Stardog）。
- 设计数据模型（属性图 / RDF 三元组）。
- 建立索引（按实体类型、关系类型、关键属性）。
- 配置副本、分片、备份策略。
- 输出：**可用的 KG 存储**。

**Step 7：查询与推理**

- 暴露 Cypher / SPARQL / GQL endpoint。
- 配置图算法（PageRank、Community Detection、Path）。
- 集成 KG Embedding / GNN 模型（推荐 / 风控 / 反欺诈）。
- 输出：**KG 服务**。

**Step 8：发布到下游**

- BI / 数据分析应用。
- AI 应用（GraphRAG、QA、推荐、风控）。
- 数据目录 / 血缘（KG 形式）。
- 输出：**KG 应用矩阵**。

### 4.2 关键技术点

1. **图数据库选型**：Neo4j（OLTP 之王，生态丰富）、NebulaGraph（国产开源，大数据量）、TigerGraph（高性能 OLAP）、Stardog（语义网 / RDF / OWL）、TigerGraph（金融风控首选）、JanusGraph（Hadoop 生态）、阿里云 GraphScope（一站式）、蚂蚁 TuGraph（国产金融级）。
2. **属性图 vs RDF 三元组**：属性图（Cypher）适合 OLTP 查询；RDF / OWL 适合语义推理；多数工业级 KG 用属性图。
3. **KG Embedding 模型**：TransE（基础）、RotatE（2019 SOTA）、ComplEx（对称关系）、R-GCN（多关系）。
4. **抽取 pipeline 架构**：LLM 抽取 + 规则校验 + Reasoner 验证 + SHACL 校验四步流水线。
5. **实体合并（Entity Resolution）**：基于规则（字符串相似度）、基于嵌入（向量近邻）、基于图（Graph-based ER）。
6. **图数据库性能调优**：索引、缓存、分片、副本、查询计划。亿级数据查询应在秒级。
7. **混合查询**：图查询 + 向量召回（Hybrid Query），Cypher + 向量索引（Neo4j 5+ 内置向量索引）。
8. **图可视化**：Neo4j Browser、Neovis.js、GraphXR、Cambridge Intelligence。
9. **KG 治理**：Owner 制度、版本管理、变更评审、质量 SLA（KG 准确率 > 95%、覆盖率 > 80%）。
10. **LLM 增强抽取**：Few-shot prompting、Self-Verification、Chain-of-Thought、Tool-Use（让 LLM 调用 NER / RE 工具）。

### 4.3 工具链与平台

**图数据库**：

- **Neo4j**（商业 + 社区版）——OLTP 图数据库事实标准，Cypher 原生、Causal Cluster、高可用。
- **NebulaGraph**（国产开源）——分布式图数据库，擅长大数据量 OLTP/OLAP，nGQL 兼容 Cypher。
- **TigerGraph**（商业）——原生并行图数据库，金融风控首选，性能最强之一。
- **Stardog**（商业）——RDF / OWL / SHACL 全支持，语义网 KG 首选。
- **GraphDB**（Ontotext 商业）——欧洲主流 RDF 三元组库，推理能力强。
- **Amazon Neptune**（云）——AWS 托管图数据库，支持 RDF + 属性图。
- **阿里云 GraphScope**（国产）——阿里一站式图计算平台，集成图存储 + 图计算。
- **蚂蚁 TuGraph**（国产）——金融级分布式图数据库，蚂蚁集团开源。
- **JanusGraph**（Linux Foundation 开源）——基于 Hadoop / Cassandra 的分布式图数据库。
- **Apache HugeGraph**（百度开源）——百度开源图数据库，国产开源典范。

**抽取工具**：

- **Stanford NER / CoreNLP**——经典 NER 工具（规则 + CRF）。
- **spaCy**——工业级 NLP 库，NER 速度快。
- **Hugging Face Transformers**——BERT / RoBERTa / SpanBERT 系列 NER / RE 模型。
- **Deepdive**——斯坦福知识抽取框架，远程监督。
- **Snorkel**——弱监督学习，远程监督的进阶版。
- **OpenNRE**——清华开源关系抽取工具包。
- **OntoGPT / DeepOnto**——LLM 辅助本体 / KG 构建（2024+）。

**KG Embedding / GNN 框架**：

- **PyTorch Geometric（PyG）**——主流 GNN 库。
- **DGL（Deep Graph Library）**——AWS / NYU 联合开发，GNN 另一主流选择。
- **OpenKE**——清华开源知识图谱嵌入工具包（TransE / TransR / RotatE 等）。
- **AmpliGraph**——基于 TensorFlow 的 KG Embedding 库。
- **PyKEEN**——基于 PyTorch 的 KG Embedding 库（2024 主流）。

**LLM + KG 集成（2024-2025）**：

- **LangChain** + Neo4j 集成（`langchain-neo4j`）。
- **LlamaIndex** + NebulaGraph / Neo4j 集成。
- **Microsoft GraphRAG**——本体 + KG + RAG 工业级实现。
- **Neo4j LLM Knowledge Graph Builder**（2024）——自然语言直接构建 KG。
- **Neo4j + Vector Index**（2024）——原生混合查询。
- **NebulaGraph + LLM 集成**（2024）——国产开源方案。

**可视化**：

- **Neo4j Browser / Bloom**——Neo4j 原生可视化。
- **Neovis.js**——基于 Vis.js 的 Neo4j 可视化。
- **GraphXR**——3D 图可视化。
- **Cambridge Intelligence**——商业图可视化（KeyLines / ReGraph）。

**质量评估**：

- **Shape Inspector**（Stardog SHACL）。
- **Neo4j Data Quality**（Neo4j 5+ 内置）。

### 4.4 代码 / 示例

**示例 1：Neo4j Cypher - 客户-订单-商品图谱建模**

```cypher
// 创建约束
CREATE CONSTRAINT customer_id IF NOT EXISTS FOR (c:Customer) REQUIRE c.customer_id IS UNIQUE;
CREATE CONSTRAINT product_id IF NOT EXISTS FOR (p:Product) REQUIRE p.product_id IS UNIQUE;
CREATE CONSTRAINT order_id IF NOT EXISTS FOR (o:Order) REQUIRE o.order_id IS UNIQUE;

// 创建节点
CREATE (alice:Customer {customer_id: 'C001', name: 'Alice', age: 30, city: 'Beijing'});
CREATE (bob:Customer {customer_id: 'C002', name: 'Bob', age: 25, city: 'Shanghai'});
CREATE (iphone:Product {product_id: 'P001', name: 'iPhone 15', price: 12999, category: 'Electronics'});
CREATE (airpods:Product {product_id: 'P002', name: 'AirPods Pro', price: 1999, category: 'Electronics'});

// 创建关系
CREATE (o1:Order {order_id: 'O001', placed_at: datetime('2025-10-08T10:00:00'), amount: 14998});
MATCH (a:Customer {customer_id: 'C001'}), (o:Order {order_id: 'O001'}) CREATE (a)-[:PLACED]->(o);
MATCH (o:Order {order_id: 'O001'}), (p:Product {product_id: 'P001'}) CREATE (o)-[:CONTAINS {quantity: 1}]->(p);
MATCH (o:Order {order_id: 'O001'}), (p:Product {product_id: 'P002'}) CREATE (o)-[:CONTAINS {quantity: 1}]->(p);
MATCH (b:Customer {customer_id: 'C002'}), (a:Customer {customer_id: 'C001'}) CREATE (b)-[:REFERRED_BY]->(a);
```

**示例 2：复杂图查询（Cypher / 多跳推理）**

```cypher
// 找到 Alice 的「朋友的朋友」购买的商品（即 2 度关联商品的推荐）
MATCH (alice:Customer {name: 'Alice'})-[:REFERRED_BY]-(friend)-[:PLACED]->(order)-[:CONTAINS]->(product)
WHERE NOT (alice)-[:PLACED]->(:Order)-[:CONTAINS]->(product)
RETURN DISTINCT product.name AS recommendation, count(*) AS score
ORDER BY score DESC LIMIT 10;

// 找到疑似欺诈模式：同一设备在 1 小时内多账户登录
MATCH (d:Device)<-[:LOGIN_FROM]-(c1:Customer), (d)<-[:LOGIN_FROM]-(c2:Customer)
WHERE c1 <> c2 AND c1.created_at > datetime() - duration({ hours: 1 })
RETURN d.device_id, collect(DISTINCT c1.customer_id) AS suspicious_customers;
```

**示例 3：KG Embedding（PyKEEN 训练 RotatE）**

```python
from pykeen.pipeline import pipeline
from pykeen.datasets import Wikidata5M

# 加载数据集
dataset = Wikidata5M()

# 训练 RotatE 模型
result = pipeline(
    model='RotatE',
    dataset=dataset,
    training_kwargs={'num_epochs': 100},
    optimizer='Adam',
    optimizer_kwargs={'lr': 1e-3},
    evaluator='RankBasedEvaluator',
    random_seed=42,
)

# 使用训练好的模型做链接预测
from pykeen.predict import predict_triples
predictions = predict_triples(
    model=result.model,
    triples=dataset.validation.mapped_triples,
    k=10,
)
print(predictions.df.head(10))
```

**示例 4：LLM 抽取三元组（Python / LangChain）**

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

llm = ChatOpenAI(model="gpt-4", temperature=0)

prompt = ChatPromptTemplate.from_template("""
请从以下文本中抽取实体和关系，遵循 schema：
- 实体类型：Customer, Order, Product
- 关系类型：PLACED (Customer->Order), CONTAINS (Order->Product), REFERRED_BY (Customer->Customer)

文本：{text}

输出 JSON：
{{"entities": [{{"type": "Customer|Order|Product", "name": "...", "attrs": {{}} }}],
  "relations": [{{"type": "PLACED|CONTAINS|REFERRED_BY", "from": "...", "to": "..."}}]}}
""")

result = llm.invoke(prompt.format_messages(text="Alice 在 2025 年 10 月 8 日下了一笔订单，包含 iPhone 15 和 AirPods Pro。这是由 Bob 推荐的。"))
# 进一步用 SHACL / Reasoner 校验后入 KG
```

---
