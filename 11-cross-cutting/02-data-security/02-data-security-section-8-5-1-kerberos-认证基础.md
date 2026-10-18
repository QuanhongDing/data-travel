> 本文件是 **02-data-security.md** § 8 面试真题集的子主题。完整章节请回到 [index](02-data-security.md) 或 [§ 8 索引](02-data-security-section-8-sec8.md)。

### 8.3 §5.1 Kerberos 认证基础

> 本主题覆盖 Kerberos 的基本概念（keytab、流程、时钟、KDC）、五要素角色（KDC / TGT / Service Ticket）及万节点规模下的性能挑战。面试官通常从"为什么 Hadoop 必须配 Kerberos"问起，下钻到协议细节与运维陷阱。

#### §5.1.1 请描述在 Hadoop 集群中集成 Kerberos 认证时，Keytab 文件的作用以及其安全使用规范。请举例说明为什么 Keytab 文件泄露是重大安全事故。

**1. 考察点**

- 是否理解 Keytab 的本质——principal 的"机器可读密码"，用于服务进程的非交互认证。
- 能否说清 Keytab 与明文密码的区别，以及在服务进程（NameNode、DataNode、HiveServer2）中的角色。
- 是否掌握 Keytab 的安全使用规范：权限、归属、传输、定期轮转。
- 加分项：能用真实事故说明 Keytab 泄露后果。

**2. 参考答案框架**

**第一层：Keytab 是什么。** Keytab（key table）= principal + 加密密钥的二进制文件。服务进程启动时加载 keytab，无需人工输入密码即可完成 Kerberos 认证。每个 service principal（如 `hdfs/_HOST@REALM.COM`、`hive/_HOST@REALM.COM`）有独立 keytab。

**第二层：与密码的对比。**

| 维度 | 密码 | Keytab |
| --- | --- | --- |
| 使用方式 | 交互式（kinit 时输入） | 非交互式（程序加载） |
| 适用 | 人类用户 | 服务进程 |
| 轮转难度 | 用户可改密码 | 需重新生成并分发 |
| 泄露代价 | 用户身份被冒充 | 服务身份被冒充（更高危） |

**第三层：安全使用规范。**

- **权限**：文件权限 `chmod 400` 或 `chmod 600`；归属运行用户（如 `hdfs:hadoop`）。
- **存储位置**：放在 `/etc/security/keytabs/` 或 `/var/lib/kerberos/keytabs/`；不在共享存储 / 镜像 / 备份中。
- **传输**：用 scp / sftp 加密传输；不走邮件、不走工单附件。
- **定期轮转**：建议 90 天轮转；用 `kadmin` 重新生成并分发。
- **删除临时文件**：下载 / 上传完成后立即删除。

**第四层：泄露后果的真实案例。** Uber 2016 年泄露事件中包含 AWS S3 凭证，导致 5700 万用户数据泄露——这是"凭证 = 身份"的最直观案例。Yahoo 2014 年大数据集群因 Hadoop / Kerberos 配置不当被攻击，部分与 Kerberos 凭证管理薄弱相关。在 Hadoop 场景下，HDFS NameNode 的 keytab 泄露 = 攻击者可冒充 NameNode 与所有 DataNode 通信，等于内网沦陷。

**第五层：工业实践。** 阿里云 EMR 用 Vault 管理 keytab 生命周期，支持自动轮转与版本管理。腾讯云 TBDS 提供 EMR 控制台统一管理 keytab，避免人工复制。Uber 在其数据平台中明确 keytab 安全规范为 P0 级风险，违规直接报警。

**3. 常见陷阱**

- **把 keytab 当配置而非凭证。** keytab 是"永久凭证"，泄露代价等同密码泄露。
- **运维便利而放宽权限。** `chmod 644` 让所有用户可读 = 严重事故隐患。
- **不轮转。** 长期不轮转的 keytab 在被窃后无时间窗口收敛。
- **同一 keytab 给多节点用。** 一旦某节点被入侵，整集群连带暴露；应每节点独立 keytab。

**4. 追问预测**

- **「Keytab 怎么自动化轮转？」** 答：Ansible + kadmin；新 keytab 生成 → 推送到节点 → 重启服务加载 → 旧 keytab 保留宽限期后失效。
- **「Keytab 加密存储可以吗？」** 答：可以，用 AES 加密文件 + 启动时解密；但本质是把"泄露 keytab"换成"泄露密钥"，只是提高了门槛。

**5. 参考资料**

