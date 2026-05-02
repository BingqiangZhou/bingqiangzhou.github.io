---
title: 【工具分享】Pollinations.AI：一个 API 搞定文本、图像、音频、视频生成
published: 2026-05-02
description: 深入介绍开源 AI 平台 Pollinations.AI，涵盖图像生成、文本对话、语音合成、视频生成等功能的 API 使用方法、SDK 集成与 MCP 对接实践
lang: zh
tags: [工具分享]
---

Pollinations.AI 是一个总部位于柏林的开源生成式 AI 平台（MIT 协议），提供文本、图像、音频、视频的一站式生成 API。截至 2026 年 4 月，已有 500+ 社区项目基于它构建，日均处理 150 万次请求。

它的核心吸引力在于：**注册后即可免费使用包括 Claude、Gemini、GPT、DeepSeek 在内的数十个 AI 模型**，而且完全兼容 OpenAI SDK 格式——改一行 `base_url` 就能接入。

## 三分钟快速上手

不用注册，不用写代码，在浏览器地址栏直接输入以下地址即可体验：

**生成一张图片**：

```
https://image.pollinations.ai/prompt/a cute cat wearing a tiny hat, digital art
```

**问 AI 一个问题**：

```
https://text.pollinations.ai/用中文解释什么是量子计算
```

把提示词换成你想要的内容，回车即可看到结果。这是旧版 API，无需任何注册就能用。如果需要更多模型和功能，往下看。

## 旧版 vs 新版 API

Pollinations 目前有两套 API，区别很大：

| | 旧版（Legacy） | 新版（Unified） |
|--|-----------------|------------------|
| **地址** | `image.pollinations.ai` / `text.pollinations.ai` | `gen.pollinations.ai` |
| **需要 API Key** | 不需要 | 必须 |
| **图像模型** | flux、gptimage、zimage 等 10+ 模型 ✅ | 全部模型，需 Key |
| **文本模型** | 仅 openai/openai-fast ✅，其余 404 | 全部模型，需 Key |
| **视频/音频** | 不支持 | 全部功能，需 Key |
| **状态** | 仍可用，文本 API 已标记 deprecated | 推荐使用 |

> 旧版图像 API 是 Pollinations "免费无需 Key" 口碑的来源——10+ 图像模型免注册可用。但要使用 Claude、Gemini、视频生成、语音合成等完整功能，**必须注册获取 API Key**。注册地址：<https://enter.pollinations.ai>（免费，每周送 1.5 Pollen 积分）。

## 定价：免费额度与 Pollen 积分

### 访问层级

| 层级 | 费用 | 频率限制 | 水印 |
|------|------|----------|------|
| 匿名（旧版 API） | 免费 | 1 次 / 15 秒 | 有 |
| Seed（免费注册） | 免费 | 1 次 / 5 秒 | 可去除 |
| Flower（付费订阅） | 付费 | 1 次 / 3 秒 | 无 |
| Nectar（企业） | 企业级 | 无限制 | 无 |

### 免费 vs 付费模型一览

基于 2026 年 5 月 2 日 `gen.pollinations.ai` 接口实际返回数据：

| | 免费 | 付费（消耗 Pollen） |
|--|------|---------------------|
| **图像** | Flux、Z-Image、GPT Image 1 Mini/1.5、Kontext、Wan Image、通义万相、Klein（共 9 个） | GPT Image 2、NanoBanana 系列、Seedream 5、Grok Imagine 系列、Pruna 系列、Nova Canvas、Wan Image Pro（共 11 个） |
| **文本** | **全部免费**（含 Claude Opus 4.7、GPT Large、Gemini Large 等 30+ 模型） | — |
| **视频** | LTX-2.3、Nova Reel | Veo、Seedance、Wan、Grok Video Pro、Pruna Video |
| **音频** | **全部免费**（OpenAI TTS、ElevenLabs TTS、Qwen TTS、ElevenMusic、AceStep） | — |

注册用户每周免费获得 1.5 Pollen 积分，Seed 层级贡献者每日额外获得 3 Pollen，可用于体验付费模型。Pollen 换算 $1 ≈ 1 Pollen。

