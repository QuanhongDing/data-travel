> 本文件是 **01-data-agent.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](01-data-agent.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 传统 BI | ChatBI（NL2BI） | Copilot（Excel） | Data Agent |
| --- | --- | --- | --- | :---: |
| 自助门槛 | 2（要学） | 4（自然语言） | 3（要基础） | **5** |
| 灵活性 | 4（专家模式） | 2（预设问题） | 2（仅辅助） | **5** |
| 多轮精修 | 2 | 1 | 1 | **5** |
| 工具调用 | 1 | 1 | 2 | **5** |
| 自主决策 | 1 | 2 | 1 | **5** |
| 业务理解 | 2 | 3 | 1 | **4** |
| 数据安全 | **5** | 3 | 1 | **4** |
| 可观测 | 3 | 2 | 1 | **4** |
| 工程门槛 | 2 | 3 | 5 | **3** |
| 工具成熟度 | **5** | 3 | 4 | **4** |

**结论**：

- **Data Agent 在「自助门槛、灵活性、多轮精修、工具调用、自主决策」5 项满分**。
- **Data Agent 在「数据安全、工程门槛」2 项劣势**——但前者可通过沙箱弥补，后者可逐步降低。

### 7.2 决策树

```
[企业数据分析场景]
   │
   ├── 「已有完整数仓 + 业务会 SQL」→ 传统 BI（Tableau / PowerBI）
   │
   ├── 「高频预设问题（≤ 50 个）」→ ChatBI（QuickBI / ThoughtSpot）
   │
   ├── 「复杂报表（Office 用户为主）」→ Copilot（Excel Copilot / Office Copilot）
   │
   ├── 「人人要查数、口径混乱」→ Data Agent ★
   │
   ├── 「复杂归因分析」→ Data Agent + Multi-Agent ★
   │
   ├── 「知识 + 数据双消费」→ Data Agent + RAG + GraphRAG ★
   │
   └── 「企业级数据分析平台」→ Data Agent + OneMetric + BI 工具 ★
```

### 7.3 组合使用

**组合 1：Data Agent + 指标语义层（OneMetric）**

- 指标语义层：统一指标定义。
- Data Agent：消费指标、查 SQL、归因。
- 适用：中大型企业（必选）。

**组合 2：Data Agent + RAG / GraphRAG**

- Data Agent：查结构化数据。
- RAG / GraphRAG：查非结构化知识。
- 适用：知识 + 数据双消费场景。

**组合 3：Data Agent + BI 工具**

- Data Agent：自然语言入口。
- BI 工具：深度分析、可视化。
- 适用：业务自助 + 分析师深度分析并存。

**组合 4：Data Agent + Python 沙箱（Code Interpreter）**

- SQL 查数据 + Python 做归因 / 预测。
- 适用：复杂分析场景。

**组合 5：Data Agent + Multi-Agent 协同**

- Data Agent：数据查询。
- 业务 Agent：业务执行。
- 运营 Agent：运营决策。
- 适用：复杂业务闭环。

---
