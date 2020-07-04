---
title: 【论文阅读笔记系列】Instance Segmentation by Jointly Optimizing Spatial Embeddings and Clustering Bandwidth
tags: [论文阅读笔记系列]
---

几天没写博客了，这几天在看一些课外书，不过今天看了一篇论文，`Instance Segmentation by Jointly Optimizing Spatial Embeddings and Clustering Bandwidth`，它是之前`EmbedMask`那篇论文中的可学习间隙的来源，这篇论文说主要提出了一种新的损失，而我觉得论文的主要贡献是提出了可学习的间隙`margin`以及在提高实时性的同时，保持了高的准确度。

[论文地址](https://arxiv.org/abs/1906.11109)

[源码地址](https://github.com/davyneven/SpatialEmbeddings)

<!--more-->

## 网络结构

我们直接来看网络结构图。

![网络结构图](/assets/images/2020/20200628/network-architecture.png)

网络主要分为两个分支，上面的分支用来预测每个语义类别的种子图`seed map`，这个种子图呢，是一个分数图，靠近实例对象的中心点对应会有一个高的分数，而离中心点比较远的分数则比较低，下面的分支呢，输出`offset map`和间隙$\sigma$，`offset map`与坐标向量（xmap，ymap）相加构造成像素点的`embedding`。随后由`seed map`确定实例对象的中心点位置，取对应位置的$\sigma$作为间隙，通过计算`embedding`的距离（或者说是相似度）来确定实例分割的结果。

## 网络细节

### `seed map`

查看源码发现呢，这个种子图，并不是像网络结构图中那样分了成了多张，而只是一张包含了所有语义对象的图并且用损失函数（如下）在语义对象上进行约束。

$$
L_{seed} = \frac{1}{N}\sum_{i}^{N}\mathbf{1}_{\{s_i \in S_k\}}||s_i-\phi_k(e_i)||^2+\mathbf{1}_{\{s_i \in bg \}}||s_i-0||^2
$$

这里的$S_k$是由`ground truth`确定的语义对象，$s_i$是`seed map`中的点，$\mathbf{1}_{\{ s_i \in S_k\} }$与$\mathbf{1}_{\{ s_i \in bg \} }$分别表示属于语义对象、背景为1，否则为0。$\phi_k(e_i)$为如下公式，计算属于$i$点属于对象$k$的分数。

$$
\phi_k(e_i)=exp\left(-\frac{||e_i-C_k||^2}{2\sigma_k^2} \right)
$$

那为什么要用$s_i$减去$\phi_k(e_i)$，作者认为这个分数应该等于计算由$\phi_k(e_i)$计算出来的值，即这个分数应该等于推理中属于正确语义类别中的分数，而这个属于正确语义类别中的分数由$\phi_k(e_i)$计算出来。

### 间隙$\sigma$

间隙$\sigma$在实际计算中，是使用的实例在`seed map`最大分数位置对应到$\sigma$ map的$\sigma$值，这里和推理中的$\sigma$是不一致，所以用损失函数（如下）来约束它。

$$
L_{smooth}=\frac{1}{|S_k|}\sum_{\sigma_i \in S_k}||\sigma_i - \sigma_k||^2
$$

其中，$\sigma_k$是推理中的间隙。

$$
\sigma_k = \frac{1}{|S_k|}\sum_{\sigma_i \in S_k} \sigma_i
$$

### 基础网络

使用`ERFNet`，一种编码解码器结构来作为基础网络，将如网络结构图所示，将解码器分开用两次，分别训练不同的参数，实现不同的效果，效果中将网络输出结果叠加到一起，形成了一个4的通道的张量，第一二通道是`offset`，第三通道是间隙$\sigma$，第四通道是`seed map`。

### `xmap`与`ymap`

`xmap`与`ymap`由如下代码构造而成。其中2048与1024分别图像（`Cityscas数据集`）的宽与高。

```python
xm = torch.linspace(0, 2, 2048).view(1, 1, -1).expand(1, 1024, 2048)
ym = torch.linspace(0, 1, 1024).view(1, -1, 1).expand(1, 1024, 2048)
xym = torch.cat((xm, ym), 0)
```

### 损失函数

除了上面对间隙$\sigma$和`seed map`的分数进行约束的损失之外，还需要优化分割效果的损失，论文中使用二分类损失`Lovasz-hinge loss`，公式如下，其中又一个雅卡尔指数`Jaccard index`的概念，其实就是交叠率。

$$
J_c(y^*, \bar{y})= \frac{|y^*=c \cap \bar{y}=c|}{|y^*=c \cup \bar{y}=c|}
$$

转换为求最小loss

$$
\Delta_{J_c(y^*, \bar{y})} = 1 - J_c(y^*, \bar{y})
$$

求预测像素$i$的`hinge loss`，其中$F_i(x)$是像素$i$的评分函数的值，而$\bar{y}=sign(F_i(x))$，即$F_i(x)$是没有转为标签之前的分数，$sign(\cdot)$是符号函数，大于$0$，则等于$1$，等于$0$，不变，小于$0$，则等于$-1$，$y_i^*$是像素$i$的标签等于$-1$或者$1$，

$$
loss_{hinge} = max(1 - F_i(x)*y_i^*,\ 0)
$$

再进一步拓展到`Lovasz-hinge loss`，$\Delta_j^-$是$\Delta_j$的`Lovasz`拓展。

$$
Loss_{Lovasz\ hinge} = \Delta_j^-(loss_{hinge}(F))
$$

`Lovasz`拓展又是什么呢，`Lovasz`拓展可用于求解次模最小化问题。次模函数的`Lovasz`拓展是一个凸函数，可高效实现最小化，这里的次模函数看了定义，还是懵的，不纠结这个了，还是继续看`Lovasz`拓展吧。给定一个次模函数$f$，`Lovasz`拓展$\hat{f}$如下:

$$
\hat{f}(x) = \sum_{i=0}^{n}\lambda_if(X_{S_i})
$$

其中，

$$
\lambda_i = x_{\pi_{(i)}} - x_{\pi_{(i + 1)}}
$$

$x_{\pi_{(i)}}$是排好序之后的$x$，

$$1\ge x_{\pi_{(1)}} \ge x_{\pi_{(2)}} \ge ... \ge x_{\pi_{(n)}} \ge 0 $$

经过[相关的推到和证明](https://sudeepraja.github.io/Submodular/)，得到最后得到`Lovasz`拓展的次梯度`sub-gradients`将其作为最小化的对象。

$$
g(x) = \sum_{i=1}^{n}(\Delta_{J_c(loss_{hinge}{_{\pi(i)}})}  - \Delta_{J_c(loss_{hinge}{_{\pi(i-1)}})} ) * loss_{hinge}{_{\pi(i)}}
$$

这里只要将$loss_{hinge}{_{\pi(i-1)}}$改成如下公式就可以将二分类`Lovasz-hinge loss`变成多分类`lovasz-softmax loss`

$$
loss =
\begin{cases}
1-F_i(c)  & if \ c = y^*, \\
F_i(c) & otherwise.
\end{cases}
$$

**参考**

[知乎的文章：Lovasz-Softmax loss](https://zhuanlan.zhihu.com/p/41615416)

[CSDN文章：lovasz-softmax loss](https://blog.csdn.net/baidu_27643275/article/details/95487631)

[LovaszSoftmax源码地址](https://github.com/bermanmaxim/LovaszSoftmax)

### 损失拓展

论文中提到了对间隔和像素点中心进行拓展。

- 将间隔由圆变成椭圆的间隔，学习二维（x，y）的间隔

    $$
    \phi_k(e_i)=exp\left(-\frac{||e_{ix}-C_{kx}||^2}{2\sigma_{kx}^2}-\frac{||e_{iy}-C_{ky}||^2}{2\sigma_{ky}^2} \right)
    $$

- 将直接取`seed map`最大值对应的位置作为中心改为取属于对象的`embedding`的均值。

    $$
    \phi_k(e_i)=exp\left(-\frac{||e_i-\frac{1}{|S_k|}\sum_{e_j\in S_k}e_j||^2}{2\sigma_k^2} \right)
    $$

很显然的是，第二个拓展，只能用于训练的时候，因为我们需要确定点属于哪个实例，才能通过求均值的方式求中心，论文中为了比较以上的两种拓展，将`seed map`采样改成了在`ground truth`上采样，这样直接可以确定点属于哪个实例，从而可以顺利的通过求均值的方式求中心。

## 训练策略

由于使用`Cityscapes`数据集，图片比较大`h1024xw2048`，作者先将图片剪切成`500x500`，做了100轮预训练，之后在剪切图片`1024x1024`大小下，进行了50轮的微调，这种方式可以借鉴一下，想起之前还有一种方式，将网络最后的分割层改成改成分类层，在`ImageNet`数据集上做预训练，只能改回来再在分割的数据集上做分割任务。

## 论文小结

从这篇论文中学到了什么呢，我觉得主要还是可学习的间隙，然后的话，算是了解一下了做分割的两个损失函数二分类的`Lovasz-hinge loss`和多分类的`lovasz-softmax loss`，之后在我们的工作中，我想我会去比较一下交叉熵和`lovasz-softmax loss`。

看这篇论文，之前卡了我一下的是，之前一直觉得求中心点是个死环，求不出来中心点，在论文中的推理过程中，中心点需要知道哪些点属于实例，而哪些点属于实例需要由有中心点的高斯函数求出来，最后发现作者用逐步取`seed map`中最大值来确定中心位置和相应位置的间隙，从而可以算哪些点属于实例（$\phi_k(e_i) > 0.5$），逐步求实例中心的这个过程其实有点类似于非最大值抑制求极大值的过程，每个极大值代表一个实例的中心。

这篇论文就大概总结到这里了。
