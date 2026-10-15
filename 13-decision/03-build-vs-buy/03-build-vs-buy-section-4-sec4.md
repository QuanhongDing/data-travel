> 本文件是 **03-build-vs-buy.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](03-build-vs-buy.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：识别候选能力 / 组件**

- 列出所有需要的能力 / 组件。
- 按 Core / Edge / Spot 分类。

**Step 2：评估战略价值**

- 业务差异化重要性（1-5）。
- 长期价值（1-5）。

**Step 3：评估团队能力**

- 当前能力（1-5）。
- 学习能力（1-5）。
- 培养周期（人月）。

**Step 4：TCO 3 年 / 5 年计算**

| 维度 | 自研 | 采购 / SaaS |
| --- | --- | --- |
| 初始成本 | 人力 / 时间 | 采购费 / 集成费 |
| 年度运营 | 团队人力 + 维护 | 订阅费 |
| 培训 | 培训费 | 培训费 |
| 切换 | 未来切换成本 | 切换成本 |
| 机会成本 | 业务不能用 | 业务不能用 |

**Step 5：风险评估**

- 自研风险：技术风险 + 团队风险 + 维护风险。
- 采购风险：供应商风险 + 合规风险 + 锁定风险。
- 用 FMEA / Risk Register（详见 §04）。

**Step 6：决策矩阵 + Sensitivity Analysis**

- 多准则加权打分。
- Sensitivity：TCO 波动 / 权重波动 → 决策稳健性。

**Step 7：决策 + ADR**

- 选 make / buy / mix。
- 写 ADR（含 TCO + 决策矩阵）。
- 强制 Owner + 复盘日期。

**Step 8：执行 + 监控**

- 自研：Sprint 计划 + 里程碑。
- 采购：POC + SLA 谈判 + 合同。
- 监控：TCO 实际 vs 预算。

**Step 9：复盘**

- 半年 / 1 年复盘：决策是否正确？
- TCO 实际 vs 预算。
- 更新 Make-or-Buy 决策经验库。

### 4.2 关键技术点

1. **TCO 模板**：Excel / Google Sheets 自建。
2. **决策矩阵**：详见 §02-tradeoff-frameworks。
3. **Risk-adjusted NPV**：Excel / Python。
4. **Sensitivity Analysis**：Excel 数据表 / Python。
5. **Make-or-Buy Decision Tree**：PowerPoint / Miro。
6. **Core-Edge-Spot Mapping**：Miro / Figma。
7. **Vendor Lock-in 评估表**：自建 Excel。
8. **AI 辅助决策**：LLM 推荐 + 评审。
9. **Decision Intelligence Platform**（2024+）：组织级决策图谱。

### 4.3 工具链与平台

**TCO / 财务分析**：

- **Excel / Google Sheets**——TCO 模板。
- **CloudZero / Vantage**——云成本 TCO（2024）。
- **FinOps 工具**（CloudHealth、Apptio）——云财务运营。
- **Vendr**——SaaS 采购管理（2024）。
- **Zylo**——SaaS 管理平台。

**决策矩阵 / 评估**：

- **AHP Online / Decisions.com**（详见 §02）。
- **Tractable.ai / Planet**——AI 决策平台。

**Core-Edge-Spot Mapping**：

- **Miro / Figma / Lucidchart**——可视化战略地图。
- **Wardley Maps**（OnlineMapping.io）——价值链映射。

**AI 辅助（2024-2025）**：

- **Claude / GPT-4**——选项推荐 + TCO 估算 + 风险评估。
- **Decision Intelligence Platforms**——DI 平台。
- **Anthropic Constitutional AI**——AI 决策「宪法」。

**合同管理 / 供应商管理**：

- **DocuSign / Adobe Sign**——合同电子签。
- **Ironclad / ContractWorks**——合同管理（CLM）。
- **Coupa / SAP Ariba**——采购管理。

### 4.4 代码 / 示例

**示例 1：Core-Edge-Spot 分类**

| 能力 | 类别 | 战略价值 | 决策 | 理由 |
| --- | --- | --- | --- | --- |
| 智能体编排框架 | Core | 5 | 自研 | 业务差异化 |
| 向量库 | Edge | 3 | 采购 / 托管 | 通用能力 |
| LLM API | Edge | 3 | 采购 | 通用能力 |
| 领域 RAG 策略 | Core | 5 | 自研 | 业务差异化 |
| 监控告警 | Edge | 2 | SaaS | 通用能力 |
| 数据湖 | Edge | 3 | 开源 / 托管 | 通用能力 |

**示例 2：TCO 3 年对比（向量库自研 vs 采购 Pinecone）**

| 成本项 | 自研 Milvus | 采购 Pinecone |
| --- | --- | --- |
| 初始开发（3 人 × 3 月） | 90 万 | 0 |
| 采购 | 0 | 80 万 / 年 |
| 运营人力（1 人 × 3 年） | 90 万 × 3 = 270 万 | 0 |
| 培训 | 10 万 | 5 万 / 年 |
| 维护 | 20 万 / 年 | 含在采购 |
| **3 年 TCO** | **490 万** | **255 万** |

→ 采购便宜 235 万（48%）。但战略自主性 + 定制能力差异需权衡。

**示例 3：Risk-adjusted NPV**

| 维度 | 自研向量库 | 采购 Pinecone |
| --- | --- | --- |
| NPV（5 年） | 300 万 | 400 万 |
| 失败概率 | 30% | 10% |
| 失败损失 | 60%（重建） | 20%（迁移） |
| **风险调整 NPV** | **300 × 0.82 = 246 万** | **400 × 0.98 = 392 万** |

→ 风险调整后采购仍胜。

**示例 4：Vendor Lock-in 评估**

| 维度 | Pinecone | 锁定风险 |
| --- | --- | --- |
| 数据格式 | 专有 | 高 |
| API 兼容 | 专有 | 高 |
| 工具链 | 专有 | 中 |
| 培训 | 专有 | 中 |
| 社区 | 标准化 | 低 |
| **综合锁定风险** | | **中-高** |

→ 高锁定风险 → 自研（BOT）或选开源（Milvus）。

**示例 5：Make-or-Buy Decision Tree 应用**

```
需要的能力：智能体工作流引擎
        │
        ├── 业务核心？  → 是
        │       │
        │       ├── 团队有能力？  → 是
        │       │       │
        │       │       └── 长期投入？  → 是
        │       │               │
        │               └── → 自研（核心 Agent 框架 + 编排）
        │
        └── 上线时间紧迫？  → 否
                │
                └── 采购方案成熟？  → 部分
                        │
                        ├── 切换成本高？  → 否（可换 LangChain / AutoGen）
                        │
                        └── → 混合：核心自研 + 通用采购
```

**示例 6：Make-Buy-Mix 决策表**

| 组件 | 类别 | 决策 | 方案 |
| --- | --- | --- | --- |
| LLM API | Edge | 采购 | OpenAI + Anthropic |
| 向量库 | Edge | 采购 / 托管 | Pinecone 或 Milvus 托管 |
| Agent 框架 | Core | 自研 | LangChain 二次开发 |
| 领域 RAG | Core | 自研 | 业务专属 |
| 监控 | Edge | SaaS | Datadog |
| 工作流编排 | Core | 自研 | 业务专属 |

**示例 7：AI 辅助 Make-or-Buy（Python / Claude）**

```python
import anthropic
import os

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def recommend_make_or_buy(component: str, context: dict) -> str:
    """基于组件 + 上下文，让 Claude 推荐 Make-or-Buy 决策。"""
    prompt = f"""你是一名资深数据架构师，专注 Make-or-Buy 决策。

## 组件
{component}

## 上下文
{chr(10).join(f"- {k}: {v}" for k, v in context.items())}

请基于 Core-Edge-Spot 框架 + TCO + 风险调整 NPV，给出建议：
1. **决策**：自研 / 采购 / SaaS / 混合
2. **理由**：Core-Edge-Spot 定位 + TCO 对比 + 风险评估
3. **3 年 TCO 对比表**
4. **风险与缓解**
5. **ADR 草稿要点**

输出 Markdown。"""

    msg = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

# 使用
recommendation = recommend_make_or_buy(
    component="智能体平台的核心 Agent 编排引擎",
    context={
        "战略价值": "业务差异化核心（评分 5/5）",
        "团队能力": "有 LangChain 经验（评分 4/5）",
        "上线时间": "12 个月",
        "采购方案": "LangChain / AutoGen / CrewAI 可选",
        "总预算": "300 万 / 年",
    },
)
print(recommendation)
```

---
