---
title: 【工具资源】ai studio、colab、kaggle免费的算力
tags: [工具资源系列]
---

薅羊毛，在Baidu AI Studio训练模型，框架不限于PaddlePaddle，TensorFlow，Pytorch都可以。

之前在暑假的时候，可以直接在Notebook中下载包，然后运行TensorFlow，Pytorch，百度升级了两次平台，现在已经不可以了，但是我们可以通过终端下载包，上传代码，然后运行，训练就好了。

<!--more-->
## 安装包

上传package.txt,包括python包信息
打开终端，下载包，命令如下
```shell
pip3 install -r package.txt
```
pip不可使用，更新一下就可以使用了，命令如下
```shell
pip3 install --upgrade pip 
```

将数据以及代码上传到AI Studio工作空间，执行代码训练模型。

## 相关链接

[python如何从txt文件中批量pip安装包](https://blog.csdn.net/The_Time_Runner/article/details/96993733)

[Ubuntu下安装Python 3.7](https://blog.csdn.net/dlh_sycamore/article/details/82378544)

[Centos/Linux 下升级python2.7至3.5.0](https://www.cnblogs.com/z-joshua/p/5710698.html)

[Google Colab 免费GPU服务器使用教程](https://blog.csdn.net/cocoaqin/article/details/79184540)

[在Kaggle免费使用GPU训练自己的神经网络](https://karbo.online/dl/kaggle-gpu/)

## 更新博客

今天再一次尝试了百度AI studio，kaggle，谷歌colab这三个平台。

百度的AI studio在基础版cpu的情况下，是可以上传代码进行训练，再带gpu的主机上没有权限。

kaggle上传文件这块受到限制了，自己写代码还是可以的，每个星期有30个小时的免费GPU使用时间，然后就是有丰富的数据集，可以不用下载下来，可以参加竞赛拿奖金，预装了tensorflow和pytorch等等。

谷歌的colab和百度的差不多，但是开放程度更高，稳定性更好，预装了tensorflow和pytorch，有免费的GPU，15g网盘。

## 翻墙工具
附上两个翻墙工具链接，不是完全免费的。

[SocketPro](https://socketproapp.com/zh/home)

[W加速器](https://d.wjsq.xyz/)

## 命令

查看linux系统版本
```shell
cat /proc/version
```

查看cpu信息
```shell
cat /proc/cpuinfo
```

查看内存信息
```shell
cat /proc/meminfo
```

英伟达系统管理接口,查看cuda信息gpu信息等等。
```shell
nvidia-smi
```

python更新pip
```shell
python -m pip install –upgrade pip
```

## 相关说明

### 可以直接再jupyter lab的notebook模式直接执行shell命令

执行shell命令Shell是一种与计算机进行文本交互的方式。一般来讲，当你正在使用Python编译器，需要用到命令行工具的时候，要在shell和IDLE之间进行切换。但是，如果你用的是Jupyter，就完全不用这么麻烦了，你可以直接在命令之前放一个“!”，就能执行shell命令，完全不用切换来切换去，就能在IPython里执行任何命令行。In [1]: !ls

```shell
In [2]: !pwd
/home/Parul/Desktop/Hello World Folder
In [3]: !echo "Hello World"
Hello World
```
### 再次安装依赖包

注意将所依赖的包以及版本信息保存到txt文件中，方便之后再安装使用，colab好像不需要重新安装包（可再次考证一下），ai studio每次都需要重新安装。

[pip常用命令](https://www.jianshu.com/p/7f55544f54ff)
pip freeze,pip show等等。

### 下载数据集，进行训练

这一块，我们把各个平台，当作一个云主机，直接执行命令下载数据集，上传代码，然后就可以进行训练了。

