> 本文件是 **07-graph-reasoning.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](07-graph-reasoning.md)。

## 4. 工程实现

### 4.1 落地步骤

把"图推理系统从 0 到 1"的工程步骤拆成 6 步：

```
0. 业务对齐          → 明确"用什么图、解决什么问题、ROI 怎么算"
1. 数据建模          → OneID / OneData 先行；定义节点、边、特征、口径
2. 图构建            → 离线 / 近实时 / 实时 三层图构建管道
3. 特征与样本        → 节点 / 边 / 子图特征、训练样本构造、负采样
4. 模型训练          → 选型（GCN / SAGE / GAT / R-GCN / Transformer）、超参、评估
5. 推理服务          → 离线打分 / 在线打分（KV + 嵌入缓存 + 图检索）
6. 治理与运维        → 图血缘 / 漂移监控 / 公平性 / 解释 / 反馈闭环
```

每一步都对应了 4.2 ~ 4.4 的关键技术点。

### 4.2 关键技术点

#### 4.2.1 图构建

**离线批量构建**：

- **数据源**：ODS / DWD 层业务表（事实 + 维度）、OneID 主数据、OneData 标准化指标、外部图（KG / 公开数据集）。
- **构建方式**：Spark / Flink / MaxCompute SQL 生成边表（src_id, dst_id, edge_type, edge_weight, ts, attrs）。
- **存储**：Neo4j CSV 导入、NebulaGraph Importer / Exchange、TigerGraph Loading、GraphScope 离线落 Iceberg/IcebergGraph。
- **快照**：每天/每小时一张全量图 + 增量 binlog。

**近实时 / 实时构建**：

- **流式图构建**：Flink CEP / Flink Gelly / NebulaGraph Exchange 流模式、阿里 GraphScope Streaming。
- **变更数据捕获（CDC）**：Debezium / Flink CDC / Maxwell → 图更新。
- **边的时效**：不同业务有不同半衰期（转账边 90 天、点击边 7 天、好友边永久）。**必须定义边的 TTL**。

**异构图 schema**：

- 节点类型 N 种（用户、商品、店铺、品牌、类目）。
- 边类型 M 种（购买、收藏、点击、评论、关注）。
- 元路径 K meta-path = 节点类型 + 边类型交替序列。
- 元数据里必须明确 schema（参考 Ch5 本体建模）。

#### 4.2.2 特征工程

- **节点原始特征**：年龄、性别、等级、注册时间、最近 30 天消费。
- **节点图特征**：度、PageRank 值、Louvain 社区 ID、k-core、连通分量 ID、2 跳邻居标签分布。
- **边特征**：交易金额、时间戳、渠道、币种、置信度。
- **子图特征**：节点数、边数、平均度、最大度、子图 embedding。
- **Feature Store 集成**：用 Feast / Tecton / 阿里 FeatureDB 把图特征当成"在线可查的特征服务"。

#### 4.2.3 训练样本

- **正样本**：明确业务定义（已确认欺诈、已确认购买、已确认好评）。
- **负样本**：随机负采样 + 难负样本（hard negative mining）+ 归纳式样本（新节点 / 新图）。
- **样本泄漏防控**：严格按时间切分训练 / 验证 / 测试（time-based split）；**不能随机 shuffle**——否则会严重泄漏未来信息。
- **图分裂**：做链路预测时要把边分裂（train/val/test edges），同时从图中移除对应边，避免信息泄漏。

#### 4.2.4 模型选型

参考 3.2 决策表。补充几个原则：

- **节点分类 / 链接预测**：GraphSAGE + 注意力（GAT）或 PinSage 是工业首选。
- **关系型 KG**：R-GCN、CompGCN、HGT。
- **图分类 / 子图匹配**：GIN、GCN + Pooling、子图嵌入。
- **大规模**：Cluster-GCN / GraphSAINT / GraphScope 分布式。
- **跨图 / 零样本**：Graph Foundation Model（OpenGraph、OFA、LLaGA）。
- **解释性**：GAT + GNNExplainer / PGExplainer + 路径证据。
- **2025 新趋势**：Graph Transformer（GraphGPS）+ 预训练 backbone。

