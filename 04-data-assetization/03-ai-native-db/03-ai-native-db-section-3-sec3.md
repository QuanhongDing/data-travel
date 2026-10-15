> 本文件是 **03-ai-native-db.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](03-ai-native-db.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：PostgreSQL + pgvector（最主流）**

PostgreSQL 加 pgvector 扩展，单库解决 80% AI 场景。

- **优点**：生态成熟、SQL 兼容、事务一致。
- **缺点**：规模上限（千万级）。
- **适用**：中小规模 RAG、推荐、AI 应用。

**模式 2：云厂商 AI 原生 DB**

Snowflake Cortex、Databricks Vector Search、AWS Aurora + pgvector。

- **优点**：云原生、托管。
- **缺点**：云锁定。
- **适用**：云上应用。

**模式 3：多模型原生 DB**

SurrealDB / SingleStore / TigerData，原生支持文档 + 图 + 向量 + 时序。

- **优点**：多模型统一。
- **缺点**：生态不如 PostgreSQL。
- **适用**：复杂多模型场景。

**模式 4：传统 DB 厂商拥抱 AI**

Oracle 23ai、SQL Server、PostgreSQL + pgvector。

- **优点**：企业 IT 友好、合规。
- **缺点**：成本较高。
- **适用**：大型企业、传统行业。

**模式 5：分布式 AI 原生 DB**

TiDB Vector、CockroachDB + 向量扩展。

- **优点**：分布式、可扩展。
- **缺点**：向量性能略低。
- **适用**：分布式 OLTP + AI。

**模式 6：嵌入式 / 客户端 AI 原生**

DuckDB VSS、Chroma、SQLite + sqlite-vss。

- **优点**：轻量、嵌入式。
- **缺点**：单机。
- **适用**：PoC、本地应用。

### 3.2 适用场景决策表

| 场景特征 | 推荐模式 | 理由 |
| --- | --- | --- |
| 中小规模 RAG / 推荐 | PostgreSQL + pgvector | 性价比最优 |
| 云原生 / SaaS | Snowflake / Databricks | 托管 |
| 多模型（文档 + 图 + 向量） | SurrealDB / SingleStore | 多模型 |
| 大型企业 / 传统行业 | Oracle 23ai / DB2 + 向量 | 合规 |
| 分布式 OLTP + AI | TiDB Vector | 分布式 |
| PoC / 本地应用 | DuckDB VSS / Chroma | 轻量 |
| 时序 + 向量 | TigerData（TimescaleDB） | 时序扩展 |
| 亿级以上 | 转向专用向量库 / 向量湖 | 规模 |

### 3.3 反模式与陷阱

1. **「亿级向量用 pgvector」反模式**：pgvector 亿级慢。**亿级以上用专用向量库**。
2. **「无索引」反模式**：直接顺序扫描。**必须 HNSW / IVF 索引**。
3. **「FP32 不压缩」反模式**：浪费存储。**必须 float16 / bit 量化**。
4. **「SQL 写法低效」反模式**：`ORDER BY ... LIMIT 10` 不加索引。**必须用向量索引**。
5. **「融合查询无优化」反模式**：标量过滤后再向量排序，未联合优化。**必须用 HNSW + 标量过滤**。
6. **「忽视事务一致性」反模式**：向量写入与业务表分离。**必须同库事务**。
7. **「盲目追求新特性」反模式**：用 Oracle 23ai 而团队不熟 Oracle。**用团队熟悉的数据库**。
8. **「忽视备份恢复」反模式**：向量数据无备份。**必须 PITR + 跨区域复制**。

---
