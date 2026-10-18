> 本文件是 **06-one-service.md** § 8 面试真题集 的子主题。完整章节请回到 [index](06-one-service.md) 或 [§ 8 索引](06-one-service-section-8-sec8.md)。

### 8.4 §16.5 数据湖与 Lambda 架构的云原生实践

> 本主题覆盖 K8s + 大数据组件的工程实践。云原生是大数据平台的演进方向，OneService 也越来越多地跑在 K8s 上（API 网关、指标服务、Function Calling 注册中心）。

#### §16.5.1 请探讨在万节点级别的 Kubernetes 集群上运行大规模 Spark 作业时，可能遇到的网络、存储与调度挑战，并给出应对思路。

**1. 考察点**

- 是否了解 K8s 在大数据场景下的特殊性（Pod IP 漂移、CNI 选择、PV 性能）。
- 能否说清 K8s 上跑 Spark 的核心矛盾（短任务 vs 慢启动 vs 资源抢占）。
- 是否知道存储的具体选型（Local PV / CSI driver / S3 兼容对象存储）。
- 加分项：能给出 K8s 调度器改造方案（Gang Scheduling / Volcano）。

**2. 参考答案框架**

**第一层：网络挑战。**

- **Pod IP 漂移**：Spark executor 频繁扩缩容，IP 不稳定会让 shuffle 服务（External Shuffle Service）连接断开。应对：用 StatefulSet + 稳定 hostname，或用 HostNetwork 模式。
- **CNI 选择**：Calico / Cilium 在大集群上 BGP 路由表会膨胀。应对：用 eBPF-based CNI（Cilium）+ Pod CIDR 分片。
- **Service Mesh 副作用**：Istio sidecar 注入会让 Pod 启动慢 5-10s（经验量级，随镜像大小与注入配置而异，本节未附可核验的基准出处，按【经验】档理解），对短任务（分钟级）影响大。应对：用 Gateway API 替代 sidecar，或对短任务豁免注入。

**第二层：存储挑战。**

- **本地 PV（Local Persistent Volume）性能远高于网络 PV**：Spark shuffle 中间结果写本地盘是最佳实践。K8s 上用 Local PV 配合 node affinity。
- **S3 / OSS 兼容对象存储**：Hadoop 3.x 的 S3A connector 已经成熟，但 list 操作慢。应对：用 S3A committer 减少 rename 次数 + 用 prefix 分片。
- **HDFS on K8s**：不建议自建，可用 Ozone / 托管 HDFS 替代。

**第三层：调度挑战。**

- **Pod 启动慢**：K8s 镜像拉取 + 初始化脚本让 executor 启动 30s-2min（经验量级，随镜像大小与调度等待而异，本节未附可核验的基准出处，按【经验】档理解）。应对：用 pause container 预热镜像 + init container 并行。
- **Gang Scheduling**：Spark driver + executor 必须同时满足资源，K8s 默认调度器做不到。应对：Volcano / Kube-batch / Apache YuniKorn。
- **资源抢占**：大任务被拆成数千 Pod，K8s 调度器可能把 Pod 散在低利用率的节点上。应对：调度策略 + bin packing。

**第四层：典型架构。**

```
[Spark Operator] → [K8s API] → [Pod 池]
                          ↓
                  [Volcano / YuniKorn] → [Gang Scheduling]
                          ↓
                  [Local PV Pool + S3 兼容存储]
                          ↓
                  [External Shuffle Service]
                          ↓
                  [Driver → Executors → 输出到 S3 / Delta]
```

- **Spark on K8s Operator**（Google 官方 + 社区版）：声明式提交 Spark 作业。
- **Volcano**：批处理调度优化（Gang、Fair、Priority）。
- **Apache YuniKorn**：K8s 上的批调度增强，已被多家大厂采用。

**第五层：行业案例。**

- **Uber** 大规模 Spark on K8s 实践，内部调度器 BigData-Orchestrator。
- **字节跳动** Volcano 大规模实践。
- **阿里云 EMR on ACK**（ACK = Alibaba Cloud K8s）：托管 Spark on K8s。
- **Databricks** 自研云原生调度（不公开细节，但产品层 Spark on AWS/Azure/GCP 已成熟）。

**3. 常见陷阱**

- **用 NodePort 暴露 Driver Web UI**。大集群上 NodePort 端口冲突频繁，应用 HostPort + 固定端口。
- **Pod 资源 requests == limits**。Spark 是动态资源需求，requests == limits 会导致资源调度僵化。
- **Local PV 不做监控**。Local PV 节点故障时数据丢失，要做副本（PVC 复制）。
- **K8s 默认调度器**。在 Spark 大作业场景下必踩坑，必须上 Volcano / YuniKorn。

**4. 追问预测**

