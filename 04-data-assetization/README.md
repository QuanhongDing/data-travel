# Ch4 · 企业级数据资产化与智能检索

> **一句话定位**：把企业私有多源异构数据（文档 / 代码 / 报表 / 音视频）转化为可被 AI 检索的语义资产。

## 画像映射

本章对应 **核心职责② 企业私有数据资产化与智能检索**：

- 多源异构数据（文档 / 代码 / 报表 / 音视频）的统一清洗、结构化、语义化编码
- 基于向量数据库构建高可用语义索引体系
- 召回 + 精排 + 生成的端到端 RAG 架构

> P7 会"做 RAG demo"，P8 会"调 Embedding"，**资深数据架构师会"建语义资产体系"**——让企业私有数据变成 AI 可消费的知识。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：AI 架构师 / 数据架构师 / 知识图谱工程师
- **前置章节**：[Ch1 · 建模方法论](../01-modeling/)（图谱建模）；[Ch2 · 数据科学与算法](../02-data-science/)（Embedding 选型）
- **后续章节**：[Ch5 · AI 智能体平台架构](../05-agent-platform/)（RAG 是 Agent 的核心能力）；[Ch8 · AI 治理与安全](../08-ai-governance/)（资产治理是安全的前置）

## 本章要回答的核心问题

1. **多源异构数据怎么统一清洗？** 文档（PDF / Word / Markdown）/ 代码（Python / Java / SQL）/ 报表（Excel / 仪表盘）/ 音视频——不同模态的预处理链路？
2. **向量化与语义编码怎么选型？** OpenAI text-embedding-3 / BGE / M3E / CLIP / CLAP——不同模态的 Embedding 选型？
3. **Chunking 策略怎么设计？** 固定窗口 / 滑动窗口 / 语义切分 / 结构感知切分——如何平衡召回率与上下文完整度？
4. **向量数据库 vs AI 原生数据库怎么选？** 专有向量库（Milvus / Pinecone / Weaviate / Qdrant）vs PostgreSQL + pgvector / DuckDB VSS？
5. **RAG 架构怎么演进？** 朴素 RAG → 高级 RAG（Query Rewrite / Reranker / HyDE）→ Agentic RAG——什么时候用哪个？
6. **混合检索怎么设计？** BM25 + 向量 + 知识图谱 + 规则——如何融合多路召回？
7. **元数据与数据目录怎么治理？** DataHub / Apache Atlas / 阿里 DataWorks——资产怎么"可发现"？

## 子主题

- [ ] **[多模态数据库](./01-multimodal-db/README.md)**：文档 / 音视频 / 图文的统一存储与检索
- [ ] **[向量湖](./02-vector-lake/README.md)**：Iceberg + 向量列 / Milvus 集群——向量数据的湖仓化
- [ ] **[AI 原生数据库](./03-ai-native-db/README.md)**：PostgreSQL + pgvector / DuckDB VSS / TiDB Vector——把向量当成一等公民
- [ ] **[混合检索](./04-hybrid-search/README.md)**：BM25 + 向量 + 知识图谱——多路召回与精排
- [ ] **[RAG 架构](05-rag-architecture/05-rag-architecture.md)**：朴素 RAG / 高级 RAG / Agentic RAG——端到端检索增强生成
- [ ] **[OneService 数据服务化](06-one-service/06-one-service.md)**：阿里中台 OneService 思想——指标 / 标签 / API 的统一服务
- [ ] **[数据 API 网关](07-data-api-gateway/07-data-api-gateway.md)**：限流 / 鉴权 / 计量 / 缓存——数据 API 的统一入口
- [ ] **[数据目录](08-data-catalog/08-data-catalog.md)**：DataHub / Atlas / DataWorks——资产的可发现与可理解
- [ ] **[统一查询网关](./09-unified-query-gateway/README.md)**：跨源联邦查询（Trino / Presto + 向量库 + 图库）
- [ ] **[指标平台](./10-metric-platform/README.md)**：原子指标 / 派生指标 / 指标服务化——数据资产化的核心载体

