> 本文件是 **04-observability.md** § 8 面试真题集 的子主题。完整章节请回到 [index](04-observability.md) 或 [§ 8 索引](04-observability-section-8-sec8.md)。

### 8.2 §1.2 集群故障诊断与恢复

> 本主题考察万节点规模 Hadoop / Spark 集群的故障诊断能力：从 NameNode / ResourceManager 等核心服务的内存与 GC 问题，到 Executor 异常退出、背压与数据倾斜、网络分区等大规模场景下的高频故障。面试官真正想听的是「系统性排查路径」与「应急处置 + 根治 + 防复发」的三段式，而不是背诵几个 JVM 参数。

#### §1.2.1 当集群的 HDFS NameNode 面临内存泄漏风险，且堆内存使用率呈线性增长趋势，请描述完整的应急处置流程与根治方案，包括定位、止血、根治三个阶段的关键步骤。

**1. 考察点**

- 是否理解 NameNode 内存的「真实组成」：FSImage（Namespace）+ BlockMap（块元数据）+ RPC 队列 + DelegationToken 等，而非一个抽象的"堆"。
- 能否把「应急处置」与「根治」分开——止血先于优化，避免在故障中做架构变更。
- 是否知道在生产环境做内存诊断的「安全姿势」（heap dump、jcmd、jmx）及其风险。
- 加分项：能给出 HDFS-16547 / BlockReceiver 等已知 NameNode 内存缺陷对应的版本与修复路径。

**2. 参考答案框架**

**第一层：先定义问题边界。** NameNode 内存增长 ≠ 内存泄漏。增长曲线分三类：① 线性但增速 < 数据量增速——**正常**（Namespace 随文件数自然增长）；② 线性且增速远超数据量增速——**疑似泄漏**；③ 阶跃式跳变——**通常是某次批量创建/删除**。所以第一步永远是「确认是泄漏」，而不是直接抓 dump。

**第二层：定位阶段。**
- **采样分析**：开启 `NameNode` 的 `jmx`（默认端口 9010 / 50070），采集 `HeapMemoryUsage` / `NumFilesUnderConstruction` / `BlocksTotal` / `PendingDeletionBlocks` 等指标；阿里 MaxCompute 体系下也使用自研 RPC 染色 + 慢调用分析。
- **Heap Dump 取证**：`jmap -dump:live,format=b,file=nn.hprof <pid>`（离线抓）；线上环境优先用 `jcmd <pid> GC.heap_dump`，**会触发 Full GC**，必须在低峰期做，dump 后立刻拷贝走（占用 2× 堆大小）。
- **工具分析**：Eclipse MAT 分析 `Leak Suspects` / `Dominator Tree`；关注 `org.apache.hadoop.hdfs.server.namenode.FSNamesystem`、`BlockManager` 的 `excessReplicateMap` / `pendingReplication` 等容器。
- **版本漏洞**：HDFS 历史上出过多次内存缺陷（HDFS-14872 / HDFS-16547 / BlockReceiver 的 race condition），需要核对当前 Hadoop 版本对应的 Jira 与补丁。

**第三层：止血阶段。** 在诊断结论出来之前，先做应急：
- **重启 NameNode**：Standby 切换（ZKFC 自动 failover），HA 集群下可执行；非 HA 下要预约窗口。
- **强制触发 block 汇报回收**：`hdfs dfsadmin -refreshNodes` 配合 DeadNode 处理；触发 `PendingDeletionBlocks` 的清理。
- **关闭可能加剧泄漏的特性**：临时关闭 `dfs.namenode.enable.retry.cache`、调整 `dfs.namenode.retrycache.expirytime`；限制 `dfs.namenode.handler.count` 减少并发 RPC 压力。
- **扩容**：NameNode HA 难以热扩容堆（`-Xmx` 修改需重启），可临时调整为更大的 `-Xmn` 比例或启用 G1GC 改善停顿。LinkedIn 在 HDFS HA 集群中曾用 **Standby NameNode 内存大于 Active** 的非对称配置来扛住故障期。

**第四层：根治阶段。** 止血后的"二阶动作"：
- **升级修复版本**：若已识别为已知 Bug，升级到带 fix 的版本。
- **调整块拓扑**：单个文件/目录超过 1 亿文件时考虑使用 HDFS Federation（多 Namespace），LinkedIn 在 2018 年就因为 NameNode 单点扩展性问题迁移到 Federation + Router-Based Federation。
- **优化客户端行为**：上游业务大批量小文件写入是 NameNode 内存增长的最常见诱因，需要引导到 HBase / Ozone / Iceberg 这类"聚合写"的下游。
- **JVM 调优**：启用 G1GC + `-XX:MaxGCPauseMillis=200` + `-XX:+UseStringDeduplication`；监控 `jvm.JvmMetrics.GcTimeMillis` 与 `GcCount`，比例超过 5% 视为异常。

