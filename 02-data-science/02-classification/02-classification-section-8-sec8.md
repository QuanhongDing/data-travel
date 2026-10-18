> 本文件是 **02-classification.md** 的子文件（§8. 面试真题集）。完整章节请回到 [index](02-classification.md)。

## 8. 面试真题集

> 本节整合自《大数据平台架构师》题库（创脉思 cms365.cn，版本 2025-11-25）以及行业头部企业（Google / Meta / Airbnb / Stripe / Uber / LinkedIn / Netflix / Pinterest / 阿里 / 字节 / 美团 / 京东 / 招行 / 平安 / 微众 / 米哈游 / Shein 等）的公开架构实践。每题按五段式作答：**考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料**。

### 8.1 全景视图

| 编号 | 主题 | 难度 | 主/辅 |
| --- | --- | :---: | --- |
| Q1 | LR / GBDT / XGBoost / DeepFM 的算法选型对比 | ★★★★☆ | 主 |
| Q2 | 风控 / 反欺诈场景下的分类建模（招行、Stripe、Uber） | ★★★★★ | 主 |
| Q3 | 推荐系统的 CTR / CVR 预估与阿里 DIN / DIEN | ★★★★★ | 主 |
| Q4 | 类别不平衡的处理：下采样 / SMOTE / Focal Loss / 加权 | ★★★★☆ | 主 |
| Q5 | 特征工程与交叉：WOE / IV / Target Encoding / DeepFM | ★★★★☆ | 主 |
| Q6 | 评估指标：AUC / KS / PR-AUC / F1 的取舍与业务对齐 | ★★★★☆ | 主 |
| Q7 | 模型解释：SHAP / 特征重要性 / EBM 在风控与合规中的应用 | ★★★★☆ | 辅 |

### 8.2 Q1 LR / GBDT / XGBoost / DeepFM 的算法选型对比

> 本题考察**算法工程师与数据架构师对分类算法选型的工程直觉**——不是"哪个模型最好"，而是"在什么数据规模、什么延迟要求、什么可解释性需求下，应该选什么"。

#### Q1.1 在工业级 CTR / 风控 / 反欺诈场景下，LR / GBDT（XGBoost / LightGBM / CatBoost）/ DeepFM（FM / FFM / DeepFM）四类模型分别适合什么场景？请从「精度 / 训练速度 / 推理延迟 / 可解释性 / 特征工程友好度 / 大规模特征」六个维度做结构化对比，并给出具体的工程选型建议。

**1. 考察点**

- 是否理解四类模型的**数学本质差异**：LR 是广义线性模型（仅捕捉一阶特征），GBDT 是非线性树模型（自动构造特征组合），FM 系列是低秩分解 + 深度高阶交叉。
- 能否从**业务约束**反推**模型约束**：QPS 100 万 → 必须用 LR / FM；离线 AUC 0.001 提升但要可解释 → LR + SHAP；亿级特征 + 稀疏 → 必须用 FM / DeepFM。
- 是否知道**组合使用**而非单选——例如 GBDT 提取特征组合 + LR 拟合（Facebook 经典方案）、DeepFM 替代 GBDT+LR。
- 加分项：能区分 LR 在不同场景下的"复兴原因"——线性模型在大规模稀疏场景反而优于深度模型。

**2. 参考答案框架**

**第一层：先定义每个模型的数学性质。**

- **LR（Logistic Regression）**：$P(y=1 \mid x) = \sigma(w^T x + b)$，本质是一阶线性模型加 sigmoid 映射。优势在于**稀疏特征 + 海量维度 + 线性可分**时极快、可解释、可并行；劣势是**无法捕捉特征交叉**（如 `AND(user_age=25, item_category=数码)`）。
- **GBDT（XGBoost / LightGBM / CatBoost）**：Boosting 加法模型 + CART 树空间，$\hat{y}_i = \sum_{m=1}^M f_m(x_i)$，自动构造特征组合与非线性映射。优势是**精度高、对缺失值 / 类别特征鲁棒、特征重要性可解释**；劣势是**推理慢（百棵树 × 百万 QPS = 灾难）**、难以处理高维稀疏。
- **FM / FFM / DeepFM**：FM 用隐向量内积刻画二阶特征交叉 $\langle v_i, v_j \rangle$，FFM 引入"特征域"概念，DeepFM 在 FM 二阶基础上叠加深度网络做高阶交叉。优势是**端到端学习特征交叉 + 处理稀疏高维**；劣势是**模型大、可解释性弱、上线需要 GPU/专用推理框架**。

**第二层：六个维度的对比。**

| 维度 | LR | GBDT（XGBoost） | FM / DeepFM |
| --- | :---: | :---: | :---: |
| 精度（中等数据） | ★★ | ★★★★ | ★★★ |
| 精度（亿级稀疏） | ★★★ | ★★ | ★★★★★ |
| 训练速度 | ★★★★★ | ★★★ | ★★ |
| 推理延迟 | ★★★★★ | ★★ | ★★★ |
| 可解释性 | ★★★★★ | ★★★ | ★ |
| 特征工程友好度 | ★★（需手工交叉） | ★★★★（自动） | ★★★★★（端到端） |
| 大规模特征 | ★★★★★ | ★★ | ★★★★ |

**第三层：工程选型的"决策树"。**

- **场景 A：高 QPS（> 10 万）+ 海量稀疏特征 + 强可解释需求（风控 / 反欺诈评分卡）** → **LR + 手工特征 + WOE/IV**。典型如招行信用卡反欺诈的 A 卡 / B 卡 / C 卡体系——LR 是工业级可解释评分卡的事实标准，平安普惠、马上消费金融的信贷模型也沿用此路径。
- **场景 B：中规模结构化数据 + 离线精度优先 + 推理 QPS 中等（< 1 万）** → **XGBoost / LightGBM / CatBoost**。典型如 Kaggle 竞赛、信用卡反欺诈的离线打分、京东 / 美团的商家风控离线评估。
- **场景 C：亿级稀疏 ID 类特征 + 深度交叉 + 中等延迟容忍（100ms 以内）** → **FM / FFM / DeepFM**。典型如阿里妈妈广告 CTR、字节跳动 Douyin 推荐 CTR、Meta DLRM（Deep Learning Recommendation Model）。
- **场景 D：超高频实时 + 极低延迟（< 10ms）+ 亿级特征** → **双塔模型 / LR + 蒸馏 / FM**。典型如 Google 的 Wide & Deep 推理层、Netflix 的召回模型。

**第四层：组合使用的高级模式。**

- **GBDT + LR（Facebook 2014 经典方案）**：GBDT 叶子节点编号作为新特征，LR 拟合高阶组合。优势是"GBDT 的非线性 + LR 的高效推理"。**Facebook 用这套方案将 CTR 预估 AUC 提升 3%+**，至今仍是工业界小型推荐系统的默认起手式。
- **DeepFM 替代 GBDT+LR**：DeepFM 把二阶交叉交给 FM、高阶交给 DNN，端到端训练，省去 GBDT 单独训练 + 编码的工程开销。DeepFM 出自华为（Guo et al. 2017，见参考资料），**并非阿里妈妈的方案**；业界确有以它替换传统 GBDT+LR 的公开讨论，但本节无法给出统一出处，**线上 CTR / 广告收入的增益幅度也因此无法给出可核验的统一数字，此处按【经验】档处理**——这是 Wide&Deep 之后最重要的工业演进。
- **Wide & Deep（Google 2016）** + **Deep & Cross（Google 2017）** + **xDeepFM** 构成了"记忆 + 泛化"的统一框架。**Google Play Store 用 Wide&Deep 上线后，App 安装率提升 3.9%**。
- **DLRM（Meta 2019）**：专为推荐系统设计的工业级架构，融合 Embedding + 特征交叉 + MLP，是 Meta 内部广告推荐的核心模型。

**第五层：AI 时代的新趋势。**

- **LLM Embedding + 轻量分类头**：用预训练模型提 embedding（BERT / Sentence-BERT），接 LR / MLP。训练与推理成本显著低于 fine-tune 全量 LLM，效果在小数据集上接近 fine-tune。**HuggingFace 的 SetFit 框架在极少样本设置下（个位数每类标注样本）即可取得接近 fine-tune 的分类效果**——具体数值本节无法给出可核验出处，引用时请自行查证，本节不复述单一数字。
- **TabPFN（2023, ICLR）**：表格数据的 Prior-data Fitted Network，**小样本（< 10K）无需训练，直接预测**——是对传统 GBDT 的根本性挑战。
- **混合架构**：高频场景用专用模型（LR / FM），长尾场景用 LLM，路由分类器统一调度。**LinkedIn 的内容分类、Pinterest 的图谱分类都已采用这种混合架构**。

**3. 常见陷阱**

- **只背优缺点不背适用边界**：LR 推理快不代表"任何场景都用 LR"；DeepFM 精度高不代表"任何场景都用 DeepFM"。面试官最想听的是"什么场景不用什么"。
- **混淆 FM 和矩阵分解**：FM 是对**特征对**的隐向量分解，矩阵分解（MF）是对**用户-物品对**的分解——前者用于通用特征交叉，后者用于协同过滤。
- **把 Wide & Deep 当作"两个模型"**：Wide & Deep 是**一个模型的两个分支**（Wide 走 LR，Deep 走 DNN），联合训练，不是 ensemble。
- **忽略推理成本**：训练用 XGBoost 100 棵树，上线 100 万 QPS，单机推理延迟 50ms，总成本爆炸——必须评估推理硬件成本或做模型蒸馏。
- **不区分离线 AUC 和在线 CTR**：离线 AUC 提升 0.5%，在线 CTR 可能完全不涨，因为指标和业务不直接对齐（详见 Q6）。

