---
title: 【学习笔记】ZCode 官方 video-agent-kit 插件全拆解：视频剪辑 Agent 的功能地图与实现细节
published: 2026-09-14
description: video-agent-kit 是 ZCode 插件市场官方出品的自动化视频剪辑工具包（v0.4.3，Z.ai 出品，MIT 协议），约 2.8 万行 Python。它用「5 个 skill 做流程编排 + 37 个 MCP 工具做确定性媒体操作 + 3 个 hooks 做门禁」的三层结构，把视频剪辑 Agent 最难的几件事各给了一个明确答案：模型看不了视频——就抽帧拼带时间戳的 contact sheet 让主 Agent 自己读图；剪辑决策不可审计——就用 out/ 文件契约加 SHA-256 哈希追溯链，Stop hook 拦着不让没闭环就收工；旁白 TTS 不忠实——就逐句合成加 ASR 回听双指标验证。本文逐个功能拆它的实现：抽帧采样索引、官方语音通道的分片上传、句级压缩的静音吸附、字幕的 jieba 分词加动态规划断行、电影解说的磁带 DP 句画绑定、LoL 解说的「稿子先行画面按稿摘」范式，以及环境体检里「装了不等于能用」的探测哲学。
lang: zh
tags: [学习笔记, Agent]
abbrlink: zcode-video-agent-kit
---

ZCode 插件市场里有一个官方出品的视频剪辑插件 **video-agent-kit**（`zcode-plugins-official` 通道，v0.4.3，作者 Z.ai，MIT 协议）。装上之后会多出 5 个 skill（`video-agent-kit:video-edit-agent` 等）和一个 stdio MCP server，本地装的是 `~/.zcode/cli/plugins/cache/zcode-plugins-official/video-agent-kit/0.4.3/`，全插件约 2.8 万行 Python，不依赖插件目录之外的任何脚本。

> **一句话定位**：它不是「调用大模型 API 的视频工具」，而是一套**确定性媒体操作工具箱 + 流程编排 skill**——所有「看懂视频、写大纲、写旁白」的智能工作留给主 Agent（也就是 Claude/GLM 这类编码智能体本身），工具层只做 ffmpeg/OpenCV/ASR/TTS 这类可复现的机械操作，并用文件契约和 QC 证据逼着主 Agent 把每一步决策落在可审计的产物上。

这篇笔记把它的功能地图和每个功能的实现方式完整拆一遍。所有细节都读自本机安装的 0.4.3 源码，数字均为一手核对。

## 一、总体架构：三层结构

插件目录结构一目了然：

```text
video-agent-kit/0.4.3/
├── .claude-plugin/plugin.json   # 插件清单：userConfig、MCP server 定义
├── .mcp.json                    # stdio server：python3 mcp/video_edit_server.py
├── cli/video_agent_tool.py      # CLI 入口，与 MCP 共用同一套实现
├── hooks/                       # 3 个 hooks：SessionStart / UserPromptSubmit / Stop
├── mcp/
│   ├── video_edit_server.py     # MCP server 入口，注册 37 个工具名
│   ├── server_common.py         # serve() 公共层：图片内联、错误包裹、身份注入
│   └── ve_tools/                # 20+ 个实现模块（最大 condense.py 3049 行）
├── skills/                      # 5 个 skill：总控 + 组装 + 语音 + 解说 + 环境
├── schemas/                     # timeline / transcript / video_observation 三个 JSON Schema
└── examples/                    # timeline 示例
```

三层分工：

| 层 | 成员 | 职责 |
|---|---|---|
| **Skill 层**（流程编排） | `video-edit-agent`（总控）、`video-edit-assembly`（多素材组装）、`video-speech-workflows`（单源语音）、`video-recap-workflows`（四类解说剪辑）、`env-setup`（环境体检） | 素材发现、任务分类、路由到专门 workflow、定义文件契约和完成门槛 |
| **MCP 工具层**（确定性操作） | 37 个注册名（35 个独立工具 + `transcribe`/`tts_generate` 两个兼容别名） | 媒体探查、转录、抽帧、剪辑、渲染、QC、TTS——全部不调用任何大模型 |
| **Hook 层**（门禁） | `env_check.py`（SessionStart）、`check_video_input.py`（UserPromptSubmit）、`check_closeout.py`（Stop） | 启动体检提示、检测到视频路径时提示标准流程、停止前检查文件契约闭环 |

入口路由逻辑（`video-edit-agent` skill 定义）是一棵决策树：

- 用户提供**多个素材**要组装成片 → `video-edit-assembly`（多素材优先级最高）；
- **单源带语音**视频 → `video-speech-workflows`，按 `speech-condense`（压缩口播）/ `talking-head-subtitles`（口播字幕）/ `video-pipeline`（端到端组合）三选一；
- **整部片子/整场比赛**做中文解说 → `video-recap-workflows`，按 `movie-recap` / `soccer-recap` / `lol-recap` / `basketball-recap` 四选一；
- 都不匹配 → 总控自己的通用 timeline 流程（高光提取、裁剪、纯 TTS 旁白等）。

值得注意的一个工程细节：MCP server 用**单 worker 的 ThreadPoolExecutor** 串行执行所有工具调用，官方身份头在 worker 线程内、即将执行时才赋值——注释里写明原因：事件循环可能在上一个工具体还在跑时就受理下一次调用，提交前赋值会覆盖在飞调用的身份。这种「注释里记录事故」的风格贯穿整个代码库，后面还会反复看到。

## 二、设计哲学：三条反复出现的红线

读完所有 SKILL.md 和模块头注释，这个插件的设计约束高度一致，可以总结成三条：

**红线一：不假设主模型能直接看视频。** README 设计边界第一条。视频会先按固定规则抽帧、拼成带时间戳的 contact sheet（联络图），再通过 MCP 图片结果返回给主 Agent，由主 Agent 自己读图形成理解。工具内部不构造 `image_url` 请求、不调用任何外部推理服务——「看」这个动作永远是主 Agent 的多模态能力在做。

