> 本文件是 **02-data-security.md** § 8 面试真题集的子主题。完整章节请回到 [index](02-data-security.md) 或 [§ 8 索引](02-data-security-section-8-sec8.md)。

### 8.6 §5.4 Ranger 与 Sentry 对比与选型

> 本主题覆盖 Ranger / Sentry 的核心功能、Hive 实现机制、细粒度控制、云原生扩展、混合平台统一权限。面试官从"两者对比"切入，下钻到"未来演进方向"。

#### §5.4.1 请简要说明 Ranger 和 Sentry 在大数据平台中各自的核心功能定位是什么？

**1. 考察点**

- 是否能用一句话讲清两者差异："Ranger 是平台，Sentry 是工具"。
- 能否说清 Sentry 的起源（Cloudera Hive 权限）与 Ranger 的起源（Hortonworks 统一安全）。
- 是否知道两者的历史命运（Cloudera 收购 Hortonworks 后 Ranger 主导）。
- 加分项：能讲清当下是否还有选 Sentry 的合理场景。

**2. 参考答案框架**

**第一层：核心定位对比。**

- **Apache Ranger**：定位为**统一安全框架**（Unified Security Framework）。提供集中策略管理、插件式架构（支持 20+ 组件）、细粒度授权（表 / 列 / 行 / 标签）、集中审计、ABAC 条件。目标是"一套策略管控整个大数据栈"。
- **Apache Sentry**：定位为**轻量级权限工具**（Lightweight Authorization Tool）。最初为 Hive 设计，逐步扩展到 Impala / HDFS / Kafka。模型简单（角色 + 权限），嵌入式（绑定 HMS），不支持行级 / 列脱敏。目标是"给 Hive 加上基本的权限控制"。

**第二层：设计哲学差异。**

- **Ranger**：扩展性优先。引入插件式架构 + 集中式策略 + 标签联动，让"加新组件 / 新场景"成本低。
- **Sentry**：简单性优先。把权限抽象成"role + privilege"两件事，不引入复杂表达力。

**第三层：历史演进与命运。**

- 2013：Cloudera 推出 Sentry。
- 2014：Hortonworks 推出 Ranger。
- 2018：Cloudera 收购 Hortonworks，统一方向走 Ranger。
- 2020+：Sentry 进入 Apache Attic（仅修 bug）；Ranger 成为新平台的事实标准。

**第四层：工业案例。** Cloudera CDH 6.x 后默认 Ranger；阿里云 EMR、腾讯云 TBDS、美团数据安全网关均基于 Ranger；Snowflake / Databricks 自研 RBAC 借鉴 Ranger 模型。Sentry 仅在"老 CDH + 简单 Hive 场景"还有存量用户。

**3. 常见陷阱**

- **混淆"Ranger vs Sentry"与"两种部署模式"。** 它们是两个独立产品，不是同一工具的两种模式。
- **以为 Sentry 还在演进。** Apache Attic 状态意味着新功能停滞，bug fix 也有限。

**4. 追问预测**

- **「Sentry 还能不能用？」** 答：能用，但只适合"只用 Hive + 团队小 + 接受功能受限"的特殊场景。
- **「Ranger 替代品是什么？」** 答：商业的 Immuta、Privacera；云原生的 Lake Formation、Unity Catalog。

**5. 参考资料**

- Apache Ranger 官方文档——Ranger 的核心定位与设计哲学。
- Apache Sentry 官方文档——Sentry 的核心定位与历史。
- Cloudera 公开文档中关于"CDH Security: Ranger vs Sentry"的章节——两家厂商合并后的统一方向。
- Apache Attic 公告中关于 Sentry 的章节——Sentry 进入维护模式的官方说明。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.4.2 在 Hive 表级别的权限控制方面，Ranger 和 Sentry 的实现机制有何主要区别？

**1. 考察点**

- 是否能从**拦截时机 / 评估位置 / 同步机制**三个角度说清差异。
- 能否说清两者的性能权衡（Ranger 缓存本地求值 vs Sentry 内存判；单次评估都不引入 RPC，差异在策略生效时延）。
- 是否知道 Sentry 的"冷加载"代价（重启 HiveServer2 才能生效）。
- 加分项：能讲清 Hive Hook 拦截时机对功能扩展性的影响。

**2. 参考答案框架**

**第一层：拦截时机差异。**

- **Ranger**：在 Hive 的 **SemanticAnalyzer** 阶段拦截 SQL，做权限评估 + 注入行级过滤 + 列脱敏表达式；用户提交 SQL 后立即生效。
- **Sentry**：在 Hive 的 **Execution** 阶段通过 Hive Hook 拦截；权限评估发生在执行前，策略变更需重启 HS2。

