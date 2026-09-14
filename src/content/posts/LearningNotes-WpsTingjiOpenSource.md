---
title: 【学习笔记】WPS 听记全拆解：四层功能、计费考古，与「录音转写 + AI 纪要」的开源替代全景
published: 2026-09-14
description: 「开会录音、自动转写、按人区分、一键纪要」是打工人最刚性的 AI 需求之一，WPS 听记（原语音速记）就是这个赛道的国民级入口。本文用官方社区一手帖拆解它的四层功能（实时转写、说话人分离、AI 纪要、音字联动编辑）与计费体系（超会员每 31 天赠 180 分钟、充值 18 元起、单文件 1GB/5 小时、2024-03 会员体系拆分出 AI 会员与大会员、灵犀专业版 2026-08 开始收费），顺带揭开 wps.cn 域下成批第三方 SEO 稿把价格信息搅浑的现象；再用 GitHub API 逐个核验 star 数与许可证，梳理开源替代全景——Meetily（30.7k stars）、WhisperX、FunASR（SenseVoice 中文 CER 约为 Whisper 一半）、WhisperLiveKit、Vibe、Buzz、noScribe、sherpa-onnx 等 13 个项目分层对照。结论：开源能平替每一层，但没有单品达到 WPS 听记级的开箱体验；中文场景的最优解不是 Whisper 而是 FunASR 家族；隐私与时长无限是本地方案的真护城河。
lang: zh
tags: [学习笔记, 工具分享]
abbrlink: wps-tingji-open-source
---

「开会录音，会后自动出纪要」大概是 AI 办公最刚性的需求：讯飞听见、通义听悟、飞书妙记、Otter.ai 都挤在这条赛道上，而 WPS 听记靠着 WPS Office 的装机量，是很多人接触这类工具的第一个入口。这篇笔记回答两个问题：**WPS 听记到底提供了什么**（功能与计费，全部用一手信源拆）；以及**开源世界能不能平替它**（13 个候选项目，star 数和许可证逐个用 GitHub API 核验，截至 2026-09-14）。

> **一句话结论**：WPS 听记是一台「实时转写 + 说话人分离 + AI 纪要 + 音字联动编辑」的四层一体机，工程成熟度体现在方言识别、行业词库、手机小程序随手可用这些细节上；开源世界**每一层都有全球最优解，但没有任何单品把四层拧成一台机器**——想要平替，就得按「模型层、说话人层、管线层、成品层」自己组装。中文场景有个额外惊喜：最优模型不是 Whisper，而是阿里的 FunASR 家族（SenseVoice 中文词错率约为 Whisper 的一半，速度快一个数量级）。

## WPS 听记是什么：从讯飞供能到 WPS AI 自研

