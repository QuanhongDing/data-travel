# Data Vault

> **一句话定位**：以 Hub-Link-Satellite 三件套 + 全量历史审计，构建可演化的企业级敏捷数仓。

> 本文是 data-travel 项目 [Ch1 · 建模方法论](../../README.md) 的子章节（03-data-vault）。覆盖 R3 数据建模相关的"敏捷数仓建模、可演化架构、数据血缘与审计、AI 原生集成"核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| Data Vault 是什么、解决什么问题 | §1.1、§1.2 |
| 三件套（Hub / Link / Satellite）到底怎么设计 | §2.1、§3.1 |
| 如何把传统 Kimball 仓库迁移到 Data Vault | §4.1、§3.3 |
| 多源并发入仓、缓慢变化维、CDC 怎么落地 | §3.3、§4.2 |
| Data Vault 在湖仓、LLM、Agent 时代的新角色 | §5.1—§5.4 |
| 决策树：我的业务该选 Kimball、Data Vault 还是 Anchor | §7.5 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：Data Vault 是一种面向企业级数据仓库的**建模范式**，由 Dan Linstedt 于 1990 年代提出，并在 2013 年迭代为 Data Vault 2.0。它把业务实体抽象为 **Hub**（业务键）、**Link**（关系）、**Satellite**（属性与时态上下文）三类构件，通过哈希键 + 全量追加 + 软删除实现"全程审计 + 100% 可追溯 + 高度可演化"的数据底座。

**工程定义**：Data Vault 是介于 3NF（高度规范化）与星型模型（高度反规范化）之间的"中间形态"建模方法，专门解决以下工程痛点：

1. **多源并发入仓**：每个 Hub / Link / Satellite 都是一个独立的、可并行加载的物理表，互不依赖。
2. **可演化**：业务新增字段或新增实体时，只新增一个 Satellite，不修改任何已有表。
3. **全量历史**：天然保留所有时态信息（业务时态、加载时态、删除时态），不需要拉链表 / 触发器。
4. **跨域追溯**：所有 Hub 之间通过 Link 互联，所有变更通过 Satellite 留痕，能回答"这个客户 2018 年的地址是什么"。

**核心问题**：解决"既要敏捷（频繁加字段、加实体）、又要严谨（数据血缘、审计、合规）、还要适配多源异构数据源"的根本矛盾——而 3NF 太死、星型模型太脆、纯湖仓太乱。

**与"传统 3NF / 维度建模"的边界**：

| 维度 | 3NF（Inmon） | 星型（Kimball） | Data Vault |
| --- | --- | --- | --- |
| 数据冗余 | 低 | 高（反规范化） | 中（Satellite 可重复） |
| 加字段成本 | 高（改表） | 高（改宽表） | 极低（加 Satellite） |
| 历史追溯 | 需手工实现 | 缓慢变化维（SCD） | 原生（全量追加） |
| 查询性能 | 差 | 优（反规范化） | 中（需 PIT / Bridge 加速） |
| 适用阶段 | 1→10 集成 | 10→100 消费 | 0→1 入仓 + 多源整合 |

### 1.2 为什么需要

#### 业务驱动力

1. **数据量爆炸**：当企业进入 PB 级、源系统每天数十亿条变更（CDC）时，传统星型模型每次加字段都需要全表重写或重建 DWD 层，成本不可承受。
2. **业务复杂度指数级上升**：一个零售企业的产品维度可能涉及商品、品牌、SKU、SPU、类目、促销、税率、监管编码等几十个属性，全部塞到一个宽表里会导致维度表宽度突破 200 列，索引效率与维护性急剧下降。
3. **多源合规**：金融、医疗、汽车行业普遍要求"任何数据点的来源、修改时间、修改人可追溯"，传统建模在审计维度上几乎是裸奔的。

#### 痛点（没有 Data Vault 时的失败案例）

**案例 1：电商大促期间 DWD 重建失败**
某头部电商 2020 年大促前需要在订单事实表加一个"优惠分摊金额"字段。传统做法是 DWD 层全量重跑，结果发现：

- 涉及订单、支付、优惠三个域共 12 张表的 JOIN，集群资源 100% 占用
- 重跑耗时 18 小时，错过大促上线窗口
- 最终被迫采用"事后补丁"：在 DWD 层临时加列 + 手工回填，丢失了部分历史一致性