**红线二：工具不调用任何大模型。** 每个 recap 模块的 docstring 都写着「分工红线：工具不调用任何大模型。比赛理解/大纲/旁白/冷读全部由你（主 Agent）完成；工具只做确定性媒体操作」。叙事是主观的、不可复现的，交给模型；切镜、排片、TTS、混音是客观的，交给确定性代码。这样任何一步出问题都能定位到「是模型写错了稿，还是工具切错了片」。

**红线三：会话文本不算进度，文件才算。** 每个 workflow 都有一张文件契约表（全部落在 `out/` 下），完成门槛（Completion Bar）逐项检查文件是否存在、是否通过校验、是否覆盖当前版本（靠 timeline hash 判断新旧）。Stop hook 会在停止前实际检查这些文件。

围绕这三条红线，还有几个贯穿性的机制：

- **断点续跑的分级缓存**：ASR 块级缓存（长片分块转写，每块独立缓存）、TTS 句级缓存（指纹绑定「文本+句映射+停顿+provider+voice+rate」，改稿只重合成改动句）、镜头检测缓存（约 150 秒处理 2 小时片子，有缓存）、抽帧 sheet 复用（相同视频+时间范围+参数直接复用）。
- **证据驱动验证**：QC 工具不只报 pass/fail，还返回「证据」——每个剪辑接缝前后各两帧的画面、接缝两侧 80ms 的波形和 dB 三元组——skill 里明确要求「读每一行证据」，因为「ffmpeg 退出码为 0 只证明滤镜图跑通了，不证明成片听得下去」。
- **指纹保护**：视频按「路径+大小+修改时间」生成指纹，源文件被覆盖后隐式复看会拒绝沿用旧的 transcript 和观察结论，防止拿着视频 A 的记忆去剪视频 B。

## 三、视频理解：contact sheet 抽帧方案

这是整个插件的地基，`mcp/ve_tools/video_observe.py`（1118 行）完整内置了抽帧索引逻辑。

### 3.1 video_ingest：全片观察

默认抽帧参数（README 明确列出，属于「内置抽帧索引逻辑的默认值」）：

| 参数 | 默认值 | 含义 |
|---|---|---|
| `video_fps` | 2.0 | 目标采样率，每秒 2 帧 |
| `video_sampling_mode` | `prod` | 生产模式（动态 fps 索引） |
| `max_video_frames` | 600 | 单次观察的帧数上限 |
| `video_t_patch_size` | 2 | 帧数按 2 对齐（视频 token patch 习惯） |
| `sheet_cols` / `sheet_max_cells` | 4 / 24 | 每张 contact sheet 4 列、最多 24 格 |
| `sheet_width` | 1568 | sheet 总宽 1568px（每格约 392px） |
| `jpeg_quality` | 85 | sheet 压缩质量 |

核心采样函数 `prod_dynamic_fps_indices` 的实现很朴素：按「帧时间戳是否跨过下一个采样时刻」扫描全部帧索引，收集命中的帧；帧数不足或超出预算时用 `numpy.linspace` 线性插值兜底，最后补齐到 `t_patch_size` 的整数倍。读帧优先 OpenCV（`cv2.VideoCapture`），失败回退 ffmpeg 单帧管道（`-ss` 定位 + PNG 管道输出）。

代码里有个值得记录的坑注释：**`CAP_PROP_POS_MSEC` 必须在 `read()` 之后读**——之前读拿到的是 seek 过程中上一帧（frame_idx - 1）的 PTS，导致每张 contact sheet 的时间戳整体早一帧；而 PTS 比 `帧号/fps` 更准，因为它兼容可变帧率（VFR）素材。时间戳标签始终按实际帧换算成源视频时间，局部复看也不改成片段内相对时间——这是「拿 sheet 时间戳回源视频定位」的前提。

一张 sheet 拼好后（PIL 画格、标注 `Frame 007/024; timestamp=123.456s`），观察包（observation package）落盘为 JSON（帧清单、sheet 清单、媒体元数据、抽帧参数、匹配转录），并有独立 Schema（`schemas/video_observation.schema.json`）。**工具产物和主观结论严格分离**：模型读图后的摘要、候选片段、风险判断要写进 `out/report.md`，不许写回观察包。

返回给主 Agent 时，MCP 结果内联前 16 张图（`VE_MAX_INLINE_IMAGES` 可配，设 0 可全关），超出部分列出路径要求主 Agent 用 Read 批量读取；单张图超过 3MB 一律不内联（base64 会占约 4/3 体积，原始分辨率帧单张可能几十 MB，内联会淹没上下文）。内联失败也必须在返回文本里留痕——注释说「只警告 stderr 的话，主模型看到 inlined below 却少了图，无从察觉观察证据缺失」。

### 3.2 video_watch_segment：局部高 fps 复看

全片 2fps 是「看得见」，剪切点、遮挡、表情、字幕摆位这类局部细节需要「看得清」。`video_watch_segment` 接受单窗口（`start_time/end_time/fps`）或批量窗口（`segments=[{start,end},...]`），返回更高帧率的片段 sheet 和**该时间范围内的匹配转录文本**（把听觉和视觉证据钉在同一批图上）。

它有两个防重复/防错位机制：

- **窗口台账**：按源视频指纹生成独立台账，窗口按 `(start, end, fps)` 三元组判重——换一个 fps 重看同一窗口算新观察，精确相同的窗口返回 `skipped_duplicate` 且不算新的视觉证据；`force=true` 可跳过判重。
- **显式路径优先**：不带 `video_path` 时用会话里的 active video；active 文件被覆盖或替换时会报错要求显式传当前路径或重新 ingest，防止拿旧记忆继续用。

### 3.3 video_read_frames：原始分辨率读帧

这个工具（`frame_zoom.py`）解决的是「拼图方案读不了小字」的问题，模块头注释给了一手测量数据：1280x720 的源里，中文人名条大约只有 10px 高——对强视觉模型勉强可读，但弱一点的模型会**编造一个看起来合理的名字而不是承认读不清**，而这个错误会静默污染下游所有说话人标签。

所以它反其道而行：输入少量精确时间戳，每帧输出一张**原始分辨率**的单图，可选裁剪到指定区域（预设 `name_plate` 左下角条、`lower_third` 下三分之一、四角，或显式 `{left,top,right,bottom}` 比例）并放大 2 倍。把 10px 的字形变成不可能看错的大字，成本只是几张图。

