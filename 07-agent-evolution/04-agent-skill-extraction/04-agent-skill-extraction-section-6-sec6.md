> 本文件是 **04-agent-skill-extraction.md** 的子文件（§6. 落地实践）。完整章节请回到 [index](04-agent-skill-extraction.md)。

## 6. 落地实践

### 6.1 真实案例

- Cursor Composer
- Devin（Cognition Labs）
- Cognition Labs（自研平台）
- Anthropic（自我改进）
- Auto-Skill（学术 + 工业）

各案例展开：

#### 案例 1：Cursor Composer

定位：IDE 内的多文件编辑 Skill 编排。

Skill 提取方式：
- 用户编辑行为日志（接受 / 拒绝 / 修改）。
- 提取"常见编辑模式"作为 Skill。
- Skill 可被 Agent 调用，做多文件重构。

效果：用户接受率提升 30%+。

#### 案例 2：Devin（Cognition Labs）

定位：端到端 Coding Agent。

Skill 提取方式：
- 任务执行轨迹（Devin 的 shell / edit 操作）。
- Self-Play RL + 人工标注。
- Skill Library 包含 100+ 编程 Skill。

效果：在 SWE-bench 上 SOTA。

#### 案例 3：Cognition Labs 自研平台

定位：Cognition 内部 Agent 平台。

Skill 提取方式：
- Self-Play + 人工反馈。
- 任务级 + 步骤级 Skill。
- Skill Library 持续增长。

#### 案例 4：Anthropic 自我改进

定位：Claude 的"自我反思"能力。

Skill 提取方式：
- Constitutional AI（宪法式自我评判）。
- Self-Refine（自我修正）。
- Skill Library 内置到模型行为。

#### 案例 5：Auto-Skill（学界 + 工业）

定位：LLM 自动生成 Skill。

Skill 提取方式：
- LLM 分析任务 → 生成 Skill。
- Skill 验证 + 人工审核。
- 适用于多种业务场景。

### 6.2 踩坑与经验

- 轨迹聚类效果不好：行为日志质量差、聚类算法选错。
- LLM 抽象出幻觉 Skill：LLM 编造不存在的步骤。
- Skill 验证通过但线上失败：验证集与真实分布偏差。
- Skill 库爆炸：缺乏重要性筛选。
- Skill 冲突：多个 Skill 给出矛盾指令。
- Skill 难复用：抽象度过低或过高。
- Skill 冷启动：没有历史日志可挖。
- Skill 评估难：缺少量化指标。

更细的踩坑清单：

| 踩坑 | 表现 | 根因 | 解决 |
| --- | --- | --- | --- |
| 聚类效果差 | 同一类被切散 | 行为日志质量差 | 清洗 + 多维度 embedding |
| 幻觉 Skill | Skill 含不存在的步骤 | LLM 幻觉 | 验证集 + 人工 |
| 验证通过线上失败 | 验证集与真实分布偏差 | 验证集太小 | 真实分布验证集 |
| Skill 爆炸 | Skill 库无限增长 | 无重要性筛选 | 重要性阈值 + 合并 |
| Skill 冲突 | 矛盾指令 | 多版本管理 | 版本 + 优先级 |
| Skill 难复用 | 复用率低 | 抽象度不当 | 抽象度评估 |
| 冷启动 | 没历史 | 新业务 | Self-Play + Auto-Skill |

### 6.3 落地路径

- 0→1：收集日志 + 人工编写 Skill
- 1→10：轨迹聚类 + LLM 抽象
- 10→100：Self-Play + 自动化流水线 + 资产化

具体路径：

| 阶段 | 关键建设 | 投入 | 效果 |
| --- | --- | --- | --- |
| 0→1 | 日志采集 + 人工 Skill | 1-2 周 | 有 Skill Library |
| 1→10 | 聚类 + LLM 抽象 | 1-2 月 | 自动提取 |
| 10→100 | Self-Play + 自动化 | 半年+ | 持续自进化 |

### 6.4 ROI 评估

- 任务执行速度 +30-50%（Skill 复用）。
- 人工 Skill 编写成本降低 50-80%（自动提取）。
- 跨任务复用率 +40%。
- 回答一致性 +20%。

ROI 公式：

```
ROI = (Skill 复用节省 + 自动提取节省 + 一致性提升) / 平台成本

Skill 复用节省 = 节省 token × token 单价 × 调用次数
自动提取节省 = 人工编写工时 × 工程师时薪 × 提取数量
一致性提升 = 业务指标提升 × 业务权重
```

### 6.5 监控与告警

| 指标 | 阈值 | 告警 |
| --- | --- | --- |
| Skill 命中率 | < 80% | 提取质量差 |
| Skill 准确率 | < 85% | 验证效果差 |
| Skill 数量 | 日增 > 10% | 库爆炸 |
| Skill 平均年龄 | > 90 天 | 缺乏迭代 |
| Skill 评估耗时 | > 1h/批次 | pipeline 慢 |
| 无 Owner Skill | > 5% | 治理问题 |

### 6.6 与人类专家协作

Skill 提取不是替代人类专家，而是放大人类专家：

- **专家定义"领域骨架"**：核心 Skill 由专家定义。
- **Agent 自动"填充血肉"**：细节 Skill 由自动提取。
- **专家"审核关键"**：高风险 Skill 由专家审核。
- **持续"双向反馈"**：专家反馈驱动 Skill 迭代。

适用场景：
- 金融合规：专家定义合规 Skill，Agent 提取执行细节。
- 医疗诊断：专家定义诊断框架，Agent 提取病例细节。
- 法律咨询：专家定义法律原则，Agent 提取案例细节。

### 6.7 上线 Checklist

- [ ] 行为日志采集完整（埋点）
- [ ] 轨迹清洗 pipeline
- [ ] 聚类算法选定（HDBSCAN / Transformer）
- [ ] LLM 抽象 prompt 模板化
- [ ] Skill 验证集构建（多样化）
- [ ] Skill 命中率评估 SOP
- [ ] Skill Library 平台可用
- [ ] Skill 与 Asset Registry 联动（Ch7 §3）
- [ ] Owner / 版本 / 血缘
- [ ] 监控告警规则就绪
- [ ] 成本预算
- [ ] 人工审核机制

---
