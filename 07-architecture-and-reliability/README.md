# Ch7 · 架构与高可用

> **一句话定位**：单元化、多活、大促保障、容量规划——P9 数据架构师的"硬功夫"。

## 基本信息

- **难度**：★★★★★
- **推荐角色**：资深架构师、SRE、稳定性负责人
- **前置章节**：建议先读 [Ch2](../02-storage/) – [Ch6](../06-cross-cutting-engineering/)
- **后续章节**：[Ch8 · 决策与权衡](../08-decision-and-tradeoff/)

## 本章要回答的核心问题

1. **单元化（Cell）架构**如何切分数据域？单元间的数据如何协同？
2. **异地多活**如何设计数据同步与冲突解决？
3. **大促保障**（双 11 / 618 / 春运级流量）的全链路稳定性方案是什么？
4. **容量规划**怎么做？用 ARIMA / Prophet 预测未来 3-12 个月的容量？
5. **性能工程**的关键路径在哪？全链路压测如何设计？
6. **故障注入与混沌工程**如何落地？
7. **容灾**等级（RPO / RTO）如何设计？

## 子主题（占位）

- [ ] **[单元化架构](./cell-based-architecture/README.md)**：业务域切分、单元数据、单元间协同
- [ ] **[异地多活](./multi-region/README.md)**：数据同步（CDC、binlog、双向同步）、冲突解决、流量调度
- [ ] **[大促保障](./large-event-readiness/README.md)**：全链路压测、限流降级、应急预案、值班机制
- [ ] **[容量规划](./capacity-planning/README.md)**：数据增长预测、计算资源预测、存储资源预测
- [ ] **[性能工程](./performance-engineering/README.md)**：关键路径分析、慢查询治理、资源利用率优化
- [ ] **[混沌工程](./chaos-engineering/README.md)**：故障注入、演练平台、恢复预案
- [ ] **[容灾设计](./disaster-recovery/README.md)**：RPO / RTO、同城双活、两地三中心
- [ ] **[数据一致性](./data-consistency/README.md)**：强一致 vs 最终一致、CAP 权衡、Paxos / Raft 工程实践
- [ ] **[灰度与回滚](./gray-and-rollback/README.md)**：数据迁移灰度、模型灰度、查询灰度

> 文件命名建议：`cell-based-architecture.md` / `multi-region.md` / `large-event-readiness.md` / `capacity-planning.md` / `performance-engineering.md` / `chaos-engineering.md` / `disaster-recovery.md` / `data-consistency.md` / `gray-and-rollback.md` / `case-study.md` / `summary.md` / `refs.md`。

## 与 P9 能力的对应

> **P9 必须扛得住"老板最怕的事"——双 11 流量洪峰下的系统稳定性**。

这一章是 P9 区别于 P8 的关键能力。P9 必须能：

- **设计单元化架构**：按业务域切分数据域，确保单单元故障不影响全局
- **设计异地多活方案**：在保证数据一致性的前提下，让多地域同时提供服务
- **主导大促保障**：从预案制定、全链路压测、值班机制到故障复盘
- **设计容量规划体系**：用数据驱动决策，而非"拍脑袋"扩容
- **主导故障复盘**：把每一次故障转化为组织能力

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch8 · 决策与权衡](../08-decision-and-tradeoff/) 继续阅读
