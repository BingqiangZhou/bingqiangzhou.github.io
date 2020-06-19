---
title: 【日常杂耍】PDF相关
tags: [日常杂耍系列]
---

故事开始于昨天早上，接收到一条短信，告诉我有一个小项目可以接，接着我联系了一天，都没有确定是要做什么，没有明确的需求，大概知道了会和PDF相关信息的检索有关，随后我就开始自己先琢磨一下了，今天又快过完了，还是没得需求，十月底要弄出来，真的想说，“赚钱不容易呀”。

<!--more-->

## pdfboxNet库
PDFBox是Java实现的PDF文档协作类库，提供PDF文档的创建、处理以及文档内容提取功能，也包含了一些命令行实用工具，pdfboxNet也就是pdfbox的.Net实现了。

主要特性包括：从PDF提取文本、合并PDF文档、PDF文档加密与解密、与Lucene搜索引擎的集成、填充PDF/XFDF表单数据、从文本文件创建PDF文档、从PDF页面创建图片、打印PDF文档等等。

大概参考了一下这篇文章，[C#读取PDF ——PDFBox使用](https://blog.csdn.net/LCL_data/article/details/6043898)，其中不需要和文章中说的一样取下载库文件，在VS集成开发环境中，使用NnGet直接搜索安装就好了。

文章有点古老了，技术我也不知道是不是被淘汰了，其实我只是想验证我的想法，打开PDF提取相关信息，这里就以及验证了可以提取信息，虽然后来通过进一步的交流发现，那边又整理好的EXCEL表格，可能是检索EXCEL吧，还是步完全清楚需求，罢了罢了，继续玩一玩PDF相关的东西吧。

## PDF winform控件

一想，玩一下PDF相关的Winform控件吧，随后就开始找了。

### Adobe提供的ActiveX控件

[Adobe提供的ActiveX控件](https://blog.csdn.net/sl1990129/article/details/78094602)，这里没有具体尝试，需要在安装adobe acrobat。

#### 相关链接

[【C# 基础】— 解决 "winForm 引用 Adobe PDF Reader控件不显示pdf 文件" 问题](https://blog.csdn.net/zt15732625878/article/details/79248523)
[CSDN问题：C# winform Acrobat Reader 显示pdf如何获取当前页数,提到了Free Spire.PDFViewer、devexpress pdf的控件](https://bbs.csdn.net/topics/392179589)

### DevExpress的PDF控件

听说比较好用，有点跃跃欲试的感觉，但是一个license需要18k+，果断放弃了，不过网上有破解版，之后有时间再尝试一下。

#### 相关链接

[PDF Viewer文档](https://docs.devexpress.com/WindowsForms/15216/Controls-and-Libraries/PDF-Viewer)

[基于DevExpress实现对PDF、Word、Excel文档的预览及操作处理](https://www.cnblogs.com/wuhuacong/p/4175266.html)

[DevExpress控件使用详细说明](https://wenku.baidu.com/view/c22bb9f127d3240c8447eff6.html)

[DevExpress 编译成功的 dll](https://blog.csdn.net/weixin_33835103/article/details/85730069)

[DevExpress 18 源代码编译方法](https://www.dxper.net/thread-42367-1-1.html)

[2014年DevExpress使用教程合集](https://my.oschina.net/u/1163318/blog/362638)

[DevExpressSources151](https://github.com/ProximaMonkey/DevExpressSources151)

[devexpress 使用安装、破解注册和汉化包进行汉化的步骤](https://blog.csdn.net/qq_36628003/article/details/82684679)

[DevExpress安装文件、源码、注册破解下载](https://www.dxper.net/thread-40506-1-1.html)

### 没有尝试的收费的PDF控件

[ComponentOne-PDF for WinForm](https://www.grapecity.com.cn/developer/componentone-winform/controls/pdf)

[Free Spire.PDFViewer for .NET](https://www.e-iceblue.com/Introduce/free-pdf-viewer-net.html#.XYefwCrithE) 收费，但是也有免费版，免费版有功能上的限制，比如只能显示10页。

### 开源的PDF控件

[PDF Viewer Control Without Acrobat Reader Installed](https://www.codeproject.com/Articles/37458/PDF-Viewer-Control-Without-Acrobat-Reader-Installe)
很老的开源项目了，09年的。

[The PDFView4NET toolkit](http://www.o2sol.com/pdfview4net/download.htm) 免费的，并且持续更新，有时间再尝试一下。[相关链接](https://www.cnblogs.com/onestow/p/5977807.html)

### PdfiumViewer

一个免费的.NET的PDF控件库。[PdfiumViewer GitHub库](https://github.com/pvginkel/PdfiumViewer)
[PdfiumBuild GitHub库](https://github.com/pvginkel/PdfiumBuild)

PdfiumBuild库的下载，对应在NuGet下载PdfiumViewer.Native.x86_64.v8-xfa库和PdfiumViewer.Native.x86.v8-xfa库就好了，而PdfiumViewer库在NuGet对应的搜索下载就好了。

其中我下载了PdfiumViewer Github上的源码，跑了PdfiumViewer的Demo项目，除了页面老了点，其他是极好的。

## 写在最后

PDF相关的库就大概接触了一下上面这些了，不多说了，PDF相关的东西，以后有用得到再翻一翻看一看吧。
