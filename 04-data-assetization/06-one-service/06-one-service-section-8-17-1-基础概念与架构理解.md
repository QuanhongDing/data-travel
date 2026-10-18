> 本文件是 **06-one-service.md** § 8 面试真题集的子主题。完整章节请回到 [index](06-one-service.md) 或 [§ 8 索引](06-one-service-section-8-sec8.md)。

### 8.5 §17.1 基础概念与架构理解

> 本主题 5 道题覆盖批流一体、湖仓一体、数据安全等基础概念，是 OneService 上下游架构（湖 + 流批 + 安全）的核心考点。

#### §17.1.1 请解释批流一体架构的基本概念，并说明它与传统的 Lambda 架构相比有哪些核心优势与工程代价。

**1. 考察点**

- 是否理解批流一体的"同一份逻辑处理有界与无界流"哲学。
- 能否区分"批流一体"与"批流融合"的差异（API 层 vs 存储层）。
- 是否知道代价（业务改写成本、状态后端选择、调试复杂度）。

**2. 参考答案框架**

**第一层：批流一体的核心概念。** 批流一体（Stream-Batch Unified）是让**同一套计算引擎、同一套 API、同一份代码逻辑**同时处理有界（batch）与无界（stream）数据：

- **Flink 视角**：DataStream API 同时支持 bounded 流（批模式）与 unbounded 流；Table API / SQL 统一语法。
- **Spark 视角**：Structured Streaming 统一 DataFrame API；Dataset API 同时支持静态与流式数据。
- **存储视角**：Delta / Iceberg / Hudi 提供 ACID + 时间旅行，让批流写到同一张表。

**第二层：与 Lambda 的核心差异。**

| 维度 | Lambda | 批流一体 |
| --- | --- | --- |
| 代码 | 批 + 流两份 | 一份 |
| 存储 | 批表 + 实时表 | 单张湖表 |
| 维护 | 口径对账、合并 | 无需对账 |
| 延迟 | 批 T+1 + 流秒级 | 取决于配置（秒 / 分 / 时 / 天） |
| 适用 | 强准确 + 强实时 | 多数业务 |

**第三层：核心优势。**

1. **代码统一**：Flink SQL 或 Spark SQL 同时跑批与流，一份 UDF / 一份业务逻辑。
2. **口径统一**：批流共用同一份计算 → 没有"两套数字"。
3. **存储统一**：单张湖表（Delta / Iceberg）→ 没有双份存储。
4. **运维简化**：一份代码 / 一份监控 / 一份告警。
5. **新人门槛低**：新人只需学 Flink 或 Spark 一个引擎。

**第四层：工程代价。**

1. **业务改造成本**：现有 Lambda 业务需要重写为流批兼容逻辑（如状态管理、窗口语义）。
2. **状态后端**：Flink 状态后端（RocksDB）需独立运维，与 Spark 不同。
3. **调试复杂度**：流批执行计划差异大，调试需要两套工具。
5. **引擎成熟度**：Flink 在 OLAP 场景不如 Spark，Spark 在低延迟不如 Flink，单一引擎覆盖所有场景仍有限制。

**第五层：典型实现路径。**

- **Flink on Paimon / Flink + Iceberg**：湖格式 + Flink 流批一体。
- **Spark Structured Streaming + Delta**：Delta Live Tables。
- **Hudi + Flink / Spark**：Hudi 的多模（COW / MOR）。

**第六层：工业案例。**

- **字节跳动**：Flink 统一批流，覆盖全公司实时 + 离线。
- **阿里**：Flink + MaxCompute 湖仓一体。
- **Shopee**：Flink + Iceberg 流批一体。

**3. 常见陷阱**

- **认为批流一体 = 没有 Lambda**。批流一体不是消灭 Lambda，而是消灭"代码两套"。批快 vs 流快的取舍仍在。
- **状态后端选错**：Flink 默认 HashMapStateBackend 易 OOM，大状态必须用 RocksDBStateBackend。
- **窗口语义混用**：滚动窗口（TUMBLE）vs 滑动窗口（HOP）vs 会话窗口（SESSION）选错会导致数据不一致。

**4. 追问预测**

