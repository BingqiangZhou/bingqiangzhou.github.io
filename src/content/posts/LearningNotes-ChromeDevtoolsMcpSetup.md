---
title: 【学习笔记】在 Windows 与 Mac 上配置 chrome-devtools-mcp 实战
published: 2026-06-17
description: 记录 chrome-devtools-mcp（Chrome 官方 MCP 服务器）的安装与配置，重点对比 Windows 与 Mac 的差异、三种浏览器连接模式，以及在 Claude Code / Cursor / VS Code 等客户端的接入方式与排错。
lang: zh
tags: [学习笔记, 工具分享]
---

> 本篇记录如何把 **chrome-devtools-mcp** 接入到编码助手（Claude Code、Cursor、VS Code 等）中。
>
> 它是 Google Chrome 团队官方维护的 MCP 服务器，能让 AI 直接控制、检查一个真实运行的 Chrome 浏览器——截图、读 DOM/CSS、分析网络请求、录制性能 trace、跑 Lighthouse。本篇会按"是什么 → 前置条件 → 通用配置 → 各客户端安装 → **Windows/Mac 差异** → 三种连接模式 → 排错"的顺序展开，重点放在最容易踩坑的**跨平台差异**上。
>
> 📦 项目地址：<https://github.com/ChromeDevTools/chrome-devtools-mcp>（npm 包：<https://www.npmjs.com/package/chrome-devtools-mcp>）

---

## 1. 它是什么

[chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) 是 Chrome DevTools 团队官方出品的 MCP（Model Context Protocol）服务器。它把自己注册成一个 MCP server，让 AI 编码助手获得完整的 Chrome DevTools 能力：

- **性能分析**：录制 Chrome trace，提取可落地的性能洞察（基于真实用户数据的 CrUX 反馈）。
- **深度调试**：分析网络请求、截图、读取控制台消息（带 source map 后的堆栈）。
- **可靠自动化**：底层用 [puppeteer](https://github.com/puppeteer/puppeteer) 驱动 Chrome，自动等待动作结果，比裸写脚本更稳。

一句话：**它把"AI 操控浏览器做调试和性能分析"这件事做到了工程级**，而不只是简单的页面点击。

> ⚠️ **安全提示**：chrome-devtools-mcp 会把浏览器实例的内容暴露给 MCP 客户端，使其可以检查、调试、修改浏览器或 DevTools 里的任何数据。**不要在连接它的浏览器里处理你不想分享的敏感信息**。官方也只保证支持 Google Chrome 和 [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/)，其他 Chromium 系浏览器能用但不保证。

---

## 2. 前置条件

跨平台通用，Win 和 Mac 完全一致：

| 依赖 | 要求 |
| --- | --- |
| **Node.js** | LTS 版本（建议 v20.19+ 或更新 LTS） |
| **npm** | 随 Node.js 一起安装即可 |
| **Google Chrome** | 当前稳定版或更新 |

不需要全局安装任何东西——它通过 `npx` 按需拉起，配置里直接写 `chrome-devtools-mcp@latest` 就能始终用最新版。

---

## 3. 通用配置（最小可用）

无论哪个客户端，核心都是这段 MCP 配置。**这段在 Windows 和 Mac 上完全一样**：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

`-y` 表示自动确认 npx 拉取包，`@latest` 保证每次都拿最新版本。把它粘进对应客户端的 MCP 配置文件即可。

> 💡 **为什么不写死版本号**：`@latest` 走的是 npm 的 `latest` dist-tag，会自动跟随最新版——写本文时（2026-06-17）它解析到 1.2.0（发布于 2026-06-08），将来出新版会自动升级，无需手动改配置。chrome-devtools-mcp 迭代频繁（1.x 系列基本一两周一个版本），写死版本号很快就会过时，这也是官方推荐的写法。想确认远程仓库里的最新版，跑 `npm view chrome-devtools-mcp version`（它查的是 npm registry、不是本地安装版本）。

如果你只想要最基础的"打开网页 + 执行脚本 + 截图"，可以加 `--slim --headless` 用精简的三件套模式：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--slim", "--headless"]
    }
  }
}
```

---

## 4. 各客户端的安装方式

不同客户端把上面那段配置"喂"进去的方式不同，挑你用的那个即可。

### 4.1 Claude Code（CLI 一行命令）

推荐用 CLI 直接注册，最省事：

```bash
claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest
```

`--scope user` 表示全局生效（写入用户级配置），所有项目都能用；想去掉作用域就改成项目级。

**插件方式（MCP + Skills 一起装）**：如果你希望连同"怎么用好这些工具"的 skills 一起装上，可以用插件市场：

```bash
/plugin marketplace add ChromeDevTools/chrome-devtools-mcp
/plugin install chrome-devtools-mcp@chrome-devtools-plugins
```

装完重启 Claude Code，用 `/skills` 能看到新增的技能。

> 提示：之前如果已经用 CLI 装过，先从配置里移除旧的，再用插件方式装，避免重复。

### 4.2 Cursor

打开 `Cursor Settings → MCP → New MCP Server`，把第 3 节的通用配置粘进去即可。也可以用官方一键按钮（Cursor 设置页里有 chrome-devtools 的 install 按钮）。

### 4.3 VS Code / GitHub Copilot

**插件方式（最省事）**：`Cmd+Shift+P`（Mac）/ `Ctrl+Shift+P`（Windows）打开命令面板，运行 `Chat: Install Plugin From Source`，粘贴 `ChromeDevTools/chrome-devtools-mcp`。

**CLI 方式**（手动写配置）：

```bash
# macOS / Linux
code --add-mcp '{"name":"io.github.ChromeDevTools/chrome-devtools-mcp","command":"npx","args":["-y","chrome-devtools-mcp"],"env":{}}'

