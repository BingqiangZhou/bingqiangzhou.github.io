---
title: 【工具分享】一个实用的 YouTube 视频总结 Prompt
published: 2026-05-13
description: 记录一个来自 Reddit 的 YouTube 视频总结提示词，支持时间戳、层级大纲、术语解释、关键引用和摘要，适合配合 Gemini 等 LLM 使用
lang: zh
tags: [工具分享]
---

在 Reddit 的 r/PromptEngineering 社区看到一个[实用帖子](https://www.reddit.com/r/PromptEngineering/comments/1mqqvip/prompt_for_summary_of_the_youtube_video/)（61 upvotes），作者 u/Plus_Top_4243 分享了一个用于总结 YouTube 视频的 Prompt，可以直接丢给 LLM 生成结构化的视频笔记。

## Prompt 原文

```
You are an expert note-taker and technical explainer. Your job is to carefully process this video: "<视频链接>" and create a set of detailed, organized notes that capture every single concept, term, example, and insight mentioned, in the exact order they appear, without omitting anything.

Instructions:

Watch/Read Everything Fully: Do not skip or summarize too broadly. Include all points, even if they seem minor or repetitive, unless they are literal filler or unrelated chatter.

Time-Stamped Structure: Add timestamps (HH:MM:SS) before each section or key point so I can quickly revisit the exact spot in the video.

Hierarchical Breakdown: Use a clear outline with headings and bullet points:
  H1: Major topics or sections
  H2: Subtopics
  Bullets: Key details, definitions, examples, quotes, code snippets, or formulas.

Definitions & Jargon: Whenever a technical term or acronym is mentioned, explain it clearly in simple terms alongside its definition.

Examples & Analogies: Record every example, analogy, or metaphor given, and note why the speaker used it.

Important Quotes: If the speaker says something notable, write it verbatim inside quotes.

Diagrams & Visual References: If the video shows any diagrams, slides, or visuals, describe them in text so I can recreate them later.

Extra Resources Mentioned: List any books, papers, tools, or websites the speaker references.

Summary Section at the End: After the detailed notes, add:
  A 1-paragraph high-level summary of the video
  A Key Takeaways list with the top 10–15 insights
  A Glossary of all technical terms from the video.
```

## 中文版 Prompt

```
你是一位专业的笔记记录专家和技术讲解者。你的任务是仔细处理这个视频："<视频链接>"，并创建一套详细的、有条理的笔记，按出现顺序完整记录视频中的每一个概念、术语、示例和洞见，不遗漏任何内容。

指令：

完整观看/阅读：不要跳过或过度概括。记录所有要点，即使它们看起来次要或重复，除非是纯粹的填充内容或无关闲聊。

时间戳结构：在每个章节或关键要点前添加时间戳（HH:MM:SS），以便我可以快速回溯视频中的确切位置。

层级分解：使用清晰的标题和要点大纲：
  H1：主要主题或章节
  H2：子主题
  要点：关键细节、定义、示例、引述、代码片段或公式。

术语和行话：每当提到技术术语或缩写时，用简单的语言清楚地解释它，并附上定义。

示例和类比：记录给出的每一个示例、类比或隐喻，并标注演讲者使用它的原因。

重要引述：如果演讲者说了值得注意的话，逐字引用并放在引号中。

图表和视觉参考：如果视频展示了任何图表、幻灯片或视觉内容，用文字描述它们，以便我稍后可以重新创建。

提到的额外资源：列出演讲者引用的所有书籍、论文、工具或网站。

末尾总结部分：在详细笔记之后，添加：
  一段话的视频高层级摘要
  关键要点列表（Top 10-15 洞察）
  视频中所有技术术语的词汇表
```

## 设计亮点

这个 Prompt 的结构很清晰，几个设计点值得学习：

1. **角色设定** — "expert note-taker and technical explainer"，明确了 LLM 的身份和能力边界
2. **时间戳要求** — 强制要求在每个章节和关键点前添加时间戳，方便回溯视频原文
3. **层级大纲** — H1/H2/子弹笔记的三层结构，兼顾宏观框架和细节
4. **术语解释** — 遇到技术术语时用简单语言解释，对技术视频特别有用
5. **视觉描述** — 要求用文字描述视频中的图表和幻灯片，便于后续复现
6. **尾部总结** — 单段摘要 + Top 10-15 洞察 + 术语表的三层总结

## 使用建议

根据评论区的反馈，这个 Prompt **配合 Gemini 使用效果最好**（Gemini 可以直接处理 YouTube 链接）。GPT-5 的表现则不够理想。

如果视频没有字幕/转录文本，LLM 无法直接处理。此时可以先用工具（如 [Transcrisper](https://transcrisper.com/)）提取字幕文本，再把文本贴给 LLM 处理。

## 使用方式

直接将上面的 Prompt 复制，替换 `<视频链接>` 为目标 YouTube 视频 URL，粘贴到 Gemini 中即可。

## 来源

- [Reddit 原帖](https://www.reddit.com/r/PromptEngineering/comments/1mqqvip/prompt_for_summary_of_the_youtube_video/) — 作者 u/Plus_Top_4243