### 3.4 抽象之外的取舍

skill 文档里反复强调「视觉检查的预算意识」：`condense_index` 自带固定预算（常量 8 张）的缩略图普查，满足压缩任务的视觉检查要求，**不要**再对长录音跑 2fps 全片 ingest（贵几个数量级，而压缩决策来自文本）；`subtitle_scout` 每镜头采一帧（见第七节）。什么时候花密集抽帧、什么时候花单帧精读，每个 workflow 都有明确纪律——这套「token 预算思维」是它区别于「一把梭全量抽帧」方案的核心。

## 四、语音栈：官方通道、分片上传与重试

`speech_transcribe` / `speech_synthesize` 是唯二碰网络的通用工具，实现上是一套多通道路由（`speech_service.py` + `zcode_speech.py` + `cloud_asr.py` + `tts.py`）：

```text
通道优先级（ASR 与 TTS 相同）：
1. 远端 HTTP MCP（VE_SPEECH_MCP_URL + TOKEN）——非 ZCode 宿主的推荐做法
2. ZCode 官方通道——宿主随每次 tools/call 注入身份，本地零配置零 key
3. 直连 HTTP 兼容后端（legacy escape hatch，自带语音服务时才用）
```

### 4.1 ZCode 官方通道的实现

`zcode_speech.py` 的模块头注释非常坦率地记录了四个「核过源码的服务端事实」，这部分平时根本看不到，值得原样摘录：

- 端点是 `POST {ZCODE_BASE_URL}/api/v1/mcp/server/video_edit`，Streamable HTTP MCP、stateless，裸发 `tools/call` 即可（go-sdk 会合成 initialize 握手），URL 不能带尾斜杠（会 307）；
- **请求体上限 45MiB，卡点在入口 nginx**（应用层 go-sdk 配的是 50MiB；这个值运维改过两次：默认 1m → 5MiB → 45MiB，注释里还留着「实测 1,048,576B 通过、1,048,577B 起返回 nginx 的 413 HTML」这种一手数据）；所以长音频必须本地分片逐片上传，服务端自带的 chunk_seconds 一律传 0；
- 45MiB 装得下约 4400 秒音频，**但一次请求超时预算 3600s，转写 70 分钟音频必然先超时**——所以分片秒数另有上限，网关上限再变时设 `ZCODE_SPEECH_MAX_REQUEST_BYTES` 即可，分片长度自动跟着变，不用改代码；
- 服务端刻意去掉了请求结构体上全部 `omitempty`，推导出的 Schema 里每个字段都是 required——所以 payload 构造函数把每个字段显式填齐含零值，少一个就是 Schema 校验失败。

身份注入的链路也讲究：身份头随 `tools/call` 的 `_meta` 由宿主下发，是 contextvar，**不跨 `run_in_executor` 的线程边界**，所以 server 在事件循环线程里读出来再传进 worker（`server_common.py` 里对应注释）。而环境探测类调用（比如 Stop hook 在独立进程里判断「ASR 可不可用」）看不到 per-call 身份，就用 `ZCODE_BASE_URL` 的存在性做信号——注释里解释了为什么这是对的：官方通道不需要本地凭据，仅凭「没配 API key」就回答「不可用」会错误地免除产出转录的义务。

### 4.2 分块、重试与清洗

长媒体自动拆成不超过 `chunk_seconds`（默认 1700s）的**重叠块**分别转写再合并，块级结果缓存可断点续跑。分块说话人标签带 `p{chunk}_` 前缀，跨块同一人可能是不同标签——skill 里要求按「称呼+语境」归并，不能只信标签。

重试策略区分错误类型：网络/timeout/429/5xx/并发限流这类**瞬时错误**默认额外重试 3 次（ASR 退避初始 30s、TTS 3s，指数增长，可用 `retries`/`retry_backoff_seconds` 覆盖，0~10 次）；缺凭据、provider 不可用、输入/参数错误**不重试**。

还有一个有趣的小设计：`speech_service.py` 里有**厂商名清洗**（`genericize_text`），把 seed-asr、volcengine、火山、豆包、bytedance 等字样统一替换成 `cloud_asr` / `cloud speech service`。注释特别说明这些 pattern 是刻意保留的——用来清洗**外部服务回显的文本**（错误信息、状态、资源 ID），因为插件自身代码不带任何厂商名，对外统一暴露 `cloud_asr`/`cloud_tts`。

### 4.3 语言参数的坑（附事故记录）

多个 workflow 文档都记录了同一条实测教训：**cloud ASR 兼容后端通常只在 language 为空/`zh`/`auto` 时开启说话人分离**。有一次英文文件名让模型推断传了 `language="en"`，结果中文篮球发布会转写回来**完全没有说话人标签**，段落粗到 20 秒一块捆绑两个人，下游模型只能从零重建说话人。所以规则是：没亲耳听过音频是别的语言，就别传具体语种，默认 `zh` 或 `auto`。转写完还要先看 transcript 元数据（provider/language/speaker_labels）再做别的。

静音音频返回带 `silent_audio` 标注的有效空转录（而不是报错）——「静默结果有效」这条规则写进了总控 skill 的硬规则。

## 五、通用剪辑线：timeline 四件套与基础操作

### 5.1 项目式 timeline

`out/timeline.json` 被定义成**接近剪辑软件项目文件**的 JSON，而不是简单的片段列表：必须有非空 `project`（任务与假设）、`assets[]`（素材清单）、`tracks[]`（轨道计划），以及 `sequence` 或 `output_canvas`（分辨率/fps/时基/平台目标）。可选 `markers[]`（关键节拍）、`transitions[]`、clip 级 `effects[]`/`timeline_start`/`volume`/`opacity`/`enabled` 等剪辑软件常见元数据。顶层 `clips[]` 只保留给 legacy/debug 兼容。

每个 clip 必须有 `start`、`reason`（**编辑学理由**，如「该片段引入冲突且视觉连续」，不许只复述时间戳）、`end` 或 `duration`（两者同时给必须一致）；时间值必须是有限数字，`NaN`/`Infinity`/布尔都拒绝。非视频轨（字幕/overlay/callout）的 clip 可以用非空 `text` 代替媒体 `source`——先把「字幕计划」也当时间线一等公民记录。

