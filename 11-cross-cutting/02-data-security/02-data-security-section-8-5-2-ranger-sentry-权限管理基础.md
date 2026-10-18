> 本文件是 **02-data-security.md** § 8 面试真题集的子主题。完整章节请回到 [index](02-data-security.md) 或 [§ 8 索引](02-data-security-section-8-sec8.md)。

### 8.4 §5.2 Ranger / Sentry 权限管理基础

> 本主题覆盖 Apache Ranger 与 Apache Sentry 的基本定位、策略模型、金融场景选型与 Hive 实现机制差异。面试官通常从"Ranger / Sentry 怎么选"切入，下钻到策略表达力与组件覆盖度。

#### §5.2.1 请简要说明 Ranger 和 Sentry 在大数据平台权限管理中的基本定位和主要功能是什么？

**1. 考察点**

- 是否理解 Ranger 是**框架 / 平台**，Sentry 是**工具**——这是两者最本质的差异。
- 能否说清 Ranger 的"插件式架构"和 Sentry 的"绑定 HMS"在产品形态上的区别。
- 是否知道两者各自的组件覆盖度差异（Ranger 20+ 组件，Sentry 4-5 个）。
- 加分项：能讲清社区活跃度对比与历史演进。

**2. 参考答案框架**

**第一层：基本定位。**

- **Apache Ranger**：诞生于 2014 年的 Hortonworks（被 Cloudera 合并前），定位为**统一安全框架**。核心特征是插件式架构（Ranger Admin + 各组件 Plugin），支持 20+ 大数据组件，提供集中式策略管理 + 细粒度授权（表 / 列 / 行 / 标签）+ 集中审计。
- **Apache Sentry**：诞生于 2013 年的 Cloudera，定位为**轻量级权限工具**。最初只服务 Hive，逐步扩展到 Impala / HDFS / Kafka。模型简单、绑定 Hive Metastore，社区已并入 Apache Attic 维护模式（仅修 bug，无新功能）。

**第二层：核心功能对比。**

| 维度 | Ranger | Sentry |
| --- | --- | --- |
| 架构 | Admin + Plugins | 嵌入式（绑定 HMS） |
| 组件覆盖 | 20+（Hive/HDFS/HBase/Kafka/YARN/Storm/Trino/Kylin/Atlas/Solr/Knox/NiFi...） | 4-5（Hive/Impala/HDFS/Kafka/Solr） |
| 策略粒度 | Database / Table / Column / Row / Tag | Database / Table / Column / URI |
| 动态脱敏 | 支持（Data Mask） | 不支持 |
| 行级过滤 | 支持（Row Filter） | 不支持 |
| 标签驱动策略 | 支持（Tag-Based Policy） | 不支持 |
| 策略生效方式 | 热加载（30s） | 冷加载（重启 HS2） |
| 审计 | 内置审计 + Kafka/Solr 输出 | 无独立审计（仅 deny 日志） |
| ABAC 支持 | 条件表达式（IP / 时间 / 标签） | 仅角色 |
| 社区活跃度 | 高（月度 commit；star 数可在 GitHub 的 apache/ranger 仓库直接查看，该数字随时间变动，此处不锁定具体值） | 低（Apache Attic 维护模式） |
| 商业支持 | Cloudera CDH/HDP 均默认 | Cloudera CDH 部分场景 |

**第三层：历史演进。** 2013 年 Cloudera 开源 Sentry；2014 年 Hortonworks（HDP）推出 Ranger——Sentry 起步更早。2018 年宣布、2019 年初完成的 Cloudera / Hortonworks 合并后，Cloudera 把 Ranger 作为统一权限方向；Sentry 维护但停止大改。2020 年后 Ranger 已成为新平台的事实标准。

**第四层：工业案例。** 阿里云 EMR 默认 Ranger 提供统一权限；腾讯云 TBDS、美团数据安全网关均基于 Ranger；AWS EMR 也支持 Ranger 集成。Cloudera CDH 在 6.x 之后同时支持 Ranger / Sentry（默认 Ranger）；DataBricks Unity Catalog 在产品形态上借鉴 Ranger 的"多组件策略中心"思想。Snowflake / BigQuery 的 RBAC 是云数仓自研的等价方案。

**3. 常见陷阱**

