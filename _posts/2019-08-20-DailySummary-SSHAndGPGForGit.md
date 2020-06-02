---
title: 【日常小结】windows下git配置ssh和gpg
tags: [日常小结系列]
---

今天总结一下git配置ssh和gpg。

<!--more-->

## 下载安装git ##
在[https://github.com/git-for-windows/git/releases](https://github.com/git-for-windows/git/releases)找到最新的release版本的`PortableGit`，自行根据系统选择64位、32位下载。

下载好了`PortableGit`，如`PortableGit-2.23.0-64-bit.7z.exe`，我们打开它，选择到解压哪个文件夹，解压后好，配置环境变量。

管理员打开命令行，配置环境变量，配置到`git`目录下的`cmd`文件夹。

设置用户环境变量
`setx ENV_NAME env_value`，如：setx path "%path%;D:\Development\Git\PortableGit\cmd"

设置系统环境变量
`setx ENV_NAME env_value /m`，如：setx path "%path%;D:\Development\Git\PortableGit\cmd" /m

重新打开命令行执行`set path | find dirName`（这里的dirName是上面配置的目录）如：set path | find "D:\Development\Git\PortableGit\git"，如果配置成功，则看到path的内容，没有则没有配置成功。

也可以输入`git`验证是否有效也可以。

## git配置ssh ##

### 设置Git的user name和email ###
管理员打开命令行，输入如下命令：
```
$ git config --global user.name "BingqiangZhou"
$ git config --global user.email "XXX@qq.com"
```
注意输入自己Github对应的用户名和邮箱。

### 生成密钥 ###
转到`git`目录下的`bin`文件夹中打开`bash.exe`，如：
```
$ cd D:\Development\Git\PortableGit\bin
$ bash.exe
```
生成密钥，注意对应邮箱号。
```
$ ssh-keygen -t rsa -C "XXX@qq.com"
```

如果不需要密码，则按三次回车键，最后得到了两个文件：id_rsa和id_rsa.pub，在`c:\Users\用户名\.ssh`目录下，这里他会把目录提示给我们。

退出bash，并复制id_rsa.pub内容到[https://github.com/settings/keys](https://github.com/settings/keys)添加密钥，完成配置。
```
$ exit
$ type c:\Users\Zhou\.ssh\id_rsa.pub
```

注意这里改为提示的id_rsa.pub所在位置。

## git配置gpg ##
管理员启动cmd，转到`git`目录下的`bin`文件夹中打开`bash.exe`。
```
$ cd D:\Development\Git\PortableGit\bin
$ bash.exe
```

输入

```
gpg --full-generate-key
```

然后他会提示，你想生成哪种key，我们选择第一种默认的，**按回车就好了**。

随后他会提示你生成多少比特长度的秘钥，默认是2048，**建议输入4096，回车**，默认直接按回车。


之后他会提示设置秘钥多久之后过期，默认是永不过期，**回车就好了**。这里我尝试了其他选择，失败了，原因是不需要输入<>，直接输入`1y`表示一年以后过期，如果输入1y，他会提示你过期时间。

**注意：以上这些步骤可以直接按回车键默认设置也行。**

 
接下来他会提示你输入Github对应的**用户名**与**邮箱**，注解可以不填，直接回车。

然后**输入`O`，确认输入的信息**。
 
之后他会弹出一个框，要求我们输入passphrase，输入两次，**请记住密码**。

随后便成功了生产了秘钥，这里会展示一些公钥和私钥的相关信息，如：
```
gpg: /c/Users/Zhou/.gnupg/trustdb.gpg: trustdb created
gpg: key 7C6E6C98CC2AC0F7 marked as ultimately trusted
gpg: directory '/c/Users/Zhou/.gnupg/openpgp-revocs.d' created
gpg: revocation certificate stored as '/c/Users/Zhou/.gnupg/openpgp-revocs.d/7BC4EE0E46E8963286F2FC4D7C6E6C98CC2AC0F7.rev'
public and secret key created and signed.

pub   rsa4096 2019-08-19 [SC]
      7BC4EE0E46E8963286F2FC4D7C6E6C98CC2AC0F7
uid                      BingqiangZhou <1299050656@qq.com>
sub   rsa4096 2019-08-19 [E]
```

这里注意记住`pub`后面的ID，如`7BC4EE0E46E8963286F2FC4D7C6E6C98CC2AC0F7`，之后配置的时候还会用的到。

公钥文件（`.gnupg/pubring.gpg`）以二进制形式储存，`armor`参数可以将其转换为`ASCII`码显示，生成公钥私钥文件在`cmd`执行`bash.exe`下无法生成（这里可能是个bug，也可能是我环境的问题，有同学配置的话，可以试一下在`cmd`执行`bash.exe`下生成文件），**需要在git的目录下打开`git-bash.exe`**，如：D:\Development\Git\PortableGit\git-bash.exe。

```
gpg --armor --output public-key.txt --export [密钥ID]
```
[密钥ID]指定用户的公钥，如 7BC4EE0E46E8963286F2FC4D7C6E6C98CC2AC0F7，output 参数指定输出文件名，如 public-key.txt

同时，export-secret-keys 参数可以转换私钥。

```
gpg --armor --output private-key.txt --export-secret-keys
```
public-key.txt 和 private-key.txt `cmd`下默认会导出至用户目录 C:\Users\<用户名>\ 下，而`git-bash.exe`下会在`git-bash.exe`所在的目录下。

到[https://github.com/settings/keys](https://github.com/settings/keys)添加密钥，将导出的public-key.txt的内容添加到Github，完成配置。

设置 Git 使用该密钥 ID 加密：
```
git config --global user.signingkey [密钥ID]
```
设置 Git 全局使用该密钥加密：
```
git config --global commit.gpgsign true
```
最后，再输入以下命令查看 Git 配置情况：
```
git config -l
```
包含以下信息。
```
user.signingkey=7BC4EE0E46E8963286F2FC4D7C6E6C98CC2AC0F7
commit.gpgsign=true
```

到这里配置就基本完成了。

**参考链接：**	
https://segmentfault.com/a/1190000002645623
https://teddysun.com/496.html
 

