---
title: 【日常小结】python模块--logging
tags: [日常小结系列]
---

上星期挺忙的，参加了一下学校的数学建模比赛，预测湖南湖北的疫情走势以及疫情对长沙经济的影响。
看了别人数学系的论文之后，发现我们太业余了，哈哈，我们基本就是在网上找了几片论文看了一下，然后选择了一个模型，对疫情数据做了一下拟合。他们我就不说了。。

今天总结一下python模块，logging、argparse、tqdm，好早就想小结一下，一直没有做.（写的有点多，argparse、tqdm独立出来，下两篇）
还有[《神经网络与深度学习》](https://nndl.github.io)中的第七章的网络优化与正则化、第八章的注意力机制，看了好久了，也想总结一下，这几天都总结一下吧。

<!--more-->

## logging模块

logging是python自带的日志模块[官方文档](https://docs.python.org/3/library/logging.html#)，这里主要总结一下Logger、Handler、Formatter对象以及常用的方法。

### Logger对象-`class logging.Logger`

#### 获取日志对象Logger

Logger类不能被直接实例化，需要用`logging.getLogger(name)`来获取日志对象。

#### 常用方法

1. 设置日志对象输出信息的最低级别`setLevel(level)`，相应的[日志级别](#日志级别)
2. 添加处理日志的处理器对象`addHandler(hdlr)`
3. 输出对应级别的信息：`debug(msg, *args, **kwargs)`、`info(msg, *args, **kwargs)`、`warning(msg, *args, **kwargs)`、`error(msg, *args, **kwargs)`、`critical(msg, *args, **kwargs)`、`log(level, msg, *args, **kwargs)`、`exception(msg, *args, **kwargs)`，相应的[日志级别](#日志级别)。

#### 日志级别

日志级别如下表，根日志对象默认的级别是`NOTSET`，而后代日志对象默认是`WARNING`，后代日志对象可以由`getChild(suffix)`方法来获取。

| 级别 | 对应的数值 |
| :----: | :---: |
| `CRITICAL` | 50 |
| `ERROR` | 40 |
| `WARNING` | 30 |
| `INFO` | 20 |
| `DEBUG` | 10 |
| `NOTSET` | 0 |

### Handler对象-`logging.Handler`

[Handler对象](https://docs.python.org/3/library/logging.html#handler-objects)是可以直接实例化的，而且它还有很多子类，如下:

- [StreamHandler](https://docs.python.org/3/library/logging.handlers.html#streamhandler)：
  - `StreamHandler(stream=None)` 
  - 输出日志到`sys.stdout`，`sys.stderr`或者是其他`file-like`文件对象，常用于输出到控制台
- [FileHandler](https://docs.python.org/3/library/logging.handlers.html#filehandler)：
  - `FileHandler(filename, mode='a', encoding=None, delay=False)`
  - 输出日志到文件，继承了StreamHandler
- NullHandler：不做任何处理
- WatchedFileHandler：监测文件打开与关闭操作，输出日志
- BaseRotatingHandler：滚动处理`RotatingFileHandler`，`TimedRotatingFileHandler`的基类
- [RotatingFileHandler](https://docs.python.org/3/library/logging.handlers.html#logging.handlers.RotatingFileHandler)：
  - `RotatingFileHandler(filename, mode='a', maxBytes=0, backupCount=0, encoding=None, delay=False)` 
  - 这个Handler类似于上面的FileHandler，但是它可以管理文件大小。当文件达到一定大小`maxBytes`之后，它会自动将当前日志文件改名，然后创建一个新的同名日志文件继续输出。比如日志文件是app.log。当app.log达到指定的大小之后，RotatingFileHandler自动把文件改名为app.log.1，如果app.log.1已经存在，会先把app.log.1重命名为app.log.2，一直到最后重新创建chat.log，继续输出日志信息，如果`backupCount=5`那么，最多创建备份到app.log.5。
- [TimedRotatingFileHandler](https://docs.python.org/3/library/logging.handlers.html#timedrotatingfilehandler)
  - `TimedRotatingFileHandler(filename, when='h', interval=1, backupCount=0, encoding=None, delay=False, utc=False, atTime=None)`
  - 这个Handler和RotatingFileHandler类似，不过，它没有通过判断文件大小来决定何时重新创建日志文件，而是间隔一定时间就自动创建新的日志文件。重命名的过程与RotatingFileHandler类似，不过新的文件不是附加数字，而是当前时间。其中filename参数和backupCount参数和RotatingFileHandler具有相同的意义。interval是时间间隔.when参数是一个字符串。表示时间间隔的单位，不区分大小写。它有以下取值：
    | 值 | 类型 |
    | :--| :-- |  
    | `S` | 秒 |  
    | `M` | 分 |
    | `H` | 小时 |
    | `D` | 天 |
    | `W0`-`W6` | 每星期（0表示星期一）|
    | `midnight` | 每天凌晨 |
- SocketHandler：远程输出日志到TCP/IP sockets
- DatagramHandler：远程输出日志到UDP sockets
- SysLogHandler：日志输出到系统日志syslog
- NTEventLogHandler：远程输出日志到Windows NT/2000/XP的事件日志
- SMTPHandler：远程输出日志到邮件地址
- MemoryHandler：日志输出到内存中的制定buffer
- HTTPHandler：通过"GET"或"POST"远程输出到HTTP服务器
- QueueHandler：输出日志到队列中
- QueueListener：从队列中接受日志信息

以上这些[logging.Handler子类](https://docs.python.org/3/library/logging.handlers.html)，比较常用的是`StreamHandler`、`FileHandler`、`RotatingFileHandler`、`TimedRotatingFileHandler`。

#### 常用方法

1. 设置处理器处理信息最低等级`setLevel(level)`
2. 设置输出日志信息格式`setFormatter(fmt)`，fmt为[Formatter对象](#Formatter对象-`logging.Formatter`)

### Formatter对象-`logging.Formatter`

Formatter对象用于规定输出日志的格式，这些格式其实是来源于LogRecord对象的属性，不过可以通过字符串的方式直接创建，如[实例代码](#实例代码)中logging.Formatter。

| 格式 | 描述 |
| :-- | :-- |
| `%(asctime)s` | 调用日志输出函数的的时间，默认格式像这样`2003-07-08 16:49:45,896` |
| `%(created)f` | 与`%(asctime)s`类似，也是调用日志输出函数的时间，但是输出格式不同，输出time.time()，时间戳格式，像这样`1592202653.744816`的数字 |
| `%(filename)s` | 调用日志输出函数是在哪个文件创建的文件名 |
| `%(funcName)s` | 调用日志输出函数是在哪个方法中的方法名 |
| `%(levelname)s` | 调用日志输出函数对应的[级别](#日志级别)名称 |
| `%(levelno)s` | 调用日志输出函数对应的[级别](#日志级别)数字 |
| `%(lineno)d` | 调用日志输出函数对应是在代码文件中的哪一行  （有可能不存在） |
| `%(message)s` | 日志消息，由我们调用日志输出函数中指定 |
| `%(module)s` | 调用日志输出函数是在哪个模块中创建的模块名 |
| `%(msecs)d` | 与`%(asctime)s`类似，也是调用日志输出函数的时间，但是输出格式不同，输出的是毫秒 |
| `%(name)s` | Logger对象的名字 |
| `%(pathname)s` | 调用日志输出函数的模块的完整路径名（可能不存在）|
| `%(process)d` | 调用日志输出函数属于哪个进程的id（可能不存在）|
| `%(processName)s` | 调用日志输出函数属于哪个进程的名称（可能不存在） |
| `%(relativeCreated)d` | 调用日志输出函数的相对时间，自Logger对象创建以来的毫秒数 |
| `%(thread)d` | 调用日志输出函数属于哪个线程的id（可能不存在）|
| `%(threadName)s` | 调用日志输出函数属于哪个线程的名称（可能不存在）|

格式就大概讲到这里，具体可以看[实例代码](#实例代码)。

### 实例代码

```python
import logging
import os

class Logger():

    def __init__(self, logger_path):
        self.logger = logging.getLogger()
        self.logger.setLevel(logging.DEBUG)
        # 输出到文件
        self.logfile = logging.FileHandler(logger_path)
        self.logfile.setLevel(logging.DEBUG)
        # formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        formatter = logging.Formatter('%(asctime)s -%(filename)s:%(lineno)s - %(levelname)s - %(message)s')
        self.logfile.setFormatter(formatter)
        # 输出到控制台
        self.logdisplay = logging.StreamHandler()
        # self.logdisplay.setLevel(logging.DEBUG)
        self.logdisplay.setLevel(logging.INFO)
        self.logdisplay.setFormatter(formatter)
        self.logger.addHandler(self.logfile)
        self.logger.addHandler(self.logdisplay)

    def get_logger(self):
        return self.logger
```

```python
from logger import Logger

logger = Logger('./test.log')
my_logger = logger.get_logger()

my_logger.info('hello, world')
my_logger.debug('hello, world')
## `debug(msg, *args, **kwargs)`
## `info(msg, *args, **kwargs)`
## `warning(msg, *args, **kwargs)`
## `error(msg, *args, **kwargs)`
## `critical(msg, *args, **kwargs)`
## `log(level, msg, *args, **kwargs)`
## `exception(msg, *args, **kwargs)`
```

## 小结

上面写了这么多，总结一起，主要就是上面的实例代码这部分代码，全文内容应该差不多可以满足我们大多数日常开放的使用，就总结到这了，用过滤器对象过滤输出等等其他内容就等待探索了，[文档在此](https://docs.python.org/3/library/logging.html#logrecord-attributes)。

本来想logging、argparse、tqdm三个模块放一起的，发现写的有点多（啰里八嗦的），argparse、tqdm模块还是独立写出来吧。
