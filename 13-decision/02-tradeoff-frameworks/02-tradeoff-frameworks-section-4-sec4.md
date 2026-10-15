> 本文件是 **02-tradeoff-frameworks.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](02-tradeoff-frameworks.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：识别候选选项**

- 列出至少 3 个候选（抗锚定）。
- 每个选项给出 1-2 句简要描述。

**Step 2：确定评估维度**

- 用 6 维度模型（性能 / 成本 / 团队 / 生态 / 治理 / 风险）。
- 或参考 AWS Well-Architected 5 支柱。
- AI / 数据领域特殊维度：幻觉率、合规、ROI、数据安全。

**Step 3：确定权重**

- 用 AHP 或多人投票确定权重（Σ = 1）。
- 团队投票：每人独立给权重 → 取均值。
- 战略级决策：高管 + 架构师共同投票。

**Step 4：独立打分**

- 每个选项在每个维度独立打分（1-5）。
- 多人独立打分 → 取均值 + 标准差（标准差大 = 共识差）。
- 分数必须有依据（数据 / 案例 / 实验）。

**Step 5：加权求总分 + Sensitivity Analysis**

- 计算每个选项的总分。
- 权重 ±20% 看总分变化。
- 决策稳健：进入 Step 6。
- 决策敏感：回到 Step 3 重新确定权重。

**Step 6：决策 + ADR 归档**

- 选总分最高选项。
- 写 ADR（详见 §1-adr）。
- 包含 Considered Options + Decision Matrix + Sensitivity Analysis。

**Step 7：复盘**

- 半年后回看：决策是否正确？
- 更新 Trade-off Framework 经验库。

### 4.2 关键技术点

1. **决策矩阵模板**：Excel / Google Sheets / Markdown。
2. **AHP 工具**：ahp.online、Expert Choice。
3. **TOPSIS 库**：Python `pyDecision`、R `MCDA`。
4. **TCO 计算工具**：TCO 模板（Excel）。
5. **Sensitivity Analysis 工具**：Excel 数据表、Python。
6. **Tech Radar 工具**：ThoughtWorks Tech Radar（GitHub 开源）、自建。
7. **AI 辅助**：LLM 推荐选项 + 打分。
8. **Decision Intelligence Platform**（2024+）：组织级选型决策图谱。

### 4.3 工具链与平台

**决策矩阵 / 加权打分**：

- **Excel / Google Sheets**——最常用。
- **AHP Online**（ahp.online）——层次分析法工具。
- **Decisions.com**——决策辅助平台。
- **MindTools Decision Matrix**——免费模板。
- **Pugh Matrix 模板**——Excel / Sheets。

**多准则决策库（代码）**：

- **Python `pyDecision`**——AHP / TOPSIS / ELECTRE。
- **Python `scikit-criteria`**——MCDA 库。
- **R `MCDA`**——多准则决策。
- **Julia `JuMCDA.jl`**——MCDA 库。

**Tech Radar / 参考架构**：

- **ThoughtWorks Tech Radar**（开源）——技术雷达标杆。
- **Zalando Tech Radar**——开源。
- **AWS Well-Architected Tool**——云架构选型指南。
- **Google Cloud Architecture Framework**——云架构选型指南。

**TCO / 财务分析**：

- **Excel TCO 模板**——自建。
- **CloudZero / Vantage**——云成本 TCO 工具（2024）。
- **FinOps 工具**（CloudHealth、Apptio）——云财务运营。

**AI 辅助（2024-2025）**：

- **Claude / GPT-4**——选项推荐 + 打分 + 评审。
- **Decision Intelligence Platforms**——DI 平台。
- **AI 辅助决策助手**（Anthropic / OpenAI 企业版）。
- **LangChain / LlamaIndex**——AI 决策自动化。

### 4.4 代码 / 示例

**示例 1：6 维度加权打分**

| 选项 | 性能 (0.2) | 成本 (0.2) | 团队 (0.2) | 生态 (0.15) | 治理 (0.15) | 风险 (0.1) | 总分 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Flink | 9 | 6 | 8 | 9 | 8 | 7 | 7.85 |
| Spark Structured Streaming | 7 | 7 | 9 | 9 | 8 | 8 | 7.85 |
| RisingWave | 8 | 7 | 6 | 6 | 7 | 7 | 6.85 |
| Materialize | 8 | 5 | 6 | 6 | 7 | 7 | 6.55 |

→ Flink 与 Spark 并列，但 Flink 在「性能」上更优（9 vs 7），最终选 Flink。

**示例 2：CAP / PACELC 决策**

```
我们选型消息总线：
- Kafka：AP（最终一致）+ 高吞吐 + 生态丰富
- Pulsar：AP + 存算分离 + 多租户
- RocketMQ：AP + 阿里生态 + 事务消息

业务需求：
- 订单事件（强一致优先）：Pulsar / RocketMQ
- 日志采集（高吞吐优先）：Kafka
- 用户行为（最终一致）：Kafka
→ 按场景混合使用。
```

**示例 3：TCO 3 年计算**

| 成本项 | 自研向量库 | 采购 Pinecone |
| --- | --- | --- |
| 初始开发 | 200 万 | 0 |
| 采购 | 0 | 80 万 / 年 |
| 运营人力（2 人） | 60 万 / 年 | 0 |
| 培训 | 10 万 | 5 万 / 年 |
| 维护 | 50 万 / 年 | 含 |
| **3 年 TCO** | **590 万** | **255 万** |

→ 采购节约 335 万（57%）。但自研有「战略自主 + 定制能力」——需权衡。

**示例 4：AHP 简化版**

```
目标：选型流处理引擎

准则：
- 性能 (P)：权重 0.4
- 团队匹配度 (T)：权重 0.3
- 生态 (E)：权重 0.2
- 风险 (R)：权重 0.1

两两比较（P vs T）：P 略重要（3:1）→ P=0.6, T=0.4 调整
→ 最终权重：P=0.45, T=0.30, E=0.15, R=0.10

各选项打分：
Flink: P=9, T=8, E=9, R=7 → 0.45×9 + 0.30×8 + 0.15×9 + 0.10×7 = 8.50
Spark: P=7, T=9, E=9, R=8 → 0.45×7 + 0.30×9 + 0.15×9 + 0.10×8 = 7.85
→ Flink 胜出。
```

**示例 5：Sensitivity Analysis**

| 性能权重变化 | Flink 总分 | Spark 总分 | 结论 |
| --- | --- | --- | --- |
| 0.20 | 7.85 | 7.85 | 平局 |
| 0.30 | 8.20 | 7.85 | Flink 胜 |
| 0.45 | 8.50 | 7.85 | Flink 胜 |
| 0.60 | 9.00 | 8.20 | Flink 胜 |

→ 性能权重在 0.20-0.60 范围内 Flink 都胜（或平局），决策稳健。

**示例 6：Trade-off Table**

```
技术选型：消息总线
┌──────────────┬────────┬────────┬────────┐
│   维度       │ Kafka  │ Pulsar │RocketMQ│
├──────────────┼────────┼────────┼────────┤
│ 吞吐         │  ★★★★★ │ ★★★★☆ │ ★★★★☆ │
│ 延迟         │  ★★★★☆ │ ★★★★☆ │ ★★★☆☆ │
│ 团队匹配度   │  ★★★★★ │ ★★☆☆☆ │ ★★★☆☆ │
│ 阿里生态     │  ★★★☆☆ │ ★★☆☆☆ │ ★★★★★ │
│ 存算分离     │  ★★☆☆☆ │ ★★★★★ │ ★★☆☆☆ │
│ 多租户       │  ★★☆☆☆ │ ★★★★★ │ ★★★☆☆ │
│ 事务消息     │  ★★★☆☆ │ ★★★☆☆ │ ★★★★★ │
│ 社区活跃度   │  ★★★★★ │ ★★★☆☆ │ ★★☆☆☆ │
└──────────────┴────────┴────────┴────────┘
综合：Kafka（团队 + 生态）vs RocketMQ（生态 + 事务）→ 取决于业务。
```

**示例 7：AI 辅助选型（Python / Claude）**

```python
import anthropic
import os

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def recommend_options(scenario: str, constraints: list[str]) -> str:
    """基于场景 + 约束，让 Claude 推荐候选选项 + 初步评估。"""
    prompt = f"""你是一名资深数据架构师，专注选型决策。

## 场景
{scenario}

## 约束
{chr(10).join(f"- {c}" for c in constraints)}

请推荐 3-5 个候选选项，并按 6 维度（性能 / 成本 / 团队 / 生态 / 治理 / 风险）打分（1-5）。

输出 Markdown 表格 + 推荐意见。"""

    msg = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

# 使用
recommendation = recommend_options(
    scenario="公司要选型一个新的向量数据库，支撑 1 亿条文档的 RAG 检索，要求毫秒级延迟。",
    constraints=["团队有 PostgreSQL 经验", "必须支持中文", "3 个月上线", "总预算 200 万"],
)
print(recommendation)
```

---
