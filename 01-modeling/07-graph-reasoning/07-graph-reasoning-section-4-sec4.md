> 本文件是 **07-graph-reasoning.md** 的子文件（§4. 工程实现）。本节讲怎么把 [§ 3 设计模式与范式](07-graph-reasoning-section-3-sec3.md) 里选定的推理模式，装进一个已有数仓、已有决策链路的组织：顺序、判据、产物、存量迁移与谁负责。图的形式化定义与消息传递公式见 [§ 2 核心原理](07-graph-reasoning.md)。完整章节请回到 [index](07-graph-reasoning.md)。

## 4. 工程实现

图推理的落地顺序与「先选模型」的直觉相反：**先把图的语义定下来，再决定用什么模型**。顺序反了不会报错，它只会让团队在数月后拿到一个指标尚可、但业务解释不通的模型 —— 而那时改动成本已经很高。

本节按 7 个步骤展开（4.1，Step 0 → Step 6）。每一步给三件事：**产物**（手上多出来的、可被检查的东西）、**判据**（做的过程中就能自查的动作）、**为什么必须这一步**（顺序理由）；4.2 逐项给机制与失效条件；4.3 给工具选型判据（工程侧的核心是「图怎么建、怎么算、怎么取」）；4.4 专题讲存量规则与既有模型怎么迁；4.5 给五个可套用的模板。

读者分两类：**从零搭建**的团队按 Step 0 → 6 顺序走；**存量改造**的团队（已有数仓分层、已有 OneID / OneData 基础、已有风控或推荐规则）建议先读 4.4 —— 他们的第一版收益通常来自「只读的图投影 + 图特征」，而不是 GNN。本节不复述 §3 的模式结构，只回答「选定之后怎么装」。

### 4.1 落地步骤

**Step 0：业务对齐（1–2 周【经验】）**

- 明确三件事：用什么图、解决什么问题、ROI 怎么算。
- 写下「这次要判别的信号在图上存在的最小单位」—— 是一个节点的邻域、一条边、一组实体的形状，还是一张图本身（判据见 §3.8）。
- 同步定基线：现在没有图的时候这个决策靠什么做（规则 / 图特征 + 梯度提升树 / 人工审核），并记下它当前的指标。
- **产物**：一页问题定义 + 判定单元 + 基线指标 + ROI 口径。
- **判据**：能否用一句话说出「信号的最小单位」，并当场报出「现状基线的指标是多少」？答不出后者，模型上线后没有任何对照，无法证明图推理带来了增量。
- **为什么必须这一步**：判定单元决定 Step 1 的 schema 要抽多细、Step 4 选哪个模型族；它放在最前面，是因为它是唯一一个改动会牵动整条链路的决定。

**Step 1：数据建模（2–6 周【经验】）**

- OneID / OneData 先行：实体对齐到 OneID，边来自 OneData 标准化的业务过程事件。
- 定义节点类型、边类型、边语义、边特征、边的生命周期（TTL）与责任人；schema 的声明方式参考本体建模与知识图谱两章。
- 每条边必须能被一句话讲清语义与口径 —— 「同一设备」与「同一收货地址」是两条不同的边，不是同一张图的两种画法。
- **产物**：图 schema 文档（节点类型 / 边类型 / 边语义 / 边属性 / TTL / Owner）。
- **判据**：抽 3 条边，能否说出它的语义、口径与生命周期？说不出即违反图构建纪律（§3.7 第一条）。
- **为什么必须这一步**：图构建在上游是 OneData 业务过程的「图投影」。这一步没做，两个团队会画出一张连不上、也对不齐的图，而两张图各自都能跑出不错的离线指标 —— 问题要到上线后才暴露，且无法归因。

**Step 2：图构建（4–8 周【经验】）**

- 三层管道按边的时效要求分别落位：**离线批量**用 Spark / Flink / MaxCompute SQL 从 ODS / DWD 生成边表 `(src_id, dst_id, edge_type, edge_weight, ts, attrs)`；**近实时 / 实时**用流式图构建（Flink CEP / Flink Gelly 一类、NebulaGraph Exchange 流模式、GraphScope Streaming 一类）配合 CDC（Debezium / Flink CDC / Maxwell 一类）做图更新。
- 载入图存储：Neo4j CSV 导入、NebulaGraph Importer / Exchange、TigerGraph Loading、GraphScope 离线落 Iceberg 一类；外部图（KG / 公开数据集）单独走一条导入路径。
- 快照策略：每天或每小时一张全量图 + 增量 binlog。
- **产物**：边表 + 图存储 + 全量快照与增量日志 + 构建作业清单（作业名到边类型的映射）。
- **判据**：抽 3 类边，看边表里是否都有 `ts`、`edge_type`、`edge_weight` 与来源作业名？缺 `ts` 的边做不了时间快照，也就无法回放模型输入。
- **为什么必须这一步**：模型输入的可复现性在这里决定。没有 `ts` 与快照，任何一次效果异常都无法回到当时的图去复现，复盘会退化成猜测。

**Step 3：特征与样本（2–4 周【经验】）**

