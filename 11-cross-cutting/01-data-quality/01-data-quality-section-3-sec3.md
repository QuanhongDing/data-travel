> 本文件是 **01-data-quality.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](01-data-quality.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：DQC 中心化（Data Quality Center）**

经典架构：建立独立 DQC 平台，统一管理规则、监控、告警、修复。

```
[规则定义] → [规则注册] → [调度执行] → [指标存储]
                                              ↓
                                       [告警引擎]
                                              ↓
                                       [Oncall 通知]
```

**模式 2：声明式 DQ（Declarative DQ）**

类似 dbt test：在数据模型旁边用 YAML/DSL 声明质量要求。

```yaml
models:
  - name: orders
    columns:
      - name: order_id
        tests:
          - not_null
          - unique
      - name: amount
        tests:
          - not_null
          - accepted_range:
              min_value: 0
              max_value: 1000000
```

代表工具：**dbt tests、Great Expectations、Soda Checks**。

**模式 3：嵌入式 DQ（Inline DQ）**

把质量检查嵌入到 ETL pipeline 中，每一步都验证。优点：故障定位精确；缺点：侵入性强。

```python
# PySpark + Deequ 示例
from pydeequ.checks import *
from pydeequ.verification import *

check = Check(spark, CheckLevel.Warning, "Order Data Quality")
check.hasMinLength("order_id", 10) \
     .isComplete("user_id") \
     .isUnique("order_id") \
     .isContainedIn("status", ["CREATED", "PAID", "SHIPPED"])

result = VerificationSuite(spark).onData(df).addCheck(check).run()
```

**模式 4：契约式 DQ（Contract-based DQ）**

上下游通过数据契约达成协议，契约包括 Schema、SLA、SLO、所有权。

```yaml
# data-contract.yaml
dataset: orders
version: 1.0.0
owner: order-team@example.com
schema:
  - name: order_id
    type: string
    pii: false
  - name: user_phone
    type: string
    pii: true
sla:
  freshness: T+1 09:00
  completeness: 99.95%
  availability: 99.9%
```

代表实践：**Bit.io、Monte Carlo Data Contract、Bitol、DataHub Contract**。

**模式 5：可观测式 DQ（Observability-driven DQ）**

不做"事前规则"，而是"事后检测 + 异常归因"。基于时序 + ML 自动发现异常。

代表工具：**Monte Carlo、Bigeye、Mona、Anomalo**。

### 3.2 适用场景决策表

| 场景 | 推荐模式 | 理由 |
| --- | --- | --- |
| **传统数仓 / DWH** | 模式 1（DQC 中心化）+ 模式 2（dbt tests） | 成熟稳定，团队接受度高 |
| **实时数仓 / Flink** | 模式 3（嵌入式）+ 流式规则 | 流式数据需要每步验证 |
| **数据湖 / Iceberg** | 模式 4（契约式） | 多消费者场景需要明确协议 |
| **AI 训练数据 / RAG** | 模式 5（可观测式）+ 模式 4 | 数据量大、规则难写、关注漂移 |
| **多团队 Data Mesh** | 模式 4（契约式） | 联邦化治理需要契约 |
| **早期 0→1 创业** | 模式 2（dbt tests）+ 模式 5 | 配置化、低成本 |
| **金融 / 强合规** | 模式 1 + 模式 4 + 模式 3 | 必须可追溯、可审计 |

### 3.3 反模式与陷阱

1. **"规则过多导致告警风暴"**：100 张表、1000 条规则，每条都告警 = 没人看。**反模式 → 正确做法**：分级告警，关键表规则 P0 / P1，普通表规则 P2，抽样检测即可。
2. **"只在生产环境监控"**：等到生产出问题才发现规则不足。**正确做法**：开发环境跑 dbt test + CI gate，staging 跑全量规则，生产跑抽样 + 关键规则。
3. **"硬编码阈值"**：阈值定死，无法适应业务变化。**正确做法**：动态阈值（3-sigma、IQR、机器学习）。
4. **"只监控不修复"**：告警无人认领。**正确做法**：明确 owner，建立 oncall 机制，跟踪 MTTR。
5. **"把 DQ 当事后补救"**：出问题才加规则。**正确做法**：源头设计契约（Data Contract），把质量要求前置。
6. **"用同一套规则套所有数据"**：订单数据和日志数据用同一套完整性阈值显然不合理。**正确做法**：按业务域分级（核心交易 / 用户画像 / 日志 / AI 训练）。
7. **"忽视 Schema 漂移"**：上游加了字段，下游没适配。**正确做法**：Schema Registry + 兼容性检查（Avro backward compatibility）。

---
