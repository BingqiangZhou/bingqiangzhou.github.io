---
title: 【学习笔记】拆解 erduo-broll-loop-engineering：SRT 驱动、剧组制多 agent 的 B-roll 精工产线
published: 2026-09-05
description: 拆解 GitHub 开源 skill erduo-broll-loop-engineering（前电影导演出品，165 star）：SRT 驱动、Director/Assets/Lead/Chapter Builders 剧组制多 agent 的 B-roll 精工生产管线，核心是 canary 金丝雀先行镜→章节返修→预览审批的多层创作循环，失败只回责任环节定点返修。本文覆盖带「证据边界」列的支持矩阵写法、truth/creativeProposal 两层契约（事实不可改、创意可整体替换）、用户未选前禁止跑全片的 canary 硬门八条件、152 张 shotcraft 镜头卡的零查询纪律、六格语义时刻抽帧取证、上下文字节代理回归（父级 prompt 载入量减 95.89%）、v1.0.0 公开基准（约 3 分钟片端到端 4 小时量级）与未达标项公开的诚实证据文化，末尾附四条不采用理由与六条零依赖可借鉴思想。
lang: zh
tags: [学习笔记, Agent Skill]
abbrlink: erduo-broll-loop-engineering
---

调研对象：https://github.com/erduo1998-cell/erduo-broll-loop-engineering （2026-09-04 经 GitHub API 拉全量文件树 + 20 份关键源文件原样下载审读：主 SKILL.md、prompt-first-workflow.md、runtime-contract.md、broll-director 阶段契约、role-charters.json、SUPPORT-MATRIX.md、CHANGELOG 全 16 版、V1.0.0 设计与公开基准文档等，非仅 README；知乎导读文 zhuanlan.zhihu.com/p/2072239625503090280 辅助定位）。

## 1 一句话定位

SRT 驱动、多 agent「剧组制」的 B-roll 精工生产 skill：给一份完整原始 SRT（+可选设计说明/素材/logo），由 Director、Assets、Lead、Chapter Builders 组成的创作闭环自动完成语义分镜、素材冻结、逐镜直出与完整预览，默认交付「每镜一个独立 4K/30fps H.264 MP4」+ 可选成片 Master。名字里的 Loop Engineering 指 canary（金丝雀先行镜）→ 章节返修 → 预览审批的多层创作循环：失败只回到责任环节定点返修，绝不带着沉没成本重跑全片。

## 2 仓库概况

| 项 | 值 |
|---|---|
| Star / Fork | 165 / 31（MIT） |
| 作者 | 刘冉／耳朵（erduo.art，AI 顾问、前电影导演） |
| 版本节奏 | 0.1.0-rc.1（2026-07-27）→ 1.0.1（2026-08-19），约 3.5 周 16 个版本，高速迭代后趋稳 |
| 规模 | 549 文件；主 SKILL.md + 13 个 stages/ 子 skill + 20 个 runtime JSON schema + 233KB 测试（CI 全量跑） |
| 分发 | 五语 README（中/英/日/韩/繁中）；`Install.command` 一键安装器（macOS bash，6.3KB） |
| 知乎导读 | 《AI 视频制作团队：1 份字幕、3 步操作、152 张镜头参考直接出片》 |

## 3 支持矩阵（对本机最先要看的一张表）

| 环境 | 状态 | 证据边界 |
|---|---|---|
| macOS + Codex | supported core | 唯一有 v1 端到端公开基准的环境 |
| macOS + Claude Code | experimental | 契约受测试覆盖，缺同输入端到端对照（pending） |
| **Windows** | **unverified** | 保留路径兼容设计，无真实运行证据；一键安装器本身是 macOS 脚本 |
| HyperFrames 运行时 | v1.0.1 生产默认 | CLI 钉死 0.7.104、8 个官方核心 Skill 钉死 commit `c96b30c`；同输入 5 镜 canary 技术闭环+用户认可 |
| Remotion 运行时 | 仅显式 opt-in / canary | 曾在同输入 run 技术全过但**视觉失败**，降级保留 |
| 剪映/CapCut 桌面导入 | unverified | 交付按常见 MP4 设计，未实机认证 |

