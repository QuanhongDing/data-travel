# 选型决策框架（Trade-off Frameworks）

> **一句话定位**：性能 / 成本 / 团队匹配度 / 生态 / 可治理性 / 风险——多维权衡而非「拍脑袋」。

> 本文是 data-travel 项目 [Ch13 · 决策与权衡](../../README.md) 的子章节（**02 选型决策框架**）。覆盖 R6 工程能力（决策维度）中「**多准则选型决策**」相关的理论、方法、框架与 AI 时代演进。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 选型时为什么总在「拍脑袋」？ | §1.2 |
| CAP / PACELC 定理怎么用？ | §2.1 |
| 多准则决策怎么量化？ | §3.2 / §3.3 |
| 决策矩阵 / 加权打分怎么做？ | §4 |
| AI 时代选型决策有什么新方法？ | §5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：选型决策框架（Trade-off Frameworks）是一套用于在多个候选方案中做多维权衡的结构化方法。它融合了决策论（Decision Theory）、多准则决策分析（MCDA, Multi-Criteria Decision Analysis）、工程经济学（Engineering Economics），核心是把直觉决策转化为可量化、可追溯、可复用的工程实践。

**工程定义**：在数据架构师手里，选型决策框架是「**让『我觉得』变成『我有数据』**」的方法集，包含三个核心要素：

1. **多维度评估**：性能 / 成本 / 团队匹配度 / 生态 / 可治理性 / 风险——6 个最常用维度。
2. **量化方法**：加权打分、AHP、Cost-Benefit Analysis、PACELC 扩展。
3. **可视化决策**：决策矩阵（Decision Matrix）、雷达图（Radar Chart）、Trade-off Tables。

### 1.2 为什么需要

**业务 / 工程痛点**：

- **「为什么选 Kafka 不选 Pulsar？」——答不上来**——选型依据主观。
- **「CTO 喜欢 Go，所有系统都迁 Java」**——权威偏误（详见 §08）。
- **「6 个团队各选一个消息队列，结果 5 种消息总线」**——缺乏组织级选型框架。
- **「选了一个性能最好的工具，团队不会用，半途而废」**——忽略「团队匹配度」维度。
- **「选了一个便宜的方案，但维护成本是 TCO 的 10 倍」**——只看初始成本，不看 TCO。
- **「拍脑袋选型，3 个月后推翻」**——选型无 ADR 追溯。

**为什么是「资深架构师」核心能力**：

- P5/P6：写代码——关注「代码正确」。
- P7：模块——关注「模块设计合理」。
- P8：系统——关注「系统稳定」。
- **资深架构师 / 准资深架构师：关注「选型可被组织复用、可被未来质疑」——这是选型决策框架的本质**。

### 1.3 在 AI 时代数据架构中的位置

```
       ┌─────── Ch13 · 决策与权衡 ───────┐
       │                                  │
       │  ADR(01) ←── 选型框架(02)        │
       │   ↓           ↓                  │
       │ 自研(03) ←─ 选型框架(02)         │
       │   ↓           ↓                  │
       │ 战略(05) ←── 选型框架(02)        │
       │                                  │
       └──────────────────────────────────┘
                       ↓
            选型框架是「决策的量化工具」
```

**与其他子主题的关系**：

- **ADR（01）**：选型决策框架的输出是 ADR 的 Considered Options + Decision Outcome 字段。
- **自研 vs 采购（03）**：选型框架是自研 vs 采购决策的核心方法。
- **技术战略（05）**：组织级技术雷达 = 组织级选型框架的产物。
- **风险评估（04）**：选型时必须评估每个选项的风险。
- **决策心理学（08）**：选型要对抗锚定 / 确认偏误。

**一句话判断**：**「拍脑袋选型是 P7；用决策矩阵选型是 P8；建立组织级选型框架是资深架构师——选型框架是个人能力升级为组织能力的工具」**。

### 1.4 演进历程

