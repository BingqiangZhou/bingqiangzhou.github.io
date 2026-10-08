---
title: 【AI前沿】OpenAI DevDay 2026 发布汇总：Dots 常驻智能体、GPT-6.1 Sol 与 Codex 的「28 天连更」
published: 2026-10-08
description: 2026 年 9 月 29 日旧金山 DevDay：OpenAI 一口气发布 20+ 项更新——GPT-6 Astra 驱动的常驻智能体 Dots、智能接近 Astra 但价格仅 1/5 的 GPT-6.1 Sol、最高 300 token/s 的 Ultrafast、面向企业的 Private Intelligence、Codex 全家桶（云端 Codex、新版 CLI、Code Review、Security Cloud）、Decisions API 与 Agents API、ChatGPT Space/Pages/协作幻灯片、Sign in with ChatGPT、每月 500 美元的 Pro 500 与 32 家伙伴的 Marketplace。一周之后，Codex 负责人 Tibo（Thibault Sottiaux）又立下「28 天连更」的军令状：每天交付一个对多数 Codex/Work 用户明确有用的改进，做不到就全员发放免费 Reset。本文基于官方 Recap 与多家媒体的报道完整梳理两部分内容，截至发文（10 月 8 日）连更刚进行到第 4 天。
lang: zh
tags: [AI前沿]
abbrlink: openai-devday-2026-roundup
---

