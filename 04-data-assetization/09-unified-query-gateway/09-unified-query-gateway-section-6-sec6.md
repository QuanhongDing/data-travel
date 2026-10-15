> 本文件是 **09-unified-query-gateway.md** 的子文件（§6. 落地实践）。完整章节请回到 [index](09-unified-query-gateway.md)。

## 6. 落地实践

### 6.1 真实案例

**案例 1：某互联网公司 Trino 联邦查询**

- 背景：MySQL + Hive + Elasticsearch 跨源查询慢。
- 方案：部署 Trino，60+ Connector，CBO 优化。
- 工具：Trino 430 + Hive + MySQL + Elasticsearch + Iceberg。
- 结果：跨源查询效率提升 10 倍。

**案例 2：某金融公司 Starburst Enterprise**

- 背景：合规 + 跨源 + 高安全。
- 方案：Starburst Enterprise（Trino + 安全增强）。
- 工具：Starburst + Iceberg + 行级权限。
- 结果：合规审计通过，跨源查询覆盖 200+ 数据源。

**案例 3：某电商公司 Trino + 向量**

- 背景：商品向量 + 用户行为表 + 订单表跨源查询。
- 方案：Trino + Milvus Connector + MySQL + Iceberg。
- 工具：Trino + Milvus + MySQL + Iceberg + GPT-4o。
- 结果：「找北京 + 高客单 + 语义相似商品」单 SQL 完成。

**案例 4：某 AI 公司 Agent + Trino**

- 背景：Agent 需要跨 MySQL + Milvus + Neo4j 查询。
- 方案：Trino 作为 Agent Tool，统一联邦查询。
- 工具：Trino + MySQL + Milvus + Neo4j + LangChain。
- 结果：Agent 数据查询成功率从 60% 提升到 90%。

### 6.2 踩坑与经验

**坑 1：跨源 JOIN 当 ETL**

- 现象：用 Trino 做 ETL，性能差。
- 解法：Trino 用于临时分析，ETL 用 Spark / Flink。

**坑 2：无查询下推**

- 现象：所有数据上拉到 Trino。
- 解法：配置 pushdown、列裁剪、分区裁剪。

**坑 3：资源无隔离**

- 现象：大查询影响小查询。
- 解法：资源组（resource groups）。

**坑 4：无成本控制**

- 现象：扫描全表，成本失控。
- 解法：LIMIT、配额、计费。

**坑 5：无监控**

- 现象：慢查询不知道在哪。
- 解法：Query Trace + Prometheus + Grafana。

**坑 6：Agent 安全失控**

- 现象：Agent 跨源查询无权限管控。
- 解法：行级 / 列级权限 + 审计。

**坑 7：Iceberg 物化视图不刷新**

- 现象：物化视图陈旧。
- 解法：定时刷新 + 增量刷新。

**坑 8：Connector 版本不匹配**

- 现象：Trino 升级后 Connector 失败。
- 解法：统一版本管理 + 测试。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（PoC，1-2 周）**：

1. 部署 Trino 集群（Coordinator + 3 Worker）。
2. 配置 3-5 个 Connector（Hive / MySQL / Elasticsearch）。
3. 验证基本跨源查询。

**1→10（业务化，1-3 个月）**：

1. 接入 10+ 数据源。
2. CBO + 资源组 + 监控。
3. 物化视图。

**10→100（企业级，3-12 个月）**：

1. 60+ Connector。
2. 向量 / KG Connector。
3. AI 集成（Text-to-SQL + Agent）。
4. 行级 / 列级权限 + 审计。

### 6.4 ROI 评估

- **跨源查询效率**：从小时级到秒级。
- **数据科学家生产力**：临时分析效率提升 5 倍。
- **AI 应用门槛**：Agent 跨源查询零门槛。
- **存储成本**：避免 ETL 重复存储。

---
