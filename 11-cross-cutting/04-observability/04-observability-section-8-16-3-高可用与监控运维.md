> 本文件是 **04-observability.md** § 8 面试真题集的子主题。完整章节请回到 [index](04-observability.md) 或 [§ 8 索引](04-observability-section-8-sec8.md)。

### 8.8 §16.3 高可用与监控运维

> 本主题考察 Kubernetes 上大数据组件的高可用（HA）与监控运维能力，包括组件部署、有状态服务、监控告警体系、Operator 模式、节点宕机处理。面试官真正想听的是「云原生时代大数据组件的运维重构」。

#### §16.3.1 请简要说明在 Kubernetes 上部署大数据组件（例如 Spark 或 HDFS）时，为了实现高可用应该关注哪些关键设计点。

**1. 考察点**

- 是否理解 K8s 与 YARN / YARN 与传统部署的本质差异。
- 能否说出 StatefulSet / Deployment / ConfigMap / Secret 在大数据组件中的用法。
- 是否知道 StorageClass / PVC / PV 在数据持久化中的角色。
- 加分项：能给出 K8s 上大数据组件的真实落地经验。

**2. 参考答案框架**

**第一层：K8s 部署大数据组件的三大挑战。**
- **有状态**：HDFS NameNode、HBase RegionServer、Kafka Broker 都需要持久化存储 + 稳定网络标识；
- **资源弹性**：Spark 作业需要动态扩缩 executor，K8s Pod 调度与 YARN Container 调度差异巨大；
- **运维复杂度**：K8s Operator 比 YARN NM 多一层抽象，故障排查链路更长。

**第二层：关键设计点 1 —— StatefulSet（用于有状态组件）。**
- **稳定网络标识**：`pod-0`、`pod-1`...，每个 Pod 有固定 hostname；
- **持久化存储**：每个 Pod 绑定独立 PVC，数据保留；
- **有序部署 / 扩缩**：先 `pod-0` 启动后再 `pod-1`，避免脑裂；
- **适用**：Kafka Broker、HDFS NameNode、ZooKeeper、HBase Master。

**第三层：关键设计点 2 —— Deployment（用于无状态组件）。**
- **Spark Driver / Executor**：无状态，扩缩容自由；
- **Spark History Server**：无状态，可多副本；
- **Flink JobManager**：可选有状态（zookeeper 持久化）或无状态（基于 Kubernetes HA）。

**第四层：关键设计点 3 —— 存储抽象。**
- **PV（Persistent Volume）**：底层存储（云盘、本地盘）；
- **PVC（Persistent Volume Claim）**：Pod 申请存储；
- **StorageClass**：动态供给（云盘自动创建）；
- **数据持久化策略**：
  - HDFS NameNode EditLog：必须用云盘（高 IOPS）；
  - Kafka 日志：顺序写，云盘可；
  - Spark Shuffle：本地盘或网络存储（避免数据丢失）。

**第五层：关键设计点 4 —— 网络与服务发现。**
- **Service（ClusterIP / Headless）**：内部访问；
- **Ingress**：外部访问（History Server / Spark UI）；
- **Headless Service**：StatefulSet 的稳定 DNS（`pod-0.kafka.namespace.svc.cluster.local`）。

**第六层：关键设计点 5 —— 配置与密钥管理。**
- **ConfigMap**：配置（hdfs-site.xml、core-site.xml）；
- **Secret**：敏感数据（Hadoop token、Kafka SASL）；
- **环境变量**：传递少量配置；
- **外部化**：复杂配置用 Helm Chart / Kustomize。

**第七层：关键设计点 6 —— 资源配额与调度。**
- **ResourceQuota**：Namespace 级别资源上限；
- **LimitRange**：Pod / Container 默认与最大资源；
- **PriorityClass**：高优作业优先调度；
- **NodeSelector / Affinity**：Pod 调度到特定节点（如 SSD 节点）；
- **Taints / Tolerations**：节点隔离（如 GPU 节点专用于 ML）。

**3. 常见陷阱**

- **有状态组件用 Deployment。** Pod 重建后数据丢失；必须 StatefulSet + PVC。
- **不绑 PVC 存储敏感数据。** Pod 重建数据丢失。
- **资源不设 limit。** Pod OOM 时不会被 K8s kill，会影响整节点。
- **不配 liveness / readiness probe。** K8s 不知道组件是否健康。
- **Spark 作业用 HostPath 存 shuffle 数据。** 节点宕机后数据丢失，作业失败。

