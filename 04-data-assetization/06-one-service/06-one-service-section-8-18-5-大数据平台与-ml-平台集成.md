> 本文件是 **06-one-service.md** § 8 面试真题集 的子主题。完整章节请回到 [index](06-one-service.md) 或 [§ 8 索引](06-one-service-section-8-sec8.md)。

### 8.7 §18.5 大数据平台与 ML 平台集成

> 本主题 5 道题覆盖大数据平台（Spark / Flink / 湖仓）与 ML 平台（MLflow / FeatureStore / 推理服务）的集成。OneService 是这两者的"对外服务化层"——ML 产出的特征 / 模型通过 OneService API 暴露给业务方。

#### §18.5.1 请简要说明在大数据平台中，特征工程通常包含哪些主要步骤，并阐述这些步骤在数据湖仓一体架构中的实现方式。

**1. 考察点**

- 是否理解特征工程的全流程（不是只"提取特征"）。
- 能否把每一步映射到湖仓的具体实现（SQL / Spark / Flink）。
- 是否知道特征工程的工程代价（耗时 / 资源 / 复现性）。

**2. 参考答案框架**

**第一层：特征工程的六大步骤。**

1. **数据接入**：从业务库 / 日志 / 第三方接入原始数据。
2. **数据清洗**：去重、缺失值、异常值处理、格式统一。
3. **特征提取**：聚合（count / sum / avg）、时间窗口（1d / 7d / 30d）、比率、嵌入。
4. **特征选择**：相关性分析、PCA、模型特征重要性。
5. **特征存储**：离线（Delta / Iceberg）+ 在线（Redis / Cassandra）双写。
6. **特征监控**：分布变化、缺失率、特征重要性变化。

**第二层：在湖仓一体中的实现。**

| 步骤 | 湖仓实现 |
| --- | --- |
| 数据接入 | Flink CDC / Kafka → Delta / Iceberg |
| 数据清洗 | Spark SQL / dbt 模型 |
| 特征提取 | Spark SQL 聚合 / Flink 窗口 / 自定义 UDF |
| 特征选择 | Spark MLlib / Python sklearn |
| 特征存储 | Delta Table（离线）+ Redis / Cassandra（在线） |
| 特征监控 | Prometheus + 自定义指标 + Evidently AI |

**第三层：关键技术选型。**

- **特征平台**：Feast / Tecton / 阿里 PAI FeatureStore。
- **特征定义语言**：DSL（Feast feature view）+ SQL。
- **离线 / 在线一致性**：同一份 DSL，编译期生成 Spark / Flink 作业。

**第四层：典型架构。**

```
[原始数据] → [湖仓 ETL] → [离线特征 (Delta/Iceberg)]
                ↓
          [Flink 实时 ETL] → [在线特征 (Redis)]
                ↓
            [特征平台]
                ↓
       [模型训练 + 推理 + OneService API]
```

**第五层：工业案例。**

- **Uber Michelangelo**：特征工程的端到端平台。
- **字节跳动**：特征平台支撑推荐 / 广告。
- **Databricks**：Unity Catalog + Feature Store 统一管理。
- **阿里 PAI**：国内最完整的 ML 平台。

**3. 常见陷阱**

- **特征定义分散**：每个团队自己定义特征 → 重复 / 不一致。应对：特征平台强制统一。
- **离线 / 在线特征不一致**：Spark SQL 与 Flink SQL 各写一遍 → 数字对不上。应对：同一份 DSL。
- **特征监控缺失**：特征分布变化 → 模型失效。应对：PSI + 自动告警。

**4. 追问预测**

- **「特征平台和 OneService 的关系？」** 答：特征平台定义 + 计算特征，OneService 把特征封装为 API。OneService 是特征平台的"对外接口"。
- **「如何选择特征存储？」** 答：热特征（< 10ms）走 Redis；冷特征 / 大特征走 Cassandra；OLAP 风格的特征走 Druid。

**5. 参考资料**

