> 本文件是 **14-optimizer.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](14-optimizer.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：CBO + 统计信息（标准）**

- 收集统计信息 + CBO 自动优化。
- 适用：所有现代查询引擎。

**模式 2：AQE 自适应（2020+）**

- 运行时调整 + 优化。
- 适用：Spark 3.x、Trino、StarRocks。

**模式 3：AI 驱动优化（2024 新）**

- LLM 自动诊断 + 自动调优。
- 适用：Snowflake、StarRocks AI Advisor。

**模式 4：Calcite 嵌入式优化器**

- 自研查询引擎集成 Calcite。
- 适用：自研场景。

**模式 5：Cost-Based + Cascade 框架**

- 经典 CBO 实现。
- 适用：自研高性能引擎。

**模式 6：AI 自治优化（2025+）**

- 自治优化器，无人工干预。
- 适用：未来。

### 3.2 适用场景决策表

| 业务场景 | 推荐优化器 | 典型技术栈 |
| --- | --- | --- |
| Spark / Trino | CBO + AQE | Spark 3.x、Trino 420+ |
| StarRocks / Doris | CBO + AQE + AI | StarRocks 3.x、Doris 2.1+ |
| ClickHouse | CBO + 向量化 | ClickHouse 24.x |
| 自研查询引擎 | Calcite / Velox | Apache Calcite、Velox |
| AI 原生 | AI 驱动 | Snowflake、StarRocks AI |

### 3.3 反模式与陷阱

**反模式 1：不收集统计信息**

- 现象：CBO 选错计划。
- 解决：定期 ANALYZE。

**反模式 2：未启用 AQE**

- 现象：错过运行时优化。
- 解决：开启 AQE。

**反模式 3：统计信息陈旧**

- 现象：数据分布变化，统计信息不准。
- 解决：定期刷新 + 自动收集。

**反模式 4：Join 顺序错误**

- 现象：大表 Join 大表慢。
- 解决：人工 hint + 广播小表。

**反模式 5：忽视数据倾斜**

- 现象：单 Task 慢。
- 解决：自适应 Skew Join。

**反模式 6：完全依赖 CBO**

- 现象：CBO 选错计划。
- 解决：CBO + 人工 hint。

---
