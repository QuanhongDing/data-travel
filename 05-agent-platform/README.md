# Ch5 · AI 智能体平台架构

> **一句话定位**：企业级私有化 AI 智能体平台从 0 到 1——安全可控 / 可编排 / 自进化的整体架构。

## 画像映射

本章对应 **核心职责① AI 智能体平台整体架构**：

- 私有化部署、企业级 AI 基础设施 0→1
- 安全可控、可编排、自进化的平台能力
- 智能体架构（ReAct / Plan-Execute / Reflexion）、框架（LangChain / AutoGPT / OpenClaw）、MCP 协议

> P7 会"接 API 调 Agent"，P8 会"搭 Agent Demo"，**资深架构师会"建企业级 Agent 平台"**——把单 Agent 编排成可生产、可治理、可演进的企业平台。

## 基本信息

- **难度**：★★★★★
- **推荐角色**：AI 架构师 / 平台架构师 / 技术负责人
- **前置章节**：[Ch4 · 企业级数据资产化与智能检索](../04-data-assetization/)（Agent 依赖 RAG 与数据资产）
- **后续章节**：[Ch6 · 多模型编排与工具调用](../06-multi-model/)（Agent 的核心调度层）；[Ch7 · AI 资产沉淀与自进化](../07-agent-evolution/)（自进化闭环）

## 本章要回答的核心问题

1. **智能体（Agent）的核心架构模式有哪些？** ReAct / Plan-Execute / Reflexion / Multi-Agent 各自的适用场景与边界？
2. **智能体框架怎么选型？** LangChain / LangGraph / AutoGPT / AutoGen / OpenClaw / CrewAI——能力差异与生产可用性？
3. **MCP（Model Context Protocol）协议怎么落地？** 工具（Tool）/ 资源（Resource）/ 提示（Prompt）三件套的标准化接入？
4. **单 Agent vs Multi-Agent 怎么取舍？** 集中式编排 vs 去中心化协同——任务可分解性、调试复杂度、可观测性？
5. **私有化部署 vs SaaS 怎么选？** 国产化适配、网络隔离、数据合规——企业级硬约束如何满足？
6. **Agent 的可靠性如何保障？** Prompt 工程、Token 成本、可观测性、容错与重试、Hallucination 抑制？
7. **工具调用（Function Calling / Tool Use）怎么设计？** JSON Schema 标准化、参数校验、副作用隔离、权限控制？

## 子主题

- [ ] **[Data Agent](01-data-agent/01-data-agent.md)**：面向数据分析的智能体（Text2SQL + 数据可视化 + 指标解读），AI 时代数据架构师的核心交付物
- [ ] **[企业级智能体平台架构](02-agent-platform-architecture/02-agent-platform-architecture.md)**：把 Agent 收进平台——运行时、状态与检查点、多租户与配额、工具出口治理、发布灰度回滚、私有化交付与平台级成本归因