**第五层：防复发。** 加监控 `HeapMemoryUsage / -Xmx` 占比，阈值 75% 预警、85% 告警；每周做内存趋势复盘；引入 `oomWatch` 类守护脚本（阿里内部使用）做提前捕获。

**3. 常见陷阱**

- **上来就调 -Xmx。** 调大内存是延长寿命而非根治，且重启会丢 HA 状态。必须先定位后调整。
- **直接 jmap -heap**。这会触发 Full GC，生产高峰期禁止。优先用 jstat / jcmd 间接获取。
- **把 Federation 当默认答案。** Federation 是架构级重构，迁移成本极高，应在确认是 Namespace 增长而非泄漏之后再考虑。
- **忽略 Dead DataNode 的 Block 复制积压。** DataNode 长时间不上报会导致 PendingReplication 队列膨胀——这是 HDFS NameNode 内存的隐性"次生杀手"。
- **不分 HA 与非 HA 的处置。** HA 集群做 failover，非 HA 必须预约停机窗口。

**4. 追问预测**

- **「如何区分 Namespace 正常增长与内存泄漏？」** 答：对比 `FilesTotal` / `BlocksTotal` 增速与堆增速。堆增速 ≈ 数据量增速是正常；堆增速 ≫ 数据量增速是泄漏。
- **「HA 切换有什么风险？」** 答：EditLog 同步延迟、Standby 内存压力（需要等同 Active）、Split-Brain 风险；ZKFC 默认 5 秒超时，需要确认 Standby 健康状态。
- **「抓 Dump 时服务卡住怎么办？」** 答：必须用 `jcmd GC.heap_dump` 而非 `jmap -heap`，前者仅触发一次 Full GC，后者会循环触发；或者在 Standby 上抓（对 Active 无影响但数据可能滞后）。

**5. 参考资料**

- Hadoop 官方文档 `HDFS High Availability` 与 `HDFS Federation` 章节——HA 切换与 Federation 的权威出处。
- Apache Hadoop JIRA 上 HDFS-14872 / HDFS-16547 等已知内存相关缺陷——历史 Bug 修复记录。
- LinkedIn Engineering 关于 HDFS Federation 迁移的公开文章——万节点级集群如何用 Federation 解决 NameNode 单点扩展性。
- 阿里 MaxCompute / 大数据团队《大数据之路：阿里巴巴大数据实践》中关于 HDFS 调优章节——国内大规模生产经验。
- Apache Hadoop 官方文档关于 JVM 与 GC 调优章节（hadoop-common-daemon 等）。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---

#### §1.2.2 在万节点规模的集群中，如果出现大量 TaskTracker 或 Executor 进程异常退出，但节点仍存活，请分析排查思路与根因定位方法。

**1. 考察点**

- 是否具备「区分单点问题与集群共性问题」的直觉——这是万节点运维最基本的能力。
- 能否按"先看是不是 → 再看为什么 → 最后看谁负责"的三段式排查。
- 是否知道 TaskTracker（Hadoop MR）与 Executor（Spark / Flink）在生命周期管理上的差异。
- 加分项：能结合 NodeManager 健康度、磁盘指标、cgroup 限制等做综合判断。

**2. 参考答案框架**

**第一层：先做分层归类。** "大量进程异常退出"是症状，先做聚类：

- **退出时间聚类**：是同时退出（如某时刻 1000 个）还是持续零星退出？同时退是**外部事件**（配置推送、网络抖动、镜像批量升级），持续零星是**内生问题**（OOM、硬件故障、版本缺陷）。
- **退出原因聚类**：通过退出码（exit code）分类——137 是 OOM Killer，143 是 SIGTERM，1 是应用异常，139 是段错误。
- **节点聚类**：是集中在某些机架/某些机型，还是均匀分布？集中在某机型是**硬件/驱动问题**，均匀分布是**全局性问题**（如版本缺陷）。

**第二层：典型退出码的诊断。**

- **137（OOM Killed）**：检查 `dmesg | grep -i kill`；YARN 下用 `yarn.nodemanager.resource.detect-hardware-capabilities` + `cgroup` 内存限制；Spark 需检查 `spark.executor.memoryOverhead` 是否给够（默认 `max(384MB, 0.1 * executorMemory)`，但 shuffle 大表时远远不够）。
- **143（SIGTERM）**：通常是 YARN / K8s 的主动 kill——检查 NM 的 `Container killed by ApplicationMaster` 日志；K8s 下检查 `oom_score_adj` 与 pod eviction reason。
- **1（应用异常）**：Executor 自己的 uncaught exception——抓 stdout / stderr，看 Spark DAGSchedulerException、FetchFailure、BlockManager 异常；Flink 看 TaskManagerException、akka timeout。
- **139（SIGSEGV）**：JVM native crash，通常是 JNI / native 库缺陷（如 RocksDB、Hadoop native、Snappy 压缩库）；查 `hs_err_pid*.log`。

