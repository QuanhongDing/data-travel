# AI 数据治理（AI Data Governance）

> **一句话定位**：让 AI 资产（模型 / Prompt / 训练数据 / 输出）像数据资产一样被治理——分级、分类、合规、可审计、可追溯。

> 本文是 data-travel 项目 [Ch8 · AI 治理与安全](../../README.md) 的子章节（01 AI 数据治理）。覆盖核心职责⑥ AI 资产分级保密与防泄露体系 + 加分项（等保 2.0/3.0 合规）核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| AI 数据治理与传统数据治理有何区别 | §1.1、§1.3、§1.5 |
| 模型 / Prompt / 训练数据怎么治理 | §3.1、§4.1 |
| 合规框架 EU AI Act / 暂行办法 / 等保 | §2.3、§5.4 |
| AI 治理与 AI 安全的边界 | §1.2、§7 |
| AI 资产怎么分级分类 | §1.4、§2.1 |
| 怎么落地 AI 治理（0→1→100） | §4.1、§6 落地实践 §6.5「真实落地路径」 |
| 治理与 RAG / 向量库的关系 | §5.3 |
| 真实案例与踩坑 | §6 落地实践 §6.1–§6.4、§6.6 |

> **本章 8 节结构**：§1 概念与定位 → §2 核心原理 → §3 设计模式 → §4 工程实现 → §5 前沿演进 → §6 落地实践 → §7 与其他方法对比 → §8 面试真题集（44 题）。

---

## 1. 概念与定位

### 1.1 是什么

**AI 数据治理（AI Data Governance）** 是把传统数据治理（Data Governance）扩展到 AI 全生命周期——覆盖**训练数据、模型参数、Prompt、Embedding、AI 输出**等所有 AI 资产的分类、权限、合规、审计。它不只是「数据治理 + 模型」的简单拼装，而是一套围绕**模型即资产（Model-as-an-Asset）**、**Prompt 即代码（Prompt-as-Code）**、**输出即产品决策（Output-as-a-Decision）**的新型治理范式。

传统数据治理管的是「表 / 字段 / 指标 / 报表」；AI 数据治理管的是「权重 / Token / 向量 / 决策」。前者有 schema、有结构化定义；后者是非结构化、概率性、上下文敏感的——这是治理对象从「确定性信息系统」到「概率性智能系统」的范式跃迁。

### 1.2 为什么需要

驱动 AI 数据治理出现的四大力量：

- **合规驱动**：EU AI Act（2024-08 生效，分阶段至 2027-08）、中国《生成式人工智能服务管理暂行办法》（2023-08）、美国 EO 14110（2023-10，其后被撤销并由新的行政令替代）、NIST AI RMF 1.0（2023-01）、ISO/IEC 42001（2023-12）、中国等保 2.0/3.0、GDPR / 个保法——多法域同时收紧。
- **风险驱动**：模型幻觉、Prompt 注入、训练数据投毒、模型反演、成员推断、对抗样本——传统安全工具无法防御 AI 新型攻击面。
- **资产化驱动**：模型权重是有价的（GPT-4 / Claude 3 / Gemini Pro 的训练成本数千万到数亿美元），Prompt 模板是公司核心 IP，训练数据集合规即资产——没有治理就无法「入表」。
- **可审计驱动**：监管要求 AI 决策可追溯、可解释、可重放；用户/合作伙伴要求「AI 不是黑盒」。

### 1.3 与传统数据治理的差异

| 维度 | 传统数据治理 | AI 数据治理 |
| --- | --- | --- |
| 资产类型 | 表 / 字段 / 指标 / 报表 | 模型 / Prompt / Embedding / 训练数据 / 输出 |
| 分类 | 数据分类分级（4 级） | 模型分级（机密性 / 完整性 / 可用性 / 可解释性 + 影响域） |
| 合规 | GDPR / 个保法 / HIPAA | EU AI Act / 生成式 AI 管理办法 / 等保 / NIST AI RMF / ISO 42001 |
| 审计 | 数据访问日志 | 模型版本 + 训练数据 + 输入 Prompt + 输出 + 用户反馈全链路 |
| 安全 | 数据脱敏、加密 | Prompt 注入防御 / 输出水印 / 模型加密 / 联邦学习 / 差分隐私 |
| 可解释 | SQL 可解释 | XAI / SHAP / LIME / 决策可追溯 |
| 主体 | DBA + 数据治理团队 | 数据团队 + 算法团队 + 合规团队 + 安全团队 + 法务 |
| 资产边界 | 表/列 schema | 模型权重 + 训练数据集 + Prompt 模板 + 评估数据集 |

### 1.4 AI 资产的 5 个新维度

AI 时代治理对象新增了 5 个传统治理未覆盖的维度，这是 AI 治理难 10 倍的根本原因：

