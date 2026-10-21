> 本文件是 **02-agent-platform-architecture.md** 的子文件（§4. 工程实现）。本节给的是"从今天的脚本到明天的平台"的可执行路径：八步顺序、每步的产物与判据、可照抄的模板。完整章节请回到 [index](02-agent-platform-architecture.md)。

## 4. 工程实现

### 4.1 落地步骤

**八步，顺序不能颠倒**（前一步的产物是后一步的输入）：

| 步 | 动作 | 产物 | 判据（先写下，再动手） | 为什么必须在这一步 |
| --- | --- | --- | --- | --- |
| 1 | **定平台边界** | 一页纸：平台提供什么、不提供什么（谁负责提示、谁负责工具实现、谁负责数据权限） | 出现争执时，能否用这一页纸判定归属（能/不能） | 边界不清会导致后面每个部件都被要求"顺手也管一下" |
| 2 | **定会话状态模型** | 状态表 DDL + 检查点写入时机 + 恢复语义 | 滚动重启一次执行体，在跑会话是否 100% 可恢复 | 状态是平台的地基，晚做要重写执行体 |
| 3 | **建工具注册表与出口** | 注册表（工具名 / Schema / 可写性 / Owner / 权限范围）+ 唯一出口 | 能否用"出口统计 vs 目标系统日志"对账出旁路 | 出口是权限与审计的唯一落点，晚做等于事后补账 |
| 4 | **接模型接入层** | 平台内唯一模型调用入口（指向 [模型网关](../../06-multi-model/03-model-gateway/03-model-gateway.md)） | 全平台是否还存在直连厂商 SDK 的代码路径（有→未收口） | 多厂商差异与计费必须收在一处 |
| 5 | **装执行引擎与队列** | 调度器 + 优先级队列 + 幂等键表 | 长任务与交互式会话是否分队列；重试是否会被幂等键去重 | 队列决定容量信号，幂等决定重试安全性 |
| 6 | **装配额与计量** | 配额策略 + 预扣/结算流水 + 归因标签 | 超发的最后一刻是否有拦截点；成本能否拆到租户 | 计量要在出口记账，追溯补做等于没有 |
| 7 | **装可观测与回放** | Trace 分段（会话/步/模型调用/工具调用）+ 留痕表 + 回放工具 | 能否用一条 Trace 回答"它当时看到了什么、用了哪个版本" | 留痕要从第一版就带版本四元组 |
| 8 | **装发布 / 灰度 / 回滚** | 版本四元组 + 发布指针 + 灰度规则 + 回滚演练记录 | 回滚是否只需改一个指针；是否演练过 | 发布是平台对外的行为承诺，最后补也要补 |

**顺序的反面**：最常见的错误是**先做编排与提示（看起来最有产出），最后补状态与配额**——结果是执行体已经写成有状态的了，改回无状态的代价远高于一开始就外置（同 [Ch12 §09 灰度与回滚](../../12-architecture/09-gray-and-rollback/09-gray-and-rollback.md) 的"可回滚性必须在设计期就具备"）。

### 4.2 关键技术点

**（1）私有化部署：把"能装进客户机房"拆成六件事**

| 项 | 要点 | 判据（可现场验证） |
| --- | --- | --- |
| 编排与交付 | 一套可离线安装的部署包（Helm / Kustomize / 离线镜像目录），而不是"按文档一步步装" | 断网环境下能否一次装成 |
| 镜像与依赖 | 全量镜像入内网仓库，版本固定（不用 `latest`） | 安装时是否需要访问公网 |
| 模型权重 | 权重的分发路径（内网对象存储 / 物理介质）与校验（哈希） | 权重来源是否可追溯到具体版本 |
| 断网运维 | 无外网时的日志采集、指标上报、升级包获取 | 断网时能否定位一次故障 |
| 信创适配 | CPU 架构差异（x86 / ARM 类）导致的算子与镜像兼容问题，**上线前先跑关键算子清单** | 关键算子清单是否在目标架构上跑通并留对照结果 |
| 账号与合规 | 与客户既有身份源（LDAP / OIDC）对接、等保要求的审计留存 | 审计日志能否交给客户自行导出 |

**信创适配的可执行做法**：列出你的 Agent 会真正调用的算子和依赖（例如向量检索算子、量化推理内核、Python 扩展包），**在内网目标架构上逐个跑通并记录精度差异**；差异不可解释的算子，宁可写进"不支持清单"，也不要现场试。

