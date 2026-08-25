---
title: 【学习笔记】HyperFrames 30 天拆解（七）Catalog 全景：三百多个可复用积木的地图与生态
published: 2026-08-25
description: HyperFrames「30 天」系列第七篇（完结篇），对应官方课程页 Related topics 的「Browse reusable Catalog elements」，深读组件目录：block 与 component 的双层结构及各自接线方式（data-composition-src 五属性 vs HTML/CSS/JS 三段融合）；按类别绘制的目录地图（字幕、文本标题、lower-third 与新闻条、代码块与十五种终端配色、shader 转场、图表与地图、产品 UI 区块、VFX 与液态玻璃、手绘标注、氛围杂项）；按意图检索的两档排名模型（词汇匹配与本地语义模型、英文查询规则、dropped 与 unindexed 的偏斜含义）；hyperframes feedback --search-miss 构成的需求信号闭环；贡献回注册表的 PR 流程；以及「检索即接口、缺口即路线图」的生态飞轮分析。
lang: zh
tags: [学习笔记]
abbrlink: hyperframes-thirty-days-catalog
---

> **系列导航**：[（一）总览](/posts/hyperframes-thirty-days-notes/) → [（二）Start and create](/posts/hyperframes-thirty-days-phase-1/) → [（三）Direct and refine](/posts/hyperframes-thirty-days-phase-2/) → [（四）Extend and ship](/posts/hyperframes-thirty-days-phase-3/) → [（五）创作路径](/posts/hyperframes-thirty-days-creation-paths/) → [（六）Prompt Guide 深读](/posts/hyperframes-thirty-days-prompt-guide/) → **（七）Catalog 全景（本篇，系列完结）**
> **调研日期**：2026-08-25
> **本篇对象**：官方课程页 Related topics 之 [Browse reusable Catalog elements](https://hyperframes.heygen.com/catalog)，辅以本机 hyperframes-registry 技能原文（安装、接线、检索、贡献的命令契约）
> **说明**：Day 22（消费）与 Day 28（贡献）只演示了目录的两个切面；本篇把目录当产品拆：结构、地图、检索模型与生态机制

## 一、Catalog 是什么：把「重复造轮子」变成安装命令

（源：[Catalog](https://hyperframes.heygen.com/catalog)）

官方对目录存在理由的表述很直白：**动效是最容易重复造的轮子**——一个「逐行揭示标题」的效果，每个项目手写一遍是浪费，写成可安装积木就是资产。Catalog 就是这个资产库：注册表实体放在 GitHub `heygen-com/hyperframes` 仓库的 registry 目录，项目通过 `hyperframes.json` 的 `registry` 字段指向它（可自建镜像），CLI 的 `catalog` / `add` 两个子命令完成发现与安装。

## 二、双层结构：block 与 component

（源：[Catalog](https://hyperframes.heygen.com/catalog)；命令契约源自本机 `/hyperframes-registry` 技能，权威版本见 [skills 目录](https://github.com/heygen-com/hyperframes/tree/main/skills)）

目录里所有条目分两类，**本质区别是有没有自己的时空**：

| | Block（块） | Component（组件） |
| --- | --- | --- |
| 本质 | 独立子组合 | 效果片段 |
| 自有属性 | 尺寸、时长、时间线 | 无 |
| 安装到 | `compositions/<name>.html` | `compositions/components/<name>.html` |
| 接线 | 宿主声明式挂载 | 手工融合进宿主 |

**Block 接线**（五个关键属性，`data-composition-id` 必须与块内部 ID 完全一致）：

```html
<div
  data-composition-id="data-chart"
  data-composition-src="compositions/data-chart.html"
  data-start="2"
  data-duration="15"
  data-track-index="1"
  data-width="1920"
  data-height="1080"
></div>
```

**Component 融合**（三段搬运）：读安装产物，把它的 HTML 元素拷进宿主 composition、`<style>` 并进样式块、`<script>` 并进脚本区（若组件暴露 GSAP timeline 钩子，再在时间线里调用）。安装后 CLI 会打印可直接粘贴的起始片段——但要自己补齐时间属性。

## 三、目录地图：十个类别的速览

（源：[Catalog 全目录清单 llms.txt](https://hyperframes.heygen.com/llms.txt) 与 [Catalog tour](https://hyperframes.heygen.com/catalog)）

按 llms.txt 全目录清单归纳（条目总数 **370 余个**：block 150 余、component 210 余；官方页面的导览 tour 则按十一个类别组织——Code Animations、Captions、HTML-in-Canvas、Social Overlays、Lower Thirds、Shader Transitions、CSS Transitions、Showcases、Data、Effects、Blocks。以下按功能相近归并为十类，每类选代表）：

| 类别 | 代表条目 | 用在 |
| --- | --- | --- |
| **字幕** | 镜头跟随字幕、逐词高亮、卡拉OK 式、打字机式、气泡式、纸带式 | 口播/解说类一切成片 |
| **文本与标题** | 逐行揭示标题、词弹出、翻牌显示（split flap）、霓虹字、手写便签、金句卡、数字 count-up、动态 bullet 列表 | 开场、章节、观点强调 |
| **信息条** | 渐变条 lower-third、极简 lower-third、带图标 lower-third、新闻跑马灯 | 人物条、出处条、资讯感 |
| **代码** | 代码揭示、行聚焦、语法聚光、Gist 框、终端窗口（十五种终端配色主题） | PR 讲解、技术教程 |
| **转场** | shader 家族（cross-warp、墨渍扩散、纸张折叠、胶片灼烧、RGB 位移、zoom-through 等）+ 成组转场演示块 | 场景切换的叙事标点 |
| **图表与地图** | 柱状/折线/面积/环形/堆叠图、径向进度、世界地图高亮连线与定位缩放 | 数据叙事（Day 7 的 chart hit / map hit） |
| **产品 UI** | 浏览器框、手机框、应用窗口、通知卡、定价表、特性网格、光标高亮、滚动演示 | 产品宣传与功能演示 |
| **VFX** | 扫描线、CRT、VHS、色散、故障抖动、液态玻璃（liquid glass） | 风格化与年代感 |
| **手绘标注** | 手绘箭头、圈选、下划线、马克笔高亮 | 教学强调（Day 26 的近亲） |
| **氛围杂项** | 颗粒叠加、暗角、遮幅、倒计时、分屏、进度条、logo 揭示 | 整片质感与品牌收尾 |

地图的用法不是背下来，而是**知道哪类问题「一定有现成的」**——写提示词时点名类别，代理检索安装比自己手写快一个量级。

官方页面给的「Use an item」三步用法也值得记：**打开条目看动效预览 → 把它附带的自然语言请求复制进代理聊天 → 替换示例内容，放回你的完整视频里复核**。也就是说每个目录条目除了 HTML，还自带一段「怎么向代理要这个效果」的标准提示词——检索即接口在这个意义上是字面成立的。

## 四、检索模型：按意图问，别按名字猜

（源：本机 `/hyperframes-cli` 与 `/hyperframes-registry` 技能的检索契约，权威版本见 [skills 目录](https://github.com/heygen-com/hyperframes/tree/main/skills)；条目级浏览见 [Catalog](https://hyperframes.heygen.com/catalog)）

官方把「发现」设计成检索优先而非浏览优先（目录大到肉眼扫不动）：

```bash
npx hyperframes catalog --query "reveal a headline one line at a time"
```

四条规则值得记牢：

1. **描述效果而非机制**：查询写「想要什么动作」，不是「我想象中的组件名」；
2. **必须英文**：索引是英文的，中文查询返回 `No searchable words in query`——这是查询语言问题，不是缺组件，别上报 gap；
3. **两档排名**：默认词汇匹配（words，纯本地零外发）；`--on-device` 语义排名（首次约 33MB 本地模型下载，同样零外发）——`--json` 输出里标明哪档答的话，弱结果在 words 档属正常，在语义档才是 bug；
4. **两个偏斜计数**：`dropped`（向量库里有、本注册表装不了的条目数）与 `unindexed`（注册表里有、索引看不见的条目数）——前者清 `~/.hyperframes/catalog/` 缓存，后者重跑 `--on-device` 会自动重取索引。

**离线边界**：manifest 有 24 小时 TTL，断网也能搜索（用最后一份本地清单），但 `add` 安装永远要联网拉文件——「离线可搜、在线可装」。

## 五、反馈闭环：search-miss 是目录唯一的需求数据源

（源：本机 `/hyperframes-cli` 技能 feedback 契约；反馈入口见 [Share feedback](https://hyperframes.heygen.com/guides/feedback)）

检索结果里没有能干活的条目时：

```bash
npx hyperframes feedback --search-miss "<查询>" --wanted "<想要的效果>" --tier <words|on-device>
```

`catalog --query` 会把这行命令预填好打出来，你只需补「想要的效果」。官方明说：**这是目录需求信号的唯一来源**——跳过上报，缺口就只能从安装计数里猜，而「没人能装的move」在安装计数里是隐形的。上报写效果不写想象中的组件名，且不带评分、不进任何考核指标——纯粹的路线图投票。

## 六、贡献：把私房积木变成公共资产

（源：[Contribute to the Catalog](https://hyperframes.heygen.com/contributing/catalog)）

Day 28 演示的反向流，完整流程（官方 [Contributing](https://hyperframes.heygen.com/contributing/catalog) 页）：两条入口——**提想法**（GitHub issue 附视觉参考，录屏/Figma 草图/别家工具的例子即可）或**建条目**（让代理用 `/hyperframes-registry` 技能）。**条目形态**：Block = `registry-item.json` + 组合 HTML；Component 额外要独立 `demo.html`（没有它 Catalog 预览生成器跳过该条目）；每条目一个目录（`registry/blocks/<name>/` 或 `registry/components/<name>/`）；**元素 ID 一律加条目名缩写前缀**防安装碰撞。manifest 里 block 声明 `dimensions`/`duration`（component 不得）；**`params` 暴露别人在 Studio 不改 HTML 就能换的值，控件四种：color / text / number / select**。复用铁律：注册在 `window.__timelines` 的暂停时间线、`data-composition-id` 与之一致、前缀 ID、无 `Date.now()`/未播种随机/实时循环、任意帧正确 seek、装到源目录外也能跑；一次性示例放 Examples 不进 Catalog。验证走完整门禁（`lint:registry-items` → scratch 项目 `add` + `check` → 生成 Catalog 页与预览）；**过 check 证明组合有效，不证明运动可读**——五条评审问题：有一个视觉主角吗？重要文字能读一遍吗？运动有加速与落定吗？别人能换肤吗（品牌值暴露为参数）？真的可复用吗？PR 附条目目录、registry.json 条目、重生成的 Catalog 产物、`publish` 预览、使用时机与已知坑。

另一个消费侧细节：**目录条目自带演示内容出厂**（固定词表、横屏尺寸、8 秒时间线），代理会把词与时间重排成你的旁白、按你的画幅重设尺寸——这是预期行为不是 workaround（想要「一次一个全屏词」就点 caption-kinetic-slam 而非 caption-highlight）。

## 七、生态分析：检索即接口，缺口即路线图

把四、五、六节合起来看，Catalog 是一个设计得相当克制的基础设施：

- **消费侧零摩擦**：一条命令安装，block 声明式接线，component 起始片段直接可贴；
- **隐私默认**：搜索完全本地，唯一的网络上行是显式的 feedback 命令——「默认不发数据」和「需要信号」的矛盾用「单独命令 + 预填模板」化解；
- **供需闭环**：search-miss 上报缺口 → 官方或社区按缺口做积木 → PR 回注册表 → manifest 24 小时自愈分发。目录不是静态素材包，是**带需求遥测的活生态**；
- **对照前端生态**：它就是「视频界的组件库 + 包管理器」——`catalog --query` 之于 HyperFrames，约等于 npm search 之于 Node，只是搜索的粒度从「库」细到了「一个动作」。

## 八、系列总结

七篇到此完整：[（一）总览](/posts/hyperframes-thirty-days-notes/)给地图，[（二）（三）（四）](/posts/hyperframes-thirty-days-phase-1/)按课程的三个阶段拆机制，[（五）](/posts/hyperframes-thirty-days-creation-paths/)讲在哪创作、[（六）](/posts/hyperframes-thirty-days-prompt-guide/)讲怎么指挥、**（七）本篇讲用什么复用**——恰好覆盖课程页 Related topics 的全部三个入口。

一条线索贯穿始终：**把视频从「手艺」变成「工程」**。工程的核心从不是自动化，而是复用与审查——FRAME.md 复用品牌、Catalog 复用动效、变量模板复用成片结构、check / snapshot / compare 审查质量、search-miss 复用社区的需求认知。HyperFrames 把这套软件工程的老道理，完整地搬进了视频生产；「30 天」课程则把这套搬迁，官方亲自演了一遍。
