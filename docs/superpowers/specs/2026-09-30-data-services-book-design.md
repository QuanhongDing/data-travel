# 数据服务的方方面面 — 项目结构设计

> 本规格记录本仓库的目录骨架、各章主题、写作规范、README 提纲。

## 1. 项目定位

- **名称**：`data-travel`（暂定，沿用 git remote 名）
- **形态**：纯 Markdown 书籍型文章项目，无构建步骤，所有内容直接可读。
- **目标**：以「**数据服务的方方面面**」为题，按**技术演进时间线**梳理从传统数仓到 AI 原生数据栈的全景。
- **目标读者**（全栈覆盖）：
  - 数据工程师 / 数仓开发（初中级）
  - 数据架构师 / 资深工程师
  - AI 应用工程师（向量 / Agent 方向）
  - 平台与治理同学
- **写作基调**：**原理 + 架构决策 + 实战**三者兼具；每章不必强制统一模板，按需组织。
- **代码示例**：以 SQL / Python / YAML / Docker Compose / 配置文件为主；优先可运行片段。

## 2. 主线

> 数据存储与处理范式从「表（结构化）」到「对象（多模态）」再到「语义（AI 原生）」的不断演进，叠加「服务化」与「智能化」两条横线。

```
[传统]         [湖仓]          [多模态]        [AI 原生存储]    [服务化]              [智能化]
Ch1 数仓  ──►  Ch2 数据湖  ──►  Ch3 多模态  ──►  Ch4 向量湖  ──►  Ch5 数据服务能力平台  ──►  Ch6 DataAgent
```

## 3. 目录骨架（书籍风格）

```
data-travel/
├── README.md                    # 门面：定位、章节导图、难度梯度、角色路径、术语表
├── LICENSE                      # 已有
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-09-30-data-services-book-design.md
├── 00-introduction/             # 序章 / 总论
│   └── README.md
├── 01-data-warehouse/           # Ch1 数据仓库
│   ├── README.md                # 章节导读（必含）
│   └── …（子节文件，按作者需要命名）
├── 02-data-lake/
│   └── README.md + 子节文件
├── 03-multimodal-db/
│   └── README.md + 子节文件
├── 04-vector-lake/
│   └── README.md + 子节文件
├── 05-data-service-platform/
│   └── README.md + 子节文件
├── 06-dataagent/
│   └── README.md + 子节文件
└── 99-outro/                    # 后记：趋势与思考
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

- 全景图（一张 SVG / Mermaid 大图）
- 为什么按这个顺序读
- **难度梯度表**（章级难度 + 推荐角色）
- **角色推荐阅读路径**（按 3-4 类读者给出「必读 / 选读 / 可跳读」建议）
- 术语表（Glossary）

### Ch1 数据仓库（`01-data-warehouse/`）

- **核心问题**：如何搭建一个能稳定支撑 BI 与离线分析的数仓？
- **原理**：维度建模（Kimball）、数仓分层（ODS/DWD/DWS/ADS）、星型/雪花模型、ETL vs ELT、OLAP 引擎原理
- **架构决策**：Hive / Spark / Flink 选型；Doris / StarRocks / ClickHouse / Druid 选型；调度系统（Airflow / DolphinScheduler / Azkaban）
- **实战**：用 Docker Compose 起一个 Doris + DolphinScheduler 最小数仓；分层建模示例；指标定义示例
- **调优**：分区、bucket、物化视图、查询改写
- **小结**：典型架构图、适用与不适用场景

### Ch2 数据湖（`02-data-lake/`）

- **核心问题**：从「库」到「湖」，如何处理半结构化 / 非结构化数据并兼顾事务？
- **原理**：Lakehouse 概念、Table Format（Iceberg / Hudi / Paimon / Delta）、Schema Evolution、Hidden Partitioning、Time Travel、对象存储
- **架构决策**：存储格式（Parquet / ORC / Avro）、计算引擎（Spark / Flink / Trino）、存算分离 vs 存算一体
- **实战**：用 MinIO + Iceberg + Trino 搭一个本地湖仓；流式写入 Hudi/MOR 表
- **调优**：小文件、Compaction、Z-Order、查询计划
- **小结**：湖 vs 仓 vs 湖仓一体

### Ch3 多模态数据库（`03-multimodal-db/`）

- **核心问题**：不同形态的数据（文档、时序、图、宽表、KV、搜索）如何选型与协同？
- **原理**：NoSQL 分类、CAP 权衡、HTAP、时序压缩（图/TSM）、倒排索引、图存储（属性图 vs RDF）
- **架构决策**：MongoDB（文档）/ InfluxDB & TimescaleDB（时序）/ Neo4j & NebulaGraph（图）/ Elasticsearch & OpenSearch（搜索）/ TiDB & CockroachDB（HTAP）/ Redis（KV 缓存）
- **实战**：用 docker-compose 起一个「文档 + 时序 + 搜索 + 图」四件套；多模态联合查询示例
- **调优**：索引设计、分片策略、冷热分层
- **小结**：多模态融合架构

### Ch4 向量湖（`04-vector-lake/`）

- **核心问题**：如何为 AI 应用提供大规模、低延迟、可治理的向量检索基础设施？
- **原理**：Embedding 模型、HNSW / IVF / ScaNN 索引、量化（PQ / SQ）、召回与精排、混合检索（向量 + BM25 + 标量过滤）
- **架构决策**：Milvus / Qdrant / Weaviate / pgvector / Elasticsearch dense_vector / OpenSearch ANN；自托管 vs 托管服务；向量库 vs 向量湖
- **实战**：用 Milvus + Spark + OSS 搭一个端到端 RAG 检索层；混合检索 + 元数据过滤
- **调优**：索引参数、Recall@K、Embedding 选型、Reranker
- **小结**：向量湖（Vector Lake）架构与多租户 / 元数据治理

### Ch5 数据服务能力平台（`05-data-service-platform/`）

- **核心问题**：如何把散落在各系统中的数据能力封装为可治理、可观测、可计量的「数据服务」？
- **原理**：Data API、指标平台 / Headless BI、Data Mesh、查询引擎（Trino / Presto）、Data Catalog、血缘（DataHub / OpenMetadata / Atlas）、权限与行级安全
- **架构决策**：指标平台（Aloudata / 字节跳动风格）vs Data API Gateway vs 统一查询网关；元数据 vs 血缘 vs 资产
- **实战**：用 Trino + DataHub + OpenFGA 搭一个最小数据服务平台；指标注册 / 数据 API / 血缘采集
- **调优**：查询路由、缓存（Redis / Alluxio）、限流、降级、计费埋点
- **小结**：数据服务的 SLA / 可观测 / 治理全景

### Ch6 DataAgent（`06-dataagent/`）

- **核心问题**：如何让 AI Agent 安全、可控、可审计地操作数据？
- **原理**：Agent 架构（Plan-Execute-Observe-Reflect）、Tool Calling / MCP、Text-to-SQL、Query Agent / Insight Agent / Metric Agent、Human-in-the-Loop、Guardrails
- **架构决策**：单 Agent vs Multi-Agent；MCP vs Function Calling；SQL 生成 vs 语义层指标；如何把「指标平台」作为 Agent 工具
- **实战**：基于 MCP + 一个查询网关，搭一个「业务问数 Agent」；含权限 / SQL 校验 / 结果解释
- **调优**：Prompt Engineering、Self-Correction、错误恢复、可观测
- **小结**：DataAgent 的安全边界与落地路径

### 99 后记（`99-outro/`）

- 数据架构演进的若干方向：自治数据库、AI 原生数据栈、语义层崛起、Data Mesh 在中国落地
- 写给读者的话
- 后续更新计划

## 5. README 提纲

根目录 `README.md` 的内容结构：

1. **项目定位**：用一句话说清这是「关于构建数据服务的方方面面」的书籍型文章项目。
2. **目录速览**（含表格）：
   - 序号、章节名、核心问题、难度（★ 数）、推荐角色
3. **阅读路径**
   - 数据工程师路线
   - AI 应用工程师路线
   - 架构师路线
4. **章节导图**：一张 Mermaid 横向时间线 / 全景图
5. **术语表**：超链接到 `00-introduction/README.md#glossary`
6. **写作约定**：引用规范、目录命名、文件命名、提交规范
7. **贡献指南**：如何新增章节 / 提交勘误
8. **许可**：MIT（沿用 LICENSE）
9. **作者与联系方式**

