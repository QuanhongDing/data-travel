> 本文件是 **03-data-cost-finops.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](03-data-cost-finops.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：标签驱动的成本归因（Tag-Driven Allocation）**

```
资源标签：
  - team: 推荐团队
  - project: 商品推荐
  - cost_center: 推荐成本中心
  - environment: prod
  - owner: alice@example.com

成本流向：
  存储桶 → 标签 → 团队账单
  计算集群 → 标签 → 项目账单
  数仓查询 → 用户 → 团队账单
```

落地工具：**AWS Cost Explorer、Azure Cost Management、阿里云费用中心、自研 FinOps 平台**。

**模式 2：分层存储架构（Tiered Storage）**

```
热数据（最近 7 天）    → SSD / NVMe（高 IOPS，高 $/GB）
温数据（8-30 天）     → HDD / 标准 S3（中等 $/GB）
冷数据（31-180 天）   → 低频 S3 / IA（低 $/GB）
归档数据（> 180 天）  → Glacier / 归档存储（极低 $/GB）
```

落地工具：**S3 + Lifecycle、阿里云 OSS + 归档、Iceberg / Delta Lake 分层**。

**模式 3：弹性计算（Elastic Compute）**

```
业务负载监控 → 触发器 → 自动伸缩

策略 1：定时伸缩（每天 22:00 缩到 0.5x，早上 9:00 扩到 2x）
策略 2：指标伸缩（CPU > 70% 扩容，CPU < 30% 缩容）
策略 3：混合策略
```

落地工具：**Karpenter（K8s）、YARN Capacity Scheduler、AWS ASG、阿里云 ESS**。

**模式 4：Spot / RI / Savings Plans 组合采购**

```
稳定基线负载 → Reserved Instance（1-3 年承诺）
弹性负载     → Spot Instance（便宜 60-90%）
突发负载     → On-Demand（按需，灵活但贵）
```

落地工具：**AWS Compute Savings Plans、Azure Savings Plan、阿里云 Savings Plan**。

**模式 5：Showback / Chargeback 文化**

```
月度账单 → 团队可视化 → Showback（展示不强制）

高级阶段：
月度账单 → 自动分摊 → Chargeback（强制扣部门预算）
```

落地工具：**Apptio、Cloudability、Vantage、自研 FinOps 平台**。

### 3.2 适用场景决策表

| 场景 | 推荐模式 | 理由 |
| --- | --- | --- |
| **多团队共享云平台** | 模式 1（标签）+ 模式 5（Showback） | 成本透明 + 团队激励 |
| **数据量大、增长快** | 模式 2（分层存储）+ 模式 4（采购组合） | 存储占比高，分层降本 |
| **周期性业务（电商大促）** | 模式 3（弹性）+ 模式 4（Spot） | 峰谷明显，弹性降本 |
| **AI / 训练任务** | 模式 4（Spot）+ 模式 3（弹性） | GPU 贵，弹性重要 |
| **早期 0→1 创业** | 模式 1（标签）+ On-Demand | 灵活优先，避免承诺 |
| **多云架构** | 模式 1（标签）+ 模式 5 | 跨云归一 |

### 3.3 反模式与陷阱

1. **"为了降本降 SLA"**：盲目压缩存储 / 缩容，导致查询变慢、SLA 违约。**正确做法**：降本前先定 SLA 边界。
2. **"只盯存储，忽视查询"**：存储只占 30%，查询占 25-40%。**正确做法**：全栈优化。
3. **"全员共享大集群，无归因"**：每个团队都觉得自己"用得不多"。**正确做法**：标签 + Showback。
4. **"用 Spot 做基线负载"**：Spot 可能被回收，导致任务失败。**正确做法**：Spot 做可重试任务，基线用 RI / On-Demand。
5. **"频繁扩容 / 缩容"**：抖动导致 SLA 违约、成本反升。**正确做法**：弹性伸缩有"缓冲区" + 冷却时间。
6. **"忽略 GPU 成本"**：训练任务结束 GPU 不释放，月耗百万。**正确做法**：训练任务必须释放资源 + 自动伸缩。

---
