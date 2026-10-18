> 本文件是 **13-query-engine.md** 的子文件（§8. 面试真题集）。完整章节请回到 [index](13-query-engine.md)。

## 8. 面试真题集

> 本节整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题，题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。
>
> **每题按五段式作答**：考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料。参考答案优先引用**头部互联网企业的公开架构实践**（Meta / Netflix / Uber / LinkedIn / 字节 / 阿里 / 美团 / 京东 / 招行 / 米哈游等），便于读者进一步溯源。

### 8.1 全景视图

> 本节整合 1 个原 PDF 子章节、共 6 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §13.1 | 查询引擎（Trino / Presto / Impala / Spark SQL / Drill） | 13.1.1 ~ 13.1.6 | 6 | 主 |

| 题号 | 难度 |
| --- | :---: |
| §13.1.1 | ★★★★☆ |
| §13.1.2 | ★★★★☆ |
| §13.1.3 | ★★★★☆ |
| §13.1.4 | ★★★★★ |
| §13.1.5 | ★★★★☆ |
| §13.1.6 | ★★★★★ |

### 8.2 §13.1 查询引擎（Trino / Presto / Impala / Spark SQL / Drill）

> 本主题考察「跨源联邦查询系统」的工程取舍：从 Coordinator/Worker 的 MPP 架构、Connector 抽象、内存与并发模型，到与 Hive/Spark 的对比、自研查询引擎的动机与代价。面试官通常会从一个具体场景（如"跨 Hive + MySQL 的大查询"）切入，逐层下钻到内存治理、CBO 调优与引擎自研的边界。

---

#### §13.1.1 请画出 Presto / Trino 的整体架构，说明 Coordinator 与 Worker 的职责分工，以及一条 SQL 从接收到结果返回的完整执行流程。

**1. 考察点**

- 是否理解 Trino / Presto 是**存算分离的 MPP 架构**——Coordinator 无状态只负责规划，Worker 负责执行。这是与 Spark（Driver + Executor）、Impala（Catalogd + Statestored + Impalad）最本质的差别。
- 能否按"解析 → 规划 → 调度 → 执行"四阶段说清一条 SQL 的旅程，尤其是**逻辑计划 → 物理计划 → Stage 拆分 → Task 调度**的几个关键节点。
- 是否知道 Connector 不是"插件"，而是**一个完整的 SPI**：Metadata / DataLocation / PageSource / PageSink 四件套，Coordinator 通过它**把远端数据源的 schema、统计信息、谓词下推能力都拉进 CBO**。
- 加分项：能说清 Trino 与 PrestoDB 分叉后架构上的差异（Trino 引入 Resource Group 替代 Presto 的队列模型），并能用一张图把 Exchange（HashPartitionedExchange / BroadcastExchange / GatherExchange）的关系画出来。

**2. 参考答案框架**

**第一层：整体架构（三层 + 两条数据通道）。**

```
[Client] ──HTTP──> [Coordinator]  ──REST──> [Worker × N]
                  （解析/规划/调度）       （执行 Task，拉取/计算数据）
                       │                          │
                       └── Connector SPI ─────────┘
                              │（Hive / Iceberg / MySQL / Kafka）
                              ▼
                       [外部存储 + Metastore]
```

- **Coordinator**：通常 1 + N（HA）部署。负责接收 SQL、词法/语法解析（ANTLR）、生成逻辑计划、运行 Cost-Based Optimizer（自研；Trino 的前端与优化器属「自研前端 + 自研优化器」这条路线，是否采用通用 SQL 框架按源码依赖自查，见 [§7.2](13-query-engine-section-7-sec7.md)）、拆 Stage、按 Worker 调度 Task、聚合结果返回。**Coordinator 不存储任何数据页**，内存压力主要是**查询规划与统计信息**，不会随数据量爆炸。
- **Worker**：无状态，**只执行 Coordinator 分发过来的 Stage**。每个 Worker 上跑若干 Task，每个 Task 里跑若干 Driver（pipeline 执行单元），Driver 用 Page（列存块）作为基本数据单位。Worker 通过 Exchange Operator 与其他 Worker 交换数据（Hash / Gather / Merge），全部走内存 + spill 到本地磁盘。
- **Discovery Service**（早期架构遗留）：Worker 启动时向 Discovery 注册自己的地址，Coordinator 通过它发现 Worker。Trino 新版本已弱化此组件。

**第二层：一条 SQL 的完整旅程。**

1. **解析**：`SELECT ... FROM hive.sales.orders o JOIN mysql.crm.users u ...` → ANTLR 解析为 AST（SqlNode 树）。
2. **逻辑规划**：语义分析（解析 catalog/schema/table，访问 Metastore 拿列与统计信息）→ LogicalPlanner 把 AST 转为 Relational Operator 树（TableScan / Filter / Project / Join / Aggregate）。
3. **优化**：Optimizer 应用 Rule（谓词下推、列剪裁、Join 重排、Exchange 插入、子查询去关联）。CBO 在此发挥作用——基于表/列的统计信息（NDV、行数、distinct count）做**代价估算**（CPU + IO + Network），选择代价最低的物理形态。
4. **分布式规划**：`DistributedPlanner` 把 LogicalPlan 拆为 Stage。每个 Stage 是一组可并行的 Pipeline。Stage 边界由 Exchange 决定——HashPartitionedExchange 上游按 Join Key shuffle 到下游 Bucket，BroadcastExchange 把小表复制到所有下游 Worker。
5. **调度**：`SqlQueryScheduler` 把 Stage / Task / Driver 分发给 Worker 池，按 Worker 的并发槽位（`task.concurrency`）排队。**大查询会被 Resource Group 限制**，避免挤占小查询。
6. **执行**：Worker 上的 Driver 拉数据（Connector PageSource）、算子计算、生成 Page，通过 Exchange 传给下游 Stage。中间结果超过内存阈值就 spill 到本地磁盘（HDFS 本地盘）。
7. **回传**：最终 Stage 的结果由 Coordinator 串流回 Client，断流式返回，不需等到全部算完。

**第三层：与相邻架构的对比。**

- **vs Spark**：Spark Driver 是任务编排的"中心"，Driver 与 Executor 是紧耦合的（DAGScheduler 跟踪所有 Stage），Driver 单点；Trino 的 Coordinator 只负责规划与调度，不持有数据，Worker 互相 Exchange 数据，因此**更适合交互式低延迟**。
- **vs Impala**：Impala 有 Catalogd（同步 HMS 元数据缓存）+ Statestored（集群状态）+ Impalad（执行）三个组件；Trino/Presto 只有 Coordinator + Worker 两类组件，**架构更简洁、HA 模型更简单**。
- **vs Hive on Tez**：Hive on Tez 是批处理，Stage 启动延迟高（秒级到分钟级）；Trino/Presto 走内存流水线，**Stage 启动延迟在毫秒级**。

**3. 常见陷阱**

- **把 Coordinator 当成"主节点"**。Coordinator 不持有数据、也不执行算子，它的瓶颈在**规划复杂度**和**调度并发**，而不是数据吞吐——这是面试常错答的根源。
- **混淆 Exchange 的种类**。HashPartitionedExchange 用于大表 Join（按 Join Key shuffle 到 Bucket），BroadcastExchange 用于小表广播（避免 shuffle），二者**代价模型完全不同**。
- **把 Connector 等同于 JDBC 驱动**。Connector 远不止是连接——它向上层暴露**统计信息收集能力**和**谓词下推能力**，Trino 的 CBO 依赖 Connector 提供 `getStatistics()`、`applyFilter()`、`applyProjection()` 才能真正跨源做联合优化。
- **忽略 Resource Group**。没有 Resource Group，集群里一个小查询就会被大查询挤掉所有槽位。这是**面试官下钻"你怎么防止大查询搞死集群"时的核心答案**。

