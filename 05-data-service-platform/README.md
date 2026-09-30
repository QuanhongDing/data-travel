# Ch5 · 数据服务能力平台

> **一句话定位**：如何把散落在各系统中的数据能力封装为可治理、可观测、可计量的「数据服务」。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：平台架构师、数据治理
- **前置章节**：建议先读 [Ch1](../01-data-warehouse/)–[Ch4](../04-vector-lake/) 任一
- **后续章节**：[Ch6 · DataAgent](../06-dataagent/)

## 本章要回答的核心问题

1. 什么是「数据服务」？它和「数据 API」的区别是什么？
2. 指标平台 / Headless BI 的核心理念与价值是什么？
3. Data Mesh 在国内落地有哪些可行路径？
4. 元数据 / 血缘 / 权限如何构成可治理的底座？

## 子主题（占位）

- [ ] **原理与概念**：Data API、指标平台 / Headless BI、Data Mesh、查询引擎（Trino / Presto）、Data Catalog、血缘（DataHub / OpenMetadata / Atlas）、行级安全
- [ ] **架构决策**：指标平台 vs Data API Gateway vs 统一查询网关；元数据 vs 血缘 vs 资产
- [ ] **实战搭建**：用 Trino + DataHub + OpenFGA 搭最小数据服务平台；指标注册 / 数据 API / 血缘采集
- [ ] **调优与踩坑**：查询路由、缓存（Redis / Alluxio）、限流、降级、计费埋点
- [ ] **参考架构与小结**：数据服务的 SLA / 可观测 / 治理全景

> 文件命名建议：`principles.md` / `architecture.md` / `hands-on.md` / `tuning.md` / `summary.md` / `refs.md`。

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch6 · DataAgent](../06-dataagent/) 继续阅读