- Feast / Tecton 官方文档——特征平台。
- Uber Michelangelo 公开技术博客——特征工程范式。
- Databricks Feature Store 官方文档。
- 阿里 PAI 公开技术文档——国内 ML 平台。
- **Shein 跨境电商基于湖仓特征工程支持全球推荐** —— 公开案例描述了多区域商品特征的离线 / 在线一致性。
- **中国移动用户画像特征工程在湖仓架构上批量产出** —— 公开材料描述了全国用户行为画像的特征流水线。
- **永辉超市商品 / 用户特征工程走湖仓 + 特征平台** —— 公开技术分享描述了零售业务特征复用与治理。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **京东零售** —— 京东零售双 11 实时特征极限压力——KV 热点、Flink 反压、Schema 演进的工程化解法。
- **唯品会** —— 唯品会特卖场景的数据平台——日清模式 + 离线数仓 + 实时推荐三层结构。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **京东零售** —— 京东零售双 11 实时特征极限压力——KV 热点、Flink 反压、Schema 演进的工程化解法。
- **唯品会** —— 唯品会特卖场景的数据平台——日清模式 + 离线数仓 + 实时推荐三层结构。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **京东零售** —— 京东零售双 11 实时特征极限压力——KV 热点、Flink 反压、Schema 演进的工程化解法。
- **唯品会** —— 唯品会特卖场景的数据平台——日清模式 + 离线数仓 + 实时推荐三层结构。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §18.5.2 请阐述如何将 MLflow 这类机器学习生命周期管理平台与现有的大数据平台进行集成，并说明关键集成点。

**1. 考察点**

- 是否理解 MLflow 的核心组件（Tracking / Projects / Models / Registry）。
- 能否列出与大数据平台（Spark / Delta / Flink）的具体集成点。
- 是否知道工程实践（认证 / 元数据 / 模型部署）。

**2. 参考答案框架**

**第一层：MLflow 四大组件。**

1. **MLflow Tracking**：实验记录（参数、指标、artifact）。
2. **MLflow Projects**：可复现打包（conda / docker）。
3. **MLflow Models**：模型打包（多种 flavor：Python / Spark / ONNX）。
4. **MLflow Model Registry**：模型版本化 + Stage（None / Staging / Production / Archived）。

**第二层：与大数据平台的集成点。**

| 集成点 | 实现 |
| --- | --- |
| **训练任务** | Spark / Flink 作业通过 `mlflow.spark.log_model` 或 `mlflow.pytorch.autolog` 上报实验。 |
| **特征存储** | MLflow 通过 Feast / Tecton 记录特征引用；模型签名绑定特征 version。 |
| **数据集版本化** | MLflow artifact 用 Delta / Iceberg 路径，dataset hash 写到 tags。 |
| **模型部署** | MLflow Models 直接打包成 Docker / SageMaker / Spark UDF。 |
| **调度集成** | MLflow 与 Airflow / DolphinScheduler 集成，触发训练 → 评估 → 部署。 |
| **血缘集成** | MLflow 与 OpenLineage 集成，记录模型 → 数据集血缘。 |

**第三层：典型架构。**

```
[Spark / Flink 训练作业] → [MLflow Tracking Server]
        ↓                          ↓
   [MLflow Model Registry]   [Artifact Store (S3/OSS)]
        ↓
   [MLflow Models] → [SageMaker / TensorFlow Serving / Triton]
        ↓
   [OneService API 网关]
```

**第四层：关键集成工程要点。**

- **认证**：MLflow Tracking Server 接入企业 SSO（OIDC / LDAP）。
- **元数据后端**：MLflow 默认 SQLite → 生产换 PostgreSQL + 高可用。
- **Artifact Store**：接对象存储（S3 / OSS），不存本地盘。
- **权限**：MLflow 没有 RBAC → 接入企业权限系统。
- **监控**：MLflow 自身监控（API 成功率、artifact IO）+ 自定义业务指标。

**第五层：与 OneService 的集成。**

- MLflow 模型注册 → 自动触发 OneService API 生成（模型即 API）。
- OneService 通过 MCP / Function Calling 注册 MLflow 模型为 Tool。
- MLflow 模型监控 → OneService 可观测层报警。

**第六层：工业案例。**

- **Databricks**：MLflow 原生集成 + Unity Catalog 一体化。
- **Uber Michelangelo**：内部 ML 平台，与 MLflow 兼容。
- **Meta（Facebook）**：基于 MLflow 扩展的 FBLearner Flow。
- **字节跳动**：内部 ML 平台，对外 MLflow 兼容。

