---
title: 【实践记录】Windows 解决 DockerDesktop.vhdx 迁移出错并成功移动到 D 盘
published: 2026-06-02
description: 解决 Docker Desktop 迁移 DockerDesktop.vhdx 到 D 盘时出现 "Source and destination directory owners mismatch" 错误的方法，通过启用 WSL2 后端引擎成功完成迁移。
lang: zh
tags: [实践记录]
---

## 一、问题背景

Windows 上使用 Docker Desktop 一段时间后，C 盘空间被大量占用。

用 [WizTree](https://diskanalyzer.com/) 快速扫描 C 盘后，发现一个占用空间较大的文件，有二三十 GB：

```text
C:\ProgramData\DockerDesktop\vm-data\DockerDesktop.vhdx
```

这个文件是 Docker Desktop 的虚拟磁盘文件，里面通常包含：

```text
Docker 镜像
Docker 容器
Docker volume
构建缓存
数据库容器数据
开发环境数据
```

随着 Docker 使用时间增加，`DockerDesktop.vhdx` 可能会占用几十 GB，导致 C 盘空间不足。

目标是：

```text
将 DockerDesktop.vhdx 从 C 盘移动到 D 盘
释放 C 盘几十 GB 空间
```

---

## 二、迁移时出现的错误

在 Docker Desktop 中进入：

```text
Settings → Resources → Advanced → Disk image location
```

尝试把 Docker 磁盘镜像位置从 C 盘改到 D 盘时，出现报错：

```text
Docker Desktop - Settings not applied

An error occurred while applying the 'Disk image location' setting.
The previous value has been restored.

status code not OK but 500: Unhandled exception:
Source and destination directory owners mismatch.
```

中文意思大致是：

```text
Docker Desktop 设置没有应用成功。

应用 Disk image location 设置时发生错误。
之前的设置已经被恢复。

错误代码 500：
源目录和目标目录的所有者不匹配。
```

关键错误是：

```text
Source and destination directory owners mismatch
```

也就是：

```text
源目录和目标目录所有者不一致
```

---

## 三、前面错误的排查方向

最开始看到这个报错时，容易以为是 D 盘目标目录权限或所有者不对。

例如可能会想到：

```text
修改 D 盘目录所有者
修改 D 盘目录权限
给 SYSTEM / Administrators 授权
```

但这次实际情况里，**通过手动修改文件所有者/目录权限并不是正确解决方式**。

真正的问题不是简单的 Windows 文件夹 owner 设置，而是：

```text
Docker Desktop 当前后端模式不合适，导致 Disk image location 迁移功能无法正确完成。
```

所以不要把重点放在手动改目录所有者上，也不建议直接用命令强行修改权限。

---

## 四、真正有效的解决方法：启用 WSL2 后端引擎

后面进入 Docker Desktop 设置，发现关键是先启用 WSL2 后端。

路径是：

```text
Docker Desktop
→ Settings
→ General
→ Use the WSL 2 based engine
```

勾选：

```text
Use the WSL 2 based engine
```

然后点击：

```text
Apply & Restart
```

让 Docker Desktop 重启。

这一步是关键。

因为在没有启用 WSL2 后端引擎之前，Docker Desktop 的 `Disk image location` 迁移可能会失败，并出现前面的错误：

```text
Source and destination directory owners mismatch.
```

启用 WSL2 后端之后，Docker Desktop 的磁盘镜像迁移功能才能正常工作。

---

## 五、再次修改 Disk image location 到 D 盘

启用 WSL2 后端引擎后，再次进入：

```text
Docker Desktop
→ Settings
→ Resources
→ Advanced
→ Disk image location
```

把位置从 C 盘改到 D 盘，例如：

```text
D:\DockerDesktop
```

或者：

```text
D:\Docker\DockerDesktop
```

然后点击：

```text
Apply & Restart
```

这次 Docker Desktop 成功完成迁移。

---

## 六、迁移前后路径

迁移前，`DockerDesktop.vhdx` 位于：

```text
C:\ProgramData\DockerDesktop\vm-data\DockerDesktop.vhdx
```

迁移后，Docker Desktop 会把虚拟磁盘移动到 D 盘设置的新位置，例如：

```text
D:\DockerDesktop\DockerDesktop.vhdx
```

或者 Docker Desktop 自动创建的对应目录下。

最终结果：

```text
DockerDesktop.vhdx 成功移动到 D 盘
C 盘释放几十 GB 空间
Docker Desktop 可以正常启动
原来的 Docker 数据没有丢失
```

---

## 七、迁移后检查

迁移完成后，可以执行：

```powershell
docker ps
```

查看容器是否正常。

执行：

```powershell
docker images
```

查看镜像是否还在。

执行：

```powershell
docker system df
```

查看 Docker 当前占用空间。

如果这些命令都能正常执行，说明 Docker Desktop 已经正常工作。

---

## 八、不要手动剪切 DockerDesktop.vhdx

不建议直接手动移动这个文件：

```text
C:\ProgramData\DockerDesktop\vm-data\DockerDesktop.vhdx
```

不要直接：

```text
剪切 DockerDesktop.vhdx → 粘贴到 D 盘
```

因为它是 Docker Desktop 正在管理的虚拟磁盘文件。

手动移动可能导致：

```text
Docker Desktop 找不到虚拟磁盘
Docker Desktop 启动失败
镜像、容器、volume 无法识别
Docker 数据损坏
```

正确方式应该是：

```text
通过 Docker Desktop 设置里的 Disk image location 迁移
```

---

## 九、完整解决路径

```text
1. 发现 C 盘空间不足
2. 定位到 DockerDesktop.vhdx 占用几十 GB
3. 文件位置是：
   C:\ProgramData\DockerDesktop\vm-data\DockerDesktop.vhdx

4. 在 Docker Desktop 中修改 Disk image location 到 D 盘
5. 出现错误：
   Docker Desktop - Settings not applied
   status code not OK but 500
   Source and destination directory owners mismatch

6. 一开始容易误以为是目录 owner / 权限问题
7. 但实际不需要通过手动修改文件所有者解决

8. 进入 Docker Desktop 设置：
   Settings → General

9. 启用：
   Use the WSL 2 based engine

10. 点击：
    Apply & Restart

11. 再次进入：
    Settings → Resources → Advanced → Disk image location

12. 将位置改到 D 盘

13. 点击：
    Apply & Restart

14. DockerDesktop.vhdx 成功迁移到 D 盘

15. C 盘释放几十 GB 空间
```

---

## 十、最终总结

这次迁移失败的报错是：

```text
Source and destination directory owners mismatch.
```

表面上看像是源目录和目标目录所有者不一致，但这次真正有效的解决方式并不是手动修改目录所有者，而是：

```text
先启用 Docker Desktop 的 WSL2 后端引擎，
再重新使用 Disk image location 迁移 DockerDesktop.vhdx。
```

最终正确路径是：

```text
Docker Desktop
→ Settings
→ General
→ Use the WSL 2 based engine
→ Apply & Restart

然后：

Docker Desktop
→ Settings
→ Resources
→ Advanced
→ Disk image location
→ 改到 D 盘
→ Apply & Restart
```

最终效果：

```text
DockerDesktop.vhdx 成功移动到 D 盘
C 盘释放几十 GB 空间
Docker Desktop 正常运行
Docker 镜像、容器、volume 数据正常保留
```
