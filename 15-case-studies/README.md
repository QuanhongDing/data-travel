# Ch15 · 案例库

> **一句话定位**：从真实工业级 AI 智能体平台实践中学习——阿里中台演进、双 11 稳定性、字节数据架构、Netflix 数据栈、半导体 / 制造 / 金融 / 互联网 AI 智能体平台。

## 画像映射

本章对应 **R8 行业经验**（招聘要求：国内外头部游戏 / 基金 / 数据智能产品 / 大型互联网企业工作经验）+ **核心职责⑤ 行业情报智能体** 的实战锚点：

- **行业 AI 智能体平台案例**：半导体 AI 智能体、高端制造 AI 智能体、企业服务 AI 智能体、金融 / 基金 AI 智能体、互联网 / 游戏 AI 智能体
- **国内头部案例**：阿里 AI 智能体平台、字节扣子、腾讯元宝、华为盘古、百度文心
- **国外头部案例**：OpenAI / Anthropic / Databricks / Snowflake 的演进
- **失败案例复盘**：被废弃的 AI 项目、过度设计的智能体平台、失败的 RAG 项目

> P7 会"学方法论"，P8 会"看案例"，**资深数据架构师会"研究真实工业级问题"**——案例库不是"阅读材料"，而是面试弹药库。

## 基本信息

- **难度**：★★★☆☆
- **推荐角色**：全员（按需查阅）
- **前置章节**：无（按需查阅；推荐结合 [Ch10 · 行业智能体](../10-industry-agent/) 与 [Ch12 · 架构与高可用](../12-architecture/) 阅读）
- **后续章节**：[后记 · 趋势与思考](../99-outro/)

## 为什么需要案例库

> **光讲方法论没有说服力，必须看真实的工业级问题**。

技术书最容易"假大空"——讲一堆方法论，但读者不知道"在真实场景下到底怎么用"。本章是**本书的"实战锚点"**——每个案例都包含：

- **背景与挑战**：业务规模、技术栈、痛点
- **架构演进路径**：从 v1 到 v2 到 v3 的设计取舍
- **关键决策与权衡**：当时为什么这么选
- **踩过的坑与教训**：哪些决策后来被证明是错的
- **可复用的经验**：哪些决策对其他公司也适用

## 本章要回答的核心问题

1. **阿里数据中台 20 年演进史** 给我们什么启示？从烟囱 → 中台 → AI 中台，每一次架构跃迁背后的业务驱动是什么？
2. **双 11 稳定性保障** 的全链路方案如何设计？全链路压测、单元化、限流降级、值班机制的工程范式？
3. **字节跳动 / 美团 / Netflix / Uber / Airbnb** 的数据架构演进，各自走了什么不同的路？
4. **AI 智能体平台**（字节扣子 / 腾讯元宝 / 华为盘古 / 百度文心）的架构差异与共性？
5. **海外数据栈**（Databricks / Snowflake / Fivetran / dbt）的产品演进与商业模式？
6. **失败案例**（被废弃的中台、过度设计的湖仓、失败的 AI 项目）给我们什么反思？

## 子主题

- [ ] **[阿里数据中台演进史](./01-alibaba-data-middle-platform/README.md)**：从烟囱→中台→AI 中台，20 年演进路径
- [ ] **[双 11 稳定性保障](./02-double-11-stability/README.md)**：全链路压测、单元化、限流降级、值班机制
- [ ] **[字节跳动数据架构](./03-byte-data-architecture/README.md)**：Lakehouse + 实时 + AI 原生的实践
- [ ] **[美团特征平台](./04-meituan-feature-store/README.md)**：Feature Store 从 0 到 1 的建设
- [ ] **[Netflix 数据架构](./05-netflix-data-stack/README.md)**：Keystone → Metaflow 的演进
- [ ] **[Uber 数据架构](./06-uber-data-architecture/README.md)**：Schemaless → Docstore → 实时分析
- [ ] **[Airbnb 数据架构](./07-airbnb-data-architecture/README.md)**：Minerva + Dataportal 的元数据治理
- [ ] **[从 0 到独角兽的数据栈](./08-startup-evolution/README.md)**：早期、初创期、成长期的演进路径
- [ ] **[失败案例](./09-failure-cases/README.md)**：被废弃的中台、过度设计的湖仓、失败的 AI 项目
- [ ] **[海外案例](./10-overseas-cases/README.md)**：Databricks / Snowflake / Fivetran / dbt 的产品演进

> 文件命名建议：`alibaba-data-middle-platform.md` / `double-11-stability.md` / `byte-data-architecture.md` / `meituan-feature-store.md` / `netflix-data-stack.md` / `uber-data-architecture.md` / `airbnb-data-architecture.md` / `startup-evolution.md` / `failure-cases.md` / `overseas-cases.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 案例阅读方法

每个案例按以下结构组织：

```
1. 背景（业务规模、用户量、流量量级）
2. 挑战（核心痛点）
3. 架构演进（v1 → v2 → v3 的关键转折）
4. 关键决策（当时为什么这么选，Trade-off 是什么）
5. 踩过的坑（哪些决策后来被证伪）
6. 可复用的经验（对其他公司/团队有什么启示）
7. 参考资料（公开演讲、博客、论文）
```

## 画像能力小结

完成本章后，你应当能够：

- **横向对比头部架构**：阿里中台 / 字节数据架构 / Netflix / Uber / Airbnb——理解不同公司为何走出不同的演进路径
- **理解大促稳定性的工程范式**：双 11 全链路压测、单元化、限流降级——把"老板最怕的事"变成可控的事
- **识别 AI 智能体平台的共性与差异**：字节扣子 / 腾讯元宝 / 华为盘古 / 百度文心——理解国内 AI 智能体平台的多样性
- **从失败案例中学习**：被废弃的中台、过度设计的湖仓、失败的 AI 项目——少走别人走过的坑
- **追踪海外前沿**：Databricks / Snowflake / Fivetran / dbt——理解湖仓一体与现代化数据栈的产品演进
- **建立面试弹药库**：资深数据架构师面试要的是"你研究过真实的工业级问题"——案例库是面试答题的素材

## 推荐资料

- 各公司技术博客：[阿里云栖社区](https://developer.aliyun.com/)、[字节技术博客](https://tech.bytedance.net/)、[Netflix Tech Blog](https://netflixtechblog.com/)
- 各公司公开演讲：QCon、ArchSummit、KubeCon
- 各公司学术论文：VLDB、SIGMOD、OSDI 顶会

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [后记 · 趋势与思考](../99-outro/) 收尾