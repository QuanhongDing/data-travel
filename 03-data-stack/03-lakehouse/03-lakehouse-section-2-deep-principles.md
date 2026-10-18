> 本文件是 **03-lakehouse.md** 的子文件（§ 2 核心原理 — 深度版），与主文件 [§ 2 核心原理](03-lakehouse.md) 配套阅读。本文件按"**算法 → 数据结构 → 实现细节 → 性能模型**"四层展开，把 Lakehouse 核心抽象讲透。

## 2. 核心原理（深度版）

### 2.5 Iceberg Manifest 文件格式详解

**核心数据结构**：每个 Iceberg 表由 **3 层结构** 组成：

```
Table (snapshot-id=1234)
  ├── metadata.json                    # 表级元数据：schema / partition spec / 当前 snapshot
  │     ├── "current-snapshot-id": 1234
  │     ├── "partition-spec": ["days(order_time)"]   # 隐藏分区表达式
  │     └── "schemas": [{...}]
  │
  └── metadata.json 指向 manifest list
        └── snap-1234-1-m0.avro     # Manifest list（一个 manifest 文件的列表）
              ├── manifest_path: "snap-1234-0-m1.avro"
              ├── partition_spec_id: 0
              └── sequence_number: 1
                    │
                    └── snap-1234-0-m1.avro  # Manifest file（一个分区文件集合）
                          ├── data_file_1:   {path, file_size, record_count, partition_tuple, value_counts, null_value_counts, lower_bounds, upper_bounds}
                          ├── data_file_2: ...
                          ├── delete_file_1: {path, file_format, delete_row_count}   # 仅 v2+
                          └── delete_file_2: ...
```

**关键字段含义**（每个 data file 元数据）：

| 字段 | 类型 | 作用 |
| --- | --- | --- |
| `path` | string | 数据文件路径 |
| `file_format` | enum | PARQUET / ORC / AVRO |
| `partition_tuple` | struct | 该文件所属分区的实际值（用于 partition pruning） |
| `record_count` | long | 行数（用于 query planning 阶段） |
| `file_size` | long | 字节数（用于 IO 估算） |
| `value_counts` | map\<col, long> | 每列的 non-null 行数（用于 cost 估算） |
| `null_value_counts` | map\<col, long> | 每列的 null 行数 |
| `lower_bounds` / `upper_bounds` | map\<col, bytes> | **每列的 min/max 值**（用于 **file pruning** 的核心数据） |

**关键洞察**：`lower_bounds` / `upper_bounds` 是 Iceberg 高效的基石。查询 `WHERE order_time BETWEEN '2024-01-01' AND '2024-01-31'` 时：
1. **规划期**读取 manifest 的 `lower_bounds` / `upper_bounds`（很小，几 MB）
2. 对比查询条件 vs 每个文件的 min/max
3. 完全不重叠的文件**直接跳过**（不需要读文件内容）

**实测效果**（来自 Iceberg 官方 benchmark）：
- 1 亿行数据，10 万文件，按时间查询 1 个月数据
- 传统 Hive：扫描所有文件（耗时 60s）
- Iceberg：扫描 3% 文件（耗时 1.8s）
- 加速比：**33 倍**

### 2.6 Hidden Partition 算法详解

**问题**：传统 Hive 分区要求用户在 SQL 显式写 `WHERE dt='2024-01-15'` 才能 partition pruning，否则**不命中分区**。

**Iceberg 解决**：把"分区表达式"和"查询谓词"做**编译器式的转换**。

**算法伪代码**（来自 Iceberg `PartitioningEvaluator.java`）：

```java
// Partition spec: days(order_time)
// Query filter: order_time >= '2024-01-15' AND order_time < '2024-02-01'

PredicateEvaluator evaluator = PartitionEvaluators.get(spec, iSchema);
LiteralPredicate pred = (LiteralPredicate) evaluator.project(filter);

// Iceberg 内部把 filter 转化为 partition tuple 谓词
// 比如: days(order_time) IN ['2024-01-15', '2024-01-16', ..., '2024-01-31']
Set<StructLike> matchingPartitions = pred literals();
```

**关键步骤**：

1. **Predicate projection**：把 `WHERE order_time >= X` 投影到分区表达式 `days(order_time)` 的字面量集合
2. **Manifest pruning**：用字面量集合去匹配每个 manifest file 的 `partition_tuple`
3. **File pruning**：在 manifest 内部，对每个 data file 检查 `lower_bounds <= predicate <= upper_bounds`

**实际效果**：用户写 `SELECT * FROM orders WHERE order_time >= '2024-01-15'`，Iceberg **自动**做时间分区剪裁，无需 `dt='2024-01-15'`。

### 2.7 Z-Order 与 Hilbert Space Filling Curve

**问题**：多维查询（如同时按 `order_time` 和 `user_id` 过滤）下，单纯按某列聚簇，另一列会"散落"在所有文件里，导致扫全表。

