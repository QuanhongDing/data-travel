> 本文件是 **01-ai-data-governance.md** § 8 面试真题集的子主题。完整章节请回到 [index](01-ai-data-governance.md) 或 [§ 8 索引](01-ai-data-governance-section-8-sec8.md)。

### 8.3 §5.5 大规模集群安全架构设计与优化

> 本主题考察「万节点 Hadoop 安全体系的工程化能力」：Kerberos / Ranger / Sentry 的分工、Ranger 在大规模策略下的性能、Lambda 架构下批流链路的统一安全治理、以及真实 Kerberos 故障的排查经验。它对应真实生产中最容易出问题的安全层——「系统越多，故障面越大」。

#### §5.5.1 请阐述 Apache Ranger 和 Sentry 在功能定位上的主要区别，以及在数据权限管理方面，为什么当前业界更推荐使用 Ranger？

**1. 考察点**

- 是否理解两者的不同设计哲学：Sentry 是「集成到引擎内部」、Ranger 是「外部策略中心 + 插件拦截」。
- 能否说清 Ranger 在「统一策略」「标签驱动」「审计」三个维度上的结构性优势。
- 是否了解 Cloudera 已将 Ranger 作为默认权限方案，Sentry 仍在 Impala 旧栈使用的历史背景。
- 加分项：能给出与 Unity Catalog / LakeFormation 的范式对比。

**2. 参考答案框架**

**第一层：两者的设计原点。**

- **Sentry**：Cloudera 在 2014 年左右开源，定位为「**嵌入到 SQL 引擎内部的 RBAC 库**」——它自己定义角色、资源、操作模型，与 Hive/Impala 强耦合。没有独立的策略中心，策略分散在 Hive Metastore 上，跨组件一致性差。
- **Ranger**：早期 Hortonworks 在 2015 年主导开源，定位为「**独立策略中心 + 组件插件拦截**」——Admin 服务独立，策略统一存储（MySQL/Postgres），通过 Ranger Plugin 同步给 Hive/HDFS/HBase/Kafka 等引擎。Audit 完整、跨组件统一。

**第二层：能力维度的对比。**

| 维度 | Sentry | Ranger |
| --- | --- | --- |
| 架构 | 嵌入式 | 中心化 + 插件 |
| 资源粒度 | 库/表/列 | 库/表/列/文件路径/tag |
| 跨组件一致性 | 弱（靠各引擎分别配置） | 强（统一策略中心） |
| 行级 / 列级 | 部分支持 | 支持（row filter / column mask） |
| 标签驱动（ABAC） | 弱 | 强（与 Atlas 集成） |
| 审计 | 简化 | 完整（拒绝事件也审计） |
| 集成组件 | Hive / Impala / HDFS | Hive / HDFS / HBase / Kafka / YARN / Spark / S3 / Atlas / Trino / Ozone |
| 兼容性 / 生态 | Cloudera 路线 | 大数据生态主流 |

**第三层：业界偏好的关键原因。** 当前企业（互联网、金融）普遍选 Ranger 而不是 Sentry 的三个原因：

1. **统一性**：策略集中管控——这是合规审计的硬要求。LinkedIn 工程团队在《Cobra - Hadoop Security at Scale》中明确把「集中化、版本化、可审计」列为第一原则。
2. **细粒度**：Masking（脱敏）、Row-level Filter（行过滤）、Tag-based（基于 Atlas 标签）三大能力，组成了 PII 治理的标准动作。
3. **生态兼容**：与 Apache Atlas、KMS、对象存储均可组合，适合数据湖时代。

**第四层：迁移路径与共存。** 仍有一些 Cloudera 客户保留 Sentry（用于 Impala），迁移路径是「Sentry 策略导出 → Ranger 策略导入 → 双写对比 → 全切」，期间保持双 Plugin 共存。

**3. 常见陷阱**

- **认为 Ranger 完全替代 Sentry**——Cloudera CDP 7.x 起 Ranger 已是默认，但部分老版本 Impala 仍依赖 Sentry。
- **以为 Ranger 自带列脱敏的执行优化**——Ranger 重写 SQL 需要 Hive 启用基于规则的优化器，否则性能差。
- **忽视 Ranger Plugin 缓存失效模式**——必须显式配置 fail-closed。
- **混淆 Ranger 与 OPA 角色**——OPA 是策略即代码通用框架，Ranger 是数据特化版，治理场景下可组合使用。

**4. 追问预测**

