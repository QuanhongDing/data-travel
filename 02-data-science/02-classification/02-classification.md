# 分类算法（Classification）

> **一句话定位**：从 LR / SVM / GBDT 到深度学习与 LLM 零样本——把"是/否/哪一类"问题抽象为可量化的判别模型。

> 本文是 data-travel 项目 [Ch2 · 数据科学与算法](../../README.md) 的子章节（**02 分类算法**）。覆盖 R2 数据科学算法 领域中"分类（Classification）"相关的核心原理、设计模式、工程实现与 AI 时代演进。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 分类任务的数学本质是什么？损失函数为什么选这个？ | §2.2 / §2.3 |
| LR、SVM、GBDT、深度学习分类器怎么选？ | §3.2 决策表 |
| 类别不平衡 / 多标签 / 冷启动怎么办？ | §3.3 反模式 / §4.2 关键技术点 |
| XGBoost / LightGBM 怎么上线服务？ | §4.1 落地步骤 / §4.4 代码 |
| LLM 时代是否还需要专门训练分类器？ | §5.1 / §5.2 / §5.3 |
| 算法工程师与数据架构师如何在分类任务上分工？ | §6 落地实践 / §7 对比 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：分类（Classification）是监督学习（Supervised Learning）的核心任务之一——给定输入 $x \in \mathcal{X}$ 与有限离散标签集合 $\mathcal{Y} = \{y_1, y_2, \ldots, y_K\}$，学习一个映射 $f: \mathcal{X} \rightarrow \mathcal{Y}$，使得对未见样本 $(x^*, y^*)$ 的预测尽可能准确。

**工程定义**：在数据架构师手里，分类是**把业务问题抽象为"输入特征 → 类别概率"的判别模型**。它告诉你：这条交易是不是欺诈？这个用户会不会流失？这篇新闻是科技还是财经？这张图片是不是违禁品？——所有"是 / 否 / 哪一类"的问题，本质上都是分类。

**解决的业务问题**：

| 业务域 | 典型分类问题 | 标签空间 |
| --- | --- | --- |
| 风控 / 反欺诈 | 交易欺诈识别、申请反欺诈 | {欺诈, 正常} |
| 推荐 / 广告 | CTR 预估、CVR 预估 | {点击, 不点击} / {转化, 不转化} |
| 金融 | 信贷违约预测、客户分层 | {好客户, 差客户} / A-H 评级 |
| 内容 / 媒体 | 新闻分类、敏感内容识别、垃圾邮件 | 多类别 + 多标签 |
| 医疗 | 疾病诊断、影像良恶性、ICD 编码 | 多分类 + 不平衡 |
| 运营 | 用户流失预测、活跃度分层 | 二分类 + 多分类 |
| 工业 | 设备故障分类、缺陷检测 | 多分类 + 类别不平衡 |
| AI Agent | Tool 路由、意图识别、Query 分类 | 多分类 + 零样本 |

**分类 vs 其他监督学习任务**：

| 任务 | 标签空间 | 输出 | 典型损失 | 典型场景 |
| --- | --- | --- | :---: | --- |
| **二分类** | $\{0, 1\}$ | P(y=1\|x) | BCE / Hinge | CTR、欺诈 |
| **多分类** | $\{1, \ldots, K\}$ | softmax 概率 | Cross-Entropy | 新闻分类 |
| **多标签** | $\{0, 1\}^K$ | 每个标签独立 | BCE per label | 文本标签、内容安全 |
| **回归** | $\mathbb{R}$ | 连续值 | MSE / MAE | 销量、评分 |
| **排序学习** | 排序对 / 列表 | 相对顺序 | LambdaRank | 推荐召回 |

### 1.2 为什么需要

**业务驱动力**：

- **几乎所有 AI 应用的"判断"环节都是分类**。识别意图、识别意图类型、识别内容是否违规、识别交易是否异常——本质上都是分类任务。
- **大模型的爆发让"分类"从专门模型升级为"基础能力"**。但高精度、低延迟、可解释的场景（风控、推荐、医疗），专门训练的分类器仍然不可替代。
- **AI 时代的混合架构**：LLM 负责开放域理解 + 分类，专用分类器负责高频 / 低延迟 / 高精度 / 可解释决策。两者互补，不是替代。

**痛点**：

1. **类别不平衡（Imbalanced Data）**：欺诈样本占比 0.1%，直接训练准确率 99.9%，看似"完美"，实际无法识别任何欺诈。
2. **多标签耦合（Multi-label Dependency）**：一篇文章同时是"科技"和"AI"，但概率互相影响，不能简单独立预测。
3. **冷启动（Cold Start）**：新用户、新商品、新类目无标签，传统监督分类无法直接用。
4. **分布漂移（Distribution Drift）**：训练集是 3 个月前的，线上数据已经变化，模型效果断崖式下降。
5. **特征穿越（Feature Leakage）**：训练时不小心把线上才有的特征引入，导致离线指标"爆表"，上线"翻车"。
6. **标签噪声（Label Noise）**：人工标注的标签有 5-15% 的错误率，模型学到错误模式。

### 1.3 在 AI 时代数据架构中的位置

**与上下游模块的关系**：

```
[原始数据]
   ↓
[特征工程 / Feature Store] ──→ 特征入参
   ↓
[分类模型训练] ──→ 模型产出
   ↓
[模型注册 / Model Registry]
   ↓
[在线服务 / Inference] ──→ 业务决策
   ↓
[日志回流 / 反馈数据] ──→ 样本库 ──→ 闭环训练
```

**在数据架构中的角色**：

- **离线训练层**：分类算法是 ML 训练 pipeline 的核心算子。
- **在线推理层**：分类模型是高 QPS 低延迟服务的核心（如推荐系统的粗排 / 精排）。
- **反馈闭环**：分类的预测结果回流到样本库，是模型自进化的关键输入。
- **AI Agent 层**：LLM 的意图识别、Tool 路由本质上都是"分类任务"——但用 LLM / Prompt 实现。

**与 LLM 的边界**：

- **LLM 擅长**：少样本 / 零样本分类、长文本理解、多模态分类、需要世界知识的开放域分类。
- **专用分类器擅长**：高频低延迟、高精度、可解释、对成本敏感的场景。
- **最佳实践**：LLM 用于"长尾 + 难样本 + 冷启动"，专用分类器用于"高频 + 主流场景"。

**一句话判断**：**LLM 是分类任务的新工具，不是分类器的终结者——AI 时代的资深数据架构师，是"LLM + 专用分类器 + 业务规则"三位一体的设计者。**

### 1.4 演进历程

**传统机器学习阶段（1990s–2010）**：

- 1995：Vapnik / Cortes 提出 **SVM**（支持向量机），在文本分类、小样本场景成为经典。
- 1998：LeCun 等提出 **LeNet**（CNN），手写数字识别首次工业可用。
- 2001：Breiman 提出 **Random Forest**（随机森林），成为表格数据默认基线。
- 2006：Hinton 提出深度信念网络，深度学习预热。
- 2010s：Spark / Hadoop 上 Mahout / MLlib 让分布式训练成为现实。

