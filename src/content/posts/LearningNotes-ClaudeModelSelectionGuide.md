---
title: 【学习笔记】Anthropic 指南整理：Claude 开发该选 Haiku 5.5、Sonnet 5.5、Opus 5.5 还是 Fable 5.2
published: 2026-11-10
description: '整理自 Anthropic 开发者博客的官方选型指南：多数工作从 Opus 5.5 的 medium 档起步，明确范围的日常任务降级 Sonnet 5.5，简单大批量交给 Haiku 5.5，最难的技术项目和无人值守长跑才上 Fable 5.2；换模型前先调 effort 档位，它才是更细的成本旋钮。附价格表、按任务算钱的基准数据、模型编排与迁移兼容清单。'
tags: [学习笔记, AI前沿, Claude Code]
abbrlink: claude-model-selection-guide
---

这是一篇指南整理。原文是 Anthropic 开发者博客（claude.dev）2026-11-09 发布的《Which Claude model should you build with? Fable, Opus, Sonnet, or Haiku》，作者 Addy Osmani。发布当天 Anthropic 刚推出 Fable 5.2（以及只面向验证计划、用于网络安全和生命科学的 Mythos 5.2），GA 阵容正式变成 Haiku 5.5、Sonnet 5.5、Opus 5.5、Fable 5.2 四档，中文资讯站普遍把它译作《Anthropic 指南：Claude 开发该选 Haiku 5.5、Sonnet 5.5、Opus 5.5 还是 Fable 5.2》。

为什么值得专门整理一篇：四款模型的 API 输入价从每百万 token 0.10 美元到 8 美元，跨度 80 倍，再乘上 low 到 max 五档 effort（推理强度），组合空间很大；这篇官方指南难得地把「默认从哪起步、什么时候降级、什么时候升级、换模型前先做什么」讲成了一套可执行的顺序，还给了一组「按任务算钱」而不是按 token 单价的基准数据。下文前八节是指南内容的整理，第九节是我自己的几点观察。

先说结论：

1. **多数工作从 Opus 5.5 的 medium 档起步**——这也是 Claude Code 的默认模型和默认档位，token 价格是 Fable 5.2 的一半。
2. **effort 是比换模型更细的成本旋钮**：任务做不好时，先升一档 effort 重跑，再考虑换更大的模型；超过 high 之后再加档可能贵得像换模型，此时应该反过来测试「上一档模型 + 更低 effort」。
3. **四款模型各就各位**：简单大批量交给 Haiku 5.5，明确范围的日常任务降级 Sonnet 5.5，日常复杂编码与知识工作留在 Opus 5.5，最难的技术项目、大型重构和无人值守长跑才上 Fable 5.2。
4. **能自动验收的任务有一套更省的跑法**：全部用 low 档跑、失败的用 high 档重跑，指南实测约 97% 通过率、每任务约 0.17 美元，好于全程 high 的 95.3% 和 0.29 美元。
5. **多模型编排里真正划算的是「并行廉价工人」**（Opus 主导 + 最多 25 个 Sonnet 工人，成本约降三分之一）；而小模型遇难题请教大模型的 advisor 配对，Anthropic 自己的数据都不支持。
6. **迁移的坑集中在 Fable 5.2**：preserved thinking 强约束改历史直接报 400，强制工具调用、关闭 thinking 等行为也与旧模型不同，切换前要过一遍兼容清单。

## 一、四款模型的定位一张表

| 模型 | 一句话定位 | 默认 effort（API / Claude Code） | 值得记住的特性 |
| --- | --- | --- | --- |
| Haiku 5.5 | 高吞吐、成本敏感、延迟最低 | medium / medium | 唯一按提示长度分档计价（≤100K 便宜档）；high 档及以下可关闭 thinking |
| Sonnet 5.5 | 快速胜任明确范围的任务 | high / medium | 支持 between_tools，只在工具调用间隙思考 |
| Opus 5.5 | 复杂编码与知识工作的「日用主力」 | medium / medium | thinking 始终开启；支持 fast mode |
| Fable 5.2 | 最强 GA 模型，编码 / 金融 / 科学领域最难的项目 | high / medium | preserved thinking 强约束；支持 fast mode |

四款模型的规格完全一致：100 万 token 上下文、最多 128K 输出。差别只在能力档位、价格和 thinking 行为。

