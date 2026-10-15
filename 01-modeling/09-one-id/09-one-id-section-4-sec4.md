> 本文件是 **09-one-id.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](09-one-id.md)。

## 4. 工程实现

### 4.1 落地步骤

#### 阶段 1 · 数据盘点与 ID 清单（0→1 第 1 周）

1. **盘点所有上游系统**：业务库、日志、第三方、CRM、广告投放、客服、线下
2. **列出每个系统的 ID 类型与字段**：
   - user_id / customer_id / member_id / open_id / union_id / 手机号 / 邮箱 / 设备 ID / IMEI / IDFA / Cookie / 微信号
3. **输出 ID 关系清单**：`id_inventory.xlsx`
   - 列：ID 类型、来源系统、是否实名、是否加密、更新频率、合规等级

#### 阶段 2 · 强匹配规则建设（0→1 第 2-3 周）

1. **确定强匹配字段**：
   - 手机号（一级，最强）
   - 身份证号 hash（一级，最强，但需脱敏）
   - 邮箱 hash（一级）
   - 设备指纹 hash（一级，同设备同源）
2. **统一脱敏规范**：
   - 手机号 SHA-256 + 盐（盐定期轮换）
   - 身份证号 SHA-256 + 盐
   - 邮箱 lowercase + SHA-256 + 盐
3. **编写强匹配 ETL**：Hive SQL / Spark SQL / Flink SQL

#### 阶段 3 · 弱匹配规则 + ML 模型（0→1 第 4-6 周）

1. **模糊字段抽取**：
   - 姓名 → Jaro-Winkler / 拼音转换
   - 地址 → 地址标准化 + NER（省市区提取）
   - 公司名 → 公司名清洗 + 同义词替换
2. **行为特征构造**：
   - 同一 IP 段（/24 子网）
   - 同一 WiFi BSSID / GPS 坐标（30m 内）
   - 同一时间窗口（±30 分钟）
   - 同一设备型号 + OS + 屏幕尺寸
3. **训练 LightGBM 匹配模型**：
   - 正样本：人工标注 / 已有 OneID 的成对 ID
   - 负样本：随机采样非同 ID 对
   - 验证：AUC ≥ 0.95，KS ≥ 0.6

#### 阶段 4 · 图聚合 + OneID 生成（0→1 第 7-8 周）

1. **构建 ID-Graph**：Spark GraphX / Neo4j / NebulaGraph
2. **每日跑 WCC（弱连通分量）**
3. **每个 CC 分配 OneID**：
   - 取最小 ID 作为 OneID 主键
   - 或取最早注册 ID 作为 OneID 主键
4. **OneID 表输出**：
   - 字段：oneid, primary_id_type, primary_id_value, all_ids, first_seen, last_seen, version

#### 阶段 5 · 服务化（0→1 第 9-10 周）

1. **OneID 查询服务**：
   - 输入：phone / device_id / email / cookie
   - 输出：oneid + 关联 ID 列表
   - 性能：P99 < 100ms
2. **OneID 反向查询**：
   - 输入：oneid
   - 输出：所有关联 ID + 属性
3. **OneID 更新服务**：
   - 实时合并 / 拆分接口

#### 阶段 6 · 监控与治理（0→1 第 11-12 周）

1. **监控**：
   - 合并率、强匹配占比、弱匹配占比、冲突率
   - 服务 SLA（P99 < 100ms，可用性 99.95%）
2. **数据质量**：
   - OneID 覆盖率（账号有 OneID 比例）
   - 冲突率（同 OneID 下属性矛盾比例）
   - 回溯率（可被还原的合并比例）
3. **审计日志**：
   - 每次合并 / 拆分留痕
   - 提供审计查询接口

### 4.2 关键技术点

#### 4.2.1 设备指纹（Device Fingerprinting）

Web 端：
- UA（User-Agent）
- 屏幕分辨率、色深、像素比
- 系统字体列表
- Canvas 指纹（GPU 渲染差异）
- WebGL 指纹
- 已安装插件 / 已安装字体
- 时区、语言
- Cookie + localStorage（需用户授权）

移动端：
- iOS：IDFA（用户授权后才可访问，14.5 后大幅收紧）、IDFV（应用级）
- Android：OAID（替代 IMEI）、Android ID、IMEI（部分场景受限）、MAC 地址