- MIT Kerberos 官方文档中 Keytab 章节——keytab 格式与管理的权威说明。
- Apache Hadoop 官方文档《Security》章节——Hadoop 各组件 keytab 的标准路径与权限。
- Uber 2016 数据泄露事件公开复盘报告——凭证泄露后果的工业级案例。
- 阿里云 EMR / 腾讯云 TBDS 公开技术文档——云厂商 keytab 生命周期管理实践。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.1.2 请简要解释 Kerberos 认证的基本流程，并说明其核心目标是什么？

**1. 考察点**

- 是否能从**两次票据交互**的角度说清 Kerberos 流程，而不是背一堆缩写。
- 是否理解核心目标：SSO、跨域信任、不传明文密码、防重放。
- 能否区分 Kerberos（对称密钥、内网）与 OAuth/JWT（公钥 / 互联网）的适用场景。
- 加分项：能讲清 Kerberos 的局限（不解决授权、SPOF 在 KDC）。

**2. 参考答案框架**

**第一层：流程——两次票据交互。**

- **第一次（拿身份）**：Client → AS → 获 TGT。Client 用密钥（密码 hash 或 keytab）向 AS 证明身份，AS 返回 TGT（含 TGS 会话密钥 + TGT 票据）。TGT 有效期较长（默认 10 小时，可续到 7 天）。
- **第二次（拿服务）**：Client → TGS → 获 Service Ticket。Client 用 TGT 向 TGS 申请访问某个 Service 的票据，TGS 返回 Service Ticket。Service Ticket 有效期较短（默认 1 小时，不可续）。
- **第三次（访问服务）**：Client → Service 提交 Service Ticket + Authenticator（用会话密钥加密的时间戳），Service 验证后响应。

**第二层：核心目标。**

- **SSO（Single Sign-On）**：一次身份认证，多次访问——TGT 是 SSO 的载体。
- **跨域信任**：通过 realm 间共享密钥，实现"信任传递"（Domain A 用户访问 Domain B 服务）。
- **不传明文密码**：密码只在 AS-REQ/REP 阶段短暂出现，后续全程用票据与会话密钥。
- **防重放**：Authenticator 的时间戳 + Service 端的 `clockskew` 检查，确保同一票据不能被二次使用。

**第三层：与其他认证体系的对比。**

| 维度 | Kerberos | OAuth 2.0 | mTLS |
| --- | --- | --- | --- |
| 体系 | 对称密钥 | 令牌（JWT） | PKI 公钥 |
| 适用场景 | 内网 / 企业 | 互联网 / 跨域 | 跨公网 / 异构 |
| 性能 | 高（对称密钥） | 中（验签） | 中（证书验证） |
| 凭证载体 | 票据 | 访问令牌 | 证书 |
| SSO | 原生 | 依赖 IdP | 依赖 CA |

**第四层：Kerberos 的局限。** Kerberos 不解决授权（你要单独配 Ranger / Sentry）；KDC 是 SPOF，需要 HA；时钟依赖让跨地域部署麻烦；不适合跨公网（公钥体系更适合）。这就是为什么云原生场景越来越多用 SPIFFE / mTLS。

**第五层：工业案例。** Windows Active Directory 是 Kerberos 最大的工业落地——全球数十亿设备通过 AD 域登录。Hadoop 集群默认认证；MIT Kerberos 仍是 Linux 内网事实标准；苹果 macOS 用户登录也用 Kerberos。阿里云 EMR、AWS EMR、Azure HDInsight 均默认 Kerberos。

**3. 常见陷阱**

- **把 Kerberos 等同 SSO。** Kerberos 是 SSO 的实现方式之一，不是同义词。
- **以为 Kerberos 解决一切。** 授权、审计、数据安全仍需 Ranger / Immuta 等。
- **混淆 TGT 与 Service Ticket。** TGT 是"身份票据"（身份已认证），Service Ticket 是"服务票据"（特定服务授权）。

**4. 追问预测**

- **「Kerberos 如何与 OAuth 共存？」** 答：常见模式是 OAuth 走公网 SSO（用户登录），Kerberos 走内网服务认证（服务互访），通过 STS（Security Token Service）做令牌转换。
- **「Realm 之间怎么建立信任？」** 答：跨 realm TGT；两个 realm 的 KDC 共享一个 inter-realm key，建立双向信任。

**5. 参考资料**

- MIT Kerberos 官方文档——Kerberos 协议完整说明。
- RFC 4120《The Kerberos Network Authentication Service (V5)》——Kerberos 协议标准。
- 微软 Active Directory 文档——Kerberos 在 AD 中的实现与扩展。
- 《大数据之路：阿里巴巴大数据实践》中关于 Kerberos 集成章节。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.1.3 Kerberos 认证过程中可能遇到时钟偏差问题，请解释这个问题产生的原因、可能导致的安全风险，以及生产环境的最佳实践。

