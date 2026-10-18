# Schema 演进与 Time Travel

> **一句话定位**：让表的 Schema 在不中断业务的前提下灵活演进、保留历史快照可回溯查询，是 Lakehouse 与现代数据栈的"数据治理 + 时光倒流"双重能力。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**06 Schema 与 Time Travel**）。覆盖 **R4 数据全栈协同** 能力领域中「Schema 管理、Schema Registry、Time Travel 实现原理、AI 时代演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| Schema Evolution 是什么？跟传统 DDL 升级有什么区别？ | §1.1 |
| Iceberg / Hudi / Delta 的 Schema 演进策略有何不同？ | §2.1 |
| Time Travel 的工程原理？ | §2.3 |
| Schema Registry（Confluent / Karapace）怎么落地？ | §4.1 |
| 2024-2025 Iceberg V3、Delta UniForm 有哪些新特性？ | §5.1 的落点表、§5.4 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：

- **Schema Evolution（Schema 演进）**：在保留历史数据兼容性的前提下，修改表的结构（增列 / 删列 / 改类型 / 重命名）。
- **Time Travel（时间旅行）**：查询表在某一历史时刻的状态，支持快照回溯、误操作恢复、数据复现。

**工程定义**：在数据架构师手里，Schema 演进 + Time Travel 是**让数据资产"向前兼容、向后回溯"的双重保险**。它们的工程意义：

- **Schema 演进**：让上游字段变更不影响下游消费。
- **Time Travel**：让误操作可恢复、数据可复现。
- **共同点**：都依赖表的"元数据 + 历史版本"能力，是 Lakehouse 表格式（Iceberg / Hudi / Delta / Paimon）的核心能力。

**与传统数据库 DDL 升级的本质区别**：

| 维度 | 传统 DDL | Schema Evolution |
| --- | --- | --- |
| 修改方式 | ALTER TABLE（可能锁表） | 元数据级修改（无锁） |
| 历史兼容 | 可能破坏（删列导致旧数据不可读） | 自动兼容（旧数据补默认） |
| 下游影响 | 可能全部报错 | 自动适配 |
| 实现机制 | 修改物理存储 | 保留 schema 历史 + 列映射 |
| 查询回溯 | 不支持（除非有备份） | Time Travel 直接支持 |

### 1.2 为什么需要

**业务驱动力**：

- **业务快速迭代**：今天加字段、明天删字段，传统 DDL 跟不上。
- **数据消费方众多**：下游 10+ 个消费方，Schema 改一个影响一片。
- **误操作恢复**：删错数据、改错字段，需要回滚。
- **合规审计**：需要历史快照用于审计。
- **AI 训练复现**：需要历史数据快照来复现模型。

**痛点（没有 Schema Evolution 的代价）**：

1. **"动一行崩一片"**：上游加字段，下游全部报错。
2. **建新表 + 数据迁移**：每次 Schema 变更都要建新表 + 数据复制。
3. **误操作无法恢复**：删错数据无法回滚。
4. **数据复现困难**：无法用历史数据复现 AI 模型。
5. **审计无据**：历史快照缺失，合规审计无证据。

**AI 时代的新诉求**：

- **Embedding 维度演进**：Embedding 维度从 768 → 1024 → 1536，需要 Schema 灵活支持。
- **数据复现**：AI 模型训练需要历史数据快照。
- **特征版本管理**：特征 Schema 演进需要严格治理。
- **数据血统**：AI 训练数据需要 Time Travel + 血缘。

### 1.3 在 AI 时代数据架构中的位置

```
[业务系统：Schema 不断演进]
        ↓
[Schema Registry + Lakehouse 表格式]
        ↓
[下游消费：BI / AI / Agent 自动适配]
        ↑
[Time Travel：可查询任意历史快照]
```

**Schema 演进 + Time Travel 是 Lakehouse 的"治理基石"**：让数据资产"安全演进、可回溯"。

### 1.4 演进历程

**第一阶段：传统数据库 DDL（1990-2010）**

