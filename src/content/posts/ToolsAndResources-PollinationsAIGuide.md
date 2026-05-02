---
title: 【工具分享】Pollinations.AI：一个 API 搞定文本、图像、音频、视频生成
published: 2026-05-02
description: 深入介绍开源 AI 平台 Pollinations.AI，涵盖图像生成、文本对话、语音合成、视频生成等功能的 API 使用方法、SDK 集成与 MCP 对接实践
lang: zh
tags: [工具分享]
---

Pollinations.AI 是一个总部位于柏林的开源生成式 AI 平台，提供文本、图像、音频、视频生成 API。整个代码库在 GitHub 上以 MIT 协议开源，截至 2026 年 4 月已有超过 500 个社区项目基于 Pollinations 构建，日均处理 150 万次请求，累计生成了超过 2 亿张图片。

如果你之前了解的 Pollinations 还停留在"免费生图 API"的印象，那值得重新认识一下——它现在已经发展为一个覆盖**文本对话、图像生成、视频合成、语音播报**的全栈 AI 平台。

## 重要：旧版 API vs 新版 API

Pollinations 目前存在**两套 API**，使用方式和免费策略完全不同：

| | 旧版 API（Legacy） | 新版统一 API（Unified） |
|--|---------------------|--------------------------|
| **基础地址** | `image.pollinations.ai` / `text.pollinations.ai` | `gen.pollinations.ai` |
| **是否需要 API Key** | **不需要** | **必须**（所有生成端点均返回 401） |
| **状态** | 仍可用，但文本 API 已标记 deprecated | 推荐使用，功能完整 |

### 逐端点实测对比（2026 年 5 月 2 日，无 API Key）

| 端点 | 旧版地址 | 旧版状态 | 新版地址 | 新版状态 |
|------|----------|----------|----------|----------|
| 图像生成 | `GET image.pollinations.ai/prompt/{prompt}` | ✅ 200 | `GET gen.pollinations.ai/image/{prompt}` | ❌ 401 |
| 文本生成（简单） | `GET text.pollinations.ai/{prompt}` | ✅ 200 | `GET gen.pollinations.ai/text/{prompt}` | ❌ 401 |
| 文本生成（Chat） | `POST text.pollinations.ai/openai` | ✅ 200 | `POST gen.pollinations.ai/v1/chat/completions` | ❌ 401 |
| 视频生成 | — | — | `GET gen.pollinations.ai/video/{prompt}` | ❌ 401 |
| 语音合成（GET） | — | — | `GET gen.pollinations.ai/audio/{text}` | ❌ 401 |
| 语音合成（POST） | — | — | `POST gen.pollinations.ai/v1/audio/speech` | ❌ 401 |
| 语音转写 | — | — | `POST gen.pollinations.ai/v1/audio/transcriptions` | ❌ 401 |
| 模型列表 | ✅ 可用 | — | ✅ 可用 | — |

### 旧版 API 无 Key 可用模型

**图像**（`image.pollinations.ai`）：flux ✅、zimage ✅、gptimage ✅、gptimage-large ✅、gpt-image-2 ✅、turbo ✅、seedream5 ✅、wan-image ✅、qwen-image ✅、klein ✅、kontext ❌（500 错误）

**文本**（`text.pollinations.ai`）：仅 `openai` / `openai-fast` ✅。claude ❌ 404、gemini ❌ 404、deepseek ❌ 404、mistral ❌ 404、grok ❌ 404（均已标记 deprecated）

**结论**：旧版图像 API 仍然好用，支持 10+ 模型且**无需注册**，这是 Pollinations "免费无需 Key" 口碑的来源。但旧版文本 API 仅剩一个模型，且没有视频/音频功能。要使用完整功能，**必须注册获取 API Key 使用新版 API**。

> 注册地址：<https://enter.pollinations.ai>，注册免费，每周送 1.5 Pollen 积分。

## 免费额度与访问层级

Pollinations 采用**分层免费 + 积分付费**的混合模式：

