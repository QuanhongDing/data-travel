> 本文件是 **02-data-security.md** §8 面试真题集的子主题。完整章节请回到 [index](02-data-security.md) 或 [§8 索引](02-data-security-section-8-sec8.md)。

### 8.5 §5.3 Kerberos 与 Ranger / Sentry 集成实践

> 本主题覆盖 Kerberos 与 Ranger / Sentry 的分工、多租户细粒度权限、运维排障与集成步骤。面试官从"两个体系怎么协同"切入，下钻到多租户、跨组件、故障排查的工程细节。

#### §5.3.1 请简要说明 Kerberos 在大数据平台中的主要作用是什么，以及它与 Ranger 或 Sentry 是如何分工协作的？

**1. 考察点**

- 是否能从"认证 / 授权"的经典分层清晰作答。
- 能否说清 Kerberos 解决"我是谁"，Ranger / Sentry 解决"我能做什么"。
- 是否知道两者的协同点：服务收到 Kerberos 票据后转交 Ranger / Sentry 做 ACL 检查。
- 加分项：能讲清 Kerberos 不在 Ranger / Sentry 替换方案中的原因（PKI / OAuth 都不等价）。

**2. 参考答案框架**

**第一层：Kerberos 在大数据平台中的作用。** Kerberos 解决三个根本问题：

- **身份认证（Authentication）**：确认"客户端是它声称的那个 principal"。
- **强身份**：用对称密钥 + 时间戳防重放，替代传统"用户名 + 密码"的弱认证。
- **跨服务 SSO**：一次 TGT 换取多个 Service Ticket，简化服务间互访。

**第二层：与 Ranger / Sentry 的分工。**

| 维度 | Kerberos | Ranger / Sentry |
| --- | --- | --- |
| 关注点 | Authentication（你是谁） | Authorization（你能做什么） |
| 实现层 | 网络协议（RPC / Thrift） | 组件插件（Hive Hook / NN Plugin） |
| 数据来源 | KDC / AD / LDAP | 策略库（MySQL）+ 元数据（Atlas） |
| 凭证 | 票据（TGT / Service Ticket） | 策略条目 |
| 凭证生命周期 | TGT 10h（可续）/ Service Ticket 1h | 策略可热加载（30s） |
| 性能开销 | 一次性 + 票据缓存 | 每次访问评估（Plugin 缓存） |

**第三层：协同流程。**

1. 用户用 kinit 拿 TGT（Kerberos 解决身份）。
2. 用户连 HiveServer2 提交 Service Ticket（Kerberos 认证身份）。
3. HiveServer2 的 Ranger Plugin 拿用户名 / 组，调用 Ranger 评估策略（Ranger 解决授权）。
4. 命中 allow → 执行；命中 deny → 拒绝 + 审计。

**第四层：不能替代的原因。** PKI / OAuth / mTLS 可以替代 Kerberos 的"身份认证"职能，但不能替代 Ranger / Sentry 的"细粒度授权"——后者关注的是"这个用户能访问哪些表 / 列 / 行"，需要的是策略模型而不是认证协议。

**第五层：工业实践。** Hadoop 的生产安全部署通常启用「Kerberos（强身份）+ Ranger（细粒度授权）」这一组合（**需显式开启，并非集群默认**）。阿里云 EMR / AWS EMR / Azure HDInsight / Cloudera CDH 都遵循这一组合。Uber 在其数据平台中明确"Kerberos 身份 + Ranger 授权"的组合是规模化数据访问的最低门槛。LinkedIn 在 Espresso 数据平台中也使用相同的组合。

**3. 常见陷阱**

- **以为 Kerberos = 安全。** Kerberos 只解决身份；不解决权限、不解决审计、不解决加密。
- **混用术语。** Authentication ≠ Authorization；很多候选人把两者搞混。
- **以为 Kerberos 可以被 OAuth 取代。** OAuth 解决的是"用户授权应用访问 API"，不解决"服务间强身份"——Kerberos 在内网仍是首选。

**4. 追问预测**

