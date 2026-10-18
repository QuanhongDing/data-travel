# OneService 数据服务化

> **一句话定位**：把企业指标 / 标签 / 维度 / 宽表封装成统一 API，让数据资产「可服务化、可消费、可计量」，是数据中台到 AI 平台的桥梁。

> 本文是 data-travel 项目 [Ch4 · 数据资产化与智能检索](../../README.md) 的子章节（06 OneService 数据服务化）。覆盖 **核心职责② 企业私有数据资产化与智能检索** 中「**数据可服务化**」相关的设计模式与工程实践。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 数据服务化是什么、和数据 API 网关有什么区别？ | §1 |
| OneService 核心设计原则（统一 / 稳定 / 可治理）？ | §2、§3 |
| 阿里 OneService 与开源替代（Hasura / PostgREST / DreamFactory）怎么选？ | §4 |
| 数据服务化在 AI 时代如何与 LLM / Agent 集成？ | §5 |
| 真实落地中的踩坑与治理经验？ | §6 |

---

## 1. 概念与定位

### 1.1 是什么

**学术 / 工业定义**：OneService（统一数据服务化）是阿里数据中台在 2016 年提出的核心思想之一，指**将企业内部的指标、标签、维度、宽表等数据资产封装成统一的 API 服务，对外提供标准化、可治理、可计量的访问入口**。它位于数据中台的「数据应用层」，是连接数据生产者（数仓 / 湖仓）与数据消费者（BI / 报表 / 应用 / Agent）的关键桥梁。

**工程定义**：在数据架构师手里，OneService 是**一份数据资产服务化的方法论 + 一套工程实现**：

- **服务化层**：把 ODS / DWD / DWS / ADS 层的表 / 指标 / 标签封装为 REST / GraphQL / gRPC API。
- **统一入口**：所有数据消费方通过一个统一网关访问数据，避免散落 API。
- **可治理**：限流、鉴权、计量、监控、版本管理、血缘追踪。
- **可发现**：通过元数据目录让消费方知道「有哪些 API 可用」。

**OneService 解决的核心问题**：

1. **数据散落在 100+ 张表**：业务方不知道「该查哪张表」「怎么 JOIN」「指标定义是什么」。
2. **重复造轮子**：每个业务线重复写 ETL + API，烟囱林立。
3. **数据口径不一致**：同一指标在不同 API 中定义不同（GMV、DAU 各种定义）。
4. **数据消费门槛高**：业务方必须懂 SQL + 表结构，效率低。
5. **数据不可计量**：谁访问了什么、花了多少资源、是否合规，无人知晓。

**OneService 的边界**：

| 维度 | OneService | 数据 API 网关 | 数据中台 | 数据目录 |
| --- | --- | --- | --- | --- |
| 核心职责 | 数据资产服务化 | API 流量管理 | 数据全链路 | 资产发现与治理 |
| 输出形态 | REST / GraphQL API | API 路由 + 策略 | 数仓 + 工具链 | 元数据 + 血缘 |
| 用户 | 业务系统 / 应用 | API 调用方 | 数据团队 | 全员 |
| 关注点 | 数据语义统一 | 限流 / 鉴权 | 建模 / 加工 | 可发现 / 可理解 |

> OneService 与「数据 API 网关」（详见 [07-data-api-gateway](../07-data-api-gateway/07-data-api-gateway.md)）是互补关系——OneService 关注「数据语义 + 服务化」，API 网关关注「流量治理 + 工程稳定性」。

### 1.2 为什么需要

**业务驱动力**：

- **数据消费门槛高**：业务团队（运营、产品、客服）不会写 SQL，需要「点选式」数据消费。
- **数据口径混乱**：同一指标在不同报表中定义不同，决策层困惑。
- **重复建设**：每个 BI 报表、每个应用都重复 ETL + 写 API。
- **数据治理难**：没有统一的「数据出口」，无法做权限、计量、审计。
- **AI 时代新需求**：LLM / Agent 需要「自然语言 → 数据 API」的桥梁，OneService 是关键。

**痛点**：

1. **「找数难」**：业务方不知道「数据在哪」「怎么查」。
2. **「懂数难」**：业务方必须懂表结构、JOIN 逻辑、SQL。
3. **「用数难」**：API 不稳定、口径不一致、调用门槛高。
4. **「管数难」**：数据消费无法计量、无法审计、无法治理。
5. **「AI 用数难」**：LLM 无法直接消费原始表，需要结构化 API。

**AI 时代的新诉求**：

- **Agent 需要「结构化数据 API」**：Agent 调用 API 而不是写 SQL。
- **「自然语言 → SQL → API」**：LLM 把自然语言转 API 调用。
- **「Text-to-API」**：Snowflake Cortex Analyst、Databricks Genie 等「自然语言查询」平台的核心是 OneService。
- **「Function Calling 数据服务」**：把 OneService API 注册成 Agent Tool。

