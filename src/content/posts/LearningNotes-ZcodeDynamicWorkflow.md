---
title: 【学习笔记】ZCode 动态工作流（Dynamic Workflows）使用指南：触发、脚本解剖与生命周期
published: 2026-09-22
description: 整理 ZCode 动态工作流（CreateWorkflow）的使用方法与适用场景——两个触发入口与"点名即约束"的路由规则；脚本解剖（agent()/ask、带 JSDoc 的类型化结果、phase 阶段、world.run 确定性门、report/artifact）；编译、确认、后台运行、修订、恢复、保存复用的完整生命周期；六种常用编排模式与常见误用清单。材料来自 dynamic-workflows skill 文档（SKILL.md/patterns.md/examples.md）调研摘录，材料未覆盖的空白在文中明确标注。
lang: zh
tags: [学习笔记, Agent]
abbrlink: zcode-dynamic-workflow
---

之前写过一篇 Claude Code 动态工作流的笔记；这次把 ZCode 侧的同名机制完整梳理一遍。注意两边是不同产品各自的实现，本文只讲 ZCode，不做横向对比——事实全部来自 ZCode 的 dynamic-workflows skill 文档（SKILL.md、patterns.md、examples.md）的调研摘录，凡材料没覆盖的地方，文中直接标"未说明"而不是脑补。

这篇笔记面向会用 ZCode、但还没碰过工作流的开发者。先把心智模型立起来：动态工作流不再是"把一件事整个交给一个代理"，而是**用一段 TypeScript 脚本设计一条生产流水线**——在哪里开几个子代理、跑哪些真实命令当裁判、结果如何流转、什么时候停。脚本通常由主代理（AI）替你执笔，你在批准前逐行审阅；ZCode 负责执行，并把整个数据流摊在阳光下。

> **先说结论**：
> 一、触发只有两个入口——`/workflow` 命令，或任何措辞点名"用工作流"；点名即约束（再小的任务也是一个小工作流），不点名就不启动（任务长得像编排不是理由）。
> 二、人机分工是：主代理写脚本，你在四个关口参与——发起、在确认窗审**实际脚本**、回答子代理的 escalation、对修订/恢复/保存拍板。
> 三、脚本的五个核心件：`agent()` 开新眼睛、`ask<T>` 带类型化结果做分支、`phase()` 画用户看得懂的里程碑、`world.run` 让真实命令当裁判、`report`/`artifact` 边干边交并发布交付物。
> 四、生命周期是"编译→确认→后台跑→完成通知"；跑错了立即 AmendWorkflow（byte 相同的 ask 零 token 导入，只重跑改动部分），stopped 的 run 可原样恢复，值得复用的脚本经你同意后 SaveWorkflow。

---

## 1. 它是什么，和 Agent 工具有什么不同

**一句话定义**：动态工作流由 CreateWorkflow 工具执行——提交一个 TypeScript 脚本，用多个子代理和确定性命令检查编排出一份数据流可见的运行。它瞄准的是一流的专家级工作成果，而不是一次回复能给出的更快草稿。落到任务上说：一个回合就能答好的问题，普通对话就够；而"给这个 PR 做一次经得起复核的安全评审""修到测试真过为止"这类要么多双眼睛、要么真机裁决、要么多轮迭代才能让人放心的活，才是工作流的领地。

和 Agent 工具的分工是一张路由表：

| 你要做的事 | 用什么 |
| --- | --- |
| 把一件事委托给一个代理去办 | Agent 工具 |
| 几个相互独立的查询，谁也不需要读谁的答案 | Agent 工具（并行发起） |
| 用户没点名工作流的一切任务——无论多少步、多少子代理 | Agent 或自己做 |
| 用户点名了工作流 | CreateWorkflow（本文主角） |

两者的本质差异在于**控制权**。Agent 是一次黑盒委托；工作流脚本是一份你能逐行阅读、用户批准前能完整看到的流程图：每个子代理拿什么指令、每条命令怎么裁决、每个发现经过谁的确认，全都写明在脚本里。配套地，harness——ZCode 里负责执行脚本、跑命令、记账的那层运行环境——提供了一套机制：运行账本（journal，把每一步只读观察记下来，run 恢复时按账本重放，不重复花钱）、按结果缓存、修订与恢复（见第 4 节）。

**请求工作流就是请求深度。** 一旦用户点名工作流，默认的形状是三件事（机制分别在 3.1、3.4 和第 6 节展开，这里先记白话版）：

- 每个工作单元开一个**全新子代理**——新对话就是一双没被前文带偏的新眼睛；
- 命令能裁决的地方放**确定性门**——构建、测试、检查器这类真实命令说了算，不问 AI"你觉得行吗"；
- 你会当事实采信的每个发现做**独立确认**——再派一个没参与生产的代理复核一遍。

检查力度按出错代价和风险大小配置。

**一个撞名警告**：ZCode 里还有一个更老的 Workflow 工具和 /expert 命令，与本篇讲的动态工作流撞名，但完全是另一个功能。dynamic-workflows skill 只讲 CreateWorkflow 这一个动态工作流工具。

### 你和主代理怎么分工

先把角色摆正，免得整篇读着拧巴：**CreateWorkflow、AmendWorkflow 这些是主代理（AI）侧调用的工具，不是你敲的命令。** 脚本由主代理执笔；你的参与集中在四个关口：