- **「如何改造 Lambda 到批流一体？」** 答：① 评估业务可改造性；② 选引擎（Flink / Spark）；③ 用湖格式统一存储；④ 业务 SQL 化改写；⑤ 灰度上线。
- **「批流一体的延迟能做到多少？」** 答：Flink 可到秒级（取决于 trigger）；Spark Structured Streaming 可到 100ms（micro-batch）。

**5. 参考资料**

- Apache Flink 官方文档——流批一体的 API 设计。
- Apache Spark Structured Streaming 官方文档——micro-batch 与 continuous 模式。
- Apache Paimon / Flink CDC 官方文档——Flink 湖仓一体。
- 字节跳动 Flink 实践公开技术博客——头部企业的批流一体落地。
- 阿里云《Flink CDC 实践白皮书》。
- **京东电商全链路 Flink + 湖仓一体支持流批** —— 公开技术分享描述了订单 / 营销 / 风控三大场景的批流融合落地。
- **米哈游用 Flink + Iceberg 支撑游戏运营全链路实时指标** —— 公开材料描述了玩家活跃 / 付费 / 留存三类指标的统一计算。
- **网易雷火 MMO 游戏批流一体指标平台** —— 在永劫无间 / 逆水寒的场景数据上落地流批代码统一。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §17.1.2 随着数据隐私和安全法规日益严格，在设计和实施数据湖仓一体架构时，如何确保数据安全与合规？

**1. 考察点**

- 是否熟悉主流法规（GDPR、CCPA、PIPL、《数据安全法》、《个人信息保护法》）。
- 能否把法规要求映射到架构动作（加密、脱敏、访问控制、审计）。
- 是否理解"湖仓一体"在合规上的双重性（数据集中 = 治理容易，但也 = 泄露风险大）。

**2. 参考答案框架**

**第一层：核心法规要求。**

- **GDPR（欧盟）**：数据最小化、被遗忘权、数据保护影响评估（DPIA）、跨境传输限制。
- **CCPA（加州）**：知情权、删除权、opt-out、数据销售限制。
- **PIPL（中国）**：个人信息处理告知同意、敏感信息保护、跨境传输安全评估。
- **金融 / 医疗 / 电信行业法规**：行业特定要求（如 PCI-DSS、HIPAA）。

**第二层：架构层映射。**

| 法规要求 | 架构实现 |
| --- | --- |
| 数据最小化 | 湖仓只存必要字段，敏感字段脱敏 |
| 访问控制 | 行级（RLS）+ 列级（Column-level Security）权限 |
| 加密 | 传输 TLS + 落盘 AES + KMS 密钥管理 |
| 审计 | 所有数据访问记录到 Elasticsearch / 云审计服务 |
| 被遗忘权 | 物理删除（GDPR） + 软删除（审计留痕） |
| 跨境传输 | 数据分区 + 区域隔离 + 数据出境安全评估 |
| 数据分类分级 | 元数据打标（公开 / 内部 / 机密 / 高敏感） |

**第三层：湖仓一体的合规架构。**

```
[数据源] → [加密采集] → [湖仓存储] → [元数据 + 分类分级] → [脱敏/加密 API]
   ↓                ↓              ↓                ↓
[审计日志]    [KMS 密钥]    [ACL / RLS]    [OneService 权限层]
```

**第四层：关键技术组件。**

- **元数据 + 标签**：Apache Atlas / DataHub / Unity Catalog 标记 PII / 敏感字段。
- **脱敏**：动态脱敏（API 层 mask）+ 静态脱敏（湖表层 mask）。
- **加密**：落盘 AES + 字段级加密 + Tokenization。
- **访问控制**：Apache Ranger（行 / 列级）+ OPA（策略）。
- **审计**：全链路 trace + access log + Elasticsearch / 云审计。

**第五层：OneService 层的合规动作。**

- 所有 API 调用带 trace_id + user + tenant + 字段，便于追溯。
- 敏感字段（手机号、身份证）在 API 层自动脱敏（如 `138****5678`）。
- 用户主动删除时，调用 API 层触发湖表物理删除 + 缓存清理。
- 数据出境必须走专用 API + 加密 + 审计留痕。