**案例 2：金融客户主数据无法追溯**
某城商行 2019 年监管检查时被要求"证明某客户 2017 年的开户支行是哪家"。传统 Kimball 星型模型只保留了"当前支行"维度属性，2017 年之前的支行信息被覆盖。监管认为这是"数据真实性问题"，项目被罚款 800 万 + 整改半年。

**案例 3：跨境电商 12 个源系统集成崩溃**
某跨境电商 ERP、CRM、SCM、4 个三方支付、3 个物流、3 个营销系统共 12 个源。Kimball 模式下，每个源系统都要在 DWD 层做一遍清洗 + 反规范化，5 年下来 DWD 层共 380 张表，新增一个源要改 30+ 张表，最后团队放弃了数仓转型，回到 Excel。

#### AI 时代的新诉求

1. **结构化语义**：LLM/Agent 需要的不仅是数据，更是"结构化语义元数据"。Data Vault 的 Hub-Link-Satellite 本质上是一个**可被自动遍历的元数据图**，非常适合 AI Agent 进行 schema 推理。
2. **可推理**：每个 Satellite 都有明确的"哪个 Hub + 哪个时间窗"的上下文，Agent 可以基于 Satellite 的元数据自动推导"这个属性在 2020 年的有效值是什么"。
3. **可检索**：Data Vault 的标准化结构让"全局元数据索引"成为可能——Hub 表天然就是全局实体字典，Link 表就是全局关系字典，Agent 可以直接遍历这两个字典做实体识别与关系抽取。
4. **可演化**：AI 时代的业务变化最大、模型迭代最快，传统星型模型每次迭代都要 DDL 变更 + 全量重跑，Data Vault 的"加 Satellite 不改表"特性让 schema 演化几乎零成本。

### 1.3 在 AI 时代数据架构中的位置

Data Vault 在整个数据架构栈中的位置如下：

```
源系统 ──> ODS（贴源层）──> Data Vault（Raw Vault + Business Vault）──> Data Mart（Kimball 星型 / 反规范化）──> 应用
                                 │
                                 └──> 向量化 / GraphRAG / Agent 消费
```

- **数仓分层中的位置**：Data Vault 通常位于 **DWD 与 DWS 之间**，作为"集成区 / 历史区 / 审计区"。Raw Vault 保持完全贴源，Business Vault 做一些业务规则、轻度汇总。
- **湖仓中的位置**：在 Lakehouse（Delta Lake / Iceberg / Hudi）架构下，Data Vault 表天然适配湖仓的 ACID 表 + 时间旅行能力，每个 Satellite 都是一个独立的 Iceberg 表，加载即可读取历史快照。
- **智能体平台中的位置**：Data Vault 的 Hub/Link 元数据是 Agent 进行"数据资产发现 + 数据语义推理"的最佳入口。阿里云 DataWorks、华为 FusionInsight、Databricks Unity Catalog 都已经把 Data Vault 风格的元数据层作为内置能力。
- **本体建模与 KG 中的位置**：Hub 表 = 实体字典、Link 表 = 关系字典、Satellite 表 = 属性字典。Data Vault 几乎是"关系型版本的弱本体"。你可以把 Data Vault 当作"工程层的本体"——虽然不是严格的 RDF / OWL，但已经具备可被 AI 自动遍历的语义骨架。

**一句话判断**：Data Vault 是"建表（ODS）→ 建模型（DWD）（Data Vault）→ 建消费（DWS / Data Mart）"链条中的 **DWD 层**——是源系统与分析消费之间的"结构化集成层"。

### 1.4 演进历程

#### 1.4.1 传统阶段（1990s–2010s）

- 1990s：Dan Linstedt 在美国国防部 / Kaiser Permanente 等项目里首次提出 Data Vault 1.0
- 2001：Dan Linstedt 发布第一版 Data Vault 规范
- 2007：Data Vault 1.0 成熟，主要在金融、保险、医疗等强审计行业落地
- 核心矛盾：**传统数仓太慢、太脆、太难演化**

#### 1.4.2 大数据阶段（2010s–2020）

- 2013：Data Vault 2.0 发布，加入并行加载、实时计算、NoSQL、云计算等适配
- 2015：在大数据平台（Hadoop / Spark）上落地，Data Vault 开始走出传统行业
- 2018：Hash Key + 多租户 + 软删除（Effectivity Satellite）成熟
- 2020：Data Vault + Lakehouse（Delta Lake）开始融合
- 核心矛盾：**单点数据中心→分布式数据中心；离线→实时；结构化→半结构化**