## 二、官方选型顺序：默认 Opus，按需升降

指南给出的决策顺序可以压缩成四步：

1. **大多数工作从 Opus 5.5 medium 起步**（Claude Code 默认）。
2. **明确范围的日常工作降级 Sonnet 5.5**——但注意「有明确规格」不等于「该用 Sonnet」：难的迁移、性能优化即使规格明确，仍可能需要 Opus 或 Fable。
3. **简单、大批量、输出可预期的任务交给 Haiku 5.5**。
4. **最难的技术项目和长时间无人值守的运行才上 Fable 5.2**；事先知道是几小时的长任务，可以直接从 Fable 起步。

按任务类型的起步建议照抄如下，这张表是指南里最实用的一张：

| 任务 | 起步模型 | 起步 effort |
| --- | --- | --- |
| 日常工程 / 调试、多 PR 功能开发 | Opus 5.5 | medium（默认），不够再 high |
| 分类、路由、打标、大批量抽取 | Haiku 5.5 | medium |
| 子代理（搜文件、读日志、总结） | Haiku 或 Sonnet | 各自默认档 |
| 聊天与交互会话 | Sonnet（简单大批量可 Haiku） | low 或 medium |
| 明确范围的编码 | Sonnet 5.5 | medium，难任务升 high |
| 日常文档 / 幻灯片 / 表格 | Sonnet 5.5 | high（Claude Code 中 medium） |
| 重复性 agent 任务（调查、审查、起草） | Sonnet 5.5 | medium |
| 计算机使用 / 视觉密集型长程 agent | Opus 5.5 | medium |
| 大型重构、迁移、架构规划、主导多个子代理 | Fable 5.2 | medium 后 high |
| 深度研究、科学 / 量化分析 | Fable 5.2 | medium 后 high |
| 不确定时 | Opus 5.5 | medium |

## 三、逐个看：什么活给谁

### Haiku 5.5：大批量与侧线任务

定位是高吞吐、成本敏感、延迟最低，典型场景是分类、路由、打标、大批量抽取，以及子代理的侧线任务。两个容易踩的细节：一是它是唯一按提示长度分档计价的模型——提示不超过 100K token 时是便宜档，超过后单价涨到 5 倍；二是它在 high 档及以下可以关闭 thinking，进一步压延迟和成本。

### Sonnet 5.5：明确范围的日常主力

适合快速、胜任明确的任务：日常聊天、按 spec 修 bug 和开发、日常文档 / 幻灯片 / 表格、重复性 agent 工作。API 默认 effort 是 high，Claude Code 里默认 medium。它支持 between_tools 模式，只在工具调用的间隙思考，适合交互式的 agent 循环。

### Opus 5.5：复杂编码与知识工作的日用主力

指南原话是「我们复杂编码与知识工作的日用主力」（our daily driver），也是 Claude Code 的默认模型。场景包括日常工程与调试、跨多个 PR 的功能开发、计算机使用与视觉密集的长程 agent 循环、复杂财务模型和大型素材堆文档。thinking 始终开启、不能关，各平台默认 effort 都是 medium，支持 fast mode。

### Fable 5.2：最难的项目与无人值守长跑

最强 GA 模型，面向编码、金融、科学领域最难的技术项目：大型重构与迁移、架构规划、主导多个子代理、深度研究、科学 / 量化分析、长时间无人值守运行，以及 Opus 5.5 开到 high 仍然搞不定的时候。API 默认 effort 是 high，Claude Code 里默认 medium。它有 preserved thinking 的强约束：其思考块之前的历史（system prompt、tools、早期消息）一旦变更，请求直接返回 400——自管对话代码必须保持历史只追加。

## 四、价格与「按任务算钱」的账

标准 API 列表价（每百万 token，美元）：

| 计费项 | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 | Fable 5.2 |
| --- | --- | --- | --- | --- |
| 输入 / 输出（提示 ≤100K） | 0.10 / 0.50 | 2 / 10 | 4 / 20 | 8 / 40 |
| 输入 / 输出（提示 >100K） | 0.50 / 2.50 | 2 / 10 | 4 / 20 | 8 / 40 |
| 缓存读取 | 0.01 / 0.05（按提示长度） | 0.10 | 0.20 | 0.20 |
| 上下文窗口 / 最大输出 | 1M / 128K | 1M / 128K | 1M / 128K | 1M / 128K |
| fast mode | 无 | 无 | 有 | 有 |

