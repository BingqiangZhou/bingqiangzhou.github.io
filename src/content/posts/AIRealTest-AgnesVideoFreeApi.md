---
title: 【AI实测】免费生成视频到底行不行？实测 Agnes AI 视频模型
published: 2026-06-26
description: '28 条 1080p 视频实测 Agnes 免费视频模型：画面勉强能用但文生锁不住角色，图生视频能锁定主体，1 分钟成片约等 1 小时，8 路并发 6.5× 加速。'
lang: zh
tags: [AI实测]
abbrlink: agnes-video-realtest
---


在[上一篇《免费出图到底行不行？实测 Agnes AI 图片模型》](https://mp.weixin.qq.com/s/zJZcWllh9Q55UDTrHWTaBw)里认真测过——不涉及汉字的图，质量确实够用，还免费。但它卡在图像尺寸上：公众号封面要的比例它就不支持，所以我手头的工作流暂时还是用不上它，顶多在没有积分消耗的其他场景里当个候选。图片这条线，后面还得再多验证、多尝试。

至于视频，我当初也弃用过——理由更直接："又慢又不可控"，做视频流水线时塞进去没几天就撤了。不过当初测得太敷衍，这次再认真测一下视频生成。

这次延续图片篇的测法，照着业界通用的测试题来跑，每个场景多试几次，画面再用别的工具核对一遍——**一共 28 条 1080p 视频**，同一个提示词会反复跑 5 次看稳不稳，还试了"图生视频"（给一张图当开头，让它接着往下生成）。

视频模型是 `agnes-video-v2.0`，接口兼容 OpenAI 格式——去 `platform.agnes-ai.com` 注册拿 API Key，base_url 改成 `https://apihub.agnes-ai.com/v1`、Bearer Token 认证就能跑。这篇文章每一段视频都是**真跑 API 跑出来的**，提示词都写在对应场景里，接口上面也给了，有兴趣可以自己跑跑看。

## TL;DR · 太长不看

- **只算勉强能用，跟最新模型差一截**：逐题实测没有多腿、变形、塑料感这类明显瑕疵，但画面精细度、动态质感追不上一线模型，稍微复杂点的镜头变化也扛不住——能稳跑的多是简单场景、缓节奏运动。
- **真正的短板是锁不住角色**：同一条提示词反复跑 5 次，每次都符合描述（遵循度高），但姿态、背景各不相同（一致性差），拼不成连续镜头——文生视频基本就是"抽卡"。
- **想画面一致，得靠图生视频**：先用文生图锁定主体做关键帧，再让它接着动起来，3 个场景主体一致度全"高"，这是唯一能锁住角色的路。
- **慢**：生成耗时约是成片的 60 倍，做 1 分钟 1080p 成片要等约 1 小时（单条约 209 秒）；片段做得长一点，单位成本反而更低。
- **并发对个人够用**：8 条一起跑能拿到约 6.5× 加速、成功率 100%，偶尔撞上网络抖动或限流重试即可。
- **免费，但每日有调用限额**：拿来试水、做副链路、跑实验都行，真要上量得多备几个 API Key 轮换——别把生产主力押在免费上。
- **支持真 1080p**（1920×1080），这点比图片接口强，图片接口出不了真 1080p。

下面是完整过程。

## 一、视频生成：画面过关，但慢、锁不住角色

### 逐题实测（视觉复核）

基础 4 个维度各跑 3 条，下面每个场景都列了各次的封面帧（=视频中间帧）；公众号图文单篇最多嵌 10 个视频，所以**每组只有第 1 次是可播放视频**（点第 1 次封面帧即可看动态），其余几次只展示封面帧。每个都标了视觉复核的结论。

#### 1. 单主体运动 · 橘猫海滩走（VBench 经典运动项）

**提示词**：`A fluffy orange cat walking along a beach at sunset, gentle waves in the background, cinematic, slow motion`（81 帧 @24fps ≈3.4s，1920×1080）

| 第 1 次 | 第 2 次 | 第 3 次 |
|---|---|---|
| [![cat1](/assets/images/2026/20260626/agnes-video/single_subject/_midframes/cat_walking_beach_run1.png)](/assets/images/2026/20260626/agnes-video/single_subject/cat_walking_beach_run1.mp4) | ![cat2](/assets/images/2026/20260626/agnes-video/single_subject/_midframes/cat_walking_beach_run2.png) | ![cat3](/assets/images/2026/20260626/agnes-video/single_subject/_midframes/cat_walking_beach_run3.png) |

4 条腿、身体比例正常、无变形/融合/塑料感，物理合理 — **过关**。

#### 2. 复杂多动态 · 夜间城市航拍（VBench 多动态元素）

**提示词**：`Aerial drone shot of a busy city intersection at night, cars with headlights moving, neon signs, rain on the streets`（81 帧 @24fps ≈3.4s，1920×1080）

| 第 1 次 | 第 2 次 | 第 3 次 |
|---|---|---|
| [![city1](/assets/images/2026/20260626/agnes-video/multi_dynamic/_midframes/city_traffic_aerial_run1.png)](/assets/images/2026/20260626/agnes-video/multi_dynamic/city_traffic_aerial_run1.mp4) | ![city2](/assets/images/2026/20260626/agnes-video/multi_dynamic/_midframes/city_traffic_aerial_run2.png) | ![city3](/assets/images/2026/20260626/agnes-video/multi_dynamic/_midframes/city_traffic_aerial_run3.png) |

俯瞰航拍正确，车灯轨迹/霓虹/湿街反光都在，远处招牌文字虽然乱码——不过免费 AI 要啥自行车，**算勉强过关**。

#### 3. 运镜控制 · 科幻走廊推镜头（VBench camera motion）

**提示词**：`Dolly zoom shot moving forward through a long futuristic corridor with glowing blue lights, camera continuously pushing in, dramatic perspective, cinematic`（81 帧 @24fps ≈3.4s，1920×1080）

| 第 1 次 | 第 2 次 | 第 3 次 |
|---|---|---|
| [![dolly1](/assets/images/2026/20260626/agnes-video/camera_motion/_midframes/dolly_zoom_corridor_run1.png)](/assets/images/2026/20260626/agnes-video/camera_motion/dolly_zoom_corridor_run1.mp4) | ![dolly2](/assets/images/2026/20260626/agnes-video/camera_motion/_midframes/dolly_zoom_corridor_run2.png) | ![dolly3](/assets/images/2026/20260626/agnes-video/camera_motion/_midframes/dolly_zoom_corridor_run3.png) |

发光走廊、强透视纵深、远端汇聚点正确（单帧判不了镜头是否真"持续前推"，看 mp4） — **过关**。

#### 4. 特殊场景 · 水下海龟（流体渲染）

**提示词**：`Underwater scene, a sea turtle swimming over a coral reef, sun rays filtering through the water surface, schools of fish, cinematic, slow motion`（81 帧 @24fps ≈3.4s，1920×1080）

| 第 1 次 | 第 2 次 | 第 3 次 |
|---|---|---|
| [![uw1](/assets/images/2026/20260626/agnes-video/underwater/_midframes/underwater_turtle_run1.png)](/assets/images/2026/20260626/agnes-video/underwater/underwater_turtle_run1.mp4) | ![uw2](/assets/images/2026/20260626/agnes-video/underwater/_midframes/underwater_turtle_run2.png) | ![uw3](/assets/images/2026/20260626/agnes-video/underwater/_midframes/underwater_turtle_run3.png) |

海龟/珊瑚/鱼群/阳光光束都在，水清澈自然、无塑料感 — **过关**。

#### 5. 长视频 · 夜市街道（161 帧 ~6.7s，时序一致性难点）

**提示词**：`A night market street with food stalls, steam rising from dumplings, people walking, lanterns swaying, cinematic, 4k`（161 帧 @24fps ≈6.7s，1920×1080）

| 第 1 次 | 第 2 次 | 第 3 次 |
|---|---|---|
| [![long1](/assets/images/2026/20260626/agnes-video/long_video/_midframes/long_night_market_run1.png)](/assets/images/2026/20260626/agnes-video/long_video/long_night_market_run1.mp4) | ![long2](/assets/images/2026/20260626/agnes-video/long_video/_midframes/long_night_market_run2.png) | ![long3](/assets/images/2026/20260626/agnes-video/long_video/_midframes/long_night_market_run3.png) |

食物摊位、蒸汽、灯笼、行人都在，无明显变形或闪烁 — **长视频质量稳住，没崩**。

✅ 画面这关没翻车——但也就勉强能用、谈不上多好；它还不是最卡的，下一节的一致性才是重头戏。

### 复现性：同一条提示词反复跑 5 次，能不能对上

先说清楚这一节看什么：同一条提示词反复跑 5 次，看两件事——每次生成的画面**符不符合提示词**（**遵循度**，决定单条能不能用），以及这几次之间**像不像、是不是同一个画面**（**一致性**，决定能不能锁住角色、做连续镜头）。文生视频不固定随机种子，每次生成都带随机，所以这两件事要分开看：遵循度高不代表一致——每次都给你一只橘猫（符合描述），但可能是 5 只不同的橘猫（锁不住角色）。

#### 6. 简单场景 · 窗台橘猫看雨

**提示词**（5 次都用同一条）：`A fluffy orange cat sitting on a windowsill watching rain outside, cozy indoor lighting, cinematic`（81 帧 @24fps ≈3.4s，1920×1080）

5 次生成的画面如下（仅第 1 次可点开看动态，第 2–5 次为封面帧）：

| 第 1 次 | 第 2 次 | 第 3 次 |
|---|---|---|
| [![cat1](/assets/images/2026/20260626/agnes-video/consistency/_midframes/consistency_cat_run1.png)](/assets/images/2026/20260626/agnes-video/consistency/consistency_cat_run1.mp4) | ![cat2](/assets/images/2026/20260626/agnes-video/consistency/_midframes/consistency_cat_run2.png) | ![cat3](/assets/images/2026/20260626/agnes-video/consistency/_midframes/consistency_cat_run3.png) |

| 第 4 次 | 第 5 次 |
|---|---|
| ![cat4](/assets/images/2026/20260626/agnes-video/consistency/_midframes/consistency_cat_run4.png) | ![cat5](/assets/images/2026/20260626/agnes-video/consistency/_midframes/consistency_cat_run5.png) |

- **遵循度**（每次对照提示词"橘猫坐窗台看雨"）：5 次都符合——都是橘猫、都坐在窗台、窗外都是雨天。
- **一致性**（彼此之间）：差——每次的具体画面都不一样：姿态（第 3 次从坐姿变趴姿）、窗台材质、窗外景物（花园 / 铁丝网 / 建筑）各不相同。

单条都符合提示词、能用；但每次不是同一只橘猫、同一扇窗，**锁不住角色**，拼不成连续镜头。

#### 7. 复杂场景 · 夜市摊位

**提示词**（5 次都用同一条）：`A bustling night market stall with steam rising from a food cart, warm lantern light, vendors and customers, cinematic`（81 帧 @24fps ≈3.4s，1920×1080）

5 次生成的画面（仅第 1 次可点开看动态，第 2–5 次为封面帧）：

| 第 1 次 | 第 2 次 | 第 3 次 |
|---|---|---|
| [![m1](/assets/images/2026/20260626/agnes-video/consistency/_midframes/consistency_market_run1.png)](/assets/images/2026/20260626/agnes-video/consistency/consistency_market_run1.mp4) | ![m2](/assets/images/2026/20260626/agnes-video/consistency/_midframes/consistency_market_run2.png) | ![m3](/assets/images/2026/20260626/agnes-video/consistency/_midframes/consistency_market_run3.png) |

| 第 4 次 | 第 5 次 |
|---|---|
| ![m4](/assets/images/2026/20260626/agnes-video/consistency/_midframes/consistency_market_run4.png) | ![m5](/assets/images/2026/20260626/agnes-video/consistency/_midframes/consistency_market_run5.png) |

- **遵循度**（对照"夜市摊位、蒸汽、灯笼、顾客"）：5 次都符合——核心元素都在。
- **一致性**（彼此之间）：核心元素稳定（摊位 / 蒸汽 / 灯笼都在），但构图取景、人群密度、食物种类每次有出入。

复杂场景命中核心元素容易（遵循度高），细节也比橘猫稳；但要做"同一个摊位、同一批人"的连续镜头，照样锁不住。

**结论**：同一条提示词反复生成，主体大类稳得住（都橘猫、都夜市），但姿态、场景细节每次都不一样——**没法稳定复现同一个画面，也锁不住角色**。所以用文生视频基本就是"抽卡"：多跑几次碰运气，挑一条能用的，别指望它稳定给你想要的那一版。需要镜头连贯、角色一致的剧情，这条路走不通——下一节的图生视频才是解法。

## 二、图生视频：文生救不了的，图生能救

既然文生视频锁不住角色（同一条提示词每次都生成不一样的画面），业界标准解法是"**关键帧 + 图生视频首帧锁定**"——先用文生图锁定主体，再以该图为首帧生成视频。下面直接做个对比：同一个主体，文生视频和图生视频各生成一遍，看图生到底能不能锁住角色。

**链路**（关键约束）：文生图（`agnes-image-2.1-flash`）返回的 `image_url` 是公网 URL，直接喂视频接口 `--image <url>`。关键帧 prompt 锁定主体，motion prompt 只写运动/运镜（不重复主体，避免漂移）。尺寸值得一提：关键帧请求 1920×1080，实际只给到 **1312×736**（图片接口档位制，出不了真 1080p，这点 01 图片篇测过）；但以它做首帧生成的视频是 **1920×1088**（真 1080p，H.264 把高度对齐到 16 的倍数 1088）。也就是说，视频接口能把缩水的关键帧"放大"成真 1080p 输出——这也是视频接口比图片接口强的地方。

**3 个场景**，每个：左为文生图关键帧（锁定主体），右为以关键帧做首帧的图生视频（点开看动态）：

### 1. 动物 · 窗台橘猫

**关键帧提示词**（文生图锁定主体）：`A fluffy orange cat sitting on a windowsill watching rain outside, cozy warm indoor lighting, photorealistic, sharp focus`

**motion 提示词**（图生视频）：`The cat slowly turns its head, rain streaming down the window, subtle breathing, camera static, cinematic`

| 关键帧（文生图） | 图生视频 |
|---|---|
| ![kf_cat](/assets/images/2026/20260626/agnes-video/i2v/keyframes/i2v_cat_windowsill_kf.png) | [![i2v_cat](/assets/images/2026/20260626/agnes-video/i2v/_midframes/i2v_cat_windowsill.png)](/assets/images/2026/20260626/agnes-video/i2v/i2v_cat_windowsill.mp4) |

主体/姿态/场景一致度：**高**（橘猫毛色、坐姿、窗台雨景完整保留）。

### 2. 人物 · 地铁青年

**关键帧提示词**（文生图锁定主体）：`A tired young man in his late 20s sitting alone in a late-night subway car, wearing a wrinkled shirt and loosened tie, head slightly bowed, dim carriage lighting reflecting on the window, melancholic cinematic mood, photorealistic`

**motion 提示词**（图生视频）：`The man slowly lifts his head, subtle breathing motion, eyes blinking, camera static, cinematic`

| 关键帧（文生图） | 图生视频 |
|---|---|
| ![kf_man](/assets/images/2026/20260626/agnes-video/i2v/keyframes/i2v_man_subway_kf.png) | [![i2v_man](/assets/images/2026/20260626/agnes-video/i2v/_midframes/i2v_man_subway.png)](/assets/images/2026/20260626/agnes-video/i2v/i2v_man_subway.mp4) |

主体/姿态/场景一致度：**高**（青年穿着、低头姿态、地铁车厢完整保留）。

### 3. 食物 · 夜市小笼包

**关键帧提示词**（文生图锁定主体）：`A close-up of steamed dumplings on a bamboo steamer in a night market stall, steam rising, warm lantern light, photorealistic`

**motion 提示词**（图生视频）：`Steam rising from the dumplings, warm lantern light flickering, gentle camera push-in, cinematic`

| 关键帧（文生图） | 图生视频 |
|---|---|
| ![kf_food](/assets/images/2026/20260626/agnes-video/i2v/keyframes/i2v_food_stall_kf.png) | [![i2v_food](/assets/images/2026/20260626/agnes-video/i2v/_midframes/i2v_food_stall.png)](/assets/images/2026/20260626/agnes-video/i2v/i2v_food_stall.mp4) |

主体/场景/色调一致度：**高**（蒸笼小笼包、夜市摊位、暖灯笼光完整保留）。

**3/3 场景主体一致度"高"**。对比第一节文生视频 cat 场景构图 0%，**图生视频完胜文生**——这正是"文生视频锁不住角色、必须靠关键帧 + 图生视频兜底"的直接证据。

图生视频单条耗时与文生视频 81 帧同档（首帧锁定不显著增加耗时），且关键帧生成只要 ~28 秒。用图生视频做多镜头剧情，比硬指望文生视频一致，靠谱得多。

## 三、耗时规律：1 分钟成片等 1 小时，外加 3 个 API 坑

这一部分是给想自己上手跑的人看的：生成到底有多慢、调接口有几个坑。

### 耗时：60 倍定律（生成耗时约是成片的 60 倍）

视频接口是异步的：先 `POST /v1/videos` 创建任务拿 `video_id`，然后轮询 `GET /agnesapi?video_id=&model_name=`（注意这个轮询端点**不在 `/v1` 下**，是独立路径），等 `status=completed`，最后从 `remixed_from_video_id` 字段拿下载链接。

1080p（1920×1080）单条端到端实测：

| 帧数 | 成片 | 真实耗时 | 倍数 |
|---|---|---|---|
| 81 帧 | 3.38s | 7 条均值 209s（190-237s） | ~62 倍 |
| 161 帧 | 6.71s | 351s（仅测 1 条） | ~52 倍 |

做 1 分钟 1080p 成片，光生成要等约 1 小时。161 帧虽然总耗时长，但成片也长，**单位时长成本反而比 81 帧低 15%**——做长片段比拼接多条短片段划算。

💡 分辨率对耗时影响显著：低分辨率（0.9MP）只要 137 秒，1080p（2MP）要 190-237 秒，**慢 40-70%**。

### 三个容易踩的 API 坑

代码注释里都标了，照着调 API 的话提前知道能少走弯路：

1. **帧数必须是 `8n+1`**（即 8 的倍数加 1：81/121/161/241/441），传别的值会被拒。
2. **下载链接在 `remixed_from_video_id` 字段**，不在直觉以为的 `video_url`。
3. **图生视频的 `image` 参数只接受 http(s) 网址**，不支持本地文件 / base64——想用本地图，得先传到能公网访问的地方。

## 四、并发实测：8 条并行 6.51× 加速，偶有网络抖动、对个人够用

视频接口支持并发。偶发的失败多半是**网络抖动**——少数任务在创建阶段超时，重试即可，不是并发能力问题。

实测结果（4 条、8 条各跑多轮，确认稳定）：

| 并发 | 成功率 | 加速 |
|---|---|---|
| 4 条 | **100%** | 3.46× |
| 8 条 | **100%** | 6.51× |

表里的"× 加速"= 一条条串行跑的总时间 ÷ 同时并行跑的实际用时；8 条一起能拿到 **6.51× 加速**，也就是并行比串行快 6.51 倍。

偶发的网络抖动或 RPM 限流（短时间内请求太密触发 `http_429`）重试即可恢复。但对个人创作者来说，**这个并发量已经足够**——8 条一起跑能把串行十几分钟的活儿压到两三分钟，日常出几条视频素材绰绰有余。

## 五、总结：到底什么水平，免费用在哪

开头那个悬念——图片至少在某些场景够用，那视频呢？28 条实测跑完，可以给个公允结论了。

**到底什么水平——勉强能用，离最新模型差一截。** 逐题画面没有多腿、变形、塑料感这类硬伤，但精细度、动态质感追不上一线模型。当初撤掉它，理由是"又慢又不可控"；这次认真测完才看清，**真正的本质问题不是慢、也不是锁不住角色，而是它只能产生简单的视频**——稍微复杂一点的镜头变化就扛不住，能稳跑的多是简单场景、缓节奏运动。这是能力天花板，换提示词、换参数都突破不了，连图生视频也抬不上去。

锁不住角色是另一个问题，但好歹有解：同一条提示词跑 5 次，每次都符合描述（都给你一只橘猫），但姿态、场景构图每次都对不上，拼不成连续镜头——文生视频只能当"抽卡"用，多跑几轮挑一条。要镜头连贯，**关键帧 + 图生视频首帧锁定**能稳住主体（第二节实测 3/3 场景一致度"高"），不过它只解决"角色不变"，救不了"只能简单"那个天花板。再叠加"慢"也没变（1080p 单条约 209 秒，做 1 分钟成片要等 1 小时）——当初的弃用判断，这次依然成立。

**那免费用在哪？**

- **适合**：偶尔出一两条做素材、对一致性没要求的场景；配上 8 条并行的 6.5× 加速，白嫖很值。
- **不适合**：批量、稳定、能质检的多镜头生产，以及任何需要复杂镜头变化或连续剧情的内容——前者它扛不住，后者就算靠图生视频锁住角色，也突破不了"只能简单"的天花板。

**至于"免费"本身**——官方挂的是"永久免费"，听着很美，但这种好事能维持多久不好说、政策随时可能调；每日调用也有限额，真要上量得多备几个 API Key 轮换（这次 28 条采集就撞了 2 次限流）。这态度跟图片篇一脉相承：**且用且珍惜，能白嫖的机会没理由不薅**——拿来试水、做副链路、跑实验都没问题；但"每日限额 + 政策随时可能变"这把剑一直悬在头上，别拿它扛生产主力。**免费是好东西，别全指望它。**

比视频数据更值钱的收获是：**不带偏见、用标准 benchmark 把一个工具认真测一遍，远比凭一两次印象下结论靠谱。** 工具会迭代，印象会过时，但"让数据自己说话"这个习惯不会过时。


📌 这是 Agnes 实测系列的**视频篇**。图片篇见[《免费出图到底行不行？实测 Agnes AI 图片模型》](https://mp.weixin.qq.com/s/zJZcWllh9Q55UDTrHWTaBw)。
