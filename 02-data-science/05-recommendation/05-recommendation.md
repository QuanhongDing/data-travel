# 推荐算法（Recommendation）

> **一句话定位**：协同过滤 / 双塔 / DeepFM / DIN / LLM 推荐——从"猜你喜欢"到"理解你"，推荐系统是电商 / 内容 / 广告的共同底座。

> 本文是 data-travel 项目 [Ch2 · 数据科学与算法](../../README.md) 的子章节（**05 推荐算法**）。覆盖 R2 数据科学算法 领域中"推荐系统（Recommendation）"相关的核心原理、设计模式、工程实现与 AI 时代演进。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 推荐系统的核心架构（召回 - 粗排 - 精排 - 重排）是什么？ | §1.3 / §3.1 |
| 协同过滤 / FM / DeepFM / 双塔 / DIN 怎么选？ | §3.2 决策表 |
| 多任务推荐 / 强化学习推荐 / 知识图谱推荐怎么做？ | §3.1 / §5 前沿 |
| LLM 推荐 / 生成式推荐（生成候选 ID）怎么搞？ | §5.1 / §5.3 |
| 实时推荐（流式）、冷启动、多模态推荐怎么落地？ | §4.1 / §5.1 |
| 推荐系统如何与 RAG / Agent 平台融合？ | §5.2 / §7 对比 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：推荐系统（Recommendation System）是信息过载时代的核心工具——基于用户历史行为 / 兴趣 / 上下文，从海量候选中预测用户最可能感兴趣的物品。

**工程定义**：在数据架构师手里，推荐系统是**把"信息找人"抽象为可量化的排序模型**。它告诉你：这个用户接下来会看什么？买什么？点击什么？——所有"在候选集中排序"的问题，本质上都是推荐。

**解决的业务问题**：

| 业务域 | 典型推荐问题 | 候选集 |
| --- | --- | --- |
| 电商 | 商品推荐、相关商品、猜你喜欢 | 千万级 SKU |
| 内容 | 短视频推荐、新闻推荐、音乐推荐 | 百万级 Item |
| 广告 | 广告定向、CTR 预估、个性化创意 | 数十万广告主 |
| 社交 | 关注推荐、可能认识的人、内容分发 | 亿级用户 |
| 出行 | 司机推荐、目的地推荐、路线推荐 | 城市级 POI |
| 教育 | 课程推荐、学习路径 | 课程库 |
| B 端 | 商品推荐、企业推荐、SDR 推荐 | 企业库 |
| 信息流 | 个性化信息流、Feed 流 | 全网内容 |
| Agent | Tool 推荐、Action 推荐 | Tool 库 |

**推荐 vs 搜索（Search）**：

| 维度 | 推荐 | 搜索 |
| --- | --- | --- |
| 意图 | 被动（用户没明确需求） | 主动（用户明确表达） |
| 个性化 | 强 | 中（query + 个性化） |
| 候选集 | 全量 | 索引后召回 |
| 评估 | CTR / CVR / GMV / 时长 | NDCG / MRR / MAP |
| 核心问题 | 探索兴趣 | 匹配 query |

### 1.2 为什么需要

**业务驱动力**：

- **信息过载时代，推荐是平台生存之本**。用户每天面对 10 万+ 商品 / 1 万+ 视频 / 100 万+ 内容，没有推荐就是"垃圾场"。
- **推荐是平台变现的核心引擎**。电商 GMV 的 60%+ 来自推荐，广告收入的 80%+ 来自推荐。
- **AI 时代推荐与 LLM 深度融合**。LLM 理解用户兴趣、生成推荐理由、对话式推荐。
- **Agent 时代，推荐成为 Agent 决策核心**。Tool 推荐、Action 推荐是 Agent 平台的关键能力。

**痛点**：

1. **冷启动**：新用户 / 新商品无历史行为，个性化困难。
2. **数据稀疏**：长尾用户 / 商品行为极少，模型学不到。
3. **长尾分布**：少数热门 Item 占大多数交互，少数 Item 被忽略。
4. **多样性与准确性权衡**：纯 CTR 优化导致"信息茧房"，缺乏多样性。
5. **探索-利用**：过度利用（推荐已知喜欢的）缺乏惊喜，过度探索（推荐未知的）降低短期效果。
6. **实时性**：用户兴趣实时变化，模型更新滞后。
7. **多目标**：CTR / CVR / GMV / 时长 / 满意度等多个目标难以平衡。
8. **公平性**：推荐可能放大偏见（如性别 / 地域 / 收入）。
9. **评估困难**：离线 AUC 与在线 GMV 经常不对齐。
10. **可解释性**：用户问"为什么推荐这个"，难以回答。

### 1.3 在 AI 时代数据架构中的位置

**与上下游模块的关系**：

```
[用户行为 / 内容 / 商品]
   ↓
[特征工程 + Embedding] ─→ Feature Store + 向量库
   ↓
[召回] ─→ 千级候选
   ↓
[粗排] ─→ 百级候选
   ↓
[精排] ─→ 十级候选
   ↓
[重排] ─→ 最终展示
   ↓
[用户反馈] ─→ 数据回流
```

**在数据架构中的角色**：

- **业务核心**：电商 / 内容 / 广告 / 社交平台的变现核心。
- **AI 基础设施**：推荐与 LLM / RAG / Agent 深度融合。
- **数据闭环**：推荐系统是数据闭环最成熟的场景（曝光 → 点击 → 转化 → 反馈）。
- **AI 资产化**：推荐模型 / Embedding / 行为数据是核心 AI 资产。

**一句话判断**：**会分类 / 回归是 P7，会做推荐系统是 P8——推荐系统是数据架构师"业务价值变现"的核心能力。**

### 1.4 演进历程

**传统推荐阶段（1990s–2010）**：

- 1992：Xerox PARC 提出**协同过滤**（Collaborative Filtering）思想。
- 1994：GroupLens 提出**基于用户的协同过滤**（UserCF）。
- 2003：Amazon 提出**基于物品的协同过滤**（ItemCF）并商业化。
- 2006：Netflix Prize 推动**矩阵分解**（Matrix Factorization, MF / SVD / FM）。
- 2007：Yahoo 提出**Slope One** 简单推荐。
- 2009：Facebook 提出**GBDT + LR** 组合。

**深度学习阶段（2015–2020）**：

- 2016：Google 提出 **Wide & Deep**——记忆 + 泛化。
- 2016：Microsoft 提出 **DeepCrossing**——深度交叉网络。
- 2017：Google / Stanford 提出 **DeepFM**——FM + DNN。
- 2017：Google 提出 **双塔模型**（Two-Tower）——召回专用。
- 2018：阿里巴巴提出 **DIN**（Deep Interest Network）——注意力机制。
- 2019：阿里巴巴提出 **DIEN**（Deep Interest Evolution Network）——兴趣进化。
- 2019：**BERT4Rec**——Transformer 用于推荐。

**多任务 / 强化学习阶段（2018–2022）**：

- 2018：**MMoE**（Multi-gate Mixture-of-Experts）——多任务。
- 2019：**PLE**（Progressive Layered Extraction）——多任务 SOTA。
- 2020：**ESSM**（Entire Space Multi-task Model）——全空间多任务。
- 2020：**RL-based 推荐**——长期价值优化。
- 2021：**图神经网络推荐**（GraphRec / LightGCN）。

**AI 原生阶段（2022+）**：

- 2022：**P5**（Recsys 预训练基础模型）。
- 2023：**GPT4Rec** / **ChatRec**——LLM 用 Prompt 做推荐。
- 2024：**生成式推荐**（Google / 字节）——生成候选 ID 而非排序候选。
- 2024：**LLM Embedding 推荐**（Sentence-BERT + 检索）——语义推荐。
- 2025：**多模态推荐**（图像 + 文本 + 视频）——CLIP / 多模态 Embedding。
- 2025：**Agent 推荐**——Tool 推荐 / Action 推荐成为 Agent 平台核心。

