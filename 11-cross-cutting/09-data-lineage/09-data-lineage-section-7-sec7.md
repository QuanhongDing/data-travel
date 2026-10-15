> 本文件是 **09-data-lineage.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](09-data-lineage.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 工具 / 方案 | 跨域血缘 | 端到端 | API 化 | 可视化 | AI 集成 | 总分 |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Atlan** | 5 | 5 | 5 | 5 | 5 | 25 |
| **DataHub + GraphQL Federation** | 4 | 5 | 5 | 4 | 3 | 21 |
| **Unity Catalog** | 5 | 5 | 4 | 5 | 5 | 24 |
| **阿里云 DataWorks** | 5 | 5 | 4 | 4 | 5 | 23 |
| **Apache Atlas** | 3 | 4 | 3 | 3 | 2 | 15 |
| **自研（OpenLineage + Neo4j）** | 5 | 5 | 5 | 4 | 4 | 23 |

### 7.2 决策树

```
需要跨云血缘？
├── 是 → Atlan / 阿里云 DataWorks 跨云 / Unity Catalog
└── 否 → 继续
    │
    需要端到端血缘？
    ├── 是 → OpenLineage + DataHub + Marquez
    └── 否 → 继续
        │
        预算充足（> 100 万/年）？
        ├── 是 → Atlan / Collibra
        └── 否 → DataHub + 自研 API
```

### 7.3 组合使用

**常见组合 1：Atlan + DataHub + OpenLineage**

- **Atlan**：跨云 + AI。
- **DataHub**：血缘存储 + API。
- **OpenLineage**：统一规范。

**常见组合 2：阿里云 DataWorks + 智能血缘 + 通义千问**

- **DataWorks**：血缘 + 调度。
- **智能血缘**：LLM 补全。
- **通义千问**：自然语言查询。

**常见组合 3：自研（OpenLineage + Neo4j + GraphQL Gateway）**

- **OpenLineage**：血缘采集。
- **Neo4j**：图存储。
- **GraphQL Gateway**：API 网关。

---