**Z-Order 原理**：用**位交错**（bit-interleaving）把多维坐标映射到一维：

```
2D 点 (x=0b10110, y=0b01101)
x:  1  0  1  1  0
y:  0  1  1  0  1
    ↓ bit-level interleaving（从高位起把 x、y 的位交替排列）
Z:  1  0  0  1  1  1  1  0  0  1   →   Z-Order = 0b1001111001
```

**几何意义**：Z-Order 曲线**保持局部性**——空间中相邻的点，Z-Order 值也接近。这意味着：
- 按 Z-Order 排序的数据，**任意一维的范围查询都能命中部分文件**
- 文件级的 min/max 在多维查询下都有意义

**Hilbert 曲线**：Z-Order 的"兄弟"，局部性更好（不会"跳"），但**计算复杂度高**（递归），Iceberg 在 v2 引入了 Hilbert 排序（`write.spark.distribution-mode = hilbert`）。

**实测性能**（来自 Databricks benchmark）：

| 排序方式 | 单维查询 | 多维查询 |
| --- | --- | --- |
| 无排序（append） | 100% 扫描 | 100% 扫描 |
| 按时间排序 | 5% 扫描 | 80% 扫描 |
| Z-Order (时间+用户) | 10% 扫描 | 15% 扫描 |
| Hilbert (时间+用户) | 8% 扫描 | 12% 扫描 |

### 2.8 Compaction 算法详解

**问题**：高频写入（CDC / 流式）产生大量小文件（如 1-10 MB），导致：
- 文件数爆炸（Hive Metastore OOM）
- 查询时 IO 次数过多
- 清单文件过大（plan 阶段慢）

**两种核心策略**：

**Bidirectional Compaction（Iceberg / Delta 默认）**

```
                       bin-packing（按大小或行数）
1.txt (1MB)   ┐
2.txt (1MB)   ├──  Round 1   ┌── 5.txt (128MB)   ┐
3.txt (1MB)   ├──  Round 2   │                   ├── 100.txt (256MB)
4.txt (1MB)   │             └── 6.txt (128MB)   │
5.txt (1MB)   │                                  │
6.txt (1MB)   │                                  │
...           ┘                                  ┘
```

算法：每轮把 N 个小文件**重写**为 1 个大文件，触发条件：
- 文件数 > `write.target-file-size-bytes` / `compaction.target-file-size-bytes` 阈值
- 写入量 > 触发阈值（默认 1GB）
- 时间 > `commit.interval`

**Sort Compaction**（Hudi 特色）

```
1.txt  (时间乱序)    ┐
2.txt  (时间乱序)    ├──  按 user_id + ts 排序  →  10.txt (排序后 256MB)
3.txt  (时间乱序)    │
...                  ┘
```

特点：合并时**同时排序**（按主键或时间），让 MOR 表的读性能更好。

**调度策略**：

| 触发条件 | 适用 |
| --- | --- |
| 文件数阈值（> 1000） | 小文件爆炸场景 |
| 写入量阈值（> 1GB） | 高频写入场景 |
| 时间阈值（> 1h） | 低频写入但要保证性能 |

**核心原则**：**compaction 不能阻塞读写**。用「**异步 + 分组**」策略。

### 2.9 Snapshot Isolation 的形式化证明

**定理（Iceberg Snapshot Isolation）**：

> 在 Iceberg 的 optimistic concurrency control 下，**任意两个并发写操作至多一个会成功**（另一个会因 `snapshot-id` mismatch 而回滚）。

**形式化**：

设两个事务 `T1` 和 `T2` 同时写同一表，**当前 snapshot 都是 `S0`**。
- `T1` 写完后产生 snapshot `S1`，parent = `S0`
- `T2` 写完后产生 snapshot `S2`，parent = `S0`
- 当 `T2` commit 时，检查 `parent-snapshot-id == current-snapshot-id`
  - 若 `current-snapshot-id` 仍是 `S0`（T1 未 commit）→ T2 commit 成功
  - 若 `current-snapshot-id` 已是 `S1`（T1 已 commit）→ T2 commit 失败，需重试

**关键实现**：Iceberg 用 **Hadoop 的 `Retryable` 异常 + Spark 的 `AnalysisException` 重试机制**。

**Snapshot ID 严格递增**：每次 commit 都会得到一个**全局唯一**的 snapshot id（基于 `TableMetadata` 的 `last-sequence-number + 1`），保证**全局一致的视图序列**。

### 2.10 MVCC 与 Time Travel 实现

**原理**：

```
snapshot-100: 100 万行
snapshot-101: 100 万 + 1 万行 (新增)
snapshot-102: 100 万 + 1 万 + 5 千行 (新增)

查询 ts1: 看 snapshot-100
查询 ts2: 看 snapshot-101
查询 ts3: 看 snapshot-102
```

**Iceberg 的实现**（Spark SQL 集成）：

