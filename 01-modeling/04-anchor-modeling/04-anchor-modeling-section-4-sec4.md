> 本文件是 **04-anchor-modeling.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](04-anchor-modeling.md)。

## 4. 工程实现

### 4.1 落地步骤

一个标准的 Anchor Modeling 落地流程：

1. **业务盘点 → 实体清单**：梳理所有源系统，列出所有业务实体，产出 Entity Inventory。
2. **业务盘点 → 属性清单**：梳理所有实体的所有属性，按"变化频率 + 业务主题 + 是否共享"分组，产出 Attribute Matrix。
3. **业务盘点 → 关系清单**：梳理所有实体之间的关系，产出 Relationship Matrix。
4. **设计 Anchor**：从实体清单中识别业务实体，每个实体建立 Anchor 表（仅 ID）。
5. **设计 Knot**：识别"被多实体共享"的查找表（如国家、币种、状态码），建立 Knot 表。
6. **设计 Attribute**：从属性清单中识别"高频变化"的属性，每属性一张 Attribute 表；"低频变化"的属性可以合并到一张 Attribute 表。
7. **设计 Tie**：从关系清单中识别实体之间的关系，建立 Tie 表。
8. **设计反规范化视图**：为下游消费场景设计反规范化视图（基于 valid_to IS NULL 拼当前有效行）。
9. **加载流水线**：Stage → Anchor/Attribute/Tie/Knot 的 ETL 流水线，并行加载、bitemporal CDC。

每步的产出物：

| 步骤 | 产出物 | 评审点 |
|---|---|---|
| 1-3 | Entity / Attribute / Relationship Matrix | 业务方确认 |
| 4 | Anchor DDL | ID 稳定性 |
| 5 | Knot DDL | 是否真的共享 |
| 6 | Attribute DDL | 是否需要独立表 |
| 7 | Tie DDL | 关系正确性 |
| 8 | 反规范化视图 DDL | 查询性能压测 |
| 9 | ETL 流水线 | 并行度、bitemporal 正确性 |

### 4.2 关键技术点

#### 4.2.1 Anchor DDL 规范

```sql
-- Anchor：客户
CREATE TABLE customer (
    id BIGSERIAL PRIMARY KEY,        -- Anchor ID
    metadata JSONB,                  -- 可选元数据
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Anchor：订单
CREATE TABLE "order" (
    id BIGSERIAL PRIMARY KEY,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.2.2 Attribute DDL 规范（bitemporal）

```sql
-- Attribute：客户姓名（高频变化）
CREATE TABLE customer_name (
    customer_id BIGINT NOT NULL,
    value VARCHAR(100) NOT NULL,
    valid_from TIMESTAMP NOT NULL,   -- 业务时态起始
    valid_to TIMESTAMP,              -- 业务时态结束（NULL = 当前有效）
    loaded_at TIMESTAMP NOT NULL,    -- 加载时态
    deleted_at TIMESTAMP,            -- 删除时态（可选）
    source_system VARCHAR(50) NOT NULL,
    PRIMARY KEY (customer_id, valid_from, loaded_at),
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);

