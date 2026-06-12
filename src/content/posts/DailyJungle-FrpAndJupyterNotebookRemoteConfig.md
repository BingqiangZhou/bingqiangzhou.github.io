---
title: "【实践记录】frp实现内网穿透以及配置Jupyter Notebook远程连接"
published: 2020-06-18
description: "最近我们用到了另一款基于ngrok内网穿透应用natapp，将校内实验室主机映射到外网来使用，我出于好奇搜了一下natapp，也是第一次知道内网穿透这个词，再去搜ngrok，又发现了几款内网穿透的工具。比如frp，pagekite，localtunnel。"
lang: zh
tags: ["实践记录"]
---

最近我们用到了另一款基于`ngrok`内网穿透应用`natapp`，将校内实验室主机映射到外网来使用，我出于好奇搜了一下`natapp`，也是第一次知道内网穿透这个词，再去搜`ngrok`，又发现了几款内网穿透的工具。比如`frp`，`pagekite`，`localtunnel`。



## 内网穿透配置

相关开源的内网穿透工具的地址如下：

- [ngrok](https://github.com/inconshreveable/ngrok)
- [frp](https://github.com/fatedier/frp)
- [pagekite 的 python 开源实现 pypagekite](https://github.com/pagekite/PyPagekite)
- [localtunnel](https://github.com/localtunnel/localtunnel)

### 为什么选择 frp

接着上面的几个开源工具来说，其中`ngrok`是 1.x 的版本，2.x 之后内，不开源了，其实也是可以理解的，他们也要吃饭（听说 1.x 又许多 bug 没解决，不过我没使用过也不知道），看文档配置不怎么简单。`frp`的话，简单，我基本上几分钟就看懂是怎么一回事了，`pypagekite`的话执行 python 语句来配置服务，后面跟一大串命令参数，最后一个`localtunnel`，是基于 js 开发的，还需要先搭建 node.js 包管理平台 npm（node package manager）来弄，直接就放弃这个选项了。
**由于配置简单，我选择了用 frp（fast reverse proxy）玩一下**

### frp 内网穿透过程

![架构图](/assets/images/2020/20200618/architecture.png)

看上面的架构图，大概是在外网环境下运行 frp 服务端，而在内网环境下运行 frp 客户端，服务端与客服端形成通道，可以进行连接，外网下用户访问服务端，服务端在与客服端通信得到请求访问的结果，总结为一个词就是反向代理。

#### 什么是正向代理、反向代理

先说一下正向代理，正向代理是代理了客服端，代理与服务端通信，代替客户端与服务端的直接通信。通俗理解：可以说是正向代理是代表客户（客户端）与厂商（服务端）通信，像是代购的角色。

- [客户端 <一>  代理] 一> 服务端

相反，反向代理就是代理了服务端，代理与服务端通信，代替服务端与客户端的直接通信。通俗理解：反向代理则是是代表厂商（服务端）与客户（客户端）通信，像是经销商的角色。

- 客户端 一> [代理  <一> 服务端]

**正向代理隐藏真实客户端，反向代理隐藏真实服务端**

### 配置 frp

#### 1、下载 frp

在[frp github 库的发布的页面](https://github.com/fatedier/frp/releases)下载对应的对应系统的 frp 工具。

#### 2、配置 ssh 访问

- 2.1、配置服务端

    在外网环境下的服务器（我这里是腾讯云的学生服务器），配置`frps.ini`文件中的`bind_port`，给服务器设置开通一个访问的端口。

    ```ini
    [common]
    bind_port = 7000
    ```

- 2.2、启动服务端
  
    ```shell
    ./frps -c ./frps.ini
    ```

- 2.3、配置客户端

    在内网环境下的服务器（我这里是学校的服务器），配置`frpc.ini`如下，其中`server_addr`对应外网下服务器的地址（域名），`server_port`对应上面 frps 配置的端口。

    ```ini
    [common]
    server_addr = x.x.x.x
    server_port = 7000

    [ssh]
    type = tcp
    local_ip = 127.0.0.1
    local_port = 22
    remote_port = 6000
    ```

- 2.4、启动客服端
  
    ```shell
    ./frpc -c ./frpc.ini
    ```

- 2.5、测试 ssh 链接

    ```shell
    ssh test@x.x.x.x -p 6000
    ```
    
    这里`test`需要改成对应的要登录的账户名，`@`后面为服务器地址（域名），`-p`后面是内网服务器 ssh 对应开通的端口。

#### 3、配置 web 服务访问

- 3.1、配置服务端

    在外网环境下的服务器，配置`frps.ini`文件中的`vhost_http_port`，给服务器设置开通一个 web 服务访问的端口。

    ```ini
    [common]
    bind_port = 7000
    vhost_http_port = 8080
    ```

- 3.2、启动服务端
  
    ```shell
    ./frps -c ./frps.ini
    ```

- 3.3、配置客户端

    在内网环境下的服务器，配置`frpc.ini`如下，其中`server_addr`对应外网下服务器的地址（域名），`server_port`对应之前的 frps 配置的端口，配置本地的端口，`custom_domains`是外网下服务器的域名，一般使用二级域名。

    ```ini
    [common]
    server_addr = x.x.x.x
    server_port = 7000

    [web]
    type = http
    local_port = 80
    custom_domains = www.example.com
    ```

    **也可以配置多个 web 服务**，这里我就配置了两个 web 服务，一个为 jupyter notebook 准备的，一个为 tensorboard 可视化准备的。设置多个 web 服务，只需要在后面加数字就行。

    ```ini
    [common]
    server_addr = x.x.x.x
    server_port = 7000

    [web1]
    type = http
    local_port = 80
    custom_domains = site1.example.com
    
    [web2]
    type = http
    local_port = 81
    custom_domains = site2.example.com
    ```

- 3.4、启动客服端
  
    ```shell
    ./frpc -c ./frpc.ini
    ```

- 3.5、测试 web 访问

    ```shell
    http://site1.example.com:7000
    http://site2.example.com:7000
    ```

#### 4、仪表盘

- 4.1、配置仪表盘

    设置仪表盘，可以查看，链接的状态以及使用的流量，在服务端`frps.ini`中设置仪表盘的端口`dashboard_port`，可以设置用户名和密码，不设置的话，默认都是 admin。

    ```ini #frps.ini
    [common]
    dashboard_port = 7500
    dashboard_user = admin
    dashboard_pwd = admin
    ```

- 4.2、测试仪表盘访问
    
    访问`http://x.x.x.x:7500`。

    ![仪表盘](/assets/images/2020/20200618/dashboard.png)


#### 5、其他内容

4.1、web 服务可以设置 https，要求是有域名证书，具体操作看[文档](https://github.com/fatedier/frp/blob/master/README.md#enable-https-for-local-http-service)

4.2、还有其他一些配置，比如[P2P 模式](https://github.com/fatedier/frp/blob/master/README.md#p2p-mode) 等等其他的请看[文档](https://github.com/fatedier/frp/blob/master/README.md)

## jupyter notebook 配置远程连接

配置 jupyter 远程访问，大概需要一下三个步骤，密码可以不设置，不过设置密码也会相对方便一点，在不设置密码的情况下，启动 jupyter notebook 会自动生成一个 token，这个 token 作为链接的一部分，会比较难记。

### 1、生成 notebook 配置文件

执行以下命令，会在用户目录下生成的配置文件`.jupyter/jupyter_notebook_config.py`，之后在这个文件中再进行配置。

```shell
jupyter notebook --generate-config
```

### 2、生成密码

输入下面的命令，会在用户目录下生成一个保存有密码的哈希值的`json`文件，`.jupyter/jupyter_notebook_config.json`。

```shell
jupyter notebook password
```

### 3、修改配置文件

在用户目录下的`.jupyter/jupyter_notebook_config.py`中找到下面几行取消注释并修改，这几行分别对应修改可以访问的 ip、启动 jupyter notebook 时是否开启浏览器，以及 jupyter notebook 服务对应的接口，**其实直接将下面的几行复制到文件也可以**。

```python
c.NotebookApp.ip = '*'
c.NotebookApp.open_browser = False
c.NotebookApp.port = 8888
```

**注意：如果用 frp 做内网穿透的话，这里的端口需要对应上面 frp 客户端 web 服务配置的端口号，tensorboard 可视化等等其他 web 服务也是一样。**

### 4、启动 jupyter notebook 并在后台运行

使用`nohup`命令后台运行 jupyter notebook，并将输出的内容追加的内容输出到`jupyter.out`文件中，同时将错误信息也输出到文件中。

```shell
nohup jupyter notebook >>jupyter.out 2>&1 &
```

### 拓展知识

- `nohup`命令语法
    - nohup Command [ Arg … ] [ & ]
  
    `nohup`加上需要后台执行的命令以及命令的参数`Command [ Arg … ]`，以`&`结束

- `>>`表示追加，`>`表示覆盖。
- `2>&1`：0 表示键盘输入，1 表示标准输出（屏幕输出），2 表示错误输出。

## 总结

算是知道了几个内网穿透的工具，在使用的过程中，由于腾讯云服务器的带宽的限制，访问 tensorboard 的时候，加载图片有些慢，所以其实有这方面的真实需求，可以使用那些付费的内网穿透工具，例如 natapp，有很多套餐，但是都不贵。


ssh、http、仪表盘的配置合并到一起的文件如下：

外网服务器`frps.ini`:

```ini
[common]
;ssh开通的端口，可以改
bind_port = 7000
;http开通的端口，可以改
vhost_http_port = 8080  
;仪表盘开通的端口，可以改
dashboard_port = 7500
;仪表盘账户名（可选），可以改
dashboard_user = admin
;仪表盘密码（可选），可以改  
dashboard_pwd = admin
```

内网服务器`frpc.ini`:

```ini
[common]
;外网服务器地址，需要改
server_addr = x.x.x.x
;外网服务器端口，可以改
server_port = 7000

[ssh]
;协议类型，不用改
type = tcp
;本地地址，不用改
local_ip = 127.0.0.1
;本地ssh的端口，不用改
local_port = 22
;远程ssh的端口，可以改
remote_port = 6000

;ssh访问方式：ssh 用户名@外网服务器地址 -p 远程ssh端口remote_port

[web1]
;协议类型，不用改
type = http
;本地地址，可以改，需要对应web服务的端口，如jupyter以及tensorboard远程访问端口需要设置为这里的端口
local_port = 80
;对应外网服务器二级域名的，需要改，而且二级域名需要添加到域名记录列表
custom_domains = site1.example.com

;web访问方式：外网服务器二级域名:外网服务器端口号，如http://site1.example.com:7000


[web2]
;协议类型，不用改
type = http
;本地地址，可以改，需要对应web服务的端口，如jupyter以及tensorboard远程访问端口需要设置为这里的端口
local_port = 81
;对应外网服务器二级域名的，需要改，而且二级域名需要添加到域名记录列表
custom_domains = site2.example.com

;web访问方式：外网服务器二级域名:外网服务器端口号，如http://site2.example.com:7000
```