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

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 1 个原 PDF 子章节、共 7 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §18.6 | 可扩展MLOps架构设计 | 18.6.1 ~ 18.6.7（共 7） | 7 | 主 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §18 ⼤数据平台如何赋能MLOps与特征⼯程 > 本主题涵盖 1 个子节、7 道题。

#### 2.1.6 可扩展MLOps架构设计

> 来源：原 PDF §18.6，收录 7 道题。

| 题号 | 难度 |
| --- | :---: |
| §18.6.1 | ★★★☆☆ |
| §18.6.2 | ★★★☆☆ |
| §18.6.3 | ★★★☆☆ |
| §18.6.4 | ★★★☆☆ |
| §18.6.5 | ★★★★☆ |
| §18.6.6 | ★★★★☆ |
| §18.6.7 | ★★★★★ |

- **§18.6.1**：请解释MLOps的核⼼⽬标，并说明它在⼤数据平台中的重要性。
- **§18.6.2**：请描述⼀个典型的MLOps流⽔线包含哪些关键阶段，并简要说明每个阶段的主要
- **§18.6.3**：请讨论在构建⽀持MLOps的⼤数据平台时，如何平衡模型的迭代速度、系统的稳
- **§18.6.4**：在⽀持A/B测试的MLOps架构中，如何实现模型版本管理、流量分配和实验效果
- **§18.6.5**：在⼤规模分布式集群（如万节点Hadoop/Spark集群）上部署和管理机器学习模
- **§18.6.6**：请阐述在MLOps实践中，如何设计⼀个⾼效且可靠的特征存储（Feature Store）
- **§18.6.7**：⾯对模型训练和推理过程中可能出现的数据漂移（Data Drift）和概念漂移（Con

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **AI/ML 集成与治理**
- **架构演进与未来趋势**

## 4 本章小结

> 本面试真题集收录 7 道题，覆盖 1 个原 PDF 主题、1 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [02-data-science 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
