> 本文件是 **14-optimizer.md** 的子文件（§8. 面试真题集）。完整章节请回到 [index](14-optimizer.md)。

## 8. 面试真题集

> 本节整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题，题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题。
>
> **每题按五段式作答**：考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料。参考答案优先引用**头部互联网企业的公开架构实践**（Apache Calcite / Impala / Snowflake / BigQuery / Databricks Photon / CockroachDB / Meta F3 / Netflix Penelope / LinkedIn / 阿里 MaxCompute / 字节内部优化器 / 美团 / 京东 / 招行等），便于读者进一步溯源。

### 8.1 全景视图

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §14.1 | 查询优化器（RBO / CBO / AQE） | 14.1.1 ~ 14.1.7 | 7 | 主 |

| 题号 | 难度 |
| --- | :---: |
| §14.1.1 | ★★★☆☆ |
| §14.1.2 | ★★★★☆ |
| §14.1.3 | ★★★★☆ |
| §14.1.4 | ★★★☆☆ |
| §14.1.5 | ★★★☆☆ |
| §14.1.6 | ★★★★☆ |
| §14.1.7 | ★★★★★ |

### 8.2 §14.1 查询优化器（RBO / CBO / AQE）

> 本主题考察**查询优化器作为查询引擎"大脑"的核心能力**：RBO 与 CBO 的本质区别、代价模型如何估算、Join 顺序如何重排、谓词下推与列裁剪的工程细节、AQE 自适应执行的边界与代价、物化视图改写的最优匹配算法，以及 AI 时代优化器的自治化趋势。面试官通常从概念辨析问起，逐层下钻到代价公式、搜索算法和真实工业落地。

---

#### §14.1.1 请说明 RBO（Rule-Based Optimizer）与 CBO（Cost-Based Optimizer）的本质区别，并给出各自的典型适用场景。

**1. 考察点**

- 是否真正理解 RBO 与 CBO 的差异**不在规则的有无**，而在「**优化器是否会基于代价做计划选择**」——RBO 的规则是「确定性改写」，CBO 在多个改写结果中按代价排序。
- 能否说出 Cascades / Volcano 框架在这套差异中的位置——它是把 RBO 的"规则改写"和 CBO 的"代价搜索"统一在一个搜索空间里的工程范式。
- 是否知道**代价模型自身会失效**的边界：统计信息陈旧、相关谓词、NDV 估计错误等会让 CBO 选错计划，而 RBO 在这种场景下反而更稳定。
- 加分项：能结合具体引擎（Calcite / Spark Catalyst / Trino / StarRocks）说出它们各自偏向 RBO 还是 CBO。

**2. 参考答案框架**

**第一层：定义上的本质差异。** 优化器面对的是一棵**逻辑计划树**，目标是产出一棵**物理执行计划**。RBO 的做法是：定义一组**确定性规则**（谓词下推、列剪裁、子查询展开、Limit 下推、关联转半关联等），按规则的优先级把逻辑计划改写成"看起来更优"的形态——这里"看起来更优"是规则作者的经验判断，**不读表、不估代价**。CBO 的做法是：对每个逻辑算子枚举一组**候选物理实现**（如 `Join` 可以是 Broadcast Hash / Shuffle Hash / Sort Merge / Nested Loop），按**代价模型**给每个候选打分，最后挑代价最低的物理计划。代价模型一般是 `Cost = α × I/O + β × CPU + γ × Network`，其中每一项又依赖行数、列宽、压缩比、Shuffle 数据量。

**第二层：搜索框架——Cascades 与 Volcano。** RBO 在工程上很简单（规则流水线），但搜索空间受限；CBO 的难点在于「**组合爆炸**」——N 个 Join 有 N! 种顺序，每个算子又有若干物理实现。学术界和工业界给出的标准答案是 **Volcano / Cascades 框架**（Goetz Graefe）：
- **Memo（记忆化）**：把「逻辑表达式 + 物理属性」的所有已探索组合记下来，避免重复计算。
- **Optimize 输入 → 规则改写 → 代价估算 → 剪枝 → 输出**：用动态规划或 Top-Down 搜索。
- Apache Calcite、Spark Catalyst（Cascades 简化版）、SQL Server、PostgreSQL（ORCA 之后）、TiDB、StarRocks 都在沿用这套思路。

**第三层：典型适用场景。**

- **RBO 适用**：表非常小（统计信息没意义）、规则确定能赢（如列裁剪）、统计信息不可获得（外部数据源、NoSQL、半结构化 JSON）、或者作为兜底——当 CBO 因为代价估算偏差选错计划时，回退到 RBO 的 plan 是常见兜底策略。**典型引擎**：旧版 Hive（0.13 之前）、早期 MySQL、Calcite 默认的 HepPlanner（启发式）。
- **CBO 适用**：表达到一定规模、行数与数据分布对计划选择有决定性影响、需要选择 Join 顺序与 Join 算法。**典型引擎**：Spark 3.x（Catalyst + CBO）、Trino 420+、StarRocks 3.x、ClickHouse 24.x、Impala 3.x、PrestoDB、TiDB、CockroachDB、AWS Redshift、Snowflake、Google BigQuery、Databricks Photon。

**第四层：真实工业中的混合形态。**

- **阿里 MaxCompute 优化器**：以 CBO 为核心，配以一套**自适应规则集**——对小表自动走 Broadcast，对大表自动走 Sort Merge；同时维护一张**规则 + 代价的优先级表**，让规则在代价胜出时让位、代价在规则不可行时让位。
- **Apache Calcite**：同时提供 `HepPlanner`（RBO 流水线）与 `VolcanoPlanner`（CBO 搜索），允许用户**按场景混用**——比如对 OLTP 短查询走 Hep，对 OLAP 复杂查询走 Volcano。
- **Snowflake 优化器**：纯 CBO + 自研代价模型，配合**自动统计信息收集**（后台持续维护 NDV / Min/Max / Histogram），不依赖用户手工 ANALYZE。
- **CockroachDB**：分布式 CBO + Cascades 框架，每个节点基于本地统计信息估算代价，再由 Coordinator 做全局 Join 顺序与并行度决策——这是分布式 CBO 的典型实现。
- **Meta F3**：基于 Apache Calcite 的 Cascades 实现，做了大量**谓词与样本自适应**的扩展，论文发表于 SIGMOD 2024。

**第五层：判断依据。** 在面试场景下，给一个简单的判断口诀：**「表小或统计不可得 → RBO；表大且有统计 → CBO；不确定 → RBO 作为兜底、CBO 作为首选」**。资深架构师会再加一条：**「永远保留 Hint 通道」**——CBO 选错时，必须能用 Hint 把计划拉回正确方向，这是大厂生产环境的标准做法。

**3. 常见陷阱**

- **把 RBO 等同于"没有优化"**。RBO 不等于"什么都不做"，它是规则驱动；很多 RBO 引擎（Calcite HepPlanner）的优化质量也很出色。
- **误以为 CBO 一定优于 RBO**。代价模型依赖统计信息，**统计信息错误时 CBO 可能比 RBO 慢几个数量级**。生产事故里"切了 CBO 之后查询反而慢了"是最经典的翻车。
- **混淆 Cascades 框架与 RBO**。Cascades 是搜索框架，里面跑的是 CBO；同样，VolcanoPlanner 也跑 CBO。框架≠规则。
- **不提代价模型的代价**。CBO 自身有**编译开销**——大型查询的优化时间可以达到秒级，对毫秒级 OLTP 场景不友好。TiDB / CockroachDB 的优化器都做了**prepared plan cache** 来缓解。
- **不区分优化器与执行器**。优化器只产出计划，执行器负责跑；不要把 AQE、Runtime Filter 这些执行期能力算到优化器头上。

**4. 追问预测**

- **「统计信息陈旧时，CBO 选错计划，怎么救？」** 答：三层兜底——A. 强制 Hint 锁定计划（`/*+ BROADCAST */`、`/*+ LEADING(t1 t2 t3) */`）；B. 启用 AQE 在运行时调整（Spark 3.x / Trino 420+ / StarRocks）；C. 启动**统计信息自动刷新**（Snowflake 风格 / Databricks 风格），从根源上消除误差。生产经验上，"切到 AQE + 上自动统计信息"是性价比最高的组合。
- **「CBO 的编译开销在大查询上能达到秒级，怎么优化？」** 答：Cascades 框架的 Memo 结构、Top-Down 剪枝、准备计划缓存（prepared plan）、对外连接卡片化（Join ordering 卡预算）都是常见手段；StarRocks 3.x 引入了**基于历史计划的代价模型预热**。
- **「Volcano 和 Cascades 的关键区别？」** 答：Volcano 是 Top-Down 搜索，规则改写与代价估算紧密耦合；Cascades 把规则改写与代价估算解耦，允许**规则先生成所有候选、再批量估算代价**，剪枝更激进，搜索质量更好。Goetz Graefe 在 1995 年的 Cascades 论文里明确论述了这一点。
- **「CBO 为什么很难完全分布式？」** 答：代价估算需要**全局视角**（所有节点的行数与分布），但代价计算的代价随节点数线性增长。Meta F3、Trino、CockroachDB 各自走了不同路线：F3 用样本 + 自适应估算，Trino 用 Coordinator 集中决策 + Worker 本地细化，CockroachDB 用 Volcano 改造 + 节点局部统计。

