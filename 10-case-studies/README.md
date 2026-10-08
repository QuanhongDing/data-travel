# Ch10 · 案例库

> **一句话定位**：从真实工业级实践中学习——阿里中台演进、双 11 稳定性、字节数据架构、Netflix 数据栈。

## 基本信息

- **难度**：★★★☆☆
- **推荐角色**：全员
- **前置章节**：无（按需查阅）
- **后续章节**：[后记 · 趋势与思考](../99-outro/)

## 为什么需要案例库

> **光讲方法论没有说服力，必须看真实的工业级问题**。

技术书最容易"假大空"——讲一堆方法论，但读者不知道"在真实场景下到底怎么用"。本章是**本书的"实战锚点"**——每个案例都包含：

- **背景与挑战**：业务规模、技术栈、痛点
- **架构演进路径**：从 v1 到 v2 到 v3 的设计取舍
- **关键决策与权衡**：当时为什么这么选
- **踩过的坑与教训**：哪些决策后来被证明是错的
- **可复用的经验**：哪些决策对其他公司也适用

## 子主题（占位）

- [ ] **阿里数据中台演进史**：从烟囱→中台→AI 中台，20 年演进路径
- [ ] **双 11 稳定性保障**：全链路压测、单元化、限流降级、值班机制
- [ ] **字节跳动数据架构**：Lakehouse + 实时 + AI 原生的实践
- [ ] **美团特征平台**：Feature Store 从 0 到 1 的建设
- [ ] **Netflix 数据架构**：Keystone → Metaflow 的演进
- [ ] **Uber 数据架构**：Schemaless → Docstore → 实时分析
- [ ] **Airbnb 数据架构**： Minerva + Dataportal 的元数据治理
- [ ] **从 0 到独角兽的数据栈**：早期、初创期、成长期的演进路径
- [ ] **失败案例**：被废弃的中台、过度设计的湖仓、失败的 AI 项目
- [ ] **海外案例**：Databricks / Snowflake / Fivetran / dbt 的产品演进

> 文件命名建议：`alibaba-data-middle-platform.md` / `double-11-stability.md` / `byte-data-architecture.md` / `meituan-feature-store.md` / `netflix-data-stack.md` / `uber-data-architecture.md` / `airbnb-data-architecture.md` / `startup-evolution.md` / `failure-cases.md` / `overseas-cases.md` / `summary.md` / `refs.md`。

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

## 与 P9 能力的对应

> **P9 面试要的是"你研究过真实的工业级问题"**。

案例库不是"阅读材料"，而是**面试弹药库**。P9 面试必问：

- "请讲一个你设计过的最复杂的系统" → 引用本章的真实案例
- "请讲一个你踩过的最大的坑" → 引用本章的失败案例
- "请讲一个你做过的技术决策" → 引用本章的关键决策案例

## 推荐资料

- 各公司技术博客：[阿里云栖社区](https://developer.aliyun.com/)、[字节技术博客](https://tech.bytedance.net/)、[Netflix Tech Blog](https://netflixtechblog.com/)
- 各公司公开演讲：QCon、ArchSummit、KubeCon
- 各公司学术论文：VLDB、SIGMOD、OSDI 顶会

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [后记 · 趋势与思考](../99-outro/) 收尾
