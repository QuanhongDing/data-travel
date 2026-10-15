> 本文件是 **09-remote-team.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](09-remote-team.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选择远程模式（1-2 周）**

1. 业务性质、团队规模、人才分布。
2. 参考「**适用场景决策表**」。
3. 高管 + HR 共识。

**Step 2：建立 Async-First 文化（持续）**

1. 文档优先。
2. 异步沟通默认。
3. 会议最小化。

**Step 3：建立远程 Onboarding（持续）**

1. 4 周 Onboarding 计划。
2. Buddy 制度。
3. Onboarding 反馈。

**Step 4：建立远程 1:1 与会议节奏（持续）**

1. 每周 1:1。
2. 异步 Standup + 同步 Weekly。
3. 月度 / 季度 Review。

**Step 5：建立信任建设机制（持续）**

1. Virtual Coffee。
2. Quarterly Offsite。
3. 个人化关心。

### 4.2 关键技术点

**1. 远程 1:1 议程模板**

```markdown
# 远程 1:1 - {员工姓名} - {日期}

## 议程

### 1. Life Check（5 分钟）
- 最近有什么新鲜事？
- 工作生活平衡如何？

### 2. 上次 Action Items Review（5 分钟）
- [ ] Action 1
- [ ] Action 2

### 3. 当前进展（10 分钟）
- 关键成果
- 关键风险
- 需要支持

### 4. IDP / 成长（5 分钟）
- 本季度 IDP 进展
- 跨级晋升准备

### 5. 个人关心（5 分钟）
- 远程工作感受
- 团队融入
- 工作生活平衡

## Action Items
1. [我] ______ - Due: ______
2. [员工] ______ - Due: ______
```

**2. Async Daily Standup 模板**

```markdown
# Daily Standup - {日期} - {姓名}

## 昨天做了什么？
- ______

## 今天计划做什么？
- ______

## 有什么 Block？
- ______

## 需要谁的支持？
- ______
```

**3. 远程会议模板**

```markdown
# 远程会议 - {标题} - {日期}

## 时间
{YYYY-MM-DD HH:MM-HH:MM} {时区}

## 参与者
______

## 议程
1. 上周进展（10 分钟）
2. 关键问题讨论（20 分钟）
3. 跨团队决策（10 分钟）
4. Action Items Review（5 分钟）

## 决策机制
- 现场决策：______
- 复杂决策：______

## 会议纪要模板
- 讨论议题
- 决策结论
- Action Items（负责人 + 截止日期）
```

**4. 远程 Onboarding 4 周计划**

```markdown
# Remote Onboarding 计划 - {新人姓名} - {入职日期}

## Week 1：环境搭建
- 设备到位、账号开通
- Buddy 介绍（Slack / Zoom）
- 阅读团队 Wiki
- 1:1 with Manager

## Week 2：第一个任务
- 第一个小任务（PR / 文档）
- Buddy 1:1
- Manager 1:1
- 加入 Slack 频道

## Week 3：跨团队融入
- 主导 1 个小项目
- 跨团队介绍会
- Onboarding 反馈 Review
- Virtual Coffee

## Week 4：完全投入
- 完全投入项目
- Onboarding 总结
- 季度 Offsite（如适用）
- 90 天 Review 计划
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**沟通**：

- **Slack / 飞书**：即时沟通。
- **Slack Connect**：跨组织沟通。
- **Zoom / 腾讯会议**：视频会议。

**文档**：

- **Notion**：协作 Wiki。
- **Confluence**：传统 Wiki。
- **Coda**：文档 + 数据库。

**录屏**：

- **Loom**：快速录屏。
- **Vidyard**：销售录屏。

**项目管理**：

- **Linear**：现代项目管理。
- **Jira**：传统项目管理。
- **飞书项目**：国内项目管理。

**Async Standup**：

- **Notion / Coda**：文档化 Standup。
- **Geekbot（Slack Bot）**：自动化 Standup。
- **Standuply**：异步 Standup。

**AI 时代工具（2024-2025）**：

- **Otter.ai / Granola**：AI 会议纪要。
- **Slack AI**：AI 自动摘要。
- **Notion AI**：AI 辅助文档。
- **DeepL / Google Translate**：AI 翻译。
- **Whisper + GPT**：AI 实时转录 + 摘要。
- **Loom AI**：AI 录屏摘要。

### 4.4 代码 / 示例

**示例 1：Async Decision 模板（ADR）**

```markdown
# ADR-2025-10-08: 选择 Milvus 作为向量数据库

## 状态
Accepted

## 背景
业务需要 RAG 系统，需要选型向量数据库。

## 决策
选择 Milvus 2.4。

## 选项
### 选项 A：Milvus
- 优点：开源、高性能、社区活跃
- 缺点：运维复杂

### 选项 B：Pinecone
- 优点：易用、稳定
- 缺点：成本高、数据出境风险

### 选项 C：Qdrant
- 优点：易用、轻量
- 缺点：生态较小

## 决策依据
- 业务规模：TB 级
- 合规要求：私有化部署
- 团队技能：Kubernetes、分布式系统

## 后果
- 需要投入 1 人 6 个月运维
- 社区版本持续更新

## 参考
- [Milvus vs Pinecone Benchmark](link)
- [团队讨论 Slack 链接](link)
```

**示例 2：AI 异步会议摘要 Prompt**

```python
ASYNC_MEETING_SUMMARY_PROMPT = """
你是资深远程协作专家。请基于以下 Slack 讨论记录，生成本次异步会议摘要。

要求：
1. 关键讨论议题（3-5 条）
2. 决策结论
3. Action Items（负责人 + 截止日期）
4. 未解决议题
5. 下次会议建议议题

Slack 记录：
{slack_thread}
"""
```

---
