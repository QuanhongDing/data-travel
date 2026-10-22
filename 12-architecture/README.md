# Ch12 · 架构与高可用

> **一句话定位**：高并发、TB 级、分布式、微服务——资深数据架构师的"硬功夫"，扛得住"老板最怕的事"。

## 画像映射

本章对应 **R6 工程能力**（招聘加分项）+ **R3 数据建模**在大规模场景下的延伸：

- **微服务架构**：服务拆分、契约治理、服务网格、API 网关、注册中心
- **分布式系统**：CAP 理论、一致性协议（Paxos / Raft）、分布式事务、分布式锁、分布式 ID
- **高并发与高可用**：负载均衡、限流、降级、熔断、单元化、多活、容灾
- **TB 级大数据量**：存储分片、分库分表、冷热分层、查询优化、容量规划
- **性能工程**：全链路压测、慢查询治理、JVM / GC 调优、关键路径分析
- **可靠性工程**：混沌工程、灰度发布、回滚、故障演练、RPO / RTO 设计

> P7 会"实现功能"，P8 会"设计系统"，**资深数据架构师会"扛住大促"**——大促流量洪峰下的稳定性，是资深架构师的分水岭。

## 基本信息

- **难度**：★★★★★
- **推荐角色**：资深架构师 / SRE / 稳定性负责人 / 数据架构师
- **前置章节**：[Ch3 · 数据全栈基础设施](../03-data-stack/)（分布式存储与计算基础）;[Ch11 · 横切工程](../11-cross-cutting/)（可观测、监控告警是稳定性的前提）
- **后续章节**：[Ch13 · 决策与权衡](../13-decision/)（架构决策 ADR 沉淀）;[Ch15 · 案例库](../15-case-studies/)（真实大促案例）

## 本章要回答的核心问题

1. **微服务架构怎么落地？** 服务边界如何划？服务网格 / API 网关 / 注册中心怎么选型？
2. **CAP 怎么权衡？** 强一致 vs 最终一致、Paxos / Raft 工程实践、分布式事务（2PC / TCC / Saga）的边界？
3. **单元化（Cell）架构如何切分数据域？** 单元间的数据如何协同？单元化与微服务的关系？
4. **异地多活如何设计？** CDC、binlog、双向同步、冲突解决、流量调度——如何在保证一致性的前提下让多地域同时提供服务？
5. **TB 级大数据量怎么设计？** 分库分表、分片策略、冷热分层、查询优化——亿级 / 万亿级数据的工程范式？
6. **大促保障（双 11 / 618 / 春运级流量）的全链路稳定性方案是什么？** 全链路压测、限流降级、应急预案、值班机制？
7. **容量规划怎么做？** ARIMA / Prophet 预测未来 3-12 个月的容量，数据驱动而非"拍脑袋"扩容？
8. **故障注入与混沌工程如何落地？** 演练平台、恢复预案、故障复盘——把每一次故障转化为组织能力？
9. **容灾等级（RPO / RTO）如何设计？** 同城双活、两地三中心、同城多活的工程取舍？

## 子主题

- [ ] **[单元化架构](01-cell-based-architecture/01-cell-based-architecture.md)**：业务域切分、单元数据、单元间协同
- [ ] **[异地多活](02-multi-region/02-multi-region.md)**：数据同步（CDC、binlog、双向同步）、冲突解决、流量调度
- [ ] **[大促保障](./03-large-event-readiness/README.md)**：全链路压测、限流降级、应急预案、值班机制
- [ ] **[容量规划](04-capacity-planning/04-capacity-planning.md)**：数据增长预测、计算资源预测、存储资源预测
- [ ] **[性能工程](05-performance-engineering/05-performance-engineering.md)**：关键路径分析、慢查询治理、资源利用率优化
- [ ] **[混沌工程](06-chaos-engineering/06-chaos-engineering.md)**：故障注入、演练平台、恢复预案
- [ ] **[容灾设计](07-disaster-recovery/07-disaster-recovery.md)**：RPO / RTO、同城双活、两地三中心
- [ ] **[数据一致性](08-data-consistency/08-data-consistency.md)**：强一致 vs 最终一致、CAP 权衡、Paxos / Raft 工程实践
- [ ] **[灰度与回滚](./09-gray-and-rollback/README.md)**：数据迁移灰度、模型灰度、查询灰度

