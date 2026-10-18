> 本文件是 **04-anchor-modeling.md** 的子文件（§4. 工程实现）。本节讲怎么把 [§ 3](04-anchor-modeling-section-3-sec3.md) 里的模式装进一个真实组织：顺序、判据、产物与存量迁移。完整章节请回到 [index](04-anchor-modeling.md)。

## 4. 工程实现

本节按「落地步骤 → 关键技术点 → 工具链 → 存量迁移 → 模板 → 自检」组织。术语与主文件 [§ 2 核心原理](04-anchor-modeling.md) 逐字一致：**Anchor / Attribute / Tie / Knot** 四件套、**业务时态（`valid_from` / `valid_to`）**、**加载时态（`loaded_at`）**、**反规范化视图**、**类型演化**，在本节里指的就是主文件 §2 与 [§3](04-anchor-modeling-section-3-sec3.md) 里那几个结构，不另立口径。模式被什么约束逼出来、代价落在哪一侧，见 §3，本节不重复。

读者分两类，本节都覆盖。**从零搭建**（新开一个域，没有历史包袱）直接按 4.1 的六步往下走，4.4 可以略读。**在存量上改造**（已经有 3NF 宽表或 Kimball 星型，已经有下游查询挂在上面）建议先读 4.4 再回 4.1 —— 两类读者的第一步不同：从零搭的人先做业务盘点，存量改造的人先做**域选择**（挑哪一块先动），因为存量改造最贵的成本不是建表，而是把已经交付出去的下游查询收回来重新指向。

### 4.1 落地步骤（六步，顺序不能换）

**Step 1：业务盘点 → 实体 / 属性 / 关系三张清单（2–6 周【经验：随源系统数与实体数变，跨部门取数越难越长】）**

1. 梳理所有源系统，列出业务实体，产出 **Entity Inventory（实体清单）**。
2. 对每个实体列出它的所有属性，按「变化频率 + 业务主题 + 是否共享」分组，产出 **Attribute Matrix（属性矩阵）**。
3. 梳理实体之间的关系，产出 **Relationship Matrix（关系矩阵）**。
4. 存量改造额外做一件事：把该域现有的下游查询与报表清单拉出来，标注每条查询读了哪几张表 —— 这份清单是 4.4 的输入，也是退出双轨时的验收依据。

- **产物**：三张清单（Entity / Attribute / Relationship Matrix）；存量改造再加一份下游消费清单。
- **判据**：随机挑 3 个属性【经验：随实体数与属性数变，属性总数少于 3 个时全查】，问业务方「它上一次变是什么时候、以后大概多久变一次」，答不上来的属性说明分组依据（变化频率）没有来源，必须标为待定而不是由建模方猜。
- **为什么必须第一步**：§3.8 把模式选择的唯一约束归为「属性之间的变化频率是否同质」（§3.2.1 的约束段同义），落到判据上就是 §3.3 决策表首行那句「变化频率是否相差 ≥ 一个数量级」——而这个频率只能从业务方问出来，看不出在表结构里。三张清单缺任何一张，Step 4 的分表粒度就只能按字段类型拍板 —— 而按字段类型拆，正是 §3.5「过度拆分」的成因。

**Step 2：设计 Anchor（1–2 周【经验：随实体数与是否要跨源合并 ID 变，涉及合并且要新增对齐表时取上限】）**

1. 从实体清单里挑出真正的业务实体（有独立身份、会被别的实体引用的东西），每个建一张 Anchor 表，只含 ID、`metadata`、`created_at`。
2. 定 ID 的生成方式并写进建模规范 —— 这一条挂在 Anchor 上比挂在任何别的地方都重要，理由见 4.2「Anchor DDL 规范」。
3. 存量改造：实体清单与现有 3NF 主表 / Kimball 维度表逐一对表，做一张「源表 → Anchor」映射表；两个源的同一实体要合并时，先把 ID 对齐口径写下来。

- **产物**：Anchor DDL + 源表到 Anchor 的映射表。
- **判据**：抽 3 张源表【经验：随源系统数变，源系统少于 3 个时全查】，看它们的业务主键是否都出现在映射表里；再看 Anchor 表里有没有混进业务属性列 —— 出现第二个业务列即已偏离「Anchor 只含 ID」。
- **为什么必须排在 Attribute / Tie 之前**：Attribute 与 Tie 的外键都指向 Anchor，而 Anchor 的粒度一旦发出就固化在 ID 空间里，改粒度等于重建整块域（§3.2.5 的失效点）。所以这一步的评审点是 **ID 稳定性**，不是表结构好不好看。

**Step 3：设计 Knot（数天到 1–2 周【经验：随枚举数量与引用方个数变，取值集合需要中央治理协商时取上限】）**

1. 从属性矩阵里挑出「被两个以上位置共享、且取值集合由中央治理」的查找（国家、币种、状态码），建 Knot 表。
2. 逐个核对引用方数量：只有一处引用的枚举不建 Knot，直接落在 Attribute 的值里。

- **产物**：Knot DDL + 每张 Knot 的引用方清单。
- **判据**：数每张 Knot 的引用方个数；出现只有 1 个引用方的 Knot，就是 §3.5 的「Knot 过度共享」，合并回 Attribute 值。
- **为什么必须排在 Attribute 之前**：Attribute 与 Tie 通过外键引用 Knot，先建 Attribute 再回头抽 Knot，等于回头修改一批已经装载了历史行的表 —— 而历史行一旦带上了字符串取值，再拆出去要重新对齐。

