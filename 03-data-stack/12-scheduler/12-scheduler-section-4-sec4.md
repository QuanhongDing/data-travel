> 本文件是 **12-scheduler.md** 的子文件（§4. 工程实现）。本节讲怎么把 [§ 3](12-scheduler-section-3-sec3.md) 里选定的编排模式装进一个真实组织：顺序、判据、产物与存量迁移。完整章节请回到 [index](12-scheduler.md)。

## 4. 工程实现

[§ 3](12-scheduler-section-3-sec3.md) 回答「在什么约束下该用哪种编排模式」，本节回答「选定之后怎么把它装进一个已经有 crontab、已经有几百条脚本在跑的组织」。组织顺序：落地步骤（4.1）→ 关键技术点（4.2）→ 工具链选型（4.3）→ 存量迁移（4.4）→ 模板（4.5）→ 自检（4.6）。

读者分两类。**存量改造者**（有 Crontab / 旧 Oozie / Airflow 1.x 的脚本资产，要收敛成可治理的编排）以 §4.1 Step 3 与 §4.4 为主线。**从零搭建者**（新链路、无历史资产）按 Step 1–2、4–7 走，跳过 Step 3。两类读者共用 §4.2 与 §4.5；§4.4 的双轨退出条件对从零搭建者也有用，因为上一代手工跑批不会在你上线那天停。

一条前置判据：本节的每个工程动作（幂等、隔离、SLA、异常检测）都以「图上能看到真实依赖」为前提。**存量改造者先做 Step 3，两类读者都先做 Step 4**（从零搭建者没有存量脚本要纳管，Step 3 对他不成立），再谈 Step 5 之后的事；顺序颠倒会让后四步全部建在猜出来的依赖图上。

### 4.1 落地步骤

**Step 1：选型调度器（1–2 周【经验】）**

- 通用编排：Airflow / DolphinScheduler；云原生：Argo Workflows；云端托管：DataWorks（另有 Prefect / Dagster / KubeFlow Pipelines，见 [§ 3.2](12-scheduler-section-3-sec3.md)）。
- 先定**依赖判定的层次**（任务成功，还是数据就绪），再定**执行归谁管**（自管 Worker / K8s / 托管算力）——这比选哪个产品更前置。
- 评估与既有调度资产的迁移成本：能沿用谁、必须重写谁。

- **产物**：选型报告（编排定义放在哪、依赖判定在哪一层、执行载体是谁、存量怎么过来）。
- **判据**：报告里要能回答「某个上游返回成功但只写了半个分区时，下游会不会照常触发」——答不上来，说明选型还停在工具对比，没定下依赖层次。
- **为什么必须这一步／为什么在这个位置**：它是后面所有步骤的约束来源。先定依赖层次，Step 4 的依赖规范才有内容可写；先定执行载体，Step 2 的部署与资源池规划才有对象。

**Step 2：集群部署（2–4 周【经验】）**

- Scheduler 高可用（多副本 + 元数据库独立部署 + 定期备份），不把控制面与状态放在同一台机器上。
- Worker 弹性扩缩容：按队列 / 命名空间划分资源池，配好配额与优先级。
- 部署形态按 Step 1 的结论选：自建（Compose / Helm）、K8s、云托管。

- **产物**：部署清单（组件拓扑、元数据库位置与备份策略、队列与配额表、扩缩容触发条件）。
- **判据**：把调度器进程 `kill -9` 再拉起，任务从元数据库恢复；备份能在一台干净机器上跑出一份可用的元数据库。
- **为什么必须这一步／为什么在这个位置**：元数据库的位置决定了后面两件事的可行性——Step 5 的监控要读它的状态表，Step 6 的补数要在它上面记录。部署期把它放错位置，后面两步要重新部署一次才能做。

**Step 3：存量脚本纳管（2–6 周【经验】，随脚本数量放大）**

- 把 Crontab / 脚本 / 旧调度作业登记成 DAG：先只搬「何时触发、谁依赖谁」这两层事实，**不改脚本本体**。
- 每条链路登记：Owner、产出表与分区、产出时刻、是否幂等、是否有下游。
- 无法判定上下游的脚本进「未纳管挂账清单」，采集其触发记录，不做迁移。

