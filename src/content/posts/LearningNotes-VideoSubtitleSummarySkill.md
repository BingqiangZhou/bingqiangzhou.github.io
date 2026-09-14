---
title: 【学习笔记】video-to-subtitle-summary-skill 全拆解：短视频转字幕与 AI 总结的 Agent Skill 实现细节
published: 2026-09-14
description: video-to-subtitle-summary-skill 是 GitHub 上 196 star 的 Claude Code / Codex 通用 Agent Skill（作者 imlewc，MIT 协议，2026-02 至 2026-07 共 18 次提交），输入抖音/小红书/B站/YouTube 链接或本地音视频文件，输出 SRT 字幕、纯文本和 AI 总结。它的架构是「一份 SKILL.md 运行手册 + 五个纯标准库 Python 脚本」：模糊的路由决策、平台识别、回退判断写进手册交给 Agent 执行，确定性的下载、VTT 转 SRT、 Whisper 转写、镜像测速安装沉到脚本里。本文逐个功能拆实现：候选直链逐个试错的下载器、yt-dlp 字幕直抓加手写 VTT 解析器、faster-whisper 的 device/compute_type 解析链、五镜像测速安装器、火山引擎 VC 的轮询转写，以及藏在 docs/plans 里的一份开发计划自曝的商业闭环——默认解析代理 top9.cc（AI Douyin）就是作者自家的积分制收费服务。
lang: zh
tags: [学习笔记, Claude Code, Agent Skill, Agent]
abbrlink: video-subtitle-summary-skill
---

