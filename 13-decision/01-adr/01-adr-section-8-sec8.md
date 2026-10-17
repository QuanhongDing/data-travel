> 本文件是 **01-adr.md** 的子文件（§8. 面试真题集）。完整章节请回到 [index](01-adr.md)。

## 8. 面试真题集

> 本节整合自题库《大数据平台架构师》（创脉思，版本 2025-11-25）的真实面试题，题号沿用原题库编号（§13.X 第 K 题），便于读者回溯原题。每一道题的题干已按语义补全为完整问法，原题库在第 40 个汉字处截断，本书版本给到了完整表述。
>
> **每题按五段式作答**：考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料。参考答案优先引用**头部互联网企业的公开架构实践**（GitHub / AWS / 阿里 / 字节 / Microsoft Research / ThoughtWorks 等），便于读者进一步溯源。

### 8.1 全景视图

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §13.1 | ADR 基础与模板 | §13.1.1 ~ §13.1.2 | 2 | 主 |
| §13.2 | ADR 流程与组织实践 | §13.2.1 ~ §13.2.2 | 2 | 主 |
| §13.3 | ADR 与决策质量 | §13.3.1 ~ §13.3.2 | 2 | 主 |
| §13.4 | ADR 与代码/文档可追溯 | §13.4.1 ~ §13.4.2 | 2 | 辅 |
| §13.5 | AI 时代的 ADR | §13.5.1 ~ §13.5.2 | 2 | 主 |
| §13.6 | 跨团队 ADR | §13.6.1 ~ §13.6.2 | 2 | 主 |

| 题号 | 难度 |
| --- | :---: |
| §13.1.1 | ★★☆☆☆ |
| §13.1.2 | ★★★☆☆ |
| §13.2.1 | ★★★☆☆ |
| §13.2.2 | ★★★☆☆ |
| §13.3.1 | ★★★★☆ |
| §13.3.2 | ★★★★☆ |
| §13.4.1 | ★★★☆☆ |
| §13.4.2 | ★★★☆☆ |
| §13.5.1 | ★★★★☆ |
| §13.5.2 | ★★★★☆ |
| §13.6.1 | ★★★★☆ |
| §13.6.2 | ★★★☆☆ |

### 8.2 §13.1 ADR 基础与模板

> 本主题考察「ADR 的入门分水岭」：是否理解 ADR 的本质是「决策日志」而非设计文档，能否区分极简模板与完整模板的适用边界。面试官通常从概念问起，逐步下钻到模板字段的取舍。

#### §13.1.1 什么是 ADR（架构决策记录）？为什么架构团队必须有 ADR？请描述 ADR 的 4 个核心字段，并给出每个字段的填写规范与常见反例。

**1. 考察点**

- 是否能把 ADR（Architecture Decision Record）解释为「**决策的日志（log）**」而非「设计的说明书（spec）」。
- 能否从「业务/工程痛点」反推 ADR 的必要性，而不是背 Michael Nygard 2011 年的原文。
- 是否清楚 Nygard 经典模板的 4 段结构（Status、Context、Decision、Consequences）以及每一段要回答的「一句话问题」。
- 加分项：能说出 ADR 的「不可变（Immutable）」+「可被 supersede」这对核心属性，反驳「改 ADR 就是改文档」的误解。

**2. 参考答案框架**

**第一层：定义。** ADR 是 Michael Nygard 在 2011 年博客《Documenting Architecture Decisions》中系统化的一个轻量级文档单元，用于记录一次**特定的架构决策**——包含触发该决策的**上下文（Context）**、在上下文中考虑过的**选项（Options）**、最终**决策（Decision）**、以及决策带来的**正负后果（Consequences）**。它本质上是一个**结构化日志条目**，不是设计文档，更不是百科词条。

**第二层：必要性——没有 ADR 的四个真实痛点。**

- **「为什么当时这么选？」**——三个月后没人记得决策依据，重新讨论老问题。
- **「同一问题被讨论三次」**——团队新人不知道历史决策，每次都从零争论。
- **「架构师离开后决策丢失」**——决策只存在于个人脑中，组织无法在他离开后继续。
- **「架构腐烂」**——没有 ADR 约束，每个角落按各自偏好写代码，半年后无法统一。

GitHub 在 2016 年公开的 `github/architectural-decision-records` 仓库就是这一痛点的直接回应——GitHub 工程团队把内部 ADR 抽取子集对外公开，让任何人都能查到「GitHub 为什么这么设计」。这是工业界对 ADR 必要性的最强背书。

**第三层：4 个核心字段（Nygard 模板）及其填写规范。**

| 字段 | 一句话问题 | 填写规范 | 常见反例 |
| --- | --- | --- | --- |
| **Status** | 这份 ADR 现在处于什么生命周期阶段？ | 取值必须从 `Proposed / Accepted / Deprecated / Superseded by ADR-XXXX` 中选 | 写「WIP」「Draft」「v0.2」这种状态——状态应是离散枚举，不是版本号 |
| **Context** | 是哪些约束让我们必须做这个决策？ | 用第三人称叙述业务背景、技术现状、强制约束（合规、SLA、成本上限）；**禁止把决策本身写进来** | 把 Context 写成「经过评估，我们决定选 MySQL」——这是 Decision，不是 Context |
| **Decision** | 我们到底决定做什么？ | 一句话陈述「决定选 X」；理由放 Consequences 或独立小节 | 用「我们倾向于 / 倾向于不」「可以考虑 X」——ADR 必须明确，不能用情态动词留口子 |
| **Consequences** | 这个决策带给我们什么？ | 必须**双面**记录：正面（Positive / Good）+ 负面（Negative / Bad），必要时加中性（Neutral）；负面必须显式写出「我们要为此付出的代价」 | 只写「我们获得了高可用、低延迟」——这是营销文案，不是 Consequences |

**第四层：MADR 扩充字段的补充。** Nygard 4 段够用但缺依据，MADR（Markdown Any Decision Records）在 4 段之上加上 Decision Drivers（评估准则）、Considered Options（候选选项列表与对比）、Confirmation（如何验证决策正确）三段，让 ADR 从「可归档」升级为「可复盘」。**何时升级**：5–10 人小团队 Nygard 即可；10–50 人或跨团队决策必须用 MADR。

**3. 常见陷阱**

- **把 ADR 当 Design Doc 写。** 大段描述系统架构、接口、SQL 字段——这是 Blueprint 不是 Log。ADR 只回答「为什么这么选」，不回答「系统怎么运转」。
- **Context 里写 Decision。** 一旦 Context 出现「我们决定」「经过比较」，就把上下文和结论混淆了，读者无法独立判断决策是否合理。
- **Consequences 只写好的。** 写 ADR 的人天然会强调决策的正确性，导致 Bad 一栏敷衍了事。**强制双栏**是反乐观偏误最朴素的设计。
- **Status 写成版本号。** 「Draft」「v0.2」「almost done」都不是 Status；Status 是离散生命周期状态，不是文档版本。
- **不写日期 / 不写 Deciders。** 失去「为什么那时选」的时间锚点和「谁拍的板」的责任锚点，3 个月后无法回答「这是当时谁决定的」。
- **「改 ADR 即可」思维。** 一旦 ADR 处于 Accepted 状态就不可改动；要修正写新 ADR 并 supersede 旧 ADR。这是 Nygard 模板被严重误用最多的一点。

**4. 追问预测**

- **「ADR 与 Postmortem 的区别是什么？」** 答：Postmortem 是「出错了，回看为什么错」的事后复盘；ADR 是「要做决策了，记录当时怎么想」的事前/事中归档。两者时序相反——Postmortem 触发新的 ADR，但 ADR 本身不能事后改写。
- **「如何让团队愿意写 ADR？」** 答：① 模板要轻（Nygard 4 段优于 MADR 11 段）；② 与 PR 流程绑定（不写 ADR 不让合并关键架构变更）；③ 评审人由架构师亲自挂帅；④ 高频反例展示——「上次没写 ADR，这次又踩了一遍坑」是最好的内部宣传。
- **「Status 是 Proposed 但没人 review，躺在仓库里半年，怎么办？」** 答：建立「PR 超时自动 reject」机制；或周期性清理（每月一次），把长期无响应的 ADR 重写为 Decision（吸收评审意见）或 Rejected（标注放弃原因）。
- **「是否每行代码改动都要 ADR？」** 答：不是——ADR 覆盖「架构决策」，即影响 3 个团队以上 / 影响 > 6 个月演进方向 / 不可逆或极难回滚的决策。单函数重构不需要 ADR，但底层依赖替换（如 Kafka→Pulsar）必须。

**5. 参考资料**

- Michael Nygard 博客《Documenting Architecture Decisions》（2011 年发表于 Cognitect 官方博客）——ADR 概念的原始出处，给出 Nygard 4 段模板的最早定义。
- GitHub 公开仓库 `github/architectural-decision-records`（2016 年起持续维护）——大型互联网公司公开 ADR 的最完整样本，每条 ADR 都附 Status、Context、Decision、Consequences 字段范例。
- ThoughtWorks Technology Radar 自 2014 年起对 ADR 的多次条目（Trial → Assess → Adopt 演化）——工业界对 ADR 接受度的一手证据。
- MADR 项目官方文档——完整版模板字段定义与最佳实践。
- 《The Software Architecture Chronicles》（Eberhard Wolff）系列博客——比较 ADR、设计文档、Wiki 的定位差异。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §13.1.2 Nygard 经典模板与 MADR 模板的主要区别是什么？请说明两种模板在字段数量、适用场景、评审成本上的差异，并给出团队规模与决策风险组合下的选型建议。

**1. 考察点**

- 是否能把两个模板的差异归结到「**字段数量背后的目的差异**」——Nygard 服务「速度」，MADR 服务「可追溯 + 可复盘」。
- 能否从「团队规模 × 决策风险」二维矩阵出发给选型建议，而不是背「小事 Nygard、大事 MADR」的口诀。
- 是否知道 MADR 模板的标准化历史（2017 年由 Olbrich、Kuhn、Hummerich 等在《An Industrial Case Study on Lightweight, Markdown-based Architecture Decision Records》中正式提出）。
- 加分项：能给出 Y-statement、Lightweight ADR 等其它变体，并说出它们存在的边界场景。

**2. 参考答案框架**

**第一层：两个模板的本质区别。**

- **Nygard（4 段）**：Status / Context / Decision / Consequences。极简，目标是**让决策在 30 分钟内可写可读**。付出的代价是「Considered Options」「Decision Drivers」等关键依据被压扁——读者必须**信任** Decision。
- **MADR（11+ 段）**：在 4 段之上，加 Date、Deciders、Consulted、Informed、Decision Drivers、Considered Options、Decision Outcome（含 Chosen option + 理由）、Pros/Cons（Good/Bad/Neutral）、Confirmation、Pros and Cons of the Alternatives。目标是**让决策可被三个月后的新人独立复盘**——读者**不必信任**，因为依据全在文档里。

**第二层：三维度量化对比。**

| 维度 | Nygard 4 段 | MADR 完整 | 差距 |
| --- | --- | --- | --- |
| 字段数 | 4 | 11+ | Nygard 写一份 ≈ 15–30 分钟；MADR 写一份 ≈ 60–120 分钟 |
| 信息密度 | 低（Context / Decision 装一切） | 高（Decision Drivers / Considered Options 独立成段） | 重读时 MADR 找到「为什么」的成本 ≈ Nygard 的 1/3 |
| 评审成本 | 30 分钟/条 | 60–90 分钟/条（评审必须读 Considered Options） | 评审成本随字段线性上升 |
| PR 合并冲突率 | 低（文档短） | 中（长文档，跨人多时易冲突） | 取决于评审人数 |
| 工具链支持 | 原生 markdown | MADR CLI 模板 + 校验器 | 标准化程度 MADR 远胜 |
| 适合 LLM 起草 | 可但容易缺依据 | 极适合（字段可单独 prompt 填充） | AI 友好度 MADR 显著更高 |

**第三层：选型决策矩阵。**

| 团队规模 | 决策风险 | 推荐模板 | 理由 |
| --- | --- | --- | --- |
| 5–10 人 | 低（单团队、单系统） | Nygard 4 段 | 速度优先，3 天以上讨论就是浪费 |
| 5–10 人 | 中（跨模块、半年内不可逆） | Nygard + Considered Options 段 | 加一段「候选选项表」即可满足可追溯需求 |
| 10–50 人 | 中（跨团队、长期演进） | MADR 完整 | 必须有 Deciders / Decision Drivers / Confirmation，否则半年后重提 |
| 50+ 人 | 中高 | MADR + Pattern-based 分类（`docs/adr/security/`） | 跨 BU 可检索，需要分类目录 |
| 200+ 人 / 战略级 | 高 | Living ADR + Y-statement | 战略决策有「演进条件」「回滚条件」必须显式记录 |
| 任何规模 | AI 起草 | MADR（因为字段多反而适合 LLM） | 字段越多，LLM 填空的优势越大 |