> 文件命名建议：`data-agent.md` / `agent-architecture.md` / `langchain-framework.md` / `mcp-protocol.md` / `multi-agent-orchestration.md` / `function-calling.md` / `prompt-engineering.md` / `reliability-and-observability.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 区分单 Agent 与 Multi-Agent 模式，并选择合适的智能体架构（ReAct / Plan-Execute / Reflexion）
- 在 LangChain / AutoGPT / OpenClaw 等框架间做出选型决策
- 落地 MCP 协议，实现工具 / 资源 / 提示的标准化接入
- 设计 Function Calling 的工具链（JSON Schema / 参数校验 / 副作用隔离）
- 把 Demo 级的 Agent 编排成可生产的企业级平台（可靠性 / 可观测 / 成本）
- 满足私有化部署的国产化、网络隔离、数据合规要求
- **从单 Agent 到企业级 Agent 平台**——这是 AI 时代架构师的核心交付能力

## 推荐资料

> **本节是索引，不是新书单**：下列每一条的书名 / 论文题名 / 规范名 / 产品名，都能在本书他处找到同一条记录——**定位按栏给出**：条目内标 § 号或文件链接；整栏同出于一处的（产品名 / 基准名 / 框架名集中的那几栏）在该栏末给出原记录的文件与节，用户按栏末入口即可回到原记录。本节只做归拢，**不新增任何未具名的材料，也不替读者裁定各条之间不一致的年份**。
> 本书在无网络环境交付，**不提供链接**——每条给出的核验入口是「按题名（或条目名）自行检索」（与 [Ch15 案例库](../15-case-studies/) 同一做法）；产品与规范的版本、发布日期一律**以官方页面当前条目为准**，本节只做归类、不裁定 GA 状态。档位：【公开】用于转引的题名 + 年份，收录范围与分级的判断用【经验】。
> 用法：先用两个主题文件建骨架（[01 Data Agent](01-data-agent/01-data-agent.md) / [02 企业级智能体平台架构](02-agent-platform-architecture/02-agent-platform-architecture.md)），再用各自 §5「前沿演进」的判据表给方向分级，最后回到本节按图索骥。

### 经典书目（方法论与工程底座）

| 书 | 作者 | 重点章节 | 阅读建议 |
| --- | --- | --- | --- |
| *Reinforcement Learning: An Introduction*（2nd Ed., MIT Press 2018） | Sutton & Barto | 全书 | RL 形式化、Q-Learning、Policy Gradient 的标准教材——读它才分得清自动化决策里哪些是模型、哪些是规则 |
| *Site Reliability Engineering* | Google SRE 团队 | 第 6–7 章「消除琐事」、第 14 章 Postmortem、第 30 章规模化发布 | 自愈、复盘、灰度三件事的方法论出处；对应本章 §8 的自愈与发布类题目 |
| *The Site Reliability Workbook* | Google SRE 团队 | Postmortem 模板与 RACI | 与上一本配套，补「模板怎么落成组织流程」 |
| *Systems Performance* | Brendan Gregg | 第 2 / 11 章 | 基础资源指标在自愈系统中的标准用法 |
| *BPF Performance Tools* | Brendan Gregg | 按需取用 | 与《Site Reliability Engineering》配套的可观测方法论 |
| 《大数据之路：阿里巴巴大数据实践》 | 阿里数据团队 | 「集群自愈」「故障复盘」相关章节 | 国内超大集群「阈值规则 + 已知 playbook」的实践范本 |

> 上表核验入口：**按书名 + 作者自行检索**，版本以出版社版权页为准（章节号照 [01 主题 §8 参考资料](01-data-agent/01-data-agent-section-8-sec8.md) 的原记录转引）【公开】。
> 这一栏只收工程底座一类：**本章不列「智能体方法」专著**——公开材料里没有一本能同时覆盖 ReAct / 编排 / 平台治理三段的书，硬凑一本就是把综述当教材【经验：这是本节按收录状态记下的判断，不等于「公开材料里没有」】。

### 工业材料与官方文档（判定入口）

> 这一栏的特点是**进页面即可核验**：每条给出一句可检查的「判定点」。产品名**只作为判定入口**出现，本节不对任何产品的能力或状态做断言。

- **MCP（Model Context Protocol）规范**——工具 / 资源 / 提示三件套的协议化接入，记为由 Anthropic 于 2024 年公开（记录见 [02 主题 §5.3.2](02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md)；同一条的另两处记录见该文件 §5.4.1 与 §8 参考资料，其中 §5.4.1 并记 2025 年被 OpenAI Agents SDK 公开采纳）。**判定点**：三件套是不是被定义成一等对象。（按规范名自行检索核验，版本以规范官方页面当前条目为准）【公开】
- **OpenTelemetry Semantic Conventions 的 `gen_ai.*` 属性组**——记为 2024 年前后加入、该仓库当前标注为**实验性**（记录见 [02 主题 §5.4.1](02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md)；机制见该文件 §5.3.4，但那一节明写不给名称与版本；原始出处 `11-cross-cutting/04-observability/04-observability-section-5-ai.md` §5）。**判定点**：会话 / 步骤 / 模型调用 / 工具调用四段有没有被约定固定下来。（按语义约定名自行检索核验）【公开】
- **持久化工作流引擎的官方文档（Temporal 一类）**——本章只以「引擎」这一族出现，机制性记录只有一条，在 `03-data-stack/07-architecture-decisions/07-architecture-decisions-section-8-sec8.md`（转引见 [02 主题 §5.4.1](02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md)）；**产品级点名另见** [02 主题 §7.3.3](02-agent-platform-architecture/02-agent-platform-architecture-section-7-sec7.md)（并记 Camunda / Flowable 一类与 LangGraph / AutoGen / CrewAI）与 `12-architecture/08-data-consistency/08-data-consistency-section-7-sec7.md` §7.2 候选表的 Saga 行（把 Temporal、Cadence、Seata Saga 并列为开源编排引擎）。**判定点**：恢复语义是不是一等接口。（按引擎名自行检索核验）【公开】
- **指标语义层的官方文档**——dbt Semantic Layer（2023 推出；**GA 时点公开材料另有 2024 一说，两条不一致，本章两条都保留、不裁定**）/ Cube.js / MetricFlow / 阿里 QuickBI 指标中台 / 网易有数指标库 / Kylin（Apache，OLAP 引擎，间接支持）（记录见 [01 主题 §4.3](01-data-agent/01-data-agent-section-4-sec4.md) 工具链表「指标语义层」行）。**判定点**：官方文档里「指标定义文件」与「查询接口」是不是分成两节。（按产品名自行检索核验）【公开】
- **编排框架的官方文档**——LangChain（2022+）/ LangGraph（2024）/ LlamaIndex（2022+）/ AutoGen（Microsoft 2023）/ CrewAI（2024）/ MetaGPT（2024）/ OpenInterpreter（2023）（记录见 [01 主题 §4.3](01-data-agent/01-data-agent-section-4-sec4.md) 工具链表「Agent 编排框架」行）。**判定点**：框架把「反思产物」定义成什么结构的对象——只有一个重试次数的框架，等于没把纠错信号建模进去。（按框架名自行检索核验）【公开】
- **沙箱运行时的官方文档**——E2B 一类云沙箱 / 阿里 Code Interpreter 一类云函数 + 隔离容器 / OpenInterpreter 一类本地执行 / Jupyter Kernel Gateway；同书他处另记 Cognition Devin 的 Docker 沙箱（`07-agent-evolution/04-agent-skill-extraction/04-agent-skill-extraction-section-6-sec6.md`，转引见 [02 主题 §5.4.1](02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md)）。**判定点**：**挂载面清单**（网络 / 文件 / 凭证 / 数据库），而不是隔离技术的名词。（按产品名自行检索核验）【公开】
- **可观测与成本工具的官方文档**——Langfuse（开源）/ Phoenix（Arize）/ LangSmith（LangChain 官方）/ Helicone / Datadog LLM Observability（2024+）（记录见 [01 主题 §4.3](01-data-agent/01-data-agent-section-4-sec4.md) 工具链表「可观测与成本」行）。**判定点**：能不能按「段」分开上报延迟与成本——只报总耗时的链路，排障时定位不到具体一段。（按产品名自行检索核验）【公开】
- **Schema RAG 的向量库文档**——Milvus / Qdrant / Weaviate / Pinecone / Chroma / pgvector。**判定点**：索引过期后的召回表现，而不是压测时的峰值吞吐（[01 主题 §4.3](01-data-agent/01-data-agent-section-4-sec4.md) 的「不选它的代价」一列给的就是这条）。（按产品名自行检索核验）【公开】
- **公开基准的官网与榜单**——BIRD-SQL 2.0（2024）/ Spider 2.0（2024）/ Spider 1.0（2018）/ WikiSQL（2017）/ EHRSQL（医疗领域）（记录见 [01 主题 §4.3](01-data-agent/01-data-agent-section-4-sec4.md) 工具链表「评估与基准」行）。**判定点**：任务设定是否含外部知识、参与评估的是单条 SQL 还是整条 Agent 链路。（按基准名自行检索核验）【公开】
- **平台产品的 Data Agent 能力文档（国产）**——阿里瓴羊 QuickBI 智能助手 / 字节豆包数据分析 / 百度 Sugar BI 智能助手 / 腾讯 ChatBI / 网易有数 AI / 火山引擎 Data Agent；**（国际）**——Salesforce Tableau GPT（2023）/ Microsoft Copilot for Power BI（2024）/ ThoughtSpot Sage（2023）/ Google Gemini in Looker（2024）/ Databricks Assistant / Genie（2024）/ Snowflake Cortex Analyst（2024）；**（平台产品）**——微软构建侧与运行侧两组公开接口（2019–2024）/ 字节扣子 Coze 的四类构建块（2023–2024）（国产 / 国际两行的记录见 [01 主题 §4.3](01-data-agent/01-data-agent-section-4-sec4.md) 工具链表的「国产平台」与「国际平台」两行；微软两组接口与 Coze 四类构建块的记录见 [02 主题 §5.4.1](02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md)，原案例在该文件 §6.1 / §6.3）。**判定点只有一条**：它接的是**你的**语义层与权限模型，还是它自己的——看官方文档里有没有「接入外部语义层 / 外部指标定义」这条路径。（按产品全名 + 该能力的输入输出形态核对，不按能力名归类）【公开】
- **不收的一类**：[01 主题 §4.3](01-data-agent/01-data-agent-section-4-sec4.md) 工具链表里「LLM 基础模型」那一行是**采购候选**而不是阅读材料，本节不入索引——模型代号与版本是本索引里变动最快的一类，按该行自己的判据（能否私有化、上下文是否够装全量 schema）现场核更快【经验：这是本节对收录范围的判断】。

### 建设方案例（本章 §6 的 8 个【公开：计数照 01 / 02 两主题 §6 的案例小节数】）

> 本章 §5.4 对这类材料有明确定性：**建设方自述，不构成第三方（非厂商）公开生产案例**。在这里索引它们，是为了找到「机制被谁做成了产品」，不是为了引用它们的数字。

- 阿里瓴羊 QuickBI 智能助手：先把指标语义层立住，再谈自然语言取数（2020–2024）——[01 主题 §6.1](01-data-agent/01-data-agent-section-6-sec6.md)
- 字节：跨业务统一指标语义，让同一个问法在各业务线上得到同一个答案（2020–2024）——[01 主题 §6.2](01-data-agent/01-data-agent-section-6-sec6.md)
- 微软：Power BI + Copilot 把企业级权限与审计做成产品的一等能力（2021–2024）——[01 主题 §6.3](01-data-agent/01-data-agent-section-6-sec6.md)
- Salesforce：Tableau GPT 把语义层挂到业务系统本身的数据模型上（2021–2024）——[01 主题 §6.4](01-data-agent/01-data-agent-section-6-sec6.md)
- 微软：把「定义」与「运行」做成两个面，发布与回滚成为产品级接口（2019–2024）——[02 主题 §6.1](02-agent-platform-architecture/02-agent-platform-architecture-section-6-sec6.md)
- OpenAI：把会话与步骤做成可查询的服务端资源（2023–2024）——[02 主题 §6.2](02-agent-platform-architecture/02-agent-platform-architecture-section-6-sec6.md)
- 字节：扣子 Coze 把插件、工作流与知识库收进同一个构建面（2023–2024）——[02 主题 §6.3](02-agent-platform-architecture/02-agent-platform-architecture-section-6-sec6.md)
- 某大型制造企业：把 Agent 平台交付进不联网的机房（**匿名案例**，2021–2024）——[02 主题 §6.4](02-agent-platform-architecture/02-agent-platform-architecture-section-6-sec6.md)

> 核验入口：以上均为本书对公开材料（厂商文档 / 技术分享）的复述，**按机构名 + 年份区间自行检索**【公开】；是否构成第三方生产案例的认定见 [01 主题 §5.4](01-data-agent/01-data-agent-section-5-ai.md) 与 [02 主题 §5.4.1](02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md) 的「第三方生产案例」一段——两处结论一致：**核不到**【经验】。

### 论文与公开基准（可核验）

| 题名 | 出处 / 年份 | 在本章的落点 |
| --- | --- | --- |
| *Seq2SQL / WikiSQL* | Zhong et al., 2017 | 「自然语言 → SQL 约束在单表」，§1.4 演进历程第二阶段（ChatBI / NL2BI 阶段 2017–2022）的锚点 |
| *Spider* | Yu et al., EMNLP 2018 | 跨表跨库设定，暴露「选表」与「组合」两类新错误；同属 §1.4 第二阶段，机制证据见 §7.3 的公开证据行 |
| *BIRD-SQL* | Li et al., NeurIPS 2023 | 引入外部知识与更大的库，更接近企业场景；§1.4 演进历程第三阶段（LLM 驱动的 Data Agent 阶段 2023+）的锚点，机制证据见 §7.3 的公开证据行 |
| *ReAct: Synergizing Reasoning and Acting in Language Models* | Yao et al., 2022（本书他处亦记 ICLR 2023，**两处不一致，本章不裁定**） | §3.2.1 的机制来源 |
| *Reflexion: Language Agents with Verbal Reinforcement Learning* | Shinn et al., 2023 | §5.2.2「执行反馈回灌」的机制来源 |
| *DIN-SQL* / *MAC-SQL* / *CHESS* | 2023 / 2024 / 2024 | §3.2.3–§3.2.4 的「分解 / 多角色 / 校验重写」代表方案（§5.1 表另列 *SQL-PaLM* 与 *DAIL-SQL*，仅作方案名，无年份） |
| *Microsoft Research GraphRAG* 开源项目与技术博客 | 2024 | §5.1 表「GraphRAG + Data Agent」一行（L3）的可核验入口 |
| *Toolformer: Language Models Can Teach Themselves to Use Tools* | Schick et al., NeurIPS 2023 | 工具调用从提示工程变为模型能力的公开依据（记录见 [02 主题 §5.4.1](02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md) 的文献行） |
| *AgentBench* / *WebArena* / *OSWorld* | 2023 / 2023 / 2024（本书他处亦记 AgentBench 为 2024 / ICLR 2024，**两处不一致，本章不裁定**） | 平台级评估的公开形态（02 主题 §5.2 表最后一行；记录见 [02 主题 §5.4.1](02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md) 的文献行）；**它们不是「多 Agent 分工与仲裁」的证据** |
| *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks* / *WebGPT* | Lewis et al., NeurIPS 2020（归属 Facebook AI，**不是** OpenAI）/ Nakano et al., 2021 | RAG 一族的两篇原始参考（01 主题 §8） |
| *Self-Consistency Improves Chain of Thought Reasoning in Large Language Models* | Wang et al., 2022（本书他处亦记 ICLR 2023，**两处不一致，本章不裁定**） | 与 Reflexion / CoT 并列的事实性基线（记录见 [01 主题 §8](01-data-agent/01-data-agent-section-8-sec8.md) 的参考资料） |
| *LoRA: Low-Rank Adaptation of Large Language Models* / *Training language models to follow instructions with human feedback* | Hu et al., 2021 / Ouyang et al., 2022 | 私有 Schema 与私有方言微调的适用边界（01 主题 §8） |
| *SHAP（SHapley Additive exPlanations）* | Lundberg & Lee, 2017 | 特征可解释性的事实标准（01 主题 §8） |

> 核验入口：**按论文题名自行检索**，年份以论文页与会议官网的当前条目为准；同一题名在本书他处年份不一致的（如 ReAct 的 2022 与 ICLR 2023），本节照原样并记、不替读者裁定【公开】。
> 本表题名的原记录：NL2SQL 基准与代表方案一类见 [01 主题 §5.4](01-data-agent/01-data-agent-section-5-ai.md) 的文献行（§7.3 另有这三个基准的机制证据行），RAG / LoRA / SHAP 三条见 [01 主题 §8](01-data-agent/01-data-agent-section-8-sec8.md) 的参考资料，平台级评估三条与 Toolformer 见 [02 主题 §5.4.1](02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md) 的文献行。
> 本章 §5.4 把「NL2SQL 综述（2024 ACL）」与「CodeS（2024）」显式标为**无法核验**（给的是主题名而非可检索的题名与作者），本索引因此**不收**这两条——收录状态本身就是判断依据【经验】。

### 2024–2025 前沿：方向 → 具名载体

> 这张表只做一件事：把本章 §5 两张分级表里的**方向**对到**可点名的载体**上。**级别与载体名照原表转引【公开】**；两个主题**没有任何一行达到 L1**【经验】，卡点全在「第三方（非厂商）生产案例核不到」这一条。核验入口写在表头一列：**按题名 / 条目名自行检索**。

| 方向 | 级别 | 具名载体（按题名 / 条目名自行检索核验） |
| --- | :---: | --- |
| 执行反馈回灌（Self-Correction / Reflexion） | L2 | DIN-SQL / MAC-SQL / CHESS / SQL-PaLM / DAIL-SQL（[01 主题 §5.1](01-data-agent/01-data-agent-section-5-ai.md)） |
| 指标语义层 / Headless BI | L2 | dbt Semantic Layer / Cube / MetricFlow——**它是前置条件，不是 AI 方向**（记录见 [01 主题 §5.1](01-data-agent/01-data-agent-section-5-ai.md) 表同名行与 [§4.3](01-data-agent/01-data-agent-section-4-sec4.md) 工具链表「指标语义层」行） |
| Code Interpreter 与 Data Agent 融合 | L2 | E2B / 阿里 Code Interpreter / OpenInterpreter；「沙箱产物是否可复现」仍无约定（记录见 [01 主题 §5.1](01-data-agent/01-data-agent-section-5-ai.md) 表同名行与 [§4.3](01-data-agent/01-data-agent-section-4-sec4.md) 工具链表「沙箱执行」行） |
| RAG + SQL 混合 / Schema RAG | L2 | Milvus / Qdrant / Weaviate / Pinecone / Chroma / pgvector（记录见 [01 主题 §5.1](01-data-agent/01-data-agent-section-5-ai.md) 表同名行与 [§4.3](01-data-agent/01-data-agent-section-4-sec4.md) 工具链表「向量数据库（Schema RAG）」行） |
| Agent 评估体系 | L2 | BIRD-SQL 2.0 / Spider 2.0——**公开基准只做横向可比，回归要用内部真实问题集**（记录见 [01 主题 §5.1](01-data-agent/01-data-agent-section-5-ai.md) 表同名行与 [§4.3](01-data-agent/01-data-agent-section-4-sec4.md) 工具链表「评估与基准」行） |
| NL2DSL / GraphRAG 接取数 / 指标因果引擎 / Data Agent Marketplace | L3 | 四条里只有 GraphRAG 有开源项目（Microsoft Research，2024），原始记录见 [01 主题 §5.4](01-data-agent/01-data-agent-section-5-ai.md) 的文献行；其余三条**无正式条目**，本章记为「等信号」【经验：收录状态判断，照 §5.1 表各行「判据（可核验）」一列的首条】 |
| 控制面 / 数据面分离；工具协议化；持久化执行；Agent 可观测；沙箱执行 | L2 | 微软构建侧 / 运行侧两组接口；MCP；Temporal 一类引擎；OpenTelemetry `gen_ai.*`；E2B / Devin Docker 沙箱（[02 主题 §5.2](02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md)） |
| 多 Agent 分工与仲裁；平台级评估与回放 | L3 | *Multi-Agent Collaboration for Text2SQL*（方案名，记录见 [01 主题 §5.1](01-data-agent/01-data-agent-section-5-ai.md) 表「Multi-Agent 职责切分」行）；*AgentBench* / *WebArena* / *OSWorld*（基准，记录见 [02 主题 §5.4.1](02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md) 的文献行）——**回放语义各家不同，没有公共契约** |

### 学习路径建议

> 这条路径只给**顺序与落点**，不给天数——本书没有可核验的学时数据【经验】。路径里引到的小节号（§3.2 / §4.1 / §4.3 / §5.1 / §5.2 / §7.7 等）与「8 步走」「八个模式」「执行层五件套」这些计数，均照本章两个主题文件的原有表述转引【公开】。

1. **先建骨架**：本章两个主题文件——[01 Data Agent](01-data-agent/01-data-agent.md)（数据查询类智能体的标准实现模板）+ [02 企业级智能体平台架构](02-agent-platform-architecture/02-agent-platform-architecture.md)（把 Agent 收进平台）。
2. **模式与机制**：[01 §3 设计模式与范式](01-data-agent/01-data-agent-section-3-sec3.md) 的 ReAct / Plan-Execute / Reflexion 决策表 → [02 §3 设计模式与范式](02-agent-platform-architecture/02-agent-platform-architecture-section-3-sec3.md) 的八个平台模式（会话状态 / 工具出口 / 配额 / 版本指针）。
3. **工程落地**：[01 §4 工程实现](01-data-agent/01-data-agent-section-4-sec4.md) 的 8 步走与 §4.3 工具链表 → [02 §4 工程实现](02-agent-platform-architecture/02-agent-platform-architecture-section-4-sec4.md) 的 §4.1 落地顺序、§4.5 模板与 §4.6 成本。
4. **按级别再投入**：读 [01 §5.1](01-data-agent/01-data-agent-section-5-ai.md) 与 [02 §5.2](02-agent-platform-architecture/02-agent-platform-architecture-section-5-ai.md) 两张分级表——L2 可做 PoC 但必须自带退出条件，**L3 不排进排期**。
5. **用案例定机制边界**：[01 §6 落地实践](01-data-agent/01-data-agent-section-6-sec6.md)（阿里瓴羊 / 字节 / 微软 / Salesforce）+ [02 §6 落地实践](02-agent-platform-architecture/02-agent-platform-architecture-section-6-sec6.md)（微软 / OpenAI / 字节扣子 / 某制造企业），读时记住它们是**建设方自述**。
6. **选型与自测**：[01 §7 与其他方法对比](01-data-agent/01-data-agent-section-7-sec7.md) 与 [02 §7 与其他方法对比](02-agent-platform-architecture/02-agent-platform-architecture-section-7-sec7.md) 的候选全景与选型矩阵（含 §7.7「选错的代价」）；最后用 [01 §8](01-data-agent/01-data-agent-section-8-sec8.md) 与 [02 §8](02-agent-platform-architecture/02-agent-platform-architecture-section-8-sec8.md) 的面试真题集自测。
7. **顺序上的一条硬约束**：先做三件**不是演进方向**的事——把指标定义写成机器可读、把执行层五件套装上（只读账号 / 行级权限 / 超时 / 行数上限 / 敏感列脱敏）、建固定评估集（[01 主题 §5.1](01-data-agent/01-data-agent-section-5-ai.md) 末的「先做的三件事」）。没有这三件事，「换了模型或加了 Agent 有没有变好」无从判断。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch6 · 多模型编排与工具调用](../06-multi-model/) 学习多模型路由
- 进入 [Ch7 · AI 资产沉淀与自进化](../07-agent-evolution/) 学习自进化闭环