- ALTER TABLE 直接修改 schema。
- 锁表、改物理存储。
- **痛点**：改 schema 风险高、影响大。

**第二阶段：消息 Schema 演进（2015-2020）**

- 2015：Confluent Schema Registry 解决 Kafka 消息 Schema 演进。
- 2016：Avro Schema Evolution 规则化（Backward / Forward / Full Compatible）。
- 2018：Protobuf Schema Evolution。

**第三阶段：Lakehouse 表格式（2020-2024）**

- 2020：Delta Lake 支持 Schema Evolution + Time Travel。
- 2021：Iceberg 1.0、Apache Hudi 0.10 都支持 Schema Evolution。
- 2022：Iceberg V2 规范。
- 2023：Iceberg V3 草案、Paimon 主键演进。

**第四阶段：AI 原生 Schema 管理（2024-至今）**

- 2024：Iceberg V3 规范、Variant 类型、向量类型。
- 2024：Delta UniForm GA、Iceberg/Paimon 全支持 Schema Evolution。
- 2025：AI 驱动的 Schema 推断（LLM 自动生成 schema）。

**一句话总结**：**Schema 演进从"传统 DDL 改造"→"消息 Schema Registry"→"Lakehouse 表格式"→"AI 原生"四阶段演进，今天是 Lakehouse 的核心能力。**

---

## 2. 核心原理

### 2.1 关键概念定义

**Schema Evolution 类型**：

- **加列（Add Column）**：最安全，旧数据补默认值或 NULL。
- **删列（Drop Column）**：较危险，旧数据标记删除。
- **重命名（Rename Column）**：需元数据映射。
- **类型变更（Type Change）**：需兼容性检查（int → bigint 安全；string → int 危险）。

**向后兼容（Backward Compatible）**：新 Schema 读旧数据 OK。
**向前兼容（Forward Compatible）**：旧 Schema 读新数据 OK。
**完全兼容（Full Compatible）**：双向兼容。

**Schema Registry**：集中管理所有 Schema 的服务。代表：Confluent Schema Registry、Karapace、Apicurio。

**Avro / Protobuf**：二进制序列化格式，原生支持 Schema 演进。

**Iceberg Schema Evolution**：

- 加列：metadata 更新，旧数据自动补默认值。
- 删列：metadata 标记删除，物理保留兼容。
- 重命名：metadata 字段 ID 不变，仅更新 name 映射。
- **ID-based Schema**：每个字段有唯一 ID，加列不破坏下游。

**Hudi Schema Evolution**：

- 基于 Timeline 记录 schema 版本。
- 兼容 Delta Lake 模式。

**Delta Lake Schema Evolution**：

- Transaction Log 记录 schema 历史。
- Schema Check（写入时校验兼容性）。

**Time Travel 形式**：

- **Snapshot ID**：指定快照号查询。
- **Timestamp**：按时间点查询。
- **Version Number**：按版本号查询。

**Compaction 与 Time Travel 关系**：

- Compaction 合并小文件 → 新快照。
- 旧快照可查询，但旧文件可能被清理。
- **需要 Expire Snapshots + Vacuum** 保留时间窗口。

### 2.2 数学 / 形式化基础

**Schema 兼容性检查的形式化**：

- **加列 + 默认值**：∀ 旧数据，新 schema 可读取 → Backward Compatible。
- **删列**：旧 schema 字段被新数据忽略 → Forward Compatible。
- **类型扩展（int → long）**：新 schema 可读旧数据 → Backward Compatible。
- **类型收缩（long → int）**：可能溢出 → Not Compatible。

**Iceberg ID-based Schema 的数学模型**：

- 每个字段分配唯一 ID（不可重用）。
- Schema 变更：增加 / 修改字段 ID 映射。
- 读取时：根据 ID 映射读取对应数据。
- **保证**：旧数据的字段 ID 不变，永远可读。

**Time Travel 的快照隔离**：

