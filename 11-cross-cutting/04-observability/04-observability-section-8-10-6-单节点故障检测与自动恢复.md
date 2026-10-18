> 本文件是 **04-observability.md** § 8 面试真题集的子主题。完整章节请回到 [index](04-observability.md) 或 [§ 8 索引](04-observability-section-8-sec8.md)。

### 8.6 §10.6 单节点故障检测与自动恢复

> 本主题考察 Hadoop/Spark 集群单节点故障的检测机制与恢复策略。面试官真正想听的是「NodeManager 健康度检测 + YARN Container 重试 + 自动故障转移 + 节点Decommission」的完整链路。

#### §10.6.1 在 Spark on YARN 的部署模式下，当 Executor 因节点硬件故障（如内存不足或磁盘损坏）而失败时，Spark 是如何检测到这一故障并触发重新调度的？

**1. 考察点**

- 是否理解 YARN Container → Spark Executor 的映射。
- 能否说出 Spark 心跳与 YARN 心跳的协同机制。
- 是否知道 Task 重试与 Executor 重启的边界。
- 加分项：能给出 YARN Container 失败检测的具体路径。

**2. 参考答案框架**

**第一层：Spark Executor 在 YARN 上的运行模型。** 一个 Spark Application 在 YARN 上运行：
- 1 个 **ApplicationMaster（AM）**：运行 Driver（Cluster mode）或代理 Driver（Client mode）；
- N 个 **Container**：每个 Container 跑 1 个 **Executor**，Executor 内跑 **Task**。

Container = 物理进程，由 YARN NodeManager（NM）管控；Executor 是 Spark 概念。

**第二层：故障检测路径 1 —— NM 监控 Container。**
- NM 周期性（默认 1s）检查 Container 状态：
  - 进程是否存在（`ps`）；
  - 资源使用（`/proc/<pid>/status`）；
  - **健康度脚本**：`yarn.nodemanager.health-checker.script.path`（默认不配置，需自定义脚本）；
  - **磁盘健康**：`yarn.nodemanager.disk-health-checker.enable` + `yarn.nodemanager.disk-health-checker.disk-free-space-threshold`。
- 触发动作：Container OOM → NM kill Container → AM 收到 `ContainerFailed` 事件。

**第三层：故障检测路径 2 —— 心跳保活机制。**
- **Executor → AM 心跳**：`spark.executor.heartbeatInterval`（默认 10s）；超过 `spark.network.timeout`（默认 120s）+ 重试次数未响应，AM 判定 Executor 失联。
- **AM → ResourceManager（RM）心跳**：AM 向 RM 注册、心跳保活；NM 只管 Container 生命周期，不承载 AM 的注册心跳。
- **Executor 自身**：用 `BlockManager` 做连接保活。

**第四层：故障恢复动作。**
- **Task 重试**：`spark.task.maxFailures`（默认 4）控制 Task 重试次数；重试失败的 Stage 由 `spark.stage.maxConsecutiveAttempts`（默认 4，连续 Stage 尝试上限）控制。
- **Executor 重启**：AM 收到 Executor 失联 → 触发 `SchedulerBackend.killExecutor` → 申请新 Container → 重启 Executor。
- **调度启动等待**：`spark.scheduler.maxRegisteredResourcesWaitingTime`（默认 30s）控制开始调度前等待 Executor 注册的时间上限；超时后 Spark 以已注册资源开始调度，并不会让 Stage 失败。
- **Application 重试**：`yarn.resourcemanager.am.max-attempts`（默认 2）控制 AM 重试；Driver 重启后从 checkpoint 恢复（Structured Streaming；DStream 开启 Checkpoint 时同样从 Checkpoint 恢复，未开启时从头开始）。

**第五层：磁盘损坏的特别处理。** NM 健康检查发现磁盘损坏：
- `yarn.nodemanager.disk-health-checker.disk-failures-tolerated`（默认 0）：容忍坏盘数量；
- 触发动作：标记 NM `UNHEALTHY` → 该节点上的 Container 被驱逐；
- 自动 Decommission：`yarn.resourcemanager.nm-unhealthy-handler` 配置自动加入黑名单。

**3. 常见陷阱**

- **Task 重试 ≠ Executor 重启。** Task 失败先重试；超过重试次数才重启 Executor。
- **AM 心跳与 Executor 心跳混为一谈。** AM 心跳是 YARN 概念，Executor 心跳是 Spark 概念。
- **磁盘损坏只重启 Container 不下线节点。** 节点坏盘不修，下次还会失败。
- **健康检查脚本不写。** NM 默认健康检查只查磁盘可用空间，不查硬件；需要自定 health-check.sh。

**4. 追问预测**

