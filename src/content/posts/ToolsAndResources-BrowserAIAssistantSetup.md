---
title: 【工具分享】中国大陆开启 Chrome Gemini 和 Edge Copilot 的完整指南
published: 2026-05-05
description: 在中国大陆环境下，开启 Google Chrome 中的 Gemini AI 助手和 Microsoft Edge 中的 Copilot 模式的完整教程，包括地区伪装、网络配置和常见问题解决。
lang: zh
tags: [实践记录]
---

> **说明**：Gemini in Chrome 和 Copilot in Edge 目前均未对中国大陆地区正式开放。本文整理的方法来自社区用户实践分享，可能随软件更新而失效，请参考最新教程。

---

## 一、在中国大陆开启 Chrome Gemini

Google 已将基于 **Gemini 3** 模型的 AI 深度集成到 Chrome 浏览器中。中国大陆用户面临的挑战主要有两个：**地区限制**（Google 仅向美国等地区用户开放）和**网络环境**（Google 服务在中国大陆无法直接访问）。

### 核心思路

需要解决两个层面的问题：

1. **伪装地区**：让 Chrome 认为你处于美国地区
2. **网络连通**：确保能访问 Google 的 Gemini 服务

### 方法一：修改 Local State 文件（推荐，最直接）

这是目前社区验证成功率最高的方法，通过修改 Chrome 本地配置文件中的地区代码来解锁功能。

#### 步骤一：完全关闭 Chrome

修改前**必须完全退出 Chrome**，在任务管理器中结束所有 Chrome 相关进程。

#### 步骤二：找到 Local State 文件

| 操作系统 | 文件路径 |
|----------|----------|
| **Windows** | `%LOCALAPPDATA%\Google\Chrome\User Data\Local State` |
| **macOS** | `~/Library/Application Support/Google/Chrome/Local State` |
| **Linux** | `~/.config/google-chrome/Local State` |

> **建议先备份 `Local State` 文件**，以防修改出错可以恢复。

#### 步骤三：修改三个关键字段

用文本编辑器（记事本、VS Code 等）打开 `Local State` 文件（JSON 格式，无扩展名），搜索并修改以下字段：

| 字段名 | 修改前 | 修改后 |
|--------|--------|--------|
| `variations_country` | `"cn"` | `"us"` |
| `variations_permanent_consistency_country` | `["版本号","cn"]` | `["版本号","us"]` |
| `is_glic_eligible` | `false` | `true` |

修改后保存文件。

#### 步骤四：开启 Chrome Flags

打开 Chrome，在地址栏依次输入并设为 **Enabled**：

```
chrome://flags/#glic
chrome://flags/#glic-side-panel
```

如果还需要 `Tabstrip Combo Button` 选项，也设为 Enabled。

#### 步骤五：设置 Chrome 语言为英语

1. 进入 **Settings → Languages**
2. 将 **English (United States)** 添加到语言列表并**置顶**
3. 勾选"以英语显示浏览器"

> Mac 用户可以在系统设置 → 通用 → 语言与地区 → 应用程序中单独为 Chrome 设置英文。实测表明，如果不设置系统级的应用语言，切回中文后 Gemini 图标可能会消失。

#### 步骤六：重启 Chrome

重启后，检查地址栏右侧是否出现 **Gemini 图标**（星星图标）或 **Ask Gemini** 按钮。

#### 注意事项

- Chrome 更新可能**覆盖 Local State 的修改**，更新后需重新修改
- 修改时注意 **JSON 格式正确**，否则 Chrome 可能异常
- 必须在网络环境支持的情况下才能正常使用 Gemini 功能

### 方法二：Chrome 启动参数法（更安全）

通过命令行参数强制指定区域，无需直接修改配置文件：

**macOS：**

```bash
open -n -a "Google Chrome" --args --variations-override-country=us
```

**Windows：**

右键 Chrome 快捷方式 → 属性 → 在"目标"栏末尾添加：

