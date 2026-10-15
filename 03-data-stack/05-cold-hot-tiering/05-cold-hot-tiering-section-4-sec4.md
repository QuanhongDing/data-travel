> 本文件是 **05-cold-hot-tiering.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](05-cold-hot-tiering.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：分析访问模式（2-4 周）**

- 统计每个数据集的访问频率。
- 识别热数据 / 冷数据。
- 输出：分层策略（哪些数据多久后迁到冷层）。

**Step 2：选型存储介质（1-2 周）**

- 云端：S3 / OSS / COS。
- 本地：HDFS + SSD/HDD。
- 混合：Ceph / JuiceFS / JindoFS。

**Step 3：配置生命周期规则（1-2 周）**

- 云端：OSS Lifecycle / S3 Lifecycle。
- 本地：HDFS Storage Policy。
- 表格式：Iceberg V2 分区策略。

**Step 4：数据迁移（4-8 周）**

- 历史数据：一次性批量迁移（按分层规则）。
- 新数据：自动按时间分层。

**Step 5：监控与优化（持续）**

- 监控：冷数据访问次数（识别误分层）。
- 优化：调整分层规则。

**Step 6：成本评估（每月）**

- 各层数据量 / 成本。
- ROI 评估。

### 4.2 关键技术点

**1. S3 Lifecycle 配置**

```json
{
  "Rules": [
    {
      "ID": "logs-lifecycle",
      "Status": "Enabled",
      "Prefix": "logs/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

**2. Iceberg 表级分层**

```sql
-- Iceberg V2 分区统计 + 隐藏分区
CREATE TABLE orders (
  order_id BIGINT,
  user_id BIGINT,
  amount DECIMAL(18,2),
  order_time TIMESTAMP
) PARTITIONED BY (
  days(order_time),  -- 按天分区，自动分层
  bucket(8, user_id)  -- 按用户哈希
) STORED AS ICEBERG;

-- 配置 Iceberg 自动快照过期
ALTER TABLE orders SET TBLPROPERTIES (
  'history.expire.min-snapshots-to-keep' = '10',
  'history.expire.max-snapshot-age-ms' = '86400000'
);
```

**3. HDFS Storage Policy**

```bash
# 设置目录存储策略（HDFS 2.6+）
hdfs storagepolicies -setStoragePolicy -path /data/hot -policy HOT
hdfs storagepolicies -setStoragePolicy -path /data/warm -policy WARM
hdfs storagepolicies -setStoragePolicy -path /data/cold -policy COLD

# 查看策略
hdfs storagepolicies -getStoragePolicy -path /data/cold
```

**4. JuiceFS 智能分层**

```yaml
# juicefs.yaml
cache-dir:
  - /mnt/nvme0  # NVMe SSD 缓存（热数据）
  - /mnt/hdd0   # HDD 缓存（温数据）

object:
  name: s3
  endpoint: https://s3.amazonaws.com
  bucket: my-bucket

# 数据自动分层：热数据 → NVMe → S3
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**云厂商对象存储分层（2024-2025）**：

| 服务 | 提供商 | 分层策略 |
| --- | --- | --- |
| S3 Standard / IA / Glacier / Deep Archive | AWS | 标准 + 4 层 |
| OSS 标准 / 低频 / 归档 / 冷归档 | 阿里云 | 标准 + 4 层 |
| COS 标准 / 低频 / 归档 / 深度归档 | 腾讯云 | 标准 + 4 层 |
| OBS 标准 / 低频 / 归档 | 华为云 | 标准 + 3 层 |
| S3 Intelligent-Tiering | AWS | 自动分层 |
| OSS 智能分层 | 阿里云 | 自动分层 |

**统一存储（2024-2025）**：

| 工具 | 特点 |
| --- | --- |
| Apache Ozone | HDFS 继任者、原生支持分层 |
| Ceph | 统一存储、块 / 文件 / 对象 |
| MinIO | 对象存储 + 简单分层 |
| JuiceFS | POSIX 兼容 + 对象存储后端 + 分层 |
| JindoFS（阿里） | OSS 上的 POSIX 文件系统 |

**表级分层**：

- Iceberg V2 分区统计：自动剪裁 + 冷热分区。
- Hudi Timeline：COW / MOR 自动迁移。
- Paimon LSM：冷数据合并到对象。

**调度与自动化**：

- Apache DolphinScheduler：分层策略调度。
- 自研 + OSS Lifecycle API。
- 云厂商托管（OSS 智能分层）。

### 4.4 代码 / 示例

**示例 1：OSS 完整分层策略**

```python
import oss2

# 创建 OSS Bucket
auth = oss2.Auth('access_key', 'secret_key')
bucket = oss2.Bucket(auth, 'oss-cn-hangzhou.aliyuncs.com', 'my-bucket')

# 配置生命周期规则
rule = oss2.models.LifecycleRule(
    'logs-lifecycle',
    'logs/',
    status=oss2.models.LifecycleRule.ENABLED,
    expiration=oss2.models.LifecycleExpiration(days=365),
    transitions=[
        oss2.models.LifecycleTransition(days=30, storage_class=oss2.BUCKET_STORAGE_CLASS_IA),
        oss2.models.LifecycleTransition(days=90, storage_class=oss2.BUCKET_STORAGE_CLASS_ARCHIVE),
    ]
)

bucket.put_lifecycle_rule(rule)
```

**示例 2：Iceberg 自动快照过期（冷数据治理）**

```sql
-- 自动清理 7 天前的快照，保留最近 10 个
ALTER TABLE prod.orders SET TBLPROPERTIES (
  'history.expire.min-snapshots-to-keep' = '10',
  'history.expire.max-snapshot-age-ms' = '604800000',  -- 7 天
  'write.delete.mode' = 'merge',
  'write.update.mode' = 'merge'
);

-- 手动清理
CALL iceberg.system.expire_snapshots(
  table => 'prod.orders',
  older_than => TIMESTAMP '2025-01-01 00:00:00',
  retain_last => 10
);
```

**示例 3：JuiceFS 多级缓存（2024 主流工具）**

```yaml
# juicefs.yaml
redis:
  addr: redis://redis:6379

cache-dir:
  - /mnt/nvme0   # 热数据缓存（NVMe）
  - /mnt/ssd0    # 温数据缓存（SATA SSD）
  - /mnt/hdd0    # 冷数据缓存（HDD）

object:
  name: s3
  endpoint: https://s3.amazonaws.com
  bucket: my-bucket

# 数据自动分层：
# - 写入：直接到 S3
# - 读取：先查 NVMe → SATA → HDD → S3
# - 热数据：常驻 NVMe
# - 冷数据：定期淘汰
```

---