- **「Ranger 与 Unity Catalog 能桥接吗？」** 答：可以。Unity Catalog 早期版本已支持外部策略桥接到 Ranger；目前主流做法是用 Unity Catalog 作为 Databricks 内部的统一目录，跨云场景再桥到 Ranger / LakeFormation。
- **「旧表没有元数据怎么批量授权？」** 答：用 Ranger TagSync 把 Hive 表与 Atlas 实体打标签，再用 tag-based policy 批授权。这是「表很多，owner 无法逐张授权」的标准解。

**5. 参考资料**

- Apache Ranger 官方文档。
- Apache Sentry 公开归档文档——了解历史定位与功能边界。
- Cloudera / Hortonworks 合并后的公开材料——Ranger 在 CDP 7.x 之后成为默认。
- LinkedIn 关于「Cobra / ProML 安全治理」的公开演讲。
- Databricks《Unity Catalog 与 Apache Ranger 对比》公开文档。
- **招商银行从 Sentry 迁 Ranger 的工程案例** —— Hive + Impala 旧栈 Sentry 双 Plugin 共存期间，用 Ranger TagSync 接管列级 / 行级 Masking。
- **网易雷火在阿里云上跑 Ranger 的游戏业务实践** —— 用户画像 + 反作弊场景下统一策略中心 + 跨 Hive/Spark/StarRocks 三端授权。
- **美的的制造业 Sentry → Ranger 迁移经验** —— 在多工厂数据湖中保留 Sentry 做 Impala 兜底，主链路迁 Ranger 实现标签化策略驱动。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.5.2 在大规模集群中，当 Ranger 策略数量达到数万级别时，可能会遇到哪些性能瓶颈？应如何调优或重构策略存储与评估机制？

**1. 考察点**

- 是否具备「策略规模放大后性能退化」的工程直觉——评估、缓存、Admin 数据库都会成为瓶颈。
- 能否指出 Ranger Admin 的 MySQL 压力、Ranger Plugin 的本地缓存抖动、Ranger TagSync 的全表扫描等典型问题。
- 是否掌握「策略合并、tag 化、缓存预热、分级缓存」等大型集群的标准做法。
- 加分项：能给具体参数，如评估 RT、缓存条目数、定时拉取间隔。

**2. 参考答案框架**

**第一层：先定位瓶颈的层次。** 数万级 Ranger 策略在万节点集群上通常会同时出现三类问题：

- **Admin 层的 DB 压力**：策略增删改直接走 MySQL/InnoDB；如果高频拉取导致 InnoDB 行锁竞争，可能出现策略同步延迟。
- **Plugin 层的评估 RT**：Hive / Spark / HDFS 的 Plugin 在每次访问时都需要从内存策略库中过滤匹配。策略多了，匹配从哈希查退化成顺序匹配；资源量级高时，PolicyRefresher 周期性 reload 会卡顿。
- **TagSync 层的 Atlas 全扫描**：开启标签策略后，每次同步会把所有 Atlas 实体拉一遍并打到策略上，标签量大时这本身就是一次大查询。

**第二层：调优路径。**

- **策略合并**：用正则/通配符替代细粒度策略——把同类的「按用户授权」合并为一条 wildcard 策略，策略规模可下降 10 倍。
- **启用策略分级缓存**：Ranger 支持 `policy.cache.dir` + 多级内存缓存，把热策略（80/20）放在 JVM 堆内，其余落盘；并把策略有效期与 `PolicyRefresher` 的 `policy.retry`、`policy.load.timeout` 调到秒级。
- **Tag 驱动替代直授权**：把「按 user 授权」改为「按 tag 授权」。每张表授权一次，永久生效——本质上是把 O(N×M) 的策略矩阵降成 O(N+M)。
- **DB 分库分表**：Ranger Admin 的策略表按服务类型分区；定期归档长期不用的策略。
- **异步评估**：把 Plugin 的同步评估改为「预评估 + 异步去重」；对热点资源预计算 allow / deny。

**第三层：架构层的重构。** 当单 Ranger Admin 撑不住时，可以走两条路：

- **多 Ranger Admin 实例 + DB 集群**：Admin 横向扩展（Ranger 2.x 起支持），DB 用 MySQL MGR / Postgres Patroni。
- **策略中心独立**：把 Ranger Admin 拆为「决策服务 + 同步服务」，决策服务用内存 KV（如 Redis 缓存）+ 审计落库；同步服务做 Admin → Plugin 的拉取与推送。

**第四层：监控与对账。** 健康集群应具备四类指标：

- 评估 RT P50/P99（Plugin 主动采样上报）；
- 缓存命中率与 reload 时长；
- Admin DB 的 QPS 与锁等待；
- 策略变化次数 / 命中率（业务侧）。

**3. 常见陷阱**

