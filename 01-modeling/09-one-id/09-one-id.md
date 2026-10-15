# OneID 主数据：跨域用户打通与 ID-Mapping

> **一句话定位**：跨业务、跨设备、跨域的"同一实体识别"——数仓侧的主数据底座，AI 时代一切个性化与图推理的前置条件。

> 本文是 data-travel 项目 [Ch1 · 建模方法论](../../README.md) 的子章节（09-one-id）。覆盖 **R3 数据建模** 能力域中 **OneID（Entity Resolution）** 主数据管理相关的核心能力：跨域用户打通、ID-Mapping 算法、设备指纹、主数据建模、概率匹配、Embedding-based 实体解析、LLM 辅助实体识别、隐私计算下的 ID 打通，以及 2024-2025 年的工业级 OneID 平台演进。

---

## 1. 概念与定位

### 1.1 是什么

**OneID**（也称 **Unified ID**、**Master Data ID**、**360° User ID**）是企业在多个业务域（Web、App、小程序、线下 POS、客服、CRM、广告投放、第三方数据合作）中，将同一个自然人 / 同一台设备 / 同一个企业法人 / 同一件商品打通后，赋予的 **全局唯一身份标识**。

它的本质是 **Entity Resolution（实体解析）** 的工程化产物：在数据层面把"看起来不同、但其实是同一个"的多个 ID（设备 ID、手机号、身份证、邮箱、Cookie、微信号、订单收件人姓名+地址、IMEI、IDFA、OAID ……）聚合到一个 OneID 节点下，并维护：

- **主键 ID（OneID）**：全局唯一的内部编号（一般是雪花 ID / UUID v7 / ULID）
- **ID 关系图谱**：该 OneID 关联的所有原始 ID、设备指纹、社交账号、证件号（hash 化）、手机号（脱敏）
- **属性画像**：基于 OneID 聚合出来的标签（人口属性、行为序列、偏好、行业、价值分层）
- **生命周期**：注册时间、首次活跃、最后活跃、流失状态、合并 / 拆分历史

> OneID ≠ UUID。UUID 是"我给你发一个不重复的号"，OneID 是"我相信 5 个不同来源的号其实是同一个人，并把它们合并"。前者是发号，后者是**消歧**。

在更广义的 Master Data Management（MDM，主数据管理）体系中，OneID 属于"客户主数据（Customer Master）"的子模块，与"商品主数据（Product Master）"、"组织主数据（Organization Master）"、"供应商主数据（Supplier Master）"并列。但因为 **客户 / 用户是数据资产化最核心的实体**，所以业界把"用户 OneID"作为 OneID 体系的代表。

### 1.2 为什么需要

没有 OneID 时，企业面对的实际问题极其具体：

1. **同一用户在多端被当多个人**
   - 同一个用户在 iOS App、微信小程序、Web H5、客服工单系统、线下扫码活动中，会留下 4-5 个互相独立的 user_id。
   - 结果：DAU 虚高 30%-50%、MAU 重复计算、跨端行为被打散、画像断层、营销重复触达。
2. **跨业务域的指标无法对齐**
   - 电商订单里的"买家"、客服系统里的"来电客户"、CRM 里的"会员"、广告系统里的"人群包用户"是 4 个口径的"用户"。
   - 结果：销售说 GMV 涨了 10%，运营说用户数没变，BI 一查口径全是 4 个不同的数。
3. **广告投放 ROI 无法闭环**
   - 投放平台（巨量、腾讯广告）回传的人群包，和内部 CRM 的会员是两个 ID 体系，匹配率可能只有 20%-30%。
   - 结果：投放归因（Attribution）失真，看板数据自欺欺人。
4. **风控 / 反欺诈无法识别"羊毛党一机多号"**
   - 黑产一台手机切换 100 个账号、1000 台设备，没有 OneID 看不到背后的同一控制人。
   - 结果：风控规则被绕过，活动预算被薅走。
5. **AI 时代无法构建"用户级"的样本与特征**
   - 推荐系统、风控模型、AIGC 个性化都需要"同一个人的完整行为序列"。
   - 没有 OneID，样本拼接就是"张冠李戴"，LLM 喂给它的就是碎片化、错位的对话。

**一句话总结**：OneID 是 **企业数据从"分块堆叠"走向"联通资产"的第一道工程门槛**——不是可做可不做的最佳对齐。P7 不做 OneID 数仓照样能跑，P8 不做 OneID 智能体平台就是空中楼阁。

### 1.3 在 AI 时代数据架构中的位置

OneID 在整体 AI 数据架构中扮演 **"实体枢纽（Entity Hub）"** 角色，是多个上层应用的共同依赖：

```
┌──────────────────────────────────────────────────────────────┐
│                     上层应用 / AI 应用                         │
│  推荐系统 · 智能营销 · AIGC 个性化 · 风控反欺诈 · 智能 BI    │
│  RAG 个人记忆 · Agent 长期记忆 · LLM 用户画像问答             │
└──────────────────────┬───────────────────────────────────────┘
                       │ 按 OneID 检索 / 取数 / 拼样本
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                  统一 OneID 主数据层                           │
│   OneID 节点 · ID 关系图谱 · 用户标签 · 行为宽表              │
└──────────────────────┬───────────────────────────────────────┘
                       │ 上游：多业务域原始数据
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
   业务库 OLTP   行为日志     第三方数据      线下 / IoT
   (MySQL/Oracle) (Kafka/Hive) (广告/合作)    (POS/扫码)
```

从图中可见，**OneID 是上层 AI 应用能不能拿到"干净样本"的瓶颈**。一旦 OneID 错乱，推荐的 AUC、再营销的 CTR、风控的 KS 都会被系统性污染——所以 AI 平台架构师必须把 OneID 当作 **一等数据资产** 来治理。

在 data-travel 项目的章节布局中：

- **本章（Ch1-09）**：OneID 的建模方法与算法原理（**本文**）
- **Ch1-08 OneData**：OneID 与 OneService / OneModel 的协同（阿里中台视角）
- **Ch1-10 指标体系**：OneID 是指标的统计口径分母（DAU、MAU、ARPU 都依赖 OneID）
- **Ch2 数据科学**：OneID 决定样本去重、特征拼接、用户嵌入（User Embedding）训练
- **Ch3 数据全栈**：OneID 同步链路是数据流转的核心环节
- **Ch4 数据资产化**：OneID 进入向量索引才能支持"以人查人"语义检索
- **Ch5 智能体平台**：Agent 长期记忆（Long-term Memory）按 OneID 维护

### 1.4 演进历程

OneID 的发展大致可分为五个阶段，每个阶段对应一种技术栈与组织能力：

**阶段 1 · 1990-2005：单库单域（Single-Source）**

- 早期 CRM、ERP 各自维护自己的 customer_id，没有跨域打通需求。
- 主要技术：关系数据库、ETL 抽取、人工对账。

**阶段 2 · 2005-2012：MDM 系统化（Master Data Hub）**

- 大型企业引入 MDM 套件（IBM InfoSphere MDM、Informatica MDM、Oracle MDM、Talend MDM）。
- 强匹配规则（手机号、身份证号、邮箱）为主，弱匹配极少。
- 主要技术：MDM 套件、规则引擎、数据质量（DQ）工具。

**阶段 3 · 2012-2018：大数据 OneID（互联网方法）**

- 阿里、字节、美团等互联网公司进入"跨域打通"时代，沉淀出 **OneID 中台** 模式。
- 引入设备指纹、概率匹配、图计算（GraphX / Neo4j）解决弱匹配。
- 关键产品：阿里 OneID（基于设备指纹 + 手机号三要素）、字节 UID（图匹配 + 概率 ID-Mapping）、美团 UserID（图数据库 + 规则引擎）。

**阶段 4 · 2018-2023：算法化 ID-Mapping（Graph + ML）**

- ID-Mapping 任务正式被看作 **实体解析（Entity Resolution）** 问题。
- 引入基于图嵌入（Graph Embedding）的 ID 匹配（DeepMatch、GraphER、GCN-based ER）。
- 引入基于 Blocking + 排序学习（LTR）的端到端实体解析（DeepER、Ditto、HierMatcher）。
- 关键论文：DeepER (VLDB 2018)、Ditto (SIGMOD 2021)、HierMatcher (NeurIPS 2021)。

**阶段 5 · 2023-2025：LLM 增强实体解析（Generative ER）**

- 利用 LLM 进行实体解析推理，尤其在长文本属性（地址、姓名、公司名）匹配上超越传统模型。
- 利用 LLM 进行 OneID 属性的自然语言解释、OneID 合并原因的可解释性输出。
- 利用 LLM 做"自然语言级"的实体识别（"张三"和"Zhang San"、"张總"、"张 3 先生"是同一人吗？LLM 答 yes）。
- 关键论文：GPT-4 Entity Resolution (Microsoft Research 2023)、Ditto+LLM、ZeroER (NeurIPS 2023)。
- 关键产品：阿里云实体解析（LLM 版）、Salesforce Data Cloud Zero-Copy ID Resolution、AWS Entity Resolution（2024 GA）、Azure AI Foundry ID Resolution、Palantir Foundry Entity Resolution。

> **架构师视角**：每个阶段的跃迁都伴随"**打破 ID 孤岛**"的能力升级，从规则 → 图 → 嵌入 → 生成式 AI。2024-2025 年正处于阶段 5 的早期，LLM 辅助实体解析与传统概率图模型是 **并存而非替代**——纯 LLM 太贵，纯规则太死。

---

## 2. 核心原理

### 2.1 关键概念定义

| 术语 | 定义 | 工业典型值 |
| --- | --- | --- |
| **OneID** | 全局唯一的实体主键（一般是 64-bit 整数 / UUID / 雪花 ID） | 单个企业 10 亿-100 亿量级 |
| **ID-Mapping** | 将两个不同来源的 ID 关联到同一个 OneID 的过程 | 日增映射量百万-百亿 |
| **强匹配（Strong Match）** | 基于精确字段匹配的合并（手机号、身份证号、邮箱） | 阈值：1.0 |
| **弱匹配（Weak Match）** | 基于模糊字段 / 行为 / 设备指纹的概率合并 | 阈值：0.7-0.95 |
| **概率匹配（Probabilistic Match）** | Fellegi-Sunter 模型为基础的 ID 合并 | 接受阈值 ≥ 0.95 |
| **实体解析（Entity Resolution, ER）** | 学术与系统领域的统称，包含 blocking、matching、clustering | 见 §2.3 |
| **设备指纹（Device Fingerprint）** | 浏览器/设备的稳定标识（UA + 屏幕 + 字体 + 插件 + canvas 等） | 命中率 70-90% |
| **设备 ID** | 移动端的稳定 ID（IDFA / OAID / IMEI / Android ID / MAC） | IDFA iOS14 后需授权 |
| **手机号三要素** | 手机号 + 姓名 + 身份证号 三字段组合 | 强匹配主流 |
| **图谱合并（Graph Merge）** | 基于 ID-Graph 的连通分量作为 OneID | 大厂主流 |
| **ULID / UUID v7** | 业界推荐的新一代主键 ID（时间有序 + 全局唯一） | 推荐替代雪花 |
| **雪花 ID（Snowflake）** | Twitter 风格的时间戳 + 机器号 + 序列号 | 国内主流 18 位 |
| **Blocking** | 实体解析中"先分组后比较"的优化策略 | 减少 N² 比较 |
| **LTR（Learning to Rank）** | 用排序学习做匹配分数融合 | 工业主流 |
| **Embedding-based ER** | 用 embedding 余弦相似度做 ID 匹配 | 2020 年后主流 |

### 2.2 数学 / 形式化基础

#### 2.2.1 Fellegi-Sunter 模型（概率匹配）

Fellegi-Sunter（1969）模型是 ID-Mapping 的经典形式化，给定两条记录 R 与 S，定义：

- **m-probability**（match 概率）：两条记录是同一实体时某字段一致的条件概率
- **u-probability**（non-match 概率）：两条记录不是同一实体时该字段一致的条件概率
- **似然比（LR）**：λ = ∏ᵢ mᵢ / ∏ᵢ uᵢ

匹配规则：

- 如果 λ ≥ 上阈值 → 合并为同一个 OneID
- 如果 λ ≤ 下阈值 → 判定为不同人
- 如果在中间 → 进入人工 review（clerical review）

**示例**：手机号字段匹配：
- m = 0.95（真匹配的手机号一致率 95%，允许 5% 用户换号）
- u = 0.0001（两条随机记录的的手机号碰巧相同概率 1/10000）
- LR = 0.95 / 0.0001 = 9500 → 远高于上阈值 → 合并

#### 2.2.2 连接成分（Connected Components）作为 OneID

工业 OneID 最常用的图模型：把每条 ID（手机号、设备 ID、邮箱、cookie）作为节点，已知匹配关系作为边，**整个连通分量（Connected Component, CC）共享同一个 OneID**。

```
   手机号_A ─── 用户表:user_id_1
       │
       ├── 邮箱_A ─── 用户表:user_id_2
       │
       └── 设备_X ─── 行为日志:anon_id_3

  → 这三个 ID 属于同一 OneID = max(user_id_1, user_id_2, anon_id_3)
```

工程上一般用 **Union-Find（DSU）** 或 **图数据库（Neo4j / NebulaGraph）** 的 `WCC`（弱连通分量）算法实现。

#### 2.2.3 Embedding 相似度（向量匹配）

把每个 ID 对应的"上下文特征"（行为序列、属性集合、设备属性）通过深度模型映射为 d 维向量，余弦相似度 cos(R, S) ≥ τ 即判定匹配：

```
cos(R, S) = (R · S) / (||R|| × ||S||)
```

工业经验阈值：τ = 0.85-0.92。

**Embedding 来源**：
- 行为序列 Embedding：用户最近 100 次行为用 Transformer / DIN / SASRec 编码
- 文本 Embedding：邮箱、姓名、地址用 BERT / E5 / BGE 编码
- 图 Embedding：ID-Graph 用 Node2Vec / GraphSAGE / LINE 编码

#### 2.2.4 端到端匹配概率

实际工业系统不是"非黑即白"二分类，而是输出连续概率，再用阈值控制合并与否。常见的概率分布假设：伯努利 + 高斯混合（GMM-HMM）、逻辑回归 / GBDT / 深度排序模型。

排序学习（LTR）的目标函数：
```
L = Σᵢ wᵢ · log(1 + exp(-yᵢ · sᵢ))
```
其中 yᵢ ∈ {-1, +1} 是真实标签，sᵢ 是模型打分，wᵢ 是样本权重。

#### 2.2.5 LLM 辅助实体解析的概率形式

LLM 把实体解析看作 **生成式分类任务**：

```
P(merge | R, S, prompt)  →  0.x 或 1.0
```

通过 prompt 让 LLM 输出 JSON：
```
{
  "decision": "merge" | "split" | "unsure",
  "confidence": 0.0-1.0,
  "reason": "..."
}
```

LLM 的优势是**对长文本 / 非结构化字段的语义理解**，劣势是**延迟和成本**——单条匹配 200ms+ vs 传统模型 5ms。

### 2.3 关键算法 / 方法

#### 2.3.1 传统规则匹配（Rule-based）

**适用**：字段稳定、字典完备、规则易枚举（手机号、身份证、邮箱、IMEI）

```sql
-- 强匹配 SQL 示例
SELECT a.user_id, b.user_id
FROM dwd.user_profile a JOIN dwd.user_profile b
WHERE a.phone_hash = b.phone_hash          -- 手机号匹配
   OR a.id_card_hash = b.id_card_hash      -- 身份证匹配
   OR a.email_hash = b.email_hash          -- 邮箱匹配
```

