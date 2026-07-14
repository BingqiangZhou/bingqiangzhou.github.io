---
title: 【学习笔记】Chrome DevTools MCP v1.6.0 更新笔记
published: 2026-07-15
description: 梳理 chrome-devtools-mcp v1.6.0 的主要变更（10 项新功能、11 项修复、性能优化与内部重构），并重点解读修复安全漏洞后引入的三种文件路径验证模式，以及 MCP 客户端如何声明 roots 能力来约束服务端的写入边界。
lang: zh
tags: [学习笔记, 工具分享]
---

> Chrome DevTools MCP 是 Google Chrome DevTools 团队官方推出的 MCP 服务器，
> 让 AI 编程助手（Claude、Cursor、Copilot、Gemini 等）能够直接控制并检查 Chrome 浏览器。
>
> GitHub 仓库：[ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) (46.9k+ stars)
> npm 包名：`chrome-devtools-mcp`

> **📌 重点关注**：v1.6.0 最值得留意的变更，是修复一个安全漏洞后引入的 **`roots` 能力协商** 与 **`--allow-unrestricted-paths`** 参数——它们直接决定服务端能向哪些路径写文件。如果时间有限，建议优先阅读[「二、安全路径验证」](#二安全路径验证重点变更)与[「五、路径验证决策流程图」](#五路径验证决策流程图)。

---

## 一、v1.6.0 主要变更（2026-07-14）

v1.6.0 是近期更新幅度最大的版本，包含 **10 项新功能/改进**、**11 项修复**、**1 项性能优化** 以及大量内部重构。

### 1.1 新功能（Features）

| 功能 | PR | 说明 |
|------|-----|------|
| `experimentalGcfFormat` 标志 | #2235 | 支持 GCF 编码的工具响应，为结构化输出提供新的数据格式选项 |
| 堆快照详情增强 | #2325 | `get_heapsnapshot_details` 现在可打印**对象数量**和**总大小**，便于快速评估内存占用 |
| `--allow-unrestricted-paths` 配置 | #2296 | 新增 CLI 参数，控制当客户端未协商 `roots` 能力时的路径验证行为（详见第二章） |
| 堆快照聚合过滤 | #2323 | 堆快照的聚合操作支持 `filter` 参数，可以按条件筛选聚合结果 |
| Lighthouse 13.4.0 升级 | #2317 | 将内置 Lighthouse 升级到最新版本，获取最新的性能审计能力和基线数据 |

### 1.2 修复（Fixes）

| 修复项 | PR | 说明 |
|--------|-----|------|
| `.gz` 后缀强制 | #2305 | 性能工具输出文件强制使用 `.gz` 后缀，替代之前不一致的 `json.gz` |
| 保持选中页面不切换 | #2328 / #2304 | 当选中页面仍处于打开状态时，不再意外回退到第一个页面 |
| 跨重连保持页面 ID 唯一 | #2345 | 浏览器重连后，页面 ID 保持唯一性，避免并发会话中的 ID 冲突 |
| 分页起始页修正 | #2359 | `list_network_requests` 和 `list_console_messages` 的分页从第 0 页开始（此前跳过了第 0 页） |
| 修饰键释放 | #2347 | `press_key` 按键事件失败时，正确释放已按下的修饰键，避免键盘状态卡住 |
| 选中页面替换提示 | #2308 / #2304 | 当选中的页面被自动替换为回退页面时，向用户报告该事件 |
| 页面 ID 解析修正 | #2332 / #2304 | 仅在已列出的页面中解析页面 ID，避免引用已关闭页面的幽灵 ID |
| 快照元素 ID 解析 | #2295 | 在正确的快照上解析元素 ID，修复因快照过时导致的元素引用错误 |
| Telemetry 枚举值解析 | #2315 | 修复遥测数据中枚举值无法通过嵌套 schema wrapper 解析的问题 |
| 等待守护进程启动 | #2327 | 确保 daemon 完全启动后再继续执行，避免时序竞态问题 |

### 1.3 性能优化

| 优化项 | PR | 说明 |
|--------|-----|------|
| 根路径解析并发 I/O | #2279 | 根路径解析支持并发 I/O，减少启动时的文件系统等待时间 |

### 1.4 内部重构

v1.6.0 包含大量代码重构（涉及 12 个 PR），核心方向包括：

- 将 DevTools universe 逻辑迁移到 `McpPage` 类，使每个页面独立持有自己的 DevTools 状态
- 让 collectors（数据收集器）按页面工作，而非全局共享
- 清理 `McpContext` 的 getter 方法，简化上下文接口
- 统一使用 `response page` 进行数据格式化

主要目标是**支持更稳健的并发会话**和更清晰的代码架构。

---

## 二、安全路径验证（重点变更）

### 2.1 背景

v1.6.0 修复了一个通过 [Google 开源安全悬赏](https://bughunters.google.com/open-source-security) 报告的安全漏洞：

> **当 MCP 客户端未协商（negotiate）`roots` 能力时，服务端的所有文件写入工具可以被用来向系统任意路径写入文件，且没有任何报错。**

一个恶意或配置不当的 AI agent 可以通过 `take_screenshot`、`get_network_request` 等工具将文件写入到任意系统路径。

### 2.2 受影响的工具

以下涉及文件读写的工具均受路径验证约束：

| 工具 | 操作 |
|------|------|
| `take_screenshot` | 截图保存（`filePath` 参数） |
| `take_snapshot` | 页面快照保存（`filePath` 参数） |
| `screencast_start` | 屏幕录制输出（`filePath` 参数） |
| `get_network_request` | 网络请求/响应体保存（`requestFilePath` / `responseFilePath`） |
| `performance_start_trace` / `performance_stop_trace` | 性能 trace 文件 |
| `lighthouse_audit` | Lighthouse 审计报告 |
| `upload_file` | 上传文件的读取路径 |
| `evaluate_script` | 支持 `filePath` 参数时 |
| `take_heapsnapshot` 系列 | 堆快照文件 |

### 2.3 三种路径验证模式

#### 模式 A：客户端声明了 `roots` 能力（最安全，默认）

大多数主流 MCP 客户端（Claude Desktop、Cursor、VS Code Copilot 等）会在 MCP 初始化时自动协商 `roots` 能力，告知服务端自己的工作目录范围。

```
客户端初始化 → 声明 roots: ["/home/user/project", "/home/user/docs"]
              → 服务端验证文件路径必须在这些 roots 内
```

- 路径在 roots 内 → **允许写入**
- 路径在 roots 外 → **拒绝（Access denied）**

#### 模式 B：客户端未声明 `roots`（v1.6.0 新默认行为）

当客户端没有协商 `roots` 能力时，**不再跳过验证**，而是将写入路径限制在 OS 临时目录（`os.tmpdir()`）内：

| 目标路径 | 结果 |
|----------|------|
| `/tmp/screenshot.png`（临时目录内） | 允许 |
| `~/Desktop/test.png`（临时目录外） | 拒绝 — Access denied |
| `/etc/anyfile` | 拒绝 — Access denied |

同时服务端输出控制台警告：

```
[chrome-devtools-mcp] The connecting client did not negotiate the MCP roots
capability. File-writing tools will be restricted to the OS temp directory.
To restore the previous unrestricted behavior, start the server with
--allow-unrestricted-paths.
```

#### 模式 C：显式允许不受限路径

通过 `--allow-unrestricted-paths` 参数恢复旧行为（仅建议在受信任的本地环境中使用）：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--allow-unrestricted-paths"
      ]
    }
  }
}
```

### 2.4 核心代码变更

```typescript
// 新增配置选项
interface McpContextOptions {
  allowUnrestrictedPaths?: boolean;
}

