> 本文件是 **03-build-vs-buy.md** §8 面试真题集的子主题。完整章节请回到 [index](03-build-vs-buy.md) 或 [§8 索引](03-build-vs-buy-section-8-sec8.md)。

### 8.6 §14.4 流处理框架技术选型与适用（Flink / Spark Streaming / Kafka Streams）

> 本主题考察「**流处理引擎的 Buy 侧选型**」——三大主流流处理框架（Flink、Spark Streaming / Structured Streaming、Kafka Streams）的能力边界、适用场景与工程取舍。这是实时数据架构的"买什么引擎"决策，直接影响延迟、吞吐、状态管理与运维复杂度。

#### §14.4.1 请简要说明 Flink、Spark Streaming 和 Kafka Streams 这三种流处理框架各自的核心设计理念、典型适用场景，以及"低延迟 / 高吞吐 / 生态集成"三个维度上各自的强弱。

**1. 考察点**

- 是否能从"**流是一等公民还是微批**"这条主轴区分三者。
- 能否讲清各自适用场景：Flink = 真流式 + 状态大、Spark Structured Streaming = 微批 + 生态融合、Kafka Streams = 库级 + 轻量。
- 加分项：能把三者放到"流批一体"演进背景下讨论。

**2. 参考答案框架**

**第一层：核心设计理念。**

- **Apache Flink**：**原生流处理（Native Streaming）**——把"流"当作一等公民，批只是"有界流"的特例。核心抽象是 `DataStream` / `Table` API，执行引擎以事件为单位流动，**事件时间（Event Time）+ 水位线（Watermark）** 原生支持。状态管理是一等公民（Keyed State / Operator State），checkpoint / savepoint 提供精确一次（Exactly-Once）语义。
- **Spark Structured Streaming**：**微批（Micro-batch）为骨、Continuous 模式为辅**——把流当作"无界表"，按固定间隔（如 1s–1min）切批处理。核心是 `DataFrame` / `Dataset` API，复用 Spark SQL 优化器；自 Spark 2.3（2018）引入 Continuous Processing 模式做低延迟（但长期处于实验性、功能受限）。
- **Kafka Streams**：**库（Library）而非引擎**——应用内嵌的流处理库，读写都绑定 Kafka，无独立集群。核心是基于 Kafka 分区做并行，用 **KTable / KStream / GlobalKTable** 抽象流与表。适合"轻量、单一 Kafka 数据源、应用内嵌"场景。

**第二层：三维度强弱。**

| 维度 | Flink | Spark Structured Streaming | Kafka Streams |
| --- | --- | --- | --- |
| 低延迟 | **强**（毫秒级） | 弱（秒级起，微批） | 中（毫秒–秒） |
| 高吞吐 | 强 | **强**（微批攒批） | 中（受 Kafka 分区限制） |
| 状态管理 | **强**（大规模 keyed state + savepoint） | 中（状态有限制） | 中（状态存 local store / RocksDB） |
| Exactly-Once | **强**（checkpoint + 两阶段提交 sink） | 强（幂等 sink） | 强（Kafka 事务） |
| 生态集成 | 强（多源多汇） | **强**（Spark 生态 + 湖仓） | 弱（仅 Kafka 生态） |
| 运维复杂度 | 高（集群 + checkpoint） | 中（Spark 集群） | **低**（应用内嵌） |

**第三层：典型场景。** ① **Flink**——实时风控、实时推荐、实时数仓（流式 ETL）、需要事件时间 / 乱序 / 复杂 CEP（复杂事件处理）。② **Spark Structured Streaming**——准实时 ETL、与批处理共代码的流批一体、湖表写入（Delta / Iceberg）。③ **Kafka Streams**——轻量微服务、Kafka 数据清洗 / 转换、无需独立集群的场景。

**第四层：选型建议。** ① **要求毫秒级 + 复杂状态**——Flink。② **要求与离线共用代码 + 湖仓**——Spark Structured Streaming。③ **简单 Kafka 流处理 / 微服务内嵌**——Kafka Streams。④ **国内实时数仓主流**——Flink（阿里 / 字节 / 美团等团队在实时数仓中采用 Flink；本节未附可核验的出处，此处按【经验】档处理）。

**3. 常见陷阱**