- **1950s-1960s**：Simon 的「有限理性」+「满意即可」理论奠基。
- **1970s-1980s**：Saaty 提出 AHP（层次分析法）；Von Winterfeldt 发展 MCDA。
- **1980s-1990s**：CAP 定理（Eric Brewer 1998-1999）成为分布式系统选型基础。
- **2000s**：Cost-Benefit Analysis 在企业 IT 决策中普及；TOGAF / Zachman 框架推广。
- **2010s**：Tech Radar（ThoughtWorks 2010+）成为组织级选型指南；敏捷决策推动轻量化框架。
- **2014**：AWS Well-Architected Framework 5 根支柱（Operational Excellence / Security / Reliability / Performance Efficiency / Sustainability）成为云架构选型标准。
- **2020-2024**：AI / ML 选型（模型、向量库、Agent 框架）催生新决策维度（幻觉率、合规、成本）。
- **2024-2025**：Decision Intelligence（Gartner 顶级战略技术趋势）；AI 辅助选型。

---

## 2. 核心原理

### 2.1 关键概念定义

- **Trade-off（权衡）**：在多个相互冲突的目标间做取舍（如性能 vs 成本）。
- **CAP Theorem（CAP 定理）**：Brewer 定理——分布式系统不能同时满足 Consistency / Availability / Partition tolerance，只能满足 2/3。
- **PACELC**：CAP 的扩展——若无分区，P 和 C 必须 ACELC（Availability vs Consistency 选择）。
- **Multi-Criteria Decision Analysis（MCDA）**：多准则决策分析。
- **Weighted Scoring Model（加权打分）**：每个维度按权重打分求总分。
- **Decision Matrix（决策矩阵）**：表格化的多准则对比。
- **Cost-Benefit Analysis（CBA）**：成本收益分析——货币化所有收益 / 成本。
- **Total Cost of Ownership（TCO）**：总拥有成本——含初始成本 + 运营成本 + 维护成本 + 培训成本 + 机会成本。
- **AHP（Analytic Hierarchy Process）**：层次分析法——Saaty 提出的多准则权重计算方法。
- **Trade-off Table**：Steve McConnell 提出的权衡表格——把每个 trade-off 显式化。
- **Reversibility（可逆性）**：决策的「可逆成本」（详见 §08）。
- **Tech Radar（技术雷达）**：组织级技术选型指南（ThoughtWorks / Gartner 风格）。
- **Reference Architecture（参考架构）**：组织级架构蓝图（AWS Well-Architected / Google SRE）。
- **Pugh Matrix**：基于「基准选项」的多准则评估方法。
- **TOPSIS**：逼近理想解排序法——选「距离最优解最近、距离最劣解最远」的方案。
- **ELECTRE**：淘汰与选择法——基于「优于关系」的决策方法。
- **Utility Function（效用函数）**：用决策论建模每个选项的「满意度」。
- **Sensitivity Analysis（敏感性分析）**：分析决策结论对权重的敏感性。
- **Scenario Analysis（场景分析）**：构造多种未来场景评估选项。
- **Risk-adjusted Return（风险调整收益）**：考虑风险后的回报。
- **Engineering Trade-off**：工程权衡（性能 vs 成本 vs 复杂度 vs 可维护性）。
- **Architecture Decision Matrix**：架构决策矩阵——多准则加权打分。

### 2.2 数学 / 形式化基础

**CAP 定理**：

```
分布式系统最多满足 C（Consistency）/ A（Availability）/ P（Partition tolerance）中的 2 个。
```

- CA：传统单机数据库（MySQL 主从）。
- CP：牺牲可用性保一致性（ZooKeeper、etcd）。
- AP：牺牲一致性保可用性（Cassandra、DynamoDB）。

**PACELC 扩展**：

```
若无分区（P）：P 与 A、C 无关，需在 A 与 C 间选（ELC）。
若有分区（P）：在 A 与 C 间选（PAC）。
```

→ 即使无分区也要在 A vs C 间选（如 Google Spanner 选 C）。

**加权打分（Weighted Scoring）**：

```
Score_i = Σ w_j × s_{ij}
其中：
- w_j = 第 j 个维度的权重（Σw = 1）
- s_{ij} = 选项 i 在维度 j 的分数（1-5 或 1-10）
- i = 候选选项，j = 评估维度
```

**AHP 层次分析法**：

1. 建立层次结构（目标 → 准则 → 子准则 → 选项）。
2. 两两比较准则，构造判断矩阵。
3. 计算权重向量（特征向量法）。
4. 一致性检验（CR < 0.1）。
5. 计算每个选项的最终得分。

**Cost-Benefit Analysis（CBA）**：

```
NPV = Σ (Benefit_t - Cost_t) / (1 + r)^t
其中 r = 折现率，t = 年份。
选 NPV > 0 且最大的选项。
```

