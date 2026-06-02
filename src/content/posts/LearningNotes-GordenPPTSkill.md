---
title: 【学习笔记】GordenPPTSkill 项目深度解析：Claude Code 的 PPT 自动化 Skill
published: 2026-06-01
description: 深入解析 GordenPPTSkill 项目的设计理念、技术架构、模板系统与编辑规则，探索基于 Claude Code Skill 的 PPT 非破坏性编辑自动化方案。
lang: zh
tags: ["学习笔记", "工具分享"]
---

> 项目地址：https://github.com/GordenSun/GordenPPTSkill
>
> 笔记日期：2026-06-01

<!--

---

## 目录

1. [项目概述](#1-项目概述)
2. [核心设计理念](#2-核心设计理念)
3. [技术架构](#3-技术架构)
4. [模板系统详解](#4-模板系统详解)
5. [模板制作流程](#5-模板制作流程)
6. [编辑规则与约束](#6-编辑规则与约束)
7. [数据结构解析](#7-数据结构解析)
8. [工作流程示例](#8-工作流程示例)
9. [核心优势分析](#9-核心优势分析)
10. [局限性与改进方向](#10-局限性与改进方向)
11. [使用建议](#11-使用建议)
12. [总结](#12-总结)

---

-->

## 1. 项目概述

### 1.1 项目简介

**GordenPPTSkill** 是一个为 Claude Code 设计的 Skill，用于自动化生成和编辑 PowerPoint 演示文稿。它采用"非破坏性编辑"理念，通过结构化模板管理，实现 AI 对 PPT 的精确控制。

### 1.2 核心特点

| 特性 | 说明 |
|-----|------|
| **非破坏性编辑** | 只修改文本内容，不改变排版样式 |
| **结构化模板** | 通过 JSON 文件精确描述每个文本框属性 |
| **容量精算** | 自动计算文本框可容纳的字数 |
| **字号层级** | 确保同级标题字号一致 |
| **离线可用** | 完全本地运行，无需联网 |
| **中文优化** | 原生支持中文排版 |

### 1.3 项目结构

```
GordenPPTSkill/
├── SKILL.md                    # Skill 定义文件
├── README.md                   # 项目说明
├── templates/
│   ├── INDEX.md               # 模板索引
│   ├── minimal-business-summary/    # 极简商务总结模板
│   ├── modern-tech-pitch/           # 现代科技提案模板
│   └── ... (共19套模板)
├── references/
│   ├── custom-template-workflow.md  # 自定义模板工作流
│   ├── original-design-guide.md     # 设计规范
│   └── pptx-edit-schema.md          # 编辑模式文档
└── tools/
    ├── build_pptx.py          # 核心构建脚本
    └── compute_capacity.py    # 容量计算工具
```

---

## 2. 核心设计理念

### 2.1 非破坏性编辑

**传统 PPT 生成方式的问题**：
- AI 直接生成 PPTX，排版不可控
- 每次生成都是"重新开始"
- 难以保持品牌一致性

**GordenPPTSkill 的解决方案**：
```
人类设计模板（排版） → AI 填充内容（文字）
```

**核心原则**：
1. 只改文字，不动排版
2. 保留模板的视觉设计
3. 支持二次人工编辑

### 2.2 结构化模板管理

每个模板包含三个核心文件：

| 文件 | 作用 |
|-----|------|
| `template.pptx` | 视觉设计模板（只读） |
| `detail.json` | 结构描述文件（文本框属性） |
| `edits.json` | 编辑指令文件（AI生成） |

### 2.3 容量精算系统

**问题**：AI 不知道一个文本框能装多少字

**解决方案**：
```python
# compute_capacity.py 计算逻辑
capacity = {
    "chars_per_line": 20,    # 每行字符数
    "max_lines": 3,          # 最大行数
    "max_chars": 60          # 最大字符数
}
```

---

## 3. 技术架构

### 3.1 技术栈

| 组件 | 技术 |
|-----|------|
| 核心库 | python-pptx |
| 脚本语言 | Python 3 |
| 数据格式 | JSON |
| 协议 | Model Context Protocol (MCP) |

### 3.2 核心工具

#### build_pptx.py
```python
# 主要功能
1. 读取 template.pptx（模板）
2. 读取 detail.json（结构描述）
3. 读取 edits.json（编辑指令）
4. 执行编辑操作
5. 输出最终 PPTX
```

#### compute_capacity.py
```python
# 主要功能
1. 分析文本框尺寸
2. 计算字体大小
3. 估算可容纳字数
4. 生成容量报告
```

### 3.3 数据流

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  template   │    │   detail    │    │    edits    │
│   .pptx     │ +  │   .json     │ +  │   .json     │
│  (视觉设计)  │    │  (结构描述)  │    │  (编辑指令)  │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          ▼
                   ┌─────────────┐
                   │ build_pptx  │
                   │    .py      │
                   └──────┬──────┘
                          ▼
                   ┌─────────────┐
                   │  output     │
                   │   .pptx     │
                   └─────────────┘
```

---

## 4. 模板系统详解

### 4.1 模板目录结构

以 `minimal-business-summary` 模板为例：

```
minimal-business-summary/
├── template.pptx           # 模板文件
├── detail.json            # 结构描述
├── preview.png            # 预览图
└── README.md              # 模板说明
```

### 4.2 detail.json 结构

```json
{
  "template_name": "minimal-business-summary",
  "slides": [
    {
      "slide_number": 1,
      "layout": "title_slide",
      "slots": [
        {
          "slot_id": "title",
          "type": "text",
          "max_chars": 60,
          "level": 1
        },
        {
          "slot_id": "subtitle",
          "type": "text",
          "max_chars": 120,
          "level": 2
        }
      ]
    }
  ],
  "type_scale": {
    "level_1": 44,
    "level_2": 32,
    "level_3": 24
  }
}
```

### 4.3 Slot（插槽）属性

| 属性 | 说明 | 示例 |
|-----|------|------|
| `slot_id` | 唯一标识 | "title", "content_1" |
| `type` | 内容类型 | "text", "image", "chart" |
| `max_chars` | 最大字符数 | 60, 120 |
| `max_lines` | 最大行数 | 3, 5 |
| `level` | 层级（用于字号） | 1, 2, 3 |
| `chars_per_line` | 每行字符数 | 20 |

### 4.4 Type Scale（字号层级）

```json
{
  "type_scale": {
    "level_1": 44,   // 主标题
    "level_2": 32,   // 副标题
    "level_3": 24,   // 小标题
    "level_4": 18    // 正文
  }
}
```

**作用**：确保同级标题字号一致，保持视觉层次。

---

## 5. 模板制作流程

### 5.1 五步工作流

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Step 1  │ → │  Step 2  │ → │  Step 3  │ → │  Step 4  │ → │  Step 5  │
│ 设计PPT  │   │ 标记slot │   │ 生成JSON │   │ 计算容量 │   │ 生成预览 │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### 5.2 详细步骤

#### Step 1: 在 PowerPoint 中设计模板

- 设计视觉样式（颜色、字体、布局）
- 添加占位符文本
- 保存为 `template.pptx`

#### Step 2: 标记 Slot 位置

- 识别需要 AI 填充的文本框
- 为每个文本框分配 `slot_id`
- 记录位置和尺寸信息

#### Step 3: 创建 detail.json

```json
{
  "template_name": "my-template",
  "slides": [
    {
      "slide_number": 1,
      "slots": [
        {
          "slot_id": "title",
          "type": "text",
          "level": 1
        }
      ]
    }
  ],
  "type_scale": {
    "level_1": 44,
    "level_2": 32
  }
}
```

#### Step 4: 运行 compute_capacity.py

```bash
python tools/compute_capacity.py \
  --template templates/my-template/template.pptx \
  --detail templates/my-template/detail.json \
  --output templates/my-template/detail.json
```

**输出**：自动填充 `max_chars`, `max_lines`, `chars_per_line`

#### Step 5: 生成预览图

- 打开生成的 PPTX
- 截图保存为 `preview.png`
- 更新 `INDEX.md`

### 5.3 实际案例：minimal-business-summary

**模板特点**：
- 极简商务风格
- 适合工作总结、项目汇报
- 包含封面、目录、内容页、结束页

**detail.json 片段**：
```json
{
  "slides": [
    {
      "slide_number": 1,
      "layout": "title",
      "slots": [
        {
          "slot_id": "title",
          "type": "text",
          "max_chars": 40,
          "level": 1
        },
        {
          "slot_id": "subtitle",
          "type": "text",
          "max_chars": 80,
          "level": 2
        }
      ]
    },
    {
      "slide_number": 2,
      "layout": "content",
      "slots": [
        {
          "slot_id": "heading",
          "type": "text",
          "max_chars": 30,
          "level": 2
        },
        {
          "slot_id": "bullet_1",
          "type": "text",
          "max_chars": 100,
          "level": 3
        },
        {
          "slot_id": "bullet_2",
          "type": "text",
          "max_chars": 100,
          "level": 3
        }
      ]
    }
  ]
}
```

---

## 6. 编辑规则与约束

### 6.1 编辑模式

```json
{
  "edits": [
    {
      "slide_number": 1,
      "slot_id": "title",
      "action": "replace",
      "content": "Q4 销售总结报告"
    },
    {
      "slide_number": 1,
      "slot_id": "subtitle",
      "action": "replace",
      "content": "2024年第四季度业绩回顾"
    }
  ]
}
```

### 6.2 约束规则

| 规则 | 说明 |
|-----|------|
| **字数限制** | 不得超过 `max_chars` |
| **行数限制** | 不得超过 `max_lines` |
| **层级一致** | 同级标题使用相同 `level` |
| **只改文字** | 不修改字体、颜色、位置 |

### 6.3 内容适配策略

**当内容过长时**：
1. 优先精简文字
2. 拆分到多个 slot
3. 调整模板（如果经常超限）

---

## 7. 数据结构解析

### 7.1 edits.json 完整结构

```json
{
  "metadata": {
    "template": "minimal-business-summary",
    "created_at": "2024-01-15",
    "version": "1.0"
  },
  "edits": [
    {
      "slide_number": 1,
      "slot_id": "title",
      "action": "replace",
      "content": "标题文字",
      "preserve_format": true
    },
    {
      "slide_number": 2,
      "slot_id": "chart_1",
      "action": "update_chart",
      "chart_data": {
        "categories": ["Q1", "Q2", "Q3", "Q4"],
        "values": [100, 150, 200, 250]
      }
    }
  ]
}
```

### 7.2 Action 类型

| Action | 用途 |
|-------|------|
| `replace` | 替换文本 |
| `append` | 追加文本 |
| `clear` | 清空内容 |
| `update_chart` | 更新图表数据 |
| `replace_image` | 替换图片 |

---

## 8. 工作流程示例

### 8.1 完整使用流程

```bash
# 1. 选择模板
cd templates/minimal-business-summary

# 2. 查看模板详情
cat detail.json

# 3. 创建 edits.json
cat > edits.json << 'EOF'
{
  "edits": [
    {
      "slide_number": 1,
      "slot_id": "title",
      "action": "replace",
      "content": "产品发布计划"
    },
    {
      "slide_number": 1,
      "slot_id": "subtitle",
      "action": "replace",
      "content": "2025年新产品路线图"
    }
  ]
}
EOF

# 4. 构建 PPT
python ../../tools/build_pptx.py \
  --template template.pptx \
  --detail detail.json \
  --edits edits.json \
  --output output.pptx

# 5. 查看结果
open output.pptx
```

### 8.2 Claude Code 中使用

```
User: 帮我用 minimal-business-summary 模板生成一份季度总结PPT

Claude: 好的，我需要以下信息：
1. 季度（如：Q4 2024）
2. 主要业绩指标
3. 关键成果

User: Q4 2024，销售额增长30%，用户增长50%

Claude: [自动生成 edits.json 并调用 build_pptx.py]
```

---

## 9. 核心优势分析

### 9.1 与传统方式的对比

| 维度 | 传统 AI PPT | GordenPPTSkill |
|-----|------------|----------------|
| 排版可控性 | ❌ 不可控 | ✅ 完全可控 |
| 品牌一致性 | ❌ 难保证 | ✅ 模板固定 |
| 二次编辑 | ⚠️ 困难 | ✅ 原生支持 |
| 离线使用 | ⚠️ 部分支持 | ✅ 完全离线 |
| 中文优化 | ⚠️ 一般 | ✅ 原生支持 |

### 9.2 与商业工具对比

| 工具 | 优势 | 劣势 |
|-----|------|------|
| Gamma | 在线协作、AI生成 | 排版不可控、需联网 |
| Beautiful.ai | 智能排版 | 无法私有化、订阅制 |
| 博思AIPPT | 中文支持好 | 在线服务、排版有限 |
| **GordenPPTSkill** | **排版可控、离线、免费** | **需技术能力、无AI生成** |

### 9.3 独特价值

1. **企业级应用**：可私有化部署，数据安全
2. **品牌一致性**：模板固定，视觉统一
3. **批量生成**：结构化数据支持程序化生成
4. **中文优化**：针对中文排版优化

---

## 10. 局限性与改进方向

### 10.1 当前局限

| 局限 | 说明 |
|-----|------|
| **无 AI 内容生成** | 只负责编辑，不生成内容 |
| **技术门槛** | 需要理解 JSON 和命令行 |
| **模板准备** | 需要人工制作模板 |
| **无协作功能** | 不支持多人实时协作 |
| **图表支持有限** | 复杂图表需要额外处理 |

### 10.2 改进方向

1. **AI 内容生成集成**
   - 集成 LLM 自动生成 edits.json
   - 根据主题自动选择模板

2. **可视化编辑器**
   - 图形界面编辑 detail.json
   - 所见即所得的模板制作

3. **模板市场**
   - 社区共享模板
   - 模板评分和推荐

4. **增强图表支持**
   - 更多图表类型
   - 数据自动可视化

5. **协作功能**
   - 版本控制
   - 多人编辑

---

## 11. 使用建议

### 11.1 适合场景

✅ **推荐使用**：
- 企业定期报告（周报、月报、季报）
- 品牌宣传材料（保持视觉一致）
- 批量生成同类 PPT
- 需要离线/私有化部署

❌ **不太适合**：
- 一次性创意 PPT
- 需要大量 AI 生成内容
- 非技术人员偶尔使用
- 需要实时协作

### 11.2 最佳实践

1. **模板设计原则**
   - 保持简洁，避免过度设计
   - 预留足够的文字空间
   - 使用清晰的层级结构

2. **内容编写技巧**
   - 提前规划内容结构
   - 控制文字长度
   - 使用 bullet points

3. **工作流程优化**
   - 建立模板库
   - 编写常用 edits.json 模板
   - 自动化批量生成

### 11.3 学习路径

```
新手 → 了解概念 → 使用现有模板 → 修改 edits.json
  ↓
进阶 → 理解 detail.json → 自定义模板 → 批量生成
  ↓
专家 → 开发新功能 → 贡献模板 → 集成到工作流
```

---

## 12. 总结

### 12.1 项目定位

GordenPPTSkill 是一个**面向企业级应用**的 PPT 自动化工具，其核心优势在于：

1. **非破坏性编辑**：保持模板设计完整性
2. **结构化控制**：精确控制每个文本框
3. **离线可用**：数据安全，无需联网
4. **中文优化**：原生支持中文排版

### 12.2 核心价值主张

> "让 AI 做它擅长的（内容），让设计师做他们擅长的（排版）"

### 12.3 未来展望

随着 AI 技术的发展，GordenPPTSkill 可以：
- 集成 LLM 实现智能内容生成
- 开发可视化工具降低使用门槛
- 建立模板生态社区
- 支持更多媒体类型（视频、3D）

### 12.4 结语

GordenPPTSkill 代表了一种**务实**的 AI 应用思路：不是让 AI 替代人类的所有工作，而是让 AI 在**特定环节**发挥最大价值。在 PPT 制作场景中，AI 负责精确执行，人类负责创意设计，两者协同才能达到最佳效果。

*笔记完成日期：2026-06-01*