**4. 追问预测**

- **「Coordinator 挂了怎么办？」** 答：Coordinator 自身无状态，关键路径上的内存（规划结果、运行时统计）都不持久化；部署上启用多 Coordinator + 客户端轮询（Trino CLI / JDBC 自动 failover）。Worker 上的 Task 会被**作废**（不在 Stage 中点持久化），需要客户端重发查询。Trino 较新版本引入 Exchange Manager（基于对象存储）实现部分容错，正在向 SPof-free 演进。
- **「一条 Stage 里有 1000 个 Driver 跑慢，怎么办？」** 答：先看 Web UI 的 Stage 详情页——若 Driver 间输入大小差异巨大（长尾），定位数据倾斜键；若输入相近但耗时差异大，查 GC、网络/磁盘抖动；若所有 Driver 都慢，看数据源是否到达瓶颈（MySQL 连接池满 / Hive 文件数过多）。
- **「Trino 怎么做到毫秒级 Stage 启动？」** 答：内存流水线 + JVM JIT + 零拷贝 Page（编码后的列存块跨 Driver 共享）+ 预热 JIT（HOT 方法内联）。代价是首次启动慢（JIT 预热阶段）。
- **「你会在生产上跑多大集群？Coordinator 撑得住吗？」** 答：Meta Presto 单集群规模在 1000+ Worker（该节点数量级本节无法给出可核验的具体出处，按【经验】档处理），单 Coordinator 撑住（规划极轻）；但仍会**水平拆 Coordinator**（独立承接不同部门、不同 Resource Group），避免单点规划压力。

**5. 参考资料**

- Trino 官方文档 Architecture 章节——Coordinator、Worker、Exchange 的权威定义与配置项。
- 《Presto: SQL on Everything》（ICDE 2019）——Presto 的架构论文，Coordinator/Worker 模型的原始出处。（原稿在本节不同条目里把该论文的第一作者分别记为 Martin Grund、Piotr Findeisen，发表刊物也记为 IEEE Data Engineering Bulletin 2019；本仓其它章节统一写作「Presto: SQL on Everything，ICDE 2019」，本节按后者统一，作者首位与发表刊物以论文原文为准，引用前请自行核对。）
- Raghav Sethi 等关于 Presto 架构的 Meta Engineering Blog 公开材料（题名与发布年份本节无法核实，引用前请自行查证）——Meta 把 Presto 从 0 推到 1000+ 节点的实战总结。
- Starburst（Trino 商业化公司）的《Trino Engineering Blog》——Trino 400+ 版本架构演进、Exchange Manager 容错、Resource Group 设计的官方权威材料。
- **Netflix 的 Presto 集群调度演进** —— 从单 Coordinator 到多 Coordinator 集群（按部门拆分），把规划压力与查询负载解耦，是大型互联网企业 Presto/Trino 部署的真实形态。
- **LinkedIn 的 Presto on Pinot 联邦查询** —— Presto 既查湖（Hive）又查 OLAP（Pinot），Coordinator 通过 Connector SPI 把两种统计信息都拉进 CBO，是跨源 CBO 的代表性案例。
- **字节跳动 Trino 联邦查询平台** —— 单集群千级 Worker，PB 级 Hive + 实时 Kafka + MySQL 维表，Trino 是事实上的统一查询入口，对应 Coordinator/Worker 模型在超大互联网公司的落地。
- **Meta（Facebook）Presto 大规模实践** —— Meta 是 Presto 的诞生地，Presto 在 Meta 内部支撑 1000+ 节点、数万日活用户，覆盖数据仓库、Ad-hoc、ETL、监控等多种场景。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量级（节点数、数据量、PB / EB 级等）与性能类数字（延迟、可用率、加速倍数等；以上参考资料各条中的性能类数字已在相应条目内逐条标注档位），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。精确链接请按条目名称自行检索核验。

---

#### §13.1.2 Trino / Presto 是基于内存的计算引擎，请说明它的内存管理机制：内存池（Memory Pool）的设计、Memory Revoke 触发条件、Spill to Disk 的实现，以及大查询场景下 OOM 的规避策略。

**1. 考察点**

- 是否理解 Trino 的内存管理是**两级预留 + 全局协调**——用户查询预留（`query.max-memory`）、Task 级预留（`task.memory-per-task`）、集群全局预留（Resource Group），三者共同防止集群整体 OOM。
- 能否说清**Memory Revoke** 的触发链路：Driver 申请内存 → Pool 达到阈值 → Driver 收到信号 → Driver 把中间结果 spill 到磁盘 → Driver 继续执行。
- 是否知道 Spill 不是"自动"功能——它要**算子支持**（Spillable Interface）才能 spill 到磁盘。Spill 仅对 Aggregation / Hash Join / Window / Order By 等算子生效，不是"所有中间结果都自动落盘"。
- 加分项：能区分 Trino 与 Spark 的内存模型差异——Spark 走堆外 + 序列化（单列操作），Trino 走 Page + 编码（多列并行），二者 spilling 的代价与适用场景完全不同。

**2. 参考答案框架**

**第一层：Trino 的内存池分层。**

Trino 把内存分为**三层 Pool**：

| Pool | 作用域 | 配置 | 作用 |
| --- | --- | --- | --- |
| **General Pool** | 整个 Worker | `query.max-memory-per-node` | 跨查询共享的"普通内存池"。当多个查询都用满时，按比例 OOM kill |
| **Reserved Pool** | 整个 Worker | `query.max-memory-per-node` 的子集 | 给"必须保证能跑"的大查询预留；小查询用不到 |
| **User Query Memory** | 单个 Query | `query.max-memory` | 单查询上限 |

关键约定：**每个 Worker 节点都按这个三层结构分配内存**。Coordinator 通过 Resource Group 决定哪些查询可以进入 Reserved Pool（默认小查询用 General Pool，大查询预留 Reserved Pool）。

**第二层：Memory Revoke 的触发链路。**

1. Driver 在算子中申请内存（典型场景：Hash Join 建 Hash 表、Aggregation 建 Hash 聚合桶）。
2. Pool 达到水位（90% 警戒线）→ Pool Manager 标记 Driver 进入"应被 Revoke"状态。
3. Driver 通过线程中断收到 Revoke 信号 → 调用**算子的 `spill()` 方法**把中间状态序列化到本地磁盘（spooling 目录）。
4. Driver 释放内存后继续执行。后续读盘从磁盘反序列化回来。
5. 若 Driver 不支持 spill（如某些自定义 Operator），则**继续占用内存直至 OOM**，Pool Manager 会按策略 kill 整个 Query 或单个 Task。

**第三层：哪些算子支持 Spill。**

| 算子 | 是否支持 Spill | 说明 |
| --- | --- | --- |
| Hash Join | 是（分批 spill） | 把 Hash 表分桶落盘，代价是大量 disk IO |
| Hash Aggregation | 是 | 同上 |
| Window / Rank | 是 | 中间排序结果 spill |
| TopN / Order By | 是 | 中间 Top N 结果 spill |
| TableScan / Exchange / Filter | 否 | 这些不持有"中间状态"，不需 spill |

**关键认知**：Spill 会**显著拖慢查询**（幅度随算子、数据量与 spill 盘类型而异，本节无法给出可溯源的统一数字，此处按【经验】档处理），且 IO 抖动可能引发 Stage 重做。生产上"让查询跑得稳"靠的是**控制进入 Worker 内存的数据量**（分区裁剪、谓词下推），而不是靠 spill 兜底。

**第四层：大查询 OOM 规避策略。**

生产上有五条经验性手段，按代价递增：

