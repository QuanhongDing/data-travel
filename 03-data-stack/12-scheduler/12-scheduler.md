# 调度系统（Scheduler）

> **一句话定位**：以 Airflow / DolphinScheduler / DataWorks / Argo 为核心的 DAG 编排与依赖管理系统，是数据全链路的"指挥官"。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**12 调度系统**）。覆盖 **R4 数据全栈协同** 能力领域中「DAG 编排、依赖管理、调度策略、AI 时代演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 调度系统在数据栈中的核心价值？ | §1.1 |
| Airflow / DolphinScheduler / DataWorks 怎么选？ | §7.1 |
| DAG 编排与依赖管理如何落地？ | §4.1 |
| 云原生调度（Argo / K8s Job）如何演进？ | §5 |
| 2024-2025 新趋势？ | §5.1 表、§5.4 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：调度系统（Scheduler / Workflow Orchestrator）是一种**对数据处理任务进行 DAG 编排、依赖管理、定时触发、监控告警**的系统。它是企业数据全链路的"指挥官"。

**工程定义**：在数据架构师手里，调度系统是**一份以 DAG 为核心、对 PB 级数据处理任务进行编排 + 依赖 + 调度 + 监控**的协同能力。核心特征：

- **DAG 编排**：有向无环图表达任务依赖。
- **依赖管理**：上游任务成功后下游才能跑。
- **定时触发**：Cron 表达式、定时间隔、事件触发。
- **资源调度**：与 YARN / K8s 集成，分配资源。
- **失败重试**：自动重试 + 告警。
- **可视化监控**：DAG 视图、任务状态、历史回溯。

### 1.2 为什么需要

**业务驱动力**：

- **数据全链路协同**：从采集 → 加工 → 产出，涉及 100+ 任务。
- **依赖管理**：上游不跑下游不跑，避免数据不一致。
- **定时产出**：T+1 数据需要每天定时跑批。
- **失败恢复**：任务失败自动重试 + 告警。
- **可视化运维**：运维人员需要清晰看到 DAG 全貌。

**痛点（没有调度系统的代价）**：

1. **手动跑批**：DBA / 数据工程师每天手动启动脚本。
2. **依赖混乱**：上游没跑下游先跑，数据错误。
3. **失败无人知**：任务失败后业务数据错误才发现。
4. **运维成本高**：100+ 任务人工管理不可能。
5. **数据延迟**：T+1 产出无法保证。

**AI 时代的新诉求**：

- **AI 任务调度**：模型训练、定时推理。
- **Agent 工作流**：智能体执行的任务编排。
- **联邦调度**：跨云、跨集群任务编排。

### 1.3 在 AI 时代数据架构中的位置

```
[数据采集 → 数据加工 → 数据消费]
        ↑
[调度系统：Airflow / DolphinScheduler / DataWorks / Argo]
        ↓
[监控告警 + DAG 可视化]
```

**调度系统是数据全链路的"指挥官"**：让所有任务协同工作。

### 1.4 演进历程

**第一阶段：Crontab + Shell 脚本（2000-2010）**

- Linux Crontab + 脚本。
- 简单、无依赖管理。

**第二阶段：传统调度系统（2010-2015）**

- Oozie（Hadoop 生态）、Azkaban、Luigi。
- DAG 编排 + 依赖管理。

**第三阶段：现代调度系统（2015-2020）**

- 2015：Airflow 1.x（Pythonic DAG）。
- 2017：DolphinScheduler（国产、易用）。
- 2018：阿里云 DataWorks（一站式）。
- 2019：Prefect、Argo Workflows。

**第四阶段：云原生 + AI 原生（2020-至今）**

- 2020：Argo Workflows、KubeFlow。
- 2022：Apache Airflow 2.x（TaskFlow API）。
- 2023：DataWorks 智能升级、Airflow 2.6+。
- 2024：DolphinScheduler 3.x、Airflow 2.9+。

**第五阶段：AI 增强调度（2024-至今）**

- 2024：AI 驱动的智能调度（异常检测、自动修复）——其中异常检测按 §5.1 属 **L2（可做 PoC）**，LLM 自动修复属 **L3**（等信号，不排进排期）。
- 2025：自治调度（Self-Driving Scheduler）——确定性自动化那半已成立，偏 AI 的那半按 §5.2.4 属 **L3**。

**一句话总结**：**调度系统从"Crontab 脚本"→"传统 Oozie"→"Airflow / DolphinScheduler"→"云原生 Argo"→"AI 增强"五阶段演进，今天 Airflow / DataWorks / Argo 是主流。**

---

## 2. 核心原理

### 2.1 关键概念定义

**DAG（有向无环图）**：

- 节点（Task）+ 边（依赖关系）。
- 表达任务依赖。

**Task（任务）**：

- 最小执行单元。
- 类型：SQL 任务、Spark 任务、Flink 任务、Shell 任务、Python 任务。

**Trigger（触发器）**：

- **定时触发**：Cron 表达式（每天 2 点）。
- **事件触发**：上游任务成功后触发。
- **手动触发**：人工启动。

**Operator（算子）**：

- Airflow 中的任务类型。
- BashOperator、PythonOperator、SparkOperator、KubernetesPodOperator。

**TaskInstance / DAG Run**：

- TaskInstance：单次任务执行实例。
- DAG Run：单次 DAG 执行实例。

**Scheduler（调度器）**：

- 负责触发 DAG Run。
- 调度策略：定时、依赖、资源。

**Executor（执行器）**：

- 负责实际执行 Task。
- 类型：LocalExecutor、CeleryExecutor、KubernetesExecutor。

**XCom（Cross-Communication）**：

- Task 间数据传递机制。

**Backfill（补数）**：