1. **发起**：你点名工作流（说"用工作流做 X"或输入 /workflow）——这是唯一的启动开关（见第 2 节）；
2. **批准**：脚本编译干净后弹确认窗，显示**实际脚本**——你批准的不只是"跑个任务"，而是这份流程图和它的命令集；
3. **被问**：子代理有绕不开的问题会 escalate 到你（见 4.4）；想保存工作流复用之前，也会先征求你的同意（见 4.8）；
4. **决策**：修订用户手停的或别的会话启动的 run、恢复被停的 run，都要你点头。

所以第一次上手的实际路径是：**你说清楚要什么 → 主代理加载 skill、写脚本、提交 → 你在确认窗审脚本 → 批准后后台跑 → 完成通知送结果。** 审脚本时重点看三样：

- **phase 图**：每个阶段的名字用你的语言写着"这阶段为你做成什么"——这张图讲不通你要的事，就别批；
- **命令集**：world.run 里的命令名是你批准的对象——有你不想在这台机器上跑的命令，就别批；
- **子代理指令**：每个 ask 的原文就在脚本里——允许什么、禁止什么（比如"不要修改任何文件"）写没写清楚。

如果你确实想自己掌控脚本：inline 提交的脚本会自动落盘成普通 .ts 文件（`.zcode/workflow-drafts/`），path 来源提交的就是磁盘上的文件——文档没有限定这个文件由谁写出，不过调研材料中所有示例与修订路径里，执笔的都是主代理；你更现实的影响力在确认窗：逐行审、在批准前要求改动。

---

## 2. 怎么触发

触发入口**只有两个**：

1. 用户输入 `/workflow` 命令；
2. 用户以任何措辞把工作流点名为做事的手段——"用工作流做 X""使用 workflow""帮我跑个 workflow"都算。

两条铁律：

- **点名即约束。** 用户点名后必须走 CreateWorkflow，不能换成 Agent 或内联完成，也不能以"任务太小、Agent 本可胜任、一条回复就能答"为由推脱——最小的任务得到的也是一个小工作流。
- **不点名就不启动。** 任务"长得像编排"——结果要喂给后续步骤、有带停止条件的循环、要按类型化结果分支——这些特征只是用户**已经要求工作流之后**选择脚本形状的依据，绝不是发起的理由。没点名，就用 Agent 或自己做。

一个技术细节：**skill 的加载是主代理的事，不是你的操作。** CreateWorkflow、AmendWorkflow、SaveWorkflow、EvalWorkflowSnippet 四个工具在 dynamic-workflows skill 尚未加载进会话时拒绝运行——主代理会通过 Skill 工具把它加载进会话，你只管点名工作流。唯一例外是**按名运行已保存的工作流**（见 4.8），它不需要 skill 已加载。至于 /workflow 命令敲下之后的交互细节（是否要求你立刻提供任务描述、还是进入普通对话），调研材料未说明——但无论哪个入口，下一步都只是正常对话：你把需求说清楚即可。另外，后文登场的 TaskOutput、GetWorkflowRun、ListWorkflowRuns、ResolveWorkflowQuestion 不在"需 skill 加载"的名单里——调研材料只对上述四个工具说明了这个门槛（未提及不等于承诺，但文档只点了这四个的名）。

还有一条：子代理不能再调用 CreateWorkflow——不允许嵌套；大到"想要自己的工作流"的任务，应建模为当前脚本里更多的子代理。

---

## 3. 脚本长什么样：解剖一个小例子

> **示意声明**：本节示例是为讲解构造的写法，机制描述以本文文字为准；API 的确切签名（如 ask 的调用形式、artifact 的参数细节）调研材料未逐字给出，动手前请以 skill 原文为准（怎么找到原文，见文末附录）。

场景：对当前分支改动的文件做一次安全评审——逐文件评审、逐发现独立确认、最后用仓库自己的检查定案。

```ts
// 纯 TypeScript：无 import、无 Node/web API、顶层 await、最终 return
phase("逐个评审改动的文件")            // ① 阶段标记：给用户看的里程碑
let changed: string[]
try {
  changed = await git.changedFiles("origin/main")   // ② 只读观察
} catch {
  changed = await files.glob("src/**/*.ts")  // git 在仓库外会 reject，glob 兜底是惯用法
}

interface Finding {                  // ③ 类型化结果：控制流要在它上面分支
  /** 一句话描述问题 */
  issue: string
  /** high 只留给可能导致数据丢失或崩溃的问题 */
  severity: "high" | "medium" | "low"
}
interface Verdict {
  /** 该问题是否真实成立 */
  holds: boolean
  /** 支撑判断的证据 */
  evidence: string
}

const confirmed: Array<Finding & { file: string }> = []

await Promise.all(changed.map(async (path) => {
  const reviewer = agent(`reviewer-${path}`)        // ④ 每个文件一个全新子代理，名字带路径
  const findings = await reviewer.ask<Finding[]>(
    `只读评审 ${path} 的安全问题，只报告有证据的问题，不要修改任何文件。`
  )
  for (let i = 0; i < findings.length; i++) {
    const f = findings[i]
    const verdict = await agent(`confirmer-${path}#${i}`)  // 每个发现一双新眼睛
      .ask<Verdict>(
        `独立核实：${path} 是否真的存在这个问题——${f.issue}。只读，不改文件。`
      )
    if (verdict.holds) {
      confirmed.push({ ...f, file: path })
      report({ file: path, ...f })                  // ⑤ 产生的瞬间就上报
    }
  }
}))

