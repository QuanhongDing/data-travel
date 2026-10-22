# Ch7 · AI 资产沉淀与自进化

> **一句话定位**：使用 - 沉淀 - 复用 - 优化闭环——让 AI 越用越聪明，让组织能力沉淀为 Agent 能力。

## 画像映射

本章对应 **核心职责④ AI 资产沉淀与自进化系统**：

- AI 资产全生命周期管理
- 使用 - 沉淀 - 复用 - 优化闭环
- 知识图谱自进化、A/B 实验平台、反馈学习（RLHF / RLAIF）
- 组织级长期记忆、技能提取与固化

> P7 会"用 Agent"，P8 会"调 Agent"，**资深架构师会让 Agent "越用越聪明"**——让每一次使用都成为组织能力。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：AI 架构师 / 平台架构师 / 技术负责人
- **前置章节**：[Ch5 · AI 智能体平台架构](../05-agent-platform/)（自进化建立在 Agent 平台之上）
- **后续章节**：[Ch8 · AI 治理与安全](../08-ai-governance/)（资产沉淀的合规边界）；[Ch9 · 数据智能产品](../09-data-intelligence-product/)（沉淀的资产可以产品化）

## 本章要回答的核心问题

1. **AI 资产的全生命周期是什么？** Prompt / Skill / Tool / Agent / Workflow / Model——从创建、评审、上线、迭代到下线的全流程？
2. **组织级长期记忆怎么设计？** 个人记忆 / 团队记忆 / 组织记忆——如何用向量库 + 知识图谱 + KV 存储分层组织？
3. **会话资产怎么沉淀？** 优秀会话筛选、Skill 提取、Prompt 模板化——如何把"一次好回答"变成"组织可复用的资产"？
4. **反馈闭环怎么搭建？** 用户反馈（点赞 / 点踩 / 修改）/ 业务结果（CTR / 转化）/ 人工标注——回流到训练与微调？
5. **A/B 实验平台怎么设计？** 流量分层、实验配置、效果归因——让"哪个 Prompt / Skill 更好"可量化？
6. **RLHF / RLAIF 怎么落地？** 人类反馈 / AI 反馈强化学习——如何用偏好数据微调模型与 Prompt？
7. **知识图谱怎么自进化？** 新实体 / 新关系自动抽取、冲突检测、图谱融合——让 KG 越用越完整？

## 子主题

- [ ] **[长期记忆](./01-long-term-memory/README.md)**：个人 / 团队 / 组织三层 Agent 长期记忆——让 AI 越用越懂业务、越用越懂人
- [ ] **[反馈闭环](02-feedback-loop/02-feedback-loop.md)**：用户反馈 / 业务结果 / 人工标注回流——把线上数据变成模型迭代的燃料
- [ ] **[资产管理](./03-asset-management/README.md)**：Prompt / Skill / Tool / Agent / Model 的全生命周期管理——AI 资产的"ERP 系统"
- [ ] **[Agent 技能提取](./04-agent-skill-extraction/README.md)**：从优秀会话中自动提取可复用的 Skills——让组织能力沉淀为 Agent 能力

