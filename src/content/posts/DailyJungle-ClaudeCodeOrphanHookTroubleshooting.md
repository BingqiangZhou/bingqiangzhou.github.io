---
title: 【实践记录】谁往我的 settings.json 里塞了 hook？——一次 Claude Code "HTTP undefined" 报错的全程排查
published: 2026-11-11
description: 记录一次 Claude Code 每次工具调用都报 HTTP undefined 的完整排查：从读懂 hooks 报错语义、勘验 settings.json 与死端口，到 grep 二进制归因 CC Mate、开关实验验证孤儿 hook 的生命周期，最后备份清理并复盘全局配置的所有权问题。
tags: [实践记录, Claude Code]
---

在使用 Claude Code 时，发现每次工具调用前都会刷出几行报错：

```text
PreToolUse:Bash hook error
⎿  HTTP undefined from http://localhost:59948/claude_code/hooks
PreToolUse:Read hook error
⎿  HTTP undefined from http://localhost:59948/claude_code/hooks
```

`HTTP undefined` —— 连状态码都没有。我没有手动配置过任何 hook，这个 `localhost:59948` 是谁、在哪注册的？

这篇记录从这行报错出发的完整排查：怎么读懂报错、怎么定位到来源、怎么验证它的行为机制、最后怎么清理干净。每一步都是一条可复现的命令。

## 〇、先读懂报错

Claude Code 的 hooks 机制允许在 `~/.claude/settings.json` 里注册生命周期事件的钩子，其中 HTTP 型 hook 会把事件 JSON POST 到指定 URL。`PreToolUse` 在**每次工具调用前**触发；条目不写 matcher 就对所有工具生效 —— 这解释了报错为何无处不在（Bash、Read、Edit……每一个都响一声）。

而 `HTTP undefined` 的语义是：请求根本没建立连接，连状态码都不存在，才显示成 `undefined`。也就是说 —— **hook 指向的本地服务已经死了**。这种失败不拦截工具调用（hook 默认 `onFailure: continue`），纯是噪音，但每次工具调用都会刷屏。

问题于是变成两个：谁往 settings.json 里写了这个 hook？以及它指向的服务为什么不在了？

## 一、勘验现场

看 `~/.claude/settings.json` 的 `hooks` 块：

```bash
jq '.hooks' ~/.claude/settings.json
```

```json
{
  "Notification": [
    { "hooks": [{ "type": "http", "url": "http://localhost:59948/claude_code/hooks" }] }
  ],
  "PreToolUse": [
    { "hooks": [{ "type": "http", "url": "http://localhost:59948/claude_code/hooks" }] }
  ],
  "Stop": [
    { "hooks": [{ "type": "http", "url": "http://localhost:59948/claude_code/hooks" }] }
  ]
}
```

三个事实立刻浮出来：

1. **三条 HTTP 型 hook**，挂在 `Notification`、`PreToolUse`、`Stop` 三个事件上；
2. `PreToolUse` 条目**没有 matcher** —— 对所有工具调用生效；
3. 目标是 `localhost:59948`。

再看网络层：

```bash
lsof -nP -iTCP:59948 -sTCP:LISTEN
# （无输出：没有任何进程在监听这个端口）
```

端口死了。而 59948 落在临时端口区间（49152–65535）—— 这类端口通常是服务启动时随机分配的。结合文件 mtime（最后一次写入停在 15:33，此后再无更新），可以拼出画像：

> **某个本地应用每次启动时把自己监听的地址写进 settings.json，退出后地址就成了死链。**

现在问题变成：是哪个应用？

## 二、圈定嫌疑人

Claude Code 生态里，"注册本地 HTTP hook 做会话监控"是 GUI 编排/管理工具的典型做法。先按知名度排除：

```bash
ls -d ~/.vibe-kanban ~/.config/vibe-kanban ~/.crystal 2>/dev/null   # 无
ps aux | grep -iE "vibe|kanban" | grep -v grep                      # 无
grep -a -iE "vibe-kanban" ~/.zsh_history 2>/dev/null                # 无
```

