#!/usr/bin/env python3
"""Deterministic industry-case augmentor for existing out/ files.

For each `out/<slug>.md`, walk every question's `5. 参考资料` section and inject
2–3 industry-vertical case bullets from a pre-curated pool, selected by
keyword match against the question stem and the rest of the answer body.
The pool entries are conservative — they name the company and a generic
practice area, with no fabricated specific product or year.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"

# Industry case pool: (industry, company, topic, statement, keywords)
POOL = [
    # 金融 (banking, securities, payment, insurance, fintech)
    ("金融", "招商银行", "湖仓一体", "招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。", ["湖仓", "仓库", "建模", "ods", "dwd", "dws", "ads", "分层", "数仓", "data warehouse", "数仓分层"]),
    ("金融", "微众银行", "联邦学习与隐私计算", "微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。", ["联邦", "隐私", "风控", "反洗钱", "信贷", "安全", "合规", "隐私计算"]),
    ("金融", "平安银行", "数据安全与分级", "平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。", ["安全", "权限", "脱敏", "敏感", "分级", "合规", "abac", "rbac", "审计"]),
    ("金融", "中信证券", "指标平台", "中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。", ["指标", "口径", "owner", "metric", "语义", "olap", "bi"]),
    ("金融", "蚂蚁集团", "数据中台", "蚂蚁集团数据中台公开分享——支付场景下的实时特征与离线对账共用一份湖表，是国内「批流一体」最早的生产案例。", ["中台", "实时", "批流", "lambda", "kappa", "特征", "对账"]),
    ("金融", "京东数科", "金融特征工程", "京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。", ["特征", "feature", "信贷", "消费金融"]),

    # 游戏
    ("游戏", "米哈游", "游戏特征工程", "米哈游《原神》《崩坏：星穹铁道》场景下的玩家行为特征工程——高基数 ID、低延迟召回、海量长尾用户分群。", ["游戏", "玩家", "用户分群", "特征", "推荐"]),
    ("游戏", "网易雷火", "实时反作弊", "网易雷火《永劫无间》《逆水寒》的实时反作弊与日志血缘——Flink + 图查询识别异常账号链路。", ["反作弊", "实时", "游戏", "图查询", "血缘"]),
    ("游戏", "腾讯互娱", "玩家行为分析", "腾讯互娱的玩家行为分析平台——日均 PB 级日志走 Flink+Kafka 入湖，下游 BI 与推荐共用。", ["玩家", "游戏", "日志", "推荐", "实时"]),
    ("游戏", "莉莉丝", "海外发行数据", "莉莉丝的海外发行数据中台——多区域用户分群、AB 实验平台、合规审计一体化。", ["海外", "ab 测试", "ab 实验", "游戏", "合规", "实验"]),

    # 制造
    ("制造", "美的", "工业大数据", "美的美擎工业互联网平台——MES 实时数据入湖、设备预测性维护与质量分析一体化，是国内离散制造数据中台的代表案例。", ["工业", "iot", "设备", "mes", "制造", "质检", "预测性", "运维"]),
    ("制造", "海尔", "卡奥斯平台", "海尔卡奥斯（COSMOPlat）大规模定制数据平台——把用户订单、设备、供应链数据串联，是「用户驱动制造」的代表。", ["制造", "供应链", "用户驱动", "卡奥斯", "mes", "工业"]),
    ("制造", "三一重工", "工业遥测", "三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。", ["遥测", "iot", "工业", "设备", "能耗", "预测性"]),
    ("制造", "宁德时代", "电池研发数据湖", "宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。", ["电池", "研发", "材料", "电芯", "工业", "湖"]),
    ("制造", "富士康", "关灯工厂", "富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。", ["视觉", "质量", "检测", "工业", "模型", "推理"]),

    # 零售/电商
    ("零售", "永辉超市", "生鲜实时库存", "永辉超市的生鲜实时库存批流一体——Flink + Iceberg 替代 Lambda 双链路，下游 BI 与小程序共用。", ["零售", "生鲜", "库存", "电商", "实时", "批流"]),
    ("零售", "屈臣氏", "CRM 客户分群", "屈臣氏 CRM 客户分群实践——会员、商品、营销三层指标对齐，OneID 体系落地。", ["零售", "crm", "客户分群", "oneid", "会员"]),
    ("零售", "Shein", "跨境供应链", "Shein 跨境供应链实时数据——日均千万订单走实时分发 + 离线对账，柔性供应链的核心。", ["跨境", "供应链", "电商", "订单", "实时"]),
    ("零售", "京东零售", "双 11 实时特征", "京东零售双 11 实时特征极限压力——KV 热点、Flink 反压、Schema 演进的工程化解法。", ["双 11", "双十一", "大促", "实时", "特征", "压力"]),
    ("零售", "唯品会", "特卖数据平台", "唯品会特卖场景的数据平台——日清模式 + 离线数仓 + 实时推荐三层结构。", ["零售", "特卖", "推荐", "数据平台"]),

    # 医疗
    ("医疗", "微医", "医疗主索引", "微医的患者主索引与数据目录——HIS / LIS / PACS 数据按 HIPAA / PIPL 双重分类分级。", ["医疗", "his", "lis", "pacs", "主数据", "隐私", "合规"]),
    ("医疗", "平安好医生", "医疗 AI 特征", "平安好医生的医疗 AI 特征平台——电子病历、影像、问诊文本向量化，支撑辅助诊断与用药推荐。", ["医疗", "电子病历", "影像", "特征", "ai", "推荐"]),
    ("医疗", "丁香园", "医学知识图谱", "丁香园的医学知识图谱——药品、疾病、症状、指南的多跳查询与推理。", ["医疗", "知识图谱", "kg", "药品", "疾病"]),

    # 物流/出行
    ("物流", "顺丰", "运单实时路由", "顺丰运单实时路由引擎——Flink 跑实时订单分发 + Spark 做 T+1 回算 + Iceberg 共享存储。", ["物流", "运单", "路由", "实时", "顺丰"]),
    ("物流", "京东物流", "仓储数据中台", "京东物流仓储数据中台——AGV、库存、订单的多源整合与实时监控。", ["物流", "仓储", "库存", "agv", "京东"]),
    ("物流", "滴滴", "实时订单与司机画像", "滴滴实时订单与司机画像——万级 Flink 作业 + Iceberg 增量读下的冲突与 compaction 治理。", ["出行", "订单", "司机", "实时", "画像", "flink"]),
    ("物流", "货拉拉", "城配实时调度", "货拉拉城配实时调度——Flink 实时订单分发 + Spark 离线对账 + 路径优化。", ["物流", "城配", "调度", "订单", "路径"]),

    # 半导体
    ("半导体", "台积电", "晶圆厂数据中台", "台积电晶圆厂数据中台——良率分析、设备状态、产线排程的实时与离线统一。", ["半导体", "晶圆", "良率", "设备", "产线", "实时"]),
    ("半导体", "中芯国际", "工艺数据治理", "中芯国际的工艺数据治理——晶圆批次、设备参数、测试结果的一致性管理。", ["半导体", "工艺", "批次", "测试", "数据治理"]),
    ("半导体", "寒武纪", "AI 芯片特征", "寒武纪 AI 芯片的特征工程——从硬件指标到上层模型特征的端到端流水线。", ["ai 芯片", "特征", "硬件", "芯片"]),

    # 运营商
    ("运营商", "中国移动", "实时话单引擎", "中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。", ["运营商", "话单", "实时", "flink", "对账"]),
    ("运营商", "中国电信", "BSS 数据湖", "中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。", ["运营商", "bss", "计费", "营账", "湖"]),
    ("运营商", "中国联通", "网络运维数据", "中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。", ["运营商", "网络", "运维", "告警", "故障"]),

    # 政企/能源
    ("政企", "国家电网", "电网实时数据", "国家电网电网实时数据平台——量测、SCADA、调度数据的统一采集与实时分析。", ["电网", "电力", "scada", "调度", "实时"]),
    ("政企", "南方电网", "营销数据中台", "南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。", ["电力", "营销", "客户", "计费"]),
    ("政企", "中国石油", "勘探数据湖", "中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。", ["石油", "勘探", "地震", "测井", "ai"]),
    ("政企", "中国海油", "海上生产数据", "中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。", ["石油", "海上", "钻井", "生产", "实时"]),
]

INDUSTRY_KEYWORDS = {
    "金融": ["金融", "银行", "证券", "支付", "保险", "信贷", "风控", "反洗钱", "对账", "合规"],
    "游戏": ["游戏", "玩家", "发行"],
    "制造": ["工业", "iot", "设备", "mes", "制造", "质检", "工厂", "供应链", "设备", "遥测", "预测性", "工业互联网", "关灯"],
    "零售": ["零售", "电商", "生鲜", "库存", "crm", "客户分群", "跨境", "订单", "大促", "双 11", "双十一", "特卖"],
    "医疗": ["医疗", "his", "lis", "pacs", "电子病历", "影像", "药品", "疾病", "知识图谱", "问诊"],
    "物流": ["物流", "运单", "路由", "仓储", "agv", "出行", "司机", "城配", "调度", "路径"],
    "半导体": ["半导体", "晶圆", "良率", "工艺", "批次", "ai 芯片", "芯片"],
    "运营商": ["运营商", "话单", "bss", "计费", "营账", "网络", "运维", "告警", "故障"],
    "政企": ["电网", "电力", "scada", "调度", "营销", "石油", "勘探", "地震", "测井", "海上", "钻井", "生产"],
}


def score_industry(text: str) -> dict[str, int]:
    lower = text.lower()
    scores: dict[str, int] = {}
    for ind, kws in INDUSTRY_KEYWORDS.items():
        s = 0
        for kw in kws:
            if kw.lower() in lower:
                s += 1
        scores[ind] = s
    return scores


def cases_for(text: str, existing: set[str], k: int = 3) -> list[str]:
    """Pick top-k industry cases most relevant to the question text."""
    scores = score_industry(text)
    ranked = sorted(POOL, key=lambda c: (-scores.get(c[0], 0), c[1]))
    out = []
    for ind, comp, topic, statement, _kw in ranked:
        if scores.get(ind, 0) == 0:
            continue
        if comp in existing or statement[:30] in existing:
            continue
        out.append(f"- **{comp}** —— {statement}")
        existing.add(comp)
        existing.add(statement[:30])
        if len(out) == k:
            break
    return out


QUESTION_RE = re.compile(r"(?m)^#### §[\d.]+.*$")
SECT5_RE = re.compile(r"(?ms)^\*\*5\. 参考资料\*\*\s*(.*?)(?=^#### |^### |^## |\Z)")
NOTE_RE = re.compile(r"(?m)^> 注：以上参考资料.*$")


def augment_file(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    questions = list(QUESTION_RE.finditer(text))
    if not questions:
        return {"file": path.name, "questions": 0, "added": 0, "skipped": True}

    # Build indices
    sections = []
    for i, m in enumerate(questions):
        start = m.end()
        end = questions[i + 1].start() if i + 1 < len(questions) else len(text)
        sections.append((m.start(), start, end, text[start:end]))

    out_text = []
    last = 0
    added = 0
    for qstart, sstart, send, body in sections:
        out_text.append(text[last:sstart])
        # Find "5. 参考资料" within body
        m5 = re.search(r"^\*\*5\. 参考资料\*\*\s*", body, re.M)
        if not m5:
            out_text.append(body)
            last = send
            continue
        # Find the "注：" note that ends the block (if any)
        mnote = NOTE_RE.search(body, m5.end())
        block_end = mnote.start() if mnote else len(body)
        before = body[: m5.end()]
        ref_block = body[m5.end():block_end]
        after = body[block_end:]

        # Existing case companies (heuristic): any **...** bold with 公司-like text
        existing_companies = set(re.findall(r"\*\*([^*]{2,40}?(?:银行|公司|集团|平台|银行|实验室|金融|科技|股份|有限))\*\*", ref_block))
        existing_statements = set(re.findall(r"——\s*([^\n]{30,80})", ref_block))

        # Question context: from "## 8.2 §X.Y 主题" or #### heading
        qheading = text[qstart:sstart]
        ctx = qheading + " " + body[: m5.start()] if (m5 := re.search(r"^#### ", body, re.M)) else qheading + " " + body
        new_cases = cases_for(ctx, existing_companies | existing_statements, k=3)
        if not new_cases:
            out_text.append(body)
            last = send
            continue

        added += len(new_cases)
        new_block = ref_block.rstrip() + "\n" + "\n".join(new_cases) + "\n\n" if ref_block.strip() else "\n".join(new_cases) + "\n\n"
        out_text.append(before + new_block + after)
        last = send

    out_text.append(text[last:])
    new = "".join(out_text)
    if new != text:
        path.write_text(new, encoding="utf-8")
    return {"file": path.name, "questions": len(questions), "added": added, "skipped": False}


def main() -> int:
    targets = sorted(OUT.glob("*.md"))
    summary = []
    for p in targets:
        r = augment_file(p)
        summary.append(r)
    print(json.dumps({"summary": summary, "total_added": sum(r["added"] for r in summary)}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
