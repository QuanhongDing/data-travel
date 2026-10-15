> 本文件是 **02-llm-in-sql.md** 的子文件（§6. 落地实践）。完整章节请回到 [index](02-llm-in-sql.md)。

## 6. 落地实践

### 6.1 真实案例

**案例 1：Snowflake Cortex 在零售巨头的应用**

- **背景**：北美零售巨头每天 100 万条商品评论，需要情感分析、问题分类、营销文案生成。
- **方案**：
  - 使用 Snowflake Cortex AI Functions（ai_classify / ai_summarize / ai_extract / ai_generate_text）。
  - 数据不出 Snowflake，集成 Claude 3.5 Sonnet、GPT-4o、Snowflake Arctic。
  - 每日批处理 100 万评论，30 分钟完成（vs Python 24 小时）。
- **结果**：
  - 处理时间从 24 小时降至 30 分钟（48x 加速）。
  - Token 成本从每月 $200K 降至 $50K（75% 节省）。
  - 合规：数据不出 Snowflake，满足 GDPR、CCPA。

**案例 2：Databricks Genie 在金融机构的应用**

- **背景**：银行分析师希望自然语言查询 Lakehouse，但数据不能出企业内网。
- **方案**：
  - 使用 Databricks Genie + AI Functions。
  - Self-Hosted Llama 3.1 70B 作为 NL2SQL 后端。
  - Unity Catalog 管理数据权限。
  - Vector Search + AI Function 融合（RAG 增强）。
- **结果**：
  - 分析师查询效率提升 5x。
  - 数据完全在企业内网，满足金融合规。
  - Token 成本降低 60%（vs 调用 OpenAI）。

**案例 3：阿里 PolarDB AI 在电商场景的应用**

- **背景**：电商平台商品评论、商品描述、商品图需要 AI 处理。
- **方案**：
  - 使用阿里 PolarDB AI（ai_generate / ai_classify / ai_embed）。
  - 集成通义千问 Qwen2.5 系列。
  - 向量检索 + SQL 聚合融合（商品推荐）。
  - PolarDB 弹性扩容应对双 11 大促。
- **结果**：
  - 商品分类准确率 92%。
  - 营销文案生成人工评分 4.2/5。
  - 千人千面推荐 CTR 提升 18%。

**案例 4：PostgreSQL pgai 在 SaaS 公司的应用**

- **背景**：SaaS 公司希望给客户提供"自然语言查询数据库"功能，但不想用云数据库。
- **方案**：
  - 使用 PostgreSQL + pgai 扩展（开源）。
  - BYO-LLM（OpenAI / Claude / Ollama 切换）。
  - Vector Search + AI Function 融合。
  - 自托管在客户 VPC 内。
- **结果**：
  - 客户可选择公有云或私有化部署。
  - 文档问答 + 自然语言 SQL 一站式。
  - 月成本 $5K（vs 自研 $50K）。

### 6.2 踩坑与经验

**坑 1：AI Function 性能慢**

- 现象：100 万行 ai_classify，跑了 24 小时。
- 解法：**批处理**（batching=32）+ **MPP 并行**（10x 加速）+ **缓存**（20-50% 命中率）+ **Predicate Push-Down**。

**坑 2：Token 成本爆炸**

- 现象：每月 Token 成本 $200K，超预算 10 倍。
- 解法：**分层路由**（小任务用小模型）+ **缓存** + **Prompt 压缩** + **按用户配额**。

**坑 3：数据出仓合规违规**

- 现象：使用 Snowflake Cortex 时配置了 OpenAI，敏感数据出 Snowflake，违反合规。
- 解法：**配置 BYO-LLM / 自托管 LLM** + **审计日志** + **网络隔离** + **合规审计**。

**坑 4：AI Function 准确率低**

- 现象：ai_classify 准确率只有 60%，业务拒绝使用。
- 解法：**Few-shot Prompt**（提供 3-5 个示例）+ **Self-Consistency**（多次采样 + 投票）+ **Fine-Tuning 行业模型**。

