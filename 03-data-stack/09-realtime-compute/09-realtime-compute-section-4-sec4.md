> 本文件是 **09-realtime-compute.md** 的子文件（§4. 工程实现）。本节讲怎么把 [§ 3](09-realtime-compute-section-3-sec3.md) 里的做法装进一个真实组织：顺序、判据、产物与存量迁移。完整章节请回到 [index](09-realtime-compute.md)。

## 4. 工程实现

[§ 3](09-realtime-compute-section-3-sec3.md) 已把七个模式各自的约束、结构、代价与失效点讲完，[§ 7](09-realtime-compute-section-7-sec7.md) 给了引擎之间的机制差异与选型决策树，本节一律不重复，只回答下一个问题：**模式与引擎都定了之后，第一条链路怎么从零跑到能上生产、已有链路怎么换过来**。组织方式是按落地的六步顺序（4.1）、五条关键技术点及各自的失效条件（4.2）、平台与工具选型判据（4.3）、存量链路的迁移（4.4）、可直接套用的配置与代码（4.5）、成本 / 容灾 / 演进路线（4.6–4.8）、自检清单（4.9）与小结（4.10）。

**本文件面向两种读者**：从零建链路的人按 4.1 的 Step 1→6 顺序走，每一步都有产物与判据；已经有在跑的实时链路、要把它换成 CDC + 流批一体的人先看 4.4，再回头补 4.1 的 Step 3 与 Step 5——存量链路上这两步通常缺失，而它们恰好决定了迁移能不能安全收尾。术语沿用主文件 §2 与 §3 的口径：**状态后端、检查点、屏障对齐、水位线、反压、端到端语义由最弱一环决定**。

文中所有参数值（检查点间隔、水位线容忍度、实例规格）都标【经验】，它们随状态量与可接受的重放量变化，照抄数字比照抄结构危险得多。产品版本一律给参考值并注明以官方发布记录当前版本为准。

### 4.1 落地步骤

**Step 1：选型引擎（1–2 周【经验】，随是否已有集群与团队技能变）**

- 复杂流处理（CEP、多流 Join、长窗口去重）用 Flink；简单流处理（单源、无跨流 Join、逻辑轻）用 Kafka Streams；微批用 Spark Structured Streaming。
- 把两个数字写进选型说明：**需要回算的最远时间点**，以及**日志 / 湖表快照能保留多久**（§ 3 的共享判据）。

- **产物**：一页选型说明（引擎 + 语义下限 + 回算能力 + 不选另外两个的理由）。
- **判据**：能不能回答「这条链路出错后，历史能不能重算」。答不了说明只比较了引擎能力、没有量保留期；这一条答不上来时选任何引擎都会在第一次口径修正时暴露。
- **为什么必须这一步 / 为什么在这个位置**：引擎决定了状态后端与存储的选择空间，三者是一组，换引擎通常要连它们一起换；其中状态后端与存储格式的更换要靠 Savepoint 或双写过渡（§ 3.6 的补充判据），而一旦换引擎牵动了「历史可重建能力」（Lambda ⇄ Kappa ⇄ 流批一体），就落进 § 3.6 标为「迁移成本最高」的那一类——它要动存储与重算路径。换序（先搭集群再想引擎）还会让集群规格按错误的引擎假设定死。

**Step 2：集群规划（2–4 周【经验】，随集群形态与网络/存储方案变）**

- 定 JobManager / TaskManager 的角色与数量、内存与 CPU 配置，并做 **State Backend 选型**（内存 / 文件系统 / RocksDB）。
- 估状态量：key 空间上界 × 单 key 状态大小，再加本地盘容量与网络带宽两张余量表。

- **产物**：集群规格表 + 状态后端选型结论 + 一份状态量估算。
- **判据**：文档里能否找到「key 空间上界是多少、按什么假设估的、超了会怎样」。写不出上界的链路，在生产里的暴露方式是流量翻倍当天 OOM（§ 3.5 的第一条反模式）。
- **为什么必须这一步 / 为什么在这个位置**：状态后端一旦上线，更换要走 Savepoint 迁移与双跑过渡（§ 3.6）；必须在第一次上线前定，而不是等状态涨到 GB 级再换。

**Step 3：Checkpoint 配置（1–2 周【经验】，随作业数量与语义要求变）**

- 定检查点间隔（1–5 分钟是常见区间【经验】）、状态后端（大数据量用 RocksDB）、持久化位置（HDFS / S3 一类远端存储）。
- 同时定语义：端到端 Exactly-once 还是至少一次；后者要求 Sink 侧幂等（§ 3.1 的第三条约束）。

