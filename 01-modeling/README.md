# Ch1 · 建模方法论

> **一句话定位**：从业务过程到数据模型，P9 数据架构师的第一道分水岭。

## 基本信息

- **难度**：★★★☆☆
- **推荐角色**：数据架构师、数据建模师、数仓开发
- **前置章节**：无（建议先读 [序章](../00-introduction/)）
- **后续章节**：[Ch2 · 存储范式](../02-storage/)

## 本章要回答的核心问题

1. **业务过程如何识别？** 业务架构→数据架构的映射方法是什么？
2. **建模方法怎么选？** 维度建模（Kimball）、Data Vault、Anchor Modeling 各自适用什么场景？
3. **阿里中台 OneData 思想是什么？** 业务过程→指标体系→数据模型怎么打通？
4. **OneID 主数据怎么做？** 跨域用户打通、ID-Mapping 算法有哪些坑？
5. **指标体系如何设计？** 原子指标 / 派生指标 / 业务修饰的边界在哪？
6. **如何避免"模型失控"？** 命名规范、版本管理、Owner 制度怎么落地？

## 子主题（占位）

- [ ] **[业务过程建模](./business-process-modeling/README.md)**：业务架构→数据架构的映射方法（事件→事实→维度）
- [ ] **[维度建模（Kimball）](./dimensional-modeling/README.md)**：事实表、维度表、星型 / 雪花 / 星座模型
- [ ] **[Data Vault](./data-vault/README.md)**：Hub-Link-Satellite 三件套，敏捷数仓的另一种选择
- [ ] **[Anchor Modeling](./anchor-modeling/README.md)**：高度可演化的第 6 范式
- [ ] **[OneData 思想](./one-data/README.md)**：阿里中台统一数据标准与模型的方法论
- [ ] **[OneID 主数据](./one-id/README.md)**：跨域用户打通、ID-Mapping 算法（设备 ID、手机号、身份证等）
- [ ] **[指标体系设计](./metric-system/README.md)**：原子指标 + 时间周期 + 业务修饰 = 派生指标
- [ ] **[数据模型管理](./model-management/README.md)**：命名规范、版本管理、Owner 制度、模型评审
- [ ] **[DataWorks / 阿里中台工具链实战](./hands-on/README.md)**

> 文件命名建议（不强制）：`business-process-modeling.md` / `dimensional-modeling.md` / `data-vault.md` / `one-data.md` / `one-id.md` / `metric-system.md` / `model-management.md` / `hands-on.md` / `summary.md` / `refs.md`。作者可按需合并、拆分或重命名。

## 为什么这一章放在最前

> **P7 会"建表"，P8 会"建模型"，P9 会"建体系"**。

很多数据工程师以为建模就是画 ER 图、写 DDL。**真正的建模是从业务出发，识别核心业务过程、定义统一指标口径、确保全公司用同一套"业务语言"看数据**。这一章是 P8 → P9 晋升答辩中**最容易被追问**的领域，也是**最暴露水平差距**的领域。

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch2 · 存储范式](../02-storage/) 继续阅读