- **「云原生场景用什么替代 Kerberos？」** 答：SPIFFE / SPIRE 提供工作负载身份（等价 Kerberos 的"机器身份"）；OPA 做策略（等价 Ranger 的"授权"）。这是云原生的"Kerberos + Ranger"等价方案。
- **「Kerberos 票据谁来颁发？」** 答：KDC（Key Distribution Center）；集群部署一台 / 多台 KDC；与 AD 集成时由 AD 兼任。

**5. 参考资料**

- Apache Hadoop 官方文档《Security》章节——Hadoop 认证与授权的标准架构。
- Apache Ranger 官方文档中关于 Kerberos 集成的章节——Ranger Plugin 如何消费 Kerberos 身份。
- NIST SP 800-53《Security and Privacy Controls》——认证与授权分离的标准安全模型。
- 《大数据之路：阿里巴巴大数据实践》中关于 Kerberos + Ranger 集成章节——国内头部厂商的协同架构。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.3.2 在设计一个支持多租户的大数据平台时，如何结合 Kerberos 和 Ranger 实现细粒度的资源隔离和权限管控？

**1. 考察点**

- 是否能从**租户维度**（身份 / 资源 / 配额）系统作答，而不是零散罗列。
- 能否说清 Kerberos realm 与 Ranger service 的租户映射。
- 是否知道多租户下的常见隔离机制（HDFS path / Hive DB / Kafka topic / Spark namespace）。
- 加分项：能讲清跨租户查询、跨租户联邦的边界。

**2. 参考答案框架**

**第一层：多租户的三维隔离。** 大数据平台的多租户通常包含三个维度：

- **身份隔离**：每个租户独立的 principal 命名空间（realm 或 prefix）。
- **资源隔离**：每个租户独立的存储路径 / 数据库 / 主题。
- **配额隔离**：CPU / 内存 / 存储 / 请求数限制。

**第二层：Kerberos 层——身份隔离。**

- **Realm 隔离**：每个租户独立 realm（如 `TENANT_A.COM` / `TENANT_B.COM`），KDC 用 master cross-realm key 建立 trust。
- **Principal 命名规范**：`<tenant>/<user>@REALM.COM` 或 `user/<tenant>@REALM.COM`，便于按 principal 前缀过滤。
- **Keytab 隔离**：每个租户的 keytab 单独管理；服务进程用哪个租户的 keytab，决定它属于哪个租户。

**第三层：Ranger 层——资源隔离与权限管控。**

- **Service 隔离**：每个租户独立 Ranger Service（如 `hive_tenant_a` / `hive_tenant_b`），策略物理隔离。
- **资源隔离**：
  - **HDFS**：每个租户独立父目录（如 `/data/tenant_a/`），Ranger HDFS Plugin 按 path 隔离。
  - **Hive**：每个租户独立 database，Ranger Hive Plugin 按 db 隔离。
  - **Kafka**：每个租户独立 topic prefix，Ranger Kafka Authorizer 按 topic 隔离。
  - **Spark**：用 Spark Namespace（K8s namespace 或 YARN queue）做资源调度隔离。
- **策略隔离**：每个租户的策略独立管理；租户内 RBAC + 跨租户按需授权。
- **Tag-Based Policy**：用 `tenant_id` 标签做行级过滤，跨表统一隔离。

**第四层：典型架构。**

```
┌─────────────────────────────────────────────┐
│ 租户 A (REALM_A.COM)              租户 B (REALM_B.COM)  │
│   - user_a1@REALM_A.COM           - user_b1@REALM_B.COM │
└─────────────────────────────────────────────┘
              │                              │
              ▼                              ▼
       ┌──────────┐                    ┌──────────┐
       │ KDC-A    │                    │ KDC-B    │
       └──────────┘                    └──────────┘
              │                              │
              └──────────────┬───────────────┘
                             ▼
       ┌──────────────────────────────────────┐
       │         Ranger Admin (中心)         │
       │  - service: hive_tenant_a / b        │
       │  - service: hdfs_tenant_a / b        │
       │  - service: kafka_tenant_a / b       │
       └──────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         Hive-A          Hive-B          HDFS（多 path）
```

