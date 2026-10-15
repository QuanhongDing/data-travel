> 本文件是 **05-tech-evangelism.md** 的子文件（§5. 总结 + 升华（2 分钟））。完整章节请回到 [index](05-tech-evangelism.md)。

## 5. 总结 + 升华（2 分钟）
- Take-aways
- 未来方向
- 听众行动建议
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**博客平台**：

- **国际**：Medium、Dev.to、Hackernoon、Hashnode。
- **国内**：知乎、掘金、CSDN、思否、InfoQ。

**Conference 平台**：

- **国际**：QCon、ArchSummit、KubeCon、PyCon、RE•WORK、O'Reilly AI。
- **国内**：QCon、ArchSummit、GIAC、DataFun、AICon。

**开源平台**：

- **GitHub**：主流。
- **GitLab**：自托管。
- **Gitee**：国内。

**PPT / 内容制作**：

- **Keynote / PowerPoint**：传统。
- **Figma**：设计感强。
- **Gamma / Tome**：AI 生成 PPT。
- **Canva**：模板丰富。

**视频 / 直播**：

- **YouTube / Bilibili**：视频。
- **Twitch / LinkedIn Live**：直播。
- **Loom**：快速录屏。

**Podcast**：

- **Spotify / Apple Podcasts**：分发。
- **Riverside / SquadCast**：录制。
- **Descript**：编辑 + 转录。

**Newsletter**：

- **Substack / Beehiiv**：Newsletter 平台。
- **ConvertKit**：邮件营销。

**AI 时代工具（2024-2025）**：

- **Gamma / Tome**：AI 生成 PPT。
- **Notion AI**：AI 辅助博客写作。
- **Midjourney / DALL-E**：AI 配图。
- **Descript**：AI 视频 / 音频编辑。
- **ChatGPT / Claude**：AI 内容生成 + 翻译。
- **ElevenLabs**：AI 配音。

### 4.4 代码 / 示例

**示例 1：Conference CFP 模板**

```markdown
# Conference 演讲提案 - 让 RAG 系统准确率达 85% 的 5 个工程实践

## 演讲摘要（200 字）
本文分享我们在生产环境落地 RAG 系统的 5 个关键工程实践：
Embedding Model 选型、Chunk 策略、ReRanker、Query 改写、评估体系。
最终准确率达 85%+、P95 < 500ms，听众可学到可复用的 RAG 落地经验。

## 听众收益
- 掌握 RAG 系统的 5 个关键工程决策
- 了解 RAG 系统的评估方法
- 借鉴真实落地经验，避免常见踩坑

## 演讲者介绍
- 资深数据架构师
- 主导过 3 个 RAG 系统落地
- QCon / ArchSummit 讲师

## 演讲大纲（45 分钟）
1. 业务背景（5 分钟）
2. 关键决策 1：Embedding Model 选型（5 分钟）
3. 关键决策 2：Chunk 策略（5 分钟）
4. 关键决策 3：ReRanker（5 分钟）
5. 关键决策 4：Query 改写（5 分钟）
6. 关键决策 5：评估体系（10 分钟）
7. 踩坑与经验（5 分钟）
8. Q&A（5 分钟）
```

**示例 2：AI 辅助博客写作 Prompt**

```python
BLOG_WRITING_PROMPT = """
你是资深技术布道师。请基于以下技术要点，撰写一篇技术博客。

要求：
1. 风格：通俗易懂 + 工程实用 + 有数据支撑
2. 结构：What → Why → How → Result
3. 字数：2000-3000 字
4. 必须包含：架构图、代码示例、量化数据
5. 结尾：升华到通用经验

技术要点：
{technical_points}

目标读者：
{target_audience}

业务背景：
{business_context}

输出博客全文。
"""
```

---
