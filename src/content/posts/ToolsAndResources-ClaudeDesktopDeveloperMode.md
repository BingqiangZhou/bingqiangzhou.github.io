---
title: "【工具分享】Claude Desktop 开发者模式 — 使用第三方模型"
published: 2026-04-27
description: "Claude Desktop 开发者模式配置第三方模型 API 的完整教程，涵盖启用方式、连接模式选择及常见配置示例。"
lang: zh
tags: ["工具分享", "折腾记录"]
---

> Claude Desktop 最新版已内置**开发者模式（Developer Mode）**，无需 Claude 官方账号即可配置第三方模型 API，使用 Cowork / Code / Projects 等功能。

---

## 操作步骤

### 第一步：准备工作

- 确保安装**最新版 Claude Desktop**（旧版可能没有该入口）
- **建议先退出登录**（不要登录 Claude 官方账号）
- 准备好第三方模型的 **API Key** 和 **Base URL**

### 第二步：启用开发者模式

1. 打开 Claude Desktop
2. 点击顶部菜单栏 → **Help（帮助）**
3. 选择 **Troubleshooting（疑难解答）**
4. 点击 **Enable Developer Mode（启用开发者模式）**
5. 应用会**自动重启**

> 💡 这个入口设计得比较隐蔽，如果菜单栏不好点击，可以按 `Tab` 键切换焦点到菜单区域，再按回车打开。

### 第三步：配置第三方模型

1. 重启后，菜单栏会出现新增的 **Developer** 菜单
2. 点击 **Developer → Configure Third-Party Inference…**
3. 选择连接模式：

| 模式 | 说明 |
|------|------|
| **Gateway（网关）** | 填写第三方网关的 Base URL + API Key，适用于 OpenRouter、自建代理等 |
| **Anthropic** | 通过 Anthropic 官方 API（需 Anthropic API Key） |
| **Foundry（Azure）** | 使用 Azure Foundry 资源名 + API Key |

4. 填写你的 **API Key** 和 **Base URL**
5. 点击 **Apply locally（本地应用）**，应用再次重启

### 第四步：开始使用

重启后 Claude Desktop 即以第三方模型模式运行，可以使用：

- ✅ **Cowork** — 桌面 AI 代理
- ✅ **Code** — 编程助手
- ✅ **Projects** — 项目管理
- ✅ **Artifacts** — 代码/文档生成
- ❌ 普通聊天（Chat）在此模式下不可用

---

## 常见第三方模型配置示例

| 提供商 | Base URL（示例） |
|--------|-----------------|
| OpenRouter | `https://openrouter.ai/api` |
| DeepSeek | `https://api.deepseek.com` |
| 自建代理 | 填写你的代理地址 |

> ⚠️ **注意**：填写 Base URL 时**不要**在末尾加 `/v1`，Claude Desktop 会自动拼接 API 路径。

---

## 注意事项

- 开发者模式是 Anthropic 提供的官方功能，但入口较为隐蔽
- 第三方模式下**不需要 Claude 付费账号**，但需要第三方模型的 API 费用
- 如果配置后无法使用，检查 API Key 是否正确、Base URL 是否可访问
- 国内用户使用部分海外 API 可能需要网络代理

---

## 参考资料

- [Claude Desktop 配置第三方 API 保姆级教程 - CSDN](https://blog.csdn.net/qq_28299919/article/details/160509212)
- [Claude 桌面版支持第三方模型 - 搜狐](https://m.sohu.com/a/1015243727_121124366/)
- [Claude Desktop 第三方模型配置 - 阿里云开发者社区](https://developer.aliyun.com/article/1731254)
- [Claude Desktop Now Supports Third-Party APIs](https://ai-navigate-news.com/en/articles/82a48ee1-e8fc-4e88-ad38-998d91079775)
