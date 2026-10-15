# Anchor Modeling

> **一句话定位**：以 Anchors / Attrtributes / Ties / Knots 四件套，实现第 6 范式 + bitemporal 时态建模的高度可演化数据仓库。

> 本文是 data-travel 项目 [Ch1 · 建模方法论](../../README.md) 的子章节（04-anchor-modeling）。覆盖 R3 数据建模 相关的"6NF 极致规范化、bitemporal 时态建模、零中断 schema 演化、AI 时代的自演化数据底座"核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| Anchor Modeling 是什么、解决什么问题 | §1.1、§1.2 |
| Anchors / Attrtributes / Ties / Knots 怎么设计 | §2.1、§3.1 |
| 如何把 3NF / Kimball 迁移到 Anchor Modeling | §4.1、§6.3 |
| bitemporal 时态建模如何落地 | §2.2、§3.1.4 |
| Anchor Modeling 在 AI 时代的新角色 | §5.1—§5.4 |
| 决策树：我的业务该用 Anchor、Data Vault 还是 Kimball | §7.2 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：Anchor Modeling 是由瑞典 OLTP 专家 Olle Regardt 于 2007 年提出、并在 2010 年代逐步成熟的一种**第 6 范式（6NF）**建模方法。它把每个业务实体拆解为 4 类原子构件：

- **Anchor**：业务实体的唯一标识（如客户 ID）
- **Attrtribute**：实体的一个描述性属性（如客户的姓名、生日）
- **Tie**：实体之间的关系（如客户-订单）
- **Knot**：可被多实体共享的查找表（如国家码、币种、状态码）

每个属性、每个关系都独立成表，**6NF 规范化到极致**：任何业务变化（如新增属性、修改属性类型、新增关系）都不需要修改已有表。

**工程定义**：Anchor Modeling 是 Data Vault 的"超集 + 极致版"——比 Data Vault 还要激进：

| 维度 | Data Vault 2.0 | Anchor Modeling |
|---|---|---|
| 规范化程度 | 3NF + Satellite 轻度冗余 | 6NF（每个属性一张表） |
| 加属性成本 | 加 Satellite | 加 Attribute 表 |
| 修改属性类型 | 加新 Satellite + 旧 Satellite 失效 | 加新 Attribute 表 + 旧表失效 |
| 时态支持 | 双时态（bitemporal） | 双时态（bitemporal，原生） |
| 工具支持 | 成熟（dbtvault、Informatica） | 较少（开源仅 anchor_modeling gem） |
| 适用场景 | 多源 DW 集成 | 极致演化 + 时态分析 |

**核心问题**：解决"业务变化最频繁 + 时态分析要求最高 + 极致规范化"的根本矛盾——比 Data Vault 还要极致，比 3NF 还要灵活。

**与"传统 3NF / 维度建模 / Data Vault"的边界**：

| 维度 | 3NF | 维度建模 | Data Vault | Anchor |
|---|---|---|---|---|
| 规范化 | 3NF | 1NF 反规范化 | 3.5NF | 6NF |
| 加属性 | 改表 | 改宽表 | 加 Satellite | 加 Attribute |
| 时态 | 弱 | 弱（SCD） | 强（Satellite） | 强（原生） |
| 查询 | 复杂 JOIN | 直接查询 | PIT / Bridge | Bitemporal View |
| 适用 | OLTP | OLAP | DW 集成 | 时态 DW |

### 1.2 为什么需要

#### 业务驱动力

1. **极致演化需求**：某些行业（电信、金融、保险、医疗）的核心实体有 100+ 个属性，且每周都在新增 / 修改 / 删除。传统 3NF 每次改表都要 DDL 变更 + 数据迁移，业务部门根本等不及。
2. **强时态分析需求**：监管要求"任意时间点的数据状态可追溯"，传统星型模型只能保留"当前状态"，Anchor Modeling 原生支持 bitemporal（业务时态 + 加载时态），可以回答"2018-03-15 那天，系统看到的张三的姓名是什么"。
3. **类型演化需求**：业务字段的类型会变（如"金额"从 DECIMAL 变成 BIGINT）。传统建模只能"原地修改"，Anchor Modeling 可以"加新 Attribute 表 + 旧表标记历史"，完全无中断。
4. **合规需求**：GDPR、Basel III、HIPAA 等监管要求"任何字段的历史变更可追溯"，Anchor Modeling 的天然 bitemporal 让合规报表变得简单。