- 补跑历史数据。

**Sensor（传感器）**：

- 等待外部事件（Hive 分区、Kafka Topic、文件存在）。

**SLA（Service Level Agreement）**：

- 对任务时效的承诺，两种常见语义：**执行型**（任务最大允许执行时间）与**产出型**（承诺产出时刻）。
- 违反承诺（超时或未按时产出）即触发 SLA Miss 告警；在产出型承诺之上再叠加分级、提前预测与升级，就是 §3 的「基线」。

### 2.2 数学 / 形式化基础

**DAG 调度算法**：

- 拓扑排序（Topological Sort）：按依赖顺序执行。
- 关键路径（Critical Path）：最长依赖链。
- **优化**：并行执行无依赖任务。

**任务调度的形式化**：

```
Task = (Name, Dependencies, Resources, Schedule)
Schedule = CronExpression | EventTrigger | ManualTrigger
```

**资源调度的数学模型**：

- **公平调度（Fair Scheduler）**：均分资源。
- **容量调度（Capacity Scheduler）**：按队列分配。
- **优先级调度（Priority Scheduler）**：高优先级先。

**Cron 表达式**：

```
* * * * * *
秒 分 时 日 月 周
```

### 2.3 关键算法 / 方法

**1. Airflow DAG 编排**

```python
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'daily_etl',
    default_args=default_args,
    schedule_interval='0 2 * * *',  # 每天 2 点
    start_date=datetime(2025, 1, 1),
    catchup=False,
) as dag:
    # 任务 1：抽取
    extract = BashOperator(
        task_id='extract_orders',
        bash_command='python /scripts/extract.py',
    )
    
    # 任务 2：转换
    transform = SparkSubmitOperator(
        task_id='transform_orders',
        application='/scripts/transform.py',
        conf={'spark.sql.adaptive.enabled': 'true'},
    )
    
    # 任务 3：加载
    load = BashOperator(
        task_id='load_to_dw',
        bash_command='python /scripts/load.py',
    )
    
    extract >> transform >> load  # DAG 依赖
```

**2. DolphinScheduler DAG 编排**

```python
# DolphinScheduler 通过 Web UI 或 Python SDK 定义 DAG
# 1. 创建工作流
# 2. 添加任务节点（Shell / SQL / Spark / Flink）
# 3. 配置依赖关系（连线）
# 4. 配置调度（Cron）
```

**3. Argo Workflows（K8s 原生）**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: daily-etl
spec:
  entrypoint: etl-pipeline
  templates:
  - name: etl-pipeline
    dag:
      tasks:
      - name: extract
        template: extract-task
      - name: transform
        dependencies: [extract]
        template: transform-task
      - name: load
        dependencies: [transform]
        template: load-task
  - name: extract-task
    container:
      image: python:3.10
      command: [python, /scripts/extract.py]
```

**4. 事件触发（Sensor）**

```python
# Airflow HivePartitionSensor
from airflow.sensors.hive_partition_sensor import HivePartitionSensor

wait_for_partition = HivePartitionSensor(
    task_id='wait_for_partition',
    table='orders',
    partition='dt=2025-01-15',
    poke_interval=60 * 5,  # 5 分钟检查一次
)

wait_for_partition >> transform
```

**5. 失败重试 + 告警**

```python
import requests

default_args = {
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,
    'on_failure_callback': send_alert,  # 失败回调
}

def send_alert(context):
    # 发送告警（钉钉 / 飞书 / 邮件）
    requests.post(webhook_url, json={
        'task': context['task_instance'].task_id,
        'status': 'failed',
        'log_url': context['task_instance'].log_url,
    })
```

**6. 跨 DAG 触发（TriggerDagRunOperator）**

```python
# Airflow 跨 DAG 触发
from airflow.operators.trigger_dagrun import TriggerDagRunOperator

trigger_downstream = TriggerDagRunOperator(
    task_id='trigger_downstream_dag',
    trigger_dag_id='hourly_aggregation',
    execution_date='{{ ds }}',
)

main_task >> trigger_downstream
```

### 2.4 与相邻概念的关系

**调度系统 vs 工作流引擎**：

- 调度系统：定时 + 依赖（如 Airflow）。
- 工作流引擎：流程编排（如 Camunda、Flowable）。

**调度系统 vs 资源调度器（YARN / K8s）**：

- 调度系统：业务任务编排。
- 资源调度器：底层资源分配。
- **关系**：调度系统调用资源调度器。

**Airflow vs DolphinScheduler vs DataWorks**：

| 维度 | Airflow | DolphinScheduler | DataWorks |
| --- | --- | --- | --- |
| 开源 | 是（Apache） | 是（Apache） | 否（阿里云） |
| 易用性 | 中（Python） | 高（UI） | 高（云） |
| 扩展性 | 强 | 强 | 中 |
| 中文社区 | 中 | 强 | 阿里系 |
| 云原生 | 中（K8s Executor） | 中 | 强（云原生） |
| AI 集成 | 中 | 中 | 强 |

> 💡 **思考锚点**：数一下你主 DAG 的关键路径有几跳，再把 default_args 里的 retries × retry_delay（示例是 3 × 5 分钟）加到这条链的尾部——它离你给这条 DAG 设的 SLA 还剩多少余量？如果你的 catchup 不是 False，补数当天这个余量还成立吗？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](12-scheduler-section-3-sec3.md)
- [§4. 工程实现](12-scheduler-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](12-scheduler-section-5-ai.md)
- [§6. 落地实践](12-scheduler-section-6-sec6.md)
- [§7. 与其他方法对比](12-scheduler-section-7-sec7.md)
- [§8. 面试真题集](12-scheduler-section-8-sec8.md)

---