| 维度 | 治理对象 | 治理难点 | 代表工具 |
| --- | --- | --- | --- |
| **模型（Model）** | 权重文件 / Checkpoint / Adapter（LoRA）/ MoE 子模型 | 权重不可读、二进制、海量 | MLflow / Weights & Biases / DVC / Model Registry |
| **Prompt** | 系统提示 / 模板 / 少样本示例 / Tool 描述 | 文本格式、跨团队复制、易泄露 | PromptLayer / LangSmith / Dust / Helicone |
| **Embedding** | 向量索引 / 检索器参数 / 多向量表 | 黑盒相似度、不可直接审计 | Milvus / Qdrant 元数据 + pgvector + 索引快照 |
| **训练数据** | 原始语料 / 清洗后数据 / 合成数据 / RLHF 数据 | 来源杂、版本多、含 PII | DVC / LakeFS / Hugging Face Datasets / 数据合约 |
| **输出（Output）** | 推理结果 / 决策 / Agent 动作 / Tool 调用 | 实时生成、上下文相关 | Langfuse / Helicone / Arize Phoenix / PromptLayer |

### 1.5 AI 资产的 6 大类型详细对比

| AI 资产类型 | 物理形态 | 大小典型量级 | 机密性需求 | 主要风险 |
| --- | --- | --- | --- | --- |
| **基座模型（Foundation Model）** | PyTorch/TF Checkpoint | 10GB–1TB | 高（IP+合规） | 权重泄露、推理投毒 |
| **微调模型（Fine-tuned Model）** | LoRA Adapter / 全参数 | 10MB–50GB | 中-高 | 过拟合、漂移 |
| **Prompt 模板** | 纯文本 / YAML / Jinja | 1KB–100KB | 中（IP） | 泄露、Prompt 注入 |
| **训练数据集** | Parquet / JSONL / TFRecord | 10GB–10TB | 极高（含 PII） | PII 泄露、版权、投毒 |
| **Embedding / 向量索引** | Faiss / Milvus 索引 | 1GB–100GB | 中（反演风险） | 反演攻击、成员推断 |
| **推理输出 / 决策日志** | 结构化日志 / Trace | 实时增长 | 因场景而异 | 隐私泄露、违规内容 |

### 1.6 为什么 AI 时代治理比传统数据治理难 10 倍

| 难度维度 | 传统数据 | AI 数据 | 难度倍率 |
| --- | --- | --- | :---: |
| **可解释性** | SQL 直接可读 | 权重不可读、推理过程黑盒 | ×10 |
| **可重现性** | ETL 确定 | 训练随机、推理采样 | ×5 |
| **资产形态** | 表 schema 稳定 | 模型权重/Prompt/Adapter 持续迭代 | ×3 |
| **合规复杂度** | GDPR/个保法 | 多法域叠加（AI Act + 暂行办法 + 等保 + NIST） | ×5 |
| **攻击面** | SQL 注入、XSS | Prompt 注入、模型反演、成员推断、对抗样本 | ×8 |
| **资产价值** | 单表数据价值有限 | 单一模型价值上亿美元 | ×20 |
| **决策影响** | 报表辅助决策 | 模型直接决策（贷款、医疗） | ×10 |

> 上表的「难度倍率」，以及 §1.4 与本节标题里的「难 10 倍」，都是**量级示意**（本书未核到可引用的量化研究），用途只是指出「哪一类难度被放大得最多」，**不要当成可比较的测量值**——同一张表里最大的一格是 ×20，所以「10 倍」是综述性说法、不是这张表的汇总【经验】。

### 1.7 演进史 4 阶段详解

**阶段 1（2018-2020）：传统数据治理为主**
- 数据治理聚焦结构化数据（表、字段、报表）。
- DAMA-DMBOK 是事实标准。
- 工具：Informatica、Collibra、Alation。
- AI 治理处于萌芽：模型没有正式的「治理」概念，仅靠 MLOps 工具做版本管理。

**阶段 2（2020-2022）：MLOps 加入模型治理**
- 模型治理（Model Governance）独立成型：MLflow、Weights & Biases、Neptune。
- 模型卡片（Model Card, Mitchell et al. 2019）被广泛采用。
- EU《AI 协调计划》（2021）首次提出「可信 AI」治理框架。
- NIST AI RMF 草案发布（2022）。
- 治理重心：模型可复现、训练数据血缘。

**阶段 3（2023-2024）：合规驱动成为刚需**
- 2023-01：NIST AI RMF 1.0 正式发布。
- 2023-07：EU AI Act 草案通过。
- 2023-08：中国《生成式人工智能服务管理暂行办法》生效。
- 2023-10：美国 EO 14110《安全、可靠、可信地开发和使用 AI》。
- 2023-12：ISO/IEC 42001 AI 管理体系标准发布。
- 2024-03：UN AI Advisory Body 报告。
- 2024-08：EU AI Act 正式生效（分阶段实施至 2027-08）。
- 治理重心：合规映射、风险分级、审计可追溯。