**4. 追问预测**

- **「DeepFM 比 Wide & Deep 强在哪？」** 答：Wide & Deep 的 Wide 部分需要手工构造特征交叉（如 `AND(country, category)`），DeepFM 用 FM 自动学习二阶交叉，无需人工特征工程——**降低人力成本 + 提升精度**。
- **「为什么 XGBoost 在小数据上比深度学习好？」** 答：深度学习需要大量数据学习参数，10 万条样本下深度网络极易过拟合；XGBoost 用 Boosting + 树结构，对小数据更鲁棒。这是"结构化数据默认 XGBoost 起步"的根本原因。
- **「推荐系统里 LR + 手工交叉为什么被 DeepFM 替代了？」** 答：手工交叉依赖专家经验，新业务接入慢；DeepFM 自动学习交叉，新业务只需准备特征即可上线。**业务迭代速度 + 精度提升** 是核心驱动力。
- **「如何把 XGBoost 的精度和 LR 的推理速度结合？」** 答：XGBoost 蒸馏到 LR / FM；或 XGBoost 编码叶子节点作为新特征，LR 拟合线上推理（Facebook 方案）；或把 XGBoost 转换成 ONNX + TensorRT 加速推理。

**5. 参考资料**

- He et al. 2014《Practical Lessons from Predicting Clicks on Ads at Facebook》——GBDT+LR 经典方案出处，含完整的工程实现细节。
- Cheng et al. 2016《Wide & Deep Learning for Recommender Systems》（Google）——Wide & Deep 的原始论文，是 CTR 预估的必读文献。
- Guo et al. 2017《DeepFM: A Factorization-Machine based Neural Network for CTR Prediction》（华为 + 哈工大）——DeepFM 的原始出处，IJCAI 2017。
- Naumov et al. 2019《Deep Learning Recommendation Model for Personalization and Recommendation Systems》（Meta）——DLRM 论文，工业级推荐架构标杆。
- Chen & Guestrin 2016《XGBoost: A Scalable Tree Boosting System》——XGBoost 的原始论文。
- Ke et al. 2017《LightGBM: A Highly Efficient Gradient Boosting Decision Tree》（微软）——LightGBM 的原始论文。
- Prokhorenkova et al. 2018《CatBoost: Unbiased Boosting with Categorical Features》（Yandex）——CatBoost 的原始论文。
- Hollmann et al. 2023《TabPFN: A Transformer That Solves Small Tabular Classification Problems in a Second》（ICLR 2023）——TabPFN 原始论文。
- **阿里妈妈 DIN / DIEN** —— 阿里妈妈在 CTR 预估领域的工业级实践，深度兴趣网络解决了"用户兴趣动态演化"问题，是深度学习 CTR 的代表作。
- **字节跳动 CTR 预估架构** —— 字节用 Wide & Deep + DeepFM + 多任务学习构成 CTR 预估体系，配合自研 BytePS 分布式训练框架。
- **美团商家风控** —— 美团在外卖商家风险识别场景下用 XGBoost + LR 双层架构；相比单层基线，离线 AUC 与召回率均有改善，但**具体数值本节无法给出可核验出处，引用时请自行查证**。
- **京东金融风控** —— 京东数科在消费分期、信用支付场景下用 LR + 手工交叉 + WOE/IV 评分卡，是国内可解释风控的典型实践。
- **Shein 跨境时尚推荐** —— Shein 在商品 CTR 预估上用 DeepFM + DIN 混合架构，支撑日均千万订单的实时推荐。
- **Netflix 推荐系统** —— Netflix 用 Wide & Deep + 时序特征 + 多任务学习，是流媒体推荐 CTR 预估的代表。

---

### 8.3 Q2 风控 / 反欺诈场景下的分类建模

> 本题考察**风控领域对分类算法的特殊要求**——极不平衡、强可解释、低延迟、合规可审计。算法工程师必须理解"风控不是 Kaggle 比赛"的工程现实。

#### Q2.1 在信用卡反欺诈、支付反欺诈、信贷申请反欺诈场景下，分类模型的设计要点是什么？请从「样本构造 / 类别不平衡 / 实时性 / 可解释性 / 漂移监控 / 规则与模型的协同」六个角度作答，并结合招行、Stripe、Uber 的工业实践说明。

**1. 考察点**

- 是否理解风控场景的**极端不平衡**——欺诈占比通常 0.01%–0.5%，accuracy 99.5% 毫无信息量。
- 能否区分**交易反欺诈（毫秒级决策）**与**申请反欺诈（分钟级决策）**对模型的差异化要求。
- 是否知道**规则引擎 + 模型协同**的工业范式——纯模型在金融场景无法替代规则。
- 加分项：能结合 **PSI / KS 漂移监控**说明线上模型的可持续运营。

**2. 参考答案框架**

**第一层：先定义风控的三大子场景。**

- **交易反欺诈（T+0 毫秒级）**：用户刷卡 / 支付时实时拦截。延迟要求 P99 < 50ms，召回率 > 95%（漏掉一笔欺诈可能损失上万）。典型如招行信用卡 5 秒内识别可疑交易、Stripe Radar 实时拦截支付欺诈。
- **申请反欺诈（T+1 分钟级）**：用户申请信用卡 / 贷款时识别欺诈申请。延迟容忍较高（P99 < 1s），但要给出**拒绝理由**（监管要求）。典型如平安普惠、马上消费金融的信贷申请反欺诈。
- **营销反欺诈（小时 / 天级）**：识别薅羊毛、套现、黑产批量注册。可离线批跑，依赖图算法 + 异常检测 + 分类模型联合。

**第二层：样本构造的关键陷阱。**

- **标签延迟**：欺诈标签往往**滞后 30–90 天**（用户违约 / 银行确认欺诈后才回传），训练样本要用**3 个月前的数据 + 当下的标签**。这是风控建模区别于其他分类任务的核心。
- **标签噪声**：5%–15% 的"欺诈"标签其实是"恶意拒付"或"用户投诉"，需要业务专家做**标签清洗**。
- **样本窗口选择**：训练集用过去 6 个月数据，验证集用最近 1 个月——**时间切分**而非随机切分（避免穿越）。
- **黑样本采样**：欺诈样本极度稀疏，需要**白样本降采样**（如负样本保留 10%）+ 少样本过采样（Fraud 案例极少时用 SMOTE）。

**第三层：类别不平衡的处理（详见 Q4，但风控场景要点单独列）。**

- **下采样 + 加权**：保留全部欺诈 + 随机采样 10% 正常样本，class_weight 反向调整。
- **Focal Loss**：$\mathcal{L} = -\alpha(1-p_t)^\gamma \log(p_t)$，让模型聚焦"难分样本"——风控反欺诈场景的常见做法（本书无法给出可核验的公开出处说明招行信用卡反欺诈采用了 Focal Loss，此处仅作常见说法记录）。
- **阈值调优**：默认阈值 0.5 不可用，根据业务成本矩阵（漏判成本 vs 误判成本）调阈值。
- **评估指标**：不用 accuracy，用 **PR-AUC / F1 / KS**（详见 Q6）。

**第四层：模型选型——风控场景的特殊偏好。**

- **可解释性是硬约束**：金融场景必须能告诉用户/监管"为什么拒"。**LR + WOE/IV 评分卡**是事实标准，决策树次之，深度学习极少直接上（除非 LLM 时代用 SHAP 兜底）。
- **延迟是硬约束**：交易反欺诈 P99 < 50ms，意味着模型推理必须在 5–10ms 内。**LR / FM / 轻量 GBDT** 是首选，深度学习需要 ONNX/TensorRT 加速。
- **稳定性是软约束**：金融监管要求模型**可复现**（同样的输入 + 模型版本 = 同样的输出），所以**避免 dropout / 随机种子差异大的模型**。

**第五层：规则引擎 + 模型协同的工业范式。**

**招行信用卡反欺诈架构（A 卡 / B 卡 / C 卡）**：
- **A 卡（申请评分卡）**：用户申请信用卡时打分，LR + WOE/IV，输出信用分。
- **B 卡（行为评分卡）**：用户已持卡，每月打分评估违约风险。
- **C 卡（催收评分卡）**：用户已违约，对催收优先级打分。
- 三层卡 + **规则引擎（专家规则 + 黑名单）** + **反欺诈模型** 联合决策。

**Stripe Radar 架构**：
- 规则层：商户自定义规则（如"单笔超过 1000 美元 + 新用户"拒绝）。
- 模型层：基于全球数十亿交易的 GBDT + 深度学习模型，输出欺诈概率。
- 协同决策：规则先过滤（毫秒级），模型兜底（百毫秒级），可疑交易进入人工审核。

**Uber 风控架构（欺诈交易 / 司机欺诈）**：
- **实时层**：Flink + GBDT 在线打分，处理毫秒级交易。
- **离线层**：每日 Spark 批跑 XGBoost + 图算法（识别团伙欺诈）。
- **反馈闭环**：人工审核结果回流到样本库，每日重训。

