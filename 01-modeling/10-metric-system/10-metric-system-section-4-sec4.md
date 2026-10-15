> 本文件是 **10-metric-system.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](10-metric-system.md)。

## 4. 工程实现

### 4.1 落地步骤

#### 阶段 1 · 指标盘点与分类（0→1 第 1 周）

1. **盘点现有指标**：
   - 收集所有 BI 报表中的指标
   - 收集所有业务方口头提及的指标
   - 收集所有数仓 ADS 层核心指标
   - 输出 `metric_inventory.xlsx`
2. **指标分类**：
   - 按业务域（电商、广告、CRM、客服、风控）
   - 按层级（原子 / 派生 / 复合）
   - 按生命周期（高频 / 低频 / 历史）

#### 阶段 2 · OSCAR 标准化（0→1 第 2-3 周）

1. **定义指标五要素**：
   - O（业务对象）：用户、订单、商品、营销活动
   - S（业务修饰）：用户类型、地区、渠道、设备
   - C（业务过程）：注册、登录、下单、支付、售后
   - A（统计周期）：自然日、自然周、自然月、滚动 N 天
   - R（原子指标）：金额、数量、人数、次数
2. **每个指标拆解为 OSCAR**：
   - `GMV` = `订单金额_支付_近7日_全渠道`
   - `DAU` = `活跃用户数_登录_自然日_全渠道`
3. **建立指标命名规范**：
   - `时间_修饰_过程_原子指标`

#### 阶段 3 · 指标平台搭建（0→1 第 4-6 周）

1. **指标定义层**：
   - 指标元数据（名称、口径、Owner、数据源、版本）
   - OSCAR 五要素填入
   - 公式（SQL / DataFrame / MetricQL）
2. **指标计算层**：
   - 物化表（ADS / DWS）
   - 实时指标（Flink / Kafka）
   - 联邦查询（Presto / Trino）
3. **指标服务层**：
   - 指标查询 API（gRPC / REST）
   - 指标元数据 API
   - 权限管理
4. **指标管理 UI**：
   - 指标市场（Metric Marketplace）
   - 指标申请 / 审批 / 上线
   - 指标看板

#### 阶段 4 · 指标治理（0→1 第 7-8 周）

1. **指标 Owner 制度**：每个指标有业务 Owner + 数据 Owner
2. **指标评审委员会**：定期评审新指标申请、裁剪废弃指标
3. **指标监控**：
   - 指标计算成功率
   - 指标查询性能
   - 指标数据质量（缺失率、异常率）
4. **指标血缘**：从指标到上游表到 ETL 全链路

#### 阶段 5 · 接入 BI / AI（0→1 第 9-10 周）

1. **BI 工具接入**：
   - Tableau 通过 JDBC / ODBC
   - Superset 通过 SQLAlchemy
   - Looker 通过 LookML
2. **AI Agent 接入**：
   - 自然语言查询
   - 指标异常自动归因
   - Agent 决策（指标 + 阈值 + 行动）
3. **嵌入式分析**：
   - 产品内看板
   - 移动端看板

#### 阶段 6 · 高级特性（0→1 第 11-12 周）

1. **指标版本化**：多版本并存
2. **指标权限**：行级 + 列级权限
3. **指标 A/B 测试**：新老指标并行
4. **指标异常检测**：自动告警 + 归因

### 4.2 关键技术点

#### 4.2.1 指标元数据 Schema

```yaml
# metric_def.yaml
metric:
  id: "metric_001"
  name: "近7日_PC端_订单金额_会员"
  display_name: "近 7 日 PC 端会员订单金额"
  type: "derived"  # atomic / derived / composite
  oscar:
    object: "会员"           # O
    modifier: "PC端"         # S
    process: "支付"          # C
    period: "近7日"          # A
    raw: "订单金额"          # R
  formula:
    sql: |
      SELECT SUM(order.payment_amount) AS metric_value
      FROM dwd.dwd_orders order
      JOIN dim.dim_user user ON order.user_id = user.user_id
      WHERE order.status = 'paid'
        AND order.dt BETWEEN '${date_minus_7}' AND '${date_today}'
        AND user.user_type = '会员'
        AND order.channel = 'PC'
  data_source:
    tables: ["dwd.dwd_orders", "dim.dim_user"]
    fields: ["order.payment_amount", "order.status", "order.dt", "user.user_type", "order.channel"]
  dimensions: ["dt", "channel", "user_type", "city"]
  owner:
    business: "电商业务部"
    data: "数据中台团队"
    contact: "biz-metric-owner@example.com"
  refresh:
    frequency: "daily"
    cron: "0 1 * * *"
    sla: "T+1 09:00 前完成"
  version: "v2.3"
  created_at: "2024-01-15"
  updated_at: "2025-09-20"
  status: "active"  # active / deprecated / experimental
```

