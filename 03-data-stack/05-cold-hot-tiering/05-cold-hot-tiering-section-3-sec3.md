> 本文件是 **05-cold-hot-tiering.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](05-cold-hot-tiering.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：HDFS Archive Storage（本地数据中心分层）**

- HDFS 不同 DataNode 用 SSD / HDD。
- 冷数据用 ALLSSD / DISK 策略。
- 适用：本地数据中心。

**模式 2：对象存储分层（S3/OSS/COS）**

- S3 Standard → IA → Glacier → Deep Archive。
- OSS 标准 → 低频 → 归档 → 冷归档。
- 适用：云原生。

**模式 3：统一存储分层（Ceph / JuiceFS / JindoFS）**

- 同时支持 HDFS / S3 协议。
- 多级介质 + 智能调度。
- 适用：混合云。

**模式 4：表级分层（Iceberg / Hudi）**

- Iceberg V2 分区统计 + 自动分层。
- Hudi COW / MOR 自动迁移。
- Paimon LSM 冷数据合并。
- 适用：Lakehouse。

**模式 5：智能分层（S3 Intelligent-Tiering / OSS 智能分层）**

- 云厂商托管的自动分层。
- 监控访问模式 + 自动迁移。
- 适用：所有云上数据。

**模式 6：AI 驱动的自动分层（2024+）**

- LLM 预测访问模式 + 自动迁移。
- 工具：Iceberg V3 + ML / 自研 + LLM。

**模式 7：多云分层**

- 跨云对象存储分层（AWS S3 + 阿里 OSS + Azure Blob）。
- 适用：跨国企业。

### 3.2 适用场景决策表

| 业务场景 | 推荐模式 | 典型技术栈 |
| --- | --- | --- |
| 本地数据中心 | HDFS Archive Storage + 多介质 | HDFS + SSD/HDD |
| 云原生 | 对象存储分层（S3/OSS） | S3 Standard + IA + Glacier |
| 混合云 | 统一存储分层 | Ceph + JuiceFS / JindoFS |
| Lakehouse | 表级分层 | Iceberg V2 / Hudi / Paimon |
| 智能自动分层 | 云厂商智能分层 | S3 Intelligent-Tiering、OSS 智能 |
| AI 训练 | AI 驱动分层 | Iceberg V3 + ML |
| 跨国合规 | 多云分层 | 跨云对象存储 + 加密 |

### 3.3 反模式与陷阱

**反模式 1：全用 SSD**

- 所有数据存 SSD，成本失控。
- **正确**：分层存储，冷数据存对象。

**反模式 2：分层规则不合理**

- 把热数据迁到冷层，查询变慢。
- **正确**：基于真实访问模式调整规则。

**反模式 3：忽视回迁（Recall）**

- 冷数据被访问时，需要回迁到热层（增加成本 + 延迟）。
- **正确**：合理预测访问模式 + 设置缓存。

**反模式 4：归档数据未做合规检查**

- 数据已过期但未删除（合规风险）。
- **正确**：明确保留期限 + 自动过期删除。

**反模式 5：未做压缩**

- Parquet + ZSTD 压缩比可达 5-10x，未压缩浪费空间。
- **正确**：列存 + ZSTD / Snappy 压缩。

**反模式 6：跨层访问性能差**

- 频繁跨层查询（热 + 冷），网络带宽成为瓶颈。
- **正确**：缓存热数据 + 异步预加载。

---
