> 本文件是 **04-streaming-store.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](04-streaming-store.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Kafka | Pulsar | RocketMQ | AutoMQ |
| --- | :---: | :---: | :---: | :---: |
| 吞吐 | 5 | 5 | 4 | 5 |
| 延迟 | 5 | 5 | 4 | 5 |
| 扩展性 | 4 | 5 | 4 | 5 |
| Tiered Storage | 4 | 5 | 3 | 5 |
| Serverless | 2 | 3 | 2 | 5 |
| 事务消息 | 3 | 3 | 5 | 3 |
| 生态 | 5 | 4 | 4 | 4 |
| 运维复杂度 | 3 | 4 | 3 | 2 |

### 7.2 决策树

```
业务需求？
├── 需要事务消息？
│   ├── 是 → RocketMQ
│   └── 否
│       ├── 云原生 / 多租户
│       │   └── Pulsar
│       ├── 云上 Serverless
│       │   └── AutoMQ / Warpstream
│       └── 传统部署
│           └── Kafka（默认）
```

### 7.3 组合使用

**组合 1：Kafka + Flink + Lakehouse**

- Kafka 流式数据 → Flink 处理 → Paimon / Iceberg 入湖。
- 适用：实时数仓 + Lakehouse。

**组合 2：Kafka + CDC + 数据湖**

- 数据库 CDC → Kafka → 数据湖（Iceberg / Hudi）。
- 适用：实时入湖。

**组合 3：Kafka + RocketMQ**

- Kafka 做流式数据主干道，RocketMQ 做事务消息。
- 适用：阿里系业务。

**组合 4：Kafka + Tiered Storage + 离线数仓**

- Kafka Tiered 冷数据直接被 Spark 离线读取。
- 适用：流批一体。

---
