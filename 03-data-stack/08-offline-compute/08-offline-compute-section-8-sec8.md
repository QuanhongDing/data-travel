> 本文件是 **08-offline-compute.md** 的子文件（§8. 面试真题集）。完整章节请回到 [index](08-offline-compute.md)。

## 8. 面试真题集

> **一句话定位**：从 MapReduce → Spark → AQE → 湖批一体，离线计算八道真题贯穿"引擎演进、Shuffle 与倾斜治理、资源调度、SQL 语义、湖仓协同、云原生弹性"六大主题。

> 本文以五段式作答（考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料），参考答案优先引用**头部互联网企业的公开架构实践**（Meta / Netflix / Uber / LinkedIn / Databricks / 阿里 MaxCompute / 字节 / 美团 / 京东 / 招行 / 米哈游 / 网易雷火 / 美的 / 永辉），便于读者溯源。

### 8.1 全景视图

| 题号 | 主题 | 难度 | 主/辅 |
| --- | --- | :---: | :---: |
| §8.1 | Spark vs MapReduce：引擎代际差异与替代逻辑 | ★★★☆☆ | 主 |
| §8.2 | AQE 自适应查询执行的原理、开关与失效场景 | ★★★★☆ | 主 |
| §8.3 | Spark 动态资源分配与 Executor 调参 | ★★★☆☆ | 主 |
| §8.4 | 小文件治理：成因、合并手法、湖表自合并 | ★★★★☆ | 主 |
| §8.5 | 数据倾斜：定位、加盐两阶段聚合与自适应策略 | ★★★★★ | 主 |
| §8.6 | Shuffle 优化：Reduce 数、Bucket Join、广播 Join 的取舍 | ★★★★☆ | 主 |
| §8.7 | Spark on K8s：云原生弹性的架构与隔离 | ★★★★☆ | 辅 |
| §8.8 | Spark SQL vs Hive on Tez/Spark：SQL 引擎的边界 | ★★★☆☆ | 辅 |

### 8.2 §8.1 Spark vs MapReduce：引擎代际差异与替代逻辑

请系统对比 Spark 与 MapReduce 在执行模型、Shuffle 行为、迭代计算与生态上的差异，并说明为什么 Spark 在 2014 年后能在大数据离线场景大规模替代 MapReduce。

**1. 考察点**

- 是否理解 MapReduce 的"两阶段硬编码"模型带来的 I/O 与延迟代价，以及 Spark 用 DAG + 内存计算如何突破这一约束。
- 能否把对比从"快 / 慢"这种表象，上升到**执行模型、容错机制、生态适配**三个维度。
- 是否知道 Spark 并不是"消灭"了 MapReduce，而是把 MapReduce 退化成了 Spark 物理计划中 Shuffle Map / Reduce Task 的一种实现。
- 加分项：能说清 Tez、Flink 在这条演进线上的位置。

**2. 参考答案框架**

**第一层：执行模型的代际差。** MapReduce 把每个作业硬拆成 Map → Shuffle → Reduce 两阶段，每阶段之间必须**落盘**，所以一个复杂逻辑（多次迭代、多路 join）会被拆成多个 MR 作业串行，每个作业都要重新从 HDFS 读上一次结果。Spark 用 DAG 把多阶段合并成一个逻辑图，**中间结果可以缓存在内存（Storage Level）**，跨 stage 的数据复用不再落盘，迭代类算法（PageRank、K-Means、SQL 优化器的代价迭代）的吞吐能拉开一到两个数量级。

**第二层：API 与表达力。** MapReduce 只提供 Map / Reduce 两类原语，写复杂逻辑要靠多次 MR 串起来；Spark 提供 RDD 的 80+ 个 Transformation / Action 算子，并且通过 DataFrame / Dataset 提供 Catalyst 优化器与 Tungsten 执行引擎，让用户写一份声明式 SQL 就能拿到向量化、谓词下推、列裁剪这些能力。这是 Meta（300PB 数仓）从 2013 年起就在内部用 Spark 替换 Hive MR 的核心动机——一份代码既可批处理又可探索。

**第三层：Shuffle 与容错。** MapReduce 的 Shuffle 必须落盘（Map 输出写本地、Reduce 拉取合并），Spark 的 Shuffle 同样落盘，但通过 `spark.shuffle.file.buffer`、`spark.reducer.maxSizeInFlight` 等参数可以更细粒度控制 IO；容错上两者都是 Lineage + 重算，但 Spark 的 RDD 抽象让分区级别的重算粒度更细，结合 `checkpoint` 可以切断过长的血缘。

**第四层：生态与生态位的让渡。** Spark 出现后并未完全杀死 MapReduce——HDFS 文件格式（SequenceFile / ORC / Parquet）、Hive Metastore、YARN 资源调度都被 Spark 复用，MapReduce 退化成"Spark 的一种底层 Task 实现"。LinkedIn 从 2015 年起把几乎所有 ETL 迁到 Spark，只保留极少数历史 MR 作业；Uber 的 Hadoop 平台（基于 Hudi）核心计算已全部 Spark 化。

**3. 常见陷阱**

- **只答"Spark 比 MapReduce 快"。** 快是一个结果，不构成原因。面试官想听的是"为什么快、付出什么代价"。
- **把 Spark 描述为"内存计算"。** 这是误解——Spark 内存只用来缓存中间结果，**Shuffle 仍然落盘**，Executor OOM 时一样会 spill 到磁盘。
- **忘记 DAG 的代价。** Spark 的 DAG 调度本身有 Driver 单点瓶颈，万级别 Task 的调度开销不可忽视；MapReduce 的进程级隔离在故障恢复上反而更"傻但稳"。
- **忽略 Tez。** Hive on Tez 也支持 DAG 合并内存连续计算，是 Hive 走向"非 MapReduce"的关键一跳，答不出 Tez 会显得知识停留在 Spark vs MR 二元对立。

**4. 追问预测**

- **「Spark 用 Lineage 替代 Checkpoint，迭代一万次还能扛吗？」** 答：不能。DAG 链长到一定规模（典型 10+ 轮 RDD 依赖）就必须对**关键节点**做 `checkpoint`，切断血缘避免 stack overflow 或恢复时间过长——这也是 Spark MLlib 内部到处可见 `RDD.checkpoint()` 的原因。
- **「Spark 一定能跑赢 MapReduce 吗？」** 答：不一定。**一次性的、IO 不重的数据扫描**，MR 反而更简单可靠；Spark 在**迭代 / 多路 join / SQL 优化**场景优势明显，但在**单次超大全表扫描 + 简单过滤**上未必拉开差距。
- **「Spark 与 Tez 的本质差别？」** 答：Tez 是 DAG 调度框架（不绑定计算语义），Spark 是带 API 与优化器的完整引擎；Tez 必须借助 Hive / Pig 才有上层语义，Spark 自带 RDD / DataFrame。
- **「为什么 Spark 没有彻底取代 Hive？」** 答：Hive 不仅是执行引擎，更是**元数据 + SQL 方言 + UDF 生态 + 调度集成**的事实标准。Spark SQL 走的是"用 Hive Metastore、用 Hive UDF、提供 Hive 兼容入口"的路径，**融合大于替代**。

