> 本文件是 **15-one-data.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](15-one-data.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：阿里 OneData 标准模式**

- MaxCompute + DataWorks + OneID + 指标平台。
- 适用：阿里云用户、中大型企业。

**模式 2：开源 OneData 模式**

- Hive / Spark + Airflow + 自研 OneID + MetricFlow。
- 适用：开源栈企业。

**模式 3：实时 OneData 模式**

- Kafka + Flink + Hologres/StarRocks + 实时指标平台。
- 适用：实时业务。

**模式 4：AI 增强 OneData（OneData 4.0）**

- OneData + 通义 LLM + 向量库 + AI 指标生成。
- 适用：AI 时代。

**模式 5：联邦 OneData**

- 跨云 / 跨国 OneData 治理。
- 工具：Unity Catalog、Polaris。

**模式 6：Data Mesh 模式**

- 领域自治数据中台。
- 适用：复杂组织。

### 3.2 适用场景决策表

| 业务场景 | 推荐模式 | 典型技术栈 |
| --- | --- | --- |
| 阿里云用户 | 阿里 OneData 标准 | MaxCompute + DataWorks + 指标平台 |
| 开源栈企业 | 开源 OneData | Hive / Spark + Airflow + 自研 |
| 实时业务 | 实时 OneData | Kafka + Flink + Hologres/StarRocks |
| AI 时代 | AI 增强 OneData | OneData + 通义 LLM |
| 跨国 / 多云 | 联邦 OneData | Unity Catalog + Polaris |
| 复杂组织 | Data Mesh | 领域自治 + 联邦 |

### 3.3 反模式与陷阱

**反模式 1：烟囱式建设**

- 每个业务独立建数仓。
- **正确**：统一 OneModel 公共层。

**反模式 2：指标无 owner**

- 指标没负责人，口径漂移。
- **正确**：每个指标有明确 owner。

**反模式 3：OneID 不准确**

- ID-Mapping 错误，同一用户多个 ID。
- **正确**：强 ID + 弱 ID 联合建模 + 定期校验。

**反模式 4：指标平台不治理**

- 指标乱定义，没人维护。
- **正确**：指标生命周期管理。

**反模式 5：实时 + 离线口径不一致**

- 实时 GMV 和离线 GMV 对不上。
- **正确**：同一份代码 + 同一份存储 + 同一份指标定义。

---
