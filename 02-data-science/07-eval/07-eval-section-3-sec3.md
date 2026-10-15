> 本文件是 **07-eval.md** 的子文件（§3. 设计模式与范式）。完整章节请回到 [index](07-eval.md)。

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：离线 → 在线两阶段（Offline-Online Pipeline）**

- 离线评估 → 候选模型筛选。
- A/B 测试 → 真实流量验证。
- 因果推断 → 最终归因。
- 适合：标准 ML 上线流程。

**模式 2：Interleaving 加速（Interleaving-First）**

- 用 Interleaving 快速比较两个模型。
- 比 A/B 测试快 10-100 倍。
- 适合：搜索 / 推荐排序。

**模式 3：多臂老虎机（Bandit）**

- 用 Bandit 做实时探索-利用。
- 适合：内容推荐 / 营销 / 动态定价。
- 优势：实时、最小化损失。

**模式 4：方差缩减（CUPED）**

- 用 CUPED 缩减 A/B 测试方差，提升灵敏度。
- 适合：流量小的实验。

**模式 5：因果推断（Caual Inference）**

- 不能做 A/B 测试时，用因果推断（PSM / DID / DML）。
- 适合：政策评估、营销归因、不能随机化的场景。

**模式 6：LLM 评估（LLM-as-Judge + Human Eval）**

- AI-as-Judge + 人类评估。
- 适合：ChatGPT / Claude 等对话模型。

**模式 7：Agent 评估（WebArena / SWE-bench）**

- Agent 在真实环境完成任务评估。
- 适合：AI Agent 平台。

**模式 8：流量分层（Layered Experimentation）**

- 不同层做不同实验，互不干扰。
- 适合：大型公司多团队并行实验。
- 工具：Google Overlapping Experiment、字节 ABT、阿里 POE。

**模式 9：自动评估（Auto-Evaluation）**

- 离线指标 + 在线 A/B + 因果推断 + LLM-as-Judge 自动化。
- 适合：CI/CD 流水线。

**模式 10：Holdout + 长期监控（Holdout）**

- 留 5-10% 流量做长期监控。
- 适合：避免新奇效应误判。

### 3.2 适用场景决策表

| 业务特征 | 推荐评估方法 | 理由 |
| --- | --- | --- |
| 标准 ML 模型上线 | 离线 + A/B 测试 + 业务指标 | 标准流程 |
| 流量小、需快速决策 | Interleaving / CUPED | 加速 |
| 实时个性化 | Contextual Bandit | 实时 |
| 不能随机化 | 因果推断（PSM / DID / DML） | 准实验 |
| 政策效果 | DID / Synthetic Control | 政策评估 |
| 营销归因 | Shapley Value / Data-Driven Attribution | 多触点 |
| LLM 对话 | AlpacaEval / Arena / AI-as-Judge | LLM 评估 |
| LLM 推理（数学 / 代码） | PRM / Pass@k | 推理评估 |
| AI Agent | WebArena / SWE-bench | Agent 评估 |
| 搜索排序 | Interleaving + NDCG | 搜索评估 |
| 推荐排序 | A/B 测试 + CTR / GMV + GAUC | 推荐评估 |
| 长期效果 | Holdout + 长期监控 | 避免新奇效应 |
| 多团队并行 | 流量分层（Layered） | 互不干扰 |
| 多指标 | FDR / Bonferroni | 多重比较 |
| LLM-as-Judge 校准 | Human Eval + 一致性 | 校准 LLM Judge |
| 公平性 | 反事实公平性评估 | 公平性 |

### 3.3 反模式与陷阱

1. **「只看离线 AUC」反模式**：AUC 0.85 → 0.86，业务完全没动。**A/B 测试是唯一标尺**。
2. **「A/B 测试时间太短」反模式**：3 天看结果，被新奇效应骗。**至少覆盖 1-2 个完整周期**。
3. **「忽视 SRM」反模式**：流量分配偏离预期，结论错误。**必须每天检查 SRM**。
4. **「多重比较不管」反模式**：测 10 个指标，p=0.04 看起来显著，实际是假阳性。**用 Bonferroni / FDR 校正**。
5. **「样本量不够硬上」反模式**：流量只有 1000，硬要做 A/B，统计功效不够。**先计算最小样本量**。
6. **「把 Interleaving 当 A/B」反模式**：Interleaving 只适合搜索 / 推荐排序，不能替代 A/B。**Interleaving + A/B 组合**。
7. **「新奇效应误判」反模式**：上线第 1 周效果好，长期效果下降。**必须 Holdout 长期监控**。
8. **「相关 = 因果」反模式**：投放多时销量好，因果方向可能反过来。**用 RCT / IV / DML 做因果**。
9. **「LLM-as-Judge 不校准」反模式**：GPT-4 评估波动大，不能直接用。**用 Human Eval 校准 + 一致性**。
10. **「Agent 评估只看最终结果」反模式**：Agent 多步决策失败可能是中间某步错。**必须过程评估**。
11. **「无 Holdout」反模式**：所有流量都在做实验，没有对照组。**必须留 5-10% Holdout**。
12. **「LLM 评估无 Golden Set」反模式**：LLM 输出没有标准答案，随机评估。**必须建立 Golden Set + 持续更新**。

---
