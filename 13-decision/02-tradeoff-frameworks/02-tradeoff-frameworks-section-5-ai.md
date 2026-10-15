> 本文件是 **02-tradeoff-frameworks.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](02-tradeoff-frameworks.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

- **AI 辅助选型**：LLM 推荐候选选项 + 初步打分（节省 50% 选型时间）。
- **Decision Intelligence Platform**：选型决策图谱 + AI 助手。
- **AI 辅助 Sensitivity Analysis**：AI 自动识别权重敏感性。
- **AI 辅助 AHP**：AI 帮做两两比较 + 一致性检验。
- **AI 选型 Copilot**：基于历史选型 + ADR 推荐选项。
- **AI 生成 Trade-off Table**：基于场景自动生成多维对比表。
- **AI 选型 Review**：基于组织级 ADR 库 + Tech Radar 做选型 Review。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

- **选型 + RAG**：选型时 RAG 检索历史 ADR + Tech Radar + 案例。
- **选型 + 向量库**：把历史选型文档向量化，相似选型检索 + 复用。
- **选型 + KG**：把选项、维度、ADR、Tech Radar 建成 KG——可推理「类似场景的最佳选项」。
- **选型 + GraphRAG**：跨域选型推理（如「选型 LLM 时同时考虑向量库 / Agent 框架的依赖」）。

### 5.3 学术与工业最新进展（2024-2025）

- **2024**：Gartner 把 Decision Intelligence 列为顶级战略技术趋势。
- **2024**：AWS Well-Architected Framework 加入 Generative AI 视角。
- **2024**：ThoughtWorks Tech Radar 28 期发布（含 GenAI / LLM 选型指南）。
- **2024-2025**：OpenAI / Anthropic / Google 发布企业级 AI 选型助手。
- **2025**：LLM 选型的新维度（幻觉率、合规、成本、上下文窗口）标准化。

### 5.4 未来 3-5 年趋势

- **AI 主导选型决策**：从「人类选 + AI 辅助」到「AI 选 + 人类 Review」。
- **Decision Intelligence 平台化**：组织级选型决策图谱成为基础设施。
- **Trade-off Framework as Code**：用 DSL 表达选型框架，自动化决策。
- **跨域联合选型**：LLM + 向量库 + Agent 框架 + 数据湖 联合决策。
- **可解释选型**：AI 选型可解释（SHAP / LIME）。
- **AI Constitutional 选型**：用「宪法」约束 AI 选型（如「必须开源」「必须支持中文」）。

---