- **产物**：纳管清单 + 新旧入口对照表 + 未纳管挂账清单（含 Owner 与停用理由）。
- **判据**：任取一条链路，图上能看到它声明的全部上游；看不到的进挂账清单。这个动作必须由人逐条过，不能批量导入后就宣布完成。
- **为什么必须这一步／为什么在这个位置**：它必须在 Step 4 之前——图先画对，规范才知道要约束谁，否则规范只能约束新建的 DAG，存量继续以 sleep 猜依赖。

**Step 4：DAG 编排规范（1–2 周【经验】）**

- **命名规范**：DAG、任务、产出表的命名与负责人字段。
- **依赖规范**：只对真实依赖建边；等待上游数据用 Sensor / 分区就绪 / 事件，不用 `sleep`；对空分区单独判定。
- **失败处理**：重试次数与退避、可重试与需人工的划分、告警通道与升级链。

- **产物**：规范文档 + 模板 DAG + 静态检查脚本（挂进 CI）。
- **判据**：新建一条链路按模板写能通过检查；抽 3 个存量 DAG，违规项由脚本自动列出——如果需要靠人评审才能发现，规范就还没落地。
- **为什么必须这一步／为什么在这个位置**：它必须落在代码/配置层面才能生效，而这一步依赖 Step 3 的图。放在 Step 3 之前，规范只能约束新链路；放在 Step 5 之后，监控会先淹在无意义的失败告警里。

**Step 5：监控告警（1–2 周【经验】，随关键链路数与告警通道数放大；之后常驻）**

- DAG Run 状态（成功率、排队时长、关键路径时长）。
- Task 失败告警（含失败原因分类：连接超时 / 资源不足 / 数据异常）。
- SLA Miss 告警：关键链路的产出时刻承诺，以及一个能量化的"准时产出率"。

- **产物**：监控面板 + 告警路由表（谁收、多久未响应升级给谁）+ 准时产出率指标。
- **判据**：能报出上周的准时产出率；随机抽一次历史告警，能看到从触发到处置人的完整记录。
- **为什么必须这一步／为什么在这个位置**：Step 6 的补数效果、Step 7 的异常检测都需要这里产出的信号（状态、时长、失败分类）。没有它们，补数只能凭感觉、检测只能看日志。

**Step 6：补数机制（持续）**

- Backfill 历史数据（按分区区间重跑）+ 手动重跑单任务。
- 补数走独立队列并限制并发；补数前强制幂等检查。
- 每次补数登记：谁发起、补了哪些分区、为什么、验证结论。

- **产物**：补数作业模板 + 补数队列配置 + 补数记录表。
- **判据**：补一次近一个月的分区，对比补数前后各一小时、日常链路关键任务的时长——没有明显上移才算隔离生效。
- **为什么必须这一步／为什么在这个位置**：补数是唯一一类"自己给自己制造负载"的操作，它必须在监控之后做，否则补出来的数没人验证；也必须在幂等之后做，否则会重复写。

**Step 7：AI 集成（按需）**

- AI 异常检测：判定基准从固定阈值换成该作业自身的历史分布。
- AI 自动修复：只对动作可枚举、可回滚的故障类型开（如重启卡住的作业、重跑失败任务）。

- **产物**：异常检测作业 + 自动修复的动作清单与回滚步骤 + 误报处置记录。
- **判据**：对同一历史故障回放，检测能早于人工发现【经验】；开一次自动修复，能明确回答「它做了什么、怎么撤销」。
- **为什么必须这一步／为什么在这个位置**：它排最后是因为它消费前面所有步骤的信号。先上自动修复再补检测，会把错误的修复动作放大——修复动作本身也需要监控覆盖，而监控在 Step 5 才建起来。