### 5.2 validate → render → qc → diff 闭环

- **`validate_timeline`**（timeline.py，1410 行）：ffprobe 校验源素材时长边界（时长优先 format duration、缺失回退 stream duration、同源缓存）、资产引用、轨内重叠、sequence 时长边界。报告写入 timeline 文件哈希。
- **`render_preview`**（render.py，909 行）：把 `tracks[]` 编译成输出——主视频轨按 `timeline_start` 铺画布、片尾补少量末帧降低边界闪帧；原视频音频与 audio/music/voiceover 轨先烘焙成全片长度、已定位的 wav bed 再非归一化混音；subtitle/text 轨 `drawtext` 烧录；overlay/image 轨按启用窗口叠加。渲染后额外写三个 sidecar：`render_report.json`（timeline hash + output hash 的绑定报告）、`render_plan.json`（确定性渲染计划）、`edit_decisions.json`（结构化剪辑决策）。
- **`qc_preview`**（qc.py，489 行）：硬性技术 QC——容器可播性、黑帧、**短编辑边界黑帧**、静音、冻结帧、音量、音频覆盖时长、空文件；扫描失败记为 QC error 而不是跳过；完全无音轨的成片记 warning（整片无声）不静默通过。
- **`timeline_diff`**：修复必须可审计，所以 timeline 改动走结构化 patch 而不是重写文件。15 种操作（`set_timeline_fields`/`set_track_fields`/`add_assets`/`update_assets`/`remove_asset_indices`/`add_tracks`/`insert_tracks`/`replace_tracks`/`remove_track_indices`/`update_clips`/`replace_clips`/`remove_clip_indices`/`move_clips`/`insert_clips`/`add_clips`），其中结构性 track 操作和 clip 操作不能混在同一个 patch（会改变 clip 容器，索引语义打架）、`move_clips` 每次 patch 最多一条；非法 patch 只写 diff 报告不修改原 timeline。

文档同时很诚实地说清了边界：这个 renderer 不是完整 NLE，复杂关键帧、遮罩、任意转场曲线、嵌套序列、动态贴纸仍然只是「项目计划元数据」，未知 track 类型会记录到 render plan 的 unsupported tracks 里，**不声称已完整渲染**。

### 5.3 video_basic_operation：单步确定性操作

OpenChatCut 风格的 8 种基础操作：`trim`/`splice`/`speed`/`crop`/`scale`/`rotate`/`flip`/`freeze_frame`，全部 ffmpeg 落成可检查的视频文件并写同名 `.basic_operation.json` 报告。几个实现细节：`speed` 支持反转且音频用 `atempo` 链同步变速（atempo 单级有范围限制，链式叠加突破）；`splice` 把多片段归一到同一画布再拼接；`scale.mode` 支持 fit/fill/stretch。定位是素材预处理和中间产物构造，正式剪辑决策仍应走 timeline。

## 六、speech-condense：把啰嗦的讲话剪紧

`condense.py` 是全插件最大的模块（3049 行），四个工具对应「索引 → 计划 → 渲染 → 验证」，skill 文档（288 行）写得像一份剪辑方法论。

它对问题本质的刻画很到位：**删一句话会改变后面那句话的意思**（删了问题，答案就没了对象；删了「首先」，「其次」就悬空）——每个切口局部都干净，整体仍然可以是坏的；**刀会落在音节中间**（ASR 给的是段落级时间，句边界是推导出来的，差 60ms 就削掉一个辅音）；**切口数量比切口长度更伤**（同样总时长，十个三秒的切口比三个十秒的切口更糟——每个接缝都是一次「听起来被剪过」的机会）；**固定机位的跳切是可见的**（同构图里头突然偏了两度）。

四步实现：

1. **`condense_index`**：把录音测成「句级单元表」——每个单元标 `D`（复述了前面的单元，未脚本化讲话里最可剪的时间藏在这，也是线性阅读最难注意到的）、`F`/`s`（失语/口吃）、`!`（无句末标点的连跑，末尾剪切会落在思考中间）、`~`（插值时间）；停顿分析给出判定（`plausible`/`threshold_too_high`/`threshold_too_low`，后两者必须先调 `silence_db` 重索引，否则切点全靠算术推导且后续步骤不会告诉你）；**无损下限**（不删任何句子、只收停顿和语气词能压到多短）——目标高于它就几乎不需要编辑判断，远低于它就必须删内容。视觉普查也在这一步：固定预算缩略图（3 分钟片段和 40 分钟播客都是同样 8 张）+ 逐帧运动基线（`locked_off`/`moderate_motion`/`busy`，决定切口多显眼）+ 内容里「看这里」类单元标 `V` 列为定向复看时刻。
2. **`condense_plan`**：keep-list（范围表达式 `u012-u031`，连续单元不产生切口）→ 切点。边界**吸附到音频里真实检测到的静音**（snap ratio 报告吸附率）；每个接缝做连贯性检查（`orphan_connective_in` 开头是「所以」却没了前文、`broken_reference_in` 指代悬空、`answer_without_question`、`mid_thought_out`）；`lead_out` 默认大于 `lead_in` 是刻意的不对称——句尾留一拍静音才像「话讲完了」。产出 `condense_script.md`：带删除标注的连续散文，**必须像观众一样通读**，这是唯一能抓住「每个边界都干净但整体不知所云」的手段。
3. **`condense_render`**：`join="hard"` 直切（口播/播客的默认正解，跳就减少切口数）或 `dissolve` 溶解（慢节奏/正式材料，超过 40 个片段不可用）。
4. **`condense_qc`**：每个接缝返回波形行 + dB 三元组（接缝两侧各 80ms 的电平对全片均值的比值，分级 `in_pause`/`one_side_quiet`/`in_speech`）+ 前后各两帧的画面行。内容切口的 `in_speech` 要么是干净的词对词拼接要么是削掉了音节，**只有听能区分**——不确定就升级到对成片跑高 fps 窗口复看。