这份矩阵的写法本身值得学：每行都带「证据边界」列，明确区分「有真实证据 / 契约受测 / 完全未验证」，且声明「未完成的环境验证不会被自动提升为 verified」。

## 4 架构：Parent 监制 + 四类创作角色

正常生产（v1.0.1）的 agent 编制只有 4 类，且**明确禁止**再派 Runtime Planner、Integrator、Render、Reviewer、inspection、evidence 等 agent——机械环节全部由 Parent 亲跑确定性脚本：

- **Parent Producer**（编排器）：只跑规划/渲染/校验/装配脚本，不做创意判断、不写生产源码；缺陷带回责任角色。
- **Director（1 名）**：读完整原始 SRT+design（禁用摘要替代），产出语义章节、narrative envelope、visual system、motion map、三个代表场景，以及每镜一份 Shot Recipe v4。**不收集素材、不选运行时 API、不看成片**。
- **Assets（1 名）**：只冻结已知共享素材/字体/授权，每镜保留 `native|provided|search|generate|mixed` 五条素材路线开放；全局关闭外部素材必须援引真实的用户/能力/授权/费用边界，「设计不需要素材」不算合法理由。
- **Lead Builder（1 名）**：先交 3 个真样片（原生图形文字、素材融合、信息密集界面/数据）+ design 点名的 signature motion + 一页以内能力索引。样片直接成为对应镜头的最终源码。
- **Chapter Builders（2-3 名）**：每人认领连续 5-8 镜（约 35-70 秒）的完整「理解→选择→制作→渲染→观看→修改」闭环；返回一句 `accepted|revised` 看片结论。

**核心契约是 truth / creativeProposal 两层分离**：`truth`（时间窗口、源 cue、口播事实、观众结论、必须可读的结果、章节、接缝）下游不可改；`creativeProposal`（隐喻、对象、构图、运动、素材路线、关键状态）Builder 可在服务 truth 的前提下用一句理由整体替换，无需 Director 再审批。这与「先冻结语义/时间/素材边界，再自由创作」的分层思路一致，把返工的自由度和事实的稳定性切开了。

时间纪律：SRT 整数毫秒是唯一时间真值，镜头窗口 `[startMs, endMs)`，必须从 0 连续覆盖到末条 cue 结束（含间隙）；字幕边界不决定镜头数，语义才决定（常规镜头约 5-12 秒，超 15 秒要写内容理由）。

## 5 双后端路由与冻结媒体

- **路由顺序是确定性的**：显式/既有项目强制 > 能力矩阵 native-only 分类 > 能力偏好 > 已选 patternRef 的后端参考证据 > portable 默认；语义关键词、目录名、agent 口味一律不参与。逐镜判定 `portable / native-hyperframes / native-remotion / interop / unsupported`。
- **Hybrid 只走冻结媒体**：两后端间只交换经 SHA-256+FFprobe+完整解码验证的冻结媒体块，禁止运行时实时嵌套、源码互译或失败后静默换后端。
- **三层编码策略**：逐镜冻结默认 H.264 `medium/CRF 12/yuv420p/固定 GOP 60`（4K FFV1 需显式理由升级）；preview 统一 1080p `veryfast/CRF 22` 低成本版；Master 从未变更的冻结镜头**重新编码** `medium/CRF 16`，禁止直接复制 preview 充当成片。preview 身份绑定 plan+叙事信封+视觉系统+全部镜头合同+媒体哈希，任一漂移即需重新审批。
- **Remotion 授权边界处理得很谨慎**：安装器不全局安装 Remotion、不构成授权；每个项目在生产目录内显式 scaffold、精确锁版、生成 npm lock，同一生产目录内相同依赖身份共享一份工具链+固定双通道队列（v0.8.2 修掉过「多 unit 重复安装把磁盘/内存/CPU 放大」的缺陷）。

## 6 Shotcraft：152 张镜头卡的渐进披露