- **产物**：`flink-conf.yaml` / 作业侧的检查点配置 + 一份「间隔 / 实测耗时 / 重放窗口」三列表。
- **判据**：实测一次检查点耗时，看它相对间隔留了多少余量；把检查点成功率接进监控并在发布门禁里设阈值。余量写不出来的配置，等于把语义赌博当成默认值。
- **为什么必须这一步 / 为什么在这个位置**：检查点间隔同时决定「故障后要重放多少数据」与「正常时的资源开销」，这两个量只有在 Step 2 的状态量估算之后才有依据；反过来先配参数再估状态，参数必然偏小。

**Step 4：Flink CDC 接入（2–4 周【经验】，随源表数量与 DDL 频率变）**

- 接 MySQL / PostgreSQL binlog（或等价的日志复制通道）；显式定义 **Schema Evolution** 策略：加列可自动、改类型与删列必须人工确认。
- 定**异常处理**：无主键表、动态 SQL、解析不了的作业单独标记成已知盲区，而不是让它们成为看不见的依赖。

- **产物**：源表清单（含是否有主键、日志保留期）+ schema 演进规则 + 盲区清单。
- **判据**：源表的主键覆盖率是否列全；日志保留期是否覆盖最长断点恢复窗口；手动改一次源表结构，看链路是自动跟上还是需要人工介入——两者都可以接受，不清楚才不可以。
- **为什么必须这一步 / 为什么在这个位置**：CDC 把依赖从应用层下沉到数据库层（§ 3.2.4），权限、日志保留、主键都是**外部依赖**，要单独排期去要；把它排在 Step 3 之前会让检查点配好了却没有数据可跑。

**Step 5：监控告警（1–2 周【经验】，随监控项数量与是否已有可观测栈变）**

- 接 Flink Web UI + Prometheus + Grafana；监控四类信号：**检查点失败、作业延迟、状态大小、反压**。
- 把反压持续时间与滞后指标接到告警与扩缩决策上，而不是只监控「作业是否存活」。

- **产物**：一块实时作业看板（含每个算子的背压与检查点耗时）+ 一份告警阈值表。
- **判据**：对着看板能不能直接说出「是哪个算子慢」，而不只是「整体慢」。说不出，说明只采了端到端指标，背压没有按算子下钻。
- **为什么必须这一步 / 为什么在这个位置**：反压是下游变慢向上游传导的结果，不监控就只能看到整体延迟变差而看不到源头；它必须在上线**之前**接好，上线后再补，第一次事故将完全靠人工猜。

**Step 6：AI 集成（按需，通常 2–6 周【经验】，随是否已有特征平台变）**

- 实时特征 + LLM：特征侧沿用 Step 4 的 CDC 与 § 3.2.5 的一份定义物化两份；LLM 侧用异步算子 + 并发上限 + 规则兜底。
- 流式 Agent：把「触发、组装上下文、校验输出」留在流作业内，把不确定性最大的生成步骤隔离在带超时与降级的算子里。

- **产物**：实时特征在线存储与离线表的对齐说明 + LLM 调用算子的超时 / 并发上限 / 降级路径配置 + 决策日志（prompt 版本、模型版本、原始输出）。
- **判据**：链路里是否存在一条独立的「降级到规则」路径，且演练过切换；能否按模型版本回溯历史决策。两者缺一，说明 AI 集成的可用性直接绑在了第三方配额上。
- **为什么必须这一步 / 为什么在这个位置**：它给链路引入一个外部的、有配额与尾延迟的依赖（§ 3.2.7）。放在最后，是为了让实时链路本身的故障与模型侧的故障在时间上分开，排查时不至于两类问题混在一起。

最常被跳过的是 **Step 2 的状态量估算**与 **Step 5 的背压接入**——前者不产出可展示的东西，后者被当成上线后的运维事项。跳过后第一个出问题的时点高度一致：**第一次流量脉冲或大促当天**。表现有两种：状态吃穿内存导致作业 OOM 重启（Step 2 缺失），或背压逐级堆积、各算子 CPU 都不高而端到端延迟阶梯恶化（Step 5 缺失）。两种都发生在监控已通过、压测也跑过之后，因为压测通常用的是稳态水位而不是峰值脉冲。

### 4.2 关键技术点

**1. Flink Checkpoint 配置**

- **做法**：显式开启检查点并配对语义，例如：

  ```java
  env.enableCheckpointing(60000);                       // 间隔，【经验】1-5 分钟
  env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
  env.getCheckpointConfig().setMinPauseBetweenCheckpoints(500);
  env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);
  env.getCheckpointConfig().setTolerableCheckpointFailureNumber(3);
  env.getCheckpointConfig().setExternalizedCheckpointRetention(
      ExternalizedCheckpointRetention.RETAIN_ON_CANCELLATION);
  env.setStateBackend(new RocksDBStateBackend("s3://flink-checkpoints"));
  ```

