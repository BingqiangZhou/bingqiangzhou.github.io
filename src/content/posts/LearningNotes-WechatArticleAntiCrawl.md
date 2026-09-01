---
title: 【学习笔记】突破微信公众号文章反爬：拿到文章链接后的六条获取路线（附实测）
published: 2026-09-01
description: 手里有 mp.weixin.qq.com 文章链接，想把正文稳定拿下来，为什么不是 requests 一发的事？本文先拆解微信反爬的三板斧（UA 白名单、滑块验证、IP 频控）并用四个 UA 做对照实测（工具 UA 直接 302 到 wappoc_appmsgcaptcha 验证页，浏览器与微信 UA 低频均放行），再系统梳理六条获取路线：伪装请求头的一行 curl、真实浏览器自动化、借用公众平台后台接口的 wechat-article-exporter、微信读书中转的 wewe-rss 与继任者 we-mp-rss、真机抓包与 PC Hook、以及 wechat2rss 等付费 RSS 服务，最后给出按场景的选型决策表与合规边界。
lang: zh
tags: [学习笔记, 实践记录]
abbrlink: wechat-mp-article-anti-crawl
---

一个看起来很简单的需求：手里已经有一条 `mp.weixin.qq.com` 的文章链接，想把正文（最好连图）完整拿下来，存档或者喂给大模型。但凡是直接拿 `requests` 试过的人都知道，这事一上来就是滑块验证。公众号是中文互联网质量最高的内容池之一，却也是封闭得最彻底的一个：`mp.weixin.qq.com/robots.txt` 禁止一切搜索引擎抓取，所以 Google、百度里几乎搜不到公众号文章——内容只存在于微信生态内，想拿内容就必须直面它的风控。

这篇笔记是深度调研加低频实测的产物：先拆解对面的反爬机制到底长什么样（附一组 UA 对照实测），再按成本从低到高梳理六条获取路线，最后给一张按场景选型的决策表。先说结论：

> **单篇正文**——伪装浏览器请求头，一行 curl 就够；**批量导出某个号的全部历史文章**——借微信公众平台后台的接口（wechat-article-exporter 把这条路产品化了）；**长期订阅一批号**——微信读书中转转 RSS（wewe-rss 已归档，继任者 we-mp-rss 活跃维护）；**完全不想折腾**——花钱买 wechat2rss 这类服务；**阅读量、评论这类运营数据**——成本陡增，要么手机端抓包拿短期凭证，要么用 exporter 的配套方案。

## 先搞懂对面是什么：反爬三板斧与一组对照实测

社区对微信文章反爬的共识（以知乎那篇「我试了 6 种方案」的总结最精炼）是三板斧：

1. **检查 User-Agent**：判断请求「像不像真浏览器」，重点看有没有 `MicroMessenger` 关键字（微信内置浏览器）；
2. **不像就弹验证码**：跳转到验证页（手机端文案就是那句著名的「环境异常，完成验证后即可继续访问」），腾讯防水墙滑块伺候；
3. **频率太高再上 IP 限制**：即使 UA 正常，高频请求也会升级到验证码乃至封 IP。

我用一篇 2019 年的老文章（「每日安全动态推送(04-02)」，链接取自开源项目 README，直链至今仍有效）做了低频对照实测，每个 UA 只请求一次，总共不到 10 个请求。结果把三板斧的第一斧看得清清楚楚：

| 请求 UA | 结果 |
| --- | --- |
| 微信内置浏览器 UA（`MicroMessenger/8.0.49`，Android） | **HTTP 200**，3,193,964 字节完整正文，`og:title`、`#js_content`、`window.cgiDataNew` 一应俱全 |
| 桌面 Chrome 128 UA | **HTTP 200**，同样 3,193,964 字节完整正文 |
| `curl/8.9.1` | **HTTP 302**，重定向到验证页 |
| `python-requests/2.32.3` | **HTTP 302**，重定向到验证页 |

工具 UA 被拦时的 302 响应是这样的：

```text
HTTP/1.1 302 Found
Location: https://mp.weixin.qq.com/mp/wappoc_appmsgcaptcha?poc_token=HFQ3lmqj…&target_url=https%3A%2F%2Fmp.weixin.qq.com%2Fs%3F__biz%3D…
Set-Cookie: poc_sid=HFQ3lmqj…; Path=/; Secure; HttpOnly
```

