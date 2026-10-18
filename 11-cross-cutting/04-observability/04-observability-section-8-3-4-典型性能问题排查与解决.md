> 本文件是 **04-observability.md** § 8 面试真题集的子主题。完整章节请回到 [index](04-observability.md) 或 [§ 8 索引](04-observability-section-8-sec8.md)。

### 8.4 §3.4 典型性能问题排查与解决

> 本主题考察大数据集群四大性能瓶颈（RM、磁盘 IO、Spark 慢任务、写吞吐）以及资源申请失败的排查思路。面试官真正想听的是「分层定位 + 经验参数 + 业务/工程权衡」，而不是「加大内存、加机器」的口号式回答。

#### §3.4.1 当 YARN 集群的 ResourceManager 成为性能瓶颈时，请问可以通过哪些架构层面和参数层面的优化手段来提升其性能？

**1. 考察点**

- 是否理解 RM 单点压力的来源（NM 心跳、AM 注册、Container 分配、状态写 HDFS）。
- 能否区分**架构级优化**（拆分、联邦、缓存）与**参数级优化**（线程、队列、压缩）。
- 是否知道 RM HA / Federation 的真实落地代价。
- 加分项：能给出行业 benchmark（单 RM 可支撑节点数、并发 Application 数）。

**2. 参考答案框架**

**第一层：先定位是真瓶颈还是表象。** RM "看起来慢" 可能是：① 真慢（GC 频繁、心跳堆积）；② StateStore 写 HDFS 慢；③ AM 注册风暴（业务方批量提交）。必须先看 RM 的 `JvmMetrics` + `RpcMetrics` + `AsyncDispatcher` queue size，再决定是调参还是改架构。

**第二层：架构级优化（治本）。**
- **YARN Federation**：把单 RM 拆成多套子集群，按业务域路由；LinkedIn 曾公开介绍过把单 RM 拆为多 Router 的 Federation 实践（未附该文章的标题与链接，引用时请自行查证）。Hadoop 3.x 的 YARN Federation 成熟可用（HDFS 侧另有 Router-Based Federation，用于多 Namespace 统一挂载）。
- **拆分队列到独立 RM**：把高优业务（实时计算 / 风控）放到独立 RM 集群，与离线 ETL 隔离，避免互相挤占。
- **提升到独立资源协调层**：把 RM 上层的资源配额逻辑移到自研的 `Capacity Manager`，RM 只负责底层资源调度——Uber / LinkedIn 都公开过类似的分层架构（未附该文章的标题与链接，引用时请自行查证）。
- **自研调度器替代 YARN RM**：有自研栈的组织（字节、Netflix 一类）不用 YARN RM 做资源调度，直接以自研调度层替代（未附该文章的标题与链接，引用时请自行查证）。

**第三层：参数级优化（治标）。**
- **NM 心跳合并**：`yarn.nodemanager.resource-monitor.interval-ms` 调大（默认 1s 可调到 3-5s）；`yarn.resourcemanager.nodemanagers.heartbeat-interval-ms`（RM 端）同步调整。
- **AM 注册异步化**：早期 YARN 的 AM 注册走同步流程，Hadoop 2.9+ 加入异步路径；确认版本在 2.9+。
- **Container 分配批量**：`yarn.scheduler.capacity.resource-calculator` 选 `DominantResourceCalculator`，开启 `assignmultiple`；`yarn.scheduler.fair.assignmultiple` 默认 1，可调到 5-10。
- **状态存储优化**：`yarn.resourcemanager.fs.state-store.uri` 指向独立 Namenode；`yarn.resourcemanager.state-store.async` 启用异步写。
- **GC 调优**：G1GC + `MaxGCPauseMillis=200`；堆 > 64GB 试 ZGC（JDK 15+）。
- **RPC 异步**：`yarn.ipc.client.factory.class` 用 `HadoopYarnProtoRPC`；`yarn.ipc.server.read.threadpool.size` 调整。

