# 战略决策（Strategy）

> **核心定位**：未来 3-5 年数据架构的演进方向是什么？你的判断依据？—— 考察「**行业视野 + 思维框架 + 业务翻译**」三件套。

## 答题框架（趋势 + 框架 + 业务）

1. **题目**：通常是开放式
   - 「你未来 3-5 年最看好哪个数据技术方向？」
   - 「AI 时代数据架构师的核心能力是什么？」
   - 「你怎么看待湖仓一体 / 向量库 / Data Mesh？」
2. **考察点**：面试官在考「**能不能看到大方向 + 用什么框架思考 + 翻译成业务**」。
3. **参考答案框架**（**4 段结构**）：
   - **判断（2 段）**：明确说你的判断（不骑墙）——「我判断未来 3-5 年 AI 原生数据栈是主方向」
   - **依据（5 段）**：3-5 个支撑依据，每个依据配 1-2 个公开案例
     - 技术驱动：「LLM 推理成本下降 X%」（数据来源：OpenAI / Anthropic 公开）
     - 业务驱动：「电商对实时个性化要求 10 倍提升」
     - 生态驱动：「Apache X 项目 Star 数 / 贡献者增长」
     - 失败案例：「Y 公司的 Z 决策导致…」
   - **对业务的影响（2 段）**：这个判断对候选人 / 团队 / 业务意味着什么
   - **风险与不确定性（2 段）**：你的判断也可能是错的——3 个反例 / 替代假设
4. **常见陷阱**：
   - ❌ 只说「AI 是趋势」等空话
   - ❌ 没有依据（凭感觉）
   - ❌ 骑墙（不明确判断）
   - ❌ 不承认不确定性
   - ❌ 不翻译成业务
5. **追问预测**：
   - 「如果你的判断错了，怎么验证？」
   - 「X 公司的做法你怎么看？」
   - 「你的判断对我们公司现在有什么建议？」

## 5 个核心战略问题（必准备）

| 题目 | 核心论点 | 参考章节 |
| --- | --- | --- |
| **AI 原生数据栈** | 决策白盒化 / Token 经济 / Prompt 版本化 / 4 横线升级 | [Ch99 未来数据架构趋势](../../99-outro/03-trends/03-trends.md) |
| **湖仓 vs Data Mesh vs Data Fabric** | 域化 vs 中心化 vs 混合；中国大厂走中心化 | [Ch09 Data Mesh](../../09-data-intelligence-product/03-data-mesh/03-data-mesh.md) |
| **向量库 vs 关系数据库 vs 图数据库** | 混合检索 + 语义层 + AI 原生 | [Ch04 向量湖 / 混合检索](../../04-data-assetization/) |
| **Agent 时代数据架构师角色** | 从执行到判断 / 从工具人到产品化 / 反向翻译 | [Ch99 未来数据架构师成长路径](../../99-outro/01-future-plans/01-future-plans.md) |
| **国内数据中台 vs 国外 Data Mesh** | 中心化 vs 联邦化；大厂走中心化 + 中台化，中小厂走 Mesh | [Ch01 OneData / 数据中台](../../01-modeling/08-one-data/08-one-data.md) |

## 战略思考的 3 个框架

1. **Wardley Maps**：把技术放到「演化阶段」（Genesis / Custom / Product / Commodity）选型
2. **PEST / 3C / 五力**：经典战略框架，数据架构也能用
3. **逆向工作法（Working Backwards）**：从客户需求反推，从未来 3-5 年反推现在

## 工业案例（推荐主动引用）

- **OpenAI 2024 o1 / o3**：推理模型 + RL 范式转变
- **Anthropic MCP**：Agent 工具协议事实标准
- **阿里通义千问 Qwen3 + 阿里 PAI 灵骏**：大模型 + 算力国产化
- **字节豆包 + 火山方舟**：国内 AI 原生云
- **Snowflake Cortex**：AI 原生数仓的范本
- **Databricks Mosaic AI**：数据 + AI 一体化
- **华为盘古 + 昇腾**：国产算力 + 大模型
- **智谱 GLM / 月之暗面 Kimi / 阶跃星辰**：国内大模型六小虎

## 进阶：怎么展示「行业视野」

**好回答**：「我每周读 2-3 篇 engineering blog（Netflix Tech / Uber Engineering / Snowflake Engineering），每季度整理一份技术雷达。我们团队的选型会按这四个阶段评估：已生产 / 试用 / 观察 / 不采用。」

**坏回答**：「我关注 AI 发展。」—— 没有具体方法。

## 参考资料

- 《Wardley Maps》—— Simon Wardley 的技术演化地图
- 《Good Strategy Bad Strategy》—— Richard Rumelt
- 《The Innovator's Dilemma》—— Clayton Christensen 颠覆式创新
- 《Working Backwards》—— Colin Bryar & Bill Carr (Amazon)
- [Ch13 技术战略](../../13-decision/05-tech-strategy/05-tech-strategy.md) —— 3-5 年路线图方法
- [Ch13 风险评估](../../13-decision/04-risk-assessment/04-risk-assessment.md) —— 战略反例分析
- [Ch99 未来趋势](../../99-outro/03-trends/03-trends.md) —— 2025-2030 行业趋势