**3. 常见陷阱**

- **MLflow 默认配置用于生产**。SQLite / 本地 artifact → 生产必换。
- **模型签名缺失**。模型训练后没有 input/output schema → 部署后无法校验。应对：模型签名强制。
- **实验记录与模型版本脱钩**。tracking 找不到对应模型 → 实验不可复现。应对：MLflow Registry 自动 link。

**4. 追问预测**

- **「MLflow 与 Kubeflow 怎么选？」** 答：MLflow 轻量、实验管理强；Kubeflow 重型、K8s 原生、训练流水线强。中小团队选 MLflow；K8s 重投入选 Kubeflow。

**5. 参考资料**

- MLflow 官方文档——机器学习生命周期开源标杆。
- Databricks MLflow 集成文档——产品化范式。
- Kubeflow 官方文档——K8s 上的 ML 平台。
- Feast / Tecton 官方文档——特征平台。
- **滴滴 MLflow 与 Spark / Flink 集成支持订单预测实验管理** —— 公开案例描述了订单预测模型从实验到部署的全链路。
- **微众银行用 MLflow 管理信贷风控实验 + 部署** —— 公开材料描述了金融模型的可复现性与审计留痕。
- **京东物流订单预测模型通过 MLflow 跟踪 + Spark 集成** —— 公开技术分享描述了运单预测实验管理的工程实践。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §18.5.3 请设计一个支持在线和离线特征一致性的架构方案，并说明在大数据平台与机器学习平台之间如何保证口径一致。

**1. 考察点**

- 是否真正理解"在线 / 离线一致性"的核心难点。
- 能否给出具体的架构方案（不只是概念）。
- 是否知道具体技术（DSL、特征平台、对账任务）。

**2. 参考答案框架**

**第一层：在线 / 离线一致性的难点。**

- 离线特征用 Spark Batch 计算（昨日全量数据）。
- 在线特征用 Flink Streaming 计算（实时窗口）。
- 两套代码 → 同一特征不同值 → 模型效果差。
- 根因：**逻辑分散、计算引擎不同、时序语义不同**。

**第二层：解决方案——特征平台 + DSL 抽象。**

```
[特征定义 DSL]
  ↓
[编译器]
  ├─ 生成 Spark SQL（离线）
  ├─ 生成 Flink SQL（在线）
  └─ 生成查询 API
```

**核心思想**：**一份 DSL，两份执行**。

```yaml
# 示例：特征 DSL
feature:
  name: user_30d_avg_amount
  type: numeric
  owner: risk-team
  definition: AVG(order_amount) OVER (PARTITION BY user_id ORDER BY event_time RANGE INTERVAL '30' DAY PRECEDING)
  online:
    storage: redis
    ttl: 1h
  offline:
    storage: delta
    partition_by: dt
```

编译器自动生成 Spark SQL（offline batch）和 Flink SQL（online stream），保证逻辑一致。

**第三层：架构示意。**

```
[原始事件] → [Kafka] → [Flink DSL 作业] → [Redis（在线特征）]
              ↓
        [Delta（离线特征，DSL 编译为 Spark）]
              ↓
        [模型训练（读离线）]  [模型推理（读在线）]
```

**第四层：保证口径一致的具体动作。**

1. **DSL 单一事实源**：特征定义用 YAML / Python DSL 描述，编译期生成多份执行计划。
2. **离线 / 在线同源计算**：同一份 SQL 模板，Spark 与 Flink 各自执行。
3. **特征版本对齐**：离线特征 `version=v1.0.0`，在线特征 `version=v1.0.0`，推理时按 version 拉取。
4. **对账任务**：定期对比离线 / 在线特征值（用历史 Kafka 回放）。
5. **影子流量**：新版本特征先在影子流量验证，不影响线上。

**第五层：关键技术选型。**

- **特征平台**：Feast / Tecton / 阿里 PAI FeatureStore。
- **DSL 标准**：Feast feature view / Tecton feature definition / dbt model。
- **离线存储**：Delta Lake / Iceberg。
- **在线存储**：Redis / Cassandra / DynamoDB。

**第六层：工业案例。**