**敏感性分析**：

```
ΔScore_i / Δw_j = s_{ij}
若权重 w_j 微调时 Score_i 变化大 → 决策对 w_j 敏感。
```

### 2.3 关键算法 / 方法

1. **加权打分（Weighted Scoring）**——最常用，简单。
2. **Decision Matrix**——表格化多准则对比。
3. **AHP**——层次分析法（Saaty）。
4. **TOPSIS**——逼近理想解排序法。
5. **Pugh Matrix**——基于基准选项的相对打分。
6. **Cost-Benefit Analysis（CBA）**——货币化所有收益 / 成本。
7. **TCO Analysis**——总拥有成本。
8. **Sensitivity Analysis**——敏感性分析。
9. **Scenario Analysis**——场景分析。
10. **Risk-adjusted Scoring**——风险调整打分。
11. **Trade-off Tables（Steve McConnell）**——显式化所有 trade-off。
12. **CAP / PACELC**——分布式系统选型基础。
13. **AI 辅助选型**——LLM 推荐选项 + 打分。
14. **Decision Intelligence Platform**——选型决策图谱。
15. **Multi-vote / NPV / IRR**——财务选型指标。

### 2.4 与相邻概念的关系

- **选型决策框架 vs ADR**：选型框架是「决策方法」，ADR 是「决策记录」——选型决策的产物是 ADR。
- **选型决策框架 vs 风险评估**：选型评估「哪个选项好」，风险评估「每个选项的风险」。
- **选型决策框架 vs 自研 vs 采购**：自研 vs 采购是选型的特例（make / buy）。
- **选型决策框架 vs 技术战略**：技术战略 = 组织级选型框架的宏观对齐。
- **选型决策框架 vs 架构评审**：架构评审是对已有选型的 review，选型框架是选型过程的方法。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：6 维度加权打分（最常用）**

数据架构选型 6 大维度：

| 维度 | 含义 | 典型权重 |
| --- | --- | --- |
| 性能（Performance） | 吞吐、延迟、可扩展 | 0.20 |
| 成本（Cost） | TCO、ROI、运营成本 | 0.20 |
| 团队匹配度（Team Fit） | 团队熟悉度、学习曲线 | 0.20 |
| 生态（Ecosystem） | 社区、文档、工具链 | 0.15 |
| 可治理性（Governance） | 可观测、可控、合规 | 0.15 |
| 风险（Risk） | 技术风险、供应商风险、合规风险 | 0.10 |

→ 总分 = Σ (权重 × 分数)。分数 1-5。

**模式 2：CAP / PACELC 决策**

分布式存储 / 消息总线选型：

| 场景 | 推荐 | CAP 定位 |
| --- | --- | --- |
| 金融交易 | ZooKeeper / etcd | CP |
| 电商购物车 | Cassandra / DynamoDB | AP |
| 配置中心 | ZooKeeper / etcd | CP |
| 用户画像 | Cassandra | AP |
| 实时推荐 | Redis Cluster | AP（最终一致） |

**模式 3：TCO 3 年 / 5 年计算**

| 成本 | 自研 | 采购 |
| --- | --- | --- |
| 初始开发 / 采购 | 200 万 | 80 万 / 年 |
| 运营（人力 3 人） | 90 万 / 年 × 3 = 270 万 | 0 |
| 培训 | 10 万 | 5 万 / 年 |
| 维护 / 升级 | 50 万 / 年 | 含在采购 |
| 机会成本 | 业务不能用 | 含在采购 |
| **3 年 TCO** | **1,050 万** | **265 万** |

**模式 4：Trade-off Table（Steve McConnell）**

显式化所有 trade-off，避免遗漏：

| 维度 | 选项 A | 选项 B | 选项 C |
| --- | --- | --- | --- |
| 性能 | **9**（最优） | 7 | 6 |
| 成本 | 5 | **8** | 7 |
| 团队 | 7 | **9** | 8 |
| 生态 | **9** | 8 | 6 |
| 治理 | 7 | 8 | **9** |
| 风险 | 6 | 7 | **8** |

→ 加权总分后定选型。

**模式 5：Pugh Matrix**

以「基准选项」为参照，对每个选项打分（+1 / 0 / -1）。