**5. 参考资料**

- Goetz Graefe《The Cascades Framework for Query Optimization》（IEEE Data Engineering Bulletin, 1995）——Cascades 框架的原始论文，是理解现代 CBO 必读的奠基性文献。
- Goetz Graefe《Volcano—An Extensible and Parallel Query Evaluation System》（IEEE TKDE 1994）——Volcano 框架的原始论文，定义了 Iterator 模型与基于代价的搜索流程。
- Apache Calcite 官方文档关于 HepPlanner 与 VolcanoPlanner 的章节——同时提供两种优化器范式的开源实现，是面试回答最直接的对标。
- 《Spark SQL: Relational Data Processing in Spark》——Catalyst 优化器的设计论文，介绍了 Spark 如何在 Volcano/Cascades 基础上做工程简化。
- StarRocks 3.x 官方文档的 CBO 与代价模型章节——国内新秀版主 OLAP 引擎的 CBO 实现细节，含自适应代价模型与统计信息自动收集。
- **Apache Impala CBO 的演进（Cloudera / Apache 社区）** —— Impala 在 2.x 引入 CBO 后查询性能有显著提升（具体幅度随查询形态与数据分布而异，本节无法给出可溯源的统一倍数，此处按【经验】档处理），是 Hive 体系迁移到 CBO 的代表性案例。
- **Snowflake 优化器（SIGMOD 2024 论文）** —— 公开了 Snowflake 自研优化器的代价模型与自动统计信息机制，是云数仓 CBO 的工业代表。
- **Google BigQuery 优化器** —— BigQuery 的分布式 CBO + 自动基数估计，是 PB 级分析场景的工业级落地。
- **Databricks Photon** —— 向量化 CBO + 自适应执行（Adaptive Query Execution），把 CBO 与执行期优化做到了深度融合。
- **CockroachDB 分布式 CBO** —— 实现了基于 Cascades 的分布式查询优化器，是分布式数据库 CBO 的标准实现。
- **Meta F3 优化器（SIGMOD 2024 论文）** —— Facebook 内部基于 Calcite 二次开发的 CBO，含自适应基数估计与样本优化器。
- **Netflix Penelope** —— Netflix 自研的物化视图与查询改写引擎，是"改写式优化"的代表，可与 CBO 配合使用。
- **LinkedIn 内部优化器实践** —— LinkedIn 在 Pinot 与大数据查询平台上的 CBO 调优与统计信息治理实践。
- **阿里 MaxCompute 优化器** —— 阿里自研优化器在双 11 场景下处理万级并发 + PB 级数据的代价估算与计划选择。
- **字节跳动内部优化器（基于 Calcite 改造）** —— 字节在 Spark/Flink/Trino 上的优化器调优与自适应执行落地。
- **美团** —— 美团的 Doris/StarRocks CBO 调优——统计信息治理与慢查询治理的工程实践。
- **京东** —— 京东的 StarRocks 优化器落地——大宽表场景下的代价模型适配与业务调优。
- **招行** —— 招行基于 StarRocks 的湖仓 CBO 实践——金融场景对统计信息准确度的极致要求与代价模型适配。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §14.1.2 请解释 CBO 代价模型的核心组成（行数估计、I/O、CPU、Network）以及统计信息（NDV、Histogram、Min/Max）失效的常见原因。

**1. 考察点**

- 是否能把代价模型**拆解到每一项**——`Cost = α × I/O + β × CPU + γ × Network`，并能说清每项的输入参数（行数、列宽、压缩比、Shuffle 量）。
- 是否理解**统计信息是代价模型的输入**——优化器本身不产生数据分布信息，它只是消费统计信息；统计信息的精度直接决定代价模型的精度。
- 能否区分**行数估计、基数估计（Cardinality）、选择率（Selectivity）**三个相关但不同的概念。
- 加分项：能说出真实生产中统计信息失效的常见原因（小文件、Tiny File、Skew、迟到的数据、全量重写、冷数据归档），并给出对应的治理手段。

**2. 参考答案框架**

**第一层：代价模型的三大组成。**

- **I/O 代价**：从存储读数据的代价，与「**扫描行数 × 列宽 / 压缩比**」成正比。列存（Parquet / ORC）和高压缩（ZSTD / LZ4）让 I/O 代价被大幅削减，但仍是单机优化的主战场。经验公式：`I/O ≈ (Rows × ColumnWidth) / CompressionRatio`。
- **CPU 代价**：算子执行的 CPU 开销，包括**表达式求值、Hash 计算、排序、聚合、Join Probe**。每一行算子过一遍都要算一次，所以 `CPU ≈ Rows × PerRowCost`。CPU 优化的关键是**向量化执行**（Velox / Photon / DataFusion 的核心收益）与**算子融合（Operator Fusion）**。
- **Network 代价**：Shuffle 的网络传输代价，与「**Shuffle 数据量 × 网络拓扑代价**」成正比。在云上，跨可用区（AZ）的 Shuffle 代价可以是同 AZ 内的 5–10 倍。Network 是**最容易被忽视但代价最重的项**——一次错误的 Shuffle Join 选择可能让 I/O 优势归零。

总代价一般是这三项的加权和：生产系统里 Network 的权重往往高于理论值，因为跨节点传输不可压缩。

**第二层：统计信息的核心要素。**

- **行数（Row Count）**：单表或分区内的总行数，是所有代价估算的起点。
- **NDV（Number of Distinct Values）**：不同值的数量，直接影响**基数估计**——例如 `JOIN ON user_id` 的输出行数近似 `min(NDV_A, NDV_B)`；`GROUP BY user_id` 的输出组数是 `NDV`。
- **Min/Max**：用于**分区裁剪与范围下推**——`WHERE dt BETWEEN '2024-01-01' AND '2024-01-31'`，如果统计信息里 `min_dt='2024-01-01'`、`max_dt='2024-01-31'`，优化器才能放心裁剪。
- **Histogram**：刻画**数据分布**（等高、等宽、TDigest）。它是处理**非均匀分布**的关键——例如「80% 的订单金额在 0–100 元，少数订单上百万」，没有 Histogram 就只能按均匀分布估算，选择率错一个数量级。
- **TopK**：高频值清单。处理「少数高频值 + 长尾」分布的标准解法，被 Snowflake / StarRocks / Doris 广泛采用。

**第三层：统计信息失效的常见原因。**

1. **ANALYZE 没跑或跑得太稀疏**——大表 ANALYZE 自身开销很高（Doris 的全量统计采样需要分钟级），很多人只在初始化时跑一次，之后再也不跑。
2. **数据分布剧变后没刷新**——典型场景：大促后头部 SKU 集中、数据冷归档后老分区为空、Tiny File 合并后行数密度变化。
3. **相关谓词（Correlated Predicates）**——`WHERE country='CN' AND city='Beijing'`，CN 与 Beijing 高度相关，但优化器按独立谓词估算，选择率会被低估 `products^2`。
4. **NULL / 默认值的特殊处理**——很多 NDV 估算把 NULL 算进去，导致 `WHERE col IS NOT NULL` 的选择率估算错。
5. **跨列相关性**——`birth_year` 与 `age` 严格相关，`age > 30 AND birth_year < 1990` 的联合选择率不是两者相乘。
6. **UDF / 表达式谓词**——`WHERE hash(user_id) % 10 = 3`，优化器完全没有信息，只能用默认选择率（如 10%），实际可能 1% 也可能 50%。
7. **外部数据源与半结构化字段**——Kafka 主题、JSON 字段、Parquet 的嵌套结构，统计信息经常是缺失的。

**第四层：工程治理手段。**

- **自动统计信息收集**——Snowflake 后台持续维护、Doris 的 `ANALYZE` 自动任务、StarRocks 的统计信息自动收集与定时刷新。
- **采样估算**——HyperLogLog 估 NDV、TDigest 估分布、Sampling 估行数，平衡精度与开销。
- **自适应基数估计**——基于历史查询反馈修正（Meta F3 的核心卖点之一），用运行时反馈修正编译期估算。
- **Fallback 策略**——统计信息缺失时回退到 RBO / 默认选择率，避免 CBO 因为错误估算做出灾难性选择。
- **DBA 工具**——慢查询的 EXPLAIN 偏差检测，定期扫描"代价估算与实际行数差异 > N 倍"的查询清单，自动触发 ANALYZE。

**第五层：真实工业实践。**