- **「K8s 调度器慢导致 Spark 作业排队？」** 答：① 用 Volcano 减少调度决策时间；② 预创建 Pod 池 + Dynamic Allocation；③ 混合部署（K8s + YARN）。
- **「executor 频繁失败重启？」** 答：检查 OOMKilled（limit 设小）、节点磁盘满（Local PV 满）、网络分区（DNS 异常）。

**5. 参考资料**

- Kubernetes 官方文档的 Scheduling Framework 章节。
- Volcano 官方文档——Gang Scheduling 的工业实现。
- Apache YuniKorn 官方文档——K8s 批调度增强。
- Spark on K8s Operator 官方文档。
- 阿里云 EMR on ACK 技术白皮书——国内 K8s 大数据范式。
- **京东物流 Spark on K8s 替代 YARN** —— 公开技术分享描述了统一调度大数据与在线服务的资源池化收益。
- **中国移动容器化大数据网络万节点以上** —— 用 Volcano + 本地 PV 解决调度问题与存储 IO 抖动。
- **网易雷火基于 Operator 模式管理 Spark / Flink 作业** —— 在游戏运营大数据的弹性伸缩场景落地。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。

> 注：以上条目分两类。一是给出了可检索著录线索者（文档名、书名、章节名、白皮书题名，或论文的题名 / 作者 / 会议 / 年份），可按这些线索自行检索核验，本节未附精确链接；二是未给出可检索题名者——形如「某公司 + 某实践描述」，或只给出人名 / 团队 / 博客名 + 主题，无论其中是否带规模描述（PB 级、万级作业等）或「最成熟」「最完整」一类评价性措辞，仅有描述、无文档名与年份，本节亦未附链接，一律按【经验】档理解。本题正文「参考答案框架」各层中出现的同类公司实践陈述（行业案例 / 工业案例 / 头部案例等层）与第二类同档，引用前请自行查证。

---

#### §16.5.2 请解释数据湖与 Lambda 架构的基本概念，并说明它们各自在大数据处理中的主要作用与适用场景。

**1. 考察点**

- 能否清晰区分"数据湖"和"数据仓库"——核心差异在 schema-on-read vs schema-on-write。
- 是否理解 Lambda 架构的"批流妥协"本质，以及它解决的"准确 vs 新鲜"取舍。
- 能否说清两者的关系（互补还是替代）。

**2. 参考答案框架**

**第一层：数据湖（Data Lake）的基本概念。** 数据湖是**集中存储企业所有原始数据**的存储库——结构化（数据库表）、半结构化（日志、JSON）、非结构化（图片、视频、文档）。核心特征：

- **Schema-on-Read**：写入时不强制 schema，读时才定义——适合"先存后用"的探索式分析。
- **廉价存储**：基于对象存储（S3 / OSS / GCS / HDFS），容量可弹性扩展。
- **多计算引擎**：同一份数据可被 Spark / Flink / Trino / Presto / Athena 多种引擎消费。
- **代表格式**：Delta Lake / Apache Iceberg / Apache Hudi 提供 ACID 与 schema 强制，让湖开始有"仓"的特性。

**第二层：Lambda 架构的基本概念。** Lambda 是 Nathan Marz 2011 年提出的批流混合架构：

- **批处理层**：周期性重算全量，承诺"给定同样的输入永远得到同样的输出"。
- **速度层**：处理最近增量窗口，秒级/分钟级延迟。
- **服务层**：合并批流结果，对外提供统一查询。

Lambda 出现的根因是「**准确性**与**新鲜度**不可同时满足」——批处理准但慢，流处理快但难修正历史。

**第三层：各自的作用与适用场景。**

| 维度 | 数据湖 | Lambda 架构 |
| --- | --- | --- |
| 解决核心问题 | 多源异构数据集中存储 | 实时新鲜 + 历史准确 |
| 适用 | AI/ML、探索分析、合规归档 | 实时 BI、风控、监控 |
| 不适用 | 强一致事务、毫秒级 OLTP | 极低成本离线分析 |
| 关键技术 | Delta / Iceberg / Hudi、对象存储 | Spark / Flink、消息队列 |
| 与 OneService 的关系 | 提供存储底座 | 提供实时 + 准确的合并视图 |

**第四层：两者的关系——从互补到融合。**

- **早期关系**：Lambda 批处理层用 Hive 数仓，速度层用流处理系统 + 独立存储；湖是"另一件事"。
- **当下关系**：湖格式（Delta / Iceberg / Hudi）提供 ACID + 增量读，让批流可以写同一张湖表的不同 dt，Lambda 的双存储统一为单存储。
- **演进**：湖仓一体（Lakehouse）正在吞噬 Lambda——批与流用同一份存储、同一份计算逻辑、同一份查询接口。