| 维度 | 基准（D） | 选项 A | 选项 B | 选项 C |
| --- | --- | --- | --- | --- |
| 性能 | 0 | +1 | +1 | -1 |
| 成本 | 0 | -1 | +1 | +1 |
| 团队 | 0 | 0 | +1 | 0 |
| 总分 | 0 | 0 | **+3** | 0 |

→ 选项 B 胜出。

**模式 6：AHP（层次分析法）**

详细步骤：

1. 分解目标 → 准则 → 子准则 → 选项。
2. 准则两两比较 → 构造判断矩阵 → 特征向量求权重。
3. 选项两两比较 → 各准则下的相对得分。
4. 加权求总分。
5. 一致性检验（CR < 0.1）。

**模式 7：TOPSIS**

1. 构造决策矩阵。
2. 归一化。
3. 加权归一化。
4. 找理想解（每维度最优）+ 最劣解（每维度最差）。
5. 计算每个选项到最优 / 最劣解的距离。
6. 相对接近度 = 距最劣 / (距最优 + 距最劣)。
→ 选相对接近度最大的选项。

**模式 8：Sensitivity Analysis**

固定其他维度，变化某维度权重，看总分变化：

- 若权重变化 ±20%，决策结论不变 → 决策稳健。
- 若权重变化 ±5%，决策结论翻转 → 决策敏感，需重新评估。

**模式 9：Scenario-based Scoring**

构造 3 个场景（基线 / 乐观 / 悲观），每个选项在每个场景下打分，求期望：

```
E[Score_i] = P_baseline × Score_i_baseline + P_optimistic × Score_i_optimistic + P_pessimistic × Score_i_pessimistic
```

**模式 10：Reference Architecture 对齐**

按 AWS Well-Architected 5 根支柱打分：

- Operational Excellence（运营卓越）
- Security（安全）
- Reliability（可靠性）
- Performance Efficiency（性能效率）
- Cost Optimization（成本优化）
- Sustainability（可持续性，2021+ 新增）

### 3.2 适用场景决策表

| 决策类型 | 推荐方法 | 理由 |
| --- | --- | --- |
| 单团队小决策 | 加权打分 | 简单快速 |
| 跨团队中决策 | Trade-off Table + Sensitivity Analysis | 跨团队对齐 |
| 战略级大决策 | AHP + Scenario Analysis + TCO | 完整 |
| 分布式系统选型 | CAP / PACELC | 定位明确 |
| 自研 vs 采购 | TCO + CBA + NPV | 货币化 |
| AI 模型选型 | 加权打分（含幻觉率 / 成本 / 合规） | 维度齐全 |
| 紧急决策 | Pugh Matrix | 快速 |

### 3.3 反模式与陷阱

1. **「维度遗漏」**：只评估性能 / 成本，忽略治理 / 风险。**至少 5-6 个维度**。
2. **「权重主观」**：权重拍脑袋，无依据。**用 AHP 或多人投票确定权重**。
3. **「分数主观」**：分数拍脑袋。**用客观数据 + 多人独立打分取均值**。
4. **「锚定效应」**：第一个选项被高估。**强制每个选项独立打分**。
5. **「忽视团队匹配度」**：选了团队学不会的技术。**强制权重 ≥ 15%**。
6. **「只看初始成本」**：忽略 TCO。**强制 3 年 TCO 计算**。
7. **「决策不 Sensitivity Analysis」**：权重微调决策翻转。**做敏感性分析**。
8. **「过度优化单一维度」**：性能最优但成本失控。**总分定胜负**。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：识别候选选项**

- 列出至少 3 个候选（抗锚定）。
- 每个选项给出 1-2 句简要描述。

**Step 2：确定评估维度**

- 用 6 维度模型（性能 / 成本 / 团队 / 生态 / 治理 / 风险）。
- 或参考 AWS Well-Architected 5 支柱。
- AI / 数据领域特殊维度：幻觉率、合规、ROI、数据安全。

**Step 3：确定权重**

- 用 AHP 或多人投票确定权重（Σ = 1）。
- 团队投票：每人独立给权重 → 取均值。
- 战略级决策：高管 + 架构师共同投票。

**Step 4：独立打分**

- 每个选项在每个维度独立打分（1-5）。
- 多人独立打分 → 取均值 + 标准差（标准差大 = 共识差）。
- 分数必须有依据（数据 / 案例 / 实验）。

**Step 5：加权求总分 + Sensitivity Analysis**

