# 风险评估（Risk Assessment）

> **一句话定位**：FMEA + 故障树 + Bowtie + 概率影响矩阵——把「如果出事」变成「出事我能扛」。

> 本文是 data-travel 项目 [Ch13 · 决策与权衡](../../README.md) 的子章节（**04 风险评估**）。覆盖 R6 工程能力（决策维度）中「**风险识别 / 评估 / 缓解 / 监控**」相关的理论、模式、工程实践与 AI 时代演进。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 风险评估有哪些方法？FMEA / FTA / Bowtie 怎么选？ | §1 / §3 |
| 如何量化一个风险？P × I 矩阵怎么用？ | §2.2 |
| 风险评估怎么落到工程？ | §4 |
| AI 时代风险评估有哪些新趋势？ | §5 |
| 数据架构师该做哪些风险预判？ | §6.3 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：风险评估（Risk Assessment）是识别、分析、评价系统或项目潜在风险的系统化方法。国际标准 ISO 31000 将风险定义为「**不确定性对目标的影响**」（effect of uncertainty on objectives），由两个要素构成：**概率（Probability）** 与 **影响（Impact）**。

**工程定义**：在数据架构师手里，风险评估是一套**「先想清楚会出什么事、出事后怎么办」的结构化思维**，包含四个步骤：

1. **识别（Identify）**：列出所有可能的风险事件。
2. **分析（Analyze）**：评估每个风险的概率与影响（量化或半量化）。
3. **应对（Respond）**：制定避免 / 转移 / 缓解 / 接受策略。
4. **监控（Monitor）**：建立指标 + 告警 + 复盘机制。

### 1.2 为什么需要

**业务 / 工程痛点**：

- **「黑天鹅」出现时手足无措**：没有预案，故障扩散到全公司。
- **「过度自信」**：架构师认为「系统很稳」，实际多个单点未识别。
- **「风险 vs 成本」失衡**：要么过度保守（所有风险都缓解，成本爆炸），要么过度激进（所有风险都接受，事故频发）。
- **「跨团队风险盲区」**：A 团队认为风险在 B 团队，结果出事故时没人响应。
- **「风险 vs 业务」割裂**：技术风险未与业务损失对齐，老板觉得「不痛」。

**为什么是「资深架构师」的核心能力**：

- P5/P6：写代码——关注「功能正确」。
- P7：模块——关注「模块可用」。
- P8：系统——关注「系统稳定」。
- **资深架构师：关注「系统稳定 + 业务连续 + 合规 + 声誉」——这是风险评估的本质**。

### 1.3 在 AI 时代数据架构中的位置

```
       ┌─────── Ch13 · 决策与权衡 ───────┐
       │                                  │
       │  ADR(01) ←── 风险评估(04)        │
       │   ↓           ↓                  │
       │ 选型(02) ←─ 风险评估(04)         │
       │   ↓           ↓                  │
       │ 自研(03) ←─ 风险评估(04)         │
       │   ↓           ↓                  │
       │ 战略(05) ─── 风险评估(04)        │
       │                                  │
       └──────────────────────────────────┘
                       ↓
            风险评估是决策的「前置把关」
```

**与其他子主题的关系**：

- **ADR（01）**：每条 ADR 的 Consequences 字段本质上是「风险评估的产物」。
- **选型框架（02）**：选型决策 = 多准则评分 + 风险评分。
- **自研 vs 采购（03）**：自研风险（团队能力、维护成本）vs 采购风险（供应商锁定、合规）。
- **技术战略（05）**：3-5 年路线图必须包含「风险地图」。
- **架构评审（07）**：评审清单包含「风险评估 Checklist」。

**一句话判断**：**「不评估风险的架构师是赌徒，能评估风险的架构师是棋手」**。

### 1.4 演进历程

- **1950s-1960s**：美国军方 / NASA 发展 FMEA（Failure Mode and Effects Analysis）。
- **1960s**：贝尔实验室发展故障树分析（FTA, Fault Tree Analysis）。
- **1970s**：化工 / 核电行业广泛使用 HAZOP（Hazard and Operability Study）。
- **1990s**：金融行业引入 VAR（Value at Risk）量化模型。
- **2002**：ISO 31000 风险管理标准发布（2024 年发布修订版）。
- **2010s**：DevOps / SRE 引入风险评估（Error Budget、SLO）。
- **2017**：NIST 800-30《Risk Management Framework》。
- **2020s**：AI / ML 风险评估（AI RMF, 2023 NIST 100-1）。
- **2024-2025**：LLM 风险评估（幻觉、数据泄露、模型滥用）、AI 辅助 FMEA、量子风险评估。

---

## 2. 核心原理

### 2.1 关键概念定义

