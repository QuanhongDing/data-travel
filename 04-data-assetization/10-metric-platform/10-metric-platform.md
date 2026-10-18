# 指标平台（Metric Platform）

> **一句话定位**：把指标定义、计算、服务化、口径治理一体化——One Metric One Definition，让 LLM / Agent 也能「自然语言查询指标」。

> 本文是 data-travel 项目 [Ch4 · 数据资产化与智能检索](../../README.md) 的子章节（10 指标平台）。覆盖 **核心职责② 企业私有数据资产化与智能检索** 中「**指标资产化与服务化**」相关的架构、引擎、AI 集成与演进。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 指标平台是什么、和传统数仓指标有什么区别？ | §1 |
| 原子指标 / 派生指标 / 修饰词的设计？ | §2、§3 |
| dbt Semantic Layer / Cube / MetricFlow / Airbnb Minerva 怎么选？ | §4 |
| 2024-2025 自然语言查询指标（Snowflake Cortex Analyst）？ | §5 |
| 指标血缘 / 指标治理 / 落地踩坑？ | §6 |

---

## 1. 概念与定位

### 1.1 是什么

**学术 / 工业定义**：指标平台（Metric Platform / Metric Store）是**把企业指标定义、计算口径、查询服务、治理一体化**的数据资产平台。它把传统数仓的「报表里写死的指标」抽象为「可治理、可服务化、可被 AI 消费」的指标资产。代表产品包括 dbt Semantic Layer、Cube / Cube.js、Airbnb Minerva、MetricFlow、阿里指标平台、字节指标平台、OSCAR、Snowflake Cortex Analyst、Databricks Genie。

**工程定义**：在数据架构师手里，指标平台是**一份指标资产化与服务化的基础设施**：

- **指标定义**：原子指标 + 修饰词 + 时间周期 + 维度 = 派生指标。
- **指标计算**：自动从原始表生成 SQL。
- **指标服务**：通过 API 暴露（REST / GraphQL）。
- **指标治理**：统一口径、Owner、血缘、SLA。
- **AI 集成**：自然语言查询（Text-to-Metric）、Agent 工具。

**指标平台 vs 数仓指标**：

| 维度 | 数仓指标 | 指标平台 |
| --- | --- | --- |
| 定义方式 | SQL 硬编码 | 平台化定义 |
| 口径治理 | 弱 | 强（Owner + SLA） |
| 服务化 | 散落 API | 统一 API |
| 血缘 | 表级 | 指标级 |
| 复用度 | 低（重复计算） | 高（一次定义） |
| AI 集成 | 无 | 自然语言查询 |
| 工具 | 阿里 / 字节数仓 | dbt Semantic Layer / Cube |

### 1.2 为什么需要

**业务驱动力**：

- **「口径混乱」**：同一指标（GMV、DAU）在不同报表定义不同。
- **「重复计算」**：每个 BI 报表重复 ETL。
- **「指标无服务」**：业务方想用指标，必须找数据团队开发。
- **「AI 无法消费」**：LLM 无法直接读 SQL 表，需要结构化指标 API。
- **「Agent 需要指标查询」**：Agent 必须能查「上个季度 GMV」。

**痛点**：

1. **「同一个 GMV 5 个数」**：不同部门 5 个 GMV 定义，决策混乱。
2. **「报表无法复用」**：每个 BI 报表重写 SQL。
3. **「业务方等数据」**：业务方想看指标，数据团队排期 2 周。
4. **「无指标血缘」**：指标改了不知道影响哪些报表。
5. **「LLM 无法查询指标」**：LLM 不知道指标定义、口径。

**AI 时代的新诉求**：

- **「Text-to-Metric」**：业务方说「Q3 GMV」，LLM 转 API 查询。
- **「指标即 Agent Tool」**：Agent 调用指标 API。
- **「指标语义化」**：LLM 理解指标定义、口径、维度。
- **「指标 + RAG」**：指标 + 文档混合查询。

### 1.3 在 AI 时代数据架构中的位置

