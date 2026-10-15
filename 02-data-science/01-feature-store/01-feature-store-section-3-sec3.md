> 本文件是 **01-feature-store.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](01-feature-store.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：离线优先（Offline-First）**

- 先建立离线特征存储（Iceberg / Hive）。
- 再同步到在线（Redis）。
- 适合：批处理 + 离线训练为主。
- 工具：Feast / Tecton / Hopsworks。

**模式 2：实时优先（Streaming-First）**

- 直接建立实时特征（Flink / Kafka Streams）。
- 适合：实时推荐 / 实时风控。
- 工具：Tecton / 阿里 PAI / ByteFS。

**模式 3：混合架构（Hybrid）**

- 离线 + 实时统一管理。
- 复杂特征（用户长期行为）走离线，实时特征（点击）走流式。
- 适合：工业级大规模 ML。
- 工具：Tecton + Flink / 阿里 FeatureDB + 实时计算。

**模式 4：Feature as a Service（FaaS）**

- 特征作为 API 服务暴露。
- 多团队共享、计费、权限控制。
- 适合：跨部门协作、企业级。

**模式 5：AI 原生（AI-Native）**

- 整合传统特征 + LLM 特征 + 向量特征。
- 支持 Prompt / Embedding / Tool Description 管理。
- 适合：LLM / RAG / Agent 时代。
- 工具：Tecton AI 原生版 / Feast + Vector DB。

**模式 6：联邦特征平台（Federated）**

- 多组织各自管理特征，通过标准化接口协作。
- 适合：跨企业 / 跨机构。

**模式 7：湖仓一体（Lakehouse Feature Store）**

- 特征存储于湖仓（Iceberg / Delta / Hudi）。
- 适合：与数仓统一架构。

**模式 8：边缘特征（Edge Feature Store）**

- 特征在边缘设备（手机 / IoT）本地计算。
- 适合：端侧推理、隐私保护。

### 3.2 适用场景决策表

| 业务特征 | 推荐方案 | 理由 |
| --- | --- | --- |
| 小规模 ML 团队 | Feast 开源 | 轻量、开源、易上手 |
| 中大规模 + 实时需求 | Tecton 商业 | 实时 + MLOps 集成 |
| 大数据 + 数仓集成 | Hopsworks | Lakehouse + Feature Store |
| 阿里云生态 | 阿里 FeatureDB / PAI | 国产化集成 |
| 字节生态 | ByteFS | 字节内部生产级 |
| 腾讯生态 | TI-EMS | 腾讯内部生产级 |
| 离线训练为主 | Feast / Hopsworks | 离线优先 |
| 实时特征为主 | Tecton + Flink | 实时优先 |
| LLM / RAG 场景 | Tecton AI 原生 / Feast + Vector DB | AI 原生 |
| 多团队 / 跨部门 | FaaS 架构 | 平台化服务 |
| 隐私敏感 | 联邦 Feature Store | 数据不出域 |
| 边缘推理 | 边缘 Feature Store | 端侧计算 |
| 湖仓一体 | Iceberg / Delta + Feature Store | 架构统一 |
| 与 Spark 集成 | Feast + Spark | Spark 生态 |
| 与 K8s 集成 | Tecton + K8s | 云原生 |

### 3.3 反模式与陷阱

1. **「离线 / 在线两套代码」反模式**：用 Spark 离线算特征，用 Java 在线算，逻辑必然漂移。**特征平台的核心价值是"统一计算"**。
2. **「特征重复开发」反模式**：A 团队开发的特征 B 团队重写一遍。**必须建立 Feature Catalog + 复用流程**。
3. **「无 Point-in-Time 校验」反模式**：训练样本用了未来信息，模型 AUC 虚高。**必须用支持 Point-in-Time 的 Feature Store**。
4. **「特征无版本管理」反模式**：特征 SQL 改了，历史模型无法复现。**必须用 Git + 语义化版本管理特征定义**。
5. **「特征血缘断裂」反模式**：上游数据源变了，不知道影响哪些特征 / 模型。**必须建立完整血缘**。
6. **「特征无监控」反模式**：特征漂移没人知道，模型效果下降不知道为什么。**必须建立 PSI / KS / 缺失率监控**。
7. **「敏感特征无访问控制」反模式**：身份证号、手机号所有人都能访问。**必须建立分级访问控制 + 审计**。
8. **「特征回填困难」反模式**：新特征上线，无法对历史样本补算。**必须用支持 Backfill 的 Feature Store**。
9. **「实时特征过度使用」反模式**：什么特征都想实时算，成本爆炸。**必须分级（离线 / 近实时 / 实时）**。
10. **「向量特征与传统特征分裂」反模式**：传统特征在 Feast，向量特征在 Pinecone，管理分裂。**必须用 AI 原生 Feature Store 统一管理**。

---