#### 4.2.2 指标物化（DWS 层）

```sql
-- DWS 层每日物化指标
INSERT OVERWRITE TABLE dws.dws_metric_daily PARTITION (dt='${biz_date}')
SELECT
    '${biz_date}' AS dt,
    channel,
    user_type,
    city,
    SUM(order.payment_amount) AS gmv,
    COUNT(DISTINCT order.user_id) AS paying_users,
    COUNT(DISTINCT order.order_id) AS paying_orders
FROM dwd.dwd_orders
WHERE dt BETWEEN '${date_minus_30}' AND '${biz_date}'
  AND status = 'paid'
GROUP BY channel, user_type, city;
```

#### 4.2.3 实时指标（Flink）

```java
/**
 * 实时 GMV 指标 Flink Job
 */
public class GMVStreamingJob {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        
        // 1. 消费支付事件
        DataStream<PaymentEvent> payments = env
            .addSource(new FlinkKafkaConsumer<>("dwd.payment.events", new PaymentDeserializer(), kafkaProps))
            .name("Payment Source");
        
        // 2. 按 (channel, user_type, dt) 分组聚合
        DataStream<MetricSnapshot> metrics = payments
            .keyBy(p -> Tuple.of(p.channel, p.userType))
            .window(TumblingEventTimeWindows.of(Time.days(1)))
            .reduce(new GMVAggregate(), new GMVWindowFunction())
            .name("GMV Aggregate");
        
        // 3. 写 Redis（实时查询）+ Kafka（下游）
        metrics.addSink(new RedisMetricSink()).name("Redis Sink");
        metrics.addSink(new FlinkKafkaProducer<>("dwd.metric.gmv", new MetricSerializer(), kafkaProps))
              .name("Kafka Sink");
        
        env.execute("GMV Streaming Job");
    }
}
```

#### 4.2.4 指标查询服务（FastAPI）

```python
"""
指标查询服务：统一入口
"""
from fastapi import FastAPI, Query
from typing import List, Optional

app = FastAPI()


@app.get("/api/v1/metric/{metric_name}/query")
async def query_metric(
    metric_name: str,
    dimensions: List[str] = Query(default=[]),
    filters: Optional[dict] = None,
    period: str = Query(default="last_7_days")
):
    # 1. 查指标元数据
    metric = metric_registry.get(metric_name)
    if not metric:
        raise HTTPException(404, f"Metric {metric_name} not found")
    
    # 2. 校验维度与过滤器
    validate_dimensions(dimensions, metric)
    validate_filters(filters, metric)
    
    # 3. 翻译为 SQL
    sql = metric_to_sql(metric, dimensions, filters, period)
    
    # 4. 执行查询
    result = execute_sql(sql, metric["data_source"])
    
    # 5. 返回结果
    return {
        "metric": metric_name,
        "definition": metric["display_name"],
        "result": result,
        "sot_link": f"/api/v1/metric/{metric_name}"
    }
```

#### 4.2.5 指标血缘

```sql
-- 指标血缘：从指标到表到 ETL
CREATE TABLE metric_lineage (
    metric_id STRING,
    metric_name STRING,
    upstream_table STRING,
    upstream_field STRING,
    etl_job STRING,
    etl_owner STRING,
    dependency_level INT  -- 1=直接依赖, 2=间接依赖
);
```

#### 4.2.6 指标权限

```yaml
# 指标行级权限示例
metric:
  name: "GMV"
  row_level_security:
    rules:
      - role: "财务"
        condition: "city IN ('北京', '上海', '广州', '深圳')"
      - role: "销售"
        condition: "region = '${user.region}'"
      - role: "管理层"
        condition: "TRUE"  # 无限制
  column_level_security:
    rules:
      - role: "客服"
        hidden_fields: ["payment_amount", "user_phone"]
```

### 4.3 工具链与平台（含 2024-2025 新工具）

#### 4.3.1 阿里 OneData / DataPhin

- **DataPhin**：阿里云数据中台，集成 OSCAR 指标法
- **Quick BI**：阿里云 BI，内置 OneMetric
- **OneService**：指标查询 API

#### 4.3.2 字节火山引擎指标平台

- **DataFinder**：火山引擎指标平台
- **指标树**：业务可理解的指标分类

#### 4.3.3 美团指标平台

- **指标平台 + 指标树**：业务域 × 原子指标双维分类
- **WWM（Wide Width Model）**：宽表建模 + 指标平台