#### 1.4.3 AI 原生阶段（2020+，LLM + Agent 驱动）

- 2021：Databricks Lakehouse + Data Vault 2.0 成为新基线
- 2023：LLM 出现，Data Vault 的标准化结构被用于"自动元数据发现 + 自动数据文档生成"
- 2024：Microsoft Fabric、Databricks Unity Catalog、阿里云 DataWorks 都内置了 Data Vault 风格的元数据湖
- 2025：Agent 平台开始把 Data Vault 的 Hub/Link/Satellite 作为"自动 schema 演化 + 自动数据血缘"的载体
- 核心矛盾：**人工建模→AI 辅助建模；批量全量→实时增量；结构固定→持续演化**

**一句话总结**：每阶段的核心矛盾都是"**业务变化速度 vs 模型变化成本**"——Data Vault 通过"加 Satellite 不改表"从根本上解决了这个矛盾。

---

## 2. 核心原理

### 2.1 关键概念定义

Data Vault 的核心构件只有八类，但组合方式非常灵活：

| 概念 | 英文 | 一句话定义 | 工程对应 |
| --- | --- | --- | --- |
| 业务键 | Hub | 一个业务实体的唯一标识（如客户 ID、订单 ID） | 1 张物理表 / 实体 |
| 关系 | Link | 两个或多个 Hub 之间的业务关系（如客户-订单-商品） | 1 张物理表 / 关系 |
| 属性 | Satellite | Hub 或 Link 的描述性属性（如客户的姓名、地址、状态） | 1 张物理表 / 上下文 |
| 状态时点表 | PIT（Point-In-Time） | 把多个 Satellite 的同一时态切片拼成"那一刻的完整画像" | 视图 / 物化视图 |
| 桥接表 | Bridge | 把多个 Link 链式拼接成"多跳关系" | 视图 / 物化视图 |
| 生效卫星 | Effectivity Satellite | 记录"记录何时生效、何时失效"的 Satellite | 用于软删除 / GDPR |
| 多活动卫星 | Multi-Active Satellite | 同一 Hub 有多个业务键（如客户既有手机号又有邮箱） | 复杂场景 |
| 同义卫星 | Same-As Link / Satellite | 跨域实体的等价关系（如 CRM 客户 = ERP 客户） | 主数据 / OneID |

**最关键的三个原语**：

1. **Hub = 业务键 + 元数据**：每个 Hub 都有一个业务键（Business Key）+ 加载时间 + 来源系统，**绝不包含任何描述性字段**。
2. **Link = 关系键 + 元数据**：每个 Link 包含两个或多个 Hub 的 Hash Key + 加载时间 + 来源系统，**绝不包含任何业务属性**。
3. **Satellite = 属性 + 时态 + 来源**：每个 Satellite 挂在一个 Hub 或 Link 上，包含所有描述性字段 + 生效时间 + 加载时间 + 来源系统，**全量追加、永远不修改**。

### 2.2 数学/形式化基础

#### 2.2.1 集合论视角

Data Vault 的整个模型可以被形式化为以下集合运算：

- 设 $H = \{h_1, h_2, \dots, h_m\}$ 为所有 Hub 的集合
- 设 $L = \{l_1, l_2, \dots, l_n\}$ 为所有 Link 的集合，每个 $l_i \subseteq H \times H \times \dots$（"$l_i$ 是若干 Hub 的笛卡尔子集）
- 设 $S = \{s_1, s_2, \dots, s_p\}$ 为所有 Satellite 的集合，每个 $s_j$ 是某个 Hub 或 Link 的属性函数
- Data Vault 的整个图 = $(H, L, S)$ 的并集

#### 2.2.2 时态扩展（bitemporal）

Data Vault 是天然的双时态（bitemporal）模型：

- **业务时态** $T_{biz}$：业务事件实际发生的时间（如订单创建时间）
- **加载时态** $T_{load}$：数据被加载到仓库的时间（如 ETL 落库时间）
- **删除时态** $T_{del}$：数据被标记为失效的时间（通过 Effectivity Satellite 实现）

任意一条 Satellite 记录都有 $(T_{biz}, T_{load}, T_{del})$ 三元组，可以回答"**在任意业务时间窗 + 任意加载时间窗** 下，这个实体的状态是什么"。

