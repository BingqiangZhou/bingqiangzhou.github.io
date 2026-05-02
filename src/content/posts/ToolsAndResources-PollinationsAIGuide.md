---
title: 【工具分享】Pollinations.AI：一个 API 搞定文本、图像、音频、视频生成
published: 2026-05-02
description: 深入介绍开源 AI 平台 Pollinations.AI，涵盖图像生成、文本对话、语音合成、视频生成等功能的 API 使用方法、SDK 集成与 MCP 对接实践
lang: zh
tags: [工具分享]
---

Pollinations.AI 是一个总部位于柏林的开源生成式 AI 平台，提供免费的文本、图像、音频、视频生成 API。它的最大特点是**基础功能无需注册、无需 API Key 即可使用**，且整个代码库在 GitHub 上以 MIT 协议开源。截至 2026 年 4 月，已有超过 500 个社区项目基于 Pollinations 构建，日均处理 150 万次请求，累计生成了超过 2 亿张图片。

需要特别说明的是，Pollinations **并非所有功能都免费**。它采用分层策略：基础模型（Flux、GPT Image 1 Mini 等）完全免费，而高端模型（GPT Image 2、Claude Opus、Gemini Pro 等）需要消耗 Pollen 积分。本文会明确标注每一项功能的免费/付费情况。

如果你之前了解的 Pollinations 还停留在"免费生图 API"的印象，那值得重新认识一下——它现在已经发展为一个覆盖**文本对话、图像生成、视频合成、语音播报**的全栈 AI 平台。

## 免费 vs 付费：先看这一张表

| | 免费可用（无需付费） | 需要 Pollen 积分 |
|--|----------------------|-------------------|
| **图像** | Flux、Z-Image、GPT Image 1 Mini、Kontext、Seedream、Wan Image、通义万相、Klein | GPT Image 1.5、GPT Image 2、NanoBanana Pro、Grok Imagine |
| **文本** | GPT（基础）、Claude（基础）、Gemini（基础）、DeepSeek、Qwen、Mistral | Claude Opus 4.7、GPT Large、Gemini Large 等高级变体 |
| **视频** | Seedance（基础） | Seedance Pro、Veo |
| **音频** | OpenAI TTS（6 种声音） | ElevenLabs 高级声音、音乐生成 |

- **匿名用户**：1 次请求 / 15 秒，可使用免费模型，图片可能带水印
- **注册用户**（免费）：1 次请求 / 5 秒 + 每周 1.5 Pollen 免费积分，可去水印
- **付费用户**：更高频率 + 高级模型 + 更多 Pollen

> 注册即送每周 1.5 Pollen，Pollen 换算 $1 ≈ 1 Pollen。对于个人项目和日常使用，免费额度基本够用。

## 核心能力一览

| 能力 | 免费模型 | 付费模型 | 端点 |
|------|----------|----------|------|
| 图像生成 | Flux、Z-Image、GPT Image 1 Mini、Kontext 等 | GPT Image 2、NanoBanana Pro 等 | `GET /image/{prompt}` |
| 文本生成 | GPT、Claude、Gemini、DeepSeek、Qwen 等 | Claude Opus、GPT Large 等 | `POST /v1/chat/completions` |
| 视频生成 | Seedance（有限） | Seedance Pro、Veo | `GET /video/{prompt}` |
| 语音合成 | OpenAI TTS（6 声音） | ElevenLabs（30+ 声音） | `GET /audio/{text}` |
| 语音转写 | Whisper（基础） | — | `POST /v1/audio/transcriptions` |
| 视觉理解 | 多模态模型 | — | `POST /v1/chat/completions`（带图片输入） |

统一 API 地址为 `https://gen.pollinations.ai`，所有功能共用一个端点，路径区分生成类型。同时完全兼容 OpenAI SDK 格式，只需将 `base_url` 换成 Pollinations 即可。

## 免费额度与访问层级

Pollinations 采用**分层免费 + 积分付费**的混合模式：

| 层级 | 费用 | 频率限制 | 免费模型 | 付费模型 | 水印 |
|------|------|----------|----------|----------|------|
| 匿名 | 免费 | 1 次 / 15 秒 | 可用 | 不可用 | 有 |
| Seed | 免费注册 | 1 次 / 5 秒 | 可用 | 可用（消耗 Pollen） | 可去除 |
| Flower | 付费订阅 | 1 次 / 3 秒 | 可用 | 可用（消耗 Pollen） | 无 |
| Nectar | 企业级 | 无限制 | 可用 | 可用（消耗 Pollen） | 无 |

**免费可以获得什么**：
- 所有基础图像模型的无限次生成（Flux、Z-Image、Kontext 等）
- 所有基础文本模型的无限次对话（GPT、Claude 基础版、Gemini 等）
- 注册后每周 1.5 Pollen 免费积分，可用于体验付费模型
- Seed 层级贡献者可获得每日 3 Pollen 额度