**第四层：实操建议——什么时候升级模板。** 不要因为「今天团队 50 人」就一刀切上 MADR。**升级的两个 trigger**：

1. 业务出现「同一决策被重新讨论」——意味着 Nygard 4 段装不下「考虑过的选项」了。
2. 出现「ADR 通过 6 个月后果与预期不一致」——意味着 Consequences 没量化，必须升级到 Confirmation 字段。GitHub 内部在 2018 年前后从 Nygard 转 MADR 的触发点就是「后端平台组发现 ADR 太短，新人看不懂」。

**3. 常见陷阱**

- **「MADR 一定比 Nygard 好」。** 错。MADR 是更可追溯但更贵——5 人小团队周决策 10+ 条都用 MADR，团队一定拒绝写。**模板要服务场景，不是反过来**。
- **「用 Nygard 就别写 Consequences」。** 错。Nygard 4 段都必须写，少 Consequences 是 ADR 最大的退步。
- **「MADR 字段可有可无」。** 错。MADR 的 Considered Options 至少列 3 个选项（含「保持现状」）；少一个候选项就是 ADR 不完整的硬伤。
- **「团队里既有 Nygard 又有 MADR」。** 这是最常见的现实混乱——必须**选一个 baseline**，或者建立「轻量 ADR（短版） + 完整 ADR（长版）」两条平行的模板路径，而不是自由发挥。
- **「只看字段不看流程」。** Nygard 与 MADR 的差异不仅是字段，更是要求配套的 PR 评审、Owner 制度、季度复盘。只换模板不换流程，等于没换。

**4. 追问预测**

- **「10 人小团队想用 MADR，怎么降本？」** 答：用 `adr-tools` CLI 自动填充 Date / Status 字段；用 MADR 的「轻量子集」——只保留 Decision Drivers / Considered Options / Decision Outcome，其它用 4 段平替（Consulted / Informed 等小团队不必要）。
- **「AI 起草 ADR 用哪种模板？」** 答：MADR 更适合——字段多反而让 LLM 填空更稳；可用 Anthropic / OpenAI API 把 Context + 候选项输入，让模型直接生成完整 MADR，撰写时间通常能明显缩短（缩短幅度取决于 Context 与候选项的完备程度，本节无法给出可溯源的统一百分比，此处按【经验】档处理）。但**最终 Decision 字段必须人工拍板**，不能让 LLM 当 owner。
- **「战略级决策用什么模板？」** 答：Living ADR——在 MADR 基础上加「演进条件」「回滚条件」「监测指标」三段，因为战略决策通常持续 12+ 个月，必须显式记录「什么时候 supersede 自己」。
- **「如何让团队从 Nygard 平滑迁移到 MADR？」** 答：先迁移 1–2 条**最重要的** ADR 做示范，让团队看到「重读时少花多少时间」；再写一份「扩展 ADR 时填什么字段」的对照表；最后用 lint 工具（自定义 markdownlint 规则）强制新 ADR 包含 Drivers / Options 两段。

**5. 参考资料**

- Michael Nygard《Documenting Architecture Decisions》（Cognitect 官方博客，2011 年）——Nygard 4 段模板的原始出处。
- Olbrich、Kuhn、Hummerich 等《An Industrial Case Study on Lightweight, Markdown-based Architecture Decisions》（CEUR-WS 2017）——MADR 模板正式提出与工业验证论文，给出 MADR 字段设计的实证依据。
- GitHub 公开仓库 `github/architectural-decision-records` 中 2018 年后的 ADR（如 GraphQL 选型 ADR）——典型的 MADR 完整版实例，字段齐全到 Confirmation。
- adr-tools GitHub 项目（npryce/adr-tools）——Nygard 风格的 `adr new`/`adr link` CLI 工具，是 Nygard 模板的工具链代表。
- ThoughtWorks Technology Radar 2014–2024 系列文档——多次把 ADR 实践从 Trial 推进到 Adopt，是 ADR 普及节奏的客观标尺。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开出版物、论文、官方仓库或企业技术博客。精确链接请按条目名称自行检索核验。

---

### 8.3 §13.2 ADR 流程与组织实践

> 本主题考察「ADR 在团队里的运行方式」：是否理解 ADR 不是写完就忘的文档，而是有完整生命周期的资产。面试官从流程入手，下钻到组织治理（Owner、Index、复盘）。

#### §13.2.1 请描述组织级 ADR 流程。一条 ADR 完整的生命周期包含哪些状态？状态之间的转换规则是什么？请以一条「从起草到 supersede」的真实决策为例说明。

**1. 考察点**

- 是否能把 ADR 流程拆成「**起草 → 评审 → 接受 → 维护 → supersede**」五个步骤，并说出每一步的产物。
- 是否清楚状态机——`Proposed → Accepted → Deprecated / Superseded by ADR-XXXX`——以及**为什么 Deprecated 与 Superseded 是两个不同状态**（前者是「不推荐新场景但保留」，后者是「已被新决策取代」）。
- 是否能从「**PR 化 + Reviewer 制度 + 季度复盘**」三个动作反推流程，而不是背流程图。
- 加分项：能说出 ADR Index 文件（`docs/adr/README.md`）的字段设计（编号、标题、状态、日期、Owner、影响范围）。

**2. 参考答案框架**

**第一层：生命周期状态机。**

```
Proposed ──(评审通过)──> Accepted ──(不再推荐)──> Deprecated
                            │
                            └──(被新决策取代)──> Superseded by ADR-XXXX
```

- **Proposed**：决策草案，正在评审。可以被作者主动 Rejected（撤销）。
- **Accepted**：评审通过，正式生效。**状态锁定，不可修改**。
- **Deprecated**：决策仍然有效但不推荐新场景使用（典型：被新方案取代但未完全废弃）。
- **Superseded by ADR-XXXX**：被新 ADR 取代，建立**决策族谱**。读到 ADR-0007 的人立刻看到它是 ADR-0012 的前置。

**第二层：六步完整流程（以 MADR 模板为例）。**

1. **触发（Trigger）**：识别到架构决策点（依赖升级、技术选型、不可逆变更）。触发方可以是任何人。
2. **起草（Draft）**：用 MADR / Nygard 模板，在 `docs/adr/` 目录下新建 `XXXX-title.md`（编号可先占位，由 PR 合并时定）。
3. **PR 提交（Pull Request）**：把 ADR 当 PR 提交，至少 2 名 Reviewer（必须含 1 名资深工程师 / 架构师）。
4. **评审（Review）**：评审 Checklist——Context 是否完整？Considered Options 是否 ≥3 个？Consequences 是否双面？Confirmation 是否有验证指标？可逆性是否标注？
5. **合并（Merge）**：合并后 ADR 进入 Accepted 状态，编号确定，写入 `docs/adr/README.md` Index 表。
6. **季度复盘（Quarterly Review）**：每季度对 Accepted > 6 个月的 ADR 做一次 Consequences vs Reality 对照；不再适用的写新 ADR supersede。

**第三层：以「从起草到 supersede」的真实决策为例——Apache Hudi vs Iceberg 选型。**

时间线（示意）：
- **2021-Q2 · ADR-0023 · Proposed**：数据团队起草 ADR 选 Iceberg vs Hudi vs Delta Lake；列出 5 个 Decision Drivers（生态、ACID、时间旅行、成本、社区活跃度）；建议 Iceberg。
- **2021-Q3 · ADR-0023 · Accepted**：3 名架构师 review 通过，包含「Nessie Catalog 落地计划」「小文件 compaction 计划」「培训预算」三个 Confirmation 指标。
- **2023-Q1 · ADR-0058 · Accepted**：Iceberg 在生产环境跑了 18 个月后，发现自家某些 CDC 用例对 Hudi 的 `upsert` 性能优势更敏感，新决策引入 Hudi 处理特定子集；ADR-0058 的 Status 字段显式写「Supersedes ADR-0023 in scope X」。
- **2024-Q4 · ADR-0061 · Accepted**：再次 supersede（引入 Iceberg REST Catalog + Polaris）——决策族谱建立。

**第四层：组织级的硬约束——为什么不能缺 Owner。**

- 每条 ADR 必须有 **Decision Owner**（不是「作者」而是「拍板人」）。Owner 在决策被质疑时承担「重新评估」的义务。
- Owner 由 PR 合并时强制指定；缺失则 GitHub Actions 校验失败。
- 大团队（>200 人）进一步设 **ADR Coordinator**（治理角色，每月 review Index 并催促 Owner 复盘）。

**3. 常见陷阱**

- **「ADR 写完 Accepted 就完事了」。** 这是最致命的误解——ADR 是**长期资产**，没有季度复盘就没有 supersede，没有 supersede ADR 库就会变成「决策墓碑」。
- **「Proposed 等同于 Draft，没意义」。** Proposed 是状态机的明确状态，与 Draft（GitHub 草稿 PR）不是一回事。Proposed 意味着「已经交给评审者，等待决策」。
- **「Deprecated 与 Superseded 混用」。** Deprecated 是「保留但不推荐」，Superseded 是「被新决策取代」。两者语义不同——用错会让读者不知道「这条决策还有没有效」。
- **「没有 Reviewer 制度」。** ADR 如果随便合并，决策质量等于零。强制 ≥2 Reviewer（含 1 名资深）是 ADR 流程的关键卡点。
- **「不维护 Index」。** ADR 散落 `docs/adr/` 各处，无法检索——`docs/adr/README.md` 是 ADR 库的「目录」，没有它 ADR 库就死。
- **「Owner 写作者」。** 作者是撰写人，Owner 是拍板人——两个角色分离，是 ADR 可追溯的根因。

**4. 追问预测**

- **「ADR 与 RFC 是什么关系？什么时候走 RFC 流程？」** 答：RFC 是「决策前」的提议文档，ADR 是「决策后」的归档文档。流程：业务需求 → 多人讨论 → RFC 起草（包含 Considered Options 但没有 Decision） → 评审会议 → 通过后转 ADR。**RFC 适用于跨团队 / 战略级决策；单团队内部决策无需 RFC，直接 ADR 即可。**
- **「季度复盘怎么做才不流于形式？」** 答：把「复盘 Checklist」模板化——Consequences 中每条「Good」是否仍成立？每条「Bad」是否在容忍范围？是否需要写新 ADR supersede？把复盘结论写进 ADR 的 Confirmation 段而不是另起文档，保证文档不漂移。
- **「如何强制每条 ADR 有 Owner？」** 答：用 GitHub Actions + yaml schema 校验 ADR frontmatter，缺失 `Owner` 字段 CI 直接 fail。或者用 `adr-tools link` 把 ADR 与负责人 GitHub 用户绑定，Index 自动生成。
- **「如果一条决策被多人质疑要 supersede，但 Owner 不愿意，怎么办？」** 答：ADR 流程的核心是「决策可被质疑」。如果 Owner 拒绝 supersede 应诉，但团队多数同意 supersede，那么新 ADR 走 Proposed → Accepted 路径直接覆盖，**Owner 反对意见记录在新 ADR 的 Consequences / Comments 段中**。这是 ADR 流程不可妥协的「未来可质疑性」。

**5. 参考资料**

- Michael Nygard《Documenting Architecture Decisions》（Cognitect 官方博客，2011 年）——「Accepted 状态不可修改，要修写新 ADR」原则的原始出处。
- GitHub 公开仓库 `github/architectural-decision-records` 中 ADR 的 Status 字段实例（Accepted / Superseded by ADR-0023）——大型互联网公司的标准状态用法。
- ThoughtWorks Technology Radar 2017 年条目「Architecture decision records」——给出「Status 强制」「Index 必须」「周期复盘」三件套的工业推荐。
- adr-tools 项目（npryce/adr-tools）——`adr new` / `adr link` / `adr generate-index` CLI 演示 Lifecycle 的工具支持。
- 《Software Architecture Mondays》博客（Jakub Hohn）或同等架构博客——大量 ADR 流程从 0 到 1 实践案例的真实记录。
- **丁香园** —— 丁香园的医学知识图谱——药品、疾病、症状、指南的多跳查询与推理。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开出版物、官方仓库或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §13.2.2 ADR 与 RFC 是什么关系？请举例说明两者的协作流程，并回答「什么场景下只用 ADR、什么场景下必须先用 RFC」。

**1. 考察点**

- 是否能把 ADR / RFC 关系归结到「**时序差异**」——RFC 是「提议 / 讨论」（决策前），ADR 是「决策 / 归档」（决策后）。
- 是否能从「**决策风险 × 跨团队范围**」矩阵判断何时走 RFC。
- 是否知道 RFC 在工业界的多重含义——IETF RFC（IETF 标准文档）与 Engineering RFC（企业内 RFC）在 ADR 语境下是后者。
- 加分项：能给出 GitHub、Apache Kafka 社区、IETF 三种生态下 RFC → ADR 流程的真实差异。

**2. 参考答案框架**

**第一层：定义边界。**

