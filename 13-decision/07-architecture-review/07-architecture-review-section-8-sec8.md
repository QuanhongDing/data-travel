> 本文件是 **07-architecture-review.md** 的子文件（§8. 面试真题集）。完整章节请回到 [index](07-architecture-review.md)。

## 8. 面试真题集

> 本节整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）与本系列章节目录衍生的高频面试题，题号沿用章内编号（§X.Y 第 K 题），便于读者回溯。
>
> **每题按五段式作答**：考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料。参考答案优先引用**头部互联网企业 / 学术机构的公开架构实践**（Amazon / Google / Microsoft / Spotify / AWS / SEI / 阿里 / Anthropic 等），便于读者进一步溯源。

### 8.1 全景视图

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §7.1 | 评审方法论与流程 | 7.1.1 ~ 7.1.2 | 2 | 主 |
| §7.2 | 评审清单与反模式 | 7.2.1 ~ 7.2.2 | 2 | 主 |
| §7.3 | AI 时代演进与组织治理 | 7.3.1 ~ 7.3.2 | 2 | 主 |

| 题号 | 难度 |
| --- | :---: |
| §7.1.1 | ★★★★☆ |
| §7.1.2 | ★★★★☆ |
| §7.2.1 | ★★★★☆ |
| §7.2.2 | ★★★☆☆ |
| §7.3.1 | ★★★★★ |
| §7.3.2 | ★★★★☆ |

### 8.2 §7.1 评审方法论与流程

> 本主题考察「评审本身的方法论底座」：ATAM（架构权衡分析法）、轻量评审、Formal Review、Continuous Review 各自的适用边界，以及怎么把抽象方法落到一份高质量 Checklist。面试官通常从一个具体场景出发（如「我们要做一个新数仓架构方案，该怎么评审」），逐层下钻到方法论选型、流程细节与决策机制。

---

#### §7.1.1 在数据架构方案评审中，ATAM、Lightweight Review、Formal Review、Continuous Review 各适用什么场景？请从评审深度、耗时、跨团队对齐能力、决策可执行性四个维度对比，并给出"什么场景下选什么方法"的决策树。

**1. 考察点**

- 是否理解「**评审方法本身也要被评审**」——选错评审方法本身就是最大的反模式。
- 能否说清 ATAM（架构权衡分析法，SEI 2000）的**真正成本**：9 步、≥ 6 小时、多名利益相关方，不是"开个会"就能复用。
- 是否能把「轻量评审」与「无评审」区分开——很多团队名义上做 PR Review，实际仍是单人 Review。
- 加分项：能把 ATAM 的「质量属性效用树」与 AWS Well-Architected 的「六根支柱」放进同一个比较坐标系。

**2. 参考答案框架**

**第一层：四种评审方法的本质差异。**

- **ATAM（Architecture Tradeoff Analysis Method, SEI 2000）**：由 Carnegie Mellon SEI 提出，是一套**结构化、多步骤、跨利益相关方**的方法，完整流程 9 步（介绍方法 → 业务动机 → 架构 → 识别方法 → 生成效用树 → 分析方法 → 头脑风暴场景 → 分析场景 → 总结）。**它不是一次会议，是一次完整的工程仪式**，通常需要 ≥ 6 小时、≥ 5 名利益相关方（业务方、架构师、SRE、QA、安全）。产出物是「**质量属性效用树 + 风险点 + 决策点 + 风险主题**」。核心价值不在"通过/否决"，而在**让所有利益相关方对架构的权衡有共同语言**。
- **Lightweight Review（轻量评审，PR/异步）**：以 Pull Request 为载体，Reviewer 在 PR 上写评论，Author 修改后合并。**优点**：异步、低延迟、可持续；**缺点**：缺乏深度、只覆盖代码层抽象、不覆盖架构权衡。适用于「日常变更 + 局部重构 + Bug Fix」。
- **Formal Review（正式评审会议）**：基于 RFC / Design Doc 的会议评审，5–8 人参与、2 小时左右，产出 ADR（接受 / 修订 / 拒绝 / 推迟）。**优点**：多视角、可决策、可归档；**缺点**：耗时、需要主持人技巧（否则退化为走过场）。适用于「中型变更 + 跨模块改动 + 引入新依赖」。
- **Continuous Review（持续评审）**：把评审嵌入到架构生命周期——设计 Review → 实施 PR Review → 上线 Go-Live Review → 运营 Postmortem Review。**优点**：覆盖全生命周期；**缺点**：流程重、Follow-up 容易掉。适用于「关键系统 + 大型组织 + 高合规要求」。

**第二层：四维度对比表。**

| 维度 | ATAM | Lightweight | Formal | Continuous |
| --- | --- | --- | --- | --- |
| 评审深度 | ★★★★★ | ★★☆☆☆ | ★★★★☆ | ★★★★★ |
| 耗时 | ★☆☆☆☆（6h+） | ★★★★★（异步） | ★★★☆☆（2h） | ★★☆☆☆（持续） |
| 跨团队对齐 | ★★★★★ | ★☆☆☆☆ | ★★★★☆ | ★★★★★ |
| 决策可执行性 | ★★★★☆（无强制力） | ★★★☆☆（依赖 Owner） | ★★★★★（ADR 强约束） | ★★★★☆ |
| 适用频次 | 季度 / 年度 | 每日 | 周 / 双周 | 持续 |

**第三层：决策树（什么场景选什么方法）。**

```
评估方案规模 + 风险 + 跨团队影响
        │
        ├── 日常变更 / Bug Fix / 局部重构
        │       └── Lightweight Review（PR）
        │
        ├── 中型变更 / 引入新依赖 / 跨模块改动
        │       └── Formal Review + ADR
        │
        ├── 战略级架构 / 全新数仓 / 数据中台重构
        │       └── ATAM（含质量属性效用树 + Pre-Mortem）
        │
        ├── 关键系统 / 高合规 / 大型组织
        │       └── Continuous Review（设计 → 实施 → 上线 → 运营全链路）
        │
        └── 云架构 / 多区域部署
                └── AWS / Azure / GCP Well-Architected Review
```

**第四层：工业实践的选型经验。**

- **Amazon 的 Bar Raiser Review**：本质上是「**跨团队的 Formal Review**」——每个重要决策必须有独立于团队的 Bar Raiser Reviewer，且 Reviewer 有权否决团队的决定。适用于中等及以上变更，是 Amazon 文化的标志。
- **Google 的 Design Review**：分 2–3 轮进行（早期方案 + 详细设计 + 实施前最终评审），每轮都有不同角色（架构师 + 安全 + SRE + 业务）。这是 Formal Review 的工业化模板，特点是**多轮而非单轮**，让评审深度可控。
- **Microsoft Azure 的 Architecture Review Board（ARB）**：所有 Azure 上线服务必须经过 ARB，ARB 跨团队（架构师 + 安全 + SRE + PM）。是 Continuous Review 在云厂商的代表。
- **Alibaba 521 架构评审**：大促前 3 个月所有架构变更必须通过评审，Checklist 含 521 项检查点。本质是「**强制 Formal Review + 业务驱动时点**」，适用于业务强驱动的组织。

