# 选型决策（Tech Selection）

> **核心定位**：在多个候选技术中给出**有理由的选择**——不堆名词，要给出"选 A 不选 B"的具体依据。这是 P7+ 资深架构师与高级工程师的分水岭。

## 答题框架（决策树法）

1. **题目澄清**：列 3-5 个**实际场景约束**（数据量 / QPS / 一致性 / 团队能力 / 成本 / 监管）。
2. **考察点**：面试官在考「**约束 → 选择**」的映射能力，而非「你懂多少技术」。
3. **参考答案框架**（**4 步决策**）：
   - **Step 1 列出候选（≥ 3 个）**：不要只比 2 个，列出 3-5 个真实候选。
   - **Step 2 选 4-6 维度做对比**：性能 / 生态 / 学习成本 / 运维成本 / 团队能力 / 未来风险。
   - **Step 3 在不同约束下给出不同选择**：业务不同选择不同（金融重 ACID，互联网重扩展性）。
   - **Step 4 给出 1-2 个真实公司案例**：「Netflix 用 Iceberg 是因为…」「阿里用 Paimon 是因为…」。
4. **常见陷阱**：
   - ❌ 「X 比 Y 好」（没有上下文的好就是空话）
   - ❌ 忽略「不选」的代价
   - ❌ 不知道「招不到人」「维护成本高」等软因素
5. **追问预测**：「如果团队只有 3 个人，怎么选？」「如果数据量涨 10 倍，怎么演进？」

## 7 个高频选型题

| 题目 | 候选 | 推荐参考 |
| --- | --- | --- |
| **表格式选型** | Iceberg / Hudi / Delta / Paimon | [Ch03 湖仓一体](../../03-data-stack/03-lakehouse/03-lakehouse.md) |
| **OLAP 引擎** | Doris / StarRocks / ClickHouse / Snowflake / BigQuery | [Ch03 OLAP 引擎](../../03-data-stack/11-olap-engine/11-olap-engine.md) |
| **流处理引擎** | Flink / Spark Streaming / Kafka Streams | [Ch03 实时计算](../../03-data-stack/09-realtime-compute/09-realtime-compute.md) |
| **消息队列** | Kafka / Pulsar / RocketMQ | [Ch03 流式存储](../../03-data-stack/04-streaming-store/04-streaming-store.md) |
| **向量库** | Milvus / Qdrant / Weaviate / pgvector | [Ch04 向量湖](../../04-data-assetization/02-vector-lake/02-vector-lake.md) |
| **AI 原生数据库** | PostgreSQL + pgvector / SurrealDB / TigerData / Oracle 23ai / TiDB Vector | [Ch04 AI 原生数据库](../../04-data-assetization/03-ai-native-db/03-ai-native-db.md) |
| **Agent 框架** | LangChain / LangGraph / AutoGen / CrewAI | [Ch05 智能体平台](../../05-agent-platform/01-data-agent/01-data-agent.md) |

## 决策矩阵模板

```
场景:  互联网中等规模电商，日均 100 亿事件，p99 < 5s，团队 10 人
约束:  实时 + 离线 都要，团队没 Flink 经验，但有 Spark 经验
预算:  人力 5 FTE + 云 100 万/年

候选对比:
| 维度     | Iceberg+Hudi | Delta Lake | Snowflake |
| -------- | ----------- | ---------- | --------- |
| 性能     | ★★★★       | ★★★★      | ★★★★★    |
| 生态     | ★★★★       | ★★★        | ★★★★★    |
| 学习成本 | 高          | 中          | 低        |
| 运维     | 高          | 中          | 极低      |
| 团队适配 | 弱          | 中          | 强        |
| 成本     | 低          | 中          | 高        |

选择: 短期 Snowflake（团队上手快），中期迁 Iceberg+Spark（成本可控）
理由: 团队能力 > 极致性能；渐进迁移比一步到位风险低
```

## 工业案例（推荐主动引用）

- **Netflix 选 Iceberg**：替代自研的元数据层（hive metastore 痛点）
- **Uber 选 Hudi**：增量处理 vs 全量重算的成本对比
- **阿里选 Paimon**：Flink 生态原生 + 国内活跃社区
- **Databricks 推 Delta**：与 Spark 商业版绑定
- **Snowflake 走云原生**：解耦存算 + 多云
- **美团选 Doris**：多场景统一（点查 + 分析 + 轻 ETL）
- **京东选国产开源 OLAP**：MySQL 生态友好
- **Apache 选 Iceberg**：社区中立（vs Databricks 控制 Delta）

## 参考资料

- 《Software Engineering at Google》—— 大厂工程选型方法
- 《Fundamentals of Data Engineering》第 3-4 章 —— 数据工程选型
- [Ch13 决策与权衡](../../13-decision/) —— ADR / 选型框架 / 风险评估
- [Ch13 架构评审](../../13-decision/07-architecture-review/07-architecture-review.md) —— 选型落地方法
