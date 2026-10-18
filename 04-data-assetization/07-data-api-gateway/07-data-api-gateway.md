# 数据 API 网关（Data API Gateway）

> **一句话定位**：所有数据 API 的统一入口——限流、鉴权、计量、缓存、监控、安全，是数据服务化与 AI 消费的「咽喉要塞」。

> 本文是 data-travel 项目 [Ch4 · 数据资产化与智能检索](../../README.md) 的子章节（07 数据 API 网关）。覆盖 **核心职责② 企业私有数据资产化与智能检索** 中「**数据 API 的流量治理与工程稳定性**」相关的设计模式与工程实践。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 数据 API 网关和通用 API 网关有什么区别？ | §1 |
| 网关的核心能力（限流 / 鉴权 / 缓存 / 监控）？ | §2、§3 |
| Kong / APISIX / Tyk / Envoy 怎么选？ | §4 |
| 网关在 AI 时代如何与 LLM / Agent 协同？ | §5 |
| 大流量下的网关稳定性与踩坑？ | §6 |

---

## 1. 概念与定位

### 1.1 是什么

**学术 / 工业定义**：数据 API 网关（Data API Gateway）是位于数据 API 服务与调用方之间的**统一流量治理层**，对所有数据 API 提供限流、鉴权、计量、缓存、监控、安全防护、可观测等能力。它是数据中台对外暴露 API 的「**唯一入口**」，避免 API 直接对外暴露。

**工程定义**：在数据架构师手里，数据 API 网关是**一份数据流量的治理系统**：

- **流量入口**：所有 API 调用经过网关。
- **策略执行**：限流、鉴权、缓存、熔断、降级。
- **可观测**：QPS、延迟、错误率、调用链。
- **安全防护**：WAF、防爬、防注入、防泄漏。
- **计量计费**：按调用方、API、配额计量。

**数据 API 网关 vs 通用 API 网关**：

| 维度 | 通用 API 网关 | 数据 API 网关 |
| --- | --- | --- |
| 核心场景 | 微服务调用 | 数据查询 / 指标 / 标签 |
| 流量特征 | 短连接、低延迟、高并发 | 长查询、大结果集、缓存敏感 |
| 鉴权重点 | 用户 / 服务身份 | 用户身份 + 数据权限（行级 / 列级） |
| 限流策略 | QPS / 并发 | QPS / 并发 + 数据量 / 行数 |
| 缓存重点 | 响应缓存 | 结果集缓存 + 物化视图 |
| 监控重点 | 错误率 / 延迟 | 错误率 / 延迟 / 数据新鲜度 |
| 安全重点 | 鉴权 / WAF | 数据脱敏 / 数据权限 / 防泄漏 |
| 典型工具 | Kong、APISIX、Envoy | Kong、APISIX、自研 |

### 1.2 为什么需要

**业务驱动力**：

- **数据安全**：数据 API 直接对外暴露 = 数据泄漏。必须有网关隔离。
- **流量治理**：数据查询昂贵（百亿行扫描），必须限流。
- **可观测**：谁访问了什么、花了多少资源，必须可追溯。
- **可计量**：对外提供数据服务必须按调用方 / API 计量。
- **稳定性**：单个 API 故障不能拖垮所有 API，需要熔断 / 降级。
- **AI 时代新需求**：Agent 调用数据 API，必须有统一的鉴权 / 计量 / 审计。

**痛点**：

1. **「散落 API」**：100+ 数据 API 散落在不同服务，无统一管理。
2. **「数据泄漏」**：API 无任何鉴权，敏感数据被爬取。
3. **「资源耗尽」**：一次慢查询拖垮整个集群。
4. **「无法计量」**：不知道谁调了多少、应该收多少钱。
5. **「无故障隔离」**：单个 API 故障影响全局。
6. **「AI 调用失控」**：Agent 高频调用数据 API，资源耗尽。

**AI 时代的新诉求**：

- **Agent Token 计费**：Agent 调用数据 API 需要精细计量。
- **MCP（Model Context Protocol）网关**：让 Agent 通过统一网关访问数据。
- **「数据安全 + AI」**：LLM 不能直接访问原始数据，必须经过网关过滤。
- **「AI 增强路由」**：LLM 根据 query 复杂度智能路由到不同 API。

### 1.3 在 AI 时代数据架构中的位置