**一句话总结**：**推荐系统从"协同过滤"到"矩阵分解"到"深度学习"到"LLM 推荐 / 生成式推荐"四阶段演进，今天的 AI 时代是"LLM + 生成式 + 多模态 + 强化学习"的混合架构。**

---

## 2. 核心原理

### 2.1 关键概念定义

- **用户（User）**：推荐系统的服务对象。
- **物品（Item）**：推荐的内容（商品 / 内容 / 视频 / 广告）。
- **上下文（Context）**：推荐时的场景信息（时间 / 地点 / 设备 / 状态）。
- **曝光（Impression）**：Item 展示给用户。
- **点击（Click）**：用户点击 Item。
- **转化（Conversion）**：用户完成目标行为（下单 / 关注 / 完播）。
- **CTR（Click-Through Rate）**：点击率 = 点击 / 曝光。
- **CVR（Conversion Rate）**：转化率 = 转化 / 点击。
- **GMV（Gross Merchandise Value）**：商品交易总额。
- **召回（Recall / Candidate Generation）**：从全量 Item 中粗筛 1000-10000 候选。
- **粗排（Pre-Ranking）**：对召回结果做轻量排序，筛出 100-500。
- **精排（Ranking）**：对粗排结果做精确排序，筛出 10-50。
- **重排（Re-Ranking）**：考虑多样性 / 业务规则做最终排序。
- **冷启动（Cold Start）**：新用户 / 新 Item 无历史行为时的推荐。
- **长尾（Long Tail）**：少量 Item 占大部分交互，剩余大量 Item 极少交互。
- **Embedding**：用户 / Item 的稠密向量表示。
- **相似度（Similarity）**：用户 / Item 向量间的距离（余弦 / 欧氏）。
- **AUC（Area Under Curve）**：二分类评估指标，推荐用 GAUC（分组 AUC）。
- **NDCG（Normalized Discounted Cumulative Gain）**：排序学习指标。
- **MAP（Mean Average Precision）**：平均精度均值。
- **MRR（Mean Reciprocal Rank）**：平均倒数排名。
- **EE（Exploration-Exploitation）**：探索-利用权衡。
- **MAB（Multi-Armed Bandit）**：多臂老虎机，EE 问题经典解。
- **Bandit 推荐**：用 Bandit 做探索-利用平衡。
- **多任务推荐**：同时优化 CTR / CVR / GMV 等多个目标。
- **ESMM / MMoE / PLE**：多任务学习架构。
- **MMoE（Multi-gate Mixture-of-Experts）**：多任务专家网络。
- **PLE（Progressive Layered Extraction）**：分层多任务。
- **ESSM（Entire Space Multi-task Model）**：全空间多任务 CVR。
- **DIN（Deep Interest Network）**：注意力机制 + 用户兴趣。
- **DIEN（Deep Interest Evolution Network）**：兴趣动态演化。
- **SIM（Search-based Interest Model）**：长序列兴趣建模。
- **ETA（Effective Target Attention）**：高效目标注意力。
- **双塔模型（Two-Tower）**：用户塔 + 物品塔，独立 Embedding + 向量检索。
- **FM（Factorization Machine）**：特征二阶交叉。
- **DeepFM**：FM + DNN 组合。
- **xDeepFM**：高阶交叉。
- **DCN / DCN-V2**：Deep & Cross Network。
- **AutoInt**：多头自注意力自动交叉。
- **BERT4Rec**：双向 Transformer 推荐。
- **SASRec**：Self-Attentive Sequential Recommendation。
- **GraphRec**：图神经网络推荐。
- **LightGCN**：轻量化图卷积推荐。
- **生成式推荐（Generative Recommendation）**：用生成模型（LLM / Transformer）生成候选 ID。
- **P5**（2022）：Pretrain, Personalized Prompt, and Predict Paradigm。
- **GPT4Rec**（2023）：用 LLM 生成推荐列表。
- **TIGER**（Google 2023）：生成式检索推荐。
- **语义 ID（Semantic ID）**：用 LLM Embedding 给 Item 打语义化 ID。

### 2.2 数学 / 形式化基础

**协同过滤（UserCF / ItemCF）**：

UserCF：
- 计算用户相似度 $w_{u,v} = \frac{|N(u) \cap N(v)|}{\sqrt{|N(u)| \cdot |N(v)|}}$。
- 预测用户 $u$ 对物品 $i$ 的兴趣 $\hat{r}_{ui} = \sum_{v \in N(u) \cap U(i)} w_{u,v} r_{vi}$。

ItemCF：
- 计算物品相似度 $w_{i,j} = \frac{|N(i) \cap N(j)|}{\sqrt{|N(i)| \cdot |N(j)|}}$。
- 预测 $\hat{r}_{ui} = \sum_{j \in N(u) \cap I(u)} w_{i,j} r_{uj}$。

**矩阵分解（MF）**：

$$R \approx U V^T$$

其中 $U$ 是用户矩阵、$V$ 是物品矩阵、$R$ 是评分矩阵。

$$L = \sum_{(u,i) \in K} (r_{ui} - u_u^T v_i)^2 + \lambda (\|U\|^2 + \|V\|^2)$$

**FM（Factorization Machine）**：

$$\hat{y} = w_0 + \sum_i w_i x_i + \sum_{i<j} \langle v_i, v_j \rangle x_i x_j$$

其中 $\langle v_i, v_j \rangle$ 是特征隐向量内积。FM 自动学习二阶特征交叉。

**DeepFM**：

$$\hat{y} = \text{FM}(x) + \text{DNN}(x)$$

FM 部分捕捉低阶交叉，DNN 部分捕捉高阶非线性。

**双塔模型（Two-Tower）**：

用户塔 $u = f_u(x_u)$，物品塔 $v = f_v(x_v)$。

相似度：$\hat{y} = \text{cosine}(u, v) = \frac{u^T v}{\|u\| \|v\|}$

训练：$\mathcal{L} = -\log \frac{\exp(\text{cosine}(u, v^+))}{\sum_{v^-} \exp(\text{cosine}(u, v^-))}$（softmax over negative samples）

推理：把物品 Embedding 预计算 + 索引到向量数据库（如 Faiss / Milvus），用户在线检索 top-k。

**DIN（Deep Interest Network）**：

$$\hat{y} = f(e_u, e_i, e_{\text{history}})$$

用户兴趣激活：

$$v_U(A) = \sum_{j \in H} a(e_j, e_A) e_j = \sum_{j \in H} w_j e_j$$

其中 $a(e_j, e_A)$ 是注意力权重，$e_j$ 是历史行为 Embedding，$e_A$ 是候选 Item Embedding。

**多任务学习（MMoE）**：

$$y_k = h_k(\sum_{i=1}^n g_i(x) f_i(x))$$

其中 $f_i$ 是专家网络，$g_i$ 是门控网络。每个任务有独立的门控。

**生成式推荐（Semantic ID）**：

把每个 Item 用 LLM Embedding 聚类成 Semantic ID（如"AA23-BB45-CC67"），训练 Transformer 序列模型：

$$P(\text{next\_id} \mid \text{history\_ids}) = \text{Transformer}(\text{history\_ids})$$

推理时直接生成 Item ID 序列。

### 2.3 关键算法 / 方法

**协同过滤**：

1. **UserCF**（1994）——基于用户相似度。
2. **ItemCF**（2003）——基于物品相似度，工业主流。
3. **Slope One**（2005）——简单加权平均。
4. **矩阵分解（MF / SVD / SVD++）**（2006）——隐向量分解。
5. **PMF / BPMF**——概率矩阵分解。

**FM 系列**：

6. **FM**（2010）——自动二阶交叉。
7. **FFM**（2016）——场感知 FM。
8. **DeepFM**（2017）——FM + DNN。
9. **xDeepFM**（2018）——高阶交叉。
10. **AutoInt**（2019）——多头自注意力交叉。

**深度学习召回**：