- **把 Spark Streaming（DStream 老 API）与 Structured Streaming 混为一谈**。前者是 RDD 微批、已不推荐；后者是 DataFrame 微批，是当前主流。
- **认为 Flink 只能做流**。Flink 也支持批（有界流），是流批一体的。
- **忽略 Kafka Streams 的"库"属性**。它不需要独立集群，运维成本最低——但也因此能力受限。
- **不提事件时间 / 水位线**。这是 Flink 区别于微批的关键，实时乱序场景必须提。

**4. 追问预测**

- **「Flink 的 checkpoint 与 Kafka 的 offset 提交如何协同？」** 答：Flink 用两阶段提交 sink（TwoPhaseCommitSinkFunction），checkpoint 完成时统一提交 offset；保证端到端 exactly-once。
- **「Spark Structured Streaming 能做毫秒级吗？」** 答：Continuous Processing 模式可到毫秒级，但特性支持有限（不支持聚合、join 受限）；主流还是微批秒级。
- **「Kafka Streams 的状态存哪？」** 答：默认存 local RocksDB（per task）+ changelog topic（备份）；task 迁移时从 changelog 恢复。
- **「Flink 与 Spark 能共存吗？」** 答：能——Flink 做实时链路，Spark 做批与回刷，二者共享湖表与口径。
- **「为什么国内实时数仓偏好 Flink？」** 答：Flink 的原生流 + 状态管理 + 事件时间更契合"实时数仓"需求；阿里 Blink 项目对 Flink 社区的贡献是国内生态快速成熟的因素之一（方向性判断，本节未附可核验出处）。

**5. 参考资料**

- Apache Flink 官方文档——事件时间、水位线、状态、checkpoint / savepoint 的权威定义。
- Apache Spark 官方文档中"Structured Streaming"——微批模型与 Continuous Processing。
- Apache Kafka 官方文档中"Kafka Streams"——KStream / KTable 抽象与状态存储。
- 阿里 Blink / Flink 相关公开技术博客——Flink 在国内实时数仓的大规模实践。
- 字节跳动 / 美团技术团队公开博客关于实时计算平台的分享——Flink 大规模部署经验。
- Netflix / Uber Engineering 关于流处理选型的公开文章——大规模流处理引擎的工程取舍。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。

> 注：上列条目分两类。第一类是官方文档类（Apache Flink / Spark / Kafka 官方文档与设计文档，Apache Iceberg / Hudi 的 connector 文档），可按名称检索到对应材料，本书未附精确链接。第二类只给「团队 / 公司 + 主题或实践描述」（含「大规模」「PB 级」等规模说法，以及形如「**某公司** —— 某公司的某实践」的条目），未给文档名与年份，**本书无法给出其可核验出处**，一律按【经验】档理解，请勿当作可引用的事实来源。

---

#### §14.4.2 请深入分析 Flink 的流处理引擎在状态管理和容错机制方面，相比 Spark Streaming 的优势与代价，并说明在什么场景下应该选 Flink、什么场景下选 Spark Streaming。

**1. 考察点**

- 是否理解 Flink 的 **State Backend（RocksDB / Heap）+ Checkpoint + Savepoint** 与 Spark 的 **State Store（HDFSBackedStateStoreProvider / RocksDBStateStoreProvider）+ 微批幂等** 的机制差异。
- 能否讲清"以状态管理和容错换取的代价"——资源常驻、运维复杂。
- 加分项：能给出具体的状态规模数字与失败恢复时间（RTO）对比。

**2. 参考答案框架**

**第一层：状态管理机制差异。**

**① Flink**：
- **状态抽象**——Keyed State（ValueState / ListState / MapState / ReducingState / AggregatingState）与 Operator State（List / Union / Broadcast）。状态按 key 分区，天然随并行度伸缩。
- **State Backend**——`HashMapStateBackend`（堆内，快但受 JVM 内存限制）与 `EmbeddedRocksDBStateBackend`（堆外 + 本地磁盘，支持 TB 级状态）。
- **增量 checkpoints**——RocksDB 支持增量 checkpoint，只传变化部分，大幅降低 checkpoint 开销。
- **Savepoint**——手动触发的、可迁移的状态快照，支持作业"停机升级后从 savepoint 恢复"，是运维利器。