**（2）工具出口的实现骨架**（伪代码，落到你的语言里）

```python
def invoke_tool(tenant, session_id, step_index, tool_name, args, trace_id):
    spec = registry.get(tool_name)                      # 注册表：不在册的工具一律拒绝
    if not acl.allow(tenant, tool_name): raise Denied()  # 鉴权：租户 × 工具
    args = schema.validate(spec.input_schema, args)      # 参数校验：类型 + 范围 + 长度
    key = idem_key(tenant, session_id, step_index, tool_name, args)
    if cached := idem.get(key): return cached            # 幂等：同键直接返回首次结果
    if spec.writable and not human.approved(key):        # 人审闸门：写操作必须已批准
        return human.request(key, deadline=spec.gate_ttl)  # 有超时，不能永久挂起
    quota.reserve(tenant, spec.estimate(args))           # 配额：先预扣
    try:
        result = spec.call(args)                         # 真正的调用
    finally:
        quota.settle(tenant, spec.actual(args, result))  # 结算并退还差额
        audit.write(trace_id, tenant, tool_name, args, result,
                    versions=versions.pinned(session_id))# 留痕：带钉住的版本四元组
    idem.put(key, result)
    return result
```

**四件事的判定顺序也是设计的一部分**：`在册 → 有权 → 参数合法 → 未重复 → 已批准 → 有额度`。把"额度"放在"批准"前、或把"幂等"放在"鉴权"前，都会产生可被利用的边界（例如越权请求先消耗了配额）。

**（3）会话状态表（DDL 骨架）**

```sql
CREATE TABLE agent_session (
  session_id     UUID PRIMARY KEY,
  tenant_id      TEXT        NOT NULL,
  agent_version  TEXT        NOT NULL,   -- 版本四元组的摘要（编排+提示+路由+工具集）
  status         TEXT        NOT NULL,   -- created|running|waiting_human|completed|failed|cancelled
  step_index     INT         NOT NULL DEFAULT 0,
  opened_at      TIMESTAMPTZ NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL,
  deadline_at    TIMESTAMPTZ,            -- 每个状态的超时（human 状态尤其要有）
  quota_reserved BIGINT      NOT NULL DEFAULT 0
);

CREATE TABLE agent_step (                -- 检查点：一步步追加，不覆盖
  session_id  UUID NOT NULL REFERENCES agent_session(session_id),
  step_index  INT  NOT NULL,
  intent      JSONB,                     -- 打算做什么（恢复时用于判断是否已执行）
  effect      JSONB,                     -- 已生效的事实（写操作必须落在这里）
  tokens_in   INT, tokens_out INT,
  tool_calls  JSONB,
  created_at  TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (session_id, step_index)
);

CREATE TABLE idem_record (               -- 幂等键：唯一约束就是并发安全的实现
  idem_key   TEXT PRIMARY KEY,
  response   JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
```

**判据**：`agent_step` 采用**追加**而不是覆盖——覆盖式状态在事故复盘时无法回答"它中途看见了什么"（同 [Ch01 §06 表格式](../../03-data-stack/06-schema-and-time-travel/06-schema-and-time-travel.md) 的"覆盖销毁历史"）。

**（4）工具注册条目（YAML 骨架）**

```yaml
tool: warehouse.query_readonly
owner: data-platform@example.com
writable: false                 # 只读工具：不需要人审闸门
input_schema: {type: object, required: [sql], properties: {sql: {type: string, maxLength: 20000}}}
egress: gateway                 # 唯一出口的标识；缺这一项的工具不允许注册
limits: {max_rows: 10000, timeout_ms: 30000, max_bytes_scanned: 5000000000}
scope: {tenants: [analytics, marketing], tables_allow: ["dws_*", "dim_*"], deny: ["pii_*"]}
audit: {capture_args: true, capture_result_summary: true, retention_days: 180}
```

**两条硬规则**：① `writable: true` 的工具必须声明 `gate_ttl`（闸门超时）；② `scope` 里的表白名单是**平台强制**的，不是"工具自己会检查"——工具的自我约束不能算控制项（[Ch11 §02 数据安全](../../11-cross-cutting/02-data-security/02-data-security.md) 的"策略未生效的执行点"）。

**（5）MCP 式工具接入的三件套**（工具 / 资源 / 提示）