#### 4.3.4 开源 Semantic Layer（2023-2025 主流）

| 产品 | 发布时间 | 特点 |
| --- | --- | --- |
| **dbt Semantic Layer** | 2023 GA | dbt 官方，MetricFlow 引擎 |
| **Cube** | 2017 开源 | JS / TS，REST API，MetricQL |
| **Airbnb Minerva** | 开源 | 大规模指标平台 |
| **Cube Cloud** | 2020 | Cube 商业版 |
| **MetricFlow** | 2022 开源 | dbt 旗下，Python |
| **LookML** | 2012 推出 | Looker 内置 |
| **Preset / Apache Superset** | 开源 | BI + 部分语义层 |
| **Lightdash** | 开源 | LookML 风格 + dbt 集成 |
| **AtScale** | 商业 | 企业级 Semantic Layer |
| **Sisense** | 商业 | AI 增强 BI |
| **Mode** | 商业 | Notebook + 指标层 |

#### 4.3.5 云厂商 AI 原生指标（2024-2025）

| 厂商 | 产品 | 发布时间 | 特点 |
| --- | --- | --- | --- |
| **Snowflake** | **Cortex Analyst** | 2024 GA | 自然语言 → SQL，基于指标语义层 |
| **Databricks** | **Genie** | 2024 GA | 自然语言 → SQL + 图表，Unity Catalog 集成 |
| **Microsoft** | **Fabric Copilot** | 2024 | 自然语言 + Power BI |
| **Google** | **Gemini in Looker** | 2024 GA | 自然语言查询 |
| **AWS** | **Amazon Q in QuickSight** | 2024 GA | 自然语言 + 异常归因 |
| **ThoughtSpot** | **Sage** | 2023 | 自然语言搜索式 BI |
| **AI21** | **Maestro** | 2024 | LLM 增强 BI |
| **Palantir** | **Foundry AIP** | 2024 | Ontology + 自然语言 |

#### 4.3.6 开源工具

- **dbt + MetricFlow**：开源 Semantic Layer
- **Cube.js**：开源 Semantic Layer + 实时分析
- **Apache Superset**：开源 BI，部分语义层
- **Metabase**：开源 BI
- **Lightdash**：开源 BI + 指标层
- **Preset**：Superset 商业版
- **Dagster + dbt**：数据编排 + 指标开发

#### 4.3.7 大数据查询引擎

- **Apache Hive / Spark SQL**：离线数仓
- **Presto / Trino**：联邦查询
- **ClickHouse**：OLAP 实时查询
- **Apache Doris**：实时 OLAP
- **Apache Druid**：亚秒级 OLAP
- **StarRocks**：高性能 OLAP
- **DuckDB**：嵌入式 OLAP

### 4.4 代码 / 示例

#### 4.4.1 dbt Semantic Layer 指标定义（YAML）

```yaml
# models/metrics/metrics.yml
version: 2

models:
  - name: orders
    description: "订单事实表"

metrics:
  - name: gmv_7d
    description: "近 7 日 GMV"
    type: simple
    type_params:
      measure: order_payment_amount
    filter: |
      {{ Dimension('order__status') }} = 'paid'
    agg_time_dimension: order_dt
    expr: "SUM(order_payment_amount)"
    window: 7 days
    
  - name: gmv_7d_pc
    description: "近 7 日 PC 端 GMV"
    type: simple
    type_params:
      measure: order_payment_amount
    filter: |
      {{ Dimension('order__status') }} = 'paid' AND
      {{ Dimension('order__channel') }} = 'PC'
    agg_time_dimension: order_dt
    
  - name: conversion_rate_7d
    description: "近 7 日转化率"
    type: ratio
    type_params:
      numerator: first_purchase_users_7d
      denominator: register_users_7d
```

#### 4.4.2 Cube 指标定义（JavaScript）

```javascript
// schema/Orders.js
cube(`Orders`, {
  sql: `SELECT * FROM dwd.orders`,
  
  measures: {
    // 原子指标
    paymentAmount: {
      sql: `payment_amount`,
      type: `sum`,
      title: "订单金额"
    },
    
    payingUsers: {
      sql: `user_id`,
      type: `countDistinct`,
      title: "支付用户数"
    },
    
    payingOrders: {
      sql: `order_id`,
      type: `countDistinct`,
      title: "支付订单数"
    },
    
    // 派生指标
    gmv7d: {
      sql: `${Orders.paymentAmount}`,
      type: `sum`,
      title: "近 7 日 GMV",
      filters: [
        { sql: `${CUBE}.status = 'paid'` }
      ]
    },
    
    // 复合指标
    arpu7d: {
      sql: `${Orders.paymentAmount} / ${Orders.payingUsers}`,
      type: `number`,
      title: "ARPU"
    }
  },
  
  dimensions: {
    channel: {
      sql: `channel`,
      type: `string`,
      title: "渠道"
    },
    userType: {
      sql: `user_type`,
      type: `string`,
      title: "用户类型"
    }
  }
});
```

