> 本文件是 **01-multimodal-ai.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](01-multimodal-ai.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务边界与多模态场景识别**

- 圈定多模态 AI 要支撑的业务场景（文档理解 / 视觉问答 / 视频分析 / 语音转写）。
- 识别核心多模态任务（OCR / VQA / 图像描述 / 视频理解）。
- 评估数据规模、延迟要求、成本预算。
- 输出：**多模态 AI 规划书（MMP = Multimodal Plan）**。

**Step 2：模型选型与 PoC**

- 选型 VLM（GPT-4V / Claude / Gemini / Qwen-VL / InternVL / LLaVA）。
- 选型多模态 Embedding（CLIP / BGE-VL / Jina CLIP）。
- 选型语音模型（Whisper / Paraformer）。
- 选型视频模型（VideoLLaMA / Gemini Video）。
- PoC 验证关键场景效果。
- 输出：**多模态模型选型报告**。

**Step 3：多模态数据准备**

- 建立多模态数据湖（图像 / 视频 / 音频 / 文档）。
- 建立多模态预处理流水线（裁剪 / 缩放 / 抽帧 / 降噪）。
- 建立多模态 Embedding 流水线（CLIP Embedding / BGE-VL Embedding）。
- 建立多模态向量库（Milvus / Qdrant / Weaviate + 多模态 Embedding）。
- 输出：**多模态数据基础设施**。

**Step 4：模型部署与推理优化**

- 部署开源多模态 VLM（Qwen2-VL / InternVL2 / LLaVA-OneVision）。
- 部署闭源多模态 API（GPT-4o / Claude / Gemini）。
- 部署推理优化（vLLM + INT4 量化 + Continuous Batching）。
- 部署 LLM Gateway（统一路由 GPT-4o / Claude / Gemini / Qwen-VL）。
- 输出：**多模态推理服务平台**。

**Step 5：多模态 RAG 建设**

- 建立多模态 Embedding 库（CLIP / BGE-VL）。
- 建立多模态检索（向量 + 文本 + 元数据）。
- 建立多模态重排序（Reranker）。
- 建立多模态生成（LLM + 多模态输入）。
- 输出：**多模态 RAG 系统**。

**Step 6：多模态 Agent 集成**

- 建立多模态感知（VLM / 语音 / 视频）。
- 建立多模态工具调用（图像编辑 / 视频剪辑 / 文档生成）。
- 建立多模态决策（LLM + 工具）。
- 建立多模态执行（图像 / 视频 / 文档生成）。
- 输出：**多模态 Agent 平台**。

**Step 7：可观测与治理**

- 部署多模态监控（响应时间 / 准确率 / 成本）。
- 部署多模态审计（生成内容审查 / 版权审查）。
- 部署多模态合规（GDPR / 等保 / 《生成式 AI 服务管理暂行办法》）。
- 输出：**多模态治理体系**。

### 4.2 关键技术点

1. **多模态模型选型**：开源（Qwen2-VL / InternVL2 / LLaVA-OneVision / CogVLM）vs 闭源（GPT-4V / Claude / Gemini）。
2. **多模态 Embedding**：CLIP / BGE-VL / Jina CLIP / Nomic Embed Vision / Voyage Multimodal。
3. **多模态向量库**：Milvus / Qdrant / Weaviate / Pinecone + 多模态 Embedding。
4. **多模态 RAG**：检索（向量 + 文本 + 元数据）+ 重排 + 多模态生成。
5. **推理优化**：vLLM + INT4 量化 + Continuous Batching + TensorRT-LLM（针对 VLM）。
6. **LLM Gateway**：LiteLLM / OpenRouter / Portkey / 自研，统一路由 GPT-4o / Claude / Gemini / Qwen-VL。
7. **多模态工具调用**：Anthropic Claude Tool Use + 多模态、OpenAI Function Calling + 多模态。
8. **多模态文档理解**：PaddleOCR + Qwen-VL / GPT-4V / Claude / DocLLM / LayoutLMv3。
9. **视频处理**：FFmpeg（视频切片）+ VideoLLaMA / Gemini Video / 视频 Embedding。
10. **语音处理**：Whisper / Paraformer / FunASR + VALL-E 2 / VITS。
11. **3D 处理**：Open3D / PCL / 3D Gaussian Splatting。
12. **多模态 Agent**：LangGraph + 多模态、AutoGen + 多模态、Claude Computer Use、GPT-4o Computer Use。

### 4.3 工具链与平台（含 2024-2025 新工具）

**多模态 VLM（开源）**：

- **Qwen2-VL / Qwen2.5-VL**（阿里）——开源 VLM 标杆，中文优秀。
- **InternVL2 / InternVL2.5 / InternVL3**（上海 AI Lab + 商汤）——开源 VLM 性能 SOTA。
- **LLaVA-OneVision**（开源）——统一多模态模型。
- **MiniGPT-4 / MiniGPT-v2**（开源）——轻量 VLM。
- **CogVLM / CogAgent**（智谱）——中文 VLM。
- **DeepSeek-VL / DeepSeek-VL2**（深度求索）——开源 VLM。
- **Yi-VL**（零一万物）——开源 VLM。
- **Molmo**（Allen AI）——开源 VLM，数据集开放（Pixels 1M）。
- **Pixtral**（Mistral）——开源 VLM。

**多模态 VLM（闭源）**：

- **GPT-4V / GPT-4o / GPT-4o Voice**（OpenAI）——闭源多模态标杆。
- **Claude 3.5 Sonnet Vision / Claude 3.7 Sonnet Vision / Claude 4 Sonnet**（Anthropic）——闭源 VLM。
- **Gemini 1.5 Pro / Gemini 1.5 Flash / Gemini 2.0 Flash**（Google）——原生多模态。
- **Reka Core / Reka Edge**（Reka AI）——多模态模型。
- **Step-1V**（阶跃星辰）——国产多模态大模型。
- **文心一言 4.0 Turbo**（百度）——中文多模态大模型。

**多模态 Embedding**：

- **CLIP / OpenCLIP**（OpenAI / LAION）——事实标准图像-文本 Embedding。
- **BGE-VL / BGE-M3**（BAAI）——中文多模态 Embedding。
- **Jina CLIP**（Jina AI）——生产级多模态 Embedding。
- **Nomic Embed Vision**（Nomic）——多模态 Embedding。
- **Voyage Multimodal**（Voyage AI）——多模态 Embedding。
- **ImageBind**（Meta）——6 模态 Embedding。
- **CLAP**（LAION）——音频-文本 Embedding。
- **VideoCLIP**——视频-文本 Embedding。

**多模态语音**：

- **Whisper / Whisper V3 Turbo**（OpenAI）——事实标准 ASR。
- **Paraformer**（阿里达摩院）——非自回归 ASR，中文优秀。
- **FunASR**（阿里开源）——中文 ASR 工具包。
- **SenceVoice**（阿里开源）——多语言 ASR。
- **VALL-E / VALL-E 2**（微软）——TTS 语音克隆。
- **Suno Bark / VITS / VITS2**——开源 TTS。
- **CosyVoice**（阿里开源）——多语言 TTS。
- **ChatTTS**（开源）——对话 TTS。
- **GPT-4o Voice**（OpenAI）——原生语音生成。

**多模态视频**：

- **Sora**（OpenAI）——视频生成标杆（闭源）。
- **Veo 2**（Google）——视频生成（闭源）。
- **可灵 1.5**（快手）——国产视频生成（闭源 + 部分开源）。
- **Vidu**（生数科技）——国产视频生成（清华系）。
- **HunyuanVideo**（腾讯混元）——开源视频生成。
- **Wan 2.1**（阿里通义）——开源视频生成。
- **CogVideoX**（智谱）——开源视频生成。
- **Stable Video Diffusion**（Stability AI）——开源视频生成。
- **Gen-3 / Gen-4 Alpha**（Runway）——视频生成。
- **Pika 2.0**——视频生成。
- **Luma Dream Machine**（Luma AI）——视频生成。
- **VideoLLaMA / Video-LLaVA**（开源）——视频理解。
- **Gemini 1.5 / 2.0 Video**（Google）——长视频理解。

**多模态 Agent（2024-2025）**：

- **GPT-4o Computer Use**（OpenAI，2024-10）——AI 控制电脑。
- **Claude Computer Use**（Anthropic，2024-10）——AI 控制电脑。
- **Gemini 2.0 Agent**（Google，2024-12）——原生多模态 Agent。
- **LangGraph + 多模态**——多模态 Agent 编排。

**多模态生成（图像）**：

- **DALL-E 3**（OpenAI）——图像生成。
- **Midjourney V6.1 / V7**（商业）——图像生成事实标准。
- **Stable Diffusion 3.5 / SDXL**（Stability AI）——开源图像生成。
- **Flux.1**（Black Forest Labs）——开源图像生成。
- **Imagen 3 / Imagen 4**（Google）——图像生成。
- **Recraft V3**——图像生成（设计导向）。
- **Ideogram 2.0**——图像生成（文字渲染）。

**3D 视觉**：

- **NeRF / Instant-NGP / 3D Gaussian Splatting**（开源）——3D 重建。
- **PointNet / Point Transformer**（开源）——点云处理。
- **Open3D / PCL**——3D 工具库。
- **Meshy / Tripo3D / CSM**——AI 3D 生成。

**多模态 RAG（2024-2025）**：

- **LangChain Multi-modal RAG**——多模态 RAG。
- **LlamaIndex Multi-modal RAG**——多模态 RAG。
- **CLIP-based RAG**——以文搜图。
- **VideoRAG**——视频 RAG。
- **多模态 GraphRAG**——多模态知识图谱 RAG。

### 4.4 代码 / 示例

**示例 1：基于 OpenAI GPT-4o 的多模态推理（Python）**

```python
from openai import OpenAI
import base64

client = OpenAI()

# 编码图像
def encode_image(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

image_base64 = encode_image("product.jpg")

# 多模态对话
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "请分析这张商品图，并给出营销文案建议。"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}",
                        "detail": "high"
                    },
                },
            ],
        }
    ],
    max_tokens=1000,
)

print(response.choices[0].message.content)
```

**示例 2：基于 Qwen2-VL 的本地多模态推理（Python + vLLM）**

```python
from vllm import LLM, SamplingParams
from PIL import Image

# 启动 Qwen2-VL
llm = LLM(
    model="Qwen/Qwen2-VL-72B-Instruct",
    tensor_parallel_size=4,
    gpu_memory_utilization=0.9,
    max_model_len=32768,
    enforce_eager=False,
    quantization="awq",
)

# 多模态推理
image = Image.open("document.png")
sampling_params = SamplingParams(temperature=0.2, max_tokens=2048)

outputs = llm.generate(
    {
        "prompt": "<|image_pad|>请提取这张文档中的关键信息，包括标题、作者、日期和摘要。",
        "multi_modal_data": {"image": image},
    },
    sampling_params=sampling_params,
)

for output in outputs:
    print(output.outputs[0].text)
```

**示例 3：基于 LangChain + GPT-4o 的多模态 RAG**

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.vectorstores import Milvus
from langchain_community.document_loaders import UnstructuredImageLoader
from langchain.retrievers.multi_modal import MultiModalRetriever
from langchain_core.messages import HumanMessage

# 1. 多模态数据加载
image_loader = UnstructuredImageLoader("data/product_catalog/")
docs = image_loader.load()

# 2. 多模态 Embedding（CLIP）
clip_embeddings = OpenAIEmbeddings(model="clip-vit-base-patch32")

# 3. 向量库（Milvus 多模态）
vectorstore = Milvus.from_documents(
    docs,
    clip_embeddings,
    collection_name="product_images",
    connection_args={"host": "localhost", "port": "19530"},
)

# 4. 多模态 RAG
retriever = MultiModalRetriever(
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
    model=ChatOpenAI(model="gpt-4o"),
)

# 5. 多模态问答
query = "推荐几款适合夏天穿的连衣裙"
results_with_images = retriever.invoke(query)

# 6. 多模态生成
message = HumanMessage(
    content=[
        {"type": "text", "text": f"基于以下产品推荐：{query}"},
        {"type": "text", "text": "请用 200 字给出推荐理由。"},
    ]
)

response = ChatOpenAI(model="gpt-4o").invoke([message])
print(response.content)
```

**示例 4：基于 Whisper 的语音转写（Python）**

```python
import whisper

# 加载模型
model = whisper.load_model("large-v3")

# 语音转写
result = model.transcribe(
    "meeting.mp3",
    language="zh",
    task="transcribe",
    initial_prompt="这是一场关于 AI 与数据架构的技术会议。",
)

# 输出结果
for segment in result["segments"]:
    print(f"[{segment['start']:.2f}s - {segment['end']:.2f}s] {segment['text']}")

# 带时间戳的字幕
with open("meeting_subtitle.srt", "w") as f:
    for i, segment in enumerate(result["segments"], 1):
        f.write(f"{i}\n")
        f.write(f"{segment['start']:.3f} --> {segment['end']:.3f}\n")
        f.write(f"{segment['text']}\n\n")
```

**示例 5：基于 CLIP 的以文搜图（Python）**

```python
import clip
import torch
from PIL import Image

# 加载 CLIP
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# 编码图像
image = preprocess(Image.open("product.jpg")).unsqueeze(0).to(device)
with torch.no_grad():
    image_features = model.encode_image(image)

# 编码文本查询
text = clip.tokenize(["一件红色的连衣裙", "一台笔记本电脑", "一只可爱的猫"]).to(device)
with torch.no_grad():
    text_features = model.encode_text(text)

# 计算相似度
similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
values, indices = similarity[0].topk(3)

print("Top 3 最匹配的描述:")
for value, index in zip(values, indices):
    print(f"  {['红色连衣裙', '笔记本电脑', '可爱的猫'][index]}: {value.item():.2f}%")
```

**示例 6：基于 Anthropic Claude Computer Use 的多模态 Agent（Python）**

```python
import anthropic
from playwright.sync_api import sync_playwright

client = anthropic.Anthropic()

def use_computer(task_description: str):
    """使用 Claude 控制浏览器完成任务"""

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        tools = [
            {
                "type": "computer_20241022",
                "name": "computer",
                "display_width_px": 1024,
                "display_height_px": 768,
                "display_number": 1,
            },
            {
                "type": "text_20241022",
                "name": "str_replace_editor",
            }
        ]

        messages = [{"role": "user", "content": task_description}]

        while True:
            response = client.beta.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4096,
                tools=tools,
                messages=messages,
            )

            # 收集所有工具调用 + 文本响应
            tool_results = []
            for content in response.content:
                if content.type == "text":
                    print(f"Claude: {content.text}")

                if content.type == "tool_use":
                    if content.name == "computer":
                        action = content.input["action"]
                        print(f"Action: {action}")

                        if action == "screenshot":
                            screenshot = page.screenshot()
                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": content.id,
                                "content": [{"type": "image", "source": {"type": "base64", "data": base64.b64encode(screenshot).decode()}}]
                            })
                        elif action == "left_click":
                            page.mouse.click(content.input["coordinate"]["x"], content.input["coordinate"]["y"])
                            tool_results.append({"type": "tool_result", "tool_use_id": content.id, "content": "Clicked"})

            if response.stop_reason == "end_turn":
                break

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

        browser.close()

# 任务：搜索并截图
use_computer("打开浏览器，访问 anthropic.com，截图保存")
```

---