1. **Resource Group + 排队**：把大查询分到独立的 Resource Group，配额限制并发与内存上限，**不让它和小查询抢 General Pool**。
2. **CBO 调优**：让 CBO 选 HashPartitionedExchange 而非 BroadcastExchange（避免大表广播爆内存）。
3. **加盐 / 分桶**：对 Join Key 做加盐（把大表按 hash 拆为 N 个子表）— 减少单 Bucket 内存占用。
4. **Spill 目录用 SSD / 独立盘**：spill 目录不要和数据盘混用——spill 是大顺序 IO，会污染数据缓存。
5. **Killing 大查询**：超过 `query.max-run-time` 或内存阈值时直接 kill，配合"先跑小查询 + 大查询走后批"的策略。

**第五层：与 Spark 的内存模型对比。**

- **Spark**：`execution-memory` + `storage-memory`（统一内存池）+ 堆外（Tungsten）。**数据按列**拆 block，每列按 Project 算子独立 spill/load，spill 粒度极细，但跨列并行差。
- **Trino**：`Page`（多列紧凑编码）+ Pool 协调。**数据按行组（1024 行默认）**组织，每页整体 spill，spill 粒度粗，但跨列并行度高（向量化执行）。

生产上的取舍：**Trino 适合 join 多列、单次查询多次复用数据的 OLAP 场景；Spark 适合单列宽表的批处理场景**。

**3. 常见陷阱**

- **以为 Spill 是"自动的"**。Spill 只对支持 Spill 的算子有效，且 spill 路径走**磁盘顺序写 + 后续读**，IO 抖动会拖垮查询。
- **把内存池当成"每个查询独立配额"**。General Pool 是**跨查询共享**，单查询超出 `query.max-memory` 才会被限。这是面试时常见的反向错误。
- **忽视 Resource Group 的"reserved"语义**。Reserved Pool 是**留给大查询兜底的**——如果所有业务都进 Reserved Pool，就退化为"无隔离"。**正确用法是：小查询走 General Pool，大查询走 Reserved Pool**。
- **OOM 后直接扩容 Worker**。扩容只是把"OOM 时间"延后，不解决倾斜问题。**应该查 Task 时长分布、看是否有 1-2 个 Driver 异常耗时**。

**4. 追问预测**

- **「OOM 后 spill 落盘，磁盘写满了怎么办？」** 答：Worker 配置 `spiller-spill-path` 用独立盘，且**监控 spill 目录磁盘用量**；当 spill 目录不足时，Driver 会拒绝 spill 直接 OOM kill，这是 last-resort 兜底。生产上需要给 spill 目录**预留 2-3x 内存大小**的磁盘（比例按【经验】档处理，随算子类型与数据分布而异）。
- **「Hash Join 大表 Join 大表，怎么不让它 OOM？」** 答：让 CBO 选 HashPartitionedExchange（按 Join Key shuffle 两边到对应 Worker），而不是 BroadcastExchange——后者会把一侧全量复制到所有 Worker，必然 OOM。
- **「Trino 和 Spark 都能 spill，区别是什么？」** 答：Spark 的 spill 走 Tungsten 的 Page 序列化（堆外 + 二进制紧凑），spill 粒度细；Trino 走 Page + 编码，spill 粒度粗。生产上**Spark 对单列宽表 spill 更友好**（典型如 Parquet 单列读），**Trino 对多列混合 spill 更友好**（典型如多维分析）。
- **「内存 vs 线程数，哪个瓶颈更常见？」** 答：Trino 默认 Driver 数随数据量增长（`task.concurrency`），**内存瓶颈更普遍**。线程数到瓶颈通常出现在 Driver 内 IO 等待场景（如 Connector 慢响应）。

**5. 参考资料**

- Trino 官方文档 Memory Management 章节——Memory Pool、Reserved Pool、User Query Memory 的权威定义与配置项。
- 《Presto: SQL on Everything》（ICDE 2019）——Presto 内存管理的原始论述，含 Memory Revoke 与 Spill 的实现细节。
- Reynold Xin 等《Apache Spark: The First Decade》（ACM SIGMOD 2019）——Spark 与 Presto 内存模型的对比材料（该题名、作者与会议信息本节无法核实，引用前请自行查证）。
- Starburst Engineering 关于 Trino Spill 改进的系列博客——Spillable Operator 的设计与生产经验。
- **Meta Presto 内存治理实战** —— Meta 在 1000+ Worker 上把 General/Reserved Pool 配额精确到 Resource Group，按查询类型分级，是超大集群内存治理的工业范本。
- **字节跳动 Trino 大查询治理** —— 字节通过 Resource Group + Killing 大查询 + 限并发三项措施，把集群可用率维持在高位（可用率数字本节无法给出可核验的具体出处，量级按【经验】档处理），是国内大厂 Trino 内存治理的代表。
- **阿里 MaxCompute 与自研查询引擎内存模型** —— 阿里在 MaxCompute 与自研查询引擎中对内存池的设计思想，对应国内大厂对"内存 vs 线程 vs 队列"的工程取舍。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量级（节点数、数据量、PB / EB 级等）与性能类数字（延迟、可用率、加速倍数等；以上参考资料各条中的性能类数字已在相应条目内逐条标注档位），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。精确链接请按条目名称自行检索核验。

---

#### §13.1.3 Trino 的 Connector 是它最大的可扩展性优势。请解释 Connector 的 SPI 设计、谓词下推（Predicate Pushdown）和列剪裁（Column Pruning）的实现机制，以及如何开发一个自定义 Connector 接入内部系统。

**1. 考察点**

- 是否理解 Connector 不是"插件"，而是**一套完整的 SPI**——它把数据源的能力（schema 读取、统计信息、谓词下推、数据读取、数据写入）**全部抽象**，让 Trino 的 CBO 能跨源做联合优化。
- 能否说清**谓词下推的代价模型**：CBO 必须知道"哪些 Filter 能下推""下推后能减少多少数据量"，否则可能**下推错**（下推一个非确定谓词，结果不一致）。
- 是否知道 Trino 自带**数量众多的 Connector**（Hive / Iceberg / MySQL / Kafka / ES / Redis ...；具体计数随版本增长，本节无法给出可核验的数字，以所用版本的官方文档为准），每个 Connector 的能力差异巨大——这是"为什么 Connector 是 Trino 最大资产"的根本原因。
- 加分项：能解释**元数据缓存**（Coordinator 缓存 Metastore schema/统计信息）与 Connector 的关系——大集群上 Metastore 是隐性瓶颈，**Connector 必须主动刷新 + 失效缓存**才能保证 CBO 决策正确。

**2. 参考答案框架**

**第一层：Connector SPI 的四大件套。**

每个 Connector 实现以下接口（接口设计面向"Trino 怎么用这个数据源"）：

| 接口 | 职责 |
| --- | --- |
| `ConnectorMetadata` | 提供 schema/table/column 信息、统计信息、采样能力——CBO 的输入 |
| `ConnectorDataLocationProvider`（新）/ `ConnectorMetadata.getTableHandle()` | 把 SQL 的 Table 引用解析为内部句柄；**支持谓词下推决策**（决定哪些 Filter 推到数据源） |
| `ConnectorPageSourceProvider` / `RecordSetProvider` | 实际从数据源读数据，封装为 Trino 的 Page（列存块）返回 |
| `ConnectorPageSinkProvider` | 把 Trino 的 Page 写回数据源（部分 Connector 支持） |

核心设计原则：**Connector 向 CBO 暴露尽可能多的能力**（行数、NDV、Min/Max、是否支持下推），让 CBO 能基于真实代价而非"启发式"做决策。

**第二层：谓词下推（Predicate Pushdown）的实现机制。**

下推的链路：

