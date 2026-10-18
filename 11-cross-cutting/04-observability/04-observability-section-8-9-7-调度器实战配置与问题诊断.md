> 本文件是 **04-observability.md** § 8 面试真题集的子主题。完整章节请回到 [index](04-observability.md) 或 [§ 8 索引](04-observability-section-8-sec8.md)。

### 8.5 §9.7 调度器实战配置与问题诊断

> 本主题考察 YARN Capacity Scheduler 与 Fair Scheduler 的核心区别、深度配置、多租户隔离，以及队列资源利用率异常时的诊断。面试官真正想听的是「配置含义 + 业务影响 + 治理路径」，而不是「在 Ambari 里点几下」。

#### §9.7.1 请简要描述 YARN Capacity Scheduler 和 Fair Scheduler 的核心区别，并说明在何种场景下选择哪一种调度器更合适。

**1. 考察点**

- 是否理解两种调度器的**根本设计哲学**不同：Capacity 是"硬份额"，Fair 是"软份额"。
- 能否说出抢占、FIFO、Reservation 等机制的差异。
- 是否知道不同业务场景的选型依据。
- 加分项：能给出真实生产中的混部经验（Capacity + Fair 各自部署）。

**2. 参考答案框架**

**第一层：根本设计哲学。**
- **Capacity Scheduler**：源自 Yahoo。设计目标是「**多租户硬份额**」——每个队列有最小保证容量（capacity）和最大上限（max-capacity），保证小集群也能跑多个业务；抢占以"优先级"为依据。
- **Fair Scheduler**：源自 Facebook。设计目标是「**公平分配**」——所有作业动态均分集群资源，资源利用率高；抢占以"占有与需求差"为依据。

**第二层：核心差异对比。**

| 维度 | Capacity Scheduler | Fair Scheduler |
| --- | --- | --- |
| **资源份额** | 硬份额（队列 capacity + max-capacity） | 软份额（min-share + dynamic fair share） |
| **抢占策略** | 基于队列/作业优先级 | 基于"占用 vs 需求差" |
| **预留机制** | 无原生 Reserve（依赖队列规划） | ReservationSystem（预约式） |
| **资源利用率** | 中等（队列留 buffer） | 高（满负载运行） |
| **多租户硬隔离** | 强（队列 + ACL） | 中（依赖 ACL 与 ACLParentQueue） |
| **配置复杂度** | 中等 | 高（drf / asfair / fairshare 计算复杂） |
| **业务适配** | 离线 + 多租户隔离 | 实时 + 公平调度 |

**第三层：选型场景。**

- **选 Capacity Scheduler**：
  - 多租户强隔离（公司内有多个业务部门）；
  - 资源规划明确（固定配额）；
  - SLA 严格的批量作业（Hive / Spark SQL 批跑）；
  - Hadoop 默认使用（运维熟悉度高）。
- **选 Fair Scheduler**：
  - 资源弹性需求（白天跑实时、晚上跑批）；
  - 公平共享优先（不希望大作业霸占资源）；
  - 实时与离线混部（公平调度让双方均衡）；
  - 预约式 SLA（依赖 Reservation System）。
- **混部**：LinkedIn、Uber 等公司经常在多集群上同时部署两套——离线集群走 Capacity（硬隔离）、在线/混合集群走 Fair（公平）。

**第四层：演进方向。** Hadoop 3.x 起两个 Scheduler 都在向 `SchedulingFeatures` 演进，整合抢占策略与 Reservation System；YARN Federation 下队列可跨子集群，差异在弱化。

**3. 常见陷阱**

- **只看默认 scheduler 选。** Hadoop 默认 Capacity 不代表它是最好的；生产应该按业务选。
- **Capacity "硬份额" = 永远不能超过。** 不对——队列可以"借"其他队列空闲资源；`max-capacity` 控制上限。
- **Fair Scheduler 适合所有业务。** Fair 在多租户场景下，小队列会被大队列挤压；SLA 难保证。
- **忽视 Reservation System。** Reservation 是 Hadoop 3.x 起 Fair Scheduler 独有的优势，能给批量作业"预约"资源；Capacity 没有。