## 图像生成

### 快速调用

**旧版（无需 Key）**：

```
https://image.pollinations.ai/prompt/a sunset over mountains?model=flux&width=1920&height=1080&seed=42
```

**新版（需 Key）— OpenAI SDK 兼容**：

```python
from openai import OpenAI

client = OpenAI(base_url="https://gen.pollinations.ai/v1", api_key="your_key")
response = client.images.generate(model="flux", prompt="a cat in space", size="1024x1024")
```

**参数说明**：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `model` | 模型选择 | `flux` |
| `width` / `height` | 图片尺寸 | 1024×1024 |
| `seed` | 随机种子，相同 seed + prompt 可复现结果 | 随机 |
| `nologo` | 去除水印（需注册） | false |
| `enhance` | AI 自动优化提示词 | false |
| `safe` | 安全过滤 | false |
| `transparent` | 透明背景（仅 gptimage 系列支持） | false |

### Prompt 技巧

- **英文提示词效果通常更好**：多数模型以英文训练数据为主，`a cyberpunk city at night, neon lights, rain` 比"赛博朋克城市夜景"效果更稳定
- **阿里系模型中文友好**：`wan-image`、`qwen-image`、`seedream5` 对中文提示词理解较好
- **用 seed 复现结果**：同一个 prompt + seed 组合会生成相同的图片，方便对比不同模型或迭代调整
- **尺寸影响风格**：横屏（1920×1080）适合风景，竖屏（1080×1920）适合人像/手机壁纸，方形（1024×1024）通用
- `enhance=true` 可让 AI 自动扩充你的提示词，适合简短描述时提升画面细节

### 图生图与图片编辑

`kontext` 模型支持基于参考图的生成和编辑（需 API Key）：

```python
from openai import OpenAI

client = OpenAI(base_url="https://gen.pollinations.ai/v1", api_key="your_key")
# 图片编辑
response = client.images.edit(
    model="kontext",
    prompt="change the background to a beach sunset",
    image="https://example.com/photo.jpg",
)
```

新版 API 还支持 `gptimage` 系列的图片输入，用于风格转换、局部修改等场景。

### 可用图像模型

**免费模型**（`paid_only=false`）：

| 模型 | 说明 | 最佳场景 |
|------|------|----------|
| `flux` | Flux Schnell，2-3 秒出图 | 日常使用、快速原型 |
| `zimage` | Z-Image Turbo + 2x 超分 | 需要更高画质时 |
| `gptimage` | GPT Image 1 Mini | 图中文字渲染 |
| `gptimage-large` | GPT Image 1.5 | gptimage 的升级版 |
| `kontext` | FLUX.1 Kontext | **图生图 / 图片编辑** |
| `wan-image` | Wan 2.7 Image | 中文提示词、图片编辑 |
| `qwen-image` | 通义万相 | 中文提示词 |
| `klein` | FLUX.2 Klein 4B | 快速生成 + 编辑 |
| `turbo` | Turbo 加速 | 速度优先 |

**付费模型**（`paid_only=true`）：

| 模型 | 说明 |
|------|------|
| `gpt-image-2` | GPT Image 2 最新一代 |
| `nanobanana` / `nanobanana-2` / `nanobanana-pro` | Gemini 系列图像（含 4K） |
| `seedream5` | 字节 Seedream 5.0（联网搜索 + 推理） |
| `grok-imagine` / `grok-imagine-pro` | xAI Grok Imagine 系列 |
| `wan-image-pro` | Wan Image Pro（4K + Thinking） |
| `p-image` / `p-image-edit` | Pruna 快速生成 / 编辑 |
| `nova-canvas` | AWS Nova Canvas |

> 完整列表通过 `GET https://gen.pollinations.ai/image/models` 获取（无需认证）。

## 文本生成

新版 API 完全兼容 OpenAI Chat Completions 格式，**所有文本模型均为免费**。

### OpenAI SDK 一行迁移

