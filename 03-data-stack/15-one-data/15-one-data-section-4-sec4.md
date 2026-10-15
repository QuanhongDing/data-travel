> 本文件是 **15-one-data.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](15-one-data.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：OneModel 建模（4-8 周）**

- 业务调研。
- 数据分层（ODS / DWD / DWS / ADS）。
- 公共层抽取。

**Step 2：OneID 治理（4-8 周）**

- 强 ID 收集（手机、身份证、UID）。
- 弱 ID 关联（设备、Cookie、邮箱）。
- ID-Mapping 图计算。

**Step 3：指标平台建设（4-8 周）**

- 指标梳理。
- 指标定义。
- 指标服务化。

**Step 4：OneService 数据服务（2-4 周）**

- API 化数据服务。
- Quick BI / 自助分析。

**Step 5：数据治理（持续）**

- 血缘追踪。
- 数据质量。
- 数据安全。

**Step 6：AI 集成（按需）**

- AI 驱动指标生成。
- 自治数据中台。

### 4.2 关键技术点

**1. OneModel 数据分层**

```sql
-- 阿里 OneModel 标准分层
-- 1. ODS：贴源层
-- 2. DWD：明细层（OneID 贯穿）
-- 3. DWS：汇总层（主题汇总）
-- 4. ADS：应用层（报表 / 标签 / 推荐）
-- 5. DIM：公共维度层（用户 / 商品 / 地区）
```

**2. OneID 图计算**

```python
# 阿里 ID-Mapping（基于图计算）
# 输入：用户多端 ID
# 输出：统一 OneID

# 工具：阿里自研 Graph（图计算引擎）
# 流程：
# 1. 收集所有 ID（手机 / 设备 / UID / 邮箱）
# 2. 构建图（同设备 ID 关联、UID 关联）
# 3. 图连通性算法（Connected Components）
# 4. 输出 OneID（图 ID）
```

**3. 指标平台（阿里云）**

```sql
-- 阿里云指标平台
-- 指标定义 → 一次定义、多处复用

-- 1. 原子指标
INSERT INTO metric_atomic (name, formula, source, owner)
VALUES ('total_order_amount', 'SUM(amount)', 'dwd_orders', 'data-team');

-- 2. 派生指标
INSERT INTO metric_derived (name, formula, source)
VALUES ('gmv', 'total_order_amount WHERE is_paid=true', 'dwd_orders');

-- 3. 查询（自动复用指标）
SELECT * FROM metric_query('gmv', '2025-01-01', '2025-01-31');
```

**4. DataWorks 任务开发**

```python
# DataWorks Python 节点
import dataworks

def process():
    """DataWorks 节点代码"""
    df = dataworks.odps.read_table('ods_orders', dt='2025-01-15')
    
    # 清洗 + 维度填充
    dwd = df.filter('amount > 0').fillna(0)
    
    # 写入 DWD
    dataworks.odps.write_table('dwd_orders', dwd, partition='dt=2025-01-15')

process()
```

**5. 实时 OneData（Flink + Hologres）**

```java
// Flink + Hologres 实时 OneData
tEnv.executeSql("""
    CREATE TABLE kafka_orders (
      order_id BIGINT,
      user_id BIGINT,
      amount DECIMAL(18, 2),
      ts TIMESTAMP(3)
    ) WITH (
      'connector' = 'kafka',
      'topic' = 'orders',
      'format' = 'json'
    )
""");

// 实时 OneID 关联
tEnv.executeSql("""
    CREATE TABLE hologres_orders (
      order_id BIGINT,
      one_id BIGINT,
      amount DECIMAL(18, 2),
      ts TIMESTAMP(3)
    ) WITH (
      'connector' = 'hologres',
      'endpoint' = 'holo-cn-hangzhou.aliyuncs.com:80',
      'dbname' = 'shop',
      'tablename' = 'orders_realtime'
    )
""");

tEnv.executeSql("""
    INSERT INTO hologres_orders
    SELECT
      order_id,
      COALESCE(one_id_map.one_id, user_id) AS one_id,
      amount,
      ts
    FROM kafka_orders
    LEFT JOIN one_id_map FOR SYSTEM_TIME AS OF ts
    ON kafka_orders.user_id = one_id_map.uid
""");
```

**6. AI 增强指标（OneData 4.0）**

```python
# LLM 自动生成指标
import openai

def generate_metric(business_requirement):
    """LLM 从业务需求生成指标定义"""
    prompt = f"""
    请将以下业务需求转换为数据指标定义：

    业务需求：{business_requirement}

    输出格式：
    - 指标名
    - 指标类型（原子/派生）
    - 指标公式
    - 源表
    - 业务定义
    """
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

# 使用
metric = generate_metric("每月 GMV 趋势")
print(metric)
```

### 4.3 工具链与平台（2024-2025）

**阿里云数据中台工具链**：

| 工具 | 特点 |
| --- | --- |
| DataWorks | 一站式数据开发治理 |
| MaxCompute | 离线计算 |
| Hologres | 实时 OLAP |
| DataPhin | 数据治理 |
| Quick BI | 智能 BI |
| 阿里云指标平台 | 指标语义层 |
| 通义数智 | AI 增强 OneData |

**开源等价工具**：

| OneData 组件 | 开源等价 |
| --- | --- |
| OneModel | Hive + Spark SQL + Iceberg |
| OneID | 自研 + 图计算（Neo4j / GraphX） |
| OneService | Apache Airflow + DBT + MetricFlow |
| 指标平台 | MetricFlow + Cube / Apache Doris |

**AI 增强工具（2024-2025）**：

- 通义 LLM（阿里）：指标生成、自然语言查询。
- Databricks Genie：自然语言查询。
- Snowflake Cortex：AI 数据分析。

### 4.4 代码 / 示例

**示例 1：阿里 OneModel 标准分层**

```sql
-- ODS 层（贴源）
CREATE TABLE ods_trade_orders (
  order_id BIGINT,
  user_id BIGINT,
  amount DECIMAL(18, 2),
  status STRING,
  order_time TIMESTAMP,
  dt DATE
) PARTITIONED BY (dt);

-- DIM 层（公共维度）
CREATE TABLE dim_user (
  one_id BIGINT,  -- OneID
  user_id BIGINT,
  phone STRING,
  device_id STRING,
  email STRING,
  age INT,
  city STRING,
  vip_level STRING,
  effective_dt DATE,
  expire_dt DATE
) STORED AS ORC;

-- DWD 层（明细 + OneID）
CREATE TABLE dwd_trade_orders (
  order_id BIGINT,
  user_one_id BIGINT,  -- OneID 贯穿
  product_one_id BIGINT,  -- OneID 贯穿
  amount DECIMAL(18, 2),
  coupon_amount DECIMAL(18, 2),
  pay_amount DECIMAL(18, 2),
  order_time TIMESTAMP,
  dt DATE
) PARTITIONED BY (dt);

-- DWS 层（主题汇总）
CREATE TABLE dws_user_daily_trade (
  user_one_id BIGINT,
  dt DATE,
  gmv DECIMAL(18, 2),
  orders BIGINT,
  paid_orders BIGINT
) PARTITIONED BY (dt);

-- ADS 层（应用）
CREATE TABLE ads_user_rfm (
  user_one_id BIGINT,
  recency INT,  -- 最近一次消费
  frequency INT,  -- 消费频率
  monetary DECIMAL(18, 2),  -- 消费金额
  rfm_segment STRING
);
```

**示例 2：OneID 图计算（基于 Neo4j）**

```python
# OneID 基于 Neo4j 图计算
from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://neo4j:7687", auth=("neo4j", "password"))

def build_one_id_graph():
    """构建 OneID 图"""
    with driver.session() as session:
        # 1. 创建节点（每种 ID 类型）
        session.run("""
            CREATE (u:User {user_id: $user_id}),
                   (d:Device {device_id: $device_id}),
                   (p:Phone {phone: $phone})
        """)
        
        # 2. 创建关系（同设备关联）
        session.run("""
            MATCH (u:User {user_id: $user_id}), (d:Device {device_id: $device_id})
            MERGE (u)-[:LOGIN_FROM]->(d)
        """)
        
        # 3. 图连通性算法 → OneID
        result = session.run("""
            CALL algo.unionFind.stream('User', 'LOGIN_FROM', {})
            YIELD nodeId, setId
            RETURN nodeId, setId
        """)
        
        # 4. 写回 OneID
        for record in result:
            one_id = record['setId']
            user_id = record['nodeId']
            session.run(
                "MATCH (u:User {user_id: $user_id}) SET u.one_id = $one_id",
                user_id=user_id, one_id=one_id
            )

build_one_id_graph()
```

**示例 3：指标平台（基于 MetricFlow）**

```yaml
# metrics/gmv.yml
metric:
  name: gmv
  type: simple
  type_params:
    measure: total_order_amount
  description: 商品交易总额
  filter: |
    {{ Dimension('order__is_paid') }} = 'true'
  owner: data-team
  version: 1.0

derived_metric:
  name: arpu
  type: ratio
  type_params:
    numerator: gmv
    denominator: paid_users
  description: 单用户平均收入

derived_metric:
  name: conversion_rate
  type: ratio
  type_params:
    numerator: paid_orders
    denominator: total_orders
  description: 订单转化率
```

```python
# 查询指标
from metricflow import MetricFlowClient

client = MetricFlowClient()

# 查询 GMV（自动复用指标定义）
df = client.query(
    metrics=["gmv", "arpu", "conversion_rate"],
    group_by=["region"],
    start_time="2025-01-01",
    end_time="2025-01-31"
)
print(df)
```

**示例 4：AI 增强 OneData（OneData 4.0）**

```python
# 通义数智 / Databricks Genie 风格
# LLM 自然语言查询 OneData

import openai

def nl_query_to_metric(nl_query, metric_definitions):
    """自然语言查询 → 指标查询"""
    prompt = f"""
    你是一个数据分析助手。基于以下指标定义回答用户问题：

    指标定义：
    {metric_definitions}

    用户问题：{nl_query}

    请：
    1. 理解用户意图
    2. 选择相关指标
    3. 生成 SQL 查询
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

# 使用
nl_query = "2025 年 1 月华东地区的 GMV 和 ARPU 是多少？"
metric_definitions = """
- gmv: 商品交易总额（已支付订单的金额总和）
- arpu: 单用户平均收入（gmv / 付费用户数）
- region: 地区维度
"""

result = nl_query_to_metric(nl_query, metric_definitions)
print(result)
# Output: SQL 查询 + 自然语言解释
```

---
