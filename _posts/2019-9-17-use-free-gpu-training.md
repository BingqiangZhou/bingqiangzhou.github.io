---
title: 【薅羊毛】使用免费的算力
tags: [ai studio, colab, kaggle, training]
---

薅羊毛，在Baidu AI Studio训练模型，框架不限于PaddlePaddle，TensorFlow，Pytorch都可以。

之前在暑假的时候，可以直接在Notebook中下载包，然后运行TensorFlow，Pytorch，百度升级了两次平台，现在已经不可以了，但是我们可以通过终端下载包，上传代码，然后运行，训练就好了。

<!--more-->
## 步骤

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

## 其他相关链接

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

## linux命令

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