**3. 常见陷阱**

- **用 ATAM 做小变更。** ATAM 启动成本高，给一个 5 人小团队的 Bug Fix 开 6 小时会议，是组织效率的反模式。
- **把 Lightweight Review 当万能。** 它只覆盖代码层抽象，**架构决策（引入新中间件、切换数据存储）必须 Formal**。
- **Formal Review 走过场。** 没有强制决议、没有 Follow-up 跟踪的会议，等于没开。
- **Continuous Review 沦为流程。** 没有看板、没有闭环率统计，Follow-up Action 永远停在第一行。
- **混用方法名。** 把 ATAM 当作"开几次会"叫 ATAM，是高级背书感最低的回答。

**4. 追问预测**

- **「ATAM 的质量属性效用树具体怎么生成？」** 答：从「业务目标」（如"业务连续""成本可控"）出发向下分解——每个业务目标拆成多个质量属性（高可用、可扩展、安全、性能），再把每个质量属性拆成可度量的场景（可用性 ≥ 99.95%、RTO ≤ 30 分钟）。最后用效用树反向审查架构决策是否回应了每条叶子。
- **「Lightweight Review 如何覆盖架构决策？」** 答：把架构决策显式化——PR 模板强制要求「影响模块」「架构权衡」「替代方案」三栏，Reviewer 按此审查。没有模板的 Lightweight Review 默认只覆盖代码。
- **「Continuous Review 的 Follow-up 闭环率怎么提升？」** 答：① 每条 Action 有 Owner + 截止日期（缺一不可）；② 进入 Jira/Linear 等跟踪系统，每周 Show Progress；③ 季度复盘闭环率（< 70% 的团队降级评审优先级）；④ 把闭环率纳入 Reviewer 的绩效指标。
- **「ATAM 与 AWS Well-Architected 怎么选择？」** 答：ATAM 适合**自建系统**（内部架构），AWS WAR 适合**云上架构**（AWS 资源）。两者底层逻辑一致（质量属性 + 效用树 vs 六根支柱），可以互补使用。

**5. 参考资料**

- SEI（Carnegie Mellon Software Engineering Institute）关于 ATAM 的官方技术报告 CMU/SEI-2000-TR-004《ATAM: Method for Architecture Evaluation》——ATAM 的原始定义与 9 步流程，是本题方法论的权威出处。
- AWS 官方文档《AWS Well-Architected Framework》——六根支柱（Operational Excellence / Security / Reliability / Performance Efficiency / Cost Optimization / Sustainability）与每根支柱的 Design Principles，是云架构评审的标杆。
- Google 的《Software Engineering at Google》第 10 章「Documentation」（含 Design Docs）与第 9 章「Code Review」——多轮 Design Review + CR 流程在 Google 的工业化实践。
- Amazon 关于 Bar Raiser 的公开招聘与文化材料——跨团队 Reviewer 制度的工业范本。
- Michael Nygard《Documenting Architecture Decisions》（ADR 原版博客）——Formal Review 输出物 ADR 的标准模板。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §7.1.2 请设计一份「数据架构方案评审 Checklist」，包含质量属性、业务场景、反模式三类检查项，并说明每类检查项背后的设计原则与落地经验。

**1. 考察点**

- 是否理解 Checklist 是「**评审的标准契约**」——Reviewer 之间、Author 与 Reviewer 之间的对齐基线，不是"打个勾"的表格。
- 能否从「质量属性（性能 / 可用性 / 安全 / 可扩展 / 可维护 / 治理）」「业务场景（性能 / 成本 / 时间）」「反模式（单点 / 过度耦合 / 无降级 / 无监控）」三大维度系统化设计，而不是列一堆空话。
- 是否知道**形式主义 Checklist 是反模式**——Checklist 必须每项有结论（通过 / 修订 / 不通过），否则就是走过场。
- 加分项：能与 AWS Well-Architected 的 6 根支柱对齐，或与 ATAM 的质量属性效用树对应。

**2. 参考答案框架**

**第一层：Checklist 的设计原则——三条铁律。**

1. **每项必须有结论**：通过 / 修订 / 不通过，加上 Reviewer 实名签字。这条铁律杜绝「形式主义 Checklist」——只有结论的 Checklist 才能进入 ADR 引用。
2. **Checklist 必须可裁剪**：按评审类型分层——Lightweight Review 用 5–10 项精简版；Formal Review 用 30–50 项标准版；ATAM 用 100+ 项完整版（含场景树）。**一份 Checklist 走天下**是 Checklist 设计的反模式。
3. **Checklist 必须演进**：每季度 Reviewer 复盘清单有效性——勾了一百次都没出问题的项删除；最近 N 次评审反复发现问题的项升级为强制项。

**第二层：数据架构 Checklist 的完整设计（参考本节配套示例）。**

数据架构评审 Checklist 应分三大类、共 10 个子项：

**A. 质量属性类（必查项）**

| 检查项 | 关键问题 | 通过标准 |
| --- | --- | --- |
| 性能 | QPS 预估、P99 延迟、峰值吞吐是否满足业务？ | 给出压测报告 + 容量预估 |
| 可用性 | SLA 是否 ≥ 99.9%？单点故障（SPOF）？容灾方案？ | SPOF 全列 + 多活 / 双活方案 |
| 安全 | 数据加密（传输 + 存储）、访问控制（RBAC / ABAC）、脱敏（PII）、审计？ | 四个维度全覆盖 |
| 可扩展性 | 水平扩展、自动伸缩、3–5 年容量规划？ | 给定量结论 |
| 可维护性 | 可观测性（监控 / 告警 / 日志）、可治理性（权限 / 审批 / 变更）、可演进性？ | 三项均明确 |
| 成本 | TCO 3–5 年、ROI、资源利用率（CPU / 内存 / 存储）？ | TCO 计算 + ROI 论证 |

**B. 业务场景类（业务相关项）**

| 检查项 | 关键问题 | 通过标准 |
| --- | --- | --- |
| 业务需求覆盖度 | 所有业务场景是否覆盖？ | 列出全部业务场景 + 映射方案 |
| 数据模型正确性 | OneData / 维度 / 知识图谱建模是否正确？ | 建模评审通过 |
| 数据流转可追溯 | ETL / ELT 链路是否端到端可追溯？ | 血缘图完整 |
| 业务时延要求 | 端到端延迟是否满足业务？ | 给出延迟预算分配 |
| 业务连续性 | 业务中断影响范围 + 恢复时长？ | RTO / RPO 明确 |

**C. 反模式类（一票否决项）**