**5. 参考资料**

- Matei Zaharia 等《Resilient Distributed Datasets: A Fault-Tolerant Abstraction for In-Memory Cluster Computing》（NSDI 2012）——RDD 的原始论文，是 Spark 替代 MapReduce 的理论基线。
- Meta（Facebook）发表于 SIGMOD 2013 的《Scaling the Facebook Data Warehouse to 300 PB》——超大规模数仓从 Hive MR 切到 Spark 的工程权衡。
- LinkedIn Engineering 公开博客关于把 ETL 从 MapReduce 迁移到 Spark 的系列文章——大规模迁移的工程路径与踩坑。
- Apache Spark 官方文档"Cluster Mode Overview"与"Spark on YARN"——理解 MR / Spark / Tez 在 YARN 上的统一调度。
- 阿里 MaxCompute / ODPS 公开技术材料——《大数据之路》中关于"引擎选型 MR / Tez / Spark"的演进章节，是国内超大规模场景的对标案例。

### 8.3 §8.2 AQE 自适应查询执行的原理、开关与失效场景

请说明 Spark AQE 的核心机制、三大开关（`coalescePartitions` / `skewJoin` / `convertSortMergeJoin`）的工作原理，以及哪些场景即使打开 AQE 也无法生效。

**1. 考察点**

- 是否理解 AQE 是"**在 Stage 完成后、用真实统计信息**"重写后续物理计划，这与传统 CBO 在编译期靠统计信息估计有本质区别。
- 能否把三大开关的能力边界讲清：合并小分区、处理 Join 倾斜、自动切换 Broadcast Join。
- 是否知道 AQE 的**失效场景**：关闭后性能反而变差、统计信息不准确导致决策错误、与旧特性冲突等。
- 加分项：能给出具体的参数级经验（`skewedPartitionFactor`、`skewedPartitionThresholdInBytes`）和触发条件。

**2. 参考答案框架**

**第一层：AQE 的工作模型。** 传统 CBO 在 SQL 解析后基于表/列的统计信息一次性生成物理计划，运行中遇到数据倾斜、空分区、join 基数偏差等就只能"硬扛"。Spark 3.0 起把 Exchange（Shuffle 边界）插入点开放给运行时框架——每个 Stage 完成后，**QueryStage 收集真实的数据分布（行数、字节、Partition 倾斜度）**，触发一次局部重优化，再决定下一个 Stage 的 Partition 数、Join 策略、是否拆分倾斜分区。

**第二层：三大开关的工程语义。**

- **`coalescePartitions`（合并小分区）**：Shuffle 后默认会有 200 个 partition（`spark.sql.shuffle.partitions=200`），但实际数据量可能只够 20 个分区有意义。开启 AQE 后会把小分区合并成大分区，**减少 Task 调度开销 + 减少 Shuffle 文件数**。这是几乎无副作用、必开的优化。
- **`skewJoin`（倾斜 Join 自动处理）**：基于 `skewedPartitionFactor`（默认 5）和 `skewedPartitionThresholdInBytes`（默认 256MB）识别倾斜分区，把倾斜分区的数据广播给对应 Join 端的多个 Task 同时处理（**广播复制而非广播整表**），是倾斜治理的"懒人开关"。
- **`convertSortMergeJoin`（自动转 Broadcast Join）**：原本 Sort Merge Join 需要 Shuffle，但若运行时发现某一边足够小（小于 `spark.sql.autoBroadcastJoinThreshold`，默认 10MB）就改走 BroadcastHashJoin，**省一次完整 Shuffle**。这个能力在 AQE 出现前要靠 CBO + 统计信息，AQE 让它在运行时也能决策。

**第三层：必须配合的正确参数。** `spark.sql.adaptive.enabled=true` 是总开关；`spark.sql.adaptive.skewJoin.skewedPartitionFactor=5` 决定"多大算倾斜"；`spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes=256MB` 决定"倾斜分区最小体量"（低于此值不处理，避免过度优化）；`spark.sql.adaptive.coalescePartitions.minPartitionSize` 控制合并后单分区下限。

**第四层：AQE 的失效场景。**

- **小数据集 + 短作业**：Stage 数少，运行时重优化收益小于开销。
- **没有 Shuffle 的作业**：AQE 只在 Exchange 边界生效，纯扫描+过滤的作业开不开没区别。
- **Shuffle 分区数极不均衡 + 极小 Job**：第一阶段样本太少，AQE 决策失真。
- **开启了 `spark.sql.adaptive.skewJoin.skewedPartitionFactor=10` 之类的宽松阈值**：倾斜被"忽略"，AQE 实际不做事。
- **DataFrame 自定义分区器 / 自定义 Shuffle**：绕开了 AQE 的 hook 点，开关失效。
- **Spark 版本 < 3.0**：AQE 尚未 GA；3.2 之前 `convertSortMergeJoin` 还不稳定。

**3. 常见陷阱**

- **把 AQE 当作"万能加速器"。** AQE 只解决 Shuffle 与 Join 这一段，不解决 SQL 写法本身的低效（如不必要的 `count(distinct)`、错误的谓词下推）。
- **忽略与 CBO 的关系。** AQE 与 CBO **正交**——CBO 在编译期、AQE 在运行期，二者协同。**AQE 不能完全替代 CBO**，但对缺失统计信息的表（`ANALYZE TABLE` 没跑过）尤其有用。
- **参数抄写错误。** `skewedPartitionFactor=5` 写成 `=50`，倾斜被无视；`adaptive.coalescePartitions.minPartitionSize` 设得太大，合并过头反而退化。
- **关掉 `coalescePartitions` 期望手工控制分区数**。AQE 的合并是**自适应的**，关掉反而拿不到 Shuffle 后的小分区合并收益。
- **忽略代价。** AQE 在 Stage 边界插入 QueryStage 会增加几百毫秒微调度开销，万级 partition 的小作业可能得不偿失。

**4. 追问预测**

- **「AQE 与动态分区裁剪（DPP）什么关系？」** 答：DPP 是基于运行时过滤条件裁剪分区，与 AQE 是**协同**关系而非替代——AQE 优化 Shuffle 拓扑，DPP 优化读取数据量。
- **「AQE 处理不了 Broadcast Join 的内存溢出吗？」** 答：AQE 决策做 BHj 不代表 broadcast 数据真能放进 Executor 内存。Driver 端只看到 partition 字节数，**解压后膨胀**（如 JSON、Text）会直接 OOM。**实战做法**是把 broadcast 阈值调小 + 用 `spark.sql.autoBroadcastJoinThreshold=-1` 关闭 AQE 的 BHj 自适应，针对性地手工 `broadcast()`。
- **「AQE 与 Spark Structured Streaming 的关系？」** 答：流式作业里 AQE 主要在 micro-batch 内生效；跨 micro-batch 的优化仍要靠用户显式控制 checkpoint 与 state。
- **「如何验证 AQE 是否生效？」** 答：Spark UI 的 SQL 标签页看 `AdaptiveSparkPlan` 节点；Event Log 看 `coalescedPartitions` / `skewedPartitions` 标记；或用 `EXPLAIN` 看是否输出 `AdaptiveSparkPlan isFinalPlan=true`。

