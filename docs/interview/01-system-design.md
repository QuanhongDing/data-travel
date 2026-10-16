# 系统设计（System Design）

> **核心定位**：在白板上设计"实时数据管道 / 湖仓一体平台 / 指标平台 / DataAgent / Feature Store"，是数据架构师面试的**核心题型**——直接对应日常工作决策。

## 答题框架（通用 5 段式）

每道系统设计题按以下 5 段作答：

1. **题目（5 行内澄清）**：用 1-2 句复述需求 + 列出 3-5 个关键约束（QPS / 数据量 / 一致性 / SLA）。
2. **考察点**：面试官在考察什么？通常是「约束拆解 + 架构分层 + 关键技术选型 + 风险点」四件套。
3. **参考答案框架**（**4 步必走**）：
   - **Step 1 约束拆解**：把 QPS / 数据量 / SLA 转成可量化的指标。例如「日均 1000 亿事件，峰值 QPS 1 亿，p99 < 5s，可用性 99.95%」。
   - **Step 2 架构分层**：画出**数据流向图**（采集 → 接入 → 存储 → 计算 → 服务），每一层给出选型理由。
   - **Step 3 关键模块深挖**：面试官会挑 1-2 层追问深挖，**准备 2-3 个最易被追的模块**（如「湖仓表格式选型」「指标一致性」「向量检索召回率」）。
   - **Step 4 风险 + 演进**：列出 3 个最大风险（小文件 / 倾斜 / 一致性）和 2 步演进路径（湖仓一体 → AI 原生）。
4. **常见陷阱（4 大）**：
   - ❌ 一上来就堆名词（Flink + Iceberg + Doris + Milvus），不说为什么
   - ❌ 忽略约束（题目说日均 100 亿，结果按 1 万亿设计）
   - ❌ 不画图，全靠嘴说
   - ❌ 没有量化（只说「高吞吐」「低延迟」，不说具体数字）
5. **追问预测**（3 个高频）：「数据一致性怎么保证？」「如何降本？」「如果流量涨 10 倍怎么办？」

## 5 个高频系统设计题（必准备）

| 题目 | 关键模块 | 推荐参考 |
| --- | --- | --- |
| **实时数据管道** | Kafka / Flink / Iceberg 选型 + 状态后端 + 端到端 EOS | [Ch03 实时计算](../../03-data-stack/09-realtime-compute/09-realtime-compute.md) / [Ch03 流批一体](../../03-data-stack/10-stream-batch-unified/10-stream-batch-unified.md) |
| **湖仓一体平台** | 三大表格式选型 + 元数据服务 + 存算分离 | [Ch03 湖仓一体](../../03-data-stack/03-lakehouse/03-lakehouse.md) / [Ch03 架构决策](../../03-data-stack/07-architecture-decisions/07-architecture-decisions.md) |
| **指标平台** | 指标定义 / 口径治理 / 实时计算 / 服务层 | [Ch11 数据资产化](../../11-cross-cutting/06-data-assetization/06-data-assetization.md) / [Ch09 决策智能](../../09-data-intelligence-product/02-decision-intelligence/02-decision-intelligence.md) |
| **DataAgent 平台** | MCP / Function Calling / 记忆 / 工具编排 / 沙箱 | [Ch05 智能体平台](../../05-agent-platform/01-data-agent/01-data-agent.md) / [Ch07 自进化](../../07-agent-evolution/) |
| **Feature Store** | 线上线下一致性 / Point-in-Time / 模型版本 / 实时特征 | [Ch02 特征平台](../../02-data-science/01-feature-store/01-feature-store.md) |

## 工业案例库（推荐主动引用）

- **Netflix 实时数据管道**（Keystone / Flink / Iceberg 迁移）
- **Uber Hudi 起源**（增量处理 vs 全量重算）
- **阿里 OneData / 飞鸽 / 银翼**（数据中台 + 指标平台）
- **字节 DataFinder**（抖音推荐实时特征）
- **Databricks Lakehouse Platform**（Delta Lake / Unity Catalog / Photon）
- **Snowflake Cortex**（AI 原生云数仓）
- **招行 / 微众 / 平安**（金融级实时风控 / 反欺诈）

每题答题时**主动引用 2-3 个具体公司案例**（说人名 + 产品 + 做法 + 数字），是高分回答的特征。

## 参考资料

- 《System Design Interview》第 1-2 卷（Alex Xu）—— 通用系统设计方法
- 《数据密集型应用系统设计》（DDIA, Martin Kleppmann）—— 数据系统圣经
- 《Fundamentals of Data Engineering》（Joe Reis / Matt Housley）—— 数据工程方法论
- [Ch13 决策与权衡](../../13-decision/) —— 选型决策框架（ADR / tradeoff）
- [Ch12 架构与高可用](../../12-architecture/) —— 实际工程约束
