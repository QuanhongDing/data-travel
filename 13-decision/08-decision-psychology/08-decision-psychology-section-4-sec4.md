> 本文件是 **08-decision-psychology.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](08-decision-psychology.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：建立偏误认知清单**

- 选型 ADR / 选型评审会上挂一张「12 种偏误」海报。
- 在 ADR 模板中加入「Pre-Mortem」字段。
- Reviewer Checklist 加入「是否检查了 12 种偏误」。

**Step 2：建立决策流程约束**

- 重大决策强制 ADR + 多人 Review + Pre-Mortem。
- 不可逆决策强制 Red Team。
- 团队级决策用 RACI 明确决策权。

**Step 3：建立决策日志（Decision Journal）**

- 个人 Decision Journal：每周记录 1-2 个决策、当时认知、预期后果。
- 团队 Decision Journal：每月评审 Top 决策。

**Step 4：建立反偏误工具**

- ADR 模板强制 Considered Options ≥ 3。
- Pre-Mortem Checklist。
- Devil's Advocate 角色轮换。
- 匿名投票工具。

**Step 5：建立决策复盘机制**

- 季度复盘会：评估过去 3 个月 Top 决策。
- 决策日志回看：与实际结果对照。
- 失败决策 Postmortem：识别偏误 + 改进流程。

**Step 6：建立组织级决策能力培训**

- 内部 Workshop：12 种偏误 + 案例。
- Reading Club：Kahneman《Thinking, Fast and Slow》。
- 实战演练：Red Team 模拟。

### 4.2 关键技术点

1. **Decision Matrix 表格化**：markdown / Excel / Jira。
2. **Pre-Mortem 模板**：结构化引导（假设失败 → 列举原因 → 评估概率 → 修订方案）。
3. **Decision Journal 工具**：Notion / Obsidian / Logseq。
4. **匿名投票**：Mentimeter、Sli.do、Poll Everywhere。
5. **RACI 工具**：RACI Matrix 模板。
6. **AI 辅助识别偏误**：LLM 检测 ADR 中的偏误。
7. **Decision Dashboard**：Tableau / Power BI 可视化决策质量。

### 4.3 工具链与平台

**Decision Journal / 个人决策工具**：

- **Notion / Obsidian**——个人 Decision Journal。
- **Logseq**——双向链接 + 时间线。
- **Reflect**——AI 增强笔记。

**Decision Matrix / 评估工具**：

- **Excel / Google Sheets**——决策矩阵。
- **AHP Online**（ahp.online）——层次分析法工具。
- **Decisions.com**——决策辅助平台。
- **MindTools Decision Matrix**——免费模板。

**协作 / 评审**：

- **Mentimeter**——匿名反馈。
- **Sli.do**——匿名提问 / 投票。
- **Loomio**——协作决策。
- **Thoughtworks Mingle**——决策跟踪。

**AI 辅助（2024-2025）**：

- **Claude / GPT-4**——识别 ADR 中的偏误。
- **Anthropic Constitutional AI**——AI 决策的「宪法」。
- **Decision Intelligence Platforms**——DI 平台。
- **Humu nudge engine**——基于 Nudge 的组织行为干预。
- **Pol.is**——大规模群体意见聚合。

**团队协作 / 决策治理**：

- **RACI Matrix**——决策权分配。
- **DACI**（Driver / Approver / Contributor / Informed）——决策框架。
- **RAPID**（Recommend / Agree / Perform / Input / Decide）——Bain 决策框架。
- **Vroom-Yetton Decision Model**——决策风格（独裁 vs 协商 vs 共识）。

### 4.4 代码 / 示例

**示例 1：12 种偏误自检 Checklist**

```markdown
## ADR 评审 Checklist：决策偏误自检

### 1. 锚定效应
- [ ] 是否考虑了至少 3 个候选选项？
- [ ] 第一个选项是否影响了对后续选项的评估？

### 2. 确认偏误
- [ ] 是否列出了本方案的反对意见？
- [ ] 是否专门搜集过反对案例？

### 3. 沉没成本
- [ ] 决策是否基于「未来价值」而非「已投成本」？
- [ ] 如果今天重新评估，是否还会选这个方案？

### 4. 可得性启发
- [ ] 评估概率时是否用了真实数据，而非记忆中的事件？

### 5. 过度自信
- [ ] 是否有外部专家 Review？
- [ ] 是否做了 Pre-Mortem？

### 6. 群体思维
- [ ] 是否有 Devil's Advocate？
- [ ] 是否匿名投票？

### 7. 权威偏误
- [ ] 评审是否允许质疑权威观点？
- [ ] Reviewer 是否独立？

### 8. 损失厌恶
- [ ] 决策是否基于「收益框架」而非「损失框架」？
- [ ] 是否考虑了「不迁移」的损失？

### 9. 现状偏误
- [ ] 是否考虑了「维持现状」的成本？
- [ ] 是否有充分理由改变现状？

### 10. 承诺升级
- [ ] 是否设定了 Kill Criteria？
- [ ] 是否有人有权终止项目？

### 11. 框架效应
- [ ] 是否用「收益框架」和「损失框架」两种方式表述？

### 12. 规划谬误
- [ ] 时间 / 成本估算是否给了 2x Buffer？
- [ ] 是否参考了类似项目的实际耗时？
```

**示例 2：Pre-Mortem 模板**

```markdown
# Pre-Mortem：{决策标题}

## 假设
假设 6 个月后这个决策彻底失败。

## 失败原因（每个参与者独立列举）

### 张三：
1. {原因 1}——概率：高 / 影响：高
2. {原因 2}——概率：中 / 影响：中

### 李四：
1. {原因 1}——概率：高 / 影响：高

### 王五：
1. {原因 1}——概率：中 / 影响：高

## Top 5 失败原因

| 原因 | 投票 | 概率 | 影响 | 缓解措施 |
| --- | --- | --- | --- | --- |
| Kafka 限流 | 3/3 | 高 | 高 | 多供应商 |
| 模型成本失控 | 2/3 | 中 | 高 | Token 限额 |

## 修订方案

针对 Top 3 失败原因：
- 加多供应商 fallback；
- 加 Token 限额；
- 加 Kill Switch。
```

**示例 3：Decision Matrix（加权打分）**

| 选项 | 性能 (0.3) | 成本 (0.2) | 团队匹配 (0.2) | 生态 (0.15) | 可治理 (0.15) | 总分 |
| --- | --- | --- | --- | --- | --- | --- |
| Flink | 9 | 6 | 8 | 9 | 8 | 8.0 |
| Spark Structured Streaming | 7 | 7 | 9 | 9 | 8 | 7.9 |
| RisingWave | 8 | 7 | 6 | 6 | 7 | 7.0 |
| Materialize | 8 | 5 | 6 | 6 | 7 | 6.5 |

→ Flink 胜出（总分 8.0）。

**示例 4：RACI 矩阵**

| 决策 | Responsible | Accountable | Consulted | Informed |
| --- | --- | --- | --- | --- |
| 选型 Kafka | 数据平台组 | CTO | 业务方、安全 | 全公司 |
| 性能优化 | 数据平台组 | 架构师 | DBA、业务方 | 工程团队 |
| 合规变更 | 安全团队 | CISO | 法务、业务方 | 董事会 |

**示例 5：Reversibility Analysis（可逆性分析）**

| 决策 | 可逆性 | 类型 | 决策流程 |
| --- | --- | --- | --- |
| 选型 Kafka | 高（可换 Pulsar） | Type 2 | 轻量 ADR |
| 迁移到云 | 低（数据迁回成本高） | Type 1 | 完整 ADR + Red Team + Pre-Mortem |
| 上线新 LLM 模型 | 中（可灰度） | Type 2 | 标准 ADR + Canary |
| 砍掉旧项目 | 中（可恢复团队） | Type 1 | ADR + 财务评估 |

**示例 6：AI 辅助识别偏误（Python / Claude）**

```python
import anthropic
import os

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def detect_bias(adr_text: str) -> str:
    """基于 ADR 文本检测可能的认知偏误。"""
    prompt = f"""你是一名决策心理学专家，请基于以下 ADR（架构决策记录）文本，识别可能的认知偏误。

## ADR 文本
{adr_text}

请按 12 种常见偏误逐项检查：
1. 锚定效应
2. 确认偏误
3. 沉没成本
4. 可得性启发
5. 过度自信
6. 群体思维
7. 权威偏误
8. 损失厌恶
9. 现状偏误
10. 承诺升级
11. 框架效应
12. 规划谬误

对每种偏误：
- 是否存在（是 / 否 / 部分）
- 证据（引用 ADR 原文）
- 改进建议

输出 Markdown 报告。"""

    msg = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

# 使用
adr = """
# ADR-0015：选用 Flink 作为流处理引擎
我们决定使用 Flink，因为团队有 Flink 经验，且 Flink 是流处理的事实标准。
"""
report = detect_bias(adr)
print(report)
```

---
