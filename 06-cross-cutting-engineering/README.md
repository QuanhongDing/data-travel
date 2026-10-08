# Ch6 · 横切工程

> **一句话定位**：数据质量、安全、成本、可观测——四类横切工程能力，决定数据平台的"工程成熟度"。

## 基本信息

- **难度**：★★★★☆
- **推荐角色**：平台架构师、数据治理、SRE
- **前置章节**：建议先读 [Ch2](../02-storage/) – [Ch4](../04-data-mesh-and-middleware/) 任一
- **后续章节**：[Ch7 · 架构与高可用](../07-architecture-and-reliability/)

## 本章要回答的核心问题

1. **数据质量**如何度量？DQC、监控告警、SLA 怎么设计？
2. **数据安全**如何分层？分类分级、脱敏、加密、审计的工程落地
3. **数据成本**如何治理？存储、计算、查询的成本结构与优化手段
4. **数据可观测性**和系统可观测性有什么异同？数据血缘如何成为可观测的一部分？
5. **数据血缘**如何采集、存储、查询？影响分析怎么做？
6. **FinOps** 在数据领域如何落地？

## 子主题（占位）

- [ ] **[数据质量](./data-quality/README.md)**：DQC（Data Quality Center）、监控告警、SLA 体系、异常检测
- [ ] **[数据安全](./data-security/README.md)**：分类分级、脱敏、加密、访问控制、审计、GDPR / 个保法合规
- [ ] **[数据成本与 FinOps](./data-cost-finops/README.md)**：存储优化（冷热分层、压缩）、计算优化（小文件、Compaction）、查询优化、资源利用率
- [ ] **[数据可观测性](./observability/README.md)**：监控指标（新鲜度、完整性、准确性）、告警分级、链路追踪
- [ ] **[数据血缘](./lineage-and-impact/README.md)**：元数据采集、血缘图谱、影响分析、根因分析
- [ ] **[数据资产化](./data-assetization/README.md)**：数据盘点、估值、ROI 评估
- [ ] **[审计与合规](./audit-and-compliance/README.md)**：操作审计、访问审计、监管报送
- [ ] **[隐私计算](./privacy-computing/README.md)**：联邦学习、安全多方计算、可信执行环境

> 文件命名建议：`data-quality.md` / `data-security.md` / `data-cost-finops.md` / `observability.md` / `lineage-and-impact.md` / `data-assetization.md` / `audit-and-compliance.md` / `privacy-computing.md` / `hands-on.md` / `summary.md` / `refs.md`。

## 与 数据架构师能力的对应

> **数据架构师 不只让系统跑起来，还要让系统"长期、可靠、可控"地跑**。

横切工程是"看不见的竞争力"。数据架构师 必须能：

- **设计数据 SLA 体系**：与业务方谈 SLA 而非被动响应故障
- **设计数据成本治理方案**：在保证 SLA 的前提下，把数据成本降低 30-50%
- **设计数据安全合规体系**：分类分级、权限矩阵、审计追溯，满足 GDPR / 个保法
- **设计数据可观测性平台**：把数据血缘从"展示工具"升级为"故障定位工具"
- **推动数据资产化**：让数据从"成本中心"变成"价值中心"

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch7 · 架构与高可用](../07-architecture-and-reliability/) 继续阅读