也就是说第一道闸不是「必须是微信 UA」，而是「**长得像工具的 UA 直接进验证页**」：`wappoc_appmsgcaptcha`（`poc` 系列参数加 `poc_sid` Cookie）就是验证码页的入口。正常浏览器 UA 在低频下也放行，但微信 UA 是最保险的档位——而且一旦高频，浏览器 UA 会先于微信 UA 触发风控，这也是社区经验里一致推荐伪装 `MicroMessenger` 的原因。

实测还确认了两个对写解析器很关键的点：

- **正文是服务端渲染的**：不需要执行任何 JS，完整 HTML 里就有 `id="js_content"` 的正文容器（出现 18 处，其中正文 div 1 处）、`var msg_title`、`var nickname`、`og:title` 等元信息，以及 63 处 `window.cgiDataNew` 数据对象——这也正是 wechat-article-exporter 用来提取正文的入口。
- **图片防盗链并非铁板一块**：实测 `mmbiz.qpic.cn` 的文章配图不带 Referer 也能 200 拿到（98,397 字节，带不带 `Referer: https://mp.weixin.qq.com/` 结果完全一样）。但社区普遍报告过 403 的情况，保险起见下载图片时还是带上 Referer，成本为零。

另外一个必须先分清的概念：**文章直链永久有效，临时链接几小时失效**。`mp.weixin.qq.com/s/xxx` 或带 `__biz/mid/sn` 参数的长链接是永久直链；而搜狗微信、appmsg 接口返回的部分链接带时效 `key`，过期即死。本文讨论的全部是拿到永久直链之后的获取问题。

## 路线一：伪装请求头——一行 curl 的胜利

这是成本最低、单篇场景下的最优解。V2EX 上有个帖子标题就叫「微信文章抓取最简单方法，no 依赖，no skill」，核心就一行命令：把 User-Agent 伪装成微信手机客户端内置浏览器。有意思的是，那个帖子里关键的 UA 串是让 Google Gemini 生成的，博主 80aj 还专门写了篇复盘。

实测可复现的版本（2026-09-01 验证通过）：

```bash
curl -s -L -o article.html \
  -H 'Referer: https://mp.weixin.qq.com/' \
  -A 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.64 Mobile Safari/537.36 XWEB/1160065 MMWEBSDK/20240401 MicroMessenger/8.0.49.2600(0x28003351) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64' \
  'https://mp.weixin.qq.com/s?__biz=MzA5NDYyNDI0MA==&mid=2651958330&idx=1&sn=a14fb5f431821a63dff80b219906e029'
```

要点：

- **UA 必须像真浏览器**，含 `MicroMessenger` 关键字的微信 UA 是最稳档位；`curl/x.x` 和 `python-requests/x.x` 这类默认 UA 会被 302 直接打发到验证页；
- **控制频率**：低频（比如每请求间隔数秒、加随机抖动）可以长期稳定；高频会升级为滑块和 IP 封禁，住宅网络远比数据中心 IP 耐揍；
- **解析入口**：标题取 `og:title` 或 `var msg_title`，正文取 `#js_content`（已是服务端渲染结果），结构化数据取 `window.cgiDataNew`；
- **局限**：这条路只解决「单篇正文」。批量抓几十上百篇迟早撞墙；评论区、阅读量这类数据在另一个接口体系里，伪装 UA 拿不到。

## 路线二：真实浏览器自动化 + 人工过验证

当需要 JS 执行环境（懒加载的长图、动态渲染的组件）、需要账号态（在看、收藏），或者干脆想模拟完整用户行为时，上 Playwright / Selenium：

- 用 stealth 类补丁降低无头浏览器指纹被识别的概率；
- 遇到滑块**人工拖一次**，验证通过后的 Cookie 能续命一段时间，之后带着 Cookie 走纯 HTTP 请求；
- 接打码平台（超级鹰一类）全自动过腾讯防水墙在技术上是可行的，但要花钱、要传数据给第三方，而且对抗性质浓厚，个人存档场景完全没必要走到这一步，不建议。