```
   [调用方：BI / 报表 / 应用 / Agent]
                ↓
   [数据 API 网关] ← 本文（限流 / 鉴权 / 缓存 / 监控）
                ↓
   [OneService API / RAG API / 向量 API / 联邦查询]
                ↓
   [数据后端：数仓 / 湖仓 / 向量库 / 图库]
```

- **上游**：OneService（Ch4-06）、指标平台（Ch4-10）、统一查询网关（Ch4-09）、RAG 架构（Ch4-05）。
- **下游**：BI 工具、数据应用、AI Agent、LLM Function Calling。
- **横向**：与数据目录（Ch4-08）、可观测（Ch11-横切工程）、安全（Ch8-AI 治理）协同。

**一句话判断**：**「没有 API 网关就没有数据中台，没有数据 API 网关就没有 AI 数据消费」——网关是数据中台的咽喉要塞，也是 AI 数据消费的安全阀门。**

### 1.4 演进历程

**传统 API 网关阶段（2000-2015）**：

- 企业 ESB（Enterprise Service Bus）—— SOA 时代的服务总线。
- 反向代理（Nginx / HAProxy）—— 简单流量转发。
- API 管理平台（Apigee / 3scale）—— 鉴权 + 限流 + 计量。

**云原生 API 网关阶段（2015-2020）**：

- **Kong**（2015，Mashape 开源）——基于 OpenResty，插件丰富。
- **Tyk**（2015）——Go 语言实现。
- **Ambassador**（2017）/ **Envoy**（2016，Lyft 开源）——云原生 Service Mesh。
- **Apache APISIX**（2019，国产开源）——云原生 API 网关。
- **Traefik**（2015）——云原生反向代理。

**数据 API 网关阶段（2018-2024）**：

- 数据中台兴起，统一 API 网关成为数据中台标配。
- 阿里 DataWorks、字节 DataFinder、腾讯 WeData 等内嵌网关能力。
- 强调「**数据权限 + 数据计量 + 数据安全**」。

**AI 原生网关阶段（2024-2025）**：

- LLM / Agent 调用数据 API 成为新场景。
- **MCP 网关**（2024）——Model Context Protocol，让 Agent 通过统一协议访问数据。
- **AI 增强路由**（2024-2025）——LLM 智能路由 query 到不同 API。
- **Token 计量**（2024）——按 LLM Token 计量数据 API 调用。

---

## 2. 核心原理

### 2.1 关键概念定义

- **API 网关（API Gateway）**：所有 API 调用的统一入口。
- **路由（Routing）**：根据 path / header / method 把请求路由到不同后端。
- **限流（Rate Limiting）**：限制 QPS / 并发 / 数据量。
- **鉴权（Authentication）**：验证调用方身份（API Key、JWT、OAuth）。
- **授权（Authorization）**：验证调用方权限（RBAC、ABAC、行级权限）。
- **缓存（Caching）**：结果集缓存、ETag、304 响应。
- **熔断（Circuit Breaking）**：后端故障时快速失败，避免雪崩。
- **降级（Degradation）**：后端故障时返回默认值 / 兜底数据。
- **重试（Retry）**：失败重试，注意幂等性。
- **超时（Timeout）**：防止慢查询拖垮网关。
- **WAF（Web Application Firewall）**：防 SQL 注入、XSS、爬虫。
- **可观测（Observability）**：日志、指标、链路追踪。
- **计量（Metering）**：按调用方 / API / 数据量计量。
- **计费（Billing）**：按计量结果计费（对外服务）。
- **配额（Quota）**：调用方总额度控制。
- **API Key**：调用方身份凭证。
- **JWT（JSON Web Token）**：无状态身份令牌。
- **OAuth 2.0**：授权框架。
- **OpenAPI / Swagger**：API 描述规范。
- **GraphQL Gateway**：GraphQL 专用网关（Hasura / Apollo）。
- **MCP Gateway**：Model Context Protocol 网关（2024）。

### 2.2 数学 / 形式化基础

**限流算法**：

1. **令牌桶（Token Bucket）**：以固定速率生成令牌，请求消耗令牌。
   ```
   tokens += rate × dt
   if tokens > capacity: tokens = capacity
   if tokens >= 1: tokens -= 1; allow_request()
   else: reject_request()
   ```

2. **滑动窗口（Sliding Window）**：在滑动窗口内统计请求数。
   ```
   count = sum([1 for req in window if req.time > now - window_size])
   if count < limit: allow_request()
   else: reject_request()
   ```