**第六层：漂移监控与可持续运营。**

- **PSI（Population Stability Index）**：衡量线上 vs 离线特征分布差异。PSI > 0.25 为严重漂移，必须重训。
- **KS 漂移**：线上实时计算的 KS 统计量，与基线对比。
- **模型性能监控**：AUC / F1 的实时计算（需要延迟反馈，部分场景用代理指标）。
- **A/B 测试**：新模型先小流量验证，再全量。

**3. 常见陷阱**

- **直接套用通用分类指标**：用 accuracy 评估欺诈模型是典型错误。**必须用 PR-AUC / KS / F1**。
- **忽视标签延迟**：用 T+0 的数据 + T+30 的标签训练，模型学到"未来才能知道的特征"，离线 AUC 0.95、上线 0.55（**特征穿越**——ML 工程第一杀手）。
- **过度依赖深度学习**：风控场景 LR + 手工特征 + 评分卡是事实标准，深度学习精度更高但可解释性差，难以通过监管审查。
- **不区分场景**：把交易反欺诈和申请反欺诈混为一谈，前者毫秒级、后者分钟级，建模目标完全不同。
- **不监控漂移**：模型上线后无人监控，3 个月后效果断崖式下降——风控场景是黑产对抗，分布漂移比一般场景快得多。

**4. 追问预测**

- **「LR 在风控场景为什么还没被深度学习替代？」** 答：可解释性 + 监管合规 + 稳定性。深度学习在离线精度上通常略优于 LR（【经验】档，幅度随数据与任务而异，本节无法给出可核验的统一数字），但金融监管要求**每一个拒绝都要有理由**——LR 的特征权重就是天然的解释。
- **「Focal Loss 在风控场景真的有效吗？」** 答：对**极度不平衡**（正样本 < 0.1%）有效，对**轻度不平衡**（1–10%）收益不明显，且需要调 α / γ 两个超参。**本书无法给出可核验的公开出处说明招行信用卡反欺诈采用了 Focal Loss，此处仅作为常见说法记录**；增益幅度随样本分布与阈值而异，**不宜引用单一数字**。
- **「规则和模型怎么协同？」** 答：两层决策——规则层（专家规则 + 黑名单，处理已知模式）+ 模型层（处理未知模式）。规则先过滤明显正常/明显异常，模型兜底中间地带。
- **「欺诈标签滞后 30 天，模型怎么保证实时性？」** 答：用**滑动窗口训练**——T 日训练，用 T-90 到 T-30 的样本 + 标签，每 7 天重训一次。
- **「黑产团伙欺诈怎么识别？」** 答：单笔交易分类器识别不了团伙，需要**图算法（图神经网络 / 标签传播）+ 异常检测（Isolation Forest）+ 分类模型联合**——Uber 的团伙欺诈识别就是这种架构。

**5. 参考资料**

- 《巴塞尔协议 II/III》关于内部评级法的要求——风控模型必须可解释、可审计，是 LR 评分卡作为行业标准的根本原因。
- FICO Score 公开技术文档——信用评分卡的工业级实现细节。
- 《Machine Learning for Credit Risk Modeling》（2023, Packt）——信贷风控的工业级教材。
- 《Credit Risk Scorecards》——评分卡开发的完整流程。
- **招行信用卡反欺诈 A/B/C 卡体系** —— 国内零售银行最完整的评分卡实践，覆盖申请 / 行为 / 催收全生命周期。
- **平安普惠信贷反欺诈** —— 用 LR + XGBoost 双层架构 + 图算法识别团伙欺诈，是国内普惠金融风控的代表。
- **马上消费金融反欺诈** —— 用 GBDT + 时序特征 + 设备指纹，欺诈召回率相比纯规则基线有显著提升（**幅度随场景而异，本节无法给出可核验的具体数字**）。
- **微众银行联邦学习风控** —— 多家机构联合风控而不交换原始特征，是联邦学习在风控的典型应用。
- **Stripe Radar 反欺诈** —— 全球数十亿交易的实时反欺诈平台，规则 + 模型协同决策，是支付反欺诈的代表。
- **Uber Eats 欺诈交易识别** —— Flink 实时打分 + Spark 离线重训的双链路架构，处理全球外卖订单的欺诈识别。
- **京东金融反欺诈** —— 京东白条 / 金条的反欺诈体系，用 LR + GBDT + 图神经网络识别套现、刷单等场景。
- **美团商家风控** —— 美团在商家侧的风险识别，用 XGBoost + 设备指纹 + 行为序列特征，是本地生活风控的代表。

---

### 8.4 Q3 推荐系统的 CTR / CVR 预估与阿里 DIN / DIEN

> 本题考察**推荐系统中最核心的分类任务**——CTR/CVR 预估。需要理解从 LR → FM → DeepFM → DIN → DIEN → 多任务学习的演进，以及"为什么 Embedding + 注意力机制是推荐系统的胜负手"。

#### Q3.1 在推荐系统的 CTR / CVR 预估中，分类模型经历了从 LR → FM → DeepFM → DIN → DIEN 的演进。请分析每一代模型的**核心改进点**和**解决的业务问题**，并讨论阿里 DIN/DIEN 在电商推荐场景的工业落地细节。

**1. 考察点**

- 是否理解**推荐系统为什么需要专门的分类模型**——不是普通分类，而是 Embedding + 特征交叉 + 时序建模。
- 能否说清每代模型的**数学动机**：LR 不学交叉 → FM 学二阶交叉 → DeepFM 学高阶交叉 → DIN 学"用户兴趣分布" → DIEN 学"兴趣演化"。
- 是否知道**多任务学习（CTR + CVR + GMV 联合）**是当前推荐系统的标配——MMoE / PLE / ESSM。
- 加分项：能结合**阿里妈妈、字节、Meta**的工业实践，谈在线推理延迟优化和特征平台建设。

**2. 参考答案框架**

**第一层：推荐系统为什么需要分类。**

- **CTR（Click-Through Rate）预估**：预测用户点击物品的概率，本质是二分类。
- **CVR（Conversion Rate）预估**：预测点击后转化的概率，也是二分类。
- **GMV / 停留时长预估**：回归或多任务。
- 推荐系统的核心链路：召回（粗筛千级候选） → 粗排（CTR 预筛选百级） → 精排（CVR + 多目标打分十级） → 重排（多样性 / 业务规则）。

**第二层：五代模型的演进。**

| 模型 | 年份 | 核心改进 | 解决的业务问题 |
| --- | ---: | --- | --- |
| **LR** | 2010 | 一阶线性 | 工业级 CTR 起步 |
| **FM** | 2010（Rendle） | 二阶隐向量交叉 | 自动学习特征交叉，无需人工 |
| **FFM** | 2015 | 引入"特征域" | 区分不同特征域的隐向量 |
| **DeepFM** | 2017（华为） | FM 二阶 + DNN 高阶 | 端到端学习，避免 Wide&Deep 手工特征 |
| **DIN** | 2018（阿里） | 注意力机制 + 用户兴趣分布 | 不同候选物品激活不同兴趣 |
| **DIEN** | 2019（阿里） | 兴趣演化 + GRU 时序 | 用户兴趣随时间动态变化 |
| **DSIN** | 2019（阿里） | 会话级别兴趣 + 自注意力 | 短期会话 vs 长期兴趣区分 |
| **MMoE / PLE** | 2018–2020 | 多任务学习 | CTR + CVR + 留存联合训练 |
| **DLRM** | 2019（Meta） | Embedding + 系统优化 | 工业级推荐架构标杆 |

**第三层：DIN / DIEN 的核心创新（阿里妈妈，2018-2019）。**

**DIN（Deep Interest Network）解决的问题**：
- 传统模型把用户历史行为做**平均池化**（所有历史物品对当前候选同等重要）——这显然不对。
- DIN 用**注意力机制**：对当前候选物品，计算历史行为的权重分布，激活相关兴趣。
- 例：候选是"机械键盘"，DIN 自动激活用户历史的"外设 / 数码"兴趣，弱化"服装 / 美妆"兴趣。

**DIEN（Deep Interest Evolution Network）解决的问题**：
- DIN 只看当前兴趣分布，**不看兴趣的演化**——用户三个月前喜欢"数码"，最近一个月开始喜欢"家居"，DIN 不能区分。
- DIEN 引入 **GRU + 注意力更新门（AUGRU）**，建模兴趣从时刻 t 到 t+1 的演化。
- 例：用户在双 11 期间兴趣快速变化，DIEN 能捕捉"促销敏感型"兴趣。

**第四层：阿里妈妈的工业落地细节。**

- **数据规模**：日均百亿级曝光、千万级点击，亿级用户 / 商品特征。
- **训练架构**：阿里自研 **XDL（Deep Learning on X-Parameter Server）**——参数服务器架构，支撑千亿参数模型训练。
- **在线推理**：自研 **BE（Basic Engine）** 推理引擎 + 阿里妈妈自研 TAO 框架，P99 延迟 < 30ms。
- **特征平台**：阿里自研 **Tair / Picasso** 实时特征库，毫秒级特征查询。
- **业务收益**：DIN 在阿里妈妈线上场景中带来了 CTR / CVR 的可观提升，并对应业务侧的收益增长；**具体百分点本节无法核验（本书未取得可引用的统一出处），引用时请自行查证**。需注意 Zhou et al. 2018《Deep Interest Network》原文报告的是线上 CTR 增益，并未主张 CVR 增益，也没有给出 GMV 增量数字，后两项不应归到该文。