**第四层：观测与验证。** 任何优化必须有指标支撑：
- RM 端：`SchedulerMetrics`（分配速率、`PendingApplications`）、`JvmMetrics`（GC）、`RpcMetrics`（RPC 队列）；
- 客户端：`GetNewApplication` / `SubmitApplication` 的 P99 latency；
- 业务端：作业提交到 AM 启动的端到端时间。

**3. 常见陷阱**

- **直接调 -Xmx。** 调大堆只能延缓，不能根治——堆越大 GC 越难调。
- **忽视 Federation 迁移成本。** Federation 是架构级重构，需要重新规划队列与命名空间，迁移期业务有感知。
- **所有 YARN 都适合 Federation。** 实时计算与离线 ETL 混合场景下，Federation 的路由策略会让实时任务延迟。
- **参数越多越好。** 参数调优是边际递减，核心参数调到一定数量后收益消失，复杂度爆炸（该转折点随集群规模与负载而异，本书不给出具体数量）。

**4. 追问预测**

- **「单 RM 能撑多少节点？」** 答：行业经验——Hadoop 2.x ~3K 节点，Hadoop 3.x + G1GC ~5-8K 节点，超过必须 Federation。
- **「ZGC 在 RM 上稳定吗？」** 答：JDK 15+ 较稳定，但需要充足 native memory；Hadoop 3.3+ 才完全支持；LinkedIn 曾公开介绍过在 RM 上使用 ZGC 的实践（未附该文章的标题与链接，引用时请自行查证）。
- **「Capacity Manager 与原生 Scheduler 的区别？」** 答：原生 Capacity Scheduler 把容量配额计算与分配耦合；自定义 CM 把配额计算外置，可以支持更复杂的业务策略（成本归因、配额共享）。

**5. 参考资料**

- Apache Hadoop 官方文档中 `YARN Federation` 与 `ResourceManager High Availability` 章节——联邦化与 HA 的权威实现。
- LinkedIn Engineering 关于 YARN Federation 与自研调度的公开文章——万节点级 YARN 治理。
- Uber Engineering 关于 YARN / Hadoop 集群优化的公开材料——大规模生产调优经验。
- 阿里 MaxCompute 自研调度系统与公开技术分享——国内头部调度器架构参考。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §3.4.2 请阐述在 HDFS 集群中，数据节点频繁发生磁盘 I/O 瓶颈的可能原因有哪些，并针对每种原因给出具体的优化方案。

**1. 考察点**

- 是否理解 HDFS DN 磁盘 IO 的来源（读写 HDFS、scratch dir、临时文件）。
- 能否区分**硬件层**（盘型、RAID）、**配置层**（多目录、块大小）、**应用层**（小文件、shuffle）。
- 是否知道 IO 瓶颈的间接影响（任务执行慢、副本欠费、节点频繁 Decommission）。
- 加分项：能给出 DN 磁盘 IO 监控的关键指标（await、util、queue、read/write rate）。

**2. 参考答案框架**

**第一层：先归类瓶颈来源。** 磁盘 IO 瓶颈分四类：
1. **硬件层面**：HDD 老化、SSD 寿命耗尽、RAID 卡 BBU 故障；
2. **配置层面**：单目录配多块盘、多目录 IO 不均、块大小不合理；
3. **应用层面**：小文件读写（随机 IO）、shuffle spill（顺序写）、日志重 IO；
4. **架构层面**：副本数过多、HDFS Erasure Coding 配置不当。

**第二层：硬件层排查。**
- **SMART 信息**：用 `smartctl -a /dev/sdX` 看 `Reallocated_Sector_Ct`、`Current_Pending_Sector`，> 0 就有坏道。
- **RAID 卡状态**：`megacli` / `storcli` 检查 BBU（电池备份单元）状态；BBU 故障会让写回缓存失效、写路径退化为直写（write-through），写 IO 明显变差——退化幅度取决于 RAID 卡策略，本书不给出统一倍数。
- **磁盘 IO 延迟**：`iostat -x 1` 看 `await`、`svctm`、`%util`——`%util` > 80% 表示饱和，`await > 50ms` 异常。