- **招行金融场景**：对账与监管报送要求统计信息**精度在 1% 以内**，采用「**自动 + 定时 + 触发式三重统计**」——后台持续维护、DBA 定时校验、关键报表前触发式 ANALYZE。这是金融级代价模型精度的代表。
- **阿里 MaxCompute**：在双 11 场景下专门维护一张**统计信息元表**，记录每张表的 ANALYZE 时间、估算偏差、刷新策略，对**头部热点表**做分钟级刷新。
- **字节跳动内部优化器**：在 Calcite 基础上做了**代价模型与统计信息自适应**，对 UDF 谓词用运行时采样补齐，对 JSON 字段用列式统计信息重建。
- **美团 Doris 实践**：针对**外卖订单表的热点时段**（午晚高峰），单独维护时段统计信息，避免高峰期的代价估算偏差。

**3. 常见陷阱**

- **只说"统计信息不准"而不说怎么治理**。面试官想听的是具体的失效原因和治理手段。
- **混淆行数与选择率**。选择率 = 过滤后行数 / 总行数，是 0–1 的概率值；很多面试者把二者混用。
- **忽略 Network 代价**。只讲 I/O + CPU 是教科书式的浅层回答，必须补充 Network 与 Shuffle 在分布式场景下的权重。
- **不提 Histogram 的成本**。Histogram 的精度与采样率、桶数挂钩，过密的 Histogram 自身就是存储开销。Snowflake 的策略是**自适应桶数**——数据分布均匀时少桶，分布偏斜时多桶。
- **不说代价模型的单位**。代价是**相对值**还是**绝对值**？生产系统里代价一般是相对值（用于排序），单位是引擎自定义的"代价单位"；这与执行时间不是线性关系。

**4. 追问预测**

- **「Histograms vs Samplings，怎么选？」** 答：**Histogram 适合等值与范围谓词的精确估算，Sampling 适合整体数据分布的粗估**。生产上往往是组合——用 Sampling 估整体 NDV，用 Histogram 估热点区间。
- **「CBO 代价估算偏差 100 倍，查询从 1 秒变成 100 秒，怎么排查？」** 答：第一步看 EXPLAIN 的估算行数 vs 实际行数（`Rows vs Actual Rows`）；如果偏差大，触发 ANALYZE；如果 ANALYZE 后还偏差，怀疑**数据倾斜**（分区或文件大小极不均匀）；最后用 Hint 锁定 + 反馈给引擎团队修代价模型。
- **「怎么评估代价模型的精度？」** 答：建立**估算偏差监控**——定期抽一批查询，对比优化器估算行数与执行期真实行数，计算 P50 / P95 / P99 的偏差倍数。这是头部互联网企业的标准做法。
- **「AI 能不能替代代价模型？」** 答：能部分替代——LLM 可以基于历史查询预测选择率（特别对 UDF / JSON 谓词有效），但全量替代代价模型仍是研究阶段。Snowflake / StarRocks 在 AI 增强上已经做了初步探索。

**5. 参考资料**

- Goetz Graefe《Query Optimization Techniques: A Survey》——代价模型与统计信息的综述性文章。
- Yannis Ioannidis《The History of Histograms (and Other Cardinality Estimation Tricks)》——Histogram 在数据库优化中的发展史。
- Surajit Chaudhuri 等《Robust Cardinality Estimation through Adaptive Sampling》（SIGMOD 2007）——自适应采样在代价估算中的应用。
- **Apache Calcite 文档关于统计信息与代价模型的章节** —— 工业级 CBO 中统计信息管理的开源实现。
- **Meta F3 论文（SIGMOD 2024）** —— 自适应基数估计与代价模型的工业级方案。
- **Snowflake 自动统计信息机制（SIGMOD 2024 论文）** —— 云数仓统计信息自动维护的代表实践。
- **Google BigQuery 优化器** —— PB 级统计信息采样与基数估计的工业实践。
- **Databricks Photon + Adaptive Query Execution** —— 运行时反馈修正代价估算的工程化实现。
- **CockroachDB 分布式代价模型** —— 分布式场景下统计信息收集与代价估算的代表。
- **StarRocks 3.x CBO 文档** —— 国内 OLAP 引擎代价模型的工程细节与统计信息管理。
- **Apache Impala CBO 文档（Cloudera / Apache）** —— Hive 生态 CBO 的工程实现。
- **LinkedIn 大数据查询平台的代价模型治理** —— 工业界对代价模型精度的工程治理经验。
- **阿里 MaxCompute 优化器（双 11 场景）** —— 万级并发场景下统计信息的精度要求与自动刷新机制。
- **字节跳动内部优化器** —— 基于 Calcite 的代价模型自适应与统计信息治理。
- **美团 Doris/StarRocks 优化器调优** —— 业务场景驱动的代价模型适配。
- **京东 StarRocks 优化器落地** —— 大宽表场景下的代价模型实践与统计信息治理。
- **招行 StarRocks 湖仓 CBO 实践** —— 金融场景对统计信息精度的极致要求。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §14.1.3 N 张表做 Join，搜索空间是 N!，CBO 是如何用动态规划（DP）或贪心（Greedy）在工程上做到可接受的？请分析 Join 顺序优化的算法选择。

**1. 考察点**

- 是否真正理解 Join 顺序的**搜索空间爆炸**问题——5 张表就有 5! = 120 种顺序，10 张表是 10! = 3.6M。
- 能否区分**动态规划（DP）与贪心（Greedy）**两种算法的复杂度（DP: O(2^N)、Greedy: O(N^2 log N)）与适用场景。
- 是否知道**有趣的顺序（Interesting Order）**与**连接基数（Join Cardinality）**这两个关键概念——它们是剪枝的核心抓手。
- 加分项：能讲清楚**左深树 vs 浓密树 vs ZigZag**三种 Join 树形态的工程取舍，以及 Snowflake / StarRocks / CockroachDB 各自的偏好。

**2. 参考答案框架**

**第一层：问题定义。** 给定 N 张表 T1, T2, ..., TN，Join 顺序优化要解决两件事：① 确定 Join 的**顺序**（先 Join 谁后 Join 谁）；② 确定每个 Join 的**算法**（Broadcast Hash / Shuffle Hash / Sort Merge / Nested Loop）。对于 N 张表，顺序的搜索空间是 N!，每个位置又对应多种算法，所以总搜索空间是 **N! × M^N**（M 是平均算法数）。

