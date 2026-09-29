---
title: 【学习笔记】AIHOT 拆解（六）技术栈：React 与 Next.js 的分野，与 React Router SSR / Fastify / pg-boss / PostgreSQL 17 / Compose 五容器 / EdgeOne CDN 逐件讲
published: 2026-09-29
description: AIHOT 系列第六篇（技术栈番外）：先厘清 React 与 Next.js 的层次关系——React 是 UI 库（组件/Hooks/渲染），Next.js 是建在其上的全栈框架（路由/SSR/数据/构建/部署约定），二者不是同层竞争关系；再逐件讲清开源快照的完整技术选型——React Router v8 SSR（薄全栈层：routes.ts 路由表、loader 数据加载、SSR 直出+注水、server.ts 单进程伺服构建产物与 SSR、页面缓存 300 秒上限）、Fastify（基于 JSON Schema 的校验与序列化快速路径、插件封装、Hook 生命周期，承担全部 HTTP 出口）、pg-boss（用 PostgreSQL 的 SKIP LOCKED 实现的队列+cron，省掉 Redis、任务与业务数据同库同事务）、PostgreSQL 17（60 表、JSONB 重度使用、热度计算下沉 SQL、咨询锁防预算超支、real[] 存向量）、Docker Compose 五容器拓扑（db/setup/api/worker/web 的职责隔离把安全边界做成物理隔离）、EdgeOne CDN（黑盒时代线上架构的边缘层，开源快照刻意移除但保留 CDN 友好钩子）；总结这套选型的共性「组件少、每层可控、适合单机自部署」。全部事实以源码与部署文档为准（commit 589f79e）。
lang: zh
tags: [学习笔记, 工具分享, AI前沿]
abbrlink: aihot-tech-stack-explained
---

> 整理日期：2026-09-29
> 调研方式：栈信息来自仓库 `package.json`（npm workspaces）、`apps/` 三进程源码与 `docs/deploy.md`；黑盒时代的 Next.js/EdgeOne 推断引自本博客[黑盒拆解](/posts/aihot-website-deep-dive/)。版本以 commit `589f79e` 为准：react-router 8.4.0、fastify 5.12.5、pg-boss 12.34.0、postgres（驱动）3.4.9、PostgreSQL 17（容器）、Node `>=24.11`、TypeScript 7.0.2、Vite 8.3.1。
> 本系列：[一·总览](/posts/aihot-framework-deep-dive/) · [二·信源与抓取](/posts/aihot-sources-fetch-deep-dive/) · [三·精选与评分](/posts/aihot-selection-scoring-deep-dive/) · [四·聚簇与热度](/posts/aihot-clustering-hotrank-deep-dive/) · [五·模型榜](/posts/aihot-leaderboard-kemeny-deep-dive/) · **六·技术栈（本篇）**
> 写作动机：这套栈也常被读者问起——「为什么不用 Next.js」「队列为什么不用 Redis」。本篇把每个组件是什么、在 AIHOT 里干什么、换成别的会怎样，一次讲清。

## 一、太长不看

1. **React 和 Next.js 不是二选一**：React 是 UI 库，Next.js 是建在 React 之上的全栈框架。选 Next.js = 选一套约定；不选它 = 自己攒（AIHOT 用 React Router 框架模式攒）。
2. **React Router v8 SSR 是 Next.js 的「自攒版」对手**：v7 合并 Remix 团队的框架模式后，路由表、loader 数据加载、SSR 直出全都有，且构建走 Vite、部署只是个普通 Node 进程。
3. **Fastify 承担全部 HTTP 出口**，靠 JSON Schema 校验和序列化快速路径换性能，Hook 体系挂安全策略。
4. **pg-boss 让队列白送**：Postgres 的 `SKIP LOCKED` 就是队列，cron 调度内置，任务和业务数据同事务——不需要 Redis。
5. **PostgreSQL 17 不只是存储还是计算层**：热度公式的去重和半衰期直接在 SQL 里算完。
6. **五容器拓扑把安全规则做成物理隔离**：web 不碰库、worker 独占模型调用，靠的是进程/容器边界而不是代码自觉。
7. **EdgeOne CDN 是黑盒时代的组件**：线上站有边缘缓存层，开源快照刻意移除（换成你自己部署时的选项），但保留了 CDN 友好的钩子（图片代理的 `auth_request` 模式）。
8. 整套选型的共性：**组件少、每层可控、单机自部署友好**——和「一个人带 AI 运营的生产系统」的约束自洽。