**② Spark Structured Streaming**：
- **状态抽象**——仅 `mapGroupsWithState` / `flatMapGroupsWithState` 的有限状态 + 内置算子状态（如 `dropDuplicates` 的水位线状态）。
- **State Store**——可插拔的 provider：`HDFSBackedStateStoreProvider`（存 HDFS，Spark 3.5 及以前为默认）与 `RocksDBStateStoreProvider`（本地 KV，早期版本文档标注为实验性）；默认值随 Spark 版本演进，请以所用版本的官方文档为准。状态有大小限制（默认 watermark 之外的状态会被清理）。
- **微批 checkpoint**——每个 micro-batch 完成后写 offset + 状态到 checkpoint location；恢复时从 checkpoint 重放。
- **无 savepoint**——Spark 没有 Flink 那样的 savepoint 机制，状态迁移能力弱。

**第二层：容错机制差异。** ① **Flink**——基于 **Chandy-Lamport 分布式快照**：JobManager 定期向 Source 注入 barrier，算子按 barrier 对齐后触发快照（反压严重时可用 Unaligned Checkpoint 免去对齐等待，两种模式都保持 exactly-once）；端到端 exactly-once 通过两阶段提交 sink 实现。② **Spark**——基于 **micro-batch 幂等重放**：每个 batch 有唯一 id，失败重跑该 batch；sink 需幂等（或用事务 sink 如 Delta / Iceberg 的原子提交）。**本质差异**：Flink 是"流式快照"，Spark 是"批级重放"。

**第三层：代价对比。**

| 维度 | Flink | Spark Structured Streaming |
| --- | --- | --- |
| 状态规模 | TB 级（RocksDB） | GB 级（后端限制） |
| 恢复时间（RTO） | 中（从最近 checkpoint / savepoint） | 中（从最近 batch checkpoint） |
| 资源常驻 | 高（长驻 TaskManager） | 中（Spark executor） |
| 运维复杂度 | 高（checkpoint / savepoint / state backend 调优） | 中 |
| 反压处理 | 强（基于信用 / 流量控制） | 中（微批天然缓冲） |
| 端到端 Exactly-Once | 强 | 强（需幂等 sink） |
| 状态迁移 | 强（savepoint） | 弱 |

**第四层：选型判断。** ① **选 Flink**——要求毫秒级延迟、大状态（>几十 GB）、事件时间 / 乱序、CEP、需要状态迁移（savepoint）、实时风控 / 推荐。② **选 Spark Structured Streaming**——要求与批处理共用代码（流批一体）、秒级延迟可接受、状态小、深度绑定 Spark 生态与湖仓、团队 Spark 经验丰富。③ **混合**——Flink 做核心实时链路，Spark 做实时链路的回刷与湖表批量写入。

**3. 常见陷阱**

- **只说 Flink 好**。必须讲清 Flink 的代价（资源常驻、运维复杂、调优门槛高）。
- **忽略状态规模是选型关键**。大状态场景 Spark 会受限，小状态场景 Flink 的运维投入可能不值得。
- **把"Exactly-Once"当作零成本**。两阶段提交 sink 要求下游支持事务或幂等，否则只能到 at-least-once。
- **不区分 checkpoint 与 savepoint**。checkpoint 是自动容错、savepoint 是手动状态管理——二者用途不同。

**4. 追问预测**

- **「checkpoint 频繁失败怎么办？」** 答：先看反压（barrier 对齐耗时）；调大 checkpoint 间隔 / 超时；开启 Unaligned Checkpoint 抗反压；检查 RocksDB 状态是否过大。
- **「状态太大导致恢复慢怎么办？」** 答：用增量 checkpoint + RocksDB backend；把状态按 key 拆分（避免单 key 热点）；用 savepoint 做分片迁移。
- **「Spark 能做 exactly-once 吗？」** 答：能，但要求 sink 幂等（如写 Delta / Iceberg 的原子提交、或 Kafka 事务 sink）；否则是 at-least-once。
- **「水位线（watermark）与状态清理的关系？」** 答：超过水位线的迟到数据被丢弃（或走 side output），对应状态可被清理——这是控制状态规模的关键。
- **「Flink 的 Unaligned Checkpoint 是什么？」** 答：反压时不再等待 barrier 对齐，而是把 barrier 后的数据一并快照——降低反压下的 checkpoint 延迟，代价是 checkpoint 体积增大。

**5. 参考资料**

- Apache Flink 官方文档中"State & Fault Tolerance"——状态类型、state backend、checkpoint / savepoint 的权威定义。
- Apache Spark 官方文档中"Stateful Operations"——状态算子与 State Store 实现。
- Flink 关于 Chandy-Lamport 快照与 Unaligned Checkpoint 的官方设计文档。
- 阿里 Blink / Ververica 关于大规模 checkpoint 调优的公开技术文章。
- 字节跳动 / 美团技术团队公开博客关于 Flink 状态管理与容错的实践。
- Uber Engineering 关于流处理引擎选型的公开分享——Flink vs Spark 的工程判断。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。