- **以为"两个差不多"。** Ranger 与 Sentry 在策略表达力上有数量级差距——动态脱敏、行级过滤、标签策略是 Sentry 完全没有的能力。
- **忽视社区。** Sentry 已入 Apache Attic，新项目选 Sentry 等于选了"无主代码"。
- **混淆"权限工具"与"安全框架"。** Sentry 只解决权限，Ranger 同时解决权限 + 审计 + 标签联动 + 脱敏。

**4. 追问预测**

- **「新项目应该选哪个？」** 答：默认 Ranger。Sentry 仅在"只用 Hive + 团队小 + 追求简单"的特殊场景下考虑。
- **「能不能 Ranger 和 Sentry 并存？」** 答：技术上可以（Cloudera CDH 支持），但不建议——策略分裂、审计割裂、用户认知负担。

**5. 参考资料**

- Apache Ranger 官方文档——Ranger 架构与功能的最权威说明。
- Apache Sentry 官方文档——Sentry 模型与组件支持范围。
- Cloudera 公开文档中关于"CDH Security: Ranger vs Sentry"的章节——两家厂商合并后的统一方向。
- Hortonworks（2014）发布 Ranger 的原始技术博客——Ranger 设计的初衷与演进。
- 《大数据之路：阿里巴巴大数据实践》中关于统一权限章节——国内头部厂商选型 Ranger 的工程依据。

> 注：以上参考资料分两类读——第一类是给出了可检索题名的条目（官方文档及其章节名、书名、论文名、标准编号等），可按该题名在对应文档或出版物中自行检索核验（本节未附精确链接）；
> 第二类是未给出题名的条目（企业名 + 实践描述、企业公开技术博客、公开文章、公开分享，含其中的规模量级如 PB 级），一律按【经验】档理解（以量级与方向读，不当作可引用的单点数字），引用时请自行查证；
> 本题正文各层中同样未附文档名的公司断言，与第二类同办，不因其未被逐条列举而当作可引用事实。

---

#### §5.2.2 请描述 Ranger 的权限策略模型，并解释策略中通常包含哪些关键元素？

**1. 考察点**

- 是否理解 Ranger 策略模型的**三维结构**：Service × Resource × Policy Items。
- 能否说清 Access Types、Conditions、Data Mask、Row Filter 这四个核心字段。
- 是否知道 Tag-Based Policy 是 Ranger 相对传统 RBAC 的最大优势。
- 加分项：能讲清 deny policy / audit policy / exception policy 的边界。

**2. 参考答案框架**

**第一层：策略模型的总体结构。** 一条 Ranger Policy 由三个维度构成：**Service**（作用在哪个组件，如 Hive / HDFS / HBase / Kafka）× **Resource**（作用在哪个资源，如 db / table / column / path / topic）× **Policy Items**（谁能做什么，含 Users / Groups / Roles + Permissions + Conditions）。

**第二层：关键元素。**

- **Service**：策略作用的组件。每个 Service 有独立插件。
- **Resource**：策略作用的资源。Ranger 用层级表达，如 Hive 的 `{ database, table, column }`、HDFS 的 `{ path }`、Kafka 的 `{ topic }`。
- **Policy Items**：访问规则；包含：
  - **Users / Groups / Roles**：授权对象。
  - **Access Types**：操作类型，如 `select` / `update` / `create` / `drop` / `alter` / `all`。
  - **Conditions**：条件表达式，支持 `tag` / `ip` / `time-of-day` / `day-of-week` / `expression`（自写表达式）。
  - **Data Mask**：列级脱敏策略（如 `MASK_SHOW_LAST_4` / `MASK_HASH` / `CUSTOM`）。
  - **Row Filter**：行级过滤（如 `WHERE region='east'`）。
- **Audit**：是否记录该策略命中的审计日志。
- **Deny Exceptions**：黑名单——在 allow 策略基础上排除特定用户/组/条件。

**第三层：Tag-Based Policy。** 这是 Ranger 最有特色的能力：标签从 Atlas / DataHub 同步进来，策略直接消费标签——"所有 `PII` 标签字段都对 `data_analyst` 角色 MASK"。这让"分类分级 → 自动授权"成为可能，是规模化权限管理的关键。

**第四层：策略评估流程。** 用户操作 → 组件（HS2 / NN / HBASE Master）拦截 → Ranger Plugin 查本地缓存（30s 内）→ 命中返回 allow/deny → 推审计 → 更新缓存（异步）。

