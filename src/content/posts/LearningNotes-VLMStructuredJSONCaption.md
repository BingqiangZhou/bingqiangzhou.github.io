---
title: 【学习笔记】图像生成模型的 JSON Caption：为什么用结构化描述训练图像
published: 2026-06-05
description: 探索图像生成模型（Ideogram 4.0、FIBO、FLUX.2、DALL-E 3）为何转向使用结构化 JSON 格式的 caption 作为训练数据，以及这一趋势带来的收益。
lang: zh
tags: [学习笔记, AI图像生成]
---

> 调研日期：2026-06-05
>
> 本文探索一个正在改变图像生成领域的关键趋势：**为什么主流图像生成模型开始使用结构化 JSON 格式的 caption 来训练和推理**。从 DALL-E 3 的合成 caption 到 Ideogram 4.0 完全基于 JSON caption 训练，这一转变背后的动机和收益值得深入理解。

---

## 1. 什么是 JSON Caption

传统图像生成模型的训练数据是"图像 - 文本对"（image-text pair），其中文本描述通常是自然语言的一段话，比如：

```text
A cat sitting on a wooden table next to a cup of coffee, 
sunlight streaming through a window in the background.
```

而 **JSON Caption** 是用结构化的 JSON 格式来描述同一张图像：

```json
{
  "high_level_description": "A warm indoor scene with a tabby cat on a wooden table beside a coffee cup, lit by afternoon window light.",
  "style_description": {
    "lighting": "Soft warm afternoon light from a window on the left",
    "medium": "Photograph",
    "color_palette": ["#8B6914", "#DEB887", "#F5F5DC"]
  },
  "compositional_deconstruction": {
    "background": "A cozy kitchen interior with white walls and a window on the left letting in warm light.",
    "elements": [
      {
        "type": "obj",
        "desc": "Tabby cat sitting upright on the wooden table, facing slightly left, green eyes wide open."
      },
      {
        "type": "obj",
        "desc": "White ceramic coffee cup on a saucer, steam rising, placed to the right of the cat."
      }
    ]
  }
}
```

核心区别：**自然语言 caption 是一维的线性描述，而 JSON Caption 是多维度的结构化描述**——它把图像拆解为风格、光照、构图、元素、颜色、空间关系等独立维度。

---

## 2. 起点：DALL-E 3 证明"更好的 Caption = 更好的图像"