**5. 参考资料**

- Apache Spark 官方文档"AQE"与"Performance Tuning"章节——开关、参数、限制的权威出处。
- Spark SQL / Catalyst 团队在 VLDB / SIGMOD 的公开论文——AQE 的架构设计与代价模型。
- Databricks Engineering Blog 关于 AQE 的系列公开文章——工业界最完整的实战经验与开关策略。
- Uber Engineering 关于 Spark 性能调优的公开博客——AQE + 动态分配在 PB 级场景的实测收益。
- 字节跳动关于 Spark on K8s 自适应执行的公开分享——弹性场景下 AQE 的额外约束与失效模式。
- 阿里云 Data Lake Analytics / EMR 团队的公开技术文章——AQE 在阿里 MaxCompute 兼容引擎中的参数经验。

### 8.4 §8.3 Spark 动态资源分配与 Executor 调参

请说明 Spark 动态资源分配（Dynamic Allocation）的触发机制、与 YARN / K8s 的交互，以及在生产环境中如何合理设置 Executor 的内存、Core 与并行度。

**1. 考察点**

- 是否理解动态分配解决的是"**Spark 申请的 executor 数应随作业负载变**"而不是"Executor 越多越好"。
- 能否把 Executor 内存模型（`spark.executor.memory` / `spark.memory.fraction` / `spark.memory.storageFraction`）讲清楚，避免常见的"内存大就快"误解。
- 是否知道动态分配在不同部署模式（YARN / K8s / Standalone）下的差异，以及**失效条件**。
- 加分项：能给出"业务峰谷 + 队列配额 + 单作业 SLA"三角约束下的具体参数选择。

**2. 参考答案框架**

**第一层：动态分配的核心动机。** 静态分配下 Executor 数固定，作业的 Stage 之间会出现"高峰 Shuffle 时资源不够、Filter 阶段资源闲置"的浪费。动态分配让 Spark 在闲置一段时间（`spark.dynamicAllocation.executorIdleTimeout`）后释放 Executor，在下一轮 Shuffle / 算 Pressure 时再申请。YARN 上通过 `spark.shuffle.service.enabled=true` 保留 Shuffle 文件归属，避免 Executor 被回收后下游 Stage 读不到 Shuffle 数据。

**第二层：三大核心参数。**

- **Executor 内存**：`spark.executor.memory` 是堆内存；`spark.executor.memoryOverhead`（默认 `max(384MB, heap * 0.10)`）是 JVM 之外的 off-heap 内存（PySpark、Netty 缓冲、shuffle 文件读缓冲都走这里）。**PySpark 作业务必显式调大 overhead**，否则会 OOM。
- **Executor Core 数**：`spark.executor.cores` 决定单 Executor 并行 Task 数；过多会因 HDFS 读连接数 / Netty 通道竞争反而退化，经验上 4-5 是个安全区。
- **Driver 内存**：Spark 3.0 后 Driver 用堆外 + Netty 与 Executor 通信，`spark.driver.memory` 主要服务于 `collect()` 拉取结果与 DAG 调度。**调大 Driver 内存对"作业慢"的帮助有限**，更多是预防 collect / 大 broadcast 时的 OOM。

**第三层：动态分配的开关与阈值。**

- `spark.dynamicAllocation.enabled=true`：总开关。
- `spark.dynamicAllocation.minExecutors` / `maxExecutors`：上下限。
- `spark.dynamicAllocation.executorIdleTimeout`：默认 60s。
- `spark.dynamicAllocation.schedulerBacklogTimeout`：默认 1s，触发扩容。
- K8s 模式下依赖 `spark.kubernetes.allocation.batch.size` 等参数做 batch 申请，避免频繁 API 调用。

**第四层：并行度与单 Task 数据量的关系。** 并行度不是"越大越好"，而是按"单 Task 处理的数据量"反推：经验值是单 Task 处理 128MB-256MB 输入。对一个 1TB 输入的作业，`spark.sql.shuffle.partitions = 1TB / 256MB = 4096`。配合 AQE 的 `coalescePartitions` 可以再合并。

**第五层：动态分配的失效场景。** ① Shuffle Service 未启用（YARN）；② 外部 Shuffle（如 Spark on K8s 用外挂 shuffle service）未对接；③ maxExecutors 被队列配额卡死；④ 短作业（< 1 分钟）调度开销 > 收益；⑤ Streaming 连续运行模式闲置窗口不存在。

**3. 常见陷阱**

- **"内存大 = 快"。** 内存只是给 shuffle / cache / broadcast 用，CPU 与 IO 没对齐时大内存是浪费。
- **调大 Executor 数却不调分区数。** 默认 `spark.sql.shuffle.partitions=200`，给一万个 Executor 反而单 Executor 只分到 0.02 个分区。
- **开启动态分配但忘了 `spark.shuffle.service.enabled`。** Executor 被回收后下游 Stage 找不到 Shuffle 文件 → `FetchFailed` 异常。
- **PySpark 作业忘调 overhead。** PySpark 占用大量 off-heap，overhead 不够直接 OOM Killed by YARN。
- **Driver 内存无限调大。** Driver 的瓶颈是 collect / broadcast / DAG，单调对工作好通常无效。

**4. 追问预测**

- **「K8s 上 Spark 动态分配与 YARN 上有什么不同？」** 答：K8s 上没有 Shuffle Service 的内建等价物，必须外挂（如 `spark-shuffle` Kubernetes Operator / Remote Shuffle Service），否则回收 Pod 会丢 Shuffle；扩缩容通过 API 调用，比 YARN 的资源调度延迟略高。
- **「怎么根据历史 Stage 选择 maxExecutors？」** 答：从 Spark History Server 拉最长 stage 的 peak executor 数，乘 1.5-2 倍作为 maxExecutors 上限。
- **「Executor 内存大 vs Executor 数多的取舍？」** 答：大内存有利于 cache 与 broadcast，但 GC 压力线性上升；多 Executor 利于并行，但每个 Executor 有固定 JVM 启动开销（典型 3-5s）。**经验上 Executor 数优先**，每个 Executor 4-5 core、堆内存 16-32GB。
- **「怎么判断该不该开动态分配？」** 答：作业间有阶段性的 Shuffle / Filter / Aggregate 切换时收益最大；流式 / 长作业没意义。

**5. 参考资料**

- Apache Spark 官方文档"Dynamic Allocation"与"Executor Memory Configuration"章节。
- Databricks 关于 Spark 集群配置的公开 Runbook——Executor / Core / Memory 的工业经验值。
- 字节跳动关于 Spark on K8s 自定义 Scheduler 的公开分享——K8s 场景下动态分配的工程改造。
- Netflix 关于 Spark 集群利用率的内部公开技术报告——弹性伸缩的实测收益。
- 阿里 EMR / MaxCompute 团队的公开调优文章——国内大集群上的 Executor 配置经验。