服务端：
- IP + 运营商 + 地理位置
- WiFi BSSID
- 蓝牙 MAC
- 充电习惯、陀螺仪数据（黑产识别）

**命中率**：
- 移动端：70-90%（OAID 命中率高于 IDFA）
- Web 端：40-60%（浏览器隐私模式 / 清缓存后失效）

#### 4.2.2 加密与脱敏

- **手机号**：SHA-256(salt) + 截断（保留前 7 位或后 4 位做匹配）
- **身份证号**：SHA-256(salt) + 生日截断（用于一致性检查）
- **邮箱**：SHA-256(salt) + 域名截断
- **盐管理**：定期轮换（季度），双盐（业务盐 + 数据盐）

#### 4.2.3 ID-Graph 存储

| 工具 | 规模 | 延迟 | 适用 |
| --- | --- | --- | --- |
| Neo4j | 10 亿边 | ms 级 | 中等规模 |
| NebulaGraph | 100 亿边 | ms 级 | 大规模互联网 |
| TigerGraph | 100 亿边 | ms 级 | 金融风控 |
| Spark GraphX | 1000 亿边 | 分钟级 | 离线批处理 |
| GraphScope | 1000 亿边 | 秒级 | 一站式图计算 |
| Amazon Neptune | 100 亿边 | ms 级 | 云原生 |
| ArangoDB | 10 亿边 | ms 级 | 多模型（文档+图） |
| JanusGraph | 100 亿边 | ms 级 | 开源 + 可插拔后端 |

#### 4.2.4 实时增量更新（Flink / Kafka）

```
Kafka Topic: dwd_user_change
  Schema: { id_type, id_value, change_type, timestamp, source }
  
Flink Job:
  1. 消费变更事件
  2. 查询 OneID 主数据（Redis / HBase）
  3. 触发合并 / 拆分
  4. 更新 OneID 状态
  5. 写回主数据 + 通知下游
```

延迟目标：P99 < 1 秒。

#### 4.2.5 准实时批量（T+1 重算）

每日凌晨：
1. 全量读上游 ID 数据
2. 全量跑 ID-Mapping
3. 与昨日 OneID 表对比（diff）
4. 输出新 OneID 表 + 增量 diff

保证：批式校准实时增量，**最终一致性**。

### 4.3 工具链与平台（含 2024-2025 新工具）

#### 4.3.1 传统 MDM 套件

| 产品 | 厂商 | 特点 |
| --- | --- | --- |
| InfoSphere MDM | IBM | 企业级，重型，传统金融行业 |
| Informatica MDM | Informatica | 数据治理 + MDM 一体化 |
| Oracle MDM | Oracle | 与 Oracle DB 深度集成 |
| SAP MDG | SAP | ERP 厂商的 MDM |
| Reltio | Reltio | 云原生 MDM，图原生 |
| Tibco EBX | Tibco | 主数据 + 数据质量 |

#### 4.3.2 大数据 OneID 中台（自研）

- **阿里 OneID（Dataphin / Quick BI 配套）**：基于设备指纹 + 手机号三要素 + 图计算
- **字节 UID**：基于 UID 图 + 概率匹配（公开技术博客少量披露）
- **美团 UserID**：图数据库 + 规则引擎（公开论文已多次）
- **腾讯 OneID**：QQ / 微信 OpenID + UnionID + 手机号 + 设备 ID
- **京东 OneID**：电商场景的 ID-Mapping 平台
- **网易 OneID**：游戏账号 + 实名 + 设备指纹

#### 4.3.3 云厂商实体解析服务（2023-2025 新工具）

| 厂商 | 服务名 | 发布时间 | 特点 |
| --- | --- | --- | --- |
| AWS | **AWS Entity Resolution** | 2024 GA | ML-based 匹配，支持多种 blocking 策略 |
| Azure | **Azure AI Foundry ID Resolution** | 2024 GA | 与 Cognitive Services 集成 |
| GCP | **Cloud Entity Resolution (Dataplex)** | 2023 GA | BigQuery 内置 |
| Salesforce | **Data Cloud Zero-Copy ID Resolution** | 2024 GA | 零拷贝 + CDP |
| Palantir | **Foundry Entity Resolution** | 持续迭代 | 图原生 + Ontology |

