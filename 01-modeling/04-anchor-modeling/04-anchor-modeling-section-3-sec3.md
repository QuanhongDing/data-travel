> 本文件是 **04-anchor-modeling.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](04-anchor-modeling.md)。

## 3. 设计模式与范式

### 3.1 主要模式

Anchor Modeling 的设计模式可以分为以下 5 类：

#### 3.1.1 标准四件套模式（Standard Anchor-Attrtribute-Tie-Knot）

**场景**：90% 的常规业务建模。

**结构**：

```
Anchor: customer (id)
Attrtribute: customer_name (customer_id, name, ...)
Attrtribute: customer_birthday (customer_id, birthday, ...)
Attrtribute: customer_phone (customer_id, phone, phone_type_knot_id, ...)
Tie: customer_order (customer_id, order_id, ...)
Anchor: order (id)
Attrtribute: order_amount (order_id, amount, currency_knot_id, ...)
Attrtribute: order_status (order_id, status_knot_id, ...)
Knot: phone_type (id, code, name)
Knot: currency (id, code, name)
Knot: order_status (id, code, name)
```

**优点**：极致规范化 + 极致可演化 + 原生时态。
**缺点**：表数量爆炸（一个客户实体可能有 50+ Attribute 表）。

#### 3.1.2 多值属性模式（Multi-Valued Attrtribute via Knot）

**场景**：同一实体有多个值（如客户有多手机号、多邮箱）。

**结构**：

```
Anchor: customer
Tie: customer_phone_relation (customer_id, phone_id, ...)
Anchor: phone (id)  -- 把"多手机号"独立成 Anchor
Attrtribute: phone_number (phone_id, number, ...)
Attrtribute: phone_type (phone_id, type_knot_id, ...)
```

**优点**：支持任意多值关系。
**缺点**：表数量进一步增加，需要多 Tie JOIN。

#### 3.1.3 时态分组模式（Temporal Grouping）

**场景**：一组属性经常一起变化（如客户的"地址"包含省、市、区、邮编）。

**结构**：

```
Anchor: customer
Anchor: address (id)  -- 把"地址"独立成 Anchor
Tie: customer_address (customer_id, address_id, valid_from, valid_to, ...)
Attrtribute: address_province (address_id, province_knot_id, ...)
Attrtribute: address_city (address_id, city_knot_id, ...)
Attrtribute: address_detail (address_id, detail, ...)
```

**优点**：地址变更只需要改 Tie 的 valid_to，新增一条 Tie 即可。
**缺点**：依然表数量多。

#### 3.1.4 Knot 共享模式（Knot Sharing）

**场景**：多个实体共享查找表（如国家码、币种、状态码）。

**结构**：

```
Anchor: customer
Attrtribute: customer_country (customer_id, country_knot_id, ...)
Anchor: order
Attrtribute: order_country (order_id, country_knot_id, ...)
Knot: country (id, code, name)  -- 共享
```

**优点**：一处修改，处处生效。
**缺点**：Knot 不能过度共享（避免循环依赖）。

#### 3.1.5 时间锚点模式（Time Anchor）

**场景**：业务事件有明显的时间锚点（如交易日、营业日）。

**结构**：

```
Anchor: trading_day (id)  -- 时间锚点
Anchor: stock
Attrtribute: stock_price (stock_id, trading_day_id, price, ...)
Knot: trading_day_calendar (id, date, is_trading_day, ...)
```

**优点**：时间维度规范化建模。
**缺点**：与维度建模的"日期维度表"思路类似，但更极致。

### 3.2 适用场景决策表

| 业务特征 | 推荐模式 | 理由 |
|---|---|---|
| 字段稳定 + 时态要求弱 | 维度建模（Kimball） | Anchor 收益小，复杂度大 |
| 字段稳定 + 时态要求强 | Data Vault 2.0 | 平衡复杂度与时态能力 |
| 字段高频变化 + 时态要求强 | Anchor Modeling 标准四件套 | Anchor 主战场 |
| 同一实体多值（如多手机号） | 多值属性模式 + Knot | Anchor 原生支持 |
| 一组属性频繁一起变化 | 时态分组模式 | 减少 Tie 的变更 |
| 多实体共享查找 | Knot 共享模式 | Knot 原生 |
| 时间维度重要 | 时间锚点模式 | Anchor 原生支持 |
| 字段类型会演化 | 类型演化模式 | Anchor 原生支持 |
| 需要 LLM 自动感知字段 | Anchor + 元数据自动发现 | Anchor 结构清晰 |
| 监管要求 bitemporal | Anchor Modeling | 原生支持 |

### 3.3 反模式与陷阱

#### 3.3.1 反模式 1：过度拆分到无法维护

**表现**：把所有属性都拆成独立 Attribute 表，包括 "客户是否启用" 这种简单布尔字段。

**后果**：表数量爆炸（1000+ 张），元数据管理负担极大，团队认知成本极高。

**怎么避**：

1. **简单布尔 / 枚举字段可以合并到一个 Attribute 表**（如 `customer_simple_flags` 包含 enabled/is_vip/is_blacklisted 等）
2. **经常一起查询的属性可以合并到一张 Satellite**（如果用 Data Vault 风格）
3. **过度规范化不如适度规范化**：Anchor Modeling 不是"每字段必表"，而是"高变化字段必独立表"。

#### 3.3.2 反模式 2：Knot 过度共享

**表现**：把所有查找表都做成 Knot，连"性别"都做成 Knot（knot_gender）。

**后果**：增加查询 JOIN 次数，Knot 表维护成本上升。

**怎么避**：

1. **只对"多 Anchor / Tie 共享"的查找做 Knot**（如国家、币种、状态码）
2. **单 Anchor 独占的枚举可以直接用 Attribute 表内的字符串**

#### 3.3.3 反模式 3：忽略反规范化视图

**表现**：底表全部 Anchor 风格，但下游消费直接 JOIN 100 张表。

**后果**：下游查询性能崩溃，开发团队怨声载道。

**怎么避**：

1. **必须配套建设反规范化视图层**：用视图 / 物化视图把多 Attribute 拼成"客户全貌"
2. **下游消费只读视图，不读底表**
3. **视图层可以引入 PIT 思想**：预聚合"当前有效"切片

#### 3.3.4 反模式 4：忽略 bitemporal 的复杂度

**表现**：直接用 `(valid_from, valid_to)` 二元组，没有 `(loaded_at)` 三元组。

**后果**：无法处理"晚到真相"——源系统在 2020-01-15 才推送 2020-01-01 的变更，覆盖了 2020-01-10 已经看到的数据。

**怎么避**：

1. **必须使用三时态**：`valid_from`、`valid_to`、`loaded_at`
2. **下游查询必须明确"业务时态 + 加载时态"两个维度**
3. **不要轻易删除"加载时态"晚于当前业务时态的数据**——这可能是合规需要的历史证据

#### 3.3.5 反模式 5：把 Anchor Modeling 当成"银弹"

**表现**：不分场景一律 Anchor Modeling，认为"6NF 永远优于 3NF"。

**后果**：团队学习成本高、查询性能差、过度工程化。

**怎么避**：

1. **Anchor Modeling 适合"高变化 + 强时态"的核心域**（如客户主数据、保单、合同）
2. **其他域用 Data Vault 或维度建模**
3. **不要全仓 Anchor Modeling**：核心域 Anchor + 其他域 Data Vault / 维度建模是常见组合

---
