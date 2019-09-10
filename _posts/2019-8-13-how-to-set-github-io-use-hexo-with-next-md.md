---
title: 搭建github.io博客的总结（二）
date: 2019-08-13 11:23:08
tags: [github.io, hexo, next]
categories: [web, github.io, summary]

---

> 只有当你认真的去做一件事情的时候，才会发现自己的灵魂，和灵魂的深处。

# 前言 #
从8月13号写起，本来想简单的总结一下自己搭建github.io个人博客的过程，其实一天基本就写得差不多了，可惜的是突然写上瘾了，反复看自己写得东西，想着这里要加一点那里要加一点，有点恐怖，如今这已经不仅仅是一个搭建github.io的过程的回顾了，中间NexT主题那部分，有点中文口语版的官方文档的感觉了。

<!--more-->

# 过程 #
搭建github.io的过程总结起来大概为五步吧。

**搭建Hexo环境→配置NexT主题→创建github.io仓库→发布github.io→更新github.io**

----------

**这里与平时开发到部署云的步骤十分相似。**搭建Hexo环境，就像我们平时搭建开发环境，当然这里也有个选择的过程，平时的开发我们可以选择Java，C#等等，这里也一样，我们可以选择jekyll来搭建，随后我们可以在这个基础上选择主题进行配置，也就像平时的选择框架让后进行开发，开发好后，我们就可以选择租赁云空间了，而这里只要创建github.io库即可，随后将写好的应用程序发布到云空间，对应的这里上传到github.io，最后，我们更新他，即更新配置还有博客，而平时的应用可能就是修补漏洞，添加新功能，更新配置等等，想想还是特别相似。

**搭建开发环境→选择开发框架并开发→租赁云空间→发布部署到云空间→维护应用程序**

----------

开始总结第一步，搭建开发环境，而我这里选择Node.js Hexo来做，接下来总结搭建Hexo环境。