**Step 4：设计 Attribute 与 Tie（2–4 周【经验：随属性数与关系数变，两个数之和越大越长】）**

1. Attribute：从属性矩阵里把**高频变化**的属性各建一张表；**低频变化**的可以合并进一张 `*_simple_attrs` 表。
2. Tie：从关系矩阵里逐个建 Tie 表；动手前先按 §3.3 的决策表判断这个关系属于「多值属性」还是「时态分组」——两者结构相似、语义相反，误判的代价落在数据语义上。
3. 每张 Attribute / Tie 都带三组时态列（业务起、业务止、加载时）。缺 `loaded_at` 即无法承载晚到真相，后面补要重刷历史。

- **产物**：Attribute DDL（含合并表）+ Tie DDL，两套都带三组时态。
- **判据**：抽 3 张 Attribute 表【经验：随表数变，表数少于 3 张时全查】，看每张是不是只有一个业务列；再抽 3 张 Tie 表【经验：同前，随 Tie 表数变】，看有没有把业务属性列写进去 —— Tie 的列应当只有参与方 Anchor ID、三组时态与来源列，出现业务属性列即为误建。
- **为什么必须在反规范化视图之前**：视图的 JOIN 列表来自 Attribute 与 Tie。这两层没定稿，视图就要跟着改；而视图一旦被下游引用，改它要走影响面流程，成本远高于此刻多开一次评审。

**Step 5：设计反规范化视图（1–2 周【经验：随消费场景数与物化对象数变，下游越多越长】，之后长期维护）**

1. 为下游消费场景建视图：按 `valid_to IS NULL` 拼当前有效行，得到「当前客户全貌」一类视图。
2. 为需要任意时点的场景建时态切片视图（固定时点的 `v_customer_at_...`，或做成带参数的版本）。
3. 对高频访问的切片做物化，其余保持普通视图；视图定义随属性增长要重新生成而不是手改。

- **产物**：视图 / 物化视图 DDL + 一份「哪个下游读哪张视图」的登记表。
- **判据**：让每个下游按视图跑一遍真实查询并压测；再看视图定义里 JOIN 的数量 —— 一张 N 属性的实体全貌视图就有 N 个 `LEFT JOIN`【推算：属性数 N × 每属性一次 LEFT JOIN】，N 到几十以上时【经验：随查询引擎与消费方式变，BI 直连场景比明细探查更早需要拆】，必须拆成面向具体消费场景的多张视图，而不是一张通用全貌视图。
- **为什么必须这一步（本节最常被跳过的一步）**：交付底表不等于交付模型。跳过后最常出现的信号不是某个查询变慢的告警，而是消费方直接来要一张「客户全貌的表」——BI 接入或特征工程取数时，他们会自己从底表抽出宽表副本。到这个时点再补视图，已经不只是加一层 SQL，而是要说服一个已经跑起来的副本改回来看你的视图（成因与三个最危险反模式见 §3.5）。

**Step 6：加载流水线（2–4 周【经验：随源系统数与装载工具是否现成变，从零写 CDC 时取上限】，之后长期运行）**

1. Stage → Anchor / Attribute / Tie / Knot 的装载链路，按 Step 4 定稿的主键做幂等写入。
2. 并行加载：Attribute 与 Tie 互不依赖，可并行；Anchor 必须先行（外键指向它）。
3. Bitemporal CDC：四段 —— 新增 Anchor → 新增 / 更新 Attribute（旧行闭段）→ 新增 / 更新 Tie（旧行闭段）；「插入新版本 + 关闭旧版本」的成对动作必须落在同一个事务里，模板见 4.5。
4. 建对账任务：每批次结束时比对「stage 行数」与「落库版本数」，差异报警。

- **产物**：可重跑的装载任务 + 每批次的对账报告。
- **判据**：把同一批次重跑一次，落库行数应当不变（幂等）；对账报告里出现「某实体零个当前有效行」或 `loaded_at` 为空，即为缺陷。
- **为什么必须最后**：装载依赖前五步定稿的表结构与主键，结构未定就写装载，改一次结构就要重写一次装载逻辑，而且已装载的历史行还要参与返工。

六步里最常被跳过的是 **Step 5 反规范化视图**。它与 Step 1 的下游清单互为因果：没拉清单的团队，也不知道视图该给谁。

### 4.2 关键技术点

**Anchor DDL 规范**

- **做法**：Anchor 表只有 `id`（序列或自增）、`metadata`（可选 JSONB）、`created_at`；业务属性一律不落在这里。DDL 见 4.5 模板 1。
- **机制**：因为 Anchor 只回答「存在这么一个实体」，所以**加一个业务字段永远不需要碰它**（主文件 §2.3.1）；又因为它只在装载新实体时写一次，它为后面所有 Attribute / Tie 提供了稳定的外键锚点 —— 这是那些表能各自独立演化的前提。
- **失效条件**：**当 ID 由数据库自增生成、而装载要在两个域或多个源之间合并同一实体时，这条会坏在两处 ID 空间无法对齐上**。症状不是装载报错，而是跨域报表里「客户数偏多」，且两个 ID 各自都有自己的属性历史，没人能判断哪一份是重复的。修法是在 Step 2 就把 ID 生成方式写成规范（全局分配 + 兼并对齐表），而不是留到合并期补。
- **档位**：【经验】（随源系统是否多源、是否允许合并而变）。

**Attribute DDL 规范（bitemporal）**

