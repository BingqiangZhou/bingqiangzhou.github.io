---
title: 反编译APK
tags: [decomplie, apk]
---

简单记录一次突发奇想的实践经历，以及反编译APK的步骤。

<!--more-->

## 突发奇想 ##

学校的APP特别不好用，经常吐槽它，就在昨天晚上，我们突发奇想，看可不可以将一些内容迁移到小程序上，于是我说干就干了，首先我反编译了APK，随后看了一些相关代码，找了到一些接口的URL以及传递的参数名，然而不知道参数是什么样的形式，随后使用`fiddler`开始抓包，其中碰到了一个不能抓取https协议请求的问题，这里附上配置链接，[安卓配置](https://www.cnblogs.com/hushaojun/p/6385947.html)，[iOS配置](https://blog.csdn.net/weixin_39198406/article/details/81123716)，解决了这个问题，抓到包，但是发现了参数中的`token`需要解决，解决不了无法提供给多人使用，所以我又看了一下代码，发现他是使用了一个单例模型，将一个类的实例转为`String`作为`token`，但是这里我不太确定只有这一种方法，因为我看到了登录的接口中，返回的参数返回了一个`token`，可能分不同的情况吧，到这里我开始打退堂鼓了，还得好好锻炼，一个人还是很难耐得住寂寞。

## 反编译APK ##

再这里记录一下反编译APK的步骤吧。

[参考链接](https://blog.csdn.net/vipzjyno1/article/details/21039349)  

### 第一步、解压APK ###

使用WINRAR解压软件解压APK包，得到`.dex`文件。

### 第二步、使用apktool反编译APK ###

注意需要安装java 8以及以上版本的JDK。[参考链接](https://ibotpeaches.github.io/Apktool/install/) 

#### 下载工具 ####
下载脚本[`apktool.bat`](https://raw.githubusercontent.com/iBotPeaches/Apktool/master/scripts/windows/apktool.bat)，下载jar包[`apktool.jar`](https://bitbucket.org/iBotPeaches/apktool/downloads/)，注意，这里下载的包需要更名为`apktool.jar`

#### 配置环境变量 ####

将`apktool.bat`和`apktool.jar`所在文件夹添加到环境变量中，或者这两个文件放到`C://Windows`目录下。

#### 执行反编译命令 ####

命令格式为 apktool d [apk文件] [输出文件夹]

```shell
apktool d base.apk base
```

### 第三步、使用dxe2jar反编译APK ###

这里将解压出来的`.dex`转为`jar`包。

#### 下载工具 ####

下载[dex2jar](https://bitbucket.org/pxb1988/dex2jar/downloads)

#### 执行命令 ####

再`dex2jar`文件夹中执行命令，命令格式`d2j-dex2jar.bat [dex文件路径]`，注意将所有的`.dex`文件转换为`jar`包。

```shell
d2j-dex2jar.bat E:\classes.dex
```

### 第四步、使用jd-gui查看jar源代码 ###

下载[jd-gui](https://github.com/java-decompiler/jd-gui/releases)，使用`jd-gui`打开`jar`包查看源码。