1. SQL：`SELECT * FROM iceberg.orders WHERE user_id = 12345 AND order_time > '2025-01-15'`
2. LogicalPlanner 解析为 `TableScan(iceberg.orders) → Filter(user_id=12345, order_time>'2025-01-15') → Project(*)`
3. Optimizer 调用 `ConnectorMetadata.applyFilter()`，把 Filter 下推到 TableScan 的算子。
4. Iceberg Connector 判断 `user_id = 12345 AND order_time > '2025-01-15'` **都能下推**——`user_id` 有 min/max 索引可剪裁文件，`order_time` 是分区列可直接裁剪分区。
5. 返回的 `TableHandle` 携带**已经过滤的数据范围**——后续 Driver 只读这部分文件。

**关键约束**：谓词下推必须是**确定性的**（不能下推 `WHERE RAND() < 0.1` 或带 UDF 的谓词），否则**跨 Stage 结果不一致**。Connector 必须明确告诉 CBO："这个谓词我能下推"或"我不能下推"。

**第三层：列剪裁（Column Pruning）的实现机制。**

1. SQL：`SELECT order_id, amount FROM iceberg.orders`
2. Project 算子只保留 `order_id` 和 `amount` 两列。
3. Optimizer 把 Project 下推到 TableScan——TableScan 只读这两列的 Parquet column chunk，跳过其他列的 IO 与解码。
4. 如果下游还有 Join / Aggregation，过滤列进一步压缩到 `Page` 的列数。

**关键收益**：列剪裁在大宽表（数百列）上收益最大——一次查询可能只读数百列中的寥寥几列，省下的 IO 与解码代价相当可观（省下的比例取决于表的列宽分布与读取列数，本节无法给出可溯源的统一数字，此处按【经验】档处理）。

**第四层：自定义 Connector 接入内部系统的步骤。**

生产上接入内部存储系统（如自研 KV / 自研图存储）的典型步骤：

1. **定义 Catalog 配置**：`etc/catalog/internal.properties` 配置 `connector.name=internal-custom` + 连接参数。
2. **实现 ConnectorMetadata**：暴露 schema/table/column 元数据 + 统计信息（哪怕给个估算值，**不要返回 0 或无穷大**——CBO 会基于错误代价做错误决策）。
3. **实现 PageSource**：把数据源读为 Trino 的 Page——这是最大的工作量（涉及编码、PageBuilder、Block 类型映射）。
4. **决定是否支持谓词下推**：内部系统若支持范围查询（如 KV 的 key prefix 扫描），就实现 `applyFilter`；若不支持，返回 false 让 Trino 在内存过滤。
5. **编写测试 + 跑集成测试**：用 Trino 的 `BaseConnectorTest` 框架验证谓词下推、列剪裁、Join 顺序等行为。
6. **性能调优**：用 `EXPLAIN (FORMAT JSON)` 看 CBO 决策是否正确，必要时调 Connector 返回的统计信息精度。

**3. 常见陷阱**

- **把 Connector 等同于 JDBC 驱动**。JDBC 驱动只暴露"连接 + 执行 SQL"，而 Connector 暴露**完整的优化能力**——二者接口设计哲学不同。
- **下推任何谓词**。Connector 不能下推**非确定性**谓词（UDF、`RAND()`、带时间戳的谓词等），否则**并行计算结果错位**。CBO 会做 `Determinism` 检查，但 Connector 也要正确声明。
- **不返回统计信息**。Connector 返回"未知"统计信息 → CBO 退化为启发式优化 → Join 顺序、Exchange 类型选错。这是**生产 Connector 最常见的隐性故障**。
- **缓存不一致**。Connector 缓存了 Metastore 的 schema，**数据源加列后 Connector 还在用旧 schema**——必须实现主动 invalidate（基于 HMS notification 或定时刷新）。

**4. 追问预测**

- **「怎么判断一个谓词能不能下推？」** 答：基于数据源的物理能力——能利用索引的（等值 / `IN / 范围）下推；带函数的（`UPPER(name) = 'X'`）若数据源有相应函数（如 HBase 的 `ColumnPrefixFilter`）则可下推；带非确定性函数（`RAND()`、`NOW()`）一律不下推。
- **「MySQL Connector 为什么很慢？」** 答：MySQL Connector 默认**不下推聚合/Join**——所有计算都在 Trino Worker，MySQL 只当数据源。生产优化手段：① 启用 `join-pushdown.enabled=true`（MySQL 8.0+ 才支持真正的 Join 下推）；② 加 `mysql.partition.column` 提升并行度；③ 用 `EXPLAIN` 看是否走了 IndexScan。
- **「Hive Metastore 是 Connector 的瓶颈吗？」** 答：是的。**HMS 的 RPC 延迟**（通常是百毫秒量级的往返开销；该量级随 HMS 的部署形态、元数据规模与网络环境而异，本节无法给出可核验的具体出处，此处按【经验】档处理）会让 Connector 启动慢，且**元数据缓存刷新不及时**会让 CBO 拿不到最新统计信息。生产上需要独立部署 HMS、用 Thrift 连接池、并对大型表开启 `hive.metastore-notification-based-refresh` 事件驱动刷新。
- **「Iceberg 和 Hive Connector 的本质区别？」** 答：Hive Connector 通过 HMS 拿 schema/统计信息；Iceberg Connector 通过 Iceberg 的 manifest 拿 schema/统计信息，**绕开 HMS 的瓶颈**——这是 Iceberg 在大表场景下比 Hive 快的核心原因。

**5. 参考资料**

- Trino 官方文档 Connector SPI 章节——四大件套接口的权威定义与示例代码。
- 《Presto: SQL on Everything》（ICDE 2019）——Connector 抽象的原始论述。
- Apache Iceberg 官方文档 Time Travel 与 Statistics 章节——Iceberg Connector 如何利用 manifest 提供 CBO 统计信息。
- Starburst 关于 JDBC Connector、Elasticsearch Connector、Kafka Connector 的官方文档——各 Connector 的能力差异与生产经验。
- **Netflix 自研 Iceberg Connector 的演进** —— Netflix 在 Hive Connector 基础上扩展 Iceberg 支持，绕过 HMS 瓶颈，实现 EB 级 Iceberg 表的联邦查询。
- **Uber 自研 Connector 接入 AresDB** —— Uber 通过自研 Connector 把内部 AresDB（时序 OLAP）接入 Presto，统一跨源查询入口。
- **字节跳动自研 Kafka Connector 流式查询** —— 字节扩展 Trino 的 Kafka Connector，支持精确一次流式拉取 + 自定义 partition 切分，对应国内大厂流式联邦查询的代表。
- **LinkedIn Presto 与 Pinot 联邦** —— LinkedIn 通过自定义 Connector 让 Presto 既能查湖又能查 Pinot（实时 OLAP），是 Presto 跨源 CBO 的工业代表。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量级（节点数、数据量、PB / EB 级等）与性能类数字（延迟、可用率、加速倍数等；以上参考资料各条中的性能类数字已在相应条目内逐条标注档位），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。精确链接请按条目名称自行检索核验。

---

#### §13.1.4 在生产上跑 Trino / Presto 时，大查询（扫描数十 TB / 跑数小时）很容易把集群资源吃满，导致小查询被饿死。请系统说明大查询治理的全套方法：Resource Group 隔离、查询排队、Killing 策略、限流与降级。

**1. 考察点**

- 是否理解**大查询治理的核心矛盾**——查询资源是共享的（CPU / 内存 / IO / Network），但**大查询与小查询的 SLA 不同**。生产上必须**按 SLA 分层隔离**，而不是"所有查询平等抢资源"。
- 能否说清 Resource Group 的**三级模型**（soft memory limit / hard memory limit / queued concurrency），并能用具体配置解释为什么这样设计。
- 是否知道大查询治理不只是"限流"——还包括**预防**（拒绝超规格查询）、**检测**（实时监控集群水位）、**兜底**（Killing 超时查询）三步联动。
- 加分项：能给出**真实生产案例**（如 Meta / 字节 / Netflix / Uber 的治理经验），并能解释"为什么 Resource Group 隔离比简单的连接池隔离更有效"。

**2. 参考答案框架**

**第一层：问题的本质——大小查询的 SLA 冲突。**

- **小查询（5-15s 交互式）**：用户期望秒级返回，**最忌被卡**——一次等待就会让分析师失去耐心。
- **大查询（数十分钟到数小时）**：用户能接受较慢，但**会独占集群资源**——一个未限流的大查询能把 1000 节点集群跑满，让所有小查询同时延迟。

生产上的核心取舍：**不能让大查询饿死小查询，也不能完全禁止大查询**——大查询通常是离线 ETL、月底对账、AI 训练样本抽取，必须允许跑。

**第二层：Resource Group 三级隔离。**

Trino 的 Resource Group 是**树形结构**，每个 Group 有：

| 字段 | 含义 | 典型值 |
| --- | --- | --- |
| `softMemoryLimit` | 软上限——Group 内的查询**总量**到达此值后开始排队 | 集群内存的 50% |
| `hardMemoryLimit` | 硬上限——Group 的**聚合内存**越过此值后开始 kill 组内查询（与 `softMemoryLimit` 同为「组内聚合内存」口径，是「排队」与「kill」两道闸门，**不是单 query 上限**） | 不低于 `softMemoryLimit`；具体默认取值以所用版本的官方文档为准 |
| `maxQueued` | 排队上限——超过此值的查询直接拒绝 | 50-100 |
| `schedulingPolicy` | 调度策略——`weighted-fair`、`weighted`，或 `query-priority-hierarchical` | weighted-fair |
| `softConcurrencyLimit` | 软并发上限 | 集群 CPU 核数 |
| `hardConcurrencyLimit` | 硬并发上限 | 集群 CPU 核数 |

**树形设计的妙处**：可以按"部门 → 业务线 → 查询类型"建树，**每个叶子节点独立配额**——Ad-hoc 部门的小查询永远不会吃掉 ETL 部门的配额。

**第三层：完整的大查询治理链路。**

```
[SQL 入口]
   │
   ↓