**第三层：根因定位的优先级。**
1. **共性时间窗事件优先**：检查是否有版本滚动、镜像升级、YARN / K8s 配置推送、安全补丁。LinkedIn 在 2020 年公开过因 JVM 升级导致大量 Executor 段错误的复盘。
2. **资源维度**：检查 `NodeManager` 的 `AvailablePhysicalMemory` / `AvailableVirtualMemory`；是否有 swap 压力（swap 触发 OOM 会误杀）。
3. **磁盘维度**：`du -sh /data/*` 看是否被打满；HDFS 的 `dfs.datanode.data.dir` 多目录配置是否均衡；本地磁盘满会触发 Container 清理。
4. **网络维度**：检查 `net.core.somaxconn`、`tcp retransmit` 占比，连接耗尽也会触发进程退出。
5. **Spark / Flink 自身**：Spark 的 `spark.executor.heartbeatInterval`（默认 10s）过长会导致超时被杀，需要调小；Flink 的 `taskmanager.heartbeat.timeout`（默认 10s）同理。

**第四层：止血与根治。** 止血：把可疑节点加入 YARN 黑名单（`yarn.nodemanager.unhealthy-node-detection.enabled`），或 K8s 下做 cordon + drain。根治：依归类结论走对应方向——配置缺陷改配置、版本缺陷回滚、硬件缺陷报修。

**3. 常见陷阱**

- **只盯 Executor 日志不看系统层日志。** 大规模下系统层（dmesg、syslog、cgroup）的痕迹往往更直接。
- **忽视 swap 与 overcommit。** `vm.overcommit_memory=1` 加上 swap 触发会大量误杀。
- **不检查镜像版本一致性。** 万节点下经常有部分节点镜像滞后，错误分布不均。
- **把 NM 重启当万能解法。** 容器化时代 NM 重启只是时间问题，根因不解决会重复发生。
- **忽视心跳超时**。Flink/Spark 默认心跳 10s，但 GC pause 50s 时会假死——Uber 在 2019 年公开过将心跳调到 50s 同时启用 Fenced heartbeat 的方案。

**4. 追问预测**

- **「如何快速隔离一批'问题节点'？」** 答：YARN 下通过 Decommission 流程（`yarn nodes -list -states` + `yarn rmadmin -refreshNodes`）；K8s 下 `kubectl cordon` + `kubectl drain`。批量隔离依赖 CMDB 标签。
- **「OOMKilled 但配置给的内存够，为什么？」** 答：检查 `spark.executor.memoryOverhead` 与 JVM off-heap；Netty / Arrow / RocksDB 等会占用大量 off-heap，jvm 看不到。
- **「大量 segment fault 怎么定位？」** 答：保留 `hs_err_pid*.log`，里面通常含 native 栈；用 `addr2line` 解析；锁定是哪个 native 库。

**5. 参考资料**

- Hadoop 官方文档关于 NodeManager 健康度检测的章节——`UnhealthyNodeDetector` 与 Container 杀死的关联。
- Apache Spark 官方文档中 `Memory Tuning` 与 `Memory Overhead` 章节——`spark.executor.memoryOverhead` 的工程经验值。
- Uber Engineering 关于 Spark 集群稳定性的系列公开文章——JVM 升级、Heartbeat 调优等实战案例。
- LinkedIn Engineering 关于大规模 Hadoop / Spark 集群运维的公开材料——心跳超时与 Executor 失联的诊断模式。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---

#### §1.2.3 请解释在超大规模 Spark 流处理作业中，如何通过监控指标和日志分析来区分和解决背压（Backpressure）、数据倾斜与 Checkpoint 失败三类常见故障。

**1. 考察点**

- 是否理解这三类故障的**根本机制**不同：背压是**消费速率**问题，倾斜是**分区负载**问题，Checkpoint 失败是**状态/存储**问题。
- 能否说出每类故障对应的**特征指标**——区分它们靠的是"看哪个指标异常"，而不是经验。
- 是否知道 Structured Streaming 与 DStream API 在背压机制上的差异。
- 加分项：能给出 Kafka / Flink 类比（Kafka consumer lag、Flink Credit-Based Backpressure）。

**2. 参考答案框架**

**第一层：背压（Backpressure）的诊断。**

- **核心机制**：Spark Streaming（微批）当下游处理速度跟不上 Kafka 消费速度时，调度延迟（Scheduling Delay）累积。Structured Streaming 通过 `spark.streaming.kafka.maxRatePerPartition` 与反压机制实现自适应。
- **特征指标**：`spark.streaming.scheduling.delay`（默认每个 batch 间隔）持续 > `batchInterval`，或 `processingTime >> batchInterval`。Kafka 侧的指标是 `records-lag-max`。
- **日志特征**：`Batch processing time X seconds exceeds batch interval Y seconds` 反复出现。
- **根本原因**：① 处理逻辑本身慢（join/aggregation/shuffle 大）；② Kafka 每批输入量突增；③ Executor GC 频繁导致处理卡顿；④ 资源不足（`spark.streaming.concurrentJobs` 受限）。
- **解法**：① 提高并行度（增加 `numPartitions` 或 `executor` 数）；② 限速 + 反压（Kafka 0.10+ 的 `maxRatePerPartition`）；③ 优化处理逻辑（避免 shuffle、缓存复用）；④ 升级到 Structured Streaming + 自适应批大小（`spark.sql.adaptive.enabled=true`）。