**什么需要花钱**：
- 高端图像模型（GPT Image 2、NanoBanana Pro 等）按次消耗 Pollen
- 高端文本模型（Claude Opus 4.7、GPT Large 等）按 token 消耗 Pollen
- 视频生成（Veo 等）消耗 Pollen
- ElevenLabs 高级声音和音乐生成消耗 Pollen
- 超出免费频率限制的请求

Pollen 换算比例约为 $1 ≈ 1 Pollen，注册用户每周免费获得 1.5 Pollen，活跃贡献者（Seed 层级）每日额外获得 3 Pollen。

## 图像生成

图像生成是 Pollinations 最早也是最核心的功能。最简单的用法——直接在浏览器地址栏输入：

```
https://image.pollinations.ai/prompt/a cat wearing sunglasses
```

即可得到一张根据描述生成的图片。支持的参数包括：

- `model`：模型选择，默认 `flux`，可选 `gptimage`、`zimage`、`turbo` 等
- `width` / `height`：图片尺寸，默认 1024×1024
- `seed`：随机种子，相同 seed + prompt 可复现结果
- `nologo`：去除水印（需注册）
- `enhance`：AI 自动优化提示词
- `safe`：安全过滤

Python 调用示例：

```python
import pollinations

model = pollinations.Image(model="flux", width=1024, height=1024)
image = model("A futuristic cityscape at sunset")
image.save("city.jpg")
```

Node.js / TypeScript 调用示例：

```typescript
import { generateImage } from '@pollinations_ai/sdk'

const image = await generateImage('a robot painting', {
  model: 'zimage',
  width: 1920,
  height: 1080,
})
await image.saveToFile('robot.png')
```

OpenAI SDK 兼容方式：

```python
from openai import OpenAI

client = OpenAI(base_url="https://gen.pollinations.ai/v1", api_key="your_key")
response = client.images.generate(model="flux", prompt="a cat in space", size="1024x1024")
```

### 可用图像模型

**免费模型**（匿名即可使用）：

| 模型 | 说明 | 特点 |
|------|------|------|
| `flux` | Flux Schnell，快速高质量 | 2-3 秒出图，适合日常使用 |
| `zimage` | Z-Image Turbo，6B Flux + 2x 超分 | 默认模型，画质更好 |
| `gptimage` | GPT Image 1 Mini | OpenAI 出品，文字渲染好 |
| `kontext` | FLUX.1 Kontext | 支持**图生图**，基于参考图编辑 |
| `seedream` / `seedream5` | 阿里 Seedream 系列 | 中文提示词友好 |
| `wan-image` | 阿里 Wan 2.7 Image | 支持图片编辑，最高 2K |
| `qwen-image` | 通义万相 | 阿里出品，支持图编辑 |
| `klein` | FLUX.2 Klein 4B | 快速生成 + 编辑 |
| `turbo` | Turbo 加速模型 | 速度最快，质量略低 |

**付费模型**（需消耗 Pollen 积分）：

| 模型 | 说明 | 备注 |
|------|------|------|
| `gptimage-large` | GPT Image 1.5 | 画质提升，文字渲染更强 |
| `gpt-image-2` | GPT Image 2 最新一代 | 当前最强 OpenAI 图像模型 |
| `nanobanana` | Gemini 2.5 Flash Image | 支持图片输入 |
| `nanobanana-2` | Gemini 3.1 Flash Image | 更新版本 |
| `nanobanana-pro` | Gemini 3 Pro Image（4K） | 最高画质，带 Thinking |
| `grok-imagine` | xAI Grok Imagine | xAI 官方生图 |
| `grok-imagine-pro` | Grok Imagine Pro（Aurora） | 高端版本 |
| `p-image` / `p-image-edit` | Pruna 系列 | 快速生成 + 图片编辑 |
| `nova-canvas` | AWS Nova Canvas | Bedrock 图片生成与编辑 |
| `wan-image-pro` | Wan 2.7 Image Pro | 4K 画质，Thinking 模式 |
| `seedream-pro` | Seedream Pro | 高端版本 |

> 完整模型列表可通过 `GET https://gen.pollinations.ai/image/models` 实时获取（无需认证）。

## 文本生成

Pollinations 的文本生成能力同样强大，支持 GPT-5、Claude（含 Opus 4.7）、Gemini、DeepSeek、Mistral、Qwen 等主流模型，且完全兼容 OpenAI Chat Completions 格式。

最简单的 GET 调用：

```
https://text.pollinations.ai/What is artificial intelligence?
```

带系统提示词和流式输出的 POST 调用：

