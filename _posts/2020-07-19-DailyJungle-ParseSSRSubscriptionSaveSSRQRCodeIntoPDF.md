---
title: 【日常杂耍】解析SSR订阅信息，将SSR信息保存到二维码中并保存到PDF中
tags: [日常杂耍系列]
---

今天放弃了收费的`shadowsocks`小火箭，转向了免费的`potatso lite`，这个过程是挺有意思的。

<!--more-->

放弃`shadowsocks`的原因是：它经常更新，有时候一天一更，而我又有强迫症，它一更新我就想更新，不仅如此，共享的`Apple ID`也经常要换，每次更换ID之后，`shadowsocks`都需要重新下载，SSR订阅也需要更新添加，这个过程操作太多了，放弃了。

放弃了`shadowsocks`，需要一个新的替代方案，刚开始，我想的是自己编译[`shadowsocks`](https://github.com/WuChuming/shadowsocks-iOS)，还没开始尝试，又在GitHub找到了一个提供了`ipa`文件的项目，[Outline clients](https://github.com/Jigsaw-Code/outline-client)，这时问题又转移了，变成了如何安装`ipa`文件的问题，第一想法是使用爱思助手安装，可惜的是爱思助手还没有支持`macOS Big Sur`，我有需要转向其他方法，看到知乎的文章[如何在手机上安装IPA? 讲四种方法！再也不怕应用下架了！](https://zhuanlan.zhihu.com/p/95760925)，准备使用捷径来操作，而还没等操作，看到了去年玩捷径时的留下的`TestFlight`软件大全就执行了一下，这一执行，又发现了新大陆，其中有支持`shadowsocks`的app，不过人数都满了，我开始搜支持`shadowsocks`的app内测链接，然后搜到了这个[TestFlight 邀请分享：iOS 应用 测试版收集清单](https://www.igfw.net/archives/13944)，其中有十几个符合要求的应用，而且有一个`potatso lite`的测试人数没满，我开始了测试，很快，我就遇到了两个问题，订阅无法解析，而且还有广告，这时又有点忍不了了，开始又开始搜了起来，然后发现`potatso lite`是免费了，我登上了我美区的`Apple ID`，下载了并发现没有广告，虽然用其他方式也可以SSR连接信息，但是我还是开始研究订阅的问题。

## 订阅连接

通过[ss和ssr链接解析](https://github.com/xiaoliang8006/SSR)，知道了`shadowsocks`链接是通过`Base64`进行编码的，尝试用`Base64`订阅连接返回结果，得到了许多SSR链接，中间以`\n`隔开，而其中SSR链接的编码方式是[ss和ssr链接解析](https://github.com/xiaoliang8006/SSR)中说的方式，得到了SSR链接之后，使用`potatso lite`添加服务器，并不太方便，所以想着把它弄成二维码，而二维码图片太多也不好传文件，所以将它们保存到PDF中。

## 将SSR链接保存到二维码中

将信息存到二维码中，使用的是[qrcode](https://pypi.org/project/qrcode/)模块，简单易用。

```python
import qrcode
img = qrcode.make('Some data here')
```

## PDF将图片存到pdf文件中

通过poillow模块[Convert Images to PDF using Python](https://datatofish.com/images-to-pdf-python/)，简单示例如下。

```python
from PIL import Image

image1 = Image.open(r'\Users\Ron\Desktop\Test\image1.png')
image2 = Image.open(r'\Users\Ron\Desktop\Test\image2.png')
image3 = Image.open(r'\Users\Ron\Desktop\Test\image3.png')

im1 = image1.convert('RGB')
im2 = image2.convert('RGB')
im3 = image3.convert('RGB')

imagelist = [im2, im3]

im1.save(r'\Users\Ron\Desktop\Test\myImages.pdf',save_all=True, append_images=imagelist)
```

[其中`save_all`是必须等于True的](https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html?highlight=pdf#pdf)

通过[FPDF模块](https://github.com/alexanderankin/pyfpdf)，简单示例如下。

```python
from fpdf import FPDF

document = FPDF()
document.add_page()
document.set_font('Arial', size=12)
document.cell(w=0, txt="hello world")
document.output("hello_world.pdf")
```

## pip安装来自Github的包

示例如下，参考链接为[Using the Command Line to Install Packages from GitHub](https://medium.com/i-want-to-be-the-very-best/installing-packages-from-github-with-conda-commands-ebf10de396f4)

GitHub链接：`https://github.com/yourname/projectname`

```shell
pip install git+git://github.com/yourname/projectname.git
```

## 完整代码

最简单的方式是解析好，放在腾讯服务器上。

```python
import base64
import requests
from pprint import pprint
import pandas as pd
import qrcode
import os
from PIL import Image
from fpdf import FPDF

def fill_padding(base64_encode_str):

    need_padding = len(base64_encode_str) % 4 != 0
    if need_padding:
        missing_padding = 4 - need_padding
        base64_encode_str += '=' * missing_padding
    return base64_encode_str

def base64_decode(base64_encode_str):
    base64_encode_str = fill_padding(base64_encode_str)
    return base64.urlsafe_b64decode(base64_encode_str).decode('utf-8')

subscription_url = 'XXXXXXXXXXXX'

response = requests.get(subscription_url)
if response.status_code == 200:
    ssr_base64_strs = response.text
    ssr_strs = base64_decode(ssr_base64_strs)
    ssr_list = ssr_strs.split('\n')

    qrcodes_dir = 'ssr qrcodes'
    if os.path.exists(qrcodes_dir) == False:
            os.mkdir(qrcodes_dir)
    ssr_names = []
    pdf = FPDF('P', 'mm', (240, 240))
    for i, ssr in enumerate(ssr_list):
        temp_ssr = ssr.replace('ssr://', '').replace('_', '/').replace('-', '+')
        ssr_name = base64_decode(temp_ssr).split('.')[0].split('-')[0]
        ssr_names.append(ssr_name)
        pdf.add_page()
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(20, 10, ssr_name)
        img = qrcode.make(ssr)
        img_name = os.path.join(qrcodes_dir, ssr_name + '.png')
        img.save(img_name)
        pdf.image(img_name, 20, 20, 200)
    pdf.output(qrcodes_dir+'.pdf', 'F')
    ssrs_dict = {'server name': ssr_names, 'ssr link': ssr_list}
    df = pd.DataFrame.from_dict(ssrs_dict)
    df.to_csv('ssr_links.txt', sep='\n', header=False, index=False)
```