// roots() 方法：始终返回至少包含临时目录的 roots
roots(): Root[] {
  return [
    ...(this.#roots ?? []),    // 客户端配置的 roots（可能为空数组）
    uri: pathToFileURL(os.tmpdir()).href,
    name: 'temp',
  ];
}

// validatePath 方法：不再无条件跳过验证
async validatePath(filePath: string | undefined) {
  // 仅在显式启用 allowUnrestrictedPaths 时才跳过
  if (this.#roots === undefined && this.#allowUnrestrictedPaths) {
    return;
  }
  // 否则始终执行验证（roots() 至少包含 temp 目录）
  const roots = this.roots();
  // ... 验证 filePath 是否在 roots 范围内
}
```

---

## 三、如何声明 roots 能力

Roots 是 MCP 协议中定义的**客户端特性**（Client Feature），用于告诉服务端允许操作的文件系统边界。声明 roots 的过程发生在 MCP 的**初始化阶段（Initialization）**，由客户端自动完成——用户通常不需要手动干预。

### 3.1 协议层面的声明流程

**步骤 1：客户端发送 `initialize` 请求**，在 `capabilities` 字段中声明 `roots` 能力：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "roots": {
        "listChanged": true
      }
    },
    "clientInfo": {
      "name": "Claude Desktop",
      "version": "1.0.0"
    }
  }
}
```

- `roots.listChanged`：布尔值，表示当 roots 列表发生变化时，客户端是否会发送 `notifications/roots/list_changed` 通知。

**步骤 2：服务端回复自身能力后**，客户端发送 `notifications/initialized` 通知表示初始化完成。

**步骤 3：服务端发送 `roots/list` 请求**，客户端返回当前的 roots 列表：

```json
// 服务端请求
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "roots/list"
}

// 客户端响应
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "roots": [
      {
        "uri": "file:///home/user/projects/myproject",
        "name": "My Project"
      },
      {
        "uri": "file:///home/user/documents",
        "name": "Documents"
      }
    ]
  }
}
```

每个 root 包含：

- `uri`：根目录的 `file://` URI（必须为 `file://` 协议）
- `name`：可选的人类可读名称

**步骤 4：当 roots 发生变化时**（如用户打开了新项目），客户端发送变更通知：

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/roots/list_changed"
}
```

服务端收到后重新调用 `roots/list` 获取最新列表。

### 3.2 各主流客户端的 roots 行为

| 客户端 | 是否自动声明 roots | roots 来源 | 用户是否需要配置 |
|--------|-------------------|-----------|----------------|
| Claude Desktop | 是 | 当前打开的工作区/项目目录 | 否（自动） |
| Claude Code | 是 | 当前工作目录（CWD） | 否（自动） |
| Cursor | 是 | 当前打开的项目文件夹 | 否（自动） |
| VS Code Copilot | 是 | 当前打开的工作区根目录 | 否（自动） |
| Gemini CLI | 是 | 当前工作目录 | 否（自动） |
| JetBrains AI / Junie | 是 | 当前项目根目录 | 否（自动） |
| Windsurf | 是 | 当前工作区 | 否（自动） |
| 自定义/轻量客户端 | **不一定** | 取决于实现 | **可能需要手动实现** |

> 大多数主流客户端会根据当前打开的项目/工作区自动生成 roots 列表，用户无需手动配置。这也是使用主流客户端时路径验证「开箱即用」的原因。

### 3.3 自定义客户端如何声明 roots

如果你正在开发自己的 MCP 客户端，需要确保在 `initialize` 请求中包含 `roots` 能力，并正确响应 `roots/list` 请求。以下是 TypeScript 示例：

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const client = new Client(
  { name: "my-custom-client", version: "1.0.0" },
  { capabilities: { roots: { listChanged: true } } }
);

// 注册 roots/list 请求处理器
client.setRequestHandler(
  { method: "roots/list" },
  async () => ({
    roots: [
      {
        uri: "file:///home/user/myproject",
        name: "My Project",
      },
    ],
  })
);
```

