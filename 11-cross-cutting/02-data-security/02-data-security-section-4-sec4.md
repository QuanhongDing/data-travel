> 本文件是 **02-data-security.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](02-data-security.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：盘点与分类分级（4-8 周）**

1. 数据资产盘点：列出所有数据源、表、字段。
2. 分类：按 4 大类（公开 / 内部 / 一般 / 重要）+ 个人信息子类。
3. 分级：L1（公开）、L2（内部）、L3（一般）、L4（重要）、L5（敏感）。
4. 标签：给每个字段打标签（写入元数据）。
5. Owner：每张表 / 每个字段指定 Owner。

**Step 2：访问控制（4-8 周）**

1. 角色梳理：按业务角色定义（数据分析师、研发、业务 BP、合规审计）。
2. 权限矩阵：角色 × 资源 → 权限（读 / 写 / 删 / 管理）。
3. IAM 接入：SSO + MFA + JIT。
4. 数据库权限收敛：删除野生账号，强制走 Ranger / IAM。

**Step 3：脱敏与加密（4-8 周）**

1. 静态脱敏：测试环境、备份、BI 看板全量脱敏。
2. 动态脱敏：查询时按角色实时脱敏。
3. KMS 落地：统一密钥管理 + BYOK 支持。
4. 传输加密：所有内部通信 TLS 1.3 / mTLS。

**Step 4：审计与监控（持续）**

1. 全链路审计：登录、查询、修改、导出、删除。
2. 异常检测：UEBA 模型识别异常访问。
3. 合规报告：GDPR / 个保法 / 等保自动报告。

**Step 5：AI 时代加固（持续）**

1. AI 工具白名单：批准可用 AI 工具（私有 LLM、合规 SaaS）。
2. AI 输入 DLP：拦截敏感数据喂给外部 LLM。
3. AI 输出审计：LLM 输出水印 + 敏感词检测。
4. RAG 数据隔离：不同部门 RAG 库物理隔离。

### 4.2 关键技术点

**1. 数据分类分级落地**：

```yaml
# 字段级标签示例（DataHub YAML）
dataset: prod.orders
fields:
  - name: order_id
    classification: INTERNAL  # 内部
    pii: false
  - name: user_id
    classification: CONFIDENTIAL  # 机密
    pii: true
  - name: user_phone
    classification: HIGHLY_CONFIDENTIAL  # 高度机密
    pii: true
    pattern: "^1[3-9]\\d{9}$"
    owner: privacy-team@example.com
  - name: user_id_card
    classification: TOP_SECRET  # 绝密
    pii: true
    encryption_required: true
    access_audit: true
```

**2. 动态脱敏（基于 Ranger）**：

```xml
<!-- Ranger Policy: 按角色动态脱敏 -->
<policy>
  <name>orders_dynamic_mask</name>
  <resource>
    <database>prod</database>
    <table>orders</table>
    <column>user_phone</column>
  </resource>
  <policyItems>
    <item>
      <accesses>
        <access type="select"/>
      </accesses>
      <users>[data-analyst-group]</users>
      <rowFilterPolicies></rowFilterPolicies>
      <dataMaskPolicies>
        <dataMaskPolicy>
          <dataMaskType>CUSTOM</dataMaskType>
          <dataMaskQuery>CONCAT('***', SUBSTR({col}, 8, 4))</dataMaskQuery>
        </dataMaskPolicy>
      </dataMaskPolicies>
    </item>
  </policyItems>
</policy>
```

**3. 加密架构**：

```
应用层      → TLS 1.3 + mTLS
数据层      → TDE（透明数据加密）
备份层      → AES-256 + 密钥轮转
密钥层      → KMS + HSM（BYOK）
使用层      → TEE（同态加密可选）
```

**4. KMS 关键设计**：

- **密钥分层**：主密钥（KEK）+ 数据密钥（DEK）。
- **密钥轮转**：DEK 每 90 天轮转，KEK 每年轮转。
- **审计**：所有密钥操作记录日志。
- **备份**：密钥加密备份到异地。

### 4.3 工具链与平台（含 2024-2025 新工具）

**权限管理工具**：

| 工具 | 定位 | 优势 | 劣势 |
| --- | --- | --- | --- |
| **Apache Ranger** | 大数据权限管理 | 生态丰富、与 Hive/Spark 集成 | 仅支持大数据场景 |
| **Apache Sentry** | 大数据权限（CDH） | 简单直接 | CDH 专属，社区萎缩 |
| **Open Policy Agent (OPA)** | 通用策略引擎 | 与 K8s/Istio 集成 | 学习曲线 |
| **Cerbos** | 授权服务 | 易集成、支持 ABAC | 商业功能需付费 |
| **AWS Lake Formation** | AWS 数据湖权限 | 与 AWS 深度集成 | 仅限 AWS |
| **Databricks Unity Catalog** | Lakehouse 治理 | 与 DLT 集成 | 仅限 Databricks |

**脱敏与加密工具**：

| 工具 | 定位 |
| --- | --- |
| **Immuta** | 数据脱敏 + ABAC + 审计一体化 |
| **Collibra Data Privacy** | 元数据 + 隐私管理 |
| **Privacera** | 开源版 Ranger 商业增强 |
| **AWS KMS / HSM** | 云 KMS |
| **HashiCorp Vault** | 开源密钥管理 |
| **Azure Confidential Computing** | TEE 云服务 |
| **阿里云数据安全中心** | 中国本土合规优先 |

**DLP / 数据安全网关**：

| 工具 | 定位 |
| --- | --- |
| **Netskope** | 云 DLP |
| **Microsoft Purview DLP** | 微软系 DLP |
| **Symantec DLP** | 传统 DLP 龙头 |
| **阿里云数据安全网关** | 中国本土 |
| **字节跳动 DataGPT 安全网关** | 自研网关 |

**AI 时代新工具（2024-2025）**：

- **Microsoft Purview + AI Hub**：AI 数据治理。
- **Nightfall AI**：LLM 输出端 DLP。
- **Harmonic Security**：AI 工具数据泄露检测。
- **Skyflow**：AI 数据隐私保护。
- **Privately.ai**：差分隐私 SaaS。
- **Confident Security**（2024 成立）：机密 LLM 推理。

### 4.4 代码 / 示例

**示例 1：基于 Open Policy Agent 的 ABAC**

```rego
# policy/authz.rego
package data.authz

default allow = false

# 用户属性
user_attributes = {
    "department": input.user.department,
    "role": input.user.role,
    "clearance": input.user.clearance,
}

# 资源属性
resource_attributes = {
    "classification": input.resource.classification,
    "owner": input.resource.owner,
    "department": input.resource.department,
}

# 允许规则
allow {
    # 同部门且具备最低权限
    user_attributes.department == resource_attributes.department
    user_attributes.role == "data_analyst"
    input.action == "read"
}

allow {
    # 高权限用户可跨部门访问机密数据
    user_attributes.clearance == "L4"
    resource_attributes.classification != "TOP_SECRET"
    input.action == "read"
}

# 数据脱敏决策
mask_field[field] {
    field := input.resource.fields[_]
    field.pii == true
    user_attributes.role != "data_scientist"
}
```

```python
# Python 调用
import requests

def check_access(user_id, resource_id, action):
    response = requests.post(
        "http://opa:8181/v1/data/data/authz/allow",
        json={
            "input": {
                "user": get_user_attributes(user_id),
                "resource": get_resource_attributes(resource_id),
                "action": action,
            }
        }
    )
    return response.json().get("result", False)
```

**示例 2：Apache Ranger 策略 REST API**

```bash
# 创建 Ranger Policy
curl -X POST http://ranger:6080/service/public/v2/api/policy \
  -H "Content-Type: application/json" \
  -u admin:${RANGER_ADMIN_PASSWORD} \
  -d '{
    "policyName": "orders_pii_access",
    "serviceName": "hive_prod",
    "resources": {
      "database": {"values": ["prod"]},
      "table": {"values": ["orders", "users"]},
      "column": {"values": ["user_phone", "user_id_card"]}
    },
    "policyItems": [
      {
        "accesses": [{"type": "select"}],
        "users": ["data-analytics-group"],
        "dataMaskPolicyItems": [{
          "dataMaskType": "MASK_SHOW_LAST_4",
          "accesses": [{"type": "select"}]
        }]
      }
    ],
    "auditPolicy": true
  }'
```

**示例 3：基于 SPIFFE/SPIRE 的零信任身份**

```yaml
# spire-agent.conf
agent {
  data_dir = "/var/lib/spire"
  server_address = "spire-server.example.com"
  trust_domain = "example.com"
  insecure_bootstrap = true
}

plugins {
  NodeAttestor "join_token" {
    plugin_data {}
  }
}
```

```python
# Python 应用获取身份证书
from pyspiffe.workloadapi import X509Source

# 从 SPIRE Workload API 获取 SVID
x509_source = X509Source()
svid = x509_source.fetch_x509_svid()

# 调用下游服务时携带 SVID
response = requests.get(
    "http://internal-api/orders",
    headers={"Authorization": f"Bearer {svid.token()}"}
)
```

**示例 4：AI 数据安全网关（输入端）**

```python
# ai_dlp.py
from typing import Optional
import re

class AIDataLossPrevention:
    """拦截敏感数据喂给外部 LLM"""
    
    SENSITIVE_PATTERNS = {
        "ID_CARD": r"\d{17}[\dXx]",
        "PHONE": r"1[3-9]\d{9}",
        "EMAIL": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        "BANK_CARD": r"\d{16,19}",
        "API_KEY": r"(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36,})",
    }
    
    def scan(self, text: str) -> dict:
        findings = []
        for pii_type, pattern in self.SENSITIVE_PATTERNS.items():
            matches = re.findall(pattern, text)
            if matches:
                findings.append({
                    "type": pii_type,
                    "count": len(matches),
                    "sample": matches[0][:3] + "***"  # 脱敏展示
                })
        
        return {
            "has_sensitive": len(findings) > 0,
            "findings": findings,
            "recommendation": "BLOCK" if findings else "ALLOW"
        }
    
    def sanitize(self, text: str) -> str:
        """脱敏处理"""
        for pii_type, pattern in self.SENSITIVE_PATTERNS.items():
            text = re.sub(pattern, f"[{pii_type}_REDACTED]", text)
        return text


# Agent 调用前拦截
dlp = AIDataLossPrevention()
user_input = "我的身份证是 110101199001011234，手机是 13800001234"

scan_result = dlp.scan(user_input)
if scan_result["has_sensitive"]:
    user_input = dlp.sanitize(user_input)
    # 或者直接 BLOCK，提示用户手动脱敏
    
# 调用 LLM
response = openai_client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": user_input}],
)
```

---
