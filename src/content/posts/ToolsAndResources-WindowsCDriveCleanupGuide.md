---
title: 【实践记录】Windows C 盘空间不足的清理与优化指南
published: 2026-05-15
description: 当 Windows 系统 C 盘空间不足时的系统性解决方案，从快速清理到深度优化的完整指南。
lang: zh
tags: [实践记录]
---

当 Windows 系统 C 盘空间不足时，会导致系统运行缓慢、软件无法更新、甚至无法开机等问题。本指南提供从快速清理到深度优化的系统性解决方案，帮助你释放 C 盘空间。

<!--
---

## 目录

- [一、快速清理（立即见效）](#一快速清理立即见效)
- [二、深度清理（释放大量空间）](#二深度清理释放大量空间)
- [三、将 C 盘文件夹设置到 D 盘](#三将-c-盘文件夹设置到-d-盘)
  - [3.1 更改默认存储位置](#31-更改默认存储位置)
  - [3.2 移动用户文件夹](#32-移动用户文件夹)
  - [3.3 调整虚拟内存](#33-调整虚拟内存)
- [四、迁移开发环境到 D 盘](#四迁移开发环境到-d-盘)
  - [4.1 Docker 迁移](#41-docker-迁移)
  - [4.2 WSL 迁移](#42-wsl-迁移)
  - [4.3 node_modules 处理](#43-node_modules-处理)
  - [4.4 使用符号链接](#44-使用符号链接)
- [五、其他软件数据迁移](#五其他软件数据迁移)
- [六、终极解决方案](#六终极解决方案)
- [七、操作顺序建议](#七操作顺序建议)
- [八、常见问题](#八常见问题)
- [九、注意事项](#九注意事项)
-->

---

## 一、快速清理（立即见效）

### 1.1 磁盘清理工具

Windows 内置工具，安全且操作简单：

1. 打开 **文件资源管理器** → 右键 **C 盘** → **属性**
2. 点击 **磁盘清理**
3. 勾选要清理的项目：
   - ☑️ 临时文件
   - ☑️ 回收站
   - ☑️ 缩略图
   - ☑️ 临时 Windows 安装文件
   - ☑️ Windows 更新清理
4. 点击 **确定**

> 💡 **进阶**：点击 **清理系统文件** 可释放更多空间（需管理员权限）

**预计释放**：1-10 GB

### 1.2 清理临时文件

**方法 1：运行命令快速清理**

```
Win + R → 输入 %temp% → Ctrl+A 全选 → Delete 删除
Win + R → 输入 temp   → Ctrl+A 全选 → Delete 删除
```

> 部分文件无法删除属于正常现象，跳过即可。

**方法 2：启用存储感知自动清理**

1. **设置** → **系统** → **存储**
2. 打开 **存储感知** 开关
3. 配置自动清理规则

**预计释放**：1-5 GB

### 1.3 清空回收站

- 右键 **回收站** → **清空回收站**

**预计释放**：视回收站内容而定

---

## 二、深度清理（释放大量空间）

### 2.1 卸载不常用软件

1. **设置** → **应用** → **已安装的应用**
2. 按 **大小** 排序
3. 卸载占用大且不常用的软件

**常见占用大的软件**：
- Adobe 系列（Photoshop、Premiere 等）
- 大型游戏
- 旧版本开发工具

### 2.2 查找并删除大文件

**推荐工具**：

| 工具 | 特点 | 适用场景 |
|-----|------|---------|
| **WizTree** | 扫描极快，免费 | 快速定位大文件 |
| **SpaceSniffer** | 可视化展示 | 直观查看空间占用 |
| **TreeSize Free** | 详细报表 | 深度分析 |

**常见大文件位置**：

```
C:\Windows\SoftwareDistribution\Download    → Windows 更新缓存
C:\Users\用户名\AppData\Local\Temp            → 用户临时文件
C:\Users\用户名\Downloads                     → 下载文件夹
C:\hiberfil.sys                              → 休眠文件（与内存同大）
C:\pagefile.sys                              → 虚拟内存文件
```

### 2.3 清理系统还原点

系统还原点会占用大量空间：

1. 右键 **此电脑** → **属性** → **系统保护**
2. 选择 **C 盘** → **配置**
3. 选择 **删除** 删除所有还原点
4. 或调整 **最大使用量** 限制占用空间

**预计释放**：5-20 GB

### 2.4 关闭休眠功能

休眠文件 `hiberfil.sys` 占用与内存相同的空间：

```powershell
# 管理员身份运行 PowerShell
powercfg /hibernate off
```

> ⚠️ 关闭后无法使用休眠和快速启动，睡眠功能不受影响。

**预计释放**：8-32 GB（与内存大小相同）

---

## 三、将 C 盘文件夹设置到 D 盘

### 3.1 更改默认存储位置

设置新内容的默认保存位置，避免新文件继续占用 C 盘：

1. **设置** → **系统** → **存储**
2. **高级存储设置** → **保存新内容的地方**
3. 将以下项目改为 D 盘：
   - 新的应用将保存到
   - 新的文档将保存到
   - 新的音乐将保存到
   - 新的图片将保存到
   - 新的视频将保存到

> 💡 此设置只影响新内容，已有文件不会自动迁移。

### 3.2 移动用户文件夹

将 C 盘已有的用户文件夹移动到 D 盘：

**可移动的文件夹**：

| 文件夹 | 原路径 | 操作 |
|-------|--------|------|
| 桌面 | `C:\Users\用户名\Desktop` | 移动到 D 盘 |
| 文档 | `C:\Users\用户名\Documents` | 移动到 D 盘 |
| 下载 | `C:\Users\用户名\Downloads` | 移动到 D 盘 |
| 图片 | `C:\Users\用户名\Pictures` | 移动到 D 盘 |
| 音乐 | `C:\Users\用户名\Music` | 移动到 D 盘 |
| 视频 | `C:\Users\用户名\Videos` | 移动到 D 盘 |

**操作步骤**：

1. 打开 **文件资源管理器** → `C:\Users\你的用户名`
2. 右键文件夹（如 **文档**）→ **属性** → **位置**
3. 点击 **移动** → 选择 D 盘位置（如 `D:\Documents`）
4. 点击 **应用** → 选择 **是** 移动文件

> ⚠️ **AppData** 文件夹不建议手动移动。

**预计释放**：5-20 GB

### 3.3 调整虚拟内存

将虚拟内存文件 `pagefile.sys` 从 C 盘移到 D 盘：

1. 右键 **此电脑** → **属性** → **高级系统设置**
2. **性能** → **设置** → **高级**
3. **虚拟内存** → **更改**
4. 取消勾选 **自动管理所有驱动器的分页文件大小**
5. **C 盘** → **无分页文件** → **设置**
6. **D 盘** → **系统管理的大小** → **设置**
7. **确定** → 重启电脑

**预计释放**：2-16 GB

---

## 四、迁移开发环境到 D 盘

### 4.1 Docker 迁移

**方法 1：Docker Desktop 设置（推荐）**

1. **Docker Desktop** → **⚙️ Settings**
2. **Resources** → **Advanced**
3. **Disk image location** → **Browse** → 选择 `D:\DockerData`
4. **Apply & Restart**

**方法 2：手动迁移 WSL2 后端**

```powershell
# 停止 Docker
wsl --export docker-desktop-data D:\docker-data.tar
wsl --unregister docker-desktop-data
wsl --import docker-desktop-data D:\WSL\docker-data D:\docker-data.tar --version 2
del D:\docker-data.tar
```

**预计释放**：10-50 GB

### 4.2 WSL 迁移

```powershell
# 导出 WSL 发行版
wsl --export Ubuntu D:\ubuntu.tar

# 注销原发行版
wsl --unregister Ubuntu

# 导入到 D 盘
wsl --import Ubuntu D:\WSL\Ubuntu D:\ubuntu.tar --version 2

# 删除临时文件
del D:\ubuntu.tar

# 设置默认用户
Ubuntu config --default-user 你的用户名
```

**预计释放**：5-30 GB

### 4.3 node_modules 处理

**方案 1：项目整体移到 D 盘**

```bash
# 移动项目文件夹到 D 盘
cd D:\Projects\my-project
npm install
```

**方案 2：更改 npm 缓存位置**

```bash
npm config set cache "D:\npm-cache"
npm config set prefix "D:\npm-global"
```

**方案 3：使用 pnpm（推荐）**

```bash
# 安装 pnpm
npm install -g pnpm

# 设置存储位置
pnpm config set store-dir "D:\pnpm-store"

# 使用 pnpm 安装依赖
pnpm install
```

**方案 4：清理无用 node_modules**

```bash
npm install -g npkill
npkill
```

### 4.4 使用符号链接

将 C 盘文件夹"虚拟"移动到 D 盘，程序无感知：

**常用可链接的文件夹**：

| 原位置 | 链接到 | 说明 |
|--------|--------|------|
| `C:\Users\用户名\.nuget` | `D:\Dev\.nuget` | NuGet 包缓存 |
| `C:\Users\用户名\.m2` | `D:\Dev\.m2` | Maven 仓库 |
| `C:\Users\用户名\.gradle` | `D:\Dev\.gradle` | Gradle 缓存 |
| `C:\Users\用户名\.android` | `D:\Dev\.android` | Android SDK |

**创建符号链接**：

```powershell
# 以管理员身份运行

# 1. 复制文件夹到 D 盘
robocopy "C:\Users\用户名\.nuget" "D:\Dev\.nuget" /E /COPYALL /XJ

# 2. 删除原文件夹（先备份）
Rename-Item "C:\Users\用户名\.nuget" ".nuget_backup"

# 3. 创建符号链接
mklink /D "C:\Users\用户名\.nuget" "D:\Dev\.nuget"

# 4. 测试正常后删除备份
Remove-Item "C:\Users\用户名\.nuget_backup" -Recurse -Force
```

---

## 五、其他软件数据迁移

### 5.1 微信/QQ 聊天记录

**微信**：设置 → 文件管理 → 更改 → 选择 D 盘

**QQ**：设置 → 文件管理 → 更改目录 → 选择 D 盘

### 5.2 浏览器数据

**Chrome**：
- 设置 → 下载内容 → 更改下载位置

**Edge**：
- 设置 → 下载 → 位置 → 更改

### 5.3 游戏平台

**Steam**：
- 设置 → 下载 → Steam 库文件夹 → 添加 D 盘

**Epic**：
- 设置 → 下载位置 → 修改到 D 盘

### 5.4 推荐工具

| 工具 | 功能 |
|-----|------|
| **FreeMove** | 可视化迁移文件夹并创建符号链接 |
| **Steam Mover** | 专门迁移 Steam 游戏 |
| **FolderMove** | 简单的文件夹迁移工具 |

---

## 六、终极解决方案

### 6.1 扩容 C 盘

使用 **DiskGenius** 等工具从 D 盘划分空间给 C 盘。

> ⚠️ 操作前务必备份数据！

### 6.2 重装系统

1. 备份数据到 D 盘或外部存储
2. 重装 Windows
3. C 盘建议分配 150-200 GB
4. 软件安装到 D 盘

---

## 七、操作顺序建议

按优先级排序，建议依次执行：

| 优先级 | 操作 | 释放空间 | 难度 | 风险 |
|:------:|------|:--------:|:----:|:----:|
| 1 | 磁盘清理工具 | 1-10 GB | ⭐ | 无 |
| 2 | 清理临时文件 | 1-5 GB | ⭐ | 无 |
| 3 | 卸载不常用软件 | 视情况 | ⭐ | 无 |
| 4 | 关闭休眠 | 8-32 GB | ⭐ | 低 |
| 5 | 更改默认存储位置 | 预防新文件 | ⭐ | 无 |
| 6 | 移动用户文件夹 | 5-20 GB | ⭐ | 低 |
| 7 | 调整虚拟内存 | 2-16 GB | ⭐⭐ | 低 |
| 8 | Docker 迁移 | 10-50 GB | ⭐⭐ | 中 |
| 9 | WSL 迁移 | 5-30 GB | ⭐⭐⭐ | 中 |
| 10 | 使用符号链接 | 视情况 | ⭐⭐ | 中 |
| 11 | node_modules 处理 | 视情况 | ⭐ | 低 |
| 12 | C 盘扩容 | 视 D 盘 | ⭐⭐⭐ | 高 |

---

## 八、常见问题

### Q1：哪些文件绝对不能删除？

❌ 不要删除：
- `C:\Windows` 系统文件夹
- `C:\Program Files` 和 `C:\Program Files (x86)`
- `C:\ProgramData` 程序数据
- `C:\Users\用户名\AppData\Roaming` 应用数据

### Q2：如何查看 C 盘空间占用？

```powershell
# 查看各文件夹大小
Get-ChildItem C:\ -Directory | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse -ErrorAction SilentlyContinue | 
        Measure-Object -Property Length -Sum).Sum / 1GB
    [PSCustomObject]@{
        Folder = $_.Name
        'Size(GB)' = [math]::Round($size, 2)
    }
} | Sort-Object 'Size(GB)' -Descending
```

### Q3：迁移后软件还能用吗？

| 项目 | 影响 |
|------|------|
| Docker | 需重新配置镜像加速 |
| WSL | 需重新设置默认用户 |
| node_modules | 需重新 `npm install` |
| 用户文件夹 | 无影响，无缝迁移 |

---

## 九、注意事项

1. **备份数据**：迁移前备份重要数据
2. **确保 D 盘空间**：确认 D 盘有足够空间
3. **关闭程序**：迁移前关闭相关软件
4. **管理员权限**：部分操作需管理员身份
5. **谨慎删除**：不确定的文件不要删

*最后更新：2026-05-15*