**最常被跳过的是 Step 4 依赖规范里的那一条**（把 `sleep` 换成上游就绪信号），因为它不改产出、只改等待方式，看起来没有收益。跳过之后的第一个症状出现在上游迟到的那天：下游按老时长照跑，任务全绿、告警全静、SLA 全过，只有某个数字少了当天的尾巴；这类问题的发现时间通常以天计【经验】，因为没有任何告警会响。

### 4.2 关键技术点

**Airflow + K8s Executor（`pod_override`）**

- **做法**：`airflow.cfg` 里 `executor = KubernetesExecutor`（或 Celery 集群）；用 `executor_config.pod_override` 给单个任务指定资源与镜像；用 `KubernetesPodOperator` 提交 Spark / Flink 作业。
- **机制**：因为每个 Task 跑在自己的 Pod 里，所以资源隔离与扩缩容由 K8s 承担，调度器只留状态机；代价是每个任务都要支付一次 Pod 生命周期成本（创建 / 拉镜像 / 回收）。
- **失效条件**：**当任务以秒级短任务为主时**，Pod 生命周期开销与任务数成正比、与任务计算量无关——症状是调度器本身毫无压力，但集群的 Pod 创建速率或镜像拉取成为瓶颈、任务平均排队时间上升。此时应把一批小任务合并进同一个 Pod，而不是加大调度器。
- **档位**：【经验】

**元数据库与调度器分离部署**

- **做法**：调度器多副本，元数据库独立实例 + 高可用 + 定期备份；历史任务实例按策略清理。
- **机制**：因为调度进度、DAG 解析结果与任务状态都写在元数据库里，所以它的可用性等于全链路的可用性；把它从调度器主机上挪走，容量与可用性才分别可解。
- **失效条件**：**当元数据库与调度器同机、且备份不验证时**，一次机器故障同时丢掉控制面与定义——症状是恢复后 DAG 列表比出事前少了几条，少的正好是最后一次备份之后新建或改过的那几条。
- **档位**：【经验】

**DolphinScheduler 部署（容器化安装）**

- **做法**：用官方 Helm Chart 部署（`helm install dolphinscheduler ... --set postgresql.enabled=true`），生产环境把元数据库换成独立的高可用实例，多 Master 副本。
- **机制**：DolphinScheduler 的工作流定义以数据形式存在元数据库里，所以部署形态直接决定「定义真相」的可靠性——元数据库独立部署与定期导出快照，是这套模型能在生产用的前提。
- **失效条件**：**当定义只存在于元数据库且从不导出时**，一次元数据库损坏就等于链路定义丢失——症状是恢复备份后平台里少了几天内新建的工作流，而没有任何地方能重建它们（没有文件、没有 diff）。修法：定时导出工作流定义快照入版本库。
- **档位**：【经验】

**Argo Workflows 定义与制品**

- **做法**：用 Workflow YAML 表达依赖（`dependencies` 就是边）；容器镜像 tag 固定；把容器定义抽成 WorkflowTemplate 复用；由 Argo 触发长驻服务（如 Flink 作业）而不把长驻服务本身当成一个 Workflow 步骤。
- **机制**：因为执行单位退化成 Pod，调度器只剩很薄的状态机；代价是「任务」与「镜像」被强绑定，镜像仓库成为全链路的关键依赖。
- **失效条件**：**当镜像仓库不可用或某个 tag 被覆盖时**，所有工作流同时失败，报错集中在镜像拉取——症状不是某条链路坏了，而是整个集群的编排一起停摆。
- **档位**：【经验】

**失败重试 + 告警**

- **做法**：`retries` + `retry_delay` + 指数退避；`on_failure_callback` 把失败推到钉钉 / 飞书 / Slack；把失败分类（连接超时、资源不足 → 可重试；口径异常、数据校验不过 → 需人工）。
- **机制**：因为重试的收益只对临时性故障成立，分类决定了重试是恢复手段还是告警放大器；退避则防止重试在同一时刻同时打向上游。
- **失效条件**：**当重试次数与并发叠加、且失败原因是上游被打垮时**，重试会变成重试风暴——症状是上游数据库连接数暴涨、同一批任务的告警反复刷屏，故障范围从一条链路扩到多条。
- **档位**：【经验】