- 计算每个选项的总分。
- 权重 ±20% 看总分变化。
- 决策稳健：进入 Step 6。
- 决策敏感：回到 Step 3 重新确定权重。

**Step 6：决策 + ADR 归档**

- 选总分最高选项。
- 写 ADR（详见 §1-adr）。
- 包含 Considered Options + Decision Matrix + Sensitivity Analysis。

**Step 7：复盘**

- 半年后回看：决策是否正确？
- 更新 Trade-off Framework 经验库。

### 4.2 关键技术点

1. **决策矩阵模板**：Excel / Google Sheets / Markdown。
2. **AHP 工具**：ahp.online、Expert Choice。
3. **TOPSIS 库**：Python `pyDecision`、R `MCDA`。
4. **TCO 计算工具**：TCO 模板（Excel）。
5. **Sensitivity Analysis 工具**：Excel 数据表、Python。
6. **Tech Radar 工具**：ThoughtWorks Tech Radar（GitHub 开源）、自建。
7. **AI 辅助**：LLM 推荐选项 + 打分。
8. **Decision Intelligence Platform**（2024+）：组织级选型决策图谱。

### 4.3 工具链与平台

**决策矩阵 / 加权打分**：

- **Excel / Google Sheets**——最常用。
- **AHP Online**（ahp.online）——层次分析法工具。
- **Decisions.com**——决策辅助平台。
- **MindTools Decision Matrix**——免费模板。
- **Pugh Matrix 模板**——Excel / Sheets。

**多准则决策库（代码）**：

- **Python `pyDecision`**——AHP / TOPSIS / ELECTRE。
- **Python `scikit-criteria`**——MCDA 库。
- **R `MCDA`**——多准则决策。
- **Julia `JuMCDA.jl`**——MCDA 库。

**Tech Radar / 参考架构**：

- **ThoughtWorks Tech Radar**（开源）——技术雷达标杆。
- **Zalando Tech Radar**——开源。
- **AWS Well-Architected Tool**——云架构选型指南。
- **Google Cloud Architecture Framework**——云架构选型指南。

**TCO / 财务分析**：

- **Excel TCO 模板**——自建。
- **CloudZero / Vantage**——云成本 TCO 工具（2024）。
- **FinOps 工具**（CloudHealth、Apptio）——云财务运营。

**AI 辅助（2024-2025）**：

- **Claude / GPT-4**——选项推荐 + 打分 + 评审。
- **Decision Intelligence Platforms**——DI 平台。
- **AI 辅助决策助手**（Anthropic / OpenAI 企业版）。
- **LangChain / LlamaIndex**——AI 决策自动化。

### 4.4 代码 / 示例

**示例 1：6 维度加权打分**

| 选项 | 性能 (0.2) | 成本 (0.2) | 团队 (0.2) | 生态 (0.15) | 治理 (0.15) | 风险 (0.1) | 总分 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Flink | 9 | 6 | 8 | 9 | 8 | 7 | 7.85 |
| Spark Structured Streaming | 7 | 7 | 9 | 9 | 8 | 8 | 7.85 |
| RisingWave | 8 | 7 | 6 | 6 | 7 | 7 | 6.85 |
| Materialize | 8 | 5 | 6 | 6 | 7 | 7 | 6.55 |

→ Flink 与 Spark 并列，但 Flink 在「性能」上更优（9 vs 7），最终选 Flink。

**示例 2：CAP / PACELC 决策**

```
我们选型消息总线：
- Kafka：AP（最终一致）+ 高吞吐 + 生态丰富
- Pulsar：AP + 存算分离 + 多租户
- RocketMQ：AP + 阿里生态 + 事务消息

业务需求：
- 订单事件（强一致优先）：Pulsar / RocketMQ
- 日志采集（高吞吐优先）：Kafka
- 用户行为（最终一致）：Kafka
→ 按场景混合使用。
```

**示例 3：TCO 3 年计算**

| 成本项 | 自研向量库 | 采购 Pinecone |
| --- | --- | --- |
| 初始开发 | 200 万 | 0 |
| 采购 | 0 | 80 万 / 年 |
| 运营人力（2 人） | 60 万 / 年 | 0 |
| 培训 | 10 万 | 5 万 / 年 |
| 维护 | 50 万 / 年 | 含 |
| **3 年 TCO** | **590 万** | **255 万** |