- 特征分四类：节点原始特征、节点图特征、边特征、子图特征（清单见 4.2），并决定哪些进 Feature Store。
- 样本：正样本按业务定义（已确认欺诈 / 已确认购买 / 已确认好评）；负样本用随机负采样 + 难负样本挖掘 + 归纳式样本（新节点 / 新图）。
- 泄漏防控：严格按时间切分训练 / 验证 / 测试，不能随机 shuffle；做链路预测时把边分裂（train / val / test edges），并把对应边从图中移除。
- **产物**：特征表 + 样本集（带时间切分）+ 实验记录里的负采样策略。
- **判据**：评估集是否按时间切分，并**单独统计了新节点（训练时不存在）上的表现**？只报全量指标等于没做评估。
- **为什么必须这一步**：随机 shuffle 会让模型看到未来信息；边不分裂时，待预测的边已经出现在训练用的图里，等价于把答案喂给模型。两者都表现为离线很好、上线失效。

**Step 4：模型训练（4–8 周【经验】）**

- 先跑「图特征 + 梯度提升树」基线，再决定是否上 GNN。
- 按判定单元选族（见 4.2）：节点分类 / 链接预测用 GraphSAGE + 注意力（GAT）或 PinSage；关系型 KG 用 R-GCN / CompGCN / HGT；图分类与子图匹配用 GIN / GCN + Pooling / 子图嵌入；大规模用 Cluster-GCN / GraphSAINT / GraphScope 一类分布式；跨图与零样本考虑图基础模型；要解释性用 GAT + GNNExplainer / PGExplainer 并输出路径证据；Graph Transformer（GraphGPS）一类在消息传递之外引入全局注意力，它算不算主流路线，可按其论文与官方实现仓库的更新情况自行核验。
- 采样参数（层数、fanout、采样轮数）与超参写进实验记录。
- **产物**：基线结果 + 模型 + 实验记录（含 fanout、层数、负采样策略）。
- **判据**：基线是否先跑过、并且留下可比的数字？没有基线的 GNN 结果回答不了「图到底带来了什么」。
- **为什么必须这一步**：多数团队的第一版收益来自图特征而非 GNN（§3.5 反模式）；把基线放在 GNN 之前，是为了让「继续投入」这个决定有对照。

**Step 5：推理服务（4–6 周【经验】）**

- 离线打分 + KV 缓存：节点嵌入存 Redis / HBase / FeatureDB 一类，业务低峰期刷新嵌入并推送。
- 在线推理按规模分档：小规模（十万节点以内【经验】）把模型直接加载在 GPU 节点上，用 PyTorch / TF Serving 出分；中规模（百万节点）用 DGL / PyG + 在线子图采样 + 嵌入缓存；大规模（亿节点）用 GraphScope / Ant Graph 一类在线推理 + 图查询引擎 + 模型服务分层。
- 冷启动：新节点没有图特征，用元数据 + 邻居平均 + 特征查找服务兜底。
- A/B 测试与影子流量：GNN 上线前跑 1–2 周量级的影子流量【经验】。
- **产物**：打分服务 + 特征查找服务 + 影子流量与 A/B 配置。
- **判据**：取当天新注册的一批实体，看它们能否被打分、延迟多少？转导式模型在这一问上会直接暴露。
- **为什么必须这一步**：图模型的失效大多发生在冷启动实体上；把特征查找服务与影子流量放在上线前，是把这类失效限制在观测范围内。

**Step 6：治理与运维（持续）**

- 图血缘（节点 / 边的来源表 + 转换逻辑 + 责任人）、图版本（全量快照 + 增量 binlog，支持任意时间点回溯）、图漂移监控（节点 / 边 / 标签分布 PSI、特征 IV 漂移、模型 AUC 漂移）、图质量（孤立节点比例、社区大小分布、长尾节点检测）、图安全（敏感实体脱敏、边上的差分隐私与 k-匿名）。
- **产物**：图版本与血缘记录 + 漂移看板 + 图质量报告 + 判定证据输出。
- **判据**：图是否有版本号与最后更新时间？业务问「为什么判这个分」时，手上有没有路径或子图证据？（没有证据时，这个模型无法进入需要举证的流程。）
- **为什么必须这一步**：图漂移未经记录地传到下游，表现就是「无法定位的模型漂移」；有版本与最后更新时间，才能把效果变化追到某一次图构建口径的变更。

七步里最常被跳过的是 **Step 1 的数据建模**与 **Step 4 的图特征基线**。跳过数据建模的症状不是「跑不出来」，而是「跑出来了但不对」：两批业务数据被合并成一张大图后，两个本来无关的实体因为某条中间边被连上，风控名单里出现业务上完全不相关的实体 —— 团队会先怀疑模型，最后才发现是边定义被合并了。跳过基线的症状出现得更晚（【经验】三个月量级）：指标没输给基线，但也不值得，而此时模型已接进决策链路，替换成本远高于当初跑一次基线。

### 4.2 关键技术点

**图构建（离线批量 / 近实时 / 实时三层）**