- **机制**：因为屏障对齐后状态被异步持久化到远端，故障恢复只需回到最近一次成功检查点，所以「检查点间隔」实际就是「故障后要重放多少数据」的上界。
- **失效条件**：**当状态量增长到检查点耗时逼近或超过间隔时，这条会持续失败或引发背压堆积**；症状是检查点成功率下降 + 作业延迟阶梯式上升，而各个算子都不报错。可观测信号：检查点耗时的分位数、失败计数、外部化检查点目录的体积增长速率。
- **档位**：参数值为【经验】，随状态量与可接受重放量变；语义与配置项的可用性请以 Flink 官方文档当前版本为准。

**2. Flink CDC 实时入湖**

- **做法**：CDC source 直接读源库日志，作业内完成「全量快照 + 增量追平」；schema 演进按「加列自动、改类型与删列人工确认」分流。

  ```sql
  CREATE TABLE orders_cdc (
    order_id BIGINT, status STRING, amount DECIMAL(18,2),
    PRIMARY KEY (order_id) NOT ENFORCED
  ) WITH ('connector' = 'mysql-cdc',
          'hostname' = 'mysql-primary',
          'database-name' = 'orders',
          'table-name' = 'order_info',
          'scan.incremental.snapshot.enabled' = 'true');
  ```
- **机制**：变更的顺序与完整性由源库日志自身保证，作业的恢复点因此就是一个日志位点：故障恢复的代价由「要回放多少日志」决定，而不是由「重新扫一遍全表」决定。这条推论在工程上的直接后果是——**日志保留期是硬外部依赖**，必须在接通链路之前就要到手，而不是等恢复窗口被写穿、作业重启后追不平才发现。
- **失效条件**：**当源库存在大量无主键表或频繁 DDL 时，这条会变得不稳定**；症状是作业重启后长时间停在快照阶段（长尾追平），或湖表结构与源库不一致导致下游查询报错。可观测信号：快照阶段持续时长、schema 变更事件数、源库日志保留期是否被写满。
- **档位**：【经验】

**3. Flink Watermark + Event Time**

- **做法**：有界乱序水位线 + 事件时间戳抽取；窗口大小与水位线**一起**定；迟到数据用允许迟到 + 侧输出处理，而不是默认丢弃。

  ```java
  DataStream<Order> orders = env.addSource(kafkaSource)
      .assignTimestampsAndWatermarks(
          WatermarkStrategy.<Order>forBoundedOutOfOrderness(Duration.ofSeconds(5))  // 【经验】
              .withTimestampAssigner((order, ts) -> order.getOrderTime().toEpochMilli()))
      .keyBy(Order::getUserId)
      .window(TumblingEventTimeWindows.of(Time.minutes(5)))
      .aggregate(new OrderAggregate());
  ```
- **机制**：因为窗口的关闭由水位线而不是由墙上时钟决定，同一段历史被重放时会得到与首次执行一致的结果——这是「口径修正后能重算历史」在算子层面的前提。
- **失效条件**：**当实际乱序程度超过水位线容忍度时（移动网络上报、跨区采集是典型场景），这条会大量丢弃迟到数据**；症状是窗口结果系统性偏小且周期性缺失，而算子没有任何异常。可观测信号：侧输出流的记录数、窗口水位线与处理时间的持续差值。
- **档位**：容忍度取值为【经验】，须由实测乱序分布决定。

**4. 实时特征工程**

- **做法**：一份特征定义物化两份——在线 KV（毫秒读）与离线湖表（含事件时间）；离线回填按事件时间对齐；在线 TTL 与离线训练时间窗一起评审。

  ```java
  DataStream<UserFeature> features = orders
      .keyBy(Order::getUserId)
      .window(TumblingEventTimeWindows.of(Time.minutes(5)))
      .aggregate(new UserFeatureAggregate());
  features.addSink(new FeatureStoreSink());   // Feast / Tecton / 自建特征平台
  ```
- **机制**：因为训练与推理读的是同一份定义的两次物化，「离线指标好、在线效果差」被压缩成「物化时间点不同」这一项，而它可以被时点对齐与新鲜度指标直接量化。
- **失效条件**：**当特征需要长窗口（近 30 天累计一类）时，在线侧只能靠作业状态维护，而状态随 key 数线性增长**；症状是检查点体积膨胀、恢复时间变长，而离线侧指标一切正常，于是它最先表现为「发布门禁里的检查点余量越用越薄」，而不是某个指标报错。可观测信号：状态大小与 key 基数的增长曲线、单次检查点耗时、故障恢复时长——这三条曲线一起抬头时选择只剩「用流状态扛住长窗口」或「离线算完回灌、接受新鲜度下降」，而这个选择必须在曲线还平的时候就做完，因为到了这一步再改就要动在线存储的 TTL 与离线训练窗（§ 3.2.5 已给出两者的对齐要求）。
- **档位**：【经验】

**5. 反压处理**