#### 4.2.5 在线推理

- **离线打分 + KV 缓存**：节点嵌入存 Redis / HBase / FeatureDB；模型周期化 — 业务低峰时刷新嵌入并推送到 KV。
- **在线推理**：
  - 小规模（<10 万节点）：模型直接加载在 GPU 节点上，PyTorch / TF Serving 出打分。
  - 中规模（百万节点）：DGL / PyG + 在线子图采样 + 嵌入缓存。
  - 大规模（亿节点）：GraphScope / Ant Graph 在线推理 + 图查询引擎 + 模型服务分层。
- **冷启动**：新节点没有特征，用元数据 + 邻居平均 + 特征查找服务兜底。
- **A/B 测试 + 影子流量**：GNN 上线必须有 1-2 周影子流量对比。

#### 4.2.6 图治理

- **图血缘**：节点 / 边的来源表 + 转换逻辑 + 责任人。
- **图版本**：全量快照 + 增量 binlog，支持"任意时间点的图状态回溯"。
- **图漂移监控**：节点 / 边 / 标签分布 PSI、特征 IV 漂移、模型 AUC 漂移。
- **图质量**：孤立节点比例、社区大小分布、长尾节点检测。
- **图安全**：敏感实体脱敏、边上的隐私保护（差分隐私、k-匿名）。

### 4.3 工具链与平台（2024-2025 新工具）

#### 4.3.1 训练框架

- **PyTorch Geometric (PyG)**：学术 + 工业双修，最活跃的 GNN 库。2024-2025 主推 PyG 2.5+，支持 PyTorch 2.0+ compile + sparse tensor。
- **DGL (Deep Graph Library)**：AWS 主导，2024 年发布 DGL 1.1 + GraphBolt 大图训练，与 PyTorch 2.x 兼容。
- **tf-gnn (TensorFlow GNN)**：Google 主导，强集成 TF Serving / TF Lite。
- **Spektral**：Keras 风格 GNN 库。
- **Jraph (Google DeepMind)**：JAX 实现的研究向库，GraphGPS 团队用。

#### 4.3.2 工业级分布式图训练

- **Alibaba / 阿里 GraphScope**：阿里自研，支持 GraphScope Flex（交互式）、GraphScope Cluster（分布式）、GraphScope AutoML（自动建模）。**生产级别，开源**。
- **Aligraph**：阿里早期版本，沉淀了 EGES、ESMM、GraphSAGE 等模型。
- **Ant Graph / 蚂蚁图学习**：风控场景最强，2024 年开源 Ant Graph Learn（兼容 PyG / DGL）。
- **Plato (Tencent)**：腾讯自研，支持万亿边。
- **Euler (Huawei)**：华为开源，已停止活跃。
- **Paddle Graph (Baidu)**：百度飞桨生态。
- **DGL-KE**：亚马逊开源，专门做大图嵌入。
- **PyTorch BigGraph (Facebook)**：Meta 开源，大图嵌入。

#### 4.3.3 图数据库 / 图计算

- **Neo4j / Neo4j GDS**：最经典的图数据库，2024-2025 主推 Neo4j 5.x + GDS 2.x，支持向量索引、GraphRAG、Cypher LLM 插件（NaLLM）。
- **NebulaGraph**：国产开源，分布式、强水平扩展、原生 GraphRAG 支持。2024 年发布 NebulaGraph 3.6 + Explorer + GraphRAG。
- **TigerGraph**：商业图数据库，企业级、强 Graph Data Science。
- **ArangoDB**：多模型（文档 + 图 + KV），GraphRAG 友好。
- **Memgraph**：内存图数据库，2024 年发力 GraphRAG + LLM 集成。
- **Amazon Neptune**：托管图数据库，原生 GraphRAG。
- **Azure Cosmos DB (Gremlin API)**：微软托管。
- **JanusGraph**：开源分布式。
- **Kùzu**：嵌入式图数据库，2024-2025 兴起，专为 GraphRAG 优化（LLVM 编译加速）。
- **Apache TinkerPop / Gremlin**：图计算 API 标准。