单看单价没有意义，指南的价值在下面这组「按任务算钱」的对比数据：

- **Terminal-Bench 3.0**：Fable 5.1 开到 max 得 58.0%，Opus 5.5 只开 high 就得 58.9%，token 用量还是前者的一半——高档位模型不是无脑买大就赢。
- **FrontierCode 2.0**：Fable 5.2 @high 得 45.3%，与 Opus 5.5 @max 的 45.5% 基本持平，每任务成本约一半——难题上「大模型低档」胜过「小模型最高档」。
- **SWE-bench Pro（Opus 5.5，相对 high 档）**：medium 低约 2.5 分但成本只要 70%；low 低约 8 分、成本约三分之一；xhigh 只高 1.4 分，成本却是 2.5 倍。
- **Haiku 的量级感**：长提示下 Haiku 高档位仍是 Sonnet 输入价的四分之一，短提示下只有二十分之一。

## 五、effort：比换模型更细的旋钮

这是指南里我认为最值得内化的观点：**遇到不满意的结果，升级顺序是「给模型自查手段 → 升一档 effort → 换更大模型配更低 effort」**，而不是直接跳到最贵的模型。

具体到可自动校验的任务（有测试、构建或脚本能判定成败），有一套明确更省的跑法：全部用 low 档跑，失败的用 high 档重跑——约 97% 通过率、每任务约 0.17 美元，好于全程 high 的 95.3% 和 0.29 美元。失败重跑的成本远低于全程高档。

反向的警示同样重要：effort 超过 high 之后，再加一档的成本可能已经接近换一个更大的模型。此时正确的实验是「上一档模型 + 更低 effort」，而不是把当前模型推到 max。

## 六、组合使用：子代理、advisor 与并行工人

### 在自然断点切换

提示缓存属于写入它的模型：换模型后的第一回合要付全量 cache-write。所以切换前应在 Claude Code 里跑 `/compact` 压缩上下文；直接调 API 的，用摘要（而不是完整历史）给新模型开新会话。思考块的方向性也值得记：向下兼容——Opus 能读 Sonnet/Haiku 的思考块，Fable 能读其余三款的；但 Fable 5.2 的推理迁到任何其他 GA 模型都会丢弃。

### 子代理用小模型

主模型保留判断和代码修改，小模型只做「错了也容易发现」的工作：搜文件、跑测试、读日志。指南给的子代理定义示例（存为 `.claude/agents/log-reader.md`）：

```markdown
---
name: log-reader
description: Reads test output and logs, and reports each failing case. Use after a test run.
tools: Read, Grep, Glob, Bash
model: haiku
---

Read the logs you're given. For each failure, report the file, the test name and the first error line. Don't edit any files.
```

子代理的默认模型可以用环境变量 `CLAUDE_CODE_SUBAGENT_MODEL` 统一设置。几个相关细节：

- 新版 Claude Code 的 Explore 子代理跟随会话模型（上限 Opus）；想固定用 Haiku 可以自定义 `Explore` 子代理并写 `model: haiku`，用 `ANTHROPIC_DEFAULT_HAIKU_MODEL` 锁定版本。
- `haiku` 别名在 Anthropic API 已解析为 Haiku 5.5（需 Claude Code v2.1.293+），但 Bedrock / GCP / Foundry 上仍是 Haiku 4.5——同一段代码跨平台跑要注意。
- `opusplan` 别名是 Opus 规划 + Sonnet 执行（代码编辑落在 Sonnet 上），与指南「难任务留在 Opus」的建议方向相反，用前自己测。

### advisor 与并行工人：一负一正

- **advisor 工具（beta）**：便宜模型执行 + 强模型当顾问。Anthropic 自己的态度很谨慎：四个配对没有一个明显胜过单独执行器，示例里 Opus@high + Fable 5.1 advisor 只多 1.7 分却花了 2.1 倍的钱（在噪声范围内）。结论是别指望它。
- **并行廉价工人**：Opus 主导 + 最多 25 个 Sonnet 工人，在约 2200 万 token 的缺陷搜索基准上成本降约三分之一、得分持平。适用前提是任务能切片并行；单一依赖链、或单个上下文装得下的工作，不要上多代理编排。

## 七、成本优化与自测方法