> 注：上列条目分两类。第一类是官方文档类（Apache Flink / Spark / Kafka 官方文档与设计文档，Apache Iceberg / Hudi 的 connector 文档），可按名称检索到对应材料，本书未附精确链接。第二类只给「团队 / 公司 + 主题或实践描述」（含「大规模」「PB 级」等规模说法，以及形如「**某公司** —— 某公司的某实践」的条目），未给文档名与年份，**本书无法给出其可核验出处**，一律按【经验】档理解，请勿当作可引用的事实来源。

---


#### §14.4.3 假设你需要设计一个能够同时支撑实时推荐、实时风控和实时数据湖入湖的流处理平台，请阐述在引擎选型、多租户隔离、状态管理与数据一致性四条主线上的设计取舍。

**1. 考察点**

- 是否能把这三种业务（推荐 / 风控 / 入湖）的**差异化需求**拆清楚：延迟、状态规模、一致性语义不同。
- 能否给出平台的**同构化设计**——一套引擎承载多场景，同时保证隔离。
- 加分项：能讲清"用一个引擎 vs 多引擎"的取舍与 TCO。

**2. 参考答案框架**

**第一层：三类业务的差异化需求。**

| 业务 | 延迟 | 状态规模 | 一致性语义 | 特征 |
| --- | --- | --- | --- | --- |
| 实时推荐 | 50–200ms | 中（用户 + 物品特征） | at-least-once 可接受 | 高 QPS、有外部特征库 |
| 实时风控 | 50–100ms | 大（用户行为画像、规则状态） | **exactly-once** | 强状态、规则引擎 |
| 实时入湖 | 秒级–分钟级 | 小（无状态） | exactly-once（幂等） | 数据量大、批量写湖 |

**第二层：引擎选型。** 首选 **Flink**——统一承载三者：① 推荐用 Flink 的 DataStream + 异步 I/O 查在线特征库。② 风控用 Flink 的 Keyed State（RocksDB backend）+ CEP / 规则引擎。③ 入湖用 Flink 的 Table API / Connector 写 Iceberg / Hudi（两阶段提交 sink）。**备选**：入湖也可用 Spark Structured Streaming（微批写湖），但"一套引擎"更利于复用与运维。

**第三层：多租户隔离。** ① **作业级隔离**——每个业务一个 Flink Job，独立 checkpoint / savepoint；通过 K8s namespace 或 Flink Session Cluster 的独立 Cluster 隔离。② **资源隔离**——K8s 下用 ResourceQuota + Request/Limit；Flink on K8s 的 JobManager / TaskManager 独立部署。③ **网络 / 存储隔离**——独立 checkpoint 存储路径（S3 bucket 前缀）、独立 Kafka 消费组。④ **优先级**——风控 > 推荐 > 入湖，通过独立集群 + 资源配额保障。

**第四层：状态管理。** ① **状态后端**——统一用 RocksDB backend，支持大状态 + 增量 checkpoint。② **状态分片**——大状态作业按 key 合理设计（避免热点 key），必要时把状态外部化（放 Redis / 特征库）。③ **状态 TTL**——为推荐 / 风控的临时状态设 TTL，避免无限增长。④ **状态迁移**——用 savepoint 做作业升级 / 扩缩容迁移。

**第五层：数据一致性。** ① **端到端 exactly-once**——Flink 两阶段提交 sink 写 Kafka（事务）/ 湖表（原子提交）。② **对账**——入湖链路做行数 / 指标对账，与离线结果比对。③ **幂等兜底**——推荐 / 风控的副作用（如写在线库）用业务主键幂等，容忍 at-least-once。④ **回放能力**——Kafka 保留足够长的 offset，保证故障时可回放。

**第六层：平台化收益（TCO）。** 一套引擎降低学习 / 运维成本、统一监控与告警、统一 agent（connector 复用）；代价是"用同一引擎适配所有场景"可能在某些场景非最优（如超低延迟场景）。总体在中等规模以上平台，**统一 Flink 平台的 TCO 显著低于多引擎并存**。

**3. 常见陷阱**

