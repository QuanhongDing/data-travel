# 数据可观测性（Data Observability）

> **一句话定位**：把"新鲜度 / 完整性 / 准确性 / 体积 / Schema"五大数据信号 + 血缘 + 告警分级 + AIOps 串成一套"主动监控 + 智能归因 + 自动修复"的数据可观测平台，让数据故障在 5 分钟内被发现、30 分钟内被定位、2 小时内被修复。

> 本文是 data-travel 项目 [Ch11 · 横切工程](../../README.md) 的子章节（**04 数据可观测性**）。覆盖 **R7 横切能力（质量 / 可观测 / 成本 / 安全）** 中「数据可观测性」的五大支柱、监控架构、AIOps、告警分级、根因分析与 OpenLineage / DataHub / Monte Carlo 等新一代数据可观测平台。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 数据可观测性与系统可观测性的异同？ | §1.1、§2.4 |
| 数据可观测性五大支柱是什么？怎么工程化？ | §1.1、§2.1 |
| 数据可观测性平台怎么架构？Metrics / Logs / Traces 怎么设计？ | §3.1、§4.1 |
| 告警分级怎么做？P0/P1/P2/P3 怎么定？ | §4.2、§4.3 |
| AIOps 在数据可观测里怎么用？异常检测 / 根因分析怎么做？ | §3.3、§5.1 |
| 怎么从 0 到 1 建设数据可观测性？ | §6.1、§6.3 |
| OpenLineage / DataHub / Monte Carlo / Bigeye / Soda 怎么选型？ | §4.3、§7.1 |
| 数据可观测性与数据血缘、可观测性的关系？ | §1.3、§5.2 |
| AI 时代的 LLM/Agent 与可观测性结合？ | §5.1、§5.2 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：数据可观测性（Data Observability）是 2020 年由 Monte Carlo Data 提出的概念，借鉴系统可观测性（Observability）的思想，目标是回答"我的数据是否健康"。Gartner 在 2022 年将"Data Observability"列入 Hype Cycle for Data and Analytics。

**核心定义**：可观测性的数学基础是控制论——通过**外部输出**推断**系统内部状态**。在数据领域，就是通过数据"输出指标"推断数据"内部健康"。

**五大支柱**（Monte Carlo Data 提出，行业共识）：

| 支柱 | 含义 | 典型指标 | 异常表现 |
| --- | --- | --- | --- |
| **Freshness（新鲜度）** | 数据从产生到可消费的时延 | `MAX(update_time) - NOW()` | 数据"过期" |
| **Volume（体积）** | 数据行数 / 字节数是否符合预期 | `row_count`, `byte_count` | 行数突增 / 骤减 |
| **Schema（结构）** | 表结构 / 字段类型 / 列数变更 | `column_count`, `column_types` | 字段新增 / 删除 / 类型变更 |
| **Quality（质量）** | 数据值是否符合预期 | `null_rate`, `unique_rate`, `valid_rate` | 空值率飙升、重复值增加 |
| **Lineage（血缘）** | 数据流转路径与依赖 | upstream / downstream 拓扑 | 上游变更未通知下游 |

**第六支柱（2024 补充）**：**Distribution（分布）**——监控数据分布（均值 / 方差 / 直方图）漂移。

**工程定义**：在数据架构师手里，数据可观测性是一套**「指标采集 → 异常检测 → 告警分级 → 根因分析 → 自动修复」**的闭环工程体系。包含五大组件：

1. **指标采集（Metrics Collection）**：按调度频率采集各支柱指标。
2. **时序存储（Time-Series Storage）**：存储历史指标，支持查询与可视化。
3. **异常检测（Anomaly Detection）**：3-sigma、IQR、ML 等方法识别异常。
4. **告警引擎（Alerting Engine）**：分级告警 + 路由到 oncall。
5. **根因分析（RCA, Root Cause Analysis）**：结合血缘、依赖关系定位根因。

**与"系统可观测性"的对比**：

| 维度 | 系统可观测性（SRE） | 数据可观测性 |
| --- | --- | --- |
| **核心对象** | 服务、进程、容器 | 表、字段、值 |
| **核心指标** | QPS、延迟、错误率、CPU | Freshness、Volume、Quality、Schema、Lineage |
| **监控方式** | Metrics / Logs / Traces | 数据指标 + Schema 感知 + 血缘 |
| **故障表现** | 5xx、Timeout、Crash | 数据过期 / 错误值 / 行数异常 / Schema 漂移 |
| **数据源** | Prometheus、Jaeger、ELK | Monte Carlo、Bigeye、Soda、Datafold |
| **故障单位** | 服务级别 | 表 / 字段级别 |
| **故障定位** | 日志 + Trace | 血缘 + 指标趋势 + 业务反馈 |

**与"数据质量"的对比**：

| 维度 | 数据质量（DQ） | 数据可观测性 |
| --- | --- | --- |
| **核心驱动** | 规则（Rule-based） | 指标（Metric-based） |
| **配置方式** | 人工写规则 | 自动学习基线 |
| **覆盖度** | 已写规则的字段 | 全量字段（自动发现） |
| **告警密度** | 规则覆盖范围 | 异常点 |
| **关系** | DQ 是可观测性的一种实现 | 可观测性是 DQ 的超集 |

**关系图**：

```
                ┌──────────────────┐
                │ 数据可观测性       │
                │  (Data Obs.)      │
                └──────────────────┘
                       ↑ 包含
                ┌──────────────────┐
                │ 数据质量 (DQ)     │
                └──────────────────┘
                       ↑ 包含
                ┌──────────────────┐
                │ 监控 + 告警       │
                └──────────────────┘
```

### 1.2 为什么需要

**业务驱动力**：

1. **数据故障比系统故障影响大**：系统故障往往是"挂掉"，影响 5%-30% 用户；数据故障往往是"悄悄出错"，影响 100% 数据使用方。
2. **数据驱动决策的脆弱性**：Gartner 估算企业平均每年因数据质量问题损失 1500 万美元（2024 数据），其中 50% 来自"未及时发现的故障"。
3. **AI 时代放大效应**：LLM 训练数据出错，模型效果衰减，且**难以发现**——等到用户投诉才发现。
4. **复杂数据生态**：多源、多链路、多消费者，故障点呈指数级增长。
5. **SRE 文化的迁移**：从系统 SRE 到数据 SRE，是必然趋势。

**痛点**：

1. **"故障是被业务方发现的"**：业务方反馈"报表数据不对"时，故障已经发生 N 小时。
2. **"难以定位根因"**：数据链路长，上游错导致下游错，谁是源头？
3. **"告警噪声大"**：硬编码阈值导致大促期间大量误报。
4. **"规则覆盖不全"**：人工写规则只能覆盖 20% 关键字段，80% 字段无监控。
5. **"多团队甩锅"**：源头团队、数据团队、消费方互相甩锅。

### 1.3 在 AI 时代数据架构中的位置

```
              [源头系统]
                  ↓
            数据可观测性平台 ←─ 采集五大支柱指标
                  ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   实时监控            离线监控
   (Flink)           (Spark/Airflow)
        ↓                   ↓
        └─────────┬─────────┘
                  ↓
            时序存储
         (Prometheus / TSDB)
                  ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   异常检测            告警引擎
   (ML)              (PagerDuty)
        ↓                   ↓
        └─────────┬─────────┘
                  ↓
            根因分析
         (血缘 + 拓扑)
                  ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   自动修复            业务感知
   (Agent)           (SLA)
```

**数据可观测性 × AI 时代的协同**：

