> 本文件是 **07-architecture-decisions.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](07-architecture-decisions.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | Lambda | Kappa | Lakehouse | 流批一体 |
| --- | :---: | :---: | :---: | :---: |
| 实时性 | 4 | 5 | 5 | 5 |
| 一致性 | 5 | 4 | 5 | 5 |
| 成本 | 3 | 5 | 5 | 4 |
| 复杂度 | 3 | 4 | 4 | 5 |
| AI 友好 | 2 | 3 | 5 | 4 |
| 成熟度 | 5 | 4 | 4 | 4 |

### 7.2 决策树

```
业务需求？
├── 强一致性 + 实时（金融）
│   └── Lambda 或 Lakehouse
├── 纯实时 + 重放（日志）
│   └── Kappa
├── 现代数据栈 + AI
│   └── Lakehouse
├── 实时数仓 + 流批融合
│   └── 流批一体（Flink + Paimon）
└── AI 原生
    └── Lakehouse + 向量库 + LLM
```

### 7.3 组合使用

**组合 1：Lambda → Lakehouse 迁移**

- 旧 Lambda → 新 Lakehouse。
- 适用：架构演进。

**组合 2：Lakehouse + Kappa**

- Lakehouse 存全量，Kappa 处理实时。
- 适用：混合业务。

**组合 3：Lakehouse + 流批一体**

- Lakehouse 存储 + Flink/Paimon 计算。
- 适用：现代数据栈。

**组合 4：AI 原生架构**

- Lakehouse + 向量库 + LLM + Agent。
- 适用：AI 时代。

---
