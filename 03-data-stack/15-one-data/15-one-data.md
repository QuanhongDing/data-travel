# OneData 思想（阿里数据中台方法论）

> **一句话定位**：以 OneModel + OneID + OneService 三件套为核心的阿里数据中台方法论，是企业级数据资产化与统一服务的"标准范式"。

> 本文是 data-travel 项目 [Ch3 · 数据全栈基础设施](../../README.md) 的子章节（**15 OneData 思想**）。覆盖 **R4 数据全栈协同** 能力领域中「数据中台方法论、OneModel / OneID / OneService、AI 增强演进」相关的核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| OneData 到底是什么？跟数据中台什么关系？ | §1.1 |
| OneModel / OneID / OneService 三件套怎么落地？ | §2.1 |
| OneData 4.0 跟 1.0 / 2.0 / 3.0 有什么区别？ | §5.3 |
| 阿里 / 字节 / 美团的数据中台怎么落地？ | §6.1 |
| AI 增强的 OneData 怎么演进？ | §5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：OneData 是阿里巴巴于 2015-2016 年提出的**企业级数据中台方法论**，核心是"一套数据标准、一套数据模型、一套数据服务"。其内涵是：

- **OneModel（统一数据模型）**：全企业级公共数据模型，分层建模（ODS / DWD / DWS / ADS）。
- **OneID（统一数据身份）**：跨业务域统一实体 ID（用户、商品、订单等）。
- **OneService（统一数据服务）**：标准化 API + 指标平台，对外提供统一数据消费。

**工程定义**：在数据架构师手里，OneData 是**一份以"数据资产化 + 统一服务"为核心的企业级数据治理与价值释放体系**。核心特征：

- **数据资产化**：把数据当作可治理、可量化的资产。
- **统一标准**：指标口径、维度口径、数据模型统一。
- **统一服务**：通过 API / 指标平台对外提供服务。
- **复用为荣**：一次定义、多处复用。

**与数据中台的关系**：

- **数据中台 = 数据 + 技术 + 组织 + 流程**的综合体。
- **OneData = 数据中台中"数据"部分的方法论**。
- **OneData 是阿里数据中台的"灵魂"**。

### 1.2 为什么需要

**业务驱动力**：

- **数据孤岛**：每个业务线独立建设数仓，重复、口径混乱。
- **指标打架**：销售部 GMV = 100 亿，财务部 GMV = 80 亿。
- **重复开发**：每个 BI 都重新抽取数据。
- **数据不可信**：业务不敢用数据决策。
- **AI 训练缺数据**：没有统一资产，AI 训练样本稀缺。

**痛点（没有 OneData 的代价）**：

1. **重复建设**：100+ 报表、100+ 重复抽取链路。
2. **指标混乱**：同指标多版本，决策层困惑。
3. **数据不可信**：业务不敢用数据。
4. **AI 缺数据**：没有统一数据资产。
5. **组织割裂**：每个业务线一个数据团队，效率低。

**AI 时代的新诉求**：

- **高质量训练数据**：AI 需要统一、干净、可追溯的数据。
- **统一特征工程**：OneID 让用户 / 商品特征统一。
- **指标语义层**：LLM 需要可消费的指标。
- **统一 API**：Agent 通过统一 API 访问数据。

### 1.3 在 AI 时代数据架构中的位置

```
[业务系统]
    ↓
[OneData 数据中台]
    ├── OneModel（统一数据模型）
    ├── OneID（统一实体身份）
    └── OneService（统一数据服务）
    ↓
[BI / AI / Agent / 业务应用]
```

**OneData 是数据栈的"资产化核心"**：把数据从"原料"变成"产品"。

### 1.4 演进历程

**第一阶段：传统数仓（2000-2014）**

- 企业级数仓（Inmon / Kimball）。
- 烟囱式建设，重复开发。

**第二阶段：阿里 OneData 诞生（2015-2016）**

