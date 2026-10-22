# Ch6 · 多模型编排与工具调用

> **一句话定位**：统一接入多个大模型（OpenAI / Anthropic Claude / 国内大模型），按需路由，工具链调度——把"模型"当成可调度资源。

## 画像映射

本章对应 **核心职责③ 多模型编排与工具链调度** + **加分项（OpenAI / Claude 集成）**：

- 多模型统一接入层、标准化工具调用框架
- 按需路由、灵活组合、模型降级与限流
- 国产模型（文心 / 通义 / DeepSeek / 智谱）+ 国外模型（GPT-4 / Claude / Gemini）协同

> P7 会"接一个模型 API"，P8 会"接多模型做容灾"，**资深架构师会把"模型当成可调度资源"**——像调度 Pod 一样调度 LLM。

> **关于本章里的模型名与价格**：本章（以及 Ch5 / Ch9 / Ch10）出现的**具体模型代号、档位、单价、上下文窗口与能力矩阵条目**，都是**易腐项**——它们以 **2024–2025 年**为快照，请按各厂商当前官方文档重核；而**判据与机制**（按 token 而非请求数计量、预扣后结算、归一化的成本形状、路由的门槛与权重之分）**不随快照失效**，可直接照用。两类内容的划分见 [根目录 · 证据快照与时效说明](../README.md)。**读法**：拿判据去核你自己的当前数据，而不是拿书里的数字去用。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：AI 架构师 / 平台架构师 / 算法工程师
- **前置章节**：[Ch5 · AI 智能体平台架构](../05-agent-platform/)（模型编排是 Agent 平台的调度层）
- **后续章节**：[Ch7 · AI 资产沉淀与自进化](../07-agent-evolution/)（自进化需要多模型对比）；[Ch8 · AI 治理与安全](../08-ai-governance/)（模型审计）

## 本章要回答的核心问题

1. **多模型怎么统一接入？** LiteLLM / One-API / 自研统一网关——抽象层、能力映射、API 兼容性？
2. **路由策略怎么设计？** 基于成本 / 延迟 / 能力 / 合规的动态路由——什么时候用 GPT-4，什么时候用 Claude，什么时候用国产模型？
3. **Function Calling / Tool Use 怎么标准化？** JSON Schema 协议、参数校验、错误处理、流式响应？
4. **Prompt 工程怎么做？** 系统提示 / Few-shot / CoT / ReAct——把业务诉求转化为稳定的 Prompt？（见 [§04 Prompt 工程](./04-prompt-engineering/04-prompt-engineering.md)）
5. **Token 成本怎么控制？** 上下文压缩、缓存、批处理、模型分级（小模型做预处理 / 大模型做精排）？
6. **模型降级与限流怎么做？** 多模型容灾、API 限流、配额管理、灰度发布？
7. **模型效果怎么评估？** LLM-as-a-Judge / 人类反馈 / A/B 实验——怎么持续迭代 Prompt 与选型？

## 子主题

- [ ] **[Embedding 与检索](./01-embedding-and-retrieval/README.md)**：Embedding 模型选型（OpenAI / BGE / M3E）、向量检索与重排
- [ ] **[LLM in SQL](02-llm-in-sql/02-llm-in-sql.md)**：在 SQL 引擎中嵌入 LLM（MotherDuck / Snowflake Cortex / Databricks AI Functions）——让数据不出仓
- [ ] **[多模型统一网关与工具协议](03-model-gateway/03-model-gateway.md)**：把"调模型"收成一层——归一化、路由与降级链、凭证托管与出网合规、计量与配额、工具调用标准化、缓存与影子对比
- [ ] **[Prompt 工程](04-prompt-engineering/04-prompt-engineering.md)**：把"业务诉求"翻译成稳定的模型输入——四段结构（判据 / 推理引导 / 示例 / 输出契约）· 分组评测门禁 · 版本与按档位分版本 · 注入防御三层 · 与微调 / RAG 的分工

