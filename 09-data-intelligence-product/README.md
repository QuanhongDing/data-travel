# Ch9 · 数据智能产品

> **一句话定位**：让 AI 不只在后台——变成业务可消费的产品：智能标签 / 智能 BI / 精细化运营 / 预测决策。

## 画像映射

本章对应 **R5 数据智能类产品认知**（招聘要求第 5 条）：

- 智能标签（事实标签 / 模型标签 / 预测标签）—— 见 [§04 智能标签与标签平台](./04-smart-tag-platform/04-smart-tag-platform.md)
- 智能 BI（自然语言查询 NL2SQL / 自动洞察）—— 见 [§05 智能 BI 与 NL2SQL](./05-intelligent-bi-nl2sql/05-intelligent-bi-nl2sql.md)
- 精细化运营（人群运营 / 触达策略）—— 见 [§06 精细化运营](./06-precision-operation/06-precision-operation.md)；其中**人群圈选**的查询实现见 [§04 的「人群圈选」一节](./04-smart-tag-platform/04-smart-tag-platform.md)
- 预测决策（推荐 / 营销 / 风控）—— 见 [§02 决策智能](./02-decision-intelligence/02-decision-intelligence.md)

> P7 会"做模型"，P8 会"做平台"，**资深架构师会"做产品"**——让 AI 能力从"内部工具"变成"业务可消费的产品"。

> **本章的覆盖状态**：本章现有 6 个主题，**R5 的四项（智能标签 / 智能 BI / 精细化运营 / 预测决策）均有主题承接**；其中"人群圈选"的实现归 [§04](./04-smart-tag-platform/04-smart-tag-platform.md)（它是查询，不是资产），"触达 / 实验 / 归因"归 [§06](./06-precision-operation/06-precision-operation.md)。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：数据架构师 / 产品架构师 / AI 架构师
- **前置章节**：[Ch4 · 企业级数据资产化与智能检索](../04-data-assetization/)（数据资产是产品的原料）；[Ch7 · AI 资产沉淀与自进化](../07-agent-evolution/)（自进化让产品越来越好）
- **后续章节**：[Ch10 · 行业智能体](../10-industry-agent/)（智能产品的行业化升级）；[Ch15 · 案例库](../15-case-studies/)（看真实产品案例）

## 本章要回答的核心问题

1. **智能标签体系怎么设计？** 事实标签（基础属性）/ 模型标签（行为偏好）/ 预测标签（流失概率）——三类标签的工程化链路？（见 [§04](./04-smart-tag-platform/04-smart-tag-platform.md)）
2. **标签平台怎么搭建？** 实时标签（流式计算）vs 离线标签（批处理）——如何平衡实时性与计算成本？（见 [§04 的「离线 / 在线同源」](./04-smart-tag-platform/04-smart-tag-platform.md)）
3. **智能 BI 怎么实现 NL2SQL？** Text2SQL / Text2Metrics / 自动洞察——从自然语言到可执行查询的全链路？（见 [§05](./05-intelligent-bi-nl2sql/05-intelligent-bi-nl2sql.md)）
4. **精细化运营怎么设计？** 人群圈选、触达策略、A/B 实验、效果归因——如何用数据驱动业务决策？（见 [§06](./06-precision-operation/06-precision-operation.md)；人群圈选的查询实现见 [§04](./04-smart-tag-platform/04-smart-tag-platform.md)）
5. **预测决策系统怎么搭建？** 规则引擎 vs ML 模型 vs LLM Agent——不同决策场景的技术选型？（见 [§02](./02-decision-intelligence/02-decision-intelligence.md)）
6. **数据中台与数据网格（Data Mesh）怎么选？** 中心化 vs 联邦化——大型组织的"数据组织"难题？（见 [§03](./03-data-mesh/03-data-mesh.md)）
7. **AI 计算平台怎么设计？** 训练平台 / 推理平台 / 模型市场——把 AI 能力产品化？（见 [§01](./01-ai-compute/01-ai-compute.md)）

## 子主题

- [ ] **[AI 计算平台](./01-ai-compute/README.md)**：训练 / 推理 / 模型市场——AI 能力的产品化
- [ ] **[决策智能](./02-decision-intelligence/README.md)**：规则引擎 / ML 模型 / LLM Agent——预测决策系统的设计与实现
- [ ] **[数据网格（Data Mesh）](./03-data-mesh/README.md)**：领域驱动的数据所有权 / 自助式数据平台 / 联邦治理
- [ ] **[智能标签与标签平台](./04-smart-tag-platform/README.md)**：标签口径（事实 / 模型 / 预测）· 离线与实时同源 · 标签服务 · 准入等级与退役 · 人群圈选——把"这个实体是什么"做成可解释、可申诉、可治理的资产
- [ ] **[智能 BI 与 NL2SQL](./05-intelligent-bi-nl2sql/README.md)**：语义层承载口径 · 意图解析与映射 · 拒绝与澄清 · 执行反馈与沙箱 · 口径回显与分层可解释 · 评测从执行准确率到口径落对率——把"用自然语言问一个数"做成可信、可核对的产品
- [ ] **[精细化运营](./06-precision-operation/README.md)**：稳定分流与增量口径 · 注意力的统一频控与优先级 · 触发式触达 · 渠道编排与退订强一致 · Uplift 定向 · 长期 holdout 与负向护栏——把"发一次触达"做成可证明有效的闭环