1. **AIOps 介入**：用 ML 自动识别异常、自动归因。
2. **LLM 辅助**：自动解释异常、推荐修复方案。
3. **Agent 修复**：自动修复常见故障（如重启任务、回刷数据）。
4. **RAG 集成**：把可观测性知识库喂给 RAG，让业务方自然语言查询"订单表最近为什么有延迟"。

**与其他横切能力的关系**：

- **数据质量**（§1）：可观测性是 DQ 的超集。
- **血缘**（§5/§9）：血缘是可观测性的"定位工具"。
- **数据安全**（§2）：安全事件需要可观测（异常访问）。
- **数据成本**（§3）：成本指标也是可观测性的一部分。
- **数据可观测性 + AI**：AIOps / Agent 是 AI 时代的新形态。

**一句话判断**：**P7 会"看指标"，P8 会"基于指标决策"，资深数据架构师会让"指标自己说话、自己告警、自己修复"——可观测性是数据平台的"神经系统"。**

### 1.4 演进历程

**传统阶段（2000s–2010）**：

- 2003：基于日志的关键指标监控（Cacti、Nagios）。
- 2006：Ganglia 用于集群监控。
- 2010：系统可观测性概念提出（Twitter、Facebook）。

**大数据与系统可观测性时代（2010–2020）**：

- 2012：Prometheus 1.0 发布（时序数据库 + PromQL）。
- 2015：OpenTracing 规范发布（链路追踪）。
- 2018：OpenTelemetry 统一 metrics / logs / traces。
- 2019：Monte Carlo Data 成立，提出 Data Observability。

**数据可观测性时代（2020–2025）**：

- 2020：Monte Carlo A 轮 1500 万美元；Bigeye 成立。
- 2021：Anomalo、Mona 成立；DataDog 收购 Data Observability 公司。
- 2022：Gartner 将 Data Observability 列入 Hype Cycle。
- 2023：OpenLineage 1.0 发布（统一血缘规范）；Databricks 收购 Datafold。
- 2024：Snowflake 推出 Native Observability；Mona 推出 AI Quality Copilot；Anomalo 推出 Autonomous 模式。
- 2025：LLM-AIOps 成为新趋势，可观测性 Agent 开始试点。

---

## 2. 核心原理

### 2.1 关键概念定义

| 概念 | 定义 | 与可观测性的关系 |
| --- | --- | --- |
| **Metrics（指标）** | 可聚合的数值度量 | 五大支柱指标 |
| **Logs（日志）** | 离散事件记录 | 任务日志、错误日志 |
| **Traces（追踪）** | 跨系统的请求链路 | 数据血缘的"运行版" |
| **SLI（Service Level Indicator）** | 服务质量指标 | 完整性、准确性、新鲜度 |
| **SLO（Service Level Objective）** | 服务质量目标 | "完整性 ≥ 99.9%" |
| **SLA（Service Level Agreement）** | 服务质量承诺 | 合同级 SLO |
| **Anomaly（异常）** | 与预期不符的状态 | 异常检测的目标 |
| **Root Cause（根因）** | 故障的最初源头 | RCA 的目标 |
| **Data Drift（数据漂移）** | 数据分布偏离预期 | 分布异常的工程化表达 |
| **Schema Drift（Schema 漂移）** | 表结构变化 | Schema 异常的工程化表达 |
| **AIOps** | AI 驱动的运维 | 可观测性的智能化 |
| **UEBA** | 用户实体行为分析 | 安全可观测性 |
| **Runbook** | 操作手册 | 告警 + 修复流程 |

### 2.2 数学/形式化基础

**异常检测形式化**：

设指标时序 $X = \{x_1, x_2, ..., x_t\}$，检测异常：

1. **3-sigma**：

$$
\text{Anomaly} = \{x_t : |x_t - \mu| > 3\sigma\}
$$

其中 $\mu, \sigma$ 是历史窗口的均值和标准差。

2. **IQR**：

$$
\text{Anomaly} = \{x_t : x_t > Q_3 + 1.5 \cdot IQR \lor x_t < Q_1 - 1.5 \cdot IQR\}
$$

3. **孤立森林（Isolation Forest）**：

构建 $N$ 棵随机树，计算每个点的"平均路径长度" $E(h(x))$。异常点平均路径长度更短。

$$
s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}
$$

其中 $c(n) = 2H(n-1) - \frac{2(n-1)}{n}$，$H$ 是调和数。

4. **KS 检验（分布漂移）**：

$$
D_{n,m} = \sup_x |F_n(x) - F_m(x)|
$$

若 $D_{n,m} > c(\alpha)\sqrt{\frac{n+m}{nm}}$，拒绝同分布假设。

**SLI / SLO 形式化**：

$$
\text{SLI} = \frac{\text{好事件数}}{\text{总事件数}}
$$

$$
\text{SLO} = \text{SLI} \geq 1 - \text{ErrorBudget}
$$

**Error Budget（错误预算）**：

$$
\text{ErrorBudget} = 1 - \text{SLO} = \text{允许失败的比例}
$$

例如，SLO = 99.9%，月度错误预算 = 43.2 分钟。

### 2.3 关键算法/方法

**1. 异常检测算法**：

| 算法 | 适用 | 优势 | 劣势 |
| --- | --- | --- | --- |
| **3-sigma** | 正态分布、稳定指标 | 简单、快 | 假设强 |
| **IQR** | 非正态 | 简单 | 极端值敏感 |
| **EWMA** | 慢漂移 | 适应趋势 | 反应慢 |
| **STL 分解** | 季节性 | 自动分解 | 参数敏感 |
| **孤立森林** | 多维、非线性 | 无需训练 | 不适合时序 |
| **LSTM-AE** | 复杂时序 | 自动学习 | 训练成本高 |
| **Prophet** | 业务时序 | 自动季节性 | 大数据量慢 |
| **Transformer 时序** | 最新（2024） | 精度高 | 算力贵 |

**2. 根因分析算法**：

- **图遍历（Graph Traversal）**：基于血缘图，反向 BFS 定位根因。
- **社区发现（Community Detection）**：识别异常聚类。
- **PageRank 变体**：在血缘图中识别"关键节点"。
- **贝叶斯网络（Bayesian Network）**：基于因果关系的概率推理。
- **随机游走（Random Walk）**：从异常节点反向追溯概率最高的根因。

**3. 告警收敛（Alert Aggregation）**：

把同一根因的多个告警合并为一个：

- **按血缘聚合**：上游异常 → 多个下游告警 → 收敛为 1 个上游告警。
- **按时间聚合**：N 分钟内重复告警合并。
- **按业务聚合**：按业务域聚合。

**4. 自动修复算法**：

- **回滚（Rollback）**：恢复到上一个健康版本。
- **回刷（Backfill）**：重跑 ETL。
- **补偿（Compensation）**：增量修复。
- **源头修复（Source Fix）**：推动源头系统修复。

### 2.4 与相邻概念的关系

- **vs 系统可观测性（System Observability）**：数据可观测性借鉴系统可观测性的"指标 + 日志 + 链路"三件套思想，但对象是数据本身。
- **vs 数据质量（Data Quality）**：DQ 是可观测性的一种实现（基于规则）；可观测性是更广义的概念（基于指标 + 自动）。
- **vs 数据血缘（Data Lineage）**：血缘是可观测性的"定位工具"——可观测性发现异常，血缘定位根因。
- **vs AIOps（AI for IT Operations）**：AIOps 是可观测性的"智能化"——用 ML 自动识别异常、自动归因。
- **vs 数据可靠性（Data Reliability）**：可靠性是可观测性的工程化升级，强调 SLA + MTTR 度量。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：指标 + 时序 + 异常检测（Metrics + TSDB + Anomaly）**

