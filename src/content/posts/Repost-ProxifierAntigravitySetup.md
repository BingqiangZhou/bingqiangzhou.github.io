---
title: 【优质转载】在 Proxifier 中配置 Antigravity 极简教程
published: 2026-11-25
description: 转载自 X（@biggor888）：Antigravity 用 TUN 模式副作用太大，改用 Proxifier 只给它自己的几个进程单独挂 Socks5 代理——填地址、加一条 Proxification Rule，就绕开了全机代理的副作用。
tags: [优质转载]
abbrlink: proxifier-antigravity-setup
toc: true
---

> 📌 **转载说明**
>
> 本文转载自 **X（Twitter）**，原作者 **Samgor（@biggor888）**。
>
> - **原文标题**：《在 Proxifier 中配置 Antigravity 极简教程》
> - **原文链接**：<https://x.com/biggor888/article/2017597350538318131>
> - **发布时间**：2026-01-31
>
> 以下为原文转载，**文字主体保持原貌**（含原文笔误）；配图已保存至本站。原文中「去哪里找激活码」的那一句给出了第三方注册码列表，属于绕过商业软件授权，本站不予转载，已在原位置替换为说明，特此告知。

## 内容总结

Antigravity 刚上线时，作者靠 TUN 模式（虚拟网卡全局接管）也能登录，但 TUN 的副作用太大——全机流量都绕代理，会干扰其他网络需求。于是想只给 Antigravity 单独挂代理，Proxifier 是当时的候选，可它要付费，试了几个开源替代也都没成，事情就搁置了。

后来他重新折腾 Proxifier，用「按进程分流」的思路解决了问题，全程只有三步：

1. **装软件**：官网下载 Proxifier，安装后填激活码。
2. **配 Proxy Servers**：`Profile → Proxy Servers... → Add...`，填入本地 Socks5 地址（他填的是 `127.0.0.1:10808`，Protocol 选 SOCKS Version 5，Authentication 不勾 Enable）。
3. **配 Proxification Rules**（作者标了「重点」）：`Profile → Proxification Rules... → Add...`，把 Antigravity 安装目录下的一组 `.exe` 全部加进 Applications：

   ```
   antigravity.exe; openconsole.exe; fd.exe; winpty-agent.exe; inno_updater.exe; language_server_windows_x64.exe
   ```

   其余（Target hosts / Target ports）保持 `Any`，Action 选上一步建好的 Proxy Server。

这里最容易被忽略的一点是：**Antigravity 不止 `antigravity.exe` 一个进程**。它还会拉起 `language_server_windows_x64.exe`（语言服务）、`openconsole.exe` / `winpty-agent.exe`（终端相关）、`fd.exe`、`inno_updater.exe`（更新器）。只代理主程序的话，登录和模型调用仍可能卡住——作者的做法是把它们一次性全部写进同一条规则。

验证方式也很直观：Proxifier 主界面的连接列表里，能看到这些进程的连接被 `Antigravity` 规则接管，Target 为 `127.0.0.1:10808`，Rule 一栏显示 `Antigravity : 127.0.0.1:10808 SOCKS5`。

### 文中提到的资源与工具

**软件与平台**

- **Proxifier** —— 按进程 / 主机 / 端口规则把流量转发到代理的工具（Windows / macOS），文中方案的主体，[官网](https://www.proxifier.com/)
- **Antigravity** —— Google 的 Agent 编程工具，也就是本文要「单独挂代理」的对象
- **Socks5 代理** —— 作者本机已有的代理服务，监听 `127.0.0.1:10808`（v2rayN / Clash 等工具的常见本地端口）

**Antigravity 安装目录下需要纳入规则的可执行文件**

- `antigravity.exe` —— 主程序
- `language_server_windows_x64.exe` —— 语言服务（模型请求的主要发出者）
- `openconsole.exe`、`winpty-agent.exe` —— 终端 / 控制台相关进程
- `fd.exe` —— 文件相关辅助进程
- `inno_updater.exe` —— 更新器

**涉及的概念**

- **TUN 模式** —— 代理软件的虚拟网卡全局接管；能解决「工具不走系统代理」的问题，但会把全机流量一起带走
- **Proxification Rules** —— Proxifier 的核心机制，决定哪些进程的流量走哪个代理、哪些直连

---

Antigravity 刚出来的时候通过 TUN 可以成功登录，但 TUN 模式副作用太大了，严重影响其他网络需求。当时想尝试一下 Proxifier，看到 Proxifier 需要付费，尝试过其他开源的也没有实现，就搁置一边了。

昨天在网上找到了 Proxifier 激活码，发现有效，又折腾了一下。

已经成功啦：

![Proxifier 主界面：Antigravity 相关进程已按 Antigravity 规则走本地 10808 端口的 SOCKS5 代理](/assets/images/2026/20261125/proxifier-antigravity-01-success.webp)

我电脑里有 Socks5 代理，只需要在 Proxifier 里面填写激活码、配置 Proxy Servers、Proxification Rules，就可以了，懂了之后就是非常简单，哈哈！

**1、** 去 Proxifier [官网](https://www.proxifier.com/)下载这款软件，安装完成后填写激活码。

> **本站注**：原文此处接着写「激活码哪里找？」，并给出了一个第三方注册码列表的查找方式。该做法属于绕过商业软件授权，本站不予转载。Proxifier 是付费软件，请通过官网购买授权取得合法激活码。

**2、** 在 Proxifier 菜单栏中，进入 Profile 菜单，点击"Proxy Servers ..."，点击"Add..."：

![Proxy Server 对话框：Address、Port、Protocol 三项待填](/assets/images/2026/20261125/proxifier-antigravity-02-proxy-server.webp)

这里我填写了: Address: 127.0.0.1 Port: 10808 Portocol: SOCKS Version 5 Authentication 没有勾选 Enable --- 根据你的实际情况填写即可，就是你提供代理的地址。 填写完毕按OK。

![Proxy Servers 列表中已加入 127.0.0.1 本地 10808 端口的 SOCKS5 代理](/assets/images/2026/20261125/proxifier-antigravity-03-proxy-detail.webp)

填写完毕按OK

**3、重点！** 继续打开 Profile 菜单，进入 "Proxification Rules"菜单，并点击"Add..."

![Proxification Rule 配置：Applications 填入六个 exe，Target hosts/ports 为 Any，Action 选择刚配的代理](/assets/images/2026/20261125/proxifier-antigravity-04-rules.webp)

在Applications栏内，点击 Browse...按钮，导航到 Antigravity 安装目录，依次添加以下几个 .exe 文件，也可以直接复制以下内容（分号相隔，末尾不用分号）： `antigravity.exe; openconsole.exe; fd.exe; winpty-agent.exe; inno_updater.exe; language_server_windows_x64.exe`

其他跟着截图照填即可。Action 则选择你前面配置的 Proxy Server。

这样就配置完成啦，现在你的 Antigravity 就通过 Proxifier 连接互联网了。