- **「Executor 失联怎么定位？」** 答：AM 日志 `Lost executor` + Executor 日志 `Container killed by YARN` + NM 日志 `Container failed`；三处综合判断。
- **「Driver 重启会丢状态吗？」** 答：DStream API 严格依赖 Checkpoint；Structured Streaming + WAL + Kafka offset 可恢复。
- **「健康检查脚本怎么写？」** 答：返回 0 = 健康；非 0 = 不健康；常见检查：`df -h` 查磁盘、`ping` 关键服务、`nvidia-smi`（GPU 节点）。

**5. 参考资料**

- Apache Spark 官方文档中 `Cluster Mode Overview` 与 `Spark on YARN` 章节——Executor 与 AM 的运行模型。
- Apache Hadoop 官方文档中 `NodeManager Health Check` 章节——健康度检测的标准实现。
- LinkedIn / Uber 关于 Spark on YARN 故障恢复的公开文章——头部企业的实战案例。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §10.6.2 为了提升集群对单节点故障的恢复能力，除了基本的重试机制，你还会从集群配置和架构层面做哪些增强？

**1. 考察点**

- 是否具备「多层次防御」的能力——不光靠重试，还要架构级冗余。
- 能否从 NM 健康度、Decommission、Worker 自愈、监控告警多角度回答。
- 是否知道 rack-aware / zone-aware 部署。
- 加分项：能给出主动防御（故障预测）的方案。

**2. 参考答案框架**

**第一层：基本重试机制。** YARN / Spark 的基本重试机制是最后兜底，但代价是延迟——重试期间用户感知慢；所以需要前置防御。

**第二层：架构层增强。**
- **NM 健康度增强**：
  - `yarn.nodemanager.health-checker.script.path` 自定义健康检查（磁盘、内存、CPU、网络）；
  - `yarn.nodemanager.disk-health-checker.disk-failures-tolerated` 容忍坏盘；
  - `yarn.nodemanager.resource-monitor.interval-ms`（默认 1s）。
- **Decommission 自动化**：
  - `yarn.resourcemanager.nm-liveness-monitor.expire-interval-ms`（默认 10min）调短到 5min；
  - 自动化 Decommission：CMDB 标记的退役节点自动剔除。
- **rack-aware**：
  - HDFS / YARN / Kafka 副本跨 rack，避免单 rack 故障；
  - HDFS 副本 `dfs.replication`=3 + `net.topology.script.file.name` 配置机架感知；
  - YARN RackScheduler 让 application 跨 rack。
- **zone-aware**（云上）：
  - 云上不同 AZ（Availability Zone）部署副本；
  - 避免单 AZ 故障全集群失明。
- **心跳优化**：
  - NM 心跳 1s → 3s 减少误杀；
  - AM 心跳调短到 1s 加速检测；
  - Spark `spark.network.timeout`（默认 120s）调短到 60s。

**第三层：Workload 自愈。**
- **Checkpoint 体系**：
  - Flink 的 RocksDB State Backend + 增量 checkpoint；
  - Spark Structured Streaming 的 WAL + Kafka offset 持久化；
  - DStream API 已过时，新业务用前者。
- **幂等重试**：
  - 写入幂等（Iceberg / Hudi 的 upsert 语义）；
  - 任务幂等（同一份逻辑重跑结果一致）。
- **断点续传**：
  - 实时任务 Savepoint 定期；
  - 离线任务从中间结果恢复（对过长血缘做 `checkpoint` 切断，避免恢复时间过长）。

**第四层：监控与告警。**
- **节点健康度主动告警**：`nm_healthcheck_failed` 立即告警。
- **节点心跳超时预警**：`nm_last_heartbeat > 30s` 提前介入（不等 10min 触发）。
- **故障预测**：基于 SMART / IO 延迟 / kernel oops 的预测（Netflix / 阿里均有实践）。

**第五层：混沌工程。**
- **Netflix Chaos Monkey**：随机 kill 节点验证恢复能力；
- **阿里 flows.chaos**：注入磁盘满、网络分区、CPU 高等；
- **Gremlin / ChaosBlade**：开源故障注入工具。

**3. 常见陷阱**

- **只靠重试。** 重试掩盖问题而非解决问题。
- **rack-aware 不配置。** 默认无 rack 感知，单 rack 故障毁所有副本。
- **监控不做主动告警。** 等节点失联才知道 vs 提前发现"心跳慢"。
- **不做混沌演练。** 不演练的预案等于不存在。

**4. 追问预测**

- **「心跳周期短 vs 长的取舍？」** 答：短 → 检测快但误杀多；长 → 检测慢但稳定。经验：NM 3s、AM 1s。
- **「节点 Decommission 与 Kill 的区别？」** 答：Decommission 搬运数据后退出，KILL 直接退出；前者慢但安全。
- **「Flink 的 Savepoint 与 Checkpoint 区别？」** 答：Checkpoint 自动化 / 周期；Savepoint 手动 / 持久化用于版本升级。

