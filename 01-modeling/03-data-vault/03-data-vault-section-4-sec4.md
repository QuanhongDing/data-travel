> 本文件是 **03-data-vault.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](03-data-vault.md)。

## 4. 工程实现

### 4.1 落地步骤

一个标准的 Data Vault 落地流程：

1. **业务盘点 → 实体清单**：梳理所有源系统，列出所有业务实体（客户、订单、商品、合同…），产出 Entity Inventory。
2. **业务盘点 → 关系清单**：梳理所有实体之间的关系（1:1、1:N、N:N），产出 Relationship Matrix。
3. **业务盘点 → 属性清单**：梳理所有实体的所有属性，按"变更频率 + 业务主题"分组，产出 Attribute Matrix。
4. **设计 Hub**：从实体清单中识别"业务键唯一稳定"的实体，建立 Hub 表。
5. **设计 Link**：从关系清单中识别 Hub 之间的关系，建立 Link 表。
6. **设计 Satellite**：从属性清单中按"变更频率 + 业务主题"分组，建立 Satellite 表。
7. **设计 PIT / Bridge**：针对热点查询，预聚合 PIT 表和 Bridge 表。
8. **加载流水线**：Stage → Raw Vault → Business Vault → Data Mart 的 ETL 流水线建设，并行加载、增量 CDC。

每步的产出物：

| 步骤 | 产出物 | 评审点 |
|---|---|---|
| 1-3 | Entity / Relationship / Attribute Matrix | 业务方确认 |
| 4 | Hub DDL | 主键稳定性 |
| 5 | Link DDL | 关系正确性 |
| 6 | Satellite DDL | 拆分粒度合理性 |
| 7 | PIT / Bridge 视图 | 查询性能压测 |
| 8 | ETL 流水线 | 并行度、CDC 延迟、监控 |

### 4.2 关键技术点

#### 4.2.1 哈希键规范

```sql
-- 标准 MD5 哈希键生成（PostgreSQL 语法）
CREATE OR REPLACE FUNCTION fn_md5_hash(VARIADIC p_keys TEXT)
RETURNS CHAR(32) AS $$
  SELECT MD5(STRING_AGG(k, '|'))
  FROM UNNEST(p_keys) k;
$$ LANGUAGE SQL IMMUTABLE;

-- Hub 哈希键
SELECT fn_md5_hash('CRM', customer_business_key) AS hub_customer_hash
FROM stage_customer;

-- Link 哈希键
SELECT fn_md5_hash(l_co.hub_customer_hash, l_op.hub_order_hash, 'CUSTOMER_ORDER') AS link_co_hash
FROM link_customer_order_raw l_co;
```

**关键点**：哈希输入必须**确定性排序**（按字段名排序而不是按值），否则同一业务键在不同环境下会生成不同 Hash。

#### 4.2.2 多源冲突解决

```sql
-- 伪代码：按"优先级 + 时间戳"解决冲突
SELECT
  hub_customer_hash,
  name,
  ROW_NUMBER() OVER (
    PARTITION BY hub_customer_hash
    ORDER BY
      CASE source_system WHEN 'CRM' THEN 1 WHEN 'ERP' THEN 2 ELSE 3 END,
      load_datetime DESC
  ) AS rn
FROM sat_customer_demo
WHERE load_datetime <= :as_of_datetime
QUALIFY rn = 1; -- 取优先级最高 + 最新的版本
```

#### 4.2.3 增量 CDC 模式

```sql
-- 伪代码：基于 Debezium / Canal 的 CDC 流
INSERT INTO sat_customer_demo
SELECT
  hub_customer_hash,
  after_name,
  after_gender,
  after_birthday,
  -- 业务时态：源系统的事务时间
  COALESCE(after_updated_at, source_ts) AS effective_datetime,
  -- 加载时态：当前 ETL 时间
  CURRENT_TIMESTAMP AS load_datetime,
  source_system
FROM cdc_customer_stream
WHERE op IN ('c', 'u')  -- create or update
  AND after_customer_bk IS NOT NULL;
```

#### 4.2.4 PIT 表增量维护

```sql
-- 伪代码：PIT 表的增量维护
INSERT INTO pit_customer
SELECT
  h.hub_customer_hash,
  -- 对每个 Satellite，记录"当前有效版本的 load_datetime"
  (SELECT MAX(load_datetime) FROM sat_customer_demo s WHERE s.hub_customer_hash = h.hub_customer_hash AND s.load_datetime <= :as_of) AS demo_load,
  (SELECT MAX(load_datetime) FROM sat_customer_contact s WHERE s.hub_customer_hash = h.hub_customer_hash AND s.load_datetime <= :as_of) AS contact_load,
  -- ...
FROM hub_customer h;
```