```
   [数据源]
      ↓
   [数仓 / 湖仓]
      ↓
   [指标平台] ← 本文
   定义 → 计算 → 服务化
      ↓
   [BI / 报表]   [Agent / LLM Tool]   [Text-to-Metric]
```

- **上游**：Ch1 建模、Ch3 数据全栈。
- **下游**：Ch4-06 OneService、Ch4-07 数据 API 网关、Ch5 Agent 平台。
- **横向**：与数据目录（Ch4-08）、统一查询网关（Ch4-09）深度协同。

**一句话判断**：**「没有指标平台，就没有 AI 时代的数据消费」——指标平台是企业 LLM / Agent 落地的基础设施。**

### 1.4 演进历程

**传统报表阶段（2000-2015）**：

- 报表里硬编码 SQL 指标。
- 散落、无治理。

**数据中台阶段（2015-2020）**：

- 阿里「OneMetric」方法论：原子指标 + 修饰词 + 时间周期 + 维度。
- 阿里 / 字节 / 美团指标平台。

**开源工具阶段（2020-2023）**：

- **2020**：Airbnb Minerva 开源（指标定义 + 查询）。
- **2021**：Cube.js 流行（指标 API 平台）。
- **2022**：dbt Semantic Layer 推出。
- **2022**：MetricFlow（dbt 收购）开源。

**AI 原生阶段（2023+）**：

- **2023**：Snowflake 收购 Neeva（自然语言查询）。
- **2024**：Snowflake Cortex Analyst（自然语言查询指标）。
- **2024**：Databricks Genie（自然语言查询）。
- **2024**：阿里 Quick BI + 通义。
- **2025**：指标 + RAG + Agent 主流化。

---

## 2. 核心原理

### 2.1 关键概念定义

- **原子指标（Atomic Metric）**：不可再分的基础度量（如「订单金额」「用户数」）。
- **派生指标（Derived Metric）**：原子指标 + 修饰词 + 时间周期 + 维度（如「新用户 GMV」）。
- **修饰词（Modifier）**：指标的限定条件（如「新用户」「付费」）。
- **时间周期（Time Grain）**：日 / 周 / 月 / 季度 / 年。
- **维度（Dimension）**：观察指标的角度（地区 / 用户分层 / 渠道）。
- **指标口径（Metric Definition）**：指标的 SQL / 业务定义。
- **指标 Owner**：指标的负责人（一般是业务方）。
- **指标血缘（Metric Lineage）**：指标 → 派生表 → 原始表。
- **指标语义层（Semantic Layer）**：指标定义 + 维度 + 计算的统一抽象（dbt Semantic Layer）。
- **Cube.js**：开源指标 API 平台。
- **MetricFlow**：dbt 开源指标定义框架。
- **Airbnb Minerva**：指标定义 + 查询框架。
- **OSCAR**：指标平台框架。
- **LookML**：Looker 的指标定义语言。
- **Snowflake Cortex Analyst**：自然语言查询指标平台。
- **Databricks Genie**：自然语言查询平台。
- **指标服务化（Metric as a Service）**：把指标封装成 API。
- **Text-to-Metric**：LLM 把自然语言转指标 API 调用。
- **指标 API（Metric API）**：暴露指标的接口（REST / GraphQL）。

### 2.2 数学 / 形式化基础

**指标的形式化定义**：

```
派生指标 = 原子指标 × 修饰词 × 时间周期 × 维度

例：
原子指标：GMV = SUM(order_amount WHERE status='paid')
修饰词：新用户（is_new_user = true）
时间周期：最近 7 天（order_date >= now() - 7d）
维度：城市

派生指标 = SUM(order_amount)
        WHERE status='paid' AND is_new_user = true
        GROUP BY city, date
```

**MetricFlow / dbt 的 YAML 定义**：

```yaml
metric:
  name: new_user_gmv
  type: derived
  type_params:
    expr: order_amount
    metrics:
      - name: order_amount
    filter: |
      {{ Dimension('order__is_new_user') }} = true
  filter: |
    {{ TimeDimension('metric_time', 'day') }} >= '2025-10-01'
  agg: sum
  agg_time_dimension: metric_time
  dimensions:
    - city
    - user_segment
```

