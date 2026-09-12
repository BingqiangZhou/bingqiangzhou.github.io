---
title: 【学习笔记】ZCode 插件开发调研与实战：与 Claude Code 插件的对比，以及一个实时 Token 速度计
published: 2026-09-11
description: ZCode（Z.ai 的智能体开发环境、GLM 官方 harness）的插件怎么写、和 Claude Code 插件是否共通？本文前半是调研：基于官方文档与本机插件缓存实地考察，插件就是一个带 .zcode-plugin/plugin.json 清单的文件夹，可选捆绑技能、斜杠命令、子代理、钩子、MCP 服务器五类组件，本地用一份 marketplace.json 加 GUI「添加插件市场」即可装机调试，分发走 GitHub 市场仓库或收录制；与 Claude Code 的关系是单向高度兼容、双向不完全共通——清单回退探测、hook 执行器、stdin 双命名、模板变量四层主动兼容（Claude 官方市场 294 个插件可直接装），但清单必需性、组件种类、hook 事件集（仅 7 个，是 Claude 的子集）、管理方式（纯 GUI vs 全套 CLI）均不同，附双栖插件写法清单。后半是学以致用的实战：给 ZCode 外挂实时 Token 速度计——原生无 token/s 显示，锁定 ~/.zcode/cli/rollout/ 下未脱敏的 model-io 落盘记录为唯一数据源，方案 A 是 50 行 Python 终端速度计（实测 19.9~65.1 tok/s），方案 B 是 Stop 事件 hook，装机端到端实测每轮真实触发（消息挂 Hooks 标记、158ms 执行），但 systemMessage 文本当前桌面版不渲染，速度数字读脚本自写的触发日志。
lang: zh
tags: [学习笔记, 实践记录, Claude Code]
abbrlink: zcode-plugin-dev
---

最近想把一些重复的工作流沉淀成 ZCode 的扩展，顺手把两个问题一起调研清楚：怎么给 ZCode 写插件？它和 Claude Code 的插件体系是什么关系，写一份能不能两边通用？另外还有个一直想解决的小事：想知道当前模型每秒吐多少 token，但 ZCode 界面上哪都看不到——正好可以用调研到的 hooks 知识实战一把。ZCode 是 Z.ai 的智能体开发环境（ADE），也是 GLM 的官方 harness，我日常拿它配合 GLM Coding Plan 干活。

这篇笔记的材料一半来自官方文档，另一半来自本机 `~/.zcode/` 目录的实地考察——ZCode 内置的十来个官方插件完整缓存在硬盘上，manifest 原文可以直接当范例抄，比文档更诚实。

> **先说结论**：一、ZCode 插件就是一个文件夹，唯一必需的是一份 `.zcode-plugin/plugin.json` 清单，可选捆绑**技能（skills）、斜杠命令（commands）、子代理（agents）、钩子（hooks）、MCP 服务器**五类组件。二、与 Claude Code 插件的关系是**单向高度兼容、双向不完全共通**：Claude 生态的插件基本可以原样装进 ZCode（本机实测装过 Claude 官方市场的东西），反向则要补一份 Claude 格式的清单并避开 ZCode 专有能力。三、实战篇给 ZCode 外挂了实时 Token 速度计——原生确实没有 token/s 显示，但每次模型请求完成的一瞬间，精确的 usage 数据就落盘在 `~/.zcode/cli/rollout/model-io-sess_<会话id>.jsonl`；50 行脚本的终端速度计实测可用，Stop hook 装机端到端实测每轮真实触发（消息上可见 Hooks 标记），但 systemMessage 文本当前不渲染到页面。四、如果只是想复用工作流，多数场景不需要插件——项目级 `.zcode/skills/` 就够了。

## ZCode 插件长什么样：一个文件夹加一份清单

插件本质上是一个目录，除清单外所有组件目录都可选：

```text
my-plugin/
├── .zcode-plugin/plugin.json   # 清单，唯一必需
├── skills/<名>/SKILL.md        # 技能（可选）
├── commands/*.md               # 斜杠命令（可选）
├── agents/*.md                 # 子代理（可选）
├── hooks/hooks.json            # 钩子（可选）
└── .mcp.json                   # MCP 服务声明（可选）
```

清单位置按优先级探测：`.zcode-plugin/plugin.json`（推荐）→ `.claude-plugin/plugin.json`（兼容 Claude Code 插件）→ `.codex-plugin/plugin.json`。插件身份记作 `name@marketplace`，本机配置里的启用开关就是按这个键记录的。

`plugin.json` 的主要字段：

