> 本文件是 **08-decision-psychology.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](08-decision-psychology.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 拍脑袋 | Checklist | Pre-Mortem | Red Team | AI 辅助 |
| --- | --- | --- | --- | --- | --- |
| 偏误对抗 | 1 | 3 | 4 | **5** | 4 |
| 实施成本 | **5** | 4 | 4 | 2 | 3 |
| 可持续性 | 1 | **5** | 4 | 3 | 4 |
| 跨团队适用 | 2 | 4 | 4 | **5** | 4 |
| 学习曲线 | **5** | **5** | 4 | 3 | 4 |
| AI 友好度 | 1 | 2 | 3 | 3 | **5** |

### 7.2 决策树

```
你需要做重大决策
        │
        ├── 决策可逆？
        │       │
        │       ├── 是（Type 2）→ 标准 ADR + Devil's Advocate
        │       └── 否（Type 1）→ Pre-Mortem + Red Team + AI 偏误检测
        │
        ├── 涉及多个团队？
        │       └── 是 → RACI + 匿名投票 + 多 Reviewer
        │
        ├── 高不确定性？
        │       └── 是 → Scenario Analysis + Bayesian + 范围实验
        │
        ├── 战略级？
        │       └── 是 → Working Backwards + Pre-Mortem + 多轮评审
        │
        └── 想用 AI 辅助？
                └── 是 → LLM 偏误检测 + Decision Intelligence 平台
```

### 7.3 组合使用

- **ADR + Pre-Mortem + Devil's Advocate**：标准决策流程。
- **Decision Matrix + Decision Journal**：量化 + 复盘。
- **RACI + 匿名投票**：跨团队决策治理。
- **AI 辅助 + 人类 Reviewer**：人机协同决策。
- **Decision Journal + KG**：决策图谱 + 长期学习。

---
