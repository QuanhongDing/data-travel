# Ch1 · 数据仓库

> **一句话定位**：如何搭建一个能稳定支撑 BI 与离线分析的数仓。

## 基本信息

- **难度**：★★☆☆☆
- **推荐角色**：数据工程师、数仓开发
- **前置章节**：无（建议先读 [序章](../00-introduction/)）
- **后续章节**：[Ch2 · 数据湖](../02-data-lake/)

## 本章要回答的核心问题

1. 一个「能用」的数仓到底由哪些模块组成？
2. ODS / DWD / DWS / ADS 分层的边界与价值是什么？
3. 维度建模（Kimball）该怎么落地，又有哪些常见误用？
4. OLAP 引擎与调度系统怎么选型（Doris / StarRocks / ClickHouse / Airflow / DolphinScheduler …）？

## 子主题（占位）

> 以下为本章计划覆盖的子主题。当前章节正文尚未写作，子文件由作者按需创建。

- [ ] **原理与概念**：维度建模、数仓分层、ETL vs ELT、OLAP 引擎原理
- [ ] **架构决策**：Hive / Spark / Flink 选型；OLAP 引擎选型；调度系统选型
- [ ] **实战搭建**：用 Docker Compose 起一个最小数仓（Doris + DolphinScheduler）；分层建模示例
- [ ] **调优与踩坑**：分区、bucket、物化视图、查询改写
- [ ] **参考架构与小结**：典型架构图、适用与不适用场景

> 文件命名建议（不强制）：`principles.md` / `architecture.md` / `hands-on.md` / `tuning.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch2 · 数据湖](../02-data-lake/) 继续阅读