- **风险（Risk）**：不确定性对目标的影响 = `Risk = P × I`（概率 × 影响）。
- **威胁（Threat）**：能造成损害的来源（如黑客攻击、硬件故障）。
- **脆弱性（Vulnerability）**：系统易被威胁利用的弱点（如未打补丁、未加密）。
- **风险登记册（Risk Register）**：所有识别风险的清单（ID、描述、P、I、应对策略、Owner）。
- **FMEA（Failure Mode and Effects Analysis）**：失效模式与影响分析——逐组件识别失效模式、影响、原因、检测方法。
- **RPN（Risk Priority Number）**：FMEA 的风险优先级数 = `Severity × Occurrence × Detection`（每项 1-10）。
- **FTA（Fault Tree Analysis）**：故障树分析——从顶层「不希望事件」反推到底层原因（用 AND / OR 逻辑门）。
- **Bowtie Analysis（领结分析）**：把威胁、后果、预防 / 缓解措施画成「领结」形图。
- **HAZOP（Hazard and Operability Study）**：危险与可操作性研究——化工 / 过程行业标准。
- **概率影响矩阵（Probability-Impact Matrix）**：把风险按 P × I 二维评分，分红黄绿三色。
- **ERM（Enterprise Risk Management）**：企业风险管理——全公司层面的风险管理体系。
- **Risk Appetite（风险偏好）**：组织愿意接受的风险水平（由董事会 / 高管定）。
- **Risk Tolerance（风险容忍度）**：具体可接受风险偏差范围。
- **Inherent Risk vs Residual Risk**：固有风险（无控制）vs 残留风险（控制后）。
- **Risk Treatment（风险应对）**：四象限——Avoid（避免）/ Transfer（转移）/ Mitigate（缓解）/ Accept（接受）。
- **Monte Carlo Simulation**：蒙特卡洛模拟——用概率分布采样评估风险。
- **AI RMF（AI Risk Management Framework）**：NIST 2023 发布的 AI 风险管理框架（2024 正式版）。
- **Redundancy（冗余）**：通过备份 / 多副本降低单点故障概率。
- **Fault Isolation（故障隔离）**：通过限流 / 熔断 / 隔离舱壁降低影响扩散。

### 2.2 数学 / 形式化基础

**基本公式**：

```
Risk = P(Event) × Impact(Event)
RPN = Severity × Occurrence × Detection
Residual Risk = Inherent Risk × (1 - Control Effectiveness)
```

**概率影响矩阵（5×5）**：

| | I=1（极小） | I=2（较小） | I=3（中） | I=4（较大） | I=5（极大） |
| --- | --- | --- | --- | --- | --- |
| P=5（极可能） | 中 | 高 | 高 | 极高 | 极高 |
| P=4（较可能） | 中 | 中 | 高 | 高 | 极高 |
| P=3（可能） | 低 | 中 | 中 | 高 | 高 |
| P=2（不太可能） | 低 | 低 | 中 | 中 | 高 |
| P=1（极不可能） | 极低 | 低 | 低 | 中 | 中 |

**蒙特卡洛模拟**：

```python
import numpy as np
# 模拟某项目工期风险：最优 6 个月、最可能 9 个月、最差 18 个月
durations = np.random.triangular(6, 9, 18, size=10000)
print(f"P50: {np.percentile(durations, 50):.1f} months")
print(f"P90: {np.percentile(durations, 90):.1f} months")
```

**期望货币价值（EMV, Expected Monetary Value）**：

```
EMV(Risk) = P × I（其中 I 为货币化影响）
决策：选 EMV 最大（或负 EMV 最小）的选项。
```

### 2.3 关键算法 / 方法

1. **FMEA（失效模式与影响分析）**——逐组件失效模式清单。
2. **FTA（故障树分析）**——逻辑门树（AND / OR）。
3. **Bowtie Analysis**——可视化「威胁→事件→后果」+ 两侧屏障。
4. **HAZOP**——化工 / 过程行业。
5. **概率影响矩阵（P-I Matrix）**——半定量风险评级。
6. **Monte Carlo Simulation**——概率分布采样。
7. **Bayesian Network**——贝叶斯网络——条件概率推理。
8. **Markov Chain**——马尔可夫链——状态转移风险建模。
9. **Real Options Analysis（实物期权）**——决策灵活性估值。
10. **Cyber Risk Quantification (CRQ)**——网络安全量化（FAIR 框架）。
11. **AI Risk Assessment**——AI 模型风险评估（偏见、稳健性、隐私）。
12. **Resilience Engineering**——韧性工程（吸收 + 恢复 + 适应能力）。
13. **Stress Testing**——压力测试（极端场景模拟）。
14. **Chaos Engineering**——混沌工程（Netflix Chaos Monkey 风格）。
15. **Risk Register + Heatmap**——风险登记册 + 热力图。

### 2.4 与相邻概念的关系

- **风险评估 vs 不确定性管理**：风险评估聚焦「已知未知」（known unknowns），不确定性管理聚焦「未知未知」（unknown unknowns）。
- **风险评估 vs 决策分析**：决策分析聚焦「选项优劣」，风险评估聚焦「未来结果分布」。
- **风险评估 vs 架构评审**：架构评审关注「方案是否合理」，风险评估关注「方案可能出什么问题」。
- **风险评估 vs SRE / SLO**：SRE 用 Error Budget 量化「可接受风险」，与风险评估天然融合。
- **风险评估 vs 合规审计**：合规审计是「必须做的事」（外部强制），风险评估是「应该做的事」（内部驱动）。
- **风险评估 vs 业务连续性（BCP）**：BCP 关注「灾难后如何恢复」，风险评估关注「灾难如何预防 + 影响评估」。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：FMEA（失效模式与影响分析）**