- **Uber Michelangelo**：端到端特征一致性架构。
- **字节跳动**：特征平台统一管理离线/在线。
- **DoorDash**：特征一致性 + 在线推理。
- **Pinterest**：特征平台 + 离线/在线一致性。

**3. 常见陷阱**

- **离线 / 在线各写一套 SQL**。特征定义分散 → 数字对不上。应对：DSL 强制统一。
- **特征版本不对齐**。模型 v2 用了特征 v1，推理时取错特征。应对：模型签名绑定特征 version。
- **不做对账任务**。分布式系统总会漂移，必须有自动检测。

**4. 追问预测**

- **「DSL 怎么选？」** 答：Feast feature view（开源成熟）、Tecton feature definition（商业）、自研 DSL（强业务定制）。
- **「特征版本回滚怎么做？」** 答：模型 + 特征同时回滚；FeatureStore 服务多版本并存，按 version 拉取。

**5. 参考资料**

- Feast / Tecton 官方文档——特征平台架构。
- Uber Michelangelo 公开技术博客——端到端特征一致性。
- DoorDash / Pinterest 公开技术博客——特征平台实战。
- 阿里 PAI 特征平台文档——国内 ML 平台范式。
- **米哈游游戏推荐离线 / 在线特征平台同源定义避免 Skew** —— 公开案例显示其用同一份 SQL 模板生成离线表与实时 Flink 作业。
- **网易雷火 MMO 游戏实时特征通过 DSL 统一双链路** —— 公开材料描述了永劫无间 / 逆水寒推荐系统的特征一致性。
- **Shein 跨境电商通过同一份特征 DSL 编译 Spark SQL 与 Flink SQL** —— 公开技术分享描述了多区域商品特征的一致性保障。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **京东零售** —— 京东零售双 11 实时特征极限压力——KV 热点、Flink 反压、Schema 演进的工程化解法。
- **唯品会** —— 唯品会特卖场景的数据平台——日清模式 + 离线数仓 + 实时推荐三层结构。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **京东零售** —— 京东零售双 11 实时特征极限压力——KV 热点、Flink 反压、Schema 演进的工程化解法。
- **唯品会** —— 唯品会特卖场景的数据平台——日清模式 + 离线数仓 + 实时推荐三层结构。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **京东零售** —— 京东零售双 11 实时特征极限压力——KV 热点、Flink 反压、Schema 演进的工程化解法。
- **唯品会** —— 唯品会特卖场景的数据平台——日清模式 + 离线数仓 + 实时推荐三层结构。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §18.5.4 在万节点规模的集群环境下，如何设计和优化资源调度策略，以同时满足大数据 ETL 与 ML 训练 / 推理的需求？

**1. 考察点**

- 是否理解 ETL 与 ML 训练的负载差异（CPU 密集 vs GPU 密集、长任务 vs 短任务）。
- 能否给出具体的调度策略（队列隔离、优先级、抢占）。
- 是否知道真实生产中的踩坑。

**2. 参考答案框架**

**第一层：ETL 与 ML 训练的负载差异。**

| 维度 | 大数据 ETL | ML 训练 | ML 推理 |
| --- | --- | --- | --- |
| 资源 | CPU 为主 | GPU 为主 | CPU / GPU |
| 任务时长 | 分钟 ~ 小时 | 小时 ~ 周 | 毫秒 ~ 秒 |
| 优先级 | 通常 P1 | P0 ~ P1 | P0 |
| 调度需求 | 大并发 + 错峰 | 独占 + 拓扑感知 | 低延迟 |

**第二层：调度策略。**

1. **队列隔离**：
   - YARN 队列：`etl`, `ml-training`, `ml-serving`。
   - K8s Namespace + ResourceQuota 同理。
2. **优先级**：ML 推理 > ML 训练 > 离线 ETL。抢占策略允许高优先级抢占低优先级。
3. **错峰调度**：ETL 任务调度在大促低峰期；ML 训练优先占用低峰期 GPU。
4. **拓扑感知**：ML 训练需要 GPU + 高速网络（如 NVLink / InfiniBand），调度器按节点拓扑绑定。
5. **弹性调度**：云上用 Spot 实例跑 ML 训练（成本敏感），用预留资源跑推理（稳定）。

