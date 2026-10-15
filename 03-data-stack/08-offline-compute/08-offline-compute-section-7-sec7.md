> 本文件是 **08-offline-compute.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](08-offline-compute.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Spark | Hive | Trino | DuckDB |
| --- | :---: | :---: | :---: | :---: |
| 性能 | 5 | 3 | 5 | 5 |
| 扩展性 | 5 | 5 | 5 | 2 |
| 易用性 | 4 | 3 | 4 | 5 |
| AI 友好 | 4 | 2 | 3 | 5 |
| 内嵌能力 | 1 | 1 | 1 | 5 |

### 7.2 决策树

```
数据规模？
├── < GB
│   └── DuckDB（内嵌）
├── GB - TB
│   ├── 单机 → DuckDB
│   └── 分布式 → Spark / Trino
└── > TB
    └── Spark + Iceberg + Trino
```

### 7.3 组合使用

**组合 1：Spark + Iceberg + Trino**

- Spark 写入 Iceberg，Trino 查询。
- 适用：Lakehouse。

**组合 2：Spark + DuckDB**

- Spark 大数据 ETL，DuckDB 交互分析。
- 适用：混合场景。

**组合 3：Hive + Spark + Trino**

- Hive 兼容历史，Spark 计算，Trino 查询。
- 适用：传统企业迁移。

---