**深度学习阶段（2012–2020）**：

- 2012：AlexNet（Krizhevsky / Hinton）在 ImageNet 断层第一，开启深度学习时代。
- 2014：VGG / GoogLeNet / ResNet，图像分类 SOTA 不断刷新。
- 2015：He 等提出 **ResNet**（残差网络），深度首次突破 100 层。
- 2016：Word2Vec / GloVe + LSTM 做文本分类成为标准。
- 2017：Transformer（Vaswani et al., "Attention Is All You Need"）奠定 BERT 基础。
- 2018：BERT（Google）刷新 11 项 NLP 任务 SOTA，文本分类迎来预训练时代。

**GBDT 复兴阶段（2014–2020）**：

- 2014：Geurts 等提出 **ExtraTrees**，表格数据新基线。
- 2016：陈天奇提出 **XGBoost**，Kaggle 上横扫所有结构化数据竞赛。
- 2017：Ke 等提出 **LightGBM**（微软），速度快、内存省。
- 2018：Prokhorenkova 等提出 **CatBoost**（Yandex），原生支持类别特征。
- 2019-至今：XGBoost / LightGBM / CatBoost 仍是工业界结构化数据分类的"三件套"。

**AI 原生阶段（2020+）**：

- 2020：GPT-3（OpenAI）展示零样本 / 少样本分类能力。
- 2021：CLIP（OpenAI）开启多模态零样本分类新时代。
- 2022：ChatGPT 让"LLM 当分类器"成为工程现实。
- 2023：**TabPFN**（Hollmann et al., Nature）——表格数据的小样本分类器，无需训练，直接预测。
- 2024：**SAINT / TabNet / FT-Transformer** 等专用表格深度学习模型持续迭代。
- 2024：**LLM-as-Classifier** 模式成熟，用 Prompt + 结构化输出做分类任务。
- 2025：**多模态分类 + LLM Embedding** 成为工业标准，专用分类器与 LLM 协同的混合架构普及。

**一句话总结**：**分类算法从"专门模型 → 深度学习 → GBDT 复兴 → LLM 增强"四阶段演进，今天的 AI 时代是"专用模型 + LLM 协同"的混合架构。**

---

## 2. 核心原理

### 2.1 关键概念定义

- **特征（Feature）**：输入 $x$ 的某个可测量属性。结构化数据中是一列，图像中是像素 / patch，文本中是 token。
- **标签（Label / Target）**：监督信号 $y$，分类任务中为离散类别。
- **决策边界（Decision Boundary）**：分类器在特征空间中划分的"是 / 否"分界面。线性分类器对应超平面，非线性分类器对应复杂曲面。
- **概率输出（Probabilistic Output）**：分类器不仅输出"是 / 否"，还输出"是"的概率（如 LR 的 sigmoid 输出）。概率输出比硬分类更有价值。
- **决策阈值（Decision Threshold）**：将概率转为硬分类的阈值，默认 0.5，但不平衡场景需要调。
- **类别不平衡（Class Imbalance）**：标签分布严重不均（如 99:1）。常见于欺诈、罕见病、缺陷检测。
- **多标签（Multi-label）**：一个样本可同时属于多个类别（如新闻同时属于"科技"和"AI"）。
- **层次分类（Hierarchical Classification）**：标签存在父子关系（如疾病分类中的 ICD 编码）。
- **正负样本（Positive / Negative）**：二分类中关注的类别为正样本，其余为负样本。**注意：业务上"坏样本"才是正样本**（如欺诈是 positive class）。
- **混淆矩阵（Confusion Matrix）**：TP / FP / TN / FN 的二维表格，是所有分类指标的源头。
- **Precision / Recall / F1**：查准率 / 查全率 / 调和平均。F1 = 2·P·R/(P+R)。
- **ROC / AUC**：受试者工作特征曲线下面积。衡量分类器对正负样本的排序能力，与阈值无关。
- **PR / AP**：Precision-Recall 曲线下面积。**类别极不平衡时比 AUC 更可靠**。
- **GAUC（Group AUC）**：分组 AUC，常用于推荐系统按用户分组计算 AUC。
- **Log Loss / Cross Entropy**：概率预测的损失函数，对错误预测的"置信错误"惩罚更重。
- **Hinge Loss**：SVM 的损失函数，目标是让正负样本间隔最大化。
- **Softmax**：多分类的归一化指数函数，把 logits 转为概率分布。

### 2.2 数学 / 形式化基础

**二分类的数学框架**：

给定训练集 $\mathcal{D} = \{(x_i, y_i)\}_{i=1}^N$，其中 $y_i \in \{0, 1\}$，目标是学习 $P(y=1 \mid x)$。

**逻辑回归（Logistic Regression, LR）**：

$$P(y=1 \mid x) = \sigma(w^T x + b) = \frac{1}{1 + e^{-(w^T x + b)}}$$

损失函数（Binary Cross Entropy）：

$$\mathcal{L}_{BCE} = -\frac{1}{N}\sum_{i=1}^N \left[y_i \log \hat{y}_i + (1-y_i) \log(1-\hat{y}_i)\right]$$

**SVM（Support Vector Machine）**：

$$\min_{w, b} \frac{1}{2}\|w\|^2 + C \sum_{i=1}^N \max(0, 1 - y_i(w^T x_i + b))$$

其中第一项是间隔最大化，第二项是 Hinge Loss。核函数（Kernel）可将 SVM 扩展到非线性：

$$K(x_i, x_j) = \phi(x_i)^T \phi(x_j)$$

常用核：线性、多项式、RBF（高斯核）、Sigmoid。

**多分类的扩展**：

- **One-vs-Rest（OvR）**：训练 K 个二分类器，第 k 个判别"是否是第 k 类"。
- **One-vs-One（OvO）**：训练 K(K-1)/2 个二分类器，每个判别两类。
- **Softmax Regression（Multinomial LR）**：

$$P(y=k \mid x) = \frac{e^{w_k^T x + b_k}}{\sum_{j=1}^K e^{w_j^T x + b_j}}$$

损失函数（Categorical Cross Entropy）：

$$\mathcal{L}_{CCE} = -\frac{1}{N}\sum_{i=1}^N \sum_{k=1}^K y_{i,k} \log \hat{y}_{i,k}$$

**决策树（Decision Tree）**：

信息熵：$H(Y) = -\sum_k p_k \log p_k$

信息增益：$IG = H(Y) - \sum_v \frac{|Y_v|}{|Y|} H(Y_v)$

基尼系数：$Gini(Y) = 1 - \sum_k p_k^2$

**梯度提升树（GBDT / XGBoost / LightGBM）**：

$$\hat{y}_i = \sum_{m=1}^M f_m(x_i), \quad f_m \in \mathcal{F}$$

其中 $\mathcal{F}$ 是 CART 树空间。XGBoost 的目标函数：

$$\mathcal{L}^{(m)} = \sum_{i=1}^N \ell(y_i, \hat{y}_i^{(m-1)} + f_m(x_i)) + \Omega(f_m)$$

