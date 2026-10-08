# Uber 数据架构 案例研究

> **一句话定位**：Uber 用 14 年时间构建了一套以「Schemaless + Docstore + Apache Hudi + Michelangelo ML 平台」为核心的全球化数据架构，是实时调度 + Marketplace 业务数据化最值得借鉴的海外样本。

> 本文是 data-travel 项目 [Ch15 · 案例库](../../README.md) 的子章节（**06-Uber 数据架构**）。标准化案例结构：背景 → 挑战 → 架构演进 → 关键决策 → 踩坑 → 复用经验。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| Uber 数据架构整体形态 | §3.1、§3.2、§3.3、§3.4 |
| Schemaless + Docstore 起源 | §4.1 |
| Apache Hudi 表格式 | §4.2 |
| Michelangelo ML 平台 | §4.3 |
| 实时调度架构（Uber Marketplace） | §4.4 |
| Uber Data Mesh 实践 | §4.5 |
| 全球多区域数据合规 | §4.6 |
| 实时数仓与实时特征 | §4.7 |
| 踩过哪些坑 | §5.1、§5.2、§5.3 |
| 哪些经验值得学 | §6.1、§6.3 |

---

## 1. 背景

### 1.1 公司 / 业务 / 时间

Uber 成立于 2009 年，至今 16 年。数据栈演进的关键时间节点：

- **2009–2012：早期阶段**。从 MySQL + MongoDB 起步，主要解决"司机 + 乘客"匹配。
- **2013：Schemaless 立项**。Uber 自研分布式 KV 存储（基于 MySQL）。
- **2014：Cassandra / HBase 大规模使用**。
- **2015：实时调度平台 V1**。Uber Marketplace 实时匹配系统。
- **2016：Apache Hudi 立项**。Vinoth Chandar 在 Uber 内部开始研发 Hudi（最初叫"Hoodie"）。
- **2017：Michelangelo ML 平台**。Uber 自研 ML 平台。
- **2018：实时数仓 V1**。Kafka + Flink + Hudi。
- **2019：Docstore 立项**。Uber 自研文档数据库（基于 Schemaless + Cassandra）。
- **2020：Apache Hudi 进入 Apache 孵化**。
- **2021：Hudi 0.6 发布，开始大规模使用**。
- **2022：Data Mesh 内部讨论**。Uber 内部推进数据所有权分散。
- **2023：GenAI 应用 + Hudi 1.0**。
- **2024：Uber AI Platform + 大模型应用**。
- **2025：实时 AI 数据栈**。

### 1.2 行业与监管

- **出行行业**：监管严格，每个城市都有不同法规。
- **金融监管**：Uber 支付 / Uber Cash 合规要求严格。
- **数据合规**：GDPR / CCPA / 全球多法域。
- **司机监管**：司机身份、健康、车辆等多维度数据合规。

### 1.3 团队规模与组织

- **Uber 数据团队**巅峰期约 **3000+ 人**。
- **数据平台部**（Data Platform）：约 300+ 人。
- **ML 平台团队**（Michelangelo）：约 200+ 人。
- **应用数据团队**：约 2000+ 人。
- **组织文化**：**"Build it, run it"** + **"数据驱动的 Marketplace"** + **"工程师文化"**。

---

## 2. 挑战

### 2.1 业务挑战

#### 2.1.1 Marketplace 实时性

Uber 是典型的双边 Marketplace——乘客 + 司机实时匹配，延迟必须 < 1 秒。

#### 2.1.2 全球化复杂

Uber 在 70+ 国家、10000+ 城市运营，每个城市的价格、法规、司机行为都不同。

#### 2.1.3 业务多形态

UberX / UberPool / Uber Eats / Uber Freight / Uber Elevate（飞行汽车）——业务多样化。

#### 2.1.4 高峰期流量

周五晚上、演唱会后、节假日——Uber 流量峰值是日常的 5–10 倍。

### 2.2 技术挑战

#### 2.2.1 海量实时数据

