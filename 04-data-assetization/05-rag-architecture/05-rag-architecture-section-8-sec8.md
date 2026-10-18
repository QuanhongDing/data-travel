> 本文件是 **05-rag-architecture.md** 的子文件（§8. 面试真题集）。完整章节请回到 [index](05-rag-architecture.md)。

## 8. 面试真题集

> 本节围绕本章节自身主题「RAG 架构（Retrieval-Augmented Generation Architecture）」自编 7 道面试题，覆盖 RAG 端到端链路上最容易被面试官追问的工程决策点：范式选型、Chunking、Embedding、混合检索、Reranker、Agentic / GraphRAG、评估与监控。
>
> **每题按五段式作答**：考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料。参考答案优先引用**头部互联网企业的公开架构实践**（Meta / Microsoft / OpenAI / Anthropic / Databricks / Snowflake / Uber / Netflix / 阿里 / 字节等），便于读者进一步溯源。

### 8.1 全景视图

| 主题号 | 主题 | 题号范围 | 收录题数 |
| --- | --- | --- | :---: |
| §5.1 | RAG 范式演进与端到端架构 | §5.1.1 | 1 |
| §5.2 | Chunking 与文档预处理 | §5.2.1 | 1 |
| §5.3 | Embedding 与向量化选型 | §5.3.1 | 1 |
| §5.4 | 混合检索与多路召回融合 | §5.4.1 | 1 |
| §5.5 | Reranker 与上下文压缩 | §5.5.1 | 1 |
| §5.6 | Agentic RAG 与 GraphRAG | §5.6.1 | 1 |
| §5.7 | RAG 评估与线上监控 | §5.7.1 | 1 |

| 题号 | 难度 |
| --- | :---: |
| §5.1.1 | ★★★☆☆ |
| §5.2.1 | ★★★★☆ |
| §5.3.1 | ★★★☆☆ |
| §5.4.1 | ★★★★☆ |
| §5.5.1 | ★★★★☆ |
| §5.6.1 | ★★★★★ |
| §5.7.1 | ★★★★☆ |

### 8.2 §5.1 RAG 范式演进与端到端架构

> 本主题考察「RAG 的全景图」：候选人能否从 LLM 的三大缺陷（知识截止 / 幻觉 / 不可溯源）出发，说清 RAG 端到端链路的每一段（清洗 → 切分 → 嵌入 → 索引 → 召回 → 精排 → 压缩 → 生成 → 评估），并能横向比较 Naive / Advanced / Modular / Agentic 四种范式的适用场景与代价。

#### §5.1.1 请系统阐述 RAG（Retrieval-Augmented Generation，检索增强生成）的端到端架构，并对比 Naive RAG、Advanced RAG、Modular RAG、Agentic RAG 四种范式的核心差异、适用场景与各自的工程代价。

**1. 考察点**

- 是否理解 RAG 不是「LLM + 向量库」两段式，而是一条**端到端流水线**：文档解析 → 清洗 → Chunking → Embedding → 索引 → Query 理解 → 多路召回 → 融合 → Rerank → 上下文压缩 → Prompt 装配 → 引用标注 → LLM 生成 → 评估反馈，每一段都有独立决策。
- 能否从「LLM 的三大缺陷」（知识截止、幻觉、不可溯源）反推 RAG 解决的是什么问题，而不是把 RAG 当成万能银弹。
- 能否说出 Naive / Advanced / Modular / Agentic 的**递进关系**——后一范式是为了修补前一范式的具体缺陷而出现，而不是平行的"四选一"。
- 加分项：能给出每种范式下「线上召回率 / 延迟 / 成本 / 维护复杂度」的具体经验值。

**2. 参考答案框架**

**第一层：先定义 RAG 端到端链路的八段。** 一条生产级 RAG 流水线至少包含八个阶段，每个阶段都有独立的工程决策：

1. **文档解析与清洗（Ingest）**：PDF（PyMuPDF / pdfplumber / ColPali）、Word（python-docx）、代码（tree-sitter）、表格（Camelot）、图像（多模态 Embedding）。坑点是 PDF 解析丢格式、扫描件 OCR 错字、表格行列错位。
2. **Chunking**：固定窗口、滑动窗口、语义切分、结构感知切分。
3. **Embedding**：选模型、维度、归一化策略。
4. **索引写入**：向量库（HNSW / IVF / DiskANN）+ 元数据索引（ES / Meilisearch）。
5. **Query 理解**：意图识别、Query Rewrite、HyDE、Step-Back Prompting。
6. **多路召回**：向量 + BM25 + KG + 标量过滤 + 权限过滤。
7. **融合 + Rerank + 压缩**：RRF 融合 → Cross-Encoder Rerank → Contextual Compression。
8. **生成 + 引用 + 评估**：Prompt 装配、引用标注、RAGAS 离线评估、用户反馈回流。

漏掉任何一段，召回率或准确性都会塌方。Meta 在 2020 年那篇 RAG 原论文里只规定了「检索 + 生成」两段，工业落地必须在中间补齐其余六段。

**第二层：四种范式的递进关系。**

- **Naive RAG**：Question → Embedding → 向量召回 Top-K → Prompt → LLM。代表是早期 LangChain 的 `RetrievalQA`。**优点**：10 行代码即可跑通，PoC 友好。**缺点**：召回率低（向量召回 + 没有任何改写 / 精排，Recall@10 经验上通常 50%-70%；该区间为工程经验估计，本书无法给出可溯源的统一数字，此处按【经验】档处理）、上下文噪声大（Top-K 里有大量弱相关 chunk 污染 prompt）、无溯源（prompt 里没有强制引用标注）。**适用场景**：PoC / Demo / 文档量 < 1 万 / 容忍三成上下的答非所问。

- **Advanced RAG**：在 Naive 之上加入 Pre-Retrieval 优化（Query Rewrite / HyDE / Step-Back）和 Post-Retrieval 优化（Rerank / Contextual Compression / Lost-in-the-Middle 缓解）。**核心收益**：召回率有可观提升（经验上从六成量级提升到八成量级；该区间为工程经验估计，本书无法给出可溯源统计，此处按【经验】档处理）。**缺点**：链路复杂度显著增加——Query Rewrite 多一次 LLM 调用、Reranker 多一次 Cross-Encoder、整体延迟从 1 秒量级拉到 3-5 秒（延迟数值随链路长度与硬件而异，本书无法给出可溯源的统一数字，此处按【经验】档处理）。**适用场景**：生产级 RAG、企业知识问答。**工业实践**：OpenAI Assistants API 的 File Search（2024）、阿里云百炼 RAG、字节火山方舟 RAG 都走 Advanced 路线。

- **Modular RAG（GAIR Lab 2024）**：把流水线拆成可插拔模块，每模块独立优化。代表论文是 Gao 等人 2024 年发表的《Modular RAG: Transforming RAG Systems into LEGO-like Reconfigurable Frameworks》。**优点**：可演进、可观测、可 A/B 测试单一模块。**缺点**：架构复杂、需要平台投入。**适用场景**：企业级 RAG 平台、多业务线共享底座。

- **Agentic RAG（2024 末-2025）**：由 LLM 智能体自主决定「查什么 / 何时查 / 怎么组合」，可能调用多种工具（RAG / SQL / Web Search / Function Call）。代表实现是 LangGraph、AutoGen、CrewAI 上的 Agentic RAG 工作流。**优点**：能处理多跳推理、跨系统查询、复杂业务问题；可以「检索 → 判断 → 再检索」。**缺点**：单次 query 可能触发多次 LLM 调用（经验上 5-10 次，随任务复杂度而异，此处按【经验】档处理），成本陡增；可观测性差（Agent 的决策路径难以复现）；错误会沿决策链传播。**适用场景**：复杂业务问答、研究助手、企业 Copilot。**工业落地**：Anthropic Claude + Tool Use、阿里通义晓蜜 Agent、字节扣子（Coze）都内置 Agentic RAG。

**第三层：范式不是「四选一」，而是「叠加演进」。** 真实生产几乎一定是**混合范式**——Modular 是底座（模块化），Advanced 是默认（Query Rewrite + Rerank），Agentic 覆盖复杂路径（多跳 / 跨系统）。Microservices 思路同样适用于 RAG：单一职责模块 + 编排层 + 评估层。

**第四层：范式选择的判断维度。**

| 维度 | Naive | Advanced | Modular | Agentic |
| --- | --- | --- | --- | --- |
| 上线周期 | 1-2 周 | 1-3 月 | 3-6 月 | 6-12 月 |
| 工程复杂度 | 低 | 中 | 中-高 | 高 |
| 单次 query 成本（经验） | $0.001-0.005 | $0.01-0.05 | $0.01-0.05 | $0.1-1.0 |
| 召回率（经验） | 50-70% | 80-90% | 80-90% | 85-95% |
| 适用文档量 | < 10K | 10K-10M | 10K-10M | 任意 |
| 适用问题类型 | FAQ / 单跳 | 多跳 / 中等复杂 | 多业务线 | 跨系统 / 复杂决策 |
| 典型落地 | Demo | 生产知识库 | 企业 RAG 平台 | Copilot / Agent 产品 |

**第五层：成本与取舍。** Agentic RAG 的成本可达 Advanced RAG 的 10-20 倍（该倍数为工程经验估计，随迭代轮数与模型选型而异，本书无法给出可溯源的统一数字，此处按【经验】档处理），但召回率天花板也更高。**健康做法**是默认走 Advanced，仅在需要时才升级到 Agentic——这是 LangChain 0.2+ 的 LangGraph 与 LlamaIndex Workflows 共同倡导的「按需编排」思路。