**4. 追问预测**

- **「Capacity 与 Fair 的抢占机制差异？」** 答：Capacity 按优先级整队列抢占；Fair 按作业"占用 vs 需求"差异抢占；前者粗粒度，后者细粒度。
- **「两者性能差异？」** 答：调度本身都很轻量；差异在策略决策——Capacity O(队列数)，Fair O(作业数)。
- **「生产选哪个？」** 答：默认 Capacity，多租户硬隔离；实时混部场景用 Fair；Uber / LinkedIn 都在不同业务用不同 scheduler。

**5. 参考资料**

- Apache Hadoop 官方文档中 `Capacity Scheduler` 与 `Fair Scheduler` 章节——两种调度器的权威实现。
- LinkedIn / Uber 关于 YARN Scheduler 选型的公开文章——头部企业的真实混部经验。
- 阿里 / 字节关于自研调度系统的公开分享——国内最大规模调度器设计参考。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §9.7.2 请阐述在万节点规模的 Hadoop 集群中，YARN 调度器可能面临哪些性能瓶颈？

**1. 考察点**

- 是否理解 Scheduler 的核心数据结构（队列、application、Container 列表）。
- 能否说出调度决策的计算成本（基于 `DominantResourceCalculator` 的木桶计算）。
- 是否知道心跳周期与调度频率的关系。
- 加分项：能给出行业 benchmark（单 RM 调度频率上限）。

**2. 参考答案框架**

**第一层：先理解调度器的工作量。** YARN Scheduler 每次心跳（默认 1s）需要：
- 遍历所有 NM 的资源状态；
- 遍历所有 application 的需求；
- 为每个 application 决策"哪些 Container 分配给谁"；
- 触发分配（RMContainerAllocator）。

万节点集群下，每秒决策量 = 节点数 × application 数 × Container 数 = 10K × 1000 × 50 ≈ 5 亿次决策 / 秒——即使是缓存友好，CPU 也吃不消。

**第二层：瓶颈 1 —— 调度器主线程成为 CPU 瓶颈。**
- **症状**：`yarn.resourcemanager.scheduler.activity` 心跳延迟飙高，AM 端感知分配慢。
- **根因**：调度决策是同步单线程（`CapacityScheduler` 的 `tryAcquireContainer`）。
- **解法**：
  - `yarn.scheduler.capacity.allocate-container.shuffle` 开启 async（YARN-9572）；
  - 减少单 application 的 ResourceRequest 数量（合并 Container 请求）；
  - 异步分配（`AsyncScheduler`）Hadoop 3.x 仍部分在开发。

**第三层：瓶颈 2 —— NM 心跳积压。**
- **症状**：`yarn.resourcemanager.nodemanagers.last-heartbeat` 时间戳显示某 NM 失联，但其实 RM 端处理慢。
- **根因**：心跳是串行处理；1s 心跳周期 + 5K 节点意味着每秒 5K 个心跳事件，处理慢会积压。
- **解法**：
  - NM 心跳周期调大到 3-5s；
  - `AsyncDispatcher` 多线程处理（默认 1 线程）；`yarn.resourcemanager.dispatcher.async.thread-count` 调到 50+。

**第四层：瓶颈 3 —— 队列与应用数量爆炸。**
- **症状**：每次调度遍历队列与 application 的成本线性增加。
- **根因**：万节点集群通常 100+ 队列、1000+ application；每次决策都是 O(队列 × application)。
- **解法**：
  - 队列收敛（按业务大方向划分，不按每个业务划分）；
  - 启用 Federation（拆分集群减少单集群 application 数）；
  - 调度器缓存（按 application 增量更新而非全量遍历）。

**第五层：瓶颈 4 —— 状态写 HDFS 阻塞。**
- **症状**：RM 的 StateStore 写 HDFS 慢会让调度阻塞。
- **根因**：`yarn.resourcemanager.fs.state-store.uri` 指向共享 Namenode，NameNode 切换时阻塞。
- **解法**：
  - 独立 Namenode 给 StateStore；
  - `yarn.resourcemanager.state-store.async` 异步写；
  - 内存 StateStore（`NullStateStore`，牺牲恢复能力）。

