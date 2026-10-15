> 本文件是 **12-scheduler.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](12-scheduler.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Airflow + Python DAG**

- 灵活、Pythonic、生态最广。
- 适用：复杂任务编排。

**模式 2：DolphinScheduler + UI DAG**

- 易用、国产、社区强。
- 适用：传统企业、国内团队。

**模式 3：DataWorks 一站式（阿里云）**

- 云端、集成开发、监控。
- 适用：阿里云用户。

**模式 4：Argo Workflows + K8s**

- 云原生、容器化、声明式。
- 适用：K8s 平台。

**模式 5：Prefect + Python DAG**

- 现代化、易用、SaaS 选项。
- 适用：现代化团队。

**模式 6：KubeFlow + ML Pipeline**

- ML 任务编排。
- 适用：AI / ML 团队。

**模式 7：Dagster + 资产编排**

- 数据资产视角。
- 适用：现代数据栈。

### 3.2 适用场景决策表

| 业务场景 | 推荐调度器 | 典型技术栈 |
| --- | --- | --- |
| 复杂 DAG + Python | Airflow | Airflow + K8s Executor |
| 国产 + 易用 | DolphinScheduler | DolphinScheduler |
| 阿里云 | DataWorks | DataWorks + MaxCompute |
| K8s 原生 | Argo Workflows | Argo + K8s |
| ML 任务 | KubeFlow / Argo | KubeFlow + K8s |
| 现代数据栈 | Prefect / Dagster | Prefect + Snowflake |
| 数据资产导向 | Dagster | Dagster + Snowflake |

### 3.3 反模式与陷阱

**反模式 1：硬编码依赖**

- 任务间硬编码依赖，灵活性差。
- **正确**：DAG 显式依赖 + Sensor 事件触发。

**反模式 2：缺乏重试机制**

- 任务失败无人值守。
- **正确**：retries + retry_delay + 告警。

**反模式 3：未做 SLA 监控**

- 任务超时无人知。
- **正确**：SLA Miss 告警。

**反模式 4：单点故障**

- Scheduler / Worker 单点。
- **正确**：高可用部署 + 多副本。

**反模式 5：DAG 过深**

- 100+ 任务串联，运行慢。
- **正确**：并行执行 + 分层编排。

**反模式 6：未做资源隔离**

- 多个业务混跑，相互影响。
- **正确**：YARN 队列 / K8s Namespace。

---