> 文件命名建议：`cell-based-architecture.md` / `multi-region.md` / `large-event-readiness.md` / `capacity-planning.md` / `performance-engineering.md` / `chaos-engineering.md` / `disaster-recovery.md` / `data-consistency.md` / `gray-and-rollback.md` / `case-study.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- **设计单元化架构**：按业务域切分数据域，确保单单元故障不影响全局
- **设计异地多活方案**：在保证数据一致性的前提下，让多地域同时提供服务
- **主导大促保障**：从预案制定、全链路压测、值班机制到故障复盘——把"老板最怕的事"变成"可控的事"
- **设计容量规划体系**：用数据驱动决策（而非"拍脑袋"扩容），让容量增长可预测
- **主导混沌工程**：故障注入 → 恢复预案 → 故障复盘，让组织具备"抗失败能力"
- **设计容灾体系**：RPO / RTO 同城双活 / 两地三中心 / 同城多活的工程取舍
- **扛住 TB 级大数据量**：分库分表 + 冷热分层 + 查询优化——亿级 / 万亿级数据的工程范式
- **主导故障复盘**：把每一次故障转化为组织能力——这是资深数据架构师的核心价值

## 推荐资料

> **本节是「索引」，不是「书单」。** 下面每一条都已在本书别处出现过——绝大多数就在 Ch12 各主题的正文、§5（AI 演进）、§7（与其他方法对比）或 §8（面试真题集）里，个别的作者署名取自他章（已在该条内注明）。本节只把它们按「经典 / 工业材料 / 前沿」三栏归拢到一处，便于读者按图索骥。**本节不新增任何本书别处未出现的书名、论文名、标准号、产品名与年份。**
>
> **无网络环境，本书不提供链接。** 每条后面的「核验入口」就是检索方式：带题名（书名 / 论文题名 / 标准号 / 官方文档章节名）与年份的条目，按题名在公开文献或官方文档里自行检索即可核到；以「公司 + 材料」形式出现、本书无法核实其篇名与发布年份的条目，以该公司的官方材料为准——这类条目**单独归入工业材料的第二组**，不与第一组混用。
>
> 三栏的分工：**经典**给机制与术语的出处；**工业材料**给「别人是怎么落地的」形状；**前沿**给还没定论、但值得盯的方向。**前沿栏的条目多数在书内被判为 L2 / L3**（判据见各主题 §5），读的时候要连着它旁边的档位一起读——名单长不等于可排期。
>
> 下面凡标「落点」的，都指向本章主题文件里的具体位置。

### 经典书目（机制与术语的出处）

| 书 | 作者 | 本书记录的重点章节 | 核验入口 / 本章落点 |
| --- | --- | --- | --- |
| *Site Reliability Engineering* | Beyer 等（Google SRE，O'Reilly，2016） | 第 4 章 SLO 与错误预算；第 13、17 章 应急响应与可靠性测试；第 14 章 Emergency Response；第 15 章 Postmortem Culture；第 23 章 on-call | 按题名自行检索。落点：[§1 §8](01-cell-based-architecture/01-cell-based-architecture-section-8-sec8.md)、[§9 §8](09-gray-and-rollback/09-gray-and-rollback-section-8-sec8.md)、[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md)、[§7 §8](07-disaster-recovery/07-disaster-recovery-section-8-sec8.md) |
| *The Site Reliability Workbook* | Google SRE 团队 | 第 5 章 Error Budget | 按题名自行检索。落点：[§7 §8](07-disaster-recovery/07-disaster-recovery-section-8-sec8.md)、[§9 §8](09-gray-and-rollback/09-gray-and-rollback-section-8-sec8.md) |
| *数据密集型应用系统设计*（DDIA） | Martin Kleppmann（作者署名见 [Ch1 推荐资料](../01-modeling/README.md)） | 第 6 章「分区」；第 7、9 章 一致性与事务 | 按题名自行检索。落点：[§1 §8](01-cell-based-architecture/01-cell-based-architecture-section-8-sec8.md) |
| *Systems Performance* | Brendan Gregg | 第 6 章「CPU」；USE 方法（Utilization / Saturation / Errors）；火焰图 | 按题名自行检索。落点：[§4 §8](04-capacity-planning/04-capacity-planning-section-8-sec8.md)、[§5 §8](05-performance-engineering/05-performance-engineering-section-8-sec8.md)、[§1 §8](01-cell-based-architecture/01-cell-based-architecture-section-8-sec8.md) |
| *Release It!* | Michael Nygard | 第 4 章 Circuit Breaker 模式 | 按题名自行检索。落点：[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)、[§3 §3](03-large-event-readiness/03-large-event-readiness-section-3-sec3.md) |
| *Chaos Engineering* | Casey Rosenthal / Lorin Hochstein 等（O'Reilly，Netflix 团队主编） | 第 6–8 章 分布式数据系统的实验设计；第 9 章 故障注入与 Abort；第 10 章 AI / ML 系统的混沌工程；第 11 章 GameDay | 按题名自行检索。落点：[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md) |
| *Chaos Engineering: System Resiliency in Practice* | Casey Rosenthal、Nora Jones（O'Reilly，2020） | 第 4 章 爆炸半径的形式化定义；第 8 章 云原生与 AI 系统的韧性 | 按题名自行检索。落点：[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md)、[§6 §5](06-chaos-engineering/06-chaos-engineering-section-5-ai.md) |
| *Forecasting: Principles and Practice* | Hyndman & Athanasopoulos | 第 9–10 章 ARIMA / SARIMA / 动态回归 | 按题名自行检索。落点：[§4 §8](04-capacity-planning/04-capacity-planning-section-8-sec8.md)、[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md) |
| *Trustworthy Online Controlled Experiments* | Kohavi / Tang / Xu（剑桥大学出版社，2020） | 在线实验与 A/B 统计的方法学（α / 功效 / 样本量约定的标准出处） | 按题名自行检索。落点：[§9 §5](09-gray-and-rollback/09-gray-and-rollback-section-5-ai.md) |
| *Accelerate* | Forsgren / Humble / Kim（2018） | 变更管理实践的问卷统计（DORA 系列）。**注意其性质**：统计的是相关性，不是具体生产案例 | 按题名自行检索。落点：[§9 §5](09-gray-and-rollback/09-gray-and-rollback-section-5-ai.md) |
| *Patterns of Enterprise Application Architecture* | Martin Fowler | Repository / UnitOfWork 等模式在数据访问层的应用 | 按题名自行检索。落点：[§9 §8](09-gray-and-rollback/09-gray-and-rollback-section-8-sec8.md) |
| 《Kubernetes Operator 模式》 | 本书未记作者 | 混沌工程 Operator 的设计原理 | 按题名自行检索。落点：[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md) |
| 《Java Garbage Collection Distilled》 / 《Java Performance Optimization》 | Aleksey Shipilev / Monica Beckwith | GC 调优方法论与各种 GC 的对比；JVM 调优实战 | 按作者与题名自行检索。落点：[§5 §8](05-performance-engineering/05-performance-engineering-section-8-sec8.md) |

### 经典论文与标准（可查原文的锚点）

| 论文 / 标准 | 作者与年份 | 本章用它说明什么 | 核验入口 / 本章落点 |
| --- | --- | --- | --- |
| *Consistent Hashing and Random Trees* | David Karger | 一致性 Hash 的原始论文 | 按题名自行检索。落点：[§1 §8](01-cell-based-architecture/01-cell-based-architecture-section-8-sec8.md) |
| *A Proof for the Queuing Formula: L = λW* | John D. C. Little，1961 | Little's Law 的原始推导（容量与并发的换算） | 按题名自行检索。落点：[§4 §8](04-capacity-planning/04-capacity-planning-section-8-sec8.md) |
| CAP：Brewer 的 PODC 2000 主题演讲 + Gilbert & Lynch，*SIGACT News* | Brewer，2000；Gilbert & Lynch，2002 | 网络分区发生时一致性与可用性只能二选一 | 按题名自行检索。落点：[§1 §7](01-cell-based-architecture/01-cell-based-architecture-section-7-sec7.md)、[§8 §5](08-data-consistency/08-data-consistency-section-5-ai.md)、[§8 §20.2](08-data-consistency/08-data-consistency-section-8-20-2-数据一致性模型与-cap-理论.md) |
| PACELC | Daniel Abadi，*IEEE Computer*，2012 | 无分区时的延迟与一致性权衡（异地多活为何仍有写延迟） | 按题名自行检索。落点：[§1 §7](01-cell-based-architecture/01-cell-based-architecture-section-7-sec7.md)、[§2 主文件](02-multi-region/02-multi-region.md) |
| Dynamo | Amazon，SOSP 2007 | 多写副本下的冲突消解手段（向量时钟与 LWW）及其代价 | 按题名自行检索。落点：[§1 §7](01-cell-based-architecture/01-cell-based-architecture-section-7-sec7.md) |
| *Spanner: Google's Globally-Distributed Database* | Google，OSDI 2012（书内另有 Google White Paper 版） | 全局时钟 + commit-wait；TrueTime 把写延迟下限抬到时钟不确定度 | 按题名与会议名自行检索。落点：[§1 §7](01-cell-based-architecture/01-cell-based-architecture-section-7-sec7.md)、[§2 主文件](02-multi-region/02-multi-region.md)、[§7 §8](07-disaster-recovery/07-disaster-recovery-section-8-sec8.md) |
| *Efficient Memory Management for Large Language Model Serving with PagedAttention* | Kwon 等，SOSP 2023 | 显存与并发的关系——「少一张卡」不是慢一点，而是排队甚至 OOM | 按题名在会议论文集页面检索（**注意**：书内已纠正「OSDI 2023 最佳论文」这一错误归属）。落点：[§1 §5](01-cell-based-architecture/01-cell-based-architecture-section-5-ai.md)、[§5 §5](05-performance-engineering/05-performance-engineering-section-5-ai.md)、[§4 §5](04-capacity-planning/04-capacity-planning-section-5-ai.md) |
| *FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness* | Dao 等，NeurIPS 2022 | 按 IO 复杂度重排注意力计算 | 按题名自行检索。落点：[§5 §5](05-performance-engineering/05-performance-engineering-section-5-ai.md) |
| *Communication-Efficient Learning of Deep Networks from Decentralized Data* | McMahan 等，AISTATS 2017 | 联邦平均——「数据不动模型动」的机制依据 | 按题名自行检索。落点：[§2 §5](02-multi-region/02-multi-region-section-5-ai.md) |
| Netflix《Chaos Engineering Principles》 | Netflix，2014 年起公开并持续维护 | 混沌工程五原则：稳态假设 / 真实事件 / 在生产跑 / 自动持续 / 最小化爆炸半径 | 按该标题在 principlesofchaos.org 检索，以站点当前版本为准。落点：[§6 主文件](06-chaos-engineering/06-chaos-engineering.md)、[§6 §7](06-chaos-engineering/06-chaos-engineering-section-7-sec7.md)、[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md) |
| 欧盟 GDPR（Regulation (EU) 2016/679）第 44–46 条、第 33 / 34 条 | 2018 年起施行 | 跨境传输的条件限制与数据丢失通报；主权边界是否决性约束而非性能参数 | 以法规原文为准。落点：[§2 §5](02-multi-region/02-multi-region-section-5-ai.md)、[§3 §7](03-large-event-readiness/03-large-event-readiness-section-7-sec7.md)、[§7 §8](07-disaster-recovery/07-disaster-recovery-section-8-sec8.md) |
| 《中华人民共和国个人信息保护法》 | 2021 年起施行 | 跨境提供相关条款 | 以法规原文为准。落点：[§2 §5](02-multi-region/02-multi-region-section-5-ai.md)、[§2 主文件](02-multi-region/02-multi-region.md) |
| GB/T 20988-2007《信息安全技术 信息系统灾难恢复规范》 | 中国国家标准 | 用能力等级描述灾难恢复要求；**其等级名称与「同城双活 / 异地多活」等俗称并不一致**，引用以标准原文为准 | 按标准号自行检索。落点：[§2 §8](02-multi-region/02-multi-region-section-8-sec8.md)、[§7 §8](07-disaster-recovery/07-disaster-recovery-section-8-sec8.md) |
| ISO 22301:2019《Security and resilience — Business continuity management systems》 | 国际标准 | BCM 的完整框架 | 按标准号自行检索。落点：[§7 §8](07-disaster-recovery/07-disaster-recovery-section-8-sec8.md) |
| 等保 2.0 相关规范 / PCI DSS v4.0 Requirement 12.10 / 中国银保监会《商业银行数据中心监管指引》 | ——（版本以现行有效文本为准） | 国内与金融行业对灾难恢复、演练与通报的监管要求 | 按规范名自行检索。落点：[§7 §8](07-disaster-recovery/07-disaster-recovery-section-8-sec8.md) |
| JEP 248 / JEP 333 / JEP 439 | OpenJDK，JDK 9 / 11 / 21 | G1 成为默认 GC、ZGC 的引入与分代化；参数默认值随版本变化 | 按 JEP 编号在 OpenJDK 站点检索。落点：[§5 §4](05-performance-engineering/05-performance-engineering-section-4-sec4.md)、[§5 §3](05-performance-engineering/05-performance-engineering-section-3-sec3.md) |

### 工业材料（别人是怎么落地的）

**第一组 · 官方文档与白皮书（题名可查，按题名或文号自行检索）**

- **AWS Well-Architected 白皮书 *Reducing Scope of Impact with Cell-Based Architecture*（2023）**——把 cell 定义为可独立失效的部署单元，目标写成「限制影响范围」。落点：[§1 §7.3.1](01-cell-based-architecture/01-cell-based-architecture-section-7-sec7.md)、[§1 §5.4](01-cell-based-architecture/01-cell-based-architecture-section-5-ai.md)。
- **AWS Builders' Library：*Shuffle Sharding*（2019）与 *Static stability using Availability Zones*（2021）**——前者说明「防叠加故障靠子集化，不靠更多副本」，后者说明故障切换要依赖预置路由与容量而非运行时扩容。按题名在 AWS Builders' Library 检索。落点：[§1 §7.3.1](01-cell-based-architecture/01-cell-based-architecture-section-7-sec7.md)。
- **Azure Architecture Center：*Deployment Stamps pattern***——同一思路的另一套命名。该页由微软持续更新、不绑定单一年份，核验以 Azure 架构中心当前版本为准。
- **eBay 工程团队关于 Cell-Based Architecture 的公开文章（2008 年前后提出）**——该模式的原始工程定义。落点：[§1 §5.4](01-cell-based-architecture/01-cell-based-architecture-section-5-ai.md)。
- **NVIDIA MIG 用户指南（随 A100 引入）与 NVIDIA DCGM 文档**——GPU 切分能力与 GPU 指标采集的官方入口。判断某个切分能力是否真的做到隔离，看其文档里「实例数 / 显存与算力切分比例 / 故障域」三节是否齐备，而不是看宣传页。落点：[§1 §5.2.2](01-cell-based-architecture/01-cell-based-architecture-section-5-ai.md)、[§1 §8](01-cell-based-architecture/01-cell-based-architecture-section-8-sec8.md)。
- **Kubernetes 官方文档《Horizontal Pod Autoscaler》；Istio 官方文档《Circuit Breaking》；Sentinel 官方文档**——HPA 的计算式（按当前观测值算期望副本数）是「响应式扩容天生滞后」的依据；后两者是网格层与应用层限流熔断的官方口径。落点：[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)、[§3 §7](03-large-event-readiness/03-large-event-readiness-section-7-sec7.md)。
- **Chaos Mesh（chaos-mesh.org）、ChaosBlade（chaosblade.io）、LitmusChaos（litmuschaos.io）官方文档**——分别代表 K8s 原生 CRD 体系、多语言多场景注入、ChaosEngine + 稳态探针三种形态。落点：[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md)、[§6 §4](06-chaos-engineering/06-chaos-engineering-section-4-sec4.md)。
- **AWS Fault Injection Service 与 Azure Chaos Studio 官方文档**——云厂商托管的注入服务（AWS FIS 于 2021 年前后正式可用；名称与能力边界以其官方文档当前版本为准）。落点：[§6 §4](06-chaos-engineering/06-chaos-engineering-section-4-sec4.md)、[§3 §5](03-large-event-readiness/03-large-event-readiness-section-5-ai.md)。
- **Amazon DynamoDB Global Tables 公开文档；AWS Route 53 + Global Accelerator；AWS Aurora Global Database**——跨 Region 多主复制与流量调度的云上形态。落点：[§2 §8](02-multi-region/02-multi-region-section-8-sec8.md)、[§2 §4](02-multi-region/02-multi-region-section-4-sec4.md)。
- **AWS《Well-Architected Framework - Reliability Pillar》；AWS《Auto Scaling Groups》；Google Cloud《Migrating to GKE Autopilot》；阿里云《弹性伸缩 ESS》产品文档**——RPO / RTO 在云原生语境下的实操定义与弹性方案。落点：[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)。
- **PagerDuty 官方文档《Incident Response》；阿里云《应用高可用服务 AHAS》产品文档与技术白皮书**——On-call 系统、全链路压测、流量染色与影子表隔离的工程实现细节。落点：[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)。
- **Amazon Route 53 + ALB + Global Accelerator；阿里云 DNS；Cloudflare；F5 BIG-IP DNS**——流量调度技术的商业与云上形态。落点：[§2 §8](02-multi-region/02-multi-region-section-8-sec8.md)。
- **Seata AT / TCC / Saga 模式文档；DTM 文档**——分布式事务的国内工程参考。落点：[§1 §8](01-cell-based-architecture/01-cell-based-architecture-section-8-sec8.md)、[§8 §4](08-data-consistency/08-data-consistency-section-4-sec4.md)。
- **Argo Rollouts 官方文档；SkyWalking 官方文档**——K8s 灰度回滚的原生模式、APM 对单元化染色的支持。落点：[§9 §8](09-gray-and-rollback/09-gray-and-rollback-section-8-sec8.md)、[§1 §8](01-cell-based-architecture/01-cell-based-architecture-section-8-sec8.md)。
- **HikariCP 官方 Wiki `About Pool Sizing`；MySQL 官方文档《EXPLAIN Output Format》与《Optimization》章节；ClickHouse 官方文档 `system.query_log` 与 `EXPLAIN` 章节；Redis 官方文档（`UNLINK` / Lazy Free / 缓存模式章节）**——性能工程里「谁说了算」的官方口径。落点：[§5 §8](05-performance-engineering/05-performance-engineering-section-8-sec8.md)。
- **JDK 官方文档《HotSpot Virtual Machine Garbage Collection Tuning Guide》；async-profiler GitHub README；Brendan Gregg 的 FlameGraph 实现**——GC 调优、JVM Profiling 与火焰图工具的权威入口。落点：[§5 §8](05-performance-engineering/05-performance-engineering-section-8-sec8.md)、[§5 §4](05-performance-engineering/05-performance-engineering-section-4-sec4.md)。
- **Netflix Tech Blog 系列**：*The Netflix Simian Army*（2011）、*Shadow Traffic and Production Stress Testing*、*Hystrix and Resilience4j Migration*、*Forecasting with Prophet and LSTM*，以及关于 EVCache 的公开文章——分别对应混沌起源、影子流量、熔断迁移、多模型预测与多级缓存。**按各篇题名在该博客检索**。落点：[§6 §3](06-chaos-engineering/06-chaos-engineering-section-3-sec3.md)、[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)、[§5 §8](05-performance-engineering/05-performance-engineering-section-8-sec8.md)。
- **John Allspaw《Blameless Postmortems and a Just Culture》（Etsy，[Code as Craft 博客](../14-leadership/06-postmortem-culture/06-postmortem-culture-section-7-sec7.md)，2012；同名演讲见 Velocity 2012）**——「无责复盘」成为行业实践的起点文本。**归属以本书他章口径为准：本篇属 Etsy / Allspaw，不属 Netflix**（本章 [§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md) 的参考资料一栏把它记在 Netflix 名下，以本条为准）。落点：本章 [§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)；该篇的作者与年份见他章 [Ch14 §6 复盘文化](../14-leadership/06-postmortem-culture/06-postmortem-culture.md) 与 [Ch15 §9 失败案例](../15-case-studies/09-failure-cases/09-failure-cases-section-8-sec8.md)。
- **Netflix 关于 ChAP（Chaos Automation Platform）与 FIT（Failure Injection Testing）的公开分享；Netflix《GameDay》公开演讲与博客**——混沌平台的演进路径与 GameDay 的组织细节（按关键词自行检索）。落点：[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md)、[§6 §7](06-chaos-engineering/06-chaos-engineering-section-7-sec7.md)。
- **Facebook Prophet 官方文档与论文《Forecasting at Scale》；Google DiRT（Disaster Recovery Testing）公开材料**——节假日友好型预测的数学原理，与年度大规模跨团队演练的组织方法。落点：[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)、[§4 §8](04-capacity-planning/04-capacity-planning-section-8-sec8.md)。
- **Redis 官方文档关于缓存模式的章节（Cache-Aside / Write-Through / Write-Behind）与 `FUNCTION` 章节；Apache Hadoop / Spark / Flink 官方文档中关于高可用与故障恢复的章节；Apache Iceberg / Apache Hudi 官方文档中关于 Snapshot 与 Time-Travel 的章节**——缓存范式、大数据组件的真实故障模式、湖仓时代的「备份新形态」。落点：[§5 §8](05-performance-engineering/05-performance-engineering-section-8-sec8.md)、[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md)、[§7 §8](07-disaster-recovery/07-disaster-recovery-section-8-sec8.md)。
- **OpenTelemetry（Trace 规范 1.0 发布于 2021 年）**——上下文传播与指标语义的标准化。**注意**：其 GenAI 语义约定的稳定性状态仍在演进，以官方文档当前版本为准；这一点正是 §3 把「智能体链路可观测」判为 L2 的直接依据。落点：[§5 §3](05-performance-engineering/05-performance-engineering-section-3-sec3.md)、[§3 §5](03-large-event-readiness/03-large-event-readiness-section-5-ai.md)。
- **vLLM / Triton Inference Server / TensorRT Serving 官方文档；LangChain / LlamaIndex / AutoGPT 官方文档**——推理服务的故障模式与压测方法，Agent 框架的错误处理与重试机制。落点：[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md)。

**第二组 · 厂商与机构署名材料（本书无法核实其篇名与发布年份，引用前请自行查证）**

这一组的条目在 Ch12 各主题里以「公司 + 材料」形式出现，**只作为实践方向的线索，不构成第三方生产案例**（判据见各主题 §5 的 L1 三条）：

- **阿里双 11 保障系列白皮书**（书内出现的名称包括《大促保障白皮书》《双 11 容量评估白皮书》《双 11 稳定性保障白皮书》《双 11 大促保障白皮书》）——封板机制、业务叠加法峰值预估、大促前的全链路混沌实验。落点：[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)、[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md)。
- **阿里巴巴集团《阿里异地多活——阿里巴巴分布式架构演进》；《双 11 背后——阿里巴巴数据中心演进之路》；《大型网站技术架构演进与核心业务实践》；《企业级互联网架构下的监控实践》；《325 复盘机制》白皮书**——单元化异地多活的原始定义、一键回滚与多机房演练、影子表 + 双写 + 对账的迁移范本、灰度 SLO 治理、大促复盘流程。落点：[§7 §8](07-disaster-recovery/07-disaster-recovery-section-8-sec8.md)、[§9 §8](09-gray-and-rollback/09-gray-and-rollback-section-8-sec8.md)、[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)。
- **阿里中间件团队《阿里双 11 全链路压测实践》系列公开文章**——影子表、流量标记、压测 ID 段的工程实现。落点：[§4 §8](04-capacity-planning/04-capacity-planning-section-8-sec8.md)。
- **字节跳动《全链路压测平台 ByteStress》公开分享；字节跳动技术博客《春晚红包技术保障》系列；字节跳动 ClickHouse 治理与异地多活公开分享**——字节内部压测平台的设计与踩坑、瞬时倍数极高型大促的峰值预估、大查询熔断 SOP、全球多活与 CRDT 冲突消解。落点：[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)、[§5 §8](05-performance-engineering/05-performance-engineering-section-8-sec8.md)、[§7 §8](07-disaster-recovery/07-disaster-recovery-section-8-sec8.md)。
- **京东技术团队《618 大促技术保障》公开分享；米哈游《原神》版本更新保障**——京东 618 与双 11 双线作战的容量评估与弹性扩容；游戏行业大版本更新时的 CDN 弹性扩容与分流下载。落点：[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)。
- **美团技术团队系列公开文章**（《ClickHouse 在美团的实践》《Redis 大 Key 与热 Key 治理》《缓存那些事儿》；及多 Region 外卖单元化、统一备战节奏与容量模型）——慢查询治理、热 Key 治理、缓存三大问题与多业务共用一套备战节奏。落点：[§5 §8](05-performance-engineering/05-performance-engineering-section-8-sec8.md)、[§1 §6](01-cell-based-architecture/01-cell-based-architecture-section-6-sec6.md)、[§3 §6](03-large-event-readiness/03-large-event-readiness-section-6-sec6.md)。
- **腾讯《跨部门作战室》公开材料；滴滴分时段与分城市的容量模型公开材料；Netflix 多 Region 灾备与业务容错的公开材料**——把「协同」本身当作需要演练的系统能力；双峰与突变下的容量建模；以业务容错而非强一致换 RTO。落点：[§3 §6](03-large-event-readiness/03-large-event-readiness-section-6-sec6.md)、[§4 §6](04-capacity-planning/04-capacity-planning-section-6-sec6.md)、[§7 §8](07-disaster-recovery/07-disaster-recovery-section-8-sec8.md)。
- **阿里云《企业级数据备份与归档最佳实践》；阿里云《云原生数据仓库 AnalyticDB 性能调优白皮书》**——OSS 跨 Region 复制 + 归档；OLAP 场景慢查询治理。落点：[§7 §8](07-disaster-recovery/07-disaster-recovery-section-8-sec8.md)、[§5 §8](05-performance-engineering/05-performance-engineering-section-8-sec8.md)。
- **极客时间《MySQL 实战 45 讲》（林晓斌）；《深入拆解 Java 虚拟机》（郑雨迪）**——按课程名与讲者自行检索。落点：[§5 §8](05-performance-engineering/05-performance-engineering-section-8-sec8.md)。

**第三组 · 开源项目与工具链（按项目名自行检索）**

- **压测与施压**：Apache JMeter / Gatling / Locust / k6（Grafana Labs）/ Vegeta。落点：[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)、[§3 §4](03-large-event-readiness/03-large-event-readiness-section-4-sec4.md)。
- **限流、降级、熔断与弹性扩容**：Sentinel / Resilience4j / Hystrix / Polly / Istio / Envoy；Kubernetes HPA / VPA / Cluster Autoscaler / KEDA / 阿里云 ESS / AWS Auto Scaling / Spot Ocean。落点：[§3 主文件](03-large-event-readiness/03-large-event-readiness.md)、[§3 §4](03-large-event-readiness/03-large-event-readiness-section-4-sec4.md)。
- **混沌工具链**：Chaos Monkey / Chaos Gorilla / Chaos Kong（Netflix）、ChaosBlade（阿里）、Chaos Mesh（PingCAP / CNCF）、LitmusChaos（CNCF）、Gremlin（商业）、AWS FIS、Azure Chaos Studio。落点：[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md)、[§1 §6](01-cell-based-architecture/01-cell-based-architecture-section-6-sec6.md)、[§4 §8](04-capacity-planning/04-capacity-planning-section-8-sec8.md)。
- **可观测与 Profiling**：Prometheus / AlertManager / Grafana / Thanos / Jaeger / Zipkin / SkyWalking / OpenTelemetry / 阿里云 ARMS；perf / async-profiler / FlameGraph / eBPF / JFR / VisualVM / Uber JVM Profiler / Google Cloud Profiler。落点：[§1 §8](01-cell-based-architecture/01-cell-based-architecture-section-8-sec8.md)、[§5 §4](05-performance-engineering/05-performance-engineering-section-4-sec4.md)、[§5 §8](05-performance-engineering/05-performance-engineering-section-8-sec8.md)。
- **渐进式交付与实验平台**：Argo Rollouts / Flagger / Spinnaker / GrowthBook / Optimizely。落点：[§9 §3](09-gray-and-rollback/09-gray-and-rollback-section-3-sec3.md)、[§9 §4](09-gray-and-rollback/09-gray-and-rollback-section-4-sec4.md)。
- **数据层（分片、分布式事务、分布式数据库、同步与在线改表）**：ShardingSphere / Vitess / MyCat / DRDS（PolarDB-X）；Seata / DTM / ByteTCC；Google Spanner / CockroachDB / YugabyteDB / TiDB / OceanBase / Amazon DynamoDB；Debezium / Maxwell / gh-ost / pt-online-schema-change / pg_repack / Apache SeaTunnel / DataX。落点：[§1 §4](01-cell-based-architecture/01-cell-based-architecture-section-4-sec4.md)、[§2 §4](02-multi-region/02-multi-region-section-4-sec4.md)、[§8 §4](08-data-consistency/08-data-consistency-section-4-sec4.md)、[§9 §4](09-gray-and-rollback/09-gray-and-rollback-section-4-sec4.md)、[§1 §8](01-cell-based-architecture/01-cell-based-architecture-section-8-sec8.md)、[§2 §8](02-multi-region/02-multi-region-section-8-sec8.md)。
- **预测与推理**：ARIMA / Prophet / LSTM / XGBoost；vLLM / TensorRT-LLM / ONNX Runtime。落点：[§4 §7](04-capacity-planning/04-capacity-planning-section-7-sec7.md)、[§3 主文件](03-large-event-readiness/03-large-event-readiness.md)、[§5 §5](05-performance-engineering/05-performance-engineering-section-5-ai.md)。

### 2024–2025 前沿（本书已具名，请连档位一起读）

- **字节跳动 ChaosAgent**——面向 AI 链路的混沌平台，覆盖 Agent 工具失败、API 超时、GPU OOM 等新型故障。**此为厂商自述，本书未核到第三方实测数据。** 落点：[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md)。
- **字节跳动 CapacityAI 平台公开技术分享（2024）**——LSTM + Prophet + 业务事件注入的三层组合预测 pipeline（其具体幅度与文档出处本书无法核验，按【经验】档处理）。落点：[§4 §8](04-capacity-planning/04-capacity-planning-section-8-sec8.md)。
- **OpenAI《Best Practices for Production AI Applications》；LangChain 官方文档《Production Best Practices》**——大模型 API 与智能体链路的生产环境最佳实践。按题名自行检索。落点：[§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md)。
- **OpenAI 内部混沌实践（2024 公开分享）；AWS Bedrock + AWS FIS 集成；Azure AI Studio + Chaos Studio 集成；Google SRE AI Incident Response Assistant（2024 发布）**——把混沌能力延伸到模型平台与 AI 故障响应。均属厂商公开分享，**本书未把其中任何一条当作技术事实使用**。落点：[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md)。
- **Prompt 缓存**：Anthropic / OpenAI / Google（Gemini API）/ DeepSeek 等厂商在 2024 年前后陆续公布缓存计费档位，vLLM 等推理引擎同期提供自动前缀缓存——**折扣幅度、最小可缓存长度与计费口径以各厂商定价页与引擎文档当前版本为准**（可按「prompt caching pricing + 厂商名」自行核验）。落点：[§3 §5](03-large-event-readiness/03-large-event-readiness-section-5-ai.md)。
- **Transformer 类预测模型族：Informer / Autoformer / PatchTST**——2024–2025 学术 SOTA 方向，适合多变量耦合预测，但生产落地需 GPU 推理，工程门槛最高。落点：[§4 §8](04-capacity-planning/04-capacity-planning-section-8-sec8.md)。
- **SGLang**——结构化生成 / 高性能服务框架方向。**其会议归属（NeurIPS 2024）本书无法核验**，判定方法是按标题在会议论文集页面检索；方向保留，不作为证据使用。落点：[§5 §5](05-performance-engineering/05-performance-engineering-section-5-ai.md)。
- **ML 系统混沌的三条学术方向**（分别标注 NeurIPS 2024 / USENIX ATC 2024 / KDD 2024：ML 系统的混沌工程、AI 链路的韧性设计、因果推断在混沌分析中的应用）——**三条本书均无法核验**，判定方法是按论文标题在对应会议论文集页面检索；方向保留，不作为证据使用。落点：[§6 §5](06-chaos-engineering/06-chaos-engineering-section-5-ai.md)、[§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md)。
- **AWS Cell-Based Architecture Reference（2024）**——AWS 公开发布的参考架构；本书**将其可核验入口明确收敛到上面那份 2023 年的 Well-Architected 白皮书**，不单独按「2024 参考架构」立论。落点：[§1 §5.4](01-cell-based-architecture/01-cell-based-architecture-section-5-ai.md)、[§1 §8](01-cell-based-architecture/01-cell-based-architecture-section-8-sec8.md)。
- **「AI 辅助变更管理」三条厂商自述**：阿里 A/B 平台「实验即代码」（2024）、Netflix AI 辅助金丝雀（2024）、OpenAI 渐进式模型发布（**其梯度比例出自厂商自述，本书不作为案例引用**）——**本节只作方向指认，不逐条断言其能力**；它们在 §9 §5 的判据表里都停在 L2 及以下。落点：[§9 §5](09-gray-and-rollback/09-gray-and-rollback-section-5-ai.md)。
- **弹性 GPU 与集群产品线**：阿里云 EGS / 灵骏、AWS 的 Inferentia 系列与 P5 一类集群实例——可作为「能力是否有正式发布说明、接口是否稳定」的补充判据，但**具体规格、可用区与配额一律以官方文档当前版本为准，不要用产品名代替能力判断**。落点：[§4 §5](04-capacity-planning/04-capacity-planning-section-5-ai.md)、[§4 §4](04-capacity-planning/04-capacity-planning-section-4-sec4.md)。

### 学习路径建议

路径按「先立骨架、再进前沿」排，**不设人为的周数**——每一站的工作量取决于你自己的系统规模与既往经验。每一站都给本章对应主题文件的入口。

1. **先立稳定性骨架（SRE + 容灾）**：*Site Reliability Engineering* 第 4 章 + *The Site Reliability Workbook* 第 5 章，建立 SLI / SLO / 错误预算这套「可承受的不可用时间」口径；再读 [§7 容灾设计](07-disaster-recovery/07-disaster-recovery.md) 与 [§2 异地多活](02-multi-region/02-multi-region.md)，把它落到 RPO / RTO 上。
2. **补分布式理论（一致性 + 分区）**：DDIA 第 6 / 7 / 9 章 + CAP 与 PACELC 两篇原文 + Dynamo 与 Spanner 两篇论文；对照读 [§8 数据一致性](08-data-consistency/08-data-consistency.md) 与 [§1 单元化架构](01-cell-based-architecture/01-cell-based-architecture.md)——注意这两章回答的是同一个问题的两端：一个问「多地可写怎么办」，一个问「怎么让它变成单写」。
3. **练「扛住峰值」的手感（大促 + 容量 + 性能）**：*Forecasting: Principles and Practice* 第 9–10 章 + Little's Law 原文，再进 [§4 容量规划](04-capacity-planning/04-capacity-planning.md)、[§3 大促保障](03-large-event-readiness/03-large-event-readiness.md)、[§5 性能工程](05-performance-engineering/05-performance-engineering.md)。这三章的工业材料最多、也最需要连着「篇名未核验」这句提示一起读。
4. **学「主动制造故障」（混沌 + 容灾演练）**：Netflix《Chaos Engineering Principles》五条 + *Chaos Engineering*（O'Reilly）第 6–11 章 + *Chaos Engineering: System Resiliency in Practice* 第 4 章，再进 [§6 混沌工程](06-chaos-engineering/06-chaos-engineering.md)；演练的组织形态（GameDay、爆炸半径分级、审批）看 [§3 §8](03-large-event-readiness/03-large-event-readiness-section-8-sec8.md) 与 [§6 §8](06-chaos-engineering/06-chaos-engineering-section-8-sec8.md)。
5. **学「怎么把变更放出去、怎么收回来」（灰度 + 回滚 + 实验）**：*Trustworthy Online Controlled Experiments* 立 A/B 的统计口径、*Accelerate* 看变更管理的行业基线（记住它的口径是问卷统计），再进 [§9 灰度与回滚](09-gray-and-rollback/09-gray-and-rollback.md)，最后进 [§13 · 决策与权衡](../13-decision/)（把架构取舍沉淀成 ADR）。
6. **最后才看 AI 侧**：本章九个子主题各有一篇 §5「AI 演进」，[§1 §5](01-cell-based-architecture/01-cell-based-architecture-section-5-ai.md)（单元化）与 [§6 §5](06-chaos-engineering/06-chaos-engineering-section-5-ai.md)（混沌）写得最完整。**读法与其他资料相反**：先看它的判据表（L1 / L2 / L3 各卡在哪一条），再看结论——本章九节的判据表里 L1 极少，判到 L1 的只有 [§7 §5](07-disaster-recovery/07-disaster-recovery-section-5-ai.md) 的「推理服务多 Region 多活（接入层）」与 [§8 §5](08-data-consistency/08-data-consistency-section-5-ai.md) 的「Agent 状态放进共识存储」「Prompt 缓存」，其余多停在 L2 / L3——先看判据表再看结论，才不会把 L2 当 L1 排进路线图。

> **本章没有「暂无可归拢具名材料」的主题**：上面九个主题各自都有可查的经典或工业材料；但 §9 灰度与回滚的**变更管理成效指标**（回滚耗时、变更失败率、事故数）在整个书内都只有问卷统计口径，没有第三方生产案例——这一点见该主题 §5 的判据声明。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch13 · 决策与权衡](../13-decision/) 学习把架构决策固化为 ADR
- 进入 [Ch15 · 案例库](../15-case-studies/) 看真实大促稳定性案例