→ 采购节约 335 万（57%）。但自研有「战略自主 + 定制能力」——需权衡。

**示例 4：AHP 简化版**

```
目标：选型流处理引擎

准则：
- 性能 (P)：权重 0.4
- 团队匹配度 (T)：权重 0.3
- 生态 (E)：权重 0.2
- 风险 (R)：权重 0.1

两两比较（P vs T）：P 略重要（3:1）→ P=0.6, T=0.4 调整
→ 最终权重：P=0.45, T=0.30, E=0.15, R=0.10

各选项打分：
Flink: P=9, T=8, E=9, R=7 → 0.45×9 + 0.30×8 + 0.15×9 + 0.10×7 = 8.50
Spark: P=7, T=9, E=9, R=8 → 0.45×7 + 0.30×9 + 0.15×9 + 0.10×8 = 7.85
→ Flink 胜出。
```

**示例 5：Sensitivity Analysis**

| 性能权重变化 | Flink 总分 | Spark 总分 | 结论 |
| --- | --- | --- | --- |
| 0.20 | 7.85 | 7.85 | 平局 |
| 0.30 | 8.20 | 7.85 | Flink 胜 |
| 0.45 | 8.50 | 7.85 | Flink 胜 |
| 0.60 | 9.00 | 8.20 | Flink 胜 |

→ 性能权重在 0.20-0.60 范围内 Flink 都胜（或平局），决策稳健。

**示例 6：Trade-off Table**

```
技术选型：消息总线
┌──────────────┬────────┬────────┬────────┐
│   维度       │ Kafka  │ Pulsar │RocketMQ│
├──────────────┼────────┼────────┼────────┤
│ 吞吐         │  ★★★★★ │ ★★★★☆ │ ★★★★☆ │
│ 延迟         │  ★★★★☆ │ ★★★★☆ │ ★★★☆☆ │
│ 团队匹配度   │  ★★★★★ │ ★★☆☆☆ │ ★★★☆☆ │
│ 阿里生态     │  ★★★☆☆ │ ★★☆☆☆ │ ★★★★★ │
│ 存算分离     │  ★★☆☆☆ │ ★★★★★ │ ★★☆☆☆ │
│ 多租户       │  ★★☆☆☆ │ ★★★★★ │ ★★★☆☆ │
│ 事务消息     │  ★★★☆☆ │ ★★★☆☆ │ ★★★★★ │
│ 社区活跃度   │  ★★★★★ │ ★★★☆☆ │ ★★☆☆☆ │
└──────────────┴────────┴────────┴────────┘
综合：Kafka（团队 + 生态）vs RocketMQ（生态 + 事务）→ 取决于业务。
```

**示例 7：AI 辅助选型（Python / Claude）**

