# Ch3 · 多模态数据库

> **一句话定位**：文档、时序、图、宽表、KV、搜索——如何选型与协同。

## 基本信息

- **难度**：★★★☆☆
- **推荐角色**：全栈工程师、架构师
- **前置章节**：[Ch1 · 数据仓库](../01-data-warehouse/)、[Ch2 · 数据湖](../02-data-lake/)（建议）
- **后续章节**：[Ch4 · 向量湖](../04-vector-lake/)

## 本章要回答的核心问题

1. 不同形态的数据应该用什么样的存储引擎？
2. NoSQL 分类（文档 / 时序 / 图 / KV / 搜索）的本质区别是什么？
3. HTAP、时序压缩、倒排索引、图存储背后的原理是什么？
4. 多模态数据如何在一个架构里协同？

## 子主题（占位）

- [ ] **原理与概念**：NoSQL 分类、CAP、HTAP、时序压缩（TSM）、倒排索引、属性图 vs RDF
- [ ] **架构决策**：MongoDB（文档）/ InfluxDB & TimescaleDB（时序）/ Neo4j & NebulaGraph（图）/ Elasticsearch & OpenSearch（搜索）/ TiDB & CockroachDB（HTAP）/ Redis（KV）
- [ ] **实战搭建**：用 docker-compose 起一个「文档 + 时序 + 搜索 + 图」四件套；多模态联合查询
- [ ] **调优与踩坑**：索引设计、分片策略、冷热分层
- [ ] **参考架构与小结**：多模态融合架构

> 文件命名建议：`principles.md` / `architecture.md` / `hands-on.md` / `tuning.md` / `summary.md` / `refs.md`。

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch4 · 向量湖](../04-vector-lake/) 继续阅读