**第五层：工业实践。** Uber 在其数据平台用 Ranger + tag-based policy 管理海量字段标签的权限（本节未附该说法的链接，标签规模与字段量级按【经验】档理解，引用时请自行查证）——"分析师只能看自己部门标签的 PII" 是一条策略覆盖所有表的同类场景。阿里云 EMR 的数据安全中心把 Ranger 策略与阿里内部数据治理平台打通。Databricks Unity Catalog 的 Row Access Policy + Column Masking 在产品形态上对应 Ranger 的 Data Mask + Row Filter。

**3. 常见陷阱**

- **混淆 Resource 层级与 Policy Items 范围。** Resource 是"作用在哪个层级"（database / table / column），Policy Items 是"谁能在这个层级做什么"。
- **以为 Conditions 只是"装饰"。** Conditions 是 ABAC 的入口，丢掉 Conditions 就退化成纯 RBAC。
- **不用 Tag-Based Policy。** 手动维护每张表的策略 = 必然失败，必须用标签自动化。

**4. 追问预测**

- **「100 万条策略性能怎么样？」** 答：Ranger Admin 负责分发，Plugin 缓存策略；评估在本地毫秒级完成。瓶颈在 Admin 的策略同步网络，不在评估本身。
- **「Tag-Based Policy 的标签从哪来？」** 答：从元数据系统（Atlas / DataHub / Unity Catalog）通过 Kafka 推送过来；标签本身需要分类分级流程。

**5. 参考资料**

- Apache Ranger 官方文档中关于 Policy Model 的章节——策略三维结构的权威说明。
- Apache Ranger 官方文档中关于 Tag-Based Policy 的章节——标签驱动策略的设计原理。
- Uber Engineering 关于"大规模 Ranger 部署与标签集成"的公开文章——头部出行公司用 tag-based policy 的工业实证。
- Databricks Unity Catalog 官方文档中关于 Row Access Policy 与 Column Masking 的章节——商业产品对 Ranger 模型的等价实现。

> 注：以上参考资料分两类读——第一类是给出了可检索题名的条目（官方文档及其章节名、书名、论文名、标准编号等），可按该题名在对应文档或出版物中自行检索核验（本节未附精确链接）；
> 第二类是未给出题名的条目（企业名 + 实践描述、企业公开技术博客、公开文章、公开分享，含其中的规模量级如 PB 级），一律按【经验】档理解（以量级与方向读，不当作可引用的单点数字），引用时请自行查证；
> 本题正文各层中同样未附文档名的公司断言，与第二类同办，不因其未被逐条列举而当作可引用事实。

---

#### §5.2.3 假设你正在为一个大型金融企业设计大数据平台权限体系，需要在 Ranger 和 Sentry 之间做出选型，请说明你的决策依据和方案设计。

**1. 考察点**

- 是否具备**金融场景的合规直觉**——金融场景对审计、细粒度、跨组件有强需求。
- 能否在"业务诉求 → 候选方案 → 选型依据"三层结构上清晰作答。
- 是否知道金融场景特有的约束：等保 / 银保监 / 数据本地化 / 跨境传输。
- 加分项：能给出具体的方案架构（不只是选型，而是落地路径）。

**2. 参考答案框架**

**第一层：业务诉求拆解。** 金融大数据平台的权限诉求通常包括：① 多组件（Hive / HDFS / Kafka / HBase / Kudu / Spark）；② 细粒度（客户级别的列脱敏 + 行级隔离）；③ 强审计（满足等保 + 银保监 + 个保法）；④ 高可用（7×24）；⑤ 与现有 IAM（通常是企业 AD / LDAP）打通。

**第二层：选型依据。** Ranger 在每一项都比 Sentry 强：① 组件支持 20+ vs Sentry 4-5；② 支持列脱敏 + 行过滤，Sentry 不支持；③ 内置审计 + 可推 Kafka，Sentry 无独立审计；④ 社区活跃度高、HA 部署成熟；⑤ 支持 LDAP / AD 集成。Sentry 唯一的优势是模型简单，但金融场景的复杂度恰恰把"简单"变成劣势。

**第三层：决策——选 Ranger。** 选型依据可总结为一句话："Ranger 是平台，Sentry 是工具；金融场景要的是平台级能力。"

**第四层：方案架构。**