## 搭建Hexo环境 ##
### 下载安装Node.js ###
[Node.js官方下载地址](https://nodejs.org/en/)
[安装教程](https://www.runoob.com/nodejs/nodejs-install-setup.html)

### 安装Hexo ###
[Hexo官网](https://hexo.io/)（注：Hexo官网右上角位置可以切换语言）

```
$ npm install hexo-cli -g  	#安装Hexo   	
$ hexo init blog		#初始化Hexo到blog文件夹
$ cd blog			#转到blog文件夹
$ npm install			#下载引用所有依赖的包
$ hexo server			#启动服务器，访问地址：http://localhost:4000
```

### 配置Hexo ###
#### Hexo基础配置 ####
[详细的官方文档配置部分**（注：右上角位置可以切换语言）**](https://hexo.io/docs/configuration)
这里主要会使用到的有**Site**（网站）、**Pagination**（分页）、**Extensions**（扩展）这三个部分，Site部分包括网站的一些基本信息，包括标题、副标题、描述、语言等等，而Pagination部分用于设置首页每一页显示的文章数目，Extensions部分的话包括设置主题，设置部署发布到GitHub等。
#### Hexo命令 ####
[详细的官方文档配置部分**（注：右上角位置可以切换语言）**](https://hexo.io/docs/commands.html)
最常用的命令有**new、generate、server、deploy、clean**。
- `hexo new`（可简写为`hexo n`）用于新建文章(`hexo n post md文件名`，在`source/_post/`文件夹中生成md文件)、新建页面（`hexo n page 文件名`，这里的文件名最后会生成一个文件夹里面有一个index.md文件）。[详细用法**（注：右上角位置可以切换语言）**](https://hexo.io/docs/writing)
- `hexo generate`（可简写为`hexo g`）用于生成静态页面。 [详细用法**（注：右上角位置可以切换语言）**](https://hexo.io/docs/generating)
- `hexo server`（可简写为`hexo s`）用于启动本地服务器，默认用`http://localhost:4000`访问。[高级用法**（注：右上角位置可以切换语言）**](https://hexo.io/docs/server)
- `hexo clean`（可简写为`hexo cl`）用于清空`public`文件夹其中包括生成的静态页面等等文件，即清空`hexo generate`生成的文件。
- `hexo deploy`（可简写为`hexo d`）用于将网页发布到服务器，包括Git、Heroku、Netlify、Rsync、OpenShift、FTPSync、SFTP等其他发布方法，这里直接将`public`文件夹发布到服务器即可。[详细用法**（注：右上角位置可以切换语言）**](https://hexo.io/docs/deployment)

#### Hexo安装主题 ####
Hexo默认主题为[landscape](https://github.com/hexojs/hexo-theme-landscape)，我们可以进入[Hexo官方的主题集](https://hexo.io/themes/)去选择自己喜欢的主题，一般点击我们喜欢的主题会进入对应的GitHub仓库，在那里一般在README中会有详细的介绍包括如何下载，如何配置等等，这里我选择的是**NexT**主题，**下面来介绍NexT主题**。

## 配置NexT主题 ##
[NexT官方网站](https://theme-next.org)
[NexT GitHub仓库](https://github.com/theme-next/hexo-theme-next)
这里的README文档包括三种语言：英语、中文、俄语。[中文REAMDE在此](https://github.com/theme-next/hexo-theme-next/blob/master/docs/zh-CN/README.md)
当然README中内容不多，去官网更好，但是官网好像没有多语言转换，没关系，看下面的内容吧。

**对了，还有一点，下面除了安装NexT主题之外，其他的功能性配置可以按需配置，及需要哪个功能就看那部分。**

### NexT主题安装 ###

#### 下载NexT主题 ####
##### 方法一：克隆NexT主题GitHub仓库内容到themes/next文件夹 #####
```
$ cd blog								#转到Hexo工程目录下
$ git clone https://github.com/theme-next/hexo-theme-next themes/next	#克隆NexT主题GitHub仓库
```
##### 方法二：下载压缩包解压到相应目录 #####
下载[NexT主题GitHub仓库](https://github.com/theme-next/hexo-theme-next)的`zip`包将其解压到`themes`文件夹下，改仓库名文件夹名字为`next`。**这种方法适合没有下载Git只下载了GitHub Desktop的用户**。[GitHub Desktop下载地址](https://desktop.github.com/) [Git下载链接](https://git-scm.com/downloads)
#### [激活NexT](https://theme-next.org/docs/getting-started/#Enabling-NexT) ####    
修改Hexo工程目录下`_config.yml`文件的`theme`
```yaml #hexo/_config.yml
theme: next
```

----------

### NexT基础配置 ###
#### [设置一种页面显示方案](https://theme-next.org/docs/getting-started/#Choosing-Scheme) ####
NexT显示有四种方案，分别为**Muse**（[预览](https://muse.theme-next.org/)）、**Mist**（[预览](https://mist.theme-next.org/)）、**Pisces**（[预览](https://pisces.theme-next.org/)）、**Gemini**（[预览](https://gemini.theme-next.org/)）可以自行选择一种，其中**Pisces**与**Gemini**看起来时一样的，不同在于**Gemini**的块是有阴影的，而**Pisces**没有。
**设置方法**，找到NexT的配置文件`_config.yml`中的`Schemes`,去掉喜欢的显示方案前面的`#`，**注意**：默认显示方案为**Muse**，如果喜欢其他方案的话要将**Muse**前面的`#`加上。
```yaml #next/_config.yml
# Schemes
#scheme: Muse
#scheme: Mist
scheme: Pisces  # 在这里我选择了Pisces。
#scheme: Gemini
```

#### [设置语言](https://theme-next.org/docs/getting-started/#Choosing-Language) ####
NexT支持十几种语言，请看下表，如果设置后，重启运行没有效果，请查看`next/languages`文件夹是否有对应文件名的`yml`文件，如：简体中文对应在`next/languages`文件夹下会有`zh-CN.yml`的文件。
**注意：这里是要在`Hexo工程下的_config.yml文件`中修改。**
```yaml #hexo/config.yml
language: en
```
**可以对应下面这个表格来设置。**

语言				| 		设置代码
---- 			| 		----
简体中文 		| 		zh-CN
繁体中文			| 		zh-TW
繁体中文-香港 	|		zh-HK
荷兰语			|		nl
英语				|		en
法语				|		fr
德语				|		de
印度尼西亚语		|		id
意大利语			|		it
日语				|		ja
韩语				|		ko
波斯语			|		fa
葡萄牙语			|		pt
葡萄牙语-巴西		|		pt-BR
俄语				|		ru
西班牙语			|		es
土耳其语			|		tr
乌克兰语			|		uk
越南语			|		vi

#### [设置菜单显示内容](https://theme-next.org/docs/getting-started/#Configuring-Menu-Items) ####
设置菜单中显示标签页、分类页、关于页等等页面。设置形式是`Key: /link/ || icon`，这里的`Key`是显示在菜单的名称，这里原有的是英文的，但是显示时变成对应的语言，比如说简体中文，`home`就会显示为`首页`，而在自定义页面设置是使用自己语言就好了，比如下面的`朋友`，（[自定义页面请查看](https://bingqiangzhou.github.io/2019/08/13/2019-8-13-how-to-set-github-io-use-hexo-with-next-md/#NexT%E4%B8%BB%E9%A2%98%E8%AE%BE%E7%BD%AE%EF%BC%88%E8%87%AA%E5%AE%9A%E4%B9%89%E9%A1%B5%E9%9D%A2%EF%BC%89)），随后是`link`（链接）可以放URL链接不限`http`、`https`，如下面的`网页: https://bingqiangzhou.cn || heartbeat`，还有就是可以设置在`hexo/source/`目录下的文件夹，最后一个参数`icon`，是图标的名称，这个名称可以在[Font Awesome图标字体库和CSS框架的网站](http://fontawesome.dashgame.com/)去找，有特别多的图标，都可以任意设置。
```yaml #next/_config.yml
menu:
  home: / || home
  #about: /about/ || user
  #tags: /tags/ || tags
  #categories: /categories/ || th
  archives: /archives/ || archive
  #schedule: /schedule/ || calendar
  #sitemap: /sitemap.xml || sitemap
  #commonweal: /404/ || heartbeat
  朋友: /friends/ || heart
  网页: https://bingqiangzhou.cn || heartbeat
```
**这里还有两个菜单相关的设置。**
```yaml #next/_config.yml
menu_settings:
  icons: true		# 菜单是否显示图标，默认是显示。
  badges: false		# 菜单是否显示菜单对应页面有多少内容，这里默认是不显示。
```
设置`badges`就像手机app在图标上提示有多少条消息的数字，这里设置的就是是否显示这个数字，即如果设置了10个分类，在分类的菜单就会显示数字10。
#### [设置网页图标Favicon](https://theme-next.org/docs/getting-started/#Configuring-Favicon) ####
这里的图标是网页标题前的图标，`android_manifest`与`ms_browserconfig`这两项设置没去了解，在这里就先过了。
**注意，这里的`images`文件夹是在`next/source`下的，放在`hexo/source/`可能会被`next/source`下的文件重写，不重名不会有问题**
```yaml #next/_config.yml
favicon:
  small: /images/logo.jpg				# 小图标图片路径
  medium: /images/logo.jpg				# 中等大小图标路径
  apple_touch_icon: /images/logo.jpg			# 这项不太清楚是什么情况下显示
  safari_pinned_tab: /images/logo.jpg			# 在我们收藏到Favorites书签了，会显示在Safair浏览器首页的图标的路径
  #android_manifest: /images/manifest.json
  #ms_browserconfig: /images/browserconfig.xml
```
#### [设置站点概况的头像Avatar](https://theme-next.org/docs/getting-started/#Configuring-Avatar) ####
可以设置头像图片、圆角还是方角等等。
```yaml #next/_config.yml
avatar: 
  url: /images/logo.jpg		# 图片的路径，可以是项目内路径，也可以是网络路径（http/https等等）
  rounded: false		# 设置头像是否圆形显示，就像QQ显示的头像是圆形的，而微信显示的方形的，
  rotated: false		# 开启`rotated`设置的话，当我们把鼠标放在头像上的时候，头像会旋转一圈，拿开鼠标点之后还会旋转一圈。
```
#### [设置站点概况作者与描述](https://theme-next.org/docs/getting-started/#Configuring-Author) ####
**注意：这里是要在`Hexo工程下的_config.yml文件`中修改。**
```yaml #hexo/_config.yml
title: 惟愿此心无怨尤.				# 网页标题
subtitle: TO BE, TO UP.				# 子标题
description: 我的微信公众号：小周的小粥		# 站点描述
keywords: Blogs					# 用于搜索引擎优化的搜索关键词
author: Bingqiang Zhou				# 作者
language: zh-CN					# 站点语言
timezone: Asia/Shanghai				# 时区
```
[设置语言代码请看](#%E8%AE%BE%E7%BD%AE%E8%AF%AD%E8%A8%80)
[设置时区代码请看](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

----------
### NexT主题设置（基础） ###
**这一部分主要是NexT相对基础的设置。**
#### [控制台提醒](https://theme-next.org/docs/theme-settings/#Console-Reminder) ####
每次运行都自动检查是否有新的版本发布了，不建议开启，拖慢速度。
```yaml #next/_config.yml
reminder: false
```
#### [缓存支持](https://theme-next.org/docs/theme-settings/#Cache-Support) ####
缓存生成的内容，具体不太清楚，默认是开启的，就让他开启吧。
```yaml #next/_config.yml
cache:
  enable: true
	```
#### [最小化支持](https://theme-next.org/docs/theme-settings/#Minify-Support) ####
在生成（`hexo generate`）之后，生成的一些不重要的文件将被删除，建议打开。
```yaml #next/_config.yml
minify: true
```
#### [自定义风格支持](https://theme-next.org/docs/theme-settings/#Custom-Style-Support) ####
使用自己写的页面、风格来显示内容，包括头部内容，以及页面头部，侧边栏等等整个页面的页面布局，只需要把自己写的源代码文件路径设置在这里就行，官方建议将自己写的源代码文件放在`hexo/source/_data`文件夹内。
```yaml #next/_config.yml
# For example, you want to put your custom styles file
# outside theme directory in root `source/_data`, set
# `styles: source/_data/styles.styl`
custom_file_path:
  #head: source/_data/head.swig
  #header: source/_data/header.swig
  #sidebar: source/_data/sidebar.swig
  #postMeta: source/_data/post-meta.swig
  #postBodyEnd: source/_data/post-body-end.swig
  #footer: source/_data/footer.swig
  #bodyEnd: source/_data/body-end.swig
  #variable: source/_data/variables.styl
  #mixin: source/_data/mixins.styl
  #style: source/_data/styles.styl
```
#### [RSS订阅支持](https://theme-next.org/docs/theme-settings/#RSS-Support) ####
> **什么是RSS？**
> RSS（Really Simple Syndication，简易信息聚合）是一种描述和同步网站内容的格式。你可以认为是一种定制个性化推送信息的服务。它能解决你漫无目的浏览网页的问题。它不会过时，信息越是过剩，它的意义也越加彰显。
> **为什么需要RSS？**
> 网络上充斥着大量的信息垃圾，我的体会是：每天摄入了太多我根本不关心的信息。我希望让我关注的信息主动来找我 ，且这些信息都是我需要的，这就是RSS的意义。 

每个网站网页都可以生成RSS链接，生成RSS链接的方式也有很多，想玩一下的可以自己搜一搜了解玩一下，我推荐看一下知乎这个问题的回答[你必读的 RSS 订阅源有哪些？ - 程引的回答 - 知乎](https://www.zhihu.com/question/19580096/answer/20490041)，上面对RSS描述的引用也是来自这里。看一下帖子，文章之后我自己也是玩了一下，暂时还没有找到想订阅的内容，想想这个确实特别好，就像现在的应用都会有关注，但只限于在该平台的用户，而RRS更广，可以订阅一切网站，只要有feed的链接，使用RSS阅读器就可以订阅。（如果网站没有提供RSS订阅源，请看这里[任意网站支持RSS](https://blog.csdn.net/Philm_iOS/article/details/81200656)[如何订阅没有RSS输出的网站](https://blog.csdn.net/fishmai/article/details/52398391)），RSS阅读器也有很多种，你可以看下[哪个RSS阅读器好? - 知乎](https://www.zhihu.com/question/24175829)，好了，下面介绍官方推荐的使用的方法。

首先，我们需要下载安装`hexo-generator-feed`包，[GitHub仓库](https://github.com/hexojs/hexo-generator-feed)。
```
$ npm install hexo-generator-feed --save
```
随后添加配置到`hexo/_config.yml`就搞定了,可以直接复制下面一段到`hexo/_config.yml`就可以。
```yaml #hexo/_config.yml
feed:
  type: atom				# feed的类型，可以选择atom/rss2
  path: atom.xml			# feed的路径，默认是atom.xml/rss2.xml
  limit: 20				# 在feed里的最大文章数，填 0 或者 false 表示显示所有文章
  hub:					# PubSubHubbub（一种互联网上分布式发布/订阅通信的开放协议）的链接，默认留空。
  content:				# （选填项），默认留空，如果设置为true，会显示文章所有内容在feed
  content_limit: 140			# （选填项），默认为140，这里是设置一篇文章在feed显示的最大字数，填上false时不显示文章内容。
  content_limit_delim: ' '		# （选填项）填写一个字符，显示内容剪切到在未达到限制字数前的最后一个设置的字符，默认不填
  order_by: -date			# 文章在feed的排序，默认为日期，还有其他什么排序方式不太清楚
  icon: icon.png			# （选填项）feed的图标，这里是默认图标
```
**另一种方法配置方法**
如何我们不用上面的方式生成feed，用了其他方法，我们只需要将feed链接填写到`next/_config.yml`中的`rss`即可。
```yaml #next/_config.yml
rss: https://bingqiangzhou.github.io/atom.xml
```
**注意，这里是是在`next/_config.yml`，如果是用第一种方式配置这里不需要管。**
#### [知识共享支持](https://theme-next.org/docs/theme-settings/#Creative-Commons) ####
在侧边栏显示创作共用许可证，说明创作、分享等权限，大体可以看一下这篇文章了解一下。[谈谈创作共用许可证（Creative Commons licenses）](http://www.ruanyifeng.com/blog/2008/04/creative_commons_licenses.html)
**创作共用许可证的种类**
- 署名（by license）
- 署名-非商业用途（by-nc license）
- 署名-禁止演绎（by-nd license）
- 署名-非商业用途-禁止演绎（by-nc-nd license）
- 署名-非商业用途-相同方式共享（by-nc-sa license）
- 署名-相同方式共享（by-sa license）

```yaml #next/_config.yml
creative_commons:
  license: by-nc-sa		# 这里对应的填上面的六种创作共用许可证的种类之一。
  sidebar: true			# 是否在侧边栏显示创作共用许可证
  post: true			# 是否在文章最后显示创作共用许可证
  language: deed.zh		# 设置证书显示的语言，注意这里需要加`deed.`
```
#### [文本对齐设置](https://theme-next.org/docs/theme-settings/#Text-Align) ####
设置博客文章的文本对齐方式，可以设置桌面显示下和移动设备显示下的文本对齐方式，这里建议维持默认的`justify`。
```yaml #next/_config.yml
text_align:
  desktop: justify
  mobile: justify
```
**对齐方式有8种**

对齐方式 		|	说明
-----			|	-----
start 			|	与`left`类似，不同的是文本显示方式在 从左到右 和 从右到左 时有不同
end				|	与`right`类似，不同的是文本显示方式在 从左到右 和 从右到左 时有不同
left			|	在一行中居左
right			|	在一行中居右
center			|	在一行中居中
justify			|	适应性对齐，除了最后一行外，文本的间距使其左右边缘与行框的左右边缘对齐
justify-all		|	与`justify`类似，但是最后一行强制适应性对齐。	
match-parent	|	类似于继承，但值的开始和结束是根据父级的方向计算的，并由适当的左值或右值替换。

#### [移动设备适配](https://theme-next.org/docs/theme-settings/#Mobile-Devices-Adaptation) ####
这里可以将`mobile_layout_economy`设置打开，从而减小缩进的填充与编辑的大小。
```yaml #next/_config.yml
mobile_layout_economy: true	
```
设置头部面板在安卓系统的Chrome浏览器下的颜色，默认是深黑色（`#222`）。
```yaml #next/_config.yml
android_chrome_color: "#222"
```
#### [Rainbow Safari支持](https://theme-next.org/docs/theme-settings/#Rainbow-Safari) ####
这个功能是在Safair浏览器中呈现一个地址栏自动渐变颜色的效果，具体效果是当我们浏览文章时，最上面的地址栏会自动随时间渐变颜色，五颜六色的就像彩虹一样。附上[Rainbow Safari的GitHub仓库链接](https://github.com/koole/rainbowsafari)，已经好几年没更新了。
```yaml #next/_config.yml
safari_rainbow: true
```
#### [自定义滑动条](https://theme-next.org/docs/theme-settings/#Custom-Scrollbar-Support) ####
只支持webkit-based的浏览器，其他方面官方没有更多说明，个人建议保持默认设置，不要更改。
```yaml next/_config.yml
custom_scrollbar: true
```
#### [自定义Logo](https://theme-next.org/docs/theme-settings/#Custom-Logo-Support) ####
自定义Logo在**Mist**风格中不支持，个人建议是直接替代`next/source/images`的logo文件就好了，这里也不用设置了。
```yaml #next/_config.yml
custom_logo: /uploads/custom-logo.jpg	# logo的路径
```
#### [代码块风格设置](https://theme-next.org/docs/theme-settings/#Codeblock-Style) ####
代码块有五种风格，还可以加复制按钮，设置复制按钮风格。
```yaml next/_config.yml
codeblock:
  highlight_theme: night eighties		# 高亮代码块的主题风格，有五种选择，请看下面表格
  copy_button:		
    enable: true				# 是否使用复制按钮
    show_result: true				# 实现复制结果，一般是`复制成功`
    style:					# 复制按钮的风格，有三种风格，默认是不填，是default
```
**代码块的五种风格**

normal | night | night eighties | night blue | night bright
-----  | ----- | -------------- | ---------- | -----------
![night](https://github.com/ChrisKempson/Tomorrow-Theme/raw/master/Images/Tomorrow-Night.png) | ![normal](https://github.com/ChrisKempson/Tomorrow-Theme/raw/master/Images/Tomorrow.png) | ![night eighties](https://github.com/ChrisKempson/Tomorrow-Theme/raw/master/Images/Tomorrow-Night-Eighties.png) | ![night blue](https://github.com/ChrisKempson/Tomorrow-Theme/raw/master/Images/Tomorrow-Night-Blue.png) | ![night bright](https://github.com/ChrisKempson/Tomorrow-Theme/raw/master/Images/Tomorrow-Night-Bright.png)

**具体的颜色**[十六进制调色板](https://github.com/chriskempson/tomorrow-theme#hex-palettes)

**复制按钮的三种风格**
`default`：默认风格，普通的按钮。
`flat`：平面的那种风格，可以自己试一下。
`mac`：我当前使用的风格的样子。

#### [关注GitHub横幅](https://theme-next.org/docs/theme-settings/#GitHub-Banner) ####
设置让读者关注我们的GitHub的横幅在页面右上角，点击会跳到我们的GitHub的首页。
```yaml #next/_config.yml
github_banner:
  enable: true					# 是否启用关注GitHub横幅
  permalink: https://github.com/yourname	# GitHub链接，如：https://github.com/BingqiangZhou
  title: Follow me on GitHub			# 鼠标放在横幅上显示的话
```
#### [自定义字体](https://theme-next.org/docs/theme-settings/#Fonts-Customization) ####
自定义字体，我们可以设置五部分的字体，包括：

参数			| 说明
 ----------	| -----------------------------------------------------
`global` 	| 全局的字体设置，这里是设置`<body>`标签内的字体
`title`		| 站点标题的字体设置，这里是对（`.site-title`）CSS类的字体设置
`headings`	| 文章标题的字体设置，这里是对`<h1>`-`<h6>`标签的字体设置
`posts`		| 博客文章的字体设置，这里是对（`.post-body`）CSS类的字体设置
`codes`		| 代码块的字体设置，这里是对`<code>`、`<pre>`标签的字体设置

每个部分的字体设置有包括了三个参数,包括：

参数			| 说明
 ----------	| -----------------------------------------------------
`external` 	| 拓展，是否使用`host`中设置的设置的URI来加载字体集
`family`	| 字体集的名字，不包括引号，如`Times New Roman`
`size`		| 字体大小，以`em`为单位，默认为`1`（16px）

```yaml #next/_config.yml
font:
  enable: true		# 是否开启自定义字体功能
  host:		# 字体主机的Uri，只需要填域名或者IP，这里默认不填为fonts.googleapis.com
  
  global:			# 全局的字体设置，这里是设置`<body>`标签内的字体
    external: true
    family: Monda
    size: 1.125

  title:			# 站点标题的字体设置，这里是对（`.site-title`）CSS类的字体设置
    external: true
    family: Lobster Two
    size:

  headings:			# 文章标题的字体设置，这里是对`<h1>`-`<h6>`标签的字体设置
    external: true
    family: Amita
    size:

  posts:			# 博客文章的字体设置，这里是对（`.post-body`）CSS类的字体设置
    external: true
    family: Roboto Slab

  codes:			# 代码块的字体设置，这里是对`<code>`、`<pre>`标签的字体设置
    external: true
    family: PT Mono
```

**注意**
这里默认的主机（`host`）为`//fonts.googleapis.com`（注意配置`host`的时候需要再前面加两斜杠`//`），我们可能无法访问谷歌的字体库，NexT官方文档提到了这点，如果字体失效了，非代码的字体使用`"PingFang SC", "Microsoft YaHei", sans-serif`，代码的字体使用`consolas, Menlo, "PingFang SC", "Microsoft YaHei", monospace`，NexT还提供了一种方式，我们可以设置自定义字体公共库的主机，但是我没有找到可以的。
这里需要更深的研究一下，如何处理？我找到了设置字体的这部分代码，在`themes/next/scripts/helpers/font.js`（见下面的代码），可以自行阅读代码，修改链接为本地代码，甚至可以直接就`return`（返回）自己所要的字体的URL，甚至是设置本地的地址，该段代码在`themes/next/layout/_partials/head/head.swig`中执行，我们可以查找`next_font`，找到用来执行下面的`next_font`方法的这一行代码。
我们也可以直接在这里放字体的`link`，这种方法相对简单吧，改`JavaScript`代码的话，虽然灵活度高，但是难度也大。

```js #themes/next/scripts/helpers/font.js
/* global hexo */

'use strict';

hexo.extend.helper.register('next_font', () => {
  var fontConfig = hexo.theme.config.font;

  if (!fontConfig || !fontConfig.enable) {
    return '';
  }

  var fontDisplay = '&display=swap';
  var fontSubset = '&subset=latin,latin-ext';
  var fontStyles = ':300,300italic,400,400italic,700,700italic';
  var fontHost = fontConfig.host || '//fonts.googleapis.com';

  //Get a font list from fontConfig
  var fontFamilies = ['global', 'title', 'headings', 'posts', 'codes'].map(item => {
    if (fontConfig[item] && fontConfig[item].family && fontConfig[item].external) {
      return fontConfig[item].family + fontStyles;
    }
    return '';
  });

  fontFamilies = fontFamilies.filter(item => item !== '');
  fontFamilies = Array.from(new Set(fontFamilies));
  fontFamilies = fontFamilies.join('|');

  // Merge extra parameters to the final processed font string
  return fontFamilies ? `<link rel="stylesheet" href="${fontHost}/css?family=${fontFamilies.concat(fontDisplay, fontSubset)}">` : '';
});
```

#### [动画效果](https://theme-next.org/docs/theme-settings/#Animation-Effect) ####
动态效果有很多，支持设置动态效果有博客文章打开的动画以及打开时侧边栏的动画。
NexT实现这些动态效果用的是**Velocity.js**。 [Velocity.js官方文档](http://velocityjs.org/) [Velocity.js的GitHub仓库](https://github.com/julianshapiro/velocity) 
```yaml #next/_config.yml
motion:
  enable: true				# 是否开启动画效果
  async: false				# 是否异步加载动画
  transition:
    post_block: fadeIn			# 博客文章的标题块的加载动画
    post_header: slideDownIn		# 博客文章的头部的加载动画
    post_body: slideDownIn		# 博客文章的内容的加载动画
    coll_header: slideLeftIn		# **我猜**可能是塌陷后的头菜单的加载动画
    sidebar: slideUpIn			# 侧边栏加载动画，只在`Pisces`和`Gemini`风格中有效
```
**所有动画效果的变量如下**

1	   | 2 		| 3		 | 4 	  | 5	   | 6		  
------ | ------ | ------ | ------ | ------ | ------  
fadeIn| fadeOut | flipXIn | flipXOut | flipYIn | flipYOut 
flipBounceXIn | flipBounceXOut | flipBounceYIn | flipBounceYOut | swoopIn | swoopOut 
whirlIn | whirlOut | shrinkIn | shrinkOut | expandIn | expandOut
bounceIn | bounceOut | bounceUpIn | bounceUpOut | bounceDownIn | bounceDownOut 
bounceLeftIn | bounceLeftOut | bounceRightIn | bounceRightOut | slideUpIn | slideUpOut 
slideDownIn | slideDownOut | slideLeftIn | slideLeftOut | slideRightIn | slideRightOut
slideUpBigIn | slideUpBigOut | slideDownBigIn | slideDownBigOut | slideLeftBigIn | slideLeftBigOut 
slideRightBigIn | slideRightBigOut | perspectiveUpIn | perspectiveUpOut | perspectiveDownIn | perspectiveDownOut 
perspectiveLeftIn |perspectiveLeftOut | perspectiveRightIn | perspectiveRightOut

这里不再单个描述各个效果了，我们可以在 **[这里](http://www.a5xiazai.com/demo/code_pop/19/2155/)** 体验这些动态效果。

----------

### NexT主题设置（站点页脚） ###
**这一部分主要是站点的页脚相关的设置。**
#### [站点开始的年份](https://theme-next.org/docs/theme-settings/footer#Site-Start-Time)`since` #### 

```yaml #next/_config.yml
footer:
  since: 2015		#站点开始年份，如果设置一个过去的年份就会显示，过去年份-今年，如2015-2018
			#如果不设置或者设置成今年年份则显示今年年份
```

#### [站点开始年份与版权信息之间的图标](https://theme-next.org/docs/theme-settings/footer#Site-Footer-Icon)`icon` ####

```yaml #next/_config.yml
footer:
  icon:			#在站点开始年份与版权信息之间的图标，默认为Font Awesome库的user图标
    name: user		#Font Awesome库的图标名称，默认为user
    animated: false	#是否设置图标为动画，设置为true，图标会动，还蛮有意思的，特别是图标设置成heart的时候
    color: "#808080"	#设置图标的颜色，如果设置图标为heart，建议改变颜色为红色"#ff0000"
```

#### [版权信息](https://theme-next.org/docs/theme-settings/footer#Site-Copyright-Name)`copyright` ####

```yaml #next/_config.yml
footer:
  copyright:		#版权信息，如果不设置，则显示在`hexo/_config.yml`中设置的作者`author`信息
```

#### [Hexo授权信息`powered`，NexT主题授权信息`theme`](https://theme-next.org/docs/theme-settings/footer#Site-Platform-Information) ####

```yaml #next/_config.yml
footer:
  powered:			
    enable: true	#是否显示带有链接的`Powered by Hexo`,中文会显示为`由 Hexo 强力驱动`
    version: true	#是否显示Hexo的版本号`vX.X.X`

  theme:
    enable: true	#是否显示带有链接的NexT主题信息`Theme - NexT.scheme`，中文会显示成`主题 - NexT.scheme`
    version: true	#是否显示NexT主题的版本号`vX.X.X`
```

#### 备案信息`beian` ####

```yaml #next/_config.yml
footer:
  beian:		#专为中国用户提供的ICP备案信息显示功能 
    enable: false	#是否显示ICP备案信息显示
    icp:		#ICP备案号显示在站点开始年份之前，并带有工信部备案管理系统链接http://www.beian.miit.gov.cn
```

这里附上Font Awesome库的图标信息[链接一](https://fontawesome.com/v4.7.0/icons/)，[链接二](http://fontawesome.dashgame.com/)。

----------

### NexT主题设置（搜索引擎优化SEO） ###
**这一部分主要是搜索引擎优化相关的设置。**

#### [SEO基础设置](https://theme-next.org/docs/theme-settings/seo#SEO-Setting) ####
NexT提供了一些基础的搜索引擎优化的设置，包括：
第一个基础设置是：对于百度搜索引擎，缓存并重写我们的网站，提供一个**网页快照**给手机用户。
官方大概是这么说，不塌熟悉是怎么一回事，默认是`false`，即打开这一项功能。

```yaml #next/_config.yml
disable_baidu_transformation: false
```

第二个基础设置是**规范链接**标签。
默认是`true`，但是还需要在`hexo/_config.yml`中设置了URL链接才行，如：url: `https://bingqiangzhou.github.io`，官方提供了一个谷歌的链接来说明[为类似网页或重复网页指定规范网页](https://support.google.com/webmasters/answer/139066)，对SEO不太懂，这里引用链接文章中的两段话吧。
> 如果您的某一个网页可通过多个网址访问，或者您的不同网页包含类似内容（例如，某个网页既有移动版，又有桌面版），那么 Google 会将这些网页视为同一个网页的重复版本。Google 会选择一个网址作为规范版本并抓取该网址，而将所有其他网址视为重复网址并降低对这些网址的抓取频率。
> 如果您未明确告知 Google 哪个网址是规范网址，Google 就会替您做出选择，或会将这两个版本视为同等重要，这可能会导致出现一些不当的行为。

```yaml #next/_config.yml
canonical: true
```

第三个基础设置是**SEO**。
默认是`true`，官方的描述这项功能是它会改变站点的子标题（将作为主要的站点描述）和所有博客文章/页面的标题的层次结构，从而更好的优化SEO，这里依旧不是那么懂，跳过了。

```yaml #next/_config.yml
seo: true
```

第四个基础设置是**首页显示子标题**。
默认为false，如果开启这项功能，他会在首页的标题上加上子标题的显示，如`惟愿此心无怨尤 - TO BE, TO UP.`，不开启，则显示标题，如`惟愿此心无怨尤`，这个还是很好理解的，对了，需要注意的是要在`hexo/_config.yml`设置了子标题才行，如`subtitle: TO BE, TO UP.`。

```yaml #next/_config.yml
index_with_subtitle: false
```

#### [外部URL设置](https://theme-next.org/docs/theme-settings/seo#ExtURL) ####
开启这项功能，会自动为外部链接加上Base64加解和解密。
默认为false，开启之后，外部链接`<a>`标签被下面格式的`<span>`标签代替，将Base64加密的URL放在`data-url`，而真正的URL放在`title`，如下所示。

不开启时外部链接的HTML代码

```html
<a href="https://theme-next.org/docs/theme-settings/seo#ExtURL" target="_blank" rel="noopener">外部URL设置</a>
```

开启后的外部链接的HTML代码
```html
<span class="exturl" data-url="aHR0cHM6Ly90aGVtZS1uZXh0Lm9yZy9kb2NzL3RoZW1lLXNldHRpbmdzL3NlbyNFeHRVUkw=" 
title="https://theme-next.org/docs/theme-settings/seo#ExtURL">
	外部URL
	<i class="fa fa-external-link">
	</i>
</span>
```
**这有什么用呢？**
官方的说法是搜索引擎对`<a>`标签有很高的优先级，虽然我们可以设置[HTML`<a>`标签的`rel`属性](https://www.w3school.com.cn/html5/att_a_rel.asp)为`external` / `nofollow` / `noopener` / `noreferrer`等其他值来规定当前文档与被链接文档之间的关系，但是外部链接在我们的站点还是会被建立索引，也就是说还是会被爬虫爬取，但是爬虫爬取不了JavaScript，所以我们用JavaScript打开新的链接，像这种[反向链接（backlinks）](https://wiki.mbalib.com/wiki/%E5%8F%8D%E5%90%91%E9%93%BE%E6%8E%A5)就不会被监控到。
总而言之，就是不然搜索引擎搜索监控到这些外部链接，这里很有意思，官方给出了一个提示，说**放钓鱼链接是不被允许的**。

```yaml #next/_config.yml
exturl: false
```

#### [网站站长工具](https://theme-next.org/docs/theme-settings/seo#Webmaster-Tools) ####
官方说到了四个搜索引擎的站长工具，分别是谷歌、必应、Yandex（不知道中文名叫什么，是一个俄罗斯的搜索引擎）、百度，站长工具有什么用呢，官方说用来提交站点地图，当然这只是一部分的功能，还包括当前网站的状态是否正常，搜索分析的数据，网站地图的数据等等，还能投放广告在网站上等等在这里不一一列举了。

##### [谷歌站长工具](https://www.google.com/webmasters) #####
首先他需要验证所有权，有如下五种方式。

验证方法 				| 说明
------------------------| ----
HTML 文件				| 将 HTML 文件上传至您的网站
HTML 标记				| 向您网站的首页添加元标记 
Google Analytics（分析） | 使用您的 Google Analytics（分析）帐号
Google Tag Manager		| 使用您的 Google 跟踪代码管理器帐号
域名提供商				| 将 DNS 记录与 Google 关联

这里官方建议使用第二种验证方法。

> 1. 复制下面的元标记，并将其粘贴至您网站的首页中。它应该位于第一个 部分之前的 部分中。
```html
<meta name="google-site-verification" content="XXXXXXXXXXXXXXXXXX" />
```
> 2. 点击下面的验证按钮。
> 为了保持已完成验证的状态，请不要移除该元标记（即使是在成功通过验证后）。

以上是谷歌官方的提示，而我们只需要在将上面`content`后面的内容加到`next/_config.yml`的`google_site_verification`就好了。
```yaml #next/_config.yml
google_site_verification: XXXXXXXXXXXXXXXXXX	#填写验证所有权生成的`meta`标签的`content`属性的内容
```

到这里谷歌站长工具在NexT方面的配置就做好了，我们在谷歌站长工具中还需要做的是添加并提交站点地图，这里就不细说了，给一个链接吧。
[怎么使用google站长工具？](https://www.imhunk.com/how-to-use-google-webmaster/)

##### [必应站长工具](https://www.bing.com/webmaster) #####
这里就不细说了，与上面的谷歌站长工具配置类似。
[必应站长工具的帮助文档](https://www.bing.com/webmaster/help/webmaster-guidelines-30fba23a)

```yaml #next/_config.yml
bing_site_verification: XXXXXXXXXXXXXXXXXX	#填写验证所有权生成的`meta`标签的`content`属性的内容
```

##### [Yandex站长工具](https://webmaster.yandex.ru) #####
这个俄罗斯站长工具基本是不会用到了，网站都是俄语的，这里就象征性的过一下吧。
```yaml #next/_config.yml
yandex_site_verification: XXXXXXXXXXXXXXXXXX	#填写验证所有权生成的`meta`标签的`content`属性的内容
```

##### [百度站长工具](https://ziyuan.baidu.com/site) #####
百度站长工具可能会比较常用，但是，注册有点麻烦，我就略过了，还需要身份证照片和手持身份证照片，下面列出各个主体类型注册所需要的资料，然后附上[百度站长工具的使用帮助](https://ziyuan.baidu.com/college/courseinfo?id=267)，就象征性的过了吧。

主体类型 | 说明	  | 注册所需资料
------- | ------- | ----------
个人 	| 适合个人身份申请，如垂直领域的专家、意见领袖、评论家、自媒体人士及站长 |运营者手持身份证照片、运营者身份证 
媒体 	| 适合有媒体资质的网站、报刊杂志、电台、电视台等申请 | 组织机构代码证/营业执照、运营者手持身份证照片、运营者身份证
企业 	| 适合公司、分支机构类型的企业组织申请 | 营业执照、运营者手持身份证照片、运营者身份证
政府 	| 适合政府机构、事业单位、参公管理的社团组织等申请 | 组织机构代码证、运营者手持身份证照片、运营者身份证、公函（加盖公章）
其他组织 | 适合公共场馆、公益机构、学校、社团、民间组织等机构团体申请 |组织机构代码证、运营者手持身份证照片、运营者身份证

```yaml #next/_config.yml
baidu_site_verification: XXXXXXXXXXXXXXXXXX	#填写验证所有权生成的`meta`标签的`content`属性的内容
```
##### 百度推送 #####
NexT还支持一个**将博客文章URL自动推送给百度**的功能，具体是怎样的就不太清楚了，应该是有利于的搜索引擎优化的。默认配置是`false`，有需要的可以打开，配置方法如下。
```yaml #next/_config.yml
# Enable baidu push so that the blog will push the url to baidu automatically which is very helpful for SEO.
baidu_push: false
```

#### SEO相关文章 ####
搜索引擎优化这部分就到这里了，下面给出一些SEO相关的文章，有兴趣可以看一看。
[极客学院 - SEO教程](https://wiki.jikexueyuan.com/project/seo/)
[SEO 如何入门？ - 知乎](https://www.zhihu.com/question/19808544)
[搜索引擎优化（SEO） - 知乎](https://www.zhihu.com/topic/19554326)
[75个可执行的SEO小技巧（绝对管用）](https://ahrefs.com/blog/zh/seo-tips/)
[一个SEO做的比较好的个人博客may90.com](https://may90.com)

----------

### NexT主题设置（自定义页面） ###
**这一部分主要是自定义页面相关的设置。**
#### [自定义页面设置](https://theme-next.org/docs/theme-settings/custom-pages#Custom-Page-Support) ####
自定义页面设置分为三步，如下：
第一步，转到hexo的工程目录下，创建一个新的自定义页面，名称`custom_name`自定，在这里，执行下面的命令之后将会在`hexo/source`目录下生成一个自定义名称`custom_name`的文件夹，在文件夹中存有一个`index.md`文件。

```
$ cd your-hexo-site			#转到Hexo的工程目录下
$ hexo new page custom_name	#创建一个自定义页面
```

第二步，在`custom_name/index.md`文件中书写内容，头部信息，遵循**Front-matter**格式，Front-matter是在YAML和JSON文件最开头的块，用于配置和设置我们的书写，具体写法可以查看[链接](https://hexo.io/docs/front-matter.html)。
```yaml
---
title: Hello World
date: 2013/7/13 20:46:25
---
```
最后一步修改菜单信息，请查看之前的内容 [NexT基础配置-设置菜单显示内容](#%E8%AE%BE%E7%BD%AE%E8%8F%9C%E5%8D%95%E6%98%BE%E7%A4%BA%E5%86%85%E5%AE%B9) 进行配置。
```yaml #next/_config.yml
menu:
  home: / || home
  archives: /archives/ || archive
  about: /about/ || user
  custom_name: /custom_name/ || icon_name	#设置自定义页面的名称，路径，显示的图标
```

#### [添加标签页](https://theme-next.org/docs/theme-settings/custom-pages#Adding-%C2%ABTags%C2%BB-Page) ####
添加标签页与添加自定义页面类似，只不过，标签页属于NexT带有的页面，只需要配置即可，会自动生成内容。添加标签页的大体步骤分为三步，首先执行下面的命令添加新的页面。

```
$ cd your-hexo-site		#转到Hexo的工程目录下
$ hexo new page tags		#创建标签页面
```

执行完以上命令之后，同样他会在`hexo/source`目录下生成一个自定义名称`tags`的文件夹，在文件夹中存有一个`index.md`文件，文件内容如下：

```yaml #hexo/source/tags/index.md
---
title: Tags
date: 2014-12-22 12:39:04
type: "tags"		#设置`type`为`tags`，注意有英文引号
---
```

最后一步就是修改菜单信息，可以查看之前的内容 [NexT基础配置-设置菜单显示内容](#%E8%AE%BE%E7%BD%AE%E8%8F%9C%E5%8D%95%E6%98%BE%E7%A4%BA%E5%86%85%E5%AE%B9) 进行配置。
```yaml #next/_config.yml
menu:
  home: / || home
  archives: /archives/ || archive
  tags: /tags/ || tags
```

**那么如何为文章添加标签呢？**
依旧是遵循**Front-matter**格式，在**Markdown**文件中编辑头部信息，为当前书写的文章添加标签，有两种不同的写法。
第一种写法：使用`[]`将所有标签括起来，标签之间用`,`加**空格**隔开，需要注意的是`tags:`等等属性的冒号之后，也是需要有一个空格的。

```yaml
---
title: Tags Testing Article
tags: [Testing, Another Tag]
---
```

第二种写法：类似一种`Markdown`语法中的无序列表的写法。

```yaml
---
title: Tags Testing Article
tags:
  - Testing
  - Another Tag
---
```

#### [添加标签云](https://theme-next.org/docs/theme-settings/custom-pages#Tagcloud) ####
这里的标签云的设置是设置标签页中标签列表标签显示的格式（风格），具体配置项如下。
```yaml #next/_config.yml
tagcloud:
  enable: true		#启用标签云

  #这里的min，max是标签列表会根据标签被使用的次数而显示不同的字体大小的字体最小、最大值
  min: 12 		#这里是最小的标签字体大小，单位是`px`
  max: 30 		#这里是最大的标签字体大小，单位是`px`

  #这里的start，end是标签列表会根据标签被使用的次数而显示不同的颜色的颜色区间的开始和结束
  start: '#ccc'		#显示颜色区间的开始，支持十六进制、rgba、hsla、颜色关键词
  end: '#111'		#显示颜色区间的末端，支持十六进制、rgba、hsla、颜色关键词
	
  amount: 200 		#最多显示多少个标签
```

**使用Hexo标签云插件hexo-tag-cloud**
这个标签云相对酷一点吧，下面是官方效果图（其实也没有那么那么炫酷，包含中间那一块），可以到[我的标签页](/tags)看效果。
![hexo-tag-cloud官方效果图，如果未显示，可以去我的标签页](https://github.com/MikeCoder/hexo-tag-cloud/blob/master/img/example.png?raw=true)

附上[官方中文说明](https://github.com/MikeCoder/hexo-tag-cloud/blob/master/README.ZH.md)在这份官方的说明中，告诉我们将标签云放置在侧边栏，而不是给我们看到的效果，我们可以用他说的方式放在侧边栏，而在这里，我想用我的方法来设置，放在标签页面，并在配置文件中配置显示的高度和宽度（发现不设置高度宽度不行，显示会模糊，或者是显示区域太小）。

首先我们下载安装hexo-tag-cloud包，注意下载安装好之后，`hexo cl`清理一下项目，之后再生成。
```
$ npm install hexo-tag-cloud --save
```

接下来，修改代码，我们先创建一个文件夹`_myself`在`themes/next/layout/`目录下，然后在这个目录下创建`hexo-tag-cloud.swig`文件,内容如下，（这里的文件夹名称和文件名都可以自拟，但是需要与代码目录对应）。

```html
{%- if site.tags.length > 1 %}
  <script type="text/javascript" charset="utf-8" src="{{ url_for('/js/tagcloud.js') }}"></script>
  <script type="text/javascript" charset="utf-8" src="{{ url_for('/js/tagcanvas.js') }}"></script>
  <div class="widget-wrap">
    {#<h3 class="widget-title">标签云</h3>#}
    <div id="myCanvasContainer" class="widget tagcloud" style="margin-top:-50px">
      <canvas id="resCanvas" height="{{ theme.hexo_tag_cloud.height }}" width="{{ theme.hexo_tag_cloud.width }}">
        {{ list_tags() }}
      </canvas>
    </div>
  </div>
{%- endif %}
```
随后再`themes/next/layout/page.swig`文件中查找`tag-cloud`，在CSS class为`tag-cloud`的`div`中插入如下代码。

```js #next/layout/page.swig
{%- if theme.hexo_tag_cloud.enable %}
  {# 对应自建文件的目录 #}
  {% include '_myself/hexo-tag-cloud.swig' %} 
{%- endif %}
```


最后在`next/_config.yml`添加配置代码，如下。
```yaml next/_config.yml
hexo_tag_cloud:
  enable: true		#是否启用hexo-tag-cloud
  width: 375		#标签云区域的宽度
  height: 500		#标签云区域的高度
```

到这里，我们就完成了[hexo-tag-cloud插件](https://github.com/MikeCoder/hexo-tag-cloud)的配置可以启动本地服务器查看效果了，这里你可以自由的按照自己的想法去改改代码，尝试一下吧。

#### [添加分类页](https://theme-next.org/docs/theme-settings/custom-pages#Adding-%C2%ABCategories%C2%BB-Page) ####

这里添加分类页面与[添加标签页面](#%E6%B7%BB%E5%8A%A0%E6%A0%87%E7%AD%BE%E9%A1%B5)基本一致，只需要将命令和配置中的`tags`换成`categories`，这里不再赘述，但是在为文章添加分类的时候还是有所不同的。

**那么为文章添加分类和添加标签有什么不同呢？**
具体不同是标签与标签之间没有父与子的关系，都是同级别的，而分类用父与子的关系，一个分类可以被另一个分类包含。
从上面添加标签的第一种写法和第二种写法来讲，只能说明是一个等级向下递减的分类，也就是说以下两种写法都代表着**Sports是Baseball的父分类，文章则属于Baseball分类**。

```yaml
categories:			#这里Sports是Baseball的父分类，而文章属于Baseball分类
- Sports
- Baseball
```

```yaml
categories:			#这里Sports是Baseball的父分类，而文章属于Baseball分类
- [Sports, Baseball]
```

**那么文章属于多个分类如何配置呢？**
文章处于多个分类的配置方法如下，以下配置说明文章属于四个分类下，第一个是Sports分类下的Baseball类中，第二个则是MLB分类下的 American League分类， American League分类下的Boston Red Sox类下，其他的分类分析类似。

```yaml
categories:
- [Sports, Baseball]
- [MLB, American League, Boston Red Sox]
- [MLB, American League, New York Yankees]
- Rivalries
```

#### [添加谷歌日历页面](https://theme-next.org/docs/theme-settings/custom-pages#Adding-Google-Calendar-Page) ####
建议跳过这里吧，这部分接入谷歌日历，需要申请谷歌日历API，用的人也少，毕竟日历的用处没有那么大，下面还是大概说一下吧。
依旧是熟悉的第一步，创建页面。
```
$ cd your-hexo-site			#转到Hexo的工程目录下
$ hexo new page schedule			#创建日历页面
```

执行命令，生成在`hexo/source/schedule/index.md`文件，文件内容如下：

```yaml #hexo/source/schedule/index.md
---
title: schedule
date: 2014-12-22 12:39:04
---
```

随后修改菜单信息，可以查看之前的内容 [NexT基础配置-设置菜单显示内容](#%E8%AE%BE%E7%BD%AE%E8%8F%9C%E5%8D%95%E6%98%BE%E7%A4%BA%E5%86%85%E5%AE%B9) 进行配置。
```yaml #next/_config.yml
menu:
  home: / || home
  archives: /archives/ || archive
  schedule: /schedule/ || calendar
```

接下来就是[谷歌开发者](https://console.developers.google.com/flows/enableapi?apiid=calendar)申请谷歌日历API，获得日历`ID`和`API KEY`，最后配置next/_config.yml，具体配置如下。

```yaml #next/_config.yml
calendar:
  calendar_id: <required>		#日历ID
  api_key: <required>			#日历API KEY
  orderBy: startTime			
  offsetMax: 24
  offsetMin: 4
  timeZone:
  showDeleted: false
  singleEvents: true
  maxResults: 250
```

#### [与存档页面干杯](https://theme-next.org/docs/theme-settings/custom-pages#Cheers-Archive-Page) ####
这个标题有点怪怪的吧，一时不知道如何翻译这里，与存档页面干杯（**Cheers Archive Page**），暂且就这样说着吧，那么这个功能是做什么用的呢？
就是在开启这个功能之后，会在归档页面，显示总共有多少篇文章，还会叫我们继续加油，嘿嘿！比如：**嗯..! 目前共计 5 篇日志。 继续努力。**具体效果可以看 [这里](/archives/) ，**这项功能默认是开启的**。

```yaml #next/_config.yml
cheers: false
```

#### [自定义404页面](https://theme-next.org/docs/theme-settings/custom-pages#Custom-404-Page) ####
`hexo`可以配合`github pages`设置`404`页面，输入错误页面将跳转到`404`，在本地服务器上没有效果，但是部署到github上后就有效果了，好了开始吧。
步骤还是之前一样，先创建页面，但这次有所不同，这次在`hexo/source`文件夹下新建文件404.md,然后我们编辑404页面`source/404.md`内容，官方建议使用腾讯的公益404页面，寻找丢失儿童。

```js #source/404.md
---
title: 404
date: 1970-01-01 00:00:00
---
<script src="//qzonestyle.gtimg.cn/qzone/hybrid/app/404/search_children.js"
        charset="utf-8" homePageUrl="/" homePageName="Back to home">
</script>
```

你也可以自己写404页面或使用其他页面，官方这里还提供了另一个404 [页面样板](https://hexo-guide.readthedocs.io/zh_CN/latest/advanced/404%E9%A1%B5%E9%9D%A2.html)
到这里就差不多了，如果你想把这个公益404页面显示在菜单那就添加菜单配置吧，[NexT基础配置-设置菜单显示内容](#%E8%AE%BE%E7%BD%AE%E8%8F%9C%E5%8D%95%E6%98%BE%E7%A4%BA%E5%86%85%E5%AE%B9) 。

----------

### NexT主题设置（博客文章） ###
**这一部分主要是博客文章相关的设置。**
#### [页面滚动](https://theme-next.org/docs/theme-settings/posts#Page-Scroll) ####
设置`scroll_to_more`，点击**查看全文**直接跳转到`<!--more-->`的位置（这个位置就是显示`查看全文`后面的内容的位置）。
```yaml #next/_config.yml
scroll_to_more: true
```
设置`save_scroll`，让浏览器记住浏览到的问题，下次浏览就直接跳到这个位置。
```yaml #next/_config.yml
save_scroll: true
```
#### [前言文本Preamble Text](https://theme-next.org/docs/theme-settings/posts#Preamble-Text) ####
这里提供了三种方法来控制文章怎样显示在首页，这里可以设置

摘录说明`excerpt_description`

自动摘录`auto_excerpt`（这种方法不被推荐，官方建议使用`<!--more-->`代替），

显示阅读全文的按钮`read_more_btn`。

这里呢，基本不用设置，默认设置就好了，只要在Markdown文件中使用`<!--more-->`就好了，这也是官方推荐的方式。

```yaml #next/_config.yml
excerpt_description: true	#摘录说明

auto_excerpt:			#自动摘录（不推荐）
  enable: false
  length: 150

read_more_btn: true		#是否显示阅读全文的按钮
```

#### [发布元显示Post Meta Display](https://theme-next.org/docs/theme-settings/posts#Post-Meta-Display) ####
`Post Meta Display`，有点不知道怎么翻译这个，但是这个就是发布文章标题下的那些信息，包括

是否显示文字`item_text`

创建的时间`created_at`

更新的时间`updated_at`

分类信息`categories`等等。
```yaml #next/_config.yml
post_meta:
  item_text: true		#是否显示文字，即显示`发表于`、`更新于`、 `分类于`，不显示，则只显示图标
  created_at: true		#是否显示发表时间，`发表于`
  updated_at:		
    enable: true		#是否显示更新时间，`更新于`
    another_day: true		#只有更新时间和发表时间不在同一天才显示更新时间
  categories: true		#是否显示分类
```
	
#### [博客文章的字数统计](https://theme-next.org/docs/theme-settings/posts#Post-Wordcount) ####
需要下载安装[`hexo-symbols-count-time`](https://github.com/theme-next/hexo-symbols-count-time)包，下载完记得`hexo clean`一下。
```
npm install hexo-symbols-count-time --save
```
配置`hexo/_config.yml`，包括

显示文章字数`symbols`

估计阅读时间`time`

显示所有的文章的总字数在页面底部`total_symbols`

显示读完所有的文章的预计时间在页面底部`total_time`

统计数字除去代码块的字数`exclude_codeblock`。
```yaml #hexo/_config.yml
symbols_count_time:
  symbols: true			#是否在文章的Post Meta显示文章字数
  time: true			#是否在文章的Post Meta显示阅读完文章预计的时间
  total_symbols: true		#是否显示所有的字数统计
  total_time: true		#是否显示阅读元所有文章需要多久
  exclude_codeblock: false	#统计时是否除去代码块的字数
```

配置`next/_config.yml`，包括

设置文章字数统计和阅读时间预计在同一行还是隔行`separated_meta`

文章中显示文章字数统计和阅读时间预计的描述`item_text_post`

页面底部显示所有文章字数统计和阅读所有文章时间预计的描述`item_text_total`

平均字的长度，以char来计算的，默认为4，我们中文可以设置为2，`awl`（average Word Length）

平均每分钟读多少字，默认为275，人一般每分钟300字左右，可以不改默认值，`wpm`（average words per minute）。
```yaml #hexo/_config.yml
symbols_count_time:
  separated_meta: true		#是否与Post Meta Display分开成两行，true则分开为两行，false则再一行
  item_text_post: true		#文章的字数统计是否显示文字，不显示则只有图标
  item_text_total: false	#总共的字数统计是否显示文字，不显示则只有图标
  awl: 2			#awl（average Word Length）平均字的长度（以字符为单位），默认为4
  wpm: 275			#wpm（average words per minute）平均每分钟读多少字，默认为275
```

#### [标签图标设置](https://theme-next.org/docs/theme-settings/posts#Tag-Icon) ####
将标签前面默认的`#`改为图标，设置方法：修改`next/_config.yml`的`tag_icon`标签为`true`。
```yaml #next/_config.yml
tag_icon: true
```

#### [微信订阅](https://theme-next.org/docs/theme-settings/posts#WeChat-Subscribing) ####
这里配置微信订阅二维码，在每一篇博客文章后面都会有这个二维码。
我们在Hexo工程目录的`source`文件夹新建`uploads`文件夹，并把微信订阅二维码放进这个文件夹，然后在`next/_config.yml`修改配置。
```yaml #next/_config.yml
wechat_subscriber:
  enable: true
  qcode: /uploads/wechat-qcode.jpg			#二维码图片的存放地址
  description: 欢迎关注公众号XXX 			#文章最后公众号二维码下方的话
```
#### [奖赏（打赏）Reward (Donate)](https://theme-next.org/docs/theme-settings/posts#Reward-Donate) ####
将微信、支付宝、比特币、银行等其他收钱二维码放到NexT主题目录下的`source/images`文件夹，并进行配置，这些二维码也会显示在每篇文章最后。
```yaml #next/_config.yml
reward_settings:
  enable: true				#开启打赏功能
  animation: false			#是否开启动画，开启后，鼠标放在二维码上面，二维码下面的字会动
  #comment: Donate comment here		#打赏按钮上面显示的话，比如可以填：坚持原创技术分享，您的支持将鼓励我继续创作！

reward:					#各个收钱二维码的图片存放的地址
  wechatpay: /images/wechatpay.png
  alipay: /images/alipay.png
  bitcoin: /images/bitcoin.png
```
#### [推荐相关文章](https://theme-next.org/docs/theme-settings/posts) ####
这里需要下载安装`hexo-related-popular-posts`包（附上[GitHub仓库](https://github.com/tea3/hexo-related-popular-posts)），下载完记得`hexo clean`一下。
```
npm install hexo-related-popular-posts --save
```
推荐的文章的部分将会显示在文章底部，

设置标题，默认会显示相关文章，可以自己设置`title`

设置是否显示在首页`display_in_home`

设置显示相关文章的最大数量`MaxCount`

设置热帖与相关帖所占的比例【热帖/相关帖】，比如`PPMixingRate=1.0`则表示放一篇热帖就放一篇相关的文章，两者1:1，相关帖是根据标签来的，但是热帖不知道是怎么评判的，`PPMixingRate`表示热帖（popular posts）的混合率

在相关文章板块是否显示文章发布的时间`isDate`

在相关文章板块是否显示文章的图片`isImage`

在相关文章板块是否显示摘要`isExcerpt`

```yaml #next/_config.yml
related_posts:
  enable: true			#是否开启相关文章推荐，推荐的文章的将会显示在文章底部		
  title: 			#标题，默认会显示`相关文章`，可以自己设置
  display_in_home: false	#是否显示在首页
  params:
    maxCount: 5			#显示相关文章的最大数量
    #PPMixingRate: 0.0		#热帖与相关帖所占的比例
    isDate: true		#显示文章发布的时间
    isImage: true		#是否显示文章的图片
    isExcerpt: true		#是否显示摘要
```
**小插曲**
在配置相关文章的时候，刚刚开始按照NexT官方文档的配置来弄，官方没有要求下载包，死活都不行，找了了一下`hexo-related-popular-posts`包仓库下的REAMDE，最后找到了[Issue](https://github.com/tea3/hexo-related-popular-posts/issues/4#issuecomment-320916516)，这篇帖子说到要更新一下包，添加部分代码，我更新完后，我去找了一下源码，发现这部分代码是有的不需要加了（好像这个包的仓库好久没更新了的样子），这时迫不及待的运行起来，没有执行清理（`hexo clean`），报错了，不过清理了就好。

#### [博客文章编辑](https://theme-next.org/docs/theme-settings/posts#Post-Edit) ####
这里官方文档说，开启这项设置之后，用户可以在GitHub快速的浏览和编辑源代码，还提供了两种URL链接形式选择，即通过链接就可以快速对源代码进行浏览和编辑操作，这里我试了一下，还是GitHub SSH秘钥的问题（见前一篇博客），不多说了，小伙伴们有兴趣，看下官方文档配置一下。
提醒一下，这里是配置`hexo/_config.yml`，然后这项配置依赖于[hexo-deployer-git](https://github.com/hexojs/hexo-deployer-git)包。
```yaml #hexo/_config.yml
post_edit:
  enable: false
  url: https://github.com/user-name/repo-name/tree/branch-name/subdirectory-name  # Link for view source
  #url: https://github.com/user-name/repo-name/edit/branch-name/subdirectory-name # Link for fork & edit
```

下面是官方文档对`url`的描述。

> You should create a source repository of your post files. The url setting depends on the source project in github.
>
>- For site repository
>	- Link for view source: url: https://github.com/.../tree/master/source/_posts/
>	- Link for fork & edit: url: https://github.com/.../edit/master/source/_posts/
>- For post repository
>	- Link for view source: url: https://github.com/.../_posts/tree/master/
>	- Link for fork & edit: url: https://github.com/.../_posts/edit/master/

----------

### NexT主题设置（侧边栏） ###
**这一部分主要是侧边栏相关的设置。**
#### [侧边栏风格](https://theme-next.org/docs/theme-settings/sidebar#Sidebar-Style) ####
在`sidebar`中，`position`可以设置侧边栏的位置（在NexT 7.2以下的版本中只支持`Pisces`与`Gemini`风格）。

`width`设置侧边栏的宽度，`Muse`与`Mist`风格中为默认320像素，`Pisces`与`Gemini`风格中默认为240像素。

`display`设置侧边栏的显示方式，有四种显示方式，默认方式为`post`，在文章中自动拓展，`always`在所有页面都紫都、`hide`只有当点击了侧边栏切换图标时，才拓展显示，`remove`完全不显示侧边栏。 

`offset`设置侧边栏与菜单栏的隔多少像素（只支持`Pisces`与`Gemini`风格），默认为12个像素。

`onmobile`设置在移动设备上是否显示侧边栏（只支持`Muse`与`Mist`风格）。

`dimmer`设置单击页面的任何空白部分以关闭侧栏（只支持NexT 7.0版本以上的`Muse`与`Mist`风格）。
```yaml #next/_config.yml
sidebar:
  #在NexT 7.2以下的版本中只支持`Pisces`与`Gemini`风格
  position: left		#设置侧边栏是显示在左边还是右边
  #position: right

  #width: 300			#设置侧边栏的宽度，默认`Muse`与`Mist`为320像素，`Pisces`与`Gemini`为240像素

  display: post			#设置侧边栏的显示方式，四种显示方式包括`post`、`always`、`hide`、`remove`

  #只支持`Pisces`与`Gemini`风格
  offset: 12			#设置侧边栏与菜单栏的隔多少像素

  #只支持`Muse`与`Mist`风格
  onmobile: false		#设置在移动设备上是否显示侧边栏
  
  #只支持NexT 7.0版本以上的`Muse`与`Mist`风格
  dimmer: true			#设置单击页面的任何空白部分以关闭侧栏
```

#### [侧边栏站点状态](https://theme-next.org/docs/theme-settings/sidebar#Sidebar-Site-State) ####
设置在侧边栏站点概况的头像下是否显示帖子、分类、标签及其计数，默认为显示。
```yaml #next/_config.yml
site_state: true
```
#### [侧边栏社交链接](https://theme-next.org/docs/theme-settings/sidebar#Sidebar-Social-Links) ####
这是设置社交链接的形式和[设置菜单显示内容](#%E8%AE%BE%E7%BD%AE%E8%8F%9C%E5%8D%95%E6%98%BE%E7%A4%BA%E5%86%85%E5%AE%B9)的形式是一样的，`Key: /link/ || icon`，在这里不再多说，社交链接的图标设置的描述，请看下方代码。

```yaml #next/_config.yml
social:
  GitHub: https://github.com/BingqiangZhou || github
  E-Mail: mailto:bingqiangzhou7@gmail.com || envelope
  WeChat Subscriber: https://open.weixin.qq.com/qr/code?username=BingqiangZhou || wechat
  Website: https://bingqiangzhou.cn || heartbeat
  #Weibo: https://weibo.com/yourname || weibo
  #Google: https://plus.google.com/yourname || google
  #Twitter: https://twitter.com/yourname || twitter
  #FB Page: https://www.facebook.com/yourname || facebook
  #VK Group: https://vk.com/yourname || vk
  #StackOverflow: https://stackoverflow.com/yourname || stack-overflow
  #YouTube: https://youtube.com/yourname || youtube
  #Instagram: https://instagram.com/yourname || instagram
  #Skype: skype:yourname?call|chat || skype

social_icons:
  enable: true			#是否启用社交链接的图标
  icons_only: false		#是否只显示图标
  transition: false		#设置图标是否带过渡动画（这里不清楚是什么动画效果）
```

#### [侧边栏Blogrolls](https://theme-next.org/docs/theme-settings/sidebar#Sidebar-Social-Links) ####
首先第一个问题[什么是Sidebar Blogrolls呢？](https://cn.go-travels.com/51686-what-is-blogroll-3476580-3264496)

> blogroll是博客上的链接列表，通常位于侧边栏上以便于访问，博客作者喜欢并希望分享这些链接。
> 
> 博主可能会有一篇博客文章来帮助宣传他们朋友的博客，或者为他们的读者提供有关特定利基的更多资源。
> 
> 一些博主将他们的博客分为几类。例如，一位写博客的博客可以将他的博客文章分成几类，用于链接到他撰写的其他博客，其他关于汽车的博客，以及其他关于不相关主题的博客。
> 
> 可以根据每个博主的个人偏好设置博客，并且可以随时更新。

`links`设置自己喜欢的连接，`title`，可以是显示在链接列表的名称，可以任意设置，如`你好：https://bingqiangzhou.cn`

`links_icon`设置链接列表的图标，对应于[Font Awesome](https://fontawesome.com/icons?d=gallery&m=free)库的图标去设置

`links_title`设置链接列表的名称（标题）

`links_layout`设置链接列表显示的布局，有两种布局`block`，每个链接占一行，`inline`，从左到右流式布局

```yaml #next/_config.yml
links_icon: link			#设置链接列表的图标
links_title: Links			#设置链接列表的名称（标题）
links_layout: block 			#设置链接列表显示的布局，有两种布局`block`、`inline`
links:					#设置自己喜欢的连接
  Title: https://bingqiangzhou.cn	#`title`，可以是显示在链接列表的名称，可以任意设置
```
#### [侧边栏TOC](https://theme-next.org/docs/theme-settings/sidebar#Sidebar-TOC) ####
文章目录`Table Of Contents (TOC)`

`number`是否显示文章目录的标号，如：`1.1，1.2.3`等等

`wrap`，设置为`true`，则如果标题一行显示不下，显示到下一行，为`false`，则省略为省略号`……`

`expand_all`是否展开全部目录

`max_depth`设置生成文章目录的最大深度，可以理解为标题级别，默认为6，也可以在文章中用**Front-matter**属性`toc_max_depth`设置

```yaml #next/_config.yml
toc:
  enable: true		
  number: true			#是否显示文章目录的标号
  wrap: false			#`true`，则如果标题一行显示不下，显示到下一行，为`false`，则省略为省略号`……`
  expand_all: false		#是否展开全部目录
  max_depth: 6			#设置生成文章目录的最大深度，可以理解为标题级别，默认为6
```

#### [回到顶部](https://theme-next.org/docs/theme-settings/sidebar#Back-To-Top) ####
回到顶部（`Back To Top`）按钮

`sidebar`是否在侧边栏开始回到顶部按钮，不开启，只要`enable`是`true`则会显示一个回到顶部按钮在右下角，而开启，则不会显示在右下角，而是显示在侧边栏

`scrollpercent`是否显示下滑到的位置占全文的高度的百分比

```yaml #next/_config.yml
back2top:
  enable: true
  sidebar: false		#是否在侧边栏开始回到顶部按钮
  scrollpercent: false		#是否显示下滑到的位置占全文的高度的百分比
```

**小插曲**
这里我改了回到顶部按钮的前景色和背景色，我找了一下`back2top`相关的代码，在`themes/next/layout/_layout.swig`找到了，看了代码这里是显示在右下角的回到顶部按钮，在这里`themes/next/layout/_macro/sidebar.swig`我也找到了，这里是侧边栏的回到顶部菜单，这里我把对应的`div`背景色和前景色改了，加了`style="color:{{ theme.back2top.color }}; background-color:{{ theme.back2top.bgcolor }};"`，代码如下：
```html #themes/next/layout/_macro/sidebar.swig
{%- if theme.back2top.enable and theme.back2top.sidebar %}
        <div class="back-to-top motion-element" 
		style="color:{{ theme.back2top.color }}; background-color:{{ theme.back2top.bgcolor }};">
          <i class="fa fa-arrow-up"></i>
          {%- if theme.back2top.scrollpercent %}
            <span id="scrollpercent"><span>0</span>%</span>
          {%- endif %}
        </div>
      {%- endif %}
```
然后在`next/_config.yml`配置前景色`color`和背景色`bgcolor`。
```yaml next/_config.yml
back2top:
  bgcolor: "#eee"		#回到顶部背景色
  color: "#fc6423"		#回到顶部前景色
```

这里算是弄好了，带着好奇，又去找源码中的设置颜色的部分，用开发者工具找了一些带有颜色的`class`，比如`feed-link`、`.post-toc .nav .active > a`，都存在于`main.css`,很显然，这个`main.css`是生成的，我开始拿着这些`class`去找，没有找到多少端倪，随后我开始一个文件一个文件看，最后找到了`themes/next/source/css/_variables/Pisces.styl`，也就是在`themes/next/source/css/_variables/`里存着对应风格的一些全局的`style`代码，包括了头部、侧边栏、边框、组件等等，回到顶部按钮的风格也在这里设置，这里我没有改，去看了`styl`文件对应的`stylus`（一个CSS的预处理框架）的文档，大概了解了一些语法，附上[官方文档](http://stylus-lang.com/docs/)，一个博主做的[stylus的中文教程](https://www.zhangxinxu.com/jq/stylus/)。

----------

### NexT主题设置（第三方服务） ###
**这一部分主要是第三方服务相关的设置。**
这一部分不准备太细讲了，第三方服务还是比较多。
#### [评论系统](https://theme-next.org/docs/third-party-services/#Comment-Systems) ####
- [Disqus](https://theme-next.org/docs/third-party-services/comments-and-widgets#Disqus)，我看许多博主都是用的`Disqus`，但是它用`Twitter`、`Fackbook`、`Gmail`快捷登录，对国内可能不太友好。
- [DisqusJS](https://theme-next.org/docs/third-party-services/comments-and-widgets#DisqusJS)
- [Facebook Comments](https://theme-next.org/docs/third-party-services/comments-and-widgets#Facebook-Comments)
- [VKontakte Comments and Likes](https://theme-next.org/docs/third-party-services/comments-and-widgets#VKontakte-Comments-and-Likes)
- [LiveRe](https://theme-next.org/docs/third-party-services/comments-and-widgets#LiveRe)
- [Gitalk](https://theme-next.org/docs/third-party-services/comments-and-widgets#Gitalk)，我个人比较推荐Gitalk，就因为它可以用GitHub账号快捷登录，当然也只支持GitHub。
- [Valine (China)](https://theme-next.org/docs/third-party-services/comments-and-widgets#Valine)，中国的评论系统，虽然没听过，[官网](https://leancloud.cn/)，[控制台](https://leancloud.cn/dashboard/login.html#/signin)。
- [Changyan (China)](https://theme-next.org/docs/third-party-services/comments-and-widgets#Changyan)，中国的，依然是没听过，这个比上一个配置起来简单点，[官网](https://changyan.kuaizhan.com/)。
- [Widgetpack Rating](https://theme-next.org/docs/third-party-services/comments-and-widgets#Widgetpack-Rating)

**`Gitalk`的配置过程** [请看这里](https://hexo-guide.readthedocs.io/zh_CN/latest/third-service/[Gitalk]%E8%AF%84%E8%AE%BA%E7%B3%BB%E7%BB%9F.html)

注意，我们需要将github.io库设置为公开仓库（`public`），不然会提示`Error Not Found`。这也是我踩过的一个坑，当然也可以重新建一个公开库专门用来放评论，这里的评论实质上是接入了仓库的`issue`，在这里评论就评论到了`issue`的留言发帖。

#### [统计与分析](https://theme-next.org/docs/third-party-services/#Statistics-and-Analytics) ####

- [Google Analytics](https://theme-next.org/docs/third-party-services/statistics-and-analytics#Google-Analytics) 谷歌分析
- [Azure Application Insights](https://theme-next.org/docs/third-party-services/statistics-and-analytics#Azure-Application-Insights) 
- [Baidu Analytics (China)](https://theme-next.org/docs/third-party-services/statistics-and-analytics#Baidu-Analytics-China) 百度分析
- [Tencent Analytics (China)](https://theme-next.org/docs/third-party-services/statistics-and-analytics#Tencent-Analytics-China)	腾讯分析
- [CNZZ Analytics (China)](https://theme-next.org/docs/third-party-services/statistics-and-analytics#CNZZ-Analytics-China)
- [Tencent Mobile Analytics (China)](https://theme-next.org/docs/third-party-services/statistics-and-analytics#Tencent-Mobile-Analytics-China) 腾讯手机分析
- [LeanCloud (China)](https://theme-next.org/docs/third-party-services/statistics-and-analytics#LeanCloud-China)	
- [Busuanzi Counting](https://theme-next.org/docs/third-party-services/statistics-and-analytics#Busuanzi-Counting-China)
- [Firebase](https://theme-next.org/docs/third-party-services/statistics-and-analytics#Firebase)

这部分呢，应该是统计访问量等等，我没有尝试，这里不做过多描述了，各位自己尝试吧。

#### [内容分享服务](https://theme-next.org/docs/third-party-services/#Content-Sharing-Services) ####
- [AddThis](https://theme-next.org/docs/third-party-services/content-sharing-services#AddThis)
- [Likely](https://theme-next.org/docs/third-party-services/content-sharing-services#Likely)
- [Need More Share](https://theme-next.org/docs/third-party-services/content-sharing-services#Need-More-Share)

这部分呢，就是给读者一个使用社交账号（主要支持`Google/Facebook/Twitter`）分享的快捷按钮，我没有尝试，这里也不做过多描述了，各位自己尝试吧。

#### [搜索服务](https://theme-next.org/docs/third-party-services/#Search-Services) ####
- [Algolia Search](https://theme-next.org/docs/third-party-services/search-services#Algolia-Search)
- [Local Search](https://theme-next.org/docs/third-party-services/search-services#Local-Search) 这里我配置了本地搜索
- [Swiftype](https://theme-next.org/docs/third-party-services/search-services#Swiftype-Search)

[Algolia网站搜索配置教程](https://hexo-guide.readthedocs.io/zh_CN/latest/third-service/[Algolia]%E7%BD%91%E7%AB%99%E6%90%9C%E7%B4%A2.html)

**本地搜索的配置过程**
第一步，安装[`hexo-generator-searchdb`包](https://github.com/theme-next/hexo-generator-searchdb)
```
$ npm install hexo-generator-searchdb --save
```
第二步，添加配置到`hexo/_config.yml`
```yaml #hexo/_config.yml
search:
  path: search.xml		#文件路径，也可以设置拓展名为`.json`
  field: post			#搜索的范围，有以下三种选择
				#`post` 搜索只在博客文章部分(默认)
				#`page`搜索在博客文章的页面的全部
				#`all`搜索博客中所有页面 

  format: html			#搜索页面的内容的形式，有以下四种选择
				#`html` html字符串
				#`raw ` markdown文本
				#`excerpt` 摘要
				#`more` 官方的说明`act as you think`，随心所欲

  limit: 10000			#定义最多建立索引的文章数
```

第三步，配置`next/_config.yml`

```yaml #next/_config.yml
local_search:
  enable: true
  trigger: auto		#设置为`auto`，在输入时便实时搜索，设置为`manual`，则点击搜索图标或者按下回车建再搜索
  top_n_per_article: 1	#显示搜索到的文章中到的几个结果，设置为-1位显示所有
  unescape: false	#不将HTML字符串解析成可读的字符串
  preload: false	#当页面加载时，刷新搜索数据
```

#### [拓展库](https://theme-next.org/docs/third-party-services/#External-Libraries) ####
- [PJAX](https://theme-next.org/docs/third-party-services/chat-services#Tidio) 一个`JavaScript`库使用`AJAX`和`pushState()`带来一个更好的浏览体验
- [Fancybox](https://theme-next.org/docs/third-party-services/external-libraries#Fancybox) 实现点击图片显示原先大小功能，还可以进一步放大，还可以查看全部图片，视频等等，配置还是相对简单的，[配置方法](https://hexo-guide.readthedocs.io/zh_CN/latest/third-service/[fancybox]%E5%9B%BE%E7%89%87%E6%98%BE%E7%A4%BA.html#)。
- [MediumZoom](https://theme-next.org/docs/third-party-services/external-libraries#MediumZoom) 缩放图片，不知道是什么效果，不能同时使用`MediumZoom`与`Fancybox`。
- [Lazyload](https://theme-next.org/docs/third-party-services/external-libraries#Lazyload) 延迟加载图片，当读者没有阅读到图片的位置的时候，不会加载该图片。
- [Pangu Autospace](https://theme-next.org/docs/third-party-services/external-libraries#Pangu-Autospace) 自动在中文字和半形的英文、数字、符号之间插入空白。
- [Quicklink](https://theme-next.org/docs/third-party-services/external-libraries#Quicklink) 更快的子序列页面加载，通过空闲时间预取链接内容，就是提前获取页面内链接的数据在空闲的时候，从而实现更快的浏览速度。
- [Bookmark](https://theme-next.org/docs/third-party-services/external-libraries#Bookmark) 记录读者阅读到的位置，下次再次阅读时，跳到这个位置，可以点击图标操作，也可以自动记录，这个可以设置[页面滚动`save_scroll`](#%E9%A1%B5%E9%9D%A2%E6%BB%9A%E5%8A%A8)属性代替。
- [Reading Progress](https://theme-next.org/docs/third-party-services/external-libraries#Reading-Progress) 在页面最上端有一个阅读的进度条。
- [Progress bar](https://theme-next.org/docs/third-party-services/external-libraries#Progress-bar) 顶部一个加载的进度条。
- [Backgroud JS](https://theme-next.org/docs/third-party-services/external-libraries#Backgroud-JS) 背景相关的JavaScript库有三个，[JavaScript 3D](https://theme-next.org/docs/third-party-services/external-libraries#JavaScript-3D-library)库（轻量级的3D库，提供了`<canvas>`、`<svg>`、`CSS3D`、`WebGL`渲染器），[Canvas Nest](https://theme-next.org/docs/third-party-services/external-libraries#Canvas-Nest)，提供了一个在画布上的背景动画，[预览背景图](https://github.com/hustcc/canvas-nest.js/blob/master/screenshot.png?raw=true)，[Canvas Ribbon](https://theme-next.org/docs/third-party-services/external-libraries#Canvas-Ribbon) 也是一个在画布上的背景动画，鼠标每次点击，随机生成彩带背景，[效果展示](https://zproo.github.io/showcase/project/canvas-ribbon/)。

#### [数学方程](https://theme-next.org/docs/third-party-services/#Math-Equations) ####

这项服务是用来渲染我们书写的数学公式等，设置相对还是简单的，暂时还是没有要使用到，没有配置，这里不多讲了，[官方配置链接](https://theme-next.org/docs/third-party-services/math-equations)。

#### [在线聊天](https://theme-next.org/docs/third-party-services/#Chat-Services) ####
提供在线聊天服务，这个功能对于感觉博客还是没有必要的，这里不多讲了，[配置Chatra](https://theme-next.org/docs/third-party-services/chat-services#Chatra)、[配置Tidio](https://theme-next.org/docs/third-party-services/chat-services#Tidio)。

----------

### [NexT主题设置（常见问题）](https://theme-next.org/docs/faqs) ###
**这一部分主要是一些常见的问题的解决方法和一些需要注意的地方。**

#### [怎么设置阅读全文《Read More》？](https://theme-next.org/docs/faqs#How-to-Set-%C2%ABRead-More%C2%BB) ####
有三种方法：

- 在文章（Markdown文件）中设置`<!--more-->`，**建议用第一种**。
- 在文章头部添加`description`，遵循[Front-matter](https://hexo.io/docs/front-matter)格式。
- 通过配置`next/_config.yml`中的`auto_excerpt`变量，自动生成总结。

```yaml #next/_config.yml
auto_excerpt:
  enable: true
  length: 150
```

#### [如何改变字体？](https://theme-next.org/docs/faqs#How-to-Change-Fonts) ####
[NexT自定义字体的配置方法](#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E4%BD%93)，如果这还不能得到满足，需要更加个性化，可以去`themes/next/source/css/_variables/base.styl`找到`font-family-*`去修改字体，比如`font-family-base`，需要注意的是修改的字体是否可以成功应用。

#### [如何改变显示内容的宽度？](https://theme-next.org/docs/faqs#How-to-Change-Content-Width) ####
首先，看一下NexT内容宽度的策略：
- 当屏幕宽度小于1200px时，内容宽度为700px
- 当屏幕宽度大于等于1200px时，内容宽度为800px
- 当屏幕宽度大于等于1600px时，内容宽度为900px
- 在手机或者平板设备上的时候，使用响应式宽度。

需要修改可以在可以去`themes/next/source/css/_variables/base.styl`找到以下代码进行修改，

```yaml #themes/next/source/css/_variables/base.styl
$content-desktop         = 700px
$content-desktop-large   = 800px
$content-desktop-largest = 900px
```

可以修改成为百分比制的如`90%`，也可以以`em`为单位（建议使用`50em，55em, 66em`），

#### [标签或者分类的数量不对，如何处理？](https://theme-next.org/docs/faqs#Wrong-Number-of-Tags-Categories) ####
- 执行`hexo clean`（简写为`hexo cl`）清理缓存。
- 执行`hexo generate`（简写为`hexo g`）重新生成文件。

很多问题都可以用清理缓存的方式解决，执行以上完命令之后可以执行`hexo server`（简写为`hexo s`）启动本地服务器查看效果，如果还有问题，那大概是配置有问题，这就需要查看报错信息然后再处理了。

#### [页面如何去掉评论系统？](https://theme-next.org/docs/faqs#How-to-Disable-Comments-on-Page) ####
在页面对应的`Markdown`文件中，设置`comments: false`，如：

```yaml #your-post.md
---
title: All tags
type: "tags"
comments: false
---
```

[如何设置每一页显示多少篇文章？](https://theme-next.org/docs/faqs#How-to-Set-Number-of-Articles-in-Each-Page)
```yaml #hexo/_config.yml
index_generator:
  per_page: 5

archive_generator:
  per_page: 20
  yearly: true
  monthly: true

tag_generator:
  per_page: 10
```
注意这里是`Hexo`站点的`_config.yml`。

[如何优化NexT主题？](https://theme-next.org/docs/faqs#How-to-Optimize-NexT-Theme)

- 可以去[Hexo插件库](https://hexo.io/plugins/) 下载插件。
- 也可以在[NexT组织的GitHub仓库](https://github.com/theme-next) 下载插件和模块。

----------

### [NexT主题设置（故障排除）](https://theme-next.org/docs/troubleshooting) ###

#### [注意保持缩进](https://theme-next.org/docs/troubleshooting#Keep-up-indentation) ####
在编辑任何`YAML`配置文件，都需要注意缩进，`Hexo`与`NexT`使用与父变量换行并缩进两个空格来表示，如：
```yaml
theme_config:
  #scheme: Muse
  #scheme: Mist
  #scheme: Pisces
  scheme: Gemini
```

#### [注意标签中的反引号代码块](https://theme-next.org/docs/troubleshooting#Backtick-Code-Block-in-Tags) ####
**不推荐**使用[反引号代码块](https://hexo.io/docs/tag-plugins#Backtick-Code-Block)。

建议使用codeblock写法，看[这里](https://hexo.io/docs/tag-plugins#Code-Block)的格式吧。

也可以使用`<code>`标签与`<pre>`标签，但是缺点是不会高亮显示，如下所示。

- `<code>`代码块

<code>
print("hello,world")
</code>

- `<pre>`代码块

<pre>
print("hello,world")
</pre>

#### [设置了网站图标但是无效](https://theme-next.org/docs/troubleshooting#Favicon-Set-but-Doesn-39-t-Work-Need-to-redocs) ####
将网站图标放置到`hexo/source`文件夹下，设置`next/_config.yml`，如下：

```yaml #next/_config.yml
favicon: 
  small: favicon.ico
  medium: favicon.ico
```

执行`hexo clean`（简写为`hexo cl`）清理缓存，再执行`hexo generate`（简写为`hexo g`）重新生成文件，最后执行`hexo server`（简写为`hexo s`）启动本地服务器查看是否可以正确显示，也可以直接访问`http://localhost:4000/favicon.ico`，看是否可以正确访问，如果使用jpg或者png，替换设置与访问链接中的`favicon.ico`即可。

#### [找不到模块XXX](https://theme-next.org/docs/troubleshooting#Cannot-Find-Module-XXX) ####
如果出现找不到模块的情况，请删除对应`node_modules`的文件夹，在重新安装`npm install node_modules --save`，注意加上后面的`--save`。

----------

### NexT主题设置（暂未涉及到） ###
**这一部分主要是大概的说一下标签插件、高级设置以及如何从NexT 5.X升级到6.X到7.x**
#### [标签插件](https://theme-next.org/docs/tag-plugins/) ####
标签插件是一种方式使Hexo支持特殊的内容格式，举一个例子，在Markdown在文本编辑中，图片不能自定义大小，但是我们可以借助标签插件来解决它，Hexo做了许多标签可以帮助到我们，请看[链接](https://hexo.io/docs/tag-plugins)，而NexT也为我们提供了一些，请看[链接](https://theme-next.org/docs/tag-plugins/)，甚至我们可以[自定义标签插件](https://hexo.io/docs/plugins)。

这个标签插件本质就是设置一个格式，按照这个格式来写Markdown就可以被解析，而来设置这个格式的代码把他叫做标签插件，这个主要的用出就是拓展了Markdown的语法，本来Markdown的语法解析后的功能是比较简单的，而使用标签插件，而变得更加灵活，更加易用，就像上面说的Markdown不能设置图片大小，通过标签插件就可以。

最后想说的一点就是这里的标签插件和其他Rainbow Safair插件等等其他插件其实性质是一样的，只是这里的插件面向标签，其他的插件可能面向背景呀，评论系统呀等等。

#### [高级设置](https://theme-next.org/docs/advanced-settings) ####
##### [CDN设置](https://theme-next.org/docs/advanced-settings#Third-party-JS-Libraries) #####
一些第三方库可以使用CDN（Content Delivery Network，即内容分发网络）来加速，NexT官方提供了两个CDN服务商[jsDelivr](https://www.jsdelivr.com/)和[CDNJS](https://cdnjs.com/)，jsDelivr是NexT官方默认的CDN服务商，它在中国ICP备案了，对中国网络的访问也是极好的，但是CDNJS对中国网络访问的支持可能不太行了，当然我们可以使用其他的CDN服务商，配置方法：`libname: CDN URL`，在`next/_config.yml`中查找`vendors`随后进行配置。

##### [依赖注入](https://theme-next.org/docs/advanced-settings#Injects) #####
这里是把自己写的页面、JavaScript脚本、CSS样式注入到Hexo，不说太多，附上NexT对这部分解释的[链接](https://theme-next.org/docs/advanced-settings#Injects)，如果说我们要开发Hexo插件的话，我想这也会是重要的一步，附上[Hexo官方开发插件的教程](https://hexo.io/docs/plugins.html#Plugin)。

----------

### NexT主题设置（相关链接） ###
**这一部分主要是一些进一步了解Hexo、NexT或者GitHub Pages可能会用到上的参考链接。**
[Hexo指南](https://hexo-guide.readthedocs.io/zh_CN/latest/index.html#)，这份文档特别好，基本都是精华，没有那么多没有用的设置，简洁，说来惭愧，自己写成这个样子，这份文档呢，也是从Node.js到Hexo到NexT，最后甚至讲了发布到腾讯云上，虽然那些都是简单的内容，但对入门的同学来说可能是极好的，另外一篇特别好的比较全的博客，[链接](https://blog.csdn.net/muzilanlan/article/details/81542917)。

[Markdown入门文档](http://xianbai.me/learn-md/index.html) 发文章肯定会要用到的，特别是对于不太熟悉Markdown文档语法的同学来说。

[stylus官方文档](http://stylus-lang.com/docs/) stylus默认使用`.styl`作为文件拓展名，是一个CSS的预处理框架，让CSS增加可编程的的特性，如果需要自己开发Hexo或者NexT插件可能会涉及的到。
[swig官方文档](http://node-swig.github.io/swig-templates/docs/) next采用的模板引擎是swig，swig是node.js中一个优秀简洁的模板引擎，因而如果需要自己开发Hexo或者NexT插件可能会涉及的到，而且看NexT源代码是可能一些语法也能用的上，再附上一篇[简单的语法介绍](https://www.jianshu.com/p/c5d333e6353c)

希望自己的博客能被搜索到，排名靠前一点,搜索引擎优化SEO是要用上的，放几个我觉得比较不错的链接吧，[极客学院 - SEO教程](https://wiki.jikexueyuan.com/project/seo/) [SEO 如何入门？ - 知乎](https://www.zhihu.com/question/19808544) [搜索引擎优化（SEO） - 知乎](https://www.zhihu.com/topic/19554326) [75个可执行的SEO小技巧（绝对管用）](https://ahrefs.com/blog/zh/seo-tips/) [一个SEO做的比较好的个人博客may90.com](https://may90.com)

[Jekyll官方文档](https://jekyllrb.com/docs/) [中文文档](https://www.jekyll.com.cn/docs/) Jekyll是一个静态网站生成器，是GitHub Pages推荐的默认的工具，但是其实Hexo更加强大，社区，插件，速度比Jekyll好一些，但是Jekyll还是值得我们了解一下的。

[使用Hugo构建个人博客](https://jimmysong.io/hugo-handbook/) Hugo是	一个基于Go语言开发的静态网站构建工具。

[Node.js教程](https://www.runoob.com/nodejs/nodejs-tutorial.html) 大概也可以拓展一下吧。

[Git教程](https://www.runoob.com/git/git-tutorial.html)

还有很多知识、技术是可以拓展的，但是暂时就想到这些。

## 创建github.io仓库 ##

创建github.io，与平时创建仓库差不多，只是库名限制为`username.github.io`，就是Github账户的名称加上github.io后缀就行了，当然这里一定要遵守这个规则，不然他就变成了一个普通的库。 [官方的简单入门](https://pages.github.com/)，注意，如果要使用Gitalk评论系统，那我们需要将仓库设置为公有（`public`），这里是我踩过的一个坑，设置成了私有（`private`）库，Gitalk插件会显示，`Error Not Found！`，[创建github.io仓库，有图教程请看](https://knightyun.github.io/2018/04/01/github-pages-blog#3)

## 发布到github.io仓库 ##

如果我们配置了`git`的`ssh key`，那发布就很简单了，`hexo generate --deploy`（简写为`hexo g -d`）一键就可以发布了，但是在这之前，我们还需要下载安装[hexo-deployer-git](https://github.com/hexojs/hexo-deployer-git)包并配置`hexo/_config.yml`。

下载安装`hexo-deployer-git`

```
npm install hexo-deployer-git --save
```
配置`hexo/_config.yml`

```yaml #hexo/_config.yml
deploy:
  type: git
  repo: <repository url> 	#比如：https://bitbucket.org/JohnSmith/johnsmith.bitbucket.io
  branch: [branch] 		#例如：master
  message: [message] 		#留空
```

配置好后就可以一键发布了，但是**没有配置ssh key的同学怎么办**，这里有种解决方案，第一种，[配置ssh key](https://blog.csdn.net/hustpzb/article/details/8230454)，第二种，使用[Github桌面应用](https://desktop.github.com/)吧，具体步骤如下：

- 下载安装好GitHub桌面应用，并登录GitHub账号在桌面应用。
- 将github.io库pull（拉取）到`Hexo`工程目录下的`.deploy_git`文件夹下，没有该文件夹创建一个。
- 在更改代码需要发布时，执行`hexo generate --deploy`（简写为`hexo g -d`），这里因为没有配置SSH key会报错，但是没关系。
- 打开GitHub桌面应用，他自动就会提醒我们发布，我们只需要点击发布就好了，或者使用快捷键`ctrl + p`。

发布的话，我想应该大概差不多就这个步骤。 附上一个[Git教程](https://www.runoob.com/git/git-tutorial.html)

## 后续更新github.io ##

后续更新的话，主要是更改了配置或者是添加了文章要发布，重点还是在发布，有问题可以看一下前一部分，[发布到github.io仓库](#%E5%8F%91%E5%B8%83%E9%A1%B5%E9%9D%A2%E5%88%B0github-io%E4%BB%93%E5%BA%93)，这里注意Markdown的书写，[教程在此](http://xianbai.me/learn-md/index.html)，最后在啰嗦一下Hexo创建文章，首先我们可以用`hexo new draft 文章名`创建一个草稿`draft`，在写的过程种查看效果，我们可以执行`hexo server --drafts`（注意不要简写），写好了之后，可以执行`hexo publish 文件名`（可以简写成`hexo p 文件名`），然后再生成，发布。

# 总结 #
写了好几天，写着写着，把之前一些没有接触的功能也玩了一遍，写着写着，写成了一个中文口语版的说明文档，脱离了之前学习的那个意味了，有点问题，要好好反思，大概可能算是锻炼了一下如何写说明文档，但是说学到多少技术那并没有，在回到说明文档，[Hexo官方的指南](https://hexo-guide.readthedocs.io/zh_CN/latest/index.html)是特别好的，写了这么多，花了这么久的时间，总之还是偏离了初衷。

明白了，**好钢要用在刀刃上**，也算是有成长吧！

加油，下次会更好的。 