| 检查项 | 反模式 | 检测方法 |
| --- | --- | --- |
| 单点故障 | 关键组件无冗余 | FMEA + Chaos Engineering |
| 过度耦合 | 服务间强耦合 | 依赖图分析 |
| 大泥球 | 单一巨型服务 | 代码静态分析 |
| 烟囱系统 | 重复建设的独立系统 | 数据流分析 |
| 无监控 | 关键路径无监控 | 监控覆盖率（≥ 99% 关键路径） |
| 无降级 | 故障无降级方案 | Chaos 测试 |
| 无审计 | 操作无审计日志 | 安全审计 |
| 无版本管理 | 模型 / Prompt 无版本 | AI Tech Debt 检测 |

**第三层：Checklist 的落地经验——形式主义的反模式与破解。**

- **强制结论模板**：Checklist 每项必须三选一 + 简短理由 + 改进建议；不允许"留空"。这是 Alibaba 521 架构评审的核心要求。
- **分级使用**：
  - 5–10 项精简版（PR 级 Lightweight Review）；
  - 30–50 项标准版（Formal Review）；
  - 100+ 项完整版（ATAM，含效用树）。
- **Checklist 演进机制**：每季度 Reviewer 集体复盘——已无效项删除、反复出问题的项升级为强制项、新出现风险（如 AI 合规）加入。这是 Amazon Bar Raiser 文化里"标准不断校准"的工程化。
- **与 ADR 联动**：Checklist 结论 + Follow-up Action 直接进入 ADR 的「Consequences」段落，未来回溯时 Checklist 是 ADR 的「现场证据」。

**第四层：与公开框架的对应关系。**

- **AWS Well-Architected 6 根支柱**（Operational Excellence / Security / Reliability / Performance Efficiency / Cost Optimization / Sustainability）——可以直接映射到 Checklist 的"质量属性"6 大类。
- **ATAM 质量属性效用树**——可拆解为"业务目标 → 质量属性 → 可度量场景"，对应 Checklist 的"业务场景类"。
- **Azure Well-Architected 5 根支柱**（相较 AWS 略去 Sustainability）——基本同 AWS，适合混合云架构。
- **Google SRE 的 SLO 体系**（SLI / SLO / Error Budget）——可以补充到 Checklist 的"可用性"维度，让 SLA 从"承诺"变成"可度量"。

**3. 常见陷阱**

- **只列缩写不讲师责。** "ODS / DWD / DWS / ADS"这种清单不是 Checklist，是术语表——Checklist 必须问"通过 / 修订 / 不通过"。
- **Checklist 全是"已通过"。** 100% 通过的 Checklist 是走过场的证据；正常 Checklist 应该有 10–30% 需要修订项。
- **没有强制结论栏。** 允许"留空 = 默认通过"等于让 Checklist 自废武功。
- **忽略反模式类。** 只检查正面（做到了什么），不检查反面（违反了什么反模式），等于放过了最致命的架构腐烂。
- **Checklist 几年不更新。** 三年前的 Checklist 检查"是否上云"，今天还在查，缺了"AI 合规""模型版本管理"等新风险。
- **未与 ADR 联动。** Checklist 评完就丢，下次评审重新发现同样问题——这是 Checklist 最大的隐性浪费。

**4. 追问预测**

- **「Checklist 项数太多，Author 不愿意填怎么办？」** 答：分层 + 模板化——5–10 项精简版给 PR 级、30–50 项标准版给中型、100+ 项完整版给战略级；模板内置默认值（如"QPS 预估"自动取上游 QPS × 1.5），Author 只需确认或修改。
- **「Checklist 演进机制怎么落地？」** 答：季度 Reviewer 复盘会议（30 分钟），用「近 N 次评审发现的问题 Top 10」反推 Checklist 缺什么；同时跟踪 Checklist 的「信噪比」——勾选率 ≥ 95% 且无新增信息的项删除，勾选率 < 50% 的项拆分或重写。
- **「AWS WAR 与内部 Checklist 冲突时听谁的？」** 答：以**更严格**的为准——WAR 是行业基线，内部 Checklist 是组织基线，两者交集取最大。差异项作为"组织特有风险"进入 ADR 备注。
- **「Checklist 如何覆盖 AI 系统特有风险？」** 答：增加 AI 专项——模型版本管理、Prompt 版本管理、推理成本上限、幻觉率监控、PII 数据训练隔离、AI RMF 合规。Anthropic 的 Responsible Scaling Policy 提供了 AI 风险的检查项框架。

**5. 参考资料**

- AWS 官方文档《AWS Well-Architected Framework》——6 根支柱 + Design Principles，是云架构 Checklist 的工业标杆。
- Microsoft《Azure Well-Architected Framework》——5 根支柱 + 评估工具，与 AWS WAR 互补。
- Google《Site Reliability Engineering》第 4–6 章——SLI / SLO / Error Budget，让"可用性"从承诺变成可度量，是 Checklist 中可用性条目的工业范本。
- Alibaba《大数据之路：阿里巴巴大数据实践》——OneData 体系下"数据架构评审 Checklist"的国内落地经验，含 521 项检查点的设计思路。
- Anthropic《Responsible Scaling Policy》——AI 系统风险分级与 Checklist 设计，是 AI 时代架构评审新增项的原始参考。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

### 8.3 §7.2 评审清单与反模式

> 本主题考察「评审作为组织机制的硬骨头」：Checklist 是工具，反模式是文化——走过场、一言堂、群体思维、滞后评审等都会让评审沦为流程而非决策机制。面试官通常从一个具体反模式（如"我们团队评审总是没人写意见"）下钻到机制设计与组织文化。

---

#### §7.2.1 在团队规模从 10 人扩展到 100+ 人时，架构评审常见的十大反模式分别是什么？请逐一描述其表现、根因、可观察信号与破解方法。

**1. 考察点**

- 是否理解**反模式不是个人失误，而是组织机制的副产品**——评审走过场不是"Reviewer 不负责"，而是"系统不要求"。
- 能否从「流程层 / 文化层 / 技术层」三维度归类反模式，而不是列十条孤立的现象。
- 是否能给出**可观察信号**——反模式的可怕在于它是"温水煮青蛙"，需要明确信号才能早期发现。
- 加分项：能引用具体企业的反模式教训（如 Amazon、Microsoft、Google 内部复盘的"评审失败案例"）。

**2. 参考答案框架**

**第一层：反模式的归类框架。** 反模式按其根源可分为三层：

- **流程层（Procedure）**：机制设计缺陷——走过场、无人跟进、形式主义 Checklist。
- **文化层（Culture）**：组织心理缺陷——一言堂、群体思维、业务方缺席。
- **技术层（Technology）**：工具与能力缺陷——评审滞后、AI 滥用、标准不一。

**第二层：十大反模式逐一拆解。**