#### 2.2.3 哈希键（Hash Key）规范

Data Vault 2.0 强制使用 MD5 / SHA-1 / SHA-256 等哈希算法为每个 Hub、Link 生成确定性哈希键：

```text
Hub_Hash_Key = MD5(Concatenate(Source_System, Business_Key))
Link_Hash_Key = MD5(Concatenate(Hub1_Hash_Key, Hub2_Hash_Key, ..., Link_Type))
```

**作用**：

1. **跨源等价判定**：同样的业务键在不同源系统下生成相同 Hash Key → 自然实现"跨源实体统一"。
2. **确定性 ID**：Hub 的 Hash Key 是稳定的，不会因为业务键变化而变化。
3. **空间效率**：定长 16/32/64 字节哈希键比变长业务键更适合做索引。

### 2.3 关键算法/方法

#### 2.3.1 并行加载算法（Parallel Loading）

Data Vault 的核心加载模式：

```
顺序：
  Stage → Raw Vault (并行：Hub + Link + Satellite) → Business Vault → Data Mart

并行：
  Stage.Hub_Customer      ─┐
  Stage.Hub_Order         ─┤
  Stage.Hub_Product       ─┼─> Raw Vault (并行)
  Stage.Link_Customer_Order─┤
  Stage.Sat_Customer_Demo  ─┤
  Stage.Sat_Order_Header  ─┤
                            ┘
```

**特点**：每个 Hub / Link / Satellite 是独立的物理表，加载顺序可以任意调度。任意一个 Satellite 加载失败不影响其他 Satellite。**这是 Data Vault 最大的工程价值之一**——你可以在同一个 Spark 作业里并行加载 100 张 Satellite，把传统 ETL 的"串行等待"变成"并行吞吐"。

#### 2.3.2 增量 CDC 算法（Change Data Capture）

Data Vault 的 Satellite 本质上是一个**追加写（append-only）**的变更流：

- **INSERT**：新业务键首次出现 → 新增 Hub + Sat 一行
- **UPDATE**：业务键已存在但属性变化 → Satellite 新增一行（旧行保留）
- **DELETE**：业务键被标记为删除 → Effectivity Satellite 新增一行（T_del = now），原行保留
- **REPLAY**：数据库为这种情况 → 通过 T_load < 业务时态识别"晚到的真相"

**与传统 SCD（缓慢变化维）的对比**：

| 操作 | SCD Type 2 | Data Vault Satellite |
|---|---|---|
| INSERT | 新增 + 起始日期 | 新增 Hub + Sat |
| UPDATE | 新增一行 + 起始日期 / 结束日期 | Sat 新增一行 |
| DELETE | 标记结束日期 | Effectivity Sat 标记 T_del |
| 查询时 | 需要过滤"当前有效行" | 需要聚合到"查询时点的有效行" |
| 空间成本 | 中（每行 1 个版本） | 高（每变更 1 行） |
| 时间成本 | 中（JOIN 时过滤） | 高（GROUP BY 时聚合） |

#### 2.3.3 PIT 表算法（Point-In-Time）

PIT 表是一个预聚合视图，把多个 Satellite 在某个时间点 $T$ 的"当前有效版本"拼成一张"那一刻的完整画像"：

```sql
-- 伪代码
CREATE VIEW pit_customer AS
SELECT
  h.customer_hash,
  s_demo.load_datetime AS demo_load,
  s_addr.load_datetime AS addr_load,
  s_status.load_datetime AS status_load,
  -- 切片：取每个 Satellite 在 T 时刻的最新版本
  LAST_VALUE(s_demo.name) OVER (PARTITION BY h.customer_hash ORDER BY s_demo.load_datetime) AS name,
  LAST_VALUE(s_addr.address) OVER (PARTITION BY h.customer_hash ORDER BY s_addr.load_datetime) AS address,
  LAST_VALUE(s_status.status) OVER (PARTITION BY h.customer_hash ORDER BY s_status.load_datetime) AS status
FROM hub_customer h
LEFT JOIN sat_customer_demo s_demo ON h.customer_hash = s_demo.customer_hash
LEFT JOIN sat_customer_addr s_addr ON h.customer_hash = s_addr.customer_hash
LEFT JOIN sat_customer_status s_status ON h.customer_hash = s_status.customer_hash;
```

**作用**：PIT 表是 Data Vault 与下游消费层之间的"加速器"，避免每次查询都要全量扫描 Satellite。

