> 本文件是 **03-asset-management.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](03-asset-management.md)。

## 3. 设计模式与范式

### 3.1 主要模式

| 模式 | 场景 | 工具 |
| --- | --- | --- |
| **Git 化 Prompt** | 研发团队 | Git + Code Review |
| **Prompt Library** | 运营团队 | PromptLayer、Dust |
| **Agent Store** | 通用 Agent | GPT Store、Coze |
| **私有 Marketplace** | 企业内 | 自研 Store |
| **MaaS** | 模型消费 | Replicate、阿里云百炼 |
| **混合模式** | 综合 | 多种组合 |

各模式展开：

#### 3.1.1 Git 化 Prompt

- Prompt 作为 .md / .yaml 文件入 Git。
- 走 Code Review。
- 优点：版本管理、权限、追溯。
- 缺点：UI 不友好、运营团队不会用。

#### 3.1.2 Prompt Library

- Web 平台统一管理 Prompt。
- 优点：UI 友好、支持 A/B、含评估。
- 缺点：需要商业化产品。

#### 3.1.3 Agent Store

- 类似"App Store"，用户消费 Agent。
- 优点：流量、变现、生态。
- 缺点：需要大量 Agent 供给。

#### 3.1.4 私有 Marketplace

- 企业内部的资产市场。
- 优点：合规、可计费、可治理。
- 缺点：建设成本高。

#### 3.1.5 MaaS

- 模型即服务，第三方模型 API 市场。
- 优点：免运维、按需付费。
- 缺点：数据出境 / 合规风险。

### 3.2 资产生命周期模式选择

| 业务 | 推荐模式 | 理由 |
| --- | --- | --- |
| 研发团队 | Git 化 Prompt + LangChain Hub | 版本管理 |
| 运营团队 | Prompt Library（Dust / PromptLayer） | UI 友好 |
| C 端应用 | GPT Store / Coze | 流量 + 变现 |
| 企业内部 | 私有 Marketplace | 合规 + 计费 |
| 模型消费 | MaaS（Replicate / 阿里云百炼） | 按需 |

### 3.3 反模式与陷阱

| 反模式 | 表现 | 后果 | 如何避免 |
| --- | --- | --- | --- |
| **资产孤岛** | Prompt 散落在代码里 | 复用率低 | 强制资产化 |
| **无 Owner** | 资产无人维护 | 失效资产堆积 | Owner 强制 |
| **无版本** | 改了不知道改的是哪个版本 | 回滚困难 | SemVer |
| **无评估** | 资产上线不评估 | 效果退化 | 上线前必评估 |
| **无血缘** | 不知道依赖关系 | 升级灾难 | 血缘分析 |
| **无文档** | 没人知道怎么用 | 调用困难 | 强制文档 |
| **过度资产化** | 把所有东西都当资产 | 管理成本爆炸 | 分级资产化 |
| **无退役** | 失效资产堆满仓库 | 检索噪声 | 自动退役 |
| **资产私用** | 个人拥有企业资产 | 离职带走 | 企业级 Owner |

---
