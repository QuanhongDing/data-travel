> 本文件是 **12-scheduler.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](12-scheduler.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型调度器（1-2 周）**

- 通用：Airflow / DolphinScheduler。
- 云原生：Argo Workflows。
- 云端：DataWorks。

**Step 2：集群部署（2-4 周）**

- Scheduler 高可用。
- Worker 弹性扩缩容。

**Step 3：DAG 编排规范（1-2 周）**

- 命名规范。
- 依赖规范。
- 失败处理。

**Step 4：监控告警（1-2 周）**

- DAG Run 状态。
- Task 失败告警。
- SLA Miss 告警。

**Step 5：补数机制（持续）**

- Backfill 历史数据。
- 手动重跑。

**Step 6：AI 集成（按需）**

- AI 异常检测。
- 自动修复。

### 4.2 关键技术点

**1. Airflow + K8s Executor**

```yaml
# airflow.cfg
executor = KubernetesExecutor

[kubernetes]
namespace = airflow
worker_container_repository = apache/airflow
```

```python
# K8s Executor 自动创建 Pod 运行 Task
spark_task = SparkSubmitOperator(
    task_id='spark_task',
    application='/scripts/spark.py',
    conf={'spark.executor.instances': '10'},
    executor_config={
        'pod_override': k8s.V1Pod(
            spec=k8s.V1PodSpec(
                containers=[
                    k8s.V1Container(
                        name='base',
                        resources=k8s.V1ResourceRequirements(
                            requests={'cpu': '2', 'memory': '4Gi'},
                            limits={'cpu': '4', 'memory': '8Gi'},
                        ),
                    ),
                ],
            ),
        ),
    },
)
```

**2. DolphinScheduler 部署**

```bash
# 部署 DolphinScheduler（K8s）
helm install dolphinscheduler dolphinscheduler/dolphinscheduler \
  --set image.tag=3.1.0 \
  --set postgresql.enabled=true
```

**3. Argo Workflows 完整示例**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: data-etl
spec:
  entrypoint: etl
  arguments:
    parameters:
    - name: date
      value: "2025-01-15"
  templates:
  - name: etl
    dag:
      tasks:
      - name: extract
        template: extract
        arguments:
          parameters:
          - {name: date, value: "{{workflow.parameters.date}}"}
      - name: transform
        dependencies: [extract]
        template: transform
      - name: load
        dependencies: [transform]
        template: load
  - name: extract
    container:
      image: python:3.10
      command: [python, /scripts/extract.py, --date, "{{inputs.parameters.date}}"]
    inputs:
      parameters:
      - name: date
```

**4. 失败重试 + 告警**

```python
from airflow.operators.python import PythonOperator

def send_alert(context):
    """失败告警（钉钉/飞书）"""
    webhook = "https://oapi.dingtalk.com/robot/send?access_token=XXX"
    msg = {
        "msgtype": "markdown",
        "markdown": {
            "title": "任务失败告警",
            "text": f"任务 {context['task_instance'].task_id} 失败"
        }
    }
    requests.post(webhook, json=msg)

default_args = {
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'on_failure_callback': send_alert,
}
```

**5. Backfill 补数**

```bash
# Airflow Backfill
airflow dags backfill --start-date 2025-01-01 --end-date 2025-01-15 daily_etl
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**调度系统（2024-2025）**：

| 工具 | 版本 | 特点 |
| --- | --- | --- |
| Apache Airflow | 2.9+ | Pythonic、生态最广 |
| Apache DolphinScheduler | 3.1+ | 国产、易用 |
| Argo Workflows | 3.5+ | K8s 原生 |
| Prefect | 2.x | 现代化、SaaS |
| Dagster | 1.5+ | 资产编排 |
| KubeFlow Pipelines | 2.x | ML 编排 |
| 阿里云 DataWorks | - | 阿里云一站式 |
| 腾讯云 WeData | - | 腾讯云一站式 |

**资源调度集成**：

- YARN：Hadoop 生态。
- K8s：云原生。
- Mesos：传统。

**AI 增强工具**：

- AI 异常检测（Datadog / Anomaly Detection）。
- AI 自动修复（自研 + LLM）。
- 自适应调度（自动扩缩容）。

### 4.4 代码 / 示例

**示例 1：Airflow 完整 DAG（数据全链路）**

```python
from airflow import DAG
from airflow.providers.cncf.kubernetes.operators.pod import KubernetesPodOperator
from airflow.sensors.external_task import ExternalTaskSensor
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-team',
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'on_failure_callback': send_alert,
}

with DAG(
    'daily_data_pipeline',
    default_args=default_args,
    schedule_interval='0 2 * * *',
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=['data', 'production'],
) as dag:
    
    # 1. 等待上游分区
    wait_for_orders = ExternalTaskSensor(
        task_id='wait_for_orders',
        external_dag_id='mysql_cdc_to_iceberg',
        external_task_id='sync_orders',
        allowed_states=['success'],
        timeout=3600,
    )
    
    # 2. ODS → DWD
    ods_to_dwd = KubernetesPodOperator(
        task_id='ods_to_dwd',
        name='spark-ods-dwd',
        namespace='spark',
        image='spark:3.5',
        cmds=['spark-submit'],
        arguments=[
            '--master', 'k8s://https://k8s-api:443',
            '--conf', 'spark.sql.adaptive.enabled=true',
            'local:///scripts/ods_to_dwd.py',
        ],
        resources={'request_cpu': '4', 'request_memory': '16Gi'},
    )
    
    # 3. DWD → DWS
    dwd_to_dws = KubernetesPodOperator(
        task_id='dwd_to_dws',
        name='spark-dwd-dws',
        namespace='spark',
        image='spark:3.5',
        cmds=['spark-submit'],
        arguments=[
            'local:///scripts/dwd_to_dws.py',
        ],
    )
    
    # 4. DWS → ADS（实时 OLAP）
    dws_to_ads = KubernetesPodOperator(
        task_id='dws_to_ads',
        name='flink-dws-ads',
        namespace='flink',
        image='flink:1.19',
        cmds=['flink', 'run'],
        arguments=[
            'local:///scripts/dws_to_ads.jar',
        ],
    )
    
    # 5. 数据质量检查
    dq_check = KubernetesPodOperator(
        task_id='dq_check',
        name='dq-check',
        namespace='dq',
        image='python:3.10',
        cmds=['python', '/scripts/dq_check.py'],
    )
    
    # 6. 通知完成
    notify = PythonOperator(
        task_id='notify_success',
        python_callable=notify_success,
    )
    
    wait_for_orders >> ods_to_dwd >> dwd_to_dws >> dws_to_ads >> dq_check >> notify
```

**示例 2：Argo Workflows + K8s**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: realtime-etl
spec:
  entrypoint: etl-pipeline
  serviceAccountName: argo-workflow
  templates:
  - name: etl-pipeline
    dag:
      tasks:
      - name: kafka-source
        template: kafka-consumer
      - name: flink-process
        dependencies: [kafka-source]
        template: flink-job
      - name: iceberg-sink
        dependencies: [flink-process]
        template: iceberg-write
      - name: starrocks-load
        dependencies: [iceberg-sink]
        template: starrocks-stream-load
  - name: kafka-consumer
    container:
      image: confluentinc/cp-kafka:7.5.0
      command: [kafka-console-consumer]
  - name: flink-job
    container:
      image: flink:1.19
      command: [flink, run]
  - name: iceberg-write
    container:
      image: apache/spark:3.5
      command: [spark-submit]
  - name: starrocks-stream-load
    container:
      image: mysql:8.0
      command: [mysql]
```

**示例 3：AI 异常检测（异常自动告警）**

```python
# Airflow + AI 异常检测
from airflow import DAG
from airflow.operators.python import PythonOperator
import pandas as pd

def detect_anomaly(**context):
    """AI 异常检测"""
    # 加载历史数据
    history = pd.read_parquet("s3://lake/history/")
    
    # 加载本次执行指标
    current = pd.read_parquet("s3://lake/current/")
    
    # AI 模型检测异常（Isolation Forest）
    from sklearn.ensemble import IsolationForest
    model = IsolationForest(contamination=0.1)
    model.fit(history)
    predictions = model.predict(current)
    
    # 异常告警
    anomalies = current[predictions == -1]
    if len(anomalies) > 0:
        send_alert(anomalies)

with DAG('ai_anomaly_detection', schedule_interval='@hourly') as dag:
    detect = PythonOperator(task_id='detect_anomaly', python_callable=detect_anomaly)
```

---
