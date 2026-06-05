---
title: 【实践记录】Claude Code 接入第三方模型的自动压缩配置笔记
published: 2026-06-03
description: "介绍如何为 Claude Code 配置自动压缩阈值，在使用 GLM/Z.AI 等 200K 上下文第三方模型时避免上下文超限问题。"
lang: zh
tags: [实践记录, Claude Code]
---

## 1. 背景问题

在使用 Claude Code 接入 GLM / Z.AI / 智谱这类第三方模型时，模型上下文窗口可能只有 **200K tokens**。

但 Claude Code 默认按更大的上下文窗口来管理——官方 Claude 模型支持 1M context，所以自动压缩（auto compact）的触发点设计得偏高。接入第三方模型后，上下文容量与默认行为不匹配，导致自动压缩触发太晚。

如果等上下文快满了才触发 compact，容易出现：

```text
context length exceeded
上下文超限
自动压缩来不及
任务中断
```

Claude Code 的上下文消耗不止于对话本身，以下内容都会计入 token 用量：

```text
系统提示词（system prompt）
CLAUDE.md / 项目上下文 / skills
工具调用的请求和响应
文件读取、命令行输出、报错信息
MCP server 返回内容
```

一轮涉及多文件编辑的任务，上下文增长速度远比想象中快。因此，手动配置自动压缩阈值，在第三方模型场景下非常必要。

---

## 2. 推荐配置与配置方法

针对 **200K 上下文的第三方模型**（如 GLM Coding Plan），编辑 Claude Code 的用户配置文件：

| 平台 | 文件路径 |
| --- | --- |
| macOS / Linux | `~/.claude/settings.json` |
| Windows | `%USERPROFILE%\.claude\settings.json` |

在 `env` 中加入以下三个环境变量：

```json
{
  "env": {
    "CLAUDE_CODE_DISABLE_1M_CONTEXT": "1",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "200000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "70"
  }
}
```

如果已经配置了第三方模型接入（如 GLM Coding Plan），将自动压缩变量合并到已有的 `env` 对象中即可：

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "你的_api_key",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "API_TIMEOUT_MS": "3000000",

    "CLAUDE_CODE_DISABLE_1M_CONTEXT": "1",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "200000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "70"
  }
}
```

修改后**重启 Claude Code** 生效（环境变量在启动时读取，已打开的会话不会自动加载）：

```bash
# 退出当前会话，重新启动
claude
```

效果：

```text
禁用 1M context  →  不按官方模型的上限来管理上下文
按 200K 上下文计算  →  匹配第三方模型实际窗口
70% 触发压缩  →  约 140K tokens 时执行 compact，留足 60K 缓冲
```

---

## 3. 自动压缩机制原理

Claude Code 的自动压缩（auto compact）机制：当上下文使用量达到一定比例时，自动对历史对话进行摘要压缩，释放 token 空间，让会话可以继续进行。

压缩过程本身也需要消耗 tokens（调用模型生成摘要），所以如果触发时机太晚——上下文已经接近上限——可能出现压缩请求本身也超出限制的情况，导致压缩失败、会话中断。

核心参数关系：

```text
压缩触发点 = CLAUDE_CODE_AUTO_COMPACT_WINDOW × CLAUDE_AUTOCOMPACT_PCT_OVERRIDE
```

其中：

- `CLAUDE_CODE_AUTO_COMPACT_WINDOW`：上下文窗口大小，决定计算的基数。默认跟随模型的上下文窗口，对于官方 Claude 模型可能是 1M；对于第三方模型，Claude Code 不一定能正确识别实际窗口大小。
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`：触发百分比，即上下文使用到窗口的百分之几时执行压缩。默认值约 95%。
- `CLAUDE_CODE_DISABLE_1M_CONTEXT`：禁用 1M context 支持，让 Claude Code 以更小的窗口工作。

配置思路：**明确告诉 Claude Code 实际可用的上下文窗口有多大，然后在合理比例触发压缩**。

---

## 4. 配置项详解

| 配置项 | 类型 | 作用 | 说明 |
| --- | --- | --- | --- |
| `CLAUDE_CODE_DISABLE_1M_CONTEXT` | 布尔（`"1"` / `"0"`） | 禁用 1M context 支持 | 设为 `"1"` 后，Claude Code 不会按 1M 窗口管理上下文 |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | 整数（字符串） | 自动压缩的计算窗口大小（tokens） | 应设为模型实际上下文窗口大小，如 `"200000"` |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 整数（字符串，0-100） | 自动压缩触发百分比 | 如 `"70"` 表示上下文使用 70% 时触发压缩 |

以推荐配置为例：

```text
200000 × 70% = 140000 tokens
```

上下文用到约 **140K tokens** 时，Claude Code 就会自动执行 compact。

---

## 5. 阈值选择分析

阈值的选择本质是在 **安全性** 和 **体验流畅度** 之间做权衡：

- **阈值过低**（如 50%）：压缩过于频繁，每次压缩都要消耗 tokens 生成摘要，导致有效上下文利用率低，长对话中信息丢失更严重。
- **阈值过高**（如 90%+）：触发太晚，留给压缩操作本身的 token 余量不足，容易导致压缩失败或上下文超限。

选择 70% 的理由：

```text
140K tokens 的触发点，留出约 60K 的缓冲区
足够容纳压缩操作本身的 token 消耗
不会因为频繁压缩打断工作流
相比默认的 95%（190K），安全性大幅提升
```

不同阈值对比：

| 百分比 | 触发点 | 缓冲区余量 | 适用场景 |
| --- | ---: | ---: | --- |
| 50% | 100K | 100K | 极度保守，适合超大型项目或大量工具调用的场景 |
| 60% | 120K | 80K | 较为安全，但压缩频率偏高 |
| **70%** | **140K** | **60K** | **推荐值，平衡安全性和体验流畅度** |
| 80% | 160K | 40K | 偏激进，适合简单任务、上下文压力不大的场景 |
| 默认 ~95% | 190K | ~10K | 对 200K 模型不推荐，缓冲区过小 |

> **提示**：如果你的工作流涉及大量文件读写（如全项目重构），建议降到 60%；如果是简单的对话问答，80% 也能接受。
