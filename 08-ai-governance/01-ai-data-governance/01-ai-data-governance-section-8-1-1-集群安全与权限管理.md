> 本文件是 **01-ai-data-governance.md** § 8 面试真题集的子主题。完整章节请回到 [index](01-ai-data-governance.md) 或 [§ 8 索引](01-ai-data-governance-section-8-sec8.md)。

### 8.2 §1.1 集群安全与权限管理

> 本主题考察「数据平台安全的最基础一层」：身份认证、访问授权、统一策略，与传统数仓相比，数据湖引入了半结构化、跨引擎的新治理对象。面试官通常从统一策略的边界切入，再下钻到具体组件（Ranger / Sentry / IAM）的取舍。

#### §1.1.1 请描述在数据湖架构下，如何实现数据生命周期内的统一安全策略（包括数据脱敏、加密、访问控制、审计），并说明其与传统数仓安全治理的差异。

**1. 考察点**

- 是否理解「数据生命周期」在数据湖里被拉伸——采集 → 存储 → 处理 → 服务 → 退役，每一段都有不同的安全策略语义。
- 能否说清策略**集中化、决策分布化**的统一架构（即 Central Policy + Edge Enforcement）。
- 是否知道湖上特有的安全挑战：Schema-on-Read 导致列权限难生效、对象存储不像 HDFS 有 POSIX、跨引擎（Spark / Flink / Trino）需要同一份策略可执行。
- 加分项：能给出 LakeFormation / Unity Catalog / Apache Ranger 这类业界参考实现的关键差异。

**2. 参考答案框架**

**第一层：先定义边界——数据湖的安全对象比数仓更宽。** 数仓的资产边界是「已建模的表 + 字段」，数据进入 DWD 即冻结 schema；数据湖的资产边界横跨**原始对象（Parquet/ORC/JSON 文件） + 元数据表（Iceberg/Hudi 元数据） + 计算中间产物**。这要求安全策略必须覆盖**对象层、元数据层、查询层**三层，并在每一层都有强制点。

**第二层：策略分层与执行点。** 健康的数据湖安全架构通常分四层：

- **策略中心（Policy Center）**：策略的「唯一事实来源」。负责角色 → 资源 → 操作的规则定义，对接 IAM / HR 系统同步身份。代表：Apache Ranger Admin、AWS Lake Formation Permissions、Databricks Unity Catalog。
- **存储层强制（Storage Enforcement）**：对象存储侧做桶级/路径级访问控制（IAM 角色 + Bucket Policy），并叠加服务端加密（SSE-KMS）与客户端加密。代表：S3 SSE-KMS、HDFS Transparent Encryption。
- **查询/计算层强制（Query Enforcement）**：所有引擎入口处统一拦截 SQL，套用策略。代表：HiveServer2 插件、Presto/Trino 的 Access Control、Spark 的 ACL Controller。
- **审计层（Audit）**：每次访问、决策、查询落日志，送往 SIEM（Splunk / ELK / OpenSearch）做实时关联与异常检测。

**第三层：脱敏与加密的「两种贴法」。**

- **静态脱敏**：在数据入湖或出仓给消费方时改写。适用 PII 字段、跨组织共享。代表方案：Apache Ranger 的 Masking、Collibra 的 Policy Enforcement。需要**逆向审视**：脱敏会破坏分析与建模，因此推荐**视图化脱敏**——原始数据不动，下游访问走视图，权限决定是否脱敏。
- **动态脱敏**：在读取路径实时改写。对模型/特征工程更友好，代价是每次读都有 CPU 开销。
- **加密**：TDE（Transparent Data Encryption）+ KMS 静态加密是基础；查询结果给到消费方时应叠加**字段级加密**或**安全多方（Secure Multi-Party）**。Uber 在《DataPlatform 中的 PII 控制》提到把 PII 加密字段拆出独立列，并在 Hive/Spark 上用 UDF 解密。

**第四层：与传统数仓的差异。**

- **对象可变性**：数仓表在 Hive 里是分区的、不可变；数据湖里的 Iceberg/Hudi 表本身支持 MERGE / DELETE，**写动作也需要审计**。
- **跨引擎一致性**：数仓主要跑 Hive，数据湖通常同时跑 Spark / Flink / Trino / Presto，每个引擎各自有权限点——这是「策略能否真正落地」的最大隐患。健康做法是**让所有引擎通过同一个策略中心**做决策，而不是各引擎各管一摊。
- **多租户**：数仓的多租户靠 Hive Metastore Namespace；数据湖靠 Bucket / Catalog / Database 三段式，多了一层对象存储隔离。

