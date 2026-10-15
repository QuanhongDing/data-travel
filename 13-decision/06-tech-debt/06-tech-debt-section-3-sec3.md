> 本文件是 **06-tech-debt.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](06-tech-debt.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Martin Fowler 技术债象限**

| | Deliberate（刻意） | Inadvertent（无意） |
| --- | --- | --- |
| **Prudent（谨慎）** | "我们现在 MVP，后续偿还" + 有还债计划 | "我们当时不知道更好方案" |
| **Reckless（鲁莽）** | "没时间设计，先写代码" + 无还债计划 | "什么是技术债？" |

- **Deliberate + Prudent**：知情权衡 → 可管理。
- **Deliberate + Reckless**：明知故犯 → 必须治理。
- **Inadvertent + Prudent**：事后学习 → 通过复盘减少。
- **Inadvertent + Reckless**：能力不足 → 通过培训减少。

**模式 2：技术债 Backlog（产品 Backlog 风格）**

```
- DEBT-001：核心服务缺少单元测试（覆盖率 30%）— 高优先级
- DEBT-002：订单系统单库单表，无分库分表 — 中优先级
- DEBT-003：监控缺失，关键路径无告警 — 高优先级
- DEBT-004：文档缺失，新人上手需 1 个月 — 中优先级
- DEBT-005：AI Prompt 硬编码在代码中 — 中优先级
```

每条含：ID、描述、优先级、本金、利息、Owner、还债计划。

**模式 3：技术债地图（Tech Debt Map）**

可视化技术债分布：

| 模块 | 技术债 / 千行 | 利息 / 年 | 优先级 |
| --- | --- | --- | --- |
| 订单系统 | 30 | 200 万 | 高 |
| 用户系统 | 15 | 80 万 | 中 |
| 营销系统 | 50 | 300 万 | 极高 |

**模式 4：技术债预算（Tech Debt Budget）**

组织允许的技术债「总额」（如 1500 万 / 团队 / 年）。

- 新功能上线必须评估技术债增量。
- 超过预算必须先还债再上功能。

**模式 5：技术债 Sprint（还债 Sprint）**

每季度 1 个 Sprint 专门还债（10-20% 团队容量）。

- Sprint 内容：从 Backlog 选高优先级债单。
- 效果：可度量、可追溯。

**模式 6：Strangler Fig Pattern（绞杀者模式）**

渐进重构：用新系统逐步替代旧系统。

```
旧系统 ──→ [路由层] ──→ 新系统
              │
              └── 逐步迁移
```

适用：大型遗留系统重构（如单机 → 微服务）。

**模式 7：Branch by Abstraction（抽象分支）**

```
旧实现 ──→ [抽象层] ──→ 新实现
              │
              └── 逐步切换
```

适用：核心组件重构（如 ORM 切换）。

**模式 8：Code Quality Gates（质量门禁）**

CI / CD 中加入质量门禁：
- 覆盖率 < 80% → 禁止合并。
- SonarQube Tech Debt Ratio > 10% → 禁止合并。
- 圈复杂度 > 15 → 禁止合并。
- 代码重复率 > 5% → 禁止合并。

**模式 9：AI Tech Debt 治理**

AI 应用特有技术债：

| AI 债 | 检测 | 治理 |
| --- | --- | --- |
| Prompt 硬编码 | 代码扫描 | Prompt Registry |
| 模型无版本 | ML Metadata | Model Registry |
| 模型无监控 | Drift 检测 | Model Monitoring |
| 模型无评估 | 评估缺失 | Eval Pipeline |
| Agent 无审计 | 日志缺失 | Agent Trace |
| 数据漂移 | 漂移检测 | Data Drift Monitor |

**模式 10：Tech Debt Burndown（燃烧图）**

类似 Sprint Burndown，展示技术债随时间减少：

```
技术债 / 万
│
│ ●
│   ●●
│       ●●●
│            ●●●●
│                 ●●●●●
└───────────────────────── 时间
       Q1     Q2     Q3
```

### 3.2 适用场景决策表

| 场景 | 推荐方法 | 理由 |
| --- | --- | --- |
| 技术债识别 | Tech Debt Map + AI 辅助 | 可视化 + 自动化 |
| 技术债量化 | SQALE + SonarQube | 标准化 |
| 偿债优先级 | Tech Debt Backlog + ROI | 可治理 |
| 还债节奏 | Tech Debt Sprint + Budget | 可持续 |
| 遗留系统重构 | Strangler Fig + Branch by Abstraction | 渐进 |
| AI 应用 | AI Tech Debt 治理 | AI 特有 |
| 高质量门禁 | Code Quality Gates | 自动化 |

### 3.3 反模式与陷阱

1. **「看不见技术债」**：只关注功能，忽视质量。**Tech Debt Map + 定期盘点**。
2. **「无限拖延」**：「等有时间就还」，结果永远没时间。**强制 Tech Debt Sprint**。
3. **「过度还债」**：把所有时间都用于还债，业务停滞。**Tech Debt Budget + 优先级**。
4. **「不知情技术债」**：没有 Tech Debt Backlog。**强制录入**。
5. **「业务方不理解」**：技术债沟通失败。**翻译成业务成本（利息）**。
6. **「沉没成本陷阱」**：旧代码不值得还债，但坚持还债。**评估还债 ROI**。
7. **「AI 债忽视」**：AI 应用特有的技术债被忽视。**AI Tech Debt 治理**。
8. **「不量化」**：所有技术债都「高 / 中 / 低」，无法排序。**强制 SQALE 量化**。
9. **「无 Owner」**：技术债列出但无人负责。**每条必须有 Owner**。

---