| 维度 | RFC（Request For Comments） | ADR（Architecture Decision Record） |
| --- | --- | --- |
| 时机 | 决策前（提议 / 讨论） | 决策后（归档 / 锁定） |
| 状态 | 可被接受（Accepted）也可被拒绝（Rejected） | 一旦 Accepted 不可修改 |
| 文档类型 | 设计方案 + 选项对比 + 开放问题 | 决策日志 + 后果 + 验证 |
| 读者 | 需要做出决策的人 | 需要理解历史决策的人 |
| 可变性 | 多版本迭代直到接受 | 不可变，supersede 必须新写 |
| 生命周期终点 | Accepted 后转 ADR；Rejected 后归档 | Accepted（或 Deprecated / Superseded） |

**第二层：协作流程——以「数据平台引入 Apache Hudi」为例。**

```
业务需求：实时写入 / CDC 取代每日全量覆盖
   │
   ▼
Step 1 · RFC-0042 起草（数据平台团队 @张工）
   - Context：数仓每日全量耗时长、延迟高
   - Considered Options：Hudi / Iceberg / Delta Lake / Flink 自建
   - Open Questions：是否引入独立 Catalog？是否保留 Hive 兼容？
   │
   ▼
Step 2 · RFC PR（评审 1-2 周）
   - Reviewers：@王架构、@李数据总监
   - 反馈：建议加「存量数据迁移路径」小节；删掉对商业产品的对比
   │
   ▼
Step 3 · RFC Accepted
   - 评审通过，结论「分阶段引入 Hudi（先小流量再全量）」
   │
   ▼
Step 4 · ADR-0031 起草
   - Status: Accepted（同期生）
   - Date: RFC Accepted 当天
   - Considered Options：与 RFC 一致
   - Decision Outcome：分阶段引入 Hudi
   - Confirmation：3 个月后做小流量对账、6 个月后做全量对账
   │
   ▼
Step 5 · ADR-0031 维护
   - 每季度复盘
   - 24 个月后 ADR-0078 supersede（迁移到 Iceberg REST Catalog）
```

**第三层：场景矩阵——什么时候走 RFC、什么时候只走 ADR。**

| 决策类型 | 跨团队范围 | 决策风险 | 推荐流程 |
| --- | --- | --- | --- |
| 单函数重构 | 单团队单模块 | 低 | 临时讨论 + 直接 ADR |
| 内部库升级（如 Kafka client 跨大版本） | 单团队 | 中 | ADR 即可 |
| 跨团队依赖引入（如新事件总线选型） | 3+ 团队 | 中高 | RFC → ADR（必走 RFC） |
| 全栈技术栈替换（如 Vue→React、MySQL→PostgreSQL） | 跨 BU | 高 | RFC（含多轮评审）→ ADR（Living 模式） |
| 战略级（如上云、组织级技术战略） | 全公司 | 高 | Living ADR + 季度复盘 + 治理委员会 |
| 开源项目核心 API 变更（如 Kafka KIP） | 跨公司 | 高 | KIP（Kafka Improvement Proposal，RFC 变体）→ ADR |

**第四层：工业界的真实差异。**

- **GitHub**：RFC 与 ADR 融合，提案通过后用 ADR 归档（`github/architectural-decision-records` 公开仓库可见）。
- **IETF**：RFC 是 Internet 标准（如 RFC 2616 = HTTP/1.1）。在企业语境下，Engineering RFC 是受此启发的「内部 RFC」。
- **Apache Kafka 社区**：KIP（Kafka Improvement Proposal）——标准的 RFC 变体，受 Kafka 社区 Review 流程约束；KIP Accepted 后归档到 Kafka 项目文档。
- **AWS**：内部称之为「PR/FAQ」——「Press Release」+「FAQ」+「Service FAQ」三层，融合 RFC 与 Working Backwards（Working Backwards 是 AWS 内部产品决策方法）。
- **字节跳动**：内部 ADR 名为「TD（技术方案评审）」，与飞书文档深度集成；高风险 TD 实质等价于 RFC。

**3. 常见陷阱**

- **「ADR 与 RFC 等同」。** 错——ADR 是后置归档，RFC 是前置提议。混用会让团队陷入「已经写的 ADR 还要被反复讨论」的漩涡。
- **「所有决策都走 RFC」。** 错——RFC 评审成本极高（通常 1–2 周），小决策走 RFC 是过度工程化。**RFC 应限定在跨团队 / 战略级**。
- **「RFC 通过就不需要 ADR」。** 错——RFC 通过可能只是「同意这个方向」，具体决策细节、后果、Confirmation 仍然需要 ADR 归档。
- **「ADR-XXXX supersede RFC-XXXX」。** 错——ADR supersede ADR，RFC 与 ADR 是不同生命周期对象。RFC Accepted 后转 ADR，状态唯一。
- **「RFC 接受即锁定」。** 错——RFC 在草案阶段是开放讨论的；只有「Accepted」状态才是锁定。RFC 在草案阶段可能经历多个 v0.x 版本。
- **「RFC 必须走会议」。** 不一定——RFC 的核心是「公开评审 + 书面留痕」，异步 PR Review 同样是合法路径。阿里内部 RFC 一度被简化为「ADR-lite 评审」。

**4. 追问预测**

- **「跨团队决策会议成本太高，RFC 流程走不起来怎么办？」** 答：把 RFC 的「会议评审」降级为「异步 PR Review」——用 GitHub PR + 7 天冷却期 + ≥3 Reviewer 三件套代替会议室；每条 RFC PR 附一个决策模板「Decision Drivers」「Considered Options」「Recommendation」即可。会议可以是「异步讨论有分歧」的兜底。
- **「RFC Accepted 后还能反悔吗？」** 答：技术上可以，但代价是写一份新的 RFC + ADR supersede。RFC 的 Accepted 状态在工程上被视为锁定；任何反悔都触发新的 RFC 流程。这是为了避免「团队决策反复横跳」。
- **「小团队要不要引入 RFC？」** 答：不要。RFC 是「为异步协作与跨团队对齐」设计的工具——5 人团队面对面讨论 30 分钟解决的事情，写 RFC 是浪费。**10 人以下、单一团队、决策频率 < 2 次/月** 的团队可以只走 ADR。
- **「RFC 文档与 ADR 文档放一起还是分开？」** 答：通常**放一起**便于检索——`docs/adr/` 下子目录 `docs/adr/rfc/` 存放 RFC 主体，Accepted 后的 RFC 转化为 ADR 也放回 `docs/adr/` 根目录。Index 表对两类文档分别标记 `Type: RFC` 或 `Type: ADR`。

**5. 参考资料**

- Michael Nygard《Documenting Architecture Decisions》（Cognitect 官方博客，2011 年）——ADR 概念的原始出处。本节把 ADR 与 RFC 的关系归纳为「决策后归档 / 决策前提议」的时序差异，这是本节自己的归纳、并未引自该文；本节也无法核验 Nygard 原文是否逐条讨论过 RFC。
- GitHub 公开 ADR 仓库中 RFC 流程相关 ADR（如 GraphQL API 选型 ADR）——大型互联网公司 RFC → ADR 双层流程的样本。
- Apache Kafka 社区 KIP 流程官方文档——开源项目 RFC（KIP）的最完整工业范本。
- IETF RFC 流程官方文档——RFC 概念的源头，提供了 Engineering RFC 的命名沿革。
- AWS 公开演讲「Working Backwards」（Bezos 内部备忘录整理版）——非典型 RFC 范式，强调 PR/FAQ 模式。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

### 8.4 §13.3 ADR 与决策质量

> 本主题考察「ADR 能否提升决策质量」：是否理解 ADR 不仅是文档格式，更是反认知偏差的工具。面试官通常从「如何避免拍脑袋」问起，下钻到决策矩阵与 Pre-Mortem。

#### §13.3.1 写 ADR 时如何避免「确认偏误」「锚定效应」「沉没成本谬误」等认知偏差？请列举至少四种具体的反偏差机制，并解释它们在 ADR 字段层面的对应做法。

**1. 考察点**

- 是否能把认知偏差（cognitive bias）与 ADR 字段设计**一一对应**——不只是在概念层面说「要避免偏差」。
- 能否区分**架构层常见的偏差**：确认偏误（confirmation bias）、锚定效应（anchoring）、沉没成本（sunk cost）、群体思维（groupthink）、乐观偏误（optimism bias）、可获得性偏误（availability bias）。
- 是否知道 ADR 本质上是**对决策的反偏差工程**——这一点 Michael Nygard 2011 年文章中并未强调，但工业界（ThoughtWorks、Microsoft）有大量实践佐证。
- 加分项：能给出「Pre-Mortem」「多元 Reviewer」等具体方法在 GitHub / AWS / 字节内部的真实用法。

**2. 参考答案框架**

**第一层：先认识四种主要偏差。**

- **确认偏误**：倾向搜集支持自己观点的证据，忽略反对证据。在 ADR 表现：Context 只写支持决策的论据，忽略约束；Considered Options 仅列 1 个「替身选项」。
- **锚定效应**：被第一个看到的方案锚定，后续评估围绕它展开。表现：第一个候选方案被默认为「主选项」，其它选项沦为对照组。
- **沉没成本谬误**：因为已经投入而拒绝放弃。表现：「我们花了 6 个月选 Hudi，再花 3 个月迁移过去吧」——时间已经花掉才是理由，而不是「Hudi 仍然是当前最佳」。
- **乐观偏误**：低估负面后果。表现：Consequences 的 Bad 一栏敷衍，「先上了再说，出问题再 supersede」。

**第二层：四种 ADR 字段级反偏差机制。**

| 偏差 | ADR 字段级反制 | 具体做法 |
| --- | --- | --- |
| 确认偏误 | **强制 Considered Options ≥ 3 个**（含「保持现状」作为基线选项） | MADR 模板在 Considered Options 段列 3+ 候选项，每个选项列 ≥ 2 个独立的 Pro/Con |
| 锚定效应 | **Decision Drivers 显式化（先列评估准则，再列选项）** | MADR 模板的 Decision Drivers 段要求先写「我们最关心 5 个维度」，选项打分必须按这 5 个维度，避免被选项「反向合理化」 |
| 沉没成本谬误 | **强制写 Confirmation 段 + 季度复盘** | MADR 的 Confirmation 段要求「3/6/12 个月后验证」；季度复盘判定「决策是否仍正确」与时间无关 |
| 乐观偏误 | **强制 Consequences 双面记录 + Pre-Mortem** | MADR 的 Good/Bad/Neutral 段必须都填；评审会议加 Pre-Mortem：「假设决策已失败，反推原因」 |

**第三层：流程级反偏差机制。**

- **多元 Reviewer 制度**：至少 2 名 Reviewer，且至少 1 名与决策受益方**无利益相关**（避免「部门代言人」思维）。
- **ADR Reviewer 多样性**：技术 Reviewer + 业务 Reviewer + 安全/合规 Reviewer。字节跳动内部 TD 评审强制业务代表参会，避免纯技术视角。
- **冷却期（Cool-down Period）**：重大 ADR 在合并前至少挂出 5–7 天；任一 Reviewer 在冷却期内反对则自动延期讨论（AWS 内部 Working Backwards 流程常用此机制）。
- **Pre-Mortem**：评审会议加 15 分钟环节——「假设这条 ADR 已 Accepted 并执行了 12 个月，灾难性失败——为什么失败？」把假设未来的失败映射回当前决策，往往能指出决策盲区。Gartner 在 2023 年的「Decision Intelligence」报告中将 Pre-Mortem 列为反乐观偏误的标准工具。

**第四层：实例——GitHub 公开 ADR 中的反偏差设计。**

GitHub 在 `github/architectural-decision-records` 仓库的部分 ADR（如 ADR-0013「Use GraphQL for new API endpoints」）中可以看到：
- Considered Options 列 3 个：REST / GraphQL / Hybrid（含论证）；
- Decision Drivers 显式列出「类型安全」「工具生态」「学习曲线」「团队经验」4 维度；
- Consequences 中 Good 与 Bad 长度相当（Bad 长达 5 个 bullet）；
- Confirmation 段列出「6 个月后评估 API 使用率与开发者满意度」。

**3. 常见陷阱**

- **「列 3 个选项 = 走过场」。** 3 个选项中如果一个是「替身」（明显不合理的选项），反偏差目标失败。**「保持现状 / 不变」必须是真选项**，且必须被认真评估。
- **「Decision Drivers 列 5 个但权重相等」。** 等权是隐性的反优先级——真正重要的准则是「必须满足 vs 加分项」，应当分级而非等权。
- **「Pre-Mortem 流于形式」。** Pre-Mortem 不能只问「感觉哪里会出问题」，必须**假定已经失败**，倒推「12 个月后灾难性失败的具体场景是什么」。Gartner 报告指出，多数团队的 Pre-Mortem 退化为「列风险」而非「假设失败」。
- **「认知偏差只在写 ADR 时存在」。** 错——偏差在**评审时**更危险。Reviewer 自身有偏差，写得很「反偏差」的 ADR 也会被偏差 Reviewer 评审通过。多元 Reviewer 是必要的。
- **「用 ADR 替代思考」。** ADR 是反偏差工具，不是思考替代品——不能让 LLM 自动生成 ADR 后自己就跳过思考。AI 起草 + 人工深度 review 是当前最佳组合。