**3. 常见陷阱**

- **只在 Spark / Hive 入口做权限控制，忽略对象存储侧。** 这是数据湖上最常见的漏洞——Spark 挡住了，但拿到 IAM 凭证的人直接从 S3 读，全链路监控不到。
- **脱敏覆盖不全 PII 字段。** PII 检测要靠 Presidio / 自研 NER 模型，规则覆盖不了「用拼音、谐音、组合字段」绕开。
- **没有策略评审流程。** 策略一旦写进 Ranger 就长期存在，需要做季度 audit 与 owner 复签，否则会变成「几年前的影子规则」。
- **混淆 RBAC 与 ABAC**。仅靠角色远远不够——数据湖常用 ABAC（Attribute-Based Access Control），靠资源标签 + 用户属性 + 环境属性的组合做决策，例如「只有 PII 标签 = 高且用户部门 = 风控且 IP = 内网才允许读」。
- **不做集中审计**。把访问日志散在每个引擎里，事故溯源基本做不了。

**4. 追问预测**

- **「数据湖上的跨引擎权限一致性怎么保？」** 答：让所有引擎**只通过一个插件 / service 拿决策**（Ranger Plugin 模式），不在引擎本地维护策略副本；离线定期对账，发现策略漂移自动告警。
- **「GDPR 删除权在数据湖怎么实现？」** 答：硬删除 Iceberg/Hudi 表的对应行 + 删除 Parquet 文件中的目标对象（Hash 索引定位），并触发下游模型/向量索引的**再训练/再构建**，同时审计删除证据。Netflix 与 LinkedIn 在公开材料中均说明「删除权是分布式系统最难的需求」，通常要建立**用户级 PII 索引**以 O(1) 定位。
- **「审计日志量爆炸怎么办？」** 答：策略评估通过的事件低比例采样，拒绝的事件全量留存；采样命中后再用 Flink/Spark Structured Streaming 实时聚合成 token 维度 / 用户维度的访问画像。

**5. 参考资料**

- Apache Ranger 官方文档——统一策略中心与各组件 Plugin 的设计参考。
- AWS Lake Formation 公开文档——数据湖上 Centralized permissions 的工业范式。
- Databricks Unity Catalog 公开文档——Delta + ML 的统一治理模型，体现「数据 + 模型 + Notebook 同一入口」的新形态。
- 阿里云 Data Lake Formation 公开技术博客——国内对统一权限 + 跨引擎的实践案例。
- LinkedIn Engineering 关于 Compliance Auditing 的公开文章——大规模审计日志与 GDPR 删除权的工程实现。
- **招商银行的湖仓一体统一安全治理** —— 在数据湖上落地 Central Policy + Edge Enforcement 三层模型（对象层 / Catalog 层 / 计算层），跨 Hive/HDFS/S3 统一细粒度授权。
- **平安银行的新一代数据安全中台** —— 把 PII 识别、字段加密、访问审计整合入统一中台，对接信贷、征信等业务实现「默认全脱敏 + 角色透明开放」。
- **微众银行的联邦学习与隐私治理** —— 在跨机构信贷建模中视图化脱敏 + 动态遮蔽 + 安全多方协同，处理 PB 级 PII 数据。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §1.1.2 在万节点规模的 Spark 集群中，如何设计和实施一套基于角色的访问控制（RBAC）方案？请阐述关键组件、与认证体系的集成方式，以及落地的主要挑战。

**1. 考察点**

- 是否具备「万节点 = 系统级问题」的工程直觉——单点组件（KDC / Ranger Admin）必然要做高可用、读写分离与分层。
- 能否说清 Spark 在 Kerberos + LDAP + Ranger 三件套下的**完整鉴权链路**。
- 是否知道 Spark 的特殊性：Driver / Executor / 历史服务器各自的身份与委派（delegation token）。
- 加分项：能给出具体的高可用拓扑参数（KDC 副本数、Ranger Plugin 缓存大小、Token 续签周期）。

**2. 参考答案框架**

