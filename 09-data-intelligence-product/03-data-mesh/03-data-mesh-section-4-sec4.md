> 本文件是 **03-data-mesh.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](03-data-mesh.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：组织与战略对齐**

- 高层支持（CIO / CDO 推动）。
- 成立联邦治理委员会（跨业务域代表）。
- 定义 Data Mesh 战略与目标。
- 输出：**Data Mesh 战略书**。

**Step 2：业务域识别**

- 基于 DDD 战略设计（bounded context）。
- 识别核心业务域（5-10 个起步）。
- 识别数据域（每个业务域对应 1+ 个数据域）。
- 输出：**业务域 + 数据域映射表**。

**Step 3：自助式数据平台建设**

- 部署存储层（Iceberg / Hudi / Delta + 对象存储）。
- 部署计算层（Spark / Flink / Trino）。
- 部署目录与血缘（DataHub / OpenMetadata / Gravitino）。
- 部署治理（OPA / Apache Ranger / IAM）。
- 部署安全（IAM / ABAC / 加密 / 审计）。
- 部署 AI 能力（Feature Store / Model Serving / LLM Gateway）。
- 输出：**自助式数据平台**。

**Step 4：数据产品化（首批）**

- 选定 1-2 个高价值数据域（如「客户数据域」「产品数据域」）。
- 设计数据产品（Data Product Canvas）。
- 实施 Data Contract（schema、SLA、版本、Owner）。
- 暴露 Data Product API（REST / GraphQL / 流）。
- 输出：**首批数据产品**。

**Step 5：联邦治理落地**

- 制定全局策略（OPA / Rego）。
- 制定域本地策略。
- 部署策略执行点（Enforcement Point）。
- 建立联邦目录 + 联邦血缘。
- 输出：**联邦治理框架**。

**Step 6：跨域消费与生态**

- 业务方消费数据产品（自助发现、订阅、消费）。
- 建立数据产品市场（Marketplace）。
- 建立计费与激励。
- 输出：**数据产品生态**。

**Step 7：可观测与持续演进**

- 部署数据产品监控（QPS / SLA / 质量）。
- 部署平台监控（资源 / 成本 / 性能）。
- 部署治理审计（合规 / 异常）。
- 持续优化（数据域扩展、新数据产品、治理策略更新）。
- 输出：**Data Mesh 运营体系**。

### 4.2 关键技术点

1. **联邦目录（Federated Catalog）**：DataHub（LinkedIn 开源）、OpenMetadata、Apache Gravitino（2024）、Unity Catalog（Databricks）、Apache Polaris（incubating）、Apache Atlas、Amundsen（Lyft）。
2. **联邦血缘（Federated Lineage）**：OpenLineage（Linux Foundation 标准）、DataHub Lineage、Apache Atlas Lineage、Manta、Marquez。
3. **联邦治理（Federated Governance）**：OPA（Open Policy Agent）+ Rego、Apache Ranger、AWS Lake Formation、IAM + ABAC / RBAC。
4. **联邦查询（Federated Query）**：Trino（PrestoSQL）、Apache Calcite、Starburst、Denodo、Apache Gluten（2024 加速器）。
5. **存储层**：Apache Iceberg（开放表格式）、Apache Hudi、Delta Lake、对象存储（S3 / OSS / MinIO）。
6. **计算层**：Apache Spark、Apache Flink、Dask、Ray、Trino。
7. **数据契约（Data Contract）**：Bitol、ODCS（Open Data Contract Standard）、Data Contract CLI、Pact。
8. **AI / 特征平台**：Feast、Tecton、Databricks Feature Store、AWS SageMaker Feature Store。
9. **LLM / Agent**：LangChain、LlamaIndex、Anthropic Claude、OpenAI、MCP（Model Context Protocol，2024）。
10. **可观测**：Prometheus + Grafana、OpenTelemetry、DataHub Observability、Monte Carlo、Great Expectations。

### 4.3 工具链与平台（含 2024-2025 新工具）

**联邦目录**：

- **DataHub**（LinkedIn 开源）——事实标准元数据 + 血缘 + 目录平台。
- **OpenMetadata**（开源）——开放元数据平台。
- **Apache Gravitino**（Apache，2024 顶级项目）——下一代联邦元数据。
- **Unity Catalog**（Databricks）——Lakehouse 联邦元数据。
- **Apache Polaris**（incubating，2024）——Snowflake 开源的 Lakehouse 目录。
- **Apache Atlas**——传统元数据 + 血缘平台。
- **Amundsen**（Lyft 开源）——元数据目录。
- **DataHub**（LinkedIn 开源）——元数据 + 血缘 + 数据发现。

**联邦血缘**：

- **OpenLineage**（Linux Foundation）——开放血缘标准。
- **DataHub Lineage**——基于事件的血缘。
- **Apache Atlas Lineage**——传统血缘。
- **Manta**——自动化血缘。
- **Marquez**（LF Open）——开放血缘标准。

**联邦治理**：

- **OPA**（Styra 开源）——策略即代码。
- **Apache Ranger**——Hadoop 生态授权 + 审计。
- **AWS Lake Formation**——AWS Lake 治理。
- **IAM + ABAC / RBAC**——云厂商身份与访问控制。
- **Immuta**（商业）——数据访问治理。
- **Collibra**（商业）——数据治理 + 目录。

**联邦查询**：

- **Trino**（PrestoSQL）——分布式 SQL 查询引擎。
- **Starburst**（商业）——Trino 商业版。
- **Apache Calcite**——动态数据管理框架。
- **Apache Gluten**（2024 加速器）——Trino 加速。

**开放表格式**：

- **Apache Iceberg**（事实标准）——Netflix 开源，开放表格式。
- **Apache Hudi**——Uber 开源。
- **Delta Lake**（Linux Foundation）——Databricks 开源。

**对象存储**：

- **AWS S3**、**Aliyun OSS**、**Tencent COS**、**MinIO**（开源）。

**Data Contract**：

- **Bitol**（开源）——Data Contract Specification。
- **ODCS（Open Data Contract Standard）**（Linux Foundation，2024）——开放数据契约标准。
- **Data Contract CLI**（开源）——Data Contract 工具。
- **Pact**（合约测试）——API 合约。

**AI 集成（2024-2025）**：

- **LangChain** + **LlamaIndex**——LLM 框架。
- **MCP（Model Context Protocol，Anthropic 2024）**——AI Agent 数据访问协议。
- **Feast** + **Tecton**——Feature Store。
- **LakeFS** + **Pachyderm**——数据版本管理。

### 4.4 代码 / 示例

**示例 1：基于 OPA + Rego 的联邦治理策略**

```rego
# policy.rego
package data_mesh.access

# 默认拒绝
default allow = false

# 数据所有者可访问
allow {
    input.user.id == input.resource.owner_id
}

# 同域可访问（非受限数据）
allow {
    input.user.domain == input.resource.domain
    input.resource.classification != "restricted"
}

# 数据管理员可访问
allow {
    input.user.role == "data_steward"
    input.resource.classification != "restricted"
}

# 跨域访问需要申请
allow {
    input.user.domain != input.resource.domain
    input.request.approval_status == "approved"
    input.request.approver_role == "domain_owner"
}
```

```python
# Python 调用
from opa_client.opa import OpaClient

client = OpaClient(host="http://localhost:8181")
client.update_policy_from_file("policy.rego")

decision = client.check_policy(
    policy="data_mesh/access",
    data={
        "user": {"id": "alice", "domain": "sales", "role": "analyst"},
        "resource": {"id": "customer_360", "owner_id": "bob", "domain": "sales", "classification": "internal"},
    },
)
print(decision["result"])  # True / False
```

**示例 2：基于 DataHub 的联邦目录与血缘**

```yaml
# datahub ingestion recipe (sales_domain.yaml)
source:
  type: snowflake
  config:
    account: "acme.snowflakecomputing.com"
    warehouse: "SALES_WH"
    username: "datahub"
    password: "${SNOWFLAKE_PASSWORD}"

sink:
  type: datahub-rest
  config:
    server: "http://datahub-gms:8080"

pipeline_name: "sales_domain_ingestion"

# 启用血缘（OpenLineage）
flags:
  enable_lineage: true
  lineage_source: "OPEN_LINEAGE"
```

**示例 3：基于 Trino 的联邦查询（跨域）**

```sql
-- sales 域 + marketing 域联邦查询
WITH sales_data AS (
  SELECT
    customer_id,
    SUM(amount) AS total_sales,
    COUNT(*) AS order_count
  FROM sales_catalog.sales.orders
  WHERE order_date >= DATE '2025-01-01'
  GROUP BY customer_id
),
marketing_data AS (
  SELECT
    customer_id,
    SUM(campaign_cost) AS total_campaign_cost,
    SUM(conversion_count) AS total_conversions
  FROM marketing_catalog.marketing.campaigns
  WHERE campaign_date >= DATE '2025-01-01'
  GROUP BY customer_id
)
SELECT
  s.customer_id,
  s.total_sales,
  m.total_campaign_cost,
  m.total_conversions,
  s.total_sales / NULLIF(m.total_campaign_cost, 0) AS roi
FROM sales_data s
JOIN marketing_data m ON s.customer_id = m.customer_id
ORDER BY roi DESC
LIMIT 100;
```

**示例 4：基于 Bitol 的 Data Contract（YAML）**

```yaml
# customer_360_contract.yaml
apiVersion: bitol.io/v1
kind: DataContract
metadata:
  name: customer_360
  domain: customer
  owner: data-product-team@company.com
  version: 1.2.0

servers:
  - environment: production
    type: snowflake
    path: customer_db.customer_360_view

schema:
  - name: customer_id
    type: string
    classification: confidential
    logicalType: primary_key
  - name: email
    type: string
    classification: pii
    logicalType: email
  - name: total_orders_30d
    type: integer
    classification: internal
    logicalType: count
  - name: churn_probability
    type: number
    classification: confidential
    logicalType: probability

sla:
  freshness: 24h
  availability: 99.9%
  quality:
    completeness: 99.5%
    accuracy: 99%
    consistency: 100%

consumers:
  - team: marketing
    accessLevel: read
  - team: risk
    accessLevel: read

pricing:
  model: free-internal
```

**示例 5：基于 MCP（Model Context Protocol）的 Data Product for Agent**

```python
# mcp_server.py
from mcp.server import Server, Tool
from mcp.types import TextContent

server = Server("customer-data-product")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="query_customer_360",
            description="查询客户 360 度画像（Data Mesh 数据产品）",
            inputSchema={
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string"}
                },
                "required": ["customer_id"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "query_customer_360":
        # 调用 Data Mesh 的联邦查询 API
        response = await datamesh_client.query(
            data_product="customer_360",
            filters={"customer_id": arguments["customer_id"]},
            consumer="agent_runtime"
        )
        return [TextContent(type="text", text=str(response))]
```

---
