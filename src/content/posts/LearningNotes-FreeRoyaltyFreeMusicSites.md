---
title: 【学习笔记】免费下载现成免版权音乐的平台盘点 + 使用与 API 指南（2026）
published: 2026-06-29
description: 盘点可免费下载、多数可商用的免版权音乐平台（Pixabay Music、YouTube 音频库、Mixkit、Freesound、Jamendo、FMA 等，含国内淘声网/耳聆网），讲清 CC0/CC-BY/NC 与 Content ID 概念，给出从搜索下载到署名的使用流程，以及通过 API key 调用 Freesound、Jamendo 批量获取的代码示例
lang: zh
tags: [学习笔记]
abbrlink: royalty-free-music-sites
---

> 整理日期：2026-06-29
> 定位：面向需要 BGM / 配乐的内容创作者，盘点「免费 + 可商用」的现成音乐平台，并讲清怎么用、怎么调 API
> 说明：本笔记关键信息均标注来源；各平台授权政策可能变动，正式商用前请以官网最新条款为准。

<!--
## 目录
- [一、为什么需要「免版权音乐」](#一为什么需要免版权音乐)
- [二、国际主流平台（全免费）](#二国际主流平台全免费)
- [三、国内可用平台（免翻墙，全免费）](#三国内可用平台免翻墙全免费)
- [四、如何使用：从搜索到下载到署名](#四如何使用从搜索到下载到署名)
- [五、进阶：通过 API 批量获取](#五进阶通过-api-批量获取)
- [六、选库建议](#六选库建议)
- [七、参考资料](#七参考资料)
-->

## 一、为什么需要「免版权音乐」

做视频、播客、自媒体，最怕的就是配乐踩版权雷——轻则被 Content ID 索赔、限流，重则下架。比起自己用 AI 从零生成（那是[另一篇《AI 音乐生成全景》](/posts/ai-music-generation-survey/)的话题），**直接去免版权音乐库挑现成的**往往更快、更稳：风格现成、版权清晰、拿来即用。

但「免版权」三个字的水很深：CC0、CC-BY、CC-BY-NC、免版税、Content ID 白名单……这些词含义差别巨大，选错一样踩雷。先把概念理清。

### 三个必须看懂的概念

- **CC0**：作者完全放弃版权，可自由商用、无需署名——最干净、最省心。
- **CC-BY**：可商用，但**必须署名**原作者（在视频简介 / 说明里给出 credit）。
- **CC-BY-NC**：**NC = NonCommercial，不可商用**——做会分发或变现的内容请避开。
- **「免版税（royalty-free）」≠「免费」也 ≠「免版权」**：通常指一次性获得授权后，不用再按播放次数付费，但可能仍需购买、署名或遵守平台条款。
- **Content ID / 白名单**：YouTube 等平台的自动版权检测系统。即使你持有合法授权，如果曲子没进平台的白名单，仍可能被误判索赔；所以「能在 YouTube 自动清权（whitelisting）」是实打实的加分项。

> 一句总原则：**下载前务必逐曲核对授权标注**，尤其避开 CC-BY-NC；"免版税"不等于"免费"也不等于"免版权"。

> 来源：[YouTube 帮助 - 音频库授权说明](https://support.google.com/youtube/answer/3376882) · [12 Best Free Royalty-Free Music Sites 2026 (Swarmify)](https://swarmify.com/blog/free-music-for-your-videos-the-importance-and-where-to-find/) · [Best Free Music for YouTube 2026 (HowWorks)](https://howworks.ai/blog/best-free-music-for-youtube-videos-2026)

---

## 二、国际主流平台（全免费）

| 平台 | 曲库量 | 授权类型 | 能商用？ | 要署名？ | 关键点 |
|---|---|---|---|---|---|
| **Pixabay Music** | 数万 | Pixabay 许可（CC0 式） | ✅ | ❌ 免署名 | 最省心：注册都不用、可直接商用、不署名；⚠️ **无音乐 API**（官方 API 只覆盖图/视频）；无 Content ID 白名单，YouTube 上偶有误判 |
| **YouTube 音频库** | ~5 千 | 平台许可（部分 CC） | ✅（在 YouTube） | 部分需要 | YouTube 创作者首选：不会被 Content ID 索赔、可开通收益；主要针对 YouTube，跨平台可能被误判；无下载 API |
| **Mixkit** | ~1 千 | Mixkit Free License | ✅ | ❌ 免署名 | 免账号、可商用免署名；但条款**排除** CD/DVD、游戏、广播电视；无 API |
| **Uppbeat** | ~1.5 万 | 免费版需署名 | ✅ | 免费版要 | 人工制作、质量高；**免费版每月 3 次下载 + 署名**，已够多数人用 |
| **Bensound** | 数百~2 千 | 免费版需署名 | ✅ | 免费版要 | 老牌、单一作曲家、制作精良，企业 / 讲解视频常用；免费版需署名；无 API |
| **Free Music Archive (FMA)** | ~18 万 | **逐曲不同**（CC-BY / CC0 / NC 等） | 逐曲看 | 多数要 | 经典独立音乐库，曲子多但**必须逐首核对授权**，注意避开 NC |
| **Freesound**（freesound.org） | 约 60 万 | CC 协议（逐曲） | 逐曲看 | 多数要 | 🛠️ **有成熟免费 API**（见第五节）；偏音效/短素材，也有音乐 loop；下载原文件需 OAuth2 |
| **Jamendo** | 约 60 万 | CC 协议（免费个人/非商用；商用需授权） | 个人非商用 ✅ | 多数要 | 🛠️ **有免费 API**（见第五节）；以完整带唱歌曲为主；商用需另购授权 |
| **Musopen** | ~1.5 万 | 公有领域 / 部分录音受限 | ✅ | 公有领域免署名 | 古典乐 / 教育向；乐谱作品多属公有领域免署名，现代演奏录音可能受限；有 API |
| **Incompetech**（Kevin MacLeod） | 数千 | CC-BY 4.0 | ✅ | ✅ 要署名 | 游戏视频 BGM 元老；署名即可免费用 |

> 说明：Uppbeat、Bensound 都有付费档（免署名 / 解锁广播电视权），但**它们的免费版本身就够用**，本篇只列免费能用的部分。Epidemic Sound、Artlist 等是纯付费高质量库，不在「免费」范围内，预算充足可另行了解。

> 来源：[Pixabay Music](https://pixabay.com/music/) · [Pixabay API 文档](https://pixabay.com/api/docs/) · [Mixkit](https://mixkit.co/) · [Uppbeat](https://uppbeat.io/) · [Bensound](https://www.bensound.com/) · [FMA](https://freemusicarchive.org/) · [Freesound](https://freesound.org/) · [Jamendo](https://www.jamendo.com/) · [Musopen](https://musopen.org/) · [Incompetech](https://incompetech.com/)

---

## 三、国内可用平台（免翻墙，全免费）

| 平台 | 定位 | 授权 | 说明 |
|---|---|---|---|
| **淘声网** tosound.com | 声音素材**聚合搜索引擎** | 逐曲标注 CC0 / CC-BY | 汇集国内外多平台资源，**认准 CC0 标**即可商用免署名 |
| **耳聆网** ear0.com | 国内声音分享社区 | CC 协议（逐曲） | 录音师 / 爱好者上传，需逐曲核对协议 |
| **FREESOUND 飞声** freesound.cn | 无版权音乐库 | 免费可商用 BGM | 主打可直接商用的 BGM |
| **爱给网** aigei.com | 综合素材站 | 免费 / 付费混合 | 量大，注意区分免费与付费素材 |

> ⚠️ 注意区分：这里的 **「FREESOUND 飞声 freesound.cn」是国内站点**，和拥有成熟 API 的**国际 Freesound（freesound.org，见第二节、第五节）不是同一个**，别混淆。

> 来源：[淘声网](https://www.tosound.com/) · [耳聆网](https://www.ear0.com/) · [少数派 - 8 个免费免版权音频素材网站](https://sspai.com/post/94992)

---

## 四、如何使用：从搜索到下载到署名

不管用哪个平台，流程都差不多，关键是**把授权这一步做扎实**。

### 4.1 通用五步流程

1. **先定需求**：商用吗？能接受署名吗？主要发哪个平台（YouTube/抖音/B 站）？——这一步直接决定你能用哪几类授权。
2. **进库搜索 + 筛选**：按风格（mood / genre）、时长、**授权类型**过滤。能用 CC0 / 免署名的优先，省去后续麻烦。
3. **试听 → 下载**：注意格式与码率（配乐 MP3 128kbps 起步够用，要高质量找 WAV/FLAC）。
4. **按授权署名**：CC-BY / 部分 YouTube 音频库曲目**必须**在简介里给出 credit；CC0、Pixabay、Mixkit 免署名（给了更好）。
5. **（YouTube 等）加白名单**：把你的频道加进平台的白名单，避免 Content ID 误判索赔（Uppbeat、Epidemic 等提供此功能）。

### 4.2 各平台速查

- **Pixabay Music**：`pixabay.com/music` → 搜关键词 → 直接点下载，**不注册、不署名**。
- **YouTube 音频库**：进 YouTube Studio →「音频库」，在筛选里勾「**不需要署名**」挑曲，下载 MP3；勾到 CC 的曲子要在简介署名。
- **Mixkit**：`mixkit.co/free-stock-music` → 免账号直接下载、免署名；注意别用于游戏/广播。
- **Bensound**：免费版下载后，按曲库页给出的**署名格式**复制到视频简介。
- **Uppbeat**：注册免费账号（每月 3 次下载），下载时复制它给的 **Uppbeat Credit** 署名文本贴到简介。
- **FMA / Freesound / Jamendo**：**逐曲看授权图标**——认 CC0 或 CC-BY，**避开 CC-BY-NC**。

---

## 五、进阶：通过 API 批量获取

如果你想把「找曲 → 下载」自动化（比如批量给视频配 BGM、搭一个选曲工具），就需要 API。**先说一个避坑点**：

> 大多数下载平台**没有公开的音乐 API**——Pixabay Music、YouTube 音频库、Mixkit、Bensound、Uppbeat、Incompetech 都只能网页手动下载。尤其注意：**Pixabay 的官方 API 只覆盖图片和视频，不含音乐**。
>
> 真正有成熟、免费 API 的，主要是 **Freesound（freesound.org）** 和 **Jamendo**；**Musopen** 也有 API（古典公有领域）。下面以这两家为例。

### 5.1 Freesound API（token 认证，最简单）

**怎么拿 key**：注册 [freesound.org](https://freesound.org/) 账号 → 到 <https://freesound.org/apiv2/apply> 申请一个 API credential，立刻拿到 **api key**。

**怎么用**：把 `token=你的key` 作为 GET 参数加到每个请求即可，无需 OAuth。

```bash
# 文本搜索：lo-fi 风格的短素材
curl "https://freesound.org/apiv2/search/text/?query=lo-fi&token=YOUR_API_KEY"
```

```python
import requests

TOKEN = "你的 Freesound api key"   # freesound.org/apiv2/apply 申请

# 文本搜索 + 直接拿到预览音频直链
r = requests.get(
    "https://freesound.org/apiv2/search/text/",
    params={
        "query": "lo-fi",
        "token": TOKEN,
        "fields": "id,name,previews,license",   # 只要这几个字段，省流量
        "page_size": 5,
    },
)
for s in r.json()["results"]:
    preview = s["previews"]["preview-lq-mp3"]   # 预览版 mp3 直链（token 即可下载）
    print(s["name"], "|", s["license"], "|", preview)
    # mp3 = requests.get(preview).content      # 拿到后可直接写入文件
```

> ⚠️ 注意：**下载原始高质量文件（原格式 WAV/FLAC 等）需要 OAuth2 认证**；上面这种 token 模式只能拿到**预览版 mp3/ogg 直链**——对做配乐已经够用。OAuth2 流程见 [Freesound 认证文档](https://freesound.org/docs/api/authentication.html)。

> 来源：[Freesound API 文档](https://freesound.org/docs/api/) · [认证](https://freesound.org/docs/api/authentication.html) · [资源列表](https://freesound.org/docs/api/resources_apiv2.html)

### 5.2 Jamendo API（client_id 认证）

**怎么拿 key**：到 [developer.jamendo.com](https://developer.jamendo.com/) 注册一个应用，拿到 **client_id**。

**怎么用**：公共查询只需把 `client_id` 带上即可（只有「用户级」操作如收藏、登录才需要 OAuth2）。

```bash
# 搜索 chill 风格、按热度排序、取 5 首
curl "https://api.jamendo.com/v3.0/tracks/?client_id=YOUR_CLIENT_ID&format=json&search=chill&limit=5&order=popularity_total"
```

```python
import requests

r = requests.get(
    "https://api.jamendo.com/v3.0/tracks/",
    params={
        "client_id": "你的 client_id",          # developer.jamendo.com 注册应用获取
        "format": "json",
        "search": "chill",
        "limit": 5,
        "order": "popularity_total",
    },
)
for t in r.json()["results"]:
    # audio 字段就是可下载的 mp3 直链；license_ccurl 是该曲的 CC 授权链接
    print(t["name"], "-", t["artist_name"], "|", t["audio"], "|", t.get("license_ccurl"))
    # mp3 = requests.get(t["audio"]).content
```

> ⚠️ 注意：Jamendo **免费仅限个人 / 非商用**，商用需另购授权；非商用 App 每月有约 35,000 次请求额度。每首的授权以返回的 `license_ccurl` 为准，注意避开 NC。

> 来源：[Jamendo API 文档](https://developer.jamendo.com/v3.0/docs) · [tracks 方法](https://developer.jamendo.com/v3.0/tracks)

### 5.3 API 选型一句话

- 要**音效 / 短素材**、token 即可上手 → **Freesound**。
- 要**完整带唱歌曲**、带艺术家与专辑信息 → **Jamendo**。
- 要**古典公有领域** → **Musopen API**（[文档](https://musopen.org/about/api/)）。

---

## 六、选库建议

- **最快省心、要直接商用免署名** → **Pixabay Music**（CC0 式、不注册、不署名）。
- **主要发 YouTube** → **YouTube 音频库**（Content ID 保险、可收益）。
- **要更高质量、能接受署名** → **Uppbeat / Bensound 免费版**（每月有限次或需署名）。
- **古典乐 / 配乐** → **Musopen**（公有领域）。
- **国内免翻墙** → **淘声网**（认准 CC0）/ **耳聆网**。
- **想把找曲下载自动化** → **Freesound / Jamendo 的 API**（见第五节）。
- 一句老话：**下载前务必逐曲核对授权标注**，尤其避开 CC-BY-NC；"免版税"不等于"免费"也不等于"免版权"。

---

## 七、参考资料

**平台官方**

- [Pixabay Music](https://pixabay.com/music/) · [Pixabay API 文档（仅图/视频，不含音乐）](https://pixabay.com/api/docs/) · [YouTube 音频库帮助](https://support.google.com/youtube/answer/3376882) · [Mixkit](https://mixkit.co/)
- [Uppbeat](https://uppbeat.io/) · [Bensound](https://www.bensound.com/) · [Free Music Archive](https://freemusicarchive.org/) · [Incompetech](https://incompetech.com/)
- [Freesound](https://freesound.org/) · [Jamendo](https://www.jamendo.com/) · [Musopen](https://musopen.org/)
- [淘声网](https://www.tosound.com/) · [耳聆网](https://www.ear0.com/)

**API 文档**

- [Freesound API 文档](https://freesound.org/docs/api/)（[认证](https://freesound.org/docs/api/authentication.html) · [资源](https://freesound.org/docs/api/resources_apiv2.html)）
- [Jamendo API 文档](https://developer.jamendo.com/v3.0/docs)（[tracks](https://developer.jamendo.com/v3.0/tracks)）

**对比与评测**

- [12 Best Free Royalty-Free Music Sites for Video 2026 (Swarmify)](https://swarmify.com/blog/free-music-for-your-videos-the-importance-and-where-to-find/)
- [Best Free Music for YouTube Videos 2026 (HowWorks)](https://howworks.ai/blog/best-free-music-for-youtube-videos-2026)
- [Best Royalty-Free Music for YouTube: 8 Libraries Compared (ThumbMentor)](https://thumbmentor.com/en/blog/best-royalty-free-music-youtube)
- [少数派 - 8 个免费、免版权、可商用的音频素材网站](https://sspai.com/post/94992)

**相关笔记**

- [AI 音乐生成全景：免费、版权与开源 SOTA（2026）](/posts/ai-music-generation-survey/) —— 想要独一无二、可定制的音乐时，看这篇用 AI 自己生成。