**阶段 4（2025+）：AI 资产化 + AI 治理融合**
- 模型权重入财务报表（无形资产 / 数据资产）。
- AI 资产证券化（部分国家已试点）。
- Agent 治理（不是单模型，而是模型+工具+记忆+权限）。
- 全球 AI 治理协调（G7 广岛 AI 进程、UNESCO Recommendation on Ethics of AI）。
- 治理重心：AI 资产估值、跨国合规协同、Agent 可问责。

### 1.8 AI 治理成熟度模型（5 级）

借鉴 CMMI 思路，企业 AI 治理可分为 5 级：

| 级别 | 名称 | 特征 | 治理工具典型 | 风险 |
| :---: | --- | --- | --- | --- |
| **L1 初始级** | 无治理 | 模型裸跑、Prompt 在飞书里、训练数据不存档 | 无 | 极高（合规 / 泄露） |
| **L2 被动级** | 工具化 | MLflow / DVC / 简单审计日志 | 开源工具组合 | 高（合规盲区） |
| **L3 已管理级** | 流程化 | 标准 Model Card、训练数据血缘、Prompt 库、合规映射 | MLflow + Unity Catalog + 自研 Prompt 库 | 中（一致性差） |
| **L4 量化级** | 自动化 | 自动化合规扫描、实时审计、AI 风险评估、KPI 量化 | 商业平台（Collibra AI Governance / OneTrust / 自研） | 低（持续监控） |
| **L5 优化级** | 自适应 | AI 治理自适应策略变更、自动归因、跨国合规自动映射 | 自研 + 商业 + AI for Governance | 极低（持续优化） |

---

## 2. 核心原理

### 2.1 AI 资产分类分级的形式化定义

**定义（AI 资产五元组）**：一个 AI 资产 `A` 是一个五元组：

```
A = ⟨T, C, I, R, X⟩
```

- `T`（Type）：资产类型 ∈ {Model, Prompt, Embedding, TrainingData, Output}
- `C`（Confidentiality）：机密性 ∈ {Public, Internal, Confidential, Secret}
- `I`（Integrity）：完整性 ∈ {Critical, High, Medium, Low}
- `R`（Risk）：风险等级 ∈ {Unacceptable, High, Limited, Minimal}
- `X`（eXplainability）：可解释性 ∈ {WhiteBox, GrayBox, BlackBox}

**分级决策（机密性）**：

```
Level = f(sensitivity(PII), business_impact, regulatory_binding)
```

举例：
- 训练数据含个人健康信息 → Secret
- 内部客服 Prompt → Confidential
- 公开文档 Embedding → Public

**风险等级（EU AI Act 视角）**：

```
Risk = f(use_case, autonomy, scale_of_deployment, vulnerability_of_subject)
```

- Unacceptable：社交评分、实时远程生物识别（执法）、操纵性 AI
- High：招聘、信贷评分、关键基础设施、教育评估、执法辅助、生物识别分类、移民/边境
- Limited：聊天机器人、Deepfake、情感识别（除特定场景外）
- Minimal：AI 增强的电子游戏、垃圾邮件过滤

### 2.2 AI 血缘的形式化（训练数据 → 模型 → 输出）

**数据模型血缘（Data-side Lineage）**：

```
TrainingData = {d1, d2, ..., dn}
  where di = ⟨source, license, version, pii_tags, quality_score⟩
Model = f(TrainingData, Code, Hyperparams, Env)
  = ⟨framework, arch, weights_hash, training_recipe, dataset_hash⟩
```

**模型-输出血缘（Model-side Lineage）**：

```
Output = Model(Prompt, Context, Tools)
  where each output has full provenance:
    - model_version
    - prompt_template_id
    - retrieved_doc_ids (for RAG)
    - tool_call_trace
    - user_id (subject)
    - timestamp
```

**完整血缘图（End-to-End Lineage）**：

```
Source → Cleaning → TrainingData → Checkpoint → Adapter → Deployment
                                                      ↓
                                              Prompt + Context
                                                      ↓
                                            Retrieved Docs (RAG)
                                                      ↓
                                                 Output + Trace
                                                      ↓
                                              User Feedback → Eval
```

### 2.3 AI 合规框架映射表