**第五层：工业案例。**

- **Netflix**：早期 Lambda（Keystone），现在逐步迁移到 Iceberg 流批一体。
- **Uber**：从 Lambda 到 Hudi 增量处理。
- **阿里**：从 ODPS 离线 + 实时计算双链路，到 Flink + MaxCompute 湖仓一体。
- **Databricks**：Delta + Spark + Photon 的 Lakehouse 范式。

**3. 常见陷阱**

- **把"数据湖"等同于"数据沼泽"**。没有治理的湖就是沼泽——必须配合元数据、血缘、生命周期管理。
- **认为 Lambda 是终点**。Lambda 是 2010 年代的妥协方案，2020 年代是湖仓一体 / Kappa。
- **混淆"湖"和"仓"**。仓是 schema-on-write（写入即清洗），湖是 schema-on-read（读时清洗）；现代湖格式提供 schema 强制，模糊了两者边界。

**4. 追问预测**

- **「湖仓一体真的能消灭 Lambda 吗？」** 答：能消灭**双存储**，但消灭不了"批快 vs 流快"的取舍——修正历史仍需重算，只是代价被增量计算大幅降低。
- **「数据湖的合规风险？」** 答：原始数据集中存储 + PII 散落 → GDPR / CCPA 合规风险大，需要配合数据目录 + 标签 + 脱敏。

**5. 参考资料**

- Nathan Marz《Big Data》——Lambda 原始定义。
- Martin Fowler 关于 Data Lake 的公开论述——湖的早期方法论。
- Delta Lake / Iceberg / Hudi 官方文档——湖格式三家对比。
- Databricks《Lakehouse Platform》白皮书——湖仓一体方法论。
- 阿里云《MaxCompute 湖仓一体白皮书》。
- **京东湖仓一体替代传统 Lambda** —— 公开案例描述了电商核心业务从 Lambda 双链路切换到湖仓一体的路径。
- **宁德时代在工业互联网数据湖上做流批融合** —— 统一设备遥测与产线报表的存储与计算。
- **Shein 在跨境电商数据湖仓上承接全球订单数据** —— 公开材料描述了多区域湖仓与 Lambda 演进到湖仓一体的取舍。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上条目分两类。一是给出了可检索著录线索者（文档名、书名、章节名、白皮书题名，或论文的题名 / 作者 / 会议 / 年份），可按这些线索自行检索核验，本节未附精确链接；二是未给出可检索题名者——形如「某公司 + 某实践描述」，或只给出人名 / 团队 / 博客名 + 主题，无论其中是否带规模描述（PB 级、万级作业等）或「最成熟」「最完整」一类评价性措辞，仅有描述、无文档名与年份，本节亦未附链接，一律按【经验】档理解。本题正文「参考答案框架」各层中出现的同类公司实践陈述（行业案例 / 工业案例 / 头部案例等层）与第二类同档，引用前请自行查证。

---

#### §16.5.3 请描述在 Kubernetes 环境中实现一个支持 Lambda 架构的数据平台时，你会如何设计整体架构与关键组件。

**1. 考察点**

- 是否能把 Lambda 组件（批处理 / 速度 / 服务层）映射到 K8s 资源。
- 能否列出关键组件（Spark Operator、Flink Operator、Kafka Operator、Delta/Iceberg 存储、API Gateway）。
- 是否考虑过运维挑战（Operator 升级、状态恢复、多租户）。

**2. 参考答案框架**

**第一层：整体架构图。**