#### 痛点（没有 Anchor Modeling 时的失败案例）

**案例 1：电信运营商 BSS 系统的"字段爆炸"**
某电信运营商 BSS（业务支撑系统）需要建模"客户"实体，包含人口属性、联系方式、地址、套餐、设备、计费、积分等 200+ 字段。传统 3NF 把这些字段拆成 10+ 张表（每张表 20-30 字段）。结果：

- 每次新增字段都要在多张表之间分配，决定权不清晰
- 字段归属争议经常出现（"VIP 等级"应该放在人口属性表还是套餐表？）
- 跨表 JOIN 性能差，查询一次客户全貌需要 8-10 张表 JOIN

**案例 2：保险公司精算系统的"时态灾难"**
某保险公司精算系统需要"任意时点的客户保单状态"。传统 Kimball 星型模型只保留"当前状态"，要做时态分析必须拉链表 + 触发器：

- 拉链表复杂度高，新人接手 3 个月才能理解
- 触发器性能差，每天 1 亿条变更需要 30 分钟触发器处理
- 时态查询性能差，每次都要"过滤当前有效行"

**案例 3：金融监管报送的"类型演化灾难"**
某城商行 2020 年升级核心系统，"账户余额"字段从 DECIMAL(18,2) 升级为 BIGINT（避免精度丢失）。传统 3NF 升级方案：

- ALTER TABLE → 锁表 8 小时
- 数据迁移（DECIMAL → BIGINT）→ 6 小时
- 回滚方案 → 需要提前 24 小时备份
- 整个升级耗时 38 小时，错过业务窗口，被罚款 500 万

#### AI 时代的新诉求

1. **极致 schema 演化**：AI 时代业务变化最快，LLM/Agent 会持续推送新的属性、新的关系。传统建模每次都要 DDL 变更，Anchor Modeling 可以做到"零中断演化"。
2. **可解释的时态推理**：LLM/Agent 需要"为什么这个字段在当时是这个值"的可解释性，Anchor Modeling 的 bitemporal 天然支持"业务时态 + 加载时态"双维度追溯。
3. **细粒度属性治理**：AI 时代数据治理要"字段级"（field-level）而非"表级"（table-level），Anchor Modeling 的"每个属性一张表"天然契合。
4. **Schema Discovery**：Agent 自动从源系统发现新属性时，只需"加一张 Attribute 表"，不需要改任何已有结构。

### 1.3 在 AI 时代数据架构中的位置

Anchor Modeling 在数据架构栈中的位置：

```
源系统 ──> ODS（贴源层）──> Anchor Modeling（极致规范化 + 时态）──> 反规范化层（Data Mart）──> 应用
                                  │
                                  └──> LLM / Agent / GraphRAG 消费
```

- **数仓分层中的位置**：Anchor Modeling 适合 **ODS 与 DWD 之间**，作为"极致可演化集成层"。比 Data Vault 更激进，适合"字段变化最频繁 + 时态要求最强"的场景。
- **湖仓中的位置**：在 Lakehouse（Delta Lake / Iceberg / Hudi）架构下，每个 Anchor / Attribute / Tie 都是一个独立的 Iceberg 表，加载即可读取历史快照。Lakehouse 的时间旅行与 Anchor 的 bitemporal 天然契合。
- **智能体平台中的位置**：Anchor Modeling 的"每个属性一张表"特性让 Agent 可以做"字段级数据发现"——遍历 Metadata 字典就能知道每个字段的当前值、历史值、来源。
- **本体建模与 KG 中的位置**：Anchor Modeling 的结构本质上就是"工程版的 RDF 三元组"：Anchor = Subject、Attribute = Predicate-Object、Tie = Predicate、Knot = Reified Object。可以直接同步为 RDF 进入 KG。