# Windows（PowerShell，注意三引号转义）
code --add-mcp '{"""name""":"""io.github.ChromeDevTools/chrome-devtools-mcp""","""command""":"""npx""","""args""":["""-y""","""chrome-devtools-mcp"""]}'
```

注意 Windows PowerShell 里 JSON 要用 `"""` 转义双引号，这是 PowerShell 的字符串规则，和 MCP 无关。

### 4.4 Claude Desktop

Claude Desktop 走的是 `claude_desktop_config.json`（Mac 在 `~/Library/Application Support/Claude/`，Windows 在 `%APPDATA%\Claude\`），直接把第 3 节的通用配置粘进 `mcpServers` 即可，保存后重启 Claude Desktop。

### 4.5 其他客户端

Gemini CLI、Codex、JetBrains AI Assistant、Windsurf、Cline、Warp 等，思路都一样——找到它的 MCP 配置入口，填入第 3 节的 JSON。其中 Codex 和 Gemini CLI 还提供 `codex mcp add ...` / `gemini mcp add ...` 的一行命令。

---

## 5. Windows 与 Mac 的关键差异 ⭐

这是本篇的重点。第 3 节的配置虽然"看起来"跨平台一致，但实际跑起来，Windows 上有更多坑。下面逐条列出。

### 5.1 `npx` 命令的坑（最容易踩）

在 macOS/Linux 上，`"command": "npx"` 直接就能跑。但在 **Windows** 上，`npx` 实际是 `npx.cmd`，部分 MCP 客户端用 `child_process` 直接 spawn `npx` 会报"找不到命令"。

官方在 README 里给的 **Codex on Windows 11** 解法，是用 `cmd /c` 包一层：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "chrome-devtools-mcp@latest"
      ],
      "env": {
        "SystemRoot": "C:\\Windows",
        "PROGRAMFILES": "C:\\Program Files"
      },
      "startup_timeout_ms": 20000
    }
  }
}
```

关键点：

- `"command": "cmd"` + `args` 第一个元素 `"/c"`，让命令经过 cmd 解释后再拉起 npx。
- 补上 `SystemRoot`、`PROGRAMFILES` 环境变量，避免子进程找不到系统路径。
- `startup_timeout_ms` 调大（如 20000ms），因为 Windows 上首次 `npx` 拉包 + 启动 Chrome 偏慢，默认超时容易失败。

> 这个 `cmd /c npx` 的写法**不止 Codex 适用**——任何在 Windows 上启动 npx 型 MCP server 失败的客户端（Claude Desktop、部分 IDE 插件等）都可以照搬这个模式。

### 5.2 Chrome 可执行文件路径不同

当你需要手动指定 Chrome 路径（`--executable-path`）或用命令行带参数启动 Chrome 时，两平台路径完全不同：

| 平台 | Chrome 可执行文件路径 |
| --- | --- |
| **macOS** | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| **Windows** | `C:\Program Files\Google\Chrome\Application\chrome.exe` |

### 5.3 默认用户数据目录不同

不手动指定时，chrome-devtools-mcp 会用一个默认的 profile 目录，两平台位置不同（且**不会在运行间清空**，所有实例共享）：

- **Linux / macOS**：`~/.cache/chrome-devtools-mcp/chrome-profile-stable`
- **Windows**：`%HOMEPATH%\.cache\chrome-devtools-mcp\chrome-profile-stable`

其中路径末尾的 `stable` 对应 Chrome 渠道（默认就是 stable，也可能是 `canary`/`dev`/`beta`）。如果你想要"用完即焚"的临时 profile，加 `--isolated`，它会在浏览器关闭后自动清理。

### 5.4 终端转义与引号差异

在命令行里启动 Chrome 或传 JSON 配置时，两平台转义规则不同。例如启动带远程调试的 Chrome（见第 6 节模式 C），命令长这样：

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-profile-stable

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="%TEMP%\chrome-profile-stable"
```

macOS 路径里的空格用 `\` 转义；Windows 路径含空格用双引号包裹，行继续符是 `^`（PowerShell 用反引号 `` ` ``）。

### 5.5 差异速查表

| 维度 | macOS | Windows |
| --- | --- | --- |
| `command` 字段 | 直接 `npx` | 多数客户端需 `cmd` + `/c` 包装 |
| Chrome 路径 | `/Applications/Google Chrome.app/...` | `C:\Program Files\Google\Chrome\...` |
| 默认 profile 目录 | `~/.cache/...` | `%HOMEPATH%\.cache\...` |
| VS Code 注册命令引号 | 单引号包 JSON | PowerShell 需 `"""` 转义 |
| 首次启动速度 | 较快 | 偏慢，建议调大 `startup_timeout_ms` |

---

## 6. 三种浏览器连接模式

chrome-devtools-mcp 和浏览器建立连接有三种方式，选哪个取决于你的场景。

### 模式 A：启动全新实例（默认）

什么都不加，MCP server 自己拉起一个独立 profile 的 Chrome。最省心，适合绝大多数自动化场景。

### 模式 B：复用当前浏览器会话（`--autoConnect`，需 Chrome 144+）

适合"我想让 AI 直接用我已经登录好的浏览器"——比如调试一个需要登录后才能访问的页面，不必让 AI 再登录一次。

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--autoConnect"]
    }
  }
}
```