**第三层：典型架构。**

```
[YARN / K8s Cluster]
  ├─ Queue: ml-serving (P0, 抢占低优先级)
  ├─ Queue: ml-training (P1, GPU 拓扑感知)
  └─ Queue: etl (P2, 错峰调度)
```

**第四层：关键技术选型。**

- **YARN 调度器**：Capacity Scheduler / Fair Scheduler。
- **K8s 调度器**：Volcano（支持 Gang + Fair + Priority）/ Apache YuniKorn。
- **GPU 调度**：K8s Device Plugin + NVIDIA GPU Operator / Volcano GPU Sharing。
- **拓扑感知**：Volcano / YuniKorn 支持 InfiniBand / NVLink 感知。

**第五层：资源优化的实战经验。**

- **GPU 利用率**：训练任务往往只用到 GPU 的 30-50% → 用 Multi-Instance GPU (MIG) / MPS 共享。
- **抢占策略**：抢占时让被抢占任务 checkpoint / savepoint，避免重算。
- **错峰调度**：阿里 / 字节内部有"GPU 池"，白天跑推理，凌晨跑训练。
- **成本归因**：把 GPU 资源按 ML 团队 / 训练任务归因，识别浪费。

**第六层：工业案例。**

- **Meta（Facebook）**：自研调度器支持 ETL + ML 混部。
- **Uber Michelangelo**：YARN 上跑 ML，内部调度器优化。
- **字节跳动**：内部调度器支持 GPU 池 + 错峰。
- **Databricks**：Lakehouse 平台统一调度 ETL + ML。

**3. 常见陷阱**

- **ML 训练和 ETL 共享资源池**。ML 训练被 ETL 抢占 → 训练 checkpoint 重算，浪费严重。应对：独立队列。
- **GPU 不做 MIG 共享**。单个 ML 任务占满 GPU → 利用率低。应对：MIG / MPS。
- **抢占不做 checkpoint**。被抢占后从头跑 → 资源浪费。应对：抢占时 savepoint。

**4. 追问预测**

- **「如何优化 GPU 利用率？」** 答：MIG / MPS / 共享调度；典型目标 60%+ 利用率。
- **「ETL 和 ML 训练怎么错峰？」** 答：ML 训练优先用低峰期 GPU；ETL 跑白天；资源池动态调整。

**5. 参考资料**

- Apache YARN Capacity Scheduler / Fair Scheduler 官方文档。
- Volcano / YuniKorn 官方文档——K8s 调度增强。
- NVIDIA GPU Operator / Multi-Instance GPU 官方文档。
- Meta / Uber / 字节跳动调度系统公开技术博客——大规模资源调度范式。
- Databricks Lakehouse Platform 调度白皮书。
- **京东万节点 GPU 池 + 错峰调度保障大促训练** —— 公开案例描述了大促前 GPU 资源弹性调度与训练任务优先级设计。
- **Shein 在跨境电商训练场景做 GPU 资源共享** —— 公开技术分享描述了多训练任务共享硬件的工程实践。
- **宁德时代电池研发 GPU 训练 + 大数据 ETL 共享集群** —— 公开材料描述了电池仿真训练与产线数据 ETL 的混部调度。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **京东零售** —— 京东零售双 11 实时特征极限压力——KV 热点、Flink 反压、Schema 演进的工程化解法。
- **唯品会** —— 唯品会特卖场景的数据平台——日清模式 + 离线数仓 + 实时推荐三层结构。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **京东零售** —— 京东零售双 11 实时特征极限压力——KV 热点、Flink 反压、Schema 演进的工程化解法。
- **唯品会** —— 唯品会特卖场景的数据平台——日清模式 + 离线数仓 + 实时推荐三层结构。
- **Shein** —— Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。
- **京东零售** —— 京东零售双 11 实时特征极限压力——KV 热点、Flink 反压、Schema 演进的工程化解法。
- **唯品会** —— 唯品会特卖场景的数据平台——日清模式 + 离线数仓 + 实时推荐三层结构。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §18.5.5 请描述在大数据平台（如 Spark）上实现大规模特征计算和处理的常用技术方案，并说明其工程要点。

**1. 考察点**