**任务幂等（重跑安全）**

- **做法**：写入按分区覆盖（写前删同分区或整分区替换），或使用 upsert；把执行日期显式传给脚本；补数与重试前先做一次幂等检查。
- **机制**：因为调度器的状态恢复不提供 exactly-once，所以幂等是「重试、补数、调度器重启」三种场景的共同前提——没有它，恢复只能靠猜，而猜错的两种结果都要另花钱修。
- **失效条件**：**当任务对同一分区做 append 而不是覆盖、且被重跑时**，数据会翻倍——症状是某天行数约为平时的两倍、任务全绿无告警，指标看起来只是「涨了」。
- **档位**：【经验】

**资源隔离与补数队列**

- **做法**：用 YARN 队列 / K8s namespace + 配额划分资源池；补数走独立队列并限制并发上限；核心链路与非核心链路分池。
- **机制**：因为共用资源池时故障半径等于整个池，隔离把「一次补数拖慢全链路」变成「补数自己变慢」；代价是池子划多之后总利用率下降，配额成为常驻治理工作。
- **失效条件**：**当补数排满并超出配额时**，日常任务会因为排队而后移——症状是所有关键任务的开始时间整体后移，但没有任何单个任务变慢。
- **档位**：【经验】

**SLA / 基线（产出时刻的承诺）**

- **做法**：给关键链路定义产出时刻与责任方；持续预测预计完成时刻，在预计超过承诺时提前告警，并指出关键路径上的瓶颈任务；严重偏离时升级到责任方。
- **机制**：因为从产出时刻倒推最晚开始时刻，迟到才会在还来得及的时候暴露；代价是这条承诺只在算力可被统一调配时才兑现得了。
- **失效条件**：**当多条承诺挤在同一时间窗、而可分配资源覆盖不了它们的总时长时**，承诺退化成每天滚动升级的告警——症状是同一批基线反复告警、清单越堆越长，但没人能改，因为优先级只决定谁先被满足。
- **档位**：【经验】

**依赖判定下沉到数据（分区就绪 / 事件 / 空分区判定）**

- **做法**：关键边不由「上游任务成功」触发，改由分区就绪、文件到达或事件触发；对空分区单独判定（区分「上游还没跑」与「上游跑了但那天真的没数据」）。
- **机制**：因为任务返回码与数据可用性是两件事，所以把依赖建在数据事实上才能拦住静默错误；代价是每条关键链路都要补就绪检查，轮询本身还要占并发。
- **失效条件**：**当依赖靠轮询 Sensor 实现、且等待的分区长期迟到时**，等待会占住并发槽——症状是某些 DAG 因为拿不到槽位而排队，看起来像资源不足，实际是轮询在空转。此时应改用事件触发或就绪信号表。
- **档位**：【经验】

**编排定义的版本治理**

- **做法**：代码化 DAG 进版本库、写 DAG 单测、变更走评审；UI 类平台则定时导出定义快照入版本库、保留操作记录、变更走工单。
- **机制**：因为「定义真相在哪里」决定回滚点在哪里——有文件才有 diff 与一键回滚，只有操作记录就只能靠人复述。
- **失效条件**：**当变更规模增长到一次误改会影响多条链路时**，无版本库的定义不可治理——症状是事故复盘时没人能说出「改之前是什么」，链路越关键越没人敢动它。
- **档位**：【经验】

### 4.3 工具链与平台

下表按「类别 → 候选 → 选型判据 → 不选它的代价」给。候选括注的版本号是各项目所属的版本主线，属可外部核验的公开信息【公开】（核验入口：各项目官方发布页 / Release Notes，可按「<项目名> releases」检索）；版本线迭代很快，括注只用来区分代际，不要当版本要求用，功能边界请以官方文档当前版本为准。