这一趋势的起点可以追溯到 2023 年 OpenAI 发表的论文 [*Improving Image Generation with Better Captions*](https://cdn.openai.com/papers/dall-e-3.pdf)。

### 2.1 问题：训练数据的 Caption 太短了

大规模图像 - 文本数据集（如 LAION）的 caption 普遍存在质量问题：

- **描述不完整**：图像中有 5 个物体，caption 只提到 2 个
- **缺少属性细节**：物体是什么颜色、什么材质、多大尺寸，caption 经常遗漏
- **忽略空间关系**：物体之间的前后左右关系没有被描述
- **风格信息缺失**：图像的光照、色调、画面的艺术风格等很少被提及

模型在这样的数据上训练，学到的只是"大致的画面感"，而不是精确的图文对应关系。

### 2.2 DALL-E 3 的解法：合成 Caption

OpenAI 的方法分为三步：

1. **训练一个强大的图像描述模型**（image captioner）
2. 用这个模型为训练集中的每一张图像**生成详尽的合成 caption**
3. 用**95% 合成 caption + 5% 原始 caption** 的混合数据训练 DALL-E 3

```text
原始 caption（短、稀疏）：
  "A dog in a park"

合成 caption（长、密集）：
  "An expressive oil painting of a golden retriever puppy sitting in tall grass 
   in a sunlit meadow, with wildflowers scattered around. The dog has warm amber 
   eyes and is looking directly at the viewer. Soft brushstrokes create a 
   dreamy atmosphere with dappled light filtering through distant trees."
```

**效果**：DALL-E 3 的 prompt following（提示词遵从度）取得了质的飞跃。同一 prompt 下，DALL-E 3 能准确生成多个物体和复杂属性，而 Midjourney 等模型经常出现"属性混淆"（比如要求"一只红色猫和一只蓝色狗"，结果生成了一只蓝色的猫和一只红色的狗）。

> **关键洞察**：DALL-E 3 的突破不是架构创新，而是**数据质量**的突破。更详细、更准确的 caption 让模型学到了更精确的图文映射。

### 2.3 从"更长的 Caption"到"结构化的 Caption"

DALL-E 3 证明了 caption 质量的重要性，但它的合成 caption 仍然是自然语言——只是更长了。下一步的演进方向自然而然：**如果更长的描述更好，那么结构化的描述应该更好**。

这就是 JSON Caption 登场的逻辑。

---

## 3. 为什么 JSON Caption 比纯文本 Caption 更好

### 3.1 显式属性绑定（Explicit Attribute Binding）

纯文本 caption 的属性和物体是"松散关联"的：

```text
"a red cat and a blue dog sitting on a green couch"
```

模型需要自己理解"red"修饰的是"cat"而不是"dog"。当场景变复杂时（10 个物体，20 个属性），这种歧义会导致严重的**属性混淆**。

JSON Caption 通过结构显式绑定属性：

```json
{
  "elements": [
    {"type": "obj", "desc": "A red cat sitting on the left side of the couch"},
    {"type": "obj", "desc": "A blue dog sitting on the right side of the couch"}
  ]
}
```

每个属性直接"挂"在对应的物体上，模型不需要猜测修饰关系。

### 3.2 组合理解（Compositional Understanding）

当 prompt 包含多个物体和复杂关系时，纯文本的线性描述力不从心。JSON 的层级结构天然适合表达组合关系：

```json
{
  "compositional_deconstruction": {
    "background": "Urban street at dusk with warm orange sky",
    "elements": [
      {"type": "obj", "bbox": [100, 200, 400, 600], "desc": "Woman in red coat walking on the left sidewalk"},
      {"type": "obj", "bbox": [500, 300, 800, 700], "desc": "Man in black jacket standing at the bus stop on the right"},
      {"type": "text", "bbox": [200, 50, 350, 100], "text": "CAFÉ", "desc": "Neon sign above the door in warm yellow"}
    ]
  }
}
```

- `background` 独立于前景元素
- 每个 element 有自己的空间位置（`bbox`）和描述
- 文本元素（`text`）可以精确指定渲染内容和样式

### 3.3 解耦的维度控制（Disentangled Control）

JSON 把图像的不同方面拆到独立字段中，模型可以独立学习每个维度：

| 维度 | JSON 字段 | 控制能力 |
|------|----------|---------|
| **整体构图** | `high_level_description` | 全局画面 |
| **风格** | `style_description.aesthetics` | 美学风格 |
| **光照** | `style_description.lighting` | 光线方向和质感 |
| **媒介** | `style_description.medium` | 摄影/油画/插画等 |
| **调色板** | `style_description.color_palette` | 精确的十六进制色值 |
| **布局** | `elements[].bbox` | 元素的精确位置 |
| **文本渲染** | `elements[type=text]` | 画面中文字的内容和样式 |

这种解耦使得用户可以在推理时**只修改一个维度**而不影响其他维度。例如，只改变颜色方案而不改变构图。

### 3.4 更密集的监督信号（Denser Supervision）

训练时，JSON Caption 中**每个字段都提供了独立的监督信号**。传统的"一张图 + 一段话"只有一个学习目标；而"一张图 + 一个结构化 JSON"有多个学习目标：

```text
传统 caption 的学习目标：
  图像 → "一只猫在桌子上"     （1 个学习目标）

JSON caption 的学习目标：
  图像 → 风格描述是"照片"      （学习目标 1）
  图像 → 光照是"午后阳光"      （学习目标 2）
  图像 → 猫在画面左侧 [100,200,400,600]  （学习目标 3）
  图像 → 杯子在猫的右侧（学习目标 4）
  图像 → 色调偏暖 ["#8B6914"] （学习目标 5）
  ...每个字段都是独立的学习信号
```

**关系确定得越多，每对训练数据提供的监督越密集**。这使得同样数量的训练图像能产生更多的学习信号。

### 3.5 精确的空间控制（Bounding Box Layout）

JSON Caption 可以包含 `bbox`（边界框）信息，直接指定每个元素在画面中的位置：

```json
{
  "type": "obj",
  "bbox": [380, 590, 660, 720],
  "desc": "Lone wooden sailboat on the right-third vertical in the midground"
}
```

这是纯文本 caption 无法提供的——你可以在文本里说"靠右"，但"靠右"是模糊的；而 `[380, 590, 660, 720]`（0-1000 归一化坐标）是精确的。

---

## 4. 代表模型：谁在用 JSON Caption

### 4.1 Ideogram 4.0——完全基于 JSON Caption 训练

[Ideogram 4.0](https://ideogram.ai/blog/ideogram-4.0/) 是这一趋势最激进的实践者：**训练数据全部使用结构化 JSON Caption**，不用任何纯文本 caption。

**核心架构**：
- 93 亿参数的单流 Diffusion Transformer（DiT）
- 文本编码器使用 **Qwen3-VL-8B-Instruct**（视觉语言模型）
- 使用 13 层中间层的隐藏状态拼接（而非单层）
- 训练和推理**共享同一种 JSON prompt 格式**

**训练方法**：每张训练图像的 caption 都是一个详尽的 JSON，包含：

```json
{
  "high_level_description": "整体画面描述",
  "style_description": {
    "aesthetics": "美学风格",
    "lighting": "光照描述",
    "photo": "摄影参数",
    "medium": "媒介",
    "color_palette": ["#hex1", "#hex2"]
  },
  "compositional_deconstruction": {
    "background": "背景描述",
    "elements": [
      {
        "type": "obj | text",
        "bbox": [y_min, x_min, y_max, x_max],
        "desc": "元素视觉描述",
        "text": "如果是文字元素，要渲染的文字内容"
      }
    ]
  }
}
```

**推理时**：参考推理管道会将每个 prompt 解析为 JSON 并**验证 schema 后再生成**。这意味着推理时的输入格式与训练时完全一致。

**能力亮点**（基准测试数据）：

| 能力 | 基准 | 得分 |
|------|------|------|
| 布局控制 | 7Bench mIoU | **0.69**（开放权重最高） |
| 文字渲染 | X-Omni OCR 准确率 | **0.97** |
| 空间推理 | SpatialGenEval | **0.76** |
| Prompt 遵从 | Prism-bench | **0.89** |

三个纯文本 prompt 无法实现的能力：
1. **调色板条件控制**：最多 16 个十六进制颜色值直接控制主色调
2. **边界框布局**：任意元素可指定 `[y_min, x_min, y_max, x_max]` 精确定位
3. **文字元素独立控制**：文字内容和视觉样式分开描述

### 4.2 FIBO（Bria AI）——首个开源 JSON-Native 模型

[FIBO](https://github.com/Bria-AI/FIBO) 由 Bria AI 开发，是**首个开源的、原生 JSON 的文本转图像模型**。

**定位**：面向企业级创作工作流，追求可预测、可复现的图像生成。

**特点**：
- 训练使用长达 **1000+ 词**的结构化 JSON caption
- 精确控制光照、构图、景深、相机参数
- 在 [fal.ai](https://fal.ai/models/bria/fibo/generate) 上提供 API 服务
- 还有一个衍生模型 **FIBO Edit**，支持 JSON + 蒙版的结构化图像编辑

**背后的研究**：FIBO 基于论文 [*Generating an Image From 1,000 Words: Enhancing Text-to-Image With Structured Captions*](https://arxiv.org/html/2511.06876v1)，该论文提出了 **TaBR（Text-as-a-Bottleneck Reconstruction，文本瓶颈重建）** 评估协议——通过衡量真实图像能否经由"描述→生成"的闭环重建，来评估结构化 caption 的可控性。

### 4.3 FLUX.2（Black Forest Labs）——支持 JSON 结构化 Prompt

[FLUX.2](https://docs.bfl.ml/guides/prompting_guide_flux2) 是 320 亿参数的 rectified flow transformer，**支持结构化 JSON prompt 输入**：

- 同时接受自然语言和 JSON 格式的 prompt
- JSON prompt 提供精确控制：hex 颜色匹配、排版、姿态引导
- 适用于复杂的场景和生产工作流
- 企业版支持品牌色精确匹配和可靠排版

### 4.4 DALL-E 3——合成 Caption 的先驱

虽然 DALL-E 3 使用的是**密集自然语言 caption** 而非 JSON，但它的方法论（用更好的 caption 训练 → 更好的生成质量）是 JSON Caption 趋势的思想源头。

DALL-E 3 的启示：
- **95% 合成 caption + 5% 原始 caption** 的混合策略是有效的
- 人工评估确认 prompt following 能力显著提升
- **但**自然语言 caption 的上限受限于线性描述的歧义性

---

## 5. JSON Caption 的生成：VLM 作为标注器

JSON Caption 不会由人工手动编写（太贵、太慢），而是由**视觉语言模型（VLM）自动生成**。

### 5.1 标注流水线

```text
原始图像
    │
    ▼
VLM（如 Qwen3-VL、GPT-4o）
    │  输入：图像 + JSON Schema 要求
    │  输出：结构化 JSON Caption
    ▼
质量过滤
    │  过滤掉 schema 不合规、描述不准确的 caption
    ▼
人工抽检（可选）
    │  小比例人工验证质量
    ▼
训练数据集
    图像 + JSON Caption 对
```

### 5.2 Ideogram 的 Describe API

Ideogram 4.0 提供了 [Describe API](https://developer.ideogram.ai/api-reference/api-reference/describe-v4)，可以将任意图像反向生成为结构化 JSON prompt：

```text
输入图像 → Describe API → V4JsonPrompt（结构化 JSON）→ 可直接喂回 Generate API
```

这形成了一个 **"描述 - 再生成"（describe-then-regenerate）** 的闭环工作流：
1. 上传一张参考图像
2. 获取其 JSON 结构化描述
3. 修改 JSON 中的任意字段
4. 用修改后的 JSON 重新生成图像

### 5.3 用 Structured Output 保证标注质量

VLM 生成 JSON Caption 时，可以使用各厂商的 **Structured Output / JSON Mode** 来保证输出格式合规：

| 厂商 | 功能 | 效果 |
|------|------|------|
| OpenAI | `response_format: json_schema` | 接近 100% schema 合规 |
| Google Gemini | `response_schema` | 支持 Pydantic/Zod 直接传入 |
| Anthropic Claude | `output_config.format` | 8 个模型全支持，已 GA |

这一步确保了自动标注产出的 JSON 在语法层面是可靠的。

---

## 6. JSON Caption 的收益与权衡

### 6.1 核心收益

| 收益 | 说明 |
|------|------|
| **更精确的图文对应** | 消除自然语言的歧义，属性与物体一一绑定 |
| **更强的组合控制** | 多物体、多属性的复杂场景不再是噩梦 |
| **可编程的生成控制** | 可以通过代码精确操控图像的每个视觉维度 |
| **更密集的训练信号** | 同样数量的训练图像产生更多学习信号 |
| **空间感知** | bbox 坐标让模型理解物体在画面中的精确位置 |
| **文字渲染能力** | 分离文字内容和视觉样式，实现精确的画面文字 |
| **闭环工作流** | 图像 → JSON → 修改 → 再生成 |

### 6.2 代价与挑战

| 挑战 | 说明 |
|------|------|
| **标注成本** | JSON Caption 比短文本标注复杂得多，依赖 VLM 自动生成 |
| **标注质量** | VLM 自动生成的 caption 可能包含幻觉（描述图像中不存在的元素） |
| **Token 开销** | 一个详细的 JSON Caption 可能长达数百甚至上千 token，训练和推理成本更高 |
| **Schema 设计** | 不同模型使用不同的 JSON Schema，尚无统一标准 |
| **用户学习成本** | 用户需要理解 JSON 结构才能发挥最大控制力 |
| **简单场景可能"过剩"** | 对于简单图像，JSON Caption 的结构化优势不明显 |

---

## 7. 相关概念延伸

### 7.1 场景图（Scene Graph）

JSON Caption 与**场景图**（Scene Graph）有天然的联系。场景图是一种用图结构描述图像的方式，节点是物体和属性，边是关系：

```text
场景图：
  猫（红色）──[坐在]── 沙发（绿色）
  猫（红色）──[旁边]── 杯子（白色）
  窗户 ──[在...左侧]── 沙发
```

JSON Caption 可以看作是场景图的一种"可序列化"形式。研究社区中，[Graph-Based Captioning](https://arxiv.org/html/2407.06723v1) 等工作正在探索如何用图结构增强图像描述。

### 7.2 密集 Caption（Dense Caption）

**密集 Caption** 是 JSON Caption 的"前身"——对图像中每个区域生成独立的描述（region description）。从 dense caption 到 JSON caption 的演进，可以看作是从"分散的描述片段"到"统一的结构化描述"。

### 7.3 BACON (CVPR 2025)

[BACON](https://openaccess.thecvf.com/content/CVPR2025/papers/Yang_BACON_Improving_Clarity_of_Image_Captions_via_Bag-of-Concept_Graphs_CVPR_2025_paper.pdf)（Bag-of-Concept Graphs）提出了一种从 VLM 中提取**逐元素的结构化 caption** 的方法，使得图像描述更清晰、更完整。这类方法是自动生成高质量 JSON Caption 的关键技术。

### 7.4 JSON Prompt 与纯文本 Prompt 的关系

值得注意的是，**用 JSON Caption 训练的模型通常仍能接受纯文本输入**。Ideogram 4.0 就是如此——训练时全用 JSON，但推理时纯文本也能工作，只是 JSON prompt 能解锁更精确的控制。

正如 [ImagineArt 的评测](https://www.imagine.art/blogs/ideogram-4-0-prompt-guide)所说：*"Plain text works well. JSON works better."*

---

## 8. 总结

图像生成模型从纯文本 caption 到 JSON Caption 的转变，是一个从"模糊的直觉描述"到"精确的工程描述"的演进：

```text
2022  短文本 caption      "a cat on a table"           → Stable Diffusion 时代
2023  密集合成 caption     "A warm photo of a tabby..." → DALL-E 3 的突破
2025  结构化 JSON caption  {"elements": [...], ...}     → FIBO（Bria AI，8B 参数）
2026  全 JSON 原生训练     完全基于 JSON caption 训练    → Ideogram 4.0（9.3B 参数）
```

**核心驱动力**：当图像生成模型需要处理越来越复杂的场景（多物体、精确属性、空间关系、文字渲染、风格控制）时，纯文本的一维线性描述已经不够用了。JSON 的多维结构化描述为模型提供了更密集的训练信号和更精确的控制维度。

这一趋势才刚刚开始。随着更多模型采用 JSON-native 的训练方式，我们可能会看到：
- **统一的 JSON Schema 标准**（目前各模型 schema 不同）
- **更智能的自动标注工具**（VLM → JSON Caption 质量持续提升）
- **从文本到图像到视频的扩展**（结构化 caption 同样适用于视频生成）
- **更多"可编程"的创意工具**（开发者用代码而非自然语言来控制图像生成）

---

## 参考资料

- [Improving Image Generation with Better Captions (DALL-E 3, OpenAI)](https://cdn.openai.com/papers/dall-e-3.pdf)
- [Ideogram 4.0 Technical Details](https://ideogram.ai/blog/ideogram-4.0/)
- [FIBO: Structured Control for Text-to-Image Generation (fal.ai)](https://blog.fal.ai/introducing-fibo-structured-control-for-text-to-image-generation/)
- [FIBO GitHub Repository (Bria-AI)](https://github.com/Bria-AI/FIBO)
- [Enhancing Text-to-Image With Structured Captions (arXiv)](https://arxiv.org/html/2511.06876v1)
- [FLUX.2 Prompting Guide (Black Forest Labs)](https://docs.bfl.ml/guides/prompting_guide_flux2)
- [Graph-Based Captioning (arXiv)](https://arxiv.org/html/2407.06723v1)
- [BACON: Improving Clarity of Image Captions (CVPR 2025)](https://openaccess.thecvf.com/content/CVPR2025/papers/Yang_BACON_Improving_Clarity_of_Image_Captions_via_Bag-of-Concept_Graphs_CVPR_2025_paper.pdf)
- [How to Train Your Text-to-Image Model (Human-Centered GenAI)](https://ml-research.github.io/human-centered-genai/projects/t2i-synthetic-captions/index.html)
- [The Secret Sauce Behind DALL-E 3 (Why Try AI)](https://www.whytryai.com/p/dall-e-3-better-captions-research-paper-summary)
- [JSON Style Guides for Controlled Image Generation (dev.to)](https://dev.to/worldlinetech/json-style-guides-for-controlled-image-generation-with-gpt-4o-and-gpt-image-1-36p)
- [Ideogram 4.0 Prompt Guide (ImagineArt)](https://www.imagine.art/blogs/ideogram-4-0-prompt-guide)