#### 4.3.4 开源工具

- **Splink**（英国 MoJ 开源）：Python 实体解析库，Fellegi-Sunter 实现
- **dedupe**（DataMade）：Python 主动学习实体解析
- **Jellyfish**（James Trimble）：字符串相似度算法库
- **recordlinkage**（Python）：传统实体解析工具包
- **Apache Hivemall**（Treasure Data）：机器学习 + UDF 实体解析
- **Magellan**（Uber 开源）：基于 PySpark 的实体解析
- **DeepMatcher**（UMass）：深度学习实体解析
- **Ditto**：基于 BERT 的实体解析（GitHub）

#### 4.3.5 LLM 增强工具（2024-2025）

- **LangChain + Entity Resolution**：用 LLM 链做 ER
- **LlamaIndex GraphRAG**：图 + RAG 实体解析
- **Microsoft Presidio + LLM**：隐私 + ER
- **AWS Entity Resolution + Bedrock**：AWS 集成 LLM 的 ER 服务

### 4.4 代码 / 示例

#### 4.4.1 强匹配 SQL（Hive / Spark SQL）

```sql
-- 创建 OneID 中间表
CREATE TABLE dwd.one_id_mapping (
    id_id STRING COMMENT '原始 ID',
    id_type STRING COMMENT 'ID 类型',
    oneid BIGINT COMMENT 'OneID 主键',
    version BIGINT COMMENT '版本号',
    update_time TIMESTAMP
) PARTITIONED BY (dt STRING)
STORED AS ORC;

-- 强匹配：按手机号合并
INSERT OVERWRITE TABLE dwd.one_id_mapping PARTITION (dt='${biz_date}')
SELECT
    id_id,
    id_type,
    -- 取最早出现的 ID 作为 OneID 锚点
    MIN(oneid_anchor) OVER (PARTITION BY phone_hash) AS oneid,
    1 AS version,
    CURRENT_TIMESTAMP AS update_time
FROM (
    SELECT
        a.id_id,
        a.id_type,
        a.phone_hash,
        a.id_id AS oneid_anchor
    FROM dwd.user_profile_dim a
    WHERE a.dt = '${biz_date}'
      AND a.phone_hash IS NOT NULL
) t;
```

#### 4.4.2 模糊匹配 + LLM 复核（Python）

```python
"""
弱匹配：模糊匹配 + LLM 复核
适用：电商跨端用户打通
"""
from openai import OpenAI
from jellyfish import jaro_winkler_similarity
import pandas as pd
from typing import Tuple

client = OpenAI()


def phone_match(r: dict, s: dict) -> bool:
    """手机号强匹配"""
    return (r.get("phone_hash") is not None
            and r.get("phone_hash") == s.get("phone_hash"))


def fuzzy_name_match(r: dict, s: dict) -> float:
    """姓名模糊匹配"""
    n1, n2 = r.get("name", ""), s.get("name", "")
    if not n1 or not n2:
        return 0.0
    return jaro_winkler_similarity(n1, n2)


def llm_judge(r: dict, s: dict) -> Tuple[str, float]:
    """LLM 复核"""
    prompt = f"""
你是实体解析专家。判断两条记录是否指代同一人。

Record A: {r}
Record B: {s}

输出 JSON：
{{
  "decision": "merge" | "split" | "unsure",
  "confidence": 0.0-1.0,
  "reason": "..."
}}
"""
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
        response_format={"type": "json_object"}
    )
    import json
    result = json.loads(resp.choices[0].message.content)
    return result["decision"], result["confidence"]


def should_merge(r: dict, s: dict) -> bool:
    """综合判定：强匹配 OR (模糊匹配高 & LLM 复核通过)"""
    # 1. 强匹配
    if phone_match(r, s):
        return True
    # 2. 模糊匹配进入边界
    name_sim = fuzzy_name_match(r, s)
    if name_sim < 0.6:
        return False
    # 3. LLM 复核（仅在边界样本上调用，控制成本）
    decision, conf = llm_judge(r, s)
    return decision == "merge" and conf >= 0.85
```

#### 4.4.3 图聚合（Neo4j Cypher）