[Step 1: Resource Group 路由]      ← 按用户 / catalog / query type 分组
   │
   ↓
[Step 2: 配额检查]                ← 检查 Group 是否有内存/并发配额
   │
   ↓ (超额)
[排队 / 排队超时直接拒绝]
   │
   ↓ (通过)
[Step 3: 进入 Worker 执行]
   │
   ↓
[Step 4: 实时监控]                ← Prom + Grafana，看 Stage 进度、内存水位
   │
   ↓
[Step 5: 超时 Killing]            ← query.max-run-time（默认取值随版本变化，
                                    请以所用版本的 Trino Query management 官方文档为准）
                                    内存超 OOM 直接 kill
                                    排队超时 kill
   │
   ↓
[Step 6: 慢查询日志]               ← 收集到慢查询平台，做事后分析
```

**第四层：限流与降级策略。**

- **入口拒绝**：通过 Resource Group 的 `maxQueued` 拒绝超额查询——避免"排队过长"的糟糕用户体验。
- **超时降级**：`query.max-run-time` 超过此时间直接 kill；`query.max-memory` 超过此内存直接 kill。
- **业务降级**：在 BI / 报表层做"超时切友好界面"——查询超过 30s 显示"查询中，请稍候"，避免用户重复点击。
- **走替代引擎——大查询改用 Spark**：在 ETL 层直接用 Spark 跑（Spark 的 AQE 处理大查询更稳健），让 Trino 专注交互式小查询。这是**生产上最常见的"双引擎分工"模式**。

**第五层：真实生产经验。**

- **Meta Presto** —— Meta 用 Resource Group 按业务部门 + 用户类型建树（data scientist / data analyst / ETL），配额精确到 CPU 与并发数，超时交互查询直接 kill。
- **字节 Trino 大查询治理** —— 字节通过 Resource Group + Killing 大查询 + 限并发三项措施，把集群可用率维持在高位（该可用率数字本节无法给出可核验的具体出处，量级按【经验】档处理）。具体做法：① ETL 走独立 Group，配额较小；② Ad-hoc 走独立 Group，配额最大但不允许过夜任务；③ 24h+ 的任务迁移到 Spark/Flink 离线平台。
- **Netflix Trino 限流** —— Netflix 在 Resource Group 上叠加"按表大小过滤"——CBO 在规划阶段估算查询数据量，超过某个体量阈值的大查询走单独的 Resource Group，配额小且排长队（该阈值的具体数值本节无法给出可核验的具体出处，量级按【经验】档处理）。

**3. 常见陷阱**

- **以为"加并发"能解决**。小查询慢**不是并发不足**，而是大查询占用太多槽位。**加 Worker 不如限大查询**。
- **只设置 `hardMemoryLimit`**。没有 `softMemoryLimit`，Group 内的查询会**同时启动**，抢占内存后 OOM；有 softMemoryLimit 才会**先排队再执行**。
- **所有用户共享一个 Resource Group**。这样大查询与小查询相互挤压——必须**按用户类型 / 业务线分组**。
- **只看 Worker 数量不看队列长度**。Resource Group 的 `RunningQueries` 与 `QueuedQueries` 才是治理核心指标——队列越长说明配额不够。

**4. 追问预测**

- **「大查询超时了，但用户想跑，怎么办？」** 答：两个选项——① 拆查询（拆为多段，每段跑中间表）；② 走离线平台（Spark / Hive 跑临时表）。这是**生产上处理大查询的"标准降级方案"**。
- **「Resource Group 配额设错会怎样？」** 答：配额过小 → 用户排队严重；配额过大 → 大查询相互挤压，最终 OOM。**生产上需要根据历史查询分布调配额**——Trino Web UI 的 Resource Group 状态页能直接看到 Running/Queued/Blocked 数量。
- **「如何在 BI 层做超时降级？」** 答：在 BI 工具（如 Superset / Metabase）设置查询超时阈值 + 异步化（点击后转后台任务 + 邮件通知完成），避免前端连接超时导致用户重复点击放大压力。
- **「大查询被 OOM kill，重跑还是继续炸，怎么办？」** 答：① 跑前先 `EXPLAIN` 看 CBO 计划——是否走了 BroadcastExchange 大表？改为 HashPartitionedExchange；② 加 Resource Group 排队，让它走独立 Resource Group；③ 上 Spark 跑（Spark 的 AQE 处理大表更稳健）。

**5. 参考资料**

- Trino 官方文档 Resource Groups 章节——Resource Group 配置的权威定义。
- Trino 官方文档 Query Management 章节——超时、Kill、Killing 策略的权威定义。
- 《Presto: SQL on Everything》（ICDE 2019）——Presto 在 Meta 内部 Resource Group 的设计。
- Starburst Engineering Blog 关于 Resource Group 调优的文章——Trino 400+ Resource Group 的演进与生产经验。
- **字节跳动 Trino 大查询治理** —— 字节是国内 Trino 大查询治理最成熟的企业之一，公开材料含 Resource Group + Killing + 限并发的具体配置。
- **Meta Presto Resource Group 设计** —— Meta 把 Resource Group 按业务部门 + 用户类型精细化分树，是全球最大 Presto 集群的治理范本。
- **Netflix Trino 表大小感知限流** —— Netflix 在 CBO 层加入表大小估算，超大查询自动分流到独立 Group，是限流设计的工业代表。
- **阿里内部查询引擎资源隔离** —— 阿里内部查询引擎 MaxCompute、Holmes 等均有类似的资源隔离设计，对应国内大厂在大查询治理上的工程经验。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量级（节点数、数据量、PB / EB 级等）与性能类数字（延迟、可用率、加速倍数等；以上参考资料各条中的性能类数字已在相应条目内逐条标注档位），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。精确链接请按条目名称自行检索核验。

---

#### §13.1.5 同样跑 SQL on Hadoop，Trino / Presto / Impala / Spark SQL / Drill 各自的定位与性能差异是什么？请从执行模型、内存模型、Connector 生态、性能拐点四个维度做对比，并说明在什么场景下应该选谁。

**1. 考察点**

- 是否理解**查询引擎与计算引擎的本质差异**——Trino/Presto 是查询引擎（无本地存储 + 联邦），Spark 是计算引擎（Micro-Batch + 多范式），Impala 是 CDH 时代的 SQL-on-Hadoop 标杆，Drill 是 Schema-free 的无模式查询引擎。
- 能否说清**性能差异的根本原因**——内存流水线 vs 批处理、向量化 vs Row-at-a-Time、Coordinator/Worker vs Driver/Executor。
- 是否知道**Trino 取代 PrestoDB 的背景——社区分裂**——Trino（前身 PrestoSQL）由 Presto 原作者 Martin Traverso 等人从原 Presto 项目分叉而来，PrestoDB 是留在原项目命名下的另一支，**Trino 主干比 PrestoDB 更活跃**。
- 加分项：能给出具体的性能数据（典型查询的秒级 vs 分钟级差异），并能用真实案例（Meta / Netflix / Uber / LinkedIn / Cloudera）支撑选型决策。

**2. 参考答案框架**

**第一层：执行模型对比。**

| 引擎 | 执行模型 | 调度单位 | 启动延迟 |
| --- | --- | --- | --- |
| **Trino / Presto** | MPP 内存流水线 | Stage / Task / Driver（Pipeline） | 毫秒级（内存 + JIT） |
| **Impala** | MPP + LLVM 代码生成 | Fragment / Instance | 毫秒级（LLVM） |
| **Spark SQL** | Micro-Batch + DAG | Job / Stage / Task | 秒级（DAG 调度） |
| **Drill** | Schema-free MPP | Fragment | 毫秒级（无模式解析） |

**第二层：内存模型与向量化。**

- **Trino / Presto**：Page（1024 行紧凑列存块）+ 向量化算子 + JIT。**Page 内 SQL 全部算完才向后续 Stage 推数据**——适合交互式低延迟。
- **Impala**：Tuple（行式）+ LLVM 代码生成（运行时编译为 Native Code）。**单行处理速度极快**——但跨列并行差。
- **Spark SQL**：Tungsten 二进制记录 + WholeStage Code Generation。**每行算完即往下推**——适合批处理流水线。
- **Drill**：Schema-free 列存 + 向量化（但无 JIT）。**灵活但极致性能不如 Trino**。

**第三层：Connector 生态对比。**

| 引擎 | Connector 数量 | 代表 Connector |
| --- | --- | --- |
| **Trino** | 最多（具体计数随版本增长，以官方文档为准） | Hive / Iceberg / MySQL / Kafka / ES / Pinot / Druid / Redis / Cassandra |
| **PrestoDB** | 数量众多（具体计数随版本增长，以官方文档为准） | Hive / MySQL / Kafka / ES（社区版偏少） |
| **Impala** | 数量少（具体计数随版本增长，以官方文档为准） | Hive / Kudu / HDFS（局限于 CDH 生态） |
| **Spark SQL** | 内置 JDBC | 通过 Spark DataSource API（需要写代码） |
| **Drill** | 数量少（具体计数随版本增长，以官方文档为准） | MongoDB / Cassandra / S3 / HDFS（Schema-free 特色） |

**关键洞察**：Trino 的 Connector 生态是**它最大的护城河**——联邦查询场景下，**Trino 是事实标准**。

**第四层：性能拐点对比（典型查询场景）。**

| 查询场景 | Trino | Impala | Spark SQL | Drill |
| --- | --- | --- | --- | --- |
| **跨源 Join（亿级 × 千万级）** | 5-30s | 不支持 | 30-120s | 不支持 |
| **湖仓即席（Iceberg + 日期范围）** | 3-10s | 10-30s | 30-60s | 10-30s |
| **大宽表聚合（百亿行）** | 1-5 min | 30-60s（LLVM） | 1-5 min（AQE） | 2-10 min |
| **批处理（数 TB）** | 5-30 min | 10-30 min | 5-30 min（AQE） | 10-30 min |
| **Schema-free 半结构化** | 中（JSON / Map） | 弱 | 弱 | 强 |
| **小查询（< 1s）** | < 1s | < 1s | 5-30s | 1-5s |

> 表中是典型场景下的量级估计，用来说明四种引擎的相对差异；具体耗时会随数据规模、集群配置与查询形态大幅变化，本节无法给出可溯源的统一数字，此处按【经验】档处理。

**第五层：选型决策树。**

```
场景？
├── 跨源联邦查询（Hive + MySQL + Kafka）
│   └── Trino（事实标准）
├── 湖仓即席查询（Iceberg / Hudi / Delta）
│   └── Trino / Spark SQL（Trino 延迟更低，Spark SQL 兼容更好）
├── 传统 CDH 生态（Hive + HDFS）
│   └── Impala（CDH 一体化运维）
├── 多范式计算（流 + 批 + ML）
│   └── Spark SQL（统一引擎）
├── Schema-free 半结构化数据（JSON / MongoDB）
│   └── Drill（无模式查询）
└── 大宽表聚合（PB 级）
    └── StarRocks / Doris / ClickHouse（专用 OLAP，不是查询引擎）
