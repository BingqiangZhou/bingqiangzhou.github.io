---
title: 【工具分享】独立开发者穷鬼套餐全球版（2026）：14 类免费额度把产品跑起来
published: 2026-09-07
description: 整理自程序员鱼皮 9 月 6 日的推文：全球版独立开发者穷鬼套餐，14 类工具全靠免费额度把产品跑起来，从 AI 编程、部署、数据库一直到收款。我逐项核对了给出具体数字的 10 项，全部与官网一致；另补充两个推文没提的坑——Vercel Hobby 仅限非商用、Supabase 免费项目一周不活跃会被暂停，并补上 Lemon Squeezy / Creem 的具体费率。
lang: zh
tags: [工具分享]
---

9 月 6 日，程序员鱼皮在 X 上发了[「全球 · 独立开发者穷鬼套餐（2026 最新版）」](https://x.com/yupi996/status/2096465082465309176)（X 链接需科学上网）：继国内版之后，把全球范围内「全靠免费额度就能把产品跑起来」的工具按开发、上线、运营、收款四个阶段盘了一遍，共 14 类。发推一天多，两万四千多次浏览、三百多个收藏。

我把清单完整搬了过来，顺手在 2026-09-07 把给出了具体数字的项逐一核对了官网价页——好消息是数字全部属实；另外挖出两个官网明写、但推文没提的坑（Vercel Hobby 禁止商用、Supabase 一周不活跃暂停项目），在对应小节里展开说了。

## 清单总览

| # | 用途 | 产品 | 免费额度（推文口径） | 核对 |
| --- | --- | --- | --- | --- |
| 1 | AI 编程 | Copilot / Cursor / Cline | Copilot Free 每月 2000 次补全 + 50 次对话；Cline 可接 Groq / Gemini 免费 API | ✓ |
| 2 | AI 助手 | ChatGPT / Gemini / Claude | 网页版免费，自带生图可做 Logo 和宣传图 | — |
| 3 | 代码管理 + CI/CD | GitHub | 私有仓库免费；公开仓库跑 Actions 免费 | — |
| 4 | 部署 + CDN | Cloudflare / Vercel | Cloudflare 带宽不限量、允许商用；Vercel 100GB 带宽 + 100 万次函数调用 | ✓ ⚠ |
| 5 | 域名 + SSL | Cloudflare | 自动分配子域名，SSL 证书自动配好 | — |
| 6 | 数据库 + 认证 | Supabase | 500MB 数据库，自带认证、文件存储、实时订阅 | ✓ ⚠ |
| 7 | 存储 + 缓存 | Cloudflare R2 + Upstash | R2 10GB 且出口流量免费；Upstash Redis 256MB + 每月 50 万命令 | ✓ |
| 8 | 邮件 | Resend | 每月 3000 封、日限 100 封 | ✓ |
| 9 | 用户行为分析 | Microsoft Clarity | 录屏回放、热力图、点击检测全免费，不限流量不限站点 | — |
| 10 | 流量统计 | Google Analytics | 完全免费，功能最全 | — |
| 11 | 错误监控 | Sentry | 每月 5000 个错误事件 | ✓ |
| 12 | 产品趋势 | Google Trends | 完全免费 | — |
| 13 | 设计工具 | Figma | 草稿箱不限量；协作设计文件 3 个 | ✓ |
| 14 | 收款 | Lemon Squeezy / Creem | 无月费，按交易抽成 | ✓ |

⚠ = 数字属实，但有推文没提的注意事项，见对应小节。

## 开发：编程、助手与托管

AI 编程三家都能免费起步。[Copilot Free](https://github.com/features/copilot/plans) 每月 2000 次代码补全、50 次对话——官网 FAQ 的原话是「2,000 completions and 50 chat requests」，Copilot Edits 也计入对话额度。Cursor 有免费档。开源的 Cline 是编辑器里的 Agent 插件，自己带 API 配置，接 Groq 或 Gemini 的免费 API 就能零成本跑。

AI 助手的网页版（ChatGPT / Gemini / Claude）都免费，而且自带生图：独立开发者启动期的 Logo、宣传图直接用它们生成，不用先买订阅。

代码托管和 CI/CD 用 GitHub：私有仓库免费，公开仓库跑 Actions 免费。个人项目的自动构建和部署够用，不用自己养服务器。

## 上线：部署、域名、数据库、存储

部署首推 [Cloudflare](https://pages.cloudflare.com/)：静态站和全栈应用都能托管（Pages / Workers），免费档带宽不限量，而且**允许商用**——这一点要跟下面的 Vercel 对照着看。[Vercel](https://vercel.com/pricing) 免费档（Hobby）有每月 100GB 带宽和 100 万次函数调用，Next.js 项目部署体验最好；但官网 FAQ 明确写了 Hobby 计划**仅限个人非商业用途**。要对外收款的商业项目，要么升 Pro（每月 20 美元），要么干脆全押 Cloudflare。

域名和 SSL 也能零成本启动：部署到 Cloudflare 会自动分配 `*.workers.dev` / `*.pages.dev` 子域名，SSL 证书自动配好，正式域名之后再买不迟。

数据库和认证用 [Supabase](https://supabase.com/pricing)：开源的一站式后端平台，免费档 500MB 数据库、1GB 文件存储、5 万月活用户的认证，还自带实时订阅，适合全栈项目。注意官网规则：**免费项目一周不活跃会被暂停**（可手动恢复，同时最多 2 个活跃项目）——做正式产品前要有这个心理准备，别把暂停策略当成丢数据的风险，但要有恢复预案。

对象存储和缓存：[Cloudflare R2](https://developers.cloudflare.com/r2/pricing/) 免费档 10GB 存储，最香的是**出口流量永久免费**——对象存储的流量账单向来是最容易爆的地方，R2 直接免了；免费操作额度是 Class A 每月 100 万次、Class B 每月 1000 万次。[Upstash](https://upstash.com/pricing) 的 Serverless Redis 免费版 256MB、每月 50 万条命令（另有每月 10GB 带宽），做会话管理和接口限流够用。

## 运营：邮件、分析、统计、监控

邮件发送用 [Resend](https://resend.com/pricing)：免费档每月 3000 封、日限 100 封，可绑 3 个自定义域名。鱼皮的提醒很实际：发验证码别集中在一天，日限比月限先到。

用户行为分析用微软的 [Clarity](https://clarity.microsoft.com/)：录屏回放、热力图、点击检测全部免费，不限流量、不限站点数，这个慷慨程度在同类产品里没有第二家，做产品优化必备。流量统计用 Google Analytics，完全免费、功能最全；验证产品方向用 Google Trends 先看看搜索趋势和市场热度。

错误监控用 [Sentry](https://sentry.io/pricing/)：几行代码接入，自动捕获前后端报错，免费档每月 5000 个错误事件（单用户、5GB 日志、50 次会话回放）。

## 设计与收款

设计用 [Figma](https://www.figma.com/pricing/)：免费档（Starter）草稿箱文件不限量；能多人协作编辑的设计文件 3 个——官方帮助中心的口径是团队内 Figma Design / Sites 文件共 3 个（另有 FigJam、Slides 文件各 3 个），一个人画原型做界面够用。

收款是 14 类里唯一没法完全零成本的：个人收全球的钱，最省事的路径是 MoR（Merchant of Record，记录商户）平台——它以卖家身份帮你处理全球税务和合规，不用自己注册海外公司，代价是每笔交易抽成。[Lemon Squeezy](https://www.lemonsqueezy.com/pricing) 每笔 5% + 50 美分，[Creem](https://www.creem.io/pricing) 每笔 3.9% + 40 美分，两家都无月费，卖出东西才扣钱。

## 核对记录

推文里给出具体数字的 10 项，我在 2026-09-07 逐一访问官网价页核对，全部一致：

| 项目 | 推文数字 | 官网口径（2026-09-07） |
| --- | --- | --- |
| Copilot Free | 2000 次补全 + 50 次对话/月 | 一致；Edits 计入对话额度 |
| Vercel Hobby | 100GB 带宽 + 100 万次函数调用 | 一致；⚠ 仅限非商用 |
| Supabase | 500MB 数据库 | 一致；另 1GB 存储、5 万 MAU；⚠ 一周不活跃暂停 |
| Cloudflare R2 | 10GB 存储、出口流量免费 | 一致；操作额度 100 万 / 1000 万次每月 |
| Upstash | 256MB + 50 万命令/月 | 一致；另 10GB 带宽/月 |
| Resend | 3000 封/月、日限 100 封 | 一致；另 3 个自定义域名 |
| Sentry | 5000 错误事件/月 | 一致；另 5GB 日志、50 次回放 |
| Figma Starter | 草稿不限、协作文件 3 个 | 一致（帮助中心口径） |
| Lemon Squeezy | 无月费、按笔抽成 | 一致；费率 5% + 50 美分 |
| Creem | 无月费、按笔抽成 | 一致；费率 3.9% + 40 美分 |

没给具体数字的几项（Cursor 免费档、Groq / Gemini 免费 API、Clarity「不限流量」、GitHub / Cloudflare 的托管政策）属于长期稳定或随政策频繁变动的口径，本文不展开，以官网为准。

## 写在最后

清单的原始出处是鱼皮 9 月 6 日的推文（[原文地址](https://x.com/yupi996/status/2096465082465309176)），他此前还发过一版面向国内服务的「国内版」穷鬼套餐，两个版本对照着看更全。另外提醒：这批全球服务里 Google 系（Analytics / Trends）、Sentry、Figma 在国内的访问并不都顺畅，国内场景更适合参考国内版。

同赛道还有 Paddle、Gumroad 等 MoR 平台可以比价。如果你有更好的替代品，欢迎评论区交流——这也是鱼皮原推的结尾：大家是否还有更好的产品推荐？