- 全球 1 亿+ 月活用户。
- 每天数十亿次行程请求。
- 实时特征延迟 < 1 秒。

#### 2.2.2 存储选型

传统 MySQL / Cassandra 在 Uber 场景下都有问题：

- **MySQL**：水平扩展能力有限。
- **Cassandra**：一致性弱、事务能力差。

#### 2.2.3 表格式选型

2018 年以前 Uber 使用 Hive 表格式，同样遇到 Hive 的所有问题。

#### 2.2.4 ML 工程化

Uber 有 1000+ 算法工程师，每个工程师都有自己的模型、特征、AB 实验——如何让 ML 工程化？

### 2.3 组织挑战

#### 2.3.1 跨地域协作

Uber 在旧金山总部 + 阿姆斯特丹 + 班加罗尔 + 上海 + 多伦多 + 巴西等地区有团队，跨地域协作挑战大。

#### 2.3.2 多业务线协同

UberX / Eats / Freight / Elevate——每个业务线都有自己的数据团队，跨业务协同难。

#### 2.3.3 数据所有权

业务团队和数据团队之间的"数据所有权"边界模糊。

---

## 3. 架构演进

### 3.1 V1.0：传统数据库 + Hadoop（2009–2013）

**形态**：

```
[MySQL / MongoDB] → [Hadoop + Hive] → [Tableau]
```

**问题**：

- MySQL 单库容量上限。
- Hive 表格式问题。
- 没有统一的实时计算。

### 3.2 V2.0：Schemaless + Cassandra（2013–2017）

**关键事件**：

- 2013：Schemaless 立项（基于 MySQL）。
- 2014：Cassandra 大规模使用。
- 2015：实时调度平台 V1。

**Schemaless 核心**：

- 基于 MySQL 的水平扩展方案。
- 解决单库容量问题。
- **被 Uber 多个团队使用**。

**Cassandra 核心**：

- 解决"高写入吞吐"问题。
- 用于司机位置、乘客请求等场景。

### 3.3 V3.0：Apache Hudi + Docstore（2016–2020）

**关键事件**：

- 2016：Hoodie（后来的 Hudi）在 Uber 立项。
- 2017：Michelangelo ML 平台上线。
- 2018：实时数仓 V1。
- 2019：Docstore 立项。
- 2020：Hudi 进入 Apache 孵化。

**Hudi 核心**：

- **Update / Delete 支持**：基于 Copy-on-Write / Merge-on-Read。
- **ACID 事务**：保证数据一致性。
- **Time Travel**：可回溯历史版本。
- **CDC（Change Data Capture）**：支持 MySQL / Cassandra 的 CDC。

### 3.4 V4.0：Hudi + 实时数仓 + AI（2020–2024）

**关键事件**：

- 2020：实时数仓 V2 全面铺开。
- 2021：Hudi 0.6 发布。
- 2022：Data Mesh 内部讨论。
- 2023：Hudi 1.0 发布，GenAI 应用。
- 2024：Uber AI Platform + 大模型。

**架构**：

```
[业务系统] → [Kafka] → [Flink] → [Hudi] → [Spark / Trino] → [BI / ML]
   (事件)    (消息)    (实时)   (表格式)   (查询)          (消费)
```

### 3.5 V5.0：AI Native 数据栈（2023–2025）

**关键事件**：

- 2023：Uber 内部广泛使用大模型（OpenAI / Claude / 开源模型）。
- 2024：Uber AI Platform 发布，整合 ML + LLM。
- 2025：实时 AI 数据栈（实时特征 + 大模型）。

---

## 4. 关键决策

### 4.1 决策 1：为什么 Schemaless + Docstore？

#### 4.1.1 决策路径

- **方案 A：MySQL 单库**（2010 前）：成熟但容量有限。
- **方案 B：MySQL 分库分表**（2010–2013）：分库分表后运维复杂。
- **方案 C（最终选择）：Schemaless + Cassandra**（2013+）：自研分布式存储。

#### 4.1.2 Schemaless 关键设计