经典三层架构：

```
[采集层]  →  [存储层]  →  [计算层]
Metrics      TSDB          异常检测
采集器       Prometheus    ML 模型
                         3-sigma
                         IQR
```

代表工具：**Prometheus + Thanos + 异常检测模型**。

**模式 2：数据可观测性 SaaS（Data Observability as a Service）**

直接接入商业 SaaS：

- 自动采集五大支柱指标。
- 自动 ML 异常检测。
- 自动告警 + 归因。

代表工具：**Monte Carlo、Bigeye、Anomalo、Mona、Soda Cloud**。

**模式 3：元数据驱动可观测性（Metadata-driven Observability）**

把血缘 + Schema + 业务元数据作为可观测性的"驱动"：

- 血缘：自动发现依赖关系。
- Schema：自动感知变更。
- 业务元数据：自动关联 Owner、SLA。

代表工具：**DataHub、Apache Atlas、Unity Catalog**。

**模式 4：流式可观测性（Streaming Observability）**

针对实时数据流：

- Flink + Prometheus 指标导出器。
- Kafka 健康监控。
- 流处理任务延迟监控。

代表工具：**Ververica Platform、Confluent Control Center、Pravega 监控**。

**模式 5：AI 驱动可观测性（AIOps for Data）**

用 LLM / ML 替代人工：

- 异常自动检测。
- 根因自动定位。
- 修复方案自动推荐。
- Agent 自动修复。

代表工具：**Mona AI Quality Copilot、Datadog AI、New Relic AI、Anomalo Autonomous**。

### 3.2 适用场景决策表

| 场景 | 推荐模式 | 理由 |
| --- | --- | --- |
| **传统企业数仓** | 模式 1 + 模式 3 | 成熟稳定 |
| **数据湖 / Lakehouse** | 模式 2 + 模式 3 | 自动发现能力强 |
| **实时数仓 / 流处理** | 模式 4 | 流式监控需求 |
| **AI 训练数据** | 模式 2 + 模式 5 | 漂移检测 + 自动归因 |
| **多云 / Data Mesh** | 模式 3 + 模式 2 | 跨域 + 自动 |
| **大型互联网** | 模式 2 + 模式 5 | 自动化优先 |
| **早期 0→1** | 模式 1（Prometheus）+ 模式 3 | 低成本起步 |

### 3.3 反模式与陷阱

1. **"指标过多告警疲劳"**：500 个指标、每个都告警 = 没人看。**正确做法**：分级、聚合、抑制。
2. **"硬编码阈值"**：阈值定死，业务变化后失效。**正确做法**：动态阈值、ML 自适应。
3. **"采集过频导致性能问题"**：每分钟采一次大型表，影响生产。**正确做法**：错峰采样、抽样、聚合。
4. **"忽视 Schema 漂移"**：上游加字段，下游没适配。**正确做法**：Schema Registry + 兼容性检查。
5. **"只看指标不看血缘"**：发现问题不知道在哪。**正确做法**：指标 + 血缘联动。
6. **"告警无 oncall"**：告警发出来没人响应。**正确做法**：告警 + oncall + MTTR 度量。
7. **"忽视数据漂移"**：只监控硬指标，分布漂移没人看。**正确做法**：PSI / KS / 孤立森林。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：指标体系建设（2-4 周）**

1. 定义五大支柱指标（Freshness / Volume / Schema / Quality / Lineage + Distribution）。
2. 为每张核心表配置指标采集。
3. 接入时序存储（Prometheus / TSDB）。
4. 配置可视化（Grafana / 自研看板）。

**Step 2：异常检测（2-4 周）**

1. 静态阈值（关键规则）。
2. 动态阈值（3-sigma / IQR）。
3. ML 异常检测（孤立森林 / Prophet / LSTM-AE）。
4. 异常分级（P0/P1/P2/P3）。

**Step 3：告警与 oncall（2-4 周）**

1. 告警路由（钉钉 / 飞书 / PagerDuty）。
2. oncall 排班（Follow-the-sun）。
3. Runbook（每个告警的处置手册）。
4. MTTR 度量与复盘。

**Step 4：血缘集成（4-8 周）**

1. 自动血缘采集（OpenLineage / DataHub）。
2. 血缘可视化（字段级）。
3. 血缘 + 指标联动（异常 → 血缘定位 → 通知上游）。
4. 影响分析（上游变更 → 下游感知）。

**Step 5：智能化升级（4-8 周）**

1. 接入 AIOps（异常自动归因）。
2. LLM 辅助（自然语言查询异常、生成 Runbook）。
3. Agent 自动修复（试点）。
4. RAG 集成（业务方自助查询）。

**Step 6：SLA 与流程（持续）**

1. 与业务方谈 SLA。
2. 月度 SLA 评审。
3. Postmortem 文化。
4. 度量指标：覆盖率、MTTD、MTTR、误报率。

### 4.2 关键技术点

**1. 指标采集架构**：

```python
# metrics_collector.py
# 采集五大支柱指标
from prometheus_client import Gauge, Histogram

freshness_gauge = Gauge(
    'data_freshness_seconds',
    'Data freshness in seconds',
    ['database', 'table', 'column']
)

volume_gauge = Gauge(
    'data_volume_rows',
    'Number of rows',
    ['database', 'table']
)

quality_gauge = Gauge(
    'data_quality_rate',
    'Data quality metric rate (0-1)',
    ['database', 'table', 'column', 'metric_type']
)

schema_gauge = Gauge(
    'data_schema_columns',
    'Number of columns',
    ['database', 'table']
)

distribution_gauge = Gauge(
    'data_distribution_psi',
    'Population Stability Index (PSI)',
    ['database', 'table', 'column']
)


def collect_metrics(table_metadata):
    db, table = table_metadata.database, table_metadata.table
    
    # Freshness
    last_update = get_last_update_time(db, table)
    freshness = (now() - last_update).total_seconds()
    freshness_gauge.labels(db, table, '*').set(freshness)
    
    # Volume
    row_count = get_row_count(db, table)
    volume_gauge.labels(db, table).set(row_count)
    
    # Quality
    for column in table_metadata.columns:
        null_rate = compute_null_rate(db, table, column)
        unique_rate = compute_unique_rate(db, table, column)
        quality_gauge.labels(db, table, column, 'null_rate').set(null_rate)
        quality_gauge.labels(db, table, column, 'unique_rate').set(unique_rate)
    
    # Schema
    schema_gauge.labels(db, table).set(len(table_metadata.columns))
    
    # Distribution
    for column in table_metadata.numeric_columns:
        psi = compute_psi(db, table, column)
        distribution_gauge.labels(db, table, column).set(psi)
```

**2. 异常检测引擎**：

