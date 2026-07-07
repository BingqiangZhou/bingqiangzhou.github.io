---
title: 【工具分享】在云服务器上用 OpenCode 做 App：一份从零到上线的实操指南（兼 Coding Agent 横评）
published: 2026-07-07
description: '把 OpenCode 部署到云服务器 + tmux，做成一个 7×24 小时不下班的 AI 工位：从底座（服务器/SSH/tmux）、装 OpenCode 配模型，到用一个 URL 短链服务走完从零到上线的完整流程，再附手机/异地监控玩法，以及终端 CLI/IDE/托管/国产四类主流 Coding Agent 横评与按场景的选型建议。'
lang: zh
tags: [工具分享]
abbrlink: opencode-on-cloud-server
---

上一篇《告别 Claude Code》结尾，我留了个坑：**等我把 OpenCode 也试完，再来交一份对比报告。** 这篇就是来填坑的——但比原计划多走了一步。

我不只是把 OpenCode 装上跑了两下，而是按自己最常用的工作方式把它**搬上了云服务器**：在一台远端机器上开一个持久会话，让 Agent 帮我从零做一个完整的小应用，SSH 断了也不影响它干活，出门用手机也能接着盯。这篇就讲清楚两件事：

1. **怎么在云服务器上用 OpenCode 作为一个 Agent，把一个应用从零做到能跑。**
2. **除了 OpenCode，还有没有更好的选择？**（我把当下主流的 Coding Agent 横向过了一遍，给了选型建议。）

老规矩，这篇文章本身也是我在云服务器上、开着 tmux、用 Agent 辅助写出来的——既是记录，也是一次实测。

## 一、为什么要把 Agent 搬上云服务器

先说动机。很多人用 Coding Agent 是装在自己笔记本上，开个终端，干一会儿关掉。这没问题，但有几个场景会让你特别想把 Agent 放到"一台一直开着的远端机器"上：

- **长任务不想被笔记本绑死。** Agent 跑一次重构、一次大改，可能要几十分钟甚至几小时。你总不能为了等它把电脑一直开着、终端一直亮着。
- **出门在外想接着干。** 在地铁上、在咖啡店、甚至躺在床上，想看一眼 Agent 干到哪了、回它两句话——只要它在一台有公网的机器上，手机就能接上。
- **环境统一、可复现。** 本地装一堆依赖、配一堆 key，换台电脑就得重来。云服务器上是固定一套环境，配一次用很久。
- **多人协作 / 多 Agent 并行。** 你和合伙人，或者你同时开几个 Agent 干不同的活，都需要一个"固定的工位"。

一句话：**把 Agent 搬上云服务器，本质是给 AI 找了一个 7×24 小时不下班的工位。** 你随时可以过去看它、指挥它，但它不会因为你关电脑就停工。

## 二、底座：一台云服务器 + SSH + tmux

这一节是整件事的物理基础，也是最关键、却最容易被忽略的一环。

### 1. 一台云服务器

任何一台你能 SSH 上去的机器都行：阿里云/腾讯云/华为云的轻量服务器、AWS EC2、DigitalOcean Droplet、甚至你家一台开着的小主机（用内网穿透）。配置不用太高——Agent 的"思考"发生在模型那边（云端 API 或本地大模型），你这台服务器主要干的是**编辑文件 + 跑命令 + 持有会话**，2 核 4G 足够起步，磁盘给够装依赖和放代码就行。

选地域只有一个原则：**到你要用的模型 API 网络越近越好。** 用国产 API（智谱、阿里、深度求索）就选国内地域；用海外 API 就选香港/新加坡/美西。Agent 跟模型之间一个来回几百毫秒的差别，长任务累积起来体感差很多。

### 2. SSH 进去

这个不用多讲，`ssh user@your-server`。建议配好 SSH key 免密登录，再配个 `~/.ssh/config` 给它起个别名（比如 `ssh app`），省得每次敲长命令。

唯一要强调的一点：**配好一个顺手的终端复用机制再开始干活**——这就引出了下面的主角。

### 3. tmux：AI Agent 的事实标准运行时

这是整套方案里最不显眼、但最重要的一环。

为什么是 tmux？因为几乎所有 Coding Agent（OpenCode、Claude Code、Codex CLI……）本质上都是**交互式进程**——它读你的标准输入、往标准输出打印，一旦它所在的终端被关掉、SSH 连接断开，这个进程就被 SIGHUP 信号杀掉了，正在干的一半活儿就没了。

