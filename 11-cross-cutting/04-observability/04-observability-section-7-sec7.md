> 本文件是 **04-observability.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](04-observability.md)。

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