**坑 5：Prompt 注入**

- 现象：用户在评论文本中插入恶意 Prompt，让 AI 执行破坏性操作。
- 解法：**AI Function 只读**（不暴露执行 SQL）+ **Prompt 注入检测** + **输入清洗**。

**坑 6：向量索引性能差**

- 现象：1000 万行向量全表扫描，秒级响应变分钟级。
- 解法：**HNSW 索引** + **向量压缩（PQ）** + **分片** + **GPU 加速**。

**坑 7：NL2SQL 准确率低**

- 现象：Cortex Analyst 生成的 SQL 50% 跑不通。
- 解法：**Schema RAG**（基于向量检索相关表 / 列）+ **指标语义层**（dbt Semantic Layer）+ **Self-Correction**（执行失败自动重试）。

**坑 8：模型版本管理混乱**

- 现象：不同业务用不同 GPT-4 版本（gpt-4 / gpt-4-turbo / gpt-4o），效果不可对比。
- 解法：**统一模型注册** + **版本管理** + **A/B 测试** + **效果评估**。

**坑 9：审计与合规缺失**

- 现象：AI 调用无审计日志，无法满足等保 2.0 要求。
- 解法：**完整审计日志**（含 input / output / token / user / time）+ **审计告警** + **定期合规审计**。

**坑 10：缓存陈旧**

- 现象：AI 结果缓存了 6 个月，业务数据已变更，答案错误。
- 解法：**TTL 缓存**（如 24 小时过期）+ **主动失效**（数据更新时清除缓存）+ **实时校验**。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（单点试点，1-3 个月）**：

1. 选定 1 个高频 AI 场景（如评论分类）。
2. 选择 1 个数据库平台（Snowflake / Databricks / PolarDB / pgai）。
3. 配置模型路由（小任务用小模型）。
4. 在 1000 行测试集评估（准确率 > 80%）。
5. 部署小规模批处理（10 万行）。
6. 业务团队灰度验证。

**1→10（部门级扩展，3-9 个月）**：

1. 扩展到 3-5 个 AI 场景（分类 / 摘要 / 抽取 / 向量）。
2. 完善模型路由（小 / 中 / 大模型分层）。
3. 集成向量检索（HNSW 索引）。
4. 部署 NL2SQL（Cortex Analyst / Genie）。
5. 集成可观测（Langfuse / Phoenix）。
6. 建立成本监控与配额管理。
7. 部门级推广（10-50 用户）。

**10→100（企业级平台，9-24 个月）**：

1. 全企业 AI Function 平台化。
2. Self-Hosted LLM 部署（Qwen / DeepSeek / Llama）。
3. 联邦化：多个数据库平台共享 LLM Gateway。
4. 标准化：参与或主导行业 AI Function 标准。
5. 产品化：构建"LLM in SQL 工程平台"（模型路由、缓存、配额、审计）。
6. 集成化：与 Data Agent / RAG / BI 工具深度集成。
7. 国产化适配（等保 2.0 / 3.0、GDPR）。

### 6.4 ROI 评估

**直接收益**：

- AI 处理时间从 24 小时降至 30 分钟（48x）。
- Token 成本降低 50-75%（批处理 + 缓存 + 分层）。
- 数据合规：100% 数据不出仓。
- 工程门槛降低 90%（SQL 即可）。

**间接收益**：

- 业务自助分析覆盖率提升（典型 20% → 70%）。
- 分析师效率提升（典型 3-10x）。
- AI 应用从"专家级"到"全员级"。

**评估指标**：

- **准确率**：AI Function 准确率（目标 > 85%）。
- **延迟**：P95 AI Function 调用延迟（目标 < 5 秒）。
- **成本**：单次 AI Function 调用成本（目标 < $0.01）。
- **合规**：数据出仓次数（目标 = 0）。
- **覆盖率**：业务自助分析覆盖率（目标 > 70%）。
- **吞吐量**：每日批处理行数（目标 > 100 万）。

---