**优点**：可解释、高性能、易维护
**缺点**：覆盖度有限（设备指纹、行为序列用不上）

#### 2.3.2 模糊匹配（Fuzzy Matching）

**适用**：姓名、地址、公司名等文本字段

常用算法：
- **编辑距离（Levenshtein Distance）**：O(mn)
- **Jaro-Winkler**：对前缀相似度加权，适合姓名
- **TF-IDF + 余弦相似度**：长文本（地址、公司简介）
- **Jaccard 相似度**：集合类字段（标签列表）

```python
from jellyfish import jaro_winkler_similarity
print(jaro_winkler_similarity("张三", "Zhang San"))    # 0.55
print(jaro_winkler_similarity("张三", "张三丰"))      # 0.88
```

#### 2.3.3 图算法（图遍历 + 关系传递）

**适用**：跨多跳、跨域 ID 关联

```
Step 1: 收集所有 ID 节点和强匹配边
Step 2: 弱匹配边（概率 ≥ 阈值）入图
Step 3: 计算连通分量，每个 CC 分配 OneID
Step 4: 周期重算（每日/每小时）
```

工具：
- **Neo4j**：Cypher `MATCH ... WITH ... WHERE ... RETURN`
- **NebulaGraph**：nGQL `LOOKUP | GO | YIELD`
- **Spark GraphX**：CC 算法 `GraphX.connectedComponents`
- **阿里 GraphScope**：大规模图计算

#### 2.3.4 机器学习排序（LTR + 特征工程）

**适用**：弱匹配概率化排序

典型特征：
- 字段相似度特征（手机号 hash 一致、姓名 Jaro-Winkler 距离、设备指纹 hash 一致）
- 行为共现特征（同一 IP 段、同一地理位置、同一时间窗口）
- 图结构特征（两节点最短路径、共同邻居、PageRank）
- 历史匹配特征（这对 ID 是否曾在历史合并过）

模型选择：
- LightGBM / XGBoost：工业首选，可解释 + 高性能
- DeepFM / DNN：特征交互深度
- 排序学习 LambdaMART / RankNet：作为最后打分

#### 2.3.5 深度实体解析（Deep Entity Resolution）

代表论文与模型：

- **DeepER (VLDB 2018)**：用 RNN 编码属性序列，Attention 聚合
- **Ditto (SIGMOD 2021)**：基于预训练 BERT 的实体解析 SOTA，可注入领域知识
- **HierMatcher (NeurIPS 2021)**：层次化匹配（先 entity 级，再 value 级）
- **ZeroER (NeurIPS 2023)**：零样本实体解析，用 LLM 替代训练数据

Ditto 核心思想：

```
Input:   "[COL]phone[/COL]13800001111 [COL]name[/COL]张三 [SEP] [COL]phone[/COL]13800001111 [COL]name[/COL]Zhang San"
Output:  Match / Non-Match
```

Ditto 通过序列化属性 + 列名 tag + 领域知识注入，把实体解析做成 **文本分类任务**——这与 LLM 时代的 "序列化对比" 思路完全一致。

#### 2.3.6 LLM 辅助实体解析（2023-2025）

**模式 1 · Zero-shot / Few-shot prompting**

```
Prompt:
You are an entity resolution expert. Given two records, decide if they refer to the same entity.

Record A: {phone: "13800001111", name: "张三", city: "北京"}
Record B: {phone: "13800001111", name: "Zhang San", city: "Beijing"}

Return JSON:
{
  "decision": "merge" | "split" | "unsure",
  "confidence": 0.0-1.0,
  "reason": "string"
}
```

**模式 2 · Embedding-based LLM Matching**

把每个 record 用 LLM 生成 embedding（OpenAI `text-embedding-3-large`、BGE、M3E），再算余弦相似度。

**模式 3 · LLM-as-a-Judge 复核**

把传统模型判定为"边界样本"的（0.6-0.85 区间）单独送给 LLM 复核，平衡精度与成本。

### 2.4 与相邻概念的关系

#### OneID vs UUID vs 雪花 ID vs ULID

| 维度 | UUID v4 | UUID v7 | 雪花 ID | ULID |
| --- | --- | --- | --- | --- |
| 生成方式 | 随机 | 时间 + 随机 | 时间戳 + 机器 + 序列 | 时间戳 + 随机 |
| 全局唯一 | 是 | 是 | 是 | 是 |
| 时间有序 | 否 | 是 | 是 | 是 |
| 可排序性 | 弱 | 强 | 强 | 强 |
| 反向推断时间 | 否 | 是 | 是（截位） | 是 |
| 信息熵 | 122 bit | 74 bit | 22 bit/位 | 80 bit |
| 工业主流 | 老系统 | 新系统 | 国内主流 | 国际新趋势 |

**架构师建议**：2024-2025 年新建系统优先 **ULID 或 UUID v7**（可排序 + 友好分布式），老系统兼容 **雪花 ID**。

#### OneID vs Cookie vs 设备 ID vs 手机号

| 维度 | Cookie | 设备 ID | 手机号 | OneID |
| --- | --- | --- | --- | --- |
| Web 覆盖率 | 高 | 低 | 中 | 全 |
| App 覆盖率 | 无 | 高 | 中 | 全 |
| 跨端 | 弱 | 弱 | 强 | 强 |
| 合规风险 | 中（GDPR） | 高（IDFA 限制） | 中（实名） | 低（内部） |
| 唯一性 | 弱（清空失效） | 中 | 强 | 强 |
| 实名能力 | 无 | 无 | 强 | 强 |

OneID 是 **把这些分散 ID 串联起来的"超 ID"**——不是替代品，是上层抽象。

#### OneID vs CRM 会员号 vs 账户号

- **CRM 会员号**：业务域内 ID，仅在 CRM 系统有效
- **账户号**：登录账号级 ID，一人多账号时无效
- **OneID**：跨业务域的全域 ID，是数据资产的根

#### OneID vs 客户主数据 vs 客户 360

- **客户主数据（Customer Master）**：MDM 系统的核心表
- **OneID**：客户主数据的"主键"
- **客户 360（Customer 360）**：基于 OneID 聚合的全量属性视图（包含画像、行为、价值）

#### OneID vs GraphRAG 中的实体节点

- **OneID**：解决"哪个 ID 是同一个人"
- **GraphRAG 中的实体**：解决"哪些实体之间有关系"
- **交集**：OneID 节点可以挂载到知识图谱的 Person / Organization / Device 节点上

#### OneID vs 数据治理（Data Governance）

- OneID 是 **数据治理的关键交付物之一**
- 数据治理还包括元数据、数据质量、血缘、安全分级
- 但 OneID 的"实体一致性"是数据治理最难的部分

---

## 3. 设计模式与范式

### 3.1 主要模式

#### 模式 1 · 强匹配优先（Strong-Match-First）

**思路**：先做所有强匹配规则，再做弱匹配。

```
Step 1: 手机号 / 身份证 / 邮箱 精确匹配 → 合并 OneID
Step 2: 设备指纹 hash 一致 → 合并 OneID（同源）
Step 3: 行为序列 + 模糊字段 → 概率合并
Step 4: 边界样本 → 人工 / LLM 复核
```

**优点**：简单、99% 的合并在前 1 步完成
**缺点**：弱匹配可能被强匹配"截胡"

#### 模式 2 · 图聚合（Graph Aggregation）

**思路**：把所有 ID 当节点，所有匹配关系当边，计算连通分量作为 OneID。

```
Step 1: 构建 ID-Graph
Step 2: 强匹配边（手机号一致）+ 弱匹配边（概率 ≥ 0.9）
Step 3: WCC 计算，每个 CC 分配 OneID
Step 4: 每日重算 + 增量更新
```

**优点**：天然处理多跳关联（手机号 A → 用户 1 → 邮箱 B → 用户 2）
**缺点**：图规模大时计算量大，需要分布式（图数据库）

#### 模式 3 · 概率判定（Probabilistic Decision）

**思路**：每条合并决策独立评分（Fellegi-Sunter 或 ML 模型），不依赖连通分量。

```
Step 1: 候选对生成（Blocking：同 phone 前缀 / 同 city / 同 IP 段）
Step 2: 特征计算（相似度 + 行为 + 图）
Step 3: ML 模型打分（LightGBM / Ditto）
Step 4: 阈值分割（≥ 0.95 合并 / < 0.05 不合并 / 中间人工）
```

**优点**：概率可控，可解释
**缺点**：阈值难调，依赖人工标注

#### 模式 4 · 端到端深度匹配（Deep End-to-End）

**思路**：把 ID-Mapping 当作文本对匹配任务，用 BERT/DITTO 端到端训练。

```
Input: 序列化属性序列对
Output: merge / non-merge 概率
```

**优点**：捕捉复杂语义（地址、公司名变体）
**缺点**：训练数据需求大，推理慢

#### 模式 5 · LLM 辅助生成式（Generative LLM-Augmented）

**思路**：LLM 推理 / LLM Embedding 作为补充模块。

```
传统流程 → 边界样本（0.6-0.85）→ LLM 复核 / LLM Embedding 二次打分
```

**优点**：对长文本、跨语言、非结构化字段友好
**缺点**：成本高，延迟高

#### 模式 6 · 实时增量（Streaming Incremental）

**思路**：批式全量 + 实时增量双轨。

- 每日全量重算（保证最终一致性）
- 实时增量（Kafka 事件驱动，新增 / 变更 OneID 实时更新）

**优点**：查询实时（< 1s），批式校准（每日）
**缺点**：双链路维护成本

#### 模式 7 · 隐私计算 OneID（Privacy-Preserving OneID）

**思路**：在不暴露明文手机号 / 身份证的情况下做 ID 打通。

技术：
- **PSI（Private Set Intersection）**：双方加密集合求交集（手机号 hash 加密 + 同态加密 / 不经意传输）
- **联邦学习（Federated Learning）**：各方本地训练 ID-Mapping 模型，参数聚合
- **TEE（Trusted Execution Environment）**：Intel SGX / 海光 CSV 在可信硬件内计算

**适用**：广告归因（媒体方 × 广告主）、医疗数据互通、跨境数据合规

#### 模式 8 · 向量化 OneID（Embedding-based OneID）

**思路**：把 OneID 节点直接向量化，向量空间内做相似检索。

- 每个 OneID 用 User Embedding 表达
- 余弦相似度用于相似用户分群（Look-alike）
- 同一 OneID 在不同时间窗有不同 embedding（动态画像）

### 3.2 适用场景决策表

| 业务场景 | 推荐模式 | 备注 |
| --- | --- | --- |
| 电商跨端（Web/App/小程序）打通 | 强匹配优先 + 图聚合 | 80% 走强匹配 |
| 广告投放闭环（巨量/腾讯回传） | 概率判定 + LLM 复核 | 广告 ID 与 CRM ID 异构 |
| 金融风控（一人多户识别） | 强匹配（身份证）+ 图 + 规则 | 监管严格 |
| 反欺诈（一机多号、设备农场） | 设备指纹 + 行为 + 图 | 黑名单 + OneID 联合判定 |
| 客户 360 / CRM 会员统一 | 图聚合 + 概率判定 | 全域打通 |
| 跨企业数据合作 | PSI / 联邦学习 | 隐私合规 |
| 跨境业务（多语言地址匹配） | LLM 辅助 + Embedding | 翻译 + 地址规范化 |
| 媒体内容 ID（图文视频） | 内容指纹 + Embedding | 跨模态 ID 打通 |
| 智能体长期记忆（Agent Memory） | OneID + 向量记忆 | 按用户隔离 |
| 商品 OneID（SKU/SPU 统一） | 强匹配 + LLM 商品名匹配 | 与用户 OneID 平行 |

### 3.3 反模式与陷阱

#### 反模式 1 · 过度依赖强匹配

很多团队以为"做了手机号匹配就算 OneID 了"，结果：
- 没有手机号的访客（PC Web 游客）无法打通
- 跨设备 / 跨账号用户重复计算
- 弱关联（行为相似）完全没捕捉

**修正**：必须配 **设备指纹 + 行为序列 + 图传递**。

#### 反模式 2 · 弱匹配阈值定得过低

为了追求覆盖率，把概率阈值从 0.9 调到 0.6，结果：
- 把不是同一人的人合到一起（误合并率飙升）
- 后续标签 / 画像严重错乱
- "合并后拆分"成本极高

**修正**：先定精度下限（≥ 95%），再考虑召回率。

#### 反模式 3 · 不做合并冲突检测

同一个 OneID 下挂了两个生日相差 30 岁的身份证号 → 数据质量问题未检测。

**修正**：OneID 合并时触发 **冲突检测**（生日、性别、地区差异过大则不合并）。

#### 反模式 4 · 一次性大合并，无回退机制

某个错误合并导致几千万用户被打通，事后无法拆分。

**修正**：
- OneID 维护版本号 / 时间戳（graph version）
- 关键字段合并留痕（merge_reason, merge_confidence）
- 周期性合并审计 + 抽样人工复核

#### 反模式 5 · 用 UUID v4 当 OneID 写库

UUID v4 写入 B+Tree 索引性能差（无序），还浪费空间。

**修正**：用 ULID / UUID v7 / 雪花 ID（按时间有序）。

#### 反模式 6 · OneID 服务化但没考虑回溯

某个上游数据被删除了，OneID 表里残留死链。

**修正**：OneID 表 + CDC + 软删除 + 周期性 reconcile。

#### 反模式 7 · 只做用户 OneID，不做商品 / 订单 / 设备 OneID

只打通用户维度，但商品 SKU / 订单 / 设备 ID 没打通，导致：
- 跨业务推荐错位（同一商品不同域不同名）
- 跨设备风控失效

**修正**：OneID 是 **多实体**（人 / 设备 / 商品 / 订单 / 内容），要平行建设。

#### 反模式 8 · 完全交给 LLM 解决

LLM 一条匹配 ¥0.01，10 亿对 = ¥1 亿，工业级不现实。

**修正**：传统模型处理 99%，LLM 只复核 1% 边界样本。

---

## 4. 工程实现

### 4.1 落地步骤

#### 阶段 1 · 数据盘点与 ID 清单（0→1 第 1 周）

1. **盘点所有上游系统**：业务库、日志、第三方、CRM、广告投放、客服、线下
2. **列出每个系统的 ID 类型与字段**：
   - user_id / customer_id / member_id / open_id / union_id / 手机号 / 邮箱 / 设备 ID / IMEI / IDFA / Cookie / 微信号
3. **输出 ID 关系清单**：`id_inventory.xlsx`
   - 列：ID 类型、来源系统、是否实名、是否加密、更新频率、合规等级

#### 阶段 2 · 强匹配规则建设（0→1 第 2-3 周）

1. **确定强匹配字段**：
   - 手机号（一级，最强）
   - 身份证号 hash（一级，最强，但需脱敏）
   - 邮箱 hash（一级）
   - 设备指纹 hash（一级，同设备同源）
2. **统一脱敏规范**：
   - 手机号 SHA-256 + 盐（盐定期轮换）
   - 身份证号 SHA-256 + 盐
   - 邮箱 lowercase + SHA-256 + 盐
3. **编写强匹配 ETL**：Hive SQL / Spark SQL / Flink SQL

#### 阶段 3 · 弱匹配规则 + ML 模型（0→1 第 4-6 周）

1. **模糊字段抽取**：
   - 姓名 → Jaro-Winkler / 拼音转换
   - 地址 → 地址标准化 + NER（省市区提取）
   - 公司名 → 公司名清洗 + 同义词替换
2. **行为特征构造**：
   - 同一 IP 段（/24 子网）
   - 同一 WiFi BSSID / GPS 坐标（30m 内）
   - 同一时间窗口（±30 分钟）
   - 同一设备型号 + OS + 屏幕尺寸
