> 本文件是 **01-ai-data-governance.md** § 8 面试真题集的子主题。完整章节请回到 [index](01-ai-data-governance.md) 或 [§ 8 索引](01-ai-data-governance-section-8-sec8.md)。

### 8.7 §18.8 AI 治理与合规性

> 本主题考察「AI 治理在大数据平台层的具体落地」：可解释性工具集成、差分隐私 / 联邦学习的工程路径、全生命周期模型治理、与《生成式 AI 管理办法》等法规对齐。

#### §18.8.1 面对日益严格的 AI 监管法规（如《生成式人工智能服务管理暂行办法》），大数据平台应该在架构层支撑 AI 治理，包括模型注册、审计、合规报告自动化？

**1. 考察点**

- 是否能区分「AI 治理」与「传统数据治理」的对象差——前者管模型 + 训练数据 + Prompt + 输出；
- 能否说清模型 Registry、审计、合规报告的工程闭环；
- 是否了解《生成式 AI 暂行办法》中「备案 + 内容审核 + 数据来源可追溯」的具体要求；
- 加分项：能与 EU AI Act / NIST AI RMF 三者并列对照。

**2. 参考答案框架**

**第一层：AI 治理的对象分层。** AI 治理的对象是五元组 `<模型, 训练数据, Prompt, 输出, Agent>`——比传统数据治理更宽。五元组各自有不同的治理项：

- **模型**：注册 + 版本 + 评估指标 + Owner；
- **训练数据**：来源、license、PII 标签；
- **Prompt**：版本、Owner、合规审查记录；
- **输出**：审计日志、用户反馈；
- **Agent**：工具权限、行动范围、风险等级。

**第二层：核心架构组件。**

- **AI Asset Registry**：MLflow / Unity Catalog / Weights & Biases → 作为唯一模型注册入口。
- **审计平台**：OpenTelemetry → Kafka → ClickHouse / Arize / Langfuse，作为所有 AI 行为可观测支撑。
- **合规引擎**：OPA / Cedar，把合规规则（EU AI Act / 暂行办法 / NIST RMF）转成可执行代码（policy-as-code）。
- **报告自动化**：Jinja2 / 商业平台，自动按周 / 月 / 季度生成合规报告。
- **告警与响应**：实时检测违规告警 → 自动卡发布。

**第三层：与《生成式 AI 暂行办法》的工程映射。**

- **数据来源可追溯**：训练数据 + 第三方数据集必须记录 license + 来源 + PII 标签——通过 DVC / LakeFS + Catalog 自动采集。
- **内容安全 + 标识**：输出必须可标识（Deepfake 必须标识），AI Gateway 内置输出过滤；
- **安全评估**：模型上线前必经评估——Self-Assessment + Independent Assessment（高风险）。
- **备案**：模型上线前的备案信、文件、版本号、Owner 全部生成。

**第四层：EU AI Act 与 NIST AI RMF 适配。**

- **EU AI Act**：把 AI 系统分风险级（Minimal/Limited/High/Unacceptable），对应部署义务；
- **NIST AI RMF**：把治理动作分 Govern / Map / Measure / Manage；
- **中国信通院《AI 安全标准化白皮书 2024》**：国标体系对接。

**3. 常见陷阱**

- **「只做模型 Registry 不做评估」**——评估是合规要求底线。
- **「没有审计落点」**——审计缺失是后续处罚的最常见理由。
- **「备案信息不全」**——备案时要模型版本 + 训练数据 + 评估结论全闭环。
- **「Prompt 治理缺位」**——生成式 AI 服务的 Prompt 本身就是受审计对象。

**4. 追问预测**

- **「如何自动化合规报告？」** 答：Jinja2 + DB / S3 模板 + 季度定时；输出 PDF + 送达监管。
- **「合规与上线节奏冲突怎么办？」** 答：合规即代码（policy-as-code），CI/CD 强制卡点；新模型上线前必经评估 pipeline。

**5. 参考资料**