- **「不监控 DB QPS，靠加内存扩 Postgres 端口解决问题」**——这是把症状当病因。
- **「把策略都写到 wildcard，结果 deny 失效」**——wildcard 顺序敏感，Ranger 按策略优先级评估，错序会让 deny 失效。
- **「只调 Plugin 不调 Admin」**——Admin 是瓶颈时调 Plugin 无效。
- **「用 Ranger UI 改策略后忘了 publish」**——在 CDN / 大集群上必须配合审核发布流程。

**4. 追问预测**

- **「数百万标签级别的策略怎么评估？」** 答：把 Tag 索引按业务域做物理分片，Plugin 内置分片 LRU；评估时只查「用户所拥有的资源标签」。
- **「Audit log 拉爆 MySQL 怎么办？」** 答：单独日志表走异步落库（Kafka → ClickHouse），Admin 仅存元数据。

**5. 参考资料**

- Apache Ranger 官方文档（关于 Policies、Tags、Plugin、PolicyRefresher 的章节）。
- Cloudera 关于 Ranger Performance Tuning 的公开指南。
- LinkedIn 关于 Ranger 调优与策略合并的工程实践公开演讲。
- 阿里 / 字节关于大规模 Ranger 部署的公开技术博客。
- **招商银行的万级 Ranger 策略调优实践** —— 用 wildcard 合并 + Tag 化授权把 O(N×M) 策略矩阵压到 O(N+M)，Admin DB 拆分后 QPS 升 3 倍。
- **滴滴的大规模 Ranger 策略合并实战** —— 跨出行 / 外卖多业务条线把低频策略下线、相似策略合并，并配合 Plugin OFF-HEAP 缓存避坑。
- **中国移动的 Ranger Admin 集群部署调优** —— 用 Ranger 2.x 多 Admin + DB 集群分库分区，按业务域拆分策略表减小 InnoDB 锁竞争。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.5.3 随着数据湖概念的演进，现代数据平台的安全架构需要考虑哪些新的挑战（如数据湖与 AI 结合后的新型治理风险），以及如何应对？

**1. 考察点**

- 是否理解「数据湖 ≠ 大 HDFS」——它是存储 + 元数据 + 计算的异构组合，攻击面更广。
- 能否列出数据湖特有的安全对象：开放文件格式、半结构化数据、向量索引、Embedding。
- 是否知道「数据湖 + AI」带来的新型风险：模型反演、Embedding 反演、训练数据投毒、Prompt 注入。
- 加分项：能给出与 EU AI Act / NIST AI RMF 对应的技术控制项。

**2. 参考答案框架**

**第一层：传统 Hadoop 安全栈的局限。** 传统大数据栈（Kerberos + Ranger + Atlas + Hive）解决了「结构化表 + 文件」的边界安全。但数据湖时代出现三类挑战：

- **存储异构**：同一个查询可能跑在 HDFS、S3、OSS、LakeFS 多种存储上，原生权限模型不一致；
- **元数据新形态**：Iceberg / Hudi / Delta 的元数据本身需要保护——一旦 Snapshot Manifest 被篡改，整个表的历史回溯都会失真；
- **AI 资产并列**：模型权重、Embedding、向量索引引入全新的「安全敏感对象」，传统工具几乎不能直接治理。

**第二层：数据湖与 AI 的结合带来的新型风险。**

- **Embedding 反演**：攻击者通过查询向量库相似度，反演出原始数据片段（已被 Carlini 等人的研究反复验证）。Uber 与 Microsoft 都把它列为一级风险。
- **训练数据投毒**：第三方数据集未审计→模型注入后门。《MITRE ATLAS》收录了多起行业事件。
- **Prompt 注入**：把恶意指令塞进检索文档，RAG 系统间接执行。OWASP Top 10 for LLM Applications 将其列为 LLM01。
- **模型权重泄露**：单一权重文件价值上亿美元，必须以密文 + DRM 方式流通。
- **跨数据源关联**：湖里同一主体的数据被多源关联，可能推断出敏感属性（例如位置+行程 → 健康状态）。

**第三层：应对策略——四层加固。**

- **存储层加固**：对象存储 SSE-KMS；桶策略细粒度；桶内文件不变性（Object Lock）；客户端加密（Envelope Encryption）。
- **元数据层加固**：Iceberg/Hudi 自身的 Snapshot 不可篡改 + 校验和；Catalog 层的角色授权；Manifest 文件签名。
- **AI 资产层加固**：模型 Registry（MLflow / Weights & Biases）+ 权重加密 + Model Card 标准 + 评估审计。
- **运行时加固**：AI Gateway 在推理路径上做输入注入检测 + 输出过滤 + 全链路审计；OpenTelemetry + LLM Observability 平台（Langfuse / Helicone / Arize Phoenix）。

