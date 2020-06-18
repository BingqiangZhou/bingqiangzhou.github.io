---
title: 【日常小结】python模块--tqdm
tags: [日常小结系列]
---

今天总结一下tqdm模块~~以及pytorch框架选择GPU运行程序遇到的一个小问题。~~
tqdm模块，是一个python进度条模块，简单已用。
[tqdm文档](https://tqdm.github.io) [github](https://github.com/tqdm/tqdm) 推荐看github中的README了解如何使用，这个文档好像有点老旧。

<!--more-->

## pytorch框架选择GPU运行程序

~~pytorch框架选择GPU运行程序，发现`os.environ["CUDA_VISIBLE_DEVICES"]="0"`放置位置是有讲究的，需要放在倒入torch模块之前，才行。~~ 

经过测试，发现没有这个问题，之前我们遇到的问题是，程序没有用我自己设定的gpu跑代码，我调整了`config`文件（注：`config`文件中有语句`os.environ["CUDA_VISIBLE_DEVICES"]="0"`）的导入顺序之后，发现解决了问题，因此我错误的认为`os.environ["CUDA_VISIBLE_DEVICES"]="0"`需要在torch模块之前导入才行。

## tqdm模块

### tqdm.tqdm类

```python
tqdm.__init__(iterable=None,
              desc=None,
              total=None,
              leave=True,
              file=None,
              ncols=None,
              mininterval=0.1,
              maxinterval=10.0,
              miniters=None,
              ascii=None,
              disable=False,
              unit='it',
              unit_scale=False,
              dynamic_ncols=False,
              smoothing=0.3,
              bar_format=None,
              initial=0,
              position=None,
              postfix=None,
              unit_divisor=1000,
              write_bytes=None,
              lock_args=None,
              nrows=None,
              gui=False)
```

所有的参数都是可选的，初始化方法返回一个已经装饰了的可迭代器。

#### `iterable`参数

需要用进度条装饰的可迭代的对象，list等等都可以。

#### `desc`参数

`desc`是进度条的前缀，字符串。如下图红框所示。

![进度条的前缀](/assets/images/2020/20200617/desc.png)

#### `total`参数

迭代的总次数，不设置的话，就等于可迭代对象的长度`len(iterable)`，具体用法如下，常用于手动设置更新迭代次数。

```python
with tqdm(total=100) as pbar:
    for i in range(10):
        sleep(0.1)
        pbar.update(10)
```

```python
pbar = tqdm(total=100)
for i in range(10):
    sleep(0.1)
    pbar.update(10)
pbar.close()
```

#### `leave`参数

布尔类型，默认为`True`，`leave`参数表示在迭代结束之后，是否保留进度条状态，如果设置为`False`或者`None`，则在迭代之后，不会保留最后的状态，而变成0，如下图所示。

![`leave`参数](/assets/images/2020/20200617/leave.png)

#### `file`参数

`io.TextIOWrapper`或者`io.StringIO`，默认为`sys.stderr`，表示将进度条信息输出到那里。如下图所示。

![`file`参数](/assets/images/2020/20200617/file.png)

#### `ncols`参数

输出信息所占的宽度，不指定，则为进度条的整个宽度，指定则为指定的宽度，如下图。

![`ncols`参数](/assets/images/2020/20200617/ncols.png)

#### `mininterval`参数

进度条更新的最小时间间隔，默认为0.1秒。如下图。

![`mininterval`参数](/assets/images/2020/20200617/mininterval.png)

更新进度条，其实就是说重新出来一个进度条。

#### `maxinterval`参数

进度条更新的最大时间间隔，默认为10秒，与`mininterval`类似。

#### `miniters`参数

进度条更新的最小迭代次数，当设置为0时，根据CPU性能自适应，指定了最小迭代次数，则经过了多少次迭代之后就会更新进度条。

#### `ascii`参数

`bool`或者`str`，如果不指定或者指定为`False`，会有滑块填充，如上面的图，有黑色的滑块，如果指定`ascii`参数，则不会有滑块出现，而是以`#`填充，并且没有进行完的地方会以数字滚动显示。

#### `disable`参数

`bool`，默认为`False`，如果指定为`True`则禁用了整个进度条，如果设置为`None`，在不是TTY（Teletypes，可以理解为在终端或者控制台上，不会禁用进度条）的情况下，禁用进度条。

经过尝试，在终端中设置为`None`，依然还是会显示进度条，而在jupyter notebook不会显示进度条。

#### `unit`参数

`str`，表示迭代次数的单位，默认是`it`，如下红色框框所示。

![`unit`参数](/assets/images/2020/20200617/unit.png)

#### `unit_scale`参数

如果设定为`1`或者`True`，则会自适应数字单位，如下面的三万多变成了37.5k。
![`unit_scale`参数](/assets/images/2020/20200617/unit_scale.png)

#### `dynamic_ncols`参数

默认为`False`，如果设置了，则会自适应输出的宽`ncols`和高`nrows`。

#### `smoothing`参数

默认为`0.3`，设置范围在0到1之间，表示速度估算的指数移动平均平滑因子，`0`为平均速度，`1`是当前速度/瞬时速度，表示的是在进度条变化的时候，显示的多少次迭代每秒是平均速度还是瞬时速度。（原话：Exponential moving average smoothing factor for speed estimates）

#### `bar_format`参数

进度条的格式，`str`，不同的进度条格式设置会影响性能，默认的格式是`{l_bar}{bar}{r_bar}`，其中`l_bar`是`{desc}: {percentage:3.0f}%|`，`r_bar`是`|{n_fmt}/{total_fmt} [{elapsed}<{remaining},''{rate_fmt}{postfix}`，这里可以设置很多参数，如下`vars: l_bar, bar, r_bar, n, n_fmt, total, total_fmt, percentage, elapsed, elapsed_s, ncols, nrows, desc, unit, rate, rate_fmt, rate_noinv, rate_noinv_fmt, rate_inv, rate_inv_fmt, postfix, unit_divisor, remaining, remaining_s`。
当没有设置`desc`参数的时候，后面的冒号`:`会被自动去掉。

#### `initial`参数

默认值为`0`，表示初始的迭代次数，常用于新开始一个进度条。如下图，从3开始，最后变成50003次迭代。

![`initial`参数](/assets/images/2020/20200617/initial.png)

#### `position`参数

默认为`0`，如果设置为其他数（记为N），它会在进度条前，先输出N个空行。

#### `postfix`参数

与`desc`参数相似，`desc`是前缀，`postfix`是后缀

![`postfix`参数](/assets/images/2020/20200617/postfix.png)

#### `unit_divisor`参数

迭代次数的除数，也可以理解为单位，默认为`1000`，当`unit_scale`参数为`True`的时候，忽略这个参数。

#### `write_bytes`参数

表示写入二进制字节编码还是`unicode`编码，默认为写入`unicode`编码，当`write_bytes`参数为`True`时，写入二进制字节编码。

#### `lock_args`参数

`tuple`类型，刷新中间输出，通过`tqdm.refresh()`方法，获得中间输出.

#### `nrows`参数

与`ncols`参数类似，表示显示进度条的高度.

#### `gui`参数

将进度条使用`matplotlib`去画，进度条从字符串变成了图片。
不过不建议使用改参数，已经被`tqdm.gui.tqdm(...)`取代。


#### `tqdm.update(n=1)`方法

默认`n=1`，常用于手动更新迭代次数。

#### `tqdm.close()`方法

清除进度条，如果指定了`leave=False`，则进度条会被清理掉，反之还会留着。

#### `tqdm.refresh(nolock=False, lock_args=None)`方法

刷新进度条的显示。

#### `tqdm.unpause()`方法

重新开始打印时间，从上次停止的时间开始。

#### `tqdm.reset(total=None)`方法

重设`total`参数

#### `tqdm.set_description(desc=None, refresh=True)`方法
#### `tqdm.set_description_str(desc=None, refresh=True)`方法

重新设置`desc`参数，`set_description_str`方法，没有冒号`:`跟在`desc`参数后。

**后面的一系列方法不再说明，大多数是重新设置初始化方法中的参数。**

### `tqdm.trange()`

与`tqdm.tqdm()`类似，`tqdm.trange()`代替了`tqdm(range(*args), **kwargs)`

### `tqdm.notebook.tqdm()`与`tqdm.notebook.trange()`

![notebook](/assets/images/2020/20200617/notebook.png)

在`IPython`和`Jupyter Notebook`中显示好看一些的进度条，使用方法和`tqdm.tqdm()`、`tqdm.trange()`类似。

### `tqdm.gui.tqdm()`与`tqdm.gui.trange()`

用于GUI的进度条，使用方法和`tqdm.tqdm()`、`tqdm.trange()`类似。

### 实验性模块

好像暂时还不能用。

#### `tqdm.contrib.tenumerate()`

类似于python内建的`enumerate`方法

#### `tqdm.contrib.tzip()`

类似于python内建的`zip`方法

#### `tqdm.contrib.tmap()`

类似于python内建的`tmap`方法

### 自适应打印

```python
from tqdm.auto import tqdm, trange
```

会根据环境的不同，输出不同样式的进度条。如下图所示。

![notebook](/assets/images/2020/20200617/auto-notebook.png)

![ipython](/assets/images/2020/20200617/auto-ipython.png)

## 小结

依旧比较啰嗦，其实主要知道`tqdm`, `trange`的用法就行。

```python
from tqdm.auto import tqdm, trange
```