- **做法**：每张 Attribute 表 = Anchor ID + 一个业务属性 + `valid_from` / `valid_to` / `loaded_at`（可选 `deleted_at`）+ `source_system` / `source`；主键 `(id, valid_from, loaded_at)`；低频属性合并进一张 `*_simple_attrs` 表。DDL 见 4.5 模板 1。
- **机制**：因为主键里同时含 `valid_from` 与 `loaded_at`，**同一条业务事实在不同加载批次下的两次认知可以并存**，晚到真相不需要覆盖历史（主文件 §2.2.2）——这是 Anchor 能同时回答「业务何时发生」与「系统何时知道」的物理依据。
- **失效条件**：**当装载用行级 `now()` 取 `loaded_at` 且批次允许重跑时，这条会坏成「重跑不幂等」**：同一个业务事实被记成两个版本，行数随重跑次数增长。症状是对账时「版本行数大于业务事件数」，差额恰好等于重跑次数。修法：`loaded_at` 由调度传入批次开始时刻，而不是行级取当前时间；重跑写入同一个 `loaded_at`，让主键冲突吃掉重复行。
- **档位**：【经验】。

**Tie DDL 规范**

- **做法**：Tie 表 = 两个（或多个）参与方 Anchor ID + 三组时态 + 来源列；主键含参与方 ID、`valid_from`、`loaded_at`；不写业务属性。DDL 见 4.5 模板 1。
- **机制**：因为关系以「一行一次变化」落库，装载每天必须先与当前有效行比对，只对真正变化的关系闭段加新增 —— 于是每天的写入量取决于**当天实际发生的关系变更数**，而不是上游快照的大小。这条是运行期的负载前提；关系边本身为什么这么设计，见 [§ 3.2.2](04-anchor-modeling-section-3-sec3.md)。
- **失效条件**：**当上游按全量快照每天重推、而 Tie 装载没有先与当前有效行比对时，这条会坏成行数按天增长**：没变化的关系每天也被写一行新版本。症状是装载耗时不跟着当天的变更数走，而是跟着 stage 快照大小走，值班在监控上看到的是一条斜率恒定的表增长直线，而不是随业务波动的锯齿。修法：装载先比对值，只在真正变化时闭段 + 新增。
- **档位**：【经验】。

**Knot DDL 规范**

- **做法**：Knot 表 = `id` + `code`（唯一）+ 名称与描述，如 `knot_currency` / `knot_order_status`；Attribute / Tie 存 `*_knot_id` 外键而不是字符串。
- **机制**：因为名称只是 Knot 表上的一列、`code` 是它唯一的业务键，一次改名落在**一次单行 UPDATE** 上，而不再是一轮跨表的字符串替换 —— 实施期的收益在这里才显形：改名的执行点从「引用这张字典的每一张表」收敛到一处，于是它有了唯一的评审点与唯一的通知名单，引用方有几个只决定要通知谁，不决定要改几处。
- **失效条件**：**当 Knot 的取值被物理删除、或 `code` 被复用（同一个 code 换了含义）时，这条会坏在历史行的含义被追溯性改写上**：历史 Attribute 行仍指向那个 ID，而 ID 现在的含义已经不是当初那个。症状要到一次审计回放或口径对账才出现，届时无法从数据本身判断哪个含义才是「当时的」。修法：Knot 只软删除（加 `retired_at`），`code` 永不复用，含义变化就产生新 code。
- **档位**：【经验】。

**Bitemporal CDC**

- **做法**：四段式 —— ① 新增 Anchor（`NOT EXISTS` 保护）；② 新增 / 更新 Attribute（`ON CONFLICT DO NOTHING` 或 `MERGE`）；③ 旧 Attribute 闭段（`valid_to = 批次时刻`）；④ 新增 / 更新 Tie（与 ②③ 同构：先闭段，再插入新版本）。②③ 与 ④ 的成对动作各放一个事务里。伪代码见 4.5 模板 2。
- **机制**：因为「插入新版本」与「关闭旧版本」必须在同一时刻对读侧可见，事务边界决定了读者不会撞见「零个当前有效行」的中间态 —— 而视图靠 `valid_to IS NULL` 取当前值，撞上一次，某个实体的某个属性在视图里就变成 NULL。
- **失效条件**：**当同一个业务键在同一个 stage 批次里出现两行（源系统把两次变更一起推来）时，这条会坏在闭段语句上**：`UPDATE ... SET valid_to = :batch_time WHERE valid_to IS NULL` 会把刚插入的那一行也一起关掉，读侧看到一个「有历史、没有当前值」的实体。症状是消费方来问「这个人为什么没有姓名」，而底表里明明有数据。修法：装前在 stage 内按业务键折叠（只留最后一条），或让闭段条件排除本批次的 `loaded_at`。
- **档位**：【经验】。

**反规范化视图**

- **做法**：按消费场景建视图（当前全貌 / 时态切片）；挂时态表的 `LEFT JOIN` 都带 `valid_to IS NULL` 或时间区间条件，挂 Knot 的按 `*_knot_id` 直连（Knot 本身没有时态列）；高频切片物化并暴露物化时间。脚本见 4.5 模板 3。
- **机制**：因为底表是 6NF，视图层是唯一能把 N 次索引查找收敛成一次交付的地方，物化则把这份成本从查询期挪到刷新期 —— 只有这两层存在，底表的写入收益才不会被读侧抵消（组合形态见 §3.4 组合三）。
- **失效条件**：**当物化刷新窗口与上游装载窗口重叠、两者争抢同一批计算资源时，这条会坏在刷新超时上**：值班最先看到的是刷新任务超时告警，而不是查询变慢；随后下游拿到上一轮的陈旧数据，而没有任何一处标出它的新鲜度。修法：刷新排到装载之后并留出缓冲；视图里带物化时间列，让消费方自己看到自己拿到的是几点的数据。
- **档位**：【经验】。