| 类别 | 候选 | 选型判据（在什么约束下选哪个） | 不选它的代价 |
| --- | --- | --- | --- |
| 代码定义的通用编排 | Apache Airflow（2.9+）、Prefect（2.x）、Dagster（1.5+） | 团队以 Python 为主、链路以任务依赖为主 → Airflow；拓扑运行期才确定（按数据扇出、按结果分支）→ Prefect；核心问题是资产新鲜度与影响面 → Dagster | 不选代码定义：定义进不了版本库，回滚点只剩操作记录 |
| 可视化 / 声明式编排 | Apache DolphinScheduler（3.1+）、阿里云 DataWorks、腾讯云 WeData | 维护者以数仓 / SQL 开发为主 → DolphinScheduler（需配套定义快照入版本库）；要托管算力 + 产出时刻承诺 → DataWorks / WeData | 不选托管：调度语义与云平台绑定，换平台等于重写 DAG；不选 UI 类而不配套快照：三年后没人能回答上周改了什么 |
| K8s 原生编排 | Argo Workflows（3.5+） | 执行载体已是 K8s、任务制品已是镜像、资源隔离与扩缩要交给容器编排 | 不选它：自建 Worker 池与资源模型，隔离、配额、抢占各写一遍；反过来，秒级短任务为主时它也不划算 |
| ML / 制品编排 | KubeFlow Pipelines（2.x） | 有训练与评估流水线，要追踪制品与实验、多组参数反复跑 | 不选它：纯 ETL 场景下每一步都要包容器 + 管制品，是纯开销 |
| 资源调度层 | YARN / K8s / Mesos | 已在大数据生态 → YARN 队列；云原生 → K8s namespace + 配额 + 优先级；Mesos 属传统形态，新项目不宜再选 | 不选隔离层：一次补数拖慢全链路，故障半径等于整个资源池 |
| AI 增强 | Datadog 这类平台的异常检测能力、自研 + LLM 的自动修复、自适应调度（自动扩缩容） | 判定基准要从绝对阈值换成该作业自身的历史分布 → 异常检测；处置动作可枚举且可回滚 → 才谈自动修复；扩缩容要有明确的容量信号与上限 | 不选它：异常靠人盯告警；顺序选错（先自动修复、后检测）则会把错误修复放大 |

这一类里最容易被误选的是**把「UI DAG」与「代码化 DAG」当成同一件事的两种界面**。判据只有一句：**编排定义的真相在哪里**。在版本库里，选代码化方案成立；在元数据库里，选 UI 类方案就必须同时配套三件补偿流程——操作记录留存、定时导出定义快照入版本库、变更走工单——否则代价在三年后才结账，且结的是「没人敢动关键链路」这笔账。

### 4.4 存量迁移

**① 先做立刻见效且可回退的一件事**：挑最痛的那条链路，把它的 `sleep` 换成对上游的就绪信号（Sensor / 分区就绪检查 / 就绪信号表）。不改脚本本体、不改上游、不改产出表。产出是这条链路的显式依赖图，回退方式是把等待改回去。它为什么先做：这是唯一一处「只改等待方式就消除一整类静默错误」的地方，且不需要任何人改动业务逻辑，因此最容易拿到共识。

**② 历史资产按三类处理，不要一律返工**：

- **全部返工**：关键链路——有产出时刻承诺、被多个下游依赖、每天有人等它的结果。迁进 DAG、配幂等、配 SLA、配告警路由。这类在脚本总数里通常只占一小部分【经验】，但覆盖了绝大部分失败代价。
- **只改动的部分**：有明确 Owner、但仍只服务单一业务的「活」脚本。不主动迁，等它下一次因业务变更被改动时随那次变更一并迁——即变更陈旧，迁移成本被摊进本来就要做的改动里。
- **打标挂账**：来源不明、无人认领、无下游的定时任务。登记 Owner、产出与触发记录并采集心跳，标「未纳管」；对确认无下游的标「候选下线」，不迁移。

判据：任取一条 crontab 条目或一个旧调度作业，能说清它属于哪一类、Owner 是谁、为什么。说不清的一律先归入挂账并补 Owner，不要归入返工——后者会让它占掉核心链路的人力。