**3. 常见陷阱**

- **把 RAG 等同于「向量召回 + LLM」。** 这是最常见的误解，漏掉了 Chunking / Embedding / Rerank / 评估四段，注定召回率上不去。
- **只背范式不讲链路。** 面试官真正想听的是「你这条端到端里哪一段是你调的、效果怎么验证」——讲清具体一段比背四种范式更有说服力。
- **混淆 Naive vs Advanced。** 很多候选人以为加了 Reranker 就是 Advanced——其实 Advanced 的关键是 Pre-Retrieval + Post-Retrieval 的组合优化，单纯加 Rerank 只是 Half-Advanced。
- **忽略 Modular 的「平台价值」。** Modular 不是为了炫技，而是为了「让多个业务线共享同一套 RAG 平台而不互相干扰」——这是企业级落地的核心诉求。
- **把 Agentic 当成万能解。** Agentic 在多跳 / 跨系统场景下极强，但在简单 FAQ 场景下反而引入不稳定性。**永远从最简单的范式开始，按需升级**。
- **不区分「PoC 友好」与「生产友好」。** Naive RAG 在 PoC 阶段可以跑通，但直接上线到生产会带来很高比例的答非所问（经验上可达三到五成，该区间属工程估计而非可核验统计，此处按【经验】档处理）——这不是工程调优能弥补的，必须升级范式。

**4. 追问预测**

- **「线上召回率只有 60%，你怎么定位是哪一段的瓶颈？」** 答：分层定位——① 召回层用 Recall@K 看向量召回是否命中（如果 Recall@10 < 60%，问题在 Chunking / Embedding / 索引）；② Rerank 后看 Rerank Recall@5 是否回升（如果回升不明显，问题在 Reranker 模型或 query 改写）；③ 端到端 Faithfulness 看 LLM 是否被噪声干扰（如果上下文正确但答错，问题在 Prompt 或上下文长度）。
- **「Naive RAG 上线后用户投诉答非所问，第一步做什么？」** 答：先看 RAGAS 评估——`context_relevance`（召回的 chunk 是否真的相关）+ `faithfulness`（答案是否忠实于召回的 chunk）。如果 `context_relevance` 低，加 Reranker；如果是 `faithfulness` 低，做 Contextual Compression 或调 Prompt。
- **「Modular RAG 的模块边界怎么划？」** 答：按「独立可优化、可替换」的原则——索引模块（可换向量库）、检索模块（可换召回策略）、Rerank 模块（可换 Reranker）、评估模块（可换评估指标集）。关键是让每个模块有独立输入 / 输出契约，能独立 A/B。
- **「Agentic RAG 的成本怎么压？」** 答：四招——① 用小模型做「是否需要进一步检索」的路由判断（Haiku / GPT-4o-mini），仅在必要时调用大模型；② 缓存中间结果（相同子查询复用）；③ 限制最大迭代次数（通常 3-5 步）；④ 用 DSPy 优化 prompt / 模型路由。

**5. 参考资料**

- Patrick Lewis 等人（Meta AI / Facebook Research）2020 年发表于 NeurIPS 的论文《Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks》——RAG 范式的原始定义，含「端到端检索 + 生成」的最早系统性论证。
- Yunfan Gao 等人（复旦大学 GAIR Lab）2024 年发表的《Modular RAG: Transforming RAG Systems into LEGO-like Reconfigurable Frameworks》——Modular RAG 的范式划分与模块边界。
- LangChain 官方文档关于 LangGraph 与 Agentic RAG 的章节（2024-2025）——LangGraph 是当前 Agentic RAG 工程化的事实标准框架之一。
- Anthropic 关于 Claude + Tool Use + RAG 的官方文档（2024-2025）——头部 LLM 厂商对 Agentic RAG 落地范式的官方表述。
- 阿里云百炼 RAG 平台公开文档（2024）——国内云厂商对 RAG 四范式的工程落地总结，对应「PoC → Advanced → Modular → Agentic」的演进路径。
- **招商银行的「智能问答助手」** —— 银行业内部知识库从 Naive RAG 演进到 Modular RAG 的工业实践，覆盖产品手册 / 业务制度 / 监管文件多源异构知识。
- **米哈游的「游戏内智能 NPC 对话」** —— 原神 / 崩坏系列基于 RAG + LLM 的 NPC 自由对话系统，处理剧情与世界观一致性，属于典型 Modular RAG 工程化落地。
- **京东的「京言」智能客服** —— 电商场景 RAG 应用，覆盖商品知识 + 售后政策 + 用户手册的多路召回整合，是国内头部电商 RAG 工程实践之一。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量与性能数字（PB 级、延迟、成本倍数等），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。具体链接请以官方文档当前版本为准。

---

### 8.3 §5.2 Chunking 与文档预处理

> 本主题考察「文档侧工程」：候选人能否在 Chunking 策略、文档解析、元数据补充上做出有依据的决策——这些决策决定了召回层的下界。

#### §5.2.1 在 RAG 系统中，文档切分（Chunking）策略对召回效果影响巨大。请系统说明常见的 Chunking 策略、固定窗口与语义切分的取舍、以及如何评估 Chunking 的好坏，并结合多模态文档（PDF / Word / 代码 / 表格）给出选型建议。

**1. 考察点**

- 是否理解 Chunking 的**本质约束**是「**召回粒度**」与「**语义完整度**」的折中——粒度太细，召回命中但上下文不足；粒度太粗，召回噪声大。
- 能否区分**字符 / Token 切分**、**句子切分**、**语义切分**、**结构感知切分**四类策略的适用场景。
- 是否知道 Chunking 不是孤立决策，而是和**Embedding 模型、Retrieval 策略、Prompt 模板**强耦合——比如语义切分依赖 Embedding 模型质量，结构感知切分依赖文档解析质量。
- 加分项：能给出具体的 Chunk Size / Overlap 经验值（中文 512 token / overlap 10-20%），并能解释为什么是这个数量级。

**2. 参考答案框架**

**第一层：Chunking 的本质约束。** Chunking 决定的是**召回的最小语义单元**——这个单元太小（< 100 token），召回命中后 LLM 拿到的上下文不足以回答；这个单元太大（> 2000 token），召回时向量相似度被平均化、且占满 LLM 上下文窗口。LangChain 官方推荐的 512 token / 64 overlap 是一个起点，但需要根据 Embedding 模型与文档类型调整——BGE-M3 训练时的最大长度是 8192 token，但实际语义向量在 512 token 附近最稳定。

**第二层：七类 Chunking 策略对比。**

- **固定窗口（Fixed Window）**：按 token 数硬切。优点是简单、可控；缺点是切碎语义（一段话可能在第三句被切断）。
- **滑动窗口（Sliding Window）**：相邻 chunk 重叠 10-20%。缓解边界切断，但有冗余存储。
- **句子切分（Sentence Splitter）**：按句子边界（NLTK / spaCy / 句号 / 换行）。保持句子完整，但长度不均。
- **递归切分（Recursive Character Text Splitter）**：先按段落、再按句子、再按 token。LangChain 默认，**中文场景首选**。
- **语义切分（Semantic Chunking）**：用相邻 Embedding 相似度找切点（LangChain `SemanticChunker`、LlamaIndex `SemanticSplitterNodeParser`）。**优点**：语义完整；**缺点**：慢（每段都要 embedding）、依赖 Embedding 模型质量。
- **结构感知切分（Structure-aware）**：按 Markdown 标题层级、HTML 标签、代码 AST（tree-sitter）、PDF 章节切。**适合**：结构化文档、技术文档。
- **LLM 辅助切分**：让 LLM 决定切点。**准但贵**，一般用于 P0 高质量场景。

**第三层：Chunk Size 与 Overlap 的经验值。**

| Embedding 模型 | 推荐 Chunk Size | 推荐 Overlap | 理由 |
| --- | --- | --- | --- |
| OpenAI text-embedding-3-large | 512-1024 token | 10-20% | 模型训练长度 8192 |
| BGE-M3（中文） | 512-1024 token | 10-20% | 多功能多粒度 |
| BGE-large-en | 256-512 token | 10-20% | 训练长度 512 |
| M3E | 512 token | 10% | 中文优化 |
| ColBERTv2 | 128-256 token | - | 晚交互 |

Overlap 的作用是**减少边界切断的召回损失**——一段话被切断时，overlap 保证两个 chunk 各保留一半，召回任一都能拼回完整。但 overlap 不能太大（> 30%），否则存储翻倍、召回噪声增多。

**第四层：多模态文档的 Chunking 选型。**

