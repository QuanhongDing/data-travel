> 本文件是 **01-multimodal-ai.md** 的子文件（§5. 前沿演进（AI 时代））。完整章节请回到 [index](01-multimodal-ai.md)。

## 5. 前沿演进（AI 时代）

### 5.1 LLM / Agent 时代的演进方向

**方向 1：原生多模态大模型成为主流**

GPT-4o / Gemini 1.5 / 2.0 等「原生多模态」模型成为主流，单一 Transformer 处理所有模态：

- 优点：低延迟、强融合、通用智能。
- 缺点：训练成本高、技术门槛高。
- 代表：GPT-4o、Gemini 1.5/2.0、Step-1V、文心 4.0 Turbo、Qwen2.5-VL、InternVL3。

**方向 2：多模态 Agent 崛起**

GPT-4o Computer Use、Claude Computer Use、Gemini 2.0 Agent 让 AI 能「看屏幕 + 控制电脑 + 做任务」：

- 通用 AI 助手：让 AI 直接操作电脑完成任务。
- 行业智能体：让 AI 在金融 / 医疗 / 制造行业直接执行任务。
- 具身智能：让 AI 操控机器人（Figure 01、Tesla Optimus、Unitree H1）。

代表：OpenAI Operator（2025）、Anthropic Computer Use、Google Gemini 2.0 Agent。

**方向 3：多模态世界模型**

Sora / Veo / Genie 2 等视频生成模型推动「世界模型」研究：

- 自动驾驶：Tesla FSD V12、Wayve GAIA-1。
- 机器人：RT-2（Google Robotics Transformer）。
- 视频内容生成：Sora / Veo / 可灵 / Vidu。

代表：OpenAI Sora、Google Veo 2、DeepMind Genie 2、可灵 1.5。

**方向 4：多模态 RAG**

检索增强生成扩展到多模态：

- **以文搜图 / 以文搜视频 / 以文搜音频**。
- **多模态重排序**：CLIP Score + Cross-Modal Reranker。
- **多模态生成**：LLM 接收图像 + 文本，生成多模态答案。

代表：LangChain Multi-modal RAG、LlamaIndex Multi-modal RAG、VideoRAG、多模态 GraphRAG。

**方向 5：具身智能（Embodied AI）**

让 AI 在物理世界行动：

- **机器人**：Figure 01、1X Neo、Tesla Optimus、Unitree H1、Apptronik Apollo。
- **自动驾驶**：Tesla FSD、Waymo、Wayve。
- **机器人基础模型**：RT-2（Google Robotics Transformer）、Pi-0（Physical Intelligence）、NVIDIA GR00T。

代表：Figure AI（2024 融资 6.75 亿美元）、Physical Intelligence（2024 融资 7000 万美元）、1X Technologies。

**方向 6：多模态生成工业化**

图像 / 视频 / 音频生成进入工业化：

- 图像生成：Midjourney V6/V7、Flux、DALL-E 3、Stable Diffusion 3.5、Recraft V3、Ideogram 2.0。
- 视频生成：Sora、Veo 2、可灵 1.5、Vidu、HunyuanVideo、Wan 2.1。
- 音频生成：Suno V4、Udio、VALL-E 2、CosyVoice。
- 3D 生成：Meshy、Tripo3D、CSM、Rodin。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**多模态 RAG 的核心架构**：

```
用户多模态输入
   ↓
[多模态 Embedding]
   ↓
[多模态向量检索] + [文本检索] + [元数据过滤]
   ↓
[候选融合]
   ↓
[多模态重排序（Rerank）]
   ↓
[LLM 组织多模态答案]
```

**多模态 RAG 与 GraphRAG 的结合**：

- **多模态知识图谱**：实体 + 关系 + 多模态属性（图像 / 视频 / 音频）。
- **多模态实体识别**：从图像 / 文档识别实体。
- **多模态关系抽取**：从图像 / 视频抽取关系。
- **多模态 GraphRAG**：用 GraphRAG 增强多模态 RAG。

代表项目：MMKG（Multi-Modal Knowledge Graph）、MMKGRAG、亚马逊 Product Graph。

**多模态 RAG 与 Agent 的结合**：

- **多模态感知 Agent**：Agent 接收图像 / 视频 / 音频作为输入。
- **多模态检索 Agent**：Agent 调用多模态检索工具。
- **多模态生成 Agent**：Agent 输出多模态内容（图像 / 视频 / 文档）。

