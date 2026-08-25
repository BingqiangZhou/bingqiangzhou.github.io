---
title: 【AI实测】ACE-Step 1.5 实测：给播客和视频配乐，这免费的 AI 音乐行不行？
published: 2026-07-08
description: 用 ACE-Step 1.5（免费、能商用的 AI 音乐模型）按播客/短视频真实创作动线生成 12 段样本，请 Gemini 3.1 Pro 逐段盲听打分——片头/BGM/转场/片尾功能性配乐几乎全 5/5，中文人声"字正腔圆"，连"让音乐模型做转场音效"都没翻车。本文逐段给出场景、提示词、写法要点和听评，并总结提示词万能公式与该模型的能力边界。
lang: zh
tags: [AI实测]
abbrlink: ace-step-podcast-video-music-realtest
---

给结论先：**行，而且对中文创作者特别友好**。

我用 ACE-Step 1.5（免费、能商用的 AI 音乐模型）按播客和短视频的真实创作动线生成了 12 段音乐，请 Gemini 3.1 Pro 老师逐段盲听打分，结论比预期乐观——片头、BGM、转场、片尾这些功能性配乐几乎全 5/5，中文人声"字正腔圆"，连"让音乐模型做转场音效"这种刁难测试都没翻车。

**先听三段最直观的**：

🎧 片头 Jingle（温暖钢琴，3 秒品牌音）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/07_podcast_jingle.mp3"></audio>

🎧 BGM 轻快垫底（尤克里里 + 拍手，不抢人声）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/10_bgm_uplifting.mp3"></audio>

🎧 中文人声歌曲（女声咬字字正腔圆）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/16_vocal_chinese.mp3"></audio>

**关于"满分太多"先说句实话**：纯器乐段确实几乎全 5/5，这是 Gemini 老师的主观听感——功能性配乐是这模型的舒适区。但 BGM「不抢戏」这点，建议你自己拿人声垫一次再下结论；带人声的几段评分就克制多了（有 4 分短板）。满不满分不重要，**能不能用进你的内容才是关键**。

这篇测评回答三个问题：**① 12 段场景实测成什么样（第一章）→ ② 提示词怎么写才能出这效果（第二章）→ ③ 这模型适合做什么、不适合做什么（第三章定位）**。想直接看结论的跳第三章末尾，想学写提示词的从第二章看起。

（这模型**怎么调用**——网页端怎么用、API 怎么调、本地怎么部署、并发能跑几路，后续会单独写一篇《ACE-Step 1.5 使用指南》，敬请关注。）

## 一、12 段播客 + 视频场景实测

按**播客和短视频的真实创作动线**生成 12 段样本（编号 01-12），每段给四样东西：**场景 → 提示词 → 写法要点（教你怎么写）→ 🎧 音频 + Gemini 3.1 Pro 老师听评 + 客观打分**。

![播客音乐创作动线：片头→垫底 BGM→转场→片尾](/assets/images/2026/20260708/ace-step/images/01-creative-pipeline.webp)

**评分怎么来的**：听感分（提示词遵循度、音质、情绪、场景可用性，1-5 分制）由 Gemini 老师听完音频盲评；时长精度由作者实测。满分 5 分，4 分及以上算可用。

### 1.1 播客场景（主线，样本 01-06）

按一期播客的真实制作动线：**片头 Jingle → 垫底 BGM（三情绪对照）→ 中插 Bumper → 片尾 Outro**。

#### 样本 01：播客片头 Jingle（温暖钢琴，3 秒）

**场景**：节目开场"声音 logo"，要短、要独特、3 秒内建立品牌识别。

**提示词**：

```
<prompt>warm piano instrumental, gentle chime, brand ident, bright and welcoming, short opening logo, no vocals, no drums</prompt>
```

（指定 3 秒、勾上纯器乐。）

**写法要点**：`brand ident`（品牌标识）是关键——它告诉模型"这是 logo 音效不是一段曲子"，生成会更短促、有辨识度；配 `no vocals, no drums` 锁死纯器乐，避免模型自作主张加人声或鼓点。

🎧 样本 01（片头 Jingle）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/07_podcast_jingle.mp3"></audio>

