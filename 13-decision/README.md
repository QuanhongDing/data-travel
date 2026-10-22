# Ch13 · 决策与权衡

> **一句话定位**：在不确定的工程世界里，做出正确、可被全公司复用的架构决策——P8 → 资深数据架构师的"软分水岭"。

## 画像映射

本章对应 **R6 工程能力**中的**决策维度** + **R8 行业经验**沉淀的**战略能力**——所有角色都受益：

- **架构决策记录（ADR）**：模板、流程、组织级 vs 团队级，让决策过程可追溯、可讨论
- **选型决策框架**：性能 / 成本 / 团队匹配度 / 生态 / 可治理性 / 风险——多维权衡
- **自研 vs 采购**：决策矩阵、伪自研陷阱、ROI 评估——什么必须自研、什么可以采购
- **风险评估**：FMEA（失效模式分析）、故障树分析、根因分析（5 Whys）
- **技术战略**：3-5 年路线图、技术雷达（Tech Radar）、让老板和团队都买账
- **技术债管理**：识别、量化、优先级、还债节奏——管理技术债而非被技术债管理
- **决策心理学**：锚定效应、确认偏误、沉没成本、群体思维——识别并对抗认知偏误

> P7 能完成，P8 能执行，**资深数据架构师能决策**——在不确定性中做出正确决策，是真正的分水岭。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：资深工程师 / 架构师 / 团队负责人 / 准资深架构师
- **前置章节**：[Ch1 · 建模方法论](../01-modeling/) – [Ch11 · 横切工程](../11-cross-cutting/)（任一，作为决策的领域背景）
- **后续章节**：[Ch14 · 团队管理与领导力](../14-leadership/)（决策需要组织能力支撑）;[Ch15 · 案例库](../15-case-studies/)（真实工业级决策案例）

## 本章要回答的核心问题

1. **架构决策记录（ADR）怎么写？** 模板、流程、组织级 vs 团队级——怎么让组织从"个人决策"走向"集体决策"？
2. **选型决策框架是什么？** 性能 / 成本 / 团队匹配度 / 生态 / 可治理性 / 风险——多维权衡的方法论？
3. **自研 vs 采购怎么判断？** 什么必须自研、什么可以采购、什么是"伪自研"？决策矩阵与 ROI 评估？
4. **风险评估怎么做？** FMEA（失效模式分析）、故障树分析、根因分析（5 Whys）——如何落到工程实践？
5. **技术战略 3-5 年路线图怎么写？** 技术雷达（Tech Radar）、架构演进、技术投入 ROI——怎么让老板和团队都买账？
6. **技术债怎么管理？** 什么时候该还、什么时候该拖、怎么量化？技术债的优先级与还债节奏？
7. **架构评审怎么组织？** 评审流程、检查清单、反模式案例——什么样的架构评审能真正起作用？
8. **决策心理学有哪些陷阱？** 锚定效应、确认偏误、沉没成本、群体思维——如何识别并对抗认知偏误？
9. **跨团队技术决策怎么做？** 共识构建、RFC 流程、委员会机制——如何在组织博弈中推进决策？

## 子主题

- [ ] **[ADR（架构决策记录）](./01-adr/README.md)**：模板、流程、组织级 vs 团队级
- [ ] **[选型决策框架](02-tradeoff-frameworks/02-tradeoff-frameworks.md)**：性能 / 成本 / 团队匹配度 / 生态 / 可治理性 / 风险
- [ ] **[自研 vs 采购](03-build-vs-buy/03-build-vs-buy.md)**：决策矩阵、伪自研陷阱、ROI 评估
- [ ] **[风险评估](./04-risk-assessment/README.md)**：FMEA（失效模式分析）、故障树、根因分析（5 Whys）
- [ ] **[技术战略与路线图](05-tech-strategy/05-tech-strategy.md)**：3-5 年规划、技术雷达（Tech Radar）
- [ ] **[技术债管理](06-tech-debt/06-tech-debt.md)**：识别、量化、优先级、还债节奏
- [ ] **[架构评审](07-architecture-review/07-architecture-review.md)**：流程、清单、反模式案例
- [ ] **[决策心理学](./08-decision-psychology/README.md)**：锚定效应、确认偏误、沉没成本、群体思维
- [ ] **[跨团队技术决策](./09-cross-team-decision/README.md)**：共识构建、RFC 流程、委员会机制