| # | 反模式 | 表现 | 根因 | 可观察信号 | 破解方法 |
| --- | --- | --- | --- | --- | --- |
| 1 | **走过场** | 评审会只是流程，无人真评 | 系统不强制意见 | Checklist 全是"通过"、会议 < 30 分钟 | 强制 Reviewer 写实质意见 + Checklist 强制结论栏 |
| 2 | **一言堂** | 某权威定调，无人挑战 | 决策权未分散 | 评审只有 1 人主导、其他人零异议 | 强制 Devil's Advocate + 匿名投票 + 跨团队 Reviewer |
| 3 | **群体思维** | 评审会无人异议，全员同意 | 文化压抑反对意见 | 100% 通过率、Follow-up 为零 | 强制反对意见 + Pre-Mortem + 红蓝对抗 |
| 4 | **评审标准不一** | 每个 Reviewer 标准不同 | 缺少标准化 Checklist | 同一方案不同 Reviewer 结论相反 | 标准化 Checklist + Reviewer 培训 + 结论模板 |
| 5 | **评审滞后** | 实施到一半才评审 | 流程未前置到 RFC | 评审会议 vs 实施时点倒挂 | 评审前置到 RFC 阶段、未评审不编码 |
| 6 | **无决议** | 讨论多但无决策 | 主持人未推动闭环 | 会议纪要无决议行 | 强制决议（接受 / 修订 / 拒绝）+ ADR 归档 |
| 7 | **无人跟进** | 评审意见无 Follow-up | 缺少跟踪机制 | 半年后没人记得 Action | Follow-up Action 强制 Owner + 截止日期 + Jira 跟踪 |
| 8 | **形式主义 Checklist** | Checklist 走过场 | 允许"留空 = 通过" | Checklist 全勾且无理由 | 强制每项有结论 + 简短理由 + 改进建议 |
| 9 | **业务方缺席** | 纯技术评审，忽略业务 | 流程不强制业务参与 | Reviewer 全是工程师 | 强制业务方 Reviewer + 业务场景映射 |
| 10 | **AI 滥用** | AI 自动通过所有评审 | AI 评估未经校准 | AI 评审通过率 ≥ 99% | AI 辅助 + 人类把关 + AI 评估指标跟踪 |

**第三层：反模式的早期信号——管理仪表盘。**

健康的评审组织应该有一份**反模式监控仪表盘**，监控以下指标：

- **评审通过率**：应在 60–85%——过高（> 90%）说明评审走过场；过低（< 50%）说明评审过于严苛或流程有问题。
- **Checklist 实质意见率**：每项 Reviewer 写了 ≥ 20 字实质意见的比例，应 ≥ 70%。
- **Follow-up 闭环率**：Follow-up Action 在截止日期内完成的比例，应 ≥ 80%。
- **跨团队 Reviewer 占比**：应有 ≥ 30% 的评审有跨团队 Reviewer。
- **Pre-Mortem 实施率**：高风险评审会中实施 Pre-Mortem 的比例。
- **评审到实施间隔**：评审通过到首次提交的间隔天数，应 ≤ 7 天（间隔过长说明评审与实施脱节）。

**第四层：工业界的反模式教训。**

- **Amazon Bar Raiser 反模式**：早期 Amazon 曾因 Bar Raiser 权力过大导致"一言堂"——后期调整为"Bar Raiser 必须给替代方案建议"，把否决权变成建设性否决权。
- **Microsoft "Stack Rank" 反模式**：早期 Microsoft 的强制排名制度导致团队只关注短期产出，评审退化为"打绩效"工具——后期调整为 OKR + 反馈机制。
- **Google "Design Doc Bloat" 反模式**：Google 早期 Design Doc 越长越好，导致 Reviewer 不读——后期强制要求 1 页 TL;DR + 链接到详细附录。
- **Meta 的"快速推进"反模式**：Meta 著名的"Move Fast"文化曾导致评审跳过——后期引入"Move Fast with Stable Infra"原则，把评审嵌入到基础设施变更的强制流程。

**3. 常见陷阱**

- **把反模式归因为个人失误。** "Reviewer 不负责""Author 不认真"——这种归因无解，因为机制问题永远不能靠个人英雄主义解决。
- **只列反模式不给破解方法。** 反模式清单是"诊断"，破解方法是"治疗"——只答前者是常见丢分项。
- **缺少可观察信号。** 反模式的最大问题是"难以被识别"——必须给出量化信号。
- **忽略文化层反模式。** 流程层反模式好解（标准化 Checklist），文化层反模式（群体思维、一言堂）需要组织变革，难度高一个数量级。
- **把 AI 滥用当未来风险。** 2024–2025 年 AI 辅助评审已经普及，AI 滥用是当前正在发生的反模式，不是未来风险。

**4. 追问预测**

- **「评审通过率 100% 一定是走过场吗？」** 答：不一定——如果是"经预审后提交正式评审"的流程，100% 通过可能说明预审机制有效。但**没有预审就直接 100% 通过**就是反模式信号。
- **「群体思维怎么破？」** 答：引入"Devil's Advocate"角色——每次评审指定一人专门提出反对意见；同时引入"匿名投票"+ 外部 Reviewer 视角。
- **「AI 评审如何防止滥用？」** 答：① AI 评审必须有"通过率"监控（异常高/低都要调查）；② AI 评审结论必须有引用（必须能追溯到 Checklist 哪一项）；③ AI 评审结果**只是建议**，决策权在人类 Reviewer。
- **「评审走过场如何早期识别？」** 答：监控"实质意见率"——每项 Reviewer 写 ≥ 20 字意见的比例 < 50% 即可预警；同时监控"评审会议时长 vs 议程项数"——平均每项 < 5 分钟的评审会大概率走过场。
- **「跨团队评审如何避免'甩锅式评审'？」** 答：跨团队 Reviewer 必须**给出可执行的替代方案**——只说"不行"不算评审完成，必须给出"建议怎么改"或"建议用什么方案"。

**5. 参考资料**

- SEI / Carnegie Mellon 关于 Architecture Review 的多个技术报告（含 ATAM 的失败案例复盘）——反模式识别的方法论权威出处。
- Google《Software Engineering at Google》第 22 章「Large-Scale Changes」——多团队变更的评审反模式与破解。
- Microsoft 关于 Azure ARB 内部实践的公开分享——大型组织评审治理的真实挑战。
- Amazon 关于 Bar Raiser 文化的公开材料——跨团队 Reviewer 制度的演进与调整。
- Nicole Forsgren 等《Accelerate: The Science of Lean Software and DevOps》——DevOps 性能指标与评审通过率的关联研究。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §7.2.2 架构评审如何从"团队级"演进到"组织级"？Architecture Review Board（ARB）的组成、运作机制与失败模式分别是什么？

**1. 考察点**

- 是否理解**组织级评审治理是规模驱动的产物**——10 人团队不需要 ARB，500 人团队必须有 ARB。
- 能否说清 ARB 的**核心功能**：跨团队对齐 + 标准统一 + 决策升级路径 + 知识沉淀。
- 是否知道 ARB 的**典型失败模式**——演变成"橡皮图章"或"权力斗争场"。
- 加分项：能给出 Spotify 的 Backstage / Google Design Review / Amazon Bar Raiser 在 ARB 角色上的具体差异。