| 字段 | 说明 |
| --- | --- |
| `name`（必填） | 须匹配 `^[a-z0-9][a-z0-9._-]{0,127}$` |
| `version` / `description` / `author` / `license` / `keywords` / `homepage` / `repository` | 常规元信息 |
| `commands` / `skills` / `hooks` / `mcpServers` / `agents` | 组件声明，支持目录字符串、路径数组或内联对象三种写法 |
| `dependencies` | 依赖的其他插件，写 `name@market` 或同市场内裸 `name` |
| `userConfig` | 用户可配置项，见下 |

`userConfig` 每项定义 `type`（string/number/boolean/directory/file）、`title`、`description`、`default`、`required`、`sensitive`——敏感值在界面上打码，并且可以在 MCP 声明里用 `${user_config.键}` 引用（写进 MCP 的 `url`、`headers` 等位置）。另有一组字段要留意：`channels`、`lspServers`、`outputStyles`、`settings` 写进清单后运行时**只登记、不执行**，会给出诊断提示。

最简实例直接抄本机缓存的 skill-creator（全文就这几行）：

```json
{
  "name": "skill-creator",
  "version": "0.1.0",
  "description": "Create, edit, and iterate local ZCode skills.",
  "author": { "name": "Z.ai" },
  "license": "MIT",
  "skills": "skills"
}
```

## 五类组件：能往插件里塞什么

| 组件 | 格式与要点 |
| --- | --- |
| **技能 Skill** | `skills/<名>/SKILL.md`；frontmatter 必填 `name`（缺省取目录名）与 `description`（≤1024 字符，写得越准越容易被自动触发）；可选 `metadata`、`license`，非白名单字段被忽略 |
| **斜杠命令 Command** | `commands/*.md`，文件名即命令名（`^[a-z0-9][a-z0-9_:-]{0,63}$`）；frontmatter 可写 `description`、`argument-hint`、`allowed-tools`、`model`、`disable-noninteractive`；正文用 `$ARGUMENTS`、`$1`/`$2` 接参 |
| **子代理 Agent** | `agents/*.md`；frontmatter 必填 `name`/`description`，可选 `color`、`tools`；**正文就是它的 system prompt** |
| **钩子 Hook** | `hooks/hooks.json`，标准位置自动发现，manifest 不必重复声明；七个事件：`SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PermissionRequest`、`PostToolUse`、`PostToolUseFailure`、`Stop` |
| **MCP 服务** | 根目录 `.mcp.json` 或清单内联 `mcpServers`；支持 stdio/http/sse |

