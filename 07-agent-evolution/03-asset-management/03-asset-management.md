# AI 资产管理（AI Asset Management）

> **一句话定位**：让 Prompt、Agent 模板、Skill、Workflow 成为可版本化、可复用、可交易的企业级资产——AI 时代的数据资产化新形态。

> 本文是 data-travel 项目 [Ch7 · AI 资产沉淀与自进化](../../README.md) 的子章节（03-asset-management）。覆盖 核心职责④ AI 资产沉淀与自进化系统中"资产层"核心能力。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| AI 资产到底是什么 | §1.1、§2.1 |
| Prompt / Skill / Workflow 怎么版本化 | §4.1、§4.2 |
| Agent Store / Marketplace 怎么设计 | §4.3 |
| AI 资产的 ROI 怎么评估 | §6.4 |

---

## 1. 概念与定位

### 1.1 是什么

**AI 资产（AI Asset）** 是企业级 AI 平台中可复用、可版本化、可治理的"AI 制品"，包括：

| 资产类型 | 定义 | 例子 |
| --- | --- | --- |
| **Prompt** | LLM 输入模板 | "你是 XX 助手，请按以下格式回答..." |
| **Agent 模板** | 预定义 Agent 结构 | 数据分析师 Agent 模板 |
| **Skill（技能）** | 可复用的工具调用 / 推理能力 | "调用退款 API" |
| **Workflow** | 多步任务编排 | "数据查询 → 分析 → 报告生成" |
| **知识资产** | 知识库 / RAG 文档 | 业务知识库 |
| **记忆资产** | 用户 / 团队记忆 | 用户偏好记忆 |
| **模型资产** | Fine-tuned 模型 | 业务专用模型 |
| **评估资产** | Eval 集 / 评估脚本 | 业务评估集 |
| **数据集资产** | 训练 / 微调数据 | 偏好对数据 |
| **工具资产** | Tool / API 封装 | "查询订单 API" |

各资产类型的工程含义进一步展开：

- **Prompt**：最轻量级的资产，本质是"指令 + Few-shot + 变量"的模板。版本化成本低、迭代快。
- **Agent 模板**：定义 Agent 的角色、工具集、记忆、推理循环。可被实例化为多个具体 Agent。
- **Skill**：参数化的"动作单元"，类似代码中的函数。包含输入 / 输出 schema、调用方式、错误处理。
- **Workflow**：多 Skill / Agent 的编排，类似"业务流程图"。可以可视化、可调试。
- **知识资产**：RAG 检索的"原料"，文档 / 数据库 / API 返回。
- **记忆资产**：与 Ch7 §1 长期记忆联动，是带时间维度的"个人 / 团队记忆"。
- **模型资产**：Fine-tuned / Continued-pretrain 的模型，可作为 API 服务。
- **评估资产**：业务评估集，是反馈闭环（Ch7 §2）的输入。
- **数据集资产**：训练 / 微调用的高质量数据，往往来自反馈闭环。
- **工具资产**：Tool / Function Call 的封装，是 Agent 与外部世界交互的桥梁。

### 1.2 为什么需要

- **复用性**：避免每个团队重复造轮子。
- **治理**：AI 资产需要版本管理、权限管理、Owner 制度。
- **ROI 化**：把 AI 能力从"投入"变成"资产"，可评估、可交易。
- **组织能力沉淀**：团队离职不带走能力。
- **可发现性**：新人能快速找到可用的资产，而不是"重新发明轮子"。
- **安全合规**：资产有 Owner、有版本、有审计，符合合规要求。
- **跨团队协作**：统一资产目录让跨团队协作可衡量、可计费。

### 1.3 演进历程

- 2020-2022：Prompt Engineering 阶段，Prompt 在 Git 里散落。
- 2023-2024：Prompt Library 阶段（Dust、PromptLayer）。
- 2024-2025：AI Asset Store 阶段（GPT Store、Coze 扣子、通义、星图），资产化、平台化。
- 2025+：AI Marketplace + MaaS（Model-as-a-Service）阶段。

各阶段关键节点：

