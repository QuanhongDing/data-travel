> 本文件是 **04-risk-assessment.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](04-risk-assessment.md)。

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