**第二层：评估位置差异。**

- **Ranger**：评估发生在各组件的 Plugin（HS2 内的 Ranger Hive Plugin），对本地缓存中的策略副本在插件内求值；单次评估不产生到 Ranger Admin 的 RPC。
- **Sentry**：评估发生在 HS2 启动时加载的 Sentry Binding，直接读内存中的策略副本。

**第三层：同步机制差异。**

- **Ranger**：各 Plugin 按默认 30 秒周期从 Ranger Admin 拉取（pull）策略到本地缓存（即变更默认 30 秒内生效）；Plugin 启动时全量拉。
- **Sentry**：策略变更在 Sentry 服务持久化；HS2 启动时全量拉，重启才生效。

**第四层：性能对比。**

| 维度 | Ranger | Sentry |
| --- | --- | --- |
| 单次评估开销 | 插件内求值 < 1ms（评估不产生 RPC；到 Admin 的 RPC 数 ms 只发生在周期刷新策略时） | 内存判 < 1ms |
| 策略变更延迟 | 30 秒（可调短） | 重启 HS2（分钟级） |
| 集群重启开销 | Plugin 重启 + 重拉策略 | HS2 重启 + 重启 Hive Metastore |

**第五层：工业案例。** Cloudera CDH 在 5.x 时代默认 Sentry，6.x 之后默认 Ranger；很多客户从 Sentry 迁 Ranger 后，反馈最大的是"策略变更不用重启 HS2"。Uber 在迁移分享中明确"热加载是生产刚需"。阿里云 EMR 一开始就选 Ranger，未经历 Sentry 阶段。

**3. 常见陷阱**

- **以为"两者差不多"。** 热加载 vs 冷加载在生产是巨大差异——Sentry 改一条策略要重启整个 HS2。
- **混淆"评估位置"与"同步机制"。** Ranger 是“Plugin 本地评估 + 周期拉取”；Sentry 是“HS2 内存评估 + 启动同步”。

**4. 追问预测**

- **「热加载怎么调短？」** 答：Ranger Admin 的 `policy.cache.dir` 配置；缩短 `policy.download.interval` 到 10 秒（极端可到 1 秒，但广播风暴）。
- **「冷加载怎么办？」** 答：滚动重启 HS2 实例；按负载分批；用蓝绿发布。

**5. 参考资料**

- Apache Ranger 官方文档中关于 Hive Plugin 章节——Ranger 在 Hive 编译阶段的拦截机制。
- Apache Sentry 官方文档中关于 Hive Binding 章节——Sentry 在 Hive 启动时加载的实现细节。
- Cloudera 公开文档中关于 CDH 6.x 安全架构升级——从 Sentry 转向 Ranger 的官方说明。
- Uber Engineering 关于 Sentry → Ranger 迁移的公开分享——头部出行公司的迁移实战。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.4.3 请阐述在支持动态行过滤和列掩码这类细粒度权限控制时，Ranger 相比 Sentry 有哪些技术优势？

**1. 考察点**

- 是否理解**细粒度控制**的真实业务价值（合规 / 共享 / 自助分析）。
- 能否说清 Ranger 的 Row Filter + Data Mask 实现机制。
- 是否知道 Sentry 完全不支持这两类能力的工程后果。
- 加分项：能给出实际案例说明能力差距带来的业务影响。

**2. 参考答案框架**

**第一层：能力差距。** Ranger 与 Sentry 在细粒度控制上有数量级差距：

| 能力 | Ranger | Sentry |
| --- | --- | --- |
| 数据库级权限 | 支持 | 支持 |
| 表级权限 | 支持 | 支持 |
| 列级权限 | 支持 | 支持 |
| **行级过滤（Row Filter）** | 支持（注入 WHERE 条件） | **不支持** |
| **列脱敏（Data Mask）** | 支持（多种 mask 函数 + 自定义） | **不支持** |
| **Tag-Based Policy** | 支持（标签驱动） | **不支持** |
| **条件表达式（Conditions）** | 支持（IP / 时间 / 标签） | **不支持** |

**第二层：Row Filter 的实现原理。** Ranger 在 SQL 编译阶段注入 WHERE 条件。例如 `SELECT * FROM orders` → 实际执行 `SELECT * FROM orders WHERE region = current_user_region()`。条件可以是固定值、用户属性、查询时的 `current_user` 函数等。