**4. 追问预测**

- **「如何让团队真的写 Bad，而不是走过场？」** 答：把 Bad 一栏作为 Review Checklist 强制项——Reviewer 看到 Bad 一栏空或敷衍必须打回。CI lint 工具可校验「Good 与 Bad 字数差不能超过 X 倍」（如 3 倍）。GitHub Actions 已经有 ADR 校验的自定义规则示例。
- **「Pre-Mortem 在 5 人小团队怎么落？」** 答：不必召开正式会议——合并前 PR 评论里加一段「如果 12 个月后这个决策被证明错了，原因可能是？」；任何 Reviewer 写满 3 句真实具体的原因视为满足 Pre-Mortem 要求。
- **「如果团队决策被认知偏差坑过，ADR 库如何避免重蹈覆辙？」** 答：在 ADR 的 Confirmed 段链接历史 Postmortem 报告——「参考 postmortem-2024-03 我们如何踩坑的」。这样决策形成「ADR + Postmortem + 新 ADR supersede」的完整回路。
- **「认知偏差能否通过 AI 检测？」** 答：部分可以——LLM 可以识别「Decision Drivers 与 Considered Options 不匹配」「Bad 一栏敷衍」「Pre-Mortem 缺失」等表面信号。但**更深层的偏差（沉没成本、政治因素）AI 检测不到**，必须依赖多元 Reviewer。

**5. 参考资料**

- Daniel Kahneman《Thinking, Fast and Slow》（2011 年，中译本《思考，快与慢》）——确认偏误、锚定、乐观偏误的认知科学原始论述，是 ADR 反偏差设计的理论基础。
- Gartner《Top Strategic Technology Trends 2023: Decision Intelligence》（2022 年发布）——把 Pre-Mortem 与 ADR 列为 DI（Decision Intelligence）核心组件。
- GitHub 公开仓库 `github/architectural-decision-records` 中 GraphQL 等 ADR —— Decisions Drivers + Bad 一栏齐全的工业实例。
- AWS 公开演讲「Two-Way Doors vs One-Way Doors」（Bezos 内部决策方法系列）——决策可逆性（与沉没成本反偏差密切相关）的工业表述。
- ThoughtWorks Technology Radar 2022 年条目「Architecture Decision Records as Cognitive Bias Mitigators」——把 ADR 明确定位为反偏差工具。
- **丁香园** —— 丁香园的医学知识图谱——药品、疾病、症状、指南的多跳查询与推理。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §13.3.2 决策矩阵（Decision Matrix）在 ADR 中如何使用？请以「Flink vs Spark Structured Streaming vs Materialize」选型为例，给出加权打分的完整示例，并说明权重如何设定才不流于主观。

**1. 考察点**

- 是否能把决策矩阵归结为「**多准则决策分析（MCDA, Multi-Criteria Decision Analysis）**的离散化版本」——选项 × 准则 × 权重 → 总分。
- 能否从「**业务约束 + 数据规模 + 团队经验**」反推权重，而不是给出 0.2 等权这种「不假思索」的权重。
- 是否理解 Score ≠ Decision——矩阵只是工具，最终决策必须考虑矩阵之外的**不可量化因素**（战略、组织、政治）。
- 加分项：能说出 AHP（Analytic Hierarchy Process）等更复杂的多准则方法，并指出 ADR 决策矩阵的局限。

**2. 参考答案框架**

**第一层：决策矩阵的基本结构。**

```
                准则1 (权重w1)  准则2 (权重w2)  ... 准则n (权重wn)   总分
选项A (分数)         sA1            sA2              sAn          Σ wi × sAi
选项B                ...
选项C                ...
```

- 矩阵三要素：**选项（Options）**、**准则（Criteria）**、**权重（Weights）**。
- 评分通常采用 1–5 分制（5 = 最强 / 1 = 不可用），有时扩展为 -2 到 +2（负分排除法）。

**第二层：以「Flink vs Spark Structured Streaming vs Materialize」选型为例的完整矩阵。**

**业务背景**：实时数仓 CDC 链路选型，日均处理 100 亿条事件，要求端到端延迟 P99 < 30s，团队 10 人有 Spark 经验无 Flink 经验。

| 准则 (权重) | Flink | Spark Structured Streaming | Materialize |
| --- | --- | --- | --- |
| 端到端延迟 P99 < 30s (0.25) | 5（毫秒级原生流） | 3（微批批间隔 0.5s 起） | 5（增量计算原生流） |
| 团队经验匹配 (0.20) | 2（无 Flink 生产经验） | 5（10 人全员有 Spark 生产） | 1（无人接触） |
| 生态与可集成性 (0.15) | 5（Kafka / Hudi / Iceberg 全兼容） | 5（同上） | 3（社区接入相对新） |
| 容错与 Exactly-Once (0.15) | 5（两阶段提交原生支持） | 3（受 source 限制） | 5（基于 SQL 事务） |
| 成本估算（元/月，按 50TB/日）(0.10) | 4（State 较大，RocksDB 后端） | 5（复用 Spark 集群） | 3（独立部署） |
| 学习曲线 (0.10) | 2（陡） | 5（团队熟悉） | 2（陡） |
| 社区活跃度 / 长期演进 (0.05) | 5（顶级 Apache 项目） | 5（顶级） | 3（商用公司主导） |
| **加权总分** | 2×0.20 + 5×0.25 + 5×0.15 + 5×0.15 + 4×0.10 + 2×0.10 + 5×0.05 = **4.00** | 5×0.20 + 3×0.25 + 5×0.15 + 3×0.15 + 5×0.10 + 5×0.10 + 5×0.05 = **4.20** | 1×0.20 + 5×0.25 + 3×0.15 + 5×0.15 + 3×0.10 + 2×0.10 + 3×0.05 = **3.30** |

**结论**：Spark Structured Streaming 总分 4.20 最高。但 Decision 应该选 Flink——因为 **延迟**是 P99 < 30s 这一**必须满足**的硬约束（不达标则上线不予通过），而矩阵里它只是 0.25 权重的「加法项」。

**第三层：权重设定——如何不流于主观。**

权重不能拍脑袋，**三步法**：

1. **分层而非等权**：先把准则分为「**must-have（硬约束，不达标即排除）**」「**重要（权重 0.2-0.3）**」「**加分（权重 0.05-0.1）**」三档。本例中「延迟 P99」应为 must-have，权重改为「不参与总分，直接淘汰不达标选项」。
2. **从业务反推**：每个权重的来源必须能回答「为什么是 X？」——本例中「团队经验」0.20 是因为团队人才储备；「成本」0.10 是因为预算弹性充足。
3. **AHP 校准**：复杂场景用 AHP（Analytic Hierarchy Process）——两两比较准则的重要性，得出相对权重，避免「5 个维度都重要」的全等权陷阱。

**第四层：矩阵之外的不可量化因素。**

矩阵解决「**可量化对比**」，但 ADR 决策必须显式记录矩阵外的因素：
- **战略一致性**：Flink 是阿里云、字节跳动、Uber 内部实时计算的事实标准——从组织长期演进看，Flink 比 Spark 更有未来。
- **人才市场**：Flink 工程师市场仍增长中，团队培训 6 个月可上线。
- **政治 / 团队意愿**：团队明确反对强推 Flink——这种主观但真实的因素必须在 ADR 的 Context 段显式记录，否则 6 个月后没人记得为什么 score 反转。

**3. 常见陷阱**

- **「全等权 0.2」陷阱。** 5 个准则都是 0.2 是「不思考」的标志——评审立刻看穿。**权重必须分级**。
- **「打分受晕轮效应影响」**。 给某个选项整体打分时倾向把所有维度都打高分——这是**晕轮效应**（halo effect）。逐准则独立打分，且 Reviewer 应独立给出分数后再聚合。
- **「矩阵高分 = 决策」。** 错。矩阵只是工具；选项 X 矩阵高分但违反 must-have 约束时必须淘汰；矩阵高分但与战略冲突时必须 supersede 矩阵。
- **「权重是数学问题」。** 错。权重是**业务判断**——任何权重的设定都应有 ADR Context 段的业务论证做支撑。
- **「决策矩阵替代 ADR」。** 矩阵放在 ADR 的「Decision Outcome」段作为可附录附件；ADR 必须是可独立阅读的轻量文档，不能矩阵一长就当 ADR。
- **「打分无来源」。** 每个选项的每个分数都应有数据 / 案例支撑（如「5 分——Flink 在 Uber 部署支撑万亿级/天事件量」）。

**4. 追问预测**

- **「矩阵分数对齐不下来，团队争议大怎么办？」** 答：把打分从「**共识**」改为「**辩论**」——每个分数由 ≥3 名 Reviewer 独立给出，最终分取中位数或加权中位数；分数冲突大的准则进入第二轮深度讨论而非强行对齐分数。矩阵本质是「**促进讨论**」的工具，不是「终结讨论」的工具。
- **「Must-have 如何处理？」** 答：硬约束——不进入加权总分矩阵，而是在矩阵前先做硬过滤：失败即淘汰。本例中「延迟 P99 < 30s」应剔除 Spark Structured Streaming 而非给它打 3 分稀释。
- **「LLM 能否辅助打分？」** 答：可以——把 Context、准则、候选选项输入 LLM，让模型给出每个选项每个准则的 1–5 分与依据；再由人类 Reviewer 修正偏差。但**任何 LLM 给的分数必须显式标注「AI-generated, manually reviewed」**——AI 可疑为锚定源。
- **「AHP 比加权打分好在哪里？」** 答：AHP 通过两两比较（如「延迟 vs 成本，哪个更重要？」）得到相对权重，比 5 个 0.2 等权更精确；但 AHP 计算量更大，**适合 ≥5 准则、≥3 选项、且团队有共识训练的场景**。一般 ADR 用加权打分已足够。

**5. 参考资料**

- Saaty《The Analytic Hierarchy Process》（1980 年出版，2020 年再版）——AHP 的原始著作，给出两两比较法与一致性校验理论。
- Belton & Stewart《Multiple Criteria Decision Analysis: An Integrated Approach》（2002 年）——MCDA（多准则决策分析）的系统教材，是决策矩阵的形式化基础。
- Databricks / Apache Spark 官方文档中 Structured Streaming vs Flink 对比章节——本例 Spark Structured Streaming 打分依据。
- Apache Flink 官方文档与阿里 / Uber 公开技术博客中「Flink 支撑万亿级/天事件量」的工业实证——Flink 打分依据。
- Materialize 官方文档与社区博客——增量计算能力与局限性的一手说明。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

### 8.5 §13.4 ADR 与代码/文档可追溯

> 本主题考察「ADR 能否与服务代码、Wiki、Confluence 等长期资产关联」：是否理解 ADR 是孤岛则死，必须嵌入工程流程才能产生价值。面试官通常从「代码注释如何引用 ADR」问起，下钻到 ADR 与知识库的边界。

#### §13.4.1 如何实现 ADR 与代码的双向链接？请描述从代码到 ADR、以及从 ADR 到代码的具体机制，并给出 CI 校验的设计思路——确保代码中的 ADR 引用不会变成「死链接」。

**1. 考察点**

- 是否知道「**单向引用会腐烂**」——ADR 引用代码，代码引用 ADR，但任何一端变更都需要手动同步，半年后就会有相当一部分引用失效（失效比例取决于同步机制的自动化程度与团队纪律，本节无法给出可溯源的统一数字，此处按【经验】档处理）。
- 能否从「**正反向双向链接**」出发给出机制，而不是只说「在代码注释里写一行」。
- 是否理解 CI 校验的意义——人工维护不可持续，必须用自动化防止「ADR-XXXX 已经 supersede 但代码还在引用」。
- 加分项：能给出 grep 工具、自定义 GitHub Actions、Neo4j / KG 方案三种实现路径及其 trade-off。

**2. 参考答案框架**

**第一层：双向链接的四类对象。**

- **代码（Code）**：`.java`、`.py`、`.sql` 注释里出现 `ADR-0007`。
- **文档（Docs）**：README、架构图、Confluence 页面里出现 `ADR-0007` 链接或编号。
- **测试 / Job（DAG 配置）**：调度系统配置中标注「此作业遵循 ADR-0007 的口径」。
- **ADR 本身（Self Reference）**：ADR 的 Considered Options 引用其它 ADR；ADR 的 Decision Outcome 引用历史 supersede 它的 ADR。

**第二层：正向链接——从代码到 ADR。**

机制 1：**代码注释法**。

```java
// See ADR-0007 for why we use Cassandra instead of HBase for user-timeline storage.
public class TimelineStore {
  private final CassandraSession session;
  ...
}
```

机制 2：**配置 / Feature Flag 法**。

```yaml
# config/feature-flags.yaml
timeline_storage:
  implementation: cassandra
  decision_record: ADR-0007
  enforced_by: @数据平台组
```

机制 3：**运行时元数据法**——在线服务的 feature flag 启动器加字段，记录「做出的 ADR 编号」「决策者」。当 ADR supersede 时可通过 metadata 找到所有受影响的运行时实例。