- 中国《生成式人工智能服务管理暂行办法》（2023-08）。
- EU AI Act（Regulation 2024/1689）。
- NIST AI RMF 1.0（2023-01）与 Generative AI Profile（NIST AI 600-1, 2024-07）。
- 信通院《AI 安全标准化白皮书 2024》。
- MLflow / Unity Catalog / Weights & Biases 官方文档。
- OpenAI《Preparedness Framework v2》（2024-12）。
- Anthropic《Responsible Scaling Policy v2.1》。
- Anthropic《Constitutional AI》系列论文。
- 阿里 / 字节 / 百度关于「AI 合规自动化」的公开技术分享。
- **蚂蚁集团的大模型备案与自动化合规** —— 在金融大模型上线前走备案 + 评估 + 数据来源可追溯全流程，Policy-as-Code 自动卡点。
- **京东的电商 AI 客服内容审核** —— 用 AI Gateway + 内容过滤满足《生成式 AI 暂行办法》Deepfake 标识与有害信息拦截要求。
- **微医的医疗 AI 内容标识** —— 在辅助问诊、影像诊断场景标识 AI 生成内容，输出侧给出可解释依据并备案。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。其中以「具体企业名 + 结论」形式出现、而本节无法给出可核验文档名与链接的条目，按【经验】档表述，引用时请自行查证；精确链接请按条目名称自行检索核验。

---

#### §18.8.2 请设计一个方案，利用大数据平台的能力，实现对 AI 模型从特征来源、模型训练、部署、上线、退役的全生命周期治理。

**1. 考察点**

- 是否能把 AI 全生命周期拆成可观测、可治理的工程步骤；
- 能否整合湖仓（数据）+ MLOps（训练）+ Langfuse/Arize（推理）+ 退役治理；
- 是否理解「退役」也是治理的一环——保留审计、清理向量索引、删除权重。
- 加分项：能与 NIST AI RMF Manage 阶段对齐。

**2. 参考答案框架**

**第一层：六阶段生命周期。**

```
特征 (Feature) ─► 训练 (Train) ─► 评估 (Eval) ─► 部署 (Deploy) ─► 推理 (Infer) ─► 退役 (Retire)
```

每一阶段都有治理动作。

**第二层：每阶段的治理要点。**

- **特征阶段**：特征数据来源 + PII 标签 + license + version，所有特征进 Feature Store（Feast / Tecton / 阿里 PAI Feature Store）+ Catalog。
- **训练阶段**：训练任务起止时间、计算资源、Hparam、Code 哈希、训练数据 hash、模型 hash——入 MLflow Tracking。
- **评估阶段**：评估数据集 + 指标 + 偏差指标 + 公平性指标——入 Model Registry Model Card。
- **部署阶段**：审批链、版本、运行环境、配置——入 Kubernetes / Seldon / KServe / 商业平台。
- **推理阶段**：推理 trace + 输入 + 输出 + 反馈——入 Langfuse / Arize。
- **退役阶段**：退役审批 + 删除事件 + 评估备份保留期 + 向量索引重建——入退役 Store。

**第三层：统一的数据 / 模型 / 输出 lineage。** 「湖表 + 模型 + 推理 trace」构成一条垂直 lineage，从特征 → 模型 → 输出。任何一节治理缺位，整条链路失去审计支撑。

**第四层：治理的工程动作（贯穿六阶段）。**

- **Owner**：每阶段有 owner，签署 RFC / Change；
- **审批**：跨团队（数据 + 算法 + 合规 + 安全）多签；
- **审计**：每个动作入审计；
- **告警**：失误即自动告警；
- **重放**：可重跑训练 / 评估 / 推理。

**第五层：典型工业参考。**

- **MLflow + Unity Catalog**：Databricks 全栈范式；
- **Kubeflow + Vertex AI Model Registry**：Google / GCP 体系；
- **SageMaker + SageMaker Model Registry + SageMaker Role Manager**：AWS 体系；
- **阿里 PAI**：国内对标的端到端平台。

**3. 常见陷阱**

- **「评估和上线分开管」**——评估不能与上线脱钩。
- **「退役一刀切」**——数据保留期要按合规。
- **「Eval 没有 ground truth」**——上线后效果没对照。

**4. 追问预测**

- **「如何保证模型可复现？」** 答：训练代码 + 数据 hash + 镜像 + Hparam + 环境全记录——并以 MLproject / metaflow 等工具自动记录。
- **「退役后向量怎么办？」** 答：删除；并触发下游使用方重新训练与索引重建。

**5. 参考资料**