- **做法**：离线用 Spark / Flink / MaxCompute SQL 从 ODS / DWD 事实与维度表、OneID 主数据、OneData 标准化指标生成边表；近实时与实时用流式图构建 + CDC；载入 Neo4j / NebulaGraph / TigerGraph / GraphScope 一类图存储；每天或每小时一张全量快照 + 增量 binlog。
- **机制**：因为图是「业务过程的图投影」，所以边的唯一性只在投影规则被写下来时才成立 —— 同一批数据按「同一设备」与「同一收货地址」连边会得到两张互不对齐的图，而这两张图各自都能跑出不错的离线指标。
- **失效条件**：**当两个团队各自建图、且边定义没有登记与评审时，两张图无法合并**。症状：单图模型指标正常，合并后业务解释不通 —— 名单里出现业务上不相关的实体。
- **档位**：【经验】

**异构图 schema 与边的生命周期（TTL）**

- **做法**：声明节点类型（用户 / 商品 / 店铺 / 品牌 / 类目一类，N 种）与边类型（购买 / 收藏 / 点击 / 评论 / 关注一类，M 种）；元路径是「节点类型 + 边类型」交替的序列，共 K 条，显式挑选而非全枚举；每条边定义一个 TTL。
- **机制**：因为不同类型边的语义与时效都不同，边的半衰期决定它在聚合里应不应该被看见 —— 【经验】例如交易类边常在数十天量级（转账边约 30–90 天，随风控回溯窗口）、点击类边在天级（约 3–7 天，随归因窗口）、好友 / 亲属类边与主体同生命周期（长期保留）。这些是示例值，随业务风控窗口与存储成本变化，不是通用常数；正因如此 TTL 是图构建的一等参数，而不是清理策略。
- **失效条件**：**当不定义 TTL、让所有边永久保留时，历史噪声会永久进入邻居聚合**。症状：模型对很久以前的行为给出与当下同等的权重，线上表现为「行为早已结束的实体仍被高分关联」。
- **档位**：【经验】

**特征工程（节点 / 边 / 子图 + Feature Store 集成）**

- **做法**：节点原始特征（年龄、性别、等级、注册时间、最近 30 天消费）；节点图特征（度、PageRank 值、Louvain 社区 ID、k-core、连通分量 ID、2 跳邻居标签分布）；边特征（交易金额、时间戳、渠道、币种、置信度）；子图特征（节点数、边数、平均度、最大度、子图 embedding）。用 Feature Store（Feast / Tecton / 阿里 FeatureDB 一类）把图特征做成「在线可查的特征服务」。
- **机制**：因为图特征的收益来自结构而不是模型容量，把度、PageRank、社区标签挂到既有梯度提升树上就能拿到大部分收益 —— 这正是「先基线后 GNN」这个顺序有效的机制原因。
- **失效条件**：**当图特征是离线批算、在线推理时现算时，训练与服务的口径会分叉**。症状：离线 AUC 与线上效果长期对不上，差异随在线延迟预算收紧而放大 —— 特征查找服务的作用就是把这条分叉消掉。
- **档位**：【经验】

**训练样本与泄漏防控（时间切分、图分裂、负采样）**

- **做法**：正样本按业务定义；负样本用随机负采样 + 难负样本挖掘 + 归纳式样本；严格按时间切分训练 / 验证 / 测试，禁止随机 shuffle；做链路预测时把边分裂并从图中移除对应边。
- **机制**：因为模型学的是「过去的结构能否预测未来」，随机 shuffle 会把未来信息混进验证集，指标只反映记忆能力；边不彻底分裂时，待预测的边已经存在于训练用的图中。
- **失效条件**：**当评估按时间切分、但没有单独统计新节点时，「归纳能力」这件事依然没有被测到**。症状：冷启动实体上线后被统一打到默认分，而离线指标一切正常 —— 修法是把新节点占比与其上的表现单列一栏。
- **档位**：【经验】

**模型选型（判定单元与归纳性优先）**

- **做法**：按判定单元选族（参考 §3.3 模式选择决策表）；归纳式（GraphSAGE / GAT / PinSage 一类）优先。
- **机制**：因为聚合用的是「采样出来的邻居」而不是「全图归一化邻接矩阵」，归纳式模型能给训练时没见过的节点直接打分 —— 这是它在工业场景成为首选的根本原因，而不是精度更高。
- **失效条件**：**当图是同配性弱的（邻居与自身标签不相关，例如热门内容被各类用户共同消费）时，「邻居信号 = 标签信号」这个前提不成立**，越聚合越接近噪声。症状：加深层数后指标不升反降。
- **档位**：【经验】

**在线推理与冷启动**

- **做法**：离线打分 + KV 缓存（嵌入存 Redis / HBase / FeatureDB，低峰刷新）；在线按规模分档（十万 / 百万 / 亿节点，【经验】分档）；冷启动用元数据 + 邻居平均 + 特征查找服务兜底；上线前跑 1–2 周量级影子流量【经验】。
- **机制**：因为采样后的感受野随层数按 fanout 增长（【推算】fanout=10、K=3 时单节点感受野约 10³ 量级，未去重），在线推理的成本由 **fanout 的层数次幂**（去重前）决定，而不由节点数决定 —— 这就是分档门槛来自显存与延迟、而非数据规模的原因。
- **失效条件**：**当新节点占比高而模型是转导式时，冷启动兜底会把大量实体打成同一个默认分**。症状：新老实体的分数分布出现明显断层（画一张分布图即可确认）。
- **档位**：【推算】（感受野与 fanout 的关系）／【经验】（分档阈值与影子期长度）