**第六层：瓶颈 5 —— RPC 阻塞。**
- **症状**：`RpcProcessingTimeAvgTime` 高。
- **根因**：RM 的 RPC 处理队列单线程；高并发 AM 注册时排队。
- **解法**：
  - `yarn.ipc.server.read.threadpool.size` 调大；
  - `yarn.ipc.server.handler.thread.count` 调大（默认 30）；
  - 启用 Hadoop RPC 异步（`useIpCAsyncdispatcher`）。

**3. 常见陷阱**

- **只调 NM 心跳频率。** 心跳慢确实缓解，但 AM 注册慢无法解决。
- **盲目扩容 RM 机器。** 内存不是瓶颈；CPU 与 RPC 队列是。
- **忽视 Federation。** Federation 是真正解决 RM 压力的方案，不是补丁。
- **不监控调度器指标。** `scheduler.assign` 的 P99 latency 是核心 SLO。

**4. 追问预测**

- **「单 RM 最多能调度多少 Container / 秒？」** 答：Hadoop 3.x + G1GC + 优化参数，单 RM 调度 ~5K-10K Container/秒；超过必须 Federation。
- **「ZGC 能缓解调度器压力吗？」** 答：缓解 GC 停顿，间接提升；但调度决策本身是 CPU 密集，ZGC 帮不大。
- **「异步调度器未来会 GA 吗？」** 答：Hadoop 3.x 一直在开发；YARN-9572 等 JIRA 跟进；预计 3.5+ 较成熟。

**5. 参考资料**

- Apache Hadoop 官方文档中 YARN Scheduler 配置章节——核心参数的权威出处。
- Apache Hadoop JIRA 上 YARN-9572 等异步调度相关 issue——异步调度的演进状态。
- LinkedIn / Uber 关于 YARN 调度器性能优化的公开文章——头部企业的真实瓶颈与调优经验。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §9.7.3 请说明在 YARN Capacity Scheduler 中，如何为一个新加入的、对延迟敏感的业务线配置队列和资源。

**1. 考察点**

- 是否理解 Capacity Scheduler 的「层级队列 + ACL + 抢占」机制。
- 能否给出队列配置的完整范式（最小保证、最大占用、ACL、优先级）。
- 是否知道延迟敏感业务的特殊处理（preemption + max-capacity 收紧）。
- 加分项：能给出真实生产中的队列命名规范与 ACL 设计。

**2. 参考答案框架**

**第一层：业务特征分析。** 对延迟敏感的业务线（如实时计算 / 风控 / 在线查询）有几个特征：
- 资源需求小但时效强（100 vcore + 10 GB 内存足够，但必须在秒级响应）；
- 优先级最高（抢占时优先保留）；
- 资源不能被低优先级队列占用。

**第二层：队列层级设计。**

```
root
├── prod (生产, capacity=60%)
│   ├── realtime (实时, capacity=15%, max-capacity=30%)
│   ├── risk (风控, capacity=10%, max-capacity=20%)
│   └── etl (ETL, capacity=35%, max-capacity=80%)
├── research (研究, capacity=10%, max-capacity=30%)
└── default (默认, capacity=30%, max-capacity=80%)
```

**第三层：关键参数配置（realtime 队列示例）。**
- **`yarn.scheduler.capacity.root.prod.realtime.capacity`** = 15（最小保证 15%）。
- **`yarn.scheduler.capacity.root.prod.realtime.maximum-capacity`** = 30（最多可借到 30%，避免独占集群）。
- **`yarn.scheduler.capacity.root.prod.realtime.user-limit-factor`** = 2（单用户最多用 2× 队列份额）。
- **`yarn.scheduler.capacity.root.prod.realtime.acl_submit_applications`** = `realtime_team`（ACL 限制提交）。
- **`yarn.scheduler.capacity.root.prod.realtime.state`** = RUNNING。
- **`yarn.scheduler.capacity.root.prod.realtime.disable-preemption`** = false（允许被抢占但优先保留）。

