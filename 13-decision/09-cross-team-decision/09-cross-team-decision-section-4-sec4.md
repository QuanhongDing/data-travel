> 本文件是 **09-cross-team-decision.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](09-cross-team-decision.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：建立 RACI / DACI 模板**

- 在 Confluence / Notion 建立组织级 RACI 模板。
- 每个跨团队决策都必须填 RACI 表。
- 强制 A（Accountable）只有 1 人。

**Step 2：建立 RFC 流程**

- 仓库 `docs/rfcs/` 或独立 RFC 平台。
- 模板：上下文、提议选项、影响分析、回滚方案、Owner、Reviewers。
- PR 化提交 + Reviewers 制度。
- 截止日期（RFC 进入「Final Comment Period」）。

**Step 3：建立 ADR 归档**

- 跨团队决策接受后写 ADR（详见 §1-adr）。
- ADR 中明确 Owner + Reviewers + Informed。
- ADR Index 中标记「跨团队决策」标签。

**Step 4：建立 Architecture Board**

- 5-10 名资深架构师（含安全 / 数据 / 业务代表）。
- 每周 / 双周会议。
- 评审重大 RFC + ADR。
- 输出：架构白皮书、技术雷达。

**Step 5：建立 Stakeholder Map**

- 识别所有利益相关方（团队 / 个人 / 角色）。
- 用 Power-Interest Grid 分类。
- 制定沟通策略（管理 / 重点 / 最小 / 告知）。

**Step 6：建立 Escalation 流程**

```
决策阻塞
  ↓
Level 1：团队内部解决（24 小时）
  ↓
Level 2：跨团队 Lead 协商（48 小时）
  ↓
Level 3：Architecture Board 评审（1 周）
  ↓
Level 4：高管决策（CTO / VP）
```

**Step 7：建立共识工作坊机制**

- 重大跨团队决策召开共识工作坊。
- 中立 Facilitator 主持。
- 1-3 天集中讨论。
- 输出：共识方案 + ADR。

**Step 8：建立跨团队沟通机制**

- 跨团队 Standup（每周 30 分钟）。
- 跨团队 Slack 频道。
- 月度跨团队分享会。
- 季度跨团队规划会。

### 4.2 关键技术点

1. **RACI 工具**：RACI Matrix 模板（Excel / Confluence）。
2. **RFC 平台**：GitHub PR、GitLab MR、Custom RFC Platform。
3. **ADR 平台**（详见 §1-adr）：log4brains、MADR、Backstage ADR Plugin。
4. **架构委员会会议管理**：议程模板、会议纪要模板、决策记录。
5. **Stakeholder Map 工具**：Miro、Figma、Lucidchart。
6. **投票工具**：Mentimeter、Sli.do、Poll Everywhere。
7. **共识工作坊工具**：Miro、FigJam、Klaxoon。
8. **升级机制**：Jira Service Management、ServiceNow。
9. **跨团队沟通**：Slack、Microsoft Teams、飞书、钉钉。
10. **AI 辅助**：LLM 起草 RFC、AI 协调员、共识构建助手。

### 4.3 工具链与平台

**RFC / ADR 平台**：

- **GitHub / GitLab PR**——RFC 评审主流方式。
- **Google Docs / Confluence**——传统企业折中。
- **Notion Database**——结构化 RFC + ADR。
- **Log4brains**——ADR 静态站点。
- **Backstage ADR Plugin**——Spotify Backstage 集成。
- **Custom RFC Platform**（如 GitLab Handbook）。

**Stakeholder Map 工具**：

- **Miro**——白板 + 协作。
- **Figma**——协作设计。
- **Lucidchart**——流程图 / 矩阵图。
- **Mural**——视觉协作。

**架构委员会工具**：

- **Confluence + Meeting Notes**——会议纪要。
- **Jira + Architecture Theme**——决策跟踪。
- **Slack Channel #arch-board**——实时沟通。

**投票 / 共识工具**：

- **Mentimeter**——匿名投票。
- **Sli.do**——匿名提问 / 投票。
- **Loomio**——协作决策。
- **Poll Everywhere**——实时投票。

**AI 辅助（2024-2025）**：

- **Claude / GPT-4**——RFC 起草、ADR 评审、Stakeholder 分析。
- **Decision Intelligence Platforms**——跨团队决策图谱。
- **AI Facilitator**——共识工作坊 AI 主持。
- **Anthropic Constitutional AI**——AI 决策「宪法」。
- **Pol.is**——大规模群体意见聚合。

**跨团队沟通**：

- **Slack / Microsoft Teams / 飞书 / 钉钉**——即时沟通。
- **Zoom / 腾讯会议**——视频会议。
- **Miro / Mural**——异步白板。

### 4.4 代码 / 示例

**示例 1：RACI 矩阵**

| 决策 | R（执行） | A（负责） | C（咨询） | I（通知） |
| --- | --- | --- | --- | --- |
| 选型 Kafka vs Pulsar | 数据平台组 | 首席架构师 | 业务方、安全、运维 | 全公司 |
| 性能优化（成本 100w） | 数据平台组 | 架构师 | DBA、业务方、CFO | 工程团队 |
| 合规变更（PII 加密） | 安全团队 | CISO | 法务、业务方、CTO | 董事会、客户 |
| 新模型上线（GPT-4o） | AI 平台组 | AI 架构师 | 业务方、合规、安全 | 全公司 |

**示例 2：DACI 框架应用**

```
## DACI for ADR-0015：选用 GPT-4o 作为主力模型

- **D（Driver）**：@李架构（推动 ADR 起草、评审、合并）
- **A（Approver）**：@王首席架构师（最终拍板）
- **C（Contributors）**：
  - @张博士（AI 科学家）——模型能力评估
  - @赵组长（业务方）——业务影响评估
  - @钱组长（安全）——合规评估
  - @孙组长（成本）——成本评估
- **I（Informed）**：
  - 全平台工程团队
  - 业务部门负责人
  - 法务 / 合规

## 时间表
- W1：Driver 起草 DACI + ADR 草稿
- W2：Contributors 评审 + 修改
- W3：Approver 拍板
- W4：ADR 合并 + Informed 通知
```

**示例 3：RFC 模板**

```markdown
# RFC-{编号}：{标题}

## 摘要
{一句话提议}

## 动机
{为什么需要这个决策}

## 提议
{具体方案}

## 选项对比
| 维度 | 选项 A | 选项 B | 选项 C |
| --- | --- | --- | --- | --- |
| 性能 | ... | ... | ... |
| 成本 | ... | ... | ... |
| 团队 | ... | ... | ... |

## 影响范围
- 涉及团队：{列表}
- 影响系统：{列表}
- 回滚方案：{描述}

## 风险与缓解
| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| ... | ... | ... | ... |

## Reviewers
- @张三（必须 Review）
- @李四（必须 Review）
- @王五（建议 Review）

## 时间表
- Final Comment Period：{日期}
- Approver 拍板：{日期}
- 实施：{日期}

## 开放问题
- {问题 1}
- {问题 2}
```

**示例 4：Stakeholder Map**

```
                高权力
                  │
                  │
       ┌──────────┼──────────┐
       │  CTO     │  CFO     │  ← 管理（重点沟通）
       │  业务VP  │  安全VP  │
   ────┼──────────┼──────────┼──── 利益
       │  安全Lead│  业务Lead│
       │  数据Lead│  AI Lead │
       └──────────┼──────────┘
                  │
                  │
                低权力

- **管理 / 重点沟通**：CTO、CFO、VP（高权力 / 高利益）
- **关键 Lead**：安全Lead、数据Lead、业务Lead（中等权力 / 高利益）
- **最小努力**：执行层（低权力 / 中等利益）
- **告知**：边缘团队（低权力 / 低利益）
```

**示例 5：Escalation 流程**

```
Level 1：团队内部解决（24 小时）
  ├── 决策阻塞
  ├── Lead 召集内部会议
  └── 输出：内部决议 / 升级

Level 2：跨团队 Lead 协商（48 小时）
  ├── 升级到跨团队 Lead
  ├── 联合会议
  └── 输出：跨团队共识 / 升级

Level 3：Architecture Board 评审（1 周）
  ├── 升级到 Architecture Board
  ├── 评审会议
  └── 输出：架构委员会决议 / 升级

Level 4：高管决策（CTO / VP）
  ├── 升级到高管
  ├── 高管会议
  └── 输出：最终决策
```

**示例 6：AI 辅助 Stakeholder 分析（Python / Claude）**

```python
import anthropic
import os

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def analyze_stakeholders(decision_description: str) -> str:
    """基于决策描述，分析利益相关方。"""
    prompt = f"""你是一名组织行为学专家，请基于以下决策描述，进行利益相关方分析。

## 决策描述
{decision_description}

请输出：
1. **利益相关方清单**（角色 / 团队 / 个人）；
2. **Power-Interest Grid**（每个相关方的权力 × 兴趣评分 1-5）；
3. **沟通策略**（管理 / 重点 / 最小努力 / 告知）；
4. **潜在冲突**（谁可能反对？为什么？）；
5. **共识构建建议**。

输出 Markdown 报告。"""

    msg = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

# 使用
analysis = analyze_stakeholders(
    decision_description="我们计划将所有 AI 应用从单模型 GPT-4 迁移到 Claude + GPT-4o + 通义多模型路由策略。涉及成本、合规、业务能力、SLA 多个维度。"
)
print(analysis)
```

---