11. **双塔模型**（2017）——召回事实标准。
12. **YouTube DNN**（2016）——召回深度模型。
13. **DSSM**（2013）——深度语义匹配。
14. **MIND**（2020）——多兴趣召回。

**深度学习精排**：

15. **Wide & Deep**（2016）——记忆 + 泛化。
16. **DeepCrossing**（2016）——深度交叉网络。
17. **DIN**（2018）——注意力机制 + 用户兴趣。
18. **DIEN**（2019）——兴趣动态演化。
19. **BERT4Rec / SASRec**（2019）——Transformer 推荐。
20. **SIM**（2020）——长序列兴趣建模。
21. **ETA**（2020）——高效目标注意力。
22. **DCN / DCN-V2**（2017/2020）——Deep & Cross。
23. **MaskNet**（2021）——掩码注意力。

**多任务推荐**：

24. **Shared-Bottom**——多任务共享底层。
25. **MMoE / OMoE**（2018）——多专家多门控。
26. **PLE**（2019）——分层多任务。
27. **ESSM**（2020）——全空间多任务。
28. **AITM**（2021）——自适应信息迁移多任务。

**图神经网络推荐**：

29. **NGCF**（2019）——Neural Graph CF。
30. **LightGCN**（2020）——轻量化 GCN。
31. **GraphRec**（2019）——图注意力推荐。
32. **KGAT**（2019）——知识图谱注意力。

**知识图谱推荐**：

33. **RippleNet**（2018）——知识图谱传播。
34. **KGAT**（2019）——协同知识图谱。
35. **MKR**（2019）——多任务知识图谱。

**强化学习推荐**：

36. **DQN 推荐**——长期价值。
37. **Bandit 推荐**——探索-利用。
38. **Policy Gradient 推荐**——个性化策略。

**生成式推荐（2022+）**：

39. **P5**（2022）——RecSys 预训练基础模型。
40. **GPT4Rec**（2023）——LLM 推荐。
41. **ChatRec**（2023）——对话式推荐。
42. **TIGER**（Google 2023）——生成式检索推荐。
43. **LC-Rec**（2024）——LLM 协同过滤。
44. **IDGenRec**（2024）——ID 生成推荐。
45. **CFGen**（2024）——协同过滤生成。

**多模态推荐**：

46. **VBPR**（2016）——视觉推荐。
47. **MMGCN**（2019）——多模态图卷积。
48. **CLIP4Rec**（2024）——CLIP 推荐。

**LLM 推荐**：

49. **InstructRec**（2023）——指令推荐。
50. **MoCa**（2024）——LLM + 协同过滤。

### 2.4 与相邻概念的关系

- **推荐 vs 搜索**：推荐是被动推送，搜索是主动查询。
- **推荐 vs 广告**：广告是有商业目的的推荐，推荐不一定有商业目的。
- **推荐 vs CTR 预估**：CTR 预估是推荐的一个环节（精排）。
- **推荐 vs 排序学习（LTR）**：LTR 是推荐精排的技术。
- **推荐 vs 内容理解**：内容理解是推荐的上游（理解 Item）。
- **推荐 vs 用户画像**：用户画像是推荐的基础。
- **推荐 vs RAG**：RAG 是检索增强生成，推荐是检索增强排序。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：分层架构（Funnel Architecture）**

召回 → 粗排 → 精排 → 重排，分层筛选：

- **召回（Recall）**：1000-10000 候选，模型轻量（双塔 / 协同过滤）。
- **粗排（Pre-Ranking）**：100-500 候选，轻量精排（LR / 小型 DNN）。
- **精排（Ranking）**：10-50 候选，重型精排（DeepFM / DIN / Transformer）。
- **重排（Re-Ranking）**：考虑多样性 / 业务规则 / 上下文。

**模式 2：多任务学习（Multi-Task Learning）**

同时优化多个目标（CTR + CVR + GMV + 时长）：

- MMoE / PLE / ESSM / AITM。
- 适合：电商、视频、信息流。

**模式 3：多模态推荐（Multimodal）**

整合文本 + 图像 + 视频 Embedding：

- 用 CLIP / ViT / BERT 提多模态 Embedding。
- 融合协同过滤信号。
- 适合：电商、内容平台。

**模式 4：图神经网络推荐（Graph-Based）**

用户 - 物品 - 属性构成图，用 GCN / GAT：

- LightGCN / NGCF / KGAT。
- 适合：社交推荐、知识图谱推荐。

**模式 5：强化学习推荐（RL-Based）**

长期价值优化：

- Bandit / DQN / PPO。
- 适合：电商促销、内容分发。

**模式 6：LLM 推荐（LLM-Based）**

用 LLM 做推荐：

- **直接推荐**：LLM 输出 Item 列表。
- **Embedding 推荐**：LLM 提 Embedding + 传统推荐。
- **理由生成**：LLM 生成推荐解释。

**模式 7：生成式推荐（Generative Recommendation）**

直接生成候选 ID（而非排序候选）：

- TIGER / LC-Rec / CFGen。
- 适合：与 LLM 架构对齐。

**模式 8：冷启动处理（Cold Start）**

- **新 Item**：用内容 Embedding（BERT / CLIP）做相似推荐。
- **新用户**：用人口学特征 + 探索（Bandit）。
- **Side Information**：用户社交关系、设备、地理位置。

**模式 9：实时推荐（Streaming）**

- 实时特征（Flink）+ 实时模型更新（在线学习）。
- 适合：新闻、短视频、电商。

**模式 10：联邦推荐（Federated Recommendation）**

- 数据不出域 + 跨域协作。
- 适合：跨企业营销。

### 3.2 适用场景决策表

| 业务特征 | 推荐模式 | 理由 |
| --- | --- | --- |
| 冷启动 Item 多 | 双塔 + 内容 Embedding | 用 Item 内容而非历史 |
| 行为数据丰富 | 协同过滤 / 双塔 | 用历史行为 |
| 长尾分布明显 | 双塔 + MMoE | 多任务缓解稀疏 |
| 多目标（CTR + GMV） | MMoE / PLE / ESSM | 多任务学习 |
| 长序列用户行为 | DIN / DIEN / SIM | 兴趣建模 |
| 强上下文（新闻 / 短视频） | SASRec / BERT4Rec | 序列建模 |
| 实时性要求高 | 在线学习 + Flink | 实时更新 |
| 内容异构（文本 + 图像） | 多模态推荐 / CLIP | 多模态融合 |
| 知识密集（医疗 / 教育） | 知识图谱推荐 | 利用 KG |
| 需要可解释 | LLM 推荐 + Prompt | LLM 可解释 |
| LLM 时代 / 内容生成 | 生成式推荐（TIGER） | 范式对齐 |
| 探索未知兴趣 | Bandit 推荐 | 探索-利用 |
| 长期价值优化 | RL 推荐 | 长期价值 |
| 跨域 / 隐私 | 联邦推荐 | 数据不出域 |
| 对话式推荐 | ChatRec / LLM 推荐 | 自然语言 |
| 多模态输入 | CLIP4Rec | 图文融合 |

### 3.3 反模式与陷阱

1. **「一开始就用深度学习」反模式**：上来就 DIN / Transformer，10 万用户 + 1 万 Item，效果不如双塔 + FM。**结构化数据双塔 + DeepFM 起步**。
2. **「忽视冷启动」反模式**：新 Item / 新用户永远推荐不出去。**必须有冷启动策略（内容 Embedding / Bandit）**。
3. **「单一目标优化」反模式**：只优化 CTR，长期 GMV 下降。**多任务 + 业务指标对齐**。
4. **「信息茧房」反模式**：CTR 优化导致用户兴趣越来越窄。**多样性 + 探索 + 重排规则**。
5. **「离线 AUC 高但在线效果差」反模式**：离线指标与业务不对齐。**A/B 测试 + 业务指标对齐**。
6. **「训练数据不更新」反模式**：用户兴趣变化，模型 3 个月没更新，效果断崖式下降。**实时特征 + 定期重训**。
7. **「忽视公平性」反模式**：推荐放大偏见（性别 / 地域）。**公平性约束 + 反事实评估**。
8. **「LLM 推荐盲目信任」反模式**：LLM 推荐没有评估集，效果不稳。**必须 Golden Set + 持续监控**。
9. **「生成式推荐无约束」反模式**：LLM 生成不存在的 Item（幻觉）。**必须约束生成 Item ID 在合法范围内**。
10. **「不做重排」反模式**：精排结果直接展示，缺乏多样性。**重排必须做（多样性 / 规则 / 上下文）**。

