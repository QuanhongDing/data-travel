> 本文件是 **06-postmortem-culture.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](06-postmortem-culture.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 追责文化 | Blameless | 5 Whys | Fishbone | FTA | AI 增强 |
| --- | --- | --- | --- | --- | --- | --- |
| 心理安全 | 1 | 5 | 4 | 4 | 4 | 4 |
| 根因深度 | 2 | 4 | 4 | 4 | 5 | 5 |
| 执行成本 | 2 | 3 | 3 | 4 | 5 | 4 |
| 知识沉淀 | 1 | 4 | 3 | 3 | 4 | 5 |
| AI 时代适配 | 1 | 4 | 3 | 3 | 4 | 5 |

### 7.2 决策树

```
你的故障类型？
├── 互联网故障 → Blameless + 5 Whys + Action Items
├── 工业 / 航空 → FTA + Swiss Cheese
├── 制造业 → Fishbone + 5 Whys
├── AI / LLM → Blameless + AI 辅助
└── 跨团队故障 → Blameless + RACI

你的文化成熟度？
├── 初期 → 简化 Blameless（聚焦系统即可）
├── 中期 → Blameless + 5 Whys + Fishbone
└── 成熟 → AI 增强 + 知识图谱
```

### 7.3 组合使用

- **Blameless + 5 Whys**：基础组合。
- **Blameless + Fishbone**：复杂故障多维度分析。
- **Blameless + AI 辅助**：效率提升。
- **Blameless + 知识图谱**：知识沉淀。

---