**第五层：工业实践。** 阿里云 EMR 的多租户模式用"项目 + ACL + 资源配额"三层；腾讯云 TBDS 支持跨租户联邦；AWS Lake Formation 用"账户 + 资源"做多租户；Databricks Unity Catalog 用"Metastore + Catalog"做租户隔离。Uber 在其数据平台上用类似方案支撑 100+ 业务线的多租户数据访问。LinkedIn 在 Espresso 数据平台上把多租户抽象为"数据产品 + 团队"两个维度。

**3. 常见陷阱**

- **只隔离身份不隔离资源。** Kerberos 只管身份，Ranger 不做资源配额——两者都做才完整。
- **跨租户数据共享无机制。** 多租户下经常需要"租户 A 部分数据给租户 B"，必须设计"跨租户授权 + 审计"。
- **行级过滤依赖字段规范。** Ranger Row Filter 要每行有 `tenant_id` 字段——业务表必须有这个字段。

**4. 追问预测**

- **「跨租户查询怎么办？」** 答：用 Ranger policy 的 Conditions 做"特定用户可以跨租户查询"；用 Privacera / Immuta 这类商业产品的"动态脱敏 + 跨域授权"。
- **「资源配额怎么落地？」** 答：YARN 队列（CPU / 内存）+ HDFS quota（磁盘）+ Kafka quota（请求）+ Spark K8s namespace（资源）。

**5. 参考资料**

- 阿里云 EMR 多租户模式公开文档——国内云厂商的多租户参考架构。
- AWS Lake Formation 官方文档——云原生的多租户数据湖权限模型。
- Databricks Unity Catalog 多租户隔离章节——Lakehouse 多租户设计参考。
- Apache Ranger 官方文档中关于 Service Per Tenant 的章节——Ranger 多租户隔离的标准做法。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.3.3 请比较 Ranger 和 Sentry 在架构设计、功能特性以及与 Kerberos 集成方面的主要异同，并给出选型建议。

**1. 考察点**

- 是否能从**架构 / 功能 / Kerberos 集成**三个维度做结构化对比。
- 能否给出基于场景的选型建议，而不是简单的"选 Ranger"。
- 是否知道两者的历史演进（Cloudera 合并后 Ranger 主导）。
- 加分项：能讲清混合部署的代价。

**2. 参考答案框架**

**第一层：架构对比。**

| 维度 | Ranger | Sentry |
| --- | --- | --- |
| 架构形态 | 集中式（Admin + Plugins） | 嵌入式（绑定 HMS） |
| 策略存储 | MySQL/Postgres（独立服务） | MySQL（Sentry 服务） |
| 评估位置 | 各组件的 Plugin（本地） | HiveServer2 启动时加载到内存 |
| 同步机制 | Admin REST 拉取 + Plugin 缓存 | 启动时全量拉 + 重启生效 |

**第二层：功能特性对比。**

| 维度 | Ranger | Sentry |
| --- | --- | --- |
| 组件覆盖 | 20+ 组件 | 4-5 组件 |
| 行级过滤 | 支持 | 不支持 |
| 列脱敏 | 支持 | 不支持 |
| Tag-Based Policy | 支持 | 不支持 |
| 审计 | 完整（allow/deny）+ 可推 Kafka | 仅 deny |
| 策略热加载 | 支持 | 不支持（重启 HS2） |

**第三层：与 Kerberos 集成对比。**

| 维度 | Ranger | Sentry |
| --- | --- | --- |
| 身份消费 | Ranger Plugin 读 Kerberos principal | Sentry 读 HS2 的 Kerberos 身份 |
| 集成方式 | 在 HiveServer2 嵌入 Ranger Hive Plugin | 在 HiveServer2 嵌入 Sentry Binding |
| 复杂度 | 中（需部署 Ranger Admin） | 低（只需 Sentry 服务） |
| 故障隔离 | Ranger Admin 故障影响所有组件的策略下发/管理 | Sentry 故障只影响 Hive |

