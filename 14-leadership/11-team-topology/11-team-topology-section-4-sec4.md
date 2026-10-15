> 本文件是 **11-team-topology.md** 的子文件（§4. 改进措施）。完整章节请回到 [index](11-team-topology.md)。

## 4. 改进措施
1. 降低 Extraneous：{通过 Platform Team}
2. 投资 Germane：{增加培训}
3. 接受 Intrinsic：{领域本质}
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**团队拓扑设计**：

- **Team Topologies**：官网 + 书籍。
- **Spotify Squad Health Check**：Squad 健康度评估。
- **Miro / FigJam**：组织结构图。

**Team API 文档**：

- **Notion / Confluence**：文档协作。
- **Backstage**：内部开发者门户（Spotify）。
- **ReadMe / Mintlify**：API 文档。

**AI 时代工具（2024-2025）**：

- **Backstage AI**：AI 增强开发者门户。
- **Linear AI**：AI 项目管理。
- **Notion AI**：AI 文档协作。

### 4.4 代码 / 示例

**示例 1：Inverse Conway Maneuver 示例**

```
目标架构：企业级数据湖仓一体
- 数据源层（Kafka / 数据库）
- 数据湖层（Iceberg / Delta）
- 数据仓库层（数仓分层建模）
- 服务层（RAG / BI / 报表）
- 治理层（数据治理 / 安全）

Inverse Conway Maneuver：
1. 识别 Bounded Context：数据源 / 数据湖 / 数仓 / 服务 / 治理
2. 设计组织结构：
   - 数据源 Stream-Aligned Team（X 业务线）
   - 数据湖 Platform Team
   - 数仓 Complicated-Subsystem Team（建模专家）
   - 数据服务 Enabling Team
   - 数据治理 Complicated-Subsystem Team
3. Team API：每个团队明确服务边界、SLA
4. 持续调整：随架构演化调整团队
```

**示例 2：AI 辅助团队拓扑设计 Prompt**

```python
TEAM_TOPOLOGY_DESIGN_PROMPT = """
你是资深组织架构专家。请基于以下业务情况，设计 Team Topologies。

业务情况：
- 业务规模：5 个 BU，1 万员工
- 数据规模：PB 级
- 业务流：电商、金融、广告、物流、客服
- 技术栈：Kafka / Flink / Spark / Iceberg / Milvus / LLM
- AI 能力：RAG / Agent / 多模型编排

要求：
1. 设计 4 种团队类型（Stream-Aligned / Platform / Enabling / Complicated-Subsystem）
2. 明确每个团队的边界、职责、SLA
3. 设计 Team API
4. 评估 Cognitive Load
"""
```

---
