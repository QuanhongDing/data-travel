> 本文件是 **10-metric-platform.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](10-metric-platform.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：指标盘点**

- 盘点企业所有指标（核心 + 长尾）。
- 分类（GMV / DAU / 用户画像）。
- 输出：**指标清单 + 优先级**。

**Step 2：指标建模**

- 设计原子指标（基础度量）。
- 设计修饰词（限定条件）。
- 设计维度（观察角度）。
- 输出：**指标定义模型**。

**Step 3：平台选型**

- 评估 dbt Semantic Layer / Cube / 自研。
- 评估成本、生态、团队能力。
- 输出：**技术选型 ADR**。

**Step 4：指标定义**

- 在平台中录入指标定义（YAML / JavaScript）。
- 配置 Owner、口径、SLA。
- 输出：**统一指标库**。

**Step 5：指标计算**

- 配置底层表（ClickHouse / Doris / Snowflake）。
- 配置预计算策略。
- 输出：**可计算的指标**。

**Step 6：指标服务化**

- 暴露 REST / GraphQL API。
- 配置鉴权、配额。
- 输出：**指标 API**。

**Step 7：指标血缘**

- 集成数据目录（DataHub）。
- 配置指标 → 表 → 字段血缘。
- 输出：**完整指标血缘**。

**Step 8：AI 集成**

- 配置 Text-to-Metric（Cortex Analyst 模式）。
- 注册到 Agent Tool。
- 输出：**AI 原生指标平台**。

**Step 9：上线与监控**

- 灰度发布。
- 监控（QPS / 延迟 / 准确率 / 成本）。
- 输出：**生产级指标平台**。

### 4.2 关键技术点

1. **指标建模**：原子化 + 修饰词 + 维度。
2. **指标计算**：OLAP 引擎（ClickHouse / Doris / StarRocks）。
3. **指标服务**：REST / GraphQL API。
4. **指标血缘**：DataHub / OpenMetadata 集成。
5. **Text-to-Metric**：LLM + 指标 schema。
6. **指标治理**：Owner + 评审 + SLA + 版本。
7. **缓存策略**：高频指标缓存到 Redis。
8. **AI 集成**：Function Calling / MCP。
9. **权限**：行级 / 列级 / 指标级权限。
10. **可观测**：QPS / 延迟 / 命中率 / 准确率。

### 4.3 工具链与平台

**开源指标平台**：

- **dbt Semantic Layer + MetricFlow**（开源）—— dbt 生态指标平台。
- **Cube.js**（开源）—— 指标 API 平台。
- **Airbnb Minerva**（开源）—— 指标定义 + 查询。
- **OSCAR**（开源）—— 字节开源指标平台。

**云厂商指标平台**：

- **Snowflake Cortex Analyst**（商业）—— 自然语言查询指标。
- **Databricks Genie**（商业）—— 自然语言查询数据。
- **AWS QuickSight Q**（商业）—— 自然语言 BI。
- **Google Cloud Looker**（商业）—— LookML 语义层。

**商业指标平台**：

- **Transform**（商业）—— 现代指标平台。
- **Supermetrics**（商业）—— 营销指标。
- **Alation Metric Studio**（商业）—— 数据目录 + 指标。

**国内指标平台**：

- **阿里 DataWorks 指标平台**（商业）—— OneMetric。
- **字节 DataFinder 指标平台**（商业）—— OSCAR。
- **美团指标平台**（自研）。
- **腾讯 WeData 指标平台**（商业）。
- **网易严选指标平台**（自研）。
- **Quick BI 智能问答**（阿里商业）—— 自然语言查询。

**OLAP 引擎**：

- **ClickHouse**（开源）—— 高性能 OLAP。
- **Apache Doris**（国产开源）—— 实时 OLAP。
- **StarRocks**（国产开源）—— 实时 OLAP。
- **Snowflake**（商业）—— 云数仓。
- **BigQuery**（Google 商业）—— 云数仓。
- **Redshift**（AWS 商业）—— 云数仓。

### 4.4 代码 / 示例

**示例 1：dbt Semantic Layer 指标定义**

```yaml
# dbt_project/models/metrics/gmv.yml
version: 2

models:
  - name: orders
    columns:
      - name: order_id
        tests:
          - unique
          - not_null
      - name: user_id
      - name: amount
      - name: is_new_user
        tests:
          - accepted_values:
              values: ['true', 'false']
      - name: order_date

metrics:
  - name: gmv
    label: GMV (Gross Merchandise Value)
    type: simple
    type_params:
      measure: order_amount
    filter: |
      {{ Dimension('order__status') }} = 'paid'
    agg: sum
    agg_time_dimension: order_date

  - name: new_user_gmv
    label: New User GMV
    type: derived
    type_params:
      expr: gmv
      metrics:
        - name: gmv
      filter: |
        {{ Dimension('order__is_new_user') }} = 'true'

  - name: beijing_new_user_gmv
    label: Beijing New User GMV
    type: derived
    type_params:
      expr: new_user_gmv
      metrics:
        - name: new_user_gmv
      filter: |
        {{ Dimension('user__city') }} = 'Beijing'
```

**示例 2：Cube.js 指标定义**

```javascript
// cube/schema/Orders.js
cube(`Orders`, {
  sql: `SELECT * FROM public.orders`,

  measures: {
    gmv: {
      sql: `amount`,
      type: `sum`,
      title: `GMV`,
      filters: [{ sql: `${CUBE}.status = 'paid'` }]
    },

    newUserGmv: {
      sql: `amount`,
      type: `sum`,
      title: `New User GMV`,
      filters: [
        { sql: `${CUBE}.status = 'paid'` },
        { sql: `${CUBE}.is_new_user = 'true'` }
      ]
    },

    orderCount: {
      sql: `order_id`,
      type: `count`,
      title: `Order Count`
    }
  },

  dimensions: {
    city: {
      sql: `city`,
      type: `string`
    },
    userSegment: {
      sql: `user_segment`,
      type: `string`
    },
    orderDate: {
      sql: `order_date`,
      type: `time`
    }
  }
});

// cube/schema/Users.js
cube(`Users`, {
  sql: `SELECT * FROM public.users`,
  joins: {
    Orders: {
      relationship: `has_many`,
      sql: `${CUBE}.id = ${Orders}.user_id`
    }
  },
  dimensions: {
    city: { sql: `city`, type: `string` },
    isNewUser: { sql: `is_new_user`, type: `boolean` }
  }
});
```

**示例 3：指标 API（FastAPI + ClickHouse）**

```python
from fastapi import FastAPI, Query
from clickhouse_connect import get_client

app = FastAPI()
client = get_client(host='clickhouse', port=8123)

@app.get("/api/v1/metric/{metric_name}")
async def get_metric(
    metric_name: str,
    dim: list[str] = Query(default=[]),
    time_range: str = Query(..., regex="^(last_7d|last_30d|last_quarter|last_year)$"),
    filters: dict = Query(default={})
):
    # 1. 指标定义查询
    metric = get_metric_definition(metric_name)

    # 2. 构建 SQL
    sql = build_sql(metric, dim, time_range, filters)

    # 3. 执行查询
    result = client.query(sql)

    # 4. 返回
    return {
        "data": result.result_rows,
        "meta": {"metric": metric_name, "definition_id": metric.id}
    }
```

**示例 4：Snowflake Cortex Analyst 自然语言查询**

```sql
-- Snowflake Cortex Analyst 配置（语义模型）
-- semantic_model/gmv_model.yaml

name: gmv_model
description: GMV 相关指标

tables:
  - name: orders
    description: 订单表
    base_table: ecommerce.orders
    dimensions:
      - name: order_date
        expr: order_date
        type: time
      - name: city
        expr: city
        type: categorical
    measures:
      - name: gmv
        expr: SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)
        agg: sum
      - name: new_user_gmv
        expr: SUM(CASE WHEN status = 'paid' AND is_new_user = true THEN amount ELSE 0 END)
        agg: sum

verified_queries:
  - name: beijing_new_user_gmv_q3
    question: "上个季度北京新用户 GMV"
    sql: |
      SELECT SUM(CASE WHEN status = 'paid' AND is_new_user = true THEN amount ELSE 0 END)
      FROM ecommerce.orders
      WHERE city = 'Beijing' AND order_date >= '2025-07-01'
```

```python
# Snowflake Cortex Analyst API 调用
from snowflake.snowpark import Session

session = Session.builder.configs(connection_params).create()

# 自然语言查询
result = session.sql("""
SELECT SNOWFLAKE.CORTEX.COMPLETE(
  'mistral-large',
  CONCAT('基于以下数据回答：', '上个季度北京新用户 GMV')
) AS answer
""").collect()

print(result)
```

---
