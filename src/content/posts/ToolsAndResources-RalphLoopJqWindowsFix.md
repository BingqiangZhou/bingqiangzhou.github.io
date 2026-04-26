---
title: "【折腾记录】Windows 上 Ralph Loop 报错 jq: command not found 解决方案"
published: 2026-04-27
description: "Windows 上使用 Claude Code Ralph Loop 时遇到 jq 未安装报错的排查与解决方案。"
lang: zh
tags: ["折腾记录", "工具分享"]
---

> 问题来源：[GitHub Issue #14817](https://github.com/anthropics/claude-code/issues/14817)
> 影响范围：Windows 上使用 Ralph Loop（Ralph Wiggum 插件）时，Stop Hook 脚本依赖 `jq` 但系统未安装

---

## 错误信息

```
Stop hook error: Failed with non-blocking status code:
/c/Users/<用户名>/.claude/plugins/cache/claude-plugins-official/ralph-loop/1.0.0/hooks/stop-hook.sh:
line 32: jq: command not found
```

## 原因

Ralph Loop 的 `hooks/stop-hook.sh` 脚本中多处使用 `jq` 解析 JSON，但：
- 插件 README 和 `plugin.json` 均未声明此依赖
- Windows 默认不安装 `jq`
- Claude Code 在 Windows 上通过 Git Bash 执行 Hook 脚本，Git Bash 中也找不到 `jq`

---

## 解决方案

### 方案 1：下载 jq.exe 并加入系统 PATH（推荐）

**步骤 1 — 下载 jq.exe**

从 GitHub Releases 下载 Windows amd64 版本：

```
https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-windows-amd64.exe
```

**步骤 2 — 放到固定目录**

将下载的 `jq-windows-amd64.exe` 重命名为 `jq.exe`，放到一个固定目录，例如：

```
C:\Tools\jq\jq.exe
```

**步骤 3 — 加入系统 PATH**

1. 右键「此电脑」→「属性」→「高级系统设置」→「环境变量」
2. 在「系统变量」中找到 `Path`，点击「编辑」
3. 点击「新建」，添加 `C:\Tools\jq`
4. 点击「确定」保存

**步骤 4 — 验证**

重启终端（PowerShell / Git Bash / Claude Code），执行：

```bash
jq --version
# 应输出：jq-1.7.1
```

> ✅ 加入系统 PATH 后，Git Bash 和 Claude Code 都能找到 `jq`，不受插件更新影响。

---

### 方案 2：winget 一键安装

在 PowerShell 中执行：

```powershell
winget install jqlang.jq
```

安装后**重启终端**即可。`jq` 会自动加入系统 PATH。

> ✅ 最简单，一行命令搞定，不怕插件更新覆盖。

---

### 方案 3：Git Bash 中手动安装到 ~/bin/

在 Git Bash 中执行：

```bash
mkdir -p ~/bin
curl -L -o ~/bin/jq.exe "https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-windows-amd64.exe"
chmod +x ~/bin/jq.exe
```

确保 `~/bin` 在 PATH 中（**同时写入两个文件**，因为 Git Bash 非交互式 shell 可能不加载 `.bashrc`）：

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bash_profile
```

重启 Claude Code 会话后验证：

```bash
jq --version
```

> ⚠️ 此方案在插件更新后**可能需要重新操作**。

---

### 方案 4：使用 WSL（最稳定）

在 WSL 中 `jq` 可直接通过包管理器安装，不存在 Windows 路径兼容性问题：

```bash
sudo apt update && sudo apt install jq -y
```

然后在 WSL 终端中运行 Claude Code。

---

## 方案对比

| 方案 | 难度 | 怕插件更新 | 怕重启失效 | 推荐度 |
|---|---|---|---|---|
| **下载 jq.exe + 系统 PATH** | ⭐⭐ | 不怕 | 不怕 | ⭐⭐⭐ |
| **winget install** | ⭐ | 不怕 | 不怕 | ⭐⭐⭐ |
| **Git Bash ~/bin/** | ⭐⭐ | 可能 | 不怕 | ⭐⭐ |
| **WSL** | ⭐⭐ | 不怕 | 不怕 | ⭐⭐⭐ |

## 排查清单

安装后如果仍报错，按以下顺序检查：

- [ ] `jq --version` 能正常输出版本号
- [ ] 执行 `jq` 命令的终端与运行 Claude Code 的终端是**同一个环境**（都是 Git Bash 或都是 PowerShell）
- [ ] 如果修改了 PATH，已**重启终端**（不是只重启 Claude Code）
- [ ] 如果用方案 3，确认 `~/.bash_profile` 中有 PATH 配置
