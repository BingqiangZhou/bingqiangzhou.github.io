---
title: 【AI实测】Pollinations ltx-2 免费视频模型实测：比 Agnes 快一个量级，但有 audio/seed 两个坑
published: 2026-06-27
description: '30 条视频实测 Pollinations 网关上的 ltx-2：同步 GET 直接吐 MP4，5s 成片约 30-99s（比 Agnes 快一个量级），duration 听话、图生视频锁得住角色；两个坑——audio 假开关（false 仍带音轨）、seed 无效（同 prompt 永远同画面）；16:9 须显式传 width/height 才出（1344×768），额度按小时刷新、断点续跑。'
lang: zh
tags: [AI实测]
abbrlink: pollinations-video-realtest
---

上一篇我把 Pollinations 的六个**图片**模型用同一套 benchmark 横评了一遍（[六个免费AI文生图模型实测：zimage 不输 Agnes、还更快](https://mp.weixin.qq.com/s/whRe3h3lRuJI-EyD8WJlkQ)），结论是「统一网关真出图，zimage 质量不输 Agnes、还更快」。这一篇轮到**视频**——测它网关上的 `ltx-2`（Lightricks 2026 年 1 月放出的开源视频模型，原生主打 4K/50fps，Pollinations 把它接到统一网关上主打「快」）。

测之前我以为会像 [agnes 视频篇《免费生成视频到底行不行？实测 Agnes AI 视频模型》](https://mp.weixin.qq.com/s/Iz-CM5lG14LkjJbq2l35Iw) 那样：慢、锁不住角色、要靠图生视频兜底。真跑起来发现 ltx-2 在 Pollinations 上**快得离谱**（5 秒成片空闲约 30 秒出 ≈ 6 倍实时，繁忙时 ~100 秒 ≈ 20 倍，而 agnes 是 ~60 倍），画质也扎实，图生视频还能稳稳锁住角色。但有两个坑要注意：

- **audio 假开关**：ltx-2 恒带音频，你传 `audio=false` 它照样给你生成音轨，`audio` 参数形同虚设。
- **seed 无效**：ltx-2 完全忽略 seed，同一条 prompt 永远产出同一个画面（我本以为 `seed=-1` 是随机、能多次采样，实测 `-1/100/10000/99999` 全是同一帧）。

📌 这是 Pollinations 实测系列的**视频篇**，和 [agnes 视频篇《免费生成视频到底行不行？实测 Agnes AI 视频模型》](https://mp.weixin.qq.com/s/Iz-CM5lG14LkjJbq2l35Iw) 用同一套 benchmark 横评——题目、提示词、画幅全部对齐 agnes。只有 seed 这条对不齐：agnes 不支持 seed（每次随机），ltx-2 有 seed 参数但无效（每次相同），刚好相反，第三节专门讲。

## 太长不看

- **速度**：5s 成片实测 **28-99s**（空闲 ~30s≈6×，网关繁忙时涨到 ~99s≈20×），中位约 40-50s，整体比 agnes 的 ~60× 快一个量级。
- **duration 遵循**：请求 2/5/10s → 实际 2.04/5.04/10.04s，没踩「duration 被忽略只出 2s」的 bug。
- **画质**：多动态、运镜、水下、场景都交代得过去；**单主体物种不稳**（橘猫画得像狗，每次都这样）。
- ⚠️ **audio 假开关**：`audio=false` 仍带音轨，参数无效。
- ⚠️ **seed 无效**：ltx-2 忽略 seed，同 prompt 每次画面**完全相同**（n=5 五帧 md5 一致 + seed=-1/100/10000/99999 实测同帧）。文档说 `seed=-1` 随机，但对 ltx-2 不生效（模型本身 bug，社区已知）。
- **复现性**：和 agnes 正好相反——agnes 每次随机锁不住角色，**ltx-2 同 prompt 确定性可复现**（每次相同）。两种相反的「不可控」。
- **分辨率**：只传 `aspectRatio=16:9` 会默认出 1:1；**必须显式传 `width/height` 才出 16:9（1344×768）**，本篇全部这么跑、对齐 agnes 16:9 画幅。
- ⚠️ **额度**：按小时刷新、不滚动，本篇 30 条（n=3 场景 + n=5 复现性 + 探针 + 图生视频）跨整点断点续跑。
- **图生视频**：能用，且**忠实遵循关键帧**（比 agnes 文生视频锁得住角色），但 `image` 参数有个 key 坑（见第五节）。

## 一、先说清接口：同步 GET，不是 POST 轮询

Pollinations 的视频接口和它的图片接口一个套路——**同步 GET**，把提示词拼进 URL，响应体直接吐 MP4：

```bash
curl "https://gen.pollinations.ai/video/A%20fluffy%20orange%20cat%20walking%20on%20a%20beach?model=ltx-2&duration=5&aspectRatio=16:9&width=1920&height=1080&seed=-1" \
  -H "Authorization: Bearer $POLLINATIONS_API_KEY" -o cat.mp4
```

关键参数：

| 参数 | 说明 | 实测 |
|---|---|---|
| `model` | `ltx-2`（也支持 veo/wan/seedance/nova-reel 等） | — |
| `duration` | 视频时长（秒） | ✅ 遵循（2→2.04、5→5.04、10→10.04） |
| `aspectRatio` + `width/height` | `16:9` 需**同时传 width=1920&height=1080** | 只传 aspectRatio 出 1:1；传 width/height 出 16:9（1344×768） |
| `audio` | `true/false` | ⚠️ **无效**：false 也带音轨 |
| `seed` | 文档说 `-1`=随机 | ⚠️ **无效**：ltx-2 忽略 seed，同 prompt 永远同画面（见第三节） |
| `image` | 图生视频起始帧 URL | 见第五节（有 key 坑） |

这跟 agnes 视频的 `POST /v1/videos` + 轮询 + 从 `remixed_from_video_id` 取下载链接完全是两套。Pollinations 这套更简单：一个 GET，等几十秒，MP4 就在 body 里。代价是没有任务 id、不能异步、超时就得重发。

## 二、逐题实测（场景题 n=3，视觉复核）

和 agnes 同题、同提示词、同 n=3。每条视频用 ffmpeg 抽 50% 时长中段帧当封面；**点封面帧即可看动态**。

⚠️ 先说一个贯穿本节的发现：**ltx-2 的 seed 无效**（详见第三节），所以每题 n=3 的 3 次生成画面**完全相同**（帧 md5 一致）。n=3 在这里不是为了看波动，反而成了 seed 无效的第一个证据——3 次理应不同的采样，结果一模一样。

### 第 1 题：单主体运动 · 橘猫海滩走 — ⚠️ 场景过关，主体漂移

**提示词**：`A fluffy orange cat walking along a beach at sunset, gentle waves in the background, cinematic, slow motion`（16:9, 5s, n=3）

| run1 | run2 | run3 |
|---|---|---|
| [![单主体run1](/assets/images/2026/20260627/pollinations-video/midframes/single_subject_run1__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/single_subject_run1__ltx-2.mp4) | [![单主体run2](/assets/images/2026/20260627/pollinations-video/midframes/single_subject_run2__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/single_subject_run2__ltx-2.mp4) | [![单主体run3](/assets/images/2026/20260627/pollinations-video/midframes/single_subject_run3__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/single_subject_run3__ltx-2.mp4) |

日落海滩、海浪、一只四足动物在走，画面清晰无多肢体崩坏。n=3 三次画面完全相同，视觉模型都把这只动物看成**「疑似狗」而非橘猫**——运动和场景没问题，但**主体物种不够稳**。

### 第 2 题：复杂多动态 · 夜间城市航拍 — ✅

**提示词**：`Aerial drone shot of a busy city intersection at night, cars with headlights moving, neon signs, rain on the streets`（16:9, 5s, n=3）

| run1 | run2 | run3 |
|---|---|---|
| [![多动态run1](/assets/images/2026/20260627/pollinations-video/midframes/multi_dynamic_run1__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/multi_dynamic_run1__ltx-2.mp4) | [![多动态run2](/assets/images/2026/20260627/pollinations-video/midframes/multi_dynamic_run2__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/multi_dynamic_run2__ltx-2.mp4) | [![多动态run3](/assets/images/2026/20260627/pollinations-video/midframes/multi_dynamic_run3__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/multi_dynamic_run3__ltx-2.mp4) |

航拍夜城、街道车流、霓虹、建筑，多元素同屏协调，清晰无变形。**过关**（n=3 三次相同）。

### 第 3 题：运镜控制 · 科幻走廊推镜头 — ✅

**提示词**：`Dolly zoom shot moving forward through a long futuristic corridor with glowing blue lights, camera continuously pushing in, dramatic perspective, cinematic`（16:9, 5s, n=3）

| run1 | run2 | run3 |
|---|---|---|
| [![运镜run1](/assets/images/2026/20260627/pollinations-video/midframes/camera_motion_run1__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/camera_motion_run1__ltx-2.mp4) | [![运镜run2](/assets/images/2026/20260627/pollinations-video/midframes/camera_motion_run2__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/camera_motion_run2__ltx-2.mp4) | [![运镜run3](/assets/images/2026/20260627/pollinations-video/midframes/camera_motion_run3__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/camera_motion_run3__ltx-2.mp4) |

对称科幻走廊、蓝色灯带、纵深透视——标准 dolly 推镜头画面（n=3 三次完全相同）。中段帧只能确认场景对，镜头是否真「持续前推」点开 mp4 看。

### 第 4 题：特殊场景 · 水下海龟（流体渲染） — ✅

**提示词**：`Underwater scene, a sea turtle swimming over a coral reef, sun rays filtering through the water surface, schools of fish, cinematic, slow motion`（16:9, 5s, n=3）

| run1 | run2 | run3 |
|---|---|---|
| [![水下run1](/assets/images/2026/20260627/pollinations-video/midframes/underwater_run1__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/underwater_run1__ltx-2.mp4) | [![水下run2](/assets/images/2026/20260627/pollinations-video/midframes/underwater_run2__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/underwater_run2__ltx-2.mp4) | [![水下run3](/assets/images/2026/20260627/pollinations-video/midframes/underwater_run3__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/underwater_run3__ltx-2.mp4) |

海龟、珊瑚、鱼群、阳光光束都在，自然无变形/塑料感/多肢体，水清澈。**过关**——和 agnes 水下题结论一致（n=3 三次相同）。

## 三、复现性：seed 无效，同一条 prompt 永远相同

这一节本来想对齐 agnes 的复现性测法（agnes 是同 prompt 反复跑看一致性，每次都不同、锁不住角色）。结果跑出来一个反过来的结论：**ltx-2 同一条 prompt 跑 5 次，画面完全相同**。

### 简单场景 · 窗台橘猫看雨（n=5）

**提示词**（5 次都用同一条）：`A fluffy orange cat sitting on a windowsill watching rain outside, cozy indoor lighting, cinematic`

| run1 | run2 | run3 |
|---|---|---|
| [![窗台run1](/assets/images/2026/20260627/pollinations-video/midframes/windowsill_run1__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/windowsill_run1__ltx-2.mp4) | [![窗台run2](/assets/images/2026/20260627/pollinations-video/midframes/windowsill_run2__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/windowsill_run2__ltx-2.mp4) | [![窗台run3](/assets/images/2026/20260627/pollinations-video/midframes/windowsill_run3__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/windowsill_run3__ltx-2.mp4) |

| run4 | run5 |
|---|---|
| [![窗台run4](/assets/images/2026/20260627/pollinations-video/midframes/windowsill_run4__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/windowsill_run4__ltx-2.mp4) | [![窗台run5](/assets/images/2026/20260627/pollinations-video/midframes/windowsill_run5__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/windowsill_run5__ltx-2.mp4) |

### 复杂场景 · 夜市摊位（n=5）

**提示词**（5 次都用同一条）：`A bustling night market stall with steam rising from a food cart, warm lantern light, vendors and customers, cinematic`

| run1 | run2 | run3 |
|---|---|---|
| [![夜市run1](/assets/images/2026/20260627/pollinations-video/midframes/market_stall_run1__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/market_stall_run1__ltx-2.mp4) | [![夜市run2](/assets/images/2026/20260627/pollinations-video/midframes/market_stall_run2__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/market_stall_run2__ltx-2.mp4) | [![夜市run3](/assets/images/2026/20260627/pollinations-video/midframes/market_stall_run3__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/market_stall_run3__ltx-2.mp4) |

| run4 | run5 |
|---|---|
| [![夜市run4](/assets/images/2026/20260627/pollinations-video/midframes/market_stall_run4__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/market_stall_run4__ltx-2.mp4) | [![夜市run5](/assets/images/2026/20260627/pollinations-video/midframes/market_stall_run5__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/market_stall_run5__ltx-2.mp4) |

上面 10 张图看起来像 10 个不同画面？其实不是——**每题 5 次的封面帧 md5 完全相同**（用 ffmpeg 抽 50% 中点帧算哈希）：

| 场景 | run1 | run2 | run3 | run4 | run5 |
|---|---|---|---|---|---|
| 窗台橘猫 midframe md5 | a18e1f55 | a18e1f55 | a18e1f55 | a18e1f55 | a18e1f55 |
| 夜市摊位 midframe md5 | 0f158201 | 0f158201 | 0f158201 | 0f158201 | 0f158201 |

（视频文件的 md5 倒是各不相同——但那只是编码/容器层的随机差异，画面字节完全一样。我一开始拿视觉模型判「窗台材质每次不同」，结果它对同一张图脑补出了差异，纯幻觉。）

### 换 seed 值也没用

既然 `seed=-1` 5 次都相同，我又用同一条 prompt（橘猫海滩）分别传 `seed=-1/100/10000/99999`，抽 2.5s 帧对比：

| seed | 2.5s 帧 md5 |
|---|---|
| -1 | 7f9ba7ea |
| 100 | 7f9ba7ea |
| 10000 | 7f9ba7ea |
| 99999 | 7f9ba7ea |

四个完全不同的 seed，画面一模一样。**ltx-2 压根不理 seed 参数**。

### 这不是 Pollinations 的锅，是 ltx-2 模型本身的 bug

Pollinations [官方文档](https://zread.ai/pollinations/pollinations/17-video-generation-api)说 `seed=-1` 是随机约定、会跳过缓存——对图片模型确实生效。但对 ltx-2，社区早有「seed 被忽略」的报告：[SwarmUI #491](https://github.com/mcmonkeyprojects/SwarmUI/issues/491)（LTXV 同 seed 同参数不可复现）、[LTX-2.3 API 指南](https://wavespeed.ai/blog/posts/ltx-2-3-api-endpoints-guide/)提到「seed drift」（seed 没正确传递就被忽略）。所以 Pollinations 把 seed 传过去了，是 ltx-2 后端自己忽略了。

**结论**：和 agnes 正好反过来——agnes 不支持 seed，每次随机、锁不住角色；**ltx-2 有 seed 但无效，同 prompt 永远确定性地产出同一个画面**。两种相反的「不可控」：agnes 是「每次都不一样、想要哪版靠抽」，ltx-2 是「每次都一样、给你哪版就哪版」。要镜头连贯、角色一致的剧情，两边都得靠下一节的图生视频。

## 四、三个能力探针：duration / audio / 分辨率

### duration：遵循 ✅

同一条 prompt（夜市街道）分别请求 2/5/10 秒，ffprobe 实测（10s 那条点开看动态）：

| 2s（封面帧） | 5s（封面帧） | 10s（点开看动态） |
|---|---|---|
| ![2s](/assets/images/2026/20260627/pollinations-video/midframes/duration_probe_2s__ltx-2.png) | ![5s](/assets/images/2026/20260627/pollinations-video/midframes/duration_probe_5s__ltx-2.png) | [![10s](/assets/images/2026/20260627/pollinations-video/midframes/duration_probe_10s__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/duration_probe_10s__ltx-2.mp4) |

| 请求 | 实际 duration | 遵循? |
|---|---|---|
| 2s | 2.042s | ✅ |
| 5s | 5.042s | ✅ |
| 10s | 10.042s | ✅ |

Pollinations 有些视频模型有过「忽略 duration 只出 2s」的 bug（社区 issue #7954 类）。ltx-2 实测**没有**这个问题，请求多少给多少。

### audio：假开关 ⚠️

标定的时候就觉得不对：我请求 `audio=false`，ffprobe 却读出 AAC 音轨。于是专门做了对照——同一条 prompt（街头吉他手）分别 `audio=false` / `audio=true`（点 `audio_on` 那条能听到音轨）：

| audio_off（封面帧） | audio_on（点开听音轨） |
|---|---|
| ![audio_off](/assets/images/2026/20260627/pollinations-video/midframes/audio_off__ltx-2.png) | [![audio_on](/assets/images/2026/20260627/pollinations-video/midframes/audio_on__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/audio_on__ltx-2.mp4) |

| 开关 | 请求 audio | 实际 has_audio |
|---|---|---|
| audio_off | false | **True** |
| audio_on | true | True |

两条都带音轨。结论：**ltx-2 恒带音频，`audio` 参数无效**。你要静音视频，得拿到 mp4 后自己抠：`ffmpeg -i in.mp4 -c:v copy -an out.mp4`。

### 分辨率：传 width/height 才出 16:9（1344×768）

ltx-2 在 Pollinations 上有个分辨率坑：**只传 `aspectRatio=16:9` 不够，它默认出 1:1（1024×1024）**；必须显式传 `width=1920&height=1080` 才出 16:9，且网关把 16:9 映射到 **1344×768** 这个 tier（不是 1920×1080，但画幅对了）。所以本篇所有视频都显式传 width/height 跑成 16:9（和 agnes 的 16:9 对齐）。agnes 视频是真 1920×1080，Pollinations 这边 16:9 只到 1344×768——画幅对齐、分辨率差一档。ltx-2 原生 4K/50fps 在网关上拿不到（官方 issue #6966：speed over resolution）。

## 五、图生视频：能用，且锁得住角色（但有个 key 坑）

agnes 视频篇的结论是「文生视频锁不住角色，必须靠图生视频兜底」。ltx-2 的 `image` 参数（首帧锁定）效果如何？3 个场景，左 flux 关键帧、右 ltx-2 视频中段帧（点右边看动态）：

| 场景 | 关键帧(flux) | 视频中段帧（点开看动态） |
|---|---|---|
| 地铁青年 | ![kf_man](/assets/images/2026/20260627/pollinations-video/keyframes/i2v_man__kf.png) | [![i2v_man](/assets/images/2026/20260627/pollinations-video/midframes/i2v_man__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/i2v_man__ltx-2.mp4) |
| 窗台橘猫 | ![kf_cat](/assets/images/2026/20260627/pollinations-video/keyframes/i2v_cat__kf.png) | [![i2v_cat](/assets/images/2026/20260627/pollinations-video/midframes/i2v_cat__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/i2v_cat__ltx-2.mp4) |
| 小笼包 | ![kf_food](/assets/images/2026/20260627/pollinations-video/keyframes/i2v_food__kf.png) | [![i2v_food](/assets/images/2026/20260627/pollinations-video/midframes/i2v_food__ltx-2.png)](/assets/images/2026/20260627/pollinations-video/videos/i2v_food__ltx-2.mp4) |

**三场景全部忠实遵循关键帧**（同一主体、同一场景、关键元素高度匹配）——这点比 agnes 文生视频锁得住角色。但有个 **API 坑**要注意：

图生视频的 `image` 参数必须是**视频服务端能 fetch 的图片 URL**。我一开始直接用 flux 生成的 `gen.pollinations.ai/image/{prompt}?...`（生成端点）当 image，三场景全 `400 Invalid image request: Failed to fetch image`。原因：视频服务端不带 key 去 fetch 那个生成端点时被 401 拦截、或撞上冷生成超时。**解法：image URL 里带上 key**（`...&key=<sk_...>`），三场景立刻全过。

（Pollinations 没有原生 `/upload` 端点拿静态直链，404；所以只能把 key 拼进 image URL。注意这样 key 会进请求，别把带 key 的 URL 提交进 git。）

## 六、耗时与额度：~8 倍定律 + pollen 按 tier 发

### 耗时：~6-20× 实时（负载敏感）

| 成片时长 | 真生成耗时 | 倍数 |
|---|---|---|
| 2s | 17-19s | ~8-9× |
| 5s | 28-99s（空闲 ~30s，繁忙 ~99s） | ~6-20× |
| 10s | 84s | ~8× |

5s 成片的耗时跨度很大（28s 到 99s），明显**随网关负载波动**：空闲时 ~30s（~6×），繁忙时接近 100s（~20×），中位约 40-50s。即使取最慢的 ~20×，也比 agnes 的 ~60× 快。这跟 Pollinations 接 ltx-2 的定位一致（官方 issue #6966：speed & efficiency over resolution）。

### 额度：pollen 计费，按 tier 发 + 断点续跑

本篇最掣肘的地方。额度按 pollen 计、撞满就回 `402 Payment Required`（余额耗尽）。视频比图片贵太多（图片 ~0.001-0.05 pollen/张，视频 ~0.005 pollen/秒 → 5s 约 0.025 pollen）。

**每个 tier 一个刷新周期能生成多少秒 ltx-2 视频**（ltx-2 = 0.005 pollen/秒，一条 5s ≈ 0.025 pollen；tier 定义来自官方 [POLLEN_FAQ](https://github.com/pollinations/pollinations/blob/master/enter.pollinations.ai/POLLEN_FAQ.md)）：

| tier | pollen | ltx-2 视频 | 怎么达到 |
|------|--------|-----------|---------|
| 🍄 Spore | 0.01/小时 | **2 秒/小时**（买不起一条 5s ⚠️）| 注册即默认 |
| 🌱 Seed | 0.15/小时 | **30 秒/小时**（≈ 6 条 5s）| 自动：账号年龄 + GitHub 活跃（官方说约 2 周，实测更快）|
| 🌸 Flower | 10/天 | **2000 秒/天**（≈ 400 条 5s）| 在 [pollinations.ai/Apps](https://pollinations.ai/Apps) 发布一个 app |
| 🍯 Nectar | 20/天 | **4000 秒/天**（≈ 800 条 5s）| 重大贡献（预告中）|

⚠️ Spore/Seed 按小时发、**不累积**（没用完的小时额度作废）——Spore 单小时才 2 秒，连一条 5s 都买不起；要跑视频至少得 Seed 档（30 秒/小时 ≈ 6 条 5s）。Flower/Nectar 是每天一整坨、额度内随便花。也能直接买 pollen（$1 = 1 pollen）。

**我的账号就是 Seed 档**（免费——账号年龄 + GitHub 活跃就自动升上来，不用花钱；官方说约 2 周，但我注册第二天就升了），所以本篇是纯白嫖跑的：单小时 0.15 pollen ≈ 6 条 5s 视频，30 条（≈ 0.75 pollen）得跨好几个整点断点续跑才凑齐。

实际影响：本篇 30 条（场景题 n=3 + 复现性 n=5 + duration/audio 探针 + 图生视频×3）是跨整点断点续跑跑完的——遇到 402 就停、下个整点刷新后自动续（断点续跑不重花额度）。`balance` 端点返回 403，没法预知余额，只能跑到 402 为止。

想自己跑：把额度当稀缺资源，按花费升序铺任务、402 即停、等下个整点续。

## 七、和 Agnes 视频同题横评

| 维度 | Pollinations ltx-2 | Agnes 视频 |
|---|---|---|
| 速度 | ~6-20× 实时（中位 ~8×） | ~60× 实时 |
| duration 控制 | ✅ 遵循（秒） | ✅（8n+1 帧） |
| 音频 | 恒带（`audio` 参数无效） | 无 |
| seed | ⚠️ 参数存在但无效（确定性） | 不支持（每次随机） |
| 复现性 | 同 prompt 每次画面**完全相同** | 每次随机、锁不住角色 |
| 图生视频 | ✅ 遵循关键帧（有 key 坑） | ✅ 首帧锁定 |
| 分辨率 | 1344×768（16:9，需传 width/height）| 1920×1080（16:9）|
| 免费额度 | 按小时刷新、断点续跑 | 较充裕 |
| 调用方式 | 同步 GET（简单） | 异步 POST+轮询 |

横评一句话：**要快、要确定性可复现（同 prompt 永远同画面）、能接受 1344×768 + audio 假开关 + seed 无效，用 Pollinations ltx-2；要真随机多样性、真 1080p 和更细的调度控制，还是 agnes 那种异步管线。**

## 八、总结：到底什么水平，免费用在哪

**到底什么水平**：ltx-2 在 Pollinations 上是「**快 + 画质够用 + 两个坑**」的水平。速度碾压 agnes，duration 听话，多动态/运镜/水下/场景都能交差，图生视频还能稳锁角色。两个坑是 `audio` 假开关和 `seed` 无效——尤其 seed 无效导致它**同 prompt 确定性输出**（每次相同），和 agnes（每次随机）正好相反。短板还有单主体偶有物种漂移、16:9 只到 1344×768。

**怎么选 / 免费用在哪**：
- ✅ 适合：快速出 B-roll 素材、动态背景、概念演示、配图动起来的轻量场景；要镜头连贯靠图生视频；要可复现（同 prompt 永远同画面）反而是优点。
- ❌ 不适合：要真 1080p/4K、要静音（得后处理抠音轨）、要「同 prompt 多样采样」（seed 无效，只能改 prompt 换结果）。
- 避坑清单：① 16:9 必须显式传 width/height（否则出 1:1）；② 别指望 `audio=false`；③ 别指望换 seed 能换结果（ltx-2 忽略 seed，要多样得改 prompt）；④ 图生视频的 image URL 带上 key；⑤ 额度按小时刷新，402 即停、等下个整点续。

**关于「免费」本身**：免费是好东西，别全指望它——额度按小时刷新、不滚动，视频尤其吃额度（本篇 30 条跨整点跑完），关键任务留个付费后路。政策也随时可能变（ltx-2 接入还比较新，官方明说 beta 无 SLA）。


📚 **本系列其它实测**（按发布时间）：

1. Agnes 图片篇：《[免费出图到底行不行？实测 Agnes AI 图片模型](https://mp.weixin.qq.com/s/zJZcWllh9Q55UDTrHWTaBw)》
2. Agnes 视频篇：《[免费生成视频到底行不行？实测 Agnes AI 视频模型](https://mp.weixin.qq.com/s/Iz-CM5lG14LkjJbq2l35Iw)》
3. 智谱：《[智谱免费的图片和视频 API 到底行不行？一篇实测讲透](https://mp.weixin.qq.com/s/kYvqxezhVQqMv0hq_E7RuQ)》
4. Pollinations 图像篇：《[Pollinations 六个免费AI文生图模型实测：zimage 不输 Agnes、还更快](https://mp.weixin.qq.com/s/whRe3h3lRuJI-EyD8WJlkQ)》