**第六层：工业案例。**

- **Apple Differential Privacy**：在 iOS 端做差分隐私，云端看不到原始数据。
- **Google Cloud DLP**：自动检测 + 脱敏 PII 字段。
- **阿里云 DataWorks + MaxCompute**：合规分级 + LabelSecurity + 数据审计。
- **Snowflake**：列级安全 + 行级策略 + HIPAA / PCI-DSS 认证。

**3. 常见陷阱**

- **加密只在落盘做**。传输不加密（TLS）→ 中间人攻击风险。
- **脱敏只在应用层做**。开发人员直接查湖表 → 原始数据泄露。
- **审计只看访问成功**。失败访问也要审计——异常模式往往是攻击前兆。
- **KMS 密钥管理松散**。一把密钥管所有数据 → 一旦泄露全盘崩。

**4. 追问预测**

- **「GDPR 被遗忘权怎么实现？」** 答：物理删除 + 副本同步清理 + 审计留痕 + 缓存清理；需要湖表支持按主键快速定位 + 删除。
- **「差分隐私怎么落地？」** 答：在数据导出或 API 层加噪声（拉普拉斯 / 高斯机制）；用于 BI 聚合而非原始记录。

**5. 参考资料**

- GDPR / CCPA / PIPL 法规原文——合规基线。
- Apache Ranger / Apache Atlas 官方文档——大数据合规框架。
- Apple Differential Privacy 论文——差分隐私工业实践。
- Google Cloud DLP / AWS Macie 官方文档——云上 PII 治理。
- 阿里云 DataWorks 安全白皮书——国内合规范式。
- **招商银行通过湖仓分级 + LabelSecurity 满足金融监管** —— 公开案例描述了零售客户数据在湖仓上的分类分级 + 行级权限。
- **微医在医疗数据上做严格 PII 脱敏 + 审计** —— 满足医疗合规要求，公开材料描述了患者字段的动态脱敏实现。
- **平安好医生数据中台的患者隐私保护** —— 公开技术分享描述了医疗敏感字段的端到端审计 + 加密。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §17.1.3 在构建批流一体与数据湖仓一体架构时，通常会面临哪些技术挑战？请结合你的经验谈谈解法。

**1. 考察点**

- 是否有真实落地经验（不是泛泛谈概念）。
- 能否列出具体技术挑战（口径、性能、状态、治理）。
- 解法是否分层（架构层 / 引擎层 / 业务层）。

**2. 参考答案框架**

**第一层：四大类挑战。**

1. **口径一致**：批流不同时间点算同一指标，数字对不上。
2. **性能与成本**：湖表的 IO、计算资源消耗、状态后端。
3. **状态管理**：Flink 流处理状态膨胀、checkpoint / savepoint 恢复。
4. **治理与可观测**：血缘、监控、告警、变更管理。

**第二层：口径一致的挑战与解法。**

- **挑战**：批用 T-1 数据，流用 latest 数据，聚合结果有差异。
- **解法**：
  - 指标原子化（原子指标 + 维度 + 修饰词）。
  - 批流共用 UDF / SQL 模板。
  - 服务层做"对账任务"日终对比差异。
  - 业务侧统一指标 Owner 制度。

**第三层：性能与成本的挑战与解法。**

- **挑战**：湖表 list 操作慢、min/max 索引对低基数列无效、小文件问题。
- **解法**：
  - 用 Iceberg / Delta 的统计信息优化（min/max / Bloom Filter / ZORDER）。
  - 周期 compaction 合并小文件（参见 §6.6.4）。
  - OLAP 副本（Doris / ClickHouse）分担查询负载。
  - 冷热分层（热数据 SSD，冷数据 OSS / S3 IA）。

**第四层：状态管理的挑战与解法。**

- **挑战**：Flink 状态后端膨胀、checkpoint 慢、savepoint 恢复时间长。
- **解法**：
  - RocksDB state backend（可扩到 TB 级状态）。
  - 增量 checkpoint + RocksDB LSM 压缩。
  - 状态 TTL / 状态清理（避免无界增长）。
  - Savepoint 存对象存储 + 跨集群恢复。

