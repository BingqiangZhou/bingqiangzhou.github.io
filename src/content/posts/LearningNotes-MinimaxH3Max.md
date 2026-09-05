---
title: 【学习笔记】MiniMax H3 Max：fal 把开源 H3 后训练成"生成快过播放"的视频模型（信息汇总）
published: 2026-09-01
description: 听说"MiniMax 出了个 H3 Max，速度极快"，查了一圈信息汇总成笔记。先澄清最容易误解的一点：H3 Max 不是语言模型，而是 fal 与 MiniMax 合作、基于开源视频模型 MiniMax H3 后训练出的高速版本——5 秒 768p 视频约 3 秒生成，比播放还快，官方口径约为 MiniMax 自家 H3 端点的 35 倍吞吐。本文分层记录一手与二手数字：速度（fal 官方 35× 吞吐、Reddit"近 50 倍"、第三方 Artificial Analysis 榜单图生视频第一/文生视频第三）、质量争议（FastVideo"FastH3"激进加速掉质量、MiniMax"速度全靠糊质量"的回应、LMSYS 8×H200 实测 1.85-6.24 倍）、价格（MiniMax 平台 480P 0.05 美元/秒、768P 0.08 美元/秒与基础版同价，fal 上 0.08 美元/秒）、底座 H3 的 33B 架构与 Community License 限制，以及"24 小时 AI 频道要花 6912 美元"这类落地测算。
lang: zh
tags: [学习笔记, AI前沿]
abbrlink: minimax-h3-max
---