文档里有两个量化实测值得一提：`drop_fillers="aggressive"` 在一段 5 分钟访谈上把同一 keep-list 从 20 片段/19 切口/0 错误/吸附率 0.78 推到 34 片段/33 切口，其中 7 片低于最小时长被丢（内容损失且欠目标）——所以**默认关闭**；一段 37 分钟源压到 12 分钟产生 66 个切口，验证做到一半耗尽轮次，没留下验证日志和报告——「一条漂亮的剪辑若没有验证记录就无法交付或信任」，因此超过约 20 个切口就要分层：被标记的切口穷尽验证、其余抽样、抽样本身记进日志。修复哲学被总结成一句话：**「大多数压缩缺陷是 keep-list 缺陷穿着渲染的戏服」**——先改保留清单，不动渲染参数。

## 七、talking-head-subtitles：口播字幕

`subtitle.py`（1511 行）+ `subtitle_scout.py`（458 行）+ `subtitle_style.py`（1003 行）三个模块。

### 7.1 subtitle_scout：任务形状的省钱勘察

模块头注释直接算了账：88 秒的片子 2fps 全量 ingest 会变成 8 张 contact sheet 约 2 万 image token，而对「字幕往哪摆」这个问题几乎全是浪费。摆位只需要四个答案：字幕带里已经有什么、镜头切不切（安全带是全片交集不是单帧）、脸在哪（别盖嘴）、字幕带背景多亮（决定描边还是底框）。所以它**每个镜头采一帧**，返回两张小图：缩略总览条（构图和人脸）+ 原生宽度的字幕带条（文字将要压在什么上面），token 约为全量方案的十分之一。

关键是**字幕带亮度是数值测量的**，对比度建议分级返回：高风险（有帧亮或明暗摇摆）给 `readability: box` 的 drop-in 覆盖、中风险给 `heavy_outline`、低风险不用改。`readability` 是一个风格旋钮，自动展开成 ASS 里配套的四个字段（border_style/outline_colour/padding/shadow）——手调这四个字段很容易「微妙地配错」。字号建议同理：竖屏短视频最佳字号约帧高 4.5% 到 5.8%、横屏 16:9 约 3.6% 到 4.8%，预设值落在带外就返回具体的 `font_size` 覆盖。

### 7.2 subtitle_build：动态规划断行

ASR 给的段落级时间戳一段可能是 15 秒，字幕 cue 是两三秒可读文本，这个转换是核心。模块头注释把「按字数硬切」的三个不足列清楚，对应三个实现：

1. **在句子断的地方断**——断点按标点打分，cue 收在句号而不是短语中间；jieba 分词保证词边界（中文），连词和助词禁止搁浅在行尾（taboo 规则）；
2. **在呼吸的地方断**——边界时间吸附音频里检测到的真实静音，cue 切换落在停顿里而不是削音节；
3. **全局最优而非贪心**——对全部候选断点跑**动态规划**，联合代价（阅读速度/行填充度/断点质量）最小化，一个糟糕的早期切口不会级联污染整个段落。

宽度用 **libass 渲染时的同一个字体文件**做像素级测量（PIL 加载同文件量宽），所以「这行放不放得下」在构建时和 QC 时是同一把尺子。字幕样式三预设（`shortform_zh` 竖屏大单行/`broadcast` 中文双行/`broadcast_en` 拉丁文按字符数预算）都是起点，鼓励用覆盖项微调而不是硬塞。

富字幕四种：**说话人标签**（`speaker_labels=true`，色盲安全调色板按首次出现分配稳定颜色，`speaker_names` 把 ASR 标签映射成真名）；**卡拉OK 逐字高亮**（`karaoke=true`，必须有词级时间戳才忠实；没有时降级为字符加权估计，在有 BGM 的素材上会明显滞后——能量静音检测在音乐下找不到真实语音边界）；**双语**（cue 里加 `translation_lines`，翻译由主 Agent 逐 cue 产出，渲染为同时间窗的较小较暗块，超宽自动按词换行）；**术语注释**（`role="annotation"` 的独立 cue 放帧顶部，少量使用）。

### 7.3 字体的豆腐块防线

`fonts.py` 集中了跨平台字体查找，顺序是：`VE_FONT_DIRS` 显式覆盖 → Linux 老目录（`/root/.fonts`、`/usr/share/fonts`）→ **平台系统字体目录**（macOS 苹方/Windows 微软雅黑，所以这两个平台通常零配置）→ `fc-list :lang=zh`（cmap 验证）。模块头注释记录了为什么必须有第 3 步：0.4.1 之前每个调用点自带硬编码 Linux 路径加 fc-match，而 **Windows 根本没有 fontconfig**，于一台微软雅黑就躺在系统目录里的机器上 `subtitle_build` 直接抛 `no font file found`。

比找不到字体更阴险的是**找到了但不能用**：`fc-match` 永不失败，问它一个没装的中文族它会返回 DejaVu Sans——没有 CJK 字形，libass 渲染出一片方块，而 ffmpeg 退出码是 0。所以 env_doctor 和字体链路都用 fonttools **读 cmap 确认真覆盖中文**，「解析出字体」不等于「字体能用」。

## 八、diarize_audit / diarize_relabel：说话人归属修复

背景是实测过的失败模式：三人播客里，采访者的提问和嘉宾的回答全被 ASR 打成同一个 speaker 标签——**词是对的，只有「谁说的」是错的**。

修复刻意不做自动裁决。`diarize_audit` 返回的是**证据简报**不是判决：每个标签的时间占比（对话里占比悬殊是塌缩的经典信号）；文本里现成的名字线索（自我介绍「我是X」→该段说话人、交接「有请X」→通常是下一位、呼格「X，你…」），每条带 verify_window；可疑窗口和声学换人候选窗口；软提示 verdict（`likely_collapsed`/`worth_checking`/`no_obvious_conflict`，最后者只是「没看出明显冲突」，不是证书）。`diarize_relabel` 按时间区间重写标签，**永不碰文本**。

真正的判断是主 Agent 的**视觉**判断，skill 文档写了整整一节方法论，密度很高，摘几条：

