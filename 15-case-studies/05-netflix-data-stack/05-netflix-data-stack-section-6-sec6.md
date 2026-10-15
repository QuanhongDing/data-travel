> 本文件是 **05-netflix-data-stack.md** 的子文件（§6. 复用经验）。完整章节请回到 [index](05-netflix-data-stack.md)。

## 6. 复用经验

### 6.1 适合谁学

#### 6.1.1 大规模数据栈（PB 级）

- **典型**：日活 1000 万+、日数据 TB 级。
- **原因**：Iceberg + Spark/Flink 是规模化首选。

#### 6.1.2 多引擎需求（Spark / Flink / Trino）

- **典型**：同时使用多种计算引擎。
- **原因**：Iceberg 多引擎支持。

#### 6.1.3 强自治文化团队

- **典型**：高人才密度、工程师友好的公司。
- **原因**：Metaflow / Data Mesh 需要工程师自治文化。

#### 6.1.4 全球 / 多区域业务

- **典型**：跨国企业、跨境业务。
- **原因**：Iceberg + 多区域架构成熟。

### 6.2 不适合谁学

#### 6.2.1 数据规模小的公司

- **反例**：日活 < 100 万、日数据 < 100 GB。
- **原因**：Iceberg 复杂度过高，原生 Parquet 够用。

#### 6.2.2 单一引擎需求

- **反例**：只用 Spark 的公司。
- **原因**：Delta Lake 更合适。

#### 6.2.3 弱自治文化团队

- **反例**：传统央企、制造业。
- **原因**：Metaflow / Data Mesh 推进困难。

### 6.3 关键可复用资产

#### 6.3.1 开源项目

- **[Apache Iceberg](https://iceberg.apache.org/)**：Netflix 主导的表格式。
- **[Apache Kafka](https://kafka.apache.org/)**：Netflix 是 Kafka 大用户。
- **[Apache Flink](https://flink.apache.org/)**：实时计算。
- **[Apache Spark](https://spark.apache.org/)**：离线计算。
- **[Netflix Maestro](https://github.com/Netflix/maestro)**：工作流调度。
- **[Netflix Metaflow](https://github.com/Netflix/metaflow)**：ML 框架。
- **[Trino](https://trino.io/)**：查询引擎（Netflix 编）。
- **[Apache Iceberg REST Catalog](https://github.com/apache/iceberg)**：Iceberg 元数据服务。

#### 6.3.2 关键技术

- **表格式选型**：Iceberg（多引擎）+ Delta Lake（Spark 生态）。
- **流批一体**：Kafka + Flink + Iceberg。
- **调度系统**：Maestro / Airflow。
- **ML 框架**：Metaflow / MLflow / Kubeflow。
- **联邦治理**：Data Mesh + 联邦委员会。

### 6.4 复用清单（Checklist）

#### 6.4.1 表格式层

- [ ] 是否评估过 Iceberg / Delta Lake / Hive？
- [ ] 是否选定了统一表格式？
- [ ] 是否有"表格式升级灰度机制"？

#### 6.4.2 计算层

- [ ] 是否有统一离线计算引擎（Spark / Hive）？
- [ ] 是否有统一实时计算引擎（Flink）？
- [ ] 是否有流批一体能力？
- [ ] 是否有统一调度系统（Maestro / Airflow）？

#### 6.4.3 存储层

- [ ] 是否有统一存储（S3 / OSS / HDFS）？
- [ ] 是否有统一元数据服务（Iceberg REST Catalog）？
- [ ] 是否有强一致性保障？

#### 6.4.4 ML 层

- [ ] 是否有 ML 框架（Metaflow / MLflow）？
- [ ] 是否有训练平台（Kubernetes + Spark）？
- [ ] 是否有推理平台（容器服务）？

#### 6.4.5 治理层

- [ ] 是否有"数据产品目录"？
- [ ] 是否有"数据 Owner 机制"？
- [ ] 是否有"数据 SLA"？
- [ ] 是否有"联邦治理委员会"？

---