**5. 参考资料**

- Apache Hadoop 官方文档中 `NodeManager Health Check` 与 `Rack Awareness` 章节——配置权威出处。
- Netflix Technology Blog 中 Chaos Monkey 与 Simian Army 的公开文章——混沌工程实践。
- Apache Flink 官方文档中 `Savepoints` 章节——Savepoint 与 Checkpoint 的区别。
- 阿里 / 字节关于故障自愈与混沌工程的公开分享——国内头部企业实践。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §10.6.3 请描述 Hadoop YARN 的 NodeManager 是如何检测到某个节点上的任务执行失败的，以及它会采取哪些补救措施。

**1. 考察点**

- 是否理解 NM 健康检测与 Container 监控的区别。
- 能否说出 NM 失败响应动作（kill、report、驱逐）。
- 是否知道 NM 自身失败与 NM 上的 Container 失败的差异。
- 加分项：能给出节点级失败 vs 进程级失败的处理路径。

**2. 参考答案框架**

**第一层：NM 的两层监控。** NodeManager 做两件事：
- **节点级（Node-level）**：监控机器本身（CPU、内存、磁盘、网络、健康度脚本）；
- **进程级（Container-level）**：监控每个 Container 进程（进程存活、内存使用、退出码）。

**第二层：节点级故障检测。**
- **健康度脚本**：`health-check.sh` 自定义；返回非 0 视为不健康；周期性执行（默认 10min）。
- **磁盘健康**：检查 `dfs.datanode.data.dir` 与 `yarn.nodemanager.local-dirs` 的剩余空间；低于阈值（默认 1GB）标记不健康。
- **节点报告**：NM 向 RM 周期汇报状态（`NodeStatus`）；`yarn.nodemanager.resource-monitor.interval-ms`（默认 1s）。
- **节点超时**：RM 端 `yarn.resourcemanager.nm-liveness-monitor.expire-interval-ms`（默认 10min）超时未汇报，标记 NM 失联。

**第三层：Container 级故障检测。**
- **进程存活**：NM 启动 Container 后 fork 一个监控线程，定期 `kill -0 <pid>` 检查进程。
- **资源监控**：用 `cgroup` / `rlimit` 限制 Container 资源；超限自动 kill（`SIGKILL`）。
- **退出码处理**：Container 进程退出码非 0 → 视为失败 → 通知 RM。
- **OOMKilled**：内存超限，OOMKilled（退出码 137）。
- **Disk failure**：本地目录写失败，Container kill。

**第四层：补救措施。**
- **Container 重试**：RM 端根据 `yarn.resourcemanager.am.max-attempts`（AM）或 `ApplicationMaster` 的策略决定是否重试。
- **节点隔离**：`UnhealthyNodeDetector` 把不健康节点标记为 `UNHEALTHY`，AM 心跳时不下发任务。
- **节点 Decommission**：集群管理员手工 Decommission 节点；HDFS DN Decommission 自动搬运数据。
- **Container 黑名单**：`ApplicationMaster` 把失败 Container 加入黑名单，避免重复分配到该节点。
- **AM 重启**：Driver 失败触发 AM 重启（`yarn.resourcemanager.am.max-attempts` 限制）。

**第五层：NM 自身失败的恢复。** NM 进程挂了：
- RM 端 `yarn.resourcemanager.nm-liveness-monitor` 检测到 NM 失联；
- RM 把该 NM 标记为 `LOST`，所有运行中的 Container 视为失败；
- 触发所有运行作业的 Container 重试；
- NM 重启后重新注册到 RM，恢复服务。

**3. 常见陷阱**

- **混淆 NM 健康与 Container 健康。** 节点不健康会下线整个节点，Container 不健康只下线单个 Container。
- **不自定义 health-check。** 默认检查只查磁盘，业务关注的 CPU 异常 / 服务依赖不会触发。
- **不启用 cgroup。** 没有 cgroup 隔离，Container 之间会互相挤占。
- **NM 失联不设短超时。** 默认 10min 太长，期间 RM 还可能往失联节点下发任务。

**4. 追问预测**

- **「健康检查脚本多久执行一次？」** 答：`yarn.nodemanager.health-checker.interval-ms`（默认 600000 = 10min）；可用 `health-checker.script.opts` 传参。
- **「cgroup v1 vs v2 区别？」** 答：v1 多个 subsystem 各自挂载；v2 统一 `cgroup v2` 单一挂载；Hadoop 3.3+ 完全支持 v2。
- **「节点 Decommission 期间会接收新任务吗？」** 答：Decommission 中可配置 `RUNNING` → `DECOMMISSIONING` → `DECOMMISSIONED`；`DECOMMISSIONING` 期间不下发新任务。

**5. 参考资料**

