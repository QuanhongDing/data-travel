> 本文件是 **04-risk-assessment.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](04-risk-assessment.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：识别范围与边界**

- 明确评估对象（一个系统？一个项目？一个决策？）。
- 确定时间范围（未来 3 个月 / 1 年 / 3 年？）。
- 划定评估边界（技术 / 业务 / 合规 / 声誉）。

**Step 2：建立风险分类法**

- 按类型：技术 / 业务 / 合规 / 安全 / 运营 / 财务 / 声誉 / 战略。
- 按层次：组件 / 子系统 / 系统 / 系统之系统。
- 按时间：实施期 / 上线期 / 运行期。

**Step 3：风险识别（多源）**

- 头脑风暴（5-10 人，1-2 小时）。
- 历史事故复盘（Postmortem 库）。
- 行业基准（OWASP Top 10、CWE、STRIDE）。
- Checklist（架构评审 Checklist、合规 Checklist）。
- AI 辅助（LLM 基于历史风险库推荐）。

**Step 4：风险分析（量化 + 定性）**

- 概率评估（1-5）。
- 影响评估（1-5，多维度：技术 / 业务 / 合规 / 声誉）。
- 综合评分（P × I）。
- RPN 计算（FMEA）。
- Monte Carlo / Bayesian 推理（高复杂度系统）。

**Step 5：风险应对**

- 四象限策略：Avoid / Transfer / Mitigate / Accept。
- 每条风险分配 owner + 截止日期 + 预算。
- 应对措施文档化。

**Step 6：风险监控**

- 建立风险指标（KRI, Key Risk Indicators）。
- 实时监控 + 阈值触发。
- 季度风险评审会议。
- 重大风险变更时实时评审。

**Step 7：复盘与持续改进**

- 每次事故后更新风险登记册。
- 季度 / 半年风险复盘会。
- 风险评估方法自身迭代。

### 4.2 关键技术点

1. **FMEA 表格自动化**：用 Jira / Confluence 模板生成 FMEA 表。
2. **FTA 工具**：OpenFTA、Isograph FaultTree+。
3. **Bowtie 软件**：BowTieXP、RiskBowtie。
4. **Monte Carlo 库**：Python `numpy.random`、`pymc3`、`@RISK`（Excel）。
5. **Bayesian Network 库**：`pgmpy`、`pybnlearn`。
6. **Risk Register 平台**：Jira Risk Register、Riskonnect、ServiceNow GRC。
7. **GRC 平台**：ServiceNow GRC、Archer、SAP GRC。
8. **AI RMF 工具**：NIST AI RMF Mapper、Microsoft AI Risk Assessment。
9. **Chaos Engineering 工具**：Chaos Monkey、Gremlin、ChaosBlade、LitmusChaos。
10. **Risk Heatmap 可视化**：Tableau / Power BI Risk Dashboard。
11. **KRI 监控**：Grafana + Prometheus + Risk 指标。
12. **LLM 风险辅助**：基于历史风险库的 LLM 风险推荐 + 评审。

### 4.3 工具链与平台（含 2024-2025 新工具）

**FMEA / FTA / Bowtie 工具**：

- **Isograph FMEA / FaultTree+**（商业，行业标准）。
- **BowTieXP**（商业，Bowtie 主流工具）。
- **OpenFTA**（开源）。
- **Ishikawa / Fishbone Diagram**（鱼骨图工具，根因分析）。
- **ReliaSoft**（商业，可靠性工程）。
- **FMEA Pro**（轻量 FMEA 工具）。

**Risk Register / GRC 平台**：

- **ServiceNow GRC**——企业级 GRC 平台。
- **RSA Archer**——GRC 主流商业平台。
- **Riskonnect**——专业风险管理。
- **LogicGate Risk Cloud**——SaaS 风险平台（2024）。
- **Jira + Risk Plugin**——中小团队轻量方案。
- **Confluence Risk Register Template**——Atlassian 生态。

**AI / ML 风险工具**：

- **NIST AI RMF Mapper**（2024）——AI 风险评估映射工具。
- **Microsoft Responsible AI Dashboard**（2024）——负责任 AI 评估。
- **IBM AI Fairness 360**（开源）——AI 公平性评估。
- **Google Model Card Toolkit**——模型卡片生成。
- **Hugging Face Evaluate**——模型评估库。
- **Arize AI / WhyLabs**——ML 监控 + 风险检测。

**混沌工程**：

- **Chaos Monkey**（Netflix 开源）。
- **Gremlin**（商业 SaaS，2024 主流）。
- **ChaosBlade**（阿里开源）。
- **LitmusChaos**（CNCF 开源）。
- **Chaos Mesh**（PingCAP 开源）。
- **Azure Chaos Studio**（云原生）。

**概率 / 蒙特卡洛**：

- **@RISK**（Excel 插件）。
- **Crystal Ball**（Oracle）。
- **Python numpy / scipy / pymc3**——开源。
- **R mc2d / triangle**——开源。

**2024-2025 新工具**：

- **Anthropic Claude for Risk**（2024）——基于 LLM 的风险评估助手。
- **Databricks Unity Catalog Risk**（2024）——数据风险 + AI 风险统一。
- **Microsoft Purview Risk**（2024）——数据合规 + AI 风险。
- **Atlassian Compass**（2024）——开发者体验 + 风险指标。
- **Vanta / Drata**（SaaS 合规 + 风险自动化，2024 主流）。

### 4.4 代码 / 示例

**示例 1：FMEA 表格（CSV）**

```csv
component,failure_mode,effect,severity,cause,occurrence,detection,rpn,mitigation,owner
Kafka Broker,磁盘满,生产停滞,8,日志未清理,4,3,96,监控告警+自动扩容+日志TTL,@张三
HDFS DataNode,心跳停止,副本缺失,7,网络分区,3,2,42,多副本+自动下线,@李四
LLM API,服务降级,问答失败,9,OpenAI 限流,5,5,225,多供应商+降级prompt+队列缓冲,@王五
Flink JobManager,内存溢出,作业失败,8,大状态未清理,4,4,128,RocksDB状态后端+Checkpoint,@赵六
PostgreSQL,主从切换延迟,只读延迟,6,同步延迟,3,3,54,异步复制+读流量分发,@钱七
```

**示例 2：概率影响矩阵**

| | I=1 | I=2 | I=3 | I=4 | I=5 |
| --- | --- | --- | --- | --- | --- |
| P=5 | 中 | 高 | 高 | **极高** | **极高** |
| P=4 | 中 | 中 | 高 | 高 | **极高** |
| P=3 | 低 | 中 | 中 | 高 | 高 |
| P=2 | 低 | 低 | 中 | 中 | 高 |
| P=1 | 极低 | 低 | 低 | 中 | 中 |

**示例 3：故障树（FTA）**

```
[数据平台宕机] — Top Event
    │
    ├── OR ──→ [Kafka 不可用]
    │              │
    │              ├── OR ──→ [Broker 进程崩溃]
    │              │              └── AND ──→ [内存溢出] × [无健康检查]
    │              │
    │              └── OR ──→ [ZooKeeper 脑裂]
    │
    ├── OR ──→ [数据库不可用]
    │              │
    │              ├── OR ──→ [主库宕机]
    │              └── OR ──→ [主从延迟过大]
    │
    └── OR ──→ [网络分区]
                   │
                   ├── OR ──→ [专线故障]
                   └── OR ──→ [DNS 污染]
```

**示例 4：Bowtie Analysis**

```
Threats                        Top Event                  Consequences
[数据中心火灾]─────→[预防]──────→│                       ├──→[缓解]───→[业务损失]
[网络攻击]───────────→[防火墙]───→│[数据平台宕机]         ├──→[缓解]───→[客户投诉]
[人为误操作]─────────→[审批]─────→│                      ├──→[缓解]───→[声誉损害]
                                  │                       └──→[缓解]───→[合规处罚]
```

**示例 5：蒙特卡洛模拟（Python）**

```python
import numpy as np

# 模拟一个数据平台年度故障次数与影响
np.random.seed(42)

# 故障次数：每季度平均 2 次（泊松分布）
faults_per_quarter = np.random.poisson(lam=2, size=10000)

# 每次故障影响金额（万元）：对数正态分布
impact_per_fault = np.random.lognormal(mean=2.0, sigma=1.0, size=10000)

# 年度总影响 = 季度故障 × 季度影响
total_impact = faults_per_quarter * impact_per_fault

print(f"年度故障 P50: {np.percentile(total_impact, 50):.2f} 万元")
print(f"年度故障 P90: {np.percentile(total_impact, 90):.2f} 万元")
print(f"年度故障 P99: {np.percentile(total_impact, 99):.2f} 万元")
# 输出示例：
# 年度故障 P50: 14.32 万元
# 年度故障 P90: 67.84 万元
# 年度故障 P99: 215.16 万元
```

**示例 6：AI RMF 评估（NIST）**

| 类别 | 问题 | 评分 | 风险等级 | 缓解 |
| --- | --- | --- | --- | --- |
| Valid and Reliable | 模型准确率 / 稳健性 | 4/5 | 中 | 持续监控 |
| Safe | 输出是否有害 | 5/5 | 低 | 内容审核 |
| Secure and Resilient | 对抗攻击稳健性 | 3/5 | 高 | Adversarial 测试 |
| Accountable and Transparent | 可解释性 | 2/5 | 高 | SHAP + LIME |
| Explainable and Interpretable | 决策可解释 | 3/5 | 中 | LLM Chain-of-Thought |
| Privacy-Enhanced | 数据隐私 | 4/5 | 低 | 差分隐私 |
| Fair with Harmful Bias Managed | 公平性 | 3/5 | 高 | 偏见检测 + 缓解 |

**示例 7：AI 辅助风险识别（Python / Claude API）**

```python
import anthropic
import os

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def identify_risks(system_description: str, prior_risks: list[str]) -> str:
    """基于系统描述 + 历史风险，让 Claude 推荐新风险。"""
    prompt = f"""你是一名资深数据架构师，专注风险评估。

## 系统描述
{system_description}

## 历史风险（来自 Risk Register）
{chr(10).join(f"- {r}" for r in prior_risks)}

请基于 FMEA + Bowtie 方法，推荐 10 条未识别的风险。
每条风险包含：风险描述、概率(1-5)、影响(1-5)、应对策略、Owner 建议。
按 P × I 降序排列。输出 Markdown 表格。"""

    msg = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

# 使用
risks = identify_risks(
    system_description="AI 智能体平台，基于 LangChain + Claude/GPT-4，包含 RAG、知识图谱、多模型路由。",
    prior_risks=["LLM API 限流", "向量库 OOM", "PII 数据泄露"],
)
print(risks)
```

---