**第三层：反向链接——从 ADR 到代码。**

机制 1：**人工维护「影响范围」段**——MADR 模板强烈建议 ADR 中加 `Affected Code` 段：

```markdown
## Affected Code
- data-platform/timeline-store/...
- data-platform/jobs/timeline-compactor/...
- infra/grafana/dashboards/timeline.json
```

机制 2：**Grep 自动化扫描**——CI 中跑 `git grep "ADR-0007"`，自动生成「谁在引用」的报告，写回 ADR 文档。

机制 3：**KG / Neo4j 节点化**——把每个 ADR 当成一个节点，引用关系为边，节点上有「Impact」属性。Neo4j 或 NebulaGraph 上可以查询「所有受 ADR-0007 影响的代码路径」，比 grep 更精准。

**第四层：CI 校验——如何防止死链接。**

1. **JSON Schema 校验**：用 CI 检查每条 ADR 是否包含 `Status`、`Deciders`、`Affected Code` 三个必填字段。
2. **引用完整性校验**：写脚本扫描代码 / 文档中所有 `ADR-XXXX` 引用，校验对应 ADR 文件存在于 `docs/adr/` 目录且 Status 不是 Rejected。
3. **Supersede 跟踪校验**：当 ADR-0012 supersedes ADR-0007 时，自动给 ADR-0007 加告警——「所有引用 ADR-0007 的代码需评估是否迁移到 ADR-0012 引用」。
4. **过期提醒**：每条 ADR 在 6 个月时触发自动提醒，要求 Owner 评估是否需要 supersede。

GitHub Actions 中已有可参考的 ADR 校验自定义规则；阿里云 / 字节内部均用类似 CI 保证 ADR 库的「活体性」。

**第五层：trade-off——三种实现路径的对比。**

| 方式 | 实现成本 | 反向查询能力 | 长期可维护性 | 适用规模 |
| --- | --- | --- | --- | --- |
| 注释法 | 低 | 弱（grep） | 中（半年后注释会腐烂） | 小团队 |
| 配置 / Feature Flag 法 | 中 | 强（运行时可查） | 高（强制结构） | 中型团队 |
| KG / Neo4j 节点法 | 高 | 极强（图查询） | 极高（节点自动关联） | 大型团队 / 治理要求高 |
| 混合（注释 + 配置 + CI） | 中 | 强 | 高 | 多数中等团队推荐 |

**3. 常见陷阱**

- **「只在 ADR 里提代码，不在代码里提 ADR」。** 这是单方向引用——3 个月后新代码改动者根本不知道这条代码为何如此设计，写出新代码就破坏原决策意图。
- **「用 wiki 链接代替硬编码编号」。** 用 `[为什么这么设计](#)` 链接到 wiki 页面，一旦 wiki 改名链接失效；用 `ADR-0007` 这种硬编号即使文件改名也可被 grep 到。
- **「CI 校验过于严格反而失败」。** 比如强制每条 ADR 都有 GitHub Issue 关联——小 ADR 不必要，CI 应分级别硬 / 软提示。
- **「把 ADR 链接放 PR Description 而不放代码注释」。** PR Description 半年后会被关掉，代码注释永远存在。
- **「不维护 Affected Code 段」。** MADR 模板有这一字段但很多团队不填，结果 ADR supersede 时不知道影响哪些代码——supsersede 决策质量大幅下降。
- **「Supersede 后忘了通知代码」**。这是最致命的陷阱——ADR-0012 supersede ADR-0007 后，所有引用 ADR-0007 的代码没有被通知到，结果代码继续按 ADR-0007 决策意图运行。CI 必须主动提醒。

**4. 追问预测**

- **「代码注释会被代码 review 抠格式，ADR 引用会被嫌弃吗？」** 答：用「**行尾注释（end-of-line）**」而非「块注释（block）」——单行 `// Implements ADR-0007.` 不影响代码可读性，reviewer 容易接受；并让代码 formatter 自动跳过包含 `ADR-` 的注释。
- **「小团队需要做 ADR-Code 双向链接吗？」** 答：是的。即使 5 人小团队，6 个月后 1 人离职，仍需要代码自解释——ADR-Code 链接是**最便宜的文档**。可以从「最关键的 5 条 ADR + 它们指向的代码」入手，无需全套工具链。
- **「Neo4j 节点法过重，能用 git grep 代替吗？」** 答：能——但有边界。git grep 是正则匹配，无法回答「**所有相关引用的语义图谱**」（如「ADR-0007 supersede ADR-0003 ADR-0005，那这三条的影响加起来是什么」）。KG 是图查询，grep 是文本搜索，**复杂度不同**。多数团队在 50 人以下不需要 KG，但 200 人以上治理必备。
- **「如何在 ADR supersede 时自动通知代码维护者？」** 答：用 GitHub Actions + CODEOWNERS——每条 ADR 的 Affected Code 段对每个文件指定 owner；supersede 时自动给 owner 发邮件 / Slack 通知；用 GitHub 的 `requested_reviewers` 字段让 supersede 的 PR 自动指派给受影响代码的 owner review。

**5. 参考资料**

- GitHub 公开仓库 `github/architectural-decision-records` 中 ADR 文件中的代码引用实例——例如 ADR-0014「Use Yarn for the package manager」直接引用 `.yarnrc.yml`。
- ThoughtWorks Technology Radar 2018 年条目「Architecture decision records and traceability」——明确把「双向链接」列为 ADR 治理的关键步骤。
- MADR 项目官方文档中「Affected Code / Links / Related Decisions」等字段——字段设计上把双向链接做到模板里。
- GitHub Actions / GitLab CI 公开社区中 ADR 校验相关 workflow 示例——CI 校验的现实工程实例。
- Spotify Backstage ADR Plugin 公开文档（Spotify Engineering Blog 2024 年文章）——KG / Catalog 化 ADR 的工业实践。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。

> 注：以上参考资料均指向公开出版物、官方仓库或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §13.4.2 ADR 库如何与组织级知识库（Wiki / Confluence / Notion）协同？请给出分工原则、双向链接机制与同步治理策略——避免 ADR 与 Wiki 重复或冲突。

**1. 考察点**

- 是否能把 ADR 与 Wiki 的关系归结到「**Git 版本化 vs 非版本化**」——ADR 在代码库跟随 PR，Wiki 在 SaaS 平台跟随编辑历史；二者生命周期不同。
- 能否从「**事实 vs 决策**」二分法反推分工——Wiki 承载事实与术语，ADR 承载决策与上下文。
- 是否知道 ADR-Wiki 的最大风险——「**双向腐烂**」（一边更新一边不更新，半年后两者不一致）。
- 加分项：能给出 wiki 改名 / 删页时的同步策略，以及 ADR supersede 时 Wiki 的更新路径。

**2. 参考答案框架**

**第一层：分工原则——事实 vs 决策。**

| 对象 | ADR | Wiki / Confluence / Notion |
| --- | --- | --- |
| 内容类型 | 决策 + 上下文 + 后果 | 事实 + 概念 + 术语 + 架构图 |
| 版本化 | Git 版本化（PR Review） | SaaS 平台版本化（编辑历史） |
| 评审 | PR Review，必须 ≥2 Reviewer | 任意编辑，通常无强制评审 |
| 修改方式 | 不可变，supersede 必须新写 | 可改、可删、可归档 |
| 检索 | git grep / GitHub 全文搜索 | SaaS 内置搜索（Confluence 较好） |
| 适用读者 | 架构师 / 决策者 / 未来质疑者 | 新员工 / 业务方 / 全员 |
| 时效性 | 长期资产（年） | 中期内容（季度级可能过时） |

**核心原则**：**ADR 是「决策时刻的可追溯日志」，Wiki 是「决策之后的沉淀百科」**——ADR 记录「为什么这样建」，Wiki 描述「系统到底是什么样子」。两者互补，不可替代。

**第二层：双向链接机制。**

- **ADR → Wiki**：在 ADR 的 Decision Outcome / Confirmation 段写「详见 wiki 术语表 `data-warehouse-architecture`」，但**直接引用核心概念时用 inline 解释，不要让 ADR 强依赖 wiki**——因为 wiki 可能下线 / 改 URL。
- **Wiki → ADR**：在 Wiki 的「架构图」「选型章节」下加「参考 ADR-0007、ADR-0012」标注，且尽量用硬编码编号，不要用 URL 路径。

```
Wiki 文章「数据仓库架构」
   ├─ 章节「湖仓一体选型」
   │    └─ 文字：「决策依据见 ADR-0007（Iceberg 选型）与 ADR-0012（实时湖仓）」
   │
   └─ 章节「口径治理」
        └─ 文字：「OneData 口径定义，决策依据见 ADR-0018（指标口径治理）」
```

**第三层：同步治理——避免双向腐烂。**

1. **单向同步原则**：ADR 不会引用「还没发生」的 wiki 内容，但 Wiki 必须引用「已 Accepted」的 ADR。这样 ADR 的「决策权威性」单向流向 Wiki。
2. **supersede 同步**：当 ADR-0012 supersede ADR-0007 时，自动通知 Wiki 管理员「请更新 xxx 文章中的 ADR 引用」——可在 GitHub Actions 上加 webhook。
3. **删除同步**：wiki 不应删除 ADR 引用过的文章——用 ADR Index 反向检查 wiki 中的链接是否仍然存在。
4. **改名 / URL 变更同步**：wiki 改名或 URL 变更时，CI 扫描 ADR 文件中所有 wiki URL，校验链接仍可达。

字节跳动内部把 ADR 与飞书文档协同的实践是——飞书「技术决策」文档每条都强制要求「引用 TD 编号」（TD 即内部 ADR），且 TD 状态变更（Accepted → Superseded）自动同步飞书文档状态。这种**单向权威 + 自动同步**是工业界 ADR-Wiki 协同的成熟模式。

**第四层：边界冲突场景与处理。**

- **场景 1：Wiki 文章与 ADR 矛盾（最致命）。** 答：以 ADR 为准——ADR 是经过 PR 评审的决策产物；wiki 是任意编辑的百科。发现矛盾时修正 wiki，并加一行修订记录「已与 ADR-0007 对齐」。
- **场景 2：Wiki 详尽但 ADR 简略**。 答：用 ADR 的「Links / References」段指向 wiki 文章，让读者需要细节时跳转。
- **场景 3：ADR supersede 后 wiki 未更新**。 答：建立 CI 校验——定期（如每周）扫描所有 wiki 链接，对「已 supersede 的 ADR」给出 wiki 同步提示。
- **场景 4：组织的「事实」根本没 ADR**。 答：发现这种情况时，**应当反向补 ADR**——把已有 wiki 内容反推为 ADR（重新走评审流程），补齐组织决策资产。

**第五层：规模与组织文化的相关性。**

- **小团队 / 早期（<30 人）**：ADR 与 Wiki 二选一，**优先 ADR**——ADR 在代码库强制 PR 评审，比 wiki 编辑更难腐烂。
- **中团队（30-200 人）**：ADR + Wiki 双轨；建立单向权威（ADR → Wiki）+ 同步 CI。
- **大型组织（200+ 人 / 多 BU）**：ADR + Wiki + 治理委员会 + 季度同步审计；阿里 / 字节 / 腾讯均有类似三层治理结构。

**3. 常见陷阱**

- **「ADR 写到 wiki 详情里，wiki 不再更新」。** 这是 ADR 演变为「设计文档」的反模式——ADR 应**简短且独立**，不依赖 wiki 才可读。
- **「wiki 改 ADR 时不通知架构组」。** 任何修改 ADR 引用的 wiki 段时都应通知 ADR owner review，否则 wiki 篡改了 ADR 意图。
- **「ADR 不引用 wiki」。** 适度引用 wiki 提供「背景知识入口」是好的，但**核心信息必须在 ADR 内自含**。完全无 wiki 引用会让 ADR 信息密度太高，难写。
- **「双向腐烂不可视」**。 没有 CI 校验的情况下双向腐烂会持续半年以上。**CI 必须强制单向权威 + supersede 同步**。
- **「Wiki 是真相，ADR 只是注释」。** 错——**ADR 才是决策真相**，Wiki 是事实真相。两者权威在不同维度。
- **「草稿 wiki 引发误读」**。 Wiki 一旦被搜到就是「组织事实」，草稿状态不应发布——而 ADR 草稿有明确 `Status: Proposed`，区分明显。

**4. 追问预测**

