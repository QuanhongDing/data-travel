> 本文件是 **03-byte-data-architecture.md** 的子文件（§7. 与同类案例对比）。完整章节请回到 [index](03-byte-data-architecture.md)。

## 7. 与同类案例对比

### 7.1 对比维度

| 维度 | 字节跳动 | 阿里 | 美团 | Netflix |
| --- | --- | --- | --- | --- |
| 主导思想 | 数据驱动 + AB 实验 | 中台一体化 | 业务驱动 + 平台化 | 数据自由 + 自治 |
| 核心资产 | AB 平台 + 推荐中台 | OneData + OneID | Feature Store + 美团 ML | Iceberg + Spark + Flink |
| OLAP | ByteHouse（ClickHouse） | Hologres | ClickHouse | Iceberg + Spark |
| 实时能力 | 强实时推荐 | Blink + Flink | 实时特征 | Keystone + Flink |
| 商业化 | 火山引擎 | 阿里云 | 美团 ToB | Netflix 开源 |
| 大模型 | 豆包 + 扣子 | 通义 + 百炼 | 美团大模型 | Netflix Maia |

### 7.2 取舍

- **字节 = 数据驱动 + AB 实验 + 算法驱动**——把"实验"作为决策基础。
- **阿里 = 中台一体化 + 商业化**——把"中台"作为基础设施。
- **美团 = 业务驱动 + 平台化**——把"业务落地"作为价值核心。
- **Netflix = 自由 + 自治 + 创新**——把"工程师自治"作为组织文化。

**对架构师的启示**：

- **学 AB 实验文化**——这是字节最大的可借鉴资产。
- **学推荐中台思路**——但要按业务规模裁剪。
- **学火山引擎 ToB 模式**——字节内部能力外溢是 ToB 成功的关键。
- **不要照搬 ByteHouse**——很多场景 ClickHouse 原版够用。

---
