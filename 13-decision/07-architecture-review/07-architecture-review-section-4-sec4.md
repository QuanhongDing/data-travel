> 本文件是 **07-architecture-review.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](07-architecture-review.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：定义评审对象 + 类型**

- 日常变更：Lightweight Review（PR）。
- 中型变更：Formal Review（评审会议）。
- 战略级：ATAM。

**Step 2：建立评审流程**

```
方案起草 → 提交（RFC / Design Doc）
  ↓
预审（资深架构师，30 分钟 / 项）
  ↓
正式评审（2 小时，5-8 人）
  ↓
决议 + Follow-up Action
  ↓
ADR 归档（接受 / 修订 / 拒绝）
  ↓
实施 + 复盘
```

**Step 3：建立评审 Checklist**

按质量属性 + 业务场景 + 反模式：

- 性能 / 可用性 / 安全 / 可扩展性 / 可维护性 / 可治理性。
- 业务：性能 / 成本 / 时间。
- 反模式：单点 / 过度耦合 / 无降级 / 无监控。

**Step 4：建立评审委员会**

- 5-10 人：架构师 + 安全 + 数据 + 业务代表。
- 每月 / 双周会议。
- 输出：架构白皮书 + ADR 审批。

**Step 5：建立 ADR 闭环**

- 评审接受 → ADR 归档。
- 评审修订 → Author 修改 → 重新评审。
- 评审拒绝 → 不实施。
- Supersede → 旧 ADR 标记 Superseded。

**Step 6：建立 Follow-up 机制**

- 每条 Follow-up Action 有 Owner + 截止日期。
- Jira / GitHub Issue 跟踪。
- 季度复盘：Follow-up 闭环率。

**Step 7：建立 AI 辅助评审**

- LLM 自动检查 Checklist。
- LLM 识别反模式。
- 人类 Reviewer 把关。

**Step 8：建立持续评审**

- PR 级 Review（Lightweight）。
- 上线评审（Go-Live Review）。
- 季度架构评审（Architecture Board）。
- 年度架构 Review（Strategic Review）。

### 4.2 关键技术点

1. **RFC / Design Doc 模板**——标准化评审输入。
2. **ADR 模板**——标准化评审输出（详见 §01）。
3. **评审 Checklist 模板**——按质量属性 / 反模式分类。
4. **评审会议管理**——议程、纪要、决议、Follow-up。
5. **评审工具**：GitHub / GitLab PR、Atlassian Confluence、Notion。
6. **评审日历**——定期评审会议。
7. **评审 Dashboard**——评审数量 / 通过率 / Follow-up 闭环率。
8. **AI 辅助评审工具**：GitHub Copilot PR Review、Claude Code Review。
9. **评审 Checklist 自动化**：AI 自动检查 Checklist 完整性。
10. **评审历史**——所有评审归档，便于未来回溯。

### 4.3 工具链与平台

**RFC / Design Doc 平台**：

- **GitHub / GitLab PR**——主流方式。
- **Confluence + Markdown**——传统企业。
- **Notion Database**——结构化。
- **Google Docs**——轻量。
- **Backstage ADR Plugin**（Spotify）。

**评审 Checklist**：

- **Atlassian Confluence Template**——结构化。
- **Notion Checklist Database**——可搜索。
- **Excel / Google Sheets**——轻量。
- **GitHub Issue Template**——PR 级。
- **AWS Well-Architected Tool**——云架构。

**评审会议管理**：

- **Jira + Architecture Theme**——决策跟踪。
- **Asana / Linear**——Follow-up 跟踪。
- **Slack / Teams Channel**——实时沟通。
- **Miro / FigJam**——可视化白板。

**评审 Dashboard**：

- **Grafana**——自定义评审 Dashboard。
- **Jira Dashboard**——评审 + Follow-up 闭环率。
- **Atlassian Compass**（2024）——开发者体验 + 架构健康。
- **Linear / Height**——团队级评审跟踪。

**AI 辅助（2024-2025）**：

- **GitHub Copilot PR Review**——AI 代码评审。
- **Claude Code Review**——AI 架构评审。
- **CodiumAI / Coderabbit**——AI Code Review 平台。
- **Sourcery**——AI 代码质量。
- **Anthropic Constitutional AI**——AI 决策「宪法」。

**架构治理**：

- **AWS Well-Architected Tool**——云架构评审。
- **Azure Well-Architected Assessment**——微软云评审。
- **Google Cloud Architecture Framework**——谷歌云评审。

### 4.4 代码 / 示例

**示例 1：架构评审 Checklist（数据架构）**

```markdown
## 架构评审 Checklist：数据平台方案

### 1. 功能性
- [ ] 业务需求覆盖度：所有业务场景是否覆盖？
- [ ] 数据模型：是否建模正确（OneData / 维度 / KG）？
- [ ] ETL / ELT：数据流转是否可追溯？

### 2. 性能
- [ ] QPS 预估：是否满足业务 QPS 需求？
- [ ] 延迟要求：P99 延迟是否满足？
- [ ] 吞吐：峰值吞吐是否满足？
- [ ] 数据倾斜：是否有数据倾斜风险？

### 3. 可用性
- [ ] SLA：是否满足 99.9% / 99.99%？
- [ ] 单点故障：是否有 SPOF？
- [ ] 容灾：多活 / 双活方案？
- [ ] 降级 / 限流：故障降级方案？

### 4. 安全
- [ ] 数据加密：传输 + 存储加密？
- [ ] 访问控制：RBAC / ABAC？
- [ ] 数据脱敏：PII 脱敏方案？
- [ ] 审计：操作审计 + 链路追踪？

### 5. 可扩展性
- [ ] 水平扩展：是否支持水平扩展？
- [ ] 弹性伸缩：自动伸缩方案？
- [ ] 容量规划：3-5 年容量预估？

### 6. 可维护性
- [ ] 可观测性：监控 / 告警 / 日志？
- [ ] 可治理性：权限 / 审批 / 变更管理？
- [ ] 可演进性：未来 3-5 年演进路径？

### 7. 成本
- [ ] TCO 3-5 年：TCO 计算？
- [ ] ROI：投入产出比？
- [ ] 资源利用率：CPU / 内存 / 存储利用率？

### 8. 团队匹配度
- [ ] 团队能力：团队是否能维护？
- [ ] 学习曲线：学习成本？
- [ ] 招聘：是否能招聘到对应人才？

### 9. 合规
- [ ] 数据隐私：GDPR / 个保法 / 数据安全法？
- [ ] 行业合规：等保 2.0 / 3.0？
- [ ] AI 合规：AI 治理框架？

### 10. 风险
- [ ] 技术风险：新技术风险？
- [ ] 供应商风险：供应商锁定？
- [ ] 业务风险：业务中断风险？

### 反模式检查
- [ ] 无单点故障？
- [ ] 无过度设计？
- [ ] 无过度耦合？
- [ ] 无硬编码？
- [ ] 无未经评审的依赖？

### Follow-up Actions
| # | 议题 | Owner | 截止日期 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | 容量预估 | @张三 | 2025-12-01 | 待开始 |
| 2 | 安全评审 | @李四 | 2025-12-15 | 待开始 |
```

**示例 2：评审会议模板**

```markdown
## 评审会议：{方案名}

### 会议信息
- 时间：2025-11-15 14:00-16:00
- 主持人：@王架构
- 评审人：@张三、@李四、@王五、@赵六、@钱七
- 缺席：@孙八（请假）

### 议程
1. 方案介绍（30 分钟，@王架构）
2. 质量属性评审（45 分钟）
   - 性能（@李四）
   - 安全（@王五）
   - 可扩展性（@赵六）
3. 反模式检查（15 分钟）
4. Pre-Mortem（15 分钟）
5. 决议 + Follow-up（15 分钟）

### 评审记录
#### 性能
- @李四：QPS 预估偏低，建议 2 倍
- 决议：Author 补充性能压测报告

#### 安全
- @王五：缺少 PII 脱敏
- 决议：补全 PII 脱敏方案

### Pre-Mortem
- 假设 6 个月后失败，Top 3 原因：
  1. Kafka 限流
  2. AI 成本失控
  3. 数据延迟

### 决议
- 决议：**修订后接受**（Author 修订 Follow-up 后无需重新评审）
- ADR：ADR-0015

### Follow-up Actions
| # | 议题 | Owner | 截止日期 |
| --- | --- | --- | --- |
| 1 | 性能压测报告 | @王架构 | 2025-11-30 |
| 2 | PII 脱敏方案 | @王架构 | 2025-12-05 |
| 3 | Kafka 多供应商 | @李四 | 2025-12-15 |
```

**示例 3：ATAM 简化版（质量属性效用树）**

```
目标：业务连续
├── 高可用
│   ├── 可用性 ≥ 99.95%
│   ├── RTO ≤ 30 分钟
│   └── RPO ≤ 5 分钟
├── 可扩展
│   ├── 支持 10x 流量
│   └── 支持 100x 数据量
├── 安全
│   ├── 数据加密
│   ├── 权限隔离
│   └── 审计追溯
└── 性能
    ├── P99 延迟 ≤ 1s
    └── QPS ≥ 10,000
```

**示例 4：架构反模式清单**

| 反模式 | 描述 | 检测 |
| --- | --- | --- |
| 单点故障 | 关键组件无冗余 | FMEA + Chaos Engineering |
| 过度耦合 | 服务间强耦合 | 依赖图分析 |
| 大泥球 | 单一巨型服务 | 代码静态分析 |
| 烟囱系统 | 重复建设的独立系统 | 数据流分析 |
| 无监控 | 关键路径无监控 | 监控覆盖率 |
| 无降级 | 故障无降级方案 | Chaos 测试 |
| 无审计 | 操作无审计日志 | 安全审计 |
| 无版本管理 | 模型 / Prompt 无版本 | AI Tech Debt 检测 |

**示例 5：AWS Well-Architected Review（6 根支柱）**

| 支柱 | 关键问题 | 评分 |
| --- | --- | --- |
| Operational Excellence | 监控 / 自动化 / 变更管理 | 4/5 |
| Security | 身份 / 认证 / 加密 / 审计 | 3/5 |
| Reliability | 容错 / 备份 / 恢复 | 4/5 |
| Performance Efficiency | 资源选型 / 监控 / 演进 | 4/5 |
| Cost Optimization | 成本可见 / 优化 / 治理 | 3/5 |
| Sustainability | 碳排放 / 资源利用率 | 3/5 |

→ 评分 ≤ 3 → 高风险项（HRIs）→ 必须改进。

**示例 6：AI 辅助架构评审（Python / Claude）**

```python
import anthropic
import os

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def ai_review_architecture(design_doc: str, checklist: list[str]) -> str:
    """基于 Design Doc + Checklist，让 Claude 辅助评审。"""
    prompt = f"""你是一名资深数据架构师，请评审以下架构方案。

## 架构方案
{design_doc}

## 评审 Checklist
{chr(10).join(f"- [ ] {item}" for item in checklist)}

请按 Checklist 逐项评审：
1. 每项给出「通过 / 部分通过 / 不通过」+ 理由 + 改进建议。
2. 列出 Top 5 风险（含概率 / 影响 / 缓解）。
3. Pre-Mortem：假设 6 个月后失败，列举 Top 3 失败原因。
4. 总体评分（1-5）+ 决议（接受 / 修订 / 拒绝）。

输出 Markdown 报告。"""

    msg = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

# 使用
review = ai_review_architecture(
    design_doc="""
我们计划迁移所有 AI 应用从单模型 GPT-4 到 Claude + GPT-4o + 通义千问多模型路由。
涉及成本优化、合规达标、风险分散三个目标。
技术方案：基于 LangChain 实现 Model Router，支持按任务类型、地域、数据敏感度路由。
    """,
    checklist=[
        "性能：路由增加 P99 延迟是否 ≤ 200ms？",
        "成本：多模型是否真的降低总成本？",
        "安全：模型 API Key 如何管理？",
        "合规：国内业务是否合规？",
        "可扩展：能否接入新模型？",
        "可维护：团队是否能维护多模型？",
        "可观测：路由决策是否可观测？",
        "降级：单模型宕机是否降级？",
    ],
)
print(review)
```

---