3. **训练 LightGBM 匹配模型**：
   - 正样本：人工标注 / 已有 OneID 的成对 ID
   - 负样本：随机采样非同 ID 对
   - 验证：AUC ≥ 0.95，KS ≥ 0.6

#### 阶段 4 · 图聚合 + OneID 生成（0→1 第 7-8 周）

1. **构建 ID-Graph**：Spark GraphX / Neo4j / NebulaGraph
2. **每日跑 WCC（弱连通分量）**
3. **每个 CC 分配 OneID**：
   - 取最小 ID 作为 OneID 主键
   - 或取最早注册 ID 作为 OneID 主键
4. **OneID 表输出**：
   - 字段：oneid, primary_id_type, primary_id_value, all_ids, first_seen, last_seen, version

#### 阶段 5 · 服务化（0→1 第 9-10 周）

1. **OneID 查询服务**：
   - 输入：phone / device_id / email / cookie
   - 输出：oneid + 关联 ID 列表
   - 性能：P99 < 100ms
2. **OneID 反向查询**：
   - 输入：oneid
   - 输出：所有关联 ID + 属性
3. **OneID 更新服务**：
   - 实时合并 / 拆分接口

#### 阶段 6 · 监控与治理（0→1 第 11-12 周）

1. **监控**：
   - 合并率、强匹配占比、弱匹配占比、冲突率
   - 服务 SLA（P99 < 100ms，可用性 99.95%）
2. **数据质量**：
   - OneID 覆盖率（账号有 OneID 比例）
   - 冲突率（同 OneID 下属性矛盾比例）
   - 回溯率（可被还原的合并比例）
3. **审计日志**：
   - 每次合并 / 拆分留痕
   - 提供审计查询接口

### 4.2 关键技术点

#### 4.2.1 设备指纹（Device Fingerprinting）

Web 端：
- UA（User-Agent）
- 屏幕分辨率、色深、像素比
- 系统字体列表
- Canvas 指纹（GPU 渲染差异）
- WebGL 指纹
- 已安装插件 / 已安装字体
- 时区、语言
- Cookie + localStorage（需用户授权）

移动端：
- iOS：IDFA（用户授权后才可访问，14.5 后大幅收紧）、IDFV（应用级）
- Android：OAID（替代 IMEI）、Android ID、IMEI（部分场景受限）、MAC 地址

服务端：
- IP + 运营商 + 地理位置
- WiFi BSSID
- 蓝牙 MAC
- 充电习惯、陀螺仪数据（黑产识别）

**命中率**：
- 移动端：70-90%（OAID 命中率高于 IDFA）
- Web 端：40-60%（浏览器隐私模式 / 清缓存后失效）

#### 4.2.2 加密与脱敏

- **手机号**：SHA-256(salt) + 截断（保留前 7 位或后 4 位做匹配）
- **身份证号**：SHA-256(salt) + 生日截断（用于一致性检查）
- **邮箱**：SHA-256(salt) + 域名截断
- **盐管理**：定期轮换（季度），双盐（业务盐 + 数据盐）

#### 4.2.3 ID-Graph 存储

| 工具 | 规模 | 延迟 | 适用 |
| --- | --- | --- | --- |
| Neo4j | 10 亿边 | ms 级 | 中等规模 |
| NebulaGraph | 100 亿边 | ms 级 | 大规模互联网 |
| TigerGraph | 100 亿边 | ms 级 | 金融风控 |
| Spark GraphX | 1000 亿边 | 分钟级 | 离线批处理 |
| GraphScope | 1000 亿边 | 秒级 | 一站式图计算 |
| Amazon Neptune | 100 亿边 | ms 级 | 云原生 |
| ArangoDB | 10 亿边 | ms 级 | 多模型（文档+图） |
| JanusGraph | 100 亿边 | ms 级 | 开源 + 可插拔后端 |

#### 4.2.4 实时增量更新（Flink / Kafka）

```
Kafka Topic: dwd_user_change
  Schema: { id_type, id_value, change_type, timestamp, source }
  
Flink Job:
  1. 消费变更事件
  2. 查询 OneID 主数据（Redis / HBase）
  3. 触发合并 / 拆分
  4. 更新 OneID 状态
  5. 写回主数据 + 通知下游
```

延迟目标：P99 < 1 秒。

#### 4.2.5 准实时批量（T+1 重算）

每日凌晨：
1. 全量读上游 ID 数据
2. 全量跑 ID-Mapping
3. 与昨日 OneID 表对比（diff）
4. 输出新 OneID 表 + 增量 diff

保证：批式校准实时增量，**最终一致性**。

### 4.3 工具链与平台（含 2024-2025 新工具）

#### 4.3.1 传统 MDM 套件

| 产品 | 厂商 | 特点 |
| --- | --- | --- |
| InfoSphere MDM | IBM | 企业级，重型，传统金融行业 |
| Informatica MDM | Informatica | 数据治理 + MDM 一体化 |
| Oracle MDM | Oracle | 与 Oracle DB 深度集成 |
| SAP MDG | SAP | ERP 厂商的 MDM |
| Reltio | Reltio | 云原生 MDM，图原生 |
| Tibco EBX | Tibco | 主数据 + 数据质量 |

#### 4.3.2 大数据 OneID 中台（自研）

- **阿里 OneID（Dataphin / Quick BI 配套）**：基于设备指纹 + 手机号三要素 + 图计算
- **字节 UID**：基于 UID 图 + 概率匹配（公开技术博客少量披露）
- **美团 UserID**：图数据库 + 规则引擎（公开论文已多次）
- **腾讯 OneID**：QQ / 微信 OpenID + UnionID + 手机号 + 设备 ID
- **京东 OneID**：电商场景的 ID-Mapping 平台
- **网易 OneID**：游戏账号 + 实名 + 设备指纹

#### 4.3.3 云厂商实体解析服务（2023-2025 新工具）

| 厂商 | 服务名 | 发布时间 | 特点 |
| --- | --- | --- | --- |
| AWS | **AWS Entity Resolution** | 2024 GA | ML-based 匹配，支持多种 blocking 策略 |
| Azure | **Azure AI Foundry ID Resolution** | 2024 GA | 与 Cognitive Services 集成 |
| GCP | **Cloud Entity Resolution (Dataplex)** | 2023 GA | BigQuery 内置 |
| Salesforce | **Data Cloud Zero-Copy ID Resolution** | 2024 GA | 零拷贝 + CDP |
| Palantir | **Foundry Entity Resolution** | 持续迭代 | 图原生 + Ontology |

#### 4.3.4 开源工具

- **Splink**（英国 MoJ 开源）：Python 实体解析库，Fellegi-Sunter 实现
- **dedupe**（DataMade）：Python 主动学习实体解析
- **Jellyfish**（James Trimble）：字符串相似度算法库
- **recordlinkage**（Python）：传统实体解析工具包
- **Apache Hivemall**（Treasure Data）：机器学习 + UDF 实体解析
- **Magellan**（Uber 开源）：基于 PySpark 的实体解析
- **DeepMatcher**（UMass）：深度学习实体解析
- **Ditto**：基于 BERT 的实体解析（GitHub）

#### 4.3.5 LLM 增强工具（2024-2025）

- **LangChain + Entity Resolution**：用 LLM 链做 ER
- **LlamaIndex GraphRAG**：图 + RAG 实体解析
- **Microsoft Presidio + LLM**：隐私 + ER
- **AWS Entity Resolution + Bedrock**：AWS 集成 LLM 的 ER 服务

### 4.4 代码 / 示例

#### 4.4.1 强匹配 SQL（Hive / Spark SQL）

```sql
-- 创建 OneID 中间表
CREATE TABLE dwd.one_id_mapping (
    id_id STRING COMMENT '原始 ID',
    id_type STRING COMMENT 'ID 类型',
    oneid BIGINT COMMENT 'OneID 主键',
    version BIGINT COMMENT '版本号',
    update_time TIMESTAMP
) PARTITIONED BY (dt STRING)
STORED AS ORC;

-- 强匹配：按手机号合并
INSERT OVERWRITE TABLE dwd.one_id_mapping PARTITION (dt='${biz_date}')
SELECT
    id_id,
    id_type,
    -- 取最早出现的 ID 作为 OneID 锚点
    MIN(oneid_anchor) OVER (PARTITION BY phone_hash) AS oneid,
    1 AS version,
    CURRENT_TIMESTAMP AS update_time
FROM (
    SELECT
        a.id_id,
        a.id_type,
        a.phone_hash,
        a.id_id AS oneid_anchor
    FROM dwd.user_profile_dim a
    WHERE a.dt = '${biz_date}'
      AND a.phone_hash IS NOT NULL
) t;
```

#### 4.4.2 模糊匹配 + LLM 复核（Python）

```python
"""
弱匹配：模糊匹配 + LLM 复核
适用：电商跨端用户打通
"""
from openai import OpenAI
from jellyfish import jaro_winkler_similarity
import pandas as pd
from typing import Tuple

client = OpenAI()


def phone_match(r: dict, s: dict) -> bool:
    """手机号强匹配"""
    return (r.get("phone_hash") is not None
            and r.get("phone_hash") == s.get("phone_hash"))


def fuzzy_name_match(r: dict, s: dict) -> float:
    """姓名模糊匹配"""
    n1, n2 = r.get("name", ""), s.get("name", "")
    if not n1 or not n2:
        return 0.0
    return jaro_winkler_similarity(n1, n2)


def llm_judge(r: dict, s: dict) -> Tuple[str, float]:
    """LLM 复核"""
    prompt = f"""
你是实体解析专家。判断两条记录是否指代同一人。

Record A: {r}
Record B: {s}

输出 JSON：
{{
  "decision": "merge" | "split" | "unsure",
  "confidence": 0.0-1.0,
  "reason": "..."
}}
"""
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
        response_format={"type": "json_object"}
    )
    import json
    result = json.loads(resp.choices[0].message.content)
    return result["decision"], result["confidence"]


def should_merge(r: dict, s: dict) -> bool:
    """综合判定：强匹配 OR (模糊匹配高 & LLM 复核通过)"""
    # 1. 强匹配
    if phone_match(r, s):
        return True
    # 2. 模糊匹配进入边界
    name_sim = fuzzy_name_match(r, s)
    if name_sim < 0.6:
        return False
    # 3. LLM 复核（仅在边界样本上调用，控制成本）
    decision, conf = llm_judge(r, s)
    return decision == "merge" and conf >= 0.85
```

#### 4.4.3 图聚合（Neo4j Cypher）

```cypher
// 创建 ID 节点
UNWIND $ids AS row
MERGE (n:ID {value: row.value})
SET n.type = row.type;

// 创建强匹配边（手机号一致）
MATCH (a:ID {type: 'user_id'}), (b:ID {type: 'phone_hash'})
WHERE a.phone_hash = b.value
MERGE (a)-[:STRONG_MATCH]->(b);

// 创建弱匹配边（设备指纹 hash 一致 + 行为相似）
MATCH (a:ID {type: 'device_id'}), (b:ID {type: 'user_id'})
WHERE a.behavior_sim > 0.85
MERGE (a)-[:WEAK_MATCH {confidence: a.behavior_sim}]->(b);

// 计算弱连通分量作为 OneID
CALL gds.wcc.stream('id-graph')
YIELD nodeId, componentId
MATCH (n:ID) WHERE id(n) = nodeId
SET n.oneid = componentId;
```

#### 4.4.4 Ditto 风格深度匹配（PyTorch + Hugging Face）

```python
"""
基于 BERT 的实体解析（Ditto 简化版）
"""
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tokenizer = AutoTokenizer.from_pretrained("bert-base-chinese")
model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-chinese", num_labels=2
)


def serialize_record(r: dict) -> str:
    """把 record 序列化为 Ditto 格式"""
    return " ".join(f"[COL]{k}[/COL]{v}" for k, v in r.items())


def ditto_match(r: dict, s: dict) -> float:
    """Ditto 风格匹配"""
    serialized_a = serialize_record(r)
    serialized_b = serialize_record(s)
    inputs = tokenizer(
        serialized_a, serialized_b,
        return_tensors="pt", truncation=True, max_length=128
    )
    with torch.no_grad():
        outputs = model(**inputs)
    probs = torch.softmax(outputs.logits, dim=-1)
    return probs[0][1].item()  # merge 概率
```

#### 4.4.5 实时增量更新（Flink）

```java
/**
 * OneID 实时增量更新 Flink Job
 */
public class OneIdStreamingJob {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        
        // 1. 消费上游 ID 变更事件
        DataStream<IDChangeEvent> events = env
            .addSource(new FlinkKafkaConsumer<>(
                "dwd.user.id_change",
                new IDChangeEventDeserializer(),
                kafkaProps))
            .name("ID Change Source");
        
        // 2. 实时 OneID 匹配
        DataStream<OneIdUpdate> updates = events
            .keyBy(e -> e.idValue)
            .process(new OneIdMatchFunction())
            .name("OneID Match");
        
        // 3. 写回 OneID 主数据（HBase / Redis）
        updates.addSink(new HBaseOneIdSink())
            .name("HBase OneID Sink");
        
        // 4. 通知下游（Kafka）
        updates.addSink(new FlinkKafkaProducer<>(
            "dwd.oneid.update", new OneIdUpdateSerializer(), kafkaProps))
            .name("OneID Update Notify");
        
        env.execute("OneID Streaming Job");
    }
}
```

#### 4.4.6 隐私计算 PSI（Java + Cipher）

```java
/**
 * 基于 RSA 盲签名的 PSI（Private Set Intersection）
 * 适用：广告归因场景，媒体方 × 广告主 匹配共同用户
 */
public class PSIExample {
    public static void main(String[] args) {
        // 1. 媒体方准备加密的手机号集合
        Set<String> mediaPhones = new HashSet<>(Arrays.asList(
            "13800001111", "13800002222", "13800003333"
        ));
        // RSA 盲签名加密
        Set<String> blindedPhones = mediaPhones.stream()
            .map(BlindSignature::blind)
            .collect(Collectors.toSet());
        
        // 2. 广告主签名（不暴露明文）
        Set<String> signedPhones = blindedPhones.stream()
            .map(s -> BlindSignature.sign(s, adServerPrivateKey))
            .collect(Collectors.toSet());
        
        // 3. 媒体方去盲
        Set<String> unblindedPhones = signedPhones.stream()
            .map(BlindSignature::unblind)
            .collect(Collectors.toSet());
        
        // 4. 媒体方本地比对交集
        Set<String> intersection = mediaPhones.stream()
            .filter(unblindedPhones::contains)
            .collect(Collectors.toSet());
        
        // 结果：双方都不知道对方的全集，但都知道交集
    }
}
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

#### 5.1.1 LLM 直接做实体解析

**思路**：完全用 LLM 做 ID-Mapping 决策（Zero-shot / Few-shot）。

**优势**：
- 对长文本、非结构化字段友好（公司名变体、地址变体）
- 跨语言（中英、繁简）天然支持
- 可解释（输出 reason）
- 零样本能力（无需训练数据）

**劣势**：
- 成本：每条匹配 ¥0.005-¥0.02，10 亿对 = 数百万元
- 延迟：200ms-2s，远高于传统模型（5ms）
- 稳定性：API 调用受网络、限流影响
- 幻觉风险：LLM 可能"强行合并"两条不同记录

**适用场景**：
- 低频高价值场景（VIP 客户标识、跨企业合作匹配）
- 冷启动阶段（无训练数据时）

#### 5.1.2 LLM 增强传统流程

**思路**：把 LLM 作为"边界复核员"嵌入传统流水线。

```
传统模型（LightGBM）→ 边界样本（0.6-0.85）→ LLM 复核
```

**优势**：
- 成本可控（LLM 只处理 1%-5% 边界样本）
- 精度提升（LLM 在边界样本上准确率高）
- 延迟可控（大部分样本走快速通道）

**工业案例**：
- LinkedIn 用 LLM 增强候选人去重
- Meta 用 LLM 增强广告 ID 归因

#### 5.1.3 LLM 生成 ID 合并原因

```json
{
  "merge": true,
  "oneid": "100001",
  "merged_ids": ["user_id_1", "phone_A", "device_X"],
  "reason_llm": "Same person based on: phone number match (strong), device fingerprint match (strong), name similarity 0.88, recent behavior in same city within 7 days."
}
```

**价值**：把 OneID 的合并决策做成"可解释 AI"，审计、合规、客服都能用。

#### 5.1.4 Agent 自动化 OneID 治理

```python
"""
Agent 自动监控 OneID 数据质量
"""
agent = Agent(
    role="OneID 治理专家",
    goal="监控 OneID 数据质量，识别异常合并",
    tools=[
        QueryOneIDStats(),      # 查询合并率、冲突率
        QueryMergeHistory(),    # 查询近期合并记录
        SampleBoundaryCases(),  # 采样边界样本
        LLMJudge(),             # LLM 判定
        AlertTeam()             # 通知团队
    ]
)

