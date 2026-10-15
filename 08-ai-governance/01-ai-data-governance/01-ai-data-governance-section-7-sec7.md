> 本文件是 **01-ai-data-governance.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](01-ai-data-governance.md)。

## 7. 与其他方法对比

| 维度 | 传统数据治理 | ML 治理 | LLM 治理 | Agent 治理 |
| --- | :---: | :---: | :---: | :---: |
| **资产类型** | 表 / 字段 | 模型 + 数据集 | Prompt + 模型 + Embedding | Agent + Skill + Memory |
| **合规框架** | GDPR / 个保法 | HIPAA / Basel | EU AI Act / NIST AI RMF | 完整 + Tool 治理 |
| **自动化** | 低 | 中 | 中-高 | 高 |
| **实时性** | 低 | 中 | 中 | 高 |
| **可解释** | SQL 可读 | 模型可解释（XAI） | Prompt 可读 + 概率输出 | 决策链可追溯 |
| **审计深度** | 数据访问 | 模型版本 + 数据版本 | + Prompt + 输出 + 反馈 | + Tool + Memory + 权限 |
| **Owner** | 数据 Owner | 模型 Owner | + Prompt Owner + 评估 Owner | + Agent Owner + Skill Owner |
| **生命周期** | 周-月 | 周-月 | 天-周 | 小时-天 |
| **价值评估** | 成本/收益 | 训练成本 | + IP + 推理价值 | + 工具 + 记忆价值 |
| **典型工具** | Collibra / Informatica | MLflow / W&B | + Langfuse / PromptLayer | + AgentScope / LangGraph 治理 |

**演进路径**：

```
传统数据治理 → ML 治理 → LLM 治理 → Agent 治理
   (DAMA)      (MLOps)    (LLMOps)    (AgentOps)
```

每一步演进，治理对象从「结构化数据」扩展到「智能系统」，治理工具从「目录+血缘」扩展到「全链路可观测 + 风险评估 + 合规映射」。

---