**③ 双轨怎么维持、维持多久**：新 DAG 与旧入口并存期间，把旧入口的触发停掉但配置保留（便于回退），每条链路跑一次产出对账：分区完整性与边界、行数、关键聚合值三项比对。双轨时长由「连续若干调度周期对账一致 + 未纳管清单不再增长」共同决定【经验】，不由日历决定。**不要用「新旧都跑、都写同一张表」这种方式双轨**——两套写会互相覆盖，对账比的将是谁跑得晚。

**④ 什么信号说明可以退出双轨**：三个都要满足——(a) 对账连续若干周期一致【经验】；(b) 旧入口的触发记录归零（先只读监控，再停用，最后归档配置）；(c) 把调度器杀掉重启一次，任务能从元数据库恢复且不重复写（即幂等已验证）。缺任意一条就还在双轨里，且应该把「还差哪一条」写进迁移看板，而不是凭感觉宣布完成。

**迁移期最常见的错误是一次性把上千条 crontab 全部导入**：这会让调度循环与元数据库在第一天就同时过载，而且问题会以「全局变慢」的形式出现、无法定位到具体链路。按域或按链路分批，才能让每一批的问题可归因。

### 4.5 模板 / 示例

**模板 1：完整链路 DAG（Airflow）**

```python
from airflow import DAG
from airflow.providers.cncf.kubernetes.operators.pod import KubernetesPodOperator
from airflow.sensors.external_task import ExternalTaskSensor
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import kubernetes.client.models as k8s

def notify_success(**context): ...        # 通知（钉钉 / 飞书）；webhook 写法同模板 4

with DAG("daily_data_pipeline", schedule="0 2 * * *",
         start_date=datetime(2025, 1, 1), catchup=False,
         default_args={"owner": "data-team", "retries": 3,
                       "retry_delay": timedelta(minutes=5),
                       "on_failure_callback": send_alert}) as dag:   # send_alert 见模板 4

    wait_for_orders = ExternalTaskSensor(          # 就绪信号：上游分区同步完成
        task_id="wait_for_orders", external_dag_id="mysql_cdc_to_iceberg",
        external_task_id="sync_orders", allowed_states=["success"], timeout=3600)

    ods_to_dwd = KubernetesPodOperator(
        task_id="ods_to_dwd", name="spark-ods-dwd", namespace="spark",
        image="spark:3.5", cmds=["spark-submit"],
        arguments=["--master", "k8s://https://k8s-api:443",
                   "--conf", "spark.sql.adaptive.enabled=true",
                   "local:///scripts/ods_to_dwd.py"],
        container_resources=k8s.V1ResourceRequirements(
            requests={"cpu": "4", "memory": "16Gi"}))

    dwd_to_dws = KubernetesPodOperator(
        task_id="dwd_to_dws", name="spark-dwd-dws", namespace="spark",
        image="spark:3.5", cmds=["spark-submit"],
        arguments=["local:///scripts/dwd_to_dws.py"])

    dws_to_ads = KubernetesPodOperator(
        task_id="dws_to_ads", name="flink-dws-ads", namespace="flink",
        image="flink:1.19", cmds=["flink", "run"],
        arguments=["local:///scripts/dws_to_ads.jar"])

    dq_check = KubernetesPodOperator(
        task_id="dq_check", name="dq-check", namespace="dq",
        image="python:3.10", cmds=["python", "/scripts/dq_check.py"])

    notify = PythonOperator(task_id="notify_success", python_callable=notify_success)
    wait_for_orders >> ods_to_dwd >> dwd_to_dws >> dws_to_ads >> dq_check >> notify
```

**怎么用**：填 `external_dag_id` / `external_task_id`（就绪信号由谁提供）、镜像与 namespace（执行载体）、`container_resources`（requests 与 limits 都要给）。`schedule` 是新版写法，`schedule_interval` 已在 2.x 弃用，以你所用版本的官方文档为准。`catchup=False` 表示不回补历史；要回补走 §4.1 Step 6 的补数流程，不要靠打开 `catchup`。

**模板 2：K8s Executor 的单任务资源覆盖（`pod_override`）**