**tmux 解决的就是"终端关了，进程不死"。** 它在你这台服务器上维护一个（或多个）持久的伪终端（PTY），你 SSH 进去 `tmux attach` 接上它，断开时 `detach`（或者干脆直接关掉 SSH 窗口），里面的进程完全无感，接着跑。下次再 attach 回来，Agent 还在那个状态等你。

社区里已经有人把这件事讲得很透：**"tmux 成了 AI Agent 团队的事实运行时"**——当一个 Agent 读 stdin、写 stdout 时，tmux 提供了它需要的那个持久环境。

下面是一份"够用就好"的最小配置，写到服务器的 `~/.tmux.conf`：

```bash
# 让前缀键好按一点（默认 Ctrl+b 太别扭，改成 Ctrl+a）
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# 鼠标能用（滚屏、切窗口）
set -g mouse on

# 窗口编号从 1 开始（0 太远了）
set -g base-index 1
setw -g pane-base-index 1

# 关掉窗口后自动重排编号
set -g renumber-windows on

# 状态栏显示当前窗口和时间，方便盯着
set -g status-interval 5
set -g status-left '#[fg=green,bold][#S] '
set -g status-right '#[fg=cyan]%Y-%m-%d %H:%M'
```

日常就那么几条命令，肌肉记忆很快：

```bash
tmux new -s app           # 建一个名叫 app 的会话
tmux ls                   # 看有哪些会话
tmux attach -t app        # 接回去（简称 tmux a -t app）

# 在会话里：
Ctrl+a d                  # 脱离（detach），进程继续跑
Ctrl+a c                  # 新建窗口
Ctrl+a 数字              # 切到第 N 个窗口
Ctrl+a %   / Ctrl+a "     # 左右 / 上下分屏
```

**记住这个心智模型：tmux 会话 = 一个不会关机的工位，窗口/分屏 = 工位上几块屏幕。** Agent 在一块屏幕上干活，你在另一块屏幕上跑测试、看日志，互不打扰，SSH 断了全都不影响。

## 三、装上 OpenCode，配好模型

底座有了，现在把 Agent 请上来。

### 1. 安装

OpenCode 是开源（MIT 协议）、终端原生的 Coding Agent，模型无关——这是它最大的卖点。官方推荐的安装方式（以官方文档为准，版本迭代可能调整）：

```bash
# 方式一：官方安装脚本（推荐）
curl -fsSL https://opencode.ai/install | bash

# 方式二：npm（适合已经装了 Node 的环境）
npm install -g opencode-ai
```

装完 `opencode --version` 能出版本号就行了。它除了终端 TUI，也有桌面端和 IDE 插件，但**在云服务器这个场景下，你要的就是终端版**——因为你要在 tmux 里跑它。

### 2. 配置模型（带自己的 Key）

OpenCode 不绑定任何一家厂商，模型你自己选、Key 自己填。最常见三条路：

**① 直连商用 API。** 在项目根目录或家目录建一个 `opencode.json`（或用它的 `auth login` 交互命令），填上你要用的那家。比如：

```json
{
  "provider": {
    "anthropic": { "apiKey": "{env:ANTHROPIC_API_KEY}" },
    "openai":    { "apiKey": "{env:OPENAI_API_KEY}" },
    "glm":       { "apiKey": "{env:GLM_API_KEY}", "baseURL": "https://open.bigmodel.cn/api/paas/v4" }
  }
}
```

Key 走环境变量（`{env:XXX}`）而不是明文写进文件，这是基本卫生习惯——尤其你的配置可能会跟着 git 仓库走。在 shell 里 `export ANTHROPIC_API_KEY=...`，或者更省心地写进 `~/.bashrc` / 用专门的密钥管理工具。

**② 接兼容端点（中转 / 自建网关）。** 这是国内用户最常用的玩法：你不直接连 Anthropic/OpenAI，而是接一个兼容 OpenAI 或 Anthropic 协议的中转/聚合服务，只改 `baseURL`，模型名换成它支持的。这样既能用上 Claude/GPT 级别的模型，又绕开直连的网络和地区问题。

**③ 本地模型（Ollama / 自部署）。** OpenCode 支持 Ollama，意味着你可以挂一个本地开源模型（Qwen、DeepSeek、GLM 等），完全离线、完全可控、零 API 费用——代价是质量取决于你机器能跑多大的模型。云服务器上如果有张还行的卡，这条路性价比极高；没有卡的话，还是老老实实走 API。

### 3. 第一次跑通

进到你的项目目录，敲：

```bash
opencode
```

进 TUI，选个模型，说句话（比如"看一下这个项目的结构，告诉我它是干嘛的"），它能读文件、回你话，就说明通了。

