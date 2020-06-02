---
title: 【日常小结】使用Jekyll的TeXt主题简单搭建github.io博客
tags: [日常小结系列]
---

这段时间突然发现需要使用到数学公式渲染的插件，而使用Hexo的NexT主题配置MathJax，弄了两天，每次弄了两三个小时，水平有限，没弄好，放弃了，直接使用Jekyll的TeXt主题简单的重新搭建github.io博客，不涉及开发，这里记录一下大概的步骤。

<!--more-->

## 第一步、克隆仓库并去掉部分无关的文件 ##

1. 克隆仓库
```git
git clone https://github.com/kitian616/jekyll-TeXt-theme.git
```

**省略创建github.io仓库**

2. 去掉部分无关的文件
这一步可要可不要，我个人有点强迫症，所以去了那些无关的文件。

根据主题文档中提供的[文件结构](https://tianqi.name/jekyll-TeXt-theme/docs/en/structure)，删除一些无关的文件，包括`.github`、`.vscode`、`CHANGELOG.md`、`README.md`等等

3. 这里我们可以直接`fork`[jekyll-TeXt-theme](https://github.com/kitian616/jekyll-TeXt-theme)仓库，再修改仓库名为**USERNAME.github.io**，如下图所示。
![frok仓库](https://raw.githubusercontent.com/kitian616/jekyll-TeXt-theme/master/docs/assets/images/github-fork.jpg)
![修改仓库名](https://raw.githubusercontent.com/kitian616/jekyll-TeXt-theme/master/docs/assets/images/github-rename-repo.jpg)

**这种方法比较方便**

## 第二步、配置_config.yml文件

这里就不说了，TeXt主题还在慢慢完善，看到文档中，有很多设置，但是还没有上线，我想之后完善了就好用了，现在还是比较简单的，不过我最喜欢的就是它对MathJax支持只需要在`_config.yml`文件中和markdown文件头部（Front Matter格式）设置`mathjax: true`就好了，这是我看了一些主题选择这个的原因，而且它还支持一些表格和图的渲染，[设置方法](https://tianqi.name/jekyll-TeXt-theme/docs/en/markdown-enhancements)。

```yaml
## Mathjax
mathjax: true # false (default), true
mathjax_autoNumber: true # false (default), true
```

## 第三步、 迁移之前的文章 ##

只需要将之前的`_post`文件夹中的Markdown文件复制粘贴到TeXt目录下的`_post`文件夹中即可。

## 记录一下一些好的网站 ##
在TeXt主题的[图标设置](https://tianqi.name/jekyll-TeXt-theme/docs/en/logo-and-favicon)中发现用到了一个好用的工具，上传图片生成图标，还可以检查网站图标是否有适应不同的设备浏览器等等。

网站如下，不仅可用TeXt主题的图标，也是可以用于其他网站图标的，感觉特别的好：

[生成图标网站realfavicongenerator](https://realfavicongenerator.net/)

[MathJax语法](https://www.cnblogs.com/Bone-ACE/p/4558870.html)

[在线MathJax公式书写](http://cxcgzx.cn:88/test/mathtest.php)