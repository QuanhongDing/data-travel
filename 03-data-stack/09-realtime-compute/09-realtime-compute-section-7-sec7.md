> 本文件是 **09-realtime-compute.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](09-realtime-compute.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Flink | Spark Streaming | Kafka Streams | Storm |
| --- | :---: | :---: | :---: | :---: |
| 实时性 | 5 | 4 | 5 | 5 |
| 状态管理 | 5 | 4 | 4 | 2 |
| Exactly-Once | 5 | 3 | 4 | 2 |
| 生态 | 5 | 5 | 4 | 3 |
| AI 友好 | 4 | 4 | 3 | 2 |

### 7.2 决策树

```
业务需求？
├── 复杂流处理（CEP / 状态）
│   └── Flink
├── 微批流处理
│   └── Spark Streaming
├── 简单流处理
│   └── Kafka Streams
└── AI 原生
    └── Flink + AI Functions
```

### 7.3 组合使用

**组合 1：Flink + Kafka + Paimon**

- Flink 流处理 + Paimon 实时数仓。
- 适用：实时数仓。

**组合 2：Flink + CDC + Iceberg**

- CDC 实时入湖。
- 适用：实时 Lakehouse。

**组合 3：Flink + ClickHouse**

- Flink 实时计算 + ClickHouse 实时查询。
- 适用：实时监控。

**组合 4：Flink + 特征库**

- 实时特征 + 在线推理。
- 适用：实时推荐 / 风控。

---