### 8.5 §8.4 小文件治理：成因、合并手法与湖表自合并

请分析离线计算中"小文件"的成因、它对集群与作业的具体危害，以及生产环境下系统化的治理手段。

**1. 考察点**

- 是否理解小文件的"**绝对大小不是关键，相对数量才是关键**"——元数据压力、Task 调度开销、读放大。
- 能否给出系统化治理方案：写入侧控制 + 读取侧 compaction + 湖表自合并 + 监控告警。
- 是否知道不同表格式（Iceberg / Hudi / Delta Lake）在自合并上的能力差异。
- 加分项：能给出"合并到多大"的工程经验值（典型 128-512MB），并解释为什么不是越大越好。

**2. 参考答案框架**

**第一层：小文件为什么是问题。**

- **NameNode / Metastore 元数据压力**：每个 Parquet / ORC 文件对应 HDFS 一个 Block + Hive Metastore 一行分区记录。元数据存内存，文件数从 10 万涨到 1 亿，NameNode 直接 OOM 或 GC 崩溃。
- **Task 调度开销**：Spark 一个分区对应一个 Task，百万文件 = 百万 Task，每个 Task 启动 3-5s，整个作业大量时间在"调度而非计算"。
- **读放大**：HDFS 一次读请求有最小代价（建连、seek），小文件读一次反而比大文件贵。
- **下游 Join / Aggregate 退化**：Shuffle 阶段把百万小文件当百万输入，每个输入都做一次读 IO，性能雪崩。

**第二层：小文件的成因。**

- **高频小批次写入**：Kafka → Flink → Iceberg 按 1 分钟粒度写入，每天 1440 个文件。
- **分区粒度过细**：按小时 + 业务类型双层分区，每天产生 24 × N 个分区，每个分区写文件过多。
- **上游流式 ETL**（Spark Streaming / Flink）按 micro-batch 触发，每个 micro-batch 写一个文件。
- **过度 reduce / partition**：Reduce 阶段随机数设大，每个 partition 一个小文件。

**第三层：治理手段——三层体系。**

- **写入侧预防**：`spark.sql.files.maxRecordsPerFile` 控制单文件行数；`spark.sql.shuffle.partitions` 调到合理范围；Streaming 作业设置 `trigger(availableNow=True)` + 大窗口合并。
- **独立 Compaction 作业**：定期跑合并 Job，把分区下的小文件 union 成目标大小（典型 256MB-512MB）。**关键参数**：`spark.sql.files.minPartitionSize`、Iceberg 的 `rewrite-data-files` procedure、Hudi 的 `compaction` schedule。
- **湖表自合并**：Iceberg / Hudi / Delta Lake 都内置 compaction 策略。Iceberg 通过 `expire_snapshots` + `rewrite_data_files` 定期清理；Hudi 通过 `hoodie.compaction.inline` 内联触发；Delta 通过 `OPTIMIZE` 命令。
- **监控告警**：把"分区文件数"作为 DQC 指标，超阈值（如单分区 > 200 文件）即报警。

**第四层：合并到多大。**

- 经验值 128MB-512MB（Parquet 列存 + ZSTD 压缩后）。
- 太小：读放大没缓解；太大：并行度退化（一个分区一个文件时并发上不去）、失败重算代价高。
- 与 Shuffle Block 大小 匹配（典型 128MB 块对齐）。

**3. 常见陷阱**

- **"小文件就是浪费空间"。** 这是误解——列存压缩后小文件空间浪费有限，**真正的代价是元数据与调度**。
- **Compaction 不考虑并发。** 多个作业同时跑 compaction 会争抢 IO，反而把热表写挂掉。需要分布式锁 / 时间窗。
- **合并作业不去重。** Hudi / Iceberg 的 compaction 涉及 dedup 与 sort，没配对等于"文件搬家"。
- **不监控"分区文件数"。** 没有监控，治理就是一次性动作，半年后又退化成小文件沼泽。
- **Compaction 与业务高峰冲突。** compaction 跑在大促凌晨高并发时段，会把集群打满。

**4. 追问预测**

- **「Iceberg 与 Hudi 在小文件治理上的差别？」** 答：Iceberg 通过 `metadata.json` 维护文件清单，compaction 走 `rewrite_data_files` procedure；Hudi 把 compaction 内置到 writer 端（`inline` 模式），更自动化但与业务写入耦合更深。
- **「merge into 算治理吗？」** 答：merge into 只解决"数据更新"，不解决"文件数"。它本身可能制造新的小文件。
- **「HDFS 的 HDFS Federation 能缓解吗？」** 答：能缓解 NameNode 单点内存压力，但读 IO 与调度开销还在，治标不治本。
- **「compaction 与 schema 演进冲突怎么办？」** 答：Iceberg / Hudi 的 schema 演进是表级 metadata 操作，compaction 只动 data file 层，互不冲突；但列重命名后旧文件要 backfill。

**5. 参考资料**

- Apache Iceberg 官方文档"Maintenance Procedures"——`rewrite_data_files` / `expire_snapshots` 的工程细节。
- Apache Hudi 官方文档"Compaction"——`hoodie.compaction.*` 系列的内联 / 异步策略。
- Uber Engineering 关于 Hudi 大规模应用的公开文章——PB 级 upsert + 小文件治理的真实案例。
- Netflix 关于 Iceberg 在 EB 级数仓应用的公开技术博客——Netflix 把 compaction 做成独立 Flink 作业的工程模式。
- Meta（Facebook）300PB 数仓论文——大规模文件组织与 compaction 调度的工程经验。
- Databricks 关于 Delta Lake `OPTIMIZE` 的官方文档与公开演讲。
- 阿里云 Data Lake Formation / MaxCompute 团队公开技术文章——国内湖仓场景的小文件治理范式。

### 8.6 §8.5 数据倾斜：定位、加盐两阶段聚合与自适应策略

请分析离线计算中数据倾斜的成因、典型表现，并给出从定位到治理的系统化方法。

**1. 考察点**

- 是否理解数据倾斜是"**部分 Task 处理数据远多于其他 Task**"——不是单个 task 慢，而是**长尾**。
- 能否分层回答：定位（怎么发现）→ 缓解（运行时优化）→ 根治（数据层重构）。
- 是否掌握加盐两阶段聚合、广播 Join、自适应分区、AQE 的工程取舍。
- 加分项：能给出"为什么 GroupBy 倾斜比 Join 倾斜更难根治"的深度理解。

**2. 参考答案框架**

**第一层：数据倾斜的典型表现。**

- **Spark UI**：某个 Stage 的 Task 时长分布严重不均（99% 的 Task 5 分钟、1% 的 Task 2 小时）。
- **Stage 进度卡死**：最后几个 Task 始终不结束，整个作业等这几个"长尾" Task。
- **Executor OOM**：倾斜 Task 内存爆炸，单 Executor 挂掉拖垮整个 Stage。
- **GC 日志疯狂**：倾斜 Task 大量对象在老年代，触发 Full GC。

**第二层：成因分类。**

