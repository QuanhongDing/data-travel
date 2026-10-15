> 本文件是 **09-data-lineage.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](09-data-lineage.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：联邦血缘存储（Federated Lineage）**

```
系统 A (血缘 A) ─┐
                  ├─→ 联邦层 ─→ 统一 API
系统 B (血缘 B) ─┤
                  │
系统 C (血缘 C) ─┘
```

代表工具：**Databricks Lakehouse Federation、阿里云 DataWorks 联邦血缘、AWS Glue Data Catalog 跨账户**。

**模式 2：端到端血缘（End-to-End Lineage）**

覆盖从源头到消费方的完整链路：

```
MySQL → Kafka → Flink → Iceberg → Snowflake → BI / RAG
       ↓       ↓        ↓          ↓
       OpenLineage Event → 统一血缘存储
```

代表实践：**OpenLineage + DataHub + Marquez**。

**模式 3：血缘 API 网关（Lineage API Gateway）**

统一对外提供血缘服务：

```
业务方 / Agent → API 网关 → 联邦血缘 → 数据源 A / B / C
                                    ↓
                               缓存 / 限流 / 鉴权
```

代表实践：**自研 API Gateway + GraphQL Federation**。

**模式 4：跨云血缘（Cross-Cloud Lineage）**

跨云厂商 / 自建机房的统一血缘：

```
AWS 血缘 ─┐
          ├─→ 跨云联邦 → 统一视图
Azure 血缘 ─┤
          │
阿里云血缘 ─┘
```

代表工具：**Atlan、Collibra、阿里云 DataWorks 跨云**。

**模式 5：AI 驱动血缘（AI-Augmented Lineage）**

用 AI 自动识别、补全、查询血缘：

- 自动识别跨域关系。
- 自然语言查询血缘。
- 智能补全缺失血缘。

代表实践：**Atlan AI、Collibra AI、阿里云 DataWorks 智能血缘**。

### 3.2 适用场景决策表

| 场景 | 推荐模式 | 理由 |
| --- | --- | --- |
| **多团队 / Data Mesh** | 模式 1（联邦血缘） | 自治 + 互通 |
| **多云架构** | 模式 4（跨云血缘） | 跨云联邦 |
| **实时流 + 批流一体** | 模式 2（端到端） | 全链路 |
| **API 化需求** | 模式 3（API 网关） | 服务化 |
| **AI 时代** | 模式 5（AI 驱动） | 自然语言 + 智能补全 |
| **早期 0→1** | 模式 2 + 开源工具 | 低成本起步 |

### 3.3 反模式与陷阱

1. **"血缘采集永远不全"**：跨域采集尤其难。**正确做法**：接受 80%，AI 补 20%。
2. **"联邦血缘变成信息孤岛"**：联邦但不通。**正确做法**：统一 ID + 桥接服务。
3. **"血缘 API 没人用"**：API 上线但没集成到流程。**正确做法**：嵌入数据申请 / 变更流程。
4. **"可视化漂亮但查询慢"**：UI 漂亮但查询 30 秒。**正确做法**：图数据库 + 索引。
5. **"忽视血缘时序"**：血缘随时间变化，没管理。**正确做法**：版本管理 + 时序存储。

---