```
[Schemaless] = [MySQL] + [自动分片] + [副本同步]
```

- **基于 MySQL**：复用 MySQL 生态。
- **自动分片**：基于 row key 自动分片。
- **副本同步**：跨机房副本同步。

#### 4.1.3 Docstore 演进

2019 年 Docstore 立项，目标是统一 Schemaless + Cassandra：

```
[Docstore] = [统一文档模型] + [多种存储后端]
```

- **统一文档模型**：JSON / BSON。
- **多种存储后端**：MySQL / Cassandra / S3。

### 4.2 决策 2：为什么 Apache Hudi？

#### 4.2.1 决策路径

- **方案 A：Hive 表格式**：成熟但 ACID 弱。
- **方案 B：Delta Lake**：Databricks 主控。
- **方案 C（最终选择）：Hudi**：Uber 自研。

#### 4.2.2 Hudi vs Iceberg vs Delta Lake

| 维度 | Hudi | Iceberg | Delta Lake |
| --- | --- | --- | --- |
| 主控方 | Apache（Uber 起源） | Apache（Netflix 起源） | Databricks |
| ACID | 有 | 有 | 有 |
| Update / Delete | 强 | 中 | 强 |
| CDC 支持 | 强（核心特性） | 中 | 中 |
| 多引擎 | Spark / Flink | Spark / Flink / Trino | Spark 为主 |
| 索引 | 内建 | 弱 | 中 |

**决策**：Hudi。

**理由**：

1. **CDC 友好**：Uber 业务大量 CDC 场景，Hudi 的 CDC 能力强。
2. **Update / Delete**：Hudi 原生支持 upsert，适合 Uber 场景。
3. **Uber 主导**：可定制化能力强。

#### 4.2.3 验证

Hudi 2024 年成为 Apache 顶级项目，AWS / Google Cloud / Alibaba Cloud 都集成 Hudi。

### 4.3 决策 3：Michelangelo ML 平台

#### 4.3.1 Michelangelo 架构

```
[数据] → [特征平台] → [训练] → [部署] → [推理]
         (Uber       (Spark /    (Docker)  (在线
          Feature     TF / Pytorch)          服务)
          Store)
```

#### 4.3.2 核心能力

- **特征存储（Feature Store）**：
  - 离线特征（基于 Hive / Hudi）。
  - 在线特征（基于 Cassandra / Redis）。
  - 特征版本管理。

- **模型训练**：
  - Spark MLlib。
  - TensorFlow / PyTorch。
  - Horovod（分布式训练）。

- **模型部署**：
  - 基于 Kubernetes。
  - 在线推理服务。

- **模型监控**：
  - 预测分布监控。
  - 漂移检测。

#### 4.3.3 Michelangelo 应用场景

- **ETA 预估**：实时预估行程时长。
- **定价**：基于供需的实时定价。
- **司机 - 乘客匹配**：实时匹配算法。
- **反欺诈**：实时识别欺诈订单。
- **推荐**：餐厅推荐、餐厅排序。

### 4.4 决策 4：实时调度架构

#### 4.4.1 Uber Marketplace 实时性挑战

- 行程请求必须 < 1 秒响应。
- 司机位置每秒更新。
- 实时定价每秒计算。

#### 4.4.2 实时调度架构

```
[乘客请求] → [Kafka] → [匹配服务] → [司机 App]
              (毫秒)    (毫秒)        (毫秒)
```

#### 4.4.3 关键技术

- **Cassandra**：存储司机位置（高写入）。
- **Redis**：存储会话状态。
- **Kafka**：实时消息流。
- **Flink**：实时计算。
- **自研调度服务**：基于地理位置的匹配算法。

### 4.5 决策 5：Uber Data Mesh 实践

#### 4.5.1 演进路径

- **2015–2018：集中数仓**：所有数据集中在一个团队。
- **2019–2021：分散 + 自治**：业务团队开始拥有自己的数据。
- **2022+：Data Mesh**：每个业务团队是"数据域"，有自己的数据 + 数据产品。