-- Attribute：客户生日（低频变化，可合并到一张简单 Attribute）
CREATE TABLE customer_simple_attrs (
    customer_id BIGINT NOT NULL,
    gender CHAR(1),
    birthday DATE,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    loaded_at TIMESTAMP NOT NULL,
    PRIMARY KEY (customer_id, valid_from, loaded_at),
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);
```

#### 4.2.3 Tie DDL 规范

```sql
-- Tie：客户-订单关系
CREATE TABLE customer_order_tie (
    customer_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    loaded_at TIMESTAMP NOT NULL,
    source_system VARCHAR(50) NOT NULL,
    PRIMARY KEY (customer_id, order_id, valid_from, loaded_at),
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (order_id) REFERENCES "order"(id)
);
```

#### 4.2.4 Knot DDL 规范

```sql
-- Knot：币种
CREATE TABLE knot_currency (
    id BIGSERIAL PRIMARY KEY,
    code CHAR(3) NOT NULL UNIQUE,    -- 'CNY', 'USD', 'EUR'
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Knot：订单状态
CREATE TABLE knot_order_status (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE, -- 'CREATED', 'PAID', 'SHIPPED', 'COMPLETED'
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.2.5 Bitemporal CDC

```sql
-- 伪代码：基于 CDC 流加载 Anchor Modeling
-- 1. 新增 Anchor
INSERT INTO customer (id, metadata, created_at)
SELECT NEXTVAL('customer_id_seq'), metadata, CURRENT_TIMESTAMP
FROM stage_customer
WHERE NOT EXISTS (SELECT 1 FROM customer WHERE id = stage_customer.id);

-- 2. 新增 / 更新 Attribute
INSERT INTO customer_name (customer_id, value, valid_from, valid_to, loaded_at, source_system)
SELECT
  c.id,
  stage.name,
  COALESCE(stage.effective_from, CURRENT_TIMESTAMP),  -- 业务时态
  NULL,                                                -- 当前有效
  CURRENT_TIMESTAMP,                                   -- 加载时态
  stage.source_system
FROM stage_customer stage
JOIN customer c ON c.id = stage.customer_id
WHERE stage.op IN ('c', 'u')
ON CONFLICT (customer_id, valid_from, loaded_at) DO NOTHING;

-- 3. 旧 Attribute 失效
UPDATE customer_name
SET valid_to = CURRENT_TIMESTAMP
WHERE customer_id = :customer_id
  AND valid_to IS NULL
  AND EXISTS (
    SELECT 1 FROM stage_customer
    WHERE customer_id = :customer_id AND op = 'u'
  );

-- 4. 新 Tie
INSERT INTO customer_order_tie (...)
SELECT ... FROM stage_order WHERE op IN ('c', 'u');
```

#### 4.2.6 反规范化视图

```sql
-- 伪代码：当前客户全貌视图
CREATE VIEW v_current_customer AS
SELECT
  c.id AS customer_id,
  cn.value AS name,
  csa.gender,
  csa.birthday,
  cp.value AS phone,
  kpt.code AS phone_type,
  cv.value AS vip_level
FROM customer c
LEFT JOIN customer_name cn
  ON cn.customer_id = c.id AND cn.valid_to IS NULL
LEFT JOIN customer_simple_attrs csa
  ON csa.customer_id = c.id AND csa.valid_to IS NULL
LEFT JOIN customer_phone cp
  ON cp.customer_id = c.id AND cp.valid_to IS NULL
LEFT JOIN knot_phone_type kpt
  ON kpt.id = cp.phone_type_knot_id
LEFT JOIN customer_vip_level cv
  ON cv.customer_id = c.id AND cv.valid_to IS NULL;

-- 时态切片视图
CREATE VIEW v_customer_at_2020_01_01 AS
SELECT
  c.id AS customer_id,
  cn.value AS name,
  csa.birthday
FROM customer c
LEFT JOIN customer_name cn
  ON cn.customer_id = c.id
  AND cn.valid_from <= '2020-01-01'
  AND (cn.valid_to > '2020-01-01' OR cn.valid_to IS NULL)
LEFT JOIN customer_simple_attrs csa
  ON csa.customer_id = c.id
  AND csa.valid_from <= '2020-01-01'
  AND (csa.valid_to > '2020-01-01' OR csa.valid_to IS NULL);
```

#### 4.2.7 类型演化

```sql
-- 伪代码：年龄字段从 INT 改为 VARCHAR
-- 1. 加新 Attribute 表
CREATE TABLE customer_age_v2 (
    customer_id BIGINT NOT NULL,
    value VARCHAR(20),  -- 新类型
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    loaded_at TIMESTAMP NOT NULL
);

-- 2. 旧表标记失效
UPDATE customer_age
SET valid_to = CURRENT_TIMESTAMP
WHERE valid_to IS NULL;

-- 3. 新表加载新数据
INSERT INTO customer_age_v2
SELECT customer_id, CAST(value AS VARCHAR), CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP
FROM customer_age
WHERE valid_to = CURRENT_TIMESTAMP;

-- 4. 下游视图改为 JOIN 新表
-- 5. 保留旧表作为历史
```

### 4.3 工具链与平台

#### 4.3.1 开源工具

| 工具 | 角色 | 适用场景 |
|---|---|---|
| **anchor-modeling**（Ruby） | 自动化生成 Anchor/Attribute/Tie DDL | anchor_modeling gem（参考实现） |
| **anchor-python**（Python） | Python 实现 | 与 dbtworks 集成 |
| **dbt + anchor** | dbt 包 | dbt + Anchor 集成 |
| **SQLBDM** | 商业 ETL | 自动化 Anchor Modeling |

#### 4.3.2 商业平台

| 平台 | 厂商 | Anchor 支持 | 特点 |
|---|---|---|---|
| **Snowflake** | Snowflake | 通过 dbt + anchor | 弹性计算 + 时态变体 |
| **Databricks** | Databricks | 通过 dbt + anchor | Lakehouse + Anchor |
| **PostgreSQL + Ruby** | 开源 | anchor_modeling gem | 经典组合 |
| **阿里云 DataWorks** | 阿里云 | 部分支持 | 国产化 |

#### 4.3.3 云原生工具（2024-2025）

| 工具 | 厂商 | 特点 |
|---|---|---|
| **Materialize + Anchor** | 商业 | 实时 Anchor 视图 |
| **RisingWave + Anchor** | 开源 | 流式 Anchor 增量 |
| **DuckDB + Anchor** | 开源 | 本地 Anchor 实验 |

#### 4.3.4 推荐组合

| 场景 | 推荐组合 |
|---|---|
| 传统金融 / 强合规 | PostgreSQL + anchor_modeling gem + Ruby ETL |
| 云原生 / 实时 | RisingWave + Anchor + dbt + OpenMetadata |
| 湖仓 | Databricks + Delta Lake + Anchor + dbt |
| 国产化 | 阿里云 DataWorks + 自研 Anchor 模板 |

### 4.4 代码 / SQL 示例

#### 示例 1：完整 Anchor Modeling DDL

```sql
-- Anchor
CREATE TABLE customer (
    id BIGSERIAL PRIMARY KEY,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Attribute：高频变化字段独立
CREATE TABLE customer_name (
    customer_id BIGINT NOT NULL,
    value VARCHAR(100) NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    loaded_at TIMESTAMP NOT NULL,
    source_system VARCHAR(50) NOT NULL,
    PRIMARY KEY (customer_id, valid_from, loaded_at),
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);

-- Attribute：低频变化字段合并
CREATE TABLE customer_simple_attrs (
    customer_id BIGINT NOT NULL,
    gender CHAR(1),
    birthday DATE,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    loaded_at TIMESTAMP NOT NULL,
    PRIMARY KEY (customer_id, valid_from, loaded_at),
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);

-- Knot
CREATE TABLE knot_currency (
    id BIGSERIAL PRIMARY KEY,
    code CHAR(3) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5)
);

-- Anchor
CREATE TABLE "order" (
    id BIGSERIAL PRIMARY KEY,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tie
CREATE TABLE customer_order_tie (
    customer_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    loaded_at TIMESTAMP NOT NULL,
    source_system VARCHAR(50) NOT NULL,
    PRIMARY KEY (customer_id, order_id, valid_from, loaded_at),
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (order_id) REFERENCES "order"(id)
);

-- Attribute：订单金额
CREATE TABLE order_amount (
    order_id BIGINT NOT NULL,
    value DECIMAL(18,2) NOT NULL,
    currency_knot_id BIGINT NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    loaded_at TIMESTAMP NOT NULL,
    FOREIGN KEY (order_id) REFERENCES "order"(id),
    FOREIGN KEY (currency_knot_id) REFERENCES knot_currency(id)
);
```

#### 示例 2：Bitemporal 查询

```sql
-- 查询：业务时态 2020-01-01 + 加载时态 2020-01-15 下张三的姓名
WITH target_customer AS (
    SELECT id FROM customer WHERE metadata->>'name' = '张三' LIMIT 1
)
SELECT
  cn.value,
  cn.valid_from,
  cn.valid_to,
  cn.loaded_at
FROM customer_name cn
JOIN target_customer tc ON cn.customer_id = tc.id
WHERE cn.valid_from <= '2020-01-01'
  AND (cn.valid_to > '2020-01-01' OR cn.valid_to IS NULL)
  AND cn.loaded_at <= '2020-01-15'
ORDER BY cn.loaded_at DESC
LIMIT 1;
```

---
