---
title: 【学习笔记】AI 音乐生成全景：免费、版权与开源 SOTA（2026）
published: 2026-06-29
description: 系统梳理 2026 年 AI 音乐生成——「免费」的三种含义、Suno/Udio 诉讼后的版权红线、自回归/扩散/混合三条技术路线原理、ACE-Step 与 DiffRhythm/YuE/HeartMuLa 的开源选型，以及 HF Space 网页直用、免费 token 调 API 与本地部署的实操指南
lang: zh
tags: [学习笔记]
abbrlink: ai-music-generation-survey
---

> 整理日期：2026-06-29
> 涵盖范围：免费方案分类、版权合规、技术原理、开源模型选型、实操接入
> 说明：本笔记关键信息均标注来源链接，便于追溯核实；标注「据报道」者为二次信源，正式商用前请以各平台最新条款为准。

<!--
## 目录
- [一、核心结论（太长不看）](#一核心结论太长不看)
- [二、「免费」的三种含义：先想清楚你要哪一种](#二免费的三种含义先想清楚你要哪一种)
- [三、版权红线：Suno/Udio 被告之后，免费还能商用吗？](#三版权红线sunoudio-被告之后免费还能商用吗)
- [四、技术原理：AI 是怎么「写歌」的？](#四技术原理ai-是怎么写歌的)
- [五、开源选型：ACE-Step 与它的对手们](#五开源选型ace-step-与它的对手们)
- [六、商业与国内工具速览](#六商业与国内工具速览)
- [七、实操指南：怎么真正「免费 + 可商用」地用起来](#七实操指南怎么真正免费--可商用地用起来)
- [八、按用途选型决策表](#八按用途选型决策表)
- [九、参考资料](#九参考资料)
-->

## 一、核心结论（太长不看）

1. **「免费」在 AI 音乐里有三种完全不同的含义**：每日免费额度（但锁版权，如 Suno/Udio）、真正免费且可商用（本地开源模型）、国内免翻墙免费（版权归平台、多不可商用）。搞不清这一点，就最容易踩版权坑。
2. **2025–2026 的连环诉讼改写了规则**：Warner、UMG 相继与 Suno/Udio 和解并转向「按次授权（per-generation licensing）」新范式，Suno 2026 模型已要求**付费才能下载**、免费层受限——「用 Suno 免费版白嫖给视频配乐」这条路基本走不通了。
3. **商用要干净，首选开源**：ACE-Step（MIT）、DiffRhythm（Apache 2.0）、YuE（Apache 2.0）版权清晰、可商用，且大多在 Hugging Face 上被免费托管，**不部署、不翻墙、不付费**就能网页用或调 API。
4. **技术上有三条路线**：自回归语言模型（YuE，长程强但慢）、扩散/Flow-Matching（DiffRhythm，快但长程弱）、混合 LM+DiT（ACE-Step，LM 当「规划师」、DiT 当「渲染器」，目前开源 SOTA）。
5. **ACE-Step 1.5 是 2026 年开源首选**：质量逼近 Suno v5、本地 4GB 显存可跑、支持 LoRA/翻唱/人声分离，MIT 许可证无商用限制。

> 来源：[ACE-Step 1.5 论文 (arXiv 2602.00744)](https://arxiv.org/abs/2602.00744) · [Warner Music 与 Suno 和解报道](https://vinylculture.substack.com/p/the-ai-music-endgame-part-2-warner) · [HF ZeroGPU 配额文档](https://huggingface.co/docs/hub/spaces-zerogpu)

---

## 二、「免费」的三种含义：先想清楚你要哪一种

调研 AI 音乐生成，最先要分清的不是「哪个模型最好」，而是「你说的免费到底是哪一种」——这三者的能下载、能商用、适合人群完全不同。

| 类型 | 代表 | 能下载？ | 能商用？ | 适合谁 |
|---|---|---|---|---|
| **① 每日免费额度，但锁版权** | Suno、Udio | Suno 免费版已不能下载；Udio 和解后关闭下载 | ❌ 基本不能 | 玩票 / 试听定方向 |
| **② 真正免费 + 可商用** | 本地开源模型（ACE-Step、YuE、DiffRhythm） | ✅ | ✅ | 需要版权干净、要自动化集成的开发者 |
| **③ 国内免翻墙免费** | 海绵音乐、网易天音 | ✅ | 多数 ❌ 或受限 | 中文 / 国风内容、纯娱乐试水 |

一个关键判断：**只要你的产物会被分发或商用（发视频、上架、接广告），就自动排除类型 ① 和多数类型 ③**，只剩下类型 ② 的开源路线，或付费购买干净版权的商业方案。下一节先说为什么类型 ① 在 2026 年已经「不能白嫖」。

---

## 三、版权红线：Suno/Udio 被告之后，免费还能商用吗？

### 3.1 诉讼与和解时间线

AI 音乐的版权大战从 2024 年打到 2026 年，格局已经基本定型（据报道）：

- **2024 年 6 月**：美国唱片业协会（RIAA）代表 Sony、UMG、Warner 等三大唱片公司，分别起诉 Suno 和 Udio，指控其未经授权用受版权保护的录音训练模型。
- **2025 年 10 月**：**UMG 与 Udio 率先和解**，并建立了一套「**按次授权（per-generation licensing）**」模板——AI 公司每生成一首歌，都要向厂牌付费。这被视为行业新范式的起点。
- **2025 年 11 月**：**Warner 与 Suno、Udio 双双和解**，从诉讼对手转为授权合作方，并与 Suno 签署授权协议、宣布成立合资项目。
- **截至发稿**：Sony 对 Suno/Udio、以及 UMG 对 Suno 的诉讼仍在进行中。

> 来源：[The AI Music Endgame Part 2: Warner Music Settles Suno Lawsuit](https://vinylculture.substack.com/p/the-ai-music-endgame-part-2-warner)

### 3.2 对免费层的实际影响

和解带来的直接后果是——**免费层被全面收紧**：

- Suno 的 **2026 年新模型将要求付费才能下载音频**，免费层歌曲的使用与下载受到新限制。
- Udio 在和解后**关闭了下载**，目前几乎处于「只能在线预览」的状态。
- 整个行业从「免费狂欢」转向「**按次授权、付费下载**」的许可框架，每一次生成都要向厂牌回流费用。

更耐人寻味的是反向诉讼：据报道，**美国音乐人工会也已起诉 UMG 与 Warner**，主张成员的录音在**未获补偿与署名**的情况下就被授权给了 Suno 和 Udio——也就是说，厂牌的和解收益未必能落到具体创作者手里。Forbes 还点出一个反讽：这些和解反而让 AI 公司此前的训练行为「合法化」了。

> 来源：[Forbes 对 AI 音乐和解的评论（据报道）](https://www.forbes.com) · 音乐人工会诉讼报道

### 3.3 结论：商用请避开 Suno/Udio 免费层

一句话：**2026 年用 Suno/Udio 免费版给会分发、会商用的内容配乐，无论从「能不能下载」还是「能不能商用」看都已不可行。** 干净的路只有两条——走版权清晰的开源模型（第四节起详述），或付费购买明确授权的商业方案（第六节）。Suno/Udio 的免费额度，只适合用来**试听、定风格方向**，然后换干净的工具正式产出。

---

## 四、技术原理：AI 是怎么「写歌」的？

### 4.1 音乐生成难在哪

相比已经很成熟的文本和图像生成，音乐生成要难得多，原因有三：

1. **长程时间结构**：一首歌动辄几分钟、上千个时间帧，前后段落必须连贯（主歌 - 副歌 - 桥段、和声走向、节奏），而不是只管局部好听。图像生成本质上是「空间」问题，音乐是「长时序」问题。
2. **极高的采样率**：CD 音质是 44.1kHz、专业制作常用 48kHz，每秒几万个采样点，信息密度远高于一张图。直接在原始波形上建模成本极高，所以现代方案都先把它压缩到「潜在表示（latent）」里再生成。
3. **人声这一层**：带唱的歌曲额外叠加了「歌唱语音合成」——既要咬字（音素）、又要旋律音高、还要情感与气息，相当于在音乐之上再做一个 TTS。

这三道难题，决定了主流技术路线的分野。

### 4.2 三条技术路线

> 来源：[Auto-Regressive vs Flow-Matching 比较研究 (arXiv 2506.08570)](https://arxiv.org/abs/2506.08570) · [Diffusion Beats Autoregressive in Data-Constrained Settings (CMU ML Blog)](https://blog.ml.cmu.edu/2025/09/22/diffusion-beats-autoregressive-in-data-constrained-settings/)

**路线一：自回归语言模型（Autoregressive LM）**

把音频先离散化成一串「token」（像给声音做一套拼音），然后像大语言模型逐字预测下一个词一样，**一个 token 一个 token 地往后生成**，全程以文本（歌词、风格描述）为条件。

- **代表**：YuE（港科大 + M-A-P，7B 参数）、早期的 MusicLM/MusicGen 血统。
- **强项**：长程结构好、歌词对齐强（毕竟本质是个语言模型，天然懂「文本结构」）。
- **短板**：**慢**（必须串行生成，无法并行），且存在误差累积——前面一个 token 错了，后面跟着错。
- **经验法则**：算力受限时优先选自回归。

**路线二：扩散 / Flow-Matching**

从一团高斯噪声出发，在潜在空间里**一步步去噪**，逐步「雕刻」出干净的音频；Flow-Matching 是它的近亲变体。关键优势是去噪过程可以高度并行。

- **代表**：DiffRhythm 谛韵（西工大 ASLP-lab，号称首个开源的全曲扩散模型）、Stable Audio 系列。
- **强项**：**快**（DiffRhythm 单次前向就能出整首带唱歌曲，比自回归快上百倍）、音质高、输出多样。
- **短板**：**长程连贯性偏弱**，长曲子容易出现段落衔接不自然。
- **经验法则**：数据受限时优先选扩散。

**路线三：混合 LM + DiT（当前开源最优解）**

把前两者的长处拼起来：用一个**语言模型当「规划师」**，先把用户的简单需求（一句风格描述 + 歌词）通过思维链（Chain-of-Thought）展开成一份完整的「歌曲蓝图」——结构、段落、元数据、风格标签、字幕全规划好；再让一个**扩散 Transformer（DiT）当「渲染器」**，按这份蓝图把真实音频「演奏」出来。

- **代表**：ACE-Step 1.5（ACE Studio + StepFun）。其语言模型基于 Qwen3（0.6B / 1.7B / 4B 三档），DiT 解码器标准版 2B、XL 版 4B。
- **强项**：既有自回归的结构规划能力，又有扩散的渲染质量与速度，是目前开源 SOTA。
- **特别之处**：对齐方式用的是「**内在强化学习（intrinsic RL）**」——只依赖模型自身机制，不引入外部奖励模型或人类偏好，避免了后者的偏见。

> 一个类比：**LM 是作曲家/编曲师写总谱（结构、段落、歌词、风格），DiT 是乐团照着总谱演奏出声音。** 自回归路线是「边想边即兴演奏」，扩散路线是「直接从一团声音毛坯里打磨」，混合路线则是「先成谱、再演奏」。

> 来源：[ACE-Step 1.5 论文 (arXiv 2602.00744)](https://arxiv.org/abs/2602.00744) · [ACE-Step 1.0 论文 (arXiv 2506.00045)](https://arxiv.org/abs/2506.00045)

---

## 五、开源选型：ACE-Step 与它的对手们

### 5.1 ACE-Step 是谁做的

ACE-Step 由 **ACE Studio** 与 **StepFun（阶跃星辰）联合主导（co-led）**，不是某一家单独做的：

| 合作方 | 角色 | 背景 |
|---|---|---|
| **ACE Studio** | 音乐领域能力 + 训练数据 | 国际知名的 AI 数字音乐创作平台，做歌声合成起家 |
| **StepFun 阶跃星辰** | 大模型算法 + 算力 | 中国多模态大模型公司（Step 系列） |

- **2025 年 5 月**开源 ACE-Step 1.0（中文名「**音跃**」），**2026 年 1 月**发布 1.5。
- 论文作者里有 **Yang Song**（扩散模型领域代表人物）、**Xuerui Yang** 等重量级研究者。
- 后续 **联发科（MediaTek）** 加入，做端侧部署生态。
- 团队没有大厂光环、相对低调务实，被业界对标为「音乐界的 Stable Diffusion 时刻」。

> 来源：[ACE-Step 1.5 项目主页](https://ace-step.github.io/ace-step-v1.5.github.io/) · [ACE-Step 1.5 论文](https://arxiv.org/abs/2602.00744)

### 5.2 ACE-Step 1.5 深入：一次能生成多长、要多大显存、有多快

这是本节重点展开的部分。把官方仓库、推理文档和论文里最实用的规格集中在一起，方便选型和预估硬件。

**规格速查**

| 项目 | 规格 |
|---|---|
| 单次生成时长 | **10 秒 ~ 10 分钟（600 秒）**；`duration=-1` 时按歌词长度自动决定 |
| 采样率 / 声道 | 48 kHz 立体声（stereo） |
| 音频潜空间 | 1D 波形 VAE 把 48kHz 立体声压成 64 维、25Hz 潜在表示（压缩率约 1920×，近无损） |
| 输出格式 | flac / mp3 / opus / aac / wav / wav32 |
| 批量生成 | 单次最多同时出 8 首 |
| 支持语言 | 50+ 种（中、英、日、韩、法、德、西、意、葡……） |
| 许可证 | MIT（无商用限制） |
| 发布节奏 | 1.0（2025-05「音跃」）→ 1.5（2026-01） |

**「一次能生成多长」详解**

- 官方支持 **10 秒到 10 分钟（600 秒）**。实测中 3–4 分钟的歌曲最常见，也有人用约 20 秒在 A100 上生成 4 分钟成品。
- 官方时长建议：**纯器乐 30–180 秒**效果最佳；**带歌词**建议 `duration=-1` 让模型自动按歌词长度决定；最短 10–20 秒；上限 600 秒。
- 想要更长？用 **Complete（续写）** 能力把片段延伸拼接，或生成多段再接起来。
- 一个性能规律：**短时长主要耗在 LM 规划，长时长主要耗在 DiT 渲染**——所以把歌拉长，速度成本主要加在后面的音频渲染上。

**要多大显存——官方 GPU 分级**

ACE-Step 1.5 有完整的自适应机制：自动检测显存选配置、超出时自动降 batch、VAE 解码三级回退（GPU 分块 → GPU + CPU offload → 全 CPU）。门槛极低，**最低 <4GB 显存就能跑**（turbo + 关闭 LM + CPU offload）。

| 你的显存 | 推荐 DiT | 推荐 LM | 说明 |
|---|---|---|---|
| ≤6GB | 2B turbo | 无（仅 DiT） | INT8 量化 + 全 CPU offload |
| 6–8GB | 2B turbo | 0.6B | PyTorch 后端 |
| 8–16GB | 2B turbo / sft | 0.6B / 1.7B | 8–12GB 用 0.6B，12–16GB 用 1.7B |
| 16–20GB | 2B sft 或 XL turbo | 1.7B | XL 在 20GB 以下需 CPU offload |
| 20–24GB | XL turbo / sft | 1.7B | XL 无需 offload |
| ≥24GB | XL sft | 4B | 最佳质量，全部装下 |

> 2B 权重约 4.7GB（bf16），XL（4B）约 9GB；XL 需 ≥12GB（offload + 量化）或 ≥20GB（无 offload）。

**有多快**

- 官方：**<2 秒/首（A100）、<10 秒/首（RTX 3090）**，整体 0.5–10 秒（取决于是否开思考模式与步数）。
- 关键在 **turbo 蒸馏**：把基础模型的 50 步去噪压到 4–8 步，A100 上约 1 秒出 240 秒音轨，提速 100–200 倍，且信噪比不降反升。
- 实测参考：4 分钟成品在 A100 上约 20 秒。

**模型变体与任务分工**

- **DiT 三档**：`turbo`（guidance 蒸馏，默认 8 步、关闭 CFG，日常首选）/ `sft`（CFG 可调，50 步，追求细节）/ `base`（50 步，**extract/lego/complete 等特殊任务专属**），每档都有 `XL`（4B）版本提升音质。
- **LM 三档**（5Hz，基于 Qwen3）：0.6B / 1.7B / 4B。官方默认推荐 **turbo + 1.7B LM**，覆盖大多数场景。
- 组合建议：要最快 → turbo + 无 LM 或 0.6B；日常 → turbo + 1.7B；追细节 → sft + 1.7B/4B；显存 <4GB → turbo + 无 LM + CPU offload。

**几个关键推理旋钮**（本地部署或调 API 时会用上）

- `inference_steps`：turbo 默认 8（1–20），base 推荐 32–64（1–200）。步数越多越精细但越慢。
- `guidance_scale`（CFG）：默认 7.0，越高越贴 prompt；**仅 base/sft 有效，turbo 会忽略**。
- `shift`：turbo 推荐 3.0；训练时动态从 {1,2,3} 采样以增加去噪轨迹多样性。
- `infer_method`：`ode`（快、确定性）/ `sde`（带随机性）。
- 还能显式指定 `bpm`（30–300）、调号（如 C major）、拍号（2/3/4/6）、`vocal_language` 等。

> 来源：[ACE-Step 1.5 官方仓库](https://github.com/ace-step/ACE-Step-1.5) · [INFERENCE.md 推理文档](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/INFERENCE.md) · [diffusers ACE-Step 文档](https://huggingface.co/docs/diffusers/api/pipelines/ace_step) · [ACE-Step 1.5 论文](https://arxiv.org/abs/2602.00744)

### 5.3 同类开源模型横向对比

能生成「完整带人声歌曲」的开源模型，目前第一梯队就下面这几个：

| 模型 | 开发方 | 技术路线 | 许可证 | 显存 | 强项 / 短板 |
|---|---|---|---|---|---|
| **ACE-Step 1.5** | ACE Studio + StepFun | 混合 LM + DiT | **MIT** ✅ | **<4GB** | 开源 SOTA、最快（A100 上 <2 秒/首）、支持 LoRA/翻唱/人声分离；中文 rap 偏弱、输出对种子敏感 |
| **DiffRhythm 谛韵** | 西工大 ASLP-lab | 纯扩散 / Flow-Matching | Apache 2.0 ✅ | 中 | 单次前向出全曲、极快、轻量；长程连贯性略弱 |
| **YuE 乐** | 港科大 + M-A-P | 自回归 LM（7B） | Apache 2.0 ✅ | 12GB+ | 歌词对齐最强、风格克隆；推理慢 |
| **HeartMuLa** | 开源社区 | 扩散 | Apache 2.0 ✅ | 24GB+ | 2026 新秀、单首可达 6 分钟、人声质量高；显存门槛高 |

只能生成纯器乐、不能唱歌的老一代（且版权是硬伤，商用别碰）：

- **MusicGen**（Meta）— **CC-BY-NC**，❌ 不可商用。
- **Stable Audio Open**（Stability）— 社区许可，⚠️ 商用受限。

### 5.4 官方 Benchmark：ACE-Step 在开源里的位置

ACE-Step 1.5 论文给出的综合评测分（越高越好），能直观看出梯队划分：

| 模型 | 综合得分 |
|---|---|
| ACE-Step 1.0 | 28.5 |
| HeartMuLa | 31.7 |
| **ACE-Step 1.5** | **39.1** |
| **ACE-Step 1.5-XL（4B DiT）** | **47.9** |

在更细的音乐性 / 人声 / 风格 / 歌词四项（1–5 分制）上，据第三方评测，**ACE-Step 1.5-XL 已追平或略超 Suno v5**（如音乐性 4.79 vs 4.72、人声自然度 4.65 vs 4.56），但 Suno v5 在风格与歌词对齐上仍有优势。论文原话是：ACE-Step 1.5 的质量「**超越了大多数商业音乐模型**」。

> 来源：[ACE-Step 1.5 论文 Table 1](https://arxiv.org/abs/2602.00744) · [ravlik 第三方评测](https://ravlik.com/2026/06/07/ace-step-1-5-open-source-music-ai-that-runs-locally-and-matches-suno-v5-in-benchmarks)

### 5.5 ACE-Step 的能力清单与官方自承短板

ACE-Step 1.5 不只是「文生音乐」，而是一套工具链：

- **Text2Music**：文本/歌词 → 完整歌曲
- **Cover 翻唱**：换唱腔/风格重唱
- **Repaint 重绘**：局部重新生成
- **Extract 人声分离**：人声转伴奏（vocal-to-BGM）
- **Complete 续写**：从片段延伸到完整曲子
- **LoRA 微调**：用少量（约 8 首）歌曲训练出个人风格

官方也坦白了几条短板（做纯器乐配乐影响不大，做带唱内容要注意）：**中文 rap 偏弱**、**输出对随机种子敏感（「抽卡式」结果，同 prompt 多次结果差异大）**、**人声细节偏粗**、重绘/续写时偶有**衔接不自然**。

> 来源：[ACE-Step 1.5 HF 模型卡](https://huggingface.co/ACE-Step/Ace-Step1.5) · [HeartMuLa 实测对比（200+ 首跨 10 曲风）](https://heart-mula.com/ace-step)

---

## 六、商业与国内工具速览

> 版权提示：本节多数商业/国内工具的免费额度**不可商用或受限**，仅作全景了解；正式商用前务必读各平台最新条款。

### 6.1 国际主流（有免费额度，但限制多、多数需翻墙）

| 工具 | 免费额度 | 商用 | 关键点 |
|---|---|---|---|
| **Suno** | 50 积分/天 ≈ 10 首 | ❌ 免费版不能下载/不能商用 | 人声最自然，v5 质量最高 |
| **Udio** | 10 积分/天 + 100/月 | ❌ 和解后关闭下载 | 音质/细节强，目前几乎只能预览 |
| **Google Lyria 3** | Gemini 内免费，30 秒/首 | ⚠️ 看条款，带 SynthID 水印 | 最省事的免费纯音乐，背景乐首选 |
| **ElevenLabs Music** | 7 首/天（iOS），需署名 | ❌ | 人声情感强，但偏 TTS 厂商 |
| **AIVA** | 3 次下载/月（非商用） | ❌ 需 Pro（约 €49/月） | 影视/古典/游戏配乐专长，可导出 MIDI |

### 6.2 国内可用（不用翻墙，中文友好）

| 工具 | 免费/商用情况 | 特点 |
|---|---|---|
| **海绵音乐**（字节） | 免费，但版权归平台、不可商用 | 纯娱乐试水最省事 |
| **网易天音** | 非商用免费，商用限制多 | 网易云生态、简单翻唱 |
| **蘑兔 AI**（制片帮） | 注册送额度，付费后约 1 元认证数字版权可全场景商用 | 50+ 曲风含国风，12 轨分离 |
| **MELO 音乐 / 音潮 V3.0** | 付费约 38–45 元/月，版权归用户 | 中文咬字/情感比 Suno 自然 |
| **火山引擎·豆包音乐模型** | 走 API，有免费额度 | **可程序化调用**，能接进自动化流水线 |

---

## 七、实操指南：怎么真正「免费 + 可商用」地用起来

聚焦到「既能网页打开、又能脚本调用、版权还干净」这条路，最优解是**走 ACE-Step 官方 / 社区免费托管**，分三条路按需选择——网页直用、调 API、本地部署。

### 7.1 路线 A：网页直接用（最简单，零门槛）

**首选 acemusic.ai**——这是 **ACE-Step 官方团队自己运营的托管平台**（官方 GitHub 仓库 README 里直接推荐：「100% free, no GPU required」）。完全免费、**不需要本地 GPU**，浏览器打开即可调用 **ACE-Step 1.5 Turbo（最快）与 1.5 XL Turbo（4B、音质更高）**，填风格描述 / 歌词、点生成就出片。对「只想快速出几首、不想折腾本地部署」的人，这是目前最省事的一条路。

> 备选：① **ACE-Step 官方 HF Space**（在 Hugging Face 搜 `ACE-Step`，认准「Running on Zero」的官方 Space，免登录免 key，但跑在共享 ZeroGPU 上要排队）；② 第三方托管站如 **acestep.io**（每日约 2 首免费额度，可在 XL Turbo / SFT / Base 间切换）。

> 说明：ACE-Step 模型本身是 MIT、可商用；但通过托管平台产出的音频能否商用，以平台最新条款为准。

> 来源：[ACE-Step 1.5 官方仓库 README（推荐 acemusic.ai）](https://github.com/ace-step/ACE-Step-1.5) · [acemusic.ai](https://acemusic.ai/)

### 7.2 路线 B：免费 token 调 API（适合脚本 / 自动化流水线）

这里的「API」不是去申请付费 key，而是：**注册一个免费 HF 账号，生成一个免费的 access token（READ 权限即可，在 `huggingface.co/settings/tokens` 生成，零成本）**，然后用 `gradio_client` 调 Space 暴露的 Gradio 接口。本质是「网页能点的，脚本也能调」。

```python
from gradio_client import Client

# 用免费账号的免费 token 认领你的 ZeroGPU 配额（READ 权限即可）
# Space id 以官方页面为准，常见为 ACE-Step/ACE-Step 系列
client = Client("ACE-Step/ACE-Step", token="hf_你的免费 token")

result = client.predict(
    prompt="lo-fi chillhop, 85bpm, warm piano",  # 风格描述
    audio_duration=60,                            # 秒
    lyrics="",                                    # 留空 = 纯器乐；填歌词 = 带唱
    api_name="/predict",                          # 以 Space 实际暴露的接口名为准
)
print(result)  # 返回音频文件，可直接下载用于配乐
```

> 提示：Space 的确切 id、`api_name` 与参数名可能随版本变化，以官方 Space 页面「API」栏的实际签名为准。这条等于白嫖一个 **MIT 可商用**的音乐生成后端，且和 Python 流水线天然兼容。

### 7.3 关键限制：ZeroGPU 每日免费配额（这才是决策点）

ACE-Step 这类模型 Space 跑在 HF 的 **ZeroGPU**（免费共享 GPU 池）上，**按账号类型给每日 GPU 时间额度**。2026 年 5 月一次 Blackwell 硬件迁移后，配额有过一次上调：

| 账号类型 | 每日免费 GPU 时间 | 排队优先级 |
|---|---|---|
| 未登录 | 2 分钟 | 低 |
| **免费账号** | **5 分钟** | 中 |
| PRO（约 9 美元/月） | 40 分钟（可用预付额度续，1 美元/10 分钟） | 最高 |

- 配额在你**首次使用后整 24 小时**重置（滚动重置，不是按零点）。
- ⚠️ **隐藏成本**：迁移后部分 Space 会自动回落到 `xlarge` GPU，**配额消耗翻倍（2×）**，实际可用量比表面数字少。生成一首 4 分钟的歌在 A100 上约耗时 20 秒，免费账号 5 分钟/天理论上约 15 首，但叠加 2× 回落后会更少。

> 来源：[HF ZeroGPU 官方文档](https://huggingface.co/docs/hub/spaces-zerogpu) · [ZeroGPU Blackwell 更新 PR](https://github.com/huggingface/hub-docs)（2026-05，3.5/25 → 5/40 分钟）

### 7.4 配额不够怎么办：三条退路

| 场景 | 退路 |
|---|---|
| 偶尔测试 / 出几首 BGM | ✅ 免费 token 的 5 分钟/天完全够用 |
| **批量给大量内容自动配乐** | ① **本地部署 ACE-Step**（<4GB 显存就能跑，彻底无限、版权最干净）；② **付费 API**（如 fal 上的 MiniMax 约 0.03 美元/首，最便宜）；③ 多账号轮换——不推荐，违反使用精神 |

> 结论：HF Space 只适合**先验证模型质量和你的网络环境**，真正量产要转本地部署或付费 API。本地部署可参考官方仓库 `github.com/ace-step/ACE-Step-1.5`。

---

## 八、按用途选型决策表

| 你的用途 | 推荐方案 |
|---|---|
| **就想网页快速出几首、别折腾部署** | **acemusic.ai**（官方、免费、免 GPU，可调 1.5 Turbo / XL Turbo）或 **ACE-Step HF Space** |
| **给内容配纯器乐 BGM** | 本地 **ACE-Step**（MIT、可自动化）或免费 **Google Lyria 3**（Gemini 内直接出，30 秒段够用） |
| **做带人声的完整歌曲** | **ACE-Step**（免费/本地）出样；要发商用就用国内 **蘑兔 AI / MELO**（付费但版权清晰、中文好），或本地 **YuE** |
| **集成进自动化流水线** | 本地 **ACE-Step** 或 **火山引擎豆包音乐模型 API**，两者都能脚本批量调用 |
| **中文 / 国风内容** | **蘑兔 AI / MELO**（版权干净），或 **ACE-Step**（支持 50+ 语言） |

一句话总原则：**只要产物要商用/分发，就走开源（ACE-Step 优先）或付费买干净版权；Suno/Udio 的免费额度只用来试听定方向。**

---

## 九、参考资料

**论文与技术原理**

- [ACE-Step 1.5: Pushing the Boundaries of Open-Source Music Generation (arXiv 2602.00744)](https://arxiv.org/abs/2602.00744)
- [ACE-Step 1.0 论文 (arXiv 2506.00045)](https://arxiv.org/abs/2506.00045)
- [Auto-Regressive vs Flow-Matching 比较研究 (arXiv 2506.08570)](https://arxiv.org/abs/2506.08570)
- [Diffusion Beats Autoregressive in Data-Constrained Settings (CMU ML Blog)](https://blog.ml.cmu.edu/2025/09/22/diffusion-beats-autoregressive-in-data-constrained-settings/)

**开源模型仓库**

- [ACE-Step 1.5 (GitHub, MIT)](https://github.com/ace-step/ACE-Step-1.5) · [ACE-Step 1.5 HF 模型卡](https://huggingface.co/ACE-Step/Ace-Step1.5) · [项目主页](https://ace-step.github.io/ace-step-v1.5.github.io/)
- [YuE (GitHub, 港科大/M-A-P, Apache 2.0)](https://github.com/multimodal-art-projection/YuE)
- [DiffRhythm 谛韵 (GitHub, 西工大 ASLP-lab, Apache 2.0)](https://github.com/ASLP-lab/DiffRhythm)

**版权与行业**

- [The AI Music Endgame Part 2: Warner Music Settles Suno Lawsuit](https://vinylculture.substack.com/p/the-ai-music-endgame-part-2-warner)
- [ravlik — ACE-Step 1.5 对标 Suno v5 评测](https://ravlik.com/2026/06/07/ace-step-1-5-open-source-music-ai-that-runs-locally-and-matches-suno-v5-in-benchmarks)
- [HeartMuLa 实测对比（200+ 首跨 10 曲风）](https://heart-mula.com/ace-step)

**实操接入**

- [HF ZeroGPU 官方文档（配额与限制）](https://huggingface.co/docs/hub/spaces-zerogpu)
- [fal.ai 文本转音乐 API 定价](https://fal.ai/explore/text-to-music-apis)