> 文件命名建议：`long-term-memory.md` / `feedback-loop.md` / `asset-management.md` / `agent-skill-extraction.md` / `rlhf-and-rlaif.md` / `ab-experiment-platform.md` / `knowledge-graph-evolution.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 设计 AI 资产的全生命周期管理流程（创建 / 评审 / 上线 / 迭代 / 下线）
- 搭建组织级长期记忆系统（个人 / 团队 / 组织三层记忆）
- 用会话资产沉淀与 Skill 提取，把"一次好回答"变成"组织可复用的资产"
- 设计反馈闭环（用户反馈 / 业务结果 / 人工标注），让线上数据回流到训练
- 搭建 A/B 实验平台，让"哪个 Prompt / Skill 更好"可量化
- 落地 RLHF / RLAIF，用偏好数据微调模型与 Prompt
- 让知识图谱自进化（新实体 / 新关系自动抽取）
- **让 AI 越用越聪明**——这是"自进化"的核心价值

## 推荐资料

> **这一节是索引，不是新书单。** 下面每一条都是本章四个主题正文（§1–§8）已经引用过的具名材料，按「经典 / 工业材料 / 前沿」三栏归拢到一处，便于按图索骥；不在本章别处出现过的书名、论文名、产品名，本节一律不收。
>
> 本章的主题——长期记忆、反馈闭环、资产治理、技能提取——大多在 2022 年之后才成为工程议题，因此**「经典」一栏明显比 Ch1 薄**：成型教材少，奠基论文与官方文档多。凑不满就不凑。
>
> **无网络环境，本节不给链接。** 每条后面给的是核验入口：按什么题名去论文库 / 官方文档站 / 标准文本检索，以及检索到手后核什么。产品文档页与发布说明随版本更新，同一个页面在不同时间检索到的内容并不相同，标一个固定年份反而不可复现——这类只给检索点与判定标准，不给年份。

### 经典：书、标准与奠基论文

**书**（作者与章号以本章正文的引用为准，检索时按版权页核对版次）：

| 书 | 作者 | 重点章节 | 阅读建议 |
| --- | --- | --- | --- |
| *The Data Warehouse Toolkit* | Ralph Kimball | Ch.5 缓慢变化维（SCD Type 2） | 本章 [01 §8](01-long-term-memory/01-long-term-memory-section-8-sec8.md) 借它给「记忆里的事实版本化」找建模基线：UPDATE 时版本号与起止时间窗口怎么写，数仓侧早有现成答案。核验入口：按书名 + SCD Type 2 检索，核对版次与章号。 |
| *Trustworthy Online Controlled Experiments* | Ron Kohavi / Diane Tang / Ya Xu | 分流设计、指标与护栏指标的定义章节 | 反馈闭环里唯一有公开方法论共识的是「测量」那一层，这本书是它的出处。本章 [02 §5.4](02-feedback-loop/02-feedback-loop-section-5-ai.md) 引方法、[03 §8](03-asset-management/03-asset-management-section-8-sec8.md) 引样本量与护栏指标。核验入口：按书名检索，以版权页核对作者与版次，不要用二手转述代替原文。 |
| *Operating System Concepts* | 本章正文未署名（按题名检索即可确认） | Ch.9 虚拟内存 | 读它是为了看清分页式记忆（MemGPT / Letta 那条线）借的类比从哪来——「为什么 OS 用硬件做决策」在 [01 §8](01-long-term-memory/01-long-term-memory-section-8-sec8.md) 被当作工程源头引用。核验入口：按书名检索，核对版次（不同版次的章号会变）。 |

**标准与规范**（本章对它们的用法是「合规义务」而非「技术选型」，所以单列一表）：

| 标准 / 规范 | 本章落点 | 核验入口 |
| --- | --- | --- |
| 欧盟 GDPR《General Data Protection Regulation》 | [01 §8](01-long-term-memory/01-long-term-memory-section-8-sec8.md) 引第 17 / 20 / 22 / 30 条（被遗忘权、数据可携权、反对自动化决策、处理活动记录）；[03 §8](03-asset-management/03-asset-management-section-8-sec8.md) 引它做上架合规等级 | 按条号检索法规原文，核条号而不是二手解读 |
| 中国《个人信息保护法》 | 同两处的删除权 / 自动化决策 / 个人请求响应 | 按条文检索官方文本 |
| 中国《数据安全法》 | [03 §8](03-asset-management/03-asset-management-section-8-sec8.md) 的国内资产合规强制性要求 | 同上 |
| 《生成式人工智能服务管理暂行办法》 | [02 §8](02-feedback-loop/02-feedback-loop-section-8-sec8.md) 的国内 AI 服务合规基础 | 按题名检索网信办发布稿，以官方版本为准 |
| 欧盟《Artificial Intelligence Act》 | 同处的 AI 系统全生命周期合规框架（本章记 2024 通过） | 按法规名检索官方文本，核对通过与分阶段适用的时间 |
| NIST《AI Risk Management Framework》 | 同处的美国 AI 治理框架（本章记 AI RMF 1.0，2023） | 按 AI RMF 检索 NIST 官方页 |
| OWASP Top 10 for LLM Applications | [03 §8](03-asset-management/03-asset-management-section-8-sec8.md) 多处：Prompt 注入被列为 LLM 应用最高风险 | 按题名检索，核对版本年（本章同时引到 2023 与 2024 两版） |
| HIPAA / SOC2 / 等保 2.0（三级） | [01 §8](01-long-term-memory/01-long-term-memory-section-8-sec8.md) 的医疗合规与 BAA 协议；[03 §8](03-asset-management/03-asset-management-section-8-sec8.md) 的企业级合规等级与政企上架要求 | 分别按题名检索官方文本与官方解读 |
| semver.org 官方规范（SemVer 2.0.0） | [03 §8](03-asset-management/03-asset-management-section-8-sec8.md) 的版本管理标准出处 | 按规范名检索官方站点，核对 2.0.0 的兼容性判据 |

**奠基论文**（本章 §5.4「公开进展与文献」与各 §8「参考资料」反复引用的原始工作；2024–2025 一档另见下节）：

| 主题 | 论文 / 原始工作 | 本章落点 | 核验入口 |
| --- | --- | --- | --- |
| 记忆 | MemGPT《MemGPT: Towards LLMs as Operating Systems》（2023） | 分页式记忆的原始出处，[01 §5.4](01-long-term-memory/01-long-term-memory-section-5-ai.md) 与 [01 §8](01-long-term-memory/01-long-term-memory-section-8-sec8.md) 均引 | 按题名检索论文页，核对提交年月 |
| 记忆 | RAG《Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks》（2020） | [01 §8](01-long-term-memory/01-long-term-memory-section-8-sec8.md) 用它划「LTM 不被 RAG 替代」的边界 | 按题名检索，核对收录会议 |
| 反馈 | Christiano 等（NeurIPS 2017） | [02 §7.3](02-feedback-loop/02-feedback-loop-section-7-sec7.md) 记它是「从人类偏好学奖励」的原始工作 | 按作者 + 会议年份检索（本章未给题名） |
| 反馈 | InstructGPT《Training Language Models to Follow Instructions with Human Feedback》（2022） | RLHF 三段式的公开出处，[02 §5.4](02-feedback-loop/02-feedback-loop-section-5-ai.md) 与 §8 均引 | 按题名检索，核对发布机构与年份 |
| 反馈 | DPO《Direct Preference Optimization: Your Language Model is Secretly a Reward Model》（2023） | 「基线从哪来」的分野，同上两处 | 按题名检索，核对收录会议 |
| 反馈 | Constitutional AI《Constitutional AI: Harmlessness from AI Feedback》（2022） | 自反馈路线之一：判据写进一份书面原则 | 按题名检索 |
| 反馈 | Self-Refine（2023） | 自反馈的另一条路线：把修正放在推理时（本章未给题名） | 按题名 + 年份检索 |
| 反馈 | HH-RLHF《Training a Helpful and Harmless Assistant with RLHF》（2022）与 WebGPT（2021） | 用来区分「论文里的原型」与「产品里的实现」 | 分别按题名检索 |
| 反馈 | LLM-as-Judge《Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena》（2023） | 位置 / 长度 / 自我偏好三类偏差的公开出处，[02 §5.4](02-feedback-loop/02-feedback-loop-section-5-ai.md) 与 [03 §5.4](03-asset-management/03-asset-management-section-5-ai.md) 均引 | 按题名检索，核对收录会议 |
| 反馈 | CUPED《Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data》（2013） | [02 §7.2](02-feedback-loop/02-feedback-loop-section-7-sec7.md) 的测量族候选 | 按题名检索，核对发表会议 |
| 反馈 | Interleaving《Interleaving for Search Engine Evaluation》（2012） | 同上 | 按题名检索 |
| 反馈 | FTRL《Ad Click Prediction: a View from the Trenches》（2013） | 在线学习族的原始实现，[02 §7.2](02-feedback-loop/02-feedback-loop-section-7-sec7.md) 与 §7.3 均引 | 按题名检索，核对发表会议 |
| 反馈 | Contextual Bandit《A Contextual-Bandit Approach to Personalized News Article Recommendation》（2010） | 在线决策族的奠基 | 按题名检索，核对发表会议 |
| 反馈 | 《Active Learning Literature Survey》（2009）与《Weak Supervision》 | HITL / 主动学习族的理论侧，[02 §8](02-feedback-loop/02-feedback-loop-section-8-sec8.md) 引 | 分别按题名检索，以条目页信息为准 |
| 资产 | 《Model Cards for Model Reporting》（2019）与《Datasheets for Datasets》（2018） | [03 §5.4](03-asset-management/03-asset-management-section-5-ai.md) 用它俩支撑「自描述字段定成固定字段表」 | 分别按题名检索 |
| 技能 | Voyager《Voyager: An Open-Ended Embodied Agent with Large Language Models》（2023） | 技能库终身增长的原始系统，[04 §5.4](04-agent-skill-extraction/04-agent-skill-extraction-section-5-ai.md) 与 [04 §8](04-agent-skill-extraction/04-agent-skill-extraction-section-8-sec8.md) 均引 | 按题名检索，核对 arXiv 条目页的版本号与首发月份 |
| 技能 | Reflexion《Reflexion: Language Agents with Verbal Reinforcement Learning》（2023） | 程序性记忆的邻近工作——沉淀的是反思文本，不是参数化步骤 | 按题名检索，核对会议版与 arXiv 版 |
| 技能 | ReAct（2022） | [04 主文件 §1.3](04-agent-skill-extraction/04-agent-skill-extraction.md) 的时间线记它把推理与行动合成一条链（本章未给题名） | 按题名 + 年份检索 |
| 技能 | AlphaGo Zero《Mastering the Game of Go without Human Knowledge》（2017）与 AlphaZero《Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm》（2017） | Self-Play RL 的奠基，[04 §8](04-agent-skill-extraction/04-agent-skill-extraction-section-8-sec8.md) 引 | 分别按题名检索；本章对 AlphaZero 有两个时间口径（[04 §8](04-agent-skill-extraction/04-agent-skill-extraction-section-8-sec8.md) 记 2017、[02 §3.2.5](02-feedback-loop/02-feedback-loop-section-3-sec3.md) 记期刊版 2018），核对时区分预印本与期刊版 |
| 技能 | DBSCAN《A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise》（1996）、HDBSCAN《Hierarchical Density Estimates for Data Clustering, Visualization, and Outlier Detection》（2015）、UMAP《UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction》（2018） | 轨迹聚类三件套，[04 §8](04-agent-skill-extraction/04-agent-skill-extraction-section-8-sec8.md) 引 | 分别按题名检索；注意会议 / 期刊收录年与 arXiv 预印本年可能不同 |
| 技能 | HNSW《Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs》（2020，arXiv 预印本 2016）与 Faiss《Billion-scale Similarity Search with GPUs》（2019，arXiv 预印本 2017） | 向量库的算法基础与工业实现，[04 §8](04-agent-skill-extraction/04-agent-skill-extraction-section-8-sec8.md) 引 | 按题名检索，以期刊页与 arXiv 条目页互核 |

### 工业材料：白皮书 / 官方文档 / 开源项目

**长期记忆**（读法是把「官方文档说了什么」与「产品实际能不能删」分开看）：

- Anthropic 官方文档《Memory and context》，另有《Project files》《Prompt caching》两篇相邻条目（[01 §8](01-long-term-memory/01-long-term-memory-section-8-sec8.md)）——核验入口：官方文档站按题名检索，看的是有没有可编程写入与按条目删除接口，不是有没有「记住我」开关。
- OpenAI 官方博客《Memory and new controls for ChatGPT》与官方文档《How your data is used in ChatGPT》——核验入口：官方博客 / 文档站按题名检索，看写入主体是用户显式指令还是模型推断。
- LangChain / LangGraph 官方文档的 Memory 与 Checkpointers 章节（`ConversationBufferMemory`、`ConversationSummaryMemory`、`PostgresSaver`）——核验入口：按类名检索官方文档，判定它管的是「流程状态」还是「用户画像」。
- Letta 官方文档与博客（MemGPT 的工程化平台线）——核验入口：按 `core_memory` / `archival_memory` 检索官方文档。
- Mem0 官方文档《Memory Operations》《Privacy and Compliance》，以及随论文发布的 Mem0 Evals（[01 §4.3](01-long-term-memory/01-long-term-memory-section-4-sec4.md)）——核验入口：按题名检索官方文档，看 DELETE 是否承诺「向量库 + 关系库 + 缓存」三处一致。
- Zep 官方文档《Fact decay policy》与 LongMemEval 基准——核验入口：按题名检索；基准页先看对照方案与评分口径由谁设定，再读结论。
- Microsoft 365 Copilot 官方文档《How Copilot works》、Glean 官方技术博客《Building an Enterprise Search Engine with Personalization》、Salesforce Einstein《How Einstein works》、Notion AI 官方文档与博客——核验入口：分别按题名检索，四者是「RAG 与 LTM 谁主导」的四个产品形态样本。

**反馈闭环**：

- Hugging Face TRL 官方文档（偏好优化实现；同类开源训练库还有 OpenRLHF 与 LLaMA-Factory）——核验入口：仓库的版本发布说明，看偏好数据格式与超参口径有没有跨版本变化，而不是「支持多少种损失函数」。
- Label Studio 官方文档与仓库、Scale AI 官方文档与公开案例、Argilla 官方文档、Snorkel 官方文档——核验入口：分别按题名检索；判定标准是能不能自建（数据不出域）与能不能做冗余标注 + 黄金集。
- Langfuse / Helicone / Arize Phoenix 官方文档（Arize 另有一条漂移监控线）——核验入口：按题名检索官方文档里的 trace 数据结构条目，判定「一次调用能否被还原成可标注的样本」。
- Statsig / GrowthBook、Prometheus + Grafana、火山引擎 A/B 测试官方文档——核验入口：按官方发布说明检索，看分流标识与指标口径怎么定义、怎么随版本变化。
- Netflix Technology Blog（A/B 测试、Interleaving、Bandit、Metacat 等系列）与 LinkedIn Engineering Blog（实验平台系列）——核验入口：按站点 + 主题检索；例：隐式反馈与 Bandit 看 Netflix 那几篇，亿级实验管理看 LinkedIn 那几篇。
- Uber Engineering 关于 Databook / Michelangelo 的公开文章——核验入口：按平台名 + Uber Engineering 检索。
- Vowpal Wabbit（FTRL 与 Contextual Bandit 的开源实现）——核验入口：按项目名检索仓库文档，把「算法公开」与「某平台的托管服务」分开。

**资产管理**：

- 阿里数据技术团队《大数据之路：阿里巴巴大数据实践》——核验入口：按书名检索，重点读 OneData 体系下 Owner 制度的落地那一段。
- MLflow Model Registry 官方文档、LangChain Hub / LangSmith 官方文档、dbt 官方文档关于 `manifest.json` 与 `dependencies.yml` 的章节、Pinecone / Weaviate 官方文档、阿里云 DataWorks 官方文档、Neo4j / Amazon Neptune 官方文档——核验入口：分别按题名检索；核「什么能存在、谁在用、怎么退役」这三问，功能清单本身不构成结论。
- 字节跳动技术博客关于扣子 Coze 的公开分享、阿里云通义星图 / 百炼的官方产品文档与评测模块文档、Salesforce Agentforce 公开技术白皮书、Microsoft Copilot Studio 官方文档、OpenAI 官方公告关于 GPT Store 的发布与创作者政策——核验入口：按产品名 + 功能关键词在官方文档站或公告区检索，以当前版本为准。

**技能提取**：

- Anthropic Engineering Blog《Building effective agents》与 Lilian Weng（前 OpenAI）博客《LLM-powered Autonomous Agents》——核验入口：按题名检索原文；[04 §8](04-agent-skill-extraction/04-agent-skill-extraction-section-8-sec8.md) 已注明「Skills 是工具的编排」这一提法的归属核验不出，引用时请对照原文。
- Cognition Labs 关于 Devin 的公开技术报告、Anysphere / Cursor 公开技术博客（Composer）——核验入口：按公司名 + 产品名检索公开材料；[04 §8](04-agent-skill-extraction/04-agent-skill-extraction-section-8-sec8.md) 明确未给 Token 节省与一致性提升的数字，因为它核不出公开出处。
- LangChain / LangGraph 与 LlamaIndex 官方文档、Hugging Face / Sentence-Transformers 官方文档、AutoGPT（[04 主文件 §1.3](04-agent-skill-extraction/04-agent-skill-extraction.md) 记其自动任务分解）——核验入口：分别按题名检索，判定它负责「把流程跑起来」还是「从轨迹里挖技能」。
- LangChain Hub、Hugging Face Spaces（Skill 与 Prompt 的共享平台）——核验入口：按平台名检索公开材料，看计量与仲裁机制有没有正式文档。
- 阿里通义实验室、字节 Coze、智谱 GLM 的公开技术博客——核验入口：按厂商 + Skill 治理 / 冷启动关键词检索。

### 2024–2025 前沿（论文 / 产品 / 开源）

- **记忆**：Mem0 论文（[01 §5.4](01-long-term-memory/01-long-term-memory-section-5-ai.md) 记 2025-04 提交；产品开源 2024-10 见 [01 §8](01-long-term-memory/01-long-term-memory-section-8-sec8.md)）、Zep《Zep: A Temporal Knowledge Graph Architecture》（2025）、A-Mem（2025）、MemoryBank（[01 §5.4](01-long-term-memory/01-long-term-memory-section-5-ai.md) 已注明「2023」与「2024」两个年份口径并存，差别在取提交年还是会议收录年）——核验入口：分别按题名检索，年份分歧处按条目页自证。
- **记忆（产品侧）**：Anthropic 与 OpenAI 在 2025 年先后公开的跨会话记忆能力——与上栏的官方文档是同一条，此处单列只提醒一句：本节把它们归在前沿而非工业材料，是因为接口仍在变。
- **反馈**：KTO（2024）、IPO（2024）、组内相对优化（DeepSeek 的公开技术报告，[02 §5.4](02-feedback-loop/02-feedback-loop-section-5-ai.md) 提示可按题名分别核验其方法论文与 2025 年 1 月的推理模型报告）、Online DPO（2024）、OPRO《Large Language Models as Optimizers》（2023）、TextGrad《TextGrad: Automatic Differentiation via Text》（2024）、OpenAI o1 / o3 的公开介绍（[02 §5.4](02-feedback-loop/02-feedback-loop-section-5-ai.md) 注明它属厂商自述，不是第三方结论）——核验入口：论文按题名检索，产品按官方页面当前版本核验。
- **资产**：[03 主文件 §1.3](03-asset-management/03-asset-management.md) 的时间线给了这一栏的节点——OpenAI GPT Store（本章记 2023-11 宣布、2024-01 面向付费用户开放）、字节扣子 Coze 开源（2024-12）、Salesforce Agentforce（2025-04）、OpenAI AgentKit（2025-05）、阿里通义 / 星图升级（2025-06）——核验入口：按产品名检索官方公告与帮助文档；上架数量一类的计数口径不一，不要作为架构判断依据。
- **技能**：Auto-Skill（[04 主文件 §1.3](04-agent-skill-extraction/04-agent-skill-extraction.md) 记 2024-06 学界）、Cursor Composer（2024-08）、Devin / Cognition（2024-10）、程序性记忆建模论文（2025-06，本章正文未给题名，请按「procedural memory / LLM agent / 程序性记忆建模」检索论文库）、DeepMind 关于 AlphaProof（2024）与 AlphaCode 2 的公开技术报告——核验入口：前四条按产品 / 项目名检索，最后一条按报告题名检索。
- **跨主题的观望项**：GraphRAG 在三个主题的 §5.1 表里都出现过（记忆的读路径、反馈的消费与管理、技能库的出口），但三处都不是独立一行，而是挂在某个族下的子方向——档位随所属族走（读路径与库的出口是 L2，反馈的消费与管理是 L3，定档规则见 [01 §5.1](01-long-term-memory/01-long-term-memory-section-5-ai.md) 的「按机制分族，一族一行，族的级别取族内最弱子项」）。它属于「方向」而不是「可采购的条目」，本节不为它单列材料——核验入口：按题名检索，然后看它解决的是多跳还是实体同一性（[01 §5.1](01-long-term-memory/01-long-term-memory-section-5-ai.md) 的原话是后者不由它解决）。

### 学习路径建议

本节不给各主题的时长估计——四个主题的 §4.4 各自的时长都带【经验】标注，本节不复述，请回原文读；这里只拿它们的判据当索引：每节的第一步都是「可回退的最小动作 + 一条能当场判定的判据」（例如反馈闭环是「抽 3 天日志能否各归三类」，资产管理是「抽查 5 个资产能否说出属于哪一类」；「维持时长不用日历定、用收敛条件定」只在 [03 §4.4](03-asset-management/03-asset-management-section-4-sec4.md) 一处这么写，且同一段仍给了【经验】典型区间，不是四节通例）。顺序按下面五步走：

1. **先分族，再看候选**：读 [01 §7.2](01-long-term-memory/01-long-term-memory-section-7-sec7.md) 与 [02 §7.2](02-feedback-loop/02-feedback-loop-section-7-sec7.md)。两节的同一层结论都是「先分族再比较」——01 的表述是「绝大多数选型事故不是选错了族内的那一个，而是选了不属于自己约束的族」，02 的表述是「先分族再选，能省掉一半比较」。先定位自己在哪一族，再比较同族候选。
2. **补工具口径，两节必须一起读**：[01 §4.3](01-long-term-memory/01-long-term-memory-section-4-sec4.md) 的「评估工具」行与 [02 §4.3](02-feedback-loop/02-feedback-loop-section-4-sec4.md) 的「Eval / 监控」行回答的是同一个问题——能不能把「变好还是变坏」变成可回归的指标。只读其中一节，最典型的后果是先买观测台再拿它当评估体系。
3. **把最小可回退的第一步做掉**：[03 §4.4](03-asset-management/03-asset-management-section-4-sec4.md) 与 [04 §4.4](04-agent-skill-extraction/04-agent-skill-extraction-section-4-sec4.md) 的存量迁移都从只读盘点开始。两份盘点清单合并成一张，是本章最省时间的第一个产出。
4. **再按 0 → 1 → 100 排路线**：[03 §4.8](03-asset-management/03-asset-management-section-4-sec4.md) 与 [04 §4.8](04-agent-skill-extraction/04-agent-skill-extraction-section-4-sec4.md) 各给了一条阶段路线与「每个阶段先坏的是什么」。记忆那条线见 [01 §4.8](01-long-term-memory/01-long-term-memory-section-4-sec4.md)：前两段在让它「变得有用」，第三段全在让它「变得可控」（删得掉、隔离得住、可追溯）。
5. **前沿只按体例追**：四个主题的 §5「前沿演进（AI 时代）」是同一体例写的——三类前沿 → 逐条拆解 → 被过度宣传的部分 → 可证伪的预测 → 给架构师的行动建议。按 §5.1 的成熟度档位读，先看被判为 L2 的方向；判为 L3（观望）的条目只做记录，不为它预留架构假设。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch8 · AI 治理与安全](../08-ai-governance/) 学习资产沉淀的合规边界
- 进入 [Ch9 · 数据智能产品](../09-data-intelligence-product/) 学习沉淀资产的产品化