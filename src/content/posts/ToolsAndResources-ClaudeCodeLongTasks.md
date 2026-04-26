---
title: "【学习笔记】Claude Code 长任务功能笔记：/loop 与 Ralph Loop 详解"
published: 2026-04-26
description: "Claude Code 长任务功能概览，涵盖 /loop、Ralph Loop、Routines 等机制的原理解析、使用案例与选型建议。"
lang: zh
tags: ["学习笔记", "工具分享"]
---

> 整理时间：2026-04-26
> 涵盖内容：长任务功能概览、`/loop` 与 Ralph Loop 原理与对比、使用案例、如何结束循环、Windows 支持

---

## 一、Claude Code 支持长任务的功能总览

| 功能 | 运行环境 | 持久性 | 典型场景 |
|---|---|---|---|
| `/loop` | 本地终端 | 会话级（7 天过期） | PR 巡检、部署监控 |
| **Ralph Loop** | 本地终端 | 会话级（迭代次数限制） | 框架迁移、批量重构 |
| 背景 Agent | 本地终端 | 会话级 | 后台研究、代码分析 |
| **Routines** | **云端** | **持久化（关机也能跑）** | 自动修 Bug、定时文档更新 |
| `/schedule` | 云端 | 持久化 | 定时构建、周期报告 |
| 跨会话模式 | 本地 | 跨会话 | 长期项目持续推进 |

### 1. `/loop` 定时循环任务

- **本质**：内置 Cron 式定时任务调度器
- **用法**：`/loop [间隔] [prompt]`，如 `/loop 30m 检查所有 open 的 PR`
- **限制**：单会话最多 50 个并发任务，7 天后自动过期，会话关闭时终止
- **适用场景**：PR 巡检、部署监控、代码质量扫描、日报生成

### 2. Ralph Loop（Ralph Wiggum 插件）

- **本质**：基于 Stop Hook 的自主迭代循环插件
- **用法**：`/ralph-loop "<prompt>" --max-iterations N`，如 `/ralph-loop "Migrate tests to Vitest" --max-iterations 50`
- **限制**：默认最多 20 次迭代，单会话运行，会话关闭即停止
- **适用场景**：大规模重构、框架迁移、批量操作等有明确完成标准的机械性任务

### 3. 背景 Agent（Background Agent）

- **本质**：一次性后台任务，启动后可继续做其他工作
- **配合 Git Worktree**（`claude --worktree`）：每个后台 Agent 在独立代码副本中工作，互不干扰
- **适用场景**：研究任务、代码分析、大型重构

### 4. Routines（常规任务）🆕 2026.04

- **本质**：持久化、托管在 Anthropic 云端的智能体，**关机也能干活**
- **三种触发方式**：
  - **API 触发**：专属 HTTP 端点 + 上下文透传（传入报错日志自动修 Bug）
  - **GitHub 事件触发**：监听 PR/Issue，可按作者/分支/标签精细过滤
  - **定时触发**：Cron 表达式，适合文档防腐、Backlog 维护
- **安全机制**：云端沙箱、默认只能向 `claude/` 前缀分支推送、操作以本人身份执行
- **配额**：Pro 每天 5 次，Max 15 次，企业版 25 次

### 5. `/schedule` 云端定时任务

- 支持在 Anthropic 托管的云基础设施上运行
- 可关联代码仓库、配置环境变量和连接器

### 6. 跨会话状态保持（KAIROS 模式）

- 任务存储在 `~/.claude/tasks/`，支持会话重启后恢复
- 能记住长时间、多会话工作中的重要笔记

### 7. Context Compaction（上下文自动压缩）

- 超长会话中自动压缩上下文，保持连贯性
- 配合 1M Token 上下文窗口（Max/Team/Enterprise）

### 8. Agent SDK + Subagents

- Python/TypeScript SDK 构建自定义 Agent
- 多子 Agent 并行协作，每个子 Agent 拥有独立会话

---

## 二、Ralph Loop 原理详解

### 起源

Ralph Loop 来源于开发者 Geoffrey Huntley 提出的一个简单想法：

```bash
# 本质就是一个 Bash 循环
while :; do cat PROMPT.md | claude ; done
```

Anthropic 将其吸收为官方插件 **Ralph Wiggum**（以《辛普森一家》角色命名），加入了安全控制和更好的交互体验。

### 核心原理：Stop Hook 拦截机制

Ralph Loop 的关键在于利用 Claude Code 的 **Hooks 系统** 中的 **Stop Hook**：

```
用户输入 prompt + 完成标准
       ↓
Claude 开始执行任务（第 1 轮）
       ↓
Claude 认为任务完成，尝试退出会话
       ↓
🪝 Stop Hook 拦截退出（返回 exit code 2）
       ↓
Hook 重新注入原始 prompt
       ↓
Claude 看到修改过的文件和 git 历史，继续迭代（第 2 轮）
       ↓
...重复直到满足完成标准或达到最大迭代次数
```