| 层级 | 费用 | 频率限制 | 免费模型 | 付费模型 | 水印 |
|------|------|----------|----------|----------|------|
| 匿名（旧版 API） | 免费 | 1 次 / 15 秒 | 少量基础模型 | 不可用 | 有 |
| Seed（免费注册） | 免费 | 1 次 / 5 秒 | 全部基础模型 | 可用（消耗 Pollen） | 可去除 |
| Flower（付费订阅） | 付费 | 1 次 / 3 秒 | 全部基础模型 | 可用（消耗 Pollen） | 无 |
| Nectar（企业） | 企业级 | 无限制 | 全部基础模型 | 可用（消耗 Pollen） | 无 |

**免费可以获得什么**：
- 旧版图像 API：Flux、GPT Image 1 Mini、Z-Image 等模型的无限次生成，**无需注册**
- 新版 API（注册后）：全部基础模型的无限次生成 + 每周 1.5 Pollen 免费积分
- Seed 层级贡献者每日额外获得 3 Pollen

**什么需要 Pollen 积分**：
- 部分高端图像模型（GPT Image 2、NanoBanana 全系列、Seedream 5、Grok Imagine 等）
- 大部分视频生成模型（Veo、Seedance、Wan、Grok Video Pro）
- Pollen 换算：$1 ≈ 1 Pollen

**意外惊喜**：所有文本模型（包括 Claude Opus 4.7、GPT Large 等）在 API 元数据中均标记为 `paid_only=false`，意味着注册用户可以免费使用。部分视频模型（LTX-2.3、Nova Reel）也标记为免费。

## 免费 vs 付费总览

以下基于 2026 年 5 月 2 日 `gen.pollinations.ai/image/models` 接口返回的实际数据：

| | 免费（`paid_only=false`） | 付费（`paid_only=true`，消耗 Pollen） |
|--|---------------------------|----------------------------------------|
| **图像** | Flux、Z-Image、GPT Image 1 Mini / 1.5、Kontext、Wan Image、通义万相、Klein | GPT Image 2、NanoBanana 全系列、Seedream 5、Grok Imagine 全系列、Wan Image Pro、Pruna 系列、Nova Canvas |
| **文本** | 全部模型均为免费（含 Claude Opus 4.7、GPT Large 等） | — |
| **视频** | **LTX-2.3**、**Nova Reel**（免费但需 API Key） | Veo、Seedance / Seedance Pro、Wan、Grok Video Pro、Pruna Video |
| **音频** | OpenAI TTS（6 种声音）、Qwen TTS、ElevenLabs TTS、AceStep、ElevenMusic（音乐） | — |

## 图像生成

图像生成是 Pollinations 最早也是最核心的功能，也是免费体验最好的部分。

### 旧版 API（无需 API Key）

直接在浏览器地址栏输入：

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

### 新版 API（需要 API Key）

```bash
# 简单 GET
curl "https://gen.pollinations.ai/image/a%20beautiful%20sunset?key=YOUR_KEY" -o sunset.jpg

# OpenAI SDK 兼容
```

```python
from openai import OpenAI

client = OpenAI(base_url="https://gen.pollinations.ai/v1", api_key="your_key")
response = client.images.generate(model="flux", prompt="a cat in space", size="1024x1024")
```

### Python SDK

```python
import pollinations

model = pollinations.Image(model="flux", width=1024, height=1024)
image = model("A futuristic cityscape at sunset")
image.save("city.jpg")
```

### Node.js SDK

```typescript
import { generateImage } from '@pollinations_ai/sdk'

const image = await generateImage('a robot painting', {
  model: 'zimage',
  width: 1920,
  height: 1080,
})
await image.saveToFile('robot.png')
```

### 可用图像模型

**免费模型**（`paid_only=false`，注册后使用新版 API）：

| 模型 | 说明 | 特点 |
|------|------|------|
| `flux` | Flux Schnell，快速高质量 | 2-3 秒出图，适合日常使用 |
| `zimage` | Z-Image Turbo，6B Flux + 2x 超分 | 默认模型，画质更好 |
| `gptimage` | GPT Image 1 Mini | OpenAI 出品，文字渲染好 |
| `gptimage-large` | GPT Image 1.5 | 比上面画质更高，**仍然免费** |
| `kontext` | FLUX.1 Kontext | 支持**图生图**，基于参考图编辑 |
| `wan-image` | 阿里 Wan 2.7 Image | 支持图片编辑，最高 2K |
| `qwen-image` | 通义万相 | 阿里出品，支持图编辑 |
| `klein` | FLUX.2 Klein 4B | 快速生成 + 编辑 |
| `turbo` | Turbo 加速模型 | 速度最快，质量略低 |

