> 本文件是 **05-tech-strategy.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](05-tech-strategy.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：Hype Cycle（Gartner 技术成熟度曲线）**

5 阶段：

1. **Innovation Trigger（创新触发）**：新技术诞生。
2. **Peak of Inflated Expectations（期望膨胀峰值）**：过度炒作。
3. **Trough of Disillusionment（幻灭低谷）**：期望破灭。
4. **Slope of Enlightenment（复苏斜坡）**：真实价值被认识。
5. **Plateau of Productivity（生产性平原）**：成为基础设施。

→ 战略建议：Innovation Trigger 不投；Trough 评估；Slope 试用；Plateau 大规模采纳。

**模式 2：Tech Radar（ThoughtWorks）**

四象限（每半年更新）：

- **Adopt（采纳）**：推荐采用，已有实践。
- **Trial（试用）**：值得试用，风险可控。
- **Assess（评估）**：值得关注，研究价值。
- **Hold（暂缓）**：暂不推荐，风险高。

四维度（技术、语言、工具、平台）。

**模式 3：McKinsey Three Horizons**

| Horizon | 阶段 | 资源比例 | 战略目标 |
| --- | --- | --- | --- |
| **H1** | 核心业务 | 70% | 维护 + 优化 |
| **H2** | 新兴业务 | 20% | 拓展 + 试验 |
| **H3** | 未来业务 | 10% | 探索 + 储备 |

**模式 4：Wardley Maps（Simon Wardley）**

```
        高价值
            │
        自研  │  差异化自研
       （Genesis/Custom）
            │
 ───────────┼─────────── 低可见性
            │
        采购  │  标准采购
       （Product/Commodity）
            │
        低价值
```

**模式 5：Core-Edge-Spot（Gartner）**

| 类别 | 战略价值 | 推荐策略 |
| --- | --- | --- |
| **Core** | 业务差异化核心 | 自研 + 投入 |
| **Edge** | 必要但不差异化 | 采购 / 优化 |
| **Spot** | 暂时性机会 | 试验 / 退出 |

**模式 6：Build-Buy-Partner**

| 选项 | 适用 | 优势 | 劣势 |
| --- | --- | --- | --- |
| **Build（自研）** | 核心能力 | 战略自主 | 成本高 |
| **Buy（采购）** | 通用能力 | 快速 / 低成本 | 锁定 |
| **Partner（合作）** | 中间能力 | 平衡 | 协调成本 |

**模式 7：AI Strategy Canvas**

| 维度 | 描述 | 战略权重 |
| --- | --- | --- |
| 数据 | 数据资产化 + 治理 | 0.30 |
| 算法 | 模型选型 + 训练 + 微调 | 0.25 |
| 算力 | 基础设施 + 优化 | 0.20 |
| 治理 | AI 伦理 + 合规 + 安全 | 0.15 |
| 人才 | AI 团队建设 | 0.10 |

**模式 8：Decision Intelligence Strategy**

把决策作为战略资产：

- 决策图谱（Decision Graph）。
- 决策 KPI。
- 决策 ROI 评估。
- AI 辅助决策。

**模式 9：OKR + Tech Strategy**

OKR 对齐技术战略：

- O（Objective）：技术愿景。
- KR（Key Result）：可度量目标（如 QPS、覆盖率、AI 准确率）。

**模式 10：Balanced Scorecard（平衡计分卡）**

四象限：

- 财务（成本 / ROI）。
- 客户（业务满意度）。
- 内部流程（架构健康 / 质量）。
- 学习 / 成长（团队能力 / 技术债）。

**模式 11：Strategic Pivot（战略转向）**

关键转向点：

- 业务转型（如「从离线 → 实时」）。
- 技术换代（如「从 Hadoop → 云原生」）。
- 市场变化（如「国内 → 全球化」）。
- 竞争压力（如「友商全 AI，我们必须 follow」）。

**模式 12：Open Strategy（开放战略）**

把战略部分公开：

- 公开技术雷达（ThoughtWorks / Zalando / Spotify）。
- 公开 ADR（GitHub / GitLab）。
- 开源部分能力。

### 3.2 适用场景决策表

| 场景 | 推荐方法 | 理由 |
| --- | --- | --- |
| 战略规划（高层） | Hype Cycle + Three Horizons | 战略 + 投资组合 |
| 选型决策（团队） | Tech Radar + Decision Matrix | 落地选型 |
| 价值链分析 | Wardley Maps | 可视化战略 |
| AI 战略 | AI Strategy Canvas + Governance | AI 特有 |
| 战略对齐 | OKR + Balanced Scorecard | 度量 + 沟通 |
| 战略转型 | Strategic Pivot + Wardley | 评估转向 |
| 战略公开 | Open Strategy + Tech Radar | 透明 |

### 3.3 反模式与陷阱

1. **「战略无法落地」**：3-5 年战略太抽象。**战略必须配路线图 + OKR**。
2. **「老板不买账」**：技术战略没翻译成业务价值。**用 ROI / 业务影响表达**。
3. **「团队失方向」**：没有可执行目标。**OKR + 季度对齐**。
4. **「盲目跟风」**：今天 All-in Kafka，明天 All-in Pulsar。**Tech Radar 治理**。
5. **「忽视技术债」**：只投新功能，不投还债。**Three Horizons + 技术债预算**。
6. **「战略锁死」**：3 年不变，无法适应变化。**半年评审 + 战略敏捷**。
7. **「一言堂战略」**：CIO/CTO 拍板，团队不买账。**跨团队共建 + OKR 共识**。
8. **「战略 vs 执行割裂」**：战略归战略，执行归执行。**战略必须 Review 反馈**。
9. **「形式主义战略」**：PPT 战略，无实际行动。**战略必须有 Owner + 跟踪**。

---
