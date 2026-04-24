---
title: "【折腾记录】Windows 安装 WSL2 完整指南"
published: 2026-04-24
description: "Windows 10/11 安装 WSL2 的完整指南，包含一键安装、手动安装、离线安装及常用配置。"
lang: zh
tags: ["折腾记录", "学习笔记"]
---

> **适用系统**：Windows 10 版本 2004（内部版本 19041）及以上，或 Windows 11
> **最后更新**：2026 年 4 月

---

## 1. 什么是 WSL2

**WSL（Windows Subsystem for Linux）** 是微软提供的兼容层，允许你在 Windows 上直接运行 Linux 环境，无需传统虚拟机或双系统。

**WSL2 相比 WSL1 的优势**：

| 特性 | WSL1 | WSL2 |
|------|------|------|
| 架构 | 翻译层（系统调用转换） | 完整的 Linux 内核（轻量级虚拟机） |
| 文件系统性能 | 跨 OS 文件访问快 | 原生 Linux 文件系统性能更优 |
| Docker 支持 | 有限 | 完整支持 Docker Desktop |
| 兼容性 | 部分系统调用 | 几乎完全兼容 Linux |

---

## 2. 系统要求

在开始之前，请确认你的系统满足以下条件：

- **操作系统**：Windows 10 版本 2004+（内部版本 19041+）或 Windows 11
- **CPU 虚拟化**：必须在 BIOS/UEFI 中启用虚拟化（Intel VT-x / AMD-V）
- **内存**：建议至少 4GB RAM
- **磁盘空间**：至少 1GB 可用空间

### 检查 Windows 版本

按 `Win + R`，输入 `winver`，查看版本号。

### 检查虚拟化是否启用

打开任务管理器 → **性能** → **CPU**，确认「虚拟化」显示为「已启用」。若未启用，需重启进入 BIOS 开启。

---

## 3. 方法一：一键安装（推荐）

适用于 Windows 10 2004+ 和 Windows 11，**一条命令即可完成全部安装**。

### 步骤

1. **以管理员身份打开 PowerShell**
   - 按 `Win` 键，搜索「PowerShell」
   - 右键点击 → **以管理员身份运行**

2. **执行安装命令**

   ```powershell
   wsl --install
   ```

   此命令会自动完成：
   - ✅ 启用「适用于 Linux 的 Windows 子系统」功能
   - ✅ 启用「虚拟机平台」功能
   - ✅ 下载并安装 WSL2 内核
   - ✅ 安装 Ubuntu（默认发行版）

3. **重启计算机**

   安装完成后系统会提示重启，重启即生效。

4. **首次启动配置**

   重启后会自动弹出 Ubuntu 终端窗口，等待文件解压完成后：
   - 输入 **用户名**（小写英文）
   - 输入 **密码**（输入时不会显示字符，这是正常的）

### 安装指定发行版

默认安装 Ubuntu，如需其他发行版：

```powershell
# 查看可用发行版列表
wsl --list --online

# 安装指定发行版
wsl --install -d <发行版名称>
```

常用发行版名称：`Ubuntu`、`Debian`、`kali-linux`、`openSUSE-Leap-15.5`、`Arch` 等。

### 安装卡在 0% 的解决方法

如果安装进度停留在 0%，尝试使用网络下载方式：

```powershell
wsl --install --web-download -d <发行版名称>
```

---

## 4. 方法二：手动安装

适用于旧版 Windows 或一键安装失败的情况。

### 步骤 1：启用「适用于 Linux 的 Windows 子系统」

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
```

### 步骤 2：启用「虚拟机平台」

```powershell
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

### 步骤 3：重启计算机

```powershell
shutdown /r /t 0
```

### 步骤 4：下载并安装 WSL2 Linux 内核更新包

从微软官方下载最新的 WSL2 内核更新包并安装：

> 下载地址：https://aka.ms/wsl2kernel

### 步骤 5：将 WSL2 设为默认版本

