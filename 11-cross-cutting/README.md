# Ch11 · 横切工程

> **一句话定位**：数据质量、安全、成本、可观测（含血缘）——四类横切工程能力，决定数据平台的"工程成熟度"。

## 画像映射

本章对应 **横切能力（质量 / 可观测 / 成本 / 安全）**——三角色（智能体架构师 / 数据科学家 / 数据全栈架构师）通用：

- **数据质量**：DQC（Data Quality Center）、监控告警、SLA 体系、异常检测、数据漂移
- **数据可观测性**：Metrics / Logs / Traces、新鲜度 / 完整性 / 准确性监控、告警分级、链路追踪
- **数据成本治理（FinOps）**：存储优化（冷热分层、压缩）、计算优化（小文件、Compaction）、查询优化、资源利用率
- **数据安全与合规**：分类分级、脱敏、加密、访问控制、审计、GDPR / 个保法 / 等保 2.0/3.0

> P7 会"让系统跑起来"，P8 会"让系统跑得稳"，**资深数据架构师会让系统"长期、可靠、可控"地跑**——四类横切能力是工程成熟度的分水岭。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：全员（智能体架构师 / 数据科学家 / 数据全栈架构师 / 平台架构师 / 数据治理 / SRE）
- **前置章节**：[Ch3 · 数据全栈基础设施](../03-data-stack/)（横切能力建立在全栈之上）;[Ch8 · AI 治理与安全](../08-ai-governance/)（AI 资产的治理底座）
- **后续章节**：[Ch12 · 架构与高可用](../12-architecture/)（在大促/高可用场景下落地横切能力）;[Ch13 · 决策与权衡](../13-decision/)（用 ADR 把横切决策固化下来）

## 本章要回答的核心问题

1. **数据质量如何度量？** DQC、新鲜度 / 完整性 / 准确性 / 一致性四大维度怎么落地？监控告警、SLA 怎么设计？
2. **数据安全如何分层？** 分类分级、脱敏、加密、审计——从数据入仓到消费的全链路安全工程？
3. **数据成本如何治理？** 存储 / 计算 / 查询三类成本结构，30-50% 降本的工程手段与组织机制？
4. **数据可观测性和系统可观测性有什么异同？** 数据血缘如何成为可观测的一部分？
5. **数据血缘如何采集、存储、查询？** 影响分析、根因分析、下游 SLA 治理怎么做？
6. **FinOps 在数据领域如何落地？** 资源计量、成本归因、按团队 / 项目 / 业务的成本分摊？
7. **数据资产化怎么衡量？** 数据从"成本中心"变成"价值中心"的评估体系与 ROI 模型？
8. **隐私计算怎么选型？** 联邦学习、安全多方计算（MPC）、可信执行环境（TEE）的边界与工程落地？

## 子主题

- [ ] **[数据质量](01-data-quality/01-data-quality.md)**：DQC（Data Quality Center）、监控告警、SLA 体系、异常检测
- [ ] **[数据安全](02-data-security/02-data-security.md)**：分类分级、脱敏、加密、访问控制、审计、GDPR / 个保法合规
- [ ] **[数据成本与 FinOps](03-data-cost-finops/03-data-cost-finops.md)**：存储优化（冷热分层、压缩）、计算优化（小文件、Compaction）、查询优化、资源利用率
- [ ] **[数据可观测性](04-observability/04-observability.md)**：监控指标（新鲜度、完整性、准确性）、告警分级、链路追踪
- [ ] **[数据血缘](05-lineage-and-impact/05-lineage-and-impact.md)**：元数据采集、血缘图谱、影响分析、根因分析
- [ ] **[数据资产化](06-data-assetization/06-data-assetization.md)**：数据盘点、估值、ROI 评估
- [ ] **[审计与合规](07-audit-and-compliance/07-audit-and-compliance.md)**：操作审计、访问审计、监管报送
- [ ] **[隐私计算](08-privacy-computing/08-privacy-computing.md)**：联邦学习、安全多方计算、可信执行环境
- [ ] **[数据血缘（迁移）](09-data-lineage/09-data-lineage.md)**：从原目录迁移而来的血缘主题（与 lineage-and-impact 互为补充）