OpenCode 有几个值得知道的能力：
- **Agent 切换**：它内置了不同的 agent（比如一个 "plan agent" 专门做分析、不动代码；一个干活的主 agent）。规划时用前者，执行时用后者，能减少瞎改。
- **Skill / MCP**：可以挂自定义技能和 MCP 服务（接数据库、接浏览器、接你自己的工具），把它的"手脚"伸长。
- **LSP 集成**：它对接语言服务器，跳转、补全、诊断比纯文本 agent 更准。

## 四、用 OpenCode 在云服务器上做一个完整应用

下面是真正的实战。我以"做一个简单的 URL 短链服务"为例（你可换成任何小应用），展示在云服务器上用 Agent 从零做到能跑的完整流程。

### 第 0 步：规划好你的 tmux 工位

```bash
tmux new -s app
# 窗口 1：Agent（OpenCode）
Ctrl+a c   # 窗口 2：跑应用 / 看日志
Ctrl+a c   # 窗口 3：跑测试 / git 操作
```

三个窗口各司其职：左边让 Agent 专心改代码，中间盯着应用起没起来、报错没有，右边做版本管理和验证。**SSH 一断，三块屏幕的状态全部保留**——这是云服务器这套方案相比"本地开三个终端窗口"最大的优势。

### 第 1 步：让 Agent 搭脚手架

切到窗口 1，在项目目录启动 OpenCode，先把需求讲清楚：

> 用 Go 写一个 URL 短链服务。需求：POST `/shorten` 接收长链返回短码；GET `/:code` 跳转原链；短链存 SQLite。给我建好项目结构、写好主程序、加一个最简的 README。

让 Agent 先用 plan agent 规划（只读不改），看它列的步骤靠谱再让它动手。**这一步的关键是：别一上来就让它"全部搞定"，先要个方案，确认了再放它写代码。** Agent 的方案里如果技术选型你不满意（比如它选了你不熟的网络框架），现在就让它换，比写完再改便宜得多。

### 第 2 步：增量加功能，每步都能跑

脚手架能 `go run` 起来之后，再一轮一轮加：

> 加上访问计数：每次跳转 +1，加个 GET `/stats/:code` 查某条短链的总点击数。

> 加上简单的速率限制：同一个 IP 对 `/shorten` 每分钟最多 10 次。

**原则：每次只让它干一件可验证的小事，干完立刻在窗口 2 跑起来、窗口 3 跑测试（或至少手动 curl 一遍）。** Agent 改坏了，你当场就知道是哪一步，`git diff` 看一眼，不对就 `git checkout` 回退或让它改。千万不要攒一大堆改动一起验——那是给自己挖坑。

这套"Agent 改 → 你验 → 通过就 commit"的循环，就是在云服务器上用 Agent 干活最稳的节奏。git 在这里不仅是版本管理，更是你的**回滚保险**：

```bash
# 窗口 3，每完成一个可验证的小步就：
git add -A && git commit -m "feat: 加访问计数"
```

### 第 3 步：调试——让 Agent 看自己的报错

应用报错了？**别自己琢磨，把报错直接喂给 Agent。** 在窗口 2 复制错误日志，切到窗口 1 粘给 OpenCode：

> 跑 `go run main.go` 报这个错：`<贴日志>`，帮我看看是哪的问题，改一下。

Agent 读自己的报错、定位、修，比你手动 grep 强不少。复杂 bug 它定位不准的时候，给它更多上下文（相关文件、你复现的步骤），它也能逐步收窄。

### 第 4 步：部署——服务就跑在同一台机器上

做到这一步，部署反而最简单：**你的开发机就是生产机。** 编译好二进制，用 systemd 起个服务长驻，或者干脆在 tmux 里 `go run`（开发期够用），再用 Nginx 反代一下 80/443。对外用域名 + HTTPS，对内 Agent 还能继续改它。

到这一步，你就完成了"在云服务器上用 OpenCode 把一个应用从零做到上线"的全闭环。

## 五、进阶：手机 / 异地监控你的 Agent

把 Agent 放上云服务器之后，最爽的体验是**人离开键盘，Agent 还在干**。怎么在不在电脑前的时候盯着它？社区里已经有一套成熟玩法：

- **最轻量：SSH + tmux，手机上用 Termux（安卓）或 Blink Shell（iOS）。** 手机就是个薄终端，attach 回去就能看到 Agent 实时在打什么、回它一句话。tmux 状态栏配好时间，你一眼就知道它卡没卡。
- **更顺手：挂一个 Telegram / 微信 bot 当"传话筒"。** 让 bot 监听 tmux 会话的输出（或者 Agent 的状态），有进展、有提问、报错了就推消息到你手机；你在聊天里回一句，bot 把命令塞回 tmux。社区里这类"用 Telegram 远程控 Claude Code/OpenCode"的方案已经很多。
- **多 Agent 编排：开多个 tmux 会话/窗口，每个跑一个 Agent 干不同的活。** 比如一个写后端、一个写前端、一个写测试。状态栏配好显示每个会话的当前状态，你像个车间主任一样来回巡。已经有团队在用这套"tmux 里的 Agent 团队"模式干真实的活。

