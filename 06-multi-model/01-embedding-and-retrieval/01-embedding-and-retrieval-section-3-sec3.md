> 本文件是 **01-embedding-and-retrieval.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](01-embedding-and-retrieval.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Bi-Encoder + ANN 检索（标准召回模式）**

```
[Query] → [Bi-Encoder] → [Query Vector]
                            ↓
[Docs] → [Bi-Encoder 离线批量] → [Doc Vectors] → [ANN 索引（HNSW）]
                            ↓
                  [Top-K 候选（K=100）]
                            ↓
                       [LLM 生成]
```

- **优点**：快（毫秒级）、可扩展到亿级向量、索引小。
- **缺点**：Bi-Encoder 独立编码，丢失 query-doc 交互信息。
- **适用**：大规模文档库（百万级以上）的 RAG / 推荐。

**模式 2：Bi-Encoder + Cross-Encoder 重排（召回 + 精排模式）**

```
[Query] → [Bi-Encoder] → [Top-K=100 候选]
                            ↓
                  [Cross-Encoder 重排]
                            ↓
                  [Top-K=10 精排结果]
                            ↓
                       [LLM 生成]
```

- **优点**：准确率 +20-30%，兼顾速度与精度。
- **缺点**：Cross-Encoder 慢（10-100 ms/对），K 不能太大。
- **适用**：企业级 RAG（标准范式）。

**模式 3：Late Interaction（ColBERT）模式**

```
[Query] → [Token-level Encoding]
                            ↓
[Docs] → [Token-level Encoding 离线] → [ColBERT 索引]
                            ↓
                  [MaxSim 相似度计算]
                            ↓
                  [Top-K 候选]
                            ↓
                  [可选：Cross-Encoder 重排]
                            ↓
                       [LLM 生成]
```

- **优点**：token 级精确匹配，长文档检索 SOTA。
- **缺点**：索引大（比 Bi-Encoder 大 10-100 倍）、构建慢。
- **适用**：长文档检索（法律、医疗）、高精度 RAG。

**模式 4：Hybrid Retrieval（混合检索）**

```
[Query]
   ↓
[向量检索] + [BM25 检索]
   ↓
[RRF / 加权融合]
   ↓
[Top-K 候选]
   ↓
[Cross-Encoder 重排]
   ↓
[LLM 生成]
```

- **优点**：兼顾语义匹配与精确匹配，召回率 +15-25%。
- **缺点**：实现复杂、需维护两套索引。
- **适用**：企业级 RAG（生产环境事实标准）。

**模式 5：Multi-Stage Reranking（多级重排）**

```
[Query] → [Bi-Encoder] → [Top-1000 粗排]
                            ↓
                  [ColBERT Late Interaction] → [Top-100 精排]
                            ↓
                  [Cross-Encoder Reranker] → [Top-10 最终]
                            ↓
                       [LLM 生成]
```

- **优点**：精度最高，适合高价值场景。
- **缺点**：延迟大、成本高。
- **适用**：法律 / 医疗 / 金融的高合规 RAG。

**模式 6：Instruction-Tuned Embedding（指令嵌入）**

```
[Query + Task Instruction] → [Embedding Model]
                              ↓
[根据任务输出不同向量]
   ├── 检索 → 检索空间向量
   ├── 分类 → 分类空间向量
   └── 聚类 → 聚类空间向量
```

- **优点**：一个模型支持多任务。
- **缺点**：训练成本高、任务边界模糊。
- **适用**：多场景统一 Embedding（如 BGE-M3、Nomic Embed v1.5）。

**模式 7：Multimodal Embedding（多模态嵌入）**

```
[文本] ───┐
[图像] ───┼→ [多模态 Embedding] → [统一向量空间]
[视频] ───┤
[音频] ───┘
                              ↓
                  [跨模态检索]
```

- **优点**：跨模态统一检索。
- **缺点**：训练难、推理慢、效果差于单模态。
- **适用**：电商（图搜）、媒体（视频搜）、文档（PDF 图搜）。

**模式 8：Matryoshka Embedding（俄罗斯套娃）**

```
[Embedding Model] → [3072 维向量]
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
   [截断到 64]      [截断到 256]      [截断到 1024]
        ↓                 ↓                 ↓
   极快检索         平衡检索           高精度检索
```

- **优点**：灵活、按场景选维度。
- **缺点**：低维时精度损失。
- **适用**：分层检索（粗排用 64 维，精排用 1024 维）。

### 3.2 适用场景决策表

| 业务特征 | 推荐模式 | 推荐模型 | 理由 |
| --- | --- | --- | --- |
| 百万级文档、快速 RAG | Bi-Encoder + ANN | OpenAI Embed / BGE-M3 dense | 快、便宜 |
| 企业级 RAG、要求准确率 | Bi-Encoder + Rerank | BGE-M3 + Cohere Rerank 3 | 准确率 90%+ |
| 长文档（10K+ token）检索 | Late Interaction | ColBERT v2 / ColPali | token 级匹配 |
| 混合精确 + 语义 | Hybrid Retrieval | BGE-M3 + BM25 | 兼顾 |
| 多语言 / 跨境 | Multilingual Bi-Encoder | BGE-M3 / Cohere Embed v3 | 100+ 语言 |
| 多模态（文/图/视频） | Multimodal Embedding | CLIP / Visualized BGE | 跨模态 |
| 极致精度、高价值 | Multi-Stage Reranking | ColBERT + Reranker | 精度最高 |
| 极大规模（10 亿+ 向量） | Matryoshka + IVF-PQ | OpenAI 3 + IVF-PQ | 压缩、灵活 |
| 边缘 / 端侧部署 | 小模型 Bi-Encoder | BGE-small / GTE-small | 轻量 |
| 法律 / 医疗 | Late Interaction + Rerank | ColBERT v2 + BGE Reranker | 精确 |

### 3.3 反模式与陷阱

1. **"直接用默认 Embedding"反模式**：不评估场景直接用 `text-embedding-3-small`。**必须用 MTEB / 内部数据集评估**。
2. **"忽略 Rerank"反模式**：只用 Bi-Encoder 召回 Top-K 给 LLM，准确率浪费 20%+。**必须加 Cross-Encoder Rerank**。
3. **"维度浪费"反模式**：用 3072 维做简单检索，索引大、慢。**用 Matryoshka 截断到 256-1024 维**。
4. **"硬负样本缺失"反模式**：训练领域 Embedding 没挖 Hard Negative，效果差。**必须做 Hard Negative Mining**。
5. **"长文档直接截断"反模式**：8K token 文档只取前 512 token，关键信息丢失。**用 Late Interaction 或分块 + Rerank**。
6. **"冷启动数据不足"反模式**：垂直领域无标注数据，强行用通用 Embedding。**用 LLM 合成数据 + 微调**。
7. **"忽视多语言"反模式**：跨国企业用单语言 Embedding，跨语言检索失败。**用 BGE-M3 / multilingual-E5**。
8. **"召回 + 生成脱节"反模式**：召回阶段不考虑 LLM 上下文窗口限制。**Top-K 必须 ≤ LLM 上下文窗口**。
9. **"无评估体系"反模式**：上线 Embedding 后不评测，凭感觉调。**必须建立 MTEB + 内部评估集 + 用户反馈**。
10. **"盲目追求 SOTA"反模式**：追求 Snowflake Arctic / OpenAI 3-large，忽视成本。**按 ROI 选模型**。

---