- Apache Hadoop 官方文档中 `NodeManager` 与 `ContainerExecutor` 章节——NM 与 Container 的标准实现。
- Apache Hadoop 官方文档中 `cgroup integration` 章节——cgroup 配置权威出处。
- LinkedIn / Uber 关于 NM 健康度与 Container 恢复的公开文章——头部企业的实战案例。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §10.6.4 请简要说明在 Hadoop 集群中，NameNode 和 DataNode 分别有哪些常见的单点故障与对应的缓解措施。

**1. 考察点**

- 是否清楚 NN 与 DN 的不同故障模式。
- 能否给出 HA / Decommission / 副本策略的完整方案。
- 是否知道冷备与热备的区别。
- 加分项：能给出 Federation 升级路径。

**2. 参考答案框架**

**第一层：NameNode 故障模式。**
- **进程崩溃**：OOM、版本 Bug、JVM crash。
- **机器故障**：硬件、电源、网络。
- **状态不一致**：EditLog 损坏、JournalNode 故障。
- **脑裂**：双 Active（HA 配置错误）。

**第二层：NN 缓解措施。**
- **NN HA（主备）**：2 个 NN（Active + Standby）+ JournalNode（Quorum，3 节点）+ ZKFC 自动 failover。
- **Quorum Journal Manager（QJM）**：EditLog 写多数派 JournalNode，比 NFS 更可靠。
- **ZKFC 自动切换**：`ha.zookeeper.*` 控制 ZK 连接重试。
- **手动切换**：`hdfs haadmin -transitionToActive`。
- **Federation**：单 NN 撑不住时拆多 Namespace；Router-Based Federation 统一访问。
- **冷备**：定期 FSImage + EditLog 备份到独立 Namenode，灾难时恢复。

**第三层：DataNode 故障模式。**
- **磁盘故障**：HDD 坏道、SSD 寿命耗尽、RAID 卡故障。
- **机器故障**：硬件、电源。
- **网络失联**：交换机故障、光缆中断。
- **数据腐坏**：block checksum 失败（`dfs.corrupt.blocks.count` 异常）。

**第四层：DN 缓解措施。**
- **副本策略**：`dfs.replication`=3 + rack-aware，单节点故障仍有 2 副本可用。
- **Decommission / Recommission**：节点退役（搬数据）+ 重新入役。
- **磁盘 Balancer**：HDFS 3.x Disk Balancer + `dfs.datanode.fsdataset.parallel.volume.balancing.enabled`。
- **Erasure Coding**：冷数据 EC 替代 3 副本，减少副本管理负担。
- **心跳与超时**：DN 端 `dfs.heartbeat.interval`（默认 3s）+ NN 端超时检测。
- **Checksum 校验**：`dfs.bytes-per-checksum`（默认 512B）+ `hadoop fs -checksum` 验证。

**第五层：NN + DN 共同的辅助机制。**
- **ZooKeeper 集群**：3 / 5 节点，独立部署，跨 rack。
- **JournalNode 集群**：3 / 5 节点，跨 rack；QJM 多数派写入。
- **监控告警**：NN heap / GC、`dfs.namenode.missing-blocks` 异常、`UnderReplicatedBlocks` 飙升。
- **混沌演练**：定期演练 NN failover / DN Decommission。

**3. 常见陷阱**

- **NN 单点不配 HA。** 单 NN 故障 = 全集群停摆。
- **HA 不配 QJM。** 早期 NN HA 用 NFS 共享 EditLog，单点风险更高。
- **ZK 集群 3 节点同 rack。** ZK 节点必须跨 rack；同 rack 故障 ZK 全挂。
- **副本数不变。** 默认 3 副本看似安全，但 rack-aware 没配置 = 3 副本可能在同 rack。
- **Decommission 不规划。** Decommission 速度受 `dfs.datanode.balance.bandwidthPerSec` 影响，太快会与生产抢资源。

**4. 追问预测**

- **「NN 切 Standby 时数据一致性？」** 答：QJM 写 EditLog 到多数派，切 Active 时保证不丢；FSImage 由 Standby 定期 merge。
- **「DN Decommission 多久？」** 答：受数据量与带宽限制；500GB 数据 × 10MB/s 带宽 ≈ 14h；可临时调带宽。
- **「脑裂怎么避免？」** 答：ZK 选主 + ZKFC 隔离机制（fencing）；旧 Active kill 自身防止双写。

**5. 参考资料**

- Apache HDFS 官方文档中 `High Availability With QJM` 与 `Federation` 章节——HA 与 Federation 的标准实现。
- Apache ZooKeeper 官方文档中 `ZAB Protocol` 章节——选主与一致性协议。
- LinkedIn / Netflix / Meta 关于 NN HA 与 DN Decommission 的公开文章——头部企业大规模实践。
- 阿里 / 字节关于双机房 NN / DN 治理的公开分享——国内大规模生产经验。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---