```python
from openai import OpenAI

# 只需改 base_url 和 api_key，其他代码完全不用动
client = OpenAI(
    base_url="https://gen.pollinations.ai/v1",
    api_key="your_pollinations_key"
)

response = client.chat.completions.create(
    model="claude",  # 可以换成 gemini、deepseek、qwen-coder 等
    messages=[{"role": "user", "content": "用 Python 写一个快速排序"}],
    stream=True
)
for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

### 联网搜索

`gemini-search` 模型可以实时搜索互联网获取最新信息：

```python
response = client.chat.completions.create(
    model="gemini-search",
    messages=[{"role": "user", "content": "Pollinations.AI 最近有什么更新？"}],
)
```

`perplexity-reasoning` 模型也支持搜索增强推理，适合需要引用来源的场景。

### 可用文本模型（全部免费）

| 模型 | 说明 |
|------|------|
| `openai` / `openai-fast` / `openai-large` | GPT 系列 |
| `claude` / `claude-fast` / `claude-large` / `claude-opus-4.7` | Claude 全系列 |
| `gemini` / `gemini-fast` / `gemini-large` | Gemini 全系列 |
| `deepseek` / `deepseek-pro` | DeepSeek 全系列 |
| `qwen-coder` / `qwen-large` / `qwen-vision` | 通义千问系列 |
| `grok` / `grok-large` | xAI Grok 系列 |
| `mistral` / `mistral-large` | Mistral 系列 |
| `kimi` / `kimi-k2.6` | Moonshot Kimi |
| `llama` / `glm` / `minimax` | Meta Llama、智谱 GLM、MiniMax |

**特殊功能模型**：`gemini-search`（联网搜索）、`perplexity-reasoning`（搜索推理）、`openai-audio`（语音 I/O）、`polly`（Pollinations 自研）

> 完整列表通过 `GET https://gen.pollinations.ai/v1/models` 获取，无需认证。

## 视频生成

视频生成目前处于 alpha 阶段，需 API Key。

**免费模型**：

| 模型 | 说明 | 价格 |
|------|------|------|
| `ltx-2` | LTX-2.3 快速文生视频 + 超分 | 0.005 Pollen/秒 |
| `nova-reel` | AWS Nova Reel，6-120 秒，720p | 0.08 Pollen/秒 |

**付费模型**：

| 模型 | 说明 | 价格 |
|------|------|------|
| `veo` | Google Veo 3.1 Fast | 0.15 Pollen/秒 |
| `seedance` / `seedance-pro` | 字节 Seedance 系列 | 按 Token 计费 |
| `wan` / `wan-fast` | 阿里 Wan 系列（wan 支持音频） | 0.015-0.075 Pollen/秒 |
| `grok-video-pro` | xAI Grok Video，720p | 0.075 Pollen/秒 |

```bash
# 使用免费模型 LTX-2 生成 5 秒视频
curl "https://gen.pollinations.ai/video/ocean%20waves?model=ltx-2&duration=5&key=YOUR_KEY" \
  -o video.mp4
```

注册用户每周 1.5 Pollen 免费积分足以生成数秒的免费视频或体验付费模型。

## 音频：语音合成、音乐与转写

所有音频模型均为免费，需 API Key。

### 文字转语音（TTS）

| 模型 | 说明 |
|------|------|
| `openai-audio` / `openai-audio-large` | OpenAI TTS |
| `elevenlabs` | ElevenLabs TTS，30+ 声音 |
| `qwen-tts` / `qwen-tts-instruct` | 通义千问 TTS |

**OpenAI TTS 可用声音**：alloy（中性）、echo（男性）、fable（英式）、onyx（深沉男性）、nova（女性，推荐）、shimmer（温柔女性）

```bash
curl https://gen.pollinations.ai/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"model":"tts-1","input":"你好，Pollinations！","voice":"nova"}' \
  -o speech.mp3
```

### 音乐生成

| 模型 | 说明 |
|------|------|
| `elevenmusic` | ElevenLabs 音乐生成 |
| `acestep` | AceStep 音乐生成 |

### 语音转文字

兼容 OpenAI Whisper 格式，通过 `POST /v1/audio/transcriptions` 调用。

