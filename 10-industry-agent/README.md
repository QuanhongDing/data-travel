# Ch10 · 行业智能体

> **一句话定位**：把通用 AI 变成**懂行业的 AI**——行业情报 / 代码助手 / 办公自动化的垂直行业智能体。

## 画像映射

本章对应 **核心职责⑤ 行业情报智能体与精准分发** + **加分项（行业 AI 智能体 / 代码智能助手 / 自动化办公平台）**：

- 7×24h 自动化情报采集 / 清洗 / 语义分类 / AI 摘要 / 个性化推送 —— 见 [§02 行业情报智能体](02-industry-intelligence-agent/02-industry-intelligence-agent.md)
- 代码智能助手（类似 Cursor / Copilot）、自动化办公平台 —— 见 [§03 代码智能助手](03-code-intelligence-assistant/03-code-intelligence-assistant.md) 与 [§04 办公自动化智能体](04-office-automation-agent/04-office-automation-agent.md)
- 行业知识图谱、行业 Prompt 工程、行业评估体系 —— 本章不单列主题，做法分别落在 [Ch1 §06 知识图谱构建](../01-modeling/06-knowledge-graph/06-knowledge-graph.md)、各主题 §4 的模板与提示示例、[Ch2 §07 效果评估](../02-data-science/07-eval/07-eval.md)
- 行业 Agent 协作（Multi-Agent）—— 本章不单列主题：多 Agent 仲裁在本书按判据评为 L3（无通行做法），见 [Ch5 §02 平台架构的前沿演进一节](../05-agent-platform/02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md)

> P7 会"做 Agent"，P8 会"做垂直 Agent"，**资深架构师会"做行业智能体平台"**——把通用能力变成行业生产力。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：AI 架构师 / 行业专家 + 技术 Leader
- **前置章节**：[Ch5 · AI 智能体平台架构](../05-agent-platform/)（行业 Agent 建立在通用 Agent 之上）；[Ch9 · 数据智能产品](../09-data-intelligence-product/)（行业产品化的基础）
- **后续章节**：[Ch11 · 横切工程](../11-cross-cutting/)（行业级可观测）；[Ch15 · 案例库](../15-case-studies/)（看真实行业案例）

## 本章要回答的核心问题

1. **行业知识图谱怎么构建？** ——**本书不按行业给出实体关系建模差异**（金融 / 医疗 / 制造 / 半导体的行业事实无公开可溯源材料，本书不编）。本章给的是**可迁移的构建方法与判据**，见 [Ch1 §06 知识图谱构建](../01-modeling/06-knowledge-graph/06-knowledge-graph.md)；行业特有的实体与关系需你从自有业务语料中抽取。
2. **行业情报智能体怎么搭建？** 7×24h 采集、清洗、分类、摘要、推送——端到端情报流水线？
3. **行业 Prompt 怎么设计？** 行业术语、行业规范、行业禁忌——把通用 Prompt 变成行业 Prompt？**本书给的是改造流程与判据，不给具体行业的术语表与禁忌清单**（术语 / 规范 / 禁忌是行业事实，只能从你的业务语料与评审驳回记录里积累，本书不编）。三格可判定的口径：术语挂在**领域词表**上（跨语言还要给专有名词音译建别名表）、规范落成**可校验的硬规则**而不是写在提示里的一句话、禁忌落成**对外分发前的强制过滤**而不是靠人记得。三格的**形态**在书内各有落点（是形态，不是行业内容）：术语挂领域词表的形态见 [§01 §4.5 模板 4（Whisper）](01-multimodal-ai/01-multimodal-ai-section-4-sec4.md):285 的 `initial_prompt` 一格，跨语言音译别名表见 [§02 §8](02-industry-intelligence-agent/02-industry-intelligence-agent-section-8-sec8.md):177；规范落硬规则的形态见 [§02 §4.2（6）摘要模板与事实性回查](02-industry-intelligence-agent/02-industry-intelligence-agent-section-4-sec4.md):102 的三条硬规则（① 回查不通过的数字一律剔除）；禁忌落强制过滤的最近形态是 [§02 §4.2（7）分发与频控](02-industry-intelligence-agent/02-industry-intelligence-agent-section-4-sec4.md):116 与 [§02 §4.5 模板 3](02-industry-intelligence-agent/02-industry-intelligence-agent-section-4-sec4.md):219 的 `suppressed_reason`（分发前抑制 + 留痕）——**它落的是频控判据，不是内容禁忌清单**，书内没有内容禁忌的过滤落点。
4. **行业评估体系怎么搭？** 行业准确性、合规性、可解释性——如何量化"懂行"的程度？**本书给的是评估口径的搭法**（把通用指标迁到行业轴上），**不给具体行业的准确率基线**——基线只能由你自己的标注样本产出。
5. **代码智能助手怎么实现？** 类似 Cursor / Copilot——代码补全、代码生成、代码审查、Code Agent？
6. **自动化办公平台怎么设计？** 文档处理 / 流程审批 / 数据录入 / 跨系统集成——让 AI 替代重复性工作？
7. **多模态 AI 怎么落地？** 文 / 图 / 音 / 视频 / 3D——多模态理解与生成的工程化？