```powershell
wsl --set-default-version 2
```

### 步骤 6：安装 Linux 发行版

```powershell
# 查看可用发行版
wsl --list --online

# 安装（以 Ubuntu 为例）
wsl --install -d Ubuntu
```

或者从 **Microsoft Store** 搜索并安装你喜欢的发行版。

---

## 5. 方法三：离线安装

适用于无网络连接的环境。

1. 从 [GitHub Releases 页面](https://github.com/microsoft/wsl/releases) 下载最新的 WSL MSI 安装包并安装
2. 以管理员身份运行 PowerShell，启用虚拟机平台：

   ```powershell
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   ```

3. 重启计算机
4. 下载发行版的 `.wsl` 文件（各发行版的下载地址可在 [DistributionInfo.json](https://github.com/microsoft/WSL/blob/master/distributions/DistributionInfo.json) 中找到），然后双击安装

---

## 6. 初始配置

### 设置用户名和密码

首次启动发行版时，系统会要求创建 Linux 用户：

```
Enter new UNIX username: your_username
New password: ********
Retype new password: ********
```

> **注意**：
> - 用户名仅支持小写字母和数字
> - 密码输入时屏幕不会显示任何字符，这是正常行为
> - 此密码与 Windows 密码无关

### 切换默认用户

如果误操作跳过了用户创建，可以重新设置：

```bash
# 在 WSL 中执行
sudo adduser your_username
sudo usermod -aG sudo your_username
```

然后在 PowerShell 中配置默认用户：

```powershell
ubuntu config --default-user your_username
```

### 更新系统包

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 7. 常用 WSL 命令

以下命令在 **PowerShell** 或 **命令提示符** 中执行：

| 命令 | 说明 |
|------|------|
| `wsl --install` | 安装 WSL（含默认发行版） |
| `wsl --install -d <名称>` | 安装指定发行版 |
| `wsl --list --online` | 查看可用的在线发行版 |
| `wsl --list --verbose` | 查看已安装的发行版及其 WSL 版本 |
| `wsl --set-default-version 2` | 将默认 WSL 版本设为 2 |
| `wsl --set-default <发行版>` | 设置默认发行版 |
| `wsl --set-version <发行版> 2` | 将指定发行版升级到 WSL2 |
| `wsl --shutdown` | 关闭所有 WSL 实例 |
| `wsl --update` | 更新 WSL 到最新版本 |
| `wsl --update --pre-release` | 更新到 WSL 预览版 |
| `wsl --unregister <发行版>` | 卸载指定发行版（数据将丢失） |
| `wsl -d <发行版>` | 启动指定发行版 |
| `wsl <命令>` | 在默认发行版中执行命令 |

---

## 8. 多发行版管理

WSL 支持同时安装多个 Linux 发行版。

### 安装多个发行版

```powershell
wsl --install -d Debian
wsl --install -d kali-linux
```

### 查看所有已安装发行版

```powershell
wsl --list --verbose
```

输出示例：

```
  NAME            STATE           VERSION
* Ubuntu          Running         2
  Debian          Stopped         2
  kali-linux      Stopped         2
```

> `*` 表示当前默认发行版。

### 在不同发行版间切换

```powershell
# 切换默认发行版
wsl --set-default Debian

# 临时使用指定发行版运行命令
wsl -d kali-linux cat /etc/os-release
```

### 推荐使用 Windows Terminal

[Windows Terminal](https://learn.microsoft.com/zh-cn/windows/terminal/install) 支持多标签页、分屏、自定义主题，可同时打开多个发行版，是管理多发行版的最佳选择。

---

## 9. 常见问题排查

### ❌ 错误：`WslRegisterDistribution failed with error: 0x80370102`

**原因**：虚拟化未启用。

**解决**：
1. 重启进入 BIOS/UEFI
2. 找到虚拟化相关选项（名称因主板而异）：
   - Intel：`Intel Virtualization Technology (VT-x)` → 设为 `Enabled`
   - AMD：`SVM Mode` → 设为 `Enabled`
3. 保存并重启

### ❌ 错误：`0x800701bc` 或 `0x800f0801`

**原因**：WSL2 内核组件未安装或版本过旧。

**解决**：
```powershell
wsl --update
```

如果仍无法解决，手动下载安装内核更新包：https://aka.ms/wsl2kernel

### ❌ 错误：`0x80072ee2` 或网络超时

**原因**：网络连接问题。

**解决**：
1. 检查网络连接和代理设置
2. 尝试使用 `--web-download` 参数：
   ```powershell
   wsl --install --web-download
   ```
3. 如果使用代理，确保 PowerShell 代理配置正确

### ❌ WSL 内存占用过高

**解决**：创建或编辑 `%UserProfile%\.wslconfig` 文件限制资源：

```ini
[wsl2]
memory=4GB          # 限制最大内存
processors=2        # 限制 CPU 核数
swap=2GB            # 限制交换空间
localhostForwarding=true
```

修改后运行 `wsl --shutdown` 使配置生效。

### ❌ 无法访问 localhost 上的服务

**解决**：确保 `.wslconfig` 中 `localhostForwarding=true`（默认已启用），然后重启 WSL：

```powershell
wsl --shutdown
```

### ❌ 文件系统性能差

**最佳实践**：
- **将项目文件存放在 WSL 文件系统内**（如 `\\wsl$\Ubuntu\home\user\project`），而非 Windows 文件系统（`/mnt/c/`）
- 跨文件系统（Windows ↔ Linux）的 I/O 性能显著低于原生文件系统

---

## 10. 进阶技巧

### 在 WSL 中使用 VS Code

1. 在 WSL 终端中执行：
   ```bash
   code .
   ```
2. VS Code 会自动安装 **WSL 扩展**，实现无缝远程开发

### 使用 Docker

1. 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. 在设置中启用 **Use the WSL 2 based engine**
3. 在 **Resources → WSL Integration** 中勾选你的发行版

### 访问 Windows 文件

WSL 中通过 `/mnt/` 挂载 Windows 盘符：

```bash
cd /mnt/c/Users/你的用户名/Desktop
```

### 从 Windows 访问 WSL 文件

在文件资源管理器地址栏输入：

```
\\wsl$\Ubuntu\home\你的用户名
```

### GPU 加速

WSL2 支持 GPU 直通，可用于 AI/ML 工作负载：

```bash
# 检查 GPU 是否可用
nvidia-smi
```

需要安装 NVIDIA 驱动（Windows 端），WSL2 会自动继承 GPU 支持。

### 设置 WSL 开机自启

创建一个 Windows 计划任务，触发器设为「登录时」，操作为运行：

```
wsl -d Ubuntu -- /bin/bash -c "while true; do sleep 1000; done" &
```

---

## 11. 常用配置详解

### 11.1 代理配置（通过 .wslconfig 镜像网络）

传统方式需要手动获取 Windows 主机 IP 并设置环境变量，WSL2 现已支持 **镜像网络模式（Mirrored Mode）**，WSL 与 Windows 共享同一网络栈，代理配置大幅简化。

#### 方法一：镜像网络模式（推荐）

编辑或创建 Windows 用户目录下的 `.wslconfig` 文件（路径：`%UserProfile%\.wslconfig`）：

```ini
[wsl2]
networkingMode=mirrored
dnsTunneling=true
autoProxy=true
```

> **配置项说明**：
> - `networkingMode=mirrored`：镜像网络模式，WSL 与 Windows 共享网络栈，WSL 可直接通过 `127.0.0.1` 访问 Windows 上的服务
> - `dnsTunneling=true`：DNS 隧道，改善 DNS 解析的兼容性
> - `autoProxy=true`：自动继承 Windows 的代理设置，WSL 中的程序会自动使用 Windows 系统代理（无需手动设置环境变量）

然后在 PowerShell 中重启 WSL：

```powershell
wsl --shutdown
```

重启后，WSL 与 Windows 共享网络，直接使用 `127.0.0.1` 即可访问 Windows 上的代理：

```bash
# 在 ~/.bashrc 或 ~/.zshrc 中添加
proxy_on() {
    export http_proxy="http://127.0.0.1:7890"
    export https_proxy="http://127.0.0.1:7890"
    export all_proxy="socks5://127.0.0.1:7890"
    export no_proxy="localhost,127.0.0.1,::1"
    echo "代理已开启 → 127.0.0.1:7890"
}

proxy_off() {
    unset http_proxy https_proxy all_proxy no_proxy
    echo "代理已关闭"
}
```

> **优势**：无需动态获取主机 IP，无需开启「允许局域网连接」，配置一次永久生效。

#### 方法二：传统 NAT 模式（备选）

如果因兼容性问题无法使用镜像模式，保留默认 NAT 网络，需手动指向主机 IP：

```bash
# 获取 Windows 主机 IP
export HOST_IP=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')

# 设置代理
export http_proxy="http://${HOST_IP}:7890"
export https_proxy="http://${HOST_IP}:7890"
export all_proxy="socks5://${HOST_IP}:7890"
export no_proxy="localhost,127.0.0.1,::1"
```

> **注意**：NAT 模式下必须确保代理软件已开启「允许局域网连接」。

#### Windows 端代理软件设置

| 代理软件 | 设置方式 |
|----------|----------|
| Clash / Clash Verge | 开启 `Allow LAN`（仅 NAT 模式需要） |
| V2rayN | 勾选「允许来自局域网的连接」（仅 NAT 模式需要） |
| Shadowsocks | 勾选「允许局域网连接」（仅 NAT 模式需要） |

#### 验证代理是否生效

```bash
proxy_on
curl -I https://www.google.com
# 返回 200 OK 表示代理生效
```

---

### 11.2 替换国内软件镜像源

默认的 Ubuntu 软件源服务器在国外，下载速度慢，建议替换为国内镜像。

#### 自动替换（推荐）

```bash
# 备份原有源
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 替换为阿里云镜像（以 Ubuntu 22.04 为例）
sudo sed -i 's@//.*archive.ubuntu.com@//mirrors.aliyun.com@g' /etc/apt/sources.list
sudo sed -i 's@//.*security.ubuntu.com@//mirrors.aliyun.com@g' /etc/apt/sources.list

# 更新索引
sudo apt update
```

#### 手动替换

编辑 `/etc/apt/sources.list`，将内容替换为：

```bash
# 阿里云镜像源（Ubuntu 22.04 Jammy）
deb https://mirrors.aliyun.com/ubuntu/ jammy main restricted universe multiverse
deb https://mirrors.aliyun.com/ubuntu/ jammy-updates main restricted universe multiverse
deb https://mirrors.aliyun.com/ubuntu/ jammy-backports main restricted universe multiverse
deb https://mirrors.aliyun.com/ubuntu/ jammy-security main restricted universe multiverse
```

> **其他可选镜像**：清华大学 `mirrors.tuna.tsinghua.edu.cn`、中科大 `mirrors.ustc.edu.cn`、华为 `mirrors.huaweicloud.com`

#### pip 国内镜像

```bash
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

#### npm 国内镜像

```bash
npm config set registry https://registry.npmmirror.com
```

---

### 11.3 安装 Oh My Zsh 美化终端

#### 安装 Zsh 和 Oh My Zsh

```bash
# 安装 zsh
sudo apt install zsh -y

# 安装 Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# 如果无法访问 GitHub，使用 Gitee 镜像
sh -c "$(curl -fsSL https://gitee.com/mirrors/oh-my-zsh/raw/master/tools/install.sh)"
```

#### 安装常用插件

```bash
# zsh-autosuggestions（命令自动补全建议）
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# zsh-syntax-highlighting（命令语法高亮）
git clone https://github.com/zsh-users/zsh-syntax-highlighting ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

编辑 `~/.zshrc`，找到 `plugins=` 行，修改为：

```bash
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
```

#### 推荐主题

编辑 `~/.zshrc`，修改 `ZSH_THEME=`：

```bash
# Powerlevel10k（需额外安装，效果最佳）
ZSH_THEME="powerlevel10k/powerlevel10k"

# 其他简洁主题
# ZSH_THEME="agnoster"
# ZSH_THEME="robbyrussell"  # 默认
```

安装 Powerlevel10k：

```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/powerlevel10k
```

安装完成后运行配置向导：

```bash
p10k configure
```

#### 设置 Zsh 为默认 Shell

```bash
chsh -s $(which zsh)
```

---

### 11.4 systemd 支持与自启动服务

较新版本的 WSL2 已原生支持 systemd，可使用 `systemctl` 管理服务。

#### 启用 systemd

编辑或创建 `/etc/wsl.conf`：

```ini
[boot]
systemd=true
```

然后在 PowerShell 中重启 WSL：

```powershell
wsl --shutdown
```

重新进入 WSL 后验证：

```bash
systemctl list-units --type=service
```

#### 使用 systemd 管理服务示例

```bash
# 启动 SSH 服务并设置开机自启
sudo systemctl enable ssh
sudo systemctl start ssh

# 启动 Docker 服务
sudo systemctl enable docker
sudo systemctl start docker

# 查看服务状态
sudo systemctl status ssh
```

#### 通过 wsl.conf 配置启动命令

编辑 `/etc/wsl.conf`：

```ini
[boot]
systemd=true
command = /usr/bin/env bash -c "echo 'WSL 已启动'"

[interop]
enabled=true
appendWindowsPath=true

[automount]
enabled=true
root=/mnt/
options="metadata,umask=22,fmask=11"
```

> **说明**：
> - `appendWindowsPath=true`：将 Windows PATH 追加到 WSL PATH（方便调用 Windows 程序）
> - `options="metadata"`：允许在 WSL 中修改 Windows 文件的权限位
> - `fmask=11`：修复 Windows 文件在 WSL 中的执行权限问题

---

### 11.5 Windows 与 WSL 互操作

#### 从 WSL 调用 Windows 程序

WSL2 可以直接运行 Windows 的 `.exe` 程序：

```bash
# 用 Windows 资源管理器打开当前目录
explorer.exe .

# 用 Windows 打开文件
cmd.exe /c start file.pdf

# 用 Windows 的 notepad 打开文件
notepad.exe README.md

# 调用 Windows 的 PowerShell
powershell.exe -Command "Get-Date"
```

#### 从 Windows 调用 WSL 命令

在 PowerShell 或 CMD 中：

```powershell
# 在 WSL 中执行命令
wsl ls -la /home
wsl cat /etc/os-release

# 使用指定发行版执行命令
wsl -d Debian cat /etc/debian_version
```

#### 设置 Windows 终端默认启动 WSL

1. 安装 [Windows Terminal](https://apps.microsoft.com/detail/9n0dx20hk701)
2. 打开 Windows Terminal → **设置** → **启动** → **默认配置文件** → 选择你的发行版（如 Ubuntu）
3. 可进一步自定义外观、字体、快捷键等

---

## 参考资料

- [Microsoft 官方安装文档](https://learn.microsoft.com/zh-cn/windows/wsl/install)
- [WSL 手动安装步骤](https://learn.microsoft.com/zh-cn/windows/wsl/install-manual)
- [WSL 基本命令参考](https://learn.microsoft.com/zh-cn/windows/wsl/basic-commands)
- [WSL 1 与 WSL 2 对比](https://learn.microsoft.com/zh-cn/windows/wsl/compare-versions)
- [WSL GitHub Releases](https://github.com/microsoft/wsl/releases)
