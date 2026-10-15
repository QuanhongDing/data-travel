> 本文件是 **07-disaster-recovery.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](07-disaster-recovery.md)。

## 4. 工程实现

### 4.1 落地步骤

#### 阶段 1：风险评估（1 个月）

1. 识别关键业务。
2. 定义 RPO / RTO。
3. 评估潜在故障（机房级 / 城市级）。

#### 阶段 2：架构设计（1-2 个月）

1. 选择容灾等级。
2. 设计同步策略。
3. 设计切换流程。

#### 阶段 3：实施部署（2-3 个月）

1. 灾备中心建设。
2. 数据同步链路。
3. 健康检查 + 自动切换。

#### 阶段 4：演练验证（持续）

1. 季度 DR 演练。
2. 故障模拟（混沌工程）。
3. 改进项跟踪。

### 4.2 关键技术点

#### 1. MySQL Binlog 同步

```bash
# 主库配置
[mysqld]
server-id = 1
log_bin = /var/log/mysql/mysql-bin.log
binlog_format = ROW

# 从库配置（异步复制）
CHANGE MASTER TO
  MASTER_HOST='master.db.local',
  MASTER_USER='repl_user',
  MASTER_PASSWORD='${REPL_PASSWORD}',  # env var reference
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=4;

START SLAVE;
```

#### 2. PostgreSQL 流复制

```bash
# 主库
wal_level = replica
max_wal_senders = 3

# 从库（同步复制）
primary_conninfo = 'host=master.db.local port=5432 user=repl password=${REPL_PASSWORD}'
synchronous_commit = on
```

#### 3. Kubernetes 多 Region 灾备

```yaml
# Velero 备份与恢复
apiVersion: velero.io/v1
kind: Backup
metadata:
  name: daily-backup
spec:
  schedule: "0 2 * * *"  # 每天凌晨 2 点
  template:
    includedNamespaces:
    - production
    storageLocation: s3-backup
    volumeSnapshotLocations:
    - s3-snapshots
```

### 4.3 工具链与平台

| 类别 | 工具 | 特点 |
| --- | --- | --- |
| **备份工具** | mysqldump、pg_dump、xtrabackup | 数据库备份 |
| **DR 平台** | AWS CloudEndure、Azure Site Recovery、阿里云灾备 | 云厂商 DRaaS |
| **数据同步** | Debezium、Maxwell、阿里 DTS | CDC 同步 |
| **快照** | ZFS、LVM、AWS EBS Snapshot | 文件系统快照 |
| **K8s 备份** | Velero、Kasten | K8s 资源备份 |

### 4.4 代码 / 示例

#### DR Runbook 示例

```yaml
# DR Runbook：电商核心交易系统
metadata:
  name: ecommerce-core-dr
  version: 1.0
  last_updated: 2025-01-01

rpo_rto:
  RPO: 30 seconds
  RTO: 5 minutes

dr_scenarios:
  - scenario: 主 Region 故障
    trigger: 主 Region 健康检查失败 > 2 分钟
    steps:
      - 1. 确认故障（Pingdom / Datadog）
      - 2. 联系 AWS Support
      - 3. 执行 DNS 切换（TTL 60s）
      - 4. 启动备用 Region 服务
      - 5. 验证业务恢复
    owner: sre-team
  
  - scenario: 数据库主库故障
    trigger: DB 主库健康检查失败
    steps:
      - 1. 自动切换到从库（HAProxy）
      - 2. 验证数据一致性（对账）
      - 3. 通知 DBA
      - 4. 修复主库
    owner: dba-team
```

---