> 文件命名建议：`ai-compute.md` / `decision-intelligence.md` / `data-mesh.md` / `intelligent-tagging.md` / `intelligent-bi-nl2sql.md` / `operation-platform.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 设计智能标签体系（事实 / 模型 / 预测三类），并搭建标签平台——[§04](./04-smart-tag-platform/04-smart-tag-platform.md)
- 选型实时 vs 离线标签的工程方案（Flink / Spark / 向量库）——[§04 的「离线 / 在线同源」与「选型决策树」](./04-smart-tag-platform/04-smart-tag-platform.md)
- 实现 NL2SQL / Text2Metrics，把自然语言转化为可执行查询——[§05](./05-intelligent-bi-nl2sql/05-intelligent-bi-nl2sql.md)
- 设计精细化运营系统（人群圈选 / 触达策略 / 效果归因）——[§06](./06-precision-operation/06-precision-operation.md)；人群圈选见 [§04](./04-smart-tag-platform/04-smart-tag-platform.md)
- 搭建预测决策系统（规则引擎 / ML / LLM Agent），并与业务系统集成——[§02](./02-decision-intelligence/02-decision-intelligence.md)
- 评估数据中台 vs 数据网格的取舍，给出组织级数据架构建议——[§03](./03-data-mesh/03-data-mesh.md)
- 搭建 AI 计算平台（训练 / 推理 / 模型市场），让 AI 能力产品化——[§01](./01-ai-compute/01-ai-compute.md)
- **把模糊业务问题转化为可量化指标**——这是数据智能产品的核心能力

## 推荐资料

> **本节是一份索引，不是一份新书单。** 下面每一个条目都是本章各个主题的正文里**已经出现过**的名字——主要来自各主题的 §5「前沿演进」、§4.3「工具链与平台」与 §8「面试真题集」的参考资料清单。本节只做一件事：把它们按「经典 / 工业材料 / 前沿」三栏**归拢到一处**，并逐条标出它在本章的落点，便于读者按图索骥。
>
> **核验入口**：本节不提供链接，只给检索口径——请按**题名 / 项目名 / 条文名 / 标准号**到公开检索入口自行检索，并以官方发布页或版权页的当前版本为准。凡带年份的条目，年份都以该条目自身的发布页或版权页为准；凡"落点"里写的是**书内页码**的，指的是本书在本仓库中的相对路径与行号，不是外部链接。
>
> **两处口径提醒（沿用正文，不在此处加码）**：
> - 本章 [§02 §5.4](./02-decision-intelligence/02-decision-intelligence-section-5-ai.md) 与 [§03 §5.4](./03-data-mesh/03-data-mesh-section-5-ai.md) 都**明写"给不出具名的第三方（非厂商）生产案例"**，这正是这两章把所有 AI 方向判在 L2 / L3 的直接原因；本节不从别处补。
> - 本章 [§01 §5.4](./01-ai-compute/01-ai-compute-section-5-ai.md) 明确**不引用版本号、不把厂商规格页的峰值当能力**；本节沿用——所有项目、产品与规范的版本状态一律以各自发布页为准。
>
> 本章 §8 面试真题集的**来源分两类**：【公开】《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）题库是 [§01 §8](./01-ai-compute/01-ai-compute-section-8-sec8.md)、[§02 §8](./02-decision-intelligence/02-decision-intelligence-section-8-sec8.md)、[§03 §8](./03-data-mesh/03-data-mesh-section-8-sec8.md) 三处的**题源之一**；[§04 §8](./04-smart-tag-platform/04-smart-tag-platform-section-8-sec8.md)、[§05 §8](./05-intelligent-bi-nl2sql/05-intelligent-bi-nl2sql-section-8-sec8.md)、[§06 §8](./06-precision-operation/06-precision-operation-section-8-sec8.md) 三处则各在题头声明「**全部为自编、不整合外部题库**」。无论哪一类，该题库都只是**题源**，不列为推荐阅读。

### 经典（书 / 标准 / 方法出处）

| 名称（本章正文的写法） | 归属主题 | 在本章的落点 | 核验入口 |
| --- | --- | --- | --- |
| 【公开】*Data Mesh: Delivering Data-Driven Value at Scale*（Zhamak Dehghani，O'Reilly 2021） | §03 | [§03 §5.4](./03-data-mesh/03-data-mesh-section-5-ai.md)（`03-data-mesh-section-5-ai.md:186`）；另见 `03-data-mesh.md:156`、`03-data-mesh-section-8-sec8.md:89` | 按书名检索，以版权页核作者与版次 |
| 【公开】"How to Move Beyond a Monolithic Data Lake to a Distributed Data Mesh"（Zhamak Dehghani，2019） | §03 | `03-data-mesh-section-5-ai.md:185`；另见 `03-data-mesh-section-7-sec7.md:87` | 按文章标题 + 作者检索；本章 §1.4 记为 2019 年 6 月 |
| 【公开】《Domain-Driven Design》（Eric Evans，2003） | §03 | `03-data-mesh-section-3-sec3.md:74`；另见 `03-data-mesh-section-8-sec8.md:411` | 按书名检索；正文用它解释 bounded context 的出处 |
| 【公开】《Implementing Domain-Driven Design》（Vaughn Vernon） | §03 | `03-data-mesh-section-8-sec8.md:413` | 按书名检索 |
| 【公开】《Causality》（Judea Pearl）与《The Book of Why》（Judea Pearl） | §02 | `02-decision-intelligence-section-5-ai.md:189`（两本同在此行）；另见 `02-decision-intelligence-section-8-sec8.md:323`（该处只列《The Book of Why》） | 按书名检索；图灵奖年份正文已声明"以 ACM 官方获奖记录为准" |
| 【公开】《Causal Inference for Statistics, Social, and Biomedical Sciences》（Guido Imbens & Donald Rubin） | §02 | `02-decision-intelligence-section-8-sec8.md:324` | 按书名检索（潜在结果框架的标准教材） |
| 【公开】《Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing》（Ron Kohavi 等） | §02 · §06 | `02-decision-intelligence-section-8-sec8.md:502` | 按书名检索；本书他处另在 `07-agent-evolution/README.md:70` 引过它 |
| 【公开】《大数据之路：阿里巴巴大数据实践》（阿里巴巴数据技术团队） | §02 · §03 | `03-data-mesh-section-8-sec8.md:183` | 按书名检索。**署名提醒**：`02-decision-intelligence-section-8-sec8.md:240` 写作「阿里妈妈《大数据之路》」，与 §03 处的署名不一致——两处均以版权页为准 |
| 【公开】"Data Mesh 再评估"（Martin Fowler，2022） | §03 | `03-data-mesh-section-8-sec8.md:184` | 按文章标题 + 作者检索 |
| 【公开】Gartner *Top Strategic Technology Trends 2022 / 2023*（Decision Intelligence 相关条目） | §02 | `02-decision-intelligence-section-8-sec8.md:71`；同主题 `02-decision-intelligence-section-7-sec7.md:49` 另引 Gartner *Top 10 Strategic Technology Trends for 2022* | 按报告名检索，以 Gartner 官方页面核对标题与年份 |
| 【公开】OMG DMN 1.4 标准（决策模型与图形化符号） | §02 | `02-decision-intelligence-section-8-sec8.md:237`；工具链表 `02-decision-intelligence-section-4-sec4.md:157` 列出其实现 Camunda DMN / Drools DMN / IBM ODM DMN | 按标准号检索 OMG 官方文本 |
| 【公开】Data Mesh Maturity Model v1 | §03 | `03-data-mesh.md:197`；`03-data-mesh-section-8-sec8.md:559` | 正文已声明"该模型的发布方与年份本书无法核验，故不冠以「官方」二字"——按题名检索后自行判断 |

> 本章没有第二类"建模/算法圣经"式的经典书目：§01、§05、§06 三个主题的权威来源集中在**论文与官方文档**两栏（见下），§04 的权威来源集中在**合规材料**（见「工业材料」栏的 Model Cards 一行）。这不是遗漏，而是这四个主题的共性——它们的知识更新速度快于成书速度，书内因此只留可核验的一手材料。

### 工业材料（法规 / 规范 / 官方文档 / 工具链 / 落地实践）

**法规与标准（判定入口，条款以官方文本为准）**

| 名称 | 归属主题 | 在本章的落点 | 核验入口 |
| --- | --- | --- | --- |
| 【公开】欧盟《人工智能法案》（AI Act，2024 年通过并生效） | §02 | `02-decision-intelligence-section-5-ai.md:194`；另见 `02-decision-intelligence-section-8-sec8.md:402` | 按法规名检索**官方公报**的条款与适用时间表，不要看解读文章 |
| 【公开】GDPR（2018 年起适用） | §02 · §03 | `02-decision-intelligence-section-7-sec7.md:165`；另见 `02-decision-intelligence-section-5-ai.md:195`、`03-data-mesh.md:88` | 按法规名检索官方文本；具体条款与例外以官方文本为准 |
| 【公开】《中华人民共和国个人信息保护法》（PIPL，2021 年施行） | §02 · §06 | `06-precision-operation-section-7-sec7.md:117`；另见 `02-decision-intelligence-section-5-ai.md:196`、`06-precision-operation-section-8-sec8.md:178` | 按法规名检索；§06 把它当作退订/同意名单在企业侧的制度对应物 |
| 【公开】《互联网信息服务算法推荐管理规定》（2022 年施行） | §02 | `02-decision-intelligence-section-5-ai.md:196`；另见 `02-decision-intelligence-section-8-sec8.md:352` | 按法规名检索官方发布文本 |
| 【公开】《生成式人工智能服务管理暂行办法》（2023 年施行） | §02 | `02-decision-intelligence-section-5-ai.md:196` | 同上 |
| 【公开】《数据安全法》/ CCPA | §03 | `03-data-mesh.md:88` | 同上；本节只用它说明"所有权与责任主体清晰"这条要求的来源 |
| 【公开】国内网络安全等级保护制度（等保 2.0 / 3.0） | §01 · §02 | `02-decision-intelligence-section-5-ai.md:197`；另见 `01-ai-compute-section-8-sec8.md:456` | 正文只用它的存在说明"合规要求真实存在"，**不转述其具体条款**——请查官方标准文本与测评要求 |
| 【公开】OMG DMN 1.4 | §02 | 见「经典」栏 | 按标准号检索 |
| 【公开】LinkedIn DataHub 的 Auto-tagging RFC | §04 | `04-smart-tag-platform-section-8-sec8.md:222`（转引 `08-ai-governance/01-ai-data-governance/01-ai-data-governance-section-8-11-8-智能数据治理与-ai-应用.md:518` 的参考资料清单） | 按 RFC 名 + 项目名检索；本书不提供精确链接 |

**协议与规范**

| 名称 | 归属主题 | 在本章的落点 | 核验入口 |
| --- | --- | --- | --- |
| 【公开】MCP（Model Context Protocol）官方规范与官方 SDK 发布页 | §03 | `03-data-mesh-section-5-ai.md:193`；工具链表 `03-data-mesh-section-4-sec4.md:174` | 核三件事：协议版本怎么标、能力位怎么命名、近一年有没有破坏性变更——看规范页的版本协商条款，不看产品博客 |
| 【公开】Bitol / ODCS（Open Data Contract Standard）/ Data Contract CLI / Pact | §03 | `03-data-mesh-section-4-sec4.md:172`；另见 `03-data-mesh-section-5-ai.md:196`、`03-data-mesh-section-7-sec7.md:152` | 按项目名 / 规范名检索；正文提醒 Pact 解决的是 API 合约测试，不是数据交付承诺 |
| 【公开】OpenLineage / Marquez | §03 · §04 | `03-data-mesh-section-4-sec4.md:167`；跨主题参照见 `04-smart-tag-platform-section-8-sec8.md:323` | 按项目名检索；引用时以仓库当前状态为准（正文已标若干同类项目停更） |

**AI 计算与 MLOps（§01）**

| 名称 | 在本章的落点 | 核验入口 |
| --- | --- | --- |
| 【公开】PyTorch FSDP 官方文档 / Microsoft DeepSpeed 官方文档 / NVIDIA Megatron-LM 仓库 | `01-ai-compute-section-5-ai.md:245`（覆盖 FSDP 与 DeepSpeed）；另见 `01-ai-compute-section-8-sec8.md:175`、`:176` | 按项目名检索官方文档当前版本 |
| 【公开】vLLM / NVIDIA TensorRT-LLM / TGI / SGLang / LMDeploy / DeepSpeed-MII / MLC LLM | `01-ai-compute-section-4-sec4.md:168` | 同上 |
| 【公开】TorchServe / TensorFlow Serving / NVIDIA Triton / BentoML / Seldon Core / KServe | `01-ai-compute-section-4-sec4.md:167` | 同上 |
| 【公开】MLflow / W&B / Neptune.ai / DVC / SageMaker / Vertex AI / Azure ML / 阿里云 PAI / 腾讯 TI-One / 华为 ModelArts | `01-ai-compute-section-4-sec4.md:166` | 同上 |
| 【公开】Feast / Tecton / 阿里云 PAI FeatureStore / 字节 ByteFS / 腾讯 TI FeatureStore | `01-ai-compute-section-4-sec4.md:165` | 同上 |
| 【公开】FLAML / AutoGluon / NNI / Optuna / H2O.ai | `01-ai-compute-section-4-sec4.md:164` | 同上 |
| 【公开】Hugging Face Hub / Replicate / Civitai / ModelScope / PAI 模型市场 / SageMaker JumpStart | `01-ai-compute-section-4-sec4.md:169` | 同上 |
| 【公开】CoreWeave / Lambda Labs / RunPod / Modal / Replicate / 阿里云灵骏 / 腾讯云星脉 / 火山引擎机器学习平台 | `01-ai-compute-section-4-sec4.md:170` | 同上 |
| 【公开】Kubernetes 自动扩缩文档（`autoscaling/v2`）/ KEDA / Volcano / KubeRay / Slurm / NVIDIA GPU Operator / NVIDIA DCGM Exporter | `01-ai-compute-section-5-ai.md:169`；另见 `01-ai-compute-section-4-sec4.md:29`、`:30` | 按项目名检索；KEDA 的毕业状态以 CNCF 与项目 release notes 为准 |
| 【公开】NVIDIA 官方文档《Multi-Instance GPU User Guide》 | `01-ai-compute-section-8-sec8.md:87` | 按文档名检索 NVIDIA 官方文档 |
| 【公开】AWS EC2 Spot 官方文档与 What's New | `01-ai-compute-section-5-ai.md:170` | 按服务名检索官方页面当前版本 |
| 【公开】OpenTelemetry 的 GenAI 语义约定 | `01-ai-compute-section-5-ai.md:204` | 按"OpenTelemetry semantic conventions"检索；稳定性状态以官方文档当前版本为准 |
| 【公开】国产化软件栈：华为昇腾 CANN / 寒武纪 MLU + Bang C / 海光 DCU + DTK | `01-ai-compute-section-4-sec4.md:149`；另见 `01-ai-compute-section-8-sec8.md:515` 之后的参考资料 | 按厂商名 + 软件栈名检索官方文档与仓库 |

**数据平台与目录血缘（§03）**

| 名称 | 在本章的落点 | 核验入口 |
| --- | --- | --- |
| 【公开】Apache Iceberg / Apache Hudi / Delta Lake | `03-data-mesh-section-4-sec4.md:170` | 按项目名检索；正文明确"本节不给版本号"，版本以发布页为准 |
| 【公开】Trino（PrestoSQL 线）/ Starburst / Apache Calcite / Denodo | `03-data-mesh-section-4-sec4.md:169`；另见 `05-intelligent-bi-nl2sql-section-4-sec4.md:145` | 同上 |
| 【公开】DataHub（LinkedIn 开源）/ OpenMetadata / Unity Catalog / Apache Gravitino / Apache Polaris / Apache Atlas / Amundsen | `03-data-mesh-section-4-sec4.md:166`；另见 `03-data-mesh-section-5-ai.md:195` | 按项目名检索；Gravitino / Polaris 的孵化与毕业状态以 Apache 项目状态页为准 |
| 【公开】AWS Lake Formation / 阿里云 DataWorks / 腾讯云数据平台（"X + Data Mesh"集成公告） | `03-data-mesh-section-5-ai.md:197` | 判定入口是**各平台官方文档里的能力条目**，不是发布会的介绍页 |
| 【公开】OPA + Rego / Apache Ranger / Immuta / Collibra | `03-data-mesh-section-4-sec4.md:168` | 按项目名检索；判据是"执行点有没有强制能力、策略能否被单测" |
| 【公开】LakeFS / Pachyderm / Prometheus + Grafana / Monte Carlo / Great Expectations | `03-data-mesh-section-4-sec4.md:175` | 按项目名检索 |
| 【公开】Milvus / Qdrant / Weaviate / Pinecone / Chroma / pgvector | `05-intelligent-bi-nl2sql-section-3-sec3.md:77`；另见 `05-intelligent-bi-nl2sql-section-5-ai.md:84` | 按项目名检索；正文提醒本主题的关键判据不在选哪个库，而在**索引对象** |
| 【公开】微众银行 FATE / 蚂蚁摩斯 | `03-data-mesh-section-3-sec3.md:223` | 按项目名检索；正式版本以各项目官方发布页为准 |

**决策、BI 与运营侧工具链（§02 / §05 / §06）**

| 名称 | 在本章的落点 | 核验入口 |
| --- | --- | --- |
| 【公开】Drools / Easy Rules / Aviator / QLExpress / URule / Camunda / IBM ODM | `02-decision-intelligence-section-4-sec4.md:157` | 按项目名检索；候选能力与是否仍在维护以各自官方文档为准 |
| 【公开】Apache Flink（含 Flink SQL 与 Flink CEP）/ Apache Kafka / Apache Pulsar / Materialize / RisingWave / Redis / HBase | `02-decision-intelligence-section-4-sec4.md:160`；另见 `02-decision-intelligence-section-5-ai.md:201` | 同上 |
| 【公开】Vowpal Wabbit / FTRL-Proximal / RLlib（Ray）/ Stable-Baselines3 / DeepMind Acme | `02-decision-intelligence-section-4-sec4.md:161`；另见 `02-decision-intelligence-section-5-ai.md:201` | 同上 |
| 【公开】DoWhy / EconML / CausalML / CausalImpact / Causalinference / Ananke | `02-decision-intelligence-section-4-sec4.md:162`；另见 `02-decision-intelligence-section-5-ai.md:198` | 同上 |
| 【公开】火山引擎 A/B / 字节 A/B / 阿里 A/B / Optimizely / Eppo / Statsig / GrowthBook / AB Tasty | `02-decision-intelligence-section-4-sec4.md:163`；另见 `02-decision-intelligence-section-8-sec8.md:503` | 同上 |
| 【公开】LangChain / LangGraph / LlamaIndex / AutoGen / CrewAI / MetaGPT / ChatDev / OpenAI Swarm / OpenAI Function Calling / Anthropic Tool Use | `02-decision-intelligence-section-4-sec4.md:164`；另见 `02-decision-intelligence-section-5-ai.md:199`、`05-intelligent-bi-nl2sql-section-5-ai.md:120` | 按项目名检索；正文把这类框架定为**编排层**，治理要另做 |
| 【公开】SHAP / LIME / Alibi / InterpretML / Captum / What-If Tool / Integrated Gradients / Anchors / Counterfactual Explanation | `02-decision-intelligence-section-4-sec4.md:165`；另见 `02-decision-intelligence-section-5-ai.md:198` | 按项目名 / 方法名检索；判据是"解释给谁看"，归因型与引用型不要用同一个界面糊过去 |
| 【公开】Arize Phoenix / WhyLabs / Langfuse / Helicone / Evidently AI / Prometheus + Grafana / OpenTelemetry | `02-decision-intelligence-section-4-sec4.md:165`；另见 `01-ai-compute-section-4-sec4.md:172` | 按项目名检索 |
| 【公开】dbt Semantic Layer / MetricFlow / Cube / LookML | `05-intelligent-bi-nl2sql-section-4-sec4.md:170`；另见 `05-intelligent-bi-nl2sql-section-3-sec3.md:61` | 按项目名检索；选型要点只有一条——**看能不能导出** |
| 【公开】ThoughtSpot / 网易有数 / Metabase（本章 §05 §6 的三例落地实践） | `05-intelligent-bi-nl2sql-section-6-sec6.md:11`、`:103`、`:170` | 按产品名检索；正文只引它们的做法，不对其能力做断言 |
| 【公开】Salesforce Tableau GPT / Microsoft Copilot for Power BI / ThoughtSpot Sage / Snowflake Cortex Analyst | `05-intelligent-bi-nl2sql-section-3-sec3.md:125`（转引 `05-agent-platform/01-data-agent/01-data-agent-section-4-sec4.md` 的「国际平台」行） | 按产品名检索；正文"只引它们的名字，不对其回显粒度做断言" |
| 【公开】Hightouch / Census（反向 ETL，写回 Salesforce / HubSpot / Braze） | `06-precision-operation-section-4-sec4.md:173`（转引 `15-case-studies/08-startup-evolution/08-startup-evolution-section-8-sec8.md:208` 的"dbt + 反向 ETL"闭环） | 按产品名检索；判据是"名单由数仓口径产出，还是由各渠道自己拼" |
| 【公开】dbt 官方文档的 `exposures` / `sources` 章节 | `03-data-mesh-section-8-sec8.md:315`（Data Contract 段的参考资料） | 按文档章节名检索 |

### 前沿（论文 / 开源 / 方向，条目年份见各自括号）

> 说明：本栏列的是**带标题（或作者）+ 出处 + 年份**的具名工作——只有这些在正文里被判为可核验的①。本章正文明确**不逐个列名**的对象（量化格式 AWQ / SmoothQuant、投机解码 SpecDec / EAGLE、长上下文 RoPE Scaling / YaRN / LongLoRA、通信库 NCCL / NCCLX 一类）**只落在各主题 §5.1 表的方向行里**，本节不把它们补成条目——理由见 [§01 §5.4](./01-ai-compute/01-ai-compute-section-5-ai.md) 的「为什么这里不逐个列名」一段（`01-ai-compute-section-5-ai.md:259`）。

**§01 AI 计算平台**

| 名称 | 在本章的落点 | 核验入口 |
| --- | --- | --- |
| 【公开】Rajbhandari 等，ZeRO（SC 2020） | `01-ai-compute-section-5-ai.md:235` | 按论文标题 + 会议年份检索 |
| 【公开】Kwon 等，PagedAttention / vLLM（SOSP 2023） | `01-ai-compute-section-5-ai.md:236`；另见 `01-ai-compute-section-8-sec8.md:264` | 同上 |
| 【公开】Dao 等，FlashAttention（NeurIPS 2022） | `01-ai-compute-section-5-ai.md:237`；另见 `01-ai-compute-section-8-sec8.md:265` | 同上 |
| 【公开】Dettmers 等，QLoRA（NeurIPS 2023） | `01-ai-compute-section-5-ai.md:238` | 同上 |
| 【公开】AlpaServe（OSDI 2023）、DistServe（OSDI 2024） | `01-ai-compute-section-5-ai.md:239` | 同上 |
| 【公开】ServerlessLLM（OSDI 2024） | `01-ai-compute-section-5-ai.md:240`；另见 `:171` | 同上 |
| 【公开】MLPerf Training 与 MLPerf Inference（MLCommons） | `01-ai-compute-section-5-ai.md:241`；另见 `:139` | 按基准名 + MLCommons 检索；用途是提供可复现的对照条件，不是可抄的吞吐 |
| 【公开】Yaniv Leviathan 等《Speculative Decoding》论文 | `01-ai-compute-section-8-sec8.md:266` | 按论文标题 + 作者检索 |
| 【公开】Meta AI《Llama 3.1 405B 技术报告》（公开版） | `01-ai-compute-section-8-sec8.md:174` | 按报告名检索；并行配置以报告正文为准 |
| 【公开】NVIDIA H100 架构白皮书 / Blackwell 架构白皮书 | `01-ai-compute-section-5-ai.md:250` | 按白皮书名检索；正文提醒：峰值算力必须连精度格式（与是否含稀疏）一起读 |

**§02 决策智能**

| 名称 | 在本章的落点 | 核验入口 |
| --- | --- | --- |
| 【公开】Lundberg & Lee, "A Unified Approach to Interpreting Model Predictions"（NeurIPS 2017，SHAP 的出处） | `02-decision-intelligence-section-5-ai.md:182`；另见 `02-decision-intelligence-section-8-sec8.md:400` | 按论文标题 + 作者检索 |
| 【公开】Ribeiro, Singh, Guestrin, "Why Should I Trust You? Explaining the Predictions of Any Classifier"（KDD 2016，LIME 的出处） | `02-decision-intelligence-section-5-ai.md:183`；另见 `02-decision-intelligence-section-8-sec8.md:401` | 同上 |
| 【公开】Wachter, Mittelstadt, Russell, "Counterfactual Explanations Without Opening the Black Box"（2017） | `02-decision-intelligence-section-5-ai.md:184` | 同上 |
| 【公开】Rosenbaum & Rubin（1983）、Chernozhukov 等（2018，DML）、Wager & Athey（JASA 2018，CausalForest） | `02-decision-intelligence-section-5-ai.md:185` | 按作者 + 年份检索；正文记的是因果估计的三代方法 |
| 【公开】McMahan 等, "Ad Click Prediction: a View from the Trenches"（KDD 2013，FTRL-Proximal 的出处） | `02-decision-intelligence-section-5-ai.md:186` | 同上 |
| 【公开】Li 等, "A Contextual-Bandit Approach to Personalized News Article Recommendation"（WWW 2010，LinUCB 的出处） | `02-decision-intelligence-section-5-ai.md:187` | 同上 |
| 【公开】Chain-of-Thought（Wei 等，NeurIPS 2022）、Self-Consistency（Wang 等，ICLR 2023）、ReAct / Tree-of-Thoughts（Yao 等，ICLR 2023 / NeurIPS 2023）、Graph-of-Thoughts（Besta 等，AAAI 2024） | `02-decision-intelligence-section-5-ai.md:188`；另见 `:84` | 按论文标题 + 作者检索 |

**§03 数据网格**

| 名称 | 在本章的落点 | 核验入口 |
| --- | --- | --- |
| 【公开】McMahan 等, "Communication-Efficient Learning of Deep Networks from Decentralized Data"（AISTATS 2017，联邦平均的出处） | `03-data-mesh-section-5-ai.md:187` | 按论文标题 + 作者检索 |
| 【公开】Zhu, Liu, Han, "Deep Leakage from Gradients"（NeurIPS 2019） | `03-data-mesh-section-5-ai.md:188`；另见 `03-data-mesh-section-3-sec3.md:222` 附近 | 同上；正文用它反证"只交换梯度不等于隐私" |

**§04 智能标签**

| 名称 | 在本章的落点 | 核验入口 |
| --- | --- | --- |
| 【公开】Mitchell 等《Model Cards for Model Reporting》（FAT* 2019） | `04-smart-tag-platform-section-8-sec8.md:222`（转引 `08-ai-governance/01-ai-data-governance/01-ai-data-governance-section-8-11-8-智能数据治理与-ai-应用.md:521` 的参考资料清单） | 按论文标题 + 作者检索。正文给它划了边界：**它证的是"模型资产该带什么元数据"，不是"打了标的准确率是多少"** |
| 【公开】LinkedIn DataHub 的 Auto-tagging RFC | 同上（已列在「工业材料」栏） | 按 RFC 名 + 项目名检索 |

**§05 智能 BI 与 NL2SQL**

| 名称 | 在本章的落点 | 核验入口 |
| --- | --- | --- |
| 【公开】Spider（EMNLP 2018）、BIRD（NeurIPS 2023）、Spider 2.0（arXiv 预印本 2024） | `05-intelligent-bi-nl2sql-section-4-sec4.md:113`；另见 `05-intelligent-bi-nl2sql-section-5-ai.md:159` | 按基准名检索。**三者设定不同、都不能替代你的私有评测集**——`CR` / `HR` 本身没有公开基线 |

**§06 精细化运营**

| 名称 | 在本章的落点 | 核验入口 |
| --- | --- | --- |
| 【公开】Uplift 元学习器（Künzel 等，PNAS 2019）、Causal Forest（Wager & Athey，JASA 2018）、DML（Chernozhukov 等，2018）与 DR-Learner | `06-precision-operation-section-8-sec8.md:285`（该处另指向 `02-data-science/07-eval/07-eval-section-5-ai.md` 的文献栏） | 按论文标题 + 作者检索；正文口径：**换掉的是估计器，识别假设没被换掉** |
| 【公开】《个人信息保护法》（PIPL，2021-11 生效） | `06-precision-operation-section-7-sec7.md:117`；另见 `06-precision-operation-section-8-sec8.md:178` | 按法规名检索官方文本；本主题把它当作退订与同意名单在企业侧的制度对应物 |

> **本栏不重复 §06 的 L1 方向**：`06-precision-operation-section-5-ai.md:21` 的分级表里 **「A/B 与增量口径」是 §06 唯一的 L1**（② 列原文「成立——这是本主题唯一达到 L1 的方向：实验方法有大量公开的工业实践与学术共识」），它的公开材料是**方法层**的（在线受控实验的方法学，即「经典」栏的《Trustworthy Online Controlled Experiments》一行），正文已列在那里，本栏不另立条目；§06 被欠的是**效果数字**，不是"这个方向没有 L1"（运营场景特有的三条约束——污染、频控、负向指标——还没有第三方公开的效果数据，`06-precision-operation-section-5-ai.md:52`）。

> 三个主题各自的诚实空白（沿用正文，不在此处补齐）：本章 [§04 §5.2](./04-smart-tag-platform/04-smart-tag-platform-section-5-ai.md) 与 [§05 §5.2](./05-intelligent-bi-nl2sql/05-intelligent-bi-nl2sql-section-5-ai.md) 的**分级表里没有 L1 行**（两节原文都写「本节没有一行达到 L1」），卡点全在②（缺第三方可核验的生产案例）上，且各有具体解释：标签准确率需要人工核对、核对结果会暴露"判错过多少人"；口径落对率需要含业务口径的私有评测集、不能公开。[§06 §5.2](./06-precision-operation/06-precision-operation-section-5-ai.md) 不属于这一情形——它有一行 L1（「A/B 与增量口径」，见上栏 §06 的说明），那一条的②是成立的，被欠的是**效果数字**——运营场景特有的三条约束（污染、频控、负向指标）没有第三方公开的效果数据（`06-precision-operation-section-5-ai.md:52`）。因此 §04、§05 两节的前沿栏只有**方法出处**，§06 的方法层是 L1、被欠的仍是**效果数字**——本节不从别处借数字来填。

### 学习路径建议

以下五步只给**顺序与依赖**，不给天数：本章各主题正文没有给出任何学习周期，本节也不引入。每一步都指回本章的具体主题文件与它内部的关键节。

1. **先读「接口图」再读「机制」**——六个主题（[§01](./01-ai-compute/01-ai-compute.md) / [§02](./02-decision-intelligence/02-decision-intelligence.md) / [§03](./03-data-mesh/03-data-mesh.md) / [§04](./04-smart-tag-platform/04-smart-tag-platform.md) / [§05](./05-intelligent-bi-nl2sql/05-intelligent-bi-nl2sql.md) / [§06](./06-precision-operation/06-precision-operation.md)）的 §5 都有一张「与本主题既有栈的接口在哪」表，列的是**交接物**而不是口号（§01–§03 在 §5.3，§04–§06 在 §5.4）。先把这张表读通，再回头读 §2 的核心原理——顺序反了会把 §2 读成纯理论。
2. **按"原料 → 资产 → 产品"的顺序读**：[§03 数据网格](./03-data-mesh/03-data-mesh.md)（数据所有权与契约）→ [§04 智能标签与标签平台](./04-smart-tag-platform/04-smart-tag-platform.md)（把"这个实体是什么"做成资产）→ [§05 智能 BI 与 NL2SQL](./05-intelligent-bi-nl2sql/05-intelligent-bi-nl2sql.md) / [§06 精细化运营](./06-precision-operation/06-precision-operation.md)（把资产变成业务可消费的产品）。这条链上的交接物散在两处：§05 §5.4 的接口表里有一行就是 [Ch9 §04 智能标签与标签平台](./04-smart-tag-platform/04-smart-tag-platform.md)（交接物是"人"维度的取值域），§04 §5.4 的接口表里对应 [Ch3 数据栈](./03-data-mesh/03-data-mesh.md) 与 [Ch9 §01](./01-ai-compute/01-ai-compute.md) / [§02](./02-decision-intelligence/02-decision-intelligence.md) 两行。
3. **决策与算力两条腿分开走**：[§02 决策智能](./02-decision-intelligence/02-decision-intelligence.md) 的读法是"先立问责结构，再谈模型"（§3.4 的组合模式与 §7.2–§7.3 的四族对照）；[§01 AI 计算平台](./01-ai-compute/01-ai-compute.md) 的读法是"先立资源模型与成本口径，再谈引擎"（§4.6 的成本账单与 §7.4 的成本函数）。两者都要用到本栏的**论文与官方文档**，但用它们的姿势不同：论文看机制，官方文档看接口与承诺边界。
4. **本栏的用法（一句话）**：官方文档用来核**能力存不存在**与**接口稳不稳**，论文用来核**为什么**，基准用来核**量级与可比性**；三者都不满足的数字（产品页上的峰值、营销文案里的倍率）不进公式、也不进采购单——这是 [§01 §5.4](./01-ai-compute/01-ai-compute-section-5-ai.md) 的"怎么用这几类文献"一节的原话口径。
5. **读到这里还没被任何一栏覆盖的部分**：本书**全书未具名**的几处（以及一处尚无通行做法的形态）在正文里都写明了——各渠道退订与同意名单的集中管理产品与渠道单价（[§06 §7.3.3](./06-precision-operation/06-precision-operation-section-7-sec7.md)）、跨活动统一频控的产品实现（[§06 §8](./06-precision-operation/06-precision-operation-section-8-sec8.md)）、长期 holdout 与负向指标护栏的产品化实现（同上）、标签口径的跨平台交换格式（[§04 §5.2](./04-smart-tag-platform/04-smart-tag-platform-section-5-ai.md) 把它判为 **L3**，① 只写「只有提案与局部实践」、③ 写「不成立（无通行做法）」，`04-smart-tag-platform-section-5-ai.md:24`）。**这几处不是本节的遗漏，而是正文明确的空白**：请你按自家账单与各渠道官方文档重算，不要用别人的数字。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch10 · 行业智能体](../10-industry-agent/) 学习智能产品的行业化
- 进入 [Ch15 · 案例库](../15-case-studies/) 看真实数据智能产品案例