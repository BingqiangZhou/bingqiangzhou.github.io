---
title: "【工具分享】npm 国内源使用指南"
published: 2026-04-28
description: 介绍 npm 切换国内镜像源的多种方法，包括临时使用、永久设置、nrm 管理以及常用国内源地址汇总。
lang: zh
tags: ["工具分享", "学习笔记"]
---

## 一、临时使用（单次安装）

```bash
npm install <包名> --registry=https://registry.npmmirror.com
```

## 二、永久设置（推荐）

```bash
npm config set registry https://registry.npmmirror.com
```

验证是否设置成功：

```bash
npm config get registry
```

## 三、使用 nrm 管理源（灵活切换）

```bash
# 安装 nrm
npm install -g nrm

# 查看可用源列表
nrm ls

# 切换到淘宝源
nrm use taobao

# 查看当前使用的源
nrm current
```

## 四、常用国内源地址

| 源名称 | 地址 |
|--------|------|
| 淘宝（npmmirror） | `https://registry.npmmirror.com` |
| 腾讯云 | `https://mirrors.cloud.tencent.com/npm/` |
| 华为云 | `https://mirrors.huaweicloud.com/repository/npm/` |

## 五、恢复官方源

```bash
npm config set registry https://registry.npmjs.org
```

> **提示**：淘宝旧域名 `registry.npm.taobao.org` 已于 **2024年** 停止服务，请使用新域名 `registry.npmmirror.com`。