**第四层：选型决策树。**

```
新项目？
├── 是 → 默认 Ranger（除非只 Hive 且团队小）
└── 否 → 老 CDH？
    ├── 是 → 评估 Sentry → Ranger 迁移成本
    │       ├── 成本可承受 → 迁 Ranger
    │       └── 成本不可承受 → 保留 Sentry（接受功能受限）
    └── 否 → 上云？
        ├── 是 → 用云原生的 Lake Formation / Unity Catalog
        └── 否 → 默认 Ranger
```

**第五层：工业实践。** Uber 已完成 Sentry → Ranger 迁移，明确表示"如果重来直接上 Ranger"。LinkedIn 在 Espresso 数据平台用 Ranger。Cloudera 自 2018 年合并 Hortonworks 后，把 Ranger 作为统一权限方向。Snowflake / Databricks 的自研 RBAC 在功能上对应 Ranger。

**3. 常见陷阱**

- **Sentry "够用就行"的错觉。** 等业务发展到需要动态脱敏 / 行级过滤时，再迁移 Ranger 代价远大于一开始就选 Ranger。
- **忽视 Ranger Admin 部署成本。** Ranger 是独立服务，需要 HA、监控、备份——不是"装上就行"。
- **混合部署短期可行，长期分裂。** Cloudera CDH 支持 Ranger + Sentry 共存，但策略分裂、审计割裂是长期隐患。

**4. 追问预测**

- **「Sentry 还有人用吗？」** 答：Cloudera 老客户仍在用，但新项目 / 迁移后项目默认 Ranger。
- **「Ranger 与 Sentry 能互通吗？」** 答：策略不能互通（独立存储），但同一组件可二选一。

**5. 参考资料**

- Apache Ranger 官方文档——Ranger 架构与功能的最权威说明。
- Apache Sentry 官方文档——Sentry 模型与组件支持范围。
- Cloudera 公开文档中关于"CDH Security: Ranger vs Sentry"的章节——合并后的统一方向。
- Uber Engineering 关于 Sentry → Ranger 迁移的公开分享——头部出行公司的迁移实战。
- 《大数据之路：阿里巴巴大数据实践》中关于 Ranger 选型章节——国内头部厂商的依据。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.3.4 在实际运维中，当遇到 Kerberos 票据过期导致 Ranger 策略验证失败时，你会如何排查和解决？

**1. 考察点**

- 是否具备**真实运维排障能力**——这是生产最常见的故障。
- 能否按"定位 → 止血 → 根治"的逻辑作答。
- 是否知道 Ranger 与 Kerberos 协同的几个常见故障点。
- 加分项：能给出具体的命令与监控指标。

**2. 参考答案框架**

**第一层：故障现象。** Ranger 策略验证失败的具体表现：

- HiveServer2 抛 `GSS initiate failed` 或 `Could not authenticate`。
- Spark 任务报 `User not authenticated` 或 `No credentials`。
- HDFS 报 `Failed to find any Kerberos Keytab`。
- Ranger Plugin 日志看到 `RangerAccessResult deny` 但策略明明 allow。

**第二层：定位流程。**

1. **确认 Kerberos 状态**：`klist` 看本地票据是否存在、是否过期。
2. **确认 keytab 状态**：`kinit -kt /path/to/keytab principal@REALM` 测试 keytab 有效性。
3. **看 Ranger Admin 健康**：检查 Admin 服务是否在线；Admin DB 是否能连。
4. **看 Plugin 日志**：HiveServer2 / NameNode 的日志里 Plugin 的 `authorize` 调用是否成功。
5. **看时钟偏差**：`ntpdate -q` 或 `chronyc tracking` 看偏移。
6. **看 DNS / SPNEGO**：HiveServer2 的 HTTP endpoint 走 SPNEGO，DNS 解析不对也会失败。

**第三层：止血方案。**

