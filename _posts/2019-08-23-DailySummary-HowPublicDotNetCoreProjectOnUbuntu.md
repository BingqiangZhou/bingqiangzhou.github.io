---
title: 【日常小结】在Ubuntu18.04 LTS部署DotNet Core相关项目
tags: [日常小结系列]
---

记录一下部署`DotNet Core`项目到Ubuntu的过程，包括开发并发布项目、配置`DotNet Core`环境、安装`Nginx`配置反向代理服务器、使用`supervisor`管理进程，让`DotNet Core`应用程序一直运行。

<!--more-->

在这里使用`MobaXterm`工具连接Linux与上传下载文件（`SFTP`），[MobaXterm Pro激活方法](https://github.com/DoubleLabyrinth/MobaXterm-keygen)

## 开发并发布项目
### 一个Web项目小技巧
由于项目默认的启动端口是5001和5002，我们可以添加一个json文件如（`host.json`）用其配置路径与端口。
修改`Program.cs`中的`CreateWebHostBuilder`方法代码（以`.Net Core MVC`项目为例）
**修改前**
```csharp #Program.cs
public static IWebHostBuilder CreateWebHostBuilder(string[] args)
            => WebHost.CreateDefaultBuilder(args).UseStartup<Startup>();
```
**修改后**
```csharp #Program.cs
public static IWebHostBuilder CreateWebHostBuilder(string[] args)
        {
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("host.json", optional: true)
                .Build();

            var host = WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>()
                .UseConfiguration(config);

            return host;
        }
```
`host.json`文件（放在`Program.cs`同目录下）
```json #host.json
{
  "urls": "http://localhost:8080;"
}
```

### 参考链接
[.net core 修改网站启动端口](https://blog.csdn.net/yenange/article/details/81675594)
 
## 配置.Net Core环境
### 配置微软秘钥和源
```shell
$ wget -q https://packages.microsoft.com/config/
$ ubuntu/18.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
$ sudo dpkg -i packages-microsoft-prod.deb
```
### 安装.NET SDK
```shell
$ sudo add-apt-repository universe
$ sudo apt-get install apt-transport-https
$ sudo apt-get update
$ sudo apt-get install dotnet-sdk-2.2
```
**注意这里安装的dotnet-sdk版本最好与开发时候的版本一致。**
### 验证是否正确安装
输入dotnet出现以下内容即为正确安装，如果出现`'dotnet' is not recognized as an internal or external command`的错误，尝试重新打开终端，未解决，则重新执行上面两步，未解决，则反馈问题或者搜索相关资料（博客等等）。
```
Usage: dotnet [options]
Usage: dotnet [path-to-application]
Options:
  -h|--help         Display help.
  --info            Display .NET Core information.
  --list-sdks       Display the installed SDKs.
  --list-runtimes   Display the installed runtimes.
path-to-application:
  The path to an application .dll file to execute.
```
### 发布项目
使用`dotnet publish`命令发布项目，或使用编译器如（Visual Studio）发布项目。
将应用程序目录`bin\release\netcoreapp2.1\`下的`publish`目录上传到Ubuntu，定位到`publish`目录执行命令`dotnet XXX（应用程序名）.dll`运行程序。

### 参考链接
[.NET Tutorial - Hello World in 10 minutes](https://dotnet.microsoft.com/learn/dotnet/hello-world-tutorial/install)
[.NET Core程序发布到Ubuntu系统](https://blog.csdn.net/songjuntao8/article/details/53912304)
 
## 安装Nginx配置反向代理服务器
### 安装
```shell
$ sudo apt-get install nginx
```
### 启动
```shell
$ sudo service nginx start
```
### 验证是否正确安装
打开浏览器访问服务器，会显示Nginx欢迎页面则已正确安装。
### 配置反向代理到应用程序
在`/etc/nginx/sites-enabled/`文件夹下创建如下内容的`自定义名字.conf`文件
```nginx
server{
        listen 80;
        server_name bingqiangzhou.cn www.bingqiangzhou.cn; # 这一句为指向服务器的域名配置，无域名指向服务器，可去掉
        location / {
                proxy_pass http://localhost:8080; # 对应第一步`host.conf`文件的`urls`
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection keep-alive;
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
        }
}
```
### 配置SSL
将已获取到的`1_www.domain.com_bundle.crt`证书文件和`2_www.domain.com.key`私钥文件从本地目录上传到服务器的`/etc/nginx/`文件夹下（其他文件夹下同样可以），在下面的配置中取绝对路径即可。
修改`/etc/nginx/sites-enabled/`文件夹下修改`自定义名字.conf`文件内容为以下内容。
```nginx
server {
    listen 80;
    server_name bingqiangzhou.cn www.bingqiangzhou.cn; # 你的域名
    rewrite ^(.*)$ https://$host$1 permanent;# 把http的域名请求转成https
}


server {
     listen 443 ssl; #SSL 访问端口号为 443
     server_name bingqiangzhou.cn; #填写绑定证书的域名
     ssl_certificate /etc/nginx/1_bingqiangzhou.cn_bundle.crt; #证书文件名称（在这里取绝对路径）
     ssl_certificate_key /etc/nginx/2_bingqiangzhou.cn.key; #私钥文件名称（在这里取绝对路径）
     ssl_session_timeout 5m;
     ssl_protocols TLSv1 TLSv1.1 TLSv1.2; #请按照这个协议配置
     ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE; #请按照这个套件配置，配置加密套件，写法遵循 openssl 标准。
     ssl_prefer_server_ciphers on;
     location / {
        proxy_pass http://localhost:8080; # 对应第一步`host.conf`文件的`urls`
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
     }
 }
```
### 完成配置
更改完成以后保存文件，使用如下命令来验证配置文件，出错则就修改配置文件，知道验证配置成功。
```shell
$ sudo nginx -t
```
配置成功，则使用如下命令重新加载Nginx配置。
```shell
$ sudo nginx -s reload
```


### 参考链接
[Nginx 服务器证书安装](https://cloud.tencent.com/document/product/400/35244)
 
## 使用supervisor管理进程，让Net Core应用程序一直运行
在 web 应用部署到线上后，需要保证应用一直处于运行状态，在遇到程序异常、报错等情况，导致 web 应用终止时，需要保证程序可以立刻重启，继续提供服务。
### 安装supervisor
```shell
$ sudo apt-get install supervisor
```
### 添加应用程序配置
定位到`/etc/supervisor/conf.d/`文件夹，创建`MySite.conf`文件，文件内容如下:
```
[program:MySite]
directory      =/home/ubuntu/mywebsite/publish # 应用程序目录
command        =dotnet MySite.dll # 执行命令
autostart      =true # 自动启动
autorestart    =true # 自动重启
stderr_logfile =/var/log/MySite.err.log # 错误日志
stdout_logfile =/var/log/MySite.out.log # 输出日志
environment    =ASPNETCORE__ENVIRONMENT=Production #环境变量（当前为生产环境）
user           =ubuntu # 使用Ubuntu用户运行，也可以使用其他用户运行
stopsignal     =INT 
```
### 重启supervisor，完成配置
```shell
$ sudo service supervisor restart
```
访问服务器，看到应用程序的首页，则表示部署成功。

**更新项目动态链接库`dll`文件之后，请重启一下supervisor。**
