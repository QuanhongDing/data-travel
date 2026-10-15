> 本文件是 **10-metric-platform.md** 的子文件（§6. 落地实践）。完整章节请回到 [index](10-metric-platform.md)。

## 6. 落地实践

### 6.1 真实案例

**案例 1：阿里数据中台 OneMetric**

- 背景：阿里巴巴 2015-2020 数据中台建设。
- 方案：OneData + OneService + OneMetric 三大方法论。
- 工具：内部平台 + 阿里云 DataWorks。
- 结果：覆盖全集团，指标一致性 95%+。

**案例 2：某零售公司 dbt Semantic Layer**

- 背景：500+ 业务指标散落在 100+ BI 报表。
- 方案：搭建 dbt Semantic Layer 统一指标。
- 工具：dbt + Snowflake + Looker。
- 结果：指标一致性从 60% 提升到 95%，开发效率提升 3 倍。

**案例 3：某金融公司 Snowflake Cortex Analyst**

- 背景：业务人员每天问「昨天新增客户数」「Q3 风险敞口」。
- 方案：搭建 Snowflake Cortex Analyst 自然语言查询。
- 工具：Snowflake + Cortex Analyst + Anthropic Claude。
- 结果：业务自助分析率从 20% 提升到 80%。

**案例 4：某互联网公司 Cube.js + Agent**

- 背景：Agent 需要查询指标，散落 API 难维护。
- 方案：Cube.js + Agent Function Calling。
- 工具：Cube.js + ClickHouse + LangChain。
- 结果：Agent 数据查询成功率从 50% 提升到 90%。

### 6.2 踩坑与经验

**坑 1：指标定义不统一**

- 现象：同一指标在不同部门定义不同。
- 解法：OneMetric + Owner + 评审。

**坑 2：计算性能差**

- 现象：高频指标查询慢。
- 解法：预计算 + ClickHouse / Doris + 物化视图。

**坑 3：无指标血缘**

- 现象：指标改了不知道影响哪些报表。
- 解法：DataHub / OpenMetadata 集成。

**坑 4：AI 查询失败**

- 现象：LLM 生成错误 SQL。
- 解法：Schema 注入 + Few-shot + 校验层 + Human-in-the-Loop。

**坑 5：成本失控**

- 现象：实时计算昂贵。
- 解法：分级（实时 / T+1）+ 物化。

**坑 6：指标爆炸**

- 现象：指标无限增长。
- 解法：原子化 + 复用 + 评审 + 废弃机制。

**坑 7：权限失控**

- 现象：所有用户能查所有指标。
- 解法：指标级权限 + 行级权限。

**坑 8：与 AI 脱节**

- 现象：指标平台只服务 BI。
- 解法：Text-to-Metric + Agent Tool。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（单业务线，1-2 个月）**：

1. 选 1 个开源工具（dbt Semantic Layer / Cube）。
2. 定义 50 个核心指标。
3. 接入 1 个 BI 工具验证。

**1→10（部门级，3-6 个月）**：

1. 扩展到 500 个指标。
2. 集成数据血缘（DataHub）。
3. 集成 OLAP 引擎（ClickHouse / Doris）。
4. 指标服务化（API）。

**10→100（企业级，6-18 个月）**：

1. 全集团指标统一。
2. Text-to-Metric 集成（Cortex Analyst）。
3. Agent Tool 集成（Function Calling / MCP）。
4. 实时指标（Flink + Doris）。
5. AI 增强治理。

### 6.4 ROI 评估

- **指标一致性**：从 60% 提升到 95%+。
- **业务自助**：自助分析率从 20% 提升到 70%+。
- **开发效率**：指标开发时间降低 50%。
- **AI 应用门槛**：Agent 指标查询成功率提升 50%+。

---