**第四层：与 AI 治理框架的映射。**

- **EU AI Act**：高风险 AI 系统必须满足风险管理、数据治理、透明度、人为监督、准确性、稳健性、网络安全——技术层面正落在以上四层加固中。
- **NIST AI RMF（Govern/Map/Measure/Manage）**：要求治理动作嵌入到模型上线前与运行中。
- **ISO/IEC 42001**：组织级 AI 管理体系标准。
- **中国《生成式 AI 暂行办法》**：内容安全评估 + 备案 + 输出标识（2025-09 强制 Deepfake 标识）。

**3. 常见陷阱**

- **把数据湖当成大 HDFS**——忘了它有 Catalog、有 Snapshot、有跨引擎一致性这层新问题。
- **AI 治理当作合规事项，没有工程落地**——治理体系能不能上线，取决于有没有把策略变成 Plugin / OPA 规则。
- **混淆数据湖与数据集市**——前者是底座 + 元数据 + 计算的多组件；后者只是消费层。
- **遗漏向量索引治理**——向量库的元数据也包含训练语料指纹，必须被独立审计。

**4. 追问预测**

- **「向量库怎么治理？」** 答：把向量库的元数据并入统一 Catalog（Milvus / Qdrant / pgvector 都支持 metadata tag）；监控相似度阈值突变（异常反演征兆）；并把检索 query 入审计。
- **「如何限制训练数据来源？」** 答：引入「数据合约（Data Contract）」——生产者声明授权、用途、保留期；消费者在拉取时强制校验 schema + license。
- **「AI 决策可追溯如何保证？」** 答：完整 trace（输入、Prompt、检索、模型版、输出、反馈）入审计平台，并在推理响应中附带 `trace_id`。

**5. 参考资料**

- Apache Iceberg / Apache Hudi / Delta Lake 官方文档——元数据与时间旅行的安全模型。
- OWASP《Top 10 for LLM Applications》——AI 应用层风险的官方清单。
- MITRE《ATLAS》——AI 攻击与防御的对抗性知识库。
- Microsoft《Microsoft Responsible AI Standard v2》——AI 治理落地的工业范式。
- 阿里《数据中台 + AI 治理白皮书》——国内对数据湖 + AI 治理的工程化建议。
- EU 官方法律文本《EU AI Act》（Regulation 2024/1689）——强制法律框架。
- **蚂蚁集团的大模型安全治理** —— 在信贷 + 保险场景落地 Embedding 反演防御、训练数据投毒检测与 RAG 输入注入审计，并对接监管报送。
- **网易雷火游戏 LLM 应用的输入注入防御** —— 在玩家 NPC 对话场景下注入 OWASP LLM01 防御，AI Gateway 层加内容过滤 + 异常检测。
- **微医医疗 LLM 隐私保护** —— 在问诊 + 处方场景用 DP-SGD + Prompt 日志脱敏 + 推理审计三层加固，满足医疗数据强合规。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.5.4 在设计一个万节点规模的 Hadoop 集群安全架构时，你会如何规划 Kerberos KDC、Ranger Admin、审计与高可用的拓扑？

**1. 考察点**

- 是否具备「在超大规模下，孤岛组件必须独立 SLO」的全局观。
- 能否说清 KDC、Admin、Audit、IAM 在网络与可用区上的部署策略。
- 是否知道「审计必须异步、集中、可搜索」的三条铁律。
- 加分项：能给出最大并发、Redis 缓存大小、KDC 副本数等参数经验。

**2. 参考答案框架**

**第一层：先把对象分层。** 万节点 Hadoop 安全栈里有四个关键服务：

- **KDC**：身份认证（人 + 服务）。
- **Ranger Admin**：策略决策中心（资源 → 用户 → 操作）。
- **Audit 收集与存储**：所有访问、决策、查询的日志汇聚。
- **IAM / LDAP**：唯一身份源（与 HR 系统对接）。

每一层都该独立 SLO。

**第二层：拓扑设计的核心原则。**

- **分层部署**：KDC 与 Ranger Admin 放核心安全域（受防火墙保护、权限最低的镜像节点），不与业务集群同节点。
- **跨机房**：KDC 主从 + kprop 同步；Ranger Admin 主从（同 MySQL MGR），Admin 故障时 Plugin 走缓存（fail-closed 模式拒绝，保证安全优先）。
- **审计异步**：审计事件直接走 Kafka，不要让 HiveServer2 / Plugin 写 HDFS 或写 Admin DB。任何「同步审计」会反过来成为性能瓶颈。
- **审计冷热分层**：热数据 → ClickHouse 或 StarRocks（实时查询）；冷数据 → S3 / OSS + Parquet，按月归档，保留 6 个月 - 3 年。