**4. 追问预测**

- **「K8s 上 HDFS NameNode HA 怎么做？」** 答：StatefulSet 部署 2 个 NN Pod + ZKFC + JournalNode（StatefulSet 部署）；ZK 选主 + Active 切换。
- **「Spark on K8s 的资源调度与 YARN 区别？」** 答：K8s 用 Pod 调度，资源由 K8s 决定；YARN 用 Container 调度，资源由 YARN 决定。K8s 更通用但缺乏大数据特有的能力（如队列隔离）。
- **「StorageClass 选什么？」** 答：HDFS NN EditLog 用高 IOPS SSD；Kafka 日志用普通 SSD；Spark Shuffle 用本地 NVMe（性能优先）。

**5. 参考资料**

- Kubernetes 官方文档中 `StatefulSet` / `Storage` / `Resource Management` 章节——K8s 核心概念。
- Apache Spark on Kubernetes 官方文档——Spark K8s 集成与最佳实践。
- Apache Kafka on Kubernetes 官方文档与 Strimzi Operator——Kafka K8s 部署标准。
- 阿里 / 字节关于大数据组件 K8s 化的公开分享——国内头部企业实践。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §16.3.2 请描述在 Kubernetes 环境中，如何为有状态的大数据服务（例如 Kafka 或 ZooKeeper）实现高可用的存储与调度。

**1. 考察点**

- 是否理解有状态服务的 K8s 模式（StatefulSet + PVC）。
- 能否给出 ZooKeeper / Kafka 的具体 HA 配置。
- 是否知道节点故障下的 Pod 重建与数据恢复。
- 加分项：能给出 K8s Operator 简化运维的方案。

**2. 参考答案框架**

**第一层：有状态服务的两大特征。**
- **数据持久化**：Pod 重建后数据必须保留；
- **稳定网络标识**：Pod 间通信需要稳定地址（不能 `pod-0` 重建后变 `pod-5`）。

**第二层：StatefulSet + PVC 模式。**

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  serviceName: kafka
  replicas: 3
  selector:
    matchLabels:
      app: kafka
  template:
    metadata:
      labels:
        app: kafka
    spec:
      containers:
        - name: kafka
          image: confluentinc/cp-kafka:7.5.0
          volumeMounts:
            - name: data
              mountPath: /var/lib/kafka/data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: [ReadWriteOnce]
        storageClassName: ssd
        resources:
          requests:
            storage: 1Ti