**第五层：治理与可观测的挑战与解法。**

- **挑战**：万级表的血缘、监控、变更审批无法靠人工。
- **解法**：
  - 全链路血缘（OpenLineage + DataHub / Unity Catalog）。
  - 统一监控（Prometheus + Grafana + 业务监控）。
  - 变更评审（PR + Owner 制度 + 灰度发布）。
  - 自动告警（指标异常检测 + LLM 阈值告警）。

**第六层：真实落地经验教训。**

- **Uber 公开案例**：迁移到 Hudi 后遇到增量读性能问题，通过 `COPY_ON_WRITE` + 定期 compaction 优化。
- **Netflix 公开案例**：Iceberg 流批一体迁移中遇到过 ZORDER 选错列导致查询慢，回退到分桶。
- **阿里公开案例**：Flink + MaxCompute 湖仓一体中状态后端从 HashMap 迁到 RocksDB，状态容量从 GB 级扩到 TB 级。

**3. 常见陷阱**

- **只谈技术不谈组织**：口径治理需要 Owner 制度配合，没有组织的架构改不动。
- **盲目上湖格式**：传统 Hive 数仓可以先优化，不必一步到位 Delta / Iceberg。
- **忽视团队技能**：Flink 学习曲线陡，新人上手慢，要预留培训成本。

**4. 追问预测**

- **「口径治理落地难怎么办？」** 答：先从最高频 10 个指标入手，强制 Owner 制度 + 强制指标平台化；其他指标逐步迁移。
- **「湖仓一体迁移周期多长？」** 答：典型 12-18 个月，分阶段（试点 → 单业务线 → 全集团），不要一步到位。

**5. 参考资料**

- Uber Engineering 关于 Hudi 落地的公开文章。
- Netflix Tech Blog 关于 Iceberg 迁移的系列文章。
- 阿里云 Flink CDC 与湖仓一体白皮书。
- Apache Flink / Delta / Iceberg 官方文档。
- **Shein 在 PB 级订单数据上做湖仓迁移** —— 公开案例描述了分阶段推进避免一次性切换风险的工程经验。
- **京东物流 Flink + 湖仓落地后状态后端从 HashMap 迁到 RocksDB** —— 公开材料描述了状态容量从 GB 级扩到 TB 级的实践。
- **米哈游游戏运营指标从 Lambda 迁到湖仓一体** —— 公开技术分享描述了口径治理与状态管理的联合改造。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §17.1.4 请阐述数据湖仓一体架构的设计理念，并说明它如何同时满足数据湖的灵活性和数据仓库的高性能。

**1. 考察点**

- 是否理解湖仓一体的"取湖与仓之长"的哲学。
- 能否说清湖的"灵活"与仓的"高性能"在架构上如何兼顾。
- 是否知道具体技术实现路径。

**2. 参考答案框架**

**第一层：湖仓一体的设计理念。** Lakehouse 是 Databricks 提出的架构概念，核心是**用一套存储 + 一套元数据，同时具备湖的灵活性与仓的高性能**：

- **湖的灵活**：Schema-on-read、廉价存储、多计算引擎、多模态数据（结构化 + 半结构化 + 非结构化）。
- **仓的高性能**：ACID 事务、统计信息、谓词下推、列存压缩、向量执行。

**第二层：关键技术——湖格式。** Delta / Iceberg / Hudi 把"湖"升级为"湖仓"：

| 能力 | 传统湖 | 湖仓 |
| --- | --- | --- |
| 事务 | 无 | ACID |
| Schema | on-read | on-read + on-write |
| 时间旅行 | 无 | 有 |
| 统计信息 | 无 | min/max / null count |
| 流批统一 | 弱 | 原生支持 |
| 索引 | 无 | ZORDER / Bloom Filter |

**第三层：湖的灵活性如何保留。**

- **廉价存储**：仍基于对象存储（S3 / OSS / GCS），不引入专用硬件。
- **多模态**：结构化（Delta 表）+ 半结构化（JSON）+ 非结构化（图片）共存。
- **多引擎**：同一份数据可被 Spark / Flink / Trino / Athena 消费。
- **Schema 演进**：列加 / 删 / 改类型平滑过渡。

