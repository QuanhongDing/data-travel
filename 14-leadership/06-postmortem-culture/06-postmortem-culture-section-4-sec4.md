> 本文件是 **06-postmortem-culture.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](06-postmortem-culture.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：建立 Blameless 文化（持续）**

1. 高管公开分享自己的失误。
2. 明确「**复盘 ≠ 追责**」。
3. 心理安全机制（详见 §12）。

**Step 2：建立故障响应流程（2-4 周）**

1. On-call 排班（7×24h）。
2. Escalation 流程。
3. War Room 工具（Zoom / 飞书）。
4. 事故指挥官（IC）指定。

**Step 3：建立 Postmortem 流程（2-4 周）**

1. Postmortem 模板（Google SRE 风格）。
2. 故障分级（P0/P1/P2/P3）。
3. 复盘时间（24 小时内完成）。
4. 跟踪机制。

**Step 4：建立知识沉淀机制（持续）**

1. 故障知识库（Confluence / Notion）。
2. Runbook 维护。
3. RAG 化检索。
4. 新员工 Onboarding 必读。

**Step 5：AI 辅助复盘（按需）**

1. LLM 自动总结故障。
2. 相似故障检索。
3. Action Items 自动跟踪。

### 4.2 关键技术点

**1. Postmortem 模板**

```markdown
# Postmortem - {故障标题}

## 摘要
- 故障时间：YYYY-MM-DD HH:MM-HH:MM
- 故障等级：P0/P1/P2/P3
- 受影响业务：______
- 受影响用户：~XXX 万
- 业务损失：预估 XX 万元
- SLA：违反 / 满足

## 时间线
- HH:MM - 故障发生
- HH:MM - 检测
- HH:MM - 启动 War Room
- HH:MM - 根因定位
- HH:MM - 临时缓解
- HH:MM - 完全恢复

## 影响
- 业务影响：______
- 用户影响：______
- 财务影响：______

## 根因
- 直接原因：______
- 根本原因：______
- 促成因素：______

## 检测与响应
- 检测方式：告警 / 用户反馈 / 监控
- 检测时延：______ 分钟
- 缓解时延：______ 分钟
- 恢复时延：______ 分钟

## Action Items
| ID | 描述 | Owner | Due Date | Status | Priority |
| --- | --- | --- | --- | --- | --- |
| AI-001 | ______ | 张三 | 2025-10-15 | Open | P1 |
| AI-002 | ______ | 李四 | 2025-10-22 | In Progress | P1 |
| AI-003 | ______ | 王五 | 2025-10-30 | Open | P2 |

## 经验教训
1. ______
2. ______
3. ______

## 后续跟进
- 30 天 Review：Action Items 跟踪
- 60 天 Review：流程改进验证
- 90 天 Review：复盘文化效果评估
```

**2. AI 辅助复盘 Prompt**

```python
POSTMORTEM_SUMMARY_PROMPT = """
你是资深 SRE。请基于以下故障日志，生成本次故障的 Postmortem 草稿。

故障日志：
{incident_logs}

要求：
1. 提取时间线
2. 分析根因（5 Whys）
3. 提取 Action Items（至少 5 条）
4. 总结经验教训
5. 输出 Postmortem 文档结构（摘要 / 时间线 / 根因 / Action Items / 经验教训）
"""
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**Incident Management**：

- **国际**：PagerDuty、Opsgenie、VictorOps、Incident.io、Firehydrant、Rootly、Squadcast。
- **国内**：阿里云 OnCall、腾讯云蓝鲸、华为云 AOM。

**Postmortem 工具**：

- **Confluence / Notion**：文档协作。
- **Incident.io**：Incident + Postmortem 一体化。
- **Firehydrant**：Incident + Postmortem + On-call。

**可观测性（详见 Ch11）**：

- **Prometheus / Grafana**：指标监控。
- **Datadog / New Relic**：APM。
- **Elasticsearch / Loki**：日志。

**混沌工程（详见 Ch12）**：

- **Chaos Monkey（Netflix）**、**ChaosBlade（阿里）**、**Chaos Mesh（PingCAP）**。

**AI 时代工具（2024-2025）**：

- **Rootly AI**：AI 辅助 Incident Response + Postmortem。
- **Incident.io AI**：AI 自动总结故障。
- **Firehydrant AI**：AI 自动提取 Action Items。
- **Datadog Watchdog**：AI 异常检测。
- **New Relic AI**：AI 故障预测。

### 4.4 代码 / 示例

**示例 1：Incident Response Runbook**

```markdown
# Runbook - RAG 系统响应超时

## 告警触发
- Prometheus 告警：RAG P95 > 2 秒
- Slack 告警渠道：#ops-rag

## 第一步：确认故障（≤ 5 分钟）
1. 检查监控看板（Grafana）
2. 查看日志（ELK / Loki）
3. 确认影响范围

## 第二步：启动 War Room（≤ 10 分钟）
1. 召集：On-call、架构师、DBA、业务方代表
2. 指定 IC（事故指挥官）
3. 建立 War Room：飞书会议

## 第三步：定位根因（≤ 30 分钟）
1. 检查向量库健康度
2. 检查 Embedding Service
3. 检查 LLM 服务
4. 检查网络 / 依赖

## 第四步：缓解（≤ 1 小时）
- 选项 A：重启向量库
- 选项 B：回滚 Embedding Model
- 选项 C：流量降级（关闭部分功能）

## 第五步：恢复（≤ 2 小时）
1. 验证系统恢复
2. 监控 30 分钟无异常
3. 发布恢复公告

## 第六步：Postmortem（24 小时内）
1. 召集复盘会
2. 完成 Postmortem 文档
3. Action Items 分配
```

**示例 2：AI 辅助 Root Cause 分析 Prompt**

```python
ROOT_CAUSE_ANALYSIS_PROMPT = """
你是资深 SRE。请基于以下故障现象，做 5 Whys 根因分析。

故障现象：RAG 系统 P95 从 500ms 升至 10s

监控数据：
- 向量库 QPS：1000（正常）
- 向量库 P95：8000ms（异常）
- 向量库 CPU：60%（正常）
- Embedding Service：正常
- LLM Service：正常

日志：
- "vector search timeout after 5s"
- "index not found, fallback to full scan"
- "embedding model version mismatch"

请输出：
1. 5 Whys 分析（每个 Why 1-2 句）
2. 根本原因（系统性问题）
3. 3-5 条 Action Items
"""
```

---