- **做法**：依赖引擎的信用机制自动反压；把背压指标与滞后指标接到告警和扩缩决策；只在确有必要时调缓冲区超时。

  ```java
  env.getConfig().setBufferTimeout(10);   // 缓冲超时，值需实测
  // 反压观测：Flink Web UI → Backpressure 页；指标可经 REST / Prometheus 拉取
  ```
- **机制**：因为反压是下游处理速度不足沿链路向上游传导的信号，所以热点的位置可以从背压指标上读出来，而不必靠端到端延迟反推。
- **失效条件**：**当上游流量超过下游处理能力的持续时间超过调度的响应时间时（零点脉冲、大促开抢是典型场景），这条会从「自动限速」变成「队列雪崩」**；症状是各算子 CPU 都不高、端到端延迟阶梯式恶化。可观测信号：背压持续时间占比、输入队列长度、滞后（lag）曲线的斜率。
- **档位**：【经验】

### 4.3 工具链与平台

| 类别 | 候选 | 选型判据（在什么约束下选哪个） | 不选它的代价 |
| --- | --- | --- | --- |
| 流处理引擎 | Apache Flink（1.19+；1.19 系列发布于 2024 年【公开】，见 Apache Flink 官方发布记录）、Spark Structured Streaming（3.5+）、Kafka Streams（3.7+）、Apache Beam（2.5x）、Materialize、Decodable（流式 SaaS） | § 7.1 已给机制层判据；本节只补运维维度——需要独立集群 / 多源 Join / CEP 用 Flink；单源轻逻辑且已有 Kafka 用 Kafka Streams；已有 Spark 批体系用 Structured Streaming；跨引擎统一 API 用 Beam | 用 Kafka Streams 做跨源聚合时状态与运维能力不足；用微批引擎做 CEP 时窗口边界与语义不匹配，延迟目标达不到 |
| CDC 采集 | Flink CDC（MySQL / PostgreSQL / MongoDB）、Debezium（Kafka Connect）、Canal（MySQL binlog） | 已在 Flink 链路里 → Flink CDC（少一个组件、作业内完成快照与追平）；已有 Kafka Connect 生态 → Debezium；仅 MySQL 且团队熟悉阿里系 → Canal | 为了少一个组件而自建采集逻辑，会把 schema 演进与断点恢复两件事都变成自研负担 |
| 资源调度 | YARN（存量 Hadoop 集群）、Kubernetes（Flink Operator，云原生弹性）、Standalone（开发） | 已有 K8s 且需要弹性扩缩 → Flink Operator；存量 Hadoop 集群 → YARN；本地与联调 → Standalone | 在规模小、无平台团队时上 K8s Operator，把运维复杂度提前引入；反之在需要弹性时留在 Standalone，峰值只能人工扩 |
| 托管平台 | 阿里云实时计算 Flink 版（VVR）、AWS Kinesis Data Analytics、腾讯云流计算 Oceanus | 无 Flink 运维能力或峰值不可预测 → 托管，用钱换弹性；有平台团队且规模稳定 → 自建，用控制力换成本 | 托管下算清计费口径再选，否则状态存储与跨区流量会改变成本结构；自建下要预留平台人力，否则版本升级与状态迁移无人负责 |
| 监控与可观测 | Flink Web UI、Prometheus + Grafana、REST 指标接口 | 背压与检查点指标必须能**按算子下钻**才选它；只做存活监控的看板不满足 Step 5 的判据 | 只采端到端延迟，故障时无法定位到算子，排查靠人工二分 |
| 特征平台 | Feast、Tecton、自建特征平台 | 判据是「能否把同一份定义物化到在线与离线两个 store」以及「能否做时点正确的回填」 | 平台不支持同源定义时，训练与推理会各算一遍，又回到两套实现 |

**这一类里最容易被误选的是引擎本身**（§ 7.3 的机制差异那张表已经解释了原因）：用微批引擎做 CEP、或用一个应用内嵌库做跨源聚合，两者的症状都是「延迟目标达不到」，而排查方向会被误导到并行度与资源上，真正的约束在窗口语义与状态能力。第二个易错点是**照抄版本号**：上表版本只是参考定位，具体某版本支持哪些 connector 与配置项，请以官方发布记录与对应版本文档为准——实时计算栈的 connector 与配置项跨版本变动频繁，照抄一篇旧文章的版本号通常会得到一条跑不起来的作业。

### 4.4 存量迁移

**① 先做哪一件：只加一条旁路，不动线上读路径（2–4 周【经验】）**

已有离线链路（T+1 批 + 定时同步）的团队不要一上来就切流量。第一步只做一件可回退的事：新链路只写、不供线上读，产出写到独立位置，与旧结果**按同一口径逐日对账**。这一步随时可以停掉（删掉旁路作业即可），但它一次性回答了两个存活问题——新链路的结果与旧口径差多少、差值能不能被解释。