```
--variations-override-country=us
```

这种方法风险更低，无需改动文件，但每次都需要通过这个快捷方式启动 Chrome。

### 方法三：使用 Python 脚本一键开启

GitHub 上有开源项目可以自动化上述修改过程：

项目地址：[lcandy2/enable-chrome-ai](https://github.com/lcandy2/enable-chrome-ai)

**前提条件**：Python 3.13+ 环境

```bash
# 1. 安装 uv 包管理工具
# Windows PowerShell:
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# macOS:
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. 下载并运行脚本
git clone https://github.com/lcandy2/enable-chrome-ai.git
cd enable-chrome-ai
uv sync
uv run main.py
```

运行后 Chrome 会自动关闭、修改配置、重启。脚本只修改 Chrome 用户配置文件，不篡改系统文件或 Chrome 二进制文件，完全可逆。

### 网络环境配置

即使成功解锁了 Gemini 图标，实际使用仍需要能访问 Google 服务。建议：

- 使用**美国节点**的网络代理
- 可通过 [sing-box](https://sing-box.sagernet.org/) 等工具只路由 Gemini 相关域名（关键词 `gemini` 和 `-pa`），而非全局代理
- 将 DNS 设置为 `8.8.8.8`（Google）或 `1.1.1.1`（Cloudflare）可帮助解决连接问题

### 验证是否成功

- 地址栏右侧出现 **Ask Gemini** 星星图标 → 基础功能已开启
- 点击图标，侧边栏弹出 Gemini 对话框 → 可正常使用
- 如果图标不出现，参考以下排查步骤：
  1. 确认 Chrome 语言为 **English (United States)**
  2. 在任务管理器中**杀掉所有 Chrome 进程**后重启（不是只关闭窗口）
  3. 清除缓存：`chrome://settings/clearBrowserData`
  4. 重新检查 Local State 文件中的三个字段是否仍为修改后的值

### Auto Browse 额外要求

如需使用 Auto Browse 代理浏览功能，还需要：

- 订阅 **Google AI Pro**（每日 20 次）或 **Google AI Ultra**（每日 200 次）
- 设备语言设置为英语
- 必须使用**美国节点**网络

### 常见问题

| 问题 | 解决方法 |
|------|----------|
| 看不到 Gemini 选项 | 功能未解锁，检查 Local State 三个字段是否修改成功 |
| 图标出现后又消失 | Chrome 更新覆盖了修改，重新修改 Local State 或使用启动参数法 |
| 切回中文后图标消失 | 需要将 Chrome 语言固定为英语（Mac 需系统级设置） |
| 隐身模式不可用 | Gemini in Chrome 不支持隐身模式 |
| 连接超时 | 检查网络代理是否正常，DNS 是否设置为 8.8.8.8 |
| 修改后 Chrome 无法启动 | Local State JSON 格式错误，用备份文件恢复 |

---

## 二、在中国大陆开启 Edge Copilot

Microsoft Edge 的 Copilot 同样未对中国大陆正式开放。主要限制来自**微软的地理围栏**（检测 IP 和系统区域）和**网络连接**（Copilot 依赖 OpenAI API 和微软海外服务器）。

### 核心思路

1. **伪装系统区域**：将 Windows 区域和 Edge 设置改为美国
2. **网络环境**：确保能稳定连接微软的 Copilot 服务器

### 方法一：修改 Windows 系统区域（必须）

#### 步骤一：修改 Windows 区域

1. 打开 **设置** → **时间和语言** → **语言和区域**
2. 将 **国家或地区** 修改为 **美国**
3. 此修改不影响系统语言，但建议修改后**重启电脑**

#### 步骤二：修改非 Unicode 程序语言（可选但推荐）

1. 打开 **控制面板** → **区域** → **管理** 标签
2. 点击 **更改系统区域设置**
3. 将当前系统区域设置改为 **英语（美国）**
4. 勾选"Beta 版：使用 Unicode UTF-8 提供全球语言支持"
5. **重启电脑**

#### 步骤三：修改 Windows 显示语言（可选）

1. 设置 → 时间和语言 → 语言和区域
2. 将系统语言设置为 **English (United States)** 并设为首选
3. 重启电脑

### 方法二：配置 Edge 浏览器

#### 步骤一：更新 Edge 到最新版本

点击 Edge 右上角 `⋯` → **帮助和反馈** → **关于 Microsoft Edge**，等待自动更新。需要 Edge **141 及以上版本**。

#### 步骤二：开启 Copilot Mode

在地址栏输入：

```
edge://settings/ai
```

找到 **Copilot Mode** 开关，将其打开，确认条款。

也可以直接访问 [aka.ms/copilot-mode](https://aka.ms/copilot-mode) 开启。

#### 步骤三：确保 Copilot 侧边栏开启

进入 `edge://settings/sidebar`，确保 **Copilot** 选项已开启。

#### 步骤四：固定 Edge 首页（防止区域回退）

在地址栏输入：

```
edge://settings/startHomeNTP
```

将启动时选项设为"打开以下页面"，网址设为 `https://www.bing.com`。这可以防止 Edge 在启动时自动将区域回调为中国。

### 方法三：通过 Edge Flags 开启（备选）

如果设置中没有 Copilot Mode 选项：

1. 地址栏输入：

```
edge://flags/#edge-copilot-mode
```

设为 **Enabled**（先试 Default，不行再试 Enabled）

2. 再打开：

```
edge://flags/#edge-ntp-composer
```

设为 **Enabled**

3. 点击 **Restart** 重启 Edge

### 网络环境配置

Copilot 的风控比普通网页访问更严格，需要：

- 使用**高质量的住宅 IP** 节点（数据中心 IP 容易被识别为代理并拒绝连接）
- 确保代理工具开启**全局模式**，让所有微软相关流量都经过代理
- 将 DNS 设置为 `8.8.8.8` 或 `1.1.1.1` 解决 DNS 污染问题
- 长期使用 VPN 可能导致 Microsoft Rewards 地区被切换，恢复正常需要保持国内网络环境一段时间

### 开启附加功能

Copilot Mode 开启后，在 `edge://settings/ai` 中还可以启用：

| 功能 | 说明 |
|------|------|
| **Journeys（旅程）** | 自动按主题分组浏览活动，帮你接续未完成的任务 |
| **Actions（操作）** | AI 代理功能，用自然语言让 Copilot 执行任务（预订餐厅、填表等） |

> Journeys 在所有 Copilot 市场免费提供。Actions 目前处于早期阶段，操作精度仍有待提升。

### 使用方式

- 点击 Edge 右上角 **Copilot 图标** 打开侧边栏
- 快捷键 **Ctrl + Shift + .** 快速打开
- 地址栏左侧 **Copilot 按钮** 打开浮动提示框
- 支持文字输入和 **Copilot Vision** 语音对话

### 隐私设置

在 Copilot 侧边栏点击 `⋯` → Settings → Privacy：
- **Context clues（上下文线索）**：控制 Copilot 是否使用当前网页和浏览历史
- **Personalization and memory（个性化和记忆）**：控制 Copilot 是否使用历史对话记忆

### 常见问题

| 问题 | 解决方法 |
|------|----------|
| "此区域当前不支持 Copilot" | 检查 Windows 区域是否为美国，检查网络代理是否正常 |
| Copilot 图标消失 | 区域设置可能被安全软件自动"修复"回中国，重新修改 |
| 一直在转圈/尝试重新连接 | DNS 污染，将 DNS 改为 8.8.8.8 或 1.1.1.1；检查代理全局模式 |
| 需要更新配置文件提示 | 尝试完全重新安装 Edge，或检查第三方防病毒软件是否干扰 |
| VPN 导致 Rewards 地区异常 | 停止使用 VPN，保持国内网络环境数天等待恢复 |

---

## 三、对比总结

| 对比项 | Gemini in Chrome | Copilot in Edge |
|--------|-----------------|-----------------|
| 地区限制状态 | 未对中国大陆开放 | 未对中国大陆开放 |
| 核心解锁方法 | 修改 Local State 文件 + Flags | 修改 Windows 区域设置 + 网络环境 |
| 是否需要网络代理 | 是（访问 Google 服务） | 是（访问 Copilot 服务） |
| IP 质量要求 | 美国节点即可 | 建议住宅 IP，数据中心 IP 容易被识别 |
| 系统级修改 | 修改 Chrome 配置文件 | 修改 Windows 区域/语言设置 |
| 是否需要切换语言 | 是（必须切换为英语） | 否（中文系统可使用） |
| 持久性 | Chrome 更新可能覆盖修改 | Windows 设置较稳定 |
| 免费功能 | 页面总结、问答、侧边栏 | 侧边栏、Journeys、Actions |
| 付费功能 | Auto Browse 需 AI Pro/Ultra | 目前全部免费 |
| 代理操作 | Auto Browse（功能更成熟） | Copilot Actions（早期阶段） |
| 底层模型 | Gemini 3 | Microsoft Copilot (GPT-4 系) |
| 多标签理解 | 最多 10 个标签页 | 所有打开的标签页 |
| 图像编辑 | Nano Banana 内置 | 无 |
| 关联应用生态 | Gmail、Calendar、YouTube、Maps 等 | Microsoft 365 生态 |

---

## 参考来源

- [Use Gemini in Chrome — Google Help](https://support.google.com/chrome/answer/16283624)
- [Ask Gemini in Chrome to complete tasks with auto browse — Google Help](https://support.google.com/chrome/answer/16821166)
- [Chrome gets new Gemini 3 features — Google Blog](https://blog.google/products-and-platforms/products/chrome/gemini-3-auto-browse/)
- [Chrome AI Innovations — Google 官方页面](https://www.google.com/chrome/ai-innovations/)
- [2026 Chrome AI 开启教程 — 文浩博客](https://blog.wenhaofree.com/posts/articles/enable-chrome-ai-gemini-guide/)
- [国内手动开启 Gemini AI 侧边栏与 Auto Browse — AppsCross](https://appscross.com/blog/enable-gemini-ai-chrome-auto-browse-tutorial.html)
- [Chrome 浏览器原生 Gemini 开启指南 — 蓝点网](https://www.landiannews.com/archives/111675.html)
- [enable-chrome-ai — GitHub](https://github.com/lcandy2/enable-chrome-ai)
- [美国境外启用 Chrome 中的 Gemini — Reddit](https://www.reddit.com/r/chrome/comments/1qvmnew/tutorial_enabling_gemini_in_chrome_glic_outside_us/)
- [Getting started with Copilot in Microsoft Edge — Microsoft Support](https://support.microsoft.com/en-us/topic/getting-started-with-copilot-in-microsoft-edge-ab0153dc-ad31-4de6-899a-802223821a9d)
- [Copilot Journeys — Microsoft Support](https://support.microsoft.com/en-us/topic/copilot-journeys-83d74165-16c8-4787-b66f-f067ab7bcbb0)
- [Copilot Mode — Microsoft Edge 官方页面](https://www.microsoft.com/zh-cn/edge/copilot-mode)
- [2026 最新解决"此区域当前不支持 Copilot" — IPdodo](https://www.ipdodo.com/news/14967/)
- [Enable or disable Copilot Mode — Pureinfotech](https://pureinfotech.com/enable-disable-copilot-mode-microsoft-edge-windows-11/)
- [固定 Edge 浏览器位置设置 — CSDN](https://blog.csdn.net/fair_li/article/details/134752495)