#### 4.2.5 Effectivity Satellite 软删除

```sql
-- 伪代码：软删除
INSERT INTO sat_customer_lifecycle
SELECT
  hub_customer_hash,
  -- 业务时态 = 源系统的删除时间
  source_deletion_time AS effective_from,
  -- 失效时间 = 加载时间
  CURRENT_TIMESTAMP AS effective_to,
  FALSE AS is_current,
  'GDPR_RIGHT_TO_BE_FORGOTTEN' AS deletion_reason,
  CURRENT_TIMESTAMP AS load_datetime,
  source_system
FROM cdc_customer_deletion_stream;
```

#### 4.2.6 跨域 Same-As Link

```sql
-- 伪代码：基于多源 ID-Mapping 构建 Same-As Link
INSERT INTO link_customer_same_as
SELECT DISTINCT
  fn_md5_hash('CRM', crm_customer_bk) AS hub_crm_hash,
  fn_md5_hash('ERP', erp_customer_bk) AS hub_erp_hash,
  CURRENT_TIMESTAMP AS load_datetime,
  'IDMAPPING_BATCH_20251015' AS record_source
FROM id_mapping_batch
WHERE match_confidence >= 0.95;
```

#### 4.2.7 多活动卫星（MAS）

```sql
-- 伪代码：MAS 加载
INSERT INTO sat_customer_multi_key
SELECT
  hub_customer_hash,
  phone_number,
  phone_type,  -- MOBILE / LANDLINE / WORK
  effective_from,
  effective_to,
  CURRENT_TIMESTAMP AS load_datetime,
  source_system
FROM stage_customer_phones
WHERE phone_number IS NOT NULL;
```

#### 4.2.8 数据血缘自动化

Data Vault 的标准化结构让自动化血缘成为可能：

- Hub 表 = 实体血缘节点
- Link 表 = 关系血缘边
- Satellite 表 = 属性血缘叶子

工具推荐：
- **OpenMetadata**：自动从 Hub/Link/Satellite 解析血缘
- **DataHub**（LinkedIn）：自动 catalog + lineage
- **Apache Atlas**：自动血缘 + 标签治理

### 4.3 工具链与平台

#### 4.3.1 开源工具

| 工具 | 角色 | 适用场景 |
|---|---|---|
| **dbtvault**（Python） | dbt 包，自动化生成 Hub/Link/Satellite DDL 与加载 | dbt + Snowflake/Databricks/Postgres 全家桶 |
| **VaultSpeed** | 商业 ETL 工具，Data Vault 一键生成 | 企业级 ETL 自动化 |
| **Data Vault Builder** | 元数据驱动的 DV 模型生成 | 自研平台集成 |
| **SQLBDM** | 自动化 Data Vault 建模工具 | 传统行业落地 |
| **Apache Hop** | 数据编排工具，支持 Data Vault 模式 | 轻量化 ETL |

#### 4.3.2 商业平台

| 平台 | 厂商 | Data Vault 支持 | 特点 |
|---|---|---|---|
| **Databricks** | Databricks | Lakehouse + DV 模板 | Unity Catalog + Delta + DV 2.0 |
| **Snowflake** | Snowflake | 通过 dbtvault | 弹性计算 + 强一致性 |
| **Microsoft Fabric** | Microsoft | OneLake + DV | 集成 Power BI / Synapse |
| **阿里云 DataWorks** | 阿里云 | DataWorks 智能建模 | 国产化首选 |
| **华为 FusionInsight** | 华为 | 集成 Data Vault 模板 | 政企市场 |
| **Informatica** | Informatica | 完整 Data Vault 套件 | 传统 ETL 老牌 |
| **Talend** | Talend | DV 模板 | 开源 ETL 老牌 |

#### 4.3.3 云原生工具（2024-2025）

| 工具 | 厂商 | 特点 |
|---|---|---|
| **dbt + Snowflake/Databricks** | dbt Labs | 现代化 DV 流水线 |
| **Polars + Delta Lake** | 开源 | 高性能 DV 加载（Python） |
| **DuckDB + dbt** | 开源 | 本地化 DV 实验 |
| **Apache Hudi + Flink** | 开源 | 流式 DV 入仓 |
| **Materialize** | 商业 | 实时物化视图 + DV |
| **RisingWave** | 开源 | 流式 DV 入仓 + 增量计算 |