**第一层：先建立四层角色模型。** 万节点 Spark 上的 RBAC 不能仅在 Spark 配置里写死，必须先有**组织层身份**：

- **LDAP / Active Directory**：唯一身份源，存用户、组、组织。
- **Kerberos KDC**：身份到 ticket 的发放，机器与服务都用 principal 标识。
- **Ranger / Sentry**：角色 → 资源 → 操作的策略决策点。
- **Spark 提交 / 调度**：YARN 或 K8s 凭 Kerberos ticket 拉起 Spark，提交者身份进入 Application Master。

**第二层：Spark 内的鉴权链路。**

- **Driver 提交时**：使用 `kinit` 或 keytab 拿到 TGT，向 KDC 申请 Spark 的 service ticket（`yarn/<host>@REALM`）。
- **YARN / K8s 拉起 Application Master**：AM 在内部委派，使用 Hadoop 的 **Delegation Token** 体系（Job Token、File System delegation token、Block token），保证 Executor 不需要每个节点都有 Kerberos keytab。
- **每个 Executor**：使用 AM 派发的 token 访问 HDFS/UDF/YARN Container。Token 有有效期，过期前需要续签。
- **Hive / Spark SQL**：执行 SQL 时由 HiveServer2 / Thrift 触发 Ranger Plugin 评估策略，返回 allow/deny + 列脱敏规则。

**第三层：万节点下的关键挑战。**

- **KDC 单点**：必须部署跨机房 KDC 集群（主从或多主），并在客户端做 DNS SRV 记录指向所有 KDC；最大并发 ticket 请求要预估并扩容，参考 MIT Kerberos 的 CPU 占用经验（万节点下每天数百万次 TGS 请求）。
- **Delegation Token 续签风暴**：长任务执行多天后 token 过期导致整个作业失败。Spark 解决方案是**后台线程长周期续签**，并把续签的代价分摊到所有任务。
- **Ranger Plugin 缓存**：每个 Hive/Spark 节点都装 Ranger Plugin，Agent 模式每 30s 拉一次策略，缓存 30w 条左右；Plugin 不通时要 fail-closed（拒绝而不是放行），避免「KDC 故障全开权限」。
- **审计日志集中**：万节点上每秒数万次访问事件，必须上消息队列（Kafka）→ 流式聚合（Flink）→ 冷热分层存储（ClickHouse + S3）。

**第四层：与 IAM 的集成。** 通常通过 SCIM / 自研 sync 把企业 IdP（Okta / Azure AD / 飞书）推到 LDAP，再用 LDAP 作为 Ranger 的用户源，实现**外部身份 ↔ 集群身份**自动同步。

**3. 常见陷阱**

- **只配 Kerberos 没问题，配 Ranger 就报错**——多半是 Plugin 加载顺序或策略导入后没刷新缓存。
- **KDC 单点部署，宕机导致全集群不可用**。万节点集群必备跨机房 KDC。
- **Audit Log 直接写 HDFS**——高并发下 HDFS 撑不住，必须先落 Kafka。
- **Token 过期忘了配续签，长跑任务在第 7 天挂掉**——这是 HBase / Spark Streaming 长任务的最常见坑。
- **没用专用系统账号跑 Spark，每个用户一个 keytab**——运维灾难，无法轮换密码。

**4. 追问预测**

- **「KDC 集群本身怎么做高可用？」** 答：至少 2 主 + 跨机房；用 kprop 做主从同步；客户端做多 KDC 配置（DNS SRV）；主 KDC 故障从 KDC 自动接管，注意时钟同步（NTP）。
- **「Ranger 策略评估出现性能抖动怎么办？」** 答：把热策略放到 Plugin 本地缓存（默认 30s 拉一次），冷策略用按需加载；对特权大表做列级白名单；评估结果走预计算缓存。
- **「跨域信任（cross-realm）怎么做？」** 答：通过 realm 间 trust relationship + krbtgt/<remote-realm>@<local-realm> 的跨域 ticket 转发；策略上仍以 Ranger 的本地用户为单一来源，跨域身份先映射到本地 principal。

**5. 参考资料**