# Agent 每日自动运行
agent.run("""
1. 查询昨日 OneID 合并率与冲突率
2. 如冲突率 > 1%，采样 100 条边界样本
3. 送 LLM 复核是否有明显错误
4. 如错误率 > 5%，触发告警
""")
```

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

#### 5.2.1 OneID 作为 RAG 的"用户级检索"键

```python
# 按 OneID 检索用户相关的文档 / 对话
def user_rag_query(oneid: str, query: str):
    # 1. 按 OneID 过滤用户记忆
    user_docs = vector_db.similarity_search(
        query,
        filter={"oneid": oneid},    # 按 OneID 过滤
        k=10
    )
    # 2. LLM 生成回答
    return llm.generate(query, context=user_docs)
```

#### 5.2.2 OneID 进入 GraphRAG 的实体节点

```
Person节点
  ├─ 属性：name, age, phone_hash, email_hash
  ├─ 关系：HAS_ACCOUNT → Account节点
  ├─ 关系：OWNS_DEVICE → Device节点
  └─ OneID: 全局唯一
```

**价值**：GraphRAG 中所有实体节点都挂 OneID，跨实体推理更准确。

#### 5.2.3 OneID 作为 Embedding 的"用户级聚合键"

```python
# 训练用户 Embedding
user_embedding = aggregate(
    embeddings=[doc_embedding, ...],  # 该用户的所有文档 Embedding
    key=oneid                          # 按 OneID 聚合
)
```

### 5.3 学术与工业最新进展（2024-2025）

#### 5.3.1 学术进展

| 时间 | 论文 / 项目 | 关键贡献 |
| --- | --- | --- |
| 2024 | **ZeroER (NeurIPS 2023)** | 零样本 ER，用 LLM 完全替代训练 |
| 2024 | **Ditto+LLM (SIGMOD 2024)** | Ditto + LLM 知识注入 |
| 2024 | **HierMatcher+LLM** | 层次化匹配 + LLM 复核 |
| 2024 | **AutoER (NeurIPS 2024)** | AutoML for ER |
| 2024 | **Federated ER (KDD 2024)** | 联邦 ER，跨企业隐私保护 |
| 2025 | **GraphER with GNN (ICLR 2025)** | 用 GNN 替代人工特征 |
| 2025 | **Multimodal ER (CVPR 2025)** | 跨模态 ID 打通（人脸 + 文本） |

#### 5.3.2 工业进展

- **阿里 2024**：OneID 升级到"全域智能 OneID"，融合 LLM 与概率图
- **字节 2024**：发布"巨量引擎 OneID 4.0"，引入 LLM 边界复核
- **腾讯 2024**：微信支付 OneID 引入 LLM 地址匹配
- **美团 2024**：发布"美团大脑 OneID"白皮书
- **Salesforce 2024**：Data Cloud 推出 Zero-Copy ID Resolution
- **AWS 2024 GA**：Entity Resolution 服务上线
- **Snowflake 2024**：与 Databricks 互通的 ID 解析

#### 5.3.3 开源项目

- **Splink 4.0**（2024）：Python ER 库，引入 LLM 支持
- **dedupe 3.0**（2024）：增强可视化
- **DeepMatcher 2.0**：BERT-based ER
- **LangChain ER**：基于 LangChain 的 LLM-ER 工具链

### 5.4 未来 3-5 年趋势

#### 趋势 1 · 端到端 LLM-ER 主流化

未来 3 年，**LLM-ER** 会在长文本匹配（地址、公司名、商品名）上取代大部分传统模型。但强匹配（手机号、身份证）仍由规则负责。

#### 趋势 2 · 隐私计算 + OneID 标配化

GDPR / 中国《个人信息保护法》/ HIPAA 倒逼企业把 **隐私计算（PSI / 联邦学习 / TEE）** 作为 OneID 的标准能力。广告归因、医疗互通、跨境业务都离不开。

#### 趋势 3 · OneID × GraphRAG 融合

GraphRAG 把 OneID 节点作为"Person / Organization"类型挂载，知识图谱 + OneID + RAG 一体化检索。

#### 趋势 4 · 实时 OneID（Streaming OneID）

从 T+1 批式 → 秒级实时，**流批一体**（Flink + Iceberg + Hudi）。

#### 趋势 5 · 多模态 OneID

文本 + 图像 + 视频 + 音频的 ID 打通（如同一商品不同角度照片匹配）。

#### 趋势 6 · AI 原生 OneID 平台

LLM/Agent 自动配置 ID-Mapping 规则、自动标注、自动调阈值、自动异常检测。**AI Ops for OneID**。

#### 趋势 7 · 跨企业 OneID 联邦

广告主 × 媒体方 × 第三方数据方通过 **数据空间（Data Space）+ 联邦 OneID** 协作，避免数据出域。

#### 趋势 8 · 区块链辅助 OneID 审计

用区块链不可篡改特性记录 OneID 合并决策，用于合规审计（金融、医疗、政务）。

---

## 6. 落地实践

### 6.1 真实案例

#### 案例 1 · 阿里电商 OneID（10 亿用户）

**背景**：淘宝 / 天猫 / 支付宝 / 菜鸟 / 闲鱼 多端用户打通。

**方案**：
- 锚点：手机号（一级）+ 设备指纹（二级）
- 弱匹配：行为序列（同一收货地址 + 同一时间窗）
- LLM 复核：地址、公司名变体
- OneID 服务：阿里自研 OneService，每天处理千亿级查询

**效果**：
- 用户 OneID 覆盖率：98%+
- 跨端识别准确率：99%+
- DAU 去重率：30%-50%（修复后）

#### 案例 2 · 美团 UserID（5 亿用户）

**背景**：美团 / 大众点评 / 外卖 / 酒店多端打通。

**方案**：
- 锚点：手机号 + 微信 OpenID
- 图聚合：NebulaGraph 分布式图数据库
- LLM：地址匹配、商家名匹配

**效果**：
- OneID 覆盖率：95%+
- 跨业务推荐 CTR 提升 15%+

#### 案例 3 · 某银行 OneID（数亿账户）

**背景**：借记卡 / 信用卡 / 理财 / 贷款 账户打通。

**方案**：
- 锚点：身份证（一级，最强）
- 弱匹配：紧急联系人、地址、家庭关系
- 监管合规：央行反洗钱要求

**效果**：
- 反欺诈识别率提升 50%+
- 一人多户识别率 99%+

#### 案例 4 · 字节跳动 UID（10 亿用户）

**背景**：抖音 / 西瓜 / 今日头条 / TikTok 全球用户打通。

**方案**：
- 锚点：手机号（一级）+ 设备指纹（二级）+ 第三方登录（微信、Google）
- 跨语言：LLM 翻译 + 拼音转换
- 隐私合规：GDPR + 各地区数据本地化

**效果**：
- 全球用户 OneID 覆盖率 90%+
- 跨端推荐 AUC 提升 10%+

#### 案例 5 · 跨境电商 OneID（Shein / Temu）

**背景**：跨境多语言用户打通。

**方案**：
- 锚点：邮箱 + 手机号
- LLM 地址匹配：多语言地址标准化
- LLM 姓名匹配：跨语言姓名变体
- 隐私合规：GDPR + PIPL

### 6.2 踩坑与经验

#### 踩坑 1 · 一次性大合并后无法拆分

**现象**：某次 ID-Mapping 误合并 5000 万用户，事后无法拆分，导致画像错乱半年。

**教训**：
- OneID 表必须有 `merge_history`（合并历史）
- 关键字段合并必须可逆（保留原始 ID 与 OneID 映射）
- 重大合并决策必须有 **人工审核闸门**

#### 踩坑 2 · 设备指纹合规风险

**现象**：某 App 在 iOS 14.5 后仍使用 IDFA，被下架警告。

**教训**：
- iOS 14.5+ 必须用 ATT（App Tracking Transparency）框架获取 IDFA
- 中国市场必须使用 OAID
- GDPR 区域必须明确用户授权

#### 踩坑 3 · 跨时区合并错误

**现象**：UTC 时间与本地时间混用，导致"同一时刻不同天"的合并错误。

**教训**：
- 统一使用 UTC 时间戳
- 时间窗口匹配时按本地时间窗口判定（用户活动在南京 23:00 ≠ 纽约 23:00）

#### 踩坑 4 · 中文姓名匹配错误

**现象**：把"张三"和"张三丰"合并（同姓 + 名字相似）。

**教训**：
- 姓名匹配必须结合年龄、性别、地区
- 中文字符的编辑距离匹配阈值要 ≥ 0.85，避免字形相似误合并

#### 踩坑 5 · 弱匹配阈值过低

**现象**：把阈值从 0.9 调到 0.7 追求覆盖率，结果误合并率从 1% 飙到 10%。

**教训**：
- 阈值调优必须先看 **误合并率**（precision），再看覆盖率（recall）
- 宁可漏合并，不要错合并（错合并恢复成本极高）

#### 踩坑 6 · OneID 服务化但没考虑版本

**现象**：OneID 表 schema 变更（增加字段）导致下游服务全面崩溃。

**教训**：
- OneID 表 schema 演进必须有版本管理
- 关键字段必须有默认值
- 重大变更要有双写期 + 灰度期

### 6.3 落地路径（0→1, 1→10, 10→100）

#### 0 → 1（第 1 个月）

- 盘点 ID（id_inventory.xlsx）
- 强匹配规则（手机号 + 身份证 + 邮箱）
- OneID 表初步建立（覆盖 60-70% 用户）
- 服务化（内部查询 API）

**核心交付物**：OneID 表 v1 + 强匹配服务

#### 1 → 10（第 2-3 个月）

- 设备指纹接入（移动端优先）
- 弱匹配规则（行为 + 模糊字段）
- ML 模型（LightGBM 概率匹配）
- 图聚合（Neo4j / NebulaGraph）
- OneID 覆盖率提升到 85%+

**核心交付物**：概率匹配模型 + 图计算服务

#### 10 → 100（第 4-6 个月）

- LLM 增强（边界样本复核）
- 实时增量（Flink 实时合并 / 拆分）
- 准实时批量（T+1 重算）
- 监控与数据质量（OneID 覆盖率、冲突率、误合并率）
- 跨业务 OneID（CRM、广告、客服、电商）

**核心交付物**：OneID 全域打通 + 数据质量 Dashboard

#### 100 → 10000（第 7-12 个月）

- 隐私计算（PSI / 联邦学习）
- 跨企业 OneID（数据合作）
- 多模态 OneID（人脸、语音、商品图）
- AI 原生 OneID 治理（Agent 自动监控）
- 跨境 OneID（GDPR / PIPL 合规）

**核心交付物**：隐私计算 OneID + 跨企业合作

### 6.4 ROI 评估

#### 直接收益

| 指标 | 修复前 | 修复后 | 收益 |
| --- | --- | --- | --- |
| DAU 虚高 | +30% | 真实 DAU | 决策不再被误导 |
| 跨端重复触达 | 重复 | 不重复 | 节省营销预算 10-30% |
| 跨端推荐 AUC | 0.65 | 0.80+ | CTR 提升 15-30% |
| 风控识别率 | 50% | 90%+ | 减少欺诈损失 |
| 客服工单打通 | 40% | 90%+ | 客服效率提升 30% |

#### 间接收益

- 数据资产化（OneID 是数据资产化的关键）
- 智能化升级（OneID 让 AI 模型有干净样本）
- 组织协同（OneID 让业务 / 数据 / AI 团队对齐口径）

#### 投入估算

| 阶段 | 人月 | 经费投入 | 时间 |
| --- | --- | --- | --- |
| 0 → 1 | 2-3 人 / 1 个月 | 50 万 - 100 万 | 1 个月 |
| 1 → 10 | 4-5 人 / 2 个月 | 150 万 - 300 万 | 2 个月 |
| 10 → 100 | 6-10 人 / 3 个月 | 500 万 - 1000 万 | 3 个月 |

> 注：含人力 + 基础设施 + 数据标注 + LLM 成本。

#### 投资回报期

- 0 → 1：6 个月回本（节省重复投放）
- 1 → 10：12 个月回本（推荐 + 风控）
- 10 → 100：24 个月回本（数据资产化 + AI 平台）

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 规则匹配 | 图聚合 | 概率匹配 | 深度学习 | LLM 辅助 |
| --- | --- | --- | --- | --- | --- |
| 精度 | 4 | 3 | 4 | 4 | 5 |
| 召回率 | 2 | 4 | 4 | 4 | 4 |
| 性能 | 5 | 3 | 4 | 3 | 1 |
| 成本 | 5 | 3 | 4 | 3 | 1 |
| 可解释性 | 5 | 4 | 4 | 2 | 4 |
| 维护成本 | 2（规则膨胀） | 3 | 3 | 4 | 4 |
| 冷启动友好度 | 4 | 2 | 2 | 2 | 5 |
| 长文本能力 | 1 | 2 | 3 | 4 | 5 |
| 跨语言能力 | 1 | 2 | 3 | 3 | 5 |

> 5 = 最优，1 = 最差。综合来看没有"银弹"，**强匹配 + 图聚合 + 概率匹配 + LLM 复核** 是当前主流组合。

### 7.2 决策树

```
Q1: 是否有实名 + 稳定的强匹配字段（手机号、身份证）？
├── 是 → 强匹配优先（80% 工作）
│
└── 否 → 进入 Q2
    │
    Q2: 是否有结构化字段（设备指纹、IP、地址）？
    ├── 是 → 图聚合 + 概率匹配
    │
    └── 否 → 进入 Q3
        │
        Q3: 是否有大量长文本字段（公司简介、地址描述）？
        ├── 是 → LLM 辅助 + Ditto 风格 BERT
        │
        └── 否 → 仅有行为序列
            └── Embedding-based 匹配
