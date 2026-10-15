> 本文件是 **06-data-assetization.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](06-data-assetization.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：盘点（4-8 周）**

1. 扫描所有数据源（Hive / Snowflake / S3 / Kafka）。
2. 自动生成元数据清单。
3. 业务方调研（关键 50 个数据资产）。
4. 数据资产 1.0 清单（Name / Owner / Description）。

**Step 2：分级与分类（4-8 周）**

1. 按业务价值分 4 级（L1 战略 / L2 重要 / L3 一般 / L4 备份）。
2. 按数据敏感度分 4 类（公开 / 内部 / 机密 / 绝密）。
3. 按数据状态分 3 类（活跃 / 半活跃 / 归档）。
4. 输出《数据资产清单 v2》。

**Step 3：估值（4-8 周）**

1. 选 10 个核心资产做估值试点。
2. 用 3 种方法（成本法 + 收益法 + 市场法）交叉验证。
3. 输出《数据估值模型》。
4. 与财务团队对齐估值方法。

**Step 4：治理与产品化（8-12 周）**

1. 高价值资产优先治理（质量 / 安全 / 元数据）。
2. 把高价值资产封装为数据产品（API / 报表 / 模型）。
3. 数据目录接入产品信息。
4. 上线数据市场（内部）。

**Step 5：ROI 与运营（持续）**

1. 月度 ROI 评估。
2. 数据产品定价 / 计费。
3. 数据消费方反馈。
4. 数据资产入表（财务）。

### 4.2 关键技术点

**1. 数据估值模型**：

```python
# data_valuation.py
from dataclasses import dataclass
from typing import List

@dataclass
class DataAssetValuation:
    name: str
    cost_method: float  # 成本法
    income_method: float  # 收益法
    market_method: float  # 市场法
    
    def weighted_valuation(self) -> float:
        """加权平均估值"""
        return (
            0.4 * self.cost_method +
            0.4 * self.income_method +
            0.2 * self.market_method
        )


def cost_method(asset_metadata) -> float:
    """成本法：基于 TCO"""
    return (
        asset_metadata['collection_cost'] +
        asset_metadata['storage_cost'] * 12 +  # 年化
        asset_metadata['governance_cost'] * 12 +
        asset_metadata['opportunity_cost']
    )


def income_method(asset_metadata, discount_rate=0.1, years=5) -> float:
    """收益法：DCF"""
    future_revenue = asset_metadata.get('annual_revenue', 0)
    if future_revenue == 0:
        return 0
    
    npv = sum(
        future_revenue / (1 + discount_rate) ** t
        for t in range(1, years + 1)
    )
    return npv


def market_method(asset_metadata) -> float:
    """市场法：基于市场可比交易"""
    market_price = asset_metadata.get('market_price_per_gb', 0)
    size_gb = asset_metadata.get('size_gb', 0)
    return market_price * size_gb


# 使用
valuation = DataAssetValuation(
    name="用户画像资产",
    cost_method=200_0000,  # 200 万
    income_method=800_0000,  # 800 万
    market_method=500_0000,  # 500 万
)
print(f"综合估值: {valuation.weighted_valuation():,.0f}")
```

**2. 数据资产目录（基于 DataHub）**：

```python
# datahub_catalog.py
from datahub.emitter.mce_builder import (
    make_dataset_urn, make_user_urn, make_tag_urn
)
from datahub.emitter.mcp import MetadataChangeProposalWrapper
from datahub.emitter.rest_emitter import DatahubRestEmitter
from datahub.metadata.schema_classes import (
    DatasetPropertiesClass, OwnershipClass,
    OwnerClass, OwnershipTypeClass, GlobalTagsClass,
    TagAssociationClass
)

emitter = DatahubRestEmitter("http://datahub:8080")

def register_data_asset(dataset_urn, name, description, owners, tags):
    """注册数据资产"""
    
    # 1. 基本属性
    dataset_props = DatasetPropertiesClass(
        name=name,
        description=description,
        customProperties={
            "tier": "L1",  # 战略级
            "valuation": "5000000",  # 500 万
            "annual_cost": "200000",  # 20 万/年
        }
    )
    emitter.emit(MetadataChangeProposalWrapper(entityUrn=dataset_urn, aspect=dataset_props))
    
    # 2. Owner
    ownership = OwnershipClass(
        owners=[
            OwnerClass(
                owner=make_user_urn(owner),
                type=OwnershipTypeClass.TECHNICAL_OWNER,
            ) for owner in owners
        ]
    )
    emitter.emit(MetadataChangeProposalWrapper(entityUrn=dataset_urn, aspect=ownership))
    
    # 3. 标签
    global_tags = GlobalTagsClass(
        tags=[
            TagAssociationClass(tag=make_tag_urn(tag))
            for tag in tags
        ]
    )
    emitter.emit(MetadataChangeProposalWrapper(entityUrn=dataset_urn, aspect=global_tags))


# 使用
register_data_asset(
    dataset_urn=make_dataset_urn("hive", "prod.dwd_user_profile"),
    name="用户画像宽表",
    description="用户多维度画像，整合消费、兴趣、人口属性",
    owners=["alice", "bob"],
    tags=["pii", "L1-strategic", "high-valuation"],
)
```

**3. 数据产品化（数据 API）**：

```python
# data_product_api.py
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import time

app = FastAPI(title="Data Product API: 用户画像")

# 计费（Showback）
class UsageTracker:
    def __init__(self):
        self.usage = {}  # {team: {count, last_reset}}
    
    def track(self, team: str, query_cost: float = 1.0):
        if team not in self.usage:
            self.usage[team] = {"count": 0, "cost": 0.0}
        self.usage[team]["count"] += 1
        self.usage[team]["cost"] += query_cost


tracker = UsageTracker()


class UserProfile(BaseModel):
    user_id: str
    age: Optional[int]
    gender: Optional[str]
    consumption_tier: Optional[str]
    interests: list


@app.get("/api/v1/user-profile/{user_id}")
def get_user_profile(user_id: str, team: str = "default"):
    """获取用户画像（数据产品）"""
    
    # 计费
    tracker.track(team, query_cost=0.01)  # 每次 0.01 元
    
    # 数据查询（模拟）
    profile = fetch_user_profile(user_id)
    
    return profile


@app.get("/api/v1/usage")
def get_usage(team: Optional[str] = None):
    """查看数据消费用量（Showback）"""
    if team:
        return {team: tracker.usage.get(team, {})}
    return tracker.usage


# 月度账单
def monthly_billing():
    """月度计费报表（Chargeback）"""
    return {
        team: {
            "count": data["count"],
            "cost": data["cost"],
        }
        for team, data in tracker.usage.items()
    }
```

**4. 数据市场（数据交易）**：

```python
# data_marketplace.py
"""
数据市场示例：内部数据产品交易所
"""
from typing import List
from dataclasses import dataclass
from enum import Enum


class ProductTier(str, Enum):
    FREE = "FREE"  # 免费
    BASIC = "BASIC"  # 基础版
    PREMIUM = "PREMIUM"  # 高级版


@dataclass
class DataProduct:
    id: str
    name: str
    description: str
    owner: str
    tier: ProductTier
    price_per_call: float  # 元 / 次调用
    sla: str  # "99.9%, 1h freshness"
    classification: str  # 公开 / 内部 / 机密


class DataMarketplace:
    def __init__(self):
        self.products = {}
        self.contracts = []  # 消费合约
    
    def list_product(self, product: DataProduct):
        self.products[product.id] = product
    
    def subscribe(self, product_id: str, consumer_team: str, volume: int):
        """订阅数据产品"""
        product = self.products[product_id]
        contract = {
            "product_id": product_id,
            "consumer": consumer_team,
            "volume": volume,
            "cost": product.price_per_call * volume,
            "sla": product.sla,
        }
        self.contracts.append(contract)
        return contract


# 上架产品
market = DataMarketplace()
market.list_product(DataProduct(
    id="user-profile-v1",
    name="用户画像 API v1",
    description="用户多维度画像，整合消费、兴趣、人口属性",
    owner="data-platform@example.com",
    tier=ProductTier.BASIC,
    price_per_call=0.01,  # 0.01 元 / 次
    sla="99.9% availability, daily freshness",
    classification="内部",
))

# 业务方订阅
contract = market.subscribe(
    product_id="user-profile-v1",
    consumer_team="marketing-team",
    volume=1_000_000,  # 100 万次
)
print(f"合约: {contract}")
print(f"月成本: {contract['cost']} 元")
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**数据目录工具**：

| 工具 | 定位 | 优势 |
| --- | --- | --- |
| **DataHub** | LinkedIn 开源 | 字段血缘 + AI 集成 |
| **Apache Atlas** | Hadoop 生态 | 强分类分级 |
| **Unity Catalog** | Databricks | Lakehouse 原生 |
| **Alation** | 商业数据目录 | 数据治理 |
| **Collibra** | 企业级治理 | 合规优先 |
| **Atlan** | 现代数据目录 | 协作 + AI |
| **阿里云 DataWorks 资产** | 中国本土 | 中文友好 |
| **阿里云 DAS** | 阿里云原生 | 深度集成 |
| **字节 DataFinder** | 字节自研 | 内部强大 |

**数据中台工具**：

| 工具 | 定位 |
| --- | --- |
| **阿里数据中台** | 商业化（Quick BI + OneID） |
| **字节数据中台** | 字节跳动内部 |
| **华为数据中台** | 华为云 FusionInsight |
| **京东数据中台** | 京东内部 |
| **腾讯数据中台** | 腾讯云 + 内部 |

**数据市场平台**：

| 工具 | 定位 |
| --- | --- |
| **Snowflake Marketplace** | Snowflake 生态 |
| **Databricks Marketplace** | Databricks 生态 |
| **AWS Data Exchange** | AWS 生态 |
| **Azure Data Share** | Azure 生态 |
| **阿里云数据市场** | 中国本土 |
| **上海数据交易所** | 中国国家级 |
| **贵阳大数据交易所** | 中国国家级 |

**AI 时代新工具（2024-2025）**：

- **Atlan AI**：自然语言查询资产。
- **Collibra AI**：AI 驱动治理。
- **DataHub + LLM**：AI 集成。
- **Unity Catalog + AI**：AI 模型治理。
- **阿里云 DAS 智能盘点**：通义千问自动盘点。

### 4.4 代码 / 示例

**示例 1：完整的数据资产化平台（FastAPI + DataHub）**

```python
# data_asset_platform.py
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Optional
from datetime import datetime

app = FastAPI(title="数据资产化平台")

# 数据资产数据库
engine = create_engine("postgresql://user:pass@db:5432/data_assets")
Session = sessionmaker(bind=engine)


@app.get("/api/v1/assets")
def list_assets(tier: Optional[str] = None, owner: Optional[str] = None):
    """列出数据资产"""
    session = Session()
    assets = session.execute(
        "SELECT * FROM data_assets WHERE 1=1 AND tier = :tier OR owner = :owner",
        {"tier": tier, "owner": owner}
    ).fetchall()
    session.close()
    return assets


@app.get("/api/v1/assets/{asset_id}/valuation")
def get_valuation(asset_id: str):
    """获取数据资产估值"""
    asset = get_asset(asset_id)
    return {
        "asset_id": asset_id,
        "cost_method": cost_method(asset),
        "income_method": income_method(asset),
        "market_method": market_method(asset),
        "weighted": (
            0.4 * cost_method(asset) +
            0.4 * income_method(asset) +
            0.2 * market_method(asset)
        ),
    }


@app.post("/api/v1/assets/{asset_id}/subscribe")
def subscribe_asset(asset_id: str, team: str, volume: int, background_tasks: BackgroundTasks):
    """订阅数据产品"""
    asset = get_asset(asset_id)
    cost = asset["price_per_call"] * volume
    
    # 创建合约
    contract = create_contract(asset_id, team, volume, cost)
    
    # 异步通知数据团队
    background_tasks.add_task(notify_data_team, contract)
    
    return contract


@app.get("/api/v1/roi/{asset_id}")
def calculate_roi(asset_id: str):
    """计算数据资产 ROI"""
    asset = get_asset(asset_id)
    cost = cost_method(asset)
    revenue = asset.get("annual_revenue", 0)
    
    roi = (revenue - cost) / cost if cost > 0 else 0
    
    return {
        "asset_id": asset_id,
        "cost": cost,
        "revenue": revenue,
        "roi": roi,
        "payback_months": (cost / revenue * 12) if revenue > 0 else None,
    }
```

**示例 2：AI 驱动的数据资产自动盘点**

```python
# ai_asset_discovery.py
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def auto_classify_asset(table_name, sample_data, schema_info):
    """用 LLM 自动分类数据资产"""
    
    prompt = f"""
你是一个数据资产管理专家。请基于以下信息评估这个数据资产。

## 表名
{table_name}

## Schema
{schema_info}

## 样例数据（前 10 行）
{sample_data}

## 你的任务
1. 推断这张表的业务用途
2. 评估业务价值等级（L1 战略 / L2 重要 / L3 一般 / L4 备份）
3. 评估数据敏感度（公开 / 内部 / 机密 / 绝密）
4. 列出潜在使用方（业务团队）
5. 给出建议的治理优先级

## 输出 JSON
```json
{{
  "purpose": "...",
  "tier": "L1/L2/L3/L4",
  "classification": "公开/内部/机密/绝密",
  "potential_consumers": ["...", "..."],
  "governance_priority": "P0/P1/P2/P3",
  "reasoning": "..."
}}
```
"""
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.content[0].text
```

---