**一句话判断**：Anchor Modeling 是"建表（ODS）→ 建模型（DWD）（Anchor）→ 建消费（Data Mart）"链条中的 **DWD 层**——是比 Data Vault 更极致、更可演化、更时态友好的集成层。

### 1.4 演进历程

#### 1.4.1 传统阶段（2007–2015）

- 2007：Olle Regardt 提出 Anchor Modeling 论文
- 2010：Anchor Modeling 1.0 规范发布，主要在瑞典、欧洲电信 / 金融行业落地
- 2013：anchor_modeling gem 发布（Ruby 实现），适合 PostgreSQL
- 2014：bitemporal 时态支持成熟
- 核心矛盾：**传统 3NF 太死，无法应对高频字段变更**

#### 1.4.2 大数据阶段（2015–2020）

- 2015：Anchor Modeling 开始走出欧洲，在北美 / 亚洲金融、保险行业落地
- 2017：Anchor Modeling 2.0 发布，加入 NoSQL、大数据平台适配
- 2018：在 Hadoop / Spark 平台上落地，开始与 Lakehouse 融合
- 2019：anchor_modeling Python 实现（anchor-python）出现
- 核心矛盾：**离线数仓→实时数仓；单一源→多源；结构化→半结构化**

#### 1.4.3 AI 原生阶段（2020+，LLM + Agent 驱动）

- 2020：Anchor Modeling + Lakehouse（Delta Lake / Iceberg）开始融合
- 2022：anchor_modeling 2.0 发布，支持多语言 / 云原生
- 2024：LLM 出现，Anchor Modeling 的"每个属性一张表"特性被用于"自动元数据发现 + 自动字段级 RAG"
- 2025：Agent 平台开始把 Anchor Modeling 作为"自演化数据底座"——Agent 自动感知 schema drift、自动加 Attribute 表
- 核心矛盾：**人工建模→AI 辅助建模；固定 schema→持续演化 schema；批量→实时**

**一句话总结**：每阶段的核心矛盾都是"**业务字段变化速度 vs 模型结构变化成本**"——Anchor Modeling 通过"加 Attribute 表 + 旧表标记失效"从根本上解决了这个矛盾。

---

## 2. 核心原理

### 2.1 关键概念定义

Anchor Modeling 的核心构件只有四类，但比 Data Vault 更极致：

| 概念 | 英文 | 一句话定义 | 工程对应 |
| --- | --- | --- | --- |
| 锚 | Anchor | 一个业务实体的唯一标识 | 1 张物理表 / 实体 |
| 属性 | Attrtribute | 实体的一个描述性属性 | 1 张物理表 / 属性 |
| 关系 | Tie | 两个或多个 Anchor 之间的关系 | 1 张物理表 / 关系 |
| 节点 | Knot | 可被多 Anchor / Tie 共享的查找表 | 1 张物理表 / 共享查找 |

**关键约束**：

- **Anchor 只包含 ID**：每个 Anchor 表只有 1 个 ID 列 + 元数据列（创建时间、来源等），**没有任何业务属性**。
- **Attribute 只包含 1 个属性**：每个 Attribute 表只包含 Anchor ID + 1 个业务属性 + 时态列（业务时态、加载时态），**没有任何其他属性**。
- **Tie 只包含关系 ID**：每个 Tie 表只包含多个 Anchor ID + 元数据列，**没有任何业务属性**。
- **Knot 只包含共享查找**：每个 Knot 表只包含查找值（如国家码、币种），**Anchor / Tie / Attribute 通过引用 Knot 实现"共享值"**。

**形式化示例**：