**Gemini 点评**：温暖钢琴配清脆钟声，开头无爆音，质感极佳的播客品牌开场（听感全 5/5）。

**唯一短板——时长**：要求 3 秒实给 5.12 秒（时长精度 2/5）。云端有 ≈5.12 秒的隐性下限，想要更短的 jingle 必须用剪辑工具裁切（好在开头无爆音，裁前 3 秒是安全的）。

#### 样本 02-04：BGM 三情绪对照（平静 / 科技 / 轻快，各 30 秒）

**场景**：这是**整篇测评的核心实验**——同一套结构、只改情绪词，看模型能不能准确区分 calm / tech / uplifting 三种 mood。这是播客 BGM 最真实的需求：不同主题的节目要配不同情绪的垫底音乐。

**三个提示词**（三段都指定 30 秒、勾上纯器乐，只改情绪和乐器描述）：

```
样本 02 - calm 平静
<prompt>calm ambient instrumental loop, soft piano, gentle pads, no vocals, no drums, no melody lead, seamless and unobtrusive</prompt>

样本 03 - tech 科技（与 02 对照，只改情绪和乐器）
<prompt>tech instrumental loop, subtle electronic, minimal synth arpeggios, clean and focused, no vocals, no drums, seamless background</prompt>

样本 04 - uplifting 轻快
<prompt>uplifting instrumental loop, light ukulele strumming, soft handclaps, warm acoustic guitar, cheerful and breezy, no vocals, seamless background</prompt>
```

**写法要点**：这三段是"**只改情绪词、其他结构不动**"的对照实验。两个关键技巧——① calm/tech 都加了 `no melody lead`（不要主旋律），BGM 一旦有明显旋律线就会和人声抢注意力；② uplifting 故意不放这个约束，改用具体乐器（ukulele+handclaps）让"轻快"有抓手。看 Gemini 点评三段听感差异大不大，就知道模型对 mood 词敏不敏感。

🎧 样本 02（calm）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/08_bgm_calm.mp3"></audio>

🎧 样本 03（tech）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/09_bgm_tech.mp3"></audio>

🎧 样本 04（uplifting）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/10_bgm_uplifting.mp3"></audio>

**样本 02（calm 平静）**：柔和钢琴与 Pad，无鼓点无主旋律，极度平缓克制，可直接垫底（听感全 5/5）。

**样本 03（tech 科技）**：克制的合成器琶音，干净利落，科技感、专注感足（听感全 5/5）。

**样本 04（uplifting 轻快）**：尤克里里 + 拍手 + 木吉他，阳光轻松，轻快但不抢人声（听感全 5/5）。

**三段时长均 30.00s 精确命中**（时长精度 5/5）。

**对照小结**：只改情绪词、其他不动，三段听感差异巨大——02 极致平缓、03 克制电子、04 明朗原声，说明模型对 mood 词**极其敏感**。不过"不抢戏"是裸听听感，**真要用还是建议你拿同一段人声分别垫三段试一次**，那才是 BGM 的终极考核。

#### 样本 05：播客中插 Bumper（过渡 stinger，2 秒）

**场景**：长播客的中段过渡，用 1-2 秒的 stinger 提示"要切到下一个话题了"，功能性大于音乐性。

**提示词**：

```
<prompt>short transition stinger, soft bell chime with a single warm piano note, clean and crisp, section divider, no vocals, no drums</prompt>
```

（指定 2 秒、勾上纯器乐。）

**写法要点**：bumper 是功能性音效不是音乐，所以要极力**约束模型别发挥**——`single warm piano note`（单个钢琴音符）+ `section divider`（段落分割器）明确告诉它"只出一个短促的提示音，别铺旋律"。

🎧 样本 05（播客中插 Bumper）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/11_podcast_bumper.mp3"></audio>

**Gemini 点评**：干净的单音加钟声，没有塞多余旋律，起落干脆，是极佳的段落过渡提示（听感 5/5，情绪不适用）。

**唯一短板——时长**：要求 2 秒实给 5.12 秒（时长精度 1/5，本批最严重）。时长还是那个隐性下限在作怪。其实更省事的做法是——直接从现成的 jingle 里裁一段当 bumper，不用单独生成。