之前拆过 ZCode 官方的 [video-agent-kit](/posts/zcode-video-agent-kit/)（用 Agent **做视频**），这次换个方向，拆一个用 Agent**看懂视频**的 skill：[video-to-subtitle-summary-skill](https://github.com/imlewc/video-to-subtitle-summary-skill)。它做的事情一句话就能说清——丢给它一个抖音/小红书/B站/YouTube 链接或者本地音视频文件，它把视频变成 `subtitle.srt` + `text.txt`，再给你一份 AI 总结（标题、摘要、要点）。

仓库不大：MIT 协议，作者 imlewc，2026-09-14 查看时 196 star / 19 fork，2026-02-19 第一次提交到 2026-07-19 最后一次提交共 18 个 commit。但完成度相当高——README、英文 README、四份配置教程、五个脚本、五个一一对应的测试文件，还有一个意外收获：`docs/plans/` 目录里留了一份完整的商业化改造计划，把作者自己的生意讲得明明白白（后面细说）。

> **一句话定位**：这是一份写给 Agent 看的「视频转文字流水线运行手册」——SKILL.md 里用 bash + curl + jq 写清楚每一步怎么走、失败了怎么回退，五个 Python 脚本负责其中不适合让模型临场发挥的确定性环节（下载重试、格式转换、本地转写、环境安装）。智能体负责当「操作员」，脚本负责当「机床」。

## 整体架构：一份运行手册 + 五个标准库脚本

先看项目结构，全仓库的有效代码就这些：

```text
video-to-subtitle-summary/
├── SKILL.md                      # Skill 本体：6 大步骤的运行手册
├── .env.example                  # 环境变量模板
├── scripts/
│   ├── download_video_candidates.py    # 候选直链下载器
│   ├── download_youtube_subtitles.py   # YouTube 字幕直抓 + VTT 转 SRT
│   ├── install_faster_whisper.py       # 镜像测速 + 独立 venv 安装器
│   ├── list_ai_douyin_tasks.py         # AI Douyin 历史任务查询
│   └── transcribe_faster_whisper.py    # 本地 Whisper 转写
├── tests/                        # 五个一一对应的单测
└── docs/                         # 四份配置教程 + 一份开发计划
```

这个结构背后有一条清晰的分工原则，值得所有写 Agent Skill 的人抄作业：

- **模糊决策进手册**：输入是哪个平台？要不要走视频解析代理？直链拿不到要不要回退 yt-dlp？总结的标题起得好不好？这些需要「判断」的环节，全部写成 SKILL.md 里的自然语言步骤 + bash 片段，由 Claude/Codex 临场执行。
- **确定性操作进脚本**：逐个候选 URL 试错下载、VTT 时间轴解析、Whisper 的 device/compute type 选择、PyPI 镜像测速——这些有明确对错、需要可测试可复现的环节，沉到 Python 脚本里，还配了离线单测。
- **脚本只依赖 Python 标准库**：五个脚本通篇 `urllib.request` 而不是 requests，`.env` 解析是手写的二十行函数而不是 python-dotenv。好处是任何装了 Python 3.9+ 的机器拿来就能跑，安装器唯一要装的就是 faster-whisper 本体。

SKILL.md 的 frontmatter 也很讲究：`description` 字段把触发条件写成了域名和扩展名清单（`v.douyin.com`、`xhslink.com`、`b23.tv`、`.mp4/.mp3/.wav`……），这是给 Agent 的技能路由看的——用户消息里出现这些特征串，技能就该被激活。`args` 字段声明了唯一必填参数（视频链接或文件路径），支持 `/video-to-subtitle-summary <url>` 这种显式调用，也支持直接发一句「帮我总结这个视频」。

正文部分是一台显式状态机，步骤编号是 0 → 0.5 → 0.6 → 1 → 1.5 → 2 → 3 → 4 → 5——这种带小数的编号本身就是演化痕迹：0.5 和 0.6 是后来插入的「读后端配置」和「环境预检」，作者宁可加小数点也不重排编号，避免外部引用失效。

## 功能一：输入路由与依赖预检

步骤 0 做模式判定，逻辑是纯域名/扩展名匹配：

- **在线视频模式**：`douyin.com`/`tiktok.com` → 抖音系；`xiaohongshu.com`/`xhslink.com` → 小红书；`bilibili.com`/`b23.tv` → B站；`youtube.com`/`youtu.be` → YouTube
- **本地文件模式**：视频扩展名（`.mp4/.mov/.mkv` 等）从步骤 3（提音频）开始；音频扩展名（`.mp3/.wav/.m4a` 等）直接跳到步骤 4（转写），连 ffmpeg 都不需要

步骤 0.5 和 0.6 是整份手册里最有「工程味」的部分。配置读取实现得很务实——优先读 skill 目录下的 `.env` 文件（`grep + cut + tr` 三件套），没有 `.env` 再回落到进程环境变量，两种方式用户任选：

```bash
read_env() {
  local key="$1"
  if [ -f "$ENV_FILE" ]; then
    grep "^${key}=" "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'"
  else
    printenv "$key"
  fi
}
```

预检脚本按「当前模式 × 当前后端」动态裁剪检查项，而不是把所有依赖一次查全：YouTube 模式不查 API Key；本地音频不查 ffmpeg；`faster-whisper` 后端要真的用 venv 里的 Python `import faster_whisper` 成功才算过（「装了」和「能用」是两回事，这点和 video-agent-kit 的环境体检哲学一致）；火山后端则查 Token 和 AppID。缺什么就打印一条带补救指引的 ERROR 退出，比如提示运行安装脚本或去看对应教程文档。

还有一个细节：`FW_PYTHON` 的解析是一条三级链——环境变量显式指定 → 安装器创建的默认 venv（`~/.cache/video-to-subtitle-summary/faster-whisper-venv/bin/python`）→ 系统 `python3`。这保证了「装完就能用，高级用户可覆盖」。

## 功能二：视频解析——AI Douyin 默认、TikHub 可选

抖音/小红书/B站的视频没有公开直链，需要第三方解析服务把分享链接换成可下载的 mp4 地址。skill 用 `VIDEO_INFO_PROVIDER` 环境变量在两个供应商之间切换。

**默认方案 AI Douyin**（`https://top9.cc`）：一个 POST 搞定——

```bash
curl -sS -X POST "https://top9.cc/api/v1/video/download-url" \
  -H "X-API-Key: $AI_DOUYIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://v.douyin.com/xxxxxx/"}'
```

返回体里有四个关键字段：`download_url`（首选直链）、`download_urls`（候选列表）、`extracted_url`（标准化后的原始链接）、`cost`（本次扣的积分）。计费语义明确：**成功解析出直链扣 1 积分，失败不扣**；余额不足返回 HTTP 402（`insufficient balance`），Key 无效返回 401。SKILL.md 对这两个状态码各有专门的错误提示文案。代码还兼容用户把 `AI_DOUYIN_API_BASE` 配成带或不带 `/api/v1` 后缀的两种写法。

**可选方案 TikHub**：用用户自己的 Token 直连 TikHub 的三个平台接口（抖音 `hybrid/video_data`、小红书 `get_note_info_v7`、B站 `fetch_one_video_v3`），用 jq 从响应里提字段，抖音优先取无水印地址（`nwm_video_url`）。B站如果解析不到直链，还有一层兜底：直接用 yt-dlp 下载。

注意架构上的不对称：**YouTube 完全不走解析代理**，直接进字幕直抓流程，零 API 费用。这是整条链路里最省钱的一条分支。

## 功能三：候选直链下载器

`download_video_candidates.py` 解决的是短视频直链「拿到手也未必能下」的现实问题——CDN 直链经常有时效性、地域限制或 Referer 校验。实现策略简单粗暴但有效：

1. 从解析响应里把 `download_urls` 列表和 `download_url` 单值合并、去重，得到有序候选列表；
2. 逐个尝试：带 Chrome UA 发请求，流式按 1MB 块写盘，先写 `.part` 临时文件，全部写完再原子 `replace` 成正式文件——中途失败不会留下半截视频被误当成品；
3. 某个候选失败就删掉 `.part` 换下一个，每个失败原因都记下来；
4. 全军覆没时抛出聚合错误（`all download URL candidates failed: 1: timeout; 2: HTTP 403...`），成功时输出 JSON，标注选中了第几个候选、来自哪个域名。

错误信息的组织方式是为 Agent 设计的：Agent 拿到聚合错误可以直接转述给用户，拿到 JSON 可以继续走下一步。日志里打印的是 `Trying candidate 1: aweme.snssdk.com.mp4` 这种「域名+扩展名」缩写而不是完整带签名参数的 URL，避免了长直链刷屏和 token 泄露到上下文。

## 功能四：YouTube 字幕直抓

这是全仓库我最喜欢的一个功能，因为它体现了「能不跑 ASR 就不跑 ASR」的成本意识。很多视频（尤其知识区）本身就带人工字幕或平台自动字幕，直接抓下来比 Whisper 转写又快又准又免费。

`download_youtube_subtitles.py` 的下载部分就是包了一层 yt-dlp 参数：

```bash
yt-dlp --ignore-config --skip-download \
  --write-subs --write-auto-subs \
  --sub-format vtt \
  --sub-langs zh-Hans,zh-Hant,zh,en \
  -o subtitle <url>
```

`--skip-download` 保证绝不碰视频本体，人工字幕和自动字幕都要，语言优先级中英四档。真正有含金量的是后面**手写的 VTT 解析器**——没有引入 pycaption 之类的库，一百行纯标准库搞定 VTT → SRT/纯文本转换：

- 用正则匹配 `HH:MM:SS.mmm --> HH:MM:SS.mmm` 时间轴行（VTT 特有的点号毫秒），遇到 `NOTE`/`STYLE`/`REGION` 块直接跳过；
- 文本清洗三连：正则剥掉 `<c>` 这类内联标签、`html.unescape` 还原实体、空白归一化；
- 时间戳点号换逗号就是 SRT 格式，逐 cue 编号输出 `subtitle.srt`，全部文本用空格拼接输出 `text.txt`——两个下游产物（人看的字幕、模型看的正文）一次生成。

如果视频没有任何可抓字幕，才回退到「下载音频 + ASR 转写」的完整链路。

## 功能五：本地转写 faster-whisper

`ASR_BACKEND=faster-whisper` 是默认后端，本地跑 Whisper，零 API 费用。`transcribe_faster_whisper.py` 的调用参数很克制：`beam_size=5`、`vad_filter=True`（先用语音活动检测滤掉静音段，短视频场景显著提速）、语言自动检测（可显式 hint）。默认模型 `small`，文档里给了升降级建议：资源紧张降到 `base`，要准确率升 `medium` 或 `large-v3`。

这个脚本真正值得读的是**运行时解析链**——Whisper 的 device 和 compute_type 在不同机器上是组合爆炸的坑，它用两级解析处理得干干净净：

- **device 解析**：`FW_DEVICE=auto` 时调 `ctranslate2.get_cuda_device_count()`，大于 0 走 CUDA，否则 CPU。注意 Apple Silicon 虽有 Metal GPU 也按 CPU 走——文档明确说了这是刻意取舍，只认 NVIDIA/CUDA 这一条 GPU 路径。
- **compute_type 解析**：先问 `ctranslate2.get_supported_compute_types(device)` 拿到当前设备真实支持的集合，用户显式配置且在集合内就尊重；否则按预设优先级链挑第一个被支持的——CPU 链是 `int8 → int8_float32 → int16 → float32`（优先低精度提速），CUDA 链是 `float16 → int8_float16 → int8 → ...`。测试里专门有一个用例：请求 `float16` 但设备只支持 `int8_float16` 和 `float32` 时，正确回退到 `int8_float16`。

输出同样是 SRT + text 双产物，转写完的 JSON 里带语言检测结果和语言置信度、分段数，方便 Agent 在总结时评估转写质量。

## 功能六：一键安装器（镜像测速 + 独立 venv）

`install_faster_whisper.py` 是个很懂中国网络环境的安装器。核心是 **PyPI 镜像测速**：内置清华、阿里、腾讯、中科大、官方五个源，逐个 GET 它们的 `/faster-whisper/` 索引页（只读前 1024 字节、5 秒超时），用 `time.monotonic()` 计时，选延迟最低的装。探测失败的源直接标记 unavailable，五个全挂才报错。还有 `--no-probe` 参数跳过测速直接用清华源。

安装目标是**独立 venv**（默认 `~/.cache/video-to-subtitle-summary/faster-whisper-venv`），刻意不污染系统 Python——这就是前面 `FW_PYTHON` 三级解析链里默认 venv 的来源。venv 创建用标准库 `venv.EnvBuilder`，Windows 下正确取 `Scripts/python.exe` 而不是 `bin/python`。装完跑一段 `import ctranslate2, faster_whisper` 并打印版本号做验证，最后输出 JSON manifest（venv 路径、选中镜像、两个库的版本），这个 JSON 正是给 Agent 读的——装完之后 Agent 就知道该用哪个 Python 了。

## 功能七：云端转写火山引擎 VC

`ASR_BACKEND=volcengine` 是可选的云端后端，用字节跳动的音视频字幕生成（VC）服务。这个功能没有独立脚本，直接以 curl + 轮询的形式写在 SKILL.md 里，是个典型的「提交-查询」异步任务模式：

1. **提交**：`POST /api/v1/vc/submit`，音频文件整个作为 `audio/mpeg` 请求体 binary 上传，URL 参数里带 `language=zh-CN`、`words_per_line=20`、`max_lines=2`（按行断句参数，输出的字幕每行不超过 20 字、最多 2 行）；
2. **轮询**：拿返回的 task id 反复 `GET /api/v1/vc/query`；
3. **落盘**：响应里 `utterances[]` 每项有毫秒级的 `start_time`/`end_time` 和 `text`，一段 jq 拼纯文本，一段内联 Python 把毫秒转成 `HH:MM:SS,mmm` 生成 SRT。

两个一手坑位记录：认证头是 `Authorization: Bearer;token`——**分号连接、没有空格**，和常见的 `Bearer token` 格式不同，作者在教程和 FAQ 里都特意标了警告；新用户有 20 小时免费时长包。默认走 faster-whisper 的用户完全不需要碰这些。

## 功能八：AI Douyin 历史任务查询

`list_ai_douyin_tasks.py` 是个独立小工具：调 `GET /api/v1/tasks`（X-API-Key 认证，只返回当前 Key 自己的任务），支持分页、`--status` 过滤（pending/processing/completed/failed）、`--search` 关键词、`--json` 原始输出。默认输出渲染成 Markdown 表格，且所有字段先过一个 `short_text()` 截断（默认 48 字符）——长标题和长 URL 不会把表格撑爆，这是给「Agent 转述给用户」看的输出格式。

配置读取逻辑和 SKILL.md 的 read_env 对齐：命令行参数 > skill 目录 `.env` > 环境变量，`.env` 解析器是手写的（跳过注释行、`split("=", 1)`、剥引号）。触发方式也很自然：直接对 Claude 说「看看我最近的解析任务」，SKILL.md 的 description 里写了这个触发场景。

## 功能九：AI 总结——由 Claude 自己完成

整条流水线的最后一步没有调用任何第三方总结 API——**总结就是主 Agent 的工作本身**。SKILL.md 给出了一段推荐的提示词模板，三个设计点值得注意：

1. **喂足上下文**：原视频标题（各平台字段优先级不同——抖音取 `desc`、小红书和B站取 `title`）、来源平台、作者，和转写正文一起给；
2. **明确误差来源**：模板里直说「正文可能来自平台字幕、自动字幕或语音识别，可能存在同音字、断句、专有名词错误」，授权模型在不改变原意的前提下结合标题做适度修正——这是对 ASR 后文本做总结的正确姿势；
3. **格式契约**：AI 标题不超过 30 字（「不要机械照抄原标题」）、摘要 200-300 字、要点 3-5 条结构化列表，外加一个固定的 Markdown 输出模板（视频信息表格 + 三个小节 + 生成文件清单）。

还有一条冲突仲裁规则：原视频标题和正文主旨明显冲突时，以正文为准，但「保留可能因语音识别存在误差的判断，不要凭空补充未出现的信息」——防止模型为了自洽而幻觉。

所有中间产物和最终产物统一落在 `/tmp/video_analysis/<视频ID>/` 下，一次分析的 video.mp4、audio.mp3、subtitle.srt、text.txt 全在一个目录里，Agent 最后把清单报给用户。

## 测试：完全不联网的单测

五个测试文件用同一套模式：`unittest` + `importlib.util.spec_from_file_location` 直接从 `scripts/` 目录加载脚本（不设包结构），外部依赖全部注入假实现——`SimpleNamespace` 造假的 ctranslate2 模块（返回固定的 CUDA 数量和支持的计算类型）、mock 掉 `urllib.request.urlopen`、临时目录当输出目录。测试覆盖的都是真正的逻辑分支：设备无 CUDA 时选 CPU、请求的 compute type 不被支持时的回退链、空白环境变量回落默认值、空字幕段跳过后重新编号、时间戳毫秒格式化……整套测试不碰网络不需要 GPU，`python3 -m pytest tests -q` 直接跑。

## 藏在 docs/plans 里的商业闭环

这是拆这个仓库最大的意外发现。`docs/plans/2026-05-22-ai-douyin-credit-proxy-plan.md` 是一份写给子代理执行的开发计划（开头就是「For Hermes: Use subagent-driven-development skill to implement this plan task-by-task」），内容是把 skill 接入 top9.cc 积分代理的完整改造方案。它透露了几个 README 不会直说的事实：

- **AI Douyin（top9.cc）和这个 skill 是同一作者**。计划里的技术栈写着后端 Go + Gin + GORM + Viper、前端 Next.js，仓库路径 `/Users/wangchang/code/ai-douyin`，和 skill 的开发路径 `/Users/wangchang/code/video-to-subtitle-summary-skill` 并排；提交记录的作者邮箱后缀是新片场（xinpianchang.com，一个视频创作社区）的企业域名。
- **积分制是一次有计划的商业化改造**。计划明确记录：`POST /api/v1/video/download-url` 原本「不创建分析任务、不扣积分」，2026-05-22 起改为「成功解析出下载直链后扣 1 积分、失败不扣、余额不足返回 402」，同时在 skill 侧把 AI Douyin 设为默认推荐、把 TikHub 从必需降级为可选。数据库层面还专门给解析代理做了独立记账方法，作者在 pitfall 里提醒自己「并发调用时必须在事务里完成余额检查和扣减，不能先读后扣」。
- **skill 是获客渠道，服务才是生意**。计划 Phase 2 的任务就是给 top9.cc 的 API Key 页面加「给 Skill 使用」的四步引导文案。README 里还挂着免部署在线版（就是 top9.cc 本身）和企业私有化部署的商务邮箱。

对照 git 时间线看得很清楚：2026-02-19 初版只有火山引擎后端和抖音，02-20 加多平台和本地文件，05-07 加 faster-whisper 默认后端和 YouTube 字幕直抓（这两步是纯粹的产品完善），05-22 起的三次提交全是商业化接入，07-19 最后一次提交就叫「top9.cc」。

这套模式我之前拆 [wewe-rss](/posts/wewe-rss-weread-mp-api/) 时见过一个更隐蔽的版本（闭源中转服务藏在开源代码里）。相比之下这个作者算相当坦荡：计费规则在 README 和教程里写得清清楚楚，plan 文档直接入库，而且留了完整的逃生门——自带 `TIKHUB_TOKEN` 走 tikhub provider、YouTube 天然免费、本地文件模式完全不需要解析代理。用户只要看清「默认路径指向作者的自营付费服务」这一点，剩下的都是明码标价。

## 评价：值得抄的和要小心的

**值得抄进自己 skill 的做法**：

- 「手册 + 脚本」两层结构是 Agent Skill 的甜点位：手册承载路由和回退这类模糊决策（改起来零成本），脚本承载下载、解析、转写这类确定性操作（可单测可复现），错误信息和 JSON 输出都按「给 Agent 消费」的格式设计。
- 纯标准库依赖让 skill 的环境门槛降到「有 Python 就行」，配合镜像测速安装器，对中国网络环境是降维打击。
- YouTube 分支的「先抓现成字幕、没有再 ASR」是正确的成本分级；脚本对 Windows venv 路径、API base 多种写法这类边角的处理也很细。

**使用前要想清楚的**：

- SKILL.md 的执行链是 bash 中心的（`grep/cut/tr` 读配置、`/tmp/video_analysis` 工作目录），Windows 原生环境基本得靠 Git Bash 或 WSL，五个 Python 脚本本身反而兼容 win32。
- B站明明有官方 CC 字幕接口可以直抓，这里却走「解析直链 → 下载视频 → ffmpeg 提音频 → Whisper」的重路径（还要扣 1 积分），是全链路里性价比最低的一条分支。
- 默认 provider 指向作者自营服务这一点，见上一节；介意的话配 TikHub 或者只用 YouTube/本地文件分支。
- SKILL.md 明说不适用于实时语音识别和直播字幕——它是纯离线批处理流水线。
- `/tmp/video_analysis/` 下的视频、音频、字幕没有清理策略，用多了会默默吃磁盘。

## 结语

196 star 对一个单人 skill 来说是个不错的成绩，它证明「把一件小事的完整链路写成一页可执行手册」依然是最有效的 Agent Skill 形态——不需要 MCP server，不需要插件框架，一份结构良好的 Markdown 加几个负责任的脚本就能跑通从抖音分享链接到 AI 总结的全流程。而 docs/plans 里那份计划文档则提醒另一件事：当某个 skill 的默认配置指向一个你不认识的服务时，去翻翻它的提交历史和文档目录，商业动机往往就写在那里。

> 相关阅读：[ZCode 官方 video-agent-kit 插件全拆解](/posts/zcode-video-agent-kit/)（另一个方向的视频 Agent：做视频而非看视频）、[wewe-rss 半开源架构拆解](/posts/wewe-rss-weread-mp-api/)（同类「开源引流 + 闭源收费」模式对比）。
