> 本文件是 **01-feature-store.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](01-feature-store.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务梳理与特征盘点**

- 盘点现有 ML 项目，识别核心特征（用户画像 / 商品画像 / 行为统计）。
- 评估特征复用价值（哪些特征被多个模型使用）。
- 输出：**特征清单 + 复用计划**。

**Step 2：选型**

- 用 §3.2 决策表选 Feature Store。
- 评估开源 vs 商业、自研 vs 现成。
- 评估与现有数仓 / 平台集成成本。
- 输出：**选型报告**。

**Step 3：架构设计**

- 离线层（Iceberg / Hive / Delta）+ 在线层（Redis / DynamoDB）。
- 物化层（Flink / Spark Streaming）。
- 服务层（REST API / gRPC）。
- 监控层（PSI / KS / 缺失率）。
- 输出：**架构图 + 技术选型**。

**Step 4：核心特征接入**

- 选 5-10 个核心特征接入平台。
- 优先接入跨团队复用价值高的特征。
- 输出：**首批接入特征清单**。

**Step 5：离线 / 在线一致性验证**

- 用同一份样本验证离线 / 在线特征一致性。
- 误差 < 1e-6 才算合格。
- 输出：**一致性验证报告**。

**Step 6：Point-in-Time 正确性验证**

- 用真实历史样本验证特征无未来信息泄露。
- 输出：**Point-in-Time 验证报告**。

**Step 7：监控 + 血缘 + 治理**

- 接入特征监控（PSI / KS / 缺失率）。
- 接入特征血缘（上游数据源 + 下游模型）。
- 接入权限治理（敏感特征分级）。
- 输出：**监控 dashboard + 血缘图 + 权限矩阵**。

**Step 8：平台化运营**

- Feature Catalog（让团队发现已有特征）。
- 特征回填（Backfill）流程。
- 特征文档（定义、用途、负责人）。
- 输出：**Feature Catalog + 文档 + 流程**。

### 4.2 关键技术点

**离线 / 在线一致性**：

1. **统一计算逻辑**：用 SQL / Python DSL 表达特征定义，离线用 Spark / Flink 批处理执行，在线用相同 DSL 编译为实时计算。
2. **物化同步**：定期 / 实时将离线特征同步到在线存储（Redis）。
3. **TTL 管理**：在线特征设置过期时间（避免用过期数据）。
4. **一致性校验**：定期比对离线 / 在线特征值（误差 < 1e-6）。

**Point-in-Time 正确性**：

5. **时间戳追踪**：每个特征值带时间戳，训练时只取 $\leq$ 样本时间的最新值。
6. **时序特征存储**：用支持时序的存储（Iceberg / TimescaleDB）。
7. **Late Data 处理**：迟到数据用 watermark 处理，不能简单丢弃。

**特征回填（Backfill）**：

8. **批量重算**：用 Spark / Flink 重新计算历史样本的特征。
9. **增量回填**：只计算新增样本的特征。
10. **回填验证**：回填后用 Point-in-Time 验证正确性。

**特征血缘**：

11. **元数据管理**：特征定义、数据源、转换逻辑、负责人、SLA。
12. **自动血缘**：通过 SQL 解析、数据流追踪自动生成血缘图。
13. **影响分析**：上游变更时，自动识别下游受影响的特征和模型。

**特征监控**：

14. **分布监控**：PSI / KS 检验 + 缺失率 + 异常值。
15. **模型效果监控**：特征监控 + 模型监控（Evidently / WhyLabs）。
16. **告警**：阈值触发自动告警（钉钉 / 飞书 / Slack）。

**实时特征**：

17. **Flink + Kafka**：流式计算实时特征。
18. **窗口计算**：滑动窗口、会话窗口。
19. **状态管理**：Flink State、RocksDB 状态后端。
20. **Exactly-Once**：Flink Checkpoint + Kafka 事务。

**LLM / 向量特征**：

21. **Embedding 计算**：用 Sentence-BERT / OpenAI Embedding / CLIP。
22. **向量存储**：用 Milvus / Pinecone / Weaviate / Qdrant。
23. **Prompt Template 管理**：Feature Store 存储 + 版本化 Prompt。
24. **混合检索**：传统特征 + 向量特征 + 全文检索融合。

### 4.3 工具链与平台

**开源 Feature Store**：

- **Feast**（Linux Foundation / 开源）——开源 Feature Store 事实标准，支持离线 / 在线。
- **Hopsworks**（瑞典 / 开源）——Lakehouse Feature Store。
- **Apache Feathr**（LinkedIn / 开源）——企业级 Feature Store。
- **Featureform**（开源）——虚拟 Feature Store。
- **DVC**（开源）——数据 + 模型 + 特征版本管理。

**商业 Feature Store**：

- **Tecton**（美国 / 商业）——企业级 Feature Store 龙头，实时强。
- **Databricks Feature Store**（商业）——与 Delta Lake + MLflow 深度集成。
- **AWS SageMaker Feature Store**（商业）——AWS 生态集成。
- **Google Vertex AI Feature Store**（商业）——GCP 生态集成。
- **Azure Machine Learning Feature Store**（商业）——Azure 生态集成。

**国产 Feature Store**：

- **阿里 PAI FeatureDB / 阿里云特征平台**——阿里生态。
- **字节 ByteFS**——字节内部生产级。
- **腾讯 TI-EMS**——腾讯内部生产级。
- **华为 ModelArts Feature Store**——华为云生态。
- **百度 BML Feature Store**——百度云生态。

**向量数据库 / 向量特征**：

- **Milvus**（国产 / 开源）——向量数据库事实标准。
- **Pinecone**（商业）——托管向量数据库。
- **Weaviate**（开源）——向量数据库 + 模块化。
- **Qdrant**（开源）——Rust 实现高性能向量数据库。
- **Chroma**（开源）——轻量向量数据库。
- **Vespa**（Yahoo / 开源）——向量 + 全文 + 结构化混合检索。

**实时计算（流处理）**：

- **Flink**（Apache / 开源）——流处理事实标准。
- **Kafka Streams**（Apache / 开源）——轻量流处理。
- **Spark Streaming**（Apache / 开源）——微批流处理。
- **Apache Beam**（开源）——统一批流 SDK。
- **Materialize**（商业）——流式 SQL 数据库。

**存储**：

- **Redis**（开源 / 商业）——在线特征事实标准。
- **DynamoDB**（AWS / 商业）——托管 NoSQL。
- **HBase**（Apache / 开源）——分布式 NoSQL。
- **Cassandra**（Apache / 开源）——分布式 NoSQL。
- **Aerospike**（商业）——实时 NoSQL。

**离线存储**：

- **Iceberg**（Apache / 开源）——湖仓事实标准之一。
- **Delta Lake**（Databricks / 开源）——湖仓事实标准之一。
- **Apache Hudi**（开源）——湖仓事实标准之一。
- **Hive**（Apache / 开源）——传统数仓。
- **BigQuery**（Google / 商业）——云数仓。
- **Snowflake**（商业）——云数仓。

**监控**：

- **Evidently**（开源）——ML 监控（含特征监控）。
- **WhyLabs**（商业）——ML 可观测性。
- **Arize**（商业）——ML 监控。
- **Prometheus + Grafana**——基础设施监控。
- **阿里云日志服务 / SLS**——日志监控。

**2024-2025 新工具**：

- **Feast + Milvus 集成**——AI 原生 Feature Store。
- **Tecton AI 原生**——LLM Feature 支持。
- **Hopsworks GenAI**（2024）——LLM / Agent Feature Store。
- **Databricks Vector Search + Feature Store**——AI 原生。
- **LangSmith + LangChain**——LLM 特征 + Prompt 管理。
- **Weights & Biases Prompts**——Prompt 版本化。

### 4.4 代码 / 示例

**示例 1：Feast 特征定义**

```python
# feature_repo/feature_definitions.py
from feast import Entity, Feature, FeatureView, FileSource, ValueType
from feast.transformations import request_source
from datetime import timedelta

# 实体定义
user = Entity(name="user_id", value_type=ValueType.INT64)

# 数据源（离线 Parquet）
user_stats_source = FileSource(
    path="data/user_stats.parquet",
    timestamp_field="event_timestamp",
)

# 特征视图定义
user_stats_fv = FeatureView(
    name="user_stats",
    entities=[user],
    ttl=timedelta(days=1),
    source=user_stats_source,
    schema=[
        Feature(name="user_click_7d", dtype=ValueType.INT64),
        Feature(name="user_purchase_30d", dtype=ValueType.INT64),
        Feature(name="user_avg_price_30d", dtype=ValueType.FLOAT),
    ],
    online=True,  # 同时支持离线 / 在线
)

# 物化（离线 → 在线）
from feast import FeatureStore
store = FeatureStore(repo_path=".")
store.materialize_incremental(end_date=datetime.now())
```

**示例 2：Feast 在线特征查询**

```python
from feast import FeatureStore

store = FeatureStore(repo_path=".")

# 在线检索（毫秒级）
features = store.get_online_features(
    features=[
        "user_stats:user_click_7d",
        "user_stats:user_purchase_30d",
        "user_stats:user_avg_price_30d",
    ],
    entity_rows=[{"user_id": 1001}, {"user_id": 1002}],
).to_dict()

# features = {
#     "user_id": [1001, 1002],
#     "user_click_7d": [12, 5],
#     "user_purchase_30d": [3, 0],
#     "user_avg_price_30d": [128.5, 89.0],
# }
```

**示例 3：Point-in-Time 历史特征查询**

```python
from feast import FeatureStore
import pandas as pd

store = FeatureStore(repo_path=".")

# 历史样本（含时间戳）
training_df = pd.DataFrame({
    "user_id": [1001, 1001, 1002],
    "event_timestamp": pd.to_datetime([
        "2024-01-01 10:00:00",
        "2024-01-15 10:00:00",
        "2024-02-01 10:00:00",
    ]),
    "label": [1, 0, 1],
})

# Point-in-Time 检索（训练用，自动避免未来信息泄露）
training_features = store.get_historical_features(
    entity_df=training_df,
    features=[
        "user_stats:user_click_7d",
        "user_stats:user_purchase_30d",
    ],
).to_df()
```

**示例 4：Flink 实时特征计算**

```java
// Flink 实时特征：用户近 1 小时点击量
DataStream<ClickEvent> clicks = ...;

DataStream<Tuple2<Long, Integer>> user1hClicks = clicks
    .keyBy(event -> event.userId)
    .window(SlidingEventTimeWindows.of(Time.hours(1), Time.minutes(5)))
    .aggregate(new CountAggregate());

// 写入 Redis
user1hClicks.addSink(new RedisSink<>(...));
```

**示例 5：特征监控（Evidently）**

```python
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset, DataQualityPreset
import pandas as pd

# 参考分布（训练时）vs 当前分布（推理时）
reference_data = pd.read_parquet("train_features.parquet")
current_data = pd.read_parquet("inference_features.parquet")

# 生成数据漂移报告
report = Report(metrics=[
    DataDriftPreset(),
    DataQualityPreset(),
])
report.run(reference_data=reference_data, current_data=current_data)

# 报告保存 / 推送
report.save_html("drift_report.html")
```

**示例 6：向量特征 + 传统特征融合（LLM 时代）**

```python
# 用 Sentence-BERT + Milvus 做"语义特征"
from sentence_transformers import SentenceTransformer
from pymilvus import connections, Collection

model = SentenceTransformer('BAAI/bge-large-zh-v1.5')

# 计算 Embedding
texts = ["商品描述1", "商品描述2", ...]
embeddings = model.encode(texts)

# 写入 Milvus
connections.connect("default", host="localhost", port="19530")
collection = Collection("product_embeddings")
collection.insert([item_ids, embeddings.tolist()])

# 在线检索：用户 query → 相似商品
query_emb = model.encode([user_query])
results = collection.search(
    data=query_emb.tolist(),
    anns_field="embedding",
    param={"metric_type": "IP", "params": {"nlist": 1024}},
    limit=10
)

# 融合传统特征（点击量、收藏量等）
final_features = combine_features(semantic_features, traditional_features)
```

---
