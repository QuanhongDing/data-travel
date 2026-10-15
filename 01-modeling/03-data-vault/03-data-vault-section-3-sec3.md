> 本文件是 **03-data-vault.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](03-data-vault.md)。

## 3. 设计模式与范式

### 3.1 主要模式

Data Vault 的设计模式可以分为以下 5 类：

#### 3.1.1 标准三件套模式（Standard Hub-Link-Satellite）

**场景**：90% 的常规业务建模。

**结构**：

```
hub_customer ─── sat_customer_demo (姓名、性别、生日)
              ─── sat_customer_contact (电话、邮箱)
              ─── sat_customer_address (地址、邮编)

hub_order    ─── sat_order_header (订单金额、状态)
              ─── sat_order_payment (支付方式、支付时间)

hub_customer ── link_customer_order ── hub_order
hub_order    ── link_order_product  ── hub_product
```

**优点**：结构清晰、加载并行、演化友好。
**缺点**：查询需要多表 JOIN，性能依赖 PIT 表。

#### 3.1.2 同义链接模式（Same-As Link for OneID）

**场景**：跨域用户/客户打通。

**结构**：

```
hub_customer_crm    ┐
                     ├── link_customer_same_as ──> hub_customer_unified
hub_customer_erp    ┘

sat_customer_unified_demo
sat_customer_unified_contact
```

**优点**：天然支持 OneID，可增量添加新源。
**缺点**：Same-As Link 可能爆炸（笛卡尔积）。

#### 3.1.3 多活动卫星模式（Multi-Active Satellite, MAS）

**场景**：同一实体有多个业务键（如客户既有手机号又有邮箱又有身份证号）。

**结构**：

```
hub_customer ─── sat_customer_multi_key
                  ├── 手机号 1
                  ├── 手机号 2
                  ├── 身份证号 1
                  └── 邮箱 1
```

**优点**：支持多业务键天然建模。
**缺点**：聚合查询复杂、需要专门的"当前有效"切片逻辑。

#### 3.1.4 生效卫星模式（Effectivity Satellite）

**场景**：软删除、GDPR 合规、历史归档。

**结构**：

```
hub_customer ─── sat_customer_lifecycle
                  ├── 生效时间 (effective_from)
                  ├── 失效时间 (effective_to)
                  ├── 是否当前有效 (is_current)
                  └── 删除原因 (deletion_reason)
```

**优点**：保留完整生命周期，支持任意时态查询。
**缺点**：所有查询都要带"当前有效"过滤。

#### 3.1.5 计算卫星模式（Computed Satellite）

**场景**：业务规则计算结果（如客户分群、风险等级、信用评分）。

**结构**：

```
hub_customer ─── sat_customer_risk_score
                  ├── 模型版本
                  ├── 评分
                  ├── 评分时间
                  └── 评分特征快照（可选）
```

**优点**：可追溯、可重算、可对比。
**缺点**：重算时空间放大。

### 3.2 适用场景决策表

| 业务特征 | 推荐模式 | 理由 |
|---|---|---|
| 源系统 1-2 个 + 业务稳定 | 维度建模（Kimball） | 简单场景，Data Vault 收益小 |
| 源系统 ≥ 3 个 + 跨域整合 | 标准三件套 + Same-As Link | 多源 + 跨域 = Data Vault 主战场 |
| 同一实体多业务键（手机 + 邮箱 + 身份证） | 多活动卫星 MAS | MAS 天然建模 |
| 需要软删除 + GDPR | 生效卫星 Effectivity Saturation | 保留删除痕迹 |
| 业务变化频繁（每周加字段） | 标准三件套 + 持续加 Satellite | 加 Satellite 不改表 |
| 需要可追溯的模型推理结果 | 计算卫星 | 保留模型版本与评分 |
| 强合规审计要求 | 全套 Effectivity Saturation | 时态 + 来源全留痕 |
| 实时流式入仓 | 标准三件套 + 流式 CDC | 天然适配流批一体 |
| 跨域 OneID 主数据 | Same-As Link 链 | 主数据建模的标准做法 |

### 3.3 反模式与陷阱

#### 3.3.1 反模式 1：Hub 里塞属性

**表现**：把"姓名、地址"等属性直接放进 Hub 表。

**后果**：违反 Hub = 业务键 + 元数据 的根本原则；加字段要改 Hub 表 → 失去"加 Satellite 不改表"的优势。

**怎么避**：Hub 里只能有 Hash Key + Business Key + Load Datetime + Record Source + 极少数元数据字段。

#### 3.3.2 反模式 2：Link 里塞属性

**表现**：在 link_customer_order 里加"下单时间"字段。

**后果**：Link 应该只承载"关系"，属性应该放到 Satellite 里。

**怎么避**：Link 里只能有 Hub Hash Keys + Load Datetime + Record Source。

#### 3.3.3 反模式 3：把所有属性塞到一个 Satellite

**表现**：把客户的所有属性（姓名、地址、状态、风险等级、行为画像）全部塞到一个 sat_customer_all。

**后果**：变更粒度过粗（任何字段变化都触发整行复制）；无法支持"高频变更字段 + 低频变更字段"的差异化存储策略。

**怎么避**：按"变更频率 + 业务主题"拆分 Satellite：
- sat_customer_static（静态字段：性别、生日）
- sat_customer_contact（联系方式：电话、邮箱）
- sat_customer_address（地址：省市、邮编）
- sat_customer_behavior（行为画像：最近活跃、偏好）

#### 3.3.4 反模式 4：滥用 Same-As Link 导致笛卡尔积

**表现**：用 Same-As Link 把 5 个源系统的客户连到同一个 hub_customer_unified，结果生成 1000 万行的等价关系表。

**后果**：Same-As Link 爆炸；下游查询性能崩溃。

**怎么避**：Same-As Link 只保留"当前有效"的等价关系；等价判断走"强证据优先"（身份证 > 手机号 > 邮箱 > 设备 ID）。

#### 3.3.5 反模式 5：不区分 Raw Vault 与 Business Vault

**表现**：把 Raw Vault 直接暴露给下游消费，跳过 Business Vault。

**后果**：Raw Vault 的"完全贴源"特性导致下游消费每次都要重新做业务规则；一旦源系统变化，所有下游都会受影响。

**怎么避**：
- Raw Vault：完全贴源、保留全量历史、仅做技术清洗（去重、类型转换）
- Business Vault：业务规则、轻度汇总、主数据治理、跨域对账

---