- **PDF**：经典做法是按页切，但页大小不一、跨页表格被切断。进阶做法是「结构感知 + 表格单独处理」——正文按章节切、表格用 Camelot / pdfplumber 抽出来后按行 / 列单独 Embedding。ColPali（2024）更进一步，直接对 PDF 页面做多模态 Embedding，跳过文本提取阶段。
- **Word / Markdown**：最友好——按标题层级递归切，代码块按 ``` 边界切。
- **代码（Python / Java / SQL）**：用 tree-sitter 做 AST 切分，按函数 / 类 / 方法边界。LlamaIndex 的 `CodeSplitter` 是工业级实现。
- **表格**：特殊处理——把表格转成自然语言摘要（"X 类目下 Y 商品销量为 Z"）+ 原始表格分别 Embedding。
- **图像 / 视频 / 音频**：用多模态 Embedding（CLIP / ImageBind / Qwen-VL）直接对图像做 Embedding；视频抽帧后 Embedding；音频用 Whisper 转文本后再 Embedding。

**第五层：如何评估 Chunking 的好坏。** 不能凭感觉——必须建评测集：

- **黄金集**：人工标注「段落-问题」对应关系——给定一个问题，应该召回哪几个 chunk。
- **指标**：Chunk-Level Recall@K（召回的 chunk 是否包含答案信息）、Boundary Score（边界是否切断语义单元）、Embedding Drift（相邻 chunk 的 embedding 距离分布，过大意味着切断）。
- **工具**：RAGAS 提供 context_precision / context_recall；LangSmith 提供 chunk-level 调试视图。

**第六层：动态 Chunking（进阶）。** 2024-2025 出现的**Late Chunking**（Jina AI 2024 提出）做法是**先对整篇文档做 Embedding，再按 chunk 切向量**——保留跨段落上下文，适合长文档。

**3. 常见陷阱**

- **Chunk 越大越好。** Chunk 超过 1024 token 后，向量相似度被稀释，召回率反而下降。512 token 是大多数场景的甜点。
- **Overlap 越大越好。** Overlap > 30% 会让存储翻倍、召回噪声增多。
- **不用语义切分。** 以为语义切分「太慢太花」就直接放弃——对 P0 高质量场景（如法律 / 医疗），语义切分的召回率提升是值得的。
- **不对 PDF 做结构化处理。** PDF 解析后丢格式、跨页表格切断是 RAG 系统的最大召回黑洞之一。
- **不评估。** Chunking 改完不重建评测集，效果全凭感觉——注定无法迭代。
- **Chunking 后丢失元数据。** 切完后丢失来源文档、章节、页码、时间戳，导致引用无法溯源。

**4. 追问预测**

- **「中文文档按段落切，单段可能只有 50 token，召回的 chunk 太短上下文不足怎么办？」** 答：用「最小 chunk size + 上下文合并」策略——不足 200 token 的段落自动合并相邻段落直到达到 200 token 下限。
- **「PDF 表格被切断怎么处理？」** 答：先抽表格（pdfplumber / Camelot），表格转 Markdown 后单独 Embedding；同时在原页面 chunk 中保留表格引用。
- **「代码文档怎么切？」** 答：用 tree-sitter 按函数 / 类切，同时保留文件路径、函数签名作为 metadata，便于「这个函数在哪里定义」类问题。
- **「评估显示 Chunk-Level Recall@10 < 60%，下一步怎么改？」** 答：分情况——① 召回了相邻 chunk 但漏掉核心 chunk：改用语义切分或扩大 chunk size；② 召回完全无关 chunk：检查 Embedding 模型是否匹配语言（中英文混用）；③ Chunk 边界切断：增加 overlap 或改用结构感知切分。

**5. 参考资料**

- Greg Kamradt（LangChain 团队）2023 年公开的《5 Levels of Text Splitting》——Chunking 五层级的原始论述，是该领域引用最广的入门材料。
- LlamaIndex 官方文档关于 `SentenceSplitter` / `SemanticSplitterNodeParser` / `CodeSplitter` 的章节——工业级 Chunking 实现的对照参考。
- Jina AI 2024 年公开的《Late Chunking: Contextual Chunking Using Long Embeddings》——Late Chunking 范式的原始论文，把「先 Embedding 后切分」的思路系统化。
- Anthropic 关于 Claude 长文档处理与 Contextual Retrieval 的官方文档（2024）——头部 LLM 厂商对 Chunk + 元数据增强的最佳实践总结。
- LangChain 官方文档中 `RecursiveCharacterTextSplitter` 与中文切分最佳实践章节——中文场景下 Chunking 参数的工程经验。
- **平安银行的合同审查 RAG** —— 金融合同 PDF 多模态解析 + 表格抽取 + 章节感知 Chunking 的工业实践，处理跨页条款与签章页等典型金融文档痛点。
- **美的集团的「设备维护手册」智能问答** —— 制造业技术文档按章节递归切分 + 图纸 OCR 文本独立 Embedding 的工业方案，覆盖家电维保 SOP 类长尾文档。
- **中国移动的「10086 客服知识库」** —— 运营商客服知识按语义切分 + Late Chunking 处理超长业务文档的实践，处理政策类文档频繁更新与超长上下文难题。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量与性能数字（PB 级、延迟、成本倍数等），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。具体链接请以官方文档当前版本为准。

---

### 8.4 §5.3 Embedding 与向量化选型

> 本主题考察「向量空间的质量」：Embedding 模型决定了「什么算语义近邻」，是召回层的根。

#### §5.3.1 请系统说明 RAG 系统中 Embedding 模型的核心作用，并对比主流 Embedding 模型（OpenAI text-embedding-3 / BGE-M3 / M3E / CLIP / ColBERTv2）在中文、英文、多模态场景下的选型考量，以及如何评估 Embedding 效果。

**1. 考察点**

- 是否理解 Embedding 的**本质是「把语义映射到向量空间，使语义近邻在欧氏 / 余弦空间里也是近邻」**——这是召回层的天花板。
- 能否区分**稠密向量（Dense Embedding）** 与**稀疏向量（Sparse Embedding，如 SPLADE / BM25）** 的适用场景。
- 是否知道 Embedding 选型与**下游任务、语种、文档长度**强耦合——没有一个 Embedding 适合所有场景。
- 加分项：能给出具体的 Benchmark（BEIR / MTEB / C-MTEB）的对比数据。

**2. 参考答案框架**

**第一层：Embedding 在 RAG 中的角色。** Embedding 是 RAG 召回层的根——召回的天花板由 Embedding 决定，再好的 Reranker 也无法召回 Embedding 没命中的文档。所以 Embedding 选型是 RAG 系统最重要的单一决策。

**第二层：选型的五个约束。**

1. **语种**：中文 / 英文 / 多语言——BGE-M3 强项是「多功能多粒度多语言」（100+ 语言），M3E 是中文优化，OpenAI text-embedding-3-large 英文强但中文一般。
2. **文档长度**：短文本（< 512 token）选 BGE-large-en；长文本（> 4K token）选 BGE-M3（8192 token）或 Voyage AI（32K token）或 Nomic Embed。
3. **领域**：通用场景选 BGE-M3 / OpenAI；垂直领域（法律 / 医疗 / 金融）需要微调（用 Instructor Embedding 的「任务指令驱动」机制）。
4. **维度**：维度越高表达力越强但存储 / 计算成本越高。OpenAI text-embedding-3-large 3072 维、BGE-M3 1024 维、bge-small-en 384 维。
5. **成本**：自托管（BGE-M3 / M3E / bge-small）vs API（OpenAI / Cohere / Voyage）——按 query 量与延迟要求取舍。

**第三层：主流 Embedding 模型对比。**

| 模型 | 维度 | 语种 | 最大长度 | 特点 | 适用 |
| --- | --- | --- | --- | --- | --- |
| OpenAI text-embedding-3-large | 3072（可降到 256） | 英文为主 | 8192 | 闭源 SOTA | 英文为主 + 有 API 预算 |
| OpenAI text-embedding-3-small | 1536（可降到 512） | 英文为主 | 8192 | 性价比 | 英文 + 成本敏感 |
| BGE-M3（BAAI 2024） | 1024 | 多语言 100+ | 8192 | 多功能 + 多粒度 + 多语言 | 中文 + 多语言首选 |
| BGE-large-en-v1.5 | 1024 | 英文 | 512 | 英文 SOTA | 英文为主 |
| BGE-large-zh-v1.5 | 1024 | 中文 | 512 | 中文 SOTA | 中文场景 |
| M3E | 1024 | 中文 | 512 | 中文优化 | 中文 + 自托管 |
| Moka Massive Embedding | 1024 | 中英 | 512 | 中文 + 多任务 | 中文场景 |
| Cohere embed-v3 | 1024 | 多语言 | 512 | 多语言 SOTA | 多语言 + 有预算 |
| Voyage AI | 1024 | 多语言 | 32000 | 长文本 SOTA | 长文档 |
| Nomic Embed v1.5 | 768 | 多语言 | 8192 | 开源 + 长文本 | 长文档 + 自托管 |
| Instructor Embedding | 768 | 多语言 | 512 | 任务指令驱动 | 垂直领域微调 |
| CLIP ViT-L/14 | 768 | - | - | 图文对齐 | 多模态 RAG |
| Qwen-VL Embedding | - | 中英 | - | 中文图文 | 国内多模态 |
| ColBERTv2 | 变长 | 多语言 | - | 晚交互 | 高精度检索 |
| SPLADE-v3 | 稀疏 | 多语言 | 512 | 稀疏 + 语义 | 混合检索 |

**第四层：稠密 vs 稀疏 vs 晚交互。**

- **稠密向量（Dense Embedding）**：BGE / OpenAI / M3E。**优点**：语义近邻；**缺点**：精确匹配弱（型号、ID、专有名词容易召回「看起来相似但不是同一个」的文档）。
- **稀疏向量（Sparse Embedding）**：BM25 / SPLADE / uniCOIL。**优点**：精确匹配强、可解释（哪些词命中）；**缺点**：无语义。
- **晚交互（Late Interaction）**：ColBERT / ColBERTv2。把 query 与 doc 的每个 token 都编码，最后算 token 级相似度。**优点**：兼顾精度与语义；**缺点**：存储大（每个 token 都存向量）。

**生产经验（【经验】档，本书无法给出可溯源的统一数字）**：单用向量召回的召回率上限是 70-80%，单用 BM25 的上限是 60-70%。**向量 + BM25 混合**才能打到 85%+——这是 Hybrid RAG 流行的根本原因。

**第五层：如何评估 Embedding 效果。**

- **离线 Benchmark**：BEIR（英文 18 个数据集）、MTEB（Massive Text Embedding Benchmark，涵盖 100+ 模型）、C-MTEB（中文版）。这是工程选型的标准参考。
- **线上 A/B**：在真实 query 上对比两个 Embedding 的 Recall@10 / MRR / nDCG。
- **领域评测集**：**最关键**——BM25 在 MTEB 上排名靠后不代表在你的领域不行，反之亦然。建自己的 Golden Set（几百到几千条「问题-正确文档」对）是最有说服力的评估。

**第六层：Embedding 微调。** 通用 Embedding 在垂直领域（如医疗 ICD 代码、法律条文）效果有限。微调路径：① 用领域数据继续预训练 Embedding；② 用 Instructor 模式加任务指令；③ 用对比学习（query 与正例拉近、与负例推远）。Databricks 的 `bge-large-en` 微调教程是工业参考。

**3. 常见陷阱**

- **英文 Embedding 跑中文。** 这是最常见的错误——OpenAI text-embedding-3 在中文场景下的召回率明显低于 BGE-M3（差距随语料与评测集而异，本书无法给出可溯源的统一数字，此处按【经验】档处理）。
- **维度越高越好。** 3072 维比 1024 维存储 3 倍、检索慢 2-3 倍（存储倍数由向量长度决定，检索耗时倍数为工程经验估计，此处按【经验】档处理），但召回率提升有限。按需选维度，能降到 256 维的反而更经济（OpenAI 支持 Matryoshka 降维）。
- **不做 Benchmark。** 直接拿通用 MTEB 排名选 Embedding——垂直领域效果可能差异巨大。
- **不处理 OOD。** Embedding 模型对训练分布外的术语（公司内部黑话、新出现的专有名词）效果会塌方，需要微调或加术语表。
- **忽略 Embedding 版本兼容。** 升级 Embedding 后必须全量重建索引——混用新旧 Embedding 的索引是隐性 bug。
- **不评估归一化。** 内积（Inner Product）与余弦相似度（Cosine）对归一化的要求不同——内积对向量模长敏感，未归一化时"长向量"文档在打分上占优，召回被长度偏差污染；余弦本身对模长不敏感，但不少向量库的 `cosine` 实现是"先归一化再算内积"，在同一批索引上混用两种度量会引入评分不一致。

**4. 追问预测**

- **「Embedding 选错了，召回率只有 50%，怎么救？」** 答：先换 Embedding——中文换 BGE-M3，英文换 OpenAI text-embedding-3-large，长文档换 Voyage / BGE-M3；如果还不行，加 BM25 兜底（Hybrid Search），通常召回率能回到 80%+（该量级为工程经验估计，随语料与查询分布而异，本书无法给出可溯源的统一数字，此处按【经验】档处理）。
- **「Embedding 微调要多少数据？」** 答：经验值——千级「query-正例-负例」三元组即可见效，万级能逼近专用模型。可以用 LLM 合成训练数据（Self-Instruct 模式）。
- **「维度 3072 太费存储，能不能降维？」** 答：用 Matryoshka 训练（OpenAI text-embedding-3 系列原生支持），可以降到 256 / 512 / 1024 维；降维会带来一定召回率损失、同时显著减少存储占用，但损失幅度与省下的倍率都随降维幅度、语料与评测集而异，本书无法给出可溯源的统一数字，此处按【经验】档处理。
- **「怎么评估 Embedding 微调有没有用？」** 答：建 500 条 golden set（query + 正确答案文档），分别用原 Embedding 与微调 Embedding 跑召回，看 Recall@10 / MRR 是否提升；同时用 BEIR / MTEB 验证微调没有灾难性遗忘。

**5. 参考资料**

- BAAI（智源研究院）2024 年发布的 BGE-M3 论文《BGE M3-Embedding: Multi-Lingual, Multi-Functionality, Multi-Granularity Text Embeddings Through Self-Knowledge Distillation》——当前中文 / 多语言 Embedding 的事实标准。
- OpenAI 官方关于 text-embedding-3 与 Matryoshka Representations 的文档（2024）——降维 Embedding 的官方机制说明。
- MTEB / BEIR / C-MTEB 排行榜（Hugging Face 持续维护）——主流 Embedding 模型在 100+ 数据集上的标准化对比。
- ColBERTv2 原始论文（Khattab & Zaharia 2022）《ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction》——晚交互 Embedding 的工业范式。
- Databricks 公开技术博客中关于 Embedding Fine-tuning 的文章——企业级 Embedding 微调的工程范式与数据准备方法（该博客的确切题名与链接本节无法给出，引用时请自行查证）。
- 阿里达摩院 2023-2024 公开的中文 Embedding 评测报告——中文 Embedding 选型的本土化对照参考（该报告的确切名称、发布时间与链接本节无法给出，引用时请自行查证）。
- **微众银行的金融 Embedding 微调** —— 基于 BGE 在信贷场景做领域微调的工业实践，处理金融术语 OOD 与稀有实体表达力不足问题。
- **网易雷火的游戏 Embedding 选型** —— 多语种游戏场景下 BGE-M3 与 OpenAI 的对比经验，覆盖中英日韩多语种商品 / 剧情 / NPC 语料。
- **京东数科的商品 Embedding 体系** —— 电商场景长尾 SKU 描述的 Embedding 微调与 Matryoshka 降维经验，处理亿级 SKU 的成本与召回率平衡。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量与性能数字（PB 级、延迟、成本倍数等），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。具体链接请以官方文档当前版本为准。

---

### 8.5 §5.4 混合检索与多路召回融合

> 本主题考察「召回层的工程」：单一向量召回的召回率天花板经验上在 70-80%（该区间为工程经验估计，本书无法给出可溯源的统一数字，此处按【经验】档处理），生产级 RAG 几乎必须走混合检索——向量 + BM25 + KG + 标量过滤，并解决多路召回的融合问题。

#### §5.4.1 在生产级 RAG 系统中，为什么要采用混合检索（Hybrid Search）？请说明向量召回与 BM25 召回各自的强弱点，并阐述向量 + BM25 + 知识图谱 + 标量过滤的多路召回如何融合（RRF / 加权融合），以及如何处理权限与时间过滤。

**1. 考察点**

- 是否理解**单一向量召回的天花板**——Embedding 模型的语义理解能力有限，精确匹配（型号、ID、专有名词、时间）天生弱。
- 能否说出 BM25 与向量召回的**互补性**：BM25 擅长精确匹配（关键词、实体、ID），向量召回擅长语义近邻。
- 是否知道 RRF（Reciprocal Rank Fusion，逆序排名融合）的**工程优势**——无需归一化、对单路打分尺度不敏感，已成为事实标准。
- 加分项：能讲出**标量过滤（Scalar Filtering）**——按时间 / 部门 / 权限过滤——以及**元数据感知检索（Metadata-aware Retrieval）** 在生产 RAG 中的关键作用。

**2. 参考答案框架**

**第一层：单一向量召回的天花板。** 向量召回依赖 Embedding 模型——但 Embedding 模型在以下场景失效：

- **精确匹配**：型号、ID、专有名词（新出现的术语、产品 SKU）。向量召回可能命中「看起来相似但不是同一个」的文档。
- **数字 / 时间**：查询「2024 年 Q3 营收」，向量召回可能命中「2023 年 Q4 营收」。
- **多语言 / 跨语种**：英文 query 在中文文档库上召回率极低。
- **罕见词 / 领域黑话**：Embedding 模型对训练分布外的术语表达力不足。

**第二层：BM25 与向量召回的互补。** Robertson & Zaragoza 2009 年提出的 BM25（Best Matching 25）算法基于 TF-IDF 思想：

- **优点**：精确匹配强、可解释（哪些词命中）、对稀有词敏感、不需要训练。
- **缺点**：无语义理解（近义词「汽车 / 车辆」不匹配）、不处理词序。

向量与 BM25 的融合能用「精确 + 语义」双剑合璧——这是 Elastic Search 8.0+ 默认开启 Hybrid Search 的原因，也是 Microsoft / OpenAI 内部 RAG 系统的标配。

**第三层：融合策略——RRF vs 加权融合。**

- **加权融合（Weighted Sum）**：`score = α · sim_vector + β · score_bm25`。**优点**：直观；**缺点**：两路分数尺度不同，必须先归一化（min-max / z-score），且 α / β 需要调参。
- **RRF（Reciprocal Rank Fusion，Cormack 2009）**：`score(d) = Σ 1 / (k + rank_r(d))`，k 通常 60。**优点**：无需归一化、对单路打分尺度不敏感、几乎不需要调参；**缺点**：忽略了实际分数差异（只关心排名）。
- **Learn-to-Rank**：用 LambdaMART / LightGBM 等学习最佳融合权重。需要标注数据，工业界只在 P0 场景用。

**工业实践**：Qdrant、Weaviate、Milvus 都内置 RRF，Elasticsearch 8.0+ 的 RRF 实现是开源参考。Cormack 等人 2009 年在 SIGIR 提出 RRF 时，验证的是「按各路排名倒数融合」在 TREC 检索集上优于 Condorcet 融合与单路排序学习，并没有做过「RRF 在 MTEB 一类评测上总优于加权融合」的结论；这一强断言本身也不成立——两路召回质量相近时 RRF 更稳、几乎无需调参，两路质量差异较大时，归一化后调好权重的线性 / 凸组合常能反超 RRF。

**第四层：标量过滤与元数据感知检索。** 混合检索的「召回 + 过滤」必须在**向量召回之前**完成（pre-filter），而不是召回之后（post-filter），否则召回结果会被过滤掉一大半。

- **时间过滤**：`timestamp > 2024-01-01 AND timestamp < 2024-12-31`。注意：post-filter 会让 Recall 急剧下降（召回 100 个，过滤后剩 5 个），所以**必须 pre-filter**。
- **权限过滤**：每个用户只能看自己有权限的文档——必须从向量库 metadata 里按用户 ID 过滤。
- **部门 / 业务线过滤**：金融部门只能查金融文档，技术部门只能查技术文档。
- **索引设计**：把过滤字段做成「标量索引 + 向量索引」的复合索引（HNSW + IVF-PQ + 标量 bitmap）。Weaviate / Vespa / Milvus 2.4+ 都支持。

**第五层：知识图谱（KG）召回的加入。** 当问题涉及**关系推理 / 多跳**（如「A 公司的董事长的配偶还投资了哪些公司？」），向量召回和 BM25 都不擅长，需要 KG 召回（Cypher / SPARQL 查询）。多路召回变成：

```
[Vector Recall] ─┐
[BM25 Recall]   ─┼─→ [RRF 融合 / 加权融合] → [Rerank] → [LLM]
[KG Recall]     ─┘
```

**第六层：召回顺序与并行。** 多路召回应**并行执行**（而非串行），用 `asyncio.gather` 或 LangChain 的 `EnsembleRetriever`。典型耗时：向量 50ms、BM25 20ms、KG 100ms，并行总耗时 ~100ms（max 而非 sum）；以上为工程经验量级，随索引类型、数据规模与硬件而异，本书无法给出可溯源的统一数字，此处按【经验】档处理。

**3. 常见陷阱**

- **只用向量召回。** 这是 PoC 阶段的常见做法，但生产环境召回率天花板经验上在 70-80%（本书无法给出可溯源的统一数字，此处按【经验】档处理），无法满足 90%+ 的 SLA。
- **用加权融合 + 不归一化。** BM25 分数可能 0-100，向量余弦 0-1，直接相加会让向量项被淹没。必须归一化或改用 RRF。
- **Post-filter。** 召回 100 个再过滤，剩 5 个——召回率雪崩。必须 pre-filter（向量库支持条件检索）。
- **KG 召回放最后。** KG 召回与向量召回的失败模式不同，应该并行而不是串行。
- **不处理权限。** 召回阶段不做权限过滤，等于把内部机密文档暴露给所有用户——这是 RAG 安全事故的 TOP 1。
- **RRF 的 k 值乱设。** Cormack 原始论文推荐 k=60，但实际数据集上 k=10-100 都试过，没有银弹，应该在自己的数据集上评测。

**4. 追问预测**

- **「RRF 和加权融合怎么选？」** 答：默认 RRF（无需归一化、几乎不需要调参），仅在有大量标注数据 + 想学最优权重时用 Learn-to-Rank（LambdaMART / LightGBM）。
- **「向量 + BM25 召回后怎么知道哪条起关键作用？」** 答：要么看 RRF 排序（贡献排名），要么用 SHAP 分析融合模型的特征重要性；还可以看 Rerank 前的 Recall@K——如果 BM25 那路召回的文档经常出现在 Top-K 里，说明 BM25 在该领域权重应该更大。
- **「怎么评估 Hybrid Search 的效果？」** 答：在 golden set（query-正确文档）上跑 Recall@10 / MRR / nDCG，对比「单向量」「单 BM25」「向量 + BM25」「向量 + BM25 + KG」四种配置。
- **「多路召回的延迟怎么压？」** 答：并行执行（`asyncio.gather`）+ 缓存（相同 query 的召回结果缓存）+ 早期过滤（pre-filter 减少召回量）+ ANN 索引（HNSW / IVF / DiskANN 替代 Brute Force）。

**5. 参考资料**

- Cormack、Clarke、Buettcher 2009 年发表于 SIGIR 的《Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods》——RRF 融合算法的原始论文。
- Elasticsearch 8.0+ 官方文档中关于 RRF 与 Hybrid Search 的章节——头部搜索引擎对混合检索的工业级实现。
- Weaviate / Qdrant / Milvus 官方文档中关于 Hybrid Search 的章节——主流向量库对混合检索的内置支持与最佳实践。
- 阿里云百炼 RAG 平台公开文档（2024）——国内云厂商关于「向量 + BM25 + 元数据过滤」的工程实践总结。
- Vespa（Yahoo 开源）官方文档——支持向量 + 标量 + 表达式复杂过滤的工业级检索引擎，是 Hybrid RAG 的典型实现。
- **蚂蚁集团的金融 RAG 多路召回** —— 信贷文档场景向量 + BM25 + 权限标量过滤的工业级 Hybrid Search 实践，处理金融敏感数据的权限隔离。
- **京东的电商搜索多路召回融合** —— 商品标题 BM25 + 类目 Embedding + 标量属性过滤的电商 RAG 召回架构，处理长尾 SKU 的精确匹配。
- **微医的医疗混合检索** —— 医学文献 + 病历 + 药品说明书的向量 + 关键词 + KG 三路召回融合，是医疗领域 Hybrid RAG 的代表实践。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量与性能数字（PB 级、延迟、成本倍数等），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。具体链接请以官方文档当前版本为准。

---

### 8.6 §5.5 Reranker 与上下文压缩

> 本主题考察「Post-Retrieval 优化」：Reranker 与 Contextual Compression 是 Advanced RAG 区别于 Naive RAG 的核心——能显著抬高召回率的上限（提升幅度高度依赖数据集与召回基线，本书无法给出可溯源的统一数字，此处按【经验】档处理）。

#### §5.5.1 请解释 Reranker（精排器）在 RAG 系统中的作用，对比 Bi-Encoder 与 Cross-Encoder 的差异，并说明 Cohere Rerank 3 / BGE-reranker / ColBERTv2 三种主流 Reranker 的选型。同时请说明 Contextual Compression（上下文压缩）解决的具体问题与常见实现方式。

**1. 考察点**

- 是否理解 Reranker 是**Advanced RAG 区别于 Naive RAG 的关键**——Bi-Encoder 召回 + Cross-Encoder 精排是当前 RAG 召回率提升的核心机制（提升幅度随数据集与召回基线而异，本书无法给出可溯源的统一数字，此处按【经验】档处理）。
- 能否说清 Bi-Encoder 与 Cross-Encoder 的**速度 / 精度取舍**——Bi-Encoder 编码后向量可离线索引、检索快；Cross-Encoder 必须 query + doc 同时输入、慢但准。
- 是否知道 Cohere Rerank 3 / BGE-reranker / ColBERTv2 在**精度、速度、成本、自托管**四个维度的差异。
- 加分项：能讲出 Contextual Compression 解决的「Lost-in-the-Middle」问题，以及具体实现方式（LLM 提取、Embedding 过滤、句段重排）。

**2. 参考答案框架**

**第一层：Reranker 为什么必须存在。** 向量召回（Bi-Encoder）有三个根本局限：

- **训练目标不一致**：Bi-Encoder 在训练时用对比学习优化「语义近邻」，但 RAG 需要的是「问题与文档的相关性」——这两个目标不完全对齐。
- **向量空间压缩**：把 doc 压缩成一个向量，必然丢失信息。
- **无 query 上下文**：doc 的向量不依赖 query，而 doc 与 query 的相关性依赖 query。

Reranker（Cross-Encoder）解决的就是这三个问题——把 query 与 doc 同时输入 Transformer，让模型在「看到了 query 之后再判断 doc 是否相关」。**经验数据（【经验】档）**：Reranker 通常能显著抬高 Recall@10（提升幅度高度依赖数据集与召回基线，本书无法给出可溯源的统一数字，此处按【经验】档处理），是 Advanced RAG 投入产出比最高的优化。

**第二层：Bi-Encoder vs Cross-Encoder。**

| 维度 | Bi-Encoder | Cross-Encoder |
| --- | --- | --- |
| 编码方式 | query 和 doc 分别编码 | query + doc 拼接编码 |
| 速度 | 快（离线编码 + ANN 索引） | 慢（每次检索都要重新编码） |
| 精度 | 中（损失 doc-query 交互） | 高（full self-attention） |
| 存储 | 存向量（KB-MB） | 不存向量 |
| 适用 | 海量库检索 | 精排 Top-K |
| 代表 | BGE / OpenAI Embedding | Cohere Rerank / Cross-Encoder / MonoT5 |

**生产实践**：Bi-Encoder 召回 Top-100 → Cross-Encoder 精排 → Top-5 喂给 LLM。这是当前 Advanced RAG 的事实标准。

**第三层：三种主流 Reranker 选型（另附两类常见补充）。**

- **Cohere Rerank 3**：闭源商业 API，多语言 SOTA（含中文），延迟 ~200ms，按 query 计费（$1-2 / 1000 次）（以上延迟与价格数值随套餐、区域与负载而异，本书无法给出可溯源的统一数字，此处按【经验】档处理）。**优点**：开箱即用、效果好；**缺点**：数据出境、成本高、定制性弱。**适用**：多语言场景 + 有预算。
- **BGE-reranker（BAAI 开源）**：开源中文 SOTA。`bge-reranker-large` 隐层维度 1024、最大输入长度 512 token（参数量约 560M），GPU 推理延迟 ~50ms（该延迟随显卡型号、batch 大小与序列长度而异，本书无法给出可溯源的统一数字，此处按【经验】档处理）。**优点**：中文强、可自托管；**缺点**：单 GPU 推理有 QPS 上限、需要部署推理服务。
- **ColBERTv2（晚交互）**：介于 Bi-Encoder 和 Cross-Encoder 之间——对每个 token 都编码，但不在编码时计算交互，而是在检索后做 token 级 MaxSim。**优点**：精度接近 Cross-Encoder，推理速度显著快于 Cross-Encoder（具体倍数随候选规模、序列长度与实现而异，本书无法给出可溯源的统一数字，此处按【经验】档处理）；**缺点**：存储大（每个 token 存向量）。
- **LLM-as-Reranker**：让 GPT-4 / Claude 直接给候选文档打分。**优点**：效果好、可解释（让 LLM 解释为什么相关）；**缺点**：极贵、极慢（每次要调用大模型）、不适用高 QPS。
- **RankT5 / MonoT5**：经典 T5-based Reranker，单 GPU 推理快，精度中等。**适用**：成本敏感 + 自托管。

**第四层：Contextual Compression 解决什么问题。** 即使 Reranker 把 Top-5 召回出来，每个 chunk 里仍可能有大量无关内容（如文档开头 / 结尾的废话、跨段噪声）。这些噪声会：

- **污染 prompt**：LLM 被无关内容干扰，生成答案质量下降。
- **浪费 token**：长 chunk 占用上下文窗口，减少有效信息密度。
- **触发「Lost-in-the-Middle」**：Liu 等人 2023 年论文《Lost in the Middle》证明 LLM 对 prompt 中间位置的注意力最弱——chunk 太长会让关键信息「沉到中间」。

**第五层：Contextual Compression 的四种实现。**

- **LLM 提取**：让 LLM 从 chunk 里提取与 query 相关的句子。精度高、慢且贵。
- **Embedding 过滤**：把 chunk 切成句子，每个句子算与 query 的相似度，保留 Top-N 句子。LangChain 的 `EmbeddingsFilter`。
- **LLMChainExtractor**（LangChain）：用 LLM 链式提取。
- **Sentence-window Retrieval**（LlamaIndex）：检索时返回 Top-K 句子，但送入 LLM 时把句子所在的整个 chunk 都包含进去——保留局部上下文。

**第六层：Rerank + 压缩的顺序。** 业界主流做法是「Rerank → Compression」——先精排保留 Top-5，再压缩每条 chunk 的内部噪声；少数情况「Compression → Rerank」——先压缩再精排，但计算量更大。

**3. 常见陷阱**

- **不用 Reranker。** 这是 Naive RAG 时代的最大遗留问题——不加 Reranker，召回率天花板经验上约七成（本书无法给出可溯源的统一数字，此处按【经验】档处理），再调 Embedding 也上不去。
- **Reranker 用错模型。** 用 Bi-Encoder 当 Reranker（精度不够），或用 Cross-Encoder 直接对 1000 个候选精排（太慢）。必须 Top-100 召回 → Cross-Encoder 精排。
- **LLM-as-Reranker 滥用。** LLM 极贵极慢，只在 P0 高价值场景（每条 query 价值 $5+）才用。
- **只 Rerank 不压缩。** Reranker 提到 Top-5 后不压缩，prompt 里依然全是噪声。
- **Reranker 微调忽视领域性。** 通用 BGE-reranker 在法律 / 医疗领域效果有限，需要领域微调。
- **不评估 Reranker 增益。** 上线 Reranker 不看 Recall@10 变化，可能引入了负向优化（罕见场景下 Reranker 反而选错）。

**4. 追问预测**

- **「为什么不用 GPT-4 直接精排？」** 答：成本与延迟——GPT-4 输入 100 个候选 + 1 个 query = 几万 token，单次 query 成本 $0.5+、时间 5-10 秒（成本与耗时随候选数与上下文长度而异，本书无法给出可溯源的统一数字，此处按【经验】档处理）。生产 RAG 单次 query 预算通常 < $0.05、延迟 < 2 秒，GPT-4 不可承受。
- **「Reranker 上线后效果反而下降，怎么办？」** 答：先看是召回 Top-10 命中但 Top-5 漏掉，还是 Top-10 都没命中；前者是 Reranker 模型问题（换 BGE-reranker 或 Cohere Rerank），后者是召回问题（召回阶段就没准备好，加 Reranker 也救不了）。
- **「上下文压缩会不会丢失关键信息？」** 答：有可能——LLM 提取可能漏掉隐含信息、Embedding 过滤可能误杀边界信息。必须用 RAGAS 的 `context_recall` 评估压缩前后的召回率变化。
- **「BGE-reranker 部署成本多高？」** 答：单卡 A10 / L4 即可部署 bge-reranker-large，QPS ~50-100（batch 32）；如果 QPS > 100，用 vLLM / TensorRT-LLM 加速，可达 QPS 500+（以上吞吐量为工程经验量级，随显卡型号、序列长度与 batch 策略而异，本书无法给出可溯源的统一数字，此处按【经验】档处理）。

**5. 参考资料**

- Cohere 官方关于 Rerank 3 的产品文档（2024）——商业 Reranker 的工业标杆。
- BAAI 智源研究院公开的 BGE-reranker 模型卡与论文（2023-2024）——中文 Reranker 事实标准。
- Omar Khattab & Matei Zaharia 2020 年关于 ColBERT 的原始论文，以及 2022 年 ColBERTv2 论文——晚交互 Reranker 的工程化范式。
- LangChain 官方文档中 `ContextualCompressionRetriever` 与 `EmbeddingsFilter` 的章节——上下文压缩的标准实现。
- Anthropic 关于 Claude 长上下文与「Lost in the Middle」问题的官方讨论——头部 LLM 厂商对 prompt 噪声问题的研究。
- **中信证券的研报 Reranker** —— 投研场景基于 BGE-reranker 做金融领域微调，处理研报中专有名词 / 财务术语的精排召回问题。
- **米哈游的 NPC 对话精排** —— 游戏剧情 RAG 中 BGE-reranker + LLM-as-Reranker 组合精排实践，处理多 NPC 一致性与世界观约束。
- **顺丰的客服 SOP 精排** —— 物流客服场景下 Bi-Encoder + Cross-Encoder 精排的 RAG 召回率提升实践，处理工单分类与政策匹配的语义对齐。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量与性能数字（PB 级、延迟、成本倍数等），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。具体链接请以官方文档当前版本为准。

---

### 8.7 §5.6 Agentic RAG 与 GraphRAG

> 本主题考察「2024-2025 的前沿演进」：Agentic RAG 与 GraphRAG 是当前最热的两条路径，能解决 Advanced RAG 解决不了的「多跳推理」「宏观问题」「跨系统」难题——但代价是复杂度、成本与可观测性。

#### §5.6.1 请系统说明 Agentic RAG（智能体驱动的 RAG）与 GraphRAG（图增强 RAG）相对于 Advanced RAG 的核心差异与适用场景，并阐述二者在工业落地时的成本、可观测性、错误传播等关键挑战，以及 Self-RAG、CRAG 等反思机制如何缓解这些挑战。

**1. 考察点**

- 是否理解 Agentic RAG 的**本质是「让 LLM 自主编排检索」**——不再是固定的「向量召回 → Rerank → 生成」，而是「Agent 决定查什么 / 何时查 / 怎么组合」。
- 能否区分 GraphRAG 的**两种检索范式**——Local Search（基于实体的局部检索）vs Global Search（基于社区摘要的全局检索）。
- 是否知道 Agentic RAG 的**主要风险**——成本（多次 LLM 调用）、可观测性（决策路径难复现）、错误传播（一步错步步错）。
- 加分项：能说出 Self-RAG 与 CRAG 的差异——前者是「生成中反思」、后者是「检索后反思 + Web fallback」。

**2. 参考答案框架**

**第一层：Advanced RAG 的局限。** Advanced RAG 在「单跳 + 明确问题 + 内部知识」场景下表现良好，但在以下场景失效：

- **多跳推理**：「A 公司的董事长的配偶还投资了哪些公司？」需要先查 A 公司 → 查董事长 → 查配偶 → 查投资——单次向量召回无法解决。
- **宏观问题**：「公司今年的整体战略是什么？」需要跨多文档的全局视角，单次 Top-K 召回不够。
- **跨系统查询**：「Q3 营收 + 同时对比 Q3 研发投入」需要同时调用 RAG（文档）+ SQL（数据库）+ Web Search（外部数据）。
- **动态问题**：「今天的新闻 / 最新公告」需要 Web 搜索兜底。

**第二层：Agentic RAG 的核心机制。** Agentic RAG 由 LLM 智能体自主决定检索路径。典型架构（LangGraph 实现）：

```
[Question] → [Agent 推理] → 决定调用哪个工具 → [Tool 执行] → [观察结果]
                                                          ↓
                                          [继续推理 / 整合 / 生成答案]