---

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

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：LLM 直接做推荐**

LLM 用 Prompt + 结构化输出做推荐：

```python
# Prompt
prompt = """用户画像：25-30 岁女性，时尚爱好者，近 7 天浏览连衣裙 3 次。
候选商品（10 个）：
1. 商品 A：连衣裙 ¥299 夏季碎花
2. 商品 B：连衣裙 ¥199 简约通勤
...
请按用户兴趣排序，前 5 个推荐："""

response = gpt4(prompt)  # 输出排序后的推荐
```

**代表工作**：

- **GPT4Rec**（2023）——LLM 生成推荐列表。
- **ChatRec**（2023）——对话式推荐。
- **InstructRec**（2023）——指令推荐。
- **MoCa**（2024）——LLM + 协同过滤。

**方向 2：LLM Embedding 推荐**

LLM 提 Embedding + 传统推荐架构：

- Sentence-BERT / BGE / OpenAI Embedding。
- 双塔召回 + 精排。
- 优势：跨语言、语义理解、零样本。

**方向 3：生成式推荐（Generative Recommendation）**

不再排序候选，直接生成 Item ID：

- **TIGER**（Google 2023）——Semantic ID + Transformer 生成。
- **LC-Rec**（2024）——LLM 协同过滤。
- **CFGen**（2024）——协同过滤生成。
- **IDGenRec**（2024）——ID 生成。

**架构**：

```
[用户历史 Item ID] → Semantic ID → Transformer → 预测下一 Item ID
```

**优势**：与 LLM 架构对齐，可与文本生成融合。

**方向 4：多模态推荐**

整合文本 + 图像 + 视频 Embedding：

- **CLIP4Rec**（2024）——CLIP 推荐。
- **MMGCN**（2019）——多模态图卷积。
- **VBPR**（2016）——视觉推荐。

**方向 5：Agent 推荐**

Agent 平台中，Tool / Action 推荐：

- **AgentRec**（2024）——Agent 决策推荐。
- **Tool 推荐**——根据任务推荐 Tool。
- **Action 推荐**——根据状态推荐 Action。

**方向 6：强化学习推荐**

长期价值优化：

- **Bandit 推荐**——探索-利用。
- **DQN 推荐**——长期累积价值。
- **PPO 推荐**——个性化策略。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**推荐 + RAG**：

- 用户 Query → 向量检索 Item Embedding → LLM 生成推荐解释。
- RAG 增强的可解释推荐。

**推荐 + 向量库**：

- 双塔召回 = 用户 Embedding × 物品 Embedding（向量检索）。
- 向量库（Faiss / Milvus）支撑亿级 Item 检索。

**推荐 + GraphRAG**：

- 用户 - 物品 - 属性构成知识图谱。
- GraphRAG 用多跳推理做"为什么推荐"。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **TIGER**（Google RecSys 2023）——生成式检索推荐。
- **LC-Rec**（2024）——LLM 协同过滤。
- **P5**（2022）——推荐基础模型。
- **MoCa**（2024）——LLM + 协同过滤。
- **InstructRec**（2023）——指令推荐。
- **CFGen / IDGenRec**（2024）——生成式推荐。
- **AgentRec**（2024）——Agent 推荐。
- **CLIP4Rec**（2024）——CLIP 推荐。
- **LLM4Rec**（2024 综合）——LLM 推荐综述。

**工业进展**：

- **Google Gemini + YouTube**（2024）——LLM 推荐 YouTube。
- **Amazon Rufus**（2024）——LLM 购物助手推荐。
- **字节 ByteRec + 豆包**（2024）——LLM 推荐。
- **阿里巴巴通义 + 推荐**（2024）——LLM 推荐电商。
- **腾讯混元 + 推荐**（2024）——LLM 推荐。
- **Meta Llama + 推荐**（2024）——开源 LLM 推荐。
- **HuggingFace Transformers Rec**（2024）——推荐模型库。
- **EasyRec 2.0**（阿里 2024）——支持 LLM 推荐。

**企业落地案例**：

- **字节跳动**：用 DIN + LLM Embedding 做短视频推荐，CTR +10%。
- **阿里巴巴**：用 MMoE + PLE + ESSM 做电商推荐，GMV +15%。
- **京东**：用 DeepFM + LLM 推荐做电商，转化率 +12%。
- **美团**：用双塔 + DIN 做外卖推荐，订单 +8%。
- **腾讯**：用 SASRec + Bandit 做视频推荐，时长 +10%。
- **Netflix**：用 BERT4Rec 做内容推荐，留存 +5%。
- **Amazon Rufus**（2024）：LLM 购物助手推荐，转化率 +8%。

### 5.4 未来 3-5 年趋势

1. **「生成式推荐成为主流」**：TIGER / LC-Rec / CFGen 引领，与 LLM 架构对齐。
2. **「LLM 推荐标准化」**：LLM 直接推荐 + LLM Embedding 推荐成为标配。
3. **「多模态推荐普及」**：CLIP / ViT / BERT 融合，文本 + 图像 + 视频统一推荐。
4. **「Agent 推荐」**：Agent 平台核心能力，Tool / Action 推荐成为基础设施。
5. **「强化学习推荐工业化」**：Bandit / RL 推荐在长期价值优化中普及。
6. **「联邦推荐」**：跨企业协作，隐私保护 + 数据不出域。
7. **「基础模型推荐」**：RecSys 预训练基础模型（P5 / OpenRec）通用化。
8. **「实时推荐」**：毫秒级特征 + 实时模型更新，秒级反馈。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：某头部电商的推荐系统**

- 背景：1 亿用户，10 万 SKU，日均 1 亿次推荐请求。
- 方案：双塔召回 + DeepFM 粗排 + DIN 精排 + 重排（多样性 + 业务规则）。
- 工具：EasyRec + Faiss + Flink + 自研推荐平台。
- 结果：CTR +20%，GMV 年增 30%+。

**案例 2：某短视频平台的推荐**

- 背景：日活 5 亿，每用户日均刷 100+ 视频。
- 方案：双塔召回 + MMoE 多任务精排 + SIM 长序列建模。
- 工具：ByteRec + 自研深度学习平台。
- 结果：日均时长 +15%，用户活跃 +10%。

**案例 3：某新闻信息流的推荐**

- 背景：实时新闻推荐，秒级更新。
- 方案：双塔召回（实时）+ DIN 精排 + 重排（多样性）。
- 工具：Flink + Redis + EasyRec。
- 结果：CTR +12%，用户留存 +8%。

**案例 4：某 LLM 推荐平台（生成式推荐）**

- 背景：电商 LLM 助手，对话式推荐。
- 方案：LLM Embedding 召回 + LLM 精排 + 生成式候选。
- 工具：GPT-4 + BGE Embedding + Faiss。
- 结果：用户满意度 +20%，转化率 +15%。

**案例 5：某音乐平台的推荐**

- 背景：Spotify-like 音乐推荐。
- 方案：协同过滤 + SASRec 序列建模 + Bandit 探索。
- 工具：Surprise + RecBole + Vowpal Wabbit。
- 结果：用户活跃 +12%，跳过率 -10%。

### 6.2 踩坑与经验

**坑 1：训练数据偏置**

- 现象：训练数据是"曝光过"的 Item，但推理时要给"未曝光过"的 Item 打分，导致偏差。
- 解法：用 Inverse Propensity Scoring（IPS）/ Doubly Robust 估计。

