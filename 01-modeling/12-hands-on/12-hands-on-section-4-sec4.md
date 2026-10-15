> 本文件是 **12-hands-on.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](12-hands-on.md)。

## 4. 工程实现

### 4.1 DataWorks 数仓建模实战（电商案例）

```sql
-- ODS 层（贴源层）
CREATE TABLE ods_trade_order (
    order_id           STRING  COMMENT '订单 ID',
    user_id            STRING  COMMENT '用户 ID',
    merchant_id        STRING  COMMENT '商家 ID',
    order_amount       DECIMAL(18,2) COMMENT '订单金额',
    order_status       STRING  COMMENT '订单状态',
    created_at         TIMESTAMP COMMENT '创建时间',
    updated_at         TIMESTAMP COMMENT '更新时间',
    dt                 STRING  COMMENT '分区日期'
) PARTITIONED BY (dt STRING);

-- DWD 层（明细层）
CREATE TABLE dwd_trade_order_created AS
SELECT
    order_id,
    user_id,
    merchant_id,
    order_amount,
    order_status,
    -- 维度关联
    dim_user.user_key,
    dim_merchant.merchant_key,
    -- 时间维度
    dim_date.date_key,
    -- 度量
    order_amount                         AS gmv,
    1                                    AS order_count
FROM ods_trade_order
LEFT JOIN dim_user ON ods_trade_order.user_id = dim_user.user_id
LEFT JOIN dim_merchant ON ods_trade_order.merchant_id = dim_merchant.merchant_id
LEFT JOIN dim_date ON TO_CHAR(ods_trade_order.created_at, 'yyyyMMdd') = dim_date.date_key
WHERE ods_trade_order.dt = '${biz_date}';

-- DWS 层（汇总层）
CREATE TABLE dws_trade_user_order_1d AS
SELECT
    user_key,
    date_key,
    SUM(order_amount)                    AS gmv_1d,
    COUNT(DISTINCT order_id)             AS order_count_1d,
    COUNT(DISTINCT merchant_id)          AS merchant_count_1d
FROM dwd_trade_order_created
WHERE dt = '${biz_date}'
GROUP BY user_key, date_key;

-- ADS 层（应用层，指标平台直接消费）
CREATE TABLE ads_gmv_daily AS
SELECT
    date_key,
    SUM(gmv_1d)                          AS gmv,
    SUM(order_count_1d)                  AS order_count,
    COUNT(DISTINCT user_key)             AS active_user_count
FROM dws_trade_user_order_1d
WHERE dt >= '${biz_date - 30}'
GROUP BY date_key;
```

### 4.2 MaxCompute + Hologres 实时数仓

```sql
-- Hologres 创建实时宽表（用于实时 OLAP）
CREATE TABLE holo_user_profile_realtime (
    user_key            BIGINT PRIMARY KEY,
    user_id             VARCHAR(64),
    -- 用户基本属性
    user_name           VARCHAR(128),
    register_date       DATE,
    -- 实时行为（来自 Kafka）
    last_30d_pv         BIGINT,
    last_30d_order_cnt  BIGINT,
    last_30d_gmv        DECIMAL(18,2),
    -- 实时风控标签
    risk_score          DECIMAL(5,2),
    fraud_label         VARCHAR(32),
    -- 维度
    city_key            INT,
    channel_key         INT,
    -- 时间
    update_time         TIMESTAMP
);

-- Flink 实时 ETL（写入 Hologres）
INSERT INTO holo_user_profile_realtime
SELECT
    user_key,
    user_id,
    user_name,
    register_date,
    -- 30 天滚动窗口
    SUM(CASE WHEN event_type = 'pv' THEN 1 ELSE 0 END) OVER (
        PARTITION BY user_id ORDER BY event_time
        RANGE BETWEEN INTERVAL '30' DAY PRECEDING AND CURRENT ROW
    ) AS last_30d_pv,
    SUM(order_amount) OVER (
        PARTITION BY user_id ORDER BY event_time
        RANGE BETWEEN INTERVAL '30' DAY PRECEDING AND CURRENT ROW
    ) AS last_30d_gmv,
    risk_score,
    fraud_label,
    -- 当前维度
    city_key,
    channel_key,
    NOW() AS update_time
FROM kafka_user_events;
```

### 4.3 Iceberg / Hudi / Paimon 湖仓建模

```sql
-- Iceberg 表创建（Paimon 同理）
CREATE TABLE iceberg.ads.user_features (
    user_id         STRING,
    feature_name    STRING,
    feature_value   DOUBLE,
    -- 维度
    dt              DATE,
    -- 元数据
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP
) PARTITIONED BY (dt)
STORED BY ICEBERG
TBLPROPERTIES (
    'write.format.default' = 'parquet',
    'write.target-file-size-bytes' = '134217728',  -- 128 MB
    'write.distribution-mode' = 'hash',
    -- Iceberg V2 元数据
    'format-version' = '2'
);

-- Hudi 表创建
CREATE TABLE hudi.ods.user_events (
    event_id        STRING,
    user_id         STRING,
    event_type      STRING,
    event_time      TIMESTAMP,
    payload         STRING
) USING HUDI
OPTIONS (
    'type' = 'mor',  -- Merge on Read
    'primaryKey' = 'event_id',
    'precombineField' = 'event_time',
    'hoodie.enable.data.skipping' = 'true'
)
PARTITIONED BY (dt);

-- Flink 写入 Hudi
INSERT INTO hudi.ods.user_events
SELECT
    event_id,
    user_id,
    event_type,
    event_time,
    payload
FROM kafka.user_events_raw;
```

### 4.4 OneData + 指标平台实战

```yaml
# 指标定义（OSCAR 模型）
- metric_id: gmv_1d
  metric_name: 当日 GMV
  metric_type: 派生指标
  atomic_metric_id: order_amount_sum
  business_modifier: [all]
  time_period: 1d
  dimension: [user_id, merchant_id, city]
  formula: SUM(order_amount)
  owner:
    business: cfo@company.com
    data: data-team@company.com
  sla:
    freshness: 1h
    quality:
      completeness: 0.99
      accuracy: 0.99

- metric_id: order_conversion_rate
  metric_name: 下单转化率
  metric_type: 复合指标
  formula: order_count / pv_count
  source_metrics:
    - order_count
    - pv_count
  dimension: [user_id, channel_id]
  owner:
    business: cmo@company.com
    data: data-team@company.com
```

```sql
-- 指标平台查询（自动生成 SQL）
-- 用户查询："最近 7 天各城市的 GMV"
SELECT
    city_name,
    SUM(gmv_1d) AS gmv
FROM ads_gmv_city_1d
WHERE dt >= CURRENT_DATE - INTERVAL '7' DAY
GROUP BY city_name
ORDER BY gmv DESC
LIMIT 100;
```

---