```
Anchor: customer (id)
Attrtribute: customer_name (customer_id, name, valid_from, valid_to, loaded_at)
Attrtribute: customer_birthday (customer_id, birthday, valid_from, valid_to, loaded_at)
Attrtribute: customer_phone (customer_id, phone, phone_type_knot_id, valid_from, valid_to, loaded_at)
Tie: customer_order (customer_id, order_id, valid_from, valid_to, loaded_at)
Knot: phone_type (id, value)  -- 'MOBILE', 'LANDLINE', 'WORK'
```

**对比 Data Vault**：

| 构件 | Data Vault | Anchor Modeling |
|---|---|---|
| 业务实体 | Hub（包含 ID + 少量元数据） | Anchor（仅 ID） |
| 属性 | Satellite（多属性一张表） | Attrtribute（每属性一张表） |
| 关系 | Link | Tie |
| 共享查找 | 嵌入 Link 或独立表 | Knot（强制独立） |
| 时态 | 全靠 Satellite | 原生（每个 Attrtribute 自带 valid_from / valid_to） |

### 2.2 数学/形式化基础

#### 2.2.1 6NF 形式化

Anchor Modeling 是 6NF 的工程实现。6NF 的定义：

> 一个关系 $R$ 处于 6NF，当且仅当 $R$ 不包含任何非平凡的连接依赖（join dependency）。

直观含义：**任何业务字段都必须独立成表，不与其他字段共存**。

设 $E = \{e_1, e_2, \dots, e_n\}$ 为所有 Anchor 的集合，每个 Anchor $e_i$ 有一组属性 $\{a_{i1}, a_{i2}, \dots, a_{im}\}$，则 Anchor Modeling 把每个 $a_{ij}$ 拆为独立的 Attribute 表：

$$
\text{Attribute}(e_i, a_{ij}) \triangleq (e_i.\text{id}, a_{ij}.\text{value}, \text{valid\_from}, \text{valid\_to}, \text{loaded\_at})
$$

#### 2.2.2 Bitemporal 时态扩展

每个 Anchor / Attribute / Tie 都有 4 个时态字段：

| 字段 | 含义 | 工程意义 |
|---|---|---|
| `valid_from` | 业务时态起始 | 业务事件何时开始生效 |
| `valid_to` | 业务时态结束 | 业务事件何时失效 |
| `loaded_at` | 加载时态 | ETL 何时落库 |
| `deleted_at` | 删除时态 | 何时被标记删除（可选） |

任意一条记录都有 $(valid\_from, valid\_to, loaded\_at)$ 三元组，可以回答：

- **业务时态查询**："2020-01-01 那天，张三的姓名是什么？" → `WHERE valid_from <= '2020-01-01' AND valid_to > '2020-01-01'`
- **加载时态查询**："如果 ETL 在 2020-01-02 凌晨 2 点跑，张三的姓名会是什么？" → `WHERE loaded_at <= '2020-01-02 02:00:00' AND (valid_from <= '2020-01-01' AND valid_to > '2020-01-01')`
- **晚到真相查询**："如果源系统在 2020-01-15 才推送 2020-01-01 的变更，系统怎么处理？" → 自动产生新版本，不覆盖历史

#### 2.2.3 Knot 共享查找

Knot 是"被多 Anchor / Tie / Attribute 共享的查找表"。通过引用 Knot 实现值的统一：

```
Anchor: order
Attrtribute: order_currency (order_id, currency_knot_id, ...)
Knot: currency (id, code, name)  -- 'CNY', 'USD', 'EUR', ...
```

**好处**：

1. **一处修改，处处生效**：修改币种名称只需要改 Knot 表 1 行
2. **避免值不一致**：不会出现在 A 表是 "CNY"，B 表是 "人民币" 的不一致
3. **Agent 友好**：Agent 可以直接遍历 Knot 字典做语义理解

### 2.3 关键算法/方法

#### 2.3.1 演化算法（Incremental Evolution）

Anchor Modeling 的核心优势是"零中断演化"：

