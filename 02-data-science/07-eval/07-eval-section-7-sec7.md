> 本文件是 **07-eval.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](07-eval.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 离线评估 | A/B 测试 | Interleaving | Bandit | 因果推断 | LLM 评估 |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| 速度 | 5 | 2 | 4 | 5 | 3 | 3 |
| 真实性 | 2 | 5 | 5 | 5 | 4 | 3 |
| 因果性 | 1 | 5 | 3 | 4 | 5 | 1 |
| 工程成本 | 2 | 4 | 3 | 4 | 5 | 3 |
| 业务对齐 | 3 | 5 | 4 | 4 | 5 | 3 |
| 长期评估 | 1 | 5 | 2 | 5 | 4 | 2 |
| AI 时代适配 | 2 | 3 | 3 | 4 | 4 | 5 |

**结论**：

- **标准上线**：离线 + A/B + 业务指标。
- **快速迭代**：Interleaving + CUPED。
- **实时个性化**：Bandit。
- **不能随机化**：因果推断。
- **LLM 评估**：HELM / AlpacaEval / Arena。
- **Agent 评估**：WebArena / SWE-bench。

### 7.2 决策树

```
[评估任务]
   │
   ├── [评估什么？]
   │     ├── 传统 ML 模型 → A/B 测试 + 业务指标
   │     ├── LLM → HELM / AlpacaEval / Arena
   │     └── Agent → WebArena / SWE-bench
   │
   ├── [评估阶段？]
   │     ├── 预上线 → 离线评估 + Interleaving
   │     └── 全量上线 → A/B 测试 + 因果推断
   │
   ├── [流量大小？]
   │     ├── 大 → A/B 测试
   │     ├── 中 → Interleaving + CUPED
   │     └── 小 → Contextual Bandit
   │
   ├── [能否随机化？]
   │     ├── 能 → RCT / A/B 测试
   │     └── 不能 → 因果推断（PSM / DID / DML）
   │
   ├── [是否多指标？]
   │     ├── 是 → FDR / Bonferroni 校正
   │     └── 否 → 单指标 t 检验
   │
   └── [是否长期？]
         ├── 是 → Holdout + 长期监控
         └── 否 → 短周期实验
```

### 7.3 组合使用

**组合 1：离线 + A/B + 因果（标准 ML 上线）**

- 离线筛选候选。
- A/B 测试验证。
- 因果推断确认。

**组合 2：Interleaving + A/B（搜索 / 推荐）**

- Interleaving 快速筛选。
- A/B 测试确认。

**组合 3：CUPED + Bandit（小流量）**

- CUPED 缩减方差。
- Bandit 实时决策。

**组合 4：LLM-as-Judge + Human Eval（LLM 评估）**

- AI-as-Judge 快速评估。
- Human Eval 校准。

**组合 5：WebArena + SWE-bench（Agent 评估）**

- WebArena 测 Web 能力。
- SWE-bench 测代码能力。

**组合 6：DID + Causal Forest（政策 / 营销）**

- DID 评估平均效应。
- Causal Forest 评估异质性。

**组合 7：HELM + Arena（LLM 综合评估）**

- HELM 综合能力评估。
- Arena 人类偏好排名。

---
