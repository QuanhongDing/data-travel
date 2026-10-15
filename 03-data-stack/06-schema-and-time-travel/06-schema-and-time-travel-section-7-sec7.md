> 本文件是 **06-schema-and-time-travel.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](06-schema-and-time-travel.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 传统 DDL | Avro SR | Iceberg | Delta | Paimon |
| --- | :---: | :---: | :---: | :---: | :---: |
| Schema 演进 | 2 | 4 | 5 | 5 | 5 |
| Time Travel | 1 | 1 | 5 | 5 | 4 |
| 兼容性检查 | 1 | 5 | 4 | 4 | 4 |
| 跨引擎 | 2 | 5 | 5 | 4 | 4 |
| AI 友好度 | 1 | 2 | 5 | 4 | 4 |

### 7.2 决策树

```
业务场景？
├── Kafka 消息流
│   └── Avro/Protobuf + Schema Registry
├── Lakehouse 表
│   ├── Iceberg（最灵活）
│   ├── Delta（Spark 生态深）
│   └── Paimon（实时数仓）
└── 跨场景
    └── Iceberg V3 + Schema Registry
```

### 7.3 组合使用

**组合 1：Iceberg + Schema Registry**

- Iceberg 做表，Schema Registry 集中管理 schema。
- 适用：复杂业务、跨团队。

**组合 2：Delta UniForm + Iceberg**

- 一份 Delta 数据，支持 Iceberg / Hudi 读取。
- 适用：跨引擎兼容。

**组合 3：Paimon + Flink Schema Evolution**

- Flink 流处理 + Paimon 实时数仓。
- 适用：实时数仓。

**组合 4：Lakehouse + 血缘 + Time Travel**

- 血缘追踪 + Time Travel 回溯。
- 适用：合规审计。

---