vibe-kanban、Crystal 这些知名嫌疑人均无痕迹。再看全机监听端口和启动代理（LaunchAgents），也没有陌生服务。

换个思路 —— 直接清点 `/Applications`，按"会深度对接 Claude Code"过滤，锁定两个高嫌疑对象：**CC Mate.app** 和 ZCode.app。

## 三、二进制归因

hook 的 URL 路径 `claude_code/hooks` 是个特征字符串。往两个 app bundle 里直接搜：

```bash
grep -rl -a "claude_code/hooks" "/Applications/CC Mate.app"
# → /Applications/CC Mate.app/Contents/MacOS/cc-mate

grep -rl -a "claude_code/hooks" "/Applications/ZCode.app"
# （无输出）
```

命中。**CC Mate 的二进制里就写着这个路径。** 再核实身份：

```bash
defaults read "/Applications/CC Mate.app/Contents/Info.plist" CFBundleIdentifier
# org.randynamic.ccconfig（v0.4.4）
```

CC Mate（作者 djyde，randynamic.org/ccmate）是一个"GUI for Claude Code"：配置切换、MCP 管理、**用量分析**、通知。它要这三条 hook 干什么，正好对上：

| Hook 事件 | 收到什么 | 喂给哪个功能 |
|---|---|---|
| `PreToolUse`（无 matcher） | 每次工具调用的完整事件：`session_id`、transcript 路径、工具名、工具输入 | 实时活动流、触发用量统计刷新 |
| `Stop` | 每个 turn 结束信号 | 用量快照收尾、任务状态更新 |
| `Notification` | Claude Code 的提醒事件（等待权限等） | 它自己的通知功能 |

顺带一个隐私注脚：URL 是 `localhost`，事件数据只进它本机进程，不上网；但 app 运行期间，你每次工具调用的内容（含 Bash 命令原文）它都看得到 —— 这是所有此类监控型集成的固有代价。

到这里，"谁写的"定案。但还有一个疑点要验证：这些条目为什么在它退出后还留着 —— 是忘了删，还是删不掉？

## 四、观察它的完整生命周期

**实验一：重新打开 CC Mate（15:54:03 写入 settings.json）**

两个意外：

意外一：它**没有覆写旧条目，而是追加**。每个事件下多了一条带 `"__ccmate__": true` 标记的新条目 —— 像一枚所有权印章：

```json
"PreToolUse": [
  { "hooks": [{ "type": "http", "url": "http://localhost:59948/claude_code/hooks" }] },
  { "hooks": [{ "__ccmate__": true, "type": "http", "url": "http://localhost:59948/claude_code/hooks" }] }
]
```

于是每个事件挂了两份相同的 hook，每次工具调用会 POST 两次（重复上报，无功能影响）。

意外二：**端口没变**，还是 59948 —— `lsof` 确认 cc-mate 进程真的监听在这个端口上。再用一个无害的合成事件探测端点：

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 3 \
  -X POST http://localhost:59948/claude_code/hooks \
  -H 'Content-Type: application/json' \
  -d '{"hook_event_name":"PreToolUse","session_id":"probe","tool_name":"Bash","tool_input":{}}'
# → HTTP 422
```

422 = 服务端在线、只是拒绝了这个字段不全的假事件。接收服务活了，报错随之消失。

**实验二：正常退出（15:56:39 重写 settings.json）**

退出的瞬间它删掉了三条**带标记**的条目，而三条**无标记**的旧条目原样留守 —— 端口重新死亡，报错条件再次成立。

这正好和上游版本说明对上：CC Mate v0.4.4 的 release note 里明确写着 *"and auto-remove hooks on exit"*。它的清理逻辑只认领自己盖过章（`__ccmate__: true`）的条目；而旧版本（引入标记之前）写入的条目没有章，永远不会被认领 —— 一个典型的**所有权标记迁移缺口**。

结论：这不是"忘了删"，而是"删不掉" —— 无标记的旧条目每次开关循环都不会消失，成了永久孤儿。

## 五、清理

此时 `hooks` 块里只剩三条孤儿，别无他物，整键删除即为干净状态。备份 → 删 → 验证：

```bash
BAK=~/.claude/settings.json.ccmate-orphan-hooks.bak.$(date +%Y%m%d-%H%M%S)
cp ~/.claude/settings.json "$BAK"