**图治理（血缘 / 版本 / 漂移 / 质量 / 安全）**

- **做法**：图血缘、图版本、图漂移监控（PSI / IV / AUC）、图质量（孤立节点比例、社区大小分布、长尾节点）、图安全（脱敏、差分隐私、k-匿名）。
- **机制**：因为图上偏差会被传播放大（邻居聚合会把已有偏差再复制一层），公平性与敏感边处理必须在图构建阶段做，放到模型输出之后校正已经晚了。
- **失效条件**：**当图没有版本与最后更新时间时，下游模型漂移无法定位**。症状：模型效果某天起缓慢下滑，数据侧一切正常，复盘时无法判断是哪次图构建口径变更造成的。
- **档位**：【经验】

### 4.3 工具链与平台

| 类别 | 候选 | 选型判据（在什么约束下选哪个） | 不选它的代价 |
| --- | --- | --- | --- |
| 图 / GNN 训练框架 | PyTorch Geometric (PyG) / DGL（含 GraphBolt 大图训练）/ tf-gnn / Spektral / Jraph | 与既有训练栈同源（PyTorch → PyG，TF → tf-gnn，JAX → Jraph）；要大图采样与多机 → DGL 或 PyG 的采样器；要复现论文 → 优先选论文实现所在的那个库 | 换栈意味着模型与采样器都要重写，可用算子面同时变窄 |
| 工业级分布式图训练 | 阿里 GraphScope（含 Flex / Cluster / AutoML 等组件）/ Aligraph（沉淀了 EGES、ESMM、GraphSAGE 等模型）/ Ant Graph（Ant Graph Learn）/ 腾讯 Plato / 华为 Euler / 百度 Paddle Graph / DGL-KE / PyTorch BigGraph | 边数进入十亿量级、单机放不下 → 分布式图引擎；只需要大图嵌入而不是 GNN → DGL-KE / PyTorch BigGraph 这类专做大图嵌入的库；风控场景且团队能自建 → 参考厂商方案的开源部分 | 单机采样训练在亿级以上会卡在显存与通信，靠加机器解决不了 |
| 图数据库 / 图计算 | Neo4j（含 GDS、NaLLM 一类 LLM/Cypher 集成）/ NebulaGraph（含 Explorer 一类可视化组件）/ TigerGraph / ArangoDB / Memgraph / Amazon Neptune / Azure Cosmos DB（Gremlin API）/ JanusGraph / Kùzu / Apache TinkerPop 与 Gremlin | 点查与沿关系遍历是一等需求 → 图数据库；只要聚合统计 → 回列存；嵌入式本地分析 → 嵌入式图库；要标准查询语言 → 走 Cypher / Gremlin 一类；要托管 → 云厂商方案 | 用遍历型存储做聚合型任务性能差一个量级【经验】；反过来用列存做多跳遍历要反复 JOIN |
| GraphRAG 工具 | Microsoft GraphRAG / Neo4j LLM Knowledge Graph Builder / NebulaGraph GraphRAG / Ant Group Ant GraphRAG / LlamaIndex GraphRAG / LangChain GraphRAG / Kùzu GraphRAG / LightRAG / FastGraphRAG | 需要「全局性问题」的社区摘要 → 选做社区发现 + 摘要的路线；只要多跳事实问答 → 选图查询 + 向量双路；已有图库 → 优先用它官方的 GraphRAG 组件，实体归一才能与主数据同口径 | 索引期重复做实体抽取与归一，两套实体口径会让图碎成互不相连的孤岛 |
| 图基础模型 / 新工具 | OpenGraph / OFA（One-For-All）/ G-Retriever / LLaGA / GraphGPT / KG-GPT / ToG（Think-on-Graph）/ RoG / AnyGraph / UniGraph / GraphAlign | 下游任务多、标签少 → 先用公开骨干跑零样本，与「图特征 + 梯度提升树」基线对比，赢了才进入预训练投入；文本属性重的图 → 选图与文本对齐的路线；只要多跳问答 → 走 LLM-as-Reasoner over KG 一类方法，不必自建骨干 | 单任务自建预训练摊不平成本，且骨干更新会波及所有下游任务 |
| 图可视化 | Neo4j Browser / Bloom / NebulaGraph Studio / Dashboard / Gephi / Cytoscape.js / Graphistry / AntV G6 / AntV X6 | 只做排障与讲解 → 用图库自带的可视化；要看大规模图的全局结构 → 面向大图的可视化；要嵌进产品前端 → 前端图可视化库 | 用产品级前端库做一次性排障，或把学术工具接进产品，都会在规模上翻车 |