- Apache Hadoop 官方文档中的 Kerberos 章节——Kerberos + Delegation Token 的权威定义。
- Apache Ranger 官方文档——策略模型与 Plugin 行为。
- LinkedIn 工程团队关于「Cobra: Hadoop Security At Scale」的公开演讲——大规模 Hadoop 安全治理的真实经验。
- Databricks 关于「Secure Cluster Connectivity」的文档——云原生时代取代明文端口的安全模式，是万节点 RBAC 的现代参考。
- **中信证券的大数据集群统一认证** —— 在数仓 + 数据湖混部集群中跑 Kerberos + LDAP + Ranger 三件套，覆盖 30+ 业务条线的工程师自助授权。
- **美的的工业互联网 RBAC 与零信任结合** —— 在 OT 与 IT 融合的工业互联网中以 Ranger 策略 + 设备 Posture Trust 联动，区分工厂端 / 总部端访问边界。
- **京东的大规模 Spark 集群安全运营** —— 万级 Spark 节点上 Ranger Plugin + Audit Log 走 Kafka，并接 SOC 大盘统一告警。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §1.1.3 请阐述 Apache Ranger 在统一权限管理中的核心功能，并说明它是如何实现对 HDFS、Hive、Spark 等多组件的细粒度权限管控的。

**1. 考察点**

- 是否能区分 Ranger 的「策略中心 + 插件拦截」两层架构。
- 能否说清 Ranger 对 HDFS / Hive / Spark / HBase / Kafka / S3 / LakeFS 等组件的统一接入模式。
- 是否了解细粒度的体现维度：库、表、列、行（基于 tag）、行为（select / update / drop）、脱敏规则。
- 加分项：能对比 Ranger 与 Sentry、Lake Formation 的关键差异。

**2. 参考答案框架**

**第一层：Ranger 的两层模型——Admin + Plugin。** Ranger 的核心抽象是一个**「独立于被管控组件的中心化策略服务」**，对接方式是「插件模式」：

- **Ranger Admin**：管理 UI / REST API，提供策略的存储、版本化、审计，并把策略同步给各个组件的 Plugin。底层用 MySQL/Postgres 存策略元数据。
- **Ranger Plugin**：在被管控组件（HiveServer2、HDFS NameNode、Spark 提交点等）的访问入口处嵌入，**周期性地从 Admin 拉取策略缓存到本地**（默认 30s），运行时**拦截并评估**每一次访问请求。
- **Ranger KMS**：可选的密钥管理服务，用于透明加密。

**第二层：策略模型的维度。** Ranger 策略支持五个维度的细粒度：

- **资源**：库、表、列、文件路径、Kafka topic、Tag（基于 Atlas tag）。
- **动作**：select / update / create / drop / alter / all。
- **用户 / 组**：来自 LDAP / 文件系统 / Unix。
- **允许 / 拒绝 / 脱敏（masking） / 行过滤（row-level filter）**。
- **生效条件**：可附加 IP、地理位置、时间窗（IP-based / time-based condition）。

**第三层：组件级落地形态（举 3 个典型组件）。**

- **HDFS**：在 NameNode 处嵌入 Plugin，拦截 RPC；通过 Path-based 策略 + POSIX ACL 实现「按路径授权」，配合 HDFS Transparent Encryption 做加密。
- **Hive**：在 HiveServer2 处嵌入 Plugin，拦截 Driver.compile / executePipeline 阶段；可做到列级 select/update 控制；Masking 通过 Hive UDF 重写 SQL。
- **Spark**：通常通过 HiveServer2 间接生效（提交到 Thrift Server），或在 Spark 自己的 AccessController 钩子处评估；在 Yarn-Cluster 模式下需要借助 **Spark Authorizer** 扩展（Databricks 贡献）。

**第四层：标签驱动的统一治理。** Ranger 与 **Apache Atlas** 集成后，策略可以基于「资源标签」而非「资源路径」。例如：所有标记为 `pii-high` 的表自动应用某一脱敏策略，新增表时**继承**已有标签即生效。这是「策略爆炸」场景的唯一解。

**3. 常见陷阱**

- **Ranger 与 Sentry 混用**——已成历史包袱。Cloudera 路线下 Ranger 占主导，使用 Impala 仍可见 Sentry。
- **只锁 Hive 不锁 HDFS**——Hive 查询拒绝，但拿到 Token 直接读 HDFS 文件仍可读。
- **Masking 用在加密列上**——一旦底层是加密数据，Masking 操作失败；应配合 KMS 决定列级可见性。
- **策略数量无限膨胀**——上万条策略后 Plugin 评估 RT 会显著上升，需要做策略合并（policy compaction）。
- **没有 deny 规则审计**——只允许规则容易，但 deny 规则需要定期审计，避免被绕过。