**第四层：仓的高性能如何达成。**

- **列存 + 压缩**：Parquet / ORC + ZSTD。
- **统计信息**：min/max 让谓词下推到文件级，跳过无关文件。
- **向量化执行**：Photon / Velox / ClickHouse 利用 SIMD 提升聚合性能。
- **缓存**：湖表本地缓存 + 远程 cache（Alluxio / JindoFS）。

**第五层：架构示意。**

```
[数据源] → [湖格式 (Delta/Iceberg/Hudi)] → [计算引擎 (Spark/Flink/Trino)]
   ↓            ↓                                      ↓
[对象存储]  [元数据 (Hive Metastore /     [OLAP (Doris/ClickHouse)]
            Polaris / Unity Catalog)]              ↓
                                          [OneService API / BI]
```

- 湖格式提供存储 + 事务 + 时间旅行。
- 计算引擎提供 SQL / DataFrame / 流处理能力。
- OLAP 副本分担高并发查询。
- OneService API 统一对外服务化。

**第六层：工业案例。**

- **Databricks Delta + Photon**：湖仓一体的产品化代表。
- **Netflix Keystone 迁移到 Iceberg**：从 Lambda 迁到湖仓一体的头部案例。
- **Uber Hudi**：增量处理的湖仓形态。
- **阿里 MaxCompute + Flink 湖仓一体**：国内大厂的湖仓架构。

**3. 常见陷阱**

- **认为湖仓一体 = 数据湖 + 数据仓**。不是简单叠加，而是同一份存储 + 同一份元数据。
- **湖格式选错**。Delta 偏 Databricks 生态；Iceberg 偏多引擎；Hudi 偏增量 CDC。
- **忽略 OLAP 副本**。湖表本身查询性能不如 OLAP 引擎，高并发场景必须有 Doris / ClickHouse 副本。

**4. 追问预测**

- **「湖仓 vs 传统仓的查询性能对比？」** 答：湖格式 + 列存 + 向量化执行（如 Photon）已接近 MPP 数仓性能；OLAP 副本更是亚秒级。
- **「湖仓的成本优势？」** 答：廉价对象存储 + 弹性计算，相比传统 MPP（如 Teradata / Vertica）成本下降显著（【经验】档：降幅随数据冷热分层、计算弹性程度与采购方式而异，本节无法给出可溯源的统一数字，引用时请自行查证）。

**5. 参考资料**

- Michael Armbrust 等人《Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics》——湖仓一体原始论文。
- Delta / Iceberg / Hudi 官方文档。
- Databricks《Lakehouse Platform》白皮书。
- 阿里云《MaxCompute 湖仓一体白皮书》。
- **米哈游游戏数据湖仓一体支持玩家行为实时查询与历史回溯** —— 公开技术分享描述了游戏内行为指标的湖仓存储与查询性能。
- **中国电信计费数据湖仓架构承载 PB 级话单数据** —— 公开材料描述了全国计费明细从传统数仓迁到湖仓的工程取舍。
- **美的集团工业互联网平台湖仓架构统一设备遥测** —— 公开案例显示设备画像查询从分钟级降到秒级。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §17.1.5 请比较分析当前业界主流的几种批流一体技术方案（例如 Flink、Spark Structured Streaming、Materialize 等）的差异与适用场景。

**1. 考察点**

- 是否真正理解各引擎的内部差异（不只是"会背特性"）。
- 能否从多个维度（API、性能、生态、运维）比较。
- 是否知道 Materialize / RisingWave 等流数据库与 Flink / Spark 的差异。

**2. 参考答案框架**

**第一层：四个引擎的基本定位。**

- **Flink**：原生流处理引擎，DataStream API + Table/SQL API；流批一体通过 bounded / unbounded 流抽象。
- **Spark Structured Streaming**：基于 Spark SQL 的流处理，micro-batch 为主；可与 Spark Batch 共用 DataFrame API。
- **Materialize**：基于 Timely Dataflow 的流数据库，SQL 接口，Materialized Views 增量维护。
- **RisingWave**：类 Materialize 的云原生流数据库，PostgreSQL 兼容接口。