- **快速续签票据**：`kinit -R` 或 `kinit -kt /path/to/keytab principal`。
- **重启服务**：HiveServer2 / Spark History Server 等需要票据的服务，重启后会自动读 keytab。
- **降级**：Ranger fail-closed 时，临时改 fail-open 让业务跑起来，但需明确告知风险。

**第四层：根治方案。**

- **延长票据有效期**：`ticket_lifetime = 24h`、`renew_lifetime = 7d`（按合规要求调整）。
- **自动化续签**：用 systemd / cron 自动 `kinit -R`。
- **监控告警**：
  - `krb5kdc` 的 TGS 请求 QPS / 延迟。
  - HiveServer2 的 `authenticate` 失败次数。
  - 时钟偏移 > 60s 告警。
- **HA 部署**：KDC 主备、Ranger Admin 主备。
- **根因分析（RCA）**：记录故障时间线，更新 runbook。

**第五层：典型事故与教训。** LinkedIn 在 2016 年遇到一次大规模 Kerberos 故障——某台服务器 BIOS 电池失效导致时钟回退，整集群 HiveServer2 认证失败；问题定位耗时 2 小时，根因是缺 NTP 监控。Uber 在其公开 SRE 分享中提到"Kerberos 故障 = 数据访问全停"，列为 P0 级故障，每次故障后必做 RCA。

**3. 常见陷阱**

- **只看应用日志不看 Kerberos 票据。** "认证失败"要先看票据，再看应用。
- **延长票据不解决根本问题。** 票据短 + 时钟不同步 = 频繁失败；本质是时钟同步问题。
- **Fail-open 当成解决方案。** Fail-open 是临时止血，长期等于放弃授权。

**4. 追问预测**

- **「Kerberos 故障怎么快速恢复？」** 答：先用 fail-open 让业务跑；并行排查根因；找到后改回 fail-closed。
- **「Ranger 与 Kerberos 谁先启动？」** 答：Kerberos 必须先于 HiveServer2 / Ranger Plugin 启动；否则 Plugin 启动时拿不到票据，所有请求都会失败。

**5. 参考资料**

- MIT Kerberos 官方文档中 Troubleshooting 章节——Kerberos 故障的标准排查步骤。
- Apache Ranger 官方文档中关于 Kerberos 集成故障排查的章节——Ranger 视角的常见问题。
- LinkedIn Engineering Blog 关于 Kerberos 故障 RCA 的公开文章——头部社交网络公司的运维教训。
- Uber SRE 公开分享中关于"P0 级故障应急"的章节——故障止血与根治的工业流程。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.3.5 请描述在 Hadoop 集群中配置 Kerberos 与 Ranger 集成的关键步骤有哪些？

**1. 考察点**

- 是否具备**端到端的部署能力**——从头到尾把 Kerberos + Ranger 拉起来。
- 能否说清每个步骤的目的与产物。
- 是否知道常见踩坑点（如 KDC 与 Ranger 时钟不一致）。
- 加分项：能给出一段可执行的 Ansible / Shell 伪代码。

**2. 参考答案框架**

**第一层：先立部署架构。** 典型生产部署：① KDC（主备）→ ② Kerberos Client（所有节点）→ ③ Hive/HDFS 启用 Security → ④ Ranger Admin → ⑤ Ranger Plugins（嵌入各组件）。

**第二层：六大步骤。**

**Step 1：KDC 部署与 principal 创建。**
- 安装 MIT Kerberos 或对接企业 AD。
- 创建 principal：`hdfs/<NN_HOST>@REALM.COM`、`hive/<HS2_HOST>@REALM.COM`、`yarn/<RM_HOST>@REALM.COM`、`ranger/<ADMIN_HOST>@REALM.COM`。
- 用 `kadmin` 生成 keytab，分发到各节点 `/etc/security/keytabs/`，权限 400，归属对应用户。

**Step 2：Hadoop 启用 Kerberos。**
- `core-site.xml`：`hadoop.security.authentication = Kerberos`、`hadoop.security.authorization = true`。
- `hdfs-site.xml`：启用 `dfs.block.access.token.enable=true`。
- `yarn-site.xml`：启用 `yarn.resourcemanager.keytab` 等。
- 分发 keytab 到所有节点。
- 重启 HDFS / YARN，测试 `hdfs dfs -ls /` 看是否要票据。

