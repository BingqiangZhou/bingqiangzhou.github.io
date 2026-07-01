---
title: 【学习笔记】AI 视频生成全景：有哪些方式、技术范式、开源与商业 SOTA（2026）
published: 2026-06-30
description: 系统梳理 2026 年 AI 视频生成——12 种生成模态（文生/图生/首尾帧/视频生视频/运镜/参考图/数字人/世界模型）、U-Net→DiT→Flow Matching 等技术范式、Sora 停服后中国厂商包揽榜首的排行榜（Seedance/Kling/Veo/Hailuo/Vidu）、Wan/HunyuanVideo/LTX-2/CogVideoX 开源选型与显存分级，以及 HF Space/硅基流动/本地 ComfyUI 与即梦·可灵·海螺等国内工具的免费实操路线
lang: zh
tags: [学习笔记]
abbrlink: ai-video-generation-survey
---

> 整理日期：2026-06-30
> 涵盖范围：12 种生成模态、技术范式、商业前沿与排行榜、开源选型、数字人口播、免费与国内工具实操
> 说明：本笔记关键信息均标注来源链接，便于追溯核实；标注「（未确认）」或「据报道」者为待二次核验项。AI 视频迭代极快（很多模型半年一代），正式商用前请以各平台最新页面为准。文末「九、按用途选型决策表」可直接跳读结论。