```bash
curl https://gen.pollinations.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{
    "model": "claude",
    "messages": [
      {"role": "system", "content": "你是一个有帮助的AI助手。"},
      {"role": "user", "content": "用Python写一个快速排序"}
    ],
    "stream": true
  }'
```

### 可用文本模型

**免费模型**（匿名或注册即可使用）：

| 模型 | 说明 |
|------|------|
| `openai` / `openai-fast` | GPT 基础版，日常对话首选 |
| `claude` / `claude-fast` | Claude 基础版 |
| `gemini` / `gemini-fast` | Gemini 基础版 |
| `deepseek` | DeepSeek V3.2 |
| `qwen-coder` | 通义千问编码模型 |
| `mistral` | Mistral 基础版 |
| `grok` | xAI Grok 基础版 |
| `gemini-flash-lite-3.1` | Gemini Flash 轻量版 |
| `kimi` / `kimi-k2.6` | Moonshot Kimi 系列 |
| `llama` | Meta Llama |
| `glm` | 智谱 GLM |
| `nova-fast` / `nova` | Amazon Nova 系列 |

**付费模型**（需消耗 Pollen 积分）：

| 模型 | 说明 |
|------|------|
| `openai-large` | GPT 高级版 |
| `claude-large` / `claude-opus-4.7` | Claude 高级版 / 旗舰版 |
| `gemini-large` | Gemini 高级版 |
| `deepseek-pro` | DeepSeek Pro |
| `qwen-large` / `qwen-vision` | 通义千问高级版 / 视觉版 |
| `grok-large` | xAI Grok 高级版 |
| `mistral-large` | Mistral 高级版 |
| `qwen-coder-large` | 通义千问编码高级版 |

**特殊功能模型**（免费）：

| 模型 | 说明 |
|------|------|
| `gemini-search` | Gemini 联网搜索 |
| `perplexity-fast` / `perplexity-reasoning` | Perplexity 搜索增强推理 |
| `openai-audio` / `openai-audio-large` | 语音输入/输出 |
| `polly` | Pollinations 自研模型 |

> 完整列表通过 `GET https://gen.pollinations.ai/v1/models` 获取，无需认证。

## 视频生成

Pollinations 近期新增了视频生成能力，目前处于 alpha 阶段。**视频生成需要消耗 Pollen 积分，不支持免费使用**：

- **Seedance**：字节跳动 Seedance 文生视频 — 付费
- **Seedance Pro**：支持图生视频 — 付费
- **Veo**：Google Veo 文生视频（支持带音频）— 付费

```bash
curl "https://gen.pollinations.ai/video/ocean%20waves%20crashing%20on%20a%20beach?model=seedance&duration=5" \
  -H "Authorization: Bearer YOUR_KEY" \
  -o video.mp4
```

视频生成是 Pollinations 中为数不多完全需要付费的功能，注册用户可以用每周免费获得的 1.5 Pollen 来体验。

## 音频：语音合成与转写

### 文字转语音（TTS）

**免费**：支持 OpenAI TTS 的 6 种基础声音（alloy、echo、fable、onyx、nova、shimmer）。

**付费**：30+ ElevenLabs 高级声音和音乐生成，需消耗 Pollen 积分。

```bash
# 免费 — OpenAI TTS 声音
curl "https://gen.pollinations.ai/audio/Hello%20from%20Pollinations?voice=nova" -o speech.mp3

# 免费 — OpenAI 兼容格式
curl https://gen.pollinations.ai/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"model": "tts-1", "input": "你好，Pollinations！", "voice": "nova"}' \
  -o speech.mp3
```

### 音乐生成（付费）

使用 ElevenLabs 的音乐生成模型，需消耗 Pollen 积分：

```typescript
import { generateAudio } from '@pollinations_ai/sdk'

const music = await generateAudio('upbeat jazz piano', {
  model: 'elevenmusic',
  duration: 30,
})
await music.saveToFile('jazz.mp3')
```

### 语音转文字（免费）

兼容 OpenAI Whisper 格式，支持音频文件转写为文本。基础语音转写在免费模型范围内。

## 视觉理解与多模态

通过 OpenAI 兼容的 Chat Completions 端点，可以传入图片 URL 进行视觉理解：

```python
from openai import OpenAI

client = OpenAI(base_url="https://gen.pollinations.ai/v1", api_key="your_key")
response = client.chat.completions.create(
    model="openai",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "描述这张图片的内容"},
            {"type": "image_url", "image_url": {"url": "https://example.com/photo.jpg"}}
        ]
    }]
)
print(response.choices[0].message.content)
```

## 开发者工具生态

Pollinations 提供了丰富的开发者工具，覆盖多种语言和场景：

### Python SDK

```bash
pip install pollinations
```

支持图像生成、文本生成（含流式）、语音合成、语音转写等全功能，且支持同步和异步调用。

### Node.js SDK

```bash
npm install @pollinations_ai/sdk
```

