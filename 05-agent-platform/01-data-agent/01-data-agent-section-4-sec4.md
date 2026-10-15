> 本文件是 **01-data-agent.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](01-data-agent.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务边界与场景识别**

- 识别核心数据查询场景（建议从高频问题开始，如"DAU / GMV / 留存率"）。
- 梳理核心指标（5-30 个起步）。
- 梳理核心表（10-50 张起步）。
- 输出：**Data Agent 需求说明书（Data Agent Requirements Specification, DARS）**。

**Step 2：指标语义层建设**

- 选择指标语义层工具（dbt Semantic Layer / Cube.js / MetricFlow / 阿里 QuickBI 指标中台）。
- 定义核心指标（Name / Formula / Dimensions / Filters / Owner / Description）。
- 与数据团队 / 业务团队对齐口径。
- 输出：**OneMetric 体系（指标中台）**。

**Step 3：数据连接与权限配置**

- 接入数据源（数仓 / 业务库 / API）。
- 配置 Agent 专用账号（只读、行级权限）。
- 配置敏感列脱敏规则。
- 输出：**可连接的数据源 + 权限策略**。

**Step 4：Schema 索引与文档化**

- 抽取每张表的 schema（表名、列名、类型、注释、示例值）。
- 写入向量数据库（用于 RAG / Schema Linking）。
- 输出：**Schema 文档 + 向量索引**。

**Step 5：Text2SQL 模型选型与 Prompt 设计**

- 选择 LLM（GPT-4 / Claude / DeepSeek-Coder / 通义千问 / Qwen2.5-Coder）。
- 设计 Prompt（含角色定义、Schema 上下文、Few-shot 示例、输出格式约束）。
- 在 BIRD / Spider 内部测试集评估。
- 输出：**Text2SQL Prompt + 评估报告**。

**Step 6：Agent 编排框架选择**

- 选择框架（LangChain / LangGraph / LlamaIndex / AutoGen）。
- 设计 Agent 工作流（ReAct / Plan-Execute / Multi-Agent）。
- 集成工具（SQL 执行 / Python 执行 / 指标检索 / 可视化）。
- 输出：**可运行的 Agent**。

**Step 7：沙箱执行与审计**

- 部署 SQL 沙箱（基于 Postgres / Doris / ClickHouse 副本 + 资源配额）。
- 配置审计日志（所有 SQL、结果集、执行时长）。
- 配置告警（长查询、大结果集、敏感列访问）。
- 输出：**可审计的沙箱执行环境**。

**Step 8：可观测与评估**

- 集成 Langfuse / Phoenix / LangSmith。
- 配置指标（准确率、延迟、成本、用户满意度）。
- 建立 BIRD / Spider 内部评估集（≥ 200 条）。
- 建立人工反馈闭环。
- 输出：**可观测的 Data Agent 平台**。

### 4.2 关键技术点

**1. 指标语义层（Metric Semantic Layer）**

- **dbt Semantic Layer**（2023）：YAML 定义指标，dbt 编译 SQL，REST API 查询。
- **Cube.js**：前端友好，TypeScript schema 定义。
- **MetricFlow**（Airbnb）：与 dbt 集成，支持复杂指标。
- **阿里 QuickBI 指标中台**：国内最大实践，统一指标定义 + 权限 + 血缘。
- **网易有数指标库**：游戏行业广泛使用。

**2. Text2SQL Prompt 工程**

- **角色定义**：明确告诉 LLM 它是"资深 SQL 工程师"。
- **Schema 上下文**：只注入相关表 / 列的 schema（不要全库 schema，否则上下文爆炸）。
- **Few-shot 示例**：给 3-5 个高质量示例，覆盖 JOIN、聚合、子查询、窗口函数等。
- **输出格式约束**：强制 JSON / XML 输出，便于解析。
- **错误处理指令**：明确告诉 LLM 如果 SQL 执行失败怎么反思。

**3. Schema Linking**

- **基于 Embedding**：用 BGE-M3 / OpenAI Embedding 对表名 / 列名 / 注释做向量检索。
- **基于 LLM**：让 LLM 根据用户问题直接选相关表 / 列（DIN-SQL、CHESS 范式）。
- **混合**：字符串匹配 + 向量召回 + LLM 精排三件套。

**4. Self-Correction / Reflexion**

- **执行错误修正**：基于 PostgreSQL / MySQL 错误码（语法错、权限错、表不存在）。
- **结果异常修正**：行数为 0 / 空值比例过高 / 数值异常 → 自动反思。
- **Explain 计划修正**：检测全表扫描 → 自动建议索引或重写。
- **业务规则修正**：GMV 不为负、DAU 不会突然涨 100 倍 → 自动校验。

**5. 沙箱执行（Sandbox）**

- **数据库账号**：独立只读账号，限定可访问 schema / 表。
- **查询超时**：默认 30 秒，可配置。
- **行数限制**：默认返回 10000 行，可配置。
- **敏感列脱敏**：身份证、手机号、邮箱自动 mask。
- **资源配额**：每用户 / 部门每日查询次数、扫描行数。
- **审计日志**：所有 SQL、结果集（脱敏后）、执行时间。

**6. 多轮精修（Multi-turn）**

- **对话历史管理**：滑动窗口（保留最近 N 轮）+ 摘要压缩。
- **澄清反问**：Agent 不确定时主动反问（"你要看北京还是全国？"）。
- **意图追踪**：识别用户是想"查询"、"对比"还是"归因"。

**7. Python 沙箱（Code Interpreter）**

- **E2B**：云端 Python 沙箱，支持 numpy / pandas / matplotlib。
- **阿里 Code Interpreter**：阿里云函数计算 + 隔离容器。
- **OpenInterpreter**：开源本地版。

**8. 可观测（Observability）**

- **Langfuse**（开源）：Agent 可观测平台，含 Trace、Token 用量、Prompt 版本管理。
- **Phoenix**（Arize）：LLM 可观测，含 Drift 检测、Evaluation。
- **LangSmith**（LangChain 官方）：含 Debug、Eval、Monitor。
- **Helicone**：专注 LLM 成本优化的可观测平台。

**9. 评估体系（Evaluation）**

- **BIRD-SQL 2.0**：企业级 Text2SQL 基准（2024），含真实业务库、跨方言、复杂查询。
- **Spider 2.0**（2024）：更复杂的企业级 SQL 基准。
- **内部评估集**：≥ 200 条业务问题 + 标准答案。
- **LLM-as-a-Judge**：用 GPT-4 / Claude 自动评分。
- **人工抽检**：每周抽 5% 人工评分。
- **用户反馈**：用户 👍 / 👎 反馈 → 评估数据集。

**10. 安全与权限**

- **行级权限**：每个用户只能查自己部门的数据（基于 Postgres RLS / Hive Ranger）。
- **列级权限**：敏感列脱敏（基于 Hive / ClickHouse 列权限）。
- **审计日志**：所有查询可追溯（满足等保 2.0 / 3.0）。
- **Prompt 注入防护**：用户问题中插入恶意 Prompt → SQL 注入防护。

### 4.3 工具链与平台（含 2024-2025 新工具）

**LLM 基础模型**：

- **OpenAI GPT-4o / GPT-4 Turbo**：Text2SQL SOTA 之一。
- **Anthropic Claude 3.5 / 3.7 Sonnet**：长上下文、强推理。
- **Google Gemini 1.5 / 2.0**：100 万 token 上下文，适合 Schema 全注入。
- **DeepSeek-Coder-V2**（2024）：开源，Text2SQL SOTA。
- **Qwen2.5-Coder**（阿里 2024）：开源，中文 NL2SQL SOTA。
- **CodeLlama / StarCoder**：开源代码模型，可微调。
- **文心 ERNIE 4.0 / 通义千问 Qwen-Max**：国产模型，中文场景。

**Agent 编排框架**：

- **LangChain**（2022+）：最早的 LLM 编排框架，含 SQL Agent 模板。
- **LangGraph**（2024）：基于图的工作流编排，适合 Multi-Agent。
- **LlamaIndex**（2022+）：RAG 框架，含 SQL Connector。
- **AutoGen**（Microsoft 2023）：Multi-Agent 框架。
- **CrewAI**（2024）：角色化 Multi-Agent 框架。
- **OpenInterpreter**（2023）：本地代码执行 Agent。
- **MetaGPT**（2024）：多 Agent 协作框架。

**指标语义层**：

- **dbt Semantic Layer**（2023）。
- **Cube.js**。
- **MetricFlow**（Airbnb）。
- **阿里 QuickBI 指标中台**。
- **网易有数指标库**。
- **Kylin**（Apache，OLAP 引擎，间接支持）。

**向量数据库（Schema RAG）**：

- **Milvus**（国产开源）。
- **Qdrant**（开源）。
- **Weaviate**（开源）。
- **Pinecone**（云）。
- **Chroma**（轻量）。
- **pgvector**（Postgres 插件）。

**沙箱执行**：

- **PostgreSQL Read Replica**：低成本 SQL 沙箱。
- **Apache Doris**：MPP 架构，适合大查询隔离。
- **ClickHouse**：列存，OLAP 沙箱首选。
- **阿里云 MaxCompute** / **Hive**：国内数仓主流。
- **E2B**（云 Python 沙箱）。
- **Jupyter Kernel Gateway**：本地 Python 沙箱。

**评估与基准**：

- **BIRD-SQL 2.0**（2024-05）：企业级 Text2SQL 基准，含真实业务库、跨方言、复杂查询。
- **Spider 2.0**（2024-12）：更复杂的企业级 SQL 基准。
- **EHRSQL**（医疗领域）。
- **Spider 1.0**（2018，经典）。
- **WikiSQL**（2017，最早）。

**可观测与成本**：

- **Langfuse**（开源，2023-）——LLM 可观测事实标准之一。
- **Phoenix**（Arize，开源）。
- **LangSmith**（LangChain 官方）。
- **Helicone**（成本优化）。
- **Datadog LLM Observability**（2024+）。

**国产平台（2024-2025）**：

- **阿里瓴羊 QuickBI 智能助手**——企业级 Data Agent。
- **字节豆包数据分析**——多模态数据分析。
- **百度 Sugar BI 智能助手**——对话式 BI。
- **腾讯 ChatBI**——金融场景。
- **网易有数 AI**——游戏 / 电商场景。
- **火山引擎 Data Agent**——云原生 Data Agent。

**国际平台（2025）**：

- **Salesforce Tableau GPT**（2023）——BI + LLM。
- **Microsoft Copilot for Power BI**（2024）——自然语言数据分析。
- **ThoughtSpot Sage**（2023）——Search + LLM。
- **Google Gemini in Looker**（2024）——Looker + Gemini。
- **Databricks Assistant / Genie**（2024）——Lakehouse + LLM。
- **Snowflake Cortex Analyst**（2024）——Cortex + Text2SQL。

### 4.4 代码 / 示例

**示例 1：基于 LangChain 的基础 SQL Agent（带 Reflexion）**

```python
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_openai import ChatOpenAI
from langchain.agents.agent_types import AgentType

# 连接数据库
db = SQLDatabase.from_uri(
    "postgresql://readonly:***@localhost:5432/analytics",
    include_tables=["orders", "customers", "products"],
    sample_rows_in_table_info=2,
)

# 初始化 LLM
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# 创建 SQL Agent（带 Reflexion）
agent_executor = create_sql_agent(
    llm=llm,
    db=db,
    agent_type=AgentType.OPENAI_FUNCTIONS,
    verbose=True,
    max_iterations=5,  # 最多反思 5 次
    max_execution_time=30,  # 单次 SQL 超时 30s
    handle_parsing_errors=True,
)

# 多轮精修
questions = [
    "昨天 GMV 是多少？",
    "那按地区拆分呢？",
    "为什么华南下降这么多？",
]

for q in questions:
    result = agent_executor.invoke({"input": q})
    print(f"Q: {q}\nA: {result['output']}\n")
```

**示例 2：基于 LangGraph 的 Multi-Agent Data Analyst**

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List
import operator

class AgentState(TypedDict):
    question: str
    intent: str
    schema: List[str]
    sql: str
    result: List[dict]
    error: str
    answer: str

def intent_classifier(state):
    """意图分类 Agent"""
    prompt = f"判断问题类型：指标查询 / 归因分析 / 数据探索 / 元数据问答\n问题：{state['question']}"
    intent = llm.invoke(prompt).content
    return {"intent": intent}

def schema_retriever(state):
    """Schema 检索 Agent"""
    schema = vector_db.similarity_search(state["question"], k=5)
    return {"schema": [s.page_content for s in schema]}

def sql_generator(state):
    """SQL 生成 Agent"""
    prompt = f"""你是资深 SQL 工程师。
问题：{state['question']}
Schema：{state['schema']}
请生成 PostgreSQL SQL，使用 ```sql``` 包裹。"""
    sql = llm.invoke(prompt).content
    return {"sql": sql}

def sql_validator(state):
    """SQL 校验 Agent"""
    sql = state["sql"]
    # 语法校验（基于 sqlglot）
    from sqlglot import parse_one
    try:
        parsed = parse_one(sql, dialect="postgres")
        # 权限校验（表必须在白名单）
        for table in parsed.find_all(__import__('sqlglot').exp.Table):
            if table.name not in ALLOWED_TABLES:
                return {"error": f"禁止访问表 {table.name}"}
        return {"sql": sql, "error": ""}
    except Exception as e:
        return {"error": str(e)}

def sql_executor(state):
    """SQL 执行 Agent（沙箱）"""
    if state.get("error"):
        return {"result": []}
    result = sandbox.execute(state["sql"], timeout=30, max_rows=10000)
    if result.error:
        return {"error": result.error}
    return {"result": result.rows}

def reflexion(state):
    """反思 Agent：决定是否重新生成 SQL"""
    if state.get("error") and state.get("retry_count", 0) < 3:
        return "retry"
    return "continue"

def answer_synthesizer(state):
    """答案综合 Agent"""
    prompt = f"""用户问题：{state['question']}
SQL 结果：{state['result']}
请用自然语言回答用户问题，并解释关键数字。"""
    answer = llm.invoke(prompt).content
    return {"answer": answer}

# 构建 LangGraph
workflow = StateGraph(AgentState)
workflow.add_node("intent", intent_classifier)
workflow.add_node("schema", schema_retriever)
workflow.add_node("sql_gen", sql_generator)
workflow.add_node("sql_val", sql_validator)
workflow.add_node("sql_exec", sql_executor)
workflow.add_node("answer", answer_synthesizer)

workflow.set_entry_point("intent")
workflow.add_edge("intent", "schema")
workflow.add_edge("schema", "sql_gen")
workflow.add_edge("sql_gen", "sql_val")
workflow.add_edge("sql_val", "sql_exec")
workflow.add_conditional_edges(
    "sql_exec",
    reflexion,
    {"retry": "sql_gen", "continue": "answer"}
)
workflow.add_edge("answer", END)

app = workflow.compile()
result = app.invoke({"question": "昨天 GMV 是多少？"})
```

**示例 3：指标语义层（dbt Semantic Layer YAML）**

```yaml
# metrics.yml (dbt)
metrics:
  - name: dau
    description: "Daily Active Users - 当日活跃用户数"
    owner: "[email protected]"
    type: simple
    sql: "COUNT(DISTINCT user_id)"
    filters:
      - "{{ Dimension('activity__is_active') }} = TRUE"
    dimensions:
      - activity_date
      - platform
      - country
    time_grains: [day, week, month]
    
  - name: gmv
    description: "Gross Merchandise Volume - 商品交易总额"
    owner: "[email protected]"
    type: simple
    sql: "SUM(order_amount)"
    filters:
      - "{{ Dimension('order__status') }} IN ('paid', 'shipped', 'completed')"
    dimensions:
      - order_date
      - region
      - channel
      - category
    time_grains: [day, week, month]

# Data Agent 自动基于此生成 SQL
```

**示例 4：SQL 沙箱执行 + 审计日志（Python）**

```python
import psycopg2
from contextlib import contextmanager
import logging

audit_logger = logging.getLogger("data_agent.audit")

ALLOWED_TABLES = {"orders", "customers", "products", "order_items"}
MAX_ROWS = 10000
TIMEOUT_SEC = 30

@contextmanager
def sandbox_connection(user_id: str):
    """SQL 沙箱连接"""
    conn = psycopg2.connect(
        "postgresql://readonly:***@localhost:5432/analytics",
        options=f"-c statement_timeout={TIMEOUT_SEC * 1000}",
    )
    try:
        yield conn
    finally:
        conn.close()

def execute_sql_safely(sql: str, user_id: str):
    """安全执行 SQL（含白名单、超时、行数限制、审计）"""
    # 1. 表白名单校验
    from sqlglot import parse_one
    parsed = parse_one(sql, dialect="postgres")
    for table in parsed.find_all(__import__('sqlglot').exp.Table):
        if table.name not in ALLOWED_TABLES:
            audit_logger.warning(f"User {user_id} 尝试访问表 {table.name}")
            raise PermissionError(f"禁止访问表 {table.name}")
    
    # 2. 强制 LIMIT
    if not sql.upper().strip().endswith("LIMIT 10000"):
        sql = sql.rstrip(";").strip() + f"\nLIMIT {MAX_ROWS}"
    
    # 3. 执行 + 审计
    with sandbox_connection(user_id) as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(sql)
                rows = cur.fetchall()
                columns = [d[0] for d in cur.description]
                result = [dict(zip(columns, row)) for row in rows]
                
                audit_logger.info(
                    "user=%s, sql=%s, rows=%d, duration=%.2fs",
                    user_id, sql, len(result), cur.query.duration
                )
                return {"success": True, "data": result}
            except Exception as e:
                audit_logger.error(
                    "user=%s, sql=%s, error=%s",
                    user_id, sql, str(e)
                )
                return {"success": False, "error": str(e)}
```

---