**第五层：字节 / Meta / Google 的并行演进。**

- **字节跳动**：用 DeepFM + DIN 混合架构 + 序列建模（Transformer），配合自研 BytePS 分布式训练框架。
- **Meta DLRM**：融合 Embedding + 特征交叉 + MLP，工业级推荐架构标杆。DLRM 论文（Naumov et al. 2019）主要报告架构与系统工程层面的对比结果，同时也给出了模型质量（accuracy / AUC 类）的对比，但它**并未主张「用 DLRM 替换传统 GBDT、CTR AUC 提升 5%」这一结论**，引用该数字请回到原文查证。
- **Google Wide & Deep**：Google Play Store 2016 上线，App 安装率 +3.9%，是 Wide & Deep 模型的工业实证。
- **Pinterest**：用 PinSage（图卷积）+ 推荐分类模型，处理图像 / 兴趣双塔。
- **LinkedIn**：用 LR + GBDT 双层 + 大量手工特征，处理职业推荐场景。
- **Airbnb**：用 LR + Embedding + 排序学习，处理房源推荐和搜索排序。

**第六层：多任务学习与工业级挑战。**

- **MMoE（Multi-gate Mixture-of-Experts）**：多个专家网络 + 任务门控，CTR / CVR / 留存任务共享底层参数。
- **PLE（Progressive Layered Extraction）**：MMoE 的改进版，分层提取任务特定知识。
- **ESSM（Entire Space Multi-task Model）**：解决"点击但未转化"的样本空间不一致问题。
- **工业挑战**：
  - **样本稀疏**：CVR 数据比 CTR 稀疏 10–100 倍，需要共享 CTR 的点击样本。
  - **延迟偏差**：CVR 训练样本是有偏的（只看到点击后的转化），需要 **IPS / 反事实学习**纠偏。
  - **延迟反馈**：转化标签滞后 0–30 天，需要**延迟反馈建模**。

**3. 常见陷阱**

- **混淆 DIN 和 Transformer**：DIN 的注意力是**对历史行为加权**（候选物品作为 query），Transformer 是**对序列内所有 token 加权**——前者是 Target-aware Attention，后者是 Self-attention。
- **把 DIEN 当作"加 GRU 的 DIN"**：DIEN 的核心是**兴趣演化路径建模**，GRU + AUGRU 是实现手段，不是简单叠加。
- **混淆多任务学习和集成学习**：多任务学习是**一个模型 + 多个任务头**，联合训练；集成学习是**多个独立模型 + 投票/加权**。
- **忽视在线推理延迟**：DIN / DIEN 模型大（亿级参数），上线必须做蒸馏 / 量化 / ONNX 加速，否则推理延迟爆炸。
- **把 CVR 当作独立问题**：CVR 严重受 CTR 样本空间偏差影响，单独训练 CVR 模型会有"selection bias"。

**4. 追问预测**

- **「DIN 的注意力机制为什么不直接用 Self-attention？」** 答：Self-attention 让候选物品和历史行为**彼此关注**，但推荐场景只需要"候选物品关注历史行为"——Target-aware Attention 更对症，且参数更少。
- **「DIEN 和 Transformer 怎么选？」** 答：DIEN 适合**用户行为时序明显**的场景（电商、新闻）；Transformer 适合**序列内交互复杂**的场景（评论、对话）。两者可叠加（如 DSIN）。
- **「多任务学习怎么避免负迁移？」** 答：MMoE 用门控机制隔离任务，PLE 分层提取，**任务相关性高**时才用多任务学习，否则单任务更稳。
- **「CTR 上线后效果不达预期，怎么排查？」** 答：分层诊断——① 特征穿越（offline AUC 0.92 / online 0.58）；② 分布漂移（PSI > 0.25）；③ 延迟监控（特征查询慢导致超时）；④ 业务对齐（A/B 测试显著性）。
- **「推荐系统的负采样怎么做？」** 答：召回阶段随机负采样（高效）；粗排阶段 hard negative mining（用精排打分选难负样本）；精排阶段不需要负采样（曝光未点击即负样本）。

**5. 参考资料**

- Rendle 2010《Factorization Machines》——FM 的原始论文。
- Cheng et al. 2016《Wide & Deep Learning for Recommender Systems》（Google）——Wide & Deep 的工业论文。
- Guo et al. 2017《DeepFM: A Factorization-Machine based Neural Network for CTR Prediction》——DeepFM 的原始论文。
- Zhou et al. 2018《Deep Interest Network for Click-Through Rate Prediction》（阿里妈妈，KDD 2018）——DIN 的原始论文。
- Zhou et al. 2019《Deep Interest Evolution Network for Click-Through Rate Prediction》（阿里妈妈，AAAI 2019）——DIEN 的原始论文。
- Naumov et al. 2019《Deep Learning Recommendation Model for Personalization and Recommendation Systems》（Meta）——DLRM 论文。
- Ma et al. 2018《Entire Space Multi-Task Model: An Effective Approach for Estimating Post-Click Conversion Rate》（阿里妈妈，SIGIR 2018）——ESSM 的原始论文。
- Tang et al. 2020《Progressive Layered Extraction (PLE): A Novel Multi-Task Learning (MTL) Model for Personalized Recommendations》（腾讯）——PLE 的原始论文。
- **阿里妈妈 DIN/DIEN/DSIN** —— CTR 预估领域的工业级标杆，深度兴趣网络的完整谱系。
- **字节跳动 Douyin 推荐系统** —— Transformer + 多任务 + 强化学习的混合架构。
- **美团外卖推荐** —— 用户行为序列建模 + 实时特征，处理高 QPS 场景下的 CTR 预估。
- **京东推荐系统** —— CTR + CVR + GMV 多任务学习架构，GMV 相比单任务基线有可观提升（**幅度随业务与口径而异，本节无法给出可核验的具体数字**）。
- **Pinterest 推荐系统** —— PinSage 图神经网络 + 推荐分类模型，处理图像推荐。
- **LinkedIn 职业推荐** —— LR + GBDT 双层 + 大量手工特征，处理职业兴趣匹配。
- **Airbnb 房源推荐** —— LR + Embedding + 排序学习，处理短租搜索排序。
- **Netflix 推荐系统** —— Wide&Deep + 时序特征 + 多任务学习，处理流媒体推荐。

---

### 8.5 Q4 类别不平衡的处理

> 本题考察**对类别不平衡问题的系统理解**——不是"加权重"那么简单，而是数据、算法、评估指标三个层面的综合治理。

#### Q4.1 在类别不平衡（正样本占比 0.1%–10%）的分类任务中，如何系统性地处理？请从「数据层面 / 算法层面 / 评估指标层面」三个角度详细说明，并结合风控 / 医疗诊断 / 工业缺陷检测三个场景讨论实际工程权衡。

**1. 考察点**

- 是否理解"accuracy 99%" 在 99:1 数据上**毫无信息量**——必须用 PR-AUC / F1 / KS。
- 能否区分**下采样 / 过采样 / 加权 / Focal Loss / 阈值调优**五种方法的适用边界。
- 是否知道**SMOTE 的局限**（在极度不平衡 + 高维稀疏下失效）和**集成学习（EasyEnsemble / BalanceCascade）**的优势。
- 加分项：能区分**训练时的不平衡处理**和**推理时的阈值调优**——前者改模型，后者不改。

**2. 参考答案框架**

**第一层：先定义问题的严重程度。**

| 正样本占比 | 严重程度 | 推荐策略 |
| --- | --- | --- |
| 40–60% | 平衡 | 默认 |
| 10–40% | 轻度不平衡 | class_weight 即可 |
| 1–10% | 中度不平衡 | SMOTE / 加权 + 阈值调优 |
| 0.1–1% | 重度不平衡 | 下采样 + Focal Loss + 多模型集成 |
| < 0.1% | 极端不平衡 | 异常检测 + 主动学习 + 业务规则兜底 |

**第二层：数据层面的处理。**

- **下采样（Undersampling）**：
  - **随机下采样**：保留全部正样本 + 随机采样负样本。优点是简单，缺点是丢失信息。
  - **EasyEnsemble**（Liu et al. 2009）：把负样本拆成 N 份，每份和正样本训练一个模型，最后 ensemble。**论文报告其效果优于单纯随机下采样**（具体增益随数据集而异，本节不复述单一数字）。
  - **BalanceCascade**：级联式下采样，每一轮删除"被正确分类的负样本"，逐步聚焦难样本。
  - **NearMiss**：基于距离选择代表性负样本。

- **过采样（Oversampling）**：
  - **随机过采样**：复制正样本。**严重过拟合，不推荐**。
  - **SMOTE**（Synthetic Minority Over-sampling Technique, Chawla et al. 2002）：在正样本之间插值生成新样本。局限：① 高维稀疏数据下插值无意义；② 边界样本可能生成噪声；③ 不适合极度不平衡（> 100:1）。
  - **Borderline-SMOTE**：只在边界生成样本，避免噪声。
  - **ADASYN**：自适应生成样本，难样本生成更多。
  - **Mixup / Manifold Mixup**：在样本层面做数据增强（与 SMOTE 类似思想）。