表里最容易被误选的是**图数据库**：团队把「做图推理」等同于「上一套图数据库」，于是把全表聚合与统计类查询也放到图库上跑。图库的机制是沿关系做遍历与点查，聚合扫描不是它的强项，性能会差一个量级【经验】（§3.5 的「图数据库当万能存储」）。第二个高频误选是**自建分布式图训练**：在亿级边以下【经验】，通用分布式框架的分区与通信开销常常吃掉全部收益，而「单机采样 + 图分区」往往已经够用，判断依据见 §3.6 的规模跃迁表。此外，本节不锁定各库的版本号 —— 具体某个版本支持哪些能力（向量索引、GraphRAG 组件、采样器特性），请以官方文档当前版本为准。

### 4.4 存量迁移

**① 先做什么：可立刻见效、且能整体回退**

不要先碰线上决策链路。第一步是建一个**只读的图投影**：从已有 DWD 事实表里挑 1–2 类语义最清楚的边（例如「同一设备」「同一收货地址」）建出小图，只跑图算法（社区发现、度分布、PageRank、连通分量）产出可解释的结构特征，挂到现有规则或既有梯度提升树上。整个动作只新增特征列，撤回即恢复原状。**判据**：这些特征在既有模型里是否拿到非零重要性？拿到才继续投入；拿不到说明「关系链路」在这条业务线上不是核心信号，应当停下而不是加码 —— 这是本节最省钱的一次判断。

**② 历史资产怎么分类处理**

存量规则与模型不该一刀切重写，按「是否会被图特征替代」分三类：

- **可被替代的**（靠关系的人工规则，如「同设备多账号」）：迁到图特征 + 模型打分，原规则保留为否决项而不是直接删除。
- **应保留的**（监管硬性要求、需要逐条举证的规则）：保留判定逻辑，图只作为旁路证据输出。
- **挂账打标的**（无标注、无法评估的规则与模型）：打上「未评估」标记，等有样本再回头，而不是现在强行迁移。

**判据**：抽 20 条现有规则，三类各占多少？若「可被替代的」占比低，说明这条业务线上图推理的收益主要来自可解释性而非精度，投入方向（做证据链而不是做模型）应据此调整。**注意**：只把「历史数据缺失」当作挂账理由是不够的 —— 挂账项要写明责任人，否则它会永久停在未评估状态。

**③ 迁移期的双轨怎么维持、维持多久**

图模型与既有规则并行打分，影子流量通常 1–2 周量级【经验】。

- **影子期**：图模型只打日志不生效，与线上判定逐条比对**一致率与分歧分布**。分歧分布比对一致率更有信息量 —— 它说明新模型在哪里改判，而改判正是要评审的部分。
- **灰度期**：按实体维度灰度，而不是按流量比例灰度。同一实体在新旧两套下必须判定一致，否则业务方看到的解释是矛盾的。
- 时长判断依据是**分歧分布的稳定性**，不是日历：分歧集中在长尾时可以先放核心链路，分歧在高峰期集中出现则说明特征新鲜度不够，要先把特征链路补齐。

**④ 什么信号说明可以退出双轨**

三个条件同时成立才切主：**分歧类型已收敛**（不再出现新的分歧模式）；**人工审核通过率不低于既有规则**；**图版本可回溯**（能对任意一次线上判定重放当时的图状态）。只满足前两条就切主，通常会在一次「无法复现的判定」上卡住 —— 业务方追问时无法重放当时的图，等于没有举证能力，而这恰恰是图推理相对纯模型的主要卖点之一。

### 4.5 模板 / 示例

**例 1：PyG + GraphSAGE 做节点分类（归纳式基线）**

```python
import torch, torch.nn.functional as F
from torch_geometric.nn import SAGEConv
from torch_geometric.datasets import Planetoid   # 公开数据集 API：Planetoid；示例用 Cora 跑通

dataset = Planetoid(root='/tmp/Cora', name='Cora')
data = dataset[0]

class GraphSAGE(torch.nn.Module):
    def __init__(self, in_dim, hidden_dim, out_dim, num_layers=2, dropout=0.5):
        super().__init__()
        self.convs = torch.nn.ModuleList([SAGEConv(in_dim, hidden_dim)])
        for _ in range(num_layers - 2):
            self.convs.append(SAGEConv(hidden_dim, hidden_dim))
        self.convs.append(SAGEConv(hidden_dim, out_dim))
        self.dropout = dropout

    def forward(self, x, edge_index):
        for i, conv in enumerate(self.convs):
            x = conv(x, edge_index)
            if i < len(self.convs) - 1:
                x = F.dropout(F.relu(x), p=self.dropout, training=self.training)
        return F.log_softmax(x, dim=-1)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = GraphSAGE(in_dim=dataset.num_node_features, hidden_dim=64,
                  out_dim=dataset.num_classes).to(device)
data = data.to(device)          # 模型与图必须同设备，只 to 模型不 to 数据会在第一次前向时报设备不匹配
opt = torch.optim.Adam(model.parameters(), lr=0.01, weight_decay=5e-4)
for epoch in range(200):
    model.train(); opt.zero_grad()
    out = model(data.x, data.edge_index)
    loss = F.nll_loss(out[data.train_mask], data.y[data.train_mask])
    loss.backward(); opt.step()

# 评估
model.eval()
pred = model(data.x, data.edge_index).argmax(dim=-1)
correct = (pred[data.test_mask] == data.y[data.test_mask]).sum()
acc = int(correct) / int(data.test_mask.sum())
print(f'Test Accuracy: {acc:.4f}')
# 关键：Cora 的 test_mask 是随机切分，只用来验证代码跑得通；
# 换成真实业务图时，test_mask 必须落在「时间上更晚」的节点上，不能从全量里随机切
```

