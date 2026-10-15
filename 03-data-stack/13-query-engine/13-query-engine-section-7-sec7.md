> 本文件是 **13-query-engine.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](13-query-engine.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Trino | Presto | Impala | DataFusion | DuckDB |
| --- | :---: | :---: | :---: | :---: | :---: |
| 联邦查询 | 5 | 5 | 3 | 3 | 2 |
| 性能 | 4 | 4 | 4 | 5 | 5 |
| 内嵌能力 | 1 | 1 | 1 | 5 | 5 |
| AI 友好 | 4 | 3 | 2 | 5 | 5 |
| 易用性 | 4 | 4 | 3 | 4 | 5 |

### 7.2 决策树

```
场景？
├── 跨源即席查询
│   └── Trino
├── 内嵌 / Notebook
│   └── DataFusion / DuckDB
├── 传统 CDH 生态
│   └── Impala
└── AI 原生
    └── DataFusion + Arrow
```

### 7.3 组合使用

**组合 1：Trino + Iceberg + OLAP**

- Trino 跨源 + Iceberg 存储 + StarRocks 高频查询。
- 适用：现代数据栈。

**组合 2：Trino + DataFusion**

- Trino 联邦 + DataFusion 内嵌。
- 适用：混合场景。

**组合 3：Trino + AI Agent**

- Trino 提供统一查询接口。
- Agent 通过 SQL 查询所有数据。

---