### 1.3 在 AI 时代数据架构中的位置

**OneService 在数据架构中的位置**：

```
   [数据源]
      ↓
   [ODS / DWD / DWS / ADS] ← Ch3 数据全栈
      ↓
   [OneService 服务化层] ← 本文
      ↓                    ↓
   [BI / 报表]         [Agent / LLM Tool]
                            ↓
                     [Function Calling]
```

- **上游**：依赖 Ch1（建模）+ Ch3（数据全栈）+ Ch11（数据治理）。
- **下游**：被 BI / 报表 / 数据应用 / Agent / LLM 调用。
- **横向**：与数据目录（Ch4-08）、API 网关（Ch4-07）、统一查询网关（Ch4-09）、指标平台（Ch4-10）协同。

**OneService 在 AI 平台中的角色**：

- **是 Agent 的「数据工具箱」**：Agent 通过 Function Calling 调用 OneService API。
- **是 LLM 的「结构化数据源」**：LLM 无法直接读数据库，通过 OneService 转 API。
- **是数据治理的「出口」**：所有数据消费可计量、可审计、可治理。
- **是 AI 时代的「数据中间层」**：连接原始数据与 AI 应用。

**一句话判断**：**「OneData 管数据怎么存、OneService 管数据怎么用」——前者是数据中台的内功，后者是数据中台对外的窗口。没有 OneService，数据中台只是「更花哨的数仓」。**

### 1.4 演进历程

**传统 BI 阶段（1990-2010）**：

- 报表工具（Crystal Reports、BO）直接连数据库。
- 没有「数据服务」概念，只有「数据库 + 报表」。
- 数据消费高度依赖技术团队。

**数据平台阶段（2010-2015）**：

- 数仓 + BI 平台（Tableau、Power BI）。
- 出现「数据集市」「数据 API」概念。
- 散落 API，烟囱林立。

**数据中台阶段（2015-2020）**：

- 阿里首次系统化提出「OneData + OneService + OneID」三大方法论。
- 指标平台、标签平台、宽表平台出现。
- 统一服务化成为数据中台标配。

**AI 原生阶段（2020+）**：

- LLM / Agent 时代，OneService 成为 AI 与数据的桥梁。
- Text-to-API、Function Calling 数据服务出现。
- Snowflake Cortex Analyst、Databricks Genie 把 OneService 推到 LLM 时代。

**一句话总结**：**OneService 从「传统报表 API」→「数据集市 API」→「数据中台统一服务」→「AI 时代的 Function Calling 数据源」四阶段演进，今天是 LLM 应用不可或缺的基础设施。**

---

## 2. 核心原理

### 2.1 关键概念定义

- **数据服务（Data Service）**：把数据表 / 指标 / 标签封装成 API 的工程实体。
- **指标（Metric）**：原子化的业务度量（如 GMV、DAU、转化率）。OneService 的核心服务对象。
- **派生指标（Derived Metric）**：基于原子指标 + 维度 + 修饰词计算（如「新用户 GMV」）。
- **维度（Dimension）**：观察数据的角度（如时间、地区、用户分层）。
- **标签（Tag / Label）**：用户 / 物品的画像属性（如「高价值用户」「流失风险」）。
- **宽表（Wide Table）**：预 JOIN 好的大表，供 API 直接查询。
- **API 编排（API Orchestration）**：把多个原子 API 组合成复杂 API。
- **数据网关（Data Gateway）**：所有数据 API 的统一入口（详见 [07-data-api-gateway](../07-data-api-gateway/07-data-api-gateway.md)）。
- **元数据目录（Metadata Catalog）**：所有数据资产的注册中心（详见 [08-data-catalog](../08-data-catalog/08-data-catalog.md)）。
- **Text-to-API**：LLM 把自然语言转 API 调用（Snowflake Cortex、Databricks Genie）。
- **Function Calling**：LLM 调用预注册的工具（含 OneService API）。
- **指标平台（Metric Platform）**：指标定义 + 指标计算 + 指标服务一体化（详见 [10-metric-platform](../10-metric-platform/10-metric-platform.md)）。
- **API 版本管理（API Versioning）**：API 演进不破坏调用方。
- **数据契约（Data Contract）**：数据生产方与消费方之间的「数据 SLA」（schema、口径、更新频率）。

### 2.2 数学 / 形式化基础

OneService 的本质是「**数据资产 → API** 的转换」：

```
API = f(Table, Metric Definition, Dimension, Filter, Access Policy)
```

其中：

- `Table`：物理表（MySQL / Hive / Iceberg / ClickHouse）。
- `Metric Definition`：指标口径（如 GMV = SUM(order_amount WHERE status='paid')）。
- `Dimension`：维度（如 time、region、user_segment）。
- `Filter`：过滤条件（时间范围、权限范围）。
- `Access Policy`：访问策略（谁能调、能调什么、QPS 限制）。

**指标计算的形式化**：