**第四层：抢占配置。**
- **`yarn.resourcemanager.scheduler.monitor.enable`** = true（必须）。
- **`yarn.scheduler.capacity.root.prod.realtime.disable-preemption`** = false（允许被抢占）。
- **抢占优先级**：`yarn.scheduler.capacity.root.<queue>.priority`（默认 0）。
- **抢占策略**：`ObserveOnly` / `Proportional` / `FairPreemption`；实时队列用 `FairPreemption`。
- **抢占阈值**：`yarn.resourcemanager.monitor.capacity.preemption.max-ignored-preemption-per-iteration`（默认 1）调大，减少误抢占。

**第五层：资源规格与单 Container 限制。**
- **`yarn.scheduler.capacity.root.prod.realtime.maximum-allocation-vcores`** = 16（单 Container 最大 vcore）。
- **`yarn.scheduler.capacity.root.prod.realtime.maximum-allocation-mb`** = 64GB（单 Container 最大内存）。
- 实时队列的 Container 通常需求小（1-4 vcore），不要设过大避免长 Container 占用。

**第六层：监控与验证。**
- 上线后立即监控 `realtime` 队列的 `PendingApplications`、`AvailableMB`、`AllocatedMB`。
- 验证：在 ETL 队列跑满 90% 时，realtime 队列仍能在 5s 内拿到 1GB Container。
- 触发抢占演练：手工把 ETL 队列资源撑满，看 realtime 作业能否 1min 内启动。

**3. 常见陷阱**

- **max-capacity 不设上限。** 默认 -1=100%，实时队列可能独占整个集群。
- **disable-preemption=true。** 禁用抢占让实时队列硬保证，但牺牲集群利用率（30% 资源空闲）。
- **不设 ACL。** 任何用户都能往 realtime 队列提交，可能被滥用。
- **user-limit-factor 设 1。** 单用户独占队列，不利于多租户。
- **不验证抢占效果。** 上线不演练，抢占机制失效就出生产事故。

**4. 追问预测**

- **「实时队列和非实时怎么隔离？」** 答：实时队列放在独立父队列 + 保持可被抢占（`disable-preemption=false`，靠优先级与 max-capacity 优先保留，而非关抢占）/ 减 ACL + 严格 ACL；非实时队列走另一父队列。
- **「队列命名规范？」** 答：`{env}.{team}.{purpose}` 三段式，如 `prod.realtime.flink`。
- **「如何灰度新队列？」** 答：先 capacity=1 试运行，验证 ACL、抢占；再调到目标容量。

**5. 参考资料**

- Apache Hadoop 官方文档中 `Capacity Scheduler` 配置章节——`capacity.xml` 完整配置示例。
- LinkedIn / Uber 关于多租户队列治理的公开文章——头部企业队列设计经验。
- 阿里 / 字节关于队列命名与隔离的公开分享——国内生产实践参考。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §9.7.4 在生产环境中，如何通过 YARN 的调度器配置实现严格的「多租户」资源隔离，以防止不同业务的资源争抢。

**1. 考察点**

- 是否理解多租户隔离的四个层面：队列、ACL、配额、抢占。
- 能否给出配置范式（capacity.xml 完整示例）。
- 是否知道容器化时代的额外隔离（cgroup / K8s）。
- 加分项：能给出多租户监控的实战方案。

**2. 参考答案框架**

**第一层：多租户隔离的目标。** 严格多租户隔离要满足四个属性：
- **资源隔离**：每个租户的最小保证 + 最大上限；
- **访问隔离**：不同租户的作业互不可见（ACL）；
- **故障隔离**：一个租户的故障不波及其他；
- **可观测**：每个租户的资源使用可度量、可计费。

**第二层：队列层级设计。**
- **根队列**：避免所有业务都挂在 root；按业务大方向（生产 / 测试 / 分析）拆 2-3 个子队列。
- **租户队列**：每个业务线单独队列；子队列可继续按团队细分（但层级不超过 3 层，否则管理复杂）。
- **保留队列**：固定给某个核心租户的独占队列（capacity=100%，no other）。