```python
# airflow.cfg:  executor = KubernetesExecutor
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
import kubernetes.client.models as k8s

spark_task = SparkSubmitOperator(
    task_id="spark_task", application="/scripts/spark.py",
    conf={"spark.executor.instances": "10"},
    executor_config={"pod_override": k8s.V1Pod(spec=k8s.V1PodSpec(containers=[
        k8s.V1Container(name="base", resources=k8s.V1ResourceRequirements(
            requests={"cpu": "2", "memory": "4Gi"},
            limits={"cpu": "4", "memory": "8Gi"}))]))},
)
```

**怎么用**：这是「同一个调度器、不同任务不同资源」的落点——requests 决定调度，limits 决定上限，两者都要给（只给 limits 会让节点被超卖）。`pod_override` 里的 `base` 容器名由执行器约定，改动前请核对你所用版本的官方文档。

**模板 3：Argo Workflows（K8s 原生）**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata: {name: realtime-etl}
spec:
  entrypoint: etl-pipeline
  serviceAccountName: argo-workflow
  templates:
  - name: etl-pipeline
    dag:
      tasks:
      - {name: kafka-source,    template: kafka-consumer}
      - {name: flink-process,   dependencies: [kafka-source],  template: flink-job}
      - {name: iceberg-sink,    dependencies: [flink-process], template: iceberg-write}
      - {name: starrocks-load,  dependencies: [iceberg-sink],  template: starrocks-stream-load}
  - name: kafka-consumer
    container: {image: confluentinc/cp-kafka:7.5.0, command: [kafka-console-consumer]}
  - name: flink-job
    container: {image: flink:1.19, command: [flink, run]}
  - name: iceberg-write
    container: {image: apache/spark:3.5, command: [spark-submit]}
  - name: starrocks-stream-load
    container: {image: mysql:8.0, command: [mysql]}
```

**怎么用**：`dependencies` 就是边；镜像 tag 必须固定，不要用 `latest`，因为制品版本就是这次运行的语义。把这段抽成 WorkflowTemplate 复用，不要在每条工作流里复制容器定义。长驻服务（如 Flink 作业）不要当成一个 Workflow 步骤——Workflow 的生命周期是一次运行。

**模板 4：失败重试 + 告警（webhook）**

```python
import requests
from datetime import timedelta

def send_alert(context):
    webhook = "https://oapi.dingtalk.com/robot/send?access_token=<你的 token>"
    ti = context["task_instance"]
    requests.post(webhook, json={
        "msgtype": "markdown",
        "markdown": {"title": "任务失败告警",
                     "text": f"任务 {ti.task_id} 失败\n日志：{ti.log_url}"}})

default_args = {
    "retries": 3,                          # 次数按故障分布定，不要照抄
    "retry_delay": timedelta(minutes=5),
    "retry_exponential_backoff": True,     # 退避，避免重试风暴
    "on_failure_callback": send_alert,
}
```

**怎么用**：`retries` 与 `retry_delay` 是可调量。连通性类故障配重试，数据口径类故障不配重试——重试只会重复失败并刷告警；这个划分要写进 §4.1 Step 4 的规范，否则每个 DAG 各写一套。

**模板 5：补数与重跑（Airflow CLI）**

```bash
# 补一段分区：对指定 DAG 的日期区间重跑
airflow dags backfill --start-date 2025-01-01 --end-date 2025-01-15 daily_etl

# 单任务重跑（不重跑整条链）——前提是该任务幂等
airflow tasks run daily_etl ods_to_dwd 2025-01-15
```

**怎么用**：补数必须与「独立队列 + 幂等」配套（§4.2 的两条对应技术点），否则一次补数会同时污染产出与资源池。子命令与参数名随版本演进，请以所用版本的官方 CLI 文档为准。

**模板 6：AI 异常检测（作业时长 / 指标异常）**

```python
import pandas as pd
from sklearn.ensemble import IsolationForest

history = pd.read_parquet("s3://lake/job_metrics/history/")   # 该作业的历史分布
current = pd.read_parquet("s3://lake/job_metrics/current/")   # 本轮执行的指标