**付费模型**（`paid_only=true`，需消耗 Pollen 积分）：

| 模型 | 说明 | 备注 |
|------|------|------|
| `gpt-image-2` | GPT Image 2 最新一代 | 当前最强 OpenAI 图像模型 |
| `nanobanana` | Gemini 2.5 Flash Image | 支持图片输入 |
| `nanobanana-2` | Gemini 3.1 Flash Image | 更新版本 |
| `nanobanana-pro` | Gemini 3 Pro Image（4K） | 最高画质，带 Thinking |
| `seedream5` | Seedream 5.0 Lite | 字节出品，支持联网搜索和推理 |
| `grok-imagine` / `grok-imagine-pro` | xAI Grok Imagine 系列 | xAI 官方生图 |
| `p-image` / `p-image-edit` | Pruna 系列 | 快速生成 + 图片编辑 |
| `nova-canvas` | AWS Nova Canvas | Bedrock 图片生成与编辑 |
| `wan-image-pro` | Wan 2.7 Image Pro | 4K 画质，Thinking 模式 |

> 完整模型列表可通过 `GET https://gen.pollinations.ai/image/models` 实时获取（无需认证）。

## 文本生成

### 旧版 API（无需 API Key，但模型极少）

```
https://text.pollinations.ai/What is artificial intelligence?
```

实测仅 `openai` / `openai-fast` 一个模型可用，其他模型（claude、gemini、deepseek、mistral、qwen 等）全部返回 404。旧版文本 API 已标记为 deprecated。

### 新版 API（需要 API Key，模型丰富）

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

完全兼容 OpenAI Chat Completions 格式，支持流式输出、函数调用、视觉输入等。

### 可用文本模型

**所有文本模型均为免费**（`paid_only=false`），注册获取 API Key 后即可使用：

| 模型 | 说明 |
|------|------|
| `openai` / `openai-fast` / `openai-large` | GPT 系列，large 为高级版 |
| `claude` / `claude-fast` / `claude-large` / `claude-opus-4.7` | Claude 全系列，**含旗舰 Opus 4.7** |
| `gemini` / `gemini-fast` / `gemini-large` | Gemini 全系列 |
| `deepseek` / `deepseek-pro` | DeepSeek 全系列 |
| `qwen-coder` / `qwen-coder-large` / `qwen-large` / `qwen-vision` | 通义千问全系列 |
| `grok` / `grok-large` | xAI Grok 全系列 |
| `mistral` / `mistral-large` | Mistral 全系列 |
| `kimi` / `kimi-k2.6` | Moonshot Kimi 系列 |
| `llama` | Meta Llama |
| `glm` | 智谱 GLM |
| `nova-fast` / `nova` | Amazon Nova 系列 |
| `minimax` | MiniMax |

**特殊功能模型**（同样免费）：

| 模型 | 说明 |
|------|------|
| `gemini-search` | Gemini 联网搜索 |
| `perplexity-fast` / `perplexity-reasoning` | Perplexity 搜索增强推理 |
| `openai-audio` / `openai-audio-large` | 语音输入/输出 |
| `midijourney` / `midijourney-large` | 音乐生成相关 |
| `polly` | Pollinations 自研模型 |

> 完整列表通过 `GET https://gen.pollinations.ai/v1/models` 获取，无需认证。

## 视频生成

Pollinations 的视频生成能力目前处于 alpha 阶段。需要 API Key 才能调用。

**免费视频模型**（`paid_only=false`）：

| 模型 | 说明 |
|------|------|
| `ltx-2` | LTX-2.3，快速文生视频 + 超分，最低 0.005 Pollen/秒 |
| `nova-reel` | AWS Nova Reel，6-120 秒视频，720p，0.08 Pollen/秒 |

**付费视频模型**（`paid_only=true`，需消耗 Pollen 积分）：

| 模型 | 说明 | 价格 |
|------|------|------|
| `veo` | Google Veo 3.1 Fast | 0.15 Pollen/秒 |
| `seedance` | 字节 Seedance Lite | 按Token计费 |
| `seedance-pro` | 字节 Seedance Pro-Fast | 按Token计费 |
| `wan` | 阿里 Wan 2.6，支持音频 | 0.075 Pollen/秒 |
| `wan-fast` | 阿里 Wan 2.2，快速低成本 | 0.015 Pollen/秒 |
| `grok-video-pro` | xAI Grok Video Pro，720p | 0.075 Pollen/秒 |
| `p-video` | Pruna Video，最高 1080p | 0.036 Pollen/秒 |

