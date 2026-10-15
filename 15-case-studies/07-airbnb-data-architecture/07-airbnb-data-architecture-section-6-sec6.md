> 本文件是 **07-airbnb-data-architecture.md** 的子文件（§6. 复用经验）。完整章节请回到 [index](07-airbnb-data-architecture.md)。

## 6. 复用经验

### 6.1 适合谁学

#### 6.1.1 强数据驱动文化的公司

- **典型**：Airbnb、Netflix、字节。
- **原因**：Minerva / Dataportal 需要文化支撑。

#### 6.1.2 指标密集型业务

- **典型**：电商、金融、SaaS。
- **原因**：指标治理价值巨大。

#### 6.1.3 数据科学家 + 业务分析师协同

- **典型**：中型 + 大型公司。
- **原因**：数据科学家友好平台价值大。

#### 6.1.4 强数据合规需求

- **典型**：金融、医疗、跨境业务。
- **原因**：Dataportal 元数据治理成熟。

### 6.2 不适合谁学

#### 6.2.1 数据规模小的初创公司

- **反例**：日活 < 100 万。
- **原因**：Minerva / Dataportal 复杂度过高。

#### 6.2.2 弱数据驱动文化的公司

- **反例**：传统企业凭经验决策。
- **原因**：没有文化支撑，平台无人用。

#### 6.2.3 单一业务线

- **反例**：单业务 B 端 SaaS。
- **原因**：元数据治理投入产出比低。

### 6.3 关键可复用资产

#### 6.3.1 开源项目

- **[Apache Airflow](https://airflow.apache.org/)**：Airbnb 自研开源。
- **[Minerva](https://medium.com/airbnb-engineering)**：Airbnb 博客介绍。
- **[Dataportal](https://medium.com/airbnb-engineering)**：Airbnb 博客介绍。
- **[Apache Iceberg](https://iceberg.apache.org/)**：Airbnb 是 Iceberg 贡献者。
- **[Apache Druid](https://druid.apache.org/)**：实时 OLAP。
- **[MLflow](https://mlflow.org/)**：模型管理。

#### 6.3.2 关键技术

- **调度系统**：Airflow。
- **指标平台**：Minerva 思路（自研或商业）。
- **元数据平台**：Dataportal 思路。
- **数据质量**：基于断言 + 监控。
- **ML 平台**：Bighead 思路。

### 6.4 复用清单（Checklist）

#### 6.4.1 元数据层

- [ ] 是否有"统一指标平台"？
- [ ] 是否有"元数据目录"？
- [ ] 是否有"数据血缘"？
- [ ] 是否有"数据 Owner"机制？

#### 6.4.2 数据层

- [ ] 是否有"数据分层模型"（DWD / DWS / ADS）？
- [ ] 是否有"数据质量监控"？
- [ ] 是否有"数据 SLA"？

#### 6.4.3 计算层

- [ ] 是否有"统一调度系统"？（Airflow）
- [ ] 是否有"实时计算引擎"？
- [ ] 是否有"离线计算引擎"？

#### 6.4.4 治理层

- [ ] 是否有"指标治理委员会"？
- [ ] 是否有"数据治理流程"？
- [ ] 是否有"自助分析平台"？

#### 6.4.5 ML 层

- [ ] 是否有"ML 平台"？
- [ ] 是否有"特征平台"？
- [ ] 是否有"模型部署平台"？

---