```cypher
// 创建 ID 节点
UNWIND $ids AS row
MERGE (n:ID {value: row.value})
SET n.type = row.type;

// 创建强匹配边（手机号一致）
MATCH (a:ID {type: 'user_id'}), (b:ID {type: 'phone_hash'})
WHERE a.phone_hash = b.value
MERGE (a)-[:STRONG_MATCH]->(b);

// 创建弱匹配边（设备指纹 hash 一致 + 行为相似）
MATCH (a:ID {type: 'device_id'}), (b:ID {type: 'user_id'})
WHERE a.behavior_sim > 0.85
MERGE (a)-[:WEAK_MATCH {confidence: a.behavior_sim}]->(b);

// 计算弱连通分量作为 OneID
CALL gds.wcc.stream('id-graph')
YIELD nodeId, componentId
MATCH (n:ID) WHERE id(n) = nodeId
SET n.oneid = componentId;
```

#### 4.4.4 Ditto 风格深度匹配（PyTorch + Hugging Face）

```python
"""
基于 BERT 的实体解析（Ditto 简化版）
"""
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tokenizer = AutoTokenizer.from_pretrained("bert-base-chinese")
model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-chinese", num_labels=2
)


def serialize_record(r: dict) -> str:
    """把 record 序列化为 Ditto 格式"""
    return " ".join(f"[COL]{k}[/COL]{v}" for k, v in r.items())


def ditto_match(r: dict, s: dict) -> float:
    """Ditto 风格匹配"""
    serialized_a = serialize_record(r)
    serialized_b = serialize_record(s)
    inputs = tokenizer(
        serialized_a, serialized_b,
        return_tensors="pt", truncation=True, max_length=128
    )
    with torch.no_grad():
        outputs = model(**inputs)
    probs = torch.softmax(outputs.logits, dim=-1)
    return probs[0][1].item()  # merge 概率
```

#### 4.4.5 实时增量更新（Flink）

```java
/**
 * OneID 实时增量更新 Flink Job
 */
public class OneIdStreamingJob {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        
        // 1. 消费上游 ID 变更事件
        DataStream<IDChangeEvent> events = env
            .addSource(new FlinkKafkaConsumer<>(
                "dwd.user.id_change",
                new IDChangeEventDeserializer(),
                kafkaProps))
            .name("ID Change Source");
        
        // 2. 实时 OneID 匹配
        DataStream<OneIdUpdate> updates = events
            .keyBy(e -> e.idValue)
            .process(new OneIdMatchFunction())
            .name("OneID Match");
        
        // 3. 写回 OneID 主数据（HBase / Redis）
        updates.addSink(new HBaseOneIdSink())
            .name("HBase OneID Sink");
        
        // 4. 通知下游（Kafka）
        updates.addSink(new FlinkKafkaProducer<>(
            "dwd.oneid.update", new OneIdUpdateSerializer(), kafkaProps))
            .name("OneID Update Notify");
        
        env.execute("OneID Streaming Job");
    }
}
```

#### 4.4.6 隐私计算 PSI（Java + Cipher）

```java
/**
 * 基于 RSA 盲签名的 PSI（Private Set Intersection）
 * 适用：广告归因场景，媒体方 × 广告主 匹配共同用户
 */
public class PSIExample {
    public static void main(String[] args) {
        // 1. 媒体方准备加密的手机号集合
        Set<String> mediaPhones = new HashSet<>(Arrays.asList(
            "13800001111", "13800002222", "13800003333"
        ));
        // RSA 盲签名加密
        Set<String> blindedPhones = mediaPhones.stream()
            .map(BlindSignature::blind)
            .collect(Collectors.toSet());
        
        // 2. 广告主签名（不暴露明文）
        Set<String> signedPhones = blindedPhones.stream()
            .map(s -> BlindSignature.sign(s, adServerPrivateKey))
            .collect(Collectors.toSet());
        
        // 3. 媒体方去盲
        Set<String> unblindedPhones = signedPhones.stream()
            .map(BlindSignature::unblind)
            .collect(Collectors.toSet());
        
        // 4. 媒体方本地比对交集
        Set<String> intersection = mediaPhones.stream()
            .filter(unblindedPhones::contains)
            .collect(Collectors.toSet());
        
        // 结果：双方都不知道对方的全集，但都知道交集
    }
}
```

---