**第三层：配置层优化。**
- **多目录策略**：`dfs.datanode.data.dir` 配多个独立磁盘目录，DN 自动 RoundRobin 写入；开启 `dfs.datanode.fsdataset.parallel.volume.balancing.enabled`（HDFS 3.x）做并行均衡。
- **块大小**：默认 128MB，对大文件友好；对小文件多（< 1MB）的场景，调小到 32MB 反而不划算——会增加元数据。
- **副本策略**：冷数据用 HDFS Erasure Coding（EC）替代 3 副本，存储开销与单位数据的落盘量显著下降（如 RS-6-3 的 1.5× 对 3 副本的 3×，具体收益随 EC 策略而异），代价是编码 CPU 与降级读放大；热数据保留 3 副本。
- **Disk Balancer**：HDFS 3.x 内置 `hdfs diskbalancer`，节点内多目录 IO 均衡；配合 `hdfs balancer` 做集群级均衡。

**第四层：应用层优化。**
- **小文件治理**：合并小文件（Iceberg / Hudi 的 `rewrite_data_files`），减少随机 IO；用 HBase 替代文本文件存储（按 key 索引）。
- **shuffle spill**：Spark 的 `spark.shuffle.file.buffer` 调大（默认 32KB → 64KB）+ `spark.sql.shuffle.partitions` 调大（默认 200 → 800+），减少 spill 次数。
- **临时目录分离**：`yarn.nodemanager.local-dirs` 与 `dfs.datanode.data.dir` 分开（避免互相挤占），最好不同物理盘。

**第五层：架构层优化。**
- **冷热分层**：热数据 SSD / NVMe，冷数据对象存储 + HDFS Cache。
- **写入合并**：上游业务用 Iceberg / Hudi 聚合写（每 1-5 分钟一批），替代每 record 直接写。
- **副本策略细化**：核心数据 3 副本（rack-aware），非核心数据 EC；通过 `dfs.replication` 与 `dfs.replication.min` 控制。

**3. 常见陷阱**

- **换 SSD 就解决。** SSD 解决顺序 IO，但随机 IO 上 SSD 也需要 IOPS 评估（家用 SSD vs 企业级 SSD）。
- **小文件只合并不优化写入。** 根因是写入端架构问题，单纯合并只是事后补救。
- **配置多目录不验证均衡。** RoundRobin 在某些业务偏置下会让某些目录过载，需用 Disk Balancer 验证。
- **EC 一刀切。** EC 写代价高（计算校验块），对小写延迟敏感业务不友好；只对冷数据用 EC。

**4. 追问预测**

- **「EC 与 3 副本的 IO 对比？」** 答：先分清口径——按**存储开销**算，3 副本是 3×、RS-6-3 的 EC 是 1.5×，EC 省一半空间；按**写入落盘量**算，EC 也只有 3 副本的一半左右；EC 的额外代价在编码 CPU 与**降级读**（丢块时需读 k 个块重建）。所以 EC 适合冷数据，不适合对延迟敏感的热写路径。
- **「DN 磁盘满和 IO 高的关系？」** 答：磁盘满会引发副本搬迁 + BlockManager 反复重试，间接放大 IO。
- **「NVMe SSD 比 SATA SSD 快多少？」** 答：设备级规格量级——NVMe 顺序读 3-5 GB/s vs SATA 0.5 GB/s，随机 IOPS 70 万 vs 10 万；但 HDFS 大文件场景的端到端收益受网络与 DN 处理能力约束，通常拿不到设备级倍数，本书不给出统一数字。

**5. 参考资料**

- Apache HDFS 官方文档中 `Disk Balancer` 与 `Erasure Coding` 章节——DN 多目录均衡与 EC 的标准实现。
- Netflix Technology Blog 与 LinkedIn Engineering 关于 HDFS IO 优化的公开文章——头部企业的大规模实践。
- 阿里 / 字节关于 HDFS 调优与 EC 落地的公开分享——国内 EC 落地的真实案例。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §3.4.3 请设计一个针对大规模 Spark on YARN 作业的慢任务排查流程，该流程需要能够快速定位「数据倾斜、GC 频繁、shuffle 失败、IO 瓶颈」四类常见原因。

**1. 考察点**