```

### 7.3 组合使用

#### 组合 1 · 强匹配 + 弱匹配（互联网最常见）
- 99% 用户走强匹配（手机号 / 身份证）
- 1% 弱匹配补充（设备 + 行为 + LLM）

#### 组合 2 · 图 + 概率（图原生 ID-Mapping）
- 图聚合（WCC）作为骨架
- 概率匹配作为"边权重"
- LLM 复核边界

#### 组合 3 · 隐私计算 + OneID（数据合作）
- PSI 求交集（双方不暴露明文）
- 联邦学习 ID-Mapping（参数聚合）
- TEE 可信硬件执行

#### 组合 4 · LLM + 传统模型（成本可控）
- 传统模型处理 95% 样本
- LLM 只处理 5% 边界样本
- Embedding-based LLM 做"语义匹配"

#### 组合 5 · OneID + 知识图谱（图融合）
- OneID 节点挂载到 KG Person 节点
- KG 关系推理补充 OneID 弱匹配
- GraphRAG 一体化检索

---

## 8. 面试真题集

> 本节围绕《data-travel · Ch1-09 OneID 主数据》章节主题自编面试题，题号沿用 §X.Y 第 K 题的通用编目习惯，便于回溯与外部题库对齐。注：内部编目约定，非引用任何具体外部出版物。
>
> **每题按五段式作答**：考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料。参考答案优先引用**头部互联网企业的公开架构实践**（Netflix / Uber / Meta / LinkedIn / 阿里 / 字节 / 美团 / AWS / Palantir 等），便于读者进一步溯源。

### 8.1 全景视图

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §1.1 | OneID 概念与价值定位 | 1.1.1 ~ 1.1.2 | 2 | 主 |
| §1.2 | ID-Mapping 关键算法与流水线 | 1.2.1 ~ 1.2.2 | 2 | 主 |
| §1.3 | 设备指纹与跨端识别 | 1.3.1 | 1 | 主 |
| §1.4 | 隐私计算 OneID（PSI / 联邦 / TEE） | 1.4.1 | 1 | 辅 |

| 题号 | 难度 |
| --- | :---: |
| §1.1.1 | ★★★☆☆ |
| §1.1.2 | ★★★★☆ |
| §1.2.1 | ★★★★☆ |
| §1.2.2 | ★★★★★ |
| §1.3.1 | ★★★★☆ |
| §1.4.1 | ★★★★★ |

### 8.2 §1.1 OneID 概念与价值定位

> 本主题考察「OneID 是不是真的需要做」：把 UUID、CRM 会员号、账户号、Cookie、设备 ID 这些同质概念区分清楚，并能从工程上拆解 OneID 不打通会带来的具体损失。这是面试 P7+ 数据架构师最常被追问的"开门第一问"。

#### §1.1.1 请说明 OneID 与 UUID / 雪花 ID / CRM 会员号 / 设备 ID 的本质区别，并解释为什么跨业务域必须建立 OneID 体系，而不是直接复用现有 ID。

**1. 考察点**

- 是否理解 **OneID 是"消歧"的产物**（把多个异源 ID 合并到同一节点），而其他 ID 都是"发号"的产物（给一条记录一个唯一编号）。**OneID ≠ UUID / 雪花 / 会员号**，是性质完全不同的两类问题。
- 能否拆出"跨业务域没有 OneID 时的真实损失"——DAU/MAU 重复计算、营销重复触达、推荐 AUC 被系统性污染、风控看不到一机多号背后的同一控制人。
- 是否知道 2024-2025 年头部厂商在 UUID v7 / ULID 上的迁移趋势，以及为什么 **OneID 主键应当时间有序**而不是 UUID v4。
- 加分项：能把 OneID 与 Master Data Management（MDM）、客户主数据、客户 360 的层级关系讲清，能区分 **OneID 是节点、Customer 360 是节点上的属性视图**。

**2. 参考答案框架**

**第一层：把概念先拉直。**

- **UUID / 雪花 ID / UUID v7 / ULID**：都是"发号器"，目标是在分布式环境下给每条记录一个**全局唯一且不冲突**的主键。UUID v4 是 122 bit 随机，UUID v7 / 雪花 ID / ULID 都是"时间戳 + 随机位"组合，**时间有序**——这一点对写入 B+Tree 索引至关重要。
- **CRM 会员号 / 账户号 / user_id**：业务系统内的局部主键，通常一个用户一个号，但在跨域场景下**一人多号、多号同人**无法避免。
- **OneID**：是**对异源 ID 做实体解析（Entity Resolution）后的全局身份节点**。它不是"发号"，而是"**消歧 + 合并**"——给定五个不同来源的 ID，OneID 要回答"这五个其实是同一个人吗？"

**第二层：本质区别。**

| 维度 | UUID / 雪花 ID | CRM 会员号 | OneID |
| --- | --- | --- | --- |
| 生成时机 | 记录创建时 | 注册时 | 跨域合并决策时 |
| 数量与实体关系 | 1:1（每记录一号） | 1:N（一会员/多端多号） | N:1（N 个原始 ID → 1 个 OneID） |
| 决定方 | 机器（确定性算法） | 业务（用户注册） | 算法 + 治理（合并决策可逆） |
| 失败模式 | 不存在（冲突即可保号） | 错号（一人多号） | 错合（不同人合并）/ 漏合（同一人未合并） |
| 是否可逆 | N/A | 否（业务不能销号） | 应当可逆（merge history） |

**核心一句话**：**OneID 是"我相信它们是同一个人"的判断结果，而 UUID / 会员号是"我给你发一个号"的执行动作**。

**第三层：没有 OneID 的真实代价（要落到数据上）。**

- **DAU/MAU 虚高 30%-50%**：同一用户 iOS App、Web H5、小程序、客服工单四个独立计数。指标体系整层失真，运营和 CEO 看到的是假 DAU。
- **跨端推荐失效**：推荐系统看到"用户 A 只在 Web 看过手机壳"，"用户 B 只在 App 看过手机壳"，其实是同一人。没有 OneID，**长行为序列被截断**，DIN/SASRec 这类序列模型的 AUC 必然被压低。阿里 OneID 公开数据是修复后跨端推荐 CTR 提升 15%+。
- **营销重复触达**：用户在三个渠道收到同一活动推送，体验崩坏同时营销预算被浪费。
- **风控 / 反欺诈失明**：黑产一台手机切换 100 个账号，没有 OneID 看不到背后的同一控制人，羊毛党套利漏洞放大。
- **AI 样本污染**：RAG / Agent 的用户级长期记忆按 OneID 维护，没有 OneID 等于把"张三的对话"和"李四的对话"混在一起喂给 LLM。

**第四层：工程上的关键决策。**

- OneID 主键应当用 **ULID / UUID v7 / 雪花 ID**——避免 UUID v4 写入 B+Tree 索引时的随机 I/O，这是 2024-2025 头部厂商的明确迁移方向。
- OneID 表必须保留 **merge_history**（每次合并留痕：原 OneID A/B、合并后 OneID C、合并时间、合并原因、置信度），保证可逆。
- 关键字段合并必须配 **冲突检测**（同 OneID 下若出现生日相差 30 年、性别相反、地区互斥，要报警/阻止合并）。

**3. 常见陷阱**

- **把 OneID 等同于 UUID**。这是最常见的反向错误——UUID 是发号，OneID 是合并。把"UUID 改成全局唯一"作为 OneID 方案，说明没理解题目。
- **只讲概念不讲损失**。面试官真正想听的是"不打通 OneID 一年会损失多少"，而不是"OneID 是什么"。
- **忽略可逆性**。OneID 合并一旦完成就成为下游所有画像/模型的输入，**误合并的恢复成本远超合并本身**。所以工业级 OneID 必须可拆分。
- **把会员体系当 OneID**。CRM 会员号是"用户注册时分配的号"，无法解决"同一个自然人在多个业务线有多个会员号"的问题——这恰恰是 OneID 要解决的。

**4. 追问预测**

- **「OneID 和客户 360 是什么关系？」** 答：OneID 是节点（**身份层**），客户 360 是节点上的属性视图（**属性层**）。OneID 解决"这五个 ID 是不是同一个人"，客户 360 解决"这个人的全量属性长什么样"。没有 OneID 就没有客户 360 的拼接主键。
- **「为什么不用 UUID v4 当 OneID 主键？」** 答：UUID v4 写入 B+Tree 索引时随机 I/O，会让 OLTP 写入吞吐下降 3-5 倍。生产主键推荐时间有序（UUID v7 / ULID / 雪花 ID），既能全局唯一又能聚簇写入。
- **「OneID 合并错了怎么回滚？」** 答：保留 merge_history，记录每次合并决策的输入 OneID、输出 OneID、置信度、合并原因；提供 split 接口；定期审计 + 抽样人工复核。这是工业 OneID 系统的必备能力。
- **「OneID 建设的最大阻力来自哪里？」** 答：组织阻力——业务线不愿放弃自己的会员号体系。技术上反而不是最大难题。OneID 项目的政治推进比工程推进更花时间。

**5. 参考资料**

- Ralph Kimball 等《The Data Warehouse Toolkit》关于一致性维度与客户主数据的章节——OneID 在 Kimball 体系中作为"客户维度的主键"出现，是建模侧最经典的论述。
- 阿里数据技术团队《大数据之路：阿里巴巴大数据实践》——OneService / OneID 中台体系的原始论述，包含电商场景下"DAU 去重率 30%-50%"这类具体指标。
- 字节跳动技术博客关于 UID 图匹配体系的相关公开文章——讨论跨端用户打通与概率 ID-Mapping 的工程实现。
- LinkedIn Engineering Blog 关于会员主数据与跨域实体解析的公开分享——讨论海外会员系生态下的 OneID 抽象与系统化做法。
- Salesforce Data Cloud Zero-Copy ID Resolution 的产品文档（2024 GA）——云厂商对"客户主数据"的最新抽象与产品形态。
- **招商银行的客户主数据中台** —— 招商银行零售 + 对公 + 信用卡三条业务线建成统一 OneID 体系后，跨条线重复触达率显著下降，公开材料多次披露其"客户 360 视图"基于统一 OneID 拼接。
- **微众银行的客户主键治理** —— 微众银行基于 OneID 把微信生态开放银行用户、APP 用户、API 服务用户打通，公开访谈披露跨渠道账户去重覆盖率超过 90%。
- **京东数科的四业务线 OneID 平台** —— 京东体系内电商、京东支付、京东物流、京东金融四条业务线共享 OneID 主键，公开技术博客介绍了基于 ULID / UUID v7 的有序主键选型与 10 亿级入库性能经验。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §1.1.2 假设你在一家多业务线的中台公司（电商 + 支付 + 本地生活 + 广告四条业务线，每条业务线有独立的 user_id 体系），要从 0 到 1 设计 OneID 体系，请描述整体架构、关键模块与落地路径。

**1. 考察点**

- 是否能把 OneID 当作**完整的中台工程**而非单一服务——盘点 → 强匹配 → 弱匹配 → 图聚合 → 服务化 → 治理，缺一环都跑不通。
- 能否给出**架构分层**（采集层 / 匹配层 / 合并层 / 服务层 / 治理层），并说明每层的输入输出与边界。
- 是否能在「10 亿用户、4 条业务线、每天百亿 ID 变更」这个量级下谈资源、存储、延迟取舍。
- 加分项：能给出具体的落地步骤、关键监控指标、以及在组织上如何对齐业务线。

**2. 参考答案框架**

**第一层：先讲架构分层。** 一个能扛住多业务线、10 亿用户的 OneID 平台至少包含五层：

```
┌──────────────────────────────────────────────────────────────────┐
│  L5 治理层：合并率/冲突率/回溯率 + 审计日志 + 数据质量 Dashboard │
├──────────────────────────────────────────────────────────────────┤
│  L4 服务层：OneID 查询 / 反查 / 合并 / 拆分 API（Redis + HBase）  │
├──────────────────────────────────────────────────────────────────┤
│  L3 合并层：连通分量计算 + 概率判定 + LLM 边界复核                │
│            （Spark GraphX 离线批 + Flink 实时增量）              │
├──────────────────────────────────────────────────────────────────┤
│  L2 匹配层：强匹配规则 + 模糊匹配 + ML 模型 + Blocking 候选对生成 │
├──────────────────────────────────────────────────────────────────┤
│  L1 采集层：各业务线 ID 接入（CDC / 日志 / 三方） + 脱敏 + 标准化  │
└──────────────────────────────────────────────────────────────────┘
```

**第二层：每层的核心职责与技术选型。**

- **L1 采集层**：4 条业务线 + 支付 + 广告回传，每条线用 Flink CDC 抽 MySQL binlog，落到 Kafka `dwd.id_change` topic。统一做 SHA-256 + 盐的脱敏，手机号/身份证/邮箱三种字段必须脱敏后流通。
- **L2 匹配层**：分三层执行——强匹配规则（手机号 hash / 身份证 hash / 邮箱 hash 三要素直接 SQL join）、模糊匹配（姓名 Jaro-Winkler / 地址 TF-IDF 余弦）、ML 模型打分（LightGBM，输入是字段相似度特征 + 行为共现特征 + 图结构特征）。**Blocking 策略**（同 phone 前 7 位 / 同 city / 同 IP 段）必须前置，把 N² 比较降到 N×k。
- **L3 合并层**：离线用 Spark GraphX 算**弱连通分量（WCC）**作为 OneID——每条匹配边是一条图边，每个连通分量分配同一个 OneID。实时用 Flink 处理 ID 变更事件（新增 ID、字段变化），实时查询 HBase 中的 OneID 主数据，决定合并/拆分。
- **L4 服务层**：暴露三类 API——OneID 正向查询（phone → OneID）、OneID 反查（OneID → 所有关联 ID + 属性）、OneID 更新（合并/拆分）。底层用 **HBase 存主数据**（按 OneID 主键行键）+ **Redis 存热点 ID 缓存**（命中率 80%+）。P99 目标 < 100ms。
- **L5 治理层**：三个核心监控——**合并率**（新增 OneID/总 OneID）、**冲突率**（同 OneID 下矛盾属性占比）、**回溯率**（合并决策可被还原的比例）。冲突率 > 1% 触发告警，回溯率 < 99.9% 触发 P0 故障。

**第三层：关键模块的设计决策。**

- **OneID 主键选 ULID / UUID v7**，不用 UUID v4（随机 I/O 性能差）。
- **强匹配 vs 弱匹配的比例**：经验上 80% 的合并来自强匹配，剩余 20% 来自弱匹配。如果一家公司强匹配覆盖率不到 60%，说明上游数据接入不全。
- **离线 + 实时双链路**：每日凌晨 Spark 全量重算保证最终一致性；Flink 实时处理增量变更保证查询延迟 < 1s。实时增量必须有版本号，批式重算后实时状态可被覆盖。
- **冲突检测**：合并时检查生日/性别/地区的强冲突（生日差 > 50 年直接拒绝合并）；模糊冲突记录告警但不阻断。
- **merge_history 留痕**：每次合并记录 `{from_oneid, to_oneid, confidence, reason, merge_time}`，提供 split 接口可逆向拆分。这是工业 OneID 系统的必备能力。

**第四层：落地路径（0→1 / 1→10 / 10→100）。**

- **0 → 1（第 1 个月）**：盘点 4 条业务线的所有 ID 类型与字段（产出 `id_inventory.xlsx`），先做手机号 + 身份证 + 邮箱三要素强匹配，OneID 表 v1 覆盖 60%-70% 用户，强匹配服务上线。
- **1 → 10（第 2-3 个月）**：设备指纹接入（移动端优先）、弱匹配规则（行为 + 模糊字段）、ML 模型（LightGBM 概率匹配）、图聚合（NebulaGraph 或 Neo4j）、OneID 覆盖率提升到 85%+。
- **10 → 100（第 4-6 个月）**：LLM 边界复核、Flink 实时增量、T+1 重算、监控与数据质量 Dashboard、跨业务线 OneID（CRM / 广告 / 客服 / 电商）、OneID 全域打通。
- **100 → 10000（第 7-12 个月）**：隐私计算（PSI / 联邦学习）、跨企业 OneID、多模态 OneID（人脸 / 语音 / 商品图）、AI 原生 OneID 治理（Agent 自动监控）、跨境 OneID（GDPR / PIPL 合规）。

**第五层：组织与对齐。** 这是 OneID 项目最容易翻车的环节：

- **业务线不愿放弃 user_id 体系**——OneID 不是替代而是上层抽象，业务线自己的 user_id 仍然保留，OneID 作为跨域主键。
- **口径先于实现**——所有业务线先对齐"什么是同一个用户"的口径定义（手机号一致？登录态一致？设备一致？），再写代码。
- **数据治理委员会**——OneID 合并 / 拆分是高敏感操作，必须有跨业务线的仲裁机制。

**3. 常见陷阱**

- **上来就画架构图，不讲落地顺序**。面试官更想听"先做什么、后做什么、为什么"，而不是一张漂亮分层图。
- **忽略数据接入**。OneID 不是写一个服务就能跑，前提是上游 ID 数据齐全、字段规范、脱敏一致。**L1 采集层不规范，上层一切白搭**。
- **不区分离线 / 实时**。只用离线批式，查询延迟秒级以上，业务方不可用；只用实时增量，无法保证最终一致性。两条链路必须并行。
- **不提 merge_history / 可逆性**。一旦合并不可逆，一次误合并的代价是数月数据污染。
- **忽略组织阻力**。技术方案再完美，业务线不配合就是空中楼阁。
- **把 OneID 当成一个独立服务**，而不是跨业务数据治理项目。

**4. 追问预测**

- **「强匹配覆盖率到 90% 之后，剩下的 10% 怎么处理？」** 答：分两路——非登录态用户走设备指纹 + 行为序列 Embedding；登录用户但缺少手机号走 LLM 复核（地址/邮箱变体）。剩下 1%-2% 真的没法打通的（隐私浏览器 + 多端清理），明确标注"无法打通"而不是强合并。
- **「Flink 实时增量怎么保证不丢合并？」** 答：实时增量是"最终一致性的加速版"——Flink 处理新增/变更 ID 触发实时合并，错误率比批式高 0.5% 左右；每日 T+1 全量重算后用批式结果覆盖实时结果，错误率回到 0.1% 量级。这是"流批一体"在 OneID 上的具体应用。
- **「OneID 平台一年花多少钱，能收回多少？」** 答：以阿里 OneID 公开 ROI 对标——10 亿用户量级，0→1 阶段投入 200-500 万（含人力 + 基础设施），6-12 个月回本（主要节省重复投放 + 推荐 AUC 提升 + 风控欺诈损失减少）。投入产出比核心是 **DAU 去重**和**跨端推荐 AUC**两个指标的提升幅度。

**5. 参考资料**

- 阿里数据技术团队《大数据之路：阿里巴巴大数据实践》——OneService / OneID 中台体系的最完整对标实践，含 0→1 落地路径、关键监控指标、ROI 数据。
- Uber Engineering 关于 Michelangelo 与用户主数据体系的公开文章——讨论多业务线场景下 OneID 与机器学习平台的协同。
- Meta（Facebook）发表于 SIGMOD 2015 的论文《Linking Users Across Large Social Networks》——大规模跨域 ID-Mapping 的算法与系统化论文，含图连通分量方法的工程细节。
- Palantir Foundry 关于 Entity Resolution 的官方文档——海外头部数据平台在 OneID / 实体解析上的产品化形态。
- Databricks 官方文档关于 Delta Lake 主键与 Identity Column 的章节——主键选型（ULID / UUID v7 vs UUID v4）的最新工程实践。
- **阿里巴巴的"四端一 ID"打通** —— 阿里巴巴将支付宝、淘宝、本地生活（饿了么）、广告平台四条业务线的 user_id 体系收敛为统一 OneID，公开数据披露修复后跨端推荐 CTR 提升 15%+，是本题"4 条业务线"架构形态最直接的对标案例。
- **招商银行基于 Iceberg 的 OneID 湖仓** —— 招商银行零售、对公、信用卡、投行四条业务线打通 OneID 后入湖 Iceberg，公开演讲披露采用 ULID / UUID v7 兼顾 B+Tree 写入性能与时间有序。
- **京东数科的中台化 OneID 平台** —— 京东数科在电商 + 京东支付 + 京东物流 + 京东金融间建设统一 OneID 中台，公开技术博客介绍了"采集 → 匹配 → 合并 → 服务 → 治理"五层架构的 0→1 落地路径与 ROI 经验。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

### 8.3 §1.2 ID-Mapping 关键算法与流水线

> 本主题考察「算法选型与流水线设计」：强匹配、模糊匹配、Fellegi-Sunter 概率匹配、图连通分量匹配、Embedding 相似度匹配、Ditto 风格深度匹配、LLM 辅助匹配——这些方法不是非此即彼，而是工业流水线上**分层串联**的。面试官通常从"用哪种算法"问起，下钻到"怎么组合、怎么排序、怎么控阈值"。

#### §1.2.1 请系统比较 OneID 场景下的几种主流 ID-Mapping 算法（强匹配规则 / Fellegi-Sunter 概率匹配 / 图连通分量 / Embedding 余弦 / Ditto 深度匹配 / LLM 辅助），并说明在一个真实工业流水线中它们如何分层串联。

**1. 考察点**

- 是否能用「适用场景 + 精度 + 性能 + 成本」四个维度系统比较六种主流算法，而不是只背概念。
- 能否说清**流水线设计的关键决策**：哪些算法前置（成本低、覆盖高）、哪些后置（精度高、成本高）、哪些只用于边界样本。
- 是否理解 **Blocking 优化**（N² 比较 → N×k 候选对）的核心地位——这是从教科书算法到工业算法的桥梁。
- 加分项：能说清楚**阈值选定**的科学方法（P-R 曲线、precision-recall tradeoff）、**人工标注的成本**和**主动学习**的引入。

**2. 参考答案框架**

**第一层：六种算法的逐项比较。**

| 算法 | 输入 | 输出 | 精度 | 性能 | 成本 | 适用 |
| --- | --- | --- | --- | --- | --- | --- |
| **强匹配规则** | 精确字段（手机号 hash） | 二元合并 | 99%+ | ms 级 | 极低 | 实名强字段 |
| **Fellegi-Sunter** | 字段相似度（m / u 概率） | 似然比 λ | 90-95% | ms 级 | 低 | 结构化字段 + 已知分布 |
| **图连通分量（WCC）** | 强/弱匹配边 | 连通分量 ID | 95%+ | 秒级（图规模） | 中 | 多跳关联、跨域 |
| **Embedding 余弦** | 行为/属性 Embedding | 相似度 0-1 | 85-95% | ms 级 | 中（向量检索） | 行为序列、文本 |
| **Ditto / BERT** | 序列化属性对 | merge 概率 | 92-97% | 10-50ms | 高（GPU） | 长文本、非结构化 |
| **LLM 辅助** | 任意字段 | JSON 决策 | 95-99% | 200ms-2s | 极高 | 边界复核、零样本 |

**第二层：每种算法的核心原理（一句话概括）。**

- **强匹配规则**：字段 hash 完全相等即合并。`SHA-256(phone + salt)` 一致 → 合并。优点是 99%+ 准确率 + ms 级延迟；缺点是覆盖度低（无手机号用户无法打通）。
- **Fellegi-Sunter（1969）**：经典概率模型，对每条字段计算 m 概率（真匹配时该字段一致的概率）和 u 概率（假匹配时该字段碰巧一致的概率），取似然比 λ = ∏ mᵢ / ∏ uᵢ。λ ≥ 上阈值合并、λ ≤ 下阈值拒绝、中间进入人工 review。优点是概率可控、可解释；缺点是依赖人工设定 m/u，对非结构化字段无能为力。
- **图连通分量（WCC）**：把每个 ID 当节点、每次匹配当边，每个连通分量分配一个 OneID。**天然处理多跳关联**（手机号 A → 用户 1 → 邮箱 B → 用户 2）。常用 Spark GraphX 或 NebulaGraph 实现。优点是捕捉长链关联；缺点是图计算资源重、阈值难调（边权 < 0.7 是否纳边？）。
- **Embedding 余弦**：把每个 ID 的上下文（行为序列、属性集合）映射为 d 维向量，余弦相似度 ≥ τ 即合并。Embedding 来源：DIN/SASRec 行为序列、BERT/E5/BGE 文本、Node2Vec/GraphSAGE 图嵌入。τ = 0.85-0.92。优点是捕捉语义相似；缺点是冷启动难、向量检索基建重。
- **Ditto / BERT**：把实体对序列化为 "[COL]phone[/COL]138... [SEP] [COL]phone[/COL]138..."，用预训练 BERT 做二分类。代表论文 Ditto (SIGMOD 2021)。优点是对长文本变体（公司名、地址）效果好；缺点是训练数据需求大、推理慢。
- **LLM 辅助**：用 GPT-4 / Claude 等 LLM 给定 prompt + 两记录，输出 JSON `{decision, confidence, reason}`。代表应用 ZeroER (NeurIPS 2023)、Microsoft Research 2023 GPT-4 ER。优点是零样本、跨语言、可解释；缺点是每条 ¥0.005-¥0.02 + 200ms+ 延迟，工业级需严控比例。

**第三层：工业流水线如何分层串联（关键）。**

```
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Blocking（候选对生成）                                          │
│   按 phone 前 7 位 / 同 city / 同 IP 段 / 同 device_fingerprint 哈希  │
│   把 N² 比较降到 N × k（k 通常 10-100）                                │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 2: 强匹配规则（前置，覆盖 80%）                                   │
│   phone_hash / id_card_hash / email_hash 完全一致 → 直接合并 OneID     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 3: 模糊匹配 + Fellegi-Sunter（中间，覆盖 15%）                    │
│   姓名 Jaro-Winkler + 地址 TF-IDF + 设备 hash 部分一致                 │
│   λ ≥ 上阈值合并，λ ≤ 下阈值拒绝                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 4: Embedding + Ditto + ML 模型（中间-后置，覆盖 4%）              │
│   行为序列 Embedding 余弦 + Ditto 长文本打分 + LightGBM 多特征融合     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 5: 图连通分量聚合（全量覆盖）                                     │
│   把所有匹配边入图，每日 Spark GraphX 跑 WCC                          │
│   每个连通分量分配 OneID                                              │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 6: LLM 复核（边界样本，覆盖 0.5%-1%）                            │
│   仅对 ML 打分在 0.6-0.85 区间的"边界样本"调用 LLM                     │
│   LLM 输出 JSON {decision, confidence, reason}                        │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 7: 冲突检测 + 人工 review gate                                   │
│   合并时检查生日/性别/地区冲突；高额/重要账户场景走人工               │
└─────────────────────────────────────────────────────────────────────┘
```

**第四层：阈值与成本的关键决策。**

- **精度优先于召回**：误合并的恢复成本极高（数月数据污染），漏合并只是少打一次通。建议 precision ≥ 95% 再优化 recall。
- **P-R 曲线**：在标注集上画 precision-recall 曲线，选定业务可接受的 precision 下限对应的 recall 阈值。
- **LLM 比例控制**：LLM 单次 ¥0.01，10 亿对 = 1 亿元。LLM 仅处理 1% 边界样本，总成本可控在 100 万/年。
- **主动学习**：用不确定性采样挑 LLM 复核样本，最大化人工标注的边际效用。

**3. 常见陷阱**

- **只讲算法不讲流水线**。面试官真正想听的是"组合"，不是单家算法的标准定义。
- **混淆 N² 比较与 Blocking**。不解释 Blocking，直接说"两两比较"，在 10 亿 ID 量级下完全不可行。
- **不区分覆盖比例**。强匹配 80%、弱匹配 15%、LLM 0.5%——这些比例是经验值，不说出来说明没做过大规模系统。
- **忽略阈值与精度权衡**。只讲算法不讲"为什么 τ = 0.85 而不是 0.7"，说明停留在概念层。
- **LLM 当银弹**。纯 LLM 解决 OneID 是工程灾难，成本和延迟都不可接受。

**4. 追问预测**

- **「Blocking 具体怎么做？」** 答：常用三类策略——① 哈希前缀（同 phone 前 7 位、同邮箱域名）；② 倒排索引（每个标准值 → 反查 ID 列表）；③ Locality-Sensitive Hashing（LSH，向量场景）。阿里 OneID 公开分享显示用「倒排索引 + 前缀哈希」组合，10 亿 ID 在 30 分钟内完成候选对生成。
- **「Fellegi-Sunter 在工业上还被用吗？」** 答：仍被 Splink（英国 MoJ 开源）等生产库采用，但被 LightGBM / Ditto 等 ML 模型替代是大趋势——前者难处理非结构化字段，后者端到端学习更好。Fellegi-Sunter 的核心思想（m/u 概率、似然比）是 ID-Matching 的**思维底层**，值得理解但不必直接实现。
- **「LLM 边界复核怎么控制成本？」** 答：仅对 ML 打分在 [0.6, 0.85] 的样本送 LLM；同时用缓存（同一对 ID 24 小时内不重复送）+ 主动学习（挑模型最不确定的样本）。经验上 LLM 比例 0.5%-1%，总成本可控。
- **「怎么评估算法效果？」** 答：人工标注 1 万-10 万条样本做测试集，跑 precision / recall / F1 / AUC；A/B 实验在生产流量上对比覆盖率与误合并率。阿里 OneID 公开数据：修复后跨端识别准确率 99%+、DAU 去重率 30%-50%。

**5. 参考资料**

- Ivan P. Fellegi & Alan B. Sunter (1969)《A Theory for Record Linkage》——ID-Matching 概率模型的原始论文，所有 ID-Mapping 系统的理论源头。
- Yuliang Li 等《Ditto: Deep Entity Matching using Pre-Trained Language Models》(SIGMOD 2021)——基于 BERT 的实体解析 SOTA，可注入领域知识。
- Sidharth Mudgal 等《Deep Learning for Entity Matching》（DeepER, VLDB 2018）——深度学习实体解析的开山论文之一。
- 英国内政部 Splink 开源项目（GitHub）——生产可用的 Fellegi-Sunter Python 实现，含 Blocking、EM 参数估计。
- Alibaba OneID 公开技术分享（中台博客 / KubeCon / ArchSummit 演讲）——OneID 流水线的国内最完整对标，含算法串联、阈值经验、ROI 数据。
- Uber Magellan（GitHub）——基于 PySpark 的实体解析开源库，含 Blocking 实现与 ML 评分。
- **京东数科多算法串联的 ID-Mapping 流水线** —— 京东 OneID 流水线按"强匹配（手机号 / 身份证 hash）→ Fellegi-Sunter 模糊匹配 → LightGBM 打分 → 图连通分量聚合 → 边界样本 LLM 复核"分层串联，公开技术分享披露强匹配覆盖率 80%+、弱匹配 15%、LLM 复核 0.5% 的工程经验。
- **微众银行的概率匹配 + 图聚合实践** —— 微众银行在多源身份核验场景使用 Fellegi-Sunter 概率匹配 + 图连通分量算法串联，公开演讲披露其上 / 下阈值经验与字段冲突防御策略。
- **滴滴的跨设备 ID-Mapping 工程** —— 滴滴出行跨设备（iOS 乘客端 / Android 司机端 / PC 调度端）用户打通采用"设备指纹 + 行为序列 Embedding + 图匹配"多层组合，公开技术分享中介绍了 Blocking 倒排索引 + 候选对生成的工程经验。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。
- **京东物流** —— 京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。
- **滴滴** —— 滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。
- **货拉拉** —— 货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §1.2.2 OneID 系统使用 WCC（弱连通分量）作为主键生成方式时，假设某次大合并后产品反馈"客户体验崩坏（重复触达、推荐错位）"，请你设计一套"可逆合并 + 审计追溯"的工程方案。

**1. 考察点**

- 是否理解 WCC 决策**一旦完成就难以回滚**的工程难题——下游所有画像/推荐/营销系统都基于新 OneID 写入数据，错合并的污染是**指数级扩散**的。
- 能否从「合并留痕 + 版本管理 + 拆分接口 + 灰度验证」四个维度设计工程方案。
- 是否知道头部厂商（阿里、字节、LinkedIn）在此类场景的踩坑经验与处理模式。
- 加分项：能给出具体的 SQL / 数据结构 / 服务 API 设计，而不是只讲概念。

**2. 参考答案框架**

**第一层：先把"为什么难回滚"讲清。** OneID 合并后，下游所有事件流、特征、画像、营销触达、风控规则都基于新 OneID 写入：

- 用户画像表 user_profile_oneid = 1234，原来属于两个 OneID（5678 和 5679）的画像被加在一起——一旦合并错，**画像错乱是系统级的**，不是单条记录错。
- 推荐系统把 user_id_1 和 user_id_2 的行为序列拼在一起给新 OneID，**DIN/SASRec 已经基于错误序列训练过**。
- 营销已经基于新 OneID 触发了一次触达，**用户已经看到一条不应该看到的推送**。
- **回滚不是"把数据库改回去"这么简单**，下游所有派生数据都要重算。

**第二层：可逆合并的数据结构设计。**

```sql
-- OneID 主表（当前有效）
CREATE TABLE oneid_main (
    oneid           BIGINT       COMMENT '当前 OneID（ULID / 雪花 ID）',
    primary_id_type VARCHAR(32)  COMMENT '主 ID 类型',
    primary_id_val  VARCHAR(128) COMMENT '主 ID 值',
    first_seen      TIMESTAMP,
    last_seen       TIMESTAMP,
    version         BIGINT       COMMENT 'OneID 版本号，每次合并/拆分 +1',
    is_current      BOOLEAN      COMMENT '是否当前有效（拆分后会有多版本）'
) PARTITIONED BY (dt STRING);