> 文件命名建议：`multimodal-db.md` / `vector-lake.md` / `ai-native-db.md` / `hybrid-search.md` / `rag-architecture.md` / `one-service.md` / `data-api-gateway.md` / `data-catalog.md` / `unified-query-gateway.md` / `metric-platform.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 设计多源异构数据的统一预处理链路（清洗 → 切分 → 嵌入 → 入库）
- 在专有向量库与 AI 原生数据库之间做出正确的选型决策
- 搭建 RAG 架构的端到端链路（嵌入 / 索引 / 召回 / 精排 / 生成）
- 选型 Chunking 策略（固定 / 滑动 / 语义 / 结构感知），并评估 Recall@K
- 用 Reranker / HyDE / Query Rewrite 提升高级 RAG 效果
- 设计数据 API 网关（限流 / 鉴权 / 计量 / 缓存），让数据资产可服务化
- 搭建数据目录与元数据治理体系，让资产"可发现、可理解、可信任"
- **让企业私有数据变成 AI 可消费的知识**——这是 AI 时代数据架构师的核心能力

## 推荐资料

> 本节的性质是**索引**：下面每一个条目都能回到本章各主题的原始出处——§1.4 演进历程、§4.3 工具链、§5.4 公开进展与文献、§8 题解；这里按「经典书目 / 工业材料·官方文档 / 机制论文与公开基准（早于 2024）/ 2024–2025 前沿」**四栏**归拢到一处，末尾再附**一节**学习路径，便于按图索骥。少数只在全书别处成条的书目，已在对应行内单独注明落点。
> 受无网络环境限制，本节不给外部链接：每条材料的核验入口只有一个——**按题名 / 产品名自行检索**论文库或官方文档的**当前版本**。本章各主题 §5.4 与 §8 的清单同样只给条目、不给链接，逐条的核验动作写在 §5.4 里。
> 分工上，**证据等级**（【公开】/【经验】）与「这条材料支撑哪一条结论」都在各主题 §5.4 里判定，本节不重复判定，只负责归拢与给出检索入口。§5.4 里标为「空白」的那一类（第三方非厂商生产案例），本节同样不补——空白是结论，不是缺项。
> 栏位说明：分层按条目的**最终发表 / 公开年份**——最终版本早于 2024 的机制论文与公开基准塞进「前沿」会错标年份，故单列「机制论文与公开基准（早于 2024）」一栏；预印本早一年、正式版在 2024 年刊出的（如 Self-RAG）留在前沿栏。

### 经典书目（数据资产化与检索基石）

| 书 | 作者（书内署名） | 重点章节 | 阅读建议 |
| --- | --- | --- | --- |
| 《大数据之路：阿里巴巴大数据实践》 | 阿里巴巴数据技术团队 | OneData / OneService / OneMetric、实时数仓 | 本章第 6 / 7 / 9 / 10 四个主题的方法论源头，国内「口径先于实现」的成书出处。按书名自行检索 |
| 《DAMA-DMBOK2 数据管理知识体系指南》 | DAMA | 元数据分类（业务 / 技术 / 操作） | 元数据分类的国际标准基准；国内对照是《大数据之路》的「技术 + 业务 + 管理」三分。按书名自行检索 |
| *Data Mesh: Delivering Data-Driven Value at Scale* | Zhamak Dehghani | 域内元数据自治、数据产品 | 「权威源留在域内」的理论前提，配 [08 §7.2](./08-data-catalog/08-data-catalog-section-7-sec7.md) 的候选方案全景表（九类候选）读。按书名自行检索 |
| *Designing Data-Intensive Applications* | Martin Kleppmann | 第 4 章 Encoding and Evolution；第 12 章 The Future of Data Systems | 数据服务对外契约的设计原则。注意书内已声明：第 12 章讲的是分布式数据系统，**不是**「AI 时代的数据架构」的出处。按书名自行检索 |
| *Fundamentals of Data Engineering* | Joe Reis & Matt Housley | 数据工程选型与生命周期 | 打底读物，补「资产从哪来」这一段；Ch1 书单未收此书，书内落点是 [Ch99 §9.1](../99-outro/03-trends/03-trends-section-9-sec9.md)「AI Native 数据架构类」与 [01 · 模型管理 §8](../01-modeling/11-model-management/11-model-management-section-8-sec8.md) 的参考资料（本章主题未展开）。按书名自行检索 |
| *Building the Data Lakehouse* | Bill Inmon 等 | 湖仓一体方法论 | 与 [02-vector-lake](./02-vector-lake/README.md) 对照读：表格式持权威数据、检索层做缓存这一分工；本书目仅见于全书别处的 [Ch99 §9.1](../99-outro/03-trends/03-trends-section-9-sec9.md)（本章主题未展开）。按书名自行检索 |
| *Big Data: Principles and Best Practices of Scalable Realtime Data Systems* | Nathan Marz | 服务层（Serving Layer）归并 | Lambda 的原始定义，是本章「统一数据服务」与批流一体的对照基线；批评面见下栏 Jay Kreps《Questioning the Lambda Architecture》。按书名自行检索 |
| *Trino: The Definitive Guide* | Matt Fuller / Manfred Moser / Martin Traverso | 第 5 章 Connectors and Pushdowns；第 14 章 Resource Management | [09-unified-query-gateway](./09-unified-query-gateway/README.md) 的两条主干（下推能力、资源上界）。书内对「某章专写 AI 负载」的说法已标为**待核**，读前先核对目录 |
| *Stream Processing with Apache Flink* | Fabian Hueske & Vasiliki Kalavri | 流处理语义与状态 | 批流一体的工程教材，配合本章 06 / 08 两主题的湖仓部分。按书名自行检索 |
| *Patterns of Enterprise Application Architecture* | Martin Fowler | Data Access Object / Repository | 数据虚拟化思想的早期形式；读它是为了分清「虚拟化」与「搬运」 |
| *RESTful Web APIs* | Richardson & Amundsen | 资源建模与版本化 | [07-data-api-gateway](./07-data-api-gateway/07-data-api-gateway.md) 的接口设计原则来源 |
| *AI Engineering* | Chip Huyen | RAG / 评估 / Agent 的工程化 | 把本章的检索能力接进 LLM 应用时的补充读物（书单亦见 [Ch99 §9.1](../99-outro/03-trends/03-trends-section-9-sec9.md)） |

### 工业材料 / 官方文档（判定入口）

这一类是「去哪查」，不是进展断言。凡本身带年份的照写年份；持续更新的产品文档只给文档名与核验位置——这一条在 [02 §5.4](./02-vector-lake/02-vector-lake-section-5-ai.md) 与 [08 §5.4](./08-data-catalog/08-data-catalog-section-5-ai.md) 是**显式声明的例外**（不写死年份，是因为同一页面在不同时间检索到的内容并不相同）。下面每组标出该组条目在本章的**出处主题**；逐条的**证据等级与核验动作**见对应主题的 §5.4，落点见其 §8 题解（个别在 §1.4 演进历程、§3 机制节或 §4.3 工具链）。

**向量库与检索栈**（章内出处主题：本章 01 / 02 / 03 / 09）

- Milvus 官方文档与 release note / CHANGELOG：核角色拆分（日志 / 对象存储 / 查询与索引节点）与「面向磁盘的索引」是否为一等索引类型。按产品名查其官方文档当前版本
- Vespa 官方文档的向量检索与 rank profile 章节、《Hybrid Search》页；Weaviate 官方文档《Hybrid search》章节与 release note（2024 年起）：核「融合发生在引擎内还是调用方」「多向量字段是否一等索引类型」。按文档名自行检索
- LanceDB / Lance 格式文档（格式规范、版本化两节）：列式格式如何同时承载向量与标量。按文档名自行检索
- Pinecone 关于 Serverless 架构的公开材料（2024）：核「存储与计算分离、索引落对象存储」。按题名自行检索
- pgvector CHANGELOG（0.5 / 2023、0.7 / 2024、0.8 / 2024 三条）+ PostgreSQL 官方文档的 MVCC 与 VACUUM 章节：向量进通用库的能力节点、以及索引膨胀与死点的来源。按文档名自行检索
- Oracle 23ai 的《AI Vector Search User's Guide》与《JSON Relational Duality Developer's Guide》、Snowflake Cortex（函数族与 Cortex Search）、Databricks `ai_query` 与 Vector Search、BigQuery ML 函数族、阿里 MaxCompute AI UDF、TiDB Vector、TigerData（TimescaleDB）、SingleStore 8.0：只用来核「该能力叫什么、在哪个版本进入正式可用」，**不转述其性能声称**；判定动作是在文档里找齐「向量类型 / ANN 索引 / 距离函数」三条。按产品名查其函数参考与发布说明
- Oracle 23ai / SurrealDB / SingleStore 的「原生多模型」与 PostgreSQL「类型堆叠」的区分：核同一执行器是否安排过滤与近邻的先后。按官方的多模型章节自行检索

**湖仓、表格式与元数据治理**（章内出处主题：本章 02 / 06 / 08）

- Databricks《Lakehouse Platform》白皮书、阿里云《MaxCompute 湖仓一体白皮书》、Apache Iceberg / Apache Hudi 官方文档（并发控制章节）——判定「索引与表格式谁持有」。Delta Lake 的设计论文（VLDB 2020）属机制材料，列在下栏「数据系统侧」。按文档名 / 题名自行检索
- Apache Gravitino：判定入口是 Apache 项目状态页与 release 节奏（孵化 / 毕业状态以状态页为准）；同类还有 AWS Lake Formation、Google Cloud Dataplex。按项目名查其状态页
- DataHub 的元数据事件模型与血缘章节（项目 2019 年开源、2021 年的 2.0 见 [08 §1.4](./08-data-catalog/08-data-catalog.md) 演进历程）、OpenMetadata 采集框架文档（2021 年开源）、Apache Atlas 的分类 / 血缘文档（2015 起）、Unity Catalog 能力文档与 2024 年开源公告：核「事件驱动」「分类分级」是否为一等设计。按文档名自行检索
- 阿里 DataWorks（含通义侧）、Snowflake Horizon Catalog、Atlan AI / Secoda AI / Alation AI（2024–2025 区间）：检索点是「目录 + 自然语言 / AI 检索」的**正式条目**，判据是「预览还是 GA」，不是效果文案
- 图谱式目录的公开样本是 Lyft 开源的 Amundsen（2019，血缘走 Neo4j、资产检索走 Elasticsearch），形态见 [08 §7.2](./08-data-catalog/08-data-catalog-section-7-sec7.md) 的候选方案全景表。按项目名自行检索
- 法规侧：《网络安全法》《数据安全法》《个人信息保护法》（PIPL）、《数据出境安全评估办法》，以及 PCI-DSS / HIPAA 的差异对照。本章落点：[08 §8](./08-data-catalog/08-data-catalog-section-8-sec8.md) 的合规对照表与 [06 §8-17-1](./06-one-service/06-one-service-section-8-17-1-基础概念与架构理解.md) 的跨境条款。按法规名查官方发布版本

**联邦查询、网关与协议**（章内出处主题：本章 07 / 09）

- Trino 官方文档的三个独立主题：Connector / Pushdown、Resource Groups、Fault-tolerant execution；Apache Calcite 官网对自身的定位（「SQL 解析、校验与优化的框架」，本身不存数据）。按文档名自行检索
- Model Context Protocol 规范（Anthropic，2024 年公开并开源，规范以带日期的版本号发布）；OWASP LLM 应用风险清单（2023 年首版，其后有修订版本）；OpenAPI / GraphQL 规范（GraphQL 2015 年开源、2018 年起由 GraphQL Foundation 托管）。本章落点：[07 §5.4](./07-data-api-gateway/07-data-api-gateway-section-5-ai.md) 的规范条例目与 [07 §3.2.6](./07-data-api-gateway/07-data-api-gateway-section-3-sec3.md) 的 GraphQL 批量解析判据。按规范名查官方规范页的版本与日期
- Kong 的 AI 插件、Apache APISIX 的 AI 插件、Envoy 的 AI 项目 / 扩展、Cloudflare AI Gateway 与 Workers AI、Portkey：一律**按各项目 release note 核版本与发布日期**，不按其首页文案。按产品名查其开发者文档

**语义层与指标**（章内出处主题：本章 06 / 10）

- dbt Semantic Layer 与其指标定义引擎 MetricFlow、Cube（前身 Cube.js）的官方文档与仓库：核「指标定义 / 维度约束 / 权限」三件事各写在哪一节，以及「指标 API 的对外形态」是否为正式条目。按项目名查其文档站与仓库 tag
- 《Minerva: Building a Scalable Metrics Platform》（Airbnb 工程博客，2020 年前后）：指标定义与查询分离的早期工程样本，属建设方自述
- 阿里 Quick BI、腾讯 BI、百度 BI 的 AI 能力：查 GA 版本与语义暴露位置，不采纳其效果数字

**评估、精排与框架文档**（章内出处主题：本章 02 / 04 / 05）

- RAGAS（2023 年起开源，方法论文 2024 年发表）与 TruLens 的文档与指标定义：跨框架比较前先核对「忠实性」的定义是否一致
- MIRACL 公开基准（评测方法学）、LangChain 的《MultiQueryRetriever》页与 LlamaIndex 的 `QueryFusionRetriever` 文档、Cohere 的 Rerank 3 模型卡与《Rerank》API 文档（2024）、Jina Reranker 模型卡：核接口形态与限额，不引用其效果数字
- Microsoft GraphRAG 开源仓库文档：索引构建流程与成本提示，是判断「建图属于流水线还是建索引步骤」的依据

### 机制论文与公开基准（早于 2024）

- **检索与融合**：Cormack / Clarke / Buettcher《Reciprocal Rank Fusion…》（SIGIR 2009，含 k 的经验常数）；Robertson & Zaragoza《The Probabilistic Relevance Framework: BM25 and Beyond》（2009）；ColBERT（SIGIR 2020）与 ColBERTv2（NAACL 2022）；SPLADE（SIGIR 2021，SPLADE++ 为其后续工作）；BEIR（NeurIPS 2021 Datasets and Benchmarks Track）；HyDE（Gao 等，arXiv 2022 / ACL 2023，把查询改写成一份假想答案再检索）。按题名查论文库
- **ANN 与量化**：Malkov & Yashunin 的 HNSW 原始论文（arXiv 2016 / IEEE TPAMI）；DiskANN（NeurIPS 2019）；SPANN（NeurIPS 2021）；Guo 等《Accelerating Large-Scale Inference with Anisotropic Vector Quantization》（Google Research，2020）与 ScaNN 开源实现。按题名查论文库
- **多模态与切分**：CLIP（Radford 等，ICML 2021）；ImageBind（Girdhar 等，CVPR 2023）；《Lost in the Middle》（Liu 等，2023）；Greg Kamradt《5 Levels of Text Splitting》（2023）；Leiden 社区检测（Traag 等，2019，GraphRAG 建图的常用划分方法）。按题名查论文库
- **RAG 与数据侧公开基准**：RAG 原始论文（Lewis 等，NeurIPS 2020）；Sherlock 字段语义类型识别（Hulsebos 等，KDD 2019）；Spider（EMNLP 2018）；BIRD（Li 等，NeurIPS 2023 Datasets and Benchmarks，Text-to-SQL 基准）。按题名查论文库
- **数据系统侧**：《Presto: SQL on Everything》（ICDE 2019，落点 [09 §8](./09-unified-query-gateway/09-unified-query-gateway-section-8-sec8.md)）；《Structured Streaming: A Declarative API…》（SIGMOD 2018，落点 [08 §8](./08-data-catalog/08-data-catalog-section-8-sec8.md)）；《Delta Lake: High-Performance ACID Table Storage over Cloud Object Stores》（VLDB 2020，落点 [06 §8-6-6](./06-one-service/06-one-service-section-8-6-6-spark-与数据湖集成及-lambda-架构.md)）；Jay Kreps《Questioning the Lambda Architecture》（Kappa 的原始论述，同见 [07 §8](./07-data-api-gateway/07-data-api-gateway-section-8-sec8.md)）。按题名查论文库

### 2024–2025 前沿（论文 / 项目）

- **多模态文档检索**：ColPali（Faysse 等，arXiv 2024，免 OCR 的页面级多向量检索）；InternVL 系列与 Qwen 系列 VL 版本的技术报告与模型卡（读 2024 年的版本：InternVL2 / Qwen2-VL，首批报告早于 2024，见本章 01 §5.4）。按题名查论文库与模型卡
- **量化与表示**：RaBitQ（SIGMOD 2024，量化误差界）；BGE M3-Embedding（BAAI Chen 等，2024，一个模型出三种表示）；NV-Embed（NVIDIA，2024）。**具体维度与语言数以模型卡为准**，按题名自行检索
- **查询期理解**：Step-Back（Zheng 等，ICLR 2024）——把查询抽象到上位问题再检索这条路线；查询改写一侧的 HyDE 按最终年份归入上栏「检索与融合」。按题名查论文库
- **RAG 演进与图增强**：Self-RAG（ICLR 2024）、CRAG（2024 预印本）、Modular RAG（GAIR Lab，2024 预印本，把 RAG 拆成索引 / 检索 / 重排 / 生成 / 反馈五模块）、LightRAG 与 HippoRAG（2024 预印本）、Microsoft GraphRAG（2024 起开源）。按题名查论文库与项目仓库
- **切分**：Jina AI《Late Chunking: Contextual Chunking Using Long Embeddings》（2024，先对整篇做 Embedding 再按 chunk 切向量，保留跨段落上下文）。按题名自行检索
- **文档形态的例外**：SurrealDB 2.x（2024）与 Weaviate 1.28+（2024）的「模块化多模态」是**版本级说法**，本节不把它们当能力事实——判定入口是各自的 release note，不要用首页文案作判据。按产品名查 release note

### 学习路径建议

下面按「先立资产、再立检索、最后服务化」的依赖顺序排；每一档只给**读什么 + 读哪里**，不给天数——本节没有可核验的工期来源。

1. **资产与口径的起点**：《DAMA-DMBOK2》的元数据分类 + 《大数据之路》的 OneData / OneMetric 章节 → [08-data-catalog](./08-data-catalog/08-data-catalog.md)、[10-metric-platform](./10-metric-platform/README.md)
2. **存储底座三选一**：先 [03-ai-native-db](./03-ai-native-db/README.md)（向量进通用库）→ 再 [02-vector-lake](./02-vector-lake/README.md)（介质下移）→ 再看 [01-multimodal-db](./01-multimodal-db/README.md)（多模态是否真需要）。索引机制的原始出处见上栏 HNSW / DiskANN / SPANN 三条
3. **检索质量**：[04-hybrid-search](./04-hybrid-search/README.md) + RRF / ColBERTv2 / SPLADE / BGE M3-Embedding 四篇；判「某引擎的混合检索到底做了什么」看引擎官方文档的排名融合专章
4. **端到端链路**：[05-rag-architecture](./05-rag-architecture/05-rag-architecture.md) + RAG 原始论文 / Self-RAG / CRAG / GraphRAG；chunking 先读《5 Levels of Text Splitting》与 ColPali 两条
5. **服务化与入口**：[06-one-service](./06-one-service/06-one-service.md)、[07-data-api-gateway](./07-data-api-gateway/07-data-api-gateway.md) + 《大数据之路》OneService 章节与 MCP / OWASP 两份规范
6. **跨源与治理**：[09-unified-query-gateway](./09-unified-query-gateway/README.md)（Trino 文档三节）+ 回到 [08-data-catalog](./08-data-catalog/08-data-catalog.md)；治理合规衔接 [Ch8 · AI 治理与安全](../08-ai-governance/)
7. **时间预算**：本节不给「1–2 周」这类天数。书内已有的口径只有 [Ch99 · 01-future-plans §7.2](../99-outro/01-future-plans/01-future-plans-section-7-sec7.md) 分族表里的「工程细节族」一行——**每本 8–20 小时**【经验】；§7.4 再把它折算进时间账。两者都是**区间量级，不是承诺**

> 逐条材料的完整清单（含证据等级与核验动作）在各主题 §5.4「公开进展与文献」，例如 [04 混合检索 §5.4](./04-hybrid-search/04-hybrid-search-section-5-ai.md)；本节不再给外部链接，按题名 / 产品名检索当前版本即可。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch5 · AI 智能体平台架构](../05-agent-platform/) 学习 Agent 平台
- 进入 [Ch6 · 多模型编排与工具调用](../06-multi-model/) 学习多模型协同
