# 推荐算法（Recommendation）

> **一句话定位**：协同过滤 / 双塔 / DeepFM / DIN / LLM 推荐——从"猜你喜欢"到"理解你"，推荐系统是电商 / 内容 / 广告的共同底座。

> 本文是 data-travel 项目 [Ch2 · 数据科学与算法](../../README.md) 的子章节（**05 推荐算法**）。覆盖 R2 数据科学算法领域中"推荐系统（Recommendation）"相关的核心原理、设计模式、工程实现与 AI 时代演进。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 推荐系统的核心架构（召回 - 粗排 - 精排 - 重排）是什么？ | §1.3 / §3.1 |
| 协同过滤 / FM / DeepFM / 双塔 / DIN 怎么选？ | §3.3 决策表 |
| 多任务推荐 / 强化学习推荐 / 知识图谱推荐怎么做？ | §3.1 / §5 前沿 |
| LLM 推荐 / 生成式推荐（生成候选 ID）怎么搞？ | §5.1 / §5.3 |
| 实时推荐（流式）、冷启动、多模态推荐怎么落地？ | §3.2.9 / §3.2.8 / §3.2.3 |
| 推荐系统如何与 RAG / Agent 平台融合？ | §5.2 / §5.3 接口表 |

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

> 💡 **思考锚点**：你的召回双塔，线上是从向量库（Faiss / Milvus）取 top-k、离线用 softmax over negative samples 训练（§2.2）：k 取大还是取小，直接决定精排要背多少候选、负样本集要建多大——你现在的 k 是召回率倒推出来的，还是照别人配置抄的？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](05-recommendation-section-3-sec3.md)
- [§4. 工程实现](05-recommendation-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](05-recommendation-section-5-ai.md)
- [§6. 落地实践](05-recommendation-section-6-sec6.md)
- [§7. 与其他方法对比](05-recommendation-section-7-sec7.md)
- [§8. 面试真题集](05-recommendation-section-8-sec8.md)

---