```bash
curl "https://gen.pollinations.ai/video/ocean%20waves?model=ltx-2&duration=5&key=YOUR_KEY" \
  -o video.mp4
```

## 音频：语音合成、音乐生成与转写

所有音频模型均为免费（`paid_only=false`），需通过新版 API + API Key 调用。

### 文字转语音（TTS）

| 模型 | 说明 |
|------|------|
| `openai-audio` / `openai-audio-large` | OpenAI TTS，支持 alloy、echo、fable、onyx、nova、shimmer 等声音 |
| `elevenlabs` | ElevenLabs TTS，30+ 高级声音 |
| `qwen-tts` | 通义千问语音合成 |
| `qwen-tts-instruct` | 通义千问指令式 TTS |

```bash
# OpenAI 兼容格式
curl https://gen.pollinations.ai/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"model": "tts-1", "input": "你好，Pollinations！", "voice": "nova"}' \
  -o speech.mp3
```

### 音乐生成（免费）

| 模型 | 说明 |
|------|------|
| `elevenmusic` | ElevenLabs 音乐生成 |
| `acestep` | AceStep 音乐生成 |

```typescript
import { generateAudio } from '@pollinations_ai/sdk'

const music = await generateAudio('upbeat jazz piano', {
  model: 'elevenmusic',
  duration: 30,
})
await music.saveToFile('jazz.mp3')
```

### 语音转文字（免费）

兼容 OpenAI Whisper 格式，支持音频文件转写为文本。通过 `POST /v1/audio/transcriptions` 调用。

## 视觉理解与多模态

通过新版 API 的 Chat Completions 端点，可以传入图片 URL 进行视觉理解：

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

安装后，Claude Desktop 可以直接通过对话生成图片、音频和视频。MCP 服务器提供以下工具：

| 工具 | 功能 |
|------|------|
| `generateImageUrl` | 根据提示词生成图片 URL |
| `generateImage` | 生成图片并返回 base64 数据 |
| `generateVideo` | 生成视频（Veo、Seedance） |
| `respondAudio` | 文字转语音 |
| `generateText` | 文本生成 |
| `chatCompletion` | OpenAI 兼容对话（含函数调用） |

## 国内可用性

Pollinations 的服务在国内可以正常访问，这也是它在国内开发者社区中受欢迎的重要原因之一：

- 旧版图像 API（`image.pollinations.ai`）国内直连可用，无需注册
- 旧版文本 API（`text.pollinations.ai`）国内直连可用，但仅 openai-fast 模型
- 新版统一 API（`gen.pollinations.ai`）国内直连可用，需 API Key
- 官网 `pollinations.ai` 可正常访问
- 单个 IP 匿名访问建议间隔 10-15 秒以上，避免触发频率限制
- 注册后频率限制可提升至 5 秒/次

许多国内开发者已经在基于 Pollinations 构建应用，包括中文版的 AI 图片生成器、词典配图工作流、微信公众号配图工具等。

## 实际使用建议

**零成本快速体验图像生成**：直接在浏览器输入 `https://image.pollinations.ai/prompt/你的描述`，flux/gptimage/zimage 等模型均可用，无需任何注册。这是最简单、最零门槛的体验方式。

**注册后解锁全部能力**：注册免费账号获取 API Key，即可使用新版 API 的完整模型阵容（Claude、Gemini、DeepSeek、通义千问等），并获得每周 1.5 Pollen 免费积分来体验付费模型。

**何时需要付费**：只有以下场景需要考虑购买 Pollen——需要 GPT Image 2 等高端图像模型、需要视频生成、需要 Claude Opus 等旗舰文本模型、或者需要高频批量调用。

**项目集成**：新版 API 完全兼容 OpenAI SDK，只需改一行 `base_url`。注意区分 Publishable Key（`pk_` 前缀，客户端用）和 Secret Key（`sk_` 前缀，服务端用，无频率限制）。可通过模型范围限制（scoping）功能将 Key 绑定到特定免费模型，即使 Key 泄露也不会消耗 Pollen 积分。

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
