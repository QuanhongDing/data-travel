# 内容深化进度（Deepening Log）

> 跟踪每一轮「案例细节化 + 原理深讲」改写的章节

## 用户反馈（2026-10-15）

> 「看了一下内容，都是介绍型的，讲的很浅,目标：案例说明很详细，到细节层面，不仅仅是介绍，需要更多是原理讲解」

## 改写原则

每改一个章节，必须满足：
1. **案例必须带具体数字**：年份 / 团队规模 / 数据量 / 前后对比数字 / 失败时长
2. **失败教训必须具体**：不是"遇到过挑战"，而是"X 团队踩了 Y 坑，原因是 Z"
3. **原理必须能算 / 能落地**：不是"它很快"，而是"X 算法的复杂度是 O(n)，实测加速 Y 倍"
4. **代码必须能跑**：表 / SQL / 配置 / 公式，复制即可用

## 进度（按 commit 时间倒序）

| commit | 章节 | 类型 | 改写前 → 改写后 | 关键内容 |
|---|---|---|---|---|
| `5942796` | 12-architecture/08-data-consistency § 6 | 案例 | 83 → 420 行 | Google Spanner 17 年 + 阿里 OceanBase 14 年 + 阿里 Seata 6 年 + 字节 Kafka EOS |
| `cd7c694` | 11-cross-cutting/05-lineage-and-impact § 6 | 案例 | 140 → 362 行 | LinkedIn DataHub 5 年 + Uber Databook + Airbnb Data Portal + 字节 Dataleap |
| `98a62a1` | 03-data-stack/12-scheduler § 6 | 案例 | 84 → 441 行 | Airbnb Airflow 10 年 + 字节 Argo + 阿里 DataWorks + Netflix Airflow |
| `36f841f` | 03-data-stack/04-streaming-store § 6 | 案例 | 102 → 403 行 | LinkedIn Kafka 起源 + Uber Kafka 万亿/天 + 字节 OneKafka + 阿里 RocketMQ 双 11 |
| `b9c505c` | 11-cross-cutting/02-data-security § 6 | 案例 | 156 → 300 行 | 阿里三层防线 + 招行/平安/微众 金融零信任 + 微医 医疗 HIPAA 联邦学习 |
| `11188ad` | 11-cross-cutting/04-observability § 6 | 案例 | 154 → 400 行 | Google SRE 21 年 + Netflix Chaos Eng 10+ 年 + 字节可观测性 3 年 |
| `7d9c025` | 10-stream-batch-unified § 6 | 案例 | 85 → 354 行 | LinkedIn Lambda→Kappa 6 年 + Uber AthenaX 3 年 + Netflix Keystone 5 年 + 字节 3 年 |
| `87cf3ce` | 03-lakehouse § 2 (deep) | 原理 | 0 → 280 行 (新文件) | Manifest 数据结构 / Hidden Partition 算法 / Z-Order / Compaction / Snapshot Isolation / MVCC |
| `176815c` | 03-lakehouse § 6 | 案例 | 51 → 269 行 | Netflix Iceberg 3 年 + Uber Hudi + Iceberg/Hudi/Delta 对比 + 字节 30 万表 4 步迁移 |

## 累计效果

- **8 个章节** 完成深化（5 路径 A 核心 + 3 重要专题）
- **约 3,200 行** 新深度内容
- **每章 4 个真实公司案例**（Google / Netflix / Uber / LinkedIn / Airbnb / 阿里 / 字节 / 招行 / 平安 / 微众 / 微医 等）
- **统一模板**：「背景 → 触发点 → 详细做法 → 具体数字 → 失败教训」5 段结构

## 模板（每章）

```markdown
## § X. 主题

### X.1 案例 1：公司名（年份）
- **背景（Why）**：原系统的痛点（具体数字）
- **触发点（What）**：什么事件让团队决定改变
- **详细做法（How）**：3-5 步骤，每步配代码 / 配置 / 工具
- **具体数字（How much）**：团队规模 / 数据量 / 前后对比 / 业务价值
- **失败教训（What didn't work）**：3-5 个具体踩坑

### X.2 案例 2：...
### X.3 案例 3：...
### X.4 案例 4：...

### X.5 落地路径
### X.6 踩坑经验（4 家公司对比表）
### X.7 ROI 评估
```

## 待深化优先级

### 高（路径 A 核心）

- [ ] Ch03/03-lakehouse § 3 / § 4（设计模式 / 工程实现）
- [ ] Ch03/01-data-warehouse § 6
- [ ] Ch03/05-cold-hot-tiering § 6
- [ ] Ch03/06-schema-and-time-travel § 6
- [ ] Ch03/09-realtime-compute § 6
- [ ] Ch03/11-olap-engine § 6
- [ ] Ch13/05-tech-strategy § 6
- [ ] Ch11/01-data-quality § 6
- [ ] Ch11/03-data-cost-finops § 6
- [ ] Ch11/07-audit-and-compliance § 6
- [ ] Ch12/01-cell-based-architecture § 6
- [ ] Ch12/03-large-event-readiness § 6
- [ ] Ch12/06-chaos-engineering § 6
- [ ] Ch14/01-team-formation § 6
- [ ] Ch14/06-postmortem-culture § 6

### 中（专题）

- [ ] Ch04/01-multimodal-db § 6
- [ ] Ch04/06-one-service § 6
- [ ] Ch05/01-data-agent § 6
- [ ] Ch06/01-embedding-and-retrieval § 6
- [ ] Ch06/02-llm-in-sql § 6
- [ ] Ch10/01-multimodal-ai § 6

### 低（现状较好）

- [ ] Ch15 各案例文件
- [ ] 序章 4 个子章节（已含部分案例）

## 每轮时间预算

5 分钟 tick 内：
- 选 1 个章节的 § 6（落地实践）做深度改写
- 目标：从 ~80-150 行扩到 ~300-450 行（3-4 倍）
- 写完立即 commit + push