- MLflow / Kubeflow / Metaflow 官方文档——AI 生命周期管理的核心工具。
- SageMaker / Vertex AI / Databricks Unity Catalog 商业平台官方文档。
- LinkedIn / Netflix 关于「AI Model Lifecycle Governance」的公开演讲。
- Mitchell et al.《Model Cards》。
- Gebru et al.《Datasheets for Datasets》。
- 阿里 PAI / 字节 PIE 关于「全生命周期治理」的公开技术分享。
- **招商银行的风控模型全生命周期治理** —— 特征 → 训练 → 评估 → 部署 → 推理 → 退役接入 MLflow + DVC，监管要求下审计可重放。
- **美的的工业 AI 模型治理** —— 在工业质检模型上落地特征 Store + Model Card + 退役清权，跨工厂复用同一治理规范。
- **微众银行的信贷模型退役治理** —— 模型退役时保留审计、清理向量索引，并触发下游模型重新训练与索引重建。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。其中以「具体企业名 + 结论」形式出现、而本节无法给出可核验文档名与链接的条目，按【经验】档表述，引用时请自行查证；精确链接请按条目名称自行检索核验。

---

#### §18.8.3 在构建支持模型可解释性的大数据平台时，你会考虑集成哪些工具或框架，并描述其使用场景与权衡。

**1. 考察点**

- 是否能把 XAI 方法分为内在可解释（线性模型 / 决策树）和事后解释（SHAP / LIME）两大类；
- 能否针对 LLM 的可解释需求给出方案（Mechanistic Interpretability / Circuit Tracing）；
- 是否了解「可解释 ≠ 可论证」的区别；
- 加分项：能与监管要求对齐（EU AI Act + 信贷模型场景）。

**2. 参考答案框架**

**第一层：可解释性的两类。**

- **内在可解释（Intrinsic）**：模型本身可解释——线性回归 / 决策树 / 规则系统；
- **事后解释（Post-hoc）**：复杂模型不可解释，必须用 XAI 方法二次解释。

**第二层：主流 XAI 工具与集成要点。**

- **SHAP**：基于 Shapley value，提供全局 / 局部可解释；适合金融风控、信贷；SHAP 与 MLflow / SageMaker / Vertex AI 都可集成；
- **LIME**：局部解释、效果好；但稳定性弱于 SHAP。
- **Anchors / Counterfactual**：基于规则的反事实解释，可信度高；
- **Captum**（PyTorch）/ **Alibi**（开源 XAI 库：黑盒 / 白盒解释器）/ **InterpretML**（Microsoft）：统一 XAI 框架；
- **LLM 的可解释**：Anthropic Circuit Tracing、OpenAI Sparse Autoencoder、DeepMind Tracr——LLM 的「机制可解释」前沿方向；
- **Data / Training Summary**：Training data 卡片、Training Log、Training Snapshot。

**第三层：集成到大数据平台的能力。**

- **Feature Importance 全量解释**：把 SHAP 当作一种「模型可观测」输出，配套 dashboard；
- **Decision Explanation**：信贷 / 风控场景必须——为每一次预测生成可解释档案；
- **Audit**: 每次推理输出 SOP 同存 XAI + trace；
- **A/B 与对比**：新旧模型 SHAP 对照。

**第四层：场景权衡。**

- **信贷 / 风控**：SHAP 全量 + 人工复核。
- **NLP 文本分类**：LIME + 规则解释（关键词）。
- **图像**：Grad-CAM / 显著性图。
- **LLM**：Mechanistic Interpretability；并保留 Prompt + 输出；
- **监管**：监管报送必须包含可解释性材料（EU AI Act, GDPR 第 22 条对自动决策）。

**3. 常见陷阱**

- **「只要 SHAP 就够」**——但 SHAP 不能解释逻辑漏洞。
- **「靠 SHAP 解释 LLM」**——LLM 太复杂，必须 mechanistic + circuit tracing。
- **「可解释性等于信任」**——可解释性可能被人利用。

**4. 追问预测**

- **「LLM 解释有什么前沿方法？」** 答：Circuits（Anthropic）、Sparse Autoencoder（OpenAI / Anthropic）、Tracr（DeepMind）。
- **「如何把 XAI 输出与监管报送对齐？」** 答：定义报告模板，把 SHAP + decision path 输出为 PDF/HTML 报告，与监管系统接口。

**5. 参考资料**

