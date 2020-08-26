---
title: 【日常小结】归一化(Normalization)、标准化(Standardization)与正则化(Regularization)
tags: [日常小结系列]
---

回到学校一个星期了，算是差不多找回状态了。

今天记录一下归一化(Normalization)、标准化(Standardization)与正则化(Regularization)。

<!--more-->

## 归一化(Normalization)

归一化是特征缩放的一种形式，归一化是把数据压缩到一个区间内，比如$[0,1], [-1, 1]$。常用的方法有：

Rescaling:

$$
x' = \frac{x - min(x)}{max(x) - min(x)}
$$

Mean normalization:

$$
x' = \frac{x - mean(x)}{max(x)-min(x)}
$$

## 标准化(Standardization)

标准化，与归一化一样，也是特征缩放的一种形式。标准化是减去均值后再除以方差，公式如下：

$$
x'= \frac{x - \overline{x}}{\sigma}
$$

需要注意的是，标准化之后的数据分布并不一定是正态分布，标准化并不会改变原始数据的分布。可以浏览一下[这篇博客](https://blog.csdn.net/weixin_36604953/article/details/102652160)，这篇博客中有使用例子来说明，标准化，并不会改变它的分布。

拓展知识：z分数（z-score），也叫标准分数（standard score）是一个数与平均数的差再除以标准差的过程。
因此上面的标准化公式也被称为z-score标准化。

## 正则化(Regularization)

正则化是指为解决适定性问题或过拟合而加入额外信息的过程。常用的有L1正则化，L2正则化。这篇文章[理解泛化能力、weight decay](http://blog.sina.com.cn/s/blog_a89e19440102x1el.html)讲的比较好，它推理了了L2正则化就是权重衰减是怎么来的，而在[知乎的另一个回答](https://www.zhihu.com/question/268068952)中，讲到了它们是不完全一样，一个改变了目标函数（损失函数），一个是体现在更新参数的过程。

## 其他的一些数据变换方式

数据变换方式很多，不同的数据变换有不同的用途。
Softmax、RELU、Sigmoid等等都是数据变换，不过用途不一样。

再宽泛一点讲，其实每一个函数（映射）都是一种变换方式，只是有一些函数（映射）常用于机器学习。

## Q&A

这里综合了一下，下面两篇论文中我觉得不错的问题以及解释。

[标准化和归一化，请勿混为一谈，透彻理解数据变换](https://blog.csdn.net/weixin_36604953/article/details/102652160)

[【python数据预处理笔记】——特征缩放（标准化 & 归一化）](https://blog.csdn.net/huanyingzhizai/article/details/92772793?utm_medium=distribute.pc_relevant.none-task-blog-BlogCommendFromMachineLearnPai2-3.edu_weight&depth_1-utm_source=distribute.pc_relevant.none-task-blog-BlogCommendFromMachineLearnPai2-3.edu_weight)

1. 为什么需要做标准化或者归一化？

    a. 目的是使其不同尺度之间的特征具有可比性，同时不改变原始数据的分布。例如$y=x_1+x_2+7$是一个简单的线性函数，如果$x_1$的尺度为$[0,1]$，$x_2$的尺度为$[0,10000]$，那么$x_2$的变动将会产生更大的影响。这个时候就要对特征进行缩放，也就是标准化或者规范化。简单来说就是让模型不会偏向于某一个特征。

    b. 参数估计时使用梯度下降，在使用梯度下降的方法求解最优化问题时，归一化/标准化后可以加快梯度下降的求解速度，即提升模型的收敛速度。

2. 哪些数据不能做特征缩放？

    稀疏数据不能进行特征缩放，因为特征缩放相当于对原数据进平移和缩放。而对于稀疏数据来说，数据中含有大量的0，一旦进行平移，那么稀疏特征将会变为密集特征，这会产生很大的影响，比如特征向量中包含没有在文章中出现的所有单词，那么当它变为密集向量的时候，特征的意义会发生巨大的改变。

3. 什么时候Standardization，什么时候Normalization？

    a. 如果对处理后的数据范围有严格要求，那肯定是归一化；

    b. 如果无从下手，可以直接使用标准化；

    c. 如果数据不稳定，存在极端的最大最小值，不要用归一化。

    d. 在分类、聚类算法中，需要使用距离来度量相似性的时候、或者使用PCA技术进行降维的时候，标准化表现更好；在不涉及距离度量、协方差计算的时候，可以使用归一化方法。

    PS：PCA中标准化表现更好的原因可以参考([PCA标准化](https://blog.csdn.net/young951023/article/details/78389445))

4. 所有情况都应当Standardization或Normalization么?

    a. 当原始数据不同维度特征的尺度(量纲)不一致时，需要标准化步骤对数据进行标准化或归一化处理，反之则不需要进行数据标准化。

    b. 也不是所有的模型都需要做归一的，比如模型算法里面有没关于对距离的衡量，没有关于对变量间标准差的衡量。比如决策树，他采用算法里面没有涉及到任何和距离等有关的，所以在做决策树模型时，通常是不需要将变量做标准化的；

    c. 另外，概率模型不需要归一化，因为它们不关心变量的值，而是关心变量的分布和变量之间的条件概率。

## 参考链接

[标准化和归一化什么区别？](https://www.zhihu.com/question/20467170)

[标准化和归一化，请勿混为一谈，透彻理解数据变换](https://blog.csdn.net/weixin_36604953/article/details/102652160)

[【python数据预处理笔记】——特征缩放（标准化 & 归一化）](https://blog.csdn.net/huanyingzhizai/article/details/92772793?utm_medium=distribute.pc_relevant.none-task-blog-BlogCommendFromMachineLearnPai2-3.edu_weight&depth_1-utm_source=distribute.pc_relevant.none-task-blog-BlogCommendFromMachineLearnPai2-3.edu_weight)

[Deep Learning-1.5 理解泛化能力、weight decay](http://blog.sina.com.cn/s/blog_a89e19440102x1el.html)

[权重衰减和L2正则化是一个意思吗？](https://www.zhihu.com/question/268068952)