**怎么用**：把 `SAGEConv` 换成你们的数据加载器（NeighborLoader 一类）与真实图；`hidden_dim` / `num_layers` 按 §3.5 的告警从 3 层以内起步。**不要照抄**这里的训练循环 —— 它是最小可跑版本，没有采样、没有早停、没有验证集监控。

**例 2：PyG + GAT 做归纳式节点分类（可解释场景优先）**

```python
from torch_geometric.nn import GATConv

class GATNet(torch.nn.Module):
    def __init__(self, in_dim, hidden_dim, out_dim, heads=4):
        super().__init__()
        self.gat1 = GATConv(in_dim, hidden_dim, heads=heads, dropout=0.6)
        self.gat2 = GATConv(hidden_dim * heads, out_dim, heads=1,
                            concat=False, dropout=0.6)

    def forward(self, x, edge_index, return_attention=False):
        if return_attention:                      # 需要举证时导出注意力权重
            x, (ei, alpha) = self.gat1(x, edge_index, return_attention_weights=True)
            return F.log_softmax(self.gat2(F.elu(x), edge_index), dim=-1), (ei, alpha)
        x = F.elu(self.gat1(x, edge_index))
        return F.log_softmax(self.gat2(F.dropout(x, p=0.6, training=self.training),
                                       edge_index), dim=-1)
```

**怎么用**：`return_attention` 那条分支是给业务解释用的 —— 注意力权重只能说明「模型看了哪条边」，能不能作为举证材料取决于你们业务的举证标准，不要默认它可以。**不要照抄** `heads` 与 `dropout`，它们随图的稀疏度变化很大。

**例 3：异构图 + 元路径（HAN 形态）**

```python
from torch_geometric.nn import HANConv

class HAN(torch.nn.Module):
    def __init__(self, in_dim, hidden_dim, out_dim, metadata, heads=8):
        super().__init__()
        self.han = HANConv(in_dim, hidden_dim, heads=heads, metadata=metadata)
        self.lin = torch.nn.Linear(hidden_dim, out_dim)

    def forward(self, x_dict, edge_index_dict):
        out = self.han(x_dict, edge_index_dict)     # 按元路径分层聚合
        return {k: self.lin(v) for k, v in out.items()}

# metadata = ({'user': in_u, 'item': in_i},
#             [('user', 'buys', 'item'), ('item', 'belongs_to', 'category'), ...])
```

**怎么用**：`metadata` 里的每条边类型必须对应 Step 1 图 schema 里已登记的边 —— 元路径是 schema 的投影，不能在建模时临时新增。**不要照抄** `heads=8`，元路径数量先控制在 2–3 条再做消融，一次堆满会分不清是哪条路径在起作用。

**例 4：GraphRAG 简化版（Neo4j + LLM，检索期）**

```python
from neo4j import GraphDatabase
from openai import OpenAI          # 换成兼容 OpenAI 接口的别家客户端时，只需改 model 名

class GraphRAG:
    def __init__(self, uri, user, pwd, client: OpenAI, model: str = "gpt-4o"):
        self.driver = GraphDatabase.driver(uri, auth=(user, pwd))
        self.client = client
        self.model = model

    def cypher_from_nl(self, question: str, schema_hint: str) -> str:
        prompt = f"""你是 Cypher 专家。基于以下图 schema 把问题翻译成 Cypher，
只输出 Cypher，不要解释。\nSchema:\n{schema_hint}\n问题：{question}\nCypher："""
        return self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
        ).choices[0].message.content.strip()

    def query(self, question: str, schema_hint: str) -> dict:
        cypher = self.cypher_from_nl(question, schema_hint)
        validate_cypher(cypher)        # ① 伪代码钩子：语法 + 只读校验，需自行实现（见「怎么用」）
        with self.driver.session() as s:
            rows = [dict(r) for r in s.run(cypher)]
        validate_result(rows, question)  # ② 伪代码钩子：结果集非空 / 命中实体校验，需自行实现
        answer = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content":
                       f"只根据以下事实回答问题，不要编造。问题：{question}\n事实：{rows}\n答案："}],
        ).choices[0].message.content
        return {"answer": answer, "evidence": rows, "cypher": cypher}
```

**怎么用**：`schema_hint` 要由图 schema 自动生成而不是手写，否则 schema 变更后提示词会悄悄过期；返回里必须带 `evidence` 与 `cypher`，否则答案无法回溯核验。注意 `validate_cypher` 与 `validate_result` 是**待实现的钩子**，本例只画出它们该在的位置，直接运行会报 `NameError`；`validate_cypher` 至少要拦非只读语句（`CREATE` / `DELETE` / `MERGE` / 无上限的变长路径），`validate_result` 至少要看结果集是否为空、命中的实体是否在问题提到的范围内。**不要照抄**这个「LLM 生成 Cypher」的单一通路 —— 生产上还要叠一条向量召回（两步校验是所有通路的最低要求）。

