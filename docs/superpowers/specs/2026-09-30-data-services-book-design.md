# 数据服务的方方面面（对标 P9） — 项目结构设计

> 本规格记录本仓库的目录骨架、各章主题、写作规范、README 提纲。
>
> **更新记录**：
> - **2026-09-30**：初版，6 章「技术演进时间线」结构（数仓 / 数据湖 / 多模态 / 向量湖 / 数据服务平台 / DataAgent）
> - **2026-10-08**：重构为 **10 章 P9 能力分层结构**（commit `f1aa559`），本 spec 同步更新

## 1. 项目定位

- **名称**：`data-travel`
- **形态**：纯 Markdown 书籍型文章项目，无构建步骤，所有内容直接可读。
- **目标**：以「**数据服务的方方面面**」为题，按 **P9 数据架构师能力分层**梳理全景——从建模方法论到团队管理，串起 P9 工程师所需的全部能力栈、方法论、工程实践。
- **目标读者**（全栈覆盖）：
  - 数据工程师 / 数仓开发（初中级）
  - 数据架构师 / 资深工程师
  - AI 应用工程师（向量 / Agent 方向）
  - 平台与治理同学
  - 团队负责人 / 准 P9（**核心目标读者**）
- **写作基调**：**原理 + 架构决策 + 实战**三者兼具；每章不必强制统一模板，按需组织。
- **代码示例**：以 SQL / Python / YAML / Docker Compose / 配置文件为主；优先可运行片段。

## 2. 主线（6 层次 + 4 横线）

> P9 数据架构师的能力 = **6 个能力层次**（对应 10 个章节）+ **4 条横线**（贯穿全程）。

### 6 个能力层次

| 层次 | 章节 | 主题 |
| --- | --- | --- |
| 基础层 · 方法论 | Ch1 | 建模方法论 |
| 技术层 · 引擎 | Ch2 / Ch3 | 存储范式 / 计算范式 |
| 能力层 · 服务化与智能化 | Ch4 / Ch5 | 数据中台与服务化 / AI 原生数据栈 |
| 工程层 · 横切与大促 | Ch6 / Ch7 | 横切工程 / 架构与高可用 |
| 领导层 · 决策与组织 | Ch8 / Ch9 | 决策与权衡 / 团队管理与领导力 |
| 案例层 · 工业级实践 | Ch10 | 案例库 |

> 简化的能力主线（9 段表述）：**建模 → 引擎 → 服务化 → AI → 工程 → 架构 → 决策 → 团队 → 案例**
>
> 其中「引擎 = 存储 + 计算」、「服务化 = 中台」、「工程 = 横切」、「架构 = 高可用」。

### 4 条横线（贯穿 Ch1–Ch10）

- **可治理**：血缘、权限、审计、分类分级
- **可观测**：监控、告警、链路追踪、SLO
- **可计量**：成本、计费、资源利用率
- **可演进**：架构演进、技术债管理、迁移策略

## 3. 目录骨架（书籍风格）

```
data-travel/
├── README.md                                # 门面：定位、目录速览、阅读路径、章节导图、横切索引
├── LICENSE                                  # Apache License 2.0
├── docs/
│   ├── career/                              # P7→P8→P9 成长路径与能力模型
│   │   └── README.md
│   ├── interview/                           # P9 面试题库（系统设计、选型、案例、复盘）
│   │   └── README.md
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-09-30-data-services-book-design.md   # 本文档
│       └── plans/
│           └── 2026-09-30-book-scaffolding.md            # 初版脚手架计划（已 SUPERSEDED，保留为历史记录）
├── 00-introduction/                         # 序章 · P9 数据架构师的全景图
│   └── README.md
├── 01-modeling/                             # Ch1 建模方法论
│   ├── README.md                            # 章节导读（必含）
│   └── …（子节文件，按作者需要命名）
├── 02-storage/                              # Ch2 存储范式
│   └── README.md + 子节文件
├── 03-compute/                              # Ch3 计算范式
│   └── README.md + 子节文件
├── 04-data-mesh-and-middleware/             # Ch4 数据中台与服务化
│   └── README.md + 子节文件
├── 05-ai-native-data-stack/                 # Ch5 AI 原生数据栈
│   └── README.md + 子节文件
├── 06-cross-cutting-engineering/            # Ch6 横切工程
│   └── README.md + 子节文件
├── 07-architecture-and-reliability/         # Ch7 架构与高可用
│   └── README.md + 子节文件
├── 08-decision-and-tradeoff/                # Ch8 决策与权衡
│   └── README.md + 子节文件
├── 09-team-and-leadership/                  # Ch9 团队管理与领导力
│   └── README.md + 子节文件
├── 10-case-studies/                         # Ch10 案例库
│   └── README.md + 子节文件
└── 99-outro/                                # 后记 · 趋势与思考
    └── README.md
```