#### 样本 06：播客片尾 Outro（收束音乐，15 秒）

**场景**：节目结尾，要"收得住"——渐弱、结束和弦明确，给听众"结束感"。

**提示词**：

```
<prompt>warm piano outro, gentle resolving chord, soft strings fade out, calm and conclusive ending, no vocals, no drums</prompt>
```

（指定 15 秒、勾上纯器乐。）

**写法要点**：outro 的核心是**收束感**，AI 音乐常见问题是"不知道怎么结尾"（戛然而止或无限循环）。两个关键指令：`resolving chord`（解决和弦，让音乐"落回主音"有结束感）+ `fade out`（渐弱），组合起来模型才懂"要收了"。

🎧 样本 06（播客片尾 Outro）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/12_podcast_outro.mp3"></audio>

**Gemini 点评**：钢琴配弦乐，自然渐弱（fade out），收束感明确无生硬切断，适合直接贴片尾（全 5/5，时长 15.00s 精确命中）。

### 1.2 视频场景（拓展，样本 07-09）

播客能用，短视频呢？这节测三个视频典型场景。

#### 样本 07：视频开场 Cinematic Intro（渐强史诗，10 秒）

**场景**：短视频开场，要"抓人"——渐强结构、史诗感、10 秒内建立氛围。

**提示词**：

```
<prompt>cinematic orchestral intro, slow build from soft strings to powerful brass, dramatic and heroic, gradual crescendo, no vocals, epic film opening</prompt>
```

（指定 10 秒、勾上纯器乐。）

**写法要点**：渐强（crescendo）是动态变化指令，光写"epic"模型不知道怎么铺排——要用 `slow build from soft strings to powerful brass`（从柔和弦乐慢慢爬到强力铜管）把"起伏过程"写出来，模型才会做出层次分明的渐强，而不是一上来就满配器。

🎧 样本 07（视频开场 Cinematic Intro）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/13_video_cinematic_intro.mp3"></audio>

**Gemini 点评**：弦乐到铜管的渐强（crescendo）层次分明，复杂管弦配器下依然干净无电流声，开场冲击力足（全 5/5，时长 10.00s 精确命中）。

**这是本批的音质压力测试**——管弦乐（弦乐 + 铜管 + 定音鼓）是 AI 音乐最容易翻车的配器，常出现金属感铜管、糊掉的弦乐群。Gemini 给音质 5/5 是个超出预期的强信号：ACE-Step 在重配器场景下没暴露伪影。

#### 样本 08：视频转场 Transition whoosh（能力边界，3 秒）

**场景**：视频画面切换的"嗖"一声过渡音效。**这是故意为难模型**——让音乐生成模型做音效设计。

**提示词**：

```
<prompt>cinematic transition whoosh, rising synth sweep with impact hit, dramatic scene change, no vocals, no drums, short swoosh</prompt>
```

（指定 3 秒、勾上纯器乐。）

**写法要点**：这是**故意为难模型**——让音乐模型做无音高的转场音效。关键是描述音效结构而不是音乐要素：`rising synth sweep`（上升的合成器扫频）+ `impact hit`（撞击）把"嗖—砰"的音效动作写清楚，模型才不会自作主张塞段旋律。

🎧 样本 08（视频转场 Transition whoosh）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/14_video_transition_whoosh.mp3"></audio>

**Gemini 点评**：合成器 sweep 加撞击声，真的做出了纯音效而没塞旋律，超出预期（听感 5/5，情绪不适用）。唯一短板还是时长（要求 3s 给 5.12s）。

**这是我最预期翻车、结果没翻车的样本**——原以为音乐模型做不了无音高的转场音效，结果它真的做出了"嗖—砰"。说明 ACE-Step 的指令控制力比想象中强，能跨界做简单音效设计。

#### 样本 09：视频片尾 outro（带英文人声，20 秒）

**场景**：YouTube/B 站片尾常见的"感谢观看，下次见"，带人声、有结束感。

**提示词**（风格描述 + 歌词，指定 20 秒、语言选英文）：

```
<prompt>upbeat indie pop outro, clean electric guitar, warm male vocal, cheerful and feel-good, closing credits vibe</prompt>
<lyrics>[Chorus]
Thanks for watching till the end
Hit subscribe and be my friend
See you next time, take it slow
This is how the story goes

[Outro]
Catch you later, bye for now</lyrics>
```