#### 4.5.2 Data Mesh 四大原则

1. **数据域所有权**：每个业务团队拥有自己的数据。
2. **数据即产品**：每个数据集都是"数据产品"。
3. **联邦治理**：跨业务数据治理通过"联邦委员会"。
4. **自助平台**：基础设施平台化，业务团队自助消费。

#### 4.5.3 Uber 实践

- **数据产品目录**：所有数据集注册到统一目录。
- **数据 Owner**：每个数据集有 Owner。
- **数据 SLA**：每个数据集有 SLA。
- **联邦治理委员会**：跨业务数据治理。

### 4.6 决策 6：全球多区域数据合规

#### 4.6.1 合规挑战

- GDPR（欧洲）：数据本地化、用户删除权。
- CCPA（加州）：用户数据访问权、删除权。
- 各国本地化法规。

#### 4.6.2 架构方案

```
[欧洲用户] → [欧洲机房] → [欧洲 Hudi 表] → [欧洲查询]
[美国用户] → [美国机房] → [美国 Hudi 表] → [美国查询]
[跨区域] → [联邦查询] → [汇总 Hudi 表]
```

#### 4.6.3 关键技术

- **数据本地化**：基于 Kubernetes 多集群。
- **跨区域查询**：联邦查询（Federated Query）。
- **数据删除权**：基于"墓碑"标记 + 定时清理。

### 4.7 决策 7：实时数仓与实时特征

#### 4.7.1 实时数仓架构

```
[业务系统] → [Kafka] → [Flink] → [Hudi] → [Trino] → [BI]
```

#### 4.7.2 实时特征

- **司机位置**：每秒更新。
- **司机 - 乘客距离**：实时计算。
- **路段拥堵情况**：实时路况。
- **用户偏好**：基于最近行为实时更新。

#### 4.7.3 特征平台架构

```
[离线特征] → [Hive / Hudi] → [训练数据]
[实时特征] → [Flink] → [Cassandra / Redis] → [在线服务]
```

### 4.8 决策 8：Uber AI Platform（2024+）

#### 4.8.1 平台架构

```
[数据] → [ML + LLM 训练] → [模型部署] → [推理服务]
```

#### 4.8.2 核心能力

- **大模型微调**：基于开源模型（Llama / Mistral / Qwen）。
- **RAG**：基于内部知识库的检索增强。
- **多模态**：图像理解、语音识别。
- **Agent**：自动化工作流。

#### 4.8.3 应用场景

- **智能客服**：自动处理司机 / 乘客咨询。
- **智能营销**：基于大模型的精准营销。
- **智能调度**：基于大模型的辅助调度。

---

## 5. 踩坑与教训

### 5.1 坑 1：Schemaless 的"复杂运维"

**问题**：Schemaless 基于 MySQL 自研，运维复杂度极高——Uber 内部有专门的 SRE 团队维护 Schemaless。

**根因**：

- 自研存储引擎意味着所有 bug 必须自己修。
- 跨机房副本同步复杂。
- 数据一致性保障复杂。

**教训**：

- **自研存储引擎成本极高**——除非有独特价值。
- **必须考虑运维团队规模**——SRE 团队必须够大。

**修正**：Uber 通过 Docstore 抽象，让业务团队不用关心底层。

### 5.2 坑 2：Cassandra 的"一致性陷阱"

**问题**：Cassandra 的"最终一致性"在 Uber 场景下造成数据不一致——比如司机位置在多个数据中心不一致。

**根因**：

- Cassandra 默认最终一致性。
- 跨数据中心复制延迟。
- 网络抖动导致副本切换。

**教训**：

- **Cassandra 一致性必须显式设置**——不能依赖默认值。
- **必须监控一致性指标**——监控"不一致窗口"。

**修正**：Uber 通过"客户端强读 + LOCAL_QUORUM"策略保障一致性。

### 5.3 坑 3：Hudi "破坏性升级"

**问题**：Hudi 0.x → 1.0 升级时遇到数据文件兼容性问题。

