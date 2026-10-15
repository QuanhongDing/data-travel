> 本文件是 **03-data-cost-finops.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](03-data-cost-finops.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：成本可见性（4-6 周）**

1. 接入云厂商账单（AWS Cost Explorer / Azure / 阿里云）。
2. 资源标签标准化（团队 / 项目 / 环境 / Owner）。
3. 自建 FinOps 看板（按团队 / 项目 / 服务 / 时间维度）。
4. 异常告警（成本异常波动 > 20% 触发告警）。

**Step 2：成本归因（4-6 周）**

1. 标签治理（强制打标签）。
2. 共享成本分摊规则（如 EKS Control Plane 按 Pod 数分摊）。
3. 团队 Showback 看板。
4. 月度成本 review 会议。

**Step 3：存储降本（4-8 周）**

1. 冷热分层（最近 30 天 → 标准 S3；30-180 天 → IA；> 180 天 → Glacier）。
2. 压缩格式统一（Parquet + ZSTD）。
3. 备份策略优化（全量备份 → 增量 + 合成全量）。
4. 重复数据删除。

**Step 4：计算降本（4-8 周）**

1. Spot 实例接入（Spark / Flink 可中断任务）。
2. RI / Savings Plans 采购（基线负载）。
3. 弹性伸缩（Karpenter / 自研）。
4. 小文件 Compaction（Spark / Hudi / Iceberg）。
5. 资源 Right-Sizing。

**Step 5：查询降本（4-8 周）**

1. 数仓自动暂停（Snowflake Auto-Suspend）。
2. 查询结果缓存（Alluxio / 自研）。
3. SQL 优化（Pruning、列裁剪、物化视图）。
4. 资源队列管理（Workload Management）。

**Step 6：流程与文化（持续）**

1. 成本 owner 机制（每个团队配成本 owner）。
2. 月度成本评审。
3. 季度降本 OKR。
4. 工程师 FinOps 培训。

### 4.2 关键技术点

**1. 存储降本工程**：

- **冷热分层策略**：

```python
# S3 Lifecycle Policy（伪代码）
{
    "Rules": [
        {
            "Id": "MoveToIA30Days",
            "Status": "Enabled",
            "Filter": {"Prefix": "data-lake/"},
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 180,
                    "StorageClass": "GLACIER"
                }
            ],
            "Expiration": {"Days": 365}
        }
    ]
}
```

- **小文件 Compaction**：

```python
# Iceberg Compaction（Spark）
spark.sql("""
    CALL catalog.system.rewrite_data_files(
        table => 'db.orders',
        strategy => 'sort',
        sort_order => 'zorder(order_id, user_id)',
        options => map(
            'target-file-size-bytes', '536870912'  -- 512MB
        )
    )
""")
```

**2. 计算降本工程**：

- **Spot Fleet 配置**：

```yaml
# AWS Spot Fleet 配置
capacityRebalance: true  # 启用再平衡
allocationStrategy: priceCapacityOptimized  # 价格 + 容量优化
instancePools:
  - instanceType: r5.2xlarge
    weight: 1
  - instanceType: r5a.2xlarge
    weight: 1
  - instanceType: r6i.2xlarge
    weight: 1
  - instanceType: m5.2xlarge
    weight: 2
```

- **Karpenter（K8s 弹性伸缩）**：

```yaml
# Karpenter NodePool
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: spark-pool
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
        - key: karpenter.k8s.aws/instance-family
          operator: In
          values: ["r5", "r6i", "m5"]
        - key: karpenter.k8s/aws/instance-size
          operator: In
          values: ["2xlarge", "4xlarge"]
      nodeClassRef:
        name: default
  limits:
    cpu: "1000"
    memory: 4000Gi
  disruption:
    consolidationPolicy: WhenUnderutilized
    expireAfter: 720h  # 30 天强制轮转
```

**3. 查询降本工程**：

- **Snowflake Auto-Suspend**：

```sql
-- 创建数仓时配置
CREATE WAREHOUSE analytics_wh
WITH
    WAREHOUSE_SIZE = 'MEDIUM'
    AUTO_SUSPEND = 60  -- 60 秒空闲自动暂停
    AUTO_RESUME = TRUE
    MIN_CLUSTER_COUNT = 1
    MAX_CLUSTER_COUNT = 10
    SCALING_POLICY = 'ECONOMY';  -- 经济模式优先降本
```

- **Iceberg 分区裁剪**：

```sql
-- 推荐：分区裁剪 + 列裁剪
SELECT user_id, COUNT(*)
FROM iceberg.orders
WHERE dt = '2025-01-15'  -- 分区裁剪
  AND status = 'PAID'    -- 列裁剪
GROUP BY user_id;

-- 不推荐：全表扫描
SELECT *
FROM iceberg.orders
WHERE status = 'PAID';
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**云厂商原生**：

| 工具 | 云厂商 | 能力 |
| --- | --- | --- |
| **AWS Cost Explorer** | AWS | 成本可视化、RI 推荐、Savings Plans |
| **AWS Cost Anomaly Detection** | AWS | 异常告警 |
| **Azure Cost Management** | Azure | 成本 + 预算 + 告警 |
| **阿里云费用中心** | 阿里云 | 成本可视化、预算管理 |
| **GCP Billing** | GCP | 成本报告 |

**第三方 FinOps 平台**：

| 工具 | 定位 |
| --- | --- |
| **Apptio (Cloudability)** | 企业级 FinOps 龙头 |
| **Vantage** | 多云 FinOps |
| **CloudHealth** | VMware 系 FinOps |
| **Harness Cloud Cost** | 持续 FinOps |
| **Anaconda Cloud Cost** | 数据 / AI 专用 |
| **自研 FinOps 平台** | 阿里、字节、华为自研 |

**数据专用工具**：

| 工具 | 定位 |
| --- | --- |
| **Snowflake Cost Explorer** | Snowflake 内置 |
| **Databricks Cost** | Databricks 成本 |
| **BigQuery Cost** | GCP BigQuery |
| **dbt Cost** | dbt + Cost 集成 |
| **Atlan + Cost** | 数据资产 + 成本联动 |
| **阿里云 DataWorks 成本** | 阿里云数据中台成本 |
| **字节 DataFinder 成本** | 字节自研 |

**AI 时代新工具（2024-2025）**：

- **Karpenter 1.0（2024 GA）**：K8s 弹性伸缩 + Spot 大幅降本。
- **SkyPilot**：跨云 AI 任务调度，自动选最便宜的 GPU。
- **Modal / Replicate**：Serverless GPU + 自动伸缩。
- **RunPod / Lambda Labs**：便宜的 GPU 云。
- **Crusoe Cloud**：清洁能源 + GPU。
- **Together AI / Anyscale**：AI 推理成本优化。

### 4.4 代码 / 示例

**示例 1：标签驱动的成本归因（AWS）**

```python
# cost_attribution.py
import boto3
from datetime import datetime, timedelta

ce = boto3.client('ce')

def get_cost_by_team(start_date, end_date):
    response = ce.get_cost_and_usage(
        TimePeriod={'Start': start_date, 'End': end_date},
        Granularity='MONTHLY',
        GroupBy=[{'Type': 'TAG', 'Key': 'team'}],
        Metrics=['BlendedCost', 'UsageQuantity'],
        Filter={
            'Dimensions': {
                'Key': 'SERVICE',
                'Values': ['Amazon S3', 'Amazon EC2', 'Amazon EMR']
            }
        }
    )
    
    team_costs = {}
    for result in response['ResultsByTime']:
        for group in result['Groups']:
            team = group['Keys'][0] if group['Keys'][0] else 'untagged'
            cost = float(group['Metrics']['BlendedCost']['Amount'])
            team_costs[team] = team_costs.get(team, 0) + cost
    
    return team_costs

# 月度 Showback 报表
team_costs = get_cost_by_team('2025-01-01', '2025-02-01')
for team, cost in sorted(team_costs.items(), key=lambda x: -x[1]):
    print(f"{team}: ${cost:,.2f}")
```

**示例 2：弹性伸缩策略（Karpenter + Spot）**

```python
# karpenter_spot_strategy.py
"""
Spark on Karpenter 弹性伸缩策略：
- 工作日 9:00-22:00：扩到 2x
- 周末全天：基线 1x
- 大促期间：提前 24h 扩到 3x
- 平时：Spot 优先，On-Demand 兜底
"""

import boto3
from datetime import datetime

def get_desired_capacity():
    now = datetime.now()
    hour = now.hour
    is_weekend = now.weekday() >= 5
    is_promotion = is_promotion_period(now)  # 自定义大促判断
    
    if is_promotion:
        return {"min": 30, "max": 100, "desired": 60}
    elif is_weekend:
        return {"min": 10, "max": 30, "desired": 15}
    elif 9 <= hour <= 22:  # 工作时间
        return {"min": 20, "max": 80, "desired": 40}
    else:  # 工作日凌晨
        return {"min": 5, "max": 20, "desired": 10}


def is_promotion_period(now):
    """判断是否大促期间（自定义）"""
    promotion_dates = [
        ("2025-01-01", "2025-01-03"),  # 元旦
        ("2025-02-10", "2025-02-17"),  # 春节
        ("2025-06-18", "2025-06-20"),  # 618
        ("2025-11-10", "2025-11-12"),  # 双 11
    ]
    for start, end in promotion_dates:
        if start <= now.strftime("%Y-%m-%d") <= end:
            return True
    return False
```

**示例 3：Snowflake 成本监控 + 自动暂停**

```sql
-- 1. 监控数仓成本
SELECT 
    warehouse_name,
    SUM(credits_used) AS total_credits,
    SUM(credits_used) * 3  -- 假设每 credit 3 美元
        AS estimated_cost_usd
FROM snowflake.account_usage.warehouse_metering_history
WHERE start_time >= DATEADD('day', -30, CURRENT_TIMESTAMP())
GROUP BY warehouse_name
ORDER BY total_credits DESC;

-- 2. 自动暂停配置
ALTER WAREHOUSE analytics_wh SET
    AUTO_SUSPEND = 60,
    AUTO_RESUME = TRUE;

-- 3. 资源监控（实时）
CREATE OR REPLACE VIEW v_warehouse_load AS
SELECT 
    warehouse_name,
    AVG(avg_running) AS avg_queries_running,
    AVG(avg_queued_load) AS avg_queries_queued,
    SUM(credits_used) AS credits_per_hour
FROM snowflake.account_usage.warehouse_metering_history
WHERE start_time >= DATEADD('hour', -1, CURRENT_TIMESTAMP())
GROUP BY warehouse_name;

-- 4. 触发告警（当队列堆积）
CREATE OR REPLACE TASK alert_warehouse_queue
    WAREHOUSE = etl_wh
    SCHEDULE = '5 MINUTE'
AS
    INSERT INTO alert_events
    SELECT 
        CURRENT_TIMESTAMP() AS alert_time,
        warehouse_name,
        'HIGH_QUEUE_DEPTH' AS alert_type,
        avg_queries_queued
    FROM v_warehouse_load
    WHERE avg_queued_load > 10;
```

**示例 4：AI GPU 成本治理（SkyPilot）**

```python
# sky_gpu_cost.yaml
# SkyPilot 跨云 GPU 调度，自动选最便宜的

resources:
    cloud: gcp,aws,azure
    accelerators: A100:1
    use_spot: true  # 默认用 Spot

run: |
    python train.py --model gpt-2-large

# 启动
# sky launch --gpus A100:1 --use-spot train.yaml

# SkyPilot 自动：
# 1. 查询 AWS/GCP/Azure 的 A100 Spot 价格
# 2. 选最便宜的（甚至自动迁移）
# 3. Spot 回收时自动重新调度
# 4. 任务完成后释放
```

---
