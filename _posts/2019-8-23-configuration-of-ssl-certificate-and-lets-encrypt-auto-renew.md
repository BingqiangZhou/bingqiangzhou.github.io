---
title: SSL证书的配置与Let's Encrypt证书的自动颁发
tags:
  - ssl
  - letsencrypt
categories:
  - web
  - iis
  - ssl
date: 2019-08-23 12:13:51
---

记录一下SSL证书的配置与Let's Encrypt证书的自动颁发，这里Let's Encrypt证书（有效期90天）的自动颁发，还没有尝试，本质是使用自动部署程序部署，并设置定时任务定时更新它。
<!-- more -->
## SSL证书的配置
这里不多说给出[腾讯云证书安装指引](https://cloud.tencent.com/document/product/400/35223)，对应有Apache、Nginx、IIS、Tomcat四种服务器的证书安装教程。
**其中IIS服务器中的设置URL重写规则，可以直接用修改web.config的方式去代替。**添加**web.config**配置如下：
```xml #web.config
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="HTTP to HTTPS redirect" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="off" ignoreCase="true" />
          </conditions>
          <action type="Redirect" redirectType="Found" url="https://{HTTP_HOST}/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```
在IIS中，如果我们的项目没有**web.config**，那么我们自己创建一个**web.config**，复制上面的**web.config**的内容就可完成Http重定向到https的配置。
## Let's Encrypt证书的自动颁发
由于还有尝试，这里给出几个链接，以后有机会试一下。
[Let’s Encrypt官网](https://letsencrypt.org/zh-cn/)
[在 Nginx 与 IIS 上初试 Let’s Encrypt 证书部署](https://www.tomczhen.com/2016/08/31/nginx-iis-letsencrypt-get-start/)
[Linux使用Certbot定时自动更新 Let’s Encrypt SSL](http://www.jwinner.com/index.php/2016/08/24/certbot-lets-encrypt-ssl/)
[How to Use Let’s Encrypt SSL Certificates with FileMaker Server for Windows](https://bluefeathergroup.com/blog/how-to-use-lets-encrypt-ssl-certificates-with-filemaker-server/)