**坑 2：冷启动失败**

- 现象：新 Item 永远没机会曝光。
- 解法：必须用 Bandit / 内容 Embedding 主动探索新 Item。

**坑 3：离线 AUC 高但在线差**

- 现象：离线 AUC 0.85，上线 CTR 没动。
- 解法：A/B 测试是唯一标尺，离线指标必须与业务对齐。

**坑 4：长序列用户兴趣建模失效**

- 现象：用户 1000+ 行为，序列模型跑不动 / 效果差。
- 解法：用 SIM / LONGER / 长期兴趣 + 短期兴趣分桶。

**坑 5：LLM 推荐成本失控**

- 现象：每天 1 亿次 LLM 推荐，月账单 100 万美元。
- 解法：LLM Embedding 召回 + 轻量精排 + LLM 仅用于解释生成。

**坑 6：生成式推荐幻觉**

- 现象：LLM 生成不存在的 Item ID。
- 解法：约束生成 Item ID 在合法范围内（Constrained Decoding）。

**坑 7：多任务冲突**

- 现象：CTR / CVR / GMV 目标冲突，模型学不动。
- 解法：MMoE / PLE + 任务权重调优 + Pareto 分析。

**坑 8：重排缺乏多样性**

- 现象：精排结果同质化严重（全是类似 Item）。
- 解法：MMR / DPP 多样性约束 + 重排规则。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（单点验证，1-3 个月）**：

1. 选 1 个推荐场景（如"商品详情页相关推荐"）。
2. 用 ItemCF / 双塔跑通 baseline。
3. 召回 + 粗排 + 精排分层。
4. A/B 测试小流量验证。

**1→10（部门级，3-9 个月）**：

1. 扩展到 3-5 个推荐场景。
2. 引入 DIN / MMoE。
3. 实时特征（Flink）。
4. 模型监控 + 闭环。

**10→100（企业级，9-24 个月）**：

1. 多业务线统一推荐平台。
2. LLM 推荐 / 生成式推荐。
3. 多模态推荐（图 + 文 + 视频）。
4. RL 推荐（长期价值）。
5. Agent 推荐（Tool / Action）。

### 6.4 ROI 评估

**直接收益**：

- CTR / CVR / GMV / 时长提升（10-30% 常见）。
- 用户活跃 / 留存提升。
- 收入增长（电商 / 广告）。

**间接收益**：

- 数据闭环成熟（行为数据 + 推荐模型 + 反馈）。
- AI 资产化（用户画像 + Item Embedding）。
- 团队能力提升（推荐系统是 AI 工业化的标杆）。

**评估指标**：

- **业务指标**：CTR / CVR / GMV / 时长 / 留存 / 满意度。
- **技术指标**：AUC / GAUC / NDCG / Recall@K。
- **闭环指标**：反馈延迟 / 漂移检测灵敏度 / 重训周期。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 协同过滤 | 矩阵分解 | FM | 双塔 | DIN | LLM 推荐 | 生成式推荐 |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 精度 | 2 | 3 | 4 | 3 | 5 | 4 | 5 |
| 冷启动 | 1 | 1 | 2 | 3 | 2 | 5 | 3 |
| 可解释性 | 3 | 2 | 3 | 2 | 4 | 5 | 3 |
| 工程复杂度 | 2 | 2 | 3 | 3 | 4 | 3 | 5 |
| 大规模可扩展 | 3 | 3 | 4 | 5 | 3 | 3 | 4 |
| 长序列支持 | 1 | 1 | 2 | 2 | 5 | 4 | 5 |
| 多目标 | 1 | 1 | 2 | 2 | 4 | 4 | 4 |
| 工业成熟度 | 5 | 5 | 5 | 5 | 4 | 3 | 2 |
| AI 时代适配 | 1 | 1 | 2 | 3 | 4 | 5 | 5 |

**结论**：

- **冷启动友好**：LLM 推荐（5 分）。
- **工业默认**：双塔召回 + DeepFM/DIN 精排。
- **未来方向**：生成式推荐 + LLM 推荐。

### 7.2 决策树

```
[推荐系统]
   │
   ├── [是否有大量行为数据？]
   │     ├── 是 → 协同过滤 / 双塔 + DIN
   │     └── 否 → 内容 Embedding + LLM 推荐
   │
   ├── [是否有 LLM？]
   │     ├── 是 → LLM Embedding 召回 + LLM 解释
   │     └── 否 → 传统推荐
   │
   ├── [是否需要生成候选？]
   │     ├── 是 → 生成式推荐（TIGER / LC-Rec）
   │     └── 否 → 排序候选
   │
   ├── [是否多目标？]
   │     ├── 是 → MMoE / PLE / ESSM
   │     └── 否 → 单目标精排
   │
   ├── [是否长序列？]
   │     ├── 是 → DIN / DIEN / SIM / SASRec
   │     └── 否 → DNN
   │
   ├── [是否需要可解释？]
   │     ├── 是 → LLM 推荐 + Prompt
   │     └── 否 → 黑盒
   │
   └── [是否多模态？]
         ├── 是 → CLIP4Rec / 多模态融合
         └── 否 → 单模态
```

### 7.3 组合使用

**组合 1：双塔召回 + DIN 精排（工业默认）**

- 双塔召回千级候选，DIN 精排到十级。
- 优势：性能 + 精度平衡。

**组合 2：MMoE + DIN（多任务 + 兴趣）**

- MMoE 处理多目标，DIN 处理用户兴趣。
- 适用：电商 / 内容。

**组合 3：LLM Embedding + 双塔（语义推荐）**

- LLM 提 Embedding + 双塔检索。
- 优势：跨语言、语义理解。

**组合 4：生成式推荐 + 排序推荐（混合）**

- 生成候选 + 排序精排。
- 适用：与 LLM 架构对齐。

**组合 5：Bandit + 精排（探索-利用）**

- Bandit 探索新 Item，精排保主流量。
- 适用：内容平台。

**组合 6：协同过滤 + 内容推荐（冷启动）**

- 行为少时用内容 Embedding，行为多时用协同过滤。
- 适用：混合推荐。

---

## 8. 面试真题集

> 本节针对「推荐系统（Recommendation）」的高频面试考点，按 **召回 - 粗排 - 精排 - 重排** 分层漏斗 + **冷启动 / 实时 / 多任务 / 评估** 横切主题整理 6 道综合性真题。每题 800-1500 字，按 **概念定位 → 核心原理 → 工程实现 → 行业实践 → 落地陷阱** 五段式作答，并注明与 [业务过程建模](../../01-modeling/01-business-process-modeling/01-business-process-modeling.md)（一个业务过程 = 一组过程度量 = 一张事实表）的映射关系——推荐系统的"曝光 - 点击 - 转化 - 复购"对应四个可观测的业务过程事件，事实度量直接定义 CTR / CVR / GMV。

### Q1：推荐系统为什么要分层（召回 - 粗排 - 精排 - 重排）？每层的职责、候选规模、典型模型、延迟预算如何匹配？

**题型**：架构设计题（必考，难度 ★★★★☆）

**考察点**：候选规模递减 → 模型精度递增 → 算力成本递减的「漏斗模型」理解，以及对每层职责边界的把握。

#### 1. 概念定位
推荐系统的根本矛盾是 **亿级候选 vs 毫秒级延迟**。分层漏斗的本质是「精度 ↔ 算力」的分级交易：召回层用轻量模型把全量 1 亿 Item 缩到千级（召回率优先），粗排层用中型模型缩到百级（精度换速度），精排层用重型模型缩到十级（精度优先），重排层引入多样性与业务规则完成最终决定。从业务过程建模的视角看，每一次曝光 - 点击 - 转化都是一个 `recommendation.impressed` / `recommendation.clicked` / `recommendation.converted` 事件，漏斗只是把"在何时生成候选"这件事按计算代价切成四段。