```
┌─────────────────────────────────────────────────────────┐
│ K8s Namespace: data-platform                            │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ SparkOperator│  │ FlinkK8sOp   │  │ Strimzi Kafka│  │
│  │  (批处理层)   │  │  (速度层)    │  │   (消息层)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         ↓                 ↓                  ↓          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Shared Storage: Delta/Iceberg on S3/OS + Local PV │  │
│  └──────────────────────────────────────────────────┘  │
│         ↓                                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Serving Layer: Cube.js / dbt Semantic / FastAPI   │  │
│  │  (OneService API)                                 │  │
│  └──────────────────────────────────────────────────┘  │
│         ↓                                               │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ APISIX/Kong  │  │ Prometheus + │                    │
│  │  (API 网关)   │  │ Grafana + ELK│                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

**第二层：组件说明。**

- **Spark Operator**（Google 官方 / spark-on-k8s-operator）：声明式 SparkApplication CRD，负责 Spark 作业生命周期。
- **FlinkK8sOperator**（flink-kubernetes-operator）：Flink 官方 Operator，支持 Session / Application 模式、Savepoint 恢复。
- **Strimzi Kafka Operator**：在 K8s 上部署 Kafka 集群（KRaft 模式，去 ZooKeeper）。
- **Delta / Iceberg 存储**：S3 兼容对象存储 + Delta Lake connector 或 Iceberg REST catalog。
- **API Gateway**：APISIX / Kong Ingress，限流、鉴权、监控。
- **OneService 服务层**：FastAPI + Cube.js / dbt Semantic Layer。

**第三层：核心设计要点。**

1. **存储分离**：计算层用 K8s，存储用 S3 / OSS（廉价 + 高可用）。避免本地盘依赖。
2. **Operator 选型**：Spark 用 Operator；Flink 用官方 Operator；Kafka 用 Strimzi。
3. **调度增强**：Volcano / YuniKorn 提供 Gang Scheduling 与资源公平性。
4. **镜像管理**：用 pause container + 镜像缓存（Harbor / Dragonfly）减少启动延迟。
5. **多租户**：按 Namespace 隔离 + ResourceQuota + NetworkPolicy。

**第四层：关键运维能力。**

- **状态恢复**：Flink 用 Savepoint + Checkpoint 自动恢复；Spark 用 EventLog 重跑。
- **滚动升级**：Kafka Operator 支持 rolling upgrade 不停机；Spark Operator 重启作业不影响 metadata。
- **监控告警**：Prometheus + Grafana + AlertManager；用 kube-state-metrics 暴露 K8s 指标。

**第五层：典型落地路径。**

- **POC**：先在测试集群跑 Spark on K8s Operator + Flink Standalone。
- **小规模生产**：核心作业迁移（监控 + 报表），保留传统 YARN。
- **规模化**：所有作业迁到 K8s，引入 Volcano / YuniKorn 调度器。
- **多租户**：Namespace 隔离 + 网络策略 + 配额。

**第六层：工业案例。**

- **字节跳动**：基于 Volcano 的 Spark / Flink on K8s 平台，承载全公司大数据作业。
- **阿里云 EMR on ACK**：托管 Spark on K8s，国内最成熟的商业产品。
- **腾讯云 EMR on TKE**：类似阿里 EMR on ACK。
- **Databricks**：自研云原生调度平台。

**3. 常见陷阱**

- **StatefulSet 用 PodDisruptionBudget=0**。会让节点维护时永远无法滚动升级。
- **Spark executor 用 Deployment**。executor 应该是 Job / Pod，由 Spark Driver 动态创建。
- **Kafka 跑在 K8s 内**。除非有强云原生需求，建议用托管 Kafka（Confluent Cloud / 阿里云 Kafka）。
- **Operator 不备份 CRD**。Operator 故障时 CRD 配置丢失，需要 etcd 备份 + GitOps。

**4. 追问预测**

- **「Kafka 为什么不用 K8s 部署？」** 答：K8s 上 StatefulSet 跑 Kafka 有稳定性挑战（磁盘 IO、GC、网络），大厂多选择托管或独立物理集群。
- **「如何做冷启动优化？」** 答：pause container 预热 + 镜像缓存 + init container 并行 + Spark Dynamic Allocation。

**5. 参考资料**

- Spark on K8s Operator 官方文档。
- Flink Kubernetes Operator 官方文档。
- Strimzi Kafka Operator 官方文档。
- Volcano / Apache YuniKorn 官方文档。
- 阿里云 EMR on ACK 技术白皮书——国内 K8s 大数据商业化范本。
- **Shein 在 K8s 上跑 Flink + Spark 一体化架构** —— 覆盖全球订单链路，Operator 模式管理作业生命周期。
- **网易雷火基于 Operator 模式管理游戏大数据作业** —— 在 K8s 上跑 Flink 实时玩家行为与 Spark 离线画像。
- **京东物流 Spark / Flink on K8s 一体化调度** —— 把作业、API 网关、监控统一在同一 K8s 集群。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上条目分两类。一是给出了可检索著录线索者（文档名、书名、章节名、白皮书题名，或论文的题名 / 作者 / 会议 / 年份），可按这些线索自行检索核验，本节未附精确链接；二是未给出可检索题名者——形如「某公司 + 某实践描述」，或只给出人名 / 团队 / 博客名 + 主题，无论其中是否带规模描述（PB 级、万级作业等）或「最成熟」「最完整」一类评价性措辞，仅有描述、无文档名与年份，本节亦未附链接，一律按【经验】档理解。本题正文「参考答案框架」各层中出现的同类公司实践陈述（行业案例 / 工业案例 / 头部案例等层）与第二类同档，引用前请自行查证。


---

#### §16.5.4 在云原生数据湖架构中，如何利用 Kubernetes 的特性（如 Operator、Helm、CRD 等）实现数据服务的自动化部署与扩缩容？

**1. 考察点**

- 是否理解 K8s "声明式 API + Controller 循环"是云原生的核心抽象。
- 能否把数据服务的运维动作（部署 / 扩缩 / 升级 / 自愈）映射到 K8s 资源。
- 是否知道 HPA / VPA / KEDA 在不同场景下的取舍。

**2. 参考答案框架**

**第一层：四个核心抽象。**

- **CRD（Custom Resource Definition）**：把领域对象（如 SparkApplication、FlinkDeployment、IcebergTable）声明为 K8s API 资源，用户通过 `kubectl apply` 管理。
- **Operator**：基于 CRD 的控制器，watch 资源状态 → 调谐（reconcile）到期望状态。封装了大数据组件的生命周期管理。
- **Helm**：包管理 + 模板化部署，让数据服务的配置（ConfigMap、Secret、RBAC）可版本化分发。
- **GitOps**：以 Git 为单一事实源，ArgoCD / Flux 自动同步集群状态。

**第二层：数据服务的部署形态。**

1. **声明式应用定义**：Spark / Flink 作业用 CRD 描述（应用名、副本数、镜像、入口类），Operator 自动创建 K8s 资源。
2. **Helm Chart 分发**：每个数据服务是一个 Chart，参数化（namespace、replicas、resources），CI/CD 通过 `helm install/upgrade` 管理。
3. **环境隔离**：dev / staging / prod 用不同 values.yaml + ArgoCD Application 模板。

**第三层：自动化扩缩容策略。**

- **HPA（Horizontal Pod Autoscaler）**：基于 CPU / 内存 / 自定义指标的副本数调整。
  - 适用：API 服务、查询服务（Cube / dbt Semantic Layer）。
  - 指标：CPU > 70% 扩容、< 30% 缩容；带 cooldown 避免抖动。
- **VPA（Vertical Pod Autoscaler）**：基于历史用量调整 requests / limits。
  - 适用：稳定负载的 OLAP 查询副本。
- **KEDA（Kubernetes Event-Driven Autoscaling）**：基于外部事件（Kafka lag / Cron / Prometheus 指标）扩缩。
  - 适用：Flink 作业按 Kafka 消费 lag 扩缩、Spark 作业按队列深度触发。
- **Volcano 弹性队列**：批处理作业按队列优先级抢占 + Gang Scheduling。

**第四层：自动化运维动作示例。**

- **滚动升级**：`kubectl rollout restart deployment/oneservice-api`，Operator 保证零停机。
- **配置变更**：ConfigMap + Reloader（Stakater），自动重启 Pod 让新配置生效。
- **自愈**：Liveness Probe 失败 → Pod 重启；Readiness Probe 失败 → 流量摘除。
- **数据恢复**：Flink Savepoint → 自动从 Checkpoint 恢复。

**第五层：典型实现示例。**

```yaml
# CRD 示例：OneServiceMetric API
apiVersion: oneservice.data.io/v1
kind: MetricAPI
metadata:
  name: gmv-metric