- **三业务用三个引擎**。引入多套运维体系，TCO 高且难统一监控。
- **忽视状态规模差异**。推荐 / 风控的状态若混在一个作业，热点与规模会互相拖累。
- **只讲引擎不讲隔离**。平台化的核心是隔离与配额，不讲会被判为"没做过平台"。
- **忽略 exactly-once 的代价**。两阶段提交 sink 对下游有要求，不是所有 sink 都支持。

**4. 追问预测**

- **「推荐为什么要异步 I/O 查特征库？」** 答：同步查会阻塞算子线程，降低吞吐；异步 I/O 并行发起请求，Flink 的 `AsyncDataStream` 提供能力。
- **「风控规则变更如何热更新？」** 答：用 Flink Broadcast State 广播规则，或规则放外部（如规则引擎 / Redis）由算子实时读取。
- **「Flink on K8s 的作业提交流程？」** 答：Application Mode + Flink Operator（Kubernetes Operator）提交；资源用 ResourceQuota 限制。
- **「入湖链路的反压怎么处理？」** 答：调大 sink 并行度 / 攒批（batch interval + buffer size）；写湖失败重试 + 死信队列。
- **「多租户的 checkpoint 存储如何隔离？」** 答：每租户独立 S3 前缀 + 独立 checkpoint；限制并发 checkpoint 数。

**5. 参考资料**

- Apache Flink 官方文档中"Flink on Kubernetes"与"Async I/O"——多租户与异步访问的官方指南。
- 阿里 / 字节公开技术博客关于实时计算平台的分享——多业务统一 Flink 平台的设计。
- 美团技术团队公开博客关于实时风控 / 实时推荐的分享——Flink 状态与规则引擎实践。
- Uber Engineering 关于实时流处理平台的公开文章——多业务流处理平台的隔离与配额。
- Apache Iceberg / Hudi 官方文档中 Flink connector——流式入湖的两阶段提交实现。
- Netflix Technology Blog 关于实时数据管道的公开文章——流处理平台的容错与一致性。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。

> 注：上列条目分两类。第一类是官方文档类（Apache Flink / Spark / Kafka 官方文档与设计文档，Apache Iceberg / Hudi 的 connector 文档），可按名称检索到对应材料，本书未附精确链接。第二类只给「团队 / 公司 + 主题或实践描述」（含「大规模」「PB 级」等规模说法，以及形如「**某公司** —— 某公司的某实践」的条目），未给文档名与年份，**本书无法给出其可核验出处**，一律按【经验】档理解，请勿当作可引用的事实来源。

---

#### §14.4.4 在构建一个要求低延迟、高吞吐且需要精确一次（Exactly-Once）语义的实时数据管道时，请阐述如何设计端到端一致性，并说明在 Flink / Spark Streaming / Kafka Streams 三种引擎下的实现差异。

**1. 考察点**

- 是否能区分"**引擎内部 exactly-once**"与"**端到端 exactly-once**"。
- 能否讲清实现端到端一致性的三种范式：**两阶段提交（2PC）、幂等写入、事务性 Kafka sink**。
- 加分项：能给出具体的失败场景（checkpoint 后下游失败、sink 部分写成功）与兜底策略。

**2. 参考答案框架**

**第一层：端到端一致性的三个环节。** ① **Source 端**——如何记录消费位置（offset / binlog position），保证故障恢复后不丢 / 不重。② **处理端**——状态一致性（引擎快照机制）。③ **Sink 端**——如何保证写入下游"要么全成功、要么全失败"（幂等 / 事务）。

**第二层：三种实现范式。**
- **两阶段提交（2PC）**——Flink 的 `TwoPhaseCommitSinkFunction`：checkpoint 对齐时 sink 预提交（写临时文件 / 开事务），checkpoint 完成时统一提交；失败回滚。
- **幂等写入**——sink 支持按主键 upsert（如 JDBC 主键、Upsert Kafka、Iceberg MERGE），重复写幂等。
- **事务性 sink**——Kafka 事务（`beginTransaction / commit`）、湖表原子提交（Iceberg snapshot / Delta commit）。

**第三层：三引擎的实现差异。**

**① Flink**：
- **内部**——Chandy-Lamport 快照，checkpoint 包含状态 + offset。
- **端到端**——2PC sink（两阶段提交），要求源支持 offset 可回放（Kafka）、sink 支持事务 / 幂等。**Flink 是三者中端到端 exactly-once 支持最完整的**。
- **代价**——checkpoint 期间延迟抖动，sink 需要事务支持。