```
派生指标 = 原子指标 × 维度 × 修饰词 × 时间周期

例：新用户 GMV（最近 7 天）
= SUM(order_amount)
WHERE is_new_user = TRUE AND order_time >= now() - 7d
GROUP BY date
```

**API 调用形式化**：

```
GET /api/v1/metric/gmv?dim=date&filter=is_new_user:true&time_range=last_7d

→ 200 OK
{
  "data": [
    {"date": "2025-10-01", "value": 1234567},
    {"date": "2025-10-02", "value": 1345678}
  ],
  "meta": {"metric": "gmv", "version": "v1", "definition_id": "metric_001"}
}
```

**Text-to-API 的形式化**：

```
Question: "上个季度北京新用户 GMV"
  ↓ LLM 意图理解
{
  "metric": "gmv",
  "filter": "is_new_user=true, city=beijing",
  "time_range": "last_quarter",
  "dim": "date"
}
  ↓ API 调用
GET /api/v1/metric/gmv?dim=date&filter=is_new_user:true,city:beijing&time_range=last_quarter
```

### 2.3 关键算法 / 方法

**指标管理方法**：

1. **原子化建模**：所有指标拆成「原子指标 + 修饰词 + 时间周期 + 维度」。
2. **口径管理**：每个指标有版本化的定义（SLA Owner）。
3. **指标血缘**：指标定义 → SQL → 表字段，全链路追踪。
4. **指标评测**：定期验证指标计算正确性。

**API 设计方法**：

1. **REST 风格**：`GET /api/v1/{entity}/{action}?{filters}`。
2. **GraphQL**：单 endpoint，按需字段（适合 BI）。
3. **RPC / gRPC**：高性能场景。
4. **SQL-like API**：允许参数化 SQL（PostgREST）。

**Text-to-API 方法**：

1. **Schema 注入**：把指标 / 维度 / 过滤词的 schema 注入 LLM prompt。
2. **Few-shot**：用示例教会 LLM 转换。
3. **校验层**：LLM 输出后用 schema / parser 校验。
4. **Human-in-the-Loop**：低置信度转人工。

**缓存策略**：

1. **结果缓存**：相同 query 缓存结果（Redis）。
2. **物化缓存**：指标预计算到 ClickHouse / Doris。
3. **分级缓存**：粗粒度 → 细粒度逐级下钻。

**权限模型**：

1. **行级权限**：WHERE 条件按用户权限过滤。
2. **列级权限**：敏感字段脱敏。
3. **指标级权限：禁止访问某些指标。**

### 2.4 与相邻概念的关系

- **OneService vs Data API Gateway**：OneService 关注「数据语义 + 服务化」，API 网关关注「流量治理 + 工程稳定性」。两者协同：OneService 提供 API，API 网关做限流 / 鉴权 / 监控。
- **OneService vs Data Catalog**：OneService 是「数据 → API」的转换，Data Catalog 是「数据 → 元数据」的可发现性。OneService API 注册到 Data Catalog 中。
- **OneService vs Metric Platform**：Metric Platform 是 OneService 的子集，专注「指标」的服务化。OneService 还包括标签 / 维度 / 宽表 / 数据库表。
- **OneService vs Unified Query Gateway**：OneService 是「预定义 API」（指标 / 标签），Unified Query Gateway 是「联邦查询」（跨源 SQL）。详见 [09-unified-query-gateway](../09-unified-query-gateway/09-unified-query-gateway.md)。
- **OneService vs Data API**：Data API 是 OneService 的输出形态之一。OneService 是方法论 + 平台，Data API 是接口。
- **OneService vs Data Product**：Data Product 是「面向业务的数据包」，OneService 是「数据服务化的工程实现」。Data Product 可能通过 OneService 暴露。

> 💡 **思考锚点**：看你们对外暴露的数据接口：§2.3 的权限模型三档——行级、列级、指标级——你们做到哪一档？若只到行级，一个不该看某敏感指标的业务方，是被哪一档挡住的？再按 §2.4 把它们分一次类：哪些是预定义 API（OneService 形态）、哪些本该留给联邦查询（Unified Query Gateway）——若探索性需求也被做成了预定义 API，你的接口数就是随业务问题数线性涨的，你现在维护着几个？

---

- [§3. 设计模式与范式](06-one-service-section-3-sec3.md)
- [§4. 工程实现](06-one-service-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](06-one-service-section-5-ai.md)
- [§6. 落地实践](06-one-service-section-6-sec6.md)
- [§7. 与其他方法对比](06-one-service-section-7-sec7.md)
- [§8. 面试真题集](06-one-service-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](06-one-service-section-3-sec3.md)
- [§4. 工程实现](06-one-service-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](06-one-service-section-5-ai.md)
- [§6. 落地实践](06-one-service-section-6-sec6.md)
- [§7. 与其他方法对比](06-one-service-section-7-sec7.md)
- [§8. 面试真题集](06-one-service-section-8-sec8.md)

---