### 三个核心 Hook 协作

| Hook | 触发时机 | 作用 |
|---|---|---|
| `ralph-continuation`（Stop） | Claude 尝试退出时 | 阻止退出（exit code 2），推进迭代计数，注入自适应策略 |
| `ralph-compact`（PreCompact） | 上下文压缩前 | 保存循环状态，确保压缩后仍能继续循环 |
| 初始化脚本 | 循环开始时 | 设置环境变量、初始化迭代计数器 |

### 自适应策略

当 Claude 多次尝试仍未完成时，Stop Hook 会注入**自适应策略**帮助突破僵局：

- 提示 Claude 尝试不同的方法，而非重复失败的尝试
- 建议将任务拆分为更小的增量步骤
- 鼓励提交中间进度以保留工作成果

### 上下文管理

- **单会话累积**：所有迭代在同一个会话中运行，Claude 能看到之前的完整对话
- **Compaction 保护**：通过 `ralph-compact` Hook，即使触发上下文压缩，循环状态也不会丢失
- **文件系统作为记忆**：每轮迭代修改的文件和 git 提交历史是跨迭代连续性的主要载体

### 安全控制

- **`--max-iterations N`**：限制最大迭代次数（默认 20），防止无限循环烧 token
- **`--completion-promise "text"`**：当 Claude 输出指定文本时停止（精确字符串匹配，不太可靠）
- **`/cancel-ralph`**：手动取消正在运行的循环

### 已知问题

- 跨终端会话串扰（Issue #15047）
- Docker 兼容性问题（Issue #31568）
- Windows 上有未文档化的 `jq` 依赖（Issue #14817）
- 社区倾向认为 Bash 独立进程方式比插件的单会话模式更稳健

---

## 三、`/loop` 的原理详解

### 底层机制

`/loop` 是内置 bundled skill，底层使用三个 Cron 工具：

| 工具 | 作用 |
|---|---|
| `CronCreate` | 创建定时任务（cron 表达式 + prompt + 是否重复） |
| `CronList` | 列出所有已调度任务 |
| `CronDelete` | 按 8 字符 ID 取消任务 |

### 执行流程

```
用户输入 /loop 5m check deploy
       ↓
Claude 将间隔转换为 cron 表达式（如 */5 * * * *）
       ↓
调用 CronCreate 注册任务，返回 8 字符任务 ID
       ↓
调度器每秒检查到期任务 → 排入低优先级队列
       ↓
Claude 空闲时执行 prompt
       ↓
等待间隔 → 重复
```

### 关键设计

1. **不是独立进程**：调度器运行在会话内部，不是系统级 cron
2. **空闲时才触发**：Claude 忙碌时，到期任务等待当前回合结束
3. **不补执行**：错过多个间隔只执行一次
4. **Jitter 抖动**：循环任务最多延迟 10% 周期（上限 15 分钟）
5. **动态间隔模式**：不指定间隔时，Claude 根据观察动态选择 1min~1h 等待；可能使用 Monitor 工具避免轮询
6. **7 天自动过期**：到期后最后执行一次然后自删除

### 自定义默认 Prompt

| 路径 | 作用域 |
|---|---|
| `.claude/loop.md` | 项目级（优先） |
| `~/.claude/loop.md` | 用户级 |

### 限制

- 会话关闭/重启时任务停止
- 最多 50 个并发任务
- 秒级间隔向上取整到分钟
- 可通过 `CLAUDE_CODE_DISABLE_CRON=1` 禁用

---

## 四、Ralph Loop 与 `/loop` 的核心区别

### 对比表

| 维度 | Ralph Loop | `/loop` |
|---|---|---|
| 来源 | 插件（需安装） | 内置功能（开箱即用） |
| 循环机制 | Stop Hook 拦截退出，重新注入 prompt | Cron 定时调度，按间隔触发 |
| 会话模型 | 单会话持续运行 | 多会话，每次独立 |
| 上下文管理 | 累积（可能膨胀，有 compaction 保护） | 每次干净启动，通过文件/git 保持连续性 |
| 触发方式 | 完成后立即下一轮（连续） | 按固定时间间隔（有等待） |
| 迭代速度 | 连续执行，无等待 | 有间隔等待 |
| 可靠性 | 有已知兼容性问题 | 更稳定可控 |
| 适合场景 | 机械性密集迭代（重构、迁移） | 监控/巡检类任务 |
| 成本 | 较高（连续消耗 token） | 相对可控（按间隔分散） |
| 智能程度 | 每轮自适应策略调整 | 可动态选择间隔或使用 Monitor 工具 |

### 如何选择？