二阶泰勒展开 + 正则化是 XGBoost 的核心 trick。

**深度学习分类器**：

- **CNN**（图像）：卷积层 + 池化层 + 全连接层。
- **RNN / LSTM**（序列）：循环结构处理时序信息。
- **Transformer**（文本 / 多模态）：自注意力机制捕捉全局依赖。
- **损失函数**：Categorical Cross-Entropy（多分类）/ Binary Cross-Entropy（多标签）。

### 2.3 关键算法 / 方法

**线性家族**：

1. **LR（Logistic Regression）**——大规模 CTR / 风控默认基线。可解释、训练快、亿级特征工业可用。
2. **SVM（Support Vector Machine）**——小样本、高维、需可解释场景（如文本分类）。深度学习时代使用减少。
3. **朴素贝叶斯（Naive Bayes）**——垃圾邮件、文本分类的经典基线。速度快、对特征独立假设不敏感。

**树家族**：

4. **决策树（Decision Tree）**——ID3 / C4.5 / CART。可解释，但容易过拟合。
5. **随机森林（Random Forest）**——Bagging 多棵决策树。抗过拟合、可并行、特征重要性可解释。
6. **GBDT（Gradient Boosting Decision Tree）**——Boosting 多棵决策树。XGBoost / LightGBM / CatBoost 是工业三件套。
7. **XGBoost**（2016）——二阶导数 + 正则化 + 工程优化。Kaggle 横扫，CTR 预估标配。
8. **LightGBM**（2017）——Histogram + Leaf-wise + GOSS。速度比 XGBoost 快 10-20 倍。
9. **CatBoost**（2018）——Ordered Boosting + 原生类别特征。无需 One-Hot。

**深度学习家族**：

10. **MLP（多层感知机）**——深度学习最简单形式。结构化数据深度学习基线。
11. **CNN**（LeNet / AlexNet / VGG / ResNet）——图像分类标配。
12. **RNN / LSTM / GRU**——序列分类（文本、语音）。
13. **Transformer / BERT / GPT**——预训练 + 微调是文本分类 SOTA。
14. **TabNet**（2019）——Google 提出的表格数据深度学习架构。
15. **SAINT**（2021）——Self-Attention + Intersample Attention，表格数据新 SOTA。
16. **FT-Transformer**（2021）——Feature Tokenizer + Transformer。
17. **TabPFN**（2023，Nature）——Prior-data Fitted Network，小样本表格分类无需训练。
18. **CLIP**（2021）——多模态零样本分类（图像 + 文本对齐）。

**LLM 时代家族**：

19. **LLM 零样本分类**——Prompt + 结构化输出（JSON Schema / Function Calling）。
20. **LLM 少样本分类**——Few-shot Prompting（In-Context Learning）。
21. **LLM Embedding + 分类头**——LLM 提取 embedding，接 LR / MLP 头。
22. **SetFit**（2022）——Sentence Transformer + 对比学习，少样本文本分类。

### 2.4 与相邻概念的关系

- **分类 vs 回归**：分类预测离散类别，回归预测连续值。两者可互通（分类 → sigmoid → 回归；回归 → 阈值 → 分类）。
- **分类 vs 排序**：分类输出绝对概率，排序输出相对顺序。推荐 / 搜索场景更多用排序学习（Learning to Rank）。
- **分类 vs 检测**：分类是"图整体是什么"，检测是"图里有什么 + 在哪里"。YOLO / Faster-RCNN 是检测代表。
- **分类 vs 聚类**：分类是有监督的（标签已知），聚类是无监督的（标签未知）。本章讲分类，Ch3 讲聚类。
- **分类 vs 生成**：分类输出离散标签，生成输出文本 / 图像。LLM 时代两者融合——LLM 可同时做分类与生成。
- **分类 vs 推荐**：CTR 预估本质是分类，但推荐系统还有召回 / 排序 / 重排等环节。详见 §5 推荐系统章节。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：线性分类器优先（Linear-First）**

- 默认用 LR / Softmax Regression 起步，原因：可解释、训练快、亿级特征工业可用。
- 适合：CTR 预估、风控评分、信用卡反欺诈、广告排序。
- 工具：Spark MLlib / XGBoost / 自研 LR（PS 架构，如 Angel / XDL）。
- 局限：无法捕捉非线性关系。

**模式 2：GBDT 主导（GBDT-Dominant）**

- 用 XGBoost / LightGBM / CatBoost 作为结构化数据主力。
- 适合：Kaggle 竞赛、表格数据分类、不要求极致延迟的服务。
- 优势：精度高、特征重要性可解释、对缺失值 / 类别特征鲁棒。
- 局限：模型大、推理延迟高、特征交叉能力有限。

**模式 3：深度学习特化（DL-Specialized）**

- 图像用 CNN / ViT，文本用 BERT / RoBERTa，语音用 Wav2Vec，多模态用 CLIP。
- 适合：有大量标注数据 + 需要高精度的场景。
- 优势：精度天花板高、特征自动学习。
- 局限：训练成本高、可解释性差、需要 GPU。

**模式 4：LLM 增强（LLM-Augmented）**

- 用 LLM 做零样本 / 少样本分类、标签生成、特征增强。
- 适合：长尾类目、冷启动、需要世界知识的开放域分类。
- 优势：无需训练、零样本能力强、可解释。
- 局限：成本高、延迟高、需要 prompt 工程。

**模式 5：混合架构（Hybrid）**

- LLM 负责"长尾 + 难样本"，专用分类器负责"高频 + 主流"。
- 适合：工业级大规模分类系统。
- 优势：精度 + 成本 + 延迟的平衡。
- 实施：路由分类器（router）先判断走 LLM 还是专用模型。

**模式 6：层次分类（Hierarchical）**

- 大类 → 小类 → 细类分层分类（如 ICD-10 编码、商品三级分类）。
- 适合：标签存在自然层次的场景。
- 优势：每个分类器只学一个层次，训练数据更平衡。

**模式 7：多任务分类（Multi-task）**

- 多个相关分类任务共享特征（如同时预测 CTR 和 CVR）。
- 适合：PLE / ESSM / MMoE 等多任务学习框架。
- 优势：参数共享、缓解数据稀疏。

**模式 8：级联分类（Cascade）**

- 第一阶段快速分类器过滤明显样本，第二阶段精细分类器处理模糊样本。
- 适合：类别极不平衡、误判代价极高的场景（如癌症筛查）。

### 3.2 适用场景决策表