- Lundberg & Lee《A Unified Approach to Interpreting Model Predictions》（NeurIPS 2017）——SHAP 原论文。
- Ribeiro et al.《"Why Should I Trust You?": Explaining the Predictions of Any Classifier》（KDD 2016）——LIME 原论文。
- Mitchell et al.《Model Cards for Model Reporting》（FAT* 2019）。
- Anthropic《Circuit Tracing》（2025-05）——前沿 LLM 可解释方法。
- OpenAI / Anthropic / DeepMind 关于 Mechanistic Interpretability 的公开材料。
- Microsoft《InterpretML》/「Alibi」官方文档。
- **蚂蚁集团的 SHAP 在信贷决策应用** —— 在信贷模型中全量产出 SHAP + 决策路径，作为监管报送与申诉处理材料。
- **微众银行的信贷模型 SHAP 报送** —— 把 SHAP 输出 + 用户特征快照打包报送监管，作为自动决策可解释的合规证据。
- **平安银行的风控模型反事实解释** —— 用 Anchors + 反事实解释给风控拒绝理由 + 改进建议，作为合规与客户体验双闭环。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。其中以「具体企业名 + 结论」形式出现、而本节无法给出可核验文档名与链接的条目，按【经验】档表述，引用时请自行查证；精确链接请按条目名称自行检索核验。

---

#### §18.8.4 请阐述大数据平台如何通过技术手段（例如差分隐私、联邦学习等）来保障特征与模型训练过程中的数据隐私。

**1. 考察点**

- 是否能用一句话区分差分隐私与联邦学习；
- 能否说清两者在大数据平台上的工程落点；
- 是否了解隐私计算 + 大数据栈的整合思路；
- 加分项：能与 PIPL / GDPR 中的「数据最小化」「目的限定」「可解释决策」对应。

**2. 参考答案框架**

**第一层：先区分两个隐私技术。**

- **差分隐私（Differential Privacy, DP）**：在**输出**上加扰动（噪声 / 采样），让任何单条记录无法被反向推断。代表实现：Apple 的 DP、私域 DP-SGD（训练阶段）。
- **联邦学习（Federated Learning, FL）**：在**数据不动**的情况下，让多个参与方协同训练模型；代表性实现：Google FedAvg、FATE、字节 / 蚂蚁的 Federated AI。
- 两者常常组合：联邦 + DP 同用。

**第二层：大数据平台的工程路径。**

- **特征侧**：特征工程 → DP 化（数值特征加噪；类别特征按域聚合）→ 输出 DP 特征；适用于人数聚合、统计报表。
- **训练侧**：训练阶段用 **DP-SGD**：对梯度加 clip + 噪声；OpenMined PySyft / TensorFlow Privacy / Opacus 实现。
- **推理侧**：PII 输入走 PII 检测 + 替换；输出走脱敏；不传不可逆数据。
- **跨组织**：联邦学习 + 安全多方（SMPC）。

**第三层：与平台集成。**

- **平台层**：把 DP / FL 做成「平台算子」——上层用户用 SQL/Python 算子调用；
- **审计**：所有 DP 训练 / 推理全链路上 OpenTelemetry + 审计日志；
- **管理**：DP 训练需要「隐私预算 ε」的总控——避免重复使用导致的隐私泄露。

**第四层：典型工业参考。**

- **Google**：Gboard 输入法用 Federated Learning + DP-SGD 实现「用户输入内容不出端」的训练；这是工业最经典案例。
- **Apple**：收集 Emoji / 健康数据时用 DP；
- **OpenMined**：PySyft 联邦学习框架；
- **FATE（微众银行）**：国内对标的工业级联邦学习框架；
- **阿里 / 蚂蚁**：联邦学习与差分隐私在金融风控的工程实践。

**3. 常见陷阱**

- **「差分隐私就是加噪」**——加噪 + 隐私预算管理才是 DP；
- **「联邦学习解决了所有隐私问题」**——其实梯度泄露也可能反演；需要 + DP + 安全多方；
- **「没有隐私预算管理」**——多次查询可累加泄露，必须做总控；
- **「不同方法互不兼容」**——应做组合而不是二选一。

**4. 追问预测**

- **「DP 训练影响模型多少？」** 答：强隐私预算（ε 小）会带来明显的模型效用损失，幅度随模型规模、任务与数据集差异极大（本节无法给出可溯源的统一数字，按【经验】档处理）。需要在 SOP 内找到平衡点。
- **「联邦学习如何审计？」** 答：通过加密梯度对账 + 模型差异分析；并保留所有参与方的训练数据 hash。

**5. 参考资料**

