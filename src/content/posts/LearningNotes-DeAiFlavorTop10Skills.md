---
title: 【学习笔记】去 AI 味十大 Skill 榜：原理拆解、横向对比与选型指南
published: 2026-06-21
description: 整理 LINUX DO「去AI味十大skill」榜单，按六大方法论派别拆解 humanizer、Humanizer-zh、nuwa-skill 等 10 个写作去味 Skill，提炼可复用的去 AI 味检查清单与改写对照表，并附场景选型与社区实测局限。
lang: zh
tags: [学习笔记, 工具分享]
toc: true
abbrlink: de-ai-flavor-top10-skills
---

> 📌 **内容来源**：本文榜单整理自 LINUX DO 讨论帖《去 AI 味十大 skill》（2026-06-20），各 Skill 的实现细节与来源来自对应 GitHub 仓库；非逐字转载，含个人分析、横向对比与方法论提炼。

![去 AI 味十大 Skill 榜](/assets/images/2026/20260621/de-ai-flavor-top10.png)

最近在 LINUX DO 上刷到一张「去 AI 味十大 Skill 榜」，把当下围绕 Claude Code / Codex / Hermes Agent 生态里、专门用来「让 AI 写的稿不再一眼假」的十个 Skill 拉了个榜单。我挨个扒了一遍它们的 GitHub 仓库，发现这十个东西虽然名字五花八门，背后其实是同一套方法论。

这篇笔记就做三件事：把每个 Skill 是什么、来源在哪讲清楚；按方法论给它们分个类、做个横向对比；最后提炼出一份**不依赖任何 Skill 也能用**的「去 AI 味」检查清单和改写对照表。

---

## 1. 先说结论：什么是「AI 味」

在聊 Skill 之前，得先搞清楚我们到底在去什么。「AI 味」不是某种玄学，它本质上是 LLM 在 RLHF 训练后被规训出来的一套**「安全、得体、面面俱到」的模式化写作**。安全的结果就是无聊——一眼能看出「这不是人写的」。

典型的 AI 味有五个特征：

| 特征 | 表现 | 举例 |
|---|---|---|
| 套路结构词 | 过度依赖固定过渡词 | 首先／其次／再次／最后、总而言之、综上所述、值得一提的是、不难发现、由此可见 |
| 词汇机器味 | 偏爱书面化、抽象动词 | 赋能、助力、旨在、致力于、涵盖；「利用」代替「用」、「进行讨论」代替「聊聊」 |
| 结构过于工整 | 数字列举、段落对称 | 永远的「总—分—总」，每段长度相近，开头千篇一律 |
| 正能量升华 | 结尾必须拔高 | 鸡汤式总结、强行上价值、不敢表达负面 |
| 内容空洞 | 信息密度低 | 没有具体案例、数据、个人经历；观点中庸不表态 |

一句话：**AI 味 = 模式化 + 不犯错 + 没人味**。所有去 AI 味的 Skill，本质上都是在跟这五条特征对着干。

---

## 2. 十大 Skill 全景一览

先把十个 Skill 摆一起看，后面再分门别类细讲。

