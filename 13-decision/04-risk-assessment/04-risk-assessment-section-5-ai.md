> 本文件是 **04-risk-assessment.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](04-risk-assessment.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

- **AI 风险评估（AI RMF）**：把 AI 模型本身作为风险评估对象——偏见、对抗攻击、隐私、幻觉。
- **LLM 辅助 FMEA**：用 LLM 自动推荐失效模式、生成 FMEA 表格。
- **AI 风险监测**：用 ML 模型预测故障概率（Anomaly Detection + Risk Scoring）。
- **生成式 AI 风险**：幻觉、数据泄露、Prompt 注入、模型滥用——专门的风险类别。
- **联邦学习 / 隐私计算风险**：联邦学习的隐私泄露风险、隐私计算的算力开销风险。
- **AI 治理框架**：EU AI Act（2024 生效）、中国《生成式人工智能服务管理暂行办法》（2023）、美国 EO 14110（2023）。
- **AI Risk Quantification**：用 AI 量化 AI 风险（如 LLM 评估 LLM）。
- **Agent 行为风险**：Agent 自主决策带来的「决策失控」风险——Agent Loop、不可逆操作。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

- **Risk Register + 向量库**：把所有历史风险向量化，相似风险检索 + 复用。
- **Risk + KG**：把风险、威胁、控制、组件建成 KG——可推理「组件 A 失效会引发哪些下游风险」。
- **Risk + RAG**：风险评审时 RAG 检索历史事故 + 类似项目的风险应对案例。
- **GraphRAG for Risk**：跨系统的级联风险推理（如「Kafka 故障 → Flink 作业失败 → 数据延迟 → 业务损失」）。

### 5.3 学术与工业最新进展（2024-2025）

- **2024**：NIST AI Risk Management Framework (AI RMF 1.0) 正式版发布 + Generative AI Profile (NIST AI 600-1)。
- **2024**：EU AI Act 通过（2024-2026 分阶段生效）。
- **2024**：ISO/IEC 23894（AI 风险管理国际标准）。
- **2024**：Anthropic / OpenAI / Google 发布自家 AI Risk Assessment 框架。
- **2025**：OWASP Top 10 for LLM Applications（2025 版）。
- **2025**：MITRE ATLAS（AI 对抗威胁）持续更新。
- **2025**：AI Agent Risk（Agent 自主决策风险）成为热点。

### 5.4 未来 3-5 年趋势

- **Risk as Code**：风险评估自动化嵌入 CI/CD——每次部署自动评估新风险。
- **AI-native Risk Assessment**：用 AI 评估 AI 系统的风险成为行业标准。
- **Continuous Risk Monitoring**：风险从「定期评估」转向「持续监控」。
- **Risk Graph（风险图谱）**：组织级风险 KG，支持级联推理 + AI 辅助决策。
- **Resilience Engineering 主流化**：从「预防风险」到「增强韧性」（即使出问题也能恢复）。
- **AI Governance 标准化**：ISO 42001（AI 治理国际标准）2023 年发布，2024-2027 大规模落地。
- **量子风险评估**：量子计算威胁 + 量子安全风险评估。
- **可持续性风险**：碳排放 / ESG 风险纳入技术风险评估。

---