**类型演化**

- **做法**：新建 `*_v2` 表承载新类型；旧表把 `valid_to IS NULL` 的行闭段并保留为历史；下游改 JOIN 新表；「哪张是当前有效的」这份知识写进视图层或元数据（算法见主文件 §2.3.5）。
- **机制**：因为新旧类型各占一张表、旧行不被就地转换，**回滚只需把下游指回旧表**，不存在「转了一半」的中间状态，也不需要停机窗口。
- **失效条件**：**当同一属性的演化进行到第三次以上、而「哪张是当前有效的」只存在于文档或人的记忆里时，这条会坏在各下游各自缝合上**：每个消费方自己写 UNION 再按时间取最新，各自的边界条件不同，于是同一个人在不同报表里有不同的年龄，而两份都不算「错」。修法按下游逐个推进，不要一次全量切换：先把「当前有效」这份知识的归属定下来（放在哪一层，选型判据见 [§ 3.6](04-anchor-modeling-section-3-sec3.md)），再让下游一个一个改指过去，每迁一个就在工单里记下它实际用到的时间边界 —— 边界不一致的问题一次全量切换会在同一时刻集中爆发，逐个迁则每次只暴露一个下游的口径。修法带多少工时，取决于这份边界要不要先补一次历史回刷。
- **档位**：【经验】。

### 4.3 工具链与平台

选型会上最常见的比法是「谁生成的表更规范」。对本主题而言这个比法是错的：底表生成是六步里最便宜的一步，**真正的判据是候选工具能不能把读侧交付物一并生成出来**。

| 类别 | 候选 | 选型判据（在什么约束下选哪个） | 不选它的代价 |
| --- | --- | --- | --- |
| 模型驱动的生成器（开源） | anchor_modeling（Ruby）、anchor-python（Python）、dbt + anchor | 判据只有一条：它能否把「DDL + 反规范化视图 + 语义声明」一并生成。只生成底表的生成器，把组合形态里最贵的那一层留给了你 | 视图层要手写、且随属性增长持续重写，读侧交付无人承接（§3.5 银弹反模式） |
| 商业建模 / ETL 生成器 | SQLBDM | 同上的判据，再叠加三项：多源 CDC、增量装载、幂等重跑是否内置 | 许可费只买到底表，读侧再付一次人力 |
| 底表载体（关系库 / 湖仓） | PostgreSQL、Snowflake、Databricks（Delta Lake / Iceberg） | 判据是「按主键 upsert 的成本」与「物化 / 增量刷新是否原生」。关系库上是就地建表 + 物化视图；湖仓上是每个 Attribute 一张表 + 时间旅行 | 用不支持低成本 upsert 的存储装 Anchor → 每次闭段都退化成全表重写 |
| 流式 / 嵌入式引擎（做实时切片） | Materialize、RisingWave、DuckDB | 判据不落在「它是不是 Anchor 工具」，而落在「它能否承受逐属性闭段的写入与幂等重放，视图能否增量维护」 | 写入放大到不可承受，或被迫把 Anchor 降级成宽表 |
| 云上托管平台 | 阿里云 DataWorks、Snowflake、Databricks | 判据是「模型定义能否作为代码纳管（版本、评审、回滚）」+ 「是否允许约定下游只读视图」 | 平台只给调度不给模型纳管 → 结构变更又回到改表的节奏 |

候选清单里的生成器与商业工具，请以其官方文档当前版本是否提供「从模型定义生成 DDL 与视图（含语义声明）」为准自行核验；本书不对各家当前的功能边界作断言。

同一批候选按约束重推，得到的是四种组合：

| 场景 | 推荐组合 | 这个组合成立的前提 |
| --- | --- | --- |
| 传统金融 / 强合规 | PostgreSQL + anchor_modeling gem + Ruby ETL | 单库体量能被垂直扩展吸收；团队接受 Ruby 生态 |
| 云原生 / 实时 | RisingWave + Anchor + dbt + OpenMetadata | 逐属性闭段的写入量能被流引擎吸收 |
| 湖仓 | Databricks + Delta Lake + Anchor + dbt | 每个 Attribute 一张表带来的小文件问题有 compaction 兜住 |
| 国产化 | 阿里云 DataWorks + 自研 Anchor 模板 | 自研模板必须能生成视图层，否则读侧照样无人交付 |

这一类里最容易被误选的是**生成器**：它在演示时最直观，而它的短板要到第一个「拉全貌」的消费方出现时才暴露。误选的后果不是报错，而是二期 —— 下游等不到视图层，自己从底表抽宽表副本，此后模型仍在维护却不再被消费。把判据落成一句可当场执行的话：**让候选工具当场生成一次「当前客户全貌」视图**；生成不出来的，无论它生成底表多规范，都要把视图层的工时算进预算。

### 4.4 存量迁移

存量改造的目标不是「把现有表改成 Anchor」，而是在不影响现有下游的前提下，让一个域先获得逐属性演化与逐属性时态。四件事按顺序做。

**① 先做什么：选一个域，只抽 3–5 个属性。** 抽几个是【经验：随该域属性数与下游数量变，宁少勿多 —— 第一轮的目标是跑通链路，不是覆盖字段】。