**1. 考察点**

- 是否理解 Kerberos **时间戳防重放**机制的依赖——这是问题的根源。
- 能否说清时钟偏差带来的两难：太严格误拒合法票据，太宽松扩大攻击窗口。
- 是否掌握生产环境 NTP / Chrony 部署的最佳实践。
- 加分项：能给出具体参数（`clockskew` 默认值、分层 NTP、监控阈值）。

**2. 参考答案框架**

**第一层：问题根源。** Kerberos Authenticator 含时间戳，Service 收到后比对本地时间，偏差超过 `clockskew`（默认 300 秒）则拒绝票据，理由是"票据可能被重放"。如果客户端与 Service 时钟不一致（哪怕几小时），合法票据也会被拒绝——这就是时钟偏差问题。

**第二层：安全风险。**

- **拒绝服务（DoS）**：时钟偏差过大 → 整个集群认证失败 → 集群停摆。这是生产最常见的 Kerberos 故障。
- **放宽窗口扩大攻击面**：把 `clockskew` 调到 3600 秒看似可用，但攻击者有 1 小时窗口可以重放捕获的票据。
- **票据被中间人缓存**：理论上时间偏差本身不直接泄露密钥，但放宽窗口让缓存攻击更容易。

**第三层：生产环境最佳实践。**

- **NTP 全集群同步**：所有节点 + KDC 必须从同一 NTP 源同步；推荐分层 NTP（外部源 → 内部 NTP 服务器 → 集群节点）。
- **Chrony 替代 NTP**：Chrony 在不稳定网络下表现更好；AWS / 阿里云默认 Chrony。
- **监控告警**：监控 `ntp_offset` > 60 秒告警；监控 `chronyc tracking` 的偏移量。
- **合理默认值**：`clockskew` 保留默认 300 秒；KDC 与客户端各跑 NTP。
- **避免虚拟机时钟漂移**：VM 时间漂移常见，启用 host time sync（如 VMware Tools、Hyper-V 集成服务）。
- **跨地域部署**：跨 region 时钟同步难，可考虑 KDC federation（每个 region 独立 KDC + inter-realm trust）。

**第四层：典型事故与教训。** LinkedIn 在 2016 年的一次集群故障中，问题追溯到一台机器 BIOS 电池失效导致时钟回退，整集群 Kerberos 认证雪崩。Uber 在其数据平台运维经验中明确"NTP 监控 = P0 级可用性指标"。阿里云 EMR 在用户文档中要求所有节点必须配置 NTP，并把"时钟偏差超限"列入自动巡检项。

**3. 常见陷阱**

- **只配 NTP 不监控。** NTP 进程在跑不等于时钟准；偏移可能因上游 NTP 故障累积到分钟级。
- **VM 不开时间同步。** VM 默认时间可能漂移到几小时，生产是大坑。
- **调大 `clockskew` 解决一切。** 短期止痛，长期扩大攻击面。
- **跨 region 共用 KDC。** 跨公网 RTT 高，时钟同步困难，应拆分 KDC。

**4. 追问预测**

- **「怎么监控时钟偏移？」** 答：用 Prometheus node_exporter 的 `node_timex_offset_seconds` 指标；设偏移 > 60s 告警；跨节点对比发现异常节点。
- **「KDC 自己也会有时钟偏差吗？」** 答：会。KDC 必须严格 NTP，否则发出的票据都会被拒。

**5. 参考资料**

- MIT Kerberos 文档中关于 `clockskew` 的章节——时钟偏差容忍度的权威说明。
- RFC 4120 §5.2.4——Kerberos 时钟偏差处理的标准定义。
- Chrony 官方文档——现代 Linux 环境 NTP 替代方案的最佳实践。
- LinkedIn Engineering Blog 关于 Hadoop 集群时间同步的公开文章——时钟故障的工业教训。
- 阿里云 EMR 公开文档——国内云厂商对 NTP 配置的强制要求。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.1.4 请分析在万节点级别的 Hadoop / Spark 集群中，Kerberos KDC 可能面临哪些性能瓶颈？并给出企业级优化方案。

**1. 考察点**

- 是否具备**万节点规模的 KDC 容量直觉**——这是大多数候选人答不全的点。
- 能否识别瓶颈：单 KDC QPS、内存、网络、续签风暴。
- 是否掌握企业级方案：KDC HA、RO KDC、票据延长、批量预热。
- 加分项：能给出具体参数与监控指标。

**2. 参考答案框架**