- **Group By / Distinct 倾斜**：某 Key 数据量异常大（如 `user_id = null`、`is_default = 'Y'`），聚合时全打到同一分区。
- **Join 倾斜**：大表 Join 小表 + 某 Key 重复极高（如"未登录用户" `user_id = 0`）；两表都倾斜；两表都大但分布偏。
- **Range / 窗口倾斜**：时间分区不均（如凌晨 0 点集中下单）。
- **业务层倾斜**：状态字段只有几个枚举值（`status = 'paid'` 占 90%）。

**第三层：定位方法。**

- **Spark UI / History Server**：Stage 详情看 Task 输入 / 输出大小；按耗时排序。
- **Event Log**：分析 `task_Time` / `Shuffle Bytes Spilled` / `Memory Spilled` 指标。
- **采样定位**：在倾斜 Stage 之前加 `sample(false, 0.1)`，看 Key 分布。
- **Explain + Cost Model**：用 `EXPLAIN COST` 看 Join 顺序与代价，识别 AQE 未命中场景。

**第四层：治理手段——按代价递增。**

- **广播 Join（BHJ）**：小表广播，避免 Shuffle；阈值默认 10MB，调小阈值可处理更大表。
- **AQE 的 `skewJoin`**：自动识别倾斜分区并拆分发到多个 Task；适合"现网业务变化频繁、代码改动成本高"场景。
- **加盐两阶段聚合（Salting）**：
  - 第一阶段：给 Key 加随机后缀（如 `_0` ~ `_9`），做局部聚合。
  - 第二阶段：去掉后缀做全局聚合。
  - **代价**：逻辑复杂、调试困难；**收益**：根治倾斜。
- **过滤倾斜 Key**：先单独处理倾斜 Key（独立作业 / 独立链路），再处理主流。
- **数据层重构**：把倾斜字段拆出来做独立表，物理隔离倾斜数据。
- **改用自适应执行引擎**：Trino / StarRocks / Doris 在 OLAP 场景下倾斜治理更自动化。

**第五层：Join 倾斜 vs GroupBy 倾斜的难度差异。** Join 倾斜可以用 BHJ 或 Bucket Join **根除**（前提是一边足够小或可以分桶）；GroupBy 倾斜只能用加盐或过滤，因为聚合必然把同 Key 数据集中到一起，没有"广播聚合"的等价物。**这就是为什么 90% 的严重倾斜是 GroupBy 引发的**。

**3. 常见陷阱**

- **"加大 Executor 内存能解决倾斜。"** 这是误解——倾斜是数据分布问题，不是资源问题。加大内存只让 OOM 推迟发生，根因没解决。
- **"AQE 处理所有倾斜。"** AQE 的 `skewJoin` 只在 Shuffle Hash Join / Sort Merge Join 边界生效，对**已经倾斜的输入**做切分；对**聚合前**的倾斜无能为力。
- **加盐错位。** 局部聚合忘了去盐、全局聚合加了新盐，导致数据翻倍或丢失。
- **过滤倾斜 Key 后忘补回流。** 把 `null` / 默认值过滤后丢了 5% 的数据，结果对账时才发现。
- **GroupBy 倾斜与数据漂移混淆。** 数据漂移是动态的（某些天倾斜某些天不倾斜），根治办法是时间窗 + 自适应采样，而非写死的过滤规则。

**4. 追问预测**

- **「AQE 与加盐该选哪个？」** 答：AQE 是"少改代码"的懒人方案，命中率高且能自动适配变化中的数据分布；加盐是"漏不到则做更大改动"的根治方案。**实战策略**：先用 AQE + 监控兜底，对持续严重倾斜的特定 Key 写加盐逻辑。
- **「Join 两边都倾斜怎么办？」** 答：BHJ / AQE 都救不了，必须**先按倾斜 Key 拆表**，把"倾斜子集"和"非倾斜子集"分别处理再合并。
- **「Trino / StarRocks 在倾斜治理上有什么优势？」** 答：Trino 的自适应 Hash 分布、StarRocks 的 colocate join / bucket shuffle 都能在算子层处理倾斜；但代价是不熟悉 Spark 调优的人会面对全新工具栈。
- **「怎么评估倾斜治理的 ROI？」** 答：算"倾斜 Stage 占作业总时长比例 × 优化后缩短时间 × 该作业执行频率"。对天天跑的 T+1 作业，把一个 4 小时倾斜 Stage 优化到 1 小时，年度收益可观。

**5. 参考资料**

- Apache Spark 官方文档"Performance Tuning"——关于数据倾斜的官方诊断与建议。
- Databricks 关于 Spark 性能调优的公开知识库——10+ 个真实案例的倾斜定位与治理方案。
- Uber Engineering 关于 Spark 倾斜治理的公开博客——PB 级场景下"加盐两阶段聚合"的实战代码。
- 美团技术团队关于 Spark 性能优化的系列公开文章——外卖 / 到店业务下的倾斜治理实战。
- 京东零售技术团队关于双 11 Spark 调优的公开分享——大促场景下"晚 10 分钟触发告警"的全链路治理。
- 字节跳动数据平台团队的 Spark 调优公开文章——PB 级 ETL 中的倾斜画像与根治方案。

### 8.7 §8.6 Shuffle 优化：Reduce 数、Bucket Join、广播 Join 的取舍

请分析 Spark Shuffle 的实现原理、性能瓶颈，以及生产环境下 Shuffle 优化的三大抓手：Reduce 数控制、Bucket Join、广播 Join。

**1. 考察点**

- 是否理解 Shuffle 是 Spark / Hive / Tez / MapReduce 的"**最大 I/O 与失败来源**"——不是计算本身。
- 能否把 Shuffle 优化的三大抓手讲清楚，并区分它们适用场景。
- 是否知道 Shuffle Service、Shuffle Spill、Shuffle Compression 的工程细节。
- 加分项：能解释"为什么 Broadcast Join 不是越大越好"，以及 Bucket Join 在超大规模 Join 上的优势。

**2. 参考答案框架**

**第一层：Shuffle 的实现原理。** Spark 默认的 Shuffle 实现（2.0+ 后是 Sort Shuffle）经历：Map 端按 Partition 排序写本地 Shuffle 文件（Spill to disk if needed）→ Reduce 端拉取属于自己的分区 → Merge Sort → 进入下游计算。整个过程涉及**磁盘 IO（Spill + Fetch）**、**网络 IO（拉取）**、**序列化/反序列化（Kryo / Java）**、**合并排序（CPU）**，**任一环节都是失败与延迟的来源**。

**第二层：三大抓手的工程取舍。**

- **Reduce 数（`spark.sql.shuffle.partitions`）**：
  - 太少：单 Task 处理数据过大、内存压力大、并行度上不去。
  - 太多：Task 调度开销大、小文件爆炸、Shuffle 文件元数据压力。
  - 经验值：单 Task 处理 128MB-256MB；建议配合 AQE 让运行时再合并。
  - **针对 Shuffle 文件数膨胀**：可调 `spark.shuffle.compress=true` + `spark.shuffle.file.buffer=32k` 减少磁盘 IO。