- **主动学习（Active Learning）**：模型选择"最难分"的样本让人工标注，逐步提升少数类样本质量。

**第三层：算法层面的处理。**

- **加权（Class Weight）**：在损失函数中对少数类提高权重。
  - LR / SVM / XGBoost 都有 `class_weight` 参数。
  - 权重公式：`w_pos / w_neg = neg_count / pos_count`（反比于样本数）。

- **Focal Loss**（Lin et al. 2017, RetinaNet）：
  - 公式：$\mathcal{L} = -\alpha_t (1 - p_t)^\gamma \log(p_t)$
  - 核心思想：让模型聚焦"难分样本"——$(1-p_t)^\gamma$ 是调制因子，分类正确的样本权重降低。
  - 超参经验：$\gamma = 2.0$ 是常用值，$\alpha$ 设反比于样本频率。
  - **局限**：对轻度不平衡收益不明显，对极度不平衡（< 0.1%）必须配合下采样。

- **集成学习**：
  - **BalancedBagging / BalancedRandomForest**：每棵树下采样平衡子集。
  - **EasyEnsemble**：多个下采样模型 ensemble（详见上）。

- **异常检测视角**：当正样本 < 0.1% 时，把它当作**异常检测**问题（Isolation Forest / One-Class SVM / AutoEncoder），而非分类问题。

**第四层：评估指标层面的处理（详见 Q6）。**

- **永远不要用 accuracy**：99:1 数据 accuracy 99% 毫无信息。
- **PR-AUC**：精度-召回曲线下面积，比 ROC-AUC 对不平衡更敏感。
- **F1 / F-beta**：调和平均，可调 β 强调 precision 或 recall。
- **MCC（Matthews Correlation Coefficient）**：考虑所有四象限的相关系数，类别极不平衡时比 F1 更稳定。
- **KS（Kolmogorov-Smirnov）**：正负样本累积分布差的最大值，风控场景标配。

**第五层：场景案例与工程权衡。**

**场景 A：风控 / 反欺诈（正样本 0.1–1%）**：
- 方案：下采样 + 加权 + Focal Loss + 阈值调优。
- 评估：KS / F1 / PR-AUC。
- 招行信用卡反欺诈：Focal Loss + XGBoost（该做法的公开出处本书无法核验；召回率增益幅度**本节无法给出可核验数字**）。
- Stripe Radar：GBDT + 下采样 + 实时阈值调优。

**场景 B：医疗诊断（正样本 1–10%）**：
- 方案：SMOTE + 加权 + 集成学习。
- 评估：Sensitivity（召回率）+ Specificity（特异度）+ ROC-AUC。
- 医疗场景**漏诊代价远高于误诊**——优先召回率。
- 某三甲医院肺结节检测：Focal Loss + U-Net（召回率增益随数据与标注质量而异，**本节无法给出可核验数字**）。

**场景 C：工业缺陷检测（正样本 < 0.1%）**：
- 方案：异常检测（Isolation Forest）+ Few-shot Learning + 主动学习。
- 评估：Recall@K + 误检率。
- 工业缺陷正样本极稀疏，传统分类失效，**异常检测 + 主动学习**是主流。

**第六层：决策树。**

```
[类别不平衡？]
   │
   ├── 正样本占比 10–40%（轻度）
   │     └── class_weight + 默认阈值 → 简单
   │
   ├── 正样本占比 1–10%（中度）
   │     ├── 结构化数据 → SMOTE / 加权 / EasyEnsemble
   │     └── 图像/文本 → 加权 + Focal Loss
   │
   ├── 正样本占比 0.1–1%（重度）
   │     ├── 下采样 + Focal Loss + 集成
   │     └── 阈值调优 + 业务成本矩阵
   │
   └── 正样本占比 < 0.1%（极端）
         ├── 异常检测（Isolation Forest / OC-SVM）
         ├── Few-shot Learning / Meta Learning
         └── 主动学习 + 业务规则兜底
```

**3. 常见陷阱**

- **直接套用 SMOTE**：高维稀疏数据（推荐系统 ID 类特征）下 SMOTE 插值无意义，甚至引入噪声。
- **用 accuracy 评估**：99:1 数据 accuracy 99% 完全没有信息量——这是初学者最常见的错误。
- **把阈值调优当万能解药**：阈值调优不改模型，只是"调整决策边界"——如果模型本身的概率排序差，调阈值也救不回来。
- **过度依赖加权**：单靠 `class_weight` 对 1% 的正样本收益有限，必须配合其他策略。
- **忽视业务成本**：默认 precision = recall = 重要，但**风控漏判成本是误判成本的 10–100 倍**——必须按业务成本矩阵调阈值。

**4. 追问预测**

- **「SMOTE 在哪些场景下不能用？」** 答：① 高维稀疏特征（推荐系统 ID）；② 类别极不平衡（> 100:1）；③ 边界样本稀少；④ 时序数据（破坏时序结构）。
- **「Focal Loss 和 class_weight 的区别？」** 答：class_weight 调整**整体权重**（少数类全部加权），Focal Loss 调整**样本级别权重**（难分样本加权，正确分类样本降权）。两者可叠加。
- **「阈值怎么调？」** 答：① 在验证集上画 PR 曲线，选业务成本最优的阈值；② 用 Youden's J 统计量（敏感度 + 特异度 - 1）；③ 风控场景根据"漏判成本 / 误判成本"的比例反推。
- **「F1 和 AUC 选哪个？」** 答：① 类别极不平衡时 AUC 可能"虚高"（正样本少，排序靠后不影响 AUC），用 **PR-AUC** 更稳；② 如果关注单一阈值下的表现，用 F1；③ 整体排序能力用 AUC。
- **「类别不平衡 + 多标签怎么处理？」** 答：每个标签独立处理（部分标签可能极度不平衡）+ 多标签 BCE 损失 + 标签加权。

**5. 参考资料**

- Chawla et al. 2002《SMOTE: Synthetic Minority Over-sampling Technique》——SMOTE 原始论文。
- Lin et al. 2017《Focal Loss for Dense Object Detection》（RetinaNet, Facebook AI）——Focal Loss 原始论文。
- He & Garcia 2009《Learning from Imbalanced Data》——不平衡学习的综述论文。
- Liu et al. 2009《Exploratory Undersampling for Imbalance Data Learning》——EasyEnsemble 原始论文。
- Japkowicz & Stephen 2002《The Class Imbalance Problem: A Systematic Study》——不平衡问题的系统性研究。
- **招行信用卡反欺诈 Focal Loss 实践** —— 用 Focal Loss + XGBoost 提升欺诈召回率（该做法的公开出处本书无法核验；**幅度随样本分布而异，本节无法给出可核验的具体数字**）。
- **平安普惠信贷反欺诈** —— 下采样 + 加权 + 阈值调优的综合实践。
- **Stripe Radar 反欺诈** —— GBDT + 下采样 + 实时阈值调优。
- **某三甲医院肺结节检测** —— Focal Loss + U-Net，在小样本医学影像上提升召回率（**具体数字本节无法核验**）。
- **美团商家风控** —— EasyEnsemble + GBDT，处理高维稀疏不平衡数据。
- **京东金融反欺诈** —— 多模型集成 + 阈值调优，欺诈召回率优于纯规则 / 单模型基线（**本节无法给出可核验的具体数字**）。
- **微众银行联邦学习** —— 在隐私约束下的不平衡学习。

---

### 8.6 Q5 特征工程与交叉：WOE / IV / Target Encoding / DeepFM

> 本题考察**特征工程的工业实践**——分箱、编码、交叉、选择四大动作，以及从手工特征到自动特征学习的演进。

#### Q5.1 在结构化数据的分类任务中，特征工程的核心动作有哪些？请详细说明**分箱（Binning）/ 编码（Encoding）/ 交叉（Crossing）/ 选择（Selection）**四个步骤，并讨论从**手工特征 → 自动特征学习（DeepFM / DLRM）**的演进逻辑和工程权衡。

**1. 考察点**

- 是否理解**特征工程是 ML 工程的"胜负手"**——同样的模型 + 好的特征 vs 差的特征，AUC 往往能差出数个百分点（【经验】档，幅度随数据与任务而异）。
- 能否区分**风控场景的 WOE / IV**与**推荐场景的 Target Encoding / Embedding**。
- 是否知道**特征穿越 / 标签泄漏**是 ML 工程第一杀手。
- 加分项：能讨论**Feature Store**在大型企业中的工程化实践。

**2. 参考答案框架**

**第一层：特征工程的四大核心动作。**

**动作 1：分箱（Binning）**——将连续特征离散化。

- **等距分箱**：等距切分（如年龄 0–100，每 10 岁一箱）。简单但对长尾分布不友好。
- **等频分箱**：每箱样本数相等。适合长尾分布，但对异常值敏感。
- **卡方分箱（ChiMerge）**：基于卡方检验合并相似箱。**风控场景的事实标准**。
- **决策树分箱**：用决策树学习最优切分点。LR 训练前的"分箱预处理"。
- **最佳实践**：等频分箱 20 箱起步，卡方分箱优化。

**动作 2：编码（Encoding）**——将类别特征数值化。

