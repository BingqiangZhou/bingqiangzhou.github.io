---
title: 【学习笔记】文章生成播客(AI Podcast Generation)调研报告
published: 2026-06-15
description: 系统梳理「文章转播客」技术全貌：4 阶段标准工作流、NotebookLM 逆向系统提示词、NotebookLlama/Podcastfy/Mozilla 等开源项目、商业工具横向对比与智谱/通义/MiniMax/讯飞中文生态方案
lang: zh
tags: [学习笔记]
---

> 调研日期:2026-06-15
> 调研范围:文章/文档 → 播客音频的提示词、工作流、开源项目与商业方案
> 说明:本报告每项关键信息均标注了来源链接,便于追溯核实。

<!--

---

## 目录

1. [概述与核心结论](#1-概述与核心结论)
2. [标准工作流架构](#2-标准工作流架构)
3. [提示词(Prompt)设计详解](#3-提示词prompt设计详解)
4. [开源项目与参考实现](#4-开源项目与参考实现)
5. [商业工具与平台对比](#5-商业工具与平台对比)
6. [中文生态方案](#6-中文生态方案)
7. [关键技术难点与研究](#7-关键技术难点与研究)
8. [实施建议](#8-实施建议)
9. [完整信息来源索引](#9-完整信息来源索引)

---

-->

## 1. 概述与核心结论

「文章转播客」的核心范式由 **Google NotebookLM 的 Audio Overview(音频概览)** 功能确立并带火:它将上传的文档(PDF/网页/文本)通过大模型转化为**两位 AI 主持人深度对谈**的播客音频。其本质是一条 **「文本理解 → 对话脚本生成 → 语音合成」** 的多阶段流水线。

> 来源:[Google 官方博客 - NotebookLM now lets you listen to a conversation about your sources](https://blog.google/innovation-and-ai/products/notebooklm-audio-overviews/)

### 三句话结论

1. **技术上完全可复现**:NotebookLM 的"魔法"并非单一模型,而是「**多阶段 LLM 流水线 + 双人设系统提示词 + 双音色 TTS**」的组合,社区已有成熟开源复现(Meta NotebookLlama、Mozilla document-to-podcast、Podcastfy)。
2. **提示词是灵魂**:决定播客质量的不是 TTS,而是**系统提示词中的人设、语气、互动规则与"仅基于源文"的防幻觉约束**——NotebookLM 的系统提示词已被社区逆向工程并公开。
3. **中文生态已成熟**:智谱 AI、阿里通义、MiniMax、科大讯飞等均提供中文播客生成的完整实践与文档,可直接落地。

---

## 2. 标准工作流架构

所有主流方案的架构高度一致,可抽象为 **4 个核心阶段**:

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│ 1. 文档预处理 │ -> │ 2. 脚本生成   │ -> │ 3. 戏剧化重写 │ -> │ 4. 语音合成  │
│ Extract/Clean│    │ Outline+Script│   │ Dramatize    │    │ Dual-TTS    │
└─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
   提取/清洗文本        生成大纲与对话       润色、加互动、      双音色 TTS
   (PyPDF/分块)        (双主持、基于源)     人设强化            (克隆/合成)
```

### 2.1 NotebookLM 疑似内部流程(社区逆向)

社区通过对生成耗时(~5 分钟)与输出的分析,推测其流程为:

1. 创建大纲(Create an outline)
2. 修订大纲(可能多轮)
3. 生成对话片段(Generate dialogue segments)
4. 为每位主持人合成 AI 语音(Synthesize AI voices)

> 来源:[Reddit - NotebookLM Audio Overviews: how it works](https://www.reddit.com/r/notebooklm/comments/1ft58st/notebooklm_audio_overviews_how_it_works/)
> 架构设计访谈:[Latent Space - How NotebookLM Was Made](https://www.latent.space/p/notebooklm)

### 2.2 Meta NotebookLlama 的 4 步流水线(开源、最清晰)

Meta 发布的开源复现,是理解架构的最佳教材:

| 步骤 | 作用 | 使用模型 |
|------|------|----------|
| **Step 1 — PDF 预处理** | 提取、清洗、分块文本 | Llama-3.2-1B / 3B |
| **Step 2 — 转录生成** | 生成双人对话脚本 | Llama-3.1-70B(主力) |
| **Step 3 — 戏剧化重写** | 润色成自然、有吸引力的播客稿 | Llama-3.1-8B |
| **Step 4 — 语音合成** | 文本转音频 | Parler-TTS / Suno Bark |

> 来源:[NotebookLlama 官方 Cookbook](https://www.llama.com/resources/cookbook/how-to-build-notebook-llama/)
> 报道:[TechCrunch - Meta releases an open version of Google's podcast generator](https://techcrunch.com/2024/10/27/meta-releases-an-open-version-of-googles-podcast-generator/)
> 深度解析:[InfoQ - Meta NotebookLlama](https://www.infoq.com/news/2024/11/meta-notebook-llama/)

### 2.3 Mozilla document-to-podcast 的 3 步蓝图

Mozilla AI 的本地优先(local-first)方案,精简为 3 阶段:

1. **文档预处理(Document Pre-Processing)**:提取并清洗文本
2. **播客脚本生成(Podcast Script Generation)**:LLM 驱动的核心阶段
3. **音频生成(Audio Generation)**:开源 TTS 合成双说话人音频

> 来源:[Mozilla AI Blog - Blueprint Deep Dive: Turn Documents into Podcasts Locally](https://blog.mozilla.ai/blueprint-deep-dive-turn-documents-into-podcasts-locally-with-open-source-ai/)
> 官方文档:[mozilla-ai.github.io/document-to-podcast](https://mozilla-ai.github.io/document-to-podcast/step-by-step-guide/)

---

## 3. 提示词(Prompt)设计详解

> ⚠️ 提示词是决定播客质量的核心。以下按「权威程度」排列。

### 3.1 ★★★★★ NotebookLM 逆向工程系统提示词(黄金标准)

社区通过让 Deep Dive 功能"泄漏"以及逆向分析,还原了 NotebookLM Audio Overview 的系统提示词。其核心设计要素:

- **双主持人设定**:一位「热情的讲述者(enthusiastic storyteller)」+ 一位「冷静的分析师(calm analyst)」
- **5 分钟内**完成对源材料的客观且引人入胜的提炼
- **严格仅基于提供的源**(strictly from provided sources)——防幻觉的核心约束
- 面向**时间受限的学习者**
- 包含闲谈(banter)、过渡(transitions)、主持人个性

> 来源:[Baoyu - Google NotebookLM 系统提示词(逆向还原)](https://baoyu.io/blog/google-notebooklm-system-prompt-en)
> 来源:[TheBigPromptLibrary - notebooklm-10202024.md(GitHub)](https://github.com/0xeb/TheBigPromptLibrary/blob/main/SystemPrompts/Google/notebooklm-10202024.md)
> 来源:[Nicole Hennig - Reverse Engineering the System Prompt for Audio Overviews](https://nicolehennig.com/notebooklm-reverse-engineering-the-system-prompt-for-audio-overviews/)
> 来源:[Reddit - I managed to get Deep Dive to leak out quite a bit of the hidden prompt](https://www.reddit.com/r/notebooklm/comments/1gg5201/i_managed_to_get_deep_dive_to_leak_out_quite_a/)

**逆向提示词的核心约束可提炼为以下要点**(用于自建系统提示词时参考):

```
角色:你是两位播客主持人(A=热情讲述者 / B=冷静分析师)
任务:将给定源材料转化为 5-10 分钟的双人深度对谈
硬性规则:
  1. 只能使用提供的源材料中的信息,不得编造(NO HALLUCINATION)
  2. 两位主持人有鲜明、一致的人设与说话风格
  3. 以自然口语进行,包含问候、过渡、感叹、追问
  4. 面向想快速了解要点的忙碌听众
  5. 保持客观,同时引人入胜
```

### 3.2 ★★★★ Mozilla 开源提示词模板(可直接复用)

Mozilla 的 `prompt.py` 提供了结构化、可工程化的提示词实现,定义了:

- 主持人 persona(姓名、人设、语气)
- 对话生成规则
- 输出格式(按说话人标记的脚本,如 `Speaker 1: ...` / `Speaker 2: ...`)

> 源码来源:[document-to-podcast/prompt.py(GitHub)](https://github.com/mozilla-ai/document-to-podcast/blob/main/src/document_to_podcast/inference/model_module/prompt.py)

### 3.3 ★★★★ Together AI 的 Pydantic 结构化方案

Together AI 教程采用 **Pydantic 模型** 定义脚本结构,让 LLM 输出严格结构化的 host/guest 对话,便于下游 TTS 解析:

> 来源:[Together AI - Build an Open Source NotebookLM: PDF to Podcast](https://docs.together.ai/docs/open-notebooklm-pdf-to-podcast)

**优势**:结构化输出避免格式混乱,TTS 可精确切分不同说话人。

### 3.4 ★★★ 社区分享的完整系统提示词(Reddit)

Reddit 用户分享了可直接用于 ChatGPT 项目指令的播客生成器提示词,特点是**面向任意内容生成对话式播客脚本**,社区实测可用。

> 来源:[Reddit r/PromptEngineering - I built a podcast generator prompt for ChatGPT](https://www.reddit.com/r/PromptEngineering/comments/1rn8kao/i_built_a_podcast_generator_prompt_for_chatgpt_so/)

### 3.5 ★★★ 提示词设计的最佳实践(跨来源归纳)

| 最佳实践 | 说明 | 来源 |
|---------|------|------|
| **明确人设** | 为每位主持人定义独特的性格、背景、语气、说话习惯 | [Riverside - 45 AI Prompts for Podcasters](https://riverside.com/blog/ai-chatgpt-prompts-for-podcasters) |
| **具体化"吸引力"** | 不要只写"make it engaging",要指定节奏(如每 3-5 分钟一个 hook)、停顿、追问 | [Medium - The AI Prompt That Turns Podcast Ideas Into Professional Scripts](https://medium.com/towards-generative-ai/the-ai-prompt-that-turns-podcast-ideas-into-professional-scripts-3b4e3ceb9241) |
| **分段结构化** | 使用 intro / segments / transitions / outro 的分段格式,而非自由文本 | 同上 |
| **定义听众画像** | 描述目标听众的痛点和目标,让脚本更有共鸣 | [Riverside](https://riverside.com/blog/ai-chatgpt-prompts-for-podcasters) |
| **跨模型测试** | 同一提示词在 Claude/GPT/Gemini 上效果不同,需迭代 | [HackerNoon - I Built an AI Prompt That Turns Podcast Ideas Into Professional Scripts](https://hackernoon.com/i-built-an-ai-prompt-that-turns-podcast-ideas-into-professional-scriptsand-it-actually-work) |
| **强制仅基于源文** | 明确"只能使用提供的信息",防止幻觉 | NotebookLM 逆向提示词 |

---

## 4. 开源项目与参考实现

### 4.1 Podcastfy(最流行的 Python 替代方案)

- **仓库**:[github.com/souzatharsis/podcastfy](https://github.com/souzatharsis/podcastfy)
- **特点**:多模态输入(文本、图片)、多语言输出、将 PDF/URL/文本转为播客式对话
- **Hacker News 讨论**:[news.ycombinator.com/item?id=41852401](https://news.ycombinator.com/item?id=41852401)
- **评测**:[Medium - From PDF to Podcast: The MIT Tool That Goes Beyond NotebookLM](https://medium.com/@airabbitX/from-pdf-to-podcast-the-mit-tool-that-goes-beyond-notebooklm-39d9cbb86c93)

### 4.2 Meta NotebookLlama(架构最清晰)

- **官方 Cookbook**:[llama.com/resources/cookbook/how-to-build-notebook-llama](https://www.llama.com/resources/cookbook/how-to-build-notebook-llama/)
- **实战教程**:[Analytics Vidhya - Build Your Own NotebookLlama](https://www.analyticsvidhya.com/blog/2025/12/build-your-own-notebookllama/)
- **实战教程**:[Medium - Notebook Llama: An Open Source Guide to Building a PDF to Podcast Workflow](https://medium.com/ai-artistry/notebook-llama-an-open-source-guide-to-building-a-pdf-to-podcast-workflow-e8fceec888a9)

### 4.3 Mozilla document-to-podcast(本地优先蓝图)

- **仓库**:[github.com/mozilla-ai/document-to-podcast](https://github.com/mozilla-ai/document-to-podcast)
- **博客详解**:[blog.mozilla.ai/blueprint-deep-dive](https://blog.mozilla.ai/blueprint-deep-dive-turn-documents-into-podcasts-locally-with-open-source-ai/)
- **社区衍生**:[Readme-to-Podcast(把 GitHub README 转播客)](https://github.com/alexmeckes/readme-to-podcast)

### 4.4 Open Notebook(隐私优先全功能替代)

- **仓库**:[github.com/lfnovo/open-notebook](https://github.com/lfnovo/open-notebook)
- **特点**:本地运行、比 NotebookLM 更强的定制能力
- **评测**:[XDA - I Switched from NotebookLM to This Open-Source Tool](https://www.xda-developers.com/switched-from-notebooklm-to-open-source-tool-open-notebook/)

### 4.5 其他参考实现

| 项目/资源 | 说明 | 来源 |
|-----------|------|------|
| **NVIDIA pdf-to-podcast Blueprint** | NVIDIA 官方的 PDF 转播客蓝图 | [awesome-stars 收录](https://github.com/jxzzlfh/awesome-stars) |
| **S. Anand 的 AI Podcast Generator** | 把任意文本转双人对话的在线工具 | [tools.s-anand.net/podcast/claude.html](https://tools.s-anand.net/podcast/claude.html) |
| **HuggingFace 博客教程** | 含示例提示词的端到端教程 | [huggingface.co/blog/LE15l/make-ai-podcast-using-ai-voices-and-llms](https://huggingface.co/blog/LE15l/make-ai-podcast-using-ai-voices-and-llms) |
| **Omri Lavi 的实践** | 用 LangGraph 编排的完整 AI 播客流水线 | [omrilavi.com/blog/building-ai-podcasts-and-letting-go](https://omrilavi.com/blog/building-ai-podcasts-and-letting-go/) |

### 4.6 开源 TTS 模型(用于语音合成阶段)

| 模型 | 说明 | 来源 |
|------|------|------|
| **Parler-TTS** | NotebookLlama 选用,支持文字描述控制语音风格 | [NotebookLlama Cookbook](https://www.llama.com/resources/cookbook/how-to-build-notebook-llama/) |
| **Suno Bark** | 多语言开源 TTS | 同上 |
| **Zyphra Zonos** | 领先的开源 TTS 模型 | [SiliconFlow - 2026 播客编辑最佳开源 AI 模型](https://www.siliconflow.com/articles/zh-Hans/best-open-source-AI-models-for-podcast-editing) |

---

## 5. 商业工具与平台对比

### 5.1 核心对比表

| 工具 | 定位 | 核心优势 | 语音克隆 | 全流程 | 来源 |
|------|------|---------|---------|--------|------|
| **Google NotebookLM** | 标杆产品 | 文档转双人 AI 深谈,体验最佳 | ✅(内置) | ✅ | [Google Blog](https://blog.google/innovation-and-ai/products/notebooklm-audio-overviews/) |
| **ElevenLabs** | 语音引擎 | 业界最佳 AI 语音/TTS,支持 Professional Voice Cloning、时间线编辑 | ✅ | ❌(仅语音) | [elevenlabs.io/use-cases/podcasts](https://elevenlabs.io/use-cases/podcasts) |
| **Wondercraft** | 端到端生成 | "播客界的 Canva",无需设备/剪辑/配音,脚本→音频→发布 | ✅ | ✅ | [wondercraft.ai/tools/ai-podcast-generator](https://www.wondercraft.ai/tools/ai-podcast-generator) |
| **Podcastle** | 一体化平台 | 录制+编辑+AI 脚本生成 | ✅ | ✅ | [cuflow.ai 评测](https://cuflow.ai/blog/best-ai-podcast-generator) |

### 5.2 NotebookLM 的定制能力(重要)

NotebookLM 支持通过 **"Customize(自定义)"** 按钮提供自定义指令,可控制:

- 主持人语气、聚焦点、输出格式
- 输出语言(支持 50+ 种语言)
- 需删除已有音频概览后用新指令重新生成

> 来源:[Google Blog - NotebookLM update: Audio Overview controls](https://blog.google/innovation-and-ai/products/notebooklm-update-october-2024/)
> 来源:[Google Help - Generate Audio Overview](https://support.google.com/notebooklm/answer/16212820?hl=en)
> 实战建议:[MakeUseOf - NotebookLM's best feature got much better when I stopped using the defaults](https://www.makeuseof.com/notebooklm-audio-overviews-better-custom-prompt/)
> 社区自定义指令合集:[Reddit - Custom Instructions For AI Podcast](https://www.reddit.com/r/notebooklm/comments/1hchsyh/custom_instructions_for_ai_podcast/)
> 进阶提示词指南:[Alex Lawsen - NotebookLM podcasts, but good](https://lawsen.substack.com/p/notebooklm-podcasts-but-good)

### 5.3 综合对比评测(2026)

- [AutoContent API - Best AI Podcast Generators in 2026](https://autocontentapi.com/best-ai-podcast-generator)(10 款横评)
- [SparkPod - 7 Best AI Podcast Generators in 2026](https://sparkpod.ai/blog/best-ai-podcast-generators-2026)(NotebookLM / Podcastle / ElevenLabs / SparkPod 对比)
- [Cuflow - Best AI Podcast Generators in 2026](https://cuflow.ai/blog/best-ai-podcast-generator)
- [Podcast-Generator.ai - The Best AI Podcast Generator: An Honest Comparison](https://podcast-generator.ai/blog/best-ai-podcast-generator)

---

## 6. 中文生态方案

### 6.1 智谱 AI 播客生成实践(★★★★★ 推荐参考)

智谱提供了最完整的中文实现思路文档,流程与 NotebookLM 一致:大模型读取理解文本 → 根据提示词、人设生成对话式文本 → 音频合成。文档含可参考的代码示例(`tts.py` 等)。

> 来源:[智谱 AI 开放文档 - 播客生成](https://docs.bigmodel.cn/cn/best-practice/creativepractice/podcastgeneration)

### 6.2 阿里通义音频播客生成

以通义千问为基座,将文档转换为**两位 AI 主持人对话形式**的播客。

> 来源:[阿里云帮助文档 - 通义音频播客生成](https://help.aliyun.com/zh/model-studio/brief-introduction-of-ai-podcast)

### 6.3 MiniMax AI 播客生成方案

使用 MiniMax 语音模型 + 语言模型构建完整应用,实现用户输入到播客成品的全流程自动化。

> 来源:[MiniMax 开放平台 - AI 播客生成:多模态AI应用实战](https://platform.minimaxi.com/docs/solutions/aipodcast)

### 6.4 科大讯飞 AI 电台播客一键生成工作流(★★★★ 工作流蓝图)

提供了非常清晰的中文工作流蓝图:**内容输入 → 智能改写 → 视觉生成 → 语音合成 → 成果输出**,适合个人创作者或小型团队。

> 来源:[GitHub Discussion - AI电台播客一键生成工作流](https://github.com/iflytek/astron-agent/discussions/845)

### 6.5 其他中文工具与报道

| 资源 | 说明 | 来源 |
|------|------|------|
| **Monica AI 播客生成器** | 网页/YouTube/PDF/文本即时转播客 | [monica.im/zh_CN/ai-podcast](https://monica.im/zh_CN/ai-podcast) |
| **TicNote Podcast Generator** | 会议笔记/文档转播客,支持逼真 AI 语音 | [ticnote.com/zh/features/podcast-generator](https://ticnote.com/zh/features/podcast-generator) |
| **行业报道** | 实测 5000 字文本约 2-3 分钟生成约 6 分钟中文音频 | [澎湃新闻 - 五分钟生成一档播客](https://www.thepaper.cn/newsDetail_forward_30493807) |
| **制作指南** | 从文本自动生成音频内容的方法,含旁白式播客技巧 | [ondoku3.com - AI播客制作指南](https://ondoku3.com/zh-hans/post/ai-podcast-create-from-text/) |

---

## 7. 关键技术难点与研究

### 7.1 多轮对话的连贯性问题(核心难点)

微软研究院论文《LLMs Get Lost In Multi-Turn Conversation》发现:在多轮对话生成任务中,LLM 一旦"走偏"往往**无法自我恢复**。这对长播客脚本的生成(本质是多轮对话)是关键挑战。

> 来源:[arXiv - LLMs Get Lost In Multi-Turn Conversation](https://arxiv.org/html/2505.06120v1)
> 来源:[Microsoft Research 出版物页](https://www.microsoft.com/en-us/research/publication/llms-get-lost-in-multi-turn-conversation/)

**实践启示**:长播客应**分段生成 + 显式传递上下文摘要**,而非一次性生成全部对话。这正是 NotebookLlama「先转录再戏剧化」两步法的设计动机。

### 7.2 Agentic 编排

- [Medium - Building Multi-Turn Conversations with AI Agents: The 2026 Playbook](https://medium.com/ai-simplified-in-plain-english/building-multi-turn-conversations-with-ai-agents-the-2026-playbook-45592425d1db):多轮 agent 架构模式
- [Omri Lavi 的实践](https://omrilavi.com/blog/building-ai-podcasts-and-letting-go/):用 **LangGraph** 编排播客生成流水线
- 评估方法:[Langfuse Cookbook - Evaluating Multi-Turn Conversations](https://langfuse.com/guides/cookbook/example_simulated_multi_turn_conversations)、[LangWatch Cookbook](https://langwatch.ai/docs/cookbooks/evaluating-multi-turn-conversations)

### 7.3 NotebookLM 的技术架构访谈(深度)

Latent Space 对 NotebookLM 团队的访谈,涵盖了从文档摄取到播客音频输出的架构与设计哲学,是理解「为什么这样设计」的最佳资料。

> 来源:[Latent Space - How NotebookLM Was Made](https://www.latent.space/p/notebooklm)
> 关联报道:[AInauten - System Prompt Leaks(NotebookLM + Google DeepMind 访谈)](https://www.ainauten.net/p/prompting-system-prompt-leaks-notebooklm-sources-google-deepmind-interview)

---

## 8. 实施建议

### 8.1 推荐的落地路线(针对本项目自建场景)

基于以上调研,若要在 `SelfMediaTool` 中自建「文章转播客」能力,建议采用 **「开源流水线 + 国产模型」** 方案:

```
[文章输入]
   │
   ▼
[1. 文本预处理] —— 提取正文、清洗、分块(可复用项目现有转录/文本处理逻辑)
   │
   ▼
[2. 大纲生成]    —— 用 GLM/通义 生成结构化大纲(避免多轮走偏)
   │
   ▼
[3. 双人脚本生成] —— 核心:系统提示词(双主持人人设 + 仅基于源文约束)
   │                参考 NotebookLM 逆向提示词 / Mozilla prompt.py
   ▼
[4. 戏剧化重写]  —— 8B 级模型即可:加互动、口语化、过渡词
   │
   ▼
[5. 双音色 TTS]  —— 智谱/MiniMax/通义 语音,或开源 Parler-TTS/Zonos
                   按 Speaker 标记切分,分别合成后拼接
```

### 8.2 提示词最小可行模板(可直接起步)

```
# 系统提示词(草稿,可迭代)

你是一档双人播客的编剧。两位主持人:
- 主持人A:热情、善于讲故事,擅长用比喻把复杂概念讲通俗
- 主持人B:冷静、理性,擅长补充细节、追问、做总结

任务:基于下方【源材料】,生成一段 {时长} 分钟的双人对话播客脚本。

硬性规则:
1. 只能使用【源材料】中的事实与信息,禁止编造、禁止引入外部知识
2. 输出格式严格为:
   主持人A: ...
   主持人B: ...
   (交替进行)
3. 包含开场问候、自然过渡、追问与回应、结尾总结
4. 语言自然口语化,像真人聊天,允许感叹词("嗯"、"对"、"哇")
5. 面向想快速了解要点的忙碌听众,先给结论再展开

【源材料】:
{article_content}
```

> 此模板综合了 [NotebookLM 逆向提示词](https://baoyu.io/blog/google-notebooklm-system-prompt-en) 与 [社区最佳实践](https://medium.com/towards-generative-ai/the-ai-prompt-that-turns-podcast-ideas-into-professional-scripts-3b4e3ceb9241) 的核心要素。

### 8.3 选型建议速查

| 场景 | 推荐方案 |
|------|---------|
| **快速验证 / PoC** | 直接用 NotebookLM 或 Wondercraft 体验效果 |
| **自建、可控、中文** | 智谱 GLM + MiniMax/通义 TTS,参考智谱文档与 NotebookLlama 架构 |
| **完全开源 / 本地** | Podcastfy 或 Mozilla document-to-podcast + Parler-TTS |
| **只要最好的语音** | ElevenLabs(作为 TTS 环节嵌入自建流水线) |
| **企业批量/API 化** | [NotebookLM Enterprise API](https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-audio-overview) |

---

## 9. 完整信息来源索引

### NotebookLM 官方与逆向
- [Google Blog - NotebookLM Audio Overviews 发布](https://blog.google/innovation-and-ai/products/notebooklm-audio-overviews/)
- [Google Blog - NotebookLM 更新:Audio Overview 控制](https://blog.google/innovation-and-ai/products/notebooklm-update-october-2024/)
- [Google Help - Generate Audio Overview](https://support.google.com/notebooklm/answer/16212820?hl=en)
- [Google Cloud Docs - NotebookLM Enterprise API](https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-audio-overview)
- [Baoyu - NotebookLM 系统提示词逆向还原](https://baoyu.io/blog/google-notebooklm-system-prompt-en)
- [TheBigPromptLibrary - notebooklm-10202024.md](https://github.com/0xeb/TheBigPromptLibrary/blob/main/SystemPrompts/Google/notebooklm-10202024.md)
- [Nicole Hennig - Reverse Engineering the System Prompt](https://nicolehennig.com/notebooklm-reverse-engineering-the-system-prompt-for-audio-overviews/)
- [Reddit - Deep Dive 提示词泄漏](https://www.reddit.com/r/notebooklm/comments/1gg5201/i_managed_to_get_deep_dive_to_leak_out_quite_a/)
- [Reddit - Audio Overviews how it works](https://www.reddit.com/r/notebooklm/comments/1ft58st/notebooklm_audio_overviews_how_it_works/)
- [Reddit - Custom Instructions For AI Podcast](https://www.reddit.com/r/notebooklm/comments/1hchsyh/custom_instructions_for_ai_podcast/)
- [Latent Space - How NotebookLM Was Made](https://www.latent.space/p/notebooklm)
- [AInauten - System Prompt Leaks + DeepMind 访谈](https://www.ainauten.net/p/prompting-system-prompt-leaks-notebooklm-sources-google-deepmind-interview)
- [Alex Lawsen - NotebookLM podcasts, but good](https://lawsen.substack.com/p/notebooklm-podcasts-but-good)
- [MakeUseOf - 自定义提示词让 Audio Overview 更好](https://www.makeuseof.com/notebooklm-audio-overviews-better-custom-prompt/)
- [XDA - 别忽视 NotebookLM 的定制功能](https://www.xda-developers.com/please-stop-ignoring-notebooklms-customization-features/)

### 开源项目
- [Podcastfy - GitHub](https://github.com/souzatharsis/podcastfy) | [HN 讨论](https://news.ycombinator.com/item?id=41852401)
- [Open Notebook - GitHub](https://github.com/lfnovo/open-notebook) | [XDA 评测](https://www.xda-developers.com/switched-from-notebooklm-to-open-source-tool-open-notebook/)
- [Mozilla document-to-podcast - GitHub](https://github.com/mozilla-ai/document-to-podcast) | [文档](https://mozilla-ai.github.io/document-to-podcast/step-by-step-guide/) | [博客详解](https://blog.mozilla.ai/blueprint-deep-dive-turn-documents-into-podcasts-locally-with-open-source-ai/)
- [document-to-podcast/prompt.py 源码](https://github.com/mozilla-ai/document-to-podcast/blob/main/src/document_to_podcast/inference/model_module/prompt.py)
- [Readme-to-Podcast 社区衍生](https://github.com/alexmeckes/readme-to-podcast)
- [NotebookLlama Cookbook](https://www.llama.com/resources/cookbook/how-to-build-notebook-llama/) | [TechCrunch](https://techcrunch.com/2024/10/27/meta-releases-an-open-version-of-googles-podcast-generator/) | [InfoQ](https://www.infoq.com/news/2024/11/meta-notebook-llama/) | [Analytics Vidhya](https://www.analyticsvidhya.com/blog/2025/12/build-your-own-notebookllama/) | [Medium](https://medium.com/ai-artistry/notebook-llama-an-open-source-guide-to-building-a-pdf-to-podcast-workflow-e8fceec888a9)
- [Together AI - Build an Open Source NotebookLM](https://docs.together.ai/docs/open-notebooklm-pdf-to-podcast)
- [HuggingFace - How to Make an AI Podcast](https://huggingface.co/blog/LE15l/make-ai-podcast-using-ai-voices-and-llms)
- [Omri Lavi - Building AI Podcasts (LangGraph)](https://omrilavi.com/blog/building-ai-podcasts-and-letting-go/)
- [S. Anand - AI Podcast Generator](https://tools.s-anand.net/podcast/claude.html)

### 提示词设计与实践
- [Reddit r/PromptEngineering - 播客生成器提示词](https://www.reddit.com/r/PromptEngineering/comments/1rn8kao/i_built_a_podcast_generator_prompt_for_chatgpt_so/)
- [HackerNoon - 专业播客脚本提示词](https://hackernoon.com/i-built-an-ai-prompt-that-turns-podcast-ideas-into-professional-scriptsand-it-actually-work)
- [Medium - The AI Prompt That Turns Podcast Ideas Into Scripts](https://medium.com/towards-generative-ai/the-ai-prompt-that-turns-podcast-ideas-into-professional-scripts-3b4e3ceb9241)
- [Riverside - 45 AI Prompts for Podcasters](https://riverside.com/blog/ai-chatgpt-prompts-for-podcasters)
- [Talks.co - Podcast Script Generator + 10-Step Guide](https://talks.co/p/podcast-script-generator/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

### 商业工具
- [ElevenLabs - Podcast 用例](https://elevenlabs.io/use-cases/podcasts)
- [Wondercraft - AI Podcast Generator](https://www.wondercraft.ai/tools/ai-podcast-generator)
- [AutoContent API - 2026 最佳 AI 播客生成器](https://autocontentapi.com/best-ai-podcast-generator)
- [SparkPod - 7 Best AI Podcast Generators 2026](https://sparkpod.ai/blog/best-ai-podcast-generators-2026)
- [Cuflow - Best AI Podcast Generators 2026](https://cuflow.ai/blog/best-ai-podcast-generator)
- [Podcast-Generator.ai - 对比](https://podcast-generator.ai/blog/best-ai-podcast-generator)

### 中文生态
- [智谱 AI - 播客生成文档](https://docs.bigmodel.cn/cn/best-practice/creativepractice/podcastgeneration)
- [阿里云 - 通义音频播客生成](https://help.aliyun.com/zh/model-studio/brief-introduction-of-ai-podcast)
- [MiniMax - AI 播客生成实战](https://platform.minimaxi.com/docs/solutions/aipodcast)
- [科大讯飞 - AI 电台播客一键生成工作流](https://github.com/iflytek/astron-agent/discussions/845)
- [Monica - 免费 AI 播客生成器](https://monica.im/zh_CN/ai-podcast)
- [TicNote - Podcast Generator](https://ticnote.com/zh/features/podcast-generator)
- [澎湃新闻 - 五分钟生成一档播客](https://www.thepaper.cn/newsDetail_forward_30493807)
- [ondoku3 - AI 播客制作指南](https://ondoku3.com/zh-hans/post/ai-podcast-create-from-text/)
- [SiliconFlow - 2026 播客编辑最佳开源 AI 模型](https://www.siliconflow.com/articles/zh-Hans/best-open-source-AI-models-for-podcast-editing)

### 技术研究与评估
- [arXiv - LLMs Get Lost In Multi-Turn Conversation](https://arxiv.org/html/2505.06120v1)
- [Microsoft Research 出版物](https://www.microsoft.com/en-us/research/publication/llms-get-lost-in-multi-turn-conversation/)
- [Medium - Building Multi-Turn Conversations: 2026 Playbook](https://medium.com/ai-simplified-in-plain-english/building-multi-turn-conversations-with-ai-agents-the-2026-playbook-45592425d1db)
- [Langfuse Cookbook - 多轮对话评估](https://langfuse.com/guides/cookbook/example_simulated_multi_turn_conversations)
- [LangWatch Cookbook - 多轮对话评估](https://langwatch.ai/docs/cookbooks/evaluating-multi-turn-conversations)

*报告完。如需针对某个方案(如智谱 GLM 流水线、Podcastfy 接入、或自建提示词)做更深入的可行性分析或代码原型,可在此基础上继续展开。*