**第二层：数据倾斜的诊断。**

- **核心机制**：Kafka 各 partition 数据量不均，或某个 partition 内某 key 集中。Spark 中表现为**个别 task 处理时间远高于其他**。
- **特征指标**：Spark UI 中某个 stage 的 task 分布——绝大多数 task 几秒完成，少数 task 几十分钟；Executor GC 时间分布不均。Flink 中表现为 subtask 间 `recordsProcessed` 差异巨大。
- **日志特征**：`FetchFailedException`、`OutOfMemoryError: Java heap space` 集中在某个 task。
- **根本原因**：① Kafka 分区键本身不均衡（如按 user_id partition 但大 V 集中）；② SQL join 时 driver 表某 key 集中；③ 数据源特性（点击流长尾）。
- **解法**：① 加盐打散（对热点 key 加随机前缀，二阶段聚合）；② 分桶 + 自定义 partitioner；③ 拆分热点 key 走独立链路；④ 在 Kafka 端调整 partition 策略（在源头解决）。阿里在双 11 场景大量使用「热点 key 实时检测 + 动态打散」方案。

**第三层：Checkpoint 失败的诊断。**

- **核心机制**：Spark Streaming 的 Checkpoint 含**状态数据**（如 `updateStateByKey`）和**元数据**（已消费 offset、DStream lineage）。Checkpoint 失败 = 状态写不进去或读不出来。
- **特征指标**：`CheckpointDir` 写入失败；`StreamingListener` 报告 checkpoint 耗时飙升；Structured Streaming 下 `commitLog` 写入失败。
- **日志特征**：`Checkpoint failed with exception`、`Cannot find checkpoint directory`、HDFS 的 `No space left on device`。
- **根本原因**：① HDFS / S3 写入失败（最常见——NameNode 切换、网络分区、token 过期）；② Driver 重启导致 lineage 改变（DStream API 强依赖 Java 对象序列化，代码改动后无法恢复旧 checkpoint）；③ Checkpoint 目录权限。
- **解法**：① 用**外部存储的 offset**（Kafka offset 存到 ZK / HBase / MySQL），让代码可以演进；② 启用 write-ahead log（WAL）保证 at-least-once；③ 监控 HDFS 健康度与 NameNode 状态；④ DStream API 下用 `transform` 替代复杂 lineage。

**第四层：综合判断顺序。** 实际生产中三类故障会互相加剧——背压会拖长 batch 时间，长时间 batch 加剧 Checkpoint 压力，资源紧张又会引发倾斜。诊断顺序：先看背压（最表象）→ 再看倾斜（看 task 分布）→ 最后看 Checkpoint（看 driver 日志）。

**3. 常见陷阱**

- **只调 `numPartitions`。** 倾斜是 key 不均，不是分区数不够；盲目加 partition 可能让 shuffle 量爆炸。
- **改 DStream 代码后还想从旧 Checkpoint 恢复。** DStream API 的 lineage 强依赖代码，改代码就改 lineage，必须 fresh start。这是 DStream 正在被淘汰的核心原因之一。
- **背压用 `spark.streaming.kafka.maxRatePerPartition` 一刀切。** 全局限速会让所有 partition 都慢，对倾斜问题适得其反。
- **Checkpoint 目录放本地磁盘。** 本地磁盘丢 = 状态全丢；必须放在 HDFS / S3 这类共享存储。
- **混淆 "driver failed" 和 "executor failed"。** Checkpoint 失败是 driver 侧问题，executor 失败需要重启的是 task。

**4. 追问预测**

- **「背压与 Watermark 的关系？」** 答：Watermark（Structured Streaming / Flink）解决的是"事件时间"语义，背压解决的是"处理速度"。两者正交。
- **「倾斜但不报错，怎么发现？」** 答：靠指标——Spark UI 的 stage task 时长分布、Flink Web UI 的 subtask 处理时间、Prometheus 上 `flink_taskmanager_task_subtask_recordCount`。
- **「Structured Streaming 完全消灭了 Checkpoint 失败吗？」** 答：消灭了 lineage 失败（因为每次 query 启动是 fresh），但 `commitLog` / `offsetLog` 写入失败仍会发生。
- **「Kafka offset 自己存 + Checkpoint 用 HDFS，能保证 exactly-once 吗？」** 答：Kafka 0.11+ 的事务 offset + HDFS WAL 才能；只存 offset 而处理逻辑非幂等，仍是 at-least-once。

**5. 参考资料**

