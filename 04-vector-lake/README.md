# Ch4 · 向量湖

> **一句话定位**：如何为 AI 应用提供大规模、低延迟、可治理的向量检索基础设施。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：AI 应用工程师、平台架构师
- **前置章节**：[Ch3 · 多模态数据库](../03-multimodal-db/)（建议）
- **后续章节**：[Ch5 · 数据服务能力平台](../05-data-service-platform/)

## 本章要回答的核心问题

1. Embedding 模型与向量索引（HNSW / IVF / ScaNN）的原理是什么？
2. Milvus / Qdrant / Weaviate / pgvector / Elasticsearch dense_vector 该怎么选？
3. 什么是「向量湖」，它和「向量库」的本质区别是什么？
4. 混合检索（向量 + BM25 + 标量过滤）与 Reranker 该怎么设计？

## 子主题（占位）

- [ ] **原理与概念**：Embedding 模型、HNSW / IVF / ScaNN、量化（PQ / SQ）、召回与精排、混合检索
- [ ] **架构决策**：向量引擎选型、自托管 vs 托管服务、向量库 vs 向量湖
- [ ] **实战搭建**：用 Milvus + Spark + OSS 搭端到端 RAG 检索层；混合检索 + 元数据过滤
- [ ] **调优与踩坑**：索引参数、Recall@K、Embedding 选型、Reranker
- [ ] **参考架构与小结**：向量湖架构与多租户 / 元数据治理

> 文件命名建议：`principles.md` / `architecture.md` / `hands-on.md` / `tuning.md` / `summary.md` / `refs.md`。

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch5 · 数据服务能力平台](../05-data-service-platform/) 继续阅读