代表项目：LangGraph + 多模态、AutoGen + 多模态、Claude Computer Use、GPT-4o Computer Use。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **GPT-4V / GPT-4o**：2024 年 OpenAI 多模态大模型，2024-09 GPT-4o Voice 突破语音。
- **Gemini 1.5 / 2.0**：2024-02 Gemini 1.5、2024-12 Gemini 2.0，原生多模态、长上下文（10M tokens）。
- **Claude 3.5 Sonnet / 3.7 Sonnet / 4 Sonnet**：2024-10 Claude 3.5 Sonnet、2025-02 Claude 3.7、2025-06 Claude 4，强调视觉 + Tool Use + Coding。
- **Sora**（OpenAI，2024-02 发布，2024-12 公开发布）——视频生成 DiT 架构。
- **Veo 2**（Google，2024-12）——视频生成 SOTA。
- **GPT-4o Computer Use / Claude Computer Use**（2024-10）——AI 控制电脑。
- **Qwen2-VL / Qwen2.5-VL**（阿里，2024-2025）——开源 VLM 标杆。
- **InternVL2 / InternVL2.5 / InternVL3**（上海 AI Lab，2024-2025）——开源 VLM SOTA。
- **Molmo**（Allen AI，2024-09）——开源 VLM + 开放数据集（Pixels 1M）。
- **LLaVA-OneVision**（2024）——统一开源多模态模型。
- **HunyuanVideo**（腾讯混元，2024-12）——开源视频生成。
- **Wan 2.1**（阿里通义，2025）——开源视频生成。
- **CogVideoX**（智谱，2024）——开源视频生成。
- **ImageBind**（Meta，2023）——6 模态对齐。
- **Anthropic MCP（Model Context Protocol）**（2024-11）——AI Agent 数据访问协议。

**工业进展（2024-2025）**：

- **OpenAI Operator**（2025-01）——AI 自主浏览器操作。
- **Figure 02**（Figure AI，2024-08）——人形机器人。
- **Tesla Optimus Gen 2**（2024-12）——人形机器人。
- **1X Neo**（1X Technologies，2024）——家用人形机器人。
- **Apptronik Apollo**（2024）——通用人形机器人。
- **Unitree H1 / G1**（宇树科技，2024）——国产人形机器人。
- **智元机器人 GO-1**（2024）——国产人形机器人。
- **Galbot（银河通用）**——国产人形机器人。
- **物理智能 Pi-0**（Physical Intelligence，2024）——机器人基础模型。
- **NVIDIA GR00T**（2024）——通用机器人基础模型。
- **Midjourney V6.1 / V7**（2024-2025）——图像生成 SOTA。
- **Recraft V3**（2024-11）——图像生成 SOTA（设计）。
- **Ideogram 2.0**（2024）——图像生成（文字渲染）。
- **Suno V4**（2024-11）——音乐生成 SOTA。
- **Udio V1.5**（2024）——音乐生成。
- **ElevenLabs Voice Design**（2024）——语音克隆。
- **Cartesia Sonic**（2024）——实时语音生成。

### 5.4 未来 3-5 年趋势

1. **「原生多模态」成为大模型事实标准**：单一 Transformer 处理所有模态，原生融合。
3. **「多模态 Agent」成为通用 AI 入口**：GPT-4o Computer Use、Claude Computer Use、Gemini 2.0 Agent 等多模态 Agent 替代传统 GUI 交互。
3. **「世界模型」成为 AGI 核心**：Sora / Veo / Genie 2 等世界模型推动 AGI 研究，自动驾驶 / 机器人 / 视频生成成为应用场景。
4. **「具身智能」产业化**：Figure 02 / Tesla Optimus / Unitree H1 等机器人产业化，人形机器人进入家庭 / 工厂。
5. **「多模态 RAG」成为 RAG 主流**：从文本 RAG 升级为多模态 RAG。
6. **「多模态治理」成为合规刚需**：欧盟 AI Act、中国《生成式 AI 服务管理暂行办法》要求多模态内容合规。
7. **「行业多模态」主流化**：医疗 VLM（医疗影像）、工业 VLM（工业质检）、金融 VLM（财报理解）、政务 VLM（公文处理）成为行业标配。

---
