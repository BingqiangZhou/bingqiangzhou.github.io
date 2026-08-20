---
title: 【实践记录】公众号系列封面生成：HTML 模板 + 无头 Chrome 截图
published: 2026-08-20
description: 用纯静态 HTML 模板加无头 Chrome 截图，20 分钟批量生成一整套风格统一的公众号系列封面（2.35:1）：先定比例再做设计、固定骨架加四个文案槽位的设计公式、sed/python 批量派生、ffmpeg 拼合后视觉模型复核，附五个真实踩坑记录。
lang: zh
tags: [实践记录, 工具分享]
abbrlink: wechat-series-cover-workflow
---

> 整理自 GLM-5.3 系列（2026-08-20）实战。四张封面从设计到验收约 20 分钟，全程零设计工具。
> 适用场景：同一系列多篇文章需要风格统一、批量生成的封面。

---

## 一、最重要的经验：先定比例，再做设计

**公众号文章封面的标准比例是 2.35:1（官方规格 900×383），不是 16:9。**

本次第一版按 5.2 旧封面的 1920×1080（16:9）制作，内容没问题但比例错误，上传会被裁切，全部返工。教训：

- 动手前先确认目标平台的**裁切规格**，不要沿用上一个项目的历史尺寸；
- 高清制作尺寸取官方规格的整数倍：**1880×800**（= 900×383 的 2 倍多，精确 2.35:1）；
- 公众号还会从封面中心裁 1:1 小图（会话/分享卡片），所以**主体内容必须居中**，四角只放可牺牲的装饰信息。

## 二、封面设计公式（从 5.2 系列继承，可直接复用）

一张系列封面 = 固定骨架 + 每篇变化的四个槽位：

```
┌─────────────────────────────────────────┐
│ Z.AI · GLM                    VOL.0N    │  ← 左上品牌 chip / 右下卷号
│                                         │
│              其 N                        │  ← 眉标（篇号）
│           ── 渐变条 ──                   │
│           GLM-X.X 系列                   │  ← 大字系列名（渐变文字）
│         本篇主题句（副标题）               │  ← 主题句
│         一句话注解 · 金句                  │  ← 注解小字
│                                         │
│ Bingqiang Zhou                          │  ← 左下作者
└─────────────────────────────────────────┘
背景：深底 #05060f + 双光球(blur 110px) + 网格叠层 + 暗角
衬底：居中几何图案（同心环 + 每篇一个主题小图形）
```

**每篇只需要换四个槽位**：眉标（其 N）、主题句（= 文章标题副标题）、注解金句、中央小图案。

### 主题图案的选题思路（几何、抽象、和内容相关）

| 篇 | 内容 | 图案 |
|---|---|---|
| 其一 | 一句话→全套作品 | 提示符 `>` 扇出四个输出节点 |
| 其二 | AI 自我复盘 | 循环环（回头看的箭头） |
| 其三 | 一条提示词一次成稿 | 单点→箭头→文档 |
| 其四 | 人类手写 | 手写笔迹曲线 + 笔尖 |

图案全部用内联 SVG 手绘（几十行），蓝系描边、透明度 0.2–0.45，衬在文字后面不抢主体。

### 2.35:1 宽幅下的字号参考（1880×800）

- 眉标 32px（letter-spacing 0.42em）
- 大字系列名 116px（渐变文字 + 辉光）
- 主题句 68px
- 注解 34px
- 衬底图案直径 720px（不能超过画布高度的 90%）
- 行间距比 16:9 版本收紧约 20%

## 三、生产流程（四步）

### 1. 写模板 cover1.html

纯静态 HTML：**不需要 GSAP、不需要 HyperFrames 的 clip/data-* 属性**——封面是静态图，直接写普通网页即可，比渲染视频管线快一个量级。

关键 CSS 骨架：

```css
html, body { width: 1880px; height: 800px; overflow: hidden; background: #05060f;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif; }
.hero { /* 渐变大字 */
  background: linear-gradient(180deg, #fff 0%, #7db0ff 100%);
  -webkit-background-clip: text; color: transparent; }
.orb { position: absolute; border-radius: 50%; filter: blur(110px); opacity: 0.46; }
.vignette { position: absolute; inset: 0; /* 径向暗角，压住四角突出中心 */ }
```

### 2. 批量派生 cover2–4

用 sed 换文案（同构文本直接替换），用 python 换 SVG 图案（多行块替换）：

```bash
sed -e 's/VOL\.01/VOL.02/' -e 's/>其一</>其二</' \
    -e 's/旧主题句/新主题句/' -e 's/旧注解/新注解/' cover1.html > cover2.html
```

### 3. 无头 Chrome 截图（核心命令）

```bash
MSYS_NO_PATHCONV=1 "/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless=new --disable-gpu --window-size=1880,800 \
  --screenshot="D:\path\to\cover1.png" \
  "file:///D:/path/to/cover1.html"
```

要点：

- **`MSYS_NO_PATHCONV=1`**：Git Bash 下防止 Windows 路径 `/c/...` 和参数被 MSYS 改写；
- `--window-size` 必须等于画布尺寸，输出 PNG 像素尺寸即窗口尺寸；
- 中文直接可用（系统微软雅黑兜底），无需字体文件；
- chrome-devtools MCP（浏览器自动化截图）也可用，但本次会话它中途卡死超时，**无头 CLI 是更稳的兜底**，且无需保持浏览器会话。

### 4. 质检：拼合图 + 视觉模型复核

四张拼成一张 2×2 网格，一次视觉检查所有封面：

```bash
MSYS_NO_PATHCONV=1 ffmpeg -y -v error -i cover1.png -i cover2.png -i cover3.png -i cover4.png \
  -filter_complex "[0]scale=940:-1[a];[1]scale=940:-1[b];[2]scale=940:-1[c];[3]scale=940:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0" contact.jpg
```

检查清单：中文无乱码、文字无切顶切底（宽幅重点）、四角信息完整、图案完整、多张排版一致。

## 四、踩坑记录（本次真实发生）

| 坑 | 现象 | 解法 |
|---|---|---|
| **比例想当然** | 第一版 1920×1080，公众号要 2.35:1 | 动手前查平台裁切规格；本文用 1880×800 |
| MCP 浏览器卡死 | chrome-devtools 截图连续 30s 超时 | 切换无头 Chrome CLI（见上），一样出图 |
| 视觉模型看到旧图 | 改完图重新上传，AI 复核仍报旧内容 | CDN 按路径缓存：**改图后换新文件名再质检**（`contact-v2.jpg`）；本地证据（文件字节数变化、HTML 源码 grep）交叉验证 |
| ffmpeg 引号解析 | 复合命令里 filtergraph 报"input filename"错 | filtergraph 命令**单独执行**，不和截图命令串联 |
| sed 换图案失败 | SVG 是多行块，sed 单行替换够不着 | 用 python 做 `index() → 切片替换` 的多行块替换 |

## 五、下次直接抄的清单

1. 确认平台比例（公众号 2.35:1 → 1880×800；小红书首图 3:4 → 1500×2000）
2. 复用模板：改 `viewport`、`html/body/#root` 尺寸、四个文案槽位、SVG 小图案
3. 无头 Chrome 逐张截图（记得 `MSYS_NO_PATHCONV=1`）
4. ffmpeg 拼合图 → 视觉模型复核（新文件名！）
5. 交付：`coverN.png` + 同名 `.html` 源（改文案可重出）

*本笔记由 GLM-5.3 于 2026-08-20 整理，源自 GLM-5.3 系列封面制作实战。*
