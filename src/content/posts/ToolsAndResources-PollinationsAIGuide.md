---
title: 【工具分享】Pollinations.AI：一个 API 搞定文本、图像、音频、视频生成
published: 2026-05-02
description: 深入介绍开源 AI 平台 Pollinations.AI，涵盖图像生成、文本对话、语音合成、视频生成等功能的 API 使用方法、SDK 集成与 MCP 对接实践
lang: zh
tags: [工具分享]
---

Pollinations.AI 是一个总部位于柏林的开源生成式 AI 平台，提供完全免费的文本、图像、音频、视频生成 API。它的最大特点是**无需注册、无需 API Key 即可使用**，且整个代码库在 GitHub 上以 MIT 协议开源。截至 2026 年 4 月，已有超过 500 个社区项目基于 Pollinations 构建，日均处理 150 万次请求，累计生成了超过 2 亿张图片。

如果你之前了解的 Pollinations 还停留在"免费生图 API"的印象，那值得重新认识一下——它现在已经发展为一个覆盖**文本对话、图像生成、视频合成、语音播报**的全栈 AI 平台。

## 核心能力一览

| 能力 | 支持模型 | 端点 |
|------|----------|------|
| 图像生成 | Flux、Z-Image、GPT Image、Seedream、Kontext、Wan Image 等 | `GET /image/{prompt}` |
| 文本生成 | GPT-5、Claude、Gemini、DeepSeek、Qwen、Mistral 等 | `POST /v1/chat/completions` |
| 视频生成 | Seedance、Veo（alpha） | `GET /video/{prompt}` |
| 语音合成 | OpenAI TTS、ElevenLabs 等 30+ 声音 | `GET /audio/{text}` |
| 语音转写 | Whisper 系列 | `POST /v1/audio/transcriptions` |
| 视觉理解 | 多模态模型 | `POST /v1/chat/completions`（带图片输入） |

统一 API 地址为 `https://gen.pollinations.ai`，所有功能共用一个端点，路径区分生成类型。同时完全兼容 OpenAI SDK 格式，只需将 `base_url` 换成 Pollinations 即可。

## 免费额度与访问层级

Pollinations 的免费策略在同类平台中非常大方：

| 层级 | 频率限制 | 可用模型 | 注册要求 |
|------|----------|----------|----------|
| 匿名 | 1 次请求 / 15 秒 | 基础模型 | 不需要 |
| Seed（免费注册） | 1 次请求 / 5 秒 | 标准模型 | 注册即可 |
| Flower（付费） | 1 次请求 / 3 秒 | 高级模型 | 付费订阅 |
| Nectar（企业） | 无限制 | 全部模型 | 联系官方 |

注册用户还可以每周获得 1.5 Pollen（平台积分）的免费额度，用于调用付费模型（如 GPT Image 2、NanoBanana Pro 等）。Pollen 的换算比例约为 $1 ≈ 1 Pollen。

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

| 模型 | 说明 | 免费 |
|------|------|------|
| `flux` | Flux Schnell，快速高质量 | 是 |
| `zimage` | Z-Image Turbo，6B Flux + 2x 超分（默认模型） | 是 |
| `gptimage` | GPT Image 1 Mini | 是 |
| `gptimage-large` | GPT Image 1.5 | 需积分 |
| `gpt-image-2` | GPT Image 2（最新一代） | 需积分 |
| `kontext` | FLUX.1 Kontext，支持图生图 | 是 |
| `seedream` / `seedream5` | 阿里 Seedream 系列 | 是 |
| `wan-image` | 阿里 Wan 2.7 Image，支持图编辑 | 是 |
| `qwen-image` | 通义万相 | 是 |
| `nanobanana` | Gemini 2.5 Flash Image | 需积分 |
| `klein` | FLUX.2 Klein 4B，快速生成+编辑 | 是 |

> 完整模型列表可通过 `GET https://gen.pollinations.ai/image/models` 获取。

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

### 可用文本模型（部分）

| 模型 | 说明 |
|------|------|
| `openai` / `openai-fast` / `openai-large` | GPT 系列 |
| `claude` / `claude-fast` / `claude-large` / `claude-opus-4.7` | Anthropic Claude 系列 |
| `gemini` / `gemini-fast` / `gemini-large` | Google Gemini 系列 |
| `deepseek` / `deepseek-pro` | DeepSeek 系列 |
| `qwen-coder` / `qwen-large` | 通义千问系列 |
| `grok` / `grok-large` | xAI Grok 系列 |
| `mistral` / `mistral-large` | Mistral 系列 |
| `perplexity-fast` / `perplexity-reasoning` | Perplexity 搜索增强 |
| `gemini-search` | Gemini 联网搜索 |

> 完整列表通过 `GET https://gen.pollinations.ai/v1/models` 获取，无需认证。

## 视频生成

Pollinations 近期新增了视频生成能力，目前处于 alpha 阶段，支持以下模型：

- **Seedance**：字节跳动 Seedance 文生视频
- **Seedance Pro**：支持图生视频
- **Veo**：Google Veo 文生视频（支持带音频）

```bash
curl "https://gen.pollinations.ai/video/ocean%20waves%20crashing%20on%20a%20beach?model=seedance&duration=5" \
  -H "Authorization: Bearer YOUR_KEY" \
  -o video.mp4
```

视频生成目前消耗 Pollen 积分，但基础模型的消耗非常低。

## 音频：语音合成与转写

### 文字转语音（TTS）

支持 OpenAI TTS 的全部声音（alloy、echo、fable、onyx、nova、shimmer）以及 30+ ElevenLabs 声音：

```bash
# 简单 GET
curl "https://gen.pollinations.ai/audio/Hello%20from%20Pollinations?voice=nova" -o speech.mp3

# OpenAI 兼容
curl https://gen.pollinations.ai/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"model": "tts-1", "input": "你好，Pollinations！", "voice": "nova"}' \
  -o speech.mp3
```

### 音乐生成

使用 ElevenLabs 的音乐生成模型：

```typescript
import { generateAudio } from '@pollinations_ai/sdk'

const music = await generateAudio('upbeat jazz piano', {
  model: 'elevenmusic',
  duration: 30,
})
await music.saveToFile('jazz.mp3')
```

### 语音转文字

兼容 OpenAI Whisper 格式，支持音频文件转写为文本。

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

**快速验证**：直接在浏览器地址栏输入 `https://image.pollinations.ai/prompt/你的描述` 即可测试图像生成。

**项目集成**：注册获取 API Key 后，使用 OpenAI 兼容格式接入，几乎所有现成的 OpenAI SDK 代码只需改一行 `base_url` 就能切换到 Pollinations。

**大规模调用**：建议注册并使用 Secret Key（`sk_` 前缀），无频率限制，适合服务端批量调用。可通过模型范围限制（scoping）功能将 Key 绑定到特定模型，降低泄露风险。

**免费额度规划**：匿名用户 + 注册免费积分 + Seed 层级的每日额度，对于个人项目和学习完全足够。只有在高频生产环境才需要考虑购买 Pollen。

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