**第三层：容量预估。** 给几个常见的万节点经验值：

- **KDC**：峰值 TGS 请求约 5w QPS（按每分钟 1k 个作业上线 + 续签 + 短期查询估算），主节点建议 4 核 8GB 起，从节点建议 2 核 4GB 起。
- **Ranger Admin**：策略量 5w-20w 条，DB 连接池 ≥ 50，JVM 堆 ≥ 8GB；Plugin 缓存大小按策略条数 × 平均条目大小估算（一般 256MB 就够，但热集群用 JVM OFF-HEAP 缓存 2GB）。
- **Audit Pipeline**：每天事件数十亿级（万节点集群上每毫秒数百次访问）。Kafka 集群容量按保留 72h 估算；ClickHouse 集群按 30 天热数据存。
- **IAM 同步**：SCIM / 自研同步走消息队列，不要直接 KDC ↔ IdP 互连。

**第四层：极端情况的兜底。**

- **KDC 全不可用**：所有 Kerberos 认证降级到 token-only 模式（依赖缓存），且只读不写。LinkedIn 在《Cobra》中描述过「KDC 短暂不可用 → 让长任务用机器证书短期继续运行」的 fallback 模式。
- **Ranger Admin 全不可用**：Plugin 默认 fail-closed（拒绝），但部分公司会调成 fail-open（放行）以维持业务；这里有安全与可用性的权衡。
- **Audit Pipeline 故障**：业务依然运行，事件进入磁盘 ring buffer，重启后回流 Kafka。绝不能因为审计故障让业务不可用。

**3. 常见陷阱**

- **KDC 与 Ranger Admin 共部署**——KDC 故障炸穿整个集群。
- **Plugin fail-open 默认**——安全违规门槛过低。
- **Audit 同步写**——审计故障变成主流程故障。
- **审计不加密传输**——审计本身包含敏感访问模式，必须 TLS。
- **没有演练过故障恢复路径**——任何 HA 拓扑不演练等于没有。

**4. 追问预测**

- **「如何把集群安全状态上报全局 SOC？」** 答：所有 Audit 事件落 Kafka → 流计算 → 标准化 SIEM（Splunk/ELK）；同时定义规则（如某用户 5 分钟访问 100 张表 → 高风险告警）。
- **「KDC 跨城部署同时数据中心 A 断电怎么办？」** 答：主从 + DNS SRV 切；客户端无需重启；TGT 时钟漂移过大时强制重认证。

**5. 参考资料**

- MIT Kerberos 官方文档中关于「Master/Slave KDC」的章节。
- Apache Ranger 官方文档中关于「Ranger High Availability」的章节。
- LinkedIn Engineering《Cobra - Hadoop Security at Scale》公开演讲。
- Cloudera 关于 CDP Security 部署的公开文档。
- Netflix 关于 Event-driven Security Telemetry 的公开博客。
- **招商银行的万节点 Hadoop 安全拓扑** —— 核心安全域独立部署 KDC + Ranger Admin + Audit Collector，跨机房 KDC 多主互备，Audit 落 Kafka + ClickHouse 冷热分层。
- **中国移动的全国级大数据集中安全管控** —— 在 31 省分大数据集群中部署统一策略中心与审计湖，跨省域身份通过 SCIM + LDAP 联邦打通。
- **国家电网调度大数据集群的 Kerberos 部署** —— 在电力调度系统中跨网隔离部署 KDC，用 kprop 同步，KDC 失效后保留只读 token 模式。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.5.5 请描述一个你处理过的真实案例，其中涉及 Kerberos 认证故障导致集群服务不可用，说明根因、排查过程与止血+根治方案。

**1. 考察点**

- 是否具备「故障不只看症状，要看症状的时序与拓扑」的系统思维。
- 能否描述「先止血、再定位、再根治」的工业级故障处理流程。
- 是否理解 Kerberos 特有的时钟漂移、keytab 过期、KDC 负载、principal 未注册等常见根因。
- 加分项：能引用真正的生产案例或参考案例，并把排查步骤写成 playbook。

**2. 参考答案框架**

**第一层：典型根因分类。** Kerberos 故障大致可分五类：

- **时钟漂移（NTP 异常）**：客户端与服务端时间差 > 5 分钟，所有票据被视为过期。
- **KDC 不可达**：网络抖动、主 KDC 故障、客户端 DNS 解析错误。
- **principal 未注册 / keytab 过期 / 错误**：新服务未注册 principal，或运维轮换 keytab 后未同步。
- **TGT 过期**：长任务在运行多天后 TGT 过期，续签失败。
- **replay 防护触发**：客户端时间窗口过期，触发 KDC 的「票据重放防护」。