**第三层：ACL 隔离。**
- **`acl_submit_applications`**：限制提交用户 / 用户组。
- **`acl_administer_queue`**：限制管理员。
- **`acl_applications`**：基于 YARN Application ACL（Kill / View）。
- **`administer-acls`**：管理员操作权限。
- **实战**：每个租户配独立 `user_group`（如 `tenant_a_users`），提交权限只给该组。

**第四层：资源配额隔离。**
- **最小保证（capacity）**：每个租户队列配固定 capacity。
- **最大占用（maximum-capacity）**：防止借的过多导致小租户饿死。
- **user-limit-factor**：单用户在队列内最多占多少倍。
- **实战**：`tenant_a: capacity=20%, max-capacity=40%`。

**第五层：抢占隔离。**
- **跨租户抢占**：高优先级租户可抢占低优先级；
- **租户内抢占**：同一租户内高优先级作业抢低优先级；
- **`maximum-preemption-per-iteration`**：控制每次抢占幅度，避免抢光。

**第六层：容器级隔离（cgroup）。**
- **CPU 隔离**：`yarn.nodemanager.resource.cpu-enable-cgroups=true` + cgroup v1 / v2。
- **内存隔离**：`yarn.nodemanager.pmem-check-enabled=true`（默认）。
- **磁盘 IO 隔离**：Linux cgroup v2 的 io.max（CentOS 9+ / Ubuntu 22+ 才支持）。
- **网络隔离**：YARN 自身不控制，需要配合 SDN / Calico。

**第七层：K8s 时代的隔离升级。** YARN 在 K8s 上的继任是 K8s Namespace + ResourceQuota + LimitRange；多租户隔离更细（Pod 级别）。Spark on K8s / Flink on K8s 走这条路。

**第八层：监控与计费。**
- **每租户资源看板**：容量、占用、利用率、抢占次数。
- **成本归因**：按租户分摊资源成本。
- **SLA 报告**：每租户作业的 P99 延迟。

**3. 常见陷阱**

- **只设队列不设 ACL。** 没有 ACL 任何人都能提交，隔离形同虚设。
- **max-capacity=100%。** 互相借光导致小租户饿死。
- **多租户共用 NM。** 容器化时代应该每租户独占 NM 或 K8s 节点。
- **不监控抢占。** 抢占本身也会争抢，配置不当会让系统抖动。
- **租户数无上限。** 队列超过 50 个后调度器性能下降；要做租户收敛。

**4. 追问预测**

- **「YARN 多租户 vs K8s 多租户？」** 答：YARN 是 Hadoop 生态的天然选择；K8s 是云原生时代的通用选择；混部场景两者并存（Spark on YARN + 微服务 on K8s）。
- **「租户数过多怎么办？」** 答：限制租户数量（≤ 50）；引入二级代理（租户管理员）；用 Federation 拆分集群。
- **「cgroup 配置不生效？」** 答：检查 `yarn.nodemanager.linux-container-executor.enabled=true` + ContainerExecutor 可执行文件权限；cgroup 目录可写。

**5. 参考资料**

- Apache Hadoop 官方文档中 `Multi-Tenant` 与 `Capacity Scheduler` 章节——多租户配置的标准实践。
- LinkedIn / Uber 关于多租户资源隔离的公开文章——头部企业的真实隔离经验。
- Kubernetes 官方文档中 `Resource Quotas` 与 `Limit Ranges` 章节——云原生多租户参考。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §9.7.5 假设集群中出现某个重要队列资源利用率长期过低，而其他队列资源紧张的情况，请说明你的排查思路与解决方案。

**1. 考察点**

- 是否具备「资源利用率诊断」的能力——区分"需求低"与"调度失败"。
- 能否从队列配置、抢占策略、业务特征多角度分析。
- 是否知道 Fair Scheduler 的公平份额算法。
- 加分项：能给出资源再平衡的具体方案。

**2. 参考答案框架**

**第一层：先归类原因。** 队列利用率长期过低，原因有三：
- **A. 真需求低**：业务方主动没用完（业务缩减 / 提交策略保守）；
- **B. 调度失败**：作业提交了但分不到 Container（队列上限满 / 资源类型不匹配）；
- **C. 抢占失衡**：被其他队列抢占回来（实时队列或高优先级抢占）。