- **One-Hot Encoding**：K 类变 K 维，**适合低基数类别**（如性别、省份）。高基数（城市、用户 ID）会导致维度爆炸。
- **Label Encoding**：类别映射到整数，**仅适合有顺序的类别**（低 / 中 / 高）。
- **Target Encoding**（Mean Encoding）：用目标变量的均值替换类别值。**必须 K-Fold 防止泄漏**。**风控 WOE 是 Target Encoding 的特例**。
- **Frequency Encoding**：用类别出现频率编码。
- **Hash Encoding**：用哈希函数降维，适合超高基数（千万级）。
- **Embedding Encoding**：用神经网络学 Embedding，**适合高基数 + 有语义关联**（推荐系统 ID）。

**动作 3：交叉（Crossing）**——构造组合特征。

- **手工交叉**：`AND(user_country, item_category)`、`user_age_bucket * item_price_bucket`。优点是可控、可解释；缺点是依赖专家经验。
- **FM 二阶交叉**：$\langle v_i, v_j \rangle$ 自动学习所有二阶交叉，无需人工。
- **DeepFM / DCN 高阶交叉**：DNN + Cross Network 自动学习高阶组合。
- **业务场景**：
  - 风控：手工交叉（`AND(年龄, 收入, 婚姻)`）是核心。
  - 推荐：FM / DeepFM 自动交叉是标配。
  - 文本：词袋 + N-gram 是基础。

**动作 4：选择（Selection）**——筛选有效特征。

- **方差过滤**：去除几乎不变的常量特征。
- **卡方检验 / 互信息**：衡量特征与标签的相关性。
- **L1 正则**：训练时让不重要的特征权重为 0。
- **树模型重要性**：XGBoost / LightGBM 自带 `feature_importance`。
- **SHAP 值**：基于博弈论的特征贡献度（详见 Q7）。
- **WOE / IV**：风控场景的特征选择标准（IV > 0.1 有效，IV > 0.3 强有效）。

**第二层：风控 vs 推荐的特征工程差异。**

| 维度 | 风控 | 推荐 |
| --- | --- | --- |
| 主流分箱 | 卡方分箱 + WOE | 等频分箱 + Bucket |
| 主流编码 | WOE / IV | Embedding |
| 主流交叉 | 手工交叉 + 评分卡 | FM / DeepFM 自动交叉 |
| 特征维度 | 数百到数千 | 百万到亿级 |
| 可解释性 | 必须 | 通常不需要 |
| 实时性 | T+0（毫秒） | T+0（毫秒） |

**第三层：WOE / IV——风控场景的"心法"。**

- **WOE（Weight of Evidence）**：$WOE_i = \ln\left(\frac{P(X = x_i \mid Y = 1)}{P(X = x_i \mid Y = 0)}\right)$，衡量特征每个箱对"正样本 vs 负样本"的区分能力。
- **IV（Information Value）**：$IV = \sum_i (P_i^{pos} - P_i^{neg}) \times WOE_i$，衡量特征整体的信息量。
- **IV 取值判断**：
  - < 0.02：无用
  - 0.02–0.1：弱
  - 0.1–0.3：中
  - 0.3–0.5：强
  - \> 0.5：可疑（可能过拟合或标签泄漏）
- **优势**：可解释、稳定、监管友好。**招行、平安、微众的风控评分卡都基于 WOE/IV**。

**第四层：从手工特征到自动特征学习的演进。**

- **第一代（手工）**：专家构造特征 + LR / GBDT。**优点**：可控可解释；**缺点**：依赖专家、迭代慢。
- **第二代（半自动）**：GBDT 叶子编码 + LR（Facebook 2014）。**优点**：自动构造交叉；**缺点**：两阶段训练复杂。
- **第三代（端到端）**：FM / DeepFM / DLRM。**优点**：端到端、效率高；**缺点**：可解释性差。
- **第四代（基础模型化）**：TabPFN / SAINT / FT-Transformer（2023+）。**优点**：小样本无需训练；**缺点**：数据量限制。

**第五层：特征工程常见的陷阱。**

- **特征穿越**：训练时引入"未来才能知道的特征"（如"用户后续点击"），离线 AUC 0.95、上线 0.55。
- **标签泄漏**：训练时归一化用了全样本均值 / 方差，或 Target Encoding 没有 K-Fold。
- **分布不一致**：训练用历史窗口特征，上线查询最新特征，但**实时特征未对齐**。
- **高基数类别直接 One-Hot**：城市 / 用户 ID 直接 One-Hot 导致维度爆炸。
- **未做特征监控**：线上特征缺失 / 异常未报警，导致模型输入污染。

**第六层：Feature Store 的工业实践。**

- **特征平台化**：Feature Store 把特征从模型训练中解耦，统一管理。
- **在线 / 离线一致性**：同一特征在训练（批处理）和在线（流式）下必须口径一致。
- **代表系统**：Feast（开源）、阿里 Picasso、Tair、字节 Feature Store、AWS SageMaker Feature Store。
- **价值**：避免重复造特征、保证一致性、支持特征共享复用。

**3. 常见陷阱**

- **Target Encoding 不做 K-Fold**：直接用全样本均值编码，验证集表现远好于测试集（标签泄漏）。
- **WOE/IV 只用于 LR**：IV > 0.5 的特征要警惕，可能是标签泄漏或未来信息。
- **手工交叉不够**：风控专家构造的交叉特征数量有限（几十到几百），不如 FM 自动化覆盖全。
- **忽视特征监控**：线上特征与训练分布不一致是模型失效的第一大原因。
- **过度依赖自动特征学习**：DeepFM / DLRM 不需要任何手工特征是误解——**强业务先验的交叉特征仍然要手工构造**。

**4. 追问预测**

- **「Target Encoding 怎么防泄漏？」** 答：① K-Fold Target Encoding（每折用其他折的均值）；② 加噪声 / 正则（smoothing）；③ 时间序列按"过去均值"计算。
- **「WOE 和 Target Encoding 的关系？」** 答：WOE 是 Target Encoding 的对数变换 + 标准化形式，两者本质相同。WOE 的优势在于 IV 统计量更易解释。
- **「高基数类别怎么处理？」** 答：① Hash Encoding（哈希降维）；② Frequency Encoding（频率）；③ Embedding（推荐系统）；④ Target Encoding + 平滑；⑤ 直接交给 GBDT 自动处理。
- **「如何判断特征穿越？」** 答：① 离线 AUC 极高（> 0.95）+ 在线 AUC 正常或低 → 高度怀疑；② 特征重要性分析（穿越特征一定排第一）；③ 时间切分验证（用 T+30 数据训练 + T+0 测试，AUC 暴跌则穿越）。
- **「Feature Store 在分类任务中的价值？」** 答：① 特征复用（多个模型共享特征）；② 离线 / 在线一致性保证；③ 特征血缘 + 监控；④ 特征版本管理。

**5. 参考资料**

- Zheng & Casari 2018《Feature Engineering for Machine Learning》——特征工程的系统化教材。
- Kuhn & Johnson 2019《Feature Engineering and Selection》——特征工程的进阶教材。
- Micci-Barreca 2001《A Preprocessing Scheme for High-Cardinality Categorical Attributes in Classification and Prediction Problems》——Target Encoding 的经典论文。
- Rendle 2010《Factorization Machines》——FM 的原始论文，含特征交叉的数学基础。
- **招行信用卡评分卡** —— WOE/IV + LR + 手工交叉的工业级实践。
- **平安普惠信贷风控** —— WOE/IV + 自动交叉 + XGBoost。
- **华为 DeepFM** —— 端到端自动特征学习的代表作。
- **Meta DLRM** —— 工业级推荐系统的特征工程架构。
- **字节跳动特征平台** —— 支持亿级特征的实时查询，是国内 Feature Store 的代表。
- **京东金融特征平台** —— 风控 / 推荐 / 营销三大场景的统一特征管理。
- **美团商家特征工程** —— 商家风险识别的特征体系，含设备指纹、行为序列等。
- **微众银行联邦特征** —— 不交换原始特征的联合特征工程。

---

### 8.7 Q6 评估指标：AUC / KS / F1 / PR-AUC 的取舍与业务对齐

> 本题考察**评估指标的系统理解**——不是"指标越高越好"，而是"业务需要什么，指标就该怎么对齐"。

#### Q6.1 在分类任务中，AUC / KS / F1 / PR-AUC 是常用的评估指标。请详细说明每个指标的数学含义、适用场景、局限性，并讨论**离线指标与在线业务指标对齐**的工程方法。最后，请结合阿里妈妈、字节跳动的 CTR 预估实践说明指标体系的设计原则。

**1. 考察点**

- 是否理解每个指标的**数学本质**：AUC 是排序能力、KS 是分布差、F1 是单一阈值、PR-AUC 是 P-R 曲线下面积。
- 能否区分**阈值无关指标**（AUC / KS / PR-AUC）和**阈值相关指标**（Precision / Recall / F1）。
- 是否知道**AUC 在类别极不平衡下的"虚高"问题**——必须用 PR-AUC 替代。
- 加分项：能讨论**离线指标与在线业务对齐**的方法（A/B 测试 + 业务代理指标）。

**2. 参考答案框架**

**第一层：先定义四个核心指标。**