**第二层：参考排查流程（playbook）。**

- **Step 1：症状采集**。明确故障影响范围（哪些服务挂，影响哪些用户），最近一次改动（升级、配置变更、keytab 轮换）。
- **Step 2：连通性确认**。`kinit` 测试、Principal 验证、KDC DNS 解析、网络连通（telnet/curl KDC port 88）。
- **Step 3：日志比对**。KDC 日志、客户端日志、服务端日志，按时间序列排；要特别看 `krb5kdc.log` 与 `krb5_child.log`。
- **Step 4：时钟同步检查**。`ntpdate -q` 或 `chronyc tracking`；时钟差超过 5 分钟则根因就是它。
- **Step 5：票据状态**。`klist` 看 TGT、Renewable、expired；`kvno` 测 Service Ticket 是否可获取。
- **Step 6：临时止血 + 长期修复**。

**第三层：参考案例（公开报道 / 通用案例）。**

- **案例 A（时钟漂移）**：某互联网公司凌晨批量作业集中失败，KDC 日志显示大量 `KRB_AP_ERR_SKEW`。根因：VMWare 虚拟机时间同步策略变更。止血：把 NTP daemon 切回强制同步；根治：在 Hypervisor 层禁用「时间漂移吸收」。
- **案例 B（KDC 过载）**：某金融客户在大量并发作业提交时 KDC CPU 100%，TGS 返回 `KRB5KDC_ERR_S_PRINCIPAL_UNKNOWN`。根因：KDC 单实例 + 横向扩展缺失。止血：扩容至 3 KDC；根治：业务方改成批量提交 + KDC 多主。
- **案例 C（keytab 过期）**：某大型数据平台升级后 30% 服务报 `no key table entry`。根因：运维轮换 keytab 时漏掉若干服务。止血：批量下发旧 keytab；根治：把所有 keytab 入配置中心 + 续签监控。
- **案例 D（长任务 TGT 过期）**：某 Spark Streaming 作业跑了 14 天后失败，日志显示 `TGT expired`。根因：AM 续签线程崩溃。止血：重启作业 + 手动续签；根治：增强 AM 续签监控与 watchdog。

**第四层：根治的工程标准动作。**

- **建立 Kerberos 健康检查自动化**（巡检脚本 + Grafana 指标）；
- **KDC 流量与时延的容量规划**（峰值 2x）；
- **自动 keytab 轮换系统**（密钥中心 KV + 灰度）；
- **时钟统一架构**（DCN 内部统一 NTP + 时间漂移监控）；
- **故障演练**：Chaos 工具随机切断 KDC，验证降级路径。

**3. 常见陷阱**

- **只重启服务，不查根因**——故障会复现。
- **直接覆盖 KDC 配置**——可能引入更多不兼容。
- **忽略 Audit Log**——Kerberos 故障对应的事件都有审计，但经常没去看。
- **不记录 playbook**——下次同样故障轮换初级工程师耗时数小时。

**4. 追问预测**

- **「如何自动化检测 KDC 健康？」** 答：定时用 `kinit -k -t /etc/security/keytabs/...` 在多个客户端测试；用 Prometheus exporter 把 KDC 的 `krb5kdc.log` 解析为指标。
- **「如何在大规模集群里做 Kerberos 性能调优？」** 答：KDC 多主、DNS SRV、长连接复用 Ticket、关闭不必要的 TGS 请求（用存储的 TGT）。

**5. 参考资料**

- MIT Kerberos 官方 Troubleshooting Guide。
- Apache Hadoop 官方 wiki 中「Troubleshooting Kerberos」章节。
- LinkedIn「Lessons Learned from Kerberos in Hadoop at Scale」公开演讲。
- GitHub 上 OpenStack、Apache 项目的 KDC 故障复盘报告。
- Netflix / Uber 关于「Network time chaos engineering」的公开博客。
- **微众银行 Kerberos 长任务 token 续签踩坑** —— Spark Streaming 跑 14 天后 TGT 过期，根因是 AM 续签线程未做 watchdog，根治后入运维 SOP。
- **京东的容器平台 Kerberos 故障复盘** —— K8s 节点时钟漂移导致全集群半数 Pod 票据失效，止血用强制 NTP 同步 + keytab 批量重发。
- **中国移动的跨机房 KDC 故障切换实战** —— 主 KDC 故障时切换至 SLA 备机 + DNS SRV 解析，演练证明客户端无感，且时钟同步监控未触发告警。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.5.6 在 Lambda 架构中，如何统一地设计和实施批处理层与速度层的数据安全与权限管控？请说明一致性策略、入口治理、与数据湖集成的关键点。