- 是否具备「分层诊断」的思路——按"作业 → stage → task → executor"分层下钻。
- 能否说出每类原因的**特征指标**（不靠经验靠指标）。
- 是否知道 Spark UI / Event Log / 历史服务器的使用。
- 加分项：能给出行业 benchmark（task 处理时长分布、shuffle spill 比例）。

**2. 参考答案框架**

**第一层：建立诊断框架。** 慢任务 = task 处理时长 > 中位数 + 3σ。诊断顺序：**先看是不是 → 再看哪一类 → 最后具体定位**。

**第二层：步骤 1 —— 作业级快速判断。**
- **Spark UI Overview**：看 summary metrics —— `Duration`、`Executor Run Time`、`Shuffle Spill (Memory)`、`Shuffle Spill (Disk)`。
- **Event Log 分析**：用 `spark-submit --conf spark.eventLog.dir=...` + Spark History Server 看历史任务。
- **异常指示器**：
  - `GC Time > 5% Task Time`：GC 频繁；
  - `Shuffle Spill > 0`：shuffle 不健康；
  - `Failed Tasks > 0`：失败存在；
  - `Shuffle Read Size 巨大`：跨节点读严重。

**第三层：步骤 2 —— Stage 级下钻。**
- **Stage 列表**：按 `Duration` 排序，找最长 stage。
- **Stage Detail**：看每个 stage 的 task 时长分布——绝大多数 < 1min，少数 > 10min，**就是倾斜**。
- **Shuffle Read/Write 指标**：某个 task `Shuffle Read` > 1GB 而其他 < 10MB，**就是数据倾斜**。
- **Input Size**：某个 task `Bytes Read` 远超其他，**就是输入倾斜**。

**第四层：步骤 3 —— Task / Executor 级定位。**
- **Task 失败原因**：`FetchFailedException`（shuffle 拿不到）、`OutOfMemoryError`（数据膨胀）、`Lost Task`（节点失联）、`TaskKilled`（AM 主动杀）。
- **Executor 日志**：`stderr` 中 `Container killed by YARN` 是 OOMKilled（exit 137）；`GC overhead limit exceeded` 是 JVM 内存耗尽。
- **Executor Metric**：`JVM Heap Memory`、`GC Time`、`Shuffle Read / Write`、`Disk Spill`。
- **历史调取**：`yarn logs -applicationId <app_id>` 拉所有 container 日志。

**第五层：四类原因的诊断特征总结。**

| 原因 | 特征指标 | 解决方向 |
| --- | --- | --- |
| **数据倾斜** | Stage 中 task 时长分布极不均匀（10x+ 差异）；`Shuffle Read` 单 task 远超其他 | 加盐打散、热点 key 拆分 |
| **GC 频繁** | `GC Time > 5% Task Time`；`Pause` > 1s；堆使用率 > 80% | 调大堆、将 GC 切换为 G1GC（或 ZGC） |
| **Shuffle 失败** | `FetchFailedException`；`Shuffle Read Size` 异常；`Reduce slow start` | 增加 retry、调 `spark.shuffle.file.buffer` |
| **IO 瓶颈** | 单 disk IOPS > 80% capacity；`await` > 50ms | 换 SSD、合并 IO、shuffle 文件合并 |

**第六层：自动化诊断工具。** 开源与工业界已有基于 Spark Listener 的作业级分析器（如 `sparklens` 这类模拟不同资源规模下作业表现的工具）用于自动检测倾斜与慢节点；阿里内部也有自研的 Spark Profiler（基于 AST 分析）。

**3. 常见陷阱**

- **只看 Duration 不看分布。** 倾斜不是慢任务，而是长尾任务——平均看不出问题。
- **不分 stage 与 task。** stage 级慢与 task 级慢是不同问题，stage 慢通常是 shuffle；task 慢是 executor 局部问题。
- **GC 与 OOM 混为一谈。** GC 频繁不等于 OOM，但 GC 频繁常常导致 OOM——必须看 GC log 而非只看 heap。
- **shuffle 失败只重试不定位。** 重试只是掩盖，根因可能是节点失联或 shuffle 文件丢失。
- **不打开 Event Log。** 没 Event Log = 任务跑完什么也看不到，必须配置 `spark.eventLog.enabled=true`。

