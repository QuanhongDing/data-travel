> 本文件是 **05-recommendation.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](05-recommendation.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务理解与目标定义**

- 明确业务目标（CTR / GMV / 时长 / 满意度）。
- 评估指标对齐（离线 AUC + 在线 A/B 测试）。
- 输出：**目标定义文档**。

**Step 2：数据准备**

- 收集用户行为日志（曝光 / 点击 / 转化）。
- 用户画像 / Item 画像。
- 上下文特征（时间 / 地点 / 设备）。
- 输出：**样本库 + 特征工程**。

**Step 3：架构设计**

- 分层架构（召回 → 粗排 → 精排 → 重排）。
- 每层的候选数量、模型选择、延迟目标。
- 输出：**架构图 + SLA**。

**Step 4：召回层搭建**

- 双塔 / 协同过滤 / YouTube DNN。
- 离线训练 + 在线 Embedding 检索（Faiss / Milvus）。
- 输出：**召回模型 + 检索服务**。

**Step 5：粗排 / 精排层搭建**

- LR / FM / DeepFM / DIN。
- 多任务学习（MMoE / PLE）。
- 输出：**精排模型**。

**Step 6：重排层搭建**

- 多样性约束（MMR / DPP）。
- 业务规则（新客优惠 / 库存 / 比例）。
- 输出：**重排服务**。

**Step 7：评估 + A/B 测试**

- 离线评估（AUC / GAUC / NDCG）。
- 在线 A/B 测试（CTR / GMV / 时长）。
- 输出：**评估报告 + A/B 实验报告**。

**Step 8：监控 + 反馈闭环**

- 模型监控（输入 / 输出分布、漂移）。
- 业务监控（CTR / CVR / GMV）。
- 反馈回流（曝光 / 点击 / 转化 → 训练数据）。
- 输出：**监控 dashboard + 闭环 pipeline**。

### 4.2 关键技术点

**召回关键技术**：

1. **双塔模型 + 向量检索**：用户塔 + 物品塔 + Faiss / Milvus 检索。
2. **多兴趣召回（MIND）**：用户多个兴趣向量。
3. **协同过滤召回**：ItemCF / Swing（阿里）。
4. **YouTube DNN**：经典召回 DNN。
5. **图召回**：GraphSAGE / LightGCN。

**精排关键技术**：

6. **特征交叉**：FM / DeepFM / xDeepFM / DCN。
7. **注意力机制**：DIN / DIEN / SIM。
8. **Transformer**：BERT4Rec / SASRec。
9. **多任务**：MMoE / PLE / ESSM / AITM。
10. **长序列建模**：SIM / LONGER。

**重排关键技术**：

11. **多样性**：MMR（Maximal Marginal Relevance）/ DPP（Determinantal Point Process）。
12. **业务规则**：库存 / 价格区间 / 类目比例 / 新品扶持。
13. **上下文**：时间 / 地点 / 设备。
14. **Listwise 排序**：ListMLE / ListNet。

**冷启动关键技术**：

15. **内容 Embedding**：BERT / CLIP / ViT。
16. **Bandit**：探索新 Item。
17. **Side Information**：人口学 / 社交关系 / 设备。
18. **迁移学习**：从类似 Item / 用户迁移。

**实时推荐关键技术**：

19. **实时特征**：Flink + Redis。
20. **在线学习**：FTRL / 在线 GBDT。
21. **模型更新**：分钟 / 小时级增量更新。

**LLM 推荐关键技术**：

22. **Prompt 工程**：清晰指令 + Few-shot。
23. **LLM Embedding + 双塔**：Sentence-BERT / BGE 提 Embedding + 检索。
24. **生成式推荐**：TIGER / LC-Rec 生成候选 ID。
25. **对话式推荐**：ChatRec + Memory。

### 4.3 工具链与平台

**深度学习框架**：

- **PyTorch / TensorFlow / PaddlePaddle**——基础 DL 框架。
- **DeepCTR**（开源）——推荐算法库（FM / DeepFM / DIN / DIEN / DCN）。
- **RecBole**（开源）——推荐算法统一库（80+ 算法）。
- **TorchRec**（Meta / 开源）——PyTorch 推荐系统库。

**向量检索**：

- **Faiss**（Meta / 开源）——向量检索事实标准。
- **Milvus**（国产 / 开源）——向量数据库。
- **Pinecone**（商业）——托管向量数据库。
- **Annoy**（Spotify / 开源）——轻量 ANN。
- **HNSWlib**（开源）——HNSW 实现。

**工业级推荐平台**：

- **Alibaba PAI / 阿里云推荐引擎**——电商推荐。
- **字节 ByteRec**——字节内部推荐平台。
- **腾讯推荐平台**——腾讯内部。
- **美团推荐平台**——美团到店 / 外卖 / 酒旅。
- **京东 JDRec**——电商推荐。
- **百度推荐平台**——百度搜索 + 信息流。

**开源推荐框架**：

- **EasyRec**（阿里 / 开源）——工业级推荐框架。
- **DeepCTR**（开源）——CTR 预估算法库。
- **RecBole**（开源）——推荐算法统一库。
- **LightFM**（开源）——混合推荐。
- **Surprise**（开源）——经典推荐库。
- **Implicit**（开源）——隐式反馈推荐。

**LLM 推荐工具**：

- **LangChain / LlamaIndex**——LLM 应用框架。
- **OpenAI Embedding API**——商业 Embedding。
- **Sentence Transformers**——文本 Embedding。
- **BGE / M3E**（开源）——中文 Embedding。

**实时计算**：

- **Flink**（开源）——实时特征计算。
- **Kafka**（开源）——消息队列。
- **Redis**（开源 / 商业）——在线特征 / KV。
- **Apache Beam**——统一批流。

**评估工具**：

- **MLflow**（开源）——实验管理。
- **RecMetrics**（开源）——推荐系统评估。
- **Rexmetric**（开源）——A/B 测试评估。
- **Weights & Biases**（商业）——实验管理。

**2024-2025 新工具**：

- **TIGER**（Google 2023）——生成式检索推荐。
- **LC-Rec**（2024）——LLM 协同过滤。
- **MoCa**（2024）——LLM + 协同过滤。
- **InstructRec**（2023）——指令推荐。
- **P5**（2022）——推荐基础模型。
- **AgentRec**（2024）——Agent 推荐。
- **CLIP4Rec**（2024）——CLIP 推荐。
- **EasyRec 2.0**（阿里 2024）——支持 LLM 推荐。

### 4.4 代码 / 示例

**示例 1：双塔召回模型**

```python
import torch
import torch.nn as nn

class TwoTowerModel(nn.Module):
    """用户塔 + 物品塔的双塔模型"""
    def __init__(self, user_feature_dim, item_feature_dim, embedding_dim=64):
        super().__init__()
        # 用户塔
        self.user_tower = nn.Sequential(
            nn.Linear(user_feature_dim, 128),
            nn.ReLU(),
            nn.Linear(128, embedding_dim)
        )
        # 物品塔
        self.item_tower = nn.Sequential(
            nn.Linear(item_feature_dim, 128),
            nn.ReLU(),
            nn.Linear(128, embedding_dim)
        )

    def forward(self, user_features, item_features):
        user_emb = self.user_tower(user_features)
        item_emb = self.item_tower(item_features)
        # 余弦相似度
        similarity = torch.cosine_similarity(user_emb, item_emb)
        return user_emb, item_emb, similarity

# 训练
model = TwoTowerModel(user_feature_dim=100, item_feature_dim=50)
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

for batch in dataloader:
    user_features, item_features_pos, item_features_neg = batch
    user_emb, item_emb_pos, sim_pos = model(user_features, item_features_pos)
    _, item_emb_neg, sim_neg = model(user_features, item_features_neg)

    # 排序损失（softmax over negatives）
    logits = torch.cat([sim_pos.unsqueeze(1), sim_neg], dim=1)
    labels = torch.zeros(logits.size(0), dtype=torch.long)
    loss = nn.CrossEntropyLoss()(logits, labels)

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
```

**示例 2：DIN 模型（精排）**

```python
import torch
import torch.nn as nn

class LocalActivationUnit(nn.Module):
    """DIN 的注意力激活单元"""
    def __init__(self, embedding_dim, hidden_dims=[80, 40]):
        super().__init__()
        layers = []
        prev_dim = embedding_dim * 4  # concat: [hist, target, hist-target, hist*target]
        for hidden_dim in hidden_dims:
            layers += [nn.Linear(prev_dim, hidden_dim), nn.PReLU()]
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, 1))
        self.net = nn.Sequential(*layers)

    def forward(self, hist_emb, target_emb):
        # hist_emb: [batch, hist_len, embed_dim]
        # target_emb: [batch, embed_dim]
        target_emb = target_emb.unsqueeze(1).expand_as(hist_emb)
        din_input = torch.cat([
            hist_emb, target_emb,
            hist_emb - target_emb,
            hist_emb * target_emb
        ], dim=-1)
        att_weight = self.net(din_input).squeeze(-1)  # [batch, hist_len]
        return att_weight

class DIN(nn.Module):
    def __init__(self, feature_dims, embedding_dim=8, hist_len=50):
        super().__init__()
        self.embeddings = nn.ModuleDict({
            name: nn.Embedding(dim, embedding_dim)
            for name, dim in feature_dims.items()
        })
        self.attention = LocalActivationUnit(embedding_dim)
        self.hist_len = hist_len
        self.mlp = nn.Sequential(
            nn.Linear(embedding_dim * (len(feature_dims) + 1), 200),
            nn.PReLU(),
            nn.Linear(200, 80),
            nn.PReLU(),
            nn.Linear(80, 1)
        )

    def forward(self, user_features, hist_items, target_item):
        # 用户特征 Embedding
        user_emb = torch.cat([
            self.embeddings[name](feat)
            for name, feat in user_features.items()
        ], dim=-1)

        # 历史行为 Embedding
        hist_emb = self.embeddings['item_id'](hist_items)  # [batch, hist_len, embed_dim]

        # 目标 Item Embedding
        target_emb = self.embeddings['item_id'](target_item)  # [batch, embed_dim]

        # 注意力权重
        att_weight = self.attention(hist_emb, target_emb)  # [batch, hist_len]
        att_weight = torch.softmax(att_weight, dim=-1)

        # 加权求和（用户兴趣）
        interest = torch.sum(att_weight.unsqueeze(-1) * hist_emb, dim=1)  # [batch, embed_dim]

        # 拼接 + MLP
        mlp_input = torch.cat([user_emb, interest], dim=-1)
        ctr_pred = torch.sigmoid(self.mlp(mlp_input))
        return ctr_pred
```

**示例 3：MMoE 多任务学习**

```python
import torch
import torch.nn as nn

class MMoE(nn.Module):
    """Multi-gate Mixture-of-Experts"""
    def __init__(self, input_dim, num_experts=4, num_tasks=3, expert_dim=32):
        super().__init__()
        # 专家网络
        self.experts = nn.ModuleList([
            nn.Sequential(
                nn.Linear(input_dim, expert_dim),
                nn.ReLU(),
                nn.Linear(expert_dim, expert_dim)
            )
            for _ in range(num_experts)
        ])
        # 门控网络（每个任务一个）
        self.gates = nn.ModuleList([
            nn.Sequential(
                nn.Linear(input_dim, num_experts),
                nn.Softmax(dim=-1)
            )
            for _ in range(num_tasks)
        ])
        # 任务塔（每个任务一个）
        self.task_towers = nn.ModuleList([
            nn.Sequential(
                nn.Linear(expert_dim, 16),
                nn.ReLU(),
                nn.Linear(16, 1)
            )
            for _ in range(num_tasks)
        ])

    def forward(self, x):
        # x: [batch, input_dim]
        # 专家输出
        expert_outputs = torch.stack(
            [expert(x) for expert in self.experts], dim=1
        )  # [batch, num_experts, expert_dim]

        # 每个任务的门控加权
        task_outputs = []
        for i in range(len(self.task_towers)):
            gate_weight = self.gates[i](x).unsqueeze(-1)  # [batch, num_experts, 1]
            weighted = (expert_outputs * gate_weight).sum(dim=1)  # [batch, expert_dim]
            output = self.task_towers[i](weighted)  # [batch, 1]
            task_outputs.append(output)

        return task_outputs  # [ctr_pred, cvr_pred, gmv_pred]
```

**示例 4：LLM 推荐（Embedding 召回）**

```python
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

# 1. 用 LLM 提 Item Embedding
model = SentenceTransformer('BAAI/bge-large-zh-v1.5')
item_texts = [
    "运动鞋 / 跑步鞋 / 透气 / 减震",
    "连衣裙 / 夏季 / 碎花 / 显瘦",
    "...",
]
item_embeddings = model.encode(item_texts)

# 2. 索引到 Faiss
dimension = item_embeddings.shape[1]
index = faiss.IndexFlatIP(dimension)  # 内积（cosine similarity）
index.add(np.array(item_embeddings).astype('float32'))

# 3. 用户检索
user_query = "我最近想买运动鞋，跑步用"
user_emb = model.encode([user_query])

scores, indices = index.search(np.array(user_emb).astype('float32'), k=10)
print(f"Top 10 推荐：{[item_texts[i] for i in indices[0]]}")
```

**示例 5：Bandit 推荐（探索-利用）**

```python
import numpy as np
from scipy.stats import beta

class ThompsonSamplingBandit:
    """Thompson Sampling Bandit（推荐 Item 探索-利用）"""
    def __init__(self, n_items):
        self.n_items = n_items
        # Beta 分布参数（成功 / 失败）
        self.alpha = np.ones(n_items)
        self.beta = np.ones(n_items)

    def select(self):
        """Thompson Sampling 选择 Item"""
        samples = np.array([
            np.random.beta(self.alpha[i], self.beta[i])
            for i in range(self.n_items)
        ])
        return np.argmax(samples)

    def update(self, item_id, reward):
        """更新参数（reward=1: 点击，reward=0: 未点击）"""
        if reward == 1:
            self.alpha[item_id] += 1
        else:
            self.beta[item_id] += 1

# 使用
bandit = ThompsonSamplingBandit(n_items=1000)
for user in users:
    recommended_item = bandit.select()
    user_click = simulate_click(user, recommended_item)  # 模拟用户行为
    bandit.update(recommended_item, user_click)
```

---