| 业务特征 | 推荐算法 | 理由 |
| --- | --- | --- |
| 结构化数据 + 亿级特征 + 高 QPS | LR / FM / DeepFM | 工业级 CTR 标配 |
| 结构化数据 + 表格 + 中等规模 | XGBoost / LightGBM / CatBoost | 精度 + 可解释 + 工程友好 |
| 图像分类 | CNN (ResNet / EfficientNet) / ViT | 视觉 SOTA |
| 文本分类（中等规模） | BERT / RoBERTa / Chinese-BERT | 文本 SOTA |
| 文本分类（小样本 / 零样本） | LLM (GPT-4 / Claude) + Prompt | 少样本 / 零样本 SOTA |
| 语音分类 | Wav2Vec 2.0 / Whisper | 语音 SOTA |
| 多模态分类 | CLIP / Flamingo / GPT-4V | 多模态对齐 |
| 类别极不平衡 | 级联分类 + 阈值调优 + Focal Loss | 缓解不平衡 |
| 多标签分类 | BCE per label / 标签依赖建模 | 多标签独立 / 联合 |
| 层次分类 | 顶层 → 底层分层训练 | 每个分类器只学一个层次 |
| 冷启动类目 | LLM 零样本 + 人工标注 | 无需训练数据 |
| 高频实时（QPS > 10万） | LR / FM / 双塔 | 推理快 + 显存小 |
| 需要可解释 | LR / 决策树 / EBM / SHAP | 可解释 + 审计 |
| 数据量极小（< 1000 样本） | SVM / TabPFN / LLM Few-shot | 小样本友好 |
| 数据有强时序性 | Transformer + 时序位置编码 | 序列建模 |
| 多任务联合 | MMoE / PLE / ESSM | 多任务共享 |

### 3.3 反模式与陷阱

1. **「先上深度学习」反模式**：上来就 BERT / Transformer，10 万条结构化数据精度不如 XGBoost。**结构化数据默认 XGBoost 起步，深度学习是 XGBoost 跑不动 / 精度不够时的备选**。
2. **「类别不平衡直接训练」反模式**：99:1 的不平衡数据，直接训练模型全部预测为多数类，accuracy 99% 但毫无价值。**必须做下采样 / 过采样 / 加权 / Focal Loss**。
3. **「特征穿越」反模式**：训练时引入了"未来才能知道的特征"（如"是否后续点击"），离线 AUC 0.95，上线 0.55。**特征穿越是 ML 工程第一杀手**。
4. **「标签泄漏」反模式**：训练集和测试集存在重复样本，或归一化时用了全局均值 / 方差。**必须严格切分 + 严格归一化（按训练集统计）**。
5. **「一味追求 AUC」反模式**：AUC 0.85 → 0.86 看起来很小，但业务可能完全无感。**离线指标必须和业务指标对齐**。
6. **「类别权重拍脑袋」反模式**：不平衡时直接给少数类权重 10x，结果 precision / recall 完全失衡。**用 PR 曲线 + 业务成本矩阵调阈值**。
7. **「用 accuracy 评估不平衡数据」反模式**：99:1 数据 accuracy 99% 没有任何信息量。**用 F1 / AUC / PR-AUC 替代**。
8. **「多标签用 softmax」反模式**：多标签场景下 softmax 强制"标签互斥"，但实际标签可能重叠（如"科技" + "AI"）。**多标签必须用 sigmoid + BCE**。
9. **「模型越大越好」反模式**：千亿参数 LLM 跑 10 万条样本，训练 7 天，结果不如 5 层 MLP。**模型复杂度与数据量匹配**。
10. **「忽视校准（Calibration）」反模式**：分类器输出概率不可信（LightGBM 的概率输出与实际频率偏差大），影响后续决策。**用 Platt Scaling / Isotonic Regression 做概率校准**。
11. **「忽视推理成本」反模式**：训练用 XGBoost，上线用 100 棵树 × 100 万 QPS，结果成本爆炸。**必须评估推理 QPS 与硬件成本**。
12. **「LLM 分类无评估」反模式**：用 GPT-4 做分类，没有评估集就上线，结果"幻觉"严重。**LLM 分类必须有 Golden Set + 持续评估**。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务问题抽象**

- 把业务问题转化为"输入 → 输出"的分类问题。
- 明确标签定义、类别空间、正负样本含义。
- 输出：**问题定义文档**（业务背景、标签定义、评估指标）。

**Step 2：数据准备与样本构建**

- 收集标注数据（有监督场景）或构造正负样本（无监督 / 半监督）。
- 切分训练集 / 验证集 / 测试集（注意时间切分避免穿越）。
- 处理不平衡（下采样 / 过采样 / 加权）。
- 输出：**样本库 / 训练集 / 测试集**。

**Step 3：特征工程**

- 数值特征：归一化 / 分箱 / 缺失值填充。
- 类别特征：One-Hot / Target Encoding / 嵌入。
- 文本特征：TF-IDF / Word2Vec / BERT Embedding。
- 图像特征：CNN 提取 / 预训练模型。
- 时序特征：滑动窗口 / 滞后值。
- 特征选择：方差 / IV / L1 正则 / 树模型重要性。
- 输出：**特征 pipeline + Feature Store**。

**Step 4：模型选型与基线**

- 用 §3.2 决策表选 1-3 个候选模型。
- 跑基线（如 LR / XGBoost / LightGBM），建立性能下限。
- 输出：**基线报告**（指标、训练时长、推理时长）。

**Step 5：模型调优**

- 超参调优（Grid Search / Random Search / Bayesian Optimization / Hyperband）。
- 类别不平衡处理（Focal Loss / 加权 / SMOTE）。
- 多标签处理（标签依赖 / Classifier Chain）。
- 输出：**调优报告**（最优超参、性能对比）。

**Step 6：模型评估**

- 离线评估：AUC / PR-AUC / F1 / Precision / Recall / 混淆矩阵。
- 业务对齐：AUC 提升 1% 对应业务 GMV 提升多少？
- 错误分析：把错误样本分类，研究是哪些场景容易错。
- 输出：**评估报告 + 错误分析**。

**Step 7：模型上线**

- 模型序列化（Pickle / PMML / ONNX）。
- 在线服务（TF Serving / Triton Inference Server / 自研 RPC 服务）。
- 性能压测（QPS / P99 延迟 / GPU 利用率）。
- A/B 测试（小流量 → 大流量 → 全量）。
- 输出：**上线报告 + A/B 实验报告**。

**Step 8：监控与闭环**

- 模型监控：输入分布、输出分布、AUC 实时计算。
- 漂移检测：Data Drift / Concept Drift / Label Drift。
- 反馈回流：线上预测 + 真实标签回流到样本库。
- 定期重训：日 / 周 / 月粒度。
- 输出：**监控 dashboard + 重训 pipeline**。

### 4.2 关键技术点

**特征工程关键技术**：

1. **分箱（Binning）**：将连续特征离散化（如等频分箱 / 等距分箱 / 卡方分箱）。优势：抗异常值、自动交叉、提升树模型效果。
2. **目标编码（Target Encoding）**：用目标变量的均值替换类别特征。注意必须用 K-Fold 防止泄漏。
3. **特征交叉（Feature Crossing）**：手动构造交叉特征（如 AND(user_country, item_category)）或用 FM / DeepFM 自动学习。
4. **WOE / IV**：Weight of Evidence / Information Value，金融风控的特征选择标准。
5. **特征选择**：方差过滤、卡方检验、互信息、L1 正则、树模型 feature importance、SHAP。
6. **类别不平衡处理**：
   - 下采样（Undersampling）：随机 / EasyEnsemble / BalanceCascade。
   - 过采样（Oversampling）：SMOTE / ADASYN / Borderline-SMOTE。
   - 加权（Class Weight）：对少数类提高 loss 权重。
   - 阈值调优：调整决策阈值而非模型本身。
   - Focal Loss：$\mathcal{L} = -\alpha (1-p)^\gamma \log p$，让模型聚焦难样本。