> 文件命名建议：`data-quality.md` / `data-security.md` / `data-cost-finops.md` / `observability.md` / `lineage-and-impact.md` / `data-assetization.md` / `audit-and-compliance.md` / `privacy-computing.md` / `data-lineage.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- **设计数据 SLA 体系**：与业务方谈 SLA 而非被动响应故障；把"数据可靠性"从口号变成可量化的承诺
- **设计数据成本治理方案**：在保证 SLA 的前提下，把数据成本降低 30-50%；用 FinOps 让成本"可见、可分、可控"
- **设计数据安全合规体系**：分类分级、权限矩阵、审计追溯，满足 GDPR / 个保法 / 等保 2.0/3.0
- **设计数据可观测性平台**：把数据血缘从"展示工具"升级为"故障定位工具"——影响分析 + 根因分析 + SLA 治理
- **推动数据资产化**：让数据从"成本中心"变成"价值中心"——估值模型 + ROI 评估 + 资产目录
- **搭建隐私计算能力**：联邦学习、MPC、TEE 的工程选型与落地——让数据"可用不可见"
- **守住底线**：在 AI 时代守住数据合规与安全，是资深数据架构师的"硬约束"

## 推荐资料

> 本节的性质是**索引**，不是新书单：下面每一个条目，都已出现在本章各主题的正文里（§1.4 演进历程 / §4.3 工具链 / §5.4 公开进展与文献 / §8 题解），本节只做一件事——按「经典 / 标准与法规 / 工业材料 / 机制论文 / 前沿」归拢到一处，便于按图索骥。这里**不新增**任何书名、论文名、产品名与年份。
>
> 无网络环境下本节不给外部链接；每条的核验入口都是**按题名 / 产品名 / 标准号自行检索**论文库、官方文档或标准目录的**当前版本**——与本章各主题 §5.4 及各主题 §8 参考资料列表的做法一致。
>
> 与各主题 §5.4 的分工：§5.4 负责标注每条材料的**证据等级**（【公开】/【经验】）以及它支撑的是哪一条结论，本节只负责**归拢与给出检索入口**。
>
> 证据等级与成熟度判据：本节条目**承接正文的评级，不另行定级**——本节带年份的条目，年份都随条目名一并出现在本章对应主题的正文里（标准号里带年份的如 GB/T 22239-2019 同此），等级一并继承该条目在正文里的【公开】标注；本节不另立正文里没有的年份与量化口径。成熟度沿用本章各 §5.1 的**同一套判据**：**① 已 GA 且有正式 release note；② 有第三方（非厂商）公开生产案例；③ 接口稳定**——三条同时成立记 **L1**，缺一条记 **L2**，只有路线图 / 论文 / 演示记 **L3**（判据原文见 [04 §5.1](04-observability/04-observability-section-5-ai.md)、[08 §5.1](08-privacy-computing/08-privacy-computing-section-5-ai.md)）。下文出现「判据①/②/③」或「L1 / L2 / L3」时，指的都是这一套。
>
> 落点口径：本节只落到**条目级或 § 级**——每行末尾的链接指向承载该条目的文件（必要时带 `§N.M`），行级核验请以该 § 所在文件的正文为准。栏位说明：本章有一批早于 2024 的机制论文与标准，塞进「前沿」会错标年份，故单列「机制论文与公开基准」一栏。
>
> §5.4 里写成结论的那一类缺口（**第三方非厂商生产案例**在 AI 能力方向上本章各主题均记为缺失——各 §5.4 的措辞或作「空白」「为空」、或作「未列出」「未给出」，指的都是同一件事，此处不逐一转写；[08 §5.4](08-privacy-computing/08-privacy-computing-section-5-ai.md) 的端侧本地差分隐私是唯一成立的例外，且它不在 AI 方向上），本节同样不补——那个缺口是结论，不是缺项（补法见各 §5.4，都是自造口径的那几组数）。

### 经典书目（横切工程的公共底座）

| 书 | 书内署名 | 重点章节 | 阅读建议与出处（§级） |
| --- | --- | --- | --- |
| 《大数据之路：阿里巴巴大数据实践》 | 阿里巴巴数据技术团队 | 数据质量与治理、OneData 体系 | 本章第 1 / 3 / 5 三个主题反复把它当作「口径先于实现」的成书出处——[03 §8](03-data-cost-finops/03-data-cost-finops-section-8-sec8.md)（分层 + 标签 + Showback）、[01 §8](01-data-quality/01-data-quality-section-8-11-3-数据质量维度与标准.md)、[05 §8](05-lineage-and-impact/05-lineage-and-impact-section-8-11-2-数据血缘基础.md)。按书名自行检索；**章节级定位书内无法离线核验**，[01 §8](01-data-quality/01-data-quality-section-8-11-3-数据质量维度与标准.md) 已就这一点注明按【经验】档理解 |
| 《DAMA-DMBOK2 数据管理知识体系指南》 | DAMA | 数据质量领域、元数据、数据资产 | 数据质量维度与国际口径的公共骨架，也是「数据作为资产」的成书定义处——[06 §1](06-data-assetization/06-data-assetization.md)、[06 §5.4](06-data-assetization/06-data-assetization-section-5-ai.md)、[01 §8](01-data-quality/01-data-quality-section-8-11-3-数据质量维度与标准.md)。按书名自行检索 |
| *Big Data: Principles and Best Practices of Scalable Realtime Data Systems* | Nathan Marz | 批处理层 / 速度层 / 服务层 | Lambda 架构的原始定义，是本章成本主题判「湖仓是否取代 Lambda」的对照基线——[03 §8](03-data-cost-finops/03-data-cost-finops-section-8-sec8.md)。按书名自行检索 |
| *The Algorithmic Foundations of Differential Privacy* | Dwork & Roth | ε / δ 与组合定理 | 「没有参数就不叫隐私保证」这条约定在书内被指为唯一权威出处——[08 §8](08-privacy-computing/08-privacy-computing-section-8-sec8.md)。按书名自行检索 |
| *Site Reliability Engineering* | Google SRE | 四个黄金指标（Golden Signals）、SLO 与错误预算 | 观测与告警分级那几条判据的来源；书内已声明它是**厂商自述材料**，不能充当判据②（第三方非厂商生产案例）所需的案例——[07 §8](07-audit-and-compliance/07-audit-and-compliance-section-8-13-6-大规模实时平台运维与治理体系.md)、[04 §5.4](04-observability/04-observability-section-5-ai.md)。按书名自行检索 |
| *Prometheus: Up & Running* | 本章正文未署名 | 指标采集与告警 | 监控经典系统的工程范本，配 [04-observability](04-observability/04-observability.md) 读——[07 §8](07-audit-and-compliance/07-audit-and-compliance-section-8-13-6-大规模实时平台运维与治理体系.md)。核验入口：按书名检索并核对版次（本书正文未给版次与年份） |

### 标准、规范与法规（判定入口）

- **ISO/IEC 25012**（数据质量模型）：本章 [§1.1](01-data-quality/01-data-quality.md) 把它记为数据质量维度的标准来源，[§5.4](01-data-quality/01-data-quality-section-5-ai.md) 明确「本行不代填发布年份」，须以 ISO 官方目录页的当前条目为准（另一处见 [01 §8](01-data-quality/01-data-quality-section-8-11-3-数据质量维度与标准.md)）。按标准号自行检索
- **等保 2.0（GB/T 22239-2019）、欧盟 AI Act、NIST AI RMF 1.0、ISO/IEC 42001:2023、NIST SP 800-92**：可把「模型版本 / 评估 / 监控 / 日志留存」映射成控制项的公开框架，[07 §5.4](07-audit-and-compliance/07-audit-and-compliance-section-5-ai.md) 逐条给出编号与「适用期以法规原文为准」的口径。**含一条判定方法**：书内点名「等保 3.0」这一提法时，先在官方标准发布渠道查有没有对应标准号与实施日期，查不到就按现行有效的等保 2.0 做对照。按标准号 / 法规编号自行检索
- **《中华人民共和国数据安全法》《中华人民共和国个人信息保护法》《欧盟 GDPR》《欧盟 AI Act》**：跨域与跨境传输那一层的法规依据（含标准合同条款 SCCs 与数据保护影响评估 DPIA 两条口径），[07 §8](07-audit-and-compliance/07-audit-and-compliance-section-8-5-5-大规模集群安全架构设计与优化.md)。按法规名查官方发布版本
- **NISTIR 8053《De-Identification of Personal Information》**（NIST）：去标识化实务指南，[02 §5.4](02-data-security/02-data-security-section-5-ai.md) 列出该条目本身、[02 §3.2.4](02-data-security/02-data-security-section-3-sec3.md) 给出「可按编号自行检索核验」的检索口径。按编号自行检索
- **OASIS XACML 3.0 与 Open Policy Agent 的 Policy Language / Rego**：策略即代码那一环的公开标准与实现入口；[02 §5.4](02-data-security/02-data-security-section-5-ai.md) 给出的判据是「挑一条策略，追它到执行点，再追到一条真实被拒的请求日志」。按标准名 / 文档名自行检索
- **PCI SSC 的《PCI DSS Tokenization Guidelines》与《Tokenization Product Security Guidelines》**：令牌化作为缩小持卡数据范围的手段，[02 §3.2.4](02-data-security/02-data-security-section-3-sec3.md) 给出域名与「以官网当期发布为准」的说明。按文档名自行检索
- **OpenLineage 规范与其参考实现 Marquez**（LF AI & Data 孵化）：跨工具的血缘事件规范；书内反复强调「规范有版本，不等于某个产品 GA 了某个能力」，版本与 facet 以项目发布页为准——[05 §5.4](05-lineage-and-impact/05-lineage-and-impact-section-5-ai.md)、[05 §8](05-lineage-and-impact/05-lineage-and-impact-section-8-11-2-数据血缘基础.md)。按项目名查其发布页与规范文档
- **Bitol / ODCS 契约规范**（同类候选 DataHub Contract）：契约的正式版本与兼容性约定以仓库发布页为准，[01 §7](01-data-quality/01-data-quality-section-7-sec7.md)。按规范名自行检索
- **OpenTelemetry Semantic Conventions 的 `gen_ai.*` 属性组**：LLM 调用留痕目前最接近公共契约的一组字段；书内记为实验性状态并明确「以仓库当前版本为准」，[04 §5.4](04-observability/04-observability-section-5-ai.md)。按仓库名查当前版本
- **W3C PROV / PROV-O**：实体来源追踪的标准，[05 §8](05-lineage-and-impact/05-lineage-and-impact-section-8-11-2-数据血缘基础.md) 把它与 OpenLineage、Apache Atlas 并列在「可按条目名称自行检索核验」的一类；跨章亦见 [Ch1 · 本体建模 §8](../01-modeling/05-ontology-modeling/05-ontology-modeling-section-8-sec8.md)。按标准名自行检索
- **财政部《企业数据资源相关会计处理暂行规定》**：规定的是会计处理方式，不是「数据值多少钱」——这条区分是本章资产化主题的核心口径，[06 §1](06-data-assetization/06-data-assetization.md)、[06 §3.2.2](06-data-assetization/06-data-assetization-section-3-sec3.md)。按规定名查财政部官方发布文本

### 工业材料 / 官方文档（判定入口）

**数据质量与契约**

- **dbt-core / Great Expectations / Soda Core 的发布页与文档**：核「规则即代码、断言进执行链路」；书内明确**不给版本号**（「GE GA 1.0」一类时点一律回项目发布页）。[01 §5.4](01-data-quality/01-data-quality-section-5-ai.md)
- **Monte Carlo / Bigeye / Anomalo / Mona 与平台内置族（DataWorks、DataFinder、Univocity）、差异回归族（Datafold）、Apache Griffin / Deequ（配对 dbt tests）**：本章质量主题 §7 的选型表按「族」给出机制与账单结构（书内已就每一族的行数分族说明）——[01 §7](01-data-quality/01-data-quality-section-7-sec7.md)；判定入口是「该能力在官方文档里是 GA、预览还是仅博客描述」——[01 §5.4](01-data-quality/01-data-quality-section-5-ai.md)。按产品名 / 项目名查官方文档当前版本
- **Databricks Unity Catalog 与阿里云 DataWorks 的官方文档**：核平台内置质量能力以什么形态存在；书内提醒**区分「产品功能位名」与「能力名」**，[01 §5.4](01-data-quality/01-data-quality-section-5-ai.md)

**数据安全与合规**

- **各厂商的机密计算产品文档**：Intel SGX / AMD SEV-SNP / Arm CCA / NVIDIA H100 CC / CNCF Confidential Containers 与各云厂商的机密 VM 与远程证明文档，逐条入口见 [02 §3.2.5](02-data-security/02-data-security-section-3-sec3.md)；核验三件事——能力是否 GA、远程证明里测量的是什么、是否支持在证明里写到你的密钥（[02 §5.4](02-data-security/02-data-security-section-5-ai.md)）
- **分类分级与脱敏方向的云服务与产品文档**：阿里云数据安全中心 DSC、华为云数据安全中心、AWS Macie、Google Cloud Sensitive Data Protection；脱敏与策略方向的选项还有 Immuta / Privacera / Collibra / Cerbos——[02 §3.2.4](02-data-security/02-data-security-section-3-sec3.md)、[02 §3.2.6](02-data-security/02-data-security-section-3-sec3.md)。按产品名查官方文档当前版本
- **Apache Ranger / Sentry 官方文档**：Hadoop 生态权限管理的既有形态，也是本章 [02 §8](02-data-security/02-data-security-section-8-5-4-ranger-与-sentry-对比与选型.md) 与 [07 §8](07-audit-and-compliance/07-audit-and-compliance-section-8-5-5-大规模集群安全架构设计与优化.md) 的对照入口。按项目名查官方文档当前版本
- **Open Policy Agent（OPA）/ Cedar 官方文档**：动态策略引擎的工程范式，[07 §8](07-audit-and-compliance/07-audit-and-compliance-section-8-13-6-大规模实时平台运维与治理体系.md)；[07 §4.3](07-audit-and-compliance/07-audit-and-compliance-section-4-sec4.md) 另给出一条判据——「有没有消费点」，OPA 只判断不执行，每个消费点要自己接钩子

**成本与 FinOps**

- **Snowflake 官方文档《Snowflake Architecture》与《Cost Management》**：三层计费模型 + Result Cache / Auto-Suspend，[03 §8](03-data-cost-finops/03-data-cost-finops-section-8-sec8.md)。按文档名自行检索
- **Databricks《What is a Lakehouse?》与《Predictive Optimization》官方文档；阿里云《MaxCompute 数据湖解决方案》白皮书**：Lakehouse 与国内保留 Lambda 两条工程范式的对照，[03 §8](03-data-cost-finops/03-data-cost-finops-section-8-sec8.md)。按题名自行检索（书内已注明部分报告名与发布年份无法核验，只能给入口）
- **AWS S3 官方文档《Storage Classes》与《Lifecycle Configuration》；AWS EC2 用户指南的 Spot 实例中断通知；NVIDIA MIG 用户指南；各云 GPU 实例与跨区流量的当期定价页**：冷热分层与可回收容量的官方口径；**本节不给单价数字**，判定动作是取当期定价页并区分「按秒计费」与「按小时向上取整」——[03 §5.4](03-data-cost-finops/03-data-cost-finops-section-5-ai.md)、[03 §8](03-data-cost-finops/03-data-cost-finops-section-8-sec8.md)
- **Apache Iceberg 官方文档《Hidden Partitioning》与《Z-Ordering》；Apache Spark 官方文档《Dynamic Allocation》；Apache Flink 官方文档《Elastic Scaling》；Databricks《Cluster Sizing and Auto-Scaling》**：湖表与引擎侧的弹性与排序实现，[03 §8](03-data-cost-finops/03-data-cost-finops-section-8-sec8.md)。按文档名自行检索（书内提醒：hidden partitioning 是 Iceberg 的特性，Hudi / Delta 没有等价物）
- **FinOps Foundation 的 FinOps Framework**（2020 年首发、持续更新）：Inform / Optimize / Operate 三阶段；框架自身的能力域（Domains）划分主文件未展开，以基金会官方文档当前版本为准——[03 §5.4](03-data-cost-finops/03-data-cost-finops-section-5-ai.md)、[03 §1.3](03-data-cost-finops/03-data-cost-finops.md)

**可观测、血缘与元数据**

- **Google SRE 系列公开材料**：SLO 与错误预算的原始记述，[04 §5.4](04-observability/04-observability-section-5-ai.md)
- **OpenTelemetry / Jaeger / Zipkin**：端到端 Trace 的采集与查看，[07 §8](07-audit-and-compliance/07-audit-and-compliance-section-8-13-6-大规模实时平台运维与治理体系.md)；统一 metrics / logs / traces 的时间节点见 [04 §1.4](04-observability/04-observability.md)
- **OpenLineage 的项目发布页与规范文档；DataHub 官方文档（血缘 / 影响面 / 列级血缘页）；Apache Atlas 官方文档**：核「字段级血缘与影响面查询是否都是正式能力」，[05 §5.4](05-lineage-and-impact/05-lineage-and-impact-section-5-ai.md)
- **Atlan AI / Collibra AI / DataHub 与 LLM 集成 / 阿里云 DataWorks 智能血缘 / Cube Lineage**：AI 增强的目录与血缘入口，[05 §4.3](05-lineage-and-impact/05-lineage-and-impact-section-4-sec4.md)；判定动作是看官方文档里**返回的是「一条边」还是「一段自然语言描述」**，以及该能力标 GA 还是 Preview
- **Data Provenance Initiative**：对公开语料数据集的来源与许可做大规模审计，是数据集卡片方法的工程化版本；书内强调**它是审计结果，不是血缘图**——[09 §5.4](09-data-lineage/09-data-lineage-section-5-ai.md)
- **Snowflake Marketplace 与 Databricks Marketplace、上海 / 贵阳 / 深圳等交易所侧产品**：资产流通方向的厂商材料；书内已声明它们**不是判据②（第三方非厂商生产案例）意义上的生产案例**，[06 §5.4](06-data-assetization/06-data-assetization-section-5-ai.md)。按产品名查官网更新日志与版本说明页

**隐私计算**

- **联邦学习框架：FATE（微众银行）、SecretFlow（蚂蚁）、PySyft（OpenMined）、FedML、TensorFlow Federated、NVIDIA FLARE、PrimiHub**：选型判据按「横向 / 纵向 / 是否要 MPC」分——[08 §4.3](08-privacy-computing/08-privacy-computing-section-4-sec4.md)；判定入口是 **FATE 的 Releases 页与 SecretFlow 的官方发布说明**（看有没有独立条目，而不是看官网功能介绍页），[08 §5.4](08-privacy-computing/08-privacy-computing-section-5-ai.md)
- **DP / HE 工具：Opacus（PyTorch）、TensorFlow Privacy、OpenMined PyDP、TenSEAL、Microsoft SEAL、OpenFHE**：Opacus 的 Privacy Engine 与 privacy accounting 页、TensorFlow Privacy 的差分隐私与记账文档是「隐私预算记账」的核验入口——[08 §4.3](08-privacy-computing/08-privacy-computing-section-4-sec4.md)、[08 §5.4](08-privacy-computing/08-privacy-computing-section-5-ai.md)
- **TEE 平台：Intel SGX + Occlum、AMD SEV、NVIDIA H100 CC、Azure Confidential VM、Google Confidential VM、阿里云 enclave、蚂蚁摩斯**：可点名的文档入口是 **Azure Confidential Computing 文档的 Confidential VM / Attestation 章节**、**Google Cloud 的 Confidential VM 文档**、**NVIDIA 的 Confidential Computing 文档**（看有没有明确的算子 / 库支持清单）——[08 §4.3](08-privacy-computing/08-privacy-computing-section-4-sec4.md)、[08 §5.4](08-privacy-computing/08-privacy-computing-section-5-ai.md)
- **白皮书类**：微众银行《FATE 联邦学习技术白皮书》、蚂蚁集团《SecretFlow 开源白皮书》与《SecretFlow SPU Confidential TEE 加速器白皮书》、Google Research 的 Private Join and Compute 开源项目、中国信通院《机密计算白皮书》、Intel《Intel SGX Architectural Overview》与《Intel Trust Domain Extensions (TDX) Overview》/《Intel Software Guard Extensions Developer Reference》、AMD《SEV-SNP》白皮书、NVIDIA《Confidential Computing on NVIDIA H100 GPUs》与《Hopper Architecture Whitepaper》、Microsoft《Azure Confidential Computing: Protect Data in Use》、Google Cloud《Confidential VMs on AMD SEV-SNP》——[08 §8](08-privacy-computing/08-privacy-computing-section-8-sec8.md)，并按题名查各自官方版本。**注意书内对其中两条的归属已做摘除处理**（「Fusion360 / FedLearner by WeBank」被标为归属有误），引用时以 [08 §8](08-privacy-computing/08-privacy-computing-section-8-sec8.md) 的注为准

### 机制论文与公开基准（早于 2024）

- **漂移与质量**：KS 检验（Kolmogorov–Smirnov，1930 年代）与群体稳定性指数 PSI（信用风险记分卡监控的长期通行做法）；**阈值区间是经验值【经验】，不是普适标准**——[01 §5.4](01-data-quality/01-data-quality-section-5-ai.md)。按题名自行检索
- **去标识化与模型泄漏面**：Sweeney《k-anonymity: A Model for Protecting Privacy》（2002）；Dwork《Differential Privacy》（ICALP 2006）与 Dwork / McSherry / Nissim / Smith《Calibrating Noise to Sensitivity in Private Data Analysis》（TCC 2006）；Shokri 等《Membership Inference Attacks Against Machine Learning Models》（IEEE S&P 2017）；Carlini 等《Extracting Training Data from Large Language Models》（USENIX Security 2021）——[02 §5.4](02-data-security/02-data-security-section-5-ai.md)、[08 §5.4](08-privacy-computing/08-privacy-computing-section-5-ai.md)。按题名查论文库
- **隐私计算的机制源头**：Yao《Protocols for Secure Computations》（FOCS 1982）；Shamir《How to Share a Secret》（CACM 1979）；Gentry《Fully Homomorphic Encryption Using Ideal Lattices》（STOC 2009，证明的是**可行性**而非可用性）；Abadi 等《Deep Learning with Differential Privacy》（CCS 2016）；Zhu / Liu / Han《Deep Leakage from Gradients》（NeurIPS 2019）；Mironov《Rényi Differential Privacy》（IEEE CSF 2017）——[08 §5.4](08-privacy-computing/08-privacy-computing-section-5-ai.md)、[08 §8](08-privacy-computing/08-privacy-computing-section-8-sec8.md)。按题名查论文库
- **隐私集合求交（PSI）**：Pinkas / Schneider / Zohner（USENIX Security 2014）、Pinkas / Schneider / Tkachenko（USENIX Security 2019）、Rindal & Pinkas（EUROCRYPT 2018）、Chase & Miao（CRYPTO 2020）——[08 §8](08-privacy-computing/08-privacy-computing-section-8-sec8.md)。按题名查论文库
- **联邦学习机制与异构**：McMahan 等《Communication-Efficient Learning of Deep Networks from Decentralized Data》（AISTATS 2017，FedAvg 原始定义）；Bonawitz 等《Practical Secure Aggregation for Privacy-Preserving Machine Learning》（ACM CCS 2017）；Cheng 等《SecureBoost: A Lossless Federated Learning Framework》（IEEE Intelligent Systems 2021）；异构侧另有 FedProx（MLSys 2020）、FedNova（NeurIPS 2020）、SCAFFOLD（ICML 2020）、动态正则（ICLR 2021）——[08 §8](08-privacy-computing/08-privacy-computing-section-8-sec8.md)。按题名查论文库
- **端侧本地差分隐私的三次独立公开部署**：Apple《Learning with Privacy at Scale》（2017）、Google RAPPOR（CCS 2014）、Microsoft《Collecting Telemetry Data Privately》（NeurIPS 2017）——本章唯一被记为「第三方生产案例成立」的一类；**但它不能外推**，三者保护的都是统计上报量，不涉及模型训练与检索出口——[08 §5.4](08-privacy-computing/08-privacy-computing-section-5-ai.md)
- **血缘与来源**：Buneman / Khanna / Tan《Why and Where: A Characterization of Data Provenance》（ICDT 2001）；Green / Karvounarakis / Tannen《Provenance Semirings》（PODS 2007）；Cheney / Chiticariu / Tan《Provenance in Databases: Why, How, and Where》（2009）；Sculley 等《Hidden Technical Debt in Machine Learning Systems》（NeurIPS 2015）——[05 §5.4](05-lineage-and-impact/05-lineage-and-impact-section-5-ai.md)。按题名查论文库
- **成本与算力的机制**：Kwon 等《Efficient Memory Management for Large Language Model Serving with PagedAttention》（SOSP 2023）；Frantar 等《GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers》（ICLR 2023）；James Dixon《Pentaho, Hadoop, and Data Lakes》（2010 博客，「数据湖」概念的最早提出）；Google《Borg, Omega, and Kubernetes》与《Large-scale cluster management at Google with Borg》；Uber《Michelangelo: Machine Learning at Uber》；Facebook Prophet《Forecasting at Scale》——[03 §5.4](03-data-cost-finops/03-data-cost-finops-section-5-ai.md)、[03 §8](03-data-cost-finops/03-data-cost-finops-section-8-sec8.md)。按题名查论文库（**两条 Google Borg 论文**书内注明讲的是调度与资源隔离，不是 ML 专题）
- **评测、披露与因果**：Zheng 等《Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena》（NeurIPS 2023）；Sambasivan 等《Data Cascades》（CHI 2021）；Mitchell 等《Model Cards for Model Reporting》（FAT* 2019）；Gebru 等《Datasheets for Datasets》（2018）——[04 §5.4](04-observability/04-observability-section-5-ai.md)、[07 §5.4](07-audit-and-compliance/07-audit-and-compliance-section-5-ai.md)、[06 §5.4](06-data-assetization/06-data-assetization-section-5-ai.md)。按题名查论文库

### 2024–2025 前沿（论文 / 项目 / 方向）

- **图增强与语料级问答**：Edge 等《From Local to Global: A Graph RAG Approach to Query-Focused Summarization》（2024）——它面向的是**语料级的全局摘要**；把它引申到「血缘推理 / 数据自愈」在书内被明确标为**方向性关联**——[09 §5.4](09-data-lineage/09-data-lineage-section-5-ai.md)、[05 §8](05-lineage-and-impact/05-lineage-and-impact-section-8-11-5-数据血缘采集技术与应用.md)。按题名自行检索
- **评测与训练集**："RAGAS: Automated Evaluation of Retrieval Augmented Generation"（EACL 2024 系统演示）；"DataComp-LM: In search of the next generation of training sets for language models"（NeurIPS 2024，其「提升倍数」一类数字必须回到论文看条件限定）——[01 §5.4](01-data-quality/01-data-quality-section-5-ai.md)、[04 §5.4](04-observability/04-observability-section-5-ai.md)。按题名查论文库
- **语义约定**：OpenTelemetry Semantic Conventions 的 `gen_ai.*` 属性组（2024 年前后加入，当前标注为实验性）——书内把它判 L2 而不是 L1 的直接原因就是它的实验性状态——[04 §5.4](04-observability/04-observability-section-5-ai.md)。按仓库当前版本核验
- **隐私计算的 AI 化**：FATE-LLM、SecretFlow-LLM、NVIDIA NeMo Guardrails + TEE、Azure Confidential AI、Google Confidential Gemini、阿里通义机密版、蚂蚁摩斯、SecretFlow 2.0——[08 §4.3](08-privacy-computing/08-privacy-computing-section-4-sec4.md)、[08 §5.4](08-privacy-computing/08-privacy-computing-section-5-ai.md)。**「某年某月 GA / 大规模商用」这类时点本节一律不给**，能力与版本以各厂商官方发布说明为准
- **目录与血缘的 AI 增强**：Atlan AI、Collibra AI、DataHub + LLM、阿里云 DataWorks 智能血缘、Cube Lineage（书内标注为「AI 时代新工具（2024-2025）」）——[05 §4.3](05-lineage-and-impact/05-lineage-and-impact-section-4-sec4.md)、[05 §8](05-lineage-and-impact/05-lineage-and-impact-section-8-11-5-数据血缘采集技术与应用.md)。按产品名查官方文档，先看 GA 还是 Preview
- **被书内点名「方向保留、不作证据」的方向线索**：跨工具血缘规范 / 字段级血缘自动采集 / AI 驱动血缘补全（[05 §5.4](05-lineage-and-impact/05-lineage-and-impact-section-5-ai.md)）；Holistic Data Quality 框架与 AI-Native Data Quality（[01 §5.4](01-data-quality/01-data-quality-section-5-ai.md)）；机密 LLM 推理安全分析 / 差分隐私用于 LLM 训练 / AI Agent 数据安全威胁模型（[02 §5.4](02-data-security/02-data-security-section-5-ai.md)）；联邦 LLM 训练 / TEE 攻击面 / AI 时代威胁模型（[08 §5.4](08-privacy-computing/08-privacy-computing-section-5-ai.md)）。这些条目在书内只有「会议 + 主题名」、没有可检索的标题与作者，因此**方向可以跟进，但不作为依据**。按会议论文集检索

### 学习路径建议

下面按「先立度量、再立承诺、再管住钱、最后守底线」的依赖顺序排；每一档只给**读什么 + 读哪里**，不给天数——本书没有可核验的工期来源。

1. **数据质量（起点）**：[01-data-quality](01-data-quality/01-data-quality.md) 的 §1.1 与 §2.2 给出维度模型与漂移公式 → [§3 设计模式](01-data-quality/01-data-quality-section-3-sec3.md) → [§7 选型](01-data-quality/01-data-quality-section-7-sec7.md)（表内各行按「族」选，先选族再选产品）→ 材料入口在 [§5.4](01-data-quality/01-data-quality-section-5-ai.md)。书内已有的口径在 [§4.3](01-data-quality/01-data-quality-section-4-sec4.md) 的工具链表
2. **可观测性与血缘（先看得见）**：先 [04-observability](04-observability/04-observability.md)，再 [05-lineage-and-impact](05-lineage-and-impact/05-lineage-and-impact.md)；[09-data-lineage](09-data-lineage/09-data-lineage.md) 是从原目录迁移而来的血缘主题，与 05 互为补充、材料重叠，**读一处即可，另一处用作对照**
3. **成本与 FinOps（再管住钱）**：[03-data-cost-finops](03-data-cost-finops/03-data-cost-finops.md) 的 §1.3 与 §3 给成本结构与手段 → [§7 选型](03-data-cost-finops/03-data-cost-finops-section-7-sec7.md) → [§5.7 行动建议](03-data-cost-finops/03-data-cost-finops-section-5-ai.md)（按「你的处境」分行，不按技术分行）
4. **安全与合规（守底线）**：[02-data-security](02-data-security/02-data-security.md) 给机制与设计模式，[07-audit-and-compliance](07-audit-and-compliance/07-audit-and-compliance.md) 给可映射的控制项与审计留痕；两章的 §8 题解互为对照
5. **隐私计算（选型最需要评级的一章）**：[08-privacy-computing](08-privacy-computing/08-privacy-computing.md)——先读 [§5.1 的能力评级表](08-privacy-computing/08-privacy-computing-section-5-ai.md)（哪一行到 L1、哪一行还停在 L2 / L3），再读 [§4.3 工具链](08-privacy-computing/08-privacy-computing-section-4-sec4.md)
6. **资产化（收口）**：[06-data-assetization](06-data-assetization/06-data-assetization.md)；跨章接着读 [Ch4 · 数据资产化](../04-data-assetization/) 与 [Ch8 · AI 治理与安全](../08-ai-governance/)
7. **时间预算**：本节不给「1–2 周」这类天数。书内已有的口径在 [Ch99 · 01-future-plans §7.2 候选清单与分族 / §7.4 时间账](../99-outro/01-future-plans/01-future-plans-section-7-sec7.md)——工程细节族按**每本 8–20 小时**【经验】量级算，且那是**区间量级，不是承诺**

> 本节不补的第一类缺口：**第三方（非厂商）生产案例**。本章各主题的 §5.4 在 AI 能力方向上均记为缺失（措辞不一：01 / 02 / 05 / 08 作「空白」、03 / 04 作「未列出」、06 作「为空」、07 作「给不出具名出处」；唯一的例外是 [08 §5.4](08-privacy-computing/08-privacy-computing-section-5-ai.md) 的端侧本地差分隐私，而它不在 AI 方向上），这正是本章所有 AI 能力方向判在 L2 / L3、且全表没有一行到 L1 的直接原因。补法不是找材料，是自己造口径——各 §5.4 已把该量的那几组数逐条列出（质量侧的误报率 / MTTR / 规则命中率、安全侧的出口路径清单与漏检率、血缘侧的解析失败率与「人工登记」边占比、隐私计算侧的参与方数 / ε / 开销比、成本侧的池化前后同批作业完成时长与 GPU·小时）。
>
> 本节不补的第二类缺口：**判据①（正式发布记录）与判据③（接口稳定）在预研方向上的证据**。§5.4 里被降档或改为判定入口的那批厂商进展，本节只把它们归拢成「按产品名查官方文档 / 发布说明」的入口，不转述其结论。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch12 · 架构与高可用](../12-architecture/) 继续阅读（横切能力在大促场景的落地）
- 进入 [Ch13 · 决策与权衡](../13-decision/) 学习把横切决策固化为 ADR