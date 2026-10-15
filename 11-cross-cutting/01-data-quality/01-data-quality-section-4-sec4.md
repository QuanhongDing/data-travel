> 本文件是 **01-data-quality.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](01-data-quality.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：盘点与分级（2-4 周）**

1. 列出所有关键表（按业务重要性 × 数据量 × 下游依赖排序）。
2. 对每张表分配 Owner（业务方 + 数据团队）。
3. 用 4 级分级：
   - **P0 核心**：交易、账户、风控（任何异常直接影响业务）。
   - **P1 重要**：用户画像、订单、营销。
   - **P2 一般**：日志、监控、临时表。
   - **P3 备份 / 测试**。

**Step 2：维度与指标（2-4 周）**

对每个 P0 / P1 表：
- 6 维度 × 每字段：明确每个字段该跑什么规则。
- 输出《数据质量规则清单》YAML 文件。
- 与业务方对齐（数据契约）。

**Step 3：规则引擎落地（4-8 周）**

- 选型：开源（Deequ / Great Expectations / Soda）/ 自研 / 商业。
- 集成：调度系统（DAG 节点 / Airflow / DolphinScheduler）。
- 告警：钉钉 / 飞书 / Slack / 企业微信 / PagerDuty。

**Step 4：可观测性升级（4-8 周）**

- 接入 OpenLineage / DataHub。
- 接入 Monte Carlo / Bigeye（可选，预算允许时）。
- 配置告警分级（P0 → 短信；P1 → 钉钉；P2 → 邮件）。

**Step 5：契约与流程（持续）**

- 上游接入必须签 Data Contract。
- 关键表每次 Schema 变更必须走变更评审。
- 故障后写 Postmortem，更新规则库。

**Step 6：度量与闭环（持续）**

- 度量指标：DQC 覆盖率、规则执行成功率、告警响应时长、MTTR。
- 月度评审：业务方 + 数据团队共同 review。

### 4.2 关键技术点

**1. 规则执行方式**：

| 方式 | 描述 | 适用场景 |
| --- | --- | --- |
| **批处理** | Spark / SQL 定期执行 | T+1 表、离线表 |
| **流式** | Flink SQL / Kafka Streams 实时规则 | 实时表、流处理 |
| **嵌入式** | 业务代码内联 | 强一致场景 |
| **按需** | Ad-hoc 触发 | 数据修复、回刷验证 |

**2. 阈值设定方法**：

- **静态阈值**：经验值（如"非空率 ≥ 99%"）。
- **3-sigma**：基于历史窗口自动计算。
- **机器学习**：孤立森林、LSTM-AE、Prophet 残差。
- **业务约束**：业务方明确要求（如"金额必须 ≥ 0"）。

**3. 告警分级**：

| 级别 | 触发条件 | 通知渠道 | 响应 SLA |
| --- | --- | --- | --- |
| **P0** | 核心表核心字段异常 / SLA 违约 | 短信 + 电话 | 15 min |
| **P1** | 重要表异常 / 重要规则失败 | 钉钉群 + oncall | 1 hour |
| **P2** | 一般表 / 一般规则 | 邮件 / 群消息 | 8 hour |
| **P3** | 提示性 / 趋势性 | 周报 / 看板 | N/A |

**4. MTTR 度量**：

$$
\text{MTTR} = \frac{\sum(\text{故障发现时间} - \text{故障恢复时间})}{\text{故障次数}}
$$

$$
\text{MTTD} = \frac{\sum(\text{故障发生时间} - \text{故障发现时间})}{\text{故障次数}}
$$

### 4.3 工具链与平台（含 2024-2025 新工具）

**开源工具**：

| 工具 | 定位 | 优势 | 劣势 |
| --- | --- | --- | --- |
| **Great Expectations** | Python 声明式 DQ | 生态丰富、社区大 | 配置复杂 |
| **Apache Griffin** | 大数据场景 DQ（Spark-based） | 支持批流一体 | 社区相对小 |
| **Deequ** | AWS 开源，Spark 自动约束发现 | 自动发现约束 | 仅支持 Spark |
| **Soda Core** | 配置化 YAML DSL | 易上手 | 大数据场景有限 |
| **dbt tests** | dbt 内置测试 | 与 dbt 集成紧 | 仅支持 dbt 模型 |
| **Apache Hivemall** | 数据质量 + ML | 支持 ML 检测 | 工程化弱 |

**商业 / SaaS（2024-2025）**：

| 工具 | 定位 | 关键能力 |
| --- | --- | --- |
| **Monte Carlo Data** | Data Observability 龙头 | 自动字段级血缘 + ML 异常检测 + RAG 集成 |
| **Bigeye** | Data Observability | 深度集成 Snowflake / Databricks |
| **Mona** | AI-first DQ | 自动异常归因、AI Quality Copilot |
| **Anomalo** | 自动异常检测 | 无需配置规则，纯 ML 检测 |
| **Datafold** | Diff + Quality | 数据版本对比、回归测试 |
| **Soda Cloud** | SaaS DQ | 与 Soda Core 协同 |
| **Univocity** | 商业 DQ 平台 | 中国本土化、合规优先 |

**AI 时代新工具（2024-2025）**：

- **Mona AI Quality Copilot**：自然语言定义规则、自动归因异常。
- **Anomalo Autonomous**：完全无配置，自动基线学习。
- **Monte Carlo + LLM**：用 LLM 解释异常、推荐修复方案。
- **Datafold + dbt 集成**：自动化回归测试。
- **Great Expectations + AI Assistant（2024 GA）**：AI 辅助生成规则。

### 4.4 代码 / 示例

**示例 1：Great Expectations 配置**

```python
import great_expectations as gx

context = gx.get_context()

# 1. 定义数据源
datasource = context.data_sources.add_pandas(name="orders")
asset = datasource.add_dataframe_asset(name="orders_df")

# 2. 定义期望（Expectation Suite）
suite = context.suites.add(gx.ExpectationSuite(name="orders_suite"))
suite.add_expectation(gx.expectations.ExpectColumnValuesToNotBeNull(column="order_id"))
suite.add_expectation(gx.expectations.ExpectColumnValuesToBeUnique(column="order_id"))
suite.add_expectation(gx.expectations.ExpectColumnValuesToMatchRegex(
    column="user_phone",
    regex=r"^1[3-9]\d{9}$"
))
suite.add_expectation(gx.expectations.ExpectColumnValueLengthsToBeBetween(
    column="user_name",
    min_value=1,
    max_value=64
))

# 3. 定义检查点（Checkpoint）
checkpoint = context.checkpoints.add(
    gx.Checkpoint(
        name="orders_checkpoint",
        validation_definitions=[
            gx.ValidationDefinition(
                data=asset.batch_definitions.add(name="orders_batch"),
                suite=suite,
            )
        ],
        actions=[
            gx.checkpoint.UpdateDataDocsAction(name="update_docs"),
            gx.checkpoint.EmailAction(
                name="send_email",
                receiver_emails=["data-quality@example.com"],
            ),
        ],
    )
)

# 4. 执行
result = checkpoint.run(batch_parameters={"dataframe": orders_df})
assert result["success"], "Data quality check failed!"
```

**示例 2：Soda Checks YAML**

```yaml
# orders_quality.yml
data_source: warehouse
dataset: orders
checks:
  - row_count:
      name: "Orders row count anomaly"
      samples_limit: 50
      fail: when > 10 or < 1
  - missing_count(order_id):
      name: "order_id should never be null"
      fail: when > 0
  - duplicate_count(order_id):
      name: "order_id should be unique"
      fail: when > 0
  - invalid_count(user_phone):
      name: "user_phone should match CN mobile pattern"
      valid_format: "^1[3-9]\\d{9}$"
      fail: when > 10
  - freshness(order_time):
      name: "Order data should be fresh within 1 hour"
      expression: "MAX(order_time) > NOW() - INTERVAL '1 hour'"
      fail: when < 0
  - anomaly_detection(amount):
      name: "Order amount anomaly"
      sensitivity: 3
```

**示例 3：Flink 实时质量监控**

```java
// Flink SQL: 实时规则
DataStream<Order> orders = ...;

orders
    .keyBy(Order::getUserId)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .aggregate(new OrderAggregator())
    .process(new QualityCheckFunction())
    .addSink(new AlertSink());

// 规则配置
public class QualityCheckFunction 
    extends ProcessWindowFunction<AggregatedOrder, Alert, String, TimeWindow> {
    
    @Override
    public void process(String userId, Context ctx, 
                        Iterable<AggregatedOrder> elements, 
                        Collector<Alert> out) {
        AggregatedOrder agg = elements.iterator().next();
        
        // 规则 1：5 分钟内订单数超过 100 触发风控告警
        if (agg.getOrderCount() > 100) {
            out.collect(Alert.builder()
                .level("P1")
                .type("ORDER_FREQ_ANOMALY")
                .userId(userId)
                .message("5 分钟内订单数异常：" + agg.getOrderCount())
                .build());
        }
        
        // 规则 2：金额方差超过阈值
        if (agg.getAmountStdDev() > 10000) {
            out.collect(Alert.builder()
                .level("P2")
                .type("AMOUNT_ANOMALY")
                .userId(userId)
                .build());
        }
    }
}
```

**示例 4：Monte Carlo + DataHub 集成（AI 时代）**

```python
# monte_carlo_integration.py
from monte_carlo import MonteCarlo
from datahub.emitter.mce_builder import make_dataset_urn

mc = MonteCarlo(api_token=os.environ["MC_API_TOKEN"])

# 1. 自动化字段级血缘 + 异常检测
asset = mc.assets.add(
    name="orders",
    source_type="snowflake",
    database="prod",
    schema="public",
    table="orders",
    # 自动开启：freshness, volume, quality, schema, lineage
    monitors=[
        "freshness_monitor",
        "volume_monitor", 
        "quality_monitor",
        "schema_monitor",
        "lineage_monitor",
    ],
)

# 2. AI 异常归因（2024 新功能）
alert = mc.alerts.get(alert_id="alert-123")
root_cause = mc.ai.diagnose(alert)  
# 输出："amount 字段非空率从 99.5% 降到 92%，最可能原因是上游 order-service v3.2.1 部署引入 bug"

# 3. 与 RAG 集成：让 LLM 解释异常
explanation = mc.ai.explain(alert, model="claude-3-5-sonnet")
```

---