- **身份层**：企业 AD / LDAP 作为唯一身份源；员工入职即开通。
- **认证层**：Kerberos 启用；SSO + MFA 用于 Web 入口。
- **授权层**：Ranger Admin（高可用双实例）+ Usersync（从 AD 同步）+ Tagsync（从 Atlas 同步标签）。
- **加密层**：KMS（HashiCorp Vault 或云厂商 KMS）+ HSM 保护根密钥；BYOK 支持。
- **审计层**：Ranger Audit → Kafka → 数据湖长期保存（保留 6 个月以上）。
- **策略层**：tag-based policy + 按角色（数据分析师 / 风控建模师 / 业务 BP / 合规审计）分层。

**第五层：工业案例。** 蚂蚁金服在其数据平台上基于 Ranger 做扩展，支持金融特有的"客户级行级隔离 + 字段级脱敏"。招商银行金融大数据平台、平安银行的数据中台均采用 Ranger。Uber 在其金融业务（Uber Money）的数据平台也用 Ranger 做核心权限。LinkedIn 在其"金融服务"类业务中同样选 Ranger（本节未附这两条说法的链接，按【经验】档理解，引用时请自行查证）。

**3. 常见陷阱**

- **只看功能不看生态。** Ranger 选型不仅是功能，还要看 Ops 人才市场、社区支持、招聘——Sentry 找不到运维。
- **忽视高可用。** Ranger Admin 单点部署等于权限系统单点；必须双实例 + keepalived。
- **不做 KMS 集成。** 加密策略没接 KMS，等于纸面合规——加密密钥无人管理。

**4. 追问预测**

- **「金融场景怎么落地行级隔离？」** 答：给每行加 `tenant_id` 或 `customer_id` 标签；Ranger Row Filter 注入 `WHERE tenant_id = current_user_tenant()`；标签从统一身份系统同步。
- **「审计日志保留多久？」** 答：金融要求至少 6 个月；建议推到 Kafka → 数据湖长期归档；总成本按 GB/月计费可控。

**5. 参考资料**

- Apache Ranger 官方文档关于金融场景的参考架构——Ranger + Kerberos + KMS + Audit 的标准组合。
- Cloudera 公开文档中关于"金融行业 CDH 安全参考架构"的章节——CDH 在金融场景的最佳实践。
- 阿里 / 蚂蚁金服公开分享中关于金融数据安全的内容——国内头部金融科技公司的合规架构。
- HashiCorp Vault 官方文档中关于 KMS + HSM 的章节——金融级密钥管理的标准做法。

> 注：以上参考资料分两类读——第一类是给出了可检索题名的条目（官方文档及其章节名、书名、论文名、标准编号等），可按该题名在对应文档或出版物中自行检索核验（本节未附精确链接）；
> 第二类是未给出题名的条目（企业名 + 实践描述、企业公开技术博客、公开文章、公开分享，含其中的规模量级如 PB 级），一律按【经验】档理解（以量级与方向读，不当作可引用的单点数字），引用时请自行查证；
> 本题正文各层中同样未附文档名的公司断言，与第二类同办，不因其未被逐条列举而当作可引用事实。

---

#### §5.2.4 在 Hadoop 生态系统中，Ranger 和 Sentry 都支持对 Hive 进行权限控制，请阐述两者在实现机制和功能特性上的主要差异。

**1. 考察点**

- 是否能从**实现层**说清差异：Plugin 拦截 vs HMS 绑定。
- 能否说清策略表达力差异（动态脱敏 / 行级过滤）。
- 是否知道策略生效方式的差异（热加载 vs 冷加载）。
- 加分项：能讲清性能权衡（Ranger Plugin 判定在本地缓存完成、缓存未命中才多一次到 Ranger Admin 的 RPC vs Sentry 的策略存在自身服务里、HS2 启动时加载到内存，判定不产生额外 RPC——它绕开的正是 HMS 这条路径）。

**2. 参考答案框架**

**第一层：实现机制差异。**

- **Ranger**：通过 Hive Plugin 嵌入 HiveServer2；策略存在 Ranger Admin（MySQL/Postgres）；Plugin 启动时拉策略，热加载（30 秒内生效）；SQL 编译阶段评估策略；支持列脱敏、行过滤、tag-based policy。
- **Sentry**：通过 Sentry Binding 嵌入 HiveServer2；策略存在 Sentry 服务（也用 MySQL）；Hive 启动时读策略，冷加载（重启 HiveServer2 生效）；Hive Hook 在 SQL 执行阶段拦截；只支持表 / 列级权限。