逐组件识别失效模式 → 影响 → 原因 → 检测方法 → RPN。

| 组件 | 失效模式 | 影响 (S) | 原因 (O) | 检测 (D) | RPN | 应对 |
| --- | --- | --- | --- | --- | --- | --- |
| Kafka Broker | 磁盘满 | 8 | 4 | 3 | 96 | 监控 + 自动扩容 |
| HDFS DataNode | 心跳停止 | 7 | 3 | 2 | 42 | 多副本 + 自动下线 |
| LLM API | 服务降级 | 9 | 5 | 5 | 225 | 多供应商 + 降级 prompt |

- 优点：系统化、量化、可追溯。
- 缺点：耗时（每个组件 30-60 分钟）、易遗漏跨组件失效。
- 适用：硬件 / 基础设施、中高风险系统。

**模式 2：FTA（故障树分析）**

从顶层事件反推到根因，用 AND / OR 门连接。

```
[系统宕机]
      │
   ┌──┴──┐
   │     │
  OR    OR
   │     │
 数据库  网络
 故障   故障
   │     │
   ┌┴┐   ┌┴┐
  AND   AND
   │     │
 主从  DNS
 同步  解析
 失败  失败
```

- 优点：可视化根因链、便于定量计算（事件概率）。
- 缺点：构建复杂、对分析者要求高。
- 适用：安全事故分析、关键系统可靠性分析。

**模式 3：Bowtie Analysis（领结分析）**

中间是「Top Event（核心事件）」，左侧是「Threats（威胁）」+「Preventive Controls（预防控制）」，右侧是「Consequences（后果）」+「Mitigative Controls（缓解控制）」。

```
威胁 → [预防控制] → 核心事件 → [缓解控制] → 后果
```

- 优点：直观、左右两侧对照、便于跨团队沟通。
- 缺点：对复杂系统的中间事件不够细。
- 适用：安全、环境、可靠性分析。

**模式 4：概率影响矩阵（P-I Matrix）**

把风险按 P × I 评分（1-5），分红黄绿三色。

- 优点：极简、便于高层汇报。
- 缺点：粒度粗、忽略时间维度。
- 适用：项目组合管理、季度风险回顾。

**模式 5：Risk Register + Heatmap**

把所有风险录入表格，生成热力图。

| Risk ID | 描述 | P | I | 风险等级 | Owner | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | Kafka 集群单点 | 3 | 5 | 高 | @张三 | 缓解中 |

- 优点：可治理、可追溯。
- 缺点：可能成为形式主义。
- 适用：组织级风险管理。

**模式 6：Bayesian Network 风险推理**

用贝叶斯网络建模风险之间的依赖关系，条件概率推理。

- 优点：建模复杂依赖、动态更新。
- 缺点：构建复杂、需要先验数据。
- 适用：复杂系统风险（金融、AI 安全）。

**模式 7：Scenario Analysis + Stress Test**

构造多种未来场景（基线 / 乐观 / 悲观 / 黑天鹅），评估系统表现。

- 优点：捕捉极端场景。
- 缺点：场景构造主观。
- 适用：战略决策、容量规划。

**模式 8：Chaos Engineering（混沌工程）**

主动注入故障（Netflix Chaos Monkey 风格），验证系统韧性。

- 优点：实战验证、暴露隐藏风险。
- 缺点：可能引发真实事故（需谨慎）。
- 适用：分布式系统、关键链路。

### 3.2 适用场景决策表

| 场景 | 推荐方法 | 理由 |
| --- | --- | --- |
| 硬件 / 基础设施 | FMEA | 标准化、覆盖全 |
| 安全事故分析 | FTA + Bowtie | 根因链清晰 |
| 高层汇报 | P-I Matrix + Risk Register | 简洁 |
| 复杂依赖系统 | Bayesian Network | 建模依赖 |
| 战略决策 | Scenario Analysis | 捕捉黑天鹅 |
| 分布式系统韧性 | Chaos Engineering | 实战验证 |
| AI 模型风险 | AI RMF + FMEA | NIST 标准 |
| 项目组合管理 | Risk Register + Heatmap | 治理 |

### 3.3 反模式与陷阱

1. **「风险评估 = 走过场」**：照模板填一遍就归档，没有真正的风险讨论。**风险评估必须 owner + 评审 + 行动**。
2. **「过度风险厌恶」**：把所有风险都判为高，导致成本爆炸、决策瘫痪。**接受低风险是 OK 的**。
3. **「风险遗忘」**：评估完不跟进、不监控、不复盘。**风险评估是持续过程**。
4. **「单一视角」**：只从技术角度评估风险，忽略业务、合规、声誉。**多维度评估**。
5. **「忽视未知未知」**：只评估已知风险，黑天鹅出现时崩溃。**建立韧性（resilience）机制**。
6. **「概率 × 影响 = 风险」盲目套用**：对复杂系统 P 和 I 难量化。**用半定量 + 专家判断**。
7. **「风险登记册无跟进」**：列出 100 条风险，每条都没有 owner 和应对。**每条必须 owner + 截止日期**。
8. **「缺乏量化」**：所有风险都「中」「高」「极高」，无法优先级排序。**强制量化**。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：识别范围与边界**