```python
import anthropic
import os

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def recommend_options(scenario: str, constraints: list[str]) -> str:
    """基于场景 + 约束，让 Claude 推荐候选选项 + 初步评估。"""
    prompt = f"""你是一名资深数据架构师，专注选型决策。

## 场景
{scenario}

## 约束
{chr(10).join(f"- {c}" for c in constraints)}

请推荐 3-5 个候选选项，并按 6 维度（性能 / 成本 / 团队 / 生态 / 治理 / 风险）打分（1-5）。

输出 Markdown 表格 + 推荐意见。"""

    msg = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

# 使用
recommendation = recommend_options(
    scenario="公司要选型一个新的向量数据库，支撑 1 亿条文档的 RAG 检索，要求毫秒级延迟。",
    constraints=["团队有 PostgreSQL 经验", "必须支持中文", "3 个月上线", "总预算 200 万"],
)
print(recommendation)
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

- **AI 辅助选型**：LLM 推荐候选选项 + 初步打分（节省 50% 选型时间）。
- **Decision Intelligence Platform**：选型决策图谱 + AI 助手。
- **AI 辅助 Sensitivity Analysis**：AI 自动识别权重敏感性。
- **AI 辅助 AHP**：AI 帮做两两比较 + 一致性检验。
- **AI 选型 Copilot**：基于历史选型 + ADR 推荐选项。
- **AI 生成 Trade-off Table**：基于场景自动生成多维对比表。
- **AI 选型 Review**：基于组织级 ADR 库 + Tech Radar 做选型 Review。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

- **选型 + RAG**：选型时 RAG 检索历史 ADR + Tech Radar + 案例。
- **选型 + 向量库**：把历史选型文档向量化，相似选型检索 + 复用。
- **选型 + KG**：把选项、维度、ADR、Tech Radar 建成 KG——可推理「类似场景的最佳选项」。
- **选型 + GraphRAG**：跨域选型推理（如「选型 LLM 时同时考虑向量库 / Agent 框架的依赖」）。

### 5.3 学术与工业最新进展（2024-2025）

- **2024**：Gartner 把 Decision Intelligence 列为顶级战略技术趋势。
- **2024**：AWS Well-Architected Framework 加入 Generative AI 视角。
- **2024**：ThoughtWorks Tech Radar 28 期发布（含 GenAI / LLM 选型指南）。
- **2024-2025**：OpenAI / Anthropic / Google 发布企业级 AI 选型助手。
- **2025**：LLM 选型的新维度（幻觉率、合规、成本、上下文窗口）标准化。

### 5.4 未来 3-5 年趋势

- **AI 主导选型决策**：从「人类选 + AI 辅助」到「AI 选 + 人类 Review」。
- **Decision Intelligence 平台化**：组织级选型决策图谱成为基础设施。
- **Trade-off Framework as Code**：用 DSL 表达选型框架，自动化决策。
- **跨域联合选型**：LLM + 向量库 + Agent 框架 + 数据湖 联合决策。
- **可解释选型**：AI 选型可解释（SHAP / LIME）。
- **AI Constitutional 选型**：用「宪法」约束 AI 选型（如「必须开源」「必须支持中文」）。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：Uber 的实时数仓选型**

Uber 在 2018 年选型实时数仓，对比 Flink / Spark Streaming / Kafka Streams：

- 维度：延迟 / 吞吐 / 团队匹配 / 生态 / 治理 / 风险。
- 加权打分：Flink 胜出（性能 + 治理强）。
- 后续：Flink 成为 Uber 实时数仓核心。

**案例 2：字节跳动的多模型路由选型**

字节跳动 2023 年做 LLM 选型，对比 GPT-4 / Claude / 文心 / 通义 / DeepSeek：

- 维度：性能（推理 / 长文 / 代码）/ 成本 / 合规 / 中文能力 / 延迟。
- 加权打分：GPT-4 + Claude + 自研 多模型组合胜出。
- 关键：建立组织级 LLM 选型框架（含幻觉率、合规）。

**案例 3：阿里云的对象存储选型**

阿里云对象存储 OSS 选型时：

- TCO 计算：自研 vs 基于 Ceph 二次开发 vs 采购 NetApp。
- 选自研（Ceph 改造）：战略自主 + TCO 最低。
- 关键：3 年 TCO + 战略自主。

**案例 4：Netflix 的流处理选型**

Netflix 选型 Flink 时：

- 加权打分：Flink 在「容错 / Exactly-Once / 状态管理」上最强。
- 关键：场景驱动（实时推荐 / 反欺诈 / 数据湖入湖）。

### 6.2 踩坑与经验

1. **「拍脑袋打分」**：分数主观无依据。**用客观数据 + 多人独立打分**。
2. **「维度遗漏」**：评估维度太少。**至少 5-6 维度（含风险 / 治理）**。
3. **「权重拍脑袋」**：权重无共识。**用 AHP 或多人投票**。
4. **「忽略 TCO」**：只看初始成本。**强制 3 年 TCO**。
5. **「决策不 Sensitivity」**：权重微调决策翻转。**做敏感性分析**。
6. **「不写 ADR」**：决策无追溯。**强制 ADR 归档**。
7. **「忽视团队匹配度」**：选了团队学不会的技术。**强制团队权重 ≥ 15%**。
8. **「CAP 误用」**：业务强一致却选 AP 系统。**业务驱动 CAP 定位**。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（10 人以下团队）**：

- 6 维度加权打分（Excel）；
- 至少 3 个候选；
- 写 ADR（含 Decision Matrix）。

**1→10（10-50 人）**：

- 引入 Sensitivity Analysis；
- TCO 3 年计算；
- 多人独立打分；
- 组织级 Tech Radar。

**10→100（50+ 人）**：

- AHP 层次分析法；
- Decision Intelligence Platform；
- 跨 BU 选型框架统一；
- AI 辅助选型；
- Decision Graph（决策图谱）。

### 6.4 ROI 评估

**直接收益**：

- 选型决策时间缩短：30-50%；
- 选型正确率提升：40-60%；
- 跨团队选型对齐：50%+；
- 决策可被未来质疑（ADR）。

**间接收益**：

- 减少「拍脑袋」文化；
- 选型经验沉淀（Decision Graph）；
- 组织技术战略对齐。

**成本**：

- 工具成本：低（Excel 已足够）；
- 流程成本：每次选型 +30-60 分钟；
- 培训成本：内部 Workshop。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 拍脑袋 | 加权打分 | AHP | TOPSIS | AI 辅助 |
| --- | --- | --- | --- | --- | --- |
| 易用性 | **5** | 4 | 3 | 3 | 4 |
| 量化程度 | 1 | 4 | **5** | **5** | 4 |
| 共识构建 | 1 | 3 | 4 | 4 | **5** |
| 跨团队适用 | 1 | 3 | 4 | 4 | **5** |
| 适用规模 | 任意 | 小中 | 中大 | 中大 | 任意 |
| AI 友好度 | 1 | 3 | 3 | 3 | **5** |

### 7.2 决策树

```
你需要做选型决策
        │
        ├── 单团队 + 低复杂度？
        │       └── 是 → 加权打分（Excel）
        │
        ├── 跨团队 + 中复杂度？
        │       └── 是 → 加权打分 + Sensitivity + ADR
        │
        ├── 战略级 + 高复杂度？
        │       └── 是 → AHP + Scenario + TCO + AI 辅助
        │
        ├── 分布式系统选型？
        │       └── 是 → CAP / PACELC + 加权打分
        │
        ├── 自研 vs 采购？
        │       └── 是 → TCO + CBA + NPV（详见 §03-build-vs-buy）
        │
        └── 想用 AI 加速？
                └── 是 → LLM 推荐选项 + AI 打分 + AI Review
