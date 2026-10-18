# Uber 数据架构 案例研究

> **一句话定位**：Uber 用 14 年时间构建了一套以「Schemaless + Docstore + Apache Hudi + Michelangelo ML 平台」为核心的全球化数据架构，是实时调度 + Marketplace 业务数据化最值得借鉴的海外样本。

> 本文是 data-travel 项目 [Ch15 · 案例库](../../README.md) 的子章节（**06-Uber 数据架构**）。标准化案例结构：背景 → 挑战 → 架构演进 → 关键决策 → 踩坑 → 复用经验。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| Uber 数据架构整体形态 | §3.1、§3.2、§3.3、§3.4 |
| Schemaless + Docstore 起源 | §4.1、§4.2 |
| Apache Hudi 表格式 | §4.2、§4.3 |
| Michelangelo ML 平台 | §4.2 |
| 实时调度架构（Uber Marketplace） | §4.1、§4.2 |
| Uber Data Mesh 实践 | §4.1、§4.2 |
| 全球多区域数据合规 | §4.1、§4.2 |
| 实时数仓与实时特征 | §4.1、§4.2 |
| 踩过哪些坑 | §5.1、§5.2、§5.3 |
| 哪些经验值得学 | §6.1、§6.3 |

---

## 1. 背景

### 1.1 公司 / 业务 / 时间

Uber 成立于 2009 年，至今 16 年。数据栈演进的关键时间节点：

- **2009–2012：早期阶段**。从 MySQL + MongoDB 起步，主要解决"司机 + 乘客"匹配。
- **2013：Schemaless 立项**。Uber 自研分布式 KV 存储（基于 MySQL）。
- **2014：Cassandra / HBase 大规模使用**。
- **2015：实时调度平台 V1**。Uber Marketplace 实时匹配系统。
- **2016：Apache Hudi 立项**。Vinoth Chandar 在 Uber 内部开始研发 Hudi（最初叫"Hoodie"）。
- **2017：Michelangelo ML 平台**。Uber 自研 ML 平台。
- **2018：实时数仓 V1**。Kafka + Flink + Hudi。
- **2019：Docstore 立项**。Uber 自研文档数据库（基于 Schemaless + Cassandra）。
- **2020：Apache Hudi 成为 Apache 顶级项目**。
- **2021：Hudi 0.6 发布，开始大规模使用**。
- **2022：Data Mesh 内部讨论**。Uber 内部推进数据所有权分散。
- **2023：GenAI 应用**。
- **2024：Uber AI Platform + 大模型应用 + Hudi 1.0**。
- **2025：实时 AI 数据栈**。

### 1.2 行业与监管

- **出行行业**：监管严格，每个城市都有不同法规。
- **金融监管**：Uber 支付 / Uber Cash 合规要求严格。
- **数据合规**：GDPR / CCPA / 全球多法域。
- **司机监管**：司机身份、健康、车辆等多维度数据合规。

### 1.3 团队规模与组织

- **Uber 数据团队**巅峰期约 **3000+ 人**。
- **数据平台部**（Data Platform）：约 300+ 人。
- **ML 平台团队**（Michelangelo）：约 200+ 人。
- **应用数据团队**：约 2000+ 人。
- **组织文化**：**"Build it, run it"** + **"数据驱动的 Marketplace"** + **"工程师文化"**。

---

## 2. 挑战

### 2.1 业务挑战

#### 2.1.1 Marketplace 实时性

Uber 是典型的双边 Marketplace——乘客 + 司机实时匹配，延迟必须 < 1 秒。

#### 2.1.2 全球化复杂

Uber 在 70+ 国家、10000+ 城市运营，每个城市的价格、法规、司机行为都不同。

#### 2.1.3 业务多形态

UberX / UberPool / Uber Eats / Uber Freight / Uber Elevate（飞行汽车）——业务多样化。

#### 2.1.4 高峰期流量

周五晚上、演唱会后、节假日——Uber 流量峰值是日常的 5–10 倍。

### 2.2 技术挑战

#### 2.2.1 海量实时数据

- 全球 1 亿+ 月活用户。
- 每天数十亿次行程请求。
- 实时特征延迟 < 1 秒。

#### 2.2.2 存储选型

传统 MySQL / Cassandra 在 Uber 场景下都有问题：

- **MySQL**：水平扩展能力有限。
- **Cassandra**：一致性弱、事务能力差。

#### 2.2.3 表格式选型

2018 年以前 Uber 使用 Hive 表格式，同样遇到 Hive 的所有问题。

#### 2.2.4 ML 工程化

Uber 有 1000+ 算法工程师，每个工程师都有自己的模型、特征、AB 实验——如何让 ML 工程化？

### 2.3 组织挑战

#### 2.3.1 跨地域协作

Uber 在旧金山总部 + 阿姆斯特丹 + 班加罗尔 + 上海 + 多伦多 + 巴西等地区有团队，跨地域协作挑战大。

#### 2.3.2 多业务线协同

UberX / Eats / Freight / Elevate——每个业务线都有自己的数据团队，跨业务协同难。

#### 2.3.3 数据所有权

业务团队和数据团队之间的"数据所有权"边界模糊。

---

- [§3. 架构演进](06-uber-data-architecture-section-3-sec3.md)
- [§4. 关键决策](06-uber-data-architecture-section-4-sec4.md)
- [§5. 踩坑与教训](06-uber-data-architecture-section-5-sec5.md)
- [§6. 复用经验](06-uber-data-architecture-section-6-sec6.md)
- [§7. 与同类案例对比](06-uber-data-architecture-section-7-sec7.md)
- [§8. 面试真题集](06-uber-data-architecture-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 架构演进](06-uber-data-architecture-section-3-sec3.md)
- [§4. 关键决策](06-uber-data-architecture-section-4-sec4.md)
- [§5. 踩坑与教训](06-uber-data-architecture-section-5-sec5.md)
- [§6. 复用经验](06-uber-data-architecture-section-6-sec6.md)
- [§7. 与同类案例对比](06-uber-data-architecture-section-7-sec7.md)
- [§8. 面试真题集](06-uber-data-architecture-section-8-sec8.md)

---