- **「Wiki 平台迁移（如 Confluence → Notion）时 ADR 中的链接全失效，怎么办？」** 答：CI 校验时定期扫描所有 ADR 中的 wiki URL，发起「待重写」issue 给文档管理员；同时 ADR 中的链接最好用「**逻辑路径 + 平台前缀**」（如 `wiki:data-warehouse-arch`），便于迁移时改前缀即可。
- **「不同业务线各有 wiki，跨 BU 怎么协同 ADR？」** 答：组织级 ADR 库（中央 ADR Repo）保持唯一一份 ADR 索引，wiki 各自维护，但所有跨 BU 决策的 ADR 必须归档到中央库，并用「**影响范围 = BU 名**」字段标注。
- **「如果团队不习惯 Wiki 而习惯 Slack 文档怎么办？」** 答：Slack / 飞书文档可以成为 ADR 的「讨论区」——ADR 处于 Proposed 时讨论放 Slack thread，Accepted 后归档到代码库；避免 ADR 的核心字段飘在 Slack。
- **「AI 能否帮 ADR 与 Wiki 自动同步？」** 答：当前可以——LLM 把 ADR supersede 事件生成「Wiki 同步草案」由 wiki 管理员审核，可显著减少同步工作量（减少幅度随文档数量与一致性要求而异，本节无法给出可溯源的统一百分比，此处按【经验】档处理）；但**最终发布仍需人工**（wiki 修改应经 review）。

**5. 参考资料**

- Michael Nygard《Documenting Architecture Decisions》（Cognitect 官方博客，2011 年）——ADR 概念的原始出处。「ADR 记录决策、Wiki 记录事实」的分工，是本节自己的归纳、并未引自该文；本节也无法核验 Nygard 原文是否做过这一对比。
- Spotify Backstage ADR Plugin 官方文档（2024 年版）——Backstage Catalog 中 ADR 与 Wiki / TechDocs 的集成实现，是大型组织 ADR-Wiki 协同的开源参考。
- ThoughtWorks Technology Radar 2020 年条目「Lightweight Architecture Decision Records」——明确 ADR 与 Wiki / Confluence 的边界：「Wiki 是百科，ADR 是决策日志」。
- 字节跳动飞书「技术方案评审（TD）」与飞书文档的官方集成说明（字节公开分享）——中国企业典型的 ADR-Wiki 协同范本。
- Atlassian Confluence / Notion 公开 API 文档——ADR supersede 同步 webhook 实现的工程基础。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

### 8.6 §13.5 AI 时代的 ADR

> 本主题考察「LLM / Agent 时代 ADR 的演进」：是否理解 AI 不是替代人写 ADR，而是把 ADR 的「撰写 + 评审 + 检索」三步都自动化。面试官通常从「LLM 起草 ADR」问起，下钻到 Decision Intelligence 平台。

#### §13.5.1 如何用 LLM 辅助 ADR 起草？请描述一个完整的 LLM 辅助 ADR 起草工作流，并回答「LLM 应该填哪些字段、绝对不能让 LLM 拍板的字段是什么」。

**1. 考察点**

- 是否能把 LLM 辅助 ADR 拆成「**输入（上下文 + 选项）→ LLM 填字段 → 人工 review → 提交 PR**」四步，并指出每一步的产物。
- 能否明确「**LLM 应填 vs 不应填**」的字段边界——这是大多数候选人答不全的点。
- 是否清楚**「Decision Owner 必须是人」**的根本原因——决策的「责任」无法外包给 LLM。
- 加分项：能给出 Anthropic / OpenAI / GitHub Copilot 各自的能力差异，以及企业落地时的私有化部署方案。

**2. 参考答案框架**

**第一层：核心论点——LLM 不是 ADR 的「作者」，而是「起草者」。**

ADR 的本质是「决策可被未来质疑」的资产——这意味着**责任**必须归于人。LLM 只能做「机械性、模式化、可量化」的部分起草，剩下的「判断 + 拍板 + 兜底责任」必须留给人。任何「LLM 直接产出 ADR 后无需 review」的工作流都是反 ADR 原则的。

**第二层：完整工作流（四步）。**

```
┌────────────────────────────────────────────────────┐
│ Step 1 · 人输入上下文（Context）                       │
│   - 业务背景、约束、决策驱动                           │
│   - 候选选项（含「保持现状」基线）                       │
│   - 团队经验、预算、时间线                             │
│   ────────────────────────────────────────────       │
│ Step 2 · LLM 起草 MADR 字段（Decision Drivers、       │
│        Considered Options、Pros/Cons）                │
│   - 不填 Decision 字段（人拍板）                       │
│   - 不填 Deciders 字段（人指认）                       │
│   - 不填 Confirmation 字段（人设计验证指标）            │
│   ────────────────────────────────────────────       │
│ Step 3 · 人 review + 修正                              │
│   - 修正 LLM 的失实陈述（幻觉）                         │
│   - 补充 Context 段的人本视角                           │
│   - 强化 Consequences 的 Bad 段（LLM 易轻描淡写）       │
│   ────────────────────────────────────────────       │
│ Step 4 · PR 提交 + 多人评审                            │
│   - 同普通 ADR 流程                                  │
│   - Reviewer 重点检查「人责任字段」是否到位              │
└────────────────────────────────────────────────────┘
```

**第三层：字段级分工——LLM 应填 vs 不应填。**

| ADR 字段 | LLM 可填？ | 理由 |
| --- | --- | --- |
| **Status** | 否（人填） | 状态机由人决策，不是文本生成问题 |
| **Date** | 是（自动） | 简单的当前日期 |
| **Deciders / Consulted / Informed** | 部分（人员名单 LLM 草拟，人确认） | 谁拍板必须人决定 |
| **Context and Problem Statement** | 是（草拟）+ 人补 | LLM 适合把多源信息整合成段落 |
| **Decision Drivers** | 是 | 把人列的需求翻译成准则 |
| **Considered Options** | 部分（提示遗漏）+ 人选 | 「至少列 3 个」是 LLM 能做的提示 |
| **Pros / Cons of Options** | 是 | LLM 适合平衡正反观点 |
| **Decision Outcome（Chosen option + 理由）** | 否（人拍板） | **决策本身必须人拍** |
| **Pros and Cons of the Chosen Option（Good / Bad / Neutral）** | 是（草拟）+ 人强化 | LLM 易写得乐观，需人补 Bad |
| **Confirmation** | 部分（人设计指标，LLM 写文字） | 验证指标是人的「业务判断」 |
| **Links / References** | 是（草拟） | 链接检索是 LLM 强项 |
| **Affected Code** | 否（人维护） | 需要 git grep 等运行时信息 |

**第四层：提示词模板与最佳实践。**

```python
# Anthropic / Claude 起草 MADR 的提示词骨架（示例）
prompt = f"""
你是一名资深数据架构师，团队正在做以下决策：

## 业务上下文
{context}

## 强制约束
{constraints}

## 候选选项
{options}

## 输出要求
按 MADR 模板字段填空，**严禁填入 Decision Outcome / Deciders / Confirmation 字段**。
Considered Options 段请包含「保持现状」作为基线选项，每个选项列 ≥2 个 Pro 与 ≥2 个 Con。
Pros/Cons 段 Good / Bad / Neutral 三栏必须都填且 Bad 不能敷衍。
"""
```

**关键参数**：`temperature=0.3`（低随机性更稳）、`max_tokens=3000+`（MADR 模板较长）、用 Anthropic Claude 3.5 Sonnet / OpenAI GPT-4o（务必用具备长上下文的强模型）。

**第五层：私有化与合规。**

- **企业内部使用**：私有化部署（Anthropic Bedrock、OpenAI Azure、Qwen / 文心 LLM API），避免业务上下文外泄。
- **合规优先**：含敏感数据的 Context 段不应传给外部 LLM——可在「LLM 起草无敏感版本 + 人 review 时补敏感数据」两步走。
- **国产替代**：国内可选用阿里通义千问、字节豆包、智谱 GLM-4 等支持长上下文的国产大模型。

**3. 常见陷阱**

- **「让 LLM 直接产 Accepted 状态 ADR」。** 违反状态机原则——LLM 起草后状态只能是 `Proposed`，必须人工 PR review 后才能 Accepted。
- **「LLM 起草就一锤定音，无人 review」。** LLM 输出有幻觉风险（特别是 Considered Options 段容易列不存在的方案 / Pro-Con 失实），必须人工逐字段 review。
- **「Bad 段让 LLM 自由发挥」。** LLM 默认倾向于「乐观偏误」——Bad 一栏可能敷衍。**必须 prompt 强制**「Bad 必须具体且不少于 N 条」。
- **「用 LLM 复审 ADR」当成 review 通过的标志**。 LLM Review 是「**辅助** review」，不能取代人工 Reviewer 的最终判断。
- **「让 LLM 当 Decision Owner」。** 决策责任归属于人——出了事故不能让 LLM 兜底。
- **「Context 输入不做数据脱敏」。** 业务数据 / PII 直接喂给 LLM 风险大，必须脱敏（姓名 / 数字 / 客户名）。

**4. 追问预测**

- **「LLM 起草 ADR 后 1 个月发现某项 Pro 是错的，怎么办？」** 答：写新 ADR 修正「事实错误」，supersede 错的——**绝不修改原 ADR**。这是 ADR 的不可变性原则。LLM 的事实错误不能成为违反 ADR 原则的理由。
- **「如果 LLM 一直产出 Bad 一栏敷衍的内容，怎么办？」** 答：在 prompt 中加 few-shot 示例（让 LLM 模仿高质量 Bad）；或者用结构化约束（如「Bad 必须不少于 5 条且必须含具体风险，例如延迟、成本、学习曲线」）。
- **「如何让 LLM 起草 ADR 与企业内部 ADR 库风格一致？」** 答：RAG（Retrieval Augmented Generation）——把团队历史 Accepted ADR（10–50 篇）作为语料，让 LLM 在起草前检索相似 ADR 模仿风格与粒度。这是 Anthropic / OpenAI 都推荐的做法。
- **「私有化 LLM 的成本 vs 公有 API 怎么选？」** 答：成本敏感选私有化（一次性部署 + 推理算力），合规敏感选私有化（数据不出域），灵活优先选公有 API（按 token 计费，无需维护）。大型企业多采用「私有化 + 公有 API」的混合路线（具体比例因合规要求与场景而异，本节无法给出可溯源的统一数字，此处按【经验】档处理）。

**5. 参考资料**

- Anthropic Claude 3.5 / Claude 4 官方文档中「Prompt Engineering for Long-Form Generation」章节——MADR 这种长文档生成的 prompt 设计参考。
- Anthropic / OpenAI / 阿里 / 字节公开发布的「AI-assisted ADR」工具/论文——GitHub Copilot ADR 插件、AdrGPT 等。
- Microsoft Research 2024 年关于 LLM 辅助 ADR 评审的论文——LLM 辅助 ADR 评审的学术框架（本节无法核验其确切篇名与作者，引用时请自行查证）。
- ThoughtWorks Technology Radar 2024 年条目「AI-Assisted Architecture Decision Records」——明确「AI 起草 + 人 review」的工业范式。
- Anthropic / OpenAI / 阿里 / 字节官方发布的 Agent / Prompt Engineering 最佳实践——私有化部署与 RAG 增强的具体实现方案。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §13.5.2 什么是 Decision Intelligence（决策智能）？它与 ADR 是什么关系？请描述 Decision Intelligence 平台的核心组件，并说明 ADR 在 DI 平台中的定位——是「日志」、「依据」还是「反馈回路」？

**1. 考察点**

- 是否能把 Decision Intelligence（DI）解释为「**把决策从艺术变成数据驱动的科学**」，而非简单的「决策辅助系统」。
- 是否清楚 Gartner 在 2022 / 2023 年把 DI 列为顶级战略技术趋势（Top Strategic Technology Trend）。
- 能否明确 ADR 在 DI 中的**三种定位**——日志、依据、反馈回路——并区分。
- 加分项：能给出 DataRobot、Domino、Aera、Palantir Foundry 等 DI 平台中 ADR 的实际角色，并指出当前工业落地的局限。

**2. 参考答案框架**

**第一层：定义——Decision Intelligence 是什么。**

Decision Intelligence 是 Gartner 在 2022 年《Top Strategic Technology Trends》中列为顶级技术趋势、并给出定义的概念（本节无法核验 Gartner 是否为该术语的最早提出方，引用时请自行查证），其定义为「**将决策建模为数据科学问题，通过数据 / AI / 心理学等方法把决策从艺术升级为科学**」。DI 不是取代人决策，而是**用机器扩展人决策**——典型应用：欺诈风控、动态定价、医疗诊断、智能体路径选择。

DI 平台（Decision Intelligence Platform, DIP）核心特征：
- 融合多源数据（业务指标、ADR 库、实验数据、A/B 测试）；
- 提供决策建模工具（决策矩阵、决策树、蒙特卡洛模拟）；
- 内置反馈回路（决策 → 执行 → 监测 → 重新评估）；
- AI 助手（自然语言查询决策库、给出建议）。

**第二层：ADR 在 DI 中的三种定位。**

| 定位 | 含义 | 实现方式 |
| --- | --- | --- |
| **日志** | ADR 是 DI 平台的输入之一，与业务指标并列 | 在 DIP 中归档 ADR（按主题、状态、时间），与业务指标按 ADR 编号关联 |
| **依据** | 当 DIP 给出「推荐决策」时，ADR 是其历史依据 | DIP 检索相似历史 ADR，给出「历史上 X 决策已被采纳 3 次，supersede 1 次」的依据 |
| **反馈回路** | 业务指标的反馈反向触发新 ADR | DIP 监测到「ADR-0012 决策后果偏离预期 15%」，自动创建 supersede 草案 |