**第三层：Data Mask 的实现原理。** Ranger 在列引用处注入脱敏表达式。例如 `SELECT user_phone FROM users` → 实际执行 `SELECT CONCAT('***', SUBSTR(user_phone, 8, 4))`。内置 mask 函数：

- `MASK`（全遮）、`MASK_SHOW_FIRST_4`、`MASK_SHOW_LAST_4`、`MASK_HASH`、`MASK_NULL`、`MASK_DATE_SHOW_YEAR`、`CUSTOM`。

**第四层：Tag-Based Policy 的实现原理。** 标签从 Atlas / DataHub 同步进来（如 `PII` / `SPI` / `PHI`），策略直接消费标签："所有 `PII` 标签字段对 `data_analyst` 角色 MASK_SHOW_LAST_4"。一条策略覆盖所有同类字段，不用逐字段配置。

**第五层：业务影响与工业案例。**

- **金融场景**：客户级行级隔离（`WHERE customer_id = current_user_customer_id`）是金融刚需；Sentry 做不到。
- **医疗场景**：HIPAA 要求的 PHI 字段自动脱敏，依赖 Tag-Based Policy；Sentry 做不到。
- **互联网场景**：共享数据给外部合作方但保留脱敏视图，依赖 Data Mask；Sentry 做不到。

Uber 在其数据平台用 Ranger 的 Row Filter 做"业务 BP 只能看自己业务线的数据"，是金融 / 互联网通用的做法。LinkedIn 用 Ranger 的 Tag-Based Policy 自动给 PII 字段加 MASK。阿里云 EMR 用 Ranger 做客户级行级隔离。

**3. 常见陷阱**

- **以为"列级就够了"。** 列级只解决"字段看不看"，行级解决"看到哪些行"；两者业务诉求完全不同。
- **以为"行级 = VIEW"。** 用 VIEW 做行级隔离需要每个用户一个 VIEW，扩展性差；Ranger Row Filter 在 SQL 编译阶段注入，扩展性强。
- **以为脱敏 = 改数据。** 动态脱敏不改源数据，只改查询返回值；同一份数据对不同角色返回不同视图。

**4. 追问预测**

- **「Row Filter 怎么配合业务主键？」** 答：在表中加 `tenant_id` / `customer_id` 字段；Ranger 注入 `WHERE tenant_id = current_user_tenant()`；标签从身份系统同步。
- **「列脱敏函数可以自定义吗？」** 答：可以，用 `CUSTOM` 类型，Ranger 接受任意 SQL 表达式（如 `CONCAT('***', SUBSTR(col, 8, 4))`）。

**5. 参考资料**

- Apache Ranger 官方文档中关于 Row Level Filter 与 Data Mask 的章节——Ranger 细粒度控制的标准说明。
- Uber Engineering 关于"用 Ranger Row Filter 做业务线隔离"的公开文章——头部出行公司的工业实践。
- LinkedIn Engineering Blog 关于"Tag-Based Policy 自动化 PII 保护"的公开文章——头部社交网络公司的合规实践。
- Databricks Unity Catalog 官方文档中关于 Row Access Policy 与 Column Masking 的章节——商业产品对 Ranger 模型的等价实现。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.4.4 考虑到未来可能扩展到云原生环境并集成更多新型数据源，从架构的可扩展性和社区活跃度来看，你更倾向选 Ranger 还是 Sentry？

**1. 考察点**

- 是否具备**演进视角**——不仅看现在，还看未来 3-5 年。
- 能否从云原生适配、新数据源支持、社区、商业支持四个维度对比。
- 是否知道 Sentry 已进入 Apache Attic 的事实。
- 加分项：能给出针对云原生的具体方案（K8s Operator / Helm Chart / Operator 模式）。

**2. 参考答案框架**

**第一层：云原生适配对比。**

| 维度 | Ranger | Sentry |
| --- | --- | --- |
| K8s 部署 | 有官方 Operator / Helm Chart | 无官方 K8s 支持 |
| 容器化 | 镜像完整、配置简洁 | 镜像老旧，配置复杂 |
| 工作负载身份 | 支持 SPIFFE 集成（实验性） | 不支持 |
| HPA / 自动伸缩 | 通过 K8s 原生支持 | 需自实现 |
| 滚动升级 | Helm 原生支持 | 需手工操作 |

**第二层：新数据源支持对比。**

