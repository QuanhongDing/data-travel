> 本文件是 **04-observability.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](04-observability.md)。

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
