---
title: 【学习笔记】Claude Code 还有什么好玩的？—— 功能特性与可编程扩展全梳理
published: 2026-06-04
description: 从内置功能和可编程扩展两个维度，全面梳理 Claude Code 除了 StatusLine 之外的有趣特性，涵盖移动编程、自动化调度、插件系统、MCP 集成等。
lang: zh
tags: [学习笔记, Claude Code]
---

> 写这篇笔记的起因是我在学习 [Claude Code 插件系统](https://github.com/BingqiangZhou/CCStatusline) 时，做了一个 [GLM StatusLine 插件](https://github.com/BingqiangZhou/CCStatusline) 来在终端状态栏实时显示用量配额。做完之后我很好奇：Claude Code 还有什么好玩的东西？
>
> 于是我搜了一圈官方文档、Claude Code 创始人 Boris Cherny 的分享、社区博客和插件市场，把找到的内容按两类整理——**功能特性**（开箱即用的能力）和**可编程扩展**（需要写代码来实现的能力）。

---

## 一、功能特性：开箱即用的能力

这些是 Claude Code 已经内置的能力，不需要写代码，直接配置或使用命令就能生效。

### 1.1 移动与跨设备

#### 手机编程

Claude Code 有完整的移动端。下载 Claude App（iOS / Android），点击 Code 标签即可。适合通勤时修 bug、发任务、查进度——不适合在手机上写几百行复杂逻辑。

#### `/teleport` — 跨设备接力

手机上开的 session，到电脑前运行 `claude --teleport` 或在会话中输入 `/teleport`，直接拉到终端继续。反过来也行。Boris 建议在 `/config` 里开启 "Enable Remote Control for all sessions"，这样随时可以在设备之间切换。

#### `/remote-control` — 远程控制本地会话

用手机或网页浏览器控制正在运行的本地 Claude Code 会话。所有 MCP、工具、项目配置全部可用，即使笔记本休眠，网络恢复后也会自动重连。

#### Cowork Dispatch — 从手机操控桌面

比 Remote Control 更强大。可以操控桌面应用的浏览器、文件系统、MCP 服务。Boris 本人说每天不在电脑前时就用它处理 Slack、邮件、管理文件。

### 1.2 自动化调度

#### `/loop` — 本地循环任务

让 Claude 按固定间隔重复执行，最长持续 7 天。Boris 自己跑着的 loop 有：

| 用法 | 说明 |
|---|---|
| `/loop 5m /babysit` | 每 5 分钟处理 PR review 评论、自动 rebase |
| `/loop 30m /slack-feedback` | 每 30 分钟根据 Slack 反馈创建 PR |
| `/loop /post-merge-sweeper` | 自动清理遗漏的 review 评论 |

如果不指定间隔，Claude 会根据任务状态动态选择等待时间——活跃时频繁检查，空闲时放慢节奏。

#### `/schedule` — 云端定时任务（Routines）

在 Anthropic 托管的云基础设施上运行，**关掉电脑也能跑**。支持三种触发方式：

- **定时触发**：每小时、每天、每周或自定义 cron 表达式
- **API 触发**：通过 HTTP POST 随时启动，适合接入告警系统
- **GitHub 事件触发**：PR 创建、Release 发布时自动执行

比如可以设置 "每天早上 9 点检查失败的 CI 并自动修复"。

#### `/batch` — 大规模并行修改

Claude 先跟你面谈需求理解变更范围，然后把工作拆分给几十、几百甚至上千个 worktree agent 并行执行。每个 agent 独立工作、独立测试、独立提 PR。这是**大型代码迁移的神器**。

### 1.3 深度思考与规划

#### Plan Mode（规划模式）

按 `Shift+Tab` 进入。Claude 先调研代码库、制定计划，你审核确认后才动手写代码。**避免 Claude 做错方向白忙活**。典型流程：进入规划模式 → 完善计划 → 切换到自动接受编辑 → Claude 执行。

#### Extended Thinking（深度思考）

四个级别：`think` < `think hard` < `think harder` < `ultrathink`

- 简单任务用默认即可
- 复杂调试或架构决策用 `ultrathink`，让 Claude 有尽可能长的推理时间
- 按 `Tab` 键快速切换 on/off，也可以在提示词中直接写关键词触发

社区反馈普遍是：稍微复杂的任务就加 `ultrathink`，效果提升非常明显。

#### `/effort` — 控制努力程度

五个级别：`low` → `medium` → `high` → `max` → `auto`。Claude Code 团队默认用 `high`，遇到难题切 `max`。级别越高 token 消耗越大，按需选择。

### 1.4 会话管理与效率

#### `/btw` — 侧边提问

Claude 正在跑长任务时，你想问个快问题又不想打断它。用 `/btw` 提问，答案以浮层显示，不进入对话历史，不消耗上下文窗口。

#### `/compact` 与 `/clear` — 上下文管理

- `/clear`：清空所有历史，保留 CLAUDE.md。适合切换任务时用
- `/compact`：压缩历史保留关键信息。适合上下文快满但需要继续当前讨论时

Boris 建议：结束一个任务后，不要在原对话里继续新任务，用 `/clear` 重置。

#### `/voice` — 语音编程

- CLI：运行 `/voice` 后按住空格键说话
- Desktop：点击麦克风按钮
- 移动端：开启听写

Boris 说团队大部分代码都是用语音写的——说话比打字快 3 倍，而且语音输入的提示词通常更详细。

### 1.5 权限与安全

#### Auto Mode

`claude --enable-auto-mode` 启用。分类器自动判断操作安全性——安全操作直接通过，危险操作仍需确认。`Shift+Tab` 可以在 `default → acceptEdits → plan → auto` 之间循环。

#### Sandbox（沙箱）

`/sandbox` 选择加入开源沙箱运行时，支持文件和网络隔离，减少权限提示同时提高安全性。

#### `/permissions` — 精确白名单

用通配符预批准常用命令，比如 `"Bash(bun run *)"` 或 `"Edit(/docs/**)"`。这是**跳过权限提示的推荐替代方案**——你收到更少的弹窗，同时保持可审计的允许列表。

### 1.6 高级工作流

#### Git Worktrees 多开

同时跑 3-5 个 Claude 会话，每个在自己的 git worktree 中互不干扰。Claude Code 内置了原生 worktree 支持。Claude Code 团队认为这是**最大的单项生产力提升**。

#### `--bare` — SDK 启动加速

在非交互模式（`claude -p`）中加上 `--bare` 跳过 CLAUDE.md/MCP 自动搜索，启动速度提升约 10 倍。适合 CI/CD 脚本。

#### `--add-dir` — 跨仓库工作

在 A 仓库开 session，但任务需要访问 B 仓库。用 `--add-dir /path/to/B` 把 B 仓库加入工作区。

#### Chrome 扩展 — 给 Claude "眼睛"

安装 Chrome 扩展后，Claude 能直接在浏览器里看到修改后的页面效果，自己确认、自己迭代。Boris 称之为**"所有技巧中影响最大的一个"**——给它验证输出的方法，它就会一直迭代直到结果正确。

---

## 二、可编程扩展：通过写代码实现的能力

这些是 Claude Code 的可扩展机制。你通过编写配置文件、脚本或代码来赋予 Claude 新能力。StatusLine 就是其中之一——通过编写 shell 脚本读取 API 数据，在终端状态栏展示信息。

Claude Code 的可编程扩展体系可以用一张图概括：

```text
┌─────────────────────────────────────────────┐
│              Plugin（插件）                   │
│  把以下能力打包成一个可分发的单元              │
├──────────┬──────────┬──────────┬─────────────┤
│  Skills  │  Agents  │  Hooks   │  MCP Server │
│ 可复用    │ 专用子   │ 生命周期 │  外部工具    │
│ 指令包    │ 代理     │ 钩子     │  连接        │
├──────────┴──────────┼──────────┼─────────────┤
│   LSP Server        │ Monitors │  Themes     │
│   代码智能           │ 后台监听 │  终端主题    │
├─────────────────────┼──────────┼─────────────┤
│  Output Styles      │   Bin    │ StatusLine  │
│  回答风格            │ 可执行   │  状态栏      │
│                     │ 脚本     │             │
└─────────────────────┴──────────┴─────────────┘
```

下面逐个介绍，每个都配上实际可以做什么。

### 2.1 Skills（可复用指令包）

**是什么**：一个 Markdown 文件（`SKILL.md`），里面写着 Claude 应该如何执行某类任务。

**可以做什么**：

- 把重复的提示词、流程打包成 `/skill-name` 命令
- Claude 根据任务描述自动判断是否加载，也可以手动调用
- 支持参数传入，支持动态命令注入

**存放位置**：`.claude/skills/<name>/SKILL.md`

**实际例子**：

- 代码审查 skill：自动审查当前 diff，检查 bug、代码质量、安全性
- 文档生成 skill：根据代码自动生成 API 文档
- 部署 skill：一键执行构建、测试、部署流程

**市场热门**：官方插件市场有 Code Review（34 万安装）、Code Simplifier（28 万安装）、Skill Creator（28 万安装）等。

### 2.2 Agents（自定义子代理）

**是什么**：一个定义文件，告诉 Claude "执行某类任务时，启动一个隔离的 agent，给它指定的工具、模型和上下文"。

**可以做什么**：

- 定义专职 agent：bug hunter、refactor master、security auditor……
- 每个 agent 有独立的工具集、模型选择、上下文窗口
- 多个 agent 可以并行工作

**存放位置**：`.claude/agents/<name>.md`

**实际例子**：

```yaml
---
name: bug-hunter
description: Find and fix bugs autonomously
model: opus
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
---
You are an expert bug hunter. Analyze the codebase, identify potential bugs,
and fix them. Focus on edge cases, null pointer errors, and race conditions.
```

用 `--agent bug-hunter` 直接启动。

### 2.3 Hooks（生命周期钩子）

**是什么**：在 Claude 工作流的关键节点自动执行的脚本。提供**确定性控制**——保证某些操作始终发生，而不是依赖 LLM 决定。

**可以做什么**：

| Hook 时机 | 应用场景 |
|---|---|
| `SessionStart` | 会话启动时动态加载 context |
| `PreToolUse` | 执行 bash 命令前检查安全性（exit 2 = 阻止） |
| `PostToolUse` | 文件编辑后自动格式化 |
| `Notification` | 把通知推送到 Slack/WhatsApp |
| `Stop` | Claude 停止时自动 poke 让它继续 |

**存放位置**：`.claude/settings.json` 中的 `hooks` 配置

**实际例子**：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $CLAUDE_FILE_PATH"
          }
        ]
      }
    ]
  }
}
```

上面的配置会在每次文件编辑后自动运行 Prettier 格式化。社区还有人在 `PreToolUse` 阶段做安全检查——阻止 Claude 写入 `node_modules` 或 `.env` 文件。

### 2.4 MCP Server（外部工具连接）

**是什么**：通过 MCP（Model Context Protocol）协议连接外部工具和服务，让 Claude 能查询数据库、操控浏览器、调用 API。

**可以做什么**：

- 连接数据库（PostgreSQL、MongoDB、Supabase）
- 连接项目管理工具（Jira、Linear、GitHub）
- 连接监控平台（Sentry、Datadog）
- 操控浏览器（Playwright、Chrome DevTools）
- 连接设计工具（Figma）
- 连接消息平台（Slack、Telegram、Discord）

**配置方式**：

```bash
# 添加 Playwright 浏览器自动化
claude mcp add --transport stdio playwright -- npx -y @playwright/mcp@latest