7. **多标签处理**：
   - Binary Relevance：每个标签独立训练二分类器。
   - Classifier Chain：把前面的标签预测结果作为后面的输入。
   - Label Powerset：每个标签组合作为一个新类别。
   - 深度学习：sigmoid 输出 + BCE Loss。

**训练关键技术**：

8. **分布式训练**：参数服务器（Parameter Server）架构（Angel / XDL）、AllReduce 架构（PyTorch DDP / Horovod）。
9. **混合精度训练**：FP16 + FP32 混合，训练速度提升 2-3 倍。
10. **学习率调度**：Warmup + Cosine Decay / Linear Decay。
11. **正则化**：L1 / L2 / Dropout / Early Stopping / Label Smoothing。
12. **梯度累积（Gradient Accumulation）**：小显存模拟大 batch。

**推理关键技术**：

13. **模型压缩**：量化（INT8 / INT4）、剪枝（Pruning）、蒸馏（Distillation，如 DistilBERT）。
14. **推理加速**：ONNX Runtime、TensorRT、OpenVINO、TVM。
15. **模型服务**：TF Serving、Triton Inference Server、KServe、BentoML、vLLM（LLM 推理）。
16. **特征实时化**：在线特征通过 Feature Store 实时查询（如 Redis / DynamoDB / HBase）。

**LLM 分类关键技术**：

17. **Prompt 工程**：清晰指令 + Few-shot 示例 + JSON Schema 输出约束。
18. **Function Calling**：让 LLM 直接输出结构化分类结果（避免解析错误）。
19. **Self-Consistency**：多次采样 + 投票，提升鲁棒性。
20. **LLM Embedding + 轻量分类头**：用 LLM 提 embedding，接 LR / MLP 分类头。比 fine-tuning LLM 便宜。
21. **路由分类器**：先用轻量分类器判断"走 LLM 还是走专用模型"，控制成本。

### 4.3 工具链与平台

**传统机器学习框架**：

- **scikit-learn**（Python / 开源）——经典 ML 库，LR / SVM / 决策树 / RF 标配。
- **XGBoost**（C++/Python / 开源）——GBDT 工业标准。
- **LightGBM**（C++/Python / 开源）——微软出品，速度最快。
- **CatBoost**（C++/Python / 开源）——Yandex 出品，类别特征友好。

**深度学习框架**：

- **PyTorch**（Python / 开源）——学术界主流。
- **TensorFlow / Keras**（Python / 开源）——工业界传统主流。
- **JAX**（Python / 开源）——Google 新一代框架。
- **PaddlePaddle**（国产 / 百度）——国产化深度学习框架。
- **MindSpore**（国产 / 华为）——华为全场景 AI 框架。

**专用框架**：

- **FastText**（Facebook / 开源）——文本分类轻量框架。
- **TextCNN / TextRNN**——经典文本分类模型实现。
- **HuggingFace Transformers**（开源）——预训练模型 SOTA 库，含 BERT / RoBERTa / GPT / LLaMA 等。
- **timm**（开源）——PyTorch Image Models，图像分类模型库。
- **TabNet / SAINT / FT-Transformer / TabPFN**——表格数据专用深度学习。

**大模型分类工具**：

- **LangChain**（开源）——LLM 应用框架，含分类链（Classification Chain）。
- **LlamaIndex**（开源）——LLM 数据框架，可做分类。
- **vLLM**（开源）——LLM 高吞吐推理。
- **SetFit**（HuggingFace / 开源）——少样本文本分类。
- **OpenAI Function Calling**——结构化输出分类。
- **Anthropic Tool Use**——结构化输出分类。
- **DSPy**（Stanford / 2024）——LLM 程序化优化，分类任务可自动 prompt 调优。

**训练平台**：

- **MLflow**（开源）——ML 实验管理 + 模型注册。
- **Kubeflow**（开源）——K8s 上的 ML 平台。
- **TFX**（Google / 开源）——TensorFlow 端到端 ML 平台。
- **Feast**（开源）——Feature Store。
- **Alibaba PAI**（阿里云）——阿里机器学习平台。
- **ByteDance AML**（字节）——字节机器学习平台。
- **AWS SageMaker**——AWS 托管 ML 平台。
- **Azure ML**——Azure 托管 ML 平台。
- **Google Vertex AI**——GCP 托管 ML 平台。

**2024-2025 新工具**：

- **PyTorch 2.x + compile**——训练速度提升 30-50%。
- **DeepSpeed + ZeRO-3**——千亿参数模型训练。
- **TRL / HuggingFace TRL**（2023+）——LLM 分类微调（SFT / DPO）。
- **Unsloth**（2024）——LLM 微速度提升 2-5x。
- **LlamaFactory**（2024）——LLM 一站式微调框架。
- **Pieces / Continue**（2024）——开发者助手，含分类能力。

### 4.4 代码 / 示例

**示例 1：LR 训练（CTR 预估）**

```python
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, classification_report
from sklearn.model_selection import train_test_split

# 假设 X 是用户/物品特征矩阵，y 是点击标签 (0/1)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 训练 LR
model = LogisticRegression(
    C=1.0,                    # 正则化强度倒数
    penalty='l2',            # L2 正则
    solver='lbfgs',          # 优化算法
    max_iter=1000,
    class_weight='balanced', # 类别不平衡加权
    n_jobs=-1
)
model.fit(X_train, y_train)

# 预测概率
y_prob = model.predict_proba(X_test)[:, 1]
y_pred = model.predict(X_test)

# 评估
print(f"AUC: {roc_auc_score(y_test, y_prob):.4f}")
print(classification_report(y_test, y_pred))
```

**示例 2：XGBoost 训练（结构化数据）**

```python
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 计算正负样本比例，用于 scale_pos_weight
neg, pos = (y_train == 0).sum(), (y_train == 1).sum()
scale_pos_weight = neg / pos

dtrain = xgb.DMatrix(X_train, label=y_train)
dtest = xgb.DMatrix(X_test, label=y_test)

params = {
    'objective': 'binary:logistic',
    'eval_metric': 'auc',
    'max_depth': 6,
    'eta': 0.1,                    # learning_rate
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'min_child_weight': 1,
    'gamma': 0,
    'scale_pos_weight': scale_pos_weight,  # 不平衡处理
    'tree_method': 'hist',         # 直方图加速
    'device': 'cuda',              # GPU 训练
}

bst = xgb.train(
    params, dtrain,
    num_boost_round=1000,
    evals=[(dtest, 'test')],
    early_stopping_rounds=50,
    verbose_eval=100
)

y_prob = bst.predict(dtest)
print(f"AUC: {roc_auc_score(y_test, y_prob):.4f}")

# 特征重要性
import matplotlib.pyplot as plt
xgb.plot_importance(bst, max_num_features=20)
plt.show()
```