#### 2. 核心原理
- **召回 Recall**：从亿级到千级，典型模型是 **双塔（Two-Tower）/ YouTube DNN / ItemCF / Swing / 多兴趣 MIND**，目标 Recall@1000 ≥ 95%。  
- **粗排 Pre-Ranking**：从千级到百级，典型模型是 **轻量 DeepFM / COLD / LR**，要求 P99 ≤ 5 ms。  
- **精排 Ranking**：从百级到十级，典型模型是 **DeepFM / DIN / DIEN / SIM / DCN-V2 / ESSM**，要求 P99 ≤ 40 ms。  
- **重排 Re-Ranking**：从十级到最终展示（通常 6-20 条），典型做法是 **MMR（Maximal Marginal Relevance）/ DPP / Listwise / 业务规则引擎**。  

候选规模遵循 **100× ~ 10×** 递减比例，每层模型容量、特征维度、延迟预算严格匹配。

#### 3. 工程实现
- **服务编排**：召回 → 粗排 → 精排 → 重排通常以 **gRPC / Thrift** 串联，每层独立部署、独立扩缩容；召回层常驻向量检索服务（Faiss / Milvus），粗排精排用 TF-Serving / Triton 推理，重排用规则引擎 + 轻量 DNN。  
- **延迟分配**：召回 20 ms + 粗排 10 ms + 精排 40 ms + 重排 5 ms + 业务规则 5 ms ≈ P99 80 ms。  
- **多路召回**：双塔（语义）+ ItemCF（行为）+ 热门（统计）+ Bandit（探索）四路并发，再做合并去重。  
- **回流闭环**：精排结果回流到推荐事实表（`recommendation_log`），下次训练做负样本与偏差修正。

#### 4. 行业实践
- **YouTube（Google）** 经典 DNN 双塔召回 + 精排两层。  
- **阿里淘宝** 是 **双塔 + DIN + PLE 多任务 + 业务重排** 的四段式模板。  
- **字节抖音** 是 **双塔 / SIM 长序列 + MMoE 多任务精排**，日均时长提升显著。  
- **京东 JDRec** 是 **DeepFM + 多路召回 + 规则重排**。  
- **美团** 到店 + 外卖用 **双塔 + DIN + 多样性重排**。  
- **Netflix** 用 **BERT4Rec 序列召回 + 个性化海报精排**。

#### 5. 落地陷阱
- **层级越界**：粗排层引入重型 DIN（延迟爆炸）或召回层做了交叉特征（推理代价不可接受）。  
- **缺少重排**：精排 CTR 高但全页同质，信息茧房，次日留存下降。  
- **回流断裂**：精排结果没有回流到训练样本，模型迭代慢、效果停滞。  
- **延迟分配失衡**：精排给 100 ms 留给召回 5 ms，看起来快但召回率跌穿 90%。  
- **多路召回打架**：各路候选无去重策略，热门 Item 霸榜。

---

### Q2：双塔模型（Two-Tower）与 DeepFM 在召回 vs 精排定位上的本质差异是什么？为什么不能互换？

**题型**：模型机制对比题（高频，难度 ★★★★☆）

**考察点**：双塔"结构解耦 → 向量检索"的核心架构优势，与 DeepFM"特征交叉 → 精确打分"的目标冲突，进而理解召回与精排在训练 / 推理范式上的根本差异。

#### 1. 概念定位
双塔的本质是 **用户与物品独立建模 → 双方 Embedding 内积 → 向量检索 top-K**；DeepFM 的本质是 **FM 捕捉二阶交叉 + DNN 捕捉高阶非线性 → 单点打分**。前者面向 **检索范式（retrieval）**，后者面向 **打分范式（scoring）**。从业务过程的角度看，召回对应"把候选带进来"的事件语义（粗粒度），精排对应"决定展示顺序"的事件语义（细粒度），两者对实时性、特征丰富度、模型容量的要求完全不同。

#### 2. 核心原理
- **双塔模型**  
  用户塔 $u = f_u(x_u)$，物品塔 $v = f_v(x_v)$，相似度 $\hat y = \cos(u, v)$。训练用 softmax over negatives；推理时把物品 Embedding 离线预计算 + 索引到 Faiss / Milvus，线上只算用户 Embedding 然后做 ANN 检索。**关键限制**：用户与物品的特征交互必须发生在塔内，两塔之间只能通过最后的内积交互，因此 **无法建模"用户 - 物品"交叉特征**（如用户 - 物品类目共现）。

- **DeepFM**  
  $\hat y = \mathrm{FM}(x) + \mathrm{DNN}(x)$，FM 部分自动学习两两特征的内积交叉，DNN 部分学习高阶非线性。任意特征交互都可以在 forward 阶段就计算好，适合做 **点对点的精确打分**。但因为要把所有候选都过一遍完整模型，所以 **推理代价不可承受于亿级候选**。

#### 3. 工程实现
- **双塔召回**：用户特征（人口学 + 行为统计 + 上下文） → 用户塔 MLP → 64 维向量；物品特征（类目 + 品牌 + 文本 + 图像） → 物品塔 MLP → 64 维向量；离线把亿级物品 Embedding 索引到 Faiss IVFFlat / HNSW，线上一查 top-1000。  
- **DeepFM 精排**：把用户 - 物品 - 上下文 - 交叉特征全部 concat 喂入 FM + DNN，输出 0-1 之间的 CTR 预测。  
- **不可互换原因**：  
  - 把 DeepFM 做召回 = 亿次 DNN 推理，QPS 撑不住。  
  - 把双塔做精排 = 候选 Item 与用户没有交叉特征，用户性别 × 母婴类目的强信号学不到。

#### 4. 行业实践
- **YouTube（Google）** 召回层用 DNN 双塔（用户的 watch history + 人口学），精排层用 Wide & Deep / DeepFM。  
- **Meta DLRM** 是经典的"召回 + 精排"双塔 → 交叉网络范式。  
- **阿里 DIN** 精排侧把双塔做不到的用户 - 历史注意力补回来。  
- **Pinterest PinSage** 是图卷积版双塔，召回用 PinSage Embedding，精排用 LightGCN 重排。  
- **Amazon Item-to-Item** 是经典工业级双塔：用户表 → 物品 → 同类物品（i2i），召回极简但精排靠业务规则 + 业务经验。

#### 5. 落地陷阱
- **双塔冷启动塌陷**：新物品没有行为就没法训练物品塔，必须用内容 Embedding（BERT / CLIP）兜底。  
- **DeepFM 召回率塌陷**：把 DeepFM 当成"精排兜底"会导致精排候选全是热门 Item，召回层被穿透。  
- **负采样偏差**：双塔训练用 in-batch negative，热门物品作为负样本被过度打压。  
- **向量漂移**：用户塔与物品塔分别更新，导致 user-item 分布错位，需要周期性联合校准。

---

### Q3：DIN / DIEN 为什么用注意力池化（attention pooling）替代 mean / max pooling？如何建模"用户兴趣随时间动态演化"？

**题型**：深度学习机制题（必考，难度 ★★★★★）

**考察点**：DIN 用候选 Item 触发的 Local Activation Unit 计算注意力权重；DIEN 用 GRU + 注意力抽取兴趣演化路径；理解为什么"不同候选需要不同兴趣表达"。

#### 1. 概念定位
DIN（阿里 2018）的核心洞察是 **用户兴趣是 multi-interest 的、且与候选 Item 相关**——给用户推泳衣应激活其历史中的泳衣 / 度假相关行为，推婴儿用品应激活其曾经的母婴浏览。传统的 mean / max pooling 把所有历史行为压缩成一个固定向量，忽略了 **"用户兴趣需要被候选 Item 唤醒"** 这一关键机制。DIEN（阿里 2019）进一步把兴趣表示为时序演化过程，引入 AUGRU（Attention-based GRU）追踪兴趣路径。