**② 历史资产怎么分类：按源表与口径两个维度分档**

| 存量类型 | 判断依据 | 处理方式 | 不处理的后果 |
| --- | --- | --- | --- |
| 主键完整、DDL 温和的源库表 | 有主键、近半年无结构变更 | 直接上 CDC，进新链路 | 继续定时同步，维表新鲜度永远由刷新周期决定 |
| 无主键或 DDL 频繁的表 | 无主键，或月度多次改结构 | 保留定时全量同步，**标记为已知盲区**并进清单 | 强行上 CDC 会得到一条不稳定的入湖链路，且盲区变成看不见的依赖 |
| 口径每月都要改的指标 | 近一季度口径变更 ≥ 1 次【经验】 | 优先并入流批一体的一份定义（§ 3.2.3），其余指标留在旧链路 | 两份实现无法同时上线，中间窗口里两个数字并存 |
| 脚本 / 临时任务 | 动态 SQL、拼接表名、外部导入 | 运行时采集兜底或人工登记，并记录最后更新时间 | 它们成为不可见依赖，出问题时谁也说不全影响面 |

**不做全量返工的理由是收益分布**：迁移的成本几乎全部压在「有主键、DDL 温和」这一档上，而这一档通常只占源表的一部分【经验】；把剩下两档先挂账，就能用可控成本拿到大部分新鲜度收益。挂账是合法终态——它把「不知道」变成「已知的不知道」。

**③ 双轨怎么维持、维持多久**

双轨期的固定动作是**对账**：新链路（流）与旧链路（批）按同一口径逐日比对，差异必须能被解释到具体记录，而不是只看总量。双轨通常维持 **2–4 个季度**【经验】，随源表数量、DDL 频率与团队人力变化；跨区或多业务线并行迁移时更长。

双轨期必须显式定义两条线的接口与切换顺序：**先切读、再切写、最后下线旧链路**。顺序反了（先停旧链路再切读）会让回退窗口消失——旧链路一旦停止写入，任何新链路的问题都只能向前修，这与 § 3 里「能不能重算历史」那条判据直接冲突。

**④ 什么信号说明可以退出双轨**

四个信号同时成立才退出：连续对账周期内流批差异为零，且对账跨越了**一个完整业务周期**（至少包含一次月结或一次大促）；峰值下的检查点成功率达标且背压没有堆积到影响延迟；背压或滞后指标至少驱动过一次自动扩缩（说明机制真的在起作用，不是靠人盯）；做过一次回退演练——把读路径切回旧链路，用的是文档里写的步骤而不是某个人的记忆。任一信号未达标就延长双轨；不要用「新链路已经跑得挺稳」这类观察代替它们。

### 4.5 模板 / 示例

**示例 1：Flink + Kafka + Iceberg 完整实时数仓**

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(60000);                       // 间隔【经验】

EnvironmentSettings settings = EnvironmentSettings.inStreamingMode();
TableEnvironment tEnv = TableEnvironment.create(settings);
tEnv.getConfig().set("table.exec.source.idle-timeout", "10s");   // 空闲源不推进水位线

// MySQL CDC Source
MySqlSource<String> source = MySqlSource.<String>builder()
    .hostname("mysql-host").port(3306)
    .databaseList("shop").tableList("shop.orders")
    .username("cdc").password("<凭据走后端配置>")
    .deserializer(new JsonDebeziumDeserializationSchema())
    .build();
DataStream<String> stream = env.fromSource(
    source, WatermarkStrategy.noWatermarks(), "MySQL CDC");

// 目标湖表
tEnv.executeSql("""
    CREATE TABLE iceberg_orders (
      order_id BIGINT, user_id BIGINT,
      amount DECIMAL(18, 2), order_time TIMESTAMP(3)
    ) WITH ('connector' = 'iceberg',
            'catalog-name' = 'hive_prod',
            'uri' = 'thrift://metastore:9083')
""");

tEnv.createTemporaryView("orders_cdc", stream);
tEnv.executeSql("""
    INSERT INTO iceberg_orders
    SELECT CAST(JSON_VALUE(value, '$.order_id') AS BIGINT)          AS order_id,
           CAST(JSON_VALUE(value, '$.user_id')  AS BIGINT)          AS user_id,
           CAST(JSON_VALUE(value, '$.amount')   AS DECIMAL(18,2))   AS amount,
           TO_TIMESTAMP(JSON_VALUE(value, '$.order_time'))          AS order_time
    FROM orders_cdc
""");
```

**怎么用**：照抄的是结构——CDC source → 临时视图 → 湖表 INSERT。要改的四处：连接信息与凭据（凭据走配置中心，不要写进作业代码）、`idle-timeout`（按最慢的源调整）、检查点间隔（按状态量定）、`WatermarkStrategy.noWatermarks()`（若下游要做事件时间窗口，这里必须换成有界乱序水位线，见 4.2 第 3 条）。不要照抄的是 `JSON_VALUE` 的写法：它是「CDC 输出 JSON 字符串」这一种形态下的解析方式，换成 Debezium JSON 之外的格式就要跟着换。

**示例 2：Flink + Paimon 流批一体**

```java
tEnv.executeSql("""
    CREATE TABLE kafka_orders (
      order_id BIGINT, user_id BIGINT,
      amount DECIMAL(18,2), ts TIMESTAMP(3)
    ) WITH ('connector' = 'kafka', 'topic' = 'orders', 'format' = 'json')
""");