- **fps=4 是唇动判读的下限**，2fps 是幻灯片——说话嘴和打哈欠的嘴长得一样；4fps 约合每 1~2 个中文音节一帧，「几乎每帧都在变」才成为可读信号；
- 判读要**对整窗的模式**而不是单帧（听者也会笑、点头、跟着「嗯」）；
- 最强的免费校验是**和 ASR 文本匹配**：窗口转录是 5 秒的提问但候选者嘴只动了 1 秒，那说话的就不是他；中文语速约 4~6 音节/秒，音节量和时长对得上才算匹配；
- 窗口要**跨轮次边界**（一次看两张嘴：停下的和开始的）而不是一个人回答的中间；
- 唇动歧义时，平台活跃说话人高亮（Zoom/腾讯会议的边框）> 凑近麦克风 > 手势打拍子 > 抬眼看镜头；源视频自带的烧录字幕也常标轮次切换；
- 读人名条用 `video_read_frames`（原始分辨率裁剪），不要用拼图（392px 宽读 10px 字就是在诱导编造）；
- **不确定是合法结论**——诚实的 `A/B/C` 标签好过自信的错误名字，错误的归属会静默污染下游每个 `speaker_change` 检查。

## 九、movie-recap：电影解说的「先排片、后成稿」

五件套 `detect_shots` / `arrange_footage` / `synthesize_narration` / `bind_narration` / `render_narrated`，把一部电影剪成「几分钟看完一部电影」。核心纪律一句话：**大纲决定讲什么，画面决定能讲多久，文案把两者缝起来；禁止让每句话拿着秒数去素材库里凑碎片**。新接缝只允许出现在剧情拍边界，拍内画面是连续原片块——节奏就是原片剪辑师的节奏。

流程和实现要点：

1. **转录 + 切镜（可并行）**：全片 ASR（分块缓存）+ PySceneDetect 镜头轴（约 150s/2 小时片，输出契约与上游 movie_cut 项目逐字段一致，靠 `SEGMENT_VERSION` 版本串互相复用缓存）。
2. **台词轴**（`arrange_footage action="dialogue"`）：transcript → 带 D 编号的台词轴，**D 编号以本步产物为唯一权威**，杜绝大纲引用编号漂移。
3. **主 Agent 写大纲**（`outline.json`）：角色表 + 分拍大纲，每拍 2~4 个要点，每个要点引用真实 D 编号（跨度不超过 90 秒）；台词看不出的画面细节**宁虚不编**。拆约 3 倍目标分钟数的拍。
4. **排片**（`action="arrange"`）：每个剧情要点锚定它引用台词的时刻，从该镜头起整镜头顺延取「连续原片块」，全局光标只进不退；产出排片卷 + **写作简报**（每拍/每要点的真实画面秒数与字数硬预算）。`chars_per_sec` 必须按实际音色实测传入（默认 3.4 偏保守）。
5. **主 Agent 写旁白**：先从内置 38 篇解说语料库（`jieshuo_corpus.jsonl`，按 `movie_types`/`like` 筛同类高赞稿）萃取「文风卡」（只学手法不抄内容：悬念先行、身份代称后揭名、短句动作链、重音前破折号悬停……），再按预算写稿；写完必须做**复述测试**——把纯文本稿丢给一个不带任何上下文的子代理模拟「普通观众只听一遍」，复述不出/张冠李戴的地方就是稿子没讲明白的地方。
6. **锚定 + TTS**（`synthesize_narration`）：句级锚定后逐句合成。这里有个标注为「Homestead 事故教训」的案例值得记录：LLM 类 TTS 不保证忠实朗读——遇到 `某人:"台词"` 会把冒号前当说话人标签吞掉、把引语变声演绎、甚至自编对白（稿子「伊恩醒来时已过十天，珍娜坦然相告」被念成两个人的一问一答），而字幕烧的是原稿，观感就是「字幕的台词没有声音/多种人声」。对策三个参数必开：`by_sentence=true`（喂得短没发挥空间）、`flatten_quotes=true`（口播文本冒号变逗号去引号，只动标点不动字幕）、`verify="asr"`（每段合成后 ASR 回听，**内容命中 + 时长合理**双指标——ASR 自己会漏听，时长是独立第二证据，坏句自动删缓存重合成最多 2 轮）。
7. **句画绑定**（`bind_narration`）：这是最有意思的算法——**磁带 DP**。可用画面按原片顺序铺成一条只进不退的磁带，每个句组的决策 = 「快进到哪 + 从那里录多长」，零重复和时间单调**由构造保证**（不是靠校验），锚优先/跳切代价/短闪禁令/停留时长全部进一个打分函数，动态规划求解。卷模式下每段磁带就是该拍的 spans，余量变成呼吸留白。
8. **渲染**（`render_narrated`）：EDL → 成片，seg 级切片缓存断点续跑、highlight 拍呐喊后 1~3s 原声呼吸留白（「留白是标点不是空格，拍拍都停等于没有停」）、音画漂移硬校验、响度 QC；解说期间原声压低到 0.13 垫底（**外语片必须传 `bed_volume=0`**——垫底几乎全是外语人声），留白里原声 0.3s 渐入到 0.85（枪响回荡、人群嘈杂）。
9. **抽查闭环**：从 EDL 随机抽约 10 个语义句窗口，回源片高 fps 核对旁白与画面；**矛盾**（不是中性）的句子收集窗口用到的 shot_id，`bind_narration` 加 `avoid_shot_ids` 重绑，仍矛盾就改写措辞走 anchor→TTS→bind 重跑。

## 十、soccer-recap：画面时刻不可协商

足球和电影的实现差异被一句话点破：**电影里画面跟着大纲选，足球里呐喊必须钉在进球秒上——画面时刻不可协商，弹性全在文案**。

`soccer_ingest`（视频适配 + 解说轴）/`soccer_arrange`（排片）/`soccer_tts`（逐句 TTS）/`soccer_render`（摆放混音渲染）四件套，几个实现特色：