#### 2. 核心原理
- **DIN 注意力池化**  
  $$v_U(A) = \sum_{j \in H} a(e_j, e_A) e_j$$  
  其中 $a(\cdot)$ 是 Local Activation Unit，输入为 $[e_j, e_A, e_j - e_A, e_j \odot e_A]$（concat 四元组），输出注意力权重 $w_j$。它 **不归一化到 1**，允许兴趣激活"集中度"自然显现。

- **DIEN 兴趣演化**  
  三层结构：  
  1. **Behavior Layer**：原始行为序列 → Embedding。  
  2. **Interest Extractor Layer**：用 GRU 抽取每一时刻的兴趣状态 $h_t$。  
  3. **Interest Evolving Layer**：用 AUGRU（注意力更新 GRU）结合候选 Item 调节兴趣漂移方向，$\tilde h_t = (1 - \alpha_t) \tilde h_{t-1} + \alpha_t \tilde h_t'$。

- **SIM（Search-based Interest Model）**：长序列兴趣建模的代表，把 1000+ 行为序列通过 GSU（General Search Unit）粗筛到 50-100，再用本地注意力精排。

#### 3. 工程实现
- **LocalActivationUnit**：输入维度 $4 \times \text{embed\_dim}$（concat），MLP 输出 1 个注意力分数。  
- **训练技巧**：DIN 历史序列 padding 到 50-100，DIEN 训练时把兴趣状态序列一起传入 MLP。  
- **在线服务**：DIN 推理需要拉历史行为（Redis / Velox / 自研 KV），P99 控制在 30 ms 以内。  
- **长序列优化**：SIM / ETA 把 1000+ 行为压缩到 50-100，再做注意力，降低线上 KV 读取带宽。

#### 4. 行业实践
- **阿里 DIN / DIEN / SIM**：电商用户兴趣建模的标杆。  
- **字节抖音**：长视频 + 短视频混合序列用 DIEN 思想建模。  
- **京东**：DIN 用于"猜你喜欢"，CTR +12% 量级。  
- **美团**：DIN 用于外卖商家推荐，订单 +8%。  
- **Uber Eats**：DIN 变种用于用户 - 餐厅兴趣建模。  
- **快手**：DIN + 长序列视频兴趣建模。

#### 5. 落地陷阱
- **历史拉取代价**：DIN 需要实时拉取用户最近 50-100 行为，KV 命中率与带宽压力大。  
- **冷启动失活**：新用户行为 < 5 条，注意力分布几乎无意义，需降级到双塔或内容推荐。  
- **padding 噪声**：历史行为 padding 太多会让注意力被分散，必须做时间衰减或长度过滤。  
- **兴趣漂移**：兴趣演化要求分钟级更新，单纯离线训练无法捕捉实时变化。  
- **数据偏置**：只看到点击过的 Item，"曝光未点击"语义丢失。

---

### Q4：MMoE 多任务学习如何缓解 CTR / CVR / GMV / 时长等多个目标的冲突？专家网络与门控如何设计？

**题型**：多任务架构题（高频，难度 ★★★★☆）

**考察点**：MMoE 用 K 个专家网络 + 每个任务独立门控，让任务共享底层表征但保留独立决策路径；以及 PLE / ESSM 等改进方案的差异。

#### 1. 概念定位
推荐系统的本质是 **多目标优化问题**——CTR（点击）、CVR（转化）、GMV（金额）、时长（停留）、留存（次日活跃）经常相互拉扯。Shared-Bottom 共享底座容易出现任务负迁移（一个任务涨另一个任务跌）。MMoE（阿里 + Google 2018）提出 **Multi-gate Mixture-of-Experts**：用 K 个专家网络分别学不同表征，每个任务独立门控决定使用专家的权重，让相关任务共享、不相关任务独立。从业务过程看，CTR 是曝光 - 点击的转化率、CVR 是点击 - 购买的转化率、GMV 是购买事件度量，三个过程度量在同一张用户粒度事实表里天然耦合。

#### 2. 核心原理
- **Shared-Bottom**：所有任务共享一个 MLP 顶层 → 任务负迁移。  
- **MMoE**：  
  $$y_k = h_k \left( \sum_{i=1}^{K} g_i^{(k)}(x) \cdot f_i(x) \right)$$  
  - $f_i$ 是 K 个专家网络，每个独立 MLP。  
  - $g_i^{(k)}$ 是任务 k 的门控，softmax(K) 输出专家权重。  
  - $h_k$ 是任务塔（task tower），各自独立。  
- **PLE（Progressive Layered Extraction）**：分层多任务，下层专家有"任务专属 + 任务共享"两类，避免任务负迁移。  
- **ESSM（Entire Space Multi-task Model）**：解决 CVR 样本稀疏问题——用 CTCVR（全空间转化）作为主任务，CVR 拆成 CTCVR / CTR。  
- **AITM（Adaptive Information Transfer Multi-task）**：自适应信息迁移，让任务间按需共享信息。

#### 3. 工程实现
- **专家数量**：通常 K = 4-8，过少退化为 Shared-Bottom，过多训练不稳定。  
- **任务权重**：CTR : CVR : GMV ≈ 1 : 0.3 : 0.5 是工业常见配置；权重过小导致任务训练不充分。  
- **Loss 融合**：$\mathcal L = \sum_k w_k \mathcal L_k + \lambda \mathcal L_{\text{share}}$，或用 Uncertainty Weighting 自动调权。  
- **工程接口**：每个任务有自己的 AUC / GAUC 监控、独立训练 - early stop，但底层特征 + 专家共享。

#### 4. 行业实践
- **Google MMoE**：YouTube 视频推荐多任务（点击 + 完播 + 分享）。  
- **阿里 ESSM**：淘宝电商 GMV 推荐，CVR 样本稀疏问题缓解。  
- **阿里 PLE**：淘宝首页推荐，多任务 SOTA。  
- **字节 ByteRec**：信息流多任务（CTR + 点赞 + 评论 + 完播）。  
- **美团**：外卖推荐多任务（点击 + 下单 + 复购）。  
- **平安保险**：产品推荐多任务（CTR + 留资 + 投保）。

#### 5. 落地陷阱
- **任务负迁移**：K = 2 时 MMoE 退化为 OMoE，效果退化 → 必须 K ≥ 4。  
- **CVR 样本选择偏差**：点击 - 转化的样本与全空间分布不同，ESSM 必须做全空间建模。  
- **Pareto 前沿**：多任务优化本质上求 Pareto 最优，不可同时涨所有指标，需业务确定优先级。  
- **任务权重僵化**：固定权重不适应季节性 / 活动期，需动态调整。  
- **门控坍缩**：所有任务门控都选同一专家 → 退化为 Shared-Bottom，需加门控熵正则。

---

### Q5：推荐系统的「冷启动」有哪些类型？新用户 / 新商品 / 新平台 / 新场景分别如何破局？

**题型**：场景工程题（必考，难度 ★★★★☆）

**考察点**：冷启动三类问题的本质——用户侧的"没有行为"、商品侧的"没有曝光"、场景侧的"没有样本"——各自的工程方案差异。

#### 1. 概念定位
冷启动（Cold Start）是推荐系统最经典的三大长尾挑战之一。从业务过程视角看，冷启动意味着"业务事件样本不足"——曝光 - 点击事件没有形成足以训练模型的样本量。需要根据"缺什么"对症下药。

#### 2. 核心原理（按四类冷启动分述）

| 冷启动类型 | 本质问题 | 核心解法 |
| --- | --- | --- |
| **新用户** | 没有历史行为，无法个性化 | 人口学特征 + 探索（Bandit）+ 内容匹配 |
| **新商品** | 没有曝光 / 点击，无法学 Embedding | 内容 Embedding（BERT / CLIP）+ 流量扶持 + Bandit |
| **新平台** | 全域无样本 | 跨域迁移 + 联邦学习 + 规则兜底 |
| **新场景**（如新功能） | 业务事件尚未建模 | Few-shot Learning + LLM Zero-shot + Prompt 推荐 |