选域判据是两条同时满足：属性变化频率最高，且下游消费方最少（【经验：≤3 个，越多改造期越长】）。做法是新建 Anchor（复用现有主键的映射）、把这几个属性各建 Attribute 表，然后建一张与现有宽表**同名同列**的视图。

这样做的效果是**可回退且立刻见效**：下游一行代码不改，视图指回原表即完全回退；而建模方从第一天起就拿到了逐属性时态。选域这一步不要跳 —— 拿下游最多的那个域开刀，等于把一次技术改造和一次全量回归绑在一起。

**② 历史资产怎么分类处理。** 四类，判据如下：

| 类别 | 判据 | 处理 |
| --- | --- | --- |
| 全部返工 | 属性变化频率高 + 下游少 + 有合规时态要求 | 迁到 Attribute 表，补逐属性时态 |
| 只改动的部分 | 属性稳定但类型会演化，或只需保留最近一段历史 | 保持原表不动，在下次变更时改用「加新表 + 旧表闭段」 |
| 打标挂账 | 字段稳定、无时态要求、有下游在读 | 不动，在目录里标注「未纳入 Anchor 域」并指定 Owner |
| 不动 | 无上游无下游的孤立表 | 不迁，但在目录里记为「未纳入」，避免下次盘点重新讨论一遍 |

**③ 双轨怎么维持、维持多久。**

双轨期间原宽表仍是事实来源（供现有下游），Anchor 侧由 CDC 增量同步；两侧每天跑一次对账：行数、以及 3 个关键属性的抽样比对（【经验：抽 3 个属性，抽多了对账本身会变成负担】）。时长以**域**为单位，【经验：通常 1–2 个季度，随下游数量与改造排期变】。

双轨期必须写死一条规则：**新增的门禁 / 校验只读 Anchor 侧**，两侧都判定会让同一次变更得到两个结论。

**④ 什么信号说明可以退出双轨。**

- 原宽表的查询量降到接近零（按查询日志统计，【经验：连续 2 周无写入型依赖】）；
- 对账连续两轮无差异；
- 视图侧至少完成过一次真实的时态查询用例（业务方用它回答了「当时的值是什么」），而不只是「能查」；
- 反向演练：把原宽表设为只读一天【经验：随下游数量与可接受的回归窗口变，宁可选在业务低谷日】（或收回写权限），没有告警。

四条里最后一条最容易被省，但它才是真正证明「没有人还在依赖旧结构」的那条证据。

### 4.5 模板 / 示例

**模板 1：完整 Anchor Modeling DDL（示例 1）**

```sql
-- Anchor
CREATE TABLE customer (
    id BIGSERIAL PRIMARY KEY, metadata JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Attribute：高频变化字段独立成表
CREATE TABLE customer_name (
    customer_id   BIGINT NOT NULL,
    value         VARCHAR(100) NOT NULL,
    valid_from    TIMESTAMPTZ NOT NULL,
    valid_to      TIMESTAMPTZ,
    loaded_at     TIMESTAMPTZ NOT NULL,
    deleted_at    TIMESTAMPTZ,          -- 可选：只在需要区分「删了」与「改了」时保留
    source_system VARCHAR(50) NOT NULL,
    PRIMARY KEY (customer_id, valid_from, loaded_at),
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);
-- Attribute：低频变化字段合并进一张表
CREATE TABLE customer_simple_attrs (
    customer_id BIGINT NOT NULL,
    gender      CHAR(1),
    birthday    DATE,
    valid_from  TIMESTAMPTZ NOT NULL,
    valid_to    TIMESTAMPTZ,
    loaded_at   TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (customer_id, valid_from, loaded_at),
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);
-- Knot
CREATE TABLE knot_currency (
    id BIGSERIAL PRIMARY KEY, code CHAR(3) NOT NULL UNIQUE, name VARCHAR(50) NOT NULL, symbol VARCHAR(5)
);
-- Knot：订单状态（形态同 knot_currency，Attribute / Tie 以 *_knot_id 引用）
CREATE TABLE knot_order_status (
    id BIGSERIAL PRIMARY KEY, code VARCHAR(20) NOT NULL UNIQUE, name VARCHAR(50) NOT NULL
);
-- Anchor
CREATE TABLE "order" (
    id BIGSERIAL PRIMARY KEY, metadata JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Tie
CREATE TABLE customer_order_tie (
    customer_id   BIGINT NOT NULL,
    order_id      BIGINT NOT NULL,
    valid_from    TIMESTAMPTZ NOT NULL,
    valid_to      TIMESTAMPTZ,
    loaded_at     TIMESTAMPTZ NOT NULL,
    source_system VARCHAR(50) NOT NULL,
    PRIMARY KEY (customer_id, order_id, valid_from, loaded_at),
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (order_id) REFERENCES "order"(id)
);
-- Attribute：订单金额（引用 Knot）
CREATE TABLE order_amount (
    order_id         BIGINT NOT NULL,
    value            DECIMAL(18,2) NOT NULL,
    currency_knot_id BIGINT NOT NULL,
    valid_from       TIMESTAMPTZ NOT NULL,
    valid_to         TIMESTAMPTZ,
    loaded_at        TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (order_id) REFERENCES "order"(id),
    FOREIGN KEY (currency_knot_id) REFERENCES knot_currency(id)
);
```

