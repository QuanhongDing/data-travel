# Ch4 · 数据中台与服务化

> **一句话定位**：阿里中台 OneData / OneID / OneService 方法论与工程落地，以及 Data Mesh、Headless BI、指标平台等替代方案。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：平台架构师、数据治理
- **前置章节**：建议先读 [Ch1](../01-modeling/) – [Ch3](../03-compute/) 任一
- **后续章节**：[Ch5 · AI 原生数据栈](../05-ai-native-data-stack/)

## 本章要回答的核心问题

1. 阿里中台 OneData / OneID / OneService 三大方法论的本质是什么？
2. 指标平台（Headless BI）和传统 BI 报表的本质区别？
3. Data Mesh 在国内落地有哪些可行路径？它和"数据中台"是替代还是互补？
4. 统一查询网关（Trino / Presto）和数据 API 网关的关系？
5. Data Catalog（DataHub / OpenMetadata / Atlas）如何成为数据治理的底座？
6. 指标平台如何成为 DataAgent 的"工具"而非"万能 SQL 工具"？

## 子主题（占位）

- [ ] **[OneData 思想](./one-data/README.md)**：统一数据标准、统一模型、统一指标
- [ ] **[OneID 主数据](./one-id/README.md)**：跨域用户打通、ID-Mapping、隐私合规
- [ ] **[OneService 数据服务化](./one-service/README.md)**：数据 API、查询网关、指标服务
- [ ] **[指标平台 / Headless BI](./metric-platform/README.md)**：Cube / dbt Semantic Layer / AloudData / 字节指标平台
- [ ] **[数据 API 网关](./data-api-gateway/README.md)**：限流、降级、计费、监控
- [ ] **[统一查询网关](./unified-query-gateway/README.md)**：Trino / Presto / 自研查询网关
- [ ] **[Data Catalog 与元数据](./data-catalog/README.md)**：DataHub / OpenMetadata / Apache Atlas
- [ ] **[数据血缘](./data-lineage/README.md)**：采集、存储、可视化、影响分析
- [ ] **[Data Mesh 落地](./data-mesh/README.md)**：领域切分、自服务数据平台、联邦治理
- [ ] **[实战](./hands-on/README.md)**：用 Trino + DataHub + OpenFGA 搭最小数据服务平台

> 文件命名建议：`one-data.md` / `one-id.md` / `one-service.md` / `metric-platform.md` / `data-api-gateway.md` / `unified-query-gateway.md` / `data-catalog.md` / `data-mesh.md` / `hands-on.md` / `tuning.md` / `summary.md` / `refs.md`。

## 与 数据架构师能力的对应

> **数据架构师 的核心能力之一：让全公司用同一套"数据语言"做决策**。

中台不是"几个系统"，而是**一套方法论 + 一组工程实践 + 一种组织文化**。数据架构师 必须能：

- **判断要不要建中台**：很多公司盲目建设中台，结果成了"中央数据沼泽"；数据架构师 要能判断"中台"vs"业务团队自建"的边界
- **设计 OneID 打通方案**：跨域用户打通是 数据架构师必答题，涉及隐私、ID-Mapping 算法、灰度策略
- **让指标平台成为 AI Agent 的工具**：而不是"万能 SQL 工具"（这是 Ch5 的关键衔接）
- **设计 Data Mesh 在国内的落地形态**：去中心化治理在中国语境下如何平衡效率与一致性

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch5 · AI 原生数据栈](../05-ai-native-data-stack/) 继续阅读