#### 4.3.4 推荐组合（按场景）

| 场景 | 推荐组合 |
|---|---|
| 互联网企业 / 敏捷 | dbt + Snowflake/Databricks + dbtvault + OpenMetadata |
| 传统金融 / 强合规 | Informatica/Talend + Oracle/DB2 + Apache Atlas |
| 云原生创业 | DuckDB + dbt + Iceberg + OpenMetadata |
| 国产化 / 政企 | 阿里云 DataWorks / 华为 FusionInsight + 自研 DV 模板 |
| 实时数仓 | Flink + Hudi + Kafka + RisingWave |
| 湖仓 | Databricks + Delta Lake + Unity Catalog + DV 2.0 |

### 4.4 代码 / SQL 示例

#### 示例 1：Hub + Satellite 完整 DDL

```sql
-- Hub：客户业务键
CREATE TABLE hub_customer (
    hub_customer_hash   CHAR(32) NOT NULL,    -- MD5 哈希键
    customer_bk        VARCHAR(50) NOT NULL, -- 业务键
    load_datetime      TIMESTAMP NOT NULL,
    record_source      VARCHAR(50) NOT NULL,
    PRIMARY KEY (hub_customer_hash)
);

-- Satellite：客户人口属性（低频变更）
CREATE TABLE sat_customer_demo (
    hub_customer_hash   CHAR(32) NOT NULL,
    load_datetime      TIMESTAMP NOT NULL,
    load_end_datetime  TIMESTAMP,             -- NULL = 当前有效
    record_source      VARCHAR(50) NOT NULL,
    name               VARCHAR(100),
    gender             CHAR(1),
    birthday           DATE,
    PRIMARY KEY (hub_customer_hash, load_datetime)
);

-- Satellite：客户联系方式（高频变更）
CREATE TABLE sat_customer_contact (
    hub_customer_hash   CHAR(32) NOT NULL,
    load_datetime      TIMESTAMP NOT NULL,
    load_end_datetime  TIMESTAMP,
    record_source      VARCHAR(50) NOT NULL,
    phone              VARCHAR(20),
    email              VARCHAR(100),
    PRIMARY KEY (hub_customer_hash, load_datetime)
);

-- Link：客户-订单关系
CREATE TABLE link_customer_order (
    link_co_hash       CHAR(32) NOT NULL,
    hub_customer_hash  CHAR(32) NOT NULL,
    hub_order_hash     CHAR(32) NOT NULL,
    load_datetime      TIMESTAMP NOT NULL,
    record_source      VARCHAR(50) NOT NULL,
    PRIMARY KEY (link_co_hash)
);
```

#### 示例 2：业务查询（消费层视角）

```sql
-- 业务查询：查询某客户在某时间点的完整画像 + 最近订单
WITH current_customer AS (
  SELECT DISTINCT ON (hub_customer_hash)
    hub_customer_hash,
    name, gender, birthday, phone, email
  FROM (
    SELECT
      s.hub_customer_hash,
      s_demo.name, s_demo.gender, s_demo.birthday,
      s_contact.phone, s_contact.email,
      COALESCE(s_demo.load_datetime, s_contact.load_datetime) AS load_datetime
    FROM hub_customer h
    LEFT JOIN sat_customer_demo s_demo
      ON s_demo.hub_customer_hash = h.hub_customer_hash
     AND s_demo.load_datetime <= '2025-10-01'
    LEFT JOIN sat_customer_contact s_contact
      ON s_contact.hub_customer_hash = h.hub_customer_hash
     AND s_contact.load_datetime <= '2025-10-01'
  ) t
  ORDER BY hub_customer_hash, load_datetime DESC
)
SELECT
  c.hub_customer_hash, c.name, c.gender,
  o.hub_order_hash, sat_o.order_amount, sat_o.order_status
FROM current_customer c
LEFT JOIN link_customer_order l ON l.hub_customer_hash = c.hub_customer_hash
LEFT JOIN hub_order o ON o.hub_order_hash = l.hub_order_hash
LEFT JOIN sat_order_header sat_o ON sat_o.hub_order_hash = o.hub_order_hash
ORDER BY c.hub_customer_hash, sat_o.load_datetime DESC;
```

---