- 明确评估对象（一个系统？一个项目？一个决策？）。
- 确定时间范围（未来 3 个月 / 1 年 / 3 年？）。
- 划定评估边界（技术 / 业务 / 合规 / 声誉）。

**Step 2：建立风险分类法**

- 按类型：技术 / 业务 / 合规 / 安全 / 运营 / 财务 / 声誉 / 战略。
- 按层次：组件 / 子系统 / 系统 / 系统之系统。
- 按时间：实施期 / 上线期 / 运行期。

**Step 3：风险识别（多源）**

- 头脑风暴（5-10 人，1-2 小时）。
- 历史事故复盘（Postmortem 库）。
- 行业基准（OWASP Top 10、CWE、STRIDE）。
- Checklist（架构评审 Checklist、合规 Checklist）。
- AI 辅助（LLM 基于历史风险库推荐）。

**Step 4：风险分析（量化 + 定性）**

- 概率评估（1-5）。
- 影响评估（1-5，多维度：技术 / 业务 / 合规 / 声誉）。
- 综合评分（P × I）。
- RPN 计算（FMEA）。
- Monte Carlo / Bayesian 推理（高复杂度系统）。

**Step 5：风险应对**

- 四象限策略：Avoid / Transfer / Mitigate / Accept。
- 每条风险分配 owner + 截止日期 + 预算。
- 应对措施文档化。

**Step 6：风险监控**

- 建立风险指标（KRI, Key Risk Indicators）。
- 实时监控 + 阈值触发。
- 季度风险评审会议。
- 重大风险变更时实时评审。

**Step 7：复盘与持续改进**

- 每次事故后更新风险登记册。
- 季度 / 半年风险复盘会。
- 风险评估方法自身迭代。

### 4.2 关键技术点

1. **FMEA 表格自动化**：用 Jira / Confluence 模板生成 FMEA 表。
2. **FTA 工具**：OpenFTA、Isograph FaultTree+。
3. **Bowtie 软件**：BowTieXP、RiskBowtie。
4. **Monte Carlo 库**：Python `numpy.random`、`pymc3`、`@RISK`（Excel）。
5. **Bayesian Network 库**：`pgmpy`、`pybnlearn`。
6. **Risk Register 平台**：Jira Risk Register、Riskonnect、ServiceNow GRC。
7. **GRC 平台**：ServiceNow GRC、Archer、SAP GRC。
8. **AI RMF 工具**：NIST AI RMF Mapper、Microsoft AI Risk Assessment。
9. **Chaos Engineering 工具**：Chaos Monkey、Gremlin、ChaosBlade、LitmusChaos。
10. **Risk Heatmap 可视化**：Tableau / Power BI Risk Dashboard。
11. **KRI 监控**：Grafana + Prometheus + Risk 指标。
12. **LLM 风险辅助**：基于历史风险库的 LLM 风险推荐 + 评审。

### 4.3 工具链与平台（含 2024-2025 新工具）

**FMEA / FTA / Bowtie 工具**：

- **Isograph FMEA / FaultTree+**（商业，行业标准）。
- **BowTieXP**（商业，Bowtie 主流工具）。
- **OpenFTA**（开源）。
- **Ishikawa / Fishbone Diagram**（鱼骨图工具，根因分析）。
- **ReliaSoft**（商业，可靠性工程）。
- **FMEA Pro**（轻量 FMEA 工具）。

**Risk Register / GRC 平台**：

- **ServiceNow GRC**——企业级 GRC 平台。
- **RSA Archer**——GRC 主流商业平台。
- **Riskonnect**——专业风险管理。
- **LogicGate Risk Cloud**——SaaS 风险平台（2024）。
- **Jira + Risk Plugin**——中小团队轻量方案。
- **Confluence Risk Register Template**——Atlassian 生态。

**AI / ML 风险工具**：

- **NIST AI RMF Mapper**（2024）——AI 风险评估映射工具。
- **Microsoft Responsible AI Dashboard**（2024）——负责任 AI 评估。
- **IBM AI Fairness 360**（开源）——AI 公平性评估。
- **Google Model Card Toolkit**——模型卡片生成。
- **Hugging Face Evaluate**——模型评估库。
- **Arize AI / WhyLabs**——ML 监控 + 风险检测。

**混沌工程**：

- **Chaos Monkey**（Netflix 开源）。
- **Gremlin**（商业 SaaS，2024 主流）。
- **ChaosBlade**（阿里开源）。
- **LitmusChaos**（CNCF 开源）。
- **Chaos Mesh**（PingCAP 开源）。
- **Azure Chaos Studio**（云原生）。

**概率 / 蒙特卡洛**：

