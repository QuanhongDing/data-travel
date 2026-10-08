# Ch3 · 计算范式

> **一句话定位**：离线 / 实时 / OLAP / AI 训练推理——四类计算引擎的统一视角与选型决策。

## 基本信息

- **难度**：★★★☆☆
- **推荐角色**：数据工程师、平台架构师
- **前置章节**：[Ch2 · 存储范式](../02-storage/)（建议）
- **后续章节**：[Ch4 · 数据中台与服务化](../04-data-mesh-and-middleware/)

## 本章要回答的核心问题

1. 离线计算（MaxCompute / Spark / Hive）的工程取舍？
2. 实时计算（Flink / Blink / Spark Streaming）的状态管理与 Exactly-Once 怎么落地？
3. OLAP 引擎（Hologres / ADB / StarRocks / ClickHouse / Druid）该怎么选？
4. 统一查询引擎（Trino / Presto）能否成为"大一统"查询层？
5. AI 训练与推理（PAI / Ray / Kubeflow / Volcano）如何与数据栈协同？
6. **流批一体**（Flink + Iceberg / Praveza）什么时候必须做，什么时候是过度设计？

## 子主题（占位）

- [ ] **[离线计算](./offline-compute/README.md)**：MaxCompute / Spark / Hive / Presto on Hive
- [ ] **[实时计算](./realtime-compute/README.md)**：Flink / Blink 状态管理、Checkpoint、Exactly-Once、反压
- [ ] **[OLAP 引擎](./olap-engine/README.md)**：Hologres / ADB / StarRocks / ClickHouse / Druid / Doris
- [ ] **[统一查询](./query-engine/README.md)**：Trino / Presto / Impala 的工程取舍
- [ ] **[AI 训练与推理](./ai-compute/README.md)**：PAI / Ray / Kubeflow / Volcano / Kserve
- [ ] **[流批一体](./stream-batch-unified/README.md)**：Flink + Iceberg / Praveza / Hudi
- [ ] **[查询优化器](./optimizer/README.md)**：Calcite / Velox / 自研优化器
- [ ] **[资源调度](./scheduler/README.md)**：YARN / K8s / 自研调度器

> 文件命名建议：`offline-compute.md` / `realtime-compute.md` / `olap-engine.md` / `query-engine.md` / `ai-compute.md` / `stream-batch-unified.md` / `optimizer.md` / `scheduler.md` / `hands-on.md` / `tuning.md` / `summary.md` / `refs.md`。

## 与 P9 能力的对应

P9 必须能：

- **判断何时引入 Flink**：很多团队过早引入 Flink，结果维护成本爆炸；P9 要能判断"批处理 + 小时级调度"是否已经够用
- **识别 OLAP 引擎的瓶颈**：Hologres vs StarRocks vs ClickHouse 在 1000 QPS 下的真实表现
- **理解 AI 训练对数据栈的反向要求**：训练数据需要高吞吐读取、特征需要低延迟在线服务、模型推理需要 GPU 资源池
- **设计流批一体的演进路径**：从 Lambda 架构 → Kappa 架构 → 流批一体的实际落地步骤

## 推荐资料

> 本节在章正文写作时补充。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch4 · 数据中台与服务化](../04-data-mesh-and-middleware/) 继续阅读