**第一层：先估规模。** 万节点集群按每节点 5-10 个服务（NameNode / DataNode / NodeManager / HiveServer2 / Impala...）算，主机 + 服务身份共 5-10 万个 principal——注意这是**身份数**，不是请求率。票据有寿命且会被客户端票据缓存复用，按寿命摊薄才得到稳态请求率：Service Ticket 默认 1 小时（见 §5.1.2），5-10 万身份各自每小时换发一次，稳态约 5-10 万 ÷ 3600 s ≈ 14-28 次 TGS-REQ/s；TGT 默认 10 小时、可续到 7 天，按 10 小时摊薄更是 5-10 万 ÷ 36000 s ≈ 1.4-2.8 次 AS-REQ/s。真正会把 QPS 顶上去的是**续签风暴**（票据同时到期，如早晨 9 点开工）——峰值可达稳态的数倍。

**第二层：瓶颈分析。**

- **单 KDC QPS（峰值而非稳态）**：MIT Kerberos 单 KDC 可承载数千 TGS-REQ / 秒，远高于第一层推算的稳态 14-28 次 TGS-REQ/s；压力来自续签风暴的瞬时峰值，而非稳态请求量。
- **内存压力**：KDC 在内存中维护 principal 与密钥数据库，principal 规模增长会推高内存占用；已签发的票据由客户端缓存复用（见上文），KDC 不保存、不占用其内存。
- **网络抖动**：KDC 单点部署，内网一次故障 = 整个集群停摆。
- **续签风暴**：票据同时到期（如早晨 9 点开工）造成 QPS 尖峰。
- **数据库后端瓶颈**：KDC 用 LDAP / DB 后端存储 principal，查询延迟会放大到整个认证路径。

**第三层：企业级优化方案。**

- **KDC HA**：主备 KDC（Active-Active 或 Active-Passive），用 keepalived / DNS 切换；阿里云 EMR 的"多 KDC 模式"是工业代表。
- **RO KDC**：部署只读副本 KDC，承担 TGS-REQ（票据换发）请求，主 KDC 只承担 AS-REQ（身份认证）。Uber 在其万节点 Spark 集群即采用 RO KDC 分流。
- **延长票据有效期**：TGT 从 10h 延长到 24h，Service Ticket 从 1h 延长到 4h（视安全要求）；减少续签频次。
- **票据缓存（client side）**：`kinit -R` 续签而非重新认证；Spark Executor 启动时预热票据。
- **批量预热**：所有节点启动时并行 kinit，避免开机的同步尖峰。
- **LDAP 后端**：用 OpenLDAP 或 AD 作 KDC 后端，提升 principal 查询性能；MIT Kerberos 原生支持 LDAP 后端。
- **监控**：QPS、TGS-REQ 延迟、KDC 内存、principal 数据库查询延迟。

**第四层：典型事故与教训。** LinkedIn 在早期万节点 Hadoop 集群上踩过 KDC 单点故障的坑——一次 KDC OOM 导致整个 Hadoop 集群停摆 4 小时；之后部署 5 节点 KDC 集群 + RO KDC 才解决。Uber 在公开分享中提到 KDC 是其数据平台的"头号 SPOF 担忧"，对每个变更都有专门的演练。

**3. 常见陷阱**

- **以为"配一台 KDC 就行"。** 万节点规模下 KDC 必须集群化。
- **续签风暴忽视。** 一刀切用默认 10h 票据，所有节点早上 9 点同时续签 = KDC 直接打挂。
- **票据延长忽视安全。** 把 Service Ticket 延长到 24h 会扩大重放窗口，必须配套时钟同步严格化。

**4. 追问预测**

- **「KDC 用 LDAP 还是 DB 后端？」** 答：万级 principal 选 LDAP（性能更好、运维成熟）；10 万级用 OpenLDAP + 读写分离；百万级考虑专用的 KDC 集群。
- **「跨 region KDC 怎么部署？」** 答：每个 region 独立 KDC + inter-realm trust；避免跨公网 KDC 调用。

**5. 参考资料**

- MIT Kerberos 官方文档中关于 Scaling KDC 的章节——KDC 性能调优的权威说明。
- Apache Hadoop 官方文档中关于 Large Cluster Kerberos Deployment 的指南——万节点集群认证架构。
- LinkedIn Engineering Blog 关于 Espresso 与 Hadoop 集群 KDC 高可用的公开文章。
- Uber Engineering 关于大规模 Spark 集群 KDC 部署的公开分享。
- 阿里云 EMR 多 KDC 模式公开文档——国内云厂商对 KDC HA 的工程实践。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §5.1.5 在 Kerberos 协议中，KDC、TGT 和 Service Ticket 分别扮演什么角色？请阐述它们的生命周期和相互作用。

