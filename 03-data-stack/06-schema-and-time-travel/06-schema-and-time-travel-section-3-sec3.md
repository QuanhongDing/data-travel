> 本文件是 **06-schema-and-time-travel.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](06-schema-and-time-travel.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Iceberg ID-based Schema**

- 字段 ID 永不变，加列/重命名安全。
- 适用：所有 Iceberg 场景。

**模式 2：Delta Lake Schema Check + Merge**

- 写入时校验 schema 兼容性。
- 开启 mergeSchema 自动合并。
- 适用：Delta Lake 场景。

**模式 3：Hudi Timeline + Schema**

- Timeline 记录 schema 版本。
- 适用：Hudi CDC 场景。

**模式 4：Avro / Protobuf + Schema Registry**

- Kafka 消息场景。
- 兼容性检查 + 集中管理。
- 适用：实时流式数据。

**模式 5：Paimon 主键 + Schema**

- 主键索引 + schema 演进。
- 适用：实时数仓。

**模式 6：混合模式（Iceberg + Schema Registry）**

- Iceberg 做表，Schema Registry 管理 schema 历史。
- 适用：复杂业务。

### 3.2 适用场景决策表

| 业务场景 | 推荐模式 | 典型技术栈 |
| --- | --- | --- |
| Kafka 消息演进 | Avro/Protobuf + Schema Registry | Confluent SR + Kafka |
| Lakehouse 表演进 | Iceberg / Hudi / Delta | 表格式原生支持 |
| 实时数仓 | Paimon 主键 + Schema | Flink + Paimon |
| 业务库 CDC | Debezium + Iceberg | Debezium + Kafka + Iceberg |
| AI 训练数据复现 | Time Travel + 血缘 | Iceberg V3 + MLflow |
| 跨引擎联邦查询 | Schema 标准化 + 元数据 | Iceberg + Unity Catalog |

### 3.3 反模式与陷阱

**反模式 1：删列不通知下游**

- 直接 DROP COLUMN，下游全部报错。
- **正确**：标记 deprecated + 给迁移期。

**反模式 2：类型收缩**

- bigint → int，可能溢出。
- **正确**：类型扩展（int → bigint），避免收缩。

**反模式 3：未做兼容性检查**

- 上线后发现字段冲突。
- **正确**：CI/CD 中加入 schema 兼容性测试。

**反模式 4：Time Travel 成本失控**

- 保留所有快照，存储爆炸。
- **正确**：保留策略（最近 7 天 + 关键节点永久保留）。

**反模式 5：手动管理 Schema**

- 没有 Schema Registry，全靠邮件沟通。
- **正确**：集中化、自动化的 Schema 管理。

**反模式 6：忽视 Schema 一致性**

- 上游改了字段名，下游还用旧名查询。
- **正确**：Schema Registry + 列别名映射。

---
