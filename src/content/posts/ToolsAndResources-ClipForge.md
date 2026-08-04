---
title: 【工具分享】ClipForge——开源 AI 带货短视频工具学习与资源梳理
published: 2026-08-05
description: 研读 xixihhhh/clipforge 的学习笔记——一张商品图自动产出抖音/快手/小红书/TikTok Shop 卖货短视频的开源工具。以「一张图 → 一条成片」的制作流程为主线，源码级拆解脚本生成 Prompt 装配、黄金 3 秒三拍结构、素人主播反 AI 假脸约束、19 款运镜预设注入、Provider 抽象与付费安全、10 源免费素材引擎、FFmpeg filter_complex 合成管线、字幕/转场/侧链闪避、多平台 CRF+VBV 码率卡线、AIGC 双层标识与发布门禁；并专章拆解「完全不配 API Key 的免 Key 出片闭环」——Ollama 本地 LLM、Openverse/Wikimedia 免费素材、自研 Edge TTS keyless 客户端（伪造 Sec-MS-GEC token）的每一环实现，系统汇总文中点名的所有 AI 平台、模型、免费素材库与工具链资源
lang: zh
tags: ["工具分享", "学习笔记"]
abbrlink: clipforge-ai-product-video-tool
---

> 整理日期：2026-08-05
> 项目地址：[xixihhhh/clipforge](https://github.com/xixihhhh/clipforge)（原『带货剪手 / daihuo-jianshou』，仓库、Star、历史全部延续）
> 官网：<https://xixihhhh.github.io/clipforge/>
> License：AGPL-3.0 © 2026 xixihhhh
> 说明：本笔记基于该项目 README + 源码（`src/lib/script-engine/`、`src/lib/providers/`、`src/lib/video-composer/`、`src/app/api/project/[id]/`，截至 2026-08 main 分支）研读整理。关键信息均附原始出处；AI 模型与平台迭代极快，正式商用前请以各平台最新页面为准。

## 一、它是什么、解决什么

ClipForge 是一款定位清晰的**开源 AI 带货短视频工具**。一句话概括其主链路：**上传一张商品图 → AI 提炼卖点、写种草脚本 → 锁定商品原图不变形、配画面 → 配音 + 字幕 + BGM → 几十秒产出可直发抖音小店 / 快手 / 小红书 / 视频号 / TikTok Shop 的竖屏卖货视频**。也支持「一句话主题成片」做任意非带货题材。

它针对的是传统做一条带货视频的整条手工链路：编导写脚本（1-2 小时）→ 拍摄修图（1-3 天）→ 剪辑合成（2-4 小时）→ 多平台适配手工调比例/字幕，单条成本数千元、一天最多 3-5 条。ClipForge 把这条链路全部自动化，并在三个点上做出差异化：

1. **商品保真**：用 image-to-image 锁定商品本体的原始像素，AI 只改背景、打光、运镜——产品绝不被 P 坏。既是转化命门（货不对板会被退货），也是合规与售后防线。
2. **真·动态镜头，而非静图 PPT**：图生视频 i2v + 链式无缝首尾帧转场 + **19 款命名运镜预设**（每镜可选、可 Mix 双预设叠加）+ 8 款画面风格 Look，单镜不满意可只重跑运动而不推翻全片。
3. **国内平台合规默认开**：把「AIGC 标识 + 广告法违禁词扫描 + 发布门禁」做成零配置即开，避免国内平台对未标识 AI 内容自动限流、对违禁词直接压量。

> **关于数字的一个更正**：README 写「18 款运镜预设」，但实际 `src/lib/camera-presets.ts` 里 `CAMERA_PRESETS` 共 **19 条**（推拉 4 + 环绕 3 + 横移跟随 3 + 升降 3 + 手持 2 + 特殊 4）。下文以源码为准。源码注释里提到这套机制借鉴 Higgsfield（60+ 预设）和 LibTV（~100 模板）精简到电商场景。

## 二、技术架构

```
┌─────────────────────────────────────────────────┐
│  前端 (Next.js 16 + React 19 + Tailwind CSS 4)  │
│  Pages: 首页/一句话主题/商品库/批量出片/新建/脚本/素材/合成/导出/设置 │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  API 层 (Next.js Route Handlers)                │
│  /api/llm/script  /api/ai/image  /api/ai/video  │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  业务逻辑层                                      │
│  脚本引擎 (Prompt + 模板 + SEO)                   │
│  AI Provider 抽象层 (7 平台 30+ 模型)              │
│  多源素材引擎 (Openverse/Pixabay/Pexels 聚合检索)   │
│  视频合成引擎 (FFmpeg + 转场 + 运动 + 混音)         │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  数据层                                          │
│  SQLite + Drizzle ORM / Zustand (前端状态持久化)   │
└─────────────────────────────────────────────────┘
```

| 层级 | 技术 |
|---|---|
| 框架 | Next.js 16 + React 19 |
| 语言 | TypeScript 5（strict mode） |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 状态管理 | Zustand（localStorage persist） |
| 数据库 | SQLite + Drizzle ORM（启动自动 migrate） |
| 视频合成 | FFmpeg（fluent-ffmpeg），全程 `execFile` + `-filter_complex_script` 不经 shell |
| 测试 | Vitest（750+ 用例）+ Playwright（E2E） |
| CI/CD | GitHub Actions（lint + test + build） |
| 桌面打包 | Electron + electron-builder（mac 已实测） |
| 包管理器 | pnpm |

下面各节按**「一张商品图 → 一条成片」的真实制作流程**为主线展开，每一步把「做什么 / 功能卖点 / 源码实现」三个视角融合在一起，不再分开重复讲。

## 三、流程第 1 步：脚本生成（AI 带货编导）

### 3.1 功能层

输入一张商品图 + 商品名 + 类目 + 投放平台，AI 在 ~30 秒产出 3 套带货脚本（如痛点种草 / 场景安利 / 对比测评），每套自带：

- **黄金 3 秒钩子**（视觉冲击 / 悬念提问 / 反差对比 / 利益承诺 / 情感共鸣）
- **5-8 个分镜**（每镜含：中文场景描述、英文 AI 生图提示词、运镜、转场、中文口播、英文素材检索词、文字贴片）
- **平台 SEO 物料**（标题 / #话题标签 / 封面文案 / 互动引导 / 描述）

覆盖 **5 大品类深度模板**（美妆护肤 / 食品零食 / 家居日用 / 服饰鞋包 / 数码 3C）和 **10 种脚本风格**分四形态：剧情形（情景短剧 / 反转剧场 / 街头采访 / 剧情故事）· 物品形（开箱测评 / 物品拟人 / 对比测评）· 口播形（达人口播 / 痛点种草）· 场景形（场景安利）。

### 3.2 源码实现：OpenAI 兼容 + 大段结构化 Prompt

脚本引擎完全走 **OpenAI Chat Completions 协议**（`openai` SDK），所以任何 OpenAI 兼容端点都能接。核心调用（`generator.ts`）：

```ts
client.chat.completions.create({
  model: input.llmConfig.model,
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user",   content: userPrompt },
  ],
  temperature: 0.8,
  max_tokens: 16000,
  ...reasoningParams(input.llmConfig.baseUrl),
})
```

两个端点相关的工程细节值得记一笔（都是真踩坑留下的，不是营销话术）：

- **`reasoningParams(baseUrl)`**：只对 Pollinations 注入 `{ reasoning_effort: "low" }`。Pollinations 的推理模型不压低 reasoning_effort 就会把 token 预算全烧在 thinking trace 上、返回空内容；但真 OpenAI 对非推理模型传这个参数会直接 400 `unsupported_parameter`，所以用正则按 baseUrl 圈定。
- **`batchCountFor(baseUrl, requested = 3)`**：Pollinations 匿名档有输出上限，一次出 3 条脚本会被截断成非法 JSON，所以那里强制把批量降到 1——「一条有效脚本胜过三条被截断的」。

**System Prompt** 把模型设定为「一位顶级电商短视频编导」（5 年抖音/快手经验、累计 GMV 10 亿、精通 AIDA 模型），并硬性要求「商品展示镜头优先用 `product_image`，确保商品不被 AI 篡改」「prompt 字段用英文写，描述画面构图、光线、色调」。另有一个独立的 `TOPIC_SYSTEM_PROMPT` 给「一句话主题成片」（无商品、无卖货压力）。

**输出 JSON Schema**（`Shot` 接口，`src/lib/db/schema.ts`）是最关键的数据契约：

```ts
export interface Shot {
  shotId: number;
  type: "hook" | "pain_point" | "product_reveal" | "demo" | "social_proof" | "cta";
  duration: number;          // 各镜 duration 之和必须等于 totalDuration
  description: string;       // 中文场景描述
  camera: string;            // 运镜——从预设词表里挑（见 §4.3）
  visualSource: "ai_generate" | "product_image" | "user_upload";
  transition: "ai_start_end" | "ai_reference" | "direct_concat" | "ffmpeg_fade";
  voiceover: string;         // 中文口播文案，约 duration × 3 字
  prompt?: string;           // 英文 AI 生图/生视频提示词
  stockKeywords?: string[];  // 1-3 个英文素材检索词
  characterId?: string;
  motion?: "zoom_in_slow" | "pan_left" | "pan_right" | "ken_burns" | "static";
  textOverlay?: { text: string; style: "title" | "subtitle" | "highlight" | "price" };
}
```

硬约束：第 1 镜 `type` 必须是 `hook`、最后一镜必须是 `cta`；总时长 15-30s；5-8 镜；`visualSource: "product_image"` 时可省 `prompt`。`validateShot()` 会对 `type`/`transition`/`visualSource`/`motion` 做枚举白名单校验——这是把弱模型（如 `qwen2.5:0.5b`）乱回的字段挡在库外的最后一道闸。还有一个 `isRealVoiceover()` 后置质检：拒绝那些只是把 schema 字段说明原样回吐的旁白（弱模型真实失败模式），零有效旁白时抛双语错误提示换 7B+ 模型。

### 3.3 Prompt 装配顺序（最值钱的架构图）

`buildUserPrompt`（`prompts.ts`）按如下 14 段顺序 push，**后面的会覆盖前面的注意力**，所以顺序本身就是设计：

1. `【商品信息】`（名称/类目/描述/人群/价格区间/优势/时长/比例 9:16/平台）
2. `【商品图片分析结果】`（vision 模型输出，若开了）
3. `【出镜人物】`（仅 `live_presenter`）
4. `VIDEO_MODE_DIRECTIVES[videoMode]`（4 种视频模式的素材策略）
5. `PLATFORM_SEO_DIRECTIVES[primaryPlatform]`（只注入第一个平台的完整策略 + 多平台提醒）
6. 类目指令（如 `beautyPromptDirective`）
7. 风格指令 `stylePrompts[styleType]`
8. `performanceHint`（数据飞轮回灌，可空）
9. `buildHookGuidance(category, 5, preferredHookId)`（黄金 3 秒，见 §3.4）
10. `【参考脚本案例…】`（**只注入该类目 templates[0]**，其他 3-4 个不进 prompt）
11. `【用户额外要求】`
12. `OUTPUT_FORMAT_PROMPT`（JSON schema 规格，内部又插了 `cameraPresetGuide()`，见 §4.3）
13.（条件、最后）`【LANGUAGE — IMPORTANT…】` 非中日韩商品时强制英文覆盖（为海外 TikTok Shop）

一个被忽略的细节：**类目模板每个有 4-5 个，但只有 `templates[0]` 作为 few-shot 示例进 prompt**，其余只在 UI 里作为「可选配方」存在，不参与生成。各类目模板数：beauty 4、fashion 4、food 5、home 4、tech 5（共 22 个）。

### 3.4 黄金 3 秒：三拍留人结构，不是俏皮话

黄金 3 秒在仓库里有两个独立实现：

- **`HOOK_PATTERNS`（`hook-patterns.ts`）——带货主路，最严肃**。每个 `HookPattern` 不是一个金句，而是一个**三拍留人结构**：

  ```ts
  export interface HookPattern {
    id: string;
    name: string;
    stop: string;       // 0-1s：怎么截停拇指
    prove: string;      // 1-3s：怎么证明相关性
    bridge: string;     // 3-7s：怎么自然接到产品
    arousal: "high" | "mid";
    categories?: ProductCategory[];   // 强相关类目（省略=通用）
    avoidWhen?: string;
    example: string;
  }
  ```

  共 **10 个**：`visual_shock`、`suspense_question`、`contrast`、`pain_strike`、`before_after`、`sound_hook`、`challenge_doubt`、`identity`、`number_benefit`、`unexpected`。选法是类目感知的（`selectHookPatterns`）：先取该类目专属的、再补通用的，取前 5。

- **`goldenThreeSecondsStrategies`（`prompts.ts`）——主题成片用**，简单的 5 策略字符串常量，不分类目、不能 pin。

**反同质化的关键**是 `preferredHookId` 参数：批量出片时调用方给每条视频 pin 一个不同的 hook 模式，LLM 就不会每次都选同一个心头好。配合 `hook-variants.ts`（只重写第 1 镜、不改正文、零 LLM 调用、零 Key——符合「免费兜底」哲学）做 A/B 变体，再让**数据飞轮**把闭环合上：`publish_metrics` 表 → `topConvertingHook` → `buildPerformanceHint` → 反灌回下次生成的第 8 段 prompt。冷启动无数据时自动回落、不打扰。

### 3.5 素人主播：反 AI 假脸的承重墙是约束常量

`src/lib/presenters.ts` 有两块协同的代码。**真正承重的是 `REAL_FACE_CONSTRAINT`，不是 6 个预设本身**：

```ts
export const REAL_FACE_CONSTRAINT = {
  zh: "人物是清爽耐看的普通人长相：五官端正有亲和力，看着舒服讨喜，日常淡妆，发丝自然，皮肤有自然真实质感不磨皮——不是精修网红脸，也绝不刻意丑化；画质像手机随手拍带轻微噪点，自然光，不打影棚光、无广告片精致感",
  en: "the person is a pleasant, ordinary-looking real human: ... real un-retouched skin texture — not a polished influencer AI face, and never deliberately unattractive either ...",
} as const;
```

源码注释明确写：这条是在 Seedance 2.0 真实 A/B 调用上验证过、校准过两次的——雀斑/痘痘/眼袋这类瑕疵被模型过度矫正成不可爱的脸，所以甜点是「好看的普通人」，**同时禁止网红脸和故意丑化**。`presenterPromptBlock()` 把 6 个素人预设（邻家姐姐 / 通勤上班族 / 大学生妹妹 / 实在宝妈 / 理工直男 / 实在大叔，每个 `appearance` 都烘焙进反 AI 假脸特征）格式化后，直接插进 4 个会出镜的风格指令（`drama`/`interview`/`product_pov`/`talking_head`）。

> **两套人物系统并存**，容易混：① `ScriptCharacter`——LLM 每次为单条脚本临时生成的角色，存进 `scripts.characters` 列，驱动多音色 TTS + 视觉锚点（drama/interview/product_pov 用）；② `PRESENTER_PRESETS` + 全局 `characters` 表——可跨项目复用的出镜人物（`live_presenter` 模式用）。两套都吃同一个 `REAL_FACE_CONSTRAINT`。

## 四、流程第 2 步：配画面（商品保真 + 动态镜头 + 免费素材）

脚本产出后，每个分镜要配上视觉画面。ClipForge 的画面来源有三类：**商品原图（保真出镜）/ AI 生成（图生图 + 图生视频）/ 免费素材库**。这一步是「商品保真」和「真·动态镜头」两个差异化的落点。

### 4.1 AI Provider 抽象层：7 平台一个接口

`src/lib/providers/` 用一个 `AIProvider` 接口把 7 个平台抽象掉，核心契约：

```ts
export interface AIProvider {
  generateImage(options: ImageOptions): Promise<ImageResult>;
  generateVideo(options: VideoOptions): Promise<VideoResult>;
  getTaskStatus(taskId: string): Promise<TaskStatus>;
  // 两阶段（issue #16 付费安全模式）：
  submitVideoTask?(options: VideoOptions): Promise<{ taskId: string; modelId: string }>;
  waitForTask?(taskId: string, options?): Promise<TaskStatus>;
  uploadLocalMedia?(filePath: string): Promise<string>;
  listModels(mediaType?: MediaType): Promise<Model[]>;
}
```

`VideoOptions` 是承载 i2v 一切能力的核心 DTO：

```ts
export interface VideoOptions {
  modelId: string;
  mode: 'text-to-video' | 'image-to-video' | 'video-to-video';
  prompt: string;
  firstFrameUrl?: string;          // i2v 首帧锁定
  lastFrameUrl?: string;           // 关键帧链（Seedance/Vidu）
  referenceVideoUrls?: string[];   // Seedance 2.0 多模态参考视频（≤3 个、≤15s）
  referenceImageUrls?: string[];   // ≤9 张
  motionStrength?: number;
  duration?: number; fps?: number;
  voiceover?: string;              // 原生音频模型时拼进 prompt
  audioPrompt?: string; audioEnabled?: boolean;
  ...
}
```

各平台调用协议差异极大（同步 vs 异步轮询、字段名、鉴权方式），Provider 层全部抹平。比如首帧字段：Atlas 用 `image`/`last_image`、fal 用 `image_url`、Replicate 同时写 `start_image` 和 `image` 兼容不同模型、火山用 `content` 数组的 `image_url`、阿里用 `input.img_url`、硅基流动用 `image`、OpenAI 无视频。详见 §九-2 资源表。

### 4.2 商品保真 + 付费安全（issue #16）

**「商品保真」的真正实现不在 Provider 层**——Provider 只负责把 `firstFrameUrl`/`referenceImageUrl` 送到各平台对应字段。真正的保真约束是 i2v 运动提示词引擎（`src/lib/motion-prompt.ts`）在 `productShot === true` 时追加的硬文本：

```ts
const PRODUCT_CONSTRAINT = {
  zh: "商品的外观、包装、颜色、logo 与文字必须保持完全不变，文字清晰不扭曲变形",
  en: "the product's appearance, packaging, colors, logo and printed text must remain exactly unchanged, text stays sharp and undistorted",
}
```

这是针对「i2v 模型 notoriously 会把印刷文字/logo 扭曲」这个通病的硬缓解。**关键帧链**（即梦同款首尾帧）则靠 `chainToNext` 追加「镜头在结尾自然运镜过渡到指定的尾帧画面，过渡连贯流畅、不跳切」；不链时改加「整段为连续单镜头拍摄，中途不切镜」——否则 Seedance 会中途切镜，破坏单镜语义。

**付费安全（issue #16）是整个 Provider 层最强的设计约束**，三句话能说清：

1. **创建计费任务的 POST 永不自动重试**——客户端超时/断网不代表服务端没受理，盲目重试会默默造出重复付费任务。只有 GET 和 429 会重试。
2. **任务一旦提交成功立刻落库 taskId**——轮询超时/断网/重启都不丢已扣费任务，`ProviderError` 带着原 `taskId` 抛出，调用方能恢复查询。
3. **Atlas 的 `resolveVideoModel()` 在任何计费调用前做模式校验**——i2v 请求没首帧直接抛 `MISSING_FIRST_FRAME`（「提交了也是给你出一条和你图片无关的视频」）；首帧在但选了 t2v-only 模型，自动重映射到同族的 i2v 模型；参考视频模式重映射到 `/reference-to-video`。

### 4.3 19 款运镜预设如何注入：按分镜类型给词表

运镜预设的 `CameraPreset` 结构（`src/lib/camera-presets.ts`）：

```ts
export interface CameraPreset {
  id: string;
  name: { zh: string; en: string };
  category: "push_pull" | "orbit" | "pan_track" | "crane" | "handheld" | "special";
  prompt: { zh: string; en: string };   // 最终写进 Shot.camera 的句子
  goodFor: Array<Shot["type"]>;         // 驱动 LLM 推荐 + 选择器分组
}
```

完整 19 预设清单（按类目分组）：

| 类目 | 数量 | 预设 |
|---|---|---|
| `push_pull`（推拉） | 4 | `crash_push` 急速推近 · `slow_push` 缓慢推近 · `pull_reveal` 拉远揭示 · `dolly_zoom` 希区柯克变焦 |
| `orbit`（环绕） | 3 | `orbit_slow` 环绕展示 · `lazy_susan` 转台展示 · `arc_quarter` 弧形环移 |
| `pan_track`（横移跟随） | 3 | `lateral_track` 横移扫过 · `follow_track` 跟随镜头 · `whip_pan` 甩镜切换 |
| `crane`（升降） | 3 | `crane_up` 升镜展开 · `crane_down_close` 降镜聚焦 · `overhead_top` 俯拍下降 |
| `handheld`（手持） | 2 | `handheld_real` 手持实拍感 · `pov_walk` 第一视角 |
| `special`（特殊） | 4 | `macro_glide` 微距滑移 · `hero_rise` 英雄仰拍 · `push_then_hold` 推近定住 · `focus_shift` 焦点转移 |

**关键设计**：预设不是作为一个扁平列表丢给 LLM，而是 `cameraPresetGuide()` 渲染成**按分镜类型分组的词表**——对 6 种 shot type 各取 `goodFor` 命中的前 3 个预设，用中文 prompt 句子以 `｜` 连接。LLM 看到的是「开场钩子：A ｜ B ｜ C」「商品展示：D ｜ E ｜ F」这样的分组 vocab，再挑一句写进 `Shot.camera`。源码注释说这是「运镜质量上游最大的单点杠杆」。

**Mix 双预设叠加**靠 `mixCameraPrompt(a, b)` 用「，同时」/`", while"`拼两句，但过 `hasCameraConflict()` 冲突检测：静态词（固定/静止/锁定）和运动词（环绕/推近/拉远…）同时出现且没有先后序词（先/后/然后…）就判冲突返回 null——所以「推近后固定」合法、「固定同时环绕」非法。两层封顶（混合后文本不再等于任何单一预设，Mix 入口消失）。

### 4.4 多源免费素材引擎：search + download，不是 task polling

素材引擎和 AI Provider 是对称但协议不同的两套：**Provider 是异步任务轮询，素材是 search + download**。没商品图、不烧 AI 额度也能为每个分镜配齐画面。统一候选形状：

```ts
export interface StockCandidate {
  source: StockSourceId;
  mediaType: 'video' | 'image' | 'audio';
  id: string | number;
  downloadUrl: string;         // 直链
  pageUrl: string;             // 源页（署名用）
  author: string; authorUrl: string;
  license: string; licenseUrl?: string;
  attributionText?: string;    // 现成署名文本
  requiresAttribution?: boolean;
  width?: number; height?: number; durationSec?: number;
}
```

实际是 **10 个源**（README 主表只列了 7 个，NASA 和 Internet Archive 不进默认聚合、手动选用）：

| 源 | 免 Key | 媒体 | 进聚合 | 关键点 |
|---|:---:|---|:---:|---|
| `openverse` | ✅ | image, audio | ✅ | 商用 CC，匿名配额 20/min·200/day；无视频 |
| `wikimedia` | ✅ | image, **video**, audio | ✅ | **唯一免 Key 视频源** + 免 Key BGM |
| `pexels` | ❌ | video, image | ✅ | 高质量商用，`Authorization: <KEY>`（无 Bearer） |
| `pixabay` | ❌ | video, image | ✅ | `?key=` 查询参数 |
| `coverr` | ❌ | video | ✅ | 精选实拍，2000 次/时，署名必带 |
| `jamendo` | ❌ | audio | ✅ | 服务端 + 客户端双重过滤，**纯 CC-BY 才活下来**（NC/ND/SA 全排除） |
| `freesound` | ❌ | audio | ✅ | 50 万+ 音效，`filter=license:("Attribution" OR "Creative Commons 0")`，用 128kbps HQ mp3 预览 |
| `local` | ✅ | video, image | ✅ | 项目素材池，`fs.copyFile` |
| `nasa` | ✅ | video, image | ❌ | 公共领域，显式选用 |
| `archive` | ✅ | video, image | ❌ | Internet Archive，`publicdomain` 强制 |

**三个让素材「永远够用」的算法**：

1. **聚合检索 `searchAllStock`**——`Promise.allSettled` 扇出到所有可用源，一个挂了不挡其他；按确定性优先级排序：媒体类型匹配 > 本地源优先 > 免 Key 源优先 > 竖屏朝向优先 > 高分辨率。带 5 分钟 TTL / 64 条的 `TtlCache`，但**空结果不缓存**（给兜底重试留口子）。
2. **「永远有素材」兜底 `broadenQuery`**——查无结果时逐级放宽：`"quantum entanglement physics"` → `["entanglement physics", "physics", "abstract background", "lifestyle", "nature", "light"]`。
3. **同源优先 `scoreCandidate`**——同一实体的分镜归组（`continuityGroups` 用 union-find over 共享实体词），组内优先复用**同一 provider + 同一作者**的素材（同上传者的片子天然同场景/同光线/同调色）。评分：关键词命中是王、竖屏 +5、同 id 罚 −8（去重）、同作者 +6（连贯）。`authorKeyOf` 把占位作者（unknown/internet archive）过滤掉不算。

下载契约：`MAX_DOWNLOAD_BYTES = 80MB`、`REQUEST_TIMEOUT_MS = 30s`，按 content-type 推断扩展名（`video/mp4→mp4`、`image/jpeg→jpg`、`audio/mpeg→mp3`），存进 `uploads/{projectId}/stock/`，`assets` 行落库带 `license`/`author`/`sourceUrl` 供 credits 清单用。

## 五、流程第 3 步：视频合成（FFmpeg 管线）

画面配齐后进入合成引擎（`src/lib/video-composer/composer.ts`，48KB），核心流程 `assembleComposeGraph` → `buildComposeInvocation` → `composeVideo`：自动配音 + 烧中文字幕 + 价格贴 + 背景音乐 + 转场，FFmpeg 真实合成出片。

### 5.1 全程不经 shell：execFile + filter_complex_script

**先把 filtergraph 写进临时文件，再用 `execFile` + `-filter_complex_script` 跑**：

```ts
const filterFile = join(outputDir, `filter_${Date.now()}.txt`);
await writeFile(filterFile, inv.filterComplex, "utf8");
const args = [...inv.inputArgs, "-filter_complex_script", filterFile, ...inv.outputArgs];
await composeLimiter(() =>
  execFileAsync(ffmpegBin(), args, { maxBuffer: 50 * 1024 * 1024, timeout: COMPOSE_TIMEOUT_MS })
);
```

这是 issue #13 的解——真实 6 镜合成的命令约 12KB、带 ~23 个换行，远超 `cmd.exe` 8191 字符上限，换行/反斜杠也会破坏 shell。`unshellFilter` 会把多出的反斜杠折半（`\\`→`\`），因为 `buildDrawtext` 预先做了 shell 转义但 shell 已经不在了。

**每个输入 clip 先归一成统一格式**，避免 concat/xfade 因像素格式/SAR/帧率不一致炸「Error reinitializing filters」：

```
const SEGMENT_NORM = "format=yuv420p,setsar=1,fps=30,settb=AVTB";
```

图片 clip（商品图 + 运镜）的关键技巧：`trim=end_frame=1` 抓一帧（`-loop 1` + `zoompan` 的 `d=` 会爆帧数），`tpad=stop_mode=clone:stop_duration=<dur>` 把末帧克隆到精确时长（`zoompan` 的整数 `d=duration*fps` 总差 1-2 帧，多镜会漂）。视频 clip 在时长差 1.001-1.35× 时**变速适配**而非尾部裁剪（尾部裁剪会切断关键帧链的尾帧接缝）；原生音频 clip 永不变速（会 desync）。

### 5.2 H.264 编码参数 + 并发控制

主合成趟用纯 CRF，不用 VBV（VBV 只在平台导出趟出现，见 §六）：

```
-c:v libx264 -preset <preset> -crf <crf>
-profile:v high -level:v 4.2 -pix_fmt yuv420p
-c:a aac -b:a 256k -movflags +faststart
```

| 预设 | 分辨率 | x264 preset | CRF |
|---|---|---|---|
| `fast` | 720p | `veryfast` | 26 |
| `standard`（默认） | 1080p | `medium` | 20 |
| `hd` | 1080p | `slow` | 17 |

`safeEncodeParams` 把 CRF 钳到 0-51、把 preset 限制在白名单（`ultrafast`…`veryslow`），因为这些值会被插进命令行——是一道**注入防线**。并发用 `createLimiter`（默认 `COMPOSE_MAX_CONCURRENCY=2`，钳到 1-8）+ 10 分钟超时（`COMPOSE_TIMEOUT_MS`），防止并行渲染压垮 CPU。

### 5.3 字幕两种渲染路径

**Path A —— rapid 短句卡（drawtext，默认）**：把旁白按标点 `[。！？；，、：…!?;,]`（加词边界的 `.`，不破坏 `9.9`）切成多张短语卡，逐张闪现，替换掉「整句静止」老法。切分后：合并过短碎片、卡数上限 `max(1, min(floor(total/0.6), 8))`（每张 ≥0.6s、最多 8 张），按时长权重分配（CJK 字=1、句末标点=1.3、句中标点=0.7），贴 TTS 节奏。渲染成堆叠 `drawtext`，每个用 `enable='between(t,start,end)'` 门控。

一个具体 bug 值得记：用 `expansion=none` 是为了让「50% off」里的 `%` 字面渲染——`\\%` 形式在 FFmpeg 8 会触发「Stray %」并把字幕整段置空。竖直位置用安全区比例：有商品卡时锚 `h*0.83`、无卡时 `h*0.78`（避开平台底部 UI 区），按底边锚让多行向上长不溢出。

**Path B —— 卡拉OK逐字高亮（libass / ASS 烧录）**：开启后整句留屏、每字随旁白点亮。**因为 ClipForge 自己生成 TTS、知道文本，所以不需要 ASR**——逐行时长按字/词比例切。ASS 用 `\k` 标签，**数字强调是电商爆款套路**：含数字的字（`50%`、`9.9`、`¥39`）自动放大到 `fontSize*1.35` 并改橙色 `&H000050FF`。

四档字幕预设（`caption-presets.ts`）：`standard`（白字+半透黑底）/ `bold`（大号粗描边无底板，重击风）/ `minimal`（小号细描边）/ `karaoke`。全入口（video 页、CLI `--caption`、MCP `captionPreset`）可选，带像素级回归测试。

### 5.4 转场四模式

| 模式 | 机制 | 模型 |
|---|---|---|
| `ai_start_end`（推荐） | AI 用「上一镜尾帧 + 下一镜关键帧」真生成转场 clip | Seedance 2.0 i2v、Vidu Q3 start-end |
| `ai_reference`（次选） | AI 以上一镜尾帧为参考图生成下一镜 | Kling 3.0、Veo 3.1、Vidu reference |
| `direct_concat` | 硬切 | — |
| `ffmpeg_fade` | FFmpeg 淡入淡出（兜底） | — |

`ffmpeg_fade` 模式视频用 `xfade=transition=fade:duration=0.5`、音频用 `acrossfade=d=0.5`——**关键是 `offset` 相对「已累积流长度」而非上一镜时长**，每镜后 `accumulated = max(0, accumulated + clipDuration - fadeDuration)`（重叠被减掉）。`FADE_DURATION = 0.5` 在视频 xfade、音频 acrossfade、字幕时间轴三处**必须完全一致**，否则会漂移。AI 模式产出的 clip 本身已含模型烘焙的交叉淡化，所以合成器对它们用 `concat` 而不是 `xfade`。

### 5.5 配音双通道 + BGM 侧链闪避

配音双通道：付费 OpenAI 兼容 TTS（音质更可控）；或**免费 Edge keyless TTS**（无需 Key，5 款中文音色可试听）做零配置兜底，逐镜生成口播并按配音时长卡点对齐字幕；时长探测失败按文本估时兜底，配音永不被拦腰剪断。

**BGM 混音 + 侧链闪避**：BGM 默认音量作曲器是 0.3、但 compose 路由的电商默认设成 0.18；`aloop=loop=-1:size=2e9` 无限循环填满整片；`bgmFadeOutSec` 默认 3 秒锚真实片尾做 `afade=t=out`。**闪避是 `sidechaincompress`、默认关**（`bgmDuck` opt-in）：

```
[curAudio]asplit=2[nar_mix][nar_key]
[bgm_vol][nar_key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[bgm_duck]
[nar_mix][bgm_duck]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[audio_final]
```

旁白 `asplit` 成 mix 副本 + 侧链 key，BGM 在旁白说话时自动压低、停顿时恢复。**`normalize=0` 是承重墙**——默认 `normalize=1` 会把每路输入除以路数，旁白会被砍到 ~50% 被淹没。最终响度归一到 `-14 LUFS / -1.5 TP / LRA 11`（社媒标准，避免平台二次压缩）。`audio-probe.ts` 还处理一个边界：Wikimedia 的免费 clip 常带**静默**音轨，`isAudibleFromVolumedetect` 解析 `volumedetect` 的 `max_volume`，低于 −50 dB 或 −∞ 视为静音，让 TTS 接管。

### 5.6 Ken Burns：让 AI 离商品图远点

`src/lib/motions.ts` + `easing.ts` 的运镜全是 `zoompan`，居中锚 `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`。默认 `ken_burns`：缓出缩放 1→1.3 带轻微横移，缓出表达式 `easeOut = (1-pow(1-p,2))`（二次缓、快起慢收）。6 个预设：`ken_burns`、`zoom_in_slow`、`zoom_out_slow`、`pan_left`、`pan_right`、`bounce`（弹入分段函数）、`static`。

compose 路由按分镜类型给默认运镜：`hook→zoom_in_slow`、`product_reveal→ken_burns`、`demo→pan_right`、`cta→static`。**整个 motions 模块的核心动机（源码注释原话）**：用运动模板**让 AI 离商品图远点**——商品原图的像素永远不会被 i2v 模型扭曲，这是「商品保真」在合成层的最后一道防线。

## 六、流程第 4 步：合规 + 多平台导出

### 6.1 AIGC 双层标识（对齐国标 GB 45438-2025）

国内平台对未标识 AI 内容自动限流。ClipForge 把标识做成两层、默认开：

**显式（画面角标，`compliance-overlays.ts`）**：左上角小 boxed drawtext，默认文字「内容由 AI 生成」，默认 4 秒（`AIGC_BADGE_SECONDS = 4`，对抖音 2026-07 的 ≥2 秒留余量、不超总时长）。compose 路由默认 `aigcBadge = body.aigcBadge !== false`——**默认开**。

**隐式（文件元数据，`compliance-metadata.ts`）**：往 MP4 标准标签里写三元组（因为 MP4 自定义 key 可能被静默丢弃，所以写可靠可读的标准 tag）：

```ts
const triple = `AIGC=1; 内容=AI生成合成; 服务提供者=${provider}; 内容制作编号=${id}`;
return [
  ["comment", triple],
  ["copyright", `AI-generated content by ${provider}`],
  ["description", `本视频含AI生成合成内容（服务提供者:${provider} 编号:${id}）`],
];
```

`provider` 默认 `"ClipForge"`，`id` 是 `projectId`。导出路由 `-map_metadata 0` 把它带到上传文件，`ffprobe` 可验。**注意这是 MP4 标准 atom（moov/udta 的 comment/copyright/description），不是 EXIF**。

### 6.2 广告法 + AI 带货政策扫描（只提醒、不砍功能）

**广告法违禁词（`ad-compliance.ts`）**——`checkAdCompliance()` 纯函数、warn 不阻断。四类风险词（保守以降低误报）：

| 类别 | 严重度 | 例词 |
|---|---|---|
| 绝对化用语（《广告法》第 9 条） | high | 最佳、最好、最强、国家级、顶级、极致、100%、百分百、绝对、销量第一、全网最低价、史上最低、第一品牌 |
| 医疗/虚假功效 | high | 根治、包治、治愈、药到病除、立竿见影、三天见效、抗癌、消炎、杀菌、处方药、药妆、医疗级 |
| 需认证宣称 | med | 纯天然、零添加、无添加、有机食品、100%天然 |
| 虚假紧迫 | med | 最后一天、仅此一天、错过不再有、马上涨价、明天恢复原价、最后几件 |

匹配用子串 `includes`，去重后移除被更长词包含的短词（`100%` 被 `100%天然` 吞掉），按 high 优先排序。同时扫 `voiceover` 和 `textOverlay.text`。

**AI 带货政策（`ai-commerce-compliance.ts`）**——抖音 2026-07 三条 warn 级提示：① 对比测评/开箱测评风格属平台禁止的「AI 生成测评类内容」；② 数字人禁入五类目（医疗/金融理财/美容功效/保健功效/教培效果，按商品文本扫美白/祛斑/减肥/降血压/提分等词）；③ AI 人物台词出现「亲测/实测有效/我用了一周/自用推荐」贴近「伪造使用效果」红线。

**二维码站外导流把关**：抖音 2026-07 起成片内二维码属站外导流（首违关橱窗 7 天、二违永久收回带货权限）——片尾扫码购买对 `platform=douyin` 默认拒绝，其他国内平台附风险提示，TikTok / Reels / Shorts 不受影响。

### 6.3 发布门禁 + 成片 QC

**发布门禁 `gate/route.ts`** 聚合 5 项成一份 `pass|warn|fail`：脚本就绪度（含显式标识是否真烧进去了）+ 成片 QC + 素材授权清单 + AI 带货政策 + 实拍/AI 占比计量。`--strict` 可接 CI，拦截时退出码 2。

**QC（`qc.ts`）** 两趟 ffprobe/ffmpeg：probe 查流完整性、尺寸、时长；信号趟用 `blackdetect=d=0.4:pix_th=0.1,freezedetect=n=-60dB:d=4 -af silencedetect=n=-50dB:d=2.5,ebur128 -f null -` 收集黑屏/静音/冻帧/响度。阈值都是对着真实合成产出调过的：黑屏 ≥2s 或占比 >10% fail、静音最长 ≥5s 或占比 >40% fail、响度 < −30 LUFS fail、冻帧 ≥4s 仅 warn（合法静镜可能误触）。

### 6.4 多平台导出：CRF + VBV 双约束卡码率线

一条视频要自动适配抖音/快手/视频号/TikTok/Reels/Shorts（9:16）与小红书（3:4）。码率线是单一真相源（`platform-specs.ts`，注释引 2026-07 社区实测/官方建议）：

| 平台 | 分辨率 | 比例 | maxVideoKbps | maxFps |
|---|---|---|---|---|
| 抖音 Douyin | 1080×1920 | 9:16 | **6000** | 60 |
| 快手 Kuaishou | 1080×1920 | 9:16 | 8000 | 60 |
| 小红书 Xiaohongshu | 1080×1440 | 3:4 | 8000 | 60 |
| 视频号 Shipinhao | 1080×1920 | 9:16 | 8000 | 60 |
| TikTok Shop | 1080×1920 | 9:16 | 8000 | 60 |
| Instagram Reels | 1080×1920 | 9:16 | **5000** | 60 |
| YouTube Shorts | 1080×1920 | 9:16 | 8000 | 60 |

逻辑：上传码率超线 → 平台强制二次转码变糊；压在线下 → 平台直接用你的像素。比例转换用 **blur-pad**（模糊放大背景 + 居中前景，不裁字幕、不黑边）。**CRF + VBV 双约束**：`-crf 20` 选质量，`vbvArgs(cap)` 硬卡峰值——预留 200kbps 给音频+容器开销，`videoCap = maxVideoKbps - 200`，`-bufsize = 2 × maxrate`（VOD 标准）。抖音 6000 → `-maxrate 5800k -bufsize 11600k`。导出后 `probeEncodeStats` 用 ffprobe 回读真实码率，`buildBitrateReport` 给出「实测 4120kbps ≤ 线 6000kbps（68%），预计免二次压缩」的双语报告。

### 6.5 电商效率工具

围绕主链路的规模化能力：商品库（商品信息录一次反复用）/ 批量出片（选 10 个商品一键批量全成片，免费路径 0 Key）/ 爆款模板（跑出数据的脚本存为模板）/ 爆款复刻（输入竞品爆款视频链接，ffmpeg 解析镜头切点出节奏骨架，AI 提取脚本逻辑换品重拍）/ 品牌设置（Logo 水印/品牌色/统一片尾）/ 人物管理 / A/B 多版本（同一条片重渲成不同字幕风格 + 配乐的变体，全程免 Key）/ 效果回流（发布后回填播放/点赞/成交，跨项目按品类聚合出哪种风格更卖，反灌下次脚本生成）。

## 六-补、完全不配 API Key，整条出片链路怎么走通

ClipForge 最反直觉的设计是：**一个 Key 都不配，也能从「一句话主题」或「一张商品图 + 商品名」走到一条带配音、字幕、BGM 的成片**。这一节把这条免 Key 闭环的每一环拆开看。

### 一个先决澄清：真正全程免 Key 的 LLM 只有 Ollama

README 早期宣传的「免 Key LLM」其实有两档，今天状况不同：

- **Ollama 本地** —— 唯一**真正全程免 Key、可离线**的选项。设置页预设填 `baseUrl: "http://127.0.0.1:11434/v1"`、`model: "qwen2.5"`、`apiKey: "ollama"`（占位符，Ollama 忽略它）。
  > 源码里有个 Windows 踩坑细节：baseUrl 用 `127.0.0.1` 而非 `localhost`——Windows 上 `localhost` 先解析到 `::1`（IPv6），而 Ollama 只绑 `127.0.0.1`，会导致连不上且报错信息看不出原因。设置存储有个 v3 迁移会把已保存的 `localhost:11434` 自动改写成 `127.0.0.1:11434`。
- **Pollinations** —— 旧的免 Key 地址 `text.pollinations.ai` **已停用（issue #19）**，只返回 402/502。新端点是 `gen.pollinations.ai/v1`，需要到 <https://enter.pollinations.ai/keys> **免费注册领 Key**（每日花粉额度）。所以它是「免费但需注册」，不是「免 Key」。v2 迁移会自动把旧地址改写到新端点、清掉过期的 `apiKey: "pollinations"` 占位符。

所以下文说「免 Key 闭环」，LLM 这一环默认指 **Ollama**（或用 CLI 的 `import` 命令导入已写好的脚本，完全绕过 LLM）。另外，没有 LLM Key 也能用 `/start` 首页的「自带脚本成片」入口：直接粘贴整段旁白，走的是 `import` 路径，不调 LLM。

### 三层免 Key 子系统（互相独立，各自优雅降级）

ClipForge 的免 Key 能力分三个**完全独立**的子系统，每个都有自己的降级链。理解这一点是理解整条闭环的关键：它们不共享逻辑，组合起来才是一条完整的出片链路。

```
┌─────────────────────────────────────────────────────────────┐
│  免 Key 出片链路（任一子系统缺 Key 都不阻塞，各自降级）        │
├─────────────────────────────────────────────────────────────┤
│  ① LLM 脚本生成     Ollama 本地  │  （或用 import 绕过 LLM）  │
│  ② 素材配画面        Openverse 图片 + Wikimedia 视频/音频     │
│  ③ 配音              Edge TTS（自研 keyless 客户端）          │
│  ④ BGM               Wikimedia CC 音频（无 Jamendo Key 时）   │
│  ⑤ 合成              本地 FFmpeg（无任何 Key）                │
└─────────────────────────────────────────────────────────────┘
```

#### ① LLM 脚本：Ollama + OpenAI SDK 统一封装

LLM 调用统一走 OpenAI SDK，免 Key 路由靠 baseUrl 字符串匹配区分（没有独立代码路径）。客户端工厂 `createLLMClient`（`src/lib/llm-error.ts`）：

```ts
export function createLLMClient(config: LLMClientConfig): OpenAI {
  const retryFreePool402 = isPollinations(config.baseUrl) && !config.apiKey;
  return new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey || "no-key",   // SDK 不接受空字符串；免 Key 端点会忽略它
    maxRetries: 3,
    fetch: tokenCapRetryFetch(retryFreePool402 ? freePoolRetryFetch() : fetch),
  });
}
```

关键点：**空 Key 会被替换成字面量 `"no-key"`**——因为 OpenAI Node SDK 对空 apiKey 直接抛错，而 Ollama/Pollinations 都接受任意非空 bearer。两个 `fetch` 包装器叠加：

- `tokenCapRetryFetch`（常开）：如果 provider 因为 token 上限报 400/422，自动去掉 `max_tokens` 重试一次（脚本生成硬编码 `max_tokens: 16000`，超过 Pollinations/Ollama 的上限）。
- `freePoolRetryFetch`（仅 Pollinations 无 Key 时开）：把 HTTP **402** 改写成 SDK 的可重试协议（`x-should-retry: true` + `retry-after-ms: 5000`），把默认 0.5/1/2 秒重试拉长到 5 秒（Pollinations 匿名档约 15 秒放行一次）。

Pollinations 的 `reasoningParams` 和 `batchCountFor` 两个 shim（前文 §3.2 讲过）也都是用 `/pollinations\.ai/i` 正则按 baseUrl 圈定的。

一个重要的弱模型防线：`parseScriptResponse` 里的 `isRealVoiceover()` 会拒绝那些只是把 schema 字段说明原样回吐的旁白（0.5B/1.5B 模型的真实失败模式）。源码注释点名 `qwen2.5:7b-instruct` 是能正常出结构化脚本的**下限**，更小的模型会被拦下并提示换模型。

#### ② 素材配画面：stock-fill 根本不碰 AI，是纯素材管道

这是最容易被 README 误导的点。README 暗示「没配生图模型时 stock-fill 会自动决定用免费素材」，但**源码里 `stock-fill` 从头到尾不调用任何 AI 生图模型**——它是纯素材获取管道。决策树在路由层（`/api/project/[id]/stock-fill`）：

```ts
const skipOf = (shot: Shot): ShotFillResult | null => {
  const sid = shot.shotId;
  if (!force && already.has(sid)) return { ... reason: "already has asset, skipped" };
  // product_image 分镜无条件跳过：合成时直接用商品原图保真，免费素材不能覆盖它
  if (shot.visualSource === "product_image") return { ... reason: "product-image shot, skipped" };
  if (!shotQuery(shot)) return { ... reason: "no search query" };
  return null;
};
```

关键设计：**`product_image` 分镜的跳过是无条件的**——不依赖 `force`，即使 `force=true` 也会跳过。这是「商品保真」在素材层的铁律：合成时 `assetByShot.get(shotId) ?? productImages[0]`，`product_image` 分镜没被 stock-fill 写过素材，自然落到 `productImages[0]`（上传的商品原图）。

零 Key 时聚合检索只会跑 **Openverse（图片/音频）+ Wikimedia（图片/视频/音频）**，因为 `isSourceAvailable` 要求 `keyless || 有 Key`：

| 源 | 零 Key 时 | 提供什么 |
|---|---|---|
| Openverse | ✅ 参与 | **图片**（无视频端点，视频请求会回退图片）+ 音乐/音效，商用 CC 强制，匿名配额 20/min·200/day |
| Wikimedia | ✅ 参与 | **唯一免 Key 视频源**（≤720p webm 转码）+ 免 Key BGM |
| Pixabay/Pexels/Coverr/Jamendo/Freesound | ❌ 静默跳过 | 需各自的免费 Key |
| 本地素材池 | ✅ 参与 | 用户上传的自有/自拍 B-roll |

`mediaType:"auto"`（README 里的 `footage:"auto"`）是「视频优先、缺则图片」的逐镜兜底，保证每镜都不空：

```ts
let asset = await fillShotStock({ ..., searchOpts });
// auto 模式：没找到视频 → 回退图片，保证分镜不空
if (!asset && autoMode && mediaType !== "image") {
  asset = await fillShotStock({ ..., searchOpts: { ...searchOpts, mediaType: "image" } });
}
```

因为 Openverse 没有视频，零 Key 的 `auto` 请求大多最终落到 Openverse 图片上。配合 `broadenQuery`（查无结果时逐级放宽到 `["abstract background", "lifestyle", "nature", "light"]`）和同源优先（§4.4 讲过的 union-find），生僻主题也不会让某镜空画面。

#### ③ 配音：自研 Edge TTS keyless 客户端（这是最硬的一块）

`src/lib/edge-tts.ts` 是一个**从零写的 keyless 客户端**，对接微软 Edge 浏览器「大声朗读」在线 TTS 服务（和 Python `edge-tts` 库同源）。零第三方依赖，只用 Node 内置 `WebSocket` + `crypto.subtle`。

**端点**：

```
wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1
```

**鉴权的巧妙之处——伪造 `Sec-MS-GEC` token**（没有 API Key，靠伪造 Edge 浏览器自己计算的 token）：

```ts
const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const SEC_MS_GEC_VERSION = process.env.EDGE_TTS_VERSION || "1-143.0.3650.75";

async function secMsGec(): Promise<string> {
  let ticks = (Math.floor(Date.now() / 1000) + 11644473600) * 10_000_000; // .NET ticks（自 1601）
  ticks -= ticks % 3_000_000_000; // 向下取整到 300 秒边界
  return sha256Upper(`${ticks}${TRUSTED_CLIENT_TOKEN}`);
}
```

即：**.NET ticks 向下取整到 5 分钟边界，拼接一个硬编码的「trusted client token」，SHA-256 哈希成大写十六进制**。这正是官方 `edge-tts` 的算法。`Sec-MS-GEC-Version` 伪装成某个 Edge 版本号（`1-143.0.3650.75`）；微软偶尔会轮换期望值导致旧值返回 403，所以可通过 `EDGE_TTS_VERSION` 环境变量覆盖而无需改代码。

握手时还要伪装成 Edge 的「大声朗读」扩展（`Origin: chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold` 是该扩展的真实 ID）。协议走 SSML，输出 `audio-24khz-48kbitrate-mono-mp3`，结果按 `{provider,voice,rate,pitch,text}` 内容寻址缓存避免重复请求。

**音色库**（`src/lib/tts-voices.ts`）11 款，默认 `zh-CN-XiaoxiaoNeural`（晓晓）：

```ts
export const FREE_TTS_VOICES = [
  { value: "zh-CN-XiaoxiaoNeural", label: "晓晓 · 温柔女声" },
  { value: "zh-CN-XiaoyiNeural",   label: "晓伊 · 活泼女声" },
  { value: "zh-CN-YunxiNeural",    label: "云希 · 阳光男声" },
  { value: "zh-CN-YunyangNeural",  label: "云扬 · 专业播报男声" },
  { value: "zh-CN-YunjianNeural",  label: "云健 · 沉稳解说男声" },
  { value: "en-US-AriaNeural",  label: "Aria · US English" },
  // en-GB / ja-JP / ko-KR / es-ES 各一
];
export const DEFAULT_FREE_VOICE = "zh-CN-XiaoxiaoNeural";
```

多角色剧情脚本能用免费多音色配音（`character-voices.ts`）：女声池 `[晓伊, 辽宁小北, 陕西小妮]`、男声池 `[云希, 云健, 云扬]`，**晓晓被故意排除在角色池外**，避免角色和旁白听起来完全一样。

#### ④ BGM：Jamendo → Wikimedia → 静音 的降级链

`src/lib/free-bgm.ts` 的 `fetchFreeBgm` 链：

```ts
if (process.env.JAMENDO_CLIENT_ID) {
  candidates = await searchJamendoTracks(query, { clientId: process.env.JAMENDO_CLIENT_ID, perPage: 10 });
}
// Openverse 音频常路由到 Freesound，需鉴权返回 401，所以不用它
if (candidates.length === 0) {
  candidates = await searchWikimediaAudio(query, { perPage: 10 });  // 免 Key 回退
}
```

即：**用户上传的 `bgmPath`**（最高优先）→ **Jamendo**（配了 Key 时，纯 CC-BY 真音乐库）→ **Wikimedia Commons 音频**（零 Key 回退）→ **null（无 BGM）**。代码注释明确说不用 Openverse 音频，因为它常路由到 Freesound、无鉴权返回 401。BGM 失败从不阻塞合成。

### 合成层如何无缝吃下「全免费素材」

合成路由（`/api/project/[id]/compose`）对每个素材**不区分来源**——只看文件扩展名判断是图片还是视频：

```ts
const isVideo = /\.(mp4|webm|mov|m4v|ogv|ogg|mkv|avi)$/i.test(local);
```

`.ogv`/`.ogg` 被特意纳入就是为 Wikimedia 的 Theora 容器——源码注释：「免费素材库（Wikimedia）也会返回 .ogv 等容器，必须纳入视频判定，否则被当静态图 → 冻结帧 + 丢音轨」。

TTS 选择逻辑（零 Key 时走 Edge）：

```ts
const ttsConfig = (四字段齐全) ? body.ttsConfig : undefined;
const useFreeTts = !ttsConfig && freeTts?.enabled === true;
const audio = ttsConfig
  ? await generateSpeech(text, ttsConfig)                    // 付费（带熔断器）
  : await generateSpeechFree(text, { voice: freeVoice });     // 免费 Edge keyless
```

付费 TTS 有个 `CircuitBreaker(2, 30_000)`——连续失败 2 次（多半是 Key 坏了）就熔断 30 秒，避免每个分镜都单独超时；免费 Edge 路径无熔断器。**TTS 失败不阻塞**——返回 `undefined`，该分镜静音但视频照样合成。一个边界情况：如果某个分镜的 stock 视频自带可闻音频（Wikimedia clip），`videoHasAudio()` 会探测到，这时不再叠加 TTS（避免双重声音）。

### 一句话主题成片：免 Key 闭环最干净的演示

主题成片是免 Key 路径的最佳演示，因为它连商品图都不需要。入口在 `/project/topic`（或 `/start` 的 topic 模式）：

```
输入一句话（如"在家如何泡一杯手冲咖啡"）
    ↓ POST /api/topic/script（Ollama 写旁白脚本）
    ↓ POST /api/project/[id]/stock-fill（Openverse/Wikimedia 逐镜配画面）
    ↓ POST /api/project/[id]/compose（本地 FFmpeg + Edge TTS + Wikimedia BGM）
    ↓
一条带配音、字幕、BGM 的竖屏短视频
```

主题脚本的 system prompt 明确要求「这是一条没有商品的内容向短视频，不要出现任何带货、卖点、价格、下单引导」，并且**每镜必须带英文 `searchTerms`**（prompt 里写「【必填】1-3 个英文检索词…每个分镜都必须有，否则无法自动配画面」）——这是让 stock-fill 能逐镜配画面的前提。5 种旁白风格（知识科普 / 情感故事 / 生活方式 / 励志金句 / 旅行风光），时长 15/25/40 秒可选。

### 最小配置清单（零环境变量）

跑通免 Key 端到端，需要的东西很少：

| 需要 | 说明 |
|---|---|
| ClipForge 服务跑起来 | Docker 镜像内置 FFmpeg + 中文字幕字体，或本地 `pnpm dev` |
| 本地 FFmpeg + ffprobe | Docker 镜像已内置；本地开发需 `brew/apt install ffmpeg` |
| Ollama + 一个 7B+ 模型 | `ollama serve` + `ollama pull qwen2.5:7b-instruct`；设置页点「Ollama 本地」预设 |

**零环境变量**——`EDGE_TTS_VERSION`、`JAMENDO_CLIENT_ID`、`OPENVERSE_TOKEN` 等全是可选升级项（用来打补丁或升级素材源质量），不是必需。

成片长这样（以主题成片为例）：

| 槽位 | 来源 | 需 Key? |
|---|---|---|
| 各镜画面 | stock 视频（Wikimedia webm）优先，缺则 Openverse 图片 | 否 |
| 旁白 | Edge TTS mp3（`zh-CN-XiaoxiaoNeural` 默认） | 否 |
| BGM | Wikimedia Commons CC 音频，0.18 音量混音 | 否 |
| 字幕 | libass 烧录中文，按 TTS 时长对齐 | 否 |
| AIGC 角标 | 「内容由 AI 生成」左上角默认 4 秒 | 不适用 |
| 最终合成 | 本地 FFmpeg，H.264 + AAC，-14 LUFS 响度归一 | 否 |

输出：9:16 竖屏 mp4，720p 或 1080p，带烧录字幕、AIGC 合规角标、CTA 叠片。

> **带货场景的免 Key 差异**：商品图的视觉分析（vision 模型）在免 Key 时会**静默跳过**——`analyzeProduct` 的 try/catch 会吞掉任何失败，脚本照常生成（LLM 只拿到商品名 + 描述文本）。除非你给 Ollama 拉一个多模态 tag（如 `llava`/`qwen2.5-vl`）并设 `visionModel`，否则商品图分析不生效。另外，带货视频的 AI B-roll（AI 生成场景画面）需要付费生图/生视频 Key，免 Key 时这些分镜靠免费素材补——但**商品原图分镜永远用上传的商品图**（`product_image` 跳过保护），所以「商品保真」这一核心不受影响。

## 七、Agent 一句话出片（MCP / CLI / Skill）

ClipForge 把整条出片流水线也教给了 AI 编程助手，三种装法：

- **MCP Server**（`clipforge_product_script` 贴商品链接直接出带货脚本，详见 `mcp/README.md`）
- **agent Skill**（`skills/clipforge-video/SKILL.md`）
- 装法任选：`npx skills add xixihhhh/clipforge` 一条命令；Claude Code 里 `/plugin marketplace add xixihhhh/clipforge` 装 skill+MCP 二合一；或把 `skills/README` 的 Setup prompt 贴给 agent 让它自装

**命令行 CLI** 覆盖完整生命周期（先启动实例、设好 `CLIPFORGE_LLM_*` 环境变量）：

```bash
node bin/clipforge.mjs trends --geo US                                # 拉热搜选题
node bin/clipforge.mjs create --topic "在家手冲咖啡" --quality hd --bgm # 一句话出片
node bin/clipforge.mjs import --project <id> --file my-script.txt     # 自带稿子出片
node bin/clipforge.mjs dub --project <id> --lang en                   # 换语种译制（出海）
node bin/clipforge.mjs cover --project <id> --title "..."             # 生成封面图
node bin/clipforge.mjs qr --project <id> --platform douyin            # 扫码购买二维码（UTM 追踪）
node bin/clipforge.mjs qc --project <id>                              # 成片质检（黑屏/静音/响度）
node bin/clipforge.mjs gate --project <id> --strict                   # 发布门禁一键体检
node bin/clipforge.mjs credits --project <id> --format md             # 素材授权清单（投流审核用）
node bin/clipforge.mjs native --project <id> --strength medium        # 原生感处理（反 AI 精致感）
node bin/clipforge.mjs preview --project <id>                         # 预览 GIF
node bin/clipforge.mjs carousel --project <id>                        # 小红书图文卡片
```

## 八、30 秒跑起来

```bash
# Docker 自托管（最快，无需装 Node / FFmpeg）
docker run -d -p 3000:3000 -v clipforge-data:/data ghcr.io/xixihhhh/clipforge
# 打开 http://localhost:3000 —— 免 Key 即可出片（免费素材 + Edge TTS）
```

镜像内置 ffmpeg 与中文字幕字体，数据持久化在 `clipforge-data` 卷。本地开发用 pnpm（`packageManager` 已声明，**勿用 npm install**）：

```bash
git clone https://github.com/xixihhhh/clipforge.git
cd clipforge && pnpm install && pnpm dev
```

## 九、文中提到的资源汇总

为方便追溯，下面把项目 README 与源码中明确点名的所有外部资源按类别整理。

### 9.1 项目自身入口

- 仓库：[xixihhhh/clipforge](https://github.com/xixihhhh/clipforge)
- 官网：<https://xixihhhh.github.io/clipforge/>
- Docker 镜像：`ghcr.io/xixihhhh/clipforge`（见仓库 Packages）
- Skill 安装：<https://skills.sh/xixihhhh/clipforge>
- 同作者姊妹项目 ✂️ [HotClip 爆款切片](https://github.com/xixihhhh/hotclip)——把长视频（播客/直播回放）AI 切成竖屏爆款片段，补齐 ClipForge Roadmap 中「长视频切爆款」的能力。

### 9.2 AI 生图 / 生视频平台（7 大）

| 平台 | 用途 | 鉴权/调用方式 | 备注 |
|---|---|---|---|
| **Atlas Cloud** ⭐ | LLM + 生图 + 生视频聚合 | `POST /model/generateImage\|generateVideo` → `GET /model/prediction/{id}` | 一个 Key 全覆盖，推荐首选；唯一实现 `submitVideoTask`/`uploadLocalMedia` |
| **fal.ai** | 生图 + 生视频 | `POST /{modelId}` → `GET /{modelId}/requests/{id}/status`；`Authorization: Key <key>` | taskId 编码为 `modelId::requestId` |
| **Replicate** | 生图 + 生视频 | `POST /models/{owner}/{name}/predictions` → `GET /predictions/{id}` | predictions API 统一调用 |
| **火山引擎（方舟 Ark）** | Seedream / Seedance | 图片同步 `POST /images/generations`；视频异步 `POST /contents/generations/tasks` 多模态 content 数组 | 字节系，电影级画质，原生音频 |
| **阿里百炼** | 通义万相 / 万相 | 全异步，`X-DashScope-Async: enable`；`input.img_url`/`ref_img` | 商品图生视频效果好；size 用 `*` 分隔 |
| **硅基流动** | Kolors / Qwen-Image | 图片同步 `POST /images/generations`；视频异步 `POST /video/submit` | 国产高性价比 |
| **OpenAI** | gpt-image-2 / 1.5 | `POST /images/generations`（t2i）/ `POST /images/edits`（i2i，multipart） | 仅图片、无视频；b64 包装成 data URI |

### 9.3 具体模型（2026.06 官方文档确认）

- **视频生成**：Seedance 2.0 ⭐（原生音频、4-15s、最高 1440p）/ Kling 3.0 Pro / Veo 3 / Vidu Q3 Pro（首尾帧过渡神器）/ Hailuo 2.3 / Luma Ray 2 / Seedance 1.5 Pro / 万相 2.6
- **图片生成**：GPT Image 2 ⭐（任意分辨率、9:16 竖屏直出、商品保真编辑）/ Nano Banana 2 / FLUX.2 Pro / Recraft V4 Pro / Seedream 5.0 Lite（支持 edit 锁定主体重绘）/ 万相

> T2V = 文生视频, I2V = 图生视频。带货场景建议优先用 **edit 类模型**（GPT Image 2 / Seedream edit）对商品原图重绘背景，锁定商品主体不被篡改。

### 9.4 LLM 选项（脚本生成，走 OpenAI 兼容协议）

- 一键预设：Atlas Cloud / **OpenRouter**（400+ 模型）/ DeepSeek / Kimi / 智谱 / 豆包 / OpenAI
- 免费选项：**Ollama 本地**（离线免 Key，建议 7B 及以上 instruct 模型，如 `qwen2.5:7b-instruct`；0.5B/1.5B 写不出结构化脚本会被拦下）/ **Pollinations**（注册领每日免费额度，Key 在 <https://enter.pollinations.ai/keys> 免费领取；旧免 Key 地址 `text.pollinations.ai` 已停用只返回 402/502，新端点 `gen.pollinations.ai/v1`）

### 9.5 多源免费素材库（10 源真相）

| 源 | 免 Key | 媒体 | 鉴权 |
|---|:---:|---|---|
| **Openverse** | ✅ | 图片 / 音乐 / 音效 | 可选 `Authorization: Bearer <token>` + `User-Agent`；商用 CC 强制 |
| **Wikimedia Commons** | ✅ | 图片 / **视频** / 音频 | 无；唯一免 Key 视频源（≤720p webm 转码） |
| **Pixabay** | 免费 Key | 视频 / 图片 | `?key=<API_KEY>` 查询参数 |
| **Pexels** | 免费 Key | 视频 / 图片 | `Authorization: <API_KEY>` 头（无 Bearer） |
| **Coverr** 🆕 | 免费 Key | 视频 | `Authorization: Bearer <API_KEY>`；2000 次/时 |
| **Jamendo** 🆕 | 免费 Key | 音乐 BGM | `?client_id=<ID>`；NC/ND/SA 服务端+客户端双重排除 |
| **Freesound** 🆕 | 免费 Key | 音效 | `?token=<API_KEY>`；`filter=license:("Attribution" OR "Creative Commons 0")` |
| **本地素材** | ✅ | 视频 / 图片 | 无；`fs.copyFile` |
| **NASA 影像库** | ✅ | 视频 / 图片 | 无；公共领域，显式选用不进聚合 |
| **Internet Archive** | ✅ | 视频 / 图片 | 无；`publicdomain` 强制，显式选用不进聚合 |

> 没有 API 的优质免费站（Mixkit / Videezy / Mazwai 等）走「手动下载 → 本地素材池」路线（`data/uploads`），注意逐条核对各站授权。

### 9.6 TTS 配音

- 免费：**微软 Edge keyless TTS**（无需 Key，5 款中文音色，中英日韩西）
- 付费：OpenAI 兼容 TTS（音质更可控）

### 9.7 关键工具链与标准

- **FFmpeg**（视频合成核心，`brew install ffmpeg` / `apt install ffmpeg`）
- **Drizzle ORM** + SQLite（启动自动 migrate）
- **Electron** + electron-builder（桌面打包）
- **Vitest** + **Playwright**（测试）
- **GitHub Actions**（CI/CD）
- **libass**（字幕渲染）/ **Remotion**（可选动效元素，`npm run render:element`）
- **zoompan** / **xfade** / **acrossfade** / **sidechaincompress** / **loudnorm**（FFmpeg 关键滤镜）
- 国标 **GB 45438-2025**（AIGC 标识，显式 + 隐式双层）
- 《广告法》第 9 条（绝对化用语）

### 9.8 Agent / 自动化集成

- **MCP Server**（Model Context Protocol）
- **agent Skill**（`skills/clipforge-video/SKILL.md`）
- **CLI**（`bin/clipforge.mjs`）

## 十、和同类工具的对比与定位

| 你在意的 | **ClipForge** | 开源同类（MoneyPrinterTurbo 等） | 商业 AI 视频 SaaS（Creatify / Topview 等） | 剪映等剪辑软件 |
|---|:---:|:---:|:---:|:---:|
| **商品保真**（原图不变形出镜） | ✅ image-to-image 锁定 | ❌ 关键词配库存素材 | ⚠️ 部分支持 | ➖ 手动贴原图 |
| **动态镜头质量** | ✅ i2v + 链式无缝转场 + 19 运镜可控可重跑 | ❌ 静图 / 库存视频拼接 | ✅ 多为 i2v | ➖ 取决于素材 |
| **剧情短剧 + 多角色配音** | ✅ 十种风格，每角色免费专属音色 | ❌ 单旁白朗读 | ⚠️ 数字人口播为主 | ❌ 全手工 |
| **国内平台合规** | ✅ 默认开 | ❌ | ❌（多面向海外） | ⚠️ 部分标识 |
| **0 成本出整片** | ✅ 免 Key 免费素材 + 免费配音 | ✅ 也有免费路径 | ❌ 按条 / 订阅付费 | ⚠️ 基础免费 |
| **无水印 + 数据在本机** | ✅ 开源自部署全本地 | ✅ | ❌ 云端处理常带水印 | ❌ 云端处理 |
| **Agent / 自动化**（MCP · CLI · 批量） | ✅ MCP + CLI + Skill + 批量 | ⚠️ 部分有 API | ⚠️ 部分有 API | ❌ |

> 以各产品公开资料为准（2026-07），功能随版本演进；ClipForge 与上述产品均无关联，仅作选型参考。

从选型角度看，ClipForge 的差异化定位很清晰：**不是又一个「文生视频」模型前端，而是一条「带货合规」全链路工程**——它把商品保真（image-to-image 锁定）、i2v 动态镜头（运镜引擎 + 首尾帧 + 19 预设 + 风格 Look）、国内平台合规（GB 45438-2025 AIGC 标识 + 广告法 + 发布门禁）、零成本兜底（三层独立免 Key 子系统：Ollama + Openverse/Wikimedia + 自研 Edge TTS keyless 客户端 + 本地 FFmpeg，任一环节缺 Key 都优雅降级）、Agent 化（MCP / CLI / Skill）这五件事整合进一个自部署、无水印、AGPL-3.0 的开源包里。对电商卖家、MCN、品牌方、想二次开发构建 AI 视频 SaaS 的独立开发者，都是 2026 年值得重点评估的一条路线。

## 十一、Roadmap

**已完成**：出片主链路（AI 脚本 + 商品保真素材 + i2v 动态镜头 + FFmpeg 合成 + 多平台导出）、零成本闭环（免 Key 素材 + 免费 Edge TTS + 本地合成）、发布把关（发布门禁 + AIGC 标识 + 违禁词扫描）、规模化与增长（批量出片 / 爆款模板与复刻 / A/B 变体 / 数据飞轮 / 热点选题）、集成与分发（MCP / CLI / Skill / Docker / Electron / 中英双语）。

**规划（真正的 AI 剪辑能力）**：

- [ ] 自动字幕 ASR（whisper / transformers.js）→ 烧录字幕
- [ ] 导入已有视频做剪辑 + 去静音瘦身
- [x] 长视频切爆款片段——同作者 [HotClip](https://github.com/xixihhhh/hotclip) 已可用
- [ ] 数字人口型（fal.ai Lipsync）/ 时间轴编辑

---

> 免责声明：ClipForge 是独立开源项目，与抖音、快手、小红书、TikTok、YouTube、Shopify、Amazon、Microsoft、OpenAI 及任何模型供应商无官方关联；使用第三方模型与素材请遵守其各自条款。