## 二、React 与 Next.js：上下层，不是同类

**React 是一个 UI 库**：只管「用组件和状态描述界面」——组件模型、Hooks、虚拟 DOM diff，输出渲染结果。它不关心路由、数据获取、构建、部署。纯 React 应用（如 Vite 脚手架）默认是浏览器里的 SPA：首屏空 HTML、JS 加载完才渲染、SEO 和首屏速度天然吃亏。

**Next.js 是建在 React 之上的全栈框架**，把 React 不管的事全管了：文件式路由、SSR/SSG、React Server Components、图片优化、API 路由、代码分割策略、部署适配（出身 Vercel，对其平台优化最深）。代价是约定多、心智模型重（App Router 的服务端/客户端组件边界、缓存语义几经大改）、深度绑定部署生态。

| | React（库） | Next.js（框架） |
|---|---|---|
| 层次 | 渲染层 | 全栈约定层 |
| 路由/数据/构建 | 自己配（Vite + React Router 等） | 全套内建 |
| SSR | 自己搭或用 React Router 框架模式 | 一等公民 |
| 部署形态 | 静态文件或任意 Node 服务器 | Node 服务器 / Vercel 最顺 |
| 适合 | 纯前端 SPA、想掌控每一层 | 内容站、要 SEO、全栈一体、图省事 |

所以「选 Next.js 还是 React」是个伪问题——真正的选择是「**要框架的全套约定，还是自己攒**」。AIHOT 黑盒时代是前者（Next.js App Router），重写后是后者（React Router 框架模式 + 独立 API 进程），差异见[总览篇的黑白盒对照表](/posts/aihot-framework-deep-dive/)。

## 三、React Router v8 SSR：薄全栈层

React Router 从 v7 起合并了 Remix 团队的框架模式：不再只是「React 的路由库」，而是完整的全栈框架——路由表约定（AIHOT 的 `apps/web/app/routes.ts`）、每路由的 loader 数据加载、SSR 开箱即用（服务端渲染成 HTML 直出、浏览器注水激活）、构建走 Vite（`@react-router/dev`）。

AIHOT 的用法很克制：`server.ts` 一个 Node 进程同时伺服构建产物和 SSR；**web 层只通过 HTTP 读 api、不碰数据库**；浏览器端页面缓存上限 300 秒（撤稿能及时到达读者的时效上限）。SSR 渲染路径上没有任何慢依赖，README 宣称的页面中位数 10ms 有架构支撑。对比 Next.js 路线：自部署 Docker 场景下更透明、进程边界清晰、不用迁就框架的部署假设——代价是这些好处都得自己动手保住。

## 四、Fastify：全部 HTTP 出口的守门进程

Node 生态的 Web 框架（与 Express 同类），设计更新：基于 JSON Schema 的请求校验和**序列化快速路径**（响应结构已知时跳过通用序列化，这是它比 Express 快的主因之一）、插件封装模型（作用域隔离，不污染全局）、生命周期 Hook、原生 async。

AIHOT 的 `apps/api` 用它承担所有 HTTP 出口：网站自用接口、公开 API v1、四路 RSS、MCP、后台接口、图片代理（HMAC 签名 URL）、OG 分享图渲染（satori + resvg）。仓库里那些「访问日志永不记 query string、鉴权头脱敏、OAuth 探测路径罐头 404、10MB 请求体上限、`maxParamLength` 300」都挂在它的 Hook 体系上——**框架选型决定了安全策略挂载的优雅程度**。

## 五、pg-boss：队列白送，Redis 不用了

pg-boss 是**以 PostgreSQL 为存储的分布式任务队列**：用 `SELECT ... FOR UPDATE SKIP LOCKED` 实现多 worker 安全消费，自带重试、延迟任务、cron 定时调度（AIHOT 的 24 个定时任务全靠它，时区 Asia/Shanghai）、单例锁（同任务不并发）、优先级。

AIHOT 的用法见[总览篇第三节](/posts/aihot-framework-deep-dive/)的定时任务表。选它的账很好算：系统本来就必须有 Postgres，**队列白送**，少一个要运维的基础设施；任务和业务数据同库——「分析结果 + 回执完成」能在一个事务里提交（`analyzeArticle` 正是这么做的）。代价是极限吞吐不如 Redis 系队列，但这个场景一天几万条任务，远没到瓶颈。