| # | Skill | 一句话定位 | 方法论派别 | 主要语言 | 来源 |
|---|---|---|---|---|---|
| 01 | humanizer | 去 AI 写作痕迹的元老，鼻祖 | 去味·去腔 | 英文 | [blader/humanizer](https://github.com/blader/humanizer) |
| 02 | Humanizer-zh | 中文学术去味、降检测率 | 去味·去腔 | 中文 | [redbaronyyyyy-eng/humanizer-zh-academic](https://github.com/redbaronyyyyy-eng/humanizer-zh-academic) |
| 03 | stop-slop | 去掉文字里的套路腔 | 去味·去腔 | 中英 | [yanyintingyou/stop-slop-cn-en](https://github.com/yanyintingyou/stop-slop-cn-en) |
| 04 | taste-skill | 给 AI 审美，少写无聊套话 | 审美判断 | 通用 | [leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill) |
| 05 | ai-flavor-remover | 去 AI 味，专治模板句壳 | 去味·去腔 | 中文 | [B1lli/remove-ai-flavor-writing-skill](https://github.com/B1lli/remove-ai-flavor-writing-skill) |
| 06 | shuorenhua | 「说人话」中文去味改写 | 去味·去腔 | 中文 | [MrGeDiao/shuorenhua](https://github.com/MrGeDiao/shuorenhua) |
| 07 | nuwa-skill | 蒸馏任何人的表达风格 | 文风蒸馏 | 通用 | [alchaincyf/nuwa-skill](https://github.com/alchaincyf/nuwa-skill) |
| 08 | writing-agent | 去 AI 味全栈写作系统 | 全栈系统 | 通用 | 社区合集（见文末参考资料） |
| 09 | chatgpt-comparison-detection | 检测文本是不是 AI 写的 | 检测 | 通用 | [Hello-SimpleAI/chatgpt-comparison-detection](https://github.com/Hello-SimpleAI/chatgpt-comparison-detection) |
| 10 | De-AI-Prompt-Enhancer | 去 AI 味提示词增强 | 提示词增强 | 中文 | [OUBIGFA/De-AI-Prompt-Enhancer-Writer-Booster-SKILL](https://github.com/OUBIGFA/De-AI-Prompt-Enhancer-Writer-Booster-SKILL) |

可以看出，十个里有一半都是「去味·去腔」这一派，差别主要在语言和切入角度。下面按派别拆。

---

## 3. 按方法论分六大派

### 3.1 去味·去腔派（模式替换，绝对主力）

这是榜单里人数最多的一派，思路高度一致：**把「AI 写作的高频信号」整理成一份清单，然后让模型逐条扫描、改写掉**。差别只在于清单针对哪种语言、聚焦哪类毛病。

**humanizer**（`blader/humanizer`，25k+ ⭐）

整个生态的鼻祖。它的核心思路是基于 Wikipedia《Signs of AI-generated writing》相关条目，把英文 AI 写作的典型信号整理成一套可执行规则。后面几乎所有语言版本都是它的 fork 或精神继承者。定位英文，是这一派的「祖师爷」。

**Humanizer-zh**（`redbaronyyyyy-eng/humanizer-zh-academic`）

中文版，而且专门冲着「学术写作 + 降 AIGC 检测率」去。把 humanizer 的思路本地化到中文：治理「首先/其次」「综上所述」「赋能」这类八股词，目标是让中文学术稿在知网、大雅等检测平台上没那么扎眼。

**stop-slop**（原版属 Hermes Agent 生态，中文适配见 `yanyintingyou/stop-slop-cn-en`）

名字直白——「别再 slop（糊弄）了」。聚焦「套路腔」，即那些一看就是模型硬凑的过渡句和总结句，中英双语都管。

**ai-flavor-remover**（`B1lli/remove-ai-flavor-writing-skill`，Codex 生态）

中文去味，但切入点更具体：专治两类东西——**模板句壳**（「在当今快速发展的时代背景下……」这种万能开头）和**假互动结尾**（「让我们一起来看看吧！」「你学会了吗？」）。颗粒度比前几个更细。

**shuorenhua**（`MrGeDiao/shuorenhua`）

「说人话」——名字就是主张。定位是「中文优先的去 AI 味改写」，强调三件事：**保事实**（不能为了去味改错数据）、**分场景**（公众号、报告、文案语气不同）、**改完可直接发布**（不是给你草稿，是给你成品）。兼容 Codex / Claude Code / Cursor / ChatGPT。

> 这五个的共性：都把「去 AI 味」当成一个**有边界、可枚举的改写任务**，而不是玄学。这是整张榜单最值得学的思路。

### 3.2 文风蒸馏派 —— nuwa-skill

`alchaincyf/nuwa-skill`（女娲）。这一派的思路跟前五个完全不同：它不删「AI 味词」，而是**把某个真实人物的表达风格蒸馏成一个 Skill**。

你可以喂给它马斯克、Naval、芒格、费曼的语料（或自己的历史文章），它提炼出这个人的句式、用词、节奏，之后让模型按这套风格写作。基于开放的 Agent Skills 协议，跨 runtime，Claude Code / Codex / Cursor / ChatGPT 都能跑。

换句话说，前五派是「别写得像个机器」，nuwa 是「写得像某个人」——这是更高级、也更难的一档。

### 3.3 审美判断派 —— taste-skill

`leonxlnx/taste-skill`，口号是「gives your AI good taste」。需要说明的是，它的仓库实际上主要面向 **UI / 设计审美**（布局、排版、动效、间距，防止 AI 生成千篇一律的样板界面），并非纯粹的写作 Skill。

之所以被归进「去 AI 味」榜单，是因为它解决的是同一个根问题——**让模型的输出摆脱「无聊的默认值」**。不管是写界面还是写文字，「有审美、敢取舍」都是去 AI 味的底层能力。如果你要做的是前端 / 设计相关，它比写作类 Skill 更对路。

### 3.4 全栈系统派 —— writing-agent

榜单里的「writing-agent（去 AI 味全栈写作系统）」源自社区合集（X 用户 @kakao8888 的去 AI 味 Skill 合集是这批榜单的重要入口，见参考资料）。它不是单点改写，而是把**写作的全流程**——选题、起草、去味、自检——串成一个 Agent 系统。

我没找到它唯一权威的 GitHub 主仓库（社区里同名项目较杂），所以这条更建议你当成「去 AI 味 + 全流程编排」的**思路参考**，而不是直接 clone 的项目。

### 3.5 检测派 —— chatgpt-comparison-detection

`Hello-SimpleAI/chatgpt-comparison-detection`。严格说它不是「去味」，而是「检测」——配套 HC3（Human ChatGPT Comparison Corpus）数据集和模型，用来判断一段文本到底是不是 AI 写的。

把它放进榜单的逻辑很清楚：**去味之前先知道有多「AI 味」**。改完一遍，跑个检测看分数降没降，形成闭环。检测和去味是一对镜像问题。

### 3.6 提示词增强派 —— De-AI-Prompt-Enhancer

`OUBIGFA/De-AI-Prompt-Enhancer-Writer-Booster-SKILL`。这一派的姿势最轻——它**不在运行时改写你的稿子**，而是给你一套「去 AI 味的提示词」，打包成 SKILL 格式，Claude Code / Cursor / Windsurf 都能用。

适合不想装一堆运行时 Skill、只想在 system prompt 里塞一段「写的时候自动避开套路」的人。本质是把前面几派的方法论固化成提示词。

> **上手提示**：这批 Skill 大多遵循开放的 Agent Skills 协议，多数支持「一行命令安装」，并且跨 Claude Code / Codex / Cursor 等多个 runtime。具体装法看各仓库 README，本文不逐个贴命令。

---

## 4. 共同的方法论：这些 Skill 到底在做什么

把六个派别摊开看，**底层全是同一套三步走**：

```text
1. 枚举信号 (pattern catalog)
   ── 把「AI 写作的高频特征」整理成清单（八股词、模板句壳、对称结构、升华结尾……）
2. 改写规则 (rewrite rules)
   ── 针对每类信号定义替换/重构策略（口语化、打碎对称、加细节、删升华）
3. 自检 / 评分 (self-check)
   ── 改完扫描一遍，对剩余的 AI 味打分，必要时再过一轮
```

而且这条方法线的源头很清晰：**Wikipedia《Signs of AI-generated writing》→ blader/humanizer → 各语言 fork**。中文版（Humanizer-zh、ai-flavor-remover、shuorenhua）无非是把英文那套信号清单换成中文的「首先/其次/赋能/综上所述」，再加一点本地化的毛病（比如公众号特有的「假互动结尾」）。

这意味着：**你其实不必非得装某个 Skill**。把下面这份清单存下来，写作前对照扫一遍，就能干掉八成的 AI 味。

### 一份拿来即用的「AI 味检查清单」

```text
□ 开头是不是「在……背景下／随着……的发展」这类万能句？
□ 过渡是不是「首先／其次／再次／最后」一路排下来？
□ 结尾是不是「综上所述／总而言之／让我们一起……」强行升华？
□ 有没有堆「赋能／助力／旨在／致力于／涵盖」这类抽象动词？
□ 有没有「进行讨论」「做出贡献」这种把动词名词化的冗余表达？
□ 段落是不是长度差不多、结构高度对称？
□ 通篇有没有一个具体案例、数据或个人经历？
□ 有没有一句明确的、带立场的判断（而不是面面俱到）？
□ 语气是不是从头到尾一样客气、一样正能量？
```

九条里命中三条以上，基本就是「一眼假」。

---

## 5. 改写对照表（拿来即用）

| AI 味表达 | 人话表达 |
|---|---|
| 在当今快速发展的时代背景下 | （直接删掉，或换成具体场景） |
| 首先……其次……再次……最后 | 用「一是……另外……」或干脆拆成自然段 |
| 综上所述 / 总而言之 | 所以／说白了／一句话讲 |
| 值得一提的是 | 顺便说一句／还有一点 |
| 我们一起来看看吧 | （删掉，或换成具体动作） |
| 赋能（用户）／助力（企业） | 帮（用户）／让（企业）能 |
| 进行讨论 / 进行研究 | 聊／研究 |
| 旨在提升效率 | 想让效率高一点 |
| 这充分体现了……的重要性 | （删掉，或换成具体后果） |
| 你学会了吗？ | （删掉） |

这张表基本覆盖了中文去味 Skill 里最高频的替换规则。核心就一条：**把书面化的、抽象的、面面俱到的词，换成你平时说话会用的词**。

---

## 6. 怎么选：按场景给建议

| 你的场景 | 推荐方向 | 理由 |
|---|---|---|
| 英文博客 / 文档去味 | humanizer | 鼻祖、规则全、英文信号最准 |
| 中文学术稿、要降检测率 | Humanizer-zh | 专门冲中文学术 + 检测平台优化 |
| 公众号 / 自媒体中文稿 | ai-flavor-remover、shuorenhua | 切中文特有毛病（句壳、假互动） |
| 想模仿某个人的文风 | nuwa-skill | 唯一做「风格蒸馏」的 |
| 前端 / UI 去样板感 | taste-skill | 设计审美，非写作 |
| 改完想自检「还多 AI」 | chatgpt-comparison-detection | 检测闭环 |
| 不想装 Skill，只想改提示词 | De-AI-Prompt-Enhancer | 提示词打包，最轻 |
| 想要写作全流程自动化 | writing-agent（思路参考） | 全栈编排 |

一句话决策：**中文写作首选 shuorenhua 或 ai-flavor-remover，英文首选 humanizer，要风格找 nuwa，要自检配 detection，怕麻烦就上 De-AI 提示词**。

---

## 7. 诚实的坑：社区实测与局限

说了这么多好处，必须把 LINUX DO 评论区里的真实反馈摆出来，免得你装完发现「就这？」：

- **「效果一般」是高频评价**。多个用户表示「用过几个，效果不是很好」「写小说试过其中几个，通常都过不了朱雀」。去味 Skill 远没有宣传的那么神。
- **检测率下降有限，且不可靠**。有人实测 Humanizer-zh：知网平台检查 AI 率仍有 73%，大雅轻度疑似 80%（虽然总体报告记为 0，但那 80% 就是整段复制 AI 生成的部分）。说明它能「降低机器味」，但**降不到「查不出来」**。
- **检测器 vs 去味器是军备竞赛**。今天的去味 trick，明天检测器就更新规则。指望一个 Skill 一劳永逸过检测，不现实。
- **哲学悖论**：有评论吐槽「用 Skill 来喂给 AI，让 AI 输出人话，似乎有点滑稽」。本质是让一个机器去模仿「不像机器」——上限就在那。
- **社区共识：领域风格提炼更靠谱**。不止一人指出「最好还是拿领域类的文章提炼一下风格」「想要达到自己预期，还是要通过生图去做垫子」（指用自己的真实素材打底）。

我的看法是：**把这批 Skill 当成「写作自检的脚手架」，而不是「一键去味的银弹」**。它们最有价值的产物其实是第 4 节那张检查清单和第 5 节那张对照表——那才是剥离了 hype 之后、真正能迁移到你任何写作里的东西。

---

## 8. 一句话总结

> 去 AI 味的尽头不是某个 Skill，而是「打破套路、回归口语、敢表态、有细节」——这十个 Skill 共享同一套「枚举信号 + 改写 + 自检」的方法论，把它们的规则提炼成清单，你自己就是最好的去味器。

---

## 参考资料

**榜单与讨论：**

- [LINUX DO：去 AI 味十大 skill](https://linux.do/t/topic/2436493)（原帖，2026-06-20）
- X 用户 [@kakao8888](https://x.com/kakao8888) 去 AI 味 Skill 合集（社区入口）

**Skill 仓库：**

- [blader/humanizer](https://github.com/blader/humanizer)（humanizer，鼻祖）
- [redbaronyyyyy-eng/humanizer-zh-academic](https://github.com/redbaronyyyyy-eng/humanizer-zh-academic)（Humanizer-zh）
- [yanyintingyou/stop-slop-cn-en](https://github.com/yanyintingyou/stop-slop-cn-en)（stop-slop 中英适配）
- [B1lli/remove-ai-flavor-writing-skill](https://github.com/B1lli/remove-ai-flavor-writing-skill)（ai-flavor-remover）
- [MrGeDiao/shuorenhua](https://github.com/MrGeDiao/shuorenhua)（shuorenhua）
- [alchaincyf/nuwa-skill](https://github.com/alchaincyf/nuwa-skill)（nuwa-skill）
- [leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill)（taste-skill）
- [Hello-SimpleAI/chatgpt-comparison-detection](https://github.com/Hello-SimpleAI/chatgpt-comparison-detection)（检测）
- [OUBIGFA/De-AI-Prompt-Enhancer-Writer-Booster-SKILL](https://github.com/OUBIGFA/De-AI-Prompt-Enhancer-Writer-Booster-SKILL)（De-AI 提示词）

**方法论延伸：**

- Wikipedia：[Signs of AI-generated writing](https://en.wikipedia.org/wiki/Signs_of_AI-generated_writing)（humanizer 的思想源头）
- [知乎：文章 AI 味太浓？这 8 个技巧全方位解决机器味](https://zhuanlan.zhihu.com/p/692546989)
- [少数派：AI + Skill 去 AI 味](https://sspai.com/post/109288)
