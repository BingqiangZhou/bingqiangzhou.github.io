---
title: 【实践记录】Homebrew 镜像报 no bottle available：原因与解决办法
published: 2026-10-03
description: "macOS 27 上 brew install 报 \"no bottle available\" 的完整诊断：根因是镜像同步脚本对 manifest 文件\"存在即跳过\"，慢更新包的新平台条目长期陈旧。解法很简单：出问题时临时注释掉 HOMEBREW_BOTTLE_DOMAIN 直连官方源，装完再放开。"
tags: [实践记录]
abbrlink: homebrew-mirror-manifest-sync-bug
---

> 一次 Homebrew 镜像同步故障的完整诊断，和一个简单有效的绕过办法。

## 0. 太长不看

macOS 27 上 `brew install` 报 "no bottle available"。一路挖下去，发现是中科大镜像站的同步脚本有个存在已久的 bug：**manifest 文件一旦存在就永远不会重新下载**，而 Homebrew 官方往"同版本"的 manifest 里追加新平台条目时版本号并不变——于是更新慢的包，镜像上的 manifest 一陈旧就是几周甚至几个月。

解法很简单——出问题时临时注释掉 `HOMEBREW_BOTTLE_DOMAIN` 让 brew 直连官方源，装完再放开。

## 1. 起因：明明配了镜像，brew 还在报错

macOS 27 的机器上装环境，`brew install cmake` 报错，大意是拿不到 bottle、转而去找 GitHub 上的 formula 源码也失败了。

第一反应是检查配置——`HOMEBREW_API_DOMAIN` 和 `HOMEBREW_BOTTLE_DOMAIN` 都老老实实指着 `mirrors.ustc.edu.cn`，没毛病。那为什么还在报错？

这就开始剥洋葱了。

## 2. 诊断：四层洋葱

### 2.1 为什么配了镜像还会请求 GitHub？

Homebrew 7 默认走 API 模式：元数据不再是 clone 整个 homebrew-core 仓库，而是下载一份按操作系统分片的 JSON（这台机器对应 `packages.arm64_golden_gate.jws.json`，15 MB 出头）。只有当包不在 API 数据里、或者 bottle 不可用时，才会退回 GitHub 上的 Ruby 源文件。

所以"报错里出现 GitHub URL"不是镜像配置失效，而是**上一环失败了之后的连锁反应**。真正的问题在 bottle 这一环。

### 2.2 bottle 和 manifest 是什么？

- **bottle**：官方 CI 预编译好的二进制包，每个平台一个 `tar.gz`（比如 `cmake--4.4.3.arm64_golden_gate.bottle.tar.gz`），本体按 sha256 寻址，存在 ghcr.io 的 OCI 仓库里。
- **manifest**：每个包每个版本一个小 JSON（OCI image index），列出"这个版本有哪些平台的 bottle、各自的 digest 是多少"。brew 装东西的第一步就是拉 manifest，从中找到当前平台对应的条目，再去下 bottle 本体。

也就是说：**manifest 缺了新平台条目 = 这个包在新系统上装不了**，哪怕 bottle 本体其实已经同步过来了。

### 2.3 关键对照实验

直接 curl 镜像上的文件对比：

| 文件 | 镜像上的状态 |
|---|---|
| cmake 4.4.3 的 **bottle 本体**（macOS 27 版） | ✅ 9 月 10 日就有了 |
| cmake 4.4.3 的 **manifest** | ❌ 8 月 26 日之后没更新过，里面没有 `arm64_golden_gate` 条目 |
| node 的 manifest（版本号常更新） | ✅ 9 月 25 日，新鲜的 |

bottle 在、manifest 不在——同步任务明明在跑，却唯独 manifest 不更新。而且**陈旧的恰好都是版本号很久没变的包**（cmake 4.4.3、highway、abseil、simdjson 这类），版本号常新的 node 反而没事。

### 2.4 根因

镜像站的同步逻辑开源在 `ustclug/ustcmirror-images` 仓库里，翻到 `homebrew-bottles/sync.sh`，`download_manifest` 函数里写着：

```bash
if [[ -f "$manifest_dir/$filename" ]]; then
    continue
fi
```

文件存在就跳过。旁边还有一行注释，解释了为什么可以这样——它基于一个假设：**manifest 与版本号绑定，版本号不变内容就不变**。

这个假设是错的。2026 年 9 月，官方为 macOS 27 构建全套 bottle 时的做法，是把 `arm64_golden_gate` 条目**追加进既有版本的 manifest**：cmake 的版本号还是 4.4.3，manifest 里的平台条目从 8 个变成 9 个。对镜像端来说，URL 没变、文件名没变、版本号没变——`-f` 判断为真，永远跳过。

于是形成了一个残酷的受害者画像：**一个包的版本号越稳定，它镜像上的 manifest 就越陈旧**。活跃包靠版本号变更"顺带"刷新 manifest（所以 node 没事），慢更新包则可能滞后数月。

## 3. 解决办法：临时绕开镜像

只要镜像端没人修这个 bug，像 cmake 这样更新慢的包，就还会在某个新平台上撞上 "no bottle available"。总不能每次都去读镜像的源码，我给自己定了一个简单粗暴的绕过方案：

**装包出问题时，临时注释掉 bottle 镜像环境变量，让 brew 直连官方源，装完再放开。**

```bash
# ~/.zprofile —— 出问题时注释掉这一行：
# export HOMEBREW_BOTTLE_DOMAIN="https://mirrors.ustc.edu.cn/homebrew-bottles"

# 开个新终端（或 source ~/.zprofile），直连官方源装包：
brew update && brew install cmake

# 装完把上面的注释放开、再 source 一次，镜像加速就恢复了
```

原理很简单：manifest 和 bottle 都按 `HOMEBREW_BOTTLE_DOMAIN` 寻址，注释掉之后 brew 直连 ghcr.io——官方源永远是新鲜的，代价只是这一次不走国内加速、下载慢一点。