**例 5：路径推理（PRA 简化版，用于生成可举证证据链）**

```python
import networkx as nx, random

def pra_score(graph: nx.DiGraph, source: str, target: str,
              meta_paths, num_walks: int = 1000, alpha: float = 0.85) -> float:
    """沿元路径做有界随机游走，统计命中目标的路径类型频次。
    alpha 是 PPR 阻尼系数：本函数按频次打分，用不到它，签名与 PPR 版保持一致"""
    hits = {p: 0 for p in meta_paths}
    for path in meta_paths:
        for _ in range(num_walks):
            cur = source
            for edge_type in path:
                nbrs = [n for n in graph.successors(cur)
                        if graph[cur][n].get('type') == edge_type]
                if not nbrs:
                    break
                cur = random.choice(nbrs)
            if cur == target:
                hits[path] += 1
    total = sum(hits.values())
    return total / (len(meta_paths) * num_walks) if meta_paths else 0.0
# 生产上必须先做超级节点识别：否则 Top-K 路径全是「经过公共节点」的同一种
```

**怎么用**：`meta_paths` 由业务给出，每条路径要能一句话讲清语义（例 3 的元路径同一套）。**不要照抄**随机游走的次数与打分方式 —— 本函数只演示「先枚举路径、再打分」这个结构；生产上用图查询语言做有界枚举（限制跳数与时间窗）比随机游走更可控，也更容易复现。

### 4.6 成本：这套东西的账单

图推理的账单贵在**「把图建一次」与「每来一个样本再展开一次」之间的差**。前文 4.2「在线推理」已给出核心算式（感受野 ≈ fanout^K，fanout=10、K=3 时约 10³【推算】），这里只补它落到三项账单上的形态。

- **计算（本主题最贵、且可精确推的一项）**：单样本推理成本 ∝ fanout^K（去重前）【推算：K 层、每层采 fanout 个邻居，去重前采样量 ≈ fanout^K，与节点总数无关——这正是 4.2 里「分档看显存与延迟、不看数据规模」的原因】。训练成本再乘一个「每轮遍历的节点数」，所以**加深一层比扩大图更贵**。图特征 + 梯度提升树基线之所以是本主题最省的一次投入，正因为它不付这个指数（4.1 Step 4）。
- **硬件 / 云**：图存储容量 ∝ 边数 × 边属性宽【推算：边表 (src, dst, edge_type, edge_weight, ts, attrs) 按行存，容量随边数线性】；在线嵌入缓存 ≈ 实体数 × 嵌入维度 × 4 B【推算：1 亿实体 × 128 维 × 4 B ≈ 51 GB，未计副本，按你的维度替换】。GPU 只在训练与「在线子图采样」档需要。
- **人力（最容易被低估）**：误差集中在**图构建与边定义**（4.10 小结），而非模型——维护成本主要在 Step 1 的 schema 与 Step 6 的图版本 / 漂移看板，随边类型数与图源数增长。通用账法见 [数据成本与 FinOps](../../11-cross-cutting/03-data-cost-finops/03-data-cost-finops.md)。

本主题特有的那句：**图推理的单位成本不是「每条边」，而是「每个样本要展开多大一块子图」**——省钱的方向是降 fanout / 降层数 / 用采样，而不是缩图。

### 4.7 容灾与故障演练

**图推理的「灾」不是跨地域容灾能兜住的那一类。** 它的主产物是一个模型（一组参数 + 一套图构建口径），不是一条有 SLA 的在线服务；跨机房多活能保证「推理服务在跑」，保证不了「重算一遍得到同一个结论」——而后者才是这个主题真正的失效面。所以本节不写多云切换，写它真实的三种失效（通用容灾 / 混沌见 [容灾与多活](../../12-architecture/07-disaster-recovery/07-disaster-recovery.md)、[混沌工程](../../12-architecture/06-chaos-engineering/06-chaos-engineering.md)）。

| 失效模式 | 影响面 | 降级策略 | 演练方案 | 恢复目标 |
| --- | --- | --- | --- | --- |
| 图分区不稳定（重跑建图得到不同分区 / 边集） | 依赖社区与名单的结论不可复现，业务问「凭什么判」答不上 | 回落图版本快照，以版本号锁定结论 | 同一份上游数据重跑两次建图，比对边集与社区标签差异 | 以「同输入同输出」为目标而非时钟；差异率是唯一指标 |
| 结论不可复现（转导式 / 未固定随机种子 / 采样参数漂移） | 同一实体两次判定分数不同，举证链断裂 | 固定种子 + 图版本 + 采样参数入库；不满足则不出举证结论 | 对同一批实体用同版本图重放推理，逐条比对分数 | 重放一次 RTO 分钟级；RPO 由图版本粒度决定【经验：随快照频率变化】 |
| 指标漂移（图漂移 / 特征 IV / AUC 缓慢下滑） | 模型静默退化，数据侧一切正常 | 漂移超阈切回「图特征 + 梯度提升树」基线或规则 | 注入一次上游口径变更，看漂移看板能否在效果下滑前告警 | 检出时限应短于模型重训周期【经验】 |