#### 4.3.4 GraphRAG 工具

- **Microsoft GraphRAG**（2024）：基于 Leiden 社区发现 + LLM 总结，全开源（github.com/microsoft/graphrag）。
- **Neo4j LLM Knowledge Graph Builder**（2024）：从 PDF/网页建 KG + LLM 问答。
- **NebulaGraph GraphRAG**（2024）：基于 KG + 向量 + LLM。
- **Ant Group Ant GraphRAG**：金融风控 + 知识问答。
- **LlamaIndex GraphRAG / LangChain GraphRAG**：集成库，2024-2025 主推。
- **Kùzu GraphRAG**：嵌入式 + 学术。
- **LightRAG**（HKU 2024）：轻量 GraphRAG。
- **FastGraphRAG**（2025）：高性能 GraphRAG。

#### 4.3.5 图基础模型 / 2024-2025 新工具

- **OpenGraph**（2024, Stanford）：跨数据集预训练 GFM。
- **OFA**（2024, SNAP）：One-For-All 图模型。
- **G-Retriever**（2024, UIUC）：Text-Attributed Graph + GraphRAG。
- **LLaGA**（2024, SNAP）：LLM + Graph Templates。
- **GraphGPT**（2024, OpenBMB）：Graph + LLM。
- **LLM-as-Reasoner over KG**：KG-GPT、ToG（Think-on-Graph）、RoG（Retrieval-augmented On Graphs）。
- **AnyGraph**（2025）：跨域图模型。
- **UniGraph**（2025）：统一图模型。
- **GraphAlign**（2025）：图-文本对齐预训练。

#### 4.3.6 图可视化

- **Neo4j Browser / Bloom**：图数据库自带。
- **NebulaGraph Studio / Dashboard**：图数据库自带。
- **Gephi**：学术经典。
- **Cytoscape.js**：前端图可视化。
- **Graphistry**：GPU 加速大规模图可视化。
- **AntV G6 / X6（蚂蚁）**：国产前端图可视化，2024-2025 主推智能体可视化。

### 4.4 代码 / 示例

#### 示例 1：用 PyG + GraphSAGE 做节点分类

```python
import torch
import torch.nn.functional as F
from torch_geometric.nn import SAGEConv, GATConv
from torch_geometric.datasets import Planetoid

# 1. 加载数据
dataset = Planetoid(root='/tmp/Cora', name='Cora')
data = dataset[0]

# 2. 定义 GraphSAGE 模型
class GraphSAGE(torch.nn.Module):
    def __init__(self, in_dim, hidden_dim, out_dim, num_layers=2, dropout=0.5):
        super().__init__()
        self.convs = torch.nn.ModuleList()
        self.convs.append(SAGEConv(in_dim, hidden_dim))
        for _ in range(num_layers - 2):
            self.convs.append(SAGEConv(hidden_dim, hidden_dim))
        self.convs.append(SAGEConv(hidden_dim, out_dim))
        self.dropout = dropout

    def forward(self, x, edge_index):
        for i, conv in enumerate(self.convs):
            x = conv(x, edge_index)
            if i < len(self.convs) - 1:
                x = F.relu(x)
                x = F.dropout(x, p=self.dropout, training=self.training)
        return F.log_softmax(x, dim=-1)

# 3. 训练
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = GraphSAGE(in_dim=dataset.num_node_features,
                  hidden_dim=64, out_dim=dataset.num_classes).to(device)
data = data.to(device)
optimizer = torch.optim.Adam(model.parameters(), lr=0.01, weight_decay=5e-4)

for epoch in range(200):
    model.train()
    optimizer.zero_grad()
    out = model(data.x, data.edge_index)
    loss = F.nll_loss(out[data.train_mask], data.y[data.train_mask])
    loss.backward()
    optimizer.step()

# 4. 评估
model.eval()
pred = model(data.x, data.edge_index).argmax(dim=-1)
correct = (pred[data.test_mask] == data.y[data.test_mask]).sum()
acc = int(correct) / int(data.test_mask.sum())
print(f'Test Accuracy: {acc:.4f}')
```