3. **漏桶（Leaky Bucket）**：请求进入桶，以固定速率流出。
   ```
   if queue_size < capacity: enqueue()
   else: reject_request()
   dequeue() at constant rate
   ```

4. **固定窗口（Fixed Window）**：在固定时间窗口内统计请求数（最简单，边界问题）。

**熔断器（Circuit Breaker）状态机**：

```
[Closed] → 错误率超阈值 → [Open] → 超时 → [Half-Open]
   ↑                                    ↓
   └────────── 成功 ←───────────────────┘
                                          └── 探测失败 ──> [Open]
```

- **Closed**：正常，请求直达后端。
- **Open**：熔断，请求直接失败。
- **Half-Open**：试探，放部分请求看后端是否恢复；恢复则回 Closed，未恢复则退回 Open。

**缓存策略**：

1. **Cache-Aside**：应用先查缓存，miss 则查 DB 并回填。
2. **Write-Through**：写 DB 同时写缓存。
3. **Write-Behind**：异步写 DB。
4. **Read-Through**：网关封装，miss 自动查 DB。

**鉴权模型**：

- **RBAC（Role-Based Access Control）**：用户 → 角色 → 权限。
- **ABAC（Attribute-Based Access Control）**：基于属性（用户、资源、环境）。
- **行级权限**：WHERE 条件按用户过滤（如 `WHERE tenant_id = current_user.tenant_id`）。
- **列级权限**：敏感字段脱敏（如手机号 `138****1234`）。

### 2.3 关键算法 / 方法

**网关核心能力**：

1. **路由策略**：基于 path / header / method / 权重 / 灰度。
2. **限流算法**：令牌桶 / 滑动窗口 / 漏桶 / 固定窗口。
3. **鉴权协议**：API Key / JWT / OAuth 2.0 / mTLS。
4. **权限模型**：RBAC / ABAC / 行级 / 列级。
5. **缓存策略**：Cache-Aside / Write-Through / Read-Through。
6. **熔断算法**：错误率 / 慢调用率 / 异常数。
7. **降级策略**：返回默认值 / 缓存数据 / 简化响应。
8. **可观测**：Prometheus / Jaeger / ELK。
9. **WAF 规则**：SQL 注入 / XSS / CSRF / Bot 检测。
10. **计量模型**：按调用方 / API / 数据量 / Token。

**网关高级能力**：

1. **灰度发布**：按 header / 用户分流。
2. **API 聚合**：多 API 合并成一个响应。
3. **请求转换**：header / body 转换。
4. **响应压缩**：gzip / br。
5. **协议转换**：HTTP → gRPC / WebSocket。
6. **GraphQL Gateway**：GraphQL 联邦。
7. **MCP Gateway**：Agent 数据源协议。

### 2.4 与相邻概念的关系

- **数据 API 网关 vs 通用 API 网关**：数据网关强调「数据权限 + 数据计量 + 数据安全」，通用网关强调「微服务路由」。
- **数据 API 网关 vs OneService**：OneService 提供「数据语义 API」，网关提供「流量治理」。两者协同。
- **数据 API 网关 vs 数据目录**：网关执行「运行时治理」，目录做「元数据治理」。
- **数据 API 网关 vs Sidecar / Service Mesh**：Sidecar（Envoy）做服务间调用治理，网关做南北向流量治理。
- **数据 API 网关 vs CDN / WAF**：CDN 缓存静态资源，WAF 防护 Web 攻击，网关统一治理。

---

- [§3. 设计模式与范式](07-data-api-gateway-section-3-sec3.md)
- [§4. 工程实现](07-data-api-gateway-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](07-data-api-gateway-section-5-ai.md)
- [§6. 落地实践](07-data-api-gateway-section-6-sec6.md)
- [§7. 与其他方法对比](07-data-api-gateway-section-7-sec7.md)
- [§8. 面试真题集](07-data-api-gateway-section-8-sec8.md)

---

## 章节内容导航

本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：

- [§3. 设计模式与范式](07-data-api-gateway-section-3-sec3.md)
- [§4. 工程实现](07-data-api-gateway-section-4-sec4.md)
- [§5. 前沿演进（AI 时代）](07-data-api-gateway-section-5-ai.md)
- [§6. 落地实践](07-data-api-gateway-section-6-sec6.md)
- [§7. 与其他方法对比](07-data-api-gateway-section-7-sec7.md)
- [§8. 面试真题集](07-data-api-gateway-section-8-sec8.md)

---
