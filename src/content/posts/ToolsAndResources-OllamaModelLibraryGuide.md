---
title: 【工具分享】Ollama 开源模型分类汇总与选型指南
published: 2026-05-20
description: Ollama 支持的各类开源大模型分类汇总与使用推荐
lang: zh
tags: [工具分享]
---

> Ollama 支持的各类开源大模型分类汇总与使用推荐

**更新时间：2026 年 5 月**

<!--

---

## 目录

- [简介](#简介)
- [快速开始](#快速开始)
- [模型分类](#模型分类)
  - [1. 通用大语言模型](#1-通用大语言模型)
  - [2. 推理/思维模型](#2-推理思维模型)
  - [3. 代码生成模型](#3-代码生成模型)
  - [4. 视觉/多模态模型](#4-视觉多模态模型)
  - [5. 嵌入模型](#5-嵌入模型)
  - [6. 语音/TTS 模型](#6-语音tts-模型)
  - [7. 轻量/设备端模型](#7-轻量设备端模型)
  - [8. 企业/专业模型](#8-企业专业模型)
  - [9. MoE 混合专家模型](#9-moe-混合专家模型)
- [模型推荐速查表](#模型推荐速查表)
- [硬件配置建议](#硬件配置建议)
- [常见问题](#常见问题)

---

-->

## 简介

**Ollama** 是一款开源的本地大模型运行工具，支持在 Mac、Linux、Windows 上本地部署运行开源大语言模型。

### 核心特点

- ✅ **一键运行**：一条命令即可拉取并运行模型
- ✅ **跨平台**：支持 macOS、Linux、Windows
- ✅ **硬件优化**：自动识别并调用 GPU 加速
- ✅ **模型丰富**：支持数百种开源模型
- ✅ **API 兼容**：提供 REST API，方便集成

### 官方资源

- 官网：https://ollama.com/
- 模型库：https://ollama.com/library
- GitHub：https://github.com/ollama/ollama

---

## 快速开始

### 安装

| 系统 | 命令 |
|------|------|
| **macOS** | `brew install ollama` 或下载安装包 |
| **Windows** | 下载 [OllamaSetup.exe](https://ollama.com/download) |
| **Linux** | `curl -fsSL https://ollama.com/install.sh \| sh` |

### 基础命令

```bash
# 查看版本
ollama --version

# 拉取并运行模型
ollama run llama3.1

# 查看已下载的模型
ollama list

# 查看模型信息
ollama show llama3.1

# 删除模型
ollama rm llama3.1
```

### REST API

```bash
# 对话生成
curl -X POST http://localhost:11434/api/generate \
  -d '{"model": "llama3.1", "prompt": "你好"}'

# 嵌入生成
curl -X POST http://localhost:11434/api/embeddings \
  -d '{"model": "nomic-embed-text", "prompt": "文本"}'
```

---

## 模型分类

### 1. 通用大语言模型

最常用的一类，适合日常对话、写作、问答等任务。

| 模型 | 参数 | 特点 | 热度 |
|------|------|------|------|
| **Llama 4** | 17B ~ 405B | Meta 最新旗舰，多模态 | ⭐⭐⭐⭐⭐ |
| **Llama 3.3** | 70B | 高性价比，接近 405B 性能 | ⭐⭐⭐⭐⭐ |
| **Llama 3.1** | 8B / 70B / 405B | 主流选择，支持工具调用 | ⭐⭐⭐⭐⭐ |
| **Llama 3.2** | 1B / 3B | 轻量级，边缘设备 | ⭐⭐⭐⭐ |
| **Qwen3** | 0.6B ~ 235B | 阿里最新，中文优化 | ⭐⭐⭐⭐⭐ |
| **Qwen2.5** | 0.5B ~ 72B | 成熟稳定，多语言 | ⭐⭐⭐⭐ |
| **Gemma 4** | 2B ~ 31B | Google 最新，多模态 | ⭐⭐⭐⭐ |
| **Gemma 3** | 270M ~ 27B | 单 GPU 最强，支持视觉 | ⭐⭐⭐⭐ |
| **Mistral** | 7B | 欧洲最强开源 | ⭐⭐⭐ |
| **DeepSeek-V3** | 671B (MoE) | 国产旗舰，性价比高 | ⭐⭐⭐⭐ |
| **GLM-5** | 744B (MoE) | 智谱最新，代码能力强 | ⭐⭐⭐⭐ |

**运行命令：**

```bash
ollama run llama3.1          # 通用对话
ollama run qwen3             # 中文对话
ollama run gemma3            # Google 模型
ollama run mistral           # 欧洲模型
```

---

### 2. 推理/思维模型

专门用于复杂推理、数学、代码等需要"思考"的任务。

| 模型 | 参数 | 特点 |
|------|------|------|
| **DeepSeek-R1** | 1.5B ~ 671B | 推理能力接近 o3 |
| **GPT-Oss** | 20B / 120B | OpenAI 开源推理模型 |
| **Qwen3 (thinking)** | 0.6B ~ 235B | 原生支持推理模式 |
| **Qwen3.5** | 0.8B ~ 122B | 多模态 + 推理 |
| **QwQ** | 32B | Qwen 推理专用 |
| **Phi4-Reasoning** | 14B | 小身材强推理 |
| **Cogito** | 3B ~ 70B | 混合推理模型 |
| **DeepScaler** | 1.5B | 数学推理专精 |

**运行命令：**

```bash
ollama run deepseek-r1:7b    # 推理任务
ollama run qwq               # Qwen 推理专用
```

---

### 3. 代码生成模型

专精代码编写、调试、重构。

| 模型 | 参数 | 特点 |
|------|------|------|
| **Qwen3-Coder** | 30B / 480B (MoE) | 阿里代码模型 |
| **Qwen2.5-Coder** | 0.5B ~ 32B | 成熟稳定 |
| **DeepSeek-Coder V2** | 16B / 236B (MoE) | 比肩 GPT4-Turbo |
| **CodeGemma** | 2B / 7B | Google 代码模型 |
| **Codestral** | 22B | Mistral 代码模型 |
| **CodeLlama** | 7B ~ 70B | Llama 代码版 |
| **Granite-Code** | 3B ~ 34B | IBM 企业代码 |

**运行命令：**

```bash
ollama run qwen3-coder:7b         # 代码生成
ollama run qwen2.5-coder:7b       # Qwen2.5 代码版
ollama run deepseek-coder:6.7b    # DeepSeek 代码
```

---

### 4. 视觉/多模态模型

支持图像理解、图文问答。

| 模型 | 参数 | 特点 |
|------|------|------|
| **Llama 4** | 17B ~ 405B | Meta 最新多模态 |
| **Llama 3.2 Vision** | 11B / 90B | Llama 视觉版 |
| **Qwen3-VL** | 2B ~ 235B | 阿里最强视觉模型 |
| **Qwen2.5-VL** | 3B ~ 72B | 成熟视觉模型 |
| **Gemma 4** | 多尺寸 | Google 视觉增强 |
| **LLaVA** | 7B / 13B / 34B | 经典多模态 |
| **MiniCPM-V** | 8B | 国产轻量视觉 |

**运行命令：**

```bash
ollama run llama3.2-vision:11b    # Llama 视觉版
ollama run qwen2.5vl:7b           # Qwen 视觉版
```

---

### 5. 嵌入模型

用于文本向量化，常用于 RAG、语义搜索。

| 模型 | 参数 | 特点 |
|------|------|------|
| **Nomic-Embed-Text** | — | 最热门嵌入模型 |
| **MXBAI-Embed-Large** | 335M | 高性能嵌入 |
| **Qwen3-Embedding** | 0.6B / 4B / 8B | Qwen 嵌入模型 |
| **BGE-M3** | 567M | 多语言嵌入 |
| **Snowflake-Arctic-Embed** | 22M ~ 335M | 多种尺寸 |

**运行命令：**

```bash
ollama run nomic-embed-text       # 最常用嵌入
ollama run mxbai-embed-large      # 高性能嵌入
```

---

### 6. 语音/TTS 模型

语音合成相关模型。

| 模型 | 特点 |
|------|------|
| **Qwen3-TTS** | 阿里语音合成，支持克隆/定制 |

**运行命令：**

```bash
ollama run qwen3-tts:12hz-1.7b-voicedesign   # 1.7B 语音合成
ollama run qwen3-tts:12hz-0.6b-voicedesign   # 0.6B 轻量版
```

---

### 7. 轻量/设备端模型

专为低配置设备优化。

| 模型 | 参数 | 适合场景 |
|------|------|---------|
| **SmolLM2** | 135M ~ 1.7B | 极低资源 |
| **TinyLlama** | 1.1B | 超小体积 |
| **Llama 3.2** | 1B / 3B | 边缘设备 |
| **Phi-3 Mini** | 3.8B | 微软轻量模型 |
| **Gemma 3n** | 2B ~ 4B | 平板/手机 |

**运行命令：**

```bash
ollama run smollm2:1.7b          # 轻量对话
ollama run tinyllama             # 超小体积
```

---

### 8. 企业/专业模型

面向企业用户的商业级模型。

| 模型 | 参数 | 提供方 |
|------|------|--------|
| **Hermes 3** | 3B ~ 405B | Nous Research |
| **Nemotron-3-Super** | 120B (MoE) | NVIDIA |
| **OLMo 2** | 7B / 13B | AI2 透明开源 |
| **Granite 3.1 MoE** | 1B / 3B | IBM |
| **Command-R** | 35B | 对话/RAG 优化 |

---

### 9. MoE 混合专家模型

稀疏激活的大模型，高效率。

| 模型 | 总参数 | 激活参数 |
|------|--------|---------|
| **DeepSeek-V3** | 671B | 37B |
| **Qwen3** | 235B | MoE |
| **Mixtral** | 8×7B / 8×22B | MoE |
| **GLM-5** | 744B | 40B |

---

## 模型推荐速查表

| 使用场景 | 推荐模型 | 最低配置 | 命令 |
|---------|---------|---------|------|
| **日常聊天** | Llama 3.1 8B | 8GB RAM | `ollama run llama3.1` |
| **中文对话** | Qwen3 4B | 8GB RAM | `ollama run qwen3` |
| **代码生成** | Qwen3-Coder 7B | 8GB RAM | `ollama run qwen3-coder` |
| **复杂推理** | DeepSeek-R1 7B | 8GB RAM | `ollama run deepseek-r1:7b` |
| **图像理解** | Llama 3.2 Vision 11B | 12GB RAM | `ollama run llama3.2-vision:11b` |
| **语音合成** | Qwen3-TTS 0.6B | 6GB RAM | `ollama run qwen3-tts:12hz-0.6b-voicedesign` |
| **轻量/边缘** | SmolLM2 1.7B | 4GB RAM | `ollama run smollm2` |
| **嵌入/RAG** | Nomic-Embed-Text | 4GB RAM | `ollama run nomic-embed-text` |

---

## 硬件配置建议

### 按模型大小

| 模型大小 | 显存/内存需求 | 推荐显卡/设备 |
|---------|--------------|--------------|
| 1B 以下 | 4GB | RTX 3060 / Mac M1 |
| 3B - 7B | 8GB | RTX 4060 / Mac M2 |
| 8B - 13B | 16GB | RTX 4080 / Mac M3 Pro |
| 30B - 70B | 40GB+ | RTX 4090 / A100 / Mac M3 Max |
| 100B+ | 80GB+ | H100 / 多卡 |

### 量化对显存的影响

| 精度 | 显存节省 | 质量影响 |
|------|---------|---------|
| FP16 | 基准 | 最佳 |
| INT8 | -50% | 轻微下降 |
| INT4/Q4 | -75% | 可接受 |

---

## 常见问题

### Q: 如何查看所有可用模型？

```bash
# 访问官方模型库
open https://ollama.com/library

# 或搜索模型
ollama search llama
```

### Q: 模型下载太慢？

```bash
# 设置镜像源（国内）
export OLLAMA_HOST=https://region.ollama.ai

# 或使用代理
export HTTP_PROXY=http://127.0.0.1:7890
```

### Q: 如何同时运行多个模型？

```bash
# 在不同端口启动多个实例
OLLAMA_HOST=127.0.0.1:11435 ollama serve
```

### Q: 如何自定义模型参数？

创建 `Modelfile`：

```dockerfile
FROM llama3.1

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 4096

SYSTEM "你是一个有用的助手"
```

然后运行：

```bash
ollama create my-model -f Modelfile
ollama run my-model
```

---

## 参考资料

- [Ollama 官方文档](https://ollama.com/)
- [Ollama 模型库](https://ollama.com/library)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [Hugging Face](https://huggingface.co/)