- Apache Spark 官方文档中 `Structured Streaming Programming Guide` 的 `Fault Tolerance` 与 `Kafka Integration` 章节——Checkpoint 与背压的权威论述。
- Tathagata Das（Databricks）关于 Structured Streaming 与 DStream 演进的公开文章——DStream Checkpoint 局限性的第一手分析。
- 阿里数据技术团队《大数据之路》中关于实时计算的背压与倾斜章节——双 11 场景下热点 key 处理的第一手经验。
- Uber Engineering 与 Netflix Technology Blog 关于 Kafka 消费与背压的公开文章——大规模流处理背压机制的工业实践。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---

#### §1.2.4 假设集群的 ResourceManager 服务出现频繁 Full GC，导致作业提交缓慢甚至失败，请描述 GC 调优、内存治理与作业恢复策略。

**1. 考察点**

- 是否理解 RM 内存的真实组成——Application 队列、Container 分配状态、Scheduler 状态、Block 缓存等。
- 能否区分「GC 调优」与「内存治理」——前者是 JVM 参数，后者是 RM 内部数据结构。
- 是否知道 RM HA 切换对作业的影响。
- 加分项：能给出 G1GC vs CMS vs ZGC 在大堆场景的对比。

**2. 参考答案框架**

**第一层：先确认是 RM 还是 NM 的问题。** "作业提交缓慢" 在万节点集群里可能是：① RM Full GC（AM 注册阻塞）；② RM 单点压力（NM 心跳积压）；③ StateStore（RMSyncNode）写入 HDFS 阻塞；④ NM 侧资源计算慢。必须先看 RM 的 `JvmMetrics`：`GCTimeMillis` / `GcCount` / `HeapMemoryUsage`。

**第二层：GC 调优。**

- **选 GC 算法**：堆 > 32 GB 优先 **G1GC**（JDK 11+），目标是 `-XX:MaxGCPauseMillis=200`；堆 > 64 GB 且对延迟极敏感可试 **ZGC**（JDK 11 早期访问，JDK 15+ GA），但需要充足 native memory。LinkedIn 在 2021 年公开过 RM 迁移到 ZGC 的实践。
- **分区策略**：G1GC 下通过 `-XX:G1NewSizePercent` / `-XX:G1MaxNewSizePercent` 调整新生代比例；Heap 大时给新生代 30%-40%。
- **大对象处理**：RM 的 `RMContainerImpl` / `FiCaSchedulerApp` 可能在 shuffle 服务期间产生大对象，调整 `-XX:G1HeapRegionSize`（16 MB / 32 MB）。
- **监控**：开启 `-Xlog:gc*,gc+heap=info,gc+age=trace:file=gc.log`（JDK 9+），用 GCViewer 或 GCEasy 分析。

**第三层：内存治理。** RM 内存增长通常有这几类来源：

- **App 列表**：`RMContext.getScheduler().getApplications()` 持续增长——历史作业未清理。YARN 默认会清理 FINISHED 作业，但保留时长由 `yarn.resourcemanager.completed-applications.maximum-retained` 控制（默认 10000），过大时需调小。
- **Container 历史**：`ResourceScheduler` 保留每个 App 的 `LiveContainers` / `CompletedContainers` 记录，超过 `yarn.resourcemanager.max-completed-applications` 后清理失败会内存积压。
- **NM 心跳**：`RMNodeImpl` 记录每个 NM 的资源使用情况，节点数 × 资源维度 × 节点状态，10K 节点 × 50 个 metric ≈ 50 万对象，本身就是大对象池。
- **分配事件队列**：`AsyncDispatcher` 的 event queue 在分配/释放事件多时会积压。可通过 `yarn.resourcemanager.scheduler.event-queue-size`（YARN-1017 之后）调整。

**第四层：作业恢复策略。**

- **AM 自动重试**：YARN 的 `yarn.resourcemanager.am.max-attempts`（默认 2），重试间隔 `yarn.resourcemanager.am.retry-time-window-ms`。Full GC 期间 AM 注册延迟，不会触发 AM 重试。
- **RM HA 切换**：若 Full GC 超过 ZKFC 超时（默认 5s + 5s），会自动触发 failover，Standby 接管。代价是 10-30s 服务不可用，已提交但未运行的 Container 重排队。
- **手动切换**：`yarn rmadmin -transitionToActive --forcemanual` 强制切换；做 GC 调优前先做一次 planned failover 减少业务影响。
- **客户端重试**：`yarn.resourcemanager.connect.max-wait.ms` / `yarn.resourcemanager.connect.retry-interval.ms` 调大，避免客户端在 RM 切换期间误判失败。

**第五层：长期治理。** 从架构层降级 RM 单点压力：

- **联邦化（Federation）**：把 10K 节点按业务拆成多套 RM 子集群——阿里、字节均在早期就走这条路。YARN Federation 在 Hadoop 3.x 已相对成熟。
- **调度器拆分**：用 `yarn.scheduler.fair.assignmultiple=true` 与队列拆分减少单个 RM 调度量。
- **NodeManager 心跳合并**：`yarn.nodemanager.resource-monitor.interval-ms` 调大，减少 RM 处理心跳的频率。

