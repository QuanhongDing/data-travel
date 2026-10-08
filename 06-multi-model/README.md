# Ch6 · 多模型编排与工具调用

> **一句话定位**：统一接入多个大模型（OpenAI / Anthropic Claude / 国内大模型），按需路由，工具链调度——把"模型"当成可调度资源。

## 画像映射

本章对应 **核心职责③ 多模型编排与工具链调度** + **加分项（OpenAI / Claude 集成）**：

- 多模型统一接入层、标准化工具调用框架
- 按需路由、灵活组合、模型降级与限流
- 国产模型（文心 / 通义 / DeepSeek / 智谱）+ 国外模型（GPT-4 / Claude / Gemini）协同

> P7 会"接一个模型 API"，P8 会"接多模型做容灾"，**资深架构师会把"模型当成可调度资源"**——像调度 Pod 一样调度 LLM。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：AI 架构师 / 平台架构师 / 算法工程师
- **前置章节**：[Ch5 · AI 智能体平台架构](../05-agent-platform/)（模型编排是 Agent 平台的调度层）
- **后续章节**：[Ch7 · AI 资产沉淀与自进化](../07-agent-evolution/)（自进化需要多模型对比）；[Ch8 · AI 治理与安全](../08-ai-governance/)（模型审计）

## 本章要回答的核心问题

1. **多模型怎么统一接入？** LiteLLM / One-API / 自研统一网关——抽象层、能力映射、API 兼容性？
2. **路由策略怎么设计？** 基于成本 / 延迟 / 能力 / 合规的动态路由——什么时候用 GPT-4，什么时候用 Claude，什么时候用国产模型？
3. **Function Calling / Tool Use 怎么标准化？** JSON Schema 协议、参数校验、错误处理、流式响应？
4. **Prompt 工程怎么做？** 系统提示 / Few-shot / CoT / ReAct——把业务诉求转化为稳定的 Prompt？
5. **Token 成本怎么控制？** 上下文压缩、缓存、批处理、模型分级（小模型做预处理 / 大模型做精排）？
6. **模型降级与限流怎么做？** 多模型容灾、API 限流、配额管理、灰度发布？
7. **模型效果怎么评估？** LLM-as-a-Judge / 人类反馈 / A/B 实验——怎么持续迭代 Prompt 与选型？

## 子主题

- [ ] **[Embedding 与检索](./01-embedding-and-retrieval/README.md)**：Embedding 模型选型（OpenAI / BGE / M3E）、向量检索与重排
- [ ] **[LLM in SQL](./02-llm-in-sql/README.md)**：在 SQL 引擎中嵌入 LLM（MotherDuck / Snowflake Cortex / Databricks AI Functions）——让数据不出仓

> 文件命名建议：`embedding-and-retrieval.md` / `llm-in-sql.md` / `unified-model-gateway.md` / `routing-strategy.md` / `function-calling.md` / `prompt-engineering.md` / `cost-control.md` / `model-evaluation.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 搭建多模型统一接入网关（LiteLLM / One-API / 自研），屏蔽厂商差异
- 设计路由策略（成本 / 延迟 / 能力 / 合规），实现按需调度
- 标准化 Function Calling / Tool Use（JSON Schema / 参数校验 / 错误处理）
- 用系统提示 / Few-shot / CoT 等 Prompt 工程技巧提升模型稳定性
- 控制 Token 成本（上下文压缩 / 缓存 / 批处理 / 模型分级），把单次成本降低 50%+
- 设计模型降级与限流方案，让系统在大模型故障时仍可用
- 建立 LLM 评估体系（LLM-as-a-Judge / 人类反馈 / A/B），持续迭代 Prompt 与选型
- **把"模型"当成可调度资源**——这是多模型编排的核心思维

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch7 · AI 资产沉淀与自进化](../07-agent-evolution/) 学习自进化闭环
- 进入 [Ch8 · AI 治理与安全](../08-ai-governance/) 学习模型审计与合规