**第二层：功能特性差异。**

| 维度 | Ranger | Sentry |
| --- | --- | --- |
| 列级权限 | 支持 | 支持 |
| 行级过滤（WHERE 注入） | 支持 | 不支持 |
| 动态脱敏（Data Mask） | 支持（多种 mask 函数 + 自定义） | 不支持 |
| Tag-Based Policy | 支持 | 不支持 |
| Conditions（IP / 时间 / 标签） | 支持 | 不支持 |
| 策略热加载 | 支持（30 秒） | 不支持（重启 HS2） |
| 审计 | 完整审计（allow / deny） | 无独立审计（仅 deny 日志） |
| 跨服务一致策略 | 支持（同一 admin 管多组件） | 不支持（每服务独立） |

**第三层：性能与一致性权衡。**

- **Ranger**：每次 SQL 评估由 Plugin 在本地缓存里判定，**未命中才多一次到 Ranger Admin 的 RPC**（评估本身不产生 RPC）；策略更新即时生效；但依赖 Ranger Admin 可用性。
- **Sentry**：策略在 HiveServer2 启动时加载到内存；无 RPC 开销（内存判）；但策略更新必须重启 HS2 才能生效。

**第四层：典型迁移路径。** Cloudera CDH 5.x 时代默认 Sentry；CDH 6.x 后转向 Ranger；很多老客户正在做 Sentry → Ranger 迁移。迁移的难点不是数据（策略可以重新导入），而是组织——团队需要重新培训 Ranger 的概念。

**第五层：工业案例。** Uber 在其 Hive 平台上完成了从 Sentry 到 Ranger 的迁移，公开分享中提到迁移的最大收益是"动态脱敏 + 行级过滤"（本节未附该说法的链接，收益排序按【经验】档理解，引用时请自行查证）——这两个能力让金融级场景成为可能。LinkedIn 在其 Espresso 数据平台用 Ranger 做 Hive 权限。阿里云 EMR 用 Ranger 做 Hive 权限的列脱敏。

**3. 常见陷阱**

- **只看授权不看审计。** Sentry 的 deny 审计不够，Ranger 的全量审计（allow / deny）才能支撑事后追溯。
- **以为"功能差不多"。** 动态脱敏 + 行级过滤是质变差距，不是 1+1=2。
- **冷加载被低估。** Sentry 的"重启 HS2 才生效"在生产意味着策略更新必须发版，影响发布节奏。

**4. 追问预测**

- **「Ranger 的 SQL 注入在哪里发生？」** 答：Hive Plugin 在 Hive 的 SemanticAnalyzer 阶段注入条件（Row Filter）和列表达式（Data Mask），物理执行阶段用户无感。
- **「列脱敏函数有哪些？」** 答：`MASK`（全遮）、`MASK_SHOW_FIRST_4`、`MASK_SHOW_LAST_4`、`MASK_HASH`、`MASK_NULL`、`MASK_DATE_SHOW_YEAR`、`CUSTOM`（自写表达式）。

**5. 参考资料**

- Apache Ranger 官方文档中关于 Hive Plugin 的章节——Hive 权限的实现细节。
- Apache Sentry 官方文档中关于 Hive 集成章节——Sentry 在 Hive 上的实现细节。
- Uber Engineering 关于 Sentry 到 Ranger 迁移的公开分享——头部出行公司的迁移实战。
- Cloudera 公开文档中关于 CDH 6.x 安全架构升级的章节——Sentry 向 Ranger 过渡的官方说明。

> 注：以上参考资料分两类读——第一类是给出了可检索题名的条目（官方文档及其章节名、书名、论文名、标准编号等），可按该题名在对应文档或出版物中自行检索核验（本节未附精确链接）；
> 第二类是未给出题名的条目（企业名 + 实践描述、企业公开技术博客、公开文章、公开分享，含其中的规模量级如 PB 级），一律按【经验】档理解（以量级与方向读，不当作可引用的单点数字），引用时请自行查证；
> 本题正文各层中同样未附文档名的公司断言，与第二类同办，不因其未被逐条列举而当作可引用事实。

---