spec:
  metric: gmv
  dimension: [date, city]
  filters: [is_new_user, region]
  olap:
    engine: doris
    replicas: 3
    autoscaling:
      minReplicas: 1
      maxReplicas: 10
      targetCPU: 70
  version: v1
```

Operator 自动创建 Deployment + Service + HPA。

**第六层：工业案例。**

- **字节跳动**：内部数据平台所有服务通过 K8s Operator 管理，GitOps 部署。
- **Databricks**：自研云原生平台，Operator + 自定义资源管理 Spark / MLflow / DLT。
- **Snowflake**：Snowpark Container Services 基于 K8s 抽象。
- **阿里云 EMR on ACK**：托管的 Operator 平台。

**3. 常见陷阱**

- **CRD 版本兼容**：v1alpha1 → v1beta1 → v1 的升级需要 conversion webhook，否则老资源读不到。
- **HPA 抖动**：cooldown 时间过短导致副本频繁变化，需设置 stabilization window。
- **VPA 误杀**：VPA 在高峰期扩容不及时，反而影响稳定性。
- **Helm Chart 升级时不回滚**：默认 upgrade 失败不自动回滚，需要 `--atomic` 或 ArgoCD 同步。

**4. 追问预测**

- **「数据服务的发布如何做到灰度？」** 答：Argo Rollouts + Istio traffic split，按 header / cookie 切 5% → 50% → 100%。
- **「如何监控数据服务的健康？」** 答：自定义 Probe（探活 SQL）+ ServiceMonitor（Prometheus 抓指标）。

**5. 参考资料**

- Kubernetes 官方文档的 Operator Pattern。
- Helm 官方文档——包管理标准。
- ArgoCD / Argo Rollouts 官方文档——GitOps 与灰度发布。
- KEDA 官方文档——事件驱动扩缩容。
- Spark / Flink Operator 官方文档。
- **货拉拉基于 K8s Operator + HPA 实现订单服务与数据服务弹性** —— 公开案例描述了订单撮合服务的弹性扩缩容。
- **中芯国际在芯片制造大数据平台上引入 Operator 管理 Spark 作业** —— 公开材料描述了缺陷分析作业的 CRD 化部署。
- **中国移动 OneService 数据服务通过 K8s CRD 暴露指标 API** —— 在湖仓 + Operator 上做指标的弹性 API 网关。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上条目分两类。一是给出了可检索著录线索者（文档名、书名、章节名、白皮书题名，或论文的题名 / 作者 / 会议 / 年份），可按这些线索自行检索核验，本节未附精确链接；二是未给出可检索题名者——形如「某公司 + 某实践描述」，或只给出人名 / 团队 / 博客名 + 主题，无论其中是否带规模描述（PB 级、万级作业等）或「最成熟」「最完整」一类评价性措辞，仅有描述、无文档名与年份，本节亦未附链接，一律按【经验】档理解。本题正文「参考答案框架」各层中出现的同类公司实践陈述（行业案例 / 工业案例 / 头部案例等层）与第二类同档，引用前请自行查证。

---

#### §16.5.5 随着数据湖和流批一体架构的发展，Lambda 架构在某些场景下被认为过于复杂。请分析其复杂性来源与替代方案。

**1. 考察点**

- 是否能具体指出 Lambda 的复杂点（不是泛泛说"维护两套"）。
- 能否列出替代方案（Kappa、Lakehouse、流批一体）并区分适用场景。
- 是否了解头部企业的迁移案例。

**2. 参考答案框架**

**第一层：Lambda 复杂性的具体来源。**

1. **逻辑写两遍**：批处理 + 流处理两份代码、两份测试、两份监控。
2. **口径维护成本**：批流各算一遍 → 数字对不上 → 对账任务 → 修复逻辑 → 再验证。运维成本随业务复杂度上升，且增速快于业务本身（本节未附可核验的度量出处，按【经验】档理解）。
3. **存储双份**：批处理结果一份存储，速度层一份存储，存储成本翻倍。
4. **调度复杂**：批 + 流各自的依赖 + 合并点 = 调度图非常复杂。
5. **新人门槛**：理解批流如何融合需要大量时间，新人上手慢。

**第二层：替代方案对比。**

| 架构 | 核心思想 | 适用 | 代价 |
| --- | --- | --- | --- |
| **Lambda** | 批 + 流双链路 | 强实时 + 强准确 | 维护成本高 |
| **Kappa** | 仅流 + 重放 | 全量可重放 | 消息队列长期保留成本 |
| **Lakehouse** | 湖表 + 增量读 | 流批统一存储 | 湖格式成熟度依赖 |
| **流批一体** | Flink / Spark 同一 API | 业务可改写为流 | 业务改造成本 |

**第三层：Kappa 架构。** Kappa（Jay Kreps, 2014）取消批处理层，全部走流处理：

- **核心**：消息队列（Kafka）长期保留所有历史事件；要"重算历史"就重置消费者 offset 重新消费。
- **代价**：消息队列长期保留成本高（PB 级 Kafka）、流处理状态后端 RTO 拉长。
- **适用**：日志 / 事件流为主、状态可重放的场景（点击流、用户行为）。

**第四层：Lakehouse（湖仓一体）。**

- **核心**：Delta / Iceberg / Hudi 提供 ACID + 增量读，让批流写到同一张湖表的不同分区。
- **关键能力**：
  - 时间旅行（Time Travel）替代全量重算——批处理"逻辑"用增量读重放历史分区实现。
  - Schema 演进 + ACID 保证一致性。
  - 增量物化（Incremental Materialization）只重算变更部分。
- **头部案例**：
  - **Databricks**：Delta Live Tables = 湖仓一体的产品化。
  - **Netflix**：从 Keystone (Lambda) 迁到 Iceberg 流批一体。
  - **Uber**：从 Lambda 到 Hudi 增量处理。
  - **阿里**：从 ODPS + 实时计算到 Flink + MaxCompute 湖仓一体。

**第五层：流批一体（Flink / Spark Structured Streaming）。**

- **核心**：用同一套 API（DataStream / Table API）处理有界与无界流，批是流的特例。
- **适用**：业务可改写为流语义（如聚合、窗口、关联）。
- **代价**：业务改造成本（SQL 改写、状态后端选择）；Flink 对 OLAP 场景不友好。

**第六层：何时保留 Lambda？** 并非所有场景都该抛弃 Lambda：

- 极强一致性需求（金融交易批处理）：保留 Lambda 的批处理层作为最终正确性兜底。
- 极低延迟（毫秒级实时风控）：流处理单独链路，避免与批耦合。
- 极低成本离线分析：批处理为主，不需实时层。

**3. 常见陷阱**

- **"Lambda 已死"**——夸大替代趋势。Lambda 仍在金融、电信等强一致性场景保留。
- **Kappa 替代一切**——忽略 Kafka 长期保留成本与回放能力建设。
- **Lakehouse 万能**——湖格式成熟度仍在演进，复杂事务场景仍有限制。

**4. 追问预测**

- **「如何从 Lambda 迁移到 Lakehouse？」** 答：① 先把批处理结果表迁到 Delta / Iceberg；② 速度层改成写同一张湖表的实时分区；③ 服务层查询模板化合并批流；④ 逐步下线独立存储。
- **「Kappa 的 RTO 怎么控制？」** 答：用 Flink Savepoint + 状态后端 RocksDB + 定期 checkpoint，恢复时间可控在分钟级。

**5. 参考资料**

- Jay Kreps《Questioning the Lambda Architecture》——Kappa 原始论述。
- Michael Armbrust 等人的 Delta Lake 论文（VLDB 2020）——湖仓一体的理论基础。
- Databricks《Lakehouse Platform》白皮书。
- Netflix Tech Blog《Iceberg at Netflix》——头部流媒体迁移案例。
- Uber Engineering 关于 Hudi 的系列文章——增量处理替代 Lambda。
- **唯品会从 Lambda 迁到湖仓一体** —— 公开案例提到批流双链路合并为湖仓一体后，指标口径维护成本显著下降（【经验】档：降幅随口径复杂度、双链路并存时长与治理方式而异，本节无法给出可溯源的统一数字，引用时请自行查证）。
- **京东物流用 Iceberg 流批一体替代 Kafka + Hive 双链路** —— 在运单数据上消除双链路口径漂移。
- **网易雷火游戏数据平台从 Lambda 切到湖仓一体** —— 公开材料描述了玩家行为实时与离线指标的合并查询。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。

> 注：以上条目分两类。一是给出了可检索著录线索者（文档名、书名、章节名、白皮书题名，或论文的题名 / 作者 / 会议 / 年份），可按这些线索自行检索核验，本节未附精确链接；二是未给出可检索题名者——形如「某公司 + 某实践描述」，或只给出人名 / 团队 / 博客名 + 主题，无论其中是否带规模描述（PB 级、万级作业等）或「最成熟」「最完整」一类评价性措辞，仅有描述、无文档名与年份，本节亦未附链接，一律按【经验】档理解。本题正文「参考答案框架」各层中出现的同类公司实践陈述（行业案例 / 工业案例 / 头部案例等层）与第二类同档，引用前请自行查证。

---

#### §16.5.6 在 Kubernetes 上部署大数据组件（例如 Spark 或 Flink）时，与在传统物理机或虚拟机上运行相比，主要有哪些工程差异与挑战？

**1. 考察点**

- 是否理解 K8s 与传统部署的本质差异（容器化 vs 虚拟化、声明式 vs 命令式）。
- 能否列出具体挑战（存储、网络、调度、运维）。
- 是否能给出应对方案。

**2. 参考答案框架**

**第一层：架构差异。**

| 维度 | 物理机 / 虚拟机 | K8s |
| --- | --- | --- |
| 资源模型 | 静态分配 | 动态声明 + 自动回收 |
| 部署方式 | 脚本 + 人工 | 声明式（YAML）+ Controller |
| 调度 | YARN / Mesos | K8s Scheduler + 增强器 |
| 网络 | 静态 IP + 固定端口 | Pod IP 漂移 + Service |
| 存储 | 本地盘 / NFS | PV / CSI / 对象存储 |
| 隔离 | VM 级别 | cgroup + namespace |
| 启动时间 | 分钟级 | 秒级（但首次慢） |

**第二层：工程挑战。**

1. **存储 IO**：HDFS 在物理机上是本地盘，K8s 上要走 PV/CSI → IO 性能下降。**应对**：用 Local PV + 节点亲和性，或直接接对象存储。
2. **网络抖动**：容器网络（CNI）可能引入额外跳数 + 抖动。**应对**：用 Cilium eBPF / Macvlan 减少网络栈层级。
3. **镜像启动慢**：大镜像拉取 + init container 让 Pod 启动 30s~2min（经验量级，随镜像大小与节点缓存命中情况而异，本节未附可核验的基准出处，按【经验】档理解）。**应对**：pause container 预热 + 镜像缓存（Dragonfly / Harbor）。
4. **调度粒度**：K8s 默认调度器按 Pod 调度，Spark Driver + Executors 是"整体"，需要 Gang Scheduling。**应对**：Volcano / YuniKorn。
5. **状态恢复**：物理机上 Spark 重启简单，K8s 上 Pod 重建后本地盘丢失。**应对**：用 S3 兼容存储作为 shuffle / checkpoint 后端。
6. **资源争抢**：K8s 共享集群上多个作业抢资源。**应对**：Namespace + ResourceQuota + LimitRange。

**第三层：典型问题与解法。**

- **Driver UI 端口**：用 NodePort / Ingress 暴露 4040 端口；K8s 默认 30s 超时需要单独配置。
- **Spark Shuffle Service**：用 External Shuffle Service Pod + NodePort 暴露，避免 executor 重建后 shuffle 文件丢失。
- **Flink Checkpoint**：用 S3 / OSS 作为 state backend，避免依赖本地盘。
- **Operator 升级**：CRD v1beta1 → v1 时需要 conversion webhook。

**第四层：优势（K8s 带来的）。**

- **弹性**：Spark Dynamic Allocation 在 K8s 上更容易实现（Pod 数量随负载伸缩）。
- **多云**：同一份 SparkApplication 可以在 AWS / GCP / 阿里云 上跑。
- **统一治理**：监控（Prometheus）、日志（EFK）、网络（CNI）一套工具覆盖所有大数据组件。
- **资源利用率**：K8s 共享池比物理机静态分配利用率提升显著（【经验】档：幅度随作业形态、共享比例与是否错峰调度而异，本节无法给出可溯源的统一数字，引用时请自行查证）。

**第五层：决策建议。**

- **小规模（< 100 节点）**：物理机 / 虚拟机更简单，K8s 复杂度不一定划算。
- **中等规模（100-1000 节点）**：K8s + Operator 是甜蜜点。
- **大规模（1000+ 节点）**：必须上 K8s，否则运维无法承受。
- **混合架构**：K8s 跑 API / 调度 / 监控，传统 YARN 跑存量作业，逐步迁移。

**第六层：工业案例。**

- **字节跳动**：内部几乎所有大数据作业跑在 K8s 上，调度器自研（基于 Volcano 改造）。
- **Uber**：Spark on K8s 自研 BigData-Orchestrator。
- **Netflix**：用 Titus（基于 Mesos）跑大数据组件，2020 年后逐步迁到 K8s。
- **阿里云 EMR on ACK**：托管大数据 K8s 平台。

**3. 常见陷阱**

- **认为 K8s 是银弹**。小规模场景 K8s 复杂度大于收益。
- **强行把 Spark 跑在 K8s 上但不改架构**。需要从作业粒度（Application）、存储（解耦）、调度（Gang）三方面重新设计。
- **忽略存储 IO**。本地盘与对象存储的 IO 性能存在量级差异（【经验】档：倍数随介质、网络与访问模式而异，本节无法给出可溯源的统一数字，引用时请自行查证），Shuffle 重负载场景会卡死。

**4. 追问预测**

- **「为什么 Flink 比 Spark 更容易跑在 K8s 上？」** 答：Flink 本身就是"作业 + JobManager + TaskManager"的 K8s-friendly 架构；Spark 的 Driver + Executor + Shuffle Service 需要更多改造。
- **「K8s 上 Spark shuffle 怎么优化？」** 答：用 External Shuffle Service（ESS）+ 远程 shuffle 服务（Apache Celeborn / Uber RemoteShuffle）。

**5. 参考资料**

- Kubernetes 官方文档的 Storage / Networking 章节。
- Spark on K8s Operator 官方文档。
- Flink Kubernetes Operator 官方文档。
- Apache Celeborn / Remote Shuffle Service 官方文档——K8s 时代的 Shuffle 解法。
- 阿里云 EMR on ACK 技术白皮书。
- **中芯国际在 K8s 上跑芯片缺陷分析 Spark 作业** —— 公开技术分享描述了从物理机迁到 K8s 后节省硬件投入。
- **货拉拉将 Flink 跑在 K8s 上替代 YARN** —— 公开案例显示资源利用率提升显著，任务排队时间缩短。
- **米哈游游戏数据分析平台 Spark on K8s** —— 公开材料描述了 Operator 模式 + 本地 PV 解决 shuffle 性能问题。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。

> 注：以上条目分两类。一是给出了可检索著录线索者（文档名、书名、章节名、白皮书题名，或论文的题名 / 作者 / 会议 / 年份），可按这些线索自行检索核验，本节未附精确链接；二是未给出可检索题名者——形如「某公司 + 某实践描述」，或只给出人名 / 团队 / 博客名 + 主题，无论其中是否带规模描述（PB 级、万级作业等）或「最成熟」「最完整」一类评价性措辞，仅有描述、无文档名与年份，本节亦未附链接，一律按【经验】档理解。本题正文「参考答案框架」各层中出现的同类公司实践陈述（行业案例 / 工业案例 / 头部案例等层）与第二类同档，引用前请自行查证。

---
