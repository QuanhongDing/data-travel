> 本文件是 **02-classification.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](02-classification.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：LLM 作为通用分类器（LLM-as-Classifier）**

GPT-4 / Claude 等大模型在零样本分类任务上已达到或超过专用分类器。LLM 的优势：

- 无需训练数据（Zero-shot）。
- 可处理长文本（128K tokens 以上）。
- 具备世界知识（如"美联储加息"自然归类为"财经"）。
- 可解释（输出分类理由）。

**典型应用**：

- 内容审核（敏感词、违规内容、政治敏感）。
- 意图识别（智能客服、Agent 路由）。
- 标签生成（无标签数据自动打标）。
- 长尾类目（训练数据不足时的 fallback）。

**工程模式**：

```python
# 模式 1：纯 Prompt
prompt = f"请将以下新闻分类为 {CLASSES} 中的一个：{news}"

# 模式 2：Few-shot Prompt
prompt = f"""示例：
- "苹果发布新手机" → 科技
- "美联储宣布加息" → 财经
现在请分类：{news}"""

# 模式 3：Function Calling（结构化输出）
tools = [{"type": "function", "function": {...}}]
response = client.chat.completions.create(..., tools=tools, tool_choice=...)

# 模式 4：Self-Consistency（多次投票）
results = [classify(news) for _ in range(5)]
final = majority_vote(results)
```

**方向 2：LLM Embedding + 轻量分类头**

用 LLM 提 embedding，接 LR / MLP 分类头。优势：

- 比 fine-tune LLM 便宜 100 倍。
- 推理延迟低（embedding 可预计算）。
- 效果接近 fine-tune（小数据集）。

代表工作：**Sentence-BERT + LogReg**、**OpenAI text-embedding-3 + LogReg**。

**方向 3：SetFit / Adapter 等参数高效微调**

- **SetFit**（2022）——Sentence Transformer + 对比学习，8 个样本就能训练出 SOTA 文本分类器。
- **LoRA / QLoRA**（2021 / 2023）——低秩适配，10MB 级别参数微调。
- **Adapter**——Houlsby et al. 2019，模块化微调。

**方向 4：多模态分类（CLIP / GPT-4V）**

- **CLIP**（2021）——图像 + 文本对齐，零样本图像分类。
- **BLIP-2 / Flamingo**（2022-2023）——多模态问答与分类。
- **GPT-4V / Claude 3.5 Vision / Gemini 1.5 Pro Vision**（2023-2024）——多模态 LLM 直接做图像 / 视频分类。
- **LLaVA / Qwen-VL**（2024）——开源多模态 LLM。

**方向 5：Agent 路由与意图分类**

智能体平台中，分类任务是"路由层"核心：

```python
# Agent 路由示例
def route_query(query: str) -> str:
    intent = classify_intent(query)  # LLM 分类
    if intent == "search":
        return search_agent.run(query)
    elif intent == "code":
        return code_agent.run(query)
    elif intent == "chat":
        return chat_agent.run(query)
```

这是 LLM 时代分类任务最重要的应用场景之一。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**传统分类 vs RAG 增强分类**：

- **传统分类**：输入特征 → 模型 → 标签。
- **RAG 增强分类**：输入特征 + 检索外部知识 → 模型 → 标签。

RAG 增强的优势：

- 解决"标签定义模糊"问题（如"科技 vs AI"边界）。
- 解决"知识陈旧"问题（LLM 训练截止后新增类目）。
- 解决"长尾类目"问题（用检索补充类目描述）。

**典型架构**：

```
用户问题
   ↓
[1. 向量检索] → 类目描述库（top-k）
   ↓
[2. LLM Prompt] = 指令 + 类目描述 + 用户问题
   ↓
[3. LLM 分类输出]
```

**应用案例**：

- **内容平台**：RAG 增强的标签分类，新类目无需重新训练。
- **客服**：RAG 增强的意图识别，检索历史相似工单。
- **Agent 平台**：RAG 增强的 Tool 路由，检索 Tool 描述库。

**GraphRAG 与分类**：

- 用本体（Ontology）定义标签层次。
- 用知识图谱（KG）补充实体关系。
- 用 LLM 做最终分类决策。

这是 2025 年"分类任务 + 知识增强"的前沿方向。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **TabPFN**（Hollmann et al., Nature 2023）——表格数据的 Prior-data Fitted Network，小样本分类无需训练。
- **TabPFN v2**（2024）——扩展到更大数据集，逼近 XGBoost。
- **WhyTab**（2024）——可解释表格分类。
- **SetFit 2.0**（2024）——支持多模态少样本分类。
- **LLM-as-Classifier Benchmark**（2024）——多个研究对比 GPT-4 与专用分类器。
- **Foundation Models for Tabular Data**（2024-2025）——TabPFN、TabICL、TF-MLP 等表格基础模型涌现。
- **Multimodal Foundation Models**（2024）——CLIP、DINOv2、SAM 在图像分类 SOTA。
- **Efficient Fine-tuning**（2024）——LoRA / QLoRA / Adapter 让 LLM 分类微调成本下降 90%+。

**工业进展**：

- **OpenAI GPT-4o / GPT-4V**（2024）——多模态分类，工业级 API。
- **Anthropic Claude 3.5 Sonnet**（2024）——结构化输出 + Tool Use，分类任务 SOTA。
- **Google Gemini 1.5 Pro**（2024）——200 万 tokens 上下文，长文本分类 SOTA。
- **Meta Llama 3.1 / 3.2**（2024）——开源 LLM，本地部署分类。
- **阿里 Qwen2.5 / Qwen-VL**（2024）——中文 + 多模态 SOTA。
- **智谱 GLM-4**（2024）——国产 LLM，分类能力强。
- **百度 ERNIE 4.0**（2024）——中文理解 SOTA。
- **字节豆包**（2024）——多模态 LLM。
- **DeepSeek-V2 / V3**（2024）——开源 + 高性价比。
- **HuggingFace Inference API**——托管的 BERT / RoBERTa / CLIP 推理。
- **AWS Bedrock**（2024）——托管 Claude / Llama / Mistral 推理。
- **阿里云百炼 / 腾讯混元**（2024）——国产 LLM 平台。

**企业落地案例**：

- **字节跳动**：用 XGBoost + LLM 双层分类架构，CTR 提升 5%。
- **阿里巴巴**：用 DeepFM + DIN 多任务分类，广告收入提升 8%。
- **美团**：用 LLM 做商家标签自动分类，标注效率提升 10 倍。
- **腾讯**：用 BERT + LLM 双层做内容审核，召回率提升 15%。
- **蚂蚁集团**：用 LLM 做风控标签自动化，运营成本下降 40%。

### 5.4 未来 3-5 年趋势

1. **「LLM + 专用分类器」混合架构成为标准**：高频场景用专用模型，长尾场景用 LLM，路由分类器统一调度。
2. **「基础模型化」（Foundation Models for Everything）**：TabPFN、CLIP 等基础模型扩展到更多模态，分类任务不再需要"专门训练"。
3. **「多模态统一分类」**：文本 + 图像 + 语音 + 视频统一表征，统一分类。
4. **「Agent-driven 分类」**：智能体主动发现类目，主动标注，主动训练，主动部署——人类只需定义目标。
5. **「自适应分类」（Adaptive Classification）**：模型根据输入难度自适应选择推理深度（快思考 vs 慢思考）。
6. **「隐私保护分类」**：联邦学习 + 差分隐私 + 同态加密，让分类任务在保护隐私的前提下跨组织协作。
7. **「可解释分类」**：SHAP / LIME / Anchor 等可解释 AI 工具成为分类模型的标配，特别是金融、医疗、政务领域。
8. **「小模型复兴」**：小模型（< 10B 参数）+ 强数据 + 好 prompt 工程，部分场景超越大模型。

---