**第二层：核心差异对比。**

| 维度 | Flink | Spark Structured Streaming | Materialize | RisingWave |
| --- | --- | --- | --- | --- |
| 流处理模型 | Native Streaming | Micro-batch | Native Streaming | Native Streaming |
| 延迟 | ms~s | 100ms~s | ms | ms |
| API | DataStream + Table/SQL | DataFrame / SQL | SQL | SQL + PG 兼容 |
| 状态后端 | RocksDB / HashMap | 无（依赖 checkpoint） | 内存 + 持久化 | RocksDB |
| 生态 | 流为主，OLAP 弱 | 与 Spark 生态完全打通 | 流数据库 | 云原生流数据库 |
| 适用 | 复杂流处理、CEP | 批为主 + 简单流 | 流式物化视图 | 云上实时数仓 |

**第三层：Flink 的适用场景。**

- **强项**：复杂事件处理（CEP）、状态可观测、低延迟、Exactly-Once、Savepoint 恢复。
- **弱项**：OLAP 查询性能不如 Spark / ClickHouse、运维复杂度高。
- **典型用户**：字节跳动、阿里、美团、Uber——批流一体的大数据平台。

**第四层：Spark Structured Streaming 的适用场景。**

- **强项**：与 Spark Batch 复用、列存优化（Photon）、流批代码统一、批为主 + 简单流。
- **弱项**：micro-batch 延迟（100ms+）、状态管理不如 Flink。
- **典型用户**：Netflix、Databricks——湖仓一体、BI + ML 场景。

**第五层：Materialize / RisingWave 的适用场景。**

- **强项**：流数据库，Materialized Views 增量维护、PostgreSQL 兼容接口、低延迟。
- **弱项**：生态较小、复杂流处理能力不如 Flink。
- **典型用户**：SaaS、互联网应用——希望用 SQL 直接做流处理，避免复杂引擎运维。

**第六层：选型决策。**

```
你的主要场景是什么？
├── 复杂流处理（CEP / 风控 / 实时推荐） → Flink
├── 批为主 + 简单流（数据仓库 / 湖仓）  → Spark Structured Streaming
├── 流式物化视图（实时数仓 / 实时 BI） → Materialize / RisingWave
└── 不确定 → 从 Spark Structured Streaming 起步
```

**第七层：OneService 视角。** 在 OneService 场景中，**Flink 适合写实时明细层（DWD / DWS 实时部分）**，**Spark 适合写批处理层（DWD / DWS 离线部分）**，**Materialize / RisingWave 适合 OneService API 的实时 OLAP 副本**。

**3. 常见陷阱**

- **Flink 一切**。Flink 不是万能，OLAP 场景不如 Spark / ClickHouse。
- **Materialize 替代 Flink**。Materialize 不能做 CEP，Flink 仍是复杂流处理首选。
- **混用过度**。Flink + Spark + Materialize 同时上 → 运维崩溃；先收敛到 1-2 个引擎。

**4. 追问预测**

- **「Flink 状态后端选什么？」** 答：默认 HashMapStateBackend（小状态、纯内存）；大状态必须 RocksDBStateBackend（可扩到 TB 级）。
- **「Spark Structured Streaming 能做 CEP 吗？」** 答：弱支持，复杂 CEP 仍建议 Flink。

**5. 参考资料**

- Apache Flink 官方文档——流处理引擎的工业标杆。
- Apache Spark Structured Streaming 官方文档。
- Materialize 官方文档——基于 Timely Dataflow 的流数据库。
- RisingWave 官方文档——云原生流数据库。
- 字节跳动 / 阿里 Flink 实践公开技术博客。
- **京东电商指标同时使用 Flink 与 Spark 分场景选型** —— 公开材料描述了风控 / 营销 / 报表三类场景的引擎分工。
- **滴滴实时订单分配以 Flink 为主 + BI 报表以 Spark 为主** —— 公开案例显示订单撮合与历史分析两条链路的引擎选型。
- **网易雷火 MMO 游戏批流一体用 Flink 处理实时战斗日志 + Spark 处理离线分析** —— 公开技术分享描述了引擎混部的工程实践。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---