```

**第三层：Kafka HA 配置要点。**
- **副本数 ≥ 3**：`replication.factor=3`；
- **min.insync.replicas ≥ 2**：保证至少 2 副本写入；
- **acks=all**：所有副本确认；
- **unclean.leader.election.enable=false**：避免脑裂时数据丢失；
- **K8s 上**：每个 broker Pod 绑独立 PVC；Pod 0/1/2 跨节点（AntiAffinity）。

**第四层：ZooKeeper HA 配置要点。**
- **副本数 ≥ 3**（奇数）：3 节点容忍 1 节点失败；5 节点容忍 2 节点失败；
- **过半存活**：ZAB 协议保证一致性；
- **K8s 上**：StatefulSet + Headless Service（`zookeeper-0.zookeeper.namespace.svc.cluster.local`）；
- **网络隔离**：ZK 节点跨 AZ / 跨 rack。

**第五层：调度策略。**
- **AntiAffinity**：避免同节点多个副本（单节点故障不毁集群）；
- **Topology Spread**：副本均匀分布到多 zone；
- **PriorityClass**：核心组件优先调度；
- **Node Taints**：关键节点专用于核心组件。

**第六层：Operator 模式简化运维。**
- **Strimzi**（Kafka Operator）：自动扩容、副本管理、版本升级；
- **Pravega Operator**：流存储 Operator；
- **HDFS Operator**：Hadoop 3.x 起官方支持；
- **Spark Operator**（spark-on-k8s-operator / kubeflow）：简化 Spark 作业提交。

**3. 常见陷阱**

- **副本数 1。** 单副本 = 单点故障，HA 名存实亡。
- **同节点多副本。** 单节点故障全挂。
- **不配 AntiAffinity。** 默认调度器可能把副本挤到一个节点。
- **PVC 不用高性能 StorageClass。** 网络盘 IO 性能差，K8s 上大数据组件性能瓶颈。
- **不配 PodDisruptionBudget。** 滚动升级时全副本下线，服务不可用。

**4. 追问预测**

- **「K8s 上 Kafka 的 KRaft 模式怎么部署？」** 答：1 个 Controller Pod + 3 个 Broker Pod；Controller 也用 StatefulSet；KRaft 元数据走 PVC。
- **「PVC 数据如何备份？」** 答：云盘快照（EBS Snapshot / 云盘 snapshot）；备份到对象存储。
- **「K8s 上 ZooKeeper 性能调优？」** 答：JVM 堆调大；FDLimit；fsync 频率；磁盘 IOPS。

**5. 参考资料**

- Kubernetes 官方文档中 `StatefulSet` / `PodDisruptionBudget` 章节——有状态服务标准模式。
- Strimzi Kafka Operator 官方文档——Kafka K8s 部署标准。
- Apache ZooKeeper 官方文档中 `Ensemble Configuration` 章节——ZK 集群配置。
- 阿里 / 字节关于 Kafka / ZooKeeper K8s 化的公开分享——国内大规模生产经验。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §16.3.3 请阐述在 Kubernetes 上运行的大数据平台中，如何设计一套完整的监控告警体系。

**1. 考察点**

- 是否理解 K8s 上监控的多个层面（基础设施 / Pod / 应用）。
- 能否说出 Prometheus + Grafana + Alertmanager 的标准组合。
- 是否知道自定义 exporter 与 ServiceMonitor 的用法。
- 加分项：能给出大数据组件专属 exporter 的清单。

**2. 参考答案框架**

**第一层：监控的三个层面。**
- **基础设施层**：节点 CPU、内存、磁盘、网络；
- **容器层**：Pod / Container / Namespace 资源使用；
- **应用层**：JVM / RPC / shuffle / commit lag 等业务指标。

**第二层：架构（Prometheus + Grafana + Alertmanager 标准组合）。**

```
[Exporter] → [Prometheus] → [Grafana 可视化]
                ↓
            [Alertmanager] → [PagerDuty / 钉钉]
                ↓
            [Thanos / Cortex]（长期存储）