tEnv.executeSql("""
    CREATE TABLE paimon_orders (
      order_id BIGINT, user_id BIGINT,
      amount DECIMAL(18,2), ts TIMESTAMP(3),
      PRIMARY KEY (order_id) NOT ENFORCED
    ) WITH ('connector' = 'paimon', 'path' = 's3://lake/paimon/orders')
""");

tEnv.executeSql("INSERT INTO paimon_orders SELECT * FROM kafka_orders");
```

**怎么用**：这张表的重点在 `PRIMARY KEY ... NOT ENFORCED` 与 changelog 语义——主键决定了下游能不能拿到更新与删除事件。填这一格之前先确认两件事：流式写入与批式读取是否走同一张表（§ 3.2.3 的判据），以及小文件合并（compaction）由谁触发、多久一次。不要照抄的是 path 与主键选择：主键选错会让 compaction 变成常态负担。

**示例 3：Flink 实时特征工程**

```java
DataStream<UserFeature> features = orders
    .keyBy(Order::getUserId)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .aggregate(new FeatureAggregate());
features.addSink(new FeatureStoreSink());

public static class FeatureAggregate
        implements AggregateFunction<Order, UserFeatureAccumulator, UserFeature> {
    public UserFeatureAccumulator createAccumulator() { return new UserFeatureAccumulator(); }
    public UserFeatureAccumulator add(Order order, UserFeatureAccumulator acc) {
        acc.gmv += order.getAmount(); acc.orders += 1; return acc;
    }
    public UserFeature getResult(UserFeatureAccumulator acc) {
        return new UserFeature(acc.userId, acc.gmv, acc.orders);
    }
    public UserFeatureAccumulator merge(UserFeatureAccumulator a, UserFeatureAccumulator b) {
        a.gmv += b.gmv; a.orders += b.orders; return a;
    }
}
```

**怎么用**：窗口大小【经验】要按「在线侧能承受的状态量」反推，不是按业务希望的统计周期直接填；`FeatureStoreSink` 必须同时写在线 KV 与离线湖表（含事件时间），只写一处就等于放弃训练/推理同源。不要照抄的是累加器字段——上面只算了两个特征，真实特征清单要按训练侧实际读取的字段来定。

**示例 4：Flink 反压监控**

```bash
# Web UI（人工排查）
http://jobmanager:8081/                # Backpressure 页按算子显示背压占比

# REST 指标（接监控）
curl http://jobmanager:8081/jobs/<jobId>/vertices/<vertexId>/backpressure