> 文件命名建议：`embedding-and-retrieval.md` / `llm-in-sql.md` / `unified-model-gateway.md` / `routing-strategy.md` / `function-calling.md` / `prompt-engineering.md` / `cost-control.md` / `model-evaluation.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 搭建多模型统一接入网关（LiteLLM / One-API / 自研），屏蔽厂商差异
- 设计路由策略（成本 / 延迟 / 能力 / 合规），实现按需调度
- 标准化 Function Calling / Tool Use（JSON Schema / 参数校验 / 错误处理）
- 用系统提示 / Few-shot / CoT 等 Prompt 工程技巧提升模型稳定性——[§04](./04-prompt-engineering/04-prompt-engineering.md)
- 控制 Token 成本（上下文压缩 / 缓存 / 批处理 / 按档位路由）——**收益写成可算的形式**：`经济档承接比例 × 单请求价差`（高重复低复杂度任务上经济档通常可承接三到七成流量，取决于你的评测集结论），而不是给一个统一的百分比
- 设计模型降级与限流方案，让系统在大模型故障时仍可用
- 建立 LLM 评估体系（LLM-as-a-Judge / 人类反馈 / A/B），持续迭代 Prompt 与选型
- **把"模型"当成可调度资源**——这是多模型编排的核心思维

## 推荐资料

> **这一节是索引，不是新书单**：下面每一条都是本章四个主题正文里**已经点过名**的材料，按「经典 / 工业材料 / 前沿」三栏归拢到一处，便于按图索骥。本节**只做归拢，不复述评估**——逐条的判据 ①（正式文档 / 发布条目）/ ②（第三方非厂商生产案例）/ ③（接口稳定）与 L1–L3 分级表，写在各自主题的 **§5.1（§01 / §02）/ §5.2（§03 / §04）**，逐条文献与判定入口写在 **§5.4「公开进展与文献」（§01 / §02 主文件为 §5.4，§03 为 §5.4.1，§04 为 §5.3.8）**；面试侧的逐题版本写在四份 **§8 的「5. 参考资料」**段。
>
> **核验方式**：本书不提供链接（无网络环境下的做法一致）。每一条都请**按题名 / 项目名自行检索**，进页面看当前条目——**具体版本与日期一律以页面上的当前条目为准**，不要以正文里记录的快照为准。
>
> **三类问题分三种核法**：核「能力存不存在」看官方文档与函数参考（最快）；核「机制是不是真的」看论文（最慢但最稳）；核「在我这里值不值得做」看各自主题**逐条给出的判定方法**（§01 / §02 在 §5.2，逐条见 §5.2.1–§5.2.4；§03 / §04 在 §5.3，逐条见 §5.3.1–§5.3.7）——**第三类问题没有任何公开材料能替你回答**。
>
> **一条纪律**：本章四个主题的 §5 分级表**没有一行达到 L1**，卡点首先在判据 ②（第三方非厂商的生产案例核不到），但并不都在 ②——§02 的五条 L2 行里有 3 行的 ③ 也不成立，§01 有一条 L2 行的 ① 核不到。所以读这份索引时，请把「有正式条目」读成「**能连上**」，而不是「已验证」。

### 一、经典：机制来源（论文与基础工作）

| 材料（按题名检索） | 本书记的出处 | 本章用到它的主题 |
| --- | --- | --- |
| Word2Vec / GloVe / Transformer / BERT | Mikolov et al.；Stanford；Vaswani et al.；Google | §01 演进历程 §1.4：词向量 → 上下文向量这条前史 |
| *Sentence-BERT*（SBERT） | Reimers & Gurevych, 2019 | §01 §5.4；§02 §5.4：可比较的句向量是「两段式检索」的前提 |
| *ColBERT* / *ColBERTv2* / PLAID | Khattab & Zaharia, SIGIR 2020；Santhanam et al., NAACL 2022 | §01 §5.4、§5.2.3、§7.3：token 级 MaxSim 与残差压缩 |
| HNSW | Malkov & Yashunin（arXiv 2016；TPAMI 年份两节口径不同——§01 §5.4 记 2018，§02 §5.4 记 2020，以论文页当前版本为准） | §01 §5.4；§02 §5.4：图索引的机制来源，也是「索引是有状态的数据结构」的起点 |
| Product Quantization（PQ） | Jégou et al.（IEEE TPAMI 2011） | §01 §5.4、§5.2.4：向量压缩的机制来源，与 LLM 无关 |
| *Matryoshka Representation Learning*（MRL） | Kusupati et al., NeurIPS 2022 | §01 §5.4、§5.2.4：维度可按阶段截断的机制来源 |
| DiskANN / Vamana；ScaNN | Subramanya et al., NeurIPS 2019（及续作）；Guo et al.（Google Research） | §01 §2.3、§7.3.2、§8：磁盘型与各向异性量化两族 ANN |
| BEIR / MTEB / C-MTEB | Thakur et al., NeurIPS 2021；Muennighoff et al., 2022；智源 C-MTEB | §01 §5.4、§8：榜单只用来缩小候选，不用来做结论 |
| *BGE-M3* | Chen et al.（BAAI / 智源） | §01 §5.4、§8：单模型同时输出稠密 / 稀疏 / 多向量三路表示 |
| CLIP / ImageBind | Radford et al., ICML 2021；Girdhar et al., 2023 | §01 §5.2.3、§5.4：跨模态对齐的公开基石 |
| BM25 的概率相关性框架 | Robertson & Zaragoza, 2009 | §01 §5.1 分级表、§5.2.4、§7.2：词项检索这一路的文献与实践起点 |
| RRF（倒数排名融合） | Cormack、Clarke、Buettcher, SIGIR 2009 | §01 §3.2.4、§4.4、§8：多路结果融合的经典做法 |
| RAG 原始论文 | Lewis et al., NeurIPS 2020 | §01 §8：「召回 + 生成」的协同机制 |
| *Self-RAG* / *CRAG* / *Adaptive-RAG* | Asai et al., 2023；Yan et al., 2024；Jeong et al., 2024 | §01 §5.1 分级表、§5.2.2：「是否检索、检索几轮」由模型决策的三篇代表工作 |
| *LLM2Vec* | BehnamGhader et al., 2024 | §01 §5.2.1：把仅解码器 LLM 改造成文本编码器 |
| Spider / BIRD | Yu et al., EMNLP 2018；Li et al., NeurIPS 2023 | §02 §5.4：**基准准确率 ≠ 你的口径准确率** |
| Microsoft Research GraphRAG | Edge et al., 2024（开源实现） | §02 §5.2.4（§5.1 分级表亦有「与 GraphRAG 的结合」行）；§01 §5.1 分级表：「图 + 检索」的可检索入口；它不定义「图侧实体与库侧主键如何交接」 |
| ReAct | Yao et al., ICLR 2023 | §04 §3.2.6、§5.3.8：推理与工具交替的机制来源 |
| *Toolformer* | Schick et al., NeurIPS 2023 | §04 §5.3.8：工具调用从「提示工程」变成「模型能力」 |
| Chain-of-Thought / Self-Consistency / Tree-of-Thoughts | Wei et al., NeurIPS 2022；Wang et al., ICLR 2023；Yao et al., NeurIPS 2023 | §04 §2.2、§5.3.1：CoT 的机制与代价；「推理主体换位」要推翻的正是这一族的前提 |
| GPT-3 的零样本 / 少样本能力与 In-Context Learning | OpenAI, 2020 | §04 §5.3.8：「示例写在提示里」这一旧做法的出处 |
| *"Efficient Few-Shot Learning Without Prompts"*（SetFit） | Tunstall et al., 2022 | §04 §5.3.8：「免提示词的少样本」这条对照路线 |
| *RAGAS* | Es et al., arXiv 2023 | §04 §5.3.8；§01 §8：解决「自动评测怎么算」，不解决「闭环该不该自动替换线上提示」 |
| PagedAttention | Kwon et al., SOSP 2023 | §03 §5.4.1；§04 §5.3.8：前缀缓存能命中的机制来源；§02 §5.1 分级表、§5.2.3：自托管推理通路的公开载体 |
| 连续批处理（*Orca*） | OSDI 2022（本书只给论文名与会议，不补作者） | §03 §5.4.1：**成本侧分母**的机制来源——与 §03 §5.3.4 缺的**质量侧分母**不是一回事 |

### 二、工业材料：标准 / 官方文档 / 开源项目（各主题 §5 的「判定入口」）

**标准与合规**

- **Model Context Protocol（MCP）规范**——由 Anthropic 于 2024 年公开并开源，规范以带日期的修订版本发布（§03 §5.3.2、§5.4.1；§04 §5.3.8 记为 2024 年 11 月）。核验：进规范页看工具 / 资源 / 提示三段的当前定义；**它约定的是「工具与上下文如何描述」，不解决「提示能不能跨模型移植」**。
- **OWASP LLM Top 10 / NIST AI RMF**（§02 §8 的 §21.8.5 / §21.8.7 参考资料）：AI 安全的合规框架，按题名检索官方页面。
- **GDPR / 等保 2.0 /《数据安全法》/《个人信息保护法》**（§02 §1.2、§8 的 §21.8.5）：合规要求的权威出处。判据是**「请求发往谁的机器」**，不是「模型是否开源」。

**官方文档 / 发布说明（判定入口）**

- **OpenAI Structured Outputs / Anthropic Tool Use（Function Calling）官方文档**（§04 §5.3.8；另见 `01-modeling/README.md` 推荐资料里的「2024–2025 前沿」清单与 `04-data-assetization/10-metric-platform` 的 §8）：核验结构化输出**是不是解码层能力**、支持列表里有没有你要用的那一档端点。
- **Anthropic 的 prompt caching 文档与定价页**（§03 §5.3.3；§04 §5.3.8）：核验命中如何计费、最小可缓存长度与生效范围——**折扣幅度与计费口径本书不给数**，一律按定价页当前版本复核。
- **OpenAI Batch API 文档与定价页**（§04 §5.3.8）：它与缓存是**两条独立的成本杠杆**，不要互相替代。
- **OpenAI text-embedding-3 官方文档**、**Cohere Embed v3 与 Rerank 官方文档**、**BGE-M3 与各开源 embedding 的模型卡**、**Sentence-Transformers 官方文档**（§01 §5.2.1、§5.4、§8）：核验可缩短输出维度、输入类型是否必填、可编码长度与「超出长度时如何截断」。
- **ColBERT / PLAID / ColPali 的项目页**、**MTEB / C-MTEB 榜单页面**（§01 §5.1、§5.4）：前者核多向量索引的存储与压缩方式，后者核「哪些模型在哪些任务上靠前」——名次会变，不要当结论。
- **向量库官方文档：Milvus / Qdrant / Weaviate / pgvector / Pinecone**（§01 §5.4、§8）：核验内置 Hybrid、量化档位与 GPU 索引是不是**该版本的正式条目**，而不是预览或路线图。
- **各平台 SQL 函数参考**：Snowflake 的 Cortex 函数族 / Databricks 的 `ai_query` 一类函数 / BigQuery 的 ML 函数族 / 阿里 MaxCompute 的 AI UDF / PostgreSQL 的 pgai / ClickHouse 与 DuckDB 的 AI 函数扩展（§02 §5.4）。判定方法是在函数参考里找三样：**模型标识是否必填、计费是否按 token 单列、模型不可用时返回什么**（第三样最容易缺失，缺失就按「会静默写入坏数据」来设计）。**函数名各不相同，不要互相套用。**
- **pgvector CHANGELOG**（§02 §5.4）：核验「向量索引建在仓内」这一侧是否已 GA、接口是否跨多个主版本未变。
- **开源网关族（LiteLLM / One-API）与商业 / 云厂商接入层（Kong 的 AI 插件 / Portkey / Cloudflare AI Gateway）**（§03 §5.4.1；同族口径另见 `04-data-assetization/07-data-api-gateway` 的 §7 候选表）：三个判定点——对外是否暴露一套统一的请求 / 响应 / 错误结构、路由与回退是否以配置表达、用量是「记录」还是「按租户预扣并结算」。
- **语义缓存的公开实现 GPTCache**（§03 §5.4.1）：核验它的缓存键能不能配上「条件 + 身份维度」、有没有「错误复用」的发现手段。
- **评测与观测侧**：HELM / OpenAI Evals / Anthropic Evals / lm-evaluation-harness（§04 §5.3.8，落点见 `02-data-science/07-eval` 的「LLM 评估框架」行）；LangChain Hub / Dust.tt / PromptLayer；Langfuse / Helicone / Arize Phoenix（§04 §5.3.8，落点见 `07-agent-evolution/03-asset-management` 的 §1.3 与 `07-agent-evolution/02-feedback-loop` 的 §4.3）。两条判据：**能不能按模型 / prompt 版本分桶看指标、能不能接 CI**。
- **DSPy 一类框架**（§04 §5.3.8）：★ 特别注明——全书只把它列在工具链表里，**既没有发布条目也没有年份**，这正是它停在 L3 的原因；不要因为它「是个框架」就当成能力证据。
- **指标语义层：dbt Semantic Layer / Cube.js / MetricFlow**（§02 §2.3）：自然语言查询的主件是语义层，模型只是接口。
- **合规脱敏工具 Microsoft Presidio**（§02 §8 的 §21.8.5）：PII 入模前脱敏的工业级实现参考。

**开源项目**

- **FAISS（Meta）/ DiskANN（微软）/ ANN-Benchmarks**（§01 §8.2）：IVF + PQ 与 DiskANN 系列的工业实现与横评。
- **vLLM / SGLang / Ollama 的版本化发布记录**（§02 §5.1 分级表、§5.4；§03 §5.3.3）：核验自动前缀缓存（vLLM 的 prefix caching、SGLang 的 radix attention 一类）——**看 release note 里有没有独立条目，而不是看项目官网的路线图或 benchmark 博客**。
- **RAPIDS 生态的 RAFT / cuVS（含 Milvus 的 CAGRA）**（§01 §5.2.4、§8.2）：GPU 侧 ANN 的项目文档；判定入口是项目名，不是性能页。

### 三、前沿：2024–2025 快照里的具名条目（**易腐项，本节只登记名字与落点**）

> **本节刻意不复制任何单价、向量维度、上下文长度与榜单名次**——它们正是本章开头那条「关于本章里的模型名与价格」提示所指的对象。需要用时，按模型卡 / 定价页 / 榜单页的**当前版本**重核，并按各自主题**逐条给出的判定方法**（§01 / §02 见 §5.2，§03 / §04 见 §5.3）在**你自己的评测集**上验一次。

- **Embedding 与重排侧**（§01 §1.4 演进线、§2.3、§5.4）：Snowflake Arctic Embed、Nomic Embed Text v1.5、Jina Embeddings v3、Cohere Embed v3、Cohere Rerank 3、BGE Reranker v2-m3、mixedbread Rerank、mxbai-embed-large、GTE-Qwen2；模型侧的 **ColPali**（Late Interaction 用于文档图像）。
- **检索与结构侧**（§01 §5.1 分级表：Microsoft GraphRAG 与 **LightRAG**；§02 §5.1 分级表、§5.2.4：Microsoft GraphRAG）——图与向量两条链路的边界**至今无约定**，判 L3；先判断问题是否需要多跳。
- **库内 AI 函数族**（§02 §1.4、§5.1 分级表、§5.4）：Snowflake Cortex 与 Cortex Analyst、Databricks AI Functions 与 Genie、Databricks Mosaic AI、阿里云 PolarDB AI、PostgreSQL 的 pgai、阿里云 PAI / 腾讯 TI / 火山方舟一类托管推理。它们**大多有正式条目（判据 ① 成立），但换一家产品就要重写 SQL（判据 ③ 不成立）**，且同样缺判据 ②。
- **接入层与提示侧**（§03 §5.2 分级表；§04 §5.2 分级表）：本章判为 L2 / L3 的语义缓存、成本感知路由、能力矩阵自动探测、推理型模型的提示形态、按评测自动搜索提示、跨供应商可移植——**这些是「方向」，不是「材料」**，证据成色并不齐：语义缓存与推理型模型的提示形态判据 ① 成立（前者判定入口见上面的 GPTCache 与 §03 §5.3.3 记的 Anthropic prompt caching 文档，后者见 §04 §5.2 的供应商文档一行），成本感知路由、能力矩阵自动探测、按评测自动搜索提示、跨供应商可移植只有产品功能、演示或局部实践。§04 §5.3.8 结尾把其中四条明写成「全书核不到具名文档 + 年份」，与这里列出的六项**不是同一集合**。

### 学习路径建议

1. **先读 [§03 多模型统一网关](./03-model-gateway/03-model-gateway.md)**——它是「把模型当可调度资源」那一层，判据最硬：**换模型可以不改代码（只改配置）**。它的 §5.7 列了不依赖任何前沿判断就该先做的三件事（能力矩阵、凭证托管、计量记账点），先做这三件。
2. **再读 [§01 Embedding 与检索](./01-embedding-and-retrieval/01-embedding-and-retrieval.md)**——它的 §5.1 明写有三件「不在前沿分级表里、却是后面每一行评估前提」的事：**建自有评测集、把召回指标与排序指标分开测、算清索引内存账**。这三件没做完，表里的 L2 与 L3 差别只体现在演示里。
3. **然后读 [§02 LLM in SQL](./02-llm-in-sql/02-llm-in-sql.md)**——按它 §5.7 的排序走：先定边界（数据能不能离开引擎）→ 再压行数（谓词下推与增量键）→ 然后登记版本（**模型版本与提示版本**）→ 最后才谈智能体与「统一接口」。
4. **最后读 [§04 Prompt 工程](./04-prompt-engineering/04-prompt-engineering.md)**——它的 §5.7 把「今年就该做」的四件事列在不依赖前沿判断的一档：**一批门禁样本 + 提示四段化 + 版本与 Owner + 分组评测**；§5.7 第 5 条另给了一条反直觉动作（**先删提示，再写提示**）。
5. **面试准备**：四份 §8 都按「考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料」五段式写——**[§01 §8](./01-embedding-and-retrieval/01-embedding-and-retrieval-section-8-sec8.md) · [§02 §8](./02-llm-in-sql/02-llm-in-sql-section-8-sec8.md) · [§03 §8](./03-model-gateway/03-model-gateway-section-8-sec8.md) · [§04 §8](./04-prompt-engineering/04-prompt-engineering-section-8-sec8.md)**，其「参考资料」段就是本节这张索引的逐题版。
6. **要跟进前沿**：四个主题的 §5 各有一张**分级表 + 一张可证伪的预测表**（§01 / §02 的预测表列「会成真的信号 / 会证伪的信号」两栏，§03 / §04 只列「被证伪的信号」一栏）。用法是**每隔半年回来看一次「被证伪的信号」有没有出现**，而不是拿它做技术选型——预测成立不等于对你有收益。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch7 · AI 资产沉淀与自进化](../07-agent-evolution/) 学习自进化闭环
- 进入 [Ch8 · AI 治理与安全](../08-ai-governance/) 学习模型审计与合规
