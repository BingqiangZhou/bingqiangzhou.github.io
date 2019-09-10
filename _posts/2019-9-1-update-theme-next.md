---
title: 更新NexT主题
date: 2019-09-01 12:04:37
tags: [next, github.io]
categories: [web, github.io, update]
---

今天NexT更新了[7.4.0](https://theme-next.org/next-7-4-0-released/)，准备从NexT 7.3.0更新到7.4.0，附上[NexT发布文档](https://github.com/theme-next/hexo-theme-next/releases)

<!-- more -->
## Pull NexT库 ##
首先第一步当然是将NexT给下载下来，当然我们竟然别覆盖之前的文件，而是建立一个新文件夹，然后在配置，这样实在不行，还能用之前的配置的主题，例如如下保存到`next-7-4`文件夹中。
```shell
$ cd hexo
$ git clone https://github.com/theme-next/hexo-theme-next themes/next-7-4
```

## 配置NexT _config.yml文件 ##
这里我备份了一下NexT 7.4.0的`_config.yml`文件，然后我直接复制之前的版本`_config.yml`文件到NexT 7.4.0目录下，查看了一下，[官方两个版本之间_config.yml文件之间的差别](https://github.com/theme-next/hexo-theme-next/compare/v7.3.0...v7.4.0#diff-aeb42283af8ef8e9da40ededd3ae2ab2)，有很多改变，但是运行起来感觉没太大影响。

随后我们将自己的图片复制过去，之前修改了代码地方，在处理一下，NexT基本就处理好了。

## 配置Hexo _config.yml文件 ##

最后在Hexo目录`_config.yml`文件下配置一下theme，这里的`next-7-4`是Next主题的文件夹名。
```yaml #hexo/_config.yml
theme: next-7-4
```

## 注意 ##
这里需要注意的是：
- 需要把图片复制过来
- 之前改动了代码的地方需要重新改一遍

**其实，个人觉得还是没有必要升级的，我也是无聊没事做，弄了一下。**

