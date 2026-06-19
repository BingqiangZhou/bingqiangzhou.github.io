---
title: 【学习笔记】单人播客 AI 生成调研报告
published: 2026-06-15
description: 聚焦「单人主播/独白式」播客的 AI 生成，系统梳理单人 vs 双人选型、标准工作流、提示词设计、长文本单音色一致性难点、开源与商业工具及中文生态方案
lang: zh
tags: [学习笔记]
---

> **调研日期**：2026-06-15
> **调研范围**：文章/文档 → **单人/独白式** 播客音频的提示词、工作流、工具与开源方案
> **说明**：本报告是《文章生成播客调研报告》（聚焦双人对话）的**姊妹篇**，专门聚焦「单人主播/独白式」播客。每项关键信息均标注了来源链接。

<!--

## 目录

1. [为什么要单独研究「单人播客」](#1-为什么要单独研究单人播客)
2. [单人 vs 双人：对比与选型依据](#2-单人-vs-双人对比与选型依据)
3. [单人播客的标准工作流](#3-单人播客的标准工作流)
4. [单人播客的提示词设计](#4-单人播客的提示词设计)
5. [关键难点：长文本单音色一致性](#5-关键难点长文本单音色一致性)
6. [开源项目与自建方案](#6-开源项目与自建方案)
7. [商业工具与平台](#7-商业工具与平台)
8. [中文生态方案](#8-中文生态方案)
9. [单人播客脚本结构最佳实践](#9-单人播客脚本结构最佳实践)
10. [实施建议](#10-实施建议)
11. [完整信息来源索引](#11-完整信息来源索引)

-->

## 1. 为什么要单独研究「单人播客」

上一份报告聚焦的 NotebookLM 范式带火了**双人对话**生成，但「单人主播/独白式」播客是另一个**同等重要、且技术要求不同**的形态：

- **技术栈更简单**:无需多说话人协调、无需对话连贯性管理，只需「LLM 写脚本 → 单音色 TTS」两步。
- **提示词逻辑不同**:双人靠"互动/追问/接话",单人靠"**叙事节奏、钩子、第一人称口吻**"。
- **有独有的技术难点**:长文本下**单音色的一致性 (音色漂移、语气断裂)** 是双人方案不会遇到的问题。
- **适用场景更广**:新闻播报、知识科普、有声书、个人观点评论、睡前故事……这些天然是单人独白。

> 结论：单人播客不是双人播客的"阉割版",而是一个**目标不同、技术取舍不同**的独立赛道，值得单独调研。

---

## 2. 单人 vs 双人：对比与选型依据

### 2.1 有研究支撑的对比 (重要)

一篇针对 296 名日本听众的对照实验论文《Comparison of Listening Experiences by Podcast Styles: Monologue versus Dialogue》直接对比了两种形态，核心发现：

> **对话式 (dialogue) 更生动、更有吸引力、好感度更高**;但独白式 (monologue) 在**信息密度传递**上有其价值。

> 来源：[ResearchGate - Comparison of Listening Experiences by Podcast Styles](https://www.researchgate.net/publication/389937262_Comparison_of_Listening_Experiences_by_Podcast_Styles_Monologue_versus_Dialogue) | [Research Square PDF](https://www.researchsquare.com/article/rs-6217086/latest.pdf)

Zara Zhang 的分析进一步指出"**两人是播客的魔法数字**"——一人讲课偏枯燥，三人以上太嘈杂。这意味着**单人播客要在"吸引力"上额外下功夫**。

> 来源：[Zara Zhang - The Magic of Two: Why Dual-Host Podcasts](https://zarazhang.substack.com/p/the-magic-of-two-why-dual-host-podcasts)

### 2.2 选型对照表

| 维度 | 单人独白 (Monologue) | 双人对话 (Dialogue) |
|------|---------------------|---------------------|
| **技术复杂度** | 低 (单 LLM + 单 TTS) | 高 (人设协调、多轮连贯、双音色) |
| **信息密度** | 高，适合知识/新闻密集传递 | 中，信息被对话稀释 |
| **吸引力/趣味** | 较低，需靠脚本技巧弥补 | 较高，对话天然有张力 |
| **生成稳定性** | 高 (无多轮走偏问题) | 低 (LLM 多轮易跑题) |
| **成本** | 低 | 高 (双倍 TTS、更长脚本) |
| **典型场景** | 新闻、科普、有声书、评论、故事 | 深度访谈、娱乐、教育对谈 |
| **AI 生成难点** | 长文本单音色一致性 | 多轮对话连贯性、音色切换自然度 |

> 双人多轮连贯性问题见：[arXiv - LLMs Get Lost In Multi-Turn Conversation](https://arxiv.org/html/2505.06120v1)(上一份报告已详述)

### 2.3 何时该选单人播客

✅ **选单人**:内容偏知识/新闻/故事、目标听众想高效获取信息、需要低成本批量生成、内容会做图文/视频多端分发 (独白更易复用)。

✅ **选双人**:内容偏观点碰撞/娱乐、追求"陪伴感"、单期时长久、愿意为体验付出更高成本。

---

## 3. 单人播客的标准工作流

单人播客的工作流**比双人简单得多**,核心是两步，最多三步：

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│ 1. 文本预处理 │ -> │ 2. 独白脚本生成    │ -> │ 3. 单音色TTS │
│ 提取/清洗正文  │    │ LLM + 独白提示词   │    │ 长文本合成    │
└─────────────┘    └──────────────────┘    └─────────────┘
```

### 关键差异 (对比双人流水线)

| 环节 | 双人方案 | 单人方案 |
|------|---------|---------|
| 脚本生成 | 需要双主持人设、对话格式、追问设计 | 只需单一人设、叙事结构、钩子设计 |
| 戏剧化重写 | 常需独立一步 (如 NotebookLlama Step 3) | 通常**可省略**,合并进脚本生成 |
| TTS | 需双音色 + 说话人切分 + 衔接处理 | **单音色**,难点转为长文本一致性 |

> 参考：[ByteBridge - Creating Podcasts with AI: A Practical End-to-End Workflow](https://bytebridge.medium.com/creating-podcasts-with-ai-a-practical-end-to-end-workflow-ideas-script-voice-edit-9b2b0a2780df)(明确区分了 solo narration / scripted story / multi-speaker 等格式)
> 参考：[Omri Lavi - Building an AI-Generated Podcast](https://omrilavi.com/blog/building-ai-podcasts-and-letting-go/)(fetch articles → summarize → generate script → TTS → stitch)

---

## 4. 单人播客的提示词设计

> 单人播客的提示词核心**不是"互动设计",而是"叙事设计"**。

### 4.1 ★★★★★ 单人播客脚本提示词模板 (综合最佳实践)

基于 dev.to、HackerNoon、Reddit 的多个实战模板归纳：

```text
# 角色
你是一位资深单人播客主播兼编剧。你的风格是：[温暖/犀利/幽默/专业——按需填入]。
你擅长把复杂的内容讲得通俗、有画面感、让人想一直听下去。

# 任务
基于下方【源材料】,撰写一期 {时长} 分钟的单人独白播客脚本。
全程只有你一个人 (第一人称"我") 在讲，没有嘉宾、没有搭档。

# 脚本结构 (必须遵循)
1. 【钩子开场】用一个反常识的事实/一个问题/一个悬念在前 15 秒抓住听众
2. 【承诺】告诉听众听完能得到什么
3. 【正文】按逻辑展开，每个要点：
   - 先给结论，再用源材料里的事实/数据/例子支撑
   - 用比喻、类比把抽象概念具体化
   - 点与点之间用自然的过渡 ("说到这里，就不得不提…")
4. 【收尾】回顾要点，给一个行动建议或留一个思考题，然后自然结束

# 硬性规则
1. 只能使用【源材料】中的信息，禁止编造 (NO HALLUCINATION)
2. 用口语化、第一人称的讲述口吻，像在和单个朋友聊天
3. 禁止用"首先/其次/综上所述"这种书面/机器味过渡词
4. 允许并鼓励：反问、感叹、短暂停顿标记 (如 [停顿])、语气词
5. 输出纯口播文稿，不要加"主持人："之类的标签，不要加标题分级符号

# 听众画像
[描述目标听众：他们是谁、关心什么、已知什么]

# 【源材料】
{article_content}
```

> 综合来源：
> - [dev.to - I Built a Podcast Script Prompt That Actually Works(完整模板)](https://dev.to/huizhudev/i-built-a-podcast-script-prompt-that-actually-works-heres-the-complete-template-23h1)
> - [HackerNoon - I Built an AI Prompt That Turns Podcast Ideas Into Professional Scripts](https://hackernoon.com/i-built-an-ai-prompt-that-turns-podcast-ideas-into-professional-scriptsand-it-actually-work)
> - [Reddit r/PromptEngineering - 播客生成器提示词 (强调禁用机器味过渡词)](https://www.reddit.com/r/PromptEngineering/comments/1rn8kao/i_built_a_podcast_generator_prompt_for_chatgpt_so/)
> - [Towards Generative AI(Medium)- 具体化吸引力 (每 3-5 分钟一个 hook)](https://medium.com/towards-generative-ai/the-ai-prompt-that-turns-podcast-ideas-into-professional-scripts-3b4e3ceb9241)

### 4.2 ★★★★ 强制 NotebookLM 生成单人模式

社区实践:NotebookLM 默认双人，但可通过 **Customize(自定义指令)** 强制单人，例如输入 *"Use only one host/narrator, no dialogue, no second voice"*。注意需要**删除已有的 Audio Overview 后**用新指令重新生成。

> 来源：[Reddit r/notebooklm - One podcast host instead of two?](https://www.reddit.com/r/notebooklm/comments/1hftel0/one_podcast_host_instead_of_two/)
> NotebookLM 定制入口：[Google Blog - NotebookLM update](https://blog.google/innovation-and-ai/products/notebooklm-update-october-2024/)

### 4.3 单人提示词的设计要点 (跨来源归纳)

| 设计点 | 说明 | 来源 |
|--------|------|------|
| **明确人设与口吻** | 定义主播的性格、专业度、说话风格 (温暖/犀利/幽默) | [Riverside - 45 AI Prompts for Podcasters](https://riverside.com/blog/ai-chatgpt-prompts-for-podcasters) |
| **禁用机器味过渡** | 明确禁止"首先/其次/综上",改用口语化过渡 | [Reddit 播客生成器提示词](https://www.reddit.com/r/PromptEngineering/comments/1rn8kao/i_built_a_podcast_generator_prompt_for_chatgpt_so/) |
| **强制钩子结构** | hook → promise → body → CTA 的叙事弧线 | [Captivate - Perfect Podcast Script](https://www.captivate.fm/learn-podcasting/record/write-perfect-podcast-script-plus-examples-templates) |
| **第一人称口吻** | 用"我",像对单个朋友说话 | [Buzzsprout - 8 Script Templates](https://www.buzzsprout.com/blog/write-podcast-script-examples) |
| **节奏与停顿标记** | 用 [停顿]/[笑]/[加重] 等标记指导 TTS 语气 | 同上 |
| **定义听众画像** | 让脚本针对真实听众的痛点和认知水平 | [Riverside](https://riverside.com/blog/ai-chatgpt-prompts-for-podcasters) |

---

## 5. 关键难点：长文本单音色一致性

> 这是单人播客**独有**的技术难点，双人方案因为句子短、交替频繁反而问题不大。

### 5.1 问题本质

主流 TTS 模型对**单次输入长度有上限**(通常几十秒到 1-2 分钟),长播客必须**分块 (chunking)**生成再拼接。分块会带来：

- **音色漂移**:同一参考音色在不同块里听起来像不同的人
- **语气断裂**:块与块之间情绪/语速不连贯
- **漏字/跳词**:长文本下 TTS 容易 hallucinate、吞字

> 来源：[Long-form TTS is broken: how TADA and Borderless are fixing it](https://www.arunbaby.com/speech-tech/0064-long-form-tts-is-broken/)(详细解释为何 >30 秒内容 TTS 会漂移)
> 来源：[Parler-TTS Issue #11 - Is there a way to create consistent voices?](https://github.com/huggingface/parler-tts/issues/11)

### 5.2 业界解决方案

| 方案 | 做法 | 来源 |
|------|------|------|
| **分块 + 参考音频** | 每块生成都传入同一段参考音频 (reference clip) 保持音色 | [Unsloth - TTS Fine-tuning Guide](https://unsloth.ai/docs/basics/text-to-speech-tts-fine-tuning) |
| **按句子/段落切分** | TTS 单次最好只处理一段，提供足够上下文 | [LinkedIn - Building an AI audiobook people want to listen to](https://www.linkedin.com/pulse/building-ai-audiobook-people-actually-want-listen-philip-kiely-q1imc) |
| **微调克隆音色** | 用 30 分钟干净单人音频微调，获得稳定克隆 | [The Neural Maze - Beyond Text: Vision & TTS Finetuning](https://theneuralmaze.substack.com/p/beyond-text-a-guide-to-vision-and) |
| **长文本专用模型** | 用支持长文本的 TTS(见 5.3) | 见下 |
| **音频后处理拼接** | 块间加微静音、做响度归一化 | [Reddit - 1-hour-long voice overs](https://www.reddit.com/r/TextToSpeech/comments/1oyer1p/any_open_source_tts_that_can_generate_1_hour_long/) |

### 5.3 推荐的长文本 TTS 方案

| 模型/服务 | 长文本能力 | 来源 |
|-----------|-----------|------|
| **Qwen3-TTS** | 开源，单次可合成 **10 分钟以上**自然流畅语音，3 秒声音克隆，长文本稳定性突出 | [Qwen3-TTS 技术报告 (arXiv)](https://arxiv.org/html/2601.15621v1) \| [实战指南 (Medium)](https://medium.com/data-science-collective/high-quality-long-form-tts-with-qwen3-open-weight-models-cdd6e3d00df0) |
| **Gemini-TTS** | Google 官方，支持短片段到长篇叙述，可控风格/口音/语速/语调 | [Google Cloud - Gemini-TTS 文档](https://docs.cloud.google.com/text-to-speech/docs/gemini-tts) |
| **ElevenLabs** | 商业标杆，需分块但质量最高，支持 Professional Voice Cloning | [elevenlabs.io/use-cases/podcasts](https://elevenlabs.io/use-cases/podcasts) |
| **GPT-SoVITS / XTTS-v2** | 开源，声音克隆，需配合分块策略 | [Reddit r/LocalLLaMA 推荐](https://www.reddit.com/r/LocalLLaMA/comments/1f0awd6/best_local_open_source_texttospeech_and/) |

---

## 6. 开源项目与自建方案

### 6.1 通用「脚本 → 单音色音频」工具

| 项目 | 说明 | 来源 |
|------|------|------|
| **Audiobook Maker (JarodMica)** | 长文本单音色音频生成 TTS 界面，适合有声书/单人播客 | [github.com/JarodMica/audiobook_maker](https://github.com/JarodMica/audiobook_maker) |
| **Voicebox** | 本地 ElevenLabs 替代，支持 7 种 TTS 引擎 + 声音克隆，全离线 | [voicebox.sh](https://voicebox.sh/) |
| **Podcast-Generator (justlovemaki)** | 开源 CLI,OpenAI 生成脚本 + TTS 转语音，可自定义部署 | [github.com/justlovemaki/Podcast-Generator](https://github.com/justlovemaki/Podcast-Generator) |
| **awesome-ai-voice** | 开源 TTS/声音克隆模型精选清单 | [github.com/wildminder/awesome-ai-voice](https://github.com/wildminder/awesome-ai-voice) |

### 6.2 自建单人播客流水线 (推荐架构)

```
[文章输入]
   │
   ▼
[1. 文本预处理]   提取正文、清洗、去广告/导航噪声
   │
   ▼
[2. 独白脚本生成]  ★核心:用 4.1 的系统提示词
   │              · 单一人设 + 钩子结构 + 仅基于源文
   │              · 超长文章可分段生成,每段带前文摘要
   │
   ▼
[3. 脚本后处理]    按句子/段落切分成 TTS 块,插入停顿标记
   │
   ▼
[4. 单音色 TTS]   · 开源:Qwen3-TTS / GPT-SoVITS(分块+参考音频)
   │              · 商业:ElevenLabs / Gemini-TTS
   │
   ▼
[5. 音频拼接]     块间微静音 + 响度归一化(LUFS) + 可选加 BGM
   │
   ▼
[成片输出]
```

> 参考实践：[Omri Lavi - fetch → summarize → script → TTS → stitch](https://omrilavi.com/blog/building-ai-podcasts-and-letting-go/)
> 有声书工程参考：[Temporal - Create audiobooks from text](https://learn.temporal.io/tutorials/java/audiobook/)

---

## 7. 商业工具与平台

### 7.1 明确支持单人/独白的工具

| 工具 | 单人播客支持 | 特色 | 来源 |
|------|-------------|------|------|
| **Wondercraft** | ✅ AI 配音播客，支持脚本/笔记转单人节目 | "Parrot Mode" 可精确控制 AI 嗓音如何演绎每一句 | [wondercraft.ai](https://www.wondercraft.ai/tools/ai-podcast-generator) \| [The Podcast Host 评测](https://www.thepodcasthost.com/recording-skills/wondercraft-review/) \| [Parrot Mode(Podnews)](https://podnews.net/press-release/wondercraft-parrot-mode) |
| **Noiz AI** | ✅ **明确支持单人主持和访谈两种模式** | 无需麦克风，脚本直转专业剧集 | [noiz.ai/use-cases/podcast-voice-generator](https://noiz.ai/use-cases/zh-Hans/podcast-voice-generator) |
| **Podcastle** | ✅ Solo 录制模式 + AI 增强 | 录制/编辑/发布一体 | [YouTube 教程](https://www.youtube.com/watch?v=XA0rZuJjwG4) |
| **ElevenLabs** | ✅(语音引擎，适合嵌入单人流水线) | 业界最佳音色 + 时间线编辑 + 配音克隆 | [elevenlabs.io/use-cases/podcasts](https://elevenlabs.io/use-cases/podcasts) |
| **Murf AI** | ✅ 多种自然 AI 嗓音 | 超逼真配音，适合独白 | [murf.ai](https://murf.ai/) |
| **HeyGen AI Narrator** | ✅ 175+ 语言 | 故事/脚本自然配音 | [heygen.com/tool/ai-narrator](https://www.heygen.com/tool/ai-narrator) |
| **Swell AI** | ✅ 单人播客全流程指南 | 单人主播向的工作流 | [swellai.com/blog/how-to-start-a-solo-podcast](https://www.swellai.com/blog/how-to-start-a-solo-podcast) |

### 7.2 一站式文章转播客 (默认或可选单人)

| 工具 | 说明 | 来源 |
|------|------|------|
| **NoteGPT** | 文本/PDF/网页/YouTube/笔记转播客，可选音色 | [notegpt.io/ai-podcast-generator](https://notegpt.io/ai-podcast-generator) |
| **Podsqueeze** | 脚本/文章/笔记/PDF 转播客配音，免费 15 秒预览 | [podsqueeze.com/ai-podcast-generator](https://podsqueeze.com/ai-podcast-generator/) |
| **Monica AI** | 网页/视频/PDF/文本即时转播客 | [monica.im/ai-podcast](https://monica.im/en/ai-podcast) |
| **AnySpeech** | 话题/文章转播客 (默认多主持，可改单人) | [anyspeech.io/ai-podcast-generator](https://anyspeech.io/ai-podcast-generator) |

---

## 8. 中文生态方案

### 8.1 中文单人播客工具

| 工具 | 说明 | 来源 |
|------|------|------|
| **Noiz AI(中文)** | 明确支持单人主持模式，脚本转专业剧集 | [noiz.ai/use-cases/zh-Hans/podcast-voice-generator](https://noiz.ai/use-cases/zh-Hans/podcast-voice-generator) |
| **SpeakUp AI** | 一键文章转播客，20+ 逼真 AI 声音，支持声音克隆 | [top.aibase.com/tool/speakup-ai](https://top.aibase.com/tool/speakup-ai) |
| **LOVO AI (Genny)** | 粘贴脚本选音色一键生成，支持中文口音/语气 | [lovo.ai/zh/usecase/podcasts](https://lovo.ai/zh/usecase/podcasts) |
| **Monica AI(中文)** | 网页/视频/PDF/文本转播客 | [monica.im/zh_CN/ai-podcast](https://monica.im/zh_CN/ai-podcast) |

### 8.2 中文长文本 TTS(单人播客音频合成环节)

- **Qwen3-TTS(通义千问)**:开源长文本 TTS 标杆，单次 10 分钟 + 稳定合成，3 秒克隆 —— 最适合中文单人播客。([技术报告](https://arxiv.org/html/2601.15621v1) | [实战指南](https://medium.com/data-science-collective/high-quality-long-form-tts-with-qwen3-open-weight-models-cdd6e3d00df0))
- **MiniMax 语音模型**:提供播客生成方案。([platform.minimaxi.com/docs/solutions/aipodcast](https://platform.minimaxi.com/docs/solutions/aipodcast))
- **SiliconFlow 开源模型清单**:播客编辑/配音开源模型汇总。([siliconflow.com/articles/zh-Hans/best-open-source-AI-models-for-podcast-editing](https://www.siliconflow.com/articles/zh-Hans/best-open-source-AI-models-for-podcast-editing))

### 8.3 中文行业分析 (理解生态)

| 资源 | 要点 | 来源 |
|------|------|------|
| **《深耕有限性:AI 播客的生成逻辑、实践困囿与适配场景》** | 分析 NotebookLM 等工具的脚本生成逻辑与适用场景 | [青年记者/腾讯新闻](https://news.qq.com/rain/a/20260204A01AKC00) |
| **《五分钟生成一档播客!》** | 实测 5000 字 2-3 分钟生成 6 分钟中文音频 | [澎湃新闻](https://www.thepaper.cn/newsDetail_forward_30493807) |
| **《AI 播客能否抢滩 AIGC》** | AI 播客降低生产门槛，辅助脚本/剪辑/分发 | [知乎专栏](https://zhuanlan.zhihu.com/p/1960364882831575011) |

---

## 9. 单人播客脚本结构最佳实践

单人播客**没有对话来撑节奏，全靠脚本结构**,因此结构设计至关重要。综合 Captivate、Buzzsprout、Stage 32 的编剧经验：

### 9.1 黄金结构 (钩子弧线)

```
[Hook 钩子 0-15s]   反常识事实 / 痛点提问 / 悬念
        ↓
[Promise 承诺]      "听完这期你会知道……"
        ↓
[Body 正文]         3-5 个要点,每个:结论先行 → 证据/故事支撑 → 过渡
        ↓
[Climax 高潮]       最有力的洞察/反转
        ↓
[CTA 收尾]          回顾要点 + 行动建议 / 思考题
```

> 来源：[Captivate - Perfect Podcast Script(含模板)](https://www.captivate.fm/learn-podcasting/record/write-perfect-podcast-script-plus-examples-templates)
> 来源：[Buzzsprout - 8 Script Templates](https://www.buzzsprout.com/blog/write-podcast-script-examples)

### 9.2 从编剧借来的技巧

- **钩子前置**:剧本写作的 hook 技巧可直接用于播客独白
> 来源：[Stage 32 - How to Use A.I. to Turn Your Screenplay into a Podcast](https://www.stage32.com/blog/3049)
- **节奏控制**:每 3-5 分钟埋一个新钩子，防止中段疲劳
> 来源：[Towards Generative AI(Medium)- 具体化吸引力](https://medium.com/towards-generative-ai/the-ai-prompt-that-turns-podcast-ideas-into-professional-scripts-3b4e3ceb9241)

### 9.3 独白脚本 vs 书面文章的关键差异 (提示词要强调)

| 维度 | 书面文章 | 独白脚本 |
|------|---------|---------|
| 人称 | 第三人称/客观 | **第一人称"我"** |
| 句长 | 可长可复杂 | **短句、口语** |
| 过渡 | "首先/其次/综上" | **"说到这…"/"你可能会问…"** |
| 结构 | 标题分层 | **听觉友好的钩子弧线** |
| 标记 | 无 | **[停顿]/[笑]/[加重]** 指导 TTS |

---

## 10. 实施建议

### 10.1 针对 SelfMediaTool 的落地建议

考虑到本项目已有的音频/文本处理能力，单人播客方案**落地成本远低于双人**,建议作为**首选 PoC**:

```
推荐技术栈(中文):
  · 脚本生成:GLM / 通义 / DeepSeek(用 4.1 提示词)
  · 长文本 TTS:Qwen3-TTS(开源、长文本稳定)或 MiniMax
  · 拼接:FFmpeg(块间静音 + 响度归一化 -16 LUFS)
```

### 10.2 起步提示词 (可直接用)

直接使用 **[第 4.1 节](#41-★★★★★-单人播客脚本提示词模板综合最佳实践)** 的模板，把 `{时长}`、`[风格]`、`[听众画像]`、`{article_content}` 替换为实际值即可。

### 10.3 选型决策树

```
你的内容是知识/新闻/故事/评论类吗?
  ├─ 是 → 单人独白(本报告方案)
  │       └─ 需要最高音质? → ElevenLabs
  │       └─ 需要开源/中文? → Qwen3-TTS + GLM
  │       └─ 只想快速出片? → Wondercraft / Noiz AI
  └─ 否(观点碰撞/娱乐/深度访谈)→ 双人对话(见上一份报告)
```

---

## 11. 完整信息来源索引

### 单/双人对比研究
- [ResearchGate - Comparison of Listening Experiences: Monologue vs Dialogue](https://www.researchgate.net/publication/389937262_Comparison_of_Listening_Experiences_by_Podcast_Styles_Monologue_versus_Dialogue)
- [Research Square - 论文 PDF](https://www.researchsquare.com/article/rs-6217086/latest.pdf)
- [Zara Zhang - The Magic of Two: Why Dual-Host Podcasts](https://zarazhang.substack.com/p/the-magic-of-two-why-dual-host-podcasts)
- [LinkedIn - Josh P.: Why two-host podcasts feel more engaging(替代学习理论)](https://www.linkedin.com/posts/josh-peak_why-do-two-host-podcasts-feel-more-engaging-activity-7378550141328449537-WEQg)

### 提示词与脚本模板
- [dev.to - Podcast Script Prompt Complete Template](https://dev.to/huizhudev/i-built-a-podcast-script-prompt-that-actually-works-heres-the-complete-template-23h1)
- [HackerNoon - AI Prompt Turns Podcast Ideas Into Professional Scripts](https://hackernoon.com/i-built-an-ai-prompt-that-turns-podcast-ideas-into-professional-scriptsand-it-actually-work)
- [Reddit r/PromptEngineering - Podcast Generator Prompt](https://www.reddit.com/r/PromptEngineering/comments/1rn8kao/i_built_a_podcast_generator_prompt_for_chatgpt_so/)
- [Towards Generative AI(Medium)- The AI Prompt That Turns Ideas Into Scripts](https://medium.com/towards-generative-ai/the-ai-prompt-that-turns-podcast-ideas-into-professional-scripts-3b4e3ceb9241)
- [Riverside - 45 AI Prompts for Podcasters](https://riverside.com/blog/ai-chatgpt-prompts-for-podcasters)
- [AI Academy - 35 Best ChatGPT Prompts for Podcasters 2026](https://academy.techpresso.co/prompts/chatgpt-prompts-podcast)
- [Talks.co - Podcast Script Generator + 10-Step Guide](https://talks.co/p/podcast-script-generator/)
- [Captivate - How to Write the Perfect Podcast Script](https://www.captivate.fm/learn-podcasting/record/write-perfect-podcast-script-plus-examples-templates)
- [Buzzsprout - How to Write a Podcast Script(8 Templates)](https://www.buzzsprout.com/blog/write-podcast-script-examples)
- [Stage 32 - Turn Your Screenplay into a Podcast](https://www.stage32.com/blog/3049)

### 长文本单音色 TTS(单人播客核心难点)
- [Long-form TTS is broken: how TADA and Borderless are fixing it](https://www.arunbaby.com/speech-tech/0064-long-form-tts-is-broken/)
- [Parler-TTS Issue #11 - Consistent voices across chunks](https://github.com/huggingface/parler-tts/issues/11)
- [Qwen3-TTS 技术报告 (arXiv)](https://arxiv.org/html/2601.15621v1)
- [High-Quality Long-Form TTS with Qwen3(Medium)](https://medium.com/data-science-collective/high-quality-long-form-tts-with-qwen3-open-weight-models-cdd6e3d00df0)
- [Google Cloud - Gemini-TTS 文档](https://docs.cloud.google.com/text-to-speech/docs/gemini-tts)
- [Unsloth - TTS Fine-tuning Guide](https://unsloth.ai/docs/basics/text-to-speech-tts-fine-tuning)
- [The Neural Maze - Beyond Text: Vision & TTS Finetuning](https://theneuralmaze.substack.com/p/beyond-text-a-guide-to-vision-and)
- [LinkedIn - Building an AI audiobook people want to listen to](https://www.linkedin.com/pulse/building-ai-audiobook-people-actually-want-listen-philip-kiely-q1imc)
- [Reddit - 1-hour-long voice overs 讨论](https://www.reddit.com/r/TextToSpeech/comments/1oyer1p/any_open_source_tts_that_can_generate_1_hour_long/)
- [Temporal - Create audiobooks from text(工程参考)](https://learn.temporal.io/tutorials/java/audiobook/)
- [Respeecher - AI Voices for Podcasts & Audiobooks](https://www.respeecher.com/podcasts-audiobooks)
- [Audiobox(arXiv)- 统一音频生成](https://arxiv.org/html/2312.15821v1)

### 开源项目
- [Audiobook Maker - GitHub](https://github.com/JarodMica/audiobook_maker)
- [Voicebox - 本地 TTS 桌面应用](https://voicebox.sh/)
- [Podcast-Generator (justlovemaki) - GitHub](https://github.com/justlovemaki/Podcast-Generator)
- [awesome-ai-voice - 开源 TTS 清单](https://github.com/wildminder/awesome-ai-voice)
- [BentoML - Best Open-Source TTS Models 2026](https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models)
- [Modal - Top Open-Source TTS Models](https://modal.com/blog/open-source-tts)
- [Reddit r/LocalLLaMA - Best local open source TTS](https://www.reddit.com/r/LocalLLaMA/comments/1f0awd6/best_local_open_source_texttospeech_and/)

### 商业工具与工作流
- [Wondercraft - AI Podcast Generator](https://www.wondercraft.ai/tools/ai-podcast-generator) | [官网](https://www.wondercraft.ai/) | [Parrot Mode(Podnews)](https://podnews.net/press-release/wondercraft-parrot-mode) | [The Podcast Host 评测](https://www.thepodcasthost.com/recording-skills/wondercraft-review/)
- [Noiz AI - Podcast Voice Generator(支持单人模式)](https://noiz.ai/use-cases/zh-Hans/podcast-voice-generator)
- [ElevenLabs - Podcast 用例](https://elevenlabs.io/use-cases/podcasts)
- [Murf AI](https://murf.ai/)
- [HeyGen - AI Narrator](https://www.heygen.com/tool/ai-narrator)
- [Podcastle 教程 (YouTube)](https://www.youtube.com/watch?v=XA0rZuJjwG4)
- [NoteGPT - AI Podcast Generator](https://notegpt.io/ai-podcast-generator)
- [Podsqueeze - AI Podcast Generator](https://podsqueeze.com/ai-podcast-generator/)
- [Monica AI - Podcast Generator](https://monica.im/en/ai-podcast)
- [AnySpeech - AI Podcast Generator](https://anyspeech.io/ai-podcast-generator) | [博客教程](https://anyspeech.io/blog/how-to-make-an-ai-podcast)
- [Swell AI - How to Start a Solo Podcast](https://www.swellai.com/blog/how-to-start-a-solo-podcast)
- [Jellypod - Best AI Script Generators 2026](https://www.jellypod.com/blog/best-ai-script-generators)
- [Recast Studio - AI Podcast Script Generator](https://recast.studio/blog/ai-podcast-script-generator-write-scripts-in-minutes)
- [ByteBridge - Creating Podcasts with AI: End-to-End Workflow](https://bytebridge.medium.com/creating-podcasts-with-ai-a-practical-end-to-end-workflow-ideas-script-voice-edit-9b2b0a2780df)
- [Omri Lavi - Building an AI-Generated Podcast](https://omrilavi.com/blog/building-ai-podcasts-and-letting-go/)
- [AutoContent API - Best AI Podcast Generators 2026](https://autocontentapi.com/best-ai-podcast-generator)
- [HuggingFace - How to Make an AI Podcast](https://huggingface.co/blog/LE15l/make-ai-podcast-using-ai-voices-and-llms)
- [Google Cloud Blog - Build a Podcast with Gemini 1.5 Pro](https://cloud.google.com/blog/products/ai-machine-learning/learn-how-to-build-a-podcast-with-gemini-1-5-pro/)
- [Generative AI Newsroom - Transforming Longform Text into Multimedia](https://generative-ai-newsroom.com/transforming-longform-text-into-multimedia-using-generative-ai-5cc50fa9b460)

### 中文生态
- [智谱 AI - 播客生成](https://docs.bigmodel.cn/cn/best-practice/creativepractice/podcastgeneration)
- [阿里云 - 通义音频播客生成](https://help.aliyun.com/zh/model-studio/brief-introduction-of-ai-podcast)
- [MiniMax - AI 播客生成实战](https://platform.minimaxi.com/docs/solutions/aipodcast)
- [SiliconFlow - 2026 播客编辑最佳开源 AI 模型](https://www.siliconflow.com/articles/zh-Hans/best-open-source-AI-models-for-podcast-editing)
- [SpeakUp AI(aibase)](https://top.aibase.com/tool/speakup-ai)
- [LOVO AI(中文)](https://lovo.ai/zh/usecase/podcasts)
- [澎湃新闻 - 五分钟生成一档播客](https://www.thepaper.cn/newsDetail_forward_30493807)
- [青年记者 - 深耕有限性:AI 播客的生成逻辑](https://news.qq.com/rain/a/20260204A01AKC00)
- [知乎专栏 - AI 播客能否抢滩 AIGC](https://zhuanlan.zhihu.com/p/1960364882831575011)

### NotebookLM 单人模式
- [Reddit r/notebooklm - One podcast host instead of two?](https://www.reddit.com/r/notebooklm/comments/1hftel0/one_podcast_host_instead_of_two/)
- [Google Blog - NotebookLM update(Customize 入口)](https://blog.google/innovation-and-ai/products/notebooklm-update-october-2024/)
- [ClipRise - ElevenLabs TTS vs Text-to-Dialogue(技术对比)](https://www.cliprise.app/learn/comparisons/models/elevenlabs-tts-vs-text-to-dialogue)
- [FireRedTTS-2(arXiv)- 长对话语音生成](https://arxiv.org/html/2509.02020v2)

*报告完。本报告与《文章生成播客调研报告》（双人对话向）互补，建议合并阅读以获得完整图景。如需针对单人播客做代码原型（如 GLM + Qwen3-TTS 流水线），可在此基础上继续展开。*