**Step 3：Hive 启用 Kerberos。**
- `hive-site.xml`：启用 `hive.server2.authentication = KERBEROS`。
- 重启 HiveServer2 使 Kerberos 认证生效。

**Step 4：Ranger Admin 部署与 Ranger Plugin 集成。**
- 安装 Ranger Admin（含内置 Solr / MySQL）。
- 配置 `ranger-admin-site.xml`：数据库连接、审计存储。
- 启动 Ranger Admin，访问 Ranger Admin 的 Web 控制台（默认 6080 端口）。
- 创建 Service（Hive / HDFS / HBase / Kafka），配置 resource、policy。
- 配置 Ranger Hive Plugin：在 `ranger-hive-plugin/install.properties` 配置 Ranger Admin URL，开启 audit；重启 HiveServer2，看日志确认 Plugin 加载成功。

**Step 5：Ranger Usersync 与 Tagsync 部署。**
- Usersync：配置 LDAP / AD 同步用户组；定时任务。
- Tagsync：配置从 Atlas / DataHub 同步标签；Kafka 推送。

**Step 6：端到端测试。**
- `kinit` 测试票据获取。
- `hdfs dfs -ls /data/secure/` 测试 HDFS 权限。
- `beeline -u "jdbc:hive2://..."` 测试 Hive 列权限、列脱敏。
- Ranger Audit 看 allow / deny 日志是否正常。

**第三层：典型踩坑。**

- **KDC 时钟偏差**：所有节点时钟不同步 → 票据被拒。
- **keytab 权限错**：keytab 权限 644 → 启动失败。
- **Ranger Admin 端口冲突**：6080 端口被占用 → Admin 起不来。
- **Plugin 没生效**：Plugin 配置写错 → 策略不生效但业务能跑（沉默故障）。
- **Solr 启动失败**：Ranger 默认带 Solr，Solr 启动失败导致 audit 没写入。

**第四层：自动化与 GitOps。** 现代生产实践是用 Ansible / Salt / Puppet 做 GitOps 部署——所有配置文件进 Git，新环境一行命令拉起。阿里云 EMR、AWS EMR 都提供一键启用 Kerberos + Ranger 的能力。

**第五层：工业实践。** Cloudera CDH / HDP 的"Add Service → Enable Kerberos → Enable Ranger"是标准流程；阿里云 EMR / 腾讯云 TBDS 提供 Web 化的向导；Uber 在其 GitOps 体系中用 Salt 管理 keytab + Ranger 配置的全生命周期。

**3. 常见陷阱**

- **顺序错了。** KDC → Kerberos → Hadoop Security → Ranger Admin → Plugins → Test，顺序不能乱。
- **Plugin 配置不验证。** 部署完不测试 Plugin → 沉默故障 → 权限实际无效。
- **审计丢失。** Ranger Audit 配错 Solr URL → 审计写不进，事故追查时两手空空。

**4. 追问预测**

- **「部署完怎么验证？」** 答：用 `kinit` → `hdfs dfs -put` 测试权限拒绝；用 `beeline` 测试 Hive 列脱敏；用 Ranger Admin 看 audit 日志。
- **「迁移老集群怎么搞？」** 答：先平行部署 Kerberos（不启用），再逐组件切流量，最后启用 Ranger——灰度迁移。

**5. 参考资料**

- Apache Ranger 官方文档中 Quick Start 与 Installation 章节——Ranger 部署的标准步骤。
- Apache Hadoop 官方文档《Security》章节——Hadoop 各组件启用 Kerberos 的官方指南。
- Cloudera 公开文档中关于"CDH Security Setup"的章节——CDH 一键启用 Kerberos + Ranger 的工业流程。
- 阿里云 EMR 公开文档中关于"启用安全模式"的章节——国内云厂商的安全集群初始化流程。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---