- 来源：`Vincentwei1021/video-shotcraft@41ee360`（Apache-2.0），卡片与上游 byte-identical，209 个全局唯一 style key；分 camera/data/effects/interaction/opening/outro/rhythm/transition/typography/ui-entrance 等 12 类（另有 cathrynlavery/diagram-design 的 8 种图解 grammar 与迪士尼动画十二法则的提示词化编译 animation-craft.md）。
- **默认零查询**：Director 先独立完成整片视觉与运动逻辑，只在「具名的未解技法问题」或用户点名时才 `--search`/`--list`（只返回摘要），选中后 `--card <id> --style <key>` 才读单卡全文。整片 0 查询、0 `patternRef` 是完全合法结果，明确禁止逐镜记录「无卡片」决定、禁止生产期跑无过滤 `--list`。
- 边界自我声明：152 张知识卡 ≠ 152 个已验证渲染组件，也不是模板库或双端一致性证据。每镜最多挂 1 个 `patternRef`，且必须带语义理由与降级策略（`simplify-motion / use-stable-state / substitute-material / return-to-director / stop-unsupported`）。

## 7 工程纪律亮点（本项目最值得学的部分）

1. **六格语义检查图**：每镜在 opening/preparation/action-a/action-b/result/settle 六个语义时刻各抽一帧成检查表；Chapter Builder 必须**真实打开**六格图和章节预览、修完低级错误才能交 `accepted|revised`——明确「lint/inspection/diagnostics 通过不能代替看片」。同时 v1.0.1 反向瘦身：生产源码里禁止再出现 inspection.tsx、DOM trace、自建取证工具，机械证据全部收归 Parent。
2. **canary 硬门**：全片生产前强制先做 5 镜金丝雀，8 项硬条件（5/5 直出+完整解码、Builder 观看回执、0 类缺陷、≥3 构图族、≥2 镜真实/生成素材、≥2 种 signature motion、用户 ≥3/5 选择、首版 ≤45 分钟）。用户未选择前**禁止跑完整长片**——防沉没成本写进了合同。
3. **上下文预算工程化**：v0.8.0 把父级默认预载的 11 份 reference 改按需加载，用确定性字节代理做回归（`measure-context.mjs`），父默认 prompt 载入量减 95.89%、三条后端路线均减约 80%；配套 docs 里冻结测量基线。
4. **诚实证据文化**：公开基准主动列「未达标项」（首 preview 242 分钟 vs 120 分钟目标、Lead 62.9 分钟 vs 45 分钟目标）；用户没看片就把 visual lock 如实记 `skipped`，不写成 approved；「技术验证不得宣称审美通过」是贯穿全文档的红线。
5. **数据对比的口径自觉**：基准报告里磁盘占用与逻辑文件大小分列、新旧对比声明「不能拿逻辑大小对 du 值算百分比」；Token 不可得时记 unknown 不估算。
6. **发布安全细节**（v0.1.0-rc 时代）：发布 tar 固定纯 ustar、归一化元数据、gzip 验证拒绝拼接 member、防压缩炸弹与路径碰撞——对「agent 产物再分发」的供应链意识远超同类项目。

## 8 实测性能与代价

v1.0.0 公开基准（Codex，179.866 秒 / 124 条 cue 的 SRT，4K/30fps 静音）：

| 指标 | 值 | 目标 |
|---|---|---|
| 镜头 / agent 调用 | 20 镜、10 次调用（0 次全量历史） | — |
| 首次完整 preview | 约 242.05 分钟 | ≤120 分钟 **未达** |
| Lead 阶段 | 62.90 分钟 | ≤45 分钟 **未达** |
| 3 名 production Builders | 88.14 分钟 | — |
| 产物 | 213 文件 / 磁盘 160MB | ≤2000 文件、≤1GB 过 |