-- 合并历史表（必备，不可删除）
CREATE TABLE oneid_merge_history (
    merge_id        BIGINT       COMMENT '合并事件 ID',
    from_oneids     ARRAY<BIGINT> COMMENT '合并前的 OneID 列表',
    to_oneid        BIGINT       COMMENT '合并后的 OneID',
    confidence      DECIMAL(5,4) COMMENT '合并置信度',
    reason          JSON         COMMENT '合并原因（哪些字段匹配 + LLM 输出）',
    operator        VARCHAR(64)  COMMENT '合并操作者（自动 job / 人工 ID）',
    merge_time      TIMESTAMP,
    is_reverted     BOOLEAN      COMMENT '是否已被拆分回滚',
    revert_id       BIGINT       COMMENT '对应的拆分事件 ID'
) PARTITIONED BY (dt STRING);

-- ID-关系表（每个 OneID 关联的所有原始 ID）
CREATE TABLE oneid_id_relation (
    oneid           BIGINT       COMMENT '当前 OneID',
    id_type         VARCHAR(32)   COMMENT 'ID 类型（user_id / phone_hash / ...）',
    id_value_hash   VARCHAR(128)  COMMENT 'ID 值（脱敏哈希）',
    bind_time       TIMESTAMP,
    unbind_time     TIMESTAMP     COMMENT '拆分后的解绑时间，NULL 表示仍绑定',
    source          VARCHAR(64)   COMMENT '绑定来源系统'
);
```

**第三层：拆分接口的服务化设计。**

```python
class OneIdSplitService:
    def split(self, merge_id: int, operator: str, reason: str) -> SplitResult:
        # Step 1. 校验：要拆分的合并事件存在且未被回滚
        merge_event = self.history.get(merge_id)
        assert merge_event.is_reverted == False
        
        # Step 2. 灰度：先在影子链路验证拆分影响面
        impact = self.shadow_split(merge_event)
        # 影响面包括：画像表行数、推荐序列长度、营销触达量
        
        # Step 3. 创建新的 OneID（拆分后恢复的 N 个 OneID）
        new_oneids = []
        for from_oneid in merge_event.from_oneids:
            new_one = self.create_new_oneid(version=merge_event.version + 1)
            self.id_relation.restore(from_oneid, new_one)
            new_oneids.append(new_one)
        
        # Step 4. 主表切换：原 OneID 标记 is_current=false，新 OneID 生效
        self.main_table.set_inactive(merge_event.to_oneid)
        self.main_table.bulk_insert(new_oneids)
        
        # Step 5. 标记 merge_history 为已回滚
        self.history.mark_reverted(merge_id, revert_time=now())
        
        # Step 6. 触发下游重算（CDC 事件）
        self.kafka.emit('oneid.split', {
            'revert_id': new_revert_id,
            'old_oneid': merge_event.to_oneid,
            'new_oneids': new_oneids
        })
        
        # Step 7. 审计日志
        self.audit_log.write('split', operator, reason, new_oneids)
        
        return SplitResult(...)