**2. 参考答案框架**

**第一层：组织级评审治理的规模拐点。**

不是所有组织都需要 ARB。规模拐点大致如下：

- **< 20 人**：Lightweight Review + 1–2 名资深架构师把关即可。
- **20–100 人**：Formal Review + 月度 Architecture Sync（架构师例会）+ ADR 归档。
- **100–500 人**：**成立 ARB**（5–10 人，月度 / 双周）+ Tech Radar + 跨团队 Reviewer 池。
- **> 500 人**：ARB + 多层（领域 ARB + 全组织 ARB）+ AI 辅助评审 + 评审历史知识图谱化。

**第二层：ARB 的标准组成。**

典型的 ARB 由 5–10 人组成，包含**强制角色 + 浮动角色**：

- **强制角色**：① 资深架构师（2–3 名，覆盖不同领域如数据 / 应用 / 基础设施）；② 安全代表（Security Champion）；③ SRE / 运维代表；④ 业务 / PM 代表。
- **浮动角色**：① 合规（金融、医疗等强合规行业必须）；② 数据治理代表（涉及数据中台时）；③ AI / ML 代表（涉及 AI 系统时）；④ 法务（涉及重大商业决策时）。

**第三层：ARB 的运作机制。**

**A. 会议节奏**

- **月度 / 双周 ARB 例会**：评审本月 / 双周提交的重大方案（RFC / Design Doc）。
- **紧急评审通道**：对线上事故修复、关键路径变更开辟绿色通道，2 个工作日内必须决策。
- **季度架构健康度评审**：回顾过去季度的 Follow-up 闭环率、反模式信号、组织级技术债。

**B. 决策机制**

- **多数决 + 一票否决**：常规决议多数通过；安全 / 合规有一票否决权（仅限其领域）。
- **决策升级路径**：ARB 内部无法决议时升级到 CTO / VP 级；ARB 有建议权但无强制实施权（除非组织授权）。
- **ADR 强制归档**：所有决议必须有 ADR，ADR 进入组织级知识库（Confluence / Notion / Backstage）。

**C. 输入物**：RFC / Design Doc（必填）、评审 Checklist 完整结论（必填）、Pre-Mortem 输出（高风险方案必填）、成本估算（涉及预算的方案必填）。

**D. 输出物**：决议（接受 / 修订 / 拒绝 / 推迟）、ADR（归档到组织知识库）、Follow-up Action（进入跟踪系统，Owner + 截止日期）、Tech Radar 条目（影响组织级技术选型的决议进入 Tech Radar）。

**第四层：ARB 的典型失败模式与破解。**

- **失败模式 1：橡皮图章（Rubber Stamp）**——ARB 走过场，每条方案都"通过"。**破解**：监控通过率（应在 60–85%），过高时强制增加 Devil's Advocate 与跨团队 Reviewer。
- **失败模式 2：权力斗争场**——ARB 变成部门利益博弈，业务代表与架构师对立。**破解**：技术标准主导决议（业务影响但不主导技术决策），引入跨部门外部 Reviewer。
- **失败模式 3：低频决策延迟**——ARB 月度一次，关键变更等不到。**破解**：紧急通道 + 异步预审 + 子委员会授权。
- **失败模式 4：知识孤岛**——ARB 决议不公开、不进入知识库。**破解**：强制 ADR 公开（脱敏后）+ 组织级 Tech Radar 季度发布。
- **失败模式 5：Follow-up 烂尾**——Action 无跟踪、永远待办。**破解**：闭环率指标进入 ARB 自身考核。

**第五层：工业界实践对比。**

- **Amazon Bar Raiser**：本质是"分布式 ARB"——每个团队有独立 Bar Raiser，但 Bar Raiser 跨团队存在，避免团队偏见；Bar Raiser 有独立于团队的否决权。
- **Google Design Review**：嵌入 Design Doc 流程——所有 Design Doc 必须有 ≥ 3 名 Reviewer 签字（含 ≥ 1 名跨团队 Reviewer），重大方案进入"中央评审"。
- **Microsoft Azure ARB**：集中式 ARB——所有 Azure 服务上线必须通过，组织级强制力强，但灵活度低；输出架构白皮书 + 最佳实践。
- **Spotify Backstage + Tech Radar**：组织级 ADR 平台 + 季度 Tech Radar 发布，把 ARB 决议沉淀为可被全公司复用的知识资产。
- **Alibaba 521 架构评审**：业务驱动型 ARB——大促前 3 个月启动，所有架构变更必须通过，Checklist 含 521 项检查点。

**3. 常见陷阱**

- **把 ARB 当作"架构师俱乐部"。** ARB 是治理机制不是社交组织，必须有强制决议权与跟踪闭环。
- **忽略业务代表角色。** 纯技术 ARB 会退化为"工程师自嗨"，必须强制业务代表参与。
- **ARB 决议不公开。** 决议不进入组织知识库，下次评审重新踩坑。
- **强制力过强导致低效。** 每个变更都要过 ARB 会让流程瘫痪，需要分层（团队级 vs 组织级）。
- **AI 时代 ARB 不演进。** AI 系统的评审需要新角色（AI 安全、ML 治理），ARB 组成必须升级。
- **没有退出机制。** 决议无 Supersede 路径，组织级技术债无法清理。

**4. 追问预测**

- **「ARB 与 ADR 的关系？」** 答：ARB 是**决策机制**（开会讨论），ADR 是**决策产物**（书面归档）。ARB 每次决议产出 1 个或多个 ADR，ADR 是组织级知识资产。
- **「ARB 与 Tech Radar 的关系？」** 答：ARB 决议中"涉及组织级技术选型"的部分进入 Tech Radar（如"组织级统一采用 Kafka 替代 RabbitMQ"）。Tech Radar 是 ARB 的对外输出窗口。
- **「跨团队 Reviewer 从哪里来？」** 答：组织级 Reviewer 池——每个团队提名 1–2 名资深工程师进入池子，ARB 评审时从池子中按需抽取；Reviewer 贡献纳入绩效。
- **「ARB 如何与敏捷 / DevOps 兼容？」** 答：分层——PR 级 Lightweight Review 不进 ARB，只有"跨团队 / 高风险 / 高成本"方案进 ARB。敏捷节奏不受影响。
- **「AI 系统的 ARB 应该如何调整？」** 答：增加 AI 安全代表（熟悉 Responsible Scaling Policy）、ML 治理代表（熟悉模型生命周期）、合规代表（熟悉 EU AI Act / 中国生成式 AI 管理办法）。

**5. 参考资料**

- Spotify Engineering 关于 Backstage 与 ADR 平台的公开材料——组织级 ADR 知识库的最佳实践。
- ThoughtWorks 关于 Tech Radar 的公开方法论——Tech Radar 是 ARB 对外输出的标准化格式。
- Google《Software Engineering at Google》第 10 章「Documentation」（含 Design Docs）与第 22 章「Large-Scale Changes」——多团队评审与 ARB 的运作机制。
- Microsoft 关于 Azure Architecture Center 的官方文档——Azure ARB 的工业化实践。
- Amazon 关于 Bar Raiser 文化的公开材料——分布式 ARB 的范本。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

