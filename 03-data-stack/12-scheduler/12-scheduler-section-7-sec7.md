> 本文件是 **12-scheduler.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](12-scheduler.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Airflow | DolphinScheduler | Argo | DataWorks |
| --- | :---: | :---: | :---: | :---: |
| 开源 | 5 | 5 | 5 | 1 |
| 易用性 | 4 | 5 | 3 | 5 |
| 云原生 | 4 | 3 | 5 | 5 |
| AI 友好 | 3 | 3 | 4 | 5 |
| 性能 | 4 | 4 | 5 | 5 |

### 7.2 决策树

```
业务需求？
├── Python + 复杂 DAG
│   └── Airflow
├── 国产 + 易用
│   └── DolphinScheduler
├── K8s 原生
│   └── Argo Workflows
├── 阿里云
│   └── DataWorks
└── ML Pipeline
    └── KubeFlow / Argo
```

### 7.3 组合使用

**组合 1：Airflow + K8s**

- Airflow 编排 + K8s 执行。
- 适用：云原生。

**组合 2：Argo + Spark/Flink**

- Argo 编排 + Spark/Flink Operator。
- 适用：K8s 数据栈。

**组合 3：DolphinScheduler + Airflow**

- DolphinScheduler 监控 + Airflow 编排。
- 适用：混合云。

---