**4. 追问预测**

- **「Ranger Plugin 缓存失效，Spark 作业会被拒绝吗？」** 答：取决于 Plugin 失效策略的配置——安全模式下应配 fail-closed（拒绝），也可配 fail-open（放行）；生产必须显式定为 fail-closed，绝不推荐 fail-open。
- **「怎么做列级权限与行级权限的组合？」** 答：列级 mask + row-level filter，分别属于两条策略，Ranger 在执行计划中组合应用：filter 在最底层先 reduce 流量，mask 在 select 阶段重写。
- **「Ranger 是否支持对象存储？」** 答：通过 OzoneFS / S3 / ABFS 的 Plugin，支持路径级和前缀级授权；更细粒度依赖对象存储的原生能力（IAM + Bucket Policy）。

**5. 参考资料**

- Apache Ranger 官方文档——核心模型与组件 Plugin 的权威出处。
- Apache Hadoop Security Architecture 相关材料（Hadoop 官方 wiki）——Ranger 在 Hadoop 生态中的位置。
- Cloudera 公开技术材料——商业版（Ranger 集成）的工业实践案例。
- Databricks 关于「Table Access Control」的公开文档——云原生 Spark 时代的访问控制参考。
- **招商银行的 Apache Ranger 细粒度授权实践** —— 在金融交易场景下做到行级 + 列级 + Tag-based 三维度策略组合，覆盖零售、对公、风控多业务。
- **微众银行的 Ranger 标签化权限治理** —— 利用 Ranger + Atlas 的标签联动，把 PII 标记直接复用为权限策略输入，避免策略爆炸。
- **国家电网的电力大数据 Ranger 部署** —— 在调度、营销、运检多域数据湖中用 Ranger Admin + Plugin 统一授权，支撑 PB 级电力数据访问审计。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §1.1.4 面对日益严格的中国数据安全法律法规（如《数据安全法》和《个人信息保护法》），企业大数据平台应如何进行合规改造与落地？

**1. 考察点**

- 是否理解「法律条款 → 技术控制项」的映射方法（GDPR / DSL / PIPL 的关键义务）。
- 能否从「数据分类分级 → 访问控制 → 脱敏 → 审计 → 影响评估 → 个体权利响应」六步给出实操路径。
- 是否知道**数据出境**与**重要数据**两条主线风险。
- 加分项：能给出具体技术方案（如 ROPA 记录、PIPL 影响评估报告的模板）。

**2. 参考答案框架**

**第一层：法律核心义务速览。**

- **《数据安全法》（DSL，2021-09 生效）**：建立数据分类分级保护制度（重要数据特别保护）；数据处理全流程安全；数据出境安全管理。
- **《个人信息保护法》（PIPL，2021-11 生效）**：知情同意、最小必要、敏感信息单独同意、自动决策可拒绝、跨境传输需评估或认证、个人删除权 / 更正权。

**第二层：六步合规改造路径。**

1. **数据资产盘点与分类分级**：执行 GB/T 35273，把字段打上「一般 / 敏感 / 重要」三级标签；PII 字段额外标记 `pii-high/medium/low`；上线 ROPA（Record of Processing Activities）。
2. **PII 检测与脱敏**：用 Presidio / 自研 NER 自动扫描全表，配合 Ranger Masking 做访问时改写。湖北某省级政务平台公开材料描述「按字段级分类分级 + 默认全脱敏 → 按角色透明开放」。
3. **访问控制与最小授权**：基于 RBAC + ABAC（属性标签）；默认拒绝（deny-by-default），按业务理由单独授权；特权账号单独审计。
4. **审计与可追溯**：所有数据访问（人、机器）记录：访问者、时间、资源、操作、依据。审计保留 ≥ 6 个月（敏感场景 ≥ 3 年）。落地：Kafka + ClickHouse + 冷归档。
5. **数据出境合规**：建立「出境清单 + 影响评估 + 标准合同」三件套。出境前过「PIPL 评估」（省级网信办）或通过**国家网信办的数据出境安全评估**；跨国集团常用 **BCR（Binding Corporate Rules）路径**。
6. **个体权利响应**：建立「个人信息请求处理台」——接到删除请求，定位数据存储点（数仓、向量库、备份），删除并保留删除证据。

