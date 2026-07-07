---
title: "【实践记录】给 git 配代理，解决 Claude Code / ZCode 插件下载更新失败，顺手治好 GitHub 推送"
published: 2026-07-07
description: "Claude Code 和 ZCode 的插件市场、更新检查常因网络拉不动而失败或卡死。开 TUN（全局代理）模式能解决，但并不总是稳定。实践下来最省心的是直接给 git 配上本地代理端口——两条命令永久生效，顺带把推送到 GitHub 的网络问题一起解决。"
lang: zh
tags: ["实践记录", "工具分享"]
abbrlink: git-proxy-for-coding-agents
---

## 问题现象

用 Claude Code、ZCode 这类 coding agent 时，常碰到这类网络问题：

- **插件市场拉不动**：装个 MCP、装个 skill，进度条卡住或直接超时失败。
- **更新检查失败**：agent 启动时检查新版本，连不上发布源，报一堆 `ETIMEDOUT` / `fetch failed`。
- **克隆模板仓库超时**：新建项目时从 GitHub 拉脚手架，半天没动静。

根子里都是同一件事——这些工具底层大量走 `git` 去拉远端资源（插件、更新源、模板），而 `git` 默认**不走系统代理**，在受限网络下自然连不通。

## 开 TUN 模式能解决，但不一定稳

最常见的应急办法是开代理软件的 **TUN 模式（全局/虚拟网卡代理）**：它接管所有流量，git 自然也能通。

但实测下来 TUN 模式有几个不爽：

- **不总是稳**：不同代理软件、不同驱动下，TUN 偶尔会断流、漏流量，git 操作时灵时不灵。
- **副作用面大**：全机流量都绕代理，会影响别的进程（内网服务、局域网设备、甚至一些鉴权流程），排查问题时变量太多。
- **环境依赖**：换台机器、服务器、CI 环境，未必有 TUN 可开。

所以更靠谱的思路是——**只给真正需要代理的 `git` 单独配上，精准、持久、可复现**。

## 方案：给 git 配本地代理（两条命令，永久生效）

假设本地代理软件监听 `127.0.0.1:7890`（Clash / Mihomo 等的默认 HTTP 端口，按自己实际改），执行：

```bash
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```

就这两条。`--global` 写进 `~/.gitconfig`，对所有仓库永久生效，agent 后台跑的每一次 `git` 都自动走代理。

### 验证

```bash
git config --global --get http.proxy
# 输出: http://127.0.0.1:7890
```

或直接测一次：

```bash
git clone https://github.com/cli/cli.git /tmp/test-repo
```

能正常拉下来，说明 git 已经走代理了。这时候再去装 Claude Code / ZCode 的插件、触发更新检查，基本就通了。

### 它一并解决了什么

- **Claude Code / ZCode 插件下载与更新**——根因是 git 拉不动，配了代理就好。
- **推送到 GitHub 的网络问题**——`git push` 走 HTTPS 时同样吃这个配置，推送卡顿、超时、`Failed to connect` 一并解决。

## ⚠️ 一个关键坑：SSH 协议的 remote 不吃这套

`http.proxy` / `https.proxy` **只对 HTTPS 协议的 remote 生效**。如果你的仓库 remote 是 SSH 形式：

```text
git@github.com:user/repo.git
```

那它走的是 SSH（22 端口），**不经过 http/https 代理配置**，配了 git 代理也照样连不通。这是「明明配了代理还是推不动 GitHub」最常见的踩坑点。

判断当前 remote 协议：

```bash
git remote -v
```

如果看到的是 `git@github.com:...`，两种解法选其一：

**① 改用 HTTPS remote（最简单）**：

```bash
git remote set-url origin https://github.com/user/repo.git
```

改成 HTTPS 后，前面的 git 代理配置立刻生效。

**② 给 SSH 也配代理**（想保留 SSH 协议时用），编辑 `~/.ssh/config`：

```text
Host github.com
    HostName github.com
    User git
    # Windows：用 connect 走 HTTP 代理
    ProxyCommand connect -H 127.0.0.1:7890 %h %p
    # macOS / Linux：用 nc
    # ProxyCommand nc -X connect -x 127.0.0.1:7890 %h %p
```

日常推荐用①，省心。

## 按需开关代理

有时想临时让 git 直连（比如代理软件没开、或拉内网仓库），不必反复改配置：

```bash
# 临时禁用（仅当前命令）
git -c http.proxy= -c https.proxy= clone https://github.com/user/repo.git

# 永久取消
git config --global --unset http.proxy
git config --global --unset https.proxy
```

## 小结

| 场景 | 方案 |
| --- | --- |
| Claude Code / ZCode 插件下载、更新失败 | 给 git 配 `http/https.proxy` |
| 推送 GitHub 超时/连不上（HTTPS remote） | 同上，一并解决 |
| 推送 GitHub 失败（SSH remote） | 改成 HTTPS remote，或给 SSH 单独配 `ProxyCommand` |
| 不想全局开 TUN 影响别的进程 | 用 git 代理替代，精准、稳定 |

记下两条命令和「SSH remote 要单独处理」这个坑，以后 agent 装插件、拉模板、推代码卡网络，基本都能一把过。比开 TUN 稳，比全局代理干净。
