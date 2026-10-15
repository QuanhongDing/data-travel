> 本文件是 **08-data-catalog.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](08-data-catalog.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：需求与边界**

- 明确目录覆盖范围（数仓 / 湖仓 / DB / API / 文档）。
- 评估用户（业务 / 数据 / AI）。
- 输出：**目录需求说明书**。

**Step 2：元数据模型设计**

- 设计 Asset 模型（Table / Field / API / MLModel / Dashboard）。
- 设计 Lineage 模型。
- 设计 Tag / Owner / Classification 模型。
- 输出：**元数据 Schema**。

**Step 3：元数据采集**

- 数据库直连采集 schema。
- ETL 解析采集血缘。
- Query Log 采集使用模式。
- 事件流采集元数据变更。
- 输出：**完整的元数据库**。

**Step 4：业务元数据补充**

- 推动 Owner 填写业务文档。
- 用 LLM 自动生成字段说明。
- 业务方评审 + 确认。
- 输出：**业务元数据**。

**Step 5：分类分级与权限**

- 按敏感度分类分级。
- 配置访问权限。
- 配置脱敏规则。
- 输出：**合规元数据**。

**Step 6：血缘构建**

- 字段级血缘解析。
- 血缘可视化。
- 血缘影响分析。
- 输出：**完整血缘图**。

**Step 7：搜索与发现**

- 关键词搜索（Elasticsearch）。
- 语义搜索（向量）。
- 自然语言搜索（LLM）。
- 输出：**可发现的目录**。

**Step 8：AI 增强**

- 集成 LLM（自然语言问答）。
- 自动文档生成。
- 资产推荐。
- 输出：**AI 原生目录**。

**Step 9：治理集成**

- 与 OneService 打通（API 元数据同步）。
- 与数据 API 网关打通（权限同步）。
- 与可观测打通（使用模式分析）。
- 输出：**一体化数据治理平台**。

### 4.2 关键技术点

1. **元数据采集**：JDBC Hook、Spark Listener、Flink Hook、Airflow Plugin、Presto Plugin。
2. **血缘解析**：SQL Parser（Calcite、sqlparse）、字段依赖分析、跨语言血缘。
3. **存储后端**：MySQL（资产元数据）、Elasticsearch（搜索）、Neo4j（血缘）、Kafka（事件流）。
4. **搜索**：倒排索引 + 向量检索 + LLM 意图理解。
5. **分类分级**：正则 + 字段名匹配 + LLM 判断 + 人工确认。
6. **自动文档**：LLM 基于样例数据 + 表名 + 查询模式生成。
7. **自然语言搜索**：LLM + 资产向量库 + Re-ranking。
8. **权限集成**：与 ABAC / RBAC 打通。
9. **可视化**：血缘图、资产地图、影响分析。
10. **资产评分**：使用频次 + 关键性 + 质量 + 合规风险。

### 4.3 工具链与平台

**开源数据目录**：

- **DataHub**（LinkedIn 开源）——事实标准，事件驱动架构。
- **Apache Atlas**（Apache 开源）——Hadoop 生态元数据。
- **OpenMetadata**（开源）——统一元数据平台。
- **Amundsen**（Lyft 开源）——基于 Neo4j + ES。
- **Metacat**（Netflix 开源）——大数据元数据。

**云厂商数据目录**：

- **AWS Glue Data Catalog**——AWS 生态。
- **Azure Purview / Microsoft Purview**——Azure 生态。
- **Google Cloud Data Catalog**——GCP 生态。
- **阿里云 DataWorks 元数据**——阿里生态。
- **腾讯云 DataTalk**——腾讯生态。
- **华为云 DataArts Catalog**——华为生态。

**湖仓一体目录**：

- **Unity Catalog**（Databricks）——Databricks 生态。
- **Lakehouse Catalog**（Apache）——开源湖仓目录。
- **Gravitino**（Apache 2024）——腾讯开源湖仓元数据。

**商业数据目录**：

- **Collibra**（商业）——企业数据目录领导者。
- **Informatica EDC**（商业）——传统数据治理。
- **Alation**（商业）——AI 增强数据目录。
- **Atlan**（商业）——现代数据目录。
- **Secoda**（商业）——AI 增强。
- **Monte Carlo**（商业）——数据可观测 + 目录。

**AI 增强目录工具**：

- **Secoda AI**（2024）——自然语言搜索。
- **Atlan AI**（2024）——自动文档生成。
- **Alation AI**（2024）——资产问答。
- **阿里 DataWorks + 通义**（2024）——国内 AI 目录。
- **百度数据地图 + 文心**（2024）——国内 AI 目录。

### 4.4 代码 / 示例

**示例 1：DataHub 采集 MySQL 元数据**

```yaml
# DataHub ingestion recipe
source:
  type: mysql
  config:
    host_port: mysql:3306
    database: ecommerce
    username: datahub
    password: ${MYSQL_PASSWORD}

sink:
  type: datahub-rest
  config:
    server: http://datahub-gms:8080
    token: ${DATAHUB_TOKEN}

pipeline_name: mysql_ingestion
```

**示例 2：OpenMetadata 自动采集血缘**

```python
from metadata.ingestion.ometa import OpenMetadata
from metadata.ingestion.source.database.mysql import MysqlSource

# 自动采集 schema + 血缘
client = OpenMetadata(
    host="http://openmetadata:8585",
    auth_provider="openmetadata",
    secret_key="secret"
)

source = MysqlSource(
    service_name="ecommerce",
    host_port="mysql:3306",
    database="ecommerce"
)

# 自动采集字段血缘
source.next_lineage()
```

**示例 3：自然语言搜索（LangChain + DataHub）**

```python
from langchain.chat_models import ChatOpenAI
from langchain.vectorstores import Milvus
from langchain.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA

# 加载 DataHub 资产元数据到向量库
embedding = OpenAIEmbeddings()
vectorstore = Milvus.from_documents(asset_docs, embedding, connection_args={"host": "milvus"})

# 自然语言搜索
qa = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4o"),
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
    return_source_documents=True
)

result = qa.invoke("找包含用户手机号的表")
print(result["result"])
# 输出：包含字段 phone、mobile、cellphone 的表：users、orders、customer_service
```

**示例 4：自动文档生成（LLM）**

```python
from langchain.chat_models import ChatOpenAI
from sqlalchemy import create_engine, inspect

llm = ChatOpenAI(model="gpt-4o")
engine = create_engine("postgresql://user:pass@localhost/ecommerce")
inspector = inspect(engine)

for table_name in inspector.get_table_names():
    columns = inspector.get_columns(table_name)
    sample = engine.execute(f"SELECT * FROM {table_name} LIMIT 5").fetchall()
    
    prompt = f"""
    表名：{table_name}
    字段：{[c['name'] for c in columns]}
    样例数据：{sample}
    
    请生成该表的业务描述（用途、字段含义、典型查询示例）：
    """
    
    description = llm.invoke(prompt).content
    print(f"{table_name}: {description}")
```

---