**3. 常见陷阱**

- **只调 -Xmx。** 治标不治本，1 周后又会 OOM。
- **ZGC 不会停顿 = 不会卡。** ZGC 停顿小但吞吐下降，且对 native memory 要求高（需要 `-XX:ReservedCodeCacheSize` + 充足 `/dev/shm`）。
- **HA 切换是无缝的。** 切换期间 in-flight 的请求会失败，作业状态短暂不可见。
- **忽视 StateStore。** RM 把状态写 HDFS 同步，HDFS 抖动会让 RM 卡住——`yarn.resourcemanager.fs.state-store.uri` 应指向独立 Namenode。
- **把 NM 慢当成 RM 慢。** 现象都是"作业提交慢"，根因可能完全不同，必须看指标而不是看现象。

**4. 追问预测**

- **「Full GC 频率多少算异常？」** 答：每分钟超过 2 次，或平均停顿 > 1s，比例（GCTime/UPTime）> 5%。Hadoop 自带的 `HadoopRpcMetrics` 与 `JvmMetrics` 都可观测。
- **「AM 注册慢怎么感知？」** 答：YARN 的 `RpcMetrics.RpcProcessingTimeAvgTime` + `GetNewApplication` / `SubmitApplication` 的 P99；阿里内部使用 RPC 染色做慢调用归因。
- **「RM HA 切换期间作业会丢吗？」** 答：已提交的 Application 会随 Active 状态迁移到 Standby；但正在请求 Container 的会被丢弃，需要客户端重试。
- **「ZGC 在 64GB+ 堆上稳定吗？」** 答：JDK 15+ 已生产可用；JDK 11/13 早期版本有 numactl 相关 bug。Hadoop 3.3+ 才完全支持 ZGC。

**5. 参考资料**

- Hadoop 官方文档中关于 ResourceManager HA 与 Federation 的章节——RM HA 切换流程的权威出处。
- LinkedIn Engineering 关于 YARN ResourceManager ZGC 迁移的公开文章——大堆场景下 ZGC 实战。
- Apache Hadoop 官方文档中关于 GC 调优与 G1GC 的章节——`hadoop-env.sh` 与 `yarn-env.sh` 的标准参数。
- 阿里 / 字节关于大规模 YARN Federation 的公开分享——万节点级集群的拆分治理。
- Netflix Technology Blog 关于 YARN 调度的公开材料——大规模作业调度器调优经验。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---

#### §1.2.5 请描述在大规模 Hadoop/Spark 集群中，当发现某个 DataNode 节点磁盘使用率持续高于 90% 时的处理流程，包括诊断、止血、根治三个阶段。

**1. 考察点**

- 是否理解 DataNode 磁盘满不只是一个存储问题——它会引发**级联故障**：Container 写不出中间文件被杀，HDFS 写副本失败触发副本欠费，BlockManager 反复重试加压 RM。
- 能否区分**真实数据增长**、**临时文件积压**、**小文件**、**磁盘倾斜**四类原因。
- 是否知道多目录（`dfs.datanode.data.dir`）下 DataNode 的 RoundRobin 写入策略。
- 加分项：能给出 HDFS Balancer / Disk Balancer 的使用边界。

**2. 参考答案框架**

**第一层：诊断阶段。**

- **指标采集**：通过 Cloudera Manager / Ambari / 自研监控抓取每台 DN 的 `dfs.datanode.StorageTypeRemaining`、`DfsUsed` 与 `Capacity`。LinkedIn 公开过用 `burrow` + Kafka 把 DN 磁盘指标上报到统一时序库。
- **分层归因**：磁盘满的原因分四类——
  1. **真实数据增长**：HDFS 总容量增长跟不上数据写入；
  2. **临时文件积压**：MapReduce / Spark 的 `ContainerLocal` 文件（如 shuffle spill、scratch dir）；
  3. **小文件**：每个文件占用 1 个 block，但 `dfs.namenode` 与 DN 都按文件数计费；
  4. **磁盘倾斜**：多目录配置下，某个挂载点被 RoundRobin 选中次数过多。
- **dn 日志查看**：DN 的 `logs/hadoop-hdfs-datanode-*.log.out` 看是否有 `IOException: No space left on device`、`Block receiver: Exception`、`Failed to move block` 等告警。

**第二层：止血阶段。**

- **临时清理**：`yarn.nodemanager.localizer.cache.cleanup.interval-ms` 与 `yarn.nodemanager.intermediate-data.retention` 触发 shuffle 文件清理；HDFS 上用 `hdfs dfs -rm` 清理无用目录（先确认 Owner）。
- **下线 DN**：对持续告警的节点做 Decommission（`dfs.hosts.exclude`），让它把数据搬走——但注意 Decommission 期间它仍提供服务，可能更慢。
- **短期扩容**：紧急加磁盘（或挂 EBS 卷），但集群节点扩容是工单级操作，至少几小时。
- **任务调度降级**：用 YARN 队列的 `maximum-allocation` / `disable_preemption` 减少该节点上的新任务，避免写入加速。
- **冻结写入**：`dfs.datanode.write.block.replacement.work` 控制副本替换；严重时让 RM 把节点加黑名单。

