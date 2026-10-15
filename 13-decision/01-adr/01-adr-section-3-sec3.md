> 本文件是 **01-adr.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](01-adr.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Nygard 经典模板（最轻量）**

Michael Nygard 2011 年提出的 4 段式：

```markdown
# {编号}. {标题}

## Status
{Proposed / Accepted / Superseded by ADR-XXXX}

## Context
{决策的上下文 / 约束 / 业务背景}

## Decision
{我们决定做什么}

## Consequences
{正面 + 负面影响}
```

- 优点：极简、易写、易读。
- 缺点：缺乏「选项对比」与「权重」，决策依据不充分。
- 适用：小型团队、低风险决策、单系统。

**模式 2：MADR（Markdown Any Decision Records）**

完整版字段：

```markdown
# {编号}. {标题}

- Status: {Accepted}
- Date: {YYYY-MM-DD}
- Deciders: {团队 / 决策者}
- Consulted: {被咨询的专家}
- Informed: {被通知的相关方}

## Context and Problem Statement
{问题描述 + 业务 / 技术驱动}

## Decision Drivers
- {驱动 1}
- {驱动 2}

## Considered Options
1. {选项 A}
2. {选项 B}
3. {选项 C}

## Decision Outcome
**Chosen option: "{选项 X}"**, because {理由}.

### Consequences
- Good: {正面}
- Bad: {负面}
- Neutral: {中性}

### Confirmation
{如何验证决策正确——指标 / 评审 / 复盘}
```

- 优点：完整、可追溯、含决策驱动。
- 缺点：模板较长，写一条 ADR 需 30-60 分钟。
- 适用：中等以上规模团队、长期决策、跨团队决策。

**模式 3：Y-statement（单句决策）**

```
In the context of {上下文},
facing {关切 / 约束},
we decided for {选项},
to achieve {目标},
accepting {代价 / 后果}.
```

- 优点：一句话、机器可解析、易于做 KG 索引。
- 缺点：缺乏细节，不能独立存在，需配主文档。
- 适用：决策图谱、决策仪表盘、AI 自动抽取。

**模式 4：Lightweight ADR + Decision Matrix**

把决策矩阵独立成表格，ADR 主文档保持极简，附录放评估矩阵。

- 优点：兼顾简洁与深度。
- 缺点：模板约定需团队共识。
- 适用：希望保留「极简模板」但又需要「量化依据」的团队。

**模式 5：Pattern-based ADR（按模式分类）**

把 ADR 按主题分类——`adr/security/`、`adr/data/`、`adr/platform/`——便于检索与治理。

- 优点：组织可治理、易检索。
- 缺点：分类成本高、初期不灵活。
- 适用：大型组织、技术战略部、跨 BU 决策。

**模式 6：Living ADR（持续演进的 ADR）**

与 RFC / Design Doc 融合，ADR 不仅是决策记录，还包含实施进展、回滚条件、监测指标。

- 优点：决策可观测。
- 缺点：维护成本高。
- 适用：长生命周期决策（如基础设施迁移）。

### 3.2 适用场景决策表

| 团队规模 | 决策风险 | 推荐模式 | 理由 |
| --- | --- | --- | --- |
| 5-10 人 | 低 | Nygard 经典 | 速度优先 |
| 10-50 人 | 中 | MADR | 完整可追溯 |
| 50-200 人 | 中高 | MADR + 模式分类 | 跨团队可检索 |
| 200+ 人 | 高 | Y-statement + Living ADR | 组织可治理 |
| 任何规模 | 战略级 | Pattern-based + Decision Matrix | 与战略对齐 |

### 3.3 反模式与陷阱

1. **「伪 ADR」陷阱**：把 ADR 当成 Design Doc，写成大篇幅设计说明而失去「决策记录」本质。**ADR 是 log，不是 spec**。
2. **「文档僵尸」**：写完就扔进 docs/adr/ 永不更新。**ADR 需要 active 状态维护**。
3. **「过度工程化」**：50 人团队却要求每条 ADR 走 4 周评审，决策成本爆炸。**模板要匹配风险**。
4. **「事后追溯」**：决策做了再编 ADR，写出来的都是「为什么我们做得好」。**ADR 必须在决策**之前**起草**。
5. **「无人 review」**：ADR 只在自己分支里，没人评审。**ADR 必须 PR 化 + Reviewer 制度**。
6. **「永不 supersede」**：明知决策过时也不更新，ADR 库变成历史垃圾。**建立 supersede 机制**。
7. **「决策 owner 缺失」**：每条 ADR 不知道谁负责，出了问题无人响应。**每条 ADR 必须有 owner**。
8. **「混用术语」**：ADR 与 RFC 与 Design Doc 边界不清，团队困惑。**建立组织级定义**。
9. **「缺乏索引」**：ADR 散落各处，无法检索。**建立 ADR Index**。
10. **「无 consequence」**：只写决策不写后果，无法复盘。**Consequences 是 ADR 的灵魂**。

---
