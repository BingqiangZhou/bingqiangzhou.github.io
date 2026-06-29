---
title: 【学习笔记】Claude Code vs Codex：Harness 设计的加法与减法
published: 2026-06-29
description: 精读 Claude Code v2.1.88 与 OpenAI Codex CLI 两份源码，用一张表提炼两者在 8 个维度的 harness 设计对比、一张选型清单、5 条可迁移准则，以及一句话核心结论。
lang: zh
tags: [学习笔记, Claude Code]
abbrlink: claude-code-vs-codex-harness
---

> 本篇是对 [《Claude Code 与 Codex Harness 设计对比：一种加法，一种减法》](https://openeuler.csdn.net/6a0c819c662f9a54cb75b816.html) 一文的总结性学习笔记。
>
> 原文把 Claude Code v2.1.88 与 OpenAI Codex CLI 两份源码并排拆解，发现两套看似做同一件事的 CLI agent，对 "harness" 这个词的理解几乎相反——一个做**加法**，一个做**减法**。这里略去代码细节，只把八个维度的核心对比、选型清单和可迁移准则提炼出来，方便日后回看。

---

## 1. 核心结论：一种加法，一种减法

先放最关键的一句话：

> **Harness 承担不变量，模型承担决策。**

两边的 README 都在说 "agent harness"，但落地路径完全相反：

- **Claude Code（v2.1.88，约 1900 个 TS 文件 / 512K+ 行）** 把 harness 写成一个庞大的状态机：要不要并发、要不要压缩、要不要重试，全部由 harness **代模型决策**，类型上把每一条恢复路径都钉死。这是**加法**——把不变量编进 TS 类型、元数据、AST 解析、三态权限。
- **Codex CLI（`codex-rs/`，Rust 多 crate workspace）** 则把 agent loop 写成一个朴素的 `loop {}`，把绝大部分安全保证甩给操作系统的 Landlock / Seatbelt / Seccomp，编译成一个二进制跑遍三大平台。这是**减法**——把不变量压到 OS syscall 和几个紧致的 enum 上。

**战术上完全相反，战略上惊人一致**：两边都明白调哪个 LLM 不是产品力，harness 才是；都把每个关键决策点的 "为什么" 写成枚举或常量让人能 grep；都用 fail-closed 默认值兜底。

---

## 2. 八个维度对比速览

下面这张表是整篇文章的骨架。每一行对应一个维度：左边是 Claude Code 的做法，右边是 Codex 的做法，最后一列是我提炼的启示。

| 维度 | Claude Code（加法） | Codex（减法） | 启示 |
| --- | --- | --- | --- |
| **技术栈** | TS/Bun 单仓，1900 文件；改代码不编译，hook/skill/plugin 用 Markdown 热加载 | Rust workspace，30+ crate 按职责切分；单二进制可跑在无 Node 的服务器 | 动态语言换来轻量扩展生态，静态语言换来单二进制部署，折中点不同 |
| **主循环** | 状态机：返回 10 种 `Terminal` 退出原因 + 7 种 `transition.reason` 继续原因，每条恢复路径都命名 | 朴素 `loop {}` + `break`，只有 4 种 `TurnAbortReason`，恢复靠指数退避 + 传输降级 | 能用枚举表达的退出/继续原因就别用字符串日志；起步先抄朴素 loop，踩坑再加 enum |
| **工具系统** | metadata 驱动：每个工具按输入判定 `isConcurrencySafe/isReadOnly/isDestructive`，默认全 fail-closed，连续 safe 的打成并发批 | 锁驱动：工具只声明 `supports_parallel`，靠一个 `RwLock`（读锁并行 / 写锁串行） | 信 OS 选极简锁，信应用层选细粒度元数据；默认值必须偏保守 |
| **上下文压缩** | 5 层漏斗（截断 → 去重 → 折叠 → LLM 摘要 → 兜底），免费手段在前贵的在后，配 `MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES=3` 熔断 | 单层 LLM 摘要，但区分 3 种触发阶段 + 3 种执行位置 + Pre/Post Hook | 5 层漏斗只有 fleet 规模才划算；压缩最容易踩的坑是 "没有熔断" |
| **权限 / Sandbox** | 应用层四关：deny 过滤 + Bash AST 解析 + 三态权限 + Haiku 旁路分级；能识别 `rm -rf /` 的语义危险 | OS 内核：Linux Landlock+Seccomp+bubblewrap / macOS Seatbelt / Windows ACL+WFP，syscall 级拦死 | 只选一种先选 OS sandbox；AST 靠黑名单永远跟不上手段更新 |
| **子 Agent** | 产品形态：7 种 `TaskType`，UI 可呈现 "这是 Explore/Plan"，靠 `CacheSafeParams` 共享父 prompt cache | 内核能力：`spawn_agent/wait_agent/close_agent` 当工具暴露，模型自己编排，带 inter-agent 邮箱 | 核心问题是 "暴露给模型的是产品语义还是内核原语"，二者皆可，中间态是陷阱 |
| **扩展机制** | 27 种 Hook + Skill 懒加载 + Plugin 打包；`PreToolUse` 能改命（改参数、阻止执行） | 几乎没有 Hook，所有扩展走 MCP 一条 wire（`mcp-server` + `rmcp-client` 双向 JSON-RPC） | 面向开发者社区选多形态扩展，面向企业集成选 "全走 MCP" 更省心 |
| **跨端 / 可观测性** | 进程内多端共享主循环，靠可选回调区分 REPL/SDK/Bridge；成本侧拼命对齐 cache 字段 | 单二进制多 mode + 跨语言 SDK，靠 `SessionSource` 枚举 + JSON-RPC daemon；成本侧把 "压缩在哪跑" 做成枚举 | 都把 "主循环别 `if mode=='X'`" 做到了；成本和可观测性是一体两面 |

几个值得单独记一笔的细节：

- 那些 "奇怪的常量" 都是**事故的化石**。`MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3` 背后是某天统计到上千个 session 各跑了几十上百次失败的 autocompact，全 fleet 一天烧掉约 25 万次 API 调用；`PARSE_TIMEOUT_MS = 50` / `MAX_NODES = 50_000` 是给对抗输入留的逃生口。这种经验在官方文档里学不到，只能从源码注释里挖。
- Claude Code 把子 agent 上下文里 5 个字段做到**字节级一致**才能命中父的 prompt cache（cache read 价格约为 write 的 10%）；`thinking budget` 改一个数字 cache 就全失效。这是 fleet 规模下真金白银的优化。

---

## 3. 一张选型清单：你在做什么，抄哪边

把八个维度的差异收成一张可执行清单，按项目场景定位：

| 你在做的事 | 推荐抄的部分 |
| --- | --- |
| 个人 / 小团队的 coding 助手 | Codex 的朴素 `loop {}` + `TurnAbortReason`，等坑出来再升 enum |
| 自托管的企业 agent SaaS | Claude Code 的 `Terminal.reason` + `transition.reason`，一开始就让运维能按 reason 分桶 |
| 服务端无人值守 agent（无本地 OS） | Codex 的 OS sandbox 三件套，只信内核别信应用层 |
| 桌面 dev tool（开发者自愿安装） | Claude Code 的 Bash AST + 三态权限，UX 上能一键 always allow |
| 多 LLM 任务编排框架 | Codex 的 `spawn_agent` 内核能力，把策略留给上层 |
| 面向终端用户的产品化 agent | Claude Code 的 7 种 `TaskType` + sidechain transcript，让 UI 能呈现任务类型 |
| 上下文压缩第一版 | Codex 的单层 LLM 摘要 + Pre/Post hook，先把生命周期插槽留好 |
| 上下文压缩 fleet 优化 | Claude Code 的 5 层漏斗，免费手段优先，务必加熔断 |
| 多语言 SDK / IDE 集成 | Codex 的 `app-server-protocol` JSON-RPC + Rust 单二进制 |
| 富 Markdown 扩展生态 | Claude Code 的 27 个 hook + 懒加载 skill + plugin 打包 |
| 双向 MCP 集成 | Codex 的 `mcp-server` + `rmcp-client` 双 crate 拆法 |

---

## 4. 五条可迁移准则（按项目阶段排序）

把两份源码的共识层提炼成 5 条，越靠前越是 day 1 就该做的：

1. **【Day 1】fail-closed 默认值贯穿一切。** 新增一类工具或能力时，默认值必须偏向保守那一侧。Claude Code 的工具元数据默认全部 "不并发 / 只读 / 不危险"，Codex 的 sandbox 默认 `ReadOnly`。把默认值做反，迟早会有一个早晨醒来发现昨夜烧了几十万次 API 调用。
2. **【Day 1】熔断必须有，不要靠 "下次能成"。** 任何重试逻辑必须有上限，任何队列必须有 max size，任何解析必须有 timeout。`MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES=3`、`MAX_PENDING_EVENTS=100`、`PARSE_TIMEOUT_MS=50` 全是这条原则的产物。
3. **【Scale 后】退出 / 继续原因做成 enum，不要做成日志字符串。** 这样运维能按 reason 分桶，测试能精确断言恢复路径。日志字符串一升级文案 dashboard 就崩。
4. **【Scale 后】隔离要默认开，逃生通道要写注释。** 子 agent 默认所有 mutable state 都被替换成 no-op，只开最窄的逃生通道，并且注释要写清楚 "为什么要开这个例外"。
5. **【Fleet 级】prompt cache 从设计阶段就考虑。** 让 fork / compact / sub-agent spawn 都尽量命中 cache；或者像 Codex 那样把 "动作在哪跑" 也做成枚举。规模上去之后这是真金白银。

---

## 5. 我的总结与思考

读完最大的感受有三点：

**第一，agent 时代的护城河是 harness，不是 LLM。** 两份来自不同公司、用不同语言写的源码，结论高度一致：调哪个模型大家都能调到，差异化来自 harness 怎么把那个模型卡进自己的工程不变量层。这对我们选型或自研 agent 很有参考价值——别光盯着 "换更强的模型"，循环、压缩、权限、可观测性这些 "脚手架" 才决定它能不能上生产。

**第二，读源码注释是学工程经验的高效途径。** 文章里反复出现的那些反直觉常量和注释（"曾经把这个标志位 reset 成 false，结果触发了几千次 API 调用的死循环"），每一句背后都是一次真实生产事故。这些 "疤" 不会写进 README 或官方教程，只有扎进源码才能挖到。这也是为什么技术笔记要尽量引用到文件路径和行号——下次能自己 grep 验真伪。

**第三，给自己写 agent 时的优先级清单。** 套用那五条准则，我会这样排：起步阶段先把 fail-closed 默认值和熔断做对（这两条不依赖规模，代价低收益高）；主循环先抄 Codex 的朴素 `loop {}`，别一上来就堆 10 种 Terminal；安全方案首选 OS sandbox，应用层 AST 做补充；等真正踩到死循环或诡异恢复路径，再把 `transition.reason` 这种 enum 补上去。5 层压缩漏斗、cache 字段对齐这些 fleet 级优化，等用户量上来再说。

一句话收束：**先抄减法立骨架，再用加法补疤痕。** Codex 的朴素结构适合起步，Claude Code 的密集 enum 适合成熟期——两者不是对立，而是同一个 harness 在不同阶段的两种形态。

---

> 学习来源：本笔记是对 [《Claude Code 与 Codex Harness 设计对比：一种加法，一种减法》](https://openeuler.csdn.net/6a0c819c662f9a54cb75b816.html) 一文的总结整理。原文并排拆解了 Claude Code v2.1.88 源码与 OpenAI Codex CLI `codex-rs/`（Apache 2.0），文中所有枚举 variant、常量值与文件路径均出自这两份源码。源码本身：Claude Code 源码（2026-03 因 npm sourcemap 公开）、OpenAI Codex `codex-rs/`（github.com/openai/codex）。