```python
# anomaly_detection.py
from sklearn.ensemble import IsolationForest
import numpy as np

class AnomalyDetector:
    def __init__(self):
        self.iso_forest = IsolationForest(contamination=0.01)
        self.is_trained = False
    
    def detect_3sigma(self, history: list, current: float) -> bool:
        """3-sigma 检测"""
        if len(history) < 30:
            return False
        mean = np.mean(history)
        std = np.std(history)
        return abs(current - mean) > 3 * std
    
    def detect_iqr(self, history: list, current: float) -> bool:
        """IQR 检测"""
        if len(history) < 30:
            return False
        q1, q3 = np.percentile(history, [25, 75])
        iqr = q3 - q1
        return current > q3 + 1.5 * iqr or current < q1 - 1.5 * iqr
    
    def detect_with_ml(self, history_matrix: np.ndarray) -> list:
        """孤立森林检测（多维）"""
        if not self.is_trained:
            self.iso_forest.fit(history_matrix)
            self.is_trained = True
        predictions = self.iso_forest.predict(history_matrix)
        # -1 = 异常, 1 = 正常
        return [i for i, p in enumerate(predictions) if p == -1]
    
    def detect_drift(self, baseline: np.ndarray, current: np.ndarray) -> float:
        """分布漂移检测（PSI）"""
        eps = 1e-10
        psi_values = []
        for i in range(min(baseline.shape[1], current.shape[1])):
            hist_baseline, _ = np.histogram(baseline[:, i], bins=10)
            hist_current, _ = np.histogram(current[:, i], bins=10)
            p = hist_baseline / hist_baseline.sum() + eps
            q = hist_current / hist_current.sum() + eps
            psi = np.sum((p - q) * np.log(p / q))
            psi_values.append(psi)
        return max(psi_values) if psi_values else 0
```

**3. 告警分级与路由**：

```yaml
# alert_rules.yaml（Alertmanager 配置）
groups:
  - name: data_quality_p0
    rules:
      - alert: CriticalDataFreshnessBreach
        expr: data_freshness_seconds > 3600
        for: 5m
        labels:
          severity: P0
          team: data-platform
        annotations:
          summary: "Critical data is stale for {{ $labels.table }}"
          runbook: "https://wiki.example.com/runbook/data-stale"
    
  - name: data_quality_p1
    rules:
      - alert: DataVolumeAnomaly
        expr: |
          abs(data_volume_rows - avg_over_time(data_volume_rows[1h] offset 1d))
            > 3 * stddev_over_time(data_volume_rows[1h] offset 1d)
        for: 10m
        labels:
          severity: P1
          team: data-platform
  
  - name: data_quality_p2
    rules:
      - alert: SchemaDriftDetected
        expr: changes(data_schema_columns[1h]) > 0
        for: 5m
        labels:
          severity: P2
          team: data-platform

# 告警路由
route:
  group_by: ['alertname', 'team']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
    - match:
        severity: P0
      receiver: 'pagerduty-p0'
      group_wait: 10s
    - match:
        severity: P1
      receiver: 'dingtalk-p1'
    - match:
        severity: P2
      receiver: 'email-p2'

receivers:
  - name: 'pagerduty-p0'
    pagerduty_configs:
      - service_key: ${PAGERDUTY_KEY}
  - name: 'dingtalk-p1'
    webhook_configs:
      - url: ${DINGTALK_WEBHOOK}
  - name: 'email-p2'
    email_configs:
      - to: 'data-platform@example.com'
```

**4. 根因分析（基于血缘）**：

```python
# root_cause_analysis.py
from collections import deque

def find_root_cause(lineage_graph, anomaly_node, max_depth=10):
    """
    在血缘图中反向追溯根因。
    lineage_graph: {node: [(parent, edge_type), ...]}
    anomaly_node: 异常的节点（如一张表）
    """
    visited = set()
    queue = deque([(anomaly_node, 0, [anomaly_node])])
    root_causes = []
    
    while queue:
        node, depth, path = queue.popleft()
        if depth > max_depth:
            continue
        if node in visited:
            continue
        visited.add(node)
        
        parents = lineage_graph.get(node, [])
        if not parents:
            # 没有上游，是根因
            root_causes.append({
                "node": node,
                "path": path,
                "distance": depth
            })
            continue
        
        for parent, edge_type in parents:
            queue.append((parent, depth + 1, path + [parent]))
    
    # 按距离排序，取最近根因
    root_causes.sort(key=lambda x: x["distance"])
    return root_causes[:5]
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**开源工具**：

| 工具 | 定位 | 优势 | 劣势 |
| --- | --- | --- | --- |
| **Prometheus** | 时序数据库 + 监控 | 生态丰富 | 大数据场景需配合 |
| **Grafana** | 可视化 | 强大、灵活 | 配置复杂 |
| **Apache Griffin** | 大数据 DQ | Spark 集成 | 社区相对小 |
| **DataHub** | 元数据 + 血缘 | LinkedIn 出品、活跃 | 学习曲线 |
| **Apache Atlas** | 元数据 + 血缘 | Hadoop 生态 | 文档较少 |
| **OpenLineage** | 统一血缘规范 | 跨工具 | 实施中 |
| **Marquez** | 血缘 + 元数据 | OpenLineage 核心 | 部署复杂 |
| **Soda Core** | 配置化 DQ | 易上手 | 大数据有限 |
| **Great Expectations** | 声明式 DQ | 生态丰富 | 配置复杂 |

**商业 SaaS**：

| 工具 | 定位 | 关键能力 |
| --- | --- | --- |
| **Monte Carlo Data** | Data Observability 龙头 | 五大支柱 + 字段级血缘 + ML + RAG 集成 |
| **Bigeye** | Data Observability | 深度集成 Snowflake / Databricks |
| **Mona** | AI-first 可观测性 | AI Quality Copilot、自动归因 |
| **Anomalo** | 自动异常检测 | 无需规则、纯 ML |
| **Datafold** | Diff + 回归测试 | 数据版本对比 |
| **Soda Cloud** | SaaS DQ | 与 Soda Core 协同 |
| **Univocity** | 商业 DQ + 可观测性 | 中国本土化 |

**AI 时代新工具（2024-2025）**：

- **Monte Carlo + RAG**：可观测性知识库接入 LLM。
- **Mona AI Quality Copilot**：自然语言查询异常。
- **Anomalo Autonomous**：完全无配置。
- **Datadog AI Observability**：LLM 应用监控。
- **New Relic AI**：LLM 调用链路追踪。
- **Langfuse / LangSmith**：LLM 应用可观测性。
- **Arize Phoenix**：LLM 评估 + 可观测性。

### 4.4 代码 / 示例

**示例 1：完整的可观测性平台（Python + Prometheus）**

```python
# observability_platform.py
import time
from prometheus_client import start_http_server, Gauge
from prometheus_client.exporter import PrometheusExpositionHandler
from sklearn.ensemble import IsolationForest
import numpy as np