```

Agent 可以调用多种工具：

- `search_knowledge_base(query)`——向量 / BM25 召回。
- `query_database(sql)`——结构化数据查询。
- `search_web(query)`——Web 搜索（兜底）。
- `query_kg(cypher)`——知识图谱查询。
- `lookup_entity(entity_id)`——实体检索。

**工业实践**：Anthropic Claude + Tool Use、阿里通义晓蜜 Agent、字节扣子（Coze）、Salesforce Agentforce 都是 Agentic RAG 的工业实现。LangChain LangGraph 是当前 Agentic RAG 工程化的事实框架。

**第三层：GraphRAG 的核心机制。** Microsoft Research 2024 年发布的 GraphRAG 通过「KG + 社区检测 + 摘要」实现宏观问题检索：

1. **KG 抽取**：用 LLM 从文档里抽实体、关系、事件，构成 KG。
2. **社区检测**：用 Leiden 算法（Traag 等人 2019）把 KG 划分成社区（communities）。
3. **社区摘要**：用 LLM 为每个社区生成摘要（community summary）。
4. **检索**：
   - **Local Search**：基于实体 → 找邻居实体 → 找所在社区 → 返回实体 + 邻居 + 社区摘要。
   - **Global Search**：基于社区摘要 → 跨社区聚合 → 生成宏观答案。

**典型优势**：擅长「公司今年的整体战略是什么」「这些项目之间有什么关联」类宏观问题——这是向量 RAG 永远做不到的。

**第四层：Self-RAG 与 CRAG 的反思机制。**

- **Self-RAG**（ICLR 2024）：LLM 在生成 token 时插入四个特殊反思 token——`[Retrieve]`（是否需要检索）、`[IsRel]`（检索结果是否相关）、`[IsSup]`（生成是否被检索支持）、`[IsUse]`（生成是否有用）。这些 token 由 LLM 在 fine-tune 时学到，推理时动态决定是否再检索。
- **CRAG（Corrective RAG，Yan 等人 2024）**：检索后用一个 evaluator 给检索结果打分（high / medium / low confidence）：
  - high → 直接使用。
  - medium → 用 Knowledge Refinement 过滤 + 重组。
  - low → 触发 Web Search Fallback。

CRAG 的工程价值是「承认 RAG 会失败，并且准备好 fallback」——这是从「理想化系统」走向「生产可用系统」的关键。

**第五层：工业落地的关键挑战。**

| 挑战 | Agentic RAG | GraphRAG |
| --- | --- | --- |
| 成本 | 高（5-10 次 LLM 调用/query） | 极高（KG 构建 + 摘要都耗 LLM） |
| 延迟 | 高（5-15 秒） | 极高（KG 构建几小时 + 检索几秒） |
| 可观测性 | 差（决策路径难复现） | 中（KG 可视化，但 LLM 摘要难审计） |
| 错误传播 | 严重（一步错步步错） | 中（KG 错误会污染所有检索） |
| 适用问题 | 多跳、跨系统、复杂决策 | 宏观问题、跨文档推理 |
| 不适用 | 简单 FAQ（用 Advanced 即可） | 精确事实查询（用 SQL / Cypher 即可） |

> 注：上表中的 LLM 调用次数、延迟量级等工程数值均为本书的经验估计，实际数值随实现方式、模型选型与负载而异，本节无法给出可溯源的统一数字，均按【经验】档处理。

**第六层：落地的工程经验。**

- **Agentic RAG 必须限制最大迭代次数**——通常 3-5 步，避免无限循环与成本失控。
- **必须用小模型做路由**——Haiku / GPT-4o-mini 判断「是否需要进一步检索」，只有需要时才升级到大模型。
- **GraphRAG 必须分阶段上线**——先建 KG（一次性 / 周更），再做社区检测与摘要（离线），最后接入检索（在线）。不能在每次 query 时重建 KG。
- **必须保留 fallback**——CRAG 的 Web Search Fallback 是生产 RAG 的必备兜底，不能在 RAG 失败时让 LLM 自由发挥（幻觉）。
- **可观测性基础设施**——Agentic RAG 必须有 trace 系统（LangSmith / LangFuse / Phoenix），记录每一步决策、调用、结果、出错原因。

**3. 常见陷阱**

- **把 Agentic RAG 当万能解。** 简单问题用 Agentic 反而引入不稳定性。永远从 Advanced 开始，按需升级。
- **GraphRAG 滥用。** 所有问题都套 GraphRAG 又慢又贵又差。精确事实查询用 SQL / Cypher，宏观问题才用 GraphRAG。
- **不限制迭代次数。** Agent 无限循环导致单次 query 成本上百美元、延迟分钟级——必须有 hard cap。
- **GraphRAG 在线建 KG。** 每次 query 都重建 KG 是性能灾难。KG 必须离线、增量、周更或月更。
- **忽略错误传播。** Agent 第一步错了，后续每一步都错——必须把 RAGAS 评估做到 step 级（每个工具调用都评估）。
- **不用 fallback。** 没有 Web Search Fallback 的 RAG 在「内部知识没覆盖」时一定会幻觉。
- **不审计 KG。** LLM 抽 KG 会出错（实体拼写错误、关系错位），必须做 KG 质量校验（人工抽检 + 规则校验）。

**4. 追问预测**

- **「Agentic RAG 一次 query 调用了 8 次 LLM，成本 $0.5，怎么压？」** 答：四招——① 用小模型做路由（Haiku / GPT-4o-mini）；② 缓存子查询结果（同一子查询复用）；③ 限制迭代次数（3-5 步）；④ 用 DSPy 自动优化 prompt / 模型路由。
- **「GraphRAG 的社区摘要多久更新一次？」** 答：取决于业务变化频率——新闻类每天更新、企业战略类季度更新、产品手册类每周更新。更新时只对变化的部分做增量摘要，全量重建成本过高。
- **「Self-RAG 需要 fine-tune 吗？」** 答：原始 Self-RAG 需要在生成反思 token 的 LLM 上 fine-tune（Akari 等人 ICLR 2024 论文）；变种做法是用 prompt engineering 引导通用 LLM 输出反思 token（精度略低但成本低）。
- **「CRAG 的 evaluator 怎么实现？」** 答：三种实现——① 小模型分类（DistilBERT / BERT-base 训练二分类）；② LLM 评分（GPT-4 / Claude 打 1-5 分）；③ 多信号融合（结合向量相似度 + 关键词命中 + LLM 评分加权）。

**5. 参考资料**

- Microsoft Research 2024 年发布的 GraphRAG 公开论文与开源仓库——GraphRAG 范式的原始出处，Local Search / Global Search 的范式划分。
- Akari Asai 等人 2024 年 ICLR 发表的《Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection》——Self-RAG 的原始论文与反思 token 机制。
- Shi-Qi Yan 等人 2024 年发表的《Corrective Retrieval Augmented Generation (CRAG)》——CRAG 的可校正检索范式。
- LangChain 官方文档关于 LangGraph 与 Agentic RAG 的章节（2024-2025）——Agentic RAG 工程化的事实标准框架。
- Anthropic 关于 Claude + Tool Use + Agentic Workflow 的官方文档——头部 LLM 厂商对 Agentic RAG 落地范式的官方表述。
- 阿里通义晓蜜 / 字节扣子（Coze）/ 百度千帆 AppBuilder 公开技术文档——国内 Agentic RAG 平台的工业实践。
- **蚂蚁集团的金融 Agentic RAG** —— 信贷场景下 Tool Use + 多源查询的 Agentic RAG，处理跨数据源复杂业务问答（产品 + 征信 + 流水 + 客服）。
- **滴滴的出行 Agentic RAG** —— 订单 + 司机 + 路线 + 天气多源工具调用的 Agentic 工作流，处理出行场景下复杂多跳决策问题。
- **平安好医生的医疗 Agentic RAG** —— 导诊 + 药品 + 医生排班多系统调用的 GraphRAG + Agentic 实践，处理医疗咨询的跨域推理需求。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量与性能数字（PB 级、延迟、成本倍数等），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。具体链接请以官方文档当前版本为准。

---

### 8.8 §5.7 RAG 评估与线上监控

> 本主题考察「RAG 的可观测性」：没有评估就没有迭代——上线 RAG 必须建三层评估体系（离线 / 在线 / 用户反馈），否则「凭感觉调参」注定失败。

#### §5.7.1 请系统说明 RAG 系统的评估指标体系（RAGAS / TruLens / ARES），并阐述如何构建离线的 Golden Set、自动化评估流水线、线上监控大盘与用户反馈闭环，以及如何在 CI / CD 中卡住「召回率下降」的部署。

**1. 考察点**

- 是否理解 RAG 评估的**三层体系**——离线（Golden Set + 自动化指标）、在线（监控大盘）、用户反馈（赞 / 踩回流）。
- 能否说出 RAGAS 的核心指标——`context_relevance` / `faithfulness` / `answer_relevancy` / `context_recall`——以及每个指标衡量什么。
- 是否知道 LLM-as-Judge 的**局限性**（LLM 评 LLM 会偏差），以及如何与人工评估结合。
- 加分项：能讲出 CI / CD 中如何卡住「召回率下降 X%」的部署，以及用 shadow deployment 做新版本对账。

**2. 参考答案框架**

**第一层：RAG 评估的三个维度。** RAG 系统的输出可以被拆成三个独立维度分别评估：

- **检索质量（Retrieval Quality）**：`context_relevance`（召回的 chunk 是否与 query 相关）、`context_recall`（正确答案是否被召回）。
- **生成质量（Generation Quality）**：`faithfulness`（答案是否忠实于召回的 chunk）、`answer_relevancy`（答案是否回答了 query）。
- **端到端质量**：`answer_correctness`（答案是否正确）、`answer_similarity`（答案与 ground truth 的相似度）。

这三个维度独立评估，才能定位问题——`faithfulness` 低说明 LLM 没读懂召回；`answer_relevancy` 低说明召回对了但 LLM 答错了；`context_recall` 低说明召回本身有问题。

**第二层：主流评估框架。**

- **RAGAS**（2024 开源）：RAG 专用评估框架，核心指标 `context_relevance` / `faithfulness` / `answer_relevancy` / `context_recall`，用 LLM-as-Judge 实现。**优点**：开源、与 LangChain / LlamaIndex 集成好；**缺点**：依赖 LLM-as-Judge，会引入 LLM 偏差。
- **TruLens**（开源）：LLM 应用评估框架，提供 `context relevance` / `groundedness` / `answer relevance` 三个核心指标，与 LangSmith / LlamaIndex 集成。
- **ARES**（Stanford 2024）：自动化 RAG 评估框架，使用 LM-Cocktail + LLM-as-Judge 做自动评估（LM-Cocktail 与 ARES 的对应关系本节无法核对，引用时请自行查证），精度优于纯 LLM-as-Judge（具体幅度随数据集与评测口径而异，本书无法给出可溯源的统一数字，此处按【经验】档处理），但需要训练数据。
- **LangSmith / LangFuse**：端到端调试 + 评估平台，提供 trace 可视化、golden set 管理、A/B 测试框架。

**第三层：离线 Golden Set 的构建。**

- **数据来源**：真实用户 query（去标识化）+ 人工标注「正确答案」「正确文档」。
- **规模**：500-5000 条起步，垂直领域可上万。
- **标注规范**：每个 query 必须有标准答案 + 至少 1 个「正确文档」标注（用于算 context_recall）。
- **更新频率**：业务变化 / 模型变化时必须重建；用户反馈持续回流补充。

**第四层：线上监控大盘。** 生产 RAG 必须有实时监控指标：

- **检索层**：Recall@K（在线抽样评估）、延迟（向量召回 / BM25 / KG）。
- **生成层**：Faithfulness（在线抽样）、首 token 延迟、生成 token 数。
- **业务层**：一次解决率、用户赞 / 踩率、引用点击率。
- **系统层**：QPS、错误率、成本 / query。

**第五层：用户反馈闭环。** 「用户赞 / 踩」必须回流到 Golden Set——每周把「被踩」的 query 拉出来人工标注，加入下个版本的评测集。这是 RAG 系统长期迭代的唯一可持续路径。

**第六层：CI / CD 集成。** 用 LangSmith / LangFuse + GitHub Actions / GitLab CI 实现：

- 新版本 RAG 跑离线 Golden Set，对比基线——如果 `context_recall` 下降 > 2% 或 `faithfulness` 下降 > 3%，阻塞部署。
- Shadow Deployment：新旧版本同时跑，新版本结果仅记录不返回，对账 24-48 小时后切换。
- A/B 测试：新版本 10% 流量，对比线上指标 1 周后全量。

**3. 常见陷阱**

- **不建 Golden Set。** 这是 RAG 项目最常见的失败模式——上线后「凭感觉调参」，迭代效率极低。
- **只看 Faithfulness 不看 Context Recall。** Faithfulness 高但答案错误，可能是因为 context_recall 低（没召回正确答案）——必须同时看两个指标。
- **完全依赖 LLM-as-Judge。** LLM 评 LLM 会引入偏差（位置偏差、长度偏差、自偏好），必须用「LLM-as-Judge + 人工抽检」组合。
- **线上不监控。** 上线后没有监控大盘，线上出问题靠用户投诉才发现——这是把 RAG 当 Demo 的标志。
- **用户反馈不回流。** 用户的「踩」没有被收集 / 标注 / 优化，RAG 系统永远不会进化。
- **CI / CD 不卡指标。** 没有自动化的「指标下降 X% 阻塞部署」机制，工程师只能手动看——注定会出事故。

**4. 追问预测**

- **「RAGAS 评估对训练不信任，怎么验证它真的准？」** 答：用人工标注的 100-200 条 golden set 作为「验证集」，对比 RAGAS 自动评分与人工评分的相关性（Spearman / Kendall tau）。如果相关性 < 0.6，说明 RAGAS 在该领域不可信，必须用人工评估。
- **「线上召回率突然下降 20%，怎么排查？」** 答：分层排查——① Embedding 服务是否更新（升级后没重建索引）；② 索引是否被破坏（schema 变更 / 数据回灌异常）；③ 数据源是否变化（文档格式变更导致 Chunking 失效）；④ 模型是否被新版替换（Embedding 模型 / Reranker 升级）。LangSmith / LangFuse 的 trace 是关键诊断工具。
- **「评估指标和业务指标哪个更重要？」** 答：都重要，但优先级是业务指标 > 评估指标——评估指标是手段，业务指标（一次解决率 / 用户满意度 / NPS）是目的。RAGAS 指标上升但一次解决率下降，说明「指标优化」没对准「用户需求」。
- **「人工评估要多少？」** 答：每周 50-100 条抽检（业务代表 + 数据团队双盲），加上所有「被踩」的 query 必标注——这是可持续的最小规模。

**5. 参考资料**

- Shahul ES 等人 2023-2024 年发表的 RAGAS 论文与官方文档——RAG 自动化评估的事实标准，含 `context_relevance` / `faithfulness` / `answer_relevancy` 的原始定义。
- Saad-Falcon、Khattab、Potts、Zaharia（Stanford）2024 年发表于 NAACL 的《ARES: An Automated Evaluation Framework for Retrieval-Augmented Generation Systems》——用 LM-Cocktail 训练领域专属 Judge、把 LLM-as-Judge 做成可校准的 RAG 自动评估流水线的代表论文（ARES 的具体训练技法与效果数字，本节无法核对，引用时请自行查证）。
- LangSmith / LangFuse / Phoenix 官方文档——RAG 端到端调试与评估平台。
- TruLens（TruEra 团队）官方文档——LLM 应用评估框架。
- Databricks 公开的《Building Production-Grade RAG Applications》与 Mosaic AI 评估章节（2024）——企业级 RAG 评估与 CI / CD 集成的工业范式（该篇的确切链接本节无法给出，引用时请自行查证）。
- 阿里云百炼 RAG 平台的评估模块公开文档（2024）——国内云厂商关于 RAGAS + 人工评估的最佳实践总结。
- **招商银行的 RAG 评估体系** —— 银行业 RAGAS + 人工评估 + CI/CD 召回率卡阈值的工业实践，把 Faithfulness 纳入模型上线 gate。
- **微众银行的开源 RAG 评测集** —— 金融领域 RAG 评估 Golden Set 构建与离线评测流水线，对外公开过部分评测基准。
- **屈臣氏的导购 RAG 监控大盘** —— 零售业 RAG 在线 Faithfulness 监控 + 用户赞踩回流闭环，处理导购场景下长尾商品知识持续更新。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客；其中以「XX 公司 + 公开实践 / 公开介绍」形式出现的条目，以及各条中的规模量与性能数字（PB 级、延迟、成本倍数等），本节均无法给出可核验的具体文档名与链接，属【经验】档表述，引用时请自行查证。具体链接请以官方文档当前版本为准。

---

### 8.9 本章小结

本节收录 7 道题，覆盖本章节「RAG 架构」全部 7 个核心主题：范式演进、Chunking、Embedding、混合检索、Reranker、Agentic / GraphRAG、评估体系。七道题构成一条从「链路设计」到「效果验证」的完整下钻链路：

**链路视角**（自上而下）：**范式选型**（§5.1）→ **文档侧工程**（§5.2）→ **向量空间质量**（§5.3）→ **召回层融合**（§5.4）→ **精排与压缩**（§5.5）→ **前沿演进**（§5.6）→ **效果验证**（§5.7）。

**难度视角**：1-3 星题为基本功（必须答出具体参数与选型理由），4 星题为工程深度（必须讲清架构决策与代价），5 星题为前沿理解（必须能讲出 Agentic / GraphRAG 的取舍与可观测性）。

**答题心法**：

1. **先说约束，再列选项，最后说取舍。** 任何 RAG 决策都是「在什么约束下选什么、放弃什么」——没有银弹，只有取舍。
2. **端到端链路 > 单点优化。** RAG 的八段链路里，召回率天花板往往不在最复杂的 Reranker / GraphRAG，而在 Chunking / Embedding / Hybrid Search——先优化链路下界，再谈前沿。
3. **指标驱动 + 用户反馈闭环。** 没有评估就没有迭代；评估指标 + 用户反馈是 RAG 系统长期进化的唯一可持续路径。
4. **成本 / 延迟 / 准确性三角平衡。** Agentic RAG 不是越复杂越好——简单 FAQ 用 Naive / Advanced 即可；GraphRAG 不是越牛越好——精确事实查询用 SQL / Cypher 即可。

### 8.10 返回

- 返回 [04-data-assetization 章节目录](../README.md)