```

**第三层：基础设施层采集。**
- **node-exporter**：DaemonSet 部署到每个节点，采集 OS 指标；
- **kube-state-metrics**：采集 K8s 对象状态（Pod / Node / Deployment）；
- **cAdvisor**：内置在 kubelet，采集容器资源使用。

**第四层：应用层采集（大数据组件专属 exporter）。**
- **HDFS**：JMX exporter + `dfs.namenode` / `dfs.datanode` 指标；
- **YARN**：JMX exporter + `yarn.resourcemanager` / `yarn.nodemanager` 指标；
- **Spark**：Spark Metrics System + Prometheus Sink（`spark.metrics.conf`）；
- **Flink**：Flink Metrics Reporter + Prometheus；
- **Kafka**：JMX exporter 或 `kafka_exporter`（LinkedIn 出品）；
- **HBase**：JMX exporter + RegionServer metrics。

**第五层：ServiceMonitor 自动发现。**
- **ServiceMonitor CRD**（Prometheus Operator）：声明式配置 scrape target；
- **PodMonitor CRD**：直接配 Pod（无需 Service）；
- **PrometheusRule CRD**：声明式告警规则；
- **优势**：GitOps 友好；Operator 自动 reload。

**第六层：告警分级与路由。**
- **Alertmanager 路由**：按 service / severity 路由到不同 channel；
- **P0 / P1 / P2 分级**：电话 / IM / 邮件；
- **告警抑制**：上游故障抑制下游；
- **告警聚合**：按集群 / 时间窗口聚合。

**第七层：可视化与仪表板。**
- **Grafana Dashboard**：
  - 集群总览：节点健康、Pod 分布、资源使用；
  - 组件详情：HDFS / YARN / Kafka / Spark 各自仪表板；
  - 业务 SLO：作业成功率、延迟、QPS。
- **Grafana Alerting**：可视化配置告警规则。

**第八层：长期存储。**
- **Thanos / Cortex**：Prometheus 联邦存储，跨集群查询；
- **远程写入**：Prometheus WAL → 对象存储；
- **降采样**：长期历史数据降采样。

**3. 常见陷阱**

- **只监控容器层不看应用层。** Pod 健康 ≠ 应用健康。
- **Exporter 部署在 Pod 内而非 DaemonSet。** Pod 重建时指标丢失。
- **告警全发 PagerDuty。** oncall 疲惫。
- **不做告警抑制。** 一个故障雪崩告警。
- **Grafana 仪表板不维护。** 指标改版仪表板失效。

**4. 追问预测**

- **「Spark on K8s 如何采集 driver / executor 指标？」** 答：用 `spark.metrics.conf` + Prometheus Sink；driver / executor 端口独立。
- **「Flink on K8s 怎么采集 task manager 指标？」** 答：Flink Metrics Reporter 配 Prometheus Reporter；JobManager / TaskManager 端口独立。
- **「Prometheus Operator vs 自建？」** 答：Operator 简化运维；自建灵活但运维成本高。生产推荐 Operator。

**5. 参考资料**

- Kubernetes 官方文档中 `Monitoring` 章节——监控架构概述。
- Prometheus Operator 官方文档——ServiceMonitor / PodMonitor / PrometheusRule 标准。
- Apache Spark / Flink / Kafka 官方文档中 `Metrics` 章节——各组件指标系统。
- Grafana Labs 官方文档中 Mimir / Loki / Tempo——云原生可观测性栈。
- 阿里 / 字节关于 K8s 监控的公开分享——国内大规模生产经验。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §16.3.4 在大数据组件与 Kubernetes 的深度集成中，如何利用 Operator 模式来封装和管理复杂的运维操作？

**1. 考察点**

- 是否理解 Operator 模式的核心思想（CRD + Controller + 调和循环）。
- 能否说出 Operator 与 Helm Chart 的区别。
- 是否知道实际存在的 K8s 大数据 Operator（Strimzi / Spark / HDFS）。
- 加分项：能给出自研 Operator 的实战场景。

**2. 参考答案框架**

**第一层：Operator 模式的核心思想。** Operator = **CRD（Custom Resource Definition）+ Controller + 调和循环（Reconcile Loop）**。
- **CRD**：用户声明期望状态（如 `KafkaCluster{ replicas: 3 }`）；
- **Controller**：观察 CRD 状态，与实际状态对比，调和到期望状态；
- **Reconcile Loop**：周期或事件触发；自动化运维操作。

**第二层：Operator vs Helm Chart。**

| 维度 | Helm Chart | Operator |
| --- | --- | --- |
| **本质** | 模板化部署 | 自动化运维 |
| **状态管理** | 无 | 有（观察实际状态） |
| **自动恢复** | 无 | 有（reconcile loop） |
| **升级** | 手动 | 自动（含数据迁移） |
| **复杂度** | 低 | 高 |

**第三层：Operator 的标准模式（以 Kafka 为例）。**

```yaml
# 用户声明期望状态
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: my-cluster
spec:
  kafka:
    replicas: 3
    config:
      offsets.topic.replication.factor: 3
      transaction.state.log.replication.factor: 3
    storage:
      type: persistent-claim
      size: 1Ti
  zookeeper:
    replicas: 3
    storage:
      type: persistent-claim
      size: 100Gi
