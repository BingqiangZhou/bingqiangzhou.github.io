---
title: 【工具分享】在 Proxifier 中配置 Antigravity（Windows / macOS）
published: 2026-11-25
updated: 2026-11-26
description: Antigravity 用 TUN 模式副作用太大，改用 Proxifier 按进程分流，只给它自己和语言服务等进程单独挂 Socks5 代理；本文整理了 Windows 与 macOS 的配置步骤、进程清单和排查方法。
tags: [工具分享]
abbrlink: proxifier-antigravity-setup
toc: true
---

## 背景

Antigravity 刚上线时，通过 TUN 模式（虚拟网卡全局接管）也能正常登录，但 TUN 的副作用太大——全机流量都被绕进代理，会干扰其他网络需求。更精细的做法是用 Proxifier 按进程分流：只把 Antigravity 相关的几个进程送进本地 Socks5，其余流量保持直连。

Proxifier 支持 **Windows 和 macOS**（官方没有 Linux 版），它能把指定进程 / 主机 / 端口的流量转发到代理。下面把两个平台的步骤合在一起写，差异标在对应位置。

## 配置步骤

### 1、安装并激活

- **Windows**：从[官网](https://www.proxifier.com/)下载安装包，安装后填写激活码。
- **macOS**：下载 `.dmg`，把 Proxifier.app 拖进「应用程序」。当前 v3 需要 **Big Sur（11）及以上**（更早的系统只能用 v2）；首次启动按提示允许网络扩展。如果系统里原本设置了代理，先关掉，让应用直连。

Proxifier 是付费软件，激活码哪里找？Google 搜索 “[Proxifier v4 Registration Keys.txt](https://gist.github.com/montasim/11e313f82dc6c2aea28298941158429f)” 。

下面的激活码从上面的[Proxifier v4 Registration Keys.txt](https://gist.github.com/montasim/11e313f82dc6c2aea28298941158429f)网页复制而来。

```
KFZUS-F3JGV-T95Y7-BXGAS-5NHHP
T3ZWQ-P2738-3FJWS-YE7HT-6NA3K
KFZUS-F3JGV-T95Y7-BXGAS-5NHHP
65Z2L-P36BY-YWJYC-TMJZL-YDZ2S
SFZHH-2Y246-Z483L-EU92B-LNYUA
GSZVS-5W4WA-T9F2E-L3XUX-68473
FTZ8A-R3CP8-AVHYW-KKRMQ-SYDLS
Q3ZWN-QWLZG-32G22-SCJXZ-9B5S4
DAZPH-G39D3-R4QY7-9PVAY-VQ6BU
KLZ5G-X37YY-65ZYN-EUSV7-WPPBS
6JZUY-32TKX-TK9W7-DU387-9RWKZ
L6Z8A-XY2J4-BTZ3P-ZZ7DF-A2Q9C（Portable Edition）
5EZ8G-C3WL5-B56YG-SCXM9-6QZAP（Standard Edition）
P427L-9Y552-5433E-8DSR3-58Z68（MAC）
```

### 2、添加代理服务器

`Profile → Proxy Servers... → Add...`

填入本地 Socks5 的地址和端口：Windows 示例是 `127.0.0.1:10808`，macOS 常见 `127.0.0.1:7890`，以本机代理软件实际监听的端口为准。Protocol 选 **SOCKS Version 5**，Authentication 不勾 Enable。

### 3、配置 Proxification Rules

`Profile → Proxification Rules... → Add...`

Proxification Rules 决定哪些进程走代理、哪些直连。Applications 填入需要走代理的进程，Target hosts / Target ports 保持 `Any`，Action 选上一步建好的代理服务器。

- **Windows**：

  ```
  antigravity.exe; openconsole.exe; fd.exe; winpty-agent.exe; inno_updater.exe; language_server_windows_x64.exe
  ```

- **macOS**：先把 **Default** 规则设为 **Direct**，并保留内置的 **Localhost** 直连规则（本地代理本身在 `127.0.0.1`，不能让它再走代理），Applications 填入：

  ```
  "Antigravity.app"; "Antigravity"; com.google.antigravity; "Gemini.app"; "Gemini"; com.google.GeminiMacOS; "Antigravity IDE.app"; "Antigravity IDE"; com.google.antigravity-ide; language_server_macos_arm; language_server_macos_x64; language_server
  ```

**为什么不止一个进程**：Antigravity 除了主程序，还会拉起语言服务、终端、更新器等进程。Windows 上是 `language_server_windows_x64.exe`、`openconsole.exe`、`winpty-agent.exe`、`fd.exe`、`inno_updater.exe`；macOS 上是 `language_server` 以及 Gemini、Antigravity IDE 的相关进程。只代理主程序的话，登录和模型调用仍可能卡住，所以要把它们一次性全部写进同一条规则。

### 4、重启并验证

重启 Antigravity。Windows 在 Proxifier 主界面的连接列表里，能看到这些进程的连接被规则接管（Target 为代理地址，Rule 一栏显示规则名与 `SOCKS5`），就说明生效了。

macOS 如果仍然登录不上，打开 `Log → Output`（Verbose）看实际发起连接的进程名，补进 Applications 即可。Antigravity 2.0 把原先分架构的 `language_server_macos_arm` / `language_server_macos_x64` 合并成了 `language_server`，建议新旧名字都写上，也可以用 `language_server*` 通配符兜住语言服务。

## 参考

- 原始教程：Samgor（@biggor888）《在 Proxifier 中配置 Antigravity 极简教程》，2026-01-31，<https://x.com/biggor888/article/2017597350538318131>
- Proxifier 官方：[下载页](https://www.proxifier.com/download/)、[功能规格](https://www.proxifier.com/features.html)、[macOS v3 说明](https://www.proxifier.com/new/mac.html)
- macOS 进程名与配置参考：[Marchccc](https://www.marchccc.top/2026/01/19/macOS%E4%B8%8D%E5%BC%80TUN%E6%A8%A1%E5%BC%8F%E4%BD%BF%E7%94%A8Antigravity)、[八戒的技术博客](https://rendoumi.com/posts/20260114-antigravity/)