phase("用仓库自己的检查定案")
const lint = await world.run("pnpm", ["lint"])      // ⑥ 确定性门：真实命令做裁判

return {                                            // ⑦ 最终 return：WorkflowReport 形状
  conclusion: `评审了 ${changed.length} 个改动文件，确认 ${confirmed.length} 个安全问题；pnpm lint ${lint.exitCode === 0 ? "通过" : "未通过"}。`,
  findings: confirmed.map(f => ({ ...f, status: "verified" })),
  verified: [{ command: "pnpm lint", covered: `${changed.length} 个改动文件` }],
  notCovered: [],
}
```

下面逐块拆。

### 3.1 agent() 与 ask：雇佣与派活

`agent(name?, persona?)` 每调用一次就创建一个全新的持久对话上下文（actor）。上下文跨 ask 累积——同一个子代理问第二次时，它记得第一次说过什么；**共享上下文的唯一方式是共享这个变量**。同一子代理上的并发 ask 按 FIFO 排队。

`ask<T>(instructions)` 给子代理派一个任务，类型参数的取舍是：只想要一段散文（总结、草稿），**不传类型参数**；控制流要在答案上**分支**（按 severity 走不同后续、按 holds 决定去留），**必须传**一个在脚本里自定义的 interface/type alias，运行时的 schema 由该类型合成。

**一个必须坦白的空白**：子代理交回的结果不合 schema 时（缺字段、severity 写成 "High"、答案夹在散文里），harness 是让子代理重答、让 run 报错终止、还是把不合规的值塞进你的控制流——调研材料没有说明。所以别把 `verdict.holds` 这样的分支建立在"校验一定替你把关"的假设上。稳妥的做法（这是工程建议，不是文档承诺的行为）：字段设计得容易被答对——字段少、JSDoc 明确；控制流里给意外值留兜底分支——比如 severity 不认识就按最低档、按 unconfirmed 处理。

子代理名字可选，但非空名在 run 内必须唯一——固定同名的字面量形式编译期即拒，运行期拼出的重名会在第二个条目处弄死整个 run。名字同时是修订版重跑时匹配缓存的键（见 4.6），所以用稳定有意义的名字（如 `reviewer-${path}`）能让已付的工作跨修订复用；匿名子代理则永远从空上下文开始。

派活时把**允许和禁止什么写进 ask**（如上例的"不要修改任何文件"）。每个子代理都拥有同一套常规工具并跑在会话模型上，persona 在创建时冻结——没有按子代理挑选工具或模型的机制，创建后也无法覆盖。

### 3.2 JSDoc：最便宜的质量杠杆

类型化结果字段的 JSDoc 注释，就是子代理实际读到的字段说明。给 `severity` 写明"high 只留给可能导致数据丢失或崩溃的问题"，你才能拿到校准过的字段——这是整个接口面上最便宜的质量杠杆。

结果要保持**窄**：它会跨 schema 边界并插值进下一个 prompt，令牌要花两遍。子代理需要看某个文件时，**传路径而非文件内容**——子代理有自己的文件工具，能自己读。

### 3.3 phase()：给用户看的里程碑

`phase("...")` 是必需的阶段标记而非装饰：用户批准的确认对话框按 phase 一节点绘制，标记要覆盖整个脚本。三条规则：

- 名字必须是**编译期字符串字面量**，用用户会话的语言写"这阶段为用户做成什么"（如"逐个检查改动的文件"），禁用 fan-out、gate 之类的机器词汇——否则用户批准的是一张对自己的工作只字不提的图；
- 每个阶段至少含一个子代理 ask 或一个 world.run；纯脚本逻辑不成阶段，也不能为开头的取参和结尾的 return 单独开阶段；
- 不得放进并发 fan-out 的回调里（并发回调乱序重入两个 marker 会互相盖掉对方的 step）。同名两个 phase 标记合并为一个节点——循环体因此跨轮保持一个框。

### 3.4 world.run：确定性门

`world.run(cmd, args, { timeoutMs })` 执行真实命令做裁决：

- **命令名必须是编译期字符串字面量**——用户在确认时批准的就是脚本的命令集；固定 argv 不经 shell，运行期的值（路径、轮号）只能插进 args 数组。
- **非零退出码是正常返回值而非异常**——门控循环直接按 `exitCode` 分支、把 `stderr` 带作下一轮反馈。只有 spawn 失败、超时（默认 300 秒，可按调用覆盖 timeoutMs 且无上限）或单流输出超 256KB 才 reject。
- **写门前先选门**：调查仓库实际有的检查（package.json scripts、Makefile、CI、README），按裁决力排序——快层驱动循环轮次；请求所隐含的**最强检查**必须在最终 return 前至少真跑一次；仓库里存在却没跑的检查算未验证工作。

对比一下：让子代理"跑测试再汇报是否通过"，是花一整个会话去买一个 exit code，还信任了一份可以伪造的通过声明。机器可判的检查交给 world.run。

**world.run 不是只读工具。** 本节例子全是 lint/test/build 这类检查，但机制上它就是"执行一条真实命令"——4.6 的缓存规则明确把"live world.run 执行"列为"真实写工作区"的来源之一，说明它可以跑会改工作区状态的命令。不过调研材料里的分工惯例始终是：**子代理做修改（用自己的写工具改文件），world.run 做裁决**（见 6.4 的门控循环）；用 world.run 跑 pnpm fix 这类写命令有没有额外的确认提示，材料未说明。你能确定的底线是：无论读命令写命令，命令集整体都是你在确认窗批准的对象。

### 3.5 files 与 git：只读观察

`files.glob/read/grep` 与 `git.changedFiles/diff/status/log` 都是 harness 执行、记入 journal、恢复时按记录重放的**只读观察**，没有写操作。上限一律**拒绝而非截断**：glob 2000 个文件、grep 2000 行或 256KB、diff 512KB、log 100 个提交。"拒绝而不是截断"意味着路径清单要么完整要么没有——迁移不会静默半完成。

git 的每个调用在仓库之外都会 reject（可 catch）；try/catch 后用 files.glob 兜底是惯用法而非防御性冗余。分工上：**决定分发哪些文件是脚本的工作**（glob/changedFiles），**读文件内容是子代理的工作**——脚本只在必须按内容分片或分支时才用 files.read/grep。

### 3.6 report 与 artifact：边干边交，最终交付

`report(item)` 在结果产生的瞬间即时发布中间结果：已 report 的条目随完成通知送达，run 失败（errored/stopped）也照样带出——这是失败 run 的抢救通道；恢复的 run 不会重复显示同一 item。上限每 run 256 条、每条序列化后 32KB，所以 report 的得是 finding 不是闲聊。第二个参数可把条目同时挂到某个 dashboard 预设上。

`artifact.file/markdown` 发布用户打开的交付物（异步 effect、可 catch 地 reject——源文件缺失应交回子代理补写后再发布）；`artifact.chart/table/metrics/board` 是同步声明的 dashboard 预设，由 `report(item, id)` 喂条目。**每个 run 都要发布交付物**；多个 artifact 时用 `primary: true` 标记交付物。id 与 report tag 都是编译期字面量，重发同一 id 会铸出新版本并保留旧版。

注意两侧受众不同：**return 面向主代理，artifact 面向用户，两边不放同样内容**。

### 3.7 最终 return：WorkflowReport

最终 return 采用四字段形状，不要返回裸数组：

- `conclusion`：两三句话回答用户所问；
- `findings`：各带 evidence 与 verified/unconfirmed 状态；
- `verified`：列实际跑过的命令与覆盖范围；
- `notCovered`：列查不了什么及原因——只放"没法查的"，把因慢而跳过的检查塞进来是给未验证的工作套诚实外皮。

### 3.8 脚本的边界与提交前试跑

脚本是纯 TypeScript：strict 下编译（noUncheckedIndexedAccess 关闭，索引访问无需守卫，但 `.find()`/`.match()` 这类返回 `T | undefined` 的必须守卫），顶层 await 加最终 return。**不允许 import/export/declare**；`process`、`fetch`、`fs`、`Date.now`、`Math.random` 等 Node 与 web API 在编译期被拒绝——这是为了让 run 可重放。

提交前用 EvalWorkflowSnippet 在同一编译器、沙箱和 world 读路径上同步试跑脚本的非编排部分（片段里没有 agent()）：验证 glob 实际返回什么、grep 会不会超上限、stderr 怎么解析、门谓词对不对；决定结果的检查也先在这里跑一次，得知输出形态、非零退出行为和该写的 timeoutMs。烧一次完整 run 去发现一个拼写错误，是昂贵的方式。

最后一条贯穿设计的原则——**新鲜眼睛**：计划、草稿、最终报告都交给没见过它的独立代理复核，问的是"什么会弄坏它、缺什么"而不是"这好不好"；一个交付物最多配一个复核机制，配两个要说得出理由。

---

## 4. 一次运行的完整生命周期

生命周期一句话：**编译 → 用户确认 → 后台运行 → 完成通知**。跑的过程中，phase 节点、report 条目和 artifact 会以卡片形式出现在会话里，完成通知自动送达——不需要盯着等。

### 4.1 提交与确认

CreateWorkflow 先对脚本做类型检查；编译干净后请用户确认——**确认界面显示的是实际脚本**（用户批准的命令集就是 world.run 里那些字面量命令名）；批准后 run 在后台启动并返回 run ID。

三种来源**严格传一个**：inline 脚本（自动落盘到 `.zcode/workflow-drafts/` 并在结果里给出路径）、`saved` 按名运行已保存的工作流（args 先对其声明校验）、`path` 指向磁盘上的脚本文件。name 用用户语言给 run 打标签；max_concurrency 和 subagent_model 只在用户要求时设置。

**编译诊断意味着什么都没跑**——不存在半启动的 run 需要清理。诊断格式为 `{path}:L{line}:C{column}` 并指向脚本文件。修订 draft 文件（机器管护、git 忽略）不需要确认窗：诊断后应 Edit 该文件、用 path 重新提交，**不要把整段脚本再内联粘贴一遍**——两万 token 重流换一行修改，还可能把 provider 卡死。

### 4.2 后台运行与查看

完成通知自动送达并携带最终 return 值和全部已 report 条目——**不要轮询**。确实要看时分工明确：

| 工具 | 用途 |
| --- | --- |
| TaskOutput | 阻塞等待本会话启动的 run（这是等待工具） |
| GetWorkflowRun | 即时快照，用于不能阻塞或属于其他会话的 run |
| ListWorkflowRuns | 枚举项目全部 run（含其他会话启动的） |

模型侧错误（限流、并发限制、过载、网络错误、超时）从不进脚本：run 内无限制重试并自适应扇出。**"waiting for provider" 徽章是在等，不是坏了**；20 分钟无进展也只发一条信息性停顿通知。

### 4.3 花费：在哪看，能控制什么

工作流默认"多开全新子代理"，花费是真实存在的。三个实际问题分开答：

- **在哪看**：ListWorkflowRuns 枚举出的每个 run 都带 tokens spent 一栏；GetWorkflowRun 的快照里有 token usage。想知道一个 run 烧了多少，看这两个工具的输出。
- **能不能设预算**：截至本材料，没有——调研材料和工具说明里都没有预算或花费上限机制；max_concurrency 控制的是并发槽数，不是花费上限。
- **跑贵了怎么办**：没有"只取消部分子代理"这种粒度的控制（材料未提及任何此类机制）。可操作的手段都在整只 run 层面：让 run 停下来（用户停、或主代理 TaskStop——stopped 状态可原样恢复），或者用 AmendWorkflow 砍掉贵的步骤重交——已完工的命名子代理工作免费导入，这才是"中途调整投入"的正路（见 4.6）。

### 4.4 子代理中途提问（escalation）

子代理可以随时把阻塞性问题 escalate 给主代理——这个工具像 submit_result 一样被注入，脚本里没有任何开关，persona 也控制不了，专用于子代理自己绕不开的墙：过不去的门、互相矛盾的指令、只有发起人才知道的事实。

escalation 通知带 run、子代理、问题、证据和一个形如 `dwfq-...` 的全局唯一 id。只有提问的那个子代理在那一次调用上停摆，兄弟子代理、脚本控制流和 run 状态照常，而且不代它超时——一直等到你回答或 run 被取消。处置二选一：

- 问题有答案 → 用 ResolveWorkflowQuestion 按 question_id 回答，你的原文逐字成为该子代理调用的结果，它从那里继续；
- 不确定 → 先 GetWorkflowRun 看 pendingQuestions（通知丢失时也用它查 run 仍欠答的问题），或问用户再回来答。

如果是脚本本身坏了（没有输出能过的门），编辑 run 的脚本文件并 AmendWorkflow——escalation 的 ask 从未结算、恰停在缓存边界，之前的一切免费导入，只重跑修好的部分。每次 ask 最多 3 次 escalation，第 4 次作为普通结果返回并告知额度用尽——这是防闲聊的护栏，不是该花的配额。相应的，persona 应写明"检查不可能通过或指令互相矛盾时，直说并 escalate，而不是绕过"。

### 4.5 三种终态

| 终态 | 含义 | 处置 |
| --- | --- | --- |
| completed | 脚本正常 return | 收通知即可 |
| errored | 脚本自身失败 | ResumeWorkflowRun 拒绝恢复；编辑 run 的脚本文件，经 AmendWorkflow 用 path 重交 |
| stopped | 被停住 | 可用 ResumeWorkflowRun 原样续跑（同 run ID、同脚本） |

stopped 的原因决定处置：`user`（用户停的）别动，除非用户要求恢复；`model`（自己 TaskStop 的）；`interrupted`（宿主进程退出）通常应恢复；`provider`（登录过期、模型不在计划、配额上限等确定性模型侧错误）按错误块提示与用户解决后恢复；`superseded` 是被 AmendWorkflow 接替的旧 run 状态，不可恢复，其继任者才是活着的 run。

### 4.6 修订：AmendWorkflow

run 明知跑错了，别干等跑完、也别停下不管——修复点之后的全部工作两种等法都要重付。**立即对运行中的 run 调 AmendWorkflow**：它会停住前驱并结算，无需先 TaskStop、也不要等完成通知。

AmendWorkflow 可修订本项目任何状态的 run（errored、stopped、completed 或还在跑）：启动一个新 run 接替旧的，按命名子代理逐条匹配 **byte 相同**的 ask 指令，把已完工的工作零 token 导入——只有改动的部分真跑。被接替的旧 run 不再发自己的通知，amend 结果同时给出新旧两个 run。

缓存有一条边界规则，先翻译成人话：**修订版一旦真的动了工作区，之前"看过现场"的步骤就不能再用旧缓存交差了。** 具体说：修订 run 里第一次真实写工作区（live 子代理写文件，或 live world.run 执行命令）之后，此前缓存的 world 读（files/git 观察）和那些指令里**读过文件、跑过命令的 ask**（它们的答案依赖工作区状态）都改为真跑；**只凭知识作答、没碰过工作区的 ask** 仍走缓存。道理不难逆推：写入之后，缓存里"当时读到的内容"不再反映现实（这句"为什么"是按规则逆推的解释，调研原文只给了规则本身）。

两行对比，感受"便宜"与"重付"的分界：

- 修订只改了汇总报告的措辞——没有任何步骤写过工作区 → 所有 byte 相同的 ask 免费导入，只有改动处真跑；
- 修订让 fixer 在循环里改了源码（第一次真实写工作区）→ 之前评审者"读过代码"的那些 ask 全部真跑重付，纯作答的 ask 照旧走缓存。

修订要便宜，就把可调常数（阈值、轮数上限）**留在脚本控制流里、不插进 ask 文本**：把一个数插进 prompt，调它会改写每条提到它的 ask，从第一条未命中缓存起连同下游全部重付；调控制流里的常数只改变循环退出点，之前各轮全部从缓存结算。

两个细节：path 的字节与 run 已跑内容相同时被拒绝为 `script_unchanged`（什么都不停、什么都不建——多半是 Edit 没落盘）；只改 max_concurrency 或 subagent_model 是真变更可通过，且**只带 run_id 与 max_concurrency、对还在跑的 run 调用是原位调优**（同一 run、不停不重跑）。

权限上：本会话启动的 run 修订（含运行中）不弹确认窗；用户手动停的或别的会话启动的 run 要先问用户。

### 4.7 恢复：ResumeWorkflowRun

stopped（非 superseded）的 run 可以原样续跑：同一 run ID、同一脚本，无需重建。4.5 的处置表已说明哪些 stopped 该恢复。

### 4.8 保存复用：SaveWorkflow

一个脚本如果换输入还会再跑，值得存成可按名复用的工作流。但**绝不能未经请求就 SaveWorkflow**：想存时先用一句话说明想存什么、为什么，停下等用户同意；用户明确要求保存时才调用。一次性脚本不值得建议保存。

字段要点：name 是文件安全标识（复用同名即覆盖更新）；description 与 whenToUse 必填，写给没见过本次对话的读者；scope 必填无默认——引用了仓库文件/命令/布局选 project（写入 `.zcode/workflows/<name>.dwf.ts`，随仓库提交、仅本项目可见），与项目无关选 global（写入 `~/.zcode/workflows/`，本机所有项目可用）；script 与 script_path 二选一；args 只声明 run 间会变的值（type 加可选 description/required/default），并作为将来每次调用的校验约定。

已保存的工作流经 ListSavedWorkflows 发现、经 CreateWorkflow 的 saved 来源按名运行（未知键、缺必填、类型错都在运行前被拒）。**运行已保存的工作流是唯一不需要 skill 已加载的调用**；写新工作流之前，应先查有没有现成的。

---

## 5. 适用场景决策清单

先回答"该不该有工作流"——这由用户是否点名决定，不由任务形状决定；再回答"脚本写成什么样"。

| 你的情况 | 该用什么 |
| --- | --- |
| 把一件事委托给一个代理去办 | Agent 工具 |
| 几个相互独立的查询/小任务，谁也不需要读谁的答案 | Agent 工具，并行发起 |
| 一条回复就能答的小事，用户没点名工作流 | 直接做——三行的小问题既不需要评审员也不需要确认者 |
| 多步骤、多子代理的任务，但用户没点名工作流 | Agent 或自己做——"长得像编排"不是理由 |
| 用户说了"用工作流""使用 workflow"，或输入了 /workflow | CreateWorkflow，无豁免、无"太小"例外 |

用户已点名工作流之后，任务呈三种形状时适合认真写脚本：

1. **前一步的结果喂给后续步骤**——流水线、先扇出后汇合；
2. **带停止条件的循环**——修到测试通过、优化到基准达标（循环必须设轮数上限，并把上一轮反馈带进下一轮 prompt）；
3. **按类型化结果分支的控制流**——如按 severity/verdict 走不同后续（给 ask 传自定义类型参数，字段配 JSDoc）。

再叠一层深度默认：独立无关的任务每项一个命名子代理并发跑；只有需要跨项一致裁决（如整批评级）时才共享一个子代理，并为其 FIFO 串行化付代价。

---

## 6. 典型模式速览

从 patterns.md 的十张模式卡片里挑最常用的六张（代码为示意）。

### 6.1 扇出评审：对一组文件问同一个独立问题

```ts
const files = await files.glob("src/**/*.ts")   // 大仓库先用 files.grep 收窄再扇出
const results = await Promise.all(files.map(p =>
  agent(`audit-${p}`).ask<Finding[]>(`只读审计 ${p} ……`)
))
```

问题互不相关、无共享、全并行时用。三个提醒：`agent(...)` 别提到 map 外面；grep 超上限是拒绝而非截断，路径清单要么完整要么没有；名字带路径不只是为了唯一性，也是 AmendWorkflow 重跑时的缓存键——改一个细节重跑，不会重新审计已干净的文件。

### 6.2 变更文件评审：审查进行中的改动

```ts
let changed: string[]
try { changed = await git.changedFiles("origin/main") }
catch { changed = await files.glob("src/**/*.ts") }   // 惯用法
// 逐文件并发评审，每个 finding 就地链一个全新确认者复核后上报
```

评审 PR / 工作区而非整棵树时用。评审者需要看"改动"而非"文件"时，按 path 取 git.diff 分发，避免单个 prompt 扛整个 changeset；发现须逐文件即时独立复核——评审者不得自证自己的发现。

### 6.3 计划↔评审循环：planner 记得试过什么，reviewer 记得反对过什么

```ts
const planner = agent("planner")
const reviewer = agent("reviewer")     // 循环外各建一次，跨轮复用累积上下文
let plan = await planner.ask<Plan>("为 X 写实现计划……")
for (let round = 1; round <= MAX_ROUNDS; round++) {
  const v = await reviewer.ask<{ approved: boolean; critique: string }>(
    "什么会弄坏这份计划、缺了什么？不要修改任何文件。"
  )
  if (v.approved) break
  plan = await planner.ask<Plan>(`针对这些意见重写：${v.critique}`)
}
```

第一次尝试很少就对、且有批评者能说清为什么的任务：实现计划、方案设计。reviewer 的 ask/persona 要写明永不改文件，防止它悄悄去"修"计划；计划涉及代码时要让它真去读代码。到最后一轮，常驻 reviewer 已锚定在自己早前的反对意见上——**终稿交给一双什么都没见过的眼睛**。

### 6.4 门控验证循环：子代理改，命令裁

```ts
const fixer = agent("fixer")                      // 跨轮复用：它记得自己试过什么
for (let round = 1; round <= MAX_ROUNDS; round++) {
  const t = await world.run("pnpm", ["test"])    // 快 tier 驱动循环
  if (t.exitCode === 0) {
    const b = await world.run("pnpm", ["build"])  // 强 tier 最后定案
    return { converged: b.exitCode === 0, rounds: round }
  }
  await fixer.ask(`测试失败，修复它。stderr：\n${t.stderr}`)  // 修复由 fixer 用写工具完成
}
return { converged: false, rounds: MAX_ROUNDS }   // 绝不空手 return
```

停止条件机器可查（构建、测试套件、证明检查器）、且子代理自称"通过"不可信时用。分工是**子代理做开放性修复、world.run 执行真实命令做裁决**（见 3.4 末尾关于读写命令的说明）。要点：非零退出是值不是异常；循环要同时读 stderr（有的检查器出了问题也 exit 0、只在 stderr 警告）；选哪个命令当门是仓库的事实，从 README/Makefile/package.json 读出来，不带习惯；返回值要能区分"第二轮通过"和"耗尽轮数放弃"，耗尽时也交出最佳尝试。

### 6.5 分阶段流水线：逐级收窄

```ts
phase("普查哪些模块在范围内")
const survey = await agent("surveyor").ask<{ modules: string[] }>("找出所有处理 X 的模块……")
phase("逐模块深挖")
const parts = await Promise.all(survey.modules.map(m =>
  agent(`analyst-${m}`).ask<ModuleReport>(`深挖模块 ${m} ……`)
))
phase("汇总去重成稿")
const finalReport = await agent("synthesizer").ask<string>("把以上发现去重合并成报告……")
```

每一步都在收窄或变形下一步素材的任务。类型参数（如 Survey）让 `survey.modules.map` 这种交接可被编译器检查；最后一级只给一个人——两个分析者可能从两个模块标记同一根因，只有读全量的人能合并。

### 6.6 逐条流水线：嵌进同一回调，别立 barrier

```ts
await Promise.all(changed.map(async (path) => {
  const m = await agent(`migrator-${path}`).ask<Migration>(`迁移 ${path} ……`)
  const c = await agent(`checker-${path}`).ask<Check>(`验证 ${path} 的迁移 ……`)
  // checker 嵌在同一回调：第一个文件被验证时，第 40 个还在改写
}))
```

后续阶段不需要看见前一阶段全貌的逐条任务（每文件迁移+检查、每文件评审+确认）。对比双 barrier 版本：要等最慢的迁移完才起第一个 checker，并发槽位在中间闲置。整个流水线**共用一个 phase 名**、不要在回调内按阶段再打 marker；一条失败只该损失一条——在回调内 catch（或用 Promise.allSettled）。

---

## 7. 常见误用

**编排与并发**

- ❌ 把 `agent(...)` 提到 map/循环外共享一个子代理做扇出 → 同一子代理上 ask 按 FIFO 排队，并行扇出静默变成串行队列，耗时等于逐条相加。✅ 条目互不相关就每条新建 `agent(`名-${p}`)`；只有需要跨条目判定一致时才共享。
- ❌ 运行期拼出重名子代理 → 第二个条目处弄死整个 run（固定同名字面量则在编译期即拒）。✅ 按条目命名，或全匿名。
- ❌ planner–reviewer 循环每轮新建子代理 → 第五轮以全价重学第四轮已知的一切。✅ 跨轮复用同一对子代理，最后补一个从未见过前几轮的独立评审。
- ❌ 无顺序依赖却逐个 await；一对一的两阶段之间放 Promise.all 屏障 → 串行墙钟；最慢的评审员拦住全部确认者、并发槽空转。✅ 按条目链式衔接两阶段，只在真正需要全量的步骤（统一分级、跨文件去重）汇合。
- ❌ 循环不设轮数上限 → harness 不强制节点上限，跑飞的循环只能等用户取消。✅ 轮数上限；"找出 bug"这类没有天然规模的任务（有界发现模式）再加两道护栏：**干轮即 break**（本轮没有任何新条目就收手，防空转）和**用"全部见过"的 Set 去重**。后者的意思：猎手每轮上报发现，你要在下一轮 prompt 里告诉它"这些已经见过，找新的"——这份清单必须收录**上报过的一切**（包括被你拒绝的），而不是只收录最终保留的；只用"保留列表"去重，被拒的发现不在清单里，猎手下一轮原样再报，每轮重现、永不收敛。示意：

```ts
const seen = new Set<string>()             // 记住「上报过的一切」，含被拒的
for (let round = 1; round <= MAX_ROUNDS; round++) {
  const found = await hunter.ask<Finding[]>(
    `找出不在已见清单里的新问题。已见：${[...seen].join("；")}`
  )
  const fresh = found.filter(f => !seen.has(f.issue))
  if (fresh.length === 0) break            // 干轮：没有新条目就收手
  for (const f of fresh) seen.add(f.issue) // 见过就进 Set，之后采不采纳都不会再报
}
```

**花钱方式**

- ❌ 把整份文件内容插进 prompt → 花 token 告诉子代理它自己的文件工具就能读的东西。✅ 传路径不传内容，结果类型保持窄。
- ❌ 让子代理跑测试再汇报是否通过 → 为一个 exit code 付一整个会话，还信任了可伪造的通过声明。✅ world.run 分支退出码。
- ❌ 把阈值、轮数上限等可调常数插进 ask 文本 → AmendWorkflow 调这个数会改写所有提到它的 prompt，缓存从第一条起 miss、下游全部重付。✅ 常数留在脚本控制流里——子代理要的是结论和反馈，几乎从不需要数字本身。
- ❌ 提交前不试跑 → 烧一次完整 run 去发现一个拼写错误。✅ EvalWorkflowSnippet 同步试跑固定逻辑（glob 返回、解析函数、门控谓词），顺便测出 timeoutMs 该写多少。

**质量与诚实**

- ❌ 问评审者"这好不好" → 被要求批准的评审员就会批准。✅ 问"什么会弄坏它、缺什么、用自己的话复述方案"，让反对成为容易的动作。
- ❌ 直接报告未确认的发现 → 用户分不清"已见"与"疑似"。✅ 独立复核；没通过的标 unconfirmed 而非删掉。
- ❌ 因慢而跳过仓库里已有的检查，塞进 notCovered 交差 → 给未验证的工作套诚实外皮。✅ 所隐含的最强检查在 return 前真跑至少一次；notCovered 只放真的没法查的。
- ❌ 评审循环+终审+逐条确认+读者代读叠在一个交付物上 → 四个会话重读同一份工作；world.run 已定的结论不再派确认者。✅ 一个交付物一种核验机制，至多两种且说得出理由。
- ❌ persona 只写"让检查通过" → 对过不去的检查，伪造通过成了顺从解。✅ 补一句"过不去或指令矛盾就直说并 escalate"。

**交付与生命周期**

- ❌ return 裸数组 / 只 return 不发布产物 → 主代理每次即兴编交付形状；用户只得到转述、没有可留的东西。✅ WorkflowReport 四字段 + 发布交付物（多个时标 primary）。
- ❌ CSV 再加同数据的表格、没人盯着的短 run 配仪表盘 → 第二张卡片是噪音。✅ 常见 run 只发一个交付物，必要时一个仪表盘——仪表盘是给盯着 run 的人的。
- ❌ phase 用机器词汇或不写阶段标记 → 用户批准一张对自己的工作只字不提的图、三十张卡没有故事。✅ 用用户语言写"这阶段为用户做成什么"。
- ❌ run 明知跑错还干等、或停下不管；收到编译诊断后整段重贴脚本。✅ 立即 AmendWorkflow；Edit 脚本文件后以 path 重交。
- ❌ 未经请求就 SaveWorkflow。✅ 先一句话说明想存什么、为什么，等用户同意。

---

## 附：材料来源与可信度说明

本文机制事实整理自 dynamic-workflows skill 文档的调研摘录：SKILL.md（导言、The bar、§1–§16）、同目录 patterns.md 的模式卡片与 examples.md 的实例；少数工具行为细节（ListWorkflowRuns 每行带 tokens spent、GetWorkflowRun 含 token usage、skill 经 Skill 工具加载）来自撰写时所在会话可见的工具说明。调研摘录的原始出处是调研者机器上的 ZCode 资源目录（`D:/Development/ZCode/resources/glm/packages/bundled-skills/skills/dynamic-workflows/`）——这个路径在其他机器上并不存在，对应位置随 ZCode 的安装与分发方式而异，材料未给出。想在动手前核对原文，两条可行路子：在 ZCode 会话里让主代理加载 dynamic-workflows skill（它携带的正是这套规则，可以直接问它要原文内容）；或在本机的 ZCode 安装/资源目录下搜索 `skills/dynamic-workflows/`。

文中代码均为**示意写法**，用于讲清机制；API 的确切签名（如 ask 的调用形式、artifact 的参数细节、WorkflowReport 字段的确切拼写）调研材料未逐字给出。文中凡标注"调研材料未说明/未提及"之处，均为材料未覆盖的空白——不是已确认不存在，也不是本文的推测；明确标为"建议"或"逆推"的少数句子是标注过的推断。