- **进球秒必须抽帧钉死**：解说轴的呐喊时间戳只做 ±5s 粗定位，对每个进球用 `video_watch_segment` 看候选窗口，找到球过线/爆庆祝的那一秒才写进 `event.t`，禁止凭轴时间戳直接报秒；疑似进球但轴里含糊（VAR/吹掉/乌龙）就抽帧看记分牌数字有没有跳，宁缺毋滥。
- **叙事骨架**：先写 `out/story.md`（完整赛场故事）再从里面挑拍成 outline；`through_line` 是悬念状态机（如「总比分安全垫还剩几个球」），每个桥接句交代当前值；每拍写 `link` 衔接词——「十条进球快讯连播」和「一个人讲完整场球」的区别全在这。
- **三档情绪只动语速和响度，音调恒零**——任何情绪档调音调都会让声音听感不一致，工具已强制 +0Hz。
- **渲染语法**（v0.5~v0.8 实测定型）：蒙太奇内部硬切、段间 0.3s **时长守恒溶解**（边界两侧各多取 0.15s 素材喂 xfade，时间轴与解说锚点不动）、冷开场后 0.7s 黑场压标题卡（不留裸黑屏）、切点吸附镜头边界、**进球回放收编**（事件 12s 后出现的中长镜头识别为回放收编进成片，回放数按大纲变奏防节奏疲劳）、**防剧透比分角标**（进球瞬间才跳分）、末帧定格加总比分。
- **QC 硬门**：黑场唯一、硬锚偏差不超过 1s、响度落在区间（文档给的示例门限大致在播客响度标准附近）。

## 十一、lol-recap 与篮球：稿子先行，画面按稿摘

LoL 解说把范式整个反转了：**解说稿是成片的脊柱，画面是台词的函数**。先通读全场写出每句标注 `t`（该句讲的画面在源视频的秒数）的解读稿，工具按稿摘画面——每组台词摘一段刚好讲完的切片，**没有词的画面根本不会被摘进来，长空窗在结构上不存在**。旧的 window 模式（先框窗口再塞词）只作兼容保留。

`_arrange_script_mode` 的实现（`lol.py`）是个漂亮的小算法：

- `_group_moments` 按句子的 `t` 跳变把一拍的句子分成「时刻组」（无 `t` 的句子跟随前句连续讲），每组对应一个源画面切片；同拍内 `t` 差超过阈值自动跳切成蒙太奇——官方集锦中位 6 秒一切，这正是想要的效果；
- `_clip_layout` 前向链摆放每句偏移，**硬句（呐喊句）钉死在事件帧前固定提前量起口**，前面的铺垫句向前回填（「解说早于画面起口是自然的」），硬句后的句子从呐喊（含呼吸口）重新前推；
- `_solve_clip` 解切片入点：铺垫被回填出片头时把画面入点提前，让铺垫词盖在事件前的真实画面上；有 VLM 事件区间时出点额外保证「动作演完再切」。

音频定调：全程生成解说当主音轨，原声**动态 ducking**——有解说压到 0.10，无解说的短空窗（呐喊呼吸口/动作收尾）0.4s 内平滑抬到 0.85 当氛围。QC 硬门包含**最大空窗不超过 9s**——空窗超门说明稿子对某段画面失语，回稿子补讲那段，不是去剪短画面。

两个只有「看帧」才能抓住的坑被写进纪律：**解说喊话常晚于动作 1~3 秒**，ASR 时间戳直接当动作秒会让呐喊落在回放或下一球上，所以每个 `hard` 句必须亲眼看帧钉死（横幅/击杀提示出现的那一秒）；**顶部记分条消失 = 导播回放画面**，ASR 轴完全抓不住这一点，同一场团战直播和回放各用一次是事故，看帧识别后一律只用直播。

篮球（NBA/CBA）**完整复用 LoL 四件套**（`source="lol"` 只是底层兼容值），kind 映射篮球语义（`kill`=决定性得分回合、`fight`=连续攻防潮、`objective`=篮板抢断、`tower`=分差节点），音色换成另一个固定解说音。三者的音色在 skill 里都是显式指定的（电影、LoL、篮球各一个 `*_uranus_bigtts` 音色名），并要求「即使 .env 已配置也要显式传 provider/voice，避免项目级环境覆盖」——因为句级 TTS 缓存把音色纳入指纹，混用音色会静默复用错产物。

## 十二、env-setup：「装了不等于能用」的体检哲学

`env_doctor.py` 是环境层的单一事实源（SessionStart hook 直接 import 它的 cheap 检查项，注释里记录 0.4.0 曾两份清单各自漂移的教训）。设计原则在文件头写得很完整：

- **要求先于命令**：每项先说清需要什么（名字+版本线），再按当前平台给**示例**命令——用户机器长什么样这里不知道，只有要求是硬的；
- **探测与修复分离**：默认只读探测，`--fix` 才动手且只装用户态幂等项（pip）；系统级（ffmpeg/字体）永远只打印；
- **探测顺序即依赖顺序**：没装 ffmpeg 就不必问它有没有 libass，前置失败的后置项报 skip 而不是伪失败；
- **「装了」不等于「能用」**：这个插件挂在「装了但不带某个 feature」上的次数比挂在「没装」上多——conda/静态包的 ffmpeg 常缺 libass（烧不了字幕）或 libmp3lame；所以 ffmpeg 查的是**编码器清单**（libx264/aac/libmp3lame）和**滤镜清单**（libass/libfreetype），字体查的是 cmap 真覆盖。缺 libx264 的症状最阴险：渲染在最后一步才炸，前面全白跑。

镜像策略是「**默认第一选择，不是回退**」——插件的典型用户在国内，官方 PyPI CDN 和 Homebrew bottle 的超时看起来像「装了十分钟然后失败」，每次都被误诊为包坏了。清华 pip 源、conda 装 ffmpeg（不动系统包管理器）都是第一选项；`VE_PIP_INDEX` 可整体换回官方源。

依赖地狱里最著名的一条：**scenedetect 必须 `--no-deps` 安装**。它声明依赖 GUI 版 opencv-python，会把 `opencv-python-headless` 已装的 cv2 包目录覆盖成半坏状态（import 成功、抽帧崩在 libGL），两个包一起完蛋。配套规则：永不自动卸载 opencv（GUI 版可能属于机器上另一个项目）；PATH 改变后新装的工具对当前 shell 不可见（Windows 最明显），重开终端而不是重装。

