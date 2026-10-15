> 本文件是 **03-data-cost-finops.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](03-data-cost-finops.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 工具 / 方案 | 配置成本 | 多云支持 | 自动化程度 | 实时性 | AI 集成 | 成本可见性 | 总分 |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **AWS Cost Explorer** | 5 | 2 | 4 | 4 | 3 | 5 | 23 |
| **Azure Cost Management** | 5 | 2 | 4 | 4 | 3 | 5 | 23 |
| **阿里云费用中心** | 5 | 1 | 4 | 4 | 3 | 5 | 22 |
| **Vantage** | 4 | 5 | 4 | 4 | 4 | 5 | 26 |
| **CloudHealth** | 4 | 5 | 4 | 4 | 3 | 5 | 25 |
| **Apptio (Cloudability)** | 3 | 5 | 5 | 5 | 4 | 5 | 27 |
| **Harness** | 4 | 5 | 5 | 5 | 4 | 5 | 28 |
| **自研 FinOps** | 1 | 5 | 5 | 5 | 5 | 5 | 26 |

### 7.2 决策树

```
是否需要跨云 FinOps？
├── 是 → Vantage / CloudHealth / Apptio
└── 否 → 继续
    │
    是 AWS / Azure / 阿里云 / GCP 单云？
    ├── 是 → 云厂商原生（Cost Explorer / 费用中心）
    └── 否 → 多云工具（Vantage）
        │
        是否预算充足（> 100 万/年）？
        ├── 是 → Apptio / Harness
        └── 否 → 自研 + 云原生
```

### 7.3 组合使用

**常见组合 1：AWS Cost Explorer + Karpenter + 自研标签**

- **Cost Explorer**：成本可视化。
- **Karpenter**：K8s 弹性伸缩。
- **自研标签**：强制 + 治理。

**常见组合 2：阿里云费用中心 + Sigma 调度 + 阿里云 PAI**

- **费用中心**：成本可视化 + 归因。
- **Sigma**：阿里云弹性调度。
- **PAI**：AI 工作负载调度。

**常见组合 3：Snowflake + Atlan + dbt**

- **Snowflake**：数仓 + Cost Explorer。
- **Atlan**：数据资产 + 成本联动。
- **dbt**：SQL 优化 + 测试。

---