最近几天圈子里流传一个说法："MiniMax 出了个 H3 Max，速度极快。"我把中英文信息翻了一遍，先把最容易误解的一点说清楚：**H3 Max 不是语言模型，而是视频生成模型**——它是推理平台 [fal](https://fal.ai) 基于 MiniMax 刚开源的全模态生成模型 H3 后训练（post-train）出的高速版本，2026 年 8 月底发布。它出圈的原因只有一个：**生成比播放还快**。一段 5 秒 768p 视频，约 3 秒就出片，官方口径是约 **35 倍**于 MiniMax 自家 H3 端点的吞吐量。

这篇笔记是纯信息汇总（我本人没有实测），按"一手/二手"分层记录数字，最后给价格、许可证边界和落地测算。先说结论：

> **H3 Max = 开源 H3 的权重 + fal 的新训练数据 + 与模型协同设计的专用推理栈**。质量没垮（第三方榜单图生视频第一），速度成了（短视频快过播放），价格也没涨（MiniMax 平台上与基础版 H3 768P 同价，\$0.08/秒）。它把视频生成从"提交后等几分钟"变成了"可以快速试错的工具"——但对"24 小时 AI 直播频道"这类想象，成本、连贯性、审核三道坎都还在。

## 一、H3 Max 是什么：后训练 + 推理协同设计

先把几方关系理清楚，这是中文社区传播里最混乱的部分。

**H3 Max 是谁做的？** [fal 官方公告](https://blog.fal.ai/introducing-h3-max-by-fal/) 的口径：由 fal Research 后训练、fal 推理团队做速度优化，基于的是 MiniMax 开源的 H3 权重。但注意，这不是"第三方魔改打脸官方"的单方面故事——[MiniMax 官方 X 账号](https://x.com/MiniMax_AI/status/2093103692010676461)发文称 "Yesterday, we launched H3 Max. We post-trained MiniMax H3 for stronger prompt adherence and visual quality, while co-designing the inference..."，而且 MiniMax 自家平台的[模型列表](https://platform.minimax.io/docs/guides/models-intro)和[定价页](https://platform.minimax.io/docs/guides/pricing-paygo.md)都直接上架了 H3 Max。中文科技媒体也普遍称这是 MiniMax 与 fal 的[联合发布](https://www.bilibili.com/video/BV1Xh4U68EXg/)。所以更准确的说法是：**双方合作，模型能力侧（后训练）和推理服务侧（fal 的老本行）各出所长**。

**后训练做了什么？**（以下为一手来源 [fal 公告](https://blog.fal.ai/introducing-h3-max-by-fal/)的转述）

- 加了大量新训练数据，主打**提示词遵循**和**视觉质量**两个方向；
- 明确不走传统"步数蒸馏求平价"的路线——fal 的原话是：传统蒸馏目标是达到与基模持平的质量，而他们"aim for a better model at much faster speed"（要一个**更快且更好**的模型）；
- 训练过程中持续做三维度的人头对头偏好评测（整体质量、提示词理解、美学），防止单一总分掩盖某个维度的回归。

**推理侧做了什么？** fal 的推理团队（做 diffusion 服务四年）在模型还在训练时就开始**协同设计**（co-design）推理栈：每个优化只有在内部质量排名不下降时才保留，最终得到的是一个"围绕 H3 Max 专门优化的服务栈，而不是跑着 H3 Max 权重的通用服务栈"。这句话很关键——它解释了为什么同样的权重，官方端点和 fal 端点差出 35 倍：**差距一半在模型后训练，一半在服务工程**。

官方规格（[fal 产品页](https://fal.ai/minimax-h3-max)，一手）：

| 项目 | 规格 |
| --- | --- |
| 模型类型 | 视频生成（文生视频 / 图生视频），音画同步输出原生立体声 |
| 分辨率 | 480P / 768P（**无 2K**——2K 是基础版 H3 的能力） |
| 时长 | 5–15 秒，24 fps |
| 速度 | 5 秒 768p 视频端到端 3 秒内出片，其中后端推理仅约 2.5 秒 |
| 获取渠道 | fal（Playground / fal Agent / API）与 MiniMax 平台（API） |

## 二、速度到底多快：把数字分层

"极快"是这次出圈的标签，但流传的数字从 15 倍到 50 倍都有，必须分层看：

| 口径 | 数字 | 来源层级 |
| --- | --- | --- |
| fal 官方：对 MiniMax 官方 H3 端点的吞吐量 | 约 **35 倍** | 一手（[fal 公告](https://blog.fal.ai/introducing-h3-max-by-fal/)） |
| fal 官方：对比质量相近的其他模型 | 平均快约 **15 倍** | 一手（同上） |
| 端到端延迟 | 5 秒 768p 视频约 3 秒生成（后端推理约 2.5 秒） | 一手（[fal 产品页](https://fal.ai/minimax-h3-max)） |
| Reddit 标题 / levelsio 推文 | "近 **50 倍**于基座模型"、"50x faster but still maintains quality" | 二手（[r/singularity](https://www.reddit.com/r/singularity/comments/1vzbpuh/minimax_h3_max_posttrained_by_fal_on_minimax_h3/)、[levelsio](https://x.com/levelsio/status/2093628563693944889)） |
| 单次演示 | 15 秒视频 9 秒生成 | 二手单例（[KuCoin 快讯](https://www.kucoin.com/news/flash/ai-video-model-h3-max-generates-content-35x-faster-than-predecessor)） |

两个降温的事实，来自 [AI邮报的冷静分析](https://www.aiposthub.com/minimax-h3-max-ai-video-realtime/)（二手但做了交叉核对）：

1. **只有短片"快过播放"**。按官方口径，15 秒视频约需 15 秒生成——"快过播放"只在 5 秒左右的短片段成立，社群里"15 秒只要 9 秒"属于单次成功示范，不是可重现规格；
2. **"快过播放"并非首例**。LTX-Video（Lightricks，2024）早在 H100 上就记录过 5 秒视频约 2 秒生成。H3 Max 的意义不在绝对速度纪录，而在**把这个速度和第一梯队的质量、原生音频同时拿到**。

还有一层社区质疑值得记录（[r/StableDiffusion 讨论](https://www.reddit.com/r/StableDiffusion/comments/1w0noif/fal_will_release_the_weights_of_h3_max/)，二手）：有人认为 35 倍里相当一部分来自**专用机架 + 推理工程优化**，本地用户拿到权重也复现不了这个速度。fal 声称有意开放 H3 Max 权重（[Artificial Analysis 转述](https://x.com/ArtificialAnlys/status/2092717615739494424)），截至本文写作尚未放出——"权重会不会放、放了能不能跑"是悬着的问号。

## 三、质量没垮吗：第三方榜单与两条加速路线

速度之外大家最关心的是"是不是糊质量换速度"。证据分两层：

**第三方榜单**（[Artificial Analysis](https://x.com/ArtificialAnlys/status/2092717615739494424)，发布当天即测评）：H3 Max 首发登顶**图生视频（含音频）榜第一**（Elo 约 1,205），**文生视频榜第三**（约 1,235，落后于 Wan 3.0 和 Gemini Omni Flash）。注意这与 fal 自评"三个维度全部第一"（对比 12 个模型、Bayesian Elo 加权、含置信区间，对手包括官方 H3 端点、Wan 3.0、Seedance 2.5、Kling 3、Veo 3.1）存在口径差——自评测第一是"人头对头胜率"，AA 榜是另一套 Elo 体系。**分层结论：质量第一梯队可确认，"全面碾压"存疑，文生视频还不是第一。**

**加速路线对照**是理解"35 倍"含金量的关键。[七牛云的实测文章](https://news.qiniu.com/archives/1788141932222)（一手实测，2026-08-31）把两条路线摆在了同一张桌上：

| 路线 | 做法 | 实测结果 |
| --- | --- | --- |
| fal（H3 Max） | 后训练 + 专用推理栈协同设计 | 官方口径约 35 倍吞吐 |
| LMSYS 开源侧 | 8×H200 上 VSA + CUDA Graph 等组合优化 | **1.85–1.95 倍（质量无损）**，组合优化最高 **6.24 倍** |
| FastVideo"FastH3 v1" | 4 步/8 步激进加速 | 约 14 倍，但**质量明显下降**；12 步才能追平质量，此时只剩约 2.6 倍 |
| 社区 | sparse attention | 约 2.5 倍 |

这张表说明：纯推理优化做到 2–6 倍是开源侧的天花板，14 倍以上就得牺牲质量；**fal 的 35 倍是"重新训过的模型 + 定制服务栈"叠出来的**，两边缺一不可。

顺带记录一段未能完全核实的传闻（诚实起见单独分层）：B 站有个 4 万多播放的[视频](https://www.bilibili.com/video/BV1Xh4U68EXg/)标题称"MiniMax 官方回应 fal 公开点名批评：FastH3 的速度全靠糊质量"。结合七牛云实测看，"速度全靠糊质量"这个说法针对的应该是 **FastVideo 的 FastH3 激进加速版**（4/8 步版确实掉质量），而不是 fal 的 H3 Max——后者走的是另一条路线且质量登榜。"点名批评"的具体经过我没能找到一手出处，存疑记录。

## 四、价格与获取渠道

MiniMax 官方平台定价（[定价页](https://platform.minimax.io/docs/guides/pricing-paygo.md)，一手核对，按输出秒计费）：

| 模型 | 分辨率 | 价格（美元/秒） | 备注 |
| --- | --- | --- | --- |
| MiniMax-H3-Max | 480P | **\$0.05** | 仅文生视频 / 图生视频，只按输出计费 |
| MiniMax-H3-Max | 768P | **\$0.08** | 与基础版 H3 768P **同价** |
| MiniMax-H3（基础版） | 768P | \$0.08 | 另有视频编辑能力 |
| MiniMax-H3（基础版） | 2K | \$0.13 | 需要高分辨率时的选择 |
| H3-Regeneration | 768P→2K | \$0.05 | 超分管线 |

值得注意的渠道差价：fal 上 H3 Max 为 **\$0.08/秒**（发布首周 5 折，[fal 定价页](https://fal.ai/minimax-h3-max)），而 fal 上的基础版 H3 同分辨率只要 **\$0.06/秒**（[AA 转述](https://x.com/ArtificialAnlys/status/2092717615739494424)）——同一个 Max，在 MiniMax 平台不加价、在 fal 平台反而比基础版贵，选渠道前值得算一下账。国内平台（platform.minimax.cn）检索到的 H3 Max 价格为 480P ¥0.33/秒、768P ¥0.50/秒（搜索结果转述，未直接核对页面）。

免费尝鲜额度（[AI邮报整理](https://www.aiposthub.com/minimax-h3-max-ai-video-realtime/)）：fal 公开页每日 5 次、每次 5 秒；登录 sandbox 另有 5 次、最长 15 秒——想直观感受"3 秒出片"零成本。

## 五、底座：MiniMax H3 是个什么模型

要理解 H3 Max 为什么能这么玩，得看底座 H3 本身（H3 Max 发布于 2026 年 8 月底；H3 则是 7 月 31 日发布、8 月 3 日开放权重）：

- **定位**：MiniMax 的开源**全模态生成**系统——理解文本/图像/视频/音频输入，生成最高 **2K 分辨率、15 秒、原生立体声**的视频。注意它**不是语言模型**：MiniMax 的语言模型是另一条 M 系列（M3，主打 Agent/编程，1M 上下文），H 系列专做生成，官方口径是两条产品线并行。
- **架构**（[HF 模型卡](https://huggingface.co/MiniMaxAI/MiniMax-H3)，一手）：33B 参数的稠密单流 Omni-Transformer，其中约 13B 参数位于 AdaLN 相关分支——这部分推理时可预计算缓存、不常驻显存。权重以 diffusers pipeline 形式发布于 [Hugging Face](https://huggingface.co/MiniMaxAI/MiniMax-H3) 和 [GitHub](https://github.com/MiniMax-AI/MiniMax-H3)，ComfyUI 官方 Day-0 支持，还有 Intel Day-0 硬件适配。
- **成绩**：视频编辑能力登顶（Artificial Analysis 有声视频编辑榜第一，Elo 1,130，[InfoQ 报道的 Reddit 答疑](https://www.infoq.cn/article/9C3eK9tJqDXbabbBy3aj)）；基础版 API 定价 0.8 元/秒（[新京报](https://www.bjnews.com.cn/detail/1785474644129260.html)），约为同类旗舰的三分之一。
- **许可证边界**（[MiniMax H3 Community License](https://platform.minimaxi.com/docs/guides/local-deploy-h3)，务必注意）：非商业使用免费；**年营收低于 2,000 万美元**的组织可免费商用但需显著署名，超过需邮件申请；**地域排除美国、英国、欧盟、韩国**。HF 上标注 `license: other`，不是 OSI 认证的开源协议。另外据 [AI邮报 FAQ](https://www.aiposthub.com/minimax-h3-max-ai-video-realtime/)，完整 2K 管线的部分功能仍需连接 MiniMax 官方服务。

H3 Max 的故事本质上是一场**开源权重的第二春**：MiniMax 把权重放出来，fal 用自己的后训练和服务工程把官方端点"卷"出了 35 倍差距，最后官方干脆联合上架。这是开源生态最理想的正循环剧本——前提是你接受它的许可证限制。

## 六、能干什么、边界在哪

[AI邮报的分析](https://www.aiposthub.com/minimax-h3-max-ai-video-realtime/)（自述立场"中性偏多"）把落地边界讲得比较透，我直接沿用它的框架：

**三道坎**：

1. **成本**：\$0.08/秒看着便宜，换成连续生产就是另一回事——1 小时约 \$288，24 小时约 **\$6,912**，30 天不间断约 **\$207,360**，且不含重抽（生成失败/不满意重试，实际成本可能翻倍）、脚本、串流、存储与审核；
2. **连贯性**：模型**非原生串流**，现有做法是"一段接一段预缓冲"，各段独立生成时角色脸、服装、场景、声音都可能变，需要自己维护尾帧、角色参考与场景状态；
3. **审核**：直播场景数秒内公开，需要 Prompt 限制、敏感内容检查、人工中止与安全备援片段；模仿知名节目/角色/声音还有知识产权风险。

**规格边界**：480P/768P 封顶、单次 5–15 秒——要 2K 或精细文字的高阶广告场景，还是得用基础版 H3 走 2K 管线。

**作者的建议**（我认同）：别一上来就做"永不落幕的 AI 频道"，先做 5–10 分钟、范围受控的互动节目 MVP 验证观众参与度。H3 Max 的真正价值不是"AI 电视"，而是**把视频生成从"提交后等几分钟"变成可快速试错的创作工具**——3 秒出片意味着改一版提示词的成本趋近于零，这对广告、电商、UI/UX 概念原型的迭代节奏是质变。

## 七、我的小结

1. **速度是真的，但要看清口径**：35 倍是"对官方端点的吞吐量"（一手），50 倍是社区传播的放大（二手），第三方榜单确认的是质量第一梯队 + 图生视频第一，而非全面第一；
2. **35 倍的构成比数字本身有意思**：开源侧纯推理优化天花板约 2–6 倍，激进蒸馏到 14 倍就掉质量；fal 用"后训练 + 协同设计服务栈"把速度和质量同时保住，这个方法论（模型和服务栈一起改）比 H3 Max 这个模型更值得记住；
3. **对用户最实际的**：MiniMax 平台上 H3 Max 与基础版 768P 同价，短视频迭代选 Max，要 2K/视频编辑选基础版，两条路都不贵；
4. **悬而未决**：H3 Max 权重尚未放出，放出后本地能否复现速度存疑；H3 的 Community License 有营收门槛和地域排除，商用前必须细读。

## 资料来源

一手来源：

- [Introducing H3 Max by fal（fal 官方公告）](https://blog.fal.ai/introducing-h3-max-by-fal/)
- [MiniMax H3 Max 产品页（fal，含定价与免费额度）](https://fal.ai/minimax-h3-max)
- [MiniMax 平台模型列表](https://platform.minimax.io/docs/guides/models-intro) / [按量计费定价页](https://platform.minimax.io/docs/guides/pricing-paygo.md)
- [MiniMax 官方 X：参与 H3 Max 发布](https://x.com/MiniMax_AI/status/2093103692010676461)
- [MiniMax-H3 模型卡（Hugging Face）](https://huggingface.co/MiniMaxAI/MiniMax-H3) / [GitHub 仓库](https://github.com/MiniMax-AI/MiniMax-H3) / [本地部署与 License 说明](https://platform.minimaxi.com/docs/guides/local-deploy-h3)
- [MiniMax H3 官方博客](https://www.minimax.io/blog/minimax-h3)
- [七牛云：H3 与 H3 Max 加速实测（1.85×–6.24×）](https://news.qiniu.com/archives/1788141932222)
- [Artificial Analysis 首发测评推文](https://x.com/ArtificialAnlys/status/2092717615739494424)

二手来源：

- [AI邮报：H3 Max 速度、价格与直播限制分析](https://www.aiposthub.com/minimax-h3-max-ai-video-realtime/)
- [r/singularity：H3 Max 设定新 Pareto 前沿（"近 50 倍"说法出处）](https://www.reddit.com/r/singularity/comments/1vzbpuh/minimax_h3_max_posttrained_by_fal_on_minimax_h3/)
- [r/StableDiffusion：fal 将放出 H3 Max 权重（含本地复现质疑）](https://www.reddit.com/r/StableDiffusion/comments/1w0noif/fal_will_release_the_weights_of_h3_max/)
- [B 站：MiniMax 官方回应 fal 点名批评（"FastH3 速度全靠糊质量"，细节未核实）](https://www.bilibili.com/video/BV1Xh4U68EXg/)
- [InfoQ：H3 团队 Reddit 答疑（视频编辑榜第一、2K 开源计划）](https://www.infoq.cn/article/9C3eK9tJqDXbabbBy3aj)
- [新京报：MiniMax H3 发布并开源，0.8 元/秒](https://www.bjnews.com.cn/detail/1785474644129260.html)
- [知乎：MiniMax-H3 开源解析（原生立体声）](https://zhuanlan.zhihu.com/p/2076395020857373531)
- [levelsio 推文（"50x faster"）](https://x.com/levelsio/status/2093628563693944889)
