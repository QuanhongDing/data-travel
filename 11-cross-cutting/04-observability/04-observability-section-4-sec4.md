> 本文件是 **04-observability.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](04-observability.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：指标体系建设（2-4 周）**

1. 定义五大支柱指标（Freshness / Volume / Schema / Quality / Lineage + Distribution）。
2. 为每张核心表配置指标采集。
3. 接入时序存储（Prometheus / TSDB）。
4. 配置可视化（Grafana / 自研看板）。

**Step 2：异常检测（2-4 周）**

1. 静态阈值（关键规则）。
2. 动态阈值（3-sigma / IQR）。
3. ML 异常检测（孤立森林 / Prophet / LSTM-AE）。
4. 异常分级（P0/P1/P2/P3）。

**Step 3：告警与 oncall（2-4 周）**

1. 告警路由（钉钉 / 飞书 / PagerDuty）。
2. oncall 排班（Follow-the-sun）。
3. Runbook（每个告警的处置手册）。
4. MTTR 度量与复盘。

**Step 4：血缘集成（4-8 周）**

1. 自动血缘采集（OpenLineage / DataHub）。
2. 血缘可视化（字段级）。
3. 血缘 + 指标联动（异常 → 血缘定位 → 通知上游）。
4. 影响分析（上游变更 → 下游感知）。

**Step 5：智能化升级（4-8 周）**

1. 接入 AIOps（异常自动归因）。
2. LLM 辅助（自然语言查询异常、生成 Runbook）。
3. Agent 自动修复（试点）。
4. RAG 集成（业务方自助查询）。

**Step 6：SLA 与流程（持续）**

1. 与业务方谈 SLA。
2. 月度 SLA 评审。
3. Postmortem 文化。
4. 度量指标：覆盖率、MTTD、MTTR、误报率。

### 4.2 关键技术点

**1. 指标采集架构**：

```python
# metrics_collector.py
# 采集五大支柱指标
from prometheus_client import Gauge, Histogram

freshness_gauge = Gauge(
    'data_freshness_seconds',
    'Data freshness in seconds',
    ['database', 'table', 'column']
)

volume_gauge = Gauge(
    'data_volume_rows',
    'Number of rows',
    ['database', 'table']
)

quality_gauge = Gauge(
    'data_quality_rate',
    'Data quality metric rate (0-1)',
    ['database', 'table', 'column', 'metric_type']
)

schema_gauge = Gauge(
    'data_schema_columns',
    'Number of columns',
    ['database', 'table']
)

distribution_gauge = Gauge(
    'data_distribution_psi',
    'Population Stability Index (PSI)',
    ['database', 'table', 'column']
)


def collect_metrics(table_metadata):
    db, table = table_metadata.database, table_metadata.table
    
    # Freshness
    last_update = get_last_update_time(db, table)
    freshness = (now() - last_update).total_seconds()
    freshness_gauge.labels(db, table, '*').set(freshness)
    
    # Volume
    row_count = get_row_count(db, table)
    volume_gauge.labels(db, table).set(row_count)
    
    # Quality
    for column in table_metadata.columns:
        null_rate = compute_null_rate(db, table, column)
        unique_rate = compute_unique_rate(db, table, column)
        quality_gauge.labels(db, table, column, 'null_rate').set(null_rate)
        quality_gauge.labels(db, table, column, 'unique_rate').set(unique_rate)
    
    # Schema
    schema_gauge.labels(db, table).set(len(table_metadata.columns))
    
    # Distribution
    for column in table_metadata.numeric_columns:
        psi = compute_psi(db, table, column)
        distribution_gauge.labels(db, table, column).set(psi)
```

**2. 异常检测引擎**：

```python
# anomaly_detection.py
from sklearn.ensemble import IsolationForest
import numpy as np

class AnomalyDetector:
    def __init__(self):
        self.iso_forest = IsolationForest(contamination=0.01)
        self.is_trained = False
    
    def detect_3sigma(self, history: list, current: float) -> bool:
        """3-sigma 检测"""
        if len(history) < 30:
            return False
        mean = np.mean(history)
        std = np.std(history)
        return abs(current - mean) > 3 * std
    
    def detect_iqr(self, history: list, current: float) -> bool:
        """IQR 检测"""
        if len(history) < 30:
            return False
        q1, q3 = np.percentile(history, [25, 75])
        iqr = q3 - q1
        return current > q3 + 1.5 * iqr or current < q1 - 1.5 * iqr
    
    def detect_with_ml(self, history_matrix: np.ndarray) -> list:
        """孤立森林检测（多维）"""
        if not self.is_trained:
            self.iso_forest.fit(history_matrix)
            self.is_trained = True
        predictions = self.iso_forest.predict(history_matrix)
        # -1 = 异常, 1 = 正常
        return [i for i, p in enumerate(predictions) if p == -1]
    
    def detect_drift(self, baseline: np.ndarray, current: np.ndarray) -> float:
        """分布漂移检测（PSI）"""
        eps = 1e-10
        psi_values = []
        for i in range(min(baseline.shape[1], current.shape[1])):
            hist_baseline, _ = np.histogram(baseline[:, i], bins=10)
            hist_current, _ = np.histogram(current[:, i], bins=10)
            p = hist_baseline / hist_baseline.sum() + eps
            q = hist_current / hist_current.sum() + eps
            psi = np.sum((p - q) * np.log(p / q))
            psi_values.append(psi)
        return max(psi_values) if psi_values else 0
```

**3. 告警分级与路由**：

```yaml
# alert_rules.yaml（Alertmanager 配置）
groups:
  - name: data_quality_p0
    rules:
      - alert: CriticalDataFreshnessBreach
        expr: data_freshness_seconds > 3600
        for: 5m
        labels:
          severity: P0
          team: data-platform
        annotations:
          summary: "Critical data is stale for {{ $labels.table }}"
          runbook: "https://wiki.example.com/runbook/data-stale"
    
  - name: data_quality_p1
    rules:
      - alert: DataVolumeAnomaly
        expr: |
          abs(data_volume_rows - avg_over_time(data_volume_rows[1h] offset 1d))
            > 3 * stddev_over_time(data_volume_rows[1h] offset 1d)
        for: 10m
        labels:
          severity: P1
          team: data-platform
  
  - name: data_quality_p2
    rules:
      - alert: SchemaDriftDetected
        expr: changes(data_schema_columns[1h]) > 0
        for: 5m
        labels:
          severity: P2
          team: data-platform

# 告警路由
route:
  group_by: ['alertname', 'team']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
    - match:
        severity: P0
      receiver: 'pagerduty-p0'
      group_wait: 10s
    - match:
        severity: P1
      receiver: 'dingtalk-p1'
    - match:
        severity: P2
      receiver: 'email-p2'

receivers:
  - name: 'pagerduty-p0'
    pagerduty_configs:
      - service_key: ${PAGERDUTY_KEY}
  - name: 'dingtalk-p1'
    webhook_configs:
      - url: ${DINGTALK_WEBHOOK}
  - name: 'email-p2'
    email_configs:
      - to: 'data-platform@example.com'
```

**4. 根因分析（基于血缘）**：

```python
# root_cause_analysis.py
from collections import deque

def find_root_cause(lineage_graph, anomaly_node, max_depth=10):
    """
    在血缘图中反向追溯根因。
    lineage_graph: {node: [(parent, edge_type), ...]}
    anomaly_node: 异常的节点（如一张表）
    """
    visited = set()
    queue = deque([(anomaly_node, 0, [anomaly_node])])
    root_causes = []
    
    while queue:
        node, depth, path = queue.popleft()
        if depth > max_depth:
            continue
        if node in visited:
            continue
        visited.add(node)
        
        parents = lineage_graph.get(node, [])
        if not parents:
            # 没有上游，是根因
            root_causes.append({
                "node": node,
                "path": path,
                "distance": depth
            })
            continue
        
        for parent, edge_type in parents:
            queue.append((parent, depth + 1, path + [parent]))
    
    # 按距离排序，取最近根因
    root_causes.sort(key=lambda x: x["distance"])
    return root_causes[:5]
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**开源工具**：

| 工具 | 定位 | 优势 | 劣势 |
| --- | --- | --- | --- |
| **Prometheus** | 时序数据库 + 监控 | 生态丰富 | 大数据场景需配合 |
| **Grafana** | 可视化 | 强大、灵活 | 配置复杂 |
| **Apache Griffin** | 大数据 DQ | Spark 集成 | 社区相对小 |
| **DataHub** | 元数据 + 血缘 | LinkedIn 出品、活跃 | 学习曲线 |
| **Apache Atlas** | 元数据 + 血缘 | Hadoop 生态 | 文档较少 |
| **OpenLineage** | 统一血缘规范 | 跨工具 | 实施中 |
| **Marquez** | 血缘 + 元数据 | OpenLineage 核心 | 部署复杂 |
| **Soda Core** | 配置化 DQ | 易上手 | 大数据有限 |
| **Great Expectations** | 声明式 DQ | 生态丰富 | 配置复杂 |

**商业 SaaS**：

| 工具 | 定位 | 关键能力 |
| --- | --- | --- |
| **Monte Carlo Data** | Data Observability 龙头 | 五大支柱 + 字段级血缘 + ML + RAG 集成 |
| **Bigeye** | Data Observability | 深度集成 Snowflake / Databricks |
| **Mona** | AI-first 可观测性 | AI Quality Copilot、自动归因 |
| **Anomalo** | 自动异常检测 | 无需规则、纯 ML |
| **Datafold** | Diff + 回归测试 | 数据版本对比 |
| **Soda Cloud** | SaaS DQ | 与 Soda Core 协同 |
| **Univocity** | 商业 DQ + 可观测性 | 中国本土化 |

**AI 时代新工具（2024-2025）**：

- **Monte Carlo + RAG**：可观测性知识库接入 LLM。
- **Mona AI Quality Copilot**：自然语言查询异常。
- **Anomalo Autonomous**：完全无配置。
- **Datadog AI Observability**：LLM 应用监控。
- **New Relic AI**：LLM 调用链路追踪。
- **Langfuse / LangSmith**：LLM 应用可观测性。
- **Arize Phoenix**：LLM 评估 + 可观测性。

### 4.4 代码 / 示例

**示例 1：完整的可观测性平台（Python + Prometheus）**

```python
# observability_platform.py
import time
from prometheus_client import start_http_server, Gauge
from prometheus_client.exporter import PrometheusExpositionHandler
from sklearn.ensemble import IsolationForest
import numpy as np

class DataObservabilityPlatform:
    def __init__(self):
        self.freshness_gauge = Gauge('data_freshness_seconds', 'Freshness', ['db', 'table'])
        self.volume_gauge = Gauge('data_volume_rows', 'Volume', ['db', 'table'])
        self.quality_gauge = Gauge('data_quality_rate', 'Quality', ['db', 'table', 'column', 'metric'])
        self.schema_gauge = Gauge('data_schema_columns', 'Schema columns', ['db', 'table'])
        self.anomaly_score = Gauge('data_anomaly_score', 'Anomaly score', ['db', 'table'])
        
        self.history = {}  # 存储历史指标
        self.anomaly_detector = AnomalyDetector()
    
    def collect(self, db, table):
        """采集五大支柱指标"""
        # 1. Freshness
        last_update = self._get_last_update(db, table)
        freshness = time.time() - last_update
        self.freshness_gauge.labels(db, table).set(freshness)
        
        # 2. Volume
        row_count = self._get_row_count(db, table)
        self.volume_gauge.labels(db, table).set(row_count)
        
        # 3. Quality
        for column in self._get_columns(db, table):
            null_rate = self._compute_null_rate(db, table, column)
            unique_rate = self._compute_unique_rate(db, table, column)
            self.quality_gauge.labels(db, table, column, 'null_rate').set(null_rate)
            self.quality_gauge.labels(db, table, column, 'unique_rate').set(unique_rate)
        
        # 4. Schema
        col_count = len(self._get_columns(db, table))
        self.schema_gauge.labels(db, table).set(col_count)
        
        # 5. Anomaly Detection
        history = self.history.setdefault(f"{db}.{table}", [])
        history.append({
            'timestamp': time.time(),
            'freshness': freshness,
            'row_count': row_count,
            'quality_avg': np.mean([
                self.quality_gauge.labels(db, table, c, 'null_rate')._value.get()
                for c in self._get_columns(db, table)
            ])
        })
        
        # 保留最近 1000 条历史
        if len(history) > 1000:
            history.pop(0)
        
        # 异常检测
        if len(history) > 30:
            anomaly_score = self._detect_anomaly(history)
            self.anomaly_score.labels(db, table).set(anomaly_score)
            
            if anomaly_score > 0.8:
                self._trigger_alert(db, table, anomaly_score)
    
    def _detect_anomaly(self, history):
        """异常检测"""
        features = np.array([
            [h['freshness'], h['row_count'], h['quality_avg']]
            for h in history[-100:]
        ])
        
        return self.anomaly_detector.detect_3sigma(
            features[:-1, 0].tolist(),
            features[-1, 0]
        )

if __name__ == '__main__':
    start_http_server(8000)
    platform = DataObservabilityPlatform()
    
    while True:
        for table in ['orders', 'users', 'products']:
            platform.collect('prod', table)
        time.sleep(60)
```

**示例 2：基于 OpenLineage 的血缘采集**

```python
# openlineage_integration.py
from openlineage.client import OpenLineageClient
from openlineage.client.event import (
    RunEvent, RunState, Run, Job, Dataset, 
    Symlinks, Ownership, InputDataset, OutputDataset
)

client = OpenLineageClient("http://marquez:5000")

def emit_lineage_event(job_name, inputs, outputs, run_state=RunState.COMPLETE):
    """发送血缘事件"""
    event = RunEvent(
        eventType=run_state,
        eventTime=datetime.now().isoformat(),
        run=Run(runId=str(uuid.uuid4())),
        job=Job(namespace="spark", name=job_name),
        inputs=[InputDataset(dataset=d) for d in inputs],
        outputs=[OutputDataset(dataset=d) for d in outputs],
        producer="spark-observability",
    )
    client.emit(event)


# 在 Spark ETL 中使用
def spark_etl_with_lineage():
    df_orders = spark.read.parquet("s3://lake/orders/")
    df_users = spark.read.parquet("s3://lake/users/")
    
    # 业务逻辑
    df_joined = df_orders.join(df_users, "user_id")
    
    # 输出血缘
    emit_lineage_event(
        job_name="etl_orders_users_join",
        inputs=[
            Dataset(namespace="s3://lake", name="orders"),
            Dataset(namespace="s3://lake", name="users"),
        ],
        outputs=[
            Dataset(namespace="s3://warehouse", name="dwd_orders"),
        ],
    )
    
    df_joined.write.parquet("s3://warehouse/dwd_orders/")
```

**示例 3：基于 LLM 的异常归因**

```python
# llm_root_cause.py
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def explain_anomaly_with_llm(anomaly_data, lineage_data, metrics_history):
    """用 LLM 解释异常"""
    
    prompt = f"""
你是一个资深数据可观测性专家。请基于以下信息分析异常根因。

## 异常指标
{anomaly_data}

## 血缘信息
{lineage_data}

## 历史指标趋势
{metrics_history}

请按以下结构回答：
1. **异常描述**：发生了什么
2. **可能根因**：列出 3 个最可能的原因
3. **建议修复方案**：每个根因对应的修复步骤
4. **预防措施**：如何避免类似问题
"""
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.content[0].text


# Agent 自动修复（基于 LangChain）
from langchain.agents import create_agent

def auto_remediation_agent(anomaly_alert):
    agent = create_agent(
        tools=[
            "restart_spark_job",
            "backfill_data",
            "notify_oncall",
            "rollback_data",
        ],
        llm="claude-3-5-sonnet-20241022",
    )
    
    response = agent.invoke({
        "input": f"""
        收到异常告警：{anomaly_alert}
        请按以下流程处理：
        1. 分析异常类型
        2. 查询血缘定位根因
        3. 选择合适的修复工具
        4. 执行修复（优先选可重试操作）
        5. 验证修复结果
        6. 通知 oncall（如修复失败）
        """
    })
    
    return response
```

---