指南的成本清单，按可操作性排序：

1. **先自验证再升档**：给模型测试 / 构建 / 脚本自查 → 升一档 effort → 换更大模型配更低 effort。
2. **可自动校验时**：全跑 low，失败用 high 重跑。
3. **上下文精简**：贵模型的上下文留给决策，长文本阅读交给便宜子代理。量级感：150K 上下文每回合缓存读约 0.03 美元，20K 只有约 0.004 美元。
4. **压缩后切换**：换模型前 `/compact`。
5. **迁移前查兼容**（见下节）。

自测方法比任何榜单都可靠：抽一批真实任务（含最难的一两成）、给每个任务写结果校验（测试通过 / 工单关闭）、每个模型 × 2-3 档 effort 在独立会话里各跑一遍、画分数 - 花费图；**多模型方案必须优于所有单模型点才值得上**，灰度验证后再切换。Claude Code 里用 `/model` 切换、`/usage` 对比花费。

## 八、迁移兼容性检查清单

在四款模型间迁移代码前过一遍：

- **Fable 5.2 的 preserved thinking**：其思考块之前的任何变更（system prompt、tools、早期消息）都返回 400；自管 messages 数组的代码必须保持历史只追加。
- **thinking 开关**：Opus / Fable 强制开启，试图关闭会报错；Sonnet 默认开、可选 between_tools；Haiku 在 high 档及以下可关。代码应按 content block 类型读取，不要假设结构。
- **强制工具调用**：`tool_choice` 设为 `any` 或 `tool` 在 Sonnet / Opus / Fable 上返回 400，改用 `auto` + `strict: true` + 提示词说明。
- **Computer use**：只能通过 `computer_toolset_20260801` 工具集（Claude API 与 Google Cloud 托管部署）。
- **Haiku 4.5 → 5.5**：`budget_tokens` 换成 effort；非默认的 temperature / top_p / top_k 会返回 400；消息必须以 user turn 结尾。
- **安全回退**：Sonnet / Opus / Fable 会跑安全分类器（多数是网络安全和生物内容）；Fable 5.2 沿用 5.1 的回退——网络安全转 Opus 4.8、生物转 Opus 5。
- 多模型系统按最严格约束写每个请求，让代码（而不是模型）做简单路由。

## 九、几点观察（我的整理视角，非指南内容）

1. **这套建议的潜台词是「模型选择是成本问题，不是能力问题」**。指南反复用「按任务算钱」的数据说话，四档模型在常见工程任务上通过率差距远小于价格差距——多数场景里，选错模型的代价是多花钱，不是做不出。
2. **effort 档位正在吃掉「中间模型」的存在感**。Opus 5.5 medium / low 两档加上失败重跑，覆盖了 Sonnet 与 Haiku 的相当一部分场景；反过来 Fable 低档又盖过 Opus 高档。四款 × 五档与其说是产品线，不如说是一根连续的 价格 - 能力轴。
3. **Anthropic 对自家 beta 功能的诚实值得注意**：advisor 配对「没有一个明显胜过单独执行器」这种结论，厂商指南一般不写。这也提醒我们：编排模式（advisor、多代理）的默认收益是负的，除非任务结构明确适合切片并行。
4. **指南没说的是订阅侧的账**。API 的按任务算钱逻辑（全 low + 失败 high 重跑）在 Claude 订阅里不完全成立——订阅按额度消耗计，Fable 5.2 在 Pro / Team 标准席位还要扣用量额度，另一篇实测（同题 11 道、两边全对）算出 Fable 比 Opus 贵 1.86 倍。订阅用户真正该带走的是「默认 Opus medium、失败先加档」这一条。

## 参考

- [Which Claude model should you build with? Fable, Opus, Sonnet, or Haiku（原文，claude.dev）](https://claude.dev/blog/which-claude-model-should-you-build-with/)
- [Introducing Claude Fable 5.2 and Claude Mythos 5.2（Anthropic）](https://www.anthropic.com/claude-fable-and-mythos-5-2)
- [Choosing the right model（Claude Platform Docs）](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)
- [Fable 5.2 和 Opus 5.5 怎么选：哪档对哪档，同题实测贵 1.86 倍（LaoZhang AI Blog）](https://blog.laozhang.ai/zh/posts/claude-fable-5-2-vs-opus-5-5)
