> 本文件是 **07-graph-reasoning.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](07-graph-reasoning.md)。

## 3. 设计模式与范式

### 3.1 主要模式

把工业上反复出现的图推理模式抽象成 7 类，资深架构师能直接套：

#### 3.1.1 模式 A：节点分类（Node Classification）

- **场景**：用户画像、欺诈评分、物品分类、文档分类。
- **范式**：图构建 → 节点特征工程 → GNN 训练 → 节点嵌入 → 下游分类器 / 业务规则。
- **代表**：PinSage（推荐）、GraphSAGE + MLP、Ant Group 同盾 GNN。

#### 3.1.2 模式 B：链接预测（Link Prediction）

- **场景**：好友推荐、欺诈链路预测、商品-商品搭配、KG 补全。
- **范式**：负采样 → GNN 编码 → 边打分函数（DistMult、TransE、RotatE、MLP） → 排序。
- **代表**：NeurIPS 2023 蚂蚁 TransE 工业版、KG Completion 系列。

#### 3.1.3 模式 C：路径推理（Path Reasoning）

- **场景**：风控证据链、合规追溯、归因分析、多跳问答。
- **范式**：起点 + 终点 → 候选路径检索（SPARQL / Cypher / BFS） → 路径打分（PRA / RNNLogic / ToG） → Top-K 路径解释。
- **代表**：ToG（LLM + KG 多跳）、DRUM（神经关系路径）。

#### 3.1.4 模式 D：子图匹配 / 子图分类

- **场景**：欺诈团伙、AML 模式识别、分子子结构、KG 实体对齐。
- **范式**：候选子图 → 子图编码（GIN / 子图池化） → 相似度 / 分类。
- **代表**：GraphSim 子图相似度、PyG Subgraph Matching。

#### 3.1.5 模式 E：异构图 + 元路径（Heterogeneous Graph + Meta-path）

- **场景**：电商推荐（user-item-tag-category）、金融风控（人-设备-IP-账号-卡）。
- **范式**：定义元路径 → 元路径上的邻居采样 → HAN / HGT / MAGNN 聚合。
- **代表**：HAN、HGT、Alibaba 电商 EGES / ESMM 异构图版。

#### 3.1.6 模式 F：GraphRAG（Graph-based RAG）

- **场景**：企业私有知识问答、长文档总结、多跳事实推理。
- **范式**：文档切片 → 实体关系抽取 → KG 落库 → 用户问题 → KG 检索（向量 + Cypher） → LLM 生成。
- **代表**：Microsoft GraphRAG（2024）、Ant GraphRAG、Neo4j NaLLM、NebulaGraph GraphRAG。

#### 3.1.7 模式 G：图基础模型 / 预训练

- **场景**：跨业务、跨域的通用图能力。
- **范式**：海量异构图预训练 → 下游任务（零样本 / few-shot / 微调）。
- **代表**：OpenGraph、OFA、G-Retriever、LLaGA。

### 3.2 适用场景决策表

下面是"看到这种问题 → 用这种模式"的速查表：

| 业务问题 | 数据规模 | 推荐模式 | 关键工具 |
| --- | --- | --- | --- |
| 用户欺诈评分 | 千万-亿节点 | A 节点分类（GNN） | PyG + Ant Graph |
| 团伙识别 | 万-百万团伙 | D 子图分类（GNN） + Louvain | Neo4j GDS + GIN |
| 商品推荐 | 亿级节点 | A + E 异构图 | PinSage / EGES / GraphSAGE |
| 反洗钱 | 万-百万账户 | C 路径推理 + D 子图匹配 | TigerGraph + GNN |
| 企业知识问答 | 万-百万实体 | F GraphRAG | Neo4j / NebulaGraph + LLM |
| 长期记忆 / 工具路由 | 百万实体 | G + F | LangGraph / LlamaIndex + KG |
| 分子性质预测 | 万-百万分子 | 通用 GNN | PyG / DGL / MoleculeNet |
| 数据血缘 / 敏感传播 | 千-十万表 | 图数据库 + 图算法 | Apache Atlas + Neo4j |
| 告警根因 | 万-百万调用 | C 路径推理 | OpenTelemetry + 图算法 |