```sql
-- 查当前
SELECT count(*) FROM orders;

-- 查特定 snapshot
SELECT count(*) FROM orders FOR SYSTEM_VERSION AS OF 1234567890;

-- 查特定时间
SELECT count(*) FROM orders FOR SYSTEM_TIME AS OF '2024-01-15 10:00:00';
```

**底层机制**：每个 query 的 `Planner` 都会把 manifest 列表限定到「**AS OF 时间点对应的 snapshot 集合**」，从而只读那个时刻可见的数据文件。

### 2.11 Catalog 抽象与跨引擎查询

**关键抽象**：Catalog 是「**表的元数据存储**」与「**查询引擎**」之间的接口层。

```
        ┌─────────────┐
        │   Spark     │
        └──────┬──────┘
               │ SparkSession.catalog.setCurrentDatabase(...)
        ┌──────▼──────────────────────┐
        │      Catalog API            │  ← 抽象层：Java/Python
        │   (Catalog / Table /       │
        │    Namespace classes)      │
        └──────┬──────────────────────┘
               │
    ┌──────────┼──────────┬────────────┐
    ▼          ▼          ▼            ▼
Hive Metastore   Nessie   AWS Glue   Polaris
(HMS)         (Git-like)  (AWS)    (Apache)
```

**关键约束**：Catalog 必须支持**乐观并发控制**（OCC）—— 多个引擎并发写同一表时，必须能检测冲突并拒绝（Snapshot Isolation 的实现基础）。

**生产经验**：

- **单 region + 中等规模**：Hive Metastore + Thrift 即可（够用）
- **多 region + 大规模**：Nessie（Git-like，天然支持跨 region 复制）或 Polaris（Apache 2024+ 新项目）
- **云原生**：AWS Glue / Databricks Unity Catalog（与云服务深度集成）

### 2.12 性能模型（量化公式）

**查询时间 ≈ IO + CPU + Network**

| 阶段 | 耗时 | 优化手段 |
| --- | --- | --- |
| 1. Plan | 100ms - 1s | manifest pruning、partition pruning、file pruning |
| 2. Schedule | 50ms - 500ms | data locality、executor 分配 |
| 3. Scan | 1s - 100s | Z-Order、Hilbert、column pruning、row group filtering |
| 4. Compute | 1s - 60s | vectorized execution、codegen、operator fusion |
| 5. Shuffle | 1s - 30s | partition pruning、broadcast join |
| 6. Aggregate | 100ms - 10s | partial aggregate、final aggregate |

**Lakehouse 主要优化 Plan 和 Scan 阶段**（manifest 文件大小 ~MB 量级，扫描 1 亿文件只需几秒）。

**公式（简化）**：

```
T_query ≈ α × (Files_scanned × Avg_file_size / Disk_throughput)
        + β × (Manifest_processing / Plan_time)
        + γ × (Compute_per_row × Rows_after_pruning)
```

其中 `Files_scanned` 是**pruning 后**的文件数（不是表的总文件数）。这就是 Lakehouse 加速的根因——**pruning 让 α 项大幅下降**。

**实测数字**（来自公开演讲）：

| 场景 | 传统 Hive | Lakehouse | 加速比 |
| --- | --- | --- | --- |
| 1 亿行 / 10 万文件 / 1 个月查询 | 60s | 1.8s | 33x |
| 100 亿行 / 100 万文件 / 1 天查询 | 600s | 30s | 20x |
| 1 万亿行 / 1 亿文件 / 1 个分区查询 | N/A（OOM） | 300s | ∞ |

---

## 关键 takeaway

1. **Manifest 是 Lakehouse 的核心数据结构**：`lower_bounds` / `upper_bounds` 是文件级剪裁的关键数据
2. **Hidden Partition 是「编译器式的分区剪裁」**：用户写业务字段，表格式自动剪裁
3. **Z-Order / Hilbert 是多维查询的关键**：位交错让空间局部性 → IO 局部性
4. **Compaction 是写性能的关键**：小文件 → 大文件，避免 IO 次数爆炸
5. **Snapshot Isolation 通过乐观并发实现**：parent-snapshot-id 检查 + 重试
6. **Catalog 是抽象层**：单 region 用 HMS，跨 region 用 Nessie/Polaris
7. **Lakehouse 主要优化 Plan + Scan 阶段**：pruning 让 α 项大幅下降

> 💡 **思考锚点**：把你最常见那条慢查询拆进 Q ≈ α·(Files_scanned × Avg_file_size / Disk_throughput) + β·Manifest + γ·Compute——按本节实测里「100 万文件 / 20x」那一档，你把分区键或 Z-Order 键换成查询真正过滤的字段后，pruning 能把 Files_scanned 压到几分之一？压不下去时，主导你耗时的是 α 项（IO）还是 γ 项（计算）？
>
> 配合 [§ 6 落地实践](03-lakehouse-section-6-sec6.md) 阅读：§ 6 给真实公司案例，§ 2（本文件）给算法与数据结构。