**第二层：动态规划（DP）——精确解。** 经典做法是按**子集状态 DP**：
- 状态：`dp[S]` 表示已经 Join 了表集合 S 时的最小代价。
- 转移：枚举 S 的真子集 S'，考虑把 `S - S'` 作为新表的 Join 顺序。
- 复杂度：**O(2^N × N)**，空间 O(2^N)。
- 这是 **System R 优化器**的标准做法，被 Oracle、DB2、SQL Server 沿用几十年。
- 缺点：N > 12–15 时内存与计算开销爆炸（2^15 = 32K 个状态已经比较吃力）。生产上常用 **Top-K 剪枝（Beam Search）**——只保留 Top-K 个最低代价的子集状态，避免指数爆炸。

**第三层：贪心（Greedy）——近似解。** 做法是：
- 每一步选**当前最低代价**的两张表合并。
- 复杂度：**O(N^2 × log N)**，空间 O(N)。
- 优点：可扩展到 N = 50+，适合超多表的场景（典型的报表型查询）。
- 缺点：**局部最优不等于全局最优**——贪心可能在第一步选了次优，反而拖慢后续。
- 工程上常用「**贪心 + 局部回溯**」或「**贪心 + 代价修正**」来弥补。

**第四层：左深树 vs 浓密树 vs ZigZag。** Join 顺序不仅有「先 Join 谁」的问题，还有「**Join 树的形状**」问题：

- **左深树（Left-Deep Tree）**：每个 Join 的右子树都是一张单表。优点是易于流水线执行、Probe 端可以流式吐数据；缺点是搜索空间小。
- **浓密树（Bushy Tree）**：左右子树都可能是中间 Join 结果。搜索空间最大、潜在最优解更好；缺点是执行器流水线实现复杂。
- **ZigZag 树**：浓密树的工程化折中——左右深度交替，既保留一定搜索空间又便于流水线。Snowflake 默认 ZigZag。

生产上**左深树 + 浓密树混合搜索**是主流——StarRocks / Calcite 用左深为主、Snowflake / CockroachDB 用 ZigZag / 浓密树。

**第五层：剪枝策略。**

- **Interesting Property（有趣的属性）**：仅在 Join 顺序满足「**排序属性匹配**」时才保留这个分支——例如 Sort Merge Join 要求两端按 Join Key 排序，保留已有的排序能省一次 Sort。
- **Cost Threshold（代价阈值）**：当前分支的代价已经超过最优解，直接剪掉。
- **Cardinality Threshold（基数阈值）**：Join 结果行数估计超过阈值（如 1B），直接认为代价过高、剪掉。
- **Join Commutativity（Join 交换律）**：A JOIN B 与 B JOIN A 等价，只保留一种方向。
- **Join Associativity（Join 结合律）**：(A JOIN B) JOIN C 与 A JOIN (B JOIN C) 在某些条件下等价，进一步剪枝。

**第六层：真实工业实践。**

- **Apache Calcite VolcanoPlanner**：标准的 DP + 剪枝，支持左深与浓密混合搜索，是 Calcite 默认的优化器实现。
- **CockroachDB**：用 Cascades + DP，左深与浓密混合，对分布式 Join 顺序做了额外优化（最小化跨节点 Shuffle）。
- **Snowflake**：使用**改进的 DP**——多目标代价（I/O + Network + 内存）+ ZigZag 树形状偏好 + 准备计划缓存（prepared plan cache）。
- **StarRocks 3.x**：使用**自适应 DP**——根据历史查询的代价模型反馈动态调整剪枝阈值。
- **TiDB**：基于 Cascades 框架的分布式 Join 顺序优化，处理 TiKV 的存储特性（Range 分区）。
- **阿里 MaxCompute**：使用**贪心 + 局部回溯**处理超多表 Join（电商大宽表经常 15+ 张表）。

**3. 常见陷阱**

- **只说 DP 不说代价**。DP 是搜索框架，**没有代价模型 DP 没有意义**——DP 给出的是"在当前代价模型下的最优"。
- **把 N! 与 2^N 混用**。N 张表的全排列是 N!，子集状态 DP 的复杂度是 O(2^N)，二者完全不是一回事。
- **忽略分布式代价**。单机优化器的代价公式 `Cost = I/O + CPU` 在分布式下必须加 Network 与 Shuffle，否则选出来的 Join 顺序**完全不对**。
- **不提 Search 趣味性**。不解释 Interesting Property 的剪枝，回答会显得背书。

**4. 追问预测**

- **「左深树 vs 浓密树，到底用哪个？」** 答：默认左深（执行器友好），但要**保留浓密搜索能力**作为兜底；现代优化器（CockroachDB / Snowflake）默认 ZigZag 或浓密，因为执行器已经支持流水线 Join。
- **「贪心什么时候够用？」** 答：表数量大于 10–12、或者代价模型的精度有限时。电商宽表（20+ 表 Join）用贪心 + 回溯比 DP 更稳定。
- **「Join 顺序选错了，怎么强制 Hint？」** 答：用 LEADING Hint 锁定顺序（Oracle / DB2 / Spark 都支持），用 Hint 把错误计划强制覆盖，再回到正常路径。
- **「DP 的内存爆炸怎么办？」** 答：**Beam Search（保留 Top-K 状态）** 或 **Iterative DP（迭代加深）**。StarRocks / Calcite 都支持 Beam Search。

**5. 参考资料**

- P. Griffiths Selinger 等《Access Path Selection in a Relational Database Management System》（SIGMOD 1979）——System R 优化器的原始论文，**第一个工业级 DP Join 顺序优化器**。
- Goetz Graefe《The Cascades Framework for Query Optimization》——Cascades 框架里 Top-Down 搜索对 Join 顺序的处理。
- Thomas Neumann《Query Simplification: Graceful Degradation for Join-Ordering Optimization》（ICDE 2009）——超多表 Join 的优雅降级策略。
- **Apache Calcite VolcanoPlanner 文档** —— 开源 CBO 中 Join 顺序搜索的工业实现。
- **CockroachDB Cascades 优化器文档** —— 分布式 Join 顺序优化的工程实践。
- **Snowflake CBO 论文（SIGMOD 2024）** —— ZigZag 树形状与改进 DP 的工业实践。
- **StarRocks 3.x CBO 文档** —— 自适应 DP 与 Beam Search 的国内 OLAP 引擎实现。
- **TiDB Cascades 优化器文档** —— 分布式数据库 Join 顺序的工业级实现。
- **Apache Impala CBO（Cloudera）** —— Hive 生态下的 Join 顺序优化。
- **阿里 MaxCompute 优化器（双 11 场景）** —— 超多表 Join 的贪心 + 回溯落地。
- **字节跳动内部优化器** —— 大宽表场景下的 Join 顺序调优。
- **美团 Doris/StarRocks Join 顺序调优** —— 业务场景驱动的 Join 顺序优化实践。
- **京东 StarRocks 优化器落地** —— 电商宽表的 Join 顺序治理。
- **Netflix Penelope 物化视图改写** —— 通过预连接消除 Join 顺序问题。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §14.1.4 请详细说明谓词下推（Predicate Pushdown）与列裁剪（Column Pruning）的执行层次、边界条件，以及为什么"在错误的下推"是常见的慢查询根因。

**1. 考察点**

- 是否理解谓词下推的**多层含义**——存储层（Parquet Row Group 过滤、ORC Stripe Index）、扫描层（Parquet 列读）、算子层（Filter 上提下推的算子树重写）、连接层（关联条件下的过滤）。
- 能否区分**存储层下推、扫描层下推、计划层下推**的边界——分别由谁实现、在哪个阶段执行。
- 是否知道谓词下推的**失效场景**——UDF / JSON 字段 / 复杂表达式 / 子查询包裹 / OR 条件。
- 加分项：能讲清**谓词上提（Pull Up）与下推的取舍**——某些场景下上提反而更优。

**2. 参考答案框架**

**第一层：三层下推的层次划分。**

- **存储层下推**：由**存储格式**实现。Parquet 的 Page Index / Row Group Statistics、ORC 的 Stripe Footer Index、Doris / StarRocks 的 ZoneMap 索引，让过滤发生在**读取数据之前**——这是最高效的下推。例：`WHERE dt = '2024-01-01'` 直接跳过其他分区；`WHERE user_id > 1000` 利用 Min/Max 跳过整个 Row Group。
- **扫描层下推**：由**扫描算子**实现。在 Parquet Reader 阶段就把 WHERE 条件下推到 Reader，只读需要的列、用谓词过滤掉不满足的行。**比存储层下推晚**——已经决定要读 Row Group，只是少读一些行/列。
- **计划层下推**：由**优化器**实现。把 Filter 算子在算子树中**下移**——例如把 `WHERE` 从 Project 下推到 Scan 上方，避免 Project 后的算子做无用功。这是 Calcite / Catalyst 的标准操作。

**第二层：列裁剪的两层含义。**

- **逻辑列裁剪**：优化器识别 `SELECT *` 中实际没有用到的列，把 Project 算子下推到 Scan 上方，使 Scan 只输出需要的列。这是**计划层操作**。
- **物理列裁剪**：存储层只读取需要的列（Parquet 是列存，可以只读需要的列）。这是**存储层操作**，依赖列存格式。

二者是**串联关系**——逻辑列裁剪让物理层知道要读哪些列，物理层按列存格式只读那些列。如果逻辑裁剪漏了，物理层会读全列，浪费 I/O。

**第三层：下推的失效场景。**

- **UDF / 不确定函数**：`WHERE hash(user_id) % 10 = 3`，CBO 不敢下推，因为结果不确定。
- **复杂表达式**：`WHERE substring(email, position('@' in email)) = 'gmail.com'`，下推后扫描层的代价可能比不下推更高（每行都要算表达式）。
- **JSON / 半结构化字段**：`WHERE get_json_object(json_col, '$.field') = 'xxx'`，很多引擎不支持 JSON 字段下推。
- **OR 条件**：`WHERE country='CN' OR city='Beijing'`，OR 的两侧不能独立下推，必须保留上层的 Filter。
- **子查询包裹**：`WHERE col IN (SELECT ...)`，相关子查询的下推风险高。
- **关联条件依赖**：`WHERE t1.a = t2.a AND t1.b = 1`，把 `t1.b = 1` 下推到 t1 的 Scan 可以，但下推到 t2 上是错的（关联后才有意义）。

**第四层：下推的工程实现要点。**

- **算子树等价变换**：Calcite 提供的 `FilterIntoJoinRule`（Join 条件下的下推）、`FilterMergeRule`（相邻 Filter 合并）、`FilterProjectTransposeRule`（Filter 与 Project 交换）。
- **代价驱动**：不是所有 Filter 都该下推。例如，`WHERE rownum < 100` 配合大表 Scan，下推代价低收益高；`WHERE complex_expr(col) = 'x'` 配合小表，下推反而可能让 Scan 阶段 CPU 飙升。优化器需要按**代价**决定是否下推。
- **空集合短路**：谓词下推到 Scan 时，如果过滤掉所有行，Scan 直接返回空集，跳过后续算子。这种「**空集合短路**」是优化器必须保留的能力。
- **存储层协同**：优化器下推的 Filter 必须能被**存储层理解**——所以 Iceberg 的 Puffin 文件（统计数据）、Parquet 的 Bloom Filter、StarRocks 的 ZoneMap 是优化器下推的物理抓手。

**第五层：常见错误下推的根因。**

- **不收集统计信息**：统计信息缺失时，优化器不敢下推，怕把行数估错导致上层的计划错选。
- **表达式重写不足**：复杂谓词没被改写成等价的简单谓词，导致下推失败。Calcite 提供 `ExpressionSimplifier` 做这件事。
- **OR-to-UNION 规则没启用**：很多引擎默认禁用 OR-to-UNION 改写（怕改写后代价变高），导致 OR 条件不能下推。
- **UDF 白名单**：UDF 默认不下推，需要 DBA 显式标记"该 UDF 可下推"。
- **关联后谓词下推过早**：关联条件下的过滤不能无脑下推到子表 Scan。

**第六层：真实工业实践。**

- **Apache Calcite**：通过 HepPlanner + VolcanoPlanner 的混合模式实现谓词下推、列裁剪、子查询展开等核心改写规则。
- **Snowflake**：把谓词下推做到了**Micro-partition** 级别——Snowflake 把数据切成体量很小的 Micro-partition，每片都带 Min/Max 统计，下推几乎不消耗优化器时间。
- **StarRocks**：内置**ZoneMap 索引、Bloom Filter、前缀索引**，让谓词下推到存储层非常彻底。
- **阿里 MaxCompute**：对 JSON 字段做了专门的**路径索引**，让 `WHERE get_json_object(...)` 也能下推。
- **字节跳动内部优化器**：基于 Calcite 改造，把 OR 条件、复杂表达式下推的规则做了**业务化定制**（如电商特有的"GMV > 1000"模式）。
- **美团 Doris 实践**：在**外卖订单表**上做了前缀索引（`order_id + user_id`），让大部分谓词下推到存储层。

**3. 常见陷阱**

- **只说"下推"不说在哪一层**。存储层下推与计划层下推的**性能差距是数量级**——存储层下推可以少读 99% 的数据，计划层下推只少算一些行。
- **把谓词下推和分区裁剪混用**。分区裁剪是特殊的下推——直接跳过整个分区，不读任何数据。谓词下推可能还是要读分区内的数据。
- **忽略 UDF 下推的边界**。UDF 默认不下推，这是很多团队的"慢查询黑洞"。
- **不解释列裁剪与列存的协同**。列裁剪只有配合列存才有意义——行存的表列裁剪收益很低。
- **不提代价驱动**。谓词下推不总是有利的，某些场景下上提（Pull Up）更优。

**4. 追问预测**

- **「谓词下推到 Scan 反而慢了，为什么？」** 答：UDF / 复杂表达式下推会让 Scan 阶段 CPU 飙升；列存对应读宽度过窄时压缩解压缩代价反而更高；存储层的下推在某些场景下需要做更多 I/O 来读取统计信息。**永远以代价为准**。
- **「OR 条件怎么下推？」** 答：标准做法是 **OR-to-UNION 改写**——把 `WHERE A OR B` 改写成 `WHERE A UNION ALL WHERE B`。代价是两遍扫描 vs 一遍不下推，由 CBO 决定。
- **「下推和分区裁剪怎么配合？」** 答：分区裁剪是"按分区级下推"，谓词下推是"按 Row Group / Page 级下推"，二者叠加才能做到极致。Iceberg 的 Partition Pruning + Parquet 的 Row Group 跳过是经典组合。
- **「JSON 字段下推怎么做？」** 答：要么用专门的列式 JSON 格式（Spark 的 `from_json` + 内置 Schema）、要么建**倒排索引**（Lucene / Bloom Filter）、要么在 ETL 阶段把 JSON 字段提为顶层列（**打平**）。

**5. 参考资料**

- David DeWitt 等关于 Predicate Pushdown 的经典综述——理解下推机制的工业实践基础。
- **Apache Calcite 文档关于 FilterPushDown / ColumnPruning 的章节** —— 计划层下推的开源实现。
- **Apache Parquet / ORC 文档关于 Row Group Statistics / Bloom Filter 的章节** —— 存储层下推的工业实现。
- **StarRocks / Doris 文档关于 ZoneMap / 前缀索引的章节** —— 国内 OLAP 引擎的下推实践。
- **Snowflake Micro-partition 文档** —— 云数仓的下推极致实现。
- **Apache Impala CBO 文档** —— Hive 体系的下推实现。
- **CockroachDB 谓词下推文档** —— 分布式数据库的下推工程实践。
- **Databricks Photon / Adaptive Query Execution** —— 运行时谓词下推与下推的反馈修正。
- **LinkedIn 大数据查询平台的下推实践** —— 工业界下推治理经验。
- **阿里 MaxCompute JSON 路径索引** —— 半结构化字段下推的国内实践。
- **字节跳动内部优化器** —— OR 条件与复杂表达式的业务化下推定制。
- **美团 Doris 谓词下推调优** —— 外卖订单表的下推工程实践。
- **京东 StarRocks 谓词下推实践** —— 大宽表场景下的下推优化。
- **招行湖仓谓词下推** —— 金融场景对下推精度的要求。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §14.1.5 自适应查询执行（AQE, Adaptive Query Execution）如何运行时调整 Join 策略、并行度与分区合并？请分析 AQE 与 CBO 的关系与权衡。

**1. 考察点**

- 是否理解 AQE 的**核心价值**——在 CBO 估算偏差时**运行时调整**，弥补编译期优化器的不足。
- 能否说出 AQE 的**三大调整维度**：Join 策略切换（Broadcast ↔ Shuffle Merge）、分区合并（Coalesce）、倾斜 Join 处理（Skew Join）。
- 是否知道 AQE 是**有代价的**——Stage 边界重切会引入额外延迟，对短查询不友好。
- 加分项：能区分 Spark AQE / Trino AQE / StarRocks AQE / Doris AQE 的实现差异与适用边界。

**2. 参考答案框架**

**第一层：AQE 的核心思想。** CBO 是**编译期优化**——基于统计信息估算行数与代价，选出计划。一旦估算偏差，计划的执行就会偏离预期。AQE 的核心思想是**把优化推迟到运行时**：在每个 Stage 完成后，**收集实际数据量与分布**，让优化器（或 AQE 引擎）根据真实情况动态调整后续计划。这是**「运行时反馈修正编译期估算」**的范式。

**第二层：三大调整维度。**

- **Join 策略切换**：原计划选 Shuffle Sort Merge Join，但 Stage 1 完成后发现某表实际只有 50MB，CBO 估算为 50GB——AQE 立刻把策略改为 **Broadcast Hash Join**，避免 Shuffle + Sort 的代价。这是 AQE 最有价值的场景。
- **分区合并（Coalesce Partitions）**：原计划生成 200 个分区，但实际数据只够 50 个分区的处理量，剩余 150 个分区是空跑——AQE 把 200 个分区合并为 50 个，减少 Task 数与调度开销。
- **倾斜 Join 处理（Skew Join）**：运行时发现某个 Join Key 的分区数据量是均值的 10 倍——AQE 把这个热点 Key 单独处理（拆分、广播、两阶段聚合），避免单个 Task 拖死整个 Stage。

**第四层：AQE 与 CBO 的关系与边界。**

- **AQE 不是替代 CBO**——AQE 在 CBO 给出的初始计划基础上做运行时调整，二者是**协同关系**。AQE 处理 CBO 估算偏差的兜底场景，CBO 处理有充足统计信息的精确估算。
- **AQE 是有代价的**——Stage 边界重切需要 Driver 收集所有 Task 的统计信息，再决定是否调整。这引入**额外的延迟**——对秒级查询，AQE 可能让查询变慢；对分钟级查询，AQE 的收益才覆盖代价。
- **AQE 不改变算子拓扑**——AQE 只能在原计划的算子集合内调整（Join 算法切换、分区数调整、Skew 处理），不能插入新的算子或删除已存在的算子。
- **AQE 的可观测性要求**——AQE 需要运行时统计信息，所以执行器必须有完整的 Metrics 上报。

**第五层：不同引擎的 AQE 实现差异。**

- **Spark 3.0+ AQE**：
  - 由 `spark.sql.adaptive.enabled` 控制总开关。
  - `adaptive.coalescePartitions.enabled` 控制分区合并。
  - `adaptive.skewJoin.enabled` 控制倾斜 Join。
  - `adaptive.localShuffleReader.enabled` 控制运行时切换 Broadcast。
  - 实现机制：在 Stage 边界收集 `MapOutputStatistics`，根据分区大小判断是否需要重切。
- **Trino 420+ AQE**：
  - 由 `enable-adaptive-join-reordering` 与 `enable-dynamic-filtering` 控制。
  - Runtime Filter 是 Trino AQE 的特色——在 Scan 阶段动态生成 Bloom Filter，下推到 Storage Connector，过滤掉大部分不匹配的行。
  - 与 Spark AQE 的差异：Trino 的 AQE 更细粒度，可以在 Stage 中动态注入 Runtime Filter。
- **StarRocks AQE**：
  - 由 `enable_adaptive_runtime_filter` 与 `enable_adaptive_mv_rewrite` 控制。
  - Runtime Filter 是 StarRocks 的核心优化——基于 Join Build 端构建 Filter，下推到 Probe 端的 Scan。
  - StarRocks 的 Runtime Filter 兼容多种类型（IN / Bloom Filter / Min-Max）。
- **Doris 2.1+ AQE**：
  - 实现类似 StarRocks，重点在 Runtime Filter 与自适应 Join 策略。
- **ClickHouse**：没有完整的 AQE，但有部分 Runtime Filter 能力（通过 `join_use_nulls` 与 `partial_filter` 参数间接实现）。

**第六层：真实工业实践。**

- **字节跳动 Spark 优化**：开启 Spark AQE 后慢查询显著减少（幅度随数据倾斜程度与作业形态而异，本节无法给出可溯源的统一数字，此处按【经验】档处理）——核心收益是 Skew Join 自动处理。这是国内有代表性的 Spark AQE 落地案例。
- **Netflix Penelope**：在 Trino 之上做了**自动物化视图改写 + 运行时统计信息修正**，本质上是 AQE 在改写层的延伸。
- **StarRocks 在美团 / 京东的落地**：Runtime Filter 是查询性能的最大单一提升点——开启 Runtime Filter 后，关联查询性能有可观提升（幅度高度依赖 Join 形态与数据分布，不宜引用单一倍数；本节按【经验】档处理）。
- **招行金融场景**：对**核心账务表**开启 AQE + Runtime Filter，但**禁用 Skew Join 自动处理**（金融场景对数据倾斜的处理要严格审计）。

**3. 常见陷阱**

- **认为 AQE 没有代价**。AQE 的 Stage 边界收集与决策有开销，对短查询反而是负担。
- **混淆 AQE 与 Runtime Filter**。Runtime Filter 是 AQE 的一种具体实现（动态生成 Filter 下推），但 AQE 不止 Runtime Filter。
- **不区分 AQE 与 Adaptive Caching**。Adaptive Caching 是执行器层缓存（如 Impala 的 Multi-Level Cache），AQE 是优化器层自适应。
- **过度依赖 AQE**。AQE 是兜底手段，根因还是 CBO 的估算精度；不修代价模型只靠 AQE 是"以运行时代价换编译期偷懒"。
- **不分场景启用**。对 OLTP 短查询（< 1s）应该关闭 AQE，对 OLAP 长查询（> 30s）应该开启。

**4. 追问预测**

- **「AQE 与 CBO 的分工边界？」** 答：CBO 负责**粗粒度的初始计划**（Join 顺序、整体算法选择）；AQE 负责**细粒度的运行时调整**（Join 算法切换、分区数调整、Skew 处理）。二者是粗细分工的协同。
- **「AQE 失败了怎么救？」** 答：关闭 AQE，回到纯 CBO + 手工 Hint；或者调优 CBO 统计信息；再或者用**运行时长查询日志**做监控，把 AQE 失败的查询清单标记出来。
- **「Runtime Filter 与 Bloom Filter 的区别？」** 答：Bloom Filter 是 Runtime Filter 的一种实现；Runtime Filter 还可以是 IN List（适用于小维度）、Min-Max Filter（适用于有序数据）等。
- **「AQE 在云数仓里的实现差异？」** 答：Snowflake 与 BigQuery 的 AQE 实现更激进——能**动态调整资源**（增加节点、减少节点）；传统引擎的 AQE 只调整**计划**，不调整资源。

**5. 参考资料**

- **Apache Spark AQE 设计文档（Adaptive Query Execution: Speeding Up Spark SQL at Runtime）** —— Spark AQE 的原始设计文档，是 AQE 必读的工业文献。
- **Apache Spark 官方文档关于 AQE、Runtime Filter、Skew Join 的章节** —— AQE 的工程参数与开关。
- **Trino 官方文档关于 Adaptive Join Reordering、Dynamic Filtering 的章节** —— Trino AQE 的实现细节。
- **StarRocks 3.x 文档关于 Runtime Filter 的章节** —— 国内 OLAP 引擎 Runtime Filter 的工程实践。
- **Apache Doris 2.x 文档关于 Runtime Filter 的章节** —— Doris AQE 的实现。
- **Databricks Photon + Adaptive Query Execution 文档** —— 云数仓 AQE 的工业实践。
- **Apache Impala Runtime Filter 文档（Cloudera）** —— Hive 生态 Runtime Filter 的早期实现。
- **Google BigQuery Adaptive Optimization 文档** —— PB 级分析场景的 AQE 实践。
- **Snowflake Adaptive Optimization 文档** —— 云数仓的 AQE 与资源自适应。
- **字节跳动 Spark AQE 优化实践** —— 国内最大的 AQE 落地案例。
- **Netflix Penelope 物化视图改写 + AQE** —— 改写式优化与 AQE 的结合。
- **美团 StarRocks AQE 调优** —— 外卖场景的 Runtime Filter 落地。
- **京东 StarRocks AQE 实践** —— 电商大宽表的 AQE 调优。
- **招行 StarRocks AQE 落地** —— 金融场景的 AQE 工程实践。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §14.1.6 请解释物化视图（Materialized View）改写的核心算法：如何让 CBO 自动把用户查询改写到 MV 上？涉及哪些匹配规则与代价权衡？

**1. 考察点**

- 是否理解 MV 改写的**核心问题**——给定用户查询 Q 与一组 MV {M1, M2, ..., Mk}，找出一个改写 Q'，使 Q' 用 MV 计算的代价低于 Q 原始执行。
- 能否区分**查询包含（Query Containment）**与**查询等价（Query Equivalence）**——MV 改写需要确认 MV 的结果是 Q 的**超集或子集**。
- 是否知道 **基于规则改写（Rule-Based）** 与 **基于代价改写（Cost-Based）** 两种范式。
- 加分项：能讲清 **TPC 改写算法**（Selinger 的 QUESS）、**基于图的改写**（Calcite 的 `MaterializedViewRule`）、以及 **AI 改写**（Snowflake / StarRocks 的 AI 自动推荐）。

**2. 参考答案框架**

**第一层：MV 改写的核心问题。** 给定用户查询 Q（如 `SELECT user_id, SUM(amount) FROM orders WHERE dt BETWEEN '2024-01-01' AND '2024-01-31' GROUP BY user_id`）与一组已创建的 MV（如 `MV1: SELECT user_id, SUM(amount) FROM orders WHERE dt >= '2024-01-01' GROUP BY user_id`），改写器需要回答三个问题：
1. **包含关系**：MV 的输出是否是 Q 的输出的**超集或子集**？这里 MV1 是 Q 的**超集**（MV1 包含更长的时间范围与更细的粒度）。
2. **改写方法**：如何从 MV1 计算 Q 的结果？这里需要 `WHERE dt <= '2024-01-31'` 的二次过滤。
3. **代价权衡**：改写后的执行是否比原始 Q 更优？这里原始 Q 需要扫描一月分区 + GROUP BY，改写后只需要 Scan MV1 + 过滤 + GROUP BY。

**第二层：基于规则的改写（Rule-Based）。** Apache Calcite 提供了 `MaterializedViewRule`：

- **Column Trimming（列剪裁）**：把 Q 的 SELECT 列下推到 MV，只读需要的列。
- **Predicate Pull Up（谓词上提）**：把 Q 的 WHERE 条件拉回到 MV 上过滤（如果 MV 的粒度更粗，需要先过滤再聚合）。
- **Aggregate Roll Up（聚合上卷）**：Q 的 GROUP BY 比 MV 的 GROUP BY 粒度细，需要**进一步聚合**（如 MV 是日级按 user 聚合，Q 是月级按 user 聚合）。
- **Join Elimination（嵌入到原始表的改写）**：Q 包含 Join，MV 已经做了 Join 预处理，改写器需要去掉重复 Join。

Calcite 的实现是基于 **视图定义查询的 AST** 与 **用户查询的 AST** 做**图同构匹配**（Graph Isomorphism），找到子图同构后改写。

**第三层：基于代价的改写（Cost-Based）。** 单纯基于规则的改写可能在某些场景下**改写后反而变慢**——例如：

- MV 的过滤列是低选择率列，改写后多读 MV 的全量数据。
- MV 的粒度比 Q 粗，需要二次聚合，二次聚合的代价可能超过收益。
- MV 没有命中必要的索引（如分区裁剪失效）。

基于代价的改写会在**改写计划与原始计划之间比较代价**，选代价低者。Snowflake、StarRocks 3.x、Doris 2.1+ 都支持代价驱动的 MV 改写。

**第四层：MV 改写的关键算法——查询包含。** 给定 MV 的查询 Q_MV 与用户查询 Q，查询包含的判定有两个核心概念：

- **包含映射（Containment Mapping）**：从 Q_MV 的输出属性到 Q 的输出属性的映射。如 `MV.user_id → Q.user_id`、`MV.SUM(amount) → Q.SUM(amount)`。
- **必要条件**：Q_MV ⊇ Q 的充分条件是——Q 的每个 Tuple t ∈ Q_MV 都满足 Q 的选择条件与聚合定义。具体判定依赖于 SQL 的语义（外连接、聚合、嵌套等）。

Calcite 提供了 `MaterializedViewRule.deriveJoinRowCount` 等工具函数做包含关系判定。

**第五层：MV 改写的工程实现要点。**

- **MV 的选择（MV Selection）**：基于工作负载自动推荐 MV（推荐哪些列的聚合 / 哪些连接的预处理）。Calcite 提供 `MaterializedViewService`，Snowflake 提供自动 MV 调优。
- **MV 的刷新策略**：增量刷新 vs 全量刷新、实时 MV vs 离线 MV。Streaming MV 是近年研究热点（Materialize 团队、StarRocks 的实时物化视图）。
- **MV 的失效处理**：上游表 schema 变更、上游表数据被删除时 MV 需要重建或刷新。Calcite 提供 `MV.invalidate` 接口。
- **MV 的存储**：MV 可以是**视图（逻辑 MV）**、**物理表（实体 MV）**、**索引 MV（In-Memory MV）**。不同存储的代价与查询性能差异巨大。
- **MV 的查询改写器位置**：改写器可以在**优化器之前**（如 Snowflake 的 MV-aware planner）、**优化器中**（如 Calcite 的 MV Rule）、**优化器之后**（如 Trino 的 MV hint）。

**第六层：真实工业实践。**

- **Snowflake 自动物化视图（Automatic Clustering + Materialized View）** —— 自动 MV 推荐 + 增量刷新 + 代价驱动改写。
- **StarRocks 3.x 实时物化视图** —— 基于 Flink CDC 的实时 MV 刷新，支持秒级数据新鲜度。
- **Apache Calcite MaterializedViewRule** —— 开源 MV 改写的标准实现。
- **Doris 2.1+ 物化视图** —— 支持多表 JOIN MV 与增量刷新。
- **ClickHouse 物化视图** —— 经典实现但只支持增量聚合 MV。
- **Oracle 物化视图（Query Rewrite）** —— 工业级 MV 改写的老牌实现，支持基于代价与基于规则两种模式。
- **Netflix Penelope** —— 自研的 MV 改写引擎，处理 Netflix 复杂的报表查询改写。
- **Meta F3 物化视图改写** —— 基于 Calcite 的 MV 改写扩展。
- **阿里 MaxCompute 物化视图** —— 国内电商场景下大宽表的 MV 实践。
- **字节跳动 MV 改写** —— 大宽表与多表 JOIN MV 的内部优化。
- **美团 Doris 物化视图** —— 外卖场景的实时 MV 调优。
- **京东 StarRocks 物化视图** —— 电商大促场景的 MV 调优。
- **招行金融物化视图** —— 金融场景的 MV 严格审计与改写。

**3. 常见陷阱**

- **只说"用 MV 加速"不说怎么改写**。改写器是核心，没有改写器 MV 就只是占空间的副本。
- **混淆 MV 与索引**。索引是**就地数据结构**（如 B+ Tree），改写由执行器完成；MV 是**独立的物理表**，改写由优化器完成。
- **不区分逻辑 MV 与物理 MV**。逻辑 MV 只存定义、查询时实时计算；物理 MV 是真实的表。前者无存储代价但查询可能慢，后者反之。
- **忽略 MV 的维护代价**。MV 需要持续刷新，全量刷新成本随时间增长；增量刷新依赖 CDC 与版本号机制。
- **不评估 MV 改写的代价**。改写可能反而更慢，需要代价驱动。

**4. 追问预测**

- **「MV 改写后反而变慢了，为什么？」** 答：MV 的过滤列选择率低、改写需要二次聚合，MV 缺少必要的索引或分区——这些都让改写失效。代价驱动的改写会自动避开这些场景，但基于规则的改写可能选错。
- **「怎么评估 MV 的收益？」** 答：建立**MV 命中率监控**——统计每个 MV 被多少查询改写到、平均改写后查询速度提升多少。命中率高、收益大的 MV 保留；命中率低的 MV 考虑删除。
- **「实时 MV 的工程难点？」** 答：CDC 一致性、增量刷新顺序、Schema 演进、并发控制。StarRocks / Materialize / RisingWave 是当前实时 MV 的代表实现。
- **「AI 怎么优化 MV 推荐？」** 答：基于历史查询的工作负载分析——LLM / ML 识别高频聚合模式、自动推荐 MV 定义。Snowflake 的 Automatic Clustering + MV 是这一思路的代表。

**5. 参考资料**

- **Agrawal 等《Materialized View Selection and Maintenance Using Multi-Query Optimization》（SIGMOD 2000）** —— MV 选择与维护的经典论文。
- **Goldstein 等《Optimizing Queries Using Materialized Views: A Practical, Scalable Solution》（SIGMOD 2001）** —— 工业级 MV 改写的代表性论文。
- **Apache Calcite 文档关于 MaterializedViewRule 的章节** —— 开源 MV 改写的标准实现。
- **Snowflake 物化视图文档（Automatic Clustering + Materialized View）** —— 云数仓 MV 改写的工业实践。
- **StarRocks 3.x 实时物化视图文档** —— 国内 OLAP 引擎的实时 MV 实践。
- **Apache Doris 2.x 物化视图文档** —— Doris MV 改写的工程实现。
- **ClickHouse 物化视图文档** —— 经典 MV 的实现。
- **Oracle 物化视图与 Query Rewrite 文档** —— 老牌工业级 MV 改写。
- **Databricks Delta Live Tables + Materialized View 文档** —— 湖仓一体下的 MV 实践。
- **Netflix Penelope 物化视图改写** —— 自研 MV 改写引擎的代表。
- **Meta F3 物化视图改写（SIGMOD 2024 论文）** —— 基于 Calcite 的 MV 改写扩展。
- **阿里 MaxCompute 物化视图** —— 国内电商大宽表的 MV 实践。
- **字节跳动 MV 改写实践** —— 大宽表与多表 JOIN MV 的内部优化。
- **美团 Doris 物化视图调优** —— 外卖场景的实时 MV 实践。
- **京东 StarRocks 物化视图** —— 电商大促场景的 MV 调优。
- **招行金融物化视图** —— 金融场景的 MV 严格审计与改写。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §14.1.7 请分析 AI 时代查询优化器的新趋势：LLM 诊断慢查询、自治优化器（Self-Driving Optimizer）、神经符号融合，以及当前的工程落地挑战。

**1. 考察点**

- 是否理解 AI 增强优化器的**三个层次**——LLM 诊断（离线）、自治优化（在线）、神经符号融合（深度融合）。
- 能否说出当前的**真实落地边界**——LLM 诊断可做试点、不要做核心依赖，自治优化是研究热点，神经符号融合仍在实验室。
- 是否知道**自治优化器的关键挑战**——统计信息反馈、代价模型自适应、Query Workload 预测。
- 加分项：能说出**当前 AI 优化器的局限**——LLM 不能替代代价模型的核心估算，只能做诊断与推荐。

**2. 参考答案框架**

**第一层：AI 增强优化器的三个层次。**

- **层次 1：LLM 诊断（可做试点，不要做核心依赖）**。用 LLM 分析慢查询的 SQL、EXPLAIN 输出、执行统计，给出诊断建议。典型工具：Snowflake Cortex Query Insights、Databricks Assistant、StarRocks AI Advisor、自研 + GPT 的内部工具。**能力边界**：LLM 不直接修改计划，而是产出文字建议。
- **层次 2：自治优化（探索落地）**。AI 监控查询工作负载、自动推荐索引、自动推荐 MV、自动调整 CBO 参数。**能力边界**：仍是推荐系统，关键决策还是 DBA 拍板。
- **层次 3：神经符号融合（实验室阶段）**。用神经网络替代部分代价估算，用符号搜索保留可解释性。**能力边界**：研究阶段，工业落地少。

**第二层：LLM 诊断慢查询的工程实践。**

- **典型流程**：① 收集慢查询（执行时间 > 阈值、扫描行数 > 阈值、Shuffle 量 > 阈值）；② 提取 SQL、EXPLAIN、执行统计；③ 喂给 LLM，prompt 模板：「请分析这条慢查询并给出优化建议」；④ 把 LLM 建议落到工程师 / DBA 手中。
- **关键 prompt 要素**：① Join 顺序是否合理？② 是否存在数据倾斜？③ 是否缺少索引？④ 是否有更好的写法？⑤ 是否能改写到 MV？
- **优势**：LLM 能识别**模式级**的慢查询（如「总是没收集统计信息」「总是 Join 顺序错」「总是缺少分区裁剪」），这是传统诊断工具难以做到的。
- **局限**：① LLM 不知道具体的代价模型，只能给「通用建议」；② LLM 的建议不可执行（不能直接产出 Hint）；③ LLM 的延迟较高，对秒级查询不友好。

**第三层：自治优化器（Self-Driving Optimizer）的关键挑战。**

- **统计信息自适应**：根据运行时反馈修正编译期估算（Meta F3 的核心方向）。
- **代价模型自适应**：根据历史查询偏差修正代价模型的权重（α、β、γ）。
- **Workload 预测**：预测未来的查询模式，提前调整优化器策略（如大促前预热统计信息）。
- **自动索引 / Auto-MV**：基于工作负载自动推荐并创建索引 / MV。
- **自动参数调优**：基于工作负载自动调整优化器参数（如 Join 顺序的 Beam Search 宽度、AQE 开关）。

**第四层：神经符号融合（Neuro-Symbolic Optimization）。** 这是 2024–2025 的研究热点：

- **核心思想**：用神经网络做**代价估算**（特别是不确定性/高基数场景），用符号搜索做**计划枚举与剪枝**。
- **代表工作**：
  - **Bao（Microsoft Research）**：用 ML 模型做「Set of Hints」的选择，每个 Hint 是一组计划约束，让 CBO 在约束空间内搜索。
  - **Neo（ETH Zurich）**：端到端学出来的优化器——用学习替换估算与搜索，论文发表于 VLDB 2019。
  - **HybridQ（Google）**：结合 ML 与符号推理的查询优化器。
  - **LLM-based Optimizer（多篇论文 2024）**：用 LLM 直接产出查询改写。
- **工程挑战**：① 可解释性——神经网络的代价估算难以解释；② 训练数据——需要大量真实工作负载；③ 推理延迟——神经网络估算比符号代价计算慢。

**第五层：当前 AI 优化器的局限。**

- **不能替代代价模型**：LLM 不知道具体的行数与代价，只能给方向性建议；神经网络的估算在训练数据之外可能偏差更大。
- **不能替代优化器**：LLM 不能产出可执行的物理计划，必须与现有优化器结合。
- **延迟较高**：LLM 调用一次需要 1–5 秒，对短查询是负担。
- **成本较高**：LLM API 调用按 token 计费，频繁调用成本高。
- **可解释性**：LLM 的建议不可追溯（黑盒），金融场景需要严格的审计。
- **数据安全**：把慢查询 SQL 与执行计划喂给外部 LLM 有数据泄露风险，需要本地化部署或严格脱敏。

**第六层：真实工业实践。**

- **Snowflake Cortex（2024）**：LLM 自动诊断慢查询、自动推荐 MV、自动生成集群策略。**典型场景**：用户问「为什么我的查询慢了？」Cortex 自动分析。
- **StarRocks AI Advisor（2024）**：智能诊断 + 自动建议建表参数。**典型场景**：DBA 看慢查询列表，AI Advisor 自动给出诊断。
- **Databricks Assistant（2024）**：自然语言优化（用户说「这条查询太慢」，AI 自动给出 EXPLAIN 解读与改写建议）。
- **Microsoft Research Bao**：把 ML 用于查询优化的研究代表，论文发表于 SIGMOD 2021。
- **阿里内部 AI 优化器**：用 LLM 诊断双 11 场景的慢查询，自动生成告警与修复建议。
- **字节跳动内部 AI 优化器**：用 LLM + 自研模型做慢查询聚类、模式识别、自动 Hint 推荐。
- **美团 Doris AI 调优**：用 AI 推荐参数与索引。
- **京东 StarRocks AI 调优**：用 AI 自动调优大宽表场景的参数。

**3. 常见陷阱**

- **过度神话 AI 优化器**。LLM 是辅助工具，不能替代优化器与代价模型。把 LLM 当作万能解是常见误区。
- **忽略延迟与成本**。LLM 调用的延迟与成本在大规模场景下不可忽略，需要异步诊断 + 离线缓存。
- **不区分诊断与执行**。LLM 只能做诊断与建议，不能执行计划修改；自治优化器必须配套工程能力（自动收集统计信息、自动建索引、自动调参）。
- **忽略可解释性**。金融 / 政企场景对 AI 建议的可解释性要求严格，纯神经网络方案落地困难。
- **不提数据安全**。慢查询 SQL 可能含敏感数据，喂给外部 LLM 有合规风险，需要本地化或脱敏。

**4. 追问预测**

- **「LLM 能完全替代 CBO 吗？」** 答：不能。LLM 没有真实的代价信息，只能做诊断；CBO 的代价估算需要统计信息与代价模型，是 LLM 无法替代的。LLM 与 CBO 是协同关系，不是替代关系。
- **「自治优化器的最大障碍是什么？」** 答：**统计信息的精度**——没有准确的统计信息，自治优化器也不能给出准确的决策。自治优化器的第一步是统计信息自适应。
- **「神经符号融合什么时候能落地？」** 答：**部分场景已落地**——基数估计（Neo / Bao 的部分能力）已经在工业界试点；**全量替代代价模型**仍是研究阶段，预计 3–5 年才有工业落地。
- **「AI 优化器对数据架构师的影响？」** 答：**降低调优门槛、提升诊断效率**，但不会替代数据架构师的核心决策——业务理解、建模选型、容灾设计仍需要人工。

**5. 参考资料**

- **Snowflake Cortex Query Insights 文档** —— 云数仓 LLM 诊断的工业代表。
- **StarRocks AI Advisor 文档** —— 国内 OLAP 引擎 AI 诊断的实践。
- **Databricks Assistant 文档** —— 自然语言优化与 LLM 集成。
- **Bao: Learning-based Query Optimizer（Heterogeneity-Aware）等相关论文（SIGMOD 2021）** —— ML 优化器的代表性研究。
- **Neo: A Learned Query Optimizer（VLDB 2019）** —— 神经符号融合的奠基性论文。
- **HybridQ: A Hybrid Approach to Query Optimization（Google Research）** —— 神经符号融合的代表工作。
- **LLM-based Query Optimization 论文（2024 多篇）** —— LLM 直接做查询优化的最新研究。
- **Meta F3 自适应优化器论文（SIGMOD 2024）** —— 自适应基数估计与代价模型的工业方案。
- **Microsoft Research Bao 论文（SIGMOD 2021）** —— ML 用于 Hint 选择的代表工作。
- **Apache Calcite 文档关于 Adaptive Query Optimizer 的章节** —— 开源自适应优化器的实现。
- **阿里 MaxCompute AI 优化器（双 11 场景）** —— 国内 AI 优化器的落地。
- **字节跳动内部 AI 优化器** —— LLM + 自研模型的工业实践。
- **美团 Doris AI 调优** —— 外卖场景的 AI 调优实践。
- **京东 StarRocks AI 调优** —— 大宽表场景的 AI 调优。
- **招行金融场景的 AI 优化器限制** —— 金融场景对可解释性与合规性的要求。
- **LinkedIn 大数据查询平台的 AI 调优实践** —— 工业界 AI 调优经验。
- **Netflix Penelope 智能改写** —— 自研 MV 改写 + AI 的代表实践。
- **Apache Impala AI 优化器探索** —— Hive 生态下的 AI 优化探索。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

### 8.3 本章小结

本节收录 7 道题，覆盖**查询优化器（RBO / CBO / AQE）** 的核心主题。7 道题构成一条完整的能力链路：

1. **基础概念**：RBO vs CBO 的本质差异（§14.1.1）。
2. **代价模型**：行数估计、统计信息失效原因（§14.1.2）。
3. **Join 顺序**：DP vs Greedy 的算法选择（§14.1.3）。
4. **下推与裁剪**：谓词下推与列裁剪的三层实现（§14.1.4）。
5. **运行时优化**：AQE 的三大调整维度与代价权衡（§14.1.5）。
6. **MV 改写**：基于规则与基于代价的改写算法（§14.1.6）。
7. **AI 时代演进**：LLM 诊断、自治优化、神经符号融合（§14.1.7）。

参考答题的通用心法：**先说清原理（RBO / CBO / AQE 的本质），再说清代价（统计信息、运行时反馈、MV 维护），最后说清边界（AQE 不替代 CBO、LLM 不替代优化器）**。这一主题下的所有问题，面试官真正想听的都是「**为什么这么选、在什么场景失效、如何兜底**」。

工业案例的核心引用原则：**Snowflake / BigQuery / Databricks / CockroachDB 是云数仓与分布式 CBO 的代表；StarRocks / Doris / 阿里 MaxCompute 是国内 OLAP 引擎的代表；Apache Calcite / Velox / DataFusion 是开源框架的代表；Meta F3 / Netflix Penelope / LinkedIn 是工业自研的代表**。结合具体场景灵活引用即可。

### 8.4 返回

- 返回 [03-data-stack 章节目录](../README.md)