- **Broadcast Join（BHJ）**：
  - **适用**：一边的 Distinct Key 体积小于 Executor 内存（如 100 万用户维表 + 10 亿订单流水）。
  - **优势**：完全避免 Shuffle，单边拉本地内存。
  - **代价**：广播数据序列化后必须**整体放进 Executor 堆内存**；数据膨胀（解压）会让 OOM 风险倍增。
  - **阈值**：`spark.sql.autoBroadcastJoinThreshold`（默认 10MB）控制自动广播；过大调高阈值可让更多 Join 走广播。
  - **显式调用**：`import org.apache.spark.sql.functions.broadcast; df.join(broadcast(smallDf), ...)`。

- **Bucket Join**：
  - **适用**：两张大表 Join，且按同一列分桶（`bucketBy(N, "join_key")`）。
  - **优势**：写入时已按 Join Key 分桶，运行时**完全免 Shuffle**。
  - **代价**：写入侧复杂度（必须指定分桶数与列）；分桶数必须选对；后续加列 / 改 Key 后要 backfill。
  - **实战**：Hive / Spark 数仓里 DWS 层大量使用 Bucket Join，把"日 × 类目 × 城市"等高频 Join 沉淀下来。

**第三层：辅助优化。**

- **Shuffle Service**：YARN 上启用 `spark.shuffle.service.enabled=true`，把 Shuffle 文件托管给 NodeManager 的 Auxiliary Service，避免 Executor 被回收后 Shuffle 文件丢失。
- **Shuffle Compression**：`spark.shuffle.compress=true`（默认），可换 ZSTD 替代 LZ4 提升压缩率。
- **Reduce 端合并**：`spark.shuffle.mergePercent`（默认 0.2）控制合并行为。
- **Kryo 序列化**：`spark.serializer=org.apache.spark.serializer.KryoSerializer` + 注册自定义类，序列化耗时显著下降。

**第四层：K8s / 云原生场景的额外考量。** K8s 上没有内建 Shuffle Service，必须外挂 Remote Shuffle Service，如 Apache Celeborn / Uber 的 Spark-RSS。**远程 Shuffle 把 Shuffle 数据落远端存储**，减少本地磁盘压力与 Executor 耦合，是云原生场景的演进方向。

**3. 常见陷阱**

- **"调大 `spark.sql.shuffle.partitions` 就快"。** 默认 200 对绝大多数 PB 级作业太小，但调大到 50000 反而引入百万 Task 启动开销。**AQE 的 `coalescePartitions` 是更优解**。
- **"Broadcast Join 越大越好"。** 错。Broadcast 数据**解压后**进 Executor 堆内存，1GB 压缩数据解压可能变 5GB；超过 Executor 内存 50% 直接 OOM。
- **"Bucket Join 是银弹"。** 错。Bucket Join 要求**写入时就分桶**，对增量更新 ETL（每天 Hudi upsert）兼容性差；分桶数选错后没法改，必须重建表。
- **"Shuffle Spill 是坏"。** Spill 是 Spark 内存压力下的兜底，**没有 Spill 才有风险**——内存被占满时反而会 OOM。Spill 多了是性能问题，不是有无问题。
- **"远程 Shuffle 一定比本地好"。** 错。远程 Shuffle 引入网络 IO 与第三方组件的运维成本；只有 Shuffle 数据量大、Executor 频繁被回收（云原生场景）时才显著优于本地。

**4. 追问预测**

- **「Bucket Join 与 Sort Merge Join 的取舍？」** 答：Bucket Join 写入时一次性付出代价、读取时免 Shuffle；Sort Merge Join 不需要分桶但每次都 Shuffle。**Bucket Join 适合"高频读、Key 稳定"的数仓 DWS 层**。
- **「Remote Shuffle Service 在 K8s 上的必要性？」** 答：K8s 上 Pod 可能被驱逐 / 扩缩，**Shuffle 文件与 Executor 解耦**才能保证长作业不被 Pod 回收拖垮。这是 Spark on K8s 生产部署的标准实践。
- **「AQE 把 Sort Merge Join 转成 Broadcast Join 后，内存够吗？」** 答：Driver 只看 partition 字节数，**解压后膨胀 + 广播数据对象 overhead** 会让阈值失效。生产做法是**关闭 AQE 自动广播、显式 broadcast() 控制粒度**。
- **「Shuffle Spill 严重时怎么排查？」** 答：Spark UI 看 `Shuffle Spill (Memory)` / `Shuffle Spill (Disk)` 指标；调大 `spark.executor.memory` + `spark.memory.fraction`；考虑用 Kryo 序列化减体积。

**5. 参考资料**

- Apache Spark 官方文档"Performance Tuning"——Shuffle 配置与代价的权威出处。
- Apache Spark "Sort Shuffle Manager" 内部实现分析——Shuffle 写盘的工程细节。
- Apache Celeborn（Remote Shuffle Service）官方文档——云原生 Shuffle 的开源实现。
- Uber Engineering 关于 Remote Shuffle Service 的公开文章——生产级 Shuffle 解耦的工业实践。
- Databricks 关于 Adaptive Query Execution 与 Broadcast Join 的公开演讲。
- LinkedIn Engineering 关于 Hive Join 优化与 Bucket Join 的公开博客——超大规模 Bucket Join 的工业经验。
- Netflix 关于 Iceberg + Spark Bucket Join 在 EB 级数仓的公开技术博客。

### 8.8 §8.7 Spark on K8s：云原生弹性的架构与隔离

请说明 Spark on K8s 的架构、与 YARN 模式的差异，以及生产环境中的资源隔离、Shuffle 处理与作业调度策略。

**1. 考察点**

- 是否理解 Spark on K8s 的核心动机是"**资源弹性 + 多租户混部 + 容器生态复用**"，而不是简单的"换个调度器"。
- 能否把 Spark on K8s 的关键架构（Driver Pod / Executor Pod / Shuffle Service）讲清楚。
- 是否知道生产环境中的 Shuffle 解耦（Remote Shuffle Service / Celeborn）、动态资源调度（Spark Operator / Scheduler Plugin）等关键能力。
- 加分项：能给出"大促弹性伸缩 + 夜间低峰收缩"的实战策略。

**2. 参考答案框架**

**第一层：Spark on K8s 的两种模式。**

- **Cluster 模式**：Driver 在 K8s Pod 内运行，用户通过 `kubectl spark-submit` 或 Spark Operator 提交。**生产模式**。
- **Client 模式**：Driver 在提交方机器（如 Jupyter），K8s 只跑 Executor。开发 / 调试用。

**第二层：关键架构组件。**