**根因**：

- Hudi 在快速发展期，文件格式版本变化。
- 升级时老数据需要重写。

**教训**：

- **开源表格式升级需要灰度**——不能一次性升级。
- **必须保留回退能力**。

**修正**：Uber 建立"Hudi 升级灰度机制"——先在 1% 数据上升级。

### 5.4 坑 4：实时调度的"资源竞争"

**问题**：2018 年 Uber 实时调度系统在高流量时段出现"资源竞争"——多个实时任务抢占 CPU / 内存。

**根因**：

- 实时任务没有资源隔离。
- 多任务共享 Kubernetes 节点。
- 没有"资源配额"机制。

**教训**：

- **实时任务必须有资源隔离**——基于 Kubernetes namespace + ResourceQuota。
- **必须有"任务优先级"机制**——关键任务优先。

**修正**：Uber 建立"Kubernetes ResourceQuota + PriorityClass"机制。

### 5.5 坑 5：Michelangelo "模型版本管理"混乱

**问题**：2020 年 Uber 内部有 10000+ 模型，模型版本管理混乱。

**根因**：

- 每个团队都有自己的模型管理方式。
- 没有统一的模型注册中心。

**教训**：

- **必须有统一模型注册中心**——所有模型注册后才能使用。
- **必须有模型版本管理**——支持版本回滚。

**修正**：Michelangelo 引入 MLflow + 自研 Model Registry。

---

## 6. 复用经验

### 6.1 适合谁学

#### 6.1.1 强实时业务（出行 / 外卖 / 物流）

- **典型**：Uber、美团外卖、滴滴、Instacart。
- **原因**：实时调度 + 实时特征是核心竞争力。

#### 6.1.2 Marketplace 业务

- **典型**：双边平台（乘客 + 司机、买家 + 卖家）。
- **原因**：Marketplace 实时匹配是核心场景。

#### 6.1.3 全球化业务

- **典型**：跨国业务、多区域运营。
- **原因**：多区域数据合规 + 联邦查询成熟。

#### 6.1.4 强 ML 工程化需求

- **典型**：大型互联网公司、AI 公司。
- **原因**：Michelangelo 思路值得借鉴。

### 6.2 不适合谁学

#### 6.2.1 数据规模小的初创公司

- **反例**：日活 < 100 万。
- **原因**：Cassandra / Hudi 复杂度过高。

#### 6.2.2 单一业务线

- **反例**：单业务 B 端 SaaS。
- **原因**：不需要 Marketplace 实时性。

#### 6.2.3 弱 ML 需求

- **反例**：传统企业内部系统。
- **原因**：Michelangelo 价值小。

### 6.3 关键可复用资产

#### 6.3.1 开源项目

