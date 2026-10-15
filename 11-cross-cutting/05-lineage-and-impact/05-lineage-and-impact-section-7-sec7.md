> 本文件是 **05-lineage-and-impact.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](05-lineage-and-impact.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 工具 | 表级血缘 | 字段血缘 | 自动采集 | 实时性 | AI 集成 | 社区生态 | 总分 |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **DataHub** | 5 | 5 | 4 | 4 | 4 | 5 | 27 |
| **Apache Atlas** | 5 | 3 | 4 | 3 | 2 | 4 | 21 |
| **OpenLineage / Marquez** | 5 | 4 | 5 | 5 | 3 | 4 | 26 |
| **Unity Catalog** | 5 | 5 | 5 | 5 | 4 | 4 | 28 |
| **Collibra** | 5 | 4 | 3 | 3 | 5 | 3 | 23 |
| **Atlan** | 5 | 5 | 4 | 4 | 5 | 4 | 27 |
| **阿里云 DataWorks** | 5 | 4 | 4 | 4 | 5 | 4 | 26 |
| **自研（OpenLineage + 自研存储）** | 5 | 5 | 5 | 5 | 4 | 3 | 27 |

### 7.2 决策树

```
数据规模？
├── PB+ 且需要跨云 → Unity Catalog / Atlan
└── 其他 → 继续
    │
    是 Hive / Hadoop 生态？
    ├── 是 → Apache Atlas / DataHub
    └── 否 → 继续
        │
        是否需要实时血缘？
        ├── 是 → OpenLineage / Marquez
        └── 否 → DataHub
            │
            预算充足（> 100 万/年）？
            ├── 是 → Collibra / Atlan
            └── 否 → 开源（DataHub / Atlas）
```

### 7.3 组合使用

**常见组合 1：DataHub + OpenLineage + Marquez**

- **DataHub**：血缘存储 + 可视化。
- **OpenLineage**：统一规范。
- **Marquez**：事件存储。

**常见组合 2：Unity Catalog + Atlan + DataHub**

- **Unity Catalog**：Lakehouse 血缘。
- **Atlan**：跨云联邦 + 协作。
- **DataHub**：开源血缘补充。

**常见组合 3：阿里云 DataWorks + 智能血缘 + 通义千问**

- **DataWorks**：血缘 + 调度。
- **智能血缘**：LLM 补全。
- **通义千问**：自然语言查询。

---