- **Spark Operator**：`SparkApplication` CRD 定义作业，Operator 负责创建 Driver Pod、监控、向 YARN / K8s API 申请 Executor Pod。
- **Driver Pod**：包含 Spark Driver + Spark-submit 入口；Driver 通过 K8s API 动态创建 / 销毁 Executor Pod。
- **Executor Pod**：按 `spark.executor.instances` 与动态分配参数伸缩；每个 Executor Pod 通常跑 1-4 个 Executor 进程（避免过多小 Pod）。
- **Shuffle Service**：K8s 没有 YARN NodeManager 的 Auxiliary Service 等价物，必须外挂 Remote Shuffle（Celeborn / Spark-RSS），否则 Executor Pod 被回收后 Shuffle 文件丢失。
- **Scheduler Plugin**：K8s 默认调度器不知道 Spark 的 Task 拓扑，需要 Volcano / YuniKorn 等调度器感知 Gang Scheduling、Queue、Preemption。

**第三层：与 YARN 的差异。**

| 维度 | YARN | K8s |
| --- | --- | --- |
| Shuffle 服务 | NodeManager 内建 | 需外挂 |
| 资源隔离 | 队列 + Capacity Scheduler | Namespace + LimitRange + RBAC |
| 弹性伸缩 | 队列配额有限 | Pod 级秒级伸缩 |
| 多租户 | YARN Queue | K8s Namespace + 多租户调度器 |
| 存储对接 | HDFS 原生 | HDFS（CSI Driver）/ OSS / S3 / Ceph |
| 监控 | YARN RM UI | K8s API + Prometheus |

**第四层：生产实践要点。**

- **资源配额**：用 `ResourceQuota` / `LimitRange` 控制每个 Namespace 的 CPU / Memory 上限，避免一个团队占用整个集群。
- **镜像管理**：Spark 基础镜像（包含 JDK、Hadoop client、Spark binary）私有仓库托管；Executor 镜像预热避免冷启动 30s+ 延迟。
- **网络**：K8s CNI 要支持 Service / Pod 间直连，避免 NAT 影响 Shuffle 拉取性能。
- **存储**：HDFS 通过 CSI Driver 挂载，或直接用对象存储（OSS / S3）+ 湖表（Iceberg / Hudi）。
- **作业调度**：Spark Operator 负责 Application 生命周期，Airflow / Argo Workflows 负责 DAG 编排与依赖。

**第五层：典型落地场景。**

- **字节跳动**：Spark on K8s + 自研调度器替代 YARN，**成本下降 50%**，弹性伸缩应对大促。
- **Netflix**：Spark on K8s 配合 Remote Shuffle Service 处理 EB 级 ETL。
- **Databricks**：Cloud-native 架构从一开始就基于 K8s 抽象，**多云一致**。
- **美的**：工业制造场景下 Spark on K8s 处理工厂实时上报 + 离线分析。

**3. 常见陷阱**

- **"Spark on K8s 和 YARN 一样，只是换个调度器"。** 错。Shuffle 处理、存储对接、镜像管理、Scheduler Plugin 都是新增工程复杂度。
- **"K8s 天然支持弹性"。** Pod 弹性 ≠ Executor 弹性，Spark 必须配合 Remote Shuffle 才能真正复用 Pod 弹性。
- **"用默认 K8s 调度器就够了"。** 错。Spark 是 Gang Scheduler 需求（所有 Executor 一起申请），默认调度器会让"先起 Driver 再起 Executor"造成资源碎片。
- **"Pod 启动慢是 K8s 的锅"。** 多数情况是镜像过大（3GB+ Spark 镜像含完整 JDK/Hadoop client），应做**镜像分层** + 预热。
- **"Executor 进程 = 1 Pod 1 Executor"。** 可以 1 Pod 多 Executor 减少 K8s API 调用，但代价是 Pod 内 JVM GC / 资源竞争变复杂。

**4. 追问预测**

- **「Spark on K8s 与 Ray on K8s 的取舍？」** 答：Ray 是为 AI / ML 设计，原生 actor 模型与 Python 友好；Spark 是为离线 / 大数据 ETL 设计。**Ray 适合 Python AI 工作流、Spark 适合 SQL / DataFrame ETL**。两者可并存于同一 K8s 集群。
- **「K8s 上 Shuffle Data Sink 怎么选？」** 答：本地 EmptyDir（Pod 不回收）、NFS（性能差）、Remote Shuffle Service（Celeborn / Spark-RSS，生产首选）。
- **「多租户场景怎么设计？」** 答：用 Volcano / YuniKorn 做队列 + 抢占；Namespace + RBAC 隔离；ResourceQuota 控配额；Spark Operator 支持作业优先级。
- **「Spark on K8s 与云原生数据栈（Argo / Dagster / Airflow）的协同？」** 答：Argo Workflows / Airflow 通过 K8s API 提交 SparkApplication CRD；Dagster / Prefect 把 Spark 作为 Op 嵌入；统一由 K8s 做资源调度。

**5. 参考资料**

- Apache Spark 官方文档"Kubernetes"——Cluster 模式、Spark Operator 配置。
- Kubeflow Spark Operator 官方文档与 GitHub——K8s 上的 Spark 生命周期管理。
- Apache Celeborn（incubating）官方文档——Remote Shuffle Service 的开源实现。
- Volcano / YuniKorn 官方文档——K8s 上的大数据作业调度器。
- 字节跳动技术团队关于 Spark on K8s 替换 YARN 的系列公开文章——工业级落地与成本收益。
- Netflix Technology Blog 关于 Spark on K8s + Iceberg 的公开演讲——EB 级场景的工程实践。
- Databricks 关于 Cloud-native Spark 的公开演讲——多云一致性的架构经验。
- 阿里云 ACK / EMR Spark on K8s 的公开技术文章——国内云上 Spark on K8s 的最佳实践。

### 8.9 §8.8 Spark SQL vs Hive on Tez/Spark：SQL 引擎的边界

请分析 Spark SQL 与 Hive（含 Hive on Tez、Hive on Spark）在执行引擎、优化器、SQL 方言兼容性上的差异，并说明生产环境中的选型策略。

**1. 考察点**

- 是否理解 Hive 与 Spark SQL 的"**既重叠又互补**"关系——Hive 提供 SQL 方言 + 元数据 + UDF，Spark SQL 提供执行引擎 + 优化器。
- 能否把"执行引擎 / 元数据 / SQL 方言 / UDF / 优化器"五层职责讲清楚，看清二者在每一层的边界。
- 是否知道生产环境中"**Hive 元数据 + Spark 执行 + 自研网关**"的混合架构为何成为主流。
- 加分项：能说清 Hive on Spark 与 Spark SQL 的真正差异（前者仍是 Hive 编译计划，只是执行层换成 Spark）。

**2. 参考答案框架**

**第一层：Hive 与 Spark SQL 的五层职责拆分。**

| 职责层 | Hive | Spark SQL |
| --- | --- | --- |
| SQL 方言 | HQL（接近 SQL 92/99） | Spark SQL 方言（与 HQL 高度兼容） |
| 解析与优化器 | Hive Optimizer（基于规则） | Catalyst（基于规则 + 代价） |
| 执行引擎 | MapReduce / Tez / Spark | Spark（Tungsten + CodeGen） |
| 元数据 | Hive Metastore（事实标准） | 复用 Hive Metastore |
| UDF 生态 | UDF / UDAF / UDTF（Java） | UDF / UDAF / Pandas UDF（Java + Python） |

**第二层：执行引擎差异。**