## 子主题

- [ ] **[多模态 AI](./01-multimodal-ai/README.md)**：文 / 图 / 音 / 视频 / 3D——多模态理解与生成的工程化
- [ ] **[行业情报智能体](02-industry-intelligence-agent/02-industry-intelligence-agent.md)**：7×24 情报链路——信源清单与授权边界、增量与断供检测、事件簇去重、带引用回指的摘要、频控与个性化分发、反馈回流
- [ ] **[代码智能助手](03-code-intelligence-assistant/03-code-intelligence-assistant.md)**：以仓库为语料——补全的延迟与接受率、符号与引用索引、上下文预算、审查的规则与模型分工、沙箱验证、私有代码不出域
- [ ] **[办公自动化智能体](04-office-automation-agent/04-office-automation-agent.md)**：文档结构抽取与字段级置信度、流程状态机与审批留痕、幂等与补偿动作、RPA 与 Agent 的分工、权限与出网合规、介入率与返工率

> 文件命名建议：`multimodal-ai.md` / `industry-intelligence-agent.md` / `code-intelligence-assistant.md` / `office-automation.md` / `industry-knowledge-graph.md` / `industry-prompt-engineering.md` / `industry-evaluation.md` / `multi-agent-collaboration.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 构建行业知识图谱**的方法与判据**（行业特有的实体与关系需从自有业务语料抽取——本书不按行业给实体清单）
- 搭建行业情报智能体（7×24h 采集 / 清洗 / 分类 / 摘要 / 推送）
- 改写行业 Prompt 的**流程与判据**（术语挂领域词表、规范落硬规则、禁忌落分发前强制过滤）；行业术语表、规范清单与禁忌清单需你自建——本书不按行业给这些事实
- 搭建行业评估体系（把准确性 / 合规性 / 可解释性迁到行业轴上；行业基线需自建样本）
- 实现代码智能助手（代码补全 / 生成 / 审查 / Code Agent）
- 设计自动化办公平台（文档 / 审批 / 数据录入 / 跨系统集成）
- 落地多模态 AI（文 / 图 / 音 / 视频 / 3D）的工程化能力
- **把通用 AI 变成懂行业的 AI**——这是行业智能体的核心价值

## 推荐资料

> 本节是**索引，不是新书单**：只把本章各主题已经引用过的文献、标准、工具与官方文档**归拢到一处**，便于按图索骥，不新增任何名字。
> 每条的核验入口统一是「**按题名自行检索**」——本书不提供外链（这是 [Ch15 · 案例库](../15-case-studies/) 已有的做法）；产品与协议的支持范围一律以各自官方文档当前版本为准。

### 经典文献（范式与方法的源头）

| 文献 | 作者 / 团队 | 重点章节 | 阅读建议 | 本章落点 |
| --- | --- | --- | --- | --- |
| *Learning Transferable Visual Models From Natural Language Supervision*（ICML 2021） | OpenAI（Radford 等） | 全文 | 双塔对齐范式（CLIP）的标准出处；读它再读 [§01 §3.1](01-multimodal-ai/01-multimodal-ai-section-3-sec3.md) 的约束清单与 [§01 §3.2](01-multimodal-ai/01-multimodal-ai-section-3-sec3.md) 的七个模式分野（表征 / 投影 / 单序列 / 索引 / 专用 / 动作 / 动力学） | [§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):91 |
| *Scaling Up Visual and Vision-Language Representation Learning With Noisy Text Supervision*（ICML 2021） | Google（Jia 等） | 全文 | 噪声文本监督（ALIGN）——与 CLIP 同层的另一种做法 | [§01 §3](01-multimodal-ai/01-multimodal-ai-section-3-sec3.md):52 |
| *Visual Instruction Tuning*（NeurIPS 2023） | Haotian Liu 等 | 全文 | 桥接式 VLM（LLaVA）的原始论文，对应「视觉编码器 + 投影 + LLM」这一路 | [§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):92 |
| *ImageBind: One Embedding Space To Bind Them All*（2023） | Meta AI | 全文 | 六模态统一向量空间的代表论文；注意它是 Embedding 模型，不是生成模型 | [§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):254 |
| *LanguageBind: Extending Video-Language Pretraining to N-modality by Language-based Semantic Alignment* | 书内未具名团队，按题名自行检索 | 全文 | 以语言为锚的 N 模态对齐；与 ImageBind 的锚定模态差异是这一路最常被混的一对 | [§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):255 |
| *CLAP: Learning Audio Concepts From Natural Language Supervision* | LAION | 全文 | 音频-文本对齐——CLIP 思路在音频模态上的实现 | [§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):256 |
| *SigLIP*（2023） | Google | 全文 | 与 CLIP 同层的双塔对齐，编码器换件时的对照项 | [§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):257 |
| *Ferret: Refer and Ground Anything Anywhere at Any Granularity*（2023） | Apple | 全文 | 细粒度视觉理解 + 引用回原图 | [§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):98 |
| *Scalable Diffusion Models with Transformers*（2023） | 书内未具名，按题名自行检索 | 全文 | DiT——当前图像 / 视频生成架构的事实标准出处 | [§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):528 |
| *Video generation models as world simulators*（2024） | OpenAI | 全文 | 把视频生成表述为「世界模拟器」；判据是「对动作条件是否敏感」 | [§01 §3](01-multimodal-ai/01-multimodal-ai-section-3-sec3.md):208 |

### 标准 / 法规与公开题库

- 《生成式人工智能服务管理暂行办法》（2023）与《人工智能生成合成内容标识办法》（2025）：生成内容标识义务（义务分配与「内容标识」字段）的书内出处是 `08-ai-governance/01-ai-data-governance/01-ai-data-governance-section-7-sec7.md` §7（:98 与 :113）；「输出侧标识注入」这一控制点的映射在 `08-ai-governance/01-ai-data-governance/01-ai-data-governance-section-4-sec4.md` §4.5 样例 3（:283）。本章 [§02 §8](02-industry-intelligence-agent/02-industry-intelligence-agent-section-8-sec8.md):236 把前者当摘要链路的合规锚点。按题名自行检索。
- OMG 的 BPMN 标准：流程「怎么被执行」的图形符号，定义出处 `01-modeling/01-business-process-modeling/01-business-process-modeling.md`:1162；判据是「这张图会不会被下游执行或审计引用」，见同文件 :607 的流程建模工具行。按「BPMN 规范」自行检索。
- 《大数据平台架构师》（创脉思 cms365.cn）：本章 §8 题集的来源之一（[§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):5），**只作题面来源，不作论据**。按题名自行检索。

### 部件级材料（证明「这一层有成熟产品」，不是选型推荐）

- **向量库与检索**：Milvus / Qdrant / Weaviate / Vespa / Pinecone Serverless / Zilliz Cloud / LanceDB / DuckDB VSS 由 [§02 §8](02-industry-intelligence-agent/02-industry-intelligence-agent-section-8-sec8.md):186 归拢，原始落点在 `04-data-assetization/02-vector-lake/02-vector-lake-section-7-sec7.md` §7 的候选表；Elasticsearch / OpenSearch 记作 BM25 引擎，见 `04-data-assetization/04-hybrid-search/04-hybrid-search-section-4-sec4.md` §4；Milvus / Qdrant / Weaviate 官方文档中关于标量量化与 PQ、HNSW + 量化、Modules 的章节见 [§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):434-436。按题名自行检索。
- **调度、消息与工作流引擎**：Apache Airflow / Apache DolphinScheduler / 阿里云 DataWorks 见 `03-data-stack/12-scheduler/12-scheduler-section-4-sec4.md` §4.3 工具链与平台；Kafka / Pulsar / RocketMQ 见 `03-data-stack/README.md` 的组件行；Camunda / Flowable（面向业务流程与人工审批节点，不是数据批次编排）见 `03-data-stack/12-scheduler/12-scheduler-section-7-sec7.md` §7；Temporal 见 `03-data-stack/07-architecture-decisions/07-architecture-decisions-section-8-sec8.md` §8 第四层。这一组是 [§04 §5.3.2 状态机与补偿](04-office-automation-agent/04-office-automation-agent-section-5-ai.md) 与 [§04 §3.2.5](04-office-automation-agent/04-office-automation-agent-section-3-sec3.md) 「状态机不是要重写的，而是要去用的」的部件级落点。按题名自行检索。
- **流程建模与决策**：BPMN.io / bpmn-js / Camunda Modeler 见 `01-modeling/01-business-process-modeling/01-business-process-modeling.md`:607；DMN 决策表与 Drools DMN / Camunda DMN / IBM ODM 一类见 `09-data-intelligence-product/02-decision-intelligence/02-decision-intelligence-section-4-sec4.md` §4.3 工具链与平台（判据是「规则由谁改、要不要逐条举证」）。按题名自行检索。
- **文档解析与抽取**：Tesseract / PaddleOCR / EasyOCR（OCR 行）与 LayoutLMv3（文档理解行）见 `04-data-assetization/01-multimodal-db/01-multimodal-db.md` 的多模态预处理工具表（:207-217）；PyMuPDF / Unstructured（文档结构化）见 `04-data-assetization/01-multimodal-db/01-multimodal-db-section-4-sec4.md` §4（:21）。按题名自行检索。
- **代码侧**：SonarQube / SonarCloud（代码质量度量）与 Snyk Code / Semgrep / GitHub CodeQL（静态分析与安全）见 `13-decision/06-tech-debt/06-tech-debt-section-4-sec4.md` §4.3 工具链表——它们是 [§03 §5.3.3 审查](03-code-intelligence-assistant/03-code-intelligence-assistant-section-5-ai.md) 「可复现、可归因」那一侧的具名物；tree-sitter（按函数 / 类 / 方法边界做 AST 切分）见 `04-data-assetization/05-rag-architecture/05-rag-architecture-section-8-sec8.md`:159。按题名自行检索。
- **评估**：RAGAS / TruLens / ARES / DeepEval 见 `04-data-assetization/05-rag-architecture/05-rag-architecture.md`:110、:124、:153，同章明确提醒「忠实性在各框架里的定义不同、跨框架分数不可比」，因此只能当趋势与告警、不能当验收门槛（[§02 §8](02-industry-intelligence-agent/02-industry-intelligence-agent-section-8-sec8.md):228）；SWE-bench（与 WebArena 同处出现）见 `02-data-science/07-eval/07-eval-section-3-sec3.md`:142 与 :207，同章另记「同一基准换 harness 后成功率不可比，只能比较方案、不能当上线判据」，见 [§03 §8](03-code-intelligence-assistant/03-code-intelligence-assistant-section-8-sec8.md):330。按题名自行检索。
- **身份与协议**：SPIFFE / SPIRE（记作「云原生时代的 Kerberos」）、OIDC / SAML（跨云身份联邦）见 `11-cross-cutting/07-audit-and-compliance/07-audit-and-compliance-section-8-5-5-大规模集群安全架构设计与优化.md` §5.5.6 与 §5.5.7；模型上下文协议（MCP）的公开规范见 [§01 §5](01-multimodal-ai/01-multimodal-ai-section-5-ai.md):206——**它是协议名，不是产品名**。按题名自行检索。
- **编排框架**：LangChain / LangGraph、AutoGen / CrewAI 官方文档见 [§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):332-333；本章 §01 §4.3 的工具表另收多模态 VLM / Embedding / 语音 / 视频 / 3D 各行的候选与选型判据，见 [§01 §4.3](01-multimodal-ai/01-multimodal-ai-section-4-sec4.md)。按题名自行检索。

### 2024–2025 前沿（论文 / 官方文档）

- **原生多模态与长上下文**：OpenAI GPT-4o System Card（2024-08）、Google Gemini 1.5 / 2.0 技术报告（2024-2025）、Anthropic Claude 3.5 Sonnet System Card（2024-10）、阿里通义千问团队《Qwen2-VL Technical Report》（2024）、上海 AI Lab + 商汤《InternVL2 / InternVL3 Technical Report》（2024-2025）——[§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):93-97。按题名自行检索。
- **多模态 Embedding**：BAAI《BGE-VL Technical Report》（2024）、Jina AI《Jina CLIP v2 Technical Report》（2024）——[§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):431-432。按题名自行检索。
- **生成与世界模型**：OpenAI《Sora Technical Report》（2024）、Google DeepMind《Genie 2》（2024）、Wayve《GAIA-1》（2023）、Stability AI《Stable Diffusion 3 / SDXL Technical Report》（2024）、快手《可灵技术报告》（2024-2025）、智谱《CogVideoX Technical Report》（2024）、腾讯《HunyuanVideo Technical Report》（2024）、阿里《Wan 2.1 Technical Report》（2025）、Luma AI《Dream Machine Technical Report》（2024）、Runway《Gen-3 Alpha Technical Report》（2024）——[§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):529-538。按题名自行检索。
- **计算机使用与具身**：Anthropic《Developing a Computer Use Model》（2024-10）、OpenAI《Operator System Card》（2025-01）、Google《Gemini 2.0: Multimodal Agentic AI》（2024-12）、Figure AI《Figure 02 Technical Report》（2024-08）、NVIDIA《Project GR00T》（2024）——[§01 §8](01-multimodal-ai/01-multimodal-ai-section-8-sec8.md):329-336。这一组的能力名、可用范围与发布状态以官方文档当前版本为准；本节只记文献题名与发布日期，**不记版本号、单价与上下文窗口数字**。按题名自行检索。
- **Agent 评估基准**：*AgentBench: Evaluating LLMs as Agents*（2023）、*WebArena: A Realistic Web Environment for Building Autonomous Agents*（2023）、*OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments*（2024）——[§01 §5](01-multimodal-ai/01-multimodal-ai-section-5-ai.md):124。**限定要一并引**：「多模态 Agent / 看屏幕操作」一行在 §01 §5.1 的表里判 **L2**（① 满足、③ 工具契约与环境快照未标准化、② 不满足），「具身智能 / 机器人基础模型」一行判 **L3**（① 不满足、② 无）；这一族只能比较方案、不能当上线判据。按论文标题自行检索。

### 建设方案例（只作机制示例，不作第三方举证）

- **多模态**：阿里 Qwen-VL / 上海 AI 实验室 InternVL / OpenAI GPT-4V / 字节豆包——[§01 §6.1–§6.4](01-multimodal-ai/01-multimodal-ai-section-6-sec6.md)。
- **情报**：Palantir（对象 + 关系）/ 路透社（新闻作为带来源与时间戳的事件流）/ Glean（权限前置 + 片段级引用）——[§02 §6.1–§6.3](02-industry-intelligence-agent/02-industry-intelligence-agent-section-6-sec6.md)。
- **代码助手**：GitHub Copilot（2021-2024）/ Cursor（2022-2024）/ 阿里通义灵码（2023-2024）——[§03 §6.1–§6.3](03-code-intelligence-assistant/03-code-intelligence-assistant-section-6-sec6.md)。
- **办公**：微软 / 钉钉 / 飞书——[§04 §6.1–§6.3](04-office-automation-agent/04-office-automation-agent-section-6-sec6.md)。
- **素材订阅形态**：Snowflake Marketplace 的数据提供方 Bloomberg / Reuters / Weather Company 见 `15-case-studies/10-overseas-cases/10-overseas-cases-section-8-sec8.md` §8——它证明的是「按数据集订阅素材」是一种通行形态，**不是**某一家的情报链路怎么做。

> 这一组的共同限定：按各主题 §5.2 的三级判据，它们都**不满足「② 有第三方（非厂商）公开的生产案例」**，因此只作机制示例、不作举证；引用时请连同这条限定一起引。

### 学习路径建议

1. **多模态与表示**：先读 [§01 多模态 AI](01-multimodal-ai/01-multimodal-ai.md)，再用上表 CLIP / ALIGN / ImageBind / LanguageBind 四条理顺「模态数每加一档、工程量加多少」，配合 [§01 §3](01-multimodal-ai/01-multimodal-ai-section-3-sec3.md) 的模式分野。
2. **情报链路**：[§02 行业情报智能体](02-industry-intelligence-agent/02-industry-intelligence-agent.md) → §4.5 的三个模板 → §4.7 的断供演练；事实性这一侧对照 RAGAS 一族的指标与它的限定。
3. **代码助手**：[§03 代码智能助手](03-code-intelligence-assistant/03-code-intelligence-assistant.md) → §4.2（1）的三类索引 → §4.5 的三个模板 → §4.9 自检清单。
4. **办公自动化**：[§04 办公自动化智能体](04-office-automation-agent/04-office-automation-agent.md) → §4.2（4）的状态机与超时 → §7.2 的部件级对照。
5. **统一走法**：每个主题都按 **§5（三级判据）→ §7（可核证据）→ §8（题集与核验入口）** 的顺序读——§5 决定「能不能上生产」，§8 给的是自测动作而不是结论。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch11 · 横切工程](../11-cross-cutting/) 学习行业级可观测与血缘
- 进入 [Ch15 · 案例库](../15-case-studies/) 看真实行业智能体案例
