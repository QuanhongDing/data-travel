# Ch8 · AI 治理与安全

> **一句话定位**：AI 资产分级保密、防泄露、合规——**资深架构师必须守住底线，AI 资产不能泄露**。

## 画像映射

本章对应 **核心职责⑥ AI 资产分级保密与防泄露体系** + **加分项（等保 2.0/3.0 合规）**：

- **黑盒化资产封装**（模型权重 / Prompt / 微调数据——保护的是「物」不是「内容」）、细粒度权限管控、全链路操作审计、输出端防泄露 —— **黑盒化封装**见 [§02 设计模式一节的「黑盒化资产封装」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)，**权限与审计**见 [§01 AI 数据治理](01-ai-data-governance/01-ai-data-governance.md)，**防泄露**见 [§02 数据安全与合规落地](02-data-security-and-compliance/02-data-security-and-compliance.md)
- 数据安全（脱敏 / 加密 / 分类分级）、权限管控（RBAC / ABAC）、审计日志 —— **分类分级与审计**见 §01，**脱敏 / 加密 / 权限模型**见 [§02](02-data-security-and-compliance/02-data-security-and-compliance.md) 的「设计模式」一节
- 防泄露（DLP / 提示词注入防御）、合规（等保 2.0/3.0 / GDPR / 个保法）—— **提示词注入防御**见 §01，**DLP 与等保落地**见 §02 的「设计模式」与「落地实践」，**GDPR / 个保法**见 §01
- 国产化适配 —— 见 [§02](02-data-security-and-compliance/02-data-security-and-compliance.md) 的「国产化适配」与「存量迁移」两节（五类盘点与逐算子验收）

> P7 会"做权限"，P8 会"做审计"，**资深架构师会让 AI 系统"通过等保测评"**——守住合规底线，承载业务上线。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：AI 架构师 / 安全架构师 / 合规负责人
- **前置章节**：[Ch4 · 企业级数据资产化与智能检索](../04-data-assetization/)（治理建立在资产化之上）；[Ch7 · AI 资产沉淀与自进化](../07-agent-evolution/)（资产沉淀越多，治理越重要）
- **后续章节**：[Ch9 · 数据智能产品](../09-data-intelligence-product/)（治理是产品上线的前提）；[Ch11 · 横切工程](../11-cross-cutting/)（数据可观测与血缘是治理的工具）

## 本章要回答的核心问题

1. **AI 资产怎么分级分类？** 公开 / 内部 / 机密 / 绝密——四级分类法与对应保护措施？（见 [§01](01-ai-data-governance/01-ai-data-governance.md)）
2. **数据脱敏与加密怎么做？** 静态脱敏 / 动态脱敏 / 差分隐私 / 同态加密——不同场景下的取舍？（见 [§02 的「四种脱敏形态与选择顺序」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)）
3. **细粒度权限怎么设计？** RBAC / ABAC / 字段级权限 / 行级权限——如何在 RAG 召回与 LLM 生成中落地？（见 [§02 的「权限模型」与「召回期权限裁剪」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)）
4. **Prompt 注入与越狱怎么防御？** 入向检测 / 出向过滤 / **动作层授权**——构建纵深防御？**本书的一条结论是：只靠内容过滤根治不了**（注入的结果是「指令被服从」，属动作层问题），所以三层里最硬的是第三层（见 [§01 §7](01-ai-data-governance/01-ai-data-governance-section-7-sec7.md)，OWASP LLM01 与 MCP 的授权原语）。
5. **DLP（数据防泄露）怎么设计？** 输出端关键词检测、敏感实体识别（身份证 / 银行卡 / 手机号）、二次确认机制？（见 [§02 的「DLP 三件套」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)）
6. **等保 2.0/3.0 合规怎么落地？** 安全管理中心 / 安全通信网络 / 安全区域边界 / 安全计算环境——「一个中心、三重防护」怎么落到 AI 系统上（现行有效的对照是等保 2.0，GB/T 22239-2019）？（见 [§02 的「等保对照与国产化适配」，以及工程实现一节的「等保控制点映射表」模板](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)）
7. **全链路审计怎么做？** 访问日志、调用日志、生成日志、用户反馈——可追溯、可回放、可定责？（见 [§01](01-ai-data-governance/01-ai-data-governance.md)）

## 子主题