> **强约束**：每个章节目录下必须有一份 `README.md` 作为该章导读页（含「一句话定位 / 难度 / 推荐角色 / 子主题列表 / 前置章节」）。
>
> **软约束**：子节文件名由作者自由决定。**默认建议**（供参考、不强制）：
> - `principles.md` 原理与概念
> - `architecture.md` 架构决策
> - `hands-on.md` 实战搭建
> - `tuning.md` 调优与踩坑
> - `summary.md` 参考架构与小结
> - `refs.md` 参考资料
>
> 灵活结构下，作者可合并（如 `principles-and-architecture.md`）、拆分（如再开 `*-case-study.md`）或按子主题重命名（如 `vector-index.md` / `embedding-models.md`）。

## 4. 各章主题与重点

### 00 序章（`00-introduction/`）

- **核心问题**：P9 数据架构师的能力地图是什么？该如何按角色读这本书？
- **内容**：
  - P9 能力地图（6 层次 + 4 横线的 Mermaid 全景图）
  - 为什么按这个顺序读（能力分层 vs 技术时间线）
  - 难度梯度表（章级难度 + 推荐角色 + 前置章节）
  - 角色推荐阅读路径（5 类读者：数据工程师 / 架构师 / AI 应用 / 平台治理 / 准 P9）
  - 跨章术语表（Glossary）
- **特点**：总论 / 全景图，自身无技术子主题；为后续章节提供「能力地图」。

### Ch1 建模方法论（`01-modeling/`）

- **核心问题**：从业务过程到数据模型，P9 的第一道分水岭
- **原理**：维度建模（Kimball）、Data Vault、Anchor Modeling、数仓分层（ODS/DWD/DWS/ADS）、OneData、OneID
- **架构决策**：ER vs 维度 vs Data Vault、OneData 落地路径
- **实战**：用 DataWorks / 阿里中台工具链建模；指标体系设计
- **调优**：命名规范、版本管理、Owner 制度、模型评审
- **小结**：P7 会「建表」，P8 会「建模型」，P9 会「建体系」

### Ch2 存储范式（`02-storage/`）

- **核心问题**：从数仓到 AI 原生数据库，理解每一代存储引擎的设计取舍
- **原理**：数仓 / 数据湖 / 湖仓一体、Table Format（Iceberg / Hudi / Paimon / Delta）、Schema Evolution、Time Travel、Hidden Partitioning
- **架构决策**：Iceberg / Hudi / Paimon / Delta 选型；存算分离 vs 存算一体
- **实战**：用 MinIO + Iceberg + Trino 搭本地湖仓；流式写入 Hudi MOR 表
- **调优**：小文件、Compaction、Z-Order、冷热分层、成本优化
- **小结**：3 分钟内判断该选哪类存储

### Ch3 计算范式（`03-compute/`）

- **核心问题**：离线 / 实时 / OLAP / AI 训练推理——四类计算引擎的统一视角与选型决策
- **原理**：Lambda vs Kappa、流批一体、查询优化器（Calcite / Velox）、资源调度
- **架构决策**：Flink / Spark / Trino 选型；OLAP 引擎（Hologres / StarRocks / ClickHouse / Doris / Druid）选型
- **实战**：流批一体 + Iceberg 实战
- **调优**：状态管理、Checkpoint、Exactly-Once、反压
- **小结**：判断何时引入 Flink、何时批处理够用；流批一体的演进路径

### Ch4 数据中台与服务化（`04-data-mesh-and-middleware/`）

- **核心问题**：阿里 OneData / OneID / OneService 方法论与工程落地
- **原理**：指标平台 / Headless BI、Data Mesh、Data API、Data Catalog、血缘、查询网关
- **架构决策**：中台 vs Data Mesh、指标平台 vs Data API Gateway vs 统一查询网关；元数据 vs 血缘 vs 资产
- **实战**：用 Trino + DataHub + OpenFGA 搭最小数据服务平台
- **调优**：查询路由、缓存（Redis / Alluxio）、限流、降级、计费埋点
- **小结**：让全公司用同一套「数据语言」做决策