**4. 追问预测**

- **「如何自动检测倾斜？」** 答：Spark 3.x 的 `Adaptive Query Execution` 在运行时检测并合并倾斜；`spark.sql.adaptive.skewJoin.enabled=true`。
- **「Spark UI 上的 GC Time 来自哪里？」** 答：来自 Spark 的 `MetricsSystem` 上报的 `GCTime`（JVM 累计），不是单次；想看单次要看 GC log。
- **「shuffle 文件丢失怎么恢复？」** 答：开启 `spark.shuffle.service.enabled=true`（External Shuffle Service），NM 重启不丢文件。

**5. 参考资料**

- Apache Spark 官方文档中 `Spark UI Guide` 与 `Monitoring and Instrumentation` 章节——UI 与 Event Log 的标准用法。
- 开源项目 `sparklens`（基于 Spark Listener 的作业级分析工具）与 Uber Engineering、Databricks 等团队关于 Spark 作业监控与自动诊断的公开文章——自动化诊断工具的工业实践。
- Databricks 关于 Adaptive Query Execution 的公开技术博客——AQE 倾斜检测与自动合并的实现。
- 阿里 / 字节关于 Spark 作业诊断的公开分享——国内头部企业的慢任务排查经验。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §3.4.4 请描述在万节点 HDFS 集群中，当出现数据写入速度显著下降时，你通常会检查哪些层面的指标和日志？

**1. 考察点**

- 是否具备「端到端延迟分解」的能力——把写入延迟分解到各环节。
- 能否区分**客户端**、**NN**、**DN**、**网络**四个层面。
- 是否知道 HDFS 写入链路的关键参数（`dfs.client.block.write.replace-datanode-on-failure.min-replication` 等）。
- 加分项：能给出写入吞吐下降的常见根因排序。

**2. 参考答案框架**

**第一层：HDFS 写入链路分解。** 一次 HDFS 写入涉及：客户端 → NN（申请 Block）→ DN Pipeline（写入副本）→ Ack 回包 → NN 提交。任何一环慢都会表现成"写入速度下降"。

**第二层：客户端层面排查。**
- **RPC 延迟**：`hdfs dfs -ls /` 与 `hdfs dfs -put bigfile` 对比；如果 `ls` 也慢，NN 慢；如果 `put` 慢但 `ls` 不慢，DN Pipeline 慢。
- **客户端日志**：`dfs.client.block.write.replace-datanode-on-failure.min-replication`（默认 3）配错会让 DN 副本不足时重试反复。
- **客户端 buffer**：`dfs.client.write.byte-array-manager` 默认 4MB，写入峰值高时可调到 16MB。

**第三层：NameNode 层面排查。**
- **NN RPC 延迟**：`RpcMetrics.RpcProcessingTimeAvgTime`；`GetListing` / `Create` / `AddBlock` 的 P99。
- **NN FSImage / EditLog**：`FSImage` 加载慢会让 NN 启动慢，但运行期延迟主要是 RPC 与 Block 管理。
- **NN heap**：GC 频繁会让 RPC 排队，看 `JvmMetrics`。
- **NN 写 EditLog 阻塞**：EditLog 写 HDFS 或 JournalNode 慢会让所有写阻塞；`dfs.namenode.edits.dir` 应指向独立 Namenode 或 JournalNode。
- **NN 文件数**：单 NN 管理到上亿文件（File + Block）量级时性能会明显下降（经验量级，随 NN 硬件与元数据分布而异）；Federation 是标准解法。

**第四层：DataNode 层面排查。**
- **DN 磁盘 IO**：见 §3.4.2，写入是顺序写但副本 3 + 校验等会放大。
- **DN 网络出口带宽**：单台 DN 上有大量写入任务时，NIC 被打满；`nicstat` 或 `sar -n DEV` 看 `%ifutil`。
- **DN handler 线程**：`dfs.datanode.handler.count` 默认 10，写入高峰时可调到 30-50；但每个线程内存 ~1MB。
- **DN volume 选择**：`dfs.datanode.available-space-volume-choosing-policy.balanced-space-preference-fraction`（默认 0.75）控制空间感知策略，填满 75% 后倾向选择其他盘。