#### 示例 2：用 PyG + GAT 做归纳式节点分类（归纳性 = 支持冷启动）

```python
from torch_geometric.nn import GATConv

class GATNet(torch.nn.Module):
    def __init__(self, in_dim, hidden_dim, out_dim, heads=4):
        super().__init__()
        self.gat1 = GATConv(in_dim, hidden_dim, heads=heads, dropout=0.6)
        self.gat2 = GATConv(hidden_dim * heads, out_dim, heads=1, concat=False, dropout=0.6)

    def forward(self, x, edge_index):
        x = F.elu(self.gat1(x, edge_index))
        x = F.dropout(x, p=0.6, training=self.training)
        return F.log_softmax(self.gat2(x, edge_index), dim=-1)
```

> GAT 是归纳式的——可以泛化到训练时没见过的节点。**这是工业首选 GAT / GraphSAGE 而不是 GCN 的根本原因**。

#### 示例 3：异构图 + 元路径（HAN）

```python
# HAN (Heterogeneous Graph Attention Network)
# 思路：先按元路径分层（user-item-user, user-category-user 等），每层做 GAT，最后聚合
from torch_geometric.nn import HANConv

class HAN(torch.nn.Module):
    def __init__(self, in_dim, hidden_dim, out_dim, metadata, heads=8):
        super().__init__()
        self.han = HANConv(in_dim, hidden_dim, heads=heads, metadata=metadata)
        self.lin = torch.nn.Linear(hidden_dim, out_dim)

    def forward(self, x_dict, edge_index_dict):
        out = self.han(x_dict, edge_index_dict)
        return {k: self.lin(v) for k, v in out.items()}
```

#### 示例 4：GraphRAG 简化版（Neo4j + LLM）

```python
from neo4j import GraphDatabase
from openai import OpenAI

class GraphRAG:
    def __init__(self, neo4j_uri, neo4j_user, neo4j_pwd, llm_client):
        self.driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_pwd))
        self.llm = llm_client

    def _cypher_from_nl(self, question: str) -> str:
        """把自然语言问题翻译成 Cypher（LLM 驱动）"""
        prompt = f"""
        你是一个 Neo4j Cypher 专家。基于以下图 schema，
        把用户问题翻译成 Cypher 查询语句。只输出 Cypher，不要解释。
        Schema:
        - (:Person {{name, age}})
        - (:Company {{name}})
        - (:Person)-[:WORKS_AT]->(:Company)
        - (:Person)-[:KNOWS]->(:Person)

        问题：{question}
        Cypher：
        """
        return self.llm.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        ).choices[0].message.content.strip()

    def query(self, question: str) -> str:
        cypher = self._cypher_from_nl(question)
        with self.driver.session() as session:
            result = session.run(cypher)
            records = [dict(r) for r in result]

        gen_prompt = f"""
        基于以下图数据库返回的事实，回答用户问题。
        只用事实回答，不要编造。

        问题：{question}
        事实：{records}
        答案：
        """
        return self.llm.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": gen_prompt}]
        ).choices[0].message.content
```

#### 示例 5：路径推理（PRA 简化版）

```python
import networkx as nx
import random

def pra_score(graph: nx.DiGraph, source: str, target: str,
              meta_paths, num_walks=1000, alpha=0.85) -> float:
    """Personalized PageRank + 元路径打分"""
    # 1. 候选路径
    candidate_paths = []
    for path in meta_paths:
        for walk in range(num_walks):
            current = source
            for step in path:
                neighbors = list(graph.successors(current))
                step_typed = [n for n in neighbors if graph[current][n].get('type') == step]
                if not step_typed:
                    break
                current = random.choice(step_typed)
            if current == target:
                candidate_paths.append(path)
                break

    # 2. 打分：路径频次 × 元路径权重
    path_counts = {p: candidate_paths.count(p) for p in meta_paths}
    return sum(path_counts.values()) / len(meta_paths) if meta_paths else 0.0
```

---
