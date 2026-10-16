> 本文件是 **06-one-service.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](06-one-service.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：数据资产盘点**

- 盘点所有数据资产（表 / 指标 / 标签 / 维度）。
- 评估「可服务化价值」（访问频率、业务重要性）。
- 输出：**数据资产清单 + 服务化优先级**。

**Step 2：服务化设计**

- 选 API 模式（指标 / 标签 / 宽表 / GraphQL / Text-to-API）。
- 设计 API Schema（REST / GraphQL）。
- 设计权限模型（行 / 列 / 指标级）。
- 设计版本管理策略。
- 输出：**API 设计文档**。

**Step 3：指标 / 标签平台搭建**

- 建立指标平台（详见 [10-metric-platform](../10-metric-platform/10-metric-platform.md)）。
- 建立标签平台（用户 / 商品 / 内容画像）。
- 统一指标 / 标签定义、口径、Owner。
- 输出：**统一指标 / 标签库**。

**Step 4：API 平台搭建**

- 选 API 网关（详见 [07-data-api-gateway](../07-data-api-gateway/07-data-api-gateway.md)）。
- 选 API 框架（FastAPI / Spring Boot / Go）。
- 实现认证 / 鉴权 / 限流 / 监控。
- 输出：**API 平台**。

**Step 5：后端数据源对接**

- 对接数仓（MySQL / Hive / ClickHouse / Iceberg）。
- 对接实时数据（Flink / Kafka Streams）。
- 实现查询优化（索引、物化、缓存）。
- 输出：**可查询的数据后端**。

**Step 6：元数据注册**

- 把所有 API 注册到数据目录（详见 [08-data-catalog](../08-data-catalog/08-data-catalog.md)）。
- 配置 Schema、血缘、Owner、文档。
- 输出：**可发现的 API 目录**。

**Step 7：评估与监控**

- 评估指标：QPS、延迟、错误率、缓存命中率、用户满意度。
- 监控大盘：Grafana + Prometheus。
- 告警：异常 QPS / 错误率 / 延迟。
- 输出：**可观测的 OneService 平台**。

**Step 8：AI 集成**

- 把 API 注册为 Agent Tool（Function Calling）。
- 集成 Text-to-API（Snowflake Cortex 模式）。
- 收集 LLM 调用反馈，优化 API 设计。
- 输出：**AI 原生 OneService**。

### 4.2 关键技术点

1. **API 设计规范**：REST 命名、参数校验、错误码、版本管理。
2. **限流策略**：令牌桶、滑动窗口、配额管理。
3. **鉴权**：OAuth 2.0、JWT、API Key、RBAC。
4. **缓存**：Redis 结果缓存、ClickHouse 物化、本地 Caffeine。
5. **查询优化**：索引下推、覆盖索引、JOIN 优化、向量化执行。
6. **权限模型**：行级（Casbin / OPA）、列级（动态脱敏）、指标级（白名单）。
7. **可观测**：Prometheus 指标、Jaeger 链路追踪、ELK 日志。
8. **API 网关**：Kong / APISIX / Tyk / Envoy（详见 [07-data-api-gateway](../07-data-api-gateway/07-data-api-gateway.md)）。
9. **GraphQL**：Hasura / Apollo / PostGraphile。
10. **Function Calling**：OpenAI Function Calling / Anthropic Tool Use / MCP。
11. **Text-to-API**：Snowflake Cortex Analyst / Databricks Genie / 自研。
12. **数据契约**：Data Contract（Schema、SLA、Owner）。

### 4.3 工具链与平台

**API 网关**：

- **Kong**（开源）——API 网关事实标准，插件生态丰富。
- **Apache APISIX**（国产开源）——云原生 API 网关，性能强。
- **Tyk**（开源）——轻量 API 网关。
- **Envoy + Istio**（云原生）——服务网格 + API 网关。

**API 框架**：

- **FastAPI**（Python）——现代 Python API 框架，自动生成 OpenAPI。
- **Spring Boot**（Java）——Java 生态主流。
- **Gin / Echo**（Go）——Go 生态主流。
- **Express / NestJS**（Node.js）——Node 生态主流。

**GraphQL 平台**：

- **Hasura**（开源）——PostgreSQL 自动 GraphQL，零代码。
- **Apollo GraphQL**（开源）——GraphQL 编排平台。
- **PostGraphile**（开源）——PostgreSQL → GraphQL。
- **GraphQL Mesh**——多源 GraphQL 联邦。

**自动 API 生成**：

- **PostgREST**（开源）——PostgreSQL → REST API。
- **DreamFactory**（开源）——多数据库 → REST API。
- **Directus**（开源）——数据库 → Headless CMS + API。
- **Supabase**（开源）——PostgreSQL + 自动 API。

**指标 / 标签平台**：

- **阿里 OneService**（商业）——阿里数据中台的核心。
- **dbt Semantic Layer**（开源）——指标定义 + 服务化。
- **Cube / Cube.js**（开源）——指标 API 平台。
- **MetricFlow**（开源）——Airbnb 开源指标定义。
- **Transform**（商业）——指标平台 SaaS。
- **Airbnb Minerva**（开源）——指标定义框架。

**Text-to-API**：

- **Snowflake Cortex Analyst**（2024）——自然语言查询指标。
- **Databricks Genie**（2024）——自然语言查询数据。
- **阿里 Quick BI + AI**（2024）——国内自然语言 BI。
- **腾讯 BI + LLM**（2024）——国内自然语言 BI。

### 4.4 代码 / 示例

**示例 1：FastAPI + ClickHouse 指标 API**

```python
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import clickhouse_connect

app = FastAPI(title="OneService Metrics API")
security = HTTPBearer()

@app.get("/api/v1/metric/{metric_name}")
async def get_metric(
    metric_name: str,
    dim: list[str] = Query(default=[]),
    time_range: str = Query(...),
    filters: dict = Query(default={}),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    # 1. 鉴权
    user = verify_token(credentials.credentials)

    # 2. 权限检查（指标级）
    if not has_metric_permission(user, metric_name):
        raise HTTPException(403, "no permission")

    # 3. 指标定义查询
    metric_def = get_metric_definition(metric_name)

    # 4. SQL 生成
    sql = build_sql(metric_def, dim, time_range, filters, user.row_filter)

    # 5. ClickHouse 查询
    client = clickhouse_connect.get_client(host='clickhouse', port=8123)
    result = client.query(sql)

    return {"data": result.result_rows, "meta": {"metric": metric_name, "version": metric_def.version}}
```

**示例 2：Hasura 自动 GraphQL**

```yaml
# Hasura 自动从 PostgreSQL 生成 GraphQL
tables:
  - name: orders
    select_permissions:
      - role: analyst
        filter:
          order_date: { _gte: "2025-01-01" }
        columns:
          - order_id
          - order_amount
          - user_id
  - name: users
    select_permissions:
      - role: analyst
        columns:
          - user_id
          - name
          - city
```

```graphql
# 业务方用 GraphQL 查询
query {
  orders(where: {user: {city: {_eq: "Beijing"}}}, limit: 10) {
    order_id
    order_amount
    user { name }
  }
}
```

**示例 3：Function Calling 数据服务**

```python
from openai import OpenAI

client = OpenAI()

# 定义 OneService API 为 Tool
tools = [{
    "type": "function",
    "function": {
        "name": "get_metric",
        "description": "获取业务指标，如 GMV、DAU",
        "parameters": {
            "type": "object",
            "properties": {
                "metric_name": {"type": "string", "enum": ["gmv", "dau", "conversion_rate"]},
                "time_range": {"type": "string"},
                "filters": {"type": "object"}
            },
            "required": ["metric_name", "time_range"]
        }
    }
}]

# LLM 决定调用
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "上个季度 GMV 是多少？"}],
    tools=tools
)

# 执行 API 调用
if response.choices[0].finish_reason == "tool_calls":
    args = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
    result = call_oneservice_api(args)
```

---
