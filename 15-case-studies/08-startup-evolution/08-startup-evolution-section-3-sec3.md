> 本文件是 **08-startup-evolution.md** 的子文件（§3. 架构演进）。完整章节请回到 [index](08-startup-evolution.md)。

## 3. 架构演进

### 3.1 阶段 1：种子轮（0 → A 轮前）

#### 3.1.1 推荐栈

```
[业务系统] → [SaaS 分析工具] → [决策]
              (Mixpanel / Amplitude / Segment)
```

**核心工具**：

- **业务分析**：Stripe Dashboard / Chargebee / ProfitWell（如果是 SaaS）。
- **用户行为分析**：Mixpanel / Amplitude / Heap。
- **网站分析**：Google Analytics / Plausible。
- **A/B 测试**：GrowthBook / Statsig / PostHog。

**架构特点**：

- **完全 SaaS 化**——不自建任何基础设施。
- **按月付费**——成本可控。
- **快速启动**——1 周内可以上线。

#### 3.1.2 数据规模

- 日活 < 1 万。
- 日事件 < 100 万。
- 报表 < 50 个。

#### 3.1.3 团队

- 1 个工程师兼数据。
- 1 个产品经理兼分析。

#### 3.1.4 关键决策

- **不建仓**——完全 SaaS 化。
- **不招数据团队**——工程师兼数据。
- **专注留存指标**——DAU / WAU / MAU。

### 3.2 阶段 2：A 轮（A 轮 → B 轮前）

#### 3.2.1 推荐栈

```
[业务系统] → [SaaS 分析 + 数据仓库] → [决策]
              (Mixpanel + Snowflake)
```

**核心工具**：

- **数据仓库**：Snowflake / BigQuery / Redshift。
- **数据转换**：dbt（Data Build Tool）。
- **BI 工具**：Looker / Mode / Metabase。
- **A/B 测试**：Statsig / GrowthBook。
- **特征平台**：暂不需要（业务量级不到）。

**架构特点**：

- **第一次建仓**——但使用云数仓，不需要自建。
- **第一次建指标**——但使用 dbt 标准化。
- **数据团队 1–3 人**——分析师 + 工程师。

#### 3.2.2 数据规模

- 日活 1 万 → 100 万。
- 日事件 100 万 → 1 亿。
- 报表 50 → 500 个。

#### 3.2.4 关键决策

- **使用 dbt**——建立指标 / 模型 / 血缘。
- **使用云数仓**——不自建 Hadoop。
- **专注用户行为**——Mixpanel + 自有数据双轨。

### 3.3 阶段 3：B 轮（B 轮 → C 轮前）

#### 3.3.1 推荐栈

```
[业务系统] → [Kafka / Segment] → [云数仓] → [dbt] → [BI / ML]
              (事件采集)    (Liq)    (转换)   (消费)
```

**核心工具**：

- **事件采集**：Segment / Snowplow / RudderStack。
- **数据仓库**：Snowflake / Databricks。
- **数据转换**：dbt + dbt Cloud。
- **BI**：Looker / Mode / Hex。
- **ML 平台**：Weights & Biases / MLflow / Neptune.ai。
- **特征平台**：Feast / Tecton。

**架构特点**：

- **引入实时**——Kafka / Segment 事件流。
- **引入 ML**——开始有机器学习应用。
- **数据团队 10–20 人**。

#### 3.3.2 数据规模

- 日活 100 万 → 1000 万。
- 日事件 1 亿 → 10 亿。
- 报表 500 → 5000 个。
- 模型 5 → 50 个。

#### 3.3.4 关键决策

- **引入实时**——Kafka / Flink。
- **引入 ML**——ML 平台 + 特征平台。
- **指标治理**——指标集中管理。

### 3.4 阶段 4：C 轮（C 轮 → 独角兽）

#### 3.4.1 推荐栈

```
[业务系统] → [Kafka] → [Lakehouse] → [Spark / Flink] → [BI / ML / AI]
              (事件)    (存储)         (计算)           (消费)
```

**核心工具**：

- **Lakehouse**：Databricks / Snowflake / Iceberg + S3。
- **实时计算**：Flink / Spark Streaming。
- **ML 平台**：Databricks ML / SageMaker / Vertex AI。
- **特征平台**：Tecton / Feast Enterprise / Databricks Feature Store。
- **BI**：Looker / Tableau / Sigma。
- **AI 平台**：OpenAI / Anthropic / Cohere + 自研 RAG。

**架构特点**：

- **Lakehouse 化**——数据湖 + 数据仓库一体化。
- **流批一体**——Kafka + Flink + Iceberg。
- **AI Native**——开始大规模应用 LLM。

**数据团队**：30–50 人。

#### 3.4.2 数据规模

- 日活 1000 万 → 1 亿。
- 日事件 10 亿 → 100 亿。
- 报表 5000 → 5 万个。
- 模型 50 → 500 个。

#### 3.4.3 关键决策

- **Lakehouse**——Databricks / Snowflake。
- **流批一体**——Flink + Iceberg。
- **AI Native**——LLM + RAG + Agent。

### 3.5 阶段 5：独角兽 / 后期

#### 3.5.1 推荐栈

```
[业务系统] → [多区域] → [Lakehouse + 实时] → [AI + ML + Agent]
              (合规)     (存储)                  (智能体)
```

**架构特点**：

- **多区域**——基于多云 / 多区域。
- **AI 全栈**——LLM + Agent + RAG + Multi-modal。
- **联邦治理**——Data Mesh。

**数据团队**：100+ 人。

---
