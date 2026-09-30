# Ch2 · 数据湖

> **一句话定位**：从「库」到「湖」，如何处理半结构化 / 非结构化数据并兼顾事务。

## 基本信息

- **难度**：★★★☆☆
- **推荐角色**：数据工程师、平台架构师
- **前置章节**：[Ch1 · 数据仓库](../01-data-warehouse/)（建议）
- **后续章节**：[Ch3 · 多模态数据库](../03-multimodal-db/)

## 本章要回答的核心问题

1. 湖与仓的本质区别是什么？什么是 Lakehouse？
2. Iceberg / Hudi / Paimon / Delta 这些 Table Format 解决了什么问题？
3. Schema Evolution、Hidden Partitioning、Time Travel 是怎么实现的？
4. 存算分离 vs 存算一体该怎么选？

## 子主题（占位）

- [ ] **原理与概念**：Lakehouse、Table Format、Schema Evolution、对象存储
- [ ] **架构决策**：存储格式（Parquet / ORC / Avro）、计算引擎（Spark / Flink / Trino）、存算分离 vs 存算一体
- [ ] **实战搭建**：用 MinIO + Iceberg + Trino 搭本地湖仓；流式写入 Hudi MOR 表
- [ ] **调优与踩坑**：小文件、Compaction、Z-Order、查询计划
- [ ] **参考架构与小结**：湖 vs 仓 vs 湖仓一体

> 文件命名建议：`principles.md` / `architecture.md` / `hands-on.md` / `tuning.md` / `summary.md` / `refs.md`。作者可按需调整。

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch3 · 多模态数据库](../03-multimodal-db/) 继续阅读
