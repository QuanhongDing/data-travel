# 海外案例研究 案例研究

> **一句话定位**：从 Databricks Lakehouse / Snowflake 数据共享 / Stripe 财务数据架构 / LinkedIn 大数据 / Anthropic Claude Engineering / OpenAI Engineering 等海外头部案例中，看清 2024–2025 年数据架构 + AI 平台的前沿趋势。

> 本文是 data-travel 项目 [Ch15 · 案例库](../../README.md) 的子章节（**10-海外案例研究**）。标准化案例结构：背景 → 挑战 → 架构演进 → 关键决策 → 踩坑 → 复用经验。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 海外头部公司的整体技术架构 | §3.1、§3.2、§3.3 |
| Databricks Lakehouse 演进 | §3.2.1 |
| Snowflake 数据共享 + AI | §3.2.2 |
| Stripe 财务数据架构 | §3.2.3 |
| LinkedIn 大数据 + AI | §3.2.4 |
| Anthropic Claude Engineering | §3.2.5 |
| OpenAI Engineering 演进 | §3.2.6 |
| Slack / Notion 数据架构 | §3.2.7 |
| 前沿演进（AI 时代） | §5 |
| 复用清单 | §6.4 |

---

## 1. 背景

### 1.1 为什么需要研究海外案例

海外头部公司（尤其是美国硅谷）往往走在数据架构 + AI 平台的前沿：

1. **前沿技术**：Lakehouse / Vector DB / LLM Serving / Agent Platform 都是海外率先成熟。
2. **不同视角**：海外公司的演进路径与国内不同（如 Netflix Iceberg vs 阿里 MaxCompute）。
3. **跨市场参考**：出海 / 全球化需要了解海外架构。
4. **AI 公司前沿**：Anthropic / OpenAI / Cursor 等 AI 公司的数据架构代表了"AI Native"的未来形态。

### 1.2 海外案例分类

| 类别 | 公司 | 核心主题 |
| --- | --- | --- |
| **数据基础设施** | Databricks、Snowflake | Lakehouse + 数据共享 |
| **AI 平台** | Anthropic、OpenAI | Claude / GPT 工程化 |
| **应用 SaaS** | Stripe、Slack、Notion、Figma | 数据驱动业务 |
| **社交平台** | LinkedIn、Meta | 大数据 + AI |
| **开发者工具** | Cursor、Vercel、Replit | AI 原生开发 |
| **搜索 + 推荐** | Pinterest、Reddit | 内容推荐 |

---

## 2. 挑战

### 2.1 业务挑战

#### 2.1.1 全球化

海外公司基本从 Day 1 就考虑全球化——多区域、多语言、多法规。

#### 2.1.2 合规复杂

GDPR / CCPA / HIPAA / SOC 2 / 等保——海外公司面临的合规复杂度比国内更高。

#### 2.1.3 多业务 / 多 BU

Stripe（支付）、Slack（协作）、LinkedIn（社交+招聘）——海外公司业务多样化程度高。

### 2.2 技术挑战

#### 2.2.1 规模化

Netflix 1.5 亿用户、LinkedIn 9 亿用户、Meta 30 亿用户——规模化是常态。

#### 2.2.2 数据合规

- 欧洲数据本地化。
- 用户删除权（Right to be Forgotten）。
- 数据血缘可追溯。

#### 2.2.3 AI 工程化

AI 公司（Anthropic / OpenAI）面临"模型 + 数据 + 推理"全栈挑战。

### 2.3 组织挑战

#### 2.3.1 远程办公

2020 年后海外公司大量远程办公，**协作模式变化**。

#### 2.3.2 全球化团队

跨时区、跨语言、跨文化协同。

---

- [§3. 架构演进（分案例）](10-overseas-cases-section-3-sec3.md)
- [§4. 关键决策](10-overseas-cases-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](10-overseas-cases-section-5-ai-native---2024-2025.md)
- [§6. 复用经验](10-overseas-cases-section-6-sec6.md)
- [§7. 与同类案例对比](10-overseas-cases-section-7-sec7.md)
- [§8. 面试真题集](10-overseas-cases-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 架构演进（分案例）](10-overseas-cases-section-3-sec3.md)
- [§4. 关键决策](10-overseas-cases-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](10-overseas-cases-section-5-ai-native---2024-2025.md)
- [§6. 复用经验](10-overseas-cases-section-6-sec6.md)
- [§7. 与同类案例对比](10-overseas-cases-section-7-sec7.md)
- [§8. 面试真题集](10-overseas-cases-section-8-sec8.md)

---
