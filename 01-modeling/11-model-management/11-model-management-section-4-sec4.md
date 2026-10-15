> 本文件是 **11-model-management.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](11-model-management.md)。

## 4. 工程实现

### 4.1 落地步骤

模型管理的标准落地流程（10 步）：

1. **建立命名规范** → 产出物：命名规范文档 + 正则校验规则
2. **建立 Owner 制度** → 产出物：Owner 矩阵（业务 × 数据双签）
3. **引入版本管理** → 产出物：模型文件入 Git / DataOps
4. **建立评审流程** → 产出物：评审 SOP + PR 模板
5. **建立变更管控** → 产出物：变更工单系统 / Jira 集成
6. **上线数据目录** → 产出物：Catalog 平台 + 自动化采集
7. **建立血缘追踪** → 产出物：血缘图谱 + 自动化采集
8. **建立影响分析** → 产出物：影响分析 API
9. **引入 AI 辅助评审** → 产出物：LLM 规范检查工具
10. **持续运营与度量** → 产出物：治理月报、Owner 健康度

### 4.2 关键技术点

- **命名规范**：表名 `dim_*` / `fact_*` / `ods_*` / `dwd_*` / `dws_*` / `ads_*`；字段名小写下划线；业务词根词典强制约束。
- **版本管理**：语义化版本（v1.2.3） + Git commit；每次变更必须有 changelog。
- **Owner 制度**：业务 Owner（业务部门负责人）+ 数据 Owner（数据团队工程师）双签；Owner 必须参加季度模型评审。
- **变更评审**：任何模型变更必须经过 PR 流程 + 影响分析 + 评审会议。
- **变更管控**：使用 Jira / 内部工单系统；变更必须经过"申请→评审→批准→发布→公告"5 步。
- **目录化**：Catalog 平台（DataHub / Unity Catalog / OpenMetadata）+ 自动化元数据采集。
- **血缘追踪**：基于 SQL 解析的字段级血缘（如 DataHub、Apache Atlas）。
- **影响分析**：基于血缘图的反向遍历 API。
- **Schema Evolution**：加字段必须向后兼容；改类型必须双写；删字段必须先下线消费方。
- **AI 辅助**：LLM 阅读 DDL 自动检查命名、口径、Owner 完整性；Agent 评审 PR。

### 4.3 工具链与平台

| 类别 | 工具 | 推荐组合 |
| --- | --- | --- |
| **集中建模** | PowerDesigner、ER/Studio、Navicat、IBM InfoSphere | PowerDesigner（传统重）+ ER/Studio |
| **协作建模** | dbt、SQLMesh、Coalesce、DbSchema | dbt（云原生）+ SQLMesh（增强版） |
| **数据目录** | DataHub、Apache Atlas、Unity Catalog、OpenMetadata、阿里 DataWorks | DataHub（开源） + OpenMetadata（轻量） + Unity Catalog（Databricks 一体化） |
| **版本管理** | Git、GitHub、GitLab、Bitbucket、DataOps | GitHub（最常用） + DataOps（数据工程化） |
| **血缘追踪** | DataHub Lineage、Apache Atlas、OpenLineage、Databricks Unity | DataHub（强元数据）+ OpenLineage（标准化） |
| **变更管控** | Jira、ServiceNow、自研工单系统 | Jira（通用）+ 自研工单（数据专用） |
| **AI 辅助评审（2024+）** | Cursor + dbt、AI Code Review、Databricks Assistant | Cursor + dbt + LLM 评审 |
| **代码评审** | GitHub PR、GitLab MR、Phabricator | GitHub PR（最常用） |
| **数据契约（Data Contract）** | Bitol、Data Contract Specification、Protobuf、OpenAPI | Bitol（规范）+ Protobuf（传输） |

### 4.4 代码 / 配置示例

数据契约（Data Contract）的 YAML 示例：

```yaml
# data_contracts/users_v1.yaml
version: 1.2.0
dataset: users
domain: cdp
description: 用户主数据，跨业务线统一
owners:
  business: business-team@company.com
  data: data-team@company.com
schema:
  fields:
    - name: user_id
      type: string
      nullable: false
      pii: false
      description: 用户唯一标识
    - name: email
      type: string
      nullable: true
      pii: true
      description: 用户邮箱（敏感字段）
      classification: confidential
sla:
  freshness: 1h
  availability: 99.9%
  quality:
    completeness: 0.99
    accuracy: 0.99
lineage:
  upstream:
    - mysql.users
    - kafka.user_events
  downstream:
    - ads.user_profile
    - ml.user_features
```

LLM 规范检查的 Prompt 示例：

```
你是一名资深数据治理专家。请审查以下 DDL 文件，检查：
1. 命名是否符合规范（dim_*, fact_*, ods_* 等前缀）
2. 字段是否有 COMMENT
3. 主键、外键是否完整
4. 是否有敏感字段缺少分类分级
5. 是否有违反命名规范的表名/字段名

请逐条列出问题，并给出修改建议。
```

---