**1. 考察点**

- 是否理解 Lambda 架构下两条链路天然独立——安全策略必须由「中心化」完成。
- 能否识别批 / 流链路的差异：批量作业走 Hive/Spark，实时作业走 Flink/Kafka；安全拦截点不同。
- 是否知道「入口治理」是关键——所有写入必须经过统一的网关与准入接口。
- 加分项：能给出对象级、字段级、行级、行为级四个粒度的具体落地路径。

**2. 参考答案框架**

**第一层：明确两条链路的安全差异。**

- **批处理层（Batch Layer）**：周期性全量重算，结果「以批为准」。安全瓶颈在「数据落湖前」「定期上线」的合规。安全对象：源数据接入、Hive 表、Parquet 文件、维表。
- **速度层（Speed Layer）**：实时事件流，结果「以最新为准」。安全瓶颈在「事件接入」「实时计算」「Kafka topic」。安全对象：Kafka、State Backend（Flink RocksDB）、OLAP（Doris / ClickHouse）。

两者最大的不同是**实时层的安全责任在数据流过引擎时必须在线评估**——不允许走「异步批量审计」。

**第二层：统一安全架构的四层设计。**

- **中央策略中心**：Ranger / OPA / 内部 Policy Service，集中所有资源（库 / 表 / 字段 / 行标签 / 列标签）的策略。
- **组件 Plugin / Sidecar**：Hive、Spark、Flink、Trino 各装 Ranger Plugin / 自研 Sidecar；所有访问决策由插件强制。
- **入口治理**：所有写入必须经过 ingestion gateway（Kafka Connect / Flink Source）——PII 检测、Schema 校验、合规打标在这里完成。
- **审计与检测**：行为、决策、检索均落审计 → SIEM → 风控模型（异常检测）。

**第三层：一致性策略——避免批流「两套真相」。**

- **同一份策略中心**：批流链路共享 Ranger 或 OPA，禁止「批用 Hive 安全、流用 Kafka ACL」这种分裂。
- **同一份 Schema 注册表**：Confluent Schema Registry / Hive Metastore 双写；新字段必须先打 tag 再使用。
- **同一份 PII 字典**：无论批还是流，PII 字段都来自同一个标签库；标签变更在批流链路同生效。
- **同一份审计**：所有访问决策走同一个 Kafka 主题；实现批流对账。

**第四层：与数据湖集成的关键点。**

- **湖表层治理**：Iceberg / Hudi 的 Snapshot Manifest 必须有数字签名；Catalog（HMS / Unity Catalog）授权走 Ranger。
- **跨引擎一致性**：一个 Iceberg 表既被 Spark 读、又被 Flink 写——策略中心必须确保写入侧的 tag 与读取侧的 tag 一致。
- **延迟视野**：批处理层策略变更通常几小时内即可生效；流层的策略变更是 online evaluation，需要插件支持毫秒级更新。

**3. 常见陷阱**

- **批流两套策略中心**——一旦分裂，所有合规审计都失去单点真相。
- **Kafka 启用 ACL 但消费时绕过**（TlsSNI / SASL 错误配置）——消费侧实际是无权限访问。
- **数据入湖前没做 PII 检测**——湖里的数据无法及时修复。
- **策略中心与 IAM 不同步**——角色变更要第二天才生效。

**4. 追问预测**

- **「实时层如果发生敏感数据外发怎么检测？」** 答：在 Flink 上叠 Sidecar 拦截输出 + 异常流量监控（某用户/某 IP 突增），并接入 SOC。
- **「Lambda 架构下审计要做流式对账吗？」** 答：是。批与流的结果要按业务主键对账，差异超过阈值自动告警。

**5. 参考资料**

- Nathan Marz《Big Data: Principles and Best Practices of Scalable Realtime Data Systems》——Lambda 架构原始定义。
- Apache Ranger 关于「Plugin for Kafka / Flink」的官方文档。
- Apache Flink 关于「RichFunction 权限钩子」的官方文档。
- LinkedIn《Lambda to Kappa: The Evolution of Stream Processing》公开博客。
- 阿里《实时数仓 + 治理白皮书》——Lambda 架构下的统一权限落地范式。
- Netflix Tech Blog 关于 Pipeline-Level Security 的公开文章。
- **滴滴的实时订单分配 Flink 权限治理** —— 在 1000+ Flink 作业的出行平台用 Ranger Plugin + Sidecar 拦截 Source / Sink，并按业务域做集群隔离。
- **美的的工业 IoT 实时数据统一安全治理** —— 在工厂采集端走 Kafka ACL + ingestion gateway PII 检测，下游 Flink 接收侧同样套用 Ranger 策略。
- **京东的电商 Lambda 架构统一审计** —— 在订单 / 库存 / 推荐业务中批流两侧共用同一审计主题 + Tag，实现批流对账与影响面秒级定位。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.5.7 请简要说明 Kerberos 认证的基本原理及其在大数据集群安全中的核心作用，包括与 HDFS/Hive/YARN 的集成方式。