- **@RISK**（Excel 插件）。
- **Crystal Ball**（Oracle）。
- **Python numpy / scipy / pymc3**——开源。
- **R mc2d / triangle**——开源。

**2024-2025 新工具**：

- **Anthropic Claude for Risk**（2024）——基于 LLM 的风险评估助手。
- **Databricks Unity Catalog Risk**（2024）——数据风险 + AI 风险统一。
- **Microsoft Purview Risk**（2024）——数据合规 + AI 风险。
- **Atlassian Compass**（2024）——开发者体验 + 风险指标。
- **Vanta / Drata**（SaaS 合规 + 风险自动化，2024 主流）。

### 4.4 代码 / 示例

**示例 1：FMEA 表格（CSV）**

```csv
component,failure_mode,effect,severity,cause,occurrence,detection,rpn,mitigation,owner
Kafka Broker,磁盘满,生产停滞,8,日志未清理,4,3,96,监控告警+自动扩容+日志TTL,@张三
HDFS DataNode,心跳停止,副本缺失,7,网络分区,3,2,42,多副本+自动下线,@李四
LLM API,服务降级,问答失败,9,OpenAI 限流,5,5,225,多供应商+降级prompt+队列缓冲,@王五
Flink JobManager,内存溢出,作业失败,8,大状态未清理,4,4,128,RocksDB状态后端+Checkpoint,@赵六
PostgreSQL,主从切换延迟,只读延迟,6,同步延迟,3,3,54,异步复制+读流量分发,@钱七
```

**示例 2：概率影响矩阵**

| | I=1 | I=2 | I=3 | I=4 | I=5 |
| --- | --- | --- | --- | --- | --- |
| P=5 | 中 | 高 | 高 | **极高** | **极高** |
| P=4 | 中 | 中 | 高 | 高 | **极高** |
| P=3 | 低 | 中 | 中 | 高 | 高 |
| P=2 | 低 | 低 | 中 | 中 | 高 |
| P=1 | 极低 | 低 | 低 | 中 | 中 |

**示例 3：故障树（FTA）**

```
[数据平台宕机] — Top Event
    │
    ├── OR ──→ [Kafka 不可用]
    │              │
    │              ├── OR ──→ [Broker 进程崩溃]
    │              │              └── AND ──→ [内存溢出] × [无健康检查]
    │              │
    │              └── OR ──→ [ZooKeeper 脑裂]
    │
    ├── OR ──→ [数据库不可用]
    │              │
    │              ├── OR ──→ [主库宕机]
    │              └── OR ──→ [主从延迟过大]
    │
    └── OR ──→ [网络分区]
                   │
                   ├── OR ──→ [专线故障]
                   └── OR ──→ [DNS 污染]
```

**示例 4：Bowtie Analysis**

```
Threats                        Top Event                  Consequences
[数据中心火灾]─────→[预防]──────→│                       ├──→[缓解]───→[业务损失]
[网络攻击]───────────→[防火墙]───→│[数据平台宕机]         ├──→[缓解]───→[客户投诉]
[人为误操作]─────────→[审批]─────→│                      ├──→[缓解]───→[声誉损害]
                                  │                       └──→[缓解]───→[合规处罚]
```

**示例 5：蒙特卡洛模拟（Python）**

```python
import numpy as np

# 模拟一个数据平台年度故障次数与影响
np.random.seed(42)

# 故障次数：每季度平均 2 次（泊松分布）
faults_per_quarter = np.random.poisson(lam=2, size=10000)

# 每次故障影响金额（万元）：对数正态分布
impact_per_fault = np.random.lognormal(mean=2.0, sigma=1.0, size=10000)

# 年度总影响 = 季度故障 × 季度影响
total_impact = faults_per_quarter * impact_per_fault

print(f"年度故障 P50: {np.percentile(total_impact, 50):.2f} 万元")
print(f"年度故障 P90: {np.percentile(total_impact, 90):.2f} 万元")
print(f"年度故障 P99: {np.percentile(total_impact, 99):.2f} 万元")
# 输出示例：
# 年度故障 P50: 14.32 万元
# 年度故障 P90: 67.84 万元
# 年度故障 P99: 215.16 万元
```

**示例 6：AI RMF 评估（NIST）**

| 类别 | 问题 | 评分 | 风险等级 | 缓解 |
| --- | --- | --- | --- | --- |
| Valid and Reliable | 模型准确率 / 稳健性 | 4/5 | 中 | 持续监控 |
| Safe | 输出是否有害 | 5/5 | 低 | 内容审核 |
| Secure and Resilient | 对抗攻击稳健性 | 3/5 | 高 | Adversarial 测试 |
| Accountable and Transparent | 可解释性 | 2/5 | 高 | SHAP + LIME |
| Explainable and Interpretable | 决策可解释 | 3/5 | 中 | LLM Chain-of-Thought |
| Privacy-Enhanced | 数据隐私 | 4/5 | 低 | 差分隐私 |
| Fair with Harmful Bias Managed | 公平性 | 3/5 | 高 | 偏见检测 + 缓解 |

**示例 7：AI 辅助风险识别（Python / Claude API）**