| 件 | 在平台里对应什么 | 接入时要额外做的三件事 |
| --- | --- | --- |
| 工具（Tool） | 出口后面的一个可调用单元 | 登记 Schema、声明可写性、接（0）里的四件事 |
| 资源（Resource） | 只读的数据视图（表、文档、文件） | 按租户做**可见性裁剪**（同一资源对不同租户返回不同子集） |
| 提示（Prompt） | 可被引用的提示模板 | 版本化 + 只允许引用已发布版本 |

**判据**：**接入协议不等于接入治理**。协议解决"怎么调"，平台还要解决"谁能调、调了记什么、超了怎么办"——只做协议接入、不做出口治理，会得到一个"什么都能调、什么都不知道"的平台。

**（6）平台级可观测：Trace 分段与三条 SLO**

```
一个会话的 Trace
└─ session（tenant, agent_version, 会话总时长）
   ├─ step 1（规划耗时）
   │   ├─ model.call（模型、input/output tokens、首 token 延迟）
   │   └─ tool.call（工具名、出口耗时、目标系统耗时、结果状态）
   └─ step 2 …
```

三条 SLO（缺一不可）：① **交互式首步延迟**（人机对话的第一步要快，与长任务分开度量）；② **长任务端到端完成率与时长分布**（含队列等待时间）；③ **单会话成本**（按租户统计 P50 / P95）。**第 ③ 条是平台与"能用"之间最直接的差距**——没有成本 SLO，成本优化没有靶点。

### 4.3 工具链与平台

| 层 | 可选 | 选型判据 |
| --- | --- | --- |
| 编排与状态机 | 以图 / 状态机描述流程的编排框架；或自研状态机 | 是否需要"运行期展开"的图（需要→编排框架；不需要→工作流引擎即可） |
| 长任务与持久化执行 | 持久化工作流引擎（可恢复的步骤执行） | 会话是否需要跨小时、跨重启、含人工节点 |
| 执行与沙箱 | 容器编排 + 沙箱运行时 | 是否有模型生成的代码进入执行路径 |
| 模型服务 | 自托管推理服务 / 托管端点（统一走 [模型网关](../../06-multi-model/03-model-gateway/03-model-gateway.md)） | 数据能否出域；GPU 供给形态 |
| 身份与权限 | 与客户既有身份源对接（OIDC / LDAP）+ 平台内 RBAC | 是否要求"客户自己的账号体系" |
| 可观测 | OpenTelemetry 语义约定 + 追踪后端 | 是否要求 Trace 与客户既有观测栈打通 |
| 工具接入 | 标准化的工具 / 资源 / 提示协议（MCP 一类） | 是否需要第三方工具生态 |

**选型的一条总判据**：**平台组的每一层都要能写出"不选它的原因"**——写不出原因的层，说明还没量过自己的约束。

### 4.4 存量迁移

**从"脚本里的 Agent"迁到平台**，四步走，每步都可独立验证：

1. **会话外置**：把内存里的对话与中间结果搬到状态表；**判据**：滚动重启后能续跑。
2. **工具收口**：把直连调用改成经出口调用；**判据**：出口统计与目标系统日志对账一致（差异为 0 或全部可解释）。
3. **配额接入**：给每个调用点补租户与 Agent 标签；**判据**：任意一天的账单能按租户拆开且合计等于总额（差异 < 1% 视为对齐）。
4. **版本钉住**：把当前线上行为固化成第一个版本四元组并发布；**判据**：能回滚到这个版本并复现同样的行为。

**迁移期的双跑**：新旧两条链路并行一小段时间，用同一批输入对拍结果与成本——这是唯一能在上线前发现"行为漂移"的办法（同 [Ch11 §06 数据资产化](../../11-cross-cutting/06-data-assetization/06-data-assetization.md) 的对拍思路）。

### 4.5 模板 / 示例

**模板 1：平台控制面 API 草案**（只列语义，不绑框架；下面是接口清单，**不是可解析的 YAML**）

```text
POST /agents/{agent}/versions        # 发布：body 为版本四元组，返回 version_id
POST /agents/{agent}/rollback        # 回滚：body 为 version_id（改指针，不动执行体）
POST /sessions                       # 发起会话：body 含 tenant、agent、input、idempotency_key
GET  /sessions/{id}                  # 查状态：返回 status、step_index、deadline_at、quota_used
POST /sessions/{id}/approve          # 人审批准：body 含 approve|deny + 理由（进留痕）
POST /tools                          # 注册工具：body 为 §4.2（4）的 YAML
GET  /admin/quota/{tenant}           # 查配额：返回窗口内预扣、已结算、剩余
```