**场景 1：新增属性**
- 业务方："客户新增 'VIP等级' 字段"
- 操作：加一张 Attribute 表 `customer_vip_level`
- **不需要修改任何已有表**

**场景 2：修改属性类型**
- 业务方："客户 '年龄' 从 INT 改为 VARCHAR（支持 'unknown'）"
- 操作：加一张新 Attribute 表 `customer_age_v2`，旧表 `customer_age` 标记失效
- **不需要修改任何已有表，原有数据保留**

**场景 3：新增关系**
- 业务方："客户和门店新增 '最近到店' 关系"
- 操作：加一张 Tie 表 `customer_store_visit`
- **不需要修改任何已有表**

**场景 4：删除属性**
- 业务方："客户 '传真号' 字段下线"
- 操作：把 Attribute 表 `customer_fax` 标记为 `deleted_at = now`
- **不需要删除任何数据，保留历史**

#### 2.3.2 Bitemporal 查询算法

```sql
-- 伪代码：bitemporal 查询
-- 查询 "2020-01-01 业务时态 + 2020-01-15 加载时态" 下张三的姓名
SELECT
  a.customer_id,
  attr.value AS name,
  attr.valid_from,
  attr.valid_to,
  attr.loaded_at
FROM customer a
JOIN customer_name attr ON attr.customer_id = a.id
WHERE a.id = 'zhangsan'
  AND attr.valid_from <= '2020-01-01'  -- 业务时态
  AND attr.valid_to > '2020-01-01'
  AND attr.loaded_at <= '2020-01-15'   -- 加载时态
ORDER BY attr.loaded_at DESC
LIMIT 1;
```

**关键点**：通过 `(valid_from, valid_to, loaded_at)` 三元组实现"任意时态切片"。

#### 2.3.3 反规范化视图算法（Denormalization View）

Anchor Modeling 的"反规范化"通过视图实现：

```sql
-- 伪代码：把多个 Attribute 拼成"当前客户全貌"
CREATE VIEW v_current_customer AS
SELECT
  c.id AS customer_id,
  n.value AS name,
  b.value AS birthday,
  p.value AS phone,
  pt.code AS phone_type,
  v.value AS vip_level
FROM customer c
LEFT JOIN customer_name n
  ON n.customer_id = c.id AND n.valid_to IS NULL  -- 当前有效
LEFT JOIN customer_birthday b
  ON b.customer_id = c.id AND b.valid_to IS NULL
LEFT JOIN customer_phone p
  ON p.customer_id = c.id AND p.valid_to IS NULL
LEFT JOIN knot_phone_type pt
  ON pt.id = p.phone_type_knot_id
LEFT JOIN customer_vip_level v
  ON v.customer_id = c.id AND v.valid_to IS NULL;
```

**特性**：视图层"按需反规范化"，底表层"极致规范化"。

#### 2.3.4 Knot 共享算法

```sql
-- 伪代码：Knot 引用
-- 客户表引用币种 Knot
CREATE TABLE customer_preferred_currency (
    customer_id BIGINT NOT NULL,
    currency_knot_id BIGINT NOT NULL,  -- 引用 Knot
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    loaded_at TIMESTAMP NOT NULL,
    FOREIGN KEY (currency_knot_id) REFERENCES knot_currency(id)
);

-- 订单表也引用币种 Knot
CREATE TABLE order_currency (
    order_id BIGINT NOT NULL,
    currency_knot_id BIGINT NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    loaded_at TIMESTAMP NOT NULL,
    FOREIGN KEY (currency_knot_id) REFERENCES knot_currency(id)
);
```

**好处**：币种名称变更时，只需要改 Knot 表 1 行，所有引用自动同步。

#### 2.3.5 Type Evolution 算法

当某 Attribute 的类型需要变化时（如 INT → VARCHAR）：