- 2015：阿里巴巴正式提出 OneData。
- 2016：阿里数据中台战略升级。
- 核心：OneModel + OneID + OneService。

**第三阶段：OneData 1.0-3.0（2017-2022）**

- 2017：OneData 1.0（MaxCompute 体系）。
- 2019：OneData 2.0（实时化 + 指标平台）。
- 2021：OneData 3.0（云原生 + DataWorks 一站式）。

**第四阶段：OneData 4.0（2023-至今）**

- 2023：OneData 4.0（AI 增强）。
- 2024：通义数智 + OneData 4.0 商业化。
- 2025：AI 原生 OneData（指标语义层 + 向量库 + LLM）。

**第五阶段：数据中台 2.0（2024-至今）**

- 2024：数据中台 + Data Fabric + Data Mesh。
- 2025：联邦数据中台、AI 自治中台。

**一句话总结**：**OneData 从"传统数仓"→"数据中台方法论"→"云原生"→"AI 增强"→"AI 原生"五阶段演进，今天是数据中台的"标准范式"。**

---

## 2. 核心原理

### 2.1 关键概念定义

**OneModel（统一数据模型）**：

- 全企业级公共数据模型。
- 分层：ODS（贴源）→ DWD（明细）→ DWS（汇总）→ ADS（应用）。
- 公共层 + 业务层 + 应用层。

**OneID（统一数据身份）**：

- 跨业务域统一实体 ID。
- 用户 OneID、商品 OneID、订单 OneID、门店 OneID。
- 技术：ID-Mapping（图计算）、强 ID、弱 ID。

**OneService（统一数据服务）**：

- 标准化 API + 指标平台 + 数据应用门户。
- 工具：阿里 DataWorks、阿里云数据服务、Quick BI。

**指标平台（Metric Platform）**：

- 一次定义指标、多处复用。
- 指标语义层（Metric Layer）。
- 工具：阿里云指标平台、Apache Doris Cube、MetricFlow。

**DataWorks**：

- 阿里云一站式数据开发治理平台。
- 集成：开发、调度、运维、质量、安全、血缘。

**MaxCompute**：

- 阿里云自研大规模离线计算平台。
- SQL + MR + Spark + 机器学习。

**Hologres**：

- 阿里云实时交互式分析引擎。
- 对标 ClickHouse / StarRocks。

**DataPhin（数据治理）**：

- 阿里云数据治理套件。
- 集成：质量、血缘、安全、生命周期。

### 2.2 数学 / 形式化基础

**OneID 的 ID-Mapping 数学模型**：

```
OneID = f(StrongID, WeakIDs)
StrongID = 手机号 / 身份证 / UID
WeakIDs = 设备 ID / Cookie / 邮箱
```

通过图计算（Graph Computing）关联同一实体的多个 ID。

**指标的形式化**：

```
Metric = (Name, Definition, Formula, Source, Owner, Version)

Definition: 自然语言 + 业务定义
Formula: 原子指标 + 派生公式
Source: 源数据表
Owner: 业务负责人
Version: 语义版本
```

**数据资产化的形式化**：

```
Asset = (Table, Schema, Owner, Quality, Security, Lifecycle)
```

**数据血缘的形式化**：

```
Lineage = Directed Graph (Table → Table)
         + Column-Level Mapping
```

### 2.3 关键算法 / 方法

**1. OneModel 分层建模**

```sql
-- ODS 层（贴源）
CREATE TABLE ods_orders (
  order_id BIGINT,
  user_id BIGINT,
  amount DECIMAL(18, 2),
  order_time TIMESTAMP
);

-- DWD 层（明细）
CREATE TABLE dwd_orders (
  order_id BIGINT,
  user_id BIGINT,  -- OneID
  product_id BIGINT,  -- OneID
  amount DECIMAL(18, 2),
  coupon_amount DECIMAL(18, 2),
  order_time TIMESTAMP,
  dt DATE
) PARTITIONED BY (dt);

-- DWS 层（主题汇总）
CREATE TABLE dws_user_daily_orders (
  user_id BIGINT,  -- OneID
  dt DATE,
  gmv DECIMAL(18, 2),
  orders INT,
  -- 公共汇总粒度
);

-- ADS 层（应用）
CREATE TABLE ads_user_profile (
  user_id BIGINT,
  total_gmv DECIMAL(18, 2),
  last_order_time TIMESTAMP,
  vip_level STRING
);
```