- **选 Ralph Loop**：有明确的完成标准、需要连续密集迭代、任务本质是机械性重复（如迁移框架、补全测试）
- **选 `/loop`**：需要周期性监控/巡检、任务之间需要时间间隔、更看重稳定性和可控性

---

## 五、如何结束 `/loop`

当你启动了一个 `/loop` 后，有以下 6 种方式可以结束它：

### 方法 1：按 `Esc` 键（最常用）

在 `/loop` 等待下一次触发期间，按 `Esc` 键即可清除待执行的唤醒，循环不再触发。

```
/loop 5m check deploy
  → 第 1 次执行完成
  → 等待 5 分钟...
  → 按 Esc ✅ 循环停止
```

> ⚠️ **注意**：`Esc` 只能停止由 `/loop` 命令直接创建的循环。如果你是通过自然语言让 Claude 创建的定时任务（如 "每 10 分钟检查一下 CI"），`Esc` 不会影响它们。

### 方法 2：自然语言取消

直接告诉 Claude 取消指定的任务：

```
> cancel the deploy check job
```

Claude 会调用 `CronDelete` 工具删除对应任务。

### 方法 3：查看并管理所有任务

先列出当前所有定时任务：

```
> what scheduled tasks do I have?
```

Claude 会返回所有任务的 ID、时间表和 prompt，然后你可以按 ID 取消：

```
> cancel task a1b2c3d4
```

### 方法 4：关闭会话

直接关闭终端或退出 Claude Code，所有会话级任务自动停止。重新打开后不会恢复（除非使用 `claude --resume` 恢复未过期的任务）。

### 方法 5：等待 7 天自动过期

无需任何操作。循环任务创建 7 天后会自动执行最后一次，然后自删除。

### 方法 6：环境变量全局禁用

如果需要完全禁用调度器：

```bash
export CLAUDE_CODE_DISABLE_CRON=1
```

设置后，所有定时任务停止触发，`/loop` 命令也不可用。

### `/loop` 结束方式速查表

| 方法 | 操作 | 速度 | 影响范围 |
|---|---|---|---|
| **按 Esc** | 等待期间按 `Esc` | 即时 | 仅 `/loop` 命令创建的循环 |
| **自然语言** | `cancel the xxx job` | 需 Claude 响应 | 指定任务 |
| **查看管理** | `what scheduled tasks do I have?` | 需两步操作 | 可精确控制每个任务 |
| **关闭会话** | 关闭终端 | 即时 | 所有会话级任务 |
| **自动过期** | 无需操作 | 7 天后 | 到期的循环任务 |
| **全局禁用** | `CLAUDE_CODE_DISABLE_CRON=1` | 需重启会话 | 所有定时任务 |

---

## 六、如何结束 Ralph Loop

当你启动了一个 Ralph Loop 后，有以下 4 种方式可以结束它：

### 方法 1：`/cancel-ralph` 命令（最常用）

在 Claude Code 中直接输入取消命令：

```
> /cancel-ralph
```

这会立即终止正在运行的 Ralph Loop 循环。

### 方法 2：设置 `--max-iterations` 上限（预防式）

在启动时就设定最大迭代次数，让循环自然停止：

```bash
# 最多迭代 10 次后自动停止
/ralph-loop "Add JSDoc to all functions" --max-iterations 10
```

默认上限为 20 次。**始终建议设置此参数**，这是最可靠的安全网。

### 方法 3：设置 `--completion-promise` 完成承诺

指定一个完成标志文本，当 Claude 的输出中包含该文本时自动停止：

```bash
/ralph-loop "Migrate tests to Vitest" --max-iterations 50 --completion-promise "All tests migrated"
```

> ⚠️ **注意**：completion-promise 使用精确字符串匹配，可靠性不高。Claude 可能输出类似但不完全相同的文本导致无法匹配。**不要仅依赖此方式**，务必同时设置 `--max-iterations`。

### 方法 4：关闭终端会话

直接关闭终端或退出 Claude Code，Ralph Loop 立即停止（因为它是会话级的）。

### Ralph Loop 结束方式速查表

| 方法 | 操作 | 时机 | 可靠性 |
|---|---|---|---|
| **`/cancel-ralph`** | 输入命令 | 运行中随时 | ✅ 最可靠 |
| **`--max-iterations`** | 启动时设置参数 | 达到迭代上限 | ✅ 最可靠（推荐） |
| **`--completion-promise`** | 启动时设置参数 | Claude 输出匹配文本 | ⚠️ 不太可靠 |
| **关闭终端** | 关闭会话 | 随时 | ✅ 可靠 |

> 💡 **最佳实践**：始终设置 `--max-iterations` 作为安全网，需要提前结束时用 `/cancel-ralph`。不要仅依赖 `--completion-promise`。

---

## 七、`/loop` 与 Ralph Loop 使用案例

### Ralph Loop 使用案例

#### 案例 1：框架迁移