class DataObservabilityPlatform:
    def __init__(self):
        self.freshness_gauge = Gauge('data_freshness_seconds', 'Freshness', ['db', 'table'])
        self.volume_gauge = Gauge('data_volume_rows', 'Volume', ['db', 'table'])
        self.quality_gauge = Gauge('data_quality_rate', 'Quality', ['db', 'table', 'column', 'metric'])
        self.schema_gauge = Gauge('data_schema_columns', 'Schema columns', ['db', 'table'])
        self.anomaly_score = Gauge('data_anomaly_score', 'Anomaly score', ['db', 'table'])
        
        self.history = {}  # 存储历史指标
        self.anomaly_detector = AnomalyDetector()
    
    def collect(self, db, table):
        """采集五大支柱指标"""
        # 1. Freshness
        last_update = self._get_last_update(db, table)
        freshness = time.time() - last_update
        self.freshness_gauge.labels(db, table).set(freshness)
        
        # 2. Volume
        row_count = self._get_row_count(db, table)
        self.volume_gauge.labels(db, table).set(row_count)
        
        # 3. Quality
        for column in self._get_columns(db, table):
            null_rate = self._compute_null_rate(db, table, column)
            unique_rate = self._compute_unique_rate(db, table, column)
            self.quality_gauge.labels(db, table, column, 'null_rate').set(null_rate)
            self.quality_gauge.labels(db, table, column, 'unique_rate').set(unique_rate)
        
        # 4. Schema
        col_count = len(self._get_columns(db, table))
        self.schema_gauge.labels(db, table).set(col_count)
        
        # 5. Anomaly Detection
        history = self.history.setdefault(f"{db}.{table}", [])
        history.append({
            'timestamp': time.time(),
            'freshness': freshness,
            'row_count': row_count,
            'quality_avg': np.mean([
                self.quality_gauge.labels(db, table, c, 'null_rate')._value.get()
                for c in self._get_columns(db, table)
            ])
        })
        
        # 保留最近 1000 条历史
        if len(history) > 1000:
            history.pop(0)
        
        # 异常检测
        if len(history) > 30:
            anomaly_score = self._detect_anomaly(history)
            self.anomaly_score.labels(db, table).set(anomaly_score)
            
            if anomaly_score > 0.8:
                self._trigger_alert(db, table, anomaly_score)
    
    def _detect_anomaly(self, history):
        """异常检测"""
        features = np.array([
            [h['freshness'], h['row_count'], h['quality_avg']]
            for h in history[-100:]
        ])
        
        return self.anomaly_detector.detect_3sigma(
            features[:-1, 0].tolist(),
            features[-1, 0]
        )

if __name__ == '__main__':
    start_http_server(8000)
    platform = DataObservabilityPlatform()
    
    while True:
        for table in ['orders', 'users', 'products']:
            platform.collect('prod', table)
        time.sleep(60)
```

**示例 2：基于 OpenLineage 的血缘采集**

```python
# openlineage_integration.py
from openlineage.client import OpenLineageClient
from openlineage.client.event import (
    RunEvent, RunState, Run, Job, Dataset, 
    Symlinks, Ownership, InputDataset, OutputDataset
)

client = OpenLineageClient("http://marquez:5000")

def emit_lineage_event(job_name, inputs, outputs, run_state=RunState.COMPLETE):
    """发送血缘事件"""
    event = RunEvent(
        eventType=run_state,
        eventTime=datetime.now().isoformat(),
        run=Run(runId=str(uuid.uuid4())),
        job=Job(namespace="spark", name=job_name),
        inputs=[InputDataset(dataset=d) for d in inputs],
        outputs=[OutputDataset(dataset=d) for d in outputs],
        producer="spark-observability",
    )
    client.emit(event)


# 在 Spark ETL 中使用
def spark_etl_with_lineage():
    df_orders = spark.read.parquet("s3://lake/orders/")
    df_users = spark.read.parquet("s3://lake/users/")
    
    # 业务逻辑
    df_joined = df_orders.join(df_users, "user_id")
    
    # 输出血缘
    emit_lineage_event(
        job_name="etl_orders_users_join",
        inputs=[
            Dataset(namespace="s3://lake", name="orders"),
            Dataset(namespace="s3://lake", name="users"),
        ],
        outputs=[
            Dataset(namespace="s3://warehouse", name="dwd_orders"),
        ],
    )
    
    df_joined.write.parquet("s3://warehouse/dwd_orders/")
```

**示例 3：基于 LLM 的异常归因**

```python
# llm_root_cause.py
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def explain_anomaly_with_llm(anomaly_data, lineage_data, metrics_history):
    """用 LLM 解释异常"""
    
    prompt = f"""
你是一个资深数据可观测性专家。请基于以下信息分析异常根因。

## 异常指标
{anomaly_data}

## 血缘信息
{lineage_data}

## 历史指标趋势
{metrics_history}

请按以下结构回答：
1. **异常描述**：发生了什么
2. **可能根因**：列出 3 个最可能的原因
3. **建议修复方案**：每个根因对应的修复步骤
4. **预防措施**：如何避免类似问题
"""
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.content[0].text


# Agent 自动修复（基于 LangChain）
from langchain.agents import create_agent

def auto_remediation_agent(anomaly_alert):
    agent = create_agent(
        tools=[
            "restart_spark_job",
            "backfill_data",
            "notify_oncall",
            "rollback_data",
        ],
        llm="claude-3-5-sonnet-20241022",
    )
    
    response = agent.invoke({
        "input": f"""
        收到异常告警：{anomaly_alert}
        请按以下流程处理：
        1. 分析异常类型
        2. 查询血缘定位根因
        3. 选择合适的修复工具
        4. 执行修复（优先选可重试操作）
        5. 验证修复结果
        6. 通知 oncall（如修复失败）
        """
    })
    
    return response
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**1. AIOps 全面介入**

2024-2025 趋势：用 LLM / ML 替代人工决策：

- **自动异常检测**：ML 模型替代 3-sigma。
- **自动归因**：基于血缘 + 历史 pattern 自动定位根因。
- **自动修复**：Agent 自动选择修复工具。
- **自动升级**：无法自动修复时自动升级 oncall。

**2. LLM 辅助运维**

- **自然语言查询异常**：「订单表最近为什么延迟」→ LLM 自动查询 + 解释。
- **自动生成 Runbook**：告警触发后，LLM 自动生成处置步骤。
- **Postmortem 自动撰写**：故障结束后，LLM 自动汇总 Postmortem。

**3. Agent 修复**

- **Auto-Remediation Agent**：自动执行回刷、回滚、源头修复。
- **RCA Agent**：自动定位根因 + 推荐修复方案。
- **变更 Agent**：自动评估 Schema 变更的下游影响。

**4. RAG 集成可观测性**

- 把可观测性知识库（Runbook、Postmortem、血缘）接入 RAG。
- 业务方自助查询：「上周用户表质量为什么下降？」→ RAG 自动回答。
- oncall 通过 RAG 快速查询历史故障。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**RAG 应用的可观测性**：

1. **Prompt/Response 监控**：输入输出采样、敏感词检测。
2. **Embedding 漂移**：embedding 分布变化监控。
3. **LLM 调用链**：每次 LLM 调用的 token、延迟、成本。
4. **RAG 检索质量**：检索命中率、相关性评估。

**代表工具**：

- **Langfuse**：开源 LLM 可观测性。
- **LangSmith**：LangChain 官方。
- **Arize Phoenix**：LLM 评估 + 可观测性。
- **Helicone**：LLM API 网关 + 可观测性。
- **Datadog LLM Observability**：企业级 LLM 监控。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **2024 VLDB**：时序异常检测在数据可观测性的应用。
- **2024 SIGMOD**：LLM 驱动的根因分析。
- **2025 ICDE**：AIOps for Data Engineering。

**工业进展**：

- **2024-01**：Datadog 收购 Data Observability 公司 Hyperscience。
- **2024-03**：Monte Carlo 推出 RAG Observability。
- **2024-06**：Anomalo Autonomous 模式 GA。
- **2024-09**：Mona AI Quality Copilot GA。
- **2024-12**：阿里云 DataWorks 推出智能可观测。
- **2025-Q1**：Snowflake 推出 Native Observability for Iceberg。
- **2025-Q2**：Databricks 推出 Unity Catalog Observability。

### 5.4 未来 3-5 年趋势