| 维度 | EU AI Act | NIST AI RMF | ISO/IEC 42001 | 中国《暂行办法》 | 等保 2.0/3.0 |
| --- | --- | --- | --- | --- | --- |
| **性质** | 强制法律 | 自愿框架 | 管理标准 | 强制法规 | 强制法规（现行有效的为等保 2.0） |
| **生效** | 2024-08（分阶段） | 2023-01 | 2023-12 | 2023-08 | 2019（等保 3.0 尚无正式标准号与实施日期） |
| **范围** | AI 系统提供者/部署者 | 所有 AI 利益相关方 | 组织实施 AI 管理的体系 | 提供生成式 AI 服务的组织 | 信息系统运营者 |
| **风险分级** | 4 级（Unacceptable/High/Limited/Minimal） | 4 项功能（Govern/Map/Measure/Manage） | 管理体系（PDCA） | 安全评估 + 内容安全 | 5 级保护 |
| **核心义务** | 风险评估、透明度、人为监督、CE 标记 | 自愿风险治理 | 管理体系认证 | 备案、安全评估、内容审核 | 一个中心、三重防护（安全管理中心 + 安全通信网络 / 安全区域边界 / 安全计算环境） |
| **透明度** | 高（含公开摘要） | 中（治理过程） | 中（体系文档） | 高（服务备案、内容标识） | 中（安全方案） |
| **罚款** | 最高 7% 全球营收 / 3500 万欧元 | 无 | 无（证书失效） | 警告 / 责令整改 / 停业 | 警告 / 罚款 |
| **合规适用** | 欧盟 | 全球（自愿） | 全球（认证） | 中国 | 中国 |

**EU AI Act 时间表**：

| 时间 | 里程碑 |
| --- | --- |
| 2024-08-01 | 正式生效 |
| 2025-02-02 | 禁止性条款适用 |
| 2025-08-02 | GPAI（通用 AI）规则适用 |
| 2026-08-02 | 大部分义务适用 |
| 2027-08-02 | 完全适用（含嵌入式 AI） |

### 2.4 AI 治理成熟度模型（5 级）

参见 §1.8 的 5 级模型。需要强调的是，从 L2 到 L3 是「工具化 → 流程化」的跃迁，关键在于**有没有标准的、可复用的治理流程**；从 L3 到 L4 是「流程化 → 自动化」的跃迁，关键在于**治理动作能否被自动触发**。

### 2.5 与传统数据治理的边界

| 边界问题 | 传统数据治理 | AI 数据治理 |
| --- | --- | --- |
| 谁负责 | CDO + 数据治理委员会 | CDO + CAIO（Chief AI Officer）+ 算法治理委员会 |
| KPI | 数据质量 SLA、资产利用率 | 模型公平性、决策可追溯率、合规覆盖率 |
| 资产估值 | 成本法、收益法 | 训练成本 + 推理价值 + 知识产权 |
| 责任主体 | 法人 | 法人 + 模型责任人（Model Owner）+ 数据控制者 |
| 争议解决 | 数据争议委员会 | 模型争议委员会（含伦理学家、法务） |
| 监管接口 | 数据保护官（DPO） | DPO + AI 合规官（AICO） |

> 💡 **思考锚点**：对你手上一个已上线的模型输出，试着补齐 §2.2 血缘要求的最小集：`model_version`、`prompt_template_id`、`retrieved_doc_ids`、`tool_call_trace` 四项你能给出几项？缺的那几项，在 §2.5 表里正好落在「责任主体」还是「监管接口」那一栏——真出争议时，你打算拿什么复现这一次输出？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](01-ai-data-governance-section-3-sec3.md)
- [§4. 工程实现](01-ai-data-governance-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](01-ai-data-governance-section-5-sec5.md)
- [§6. 落地实践](01-ai-data-governance-section-6-sec6.md)
- [§7. 与其他方法对比](01-ai-data-governance-section-7-sec7.md)
- [§8. 面试真题集](01-ai-data-governance-section-8-sec8.md)
- [§8.2 §1.1 集群安全与权限管理](01-ai-data-governance-section-8-1-1-集群安全与权限管理.md)
- [§8.3 §5.5 大规模集群安全架构设计与优化](01-ai-data-governance-section-8-5-5-大规模集群安全架构设计与优化.md)
- [§8.4 §5.6 安全架构演进与新兴趋势](01-ai-data-governance-section-8-5-6-安全架构演进与新兴趋势.md)
- [§8.5 §11.7 数据治理体系融合与实践](01-ai-data-governance-section-8-11-7-数据治理体系融合与实践.md)
- [§8.6 §11.8 智能数据治理与 AI 应用](01-ai-data-governance-section-8-11-8-智能数据治理与-ai-应用.md)
- [§8.7 §18.8 AI 治理与合规性](01-ai-data-governance-section-8-18-8-ai-治理与合规性.md)
- [§8.8 §21.1 数据治理与智能化元数据管理](01-ai-data-governance-section-8-21-1-数据治理与智能化元数据管理.md)

---