## 六、PostgreSQL 17：存储层兼计算层

关系型数据库，17 是 2024 年的大版本（增量备份、升级体验改进）。AIHOT 对它的用法有两个值得注意的倾向：

- **JSONB 重度使用**：信源 config/cursor、付费调用的原始响应、榜单证据、判定候选……灵活 schema 的东西全进 JSONB（配合 GIN 索引和 `->>` 查询）；
- **计算下沉 SQL**：热度公式的参与者去重 + 半衰期衰减就是一条 SQL（`GROUP BY participant_key` + `power(0.5, …)`）；预算检查用**咨询锁**防并发超支；聚簇向量存 `real[]` 数组。每 5 分钟一次的热度重算在库内完成，比把信号拉回应用层算快且省内存。

60 张表覆盖内容管线、事件、报告、榜单、运营五个域（清单见[总览篇](/posts/aihot-framework-deep-dive/)）。

## 七、Docker Compose 五容器：拓扑即架构

`docker compose up -d` 起五个容器，职责边界就是架构图：

```text
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│     web      │──▶│     api      │──▶│      db      │ PostgreSQL 17
│ React Router │   │   Fastify    │   └──────────────┘       ▲
│ SSR  :3000   │   │   :3001      │─────────────────────┐    │
└──────────────┘   └──────────────┘                     │    │
                        ▲                               ┌────┴─────┐
                        └───────────────────────────────│  worker  │
                                                        │ pg-boss  │
                                                        │ 队列+cron │
                                                        └──────────┘
   setup（一次性容器：跑数据库迁移+种子数据后退出）
```

- **db**：Postgres 17，数据在它的卷里；
- **setup**：init 容器模式——每次 `up` 先跑迁移和种子再退出，保证 schema 就绪；
- **api**：唯一碰数据库的 HTTP 层；
- **worker**：唯一调模型和付费 API 的层——「读者打开页面不触发模型调用」「密钥只在后端」这些铁律靠**进程隔离**兜底，而不是代码约定；
- **web**：只读 api 的 SSR 层，单端口对外（`server.ts` 把 API 路径反代给 api 进程）。

加 `--profile https` 起第六个 Caddy 容器（自动 HTTPS，见[总览篇附一](/posts/aihot-framework-deep-dive/)）。数据在三个卷里：`db`、`data`（图片/缓存/本地备份）、`caddy`（证书）；`down` 不删卷，`down -v` 才删。

## 八、EdgeOne CDN：黑盒时代的那一层

EdgeOne 是腾讯云的边缘平台（CDN + 安全防护 + 边缘函数一体），大陆节点友好、需 ICP 备案。它是[黑盒拆解](/posts/aihot-website-deep-dive/)时从响应头指纹推断出的线上组件——当时 AIHOT 前面是 nginx/Ubuntu + 腾讯 EdgeOne。

开源快照里这一层被刻意移除：仓库默认裸跑 3000 端口，CDN 变成「你自己部署时的事」。但代码留了 CDN 友好的钩子——图片代理支持 nginx `auth_request` HEAD 子请求模式，就是为了让 HMAC 签名 URL 能被 CDN 安全缓存（签权在源站、缓存在边缘，两不误）。CDN 在这个架构里的价值：缓存静态资源和可缓存的页面响应（300 秒浏览器缓存上限就是撤稿时效与边缘命中率的平衡点）。

## 九、整体评价：这套栈的可抄性

每一层都有成熟替代（Next.js / Express / BullMQ+Redis / MySQL……），但这套组合的共性值得记住：**组件最少化**（一个数据库兼了队列和缓存的一部分）、**每层一个普通进程**（没有 serverless、没有运维玄学）、**边界即安全**（该隔离的用容器隔离）、**对个人自部署最友好**。当你也是一个（或一小队）人运营生产系统时，这套「少即是多」的选型思路比任何单项技术都值得抄。

## 附：与总览篇的差异说明

总览篇第三节给了三进程架构与四条铁律的骨架；本篇展开每个组件本身是什么、为什么是它、换成别的会怎样，并补齐黑盒时代栈（Next.js + EdgeOne）与开源栈的对应关系。版本号两篇一致。