**怎么用**：照抄结构与主键，但**时态列一律用带时区的 `TIMESTAMPTZ`** —— 用无时区的 `TIMESTAMP` 时，跨时区装载会把同一个 `valid_from` 解释成两个不同的时刻，而这类错误只在跨区域对账时才现形。四处不要照抄：`BIGSERIAL` 换成你所在库的等价写法、`metadata JSONB` 按需删掉、`deleted_at` 这一可选列只在需要区分「删了」与「改了」时保留（不留就连它的判定逻辑一起删）、`source_system` 一列如果上游只有单一来源可以省（Anchor / Attribute / Tie 三处一起省）。**最容易照抄踩中的是 ID 生成方式**：模板里两张 Anchor 表的主键都用 `BIGSERIAL`，这只在「一个域一套 ID 空间」时成立；一旦装载要在两个域或多个源之间合并同一实体，两段自增序列无法对齐，症状是跨域报表里客户数偏多（失效条件见 4.2「Anchor DDL 规范」）。这种情形下要换成全局分配 + 兼并对齐表，并在 Step 2 就写进规范。

**模板 2：Bitemporal CDC 装载（四段式）**

```sql
-- ① 新增 Anchor
INSERT INTO customer (id, metadata, created_at)
SELECT stage.customer_id, stage.metadata, :batch_time
FROM   stage_customer stage
WHERE  NOT EXISTS (SELECT 1 FROM customer c WHERE c.id = stage.customer_id);

-- ② 新增 Attribute 新版本
INSERT INTO customer_name (customer_id, value, valid_from, valid_to, loaded_at, source_system)
SELECT stage.customer_id, stage.name,
       COALESCE(stage.effective_from, :batch_time),   -- 业务时态
       NULL,                                          -- 当前有效
       :batch_time,                                   -- 加载时态，由调度传入
       stage.source_system
FROM   stage_customer stage
WHERE  stage.op IN ('c', 'u')
ON CONFLICT (customer_id, valid_from, loaded_at) DO NOTHING;

-- ③ 旧版本闭段（排除本批次刚写入的行）
UPDATE customer_name
SET    valid_to = :batch_time
WHERE  customer_id = :customer_id
  AND  valid_to IS NULL
  AND  loaded_at < :batch_time;

-- ④ 新增 Tie（与 ②③ 同构：先闭段，再插入新版本）
UPDATE customer_order_tie SET valid_to = :batch_time
WHERE  customer_id = :customer_id AND order_id = :order_id AND valid_to IS NULL AND loaded_at < :batch_time;
INSERT INTO customer_order_tie (customer_id, order_id, valid_from, valid_to, loaded_at, source_system)
SELECT stage.customer_id, stage.order_id, COALESCE(stage.effective_from, :batch_time), NULL, :batch_time, stage.source_system
FROM   stage_order stage WHERE stage.op IN ('c', 'u')
ON CONFLICT (customer_id, order_id, valid_from, loaded_at) DO NOTHING;
```

**怎么用**：②③ 与 ④ 的成对动作各放进一个事务。`:batch_time` 必须由调度传入，**不要用 `now()`** —— 这是重跑幂等与闭段正确性的共同前提。③ 与 ④ 的 `loaded_at < :batch_time` 条件都不能省，它就是 4.2「Bitemporal CDC」那条失效条件的修法：同一个业务键在批次里出现两行时，靠它才不会把刚插入的那一行也一起关掉。

**模板 3：反规范化视图（当前全貌 + 时态切片）**

```sql
-- 当前客户全貌（含 Knot 引用的属性）
CREATE VIEW v_current_customer AS
SELECT c.id AS customer_id, cn.value AS name, csa.gender, csa.birthday,
       cp.value AS phone, kpt.code AS phone_type, cv.value AS vip_level
FROM   customer c
LEFT JOIN customer_name cn          ON cn.customer_id = c.id AND cn.valid_to IS NULL
LEFT JOIN customer_simple_attrs csa ON csa.customer_id = c.id AND csa.valid_to IS NULL
LEFT JOIN customer_phone cp         ON cp.customer_id = c.id AND cp.valid_to IS NULL
LEFT JOIN knot_phone_type kpt       ON kpt.id = cp.phone_type_knot_id
LEFT JOIN customer_vip_level cv     ON cv.customer_id = c.id AND cv.valid_to IS NULL;

-- 时态切片：业务时点 + 加载时点
CREATE VIEW v_customer_at AS
SELECT c.id AS customer_id, cn.value AS name, cn.valid_from, cn.loaded_at
FROM   customer c
JOIN   customer_name cn ON cn.customer_id = c.id
WHERE  cn.valid_from <= :business_date
  AND (cn.valid_to > :business_date OR cn.valid_to IS NULL)
  AND  cn.loaded_at <= :loaded_at;
```

**怎么用**：填 `:business_date` 与 `:loaded_at` 这两个参数，其余不要改。`customer_phone` / `knot_phone_type` / `customer_vip_level` 按模板 1 的同构形态建表（模板 1 只展开了客户与订单这两侧的几张表），保留它们是为了演示 `knot_phone_type` 那一行的形态：**Knot 引用的属性也要进视图，且取的是 Knot 的 `code` 而不是字符串值** —— 字典改名时视图一行都不用动。删掉 `loaded_at <= :loaded_at` 这一段，查询就退化成「按业务时态看当前版本」，也就答不了「系统在那天知道的是什么」—— 这正是 bitemporal 与普通拉链表的差别所在。

**模板 4：Bitemporal 查询（带上具体时点的一次真实回放）**