## 6. 命名与写作约定

- 章节目录：两位数字 + 短横 + 英文 slug（例：`01-data-warehouse`）
- 文件名：小写、连字符；中文内容不放在文件名里
- 图片：放在各章 `images/` 子目录；优先 SVG / Mermaid
- 代码：放在 `code/` 子目录；引用使用相对路径
- 章节内部小标题层级：`##` 起步，避免 `###` 超过 3 层
- Markdown Lint：建议遵循 markdownlint 规则（标题层级、空行、代码块围栏等）
- 提交规范：沿用 Conventional Commits（feat / fix / docs / chore）

## 7. 本次交付范围（spec / plan / 实现 的边界）

本 spec 只描述**目录骨架与 README 提纲**，不强制写各章正文。后续写作按章独立推进，每章完成后单独 PR。

本次实际产出（最小落地）：

1. 调整后的目录结构（创建 `00-introduction/` … `99-outro/` 各章目录占位）
2. 每章目录里放一份「章节级 `README.md`（导读页）」骨架，包含：
   - 一句话定位
   - 难度与推荐角色
   - 子主题列表（占位）
   - 前置依赖章节
3. 根目录 `README.md` 完整内容（项目定位 / 目录速览表 / 阅读路径 / 导图 / 写作约定 / 贡献指南）
4. `00-introduction/README.md`（总论，含难度梯度表、角色推荐路径、术语表）

各章**正文内容不在本 spec 范围**，按需按章写作。

## 8. 风险与不做的事

- **不做**：CI / 构建 / 站点发布（如 mkdocs / vitepress）；保持纯 Markdown 仓库
- **不做**：翻译 / 多语言版本（除非读者后续要求）
- **风险**：若后续加入站点构建，章节目录下需添加 `_category_.json` 或类似配置；目前以纯仓库方式起步，保持最低耦合
- **风险**：每章内部子节文件若用纯数字编号命名（`01-xxx.md`），增删时会引发引用混乱；本 spec 改为**语义命名**（`principles.md` / `architecture.md` …）并允许作者按需调整

---

确认本设计后，下一步进入 `writing-plans` 技能生成「最小落地」的实施计划：建目录、写根 README 与 00 章/各章导读页骨架。