---
title: 【小学生记叙文】我又回来了
tags: [小学生记叙文系列]
---

好久没有更新博客了，这两天和朋友聊到写博客，然后良心发现，博客还是要写起来，总结一下，之后回顾起来，还是好一点，而且下学期好像，好像要检查看的论文了，哈哈。

<!--more-->

今天整理了一下博客，大概看了一下[jekyll-TeXt-theme](https://github.com/kitian616/jekyll-TeXt-theme)的源码，
1. 把TOC(目录)从右边移到了，加大了一下字体。
2. 在查看效果的时候，惊奇的发现，TOC没有内容的时候，依旧有会占据这块地方，然后又改了一下代码，在没有内容的时候隐藏一下TOC。
3. 看[jekyll-TeXt-theme文档](https://tianqi.name/jekyll-TeXt-theme/archive.html)的时候，又发现了一些好玩的东西，jekyll 脚注(Footnote)[^Footnote]、还有定义(Definition)[^Definition]，画图[^ChartAndMermaid]等等。
4. 设置了一下图片居中，将如下css代码加入到`_article-content.scss`文件的`img:not(.emoji)`标签中，同时注释掉`vertical-align`项，[参考链接](https://www.smslit.top/2015/10/15/PostImgCenter-Jekyll/)。
   ```
    clear: both; 
    display: block; 
    margin:auto; 
    // vertical-align: middle; // 注释掉
   ```
5. 最后还把博客的标题命名，文件命名统一了一下。


好了，最后点下题，我又回来了。

明天算法与数据结构课、文献检索与论文写作结课结课，要考试、要汇报，溜了溜了。

[^Footnote]: 这就是脚注，[文档链接](https://tianqi.name/jekyll-TeXt-theme/post/2016/05/04/footnote.html)

[^Definition]: [定义的文档链接](https://tianqi.name/jekyll-TeXt-theme/post/2016/05/05/definition.html)，定义是什么呢？也就是一种markdown的展示形式而已。

[^ChartAndMermaid]: [图表Chart的文档链接](https://tianqi.name/jekyll-TeXt-theme/post/2017/05/05/chart.html) 、[流程图、时序图等等Mermaid图的文档链接](https://tianqi.name/jekyll-TeXt-theme/post/2017/06/06/mermaid.html)，这里的[Mermaid](https://mermaid-js.github.io/mermaid/)图，其实是一个JavaScript库的名字，用来画图的库，翻译过来为美人鱼。