**Cube.js 的 JavaScript 定义**：

```javascript
cube(`Orders`, {
  measures: {
    gmv: {
      sql: `amount`,
      type: `sum`,
      filters: [{ sql: `${CUBE}.\`status\` = 'paid'` }]
    },
    newUserGmv: {
      sql: `amount`,
      type: `sum`,
      filters: [
        { sql: `${CUBE}.\`status\` = 'paid'` },
        { sql: `${CUBE}.\`is_new_user\` = 'true'` }
      ]
    }
  },
  dimensions: {
    city: { sql: `city`, type: `string` },
    orderDate: { sql: `order_date`, type: `time` }
  }
});
```

**Text-to-Metric 的形式化**：

```
Question: "上个季度北京新用户 GMV"
  ↓ LLM 意图理解
{
  "metric": "new_user_gmv",
  "filter": "city = 'Beijing'",
  "time_range": "last_quarter"
}
  ↓ API 调用
GET /api/v1/metric/new_user_gmv?filter=city:Beijing&time_range=last_quarter
  ↓ 结果
[{ "date": "2025-Q3", "value": 1234567 }]
```

### 2.3 关键算法 / 方法

**指标建模方法**：

1. **原子化建模**：所有指标拆成最小原子（订单金额、用户数）。
2. **修饰词扩展**：通过修饰词派生新指标（避免重复定义）。
3. **维度建模**：Kimball 维度建模（详见 Ch1）。
4. **指标血缘**：指标 → SQL → 表 → 字段。

**指标计算优化**：

1. **预计算**：高频指标预计算到 ClickHouse / Doris。
2. **物化视图**：OLAP 引擎物化视图（StarRocks / Doris）。
3. **增量计算**：监听原始表变更，增量更新指标。
4. **下推优化**：把计算下推到 OLAP 引擎。

**指标治理方法**：

1. **Owner 制度**：每个指标有 Owner。
2. **口径评审**：指标变更需评审。
3. **SLA 监控**：指标计算延迟 / 准确率 SLA。
4. **版本管理**：指标定义版本化。
5. **废弃机制**：长期不用指标废弃。

**Text-to-Metric 方法**：

1. **Schema 注入**：把指标 / 维度 / 修饰词的 schema 注入 LLM prompt。
2. **Few-shot**：用示例教会 LLM 转换。
3. **校验层**：用 schema / parser 校验 LLM 输出。
4. **Human-in-the-Loop**：低置信度转人工。

### 2.4 与相邻概念的关系

- **指标平台 vs OneService**：指标平台专注「指标」，OneService 包含指标 / 标签 / 宽表 / API。
- **指标平台 vs 数据目录**：指标平台是「指标定义 + 计算」，数据目录是「元数据可发现」。
- **指标平台 vs 标签平台**：指标平台是「度量」（GMV、DAU），标签平台是「属性」（用户分层）。
- **指标平台 vs RAG**：RAG 是「文档问答」，指标平台是「指标问答」。
- **指标平台 vs Agent**：Agent 调用指标 API 完成数据查询。

---

- [§3. 设计模式与范式](10-metric-platform-section-3-sec3.md)
- [§4. 工程实现](10-metric-platform-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](10-metric-platform-section-5-ai.md)
- [§6. 落地实践](10-metric-platform-section-6-sec6.md)
- [§7. 与其他方法对比](10-metric-platform-section-7-sec7.md)
- [§8. 面试真题集](10-metric-platform-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](10-metric-platform-section-3-sec3.md)
- [§4. 工程实现](10-metric-platform-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](10-metric-platform-section-5-ai.md)
- [§6. 落地实践](10-metric-platform-section-6-sec6.md)
- [§7. 与其他方法对比](10-metric-platform-section-7-sec7.md)
- [§8. 面试真题集](10-metric-platform-section-8-sec8.md)

---