对照旧 v0.9.2 redo（磁盘 25GB、33088 文件、5191 张 PNG）：磁盘与文件数均减约 99.36%。v1.0.1 用同一 SRT 完成 HyperFrames 5 镜 canary（4K 直出+完整解码+用户盲测认可），用户认可后要求停止剩余 14 镜直接发布——因未做逐镜 3/5 结构化选择，full-production gate 如实保持关闭。旧 Remotion 同输入 run 耗时 203/54/63 分钟且视觉失败，成为 v1.0.1 创作闭环重置的依据。

结论口径：**约 3 分钟的片子，端到端以小时计（首版 4 小时量级）**。这是「单部精工 B-roll」的定位，不是批量流水线。

## 9 与SelfMediaTools 项目的对照（只观察，不建议引入）

**相关性**：输入端「SRT 锚定」与SelfMediaTools 项目 whisper-transcribe 的词级 captions JSON 天然同构（转 SRT 即可喂）；它也是 hyperframes 生态目前见到最重的工程化用法（CLI+官方 skill 双钉死、staging 隔离安装、事务切换），与 a2v 线的 faceless-explainer 直调插件版是同目标（防官方源漂移）的两种实现。

**不建议在本机采用的四条硬理由**：① Windows 明确 unverified，安装器是 macOS 脚本；② Claude Code 仅 experimental（同输入对照 pending）；③ 耗时数量级与SelfMediaTools 项目日更线完全不匹配（ai-news FES 线端到端 7.5 分钟 vs 它 3 分钟片 4 小时，差约 30 倍，定位不同）；④ 其 stages/*/agents/openai.yaml 形态与SelfMediaTools 项目「agents/ 是子 agent 契约、勿写 openai.yaml」的铁律相反。

**零依赖可借鉴的思想清单**（按对SelfMediaTools 项目价值排序）：

1. **六格语义时刻抽帧取证**：比「整页截图」更贴近成片语义验收的粒度——每镜在 opening/转折/结果/收束时刻各抽一帧。SelfMediaTools 项目 qa_deck.js 目前是 DOM 断言+逐页全量截图，若未来要加「画面语义层」机器门，这是现成的帧采样设计（与 FES 词锚 cue 的时刻定义天然可对齐）。
2. **canary 硬门的「用户未选前禁止跑全片」**：与SelfMediaTools 项目「设计候选必须用户裁定」记忆同构，但它把沉没成本防线写成了 8 条可判定的硬条件——后续若做重型媒体改造（如封面/视频大改版）可套用这个门形态。
3. **truth / creativeProposal 两层分离**：与SelfMediaTools 项目「deck-spec=帧规划+内容数据二合一」同思路的镜头级版本；其价值在「Builder 可整体替换创意方案而不碰事实层」，若 a2v 线未来出现「分镜创意返修不动字幕/时长」的需求，这是参考契约。
4. **三层编码与身份绑定**：preview（低成本）与成片（从冻结镜头重编码、不复制 preview）分离+哈希身份绑定。SelfMediaTools 项目 assemble_fes_video 是单层 concat+转码，日更线没必要分层，但「预览审批的产物身份」思想在批量线做「重跑不吞已验收段」时可参考（与 ADR-034 统一音频的 clip 复用协议目标一致）。
5. **上下文字节代理回归**：与SelfMediaTools 项目「ZCode 上下文膨胀诊断」的关切相同，它是可复现的工程化做法（确定性脚本+冻结基线+CI 回归）。
6. **支持矩阵与基准的诚实证据写法**：每行带证据边界、未达标项公开、用户未看片不记 approved——与SelfMediaTools 项目 TR/ADR 纪律同构，其 SUPPORT-MATRIX 的表格形态可直接抄用于未来对外发布的多环境工具说明。

## 10 信源

- 仓库：github.com/erduo1998-cell/erduo-broll-loop-engineering（含 README/SKILL.md/SUPPORT-MATRIX/CHANGELOG/docs 五份设计文档，2026-09-04 审读）
- 知乎导读：zhuanlan.zhihu.com/p/2072239625503090280
- Skill 目录页：skillsllm.com/skill/erduo-broll-loop-engineering
- 上游镜头卡库：[github.com/Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft)（Apache-2.0）