hooks 是五类组件里唯一能「改行为」的，值得展开。机制是本地子进程协议：ZCode 向 hook 进程的 stdin 写一行 JSON（带 `tool_name`、`tool_input`、`session_id` 等），hook 往 stdout 回协议 JSON：

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "不允许写这个目录"
  }
}
```

- `PreToolUse` 可以 `allow`/`deny`，甚至用 `updatedInput` **整体替换**工具输入（替换后重新过 schema 校验）；
- `UserPromptSubmit` 返回 `continue: false` 加 `reason` 可以阻断本次请求；
- `Stop` 返回 `decision: "block"` 可以逼主模型再干一轮（最多连续 3 次，防死循环）；
- 注入上下文用 `hookSpecificOutput.additionalContext`；退出码 2 是「阻断」的快捷方式；
- 执行器两种：`type: "process"`（argv 数组直接执行，不经 shell，官方推荐）和 `type: "command"`（整串交给 shell，为兼容 Claude 市场插件保留）；
- hook 配置在 session 启动时形成快照，改完要**新开会话**验证；用户级 hook 需在 `~/.zcode/cli/config.json` 里设 `hooks.enabled: true`，且**项目级 hook 当前不执行**。

MCP 这边，模板变量有 `${ZCODE_PLUGIN_ROOT}`（兼容 `${CLAUDE_PLUGIN_ROOT}`）、`${ZCODE_PLUGIN_DATA}`（持久数据目录，别把长期数据写回安装目录）、`${CLAUDE_PROJECT_DIR}`。服务注册后自动加命名空间 `plugin:<插件名>:<服务名>` 防冲突。本机两个官方范例正好代表两种形态：computer-use 在 manifest 内联 `mcpServers`、以 stdio 启动自带的 `dist/mcp/server.js`；document-skills 则用根目录 `.mcp.json` 声明 http 型服务。

## 本地开发调试：不用命令行，全靠 GUI

这是 ZCode 和 Claude Code 工作流差异最大的地方：**没有 `marketplace add` 这类 CLI 命令**，装插件走设置界面。

1. 本地建好插件目录、写好清单；旁边放一份 `marketplace.json`，条目的 `source` 用相对路径指向插件目录；
2. 打开 设置 → 插件，点右上角 **创建 → 添加插件市场**，填本地目录路径（ZCode 会先校验市场合法性，也可以直接拖入文件夹）；
3. 在「个人」分段找到插件，安装并启用；新开会话验证组件生效（技能出现在 `/` 菜单，MCP 出现在设置 → MCP）；
4. 改完代码，回到搜索框上方齿轮图标的「市场源」面板**刷新该市场**即可，不用重装。

`marketplace.json` 顶层是 `name` + `plugins[]`（可选 `pluginRoot`、`allowCrossMarketplaceDependenciesOn`），每个条目必有 `name` 和 `source`。source 支持七种写法：相对路径字符串（`"./plugins/hello"`，最常用）、`directory`（本地绝对路径）、`github`、`git`、`file`、`url`（可带 headers）、`npm`——不过本机内置诊断插件 zcode-guide 的口径是 npm/pip 不支持，文档与实现可能有出入，以实测为准。

一个发版坑：更新检测的「最新版本」读 marketplace.json 里的 `version`，「已安装版本」读 plugin.json——自建市场发版**两处必须同步改**，否则永远不提示更新。

## 分发与安全：GitHub 市场仓库 + 收录制

- **团队内分发**：把插件放进仓库的 `plugins/` 目录、根部放 `marketplace.json` 列出条目、推上 GitHub，队友在 GUI 里「添加插件市场」填仓库地址，一次拿到全部插件。
- **公开分发**：官方市场是收录制（仓库在 zai-org/zcode-plugins），文档没有自助上架流程。好在可以直接添加 Claude 生态的市场（见下节），等于借用了那边 294 个插件的存量。
- **安全**：启用插件 = 授予本地代码执行信任——已启用的第三方插件和官方插件一样能执行进程、读继承的 Agent 环境变量。装第三方插件前先审查它的 `hooks/` 目录和脚本，不信任就停用或卸载。

本机状态文件也能看出整个机制的落点：插件实体缓存在 `~/.zcode/cli/plugins/cache/<marketplace>/<plugin>/<version>/`（多版本并存，browser-use 从 0.1.0 到 0.4.2 躺了八个版本），每个版本带一份 `.zcode-plugin-seed.json` 记录 hash 与来源；启用状态记在 `~/.zcode/cli/config.json` 的 `plugins.enabledPlugins`；市场注册表是 `known_marketplaces.json`。官方建议的参考范例：skill-creator 最简，android-emulator / ios-simulator 最全。

## 与 Claude Code 插件的对比：单向兼容的设计

### 四层兼容：ZCode 是怎么「翻译」Claude 插件的

翻文档和本机文件，能明确看到至少四层主动兼容：

1. **清单回退探测**：找不到 `.zcode-plugin/plugin.json` 就读 `.claude-plugin/plugin.json`，Claude 插件原地可用；
2. **hook 执行器兼容**：保留 `type: "command"`（shell 字符串）形态，官方文档明说是为了跑 Claude 市场插件的 hooks——本机装过的 superpowers 就是标准 Claude 插件，其 `hooks/hooks.json` 正是 `"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd"` 这种写法；
3. **stdin 双命名**：ZCode 写给 hook 进程的 JSON 同时保留自家 camelCase 和 Claude 的 snake_case 字段，跨过来的 hook 脚本不用改；
4. **stdout 协议与变量**：`permissionDecision`、`hookSpecificOutput.additionalContext`、退出码 2 阻断这些 Claude 风格的输出协议照单全收；`${CLAUDE_PLUGIN_ROOT}`、`${CLAUDE_PLUGIN_DATA}`、`${CLAUDE_PROJECT_DIR}` 变量照常展开。

### 本机实证：Claude 官方市场直接装

这不是纸面推断，`~/.zcode/cli/plugins/` 下的实际状态：

- `known_marketplaces.json` 里注册着 **claude-plugins-official**——Claude 官方市场（GitHub 来源，294 个插件），2026 年 6 月底添加成功，与 ZCode 自家的 zcode-plugins-official（26 个插件）并列；
- 从那边装过 superpowers、hyperframes、context7、chrome-devtools-mcp 等插件，缓存目录结构与 ZCode 自家插件完全一样；
- 一个有意思的细节：superpowers 的目录里同时躺着 `.claude-plugin/`、`.codex-plugin/`、`.cursor-plugin/`、`.kimi-plugin/`、`.devin-plugin/` 等七八套清单——「一份组件目录 + 多 harness 清单」正在成为跨工具插件的行业惯例，ZCode 用回退探测的方式接了进来。

### 差异对照：一张表看懂

| 维度 | ZCode | Claude Code |
| --- | --- | --- |
| 清单位置 | `.zcode-plugin/`（回退兼容 `.claude-plugin/`、`.codex-plugin/`） | 只有 `.claude-plugin/` |
| 清单是否必需 | **必需** | **可选**（省略时自动发现组件，从目录名推插件名） |
| 组件种类 | skills/commands/agents/hooks/MCP 五类可执行；`channels`、`lspServers`、`outputStyles`、`settings` 只登记不执行 | 五类之外还有 workflows、output-styles、主题（实验）、后台监视器（实验）、channels、LSP、`bin/`（加入 PATH）、受限 `settings.json` |
| hooks 事件 | **7 个** | **30+ 个**（ZCode 的 7 个恰好是它的子集；Claude 独有 `SessionEnd`、`SubagentStart/Stop`、`Notification`、`PreCompact`、`FileChanged`、模型切换前后等） |
| hook 执行器 | 2 种：`process`（推荐）、`command` | 5 种：`command`（exec/shell 两种形态）、`http`、`mcp_tool`、`prompt`、`agent`（实验） |
| hooks 配置位置 | 用户级 `config.json` + 插件；**项目级不执行** | 四层 settings 合并（用户/项目/本地/托管）+ 插件 + skill/subagent frontmatter |
| stdin 字段命名 | camelCase + snake_case 双写 | snake_case |
| 管理方式 | 纯 GUI（设置 → 插件） | 全套 CLI：`claude plugin init/validate/install/enable/update/list`、`/plugin` 界面、`/reload-plugins`、`--plugin-dir` |
| 市场生态 | 官方 26 个、收录制；可添加第三方与 Claude 市场 | 开放目录（官方市场 294+），自由添加 |
| MCP 命名空间 | 服务键自动加 `plugin:<插件名>:<服务名>` 前缀 | 工具名为 `mcp__plugin_<插件名>_<服务名>__<工具名>` |
| userConfig | 有；`sensitive` 值界面打码（暂不支持界面直接填写）；`${user_config.键}` 可进 MCP 声明 | 也有；支持 `multiple`/`min`/`max`，值存 settings.json 的 `pluginConfigs`；**shell 形态的 hook 里拒绝 `${user_config.*}`**（改用 exec 形态或环境变量） |
| 依赖声明 | `dependencies`（`name@market`） | `dependencies`（可带 semver 约束，如 `~2.1.0`） |

### 所以，是完全共通吗

不是，但接近「单向共通」：

- **Claude → ZCode**：基本即插即用。清单被回退探测读到，hooks 的 shell 形态被兼容，变量被展开，协议被识别。少数用到 Claude 独有事件（如 `SessionEnd`、`PreCompact`）或独有执行器（`http`、`mcp_tool`）的插件，那部分 hook 在 ZCode 里没有对应事件，不会生效。
- **ZCode → Claude Code**：要动手。Claude Code 不认识 `.zcode-plugin/`，必须**另放一份 `.claude-plugin/plugin.json`**（好在 Claude 对未识别字段直接忽略，ZCode 专有字段写进去也无害）；`type: "process"` 的 hook 要改成 `command` 形态；`plugin:<插件名>:<服务名>` 命名空间、ZCode 云服务的 JWT 认证这些专有物在 Claude 里不存在。

**双栖插件写法清单**（想在两边都跑，照这个写）：

1. 清单只用 `.claude-plugin/plugin.json`——ZCode 会回退识别，一份顶两家；
2. 组件限定在两家公共集：skills、commands、agents、hooks、MCP；
3. hooks 只用公共 7 事件，执行器用 `type: "command"`，路径占位符加引号；
4. 模板变量统一用 `${CLAUDE_PLUGIN_ROOT}`（两家都认），长期数据写 `${CLAUDE_PLUGIN_DATA}`；
5. MCP 用根目录 `.mcp.json` + stdio（`node` + 脚本路径）最通用；
6. `userConfig` 两家语义接近，但别依赖细节行为（shell hook 里的取值方式两家不同）。

## 实战：给 ZCode 外挂一个实时 Token 速度计

用 ZCode 干活的时候一直有个小遗憾：想知道当前模型每秒吐多少 token（GLM 的吞吐是个值得感知的信号——快慢档、缓存命中、网络波动都会反映在里面），但界面上哪都看不到。这一章就把前半篇调研到的 hooks 知识用起来，把这件事做成完整闭环：从确认「原生确实没有」，到找到隐藏的数据源，最后做出两个实测可用的工具——一个终端实时速度计，一个挂在 ZCode hooks 体系上的 Stop 钩子。代码全部贴出，照抄就能装。

### 第一步：确认原生确实没有

三路验证，结论一致：

- 官方用量统计文档最细只到「按天」粒度（趋势图/热力图/模型占比），无单条消息计数、无速率；
- 更新日志从头翻到尾没有 token/s、statusline、速率类条目，最接近的是某版本「上下文用量显示更准确」——那是 token 总量，不是速度；
- 本机 `~/.zcode/cli/config.json` 与 `~/.zcode/v2/setting.json` 里没有任何相关开关。

另外，ZCode 的插件/hooks 体系里也没有「往 UI 上画东西」的通道——hooks 的输出要么是给模型的上下文（`additionalContext`），要么是诊断日志。唯一的例外是 Claude 风格的 `systemMessage`（向用户显示消息），这个后面方案 B 会用到。

### 第二步：数据在哪——三个候选，只有 rollout 能用

| 数据源 | 内容 | 能否算速度 |
| --- | --- | --- |
| 日志 `~/.zcode/cli/log/zcode-*.jsonl` | 每次请求的 `model.sdk.stream.completed` 事件：毫秒时间戳、`textDeltaChars`/`reasoningDeltaChars`、`chunkCounts` | ⚠️ 所有 `usage` 字段一律 `[Redacted]` 脱敏（本机单日 1125 处无一例外），只能算耗时和字符速率 |
| 会话文件 `~/.zcode/v2/sessions/*/​*.json` | assistant 消息带 `durationMs`、`characterCount` | ⚠️ 只有字符数没有 token 数，只能估算 |
| **`~/.zcode/cli/rollout/model-io-*.jsonl`** | **每次模型请求一行：`startedAt`、`durationMs`、`model`、`sessionId`、`turnId`，`response.usage` 完整且未脱敏** | ✅ 精确可算 |

rollout 记录长这样（节选，去掉了响应正文和 headers）：

```json
{
  "type": "model_io",
  "startedAt": "2026-09-11T07:33:29.964Z",
  "durationMs": 4950,
  "model": { "modelId": "GLM-5.3", "providerId": "builtin:bigmodel-coding-plan", "variant": "max" },
  "sessionId": "sess_xxxxxxxx-...",
  "turnId": "turn_xxxxxxxx-...",
  "response": {
    "finishReason": "tool-calls",
    "usage": {
      "inputTokens": 116213,
      "outputTokens": 232,
      "totalTokens": 116445,
      "cacheReadTokens": 115072,
      "cacheWriteTokens": 0
    }
  }
}
```

232 个输出 token 跑了 4.95 秒，一除就是 46.9 tok/s。几个关键认知：

- **实时性**：这个文件是对话推进时实时追加的（写这篇笔记时确认过，当前会话的 rollout 文件 mtime 跟着每轮回答刷新），尾部跟随即可实时感知；
- **粒度**：按「每次模型请求」一行——一轮带工具调用的回答会有多行，单行是单次流式的速度，按 `turnId` 聚合是整轮平均；
- **outputTokens 含推理部分**：rollout 里没有单独的 reasoning 拆分（拆分字段只存在于被脱敏的日志里）；
- 桌面版和 CLI 会话都写这个目录；如果安装时改过 `dataBaseDir`，用脚本的 `--dir` 参数指过去即可。

### 方案 A：外挂实时速度计（主推，已实测）

原理很简单：watch rollout 目录，只读新增行，算一个打一个。完整脚本：

```python
#!/usr/bin/env python3
"""zcode_tps.py — ZCode 实时 token 速度计（旁路读取 rollout 落盘记录，不侵入 ZCode）

用法：python zcode_tps.py [--dir <rollout目录>]
默认 rollout 目录：~/.zcode/cli/rollout
"""
import argparse
import glob
import json
import os
import sys
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def handle(line):
    try:
        d = json.loads(line)
    except json.JSONDecodeError:
        return
    if d.get("type") != "model_io":
        return
    usage = (d.get("response") or {}).get("usage") or {}
    out_tok = usage.get("outputTokens") or 0
    dur_s = (d.get("durationMs") or 0) / 1000
    if not out_tok or dur_s <= 0:
        return
    m = d.get("model") or {}
    name = m.get("modelId", "?") + (f"/{m['variant']}" if m.get("variant") else "")
    sid = (d.get("sessionId") or "no-session").replace("sess_", "")[:8]
    print(
        f"[{time.strftime('%H:%M:%S')}] {name:<16} {sid:<9}"
        f" {out_tok:>6} tok / {dur_s:>6.1f}s = {out_tok / dur_s:>6.1f} tok/s"
        f"  (in={usage.get('inputTokens', 0)}, cache_read={usage.get('cacheReadTokens', 0)})",
        flush=True,
    )


def main():
    ap = argparse.ArgumentParser(description="ZCode realtime token speed meter")
    ap.add_argument("--dir", default=os.path.join(os.path.expanduser("~"), ".zcode", "cli", "rollout"))
    args = ap.parse_args()

    if not os.path.isdir(args.dir):
        print(f"rollout 目录不存在: {args.dir}", file=sys.stderr)
        sys.exit(1)
    print(f"watching {args.dir}  (Ctrl+C 退出，只显示启动之后的新请求)", flush=True)

    offsets = {}
    while True:
        for path in glob.glob(os.path.join(args.dir, "model-io-*.jsonl")):
            try:
                size = os.path.getsize(path)
                off = offsets.get(path, size)  # 首次见到的文件从末尾开始，只看新增
                if size < off:
                    off = 0  # 文件被截断/轮转则从头读
                with open(path, encoding="utf-8") as f:
                    f.seek(off)
                    for line in f:
                        handle(line)
                    offsets[path] = f.tell()
            except OSError:
                pass
        time.sleep(1)


if __name__ == "__main__":
    main()
```

**安装**：把脚本存到任意目录（本文统一用 `~/zcode-tps/` 指代这个目录），终端里 `python zcode_tps.py` 常驻即可。想开机自启就丢进计划任务或用 Windows Terminal 固定一个标签页。

**实测输出**（挂上之后我继续跟 ZCode 对话，下面这行就是当时那一轮的真实数据）：

```text
watching ~/.zcode/cli/rollout  (Ctrl+C 退出，只显示启动之后的新请求)
[15:55:24] GLM-5.3/max      bc1a5d58      48 tok /    2.4s =   19.9 tok/s  (in=138870, cache_read=137664)
```

注意看 `cache_read=137664 / in=138870`——99% 缓存命中，输入侧几乎不计费；速度计顺带把上下文健康度也暴露出来了。

### 方案 B：Stop hook，接入 ZCode 页面（进阶，已实测）

方案 A 的显示位置在 ZCode 外面。想「页面内」显示，就要用 hooks 体系里唯一的用户可见通道：`Stop` 事件 + `systemMessage` 输出。

**先解决可行性疑虑**：ZCode 文档没写 `systemMessage`，但 ZCode 的 hook 输出协议解析代码就在程序包 `resources/glm/zcode.cjs` 里，反编译出的输出 schema 是这样的：

```text
{
  additionalContext, additional_context, continue,
  decision: enum["approve", "block"],
  hookSpecificOutput,   // 按事件判别：Stop 变体还收 additionalContext
  reason, stopReason,
  suppressOutput,
  systemMessage         // ← 顶层一等进行字段，与 Claude Code 同款
}
```

`systemMessage` 与 `decision`、`suppressOutput` 并列，是 hook 输出的一等字段——代码级确认 ZCode 实现了 Claude 风格的输出协议，这也为上一节「四层兼容」的第 4 层提供了最直接的证据。

#### 端到端实测：链路全通，显示缺席

光看代码还不够，装机实测（2026-09-11，Windows 桌面版 + GLM-5.3 max 档）。过程本身有点意思——我是用 ZCode 自己的 Computer Use 能力驱动它的界面完成的测试，让 agent 测自己的宿主：

1. hook 配置写入 `~/.zcode/cli/config.json`（先备份原文件）；
2. `Ctrl+N` 新开会话——hooks 配置在会话启动时快照，老会话不生效，新会话正好是干净的测试环境；
3. 问「1+1等于几？只回答数字」→ 回答「2」（界面显示 Worked for 3s）；再问「3+3等于几」→「6」（Worked for 2s）。

证据分三层看：

| 层 | 结果 | 证据 |
| --- | --- | --- |
| **触发层** | ✅ 每轮都触发 | `hook-fired.log` 两问各有两条：`16:06:37 hook fired: event=Stop sid=sess_772372f…` + `emit: GLM-5.3/max 本轮 39 tok / 3.6s ≈ 10.9 tok/s（2 次请求合计）`；第二问 `16:09:51` 同样触发，`26 tok / 1.7s ≈ 15.0 tok/s`（对照：装机前的离线干跑记录里 `event=-`，真实触发的才带 `event=Stop`） |
| **UI 层** | ✅ 执行可见 | 每条回答的消息操作栏出现 **Hooks** 标记，与消息一一挂钩；展开面板显示 `Stop · User · 158ms`——158ms 与脚本实际运行耗时吻合，说明 ZCode 真实执行了进程并计时 |
| **显示层** | ❌ 文本不渲染 | 回答结束后 15 秒内的截图（视觉模型复核）无 toast、无速度文字；Hooks 面板展开状态的视觉检查也只有 `Stop · User · 158ms`，没有 systemMessage 的内容 |

结论：**协议收下了 `systemMessage` 字段、hook 的执行在 UI 上可见，但当前版本桌面端不把消息文本渲染出来**。速度数字的实际出口是脚本自写的 `hook-fired.log`（或方案 A 的终端）。另一个顺手的观察：连「一问一答」这种最小轮次在 rollout 里也是 2 次模型请求（26~39 tok），数据粒度比 UI 呈现的细得多。

**hook 脚本**（与方案 A 读同一数据源，按 `turnId` 聚合本轮全部请求）：

```python
#!/usr/bin/env python3
"""ZCode Stop hook：每轮回答结束时读取本轮 rollout 记录，计算 token 速度。
输出两路：stdout 回 systemMessage（协议字段，实测当前桌面版不渲染），
同目录 hook-fired.log 追加触发记录与数字（实测最可靠的可见输出）。
注意：必须以退出码 0 结束，且不能输出 decision/block——
Stop hook 的阻断语义会让主模型再跑一轮（最多连续 3 次），这里只要展示不要阻断。
"""
import glob
import json
import os
import sys
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

TAIL_BYTES = 20 * 1024 * 1024  # 会话文件超大时只读末尾 20MB，避免解析超时

DEBUG_LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hook-fired.log")


def debug(msg):
    try:
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        with open(DEBUG_LOG, "a", encoding="utf-8") as f:
            f.write(ts + " " + msg + chr(10))
    except OSError:
        pass


def load_records(path):
    """流式读取 model-io 记录，只保留聚合所需的小字段。"""
    recs = []
    size = os.path.getsize(path)
    with open(path, "rb") as f:
        if size > TAIL_BYTES:
            f.seek(size - TAIL_BYTES)
            f.readline()  # 丢弃被截断的半行
        for raw in f:
            try:
                d = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if d.get("type") != "model_io":
                continue
            usage = (d.get("response") or {}).get("usage") or {}
            recs.append({
                "turnId": d.get("turnId"),
                "out": usage.get("outputTokens") or 0,
                "dur": d.get("durationMs") or 0,
                "model": d.get("model") or {},
            })
    return recs


def main():
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except json.JSONDecodeError:
        payload = {}
    sid = payload.get("session_id") or payload.get("sessionId") or ""
    debug("hook fired: event=%s sid=%s" % (payload.get("hook_event_name") or "-", sid or "-"))
    roll = os.path.join(os.path.expanduser("~"), ".zcode", "cli", "rollout")

    # 优先当前会话的 rollout 文件；拿不到 session_id 就退回最新修改的
    paths = glob.glob(os.path.join(roll, f"model-io-{sid}.jsonl"))
    if not paths:
        cand = [p for p in glob.glob(os.path.join(roll, "model-io-*.jsonl"))
                if "no-session" not in os.path.basename(p)]
        if cand:
            paths = [max(cand, key=os.path.getmtime)]

    recs = []
    if paths:
        try:
            recs = load_records(paths[0])
        except OSError:
            pass
    if not recs:
        debug("no records found (paths=%s)" % (paths or "none"))
        sys.exit(0)

    # 按 turnId 聚合本轮所有模型请求（带工具调用的回答会有多次请求）
    last = recs[-1]
    turn = last["turnId"]
    turn_recs = [r for r in recs if turn and r["turnId"] == turn] or [last]
    out_tok = sum(r["out"] for r in turn_recs)
    dur_s = sum(r["dur"] for r in turn_recs) / 1000

    m = last["model"]
    name = m.get("modelId", "?") + (f"/{m['variant']}" if m.get("variant") else "")
    if out_tok and dur_s > 0:
        n = len(turn_recs)
        msg = f"{name} 本轮 {out_tok} tok / {dur_s:.1f}s ≈ {out_tok / dur_s:.1f} tok/s"
        if n > 1:
            msg += f"（{n} 次请求合计）"
        debug("emit: " + msg)
        print(json.dumps({"systemMessage": msg}, ensure_ascii=False))
    sys.exit(0)


if __name__ == "__main__":
    main()
```

**安装**（ZCode 的 hooks 配置在 session 启动时形成快照，改完必须**新开会话**才生效）：

1. 把脚本存到固定位置（如 `~/zcode-tps/zcode_tps_hook.py`，和方案 A 放同一目录即可）；
2. 打开 `~/.zcode/cli/config.json`，加入顶层 `hooks` 字段（和已有的 `model`、`plugins` 平级）：

```json
"hooks": {
  "enabled": true,
  "events": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "process",
            "command": "python",
            "args": ["<脚本绝对路径，如 C:/zcode-tps/zcode_tps_hook.py>"],
            "timeoutMs": 5000
          }
        ]
      }
    ]
  }
}
```

3. 新开一个 ZCode 会话，随便问一句。实测表现：回答结束后该消息的操作栏出现 **Hooks** 标记，展开可见 `Stop · User · 158ms`（hook 真实执行、耗时一目了然）；速度数字在脚本同目录的 `hook-fired.log` 里，每轮两行——触发记录加 emit 数字；
4. 卸载就是把这段 `hooks` 字段删掉。

几个注意点：`type: "process"` 不经 shell，Windows 上 `command` 写 `python` 依赖 PATH，不稳就换成绝对路径（`where python` 查）；`args` 里把占位符换成自己的脚本绝对路径，JSON 中 Windows 反斜杠要双写（`\\`），建议直接用正斜杠 `/` 省事；`hooks.enabled` 是全局开关；hook 脚本**退出码必须是 0**，也**不要**返回 `decision: "block"`——Stop 的阻断语义是「让主模型继续干活」，用它来显示消息会把模型逼得停不下来。想确认 hook 到底跑没跑、数字是多少：看消息操作栏的 Hooks 标记（执行记录）或 `hook-fired.log`（数字）——systemMessage 当前不渲染，别傻等页面上弹提示。

### 边界与坑

- **流式进行中拿不到精确 token 数**：usage 只随响应完成的落盘记录出现，回答输出到一半时最多用日志里的 `textDeltaChars` 字符数估个大概；「实时」的含义是「每次响应完成即报」，不是逐 token 刷新；
- **一轮 ≠ 一次请求**：带工具调用的回答是一次次模型请求串起来的，速度计的每行是单次流式速度，整轮均值要用 `turnId` 聚合（hook 脚本里已做）；
- **编码**：Windows 下 Python 输出中文/符号记得 `sys.stdout.reconfigure(encoding="utf-8")`，否则重定向到文件时可能按 GBK 编码炸掉；
- **大文件**：长会话的 rollout 文件会到几十 MB（每行带完整请求上下文），hook 里做了「超过 20MB 只读尾部」的保护；正常情况下 9.5MB 的文件 0.2 秒内解析完，不用担心超时；
- **隐私**：rollout 文件里是明文的完整请求/响应正文（包括你的代码上下文），日志才是脱敏的那个——别把 rollout 目录随手发给别人。

### 实测数字参考

本机（GLM Coding Plan，GLM-5.3 max 档）两类典型场景：短平快的一次性回答约 **20 tok/s**（大量输入走缓存，`in=138870, cache_read=137664` 这种），长链路多工具调用的整轮平均约 **65 tok/s**（15043 tok / 231s / 3 次请求合计）。数量级供参考，具体看档位和网络。

## 实用建议：什么时候不需要插件

调研完最实用的认知反而是这个：**如果目的只是「让 AI 按固定流程干活」，不需要做插件**。技能有更轻的投放位置——项目级 `.zcode/skills/`（比如本博客仓库的 add-blog-post、repost-article 两个 skill 就在这）和跨工具的 `~/.agents/skills/`（HyperFrames 的 skill 就在那，Claude Code 系工具都能读）。插件的真正增量在：斜杠命令的参数化入口、hooks 对工具调用的拦截与改写、捆绑 MCP 服务器、跨项目跨机器的打包分发——实战篇的 Token 速度计就是 hooks 增量的一个非典型样本：不拦截工具，而是借 `Stop` 时机读旁路数据。

官方建议的起步路径也很务实：先写纯技能插件跑通安装，再加命令，再加 hooks，最后才是 MCP。范例都在本机缓存里：skill-creator（最简）、computer-use（内联 stdio MCP）、document-skills（agents + http MCP 的完全体）。

## 参考资料

- [Plugin | ZCode 官方文档](https://zcode.z.ai/cn/docs/plugin)
- [Hooks | ZCode 官方文档](https://zcode.z.ai/cn/docs/hooks)
- [使用统计 | ZCode 官方文档](https://zcode.z.ai/cn/docs/usage-stats)（确认原生最细按天粒度）
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
- [Claude Code Hooks](https://code.claude.com/docs/en/hooks)
- [zai-org/zcode-plugins — ZCode 官方插件市场仓库](https://github.com/zai-org/zcode-plugins)
- [anthropics/claude-plugins-official — Claude 官方插件市场](https://github.com/anthropics/claude-plugins-official)
- [stormzhang/token-tracker](https://github.com/stormzhang/token-tracker)（Claude Code/Codex 的同类方案，伪 statusline 思路参考）