jq 'del(.hooks)' "$BAK" > ~/.claude/.settings.tmp.$$ \
  && jq empty ~/.claude/.settings.tmp.$$ \
  && mv ~/.claude/.settings.tmp.$$ ~/.claude/settings.json

# 验证：除 hooks 外零变化
diff <(jq -S 'del(.hooks)' "$BAK") <(jq -S . ~/.claude/settings.json) && echo CLEAN
```

diff 为空，其余配置逐字节未动。一个小提醒：正在运行的 Claude Code 会话可能还缓存着旧 hook 配置，跑一次 `/hooks`（会重载）或重启会话即可。

## 复盘

### 时间线

| 时间 | 事件 |
|---|---|
| ≤15:33 | CC Mate 某次运行写入 3 条（无标记）hook，端口 59948；进程退出后未清理 |
| 15:34–15:47 | 排查：读懂报错 → 勘验配置/端口 → 圈定嫌疑 → 二进制归因 |
| 15:54:03 | 重开 CC Mate：追加 3 条带 `__ccmate__` 标记的条目（不覆写旧的）；端口复用 59948；报错消失 |
| 15:56:39 | 正常退出：自动删除带标记的 3 条；无标记的 3 条成为永久孤儿 |
| 16:00:08 | 手动清理：备份 + `jq 'del(.hooks)'`，diff 验证零副作用 |

### 方法论：每一步都可证伪

回头看，整条证据链没有任何一步靠猜：

```text
jq 读配置（发现现场）→ lsof 查端口（确认死链）
→ 排除已知工具（无痕迹）→ 清点 /Applications（缩小范围）
→ grep 二进制（字符串归因）→ 读上游 release note（印证机制）
→ 开/关实验（验证生命周期）→ 清理 + diff（闭环验证）
```

每一步一条命令、一个可证伪的结论。排查未知来源的配置污染时，这个顺序几乎可以复用。

### 生态思考：全局配置的所有权问题

`~/.claude/settings.json` 是一个**共享可变状态**：Claude Code 读它，一堆第三方工具写它。任何工具想在这里安家，都需要一套"所有权协议" —— CC Mate 的 `__ccmate__: true` 标记就是这样的协议，它的 v0.4.4 也确实补上了"退出自动清理"。缺的那半块是**迁移**：新版不认领旧版的无标记条目，孤儿就产生了。

给同类工具作者的两条建议：

1. **注册幂等**：写入前先按特征（比如 URL 前缀 `http://localhost:*/claude_code/hooks`）清掉同类旧条目，再写入自己的 —— 旧版本留下的任何形态都能被收敛；
2. **认领从宽**：清理时除了精确匹配自己的标记，也认领"长得就是我"的无主条目。

给用户的自查清单，四条命令：

```bash
# 1. 看看 settings.json 里挂了哪些 hooks
jq '.hooks' ~/.claude/settings.json

# 2. 看 hook 指向的端口有没有人监听（换成实际端口）
lsof -nP -iTCP:59948 -sTCP:LISTEN

# 3. 无害探测端点是否存活（有响应码 = 服务在线）
curl -s -o /dev/null -w "%{http_code}\n" --max-time 3 \
  -X POST http://localhost:59948/claude_code/hooks -d '{}'

# 4. 在 Claude Code 里打开 /hooks 面板，查看与管理所有已注册 hook
```

## 尾声

一行 `HTTP undefined` 的报错，背后是一个本地应用的端口生命周期、一份全局配置里的所有权协议，和一个经典的迁移缺口。CC Mate 本身是个用心的工具 —— "退出自动清理"也专门修过，只是迁移那半块还欠着。

下次你的 Claude Code 也刷出这种报错，先 `jq '.hooks'` 看看现场 —— 八成也有一条指向死端口的孤儿 hook。