这条路单独用的最大价值是**兜底**：路线一被风控盯上时，真实浏览器过一次验证往往能把会话救回来。它是其他路线的配件，而不是主力。

## 路线三：借微信公众平台后台的接口——批量拿「文章列表」的正解

前面的路线解决「拿到链接之后」，这条解决更难的一半：**怎么批量拿到一个号的全部历史文章链接**。答案非常反直觉——不是绕过微信，而是成为微信公众平台的「自己人」：

1. **免费注册一个自己的公众号**（个人订阅号即可）；
2. 扫码登录 `mp.weixin.qq.com` 后台，新建图文消息时用「插入公众号文章超链接」的搜索功能；
3. 这背后调用的是 `searchbiz`（搜公众号拿 fakeid）和 `appmsgpublish`（拿文章列表）接口，能返回**任意公众号**的全量历史文章：标题、摘要、链接、封面、发布时间、是否原创、所属合集。

这条路从 2017 年静觅的教程就有系统记载，如今被开源项目 [wechat-article-exporter](https://github.com/wechat-article/wechat-article-exporter)（12,825 stars，2026 年 8 月仍在更新）做成了开箱即用的产品：在线网站直接用，也支持 Docker 和 Cloudflare 私有化部署；导出格式覆盖 HTML（100% 还原原文排版）、Markdown、Word、Excel、JSON；数据缓存在浏览器 IndexedDB 里，不经过第三方服务器。

lijinma 的原理拆解揭示了它工程上最聪明的几手：

- 用**约 96 个 Cloudflare Worker 组成代理池**去抓正文，规避单 IP 封禁——正文抓取仍然走公网，但把请求摊到了边缘节点上；
- 正文从每篇文章页的 `window.cgiDataNew` 对象提取（与我实测一致）；
- **阅读量和评论**是另一个世界：需要一个 mitmproxy 插件抓取手机微信端的短期凭证才能调用对应接口——这也印证了运营数据的获取成本远高于正文本身；
- 后台 session 大约 4 天过期，需要重新扫码；接口有频控，触发后要扫码解封；付费文章、关注可见文章拿不到。

plantree 在 2026 年的复盘里也独立走到同一条路（自己注册号 + token + Cloudflare Worker 并发下载），他的感想值得引用：「一个小小的突破口，打开了整个世界」，好问题的答案往往是简单的。限制条件同样要记下：目标公众号如果在后台关闭了「允许搜索」，这条路就对它无效。

拿到列表之后，正文抓取回到路线一即可，两条路是完美互补的拼图。

## 路线四：微信读书中转——长期订阅的主流活路

如果目标是「持续跟进一批公众号」，逐篇抓是不现实的，需要一条能日拱一卒的管道。微信读书送上了这条管道：**微信读书里可以直接阅读公众号文章**，而它的接口反爬强度远低于 mp 主站。于是开源界的做法是：扫码授权一个微信读书账号，用它的登录态定时拉取订阅号的更新，转成全文 RSS。

这条线的开创者是 [wewe-rss](https://github.com/cooderl/wewe-rss)（9,674 stars，MIT 协议）：Docker 部署，后台定时更新，支持 RSS/Atom/JSON 全文输出、OPML 导出、标题过滤。但它已经**于 2026 年 3 月归档停更**（GitHub archived 状态），README 里还有一条值得注意的风险声明：部分接口请求会经作者的 `weread.111965.xyz` 服务转发（声明不保存数据，但自部署者应当知情）。

继任者是 [we-mp-rss](https://github.com/rachelos/we-mp-rss)（WeRSS，4,442 stars，2026 年 8 月仍在活跃维护）：Python 3.13 重写，Docker 一行起，功能从 RSS 扩展到 Markdown/PDF 导出、Webhook 通知、开放 API 甚至 AI Agent 接入，还内置了「环境异常统计」来看抓取健康度。扫码授权的交互对非技术用户也友好。

这条路的真实成本和风险：

- 需要**一个微信读书账号**做登录态，理论上存在账号被限制的风险（个人单账号自用是社区普遍验证过的安全档位；至于拿一批账号轮换池化的玩法，灰色且连累他人账号，别碰）；
- 全文 RSS 意味着内容会被 RSS 阅读器缓存，注意只用于个人阅读；
- 部署后基本免维护，cron 定时拉取，是六条路里「长期总成本」最低的。

## 路线五：客户端路线——真机抓包与 PC Hook

最古老也最「物理」的路线：让真实微信客户端替你发请求。微信客户端内打开文章**永远不触发 web 端验证**，因为请求本身就带着完整的客户端环境。

- **手机/模拟器 + 中间人代理**（Charles、Fiddler、mitmproxy、AnyProxy）：给设备配代理和 CA 证书，拦截微信客户端流量，能拿到文章页完整 HTML 和 app 侧接口。appmsg 列表接口在 app 侧的请求带 `pass_ticket` 类临时票据，重放窗口很短，适合「单次批量导出」而非长期运行。腾讯云社区有三方式对比（搜狗、中间人代理、Hook）的系统分析。
- **PC Hook**（dll 注入、内存读取一类）：技术上存在（ECommerceCrawlers 的微信爬虫研究 wiki 有整理），能完全自动化，但违反客户端协议、封号风险最高，且处于法律灰色地带，不建议。

这条路线现在的定位：**运营数据（阅读量、在看、评论）基本只剩这条路走得通**——正如路线三提到的，wechat-article-exporter 拿阅读量评论也是靠手机端短期凭证，本质就是轻量版的客户端路线。

## 路线六：花钱买省心——第三方 RSS 与数据服务

不想部署任何东西，就为别人的反爬对抗付钱：

- [wechat2rss](https://wechat2rss.xlab.app/)（作者 ttttmr，2021 年 9 月启动，repo 1,566 stars）：公开服务免费收录了 485+ 个安全/开发类公众号，即开即用；**私有部署 ¥15/月或 ¥150/年**，不限订阅数量，平均 6 小时更新时延、全文输出。技术路线与路线三同源（mp 平台 Cookie + token 维持登录态，还提供验证码续期 API），作者扛了全部对抗。
- 「今天看啥」（jintiankansha.me）：付费订阅平台，V2EX 社区反馈近年仍可用。
- Feeddd 等免费聚合：能白嫖但稳定性一般，属于「有就用」。
- 新榜、西瓜数据等商业数据平台：面向运营分析，有正规 API，按量付费，适合企业场景。
- **RSSHub 的 wechat 系列路由基本全灭**：官方实例上常年 404，社区实测多路由失效，「公众号 RSS 方案被平台封杀得差不多了」是普遍结论——别再把 RSSHub 当公众号源指望。
- 单篇兜底：把链接提交给 archive.ph 存档后再取存档内容，绕开自己 IP 的频控，成功率看运气。

## 为什么没人再走搜狗了

早年的教程清一色走 weixin.sogou.com（搜狗独家收录公众号），现在基本被社区放弃，三个硬伤：搜狗自己的反爬比微信还凶（SNUID Cookie 校验，连续刷新就弹验证码，第一次运行 weixin_sogou 库返回的永远是反爬页）；**返回的文章链接是临时链接，几小时后失效**；无法精确指定公众号（同名号一堆）。它现在的价值只剩「按关键词发现文章」这一个弱需求，正路（路线三）全面更优。

## 选型决策表

| 场景 | 推荐路线 | 一次性成本 | 长期稳定性 |
| --- | --- | --- | --- |
| 单篇正文 / 低频几十篇 | 路线一：伪装 UA | 一行 curl | 低频下非常稳 |
| 需要 JS 环境 / 过验证续命 | 路线二：浏览器自动化 | 中 | 兜底配件 |
| 批量导出某号全部历史文章 | 路线三：公众平台接口 + exporter | 注册个号 + 扫码 | session 短、有频控 |
| 长期订阅一批号 | 路线四：微信读书中转（we-mp-rss） | Docker 部署 + 扫码 | 六条路里最好 |
| 阅读量 / 评论等运营数据 | 路线五：手机端短期凭证 | 抓包环境 | 高 |
| 完全不想维护 | 路线六：wechat2rss 等 | ¥15/月起 | 服务方兜底 |

我的组合拳：**路线四打底做订阅**（we-mp-rss 自部署），**路线一做单篇快速抓取**，遇到「把某个号全部历史导出存档」的一次性任务再上**路线三**。

## 合规与边界

最后把丑话说在前面，这些方法的边界比技术本身更重要：

- **版权**：正文、配图的版权属于作者和平台。个人存档、喂给自己的检索和大模型属于灰色但普遍接受的自用；二次分发、商用、聚合转售都是明确的侵权。
- **频率礼貌**：频控既是技术对抗也是基本礼貌，任何路线都加随机间隔，别拿打码平台和代理池去轰炸。
- **别碰的内容**：付费文章、关注可见内容、以及一切「平台明确不让你看」的东西，绕过付费墙性质完全不同。
- **账号风险自担**：微信公众平台账号、微信读书账号都是实名资产，路线三四五都在用你的账号做登录态，被限制的后果自己掂量。
- 本笔记仅作技术研究与个人存档用途的方法整理。

## 参考资料

实测与原理拆解：

- [V2EX：微信文章抓取最简单方法，no 依赖，no skill](https://www.v2ex.com/t/1200950)
- [80aj：零依赖抓取微信文章——Gemini 生成的伪装 UA 绕过滑块验证](https://www.80aj.com/2026/03/25/gemini-wechat-scraper/)
- [知乎：获取微信公众号文章，我试了 6 种方案（反爬三板斧）](https://zhuanlan.zhihu.com/p/2023365770478920344)
- [lijinma：wechat-article-exporter 工作原理拆解](https://lijinma.com/how-wechat-article-export-tool-works/)
- [plantree：批量导出微信公众号有可能吗（2026 复盘）](https://plantree.me/blog/2026/batch-export-wechat-official-account/)
- [静觅：微信公众平台爬虫方案（2017 鼻祖教程）](https://cuiqingcai.com/4652.html)

工具与服务：

- [wechat-article-exporter（12.8k stars）](https://github.com/wechat-article/wechat-article-exporter)
- [wewe-rss（9.7k stars，已归档）](https://github.com/cooderl/wewe-rss)
- [we-mp-rss / WeRSS（4.4k stars，活跃）](https://github.com/rachelos/we-mp-rss)
- [Wechat2RSS 官网（付费私有部署）](https://wechat2rss.xlab.app/) / [GitHub 仓库](https://github.com/ttttmr/wechat2rss) / [小众软件介绍](https://www.appinn.com/wechat2rss/)
- [少数派：WeWe RSS 使用教程](https://sspai.com/post/93845) / [博客园：WeRSS 原理分析与部署实战](https://www.cnblogs.com/wintersun/p/19265009)

路线背景与对比：

- [Python3 网络爬虫实战：使用代理爬取微信公众号文章（搜狗路线的衰老史）](https://python3webspider.cuiqingcai.com/9.5-shi-yong-dai-li-pa-qu-wei-xin-gong-zhong-hao-wen-zhang)
- [腾讯云：微信的公众号爬取——搜狗、中间人代理、Hook 三方式对比](https://developer.cloud.tencent.com/article/1525158) / [Fiddler 抓取微信公众号历史文章](https://developer.cloud.tencent.com/article/1592955) / [AnyProxy 中间人代理方案](https://blog.nowcoder.net/n/f34cecd48bcd43539874a1634501cbf7)
- [LoRexxar：微信机器人与公众号爬虫研究（搜狗临时链接失效问题）](https://lorexxar.cn/2023/05/08/wechat-robot/) / [ECommerceCrawlers：微信公众号爬虫研究 wiki](https://github.com/DropsDevopsOrg/ECommerceCrawlers/wiki/%E5%BE%AE%E4%BF%A1%E5%85%AC%E4%BC%97%E5%8F%B7%E7%88%AC%E5%8F%96%E7%A0%94%E7%A9%B6)
- [博客园：公众号 RSS 方案基本被平台封杀得差不多了](https://www.cnblogs.com/98record/p/gong-zhong-hao-zhi-chirss-ding-yue.html) / [V2EX：可用的公众号 RSS 订阅方案讨论](https://hk.v2ex.com/t/1138322)