```sql
-- 业务时点 2020-01-01 + 加载时点 2020-01-15 下，客户「张三」的姓名
SELECT cn.value, cn.valid_from, cn.valid_to, cn.loaded_at
FROM   customer_name cn
JOIN   (SELECT id FROM customer WHERE metadata->>'name' = '张三' LIMIT 1) tc
       ON cn.customer_id = tc.id
WHERE  cn.valid_from <= TIMESTAMPTZ '2020-01-01'
  AND (cn.valid_to   >  TIMESTAMPTZ '2020-01-01' OR cn.valid_to IS NULL)
  AND  cn.loaded_at  <= TIMESTAMPTZ '2020-01-15'
ORDER BY cn.loaded_at DESC
LIMIT 1;
```

**怎么用**：`metadata->>'name' = '张三'` 只是模板 1 里 `metadata` 那一列的用法示例，你的 Anchor 没有元数据列时就换回自己的业务主键；两个时点换成你要回放的那一对。这一条的价值不在语法，而在**第一次跑通它**：从视图里取到的值与当时系统里记的那一份对得上，才算证明加载时态真的在承载「什么时候知道的」，而不是把 `loaded_at` 当成了一个装饰列。

### 4.6 成本：这套东西的账单

Anchor Modeling 最贵的既不是存储单价也不是建模人力，而是**表数量**：6NF 把「一个属性一张表」写死，账单随域内属性数线性增长，而非随数据量增长。

- **规模从哪来（可当场估）**：设一个域有 $A$ 个 Anchor、平均每个 Anchor $m$ 个属性，Attribute 底表数 ≈ $A \times m$，再加 Anchor、Tie、Knot。取 $A=200$、$m=15$【推算：域内实体数与平均属性数，按域规模代入——跨部门实体多、共享属性多时取上限】→ $200 \times 15 = 3000$ 张 Attribute，连同 $A=200$ 张 Anchor 约 3200 张【推算：$A + A \times m = 200 + 3000 \approx 3200$】；Tie 与 Knot 表各自另计、不并入这个估算；十个这样的域即 3 万张量级，与 §2.4「数千张甚至数万张」同量级。多数仓库每张表都带一份最小元数据 / 文件 / 分区开销，所以云账单先涨的是**每表固定开销 × 表数**这一项，字节数反而次要。
- **为什么这个主题贵在这里（写入放大）**：逐属性时态把「改一个客户」从一行变成「变更涉及几个属性就插几行，另加同样次数的 `valid_to` 闭段 UPDATE」（§4.2 Bitemporal CDC）。一次改 5 个属性 = 5 行插入 + 5 次闭段 【推算：属性数 × 1 行】。这是 6NF 的结构性代价，不是实现问题。
- **人力的大头在视图层**：盘点 2–6 周、ID 规范与视图设计各一轮评审（4.1），而 Step 5 的反规范化视图是随属性增长**持续重写**的那一项 —— 它比建底表贵得多，也最常被漏出预算。
- **单价怎么取**：存储与算力单价不写死在书里，以你所在云商家**当期价目页**为准（区域与采购折扣的差异大于存储品类之间的差异）；要比方案，比的是**表数 / 写入放大 / 视图层工时**这三个与单价无关的乘数。

通用账法（单位成本、分账、预算告警）见 [Ch11 §03 数据成本与 FinOps](../../11-cross-cutting/03-data-cost-finops/03-data-cost-finops.md)，本节只标 Anchor 特有的那三项。

### 4.7 容灾与故障演练

Anchor 底表可以直接从上游源系统重放重建，所以它的容灾对象不是「机器活不活」，而是**一次装载 / 回放能不能得出同一份历史**。跨地域多活、主备切换属通用题（[Ch12 §07 灾备](../../12-architecture/07-disaster-recovery/07-disaster-recovery.md)），本节只讲本主题特有的失效形态。

| 失效模式 | 影响面 | 降级策略 | 演练方案 | 恢复目标 |
| --- | --- | --- | --- | --- |
| 装载批次重跑不幂等（`:batch_time` 用了 `now()`、缺 `loaded_at < :batch_time`） | 版本行翻倍、闭段把本批新行一起关掉，时态查询给出错误历史 | 停闭段、只追加不覆盖，按 §4.2 四段式修回后重放 | 重放昨日批次，看落库版本行数是否不变（4.9 第 1 条） | RPO 取决于 CDC lag【经验：分钟级到小时级，随同步方式变】；RTO 靠从源重放而非从备份恢复【经验：随源系统可回放窗口变】 |
| 晚到变更（业务时点早于已落库版本）被覆盖而非追加新版本 | 同一业务键的历史被就地改写，不可回放 | 冻结该属性写入口，重放该键的全量变更 | 挑一条真实晚到变更重放，看它产生新版本（4.9 第 4 条） | 同上 |
| 跨时区装载把同一 `valid_from` 解释成两个时刻 | 跨区域对账对不上，只在跨区时才现形 | 时态列统一 `TIMESTAMPTZ`（4.5 模板 1） | 用两个时区的账号各装一批，比对同一键的 `valid_from` | 属数据正确性，无额外目标 |
| 双轨期原宽表与 Anchor 侧口径分叉 | 两侧对账出现差异，下游拿不准以哪侧为准 | 写死「新增门禁只读 Anchor 侧」（4.4 ③） | 把原宽表设为只读一天，看有无告警（4.9 第 8 条） | 连续两轮对账无差异 |

