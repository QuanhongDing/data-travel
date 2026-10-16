# 内容深化进度（Deepening Log）

> 跟踪每一轮「案例细节化 + 原理深讲」改写的章节，记录改写前后的行数、关键案例、深化方式。

## 用户反馈（2026-10-15）

> 「看了一下内容，都是介绍型的，讲的很浅,目标：案例说明很详细，到细节层面，不仅仅是介绍，需要更多是原理讲解」

## 改写原则

每改一个章节，必须满足：
1. **案例必须带具体数字**：年份 / 团队规模 / 数据量 / 前后对比数字 / 失败时长
2. **失败教训必须具体**：不是"遇到过挑战"，而是"X 团队踩了 Y 坑，原因是 Z"
3. **原理必须能算 / 能落地**：不是"它很快"，而是"X 算法的复杂度是 O(n)，实测加速 Y 倍"
4. **代码必须能跑**：表 / SQL / 配置 / 公式，复制即可用

## 进度（按章节）

| commit | 章节 | 类型 | 改写前 → 改写后 | 关键内容 |
|---|---|---|---|---|
| `176815c` | 03-lakehouse § 6 落地实践 | 案例细节化 | 51 → 269 行 | Netflix Iceberg 3 年迁移 / Uber Hudi 诞生 / Iceberg vs Hudi vs Delta 三方对比 / 字节 30 万表 4 步迁移 + 8 项踩坑 + ROI |
| `87cf3ce` | 03-lakehouse § 2 核心原理（深度版） | 原理深讲 | 0 → 280 行（新文件） | Manifest 3 层结构 + lower_bounds/upper_bounds / Hidden Partition 算法伪码 / Z-Order 位交错图解 / Compaction 两策略 / Snapshot Isolation 形式化证明 / MVCC Time Travel / Catalog 选型表 / 性能模型公式 + 公开 benchmark 33x/20x/∞ |
| `7d9c025` | 10-stream-batch-unified § 6 落地实践 | 案例细节化 | 85 → 354 行 | LinkedIn 6 年 Lambda→Kappa / Uber AthenaX 3 年 / Netflix Keystone 5 年 / 字节 3 年 Flink+Iceberg+Paimon + 8 项踩坑（4 家经验） + ROI 500x 一致性 |

## 进行中

（暂无）

## 待深化优先级

按"读者路径 A 必读"+"案例含金量"+"现状最浅"三个维度排序：

### 高优先级（路径 A 核心 + 现状最浅）

- [ ] Ch11/04-observability § 6（~56 行 — 预计 Netflix SRE / Google SRE / Uber Observability）
- [ ] Ch12/08-data-consistency § 6（~46 行 — Spanner / OceanBase / 阿里 DTX）
- [ ] Ch13/05-tech-strategy § 6（~35 行 — 3-5 年路线图案例）
- [ ] Ch11/02-data-security § 6（~30 行 — 金融/医疗/电商安全案例）
- [ ] Ch03/04-streaming-store § 6（~38 行 — Kafka 大规模案例）

### 中优先级

- [ ] Ch03/12-scheduler § 6（~49 行 — Airflow / DolphinScheduler / Argo）
- [ ] Ch11/03-data-cost-finops § 6（~36 行 — FinOps 案例）
- [ ] Ch14/06-postmortem-culture § 6（~50 行 — 故障案例）

### 低优先级（已有大量案例，现状较好）

- [ ] Ch15/15-case-studies 各文件（已经很多公司案例）
- [ ] Ch03/03-lakehouse § 3 / § 4（设计模式 / 工程实现）

## 改写模板（每节）

```markdown
## § X. 主题

### X.1 案例 1：公司名（年份）
- **背景（Why）**：原系统的痛点（具体数字）
- **触发点（What）**：什么事件让团队决定改变
- **详细做法（How）**：3-5 步骤，每步配代码 / 配置 / 工具
- **具体数字（How much）**：团队规模 / 数据量 / 前后对比 / 业务价值
- **失败教训（What didn't work）**：3-5 个具体踩坑

### X.2 案例 2：...

### X.N 提炼
- 三阶段路径（0→1 / 1→10 / 10→100）
- 8 项踩坑对照表（X 家公司经验对比）
- ROI 表（真实前后数字）

## 每轮时间预算

5 分钟 tick 内：
- 选 1 个章节的 § 6（落地实践）做深度改写
- 目标：从 ~80 行扩到 ~300-400 行（4-5 倍）
- 写完立即 commit + push
- 进度记录到此 log
