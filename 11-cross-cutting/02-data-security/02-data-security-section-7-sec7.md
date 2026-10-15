> 本文件是 **02-data-security.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](02-data-security.md)。

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

**权限管理工具对比**：

| 工具 | 配置成本 | 大数据支持 | ABAC 支持 | 性能 | AI 集成 | 社区生态 | 总分 |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Apache Ranger** | 4 | 5 | 4 | 4 | 3 | 5 | 25 |
| **Apache Sentry** | 5 | 5 | 2 | 5 | 2 | 2 | 21 |
| **Open Policy Agent** | 3 | 3 | 5 | 5 | 4 | 5 | 25 |
| **Cerbos** | 4 | 3 | 5 | 5 | 4 | 4 | 25 |
| **AWS Lake Formation** | 4 | 4 | 3 | 5 | 4 | 3 | 23 |
| **Unity Catalog** | 4 | 4 | 4 | 5 | 5 | 4 | 26 |
| **Immuta** | 5 | 5 | 5 | 4 | 4 | 3 | 26 |

**脱敏工具对比**：

| 工具 | 静态脱敏 | 动态脱敏 | API 集成 | AI 集成 | 合规适配 |
| --- | :---: | :---: | :---: | :---: | :---: |
| **Immuta** | 5 | 5 | 5 | 4 | 5 |
| **Privacera** | 5 | 5 | 4 | 3 | 4 |
| **Collibra** | 4 | 3 | 4 | 5 | 5 |
| **自研** | 5 | 4 | 5 | 4 | 3 |

### 7.2 决策树

```
是否需要细粒度 ABAC？
├── 是 → Open Policy Agent / Cerbos / Immuta
└── 否 → 继续
    │
    是否大数据场景（Hive/Spark/HDFS）？
    ├── 是 → Apache Ranger
    └── 否 → 继续
        │
        是否云原生？
        ├── 是 → 云原生 IAM（AWS IAM / Azure RBAC / 阿里云 RAM）
        └── 否 → 传统 IAM（LDAP / Active Directory）
```

**选型决策表**：

| 场景 | 首选 | 备选 |
| --- | --- | --- |
| Hadoop 生态 | Apache Ranger | Apache Sentry |
| 云原生 / K8s | OPA + Istio | Cerbos |
| 数据湖 / Lakehouse | Unity Catalog / Lake Formation | Privacera |
| 多云数据 | Immuta | 自研 + Ranger |
| AI / LLM | AI DLP（Nightfall） + 机密计算 | Microsoft Purview |
| 中国本土合规 | 阿里云 RAM + DAS 审计 | 华为云 IAM |
| 金融 / 强合规 | Immuta + 自研 + HSM | Privacera + HSM |

### 7.3 组合使用

**常见组合 1：Ranger + HSM + Vault**

- **Ranger**：大数据权限。
- **HSM**：硬件密钥保护。
- **Vault**：密钥管理 + 自动轮转。

**常见组合 2：OPA + Cerbos + Cerbos + Keycloak**

- **OPA**：通用策略引擎。
- **Cerbos**：授权服务。
- **Keycloak**：IAM + SSO。

**常见组合 3：Unity Catalog + Immuta + Nightfall**

- **Unity Catalog**：Lakehouse 元数据 + 权限。
- **Immuta**：动态脱敏 + ABAC。
- **Nightfall**：AI DLP。

**常见组合 4：阿里云 RAM + DAS 审计 + 通义安全**

- **阿里云 RAM**：统一身份认证。
- **DAS 审计**：数据库审计。
- **通义安全**：AI 时代数据安全。

---