**经验法则**：

- 数据规模 < 100 万节点 → 任何模式都能上，关注算法选型。
- 数据规模 100 万 - 1 亿 → 必须 GraphSAGE / PinSage + 子图采样。
- 数据规模 > 1 亿 → 必须分布式图训练（PyG + PyTorch-DDP / DGL-KE / Aligraph / GraphScope）。
- 数据规模 > 10 亿 → 上 GraphScope / Ant Graph / Plato 或工业自研。

### 3.3 反模式与陷阱

**资深架构师必须能识别并避开这些坑**：

#### 反模式 1：图越大越好
> 早期团队喜欢"把全公司的表都连成一张大图"，结果查询慢、训练慢、噪声多、业务不可解释。

正解：**多张小图 + 共享主数据**。每张图对应一个业务域（风控图、推荐图、KG 图），通过 OneID 主数据串联。

#### 反模式 2：GNN 一定能跑赢 XGBoost
> 团队花 3 个月上 GNN，最后发现不如特征工程 + XGBoost。

正解：先用 XGBoost + 图特征（PageRank、度、社区）做 baseline；只有当图结构信号**强于手工特征**时 GNN 才有明显优势（典型场景：欺诈、社交网络推荐）。**GNN 不是银弹**。

#### 反模式 3：盲目堆叠 GNN 层
> 10 层 GCN 训练一晚上跑不动，准确率还下降。

正解：3 层 GraphSAGE 通常就够了；超过 5 层考虑 JK-Net、APPNP、归一化。如果一定要深，用 Graph Transformer（GNN+Transformer hybrid）。

#### 反模式 4：忽视归纳性
> 训练完发现新用户、新商品无法打分，因为没考虑冷启动。

正解：必须 GraphSAGE / GAT / PinSage 等**归纳式**架构；同时维护"特征查找服务"（feature store）支持冷启动。

#### 反模式 5：图构建不规范
> 边的定义、口径不一致，A 团队和 B 团队画的图对不上。

正解：图构建本质上是 OneData 业务过程的"图投影"。**边必须有明确的语义、口径、生命周期**，并在元数据中声明。

#### 反模式 6：忽略可解释性
> GNN 输出"欺诈分数 0.95"，业务问"为什么"，答不上来。

正解：必须配套可解释性方案——
- 注意力可视化（GAT）。
- 子图重要性（IG / GNNExplainer / PGExplainer）。
- 路径证据（Path Reasoning 模式）。
- LLM-as-Reasoner 把 GNN 输出翻译成自然语言（GraphRAG）。

#### 反模式 7：忽略图上的公平性与偏差
> 推荐 / 风控场景里，图上的历史偏差会被放大（富人越富 / 团伙越长越大）。

正解：引入公平性约束（FairGNN、DegFair）、去偏采样、敏感边过滤。

#### 反模式 8：把 LLM 当万能推理器
> 把所有推理都交给 LLM，丢掉了图结构信号。

正解：LLM 擅长"自然语言 + 模糊推理"，图擅长"结构 + 精确推理"。**让 LLM 调用图查询（Cypher/SPARQL）**，而不是让它凭空推理。

#### 反模式 9：图数据库当万能存储
> 什么数据都塞进 Neo4j，结果 OLAP 查询慢、不支持事务回滚。

正解：**OLTP 用图数据库（Neo4j / NebulaGraph）+ OLAP 用图计算引擎（GraphScope / Plato / Ant Graph）+ OLTP/OLAP 一体用 ArangoDB / Memgraph**。混用场景用 NebulaGraph 这种原生存储 + 计算分离。

#### 反模式 10：忽视图的版本与血缘
> 同一张图上个月和这个月不一致，下游模型漂移严重。

正解：图也需要版本管理（时间快照、增量更新、图血缘）。Apache Atlas + NebulaGraph / TigerGraph 都支持。

---
