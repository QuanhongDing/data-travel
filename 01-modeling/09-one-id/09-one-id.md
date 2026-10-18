# OneID 主数据：跨域用户打通与 ID-Mapping

> **一句话定位**：跨业务、跨设备、跨域的"同一实体识别"——数仓侧的主数据底座，AI 时代一切个性化与图推理的前置条件。

> 本文是 data-travel 项目 [Ch1 · 建模方法论](../../README.md) 的子章节（09-one-id）。覆盖 **R3 数据建模** 能力域中 **OneID（Entity Resolution）** 主数据管理相关的核心能力：跨域用户打通、ID-Mapping 算法、设备指纹、主数据建模、概率匹配、Embedding-based 实体解析、LLM 辅助实体识别、隐私计算下的 ID 打通，以及 2024-2025 年的工业级 OneID 平台演进。

---

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| OneID 是什么、为什么它是跨域数据联通的第一道工程门槛 | §1.1、§1.2 |
| OneID 在 AI 数据架构里处于什么位置、与相邻章节是什么关系 | §1.3 |
| 从单库单域到 LLM 增强实体解析的五阶段演进脉络 | §1.4 |
| Fellegi-Sunter 似然比、连通分量、Embedding 相似度怎么算 | §2.2.1—§2.2.5 |
| 规则 / 模糊 / 图 / LTR / 深度 / LLM 六类 ID-Mapping 算法怎么选 | §2.3.1—§2.3.6 |
| OneID 与 UUID / 雪花 ID / Cookie / 设备 ID / CRM 会员号 / GraphRAG 实体的区别 | §2.4 |

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

**一句话总结**：OneID 是 **企业数据从"分块堆叠"走向"联通资产"的第一道工程门槛**——不是可做可不做的可选项。P7 不做 OneID 数仓照样能跑，P8 不做 OneID 智能体平台就是空中楼阁。

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
- **Ch7-01 长期记忆**：Agent 的记忆按实体标识（user_id / 实体链接）维护，与本主题的 OneID 是同一类问题

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
- 关键论文：DeepER (VLDB 2018)、Ditto（Yuliang Li 等，2020）、HierMatcher (NeurIPS 2021)。

**阶段 5 · 2023-2025：LLM 增强实体解析（Generative ER）**

- 利用 LLM 进行实体解析推理，尤其在长文本属性（地址、姓名、公司名）匹配上超越传统模型。
- 利用 LLM 进行 OneID 属性的自然语言解释、OneID 合并原因的可解释性输出。
- 利用 LLM 做"自然语言级"的实体识别（"张三"和"Zhang San"、"张總"、"张 3 先生"是同一人吗？LLM 答 yes）。
- 关键论文：GPT-4 Entity Resolution (Microsoft Research 2023)、Ditto+LLM，以及 ZeroER 一线的零样本实体解析工作。
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
| **实体解析（Entity Resolution, ER）** | 学术与系统领域的统称，包含 blocking、matching、clustering | 见 §2.3（blocking 见本表「Blocking」行） |
| **设备指纹（Device Fingerprint）** | 浏览器/设备的稳定标识（UA + 屏幕 + 字体 + 插件 + canvas 等） | 命中率 70-90% |
| **设备 ID** | 移动端的稳定 ID（IDFA / OAID / IMEI / Android ID / MAC） | IDFA iOS14 后需授权 |
| **手机号三要素** | 手机号 + 姓名 + 身份证号三字段组合 | 强匹配主流 |
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
print(jaro_winkler_similarity("张三", "Zhang San"))    # 0.0（汉字与拼音无共同字符，Jaro 为 0）
print(jaro_winkler_similarity("张三", "张三丰"))      # ≈0.91（共享 2 字前缀，JW 对前缀加权）
```

注意第一行：**同一个人写成不同书写体系时（「张三」与「Zhang San」），Jaro-Winkler 这类字符级相似度直接归零**——这类对齐要靠音译归一、embedding 或 LLM（见 §2.3.6）；第二行的数值随实现的前缀加权参数略有差异，请以所用库的当前版本为准。

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
- **Ditto（Yuliang Li 等，2020）**：基于预训练 BERT 的实体解析 SOTA，可注入领域知识
- **HierMatcher (NeurIPS 2021)**：层次化匹配（先 entity 级，再 value 级）
- **ZeroER（零样本实体解析）**：不依赖人工标注的训练数据完成匹配；篇名与发表会议请按题名与作者检索原文核验

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
| 信息熵 | 122 bit | 74 bit | 22 bit | 80 bit |
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

> 💡 **思考锚点**：拿你们正在用的那条弱匹配规则（比如设备指纹，命中率 70-90%），按 §2.2.1 把它的似然比 λ = m/u 算一遍：它落在合并阈值之上、之下，还是中间那一档？落在中间时，你们是靠人工 review，还是让一条错边通过连通分量把两个人的 ID 并成一个？

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](09-one-id-section-3-sec3.md)
- [§4. 工程实现](09-one-id-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](09-one-id-section-5-ai.md)
- [§6. 落地实践](09-one-id-section-6-sec6.md)
- [§7. 与其他方法对比](09-one-id-section-7-sec7.md)
- [§8. 面试真题集](09-one-id-section-8-sec8.md)

---