**1. 考察点**

- 是否能清晰区分 KDC / TGT / Service Ticket 三者的角色边界。
- 是否理解票据生命周期的工程意义（短票据 = 短攻击窗口，长票据 = 少续签开销）。
- 能否说清 TGT 是"SSO 的载体"这一关键设计。
- 加分项：能讲清 cross-realm TGT 与 Renewable Ticket 的扩展。

**2. 参考答案框架**

**第一层：角色定义。**

- **KDC（Key Distribution Center）**：整个 Kerberos 体系的认证中心；包含两个子服务：
  - **AS（Authentication Server）**：验证用户 / 服务身份；颁发 TGT。
  - **TGS（Ticket Granting Server）**：根据 TGT 颁发 Service Ticket。
- **TGT（Ticket Granting Ticket）**：**身份票据**——"Client 已向 KDC 证明过身份"。由 AS 颁发，含 Client/TGS 会话密钥；有效期长（默认 10h，可续到 7d）。
- **Service Ticket**：**服务票据**——"KDC 授权 Client 访问特定 Service"。由 TGS 颁发，含 Client/Service 会话密钥；有效期短（默认 1h，不可续）。

**第二层：生命周期。**

- **TGT**：用户登录后获取；过期前可凭其换发任意数量的 Service Ticket；过期前可 `kinit -R` 续签（受 renew lifetime 约束，最长 7 天）；7 天后必须重新认证（输密码或重读 keytab）。
- **Service Ticket**：每次访问服务时获取（除非缓存）；过期即失效，必须重新向 TGS 申请；不可续签——这保证短攻击窗口。
- **KDC principal 数据库**：长期存储 principal + 密钥；需定期备份。

**第三层：相互作用。**

- **TGT 是 SSO 的载体**：拿到 TGT 后，访问任意 Service 都不用再输密码——这是 Kerberos 实现 SSO 的核心机制。
- **TGT 与 Service Ticket 的解耦**：TGT 与 Service Ticket 的会话密钥不同，TGS 不能解密 Service Ticket 的内容；攻击者拿到 TGT 仍需每次换 Service Ticket。
- **续签与重新认证**：TGT 在 `renew_lifetime`（最长 7d）内可续签；Service Ticket 必须重新申请。

**第四层：扩展机制。**

- **Cross-Realm TGT**：跨域场景下，Client 在 Realm A 拿 TGT-A，向 Realm A 的 TGS 申请 Realm B 的 TGT-B，再向 Realm B 的 TGS 申请 Service Ticket。
- **Renewable Ticket**：TGT 标记为 renewable，可在过期前续签到 `renew_lifetime` 上限。
- **Postdated Ticket**：申请"未来才生效"的票据（用于预热 / 定时任务）。

**第五层：工业实践。** Windows AD 用户登录拿 TGT（默认 10h，续到 7d）；访问文件服务器拿 Service Ticket（默认 1h）。HDFS NameNode / DataNode 互访走 Service Ticket 体系。阿里云 EMR 用 keytab 让服务进程在启动时拿 TGT，长期运行期间按需换 Service Ticket。LinkedIn 在其数据平台文档中明确"TGT 是 SSO 的根，必须保护好"。

**3. 常见陷阱**

- **混淆 TGT 与 Service Ticket 的有效期意义。** TGT 长是便利（少续签），Service Ticket 短是安全（少攻击窗口），这是设计意图。
- **以为续签是"延长原票据"。** 续签是新票据替换旧票据，旧票据立即失效。
- **忽视 principal 数据库的备份。** KDC 数据库损坏 = 所有票据失效 = 集群停摆。

**4. 追问预测**

- **「TGT 缓存多久合适？」** 答：默认 10h 兼顾便利与安全；高安全场景可缩短到 4h；服务进程按场景延长到 24h 但需配套严格时钟同步。
- **「跨 realm 信任怎么建立？」** 答：两个 realm 的 KDC 共享 inter-realm key；Client 在 Realm A 登录后申请 Realm B 的 TGT，再换 Service Ticket。

**5. 参考资料**

- MIT Kerberos 官方文档关于 Ticket Lifecycle 的章节——票据生命周期的权威说明。
- RFC 4120 §3——Kerberos 票据与认证的标准定义。
- 微软 Active Directory 文档中关于 Kerberos 票据的章节——AD 中 TGT / Service Ticket 的实际实现。
- 《大数据之路：阿里巴巴大数据实践》中关于 Kerberos 票据管理章节。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---