- 是否理解大规模特征计算的核心挑战（数据量大、特征多、计算复杂）。
- 能否列出 Spark 上的具体技术（UDF / 窗口 / 内置函数 / MLlib）。
- 是否知道工程要点（性能、稳定性、特征复用）。

**2. 参考答案框架**

**第一层：大规模特征计算的挑战。**

- 数据量：PB 级原始数据 → 特征计算耗资源。
- 特征数量：数千个特征 → 重复 IO 与计算。
- 计算复杂度：时间窗口、聚合、嵌套特征 → 计算链长。
- 稳定性：失败重算 → 长周期任务。

**第二层：常用技术方案。**

1. **Spark SQL + 内置函数**：`SUM / COUNT / AVG / 窗口函数`，最优性能。
2. **Spark MLlib**：`VectorAssembler / StandardScaler / PCA` 等特征工程算子。
3. **Pandas UDF / PySpark**：复杂特征用 Python 写 UDF，但要避免 Python 慢路径。
4. **Spark Structured Streaming**：实时特征用流处理。
5. **特征平台（Feast / Tecton）**：把特征计算模板化，避免重复造轮子。
6. **湖表 + 物化**：Delta / Iceberg 上物化中间结果，减少重复计算。

**第三层：工程要点。**

- **特征复用**：多个模型用同一特征 → 特征平台缓存中间结果。
- **物化策略**：常用特征物化到 DWS 层；不常用特征按需计算。
- **增量计算**：用 Delta / Iceberg 的增量读，只计算变化分区。
- **小文件治理**：参见 §6.6.4。
- **资源调度**：长任务用专用队列，避免被抢占。

**第四层：典型架构。**

```
[原始数据 Delta/Iceberg]
   ↓
[Spark SQL 特征计算（按 dt 增量）]
   ↓
[中间特征表（物化）]
   ↓
[Spark MLlib / 第三方 UDF 进一步加工]
   ↓
[最终特征表（离线）+ Flink 实时特征（在线）]
   ↓
[模型训练 / OneService API]
```

**第五层：性能优化实战。**

- **数据倾斜**：GROUP BY 热点键 → 加盐打散 / 单独处理。
- **Shuffle 优化**：broadcast join / bucket join。
- **AQE**：Adaptive Query Execution 自动合并小 task。
- **向量化执行**：Photon / Velox 提升 CPU 利用率。
- **缓存**：特征计算中间结果缓存到 Alluxio / JindoFS。

**第六层：工业案例。**

- **Uber Michelangelo**：Spark + Iceberg 上的特征计算。
- **字节跳动**：Spark + 湖仓 + 特征平台。
- **Databricks**：Photon + Delta + Feature Store 一体化。
- **阿里 PAI**：MaxCompute + PAI 特征工程。

**3. 常见陷阱**

- **每个团队自己写特征计算**。重复 IO、重复逻辑、口径不一致。应对：特征平台统一。
- **不做物化**。每次训练重新算特征 → 慢。应对：DWS 层物化常用特征。
- **Python UDF 滥用**。Python UDF 是 Spark 慢路径。应对：优先 SQL / Scala UDF。

**4. 追问预测**

- **「特征计算的资源如何预估？」** 答：用历史任务的 Spark UI 数据；按数据量 × 特征数量 × 计算复杂度估算。
- **「Spark vs Flink 在特征计算上怎么选？」** 答：离线 / 大批量用 Spark；实时 / 低延迟用 Flink。同一份 DSL 编译到两边。

**5. 参考资料**

- Apache Spark 官方文档的 Spark SQL / Structured Streaming / MLlib 章节。
- Feast / Tecton 官方文档——特征平台设计。
- Databricks Photon 引擎白皮书——向量化执行优化。
- Uber Michelangelo 公开技术博客——大规模特征计算范式。
- **中国移动湖仓 + Spark 特征计算承载全国用户画像** —— 公开案例描述了全国用户行为特征在湖仓上的批量产出。
- **京东物流订单履约特征通过物化中间结果减少重复 IO** —— 公开材料描述了运单数据特征链路的物化策略。
- **海尔智家 IoT 设备特征在湖仓 + Spark 上大规模计算** —— 公开技术分享描述了家电画像特征的工程实现。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---