- **[Apache Hudi](https://hudi.apache.org/)**：Uber 主导的表格式。
- **[Apache Cassandra](https://cassandra.apache.org/)**：Uber 大规模使用。
- **[Apache Kafka](https://kafka.apache.org/)**：Uber 是 Kafka 早期用户。
- **[Apache Flink](https://flink.apache.org/)**：实时计算。
- **[Horovod](https://github.com/horovod/horovod)**：Uber 开源的分布式训练框架。
- **[Apache Spark](https://spark.apache.org/)**：Uber 大规模使用。
- **[MLflow](https://mlflow.org/)**：模型生命周期管理。
- **[Michelangelo](https://www.uber.com/blog/michelangelo-machine-learning-platform/)**：Uber 博客开源介绍。

#### 6.3.2 关键技术

- **存储选型**：Cassandra（高写入）+ Schemaless（自研 KV）。
- **表格式**：Hudi（CDC + Upsert 友好）。
- **调度系统**：Apache Airflow。
- **ML 平台**：Michelangelo 思路 + MLflow。
- **联邦治理**：Data Mesh + 联邦委员会。

### 6.4 复用清单（Checklist）

#### 6.4.1 存储层

- [ ] 是否有"统一 KV 存储"？（Cassandra / 自研）
- [ ] 是否有"水平扩展能力"？
- [ ] 是否有"跨机房副本同步"？

#### 6.4.2 表格式层

- [ ] 是否有"统一表格式"？（Hudi / Iceberg / Delta Lake）
- [ ] 是否有"CDC 能力"？
- [ ] 是否有"Update / Delete"支持？

#### 6.4.3 计算层

- [ ] 是否有"实时计算引擎"？（Flink）
- [ ] 是否有"离线计算引擎"？（Spark）
- [ ] 是否有"统一调度"？（Airflow / Maestro）

#### 6.4.4 ML 层

- [ ] 是否有"特征平台"？
- [ ] 是否有"模型训练平台"？
- [ ] 是否有"模型部署平台"？
- [ ] 是否有"模型监控"？

#### 6.4.5 治理层

- [ ] 是否有"数据产品目录"？
- [ ] 是否有"数据 Owner 机制"？
- [ ] 是否有"数据 SLA"？

#### 6.4.6 合规层

- [ ] 是否有"数据本地化"能力？
- [ ] 是否有"联邦查询"能力？
- [ ] 是否有"数据删除权"能力？

---

## 7. 与同类案例对比

### 7.1 对比维度

| 维度 | Uber | Netflix | Airbnb | 美团 |
| --- | --- | --- | --- | --- |
| 主导思想 | Marketplace + 实时 | 数据自由 + 自治 | 数据科学家友好 | 业务落地 + 全栈 |
| 表格式 | Hudi | Iceberg | Iceberg | Iceberg |
| 实时 | Kafka + Flink | Kafka + Flink | Kafka + Spark | Kafka + Flink |
| ML 平台 | Michelangelo | Metaflow | MLflow | PAI |
| 调度 | Airflow | Maestro | Airflow | Dolphin |
| 存储 | Cassandra / Schemaless | S3 | S3 | HDFS / OSS |

### 7.2 取舍

- **Uber = Marketplace 实时性 + CDC 友好**——适合需要 CDC + Update/Delete 的场景。
- **Netflix = 自由 + 自治**——适合多引擎 + 灵活组织。
- **Airbnb = 数据科学家友好**——适合数据科学家协作。
- **美团 = 业务落地 + 全栈**——适合强业务驱动。

**对架构师的启示**：

- **学 Hudi 思路**——CDC + Update/Delete 是关键。
- **学 Michelangelo 思路**——把 ML 工程化做成"基础设施"。
- **学实时调度架构**——Marketplace 实时性是核心。
- **学 Data Mesh 思路**——但要按企业实际裁剪。

---

## 8. 面试真题集

> 本节内容待补充。题源待与原 PDF《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）题库对齐。

### 8.1 候选题目方向

- Uber Schemaless 与 Docstore 的演进路径？
- Hudi vs Iceberg vs Delta Lake 的核心差异？
- Hudi 的 Copy-on-Write vs Merge-on-Read 取舍？
- Uber 实时调度架构（Marketplace 实时匹配）？
- Michelangelo ML 平台的核心模块？
- Uber Data Mesh 实践（数据产品 + 联邦治理）？
- Uber 多区域数据合规架构？
- Uber 实时特征平台架构？
- Uber 对 Cassandra 一致性的处理？
- Uber AI Platform 与大模型应用？

---

## 9. 参考资料

- **官方资料**：
  - Uber Engineering Blog：https://www.uber.com/blog/engineering/
  - Apache Hudi：https://hudi.apache.org/
  - Michelangelo：Uber 开源博客介绍
- **学术论文**：
  - SIGMOD / VLDB 多篇 Uber 数据架构论文
- **演讲**：
  - Strata Data Conference Uber 演讲
  - QCon Uber 技术演讲
- **媒体**：
  - InfoQ《Uber 数据架构演进》
  - The New Stack《Uber Hudi 实践》

> **上一章**：[Netflix 数据栈](../05-netflix-data-stack/) > **下一章**：[Airbnb 数据架构](../07-airbnb-data-architecture/)