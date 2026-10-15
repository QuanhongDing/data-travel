> 本文件是 **06-data-assetization.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](06-data-assetization.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 工具 / 模式 | 资产目录 | 估值能力 | 市场化 | AI 集成 | 合规适配 |
| --- | :---: | :---: | :---: | :---: | :---: |
| **DataHub** | 5 | 2 | 1 | 4 | 4 |
| **Atlan** | 5 | 3 | 2 | 5 | 4 |
| **Collibra** | 5 | 4 | 3 | 5 | 5 |
| **Alation** | 5 | 3 | 2 | 4 | 4 |
| **Unity Catalog** | 5 | 2 | 3 | 5 | 4 |
| **阿里云 DataWorks** | 5 | 4 | 4 | 5 | 5 |
| **阿里数据中台** | 5 | 5 | 5 | 4 | 5 |
| **字节 DataFinder** | 5 | 4 | 4 | 4 | 4 |

### 7.2 决策树

```
是否需要数据市场 / 交易？
├── 是 → 阿里数据中台 / Snowflake Marketplace
└── 否 → 继续
    │
    是否需要企业级合规 + 估值？
    ├── 是 → Collibra / Alation / 阿里云 DataWorks
    └── 否 → 继续
        │
        是否需要 AI 集成？
        ├── 是 → Atlan / Unity Catalog + AI
        └── 否 → DataHub / Apache Atlas
```

### 7.3 组合使用

**常见组合 1：阿里数据中台 + 阿里云 DataWorks + 阿里云 DAS**

- **阿里数据中台**：业务化能力。
- **DataWorks**：技术平台。
- **DAS**：资产盘点 + 估值。

**常见组合 2：Collibra + Snowflake Marketplace + DataHub**

- **Collibra**：合规治理。
- **Snowflake Marketplace**：市场化。
- **DataHub**：技术血缘。

**常见组合 3：Atlan + Unity Catalog + Snowflake**

- **Atlan**：现代目录 + AI。
- **Unity Catalog**：Lakehouse。
- **Snowflake**：数仓。

---