model = IsolationForest(contamination=0.1).fit(history)
if (model.predict(current) == -1).any():
    send_alert(...)                                           # 异常 → 告警（实现见模板 4）
```

**怎么用**：`history` 必须按「同一作业 + 同一时段 + 相近数据量」取样，否则模型学到的是日 / 周节律而不是异常；`contamination` 是预期异常比例，直接决定告警量，需按自身误报率调。一条界限：分位数（P50 / P95）就能覆盖大部分判定需求，模型（如本示例的 Isolation Forest 一类）的边际增益主要出现在作业形态频繁变动、或需要多协变量联合判断时（见 [§ 5.2.1](12-scheduler-section-5-ai.md)）。

### 4.6 自检清单

模式层的自检（依赖画在哪一层、重试退避、资源池隔离、产出基线、单点与恢复）见 [§ 3.7](12-scheduler-section-3-sec3.md)，本节只列工程执行层的检查——步骤顺序、产物、存量迁移与双轨退出。

1. 选型报告能否一次答出「编排定义放在哪、依赖判定在哪一层、执行载体是谁、存量怎么过来」这四件事？只写了工具对比的，说明选型还停在产品比价，后面每一步都要回头改它。
2. 动手验两件事：手动删掉上游产出的一个分区，下游是停下报错、还是照常跑完（照常跑完说明依赖判定还在任务层）？同一分区重跑两次，产出表的行数与关键聚合值是否一致（不一致说明任务不幂等，补数与重试都不可用）？
3. 纳管清单里每条链路是否填满了 Owner、产出表与分区、产出时刻、是否幂等、是否有下游这五列，且未纳管挂账清单不再增长？有空列、或清单还在涨，说明 Step 3 没走完就进了 Step 4。
4. 静态检查脚本是否已挂进 CI——抽 3 个存量 DAG，违规项能否由脚本自动列出？要靠人评审才发现，说明 Step 4 的规范还没落在代码层。
5. 任取一条 crontab 条目或一个旧调度作业，能否说清它属于「全部返工 / 只改动的部分 / 打标挂账」哪一类、Owner 是谁、为什么？说不清的一律先归挂账，不要归入返工。
6. 双轨退出的三条件是否都满足——(a) 产出对账连续若干周期一致、(b) 旧入口触发记录归零（先只读监控、再停用、最后归档配置）、(c) 杀掉调度器再拉起能从元数据库恢复且不重复写？缺哪条就还在双轨里，要把差的那条写进迁移看板；也注意双轨期**不要**用「新旧都跑、都写同一张表」的方式，两套写会互相覆盖，对账比的将是谁跑得晚。
7. 生产 DAG 的 `catchup` 是否为 True？是，则误改 `start_date` 会瞬间产生大量 DAG Run。
8. 选的是 UI 类编排平台（DolphinScheduler / DataWorks 这类定义落在元数据库的方案）吗？若是，三件配套是否都已到位——操作记录留存、定时导出定义快照入版本库、变更走工单？缺任意一件，代价要到几年后才结账。
9. 异常检测的判定基准是绝对阈值还是该作业自身的历史分布？是绝对阈值，则作业时长自然增长会持续误报。

### 4.7 小结

> 本节小结：整个落地过程里唯一决定成败的环节是 **依赖判定建立在哪一层事实上**（§4.1 Step 4 的依赖规范与 §4.2 的「依赖判定下沉到数据」）。它比选哪个调度器、集群怎么部署都更前置：调度器选错只是不方便，依赖层次选错则会让错误静默传播——任务全绿、告警全静、数字却是错的，且发现时间以天计。§4.2 里的幂等、补数队列、SLA、异常检测四条，全部建立在「图上能看到真实依赖」这个前提上，前提不成立时它们只是在给一份错的图做更精细的运维。
>
> 配合 [§ 2 核心原理](12-scheduler.md)、[§ 3 设计模式与范式](12-scheduler-section-3-sec3.md) 与 [§ 6 落地实践](12-scheduler-section-6-sec6.md) 阅读。