提供 `generateImage`、`generateText`、`generateVideo`、`generateAudio`、`chat` 等完整 API，支持流式输出和浏览器环境。

### React Hooks

```typescript
import { usePollensionsImage, usePollinationsText } from '@pollinations/react'

function MyComponent() {
  const imageUrl = usePollinationsImage("a beautiful landscape", { width: 800, height: 600 })
  return <img src={imageUrl} alt="AI generated" />
}
```

### CLI 工具

```bash
npx @pollinations_ai/cli "a cat in space" --model flux --output cat.jpg
```

支持结构化 JSON 输出，适合脚本和 AI Agent 集成。

### MCP Server

Pollinations 提供了官方的 Model Context Protocol (MCP) 服务器，可以让 Claude、Cursor 等 AI 助手直接调用生成能力：

```bash
npx @pollinations_ai/mcp install-claude-mcp
```

安装后，Claude Desktop 可以直接通过对话生成图片、音频和视频，无需任何额外配置。MCP 服务器提供以下工具：

| 工具 | 功能 |
|------|------|
| `generateImageUrl` | 根据提示词生成图片 URL |
| `generateImage` | 生成图片并返回 base64 数据 |
| `generateVideo` | 生成视频（Veo、Seedance） |
| `respondAudio` | 文字转语音 |
| `generateText` | 文本生成 |
| `chatCompletion` | OpenAI 兼容对话（含函数调用） |

## 国内可用性

Pollinations 的服务在国内可以正常访问，这也是它在国内开发者社区中受欢迎的重要原因之一。根据社区反馈：

- 图像生成 API（`image.pollinations.ai`）国内直连可用
- 文本生成 API（`text.pollinations.ai` / `gen.pollinations.ai`）国内直连可用
- 官网 `pollinations.ai` 可正常访问
- 单个 IP 匿名访问建议间隔 10-15 秒以上，避免触发频率限制
- 使用 API Key 注册后频率限制可提升至 5 秒/次

许多国内开发者已经在基于 Pollinations 构建应用，包括中文版的 AI 图片生成器、词典配图工作流、微信公众号配图工具等。

## 实际使用建议

**零成本快速体验**：直接在浏览器地址栏输入 `https://image.pollinations.ai/prompt/你的描述` 即可测试免费图像生成，无需任何注册。

**个人项目推荐方案**：注册免费账号，获得 Seed 层级权限（5 秒/次频率 + 去水印 + 每周 1.5 Pollen）。免费模型（Flux、Z-Image、GPT Image 1 Mini）对个人项目完全够用。

**何时需要付费**：只有在以下场景才需要考虑购买 Pollen——需要 GPT Image 2 等高端图像模型、需要视频生成、需要 Claude Opus 等旗舰文本模型、或者需要高频批量调用（每秒多次）。

**项目集成**：注册获取 API Key 后，使用 OpenAI 兼容格式接入，几乎所有现成的 OpenAI SDK 代码只需改一行 `base_url` 就能切换到 Pollinations。注意区分 Publishable Key（`pk_` 前缀，客户端用，有频率限制）和 Secret Key（`sk_` 前缀，服务端用，无频率限制）。

**API Key 安全**：可通过模型范围限制（scoping）功能将 Key 绑定到特定免费模型，即使 Key 泄露也不会消耗 Pollen 积分。

## 参考

- [Pollinations.AI 官网](https://pollinations.ai/)
- [Pollinations GitHub 仓库](https://github.com/pollinations/pollinations)
- [Pollinations API 文档](https://gen.pollinations.ai/)
- [Pollen 积分系统 FAQ](https://github.com/pollinations/pollinations/blob/main/enter.pollinations.ai/POLLEN_FAQ.md)
- [Python SDK（PyPI）](https://pypi.org/project/pollinations/)
- [Node.js SDK（npm）](https://www.npmjs.com/package/@pollinations_ai/sdk)
- [MCP Server（npm）](https://www.npmjs.com/package/@pollinations_ai/mcp)
- [知乎：Pollinations 开源免费的 AIGC 服务](https://zhuanlan.zhihu.com/p/32080523924)
- [腾讯云开发者社区：Pollinations 免费 API 玩出花样](https://cloud.tencent.cn/developer/article/2506012)
- [掘金：这个开源 AI 平台把文生图/音/字全包了](https://juejin.cn/post/7494157121387659273)
- [祁劲松的博客：免费文字生成图片平台 pollinations.ai 的利用](https://jamesqi.com/%E5%8D%9A%E5%AE%A2/%E5%85%8D%E8%B4%B9%E6%96%87%E5%AD%97%E7%94%9F%E6%88%90%E5%9B%BE%E7%89%87%E5%B9%B3%E5%8F%B0pollinations.ai%E7%9A%84%E5%88%A9%E7%94%A8)