## 视觉理解与多模态

通过 Chat Completions 端点传入图片 URL，让 AI "看懂"图片内容：

```python
from openai import OpenAI

client = OpenAI(base_url="https://gen.pollinations.ai/v1", api_key="your_key")

# 图片分析
response = client.chat.completions.create(
    model="openai",
    messages=[{"role": "user", "content": [
        {"type": "text", "text": "描述这张图片的内容"},
        {"type": "image_url", "image_url": {"url": "https://example.com/photo.jpg"}}
    ]}]
)

# OCR 文字识别
response = client.chat.completions.create(
    model="openai",
    messages=[{"role": "user", "content": [
        {"type": "text", "text": "请提取这张图片中的所有文字"},
        {"type": "image_url", "image_url": {"url": "https://example.com/screenshot.jpg"}}
    ]}]
)
```

实际应用场景：截图理解、UI 设计反馈、图表数据提取、文档 OCR、产品图片描述生成等。支持图片输入的文本模型（如 `openai`、`qwen-vision`）均可使用。

## 开发者工具生态

### Python SDK

```bash
pip install pollinations
```

支持图像/文本生成（含流式）、语音合成、转写等全功能，同步和异步调用均可。

### Node.js SDK

```bash
npm install @pollinations_ai/sdk
```

提供 `generateImage`、`generateText`、`generateVideo`、`generateAudio`、`chat` 等完整 API，支持浏览器环境。

### React Hooks

```typescript
import { usePollinationsImage } from '@pollinations/react'

function MyComponent() {
  const imageUrl = usePollinationsImage("a beautiful landscape", { width: 800, height: 600 })
  return <img src={imageUrl} alt="AI generated" />
}
```

### CLI

```bash
npx @pollinations_ai/cli "a cat in space" --model flux --output cat.jpg
```

支持结构化 JSON 输出，适合脚本和 AI Agent。

### MCP Server

让 Claude Desktop、Cursor 等 AI 助手直接调用 Pollinations 生成能力：

```bash
npx @pollinations_ai/mcp install-claude-mcp
```

也可手动添加到 MCP 客户端配置：

```json
{
  "mcpServers": {
    "pollinations": {
      "command": "npx",
      "args": ["@pollinations_ai/mcp"],
      "env": { "POLLINATIONS_API_KEY": "your_key" }
    }
  }
}
```

### 其他 SDK 和工具

- **Flutter/Dart SDK**：`pollinations_ai` 包（pub.dev）
- **第三方 TypeScript SDK**：支持 CJS/ESM，100% 测试覆盖
- **Apple Shortcuts**：iOS 快捷指令集成
- **Open WebUI 集成**：可替代 OpenAI 后端

## 国内可用性

Pollinations 的服务在国内可正常访问：

- 旧版图像 API（`image.pollinations.ai`）直连可用，无需注册
- 旧版文本 API（`text.pollinations.ai`）直连可用，仅 openai-fast 模型
- 新版 API（`gen.pollinations.ai`）直连可用，需 API Key
- 官网 `pollinations.ai` 可正常访问
- 匿名访问建议间隔 10-15 秒，注册后提升至 5 秒/次

## 实际使用建议

**零成本体验**：浏览器直接访问 `image.pollinations.ai/prompt/你的描述`，10+ 图像模型免注册可用，这是最零门槛的 AI 生图方式。

**注册解锁全部能力**：免费注册获取 API Key，即可使用 Claude Opus、Gemini、DeepSeek 等全部文本模型，以及语音合成、音乐生成、视频生成等功能。每周 1.5 Pollen 免费积分可用来体验 GPT Image 2 等付费图像模型。

**项目集成**：新版 API 兼容 OpenAI SDK，只需改 `base_url`。使用 Secret Key（`sk_` 前缀）无频率限制，并通过模型范围限制（scoping）将 Key 绑定到免费模型，降低泄露风险。

**何时购买 Pollen**：需要大量使用付费图像模型（GPT Image 2、NanoBanana Pro）、高频视频生成、或高频批量调用时。个人项目和学习完全可以在免费额度内完成。

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