> 文件命名建议：`adr.md` / `tradeoff-frameworks.md` / `build-vs-buy.md` / `risk-assessment.md` / `tech-strategy.md` / `tech-debt.md` / `architecture-review.md` / `decision-psychology.md` / `cross-team-decision.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- **写出有说服力的 ADR**：让决策过程可追溯、可讨论、可被未来质疑——从"个人拍板"到"集体决策"
- **建立选型决策框架**：性能 / 成本 / 团队匹配度 / 生态 / 可治理性 / 风险——多维权衡而非"拍脑袋"
- **拒绝"伪自研"诱惑**：很多团队为了"掌控感"自研，结果维护成本爆炸——决策矩阵 + ROI 评估
- **设计组织级技术决策流程**：从个人拍板到 RFC / 委员会 / ADR 的演进
- **写出让老板买单的技术战略**：把技术规划翻译成业务价值——3-5 年路线图 + Hype Cycle + ROI
- **管理技术债而非被技术债管理**：识别、量化、优先级、还债节奏——技术债也是资产
- **识别并对抗决策心理学陷阱**：锚定效应、确认偏误、沉没成本、群体思维——决策需要刻意练习
- **推进跨团队技术决策**：共识构建、RFC 流程、委员会机制——决策不只是个人能力，更是组织能力

## 推荐资料

> 本节的性质是**索引**，不是新书单：下面每一个条目都已出现在本章各主题里（个别出现在全书别处），这里按「经典 / 工业材料 / 前沿」归拢到一处，便于按图索骥。
> 无网络环境下本节不给外部链接；每条的核验入口都是**按题名 / 产品名自行检索**论文库或官方文档的**当前版本**——与本章各主题 §5.4、以及 Ch15 各主题参考资料的做法一致。
> 与各主题 §5.4 的分工：§5.4 负责标注每条材料的**证据等级**（【公开】/【经验】）以及它支撑的是哪一条结论，本节只负责**归拢与给检索入口**。§5.4 里明写为「未能核验」的那一类，本节同样不补——那是结论，不是缺项。
> 栏位说明：本章材料里有一批早于 2024 的机制论文（CAP / PACELC / 故障树一类），塞进「前沿」会错标年份，故单列一栏。条目中的年份一律是该文档的**发布 / 首版年份**（属【公开】档），不是本节新增的数字；持续更新的产品与官方文档**不写年份**，以检索到的当前版本为准。

### 经典书目（决策方法论与工程决策基石）

| 书 | 作者（书内署名） | 对应本章主题 | 阅读建议 |
| --- | --- | --- | --- |
| *Documenting Architecture Decisions* | Michael Nygard | 01 ADR | ADR 的原始定义；「Accepted 不可修改、要修写新 ADR」与「supersede 而非修改」两条原则的源头。按题名自行检索 |
| *Thinking, Fast and Slow*（中译本《思考，快与慢》） | Daniel Kahneman | 08 决策心理学 | 双过程理论与各类认知偏误的原始论述，是 ADR 反偏差设计、以及向管理层解释「为什么不能只靠拍板」的共同语言。按书名自行检索 |
| *Noise* | Daniel Kahneman / Olivier Sibony / Cass R. Sunstein | 08 决策心理学 | 主张「用规则替代一部分人的判断」以压降决策噪声——本章把偏误自检项写进 ADR 模板，走的就是这条路。按书名自行检索 |
| *Principles*（中译本《原则》） | Ray Dalio | 08 决策心理学 | 「Radical Transparency」作为对抗群体思维的组织范式。按书名自行检索 |
| *Victims of Groupthink* | Irving Janis | 08 决策心理学 | 群体思维的原始定义与症状模型，是本章所有反群体思维机制的起点。按书名自行检索 |
| *The Analytic Hierarchy Process* | Thomas L. Saaty | 02 选型决策框架 | AHP 的原始著作，两两比较与一致性判据的出处；读它是为了分清「AHP 算权重」与「加权打分」不是同一件事。按书名自行检索 |
| *Decisions with Multiple Objectives* | Ralph L. Keeney & Howard Raiffa | 02 选型决策框架 | 多属性效用理论的奠基著作，决策矩阵的形式化基础。按书名自行检索 |
| *Getting to Yes* | Fisher & Ury（哈佛谈判项目） | 09 跨团队技术决策 | 「对事不对人、聚焦利益而非立场」，冲突类跨团队决策的处理框架。按书名自行检索 |
| *The Evolution of Cooperation* | Axelrod | 09 跨团队技术决策 | 解释「目标不一致为何是结构性问题」的经典论述，用来判断该谈共识还是该改机制。按书名自行检索 |
| *A Guide to the Project Management Body of Knowledge*（*PMBOK Guide*） | PMI | 04 风险评估 / 09 跨团队决策 | RACI 责任分配矩阵的标准化定义，以及定量风险分析的通用流程。按书名自行检索 |
| *Managing Technical Debt* | Steve McConnell | 06 技术债管理 | 技术债管理的系统化著作，Principal / Interest / Debt Ratio 等核心概念的出处；注意它与「机制论文」栏 Kruchten 等那一篇是两部不同的作品。按书名自行检索 |
| *Building Microservices* | Sam Newman | 06 技术债管理（Strangler Fig） | 第 2 版专章讲逐步迁移的模式，是「不要直接重写遗留系统」这条结论的最佳教材。按书名自行检索 |
| *Your Code as a Crime Scene* | Adam Tornhill | 06 技术债管理 | 「变更热度 × 复杂度」定位债源的原始论述。按书名自行检索 |
| *Site Reliability Engineering* 及其续作 *SRE Workbook* | Google SRE | 04 风险评估 | Error Budget 的原始定义，是「风险偏好要不要写进 SLO」这一问的工业文本；该书有公开在线版，按书名检索即可 |
| *Big Data: Principles and Best Practices of Scalable Realtime Data Systems* | Nathan Marz & James Warren | 05 技术战略与路线图 | Lambda 架构的原始定义，批流一体讨论的基线。按书名自行检索 |
| *Designing Data-Intensive Applications* | Martin Kleppmann | 05 技术战略与路线图 | 架构演进讨论中「一致性 / 可用性到底在权衡什么」的工程对照读物。按书名自行检索 |
| *Data Mesh: Delivering Data-Driven Value at Scale* | Zhamak Dehghani | 03 自研 vs 采购 / 05 技术战略 / 09 跨团队决策 | 领域所有权、数据即产品、自助平台、联邦计算治理等原则的原创出处；读它是为对照「集中式治理」的成本结构。按书名自行检索 |
| *Building Evolutionary Architectures* | Ford / Parsons / Kua | 07 架构评审 / 01 ADR | 适应度函数与「治理委员会」的理论基础，是评审从「事件」变「状态」的支撑。按书名自行检索 |
| *Competitive Strategy* | Michael Porter | 05 技术战略与路线图 | 把技术纳入战略定位的早期来源，技术路线图与业务战略对齐时的方法论背景。按书名自行检索 |
| *The Innovator's Dilemma* | Clayton Christensen | 05 技术战略与路线图 | 颠覆性创新理论，用于解释「当下最优的技术路线为何会被后来者取代」。按书名自行检索 |

### 工业材料 / 官方文档（判定入口）

这一类是「去哪查」，不是进展断言。凡本身带发布年份的照写年份；持续更新的产品文档只给文档名与检索位置。

**ADR 与组织级决策载体（01 / 07 / 09）**

- GitHub 公开仓库 `github/architectural-decision-records`：大型互联网公司公开 ADR 的最完整样本，用来核 Status / Context / Decision / Consequences 字段的实际写法。按仓库名自行检索
- MADR 项目官方文档，以及 `adr-tools`（npryce/adr-tools）、log4brains、Spotify Backstage ADR Plugin 官方文档：模板字段、索引生成与 supersede 链接管理的工具实现。按项目名自行检索
- CNCF TAG App Delivery《ADR Recommendations》：开源社区把 ADR 当作跨项目决策载体的样本。按题名自行检索
- Apache Kafka 社区 KIP 流程官方文档、IETF RFC 流程官方文档、Python PEP 与 Rust RFC 仓库：开源治理里的 RFC 形态，用来校准「Engineering RFC 该必填哪些字段」。按流程名自行检索
- ThoughtWorks Technology Radar 历年归档：Adopt / Trial / Assess / Hold 的环位定义，以及历次 ADR 相关条目；**具体期号与环位以归档页当年原文为准**。按题名自行检索
- Gartner《Top Strategic Technology Trends 2022: Decision Intelligence》与《Decision Intelligence: A Complete Guide》，以及 Gartner Hype Cycle 系列报告：企业语境下 Decision Intelligence 的定位与组件（Hype Cycle 的用法见 [05 技术战略 §3.2.1](05-tech-strategy/05-tech-strategy-section-3-sec3.md)）。按报告名与**当年版本**自行检索
- Bain & Company《Reinventing Decision Making》与 Atlassian 官方博客的 DACI 说明：RAPID / DACI 两套决策角色框架的原始定义，用来对照 RACI。按题名自行检索
- AWS Well-Architected Framework、Google Cloud Architecture Framework、Microsoft Azure Well-Architected Framework 官方文档：云架构评审维度体系的行业基线；支柱构成以官方当前版本为准，不引用二手总结。按框架名查官方文档

**风险与 AI 风险（04）**

- ISO 31000:2018《Risk management — Guidelines》与 ISO 31010:2019《Risk management — Risk assessment techniques》：风险的定义与原则，以及评估技术的官方对照表。按标准号自行检索
- NIST SP 800-30 Rev.1《Guide for Conducting Risk Assessments》与 NIST SP 800-207《Zero Trust Architecture》：美国国家标准里的评估流程与零信任架构定义。按标准号自行检索
- Jack Jones《Measuring and Managing Information Risk: A FAIR Approach》：把概率影响矩阵扩展成可量化损失分布的原始著作。按书名自行检索
- MIL-P-1629 与 SAE J1739：FMEA 的原始出处与工业标准。按文件号自行检索
- NASA《Fault Tree Handbook with Aerospace Applications》与美国核管理委员会 NUREG-0492《Fault Tree Handbook》：故障树定性与定量分析的权威文本。按文件号自行检索
- OWASP《Top 10 for LLM Applications》与 MITRE ATLAS：LLM 应用风险清单与 AI 对抗技术知识库；引用 ATLAS 时必须写明访问到的版本。按清单名 / 知识库名自行检索
- NIST《AI Risk Management Framework》（AI RMF 1.0）及其生成式 AI Profile（NIST AI 600-1）、ISO/IEC 42001、ISO/IEC 23894、欧盟《EU AI Act》：AI 风险管理的标准族，彼此是互补与专门化的关系，不是相互替代。按标准号 / 法规名查官方发布版本
- Anthropic《Responsible Scaling Policy》与 System Card、OpenAI《Preparedness Framework》：头部 AI 公司把风险评估作为上线门槛的一手材料。按题名自行检索

**技术战略、成本与合规（05 / 03）**

- AWS / Microsoft Azure / Google Cloud 各家 TCO 计算器与公开白皮书：TCO 口径的官方模板，用来校准「自建便宜还是采购便宜」的比较基线。按产品名查官方文档
- 阿里巴巴《大数据之路：阿里巴巴大数据实践》：OneData / OneService / 数据质量在国内数据平台的成书来源，本章多处案例的对照基线。按书名自行检索
- 中国《数据安全法》《个人信息保护法》《数据出境安全评估办法》原文，以及 GDPR 原文（Regulation (EU) 2016/679）：合规约束的原文，只按条文名检索，不引用二手解读
- Armbrust 等《Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics》、Jay Kreps《Questioning the Lambda Architecture》：湖仓一体与 Kappa 的两份原始论述，是技术路线图里「批流要不要合」的理论对照。按题名自行检索
- 厂商署名的公开分享（阿里 / 字节 / 美团 / Uber / Netflix 等）在本章一律按【经验】档使用：只取方向与量级，不给题名与年份，需要引用时请自行查证

**组件选型材料（03，按组件族）**

- 元数据与血缘：Apache Atlas、LinkedIn DataHub、OpenLineage、Lyft Amundsen、Apache Gravitino、Databricks Unity Catalog 官方文档——核「采集覆盖率 / 血缘 / 搜索 / 权限」四项加「生态集成 / TCO / 社区活跃度」各写在哪一节（轴取自 03 §11.4.1 的加权决策矩阵）。按项目名查其官方文档当前版本
- 表格式：Apache Iceberg、Apache Hudi、Delta Lake、Apache Paimon 官方文档的并发控制、Schema 演进与迁移章节；Project Nessie 官方文档（catalog 版本化）；Databricks Engineering Blog 关于 Delta UniForm 的公开分享。按项目名自行检索
- 权限：Apache Ranger 官方文档与 Apache Sentry 归档文档——行级过滤、数据脱敏与 tag-based policy 的定义。按项目名自行检索
- 流处理：Apache Flink、Spark Structured Streaming、Kafka Streams 官方文档——状态管理、容错语义与 exactly-once 的实现口径。按项目名自行检索
- 查询与存储：Trino、Apache Doris、ClickHouse、StarRocks、Apache Druid、HBase 官方文档；Snowflake 官方文档的计费模型与访问控制章节；阿里 MaxCompute / Hologres 公开技术材料。按项目名自行检索
- Materialize 官方文档：增量计算能力的边界说明，用于把「流式物化视图」与「流处理作业」分开。按项目名自行检索

**技术债（06）**

- Ward Cunningham《The WyCash Portfolio Management System》：技术债隐喻的原始出处。按题名自行检索
- Martin Fowler 个人博客《TechnicalDebtQuadrant》与《StranglerFigApplication》：四象限与「不要直接重写」两条结论的标准出处；该博客另有《Is High Quality Software Worth the Cost?》，是偿还决策的补充。按题名自行检索
- SonarQube 官方文档的 Technical Debt / Quality Gates 章节，以及 CAST / inspearit 的 SQALE 方法白皮书、Letouzey《The SQALE Analysis Model》：量化方法学的算法定义出处；分档阈值属【经验】，不是厂商标准。按题名自行检索
- Philippe Kruchten / Robert Nord / Ipek Ozkaya《Managing Technical Debt in Software Engineering》与 Stripe《Developer Report》：把技术债纳入工程研究领域的奠基论文，以及行业实证数据的出处；具体比例以原文为准。按题名自行检索

**决策心理学与跨团队（08 / 09）**

- Gary Klein《Performing a Project Premortem》与 Kahneman / Sibony / Sunstein《A Skeptic's Guide to Decision Hygiene》：Pre-Mortem 的原始定义，以及「自检清单 + Pre-Mortem + 决策日志」这套工程落地的出处。按题名自行检索
- Amazon 致股东信中 Two-Way Doors / One-Way Doors 的公开表述，以及 Amazon「Working Backwards」PR/FAQ 机制的公开材料：决策可逆性分级的工业来源。按题名自行检索
- Google Project Aristotle 的公开研究结论与 Netflix 企业文化材料（"Freedom & Responsibility"）：心理安全感与「不可直接推倒」的文化设计，是反群体思维的组织侧证据。按题名自行检索
- CNCF 技术监督委员会（TOC）章程与治理文档、TOGAF 的架构治理章节：联邦化与集中式两种治理形态的公开范本。按题名自行检索
- Google SRE 关于 blameless postmortem 的公开材料：把冲突从「追责」转向「改进系统」；属【经验】档，无单一文档名，按题名自行检索

### 机制论文（早于 2024）

这一栏单列，是因为它们的方法论价值与时效无关；放进「前沿」会把年份标错。

- **分布式权衡的基础**：Eric Brewer《Towards Robust Distributed Systems》（PODC 2000 keynote，CAP 的公开表述）；Gilbert & Lynch《Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services》（ACM SIGACT News 2002，CAP 的形式化证明）；Abadi《Consistency Tradeoffs in Modern Distributed Database System Design》（IEEE Computer 2012，PACELC 的原始论文）；Google（Corbett 等）《Spanner: Google's Globally-Distributed Database》（OSDI 2012）；Amazon（DeCandia 等）《Dynamo: Amazon's Highly Available Key-value Store》（SOSP 2007）。按题名查论文库
- **决策方法论**：Saaty《Decision Making with the Analytic Hierarchy Process》（Int. J. Services Sciences 2008，一致性阈值与适用边界的作者自述）；Saltelli 等《Global Sensitivity Analysis: The Primer》（2008，全局敏感性分析）。按题名查论文库
- **ADR 的实证**：Olbrich、Kuhn、Hummerich 等《An Industrial Case Study on Lightweight, Markdown-based Architecture Decision Records》（CEUR-WS 2017，MADR 的正式提出与工业验证）。按题名查论文库
- **可靠性工程的经济学**：Boehm《Software Engineering Economics》（1981，缺陷修复成本随阶段后移的原始论证）；公开材料常把这一差距概括为「一个数量级以上」，但**具体倍数不可移植**，引用时不要写死数值。按书名自行检索
- **失效分析**：H. A. Watson（贝尔实验室）关于故障树分析的早期论文（FTA 的原始出处）与 MIL-P-1629（FMEA 的原始出处）——两条都在「工业材料」栏已按文件号给出检索入口。

### 2024–2025 前沿（论文 / 项目 / 开源）

- Microsoft GraphRAG 的论文与开源仓库：把知识图谱用于企业知识库与评审历史检索的原始工作；本章多个主题把它标为 L3（仅论文与演示阶段），引用前先核「结论是否可复核」。按题名自行检索
- ThoughtWorks Technology Radar 近年各期中的 ADR 相关条目：把 ADR 定位为反偏差工具、以及 ADR supersede 自动检测的评估条目；**具体期号与环位以归档页为准**。按题名自行检索
- Apache Paimon、Apache Gravitino、Project Nessie、OpenLineage：流批共享存储、联邦元数据、catalog 版本化与跨引擎血缘这几类开源项目，用于核「湖仓时代新增的治理面」。按项目名查其官方文档与项目状态页
- Python `SALib`、`pyDecision`、`scikit-criteria` 与 R `MCDA`：敏感性分析与多准则决策的开源实现，用来把 AHP / 权重校验落成可重算的代码。按项目名自行检索
- MLflow 官方文档的 Model Registry 章节、WhyLabs / Arize AI 的漂移监控文档、LangSmith / Langfuse 的 Agent Trace 文档：AI 债检测侧的基础设施。按产品名查其官方文档
- Anthropic 官方文档与公开博客（Anthropic Engineering / Anthropic News）、OpenAI 官方 Cookbook、LangChain / LlamaIndex 官方文档与示例：AI 辅助选型与决策归档的官方示范；**具体能力与版本以官方文档当前版本为准**，本章不转述二手描述。按题名自行检索
- 厂商署名的国内实践（阿里通义、字节 / 美团 / 腾讯的 AI 助手公开分享）在本章按【经验】档使用：只取方向，不给题名与年份。

### 学习路径建议

下面按「先学会写决策 → 再学会评估 → 最后学会在组织里推动」的依赖顺序排；每一档只给**读什么 + 读哪里**，不给天数——本章没有可核验的工期来源。

1. **决策的载体**：先读 Nygard《Documenting Architecture Decisions》，再看 [01-adr](./01-adr/README.md) 的模板谱系（Nygard → MADR → Lightweight ADR）；模板按团队规模与评审成本选，不要一上手就上最重的一档
2. **多维权衡**：Saaty《The Analytic Hierarchy Process》的权重与一致性判据 + Keeney & Raiffa 的多属性效用 → [02-tradeoff-frameworks](02-tradeoff-frameworks/02-tradeoff-frameworks.md)；权重靠不靠得住，用上栏 `SALib` / `pyDecision` 重算一遍
3. **自研还是买**：[03-build-vs-buy](03-build-vs-buy/03-build-vs-buy.md) 的决策矩阵，配前面「工业材料 / 官方文档」栏里的「组件选型材料」子块按组件族对读；TCO 口径用云厂商的官方模板，不自己发明公式
4. **风险与 AI 风险**：[04-risk-assessment](./04-risk-assessment/README.md) 的 FMEA / 故障树 / 5 Whys，配 ISO 31000 与 NIST AI RMF 两份标准；AI 特有风险对照 OWASP 清单与 MITRE ATLAS
5. **战略与路线图**：[05-tech-strategy](05-tech-strategy/05-tech-strategy.md) + Porter / Christensen 两本；技术雷达与 Hype Cycle 都只作「成熟度标签」，环位以当期原文为准
6. **技术债**：Cunningham 与 Fowler 的三篇短文打底 → [06-tech-debt](06-tech-debt/06-tech-debt.md) 的四象限与量化；量化工具用 SonarQube 文档核算法，阈值自己定
7. **评审与组织**：[07-architecture-review](07-architecture-review/07-architecture-review.md) 的清单化演进 + 《Building Evolutionary Architectures》的适应度函数；跨团队部分接 [09-cross-team-decision](./09-cross-team-decision/README.md) 的 RFC / RACI-DACI-RAPID / 委员会三条线
8. **决策心理学**：[08-decision-psychology](./08-decision-psychology/README.md) 是本章唯一「读完要改自己习惯」的一节——Kahneman 的双过程 → 偏误自检表 → Pre-Mortem，最后落到 ADR 模板的字段上
9. **时间预算**：本节不给「1–2 周」这类天数。书内已有的口径在 [Ch99 · 01-future-plans §7.2 分族表「认知框架族」行](../99-outro/01-future-plans/01-future-plans-section-7-sec7.md)——认知框架族按**每本 8–20 小时**【经验】量级算，且那是**区间量级，不是承诺**；完整时间账见同文件 §7.4

> 每个主题的完整原始材料清单（含证据等级与逐条核验动作）在其 §5.4「公开进展与文献」，例如 [01 ADR §5.4](./01-adr/01-adr-section-5-ai.md)；本节不提供外部链接，一律按题名 / 产品名自行检索当前版本。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch14 · 团队管理与领导力](../14-leadership/) 继续阅读（决策需要组织能力支撑）
- 进入 [Ch15 · 案例库](../15-case-studies/) 看真实工业级决策案例