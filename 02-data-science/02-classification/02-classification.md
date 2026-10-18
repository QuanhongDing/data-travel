# 分类算法（Classification）

> **一句话定位**：从 LR / SVM / GBDT 到深度学习与 LLM 零样本——把"是/否/哪一类"问题抽象为可量化的判别模型。

> 本文是 data-travel 项目 [Ch2 · 数据科学与算法](../../README.md) 的子章节（**02 分类算法**）。覆盖 R2 数据科学算法领域中"分类（Classification）"相关的核心原理、设计模式、工程实现与 AI 时代演进。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 分类任务的数学本质是什么？损失函数为什么选这个？ | §2.2 / §2.3 |
| LR、SVM、GBDT、深度学习分类器怎么选？ | §3.3 决策表 |
| 类别不平衡 / 多标签 / 冷启动怎么办？ | §3.5 反模式 / §4.2 关键技术点 / §3.2.4 LLM 增强 |
| XGBoost / LightGBM 怎么上线服务？ | §4.1 落地步骤 / §4.5 模板示例 |
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

- **几乎所有 AI 应用的"判断"环节都是分类**。识别意图、识别内容是否违规、识别交易是否异常——本质上都是分类任务。
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

- **ExtraTrees**（Geurts 等提出）：表格数据基线。
- 2016：陈天奇提出 **XGBoost**，Kaggle 上横扫所有结构化数据竞赛。
- 2017：Ke 等提出 **LightGBM**（微软），速度快、内存省。
- 2018：Prokhorenkova 等提出 **CatBoost**（Yandex），原生支持类别特征。
- 2019-至今：XGBoost / LightGBM / CatBoost 仍是工业界结构化数据分类的"三件套"。

**AI 原生阶段（2020+）**：

- 2020：GPT-3（OpenAI）展示零样本 / 少样本分类能力。
- 2021：CLIP（OpenAI）开启多模态零样本分类新时代。
- 2022：ChatGPT 让"LLM 当分类器"成为工程现实。
- 2023：**TabPFN**（Hollmann et al., ICLR 2023）——表格数据的小样本分类器，无需训练，直接预测。
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
17. **TabPFN**（2023，ICLR）——Prior-data Fitted Network，小样本表格分类无需训练。
18. **CLIP**（2021）——多模态零样本分类（图像 + 文本对齐）。

**LLM 时代家族**：

19. **LLM 零样本分类**——Prompt + 结构化输出（JSON Schema / Function Calling）。
20. **LLM 少样本分类**——Few-shot Prompting（In-Context Learning）。
21. **LLM Embedding + 分类头**——LLM 提取 embedding，接 LR / MLP 头。
22. **SetFit**（2022）——Sentence Transformer + 对比学习，少样本文本分类。

### 2.4 与相邻概念的关系

- **分类 vs 回归**：分类预测离散类别，回归预测连续值。两者可互通（回归（logit）→ sigmoid → 分类；回归 → 阈值 → 分类）。
- **分类 vs 排序**：分类输出绝对概率，排序输出相对顺序。推荐 / 搜索场景更多用排序学习（Learning to Rank）。
- **分类 vs 检测**：分类是"图整体是什么"，检测是"图里有什么 + 在哪里"。YOLO / Faster-RCNN 是检测代表。
- **分类 vs 聚类**：分类是有监督的（标签已知），聚类是无监督的（标签未知）。本章讲分类，聚类见 Ch2 的 [03 聚类算法](../03-clustering/03-clustering.md)。
- **分类 vs 生成**：分类输出离散标签，生成输出文本 / 图像。LLM 时代两者融合——LLM 可同时做分类与生成。
- **分类 vs 推荐**：CTR 预估本质是分类，但推荐系统还有召回 / 排序 / 重排等环节。详见 [05 推荐算法](../05-recommendation/05-recommendation.md)。

> 💡 **思考锚点**：看你的分类任务的正负样本比：如果已接近 2.1 提到的 99:1 那一档，你现在拿来验收的指标是 AUC 还是 PR/AP，决策阈值还停在默认的 0.5 吗？再按「业务上的坏样本才是 positive class」这条，你上次调阈值时调的是哪一类错误的代价（FP 还是 FN）——这个代价你能用钱或人时把它算出来吗？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](02-classification-section-3-sec3.md)
- [§4. 工程实现](02-classification-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](02-classification-section-5-ai.md)
- [§6. 落地实践](02-classification-section-6-sec6.md)
- [§7. 与其他方法对比](02-classification-section-7-sec7.md)
- [§8. 面试真题集](02-classification-section-8-sec8.md)

---
