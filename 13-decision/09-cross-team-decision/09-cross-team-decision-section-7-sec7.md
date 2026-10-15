> 本文件是 **09-cross-team-decision.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](09-cross-team-decision.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 临时会议 | RACI | DACI | RAPID | RFC + ADR | AI 辅助 |
| --- | --- | --- | --- | --- | --- | --- |
| 决策权清晰 | 1 | **5** | **5** | **5** | 4 | 4 |
| 共识构建 | 2 | 2 | 3 | 3 | **5** | 4 |
| 可追溯性 | 1 | 2 | 2 | 2 | **5** | 4 |
| 跨团队适用 | 2 | 3 | 4 | 4 | **5** | 4 |
| 实施成本 | **5** | 4 | 4 | 3 | 3 | 4 |
| AI 友好度 | 1 | 2 | 2 | 2 | 3 | **5** |
| 适用规模 | 任意 | 小 | 中 | 大 | 任意 | 任意 |

### 7.2 决策树

```
你需要做跨团队决策
        │
        ├── 决策类型？
        │       ├── 单团队 → 标准 ADR
        │       └── 跨团队 → RACI + DACI
        │
        ├── 决策重要性？
        │       ├── 战略级 → RAPID + Architecture Board
        │       ├── 产品级 → DACI + RFC
        │       └── 战术级 → RACI + ADR
        │
        ├── 跨地域 / 异步？
        │       └── 是 → 异步 RFC + 异步投票
        │
        ├── 跨 BU / 跨组织？
        │       └── 是 → Federation Agreement + Consensus Workshop
        │
        └── 想用 AI 辅助？
                └── 是 → AI Stakeholder 分析 + AI 起草 RFC + Decision Graph
```

### 7.3 组合使用

- **RACI + DACI**：基础决策权分配 + 明确 Approver。
- **DACI + RFC**：决策框架 + 透明流程。
- **RFC + ADR**：决策过程 + 决策归档。
- **Stakeholder Map + Consensus Workshop**：利益相关方管理 + 共识构建。
- **Architecture Board + Tech Radar**：组织治理 + 技术选型。
- **AI 辅助 + 人类 Facilitator**：AI 加速 + 人类把关。
- **Decision Graph + GraphRAG**：决策图谱推理。

---