**第五层：网络层面排查。**
- **节点间 RTT**：写入 Pipeline 通常 3 DN；同 rack < 1ms，跨 rack ~2-5ms；写入延迟与副本数线性相关。
- **交换机拥塞**：`drop` / `overrun` 计数；`netstat -s | grep retrans` 看重传率。
- **DNS / RPC 解析**：NN 与 DN 的 hostname 解析耗时不可忽视；用 IP 直连可绕过 DNS 慢。

**第六层：综合判断顺序。** 写入速度下降的根因排查优先级（经验排序，不是实测概率分布）：
1. NN / DN GC 频繁（最常见）；
2. DN 磁盘 IO 满（常见）；
3. 网络抖动 / 副本搬迁（次常见）；
4. 小文件大量（偶发）；
5. 配置参数不当（少见）。

**3. 常见陷阱**

- **不区分 read 与 write。** 读慢与写慢根因不同；读慢通常 DN 缓存命中低，写慢通常是 Pipeline 长。
- **只调 DN 不查 NN。** NN 慢也会让写"看起来"慢，因为 NN 是控制平面。
- **忽略副本策略对写的影响。** 副本数从 3 改 2，写吞吐会明显提升（幅度取决于 Pipeline 与网络瓶颈，本书不给出统一数字），但牺牲可靠性。
- **EC 写入一定更快的误区。** 按**落盘量 / 存储开销**，EC 比 3 副本更省；但按**写入延迟**，EC 要计算校验块、有 CPU 开销、延迟略高，读 + 修复也慢——不能一概说「写入更快」。
- **不查机房 / 网络。** 跨机房写入会引入 10ms+ 延迟（注意：跨机架 ≠ 跨机房；跨机架仍在同一机房内，量级 ~2-5ms，见本问第五层）。

**4. 追问预测**

- **「写入 P99 突增怎么定位？」** 答：先看 NN 的 RPC P99，再看 DN 的 IO P99；用 `dstat` + `iostat` 对比时间窗。
- **「EC 写比 3 副本快吗？」** 答：先分口径——按**落盘量 / 存储开销**更省（副本更少），但**写入延迟略高**（计算校验块有 CPU 开销），读 + 修复慢；适合冷数据，不适合延迟敏感业务。
- **「HDFS 写吞吐天花板？」** 答：单 DN ~150 MB/s 顺序写（HDD，量级估计），集群总写入可按「单 DN × DN 数 × 副本数倒数」粗略估算；万节点集群吞吐量级在 ~100+ GB/s。该估算忽略网络与 Pipeline 往返开销，实际值随硬件与负载差异很大。

**5. 参考资料**

- Apache HDFS 官方文档中 `Architecture` 与 `Write Pipeline` 章节——写入链路的权威论述。
- Netflix / LinkedIn / Uber 关于 HDFS 写入调优的公开技术文章——头部企业的写入链路优化经验。
- 阿里 / 字节关于 HDFS EC 与冷热分层落地的公开分享——国内大规模 HDFS 调优。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §3.4.5 在 YARN 集群中，如果频繁出现应用程序因资源不足而申请失败的情况，请说明你会从哪些角度分析问题并给出可能的解决方案。

**1. 考察点**

- 是否理解 YARN 资源分配的层次（队列、Scheduler、Container）。
- 能否区分「真资源不足」与「资源不可用」。
- 是否知道 preempt、reservation、queue max-capacity 等机制。
- 加分项：能给出资源规划的经验公式。

**2. 参考答案框架**

**第一层：先定义问题。** "申请失败"有两种：
- **ResourceManager 拒绝申请**：典型错误 `Failed to assign container` 或 `Application rejected by ResourceManager`；
- **调度器因队列资源耗尽拒绝**：典型错误 `Queue <queue> has insufficient resources`。

两种根因不同，必须先看日志类型。