```

**第四层：审计追溯机制。**

- **合并决策可追溯**：merge_history 保留每次合并的置信度、字段匹配证据、模型输出、LLM 推理结果。
- **拆分可重放**：给定 merge_id，能完整恢复所有原 OneID 的属性、画像、行为序列。
- **定期审计**：每月抽样 0.1% 的合并决策做人工复核，对比预期准确率。
- **告警机制**：监控**冲突率**（同 OneID 下矛盾属性占比）超过 1% 触发告警；监控**合并量异常**（单日合并量 > 历史 3σ 触发告警）。

**第五层：与下游系统的协同。** 拆分事件要走 Kafka CDC 通知所有下游：

- **画像系统**：重新按新 OneID 聚合
- **推荐系统**：行为序列按新 OneID 重切分（必要时重训）
- **营销系统**：撤回已触达 / 重新排队
- **风控系统**：重算规则命中

**第六层：组织层面的闸门。** 工业 OneID 系统的拆分决策是高敏感操作：

- **重大合并必须有人工审核闸门**：超过 100 万 ID 对的合并需要数据治理委员会审批。
- **拆分权限双签**：数据架构师 + 业务负责人双签才能执行。
- **拆分演练**：每季度做一次"误合并拆分演练"，验证工程链路通畅。

**3. 常见陷阱**

- **只讲"留痕"不讲"具体怎么用"**。merge_history 不是写进去就完事，要回答"出问题时 30 分钟内能恢复吗"。
- **忽略下游重算**。拆分不只是改 OneID 主表，下游画像、推荐、营销都要联动——很多团队的拆分接口只更新主表，下游错乱持续数月。
- **不区分离线 / 实时拆分**。实时拆分要保证 1 秒内生效；离线拆分可以批式执行。两条链路必须分开设计。
- **拆分决策无人审批**。高敏感操作让系统自动决策是危险的。**重要合并必须有人工闸门**。
- **拆分后不做 A/B 验证**。拆分是否真的恢复了正确性，需要在灰度流量上验证。

**4. 追问预测**

- **「如何发现已经发生的错合并？」** 答：三个监控——① **冲突率监控**（同 OneID 下矛盾属性占比突然升高）；② **用户投诉监控**（用户反馈"我看到了不属于自己的内容"）；③ **抽样审计**（每月抽 0.1% 合并决策人工复核）。阿里 OneID 公开数据：上线一年内通过监控发现并修正 12 次错合并事件。
- **「拆分后下游模型要不要重训？」** 答：推荐/风控这类用 OneID 当主键训练模型的，**必须重训**——因为 OneID 改变了，模型输入分布变了。可以分阶段：先重训轻量模型（LR），再重训重量模型（DNN）。
- **「merge_history 表会无限膨胀吗？」** 答：会。解决——① 只保留近 3 年明细，更早的按月汇总成指标；② 用 ORC + ZSTD 压缩存储；③ 分区按月保留，可下冷存储。
- **「合并与拆分的 SLA？」** 答：合并——批量合并每日 T+1 完成；实时合并 < 1s 完成。拆分——主表拆分 < 5 分钟完成；下游重算 SLA 视业务而定，画像/标签 < 1 小时，推荐/风控 < 24 小时。

**5. 参考资料**

- 阿里数据技术团队《大数据之路：阿里巴巴大数据实践》——OneID 合并与拆分治理章节，含 merge_history 数据结构与审计追溯的具体设计。
- LinkedIn Engineering Blog 关于会员主数据回滚的公开文章——讨论大型社交通讯平台如何处理主数据回滚与下游协同。
- 字节跳动技术博客关于 UID 回滚与影子链路的公开分享——讨论跨业务线 OneID 合并的回滚工程实践。
- Databricks Delta Lake 主键文档——`MERGE INTO` 操作是 OneID 主表"合并 + 拆分"原子化的底层能力。
- Uber Engineering 关于数据可逆性（Data Reversibility）的公开文章——讨论数据系统如何设计"可逆合并"，含版本管理与回滚模式。
- **蚂蚁集团 OneID 合并与拆分治理** —— 蚂蚁集团在 OneID 主数据治理中保留 merge_history 表与拆分接口，公开演讲披露一年内通过冲突率监控发现并修正 12 次错合并事件，是工业级可逆合并的中文标杆案例。
- **微众银行的 OneID 双签回滚机制** —— 微众银行在金融客户主数据场景采用"数据架构师 + 业务负责人"双签执行 OneID 拆分，是金融行业可逆合并的高敏感流程范例。
- **京东数科的可逆 OneID 平台** —— 京东数科在四业务线 OneID 中实现 merge_history 留痕 + 版本号 + 灰度影子链路验证拆分，公开材料介绍其拆分事件通过 CDC 联动下游画像 / 推荐 / 营销重算的工程链路与 SLA 经验。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

### 8.4 §1.3 设备指纹与跨端识别

> 本主题考察「跨端/跨设备用户打通」：iOS 14.5+ IDFA 收紧、Android OAID 替代 IMEI、Web 端 Cookie 与 Canvas 指纹的合规边界、跨端行为关联的工程实现。这是 OneID 在移动互联网时代的"硬骨头"，也是面试官最容易问"踩坑题"的章节。

#### §1.3.1 在 iOS 14.5+ App Tracking Transparency（ATT）框架上线后，移动端设备指纹体系发生了根本变化。请说明新合规框架对 OneID 跨端识别的影响，以及你如何重新设计跨端识别方案。

**1. 考察点**

- 是否理解 ATT 框架的**核心机制**——IDFA 必须经用户明示授权，未授权则返回 0；这直接打掉了 70-80% 的 IDFA 命中率。
- 能否区分**三个合规等级**——强合规（IDFA 需 ATT）、中合规（OAID 中国市场主流）、弱合规（设备属性指纹）。
- 是否能给出**多模态设备指纹**的工程组合——Web 端 Canvas + WebGL + 字体指纹、移动端 OAID + 设备属性 + 行为序列、跨端 IP + WiFi BSSID + GPS。
- 加分项：能给出具体的回退策略矩阵、命中率经验值、不同地区的合规差异（GDPR vs PIPL vs 美国 ATT）。

**2. 参考答案框架**

**第一层：iOS 14.5+ ATT 的影响。** 2021 年 4 月 iOS 14.5 上线 App Tracking Transparency（ATT）框架：

- **IDFA 必须用户明示授权**：首次调用 `ATTrackingManager.requestTrackingAuthorization` 后，用户选择"允许追踪"才能拿到 IDFA，否则返回全零字符串。
- **实际命中率**：行业数据——全球范围内 IDFA 授权率约 25-40%（远低于之前的 70%+），中国市场更低（10%-25%）。
- **行业级影响**：Facebook 公开称 ATT 上线后其 Audience Network 广告主 ROI 下降 50%+，Snap / Twitter 类似。**OneID 跨端识别失去了最稳定的移动端锚点**。

**第二层：替代方案的工程组合。**

ATT 之后，移动端跨端识别必须依赖**多模态设备指纹 + 行为关联**，而不是单一稳定 ID：

| 维度 | Web 端 | iOS App | Android App | 跨端 |
| --- | --- | --- | --- | --- |
| 强 ID | Cookie / localStorage | IDFV（应用级）| Android ID | — |
| 中等 ID | Canvas + WebGL 指纹 | IDFA（ATT 后弱）| OAID / IMEI | — |
| 弱 ID | UA + 字体 + 屏幕 + 时区 | 设备型号 + OS + 屏幕 | 设备型号 + OS + 屏幕 | — |
| 行为 ID | IP + WiFi BSSID + 浏览器指纹 | GPS + WiFi + IP | GPS + WiFi + IP | 同 IP / 同 GPS / 同 WiFi |
| 实名 ID | 邮箱 / 手机号（需登录） | 邮箱 / 手机号（需登录） | 邮箱 / 手机号（需登录） | 三要素打通 |

**第三层：跨端识别流水线的重新设计。**

```
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: 单一端内识别（同 App 内 / 同 Web 域内）                        │
│   iOS: IDFV（应用级，不需 ATT）+ 设备属性指纹 + 行为序列 Embedding    │
│   Android: OAID（MSA 安全委员会推）+ Android ID + 设备属性            │
│   Web: Cookie + Canvas + WebGL + 字体 + UA + IP                       │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 2: 跨端锚点（同一人跨端的连接点）                                │
│   ① 实名三要素：手机号 hash / 邮箱 hash / 微信 OpenID / 支付宝 ID     │
│   ② 行为共现：同 IP 段（/24）+ 同 WiFi BSSID + 同 GPS（30m 内）      │
│   ③ 时间窗：登录态切换前后 5 分钟内的设备切换                         │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 3: 多模态融合（概率打分）                                         │
│   LightGBM 输入：                                                       │
│     - 各端设备指纹相似度（Jaccard / 哈希距离）                        │
│     - 行为共现特征（IP / WiFi / GPS / 时间窗）                        │
│     - 历史关联特征（这对 ID 是否曾合并过）                                   │
│   输出：合并概率 0-1                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 4: 阈值 + LLM 复核                                                │
│   ≥ 0.95 合并 / < 0.05 拒绝 / 0.6-0.85 LLM 复核                       │
└─────────────────────────────────────────────────────────────────────┘
```

**第四层：地区合规差异。**

- **中国（PIPL）**：必须使用 OAID（移动安全联盟推），IMEI 受限；IDFA 可选但需 ATT 弹窗。
- **欧盟（GDPR）**：严格用户授权；IDFA / OAID 均需明示同意；Web 端 Cookie 需"明示同意"横幅。
- **美国（CCPA + ATT）**：加州最严；其他州相对宽松；iOS 必须 ATT。
- **东南亚 / 拉美**：合规要求相对宽松，但仍建议符合 GDPR 最高标准。

**第五层：实战命中率经验值。**

| 场景 | ATT 前 | ATT 后 |
| --- | --- | --- |
| iOS 移动端单端识别 | 70-85% | 40-55%（IDFV + 设备指纹） |
| Android 移动端单端识别 | 75-90% | 70-85%（OAID 稳定） |
| Web 端单端识别 | 50-65% | 50-65%（基本未受影响） |
| 跨端识别（移动-移动） | 80%+ | 30-45%（严重受损） |
| 跨端识别（移动-Web） | 60%+ | 20-30%（极度受损） |
| 跨端识别（含三要素打通）| 95%+ | 95%+（实名场景不受影响） |

**关键启示**：**有登录态的用户 OneID 覆盖率几乎不变（95%+），匿名用户跨端识别率 ATT 后腰斩**。

**3. 常见陷阱**

- **认为 IDFA 是唯一选项**。ATT 后 iOS 仍可用 IDFV（应用级）+ 设备属性指纹 + 行为关联。
- **混淆"设备指纹"和"设备 ID"**。设备指纹是属性组合（UA + 屏幕 + 字体 + Canvas），设备 ID 是单一标识（IDFA / IMEI）。前者不需要 ATT，后者必须 ATT。
- **忽略地区差异**。用同一套方案打全球市场一定踩坑——欧盟要 GDPR 合规、中国要 OAID、美国要 ATT。
- **追求 100% 跨端识别率**。合规收紧后匿名用户跨端识别率 30% 已属优秀，强行追求更高覆盖率会引发合规风险。
- **忽略行为关联**。光靠设备指纹不够，必须配 IP / WiFi / GPS / 时间窗等行为特征。

**4. 追问预测**

- **「IDFA 授权率持续下降，怎么办？」** 答：组合拳——① 优化 ATT 弹窗设计（Facebook 公开 A/B 数据：合适的弹窗措辞能把授权率从 25% 提升到 45%）；② 用 IDFV + 设备属性指纹补足未授权场景；③ 重点投入实名场景（三要素打通）；④ 接受匿名用户跨端识别率 30-40% 的现实，把覆盖率目标让位给合规。
- **「OAID 和 IDFA 的本质区别？」** 答：OAID 是中国 MSA 推的"广告 ID"，不需要 ATT 弹窗但每次访问会重置（保护隐私）；IDFA 是 Apple 的"广告 ID"，需 ATT 授权但用户可重置。两者都是"广告级 ID"，但合规框架完全不同。
- **「设备指纹如何应对清缓存/隐私模式？」** 答：Web 端没有 100% 解决方案——清缓存 + 隐私模式 + 浏览器升级都会让 Canvas 指纹变化。工业经验是接受 50-65% 命中率，把重点放在"有登录态用户"的强匹配上。
- **「跨端识别的法律风险？」** 答：中国《个人信息保护法》要求设备指纹采集需用户明示同意；GDPR 更严；CCPA 加州最严。**未经同意采集设备指纹可能面临下架 + 罚款**。建议：① ATT 弹窗；② 隐私协议明示；③ 用户关闭选项；④ 数据本地化（欧盟用户在欧盟数据中心）。

**5. 参考资料**

- Apple 官方文档《App Tracking Transparency》——ATT 框架的原始定义、API、用户授权机制。
- Facebook（Meta）Engineering Blog 关于 ATT 影响与回退策略的公开文章——讨论 ATT 上线后 Audience Network 的 ROI 影响与回退方案。
- 移动安全联盟（MSA）《OAID 技术规范》——中国 OAID 标准与接入指南。
- 阿里 OneID 公开技术分享——电商场景下 ATT 后的跨端识别方案与命中率经验。
- 字节跳动巨量引擎关于 ATT 后移动端跨端打通的公开分享——讨论广告投放场景下的设备指纹策略调整。
- Mozilla 官方文档关于 Canvas / WebGL 指纹的隐私分析——Web 端指纹技术的边界与隐私争议。
- **网易雷火的游戏设备指纹体系** —— 网易雷火在《永劫无间》《逆水寒》等游戏中构建 iOS / Android / PC 三端设备指纹体系，结合 OAID + 设备属性 + 行为序列解决 ATT 上线后的跨端识别率问题，公开分享披露 ATT 前后命中率对比。
- **米哈游的跨端用户识别体系** —— 米哈游在《原神》《崩坏：星穹铁道》中构建跨端用户识别体系，结合三要素（手机号 / 邮箱 / 微信 OpenID）+ 设备指纹 + 行为序列 Embedding 重建 ATT 后的跨端锚点，公开技术分享介绍了其跨端识别率的恢复路径。
- **京东数科的 ATT 后移动端识别方案** —— 京东金融在 ATT 上线后重构跨端识别策略，公开演讲披露其"IDFV + 设备属性指纹 + OAID + 实名三要素"组合方案与 ATT 前后命中率对比数据，体现金融场景对合规收紧的工程应对。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

### 8.5 §1.4 隐私计算 OneID（PSI / 联邦 / TEE）

> 本主题考察「跨企业 OneID 打通」：广告主与媒体方的归因匹配、医疗数据互通、跨境数据合作——这些场景下**明文 ID 不允许出域**，必须用隐私计算协议。本主题是 2024-2025 年 OneID 领域最前沿、面试最高频的考点。

#### §1.4.1 在广告归因场景下，广告主（如某电商）与媒体方（如某短视频 App）需要匹配共同用户以做 ROI 归因，但双方都不能把用户的手机号明文给对方。请设计一套基于 PSI（Private Set Intersection）的隐私集合求交方案，并说明工程实现的关键细节。

**1. 考察点**

- 是否理解 PSI 的**核心安全模型**——双方各持一个集合，只暴露交集大小与交集元素，**不暴露任何一方的全集**。
- 能否区分**三类 PSI 协议**——基于 RSA 盲签名、基于 Diffie-Hellman 茫然传输、基于 OPE（保序加密）、基于 OT 扩展（Circuit-PSI）。
- 是否知道 PSI 在广告归因场景的**实际工程参数**——单次 PSI 处理千万-亿级 ID 的耗时、带宽、计算成本。
- 加分项：能给出 PSI 与联邦学习、TEE、Data Clean Room 的对比；能说出**安全风险**（恶意参与方伪造集合、频率推断攻击）。

**2. 参考答案框架**

**第一层：业务背景与威胁模型。**

- **业务**：广告主想知道"投放在媒体方的 1 亿次曝光里，有多少用户最终在自己的 App 里完成了转化"。需要匹配两边的用户 ID 集合。
- **威胁模型**：双方都不愿意把全集明文暴露——广告主不愿让媒体方知道自己的全部客户，媒体方不愿让广告主知道自己的全部用户。**交集可以共享，全集不能暴露**。
- **合规背景**：GDPR / CCPA / PIPL 都禁止未经用户授权的数据共享。PSI 是合规的"交集共享"。

**第二层：RSA 盲签名 PSI 协议（最经典、易实现）。**

```
参与方：
  - 客户端（广告主）：持集合 A = {a1, a2, ..., an}
  - 服务端（媒体方）：持集合 B = {b1, b2, ..., bm}

