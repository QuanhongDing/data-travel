> 本文件是 **09-data-lineage.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](09-data-lineage.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：盘点血缘系统（4-8 周）**

1. 列出所有血缘系统（DataHub、Atlas、自研等）。
2. 识别跨域血缘需求。
3. 评估联邦化可行性。
4. 优先级排序。

**Step 2：统一 ID 规范（4-8 周）**

1. 设计 URN 规范（兼容 OpenLineage）。
2. 各系统接入统一 ID。
3. 桥接服务（ID mapping）。
4. 数据校验。

**Step 3：联邦血缘采集（4-8 周）**

1. 各系统 OpenLineage 集成。
2. 跨系统桥接采集。
3. 联邦存储。
4. 数据校验。

**Step 4：血缘 API 网关（4-8 周）**

1. GraphQL Federation 设计。
2. API 网关实现。
3. 缓存、限流、鉴权。
4. API 文档 + SDK。

**Step 5：可视化与集成（4-8 周）**

1. 血缘可视化（自研 / 开源）。
2. 嵌入数据申请流程。
3. 嵌入变更管理。
4. 嵌入 oncall。

**Step 6：AI 升级（持续）**

1. LLM 辅助血缘补全。
2. 自然语言查询血缘。
3. 智能问询。

### 4.2 关键技术点

**1. OpenLineage 联邦采集**：

```python
# openlineage_federated.py
from openlineage.client import OpenLineageClient
from openlineage.client.event import RunEvent, RunState, Run, Job, Dataset

# 多系统联邦客户端
clients = {
    "system_a": OpenLineageClient("http://marquez-a:5000"),
    "system_b": OpenLineageClient("http://marquez-b:5000"),
    "system_c": OpenLineageClient("http://marquez-c:5000"),
}


def emit_federated_lineage(job_name, inputs, outputs, system="system_a"):
    """发送联邦血缘事件"""
    client = clients[system]
    
    event = RunEvent(
        eventType=RunState.COMPLETE,
        eventTime=datetime.now().isoformat(),
        run=Run(runId=str(uuid.uuid4())),
        job=Job(namespace=system, name=job_name),
        inputs=[Dataset(namespace=f"{system}", name=d) for d in inputs],
        outputs=[Dataset(namespace=f"{system}", name=d) for d in outputs],
    )
    client.emit(event)


# 跨系统血缘
emit_federated_lineage(
    job_name="etl_orders",
    inputs=["ods_orders_a", "ods_users_b"],  # 跨系统输入
    outputs=["dwd_orders_a"],
    system="system_a",
)
```

**2. 联邦血缘查询（GraphQL Federation）**：

```graphql
# federated_schema.graphql
type Dataset @key(fields: "urn") {
  urn: String!
  name: String!
  platform: String!
  
  # 联邦血缘（跨系统）
  upstream: [Dataset!]!
    @requires(fields: "urn")
  
  downstream: [Dataset!]!
    @requires(fields: "urn")
  
  # 影响范围
  impactAnalysis(maxHops: Int = 5): ImpactAnalysis
    @requires(fields: "urn")
}

type ImpactAnalysis {
  affectedDatasets: [Dataset!]!
  affectedReports: [Report!]!
  affectedDashboards: [Dashboard!]!
  totalAffected: Int!
}
```

**3. 血缘 API 网关（FastAPI + GraphQL）**：

```python
# lineage_gateway.py
from fastapi import FastAPI, Depends
from strawberry.fastapi import GraphQLRouter
import strawberry


@strawberry.type
class Dataset:
    urn: str
    name: str
    platform: str
    

@strawberry.type
class LineageResult:
    datasets: list[Dataset]
    paths: list[list[Dataset]]


@strawberry.type
class Query:
    @strawberry.field
    async def get_upstream(self, urn: str, max_hops: int = 5) -> LineageResult:
        """反向查询上游"""
        return await lineage_service.get_upstream(urn, max_hops)
    
    @strawberry.field
    async def get_downstream(self, urn: str, max_hops: int = 5) -> LineageResult:
        """正向查询下游"""
        return await lineage_service.get_downstream(urn, max_hops)
    
    @strawberry.field
    async def get_impact(self, urn: str, max_hops: int = 10) -> LineageResult:
        """影响分析"""
        return await lineage_service.get_impact(urn, max_hops)
    
    @strawberry.field
    async def find_root_cause(self, anomaly_urn: str) -> LineageResult:
        """根因分析"""
        return await lineage_service.find_root_cause(anomaly_urn)


app = FastAPI()
graphql_app = GraphQLRouter(Query)
app.include_router(graphql_app, prefix="/graphql")
```

**4. 跨云血缘（Atlan + Databricks）**：

```python
# cross_cloud_lineage.py
"""
跨云血缘示例：AWS + Azure + 阿里云
"""
from atlan import AtlanClient

atlan = AtlanClient(api_key=os.environ["ATLAN_API_KEY"])

# 跨云血缘查询
def query_cross_cloud_lineage(urn: str, max_hops: int = 5):
    """查询跨云血缘"""
    lineage = atlan.lineage.get(
        urn=urn,
        max_hops=max_hops,
        include_cross_cloud=True,
    )
    
    return {
        "urn": urn,
        "upstream": lineage.upstream,
        "downstream": lineage.downstream,
        "cross_cloud_paths": [
            path for path in lineage.paths
            if "aws" in str(path) and "azure" in str(path)
        ],
    }
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**联邦血缘工具**：

| 工具 | 定位 |
| --- | --- |
| **Atlan** | 跨云联邦血缘 + AI |
| **Collibra** | 企业级治理 + 联邦 |
| **DataHub** | 开源 + GraphQL Federation |
| **Unity Catalog** | Databricks Lakehouse 联邦 |
| **阿里云 DataWorks** | 中国本土 + 跨云 |
| **AWS Glue Data Catalog** | AWS 跨账户 |
| **Azure Purview** | Azure 多云 |

**可视化工具**：

| 工具 | 定位 |
| --- | --- |
| **React Flow** | 前端血缘可视化 |
| **D3.js** | 自研可视化 |
| **DataHub UI** | DataHub 内置 |
| **Marquez UI** | Marquez 内置 |
| **Neo4j Browser** | 图数据库可视化 |

**AI 时代新工具（2024-2025）**：

- **Atlan AI**：自然语言查询血缘。
- **Collibra AI**：AI 辅助血缘补全。
- **阿里云 DataWorks 智能血缘**：基于通义千问。
- **Cube Lineage**：Cube.js 字段血缘。

### 4.4 代码 / 示例

**示例 1：联邦血缘查询 API（GraphQL + Neo4j）**

```python
# lineage_federated_api.py
"""
联邦血缘查询 API：基于 Neo4j + GraphQL Federation
"""
from neo4j import GraphDatabase
from typing import List, Optional

driver = GraphDatabase.driver("bolt://neo4j:7687")


def get_cross_domain_lineage(urn: str, direction: str = "BOTH", max_hops: int = 5):
    """跨域血缘查询"""
    
    with driver.session() as session:
        if direction == "UPSTREAM":
            cypher = """
            MATCH path = (n:Asset {urn: $urn})<-[*1..{max_hops}]-(m:Asset)
            WHERE m.platform <> n.platform  // 跨域
            RETURN path, m
            """
        elif direction == "DOWNSTREAM":
            cypher = """
            MATCH path = (n:Asset {urn: $urn})-[*1..{max_hops}]->(m:Asset)
            WHERE m.platform <> n.platform  // 跨域
            RETURN path, m
            """
        else:  # BOTH
            cypher = """
            MATCH path = (n:Asset {urn: $urn})-[*1..{max_hops}]-(m:Asset)
            WHERE m.platform <> n.platform
            RETURN path, m
            """
        
        result = session.run(cypher.format(max_hops=max_hops), urn=urn)
        return [dict(record) for record in result]


def get_end_to_end_path(source_urn: str, target_urn: str):
    """端到端路径查询"""
    
    with driver.session() as session:
        cypher = """
        MATCH path = shortestPath((s:Asset {urn: $source})-[*]-(t:Asset {urn: $target}))
        RETURN path,
               [n IN nodes(path) | n.urn] AS path_urns,
               length(path) AS path_length
        """
        
        result = session.run(cypher, source=source_urn, target=target_urn)
        return [dict(record) for record in result]
```

**示例 2：基于 LLM 的血缘自然语言查询**

```python
# llm_lineage_query.py
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def natural_language_lineage_query(question: str):
    """用自然语言查询血缘"""
    
    prompt = f"""
你是一个数据血缘专家。用户提问：{question}

请输出 GraphQL 查询语句来回答用户的问题。

可用字段：
- getUpstream(urn, maxHops): 上游血缘
- getDownstream(urn, maxHops): 下游血缘
- getImpact(urn, maxHops): 影响分析
- findRootCause(anomalyUrn): 根因分析
- getEndToEndPath(sourceUrn, targetUrn): 端到端路径
- getCrossDomainLineage(urn, direction): 跨域血缘

输出格式：
```graphql
query {{
    ...
}}
```
"""
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    # 提取 GraphQL
    graphql = extract_graphql(response.content[0].text)
    
    # 执行查询
    return execute_lineage_query(graphql)
```

**示例 3：血缘 API 网关 + 缓存**

```python
# lineage_api_with_cache.py
"""
血缘 API 网关 + Redis 缓存
"""
import redis
import hashlib

cache = redis.Redis(host="redis", port=6379)


async def lineage_query_with_cache(query: str, params: dict):
    """带缓存的血缘查询"""
    # 1. 计算缓存 key
    cache_key = hashlib.md5(
        f"{query}:{json.dumps(params, sort_keys=True)}".encode()
    ).hexdigest()
    
    # 2. 查缓存
    cached = cache.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # 3. 查血缘
    result = await execute_lineage_query(query, params)
    
    # 4. 写缓存（5 分钟）
    cache.setex(cache_key, 300, json.dumps(result))
    
    return result
```

---
