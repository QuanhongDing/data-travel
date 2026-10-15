> 本文件是 **05-lineage-and-impact.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](05-lineage-and-impact.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：选型与试点（4-8 周）**

1. 选 1 个核心域（如交易域）试点。
2. 选型：DataHub / Atlas / OpenLineage / Unity Catalog。
3. 部署 + 接入首个数据源。
4. 验证 100 张表的表级血缘。

**Step 2：自动采集（4-8 周）**

1. 部署 SQL 解析服务（覆盖 Hive / Spark / Trino）。
2. 部署 ETL 工具集成（Airflow / DolphinScheduler）。
3. 部署 OpenLineage（如适用）。
4. 自动血缘覆盖率目标 70%+。

**Step 3：字段血缘（8-12 周）**

1. 部署字段血缘解析（Spark Column Lineage / Cube Lineage）。
2. 验证字段血缘准确率（人工抽检 100 个变换）。
3. 与业务方对齐字段语义。
4. 字段血缘覆盖率目标 50%+。

**Step 4：应用集成（4-8 周）**

1. 与数据质量联动（异常 → 血缘定位）。
2. 与变更管理联动（Schema 变更 → 血缘影响分析）。
3. 与安全联动（敏感字段 → 血缘流转图）。
4. 与成本联动（表血缘 → 成本归因）。

**Step 5：智能化升级（持续）**

1. 接入 LLM 辅助血缘补全。
2. 接入自然语言查询（业务方自助）。
3. 智能问询 + 异常归因。

**Step 6：联邦化（持续）**

1. 跨云血缘联邦。
2. 跨账号血缘联邦。
3. 跨团队血缘共享。

### 4.2 关键技术点

**1. 字段血缘采集（SQLFlow）**：

```python
# sqlflow_example.py
# 阿里巴巴 SQLFlow：开源 SQL 血缘解析
# https://github.com/alibaba/sqlflow

from sqlflow import LineageParser

parser = LineageParser(
    dialect="spark_sql",
    visualize=True,
)

sql = """
INSERT INTO dwd_orders (user_id, order_id, total_amount)
SELECT 
    o.user_id,
    o.order_id,
    SUM(oi.price * oi.quantity) AS total_amount
FROM ods_orders o
JOIN ods_order_items oi ON o.order_id = oi.order_id
WHERE o.dt = '2025-01-15'
GROUP BY o.user_id, o.order_id
"""

result = parser.parse(sql)
print(result.to_json())

# 输出：
# {
#   "target_table": "dwd_orders",
#   "target_columns": {
#     "user_id": ["ods_orders.user_id"],
#     "order_id": ["ods_orders.order_id"],
#     "total_amount": [
#       "ods_order_items.price",
#       "ods_order_items.quantity"
#     ]
#   },
#   "source_tables": ["ods_orders", "ods_order_items"],
#   "transformations": {
#     "total_amount": "SUM(price * quantity)"
#   }
# }
```

**2. OpenLineage 集成（Airflow）**：

```python
# airflow_openlineage.py
from airflow import DAG
from airflow.operators.python import PythonOperator
from openlineage.airflow import OpenLineageProvider

# 在 DAG 中自动发出血缘事件
@OpenLineageProvider(
    namespace="spark",
    job_name="etl_orders_daily",
    inputs=[
        {"namespace": "s3://lake", "name": "ods_orders"},
        {"namespace": "s3://lake", "name": "ods_order_items"},
    ],
    outputs=[
        {"namespace": "s3://warehouse", "name": "dwd_orders"},
    ],
)
def etl_orders():
    # ETL 逻辑
    pass


with DAG("etl_orders_daily", schedule_interval="@daily") as dag:
    task = PythonOperator(
        task_id="etl",
        python_callable=etl_orders,
    )
```

**3. 影响分析（基于 DataHub API）**：

```python
# impact_analysis.py
import requests

DATAHUB_GMS = "http://datahub-gms:8080"

def get_downstream_impact(urn: str, max_hops: int = 5) -> list:
    """查询下游影响"""
    query = """
    query getLineage($urn: String!, $direction: LineageDirection!, $maxHops: Int!) {
        entity(urn: $urn) {
            lineage(direction: $direction, maxHops: $maxHops) {
                entities {
                    entity {
                        urn
                        properties {
                            name
                            description
                        }
                        type
                    }
                    path {
                        edges {
                            source
                            destination
                        }
                    }
                }
            }
        }
    }
    """
    response = requests.post(
        f"{DATAHUB_GMS}/api/graphql",
        json={
            "query": query,
            "variables": {
                "urn": urn,
                "direction": "DOWNSTREAM",
                "maxHops": max_hops,
            },
        },
    )
    return response.json()["data"]["entity"]["lineage"]["entities"]


# 使用
downstream = get_downstream_impact(
    "urn:li:dataset:(urn:li:dataPlatform:hive,prod.ods_orders,PROD)",
    max_hops=5,
)
print(f"影响下游: {len(downstream)} 个实体")
for entity in downstream:
    print(f"  - {entity['entity']['properties']['name']}")
```

**4. 根因分析（血缘 + 异常）**：

```python
# root_cause_with_lineage.py
from collections import defaultdict

class LineageRootCauseAnalyzer:
    def __init__(self, lineage_graph):
        self.graph = lineage_graph  # {table: [(parent, transformation)]}
        self.anomaly_scores = {}  # {table: anomaly_score}
    
    def find_root_cause(self, anomaly_table, threshold=0.5):
        """从异常表反向追溯根因"""
        visited = set()
        candidates = []
        
        def dfs(node, depth, path):
            if depth > 10 or node in visited:
                return
            visited.add(node)
            
            score = self.anomaly_scores.get(node, 0)
            if score >= threshold and depth > 0:
                candidates.append({
                    "table": node,
                    "score": score,
                    "distance": depth,
                    "path": path + [node],
                })
            
            for parent, transformation in self.graph.get(node, []):
                dfs(parent, depth + 1, path + [node])
        
        dfs(anomaly_table, 0, [])
        
        # 按 score / distance 排序
        candidates.sort(key=lambda x: x["score"] / (x["distance"] + 1), reverse=True)
        return candidates[:5]
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**开源工具**：

| 工具 | 定位 | 优势 | 劣势 |
| --- | --- | --- | --- |
| **DataHub** | LinkedIn 开源元数据平台 | 字段血缘 + 强大 UI | 部署复杂 |
| **Apache Atlas** | Hadoop 生态元数据 | 强分类分级 | 社区相对小 |
| **Marquez** | OpenLineage 参考实现 | 统一规范 | UI 较弱 |
| **OpenMetadata** | 开源元数据平台 | 易部署 | 生态中 |
| **Metacat** | Netflix 开源元数据 | 简洁 | 已停更 |
| **Datafold** | 数据测试 + 血缘 | Diff 强 | 商业化重 |
| **Amundsen** | Lyft 开元数据 | 搜索强 | 已停更 |

**商业 SaaS**：

| 工具 | 定位 |
| --- | --- |
| **Unity Catalog** | Databricks Lakehouse 血缘 |
| **Collibra** | 企业级数据治理 |
| **Alation** | 数据目录 + 血缘 |
| **Atlan** | 现代数据血缘 + 协作 |
| **Informatica** | 企业级血缘 |
| **阿里云 DataWorks 血缘** | 中国本土 |
| **字节跳动 DataFinder 血缘** | 字节自研 |

**AI 时代新工具（2024-2025）**：

- **Atlan AI**：自然语言查询血缘。
- **Collibra AI**：AI 辅助血缘补全。
- **DataHub + LLM**：自动补全血缘。
- **阿里云 DataWorks 智能血缘**：基于通义千问。
- **Cube Lineage**：Cube.js 字段血缘。

### 4.4 代码 / 示例

**示例 1：完整的血缘平台（OpenLineage + Marquez + DataHub）**

```yaml
# docker-compose.yml
version: '3'
services:
  marquez:
    image: marquezproject/marquez:latest
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=postgres
  
  datahub-gms:
    image: linkedin/datahub-gms:latest
    ports:
      - "8080:8080"
  
  openlineage-proxy:
    image: openlineage/proxy:latest
    ports:
      - "5001:5001"
    environment:
      - OPENLINEAGE_URL=http://marquez:5000
```

**示例 2：基于 Spark 的字段血缘采集**

```python
# spark_column_lineage.py
"""
Spark Column Lineage Listener
通过 Spark Listener 采集字段血缘
"""
from pyspark.sql.session import SparkSession
from pyspark.sql import functions as F
from pyspark import SparkContext

class ColumnLineageListener:
    def __init__(self, output_path):
        self.output_path = output_path
    
    def analyze_sql(self, spark, sql_text, input_tables, output_table):
        """分析 SQL 的字段血缘"""
        # 创建临时视图
        for table in input_tables:
            df = spark.read.format("delta").load(f"s3://lake/{table}")
            df.createOrReplaceTempView(table)
        
        # 执行 SQL
        df = spark.sql(sql_text)
        
        # 提取字段血缘（通过 schema 推断）
        field_lineage = []
        for col in df.columns:
            # 简化：通过 execution plan 提取
            field_lineage.append({
                "output_table": output_table,
                "output_column": col,
                "transformation": "derived",  # 实际需要 SQL 解析
            })
        
        return field_lineage


# 使用
spark = SparkSession.builder.appName("LineageDemo").getOrCreate()
listener = ColumnLineageListener("s3://lineage/")

# 简单血缘
df_orders = spark.read.parquet("s3://lake/orders/")
df_users = spark.read.parquet("s3://lake/users/")

df_joined = (
    df_orders
    .join(df_users, "user_id")
    .select(
        df_orders.order_id,
        df_users.user_name,
        df_orders.amount,
    )
)

df_joined.write.parquet("s3://warehouse/dwd_orders/")
```

**示例 3：基于 LLM 的血缘补全**

```python
# llm_lineage_completion.py
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def complete_lineage_with_llm(table_name, sample_data, related_tables, business_desc):
    """用 LLM 补全血缘"""
    
    prompt = f"""
你是一个数据血缘专家。请基于以下信息判断表 {table_name} 的数据血缘。

## 表 {table_name} 的样例数据
{sample_data}

## 业务描述
{business_desc}

## 相关表
{related_tables}

## 你的任务
1. 分析 {table_name} 的字段可能来自哪些上游表
2. 列出每个字段的来源（上游表 + 上游字段）
3. 说明可能的数据变换逻辑
4. 输出 JSON 格式

## 输出格式
```json
{{
  "table": "{table_name}",
  "fields": [
    {{
      "field": "field_name",
      "upstream": [
        {{"table": "upstream_table", "field": "upstream_field"}}
      ],
      "transformation": "transformation_logic"
    }}
  ]
}}
```
"""
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.content[0].text


# 使用
result = complete_lineage_with_llm(
    table_name="dwd_orders",
    sample_data="""order_id, user_id, amount, status
    1, 100, 100.0, PAID
    2, 101, 200.0, PENDING""",
    related_tables=["ods_orders", "ods_order_items", "ods_users"],
    business_desc="订单事实表，每个订单一行",
)
print(result)
```

---