### Ch5 AI 原生数据栈（`05-ai-native-data-stack/`）

- **核心问题**：Feature Store、RAG、DataAgent、决策智能——AI 时代数据架构师必须掌握的新一代数据栈
- **原理**：Embedding 模型、ANN 索引（HNSW / IVF / ScaNN）、量化（PQ / SQ）、混合检索、Agent 架构（Plan-Execute-Observe-Reflect）、MCP
- **架构决策**：Feature Store 选型；向量库 vs 向量湖 vs AI 原生数据库
- **实战**：用 Milvus + Spark + OSS 搭 RAG 检索层
- **调优**：索引参数、Recall@K、Embedding 选型、Reranker
- **小结**：2026 年的 P9 = 60% 数据 + 40% AI

### Ch6 横切工程（`06-cross-cutting-engineering/`）

- **核心问题**：数据质量、安全、成本、可观测——四类横切工程能力，决定数据平台的「工程成熟度」
- **原理**：DQC（Data Quality Center）、分类分级、脱敏、加密、审计、FinOps、隐私计算
- **架构决策**：SLA 体系、监控告警分级、血缘采集
- **实战**：搭建数据可观测性平台；GDPR / 个保法合规
- **调优**：成本优化 30-50%；小文件 / Compaction / 查询优化
- **小结**：P9 不只让系统跑起来，还要让系统「长期、可靠、可控」地跑

### Ch7 架构与高可用（`07-architecture-and-reliability/`）

- **核心问题**：单元化、多活、大促保障、容量规划——P9 数据架构师的「硬功夫」
- **原理**：Cell-Based Architecture、CDC、binlog 双向同步、同城双活、两地三中心、RPO / RTO
- **架构决策**：异地多活方案、压测方案、混沌工程
- **实战**：双 11 全链路稳定性方案
- **调优**：性能工程、慢查询治理、灰度与回滚
- **小结**：P9 必须扛得住「老板最怕的事」——双 11 流量洪峰下的系统稳定性

### Ch8 决策与权衡（`08-decision-and-tradeoff/`）

- **核心问题**：P9 的「软分水岭」——在不确定的工程世界里，做出正确、可被全公司复用的架构决策
- **原理**：ADR（架构决策记录）、选型决策框架、FMEA、故障树分析、技术战略 3-5 年路线图
- **架构决策**：自研 vs 采购、伪自研陷阱、技术债管理
- **实战**：写 ADR、组织级技术决策流程
- **调优**：决策心理学（锚定效应、确认偏误、沉没成本、群体思维）
- **小结**：P8 能执行，P9 能决策

### Ch9 团队管理与领导力（`09-team-and-leadership/`）

- **核心问题**：P9 的硬功夫——带人、做事、影响组织
- **原理**：人才画像（P5/P6/P7/P8/P9）、结构化面试、绩效管理（KPI / OKR）、跨团队协作、向上管理
- **架构决策**：团队拓扑（Team Topologies）、远程团队管理
- **实战**：P7→P8 / P8→P9 晋升答辩辅导；1:1、OJT、IDP
- **调优**：绩效面谈、末位淘汰、激励组合
- **小结**：P9 不是「最会写代码的人」，而是「能让一群人写出好代码的人」

### Ch10 案例库（`10-case-studies/`）

- **核心问题**：从真实工业级实践中学习
- **原理**：背景 / 挑战 / 架构演进 / 关键决策 / 踩坑 / 复用经验 的标准化案例结构
- **架构决策**：阿里数据中台演进、双 11 稳定性、字节数据架构、Netflix Keystone → Metaflow、Uber Schemaless → Docstore、Airbnb Minerva
- **实战**：美团特征平台、字节 Lakehouse + 实时
- **调优**：失败案例（被废弃的中台、过度设计的湖仓、失败的 AI 项目）
- **小结**：P9 面试要的是「你研究过真实的工业级问题」

### 99 后记（`99-outro/`）

- **核心问题**：数据架构正在向何处去？给准 P9 工程师的几句话
- **趋势**：自治数据库、AI 原生数据栈、语义层崛起、Data Mesh 在中国落地、决策智能、隐私计算
- **写给准 P9 工程师**：技术深度只是入场券；选对战场比埋头努力更重要；把每一次故障转化为组织能力；长期主义 vs 短期交付；写作是 P9 的杠杆
- **后续更新计划**：按季度推进各章正文初稿

