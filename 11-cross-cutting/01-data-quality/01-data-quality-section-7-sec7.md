> 本文件是 **01-data-quality.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](01-data-quality.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 工具 / 模式 | 配置成本 | 自动化程度 | 大数据支持 | 实时支持 | AI 能力 | 社区生态 | 总分 |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Great Expectations** | 4 | 3 | 4 | 3 | 3 | 5 | 20 |
| **Apache Griffin** | 3 | 3 | 5 | 4 | 2 | 3 | 18 |
| **Deequ** | 4 | 4 | 5 | 3 | 2 | 4 | 20 |
| **Soda Core** | 5 | 4 | 4 | 3 | 3 | 4 | 21 |
| **dbt tests** | 5 | 3 | 3 | 1 | 2 | 5 | 18 |
| **Monte Carlo** | 5 | 5 | 5 | 5 | 5 | 4 | 29 |
| **Bigeye** | 5 | 5 | 5 | 5 | 4 | 4 | 28 |
| **Mona** | 5 | 5 | 4 | 4 | 5 | 3 | 26 |
| **Anomalo** | 5 | 5 | 4 | 4 | 5 | 3 | 26 |
| **自研 DQC** | 2 | 5 | 5 | 5 | 4 | 1 | 22 |

> 评分标准：1（差/低/无）→ 5（优/高/强）

### 7.2 决策树

```
是否需要实时质量监控？
├── 是 → Flink + 流式规则（自研 / Apache Griffin）
└── 否 → 继续
    │
    是否预算充足（> 100 万/年）？
    ├── 是 → 商业 SaaS（Monte Carlo / Bigeye）
    └── 否 → 继续
        │
        数据规模？
        ├── TB 级 → Deequ / Apache Griffin
        └── GB 级 → Great Expectations / Soda / dbt tests
```

**选型决策表**：

| 场景 | 首选 | 备选 |
| --- | --- | --- |
| 传统数仓 / DWH | dbt tests + Soda | Great Expectations |
| 实时数仓 | Apache Griffin / Flink + 自研 | Monte Carlo |
| 数据湖 / Iceberg | Monte Carlo / Deequ | 自研 |
| AI 训练数据 | Anomalo / Mona | Great Expectations + LLM |
| 多团队 Data Mesh | DataHub Contract + 自研 | Bitol |
| 早期 0→1 创业 | Soda Core + dbt tests | Great Expectations |
| 金融 / 强合规 | 自研 + 商业（Monte Carlo） | Great Expectations + 审计 |
| 中国本土（合规优先） | 阿里 DataWorks / 字节 DataFinder | Univocity / 自研 |

### 7.3 组合使用

**常见组合 1：dbt tests + Soda + Monte Carlo**

- **dbt tests**：开发环境 CI gate。
- **Soda**：批处理规则执行。
- **Monte Carlo**：可观测性 + 自动异常检测。
- **适用**：数据湖仓一体 + 成熟数据团队。

**常见组合 2：Great Expectations + DataHub + 自研告警**

- **Great Expectations**：规则引擎。
- **DataHub**：血缘 + 元数据。
- **自研告警**：对接钉钉 / 飞书。
- **适用**：传统大厂 + 已有 DataHub。

**常见组合 3：Flink + Deequ + Prometheus**

- **Flink**：流处理。
- **Deequ**：实时规则。
- **Prometheus**：指标采集 + 告警。
- **适用**：实时数仓 + 已有 Flink 团队。

**常见组合 4：Data Contract + Monte Carlo + Soda**

- **Data Contract**：契约定义（schema、SLA、SLO）。
- **Monte Carlo**：自动监控契约 SLA。
- **Soda**：规则执行。
- **适用**：多团队 Data Mesh + 联邦化治理。

---