### 8.4 §7.3 AI 时代演进与组织治理

> 本主题考察「AI 时代带来的评审新维度」：LLM 辅助评审、AI 红队对抗、Constitutional AI 等新实践，以及 Pre-Mortem、风险识别等"前置式"评审方法如何与 AI 系统结合。面试官通常从一个 AI 项目风险（如"我们上线了一个 AI 客服，怎么评审"）下钻到 AI 特有风险与新方法。

---

#### §7.3.1 在 AI 系统（特别是大模型 / Agent）架构评审中，AI 辅助评审、Constitutional AI、AI 红队三种新方法如何落地？请对比其原理、适用场景与失败模式。

**1. 考察点**

- 是否理解**AI 系统的架构评审与传统系统不同**——非确定性、概率性失败、持续演化、可解释性差，需要新的评审维度。
- 能否说清三种 AI 新方法的**本质差异**：LLM 评审是"自动化 Checklist"、Constitutional AI 是"AI 自约束"、AI 红队是"对抗性测试"。
- 是否能给出**可落地的工具链与流程**，而非空谈概念。
- 加分项：能引用 Anthropic、OpenAI、Google DeepMind 在 AI 安全与评审上的公开实践。

**2. 参考答案框架**

**第一层：AI 系统评审与传统系统评审的本质差异。**

传统系统的评审聚焦**确定性质量属性**（QPS、延迟、可用率）；AI 系统的评审必须新增**概率性质量属性**：

| 维度 | 传统系统 | AI 系统 |
| --- | --- | --- |
| 正确性 | 可精确验证（单元测试 / 集成测试） | 概率性（准确率、幻觉率） |
| 失败模式 | 可枚举（崩溃、超时、数据错误） | 长尾（边缘案例、对抗输入、概念漂移） |
| 可解释性 | 日志 + Trace | 模型决策路径（且不完整） |
| 可演化性 | 代码重构 | 模型再训练 + 概念漂移检测 |
| 成本 | 算力 + 存储固定 | 推理成本随流量弹性爆炸 |
| 治理 | 代码 Review + ADR | 模型版本 + Prompt 版本 + 数据集版本 |

**第二层：三种 AI 评审方法的对比。**

**A. AI 辅助评审（LLM-assisted Review）**

- **原理**：用 LLM 自动检查 Checklist 完整性、识别常见反模式、生成 Pre-Mortem 风险清单、模拟 Reviewer 评论。
- **适用场景**：① PR 级自动检查；② 大批量方案的初筛；③ 标准化 Checklist 的自动验证。
- **工具链**：GitHub Copilot PR Review、Claude Code Review、Coderabbit / CodiumAI、Anthropic API 自建评审 Agent。
- **失败模式**：① **幻觉**——LLM 编造不存在的"风险"或"最佳实践"；② **过度宽松**——LLM 倾向"通过"以避免冲突；③ **上下文丢失**——长方案超出 LLM 上下文窗口。

**B. Constitutional AI（宪法 AI）**

- **原理**：Anthropic 2022 提出，用一组**显式原则（"宪法"）**约束 AI 系统的行为——评审时让 AI 用"宪法"自检（"我是否违反了'不得泄露 PII'原则？"）。
- **适用场景**：① AI 系统本身的行为约束（输出过滤）；② AI 评审的标准化（让多个 AI Reviewer 用同一套"宪法"评估）。
- **工具链**：Anthropic Claude 的 Constitutional AI 框架、OpenAI 的 Moderation API、自建原则库 + LLM 评估链。
- **失败模式**：① **宪法本身的质量**——原则含糊或冲突时 AI 评估失效；② **过度刚性**——宪法过严导致 AI 拒绝所有"灰色"行为；③ **对抗性绕过**——精心构造的输入绕过宪法检查。

**C. AI 红队（AI Red Team）**

- **原理**：用对抗性测试方法——专门构造能触发 AI 失败模式的输入，验证 AI 的鲁棒性。Anthropic、OpenAI、Google DeepMind 都在内部设有 Red Team。
- **适用场景**：① 上线前的安全评估（Prompt Injection、越狱、PII 泄露）；② 持续监控（生产环境周期性红队测试）；③ 重大变更的回归评估。
- **工具链**：Microsoft PyRIT（Python Risk Identification Toolkit）、Microsoft Counterfit、NVIDIA garak（LLM 漏洞扫描器）、各家云厂商的 AI 安全评估服务。
- **失败模式**：① **覆盖不足**——红队测试只覆盖已知攻击模式，对未知攻击失效；② **过度依赖工具**——自动化红队工具覆盖率有限，必须有人工对抗测试；③ **结果不闭环**——红队发现的问题不进入修复流程。

**第三层：三种方法如何组合——AI 时代评审的工程范式。**

```
评审输入（RFC / Design Doc / 模型变更）
        │
        ├── Layer 1: AI 辅助评审（自动化初筛）
        │     - LLM 检查 Checklist 完整性
        │     - LLM 识别反模式
        │     - LLM 生成 Pre-Mortem 风险清单
        │
        ├── Layer 2: Constitutional AI 自检
        │     - AI 系统用"宪法"自评
        │     - 检查是否违反原则（PII / 公平 / 透明）
        │
        ├── Layer 3: 人类 Reviewer（专家把关）
        │     - 资深架构师 Review
        │     - 安全 / 合规 / 业务 Reviewer
        │
        └── Layer 4: AI 红队（对抗验证）
              - Prompt Injection 测试
              - 越狱测试
              - PII 泄露测试
              - 公平性测试
```

**第四层：工业界实践。**

- **Anthropic 的 Responsible Scaling Policy（RSP）**：把 AI 系统按能力分级（ASL-1 ~ ASL-5），每个级别有对应的红队评估要求，是 AI 红队机制化的工业范本。
- **OpenAI 的 Preparedness Framework**：把 AI 风险评估框架化，包含红队评估、模型评估、能力评估三个维度。
- **Google DeepMind 的 Sparrow 宪章**：用一组显式规则约束模型输出，是 Constitutional AI 在对话系统的工业实现。
- **Microsoft PyRIT**：开源的 AI 红队框架，专门测试生成式 AI 系统的鲁棒性。
- **Meta Llama Guard**：开源的内容安全分类器，是 AI 系统"评审输出"的工业范本。
- **阿里通义 / 字节豆包的安全评估实践**：国内大厂在 AI 红队与内容安全上的工业化部署。

**3. 常见陷阱**