**第三层：根治阶段。**

- **小文件治理**：合并小文件（Hive `concatenate`、`spark.sql.files.maxRecordsPerFile`、Iceberg / Hudi 的 `rewrite_data_files`）。
- **冷热分层**：HDFS 冷数据迁到对象存储（S3 / OSS）+ 启用 HDFS Tiered Storage（HDFS-9806 之后）；冷数据目录配额收紧。
- **磁盘均衡**：用 HDFS 3.x 的 **Disk Balancer**（`hdfs diskbalancer -plan`）做节点内多目录均衡；集群级用 `hdfs balancer -threshold` 调整。
- **配额治理**：在 HDFS 上配置 `hdfs dfsadmin -setSpaceQuota`，按业务线配额；用 `mover` 把冷数据搬到对应存储类型。
- **架构优化**：上游减少小文件写入（HBase 不直接落 HDFS 文本，Flink 用 Iceberg / Hudi 聚合后写）。
- **DataNode 扩容**：在万节点集群上扩 DataNode 比扩 RM / NN 更频繁，因为 DN 真的会被数据增长追上。

**3. 常见陷阱**

- **直接 `rm -rf`。** 不区分 InUse 文件与临时文件就 rm，会导致 HDFS 报 MissingBlock。
- **忽视 `/tmp` 与 `/var/log`。** Spark 的 `java.io.tmpdir` 与 NM 的日志目录也会被打满。
- **Decommission 当万能。** Decommission 会搬走数据，但搬的过程中 DN 仍是 in-service 节点。
- **不区分 ephemeral 盘与持久盘。** 容器化时代，DN 跑在 PVC 上时磁盘满的处置完全不同（扩容 PVC 而非节点）。
- **小文件不解决，每次都靠清理。** 这是治标不治本，根因在写入端。

**4. 追问预测**

- **「如何区分是真实数据满还是临时文件满？」** 答：`du -sh /data/dn/*/current/BP-*/current/finalized` 看实际 HDFS block 文件大小，与 NM 的 `ContainerLocal` 目录 `du -sh /data/nm-local-dir` 对比。差异大说明是临时文件。
- **「Decommission 的速度怎么控制？」** 答：`dfs.datanode.bandwidthPerSec` 控制搬迁带宽（默认 10 MB/s），高带宽下会与生产流量抢资源。
- **「HDFS Federation 下磁盘治理有什么不同？」** 答：每个 Namespace 有独立的 DN pool，需要按 Namespace 做磁盘监控；Disk Balancer 在 Federation 下也按节点运行。
- **「挂载点满了但节点其它盘空着，怎么办？」** 答：HDFS 3.x Disk Balancer + 多目录配置；或调整 RoundRobin 策略（`dfs.datanode.fsdataset.parallel.volume.balancing.enabled`）。

**5. 参考资料**

- Apache HDFS 官方文档中 `Disk Balancer` 章节——`hdfs diskbalancer` 的用法与限制。
- Cloudera / Hortonworks 关于 HDFS 容量规划的官方文档——DN 磁盘配置的标准实践。
- LinkedIn Engineering 与 Netflix Technology Blog 关于 HDFS 容量管理的公开文章——大规模集群的 DN 治理经验。
- 阿里 / 字节关于小文件治理与冷热分层的公开分享——国内头部互联网的真实治理路径。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---

#### §1.2.6 请设计一个针对大规模集群网络分区（Network Partition）故障的应急恢复预案，包括检测、隔离、恢复与防复发措施。

**1. 考察点**

- 是否理解网络分区对 Hadoop / Spark 的**多组件级联影响**——HDFS 写副本丢失、YARN 心跳超时、ZK 会话超时、Kafka ISR 收缩。
- 能否区分**真分区**与**假分区**（如 GC 导致的心跳延迟）。
- 是否知道预防措施的边界——多机房架构（Active-Active / Stretch Cluster）的复杂度。
- 加分项：能给出 Meta、LinkedIn 等公司的多机房架构参考。

**2. 参考答案框架**

**第一层：什么是网络分区。** 网络分区指集群节点因交换机故障、路由黑洞或光缆中断而失去通信。Hadoop 集群的"半数节点可见 + 半数不可见"是最经典场景——这时会出现脑裂：HDFS 双 NameNode 都以为自己是 Active，YARN 双 RM 都开始调度。

**第二层：检测。**