前置：在 Chrome（≥ 144）里打开 `chrome://inspect/#remote-debugging` 启用远程调试。每次 MCP server 请求连接时，Chrome 会弹窗让你确认授权，并在顶部显示"Chrome 正受到自动测试软件的控制"横幅。

### 模式 C：远程调试端口（`--browser-url`）

适合"AI 在沙箱里跑，但浏览器在沙箱外"的场景。先手动启动带调试端口的 Chrome，再让 MCP server 连过去。

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--browser-url=http://127.0.0.1:9222"
      ]
    }
  }
}
```

先启动 Chrome（**关闭所有已运行的 Chrome**，且必须用非默认 user-data-dir）：

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-profile-stable

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="%TEMP%\chrome-profile-stable"
```

> ⚠️ 开了远程调试端口后，本机任何程序都能连上这个端口控制浏览器。**调试期间别访问敏感网站**。

三种模式怎么选：

| 模式 | 参数 | 适用场景 |
| --- | --- | --- |
| A 全新实例 | （默认） | 纯自动化、不需要登录态、最简单 |
| B 复用会话 | `--autoConnect` | 共享登录态、手动+AI 混合调试（需 Chrome 144+） |
| C 远程端口 | `--browser-url` | AI 在沙箱内、浏览器在沙箱外 |