**第二层：分析维度 1 —— 队列资源配额。**
- **`yarn.scheduler.capacity.<queue>.capacity`**：队列配额占比（绝对值或百分比）。
- **`yarn.scheduler.capacity.<queue>.maximum-capacity`**：队列最大占用比（含抢占）；默认 -1 = 100%。
- **`maximum-allocation`**：单 Container 最大资源（vcore + mem）。
- **诊断方法**：`yarn rmadmin -getQueues` 看队列配置；`yarn top` 或 RM UI 看实时占用。

**第三层：分析维度 2 —— 集群资源总量。**
- **节点容量**：单 NM 的 vcore + mem 总量；`yarn node -list` 看 live nodes。
- **节点健康**：不可用节点（Decommissioned、Unhealthy）会从总容量扣除。
- **资源计算器**：`DominantResourceCalculator` vs `DefaultResourceCalculator`，前者考虑 vcore 与 mem 的木桶短板，更合理。

**第四层：分析维度 3 —— 调度策略。**
- **Capacity Scheduler**：硬配额 + 抢占；
- **Fair Scheduler**：软配额 + 抢占；
- **Reservation System**（Hadoop 3.1+）：预约式资源分配，适合 SLA 严格的批量作业。

**第五层：分析维度 4 —— 抢占与弹性。**
- **`yarn.scheduler.capacity.<queue>.disable-preemption`**：是否禁用抢占；默认 false。
- **`yarn.resourcemanager.scheduler.monitor.enable`**：抢占监控开关；开启后才能 preempt。
- **`yarn.resourcemanager.monitor.capacity.preemption.max-ignored-preemption-per-iteration`**：控制抢占频率。

**第六层：解决方案分类。**
- **资源不足是临时**：增加节点（弹性扩缩容，云上可走 spot instance）。
- **资源不足是常态**：
  - 重新划分队列（按业务优先级）；
  - 提高 `maximum-capacity`（超过 100%）；
  - 启用 Reservation System 预约；
  - 开启抢占（让低优先级释放）。
- **资源不足是配置问题**：检查 `yarn.scheduler.capacity.resource-calculator`、`<queue>.user-limit-factor` 等。
- **资源不足是业务侧问题**：大作业拆分（`--conf spark.executor.instances` 调小）、小文件合并、shuffle 调优。

**第七层：长期治理。**
- **资源利用率看板**：队列 × 时段的利用率；规划资源利用率基线（如日均 70%、峰值 90%）。
- **容量规划**：每季度根据业务增长预测下一次扩缩容。
- **成本归因**：按业务线归因资源消耗，与业务预算挂钩。

**3. 常见陷阱**

- **盲目增加节点。** 节点增加但队列配额不变，仍然申请失败。
- **不区分"集群满"与"队列满"。** 集群有资源但队列已占满是配置问题，加节点无用。
- **抢占导致生产事故。** 抢占有 KILL 模式与 ORDERLY 模式，前者直接杀 Container，后者先尝试释放；生产慎用 KILL。
- **Reservation 配置复杂不验证。** Reservation 需要 `FairScheduler` + `PlanningMode`，配错会导致作业阻塞。
- **业务侧不优化只扩资源。** 100GB shuffle 不拆小作业，加 10 倍资源也救不了。

**4. 追问预测**

- **「最大作业拆多大合适？」** 答：经验值——单作业 ≤ 集群 10% 资源；超过应该队列或拆队。
- **「抢占对 Spark 影响？」** 答：Spark AM 被抢占会导致 shuffle 文件丢失（除非开 External Shuffle Service）；建议 Spark 队列关闭抢占。
- **「Reservation 与 Capacity 的区别？」** 答：Capacity 是硬配额；Reservation 是"预约"——某个时间窗内保证有资源；适合 SLA 严格的批量。

**5. 参考资料**

- Apache Hadoop 官方文档中 `Capacity Scheduler` 与 `ReservationSystem` 章节——队列配置与预约系统的标准实现。
- LinkedIn / Uber 关于 YARN 队列治理的公开文章——头部企业的大规模队列设计。
- 阿里 MaxCompute / EMR 团队的公开分享——国内队列规划与资源治理经验。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---