| 时间 | 事件 | 关键贡献 |
| --- | --- | --- |
| 2022 | Prompt Engineering 流行 | Prompt 成为"代码" |
| 2023-06 | LangChain Hub | Prompt 模板仓库 |
| 2023-11 | Dust.tt | Prompt Library + 协作 |
| 2024-01 | PromptLayer | Prompt 监控 + 版本 |
| 2024-11 | OpenAI GPT Store | C 端 Prompt 市场 |
| 2024-12 | 字节扣子 Coze 开源 | B 端 Agent 平台 |
| 2025-04 | Salesforce Agentforce | 企业级 Agent 平台 |
| 2025-05 | OpenAI AgentKit | Agent 开发套件 |
| 2025-06 | 阿里通义 / 星图升级 | 资产市场 + MaaS |
| 2025-Q4 | 资产联邦 / 跨组织 | MaaS 标准化 |

### 1.4 在 AI 时代数据架构中的位置

AI 资产位于"Agent 平台"与"组织治理"的交叉点：

```
       Agent 框架（LangChain / AutoGen）
            ↓ 沉淀
       AI 资产层（Prompt / Skill / Workflow）
            ↓ 治理
       AI 资产管理平台（Registry / Store / Marketplace）
            ↓ 治理
       AI 治理（Ch8）
```

进一步细化资产层的数据流：

```
创建 → 评审 → 发布 → 使用 → 评估 → 迭代 → 退役
```

每一环都有资产管理的"治理点"：
- 创建：模板化、Owner 制度、tag 强制。
- 评审：Code Review、安全审查、性能评估。
- 发布：版本号、依赖、文档、上线审批。
- 使用：埋点、调用统计、调用方画像。
- 评估：用户满意度、业务指标、成本。
- 迭代：基于反馈的版本升级。
- 退役：归档、迁移、清理。

### 1.5 与传统软件资产的异同

| 维度 | 传统软件资产 | AI 资产 |
| --- | --- | --- |
| 代码 | 必须 | 可选（Prompt 类资产没有代码） |
| 版本 | Git SemVer | SemVer + 评估分 |
| 测试 | 单元 / 集成 / E2E | Eval + A/B + 业务指标 |
| Owner | 必填 | 必填 |
| 文档 | 必填 | 必填（含 Prompt / 适用场景） |
| 依赖 | package.json / pom.xml | 模型版本 + Prompt + Tool |
| 部署 | CI/CD | 灰度 + 评估 |
| 退役 | 归档 / 删除 | 归档 + 评估后再退役 |

AI 资产比传统软件资产更难治理，因为：
- 输出不确定（同一 Prompt 不同次可能结果不同）。
- 评估维度多（准确 / 相关 / 安全 / 风格 / 成本）。
- 强依赖模型（模型升级 → Prompt 失效）。
- 跨语言 / 跨域（同一资产可能要支持多语言）。

---

## 2. 核心原理

### 2.1 资产分类

| 类别 | 例子 | 治理要求 |
| --- | --- | --- |
| 文本资产 | Prompt、Instruction | 版本、Owner、A/B |
| 代码资产 | Skill、Workflow | 版本、测试、文档 |
| 数据资产 | 知识库、记忆 | 合规、血缘、加密 |
| 模型资产 | Fine-tuned Model | 血缘、评估、版本 |
| 工具资产 | Tool、API 封装 | 接口契约、限流、审计 |
| 评估资产 | Eval 集 | 版本、覆盖度 |
| 数据集资产 | 训练数据 | 来源、血缘、清洗 |

### 2.2 资产生命周期

```
创建 → 评审 → 发布 → 使用 → 评估 → 迭代 → 退役
```

各阶段关键产出：

| 阶段 | 输入 | 输出 | 关键问题 |
| --- | --- | --- | --- |
| 创建 | 需求 / 场景 | 资产草稿 | 谁创建？模板怎么用？ |
| 评审 | 资产草稿 | 评审结论 | 谁评审？评审什么？ |
| 发布 | 评审通过资产 | 上线资产 | 版本号、灰度策略 |
| 使用 | 上线资产 | 调用日志 | 调用方、配额、限流 |
| 评估 | 调用日志 | 评估报告 | CSAT / 业务指标 / 成本 |
| 迭代 | 评估报告 | 新版本 | A/B、回归、回滚 |
| 退役 | 决策 | 归档 / 删除 | 迁移计划、通知 |

### 2.3 资产生命周期管理

#### 2.3.1 创建