**② Spark Structured Streaming**：
- **内部**——micro-batch 级 checkpoint（offset + 状态到 checkpoint location）。
- **端到端**——通过 **幂等 sink**（`foreachBatch` + 幂等 upsert）实现；或使用 Delta / Iceberg 的原子提交（写湖表）。
- **代价**——微批延迟；对 sink 幂等性要求高；无 2PC 通用机制。

**③ Kafka Streams**：
- **内部**——状态存 local RocksDB + changelog topic；处理保证 exactly-once（`processing.guarantee=exactly_once_v2`）。
- **端到端**——用 Kafka 事务：`producer.beginTransaction` → 写输出 → `commitTransaction` / `abortTransaction`；offset 与输出在同一事务提交。
- **限制**——仅当 Source / Sink 都是 Kafka 时天然端到端；外部系统需自己实现幂等。

**第四层：低延迟 + 高吞吐 + exactly-once 的取舍。** ① **低延迟要求**下，checkpoint 间隔要小（如 10s），但**频繁 checkpoint 会带来吞吐下降**——需权衡。② **高吞吐**下，2PC sink 的预提交开销、Kafka 事务的 broker 开销都要纳入。③ **Flink** 用 Unaligned Checkpoint + RocksDB 增量缓解反压下的 checkpoint 延迟。④ **Spark** 用微批攒批提高吞吐，但延迟上升。⑤ **Kafka Streams** 用 Kafka 事务保证一致性，吞吐受 broker 事务限制。

**第五层：设计建议。** ① 优先保证**Source 可回放**（Kafka 长 retention）。② Sink 侧**优先用幂等**（简单），能接受则不必强上 2PC。③ 对强一致场景用 2PC / Kafka 事务。④ 加**对账**作为最后一道防线——一致性机制可能被"人为 bug"绕过（如 UDF 副作用）。

**3. 常见陷阱**

- **把"引擎内 exactly-once"当作"端到端 exactly-once"**。二者是两个层次。
- **忽略 sink 的能力**。外部系统（HTTP API / 无主键 DB）往往不支持幂等 / 事务，端到端就退化。
- **认为 checkpoint 越频繁越好**。频繁 checkpoint 影响吞吐与延迟稳定性。
- **忽视 UDF 副作用**。即便一致性做到，UDF 里的外部写（发消息 / 调 API）不受事务保护。

**4. 追问预测**

- **「Kafka 事务与 Flink 2PC 的关系？」** 答：Flink 的 Kafka sink 就是用 Kafka 事务实现 2PC——checkpoint 完成时提交事务。
- **「Spark 怎么做端到端 exactly-once？」** 答：`foreachBatch` + 幂等 upsert；或写 Delta / Iceberg 用原子提交；微批重放保证不丢不重。
- **「入湖的 exactly-once 靠什么？」** 答：Iceberg / Hudi / Delta 的原子 commit（snapshot / commit / version），Flink / Spark 的 sink 在 checkpoint 完成时提交。
- **「低延迟下 checkpoint 失败率高怎么办？」** 答：开 Unaligned Checkpoint；调大 checkpoint 超时；检查状态大小与 RocksDB 配置。
- **「如何验证端到端一致性？」** 答：注入故障（kill JM / TM / 网络分区）后验证输出不丢不重；端到端对账任务。

**5. 参考资料**

- Apache Flink 官方文档中"End-to-End Exactly-Once"与 TwoPhaseCommitSinkFunction——端到端一致性的官方实现。
- Apache Spark 官方文档中"Fault Tolerance Semantics"——微批一致性与幂等 sink 要求。
- Apache Kafka 官方文档中"Transactions"与 Kafka Streams EOS——事务性 exactly-once 的实现。
- 阿里 Blink / Ververica 关于 Flink exactly-once 的公开技术文章。
- 字节跳动 / 美团技术团队公开博客关于实时链路一致性的分享。
- Confluent 官方博客关于 Kafka Streams exactly-once 的公开文章——事务机制的工业实践。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。

> 注：上列条目分两类。第一类是官方文档类（Apache Flink / Spark / Kafka 官方文档与设计文档，Apache Iceberg / Hudi 的 connector 文档），可按名称检索到对应材料，本书未附精确链接。第二类只给「团队 / 公司 + 主题或实践描述」（含「大规模」「PB 级」等规模说法，以及形如「**某公司** —— 某公司的某实践」的条目），未给文档名与年份，**本书无法给出其可核验出处**，一律按【经验】档理解，请勿当作可引用的事实来源。

---