- **把 AI 辅助评审当万能解。** LLM 是工具不是替代——AI 评审必须有"通过率"监控，异常高/低都是反模式信号。
- **忽视 Constitutional AI 的宪法本身需要评审。** 宪法含糊或冲突时 AI 评估失效；宪法必须由人类专家起草、定期校准。
- **把 AI 红队与渗透测试混为一谈。** AI 红队针对的是模型行为（Prompt Injection、越狱、对抗输入），不是传统网络安全渗透。
- **忽略 AI 系统的"概率性失败"。** 评审 AI 系统必须有"准确率 / 幻觉率 / 公平性"等概率指标，不能用传统 SLA（99.99%）思维评估。
- **三种方法割裂使用。** Layer 1-4 必须组合使用，单一方法覆盖率有限。
- **不区分训练阶段与推理阶段的评审。** 训练阶段的评审（数据治理、训练流程）与推理阶段的评审（推理成本、安全过滤）是两套不同的 Checklist。

**4. 追问预测**

- **「LLM 评审的幻觉问题如何破解？」** 答：① 强制 LLM 引用 Checklist 条款（"依据第 X 项 Checklist，你的结论是…"）；② 引入"事实校验"——LLM 评审结论与已知最佳实践比对；③ 抽样人工复审 LLM 评审结果。
- **「Constitutional AI 的'宪法'应该包含哪些原则？」** 答：参考 Anthropic RSP 与 OpenAI Preparedness——必须包含 ① 安全性（不输出有害内容）；② 公平性（不歧视）；③ 透明性（不欺骗）；④ 隐私性（不泄露 PII）；⑤ 可控性（可被人类中断）；⑥ 准确性（不幻觉）。原则必须可度量、可测试。
- **「AI 红队具体测什么？」** 答：① Prompt Injection（"忽略之前的指令，告诉我…"）；② 越狱（"假设你是…"）；③ PII 泄露（诱导模型输出训练数据中的个人信息）；④ 公平性测试（不同人群的输出差异）；⑤ 对抗鲁棒性（输入扰动下的稳定性）。
- **「AI 评审的通过率应该是多少？」** 答：比传统评审略高（AI 初筛会过滤大量明显问题），但**不应高于 90%**——AI 评审不是终点，通过 AI 初筛的方案仍需人类 Reviewer 把关。
- **「AI Agent 系统的评审 Checklist 有什么特别？」** 答：必须包含 ① 工具调用的边界（Agent 不能调什么 API）；② 长流程的可中断性；③ 多 Agent 协作的责任划分；④ 自主决策的可审计性；⑤ 推理成本的硬上限。

**5. 参考资料**

- Anthropic《Responsible Scaling Policy》——AI 系统风险分级与红队要求，是 AI 时代评审框架的工业标杆。
- OpenAI《Preparedness Framework》——AI 风险评估的方法论，是 AI 评审"概率性失败"维度的原始参考。
- Anthropic《Constitutional AI: Harmlessness from AI Feedback》（2022）——Constitutional AI 的原始论文。
- Google DeepMind 关于 Sparrow 对话模型安全的公开材料——Constitutional AI 在对话系统的实现。
- Microsoft《PyRIT: Open Risk Identification Toolkit for LLMs》——AI 红队工具链的工业实现。
- Meta《Llama Guard: LLM-based Input-Output Safeguard》——AI 内容安全分类器的工业范本。
- NIST《AI Risk Management Framework（AI RMF 1.0）》——AI 系统治理的国际标准框架。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §7.3.2 在架构评审中如何系统性地做 Pre-Mortem（前瞻性失败分析）？请说明 Pre-Mortem 的方法、流程、与传统风险评估（FMEA）的差异，以及 AI 时代的演进。

**1. 考察点**

- 是否理解 Pre-Mortem 的**心理学本质**——它通过"假设已失败"绕过群体思维，比传统的"风险评估"更能暴露深层担忧。
- 能否说清 Pre-Mortem 与 FMEA（失效模式分析）的**核心差异**：Pre-Mortem 是"想象未来已失败"，FMEA 是"枚举当前已知失效模式"。
- 是否能在 AI 系统中做 Pre-Mortem——AI 系统的失败模式是"长尾 + 概率性"，传统 Pre-Mortem 框架需要扩展。
- 加分项：能引用 Gary Klein 的原始研究、Anthropic / OpenAI 的 AI Pre-Mortem 实践。

**2. 参考答案框架**

**第一层：Pre-Mortem 的方法本质。**

Pre-Mortem 由 Gary Klein 于 2007 年在《Harvard Business Review》文章《Performing a Project Premortem》中正式提出。其核心方法：

1. **假设方案已失败**：在评审会开始时，先假设"6 个月后这个方案彻底失败"。
2. **独立列举原因**：所有参与者独立（不讨论）写下"我认为失败的最主要原因"。
3. **聚合分析**：把所有人的原因聚类，识别 Top N。
4. **评估可预防性**：对每条原因评估"是否可预防"，可预防的进入方案修订。
5. **修订方案 + 重新评审**：把可预防原因转化为 Follow-up Action，进入 ADR。

**第二层：Pre-Mortem 与传统风险评估（FMEA）的差异。**

| 维度 | Pre-Mortem | FMEA（失效模式分析） |
| --- | --- | --- |
| 时间视角 | 未来（"假设已失败"） | 现在（"当前已知失效模式"） |
| 范围 | 长尾 + 未知风险 | 已知失效模式 |
| 心理学机制 | 绕过群体思维（独立列举） | 群体讨论（易受权威影响） |
| 适用范围 | 创新 / 不确定 / AI 系统 | 成熟 / 重复 / 工业系统 |
| 输出 | Top N 失败原因 | S / O / D 评分（严重度 / 发生率 / 可检测度） |
| 与 ATAM 关系 | Pre-Mortem 可作 ATAM 9 步中的补充步骤 | FMEA 是工业质量管理的独立方法 |

**第三层：Pre-Mortem 在 AI 系统评审中的扩展。**

AI 系统的失败模式有"长尾 + 概率性"特性，传统 Pre-Mortem 框架需要扩展：

- **引入"概率性失败"维度**：传统 Pre-Mortem 列举"已失败的具体原因"，AI 系统需要列举"概率性失败模式"——幻觉率随时间漂移（概念漂移）、推理成本随流量爆炸（成本失控）、模型版本升级引发能力退化（regression）。
- **引入"对抗性失败"维度**：AI 系统特有的对抗攻击——Prompt Injection、越狱（Jailbreak）、数据中毒（Training Data Poisoning）。
- **引入"治理失败"维度**：AI 系统的治理风险——模型未注册到 Model Registry（影子模型）、Prompt 未经审批直接上线、训练数据未审计（PII / 版权）。

**第四层：Pre-Mortem 的工程化流程。**