**模板 2：幂等键的归一化**（参数归一化是幂等正确性的关键）

```python
def normalize(args):
    # 关键：把"语义相同、写法不同"的参数归到同一个键，否则幂等会失效
    return json.dumps({
        k: sorted(v) if isinstance(v, list) else v
        for k, v in sorted(args.items()) if k not in ("trace_id", "timestamp")
    }, ensure_ascii=False, separators=(",", ":"))
```

**模板 3：灰度规则**（按租户 / 按会话分流的两种最小形态）

```yaml
release: {agent: metric-copilot, from: v12, to: v13}
rules:
  - {type: tenant_allowlist, tenants: [analytics-team], percent: 100}
  - {type: hash_bucket, key: session_id, percent: 5}      # 会话级分流：同一会话始终同一版本
guardrails:
  - {metric: session_failure_rate, window: 30m, max_delta_pp: 2, action: auto_rollback}
  - {metric: cost_per_session_p95, window: 1h, max_delta_pct: 20, action: pause}
```

**关键在 guardrail**：Agent 的"失败"不像 HTTP 5xx 那样直观，必须用**你可定义的行为指标**（会话失败率、单会话成本、工具错误率）做自动回滚触发；**没有 guardrail 的灰度只是分流，不是灰度**。

**模板 4：人审工单**

```json
{
  "ticket_id": "hg-2026-1013-0007",
  "tenant": "financial-analysis",
  "session_id": "6f1c…",
  "requested_action": {"tool": "ledger.post_entry", "args": {"amount": 128000, "account": "A-2231"}},
  "reversible": false,
  "evidence": {"trace_id": "9a2b…", "model_version": "…", "prompt_version": "…"},
  "deadline_at": "2026-10-13T10:15:00Z",
  "on_timeout": "deny"
}
```

**两条硬要求**：`reversible` 必须由**工具注册表**给出（不能由模型自述）；`on_timeout` 必须有明确取值——超时后默认拒绝，而不是默认通过。

**模板 5：一条会话的留痕查询**（复盘的入口）

```sql
-- 回答"这一次为什么这么做"：按 trace_id 拉出步骤、版本与工具调用
SELECT s.step_index, s.intent, s.effect, s.tool_calls,
       sess.agent_version, sess.tenant_id, s.created_at
FROM agent_step s JOIN agent_session sess USING (session_id)
WHERE sess.session_id = $1 ORDER BY s.step_index;
```

### 4.6 成本：这套东西的账单

**四块成本，分别决定不同的优化动作**【推算：口径固定，单价请按你自己的采购合同代入】：

| 成本块 | 构成 | 优化动作 |
| --- | --- | --- |
| 模型成本 | Σ 步骤 (in/out tokens × 单价) | 路由到经济档、提示瘦身、缓存命中率 |
| 计算成本（数据面） | 执行体副本数 × 单副本规格 × 时长 | 队列削峰、按租户分区的最小副本数 |
| 状态与留痕存储 | 检查点 + 步骤留痕 + Trace | 保留期分层（热 30 天 / 冷 1 年），留痕只存摘要 |
| 出口与治理固定成本 | 出口实例 + 审计存储 + 审批人力 | 与人审量匹配（§2.2 的 n > λ/μ） |

**算例（把量级感建起来）**：设单租户日活会话 `2,000`、每会话 `8` 步、每步 `4k` input + `600` output tokens【经验，随任务复杂度浮动】。

- 日 token：`2,000 × 8 × (4,000 + 600) ≈ 7,360 万 tokens/日`（量级：千万级/日/租户）；
- 状态写入：`2,000 × 8 = 1.6 万` 次/日/租户；按每步 `2–10 KB` 估算，**年留痕 ≈ 12–58 GB/租户**（`2,000 × 8 × 6 KB × 365`，取中值量级）；
- **结论**：模型成本随会话线性增长，留痕成本随"保留期 × 会话量"增长——所以**留痕的保留期是第一优先级的分层项**，别用"全部永久保存"来回避设计。

### 4.7 容灾与故障演练

**五类故障，每类都要有"可演练的动作"**（不是"我们有预案"）：