这条路的天花板很高，但**别一上来就搞复杂**——先单 Agent + 单 tmux 会话跑顺，再加监控、再加多 Agent。

## 六、横评：除了 OpenCode，还有什么值得选？

回到第二个问题：**OpenCode 是最好的选择吗？** 我的答案是——**看你要什么。** OpenCode 在"开源 + 终端原生 + 模型无关"这条赛道上是目前的头号选手，但 Coding Agent 这片海里，没有一个工具能在所有维度上都赢。下面按形态分几类，给你我的判断（截至 2026 年中，基于公开实测和社区口碑，工具迭代很快，结论有时效）。

### A. 终端 CLI 类

| 工具 | 一句话判断 |
|---|---|
| **OpenCode** | 开源 MIT、终端原生、模型无关、Skill/MCP/LSP 全活。**想要"自主可控、不锁厂商"的首选。** 多家横评里它是开源 Coding Agent 里星标最高、口碑最稳的。短板：依赖你自备够强的模型，纯靠本地小模型体验会掉档。 |
| **Aider** | 开源老牌、git 友好（每次改动自动 commit）、对话式编辑。**适合喜欢"和 Agent 结对编程、每步留 git 痕迹"的人。** 短板：终端体验和生态不如 OpenCode 精致，更像一个"功能型工具"。 |
| **Claude Code** | 推理深度和代码质量公认第一梯队（SWE-bench 领先）。**能力天花板最高，但中国用户要谨慎**——上一篇文章详述过：官方不卖给中国、下载要翻两道墙、封号在收紧。能力强不等于用得安心。 |
| **Codex CLI（OpenAI）** | OpenAI 官方、绑 GPT 系模型，benchmark 表现强。**已经在用 OpenAI 生态、追求 benchmark 上限的人可以考虑。** 短板：厂商锁定、国内同样有访问门槛。 |

### B. IDE 集成类

| 工具 | 一句话判断 |
|---|---|
| **Cline** | 开源、VS Code 插件、MCP 生态丰富、可视化 diff。**喜欢"在 IDE 里看着 Agent 改每一行"的人的首选开源项。** 短板：绑 VS Code，云服务器纯终端场景不直接适用（除非用 code-server 之类的远程 IDE）。 |
| **Roo Code / Kilo Code** | Cline 的衍生/分叉，各自加了不同增强（多模式、更强定制）。**Cline 满足不了你时再看这几个。** |
| **Cursor** | 闭源、打磨最成熟的 AI IDE。**开箱即用体验最好，但闭源、订阅制、云端处理代码。** 云服务器远程 IDE 场景能用，但你要接受"代码上云到它那边"。 |

### C. 托管 / 平台类

| 工具 | 一句话判断 |
|---|---|
| **Goose（Block）** | 开源、强调 MCP 和工具集成、可跨终端和 IDE。**重 MCP 工具链、想搭"Agent + 一堆外部工具"的人可以看。** |
| **OpenHands（前 OpenDevin）** | 开源、定位"自主软件工程师"、能端到端跑任务。**适合想放手让 Agent 自己干完整任务、做实验的人。** 偏重，不如 CLI 类轻便。 |

### D. 国产（中国用户重点看）

| 工具 | 一句话判断 |
|---|---|
| **ZCode（智谱 Z.ai）** | 国产终端 ADE、底座 GLM 已开源、国内服务稳定。**中国用户求"装得上、用得稳、不被封"的现实选择。** 这篇和上篇都是用它辅助写的。短板：生态比开源圈小，长程复杂任务还在验证。 |
| **Qwen Code CLI（阿里）** | 基于 Gemini CLI 改的开源终端 Agent、挂通义系列模型。**已经在用阿里云/通义生态的人顺手。** |
| **GLM Coding Plan + 第三方终端** | 用智谱的编程套餐 + 你自己挑的终端（Crush 等）。**灵活性高，但配置心智成本也高。** |

## 七、我的选型建议（按场景）

横评看完容易晕，给你几条干脆的路线：