| 维度 | Ranger | Sentry |
| --- | --- | --- |
| 传统组件（Hive/HDFS/HBase/Kafka） | 支持 | 支持 |
| Iceberg / Hudi / Delta | 已支持 Iceberg/Hudi/Delta Plugin | 不支持 |
| 云原生（Trino / Presto / Flink） | 支持 Trino / Flink Plugin | 不支持 |
| NoSQL（Cassandra / MongoDB） | 部分支持（HBase + 自研） | 不支持 |
| 向量库（Milvus / Pinecone） | 暂无原生，需自研 | 不支持 |

**第三层：社区活跃度对比。**

- **Ranger**：star 数与活跃贡献者数可在 GitHub 的 apache/ranger 仓库直接查看（该数字随时间变动，此处不锁定具体值）；月度 commit；2024 仍在持续发布新版本（Ranger 2.4+）；商业支持来自 Cloudera。
- **Sentry**：Apache Attic 状态；月度 commit 极少；新贡献者基本停滞；官方说明是"无活跃开发，仅修严重 bug"。

**第四层：商业支持对比。**

- **Ranger**：Cloudera CDH / HDP / CDP 官方支持；阿里云 / AWS / 腾讯云 EMR 都支持 Ranger。
- **Sentry**：仅 Cloudera CDH 老版本支持；新平台基本不再集成。

**第五层：决策——选 Ranger。** 综合以上四维度，新项目选 Ranger 是无悬念的；Sentry 仅在"老 CDH + 不升级 + 简单 Hive 场景"还有存量的合理性。

**第六层：云原生下的 Ranger 演进方向。** Apache Ranger 社区正在做：

- **Ranger Operator**：K8s 原生部署。
- **Cloud Native Plugin**：Presto / Trino / Flink 的 Plugin 持续完善。
- **SPIFFE 集成**：用 SPIFFE / SPIRE 替代 Kerberos 作为工作负载身份。
- **Iceberg / Hudi Plugin**：湖表格式的细粒度权限。

Databricks Unity Catalog、AWS Lake Formation 在产品形态上对应 Ranger 的演进方向。

**3. 常见陷阱**

- **只关注当下不关注演进。** 大数据平台的迭代周期是 3-5 年，技术选型必须看演进能力。
- **忽视 Apache Attic 的含义。** 进入 Attic 不是"暂停"，而是"无主代码"——生产风险持续上升。
- **以为 Sentry "够用就行"。** 等业务发展到需要 Iceberg / Trino / Flink 权限时，再迁移 Ranger 代价远大于一开始就选 Ranger。

**4. 追问预测**

- **「Ranger 上云原生怎么部署？」** 答：Ranger Operator + Helm Chart；状态存外部 MySQL；Plugin 通过 ConfigMap 注入。
- **「新数据源（向量库 / 数据湖格式）怎么集成？」** 答：写自定义 Plugin（参考 Hive Plugin）；把数据源的访问请求抽象成 Policy Items 三要素；接入 Ranger Admin。

**5. 参考资料**

- Apache Ranger 官方 GitHub 仓库——commit 频率、贡献者、版本发布节奏。
- Apache Sentry 官方 GitHub 仓库与 Apache Attic 公告——Sentry 维护状态的官方说明。
- Apache Ranger Operator（K8s）项目文档——Ranger 云原生部署的参考实现。
- Databricks Unity Catalog 与 AWS Lake Formation 官方文档——云原生数据权限的演进方向。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.4.5 当需要为一个同时包含 Hadoop、Spark、Kafka 和 NoSQL 数据库的混合大数据平台设计统一权限方案时，应该如何选型和架构设计？

**1. 考察点**

- 是否具备**混合架构的工程直觉**——这是数据架构师的核心能力。
- 能否说清"统一权限中心 + 异构插件"的架构形态。
- 是否知道 NoSQL 接入统一权限的特殊难点。
- 加分项：能给出一个端到端的混合平台权限架构图。

**2. 参考答案框架**

**第一层：混合平台的统一权限挑战。**

- **异构组件**：Hadoop 生态（Hive/HDFS/HBase）+ Spark（独立 ACL）+ Kafka（ACL）+ NoSQL（HBase/Cassandra/MongoDB）。
- **异构协议**：RPC（Spark）、Thrift（HS2）、HTTP REST（Kafka）、CQL（Cassandra）、Wire Protocol（HBase）。
- **异构身份**：Kerberos（传统）+ OAuth（云）+ mTLS（云原生）。
- **异构权限模型**：RBAC（Hadoop）+ ACL（Kafka）+ Cell-level（HBase）+ 自定义（NoSQL）。

**第二层：选型——Ranger 作为统一权限中心。** Ranger 是当前唯一支持这么多组件的开放框架：