ZCode 宿主下的语音两行永远报 soft（官方通道，本地无需 key），并且明确写了反模式：**「向用户索要 ASR/TTS key」**——ZCode 下根本没有 key 可给，追着要 key 浪费用户一个回合且什么也修不好。

## 十三、Hooks：把纪律焊进宿主

三个 hook 补住了 skill 约束不到的时机：

**SessionStart（`env_check.py`）**：打印插件根路径、实际加载的 .env、缺失依赖（毫秒级项）和语音通道结论；把结论落在 `.video_agent/env_report.json`，不必每轮重跑。

**UserPromptSubmit（`check_video_input.py`）**：正则检测用户 prompt 里的本地视频路径。这个正则有两个精心处理的边界：显式右边界而不是 `\b`（CJK 字符算 `\w`，「请把input.mp4剪成」会匹配不上）；路径解析失败时**只允许在首个路径分隔符之前左裁剪**（中文 prompt 常把文字和路径粘在一起），越过 `/` 会把 URL 或 `C:\v\input.mp4` 裁成裸文件名误绑到项目里同名文件。命中后：已有 sheet 的提示直接复用（共享目录的 sheet 提示「不可归属、需核对」），没有的提示标准流程——先 `speech_transcribe` 产 `out/transcript.json`、再带 `transcript_path` 调 `video_ingest`、之后只做定向复看。最多处理 3 个视频防止 prompt 刷屏。

**Stop（`check_closeout.py`）**：收尾门禁，整个「文件契约」的执法者。只有当剪辑流水线产物（timeline/validation/preview/QC 报告）已经出现，它才在停止前逐项检查契约闭环——素材探针、转录（仅 cloud ASR 可用时要求，report.md 里解释过缺失可豁免）、观察包、timeline、校验报告、渲染产物、**必须由 `qc_preview(video_path, timeline_path)` 生成的 QC 报告**（缺 timeline hash 视为未闭环，防止拿旧 QC 报告冒充）；recap 产物出现后改查 recap 合同（final.mp4/绑定报告/TTS 忠实度/句画抽查/report.md）。单步任务（只做探查或转录）不触发。strike 计数按会话隔离，**最多拦 3 次后放行并记录 violation**——门禁不能变成死锁。SHA-256 有磁盘缓存（键为 size+mtime_ns），否则每轮结束重算 GB 级成片的哈希会撞爆 hook 的 15 秒超时，契约就静默失效了。

## 十四、CLI：同一套实现的另一个入口

`cli/video_agent_tool.py` 让所有 37 个工具不启动 MCP server 也能跑，直接复用 `ve_tools` 的实现函数。参数解析有几分讲究：`--key value` 简写会自动把值解析成 JSON object/array/数字/布尔（所以能直接传结构化 patch 如 `--patch '{"add_clips":[...]}'`），但只有**规范拼写**的数字才转型（`002` 保持字符串，不会塌缩成 2）；以 `path`/`dir`/`file`/`json`/`text`/`prompt` 结尾的键永不转型。`--project-dir` 会同时写 `CLAUDE_PROJECT_DIR` 和 `VE_PROJECT_DIR` 两个环境变量——注释记录了原因：前者在 Claude Code 会话里总是被导出，只写后者会被静默忽略。

CLI 与 MCP 语义上的一个差异写在 README：CLI 每次调用都是新进程，不共享会话记忆（active video、transcript 绑定），复看时要显式传 `transcript_path` 或 `transcript_text`。

## 十五、整体评价：它解决的是「信任」问题

拆完 2.8 万行代码，我的结论是：这个插件真正要解决的不是「让模型能剪视频」（ffmpeg 谁都会调），而是**让一条由大模型驱动的剪辑流水线的每一步都可信、可审计、可断点恢复**。

几个我认为最有参考价值的设计，值得任何做 Agent 工具链的人抄走：

1. **智能与机械的切面划在「可复现性」上**。看图、写大纲、写旁白、判断接缝干不干净——主观、不可复现，交给模型；切镜、排片、吸附、混音——客观、可复现，交给确定性代码。整个插件没有一处工具内嵌模型调用，于是「成片不对」永远可以二分定位。
2. **用文件契约替代会话状态**。「conversation text does not count as progress」这句话在每个 skill 里都出现。产物落在 `out/`、决策带理由落在 report.md、观察与主观结论分文件存放、hash 链绑定「这份 QC 报告覆盖的确实是这份 timeline 渲染出的这个文件」。
3. **QC 返回证据而不是结论**。接缝两侧的波形、dB 分级、前后各两帧画面——把「验证」从「信工具」变成「模型自己看证据下判断」，工具只负责把证据便宜地递到眼前。
4. **事故驱动的设计**。代码注释里到处是「实测」「已核过源码」「0.4.0 曾漂移过」：nginx 1MiB→5MiB→45MiB 的变更史、POS_MSEC 早一帧的 bug、复述测试抓不住自己稿子的问题、TTS 自编对白的 Homestead 事故、66 个切口耗尽轮次的教训。每个防呆机制背后都有一个真实翻过车的 run，这让它的约束读起来不是教条而是经验。
5. **token 预算是第一约束**。固定 8 张的视觉普查、每镜头一帧的字幕勘察、单帧原始分辨率读小字、3MB/16 张的内联上限、6 万字语料库先筛后读——「什么时候值得花上下文看」本身被当成了设计问题。

局限也顺手记下：通用 timeline 渲染器明确不是完整 NLE（关键帧/遮罩/复杂转场只是元数据）；解说流水线强依赖「台词量充足」（对白稀少的动作片会退回通用流程靠抽帧理解）；三个解说模式各自绑定固定音色，想换声音要自己实测 `chars_per_sec` 重新标定；sports 类流程要求完整比赛原片，官方短集锦因「一句没讲完画面已进下一回合」被明确拒绝。

最后是使用侧的两句实话：在 ZCode 里**语音零配置**（官方通道随调用注入身份，装环境时别去找 key）；首次使用前先跑 `env_doctor.py`（或会话里 `/env-check`），它查的「ffmpeg 带不带 libass」「中文字体 cmap 真覆盖」这两项，缺了都不会在开始时报错——一个在渲染最后一步才炸，一个烧出豆腐块还退出码 0。