- **Hive on MapReduce**：硬编码两阶段，每个作业都要落盘，慢但稳定、失败可重。
- **Hive on Tez**：DAG 合并 + 内存连续计算，性能提升显著（典型 3-10x），但仍受限于 Hive 编译器的优化能力。
- **Hive on Spark**：Hive 编译 → Spark 执行；Hive 的 logical plan 翻译为 Spark physical plan。**性能优于 Hive on Tez**（Catalyst 优化更强），但仍是 Hive 的"老 DSL + 新执行"组合。
- **Spark SQL（原生）**：用 Spark 自己的 DataFrame API / SQL 方言，Catalyst 全程参与优化，Tungsten 生成 JVM 字节码；**性能最强，UDF 灵活度最高**。

**第三层：SQL 方言与兼容性。** Hive 与 Spark SQL 在**90% 的常见 SQL**上兼容，差异主要在：① 高阶分析函数（窗口、collect_list、复杂类型）；② Lateral View / Explode；③ 自定义 UDF 加载方式；④ 一些 ANSI SQL 行为的差异（如 NULL 排序）。生产中通常用 Spark SQL 提供 **Hive 兼容模式**（`spark.sql.hive.convertMetastoreOrc=true` 等），让历史 HQL 直接运行。

**第四层：元数据与生态的复用。** Spark SQL 主动复用 Hive Metastore 作为元数据层，让 Hive 表与 Spark 表**共享一份 Catalog**——这是二者协同的关键。Databricks 的 Unity Catalog、阿里 DataWorks、网易雷火 / 米哈游 的数据平台都遵循这一架构。

**第五层：生产选型策略。**

- **新业务、新表**：Spark SQL 原生（DataFrame + SQL），Catalyst 全优化。
- **历史 Hive 作业**：Spark SQL 用 Hive 兼容模式直接跑，无需重写。
- **极稳定 SQL 报表**：可保留 Hive on Tez，避免 Spark 升级带来的兼容性回归。
- **复杂 UDF + Python 生态**：Spark SQL 的 Pandas UDF / Python UDF 是首选。
- **阿里系业务**：MaxCompute 自研 SQL 方言 + 自研执行引擎，但**接口层兼容 Hive / Spark SQL**，迁移成本可控。

**3. 常见陷阱**

- **"Spark SQL 比 Hive 快 N 倍，所以取代 Hive。"** 错。快的那部分来自执行引擎（Catalyst / Tungsten），但 Hive 的"元数据 + SQL 方言 + UDF 生态"是 Spark SQL 没想替代的——它主动复用 Hive Metastore。
- **"Hive on Spark = Spark SQL。"** 错。Hive on Spark 仍是 Hive 编译 → Spark 执行，**Hive 的 logical plan 限制**（如不支持某些复杂子查询、谓词下推不到位）仍然存在。
- **"Hive UDF 不能在 Spark 用。"** 错。Spark SQL 通过 `Hive UDF Registry` 加载 Hive UDF（`spark.sql.hive.manageFilesourcePartitions` 等参数），多数 Hive UDF 可直接复用。
- **"Spark SQL 是 SQL 方言的银弹。"** 错。Spark SQL 不完全遵循 ANSI SQL（如 `INTERSECT` 在某些版本表现差异），迁移需测试。
- **"选 Spark SQL 还是 Hive 看哪个更现代。"** 错。看的是业务上下文（历史作业、UDF 生态、团队技能、运维能力）。

**4. 追问预测**

- **「Hive on Spark 与 Spark SQL 在性能上真的有差距吗？」** 答：有，但差距主要在**优化器深度**。Hive 编译 plan 后翻译给 Spark，**Catalyst 的全链路优化（谓词下推、常量折叠、CBO）会被打折扣**；Spark SQL 原生用 Catalyst，Tungsten 生成字节码，性能通常高 10-50%。
- **「Spark SQL 能完全替代 Hive 吗？」** 答：执行层可以，元数据 + UDF 生态层面 Hive 仍是事实标准。生产实践是"Spark 执行 + Hive 元数据 + 自研 SQL 网关"，二者各管一段。
- **「MaxCompute 与 Spark SQL 是什么关系？」** 答：MaxCompute 是阿里自研的云原生离线引擎，**接口层兼容 Hive / Spark SQL**，但执行引擎与优化器自研（与 ODPS 一脉相承）。**业务可写 Spark SQL 风格 SQL，提交后翻译到 MaxCompute 执行**。
- **「Trino / Presto 与 Spark SQL 的边界？」** 答：Trino 是联邦查询引擎，**擅长交互式 OLAP**（亚秒到秒级），不适合长时间跑批；Spark SQL 是批处理引擎，**擅长长时间 ETL**（分钟到小时级）。二者**互补大于替代**，生产中常并存。

**5. 参考资料**

- Apache Spark 官方文档"Spark SQL"与"Hive Compatibility"——SQL 方言兼容性的权威出处。
- Apache Hive 官方文档"Hive on Spark"与"Execution Engine"——Hive 多执行引擎的设计。
- Apache Tez 官方文档——Tez 作为 DAG 执行框架的设计与 Hive 的集成。
- Databricks 关于 Unity Catalog 与 Spark SQL 兼容性的公开演讲——元数据与执行解耦的工业实践。
- 阿里 MaxCompute / ODPS 公开技术文章与《大数据之路》——云原生离线引擎与 Hive / Spark SQL 的兼容设计。
- 米哈游技术团队关于游戏日志离线分析的公开博客——Spark SQL + Hive Metastore 在游戏数据栈的落地。
- 网易雷火关于游戏数据平台的公开分享——Spark SQL 处理玩家行为日志与游戏指标的工程实践。
- 美的集团关于工业 Spark 的公开技术博客——工业制造场景下 Spark SQL + Hive 混合架构。

### 8.10 本章小结

本节收录 8 道题，覆盖离线计算的"**引擎演进 / 运行时优化 / 资源调度 / 治理优化 / 架构演进 / SQL 边界**"六大主题，构成一条从底层引擎到云原生架构的完整下钻链路：

- §8.1 引擎代际（Spark vs MapReduce）：理解离线计算的"为什么"。
- §8.2 AQE：运行时自适应优化的核心机制。
- §8.3 动态资源分配：集群利用率的工程抓手。
- §8.4 小文件治理：超大规模离线计算的隐性天花板。
- §8.5 数据倾斜：性能问题的第一杀手。
- §8.6 Shuffle 优化：I/O 与失败的源头治理。
- §8.7 Spark on K8s：云原生弹性的架构演进。
- §8.8 Spark SQL vs Hive：SQL 引擎的边界与协同。

**通用答题心法**：

1. **先说清约束**——什么场景下讨论这个问题、数据规模多大、SLA 是什么。
2. **再说清选项**——有哪些主流做法、各自的适用边界。
3. **最后说清取舍**——你推荐哪条路径、付出什么代价、换来什么收益。

面试官真正想听的永远是"**你为什么这么选**"——八道题共同指向的核心能力是：**把离线计算从"工具调用"升级到"工程决策"**。

### 8.11 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