[WPS 听记](https://suji.wps.cn/)（原名「语音速记」）是金山办公旗下的 ASR 转写平台，官方定位是「专业 ASR 转写平台」。入口比想象中多：网页端 suji.wps.cn、WPS Office 客户端和手机 App 内置功能、微信小程序「WPS 语音速记」，另有独立的「WPS 笔记」App 也内置了录音转写。

技术渊源值得记一笔：它的语音能力早期与科大讯飞深度绑定——官方社区帖披露「长语音输入由讯飞语记提供支持」，[新京报](https://m.bjnews.com.cn/detail/1751533018129575.html)的报道也证实 WPS 版语音速记曾由科大讯飞提供支持。2023 年 8 月，语音速记接入 WPS AI 自研引擎完成升级并更名听记，转写、声纹、摘要全链路切到自家的 WPS AI 上（[极客公园](https://www.geekpark.net/news/343775)）。

## 功能拆解：一台四层一体机

按官方社区[体验帖](https://bbs.wps.cn/topic/81036)的一手截图和官网介绍，功能可以归成四层：

**第一层：转写。**两条输入路径——实时录音转文字（边录边转、自动分段、关键词高亮、背景降噪），和音视频文件导入转写（支持 mp3/m4a/wav/aac/flac/amr，单文件最大 1GB、最长 5 小时）。官网还宣传多语言识别（20+ 语种互译）、**方言识别**和**自定义行业词库**——后两项是工程打磨度的标志，后面对照开源方案时会反复提到。

**第二层：说话人。**声纹识别自动区分发言人，多人会议按人分段；转写结果可以按说话人筛选，也可以按关键词筛选。体验帖实测反馈「准确率令人惊喜」（课堂场景），属于第一梯队水平。

**第三层：AI 纪要。**自动生成全文概要、章节列表、会议纪要（含会议主题、参会说话人、主要内容）、问答对话汇总，全部可复制、可二次编辑。这一层是 2023 年接入 WPS AI 后补齐的，也是当前所有竞品的主战场。

**第四层：编辑与生态。**转写文本可搜索、编辑、翻译；**音字联动**（点文字定位到音频位置）；一键导出 Word；接入 WPS 云文档，和 WPS 的办公生态无缝衔接。

2025 年 7 月 2 日还上线了**实时同传字幕**：中英双语字幕实时滚动加 AI 说话人总结，覆盖多语言交流和多人会议两种场景，并对听障用户免费开放（权益期内不限服务时长）——这个「听障免费」的公益动作是同类产品里少见的（[新京报](https://m.bjnews.com.cn/detail/1751533018129575.html)）。

## 计费考古：一手数据、会员变迁和 SEO 稿陷阱

计费是这次调研里水最浑的部分，值得单独拆。按时间线捋：

**2024-02，官方论坛一手计费帖**（[bbs.wps.cn/topic/18268](https://bbs.wps.cn/topic/18268)）：

| 项目 | 规则 |
| --- | --- |
| 超级会员 | 每 31 天赠送 180 分钟转写时长，当期有效、过期清零 |
| 超级会员 Pro | 每 31 天赠送 360 分钟，同样过期清零 |
| 实时转写计扣 | 预扣 1 分钟，之后每满 1 分钟扣 1 次 |
| 非会员充值 | 60 分钟 18 元，180 分钟 48 元，300 分钟 78 元，600 分钟 148 元，1800 分钟 428 元，3000 分钟 698 元 |
| 共享规则 | 语音速记（听记）与音频转文字共用同一池时长 |
| 文件限制 | 单文件最大 1GB、最长 5 小时；mp3/m4a/wav/aac/flac/amr |

**2024-03，会员体系拆分**：取消超级会员 Pro，新增 WPS AI 会员和大会员两档，AI 功能（含听记转写）从「超级会员附带权益」变成独立付费体系（[WPS 社区](https://bbs.wps.cn/topic/86095)）。此后有知乎实测称大会员包含听记每月 3000 分钟、日常使用绰绰有余（[知乎](https://zhuanlan.zhihu.com/p/1982017239768142831)）。

**2026-08，灵犀专业版开始收费**（[WPS 社区](https://bbs.wps.cn/topic/93545)），社区对「会员套娃」的抱怨持续发酵——超级会员之上套 AI 会员，AI 会员之上再分档（[知乎](https://zhuanlan.zhihu.com/p/2062955439466328660)）。

调研过程中还发现一个值得单独提醒的坑：**wps.cn 域名下 `article` 栏目里有成批的第三方 SEO 稿**。我实际读到的几篇，作者署名是「ToB SEO by 加搜科技」，发布时间集中在 2026 年年中，内容是「WPS AI 多少钱一个月」这类关键词导向的对比文，数字互相矛盾（比如宣称「免费额度每日 10 小时」，与一手论坛帖的按月赠时长规则对不上）。这些稿件托管在官方域名上、搜索权重很高，极易误导。判断方法很简单：凡是 wps.cn/article 路径下、署名带 SEO 字样的文章，数字一律不采信，以官方社区（bbs.wps.cn）一手帖和客户端实际展示为准。

## 开源替代全景：能平替每一层，但没有单一等价品

先把 13 个候选项目过一遍，star 数和许可证全部是 GitHub API 一手核验（截至 2026-09-14）：

| 项目 | Stars / 许可证 | 定位 |
| --- | --- | --- |
| [openai/whisper](https://github.com/openai/whisper) | 109.0k / MIT | 基础模型，英文场景事实标准 |
| [Zackriya-Solutions/meetily](https://github.com/Zackriya-Solutions/meetily) | 30.7k / MIT | **最接近的整体替代**：本地会议助手，麦克风加系统声音捕获、实时转写、Ollama 本地生成纪要 |
| [m-bain/whisperX](https://github.com/m-bain/whisperX) | 24.0k / BSD-2 | Whisper 加词级时间戳（wav2vec2 强制对齐）加 pyannote 说话人分离 |
| [chidiwilliams/buzz](https://github.com/chidiwilliams/buzz) | 21.5k / MIT | 纯离线文件转写与翻译，功能最简单 |
| [modelscope/FunASR](https://github.com/modelscope/FunASR) | 20.3k / MIT | 阿里达摩院工具包：转写、标点、VAD、说话人分离全流水线，**中文效果最好** |
| [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) | 14.7k / Apache-2.0 | 流式 ASR、TTS、说话人分离，覆盖 Android/iOS，更新极活跃（本文写作当天仍在推代码） |
| [QuentinFuxa/WhisperLiveKit](https://github.com/QuentinFuxa/WhisperLiveKit) | 11.0k / Apache-2.0 | 实时流式转写 + 说话人分离 + 翻译，全本地——「悬浮字幕/同传」的开源对应物 |
| [pyannote/pyannote-audio](https://github.com/pyannote/pyannote-audio) | 10.5k / MIT | 说话人分离事实标准（模型需在 Hugging Face 接受条款后下载） |
| [thewh1teagle/vibe](https://github.com/thewh1teagle/vibe) | 7.4k / MIT | 桌面转写应用：文件/URL/录音转写 + AI 摘要，后端可选 SenseVoice |
| [thepersonalaicompany/amurex](https://github.com/thepersonalaicompany/amurex) | 2.9k / AGPL-3.0 | 会议 copilot，2025-05 后近乎停更 |
| [kaixxx/noScribe](https://github.com/kaixxx/noScribe) | 2.2k / GPL-3.0 | 记者向转写 GUI：Whisper + pyannote 分离 + 时间锚点编辑 |
| [QwenAudio/Fun-ASR](https://github.com/QwenAudio/Fun-ASR) | 1.5k / Apache-2.0 | 新一代 LLM 路线 ASR 模型仓库，Fun-ASR-Nano 支持方言与口音 |
| [screenpipe/screenpipe](https://github.com/mediar-ai/screenpipe) | 21.6k / 自定义许可 | 24/7 屏幕加音频连续录制索引，更像「屏幕记忆」工具，许可证非标准 OSI 需注意 |

分层看各自的角色：

**模型层与说话人层。**英文场景的默认答案是 Whisper；中文场景见下一节的硬数据，最优解在阿里系。说话人分离的事实标准是 pyannote 3.1（WhisperX 内置集成），FunASR 生态里对应的是 cam++ 声纹模型。注意 pyannote 代码 MIT 但模型要在 Hugging Face 上接受条款才能下载，商用部署前看清楚。

**管线层。**WhisperX 解决「文件转写 + 词级时间戳 + 谁在说话」，是音字联动的最佳积木；WhisperLiveKit 解决「边说边转 + 分离 + 翻译」，自带网页界面，全本地跑，是对标 WPS 悬浮字幕和实时同传的最近似物；FunASR 则把整条流水线（流式 Paraformer 转写、fsmn-vad、ct-punc 标点、cam++ 分离、时间戳）打包成工具包，官方提供 Docker CPU/GPU 部署服务和 Windows SDK，还支持热词——`hotword='关键词 权重'` 直接填参数，这正是「自定义行业词库」的开源对应。

**成品层。**Meetily 是唯一把「捕获麦克风和系统声音、实时转写、本地 LLM 出纪要」做成消费级产品形态的（macOS/Windows/Linux 三平台，摘要后端可选 Ollama、Claude、Groq、OpenRouter 或任意 OpenAI 兼容端点；Windows 安装包用 Vulkan 版 whisper.cpp，要求 AVX2 CPU，CUDA 要自行源码编译）。两个使用前必知的细节：一是它是 open-core 模式，有付费的 PRO 版，README 曾把说话人分离列在 PRO 路线图上，开源社区版的功能完整度部署前要对照当期 README 核验；二是实时转写主打 NVIDIA 的 Parakeet 模型，中文效果要打问号，想中文好用得换后端。Vibe 是文件转写场景对普通用户最友好的选择（支持 SenseVoice 后端，中文体验好，有中文界面）；Buzz 最简单纯粹；noScribe 面向记者，分离加时间锚点编辑是特色；sherpa-onnx 则是移动端唯一的正经答案，提供 Android/iOS 的流式识别示例。

### 功能逐项对照

| WPS 听记功能 | 开源对应 | 差距评估 |
| --- | --- | --- |
| 实时录音转文字（中文） | FunASR 流式 Paraformer（600ms 切片两遍修正）/ WhisperLiveKit | 中文选 FunASR，Whisper 系中文偏弱 |
| 音视频文件导入转写 | Vibe / Buzz / noScribe / funasr CLI | 基本无差距 |
| 说话人分离 | pyannote 3.1 / FunASR cam++ | 无差距，有 GPU 更从容 |
| AI 纪要（概要/章节/纪要/问答） | Meetily 内置 Ollama；或 LLM 加提示词模板自组 | 管线现成，提示词工程自己来 |
| 音字联动编辑、导出 | WhisperX 词级时间戳加自建前端 / noScribe | 要自己组装，无统一体验 |
| 悬浮字幕 / 实时同传 | WhisperLiveKit（含翻译）；Win11 自带实时字幕（免费但非开源） | 可用，略糙 |
| 方言识别 | Fun-ASR-Nano（中英日加 7 种方言、26 种地域口音） | 新兴，可对标 |
| 自定义行业词库 | FunASR 热词功能 | 可对标，效果依赖模型 |
| 手机 / 小程序随手可用 | sherpa-onnx 移动端示例 | **最大差距**：无消费级开源 App |
| 云文档生态 | Meetily 有 Obsidian 插件 | 不可比 |

## 中文准确率的硬数据

「开源转中文不准」是常见偏见，数据不支持。[FunASR 官方实测](https://www.funasr.com/blog/funasr-vs-whisper-benchmark.html)（184 个中文文件，H100）：SenseVoice 词错率 7.81%，约为 Whisper 的一半，同时快 15 倍（169.6 倍实时率，10 秒音频 GPU 上约 50ms 出结果，非自回归架构的天然优势）；追求极致精度可以上 FireRedASR，词错率 2.89%，是中文开源模型里的精度天花板（[腾讯云开发者综述](https://cloud.tencent.com/developer/article/2642961)）。注意第一份数据出自 FunASR 官方博客，是「厂商测自家」的口径，量级可信、具体数字保留一分；但「中文场景 SenseVoice 显著优于 Whisper」这个方向性结论，与各家独立实测一致。

新的变量是 LLM 路线的 ASR：QwenAudio 组织下的 [Fun-ASR](https://github.com/QwenAudio/Fun-ASR) 把识别做成 LLM 微调任务，最新的 Fun-ASR-Nano（800M，2025-12 发布）直接把中文方言和地域口音写进能力清单——WPS 听记引以为傲的方言识别，开源侧正在快速补齐。

## 三套落地组合

**组合一：中文会议，追求质量。**FunASR 全家桶——流式 Paraformer 做实时转写（600ms 切片），SenseVoice 做文件离线转写，cam++ 做分离，ct-punc 补标点，热词填行业术语，最后接 Ollama 加本地 LLM 出纪要。Docker 部署服务齐全，SenseVoice 只有 234M 参数，普通 CPU 也能跑出可用速度。

**组合二：零代码，装完就用。**文件转写选 Vibe（SenseVoice 后端，中文体验好）；实时会议加自动纪要选 Meetily（Windows 注意 AVX2 要求，中文转写效果先实测再上车，说话人分离功能以当期 README 为准）。

**组合三：开发者自建管线。**WhisperX 或 funasr CLI 做转写加词级时间戳，pyannote 做分离，Ollama 做纪要，前端自己拼——音字联动、筛选说话人、导出格式全部自主可控，这是 WPS 听记给不了的自由度。

## 几点启示

- **一体机和积木是两种经济学。**WPS 把整条管线藏在一个红色录音按钮后面，你为「开箱」付费；开源世界每一层都有全球最优解，但没有人为你拧成一台机器。选型第一个问题不是「哪个更好」，而是「我要开箱还是要主权」。
- **中文 ASR 的主场早已换人。**拿 Whisper 跑中文会议再抱怨识别不准，是选型错误而不是模型错误——SenseVoice 词错率减半、速度快一个量级，Fun-ASR 连方言口音都在补齐。中文场景的默认答案应该在 FunASR 家族里找。
- **当一个产品的价格需要考古才能确定，这本身就是信号。**从 2024 年一手帖的按时长充值，到 AI 会员、大会员、灵犀专业版的层层拆分，再到 wps.cn 域下成批第三方 SEO 稿把信息搅浑——计费复杂度是产品策略的一部分。对比之下，「一次性硬件成本加无限时长」的开源模型显得相当诚实。
- **隐私是这个赛道开源方案的真护城河。**会议录音是含金量最高的语料之一，全链路云处理意味着商业机构的转写服务和数据权益条款深度绑定；而 Meetily、FunASR 们全本地跑。对内部会议、法务、医疗场景，这不是省钱问题，是合规问题。

## 参考资料

WPS 官方与一手信源：

- [WPS 听记官网](https://suji.wps.cn/) / [WPS 社区：听记功能体验帖（2026-01）](https://bbs.wps.cn/topic/81036) / [WPS 社区：计费与时长规则一手帖（2024-02）](https://bbs.wps.cn/topic/18268) / [WPS 社区：AI 功能与会员体系](https://bbs.wps.cn/topic/86095) / [WPS 社区：灵犀专业版收费讨论](https://bbs.wps.cn/topic/93545) / [WPS 学堂：语音速记官方教程](https://www.wps.cn/learning/course/detail/id/12929.html)

媒体与社区：

- [新京报：WPS 实时同传功能上线，听障用户免费](https://m.bjnews.com.cn/detail/1751533018129575.html) / [极客公园：语音速记接入 WPS AI 升级](https://www.geekpark.net/news/343775) / [知乎：大会员听记时长实测](https://zhuanlan.zhihu.com/p/1982017239768142831) / [知乎：会员套娃争议](https://zhuanlan.zhihu.com/p/2062955439466328660) / [腾讯云开发者：6 个开源中文 ASR 模型对比](https://cloud.tencent.com/developer/article/2642961)

开源项目（star 数与许可证为 GitHub API 2026-09-14 一手核验）：

- 整体方案：[Meetily](https://github.com/Zackriya-Solutions/meetily) / [Vibe](https://github.com/thewh1teagle/vibe) / [Buzz](https://github.com/chidiwilliams/buzz) / [noScribe](https://github.com/kaixxx/noScribe) / [screenpipe](https://github.com/mediar-ai/screenpipe) / [Amurex](https://github.com/thepersonalaicompany/amurex)
- 管线与模型：[FunASR](https://github.com/modelscope/FunASR) / [Fun-ASR](https://github.com/QwenAudio/Fun-ASR) / [WhisperX](https://github.com/m-bain/whisperX) / [WhisperLiveKit](https://github.com/QuentinFuxa/WhisperLiveKit) / [whisper](https://github.com/openai/whisper) / [pyannote-audio](https://github.com/pyannote/pyannote-audio) / [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx)

数据与综述：

- [FunASR vs Whisper 中文实测基准](https://www.funasr.com/blog/funasr-vs-whisper-benchmark.html) / [meetily.ai：2026 自托管会议转写工具综述](https://meetily.ai/blog/best-self-hosted-meeting-transcription-tools-2026)

相关笔记：

- [wewe-rss 死因解剖：半开源架构拆解与微信读书接口存续验证](/posts/wewe-rss-weread-mp-api/)——同样是对「开源程度」做一手核验的方法论
- [LTX-Desktop 全拆解](/posts/ltx-desktop-deep-dive/)——另一条「本地大模型工程学」路线：把 22B 视频模型塞进桌面