1. **AIOps 全面接管**：异常检测、根因分析、修复自动化。
2. **LLM 成为运维界面**：自然语言成为可观测性的"主交互"。
3. **可观测性 + AI 治理融合**：LLM 应用可观测性 + 数据可观测性统一。
4. **统一可观测性平台**：Metrics + Logs + Traces + Data Observability + AI Observability。
5. **预测性可观测性**：从被动检测 → 主动预测（如预测 SLA 违约）。
6. **自适应修复**：根据历史模式自动选择最优修复方案。
7. **可观测性民主化**：业务方自助查询，无需依赖数据团队。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：阿里巴巴"数据可观测性平台"（2023-2024）**

- **规模**：百万级表，万级任务。
- **架构**：自研可观测性平台 + DataHub + Grafana + AIOps。
- **关键设计**：
  - 五大支柱指标全量采集。
  - ML 异常检测（Prophet + 孤立森林）。
  - 告警分级 + oncall 排班。
  - LLM 辅助归因（基于通义千问）。
  - RAG 接入可观测性知识库。
- **效果**：
  - MTTD 从 1 小时降到 5 分钟。
  - MTTR 从 8 小时降到 1 小时。
  - 告警误报率下降 60%。

**案例 2：字节跳动"实时可观测性"（2024）**

- **场景**：万级实时任务（Kafka + Flink）。
- **架构**：Prometheus + 自研监控 + Grafana。
- **关键设计**：
  - Flink Metrics Reporter → Prometheus。
  - Kafka Consumer Lag 实时监控。
  - 端到端延迟监控（Producer → Consumer）。
  - 自动告警 + 自愈（重启 consumer）。
- **效果**：
  - 实时任务延迟监控覆盖率 100%。
  - 故障自愈率 40%。
  - 业务感知提升 80%。

**案例 3：某 SaaS 公司"Monte Carlo 落地"（2024）**

- **规模**：Snowflake 上 1000+ 表。
- **工具**：Monte Carlo + DataHub + 内部告警。
- **关键设计**：
  - 自动接入 Snowflake 表，自动发现血缘。
  - ML 异常检测覆盖全量。
  - 字段级血缘 + 影响分析。
  - LLM 解释异常。
- **效果**：
  - 故障发现时间从 T+1 → 实时。
  - 数据团队每周节省 20 小时人工排查。
  - 业务方信任度提升 50%。

### 6.2 踩坑与经验

**踩坑 1：指标过多告警疲劳**

- **现象**：每个指标都告警，每天 500+ 告警，团队麻木。
- **根因**：没有分级、聚合。
- **解决**：
  1. 关键指标 P0 / P1，普通指标 P2 / P3。
  2. 按血缘聚合（上游异常 → 收敛告警）。
  3. 告警抑制（如大促期间临时关闭非关键告警）。

**踩坑 2：硬编码阈值失效**

- **现象**：业务增长后，旧阈值失效，告警频繁 / 漏报。
- **根因**：静态阈值不能适应业务变化。
- **解决**：
  1. 动态阈值（3-sigma + 季节性识别）。
  2. 业务季节性识别（大促、月末、年初）。
  3. 阈值与业务方共同 review。

**踩坑 3：忽略 Schema 漂移**

- **现象**：上游加字段，下游 ETL 报错。
- **根因**：没监控 Schema 变更。
- **解决**：
  1. Schema Registry + 兼容性检查。
  2. Schema 变更自动通知下游。
  3. 灰度发布 + 72h 验证。

**踩坑 4：告警无 oncall**

- **现象**：告警发出来，无人响应。
- **根因**：oncall 机制缺失。
- **解决**：
  1. Follow-the-sun oncall 排班。
  2. 告警 + Runbook 自动附带。
  3. MTTR 度量与考核挂钩。

**踩坑 5：RCA 永远找不到根因**

- **现象**：告警响应了，但找不到根本原因。
- **根因**：血缘不全 + 缺乏上下文。
- **解决**：
  1. 字段级血缘（不是表级）。
  2. 关联业务事件（变更、发布、流量）。
  3. 历史故障库（Postmortem）。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1：最小可行方案（3-6 个月）**

- 选 50 张核心表，配置五大支柱指标。
- Prometheus + Grafana 看板。
- 静态阈值 + 关键告警。
- oncall 机制。
- 目标：覆盖率 50%，MTTD < 30 分钟。
- 成本：2 数据工程师 + 1 SRE。

**1→10：扩展到全集团（6-12 个月）**

- 全量表接入。
- 异常检测 ML 化（孤立森林 / Prophet）。
- DataHub 血缘集成。
- 告警分级 + oncall 平台化。
- 目标：覆盖率 90%，MTTD < 5 分钟。
- 成本：5-8 人数据 + SRE 团队。

**10→100：智能化 + 平台化（12-24 个月）**

- AIOps 全面介入。
- LLM 辅助运维。
- Agent 自动修复。
- 跨云可观测性。
- 目标：覆盖率 100%，MTTR < 30 分钟。
- 成本：15-20 人可观测性团队。

### 6.4 ROI 评估

**直接收益**：

| 维度 | 衡量指标 | 估算 |
| --- | --- | --- |
| **故障发现时间** | MTTD | 从小时级 → 分钟级 |
| **故障修复时间** | MTTR | 从 8h → 1h |
| **告警准确率** | 告警可信度 | > 80% |
| **数据团队工时** | 故障排查工时 | 月节省 100+ 小时 |

**间接收益**：

- **业务信任提升**：业务方愿意用数据做决策。
- **AI 效果保障**：训练数据质量有保障。
- **合规支撑**：监管报告有数据支撑。

**ROI 计算示例**：

```
投入：8 人团队 × 12 个月 × 80 万/人/年 = 640 万/年
收益：
  - 故障人力节省：400 万/年
  - 业务损失减少：1000 万/年
  - AI 效果提升：300 万/年
ROI = (400 + 1000 + 300 - 640) / 640 ≈ 165%
```

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 工具 / 模式 | 配置成本 | 自动化程度 | 大数据支持 | 实时支持 | AI 能力 | 社区生态 | 总分 |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Monte Carlo** | 5 | 5 | 5 | 5 | 5 | 4 | 29 |
| **Bigeye** | 5 | 5 | 5 | 5 | 4 | 4 | 28 |
| **Mona** | 5 | 5 | 4 | 4 | 5 | 3 | 26 |
| **Anomalo** | 5 | 5 | 4 | 4 | 5 | 3 | 26 |
| **DataHub** | 3 | 4 | 5 | 4 | 3 | 5 | 24 |
| **Apache Griffin** | 3 | 3 | 5 | 4 | 2 | 3 | 20 |
| **Soda** | 5 | 4 | 4 | 3 | 3 | 4 | 23 |
| **Great Expectations** | 4 | 3 | 4 | 3 | 3 | 5 | 22 |
| **自研（Prometheus + DataHub）** | 2 | 4 | 5 | 5 | 4 | 4 | 24 |

### 7.2 决策树

```
预算充足（> 100 万/年）？
├── 是 → 商业 SaaS（Monte Carlo / Bigeye）
└── 否 → 继续
    │
    数据规模？
    ├── TB+ → DataHub + Apache Griffin / Great Expectations
    └── GB  → Great Expectations / Soda
        │
        是否需要实时可观测性？
        ├── 是 → Flink + Prometheus + 自研
        └── 否 → 离线工具即可
            │
            是否需要 AIOps？
            ├── 是 → Mona / Anomalo
            └── 否 → 规则引擎 + 异常检测算法
```

### 7.3 组合使用

**常见组合 1：Monte Carlo + DataHub + PagerDuty**

- **Monte Carlo**：异常检测 + 告警。
- **DataHub**：血缘 + 元数据。
- **PagerDuty**：oncall 路由。

**常见组合 2：Prometheus + Grafana + Great Expectations**