2026 年 9 月 29 日，OpenAI 在旧金山举办了年度开发者大会 [DevDay 2026](https://openai.com/index/devday-2026-recap/)。Sam Altman 的开场 keynote 背后是这样一个基本盘：ChatGPT 周活跃用户达到 **12 亿**（今年 7 月刚突破 10 亿），OpenAI 称这是「有史以来最大的一届 DevDay」，一次性发布了 **20 多项**更新。如果用一句话概括全场：去年 DevDay 的主角是 AgentKit 和「把 app 带进 ChatGPT」，今年则彻底升级为「智能体本身成为产品」——最典型的就是全场掌声最响的 **Dots**。

而这场大会的余波比大会本身更有戏剧性：一周后的 10 月 4 日晚，Codex 负责人 Thibault Sottiaux（大家习惯叫他 Tibo，[@thsottiaux](https://x.com/thsottiaux)）在 X 上宣布了一项颇为罕见的承诺——**连续 28 天，每天要么交付一个明确的改进，要么给所有人发放免费 Reset**。截至本文写作的 10 月 8 日，连更刚走到第 4 天。

下面分两部分整理：先盘 DevDay 当天的 20+ 项发布，再盘「28 天连更」目前的进展。

## DevDay 2026 全景：五条主线

官方 [Recap](https://openai.com/index/devday-2026-recap/) 把 20+ 项发布分成了五组：

| 分组 | 代表发布 | 面向谁 |
| --- | --- | --- |
| 与 AI 协作的新方式 | Dots、GPT-6.1 Sol、Ultrafast、Private Intelligence | 所有用户 / 企业 |
| Codex 与 API 新工具 | 云端 Codex、新版 CLI、Code Review、Security Cloud、Decisions API、Agents API、Bedrock Managed Agents | 开发者 |
| ChatGPT 插件与定制 | 插件侧栏主页、Plugin Creator、Sites 托管插件、MCP Events | 用户 / 插件开发者 |
| 人与 AI 协作 | ChatGPT Space、Pages、协作幻灯片、团队任务、@ChatGPT、Meetings 插件、可分享主页 | 团队 |
| 订阅与生态 | Sign in with ChatGPT、Pro 500、OpenAI Marketplace | 订阅用户 / 企业 |

## Dots：常驻（always-on）智能体

Dots 是本次 DevDay 的头号发布：**一直在线的个人智能体**，由 GPT-6 Astra 驱动。核心形态是——每个 dot 拥有自己的一台云电脑和一个浏览器，可以接入 **4000 多个应用**，在你不在场的时候持续替你干活、学习你的偏好。

交互方式相当「拟人」：

- 类短信的对话界面，可以随时给 dot 发消息；
- 支持语音通话（网页 / 桌面 / 移动端）；
- 可以接入 Slack 和 Microsoft Teams，跨应用携带上下文，短信（SMS）支持也在路上；
- 形象是带眼睛的可爱 blob 头像，甚至能搭建元宇宙风格的虚拟世界；
- 发消息等风险动作需要你批准，权限粒度可控。

Altman 在台上说，Dots 的灵感来自「我们小时候在电影里看过的那些很酷的智能体」。发布会前的传闻代号叫 Aeon，最终产品名是 Dots。

竞争与定价层面：这被普遍视为对 Meta 免费 Muse 的正面回应，但 Dots **没有免费档**——首发面向 ChatGPT Pro（$100/月）和 Business Premium，Enterprise / Edu / Healthcare 计划可由管理员开启试用。CFO Sarah Friar 对 CNBC 表示，愿景是最终把它带给全部消费级用户。

## GPT-6.1 Sol 与 Ultrafast：智能和速度两条轴

**GPT-6.1 Sol** 是本届发布的新模型：在智能体编码（agentic coding）、计算机使用和专业工作上强化，官方口径是「智能接近 GPT-6 Astra，输入 / 输出 token 价格约为 Astra 的 1/5」，第三方报道称定价为 $2 / $10（每百万 token 输入 / 输出）。已面向全部 API、Plus、Pro、Business、Enterprise、Edu 用户开放。顺带一提，OpenAI 现在的模型命名是「Astra / Sol / Luna」三件套：Astra 是旗舰，Sol 是性价比款，Luna 是轻量快速款（Decisions API 的默认引擎）。

值得注意的是，据 [The Verge](https://www.theverge.com/ai-artificial-intelligence/1001681/openai-devday-2026-biggest-news-announcements) 等媒体报道，更强一档的 **GPT-6.1 Astra 因安全考量暂缓发布**——结合 DevDay 现场场外的抗议（ICE 合同、数据中心能耗），安全议题是这届大会绕不开的背景音。

**Ultrafast** 是新的「速度档位」：最高 **8 倍速的 token 生成（约 300 token/s）**，API 侧最高 6 倍。GPT-6 Astra Ultrafast 当天即在 API、ChatGPT Work 和 Codex（Pro 500 / Enterprise）可用，GPT-6.1 Sol Ultrafast 随后跟进。

**Private Intelligence** 则是面向企业的隐私组合拳：Zero Data Retention 加上 Private Safety Processing，以及今秋进入预览的 Private Inference（机密计算 + 可验证控制）。

## 开发者硬货：Codex 全家桶与三个 API

这一组是 DevDay 数量最多的部分：

- **Codex in the cloud**：在电脑、手机、云端都能跑 Codex，开发环境可复用，团队共享同一套配置；
- **新版 Codex CLI**：支持语音启动 / 转向任务，新的 `/agents` 视图，改进的提示词编辑、会话恢复和 worktree 支持；
- **Code Review**：在 ChatGPT 桌面应用里审 PR——摘要、diff、提问，然后才把反馈发到 GitHub PR / GitLab MR，还支持你离开时云端自动跑第一轮评审；
- **Codex Security Cloud**：按需或定时扫描 GitHub 仓库、持续检查新提交，自动调查发现、去重、准备修复，内置专用的 Daybreak Blue 安全模型；
- **Decisions API**：用 Luna 做近实时决策——内容分类、请求路由、为智能体选择下一个动作，问题需预定义有限答案集；发布时是 limited preview，随后面向所有开发者公测（见下文 28 天连更第 2 天）；
- **Agents API（含 computer use）**：把 Codex 内部用的多智能体能力、工具搜索、上下文压缩开放出来，基础设施由 OpenAI 托管；
- **Bedrock Managed Agents, powered by OpenAI**：与 Amazon 合作，智能体完全跑在 AWS 内部，面向有合规要求的客户。

## ChatGPT 侧：协作三件套与插件生态

- **ChatGPT Space**：人和 ChatGPT（以及你的 dot）共享的团队协作空间，共享知识、文件、项目，按空间级指令组织；Pro / Business / Enterprise 可用；
- **Pages**：新的人机协作文档类型，可共同编辑，支持写作、研究、图表、图片；邀请团队成员加入；
- **协作幻灯片**：对话或模板生成可交互幻灯片，多人加智能体共同编辑、评论，可导出为 PowerPoint / Google Slides 并保留格式，未来几周内上线；
- **团队与任务共享**：把同事拉成 team，共享页面 / 幻灯片 / 插件 / 表格，还能把「每周项目周报」这类循环工作委派给团队任务，按计划或事件触发；
- **@ChatGPT**：在 Slack 和 Teams 里直接 @ChatGPT，管理员配置或个人工具皆可，同事无需单独许可即可追问；
- **Meetings 插件**：开会时记笔记，生成个性化摘要和行动项存入 ChatGPT Space，音频在笔记生成后删除；macOS 桌面端 Pro / Business 先行；
- **可分享个人主页**：展示你创建的 Sites 和插件，默认关闭，全部计划可用。

插件侧的更新：插件在侧栏有了**主页和交互式面板**（支持文件查看器）；**Plugin Creator** 与重新设计的提交流程、更智能的发现排序；**Sites 可以托管插件**（团队成员带着自己的数据与权限使用同一个应用）；以及一个新提案 **MCP Events**——让插件在关联应用里发生事件时自动启动工作流。

## 订阅与生态：Sign in with ChatGPT、Pro 500、Marketplace

- **Sign in with ChatGPT**：用 ChatGPT 账号登录合作应用，把你的订阅额度带过去。首发 **16 家伙伴**，包括 Cognition 的 Devin、Notion、Vercel、T3、OpenClaw、Dactyl 等；Plus / Pro 用户可在这些工具里消耗套餐用量，每个工具的用量可单独控制；
- **Pro 500**：新的顶配订阅，**$500 / 月**，额度为 Plus 的 **25 倍**，附带 Ultrafast；与此同时 $200 的经典 Pro 档重新开放并调整了限额；
- **OpenAI Marketplace**：企业客户可以把已有的 OpenAI 采购承诺用于购买合作方软件，首批 **32 家伙伴**，包括 Figma、Adobe、Sierra、Decagon、HubSpot、Salesforce、ServiceNow、Harvey、Legora、Palo Alto Networks、CrowdStrike、Baseten 等。

## 一周之后：Codex 的「28 天连更」

DevDay 落幕不到一周，10 月 4 日晚，Tibo 在 X 上宣布（[社区论坛同步维护](https://community.openai.com/t/day-1-28-days-of-quality-of-life-improvements-or-a-full-reset/1403525)）：

> 接下来的 28 天，每一天我们要么交付一个「对大多数 Codex / Work 用户而言清晰、明确的改进」，要么——在没有这种改进的日子里——给所有人发放一次 full reset。

规则有几个要点：改进方向聚焦**简化、效率（更多用量）、新功能、新模型**；「reset」指使用额度重置；每日更新在论坛的[追踪帖](https://community.openai.com/t/28-days-of-shipping-at-openai/1403897)里同步。这个「做不到就赔」的姿势，背景是 OpenAI 近期的一连串信任危机（智能体越权攻击外部公司的争议、ICE 合同抗议等）——把发布节奏变成一个可核对的公开承诺。

前三天的交付如下：

| 天 | 日期 | 交付内容 |
| --- | --- | --- |
| Day 1 | 10-05 | GPT-6 Astra / GPT-6.1 Sol **默认推理提速约 50%**（约 30 → 50 token/s），覆盖所有订阅产品和 Sign in with ChatGPT 伙伴（OpenCode、Pi、Amp、Devin），约两小时全量生效，用户无需任何操作 |
| Day 2 | 10-06 | 四项：① **Auto Review 免费**——用 ChatGPT 账号登录即不消耗套餐用量，用第二个智能体复核高风险操作；② **API 限流分层从 5 档简化为 3 档**（Build / Launch / Grow），顶档累计付费门槛 $1000 → $500；③ **Meetings 插件 beta** 上线 macOS 桌面端；④ **Decisions API 面向所有开发者公测**，走 Responses API，最快比 GPT-6 Luna 快 10 倍 |
| Day 3 | 10-07 | **GPT-6 在 Chat 全量上线**（配套发布 [GPT-6 and Intelligent UI for everyone](https://openai.com/index/gpt-6-and-intelligent-ui-for-everyone/)）；Codex / ChatGPT Work 活跃用户达到 **4000 万**；同时给所有付费账号发放一次 banked reset（可入账留存的额度重置）——按规则，第 2 天的四连发被内部判定分量不足，第 3 天补上重置 |

本文写作时（10 月 8 日）连更进行到第 4 天，后续进展可以盯[论坛追踪帖](https://community.openai.com/t/28-days-of-shipping-at-openai/1403897)。另外，与 DevDay 同期流出但未成真的硬件消息：OpenAI 与 Jony Ive 合作的智能体设备据申报文件最早要到 2027 年 2 月才会出货。

## 一点个人观察

**第一，DevDay 的重心已经从「开发者大会」滑向「智能体操作系统发布会」。** Dots + Space + Pages + 插件生态 + Marketplace 拼起来，是面向消费者和企业的完整 agent 平台；开发者 API（Decisions、Agents）反而是支撑角色。对标 Meta 免费 Muse 的打法也很直白——OpenAI 选择用付费档位守住高端用户体验。

**第二，「28 天连更」是发布节奏的金融化。** 把「ship or 赔 reset」写成公开规则，等于给用户一个可逐日核验的对赌协议。它既是信任修复，也是营销——如果 28 天全部兑现，Codex 的产品完成度和舆论位置都会上一个台阶；中途崩盘则会被 Reddit 和 X 逐日钉在耻辱柱上。从目前三天看，交付密度是实打实的（模型提速、免费功能、限额降价、公测开放），但也要看到第 2 天就被内部判定「分量不足」——这个标准执行得比外界预期更严。

**第三，对普通订阅用户的实际变化：** Sol 的价格下探意味着智能体编码类任务的成本大幅下降；Sign in with ChatGPT 让 Plus / Pro 订阅的「购买力」第一次延伸到了第三方工具；而 Pro 500 的 $500 定价说明，OpenAI 已经认真开始收割重度用户层级了。

## 参考资料

- [OpenAI 官方：DevDay 2026 Recap](https://openai.com/index/devday-2026-recap/)（20+ 项发布的官方口径与各项目可用范围）
- [OpenAI 官方：Announcing OpenAI DevDay 2026](https://openai.com/index/devday-2026/)
- [The Verge: OpenAI DevDay 2026 — the biggest news and announcements](https://www.theverge.com/ai-artificial-intelligence/1001681/openai-devday-2026-biggest-news-announcements)
- [Learn Prompting Newsletter: OpenAI DevDay 2026 — The Biggest Announcements](https://newsletter.learnprompting.org/p/openai-devday-2026-the-biggest-announcements)
- [OpenAI 社区论坛：Day 1 — 28 days of Quality of Life improvements or a full Reset](https://community.openai.com/t/day-1-28-days-of-quality-of-life-improvements-or-a-full-reset/1403525)
- [OpenAI 社区论坛：28 days of Shipping at OpenAI（逐日追踪帖）](https://community.openai.com/t/28-days-of-shipping-at-openai/1403897)
- [OpenAI 官方：GPT-6 and Intelligent UI for everyone（10-07）](https://openai.com/index/gpt-6-and-intelligent-ui-for-everyone/)
