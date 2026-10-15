> 本文件是 **10-overseas-cases.md** 的子文件（§4. 关键决策）。完整章节请回到 [index](10-overseas-cases.md)。

## 4. 关键决策

### 4.1 决策 1：Databricks Lakehouse vs Snowflake 数据仓库

#### 4.1.1 决策路径

- **方案 A：传统数仓**（Teradata / Oracle Exadata）——成熟但昂贵。
- **方案 B：云数仓**（Snowflake / BigQuery）——按需付费。
- **方案 C：Lakehouse**（Databricks）——数据湖 + 数据仓库一体化。

#### 4.1.2 Trade-off

| 维度 | Snowflake | Databricks |
| --- | --- | --- |
| 核心定位 | 云数仓 | Lakehouse |
| 多模数据 | 中 | 强 |
| ML 能力 | 中 | 强 |
| AI 能力 | 中（Cortex） | 强（AI Platform） |
| 数据共享 | 强 | 中 |
| 商业化 | 早成熟 | 较新 |

**决策依据**：

- **强 ML / AI**：选 Databricks。
- **强数据共享**：选 Snowflake。
- **强多模数据**：选 Databricks。
- **纯 SQL 数仓**：选 Snowflake。

### 4.2 决策 2：Snowflake 数据共享的价值

#### 4.2.1 数据共享场景

- **跨组织数据共享**：供应商 + 客户。
- **跨云数据共享**：AWS 用户 + Azure 用户。
- **数据市场**：第三方数据交易。

#### 4.2.2 关键创新

- **无需复制数据**：基于"shared database"概念。
- **跨云**：AWS / Azure / GCP 数据共享。
- **数据市场**：Snowflake Data Marketplace。

### 4.3 决策 3：Stripe 的财务一致性

#### 4.3.1 财务一致性挑战

- **强一致性**：财务数据必须 100% 准确。
- **可审计**：每笔交易可追溯。
- **可重放**：可重放历史交易。

#### 4.3.2 实现方式

- **基于 Postgres + 自研**：事务性最强。
- **不可变账本**：所有交易不可变。
- **强审计**：每笔交易有完整审计日志。
- **实时对账**：实时对账机制。

### 4.4 决策 4：Anthropic 数据合规

#### 4.4.1 Anthropic 的数据原则

- **用户数据不用于训练**（除非用户授权）。
- **数据本地化**（企业版）。
- **严格访问控制**（基于角色 + 资源）。
- **完整审计**（所有操作可追溯）。

#### 4.4.2 实现方式

- **数据隔离**：每个客户数据物理隔离。
- **加密**：静态 + 传输加密。
- **访问控制**：基于 RBAC + ABAC。
- **审计日志**：所有操作有日志。

### 4.5 决策 5：OpenAI Agent 演进

#### 4.5.1 Agent 演进路径

- **GPT-3**：基础模型。
- **ChatGPT**：对话。
- **Function Calling**：工具调用。
- **Custom GPTs**：自定义 GPT。
- **Agent SDK**：智能体框架。
- **Swarm**：多智能体协同。

#### 4.5.2 关键创新

- **Function Calling**：工具调用标准。
- **Custom GPTs**：低代码智能体。
- **Agent SDK**：编程式智能体。
- **Swarm**：多智能体协同。

---
