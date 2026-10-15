> 本文件是 **05-recommendation.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](05-recommendation.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：LLM 直接做推荐**

LLM 用 Prompt + 结构化输出做推荐：

```python
# Prompt
prompt = """用户画像：25-30 岁女性，时尚爱好者，近 7 天浏览连衣裙 3 次。
候选商品（10 个）：
1. 商品 A：连衣裙 ¥299 夏季碎花
2. 商品 B：连衣裙 ¥199 简约通勤
...
请按用户兴趣排序，前 5 个推荐："""

response = gpt4(prompt)  # 输出排序后的推荐
```

**代表工作**：

- **GPT4Rec**（2023）——LLM 生成推荐列表。
- **ChatRec**（2023）——对话式推荐。
- **InstructRec**（2023）——指令推荐。
- **MoCa**（2024）——LLM + 协同过滤。

**方向 2：LLM Embedding 推荐**

LLM 提 Embedding + 传统推荐架构：

- Sentence-BERT / BGE / OpenAI Embedding。
- 双塔召回 + 精排。
- 优势：跨语言、语义理解、零样本。

**方向 3：生成式推荐（Generative Recommendation）**

不再排序候选，直接生成 Item ID：

- **TIGER**（Google 2023）——Semantic ID + Transformer 生成。
- **LC-Rec**（2024）——LLM 协同过滤。
- **CFGen**（2024）——协同过滤生成。
- **IDGenRec**（2024）——ID 生成。

**架构**：

```
[用户历史 Item ID] → Semantic ID → Transformer → 预测下一 Item ID
```

**优势**：与 LLM 架构对齐，可与文本生成融合。

**方向 4：多模态推荐**

整合文本 + 图像 + 视频 Embedding：

- **CLIP4Rec**（2024）——CLIP 推荐。
- **MMGCN**（2019）——多模态图卷积。
- **VBPR**（2016）——视觉推荐。

**方向 5：Agent 推荐**

Agent 平台中，Tool / Action 推荐：

- **AgentRec**（2024）——Agent 决策推荐。
- **Tool 推荐**——根据任务推荐 Tool。
- **Action 推荐**——根据状态推荐 Action。

**方向 6：强化学习推荐**

长期价值优化：

- **Bandit 推荐**——探索-利用。
- **DQN 推荐**——长期累积价值。
- **PPO 推荐**——个性化策略。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**推荐 + RAG**：

- 用户 Query → 向量检索 Item Embedding → LLM 生成推荐解释。
- RAG 增强的可解释推荐。

**推荐 + 向量库**：

- 双塔召回 = 用户 Embedding × 物品 Embedding（向量检索）。
- 向量库（Faiss / Milvus）支撑亿级 Item 检索。

**推荐 + GraphRAG**：

- 用户 - 物品 - 属性构成知识图谱。
- GraphRAG 用多跳推理做"为什么推荐"。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **TIGER**（Google RecSys 2023）——生成式检索推荐。
- **LC-Rec**（2024）——LLM 协同过滤。
- **P5**（2022）——推荐基础模型。
- **MoCa**（2024）——LLM + 协同过滤。
- **InstructRec**（2023）——指令推荐。
- **CFGen / IDGenRec**（2024）——生成式推荐。
- **AgentRec**（2024）——Agent 推荐。
- **CLIP4Rec**（2024）——CLIP 推荐。
- **LLM4Rec**（2024 综合）——LLM 推荐综述。

**工业进展**：

- **Google Gemini + YouTube**（2024）——LLM 推荐 YouTube。
- **Amazon Rufus**（2024）——LLM 购物助手推荐。
- **字节 ByteRec + 豆包**（2024）——LLM 推荐。
- **阿里巴巴通义 + 推荐**（2024）——LLM 推荐电商。
- **腾讯混元 + 推荐**（2024）——LLM 推荐。
- **Meta Llama + 推荐**（2024）——开源 LLM 推荐。
- **HuggingFace Transformers Rec**（2024）——推荐模型库。
- **EasyRec 2.0**（阿里 2024）——支持 LLM 推荐。

**企业落地案例**：

- **字节跳动**：用 DIN + LLM Embedding 做短视频推荐，CTR +10%。
- **阿里巴巴**：用 MMoE + PLE + ESSM 做电商推荐，GMV +15%。
- **京东**：用 DeepFM + LLM 推荐做电商，转化率 +12%。
- **美团**：用双塔 + DIN 做外卖推荐，订单 +8%。
- **腾讯**：用 SASRec + Bandit 做视频推荐，时长 +10%。
- **Netflix**：用 BERT4Rec 做内容推荐，留存 +5%。
- **Amazon Rufus**（2024）：LLM 购物助手推荐，转化率 +8%。

### 5.4 未来 3-5 年趋势

1. **「生成式推荐成为主流」**：TIGER / LC-Rec / CFGen 引领，与 LLM 架构对齐。
2. **「LLM 推荐标准化」**：LLM 直接推荐 + LLM Embedding 推荐成为标配。
3. **「多模态推荐普及」**：CLIP / ViT / BERT 融合，文本 + 图像 + 视频统一推荐。
4. **「Agent 推荐」**：Agent 平台核心能力，Tool / Action 推荐成为基础设施。
5. **「强化学习推荐工业化」**：Bandit / RL 推荐在长期价值优化中普及。
6. **「联邦推荐」**：跨企业协作，隐私保护 + 数据不出域。
7. **「基础模型推荐」**：RecSys 预训练基础模型（P5 / OpenRec）通用化。
8. **「实时推荐」**：毫秒级特征 + 实时模型更新，秒级反馈。

---