**第二层：诊断步骤。**
1. **看 PendingApplications**：队列有未分配的 application，但 `AvailableMB` 接近 0，说明调度失败。
2. **看 max-capacity**：若 `maximum-capacity` 等于 `capacity`，队列不能借用集群空闲资源，需求上来时会"想用用不了"。
3. **看抢占历史**：被抢占次数 > 0，且抢占来自高优队列。
4. **看 application 分布**：队列内 application 数 vs 提交频率；很少提交说明需求低。

**第三层：诊断 —— Capacity Scheduler。**
- **`capacity` vs `maximum-capacity`**：如果 `maximum-capacity` = `capacity`，队列不能借资源。
- **`minimum-user-limit-percent`**：单用户最低保证。
- **`disable-preemption`**：是否禁止本队列被抢占（true = 保护不被抢）。
- **`.ordering-policy`**：FIFO / Fair / FairShare（决定队列内分配）。

**第四层：诊断 —— Fair Scheduler。**
- **`minShare`**：最小份额；过低会导致被抢占。
- **`schedulingPolicy`**：Fair / FIFO / DRF。
- **`fairShare`**：实时公平份额；长期过低说明被抢占。
- **`weight`**：队列权重；过低会让大队列抢走资源。

**第五层：解决方案分类。**

- **A. 真需求低**：可减小 capacity（释放资源给其他队列），但保留 `minimum-allowed-capacity` 防止归零。
- **B. 调度失败**：
  - 调高 `maximum-capacity`；
  - 检查 `node-label-expression`（队列绑定的节点标签是否匹配）；
  - 检查 `resource-type`（CPU / GPU 节点是否配对）。
- **C. 抢占失衡**：
  - 调高队列优先级（`priority`）；
  - 增加 `max-preemption-per-iteration`；
  - **不要用 `disable-preemption=true` 保护队列。** 禁用抢占虽能给队列硬保证不被抢，但牺牲集群利用率（30% 资源空闲），是 §9.7.3 已列出的常见陷阱；保护不被抢应改用上面的优先级 / 抢占阈值手段。

**第六层：长期治理 —— 资源再平衡。**
- **季度 review**：每队列利用率 / SLA 满意度报表。
- **动态调度**：引入 K8s HPA / 自研动态队列（按利用率动态扩缩）。
- **跨集群调度**：本地集群利用率低 → 跨集群联邦调度。
- **业务驱动**：业务方对资源利用率负责（成本归因 + KPI）。

**3. 常见陷阱**

- **直接调小 capacity。** 业务方需求恢复时资源拿不到。
- **不看 PendingApplications 就调。** 调参前必须看现象。
- **忽视 node-label。** 队列绑定的节点标签不匹配，分不到 Container。
- **把所有队列调到 max-capacity=100%。** 所有队列互相借光，没有隔离。
- **不跟业务方沟通。** 队列调整涉及业务方 SLA，必须先沟通。

**4. 追问预测**

- **「Queue 的 fairShare 怎么算？」** 答：`fairShare = capacity × cluster_capacity / sum(capacity)`，即按各队列 capacity 在总 capacity 中的占比分配集群容量。Fair / FIFO 属于队列内的 `.ordering-policy`，只决定队列内作业的排序，并不改变这条队列间的份额公式——两者不是同一公式的两种写法，也不构成两套算法。
- **「如何识别 node-label 不匹配？」** 答：NM 标签 `node.labels` 与队列标签必须一致；调度器日志里有 `ResourceRequest` 与 NM 标签对比。
- **「队列利用率低但作业在等？」** 答：PendingApplications > 0 且 AvailableMB = 0 → 资源被抢占或 max-capacity 满。

**5. 参考资料**

- Apache Hadoop 官方文档中 `Fair Scheduler` 配置章节——`fair-scheduler.xml` 的完整配置与算法解释。
- LinkedIn / Uber 关于队列利用率治理的公开文章——头部企业的资源再平衡经验。
- 阿里 / 字节关于多租户资源调优的公开分享——国内队列利用率治理实践。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

---