**写法要点**：视频片尾是"功能性短曲",歌词要**口语化、有明确动作指向**(Thanks for watching / Hit subscribe),配合 `closing credits vibe` 告诉模型"这是片尾引导订阅的调性"。注意这里只写了 `[Chorus]` 和 `[Outro]` 两段 (没写 Verse),因为 20 秒装不下完整曲式，精简结构反而更贴。

🎧 样本 09（视频片尾 outro，英文人声）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/15_video_outro_vocal.mp3"></audio>

**Gemini 点评**：Indie pop 男声准确，情绪欢快贴片尾；但人声边缘偶有机器处理感，"Thanks for watching" 等核心词可懂、个别连读微含糊（听感有 4 分短板，时长 20.00s 精确命中）。

**这是第一段出现 4 分的样本**——纯器乐段全是 5/5，一带人声就降到 4/5。这个**"器乐强、人声略降"**的规律后面 10/11 也会重复出现，是 ACE-Step 能力分布的真实写照。

### 1.3 能力边界（测极限，样本 10-12）

这三个样本测模型的"天花板"和已知短板。

#### 样本 10-11：中/英文人声歌曲对照（各 30 秒）

**场景**：用同结构的提示词测中文和英文人声，重点对比**中文咬字和英文咬字的差异**——业界（钛媒体实测）指出多数 AI 音乐模型中文人声咬字偏弱，ACE-Step 作为国产模型理论上中文应有优势，这两段直接对照。

**提示词（中文 10，指定 30 秒、语言选中文）**：

```
<prompt>gentle mandopop ballad, warm acoustic guitar and soft piano, clear female vocal, emotive and nostalgic</prompt>
<lyrics>[Verse 1]
夜色慢慢落下来
灯光把影子拉长
一个人走在街头
风吹过旧时光

[Chorus]
那些没说出口的话
都变成了星光
亮在回去的路上</lyrics>
```

**提示词（英文 11，同结构，语言选英文、风格换 indie pop + 男声）**：

```
<prompt>upbeat indie pop, clean electric guitar, energetic male vocal, summer vibe</prompt>
<lyrics>[Verse 1]
Walking down the sunny street
Feeling the rhythm in my feet
Every corner holds a song
This is where I belong

[Chorus]
We are the dreamers tonight
Dancing under the city lights
Catch the moment, hold it tight</lyrics>
```

**写法要点**：两段是对照实验，结构完全一样，只换语言和风格。两个关键——① 生成中文歌一定要把**语言选项指定成"中文"**,咬字会准很多 (不指定的话模型可能用英文音色硬唱中文，怪腔调);② 歌词用 `[Verse]`/`[Chorus]` 分段，模型会按段落铺排旋律起伏，结构越清楚曲式越像样。两段对照能直接听出中英文咬字的差异。

🎧 样本 10（中文人声）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/16_vocal_chinese.mp3"></audio>

🎧 样本 11（英文人声）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/17_vocal_english.mp3"></audio>

**样本 10（中文人声）**：女声自然真实、呼吸感接近真人，**中文咬字字正腔圆**，几乎可当成品单曲（全 5/5，时长 30.00s 精确命中）。

**样本 11（英文人声）**：夏日感活力足，但相较中文女声略逊——高频有轻微压缩感，男声发声带电音感、个别连读微含糊（音质/人声/可懂 4/5，时长 30.00s 精确命中）。

**对照小结**：业界（钛媒体实测）指出多数 AI 音乐模型中文人声咬字偏弱，而 ACE-Step 的中文女声拿到双 5/5，Gemini 用了"字正腔圆""几乎听不出 AI 痕迹"这种强表述；英文男声三项降到 4/5。**中文明显优于英文**——这对中文创作者是个实打实的利好。（注：性别和曲风也不同，严格对照需控制变量，这里只是初步信号。）

#### 样本 12:4 分钟长曲子（长结构连贯性，240 秒）

