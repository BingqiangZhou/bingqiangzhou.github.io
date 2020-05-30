---
title: 搭建github.io博客的总结（一）
date: 2019-08-12 12:03:15
tags: [hexo, next, github.io]
categories: [web, github.io, summary]
---

昨晚搭建完bingqiangzhou.github.io个人博客，今天早上起来，有同学与我交流搭建个人博客，然后我仔细看了一下昨天放的链接，个人觉得表述的顺序有点乱，我比较喜欢先把铺垫做好，即把写博客文章与搭建博客分开，先搭建好博客，再来研究写博客发布文章。

<!--more-->

## 先大概总结一下吧 ##

首先说一下GitHub官方提供的github.io博客，可以**简单的理解为我们提供了一个空间，运行静态页面**，所以我们也可以自己写页面放上去，他会将index.html、index.md等作为首页，技术是用的GitHub Pages。[GitHub Pages官方地址](https://pages.github.com/)

我最开始便是这种方式放了一年前做的几个网页放在上面完了一下，随后就去找了一下教程使用了一下GitHub官方推荐的**Jekyll主题**，这个我也试着玩一下，应该说简单的玩了一下，我们只需要去修改**`_config.yml`**，修改对应图片文件，在**`_post`**文件夹中对**Markdown（`md`）文件**进行**CRUD操作**就可以完成对博客文章的操作。

用**Jekyll主题**完成GitHub个人博客的搭建是极好的，但是当我更换了一个**非GitHub官方推荐的Jekyll主题[Plainwhite](http://jekyllthemes.org/themes/PlainWhite-Jekyll/)**之后，官方却发来邮件说不支持,所以我放弃了这种方式，使用**Hexo**来开发静态网页再发布到GitHub，可能如何搭建好**Ruby环境**，再来处理配置Jekyll，也许会行得通，但是Ruby我不太熟，而Hexo是使用**Node.js环境**，我有了解一些，所以我选择了 **[Hexo](https://hexo.io/)** 来搭建。附上[Jekyll官方主题链接](http://jekyllthemes.org/)

## 在这里在回顾一下，做了哪些事情，遇到了哪些问题吧。 ##

### 做了哪些配置 ###
- 基础的配置，包括头像、功能表设置等等
- Disqus评论
- 代码高亮
- 标签云
- 搜索功能
- 文章数字统计
- ……

### NexT还有太多的东西可以设置了。 ###
- [个性化](http://shenzekun.cn/hexo%E7%9A%84next%E4%B8%BB%E9%A2%98%E4%B8%AA%E6%80%A7%E5%8C%96%E9%85%8D%E7%BD%AE%E6%95%99%E7%A8%8B.html)
- [NexT第三方服务](https://theme-next.org/docs/third-party-services/) 包括评论系统、统计和分析、内容分享服务、搜索服务、拓展库（书签、进度条等等）、数学方程式（用于显示数学公式的）、聊天服务（在线聊天插件）。
- [NexT主题设置](https://theme-next.org/docs/theme-settings/)（大体有SEO搜索引擎优化、侧边栏设置、底部设置、自定义页面设置以及发布文章的设置）。
- ……
这里就不说[标签插件](https://theme-next.org/docs/tag-plugins/)和[高级设置](https://theme-next.org/docs/advanced-settings)了。
 
### 无法同步到GitHub的问题 ###
正确的配置了所有，但是上传到GitHub时会报错，后来猛然清醒了，上传是需要配置SSH Key的而我配置的是PGP Key，好像可以转换过来，这里不太清楚，没有去做了，不过还是用一个麻烦一点的方式实现了这个，我用[GitHub Desktop](https://desktop.github.com/)，把仓库克隆到Hexo的`public`文件夹，随后上传到仓库，而麻烦的是每次`hexo clean`都会把`public`文件夹清理掉，随后又需要克隆下来，然后才能上传。

## 好了，基本上没有遇到其他太大问题了 ##
每一次配置操作前，我都会结合几篇文章去看，然后判断最适合的在动手，也就基本上没有碰到其他问题了。

平时博客这种文章写得太少了，感觉特别啰嗦，以后慢慢改进。