---

## 四、相关配置选项速查

与 roots / 路径验证直接相关的 `chrome-devtools-mcp` 启动参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--allowUnrestrictedPaths` / `--allow-unrestricted-paths` | boolean | **false** | 禁用未协商 roots 时的默认路径限制（v1.6.0 新增） |
| `--allowedUrlPattern` | array | — | URL 白名单，仅允许加载匹配的资源 |
| `--blockedUrlPattern` | array | — | URL 黑名单，阻止加载匹配的资源 |
| `--redactNetworkHeaders` | boolean | false | 脱敏网络请求中的敏感 HTTP 头 |
| `--isolated` | boolean | false | 使用临时用户数据目录，关闭后自动清理 |

### 推荐安全配置

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--isolated",
        "--redact-network-headers"
      ]
    }
  }
}
```

- `--isolated`：每次使用临时 Chrome 配置目录，关闭后自动清理
- `--redact-network-headers`：自动移除 Cookie、Authorization 等敏感 HTTP 头
- 不加 `--allow-unrestricted-paths`：保持默认的严格路径验证

---

## 五、路径验证决策流程图

```
MCP 客户端连接 chrome-devtools-mcp
          │
          ▼
    客户端声明了 roots 能力？
         ╱           ╲
       是              否
        │               │
        ▼               ▼
  按 roots 列表验证    启用了 --allow-unrestricted-paths？
  路径在 roots 内？    ╱                    ╲
   ╱         ╲       是                      否
  允许       拒绝    │                        │
  (Access    (Access  ▼                        ▼
   denied)   denied) 跳过验证                限制在 OS 临时目录
                      允许任意路径              ╱              ╲
                      (恢复旧行为)           临时目录内       临时目录外
                                                │               │
                                                ▼               ▼
                                              允许            拒绝
                                                          (Access denied)
```
