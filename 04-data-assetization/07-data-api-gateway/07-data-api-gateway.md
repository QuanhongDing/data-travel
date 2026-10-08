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
- **Ambassador / Envoy**（2017）——云原生 Service Mesh。
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
```

- **Closed**：正常，请求直达后端。
- **Open**：熔断，请求直接失败。
- **Half-Open**：试探，放部分请求看后端是否恢复。

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

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：集中式网关**

单一网关处理所有流量。

- **优点**：简单、统一管理。
- **缺点**：单点风险、性能瓶颈。
- **适用**：中小规模数据中台。

**模式 2：分层网关**

多层网关（边缘 + 内部 + 数据）。

- **边缘网关**：对外暴露，WAF + 限流。
- **内部网关**：服务间路由。
- **数据网关**：数据后端专用（鉴权 + 计量）。
- **优点**：职责分离、可扩展。
- **缺点**：架构复杂。
- **适用**：大规模数据中台。

**模式 3：Sidecar 模式**

每个服务部署 Sidecar（Envoy）做治理。

- **优点**：解耦、语言无关。
- **缺点**：资源消耗、运维复杂。
- **适用**：Service Mesh（Istio / Linkerd）。

**模式 4：边缘计算 + 网关**

网关前置 CDN / Edge Function。

- **优点**：降低延迟、减少回源。
- **缺点**：边缘节点治理难。
- **适用**：全球分布式数据 API。

**模式 5：API 网关 + AI Gateway 融合**

网关同时支持传统 API 和 AI Agent。

- **优点**：统一治理、统一计量。
- **缺点**：协议复杂。
- **适用**：AI 原生数据中台。

**模式 6：GraphQL Gateway**

GraphQL 单 endpoint。

- **优点**：按需字段、避免过度查询。
- **缺点**：N+1、缓存复杂。
- **适用**：复杂前端 BI。

### 3.2 适用场景决策表

| 场景特征 | 推荐模式 | 理由 |
| --- | --- | --- |
| 中小数据中台 | 集中式网关 | 简单高效 |
| 大规模 / 多业务线 | 分层网关 | 职责分离 |
| 云原生 / 微服务 | Sidecar + Service Mesh | 解耦 |
| 全球分布式 | 边缘 + 集中 | 延迟优化 |
| AI 原生 | API + AI Gateway 融合 | 统一治理 |
| 复杂前端 BI | GraphQL Gateway | 按需字段 |
| 数据合规严格 | 分层 + 数据脱敏 | 安全优先 |

### 3.3 反模式与陷阱

1. **「无网关直接暴露」反模式**：API 直接对外暴露。**必须经过网关**。
2. **「单点网关」反模式**：所有流量过单一网关，无高可用。**必须集群 + 多活**。
3. **「网关做业务逻辑」反模式**：网关承载业务逻辑。**网关只做治理，业务逻辑下沉**。
4. **「无数据权限」反模式**：网关只鉴权不限数据。**必须有行级 / 列级权限**。
5. **「无熔断」反模式**：后端故障拖垮网关。**必须熔断 + 降级 + 超时**。
6. **「无限流」反模式**：无任何限流。**必须有 QPS / 数据量限流**。
7. **「无计量」反模式**：无法计量调用方。**必须有完整计量体系**。
8. **「忽视缓存」反模式**：每次请求直达 DB。**必须有缓存 + 物化**。
9. **「无审计日志」反模式**：无法追溯。**必须有完整审计日志**。
10. **「忽视 AI 安全」反模式**：LLM 调用无审计、无脱敏。**必须有 AI 增强防护**。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：需求分析**

- 评估 API 数量、QPS、数据敏感度。
- 识别合规要求（等保 / GDPR / 行业法规）。
- 输出：**API 网关需求说明书**。

**Step 2：网关选型**

- 自研 vs 开源（Kong / APISIX / Tyk / Envoy）。
- 评估性能、插件生态、运维成本。
- 输出：**选型决策书（ADR）**。

**Step 3：路由与负载均衡**

- 配置路由规则（path / header / method）。
- 配置负载均衡（轮询 / 加权 / 一致性哈希）。
- 配置健康检查。
- 输出：**路由配置**。

**Step 4：鉴权与权限**

- 集成身份系统（OAuth 2.0 / JWT / SSO）。
- 实现行级 / 列级权限（OPA / Casbin）。
- 输出：**权限模型**。

**Step 5：限流与配额**

- 配置限流规则（QPS / 数据量 / 调用方）。
- 配置熔断策略（错误率 / 慢调用）。
- 配置降级策略（默认值 / 缓存）。
- 输出：**限流 / 熔断配置**。

**Step 6：缓存策略**

- 配置结果集缓存（Redis）。
- 配置 CDN（静态响应）。
- 配置物化（高频 API 预计算）。
- 输出：**缓存配置**。

**Step 7：可观测**

- 接入 Prometheus / Grafana。
- 接入 Jaeger / Zipkin（链路追踪）。
- 接入 ELK / Loki（日志）。
- 输出：**监控大盘**。

**Step 8：安全防护**

- 配置 WAF 规则。
- 配置数据脱敏（手机号 / 身份证 / 邮箱）。
- 配置防爬虫 / 防注入。
- 输出：**安全策略**。

**Step 9：上线与灰度**

- 灰度发布（10% → 50% → 100%）。
- A/B 测试不同策略。
- 监控异常并回滚。
- 输出：**生产级 API 网关**。

### 4.2 关键技术点

1. **高性能网关**：APISIX（基于 Nginx + Lua）、Envoy（C++）、Kong（OpenResty）。
2. **限流算法**：令牌桶（Guava / Sentinel）、滑动窗口（Redis Lua）。
3. **鉴权框架**：OAuth 2.0（Keycloak / Auth0）、JWT（jjwt）。
4. **权限引擎**：OPA（Open Policy Agent）、Casbin。
5. **数据脱敏**：动态脱敏（Apache ShardingSphere）。
6. **熔断器**：Resilience4j、Hystrix（已停止维护）、Sentinel。
7. **缓存**：Redis（结果集）、Caffeine（本地）、CDN（静态）。
8. **可观测**：Prometheus + Grafana + Jaeger + ELK。
9. **WAF**：ModSecurity、Cloudflare WAF、阿里云 WAF。
10. **灰度发布**：按 header / 用户 / 流量比例。
11. **API 聚合**：BFF（Backend for Frontend）模式。
12. **AI Gateway**：MCP 网关（2024）、Token 计量、Prompt 注入防护。

### 4.3 工具链与平台

**开源 API 网关**：

- **Kong**（开源 + 商业）——基于 OpenResty，插件生态丰富。
- **Apache APISIX**（国产开源）——云原生、高性能、插件丰富。
- **Tyk**（开源）——Go 语言、轻量。
- **KrakenD**（开源）——高性能 API 聚合。
- **Gravitee**（开源）——API 生命周期管理。
- **Ambassador / Emissary-Ingress**（开源）——Envoy 上层封装。

**云原生网关**：

- **Envoy**（Lyft 开源）——Service Mesh 事实标准。
- **Istio Gateway**（Envoy 上层）——Service Mesh API 网关。
- **Linkerd**（Buoyant 开源）——Service Mesh。
- **Traefik**（开源）——云原生反向代理。
- **HAProxy**（开源）——经典负载均衡。

**API 网关 SaaS**：

- **AWS API Gateway**——托管 API 网关。
- **Azure API Management**——Azure 生态。
- **Google Cloud API Gateway**——GCP 生态。
- **阿里云 API 网关**——国内云。
- **腾讯云 API 网关**——国内云。

**WAF / 安全**：

- **ModSecurity**（开源）——WAF 标准。
- **Cloudflare WAF**（商业）——云 WAF。
- **AWS WAF**（商业）——AWS WAF。

**限流 / 熔断**：

- **Sentinel**（阿里开源）——限流 / 熔断 / 降级。
- **Resilience4j**（开源）——Java 熔断器。
- **Hystrix**（Netflix，已停止维护）——历史经典。
- **Envoy Circuit Breaker**——Envoy 内置。

**可观测**：

- **Prometheus + Grafana**——指标 + 大盘。
- **Jaeger / Zipkin**——链路追踪。
- **ELK / Loki**——日志。

**权限**：

- **OPA（Open Policy Agent）**——策略引擎。
- **Casbin**——权限框架。
- **Keycloak**——身份认证。

**GraphQL Gateway**：

- **Hasura**——PostgreSQL 自动 GraphQL。
- **Apollo Federation**——GraphQL 联邦。
- **GraphQL Mesh**——多源 GraphQL。

### 4.4 代码 / 示例

**示例 1：APISIX 配置**

```yaml
# APISIX Route 配置
routes:
  - uri: /api/v1/metric/*
    upstream:
      type: roundrobin
      nodes:
        - host: oneservice-1
          port: 8000
          weight: 1
        - host: oneservice-2
          port: 8000
          weight: 1
    plugins:
      jwt-auth:
        key: user-key
      limit-count:
        count: 1000
        time_window: 60
        rejected_code: 429
        key: remote_addr
      prometheus:
        prefer_name: true
      cors:
        allow_origins:
          - "https://*.company.com"
        allow_methods:
          - GET
          - POST
```

**示例 2：Kong + JWT 插件**

```bash
# 添加服务
curl -X POST http://kong:8001/services \
  --data name=oneservice \
  --data url=http://oneservice:8000

# 添加路由
curl -X POST http://kong:8001/services/oneservice/routes \
  --data paths[]=/api/v1/metric

# 添加 JWT 插件
curl -X POST http://kong:8001/services/oneservice/plugins \
  --data name=jwt

# 添加限流插件
curl -X POST http://kong:8001/services/oneservice/plugins \
  --data name=rate-limiting \
  --data config.minute=1000 \
  --data config.policy=local
```

**示例 3：FastAPI 中间件（限流 + 鉴权 + 计量）**

```python
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import jwt
import time
import redis

app = FastAPI()
redis_client = redis.Redis(host='redis', port=6379)

# 限流中间件
@app.middleware("http")
async def rate_limit(request: Request, call_next):
    api_key = request.headers.get("X-API-Key", "anonymous")
    window = 60  # 60 秒
    limit = 1000  # 1000 次
    
    key = f"ratelimit:{api_key}:{int(time.time() // window)}"
    count = redis_client.incr(key)
    redis_client.expire(key, window)
    
    if count > limit:
        raise HTTPException(429, "Too Many Requests")
    
    response = await call_next(request)
    return response

# 鉴权中间件
@app.middleware("http")
async def auth(request: Request, call_next):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    try:
        user = jwt.decode(token, "secret", algorithms=["HS256"])
        request.state.user = user
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Unauthorized")
    
    return await call_next(request)

# 计量中间件
@app.middleware("http")
async def metering(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    
    redis_client.hincrby("metering:requests", request.state.user["sub"], 1)
    redis_client.hincrbyfloat("metering:duration", request.state.user["sub"], duration)
    
    return response
```

**示例 4：Sentinel 限流（Java）**

```java
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.alibaba.csp.sentinel.slots.block.RuleConstant;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRule;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRuleManager;

@SpringBootApplication
public class DataGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(DataGatewayApplication.class, args);
        initFlowRules();
    }

    private static void initFlowRules() {
        List<FlowRule> rules = new ArrayList<>();
        FlowRule rule = new FlowRule("/api/v1/metric/gmv");
        rule.setGrade(RuleConstant.FLOW_GRADE_QPS);
        rule.setCount(1000); // 1000 QPS
        rules.add(rule);
        FlowRuleManager.loadRules(rules);
    }
}

@RestController
public class MetricController {
    @SentinelResource(value = "getMetric", blockHandler = "handleBlock")
    @GetMapping("/api/v1/metric/{name}")
    public Metric getMetric(@PathVariable String name) {
        return metricService.get(name);
    }

    public Metric handleBlock(String name, BlockException ex) {
        return Metric.empty(); // 降级返回空
    }
}
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：AI Gateway / MCP Gateway**

让 Agent 通过统一协议访问数据：

- **MCP（Model Context Protocol）**（2024，Anthropic）——让 Agent 通过标准化协议访问数据源。
- **AI Gateway**（2024）——专门治理 Agent 调用（鉴权 / 计量 / Prompt 注入防护）。
- **OpenAI Function Calling Gateway**——把 API 注册为 Tool，统一治理。

**方向 2：Token 计量**

按 LLM Token 计量数据 API：

- 按 prompt token + completion token 计费。
- 按 embedding 调用次数计量。
- 按 RAG 检索次数计量。

**方向 3：Prompt 注入防护**

网关层防护 Prompt Injection：

- 检测 prompt 中的恶意指令。
- 过滤敏感数据返回。
- 审计所有 LLM 调用。

**方向 4：AI 增强路由**

LLM 智能路由：

- 根据 query 复杂度路由到不同模型（Haiku / Sonnet / Opus）。
- 根据 query 意图路由到不同 API（向量 / SQL / KG）。
- 根据成本预算动态降级。

**方向 5：边缘 AI Gateway**

在边缘节点运行小模型，做 query 预处理：

- 边缘节点做 query 重写。
- 减少回源流量。
- 提升首 token 延迟。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

- **API Gateway + RAG**：所有 RAG 调用经网关，统一计量。
- **API Gateway + 向量库**：向量检索 API 经网关，鉴权 + 计量。
- **API Gateway + GraphRAG**：GraphRAG API 经网关，鉴权 + 审计。
- **AI Gateway + Multi-Model**：统一接入 GPT / Claude / 文心 / 通义，按需路由。

### 5.3 学术与工业最新进展（2024-2025）

- **Kong 3.x + AI Plugin**（2024）——Kong 推出 AI 网关插件。
- **Apache APISIX + AI**（2024）——APISIX 支持 AI 路由。
- **Portkey AI Gateway**（2024）——AI 专用网关。
- **Cloudflare AI Gateway**（2024）——边缘 AI 网关。
- **MCP（Model Context Protocol）**（2024）——Anthropic 开源的 Agent 数据协议。
- **Envoy AI Gateway**（2024）——Envoy 推出 AI 网关扩展。

### 5.4 未来 3-5 年趋势

1. **「AI Gateway 成为标配」**：每个企业级 AI 平台都有 AI Gateway。
2. **「MCP 成为数据消费协议标准」**：类似 LSP 之于编辑器。
3. **「Token 计量 + 成本优化」**：按 Token 计量成为 AI 时代计费标准。
4. **「边缘 AI Gateway」**：在边缘节点预处理 query。
5. **「AI 安全防护」**：Prompt 注入防护、数据脱敏、审计成为网关标配。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：某互联网公司数据 API 网关**

- 背景：200+ 数据 API 散落，无统一治理，每月数据泄漏事件 5+ 起。
- 方案：部署 APISIX，统一网关 + 行级权限 + 计量。
- 工具：APISIX + OPA + Redis + Prometheus。
- 结果：数据泄漏事件归零，QPS 提升 3 倍，计量覆盖率 100%。

**案例 2：某金融公司 MCP 网关**

- 背景：Agent 需要访问 100+ 业务系统 API，散落且无统一治理。
- 方案：搭建 MCP 网关，统一 Agent 数据消费。
- 工具：自研 MCP Gateway + Anthropic Claude + Keycloak。
- 结果：Agent 数据访问成功率从 60% 提升到 95%，开发效率提升 5 倍。

**案例 3：某电商公司大促网关**

- 背景：大促期间数据 API 流量峰值 100 万 QPS，需要弹性。
- 方案：分层网关 + 自动扩缩容 + 熔断降级。
- 工具：APISIX + Kubernetes HPA + Sentinel。
- 结果：大促期间 0 故障，资源利用率提升 40%。

**案例 4：某 AI 公司 AI Gateway**

- 背景：LLM 调用 GPT / Claude / 文心，无统一成本管理。
- 方案：搭建 AI Gateway，统一接入 + Token 计量 + 成本优化。
- 工具：Portkey + Kong + Redis。
- 结果：AI 调用成本降低 30%，Token 计量覆盖率 100%。

### 6.2 踩坑与经验

**坑 1：单点网关**

- 现象：单网关故障导致全平台不可用。
- 解法：集群部署 + 多活 + 健康检查。

**坑 2：网关做业务逻辑**

- 现象：网关承载业务逻辑，性能差且难维护。
- 解法：网关只做治理，业务下沉到服务层。

**坑 3：无数据权限**

- 现象：API 只有用户鉴权，无数据权限。
- 解法：OPA / Casbin 实现行级 / 列级权限。

**坑 4：无限流**

- 现象：一次慢查询拖垮整个网关。
- 解法：多维度限流（QPS + 数据量 + 行数）。

**坑 5：无熔断**

- 现象：后端故障导致请求堆积，网关崩溃。
- 解法：Sentinel / Resilience4j 熔断 + 降级。

**坑 6：缓存策略错误**

- 现象：缓存导致数据不一致。
- 解法：按业务时效分级缓存 + 主动失效。

**坑 7：无审计日志**

- 现象：数据泄漏无法追溯。
- 解法：完整审计日志（谁 / 何时 / 什么 / 结果）。

**坑 8：忽视 AI 安全**

- 现象：LLM 直接访问原始数据，无防护。
- 解法：AI Gateway + Prompt 注入防护 + 数据脱敏。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1（单网关，1-2 周）**：

1. 选 1 个开源网关（APISIX / Kong）。
2. 接入核心 API（10+）。
3. 配置基础限流 + 鉴权。
4. 接入监控。

**1→10（部门级，1-3 个月）**：

1. 全量 API 接入网关。
2. 行级 / 列级权限。
3. 熔断 / 降级 / 缓存。
4. WAF 防护。
5. 审计日志。

**10→100（企业级，6-12 个月）**：

1. 分层网关（边缘 + 内部 + 数据）。
2. AI Gateway 集成（Function Calling / MCP）。
3. 全球边缘节点。
4. 自动扩缩容。
5. AI 增强安全（Prompt 注入防护）。

### 6.4 ROI 评估

- **数据安全**：数据泄漏事件降低 80%+。
- **稳定性**：API 故障率降低 50%+。
- **可观测**：问题定位时间降低 70%。
- **计量**：对外服务化收入增长 30%+。
- **AI 集成**：Agent 数据消费成功率提升 50%+。

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 维度 | 反向代理（Nginx） | ESB（SOA） | Kong / APISIX | Envoy / Istio | AI Gateway |
| --- | --- | --- | --- | --- | --- |
| 性能 | **5** | 2 | 4 | **5** | 4 |
| 限流 | 2 | 3 | **5** | 4 | 4 |
| 鉴权 | 2 | 4 | **5** | 4 | **5** |
| 数据权限 | 1 | 2 | 4 | 3 | **5** |
| AI 集成 | 1 | 1 | 3 | 3 | **5** |
| 可观测 | 3 | 4 | **5** | **5** | 4 |
| 熔断 | 2 | 3 | 4 | **5** | 4 |
| WAF | 3 | 2 | 4 | 4 | 4 |
| 部署复杂度 | 5 | 1 | 4 | 2 | 4 |
| 适用规模 | 小 | 中 | 中 | 大 | 大 |

### 7.2 决策树

```
[你需要统一 API 入口吗？]
   │
   ├── 否 → 直接让服务对外
   │
   ├── 是 → [流量规模？]
   │          │
   │          ├── 小 → Nginx 反向代理
   │          │
   │          ├── 中 → Kong / APISIX
   │          │
   │          └── 大 → Envoy / Istio / 自研
   │
   └── [Agent / LLM 调用？]
          │
          ├── 是 → AI Gateway（Kong + AI Plugin / Portkey / MCP）
          │
          └── 否 → 传统 API Gateway
```

### 7.3 组合使用

- **网关 + OneService**：OneService 提供 API，网关做治理。
- **网关 + 数据目录**：网关执行运行时治理，目录做元数据治理。
- **网关 + Service Mesh**：网关做南北向，Service Mesh 做东西向。
- **网关 + AI Gateway**：传统 API + Agent API 统一治理。
- **网关 + WAF + CDN**：多层防护（边缘 + 网关 + WAF）。

---

## 8. 面试真题集

> **一句话定位**：限流、降级、计费、监控。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 1 个原 PDF 子章节、共 5 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §8.4 | 统⼀数据服务实现 | 8.4.1, 8.4.2, 8.4.3, 8.4.4, 8.4.5 | 5 | 主 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §8 构建统⼀数据服务的Lambda架构实践 > 本主题涵盖 1 个子节、5 道题。

#### 2.1.4 统⼀数据服务实现

> 来源：原 PDF §8.4，收录 5 道题。

| 题号 | 难度 |
| --- | :---: |
| §8.4.1 | ★★★☆☆ |
| §8.4.2 | ★★★☆☆ |
| §8.4.3 | ★★★☆☆ |
| §8.4.4 | ★★★☆☆ |
| §8.4.5 | ★★★★☆ |

- **§8.4.1**：在⼤规模Lambda架构实践中，统⼀数据服务可能⾯临⾼并发查询、数据新鲜度与
- **§8.4.2**：在设计统⼀数据服务的API时，你会考虑哪些关键的设计原则来确保接⼝的⾼可⽤
- **§8.4.3**：请解释在Lambda架构中，统⼀数据服务的主要作⽤是什么，以及它如何为上层应
- **§8.4.4**：请描述在Lambda架构下，批处理层和速度层的数据如何通过统⼀数据服务进⾏融
- **§8.4.5**：假设你负责的统⼀数据服务需要⽀持多租户和细粒度的数据权限控制，请阐述你的

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **本节主题**

## 4 本章小结

> 本面试真题集收录 5 道题，覆盖 1 个原 PDF 主题、1 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [04-data-assetization 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