#### 3. 工程实现
- **新用户冷启动**：  
  1. 注册时搜集人口学（年龄 / 性别 / 地域）+ 设备 + 入口来源。  
  2. 用 LinUCB / Thompson Sampling Bandit 做探索，β 越大越探索。  
  3. 利用「最近一次会话的实时行为」做短时个性化。  
- **新商品冷启动**：  
  1. 用 BERT / CLIP 提内容 Embedding，与相似商品做 ItemCF。  
  2. 流量侧「新商品池」保证每天曝光 ≥ 一定次数。  
  3. 用 Contextual Bandit 处理"边探索边利用"。  
- **新平台冷启动**：  
  1. 从外部 / 关联方迁移知识（跨域协同过滤）。  
  2. 用 LLM Embedding 做 Zero-shot 推荐（GPT4Rec / InstructRec）。  
  3. 规则兜底：热门 + 编辑精选。

#### 4. 行业实践
- **Spotify**：新歌冷启动用 **EGES（Enhanced Graph Embedding with Side information）**，把歌曲音频 + 歌单 + 艺人共同嵌入。  
- **Airbnb**：新房源冷启动用 **Listing Embedding（GraphSAGE 风格）**，用相似地域 / 价格 / 设施做邻居检索。  
- **LinkedIn**：新用户用 **人口学 + 简历 Embedding** 做职位推荐。  
- **Uber Eats**：新餐厅用 **菜品图像（CLIP）+ 类目 + 地理** 做菜品推荐。  
- **招行（理财）**：新用户用 **风险测评问卷 + 人口学** 做基金推荐。  
- **平安（保险）**：新用户用 **年龄 + 收入 + 资产等级** 做产品分层推荐。  
- **米哈游**：新角色 / 新活动用 **历史活动相似度 + LLM 推荐** 兜底。  
- **Shein**：新商品用 **图像 + 文本 Embedding** 做"相似商品"推荐。  
- **字节抖音**：新视频用 **多模态 Embedding + 流量池扶持**。

#### 5. 落地陷阱
- **冷启动流量倾倒**：新商品扶持成为"流量垃圾场"，CTR 极低拉低整体指标 → 必须做"扶持配额制"。  
- **Bandit 探索过激**：Thompson Sampling β 设置过大导致用户体验差，立刻流失。  
- **内容 Embedding 语义陷阱**：图像 Embedding 与点击行为分布不对齐，冷启动转化率与正常差 ≥ 30%。  
- **跨域迁移负迁移**：源域与目标域分布差异大，直接迁移反而拉低效果，需要 Domain Adaptation。  
- **LLM 推荐成本**：每天 1 亿次 LLM 推荐不可行，必须 LLM Embedding 预计算 + 轻量在线。

---

### Q6：推荐系统如何做到离线 AUC 与在线 CTR / CVR / 留存等业务指标对齐？实时推荐与反馈闭环怎么设计？

**题型**：评估 / 闭环工程题（高频，难度 ★★★★★）

**考察点**：理解 GAUC / NDCG / Recall@K 离线指标的局限性，掌握在线 A/B 测试、Interleaving、反馈链路、流式特征的关键设计。

#### 1. 概念定位
推荐系统最常见的失败是 **「离线 AUC 0.85，上线 CTR 没动」**——离线指标与业务不对齐。根本原因是：①离线样本有偏差（曝光过的 ≠ 全量候选）；②离线优化目标是 LogLoss / AUC，与 GMV / 时长 / 留存业务目标不一致；③实时反馈链路断。从业务过程看，"曝光 → 点击 → 转化 → 复购 → 流失"构成一条完整的事件链（参考业务过程建模），评估必须覆盖 **业务过程的端到端延迟与质量**，而不是单点 AUC。

#### 2. 核心原理
- **离线指标体系**：  
  - **单点**：AUC / LogLoss / GAUC（分组 AUC，按用户聚合）/ Recall@K / NDCG@K。  
  - **排序**：NDCG / MAP / MRR（适合精排）。  
  - **业务**：CTR = 点击 / 曝光，CVR = 转化 / 点击，GMV / 时长 / 留存。  

- **在线评估**：  
  - **A/B 测试**：分桶均匀，金标准。  
  - **Interleaving**：把新旧模型结果交错展示，看用户偏好（更快、更敏感）。  
  - **Switchback**：时序交替分桶（适用于电商大促）。  

- **实时闭环**：  
  - 行为日志 → Kafka → Flink 实时特征 → 在线推理 → 用户反馈回流到特征库与训练样本。

#### 3. 工程实现
- **离线训练**：用次日样本训练当天模型，特征包含 7 / 14 / 30 天窗口统计。  
- **在线推理**：实时特征（用户最近 5 分钟行为）从 Redis 拉取，预训练 Embedding 从向量库拉取。  
- **反馈链路**：曝光 → 点击日志在 1 秒内回流到 Kafka，Flink 在 5 分钟内更新实时特征；次日精排训练消费全量回流日志。  
- **指标监控**：  
  - 离线：训练 AUC 监控、特征分布漂移（KS / PSI）。  
  - 在线：A/B 桶的 CTR / CVR / GMV / 时长 + P99 延迟 + QPS。  
- **纠偏方法**：IPS（Inverse Propensity Scoring）/ Doubly Robust 估计 / 探索流量兜底。

#### 4. 行业实践
- **Google YouTube**：A/B + Interleaving 双轨评估；分钟级流式特征。  
- **Netflix**：用 Interleaving 快速验证推荐策略，避免长时间 A/B 的延迟成本。  
- **Uber Eats**：Switchback 实验设计应对外卖高峰期的强时间相关性。  
- **阿里淘宝**：实时 Flink 特征 + 每小时级模型增量 + A/B 测试平台。  
- **字节 ByteRec**：分钟级实时训练 + 在线学习 FTRL。  
- **京东**：实时特征 + 全链路监控 + 业务指标对齐 dashboard。  
- **Spotify**：用流式 Flink 推实时播放特征 + 反馈闭环，强化学习推荐。  
- **Meta DLRM**：端到端 GPU 推理 + 分钟级反馈链路。

#### 5. 落地陷阱
- **离线 AUC 高但在线无效**：LogLoss 与业务不对齐，必须看 GAUC + 业务指标。  
- **A/B 测试样本不足**：未跑满周期就下结论，新模型上线反而损失 GMV。  
- **反馈延迟**：实时特征没接回流，模型用的是"昨天的数据"。  
- **特征穿越**：用未来特征训练（数据泄漏），离线 AUC 虚高。  
- **曝光偏差**：训练只用曝光过的 Item，导致模型对新候选打分偏低。  
- **数据漂移**：模型 3 个月没更新，输入分布已变化，效果断崖式下跌。  
- **业务指标波动**：大促 / 节假日与日常分布不同，必须分层评估。

---

## 小结

> 本章 6 道真题覆盖推荐系统分层架构、双塔 vs 精排、注意力序列建模、多任务学习、冷启动、实时评估六大主题。题目之间存在 **层层递进** 关系：Q1 给出宏观漏斗，Q2-Q4 剖析每层典型模型机制，Q5 处理冷启动等横切问题，Q6 把评估与闭环闭环起来。对应到业务过程建模视角，每一个"曝光 - 点击 - 转化 - 复购 - 流失"事件都是推荐系统要建模与评估的业务过程，事实度量（CTR / CVR / GMV / 时长 / 留存）定义评估对象，事件时序定义建模对象，由此推荐系统成为 Ch2 数据科学算法在「业务工程化」维度的集大成章节。

> 进一步可参考：  
- Ch1 · 业务过程建模（事实表的「原子颗粒」）→ 推荐过程事实表  
- Ch2 · 评估章节（推荐系统的评估指标体系）  
- Ch3 · 湖仓 / 实时存储（支撑推荐离线 + 实时数据闭环）  
- Ch4 · 向量库（双塔召回调用的 Faiss / Milvus）  
- Ch5 · 数据 Agent（Agent 平台 Tool / Action 推荐）  
- Ch6 · Embedding & 检索（LLM Embedding 推荐）
