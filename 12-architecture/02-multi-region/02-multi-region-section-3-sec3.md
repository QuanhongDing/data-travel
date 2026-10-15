> 本文件是 **02-multi-region.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](02-multi-region.md)。

## 3. 设计模式与范式

### 3.1 主要模式

#### 模式 1：Active-Passive（主备模式）

```
[Active Region] ← 写入
       ↓ CDC
[Passive Region] ← 只读（温备 / 灾备）
```

**优点**：架构简单、冲突少。
**缺点**：故障切换 RTO 长（分钟级）、主 Region 压力大。

#### 模式 2：Active-Active（双活模式）

```
[Region A] ←→ [Region B]
  ↑ 双向同步 ↑
两个 Region 同时处理读写
```

**优点**：用户体验好（就近）、RTO < 1 分钟。
**缺点**：冲突解决复杂、数据一致性挑战大。

#### 模式 3：单元化多活（Cell-Based Multi-Region）

```
用户 ID hash → Cell 1 / Cell 2 / ...
每个 Cell 包含完整的应用 + 数据
不同 Cell 部署在不同 Region
```

**优点**：单 Cell 故障不影响全局、扩展性好。
**缺点**：跨 Cell 调用需要特殊处理（参考 [Ch12 §01 单元化](../01-cell-based-architecture/01-cell-based-architecture.md)）。

#### 模式 4：Global Database 模式

```
应用 → [CockroachDB / TiDB / Spanner]（跨 Region 透明）
数据库内部处理数据分布、复制、冲突解决
```

**优点**：对应用透明、强一致保证。
**缺点**：成本高、对某些 SQL 限制（如跨 Region 事务）。

#### 模式 5：分层多活（Tiered Multi-Region）

```
[Region A]（写入/读） → [Region B]（只读 + 部分写入） → [Region C]（灾备）
按数据重要性分层
```

### 3.2 适用场景决策表

| 场景 | 推荐模式 | 理由 |
| --- | --- | --- |
| 金融核心交易 | 同城双活 + 强一致 | 强一致优先 |
| 电商交易 | 异地多活 + 单元化 | 用户体验优先 |
| 社交 / 内容 | Active-Active + 最终一致 | 用户量大 |
| 数据分析 | Active-Passive | 数据量大、延迟不敏感 |
| AI 推理服务 | 单元化 + 跨 Region 调度 | 延迟敏感 |
| 全球化业务 | Global Database | 跨大洲强一致 |
| 内部系统 | Active-Passive（成本敏感） | 简单够用 |

### 3.3 反模式与陷阱

#### 反模式 1："多 Region 即可抗灾"

**症状**：以为多 Region 部署就万无一失，忽视数据同步设计。

**风险**：Region 间数据不一致，灾时丢数据。

**正解**：多 Region 是必要条件，但需要精心设计同步、冲突解决、流量调度。

#### 反模式 2：跨 Region 强同步

**症状**：用 2PC 实现跨 Region 强同步。

**风险**：跨 Region 延迟 100ms+ 拖垮系统、可用性下降。

**正解**：跨 Region 通常用最终一致（CDC 异步同步）。

#### 反模式 3：忽视冲突解决

**症状**：多 Region 同时写入同一数据，没设计冲突解决。

**风险**：数据覆盖、数据丢失。

**正解**：必须设计冲突解决策略（LWW / 向量时钟 / CRDT / 应用层解决）。

#### 反模式 4：DNS 切流忽视 TTL

**症状**：故障时切 DNS，但 DNS TTL 没设短，切流慢。

**正解**：核心业务 DNS TTL < 30 秒，配合 GSLB。

#### 反模式 5：单 Region 写多 Region 读

**症状**：所有写入走 Region A，Region B 只读。

**问题**：Region A 是单点，写入压力大。

**正解**：分片写入（按用户 ID / 业务分片）。

#### 反模式 6：忽视跨 Region 带宽成本

**症状**：跨 Region 同步占大量带宽，账单爆表。

**正解**：压缩、限流、采样、按需同步。

---
