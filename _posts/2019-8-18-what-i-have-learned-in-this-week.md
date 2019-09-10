---
title: 搭建github.io博客的总结（三）
date: 2019-08-18 22:23:49
tags: [github.io, hexo, next]
categories: [web, github.io, summary]
---

> 不读则愚，不思则浅，不练则生，不用则钝！

个人博客bingqiangzhou.github.io大概弄了八天，一天把他搭起来，一天写了个逐步还有些错误的总结，其他六天边尝试其他功能边写总结二，博客算是搭建完了，最后再来一个总结三，准备放置一些名词在这里，希望以后只要看这篇文章就能想起主要的知识重点。

<!--more-->

## 名词术语 ##

- [GitHub Pages](https://pages.github.com/) 面向用户、组织和项目开放的公共静态页面搭建托管服务，站点可以被免费托管在Github 上。
- [jekyll](https://www.jekyll.com.cn/docs/) 将纯文本转化为静态网站和博客，Ruby环境下的静态页面生成器，GitHub Pages推荐的默认的生成器。
- [Hexo](https://hexo-guide.readthedocs.io/zh_CN/latest/index.html#) 快速、简洁且高效的博客框架，基于Node.js。
- [NexT](/2019/08/13/2019-8-13-how-to-set-github-io-use-hexo-with-next-md/#%E9%85%8D%E7%BD%AENexT%E4%B8%BB%E9%A2%98) 基于Hexo，一个强大而优雅的主题。
- [Markdown](http://xianbai.me/learn-md/index.html) 一种轻量级的「标记语言」。
- [stylus](http://stylus-lang.com/docs/) 默认使用`.styl`作为文件拓展名，是一个CSS的预处理框架，让CSS增加可编程的的特性。
- [swig](http://node-swig.github.io/swig-templates/docs/) NexT采用的模板引擎是swig，swig是node.js中一个优秀简洁的模板引擎，文件拓展名`.swig`。
- [RRS（Really Simple Syndication，简易信息聚合）](/2019/08/13/2019-8-13-how-to-set-github-io-use-hexo-with-next-md/#RSS%E8%AE%A2%E9%98%85%E6%94%AF%E6%8C%81)
- [知识共享](/2019/08/13/2019-8-13-how-to-set-github-io-use-hexo-with-next-md/#%E7%9F%A5%E8%AF%86%E5%85%B1%E4%BA%AB%E6%94%AF%E6%8C%81)
- [搜索引擎优化SEO](/2019/08/13/2019-8-13-how-to-set-github-io-use-hexo-with-next-md/#SEO%E7%9B%B8%E5%85%B3%E6%96%87%E7%AB%A0)
- [网站站长工具](/2019/08/13/2019-8-13-how-to-set-github-io-use-hexo-with-next-md/#%E7%BD%91%E7%AB%99%E7%AB%99%E9%95%BF%E5%B7%A5%E5%85%B7) 站长建站时用于对网站质量查询与制作帮助的一些工具，简称站长工具。 经常上站长工具可以了解SEO数据变化,还可以检测网站死链接、蜘蛛访问、HTML格式检测、网站速度测试、友情链接检查、网站域名IP查询、PR、权重查询、alexa、whois查询等等，还可以投放广告。


## 涨点知识 ##

- [Rainbow Safari](2019/08/13/2019-8-13-how-to-set-github-io-use-hexo-with-next-md/#Rainbow-Safari%E6%94%AF%E6%8C%81) 我个人很喜欢的一个彩虹风格在Safari浏览器。
- [公益404](/2019/08/13/2019-8-13-how-to-set-github-io-use-hexo-with-next-md/#%E8%87%AA%E5%AE%9A%E4%B9%89404%E9%A1%B5%E9%9D%A2) 腾讯的公益404页面，寻找丢失儿童。
- [Velocity.js动画效果](/2019/08/13/2019-8-13-how-to-set-github-io-use-hexo-with-next-md/#%E5%8A%A8%E7%94%BB%E6%95%88%E6%9E%9C) 一个比较全面的过渡动画效果Javascript库。
- [blogrolls](/2019/08/13/2019-8-13-how-to-set-github-io-use-hexo-with-next-md/#%E4%BE%A7%E8%BE%B9%E6%A0%8FBlogrolls) 博客上的链接列表，还有一个有意思的互粉礼仪。
- [“特色应用”镜像](https://cloud.tencent.com/developer/article/1383718)，一些云镜像，快速部署的镜像应用。
- Table Of Contents (TOC) 文章目录，新认识的名词。
- 微信订阅二维码链接 第一次知道可以`https://open.weixin.qq.com/qr/code?username=`+公众号微信ID（公众号`关于`里查看），比如：https://open.weixin.qq.com/qr/code?username=BingqiangZhou
- [Hexo不渲染.md或者.html](https://blog.csdn.net/ganzhilin520/article/details/79057774)

好了，大概总结到这了。
