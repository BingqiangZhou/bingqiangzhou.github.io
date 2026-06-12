---
title: 【工具分享】浏览器插件开发优化：从框架选择到实战技能全指南
published: 2026-06-05
description: 2025-2026 年浏览器插件开发全栈技能总结，涵盖框架选择、核心开发技能、调试与性能优化、测试 CI/CD、安全审计、AI 辅助开发等完整技术栈。
lang: zh
tags: ["工具分享", "学习笔记"]
---

> 2025-2026 年浏览器插件开发全栈技能总结。从框架选型到 AI 辅助开发，涵盖开发全流程的实战技能与工具推荐。

**更新时间：2026 年 6 月**

---

## 一、框架选择：2026 年主流方案对比

### Tier 1：全栈扩展框架

| 框架 | GitHub Stars | 打包器 | 核心优势 | 最佳场景 |
|------|-------------|--------|---------|---------|
| **[WXT](https://wxt.dev/)** | ~10K | Vite | 文件路由、跨浏览器最佳、HMR 最快（<100ms）| 新项目首选 |
| **[Plasmo](https://docs.plasmo.com/)** | ~13K | Parcel | React CSUI（Shadow DOM 隔离）、生态最大 | React 重度项目 |
| **[Extension.js](https://extension.js.org/)** | ~5K | Rspack | 零配置、跨浏览器一键构建 | 快速原型 |

### Tier 2：轻量构建插件

| 工具 | 定位 | 特点 |
|------|------|------|
| **[CRXJS](https://crxjs.dev/)** (`@crxjs/vite-plugin`) | Vite 插件，非框架 | HMR <100ms，零样板，仅 Chromium |
| **[create-chrome-ext](https://github.com/guocaoyi/create-chrome-ext)** | 脚手架工具 | 支持 React/Vue/Svelte/Solid 等多模板 |

### 关键对比

| 特性 | WXT | Plasmo | CRXJS | Extension.js |
|------|-----|--------|-------|-------------|
| HMR 速度 | <100ms | ~800ms（偶有不稳定）| <100ms | 快 |
| 跨浏览器 | Chrome/Firefox/Safari/Edge | Chrome/Firefox/Edge | 仅 Chromium | Chrome/Firefox/Edge |
| MV2 + MV3 | ✅ 自动转换 | ✅ | ✅ | ✅ |
| TypeScript | 一等支持 | 一等支持 | 标准支持 | 一等支持 |
| 内建状态管理 | ✅ Storage API | ✅ `@plasmohq/storage` | 无 | 无 |
| 内建消息通信 | ✅ | ✅ `@plasmohq/messaging` | 无 | 无 |
| 框架支持 | React/Vue/Svelte/Solid/Vanilla | React（一等）/Svelte/Vue | 任意 | React/Vue/Svelte/Preact/Vanilla |

**选型建议**：

- 🏆 **2026 年新项目首选 WXT**：最灵活、跨浏览器最佳、HMR 最快、Vite 生态
- 🎯 **React 深度使用选 Plasmo**：CSUI 注入、`@plasmohq/storage` + `@plasmohq/messaging` 生态完善
- ⚡ **需要极致轻量选 CRXJS**：仅 Vite 插件层，适合已有构建管线
- 🚀 **快速原型选 Extension.js**：零配置，`npx extension dev` 即可启动

### 快速开始

```bash
# WXT
npx wxt@latest init my-extension

# Plasmo
pnpm create plasmo

# CRXJS
npm create crxjs@latest

# Extension.js
npx extension dev https://github.com/example/sample
```

---

## 二、核心开发技能

### 1. 消息传递模式

MV3 中 Service Worker 是短暂的（空闲 ~30 秒后终止），消息传递是扩展各组件协作的命脉。

**一次性消息**：

```javascript
// 发送方（Content Script 或 Popup）
const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });

// 接收方（Service Worker）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SETTINGS") {
    chrome.storage.sync.get("settings").then(sendResponse);
    return true; // 异步 sendResponse 必须返回 true 保持通道
  }
});
```

**长连接（Port）**：

```javascript
// Content Script 连接 Service Worker
const port = chrome.runtime.connect({ name: "sync-channel" });
port.postMessage({ action: "start-sync" });
port.onMessage.addListener((response) => { /* ... */ });

// Service Worker 接受连接
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    port.postMessage({ status: "syncing" });
  });
});
```

**跨上下文通信路径**：

| 方向 | API |
|------|-----|
| Popup → Content Script | `chrome.tabs.sendMessage(tabId, message)` |
| Content Script → Service Worker | `chrome.runtime.sendMessage(message)` |
| Content Script → Page（MAIN world） | `window.postMessage()` + 唯一前缀 |

> **MV3 最佳实践**：将消息处理器提取为纯异步函数便于测试；使用带 `type` 判别字段的消息对象；每次 `sendMessage` 后处理 `chrome.runtime.lastError`。

### 2. Content Script 注入技巧

**三种注入方式**：

| 方式 | 声明位置 | 触发时机 | 适用场景 |
|------|---------|---------|---------|
| 静态 | `manifest.json` 的 `content_scripts` | 匹配页面自动注入 | 固定 URL 模式 |
| 动态 | `chrome.scripting.registerContentScripts()` | 运行时注册，SW 重启后持久化 | 用户配置的站点 |
| 编程式 | `chrome.scripting.executeScript()` | 按需单次执行 | Action 触发、一次性操作 |

**MAIN world vs 隔离世界**：

- **ISOLATED（默认）**：独立 JS 执行上下文，有 `chrome.*` API，无法访问页面 JS 变量
- **MAIN**：与页面共享执行上下文，可访问页面全局变量（如 `window.jQuery`），**无** `chrome.*` API

```javascript
// MAIN world 注入 — 访问页面 React 内部
await chrome.scripting.executeScript({
  target: { tabId },
  world: "MAIN",
  func: () => {
    const fiber = document.getElementById("root")._reactRootContainer;
    document.dispatchEvent(new CustomEvent("ext:page-data", {
      detail: { hasReact: !!fiber }
    }));
  }
});
```

**Shadow DOM 样式隔离**：

```javascript
function createIsolatedUI() {
  const host = document.createElement("div");
  host.id = "my-ext-host";
  const shadow = host.attachShadow({ mode: "closed" }); // closed = 页面 JS 无法访问
  shadow.innerHTML = `
    <style>
      :host { all: initial !important; position: fixed !important; z-index: 2147483647 !important; }
      .panel { background: #fff; border-radius: 8px; padding: 16px; }
    </style>
    <div class="panel">Extension UI</div>
  `;
  document.body.appendChild(host);
}
```

### 3. 权限设计

**最小权限原则**：只声明核心功能所需的权限，不要"提前规划"。

**activeTab 模式**（零安装警告）：

```javascript
// manifest.json
{ "permissions": ["activeTab", "scripting"] }

// Service Worker — Action 点击时注入
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => { document.body.style.background = "red"; }
  });
});
```

**可选权限**（运行时请求）：

```javascript
// manifest.json
{
  "optional_permissions": ["topSites"],
  "optional_host_permissions": ["https://*/*"]
}

// 用户操作触发时请求
chrome.permissions.request({
  permissions: ["topSites"],
  origins: ["https://www.google.com/"]
}, (granted) => { /* ... */ });
```

### 4. 存储与数据管理

**Storage 区域对比**：

| Storage | 配额 | 持久性 | 同步 | 最佳用途 |
|---------|------|--------|------|---------|
| `chrome.storage.session` | 10 MB | 浏览器会话 | 否 | 瞬态状态，替代 SW 内存变量 |
| `chrome.storage.local` | 10 MB（可申请无限）| 卸载前 | 否 | 设置、缓存数据 |
| `chrome.storage.sync` | 100 KB（8 KB/项）| 卸载前 | 是（Chrome Sync）| 小型用户偏好 |
| IndexedDB | ~60% 磁盘 | 卸载前 | 否 | 大数据集、可查询数据 |

> **⚠️ 静默写入失败**：`local` 和 `sync` 限制约 120 次写入/分钟，超出限制**不会抛错，写入被静默丢弃**。推荐"session + 合并检查点"模式：在内存（或 `session`）中批量合并写入。

**版本数据迁移**：

```javascript
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "update") {
    migrateStorage(details.previousVersion);
  }
});

async function migrateStorage(previousVersion) {
  const { schemaVersion } = await chrome.storage.local.get("schemaVersion");
  if (!schemaVersion || schemaVersion < 2) {
    const oldData = await chrome.storage.local.get(null);
    const newData = transformData(oldData);
    await chrome.storage.local.set({ ...newData, schemaVersion: 2 });
  }
}
```

**MV3 状态管理库推荐**：

| 库 | 特点 | 大小 |
|----|------|------|
| **[Crann](https://github.com/moclei/crann)** | 多上下文同步 + React Hooks + 全 TS 推断 | <5KB |
| **[@plasmohq/storage](https://docs.plasmo.com/framework/storage)** | React Hooks + 加密存储 + watch/sync | 中等 |
| **[webext-pegasus](https://github.com/StyleT/webext-pegasus)** | Redux/Zustand/Mobx 适配器，跨上下文 | 按需 |
| **[webext-storage](https://github.com/fregante/webext-storage)** | `StorageItem<T>` 类型安全，跨浏览器 | 小巧 |

---

## 三、调试与性能优化

### 1. Service Worker 调试

| 方法 | 操作 |
|------|------|
| `chrome://extensions` | 点击 "Service Worker" 链接打开专用 DevTools |
| `chrome://serviceworker-internals` | 查看 SW 注册状态、启动/停止控制 |
| Application Tab | 导航到 `chrome-extension://<id>/manifest.json`，打开 DevTools → Application → Service Workers |

> **注意**：DevTools 打开时 SW 永远不会进入非活动状态。调试唤醒行为时，先用 `chrome://serviceworker-internals` 停止 Worker，再触发扩展操作观察唤醒过程。

### 2. Content Script 调试

- 在注入页面的 **Sources 面板**中，Content Script 出现在扩展名文件夹下
- 使用 **Console 上下文下拉菜单**切换页面上下文和扩展 Content Script 上下文
- 为打包后的 Content Script 配置 `//# sourceMappingURL=...` 启用源码映射调试

### 3. Popup 调试

- 右键 Popup → "检查"打开专用 DevTools
- 或直接导航到 `chrome-extension://<id>/popup.html`（避免 Popup 关闭问题）

### 4. 性能分析

| 工具 | 用途 |
|------|------|
| Chrome Task Manager（Shift+Esc）| 查看扩展进程的内存和 CPU 占用 |
| Performance Tab | 录制 Trace 分析 Content Script 执行时间 |
| Memory Tab | 堆快照对比，检测内存泄漏 |
| `chrome.storage.session.getBytesInUse()` | 跟踪内存存储增长 |

**Service Worker 优化策略**：

- **启动加速**：最小化顶层代码，非关键模块懒加载
- **保活**：WebSocket 连接（Chrome 116+）延长 SW 生命周期，每 20-25 秒发心跳
- **定时任务**：用 `chrome.alarms`（最低 30 秒间隔）替代 `setInterval`
- **Offscreen Documents**（Chrome 109+）：需要 DOM 访问时使用（音频播放、剪贴板、地理定位）

```javascript
// Offscreen Document — 需要 DOM 操作时
chrome.offscreen.createDocument({
  url: "offscreen.html",
  reasons: ["AUDIO_PLAYBACK"],
  justification: "播放提示音"
});
```

---

## 四、测试与 CI/CD

### 1. 单元测试

**Chrome API Mock 设置（Vitest）**：

```javascript
// test/setup.ts
import { vi } from "vitest";

(globalThis as any).chrome = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn().mockResolvedValue(undefined),
    getURL: vi.fn((path) => `chrome-extension://fake-id/${path}`),
  },
};
```

**Mock 库推荐**：

| 库 | 框架 | 特点 |
|----|------|------|
| `vitest-chrome` | Vitest | 完整 Chrome API Mock |
| `vitest-chrome-mv3` | Vitest | 基于 Schema 的 MV3 Mock |
| `sinon-chrome` | 任意 | Sinon 基础 Mock |
| `jest-webextension-mock` | Jest | 轻量 Mock |

### 2. E2E 测试（Playwright）

```javascript
// e2e/fixtures.ts
import { test as base, chromium } from "@playwright/test";
import path from "path";

export const test = base.extend({
  context: async ({}, use) => {
    const extensionPath = path.resolve(__dirname, "../dist");
    const context = await chromium.launchPersistentContext("", {
      headless: false, // Chrome 132+ 支持新 headless 模式
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let sw = context.serviceWorkers()[0];
    if (!sw) sw = await context.waitForEvent("serviceworker");
    const id = sw.url().split("/")[2];
    await use(id);
  },
});
```

- 测试 Popup：导航到 `chrome-extension://<id>/popup.html`
- 测试 Content Script：加载匹配 `matches` 模式的页面
- CI 中使用 `xvfb-run`（Linux）或 Chrome `--headless=new`

### 3. CI 自动化发布

| 工具 | 用途 |
|------|------|
| `puzzlers-labs/chrome-webstore-publish` | GitHub Action：CRX 签名 + 发布 |
| `PlasmoHQ/bpp` | 同时发布到 Chrome / Firefox / Edge |
| `web-ext-deploy` | CLI 发布到 Chrome / Firefox / Edge / Opera |
| `web-ext sign` | Firefox CLI 签名和发布 |
| WXT `wxt zip` + `wxt submit` | 内建打包和商店提交 |

```yaml
# GitHub Actions 简例
- run: pnpm install
- run: pnpm test
- run: npx playwright install --with-deps chromium
- run: npx playwright test
- run: pnpm build
- uses: puzzlers-labs/chrome-webstore-publish@v3
```

---

## 五、安全审计

### CSP (Content Security Policy)

MV3 扩展页面默认 CSP：`script-src 'self' 'wasm-unsafe-eval'; object-src 'self';`

**推荐显式 CSP**：

```json
{
  "content_security_policy": {
    "extension_pages": "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self';"
  }
}
```

**核心规则**：
- ❌ 绝不添加 `unsafe-inline` 或 `unsafe-eval`
- ❌ 禁止远程代码加载（MV3 强制）
- ✅ 显式枚举 `connect-src` 主机

### 安全审计清单

- [ ] 所有权限均为必需且范围最小
- [ ] CSP 明确定义，无 `unsafe-inline/eval`
- [ ] `web_accessible_resources` 最小化
- [ ] 消息处理器验证 `sender.id` 和载荷格式
- [ ] 敏感数据用 Web Crypto 加密存储
- [ ] 无外部数据的 `innerHTML` 插入（使用 `DOMPurify` 或 `textContent`）
- [ ] 所有 API 端点使用 HTTPS
- [ ] 依赖审计（`npm audit`）无已知漏洞
- [ ] Source Map 不包含在生产包中
- [ ] 隐私政策准确且在线可访问

### 安全扫描工具

**[ExtGuard](https://www.extguard.online/)**：发布前扫描工具，检查 MV3 验证、危险权限、CSP 违规、`eval()` 检测、远程代码加载等。

---

## 六、构建与打包技巧

### Vite 配置关键点

MV3 Service Worker 必须是**单文件 IIFE**（Chrome 拒绝 ES 模块的 Service Worker）：

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background.ts"),
        content: resolve(__dirname, "src/content.ts"),
        popup: resolve(__dirname, "popup.html"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "iife",          // 关键：IIFE 而非 ES 模块
      },
    },
    target: "chrome120",
  },
});
```

### 代码分割策略

| 组件 | 是否可分割 | 说明 |
|------|-----------|------|
| Service Worker | ❌ 不可 | 必须单文件 IIFE |
| Content Script | ⚠️ 有限 | 分块需声明 `web_accessible_resources`，单文件更安全 |
| Popup/Options | ✅ 完全 | 路由级懒加载 |

### Tree Shaking 技巧

- 设置 `target: 'chrome110'` 跳过 Chrome 已支持语法的转译
- 用 `lodash-es` / `dayjs` 替代 CommonJS 版本（`lodash` / `moment`）
- 使用 `manualChunks` 防止 vendor 代码泄漏到 Content Script 包

---

## 七、AI 辅助开发工具

### Claude Code 扩展开发

#### 1. create-chrome-extension — 全流程发布插件

**GitHub**：[codyhxyz/create-chrome-extension](https://github.com/codyhxyz/create-chrome-extension) | **技术栈**：WXT + React 19 + Tailwind v4 + TypeScript

这是一款 Claude Code **插件（Plugin）**，覆盖从脚手架搭建到 Chrome Web Store 发布的完整生命周期。它内置了 Chrome Web Store 约 18 条内容规则的验证器，将规则编码为可执行检查（`scripts/validate-cws.ts`），而非模糊的提示。

**8 个 Skills 详解**：

| Skill | 功能 | 典型用法 |
|-------|------|---------|
| `cce-init` | **项目初始化**。通过对话式访谈了解你的扩展概念，选择匹配的 Profile（如 `side-panel-app`），删除不需要的入口点，确认 `npm run check:cws` 通过 | 开始新项目时第一步运行 |
| `cce-import` | **导入已有项目**。将现有的原生 MV3 扩展转换为 WXT 工厂布局 | 已有扩展迁移到 WXT 时使用 |
| `cce-rename` | **品牌重命名**。修改显示名称、slug、描述、文件夹名等 | 项目改名或 Fork 后重品牌化 |
| `cws-content` | **商店列表文案**。通过访谈收集名称、短描述、主机来源、欢迎页文案，写入 `wxt.config.ts` 和 `entrypoints/welcome/config.ts`，重新运行验证器 | 填写商店上架信息 |
| `cws-screens` | **截图生成**。访谈 5 个面板概念，写入 `screenshots/config.ts`，运行 `npm run screenshots` 渲染 1280×800 PNG | 生成商店所需的 5 张截图 |
| `cws-video` | **宣传视频**。生成 30 秒的宣传片（可选） | 制作商店宣传视频 |
| `setup-cws-credentials` | **OAuth 凭证配置**。一次性设置 Google Cloud + OAuth 凭证 | 首次发布前配置 |
| `cws-ship` | **发布到商店**。门控检查 `npm run check:cws:ship` → 版本同步 → 确认 → 通过 CWS API 提交（或回退到手动 ZIP 上传）| 最终发布到 Chrome Web Store |

**推荐工作流**：

```
1. /create-chrome-extension:cce-init      → 访谈、裁剪、确认通过
2. /create-chrome-extension:cws-content   → 填写商店列表
3. /create-chrome-extension:cws-screens   → 渲染截图
4. /create-chrome-extension:cws-video     → 制作宣传视频（可选）
5. /create-chrome-extension:setup-cws-credentials → OAuth 配置（一次性）
6. /create-chrome-extension:cws-ship      → 版本同步、上传、轮询
```

**两层验证机制**：

- **Layer 1 — 通用仓库健康检查**：`scripts/readiness.sh` 检查约 20 条规则（lint 配置、类型检查、pre-commit hooks、锁文件、测试、覆盖率等），默认为建议性，可通过 `CCE_READINESS_REQUIRED=1` 设为强制
- **Layer 2 — CWS 特定规则**：`scripts/validate-cws.ts` 约 24 条规则，覆盖 CSP、主机权限、远程代码模式、列表漂移、隐私政策可达性、截图/视频就绪状态等，作为提交门控强制执行

**安装方式**：

```bash
# 1. 脚手架工厂仓库
npx create-chrome-extension my-extension
cd my-extension

# 2. 安装 Claude Code 插件
/plugin marketplace add codyhxyz/create-chrome-extension
/plugin install create-chrome-extension@create-chrome-extension
```

> **注意**：即使不安装插件，工厂仓库本身也是完整可用的代码库 — `npm run dev`、`npm run build`、`npm run check:cws:ship`、`npm run ship` 均可独立运行。插件只是自动化了对话式交互部分。

---

#### 2. chrome-extension-builder — 专家级 Agent

**GitHub**：[AJAmit17/chrome-extension-builder](https://github.com/AJAmit17/chrome-extension-builder) | **基于**：[gitagent](https://github.com/open-gitagent/gitagent) 标准 | **首选模型**：Claude Opus 4.6

这是一款基于 gitagent 标准的 Claude 原生 **Agent（代理）**，内建了 Chrome 扩展开发全生命周期的专家知识。它的定位不是脚手架工具，而是一位经验丰富的 Chrome 扩展工程师——曾为数百万人发布过扩展、在凌晨 2 点调试过 Service Worker 生命周期 Bug、完成过 MV2 到 MV3 的迁移。

**核心能力**：

| 能力 | 说明 |
|------|------|
| **扩展脚手架** | 生成完整扩展目录结构：popup、content script、service worker、side panel、DevTools panel、offscreen document |
| **Manifest V3 专家** | 编写正确的 manifest 文件，处理所有字段配置，MV2→MV3 迁移指导 |
| **chrome.* API 实现** | 正确使用 tabs、storage、scripting、runtime、messaging、alarms、notifications、contextMenus、identity、declarativeNetRequest 等 API |
| **消息传递** | 配置 sendMessage 模式、Port 长连接、上下文间异步通信 |
| **CSP 合规** | 确保 Content Security Policy 合规，处理沙箱页面，防止 eval/unsafe 模式 |
| **调试与错误解决** | 解码常见错误、DevTools 各上下文调试指导、Service Worker 坑点排查 |
| **Chrome Web Store 发布** | 提交检查清单、审核政策、拒绝预防、隐私披露 |
| **构建工具集成** | 兼容 vanilla JS、TypeScript、Vite + CRXJS、Plasmo、React/Vue |

**内建知识库**（`knowledge/` 目录）：

| 文件 | 内容 |
|------|------|
| `manifest-v3-overview.md` | MV3 字段详解、迁移要点、常见陷阱 |
| `chrome-apis-reference.md` | chrome.* API 参考与正确用法 |
| `architecture.md` | 扩展架构模式（popup/CS/SW/选项页/side panel/DevTools） |
| `security-csp.md` | CSP 合规、沙箱页面、安全最佳实践 |
| `debugging-guide.md` | 各上下文调试技巧、常见错误排查 |
| `publishing-guide.md` | CWS 提交要求、审核政策、拒绝预防 |

**内建模板**（`templates/` 目录）：`manifest-v3.json`、`popup.html`、`content.js`、`service-worker.js`、`options.html` — 可直接作为新项目起点。

**运行方式**：

```bash
npx @open-gitagent/gitagent run -r https://github.com/AJAmit17/chrome-extension-builder
```

**Agent 行为风格**：

- **精准但不迂腐**：给出正确答案而非所有可能答案
- **有主见但不教条**：对扩展架构有强主张（最小权限、事件驱动设计、不在 SW 中存状态），但会适应实际约束
- **先代码后解释**：开发需求 → 先给 manifest 和关键文件代码 → 边写边解释
- **调试时先诊断**：先要错误信息 → 先给最可能的修复 → 再提替代方案

---

#### 两款工具对比

| 特性 | create-chrome-extension | chrome-extension-builder |
|------|------------------------|--------------------------|
| **类型** | Claude Code Plugin（插件） | gitagent Agent（代理） |
| **技术栈绑定** | WXT + React 19 + Tailwind v4 | 框架无关 |
| **核心定位** | 脚手架 → 发布的全流程自动化 | 专家级咨询与代码生成 |
| **Skills 数量** | 8 个（每个独立可调用） | 1 个综合 Skill |
| **知识库** | 约 24 条 CWS 验证规则 | 6 个专题知识文件 + 模板 |
| **CWS 发布** | ✅ 完整自动化（OAuth + API 提交） | ✅ 发布指导（检查清单） |
| **最佳场景** | 从零创建新项目并发布到商店 | 调试、API 咨询、架构设计、任意框架 |

**选择建议**：

- 🏗️ **从零开始新项目** → `create-chrome-extension`：脚手架 + 验证 + 发布一条龙
- 🔧 **调试问题 / API 咨询 / 架构设计** → `chrome-extension-builder`：专家级指导，不绑定框架
- 💡 **最佳组合**：用 `create-chrome-extension` 搭建和发布，用 `chrome-extension-builder` 解决开发中的技术难题

### MCP 服务器

| 服务器 | 用途 | 安装 |
|--------|------|------|
| **[Chrome MCP](https://github.com/mikhailsal/mcp-chrome)** | 浏览器控制（截图、网络、书签、历史） | Chrome 扩展 |
| **[Playwright MCP](https://github.com/microsoft/playwright-mcp)** | 浏览器自动化（结构化快照） | `npm i @playwright/mcp` |
| **[Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp)** | 官方 DevTools 调试 | 官方预览版 |
| **Puppeteer MCP** | Chrome 自动化 | `npm i @modelcontextprotocol/server-puppeteer` |

### AI 扩展生成器

| 工具 | 说明 |
|------|------|
| **[PlugThis](https://plugthis.ai/)** | 英文描述生成完整 MV3 扩展，< 2 分钟 |
| **[Extinde](https://extinde.com/)** | 多浏览器（Chrome/Firefox/Edge/Safari）AI 生成 |
| **[NuModeX Ext Maker](https://github.com/SoraVantia/NuModeX-Ext-Maker)** | 浏览器端运行，支持多种 AI 后端 |

### 浏览器自动化

| 工具 | Stars | 说明 |
|------|-------|------|
| **[Browser Use](https://github.com/browser-use/browser-use)** | 95K+ | Python AI 浏览器代理，Playwright 驱动 |
| **[Browserbase](https://www.browserbase.com/)** | — | 云端浏览器基础设施，专为 AI Agent 设计 |
| **[Browser Harness](https://github.com/browser-use/browser-harness)** | 12K+ | 自愈 CDP 线束，直连 LLM 与真实浏览器 |

---

## 八、UI 设计技能

### TailwindCSS + shadcn/ui

扩展 Popup 开发推荐使用 **TailwindCSS + shadcn/ui** 组合：

- **[crx-react-tailwind-shadcn](https://github.com/evildevill/crx-react-tailwind-shadcn-template)**：React 19 + Vite 7 + TailwindCSS v4 + shadcn/ui 模板
- **[wxt-react-tailwind-shadcn](https://github.com/husniadil/wxt-react-tailwind-shadcn-template)**：WXT + React 19 + TailwindCSS + shadcn/ui

> **⚠️ Content Script 注意**：Tailwind 使用 `rem` 单位，会受宿主页面根字号影响。在 Content Script 的 Shadow DOM 中应切换为 `px` 单位。

### Popup 设计最佳实践

- Chrome 限制：最大 800×600px，最小 25×25px，推荐 ~400×500px
- 必须包含 CSS Reset（Chrome 不会注入默认样式）
- 使用显式宽高，不依赖 `width: 100%`
- 目标：点击到可交互 < 200ms
- 使用 SPA 架构避免页面切换闪烁

### 暗黑模式

```css
/* CSS 自定义属性 + prefers-color-scheme */
:root {
  --bg: #fff;
  --text: #1a1a1a;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --text: #e5e5e5;
  }
}
```

在 Shadow DOM 中，`prefers-color-scheme` 仍然有效。用户偏好存储在 `chrome.storage.sync` 实现跨设备同步。

### 国际化（chrome.i18n）

```
_locales/
  en/
    messages.json
  zh/
    messages.json
```

```json
{
  "extName": {
    "message": "My Extension",
    "description": "扩展名称"
  }
}
```

```javascript
// JS 中使用
chrome.i18n.getMessage("extName");

// Manifest/HTML 中使用
// __MSG_extName__
```

---

## 九、错误监控与分析

### Sentry 集成

Sentry 是扩展错误监控的首选：

- 在所有扩展上下文（Popup、Service Worker、Content Script）初始化 Sentry
- 生产构建时使用 `sentryVitePlugin` 上传 Source Map
- 支持 Error Monitoring、Tracing、Session Replay、AI Agent Monitoring

### 热重载工具

| 工具 | 说明 |
|------|------|
| **[livepak](https://github.com/jeanpierrecarvalho/livepak)** | 零依赖开发服务器，自动下载 Chrome for Testing |
| **[vite-plugin-chrome-extension-reload](https://github.com/kterashi02/vite-plugin-chrome-extension-reload)** | Vite 插件，智能重载策略 |
| **[KamoX](https://github.com/iwabuchi404/kamox)** | AI Coding Agent 专用开发服务器 |

---

## 十、2026 年推荐技术栈

| 类别 | 首选 | 备选 |
|------|------|------|
| **框架** | [WXT](https://wxt.dev/) | Extension.js（零配置）、Plasmo（React CSUI）|
| **打包器** | Vite | Rspack（Extension.js） |
| **TypeScript** | WXT 内建 `@wxt-dev/browser` | `@types/chrome` + `webextension-polyfill` |
| **状态管理** | [Crann](https://github.com/moclei/crann) | `@plasmohq/storage` |
| **消息通信** | WXT 内建 | `@plasmohq/messaging` |
| **E2E 测试** | Playwright | WebdriverIO |
| **单元测试** | Vitest + `vitest-chrome` | Jest + `jest-webextension-mock` |
| **CI/CD** | GitHub Actions + WXT zip/submit | BPP（Plasmo）|
| **跨浏览器** | WXT | Extension.js |
| **UI** | TailwindCSS + shadcn/ui | — |
| **错误监控** | Sentry | — |
| **AI 辅助** | Chrome DevTools MCP + Claude Code | Playwright MCP + Browser Use |
| **安全扫描** | [ExtGuard](https://www.extguard.online/) | OWASP 清单 |

---

## 参考资料

- [WXT 官方文档](https://wxt.dev/)
- [Plasmo 官方文档](https://docs.plasmo.com/)
- [CRXJS GitHub](https://github.com/crxjs/chrome-extension-tools)
- [Extension.js 官方](https://extension.js.org/)
- [Chrome MV3 迁移指南](https://developer.chrome.com/docs/extensions/develop/migrate)
- [Playwright Chrome 扩展测试](https://playwright.dev/docs/chrome-extensions)
- [OWASP 浏览器扩展安全清单](https://cheatsheetseries.owasp.org/cheatsheets/Browser_Extension_Vulnerabilities_Cheat_Sheet.html)
- [Chrome 内置 AI 文档](https://developer.chrome.com/docs/ai)
- [Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp)
- [2025 框架对比：Plasmo vs WXT vs CRXJS](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)
- [WXT vs Plasmo vs CRXJS 2026 对比](https://trybuildpilot.com/649-wxt-vs-plasmo-vs-crxjs-2026)
- [Building Browser Extensions（Matt Frisbie，第 2 版）](https://www.buildingbrowserextensions.com/)
- [DebugBear：测量 Chrome 扩展的性能影响](https://www.debugbear.com/blog/measuring-the-performance-impact-of-chrome-extensions)
- [MDN 跨浏览器扩展开发](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension)
