---
title: 【实践记录】Qwen3-TTS 本地部署完全指南
published: 2026-05-20
description: 在 Windows (RTX 4050) 和 MacBook Pro M5 上本地部署 Qwen3-TTS 语音合成模型
lang: zh
tags: [实践记录]
---

> 在 Windows (RTX 4050) 和 MacBook Pro M5 上本地部署 Qwen3-TTS 语音合成模型

**更新时间：2026年5月**

<!--

---

## 目录

- [简介](#简介)
- [硬件要求](#硬件要求)
- [Windows + RTX 4050 部署](#windows--rtx-4050-部署)
- [MacBook Pro M5 部署](#macbook-pro-m5-部署)
- [生成速度对比](#生成速度对比)
- [平台对比总结](#平台对比总结)
- [常见问题](#常见问题)
- [参考资料](#参考资料)

---

-->

## 简介

**Qwen3-TTS** 是阿里巴巴开源的文本转语音（TTS）模型，支持：

- 🎙️ **语音克隆**：仅需 3 秒音频即可克隆声音
- 🎨 **声音设计**：根据文本描述生成新声音
- 🎭 **自定义音色**：9 种预设音色 + 情感控制
- 🌍 **多语言支持**：支持 10+ 种主要语言

---

## 硬件要求

### Windows (RTX 4050)

| 配置项 | 最低要求 | 推荐配置 |
|--------|---------|---------|
| **显卡** | NVIDIA RTX 4050 6GB | RTX 4060 8GB+ |
| **显存** | 6GB | 8GB+ |
| **内存** | 16GB | 32GB |
| **存储** | 10GB 可用空间 | SSD |
| **系统** | Windows 10/11 64位 | Windows 11 |
| **CUDA** | 12.1+ | 12.4+ |

### MacBook Pro M5

| 配置项 | 最低要求 | 推荐配置 |
|--------|---------|---------|
| **芯片** | Apple M5 | M5 Pro / M5 Max |
| **内存** | 16GB 统一内存 | 24GB+ |
| **存储** | 10GB 可用空间 | SSD |
| **系统** | macOS 14+ | macOS 15+ |

---

## Windows + RTX 4050 部署

### 方案一：Ollama 部署（推荐）

**第一步：安装 Ollama**

1. 访问 👉 [ollama.com/download](https://ollama.com/download)
2. 下载 Windows 版安装程序，双击运行

**第二步：安装 CUDA 驱动**

```powershell
# 检查显卡识别
nvidia-smi
```

如果报错，安装 [NVIDIA 驱动](https://www.nvidia.com/download/index.aspx) 和 [CUDA Toolkit](https://developer.nvidia.com/cuda-downloads)

**第三步：拉取并运行模型**

```powershell
# 拉取 Qwen3-TTS 模型
ollama run qwen3-tts:12hz-1.7b-voicedesign

# 或使用更小的 0.6B 版本
ollama run qwen3-tts:12hz-0.6b-voicedesign
```

**第四步：使用模型**

```powershell
# 交互式
ollama run qwen3-tts:12hz-1.7b-voicedesign

# 命令行生成音频
ollama generate -m qwen3-tts:12hz-1.7b-voicedesign "你好" -o output.wav
```

### 方案二：Hugging Face + Transformers

```powershell
# 创建环境
conda create -n qwen3-tts python=3.10
conda activate qwen3-tts

# 安装依赖
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install transformers accelerate bitsandbytes
```

**INT4 量化代码：**

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import torch

quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4"
)

model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign",
    device_map="cuda:0",
    quantization_config=quantization_config,
    torch_dtype=torch.bfloat16,
)
```

### Windows 显存优化

| 方法 | 显存节省 | 实现方式 |
|------|---------|---------|
| **INT4 量化** | -50% | `--load-in-4bit` |
| **使用 0.6B 模型** | -60% | `qwen3-tts:12hz-0.6b-voicedesign` |
| **启用 streaming** | -500MB | `--streaming` 参数 |
| **BF16 替代 FP16** | -700MB | `--dtype bfloat16` |

---

## MacBook Pro M5 部署

### M5 规格

| 配置 | M5 | M5 Pro | M5 Max |
|------|-----|--------|--------|
| **CPU** | 10核 | 13-16核 | 20-24核 |
| **GPU** | 10核 | 20核 | 40核 |
| **内存带宽** | **153 GB/s** | 更高 | 更高 |
| **统一内存** | 16/24/32 GB | 24-64 GB | 64-128 GB |

### 方案一：MLX 官方方案（推荐）

```bash
# 安装依赖
pip install mlx mlx-audio
brew install ffmpeg

# 克隆仓库
git clone https://github.com/AtomGradient/swift-qwen3-tts.git
cd swift-qwen3-tts
```

**运行代码：**

```python
from mlx_audio import mlx

model = mlx.load("Qwen/Qwen3-TTS-12Hz-0.6B-MLX")

output = model.generate(
    text="你好，欢迎使用 Qwen3-TTS",
    speaker="Aiden",
    temperature=0.9
)
output.save("output.wav")
```

### 方案二：Ollama

```bash
# 安装
brew install ollama

# 运行
ollama run qwen3-tts:12hz-0.6b-voicedesign
```

### Mac 选型建议

| 配置 | 推荐模型 | 可用性 |
|------|---------|--------|
| M5 16GB | 0.6B BF16 | ⚠️ 勉强可用 |
| **M5 24GB** | **0.6B BF16** | ✅ 流畅 |
| M5 32GB | 0.6B / 1.7B INT4 | ✅ 流畅 |
| M5 Pro 48GB | 1.7B BF16 | ✅ 流畅 |
| M5 Max 64GB+ | 1.7B BF16 | ✅ 非常流畅 |

---

## 生成速度对比

### RTF (Real-Time Factor) 说明

> **RTF** = 生成耗时 ÷ 音频时长
> - RTF < 1.0 → 比实时快
> - RTF = 1.0 → 实时速度
> - RTF > 1.0 → 比实时慢

### 0.6B 模型性能

| 设备 | 配置 | RTF | 30秒音频耗时 |
|------|------|------|-------------|
| RTX 4050 Laptop | 6GB | ~0.6-0.8 | ~18-24 秒 |
| **MacBook Pro M5** | 24GB | **~0.7-0.9** | **~21-27 秒** |
| MacBook Pro M5 Pro | 48GB | ~0.5-0.7 | ~15-21 秒 |
| RTX 4090 | 24GB | ~0.65 | ~20 秒 |

### 1.7B 模型性能

| 设备 | 配置 | RTF | 可用性 |
|------|------|------|--------|
| RTX 4050 Laptop | 6GB INT4 | ~1.5-1.8 | ⚠️ 可用但较慢 |
| MacBook Pro M5 | 32GB INT4 | ~1.0-1.3 | ⚠️ 勉强可用 |
| MacBook Pro M5 Pro | 48GB BF16 | ~0.7-0.9 | ✅ 流畅 |
| RTX 4090 | 24GB | ~0.65 | ✅ 流畅 |

---

## 平台对比总结

| 对比项 | MacBook Pro M5 | Windows + RTX 4050 |
|--------|---------------|-------------------|
| **架构** | Apple Silicon (ARM) | x86 + NVIDIA GPU |
| **内存** | 统一内存 (16-128GB) | 分离内存 (6GB VRAM) |
| **框架** | MLX (原生优化) | CUDA + PyTorch |
| **0.6B RTF** | ~0.7-0.9 | ~0.6-0.8 |
| **1.7B RTF** | ~1.0-1.3 (32GB) | ~1.5-1.8 (6GB) |
| **最大模型** | 受限于统一内存 | 受限于显存 |
| **功耗** | 低（续航长） | 高（需插电） |
| **便携性** | ✅ 优秀 | ⚠️ 较重 |

### 选择建议

- **追求便携和续航** → MacBook Pro M5
- **追求极致性能** → Windows + RTX 4090/5090
- **预算有限** → MacBook Pro M5 24GB 或 Windows + RTX 4060

---

## 常见问题

### Q: RTX 4050 提示 OOM？

```powershell
# 使用 0.6B 模型
ollama run qwen3-tts:12hz-0.6b-voicedesign

# 或启用 streaming
ollama run qwen3-tts:12hz-1.7b-voicedesign --streaming
```

### Q: Mac 提示内存不足？

```bash
# 使用 0.6B 模型
ollama run qwen3-tts:12hz-0.6b-voicedesign

# 关闭其他应用释放内存
```

### Q: 为什么 Mac 比 NVIDIA 慢？

TTS 模型在 NVIDIA 上有 CUDA + TensorRT 深度优化。Mac 使用 Metal 后端，优化程度不如 CUDA。但 Mac 的统一内存架构可以加载更大模型，且能效比更高。

---

## 参考资料

- [Qwen3-TTS 官方仓库](https://github.com/QwenLM/Qwen3-TTS)
- [Qwen3-TTS 性能基准指南](https://qwen3-tts.app/blog/qwen3-tts-performance-benchmarks-hardware-guide-2026)
- [AtomGradient MLX 优化论文](https://atomgradient.github.io/swift-qwen3-tts/paper.pdf)
- [Ollama 官方文档](https://ollama.com/)
- [MLX 官方文档](https://ml-explore.github.io/mlx/)
