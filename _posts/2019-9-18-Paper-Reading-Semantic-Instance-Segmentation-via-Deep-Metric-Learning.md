---
title: 【论文阅读笔记】基于深度度量学习的语义实例分割（二）
tags: [CV, Semantic Instance Segmentation, Deep Metric Learning]
mathjax: true
mathjax_autoNumber: true
---

接过上一次的话题，这一次，结合自己的理解，记录一下论文中提出的方法，包括嵌入模型（embedding model）、创建遮罩（creating masks）、分类和种子度模型（classification and seediness model）。

<!--more-->

## 嵌入模型（embedding model）
学习一个嵌入模型（维度为[h, w, d]的张量），使用logistics损失来训练它。
### 相似度

$$\sigma(p,q)=\frac{2}{1+exp(||e_p-e_q||)}$$

其中，$\sigma(p,q)$ 表示点p与点q的相似度，当两者在嵌入空间（$e_p$ 与 $e_q$）比较近时，$\sigma(p,q)=\frac{2}{1+e^0}=1$，两者比较远时，$\sigma(p,q)=\frac{2}{1+e^\infty}=0$。
### 损失函数

$$L_e=-\frac{1}{|S|}\sum_{ {p,q}\in S}w_{pq}[1_{\{y_p=y_q\}}log(\sigma(p,q))\\+1_{\{y_p\neq y_q\}}log(1-\sigma(p,q))]$$

其中$S$ 是"种子点"集合，这里的$|S|$表示集合中种子点的个数，$w_{pq}$是点p与点q相似度损失的权重，$w_{pq}$ 与点p和点q所属的实例大小成反比，添加这个权重，从而使得损失函数不会偏向于更大的样本。
$1_{\{y_p=y_q\}}$表示当$y_p=y_q$成立的时候式子取1，不成立则取0，$1_{\{y_p\neq y_q\}}$同理。

论文中还提到了正则化权重，$\sum_{p,q}w_pq=1$ 。

在训练开始时，在每一个实例中随机取样，选取K个点来作为种子点，假设有N个实例，则种子点集合元素个数$\vert S \vert=N \cdot K$，在这里只计算在$\vert S \vert$中的点与点之间的相似度损失，选取种子点机制在[分类和选种子点模型](#分类和种子度模型classification-and-seediness-model)说明，以上说的点都是用嵌入空间对于点的嵌入向量来计算的。

## 创建遮罩（creating masks）

### 创建遮罩机制

对于种子点p，比较所有其他点q，当p与q的相似度大于一个阈值的时候，则记q点与p点属于同一个遮罩，反之，则不属于同一个遮罩，一般记为背景，公式如下：

$$m(p,\tau)=\{ q:\sigma(p,q) \geq \tau \}$$

对于阈值$\tau$，论文中提到，作者实验中使用阈值的数值$\tau \in {\{ 0.25,0.5,0.75\}}$

### 向量化距离公式

在计算相似度的公式中，计算两点的距离$\vert\vert e_p - e_q \vert\vert_2^2$，将其向量化，$A^2+B^2-2A \bigodot B$，其中$A$是嵌入空间张量（维度为[h, w, d]，h为高度，w为宽度，d为嵌入维度），$B$是K个种子点的嵌入向量（维度为[k, d]），这里再计算相似度，再阈值化（thresholding）处理矩阵就好了。

### 选取种子点机制

当p点与种子点q的相似度大于一个阈值时，则将这个点p设置为与点q同类，反之属于背景，由此可知每一个种子点都会产生一个二值遮罩，那么我们如何选种子点呢？首先选择每个类中一个“种子度”最高的点，这个点是在阈值$\tau\$下最大可能性属于c类中。

选择第t个种子点

$$p_t=arg\ max_{p \notin p_{1:t-1}}[log(S_p)\\+\alpha log(D(p,p_{1:t-1}))]$$

其中，

$$ S_p = max_{\tau \in \mit T}\ max_{c=1}^C \mit C_{pc}^{\tau} $$

$$ D(p,p_{1:t-1}) = min_{q \in p_{1:t-1}} ||e_p - e_q ||_2^2 $$

$S_p$表示p点的种子度（seediness），$D(p,p_{1:t-1})$表示p点与已选择的点中的最小距离，在论文中提到处理不同大小的对象会使用不同大小的阈值，而再实验中作者使用阈值的范围为$T={\{ 0.25, 0.5, 0.75, 0.9 \}}$，即$\tau \in {\{ 0.25,0.5,0.75, 0.9\}}$，$C_{pc}^{\tau}$是在阈值为$\tau$下,点p属于c类的可能性。$arg \ max$表示后面的式子取最大值时的变量值，这里是取最大值时对应的点。

$\alpha \ log(D(p,p_{1:t-1}))$ 可以简单理解为正则项，作用是让新选的p点与已经选择了的t-1个种子点的距离大一些，这里体现为惩罚新选p点与已经选择的t-1个点的最小距离。

简单总结一下，选种子点机制，平衡p点属于c类的可能性的最大可能性和p点远离已选点，选择取最大值时的p点。


## 分类和种子度模型（classification and seediness model）
学习模型，使用softmax交叉熵损失来训练模型，附上公式，解释相关标记

$$ L_{cls} = -\frac{1}{|S|}\sum_{p \in S}\sum_{c=0}^{C}y_{pc}\ log \  \mit C_{pc}$$

当我们已经选择了最好的种子点集之后，我们就可以算出对应最好的阈值和在选择最好的阈值的情况下相关的置信度。

最好的阈值以及对应的标签c

$$(\tau, c_p) = arg \ max_{\tau \in \mit T,c \in {1:\mit C}} C_{pc}^{\mit T}$$

置信度

$$ S_p = \mit C_{p,c_p}^{\mit T_p} $$

### 共享全图片卷积特征

这里主要告诉我们特征提取器基于DeepLab v2模型（基于resnet-101），使用COCO进行预训练，损失函数如下：

$$L = L_c + \lambda L_{cls}$$

这里超参数$\lambda$的设置在这里不详细讲了，跑代码的时候自己再调一下，论文中说到作者最大使用0.2。

这部分请看论文原文吧。[基于深度度量学习的语义实例分割（Semantic Instance Segmentation via Deep Metric Learning）](https://arxiv.org/pdf/1703.10277.pdf)

## 总结与感受
我个人认为论文给我们最重要的方法是自动选取种子点的方法，这样就可以实现自动化分割实体，在应用上，比如重上色，其实选点的过程下可以让用户交互，用户都只要交互一次，在训练上的话，难度也比较小，当然如何我们还是让用户去交互的话，应用面就被限制了，再回到用户交互的方式的话那就是一种退步。
回到方法，感觉还是蛮难的，可能还没有完全搞懂，可能是没有跑代码的原因吧，不过现在大概知道了这个思想了，以后有需要再回顾吧。