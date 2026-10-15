> 本文件是 **07-mentorship.md** 的子文件（§5. 资源）。完整章节请回到 [index](07-mentorship.md)。

## 5. 资源
- Mentor：{P7+ 资深架构师}
- 预算：5000 元 Conference
- 时间：每周 4 小时学习
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**1:1 / Mentor 工具**：

- **Lattice**：1:1 + IDP + 绩效一体化。
- **15Five**：反馈 + OKR + 1:1。
- **Culture Amp**：敬业度 + 1:1。

**学习平台**：

- **LinkedIn Learning**：7000+ 课程。
- **Degreed**：技能图谱 + 学习。
- **极客时间**：国内技术学习。
- **网易云课堂 / 慕课**：国内大学课程。

**AI 时代工具（2024-2025）**：

- **Lattice AI**：AI 辅助 1:1、IDP。
- **Humu**：AI 驱动的反馈。
- **ChatGPT Enterprise / Claude for HR**：AI Mentor 试点。
- **Eightfold**：Skills Graph + IDP 推荐。
- **Gloat**：内部人才市场 + AI 辅导。

### 4.4 代码 / 示例

**示例 1：AI 辅助 IDP 生成 Prompt**

```python
IDP_GENERATION_PROMPT = """
你是资深数据架构师 Mentor。请基于以下信息为 Mentee 生成 IDP：

Mentee 信息：
- 当前职级：P6
- 目标职级：P7（12 个月内）
- 技术栈：数据仓库（5 年）、Python（5 年）
- 已掌握：SQL、Hive、Spark
- 未掌握：RAG、向量库、LLM 微调
- 项目经验：3 个大型数据管道项目
- 软素质：协作良好、文档能力强
- 目标方向：AI 时代数据架构师

P7 要求：
- 技术深度：知识图谱 / RAG / 向量库 至少精通 1 个
- 系统设计：跨模块、跨团队影响
- 业务理解：理解业务、推动业务

输出：
1. Top 3 关键差距
2. 6 个月行动项（含具体项目、课程、书籍）
3. 12 个月里程碑
4. 风险与对策
"""
```

**示例 2：AI 辅助 1:1 总结 Prompt**

```python
ONEONONE_SUMMARY_PROMPT = """
你是资深 Mentor。请基于以下 1:1 记录，生成结构化总结。

1:1 记录：
{one_on_one_notes}

输出：
1. 本次 1:1 关键讨论（3-5 条）
2. Mentee 成长卡点
3. Action Items（负责人 + 截止日期）
4. 需要跟进的事项
5. 下次 1:1 议程建议
"""
```

---