```

**第六层：行业实践。**

- **Meta Presto** —— Meta 是 Presto 的诞生地，主用 Presto 替代 Hive + Spark 做交互式查询，数据规模在 PB 级（该规模量级本节无法给出可核验的具体出处，按【经验】档处理），并跨源接 MySQL 维表。
- **Uber Presto + AresDB** —— Uber 用 Presto 查 Hive + AresDB（自研时序 OLAP），统一跨源入口。
- **Netflix Trino + Iceberg** —— Netflix 用 Trino 替代 Hive + Spark 即席查询，Iceberg 表规模在 EB 级（该规模量级本节无法给出可核验的具体出处，按【经验】档处理），Trino 是事实标准。
- **LinkedIn Presto + Pinot** —— LinkedIn 用 Presto 既查湖（Hive）又查 OLAP（Pinot），统一跨源查询入口。
- **Cloudera Impala** —— Cloudera 推 Impala 作为 CDH 生态的 SQL-on-Hadoop 标杆，Hue + Impala 是 CDH 的标配。
- **Apache Drill** —— Drill 由 MapR（被 HPE 收购）发起，主打 Schema-free 半结构化查询，是 NoSQL 数据源 SQL 化的代表。

**3. 常见陷阱**

- **把 Trino 当成 OLAP 引擎**。Trino 是**查询引擎**，不是 OLAP——大宽表聚合（PB 级）应用专用 OLAP（StarRocks / Doris / ClickHouse）。
- **忽视 Impala 的生态绑定**。Impala 离开 CDH 几乎不可用——独立部署 Impala 复杂度远高于 Trino。
- **以为 Spark SQL 能取代 Trino**。Spark SQL 的**延迟太高（秒级）**——交互式场景体验差。生产上是"Spark 跑 ETL，Trino 跑交互式"的双引擎分工。
- **忽视 Drill 的小众**。Drill 社区活跃度较低，文档不全，Schema-free 的优势在 Trino 的 JSON / Map 支持下被大幅削弱。**生产上很少用 Drill**。

**4. 追问预测**

- **「同样的 SQL，Trino 比 Spark SQL 快多少？」** 答：交互式小查询（< 1s）Trino 明显快于 Spark SQL（常见量级是数倍，随查询形态、并发与集群配置而异，本节无法给出可溯源的统一倍数，此处按【经验】档处理）——主要差距在 DAG 调度延迟（Trino 毫秒级 vs Spark 秒级）。但大查询（数十分钟）Spark SQL 反而更稳（AQE + 倾斜治理更成熟）。
- **「Trino 和 StarRocks 的关系？」** 答：Trino 是**查询引擎（联邦）**，StarRocks 是**OLAP 引擎（单源高性能）**——定位互补，不是替代关系。生产上是 Trino（跨源入口）+ StarRocks（高频 OLAP）的组合。
- **「Impala 是不是过时了？」** 答：在 CDH 生态内 Impala 仍然活跃（Cloudera 持续维护），但**新项目几乎不选 Impala**——Trino + Iceberg 已经替代了 Impala 的多数场景。
- **「Drill 还有未来吗？」** 答：Drill 社区活跃度较低，**生产上很少见**——但 Schema-free + 半结构化查询的场景仍是 Drill 的优势区间（如 MongoDB 大规模 JSON 查询）。

**5. 参考资料**

- 《Presto: SQL on Everything》（ICDE 2019）——Presto 与其他 SQL-on-Hadoop 引擎的对比。
- Mostafa Mokhtar《Presto + Hive + Spark: SQL-on-Hadoop 的现状和未来》（公开演讲材料；该演讲的年份与发布渠道本节无法核实，引用前请自行查证）。
- Reynold Xin 等《Apache Spark: The First Decade》（ACM SIGMOD 2019）——Spark SQL 的设计哲学与性能特征（该题名、作者与会议信息本节无法核实，引用前请自行查证）。
- Marcel Kornacker 等《Impala: A Modern, Open-Source SQL Engine for Hadoop》（CIDR 2015）——Impala 的原始论文，LLVM 代码生成的奠基。
- **Meta Presto 性能基准** —— Meta 定期发布 Presto 性能基准对比，涵盖 Presto vs Hive vs Spark 的查询延迟与吞吐。
- **Netflix Trino 替代 Hive + Spark 即席查询** —— Netflix 公开材料中 Trino 在即席查询上明显快于 Hive + Spark 的对照数据（具体倍数本节无法给出可核验的具体出处，量级按【经验】档处理）。
- **Cloudera Impala 性能白皮书** —— Cloudera 发布的 Impala vs Hive vs Spark 性能对比。
- **阿里内部查询引擎 Holmes / MaxCompute SQL** —— 阿里内部的查询引擎在性能与生态上的设计思路，对应国内大厂的查询引擎选型参考。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量级（节点数、数据量、PB / EB 级等）与性能类数字（延迟、可用率、加速倍数等；以上参考资料各条中的性能类数字已在相应条目内逐条标注档位），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。精确链接请按条目名称自行检索核验。

---

#### §13.1.6 既然 Trino / Presto 已经够好，为什么字节、阿里、Uber 等头部企业还要自研查询引擎（或深度改造 Trino）？请说明自研的动机、常见改造方向，以及自研与开源的边界。

**1. 考察点**

- 是否理解**自研不等于"从零写"**——头部企业的"自研"通常是：① 深度定制（fork 后改核心模块）；② 集成自研组件（替换 Connector 或优化器）；③ 解决特定场景（流式查询、AI 原生查询）。
- 能否说清**自研的典型动机**：超大规模（千节点以上）的特定场景需求、与内部系统的深度集成、性能极致的改造、商业引擎的 License 限制。
- 是否知道自研查询引擎的**隐性代价**——团队规模、版本维护、社区分裂。这是面试官下钻"自研的代价是什么"时的核心答案。
- 加分项：能对比**字节 Bytedance Query Engine / 阿里 MaxCompute SQL / Uber AresDB / Meta MySQL Presto 桥接层**等具体案例，说明每个改造的方向与收益。

**2. 参考答案框架**

**第一层：自研的四大动机。**

| 动机 | 典型场景 | 代表案例 |
| --- | --- | --- |
| **超大规模特定场景** | 单集群 1000+ Worker、超大宽表（PB 级）、超长查询（该规模量级本节无法给出可核验的具体出处，按【经验】档处理） | Meta Presto 内部深度定制 |
| **内部系统深度集成** | 内部 KV / 图存储 / 时序 DB 需要作为 Connector | Uber AresDB / 字节 Kafka 流式 |
| **性能极致优化** | LLVM 代码生成、SIMD 向量化、GPU 加速 | Apache Impala / 字节 Bytedance Query Engine |
| **License 与商业策略** | 避免 Starburst 商业 License、独立可控 | 字节内部版本 / 阿里内部版本 |

**第二层：常见的改造方向。**

按代价递增（也是最常见的改造路径）：

1. **替换 Connector**：把内部存储（KV / 图 / 时序）实现为 Trino Connector，接入联邦查询。**代价小、收益大**——这是头部企业最常见的起点。
2. **优化 CBO 与统计信息**：替换默认统计信息收集、加更复杂的代价模型（机器学习预测）、加自适应执行（AQE）。
3. **改造内存模型**：替换 Memory Pool 设计、加新的 Spillable 算子、加 NUMA 感知。
4. **改造 Stage 调度**：加优先级、加队列感知、加机器学习预测的并发度调节。
5. **改造 Stage 执行**：加向量化（Velox / DataFusion 复用）、加 GPU 加速、加 SIMD。
6. **改造 Driver 协议**：加 RPC 协议优化、加序列化优化（如 Arrow Flight）、加网络压缩。
7. **重写核心模块**：从 CBO 到 Executor 全部重写——这是最深度的自研，**代价最高、收益最大但风险也最大**。

**第三层：真实案例。**

- **Meta Presto 内部深度定制** —— Meta 在 Presto 上做了大量内部改造，包括：① 替换 Stage 调度为自适应调度；② 加内部统计信息收集器；③ 加内部存储 Connector；④ 加资源隔离（基于 Mesos）。Meta 公开过多次 Presto 演进分享。
- **Uber AresDB + Presto 联邦** —— Uber 自研 AresDB（时序 OLAP）作为 Presto 的 Connector，统一跨源入口；同时 Presto 内部做了 ETL 优化（把 Presto 当 ETL 引擎跑批）。
- **字节跳动 Bytedance Query Engine** —— 字节自研查询引擎，在 Trino 基础上做了：① 深度定制 Connector（Kafka 流式、MySQL 维表）；② 内部资源调度（与内部 K8s 平台集成）；③ 自适应优化（基于运行时统计信息）。**这是国内大厂最深的 Trino 改造案例之一**。
- **阿里内部查询引擎 MaxCompute SQL / Holmes** —— 阿里内部查询引擎在 MaxCompute 之上做了深度定制，包括：① 自研 CBO（基于代价模型 + 机器学习）；② 自研 Connector（接入内部存储 + 日志 + 搜索）；③ 自研资源调度（与 Pangu 资源调度集成）。**这是国内最完整的"自研查询引擎"案例**。
- **Apache Velox（Meta 开源）** —— Meta 把内部的 C++ 向量化执行库 Velox 开源，作为下一代 Presto/Trino 的执行引擎。Velox 是**"自研执行层 + 开源规划层"的典型代表**。

**第四层：自研与开源的边界。**

生产上的取舍：

| 维度 | 完全开源 Trino | Fork 后定制 | 完全自研 |
| --- | --- | --- | --- |
| 开发成本 | 低 | 中 | 高 |
| 运维成本 | 低 | 中 | 高 |
| 性能极限 | 中 | 中高 | 极高 |
| 社区兼容性 | 高 | 中（升级难） | 无 |
| 团队规模 | 1-3 人 | 5-10 人 | 10+ 人 |
| 适用规模 | < 100 Worker | 100-500 Worker | 500+ Worker |

**经验法则**：① **Worker 数 < 100**：用开源 Trino，不需自研；② **100-500 Worker**：可考虑 fork 定制；③ **500+ Worker**：必须有内部定制（哪怕只是 Connector + 调度优化）。

**第五层：自研的代价——必须说清的隐性成本。**

1. **版本维护**：fork 后需要持续 rebase 上游社区版本，否则与生态脱节。
2. **人才招聘**：能维护 C++ / Rust / 向量化执行库的工程师比 Java 工程师更稀缺。
3. **社区分裂**：fork 后与上游功能差异越来越大，最终分裂为独立项目——PrestoDB / Trino 就是分叉的典型例子。
4. **隐性 bug**：自研模块的回归测试覆盖通常不如社区，需要长期投入 QA。

**3. 常见陷阱**

- **以为"自研 = 从零写"**。自研通常是**深度改造**，而非全重写。**完全重写查询引擎**是少数头部公司的选择（如 Apache Doris）。
- **忽视 fork 的版本维护代价**。fork 后必须持续 rebase 上游——否则 1-2 年后与社区版本差异巨大，无法升级。
- **以"性能极致"为唯一动机**。性能极致的投入产出比在大多数场景下**远不如 Connector 优化 + 资源隔离**。
- **不评估团队规模**。10+ 人的自研团队是少数——大多数企业**应该用开源 Trino + 定制 Connector**，而非 fork。

**4. 追问预测**

- **「自研查询引擎的 ROI 怎么算？」** 答：核心是**节省的成本 vs 投入的成本**。节省的成本包括：① License 费用（Starburst 商业版年费在数十万到数百万美元量级；该价格量级随版本、集群规模与商务条款而异，本节无法给出可核验的具体出处，此处按【经验】档处理）；② 性能提升带来的硬件节省（延迟改善能否换算成节点数下降，取决于集群瓶颈在延迟还是吞吐，本节无法给出可溯源的统一换算比，此处按【经验】档处理）。投入的成本包括：① 团队工资（10+ 人 × 数年）；② 运维成本（持续 rebase + 排障）。**通常 500+ Worker 规模才值得自研**（该阈值与本节前面自研边界一节的「经验法则」同源，本节无法给出可核验的具体出处，按【经验】档处理）。
- **「fork Trino 后怎么 rebase 上游？」** 答：用 Git 的 rebase/merge 策略，长期保持与上游 trunk 同步；**关键补丁独立提交到上游**（避免重复维护）。Meta / Uber 等大厂的 fork 通常有专门的"代码同步团队"。
- **「Apache Velox / DataFusion 是自研的替代品吗？」** 答：是。Velox 是 Meta 开源的**向量化执行库**，可作为 Presto/Trino 的执行层；DataFusion 是 Rust 的**查询引擎框架**，可内嵌。**两者都是"用开源替代自研"的成熟路径**——比 fork Trino 更轻量。
- **「未来查询引擎会怎么演进？」** 答：① 向量化执行（Velox / DataFusion）；② AI 原生（CBO 用 ML 预测）；③ 嵌入式（Notebook + 边缘计算）；④ 联邦向量查询（结构化 + 向量统一）。**Trino 社区已经吸收了部分趋势（如 Iceberg V3、向量索引）**，但深度定制仍是大厂的选择。

**5. 参考资料**

- 《Presto: SQL on Everything》（ICDE 2019）——Presto 的可扩展性与社区生态。
- Starburst Engineering Blog 关于 Trino 商业化的系列文章——商业版 vs 社区版的边界与 License。
- Apache Velox（Meta 开源）的官方仓库与文档——Velox 作为下一代查询引擎执行层（C++ 向量化执行库）的设计（原稿此处记为「Reynold Xin 等《Velox: A Unified Velox Execution Library》」；本文件其它条目与本仓其它章节均把 Velox 记为 Meta 发起的开源项目而非某位作者的个人论文，该题名与作者归属本节无法核实，引用前请以 Velox 官方仓库与文档为准）。
- Wes McKinney《DataFusion: A Rust Native Query Engine》（公开演讲材料；该演讲的年份与发布渠道本节无法核实，引用前请自行查证）——DataFusion 的设计哲学。
- **Meta Presto 深度定制的演进** —— Meta 是 Presto 的诞生地，Presto 在 Meta 内部经过深度定制，覆盖 1000+ Worker、数万日活用户，是 fork 定制的全球最大案例。
- **Uber Presto + AresDB 联邦查询** —— Uber 通过自研 AresDB + 内部 Presto 定制，实现跨源（湖 + 时序）联邦查询。
- **字节跳动 Bytedance Query Engine** —— 字节是国内最深的 Trino 改造者之一，公开材料含 Kafka 流式 Connector + 内部资源调度集成。
- **阿里 MaxCompute SQL / Holmes 自研查询引擎** —— 阿里内部的查询引擎在 MaxCompute 之上做了深度定制，覆盖阿里集团 PB 级数据查询。
- **Apache Velox 开源项目** —— Meta 把内部 C++ 向量化执行库 Velox 开源，作为下一代 Presto/Trino 的执行引擎，是"自研执行层 + 开源规划层"的代表。
- **米哈游游戏数据查询引擎选型** —— 米哈游在游戏数据查询上选择 Trino + 自研 Connector 接入内部时序存储，是游戏行业查询引擎落地的代表。
- **招行金融数据查询引擎** —— 招行在金融数据查询上采用 Trino + 自研 Connector 接入内部系统，是金融行业查询引擎的代表。
- **京东 / 美团数据查询引擎实践** —— 京东、美团等头部电商/本地生活企业在内部数据查询上采用 Trino + 自研 Connector，是国内电商与本地生活行业的查询引擎落地代表。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量级（节点数、数据量、PB / EB 级等）与性能类数字（延迟、可用率、加速倍数等；以上参考资料各条中的性能类数字已在相应条目内逐条标注档位），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。精确链接请按条目名称自行检索核验。

---

### 8.3 本章小结

本节收录 6 道题，覆盖原 PDF §13.1「查询引擎（Trino / Presto / Impala / Spark SQL / Drill）」一个子章节，横切主题为**跨源联邦查询系统的工程取舍**。六道题构成一条完整的下钻链路：

- **架构层**（§13.1.1）：Coordinator/Worker 的 MPP 模型与 SQL 旅程。
- **运行时层**（§13.1.2）：内存池 + Memory Revoke + Spill 的内存治理。
- **扩展层**（§13.1.3）：Connector SPI + 谓词下推 + 列剪裁的可扩展性机制。
- **治理层**（§13.1.4）：Resource Group + 限流 + Killing 的大查询治理。
- **选型层**（§13.1.5）：Trino / Impala / Spark SQL / Drill 的对比与决策树。
- **演进层**（§13.1.6）：自研查询引擎的动机、改造方向与边界。

参考答题的通用心法：**先说清定位（查询引擎 vs OLAP vs 计算引擎），再说清架构（Coordinator/Worker / Driver / Stage），最后说清取舍（联邦 vs 单源 / 内存 vs 磁盘 / 开源 vs 自研）**。这一主题下的所有问题，面试官真正想听的都是"你为什么这么选"，而不是"有哪几种做法"。

### 8.4 返回

- 返回 [03-data-stack 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