---

## 7. 常用配置选项

在 `args` 里追加即可，部分高频项：

| 参数 | 作用 |
| --- | --- |
| `--headless` | 无头模式，不弹浏览器窗口 |
| `--isolated` | 用临时 profile，关闭浏览器后自动清理 |
| `--channel=stable\|beta\|dev\|canary` | 指定 Chrome 渠道 |
| `--executable-path=<path>` | 手动指定 Chrome 可执行文件路径（路径见 5.2） |
| `--viewport=1280x720` | 初始视口尺寸 |
| `--proxy-server=<url>` | 走代理 |
| `--no-usage-statistics` | 关闭 Google 默认开启的使用统计上报 |

一个组合了若干常用项的完整示例：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--isolated",
        "--headless",
        "--no-usage-statistics"
      ]
    }
  }
}
```

> 关于遥测：chrome-devtools-mcp **默认开启**使用统计上报（工具调用成功率、延迟、环境信息）。敏感/生产环境建议加 `--no-usage-statistics`，或设置环境变量 `CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS=1`（CI 环境下会自动关闭）。性能工具默认还会把 trace URL 发给 Google CrUX API，可用 `--no-performance-crux` 关闭。

---

## 8. 验证配置是否生效

接好后，在客户端里发一个测试 prompt：

```text
Check the performance of https://developers.chrome.com
```

正常的话，AI 会调用 chrome-devtools-mcp 的工具，打开浏览器并对该页面录制一次性能 trace，回传报告。

> 注意：MCP server **不会在你一连接时就启动浏览器**，只有当某个工具真正需要浏览器时才会拉起。

### 常见问题排查

- **Windows 上 `npx` 报找不到命令** → 用第 5.1 节的 `cmd /c` 包装。
- **启动超时** → 调大 `startup_timeout_ms`（首次拉包慢）。
- **连不上运行中的 Chrome** → 确认 Chrome 用了非默认 `--user-data-dir` 启动，且端口和配置里的 `--browser-url` 一致。
- **插件安装报 `Failed to clone repository`** → 多半是公司防火墙挡了 HTTPS，参考官方 troubleshooting 文档，或退回 CLI 安装方式。
- **想用 canary/beta 版 Chrome** → 加 `--channel=canary` 等参数。

---

## 9. 小结

配置 chrome-devtools-mcp 的核心其实就一句：**把那段 `npx chrome-devtools-mcp@latest` 的 JSON 喂给你的客户端**。真正需要分平台对待的，是 Windows 上 `npx` 的 `cmd /c` 包装、Chrome 路径、profile 目录、以及命令行转义这几处细节；而连接浏览器的三种模式（全新实例 / `--autoConnect` / `--browser-url`）则决定了它用哪个浏览器、带不带登录态。

一句话流程：

1. 装好 Node.js LTS 和 Chrome。
2. 用 `claude mcp add ...`（或对应客户端）注册 server，Windows 注意 `cmd /c` 包装。
3. 按需选连接模式（默认最简单，要复用登录态用 `--autoConnect`）。
4. 发 `Check the performance of ...` 验证。
5. 敏感环境加 `--no-usage-statistics` / `--isolated`。

配好之后，AI 就能真正"看见"页面——截图、读网络、跑性能 trace、定位元素，调试前端 bug 时省下大量手动截图和复述的力气。