# Prometheus 抓取端点（接告警与扩缩）
curl http://jobmanager:8081/metrics
```

**怎么用**：这三条通路对应三种用途，不要互相替代——Web UI 用于事后定位到算子，REST 用于自动化巡检，Prometheus 用于告警与驱动扩缩。填 `jobId` / `vertexId` 时要按算子维度采集，只采作业级指标无法满足 4.1 Step 5 的判据。指标名与端点路径请以所部署版本官方文档为准。

### 4.6 成本：这套东西的账单

实时计算的账单结构和批处理相反：批处理用完即停、可以按需弹到零，而一个 Flink 作业是**常驻进程**——TaskManager 的 vCPU 与内存 7×24 占着，零流量的夜里也不释放。这是本主题成本结构的根因，它决定了大头不在「算得多」，而在「一直开着」。

三项里与本主题相关的：

- **状态与检查点的 I/O（占比最大）**：状态后端把三样资源绑在一起——RocksDB 状态落本地盘吃容量、检查点写远端对象存储吃带宽与请求数、故障恢复重读又吃一次跨区流量（Apache Flink 官方文档 1.19，2024【公开】：检查点把算子状态持久化到配置的远端存储）。这部分成本随 **key 空间 × 单 key 状态大小 × 检查点频率** 增长，而不是随吞吐量增长；流量降下来它也不降（机制见 §2.1 状态后端）。
- **常驻算力**：按并行度占用的 vCPU·小时数计。托管平台（阿里云 VVR、AWS Kinesis Data Analytics、腾讯 Oceanus，见 4.3）按 CU / 处理单元计费，选托管前要把「常驻规格 + 状态存储 + 跨区流量」三块计费口径分开算——只比 CU 单价会漏掉后两块，而它们恰恰是随状态膨胀的那两块。
- **人力**：状态量估算、Savepoint 迁移、背压定位是稀缺技能；一个能自己扛住版本升级与状态迁移的实时平台组，通常要专职平台工程师 1–3 人【经验】，随作业数与源表数变。换一次状态后端要走 Savepoint 或双写过渡（§3.6），那不是一次调参，而是一次有排期的项目。

**为什么这个主题贵在这里**：它按「保持可恢复」付费，而不是按「算了多少」付费——空闲时段的状态存储与检查点照付，故障重放还要再付一遍正常执行过的那段计算。省钱的杠杆因此都在状态侧（把长窗口挪到离线、缩小 key 空间、错开检查点频率），而不在把 CPU 利用率压满。通用的成本治理口径见 `11-cross-cutting/03-data-cost-finops`，这里只列本主题特有的那几项。

### 4.7 容灾与故障演练

容灾在本主题是**作业级**的：状态是单一 writer、检查点绑定存储位置，所以容灾形态是「从最近成功检查点重启」，而不是跨地域双活（为什么双活不适用见本节末）。

| 失效模式 | 影响面 | 降级策略 | 演练 | 恢复目标 |
| --- | --- | --- | --- | --- |
| 检查点持续失败（状态后端抖动 / 状态涨过间隔） | 一旦崩溃只能回到更早检查点，重放量放大 | 回退到上一次成功检查点，接受更长重放 | 断开 checkpoint 存储，看失败累积到阈值后的作业行为 | RPO 由检查点间隔决定，分钟级【经验】 |
| 源库 binlog 保留期被写穿 | 断点无法续读，必须重新全量快照 | 触发全量重扫并接受湖表短暂不一致 | 预发环境把保留期设到极短，验证「追不平」告警是否触发 | RPO 视快照耗时而定，小时级【经验】 |
| JobManager 单点 | 调度中断，新作业与恢复无人触发 | 依赖 Flink HA 选主；无 HA 则人工拉起 | 杀 JM，测自动选主与作业续跑时长 | RTO 由状态量与恢复并行度决定，分钟到十几分钟【经验】 |
| 大促脉冲引发反压雪崩 | 端到端延迟阶梯恶化，各算子 CPU 都不高压 | 降级到规则 / 丢弃非关键流 | 做一次**超过稳态**的脉冲压测（不是稳态水位） | 由背压指标驱动扩缩，目标见 Step 5 告警阈值 |
| Savepoint 迁移失败（引擎 / 状态后端升级） | 升级卡住，旧新版本只能二选一 | 回退到旧版本继续跑 | 在预发用真实状态跑一次 Savepoint 恢复 | 迁移窗口内需双跑过渡 |

**恢复目标**：本主题的 RPO 直接由检查点间隔决定（作业重启回到最近成功检查点），故 RPO ≈ 检查点间隔【推算：间隔 1–5 分钟【经验】 → RPO 落在分钟级】；RTO 由状态量与恢复并行度决定，落在分钟到十几分钟【经验】。两者都是区间，实测值随状态量变，必须自己压测得到，不要照抄。

**为什么不适用跨地域双活**：Flink 状态是单 writer、检查点绑定在一个存储位置，部署两套同时消费同一源会得到两份互不相同的状态和重复的 Sink 写入，双活换来的可用性小于它引入的复杂度；真实做法是「异地从检查点冷启」，属于 `12-architecture/07-disaster-recovery` 的冷备形态而非双活。通用的混沌演练清单见 `12-architecture/06-chaos-engineering`，这里不重复。

### 4.8 演进路线：0 → 1 → 100

**0 → 1（单链路跑通，1–2 个月【经验】）**：一个 Flink 集群 + 一个 CDC 源 + 一个 Sink，检查点写本地 HDFS，内存状态后端够用。**变贵的是什么**：几乎没有——小规模下状态在内存，成本约等于几台常驻机器。**先坏的是什么**：不是资源，是「看不见」——没有按算子下钻的背压监控（Step 5），第一次延迟变差时只能人工二分。此阶段该花的是把状态量估算表与检查点余量表填出来，而不是调参数。

**1 → 100（多源、流批一体、平台化）**：状态切 RocksDB + 远端检查点，接入多源 Join / CEP，引入专职平台工程。**变贵的是什么**：状态存储与检查点带宽（4.6 的大头在这里显形）、以及专职人力。**先坏的是什么**：状态上界估错——流量翻倍当天同时出现 OOM 重启与检查点失败（§3.5 第一条反模式）；这两件事看起来独立，根因是同一个估算（见 4.10 小结）。

**100 →（流批一体 → AI 原生）**：从「一份定义物化两份」走到 Paimon / Iceberg 流批一体，再叠加流式特征与 LLM 算子（Step 6）。从 Lambda 走到流批一体落在 §3.6 标为「迁移成本最高」的那一类（要动存储与重算路径）；状态后端换代要走 Savepoint / 双写，不属于那一类但也不免费。**变贵的另一件事**：AI 算子把第三方配额引进了可用性边界（§3.2.7），降级路径必须独立于模型侧。这条的演进细节见 [§5 前沿演进](09-realtime-compute-section-5-ai.md)。

### 4.9 自检清单

4.1 的六步、4.4 的迁移动作、4.5 的模板各留下了一份产物，这一节逐件验收。**模式与设计层面的链路问题**（能否重算历史、端到端语义逐环、状态上界、热点 key、窗口与水位线、维表新鲜度）在 [§ 3.7 自检清单](09-realtime-compute-section-3-sec3.md) 已逐条给过，本节不复述；下面每一条要么是「去翻一份产物，翻得到还是翻不到」，要么是必须动了系统（抽样、对账、演练、切换）才有答案的动作。

- [ ] 选型说明里能否翻到「需要回算的最远时间点」与「日志 / 湖表快照保留期」这两个数字，且后者覆盖前者？
- [ ] 状态量估算表在不在？key 空间上界、单 key 状态大小、本地盘余量、网络带宽余量四格是否按显式假设填过，而不是留空？
- [ ] 「检查点间隔 / 实测耗时 / 重放窗口」三列表填了吗？重放窗口那一列是从实测耗时推出来的，还是照抄的？
- [ ] 告警阈值表里，检查点失败率、背压持续时间、滞后曲线斜率三条各写了阈值吗？阈值来自一次压测或一次演练吗？
- [ ] 源表清单里，主键覆盖率与日志保留期两列是否列全？无主键表与动态 SQL 作业是否已标成盲区并有人认领？
- [ ] 手动改一次源表结构，看链路是自动跟进还是需要人工介入——两种结果都行，但这一次的行为写进文档了吗？
- [ ] 抽一次样：取最近一个窗口写入湖表的输出，与源库当时的取值对一遍，对得上吗？对不上时差值能被解释吗？
- [ ] 抽一批训练样本，把样本里的特征值与当时在线推理读到的值按事件时间对一次，能对上吗？
- [ ] 双轨期每一轮对账的差异是否解释到了具体记录，而不是只看总量差？上一轮的对账记录现在还能打开吗？
- [ ] 背压或滞后指标是否至少驱动过一次自动扩缩（若仍是人工扩容，事后补了阈值吗）？还是仍然靠盯屏幕？
- [ ] 降级演练做过吗——切到规则兜底、按模型版本回溯一条历史决策、把读路径切回旧链路，各做过一次、用的是文档里的步骤？
- [ ] 退出双轨的四个信号逐条打勾了吗？有没有哪一条是用「新链路已经跑得挺稳」这类观察代替的？

这 12 条查的都是**已经建成的东西**。最常被跳过的是「状态量估算表」与「降级演练」两条——前者不产出可展示的东西（同 4.1 末段的观察），后者被当成上线后的运维事项；它们各自只需要一次操作，却分别决定流量增长时是提前扩容还是被动 OOM、以及第三方配额被打满时链路是降级还是停摆。

### 4.10 小结

> 本节小结：整条链路的落地过程中，唯一决定成败的环节是 **Step 2 的状态量估算与它推导出的状态后端选择**。理由是机制层面的：状态后端更换不属于 § 3.6 里「迁移成本最高」的那一类——那一类是「历史可重建能力」的变化（Lambda ⇄ Kappa ⇄ 流批一体），要动存储与重算路径——但它也不免费：§ 3.6 的补充判据要求这类更换靠 Savepoint 或双写过渡，而它是否选对，直接由「key 空间上界 × 单 key 状态大小」这一个估算决定。估错了，作业会在流量增长的某一天同时出现 OOM 重启与检查点失败，而这两件事看起来像是两个独立的运维问题。相比之下，检查点间隔、水位线容忍度、并行度这类参数可以就地调整、代价接近于零；状态后端的更换则必须先付一次过渡。所以本主题下最值得提前投入的不是把参数调优到极致，而是把状态量的上界估出来并配上监控。

> 💡 **思考锚点**：按 Step 2 的四格——key 空间上界、单 key 状态大小、本地盘余量、网络带宽余量——把线上作业的最坏情况填一遍：当「上界 × 单 key 大小」逼近可用内存时，它标出的状态上界落在哪一档，你现在的作业会先 OOM 重启还是先检查点失败，而这决定你该提前换状态后端还是只需就地调参？

> 配合 [§ 2 核心原理](09-realtime-compute.md)、[§ 3 设计模式与范式](09-realtime-compute-section-3-sec3.md) 与 [§ 6 落地实践](09-realtime-compute-section-6-sec6.md) 阅读。
