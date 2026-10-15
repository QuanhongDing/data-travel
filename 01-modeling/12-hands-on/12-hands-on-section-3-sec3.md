> 本文件是 **12-hands-on.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](12-hands-on.md)。

## 3. 设计模式与范式

### 3.1 主要落地方案

| 方案 | 适用场景 | 工具组合 |
| --- | --- | --- |
| **传统数仓（Inmon）** | 金融、国企 | PowerDesigner + Oracle + Informatica |
| **维度建模（Kimball）** | 互联网、电商 | DataWorks + MaxCompute + Hologres |
| **Data Vault + 维度建模** | 金融、监管 | DataVault + dbt + Snowflake |
| **湖仓一体（Lakehouse）** | AI / 大数据 | Iceberg/Hudi/Paimon + Spark + Flink + dbt |
| **AI 原生数据栈** | AI 智能体平台 | Databricks + Unity Catalog + dbt + LLM |
| **数据网格（Data Mesh）** | 大型跨国企业 | 联邦化 + 自服务 + 数据契约 |

### 3.2 选型决策表

| 业务特征 | 推荐方案 | 理由 |
| --- | --- | --- |
| 阿里云生态 + 中型互联网 | DataWorks + MaxCompute | 阿里方法论最成熟 |
| 字节跳动 / 火山引擎 | DataFinder + ByteHouse | 字节内部工具云化 |
| 美团 / 京东 / 拼多多 | 自研中台 + Flink | 大厂自研能力强 |
| 跨云 / 全球化 | dbt + Snowflake / Databricks | 跨云中立 |
| AI 优先 / 智能体平台 | Databricks + Unity Catalog + dbt | AI 原生 |
| 传统行业 / 国企 | 华为 DAYU / 阿里 DataWorks | 国产化合规 |

### 3.3 反模式与陷阱

| 反模式 | 表现 | 后果 | 如何避免 |
| --- | --- | --- | --- |
| **工具堆砌** | 买了全套工具但只用 10% 功能 | 浪费资源 | 先用最小工具链，迭代扩展 |
| **照搬方法论** | 直接照搬阿里 OneData 到自己公司 | 不适用 | 先做适配改造，再大规模推行 |
| **过度建模** | 几千张表的过度规范化 | ETL 性能差 | 用"业务过程粒度四问"过滤 |
| **缺乏 Owner** | 模型上线后无人负责 | 慢慢失效 | 强制 Owner 必填 |
| **忽略实时** | 全部离线，实时靠补丁 | 时效性差 | 实时 / 离线双链路设计 |
| **缺乏 AI 集成** | 工具链完全没人升级 | 落后于时代 | 引入 Copilot、自动化 |

---
