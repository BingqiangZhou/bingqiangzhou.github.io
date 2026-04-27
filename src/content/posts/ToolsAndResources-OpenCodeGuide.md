---
title: "【工具分享】OpenCode 完全指南"
published: 2026-04-28
description: 从安装配置到高级使用技巧，全面介绍开源 AI 编码智能体 OpenCode 的使用方法，包括 Skills 技能系统。
lang: zh
tags: ["工具分享", "学习笔记"]
---

> 从安装配置到高级使用技巧 | 2026 年 4 月

<!--

## 目录

- [第一章 OpenCode 简介](#第一章-opencode-简介)
- [第二章 安装与下载](#第二章-安装与下载)
- [第三章 API Key 配置](#第三章-api-key-配置)
- [第四章 Coding Plan 模式](#第四章-coding-plan-模式)
- [第五章 常用命令一览](#第五章-常用命令一览)
- [第六章 配置文件详解](#第六章-配置文件详解)
- [第七章 自定义命令](#第七章-自定义命令)
- [第八章 Skills 技能系统](#第八章-skills-技能系统)
- [第九章 高级技巧与最佳实践](#第九章-高级技巧与最佳实践)
- [第十章 常见问题排查](#第十章-常见问题排查)
- [参考资源](#参考资源)

-->

---

## 第一章 OpenCode 简介

### 1.1 什么是 OpenCode？

OpenCode 是一个开源的 AI 编码智能体（AI Coding Agent），专为开发者设计。它提供了终端界面（TUI）、桌面应用和 IDE 扩展三种使用方式，能够帮助开发者进行代码编写、重构、调试、代码审查等各种任务。

OpenCode 的核心优势包括：

- 支持 **75+** 个 LLM 提供商（通过 AI SDK 和 Models.dev）
- **开源免费**，社区活跃
- 内置 **Plan（规划）** 和 **Build（构建）** 两种智能体模式
- 支持自定义命令、主题、快捷键、MCP 服务等丰富扩展
- 支持**本地模型**运行

### 1.2 前置条件

使用 OpenCode 前需要：

1. 一个现代终端模拟器（推荐 WezTerm、Alacritty、Ghostty、Kitty）
2. 至少一个 LLM 提供商的 API Key

---

## 第二章 安装与下载

### 2.1 推荐安装方式（安装脚本）

最简单的安装方式是通过官方安装脚本：

```bash
curl -fsSL https://opencode.ai/install | bash
```

### 2.2 包管理器安装

#### Node.js / Bun / pnpm / Yarn

```bash
npm install -g opencode-ai
# 或
bun install -g opencode-ai
# 或
pnpm install -g opencode-ai
# 或
yarn global add opencode-ai
```

#### Homebrew（macOS 和 Linux）

```bash
brew install anomalyco/tap/opencode
```

> 💡 建议使用 OpenCode tap 以获取最新版本。官方 `brew install opencode` 由 Homebrew 团队维护，更新较慢。

#### Arch Linux

```bash
sudo pacman -S opencode           # 稳定版
paru -S opencode-bin              # AUR 最新版
```

### 2.3 Windows 安装

推荐使用 WSL（Windows Subsystem for Linux）以获得最佳体验。也可以通过以下方式安装：

```bash
# Chocolatey
choco install opencode

# Scoop
scoop install opencode

# NPM
npm install -g opencode-ai

# Docker
docker run -it --rm ghcr.io/anomalyco/opencode
```

### 2.4 其他方式

```bash
# Mise
mise use --pin -g ubi:sst/opencode

# 从 GitHub Releases 下载二进制文件
# https://github.com/anomalyco/opencode/releases
```

---

## 第三章 API Key 配置

### 3.1 配置流程概述

OpenCode 支持 75+ 个 LLM 提供商。配置 API Key 的基本流程为：

1. 在 TUI 中运行 `/connect` 命令
2. 选择你的 LLM 提供商
3. 输入你的 API Key
4. 使用 `/models` 命令选择模型

API Key 会被安全地存储在 `~/.local/share/opencode/auth.json` 中。

### 3.2 OpenCode Zen（推荐新手）

OpenCode Zen 是 OpenCode 团队精心筛选和测试的模型列表，适合新手快速上手。

1. 运行 `/connect`，选择 **OpenCode Zen**
2. 前往 [opencode.ai/auth](https://opencode.ai/auth) 登录并添加付款信息
3. 复制 API Key 并粘贴到终端
4. 使用 `/models` 查看推荐模型

### 3.3 OpenCode Go（低成本订阅）

OpenCode Go 是一个低成本订阅计划，提供经过测试验证的热门开源编码模型。配置方式与 Zen 相同，在 `/connect` 中选择 **OpenCode Go** 即可。

### 3.4 常用提供商配置

#### Anthropic（Claude）

```bash
/connect
# 选择 Anthropic，输入 API Key
# 注册地址：https://console.anthropic.com/
```

#### OpenAI

```bash
/connect
# 选择 OpenAI，输入 API Key
# 注册地址：https://platform.openai.com/
```

#### DeepSeek

```bash
/connect
# 选择 DeepSeek，输入 API Key
# 注册地址：https://platform.deepseek.com/
```

#### Google

```bash
/connect
# 选择 Google，输入 API Key
# 注册地址：https://aistudio.google.com/
```

#### OpenRouter

```bash
/connect
# 选择 OpenRouter，输入 API Key
# 注册地址：https://openrouter.ai/
```

#### Amazon Bedrock

支持多种认证方式：

```bash
# 方式 1：AWS 访问密钥
AWS_ACCESS_KEY_ID=XXX AWS_SECRET_ACCESS_KEY=YYY opencode

# 方式 2：AWS 配置文件中的 named profile
AWS_PROFILE=my-profile opencode

# 方式 3：Bedrock bearer token
AWS_BEARER_TOKEN_BEDROCK=XXX opencode
```

也可通过 `opencode.json` 配置（详见第六章）。

#### Azure OpenAI

```bash
/connect
# 选择 Azure，输入 API Key

# 设置资源名称环境变量
AZURE_RESOURCE_NAME=XXX opencode

# 或添加到 bash profile
export AZURE_RESOURCE_NAME=XXX
```

#### Cloudflare AI Gateway

```bash
/connect
# 依次输入：Account ID、Gateway ID、API Token

# 或通过环境变量
export CLOUDFLARE_ACCOUNT_ID=your-account-id
export CLOUDFLARE_GATEWAY_ID=your-gateway-id
export CLOUDFLARE_API_TOKEN=your-api-token
```

#### GitLab Duo

```bash
/connect
# 选择 GitLab，可选 OAuth 或 Personal Access Token
# 需要 Premium 或 Ultimate 订阅
```

### 3.5 通过环境变量配置

部分提供商支持直接通过环境变量设置 API Key，无需使用 `/connect`：

```bash
# 示例：在 bash profile 中添加
export ANTHROPIC_API_KEY=your-key
export OPENAI_API_KEY=your-key
export DEEPSEEK_API_KEY=your-key
export GOOGLE_GENERATIVE_AI_API_KEY=your-key
export OPENROUTER_API_KEY=your-key
```

---

## 第四章 Coding Plan 模式

### 4.1 两种核心智能体

OpenCode 内置了两种主要的智能体模式：

| 模式 | 说明 |
|------|------|
| **Plan（规划）** | 只分析代码并提出建议，不会修改任何文件。适合在实际修改前先讨论方案。 |
| **Build（构建）** | 实际执行代码修改、创建文件、运行命令等操作。适合确认方案后的实际开发。 |

### 4.2 切换模式

使用 **Tab** 键或 **Ctrl+x + a** 快捷键在两种模式之间切换。当前模式会在界面右下角显示指示器。

### 4.3 推荐工作流

对于复杂功能开发，推荐以下工作流：

#### 第一步：创建计划（Plan 模式）

按 Tab 键切换到 Plan 模式，然后描述你的需求：

```
<TAB>   # 切换到 Plan 模式

# 然后输入需求描述，例如：
"当用户删除笔记时，我们想在数据库中将其标记为已删除。
然后创建一个页面显示所有近期删除的笔记。
用户可以从这个页面恢复或永久删除笔记。"
```

> 💡 给 OpenCode 充足的上下文和示例，像和团队中的初级开发者交流一样描述需求。

#### 第二步：迭代讨论

根据 OpenCode 给出的计划，你可以给出反馈或补充细节：

```
# 例如提供设计参考图片：
"我希望新页面参考之前的设计风格。
[Image #1] 看看这张图片，以此为参考。"
```

> 💡 可以直接将图片拖拽到终端中添加到提示词中！

#### 第三步：执行构建（Build 模式）

确认计划无误后，按 Tab 键切换回 Build 模式：

```
<TAB>   # 切换回 Build 模式

"方案看起来不错，开始实施吧！"
```

### 4.4 直接修改（简单任务）

对于简单的修改，可以跳过 Plan 模式直接让 Build 模式执行：

```
"我们需要给 /settings 路由添加认证。
参考 @packages/functions/src/notes.ts 中的处理方式，
在 @packages/functions/src/settings.ts 中实现相同的逻辑。"
```

---

## 第五章 常用命令一览

### 5.1 内置命令

| 命令 | 说明 |
|------|------|
| `/connect` | 连接并配置 LLM 提供商的 API Key |
| `/models` | 查看并选择可用的 AI 模型 |
| `/init` | 初始化项目，分析代码并生成 AGENTS.md 文件 |
| `/undo` | 撤销上一次修改（可多次撤销） |
| `/redo` | 重做上一次被撤销的修改 |
| `/share` | 分享当前对话，生成链接并复制到剪贴板 |
| `/themes` | 切换 UI 主题 |
| `/help` | 显示帮助信息 |

### 5.2 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Tab` | 在 Plan 和 Build 模式之间切换 |
| `Ctrl+x + a` | 切换智能体（同 Tab） |
| `Ctrl+x + u` | 撤销上一次修改（同 /undo） |
| `Ctrl+x + r` | 重做修改（同 /redo） |
| `Ctrl+x + t` | 打开主题选择器（同 /themes） |
| `@` | 模糊搜索项目中的文件并引用 |

### 5.3 CLI 命令（终端外使用）

```bash
# 启动 OpenCode TUI
opencode

# 直接运行任务（无需进入 TUI）
opencode run "Hello world"

# 启动 HTTP 服务器（IDE 集成）
opencode serve

# 启动 Web 界面
opencode web

# 调试配置
opencode debug config
```

---

## 第六章 配置文件详解

### 6.1 配置文件位置与优先级

OpenCode 支持 JSON 和 JSONC（JSON with Comments）格式。配置文件会被**合并**，不是替换。优先级从低到高：

| 位置 | 说明 |
|------|------|
| **远程配置** | `.well-known/opencode` 端点，组织默认配置 |
| **全局配置** | `~/.config/opencode/opencode.json`，用户个人偏好 |
| **自定义配置** | `OPENCODE_CONFIG` 环境变量指定的文件 |
| **项目配置** | 项目根目录的 `opencode.json` |
| **.opencode 目录** | 包含 agents、commands、plugins 等子目录 |
| **管理配置** | 系统级配置，用户不可覆盖（最高优先级） |

### 6.2 常用配置示例

#### 基础配置

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5",
  "autoupdate": true
}
```

#### 提供商配置（自定义 Base URL）

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "anthropic": {
      "options": {
        "baseURL": "https://your-proxy.example.com/v1",
        "timeout": 600000,
        "chunkTimeout": 30000
      }
    }
  }
}
```

#### 服务器配置

```json
{
  "$schema": "https://opencode.ai/config.json",
  "server": {
    "port": 4096,
    "hostname": "0.0.0.0",
    "mdns": true,
    "cors": ["http://localhost:5173"]
  }
}
```

#### 工具配置

```json
{
  "$schema": "https://opencode.ai/config.json",
  "tools": {
    "write": false,
    "bash": false
  }
}
```

#### 分享配置

```json
{
  "$schema": "https://opencode.ai/config.json",
  "share": "manual"
}
```

可选值：
- `"manual"` — 手动分享（默认）
- `"auto"` — 自动分享新对话
- `"disabled"` — 禁用分享

#### TUI 专用配置（tui.json）

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "theme": "tokyonight",
  "scroll_speed": 3,
  "scroll_acceleration": { "enabled": true },
  "diff_style": "auto",
  "mouse": true
}
```

#### 默认智能体配置

```json
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "plan"
}
```

可选值：`"build"` 或 `"plan"`，或自定义智能体名称。

---

## 第七章 自定义命令

### 7.1 创建自定义命令

自定义命令可以帮助你快速执行重复性任务。有两种创建方式：

#### 方式一：Markdown 文件

在 `.opencode/commands/` 目录下创建 `.md` 文件：

```markdown
<!-- 文件：.opencode/commands/test.md -->
---
description: 运行测试并显示覆盖率
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---
Run the full test suite with coverage report.
Focus on the failing tests and suggest fixes.
```

然后在 TUI 中使用 `/test` 即可调用。

#### 方式二：JSON 配置

```json
{
  "command": {
    "test": {
      "template": "Run the full test suite...",
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-3-5-sonnet-20241022"
    }
  }
}
```

### 7.2 命令参数

使用 `$ARGUMENTS` 或位置参数（`$1`, `$2`, `$3`）传递参数：

```markdown
<!-- .opencode/commands/component.md -->
---
description: 创建新组件
---
Create a new React component named $ARGUMENTS
with TypeScript support.

<!-- 使用：/component Button -->
```

### 7.3 注入 Shell 输出

使用 `` !`command` `` 语法将 shell 命令输出注入到提示词中：

```markdown
<!-- .opencode/commands/review-changes.md -->
---
description: 审查近期更改
---
Recent git commits:
!`git log --oneline -10`
Review these changes and suggest improvements.
```

### 7.4 引用文件

使用 `@` 引用项目中的文件：

```markdown
<!-- .opencode/commands/review-component.md -->
---
description: 审查组件
---
Review the component in @src/components/Button.tsx.
Check for performance issues and suggest improvements.
```

### 7.5 命令配置选项

| 选项 | 说明 |
|------|------|
| `template` | **必填**，发送给 LLM 的提示词模板 |
| `description` | 命令描述，在 TUI 中显示 |
| `agent` | 指定执行命令的智能体（如 build、plan） |
| `model` | 覆盖默认模型 |
| `subtask` | 设为 true 强制以子任务方式执行，不污染主上下文 |

---

## 第八章 Skills 技能系统

### 8.1 什么是 Skills？

Skills 是 OpenCode 的**技能系统**，允许 AI 获得特定领域的知识和工作流，例如代码审计、翻译、文档生成等。Skills 以 `SKILL.md` 文件的形式定义，可以被 AI 智能体按需加载使用。

### 8.2 Skills 存放位置

创建一个以技能名称命名的文件夹，里面放一个 `SKILL.md` 文件。OpenCode 会搜索以下位置：

| 位置 | 路径 | 作用域 |
|------|------|--------|
| 项目级 | `.opencode/skills/<名称>/SKILL.md` | 当前项目 |
| 全局级 | `~/.config/opencode/skills/<名称>/SKILL.md` | 所有项目 |
| Claude 兼容（项目） | `.claude/skills/<名称>/SKILL.md` | 当前项目 |
| Claude 兼容（全局） | `~/.claude/skills/<名称>/SKILL.md` | 所有项目 |
| Agent 兼容（项目） | `.agents/skills/<名称>/SKILL.md` | 当前项目 |
| Agent 兼容（全局） | `~/.agents/skills/<名称>/SKILL.md` | 所有项目 |

### 8.3 创建一个 Skill

**第 1 步**：创建目录结构

```bash
mkdir -p .opencode/skills/git-release
```

**第 2 步**：编写 `SKILL.md`

```markdown
---
name: git-release
description: Create consistent releases and changelogs
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---

## What I do

- Draft release notes from merged PRs
- Propose a version bump
- Provide a copy-pasteable `gh release create` command

## When to use me

Use this when you are preparing a tagged release.
Ask clarifying questions if the target versioning scheme is unclear.
```

**关键规则**：

- 文件名必须是 **`SKILL.md`**（全大写）
- `name` 和 `description` 是**必填**字段
- `name` 必须是 1-64 位小写字母数字，用单横线分隔（如 `my-skill`）
- `name` 必须与所在文件夹名称一致
- `description` 长度为 1-1024 个字符

**Frontmatter 字段说明**：

| 字段 | 是否必填 | 说明 |
|------|---------|------|
| `name` | ✅ 必填 | 技能名称，需与文件夹名一致 |
| `description` | ✅ 必填 | 技能描述，供 AI 判断何时使用 |
| `license` | 可选 | 许可证 |
| `compatibility` | 可选 | 兼容性标识 |
| `metadata` | 可选 | 字符串键值对，附加信息 |

### 8.4 使用 Skills

#### 方式一：通过斜杠命令调用（推荐）

在 TUI 中输入 `/` 即可看到所有可用的 Skills，直接选择调用：

```
/git-release
```

#### 方式二：AI 自动加载

AI 智能体在对话中会看到可用的 Skills 列表，并根据需要自动调用 `skill` 工具加载相关技能。AI 看到的格式如下：

```xml
<available_skills>
  <skill>
    <name>git-release</name>
    <description>Create consistent releases and changelogs</description>
  </skill>
</available_skills>
```

### 8.5 Skills 权限控制

在 `opencode.json` 中配置哪些 Skills 可以被访问：

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

| 权限 | 行为 |
|------|------|
| `allow` | 技能可直接加载 |
| `deny` | 对 AI 隐藏该技能，拒绝访问 |
| `ask` | 加载前提示用户确认 |

支持通配符：`internal-*` 会匹配 `internal-docs`、`internal-tools` 等。

### 8.6 为特定 Agent 配置不同权限

**自定义 Agent**（在 Agent 的 frontmatter 中）：

```yaml
---
permission:
  skill:
    "documents-*": "allow"
---
```

**内置 Agent**（在 `opencode.json` 中）：

```json
{
  "agent": {
    "plan": {
      "permission": {
        "skill": {
          "internal-*": "allow"
        }
      }
    }
  }
}
```

### 8.7 禁用 Skill 工具

如果某个 Agent 不应该使用 Skills：

**自定义 Agent**：

```yaml
---
tools:
  skill: false
---
```

**内置 Agent**（在 `opencode.json` 中）：

```json
{
  "agent": {
    "plan": {
      "tools": {
        "skill": false
      }
    }
  }
}
```

禁用后，AI 将完全看不到可用的 Skills 列表。

### 8.8 Skills 发现机制

OpenCode 的 Skills 发现流程：

1. **项目级扫描**：从当前工作目录向上遍历到 Git 工作树根目录，加载沿途所有 `.opencode/skills/*/SKILL.md`、`.claude/skills/*/SKILL.md` 和 `.agents/skills/*/SKILL.md`
2. **全局级加载**：从 `~/.config/opencode/skills/*/SKILL.md`、`~/.claude/skills/*/SKILL.md` 和 `~/.agents/skills/*/SKILL.md` 加载
3. **权限过滤**：根据权限配置过滤掉被 `deny` 的技能

### 8.9 故障排查

如果 Skill 没有显示，按以下顺序检查：

1. ✅ 文件名是否为 **`SKILL.md`**（全大写，不是 `skill.md`）
2. ✅ frontmatter 是否包含 `name` 和 `description`
3. ✅ 技能名称是否与文件夹名称一致
4. ✅ 技能名称是否在所有位置中唯一
5. ✅ 权限配置是否将该技能设为了 `deny`
6. ✅ `name` 格式是否符合规则（小写字母数字 + 单横线）

---

## 第九章 高级技巧与最佳实践

### 9.1 项目初始化

在新项目中首次使用 OpenCode 时，一定要运行 `/init`：

```bash
cd /path/to/project
opencode
/init
```

这会分析项目结构并在项目根目录生成 `AGENTS.md` 文件。建议将该文件提交到 Git，它能帮助 OpenCode 理解项目结构和编码模式。

### 9.2 文件引用技巧

在提问时使用 `@` 符号可以模糊搜索并引用项目中的文件：

```
"认证是如何在 @packages/functions/src/api/index.ts 中处理的？"
```

这对于了解你没有亲自写过的代码部分非常有用。

### 9.3 图片支持

可以直接将图片拖拽到终端中添加到提示词。OpenCode 会扫描图片并加入到上下文中，非常适合提供设计参考或 UI 截图。

### 9.4 撤销与重做

如果 OpenCode 的修改不符合预期，可以随时撤销：

```bash
/undo    # 撤销上一次修改
/undo    # 可以多次撤销
/redo    # 重做被撤销的修改
```

撤销后，OpenCode 会显示你原始的消息，你可以修改提示词后重新提交。

### 9.5 自定义智能体（Agents）

可以通过配置文件或 Markdown 文件创建专用智能体：

```json
{
  "agent": {
    "code-reviewer": {
      "description": "Reviews code for best practices",
      "model": "anthropic/claude-sonnet-4-5",
      "prompt": "You are a code reviewer...",
      "tools": {
        "write": false,
        "edit": false
      }
    }
  }
}
```

也可创建 Markdown 文件：
- 全局：`~/.config/opencode/agents/reviewer.md`
- 项目级：`.opencode/agents/reviewer.md`

### 9.6 MCP 服务

OpenCode 支持通过 MCP（Model Context Protocol）服务扩展功能，可以在配置文件中添加：

```json
{
  "mcp": {
    "my-server": {
      "type": "stdio",
      "command": "node",
      "args": ["path/to/server.js"]
    }
  }
}
```

### 9.7 对话分享

使用 `/share` 命令可以将当前对话生成链接并复制到剪贴板，方便与团队成员分享。默认不会自动分享对话。

### 9.8 使用小模型节省成本

通过 `small_model` 配置项可以为轻量级任务（如生成会话标题）指定更便宜的模型：

```json
{
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5"
}
```

如果没有配置，OpenCode 会尽量使用提供商的便宜模型，否则回退到主模型。

### 9.9 权限控制

可以通过 `permission` 配置项控制 OpenCode 的操作权限：

```json
{
  "permission": {
    "*": "ask",
    "bash": {
      "*": "ask",
      "rm -rf *": "deny"
    }
  }
}
```

### 9.10 实用小技巧总结

| 技巧 | 说明 |
|------|------|
| 充分描述需求 | 像和初级开发者交流一样提供充足的上下文和示例 |
| 先规划后构建 | 复杂任务先用 Plan 模式讨论，确认后再 Build |
| 利用 @ 引用文件 | 让 OpenCode 精确了解你指定的代码文件 |
| 拖拽图片 | 提供 UI 设计参考或截图 |
| 善用 /undo | 不满意的结果随时撤销，调整提示词重试 |
| 提交 AGENTS.md | 将项目初始化文件提交到 Git，便于团队协作 |
| 自定义命令 | 将重复性任务封装为自定义命令提高效率 |
| 配置 small_model | 为轻量任务指定便宜模型节省成本 |

---

## 第十章 常见问题排查

### 10.1 Windows 下 `opencode` 命令未找到

**错误信息**：

```
opencode : The term 'opencode' is not recognized as the name of a cmdlet, function,
script file, or operable program.
```

**原因**：`npm install -g` 将包安装到 npm 的全局目录，但 PowerShell 找不到该目录下的可执行文件，说明 **npm 的全局 bin 目录不在你的 PATH 环境变量中**。

**解决步骤**：

**第 1 步：确认 npm 全局安装路径**

```powershell
npm config get prefix
```

输出类似：`C:\Users\你的用户名\AppData\Roaming\npm`

**第 2 步：确认 opencode 是否确实安装在那里**

```powershell
npm list -g opencode-ai
```

如果显示 `opencode-ai@x.x.x`，说明安装成功，只是 PATH 没配对。

**第 3 步：将 npm 全局路径加入 PATH**

方法 A — 临时生效（仅当前 PowerShell 窗口）：

```powershell
$env:Path += ";C:\Users\你的用户名\AppData\Roaming\npm"
opencode
```

方法 B — 永久生效（推荐）：

```powershell
# 获取当前用户的 PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

# 添加 npm 全局路径（替换为你的实际路径）
$newPath = $currentPath + ";C:\Users\你的用户名\AppData\Roaming\npm"

# 写入用户环境变量
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
```

然后**关闭并重新打开 PowerShell**，再运行 `opencode`。

**第 4 步：如果以上不行，尝试用 npx 直接运行**

```powershell
npx opencode-ai
```

**替代方案**：

| 场景 | 建议方案 |
|------|---------|
| Windows 原生 PowerShell | 上述方法 B（永久加 PATH） |
| 使用 WSL | 在 WSL 终端中重新 `npm install -g opencode-ai`，WSL 下 PATH 通常自动配好 |
| 想避免 PATH 问题 | 改用 `choco install opencode` 或 `scoop install opencode`，这些包管理器会自动配好 PATH |

> 💡 官方推荐 Windows 用户使用 **WSL**（Windows Subsystem for Linux）以获得最佳体验。

---

## 参考资源

- **官方网站**：https://opencode.ai
- **官方文档**：https://opencode.ai/docs
- **GitHub 仓库**：https://github.com/anomalyco/opencode
- **提供商文档**：https://opencode.ai/docs/providers/
- **配置文档**：https://opencode.ai/docs/config/
- **自定义命令**：https://opencode.ai/docs/commands/
- **Skills 文档**：https://opencode.ai/docs/skills/