#### 2.3.4 Bridge 表算法（多跳关系）

Bridge 表把多个 Link 链式拼接成"多跳关系"：

```sql
-- 伪代码：客户 → 订单 → 商品
CREATE VIEW bridge_customer_product AS
SELECT DISTINCT
  l_co.customer_hash,
  l_op.order_hash,
  l_op.product_hash
FROM link_customer_order l_co
JOIN link_order_product l_op ON l_co.order_hash = l_op.order_hash;
```

**作用**：把多跳 JOIN 提前物化，避免每次查询都做 N 张表的链式 JOIN。

#### 2.3.5 同义链接算法（Same-As Link）

Same-As Link 是跨域实体等价关系：

```text
hub_customer (CRM 系统)    ┐
                           ├── link_customer_same ──> hub_customer_unified
hub_customer (ERP 系统)    ┘
```

**作用**：天然实现 OneID 主数据 / 跨域实体统一。每个 Same-As Link 都是一条"等价边"，Agent 可以自动遍历这条边做实体对齐。

### 2.4 与相邻概念的关系

#### 2.4.1 Data Vault vs 3NF

| 维度 | 3NF | Data Vault |
|---|---|---|
| 加字段 | 改表（DDL） | 加 Satellite（新表） |
| 多源 | 难（JOIN 爆炸） | 易（多套 Satellite） |
| 历史 | 弱 | 强（全量追加） |
| 查询性能 | 差 | 中（需 PIT 加速） |
| 适用 | 单一源系统 OLTP | 多源系统 DW |

#### 2.4.2 Data Vault vs 维度建模

| 维度 | 维度建模（Kimball） | Data Vault |
|---|---|---|
| 形态 | 事实表 + 维度表 | Hub + Link + Satellite |
| 性能 | 高（反规范化） | 中（需 PIT / Bridge） |
| 加字段 | 改维度表 | 加 Satellite |
| 适用 | Data Mart / ADS 层 | 集成层 / DWD 层 |

**实战关系**：**用 Data Vault 做集成层（DWD），用维度建模做消费层（ADS / Data Mart）**。这是最常见的组合方式。

#### 2.4.3 Data Vault vs 本体建模（Ontology）

| 维度 | 本体建模 | Data Vault |
|---|---|---|
| 形态 | RDF / OWL 三元组 | Hub / Link / Satellite 表 |
| 推理 | 强（推理机） | 弱（SQL JOIN） |
| 标准化 | 高（W3C 标准） | 中（Dan Linstedt 规范） |
| 工程落地 | 难（图数据库） | 易（关系数据库） |
| AI 友好 | 强（语义清晰） | 中（结构清晰但无语义层） |

**实战关系**：Data Vault 是"工程层的本体"，本体建模是"语义层的本体"。两者可以叠加——Data Vault 表 → 同步为 RDF 三元组 → 进入本体知识图谱。

#### 2.4.4 什么时候该用 Data Vault？

- **应该用**：源系统 ≥ 5 个、业务变化频繁、合规审计要求高、需要保留全量历史、要支撑多个下游消费场景
- **不应该用**：单一源系统 + 业务稳定 + 没有合规要求 + 主要查询是 OLAP 报表（直接用维度建模更高效）

> 💡 **思考锚点**：把你的源系统数量对照 §2.4.4 的「≥5 个」这条线数一遍，再列出真正需要按任意历史时点回看的下游有几个——如果两项都落在「不应该用」那一侧，那么你为 Hub/Link/Satellite 三层结构付出的加载规范维护成本，换的是哪一条你当下用不到的时点正确性？

---

- [§3. 设计模式与范式](03-data-vault-section-3-sec3.md)
- [§4. 工程实现](03-data-vault-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](03-data-vault-section-5-ai.md)
- [§6. 落地实践](03-data-vault-section-6-sec6.md)
- [§7. 与其他方法对比](03-data-vault-section-7-sec7.md)
- [§8. 面试真题集](03-data-vault-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](03-data-vault-section-3-sec3.md)
- [§4. 工程实现](03-data-vault-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](03-data-vault-section-5-ai.md)
- [§6. 落地实践](03-data-vault-section-6-sec6.md)
- [§7. 与其他方法对比](03-data-vault-section-7-sec7.md)
- [§8. 面试真题集](03-data-vault-section-8-sec8.md)

---
