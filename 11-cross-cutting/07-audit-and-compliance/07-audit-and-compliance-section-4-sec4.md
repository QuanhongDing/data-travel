> 本文件是 **07-audit-and-compliance.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](07-audit-and-compliance.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：合规框架识别（4-8 周）**

1. 识别适用合规框架（GDPR / 个保法 / HIPAA / PCI-DSS / 等保 2.0/3.0）。
2. 列出所有合规要求（按框架映射）。
3. 评估当前合规差距（Gap Analysis）。
4. 优先级排序（P0 / P1 / P2）。

**Step 2：审计日志采集（4-8 周）**

1. 接入所有关键系统的审计日志（DB / 大数据 / 应用 / API）。
2. 集中式存储（ELK / S3 / 自研）。
3. 不可篡改存储（WORM / 区块链）。
4. 保留期设置（按合规要求）。

**Step 3：合规规则配置（4-8 周）**

1. 配置合规检查规则（访问控制 / 加密 / 脱敏）。
2. 部署持续监控（实时告警）。
3. 配置自动化合规报告。
4. 与 SIEM 系统集成（Security Information and Event Management）。

**Step 4：监管报送自动化（4-8 周）**

1. 梳理监管报送要求（EAST / 1104 / 人行报表）。
2. 自动化数据 ETL + 校验 + 报送。
3. 监管接口对接。
4. 异常处理 + 重报送。

**Step 5：AI 合规（4-8 周）**

1. LLM 调用审计。
2. AI 模型版本管理。
3. 训练数据来源追溯。
4. AI 输出合规检查。

**Step 6：合规运营（持续）**

1. 月度合规评审。
2. 季度合规审计。
3. 年度第三方审计（SOC 2、ISO 27001）。
4. 合规培训。

### 4.2 关键技术点

**1. 审计日志采集（数据库）**：

```python
# audit_collector.py
from typing import Optional
from datetime import datetime
import boto3


class AuditCollector:
    """统一审计日志采集器"""
    
    def __init__(self):
        self.cloudtrail = boto3.client('cloudtrail')
        self.rds_audit_logs = []
        self.app_audit_logs = []
    
    def log_database_operation(
        self,
        user: str,
        operation: str,  # SELECT / INSERT / UPDATE / DELETE
        database: str,
        table: str,
        sql: str,
        timestamp: Optional[datetime] = None,
        ip_address: Optional[str] = None,
    ):
        """记录数据库操作"""
        log_entry = {
            "timestamp": (timestamp or datetime.now()).isoformat(),
            "user": user,
            "operation": operation,
            "database": database,
            "table": table,
            "sql_hash": hash(sql),  # 不存原文，只存哈希
            "sql_pattern": self._extract_pattern(sql),  # 提取模式
            "ip_address": ip_address,
            "session_id": self._get_session_id(),
            "rows_affected": self._get_rows_affected(),
        }
        
        # 1. 写入不可篡改存储
        self._write_immutable(log_entry)
        
        # 2. 实时分析（异常检测）
        self._check_anomaly(log_entry)
        
        return log_entry
    
    def log_access(
        self,
        user: str,
        resource: str,
        action: str,  # READ / WRITE / DELETE / EXPORT
        classification: str,  # 数据分级
        timestamp: Optional[datetime] = None,
    ):
        """记录数据访问"""
        log_entry = {
            "timestamp": (timestamp or datetime.now()).isoformat(),
            "user": user,
            "resource": resource,
            "action": action,
            "classification": classification,
        }
        
        # 高敏感数据访问立即告警
        if classification in ["机密", "绝密"]:
            self._alert_high_sensitivity_access(log_entry)
        
        self._write_immutable(log_entry)
        return log_entry
    
    def _write_immutable(self, log_entry):
        """写入不可篡改存储（S3 Object Lock）"""
        # 关键：开启 Object Lock + Compliance 模式
        # 任何人都无法修改或删除
        s3 = boto3.client('s3')
        s3.put_object(
            Bucket='audit-logs-bucket',
            Key=f"audit/{log_entry['timestamp'][:10]}/{log_entry['session_id']}.json",
            Body=json.dumps(log_entry),
            ObjectLockMode='COMPLIANCE',
            ObjectLockRetainUntilDate=datetime.now() + timedelta(days=2555),  # 7 年
        )
    
    def _check_anomaly(self, log_entry):
        """异常检测"""
        # 例：异常时间访问、异常 IP、异常 SQL 模式
        if log_entry["operation"] == "DELETE" and log_entry["rows_affected"] > 10000:
            self._alert("Large DELETE detected", log_entry)
```

**2. 合规规则检查（OPA）**：

```rego
# compliance.rego
package compliance.gdpr

# GDPR 数据最小化原则
deny[msg] {
    input.user.pii_access
    not input.consent_record
    msg := sprintf("GDPR violation: user %v accessed PII without consent", [input.user.id])
}

# GDPR 数据主体权利 - 删除权
deny[msg] {
    input.action == "delete_user_data"
    not input.deletion_request_approved
    msg := "GDPR violation: deletion requires approved request"
}

# GDPR 数据跨境传输
deny[msg] {
    input.data.location != "EU"
    input.user.region == "EU"
    not input.cross_border_approval
    msg := "GDPR violation: cross-border transfer without approval"
}
```

**3. 监管报送自动化**：

```python
# regulatory_reporting.py
"""
监管报送自动化：EAST、1104、人行报表、银保监报表
"""
import pandas as pd
from datetime import datetime, timedelta
from typing import List


class RegulatoryReporter:
    """监管报送自动化"""
    
    def __init__(self):
        self.templates = {
            "EAST": self._east_template,
            "1104": self._1104_template,
            "PBOC": self._pboc_template,
        }
    
    def generate_east_report(self, period: str) -> pd.DataFrame:
        """生成 EAST 报表"""
        # 1. 数据抽取
        data = self._extract_data(period)
        
        # 2. 数据校验
        validation_errors = self._validate_east(data)
        if validation_errors:
            raise ValueError(f"EAST validation failed: {validation_errors}")
        
        # 3. 报表生成
        report = self._east_template(data)
        
        # 4. 加密 + 数字签名
        signed_report = self._sign_report(report)
        
        return signed_report
    
    def _extract_data(self, period: str) -> pd.DataFrame:
        """数据抽取（按报送要求）"""
        return pd.read_sql(
            """
            SELECT 
                customer_id,
                account_id,
                transaction_id,
                transaction_date,
                transaction_amount,
                transaction_type,
                counterparty_account,
                counterparty_name,
                balance_after,
                currency
            FROM east_data
            WHERE data_period = :period
            """,
            con=self.engine,
            params={"period": period},
        )
    
    def _validate_east(self, data: pd.DataFrame) -> List[str]:
        """EAST 数据校验"""
        errors = []
        if data["transaction_amount"].isnull().any():
            errors.append("transaction_amount has nulls")
        if (data["transaction_amount"] <= 0).any():
            errors.append("transaction_amount has non-positive values")
        return errors
    
    def submit_report(self, report_type: str, period: str, data: pd.DataFrame):
        """提交报送"""
        # 1. 加密
        encrypted = self._encrypt_report(data)
        
        # 2. 数字签名
        signature = self._sign_report(data)
        
        # 3. 通过监管接口报送
        response = self._submit_to_regulator(
            report_type=report_type,
            period=period,
            data=encrypted,
            signature=signature,
        )
        
        # 4. 报送日志（审计追溯）
        self._log_submission(report_type, period, response)
        
        return response
```

**4. AI 时代合规审计**：

```python
# ai_compliance_audit.py
import os
from datetime import datetime
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


class AIComplianceAuditor:
    """AI 系统合规审计"""
    
    def audit_llm_call(self, user_id, prompt, response, context):
        """审计 LLM 调用"""
        
        # 1. 记录原始数据
        audit_log = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "prompt": prompt,
            "response": response,
            "context": context,
            "model": "claude-3-5-sonnet-20241022",
            "tokens": len(prompt) + len(response),
        }
        
        # 2. 敏感数据检测
        sensitive_findings = self._detect_sensitive_data(prompt + response)
        audit_log["sensitive_findings"] = sensitive_findings
        
        # 3. AI 输出合规检查
        compliance_issues = self._check_compliance(prompt, response)
        audit_log["compliance_issues"] = compliance_issues
        
        # 4. 不可篡改存储
        self._store_immutable(audit_log)
        
        return audit_log
    
    def audit_model_version(self, model_id, version, training_data_sources):
        """审计模型版本"""
        audit_log = {
            "timestamp": datetime.now().isoformat(),
            "event": "model_version_change",
            "model_id": model_id,
            "version": version,
            "training_data_sources": training_data_sources,
            "data_provenance_verified": self._verify_data_provenance(training_data_sources),
        }
        self._store_immutable(audit_log)
        return audit_log
    
    def _detect_sensitive_data(self, text):
        """敏感数据检测"""
        # 使用正则 + AI 双重检测
        return []
    
    def _check_compliance(self, prompt, response):
        """合规检查"""
        # 检查是否含歧视、违法、危险内容
        issues = []
        
        # AI 评估合规性
        evaluation_prompt = f"""
请评估以下 AI 对话的合规性：
Prompt: {prompt}
Response: {response}

检查项：
1. 是否含歧视 / 偏见内容
2. 是否含违法 / 危险信息
3. 是否泄露个人隐私
4. 是否符合公司政策

输出 JSON 格式：
{{"compliant": true/false, "issues": [...]}}
"""
        
        result = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            messages=[{"role": "user", "content": evaluation_prompt}]
        )
        
        return issues
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**审计日志工具**：

| 工具 | 定位 |
| --- | --- |
| **AWS CloudTrail** | AWS 操作审计 |
| **Azure Monitor** | Azure 审计 |
| **Google Cloud Audit Logs** | GCP 审计 |
| **阿里云操作审计（ActionTrail）** | 阿里云审计 |
| **ELK Stack** | 自建集中日志 |
| **Splunk** | 企业级日志 + SIEM |
| **Apache Ranger Audit** | 大数据审计 |

**合规自动化平台**：

| 工具 | 定位 |
| --- | --- |
| **Vanta** | SOC 2 / ISO 27001 自动化 |
| **Drata** | 持续合规监控 |
| **Tugboat Logic** | 安全合规自动化 |
| **Secureframe** | SOC 2 / HIPAA 自动化 |
| **阿里云合规审计** | 中国本土合规 |
| **字节合规中台** | 字节自研 |

**数据库审计**：

| 工具 | 定位 |
| --- | --- |
| **MySQL Audit Plugin** | MySQL 原生 |
| **PostgreSQL pgAudit** | PG 原生 |
| **Oracle Audit Vault** | Oracle |
| **IBM Guardium** | 企业级数据库审计 |
| **Imperva** | 数据库安全 + 审计 |
| **阿里云数据库审计** | 中国本土 |

**AI 时代合规工具（2024-2025）**：

- **Langfuse**：LLM 调用审计。
- **LangSmith**：LangChain 审计。
- **Arize Phoenix**：LLM 评估 + 审计。
- **Helicone**：LLM API 网关 + 审计。
- **Confident Security**：机密 LLM 审计。
- **阿里云通义安全**：AI 合规。

### 4.4 代码 / 示例

**示例 1：完整的合规审计平台**

```python
# compliance_platform.py
from fastapi import FastAPI
from datetime import datetime, timedelta
import json

app = FastAPI(title="合规审计平台")


@app.post("/api/v1/audit/log")
def log_audit_event(event: dict):
    """记录审计事件"""
    # 不可篡改存储
    return {"status": "logged", "id": event.get("id")}


@app.get("/api/v1/compliance/report")
def generate_compliance_report(framework: str, period: str):
    """生成合规报告"""
    return {
        "framework": framework,
        "period": period,
        "compliance_score": 0.95,
        "issues": [],
        "evidence": [],
    }


@app.post("/api/v1/regulatory/submit")
def submit_to_regulator(report_type: str, period: str, data: dict):
    """提交监管报送"""
    return {"status": "submitted", "submission_id": "..."}
```

**示例 2：GDPR 数据主体权利响应（自动化）**

```python
# gdpr_data_subject_rights.py
"""
GDPR 数据主体权利响应自动化：
- 访问权（Right to Access）
- 删除权（Right to Erasure / Right to be Forgotten）
- 数据可携权（Right to Data Portability）
- 更正权（Right to Rectification）
- 限制处理权（Right to Restriction of Processing）
"""


class GDPRRightsHandler:
    def handle_access_request(self, user_id: str) -> dict:
        """访问权：返回该用户的所有数据"""
        return {
            "user_id": user_id,
            "personal_data": self._get_all_personal_data(user_id),
            "processing_purposes": self._get_processing_purposes(user_id),
            "data_sources": self._get_data_sources(user_id),
            "retention_period": self._get_retention_period(user_id),
            "third_party_sharing": self._get_third_party_sharing(user_id),
        }
    
    def handle_erasure_request(self, user_id: str) -> dict:
        """删除权：删除该用户的所有数据"""
        deletion_plan = {
            "user_id": user_id,
            "tables_to_delete": [],
            "tables_to_anonymize": [],
            "tables_to_retain": [],  # 因法律义务保留的
        }
        
        # 1. 查找所有含该用户数据的表
        tables = self._find_user_tables(user_id)
        
        for table in tables:
            if table["can_delete"]:
                deletion_plan["tables_to_delete"].append(table)
            elif table["can_anonymize"]:
                deletion_plan["tables_to_anonymize"].append(table)
            else:
                deletion_plan["tables_to_retain"].append(table)
        
        # 2. 执行删除（受控 + 审计）
        for table in deletion_plan["tables_to_delete"]:
            self._delete_user_data(table, user_id)
        
        # 3. 执行匿名化
        for table in deletion_plan["tables_to_anonymize"]:
            self._anonymize_user_data(table, user_id)
        
        # 4. 审计记录
        self._log_deletion(user_id, deletion_plan)
        
        return deletion_plan
    
    def handle_portability_request(self, user_id: str) -> dict:
        """数据可携权：导出用户数据"""
        data = self._get_all_personal_data(user_id)
        return {
            "user_id": user_id,
            "format": "JSON",
            "data": data,
            "exported_at": datetime.now().isoformat(),
        }
```

---