**示例 3：BERT 文本分类（Fine-tune）**

```python
from transformers import (
    AutoTokenizer, AutoModelForSequenceClassification,
    Trainer, TrainingArguments
)
from datasets import load_dataset

# 加载数据
dataset = load_dataset("csv", data_files={"train": "train.csv", "test": "test.csv"})

# 分词
tokenizer = AutoTokenizer.from_pretrained("bert-base-chinese")

def tokenize(batch):
    return tokenizer(batch["text"], padding=True, truncation=True, max_length=128)

dataset = dataset.map(tokenize, batched=True)

# 加载模型
model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-chinese", num_labels=10
)

# 训练
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=32,
    per_device_eval_batch_size=64,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,
    load_best_model_at_end=True,
    fp16=True,  # 混合精度
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
)

trainer.train()
```

**示例 4：LLM 零样本分类（OpenAI Function Calling）**

```python
import openai
import json

client = openai.OpenAI(api_key="sk-...")

# 定义分类标签（业务约束）
CLASSES = ["科技", "财经", "体育", "娱乐", "教育", "医疗", "其他"]

tools = [{
    "type": "function",
    "function": {
        "name": "classify_news",
        "description": "对新闻文本进行分类",
        "parameters": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": CLASSES,
                    "description": "新闻类别"
                },
                "confidence": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1,
                    "description": "分类置信度"
                },
                "reason": {
                    "type": "string",
                    "description": "分类理由"
                }
            },
            "required": ["category", "confidence", "reason"]
        }
    }
}]

def classify_news(text: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "你是一个新闻分类专家，精确判断新闻类别。"},
            {"role": "user", "content": f"新闻：{text}"}
        ],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "classify_news"}}
    )

    args = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
    return args

# 使用
result = classify_news("OpenAI 发布 GPT-5，多模态能力大幅提升")
print(result)
# {'category': '科技', 'confidence': 0.95, 'reason': '涉及 AI 模型发布'}
```

**示例 5：类别不平衡处理（Focal Loss）**

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class FocalLoss(nn.Module):
    """Focal Loss 用于缓解类别不平衡"""
    def __init__(self, alpha=1, gamma=2, reduction='mean'):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, inputs, targets):
        BCE_loss = F.binary_cross_entropy_with_logits(inputs, targets, reduction='none')
        pt = torch.exp(-BCE_loss)
        focal_loss = self.alpha * (1 - pt) ** self.gamma * BCE_loss

        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        return focal_loss

# 使用
criterion = FocalLoss(alpha=0.25, gamma=2.0)
loss = criterion(logits, labels)
```

**示例 6：多标签分类（BCE）**

```python
import torch
import torch.nn as nn

class MultiLabelClassifier(nn.Module):
    """多标签分类：sigmoid + BCE"""
    def __init__(self, input_dim, num_labels):
        super().__init__()
        self.classifier = nn.Linear(input_dim, num_labels)

    def forward(self, x):
        return self.classifier(x)  # logits，不要 softmax

# 损失函数必须用 BCE（不是 CrossEntropyLoss）
criterion = nn.BCEWithLogitsLoss()  # 多标签
# criterion = nn.CrossEntropyLoss()  # 多分类（互斥标签）

logits = model(features)  # [batch, num_labels]
loss = criterion(logits, labels.float())  # labels 必须是 float
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：LLM 作为通用分类器（LLM-as-Classifier）**

GPT-4 / Claude 等大模型在零样本分类任务上已达到或超过专用分类器。LLM 的优势：

- 无需训练数据（Zero-shot）。
- 可处理长文本（128K tokens 以上）。
- 具备世界知识（如"美联储加息"自然归类为"财经"）。
- 可解释（输出分类理由）。

**典型应用**：

- 内容审核（敏感词、违规内容、政治敏感）。
- 意图识别（智能客服、Agent 路由）。
- 标签生成（无标签数据自动打标）。
- 长尾类目（训练数据不足时的 fallback）。

**工程模式**：

```python
# 模式 1：纯 Prompt
prompt = f"请将以下新闻分类为 {CLASSES} 中的一个：{news}"

# 模式 2：Few-shot Prompt
prompt = f"""示例：
- "苹果发布新手机" → 科技
- "美联储宣布加息" → 财经
现在请分类：{news}"""

# 模式 3：Function Calling（结构化输出）
tools = [{"type": "function", "function": {...}}]
response = client.chat.completions.create(..., tools=tools, tool_choice=...)

# 模式 4：Self-Consistency（多次投票）
results = [classify(news) for _ in range(5)]
final = majority_vote(results)
```

**方向 2：LLM Embedding + 轻量分类头**

用 LLM 提 embedding，接 LR / MLP 分类头。优势：

- 比 fine-tune LLM 便宜 100 倍。
- 推理延迟低（embedding 可预计算）。
- 效果接近 fine-tune（小数据集）。

代表工作：**Sentence-BERT + LogReg**、**OpenAI text-embedding-3 + LogReg**。

**方向 3：SetFit / Adapter 等参数高效微调**

- **SetFit**（2022）——Sentence Transformer + 对比学习，8 个样本就能训练出 SOTA 文本分类器。
- **LoRA / QLoRA**（2021 / 2023）——低秩适配，10MB 级别参数微调。
- **Adapter**——Houlsby et al. 2019，模块化微调。

**方向 4：多模态分类（CLIP / GPT-4V）**

- **CLIP**（2021）——图像 + 文本对齐，零样本图像分类。
- **BLIP-2 / Flamingo**（2022-2023）——多模态问答与分类。
- **GPT-4V / Claude 3.5 Vision / Gemini 1.5 Pro Vision**（2023-2024）——多模态 LLM 直接做图像 / 视频分类。
- **LLaVA / Qwen-VL**（2024）——开源多模态 LLM。

**方向 5：Agent 路由与意图分类**

智能体平台中，分类任务是"路由层"核心：

```python
# Agent 路由示例
def route_query(query: str) -> str:
    intent = classify_intent(query)  # LLM 分类
    if intent == "search":
        return search_agent.run(query)
    elif intent == "code":
        return code_agent.run(query)
    elif intent == "chat":
        return chat_agent.run(query)
```

这是 LLM 时代分类任务最重要的应用场景之一。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**传统分类 vs RAG 增强分类**：

- **传统分类**：输入特征 → 模型 → 标签。
- **RAG 增强分类**：输入特征 + 检索外部知识 → 模型 → 标签。

RAG 增强的优势：

- 解决"标签定义模糊"问题（如"科技 vs AI"边界）。
- 解决"知识陈旧"问题（LLM 训练截止后新增类目）。
- 解决"长尾类目"问题（用检索补充类目描述）。

**典型架构**：