```python
import anthropic
import os

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def identify_risks(system_description: str, prior_risks: list[str]) -> str:
    """基于系统描述 + 历史风险，让 Claude 推荐新风险。"""
    prompt = f"""你是一名资深数据架构师，专注风险评估。

## 系统描述
{system_description}

## 历史风险（来自 Risk Register）
{chr(10).join(f"- {r}" for r in prior_risks)}

请基于 FMEA + Bowtie 方法，推荐 10 条未识别的风险。
每条风险包含：风险描述、概率(1-5)、影响(1-5)、应对策略、Owner 建议。
按 P × I 降序排列。输出 Markdown 表格。"""

    msg = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

# 使用
risks = identify_risks(
    system_description="AI 智能体平台，基于 LangChain + Claude/GPT-4，包含 RAG、知识图谱、多模型路由。",
    prior_risks=["LLM API 限流", "向量库 OOM", "PII 数据泄露"],
)
print(risks)
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

- **AI 风险评估（AI RMF）**：把 AI 模型本身作为风险评估对象——偏见、对抗攻击、隐私、幻觉。
- **LLM 辅助 FMEA**：用 LLM 自动推荐失效模式、生成 FMEA 表格。
- **AI 风险监测**：用 ML 模型预测故障概率（Anomaly Detection + Risk Scoring）。
- **生成式 AI 风险**：幻觉、数据泄露、Prompt 注入、模型滥用——专门的风险类别。
- **联邦学习 / 隐私计算风险**：联邦学习的隐私泄露风险、隐私计算的算力开销风险。
- **AI 治理框架**：EU AI Act（2024 生效）、中国《生成式人工智能服务管理暂行办法》（2023）、美国 EO 14110（2023）。
- **AI Risk Quantification**：用 AI 量化 AI 风险（如 LLM 评估 LLM）。
- **Agent 行为风险**：Agent 自主决策带来的「决策失控」风险——Agent Loop、不可逆操作。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

- **Risk Register + 向量库**：把所有历史风险向量化，相似风险检索 + 复用。
- **Risk + KG**：把风险、威胁、控制、组件建成 KG——可推理「组件 A 失效会引发哪些下游风险」。
- **Risk + RAG**：风险评审时 RAG 检索历史事故 + 类似项目的风险应对案例。
- **GraphRAG for Risk**：跨系统的级联风险推理（如「Kafka 故障 → Flink 作业失败 → 数据延迟 → 业务损失」）。

### 5.3 学术与工业最新进展（2024-2025）

- **2024**：NIST AI Risk Management Framework (AI RMF 1.0) 正式版发布 + Generative AI Profile (NIST AI 600-1)。
- **2024**：EU AI Act 通过（2024-2026 分阶段生效）。
- **2024**：ISO/IEC 23894（AI 风险管理国际标准）。
- **2024**：Anthropic / OpenAI / Google 发布自家 AI Risk Assessment 框架。
- **2025**：OWASP Top 10 for LLM Applications（2025 版）。
- **2025**：MITRE ATLAS（AI 对抗威胁）持续更新。
- **2025**：AI Agent Risk（Agent 自主决策风险）成为热点。

### 5.4 未来 3-5 年趋势

- **Risk as Code**：风险评估自动化嵌入 CI/CD——每次部署自动评估新风险。
- **AI-native Risk Assessment**：用 AI 评估 AI 系统的风险成为行业标准。
- **Continuous Risk Monitoring**：风险从「定期评估」转向「持续监控」。
- **Risk Graph（风险图谱）**：组织级风险 KG，支持级联推理 + AI 辅助决策。
- **Resilience Engineering 主流化**：从「预防风险」到「增强韧性」（即使出问题也能恢复）。
- **AI Governance 标准化**：ISO 42001（AI 治理国际标准）2023 年发布，2024-2027 大规模落地。
- **量子风险评估**：量子计算威胁 + 量子安全风险评估。
- **可持续性风险**：碳排放 / ESG 风险纳入技术风险评估。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：AWS S3 2017 大宕机**

2017 年 2 月 28 日，AWS S3 因运维人员输入错误导致大量对象不可用，间接影响全球互联网。

- **风险类别**：人为误操作 + 影响扩散。
- **应对缺失**：当时 AWS S3 缺乏完整的误操作防御 + 多 Region 自动 failover。
- **事后改进**：加强运维操作审批；改进 Recovery 流程；SLA 公开承诺。
- **风险教训**：**单 Region + 单团队 + 误操作 = 灾难**——必须 multi-region + 操作审计 + chaos testing。

**案例 2：Knight Capital 算法事故（2012）**

骑士资本因算法 Bug 在 45 分钟内损失 4.4 亿美元，公司濒临破产。

- **风险类别**：软件 Bug + 自动化交易无人工把关。
- **应对缺失**：缺乏灰度发布 + 监控 + 紧急停止。
- **事后改进**：引入 kill switch + 灰度 + Risk Limit。
- **风险教训**：**自动化系统必须有「紧急停止」+ 灰度 + 限额**。

**案例 3：CrowdStrike 2024 全球蓝屏事件**

2024 年 7 月 19 日，CrowdStrike Falcon 传感器更新导致全球 850 万台 Windows 设备蓝屏。

- **风险类别**：安全软件自身 Bug + 影响范围极广。
- **应对缺失**：缺乏灰度发布 + Ring deployment。
- **事后改进**：引入 Ring deployment + 自动化回滚。
- **风险教训**：**安全软件也必须灰度发布 + Ring deployment**。

**案例 4：阿里双 11 大促风险评估**

阿里每年双 11 前做完整风险评估：

- **FMEA**：逐系统（交易、支付、库存、物流）做 FMEA。
- **Chaos Engineering**：故障注入演练。
- **Risk Register**：1000+ 风险条目，每条 owner。
- **实时监控**：大促期间 24 小时 Risk Dashboard。
- **应急响应**：30 分钟内响应所有 P0 风险。

### 6.2 踩坑与经验

1. **「过度乐观」**：架构师认为系统很稳，实际未识别多个单点。**强制 FMEA + Checklist**。
2. **「风险评估孤立」**：技术风险与业务风险割裂，老板不关心。**翻译成业务损失（货币化）**。
3. **「无 owner」**：风险列出但无人负责。**每条必须有 owner + 截止日期**。
4. **「不复盘」**：事故后不更新 Risk Register。**建立事故→风险更新闭环**。
5. **「Risk Register 僵尸」**：列了 100 条但没人看。**只保留 Top 20 风险**。
6. **「忽视残余风险」**：控制措施上线后不再评估。**定期 re-evaluate 残余风险**。
7. **「形式主义」**：照模板填一遍就归档。**必须有真正的风险讨论 + 行动项**。
8. **「缺乏跨团队协调」**：风险在 A 团队但影响 B 团队。**建立组织级 Risk Register**。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（10 人以下团队）**：

- 极简 P-I Matrix（5×5）；
- 列出 Top 10 风险；
- 每条风险 owner + 应对措施。

**1→10（10-50 人）**：

- 引入 FMEA（关键系统）；
- Risk Register 表格化（Jira / Confluence）；
- 季度风险评审会议；
- KRI 监控（核心指标）。

**10→100（50+ 人）**：

- 组织级 ERM 体系；
- AI RMF 框架（AI 系统）；
- Bayesian Network / Monte Carlo 复杂场景；
- Chaos Engineering 平台；
- Risk + KG（风险图谱）；
- AI 辅助风险识别 + 评审。

### 6.4 ROI 评估

**直接收益**：

- 重大事故减少：40-60%；
- 事故恢复时间（MTTR）缩短：30-50%；
- 风险沟通效率提升（高管 / 业务）：50%+；
- 合规成本下降（审计更容易）：20-40%。

**间接收益**：

- 业务连续性提升 → 客户信任；
- 品牌声誉保护；
- 团队风险管理文化；
- 战略升级。

**成本**：

- 初次风险评估：1-2 人月；
- 持续维护：0.5 人天 / 月；
- 工具链：低（Jira / Confluence / Chaos Engineering 工具）。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 临时评估 | Checklist | FMEA | FTA | Bowtie | AI 辅助 |
| --- | --- | --- | --- | --- | --- | --- |
| 系统化 | 1 | 3 | **5** | **5** | 4 | 4 |
| 量化程度 | 1 | 2 | 4 | 5 | 3 | 4 |
| 可视化 | 1 | 1 | 3 | 4 | **5** | 4 |
| 跨团队沟通 | 2 | 3 | 3 | 4 | **5** | 4 |
| 复杂度 | **5** | **5** | 3 | 2 | 3 | 4 |
| AI 友好度 | 1 | 2 | 3 | 3 | 3 | **5** |
| 适用规模 | 任意 | 小 | 中 | 大 | 中 | 任意 |

### 7.2 决策树

```
你需要做风险评估
        │
        ├── 单系统 / 单组件？
        │       └── 是 → FMEA
        │
        ├── 复杂依赖 / 关键基础设施？
        │       └── 是 → FTA + Bowtie
        │
        ├── 高层汇报 / 项目组合？
        │       └── 是 → P-I Matrix + Risk Register
        │
        ├── AI / ML 系统？
        │       └── 是 → AI RMF + FMEA
        │
        ├── 战略 / 长期决策？
        │       └── 是 → Scenario Analysis + Bayesian
        │
        └── 想用 AI 加速？
                └── 是 → LLM 辅助 FMEA + AI 风险监测