- **基础设施层**：交换机端口 `CRC error` 突增；光缆 OTU 的 `BIP8` 误码；BGP 会话抖动。
- **集群层**：DN 大量丢失；NM 心跳丢失超过 `yarn.nodemanager.heartbeat.interval`（默认 1s）+ 重试次数；ZK session 失联；HDFS `LastHeartbeat` 距今 > 30s。
- **业务层**：作业报错率飙升；Kafka `UnderReplicatedPartitions` 异常；Kafka Controller 切换。
- **检测难点**：慢 GC / 网络拥塞可能造成"假分区"——必须用 ECMP ping 多探针 + 多机房独立 ping 综合判断。

**第三层：隔离。**

- **HDFS NameNode**：ZKFC 在 ZK 会话过期后会触发 Active 切换；为避免脑裂，需要：
  - Quorum Journal 节点独立部署，不与 NN 同机架；
  - `dfs.namenode.rpc-bind-host` 与 `dfs.namenode.servicerpc-bind-host` 配置正确（避免回到旧 Active）。
- **YARN RM**：类似 ZKFC 切换；YARN Federation 下每个子集群独立切换。
- **Kafka Controller**：通过 KRaft / ZK 选主，避免双 Controller；副本从分区的 ISR 中自动剔除，但需要在恢复后重新加入。
- **应用层**：客户端设置更长的重试与超时，避免误判失败；幂等键保证重试安全。

**第四层：恢复。**

- **分区恢复后**：HDFS 自动恢复副本欠费（`dfs.replication` 默认 3）；YARN 自动恢复心跳；Kafka ISR 自动扩容。
- **手动恢复**：
  - 若 NN 发生 failover，需把旧 Active 切到 Standby，再 reload checkpoint；
  - Kafka 副本：`kafka-reassign-partitions.sh` 重平衡；
  - Spark / Flink 作业：检查 checkpoint，必要时 from-savepoint 重启；
  - HBase：先 disable 表，等待 region 重新分配，再 enable。
- **优先恢复顺序**：ZK / HDFS NN > Kafka > YARN RM > 应用作业——基础设施层先恢复，应用层才能继续。

**第五层：防复发（架构级）。**

- **机架感知**：HDFS / YARN / Kafka 都启用 `topology.script.file.name`（或 `net.topology.script.file.name`）；副本跨 rack 分布，避免单 rack 故障毁掉 3 副本。
- **多机房**：同城双机房（Stretch Cluster，共享 ZK）、异地多活（Active-Active with eventual consistency）。Netflix 在 AWS 多区域部署上大量使用 active-active，跨区域走 CRDT / 异步复制。
- **ECMP / 多路径**：交换机 ECMP + LACP 链路聚合，单链路故障不影响通信。
- **混沌工程**：Netflix Chaos Monkey、阿里 flows.chaos 注入故障演练；Netflix 公开的 Chaos Engineering 论文是标准出处。

**3. 常见陷阱**

- **认为 HDFS 副本 3 就够。** 3 副本只是 rack-aware，但单机房内 rack 不足 3 时仍可能全副本在同 rack。
- **忽视 ZK 自身的网络分区。** ZK 在"过半失败"时停止服务，导致所有依赖 ZK 的组件都异常——所以 ZK 节点必须独立部署在跨 rack 的机器上。
- **把 GC 慢误判为分区。** JVM Full GC 50s 可能让心跳超时，但实际节点活着。要看 NM 自身的 `availableMemory` 与 GC 时间综合判断。
- **脑裂时不立即手动介入。** 双 Active 时手动干预（kill -9）反而比自动 failover 更危险。
- **不做演练。** 网络分区预案不演练等于不存在——Netflix Chaos Monkey 的核心价值是把预案变成肌肉记忆。

**4. 追问预测**

- **「HDFS Federation 架构下网络分区怎么恢复？」** 答：每个 Namespace 独立切换，Router 也需要感知新 Active；Federation 的优势是单点爆炸半径小。
- **「Kafka 多机房怎么避免脑裂？」** 答：优先用 KRaft 模式替代 ZK 模式；跨机房走镜像（MirrorMaker 2），不直接共享副本。
- **「异地多活的冲突解决？」** 答：业务侧用 CRDT（冲突自由数据类型）或最终一致性；HDFS 在异地多活场景下几乎不用，因为 HDFS 不擅长 CRDT。
- **「Stretch Cluster 的网络抖动容忍？」** 答：同城距离（< 50km）下 RTT 1-3ms，可接受；同城双机房间带宽需 10Gbps+；跨机房 RPC 超时设到 30s 以上。

**5. 参考资料**

- Apache HDFS 官方文档中 `HDFS High Availability With QJM` 章节——QJM 与 ZKFC 的标准实现。
- Apache Kafka 官方文档中 `KRaft Mode` 与 `Replication` 章节——KRaft 替代 ZK 的迁移路径。
- Netflix Technology Blog 中 Chaos Monkey 与 Simian Army 的公开文章——混沌工程的工业实践。
- LinkedIn Engineering 与 Meta Engineering 关于多机房 / 多区域部署的公开材料——头部企业的真实架构参考。
- 阿里 / 字节关于双机房 / 同城双活的公开分享——国内大规模生产经验。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---