<!--
## 目录
- [一、核心结论（太长不看）](#一核心结论太长不看)
- [二、「用 AI 生成视频」有哪些方式：12 种模态总览](#二用-ai-生成视频有哪些方式12-种模态总览)
- [三、技术原理：AI 是怎么「拍视频」的？](#三技术原理ai-是怎么拍视频的)
- [四、商业前沿全景与排行榜（2026）](#四商业前沿全景与排行榜2026)
- [五、原生音频：2026 的分水岭](#五原生音频2026-的分水岭)
- [六、开源选型：Wan / HunyuanVideo / LTX-2 / CogVideoX 与对手们](#六开源选型wan--hunyuanvideo--ltx-2--cogvideox-与对手们)
- [七、数字人 / 口播 / 唇形同步：一个独立赛道](#七数字人--口播--唇形同步一个独立赛道)
- [八、免费与国内工具速览 + 实操指南](#八免费与国内工具速览---实操指南)
- [九、按用途选型决策表](#九按用途选型决策表)
- [十、参考资料](#十参考资料)
-->

## 一、核心结论（太长不看）

1. **格局已变，而且很反直觉**：开辟了 AI 视频赛道的 **OpenAI Sora 已停服**（web/app 2026-04-26 关停、API 2026-09-24 关停）；而 2026 年的榜首被**中国厂商包揽**——字节跳动 **Seedance 2.0** 同时登顶 Artificial Analysis 文生视频、图生视频（带音频）双榜（Elo 1219 / 1195）。
2. **原生音频是 2026 的分水岭**：Veo 3 首创「一次生成画面 + 同步对白 + 音效 + 配乐」后，Seedance 2.0、Kling 3.0、Vidu Q3、Sora 2、Grok Imagine 全部跟上；而 **Hailuo、Runway、Luma、Adobe 仍缺席**——这是它们目前最大的短板。选型第一步先问「要不要声音」。
3. **「用 AI 生成视频」远不止文生视频**：至少有 **12 种模态**（图生、首尾帧、视频生视频、运镜、参考图一致性、延长、数字人口播、修复外扩、循环、世界模型……）。**先选模态，再选模型**，是这条赛道最重要的选型直觉。
4. **开源已经逼近闭源**：Wan 2.2（首个开源 MoE 视频模型）、HunyuanVideo、**LTX-2（目前唯一开源、带原生音频的视频模型）** 质量已接近商业模型；而 **CogVideoX / LTX-Video 在 8–12GB 的消费级显卡上就能跑**。
5. **免费层几乎都禁商用 + 带水印**；真正「免费 + 可商用」的只有**本地开源**（Apache 系的 CogVideoX / Wan / LTX；⚠️ HunyuanVideo 是社区许可、排除欧盟/英国/韩国商用，不是纯开源）——这和姊妹篇[《AI 音乐生成全景》](/posts/ai-music-generation-survey/)是同一个结论。

> 来源：[Artificial Analysis 文生视频竞技场](https://artificialanalysis.ai/video/leaderboard/text-to-video) · [图生视频竞技场](https://artificialanalysis.ai/video/leaderboard/image-to-video) · [OpenAI Sora 停服说明](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation) · [BBC：Sora 关停报道](https://www.bbc.com/news/articles/c3w3e467ewqo)

---

## 二、「用 AI 生成视频」有哪些方式：12 种模态总览

很多人一提「AI 生成视频」就默认等于「文生视频」，其实那只是最基础的一种。**先把「你要解决的是哪一类问题」想清楚，比纠结用哪个模型重要得多**——下面这张表是全文的索引，后续每一节都是在展开其中某一行。

| 模态 | 一句话定义 | 最适合的场景 | 代表模型 / 工具 |
|---|---|---|---|
| **① 文生视频 T2V** | 只凭一段文字生成视频 | 零素材、从零构思创意 | Veo 3.1、Seedance 2.0、Kling 3.0、Wan 2.2 |
| **② 单图生视频 I2V** | 给一张图当首帧，补全后续运动 | 让静图「动起来」、给画作注入生命 | Runway Gen-4.5、Wan 2.2、HunyuanVideo-I2V |
| **③ 首尾帧 / 多关键帧 I2V** | 给定起止帧（甚至中段帧），生成中间过渡 | 精准控制开头和结尾、做转场 | Wan 2.1-FLF2V、LTX-2、Kling Start & End Frames |
| **④ 视频生视频 V2V / 风格化** | 改风格或内容、保留原片的运动结构 | 影视调色、风格迁移、换背景 | Runway Gen-4 V2V、Pika Pikaswaps、Wan V2V |
| **⑤ 视频延长** | 在已有片段末尾接续、延长时长 | 长镜头、续拍、补镜头 | Kling Extend、Runway Extend、Veo Extend |
| **⑥ 运镜 / Motion Brush / Dolly Zoom** | 指定镜头运动方向与强度，或涂抹局部让特定区域动 | 电影级镜头语言、推拉摇移 | Runway Camera Control + Motion Brush、Kling Motion Control |
| **⑦ 参考图 / 角色一致性** | 喂多张参考图（角色、物体、服装、场景），保持各自身份跨镜头不变 | 系列短片、AI 短剧、IP 稳定出场 | Pika 2.5 Scene Ingredients、Wan 2.7 R2V、Seedance 多图 |
| **⑧ 循环 / 无缝视频** | 首尾衔接、可无限循环播放 | 背景动图、MV、氛围素材 | Runway / Pika 的 loop 模式 |
| **⑨ 数字人 / 口播 / 唇形同步** | 用音频或文本驱动一张人像/数字人说话，口型表情对齐 | 营销口播、虚拟主播、教程 | EchoMimic V3、LatentSync、HeyGen、JoyHallo（中文） |
| **⑩ 视频修复 / 外扩 / 对象擦除** | 涂抹移除画面元素，或扩展画幅 | 去路人、横竖屏转换、补全 | Runway Inpainting、各模型 uncrop |
| **⑪ 原生音频 / 配乐** | 视频与同步的对白、音效、配乐**一次生成** | 有声短片、广告、叙事成片 | Veo 3 / 3.1、Seedance 2.0、Kling 3.0 Omni、LTX-2（开源） |
| **⑫ 3D / 4D / 世界模型** | 隐式学习物理、几何、动力学，把视频当「世界模拟器」 | 机器人 / 自动驾驶训练数据、物理仿真 | NVIDIA Cosmos、Sora 的世界模型愿景 |

一个直觉判断：**①② 是「从无到有」，③④⑤⑥⑦⑧⑩ 是「在已有素材上加工」，⑨ 是「让数字人说话」，⑪是「给视频配音」，⑫是「拿视频当仿真器」**。本文第四节讲商业模型（主要覆盖 ①②③⑦⑪），第六节讲开源（①②③④），第七节专讲 ⑨，第八节讲怎么免费跑起来。

---

## 三、技术原理：AI 是怎么「拍视频」的？

### 3.1 一段演进：U-Net → DiT → Flow Matching

早期的视频生成沿用图像扩散的 **U-Net 卷积骨干**，但卷积的「归纳偏置」限制了把模型做大。转折点是 **Sora（2024 年 2 月）引入 DiT（Diffusion Transformer，扩散 Transformer）**：把视频编码成一串时空 token，用 Transformer 在潜空间里迭代去噪。Transformer 的好处是**可以堆到几十 B 参数**——质量随规模近乎线性提升，DiT 从此成为事实标准。

2024–2025 年，业界又把训练目标从经典 DDPM 换成 **Flow Matching / Rectified Flow（整流流）**：它把「噪声」和「真实数据」用一条近似直线的轨迹连起来，**采样步更少、大规模训练更稳更省**。一句话：**规模驱动质量，Flow Matching 让大规模训练更经济**。

> 来源：[Open-Sora 2.0 论文（含 DiT 对比）(arXiv 2503.09642)](https://arxiv.org/html/2503.09642v1) · [Meta Movie Gen 论文（Flow Matching）(arXiv 2410.13720)](https://arxiv.org/html/2410.13720v2)

### 3.2 六条技术范式

注意：**「DiT 骨干」和「Flow Matching 训练」是两个正交的选择，现在主流大模型大多是「DiT + Flow Matching」组合，并不是对立路线**。

| 范式 | 核心思想 | 优 / 缺点 | 代表模型 |
|---|---|---|---|
| **DiT 扩散** | 3D-VAE 编码时空潜表示，DiT 在潜空间迭代去噪 | 可扩展、质量随规模提升 / 多步采样、算力高 | Sora、HunyuanVideo（13B）、Wan 2.x |
| **Flow Matching（整整流）** | 用「速度场」把噪声沿直线推向数据，常与 DiT 组合 | 步数更少、训练更稳 / 仍多步迭代 | Meta Movie Gen（30B）、Mochi、LTX-Video、Kling |
| **自回归 next-token** | 视频先离散化成 token，像 LLM 逐 token 预测 | 任意条件可作上下文、流式友好 / 慢、误差累积、纹理常弱于扩散 | Google VideoPoet、Meta Emu Video、Show-o、MAGI-1 |
| **掩码生成式（MAR 风格）** | 按掩码比例并行预测 token，介于扩散与自回归之间 | 并行解码比 AR 快、双向上下文 / 难建模强时序因果 | MAGVIT、MarDini、MAGI（CVPR 2025） |
| **混合（AR + 扩散）** | AR/LM 出结构与低频信号保时序，扩散精修高频帧保纹理 | 兼顾时序与纹理 / 工程复杂 | CausVid（MIT 2025，秒级出片） |
| **GAN / 实时** | 判别式网络做单图 + 音频驱动的口型表情合成，毫秒级 | 实时、低成本 / 保真度上限低于扩散 | HeyGen、Hedra、D-ID（数字人方向） |

⚠️ 两个常见误读：**Open-Sora 2.0 是扩散系（不是自回归）**；**Meta Movie Gen 是纯 Flow-Matching DiT（不是混合范式）**。

### 3.3 质量驱动与开放难题

- **时序一致性**：跨帧不闪不变形，是 DiT 时空注意力 + 长上下文的最大收益。
- **运动幅度 vs 稳定性**：大运动容易结构崩坏；高 Elo 的模型通常是「敢动又不动」。
- **提示遵循**：复杂场景、多主体提示下，物体数量、空间关系、动作经常丢失（⑦ 参考图能部分缓解）。
- **物理真实感**：流体、碰撞、刚体、镜面反射仍是弱项；Sora 2 把「物理更准」当卖点。
- **长时长连贯**：超过 10 秒后剧情与身份容易漂移，Vidu Q3 主打的「首个长片原生音视频」正指向这个战场。
- **算力成本**：训练动辄上千万美元（Open-Sora 2.0 用约 20 万美元属极端低成本特例）；推理多步昂贵，「少步 / 蒸馏 / 单 pass」是降本主线。

> 来源：[Artificial Analysis 视频竞技场方法学](https://artificialanalysis.ai/video/leaderboard/text-to-video) · [视频扩散综述 (Springer 2025)](https://link.springer.com/article/10.1007/s10462-025-11331-6)

---

## 四、商业前沿全景与排行榜（2026）

### 4.1 Artificial Analysis 视频竞技场（2026-06 快照）

这个榜用的是**众包盲测 A/B**（同一个 prompt 两个模型各生成一次，投票者不知模型身份选优），按 Elo 积分排名，是目前最被认可的第三方榜。最大看点：**Top 名次几乎被中国厂商包揽，Veo 排到第 10，Runway / Pika / Luma 跌出 Top 24**。

**文生视频（带音频）Top 5**

| # | 模型 | 厂商 | Elo | 发布 |
|---|---|---|---|---|
| 1 | **Seedance 2.0（720p）** | 字节跳动 | **1219** | 2026-02 |
| 2 | HappyHorse-1.1 | 阿里 ATH | 1151 | 2026-06 |
| 3 | HappyHorse-1.0 | 阿里 ATH | 1123 | 2026-04 |
| 4 | SkyReels V4 | 昆仑万维 | 1106 | 2026-03 |
| 5 | Kling 3.0（1080p Pro） | 快手 | 1104 | 2026-02 |
| 10 | Veo 3.1 | Google | 1094 | 2026-01 |

**图生视频（带音频）Top 2**：① **Seedance 2.0**（Elo 1195）；② **xAI Grok Imagine Video 1.5**（Elo 1114，2026-06 发布，比 Veo 3.1 还高）。

> ⚠️ 注意 `arena.ai`（LMArena）和 `artificialanalysis.ai` 是**两套不同的竞技场，Elo 标尺不同，别混着引用**。VBench-2.0（更偏内在保真度的学术榜）上，中国模型占据前 10 约八席（各模型当前精确分未确认，以 HF 官方面板为准）。

> 来源：[AA 文生视频榜](https://artificialanalysis.ai/video/leaderboard/text-to-video) · [AA 图生视频榜](https://artificialanalysis.ai/video/leaderboard/image-to-video) · [VBench 榜（HF）](https://huggingface.co/spaces/Vchitect/VBench_Leaderboard)

### 4.2 主力模型速写

| 模型（厂商） | 最新版本 | 原生音频 | 亮点 / 短板 |
|---|---|---|---|
| **Veo**（Google） | Veo 3.1 / 3.1 Fast（2026-01） | ✅ 首创 | 4K、广播级、Gemini 内约 3 个/天免费、SynthID 水印、**免费层允许商用**；8 秒原生片段上限、提示语法敏感 |
| **Sora**（OpenAI） | Sora 2（2025-09） | ✅ | 已停服（web/app 2026-04-26、API 2026-09-24）；定位「世界模拟器」，为机器人训练铺路 |
| **Kling 可灵**（快手） | Kling 3.0 / 3.0 Omni（2026-02） | ✅（2.6 起） | 5 语多角色对白、多镜头故事板、4K（部分未确认）；66 积分/天免费、SynthID、**非商用**，出口/B2B 第一 |
| **Hailuo 海螺**（MiniMax） | Hailuo 02 / 2.3（2025-10） | ❌ | **顶级运动与物理真实感、性价比之王**；最大短板是无原生音频、片段偏短（1080p 仅 6 秒） |
| **Seedance**（字节/即梦/豆包） | Seedance 2.0（2026-02） | ✅ | 双榜 #1、单次可输入多至 9 图 + 3 视频 + 3 音频、方言唇形；2.0 非 1080p 原生（720p 放大） |
| **Vidu**（生数） | Vidu Q3（2026-01） | ✅ | 业内首个「单次长片原生音视频」、多图参考；Q = Quality（不是 Quarter） |
| **Runway** | Gen-4.5（2025-12） | ❌（独立 Audio tab） | 顶级物理保真、跨镜头角色一致性、Motion Brush 丰富；已丢榜首、Gen-4 仅 I2V |
| **Pika** | Pika 2.5（约 2025-11） | ✅（Sound Effects） | Scene Ingredients 多元素合成、Pikaframes 转场、一键特效；画质竞赛已掉队，免费层无水印且可商用 |
| **Luma** | Ray3.2（2026-06） | ❌ | 自然物理运动、Ray3 Modify 可保留真人表演做 AI 编辑；无原生音频 |
| **Adobe Firefly** | 原地迭代（2025-12 大更新） | ❌ | 训练数据商用安全、**企业版有版权赔偿**；本质是聚合器（托管 Kling/Veo/Runway 等） |
| **NVIDIA Cosmos** | Cosmos 3（2026-05） | ⚠️ 仅环境音 | 定位**物理 AI / 世界模型**（机器人、自动驾驶仿真），不是消费级视频工具 |
| 黑马 | Grok Imagine 1.5（xAI）、HappyHorse（阿里 ATH）、SkyReels V4（昆仑）、PixVerse V6（爱诗） | ✅ | I2V 榜 / 无音频榜冲击榜首，成本更低 |

### 4.3 旗舰深入之一：Seedance 2.0（字节，当前双榜 #1）

Seedance 2.0 是 2026 年上半年最值得关注的模型，**它把榜首优势主要建立在原生音频上**——去掉音频维度后，阿里的 HappyHorse 反而更高。几个关键点：

- **全模态输入**：单次可同时喂「文字 + 最多 9 张图 + 3 段视频 + 3 段音频」，做参考一致性、首尾帧、角色替换、视频续写都不在话下。
- **原生音频**：双声道立体声，BGM、环境音效、旁白并行生成，还支持多语种 + 方言（川粤）唇形同步。
- **规格**：原生 720p（1080p 靠放大），单段 4–15 秒，支持多镜头切换。
- **国内入口**：在**即梦 AI / 豆包 app**（豆包「照片动起来」每天约 5 次免费）里直接用；API 走火山引擎，海外走 fal.ai、Replicate。
- **短板**：非原生 1080p、复杂物理 / 多角色对话 / 唱歌仍不完美。

> 来源：[Seedance 2.0 官方博客](https://seed.bytedance.com/en/blog/official-launch-of-seedance-2-0) · [The Verge 报道](https://www.theverge.com/ai-artificial-intelligence/877931/bytedance-seedance-2-video-generator-ai-launch) · [Seedance 1.0 论文 (arXiv 2506.09113)](https://arxiv.org/html/2506.09113v2)

### 4.4 旗舰深入之二：Veo 3.1（Google，原生音频先驱）

- **首创原生音频**：从 Veo 3（2025-05 Google I/O）起，一次前向就同步输出对白、音效、环境声与画面，覆盖到 3.1 的「Ingredients to Video」（多参考图）、「Frames to Video」（首尾帧）、Extend、运镜等全部功能。
- **规格**：720p / 1080p / 4K，原生 8 秒（可扩展到 1 分钟+）。
- **访问与价格**：Gemini app、Google Flow、Gemini API、Vertex AI；Veo 3.1 Fast 约 0.15 美元/秒（8 秒约 1.2 美元）。**Gemini 免费版里可用，约每天 3 个 8 秒视频，带不可见 SynthID 水印，免费层允许商用**（按 Google 标准条款）。
- **提示写法**：Veo 3 对语法极其敏感，社区总结了一套 **CASCADE 提示法**——Camera（机位）→ Ambience（环境）→ Subject（主体）→ Context（场景）→ Action（动作）→ Dialogue（对白，用方括号如 `[0s-2s] 角色: "..."`）→ Emotion（情绪）；格式写错会静默生成无声片段。

> 来源：[Google Veo 3.1 博客](https://blog.google/innovation-and-ai/products/veo-updates-flow/) · [Google DeepMind Veo 页](https://deepmind.google/models/veo/) · [Google Cloud Veo 提示指南](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide)

### 4.5 免费层横向对比

| 模型 | 免费额度 | 水印 | 免费层商用 | 原生音频 |
|---|---|---|---|---|
| **Veo 3 / 3.1**（Gemini 内） | 约 3 视频/天，8 秒 | 不可见 SynthID | **允许** | ✅ |
| **Kling 3.0** | 66 积分/天（仅 720p） | 可见 + 不可见 SynthID | ❌ 非商用 | ✅ |
| **Hailuo** | 约 2–5 次/天（768p 6 秒） | 有（右下角） | ❌ | ❌ |
| **Seedance 2.0 / 即梦** | 约 120 积分/天 + 豆包 5 次/天 | 有（免费层） | 需付费 / API | ✅ |
| **Vidu Q3** | 80 积分/月 + **Off-Peak 无限免费** | 有（720p） | ❌ 非商用 | ✅ |
| **Runway Gen-4 Turbo** | 一次性 125 积分 | 有（不可移） | ⚠️ 未确认 | ❌ |
| **Pika 2.5** | 80 积分（仅 480p / I2V 特效） | **无水印** | **允许** | ✅ |
| **Luma** | 约 30 次/月（720p） | 有 | ❌ 非商用 | ❌ |
| **Adobe Firefly** | 有限月度积分 | 取决于计划 | 企业版有赔偿 | ❌ |

> 结论性观察：免费层里**最宽松且带原生音频**的是 Pika（无水印 + 商用）和 Veo（经 Gemini，允许商用）；**最严苛**的是 Kling（SynthID + 非商用 + 仅 720p）。

---

## 五、原生音频：2026 的分水岭

这是 2026 年选型的**第一分水岭**：你的视频要不要带声音（对白、音效、配乐）？如果要，可选范围会立刻收窄一大半。

| 有原生音频（一次生成） | 没有原生音频（最大短板） |
|---|---|
| Veo 3 / 3.1（首创）、Sora 2、Seedance 2.0、Kling 2.6 / 3.0 Omni、Vidu Q3、PixVerse V6、SkyReels V4、Wan 2.7、Grok Imagine、**开源 LTX-2** | **Hailuo 全系**、Runway（独立 Audio tab，非模型级）、Luma Ray 全系、Adobe Firefly、NVIDIA Cosmos（仅环境音） |

**为什么原生音频重要**：以前做一支带声的视频要串起「生成画面 → TTS 配音 → 拟音 → 配乐」一整条流水线，音画对齐费时费力；原生音频让这些**一次生成、天然同步**，自动唇形、环境音、配乐全包，直接解锁了「有人物说话」的叙事视频。

> 提示：如果你要的是**给已有视频配音、或单独做配乐**，而不是「画面 + 声音一起生成」，那是另一条路——见姊妹篇[《AI 音乐生成全景》](/posts/ai-music-generation-survey/)（AI 作曲 / 免版税音乐），以及第七节的 LatentSync（给已有视频做唇形同步）。

> 来源：[Google Developers Blog：Veo 3](https://developers.googleblog.com/veo-3-now-available-gemini-api/) · [MiniMax Hailuo 2.3 公告](https://www.minimax.io/news/minimax-hailuo-23) · [Kling 2.6 音频指南](https://kling.ai/quickstart/klingai-video-26-audio-user-guide)

---

## 六、开源选型：Wan / HunyuanVideo / LTX-2 / CogVideoX 与对手们

### 6.1 主力开源模型横向对比

| 模型 | 开发方 | 许可证 | 参数 | 模态 | 分辨率·时长 | 最低显存 |
|---|---|---|---|---|---|---|
| **Wan 2.1** | 阿里 Wan-AI | **Apache 2.0** | 1.3B / 14B | T2V / I2V / V2V / **FLF2V** | 14B 480P/720P 约 5 秒 | 1.3B 约 8GB |
| **Wan 2.2** | 阿里 Wan-AI | **Apache 2.0** | MoE A14B / TI2V-5B 等 | T2V / I2V / 统一 TI2V / S2V / Animate | A14B 720P 约 5 秒；TI2V-5B 720P@24fps | TI2V-5B 为 4090 24GB 设计 |
| **HunyuanVideo / -I2V** | 腾讯 | ⚠️ 社区许可（排除 EU/UK/SK 商用） | 13B | T2V（+I2V 版） | 720P 约 5 秒 | FP8 + 分块 VAE 可压到 8GB |
| **CogVideoX / 1.5** | 智谱 THUDM | **2B / 5B-I2V 均 Apache 2.0** | 2B / 5B | T2V / I2V | 约 6–10 秒，1.5 可到 1360×768 | 2B 约 12GB |
| **Mochi 1** | Genmo | **Apache 2.0** | 10B | **仅 T2V** | 480p 约 5.4 秒 | GGUF 可压到 24GB |
| **LTX-Video / LTX-2** | Lightricks | **Apache 2.0** | 2B / 19B | T2V / I2V / **首尾帧 + 多关键帧** / **原生音频** | LTX-2 原生 4K@50fps，单 pass 最长 20 秒 | **GGUF 约 6GB** |
| **Open-Sora 2.0** | 潞晨 hpcai-tech | **Apache 2.0** | 11B | T2V / I2V（FLUX 初始化） | 768×768 约 5 秒 | FP8 约 22–24GB |
| **Step-Video-T2V / TI2V** | 阶跃星辰 StepFun | MIT 代码（权重许可未确认） | 30B | T2V / Text+Image→Video | 768×768 约 204 帧 | 官方约 78GB，单卡走量化 |
| **Pyramid Flow** | 北大 + 快手 + 北邮 | **MIT** | 2B | T2V / I2V | 768p 约 10 秒@24fps | **<8GB**（顺序 offload） |
| EasyAnimate / Latte | 阿里 PAI / 上海 AI Lab | Apache 2.0 | — | T2V / I2V | — | — |

> 来源：[Wan 2.1 仓库](https://github.com/Wan-Video/Wan2.1) · [Wan 2.2 仓库](https://github.com/Wan-Video/Wan2.2) · [HunyuanVideo HF](https://huggingface.co/tencent/HunyuanVideo) · [CogVideo 仓库](https://github.com/zai-org/CogVideo) · [LTX-Video 仓库](https://github.com/Lightricks/ltx-video) · [Open-Sora 2.0 论文](https://arxiv.org/html/2503.09642v1) · [Mochi 仓库](https://github.com/genmoai/mochi)

### 6.2 旗舰深入：Wan 2.2（目前开源综合首选）

- **首个开源 MoE 视频模型**：A14B 是 MoE（active-14B、总参约 27B），另有为消费卡设计的 **TI2V-5B**（统一 T2V + I2V，720P@24fps，单张 4090 约 9 分钟出一段）。
- **模态覆盖最全**：T2V、I2V、统一 TI2V、**S2V-14B（语音驱动视频）**、Animate-14B（角色动画）、编辑。
- **量化友好**：FP8/GGUF 可压到约 8–12GB；社区有 `city96`、`Kijai` 的现成量化权重和 ComfyUI 封装。
- ⚠️ 两个易错点：**Wan 2.2 没有官方 FLF2V（首尾帧）权重**（网上是社区复用 Wan 2.1 节点的工作流）；**Wan2.2-S2V 是「音频输入驱动」、不生成音频**，和 Veo 3 的「生成音频」是两回事。

### 6.3 显存分级：你的卡能跑什么

| 显存 | 推荐方案（含量化） |
|---|---|
| **8GB** | Wan2.1-T2V-1.3B（原生约 8GB）、CogVideoX 5B INT8、**LTX-Video 2B GGUF（约 6GB）**、**LTX-2 GGUF（约 6GB + 充足内存）**、HunyuanVideo FP8 + 分块 VAE（紧） |
| **12GB** | Wan 2.1/2.2 14B GGUF Q4/Q5（480p）、**Wan2.2-TI2V-5B FP8**、HunyuanVideo GGUF Q4_K_M、**EchoMimic V3 Flash（数字人，1.3B）** |
| **16GB** | Wan2.2 14B FP8（720p）、TI2V-5B FP8、HunyuanVideo FP8/Q6、LTX-2 dev FP8 |
| **24GB**（3090/4090） | **Wan2.2-TI2V-5B @ 720P@24fps（甜点）**、Wan2.1-I2V-14B GGUF Q6（720p）、HunyuanVideo BF16/Q8、CogVideoX 5B BF16 |
| **≥80GB** | 任何模型非量化：Wan2.2-A14B、HunyuanVideo 13B、Step-Video 30B |

> 关键技巧：把文本编码器（T5-XXL / UMT5XXL）做 **CPU offload** 可再省约 9GB，代价是每段多 10–20 秒；建议配 ≥32GB 内存。量化阶梯：Q8_0（近无损）→ Q6_K → Q5_K_M → **Q4_K_M（实用下限）**。量化仓库认准 [`city96`](https://huggingface.co/city96)、[`Kijai`](https://huggingface.co/Kijai)、[`unsloth/LTX-2-GGUF`](https://huggingface.co/unsloth/LTX-2-GGUF)。

### 6.4 首尾帧 / 多关键帧：谁支持

| 模型 | 首尾帧 | 多关键帧（任意时间点） |
|---|---|---|
| **LTX-Video / LTX-2** | ✅ | ✅ 原生（可链式，最多 4 张） |
| **Wan 2.1** | ✅ **官方 FLF2V-14B 权重** | ❌（仅首 + 尾） |
| EasyAnimate V5.1 | ✅ | ❌ |
| HunyuanVideo-I2V | ✅（需社区 LoRA） | ❌ |
| CogVideoX / Mochi / Open-Sora | ❌ | ❌ |

> 结论：要首尾帧，首选 **Wan 2.1-FLF2V-14B**（唯一官方权重）或 **LTX-2**（原生多关键帧）。

### 6.5 开源里的原生音频：只有 LTX-2

截至发稿，开源视频模型里**带原生音频生成的只有 LTX-2 / LTXV 2.x 一家**（视频 + 音频单 pass，最长 20 秒、4K@50fps）。其余 Wan / HunyuanVideo / CogVideoX / Mochi / Open-Sora / Step-Video 都不生成音频；Wan2.2-S2V 是「用音频驱动」而非「生成音频」。

> 来源：[LTX-2 发布稿（首个完整开源视频基础模型）](https://www.prnewswire.com/news-releases/lightricks-releases-ltx-2-the-first-complete-open-source-ai-video-foundation-model-302593012.html) · [unsloth/LTX-2-GGUF](https://huggingface.co/unsloth/LTX-2-GGUF) · [Wan 2.2 显存说明（willitrunai）](https://willitrunai.com/blog/wan-2-2-vram-requirements)

---

## 七、数字人 / 口播 / 唇形同步：一个独立赛道

数字人口播（音频驱动一张人像说话）虽然也算「AI 生成视频」，但它有一套**完全不同的模型生态**——多为轻量、实时或近实时、专注口型与表情，和上面那些做大片的大模型不是一回事。

| 模型 | 许可证 | 亮点 |
|---|---|---|
| **EchoMimic V1/V2/V3 Flash**（蚂蚁） | **Apache 2.0** | V3 Flash 仅 1.3B / 12GB 显存，**最实用的开源数字人** |
| **Hallo / Hallo2 / Hallo3**（复旦 + 百度 + 阿里） | **MIT** | Hallo2 首个 4K + 时长级肖像；Hallo3 基于 CogVideoX-5B-I2V |
| **LatentSync 1.6**（字节） | **Apache 2.0** | 给**已有视频**做唇形同步（不是静图），事实上的工作马 |
| **JoyHallo**（京东健康） | **MIT** | **中文首选**（少数主打中文的开源数字人） |
| **MimicMotion**（腾讯 + 上交） | **Apache 2.0** | 姿态驱动、全身 |
| **Ditto**（蚂蚁） | **Apache 2.0** | 实时、TensorRT 加速 |
| **Wan2.2-Animate-14B** | **Apache 2.0** | 视频驱动角色动画（Wan 系继作） |
| SadTalker | Apache 代码 ⚠️ 捆绑 NC 权重 | 经典，但商用须替换权重 |
| Sonic / LivePortrait | CC-BY-NC / MIT 代码（InsightFace NC） | 学术强、商用受限 |

⚠️ **商用安全提醒**：挑数字人模型要特别小心「捆绑的 NC（非商用）权重」——SadTalker 的 `face-vid2vid` + BFM、LivePortrait 的 InsightFace 都是 NC，代码许可干净不等于权重干净。图省事、要稳定商用，直接选**商业产品 HeyGen / Hedra / D-ID**（GAN / 实时方向）。

> 来源：[EchoMimic V3 仓库](https://github.com/antgroup/echomimic_v3) · [LatentSync 仓库](https://github.com/bytedance/LatentSync) · [Hallo2 仓库](https://github.com/fudan-generative-vision/hallo2) · [JoyHallo 仓库](https://github.com/jdh-algo/JoyHallo)

---

## 八、免费与国内工具速览 + 实操指南

> 版权提示：和音乐那篇一样，**绝大多数网页免费层不可商用、且带水印**；本节只作全景与「怎么先白嫖试起来」，正式商用前务必读各平台最新条款。

### 8.1 免费跑开源模型（不用自己的 GPU）

| 方式 | 说明 | 成本 |
|---|---|---|
| **HF Spaces（ZeroGPU）** | Wan 2.2 / Hunyuan / CogVideoX / LTX 都有官方或社区 Space，浏览器直用 | 免费约 5 分钟/天 + 每日约 3 次请求上限；PRO 约 9 美元/月 = 40 分钟 |
| **fal.ai** | 托管大量开源视频模型，最便宜的 API 通道 | CogVideoX 约 0.20 美元/段、Wan 2.5 约 0.05 美元/秒 |
| **Replicate** | 按秒计费 | ⚠️ 2025-07 起新账号无永久免费层（预付额度制） |
| **Vast.ai / RunPod** | 按小时租 GPU，自带 ComfyUI 模板 | H100 约 1.8–2 美元/小时 |
| **本地 ComfyUI** | CogVideoX / Wan / HunyuanVideo 都有成熟节点 | 仅电费，门槛见 6.3 |
| **硅基流动 SiliconFlow** | OpenAI-SDK 兼容、国内直连 | ⚠️ 旧文常说的「免费 Hunyuan/CogVideoX」**已下线失效**，目前只剩 **Wan2.2-A14B（约 0.29 美元/段）**，1 美元注册赠额 |

> 来源：[HF ZeroGPU 文档](https://huggingface.co/docs/hub/spaces-zerogpu) · [fal.ai Wan 2.2 指南](https://blog.fal.ai/wan-2-2-api-complete-developer-guide-to-next-generation-video-synthesis/) · [硅基流动](https://siliconflow.cn/)

### 8.2 国内工具（免翻墙、中文友好）

| 工具 | 免费额度 | 水印 | 片长 | 亮点 |
|---|---|---|---|---|
| **即梦 AI / Dreamina**（字节） | 新用户约 800 秒 + 约 260 积分/天 | 有 | 多档 | **Seedance 2.0 的国内主入口** |
| **可灵 Kling**（快手） | 66 积分/天 | 有（SynthID） | 720p | 3.0 多镜头 + 5 语原生音频 |
| **海螺 Hailuo**（MiniMax） | 试用约 3 段/天 | 有 | 768p 6 秒 | 顶级运动物理 |
| **Vidu**（生数） | 80 积分/月 + **Off-Peak 无限免费** | 有（720p） | 1080p | 长片原生音视频、多图参考 |
| **智谱清影**（智谱） | 本地 CogVideoX 免费可商用 | — | — | 开源即免费、商用干净 |
| **通义万相**（阿里） | Wan2.6 在 Qwen APP 免费 | 有 | — | Wan 模型的官方网页入口 |
| **腾讯元宝** | HunyuanVideo 1.5 免费 | 有 | — | 腾讯 Hunyuan 入口 |
| **PixVerse**（爱诗） | 100 + 30 积分/天 | 取决于档 | 1080p 15 秒 | 多镜头 + 原生音频 |

### 8.3 免费层商用现实（和音乐那篇同款结论）

- **网页免费层几乎都禁商用 + 强制水印**：Kling / Hailuo / Vidu / Dreamina / 即梦 / PixVerse 全部如此，商用要从付费档（约 7–18 美元/月）起。
- **不可见水印无法移除**：Kling 的 SynthID、Dreamina 的 C2PA 是像素级不可见水印，第三方工具去除违反 ToS。
- **真正「免费 + 可商用」= 本地开源**：CogVideoX（智谱，Apache）最干净、最安全；Wan / LTX 同为 Apache；⚠️ **HunyuanVideo 是社区许可、排除欧盟/英国/韩国商用、>1 亿 MAU 还要单独授权**，不是纯开源，商用前务必确认你的所在地。

### 8.4 推荐路线阶梯

| 需求 | 推荐路线 |
|---|---|
| **最简：网页零配置试水**（非商用） | Vidu（Off-Peak 无限免费）/ 即梦（Seedance 2.0）/ 可灵 |
| **可脚本：便宜或免费 API** | 硅基流动 1 美元赠额跑 Wan2.2 + HF ZeroGPU PRO（约 9 美元/月，任意开源模型） |
| **全控 + 可商用：本地或租 GPU** | 本地 ComfyUI 跑 **CogVideoX**（Apache、商用干净）；要更高画质就租 GPU 跑 **Wan2.2**（Vast.ai 约 1.8 美元/小时） |

> 来源：[各平台官方定价页](https://kling.ai/) · [HF ZeroGPU 配额](https://huggingface.co/docs/hub/spaces-zerogpu) · [CogVideoX 仓库（Apache 2.0）](https://github.com/zai-org/CogVideo)

---

## 九、按用途选型决策表

| 你的用途 | 推荐方案 |
|---|---|
| **要最高画质的商业成片** | Seedance 2.0 / Kling 3.0 / Veo 3.1（三选一，按能否访问与价格） |
| **要一次出「画面 + 声音」** | Veo 3.1 / Seedance 2.0 / Kling 3.0 Omni；预算有限或要开源 → **LTX-2** |
| **让一张静图动起来** | 单图 I2V：Wan 2.2 / HunyuanVideo-I2V / Runway Gen-4.5 |
| **精准控制开头和结尾** | 首尾帧：Wan 2.1-FLF2V / LTX-2（多关键帧）/ Kling Start & End Frames |
| **跨镜头角色 / 物体一致** | Pika 2.5 Scene Ingredients / Wan 2.7 R2V / Seedance 多图 |
| **本地免费 + 可商用** | **CogVideoX**（Apache，最干净）/ Wan（Apache）/ LTX-2（Apache，还带音频） |
| **低显存尝鲜（8–12GB）** | LTX-Video / CogVideoX-2B / Wan2.1-1.3B |
| **数字人口播 / 教程** | 开源 EchoMimic V3 / LatentSync / **JoyHallo（中文）**；图省事 → 商业 HeyGen |
| **给已有视频配音、做唇形** | LatentSync 1.6（开源）/ 商业 HeyGen |
| **物理仿真 / 机器人训练数据** | NVIDIA Cosmos 3 |

一句话总原则：**先定「模态」，再定「开源 / 商业」，最后看「显存与商用许可」——三者按这个顺序筛，几乎总能快速收敛到一两个答案。**

---

## 十、参考资料

**排行榜与行业**

- [Artificial Analysis 文生视频竞技场](https://artificialanalysis.ai/video/leaderboard/text-to-video) · [图生视频竞技场](https://artificialanalysis.ai/video/leaderboard/image-to-video)
- [VBench / VBench-2.0 排行（HF）](https://huggingface.co/spaces/Vchitect/VBench_Leaderboard) · [VBench 项目页](https://vchitect.github.io/VBench-project/)
- [Stanford HAI AI Index 2026](https://hai.stanford.edu/assets/files/ai_index_report_2026.pdf)
- [OpenAI Sora 停服说明（Help Center）](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation) · [BBC：Sora 关停](https://www.bbc.com/news/articles/c3w3e467ewqo)

**论文与技术原理**

- [Open-Sora 2.0 论文 (arXiv 2503.09642)](https://arxiv.org/html/2503.09642v1) · [Meta Movie Gen (arXiv 2410.13720)](https://arxiv.org/html/2410.13720v2)
- [Seedance 1.0 技术报告 (arXiv 2506.09113)](https://arxiv.org/html/2506.09113v2) · [NVIDIA Cosmos (arXiv 2501.03575)](https://arxiv.org/html/2501.03575v1)
- [视频扩散综述 (Springer 2025)](https://link.springer.com/article/10.1007/s10462-025-11331-6)

**开源模型仓库**

- [Wan 2.1 (GitHub, Apache 2.0)](https://github.com/Wan-Video/Wan2.1) · [Wan 2.2 (GitHub, Apache 2.0)](https://github.com/Wan-Video/Wan2.2)
- [HunyuanVideo (HF, 社区许可)](https://huggingface.co/tencent/HunyuanVideo) · [HunyuanVideo-I2V](https://huggingface.co/tencent/HunyuanVideo-I2V)
- [CogVideo (GitHub, Apache 2.0)](https://github.com/zai-org/CogVideo) · [LTX-Video (GitHub, Apache 2.0)](https://github.com/Lightricks/ltx-video)
- [Mochi (GitHub, Apache 2.0)](https://github.com/genmoai/mochi) · [Open-Sora (GitHub)](https://github.com/hpcaitech/Open-Sora) · [Step-Video (GitHub)](https://github.com/stepfun-ai/Step-Video-T2V)
- 量化权重：[city96](https://huggingface.co/city96) · [Kijai](https://huggingface.co/Kijai) · [unsloth/LTX-2-GGUF](https://huggingface.co/unsloth/LTX-2-GGUF)

**商业模型官方**

- [Google Veo 3.1](https://deepmind.google/models/veo/) · [Kling 3.0（快手 IR）](https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-launches-30-model-ushering-era-where-everyone-can-be)
- [字节 Seedance 2.0](https://seed.bytedance.com/en/blog/official-launch-of-seedance-2-0) · [MiniMax Hailuo 2.3](https://www.minimax.io/news/minimax-hailuo-23) · [生数 Vidu Q3](https://www.vidu.com)
- [Runway Gen-4.5](https://runwayml.com/research/introducing-runway-gen-4.5) · [Luma Ray3](https://lumalabs.ai/news) · [Pika](https://pika.art/) · [Adobe Firefly](https://blog.adobe.com/en/publish/2025/12/16/adobe-firefly-improves-ai-video-creation-tools-new-models-unlimited-generations)

**实操接入**

- [HF ZeroGPU 官方文档（配额与限制）](https://huggingface.co/docs/hub/spaces-zerogpu) · [fal.ai Wan 2.2 开发指南](https://blog.fal.ai/wan-2-2-api-complete-developer-guide-to-next-generation-video-synthesis/)
- 姊妹篇：[《AI 音乐生成全景：免费、版权与开源 SOTA（2026）》](/posts/ai-music-generation-survey/) · [《免费下载现成免版权音乐的平台盘点》](/posts/royalty-free-music-sites/)