```
用户问题
   ↓
[1. 向量检索] → 类目描述库（top-k）
   ↓
[2. LLM Prompt] = 指令 + 类目描述 + 用户问题
   ↓
[3. LLM 分类输出]
```

**应用案例**：

- **内容平台**：RAG 增强的标签分类，新类目无需重新训练。
- **客服**：RAG 增强的意图识别，检索历史相似工单。
- **Agent 平台**：RAG 增强的 Tool 路由，检索 Tool 描述库。

**GraphRAG 与分类**：

- 用本体（Ontology）定义标签层次。
- 用知识图谱（KG）补充实体关系。
- 用 LLM 做最终分类决策。

这是 2025 年"分类任务 + 知识增强"的前沿方向。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **TabPFN**（Hollmann et al., Nature 2023）——表格数据的 Prior-data Fitted Network，小样本分类无需训练。
- **TabPFN v2**（2024）——扩展到更大数据集，逼近 XGBoost。
- **WhyTab**（2024）——可解释表格分类。
- **SetFit 2.0**（2024）——支持多模态少样本分类。
- **LLM-as-Classifier Benchmark**（2024）——多个研究对比 GPT-4 与专用分类器。
- **Foundation Models for Tabular Data**（2024-2025）——TabPFN、TabICL、TF-MLP 等表格基础模型涌现。
- **Multimodal Foundation Models**（2024）——CLIP、DINOv2、SAM 在图像分类 SOTA。
- **Efficient Fine-tuning**（2024）——LoRA / QLoRA / Adapter 让 LLM 分类微调成本下降 90%+。

**工业进展**：

- **OpenAI GPT-4o / GPT-4V**（2024）——多模态分类，工业级 API。
- **Anthropic Claude 3.5 Sonnet**（2024）——结构化输出 + Tool Use，分类任务 SOTA。
- **Google Gemini 1.5 Pro**（2024）——200 万 tokens 上下文，长文本分类 SOTA。
- **Meta Llama 3.1 / 3.2**（2024）——开源 LLM，本地部署分类。
- **阿里 Qwen2.5 / Qwen-VL**（2024）——中文 + 多模态 SOTA。
- **智谱 GLM-4**（2024）——国产 LLM，分类能力强。
- **百度 ERNIE 4.0**（2024）——中文理解 SOTA。
- **字节豆包**（2024）——多模态 LLM。
- **DeepSeek-V2 / V3**（2024）——开源 + 高性价比。
- **HuggingFace Inference API**——托管的 BERT / RoBERTa / CLIP 推理。
- **AWS Bedrock**（2024）——托管 Claude / Llama / Mistral 推理。
- **阿里云百炼 / 腾讯混元**（2024）——国产 LLM 平台。

**企业落地案例**：

- **字节跳动**：用 XGBoost + LLM 双层分类架构，CTR 提升 5%。
- **阿里巴巴**：用 DeepFM + DIN 多任务分类，广告收入提升 8%。
- **美团**：用 LLM 做商家标签自动分类，标注效率提升 10 倍。
- **腾讯**：用 BERT + LLM 双层做内容审核，召回率提升 15%。
- **蚂蚁集团**：用 LLM 做风控标签自动化，运营成本下降 40%。

### 5.4 未来 3-5 年趋势

1. **「LLM + 专用分类器」混合架构成为标准**：高频场景用专用模型，长尾场景用 LLM，路由分类器统一调度。
2. **「基础模型化」（Foundation Models for Everything）**：TabPFN、CLIP 等基础模型扩展到更多模态，分类任务不再需要"专门训练"。
3. **「多模态统一分类」**：文本 + 图像 + 语音 + 视频统一表征，统一分类。
4. **「Agent-driven 分类」**：智能体主动发现类目，主动标注，主动训练，主动部署——人类只需定义目标。
5. **「自适应分类」（Adaptive Classification）**：模型根据输入难度自适应选择推理深度（快思考 vs 慢思考）。
6. **「隐私保护分类」**：联邦学习 + 差分隐私 + 同态加密，让分类任务在保护隐私的前提下跨组织协作。
7. **「可解释分类」**：SHAP / LIME / Anchor 等可解释 AI 工具成为分类模型的标配，特别是金融、医疗、政务领域。
8. **「小模型复兴」**：小模型（< 10B 参数）+ 强数据 + 好 prompt 工程，部分场景超越大模型。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：某头部电商的 CTR 预估**

- 背景：亿级用户 / 商品，QPS 10 万+，延迟 < 50ms。
- 方案：LR 起步 → FM → DeepFM → 多任务（CTR + CVR + GMV）。
- 工具：XDL（自研分布式训练） + TF Serving + 自研 RPC 服务。
- 结果：CTR +5%，CVR +8%，广告收入年增 10 亿+。

**案例 2：某股份制银行反欺诈**

- 背景：日交易 1000 万笔，欺诈占比 0.1%，要求毫秒级响应。
- 方案：XGBoost 主导 + 规则引擎 fallback + 异常检测（Isolation Forest）兜底。
- 工具：LightGBM + 自研特征平台 + Flink 实时特征。
- 结果：欺诈召回率 +25%，误报率 -40%，年减损 5 亿+。

**案例 3：某短视频平台内容审核**

- 背景：日上传 1 亿条视频，多模态审核（封面 + 标题 + 内容）。
- 方案：CLIP 图像分类 + BERT 文本分类 + 多模态融合（GPT-4V 复核）。
- 工具：CLIP + Chinese-BERT + 自研审核平台。
- 结果：违规识别率 +15%，误判率 -30%，人力审核成本 -50%。

**案例 4：某三甲医院影像辅助诊断**

- 背景：CT / MRI 影像分类（肺结节、肿瘤、骨折等）。
- 方案：CNN (ResNet-50) + ViT 预训练 + 层次分类（部位 → 病灶类型）。
- 工具：MONAI + 自研部署 + 医生反馈闭环。
- 结果：肺结节检出率 +20%，误诊率 -25%。

**案例 5：某 Agent 平台的意图识别**

- 背景：智能客服 / Code Agent / Search Agent 多路由分发。
- 方案：LLM Few-shot 分类 + Function Calling 结构化输出。
- 工具：Claude 3.5 Sonnet + vLLM 推理 + 路由 fallback。
- 结果：意图识别准确率 92%，Agent 调用成功率 +30%。

### 6.2 踩坑与经验

**坑 1：特征穿越导致离线高大上、上线垮掉**

- 现象：训练集 AUC 0.92，上线 AUC 0.58。
- 解法：建立严格的时间切分 + 特征审计 pipeline + 离线 / 在线一致性监控。

**坑 2：类别不平衡导致模型"装死"**

- 现象：欺诈样本 0.1%，模型全部预测为正常，accuracy 99.9%。
- 解法：下采样 / SMOTE / 加权 / Focal Loss + 用 PR-AUC 而非 accuracy 评估。

**坑 3：标签噪声放大模型错误**

- 现象：人工标注 5% 错误率，模型学到错误模式。
- 解法：用 Bootstrap / Co-teaching 等鲁棒学习；建立标注质量审核机制。