- Dwork & Roth《The Algorithmic Foundations of Differential Privacy》——DP 理论基石。
- McMahan et al.《Communication-Efficient Learning of Deep Networks from Decentralized Data》（AISTATS 2017）——FedAvg 原始论文。
- Google AI Blog 关于「Federated Learning」的系列文章。
- Apple 关于 Differential Privacy 的公开白皮书。
- OpenMined PySyft / TensorFlow Privacy / Opacus 官方文档。
- FATE（WeBank）官方文档与 GitHub。
- 阿里 / 蚂蚁 / 微众银行公开技术博客。
- **微众银行的 FATE 联邦学习在跨机构风控** —— 用 FATE + 安全多方支持跨行联合反欺诈建模，数据不出域、模型协同训练。
- **蚂蚁集团的联邦学习在大模型预训练** —— 在不聚合原始语料的前提下，让多家机构协同预训练金融大模型，并跑 DP-SGD 做梯度保护。
- **平安好医生的联邦学习在医疗影像** —— 跨医院联合建模影像识别，数据不出院、模型共享，满足医疗数据强合规要求。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。其中以「具体企业名 + 结论」形式出现、而本节无法给出可核验文档名与链接的条目，按【经验】档表述，引用时请自行查证；精确链接请按条目名称自行检索核验。

---

#### §18.8.5 请解释在大数据平台中，数据血缘的基本概念及其在 AI 治理中的主要作用是什么？

**1. 考察点**

- 是否能用一句话定义血缘；
- 是否能区分传统血缘（表 → 表）与 AI 时代的扩展（数据 → 模型 → 输出）；
- 能否说清血缘在 AI 合规、AI Trust、AI 可解释三大场景下的作用；
- 加分项：能与具体监管要求 / 产品诉求对应。

**2. 参考答案框架**

**第一层：基本概念。**

- **血缘（Lineage）**：追踪一个数据对象（表、字段、行、模型、推理输出）从源到汇的全路径；包括产生、变换、消费。
- **形式**：通常是有向无环图（DAG），节点是数据对象，边是转换关系（ETL / SQL / 模型推理）；存储为图数据库 + 数据流元数据。

**第二层：AI 时代的扩展。** 传统血缘只到「表 / 列」。在 AI 场景里血缘必须扩展：

- **数据 → 模型 lineage**：训练数据 hash / Data Sheet 关联到模型；
- **模型 → 输出 lineage**：模型版本 + 训练数据 → 输出；
- **RAG 文档 → 输出**：检索文档 ID 与输出对照；
- **Agent 工具调用 → 输出**：tool call trace。

**第三层：在 AI 治理中的主要作用。**

- **可解释**：决策来自哪条数据 + 哪个模型 + 哪个版本，SHAP / LIME 解释补足；
- **可审计**：监管 / GDPR / PIPL 都要求「自动化决策可追溯」；
- **可重放**：可以根据血缘回放训练 / 推理；
- **风险管理**：训练数据中的 PII / 偏差源头可识别。

**第四层：典型工业参考。**

- **OpenLineage**：开源标准；
- **DataHub**：行级 + 列级 lineage；
- **Apache Atlas**：Hadoop 生态的传统 lineage；
- **Unity Catalog**：Databricks 范式；
- **阿里 / 字节**：湖仓一体的 lineage 工具。

**3. 常见陷阱**

- **「只看表级血缘」**——AI 治理需要字段级 + 行级；
- **「只做静态采集」**——Agent / RAG 实时场景必须 push 模式；
- **「可解释 = 血缘」**——可解释 ≠ 血缘；血缘是解释的「骨架」。

**4. 追问预测**

- **「行级血缘如何落？」** 答：用运行时 instrumentation 记录 row hash；
- **「跨数据源血缘？」** 答：OpenLineage 抽象 + 跨域 schema 映射。

**5. 参考资料**

- OpenLineage / Marquez / Egeria 官方文档。
- DataHub / Unity Catalog 官方文档。
- Apache Atlas 官方文档。
- LinkedIn / Uber / Netflix 关于「Data Lineage 在 AI 治理」的公开演讲。
- Mitchell et al.《Model Cards》；Gebru et al.《Datasheets for Datasets》。
- **蚂蚁集团的 AI 决策链路血缘** —— 把信贷决策从特征 → 模型 → 输出 → 审计拉成完整血缘链，监管侧可一键还原任一决策。
- **微众银行的信贷决策可追溯** —— 用 OpenLineage + DataHub 把模型版本 / 特征快照 / 审批链路完整记录，自动决策透明。
- **京东的推荐系统血缘贯通** —— 在电商推荐链路里把数据 → 特征 → 模型 → 输出做成端到端血缘，A/B 实验可重放。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。其中以「具体企业名 + 结论」形式出现、而本节无法给出可核验文档名与链接的条目，按【经验】档表述，引用时请自行查证；精确链接请按条目名称自行检索核验。