| 故障 | 演练动作 | 通过判据 | 常见失效点 |
| --- | --- | --- | --- |
| 模型端点不可用 | 主动让网关返回 5xx / 限流 | 会话进入可重试失败或降级到备用档，**不产生重复副作用** | 重试无幂等 → 重复写 |
| 队列积压 | 阻塞消费端 10 分钟 | 积压深度可见、有告警、长任务不挤占交互式队列 | 队列与交互式共用 → 全面变慢 |
| 状态存储故障 | 主库切备 / 只读模式 | 进行中的会话能恢复；不能恢复的进入明确失败态 | 恢复语义未定义 → 重复执行 |
| 工具超时风暴 | 让某个下游工具长时间不响应 | 出口熔断该工具，其他工具不受影响 | 出口无限等待 → 并发耗尽 |
| 发布回滚 | 灰度期间触发 guardrail | 自动回到上一版本指针，且**行为可复现** | 版本四元组不完整 → 回滚后行为仍不同 |

**一条演练纪律**：**每次演练都要留下"演练前 / 演练后"的两组数字**（失败会话数、平均恢复时长、成本差异）——没有数字的演练，下一年还会练同一个地方。

### 4.8 演进路线：0 → 1 → 100

- **0 → 1（单团队可用）**：完成第 2、3、4 步（状态外置、工具出口、模型接入层），发布单元带上提示与模型版本。判据：滚动重启不丢会话、出口能对账。
- **1 → 10（多团队共用）**：补第 5、6 步（队列与幂等、配额与计量），控制面 / 数据面分离。判据：账单能按租户拆开；长任务与交互式分队列。
- **10 → 100（多租户 + 合规 + 私有化）**：补第 7、8 步（可观测与回放、发布灰度和回滚），按租户分区，私有化交付包成形。判据：一次真实回滚演练通过；断网环境一次装成。

### 4.9 自检清单

- [ ] 八步里，**第 2 步（状态外置）与第 3 步（工具出口）**是否已完成？若未完成，后面的治理是否都还停在纸面？
- [ ] 部署包能否在**断网**环境一次装成？安装文档里有没有需要公网的步骤？
- [ ] 关键算子清单在**目标 CPU 架构**上跑通了吗？精度差异记录在哪？
- [ ] 工具出口的四件事（鉴权 / 校验 / 配额 / 留痕）都实现了吗？**顺序**是否正确？
- [ ] `writable: true` 的工具都声明了 `gate_ttl` 吗？超时后的默认动作是拒绝还是通过？
- [ ] 幂等键的归一化函数处理了"列表顺序 / 无关字段"吗？重放一次同一请求会重复写吗？
- [ ] 会话状态用的是**追加**的步骤表吗？写操作之后的检查点记录了"已生效"吗？
- [ ] 配额是预扣后结算吗？对账差异有多大（目标 < 1%）？
- [ ] 灰度带 guardrail 吗？触发条件是**行为指标**（失败率 / 成本）还是只有错误率？
- [ ] 留痕带**版本四元组**吗？能否用它复现一次会话？
- [ ] 留痕保留期分层了吗？年度存储量估算过没有？
- [ ] 五类故障各演练过一次吗？演练前后的两组数字在哪里？
- [ ] 成本能否拆到租户 / Agent / 会话？模型成本与平台固定成本的比值是多少？
- [ ] 迁移期做过双跑对拍吗？差异项都解释了吗？

### 4.10 小结

> 本节小结：平台的工程实现可以压缩成一句话——**先把状态搬出去、再把工具收进来，最后才谈编排得多聪明**。八步顺序的实质是"先建不可绕过的落点"：状态存储是不可绕过的（否则丢会话）、工具出口是不可绕过的（否则权限与审计失效）、模型接入层是不可绕过的（否则多厂商差异与计费散在各处）、发布指针是不可绕过的（否则回滚不可执行）。四块成本里，**模型成本随使用线性增长，留痕成本随保留期增长**——所以留痕分层是第一优先级的设计项，而不是运维优化。

> 💡 **思考锚点**：在你现在的实现里挑一个写操作（提交、下单、变更配置都算），完整走一遍 §4.2 的出口顺序：它是否在册、是否鉴权、参数是否校验、是否幂等、是否需要批准、是否有额度。任何一项答"没有"的地方，就是你可以用半天时间补上、并且能立刻用一次重放验证的缺口——你打算从哪一项开始？

#### 复查提示（本节给出判据的地方）

- 八步顺序与判据 → §4.1；私有化六件事与信创判据 → §4.2（1）；出口与状态表 → §4.2（2）（3）；工具条目与协议三件套 → §4.2（4）（5）；可观测与三条 SLO → §4.2（6）；成本四块与算例 → §4.6；故障演练 → §4.7。