#### 4.4.3 自然语言查询（Snowflake Cortex Analyst）

```python
"""
用 Cortex Analyst 做自然语言查询
"""
import snowflake.cortex as cortex
from snowflake.connector import connect

conn = connect(...)

# 1. 注册指标语义模型（YAML）
yaml_model = """
name: gm_analytics
description: GMV & 用户分析

tables:
  - name: orders
    measures:
      - name: gmv
        sql: "SUM(payment_amount)"
        description: "GMV"
    dimensions:
      - name: channel
        sql: "channel"
      - name: user_type
        sql: "user_type"
    time_dimensions:
      - name: order_dt
        sql: "order_dt"
"""

# 2. 自然语言查询
question = "过去 7 天 PC 端新用户的 GMV 是多少？"
sql = cortex.Analyst.generate_sql(
    semantic_model=yaml_model,
    question=question,
    account="...",
    user="..."
)
print(sql)

# 3. 执行
result = conn.cursor().execute(sql).fetchall()
print(result)
```

#### 4.4.4 指标异常检测（Prophet + LLM）

```python
"""
指标异常自动检测 + 自然语言解释
"""
from prophet import Prophet
import openai


def detect_and_explain(metric_name, history_df):
    # 1. Prophet 异常检测
    model = Prophet(yearly_seasonality=True, weekly_seasonality=True)
    model.fit(history_df)
    future = model.make_future_dataframe(periods=7)
    forecast = model.predict(future)
    
    # 2. 判定异常
    anomalies = []
    for i, row in history_df.iterrows():
        f = forecast.iloc[i]
        if row["y"] > f["yhat_upper"] or row["y"] < f["yhat_lower"]:
            anomalies.append({
                "dt": row["ds"],
                "actual": row["y"],
                "expected": f["yhat"],
                "deviation": abs(row["y"] - f["yhat"]) / f["yhat"]
            })
    
    # 3. LLM 解释
    if anomalies:
        prompt = f"""
你是数据分析专家。指标 {metric_name} 在以下日期出现异常：

{anomalies}

请分析可能的业务原因（如促销、季节性、系统故障等），并给出建议。
"""
        resp = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        explanation = resp.choices[0].message.content
    else:
        explanation = "指标运行正常，未检测到异常。"
    
    return {
        "anomalies": anomalies,
        "explanation": explanation
    }
```

#### 4.4.5 指标平台（FastAPI 简化版）

```python
"""
指标平台核心 API
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Metric Platform")


class MetricDefinition(BaseModel):
    name: str
    type: str  # atomic / derived / composite
    oscar: dict
    formula_sql: str
    data_source: List[str]
    dimensions: List[str]
    owner: dict
    refresh: dict


class MetricQueryRequest(BaseModel):
    metric_name: str
    dimensions: List[str] = []
    filters: dict = {}
    period: str = "last_7_days"


metrics_db = {}


@app.post("/api/v1/metric")
async def create_metric(metric: MetricDefinition):
    """注册新指标"""
    if metric.name in metrics_db:
        raise HTTPException(409, "Metric already exists")
    metrics_db[metric.name] = metric.dict()
    return {"status": "created", "name": metric.name}


@app.post("/api/v1/metric/query")
async def query_metric(req: MetricQueryRequest):
    """查询指标"""
    metric = metrics_db.get(req.metric_name)
    if not metric:
        raise HTTPException(404, "Metric not found")
    
    # 1. 翻译为 SQL
    sql = metric_to_sql(metric, req.dimensions, req.filters, req.period)
    
    # 2. 执行查询
    result = execute_query(sql)
    
    return {
        "metric": req.metric_name,
        "definition": metric["oscar"],
        "sql": sql,
        "result": result
    }


@app.get("/api/v1/metric/search")
async def search_metrics(q: str):
    """指标搜索（自然语言）"""
    # LLM 辅助搜索
    candidates = llm_search(q, list(metrics_db.keys()))
    return candidates


@app.get("/api/v1/metric/{name}/lineage")
async def get_lineage(name: str):
    """指标血缘"""
    metric = metrics_db.get(name)
    if not metric:
        raise HTTPException(404, "Metric not found")
    return trace_lineage(metric)
```

---