- 模板化创建（强制结构化字段）。
- 自动生成元数据（基于 LLM）。
- 强制 Owner / Tag / 分类。

#### 2.3.2 评审

- Code Review（Skill / Workflow）。
- Prompt Review（指令 + Few-shot）。
- 安全审查（敏感数据、Prompt 注入风险）。
- 性能评估（离线 Eval）。

#### 2.3.3 发布

- SemVer 版本号（主版本.次版本.补丁）。
- 灰度发布（10% → 50% → 100%）。
- 强制文档（README + 示例 + 评估报告）。

#### 2.3.4 使用

- 调用埋点（哪个调用方、频次、延迟）。
- 配额管理（企业内计费 / 限流）。
- 错误监控（失败率、超时率）。

#### 2.3.5 评估

- 用户满意度（CSAT / 点赞 / 点踩）。
- 业务指标（CTR / 转化 / 接受率）。
- 成本指标（每千次调用成本）。
- 安全指标（违规率 / 越狱率）。

#### 2.3.6 迭代

- 基于反馈优化。
- A/B 验证。
- 版本号递增。

#### 2.3.7 退役

- 提前通知调用方。
- 替代资产推荐。
- 归档 + 30 天观察期后删除。

### 2.4 资产版本管理（SemVer）

AI 资产沿用 SemVer：

```
主版本.次版本.补丁
X.Y.Z
```

升级规则：

| 变更类型 | 版本号 | 例子 |
| --- | --- | --- |
| Breaking Change | 主版本 +1 | Prompt 改动导致回答风格大变 |
| 新增功能 | 次版本 +1 | Skill 新增输入参数 |
| Bug Fix | 补丁 +1 | 修正 Prompt 错别字 |

### 2.5 资产血缘与影响分析

资产血缘指"这个资产依赖谁、被谁依赖"。

血缘图：

```
Knowledge Base v1.2 ─→ Prompt Template v3.1 ─→ Workflow v2.0 ─→ Agent Template v1.0
                                                                ↑
                                              Memory Schema v1.0 ──┘
```

影响分析：当底层资产（Knowledge Base）升级时，列出所有受影响的资产（Prompt / Workflow / Agent），并触发回归测试。

### 2.6 关键工具

- OpenAI GPT Store（2024）
- 字节扣子 Coze（2024）
- 阿里通义、星图
- 百度灵境
- Replicate、Cohere、CrewAI Store
- LangChain Hub、Dust、PromptLayer

详细工具对比：

| 工具 | 类型 | 特点 | 适用 |
| --- | --- | --- | --- |
| GPT Store | C 端市场 | 用户 / 创作者 | C 端应用 |
| Coze | B 端平台 | 字节扣子、开源 | 企业 Agent |
| 通义 / 星图 | B 端 | 阿里生态 | 阿里系业务 |
| LangChain Hub | Prompt 仓库 | 开源、LLM 友好 | 研发团队 |
| Dust.tt | Prompt 协作 | 团队协作 | 运营团队 |
| PromptLayer | Prompt 监控 | 监控 + 版本 | 工程团队 |
| Salesforce Agentforce | 企业级 | 高度合规 | 大型企业 |
| AgentKit | 套件 | OpenAI 出品 | 通用 Agent |
| Replicate | 模型市场 | MaaS | 模型消费 |
| Copilot Studio | 企业级 | 微软生态 | 企业 Copilot |

---

- [§3. 设计模式与范式](03-asset-management-section-3-sec3.md)
- [§4. 工程实现](03-asset-management-section-4-sec4.md)
- [§5. 前沿演进](03-asset-management-section-5-sec5.md)
- [§6. 落地实践](03-asset-management-section-6-sec6.md)
- [§7. 与其他方法对比](03-asset-management-section-7-sec7.md)
- [§8. 面试真题集](03-asset-management-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](03-asset-management-section-3-sec3.md)
- [§4. 工程实现](03-asset-management-section-4-sec4.md)
- [§5. 前沿演进](03-asset-management-section-5-sec5.md)
- [§6. 落地实践](03-asset-management-section-6-sec6.md)
- [§7. 与其他方法对比](03-asset-management-section-7-sec7.md)
- [§8. 面试真题集](03-asset-management-section-8-sec8.md)

---
