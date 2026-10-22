# Ch2 · 数据科学与算法

> **一句话定位**：ML 算法（分类/聚类/回归/推荐）+ 特征工程 + 模型选型 + 效果评估——把业务问题抽象为可量化模型。

## 画像映射

本章对应 **R2 数据科学算法** 能力：

- 精通数据挖掘与机器学习（分类 / 聚类 / 回归 / 推荐）
- 扎实的特征工程、模型选型、效果评估能力
- 算法工程化落地经验——从离线训练到在线服务的全链路

> P7 会"调包"，P8 会"调参"，**资深数据架构师会"建闭环"**——数据闭环 + 特征闭环 + 实验闭环三位一体。

## 基本信息

- **难度**：★★★☆☆
- **推荐角色**：数据科学家 / 算法工程师 / AI 架构师
- **前置章节**：[Ch1 · 建模方法论](../01-modeling/)
- **后续章节**：[Ch3 · 数据全栈基础设施](../03-data-stack/)；[Ch4 · 企业级数据资产化与智能检索](../04-data-assetization/)（特征 / Embedding 是 AI 资产化的底料）

## 本章要回答的核心问题

1. **四类机器学习算法（分类 / 聚类 / 回归 / 推荐）的核心原理与典型模型是什么？** LR / GBDT / XGBoost / DeepFM 的数学直觉与适用边界？
2. **特征工程的完整链路是什么？** 特征提取、特征选择、特征交叉、特征降维——从原始字段到模型入参的端到端流水线？
3. **离线训练 vs 在线学习 vs 联邦学习——什么时候用哪个？** 三种范式的延迟、效果、合规、成本取舍？
4. **特征平台（Feature Store）怎么搭？** Feast / Tecton / 阿里 FeatureDB 怎么解决离线 / 在线一致性、特征回填、特征血缘？
5. **A/B 实验怎么设计？** 流量分层、SRM 检验、效果归因——怎样避免"统计显著但业务无感"？
6. **效果评估指标怎么选？** CTR / AUC / NDCG / MAE / RMSE——业务指标 vs 模型指标的对齐方法？

## 子主题

- [ ] **[Feature Store](01-feature-store/01-feature-store.md)**：特征平台搭建（Feast / Tecton / 阿里 FeatureDB），离线/在线一致性
- [ ] **[分类算法](./02-classification/README.md)**：LR / GBDT / XGBoost / DeepFM——CTR / 风控 / 反欺诈的核心
- [ ] **[聚类算法](./03-clustering/README.md)**：KMeans / DBSCAN / 谱聚类——用户分群、异常检测、标签发现
- [ ] **[回归算法](./04-regression/README.md)**：Linear / Ridge / DNN 回归——销量、评分、时序基线
- [ ] **[推荐算法](05-recommendation/05-recommendation.md)**：协同过滤 / 双塔 / DeepFM / DIN——电商 / 内容 / 广告的共同底座
- [ ] **[强化学习](./06-rl/README.md)**：DQN / PPO / Bandit——动态定价、营销策略、Agent 工具调度
- [ ] **[效果评估与 A/B 实验](07-eval/07-eval.md)**：离线指标 + 在线 A/B + 因果推断——ML 工程化闭环最后一公里