- **AUC（ROC-AUC）**：ROC 曲线下面积。**数学含义**：随机正样本打分高于随机负样本的概率。**优点**：阈值无关、整体排序能力、计算稳定。**局限**：类别极不平衡时"虚高"（1% 正样本 AUC 0.95 实际可能很差）。
- **KS（Kolmogorov-Smirnov）**：正负样本累积分布差的最大值。**数学含义**：$KS = \max_t |F_{pos}(t) - F_{neg}(t)|$。**优点**：单值可解释、对应"最佳阈值"。**局限**：只看最大差，不反映整体。**风控场景标配**。
- **F1**：Precision 和 Recall 的调和平均。**数学含义**：$F1 = 2PR / (P+R)$。**优点**：单值、平衡 P/R。**局限**：依赖单一阈值，不反映整体。
- **PR-AUC**：P-R 曲线下面积。**优点**：类别不平衡时比 ROC-AUC 更敏感。**局限**：不直观（不像 AUC 那样有概率解释）。

**第二层：数学推导与直觉。**

- **AUC 的概率解释**：$AUC = P(score_{pos} > score_{neg})$，即随机正样本打分高于随机负样本的概率。
- **KS 的几何解释**：在 ROC 曲线上，KS = max(TPR - FPR)，即 ROC 曲线离对角线的最大距离。
- **F1 的局限**：F1 是单点指标，对阈值敏感——同一个模型只改阈值，F1 就可能差出十余个百分点量级（【经验】档，幅度随模型与样本分布而异）。
- **PR-AUC vs ROC-AUC**：当负样本远多于正样本时，ROC 曲线被大量负样本"撑住"，PR 曲线更能反映分类器的真实能力。

**第三层：场景选型决策表。**

| 场景 | 推荐指标 | 理由 |
| --- | --- | --- |
| 风控 / 反欺诈 | **KS / F1 / PR-AUC** | AUC 虚高，KS 对应最佳阈值 |
| CTR / CVR 预估 | **AUC / GAUC** | 整体排序能力，GAUC 按用户分组 |
| 医疗诊断 | **Sensitivity + Specificity + ROC-AUC** | 漏诊代价高，看敏感度 |
| 类别极不平衡（< 1%） | **PR-AUC / F1 / MCC** | AUC 失效 |
| 内容审核 | **Recall@K / F1** | 漏检代价高 |
| 异常检测 | **Recall@K + 误报率** | Top-K 优先 |

**第四层：指标的局限性。**

- **AUC 虚高问题**：1% 正样本，AUC 0.95 但实际可能只把正样本排在 100 个负样本之后——必须看 **PR-AUC**。
- **KS 不反映整体**：KS 只看最大差，不关心其他阈值表现。
- **F1 单点局限**：阈值略作变动（如 0.1 量级），F1 就可能差出数个百分点（【经验】档，幅度随模型与样本分布而异）。
- **离线指标 ≠ 业务指标**：CTR 模型离线 AUC +1%，在线 CTR 可能完全不涨——因为**业务决策受模型外的因素影响**（商品库存、推荐位、价格等）。
- **AUC 的"对称性"**：AUC 不区分 P / R，但在不平衡场景中，**正负样本权重严重不对等**。

**第五层：离线与在线指标对齐。**

- **离线指标的局限性**：模型在历史数据上表现好，不代表在新数据上好；离线 AUC 高，在线 CTR 可能不涨。
- **业务对齐的方法**：
  - **A/B 测试**：唯一可信的"金标准"——50% 流量给新模型、50% 流量给基线，对比 CTR / GMV / 转化率等业务指标。
  - **业务代理指标**：用**离线指标 + 业务指标**共同评估，如"AUC +0.5%" + "CTR +1%"。
  - **离线模拟在线**：用**回放流量**（replay）模拟在线行为，计算"如果上线会怎样"。
  - **增量上线**：10% 流量验证 → 50% 流量验证 → 全量上线，每步看业务指标。
- **阿里妈妈的指标体系**：
  - 离线：AUC / GAUC（按用户/场景分组）+ PR-AUC。
  - 在线：CTR / CVR / RPM（千次展示收入）+ GMV。
  - 业务：A/B 测试显著性 + ROI 计算。
- **字节跳动的指标体系**：
  - 离线：AUC + 分场景 AUC + 长尾类目表现。
  - 在线：CTR / 完播率 / 互动率 / 留存。
  - 业务：DAU / 时长 / 收入。

**第六层：进阶指标。**

- **GAUC（Group AUC）**：分组计算的 AUC，按用户 / 场景 / 类目分组。**推荐系统的事实标准**——不同用户的 AUC 加权平均，权重为该用户的曝光 / 点击数。
- **NDCG / MAP**：排序学习指标（详见排序学习章节）。
- **MCC（Matthews Correlation Coefficient）**：$MCC = \frac{TP \times TN - FP \times FN}{\sqrt{(TP+FP)(TP+FN)(TN+FP)(TN+FN)}}$，类别极不平衡时比 F1 更稳定。
- **Calibration Error**：预测概率 vs 实际频率的偏差。
- **Business Metric**：直接的业务指标（GMV / CTR / 转化率 / 留存 / ROI）。

**3. 常见陷阱**

- **AUC 越高越好**：在类别极不平衡下 AUC 0.95 可能没有意义，必须看 PR-AUC。
- **用 accuracy 评估**：99:1 数据 accuracy 99% 没有信息量。
- **离线指标 = 在线表现**：离线 AUC 高不代表在线效果好，必须 A/B 测试。
- **不关注业务指标**：AUC 提升 1% 但 GMV 完全没涨，可能是过度优化离线指标。
- **混淆 KS 和 AUC**：KS 是 ROC 曲线最大差，AUC 是 ROC 曲线下面积——KS 是**点指标**，AUC 是**面积指标**。

**4. 追问预测**

- **「AUC 0.85 在风控场景够用吗？」** 答：不够。风控场景一般要求 **AUC > 0.90 + KS > 0.40**。KS > 0.40 才有显著区分能力。
- **「为什么 GAUC 比 AUC 更适合推荐？」** 答：不同用户的行为模式差异极大，全局 AUC 可能被高频用户主导。GAUC 按用户分组加权，能反映"模型对每个用户的排序能力"。
- **「PR-AUC 怎么计算？」** 答：对所有可能的阈值，计算 (Precision, Recall)，画 P-R 曲线，曲线下面积即 PR-AUC。**scikit-learn 的 `average_precision_score`**。
- **「离线 AUC 和在线 CTR 不对齐，怎么排查？」** 答：① 特征穿越（offline AUC 0.92 / online 0.58）；② 分布漂移（PSI > 0.25）；③ 延迟监控；④ 业务变化（库存、价格、季节性）。
- **「如何设计指标体系？」** 答：① 离线指标（AUC / PR-AUC / F1）+ 在线指标（CTR / 转化率）+ 业务指标（GMV / 留存）三层；② 不同场景不同指标；③ 持续 A/B 测试验证。

**5. 参考资料**

- Fawcett 2006《An Introduction to ROC Analysis》——ROC 曲线的经典教材。
- Saito & Rehmsmeier 2015《The Precision-Recall Plot Is More Informative than the ROC Plot When Evaluating Binary Classifiers on Imbalanced Datasets》——PR-AUC 在不平衡下的优势。
- Chicco & Jurman 2020《The Advantages of the Matthews Correlation Coefficient (MCC) over F1 Score and Accuracy》——MCC 的优势。
- **阿里妈妈指标体系** —— 离线 AUC + GAUC + 在线 CTR/CVR + 业务 GMV 的三层指标体系。
- **字节跳动推荐指标** —— AUC + 分场景 AUC + 长尾指标 + 业务 DAU/时长。
- **Google Wide & Deep 论文** —— 离线 AUC + 在线 App 安装率的双层评估。
- **Meta DLRM 论文** —— 离线 NE / AUC + 在线 CTR/engagement 的双层评估。
- **Netflix 推荐系统** —— 离线 RMSE + 在线点击率/完播率的混合评估。
- **LinkedIn 推荐评估** —— A/B 测试 + 业务指标（申请率、留存率）的工业实践。
- **招行风控指标体系** —— KS + AUC + 业务损失的双层评估。

---

### 8.8 Q7 模型解释：SHAP / 特征重要性 / EBM 在风控与合规中的应用

> 本题考察**模型可解释性**——AI 时代不仅是"精度高"，更是"能解释、能审计、能合规"。

#### Q7.1 在风控、医疗、政务等强监管场景下，分类模型必须可解释。请系统说明**特征重要性 / SHAP / LIME / EBM**等可解释方法的原理、适用场景和工程实践，并讨论深度学习时代可解释 AI（XAI）的发展趋势。

**1. 考察点**

- 是否理解**可解释性的业务价值**——不是"加分项"，而是"硬约束"（监管合规）。
- 能否区分**全局可解释**（整个模型）和**局部可解释**（单个预测）。
- 是否知道 **SHAP 的数学基础**（Shapley Value, 博弈论）。
- 加分项：能讨论**EBM（Explainable Boosting Machine）**作为"可解释 + 高精度"的代表。

**2. 参考答案框架**

**第一层：先定义可解释性的两个维度。**

- **全局可解释（Global Interpretability）**：理解整个模型的行为，如"哪些特征最重要"、"特征如何影响预测"。
- **局部可解释（Local Interpretability）**：理解单个预测的原因，如"为什么这个用户被拒"、"为什么这个贷款申请被拒"。

**第二层：主流可解释方法。**

