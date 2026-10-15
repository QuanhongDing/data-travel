> 本文件是 **03-lakehouse.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](03-lakehouse.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 数据湖 | 数据仓库 | Lakehouse |
| --- | :---: | :---: | :---: |
| 存储成本 | 5 | 2 | 5 |
| 多源异构 | 5 | 2 | 5 |
| ACID 保障 | 1 | 5 | 4 |
| 查询性能 | 2 | 5 | 4 |
| Schema 治理 | 1 | 5 | 4 |
| 跨引擎兼容 | 3 | 2 | 5 |
| AI 友好度 | 4 | 2 | 5 |
| 工程复杂度 | 3 | 3 | 4 |

### 7.2 决策树

```
业务需求？
├── 数据量大 + 多源异构 + AI 友好
│   └── Lakehouse（Iceberg / Paimon + Trino/Flink + StarRocks）
├── 传统 BI + 报表为主
│   └── 数据仓库（Snowflake / BigQuery / Doris）
├── 超低成本 + 不需要治理
│   └── 数据湖（MinIO + Spark）
└── AI 平台 + 多模态
    └── AI 原生 Lakehouse（Iceberg V3 + LanceDB + LLM）
```

### 7.3 组合使用

**组合 1：Lakehouse + 实时 OLAP**

- Lakehouse 做存储层，StarRocks/Doris 做查询层。
- 适用：实时 BI、秒级查询。

**组合 2：Lakehouse + 传统数仓**

- Lakehouse 存原始 + 历史，数据仓库存精化。
- 适用：超大规模企业。

**组合 3：Iceberg + Paimon（混合）**

- Iceberg 做离线主仓，Paimon 做实时入湖。
- 适用：复杂业务、混合场景。

**组合 4：Lakehouse + 向量库**

- Lakehouse 存结构化，向量库存 Embedding。
- 联合查询。
- 适用：AI 应用。

**组合 5：Lakehouse + 知识图谱**

- Lakehouse 存原始文本 + 实体。
- 知识图谱存关系。
- GraphRAG。
- 适用：AI 智能问答。

---
