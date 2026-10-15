> 本文件是 **02-dimensional-modeling.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](02-dimensional-modeling.md)。

## 4. 工程实现

### 4.1 落地步骤

维度建模的标准落地流程（8 步）：

1. **业务过程识别**（来自业务过程建模章）→ 产出物：业务过程清单
2. **声明粒度** → 产出物：每张事实表的一行代表什么（如"一行一订单创建事件"）
3. **识别维度** → 产出物：维度清单（通常 5-15 个）
4. **识别度量** → 产出物：度量清单（每个事实表 3-10 个度量）
5. **选择事实表类型** → 产出物：事务/周期快照/累计快照 三选一
6. **设计维度表** → 产出物：维度表 DDL（含 SCD Type、代理键、层次结构）
7. **设计事实表** → 产出物：事实表 DDL（含度量、外键、分区键）
8. **评审与发布** → 产出物：模型评审记录 + 上线 DDL

### 4.2 关键技术点

- **代理键体系**：所有维度表必须用整数型代理键，与业务键解耦；雪花集成常用 `HASH(business_key)` 生成。
- **SCD 策略选择**：根据业务对历史的诉求选择 Type 1/2/3/4/6；Type 2 是最常见的（保留历史）。
- **事实表粒度声明**：每个事实表必须有"一行代表什么"的明文声明，纳入模型文档。
- **分区与分桶**：大数据场景下，事实表按时间分区、按主键分桶是标配。
- **索引策略**：维度表常用 Bloom Filter、Zone Map；事实表常用 Min/Max、Clustering。
- **命名规范**：事实表前缀 `fact_`，维度表前缀 `dim_`，退化维度直接放事实表。
- **血缘与元数据**：每个事实/维度表必须有 Owner、血缘、上下游依赖、刷新策略。
- **度量命名**：度量名要带单位或业务含义（如 `order_amount_rmb`、`order_count_30d`）。

### 4.3 工具链与平台

| 类别 | 工具 | 推荐组合 |
| --- | --- | --- |
| **数据建模** | ER/Studio、PowerDesigner、dbdiagram.io、dbt | dbt（云原生）+ dbdiagram.io（轻量） |
| **ETL/ELT** | dbt、Airflow、DataWorks、Informatica | dbt + Airflow（开源组合） |
| **Lakehouse** | Databricks、Snowflake、Apache Iceberg、Delta Lake | Databricks + Iceberg |
| **查询引擎** | StarRocks、Doris、ClickHouse、Trino | StarRocks（国产）/ Trino（联邦查询） |
| **BI 工具** | Tableau、Power BI、Superset、FineBI | Superset（开源）/ FineBI（国产） |
| **元数据/血缘** | DataHub、Apache Atlas、OpenMetadata、阿里 DataWorks | DataHub（开源）+ DataWorks |
| **AI 辅助（2024+）** | Databricks Assistant、Snowflake Cortex、dbt + LLM、Cursor | Databricks Assistant + Cursor |
| **自动化建模** | WhereScape、Dataform、Coalesce | dbt + Dataform |

### 4.4 代码 / SQL 示例

经典星型模型（电商订单）：

```sql
-- 维度表：用户（含 SCD Type 2）
CREATE TABLE dim_user (
    user_key        BIGINT PRIMARY KEY,      -- 代理键
    user_id         VARCHAR(64),             -- 业务键
    user_name       VARCHAR(128),
    city            VARCHAR(64),
    effective_date  DATE,
    expiry_date     DATE,
    is_current      BOOLEAN
);

-- 维度表：日期（带层次）
CREATE TABLE dim_date (
    date_key      INT PRIMARY KEY,            -- YYYYMMDD
    date_value    DATE,
    year          INT,
    quarter       INT,
    month         INT,
    day           INT,
    week_of_year  INT,
    is_weekend    BOOLEAN
);

-- 事实表：订单（事务事实）
CREATE TABLE fact_order (
    order_key        BIGINT PRIMARY KEY,
    user_key         BIGINT REFERENCES dim_user(user_key),
    product_key      BIGINT REFERENCES dim_product(product_key),
    channel_key      BIGINT REFERENCES dim_channel(channel_key),
    order_date_key   INT REFERENCES dim_date(date_key),
    -- 度量
    order_amount_rmb DECIMAL(18,2),
    item_count       INT,
    discount_rmb     DECIMAL(18,2),
    -- 退化维度
    order_id         VARCHAR(64),
    -- V2
    created_at       TIMESTAMP
) PARTITIONED BY (dt DATE);
```

---
