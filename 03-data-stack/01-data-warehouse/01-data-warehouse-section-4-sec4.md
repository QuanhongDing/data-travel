> 本文件是 **01-data-warehouse.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](01-data-warehouse.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务调研与建模设计（4-6 周）**

- 梳理业务过程（Process）：每个业务线有哪些核心事件？
- 选定粒度（Granularity）：最细粒度是什么（如订单行 item）？
- 确定维度（Dimension）：客户、产品、时间、地区...
- 确定度量（Measure）：金额、数量、时长...
- 输出 ER 图 + 维度模型（星型图）。

**Step 2：数据源接入（2-4 周）**

- 业务库：CDC（Debezium / Flink CDC）。
- 日志：Flume / Filebeat / Vector → Kafka。
- 第三方 API：DataX / Airflow 定时抽取。
- 文件：OSS / S3 增量同步（OSS 事件 / SQS）。

**Step 3：ODS 层建设（2-3 周）**

- 贴源存储，几乎不转换。
- 表命名：`ods_<source_system>_<table>`。
- 增量策略：binlog 全量 + 增量 / 分区表 + 滚动。

**Step 4：DWD 层建设（4-8 周）**

- 维度建模，建立事实表 + 维度表。
- 数据清洗：去重、空值处理、类型转换。
- 维度填充（维表查找 + 缓慢变化维处理）。
- 表命名：`dwd_<domain>_<process>`。

**Step 5：DWS 层建设（4-6 周）**

- 按主题轻度聚合。
- 1 天 / 1 周 / 1 月的公共汇总。
- 表命名：`dws_<domain>_<time_window>_<summary>`。

**Step 6：ADS 层建设（按需迭代）**

- 面向具体应用：报表 / 标签 / 推荐 / 风控。
- 通常宽表 + Cube。

**Step 7：指标治理 + 数据质量**

- 指标统一（OneMetric）。
- 数据质量监控（Great Expectations / Datafold / 自研）。
- 血缘追踪（Apache Atlas / DataHub / OpenLineage）。

### 4.2 关键技术点

**1. 维度建模（核心）**

```sql
-- 订单事实表（DWD）
CREATE TABLE dwd_order_order (
  order_id        BIGINT,         -- 订单号
  user_id         BIGINT,         -- 用户 ID（外键）
  product_id      BIGINT,         -- 商品 ID（外键）
  order_time      TIMESTAMP,      -- 下单时间
  pay_time        TIMESTAMP,      -- 支付时间
  order_amount    DECIMAL(18,2),  -- 订单金额
  pay_amount      DECIMAL(18,2),  -- 实付金额
  coupon_amount   DECIMAL(18,2),  -- 优惠金额
  order_status    STRING,         -- 订单状态
  -- ... 度量字段
  PRIMARY KEY (order_id, order_time)  -- 注意：复合主键，包含时间用于分区
) PARTITIONED BY (dt DATE)
STORED AS PARQUET;
```

**2. SCD Type 2 实现（缓慢变化维）**

```sql
-- 客户维度表
CREATE TABLE dim_user (
  user_id        BIGINT,
  user_name      STRING,
  age            INT,
  city           STRING,
  vip_level      STRING,
  -- SCD Type 2 字段
  effective_dt   DATE,    -- 生效时间
  expire_dt      DATE,    -- 失效时间（9999-12-31 表示当前有效）
  is_current     BOOLEAN  -- 是否当前版本
) STORED AS PARQUET;

-- 插入新版本
INSERT INTO dim_user
SELECT user_id, user_name, age, city, vip_level,
       current_date AS effective_dt,
       DATE '9999-12-31' AS expire_dt,
       TRUE AS is_current
FROM ods_user
WHERE dt = '${biz_date}';
```

**3. 增量 MERGE（UPSERT）**

```sql
-- Iceberg / Hudi / Delta Lake 通用语法
MERGE INTO dwd_order_order tgt
USING (SELECT * FROM ods_order WHERE dt = '${biz_date}') src
ON tgt.order_id = src.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;
```

**4. 数据质量监控**

```python
# Great Expectations 示例
import great_expectations as gx

context = gx.get_context()
batch = context.get_batch(
    {"datasource_name": "iceberg", "table_name": "dwd_order_order"}
)

# 校验规则
batch.expect_column_values_to_not_be_null("order_id")
batch.expect_column_values_to_be_unique("order_id")
batch.expect_column_values_to_be_between("order_amount", 0, 1000000)
batch.expect_column_value_lengths_to_be_between("order_status", 1, 20)

validation_result = batch.validate()
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**离线数仓工具链**：

| 组件 | 主流工具 | 2024-2025 新趋势 |
| --- | --- | --- |
| 存储 | Hive / MaxCompute / Greenplum | Iceberg / Hudi / Paimon 湖仓 |
| 计算 | Spark SQL / HiveQL / Tez | Spark 4.0、DuckDB 内嵌 |
| 调度 | Airflow / DolphinScheduler / DataWorks | Argo Workflows（K8s 原生） |
| 元数据 | Apache Atlas / DataHub / OpenMetadata | Unity Catalog（Databricks）、Snowflake Open Catalog |
| 数据质量 | Great Expectations / Datafold / Monte Carlo | Soda Core 3.x、Snowflake DMF |
| 血缘 | OpenLineage / Apache Atlas | DataHub GMS、Atlan |

**实时数仓工具链**：

| 组件 | 主流工具 | 2024-2025 新趋势 |
| --- | --- | --- |
| 消息队列 | Kafka / Pulsar / RocketMQ | AutoMQ（云原生）、Confluent Warpstream |
| 流计算 | Flink / Spark Streaming | Flink 2.0、Decodable（流批一体 SaaS） |
| 流式存储 | Kafka / Pravega | Apache Fluss（原 Flink Table Store） |
| 表格式 | Iceberg / Hudi / Delta | Paimon 1.0（流式原生） |
| 实时 OLAP | ClickHouse / Doris / StarRocks | SelectDB Cloud、StarRocks 3.x |

**云原生数仓（2024-2025）**：

- **Snowflake**：存算分离、Cloud Services 层、Snowpark（Python / Java UDF）、Iceberg Tables、Streamlit 集成。
- **BigQuery**：Serverless、Omni（跨云）、Vector Search、Embedded BI。
- **Redshift**：Serverless、RA3 存算分离、Zero-ETL 集成（与 RDS / Aurora）。
- **Databricks**：Lakehouse Platform、Unity Catalog、Databricks SQL、MLflow 集成。
- **阿里云 MaxCompute 2.0**：Hologres 实时数仓、DataWorks 一站式开发、OneData 体系。
- **腾讯云 TCHouse**：ClickHouse 增强版。
- **华为云 DWS**：GaussDB(DWS) 实时数仓。

**2024-2025 新工具亮点**：

- **Apache Paimon 1.0**（2024 毕业）：Flink 生态原生的流式表格式，CDC + 流式摄取一体。
- **Apache Doris 2.1 / 3.0**（2024-2025）：存算分离架构、Lightning Hash Join、向量化 3.0。
- **StarRocks 3.x**：存算分离 Cloud Native、Materialized View 增强、Iceberg 外表查询。
- **DuckDB 1.x**：内嵌式 OLAP（类似 SQLite），Python/R 直接集成，AI 时代新宠。
- **ClickHouse 24.x**：SharedMergeTree 分布式增强、Lightweight updates、Kafka 表引擎增强。
- **SelectDB Cloud**：云原生实时数仓，对标 Snowflake + ClickHouse。

### 4.4 代码 / 示例

**示例 1：基于 Flink + Iceberg 搭建实时数仓**

```java
// Flink CDC 写入 Iceberg（实时 DWD）
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(60000); // 1 分钟 Checkpoint

// MySQL CDC 源
MySqlSource<String> source = MySqlSource.<String>builder()
    .hostname("mysql-host")
    .port(3306)
    .databaseList("orders")
    .tableList("orders.order_info")
    .username("cdc_user")
    .password("cdc_pass")
    .deserializer(new JsonDebeziumDeserializationSchema())
    .build();

DataStream<String> stream = env.fromSource(
    source, WatermarkStrategy.noWatermarks(), "MySQL CDC"
);

// 解析 + 转换
DataStream<RowData> parsed = stream
    .map(json -> parseOrder(json))
    .returns(Types.ROW(/*...*/));

// 写入 Iceberg（Hive Catalog）
TableLoader tableLoader = TableLoader.fromHadoopTable(
    "hdfs:///warehouse/iceberg/dwd_order_order"
);

FlinkSink.forRowData(parsed)
    .tableLoader(tableLoader)
    .overwrite(false)
    .append()
    .build();

env.execute("Realtime DWD Order");
```

**示例 2：DuckDB 内嵌分析（2024 新工具）**

```python
import duckdb

# 直接读取 Parquet 文件进行分析（无需数据库）
result = duckdb.query("""
    SELECT
        region,
        SUM(order_amount) AS gmv,
        COUNT(DISTINCT user_id) AS users
    FROM read_parquet('s3://datalake/dwd_order_order/dt=2025-01-01/*.parquet')
    WHERE order_status = 'paid'
    GROUP BY region
    ORDER BY gmv DESC
""").to_df()

print(result)
```

**示例 3：指标语义层（MetricFlow）**

```yaml
# metrics/orders.yml
metric:
  name: gmv
  type: simple
  type_params:
    measure: total_order_amount
  description: 商品交易总额
  filter: |
    {{ Dimension('order__is_paid') }} = 'true'

metric:
  name: paid_orders
  type: simple
  type_params:
    measure: count_orders
  filter: |
    {{ Dimension('order__is_paid') }} = 'true'

derived_metric:
  name: arpu  # 单用户平均收入
  type: ratio
  type_params:
    numerator: gmv
    denominator: paid_users
```

```python
# 自然语言查询 + 指标层
from metricflow import MetricFlowClient
client = MetricFlowClient()

# 查询 GMV
df = client.query(
    metrics=["gmv"],
    group_by=["region"],
    start_time="2025-01-01",
    end_time="2025-01-31"
)
```

---