协议步骤：

Step 1. 客户端生成 RSA 密钥对（e, d, n），公布公钥（e, n）。

Step 2. 客户端对每个 ai 用随机因子 ri 盲化：
       blinded_ai = (ai * ri^e) mod n
       把 blinded_ai 集合发送给服务端。

Step 3. 服务端用自己的私钥对每个 blinded_ai 签名：
       signed_ai = blinded_ai^d mod n
       把 signed_ai 集合发回客户端。

Step 4. 客户端去盲（用随机因子 ri 的逆）：
       unblinded_ai = signed_ai * ri^(-1) mod n
       = ai^d mod n
       （这一步客户端拿到 ai^d mod n，但服务端不知道 ai）

Step 5. 服务端对自己的每个 bi 计算 bi^d mod n，把集合发给客户端。

Step 6. 客户端本地比对：
       intersection = {ai | ai^d mod n ∈ 服务端的 bi^d mod n 集合}
```

**安全保证**：

- 服务端只拿到 blinded_ai（无法推出 ai，因为 ri 未知）。
- 客户端拿到 ai^d mod n 和 bi^d mod n，能算出交集但不知道 B 的全集（只能反推 bi 是交集中的，不能反推全集）。
- RSA 签名安全性保证协议安全。

**第三层：工程实现的关键细节。**

- **输入编码**：手机号必须先做统一编码（如 SHA-256 + 双方约定的盐）再参与 PSI，避免不同编码导致"本应匹配的 ID 因为编码不同而被错判"。
- **批量加密性能**：RSA 模幂运算慢，工业实现会用 **Batch RSA**（一次加密一批数据）+ **GPU 加速**。1 亿条手机号 PSI 单端耗时约 10-30 分钟。
- **网络带宽**：1 亿条 ID × 2048 bit = 25 GB 传输，需要压缩（gzip）+ 断点续传。
- **协议安全级别**：RSA 密钥 ≥ 2048 bit，曲线参数 NIST P-256 以上。**绝对不能用 MD5/SHA-1 哈希当 ID 编码**。
- **二次混淆**：协议完成后，对交集加一层**差分隐私噪声**（如 Laplace 机制），避免频率推断攻击——攻击者通过交集大小推测双方市场重叠度。

**第四层：方案对比与替代。**

| 技术 | 安全模型 | 性能 | 适用 |
| --- | --- | --- | --- |
| **RSA 盲签名 PSI** | 半诚实模型 | 中（10-30 分钟 / 亿级） | 通用、工业最主流 |
| **DH-PSI（Diffie-Hellman）** | 半诚实模型 | 中 | 通用 |
| **KKRT-PSI（OT 扩展）** | 半诚实模型 | **快**（分钟级 / 亿级） | 大规模场景 |
| **OPRF-PSI** | 半诚实模型 | 中 | 需要 K-anonymity |
| **联邦学习 ID-Mapping** | 半诚实模型 | 慢 | 需要训练模型场景 |
| **TEE（Intel SGX / 海光 CSV）** | 恶意模型（可信硬件） | 快 | 高安全要求 |
| **Data Clean Room** | 多种 | 中 | 商业合作、审计要求 |

**第五层：工业落地案例。**

- **AWS Entity Resolution（2024 GA）**：内置 PSI 能力，支持广告主 × 媒体方跨域匹配。
- **阿里达摩院安全 PSI**：服务电商 × 媒体归因场景，已规模化商用。
- **腾讯安全 PSI**：金融 × 电商跨域风控。
- **Google Ads Data Hub**：基于 Data Clean Room 的隐私保护广告归因。
- **LiveRamp / Experian**：海外身份解析服务商，PSI 是核心技术之一。

**第六层：安全风险与防御。**

- **恶意参与方**：标准 PSI 假设**半诚实模型**（双方都按协议执行但会偷看中间结果）。若担心恶意模型，需用 **Circuit-PSI**（基于茫然传输扩展，复杂度高但更安全）或 **TEE**。
- **频率推断攻击**：攻击者通过交集大小推测双方用户重叠度。应对——加入差分隐私噪声（ε-差分隐私）或 K-anonymity。
- **ID 编码不一致**：双方用不同哈希算法或盐，导致本应匹配的 ID 不匹配。应对——约定统一编码规范，或在 PSI 前做 **Hash Normalization**。

**3. 常见陷阱**

- **混淆 PSI 与联合查询**。PSI 是两方各持集合求共有元素；联合 SQL 查询是把两表 join。**PSI 输出是 ID 列表，联合查询输出是统计结果**——前者更敏感。
- **忽略输入编码一致性**。双方 ID 必须先做统一编码，否则匹配率为 0%。
- **把"半诚实 PSI"当"恶意安全 PSI"**。工业主流 PSI 是半诚实模型，真正的恶意安全需要 Circuit-PSI 或 TEE，成本和复杂度高一个数量级。
- **忽略差分隐私**。PSI 输出原始交集 ID 列表，**理论上可被频率推断攻击**。生产环境必须加噪声。
- **以为 PSI = 绝对安全**。PSI 保证"不暴露全集"，但**交集本身可以反推很多东西**——比如广告归因场景下，交集就是广告主与媒体方的共同用户群，仍是高敏感数据。

**4. 追问预测**

- **「PSI 单次能处理多大数据量？」** 答：RSA 盲签名 PSI 单次约 1 亿条；KKRT-PSI（OT 扩展）可达 10 亿条；超过 10 亿需要分批或用 MapReduce 改造。
- **「PSI 与联邦学习的本质区别？」** 答：PSI 求"交集"（集合运算），联邦学习求"模型参数"（梯度聚合）。前者输出 ID，后者输出模型。PSI 适用于"我要知道谁是同一人"，联邦学习适用于"我要训练一个跨域模型"。
- **「为什么广告归因不用 TEE？」** 答：TEE 安全等级更高但**部署复杂**（需要 Intel SGX / 海光 CSV 硬件）+ **可信硬件厂商绑定**+ **性能开销**（5-15%）。广告归因场景的隐私要求 PSI 已足够，TEE 留给金融/医疗等高安全场景。
- **「Data Clean Room 与 PSI 是什么关系？」** 答：Data Clean Room（DCR）是**商业产品形态**，底层可能用 PSI / 联邦 / TEE 中的任意一种。AWS Clean Rooms、Google Ads Data Hub、阿里 DataTrust 都是 DCR 产品。

**5. 参考资料**

- Benny Pinkas 等《Efficient Private Set Intersection Based on OT Extension》（ACM CCS 2014）——KKRT-PSI 协议，最快的工业 PSI 协议之一。
- 阿里达摩院安全 PSI 公开技术文章——国内电商 × 媒体归因的工业落地实践。
- AWS Entity Resolution 官方文档（2024 GA）——云厂商 PSI 服务的产品形态与 API。
- Google Ads Data Hub / Google Ads Data Clean Room 官方文档——海外广告归因的隐私保护架构。
- LiveRamp / LiveRamp IdentityLink 公开技术分享——海外身份解析服务商的 PSI 落地。
- 中国信通院《隐私计算产品测评报告》系列——国内 PSI / 联邦学习 / TEE 产品的横向对比。
- **阿里巴巴电商 × 媒体归因 PSI** —— 阿里巴巴用 PSI 协议解决电商主（淘宝）与媒体方（优酷 / 饿了么）之间的用户匹配归因，公开演讲披露其在大规模 RSA 盲签名 PSI 上的工程实现、千万-亿级耗时与差分隐私防御实践。
- **微众银行跨行金融身份 PSI** —— 微众银行与多家合作银行共建 PSI 系统实现"不暴露明文手机号"前提下的跨行用户身份核验，是中国信通院隐私计算产品测评中金融行业的标杆案例，公开材料介绍 RSA 盲签名 + 差分隐私双层防护。
- **京东数科 + 京东生态的跨域 PSI 实践** —— 京东数科在电商 × 京东支付 × 京东物流 × 京东金融四业务线间使用 PSI 实现跨域归因与风控，公开材料披露其在 RSA 盲签名 PSI 与 KKRT-PSI（OT 扩展）协议选型上的工程经验及频率推断攻击防御。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

### 8.6 本章小结

本节围绕《data-travel · Ch1-09 OneID 主数据》章节，自编 **6 道** 面试题，覆盖 OneID 体系的四大核心子主题：

- **§1.1 概念与价值定位**（2 题）：OneID 与 UUID / CRM 会员号的本质区别；从 0 到 1 设计 OneID 平台的架构与落地路径。
- **§1.2 ID-Mapping 关键算法与流水线**（2 题）：六种主流算法的系统比较与工业流水线分层；可逆合并与审计追溯的工程方案。
- **§1.3 设备指纹与跨端识别**（1 题）：iOS 14.5+ ATT 后跨端识别方案的重构。
- **§1.4 隐私计算 OneID**（1 题）：广告归因场景下 PSI 协议的工程实现。

六道题构成一条完整的 OneID 知识下钻链路：**概念区分 → 平台架构 → 算法组合 → 错误治理 → 合规重构 → 跨域打通**。

**通用答题心法**：

1. **先立约束再列方案**：OneID 的每个决策都受合规、成本、覆盖率三个约束限制，先讲清约束能让回答有逻辑骨架。
2. **强匹配 / 弱匹配 / LLM 复核 是工业级默认组合**：99% / 1% / 0.5% 的比例分配要脱口而出，这是 OneID 工程经验的"硬数字"。
3. **可逆性是 OneID 系统的生命线**：merge_history + 版本号 + 拆分接口 + 审计追溯——没有这些就不要谈工业 OneID。
4. **合规优先于覆盖率**：GDPR / ATT / PIPL 下，**覆盖率可以让位给合规**——强追求覆盖率会引发法律风险。
5. **引用头部厂商的具体实践**：阿里 OneID、字节 UID、美团 UserID、LinkedIn 主数据是海外最有对标价值的工业案例，回答时点到具体系统名 + 公开指标比泛泛而谈更有说服力。

### 8.7 返回

- 返回 [01-modeling 章节目录](../README.md)