- **Prometheus**：指标采集。
- **Grafana**：可视化。
- **Great Expectations**：DQ 规则。

**常见组合 3：Mona + Snowflake + Anthropic**

- **Mona**：AI 可观测性。
- **Snowflake**：数仓。
- **Anthropic**：LLM 解释异常。

**常见组合 4：自研（Prometheus + OpenLineage + AIOps）**

- **Prometheus**：指标。
- **OpenLineage**：血缘。
- **AIOps**：异常检测 + 归因。

---

## 8. 面试真题集

> **一句话定位**：监控指标（新鲜度、完整性、准确性）、告警分级、链路追踪。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 11 个原 PDF 子章节、共 55 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §1.2 | 集群故障诊断与恢复 | 1.2.1 ~ 1.2.6（共 6） | 6 | 主 |
| §1.4 | 集群监控与告警 | 1.4.1, 1.4.2, 1.4.3, 1.4.4 | 4 | 主 |
| §3.4 | 典型性能问题排查与解决 | 3.4.1, 3.4.2, 3.4.3, 3.4.4, 3.4.5 | 5 | 主 |
| §9.7 | 调度器实战配置与问题诊断 | 9.7.1, 9.7.2, 9.7.3, 9.7.4, 9.7.5 | 5 | 主 |
| §10.6 | 单节点故障检测与⾃动恢复 | 10.6.1, 10.6.2, 10.6.3, 10.6.4 | 4 | 主 |
| §11.6 | 数据质量监控规则与告警 | 11.6.1, 11.6.2, 11.6.3, 11.6.4, 11.6.5 | 5 | 辅 |
| §16.3 | ⾼可⽤与监控运维 | 16.3.1, 16.3.2, 16.3.3, 16.3.4, 16.3.5 | 5 | 辅 |
| §21.2 | AIOps平台架构与实时分析 | 21.2.1 ~ 21.2.7（共 7） | 7 | 主 |
| §21.3 | AIOps基础概念与价值认知 | 21.3.1, 21.3.2, 21.3.3, 21.3.4 | 4 | 主 |
| §21.4 | 监控指标采集与异常检测基础 | 21.4.1, 21.4.2, 21.4.3, 21.4.4, 21.4.5 | 5 | 主 |
| §21.5 | 故障根因分析与定位技术 | 21.5.1, 21.5.2, 21.5.3, 21.5.4, 21.5.5 | 5 | 主 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §1 GC（-XX:+UseG1GC），并针对G1设置合理的MaxGCPauseMillis和⽬标暂

> 本主题涵盖 2 个子节、10 道题。

#### 2.1.2 集群故障诊断与恢复

> 来源：原 PDF §1.2，收录 6 道题。

| 题号 | 难度 |
| --- | :---: |
| §1.2.1 | ★★★☆☆ |
| §1.2.2 | ★★★☆☆ |
| §1.2.3 | ★★★☆☆ |
| §1.2.4 | ★★★☆☆ |
| §1.2.5 | ★★★★☆ |
| §1.2.6 | ★★★★☆ |

- **§1.2.1**：当集群的HDFS NameNode⾯临内存泄漏⻛险，且堆内存使⽤率呈线性增⻓趋势
- **§1.2.2**：在万节点规模的集群中，如果出现⼤量TaskTracker或Executor进程异常退出，但
- **§1.2.3**：请解释在超⼤规模Spark流处理作业中，如何通过监控指标和⽇志分析来区分和解
- **§1.2.4**：假设集群的ResourceManager服务出现频繁Full GC，导致作业提交缓慢甚⾄失
- **§1.2.5**：请描述在⼤规模Hadoop/Spark集群中，当发现某个DataNode节点磁盘使⽤率持
- **§1.2.6**：请设计⼀个针对⼤规模集群⽹络分区（Network Partition）故障的应急恢复预案，

#### 2.1.4 集群监控与告警

> 来源：原 PDF §1.4，收录 4 道题。

| 题号 | 难度 |
| --- | :---: |
| §1.4.1 | ★★★☆☆ |
| §1.4.2 | ★★★☆☆ |
| §1.4.3 | ★★★☆☆ |
| §1.4.4 | ★★★☆☆ |

- **§1.4.1**：在万节点规模的集群中，监控数据本身的海量性可能会成为新的性能瓶颈，请阐述
- **§1.4.2**：请列举并简要说明在⼤规模Hadoop/Spark集群监控中，你最关注的3个核⼼系统
- **§1.4.3**：当集群监控系统出现⼤量误报或漏报时，你会如何系统地分析和解决这个问题，以
- **§1.4.4**：请描述⼀个你设计或优化的集群告警规则的案例，包括你是如何确定告警阈值、设

### 2.2 §3 存储与资源管理的性能优化 > 本主题涵盖 1 个子节、5 道题。

#### 2.2.4 典型性能问题排查与解决

> 来源：原 PDF §3.4，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §3.4.1 | ★★★☆☆ |
| §3.4.2 | ★★★☆☆ |
| §3.4.3 | ★★★☆☆ |
| §3.4.4 | ★★★☆☆ |
| §3.4.5 | ★★★★☆ |

- **§3.4.1**：当YARN集群的ResourceManager成为性能瓶颈时，请问可以通过哪些架构层⾯和
- **§3.4.2**：请阐述在HDFS集群中，数据节点频繁发⽣磁盘I/O瓶颈的可能原因有哪些，并针对
- **§3.4.3**：请设计⼀个针对⼤规模Spark on YARN作业的慢任务排查流程，该流程需要能够
- **§3.4.4**：请描述在万节点HDFS集群中，当出现数据写⼊速度显著下降时，你通常会检查哪
- **§3.4.5**：在YARN集群中，如果频繁出现应⽤程序因资源不⾜⽽申请失败的情况，请说明你

### 2.3 §9 YARN Capacity/Fair Scheduler的深度配置 > 本主题涵盖 1 个子节、5 道题。

#### 2.3.7 调度器实战配置与问题诊断

> 来源：原 PDF §9.7，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §9.7.1 | ★★★☆☆ |
| §9.7.2 | ★★★☆☆ |
| §9.7.3 | ★★★☆☆ |
| §9.7.4 | ★★★☆☆ |
| §9.7.5 | ★★★★☆ |

- **§9.7.1**：请简要描述 YARN Capacity Scheduler 和 Fair Scheduler 的核⼼区别，并说明在
- **§9.7.2**：请阐述在万节点规模的 Hadoop 集群中，YARN 调度器可能⾯临哪些性能瓶颈？
- **§9.7.3**：请说明在 YARN Capacity Scheduler 中，如何为⼀个新加⼊的、对延迟敏感的业
- **§9.7.4**：在⽣产环境中，如何通过 YARN 的调度器配置实现严格的'多租户'资源隔离，以防
- **§9.7.5**：假设集群中出现某个重要队列资源利⽤率⻓期过低，⽽其他队列资源紧张的情况，

### 2.4 §10 应对节点、机架乃⾄数据中⼼级别故障 > 本主题涵盖 1 个子节、4 道题。

#### 2.4.6 单节点故障检测与⾃动恢复

> 来源：原 PDF §10.6，收录 4 道题。

| 题号 | 难度 |
| --- | :---: |
| §10.6.1 | ★★★☆☆ |
| §10.6.2 | ★★★☆☆ |
| §10.6.3 | ★★★☆☆ |
| §10.6.4 | ★★★☆☆ |