**方法 1：特征重要性（Feature Importance）**

- **原理**：衡量每个特征对模型预测的贡献。
- **实现**：
  - **基于树模型的重要性**：XGBoost / LightGBM 自带 `feature_importance`，基于分裂次数 / 信息增益。
  - **基于 Permutation Importance**：把特征值随机 shuffle，看模型性能下降多少——下降越多越重要。
  - **基于 Drop-Column Importance**：删掉某特征重训练，对比性能。
- **优点**：简单直观。**局限**：只反映"重要性"，不反映"方向"和"形状"。

**方法 2：SHAP（SHapley Additive exPlanations）**

- **原理**：基于博弈论的 Shapley Value，把每个特征的贡献分配到预测上。
- **数学**：$f(x) = \phi_0 + \sum_{i=1}^M \phi_i$，$\phi_i$ 是特征 $i$ 的 SHAP 值。
- **优点**：
  - 理论保证（公平分配贡献）。
  - 局部 + 全局可解释（`summary_plot` 看全局，`force_plot` 看单个预测）。
  - 模型无关（适用于 XGBoost / NN / 任何模型）。
- **局限**：计算慢（精确 SHAP 是指数复杂度）、对特征共线性敏感。
- **工具**：shap（Python 开源库）。

**方法 3：LIME（Local Interpretable Model-agnostic Explanations）**

- **原理**：在单个预测附近采样，拟合一个简单的线性模型作为局部解释。
- **优点**：模型无关、速度快、对单个预测友好。
- **局限**：局部采样不稳定、解释的"忠实性"难以保证。

**方法 4：EBM（Explainable Boosting Machine）**

- **原理**：微软研究院提出的可解释 GBDT，用**特征函数**代替决策树，每个特征学一个 SHAP-like 的形状函数。
- **优点**：精度接近 XGBoost、可解释性接近 LR（每个特征一个函数）。
- **适用**：风控、医疗、广告。

**方法 5：集成解释**

- **LIME + SHAP + EBM** 组合：LIME 看局部、SHAP 看全局 + 局部、EBM 看特征函数。

**第三层：风控场景的可解释性实践。**

- **监管要求**：欧盟 GDPR "解释权"、中国《个人信息保护法》、银保监会《商业银行互联网贷款管理暂行办法》——都要求**对拒绝给出明确理由**。
- **招行信用卡反欺诈**：LR + WOE/IV + 评分卡 → 每个拒绝都给出**特征权重 + 阈值**作为理由。
- **平安普惠信贷**：LR + XGBoost + SHAP → 给客户展示"为什么被拒"。
- **微众银行联邦风控**：联邦学习 + SHAP，在不暴露原始特征的前提下做解释。

**第四层：医疗场景的可解释性实践。**

- **诊断可解释**：模型说"这张影像 80% 是肺结节"，必须给出**图像区域的可视化**（Grad-CAM / Saliency Map）。
- **决策可追溯**：医生需要知道"模型为什么这么判断"，以便决定是否采纳。
- **合规要求**：FDA 对医疗 AI 的审批要求可解释性。
- **工具**：Grad-CAM（CNN 可视化）、SHAP（结构化特征）、Captum（PyTorch 解释库）。

**第五层：AI 时代的 XAI 趋势。**

- **深度学习可解释**：Attention 可视化（Transformer 的注意力权重）、Grad-CAM（CNN）、Concept Activation Vectors（CV）。
- **LLM 可解释**：Chain-of-Thought 让 LLM "说出思考过程"，Self-Consistency 多路径投票。
- **因果可解释**：从"相关性"到"因果性"，Causal Inference（DoWhy / EconML）。
- **反事实解释**：不仅说"为什么被拒"，还告诉用户"如果满足 X 条件就会被接受"。

**第六层：工程化挑战。**

- **SHAP 计算慢**：精确 TreeSHAP 对百万样本可能跑数小时。**解决方案**：采样近似、KernelSHAP、模型蒸馏。
- **实时性**：风控毫秒级决策，SHAP 计算要 < 1ms。**解决方案**：预计算 SHAP、用 EBM 替代 SHAP、只对拒绝样本计算 SHAP。
- **特征共线性**：WOE 编码后特征共线性严重，SHAP 值会被"摊薄"。**解决方案**：去除冗余特征、用 SHAP interaction value。
- **对抗解释**：恶意用户可以利用解释"绕过"模型——必须配合规则引擎兜底。

**3. 常见陷阱**

- **可解释性 = 简单模型**：深度学习 + SHAP 也能可解释，不是只有 LR 才行。
- **SHAP 一定正确**：SHAP 基于 Shapley Value 的**理论公平性**，但不保证**业务正确性**——必须配合业务专家校验。
- **忽视解释的"对抗性"**：用户可以利用解释绕过风控（"只要改这几个特征就能过"）。
- **混淆"重要性"和"因果"**：SHAP 反映的是"贡献度"，不是"因果关系"。
- **过度依赖单一方法**：LIME 不稳定、SHAP 慢、特征重要性粗——必须组合使用。

**4. 追问预测**

- **「SHAP 和 LIME 怎么选？」** 答：① 全局解释用 SHAP（理论保证）；② 局部 + 快速解释用 LIME；③ 树模型优先 TreeSHAP（精确且快）；④ 实时性要求高用 EBM。
- **「可解释性 vs 精度的取舍？」** 答：① 监管强要求场景（金融、医疗）→ 可解释性优先；② 业务可接受"黑盒"的场景（推荐、广告）→ 精度优先；③ 折中方案：EBM / 深度学习 + SHAP 组合。
- **「SHAP 怎么优化计算速度？」** 答：① TreeSHAP 对树模型精确且快（XGBoost / LightGBM 集成支持）；② KernelSHAP 采样近似；③ 预计算 SHAP（离线计算 + 在线查表）；④ 用 SHAP interaction value 时减少特征对。
- **「深度学习可解释怎么做？」** 答：① Attention 可视化（Transformer）；② Grad-CAM（CNN）；③ SHAP DeepExplainer；④ LIME；⑤ 概念瓶颈模型（Concept Bottleneck Models）。
- **「LLM 怎么可解释？」** 答：① Chain-of-Thought（让 LLM 说出推理过程）；② Self-Consistency（多路径投票）；③ Tool Use（明确调用工具）；④ Structure Output（JSON Schema 强制结构化）。

**5. 参考资料**

- Lundberg & Lee 2017《A Unified Approach to Interpreting Model Predictions》（NeurIPS）——SHAP 的原始论文。
- Ribeiro et al. 2016《"Why Should I Trust You?": Explaining the Predictions of Any Classifier》（KDD）——LIME 的原始论文。
- Lou et al. 2013《Accurate Intelligible Models with Pairwise Interactions》——EBM 的前身 GAMMI。
- Caruana et al. 2015《Intelligible Models for HealthCare: Predicting Pneumonia Risk and Hospital 30-day Readmission》——EBM 的奠基论文。
- Molnar 2022《Interpretable Machine Learning》——可解释 ML 的系统教材。
- Arrieta et al. 2020《Explainable Artificial Intelligence (XAI): Concepts, Taxonomies, Opportunities and Challenges》——XAI 综述。
- **招行信用卡反欺诈解释** —— LR + WOE/IV 评分卡的天然可解释性。
- **平安普惠信贷解释** —— XGBoost + SHAP 的工业实践。
- **微众银行联邦 XAI** —— 联邦学习 + SHAP 的隐私保护可解释。
- **LinkedIn 推荐解释** —— Wide&Deep + 特征重要性 + 业务代理指标。
- **京东金融反欺诈解释** —— GBDT + SHAP + 规则引擎的混合解释。
- **某三甲医院医疗影像解释** —— CNN + Grad-CAM + SHAP 的多方法组合。
- **阿里妈妈广告推荐解释** —— DIN + Attention 可视化 + 业务指标对齐。
- **字节跳动推荐解释** —— Transformer + Attention + 多任务学习的可解释。

---

### 8.9 本章小结

本节收录 **7 道题**，覆盖分类算法的**算法选型（Q1）/ 风控场景（Q2）/ 推荐场景（Q3）/ 不平衡处理（Q4）/ 特征工程（Q5）/ 评估指标（Q6）/ 模型解释（Q7）**七个核心主题，构成一条完整的分类算法知识链：

**算法演进维度**（Q1 + Q3）：从 LR 到 GBDT 到 DeepFM 到 DIN/DIEN 的算法谱系，结合阿里 / 字节 / Meta / Google 的工业实践。

**业务场景维度**（Q2 + Q5）：风控与推荐两大主战场，前者强可解释、后者强精度，对应完全不同的特征工程和评估策略。

**工程挑战维度**（Q4 + Q6）：类别不平衡与评估指标——不是"算法问题"，而是"工程问题"，必须从数据 / 算法 / 指标三层综合治理。

**AI 时代维度**（Q7）：模型解释不再可选，XAI + SHAP + EBM 是 AI 时代分类模型的标配。

参考答题的通用心法：**先说清约束，再说清选项，最后说清取舍**。分类算法领域的所有问题，面试官真正想听的都是"业务约束是什么 → 算法选项有哪些 → 你为什么选这个 → 工程代价是什么"——而不是"哪种模型最好"。

---

### 8.10 返回

- 返回 [Ch2 · 数据科学与算法章节目录](../README.md)
