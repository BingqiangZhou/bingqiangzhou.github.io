---
title: 【论文阅读笔记】FEELVOS\: Fast End-to-End Embedding Learning for Video Object Segmentation
tags: [论文阅读笔记系列]
---

视频对象分割快速端对端嵌入学习方法（FEELVOS: Fast End-to-End Embedding Learning for Video Object Segmentation）

[论文简介](https://arxiv.org/abs/1902.09513)
[论文下载](https://arxiv.org/pdf/1902.09513v2.pdf)

<!--more-->

## 概述

![模型图](/assets/images/20190920/figure3.png)


根据上图，大概描述一下整个模型，首先给定视频的一帧，通过在DeepLabV3+架构，去掉最后一层，得到骨干特征（backbone features）并再头部（top of that）加上一个嵌入层（embedding layer）的网络，得到每一个像素点的嵌入向量（对应的得到整个嵌入向量空间），随后对应于每一个对象，通过当前嵌入空间和前一帧图片的嵌入空间计算得到全局匹配距离图（global matching distance map），通过当前嵌入空间和前一帧图片的嵌入空间计算得到本地匹配距离图（local matching distance map），随后将骨干特征（backbone features）（共享，复制N份，N为对象的个数）和对应于一个对象的全局匹配距离图、本地匹配距离图、前一帧的预测结果组合到一起，形成一个维度为[w/4, h/4, 259(256+3)]的张量，再将这个张量作为分割头网络（segmentation head）的输入，得到每一个点对于每个对象的logits值（校正值），将其堆叠在一起，通过softmax函数得到一个张量[w/4, h/4, N]，即为处理的结果，对应于每个点属于每个对象的概率。

下面分别较为详细一点的总结一下各个部分内容。

## 语义嵌入（semantic embedding）

对于每一个像素点，都提取一个实体嵌入向量在学习到的嵌入空间中，这里定义一下两个像素点的距离。

$$d(p,q)=1-\frac {2}{1+exp({\vert \vert e_p -e_q \vert \vert }^2)}$$

当两点距离比较远的时候，距离趋近于1，当两点距离比较近的时候距离趋近于0，关于点的距离的计算都是用像素点对应的嵌入向量。

## 全局匹配（global matching）

定义全局匹配公式为

$$ G_{t, o}(p) = min_{q \in P_{1, o}} d_(p, q)$$

这里的t代表第几帧，o为全体对象的一个，$G_{t, o}(p)$为第t帧中像素点p与第一帧对象o的最小距离，而$P_{1, o}$对应于第一帧所属对象o的像素点集合。

假设第一帧对象o中有n个像素点，则这里的$G_{t, o}(p)$是第t帧中的一个像素点p到这n个像素点中的最短距离。

## 本地前一帧匹配（local previous frame matching）

$$ \hat G_{t, o}(p) = \begin{cases} min_{q \in P_{t-1, o}} d_(p, q), &{ if\ P_{t-1, o}\neq \emptyset}\\\\ 1,&{otherwise}\end{cases} $$

这里与全局匹配类似，计算上一帧与当前帧的距离，但是，当这一帧不存在对象o的时候设置距离为1。

显而易见的是，这里可以优化，在我们计算第一帧与当前帧的距离的时候，两帧可能变化比较大，不得不计算所有的点的距离，但是在计算当前帧的时候，其实两帧之间的变化是比较小的，我们可以只计算部分点，论文中提出了一种方法优化，减少计算量。

![窗口大小示意图](/assets/images/20190920/myfigure.png)

给定一个窗口大小k（作者设置k=15），以p点为中心，向上下左右延伸k个像素点，记这个像素点集合为$N(p)$，集合中存在有$(2\cdot k +1)^2$个元素，让集合$N(p)$与$P_{1, o}$去交集，再计算距离，没有交集的情况，距离直接设置1，这里的原理是只有p点周围的像素点中存在属于对象的像素点的时候，才进行计算，周围没有属于对象的像素点的时候，看作没有变化不进行计算。

$$ L_{t, o}(p) = \begin{cases} min_{q \in P_{t-1, o}^p} d_(p, q), &{ if\ P_{t-1, o}^p\neq \emptyset}\\\\ 1,&{otherwise}\end{cases} $$

其中$P_{t-1, o}^p = P_{t-1, o} \cap N(p)$

## 前一帧的预测结果（previous frame predications）

对应对象的预测结果图为二值图，属于该对象的像素点对应值为1，不属于该对象的像素点对应值为0，但是用在下一帧的预测时的图是只经过softmax的可能性图（soft probability map）。

除了前一帧预测的可能性图，还有全局匹配距离图和本地前一帧距离图，它们与当前帧的嵌入空间堆积到一起作为动态分割头网络的输入，下面大概说一下动态分割头网络。

## 动态分割头（dynamic segmentation head）

可以看到上面的模型图，动态分割头网络只前向运行一次，各个对象之间共享权重，最后对应每个对象生成一个一维的校正值（logits）特征图，将它们堆叠到一起，再对象层面的维度运用softmax函数，得到像素点属于各个对象的可能性，最后损失函数使用交叉熵损失，最后再大概说一下大概的训练过程。

## 训练过程（training procedure）

对于训练的每一步，首先随机选取训练集中的一个mini-batch的视频，再每一个视频中随机选取3帧，一帧做“第一帧”，另外两个临近的帧，分别作为“前一帧”和当前帧，再经过上面所说的一系列的运算并进行训练（loss为softmax情况下的交叉熵损失）。

## 推论或结论（inference）

FEELVOS是简单的、直接的（straightforward），对于每一帧只需要一次前向传播，这里作者又将整个测试过程大概说了一遍：给定一个测试视频和第一帧的真实值（ground truth），首先提取第一帧的嵌入向量，随后，一帧一帧的计算当前帧的嵌入向量，并于第一帧计算全局匹配（global matching）和前一帧计算本地匹配（local matching），结合前一帧的预测结果，对每一个对象运行动态分割头（dynamic segmentation head）网络，再对每个像素执行softmax（原文是argmax）生成最终的分割结果。

## 实现细节（implementation details）

提取特征的网络是DeepLabv3+架构（基于Xception-65架构），运用逐深度可分离卷积（depthwise separable convolutions），批标准化（batch normalization），深黑的空间金字塔池化（atrous spatial pyramid pooling），和一个步长为4的生成特征的解码模块。

这里作者的方法加了一个嵌入层（embedding layer）组合在逐深度可分离卷积层（depthwise separable convolutions），设置提取的嵌入向量维度为100。

在动态分割头，作者发现一个大的接收域（large receptive field）是很重要的（这里的接收域还没有完全理解），作者使用了4层逐深度可分离卷积层（256维）和一层核大小为7x7的逐深度的卷积层，最后加一层1x1的卷积来提取一维的校正值（logits）。

文中还提到了在全局匹配中计算所有成对的像素点的距离是很昂贵的，而且并不是所有的像素都又必要考虑的，所以提出了一种优化方法，在训练中，参考点集取随机子样本（randomly subsample），从第一帧变成每个对象最多包含1024个像素点，即本身要计算整张图片，变成每个对象最多计算1024点，极大的减小了计算量，并且作者指出对结果几乎没有影响。

对于本地匹配，窗口大小k=15，也就是对于取以点p为中心的$(2*15+1)^2$，窗口大小在这一小节提到[本地前一帧匹配](#本地前一帧匹配local-previous-frame-matching)。

在开始训练时，使用DeepLabv3+在ImageNet和COCO训练好的参数。

训练数据，作者使用的是DAVIS 2017数据集中的60个训练视频。

作者还运用了一个白举交叉熵损失，对于计算损失，只考虑最难的15%的像素点。

在优化的时候，使用带有动量的梯度下降（$momentum = 0.9$），学习率$\alpha=0.0007$，每一捆的大小（$batch\  size = 3\ videos$）,训练200000（20万）步。

最后还运用了标准数据增强（standard data augmentation），例如翻转和缩放、随机剪切输入图像为465x465像素。

其他实验细节这里不再细说，需要实现的时候再回顾论文。


## 总结与感受
看了这篇论文，除了对模型的了解，还学到了两种降低计算成本的思路（对全局匹配取随机子样本进行计算，还有对于本地匹配取窗口），挺好的，虽然没有取跑一遍他的实验，但是还是学到了很多思想了，还是希望自己有一个好的改进的方法的时候，然后再好好做实验吧，加油！