```

### 7.3 组合使用

- **加权打分 + Sensitivity Analysis**：标准选型。
- **AHP + Trade-off Table**：战略级选型。
- **CAP / PACELC + 加权打分**：分布式系统选型。
- **TCO + CBA + NPV**：自研 vs 采购（详见 §03）。
- **加权打分 + ADR**：选型决策完整闭环。
- **AI 辅助 + 人类 Reviewer**：AI 加速 + 人类把关。
- **Decision Graph + GraphRAG**：组织级选型经验复用。

---

# tradeoff-frameworks 面试真题集

> **一句话定位**：性能 / 成本 / 团队匹配度 / 生态 / 可治理性 / 风险。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 1 个原 PDF 子章节、共 6 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §7.6 | 与数据⽣态的融合及未来趋势 | 7.6.1 ~ 7.6.6（共 6） | 6 | 主 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §7 Hudi/Delta Lake/Iceberg的选型与落地 > 本主题涵盖 1 个子节、6 道题。

#### 2.1.6 与数据⽣态的融合及未来趋势

> 来源：原 PDF §7.6，收录 6 道题。

| 题号 | 难度 |
| --- | :---: |
| §7.6.1 | ★★★☆☆ |
| §7.6.2 | ★★★☆☆ |
| §7.6.3 | ★★★☆☆ |
| §7.6.4 | ★★★☆☆ |
| §7.6.5 | ★★★★☆ |
| §7.6.6 | ★★★★☆ |

- **§7.6.1**：在数据治理⽅⾯，数据湖表格式如何帮助实现数据⾎缘追踪、数据质量监控和元数
- **§7.6.2**：随着数据湖表格式的演进，它们正在与哪些新兴技术或范式（如Lakehouse、AI/
- **§7.6.3**：请对⽐分析Hudi、Delta Lake和Iceberg在事务⼀致性模型、模式演进能⼒以及与
- **§7.6.4**：请简要说明数据湖表格式（如Hudi、Delta Lake、Iceberg）在流批⼀体架构中扮
- **§7.6.5**：在多云或跨云部署环境中，采⽤数据湖表格式会⾯临哪些挑战？请讨论在架构设计
- **§7.6.6**：数据湖表格式如何与数据安全⽅案（例如列级权限控制、数据脱敏、加密）结合，

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **架构演进与未来趋势**

## 4 本章小结

> 本面试真题集收录 6 道题，覆盖 1 个原 PDF 主题、1 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [13-decision 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)