```bash
# 将所有测试从 Jest 迁移到 Vitest，最多迭代 50 次
/ralph-loop "Migrate all tests from Jest to Vitest" --max-iterations 50 --completion-promise "All tests migrated"
```

**过程**：Claude 逐个文件迁移 → 跑测试 → 发现失败 → 修复 → 继续下一批，直到全部通过。

#### 案例 2：批量添加文档注释

```bash
# 为所有导出函数添加 JSDoc 注释
/ralph-loop "Add JSDoc comments to all exported functions in src/utils/" --max-iterations 10
```

#### 案例 3：过夜构建项目

```bash
# 睡前启动，让 Claude 通宵搭建项目
/ralph-loop "Build a REST API for a task management app with Express and PostgreSQL" --max-iterations 30
```

> 💡 **提示**：完成后用 `git diff` 检查所有变更，确认质量。

#### 案例 4：安全扫描与修复

```bash
# 循环扫描并修复安全问题
/ralph-loop "Scan src/ for security vulnerabilities and fix them. Run npm audit after each fix." --max-iterations 20
```

---

### `/loop` 使用案例

#### 案例 1：部署监控（固定间隔）

```bash
# 每 5 分钟检查部署状态
/loop 5m check if the deployment finished and tell me what happened
```

#### 案例 2：PR 巡检（动态间隔）

```bash
# Claude 自动选择间隔：PR 活跃时频繁检查，安静时拉长间隔
/loop check whether CI passed and address any review comments
```

#### 案例 3：CI 流水线监控

```bash
# 每 3 分钟检查 CI，通过后自动停止
/loop 3m check if the CI run on the current branch passed. If it did, stop looping and summarize the results.
```

#### 案例 4：定时执行 Skill

```bash
# 每 30 分钟执行一次代码审查 skill
/loop 30m /review

# 每 1 小时执行安全审查
/loop 1h /security-review
```

#### 案例 5：裸 `/loop`（内置维护模式）

```bash
# 无 prompt，Claude 自动执行维护任务：
# 1. 继续未完成的工作
# 2. 处理当前分支的 PR（评论、CI 失败、合并冲突）
# 3. 运行清理（bug 猎杀、代码简化）
/loop
```

#### 案例 6：自定义默认维护 Prompt

在 `.claude/loop.md` 中写入：

```markdown
Check the `release/next` PR. If CI is red, pull the failing job log,
diagnose, and push a minimal fix. If new review comments have arrived,
address each one and resolve the thread. If everything is green and
quiet, say so in one line.
```

然后直接运行 `/loop` 即可。

#### 案例 7：一次性提醒（非循环）

```bash
# 下午 3 点提醒推送分支
remind me at 3pm to push the release branch

# 45 分钟后检查集成测试
in 45 minutes, check whether the integration tests passed
```

#### 案例 8：On-Call 值班分诊

```bash
# 每 15 分钟检查新工单，自动提出解决方案
/loop 15m check for new tickets in the on-call queue, summarize each, propose a solution or next steps, post to Slack
```

---

## 八、Windows 支持情况

### ✅ 可以使用

Claude Code 支持原生 Windows 终端，`/loop` 在 Windows 上完全可用。

### 支持的环境

| 环境 | 说明 |
|---|---|
| PowerShell / CMD | 原生支持，内部使用 Git Bash 执行命令 |
| Git Bash | 安装 Git for Windows 后可直接使用 |
| WSL | 完全支持，稳定性最佳 |

### 注意事项

1. **按键输入延迟**：原生 Windows CLI 可能存在延迟（Issue #41501），WSL 不受影响
2. **依赖 Git Bash**：需确保已安装 Git for Windows
3. **会话限制不变**：终端关闭时所有任务停止
4. **推荐 WSL**：追求最佳稳定性建议使用 WSL
5. **Ralph Loop 在 Windows 上**：有未文档化的 `jq` 依赖可能导致问题，建议使用 WSL 或先安装 jq

---

## 九、三种调度方式对比（官方）

| | Cloud（Routines） | Desktop | `/loop` |
|---|---|---|---|
| 运行位置 | Anthropic 云端 | 本地机器 | 本地机器 |
| 需要开机 | 否 | 是 | 是 |
| 需要打开会话 | 否 | 否 | 是 |
| 跨重启持久化 | 是 | 是 | `--resume` 恢复未过期任务 |
| 访问本地文件 | 否（全新克隆） | 是 | 是 |
| MCP 服务器 | 按任务配置连接器 | 配置文件 + 连接器 | 继承当前会话 |
| 最小间隔 | 1 小时 | 1 分钟 | 1 分钟 |

> **选择建议**：关机后仍需执行 → **Routines**；需要本地文件访问且无人值守 → **Desktop**；会话内快速轮询 → **`/loop`**；密集机械性迭代 → **Ralph Loop**