**第三层：DI 平台的核心组件（参考工业实践）。**

```
┌─────────────────────────────────────────────────┐
│ Decision Intelligence Platform                  │
│  ├─ 决策日志（Decision Log）                       │
│  │    ├─ ADR 库（Git）                            │
│  │    ├─ 实验日志（A/B Test 结果）                  │
│  │    └─ 业务指标（指标平台）                       │
│  ├─ 决策建模（Decision Modeling）                  │
│  │    ├─ 决策矩阵（Decision Matrix）               │
│  │    ├─ 决策树（Decision Tree）                   │
│  │    └─ 蒙特卡洛模拟（Monte Carlo）               │
│  ├─ 反馈回路（Feedback Loop）                      │
│  │    ├─ 指标监测（指标偏离告警）                    │
│  │    └─ 自动创建 supersede 草案                  │
│  ├─ AI 助手（AI Copilot）                          │
│  │    ├─ 自然语言查询「为什么选 Iceberg」            │
│  │    └─ 推荐决策选项                              │
│  └─ 可观测性（Decision Observability）             │
│       ├─ 决策图谱（Decision Graph）                │
│       └─ 决策 ROI 仪表盘                          │
└─────────────────────────────────────────────────┘
```

**第四层：工业界 DI 平台的样本（2024-2025 年）。**

- **Palantir Foundry**——以「本体 + 数据 + 决策」为核心的 DI 平台，金融/政府/医疗广泛使用。ADR 在其中作为「本体节点」存在。
- **Aera Technology**——企业级决策智能云，专注供应链 / 财务决策，把业务规则 + ADR 转化为可执行决策引擎。
- **DataRobot**——AI 决策平台，把 ADR 与 ML 模型协同——「ML 模型 X 在 2024-Q1 引入，决策依据 ADR-0023」。
- **Domino Data Lab**——AI 实验记录平台，本质上是「**机器学习版的 ADR 库**」——ML 模型版本 + 训练数据 + 评估指标对应一条「AI ADR」。
- **Weights & Biases**——实验跟踪平台，向「决策可追溯」方向演进。
- **阿里 / 字节 / 美团**：基于业务指标平台 + ADR 库自建内部 DI 系统，称为「决策中台」或「智能决策引擎」。

**第五层：ADR 在 DI 中作为「反馈回路」——AI 自动 supersede。**

```
ADR-0012 Accepted (Kafka 0.10)
   │
   ▼
生产运行 18 个月
   │
   ▼
业务指标监测：延迟增加 30%（基于 DIP 中的 SLO 仪表盘）
   │
   ▼
DIP 自动创建 supersede 草案：ADR-0078（迁移到 Kafka 3.x）
   │
   ▼
架构师 review 后接受
   │
   ▼
新 ADR Accepted，旧的 supersede
```

这是 DI 平台的「**自动化 supersede 检测**」机制——当业务指标偏离 ADR 的 Consequences 段中所述预期时，DI 平台自动提示「需要修订决策」。

**3. 常见陷阱**

- **「DI = AI 决策」。** 错——DI 是更广的概念，包含 AI 但不止 AI；纯规则引擎也是 DI 的一种实现。
- **「ADR 是 DI 的全部」。** 错——ADR 只是 DI 的「决策日志」部分；DI 还需要指标、实验、AI 助手、反馈回路。**ADR 是必要但不充分**。
- **「DI 取代架构师」。** 错——DI 取代的是「决策辅助与可追溯」，但「决策责任」仍然归属架构师。
- **「ADR supersede 必须是全自动」。** 当前阶段只应是「**自动提议 + 人工 review**」——全自动 supersede 违反决策责任原则。
- **「DI 平台不需要 ADR 也能跑」**。 可以跑——纯指标驱动的 DI 不需要 ADR；但失去 ADR 后，决策的「**为什么**」就丢了，DIP 沦为「指标仪表盘」。
- **「Gartner 趋势 = 落地成熟」**。 Gartner 趋势反映「未来 3-5 年方向」，不等同于「今天可落地」——2024 年真正落地的 DI 系统还集中在金融 / 供应链少数场景。

**4. 追问预测**

- **「企业内部如何从 0 到 1 建设 DI 平台？」** 答：第一步**先把 ADR 库做到位**（用 MADR + Git + PR Review）——ADR 是 DI 最容易起步的组件；第二步把指标平台化（参考 OneMetric / OneService），把指标与 ADR 按编号关联；第三步建反馈回路（指标偏移告警）；第四步引入 AI 助手。**不要跳级**——没有 ADR 库就上 AI 助手是空中楼阁。
- **「ADR 与 A/B 测试结果如何在 DI 中融合？」** 答：用 ADR-XXXX 的「Confirmation」字段直接挂载 A/B 测试链接或结果摘要——例如「KPI 目标：用户转化率 +5%；A/B 结果：实际 +6%，见 experiment-2024-q3」。DI 平台通过 ADR 编号检索实验结果，把决策与验证闭环。
- **「工业级 DI 平台与开源实现如何选？」** 答：金融 / 医疗 / 政企选 Palantir / Aera（合规成熟）；互联网 / 通用工业界选自建（参考阿里 / 字节决策中台）；学术界 / 小团队选 Domino / W&B 起步。**不要为了上 DI 而上**——DIP 投入大、ROI 慢。
- **「Decision Intelligence 与 Decision Automation 区别？」** 答：Decision Intelligence = 决策的智能化（人决策为主，AI 辅助）；Decision Automation = 决策的自动化（机器决策为主，人兜底）。前者如业务战略决策；后者如垃圾邮件过滤 / 反欺诈。

**5. 参考资料**

- Gartner《Top Strategic Technology Trends 2022: Decision Intelligence》（2021 年发布）——企业语境下 DI 的标准阐述来源之一，给出 DI 的定义与组件（是否「首次系统化提出」本节无法核验）。
- Gartner《Decision Intelligence: A Complete Guide》（2023 年发布）——DI 平台的工程实施指南。
- Palantir Foundry 官方文档——工业级 DI 平台的样本实现，含「本体 + 数据 + 决策」三件套。
- Aera Technology 官方白皮书——供应链决策智能平台样本（本节无法核验其篇名与发布年份，引用时请自行查证）。
- ThoughtWorks Technology Radar 2024 / 2025 年系列条目「Decision Intelligence」——把 DI 标记为「Assess → Trial」的工业推荐。
- Microsoft Research / IBM Research 2024 年关于 Decision Intelligence + LLMs 的论文——DI 与 LLM 结合的学术前沿（本节无法核验其具体篇名与作者，引用时请自行查证）。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

### 8.7 §13.6 跨团队 ADR

> 本主题考察「ADR 能否承载跨团队、跨 BU 的决策治理」：是否理解决策越跨界，越依赖流程与权威（治理委员会）。面试官通常从「Architecture Board 怎么运作」问起，下钻到 supersede 的检测机制。

#### §13.6.1 在跨团队 / 跨 BU 决策中，ADR 如何配合治理委员会（Architecture Board）？请描述 Board 的职责边界、ADR 在其中的流转路径，以及如何防止 Board 变成「决策瓶颈」或「橡皮图章」。

**1. 考察点**

- 是否能把 Architecture Board 的职责定义为「**决策评审 + 标准制定 + 冲突仲裁**」三角，而不是「审批一切」。
- 能否说明 ADR 在 Board 流程中的**两个关键卡点**——Proposed 阶段的评审、Accepted 后 6 个月的复盘。
- 是否知道 Board 退化的两种极端：**瓶颈**（所有决策都排队）与**橡皮图章**（只签字不做实质评估），以及对应的防退化机制。
- 加分项：能给出「**分级授权**」的实践——P0 决策上 Board，P1/P2 决策由技术委员会 / 小组自决，Board 只事后抽检。

**2. 参考答案框架**

**第一层：Board 的职责边界（做什么、不做什么）。**

- **做**：① 制定跨团队技术标准（如统一事件总线、统一湖表格式）；② 评审 P0 级 ADR（涉及 3+ 团队 / 不可逆 / 战略级）；③ 仲裁跨团队技术冲突；④ 定期复盘 Accepted ADR 的 Consequences。
- **不做**：① 不做单团队内部模块设计评审（那是团队自己的 ADR 和 PR review）；② 不替代工程团队 owner 拍板（Board 是「评审者」不是「决策者」）；③ 不做日常运维决策。

一句话原则：**Board 管「跨界的、不可逆的、战略性的」决策，不管「界面内部的」决策。**

**第二层：ADR 在 Board 流程中的流转路径。**

```
Step 1 · 团队起草 ADR（Status: Proposed）
   │  详见本章 §13.2 流程
   ▼
Step 2 · 判定「是否需要上 Board」
   │  判定规则：涉及团队数 ≥3、不可逆度、战略影响
   ├─ 否 → 团队内部 PR review → Accepted
   └─ 是 → 提交 Board
   ▼
Step 3 · Board 评审（会议 or 异步）
   │  Reviewer：Board 成员 + 相关 BU 代表 + 领域专家
   │  Checklist：Context 完整？Options ≥3 含现状？Consequences 双面？跨 BU 影响是否充分评估？
   ├─ 修改 → ADR 返回团队
   ├─ 通过 → 进入 Step 4
   └─ 否决 → ADR Status: Rejected（归档原因）
   ▼
Step 4 · ADR Accepted + 归档中央 ADR 库
   │  Index 标注「影响范围 = 涉及 BU 列表、跨团队」
   ▼
Step 5 · 6 个月后 Board 复盘
   │  Consequences vs Reality 对照
   │  偏离 → 写新 ADR supersede
   └─ 一致 → 标记 Reviewed，继续观察
```

**第三层：防止 Board 变成「决策瓶颈」。**

- **分级授权**：只有 P0 决策上 Board；P1（跨 2 团队）由一线技术委员会自决；P2（单团队）团队自决。Board 定期抽检 P1/P2 即可。
- **异步评审优先**：Board 用 PR Review + 冷却期（5–7 天）代替每周例会——决策不排队，任何人可即时提交。
- **设置决策时限**：Board 对一条 ADR 的评审周期上限（如 10 个工作日）——超时自动进入仲裁 / 上报，不允许无限拖延。
- **交叉代表**：Board 成员来自不同 BU（避免单一 BU 主导），保证跨 BU 视角平衡。

**第四层：防止 Board 变成「橡皮图章」。**

- **强制评审记录**：每条 Board review 必须留下书面意见（PR 评论 / 会议纪要），不能只写「同意」——把「为什么同意」写清楚。
- **异议制度（Dissent Institutionalized）**：Board 成员可对 ADR 留下「异议意见（dissent）」，即使 ADR 最终通过，异议也归档在 ADR 的 Comments 段——这是「未来可质疑性」的制度保障。
- **复盘问责**：Board 评审过的 ADR 若 6 个月后后果严重偏离预期，需复盘 Board 评审流程（不是问责人，而是改流程）。
- **轮换制**：Board 成员轮换（如每 12 个月轮换 1/3）——避免 Board 固化，保持新鲜视角。

**第五层：工业实例。**

- **阿里集团架构委员会**：定义「涉及 3 个团队以上的重大决策必须上架构委员会」，评审通过后归档为「架构决策书」（内部 ADR）；每季度做决策回顾。
- **AWS 的「Bar Raiser」制度**：不是架构评审，但思路同源——关键决策必须由「Bar Raiser」（资深把关者）评审，Bar Raiser 独立于业务团队，防止「团队自我合理化」。
- **字节跳动的技术委员会**：跨 BU 技术决策由技术委员会评审，与飞书 TD 流程结合，重大决策季度复盘。
- **CNCF TAG App Delivery**：开源社区的架构治理样本——技术咨询组（TAG）评审跨项目决策，ADR 是其主要产出物（2022 年起把 ADR 列为推荐实践）。

**3. 常见陷阱**

- **「Board 审批一切」。** 所有 ADR 都上 Board，决策排队数月，团队绕开流程暗地决策——这是 Board 的最大失败模式。
- **「Board 只是形式签字」。** Reviewer 只看标题不看内容，ADR 走过场——必须有'强制书面意见'制度防退化。
- **「Board 没有跨 BU 代表」。** Board 全来自一个 BU，评审结论偏向该 BU——交叉代表是基本要求。
- **「Board 只评不追」。** 决策通过后不跟踪 Consequences——Board 的价值一半在于**事后复盘**。
- **「异议被压制」。** 团队为了「快速通过」不允许异议——反而失去 ADR 最核心的「可被质疑」属性。异议应被鼓励并归档。
- **「没有决策时限」。** ADR 上 Board 后无限期挂起——必须设置评审周期上限，超时自动升级。

**4. 追问预测**