**演练判据与通用服务相反**：不测「服务起没起来」，测「**同一次判定能不能被重放**」（4.9 自检清单里那条「图版本 + 快照重放」）。做到这一步，图推理才具备拿进举证流程的资格。

### 4.8 演进路线：0 → 1 → 100

图推理的演进不是「模型越换越新」，而是**每一步先坏的点都在数据侧、不在模型侧**（4.10 小结）。

- **0 → 1（最小可用）**：只读图投影——从 DWD 挑 1–2 类语义最清的边建小图，跑图算法（社区 / 度 / PageRank / 连通分量）产出结构特征，挂到既有规则或梯度提升树上（4.4 ①）。**变贵的是「边的语义定义」这层人力**，不是算力；**先坏的是边定义合并**：两个团队各建各的图、边语义没登记，合并后名单里出现业务上无关的实体（4.1 Step 1、4.2 失效条件）——它不以「跑不出来」暴露。
- **1 → 100（规模化）**：上 GNN（归纳式优先）+ 在线子图采样 + 图版本治理 + 影子流量对拍。**变贵的是 fanout^K 的在线推理成本与图版本存储**（4.6）；**先坏的是冷启动**：转导式模型 + 高占比新节点 → 新实体被统一打成默认分，而离线全量指标正常（4.2「训练样本」「在线推理」的失效条件）。
- **100 →（下一道坎）**：GraphRAG / GFM / LLM-as-Reasoner over KG（见 [§ 5 前沿演进](07-graph-reasoning-section-5-ai.md)）。**变贵的是实体归一与图-文本对齐**——两套实体口径会让图碎成互不相连的孤岛（4.3 表）；**先坏的是「模型能换、实体口径不能漂」**：骨干升级可控，实体映射一漂则全体下游重算。

> 判据：你能否一句话说出「信号的最小单位」（4.1 Step 0）——说不清，说明还在 0 → 1，先别谈换模型。

### 4.9 自检清单

下列问题只检查**本节新增的工程产物** —— 图 schema 文档、边表、实验记录、图版本记录、影子流量对拍结果；模式本身的检查项（边语义与生命周期、采样去重、超级节点、敏感属性等）不在此重复，见 §3.7 自检清单。

- [ ] 图 schema 文档里，每条边是否都登记了语义、口径、TTL 与 Owner 四列？缺列的那条边，Step 2 建表时一定会漏参数。
- [ ] 边表里每类边是否都有 `ts`、`edge_type`、`edge_weight` 与来源作业名？缺 `ts` 的边做不了时间快照，也无法回放模型输入。
- [ ] 实验记录里是否写清了训练 / 验证 / 测试的时间边界，并把新节点（训练时不存在）的占比与其上的表现各占一列？
- [ ] 基线「图特征 + 梯度提升树」的指标，是否与 GNN 结果归档在同一张同口径的对比表里？不在同一张表里的两组数字不可比。
- [ ] 每条实验记录是否都写了 fanout 与层数？【推算】fanout 的层数次幂决定单节点的采样量级，这也是 Step 5 容量规划的输入。
- [ ] 在线采样器与离线训练是否共用同一份采样参数与去重规则？两处分开实现时，训练与服务的口径会分叉。
- [ ] 取当天新注册的一批实体打分，能否打出分、延迟多少？打不出即转导式模型的问题。
- [ ] 图质量报告里是否有超级节点清单，并写明在线采样时对这些节点的截断方式？
- [ ] 元路径清单是否与 Step 1 的图 schema 文档逐条对得上，没有在建模之后临时新增？
- [ ] 需要举证的场景，输出的是「分数」还是「路径 / 子图 + 当时的图版本」？只有分数就进不了举证流程。
- [ ] 任意一次线上判定，能否用图版本 + 快照重放当时的图状态？不能则还没到退出双轨的条件。
- [ ] 影子流量对拍的一致率与分歧分布，是否留下了可复查的记录 —— 而不是只留一句「效果还行」？

### 4.10 小结

> 本节小结：整条落地链里唯一决定成败的环节是 **Step 1 的数据建模（边的语义、口径与生命周期）** —— 因为图推理的结论最终要落到业务实体上，而「同一设备」与「同一收货地址」是两条不同的边这件事，只有在建模阶段能被写下来；这一步没做，后面的模型越准，错误结论传播得越远，而且它不以「跑不出来」暴露，只以「跑出来了但解释不通」暴露。相比之下模型族与框架都是可替换的：换 PyG 还是 DGL、换 GraphSAGE 还是 GAT，都可以在几周内重做实验；而边定义的返工要重新构建全图、重跑全部下游任务与对拍。
>
> 💡 **思考锚点**：拿你图里被下游引用最多的那类边，对一下它是否四列齐全（语义 / 口径 / TTL / Owner）——缺 `ts` 的边既做不了时间快照、也进不了举证链。这样的边你图里有几条？若现在要重建全图，会有多少个下游作业跟着重跑、多少条对拍要重做？

> 配合 [§ 2 核心原理](07-graph-reasoning.md)、[§ 3 设计模式与范式](07-graph-reasoning-section-3-sec3.md) 与 [§ 6 落地实践](07-graph-reasoning-section-6-sec6.md) 阅读。
