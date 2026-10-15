> 本文件是 **11-olap-engine.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](11-olap-engine.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | StarRocks | Doris | ClickHouse | Trino | DuckDB |
| --- | :---: | :---: | :---: | :---: | :---: |
| 查询性能 | 5 | 5 | 5 | 4 | 5 |
| 实时写入 | 5 | 5 | 3 | 2 | 1 |
| Join 性能 | 5 | 5 | 3 | 4 | 5 |
| 物化视图 | 5 | 4 | 2 | 1 | 1 |
| 联邦查询 | 2 | 2 | 1 | 5 | 3 |
| AI 友好 | 4 | 4 | 3 | 3 | 5 |
| 内嵌能力 | 1 | 1 | 1 | 1 | 5 |

### 7.2 决策树

```
数据规模 + 查询模式？
├── 单表大宽表聚合
│   └── ClickHouse
├── 多表 Join + 实时
│   └── StarRocks / Doris
├── 联邦跨源查询
│   └── Trino
├── 内嵌 / Notebook
│   └── DuckDB
└── AI 应用
    └── StarRocks 3.x + 向量索引
```

### 7.3 组合使用

**组合 1：StarRocks + Iceberg 外表**

- StarRocks 查询 Iceberg 外表。
- 适用：Lakehouse + 实时查询。

**组合 2：ClickHouse + StarRocks**

- ClickHouse 存明细，StarRocks 存聚合。
- 适用：分层查询。

**组合 3：DuckDB + StarRocks**

- DuckDB 本地原型，StarRocks 生产。
- 适用：开发 + 生产。

**组合 4：OLAP + 向量库 + LLM**

- OLAP + LanceDB + LLM。
- 适用：AI 应用。

---