```

### 7.3 组合使用

- **FMEA + Risk Register**：FMEA 识别 + Register 跟踪。
- **FTA + Bowtie**：FTA 分析 + Bowtie 可视化沟通。
- **Risk Register + AI RMF**：传统风险 + AI 风险统一管理。
- **P-I Matrix + Chaos Engineering**：纸面评估 + 实战验证。
- **Risk + KG**：风险图谱推理。
- **AI 辅助 + 专家 review**：LLM 加速 + 专家把关。

---

## 8. 面试真题集

> 风险评估是「资深架构师」区别于「普通架构师」的关键能力——能否量化风险，决定你能否在不确定性中做出正确决策。本节将通过 12 道真题，从理论、方法、工程到前沿演进，完整覆盖风险评估面试考点。

### 8.1 风险评估基础

#### Q1. 什么是风险？风险的数学表达是什么？请画出概率影响矩阵。

**参考答案要点**：
- 风险 = 不确定性对目标的影响。
- 数学表达：`Risk = P × I`（概率 × 影响）。
- 5×5 矩阵：横轴影响、纵轴概率，4 个等级（极低 / 低 / 中 / 高 / 极高）。

#### Q2. 风险评估的 4 个核心步骤是什么？请举例说明。

**参考答案要点**：
- 4 步：识别（Identify）、分析（Analyze）、应对（Respond）、监控（Monitor）。
- 示例：智能体平台上线新模型 → 识别幻觉 / 限流 / 合规 → 评估 P × I → 缓解（多供应商 / 内容审核 / Prompt 评测） → 监控（KRI 告警）。

### 8.2 FMEA / FTA / Bowtie

#### Q3. FMEA 的 RPN 是什么？请给一个数据架构领域的 FMEA 示例。

**参考答案要点**：
- RPN = Severity × Occurrence × Detection（每项 1-10）。
- 示例：Kafka Broker 磁盘满 → S=8, O=4, D=3 → RPN=96 → 缓解（监控告警 + 自动扩容）。

#### Q4. FTA 和 Bowtie 的区别是什么？什么场景用哪个？

**参考答案要点**：
- FTA 是「自顶向下」逻辑树（AND/OR 门）；Bowtie 是「双向可视化」（威胁 → 事件 → 后果）。
- FTA 适合根因分析、安全事故；Bowtie 适合跨团队沟通、安全 / 风险管理。

### 8.3 风险评估方法选择

#### Q5. 概率影响矩阵 vs Monte Carlo 模拟的区别？什么场景用哪个？

**参考答案要点**：
- P-I Matrix：半定量、简洁、便于高层汇报。
- Monte Carlo：定量、基于概率分布、捕捉不确定性。
- 场景：P-I Matrix 用于快速分类；Monte Carlo 用于关键项目的工期 / 成本 / 性能风险。

#### Q6. 风险应对的 4 个策略（Avoid/Transfer/Mitigate/Accept）分别举例说明。

**参考答案要点**：
- Avoid：避免做某事（如不用未成熟技术）。
- Transfer：转移（如买保险、外包、SLA）。
- Mitigate：缓解（如多副本、限流、降级）。
- Accept：接受（如低影响风险）。

### 8.4 AI 时代风险评估

#### Q7. 什么是 NIST AI RMF？包含哪些核心类别？

**参考答案要点**：
- NIST AI Risk Management Framework (AI RMF 1.0)，2023 发布。
- 核心功能：Govern、Map、Measure、Manage。
- 类别：Valid and Reliable / Safe / Secure and Resilient / Accountable and Transparent / Explainable / Privacy-Enhanced / Fair。

#### Q8. 生成式 AI（LLM）的特殊风险有哪些？请列举 5 个。

**参考答案要点**：
- 幻觉（Hallucination）；
- 数据泄露（训练数据 / 推理数据）；
- Prompt 注入（Prompt Injection）；
- 模型滥用（生成有害内容）；
- 偏见（Bias）；
- 对抗攻击（Adversarial）；
- 成本失控（Token 滥用）。

### 8.5 工程实践

#### Q9. 如何在 CI/CD 中嵌入风险评估？请描述一个「Risk as Code」工作流。

**参考答案要点**：
- 在 PR 模板中加入「风险评估 Checklist」（变更影响 / 回滚方案 / 监控指标）。
- 自动扫描代码变更识别高风险操作（如 DROP TABLE、删除索引）。
- 风险评分超阈值 → 强制 Reviewer / 阻断合并。
- 部署后自动注入 KRI 到监控。

#### Q10. 混沌工程和风险评估的关系是什么？请举例说明混沌工程如何验证风险评估。

**参考答案要点**：
- 混沌工程是「风险评估的实战验证」——纸上评估 + 实战注入。
- 示例：FMEA 评估 Kafka 故障是「高风险」→ Chaos Monkey 注入 Broker 故障 → 验证系统是否真正降级。

### 8.6 跨团队 / 战略风险

#### Q11. 组织级 Risk Register 如何与各团队协作？请描述一个 150-300 人企业的风险管理流程。

**参考答案要点**：
- 流程：各团队季度提报风险 → 架构委员会评审 → 组织级 Risk Register 整合 → 高管季度汇报 → 重大风险实时同步。
- 平台：Jira + Confluence + GRC。
- 关键：每个风险 owner 必须明确（团队 / 个人）。

#### Q12. AI Agent 的自主决策带来哪些新风险？如何缓解？

**参考答案要点**：
- 新风险：决策失控、不可逆操作、循环依赖、成本失控、Prompt 注入、幻觉放大。
- 缓解：Human-in-the-loop、Agent Loop 限制、Kill Switch、操作审计、成本限额、可解释性。

---

> **返回**：
> - [13-decision 章节目录](../README.md)
> - [项目根目录](../../README.md)