---

#### §18.8.6 在大数据平台支撑的 MLOps 流程中，你认为应如何设计和实现模型版本与数据版本的协同管理，确保每次推理可复现？

**1. 考察点**

- 是否具备「模型 + 数据 + 代码 + 环境 + config 五件套一致性」的工程意识；
- 是否了解 MLflow / Kubeflow / DVC / LakeFS 这类协同工具；
- 能否把「可复现」翻译为可重放 + 可重训 + 可对比。
- 加分项：能与 Feature Store 协同、与 LLM 时代的多 Agent / RAG 推理场景挂钩。

**2. 参考答案框架**

**第一层：定义「可复现」的两个层级。**

- **重放复现**：给定 input + model version，输出可重放；
- **完整复现**：从训练重做一遍，结果一致。

两者对版本管理的要求不同。

**第二层：模型版本与数据版本协同。** 协同管理需要：

- **同一个版本号体系**：MLflow run_id ↔ Data hash ↔ Code commit ↔ Image tag；
- **跨系统引用**：模型 Registry 记录训练数据 DVC tag / LakeFS commit；
- **训练快照（Training Snapshot）**：训练时一次性固化（code + data + image + hparam + 环境）；
- **推理快照（Inference Snapshot）**：推理时记录（model version + prompt version + context）。
- **Schema 与 PII 标签同步**：Catalog 同步触发审计。

**第三层：工具栈。**

- **MLflow**：模型与 run 记录；
- **DVC / LakeFS / Pachyderm**：数据版本；
- **Kubeflow / Metaflow**：工作流；
- **Feast / Tecton**：Feature Store；
- **Pinecone / Milvus + Catalog**：向量索引版本；
- **OpenLineage**：端到端事件；
- **Unity Catalog / SageMaker Role Manager**：跨云治理。

**第四层：LLM 时代的多层版本。** LLM 推理的复现性更复杂：

- **基座模型**：版本 + LoRA adapter；
- **Prompt**：版本 + 工具集合；
- **检索器**：索引版本；
- **Agent**：状态 + 工具 + 记忆；
- **环境**：推理框架版本 / GPU。

每一项都必须参与快照。

**第五层：可复现的工程实践。**

- **包式快照（Bundle）**：把一切打包成可重放的 artifact；
- **端到端追溯**：从推理结果反推回训练；
- **重放平台**：支持一键重放 + 对照；
- **审计**：所有版本写审计。

**3. 常见陷阱**

- **「只管模型版本」**——不管理数据版本；
- **「训练环境不可重现」**——容器镜像 / 随机种子 / 库版本不一致；
- **「RAG 输出不重放」**——检索器索引升级后无法重放历史输出。

**4. 追问预测**

- **「LLM 推理怎么复现？」** 答：基座模型 + LoRA + Prompt + 索引快照 + 工具版本全记录。
- **「什么是 perfect audit？」** 答：所有参与推理的对象全部是 immutable 的 artifact。

**5. 参考资料**

- MLflow / DVC / LakeFS / Pachyderm 官方文档——数据 / 模型版本控制核心工具。
- Kubeflow / Metaflow 官方文档——工作流。
- Feast / Tecton / 阿里 PAI Feature Store 官方文档——特征版本。
- LinkedIn / Netflix / Uber 关于「Reproducible AI」的公开演讲。
- Apache Spark / Ray 关于「Deterministic Replay」的官方文档。
- **招商银行的模型 + 数据 + 特征版本协同** —— 用 MLflow + DVC + Feature Store 三件套对齐 run_id / data hash / feature snapshot，监管可重放。
- **京东的电商推荐系统全链路复现** —— 在推荐场景下从训练数据 hash → 模型权重 → 特征 snapshot → 检索索引全栈版本化。
- **蚂蚁集团的大模型基座 + LoRA 版本管理** —— 在金融大模型中管理基座、LoRA、Prompt、检索索引四层版本，端到端可复现。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。其中以「具体企业名 + 结论」形式出现、而本节无法给出可核验文档名与链接的条目，按【经验】档表述，引用时请自行查证；精确链接请按条目名称自行检索核验。

---