**2. OneID 图计算**

```sql
-- 通过 ID-Mapping 生成 OneID
-- 输入：用户多端 ID（手机 / 设备 / Cookie / UID）
-- 输出：统一 OneID

-- 阿里 ID-Mapping 工具（自研）
SELECT 
  uid,
  device_id,
  phone,
  email,
  one_id  -- 统一 OneID
FROM id_mapping_result;
```

**3. 指标平台（OneService）**

```yaml
# 指标定义（指标平台）
metric:
  name: gmv
  description: 商品交易总额
  type: simple
  measure: total_order_amount
  filter: "{{ Dimension('order__is_paid') }} = 'true'"
  owner: data-team
  version: 1.0

metric:
  name: paid_orders
  description: 已支付订单数
  type: simple
  measure: count_orders
  filter: "{{ Dimension('order__is_paid') }} = 'true'"

derived_metric:
  name: arpu
  description: 单用户平均收入
  type: ratio
  numerator: gmv
  denominator: paid_users
```

**4. DataWorks 一站式**

```python
# DataWorks Python SDK
from dataworks import DataWorks

dw = DataWorks(access_key='xxx', secret='xxx')

# 提交数据开发任务
dw.submit_sql_task(
    name='daily_orders',
    sql='INSERT INTO dwd_orders SELECT * FROM ods_orders WHERE dt = "${biz_date}";',
    schedule='0 2 * * *',
    dependencies=['ods_orders']
)

# 血缘追踪
lineage = dw.get_lineage(table='dwd_orders')
```

**5. 实时 OneData（OneData 2.0+）**

```sql
-- 实时 DWS（Flink + Hologres）
CREATE TABLE dws_user_realtime_orders (
  user_id BIGINT,
  window_start TIMESTAMP,
  window_end TIMESTAMP,
  gmv DECIMAL(18, 2),
  orders BIGINT
);
-- Flink 实时聚合 + Hologres OLAP 查询
```

**6. AI 增强 OneData（OneData 4.0）**

```python
# AI 驱动的指标生成
# LLM 自动从业务需求生成指标定义

business_requirement = "我需要看每月的 GMV 趋势"

# LLM 自动生成：
generated_metric = {
    'name': 'monthly_gmv',
    'description': '每月商品交易总额',
    'type': 'simple',
    'formula': 'SUM(amount) GROUP BY YEAR_MONTH',
    'source': 'dwd_orders',
}
```

### 2.4 与相邻概念的关系

**OneData vs 数据中台**：

- 数据中台：综合工程。
- OneData：方法论。

**OneData vs 数据治理**：

- 数据治理：质量、血缘、安全。
- OneData：治理 + 建模 + 服务。

**OneData vs Data Mesh / Data Fabric**：

- OneData：中心化数据中台。
- Data Mesh：去中心化、领域自治。
- Data Fabric：自动化数据集成。

---

- [§3. 设计模式与范式](15-one-data-section-3-sec3.md)
- [§4. 工程实现](15-one-data-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](15-one-data-section-5-ai.md)
- [§6. 落地实践](15-one-data-section-6-sec6.md)
- [§7. 与其他方法对比](15-one-data-section-7-sec7.md)
- [§8. 面试真题集](15-one-data-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](15-one-data-section-3-sec3.md)
- [§4. 工程实现](15-one-data-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](15-one-data-section-5-ai.md)
- [§6. 落地实践](15-one-data-section-6-sec6.md)
- [§7. 与其他方法对比](15-one-data-section-7-sec7.md)
- [§8. 面试真题集](15-one-data-section-8-sec8.md)

---