- **§10.6.1**：在Spark on YARN的部署模式下，当Executor因节点硬件故障（如内存不⾜或磁
- **§10.6.2**：为了提升集群对单节点故障的恢复能⼒，除了基本的重试机制，你还会从集群配
- **§10.6.3**：请描述Hadoop YARN的NodeManager是如何检测到某个节点上的任务执⾏失败
- **§10.6.4**：请简要说明在Hadoop集群中，NameNode和DataNode分别有哪些常⻅的单点故

### 2.5 §11 元数据管理、数据⾎缘与数据质量监控 > 本主题涵盖 1 个子节、5 道题。

#### 2.5.6 数据质量监控规则与告警

> 来源：原 PDF §11.6，收录 5 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §11.6.1 | ★★★☆☆ |
| §11.6.2 | ★★★☆☆ |
| §11.6.3 | ★★★☆☆ |
| §11.6.4 | ★★★☆☆ |
| §11.6.5 | ★★★★☆ |

- **§11.6.1**：请简要说明数据质量监控中常⻅的监控规则类型，并各举⼀个例⼦。
- **§11.6.2**：请阐述如何将数据⾎缘分析与数据质量监控规则相结合，以实现当上游数据表结
- **§11.6.3**：在设计⼀个⾃动化数据质量检查系统时，你会如何平衡监控规则的覆盖度与系统
- **§11.6.4**：请描述在数据质量监控告警触发后，⼀个完整的问题闭环处理流程通常包括哪些
- **§11.6.5**：在⼤规模数据平台中，如何设计⼀个可扩展且⾼效的实时数据质量监控与告警架

### 2.6 §16 Kubernetes上运⾏⼤数据组件的实践与思考 > 本主题涵盖 1 个子节、5 道题。

#### 2.6.3 ⾼可⽤与监控运维

> 来源：原 PDF §16.3，收录 5 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §16.3.1 | ★★★☆☆ |
| §16.3.2 | ★★★☆☆ |
| §16.3.3 | ★★★☆☆ |
| §16.3.4 | ★★★☆☆ |
| §16.3.5 | ★★★★☆ |

- **§16.3.1**：请简要说明在Kubernetes上部署⼤数据组件（例如Spark或HDFS）时，为了实现
- **§16.3.2**：请描述在Kubernetes环境中，如何为有状态的⼤数据服务（例如Kafka或ZooKee
- **§16.3.3**：请阐述在Kubernetes上运⾏的⼤数据平台中，如何设计⼀套完整的监控告警体
- **§16.3.4**：在⼤数据组件与Kubernetes的深度集成中，如何利⽤Operator模式来封装和管理
- **§16.3.5**：当Kubernetes集群中的⼀个Node节点意外宕机，导致运⾏在其上的⼤数据计算任

### 2.7 §21 通过AIOps提升集群稳定性和运维效率 > 本主题涵盖 4 个子节、21 道题。

#### 2.7.2 AIOps平台架构与实时分析

> 来源：原 PDF §21.2，收录 7 道题。

| 题号 | 难度 |
| --- | :---: |
| §21.2.1 | ★★★☆☆ |
| §21.2.2 | ★★★☆☆ |
| §21.2.3 | ★★★☆☆ |
| §21.2.4 | ★★★☆☆ |
| §21.2.5 | ★★★★☆ |
| §21.2.6 | ★★★★☆ |
| §21.2.7 | ★★★★★ |

- **§21.2.1**：请解释AIOps的核⼼概念，并阐述它在⼤规模数据集群运维中的主要价值是什么？
- **§21.2.2**：在处理海量运维时序数据时，你会选择哪种或哪些流处理框架（如Flink, Spark St
- **§21.2.3**：在设计⼀个AIOps平台的实时数据采集模块时，你会考虑从⼤数据集群的哪些组件
- **§21.2.4**：如何利⽤机器学习算法对集群的运维指标进⾏异常检测？请简述⼀个你可能会采
- **§21.2.5**：请描述⼀个典型的AIOps实时分析流⽔线的关键组件，并解释每个组件在实现低延
- **§21.2.6**：假设你需要设计⼀个能够预测万节点集群中磁盘故障的系统，请描述你的技术架
- **§21.2.7**：在AIOps平台中，如何实现根因分析的⾃动化？请结合⼀个具体的故障场景（例如

#### 2.7.3 AIOps基础概念与价值认知

> 来源：原 PDF §21.3，收录 4 道题。

| 题号 | 难度 |
| --- | :---: |
| §21.3.1 | ★★★☆☆ |
| §21.3.2 | ★★★☆☆ |
| §21.3.3 | ★★★☆☆ |
| §21.3.4 | ★★★☆☆ |

- **§21.3.1**：在实施AIOps平台的过程中，通常会⾯临哪些技术或组织上的挑战？针对这些挑
- **§21.3.2**：在⼤数据平台运维中，AIOps可以应⽤于哪些具体场景来提升集群的稳定性和运维
- **§21.3.3**：请解释⼀下AIOps的基本概念，并说明它与传统运维⽅式的主要区别是什么？
- **§21.3.4**：请阐述AIOps的核⼼价值体现在哪些⽅⾯，并说明这些价值如何帮助⼀个万节点规

#### 2.7.4 监控指标采集与异常检测基础

> 来源：原 PDF §21.4，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §21.4.1 | ★★★☆☆ |
| §21.4.2 | ★★★☆☆ |
| §21.4.3 | ★★★☆☆ |
| §21.4.4 | ★★★☆☆ |
| §21.4.5 | ★★★★☆ |

- **§21.4.1**：请解释在监控指标异常检测中，3-sigma（三⻄格玛）法则的基本原理，并说明
- **§21.4.2**：请列举在⼤数据集群监控中，针对CPU、内存、磁盘I/O和⽹络流量这四类核⼼资
- **§21.4.3**：请阐述孤⽴森林（Isolation Forest）算法相较于传统统计⽅法（如3-sigma）在
- **§21.4.4**：请对⽐分析Prometheus和Telegraf在监控指标采集⽅⾯的各⾃特点和适⽤场景。
- **§21.4.5**：在⼀个万节点规模的Hadoop集群中，为了实现对监控指标的实时异常检测，请设

#### 2.7.5 故障根因分析与定位技术

> 来源：原 PDF §21.5，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §21.5.1 | ★★★☆☆ |
| §21.5.2 | ★★★☆☆ |
| §21.5.3 | ★★★☆☆ |
| §21.5.4 | ★★★☆☆ |
| §21.5.5 | ★★★★☆ |

- **§21.5.1**：请简述在⼤数据集群故障排查中，根因分析（RCA）的基本流程是什么？
- **§21.5.2**：请解释图算法（如随机游⾛、社区发现）在故障根因分析中的基本原理和应⽤场
- **§21.5.3**：当Hadoop集群出现作业执⾏缓慢的问题时，你通常会从哪些关键指标⼊⼿进⾏初
- **§21.5.4**：在⼀个万节点规模的Spark集群中，如果出现某个Stage卡住且⽆法⾃动恢复的情
- **§21.5.5**：请说明如何结合系统⽇志、性能指标和集群拓扑信息，来定位⼀个数据节点频繁

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **AI/ML 集成与治理**
- **元数据与数据治理**
- **实时与流处理架构**
- **性能优化与调优**
- **智能运维与 AIOps**
- **架构演进与未来趋势**
- **资源调度与多租户隔离**
- **集群容错与故障恢复**

## 4 本章小结

> 本面试真题集收录 55 道题，覆盖 7 个原 PDF 主题、11 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [11-cross-cutting 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