- [ ] **[AI 数据治理](01-ai-data-governance/01-ai-data-governance.md)**：AI 资产分类分级 / 审计留痕 / 提示词注入防御——治理的分级、归属与留痕载体
- [ ] **[数据安全与合规落地](02-data-security-and-compliance/02-data-security-and-compliance.md)**：脱敏（静态 / 动态 / 差分隐私 / 同态）· 权限模型（RBAC / ABAC / 字段级 / 行级 / 召回期裁剪）· DLP 三件套 · 等保「一个中心、三重防护」的控制点映射 · 国产化五类盘点——把分级变成机制，把机制变成可举证的证据

> 文件命名建议：`ai-data-governance.md` / `data-classification.md` / `desensitization-and-encryption.md` / `fine-grained-permission.md` / `prompt-injection-defense.md` / `dlp-and-output-filter.md` / `deng-bao-compliance.md` / `audit-and-traceability.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 设计 AI 资产的分级分类体系（公开 / 内部 / 机密 / 绝密）——[§01](01-ai-data-governance/01-ai-data-governance.md)
- 选型数据脱敏方案（静态 / 动态 / 差分隐私 / 同态加密），并落地工程链路——[§02 的「四种脱敏形态」与「选型决策树」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)
- 设计细粒度权限控制（RBAC / ABAC / 字段级 / 行级），在 RAG 召回与 LLM 生成中落地——[§02 的「权限模型」与「召回期权限裁剪」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)
- 防御 Prompt 注入与越狱（入向检测 / 出向过滤 / **动作层授权**——三层里最硬的是第三层）——[§01 §7](01-ai-data-governance/01-ai-data-governance-section-7-sec7.md)
- 设计 DLP（数据防泄露）方案，识别敏感实体、检测输出端——[§02 的「DLP 三件套」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)
- 落地等保 2.0/3.0 合规（安全管理中心 + 安全通信网络 / 安全区域边界 / 安全计算环境——「一个中心、三重防护」）——[§02 的「等保对照」、工程实现一节的「存量迁移」与「落地实践」的测评案例](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)
- 搭建全链路审计（访问 / 调用 / 生成 / 反馈），可追溯、可回放、可定责——[§01](01-ai-data-governance/01-ai-data-governance.md)
- 完成国产化适配验收（五类盘点 + 逐算子精度对照）——[§02 的「国产化适配」与工程实现一节的「关键技术点」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)
- **守住 AI 资产合规底线**——这是 AI 时代架构师不可推卸的责任

## 推荐资料

> 本节整理 Ch8 推荐阅读：**经典书目与体系化标准 + 工业材料 + 2024–2025 前沿**。第三栏标题里的「2024–2025」只标这一栏材料的**发表时间档位**，不是对趋势快慢的判断。
>
> **本节的定位是索引，不是新书单**——下面每一条都是本章各主题（或全书他处）**已经具名过**的材料，按三栏归拢到一处，便于按图索骥；本节不新增任何未具名的书名、论文名、产品名与年份。
>
> **核验入口统一是「题名（或标准号）+ 发布方 + 年份」四要素，按题名自行检索**——本书没有网络环境，不提供链接（这是全书的通行做法）。凡标【公开】的条目，可按标准号 / 题名 / 项目名查到发布方原文，产品类能力与版本以官方页面**当前版本**为准。本节条目均为【公开】档，无【经验】档条目。
>
> 配合 [§01](01-ai-data-governance/01-ai-data-governance.md) 与 [§02](02-data-security-and-compliance/02-data-security-and-compliance.md) 各主题的 **§5「前沿演进」**（含「公开进展与文献」「被过度宣传的部分」「可证伪的预测」）与 **§8「面试真题集 · 参考资料」** 两节使用：那两节给机制与判据，本节给入口。

### 一、经典书目与体系化标准（骨架层）

| 书 / 标准 | 作者 / 发布方 | 重点章节 | 阅读建议 |
| --- | --- | --- | --- |
| *《Hadoop 权威指南》* | Tom White | Security 章 | 集群侧身份与权限的体系化参考：Kerberos + Delegation Token + HDFS ACL 的分层模型。按题名 + 版本自行检索 |
| *DAMA-DMBOK《Data Management Body of Knowledge》* | DAMA International | Data Governance 章 | 治理五目标（可发现 / 可信任 / 可访问 / 可理解 / 可问责）与国际元数据分类的框架出处；本章用它给治理划目标。按题名自行检索 |
| GB/T 22239-2019（等保 2.0）【公开，2019-12-01 实施】 | 全国信息安全标准化技术委员会 | 「一个中心、三重防护」 | 本章唯一一条**必须逐条指认控制点**的强制文本；读法是把它当映射函数 `m: C → K`（每条要求指到一个具体控制点），不是当背景资料。按标准号自行检索 |
| GB/T 35273《信息安全技术个人信息安全规范》【公开】 | 全国信息安全标准化技术委员会 | 个人信息分级与处理规则 | 字段打「一般 / 敏感 / 重要」三级标签的依据，与 ROPA 登记配套读。按标准号自行检索 |
| GB/T 38667《信息技术大数据政务数据开放共享》【公开】 | 全国信息安全标准化技术委员会 | 政务数据分级与共享 | 跨组织（政府侧）流转的分级口径；做政务 / 国产化项目时对照。按标准号自行检索 |
| GB/T 39786 一类的密码应用标准【公开】 | 全国信息安全标准化技术委员会 | 密码应用要求 | 「密评」这条与等保并列的赛道；读它时要能列出「本系统用到的密码清单」（算法 + 用途 + 密钥来源）。本章沿用「一类」的措辞、**不补实施日期**。按标准号自行检索 |
| NIST SP 800-53 Rev.5【公开】 | NIST | 控制族划分 | 看点是**控制族怎么分**（访问控制、审计与问责、加密分置不同族并要求重叠覆盖），不是对照表截图。按标准号 + 修订版自行检索 |
| NIST SP 800-207【公开】 | NIST | 零信任参考架构 | 策略决策点 / 执行点（PE / PA / PEP）与控制平面 / 数据平面的划分；本主题的「判定与执行分离」有它的影子。按标准号自行检索 |
| GDPR【公开】 | 欧盟 | Art. 22、Art. 35 | 纯自动化决策的限制与 DPIA 义务——两条都要求「能说明决策依据」，这是审计与留痕字段需求的法规侧来源。按条款号自行检索 |
| EU AI Act【公开，Regulation (EU) 2024/1689】 | 欧盟 | Art. 11–14、Art. 49、Art. 99 | 一次性义务（登记、技术文档）与运行期义务（日志、人工监督）**两层叠加**；读它的目的是解释「为什么治理必须做成拦截制」。分阶段时间表以欧盟官方文本为准。按法规编号自行检索 |
| NIST AI RMF【公开，NIST AI 100-1，2023-01】与其 Generative AI Profile【公开，NIST AI 600-1，2024-07】 | NIST | GOVERN / MAP / MEASURE / MANAGE | 自愿性框架路线，与 EU 的强制路线形成对照；四项功能里 MEASURE 与 MANAGE 指向运行期。按编号 + 版本自行检索 |
| ISO/IEC 42001:2023【公开】 | ISO / IEC | 全文 | 把 AI 治理做成**可认证的管理体系**——第三条路线，看点是「谁向谁举证」。按标准号 + 年份自行检索 |
| 《生成式人工智能服务管理暂行办法》【公开，2023-08 生效】 | 国家网信办等 | 备案 / 内容审核 / 数据来源可追溯 | 国内生成式服务的三项工程落点；本章 §8.7 给了「法规义务 → 技术控制项」的映射示例。按题名自行检索 |
| 《人工智能生成合成内容标识办法》【公开，2025 年公布】 | 国家网信办等 | 标识要求 | 生成内容的标识义务；与 EU AI Act 的运行期义务对照读。**具体施行日期以官方文本为准**。按题名自行检索 |

> 这一栏的读法：**标准与法规回答「义务从哪天起产生」，不回答「控制点放在哪」**——后者只能自己造。本章 §5.4 已把这条区分单独点过一次，混读会得出「法规已生效 = 治理已落地」这类误读。

### 二、工业材料（厂商框架、开源项目与官方文档）

**厂商框架与规范**（能证明「机制存在」，不能当第三方生产案例）

- *Anthropic Model Spec* 与 *Responsible Scaling Policy*【公开】、*OpenAI Model Spec* 与 *Preparedness Framework*【公开】、*Google SAIF*【公开】、*Microsoft 的公开 AI 准则*【公开】——核验点是**有没有可核验的分级发布规则与评审记录**（哪一级触发什么动作、谁签的字），不是承诺的措辞。按题名 + 官方页面当前版本自行检索。
- *Hugging Face 的卡片规范与主流 Model Card 模板*【公开】——核验点是字段集与是否版本化，它不替代各家的评审流程。按题名自行检索。
- *OWASP Top 10 for LLM Applications*【公开】（首版其后有新版）与 *MITRE ATLAS*【公开】——两者都是**清单**，核验点是版本号与发布日期；本章用它们给「提示注入属动作层问题、不是内容过滤能解的那类」划边界。**引用 ATLAS 时必须写明访问的版本号与访问年月**——它是持续更新的知识库。按项目名 + 版本自行检索。

**身份与权限（集群侧）**

- *MIT Kerberos 官方文档*【公开】、*Apache Ranger*【公开】、*Apache Sentry*【公开】——「Kerberos 解决你是谁，Ranger / Sentry 解决你能做什么」；Ranger 与 Sentry 是**替代关系**，不是协作关系。按项目名 + 官方文档自行检索。
- *Open Policy Agent* 与 *Rego 语言*【公开】、*OASIS XACML 3.0*【公开】、*Cedar*【公开】——策略即代码（policy-as-code）的公开路线；本章把 OPA / Cedar 列为合规引擎的落点。按项目名 / 标准号自行检索。
- *SPIFFE / SPIRE*【公开】、*Istio 的认证策略*【公开】——云原生侧的工作负载身份；查「身份怎么发、怎么验证、Pod 重启后还认不认」。按项目名自行检索。

**数据侧机制（脱敏 / DLP / 隐私计算 / TEE）**

- *阿里云数据安全中心 DSC*、*华为云数据安全中心*、*AWS Macie*、*Google Cloud Sensitive Data Protection*【公开】——存储侧与输出侧的敏感实体识别；核验点是**有没有输出侧条目、流式分片怎么处理**，不是功能页的风险清单长度。按产品名 + 官方文档自行检索。
- *Microsoft Purview AI Hub*、*Nightfall AI*、*Harmonic Security*【公开，只作方向指认】——AI 场景 DLP 的另一组入口。按产品名自行检索。
- *Apache Ranger 的行过滤与列掩码策略类型*、*Oracle Data Redaction 的查询期脱敏*、*阿里云 DAS*、*Apache ShardingSphere 的数据脱敏模块*【公开】——策略层与引擎层可具名的四种实现（同一份数据对不同角色呈现不同形态）；产品条目只能证明这一族存在，证明不了你这条访问路径没有被旁路。按产品名 + 官方文档自行检索。
- *Presidio*【公开，开源】——PII 识别的开源实现，公开列出了支持的实体类型与置信度机制，可自行核验覆盖面。按项目名自行检索。
- *FATE / SecretFlow / PrimiHub*【公开】——差分隐私与联邦学习的工程化入口；核验点是**有没有预算累计接口、预算耗尽时是否拒绝**。按项目名自行检索。
- *Intel SGX*、*AMD SEV-SNP*、*ARM CCA*、*NVIDIA H100 的 Confidential Computing 模式*、*CNCF 的 Confidential Containers*、*蚂蚁摩斯*【公开】——TEE 阵营；核验点是**远程证明的验证方是谁、证明里包含哪几个字段**（代码度量、版本、是否禁用调试），只校验「这是 SGX / SEV」而不校验「哪段代码」的等于没做。按项目名 / 官方文档自行检索。
- *Trino 的 row-level security 与 Ranger / Open Policy Agent 集成*、*Snowflake Cortex Analyst 的 Always On RBAC*、*Databricks Assistant / Genie 的 SQL Sandboxing*、*Starburst Enterprise 的 Fine-Grained Access Control*【公开】——**同类机制的异地实现，不是本场景的实现**；核验点是行谓词 / 可见集是不是**接口的必填参数**、能不能下推到检索侧。按产品名 + 官方文档自行检索。

**观测与目录（证据层）**

- *OpenTelemetry*【公开】、*Langfuse / Helicone / Arize Phoenix*【公开】——trace 的字段结构决定「一次调用能不能被还原成可标注、可举证的记录」。按项目名自行检索。
- *MLflow / Unity Catalog / Weights & Biases*【公开】——模型登记与评估记录；本章把它们列为「唯一模型注册入口」的候选。按项目名自行检索。
- *DataHub / OpenMetadata / OpenLineage / Marquez / Apache Atlas / JanusGraph / Amundsen / Egeria*【公开】——元数据与血缘的开放标准与平台；读法是看**事件标准**（谁产出、谁消费）而不是看支持多少数据源。按项目名自行检索。
- *Great Expectations / Soda Core / Apache Griffin*【公开】——数据质量工具的三个代表。按项目名自行检索。
- *Kubeflow / Vertex AI Model Registry / SageMaker Model Registry / KServe / Seldon / Feast / Tecton*【公开】——全生命周期治理里「训练—部署」与「特征」两段的载体。按项目名自行检索。

**运行时拦截（网关与护栏）**

- *Cloudflare AI Gateway / Portkey / Lakera*【公开】、*Salesforce Einstein Trust Layer / 阿里云 AgentScope / NVIDIA NeMo Guardrails*【公开】——检索点是官方文档里「策略」「拦截」「放行」「可自托管」的正式条目；判定标准是**策略语言怎么写、放行结论落在哪里**，不是功能页上的风险清单长度。按产品名 + 官方文档自行检索。

**国内合规与信创材料**

- 中国信通院《AI 安全标准化白皮书》【公开】与《数据合规白皮书》【公开】——国标体系的整理材料，以及 DSL / PIPL 的合规落地思路；**版本与年份以发布机构公开页面为准**。按题名 + 发布机构自行检索。
- *阿里云《数据安全白皮书》*【公开】、*Microsoft《GDPR for Developers》*【公开】——平台侧合规工程化的两份参考。按题名自行检索。
- *LinkedIn Engineering《Cobra - Hadoop Security at Scale》*【公开】——大规模集群安全「集中化、版本化、可审计」原则的公开出处。按题名自行检索。

> 这一栏的材料纪律（本章 §6 开头已声明）：**厂商自述与建设方自述只用来复述机制，不构成第三方生产案例**——它们能说明「机制存在」，不能说明「机制在你的场景有效」。本章 §5.4 因此把「第三方案例」单独列成一档并明写「无公开可核验来源」，那不是漏写，是结论。

### 三、2024–2025 前沿（论文）

**论文**【公开】——核验入口统一是「作者 + 题名 + 会议 / 期刊 + 年份」，按题名自行检索；给不出题名与作者的不作为证据。

- Mitchell 等《Model Cards for Model Reporting》【公开，2019】——卡片这一形式的公开出处；读它是为了看**「该记录哪些字段」被定成固定字段表**，而不是让生成器自由发挥。
- Lewis 等《Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks》【公开，NeurIPS 2020】——RAG 的原始出处；本章用它说明「检索侧必须接受并下推可见集」。
- Lundberg 与 Lee《A Unified Approach to Interpreting Model Predictions》【公开，NeurIPS 2017】与 Ribeiro 等《“Why Should I Trust You?”: Explaining the Predictions of Any Classifier》【公开，KDD 2016】——SHAP 与 LIME 的两篇原论文；本章用它们区分**「可解释」与「可问责」是两件事**。
- Edge 等《From Local to Global: A Graph RAG Approach to Query-Focused Summarization》【公开，2024】——图结构与向量结合的公开方法；同名开源实现以官方仓库当前版本为准。
- Bai 等《Constitutional AI: Harmlessness from AI Feedback》【公开，2022】——把人类反馈换成书面原则的方法论文；本章用它做「厂商框架能证明机制存在、不能当判据」的例子。
- Dwork《Differential Privacy》【公开，ICALP 2006】与 Dwork、McSherry、Nissim、Smith《Calibrating Noise to Sensitivity in Private Data Analysis》【公开，TCC 2006】——隐私预算 `ε` 的形式化来源；「没有参数就不叫隐私保证」这条约定的出处。
- Abadi 等《Deep Learning with Differential Privacy》【公开，CCS 2016】——DP-SGD 与**隐私预算记账**的公开依据；这是「DP 接口必须累计预算」这条代价的直接出处。
- Shokri 等《Membership Inference Attacks Against Machine Learning Models》【公开，IEEE S&P 2017】与 Carlini 等《Extracting Training Data from Large Language Models》【公开，USENIX Security 2021】——**模型本身就是泄漏面**：前者说明「不在输出里出现」不等于「没有被记住」，后者说明大模型可以逐字复现训练数据。这两条是输出端 DLP 必须覆盖「出向」的机制依据。
- Gentry《Fully Homomorphic Encryption Using Ideal Lattices》【公开，STOC 2009】——它证明的是同态加密的**可行性**、不是**可用性**；本章据此把它列进「先别投」。
- Sweeney《k-anonymity: a model for protecting privacy》【公开，2002】与 NIST 的 *NISTIR 8053《De-Identification of Personal Information》*【公开，2015】——去标识化的两个经典锚点；后者的用法是按编号查到实务指南原文，不转述二手解读。

**读前沿前先读的三条边界**（本章 §5.5 的结论）

- **「治理自动化」**：能自动化的只有「把已有证据整理成映射表」这一段——没有控制点，自动生成出来的只是措辞漂亮的报告。
- **「AI 资产入表」**：估值方法学尚未成熟，且入表会产生与审慎相反的反向激励——为让报表数字成立，团队有动机把资产评得更值钱。
- **「实时合规网关能替你担责」**：网关提供**执行点**，不提供**策略**；误拦与漏拦的取舍是业务判断，必须有人签字。

> 这三条的共同结构是把「执行点已经就位」说成「治理已经就位」。判断它们何时成真的办法是同一个——看公开材料里有没有出现**可核验的判断依据**（策略版本、签字记录、证据字段口径），而不是看功能页上有没有多一个带「Governance」的名字。

### 学习路径建议（按本章主题文件）

不给天数：本章所有「现在就能做」的动作都不需要新的模型能力（收口、字段、版本、留痕全是工程与流程），节奏取决于你手上已有的控制点数量，而不是阅读量。按依赖顺序读：

1. **先建分级与留痕的骨架** → [§01 AI 数据治理](01-ai-data-governance/01-ai-data-governance.md)：分类分级四级 + Owner + 审计表。先读它的 §1–§2（概念与定位），再进 §3「设计模式与范式」。
2. **再把分级变成机制** → [§02 数据安全与合规落地](02-data-security-and-compliance/02-data-security-and-compliance.md)：脱敏四形态与选择顺序、权限四模型、DLP 三件套、等保控制点指认。其中 [§02 §3「设计模式」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md) 是本章最长的一节，建议按「先看约束 → 模式逐个拆解 → 失效点」三段读。
3. **然后补最容易被跳过、又最贵的两块** → [§01 §7 与其他方法对比](01-ai-data-governance/01-ai-data-governance-section-7-sec7.md)（提示注入为什么必须做成动作层授权、五个反模式的共同根源）与 [§02 §4 工程实现](02-data-security-and-compliance/02-data-security-and-compliance-section-4-sec4.md)（§4.1 落地步骤、§4.5 模板 3「等保控制点映射表」）；再做 [§01 §4 工程实现](01-ai-data-governance/01-ai-data-governance-section-4-sec4.md) 的 §4.2「做晚了无法回填的五项」。
4. **需要交叉验证时读 §5** → [§01 §5 前沿演进](01-ai-data-governance/01-ai-data-governance-section-5-ai.md) 与 [§02 §5 前沿演进](02-data-security-and-compliance/02-data-security-and-compliance-section-5-ai.md)：两节都给「三类前沿的分法 + 公开进展与文献 + 被过度宣传的部分 + 可证伪的预测」，是本推荐资料三栏在机制侧的补充。
5. **面试 / 评审前读 §8** → [§01 §8 面试真题集](01-ai-data-governance/01-ai-data-governance-section-8-sec8.md) 与 [§02 §8 面试真题集](02-data-security-and-compliance/02-data-security-and-compliance-section-8-sec8.md)：每题的「参考资料」栏就是上面三栏在具体题目上的落点。
6. **集群侧与合规侧的补充** → [§01 §8.2 集群安全与权限管理](01-ai-data-governance/01-ai-data-governance-section-8-1-1-集群安全与权限管理.md)（Kerberos / Ranger / Sentry 的分层）、[§01 §8.4 安全架构演进与新兴趋势](01-ai-data-governance/01-ai-data-governance-section-8-5-6-安全架构演进与新兴趋势.md)（云原生迁移的三条路径）、[§01 §8.7 AI 治理与合规性](01-ai-data-governance/01-ai-data-governance-section-8-18-8-ai-治理与合规性.md)（全生命周期治理与法规映射）。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch9 · 数据智能产品](../09-data-intelligence-product/) 学习治理之上的产品化
- 进入 [Ch11 · 横切工程](../11-cross-cutting/) 学习数据可观测与血缘（治理的工具）