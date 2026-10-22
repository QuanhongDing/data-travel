# Ch8 · AI 治理与安全

> **一句话定位**：AI 资产分级保密、防泄露、合规——**资深架构师必须守住底线，AI 资产不能泄露**。

## 画像映射

本章对应 **核心职责⑥ AI 资产分级保密与防泄露体系** + **加分项（等保 2.0/3.0 合规）**：

- 黑盒化资产封装、细粒度权限管控、全链路操作审计、输出端防泄露 —— **权限与审计**见 [§01 AI 数据治理](01-ai-data-governance/01-ai-data-governance.md)，**防泄露**见 [§02 数据安全与合规落地](02-data-security-and-compliance/02-data-security-and-compliance.md)
- 数据安全（脱敏 / 加密 / 分类分级）、权限管控（RBAC / ABAC）、审计日志 —— **分类分级与审计**见 §01，**脱敏 / 加密 / 权限模型**见 [§02](02-data-security-and-compliance/02-data-security-and-compliance.md) 的「设计模式」一节
- 防泄露（DLP / 提示词注入防御）、合规（等保 2.0/3.0 / GDPR / 个保法）—— **提示词注入防御**见 §01，**DLP 与等保落地**见 §02 的「设计模式」与「落地实践」，**GDPR / 个保法**见 §01
- 国产化适配 —— 见 [§02](02-data-security-and-compliance/02-data-security-and-compliance.md) 的「国产化适配」与「存量迁移」两节（五类盘点与逐算子验收）

> P7 会"做权限"，P8 会"做审计"，**资深架构师会让 AI 系统"通过等保测评"**——守住合规底线，承载业务上线。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：AI 架构师 / 安全架构师 / 合规负责人
- **前置章节**：[Ch4 · 企业级数据资产化与智能检索](../04-data-assetization/)（治理建立在资产化之上）；[Ch7 · AI 资产沉淀与自进化](../07-agent-evolution/)（资产沉淀越多，治理越重要）
- **后续章节**：[Ch9 · 数据智能产品](../09-data-intelligence-product/)（治理是产品上线的前提）；[Ch11 · 横切工程](../11-cross-cutting/)（数据可观测与血缘是治理的工具）

## 本章要回答的核心问题

1. **AI 资产怎么分级分类？** 公开 / 内部 / 机密 / 绝密——四级分类法与对应保护措施？（见 [§01](01-ai-data-governance/01-ai-data-governance.md)）
2. **数据脱敏与加密怎么做？** 静态脱敏 / 动态脱敏 / 差分隐私 / 同态加密——不同场景下的取舍？（见 [§02 的「四种脱敏形态与选择顺序」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)）
3. **细粒度权限怎么设计？** RBAC / ABAC / 字段级权限 / 行级权限——如何在 RAG 召回与 LLM 生成中落地？（见 [§02 的「权限模型」与「召回期权限裁剪」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)）
4. **Prompt 注入与越狱怎么防御？** 入向检测 / 出向过滤 / **动作层授权**——构建纵深防御？**本书的一条结论是：只靠内容过滤根治不了**（注入的结果是「指令被服从」，属动作层问题），所以三层里最硬的是第三层（见 [§01 §7](01-ai-data-governance/01-ai-data-governance-section-7-sec7.md)，OWASP LLM01 与 MCP 的授权原语）。
5. **DLP（数据防泄露）怎么设计？** 输出端关键词检测、敏感实体识别（身份证 / 银行卡 / 手机号）、二次确认机制？（见 [§02 的「DLP 三件套」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)）
6. **等保 2.0/3.0 合规怎么落地？** 安全管理中心 / 安全通信网络 / 安全区域边界 / 安全计算环境——「一个中心、三重防护」怎么落到 AI 系统上（现行有效的对照是等保 2.0，GB/T 22239-2019）？（见 [§02 的「等保对照与国产化适配」，以及工程实现一节的「等保控制点映射表」模板](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)）
7. **全链路审计怎么做？** 访问日志、调用日志、生成日志、用户反馈——可追溯、可回放、可定责？（见 [§01](01-ai-data-governance/01-ai-data-governance.md)）

## 子主题

- [ ] **[AI 数据治理](01-ai-data-governance/01-ai-data-governance.md)**：AI 资产分类分级 / 审计留痕 / 提示词注入防御——治理的分级、归属与留痕载体
- [ ] **[数据安全与合规落地](02-data-security-and-compliance/02-data-security-and-compliance.md)**：脱敏（静态 / 动态 / 差分隐私 / 同态）· 权限模型（RBAC / ABAC / 字段级 / 行级 / 召回期裁剪）· DLP 三件套 · 等保「一个中心、三重防护」的控制点映射 · 国产化五类盘点——把分级变成机制，把机制变成可举证的证据

> 文件命名建议：`ai-data-governance.md` / `data-classification.md` / `desensitization-and-encryption.md` / `fine-grained-permission.md` / `prompt-injection-defense.md` / `dlp-and-output-filter.md` / `deng-bao-compliance.md` / `audit-and-traceability.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 画像能力小结

完成本章后，你应当能够：

- 设计 AI 资产的分级分类体系（公开 / 内部 / 机密 / 绝密）——[§01](01-ai-data-governance/01-ai-data-governance.md)
- 选型数据脱敏方案（静态 / 动态 / 差分隐私 / 同态加密），并落地工程链路——[§02 的「四种脱敏形态」与「选型决策树」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)
- 设计细粒度权限控制（RBAC / ABAC / 字段级 / 行级），在 RAG 召回与 LLM 生成中落地——[§02 的「权限模型」与「召回期权限裁剪」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)
- 防御 Prompt 注入与越狱（入向检测 / 出向过滤 / **动作层授权**——三层里最硬的是第三层）——[§01 §7](01-ai-data-governance/01-ai-data-governance-section-7-sec7.md)
- 设计 DLP（数据防泄露）方案，识别敏感实体、检测输出端——[§02 的「DLP 三件套」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)
- 落地等保 2.0/3.0 合规（安全管理中心 + 安全通信网络 / 安全区域边界 / 安全计算环境——「一个中心、三重防护」）——[§02 的「等保对照」、工程实现一节的「存量迁移」与「落地实践」的测评案例](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)
- 搭建全链路审计（访问 / 调用 / 生成 / 反馈），可追溯、可回放、可定责——[§01](01-ai-data-governance/01-ai-data-governance.md)
- 完成国产化适配验收（五类盘点 + 逐算子精度对照）——[§02 的「国产化适配」与工程实现一节的「关键技术点」](02-data-security-and-compliance/02-data-security-and-compliance-section-3-sec3.md)
- **守住 AI 资产合规底线**——这是 AI 时代架构师不可推卸的责任

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch9 · 数据智能产品](../09-data-intelligence-product/) 学习治理之上的产品化
- 进入 [Ch11 · 横切工程](../11-cross-cutting/) 学习数据可观测与血缘（治理的工具）