# 添加 GitHub
claude mcp add --transport stdio github -- npx -y @modelcontextprotocol/server-github
```

**市场热门 MCP 插件**：

| 插件名 | 安装量 | 功能 |
|---|---|---|
| Context7 | 34 万 | 拉取最新版本文档，解决知识截止时间问题 |
| Playwright | 24 万 | 浏览器自动化与端到端测试 |
| GitHub | 26 万 | 仓库管理、Issue、PR |
| Figma | 13 万 | 读取设计文件、提取组件 |
| Supabase | 10 万 | 数据库操作、认证、存储 |
| Sentry | 3.2 万 | 错误监控、堆栈分析 |
| Chrome DevTools | 6.9 万 | 控制 Chrome 浏览器 |

社区有人分享过这样的用法：开启 Slack MCP 后，直接把错误线程粘贴给 Claude 说 "修复"，零上下文切换。或者让 Claude 用 `bq` CLI 拉取 BigQuery 数据分析——Boris 说"我个人 6 个多月没写过一行 SQL"。

### 2.5 LSP Server（代码智能）

**是什么**：通过 LSP（Language Server Protocol）让 Claude 获得 IDE 级别的代码智能：跳转定义、查找引用、实时错误检测。

**可以做什么**：

- 编辑代码后自动诊断类型错误
- 精确的符号导航（跳转定义、查找引用）
- 跨文件重构（安全重命名）

**支持的语言**：TypeScript、Python（Pyright）、C#、Go、Rust、Java、PHP、C/C++、Kotlin、Swift、Ruby、Lua 等都有对应的 LSP 插件。

**效果**：没有 LSP 时，Claude 只能靠 grep 搜索来理解代码结构；有了 LSP，它获得了精确的语义理解能力，重构时不会遗漏引用。

### 2.6 Output Styles（回答风格）

**是什么**：通过 Markdown 文件定义 Claude 的回答风格和格式。

**可以做什么**：

- **Explanatory**：Claude 在工作时解释每一步的原因和背景（适合学习新代码库）
- **Learning**：Claude 像导师一样引导你，在关键决策点要求你做出选择
- 自定义风格：比如让 Claude 只输出代码不解释，或用特定语言风格回答

**配置方式**：`/config` → Output Style，或创建自定义 style 文件。

### 2.7 Themes（终端主题）

**是什么**：自定义 Claude Code 终端的视觉外观，通过覆盖颜色 token 调整文本颜色、背景色和样式。

**可以做什么**：

- 创建完全自定义的配色方案
- 内置主题如 Dracula 等
- 支持热加载——修改主题文件后立即生效

### 2.8 Monitors（后台监听）

**是什么**：一个后台长驻进程，持续运行并将输出发送给 Claude。

**可以做什么**：

- 持续监听文件变化 → 输出变更通知
- 持续轮询 API → 输出最新状态
- 持续监听日志 → 输出异常告警

这让 Claude 能**实时感知外部世界的变化**，而不只是被动等待你的指令。

### 2.9 Bin（可执行脚本）

**是什么**：在插件的 `bin/` 目录放置可执行脚本，Claude Code 会自动将其加入 PATH。

**可以做什么**：

- 安装脚本：`install.sh` 一键配置环境
- 状态脚本：`status.sh` 查询外部 API 返回状态信息
- 工具脚本：任何 Claude 需要调用的命令行工具

StatusLine 就是结合了 Bin（脚本获取数据）+ Hook（注入状态栏）+ Skill（提供安装命令）的一个完整案例。

### 2.10 Plugin（插件——打包一切）

**是什么**：一个自包含目录，把 Skills、Agents、Hooks、MCP Server、LSP、Themes 等能力打包成一个可安装的单元。

**可以做什么**：

- 通过 `/plugin` 命令一键安装，无需手动配置
- 发布到官方市场让其他用户使用
- 组织内部建立私有市场统一分发给团队

**当前市场概况**：官方插件市场已有 60+ 个插件，涵盖开发工具、安全审计、数据库、云平台、前端设计等方向。其中 Anthropic 官方验证的插件有 Frontend Design（82 万安装）、Code Review（34 万安装）等。

**如何创建自己的插件**：官方提供了 [Plugin Developer Toolkit](https://claude.com/plugins) 插件，包含 7 个专业 skill，指导你创建 hooks、MCP、commands、agents 并验证质量。

---

## 三、对比总结

| 维度 | 功能特性 | 可编程扩展 |
|---|---|---|
| **使用方式** | 命令或配置即可启用 | 需要编写代码/配置文件 |
| **上手难度** | 低，了解命令即可 | 中到高，需要理解机制 |
| **定制程度** | 有限，用官方提供的选项 | 几乎无限，可以连接任何服务 |
| **适合场景** | 日常开发效率提升 | 构建团队工作流、自动化流水线 |
| **代表特性** | `/loop`、`/batch`、`ultrathink`、Worktrees | Skills、Hooks、MCP、Agents、Plugins |

## 四、我的想法

梳理完之后，我的感受是 Claude Code 的设计思路很清晰：

**功能特性**解决的是"怎么用得更好"——让 Claude 更聪明地工作（深度思考、规划模式）、更自主地工作（`/loop`、`/batch`）、更方便地工作（手机、语音、跨设备）。

**可编程扩展**解决的是"怎么用得更广"——通过 Skills、Hooks、MCP、Agents 等机制，Claude Code 从一个编程助手变成了一个可以连接任何工具、执行任何流程的开发平台。StatusLine 只是一个很小的切入点，背后是整个插件系统。

如果你也想动手做一个插件，可以从简单的 Hook 或 Skill 开始——写一个 Markdown 文件或几行 shell 脚本就能跑起来，不需要复杂的开发环境。

---

> **参考资源**：
>
> - [Claude Code Power User Tips（官方）](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips)
> - [Claude Code Best Practices（官方）](https://code.claude.com/docs/en/best-practices)
> - [Claude Code 创始人 Boris Cherny 的 15 个技巧](https://www.bnext.com.tw/article/90524/claude-code-boris-cherny-15-pro-tips-auto-dev-workflow)
> - [Claude Code 插件市场](https://claude.com/plugins)
> - [Claude Code 插件系统参考](https://code.claude.com/docs/en/plugins-reference)
> - [Claude Code Scheduled Tasks](https://code.claude.com/docs/en/scheduled-tasks)
> - [Claude Code Remote Control](https://code.claude.com/docs/en/remote-control)
> - [CCStatusline 仓库（我的实践）](https://github.com/BingqiangZhou/CCStatusline)