| 组件 | Ranger Plugin | 权限粒度 |
| --- | --- | --- |
| Hive | Hive Plugin | DB / Table / Column + Row Filter + Mask |
| HDFS | HDFS Plugin | Path + POSIX ACL |
| HBase | HBase Plugin | Namespace / Table / Column Family / Column Qualifier |
| Kafka | Kafka Authorizer | Topic + Producer / Consumer |
| YARN | YARN Plugin | Queue / User |
| Spark | Spark Plugin（与 Hive Plugin 配合） | SQL ACL + View ACL |
| Trino / Presto | Trino Plugin | Catalog / Schema / Table / Column |
| Knox | Knox Plugin | API Endpoint |
| Storm / NiFi / Kylin / Solr | 各组件 Plugin | 组件特定 |

**第三层：NoSQL 的接入。** NoSQL 接入统一权限的难点是协议与权限模型差异：

- **HBase**：Ranger HBase Plugin 支持 column family + column qualifier 级别，配合 Cell-level ACL（Coprocessor）。
- **Cassandra**：用 LDAP + RBAC 自管；或用 Ranger Cassandra Plugin（社区版，功能有限）。
- **MongoDB**：用 MongoDB 自带 RBAC（结合 LDAP）；通过 Privacera 这类商业产品桥接到 Ranger。
- **Redis**：Redis 6+ 的 ACL + Ranger Redis Plugin（社区版）。

**第四层：架构设计。**

```
┌─────────────────────────────────────────────────┐
│       统一身份层（LDAP / AD / SSO）              │
│       - 员工身份                                  │
│       - 服务身份（Kerberos principal）            │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│       Ranger Admin（统一策略中心）                │
│       - Service × Resource × Policy              │
│       - Tag-Based Policy                         │
│       - Audit                                    │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  各组件 Plugin（嵌入式拦截）                      │
│  Hive Plugin | HDFS Plugin | HBase Plugin |     │
│  Kafka Authorizer | Spark Plugin | NoSQL Plugin │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  组件层                                            │
│  HiveServer2 / NameNode / HBase Master /        │
│  Kafka Broker / Spark Driver / NoSQL             │
└─────────────────────────────────────────────────┘
```

**第五层：落地路径。** 分阶段实施是降低风险的关键：

1. **第一阶段**：HDFS + Hive（最常见，最熟悉）。
2. **第二阶段**：Kafka + HBase（核心组件）。
3. **第三阶段**：Spark + Trino（计算层）。
4. **第四阶段**：NoSQL（最复杂，可能需商业产品）。

**第六层：工业案例。** 滴滴大数据平台用 Ranger 做统一权限，组件覆盖 Hive/HDFS/Kafka/HBase/Spark；美团数据安全网关基于 Ranger；腾讯 TBDS 用 Ranger + 自研扩展覆盖 30+ 组件。Uber 在其数据平台用 Ranger 覆盖 Hive/HDFS/Kafka/HBase/Spark/Trino。LinkedIn 的 Espresso 数据平台同样用 Ranger。

**3. 常见陷阱**

- **一次铺开所有组件。** 风险太高，分阶段是工业共识。
- **NoSQL 强求统一。** 部分 NoSQL 接入统一权限成本高，可接受"独立管理 + 审计整合"。
- **没做身份打通。** 身份不统一 = 策略分裂，先打通 LDAP / AD。

**4. 追问预测**

- **「Cassandra 怎么接入统一权限？」** 答：用 LDAP + Cassandra 原生 RBAC；或用 Privacera 桥接到 Ranger；或自研 Ranger Cassandra Plugin。
- **「多集群怎么统一？」** 答：用一个 Ranger Admin + 多个 Plugin；或每个集群独立 Ranger Admin，跨集群策略靠一套自己选定的同步机制对齐——**Ranger 不自带跨 Admin 的推送**，具体用什么同步要按你的 Admin 部署与官方文档核验，不要假设它自带实时推送。

**5. 参考资料**

- Apache Ranger 官方文档中关于 Supported Components 的章节——Ranger 插件覆盖范围的全景。
- 滴滴大数据平台 / 美团数据安全网关 / 腾讯 TBDS 公开技术分享——国内头部出行 / 本地生活 / 互联网公司的统一权限实践。
- Uber Engineering 关于"混合大数据平台权限管理"的公开文章——头部出行公司的统一权限架构。
- Privacera 官方文档——商业产品对 Ranger 的扩展，特别是 NoSQL 与云原生部分。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---
