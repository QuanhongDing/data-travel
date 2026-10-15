> 本文件是 **01-feature-store.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](01-feature-store.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Feast | Tecton | Hopsworks | 阿里 FeatureDB | 自研 |
| --- | :---: | :---: | :---: | :---: | :---: |
| 开源 | 5 | 1 | 4 | 2 | 5 |
| 实时特征 | 3 | 5 | 4 | 5 | 4 |
| 离线特征 | 5 | 5 | 5 | 5 | 4 |
| 一致性保证 | 4 | 5 | 4 | 5 | 3 |
| Point-in-Time | 5 | 5 | 5 | 5 | 3 |
| LLM Feature | 3 | 5 | 5 | 4 | 3 |
| 向量特征 | 3 | 5 | 5 | 4 | 3 |
| 监控 | 3 | 5 | 4 | 5 | 3 |
| 国产化集成 | 2 | 1 | 2 | 5 | 5 |
| 工程门槛 | 3 | 2 | 3 | 2 | 5 |

**结论**：

- **快速起步**：Feast（开源 + 易用）。
- **企业级 + 实时**：Tecton（商业 + 实时强）。
- **湖仓 + AI**：Hopsworks（Lakehouse + LLM）。
- **阿里生态**：阿里 FeatureDB / PAI。
- **完全定制**：自研。

### 7.2 决策树

```
[特征平台需求]
   │
   ├── [是否需要实时特征？]
   │     ├── 强需求 → Tecton / 阿里 FeatureDB / ByteFS
   │     └── 弱需求 → Feast / Hopsworks
   │
   ├── [是否需要 LLM Feature？]
   │     ├── 是 → Tecton AI 原生 / Hopsworks GenAI
   │     └── 否 → Feast / 阿里
   │
   ├── [是否开源？]
   │     ├── 是 → Feast / Hopsworks
   │     └── 否（商业）→ Tecton / Databricks
   │
   ├── [云生态？]
   │     ├── AWS → SageMaker Feature Store
   │     ├── GCP → Vertex AI Feature Store
   │     ├── Azure → Azure ML Feature Store
   │     └── 阿里 → PAI FeatureDB
   │
   └── [完全定制需求？]
         ├── 是 → 自研
         └── 否 → 选主流平台
```

### 7.3 组合使用

**组合 1：Feast + Flink + Redis（轻量级）**

- Feast 定义特征 + Flink 实时计算 + Redis 在线存储。
- 适合：中小规模 ML 团队。

**组合 2：Tecton + 实时引擎（企业级实时）**

- Tecton 统一管理 + 自带实时计算。
- 适合：实时推荐 / 风控。

**组合 3：Hopsworks + Iceberg + Milvus（AI 原生）**

- Hopsworks + Iceberg（湖仓）+ Milvus（向量）。
- 适合：LLM / RAG / Agent 时代。

**组合 4：阿里 PAI + MaxCompute + 实时计算（国产化）**

- 阿里生态集成。
- 适合：阿里云用户。

**组合 5：自研 + 开源（混合）**

- 核心平台自研 + 周边工具用开源。
- 适合：大型企业定制需求。

---