```sql
-- 伪代码：类型演化
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
SET valid_to = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP
WHERE valid_to IS NULL;

-- 3. 新表加载新数据
INSERT INTO customer_age_v2
SELECT customer_id, CAST(value AS VARCHAR), CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP
FROM customer_age
WHERE valid_to = CURRENT_TIMESTAMP;

-- 4. 下游查询改为 JOIN 新表
-- 5. 保留旧表作为历史归档
```

**好处**：类型变化零中断，原有数据保留。

### 2.4 与相邻概念的关系

#### 2.4.1 Anchor Modeling vs Data Vault

| 维度 | Data Vault | Anchor Modeling |
|---|---|---|
| 规范化 | 3.5NF | 6NF |
| 加属性 | 加 Satellite（多属性一张表） | 加 Attribute（每属性一张表） |
| 修改类型 | 加新 Satellite + 旧表失效 | 加新 Attribute + 旧表失效 |
| 时态 | 全靠 Satellite | 原生（每个 Attribute 自带时态） |
| Knot 共享 | 无强制 | 强制 Knot |
| 表数量 | 少（数百张） | 多（数千张甚至数万张） |
| 查询复杂度 | 中（PIT 视图） | 高（多 Attribute JOIN） |
| 适用 | 多源 DW 集成 | 极致演化 + 时态分析 |

**实战关系**：**Data Vault 是 Anchor Modeling 的"轻量版"**。如果业务字段变化 < 每周 10 个、时态要求不极致，用 Data Vault 更经济；如果业务字段变化 ≥ 每周 10 个、时态要求极致，用 Anchor Modeling。

#### 2.4.2 Anchor Modeling vs 本体建模（Ontology）

| 维度 | 本体建模（RDF / OWL） | Anchor Modeling |
|---|---|---|
| 形态 | 三元组（Subject-Predicate-Object） | Anchor + Attribute + Tie + Knot |
| 标准化 | 高（W3C） | 中（Olle Regardt 规范） |
| 推理 | 强（推理机） | 弱（SQL JOIN） |
| 工程落地 | 难（图数据库） | 易（关系数据库） |
| 时态 | 弱（需 RDF 1.2 / Stardog 等扩展） | 强（原生 bitemporal） |
| AI 友好 | 强 | 中-强 |

**实战关系**：Anchor Modeling 几乎是"工程版的本体"。两者可以叠加：Anchor → 同步为 RDF → 进入 KG → 支持 GraphRAG。

#### 2.4.3 Anchor Modeling vs 事件溯源（Event Sourcing）

| 维度 | 事件溯源 | Anchor Modeling |
|---|---|---|
| 形态 | 不可变事件流 | 不可变 Attribute 流 |
| 查询 | 事件回放 | 时态切片 |
| 状态 | 派生（projection） | 直接查询 |
| 适用 | 业务事件 | 业务状态 |
| 性能 | 中（事件回放慢） | 中（多 Attribute JOIN） |

**实战关系**：两者思想高度相似（不可变事件 + 时态），但 Anchor Modeling 偏"状态建模"，事件溯源偏"事件建模"。

#### 2.4.4 什么时候该用 Anchor Modeling？

- **应该用**：字段变化 ≥ 每周 10 个 + 时态要求极致 + 需要保留完整历史 + 字段类型会演化
- **不应该用**：字段稳定 + 时态要求弱 + 查询性能要求极高（Anchor 的多 Attribute JOIN 性能较差）

---

- [§3. 设计模式与范式](04-anchor-modeling-section-3-sec3.md)
- [§4. 工程实现](04-anchor-modeling-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](04-anchor-modeling-section-5-ai.md)
- [§6. 落地实践](04-anchor-modeling-section-6-sec6.md)
- [§8. 面试真题集](04-anchor-modeling-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](04-anchor-modeling-section-3-sec3.md)
- [§4. 工程实现](04-anchor-modeling-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](04-anchor-modeling-section-5-ai.md)
- [§6. 落地实践](04-anchor-modeling-section-6-sec6.md)
- [§8. 面试真题集](04-anchor-modeling-section-8-sec8.md)

---