**第三层：把合规沉淀到平台层。**

- **合规即代码（Compliance-as-Code）**：把 DSL / PIPL 要求写成 OPA 策略、配置项、Checklist，由 CI/CD 在发布时强制检查。
- **预设合规模板**：例如金融机构有「银保监 110 号文」合规模板，教育行业有「未成年人保护」合规模板，平台把它们做成可复用包。
- **第三方审计**：每年外部审计 + 季度内部审计，输出合规报告并向监管报备。

**第四层：常见失败模式与规避。**

- **「备而不改」**：Ranger / OPA 装了，策略空缺——必须做到「存量盘点完成即生效」。
- **审计日志只存不查**：必须接 SOC 与告警，否则等于无审计。
- **跨子公司 / 跨国流转**：不同法域重叠合规义务（如 EU 公司需同时满足 GDPR），需全球一致的策略中心 + 本地化补充。

**3. 常见陷阱**

- **只在生产环境评估，测试环境直接用真数据**。法律不区分环境，测试环境与生产同重。
- **把 PII 仅定义为「身份证号、手机号」，忽略设备指纹、行为序列、Embedding 反演**。
- **出境合规交给法务，技术团队不参与**——技术可行性评估是审批的必要输入。
- **审计日志未做到「留痕不可篡改」**——应做 HMAC 链式签名或写区块链 / WORM 存储。

**4. 追问预测**

- **「怎么证明 PII 数据没被滥用？」** 答：四步——① 用 ROPA 列明用途与法律基础；② 访问日志全留痕；③ 季度合规报告交叉校验；④ 内部红队模拟攻击。
- **「数据出境最常见的失误？」** 答：把数据加密理解为「出境豁免」——只有通过国家网信办的安全评估 / 标准合同 / 认证后才合规；任何技术措施都不能替代法律路径。
- **「怎么应对员工误发 PII？」** 答：建立 DLP（邮件 / 即时通讯 / 上传）+ 端点监测，发现即告警 + 留证；并配套人工审查流程。

**5. 参考资料**

- 中国《数据安全法》《个人信息保护法》《网络安全法》《关键信息基础设施安全保护条例》原文。
- GB/T 35273《信息安全技术个人信息安全规范》、GB/T 38667《信息技术大数据政务数据开放共享》。
- 信通院《数据合规白皮书》——DSL/PIPL 合规落地思路的国内权威材料。
- 阿里云《数据安全白皮书》、字节跳动《数据合规技术实践》——国内大型互联网平台合规实践。
- Microsoft《GDPR for Developers》系列文档——欧洲合规的工程化参考（GDPR 与 PIPL 大量条款类似）。
- **微众银行的 PIPL 落地实践** —— 在信贷场景把「最小必要 + 单独同意」做成统一的同意中心服务，并触发下游模型 / 特征 pipeline 的撤销响应。
- **平安好医生的医疗数据合规体系** —— 在互联网诊疗场景构建 ROPA + 分类分级 + 跨医院数据共享脱敏的端到端合规链。
- **中国移动的数据出境合规标准合同路径** —— 在跨国业务中通过省网信办标准合同 + 出境评估 + 双轨审计，对接 GDPR 双重义务。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §1.1.5 在 Hadoop 集群中，Kerberos 认证的基本流程是什么？请描述其核心交互步骤。

**1. 考察点**

- 是否理解 Kerberos 的三方模型（KDC / Client / Service）与两次票据交换（AS + TGS）。
- 能否说清 Hadoop 服务票据（yarn/host 形式）与 Hadoop **Delegation Token** 的区别。
- 是否知道 Kerberos 在 Hadoop 中的「对象」「行为」对应：HDFS = Block Token，YARN = Job Token，HBase = Authentication Token。
- 加分项：能讲清长任务下的 Token 续签机制。

**2. 参考答案框架**

**第一层：Kerberos 的核心原理。** Kerberos 是一种基于对称密钥的**第三方票据认证协议**，设计目标是「在不安全的网络上证明身份且不传密码」。三方是 **Client、Service、KDC（Key Distribution Center）**，KDC 内部由 AS（Authentication Service）与 TGS（Ticket Granting Service）组成，发布 AS-REP 与 TGS-REP。

