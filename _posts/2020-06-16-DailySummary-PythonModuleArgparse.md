---
title: 【日常小结】python模块--argparse
tags: [日常小结系列]
---

今天总结一下argparse和tqdm这两个python模块。
[官方文档](https://docs.python.org/3/library/argparse.html)

<!--more-->

## argparse模块

argparse模块与logging一样都是python自带的模块，这个模块让构建一个命令行工具(如下图)变得简单。

![命令行工具](/assets/images/2020/20200616/command-line.png)

### 创建解析器

```python
class argparse.ArgumentParser(prog=None, usage=None, description=None, epilog=None, parents=[], formatter_class=argparse.HelpFormatter, prefix_chars='-', fromfile_prefix_chars=None, argument_default=None, conflict_handler='error', add_help=True, allow_abbrev=True)
```

创建一个`ArgumentParser`对象的可设置的参数，有上面这么多，不过我都只自定义设置过一个参数`description`，其他参数都默认，这个`description`参数呢，是`usage`与`agrument`之间的一个对程序的描述，可见上面的图。[`ArgumentParser`文档](https://docs.python.org/3/library/argparse.html#argumentparser-objects)

### 加入参数

```python
ArgumentParser.add_argument(name or flags...[, action][, nargs][, const][, default][, type][, choices][, required][, help][, metavar][, dest])
```

加入参数的过程是用上面创建解析器步骤的解析器对象调用`add_argument`方法来完成。[`add_argument`方法文档](https://docs.python.org/3/library/argparse.html#the-add-argument-method)，这块用的比较多的，我们一个一个参数看一下。

#### `name or flags`参数

`name or flags`表示参数的名字，可以使用多个名字，一般有下面两种用法，分别表示为可选参数和必选参数。

```python
parser.add_argument('-f', '--foo') # 表示可选参数
parser.add_argument('bar') # 表示必须的参数
```

其中表示可选参数的形式，也可以通过`required`参数来将可选参数作为必选参数。

#### `action`参数

`action`参数是当解析参数时，当前参数有使用到的时候，调用action类来处理它。python提供了许多`action`，同时我们也可以自己实现。

- `store`，`action`参数的默认值，只存储参数值。
- `store_const`存储固定值，常用于可选参数。
- `store_true` 与 `store_false`，存储布尔类型的值，默认为`True`或者`False`，相当于`default`参数设置为了`True`或`False`。
- `append`存储一个列表，将值追加到列表，常用于可选参数多次指定，实例如下：

    ```python
    >>> parser = argparse.ArgumentParser()
    >>> parser.add_argument('--foo', action='append')
    >>> parser.parse_args('--foo 1 --foo 2'.split())
    Namespace(foo=['1', '2'])
    ```

- `append_const`也是存储一个列表，与`append`类似，不过追加的是常量。
  
    ```python
    >>> parser = argparse.ArgumentParser()
    >>> parser.add_argument('--str', dest='types', action='append_const', const=str)
    >>> parser.add_argument('--int', dest='types', action='append_const', const=int)
    >>> parser.parse_args('--str --int'.split())
    Namespace(types=[<class 'str'>, <class 'int'>])
    ```

- `count`存储参数出现的次数，未出现则为0。

    ```python
    >>> parser = argparse.ArgumentParser()
    >>> parser.add_argument('--verbose', '-v', action='count', default=0)
    >>> parser.parse_args(['-vvv'])
    Namespace(verbose=3)
    ```

- `help`，输出帮助信息，如输出最上面那张图那样的内容，默认添加到解析器中，使用`-h`或者`-help`调用。
- `version`，输出版本信息。

    ```python
    >>> import argparse
    >>> parser = argparse.ArgumentParser(prog='PROG')
    >>> parser.add_argument('--version', action='version', version='%(prog)s 2.0')
    >>> parser.parse_args(['--version'])
    PROG 2.0
    ```

- `extend`，存储一个列表将参数值加入到这个列表。

    ```python
    >>> parser = argparse.ArgumentParser()
    >>> parser.add_argument("--foo", action="extend", nargs="+", type=str)
    >>> parser.parse_args(["--foo", "f1", "--foo", "f2", "f3", "f4"])
    Namespace(foo=['f1', 'f2', 'f3', 'f4'])
    ```

- 自定义`action`，没用过，这里贴上示例代码。

    ```python
    >>> class FooAction(argparse.Action):
    ...     def __init__(self, option_strings, dest, nargs=None, **kwargs):
    ...         if nargs is not None:
    ...             raise ValueError("nargs not allowed")
    ...         super(FooAction, self).__init__(option_strings, dest, **kwargs)
    ...     def __call__(self, parser, namespace, values, option_string=None):
    ...         print('%r %r %r' % (namespace, values, option_string))
    ...         setattr(namespace, self.dest, values)
    ...
    >>> parser = argparse.ArgumentParser()
    >>> parser.add_argument('--foo', action=FooAction)
    >>> parser.add_argument('bar', action=FooAction)
    >>> args = parser.parse_args('1 --foo 2'.split())
    Namespace(bar=None, foo=None) '1' None
    Namespace(bar='1', foo=None) '2' '--foo'
    >>> args
    Namespace(bar='1', foo='2')
    ```

#### `nargs`参数

`nargs`参数关联不同数目的命令行参数到单一动作，也就是说`nargs`参数来规定命令行某个参数的个数。支持的值有`N`，`?`，`*`，`+`，`argparse.REMAINDER`，当`nargs`参数没有指定值，则参数的个数又`action`来决定。其中：

- `N`表示参数后的N个值组成为一个列表。
- `?`表示的是多种情况，当参数没有出现的时候，参数的值是`defalut`参数的值，当参数后面没有跟着值的时候，参数的值是`const`参数的值，当参数出现并且后面有值的时候才参数的值才会是这个值。常用于输入输出文件，如下实例代码，没有输入输出文档，则从控制台读取以及写入。
    
    ```python
    >>> parser = argparse.ArgumentParser()
    >>> parser.add_argument('infile', nargs='?', type=argparse.FileType('r'),
    ...                     default=sys.stdin)
    >>> parser.add_argument('outfile', nargs='?', type=argparse.FileType('w'),
    ...                     default=sys.stdout)
    >>> parser.parse_args(['input.txt', 'output.txt'])
    Namespace(infile=<_io.TextIOWrapper name='input.txt' encoding='UTF-8'>,
        outfile=<_io.TextIOWrapper name='output.txt' encoding='UTF-8'>)
    >>> parser.parse_args([])
    Namespace(infile=<_io.TextIOWrapper name='<stdin>' encoding='UTF-8'>,
        outfile=<_io.TextIOWrapper name='<stdout>' encoding='UTF-8'>)
    ```

- `*`表示参数后面跟的所有值，组合成为一个列表，作为这个参数的值；需要注意的是：必须参数中`nargs`参数中为`*`的情况不要出现多次，这样会引起冲突，而可选残生是没关系的。
- `+`与`*`相似，也是将参数后面跟的值，组合成一个列表，不同的是`+`要求参数后面跟的值至少又一个值。
- `argparse.REMAINDER`表示所有对不上号的参数组合成一个列表。

#### `const`参数

`const`参数是指定参数的常量值，当使用了`store_const`和 `append_const`动作的时候，必须指定const参数。

#### `default`参数

`default`参数指定参数的默认值，当`default`参数等于`argparse.SUPPRESS`，且参数没有出现时，则参数对应属性不存在。

#### `type`参数

`type`参数是参数对应的类型，`type`可以是任意可以调用的对象，而且传入字符串，返回操作后的值。

#### `choices`参数

`choices`参数传入一个容器，参数值只能从容器中选取一个，任何容器都可作为`choices`值传入，比如list 对象，set 对象以及自定义容器等。

#### `required`参数

`required`参数用于将可变参数变为必须参数。

#### `help`参数

`help`参数表示描述参数的字符串，由于帮助字符串支持`%-formatting`（示例如下），因此在这个帮助字符串中显示`%`，必须将其转义为`%%`。

```
parser.add_argument('bar', nargs='?', type=int,default=42, help='the bar to %(prog)s (default: %(default)s)')
```

#### `metavar`参数

使用`metavar`来指定一个参数的替代名称，需要注意的是，它只是替代了显示的名字，而正在调用的参数名称是由`dest`参数决定的。不使用`metavar`参数的默认情况下，对于位置参数动作，`dest`值将被直接使用，而对于可选参数动作，`dest` 值将被转为大写形式。 因此，一个位置参数`dest='bar'`的引用形式将为`bar`，一个带有单独命令行参数的可选参数`--foo`的引用形式将为`FOO`。

#### `dest`参数

设置解析参数所返回对象的属性名的，默认情况下，会接受第一个长选项字符串并去掉开头的`--`字符串来生成`dest`的值，如果没有提供长选项字符串，则`dest`将通过接受第一个短选项字符串并去掉开头的`-`字符来获得；如果名称内部有`-`字符都将被转换为`_`字符，来确保字符串是有效的属性名称。

### 解析参数

```python
ArgumentParser.parse_args(args=None, namespace=None)
```

`args`是要解析的字符串列表，默认值是从`sys.argv`获取。
`namespace`用于获取属性的对象，默认值是一个新的空`Namespace`对象，这里的`Namespace`是一个具有可读字符串表示形式的对象。

解析参数，在这里不多说了，给一个示例代码。

### 示例代码
```python
parser = argparse.ArgumentParser(description='train or val for our model which no embeding')

parser.add_argument("--exp", type=str, default="train_without_embeding", help="experiment")
parser.add_argument("--VOC2012_root_path", type=str, default="/home/mist/datasets/VOCdevkit/VOC2012",
                        help="the root of VOC2012 dataset")
parser.add_argument("--num_epochs", type=int, default=100, help="number of epoch")
parser.add_argument('--use_gpu', action='store_true',default=True, help='whether to use GPU')
parser.add_argument('--gpu', type=str, default="0", help='choose GPU')
parser.add_argument('--optimizer', type=str, default="Adam", choices=['SGD', 'Adam'], help='choose optimizer')

args = parser.parse_args()
```

### 小结

感觉这次还是有点在翻译官方文档的感觉，不过也算是将官方文档大概的看了一下，明天继续总结一下tqdm模块，加油，奥利给！