```

- Strimzi Operator 自动创建 Kafka StatefulSet、Service、ConfigMap；
- 监控 CRD 状态，若 `replicas` 改变，自动扩缩；
- 自动执行滚动升级、Broker 替换、数据再平衡。

**第四层：典型大数据 Operator。**
- **Strimzi Kafka Operator**：Kafka 部署、扩容、升级、副本再平衡；
- **Spark Operator**（Google Cloud 维护 / spark-on-k8s-operator）：Spark 作业提交、生命周期管理；
- **Flink Kubernetes Operator**（阿里云维护）：Flink 作业 Savepoint、升级；
- **HDFS Operator**（Hadoop 3.x）：HDFS 集群部署、升级、节点 Decommission；
- **Pravega Operator**：流存储部署。

**第五层：自研 Operator 的场景。** 当开源 Operator 不满足需求时自研：
- **多集群调度**：跨 K8s 集群的组件编排；
- **复杂数据迁移**：HDFS → Iceberg 的自动化迁移；
- **AIOps 集成**：异常自动修复、回刷；
- **成本优化**：Spot instance 自动迁移；
- **业务特定**：电商大促的弹性扩缩。

**第六层：Operator 开发的关键概念。**
- **CRD 定义**：用 OpenAPI 描述资源 schema；
- **Controller**：用 Kubebuilder / Operator SDK 开发；
- **Informer / Watch**：监听 K8s 资源变化；
- **Finalizer**：优雅删除（清理外部资源）；
- **Status 字段**：暴露实际状态；
- **乐观并发控制**：ResourceVersion 处理并发。

**3. 常见陷阱**

- **把 Operator 当 Helm 用。** Operator 价值在于 reconcile loop，不是单纯部署。
- **CRD 设计不合理。** CRD schema 频繁变更导致升级困难；设计前充分调研。
- **reconcile loop 死循环。** 不更新 Status 或 update 时不变化导致死循环。
- **Finalizer 不写。** 资源删除时外部资源泄漏（PVC、对象存储数据）。
- **Operator 自身无高可用。** Operator 挂了整套自动化失效；必须多副本 + leader election。

**4. 追问预测**

- **「Operator 与 Terraform 的区别？」** 答：Terraform 是基础设施即代码；Operator 是 K8s 内的应用管理；Operator 适合 K8s 资源管理，Terraform 适合云资源。
- **「自研 Operator 工作量？」** 答：单个 Operator 开发 + 测试 + 运维 ~3-6 人月；Kubebuilder / Operator SDK 简化开发。
- **「Operator 升级如何管理？」** 答：CRD version（v1alpha1 → v1beta1 → v1）渐进式升级；webhook 做 conversion。

**5. 参考资料**

- Kubernetes 官方文档中 `Operator Pattern` 章节——Operator 模式权威出处。
- Kubebuilder / Operator SDK 官方文档——Operator 开发框架。
- Strimzi / Spark Operator / Flink Operator 官方文档——大数据组件 Operator 实践。
- Google SRE Book 关于自动化运维的章节——Operator 模式的 SRE 视角。
- 阿里 / 字节关于自研 Operator 的公开分享——国内大规模生产经验。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §16.3.5 当 Kubernetes 集群中的一个 Node 节点意外宕机，导致运行在其上的大数据计算任务中断时，K8s 和大数据组件会如何协作完成恢复？

**1. 考察点**

- 是否理解 K8s 节点宕机的检测与 Pod 重建机制。
- 能否说出大数据组件在 Pod 重建后的恢复路径（HDFS 副本 / Kafka ISR / Spark 重试）。
- 是否知道 PV 数据的保留与挂载。
- 加分项：能给出故障时间窗口的预估。

**2. 参考答案框架**

**第一层：K8s 节点宕机的检测。** 节点宕机后，K8s 的处理：
- **心跳超时**：Kubelet 每 10s 向 API Server 发心跳；`node-monitor-grace-period`（默认 40s）超时后，节点状态 `NotReady`。
- **Pod 驱逐**：Pod 从 `NotReady` 节点驱逐到其他节点；`eviction-hard` 阈值触发。
- **Controller 检测**：Deployment / StatefulSet Controller 检测 Pod 数量不足，启动新 Pod。
- **Pod 重建时间**：40s 检测 + 调度延迟 + 启动时间 ≈ 1-3min。

**第二层：大数据组件的协作。**

**Spark on K8s**：
- **Executor Pod 驱逐**：Spark Driver 检测 Executor 失联（心跳超时）；
- **Task 重试**：`spark.task.maxFailures`（默认 4）控制 Task 重试；
- **Stage 重试**：`spark.stage.maxConsecutiveAttempts`；
- **恢复机制**：若 Driver Pod 也驱逐，从 checkpoint 恢复（DStream API） 或 WAL + offset（Structured Streaming）；
- **Shuffle 数据丢失**：若 shuffle 数据在本地 PV（HostPath），重建后丢失；若在网络 PV（如 AWS EBS）有保留。

**Flink on K8s**：
- **TaskManager 失联**：JobManager 通过心跳检测；
- **重启策略**：`restart-strategy`（fixed-delay / failure-rate / exponential）；
- **State 恢复**：RocksDB state backend + checkpoint（PVC 持久化），TaskManager 重建后从最近 checkpoint 恢复；
- **Savepoint**：手动触发后写入对象存储 / PVC。

**Kafka on K8s**：
- **Broker Pod 驱逐**：Kafka Controller 检测 broker 失联；
- **ISR 收缩**：健康副本自动加入 ISR；
- **Producer 重试**：生产者重试到其他 broker；
- **Consumer 重新分配**：分区重新分配到活着的 broker；
- **Leader 选举**：Controller 自动选出新 Leader（KRaft 模式）；
- **数据保留**：Topic 数据在 PVC，broker 重建后挂回。

**HDFS on K8s**：
- **DataNode Pod 驱逐**：NameNode 检测 DN 失联（心跳超时）；
- **副本缺失**：欠费副本触发再平衡，新 DN Pod 加入后复制；
- **HDFS 数据保留**：在 PVC；新 DN Pod 启动后挂回相同 PVC；
- **NameNode Pod**：StatefulSet，PVC 保留；Pod 重建后恢复。

**第三层：PV 数据保留策略。**

| PV 类型 | 重建后保留 | 性能 | 适用 |
| --- | --- | --- | --- |
| **HostPath** | 不保留（节点宕机数据丢） | 高 | 临时数据（shuffle） |
| **云盘（EBS / 云盘）** | 保留（挂回新 Pod） | 中 | 大数据组件存储 |
| **NFS / CephFS** | 保留（共享存储） | 中 | 跨节点共享 |
| **Local PV** | 保留（绑定到节点） | 高 | 性能敏感 |

**第四层：恢复时间窗口。**

| 组件 | 故障检测 | 恢复时间 | 总中断 |
| --- | --- | --- | --- |
| **Spark Executor** | 40s 心跳 + retry | Task 重试 < 1min | 1-3min |
| **Flink TaskManager** | 10s 心跳 | 重启 + state 恢复 < 30s | 1-2min |
| **Kafka Broker** | 心跳 + session timeout | Leader 切换 < 30s | < 1min |
| **HDFS DN** | 10min 心跳（默认） | DN 重启 + 副本再平衡 | 10-30min |

**第五层：优化方向。**
- **缩短心跳**：`node-monitor-grace-period` 调到 10s；
- **PodDisruptionBudget**：保证滚动升级时副本数；
- **PreStop Hook**：优雅退出（Kafka flush、Spark drain）；
- **AntiAffinity**：副本跨节点；
- **StatefulSet**：稳定标识 + PVC 持久化；
- **本地 PV**：性能敏感组件用 local PV（绑定到节点）。

**3. 常见陷阱**

- **shuffle 数据用 HostPath。** 节点宕机数据丢失，作业失败。
- **Kafka 用 HostPath 存日志。** broker 重建后数据丢失。
- **不配 PodDisruptionBudget。** 滚动升级全副本下线，服务中断。
- **HDFS DN 心跳超时太长（默认 10min）。** 期间 HDFS 仍把请求发到宕机节点，作业失败。
- **不测节点宕机。** 故障预案不演练等于不存在。

**4. 追问预测**

- **「K8s 节点宕机 vs YARN NM 宕机的差异？」** 答：K8s 是 Pod 级隔离（重启 Pod），YARN 是 Container 级（NM 进程级）；K8s 多了 PVC 处理。
- **「Spark on K8s 怎么避免 shuffle 丢失？」** 答：用 External Shuffle Service（独立 DaemonSet），节点宕机不影响 shuffle；或用 Remote Shuffle Service（如 Celeborn）。
- **「Flink on K8s state 后端选什么？」** 答：RocksDB state backend + 增量 checkpoint 存 PVC 或对象存储（S3 / OSS）。

**5. 参考资料**

- Kubernetes 官方文档中 `Node Shutdown` 与 `PodDisruptionBudget` 章节——节点故障处理。
- Apache Spark on Kubernetes 官方文档——Spark K8s 故障恢复。
- Apache Flink Kubernetes Operator 官方文档——Flink K8s 部署与恢复。
- Strimzi Kafka Operator 官方文档——Kafka K8s 故障恢复。
- 阿里 / 字节关于 K8s 大数据故障恢复的公开分享——国内大规模生产经验。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接请按条目名称自行检索核验。

---