> 文件命名建议：`feature-store.md` / `classification.md` / `clustering.md` / `regression.md` / `recommendation.md` / `rl.md` / `eval.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 选型合适的算法（分类 / 聚类 / 回归 / 推荐）解决业务问题，并说清选型理由
- 搭建完整的特征工程链路（提取 → 选择 → 交叉 → 降维），并理解样本偏差、特征穿越等陷阱
- 用 Feature Store 解决离线 / 在线一致性、特征回填、特征血缘问题
- 设计 A/B 实验（流量分层、SRM 检验、效果归因），把业务问题转化为可量化指标
- 用 MLflow / Weights & Biases 搭建模型管理与实验管理平台
- 区分离线训练、在线学习、联邦学习三种范式的适用场景
- 把模糊的业务问题抽象为"可建模问题"——这是资深数据架构师的核心能力

## 推荐资料

> 本节是**索引**，不是新书单：下列每一条，都是本章七个主题正文里已经引用过、并且给出过可检索题名的书 / 论文 / 标准 / 产品 / 官方文档，按「经典 → 工业材料 → 前沿」三栏归拢到一处，便于按图索骥。每条末尾的「落点」指向它在本章中的出处，可先回正文看它被用来支撑什么结论，再决定要不要读原文。
> 本书不提供链接（公开链接会漂移），**所有条目均可按书名 / 论文题名 / 产品名自行检索核验**。带年份的条目，年份以该条目在本章正文中的记录为准；正文未给年份的，此处不补。
> 未在本章任何主题中具名的材料，本节一律不收录——宁缺勿编。

### 经典（书 / 论文 / 标准）

**书目**

| 书 | 作者 | 重点章节 | 阅读建议（含本章落点） |
| --- | --- | --- | --- |
| *The Elements of Statistical Learning* | Hastie / Tibshirani / Friedman | 第 3、8、10 章 | 线性、树与 Boosting 的归纳偏置对比，是回归选型的方法学起点（[04-regression §8](04-regression/04-regression-section-8-sec8.md)） |
| *Pattern Recognition and Machine Learning* | Christopher Bishop | 第 9 章 | K-Means / GMM / EM 的数学描述与收敛性证明，聚类原理的权威底本（[03-clustering §8](03-clustering/03-clustering-section-8-sec8.md)） |
| *Causal Inference for Statistics, Social, and Biomedical Sciences* | Imbens / Rubin | 全书 | 潜在结果框架（Rubin Causal Model）的标准教材，读因果推断前先读它（[07-eval §8](07-eval/07-eval-section-8-sec8.md)） |
| *Trustworthy Online Controlled Experiments* | Kohavi / Tang / Xu | 全书 | A/B 的样本量计算、p 值与护栏指标的工业标准（[07-eval §3](07-eval/07-eval-section-3-sec3.md)、[§4](07-eval/07-eval-section-4-sec4.md)、[§7](07-eval/07-eval-section-7-sec7.md)） |
| *Feature Engineering for Machine Learning* | Zheng & Casari | 全书 | 特征工程的系统化教材，配合本章 [01-feature-store](01-feature-store/01-feature-store.md) 一起读（[02-classification §8](02-classification/02-classification-section-8-sec8.md)） |
| *Feature Engineering and Selection* | Kuhn & Johnson | 全书 | 特征工程的进阶教材，重点在「选」而非「造」（[02-classification §8](02-classification/02-classification-section-8-sec8.md)） |
| *Interpretable Machine Learning* | Molnar | 全书 | 可解释 ML 的系统教材，风控与合规场景的必读项（[02-classification §8](02-classification/02-classification-section-8-sec8.md)） |
| *Credit Risk Scorecards: Developing and Implementing Intelligent Credit Scoring* | Siddiqi | 全书 | 评分卡开发的完整流程，含 WOE / IV / PSI 的端到端做法（[04-regression §8](04-regression/04-regression-section-8-sec8.md)） |
| *Consumer Credit Models: Pricing, Profit and Portfolios* | Thomas | 全书 | LGD / EAD 建模的实证范式，含 Beta 回归与两阶段模型（[04-regression §8](04-regression/04-regression-section-8-sec8.md)） |
| *Time Series Analysis: Forecasting and Control* | Box & Jenkins | 全书 | ARIMA 体系的经典教科书，是 ARIMA 选型的理论参考（[04-regression §8](04-regression/04-regression-section-8-sec8.md)） |
| *Forecasting: Principles and Practice* | Hyndman & Athanasopoulos | 全书 | 时序预测教科书，含滚动评估、TimeSeriesSplit 与漂移检测的标准做法（[04-regression §8](04-regression/04-regression-section-8-sec8.md)） |
| *Causality: Models, Reasoning and Inference* | Pearl | 全书 | 因果图与「因果阶梯」的原始定义（[04-regression §8](04-regression/04-regression-section-8-sec8.md)） |
| *Applied Logistic Regression* | Hosmer & Lemeshow | 全书 | Logistic 回归与校准、HL 检验的原始定义（[04-regression §8](04-regression/04-regression-section-8-sec8.md)） |
| *Bayesian Learning for Neural Networks* | Neal | 全书 | 贝叶斯神经网络理论，不确定度建模的起点（[04-regression §8](04-regression/04-regression-section-8-sec8.md)） |

**算法原始论文（按模型族归拢）**

- **梯度提升三件套**：XGBoost（Chen & Guestrin, KDD 2016）、LightGBM（Ke 等, NeurIPS 2017）、CatBoost（Prokhorenkova 等, NeurIPS 2018）——三篇的工程差异解释了三者适用边界的不同（[02-classification §3](02-classification/02-classification-section-3-sec3.md)、[§8](02-classification/02-classification-section-8-sec8.md)、[04-regression §8](04-regression/04-regression-section-8-sec8.md)）
- **特征交叉与 CTR**：Factorization Machines（Rendle, ICDM 2010）、Wide & Deep（Cheng 等, 2016）、DeepFM（Guo 等, IJCAI 2017）——把二阶交叉从人工枚举变成模型内建（[02-classification §3](02-classification/02-classification-section-3-sec3.md)、[§8](02-classification/02-classification-section-8-sec8.md)）
- **序列与多任务**：DIN（Zhou 等, KDD 2018）、DIEN（Zhou 等, 2019；会议名两处口径不一，[02-classification §8](02-classification/02-classification-section-8-sec8.md) 记为 AAAI，[05-recommendation §8](05-recommendation/05-recommendation-section-8-sec8.md) 则标注未能离线核实）、DLRM（Naumov 等, 2019）、ESMM（Ma 等, SIGIR 2018）、MMoE（Ma 等, KDD 2018）、PLE（Tang 等, RecSys 2020）——注意力池化与共享底座两条路线的分野（[02-classification §8](02-classification/02-classification-section-8-sec8.md)、[05-recommendation §8](05-recommendation/05-recommendation-section-8-sec8.md)）
- **聚类与异常**：DBSCAN（Ester 等, KDD 1996）、LOF（Breunig 等, SIGMOD 2000）、谱聚类（Ng / Jordan / Weiss, NeurIPS 2001）与 Von Luxburg 的 tutorial（2007）、Gap Statistic（Tibshirani 等, JRSSB 2001）、HDBSCAN（Campello 等, TKDD 2015）、Louvain（Blondel 等, 2008）与 Leiden（Traag 等, Scientific Reports 2019）、UMAP（McInnes 等, 2020）——密度 / 谱 / 图三类路线各自的原始出处（[03-clustering §8](03-clustering/03-clustering-section-8-sec8.md)）
- **图上的表示学习**：GraphSAGE（Hamilton 等, NeurIPS 2017）——归纳式图 Embedding，冷启动召回的理论代表（[03-clustering §8](03-clustering/03-clustering-section-8-sec8.md)、[05-recommendation §8](05-recommendation/05-recommendation-section-8-sec8.md)）
- **不平衡与损失改造**：SMOTE（Chawla 等, 2002）、EasyEnsemble（Liu 等, 2009）、Focal Loss（Lin 等, ICCV 2017）——重采样与改损失形状两条路线的原始文献（[02-classification §8](02-classification/02-classification-section-8-sec8.md)）
- **归因与可解释**：SHAP（Lundberg & Lee, NeurIPS 2017）、GA2M / EBM（Lou 等, KDD 2013）——事后归因与本身可解释两派的对照（[02-classification §3](02-classification/02-classification-section-3-sec3.md)、[§8](02-classification/02-classification-section-8-sec8.md)）
- **指标与校准**：ROC 分析（Fawcett, 2006）、PR-AUC 在不平衡下的优势（Saito & Rehmsmeier, 2015）、MCC 与 F1 的比较（Chicco & Jurman, 2020）、不平衡学习综述（He & Garcia, 2009）、概率校准的对照实证（Niculescu-Mizil & Caruana）——读指标前先读它们，能挡住「换了指标就算改进」的误判（[02-classification §8](02-classification/02-classification-section-8-sec8.md)、[04-regression §8](04-regression/04-regression-section-8-sec8.md)）
- **表格数据上的深度学习**：Tabular Data: Deep Learning is Not All You Need（Shwartz-Ziv & Armon, 2021）、Deep Neural Networks and Tabular Data（Borisov 等, 2022）——回应「深度学习一定更好」的两篇对照实证与综述（[04-regression §8](04-regression/04-regression-section-8-sec8.md)）
- **强化学习与决策**：DQN（Mnih 等, Nature 2015）、Dyna-Q（1990）、AlphaGo（Nature 2016）/ AlphaZero（Science 2018）/ MuZero（Nature 2020）、PPO（Schulman 等, 2017）、SAC（Haarnoja 等, 2018）、UCB1（Auer 等, 2002）、Thompson Sampling（Thompson, 1933）——样本效率这条主线的历史坐标（[06-rl §3](06-rl/06-rl-section-3-sec3.md)、[§7](06-rl/06-rl-section-7-sec7.md)、[§8](06-rl/06-rl-section-8-sec8.md)）
- **多智能体**：MADDPG（Lowe 等, 2017）、QMIX（Rashid 等, 2018）、MAPPO（Yu 等, 2022）——集中训练分散执行（CTDE）的三条代表算法（[06-rl §5](06-rl/06-rl-section-5-ai.md)）
- **因果推断与不确定度**：合成控制（Abadie 等, JASA 2010）、DML（Chernozhukov 等, Econometrics Journal 2018）、Causal Forest（Wager & Athey, JASA 2018）、Meta-learners（Künzel 等, PNAS 2019）、Dragonnet（Shi 等, 2020）、Conformal Prediction（Shafer & Vovk）、Conformalized Quantile Regression（Romano 等, 2019）——没有 A/B 时怎么估效应，以及怎么给区间（[04-regression §8](04-regression/04-regression-section-8-sec8.md)、[07-eval §4](07-eval/07-eval-section-4-sec4.md)）
- **实验基础设施**：Overlapping Experiment Infrastructure（Tang 等, KDD 2010）、LinUCB（Li 等, WWW 2010）、CUPED 与 Switchback——流量分层、上下文老虎机与方差缩减的公开形式化（[07-eval §4](07-eval/07-eval-section-4-sec4.md)、[§7](07-eval/07-eval-section-7-sec7.md)）
- **规模定律**：Scaling Laws for Neural Language Models（Kaplan 等, 2020）、Training Compute-Optimal Large Language Models（Hoffmann 等, 2022）——训练算力账（≈6ND）的公开出处（[02-classification §4](02-classification/02-classification-section-4-sec4.md)）

**标准与监管文件**

- 巴塞尔委员会《International Convergence of Capital Measurement and Capital Standards》（巴塞尔协议 II/III 的 IRB 部分）——PD / LGD / EAD 三模型定义的官方出处（[04-regression §8](04-regression/04-regression-section-8-sec8.md)）
- WHO《国际疾病分类》（ICD 编码体系）——层次化分类任务的公开体系，可作为分类建模的现成标注（[02-classification §3](02-classification/02-classification-section-3-sec3.md)）
- 中国《个人信息保护法》、银保监会《商业银行互联网贷款管理暂行办法》、欧盟 GDPR——「拒贷必须给理由」这类可解释性要求的合规来源（[02-classification §8](02-classification/02-classification-section-8-sec8.md)）

### 工业材料（白皮书 / 官方文档 / 开源项目）

**特征平台一侧的公开材料**

- Uber Engineering 公开博客《Meet Michelangelo: Uber's Machine Learning Platform》（2017）——公开披露最早的生产级特征存储 Michelangelo Palette（[01-feature-store §3](01-feature-store/01-feature-store-section-3-sec3.md)、[§8](01-feature-store/01-feature-store-section-8-sec8.md)）
- Airbnb Engineering 公开博客《Zipline: Airbnb's Machine Learning Feature Store》——特征定义语言与一致性验证，把 Point-in-Time 正确性列为「零号原则」（[01-feature-store §8](01-feature-store/01-feature-store-section-8-sec8.md)）
- Feast 官方文档（域名 docs.feast.dev）——离线存储与 `materialize` 物化流程、按需特征视图（[01-feature-store §3](01-feature-store/01-feature-store-section-3-sec3.md)、[§5](01-feature-store/01-feature-store-section-5-ai.md)）
- Hopsworks 官方文档《Hopsworks Feature Store Documentation》——与 Lakehouse 集成的版本管理、embedding 与相似度检索（[01-feature-store §5](01-feature-store/01-feature-store-section-5-ai.md)、[§8](01-feature-store/01-feature-store-section-8-sec8.md)）
- Tecton 官方白皮书《The State of Feature Stores》——商业 Feature Store 的能力地图（[01-feature-store §8](01-feature-store/01-feature-store-section-8-sec8.md)）
- Databricks 官方文档（域名 docs.databricks.com）的 Feature Store / Feature Engineering 一节——建立在 Delta Lake 之上的特征平台形态（[01-feature-store §3](01-feature-store/01-feature-store-section-3-sec3.md)）
- 阿里数据技术团队《大数据之路：阿里巴巴大数据实践》——OneData 体系下 DMP 人群分群的完整方案，从特征工程到聚类到应用（[03-clustering §8](03-clustering/03-clustering-section-8-sec8.md)）

**企业公开案例线索（按机构名与主题自行检索）**

- LinkedIn Feathr、阿里 PAI FeatureDB（MaxCompute 算 + Lindorm / Tair 存）、字节 ByteFS、腾讯 TI-EMS——四条国内外的特征平台路线（[01-feature-store §5](01-feature-store/01-feature-store-section-5-ai.md)、[§8](01-feature-store/01-feature-store-section-8-sec8.md)）
- 美团配送时长预估、Uber DeepETA——滚动评估这条两家都在用；多窗口 MAE + PSI 漂移检测只见于美团，DeepETA 一侧用的是 Huber + MAE 混合损失与 MC Dropout 置信区间；两家都同时输出 P50 与高位分位数两路结果（[04-regression §8](04-regression/04-regression-section-8-sec8.md)）

**实验、监控与实现层工具链**

- MLflow（开源）/ Weights & Biases（商业）/ Neptune.ai（商业）/ Aim（开源）——实验管理与元数据的四个选项，判据是「离线与在线实验要不要记在同一处」（[07-eval §4](07-eval/07-eval-section-4-sec4.md)）
- Evidently（开源）/ WhyLabs / Arize / Prometheus + Grafana / 阿里云日志服务 SLS——分布漂移与数据质量监控的分工（[01-feature-store §4](01-feature-store/01-feature-store-section-4-sec4.md)）
- Faiss / Spark MLlib / PCA / UMAP / BERTopic 与 c-TF-IDF / Isolation Forest——聚类与近邻检索的实现层补充（[03-clustering §7](03-clustering/03-clustering-section-7-sec7.md)）
- HuggingFace 的 SetFit 框架——极少样本（个位数每类）下接近 fine-tune 的文本分类（[02-classification §8](02-classification/02-classification-section-8-sec8.md)）
- RAGAS / TruLens / LangSmith / Phoenix——检索增强应用的评估框架，注意「忠实性」在各框架里的定义不同（[07-eval §5](07-eval/07-eval-section-5-ai.md)）

> 注：以上均为企业公开博客、官方文档或开源项目材料。官方文档随版本更新、无固定出版年份，**具体支持范围以官方文档当前版本为准**；精确链接请按条目名称自行检索核验。

### 前沿（论文 / 产品 / 开源）

> 本栏按**谱系**收录：既收本章正文中记有 2023 年及以后年份的条目，也把它们直接延续的上一代组件一并列出（否则只留最新一个点，看不出演进方向）。年份一律按正文记录，正文未给的此处不补。

- **KG 增强检索**：Microsoft GraphRAG（2024）及其代码库——本章正文只记到名称级（[03-clustering §8](03-clustering/03-clustering-section-8-sec8.md) 把它称作白皮书），篇目与发布形态请按该名自行检索核验；评估侧要注意多跳问题需要路径级标注，没有标注口径就复现不了（[03-clustering §5](03-clustering/03-clustering-section-5-ai.md)、[§8](03-clustering/03-clustering-section-8-sec8.md)；[05-recommendation §5](05-recommendation/05-recommendation-section-5-ai.md)；评估口径见 [07-eval §5](07-eval/07-eval-section-5-ai.md)；另见 [Ch1 推荐资料](../01-modeling/README.md)）
- **表格基础模型**：TabPFN（Hollmann 等, ICLR 2023）一类免训练的小样本表格先验——只在小样本任务上当基线，适用边界随版本变动、不可跨版本比较（[02-classification §3](02-classification/02-classification-section-3-sec3.md)、[04-regression §5](04-regression/04-regression-section-5-ai.md)）
- **时序基础模型**：PatchTST（ICLR 2023）、TimesNet / iTransformer（2023–2024）、Chronos（Amazon, 2024）、TimeGPT（2024）——加上更早的 N-BEATS（2020）/ N-HiTS 与 Prophet（Facebook, 2017），构成时序预测的完整候选谱系（[04-regression 主文件](04-regression/04-regression.md)、[§5](04-regression/04-regression-section-5-ai.md)、[§8](04-regression/04-regression-section-8-sec8.md)）
- **序列与图召回**：SASRec（Kang & McAuley, ICDM 2018）、BERT4Rec（Sun 等, WWW 2019）、LightGCN（He 等, SIGIR 2020）——仍是今天精排与召回的常用组件（[05-recommendation §4](05-recommendation/05-recommendation-section-4-sec4.md)、[§5](05-recommendation/05-recommendation-section-5-ai.md)）
- **生成式与 LLM 推荐**：P5（Geng 等, RecSys 2022）、TIGER（Google, 2023）、InstructRec（2023）、LC-Rec / MoCa / CLIP4Rec / AgentRec（2024）、EasyRec 2.0（阿里, 2024）——这一组是正文列为「生成式与 LLM 推荐方向的开源实现」的条目，选型前先按官方仓库的最近提交与发版核验维护状态；GPT4Rec（Li 等, 2023）、ChatRec（Gao 等, 2023）与之同属这条方向的公开来源，但正文只记到公开出处、未标为开源实现，成熟度判定也另有一处（[05-recommendation §4](05-recommendation/05-recommendation-section-4-sec4.md) 的「开源实现」一行、[§5](05-recommendation/05-recommendation-section-5-ai.md) 的 §5.2.3、[§8](05-recommendation/05-recommendation-section-8-sec8.md)）
- **文本 Embedding 与主题建模**：Sentence-BERT、BGE——离线批量提向量的常用选择；BERTopic 与 c-TF-IDF 用于「文档聚类 + 主题词提取」（[05-recommendation §4](05-recommendation/05-recommendation-section-4-sec4.md)、[03-clustering §6](03-clustering/03-clustering-section-6-sec6.md)）
- **决策与世界模型**：DreamerV3（2023）——世界模型 + 隐空间想象训练方向的公开代表（[06-rl §7](06-rl/06-rl-section-7-sec7.md)）
- **偏好对齐**：DPO（Rafailov 等, 2023）、GRPO（DeepSeek, 2024）——从「必须训奖励模型」到「用组内相对得分替代 Critic」的两步演进（[06-rl §7](06-rl/06-rl-section-7-sec7.md)）

### 学习路径建议

> 本章各主题体量差异较大，这里按**节次**推进，不按日历推进——你若需要一个可验证的进度判据，用「能否独立完成该主题 §8 真题集里的题」代替「读了多少天」。
> 骨干是七个主题的 §3（原理）→ §8（面试真题集），§4（工程落地）与 §5（AI 时代演进）按需下钻。

1. **特征底座**：先读 [01-feature-store](01-feature-store/01-feature-store.md)，重点在 §3 的工业范式与 §4 的离线 / 在线一致性——这是后面所有算法共同的输入层。
2. **四类算法主干**：[02-classification](02-classification/02-classification.md) → [03-clustering](03-clustering/03-clustering.md) → [04-regression](04-regression/04-regression.md) → [05-recommendation](05-recommendation/05-recommendation.md)，四篇的 §3 是原理主干，§8 是横切复习入口。
3. **推荐专题下钻**：[05-recommendation](05-recommendation/05-recommendation.md) 的「召回—粗排—精排—重排」分层，是前三类算法在工业场景里的合成，配合 §4.3 的工具链选型表与 §7.6 的选型矩阵读。
4. **决策与闭环**：[06-rl](06-rl/06-rl.md) 的 §7 决策树 + [07-eval](07-eval/07-eval.md) 的 §4（A/B 工程；不能随机化时的识别在 §4.2.6：DID / 合成控制 / DML / Causal Forest）——这两篇合起来才是「模型上线之后怎么办」的答案。[§7](07-eval/07-eval-section-7-sec7.md) 是方法对比，那里因果推断只是 7.2 候选全景表里的一行，不是方法正文。
5. **前沿跟踪**：本章记有年份的前沿条目分散在各主题的 §5（[01](01-feature-store/01-feature-store-section-5-ai.md) / [02](02-classification/02-classification-section-5-ai.md) / [03](03-clustering/03-clustering-section-5-ai.md) / [04](04-regression/04-regression-section-5-ai.md) / [05](05-recommendation/05-recommendation-section-5-ai.md) / [06](06-rl/06-rl-section-5-ai.md) / [07](07-eval/07-eval-section-5-ai.md)）与各主题主文件的演进时间线里，可与本节「前沿」一栏对照读；跨章书单见 [Ch1 推荐资料](../01-modeling/README.md) 与 [后记 · 趋势与思考](../99-outro/)。

> 注：本节所有条目均可按书名 / 论文题名 / 产品名自行检索核验，本书不提供精确链接；带「落点」的条目也可直接在本章正文中查到它被用来支撑的结论。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch3 · 数据全栈基础设施](../03-data-stack/) 继续阅读
- 进入 [Ch4 · 企业级数据资产化与智能检索](../04-data-assetization/) 学习 Embedding 与语义资产