1. **你就想要开源、自主可控、不被任何厂商绑死** → **OpenCode**（终端原生场景）或 **Cline**（IDE 场景）。模型自备，谁好用挂谁。
2. **你要的是能力天花板，能接受厂商锁定** → **Claude Code**（推理最强）或 **Codex CLI**（benchmark 强）。但中国用户请把"访问稳定性"的权重拉满再决定。
3. **你是中国用户，第一优先级是"装得上、用得稳"** → **ZCode** 或 **Qwen Code**，国产服务在国内最稳；想要开源可控就 **OpenCode + 国产模型 API / 本地模型**。
4. **你要 IDE 里可视化、diff 看得清、MCP 工具丰富** → **Cline**（开源）或 **Cursor**（闭源但最顺滑）。
5. **你要团队多人 / 多 Agent 并行** → 一台云服务器 + **tmux**（每个 Agent 一个会话/用户），上面跑任意一个 CLI Agent；重工具链就考虑 **Goose**。
6. **你想放手让 Agent 端到端干完整任务、做实验** → **OpenHands**。

而**具体到"云服务器 + tmux"这个场景**，CLI 类是天然契合的——OpenCode、Aider、Claude Code、Codex CLI、ZCode、Qwen Code 都能直接塞进 tmux 跑。IDE 类（Cline/Cursor）需要 code-server 之类的远程 IDE 才舒服，多一层。

至于 OpenCode 本身是不是"最好的选择"——**在我"开源 + 终端 + 云服务器 + 不锁厂商"这几个约束同时成立时，它是目前我最愿意长期押注的那一个。** 但我不会把它当银弹：模型质量决定它的上限，你的 prompt 和验证节奏决定它的下限。

## 结尾

把这两篇连起来看，我的路线其实很清楚：

**从一个"对中国用户越来越不友好"的强工具（Claude Code）迁出来 → 落到一个国产稳用的过渡（ZCode）→ 再摸到一个开源自主可控的长期项（OpenCode）→ 把它部署到云服务器上，配 tmux，变成一个 7×24 小时不下班的 AI 工位。**

这套"云服务器 + tmux + 开源 Agent + 自备模型"的组合，给我的最大改变不是"AI 变强了"，而是**我干活的方式变了**：我不再需要坐在电脑前盯着它，它可以在我睡觉的时候接着干、在我出门的时候等我一句指令、在我不耐烦的时候把报错自己读了自己改。AI Agent 真正变成一个"同事"，是从你给它一个固定的工位开始的。

工具会一直迭代，OpenCode 今天的好用程度，半年后可能就被别的超越；但**"把 Agent 部署成一个持久服务、随时接入、人机协同"这套范式，我认为会留下来。** 越早把自己的工作流迁到这套范式上，越早享受到"AI 不再只是一个聊天框"的红利。

如果你也想试，别纠结选哪个工具最完美——**先开一台最便宜的云服务器，装上 tmux 和任意一个 CLI Agent，跑通一个最小应用。** 跑过一次，你就回不去了。

---

📌 **参考资料**（写作时主要参考了以下来源）：

- OpenCode 官方：[官网](https://opencode.ai/) · [文档](https://opencode.ai/docs/) · [Agents](https://opencode.ai/docs/agents/)
- tmux 作为 Agent 运行时：[How tmux Became the Runtime for AI Agent Teams (DEV)](https://dev.to/battyterm/how-tmux-became-the-runtime-for-ai-agent-teams-gmi) · [AI Coding Agents for Teams: Building a Managed Runtime (HackerNoon)](https://hackernoon.com/ai-coding-agers-for-teams-building-a-managed-runtime-not-just-more-tmux)
- 远程 / 手机监控 Agent：[Running AI Coding Agents From My Phone (itnext)](https://itnext.io/running-ai-coding-agents-from-my-phone-its-getting-out-of-hand-7149bcabd82f) · [My Claude Code Setup for Remote Development (Medium)](https://medium.com/coding-nexus/my-claude-code-setup-for-remote-development-15911f9679fc)
- Coding Agent 横评：[Claude Code Alternatives: 7 Tools Compared (DataCamp)](https://www.datacamp.com/blog/claude-code-alternatives) · [Best AI Coding Agent 2026 (MorphLLM)](https://www.morphllm.com/ai-coding-agent) · [Open-Source AI Coding Agents 2026: The Complete Comparison](https://wetheflyflywheel.com/en/guides/open-source-ai-coding-agents-2026/) · [Goose vs Cline vs Aider vs Claude Code vs OpenCode (2026)](https://mcp.directory/blog/goose-vs-cline-vs-aider-vs-claude-code-vs-opencode-2026)
- 国产 Agent：[ZCode 官网](https://zcode.z.ai/cn) · 上一篇《告别 Claude Code》