- **Step 1 准备（30 分钟）**：选定评审范围；选定参与人（5–8 名，含架构师 + 安全 + 业务 + SRE + AI 专家）；选定时间视角（6 / 12 / 24 个月）。
- **Step 2 独立列举（15 分钟）**：每位参与者独立写下"如果方案在 {时间视角} 后失败，我预测的 Top 5 原因"；强制每条 ≥ 50 字（防止敷衍）；工具用 Mentimeter / Slido 等匿名投票。
- **Step 3 聚合聚类（30 分钟）**：主持人聚类，识别 Top N（通常 5–10）；对每条评估"发生概率（1–5）×影响程度（1–5）=风险评分（1–25）"；评分 ≥ 15 为高风险，必须在方案中预防。
- **Step 4 可预防性评估（30 分钟）**：对每条高风险评估"是否可预防"（是 / 部分 / 否）；可预防的转化为方案修订项；不可预防的转化为"接受的风险"或"需要监控的风险"。
- **Step 5 方案修订 + 重新评审（持续）**：所有可预防原因进入 Follow-up Action；高风险修订后必须重新评审；Pre-Mortem 结论进入 ADR 的「Risks and Trade-offs」段落。

**第五层：工业界实践。**

- **Amazon 的 Working Backwards 方法**：在写方案之前先写"虚构的新闻稿"——假设产品已上线，从用户角度描述它。方法论上与 Pre-Mortem 同源（反向思考），但更侧重"成功状态"而非"失败状态"。
- **Google 的 Pre-Mortem 实践**：在 Design Doc Review 中加入 Pre-Mortem 步骤，对高风险方案强制使用。
- **Microsoft Azure 的 Failure Mode Analysis**：Azure ARB 评审中强制做 FMEA，近年向 Pre-Mortem 演进——把"已知失效模式"扩展到"未知风险"。
- **Anthropic 的 RSP 评估**：在 Responsible Scaling Policy 评估中，每个能力级别都要做"Pre-Mortem"——评估"如果这个级别的 AI 失控会怎样"。
- **OpenAI 的 Preparedness 评估**：在模型发布前做"Pre-Mortem"——评估"如果这个模型被滥用会怎样"。

**3. 常见陷阱**

- **Pre-Mortem 沦为形式。** 让参与者"随便列几条"得不到实质输出；必须独立列举 + 强制字数 + 匿名投票。
- **混淆 Pre-Mortem 与 Post-Mortem。** Pre-Mortem 是"事前验尸"（方案实施前），Post-Mortem 是"事后复盘"（事故后）。两者方法论相关但目标不同。
- **忽略 AI 系统特有的对抗性失败。** 只列传统风险（性能 / 可用性），不列 Prompt Injection / 越狱，等于错过了 AI 系统最大的失败模式。
- **不闭环。** Pre-Mortem 列完不进入方案修订，等于浪费一次评审机会。
- **参与人组成不合理。** 全是工程师无业务方，列出的风险偏技术；全是业务方无工程师，列出的风险偏业务。必须多角色。
- **时间视角单一。** 只做 6 个月视角不做 12 个月视角，会错过"长期演化"风险（如技术债、模型能力退化）。

**4. 追问预测**

- **「Pre-Mortem 的最佳参与人数？」** 答：5–8 人——少于 5 人视角不全，多于 8 人协调成本上升。关键角色：架构师 + 安全 + SRE + 业务 + AI 专家（涉及 AI 系统时）。
- **「Pre-Mortem 与 ATAM 的关系？」** 答：Pre-Mortem 可作为 ATAM 的补充步骤——在 ATAM 的"头脑风暴场景"之前先做 Pre-Mortem，能更全面暴露风险。SEI 在 ATAM 的后续版本中已纳入 Pre-Mortem 步骤。
- **「AI 系统的 Pre-Mortem 如何避免'假想风险'？」** 答：① 风险必须可度量（"幻觉率 > 10%"而非"幻觉可能增加"）；② 风险必须有历史先例（"GPT-4 发布后曾出现类似问题"）；③ 风险必须有缓解方案（不能只列风险不给解法）。
- **「Pre-Mortem 结论如何纳入 ADR？」** 答：ADR 增加「Risks and Trade-offs」段落——Top 5 失败原因 + 风险评分 + 可预防性评估 + 缓解措施。ADR 读者未来回溯时能立即看到"我们当时担心什么"。

**5. 参考资料**

- Gary Klein《Performing a Project Premortem》（Harvard Business Review, 2007）——Pre-Mortem 的原始出处。
- Gary Klein《The Power of Intuition》——直觉决策与 Pre-Mortem 心理学的深度论述。
- SEI / Carnegie Mellon 关于 ATAM 及 Pre-Mortem 补充步骤的公开材料——Pre-Mortem 已纳入架构评审流程。
- Amazon 关于 Working Backwards 方法论的公开材料——Pre-Mortem 的"成功版本"。
- Anthropic《Responsible Scaling Policy》——AI 系统 Pre-Mortem 的工业实现。
- OpenAI《Preparedness Framework》——AI 系统 Pre-Mortem 的方法论框架。
- NIST《AI Risk Management Framework（AI RMF 1.0）》——AI 系统风险识别的国际标准。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

### 8.5 本章小结

本节收录 6 道题，覆盖「架构评审」核心能力的三大主题：**评审方法论与流程（§7.1）、评审清单与反模式（§7.2）、AI 时代演进与组织治理（§7.3）**。六道题构成一条完整的下钻链路：**方法论选择（ATAM / Lightweight / Formal） → Checklist 设计（质量属性 + 业务场景 + 反模式） → 反模式识别（走过场 / 一言堂 / 群体思维） → 组织治理（ARB / Bar Raiser） → AI 时代新方法（LLM 辅助 / Constitutional AI / 红队） → Pre-Mortem 与 AI 系统风险识别**。

参考答题的通用心法：**先说清约束（评审场景、规模、风险等级），再说清选项（多种方法的优劣），最后说清取舍（什么场景下选什么方法）**。架构评审这一主题下，面试官真正想听的是「你做过什么级别的评审、用过什么方法、踩过什么坑」，而不是「评审有哪些标准方法」。

**答题常见加分项**：

- 能引用具体企业的真实实践（Amazon Bar Raiser、Google Design Review、Alibaba 521、Spotify Backstage）。
- 能把多个方法放进同一个坐标系（ATAM 效用树 vs AWS Well-Architected 6 支柱 vs Constitutional AI 原则）。
- 能给出**可观察的反模式信号**（通过率、闭环率、实质意见率等量化指标）。
- 能区分**流程层 / 文化层 / 技术层**反模式，并给出不同的破解方法。
- 能把 AI 时代的特殊风险（概率性失败、对抗性失败、治理失败）纳入评审 Checklist。

**答题常见减分项**：

- 只背缩写不讲师责（"ATAM 是 SEI 的方法"——这种回答等于零）。
- 只列方法名不给对比表（评审方法的差异是核心考察点）。
- 忽略反模式（反模式是组织机制的副产品，不是个人失误）。
- 不分场景的统一答案（小变更和大变更用同一套评审方法）。
- 不区分 AI 系统与传统系统（AI 系统需要新的评审维度）。

### 8.6 返回

- 返回 [13-decision 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