## 5. README 提纲

根目录 `README.md` 的内容结构：

1. **项目定位**：用一句话说清这是「对标 P9 数据架构师成长」的开源书
2. **目录速览**（含表格）：12 行（00 序章 + Ch1-Ch10 + 99 后记），列：序号、章节名、核心问题、难度（★ 数）、推荐角色
3. **阅读路径**：5 类读者的必读 / 选读 / 可跳读
4. **章节导图**：Mermaid 横向时间线 / 全景图（12 节点：00 + Ch1-Ch10 + 99）
5. **横切主题索引**：4 条横线的主要承载章节
6. **辅助资源**：docs/interview/、docs/career/、docs/superpowers/specs/、docs/superpowers/plans/
7. **术语表**：超链接到 `00-introduction/README.md#术语表`
8. **写作约定**：引用规范、目录命名、文件命名、提交规范
9. **贡献指南**：如何新增章节 / 提交勘误
10. **许可**：Apache License 2.0
11. **作者与联系方式**

每章 `README.md` 的内容结构（强约束 5 项）：

1. **一句话定位**（blockquote）：本章解决的核心问题（00 / 99 用「本章定位」表述）
2. **基本信息**：难度（★ 数）、推荐角色、前置章节、后续章节
3. **本章要回答的核心问题**（3-7 个问句）
4. **子主题列表（占位）**：用 `- [ ]` checkbox 列出计划覆盖的子主题
5. **文件命名建议**（可选）：`principles.md` / `architecture.md` / `hands-on.md` / `tuning.md` / `summary.md` / `refs.md`
6. **与 P9 能力的对应**（Ch2-Ch10 必含，00/01 可用「为什么这一章放在最前」替代）
7. **推荐资料 / 下一步**（引导跳转）

## 6. 命名与写作约定

- 章节目录：两位数字 + 短横 + 英文 slug（例：`01-modeling` / `04-data-mesh-and-middleware`）
- 文件名：小写、连字符；中文内容不放在文件名里
- 图片：放在各章 `images/` 子目录；优先 SVG / Mermaid
- 代码：放在各章 `code/` 子目录；引用使用相对路径
- 章节内部小标题层级：`##` 起步，避免 `###` 超过 3 层
- Markdown Lint：建议遵循 markdownlint 规则（标题层级、空行、代码块围栏等）
- 提交规范：沿用 Conventional Commits（`feat:` / `fix:` / `docs:` / `chore:` / `refactor:`）
- 跨章相对路径：从 `docs/<sub>/README.md` 出发时，主章节用 `../../0X-<slug>/`（两级向上）

## 7. 本次交付范围（历史）

> **本节为初版（2026-09-30）交付范围记录**，**2026-10-08 重构后已 superseded**。
>
> 初版 spec 描述「总论 + 6 章主体 + 后记」结构（数仓 / 数据湖 / 多模态 / 向量湖 / 数据服务平台 / DataAgent），按技术演进时间线组织。
>
> 2026-10-08 重构（commit `f1aa559`：`refactor!: restructure to P9-aligned 10-chapter layout with team management`）改为「总论 + 10 章主体 + 后记」按 P9 能力分层组织，新增 Ch7 架构与高可用、Ch8 决策与权衡、Ch9 团队管理与领导力、Ch10 案例库。
>
> 本次 spec 同步更新以反映新结构。

## 8. 风险与不做的事

- **不做**：CI / 构建 / 站点发布（如 mkdocs / vitepress）；保持纯 Markdown 仓库
- **不做**：翻译 / 多语言版本（除非读者后续要求）
- **风险**：若后续加入站点构建，章节目录下需添加 `_category_.json` 或类似配置；目前以纯仓库方式起步，保持最低耦合
- **风险**：每章内部子节文件若用纯数字编号命名（`01-xxx.md`），增删时会引发引用混乱；本 spec 改为**语义命名**（`principles.md` / `architecture.md` …）并允许作者按需调整
- **风险**：P9 能力分层结构与读者既有「按技术时间线」的预期不同；阅读路径设计需明确「按能力而非时间」
- **风险**：当前各章仅有 README.md 骨架，**子节正文（principles.md / architecture.md / hands-on.md 等）尚未写作**；按需按章独立推进，每章完成后单独 PR

---

确认本设计后，下一步进入各章正文写作（按章独立推进，每章完成后单独 PR）。