**坑 4：LLM 分类成本失控**

- 现象：每天 1000 万次分类调用 GPT-4，月账单 50 万美元。
- 解法：路由分类器先用轻量模型，复杂场景再走 LLM；用本地小模型（Llama 3 / Qwen2）兜底。

**坑 5：分布漂移没监控**

- 现象：3 个月前训练的模型，上线 1 周效果断崖式下降。
- 解法：建立 PSI / KS 检验 / Embedding 漂移监控；定期重训 + 在线学习。

**坑 6：多标签误用 softmax**

- 现象：新闻同时是"科技"和"AI"，但 softmax 强制"二选一"。
- 解法：多标签用 sigmoid + BCE，每个标签独立预测。

**坑 7：过度依赖 AUC**

- 现象：AUC 提升 0.5%，业务 GMV 完全没动。
- 解法：业务指标对齐（CTR / CVR / 转化率 / ROI）；A/B 测试是唯一标尺。

**坑 8：XGBoost 推理慢**

- 现象：100 棵树 × 100 万 QPS，延迟 200ms。
- 解法：模型蒸馏到 LR / FM；用 ONNX / TensorRT 加速；缓存高频查询。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（单点验证，1-3 个月）**：

1. 选 1 个具体分类问题（如"欺诈识别"）。
2. 收集 1-10 万条标注数据。
3. 用 LR / XGBoost 跑通 baseline。
4. 离线评估 AUC > 0.8。
5. 部署上线 + 小流量验证。

**1→10（部门级，3-9 个月）**：

1. 扩展到 3-5 个分类任务。
2. 引入深度学习（BERT / ResNet）。
3. 建立 Feature Store + 模型注册中心。
4. 建立 A/B 测试框架。
5. 模型监控 + 定期重训。

**10→100（企业级，9-24 个月）**：

1. 多任务学习（CTR + CVR + GMV）。
2. LLM 增强（长尾类目自动分类）。
3. 多模态分类（文本 + 图像 + 语音）。
4. Agent 路由（LLM + 专用分类器混合）。
5. AutoML 自动化（自动特征工程 + 自动模型选择）。

### 6.4 ROI 评估

**直接收益**：

- 业务效率提升（CTR / 转化率 / 风控召回）。
- 人工成本下降（自动审核 / 自动标注）。
- 业务损失下降（反欺诈 / 内容审核）。

**间接收益**：

- 数据闭环成熟（特征 + 模型 + 反馈三位一体）。
- 算法工程化能力提升（团队从 P7 到 P8）。
- AI 基础设施完善（Feature Store / Model Registry / 监控）。

**评估指标**：

- **业务指标**：CTR / CVR / GMV / 召回率 / 误报率 / 成本下降比例。
- **技术指标**：AUC / PR-AUC / F1 / 训练时长 / 推理 QPS / P99 延迟。
- **闭环指标**：数据反馈延迟 / 模型重训周期 / 漂移检测灵敏度。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | LR | SVM | RF | GBDT | 深度学习 | LLM |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| 精度 | 2 | 3 | 3 | 4 | 5 | 4 |
| 训练速度 | 5 | 3 | 4 | 3 | 2 | 1 |
| 推理速度 | 5 | 4 | 3 | 3 | 2 | 1 |
| 可解释性 | 5 | 4 | 4 | 3 | 1 | 3 |
| 处理非线性 | 1 | 4 | 4 | 4 | 5 | 5 |
| 大规模特征 | 5 | 2 | 3 | 4 | 3 | 2 |
| 类别不平衡处理 | 3 | 3 | 4 | 5 | 4 | 3 |
| 多标签支持 | 3 | 2 | 3 | 4 | 5 | 5 |
| 冷启动友好 | 2 | 2 | 3 | 3 | 2 | 5 |
| 工程门槛 | 2 | 3 | 2 | 2 | 4 | 3 |
| 成本 | 5 | 4 | 4 | 4 | 2 | 1 |

**结论**：

- **结构化数据 + 高 QPS**：LR / FM（5 分）。
- **结构化数据 + 中规模**：GBDT 三件套（4-5 分）。
- **图像 / 文本 + 大数据**：深度学习（5 分）。
- **冷启动 + 长尾**：LLM（5 分）。
- **工业级混合**：LR + GBDT + DL + LLM 四件套协同。

### 7.2 决策树

```
[分类任务]
   │
   ├── [数据是什么？]
   │     ├── 结构化（表格）→ §3.2 决策表
   │     ├── 文本 → BERT / LLM
   │     ├── 图像 → CNN / ViT / CLIP
   │     ├── 语音 → Wav2Vec / Whisper
   │     └── 多模态 → GPT-4V / Claude Vision
   │
   ├── [数据量多少？]
   │     ├── < 1K → SVM / TabPFN / LLM Few-shot
   │     ├── 1K-100K → XGBoost / LightGBM
   │     ├── 100K-10M → GBDT + DL
   │     └── > 10M → LR / FM / DeepFM（大特征）+ DL
   │
   ├── [类别是否平衡？]
   │     ├── 平衡 → 默认
   │     ├── 轻度不平衡 → class_weight
   │     └── 严重不平衡 → SMOTE / Focal Loss / 级联
   │
   ├── [是否需要可解释？]
   │     ├── 强需求 → LR / 决策树 / EBM / SHAP
   │     ├── 弱需求 → GBDT / DL
   │     └── 无需求 → DL / LLM
   │
   └── [是否高频低延迟？]
         ├── 是 → LR / FM / 双塔
         └── 否 → GBDT / DL / LLM
```

### 7.3 组合使用

**组合 1：GBDT + LR（Facebook 经典）**

- GBDT 提取特征组合 + LR 拟合高阶特征。
- 优势：精度 + 效率 + 可解释。
- 适用：CTR 预估。

**组合 2：BERT + LR / MLP（LLM Embedding + 分类头）**

- BERT 提 embedding + 简单分类头。
- 优势：训练快、效果接近 fine-tune。
- 适用：小样本文本分类。

**组合 3：专用分类器 + LLM（混合架构）**

- 专用分类器处理高频场景。
- LLM 处理长尾 / 难样本。
- 优势：精度 + 成本 + 延迟平衡。
- 适用：工业级大规模分类系统。

**组合 4：多任务学习（CTR + CVR + GMV）**

- MMoE / PLE / ESSM 共享特征 + 任务特定头。
- 优势：参数共享、缓解数据稀疏。
- 适用：推荐 / 广告。

**组合 5：分类 + 排序（推荐系统）**

- 分类输出"点击概率"。
- 排序学习（Learning to Rank）输出"列表顺序"。
- 适用：推荐 / 搜索。

**组合 6：分类 + 检索（RAG 增强）**

- 检索外部知识补充类目描述。
- LLM 做最终分类决策。
- 适用：开放域分类、长尾类目。

---

## 8. 面试真题集

> 本节内容待补充。题源待与原 PDF《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）题库对齐。读者可参考本节结构，按"全景视图 → 分主题展开 → 横向小结 → 本章小结"四段式自检。
