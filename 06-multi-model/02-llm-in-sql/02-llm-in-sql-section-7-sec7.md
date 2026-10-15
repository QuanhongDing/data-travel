> 本文件是 **02-llm-in-sql.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](02-llm-in-sql.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 外部 LLM API（Python） | ETL + LLM 批处理 | 专用向量数据库 | LLM in SQL |
| --- | --- | --- | --- | :---: |
| 数据不出仓 | 1 | 2 | 3 | **5** |
| 并行性能 | 2 | 3 | 4 | **5** |
| 工程门槛 | 2（Python） | 2（ETL + Python） | 3 | **5**（SQL） |
| 合规友好 | 1 | 2 | 3 | **5** |
| 模型灵活 | **5** | **5** | 3 | 4 |
| 成本控制 | 2 | 2 | 4 | **5** |
| 向量检索 | 2 | 2 | **5** | **5** |
| SQL 融合 | 1 | 2 | 2 | **5** |
| 工具成熟度 | **5** | 4 | **5** | **4** |

**结论**：

- **LLM in SQL 在「数据不出仓、并行性能、工程门槛、合规友好、成本控制、SQL 融合」6 项满分**。
- **LLM in SQL 在「模型灵活、工具成熟度」2 项劣势**——但前者可通过 BYO-LLM 解决，后者随生态成熟度提升。

### 7.2 决策树

```
[AI 数据处理场景]
   │
   ├── 「数据可出仓 + 模型灵活」→ 外部 LLM API（Python）
   │
   ├── 「数据可出仓 + 大批量离线」→ ETL + LLM 批处理
   │
   ├── 「纯向量检索 + 高 QPS」→ 专用向量数据库（Pinecone / Milvus）
   │
   ├── 「数据不出仓 + SQL 融合」→ LLM in SQL ★
   │
   ├── 「敏感数据 + 合规要求」→ LLM in SQL + Self-Hosted LLM ★
   │
   ├── 「成本敏感 + 批量处理」→ LLM in SQL + 批处理 ★
   │
   └── 「企业级 AI 数据平台」→ LLM in SQL + Data Agent + RAG ★
```

### 7.3 组合使用

**组合 1：LLM in SQL + Data Agent**

- Data Agent 调度 LLM in SQL（数据不出仓）。
- Data Agent 调度 BI 工具（可视化）。
- Data Agent 调度外部 LLM（复杂生成）。
- 适用：企业级数据分析平台。

**组合 2：LLM in SQL + RAG / 向量库**

- 向量检索召回 + SQL 聚合。
- 适用：智能问答、知识检索。

**组合 3：LLM in SQL + GraphRAG**

- KG 找实体 + SQL 查事实 + LLM 生成答案。
- 适用：复杂知识问答。

**组合 4：LLM in SQL + Self-Hosted LLM**

- 企业内网 LLM 推理 + SQL 调度。
- 适用：金融、医疗、政务强合规。

**组合 5：LLM in SQL + BI 工具**

- AI Function 处理文本 + BI 工具可视化。
- 适用：业务自助分析。

---