**第二层：Hadoop 中的一次完整认证流程（用户提交一个 Spark 作业）。**

1. **用户登录**（`kinit` 或 keytab）：客户端用 principal + 密码（或 keytab）去 KDC 申请 AS-REP，拿到 **TGT（Ticket Granting Ticket）**。TGT 用 KDC 的 master key 加密，Client 不可解读。
2. **请求 Service Ticket**：客户端用 TGT 向 KDC 的 TGS 申请访问具体服务的 Service Ticket（如 `yarn/<nm-host>@REALM`），得到 TGS-REP（包含加密的 session key + 票据）。
3. **访问服务**：客户端把 Service Ticket 发给 YARN / HDFS 的服务端。服务端用自己的 key 解开 session key，与 Client 完成认证。整个过程**密码不经过网络**。
4. **Hadoop 内部的「二次授权」**：Hadoop 服务为了避免每个 Executor 都跑 Kerberos，引入 **Delegation Token**——服务颁发短时的、可续签的内部 token 给 AM，AM 再分发给 Executor。常见类型：`HDFS_DELEGATION_TOKEN`、`YARN_DELEGATION_TOKEN`、`HBASE_TOKEN`。
5. **作业完成或 Token 过期**：由 AM 负责续签或在取消时销毁 token。
6. **审计**：KDC 不做应用层审计，Hadoop 服务自身记录访问，但 Kerberos 仅做身份层。

**第三层：核心组件拓扑。** 万节点集群要求：

- **KDC 集群**：至少 2 主 1 从，跨机房部署，主从用 `kprop` 同步；
- **客户端配置**：`/etc/krb5.conf` 列出 realm + KDC 列表；
- **服务 principal**：每个 NameNode / DataNode / NodeManager 都注册自己的 principal（如 `nn/<hostname>@REALM`），keytab 由运维统一管理；
- **认证插件**：Hadoop 的 `AuthenticationFilter` 是 Web（REST / HUE / Zeppelin）的入口。

**第四层：长任务下的关键设计——续签。** Hadoop 任务往往跑数小时甚至数天，Kerberos TGT 默认 10 小时（可续到 7 天），Delegation Token 默认 7 天。AM 必须用后台线程**周期性续签**，否则在第 8 天整个作业会因 token 失效而失败。

**3. 常见陷阱**

- **KDC 单点**——万节点集群最严重故障源。
- **时钟不同步**——Kerberos 严格要求 ±5 分钟内，所有节点必须 NTP 同步。
- **误用 Service Ticket 当 TGT**——两者不可互替。
- **没有 Token 续签**——长任务的中后期死亡。
- **没给宿主机 / 容器做 principal 注入**——容器时代 Kerberos 集成最痛点，见 8.3 §5.5、8.4 §5.6。

**4. 追问预测**

- **「Kerberos 和 OAuth 2.0 能不能一起用？」** 答：可以，Kerberos 做集群内部服务间认证，OAuth 2.0 / OIDC 做用户到 Application 的外部认证，跨边界时通过 token exchange。
- **「跨数据中心怎么做 Kerberos trust？」** 答：配置跨 realm trust，跨域用户的 principal 后缀指向另一个 realm，配 `krb5.conf` 的 `capaths`。

**5. 参考资料**

- MIT Kerberos 官方文档——Kerberos 协议的权威出处。
- Apache Hadoop 官方 wiki「Secure Hadoop」——Hadoop 服务如何对接 Kerberos 的标准说明。
- 《Hadoop 权威指南》（Tom White）第 4 / 5 版——Hadoop 安全章节的体系化参考。
- 阿里 / 字节公开技术博客——大型集群 Kerberos 部署经验与故障案例。
- Microsoft / Google 关于云上 Kerberos Federation 的公开材料——混合云时代的 Kerberos 演进路径。
- **京东的 Kerberos + Keytab 集中轮换工程实践** —— 大集群下把 keytab 入配置中心统一轮换 + 灰度，并配套告警避免「漏下发」故障。
- **滴滴的容器化 Kerberos 迁移** —— Spark on K8s 场景下用 Init Container `kinit` + Workload Identity 共存，跨节点 / 跨 Pod 续签体系。
- **微众银行的大规模 Kerberos 部署** —— 在风控训练集群中部署跨机房 KDC + DNS SRV 切换，并配套 NTP 严格同步与时钟漂移监控告警。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---
