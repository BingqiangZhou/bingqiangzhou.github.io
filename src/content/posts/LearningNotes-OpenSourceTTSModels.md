---
title: 【学习笔记】开源 TTS 语音合成模型全面盘点与选型指南
published: 2026-05-02
description: 全面梳理 10 个主流开源 TTS 语音合成模型，涵盖 VoxCPM2、Qwen3-TTS、CosyVoice3、GPT-SoVITS 等，对比参数规模、音质、克隆能力、部署难度与免费 API 渠道
lang: zh
tags: [学习笔记]
---

> **整理日期**：2026-05-02
> **涵盖模型**：VoxCPM2、MOSS-TTS 系列、Qwen3-TTS、CosyVoice3、VibeVoice、IndexTTS2、GPT-SoVITS、Fish Speech、F5-TTS、Kokoro 等
> **定位**：面向开发者和 AI 应用爱好者的一站式 TTS 选型参考

<!--

## 目录

- [一、VoxCPM2 — 全能型语音基础模型](#一voxcpm2--全能型语音基础模型)
- [二、MOSS-TTS 系列 — 从 Nano 到旗舰的完整家族](#二moss-tts-系列--从-nano-到旗舰的完整家族)
- [三、Qwen3-TTS — 阿里通义千问语音大模型](#三qwen3-tts--阿里通义千问语音大模型)
- [四、CosyVoice3 — 均衡型多方言 TTS](#四cosyvoice3--均衡型多方言-tts)
- [五、VibeVoice — 微软开源语音 AI 框架](#五vibevoice--微软开源语音-ai-框架)
- [六、IndexTTS2 — B站工业级零样本 TTS](#六indextts2--b站工业级零样本-tts)
- [七、GPT-SoVITS — 少样本语音克隆利器](#七gpt-sovits--少样本语音克隆利器)
- [八、Fish Speech (FishAudio) — 企业级语音合成](#八fish-speech-fishaudio--企业级语音合成)
- [九、F5-TTS — 轻量开源 TTS](#九f5-tts--轻量开源-tts)
- [十、Kokoro — 极致轻量英语 TTS](#十kokoro--极致轻量英语-tts)
- [十一、模型全面对比](#十一模型全面对比)
- [十二、免费 API 调用渠道汇总](#十二免费-api-调用渠道汇总)
- [十三、选型决策指南](#十三选型决策指南)
- [十四、附录：学习资源链接](#十四附录学习资源链接)

-->

## 一、VoxCPM2 — 全能型语音基础模型

### 1.1 项目概述

**VoxCPM2** 是由**面壁智能（ModelBest）**联合 **OpenBMB** 开源社区和**清华大学人机语音交互实验室**推出的新一代开源语音基础模型。它是 VoxCPM 系列的最新升级版，基于 **MiniCPM-4** 架构打造，采用创新的 **Tokenizer-Free（无 Token 化）** 端到端语音合成技术路线。

| 项目 | 详情 |
|---|---|
| **开发团队** | 面壁智能 / OpenBMB / 清华大学人机语音交互实验室 |
| **GitHub** | https://github.com/OpenBMB/VoxCPM |
| **许可证** | Apache 2.0（商用友好） |
| **模型规模** | 2B 参数 |
| **音频采样率** | 48kHz（Hi-Fi 高保真级别） |

### 1.2 核心技术架构

VoxCPM2 采用 **扩散自回归连续表征（Diffusion Autoregressive）** 架构，整体流程为：

```
文本输入 → LocEnc（局部编码器）→ TSLM（时序语言模型）→ RALM（自回归语言模型）→ LocDiT（局部扩散 Transformer）→ 高质量语音输出
```

> ⚠️ 注意：上述架构细节来自自媒体技术分析文章，VoxCPM2 的官方技术报告尚未发布，具体架构以官方论文为准。

**五大核心技术创新**：

1. **MiniCPM-4 骨干网络** — 基于边缘部署优化的 MiniCPM-4 大语言模型，通过分层语言建模实现文本语义理解与语音特征提取的有效融合
2. **Tokenizer-Free 端到端架构** — 摒弃传统 TTS 的文本 Token 化预处理，直接在连续语音空间中建模，实现从文本到语音的无损转换
3. **FSQ 量化技术** — 采用有限标量量化（Finite Scalar Quantization）高效编码语音特征，在保持音质的同时显著降低计算复杂度
4. **局部扩散 Transformer（LocDiT）** — 结合扩散模型与 Transformer 的优势，通过局部扩散机制实现高质量语音生成
5. **AudioVAE V2 音频编解码** — 16kHz 输入、48kHz 输出的音频编解码器（来自自媒体报道，待官方确认）

### 1.3 四大核心能力

#### 1. 全球通：30 国语言 + 9 大方言

- **30 种主流语言**：特别覆盖东南亚 8 国主流语言（越南语、泰语、印尼语、老挝语、缅甸语、柬埔寨语、菲律宾语、马来西亚语）
- **9 大中国方言**：四川话、粤语、吴语、东北话、河南话、陕西话、山东话、天津话、闽南语

#### 2. 百变声优：音色设计（Voice Design）

- 无需参考音频，仅凭**文字描述**即可创造全新音色
- 可指定音色、情绪、性别、年龄等属性，"凭空设计"独一无二的声音

#### 3. 千人千面：通用音色可控（Voice Cloning）

- 仅需 **3-10 秒**参考音频即可实现零样本声音克隆
- 不仅复刻音色，还能还原口音、情感语调、节奏、呼吸声等细粒度特征

#### 4. 影视级音质：48kHz 高保真

- 采样率从 VoxCPM 1 的 16kHz 提升至 **48kHz**，达到 Hi-Fi 级别

### 1.4 性能表现（VoxCPM 0.5B 基准数据）

| 指标 | VoxCPM 0.5B | 表现 |
|---|---|---|
| **RTF（实时因子）** | 0.17 | 生成速度是播放速度的 6 倍 |
| **中文 CER** | 0.93% | 同类最优 |
| **中文 SIM（相似度）** | 77.2% | 领先水平 |
| **英文 WER** | 1.85% | 同类最优 |

### 1.5 快速开始

```bash
pip install voxcpm
```

```python
import soundfile as sf
from voxcpm import VoxCPM

model = VoxCPM.from_pretrained("openbmb/VoxCPM-0.5B")
wav = model.generate(text="你好，这是VoxCPM语音合成演示", normalize=True, denoise=True)
sf.write("output.wav", wav, 16000)
```

### 1.6 系统要求

| 项目 | 最低要求 |
|---|---|
| Python | 3.8+ |
| PyTorch | 1.13.0+ |
| CUDA | 11.6+ |
| 内存 | 16GB+ RAM |
| 显存 | 12GB+ VRAM（推荐 RTX 4090） |

---

## 二、MOSS-TTS 系列 — 从 Nano 到旗舰的完整家族

### 2.1 项目概述

**MOSS-TTS 家族**是由**复旦 OpenMOSS 团队**与 **MOSI.AI** 联合推出的开源语音与声音生成模型家族。该系列面向高保真、高表现力与复杂真实场景设计。

| 项目 | 详情 |
|---|---|
| **开发团队** | 复旦大学 NLP 实验室 / OpenMOSS / MOSI.AI |
| **GitHub** | https://github.com/OpenMOSS/MOSS-TTS |
| **许可证** | Apache 2.0 |

### 2.2 家族模型矩阵

| 模型 | 架构 | 参数量 | 核心定位 |
|---|---|---|---|
| **MOSS-TTS** | MossTTSDelay / MossTTSLocal | 8B / 1.7B | 旗舰量产级 TTS，高保真零样本克隆 |
| **MOSS-TTSD** | MossTTSDelay | 8B | 对话语音生成，多说话人超长连续对话 |
| **MOSS-VoiceGenerator** | MossTTSDelay | 1.7B | 文字→音色设计，无需参考音频 |
| **MOSS-SoundEffect** | MossTTSDelay | 8B | 音效生成（自然环境、城市场景等） |
| **MOSS-TTS-Realtime** | MossTTSRealtime | 1.7B | 实时语音智能体，多轮上下文感知 |
| **MOSS-TTS-Nano** | Local Transformer + Audio Tokenizer | ~0.1B | 超轻量部署优先，CPU 可运行 |

### 2.3 MOSS-TTS-Nano 详解

| 特性 | 详情 |
|---|---|
| **参数量** | ~100M（0.1B） |
| **音频质量** | 48kHz 立体声 |
| **语言覆盖** | ~20 种（中/英/日/韩/西/法/德/意/匈/俄/波斯/阿拉伯/波兰/葡萄牙/捷克/丹麦/瑞典/希腊/土耳其） |
| **硬件要求** | **无需 GPU，CPU 即可流畅运行** |
| **Tokenizer** | MOSS-Audio-Tokenizer-Nano（~20M 参数），CNN-free 因果 Transformer + RVQ 16 码本 |

### 2.4 MOSS-TTS（旗舰）性能基准

Seed-TTS-eval 基准测试：

| 模型 | 参数量 | 英文 WER (%) ↓ | 英文 SIM (%) ↑ | 中文 CER (%) ↓ | 中文 SIM (%) ↑ |
|---|---|---|---|---|---|
| **MossTTSDelay** | 8B | 1.79 | 71.46 | 1.32 | 77.05 |
| **MossTTSLocal** | 1.7B | 1.85 | **73.42** | **1.20** | **78.82** |

MOSS-TTSD-v1.0 在对话语音生成上甚至**战胜了豆包、Gemini2.5-pro 等顶尖闭源模型**。

---

## 三、Qwen3-TTS — 阿里通义千问语音大模型

### 3.1 项目概述

**Qwen3-TTS** 是阿里巴巴通义千问（Qwen）团队于 2026 年 1 月开源的语音大模型系列，提供 0.6B 和 1.7B 两个尺寸。它是目前功能最全面的开源 TTS 模型之一，同时支持声音克隆、音色设计和自然语言语音控制。

| 项目 | 详情 |
|---|---|
| **开发团队** | 阿里巴巴通义千问（Qwen）团队 |
| **GitHub** | https://github.com/QwenLM/Qwen3-TTS |
| **许可证** | Apache 2.0 |
| **模型规模** | 0.6B / 1.7B |
| **音频采样率** | 24kHz |
| **技术论文** | https://arxiv.org/abs/2601.15621 |

### 3.2 核心特性

- **10 大语言**：中文、英文、日语、韩语、德语、法语、俄语、葡萄牙语、西班牙语、意大利语
- **方言支持**：北京话、四川话等方言音色
- **3 秒声纹克隆**：仅需 3 秒参考音频即可快速克隆
- **音色设计**：自然语言描述即可创造新音色（如"紧张的17岁男生"）
- **97ms 超低延迟**：端到端合成延迟低至 97ms，支持实时交互
- **双轨混合流式架构**：单模型同时支持流式和非流式生成
- **自然语言语音控制**：支持通过指令控制音色、情感、韵律等多维声学属性
- **vLLM 加速**：官方支持 vLLM 推理加速，提供 OpenAI 兼容 API
- **微调支持**：Base 模型可用于微调定制

### 3.3 模型版本

| 模型 | 参数量 | 核心能力 |
|---|---|---|
| Qwen3-TTS-12Hz-1.7B-VoiceDesign | 1.7B | 音色设计（文字→声音） |
| Qwen3-TTS-12Hz-1.7B-CustomVoice | 1.7B | 9 种高品质预置音色 + 指令控制 |
| Qwen3-TTS-12Hz-1.7B-Base | 1.7B | 3 秒快速声音克隆（可微调） |
| Qwen3-TTS-12Hz-0.6B-CustomVoice | 0.6B | 9 种预置音色（轻量版） |
| Qwen3-TTS-12Hz-0.6B-Base | 0.6B | 声音克隆（轻量版） |

### 3.4 预置音色

| 音色 | 描述 | 母语 |
|---|---|---|
| Vivian | 明亮、略带锐度的年轻女声 | 中文 |
| Serena | 温暖、温柔的年轻女声 | 中文 |
| Uncle_Fu | 成熟男声，低沉醇厚 | 中文 |
| Dylan | 年轻北京男声，清晰自然 | 中文（北京方言） |
| Eric | 活泼成都男声，略带沙哑 | 中文（四川方言） |
| Ryan | 充满活力的男声，节奏感强 | 英文 |
| Aiden | 阳光美国男声，中频清晰 | 英文 |
| Ono_Anna | 俏皮日本女声，轻盈灵动 | 日语 |
| Sohee | 温暖韩国女声，情感丰富 | 韩语 |

### 3.5 快速开始

```bash
pip install -U qwen-tts
```

```python
import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel

model = Qwen3TTSModel.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
    device_map="cuda:0",
    dtype=torch.bfloat16,
    attn_implementation="flash_attention_2",
)

# 预置音色 + 指令控制
wavs, sr = model.generate_custom_voice(
    text="其实我真的有发现，我是一个特别善于观察别人情绪的人。",
    language="Chinese",
    speaker="Vivian",
    instruct="用特别愤怒的语气说",
)
sf.write("output.wav", wavs[0], sr)
```

### 3.6 Seed-TTS-eval 性能

| 模型 | 参数量 | 英文 WER (%) ↓ | 英文 SIM (%) ↑ | 中文 CER (%) ↓ | 中文 SIM (%) ↑ |
|---|---|---|---|---|---|
| Qwen3-TTS | 0.6B | 1.68 | 70.39 | 1.23 | 76.4 |
| Qwen3-TTS | 1.7B | 1.50 | 71.45 | 1.33 | 76.72 |

> Qwen3-TTS 1.7B 的英文 WER（1.50%）在所有开源模型中表现最佳。

---

## 四、CosyVoice3 — 均衡型多方言 TTS

### 4.1 项目概述

**CosyVoice3** 是阿里巴巴通义实验室（FunAudioLLM/Speech Lab）推出的第三代开源 TTS 模型，在中文方言支持方面表现突出。

| 项目 | 详情 |
|---|---|
| **开发团队** | 阿里巴巴通义实验室（FunAudioLLM） |
| **GitHub** | https://github.com/FunAudioLLM/CosyVoice |
| **许可证** | Apache 2.0 |
| **模型规模** | 0.5B（另有 1.5B 版本和 300M 轻量版） |

### 4.2 核心特性

- **语言支持**：9 种语言 + **18 种中国方言**（方言数量远超同类模型）
- **技术路线**：Flow Matching + Token
- **双向流式**：集成离线与流式建模技术
- **低延迟**：首包延迟低至 150ms
- **发音准确度**：比 CosyVoice 1.0 降低 30%-50% 发音错误率

### 4.3 性能基准

| 模型 | 参数量 | 英文 WER (%) ↓ | 英文 SIM (%) ↑ | 中文 CER (%) ↓ | 中文 SIM (%) ↑ |
|---|---|---|---|---|---|
| CosyVoice3 | 0.5B | 2.02 | 71.8 | 1.16 | 78.0 |
| CosyVoice3 | 1.5B | 2.22 | 72.0 | 1.12 | 78.1 |

---

## 五、VibeVoice — 微软开源语音 AI 框架

### 5.1 项目概述

**VibeVoice** 是微软发布的开源前沿语音 AI 模型家族，基于 7.5B 参数的语音基础模型，提供从语音识别到语音合成的完整能力。项目获 ICLR 2026 Oral 论文认可。

| 项目 | 详情 |
|---|---|
| **开发团队** | 微软（Microsoft） |
| **GitHub** | https://github.com/microsoft/VibeVoice |
| **许可证** | MIT / Apache 2.0（商业友好） |
| **模型规模** | 1.5B / 7B |
| **音频采样率** | 24kHz |

### 5.2 核心特性

- **超长语音生成**：支持最长 90 分钟连续语音输出
- **播客生成**：内置多说话人播客生成能力
- **实时流式**：300ms 首字延迟，满足实时交互场景
- **多轮对话**：支持随时打断的多轮语音对话
- **Function Calling**：支持工具调用能力
- **灵活部署**：支持 CPU/GPU/vLLM 推理，从笔记本到服务器集群均可部署
- **多 ASR 引擎**：支持 Whisper、Azure Speech、SenseVoice 等
- **37 种语言**自动检测

### 5.3 模型版本

| 模型 | 参数量 | 核心定位 |
|---|---|---|
| VibeVoice | 7B | 旗舰语音基础模型 |
| VibeVoice | 1.5B | 轻量版 |
| VibeVoice-Realtime | 0.5B | 实时语音智能体 |

### 5.4 性能基准

| 模型 | 参数量 | 英文 WER (%) ↓ | 英文 SIM (%) ↑ | 中文 CER (%) ↓ | 中文 SIM (%) ↑ |
|---|---|---|---|---|---|
| VibeVoice | 1.5B | 3.04 | 68.9 | 1.16 | 74.4 |
| VibeVoice | 7B | — | — | — | — |

> ⚠️ VibeVoice 7B 版本在 Seed-TTS-eval 上暂无公开数据，但其在对话和长语音场景表现突出。

---

## 六、IndexTTS2 — B站工业级零样本 TTS

### 6.1 项目概述

**IndexTTS2** 是 B 站 IndexTeam 开源的工业级可控零样本 TTS 系统。用户只需提供一段参考音频即可克隆音色，同时支持情感独立控制。

| 项目 | 详情 |
|---|---|
| **开发团队** | B 站 IndexTeam |
| **GitHub** | https://github.com/index-tts/index-tts |
| **许可证** | 待确认 |
| **模型规模** | 1.5B |
| **技术路线** | GPT 自回归解码器 + DiT（Diffusion Transformer）声码器 |

### 6.2 核心特性

- **零样本声音克隆**：参考音频即可克隆音色
- **情感独立控制**：通过情感参考音频、8 维情感向量或文本描述独立控制情感
- **情感与音色解耦**：情感和音色可独立调节，互不干扰
- **精确时长控制**：自回归 TTS 的精确时长控制，支持可控与不可控两种模式
- **多语言**：多语言表现优异
- **低显存需求**：在 RTX 3090 上即可运行

### 6.3 性能基准

| 模型 | 参数量 | 英文 WER (%) ↓ | 英文 SIM (%) ↑ | 中文 CER (%) ↓ | 中文 SIM (%) ↑ |
|---|---|---|---|---|---|
| IndexTTS2 | 1.5B | 2.23 | 70.6 | 1.03 | 76.5 |

> IndexTTS2 的中文 CER（1.03%）在所有对比模型中表现最优。

---

## 七、GPT-SoVITS — 少样本语音克隆利器

### 7.1 项目概述

**GPT-SoVITS** 是一个社区驱动的开源 TTS 项目，以**极低样本量语音克隆**闻名。仅需 5 秒音频即可进行零样本克隆，1 分钟音频微调后可大幅提升音色相似度。在中文 AI 配音社区中拥有极高人气。

| 项目 | 详情 |
|---|---|
| **开发团队** | 社区驱动（RVC-Boss 等） |
| **GitHub** | https://github.com/RVC-Boss/GPT-SoVITS |
| **许可证** | MIT |
| **技术路线** | GPT + SoVITS 声码器 |
| **语言支持** | 中文、英文、日文 |

### 7.2 核心特性

- **5 秒零样本克隆**：极少样本即可克隆声音
- **1 分钟微调**：短音频微调即可获得高相似度
- **跨语言推理**：中文参考音频可用于英文/日文合成
- **社区活跃**：大量预训练模型、音色包和教程
- **WebUI 友好**：提供图形化界面，上手简单
- **推理速度快**：相比 VITS 等传统模型推理效率更高

### 7.3 性能基准

| 模型 | 参数量 | 英文 WER (%) ↓ | 英文 SIM (%) ↑ | 中文 CER (%) ↓ | 中文 SIM (%) ↑ |
|---|---|---|---|---|---|
| CosyVoice（初代） | 0.3B | 4.29 | 60.9 | 3.63 | 72.3 |
| CosyVoice2 | 0.5B | 3.09 | 65.9 | 1.38 | 75.7 |

> GPT-SoVITS 在 Seed-TTS-eval 上暂无最新公开数据，但其在社区实际使用中的口碑极佳，尤其在中文虚拟主播和 AI 配音场景。

---

## 八、Fish Speech (FishAudio) — 企业级语音合成

### 8.1 项目概述

**Fish Speech** 是 Fish Audio 团队开发的开源语音合成系统，提供从模型到 API 的完整企业级解决方案。最新版本 Fish Audio S2 支持精细化韵律和情感控制。

| 项目 | 详情 |
|---|---|
| **开发团队** | Fish Audio |
| **GitHub** | https://github.com/fishaudio/fish-speech |
| **许可证** | Fish Audio Research License（非标准开源，商用需授权） |
| **模型规模** | Fish Audio S1: 4B / S1-mini: 0.5B |
| **技术路线** | 自研架构 |

### 8.2 核心特性

- **精细化控制**：支持自然语言标签（如 `[laugh]`、`[whispers]`、`[super happy]`）进行行内情感和韵律控制
- **企业级安全**：声纹加密、私有化部署、ISO27001 认证
- **多框架导出**：支持 PyTorch/ONNX 多框架
- **RESTful API**：分钟级系统集成
- **20+ 预设模式**：游戏配音/有声书/广告旁白等场景预设
- **多语言**：英语、中文、日语等

### 8.3 性能基准

| 模型 | 参数量 | 英文 WER (%) ↓ | 英文 SIM (%) ↑ | 中文 CER (%) ↓ | 中文 SIM (%) ↑ |
|---|---|---|---|---|---|
| FishAudio-S1 | 4B | 1.72 | 62.57 | 1.22 | 72.1 |
| FishAudio-S1-mini | 0.5B | 1.94 | 55.0 | 1.18 | 68.5 |

> ⚠️ FishAudio 的许可证为自定义 Research License，非标准开源协议，商用需联系授权。

---

## 九、F5-TTS — 轻量开源 TTS

### 9.1 项目概述

| 项目 | 详情 |
|---|---|
| **开发团队** | SWivid |
| **GitHub** | https://github.com/SWivid/F5-TTS |
| **许可证** | CC-BY-NC 4.0（模型权重） |
| **模型规模** | 0.3B |
| **技术路线** | Flow Matching + ConvNeXt + DiT |

### 9.2 核心特性

- 非自回归架构，推理速度快
- 零样本声音克隆
- 多语言支持
- 轻量级设计，适合个人项目和快速原型

### 9.3 性能基准

| 指标 | F5-TTS (0.3B) |
|---|---|
| 英文 WER | 2.00% |
| 英文 SIM | 67.0% |
| 中文 CER | 1.53% |
| 中文 SIM | 76.0% |

---

## 十、Kokoro — 极致轻量英语 TTS

### 10.1 项目概述

| 项目 | 详情 |
|---|---|
| **开发团队** | hexgrad |
| **GitHub** | https://github.com/hexgrad/Kokoro-82M |
| **许可证** | Apache 2.0 |
| **模型规模** | **82M 参数**（仅 350MB） |
| **技术路线** | StyleTTS 2 |
| **主要语言** | 英语（中/日/德部分支持） |

### 10.2 核心特性

- **极致轻量**：82M 参数，CPU 即可运行
- **浏览器运行**：支持 ONNX / Transformers.js
- **多音色**：美式/英式口音，男/女声选项
- **HuggingFace TTS Arena 排名领先**

---

## 十一、模型全面对比

### 11.1 基本信息

| 维度 | **VoxCPM2** | **Qwen3-TTS** | **MOSS-TTS-Nano** | **MOSS-TTS (8B)** | **CosyVoice3** | **VibeVoice** | **IndexTTS2** | **GPT-SoVITS** | **Fish Speech** | **F5-TTS** | **Kokoro** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **团队** | 面壁智能 | 阿里Qwen | 复旦OpenMOSS | 同左 | 阿里FunAudioLLM | 微软 | B站IndexTeam | 社区 | Fish Audio | SWivid | hexgrad |
| **参数量** | 2B | 0.6B/1.7B | 0.1B | 8B/1.7B | 0.5B/1.5B | 1.5B/7B | 1.5B | — | 0.5B/4B | 0.3B | 0.082B |
| **技术路线** | Tokenizer-Free 扩散自回归 | 离散多码本 LM | 离散Token+LLM | 离散Token+LLM | Flow Matching | 语音基础模型 | GPT+DiT | GPT+SoVITS | 自研架构 | Flow Matching+ConvNeXt | StyleTTS 2 |
| **采样率** | **48kHz** | 24kHz | **48kHz** | 24kHz | 24kHz | 24kHz | 24kHz | — | — | 24kHz | 24kHz |
| **协议** | Apache 2.0 | Apache 2.0 | Apache 2.0 | Apache 2.0 | Apache 2.0 | MIT/Apache 2.0 | 待确认 | MIT | 自定义 | CC-BY-NC 4.0 | Apache 2.0 |

### 11.2 核心能力

| 能力 | **VoxCPM2** | **Qwen3-TTS** | **MOSS-TTS-Nano** | **MOSS-TTS (8B)** | **CosyVoice3** | **VibeVoice** | **IndexTTS2** | **GPT-SoVITS** | **Fish Speech** | **F5-TTS** | **Kokoro** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **语言数** | **30+9方言** | **10+方言** | ~20 | 多语种 | 9+**18方言** | 37 | 多语种 | 中/英/日 | 多语种 | 多语种 | 主要英语 |
| **东南亚** | ✅ 8国 | ❌ | ⚠️ 部分 | ✅ | ❌ | — | — | ❌ | — | ❌ | ❌ |
| **声音克隆** | ✅ 3-10秒 | ✅ **3秒** | ✅ | ✅ 高保真 | ✅ | ✅ | ✅ | ✅ **5秒** | ✅ | ✅ | ❌ |
| **音色设计** | ✅ | ✅ | ❌ | ✅（独立模型） | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **指令控制** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 标签 | ❌ | ❌ |
| **情感控制** | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ **独立** | ❌ | ✅ **精细化** | ❌ | ❌ |
| **流式合成** | ✅ | ✅ **97ms** | ✅ | ✅ | ✅ | ✅ **300ms** | — | — | ✅ | ✅ | ✅ |
| **对话生成** | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ **90分钟** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **音效生成** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CPU推理** | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **浏览器** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 11.3 Seed-TTS-eval 性能基准

| 模型 | 参数量 | 开源 | 英文 WER (%) ↓ | 英文 SIM (%) ↑ | 中文 CER (%) ↓ | 中文 SIM (%) ↑ |
|---|---|---|---|---|---|---|
| **Qwen3-TTS** | **1.7B** | ✅ | **1.50** | 71.45 | 1.33 | 76.72 |
| MossTTSLocal | 1.7B | ✅ | 1.85 | **73.42** | **1.20** | **78.82** |
| **IndexTTS2** | 1.5B | ✅ | 2.23 | 70.6 | **1.03** | 76.5 |
| MossTTSDelay | 8B | ✅ | 1.79 | 71.46 | 1.32 | 77.05 |
| VoxCPM | 0.5B | ✅ | 1.85 | 72.9 | 0.93 | 77.2 |
| Qwen3-TTS | 0.6B | ✅ | 1.68 | 70.39 | 1.23 | 76.4 |
| CosyVoice3 | 0.5B | ✅ | 2.02 | 71.8 | 1.16 | 78.0 |
| CosyVoice3 | 1.5B | ✅ | 2.22 | 72.0 | 1.12 | 78.1 |
| F5-TTS | 0.3B | ✅ | 2.00 | 67.0 | 1.53 | 76.0 |
| VibeVoice | 1.5B | ✅ | 3.04 | 68.9 | 1.16 | 74.4 |
| FishAudio-S1 | 4B | ✅ | 1.72 | 62.57 | 1.22 | 72.1 |
| Seed-TTS（闭源） | — | ❌ | 2.25 | 76.2 | 1.12 | 79.6 |
| MiniMax-Speech（闭源） | — | ❌ | 1.65 | 69.2 | 0.83 | 78.3 |

### 11.4 各模型"最"标签

| 维度 | 最优模型 | 说明 |
|---|---|---|
| 🏆 **语言覆盖最广** | VoxCPM2 | 30 国语言 + 9 大方言 |
| 🏆 **方言数量最多** | CosyVoice3 | 18 种中国方言 |
| 🏆 **英文 WER 最低** | Qwen3-TTS 1.7B | 1.50% |
| 🏆 **中文 CER 最低** | IndexTTS2 | 1.03% |
| 🏆 **中文 SIM 最高** | MossTTSLocal | 78.82% |
| 🏆 **英文 SIM 最高** | MossTTSLocal | 73.42% |
| 🏆 **延迟最低** | Qwen3-TTS | 97ms 端到端 |
| 🏆 **最轻量（CPU）** | MOSS-TTS-Nano | 0.1B，CPU 可跑 |
| 🏆 **最轻量（浏览器）** | Kokoro | 82M，ONNX/TF.js |
| 🏆 **功能最全面** | Qwen3-TTS | 克隆+设计+指令控制+流式 |
| 🏆 **生态最完整** | MOSS-TTS 家族 | TTS+对话+音效+设计+实时 |
| 🏆 **长语音最强** | VibeVoice | 最长 90 分钟连续语音 |
| 🏆 **情感控制最精细** | Fish Speech | 行内标签精细化控制 |
| 🏆 **少样本克隆最易** | GPT-SoVITS | 5 秒零样本，1 分钟微调 |
| 🏆 **音质最高** | VoxCPM2 | 48kHz Hi-Fi |

---

## 十二、免费 API 调用渠道汇总

### 12.1 总览表

| 模型 | TTS.ai | SiliconFlow | 阿里云百炼 | Replicate | fal.ai | HuggingFace Demo |
|---|---|---|---|---|---|---|
| **VoxCPM (0.5B)** | ✅ Standard | ❌ | ❌ | ❌ | ❌ | ✅ 已确认 |
| **VoxCPM2** | ❌ 未确认 | ❌ | ❌ | ❌ | ❌ | ✅ 魔搭社区 |
| **Qwen3-TTS** | ✅ Standard | ❌ | ✅ DashScope | ✅ 已确认 | ❌ | ✅ 已确认 |
| **MOSS-TTS-Nano** | ❌ 未确认 | ❌ | ❌ | ❌ | ❌ | ✅ 已确认 |
| **MOSS-TTSD** | ✅ Standard | ✅ 已确认 | ❌ | ❌ | ❌ | ✅ 已确认 |
| **CosyVoice2/3** | ✅ Standard | ✅ 已确认 | ✅ 已确认 | ❌ | ❌ | ⚠️ 待验证 |
| **VibeVoice** | ✅ Standard | ❌ | ❌ | ❌ | ❌ | ⚠️ 待验证 |
| **IndexTTS2** | ✅ Standard | ❌ | ❌ | ❌ | ❌ | ⚠️ 待验证 |
| **GPT-SoVITS** | ✅ Standard | ❌ | ❌ | ❌ | ❌ | ⚠️ 待验证 |
| **Fish Speech** | ❌ 未确认 | ❌ | ❌ | ❌ | ❌ | ⚠️ 待验证 |
| **F5-TTS** | ❌ 未确认 | ❌ | ❌ | ❌ | ❌ | ⚠️ 待验证 |
| **Kokoro** | ✅ Free | ❌ | ❌ | ❌ | ❌ | ⚠️ 待验证 |
| **Chatterbox** | ✅ Standard | ❌ | ❌ | ❌ | ✅ 已确认 | ⚠️ 待验证 |
| **Orpheus TTS** | ✅ Standard | ❌ | ❌ | ❌ | ✅ 已确认 | ⚠️ 待验证 |
| **MiniMax Speech-02** | ❌ 未确认 | ❌ | ❌ | ❌ | ✅ 已确认 | ⚠️ 待验证 |
| **Dia TTS** | ✅ Standard | ❌ | ❌ | ❌ | ✅ 已确认 | ⚠️ 待验证 |

### 12.2 平台详解

---

#### 🟢 1. TTS.ai（覆盖模型最全，推荐体验）

- **网址**：https://tts.ai/
- **覆盖**：32+ 开源模型、235+ 音色、33+ 语言
- **免费等级**：Kokoro、Piper、VITS、MeloTTS、Kani TTS 2、OuteTTS、Pocket TTS、Kitten TTS、Ming-Omni TTS 等
- **Standard 等级**：VoxCPM、CosyVoice2/3、MOSS-TTSD、Qwen3 TTS、VibeVoice、IndexTTS2、GPT-SoVITS、Chatterbox、Dia TTS、Orpheus 等
- **Premium 等级**：Tortoise TTS、StyleTTS 2、OpenVoice、Sesame CSM 等
- **使用限制**：未注册 500 字符/次；注册赠送 **50 免费积分**，可使用所有模型；付费 $9/月起
- **API**：提供 OpenAI 兼容 API
- **特点**：无需账号即可试用，覆盖模型最广，适合快速体验和对比

---

#### 🟢 2. SiliconFlow 硅基流动（国内首选，低延迟）

- **网址**：https://cloud.siliconflow.cn
- **支持模型**：CosyVoice2-0.5B（含情感控制、方言、跨语言）、MOSS-TTSD-v0.5（双人对话）
- **免费额度**：新用户注册赠送免费额度，按 UTF-8 字节数计费
- **API 格式**：OpenAI 兼容（`/v1/audio/speech`）
- **特点**：国内低延迟、支持用户自定义音色上传、支持动态音色

```python
from openai import OpenAI

client = OpenAI(
    api_key="你的API Key",
    base_url="https://api.siliconflow.cn/v1"
)

# CosyVoice2 - 系统预置音色
with client.audio.speech.with_streaming_response.create(
    model="FunAudioLLM/CosyVoice2-0.5B",
    voice="FunAudioLLM/CosyVoice2-0.5B:alex",
    input="你能用高兴的情感说吗？<|endofprompt|>今天真是太开心了！",
    response_format="mp3"
) as response:
    response.stream_to_file("output.mp3")
```

```python
# MOSS-TTSD - 双人对话生成
import requests, json
url = "https://api.siliconflow.cn/v1/audio/speech"
data = {
    "model": "fnlp/MOSS-TTSD-v0.5",
    "stream": True,
    "input": "[S1]Hello, how are you?[S2]I'm doing great, thanks!",
    "references": [
        {"audio": "ref_speaker1.wav", "text": "参考文本1"},
        {"audio": "ref_speaker2.wav", "text": "参考文本2"}
    ],
    "response_format": "mp3"
}
res = requests.post(url=url, data=json.dumps(data), headers={'Authorization': 'Bearer ' + token})
```

---

#### 🟢 3. 阿里云百炼 DashScope（Qwen3-TTS + CosyVoice 官方 API）

- **网址**：https://dashscope.aliyuncs.com
- **支持模型**：
  - **Qwen3-TTS**（qwen3-tts-vc-2026-01-22）— 1.7B 版本，支持克隆/设计/预置音色
  - **CosyVoice3**（cosyvoice-v3-flash / cosyvoice-v3-plus）— 最新版
  - **CosyVoice2**（cosyvoice-v2）— 上一代
  - **千问3-TTS**（qwen3-tts）— 另一版本
- **免费额度**：新用户有免费试用额度
- **计费方式**：按字符数计费（汉字按 2 字符计算）
- **特点**：官方维护、稳定性最好、支持流式
- **文档**：https://help.aliyun.com/zh/model-studio/qwen-tts-realtime

```bash
# Qwen3-TTS API 调用
curl -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text2audio/generation \
  -H "Authorization: Bearer $DASHSCOPE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-tts",
    "input": {"text": "你好，欢迎使用语音合成"},
    "parameters": {"speaker": "Vivian"}
  }'
```

```bash
# CosyVoice3 API 调用
curl -X POST https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer \
  -H "Authorization: Bearer $DASHSCOPE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "cosyvoice-v3-flash",
    "input": {"text": "你好，欢迎使用语音合成"},
    "parameters": {"voice": "longxiaochun"}
  }'
```

---

#### 🟡 4. Replicate（国际平台，按量付费有免费额度）

- **网址**：https://replicate.com
- **支持 TTS 模型**：
  - **Qwen3-TTS**（qwen/qwen3-tts）— ✅ 已确认可用，20 万+ 次运行
  - 其他模型持续增加中
- **免费额度**：注册赠送少量免费额度（通常 $0.50-$1.00）
- **计费方式**：按秒计费（GPU 推理时间）
- **API 格式**：RESTful API，支持多种 SDK
- **特点**：国际平台，模型更新快，适合海外用户

```python
# Replicate API 调用 Qwen3-TTS
import replicate

output = replicate.run(
    "qwen/qwen3-tts",
    input={
        "text": "Hello, this is a test.",
        "speaker": "Ryan",
        "language": "English"
    }
)
# output 为生成的音频文件 URL
```

---

#### 🟡 5. fal.ai（国际平台，多模型聚合）

- **网址**：https://fal.ai
- **支持 TTS 模型**：
  - **Chatterbox TTS**（fal-ai/chatterbox/text-to-speech）— 高质量语音合成
  - **Orpheus TTS**（fal-ai/orpheus-tts）— Llama-based 情感语音合成
  - **MiniMax Speech-02 HD**（audiominimax/speech-02-hd）— 高保真语音
  - **Dia TTS Voice Clone**（fal-ai/dia-tts/voice-clone）— 对话声音克隆
- **免费额度**：注册赠送少量免费额度
- **计费方式**：按次/按字符计费
- **特点**：推理速度快（"warm inference"），支持流式，适合实时应用

---

#### 🟡 6. HuggingFace（免费体验 + Inference API）

- **网址**：https://huggingface.co
- **免费 Web Demo**（Gradio Spaces）：

| 模型 | Demo 链接 |
|---|---|
| VoxCPM (0.5B) | https://huggingface.co/spaces/openbmb/VoxCPM-Demo |
| VoxCPM2 | https://modelscope.cn/studios/OpenBMB/VoxCPM2-Demo（魔搭） |
| Qwen3-TTS | https://huggingface.co/spaces/Qwen/Qwen3-TTS |
| MOSS-TTS-Nano | https://huggingface.co/spaces/OpenMOSS-Team/MOSS-TTS-Nano |
| MOSS-TTS | https://huggingface.co/OpenMOSS-Team/MOSS-TTS |

- **Inference API**（付费）：
  - HuggingFace 提供 Serverless Inference API，支持部分 TTS 模型
  - PRO 计划 $9/月，提供更高限额
  - 适合生产环境部署
- **特点**：Demo 完全免费但无 SLA；Inference API 按量付费

---

#### 🟡 7. 火山引擎（豆包语音，字节跳动）

- **网址**：https://www.volcengine.com/product/speech-service
- **支持模型**：豆包语音合成、声音复刻、语音识别
- **免费额度**：新用户有免费试用额度；每天每模型 50 万免费 Token
- **特点**：指令式情感控制、声音复刻秒级、适合短视频配音
- **创业者计划**：入选企业可获 3 个月免费试用（价值 4.7 万元）

---

#### 🟡 8. 腾讯云语音合成

- **网址**：https://cloud.tencent.cn/product/tts
- **支持模型**：腾讯自研神经语音合成模型
- **免费额度**：新用户有免费试用额度
- **计费方式**：预付费（字符资源包）+ 后付费
- **特点**：企业级稳定、多语种、SDK 完善

---

#### 🟡 9. 有道智云 TTS

- **网址**：https://ai.youdao.com/product-tts.s
- **免费额度**：新用户注册赠送 **50 元体验资金**
- **计费方式**：按量计费，月调用量阶梯定价
- **特点**：中文语音合成质量高，适合有声阅读、翻译对话

---

#### 🟡 10. Fish Audio 企业平台

- **网址**：https://fish.audio/
- **支持模型**：Fish Audio S2（精细化情感控制）
- **免费额度**：有限试用
- **计费方式**：按量付费
- **特点**：企业级安全（声纹加密、ISO27001）、20+ 预设模式、RESTful API

---

### 12.3 平台对比速查

| 平台 | 类型 | 免费额度 | 延迟 | 推荐场景 |
|---|---|---|---|---|
| **TTS.ai** | 国际 | 50 积分（注册） | 中 | 快速体验、模型对比 |
| **SiliconFlow** | 国内 | 新用户赠送 | **低** | 国内生产集成 |
| **阿里云百炼** | 国内 | 新用户试用 | 低 | Qwen3-TTS/CosyVoice 生产 |
| **Replicate** | 国际 | ~$0.50 注册赠送 | 中 | Qwen3-TTS 海外调用 |
| **fal.ai** | 国际 | 注册赠送 | **极低** | 实时语音应用 |
| **HuggingFace** | 国际 | Demo 免费 | 中 | 体验测试 |
| **火山引擎** | 国内 | 每天 50 万 Token | 低 | 豆包语音、短视频 |
| **腾讯云** | 国内 | 新用户试用 | 低 | 企业级客服 |
| **有道智云** | 国内 | 50 元体验金 | 低 | 中文有声阅读 |

### 12.4 各模型最佳免费调用路径

| 模型 | 🥇 最推荐 | 🥈 备选 | 🥉 第三选择 |
|---|---|---|---|
| **Qwen3-TTS** | 阿里云百炼（官方） | TTS.ai（Standard） | Replicate |
| **CosyVoice2/3** | 阿里云百炼（官方） | SiliconFlow | TTS.ai（Standard） |
| **MOSS-TTSD** | SiliconFlow | TTS.ai（Standard） | HuggingFace Demo |
| **VoxCPM** | TTS.ai（Standard） | HuggingFace Demo | — |
| **Kokoro** | TTS.ai（**完全免费**） | HuggingFace Demo | — |
| **Chatterbox** | fal.ai | TTS.ai（Standard） | — |
| **Orpheus TTS** | fal.ai | TTS.ai（Standard） | — |
| **MiniMax Speech** | fal.ai | — | — |

---

## 十三、选型决策指南

### 13.1 场景推荐

```
┌─────────────────────────────────────────────────────────┐
│                    你需要什么？                           │
├─────────────┬───────────────────────────────────────────┤
│ 极致音质 +  │                                          │
│ 多语言 +    │          → VoxCPM2 🏆                    │
│ 音色设计    │                                          │
├─────────────┼───────────────────────────────────────────┤
│ 功能最全面  │                                          │
│ 克隆+设计+  │          → Qwen3-TTS 🎯                  │
│ 指令+低延迟 │                                          │
├─────────────┼───────────────────────────────────────────┤
│ 完整语音生态 │                                          │
│ (对话/音效/ │          → MOSS-TTS 家族 💪              │
│ 实时)       │                                          │
├─────────────┼───────────────────────────────────────────┤
│ 中文方言场景│          → CosyVoice3 ⚖️                  │
│             │          → Qwen3-TTS（北京/四川方言）🎯    │
├─────────────┼───────────────────────────────────────────┤
│ 长语音/播客 │          → VibeVoice 🎙️                   │
│ 对话生成    │          → MOSS-TTSD 💬                   │
├─────────────┼───────────────────────────────────────────┤
│ 情感精细控制│          → Fish Speech 🎭                  │
│             │          → IndexTTS2 🎨                   │
├─────────────┼───────────────────────────────────────────┤
│ 少样本克隆  │          → GPT-SoVITS 🎤                   │
│ 中文AI配音  │          → Qwen3-TTS（3秒克隆）🎯          │
├─────────────┼───────────────────────────────────────────┤
│ CPU/边缘设备│          → MOSS-TTS-Nano 🪶              │
│ 零门槛部署  │          → Kokoro 🌐                      │
├─────────────┼───────────────────────────────────────────┤
│ 免费在线API │          → TTS.ai / SiliconFlow           │
│ 快速集成    │          → 阿里云百炼（Qwen3-TTS）         │
└─────────────┴───────────────────────────────────────────┘
```

### 13.2 关键差异总结

#### VoxCPM2 vs Qwen3-TTS：全能 vs 全功能

| 对比维度 | VoxCPM2 | Qwen3-TTS |
|---|---|---|
| 参数量 | 2B | 0.6B / 1.7B |
| 技术路线 | Tokenizer-Free（创新） | 离散多码本 LM（成熟） |
| 语言覆盖 | **30 语言 + 9 方言** | 10 语言 + 方言音色 |
| 音色设计 | ✅ | ✅ |
| 指令控制 | ❌ | ✅ **自然语言** |
| 延迟 | RTF 0.17 | **97ms 端到端** |
| 音质 | **48kHz Hi-Fi** | 24kHz |
| API 支持 | — | ✅ 阿里云百炼 |
| 微调 | LoRA | ✅ Base 模型可微调 |

#### Qwen3-TTS vs CosyVoice3：同门之争

| 对比维度 | Qwen3-TTS | CosyVoice3 |
|---|---|---|
| 音色设计 | ✅ | ❌ |
| 指令控制 | ✅ | ❌ |
| 延迟 | **97ms** | 150ms |
| 方言 | 北京/四川 | **18 种方言** |
| API | ✅ DashScope | ✅ DashScope |

---

## 十四、附录：学习资源链接

### 官方仓库

| 模型 | GitHub | HuggingFace | 魔搭社区 |
|---|---|---|---|
| VoxCPM | https://github.com/OpenBMB/VoxCPM | https://huggingface.co/openbmb/VoxCPM | https://modelscope.cn/models/OpenBMB/VoxCPM2 |
| MOSS-TTS | https://github.com/OpenMOSS/MOSS-TTS | https://huggingface.co/OpenMOSS-Team/MOSS-TTS | — |
| MOSS-TTS-Nano | https://github.com/OpenMOSS/MOSS-TTS-Nano | https://huggingface.co/OpenMOSS-Team/MOSS-TTS-Nano | — |
| Qwen3-TTS | https://github.com/QwenLM/Qwen3-TTS | https://huggingface.co/collections/Qwen/qwen3-tts | https://modelscope.cn/collections/Qwen/Qwen3-TTS |
| CosyVoice | https://github.com/FunAudioLLM/CosyVoice | https://huggingface.co/FunAudioLLM/CosyVoice2-0.5B | https://modelscope.cn/models/iic/CosyVoice-300M |
| VibeVoice | https://github.com/microsoft/VibeVoice | — | — |
| IndexTTS2 | https://github.com/index-tts/index-tts | — | — |
| GPT-SoVITS | https://github.com/RVC-Boss/GPT-SoVITS | — | — |
| Fish Speech | https://github.com/fishaudio/fish-speech | — | — |
| F5-TTS | https://github.com/SWivid/F5-TTS | — | — |
| Kokoro | https://github.com/hexgrad/Kokoro-82M | — | — |

### 在线体验

| 平台 | 网址 | 说明 |
|---|---|---|
| TTS.ai | https://tts.ai/ | 32+ 模型在线体验 |
| SiliconFlow | https://cloud.siliconflow.cn | 国内 API 平台 |
| 阿里云百炼 | https://dashscope.aliyuncs.com | Qwen3-TTS + CosyVoice API |
| VoxCPM 官网 | https://voxcpm.net/ | 项目介绍与文档 |
| VoxCPM2 Demo | https://voxcpm.modelbest.cn/ | VoxCPM2 在线体验 |
| MOSS-TTS-Nano Demo | https://openmoss.github.io/MOSS-TTS-Nano-Demo/ | Nano 在线体验 |
| Fish Audio | https://fish.audio/ | Fish Speech 企业平台 |

### 技术论文

| 模型 | 论文链接 |
|---|---|
| VoxCPM | https://arxiv.org/abs/2412.00532 |
| MOSS-TTS | https://arxiv.org/abs/2603.18090 |
| Qwen3-TTS | https://arxiv.org/abs/2601.15621 |
| VibeVoice | ICLR 2026 Oral（待公开） |

---

> **声明**：本文档基于公开资料整理，部分信息（特别是 VoxCPM2 的架构细节）来自非官方来源，待官方技术报告发布后可能需要更新。建议以各模型官方 GitHub 仓库和论文为准。