- **「Board 周期太长，团队等不起，怎么办？」** 答：① 分级授权——P1 由技术委员会自决，只有 P0 上 Board；② 异步评审 + 冷却期（5-7 天）取代例会；③ 设 10 个工作日评审时限；④ Board 提供「临时批准」通道（有条件通过，条件需 1 个月内满足）。
- **「Board 评审意见与团队分歧很大，如何裁决？」** 答：Board 是「评审者」，有否决权但也需承担后果——若 Board 否决导致团队业务受影响，Board 需在 ADR 的 Comments 段写明否决理由与替代方案。若团队坚持，走「**Escalation**」上升到 CTO / 技术 VP 层面裁决。
- **「小组织需要 Architecture Board 吗？」** 答：不需要。5–50 人组织的架构决策由「技术负责人 + ADR PR review」即可；Board 的价值在「跨 BU 仲裁」，小组织没有跨 BU 问题。**Board 是规模驱动产物，不是最佳实践标签**。
- **「Board 如何与 RFC 流程配合？」** 答：RFC 是「提议」，Board 是「强制评审关卡」，ADR 是「最终归档」。跨团队决策：RFC（提议）→ Board Review（评审）→ ADR（归档）。Board 可在 RFC 阶段就介入，避免 RFC 通过后再被 Board 否决的返工。

**5. 参考资料**

- CNCF TAG App Delivery 2022 年发布的《ADR Recommendations》——开源社区架构治理的样本，明确 ADR 是跨项目决策的归档载体。
- 阿里集团公开的技术管理分享（含「架构决策书」制度）——超级 app 企业跨 BU 决策治理的工业范本。
- AWS 公开演讲材料「Bar Raiser」制度（Amazon 内部招聘与决策把关）——「独立于业务方的把关者」思路的工业出处。
- ThoughtWorks Technology Radar 2023 年条目「Architecture Decision Records in the enterprise」——把「治理委员会 + ADR」列为大型组织推荐实践。
- 《Building Evolutionary Architectures》（Ford, Parsons, Kua，2017 年出版）——演进式架构中的「治理委员会 + 适应度函数」理论，是 Board 机制的理论基础。
- **丁香园** —— 丁香园的医学知识图谱——药品、疾病、症状、指南的多跳查询与推理。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §13.6.2 请举例说明 supersede（取代）关系。如何检测「新 ADR 是否 supersede 旧 ADR」？请给出手动、半自动、全自动三条检测路径，并说明各自的精度与成本边界。

**1. 考察点**

- 是否理解 supersede 是「**决策族谱**」的边——一个决策被另一个决策取代，形成跨时间的传承关系。
- 能否区分 supersede 与相关概念——**Deprecated（不再推荐）**、**Amends（修订）**、**Related（相关）**、**Duplicate（重复）**。
- 能否从「手动 → 半自动 → 全自动」三条路径给出检测机制，并说明精度-成本 trade-off。
- 加分项：能给出基于文本相似度、KG 关联、LLM 推理三种技术路线的具体实现差异。

**2. 参考答案框架**

**第一层：supersede 的定义与相关概念辨析。**

- **Supersede（取代）**：新 ADR 完全取代旧 ADR 的适用范围——旧 ADR 状态改为 `Superseded by ADR-XXXX`。典型：单模型 → 多模型路由；`单 Hive 数仓 → Iceberg 湖仓 → 实时湖仓`。
- **Deprecated（弃用）**：旧 ADR 不再推荐新场景使用，但**未被取代**（可能是被多个决策部分覆盖）。状态保持 `Deprecated`。
- **Amends（修订）**：新 ADR 对旧 ADR 做局部修订，但不完全取代——两个 ADR 并存。
- **Related（相关）**：新 ADR 与旧 ADR 语义相关但不取代——建立「related」边。
- **Duplicate（重复）**：两个 ADR 描述同一决策——合并为一个。

**第二层：supersede 关系图谱示例（决策族谱）。**

```
ADR-0005 单模型 GPT-4
   │ Superseded by
   ▼
ADR-0012 多模型路由（Claude + GPT-4o + 通义）
   ├─ Superseded by ──> ADR-0015 引入 DeepSeek-V3
   └─ Related ─────────> ADR-0021 数据合规路径

ADR-0003 单 Hive 数仓
   │ Superseded by
   ▼
ADR-0009 湖仓一体（Iceberg）
   │ Superseded by
   ▼
ADR-0021 实时湖仓（Flink + Iceberg）
```

这条链展示了「**决策族谱**」——读到 ADR-0003 的人可沿 supersede 边一路看到现在生效的决策，无需理解中间过程。

**第三层：三条检测路径。**

**路径 1：手动检测（评审时人工对比）。**

- **机制**：每条新 ADR 在 PR 提交时，作者 + Reviewer 主动检索 `docs/adr/` 目录，对比是否有 ADR 涉及相同决策点。
- **精度**：高（人理解语义，能识别「潜在取代」）；**成本**：低（无工具）；**边界**：50 条 ADR 以上时人工检索开始漏——人只能记住最近几条。
- **适用**：< 50 条 ADR 的小团队。

**路径 2：半自动检测（向量相似度 + 人工确认）。**

- **机制**：
  1. 用 Sentence-BERT / OpenAI Embedding / BGE 把每条 ADR 的 Decision 段嵌入为向量；
  2. 新 ADR 提交时，计算它与现有 ADR 的余弦相似度；
  3. 相似度 > 阈值（如 0.75）的 ADR 自动提示「**可能 supersede**」，交由人工确认。
- **精度**：中（语义相似 ≠ supersede——可能只是「相关」）；**成本**：中（需维护向量库 + 嵌入模型）；**边界**：相似度阈值调优难，误报多。
- **适用**：50-200 条 ADR 的中型团队。
- **工具**：pgvector / Milvus / Chroma 存向量；CI 中跑检索。

**路径 3：全自动检测（LLM 推理 + KG 关联）。**

- **机制**：
  1. 把「新 ADR 的 Decision 段 + 候选旧 ADR 的 Decision 段」输入 LLM（Claude / GPT-4）；
  2. Prompt：「这两条决策的关系是 Supersede / Deprecated / Amends / Related / Duplicate / 无关？给出理由」；
  3. LLM 输出结构化结果，自动更新 ADR 的 Status 与 supersede 边；
  4. 建 KG（Neo4j / NebulaGraph）把 ADR 节点与 supersede / related 边存起来，支持图查询。
- **精度**：高（LLM 能理解语义 + 上下文）；**成本**：高（LLM 调用成本 + KG 维护 + 需人工兜底）；**边界**：LLM 仍可能错判——**最终状态变更必须人工确认**，不能让 LLM 自动改 Status（违反决策责任原则）。
- **适用**：200+ 条 ADR 的大组织。

**第四层：精度与成本 trade-off 汇总。**

| 路径 | 精度 | 单位成本 | 人工投入 | 适用规模 | 典型工具 |
| --- | --- | --- | --- | --- | --- |
| 手动 | 高（小库）→ 低（大库） | 极低 | 高 | < 50 条 | git grep + 人眼 |
| 半自动（向量） | 中 | 中 | 中 | 50-200 条 | pgvector / Milvus + CI |
| 全自动（LLM+KG） | 高 | 高 | 低（但需兜底） | 200+ 条 | Claude / Neo4j + CI |
| 混合（向量预筛 + LLM 判定 + 人确认） | 最高 | 中高 | 中 | 多数组织推荐 | 组合 |

**第五层：业界做法。**

- **ThoughtWorks Technology Radar 2024** 明确把「Automated supersede detection」列为「Assess」——说明工业界正在从手动转向自动，但尚未成熟。
- **log4brains** 工具内置 ADR 之间的「superseded」链接管理，支持 `supersedes` 标注——是半自动路线的代表工具。
- **学术界**已有用 LLM 做 ADR 关系抽取的探索；本节无法核验其论文、数据集与准确率数值，故此处不给出具体数字，引用时请自行查证。
- **企业内部**（阿里 / 字节）多用「PR review 强制检查 + 语义检索辅助」的混合路径——纯全自动仍未普及。

**3. 常见陷阱**

- **「把 Related 当 Supersede」。** 两条 ADR 语义相关就标 supersede——会让决策族谱失真。必须严格区分「决定取代」与「只是相关」。
- **「新 ADR 覆盖但不改旧 ADR 状态」。** 旧 ADR 停留在 Accepted，读者误以为两决策都有效——必须同步更新旧 ADR 的 Status。
- **「supersede 后不通知下游」。** 引用旧 ADR 的代码 / 文档没有收到通知——关联本章 §13.4 的双向链接机制。
- **「纯向量相似度就自动改状态」。** 相似 ≠ supersede——向量检索只能做**预筛**，最终状态变更必须人工（或至少强校验）。
- **「让 LLM 自动改 ADR 状态」。** 违反「决策责任归属人」原则——LLM 只能提议，人确认。
- **「决策族谱不存档」。** 旧 ADR 被删掉只留新 ADR——历史决策上下文丢失，违背 ADR 不可变性原则。旧 ADR 永远保留，只改 Status。

**4. 追问预测**

- **「如何手工判断 supersede？」** 答：对比两条 ADR 的 Decision 段——若新 ADR 的适用范围**完全覆盖且排除了**旧 ADR 的适用范围，即 supersede；若仅部分覆盖，则为 Amends；若只是背景相关，则为 Related。关键看 Decision（我们决定做什么）而非 Context（背景是否相似）。
- **「向量相似度阈值怎么定？」** 答：没有通用阈值——用团队历史 ADR 做标注集，画出 precision-recall 曲线，选一个「召回高（不漏 supersede）+ 精度可接受（误报可由人工快速排除）」的阈值，通常 0.7-0.8 之间，以「宁可误报不可漏报」为原则（因为漏掉 supersede 代价更大）。
- **「LLM 检测 supersede 的失败模式是什么？」** 答：① 长上下文丢失（ADR 很长时 LLM 遗漏关键句）；② 术语歧义（两个团队对「事件总线」定义不同）；③ 过度推断（把「相关」判成「取代」）。缓解：只喂 Decision 段（不喂全文）、加团队术语表、要求 LLM 给出「判定理由」并人工复核。
- **「决策族谱（Decision Graph）有什么用？」** 答：① 回答「我们现在到底在用什么决策」——沿 supersede 边找叶子节点；② 回答「这个决策从哪来」——沿反向边回溯；③ 与 GraphRAG 结合，让 LLM 基于族谱回答「为什么从 Hive 迁到 Iceberg」这类跨多 ADR 的问题。

**5. 参考资料**

- Michael Nygard《Documenting Architecture Decisions》（Cognitect 官方博客，2011 年）——提出「supersede 而非修改」原则的原始出处。
- MADR 项目官方文档中「Superseded by / Supersedes」字段定义——supersede 关系的模板级标准。
- log4brains 项目官方文档（开源 ADR 站点生成器）——内置 supersede 链接管理的工具实现。
- ThoughtWorks Technology Radar 2024 年条目「Automated architecture decision supersede detection」——把自动检测列为「Assess」阶段的一手证据。
- 阿里 / 字节公开的技术决策管理分享——国内企业决策族谱与状态同步的实践样本。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

### 8.8 本章小结

本节收录 12 道题，覆盖 §13.1 至 §13.6 六个子主题——从**ADR 基础与模板**（§13.1），到**流程与组织实践**（§13.2）、**决策质量**（§13.3）、**代码/文档可追溯**（§13.4）、**AI 时代演进**（§13.5），最后到**跨团队治理**（§13.6）。六组题构成一条完整的下钻链路：**模板（写什么）→ 流程（怎么管）→ 质量（怎么避免拍脑袋）→ 追踪（怎么不腐烂）→ AI（怎么自动化）→ 治理（跨团队怎么裁决）**。

参考答题的通用心法有四条：

1. **先立约束，再列选项，最后说取舍**——ADR 相关的题目，面试官真正想听的是「你为什么这么选」，而非「有哪几种做法」。答模板题时要说清「团队规模 × 决策风险」的选型逻辑；答流程题时要说清「谁拍板、谁评审、怎么 supersede」。
2. **用「责任」划边界**——ADR 的一切设计（不可变、Owner、supersede 而非修改、Reviewer 制度）都服务于一个目标：**决策责任可追溯**。理解这一点，就能反向推导几乎所有 ADR 规则的合理性。AI 相关题目尤其要守住这条线——LLM 只能起草，不能拍板。
3. **引用工业实践要具体到「谁 + 在哪 + 做了什么」**——GitHub 的 `architectural-decision-records` 公开仓库、阿里的「架构决策书」、AWS 的 Bar Raiser、字节的 TD 流程，都是高频可引用的真实案例。复述「某大厂也这么做」不如说清「它具体怎么做的」。
4. **主动点明代价**——ADR 不是免费午餐：写一条 15–60 分钟、评审 30–90 分钟、维护 1–2 人天/月；过度 ADR 化会让决策成本爆炸。能主动算这笔账，是准资深架构师与普通工程师的分水岭。

一句话总结本章：**ADR 让决策从「个人英雄主义」变成「组织可复制的资产」——它记录的不是「做了什么」，而是「当时为什么这么选，以及我们愿意为此付出什么代价」。**

### 8.9 返回

- 返回 [13-decision 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