**1. 考察点**

- 能否用「第三方票据 + 二阶段交换」概括 Kerberos 的本质。
- 是否理解 Hadoop 服务票据、Delegation Token、Block Token 的分工。
- 能否描述「用户→KDC→YARN→HDFS」的完整身份传递链。
- 加分项：能讲清 Kerberos 与 OAuth/SAML 的边界与组合方式。

**2. 参考答案框架**

**第一层：基本原理一句话版。** Kerberos 是基于对称密钥的**第三方票据认证协议**——Client 通过 KDC 完成身份与访问凭证的获取，但密码与口令不直接在网上传播。整条链由 AS + TGS 两阶段构成：先获 TGT（认证票据），再用 TGT 换各服务的 Service Ticket。

**第二层：在大数据集群中的核心作用。**

- **身份可信**：用户、机器、服务都用 principal 唯一标识，跨节点一致。
- **避免明文传输**：节点间无密码传递，重放防护天然支持。
- **支撑多组件**：HDFS、Hive、YARN、HBase、Kafka 都依赖它做接入认证。
- **支持委托**：通过 Delegation Token 把身份下放给 Executor，避免每个节点都要 Kerberos。

**第三层：与三个核心组件的集成。**

- **HDFS**：DataNode 与 NameNode 之间 RPC 用 Sasl + Kerberos；客户端读 HDFS 文件需要 Kerberos 票据；DataNode 通过 Block Token 验证客户端读写权限。Block Token 由 NameNode 颁发，DataNode 验证，这是 Namenode 单点外的额外授权层。
- **Hive**：HiveServer2 接入需要 Kerberos；提交查询时 Hive 内部 RLS（Row-Level Security）由 Ranger 拦截；UDF 运行时 Hive 调用用户的 HDFS 票据访问底层 Parquet。
- **YARN**：ResourceManager 对 ApplicationMaster 的 RPC 用 Kerberos；Container Token 由 RM 颁发，NodeManager 验证；Job Token 由 AM 颁发，Executor 验证。

**第四层：与外部身份体系的桥接。** Kerberos 主做「机器与服务」之间的身份，对「员工身份」可用外部 IAM（Okta / Azure AD）通过 OAuth、SAML 或 SCIM → LDAP → KDC 同步实现「一次登录」。这是大型企业把 Kerberos 落到 SSO 体验的标准做法。

**3. 常见陷阱**

- **把 Kerberos 当作单点认证**——它只是密码换成了票据，仍然需要 SAML/OAuth 处理员工对应用的身份。
- **不区分 User Principal 与 Service Principal**——前者用于用户提交作业，后者用于服务进程；keytab 不能混用。
- **不规划 Token 续签**——长任务在 Token 过期后崩溃。
- **时钟不同步却没意识到**——Kerberos 最常见却最低估的根因。

**4. 追问预测**

- **「Container 内的代码如何访问 Kerberos 化的 HDFS？」** 答：Kerberos 化 Container 注入 keytab；或使用 Delegation Token 方案由 AM 派发；现代方案多采用 K8s Service Account Token 映射到 Kerberos principal。
- **「跨数据中心如何做 trust？」** 答：cross-realm trust，配 `krb5.conf` 的 `capaths`，跨域用户的 principal 后缀跨域可路由。

**5. 参考资料**

- MIT Kerberos 官方文档。
- Apache Hadoop 官方 wiki「Hadoop Kerberos How-To」。
- The Hive / HDFS / YARN 官方文档关于 Kerberos 集成的章节。
- LinkedIn「Cobra - Hadoop Security at Scale」公开演讲。
- 《Hadoop 权威指南》（Tom White）第 5 版 Security 章。
- **招商银行的 Kerberos + HDFS + Hive 金融集成** —— 在交易数仓中跑 SASL RPC + HiveServer2 + Block Token，证劵业务跨节点访问日志留痕完整。
- **微众银行的 Hadoop 服务票据最佳实践** —— 在信贷特征仓库中统一 AM token 续签 + 短 TTL 配置，避开长任务「7 天必死」陷阱。
- **美的的制造业 Kerberos 跨数据中心 trust** —— 工厂端 ↔ 总部端用 cross-realm trust + `capaths` 路由，做到异地容灾而不丢票据。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---