这里的取向与通用容灾相反：恢复时间由「源系统能回放多久」决定，而不是由「备份多大」决定 —— 把备份当救命稻草的做法在这个主题上是错的投资。

### 4.8 演进路线：0 → 1 → 100

贯穿三个阶段的是同一条主线：投入重心从「建」移到「治」—— 0 → 1 贵在把 ID 与视图标准定对，1 → 100 贵在表数膨胀后保住这套标准，100 → 贵在自动生成表时仍有人对它负责。

- **0 → 1（最小可用）**：选一个域，只抽 3–5 个属性，建一张与现有宽表**同名同列**的视图，双轨并行（4.4 ①②）。这一阶段**变贵的是协调而非计算**：把已经交付出去的下游查询收回视图，是最贵的成本，远超建表本身（4.1 开头那条判据）。**先坏的是视图层**：下游等不及，自己从底表抽宽表副本 —— 此后模型仍被维护却不再被消费（4.3 的误选代价）。
- **1 → 100（规模化）**：域从 1 个扩到多个，底表从数百张涨到数千张，读侧补上物化视图 + 目录 / 血缘（4.3）。这一阶段**变贵的是元数据与目录治理**：表数线性上涨，Owner、语义声明、物化刷新都成了固定账单。**先坏的是读侧**：拉一次「实体全貌」要 JOIN 的 Attribute 数随属性数线性上涨，最高频那条查询会先越过可接受线（§2.4 的思考锚点查的就是这条）。
- **100 →（下一道坎）**：把模型定义当代码纳管（版本、评审、回滚），Agent 只承接底座的**检测与告警**（自动感知 schema drift、把「该加哪张 Attribute 表」作为候选推出），**改结构仍一律由人定案**——「Agent 自动加 Attribute 表」按 §5.1 只判到 L3，只登记、不预先在变更流程与权限模型上为它留位置（§1.4.3、§5）。这一阶段**变贵的是平台投入**：模型纳管 + 语义目录 + 检测与定案的门禁。**先坏的是治理**：检测与候选多出来的表无人认领，目录里的 Owner 与语义声明跟不上表的生成速度 —— 这正是 4.6 里「表数即账单」那一条在自动化之后被放大的样子。

### 4.9 自检清单

以下 11 条都是**动过系统才有答案**的动作，坐下来想是答不出来的。建模是否合理那一类问题（一属性一表、Knot 有没有至少两个引用方、时态分组是否由同一业务事件驱动、视图层有没有交付）不跑系统也能回答，请对照 [§ 3.7 自检清单](04-anchor-modeling-section-3-sec3.md) 逐条过一遍，本节不重复占格。任意一条答「否」，记入待处理项。清单里的抽样量（3 个实体 / 7 天 / 1 天）都是【经验】参数，随资产规模与人力调整；要紧的不是抽多少，而是**每次抽同样多**，这样两次检查才能横向比较。

1. 把昨天的一个装载批次重跑一次，落库版本行数是否不变？
2. 全库统计「当前有效行数为 0」的 Anchor 数量，是否为 0？
3. 抽 3 个实体，在视图里是否出现「某个属性为 NULL 而底表有当前有效行」？
4. 挑一条真实的晚到变更（业务日期早于已落库版本）重放，它是否产生新版本而不是覆盖？
5. 把某张物化视图的刷新完成时间与上游装载完成时间画在同一条时间轴上，是否重叠？
6. 按查询日志统计外部账号（非 ETL）直连底表的次数，是否为 0？
7. 抽一个发生过类型演化的属性，按查询日志或血缘把它在线的下游报表逐个数出来，是否都指向同一张「当前有效」表，而不是各自写一套 UNION？（「这份知识该由哪一层收敛」是 §3.7 的问题，这一条查的是它有没有真的被消费方用上。）
8. 把原宽表设为只读一天【经验：随下游数量与可接受的回归窗口变，宁可选在业务低谷日】，有没有告警？
9. 双轨期最近 7 天的对账报告，关键属性抽样比对是否全部一致？
10. 找一个真实消费方，让他不看任何文档说出手上那份数据是几点同步的 —— 说得出来吗？
11. 新增一张 Attribute 表后，从提交到下游可见，需不需要修改任何已有对象的定义？需要，就说明演化链路上还有原地修改。

第 4、8、11 三条最常被跳过，因为它们要动生产环境；但从失败案例的分布看，正是这三条能提前暴露「演化其实是原地改表」和「旧结构还没下线」两类问题。

### 4.10 小结

> 本节小结：整个落地过程中唯一那个决定成败的环节是 **Step 5 反规范化视图层**。Anchor 的收益（加属性零成本、逐属性时态）全部来自底表的不可变结构，而读者能感受到的成本（拉一次全貌的 JOIN）全部落在读侧；视图层是唯一把这两侧接起来的东西。没有它，前四步做出来的是一份没人消费的规范化教材。
>
> 💡 **思考锚点**：按 Step 5 的判据数一下你自己那张「实体全貌」视图——它有几个 `LEFT JOIN`（N 个属性就是 N 个），挂在上面的下游有几个，其中有没有哪个已经绕开你、从底表自己抽了宽表副本？如果 N 已越过「几十」这一档而副本已经跑起来，你是补面向场景的多张视图，还是先回收那个副本？
>
> 配合 [§ 2 核心原理](04-anchor-modeling.md)、[§ 3 设计模式与范式](04-anchor-modeling-section-3-sec3.md) 与 [§ 6 落地实践](04-anchor-modeling-section-6-sec6.md) 阅读。