**场景**：测长时长上限——4 分钟（240 秒）能不能精确命中，以及更重要的是"4 分钟内段落过渡自不自然"。官方 [API 文档](https://github.com/ACE-Step/ACE-Step-1.5/blob/main/docs/en/API.md)标注时长范围是 **04-600 秒**（最长 04 分钟），我直接测接近上限的 4 分钟。

**提示词**（多段结构 `[Verse 1]/[Chorus]/[Verse 2]/[Chorus]/[Bridge]/[Chorus]`，指定 240 秒、语言选中文）：

```
<prompt>gentle mandopop ballad, warm acoustic guitar and soft piano, emotive female vocal, nostalgic and cinematic, slow build</prompt>
<lyrics>[Verse 1]
夜色慢慢落下来
灯光把影子拉长
一个人走在街头
风吹过旧时光

[Chorus]
那些没说出口的话
都变成了星光
亮在回去的路上
陪我走到天亮

[Verse 2]
抽屉里的旧信
字迹已经模糊
那时候的我们
多认真啊

[Chorus]
那些没说出口的话
都变成了星光
亮在回去的路上
陪我走到天亮

[Bridge]
如果有一天再相遇
会不会还认得彼此的脸
时间带走了什么
又留下了什么

[Chorus]
那些没说出口的话
都变成了星光
亮在回去的路上
陪我走到天亮</lyrics>
```

**写法要点**：长曲子的关键是**用结构标签把整首歌的骨架搭出来**——`[Verse 1] → [Chorus] → [Verse 2] → [Chorus] → [Bridge] → [Chorus]`。尤其是 `[Bridge]`（桥段）不能省，它是副歌反复之间的"变化点",没有它模型容易在重复中陷入死循环。风格描述里加 `slow build`（慢热爬升）,让 4 分钟有情绪起伏而不是一条直线。

🎧 样本 12（4 分钟长曲）
<audio controls preload="none" src="/assets/images/2026/20260708/ace-step/audio/18_long_4min.mp3"></audio>

**Gemini 点评**：4 分钟内声学质量稳定，主副歌过渡自然、桥段有变化、**后半段无崩坏或死循环**，女声音准稳、中文咬字始终清晰（全 5/5，时长 240.00s 精确命中）。

**AI 长曲的常见死穴是"前 30 秒很好，后面开始重复或崩坏"**——这段扛住了。另一个反直觉发现：**长曲子几乎不多花时间**，4 分钟的歌生成耗时只比 30 秒的多 6 秒（Turbo 模型一次性生成完整音频）。对想直接生成完整歌曲的创作者是关键能力。

## 二、提示词怎么写

看完 12 段效果，想自己动手写了？这章讲方法论。提示词写得好不好，生成质量天差地别——下面是这套方法的实战总结。

### 2.1 万能公式：风格 + 乐器 + 情绪 + 人声/器乐 + 结构

风格描述遵循一个跨平台通用的万能公式：

```
[风格/流派] + [乐器] + [情绪] + [人声/器乐] + [结构]
```

对照上面的样本看：片头是"温暖钢琴 + 钟声 + 明亮欢迎 + 纯器乐 + 短开场 logo"，BGM 是"平静氛围 + 柔和钢琴 + 纯器乐 + 不要鼓点/主旋律"。**经验**：4-7 个描述词是甜区，太少不精确、太多模型会混乱；风格和情绪词放最前面（模型对开头词权重最高）。

![提示词万能公式：风格 + 乐器 + 情绪 + 人声/器乐 + 结构](/assets/images/2026/20260708/ace-step/images/02-prompt-formula.webp)

### 2.2 三条关键技巧

**① 先说不要什么，比正向描述更管用**。做 BGM 时一定要写 `no vocals`（不要人声）、`no drums`（不要鼓点）、`no melody lead`（不要主旋律）——模型很容易"自作主张"加人声或鼓点，样本 02/03 就靠这几个负向约束把"垫底不抢戏"做出来的。

**② 乐器和氛围要具体**。`warm piano` 比 `piano` 好，`gentle mandopop` 比 `pop` 好——越具体越贴合。`calm ambient` 比 `background music` 好，因为模型知道你要的是"平静氛围"这种具体色彩。

**③ 带歌词就用 `[Verse]/[Chorus]` 分段**。歌词用 `[Verse]`（主歌）、`[Chorus]`（副歌）、`[Bridge]`（桥段）分段，模型会按段落铺排旋律起伏——结构越清楚曲式越像样，看样本 10/12 的歌词就懂了。

### 2.3 时长和模式：两个要记住的坑

- **锁时长用 Tagged 模式**（用 `<prompt>` 标签那种）：指定多少秒就给多少秒，10 秒到 4 分钟实测零误差。别用 Sample 模式（直接写一句话那种）——它会自作主张覆盖你的时长（实测传 30 秒只给 19 秒）。
- **短时长有 ≈5.12 秒隐性下限**：样本 01/05/08 要求 2-3 秒全被补到 5.12 秒，这是云端 turbo 的最小生成单元。想要更短必须用剪辑工具裁切。

（四种输入模式的完整对比、官方文档链接，后续的《使用指南》会详细展开。）

## 三、评分汇总：12 段样本一目了然

把第一章的打分汇总成一张表。**听感维度（遵循度/音质/情绪/可用性/特化）为 Gemini 3.1 Pro 老师评测，时长精度为作者 ffprobe 实测**：

| 样本 | 场景 | 时长 | 遵循度 | 音质 | 情绪 | 可用性 | 时长精度 | 特化 | 一句话点评 |
|---|---|---|---|---|---|---|---|---|---|
| 01 | 播客片头 Jingle | 3s→5.12s | 5/5 | 5/5 | 5/5 | 5/5 | **2/5** | — | 钢琴温暖 + 钟声，质感极佳的播客开场 |
| 02 | BGM-calm | 30s | 5/5 | 5/5 | 5/5 | 5/5 | **5/5** | — | 极度平静不抢戏，完美"不打扰" |
| 03 | BGM-tech | 30s | 5/5 | 5/5 | 5/5 | 5/5 | **5/5** | — | 电子音色克制聚焦，与 calm 区分清晰 |
| 04 | BGM-uplifting | 30s | 5/5 | 5/5 | 5/5 | 5/5 | **5/5** | — | 尤克里里 + 拍手，明朗轻松 |
| 05 | 播客中插 Bumper | 2s→5.12s | 5/5 | 5/5 | 不适用 | 5/5 | **1/5** | — | 干脆的单音 + 钟声，极佳过渡提示 |
| 06 | 播客片尾 Outro | 15s | 5/5 | 5/5 | 5/5 | 5/5 | **5/5** | — | 弦乐 + 钢琴渐弱，完美收束感 |
| 07 | 视频开场 Cinematic | 10s | 5/5 | 5/5 | 5/5 | 5/5 | **5/5** | — | 管弦渐强层次分明，铜管爆发力足 |
| 08 | 视频转场 whoosh | 3s→5.12s | 5/5 | 5/5 | 不适用 | 5/5 | **2/5** | — | 纯音效没变旋律，超出预期 |
| 09 | 视频片尾（英文人声） | 20s | 5/5 | 4/5 | 5/5 | 5/5 | **5/5** | 人声 4/可懂 4 | 欢快贴片尾，英文男声略带机器感 |
| 10 | 中文人声歌曲 | 30s | 5/5 | 5/5 | 5/5 | 5/5 | **5/5** | 人声 5/可懂 5 | 中文女声自然度极高，咬字字正腔圆 |
| 11 | 英文人声歌曲 | 30s | 5/5 | 4/5 | 5/5 | 5/5 | **5/5** | 人声 4/可懂 4 | 夏日感活力足，英文男声略生硬 |
| 12 | 4 分钟长曲子 | 240s | 5/5 | 5/5 | 5/5 | 5/5 | **5/5** | 长结构 5/人声 5/可懂 5 | 4 分钟结构完整连贯，无崩坏 |

说明："—"表示该维度不适用（如纯器乐不评人声）。分数 1-5 分，5 分最佳。**听感维度由 Gemini 3.1 Pro 评测，时长精度由作者 ffprobe 实测**。

### 从场景评测看 ACE-Step 1.5 的定位

把 Gemini 的听评 + 我的客观实测合在一起看，ACE-Step 1.5 在播客/视频配乐场景的定位非常清晰：

**🎯 强项（5/5 护城河）**

1. **纯器乐功能性音乐是绝对舒适区**。播客动线全部样本（01-06）在听感维度几乎全 5/5——Jingle、BGM 三情绪、Bumper、Outro 都拿到了"完美""极具辨识度""完美收束感"这种强评价。对一个想给播客配乐的创作者，**这套动线开箱即用**。
2. **管弦乐重配器不翻车**。样本 07（Cinematic）是音质压力测试，Gemini 确认"复杂配器下依然干净""铜管爆发力足"——这是 AI 音乐模型的常见死穴，ACE-Step 扛住了。
3. **中文人声是国产模型的硬实力**。10/12 两段中文女声拿到**人声真实感 + 歌词可懂度双 5/5**，"字正腔圆""几乎听不出 AI 痕迹"。对照英文（11）降到 4/5，**中文明显优于英文**——这是中文创作者选它的核心理由。
4. **长结构稳定**。4 分钟样本（12）Gemini 确认"后半段无崩坏、桥段有变化"，AI 长曲"前好后崩"的通病没有出现。
5. **指令控制力超预期**。样本 08（whoosh 转场）我预期翻车，结果模型真的做出了纯音效没塞旋律——说明它对"no melody"类负向约束的执行力很强。

**⚠️ 边界（要避开的坑）**

1. **短时长有 ≈5.12 秒隐性下限**。01/05/08 要求 2-3 秒全被补到 5.12 秒，是本批唯一的硬性技术短板。**想要 <5 秒的 Jingle/Bumper/转场，必须 ffmpeg 裁切**，不能依赖 API 直接给。
2. **英文人声略逊中文**。11 的音质/真实感/可懂度都是 4/5，"略带电音感""个别连读微含糊"——英文歌能用但不如中文惊艳。
3. **"不抢戏"需真实混音验证**。BGM 的"不抢人声"是 Gemini 裸听听感（全 5/5），但 BGM 的终极考核是垫在人声底下——**建议你自己拿同一段人声分别垫 02/03/04 试一次**，那才是"能不能用"的最终判据。

**📌 一句话定位**：ACE-Step 1.5 是当前**中文创作者做播客/短视频配乐最省心、中文人声最不踩坑**的选择——纯器乐 BGM 动线开箱即用，中文歌词歌曲接近成品级；唯一要记住的是"短时长靠 ffmpeg 裁、英文人声留余量"。

（想知道**云端 API 能同时跑几路、批量生成怎么压并发**，后续的《ACE-Step 1.5 使用指南》会有完整压测数据。）

## 结语

ACE-Step 1.5 这模型，从选型到实测给我两个清晰的感受：**授权上没有坑**（MIT + 合规训练数据），**能力上够用且省事**（免费云端、4 分钟长曲子 30 秒出活、时长听话）。这一轮请 Gemini 3.1 Pro 老师逐段听了 12 个场景样本，结论比我想的更乐观——纯器乐功能性音乐（播客片头/BGM/转场/片尾）几乎全 5/5，中文人声"字正腔圆"，连我预期翻车的 whoosh 转场都没翻车。对一个想给内容加点音乐、又不想踩授权雷的中文创作者来说，它就是当下最合适的那一个。

不过也要留两个清醒：一是 Gemini 给的满分是主观听感，尤其 BGM 的"不抢戏"得在你自己的真实混音里验；二是云端有 ~5 秒的时长下限，批量场景还要考虑并发瓶颈（这个后续《使用指南》会专门讲）。**强烈建议你点开上面全部 12 段音频样本听一遍**，自己耳朵说了算——尤其是 BGM 三情绪（02/03/04），拿同一段人声分别垫一次，那才是"能不能用"的终极考核。

如果这篇测评帮到你，想知道**这个模型具体怎么调用**（网页端、云端 API、本地部署），后续会写《ACE-Step 1.5 使用指南》，敬请关注；想知道**选型对比和混音手艺**，回看系列首篇《[给播客加音乐：找到一个免费能商用的 AI 音乐 API](https://mp.weixin.qq.com/s/N8l26CKfCgtcLKl4TIu5nQ)》。两篇合起来，是从"选什么"到"怎么写好提示词"的完整路径。