- MVCC 多版本并发控制。
- 每个事务生成新快照，旧快照保留。
- 读取指定快照 → 看到该时刻的一致性视图。

### 2.3 关键算法 / 方法

**1. Iceberg Schema Evolution**

```sql
-- 加列（安全）
ALTER TABLE orders ADD COLUMN coupon_amount DECIMAL(18,2);
-- → metadata.json 更新，旧数据补 NULL

-- 重命名（ID-based）
ALTER TABLE orders RENAME COLUMN old_name TO new_name;
-- → metadata.json 更新 name 映射，ID 不变，旧数据可读

-- 类型扩展
ALTER TABLE orders ALTER COLUMN amount TYPE BIGINT;
-- → metadata.json 更新类型，校验兼容性
```

**2. Delta Lake Schema Evolution**

```python
# 自动 Schema 演进
spark.readStream \
    .option("mergeSchema", "true") \
    .parquet("path") \
    .writeStream \
    .option("mergeSchema", "true") \
    .format("delta") \
    .start("path")
```

**3. Schema Registry（Kafka）**

```java
// 注册 Schema
Schema schema = new Schema.Parser().parse(schemaJson);
schemaRegistry.register("orders-value", schema);

// Producer 发送（自动序列化）
ProducerRecord<String, Order> record = new ProducerRecord<>("orders", order);
producer.send(record);  // 自动向 Schema Registry 注册新版本
```

**4. Time Travel 查询**

```sql
-- Iceberg
SELECT * FROM orders
FOR SYSTEM_TIME AS OF '2025-01-15 10:00:00';

-- Delta Lake
SELECT * FROM orders VERSION AS OF 123;

-- Hudi
SELECT * FROM orders WHERE _hoodie_commit_time = '20250115100000';
```

**5. Schema 兼容性规则（Avro）**

```json
{
  "type": "record",
  "name": "Order",
  "fields": [
    {"name": "order_id", "type": "long"},
    {"name": "user_id", "type": "long"},
    {"name": "amount", "type": ["null", "double"], "default": null}
  ]
}
```

**兼容性检查**：
- 删字段：必须有默认值（Backward）。
- 加字段：新字段必须有默认值（Forward）。

### 2.4 与相邻概念的关系

**Schema Evolution vs DDL**：

- DDL：直接修改物理存储。
- Schema Evolution：修改元数据 + 字段映射。

**Time Travel vs 数据备份**：

- 备份：完整数据副本，恢复慢。
- Time Travel：原地查询历史快照，快但保留时间有限。

**Schema Registry vs 数据目录**：

- Schema Registry：管理消息/表的 schema。
- 数据目录：管理数据资产（表、字段、血缘）。

> 💡 **思考锚点**：看你现有的事实表：哪些列做过「删列 / 重命名 / 类型收缩（long → int）」这类演进？对它们，你是靠 Time Travel 快照（受保留窗口与 Expire Snapshots + Vacuum 限制）还是完整备份兜底——两者恢复时间差几个量级，你的保留窗口设到多久，才够覆盖一次「上游改错列名、一周后才发现」？

---

- [§3. 设计模式与范式](06-schema-and-time-travel-section-3-sec3.md)
- [§4. 工程实现](06-schema-and-time-travel-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](06-schema-and-time-travel-section-5-ai.md)
- [§6. 落地实践](06-schema-and-time-travel-section-6-sec6.md)
- [§7. 与其他方法对比](06-schema-and-time-travel-section-7-sec7.md)
- [§8. 面试真题集](06-schema-and-time-travel-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](06-schema-and-time-travel-section-3-sec3.md)
- [§4. 工程实现](06-schema-and-time-travel-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](06-schema-and-time-travel-section-5-ai.md)
- [§6. 落地实践](06-schema-and-time-travel-section-6-sec6.md)
- [§7. 与其他方法对比](06-schema-and-time-travel-section-7-sec7.md)
- [§8. 面试真题集](06-schema-and-time-travel-section-8-sec8.md)

---
