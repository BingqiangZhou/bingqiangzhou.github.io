---
title: "【工具分享】XMind与Sublime Text等等其他工具"
published: 2019-08-23
description: "记录一下XMind与Sublime Text 3破解激活的步骤以及一些Sublime Text好用的插件！"
lang: zh
tags: ["工具分享"]
---

记录一下 XMind 与 Sublime Text 3 破解激活的步骤以及一些 Sublime Text 好用的插件！



## [XMind pro 8 破解激活步骤](https://github.com/winturn/xmind-pro-8-crack-patch)
### 准备工作 
#### [下载 XMind 8](https://www.xmind.cn/download/xmind8)
这里个人比较喜欢下载便携的 zip 包。
#### [下载破解的 jar 包](https://github.com/winturn/xmind-pro-8-crack-patch) 
### 修改 XMind.ini 文件
**将`RCE`文件夹复制到 XMind 目录下**，之后打开安装目录下的 XMind.ini 文件。
在最后一行增加下面的内容
```ini
-javaagent:RCE/XMindCrack.jar
```
### 修改 Hosts 屏蔽 Xmind 联网验证
管理员运行`屏蔽Xmind联网验证.bat`，这里我运行有点问题，所以我只留下了下面两行。
```cmd
@echo off
echo 0.0.0.0 xmind.net >>C:\Windows\System32\Drivers\etc\hosts
echo 0.0.0.0 www.xmind.net >>C:\Windows\System32\Drivers\etc\hosts
```
这里也可以直接**管理员运行命令行**，输入上面两条命令即可。
**管理员运行命令行**，输入以下命令，使用记事本编辑它。
```cmd
notepad C:\Windows\System32\Drivers\etc\hosts
```
在记事本中加入以下内容并保存。
```cmd
0.0.0.0 www.sublimetext.com 
0.0.0.0 sublimetext.com
```
可以使用命令查看是否成功添加。
```cmd
type C:\Windows\System32\Drivers\etc\hosts
```
### 输入序列号
启动 XMind 使用序列号密钥注册破解激活完成！
-> 帮助 -> 序列号 -> 输入序列号
邮箱：可以使用任何的邮箱地址 序列号：
```
XAka34A2rVRYJ4XBIU35UZMUEEF64CMMIYZCK2FZZUQNODEKUHGJLFMSLIQMQUCUBXRENLK6NZL37JXP4PZXQFILMQ2RG5R7G4QNDO3PSOEUBOCDRYSSXZGRARV6MGA33TN2AMUBHEL4FXMWYTTJDEINJXUAV4BAYKBDCZQWVF3LWYXSDCXY546U3NBGOI3ZPAP2SO3CSQFNB7VVIY123456789012345
```

## Sublime Text 破解激活步骤
### 准备工作
#### [下载 Sublime Text](https://www.sublimetext.com/3)
还是建议下载便携式的 zip 包，
### 修改可执行文件
老版的只需要修改 hosts 屏蔽 Sublime Text 联网验证就好了。
现在还需要修改可执行文件，不修改只屏蔽联网验证，依旧还是会弹出验证失败的窗口。
- 进入[在线十六进制编辑器](https://www.onlinehexeditor.com/)
- 点击**Open file**，然后选择**sublime_text.exe**可执行文件
- 选择下方的的**Search**，然后在**hex**框输入“97 94 0D”，点击**Search**，十六进制码区域就会定位到搜索结果
- 然后点击搜索结果定位到那一行，把**97 94 0D**改成**00 00 00**，修改方式是在由此**hex8**框中修改对应的值，然后**回车**
- 然后点**sublime_text.exe**可执行文件旁边的**下载按钮**
- 然后用这个修改过的文件替换原来文件夹里的那个**sublime_text.exe**可执行文件

### 修改 Hosts 屏蔽 Sublime Text 联网验证
**管理员运行命令行**，输入以下命令，使用记事本编辑它。
```cmd
notepad C:\Windows\System32\Drivers\etc\hosts
```
在记事本中加入以下内容并保存。
```cmd
0.0.0.0 www.sublimetext.com
0.0.0.0 sublimetext.com
0.0.0.0 lsublimehq.com
0.0.0.0 license.sublimehq.com
0.0.0.0 telemetry.sublimehq.com
0.0.0.0 45.55.255.55
0.0.0.0 45.55.41.223
```
可以使用命令查看是否成功添加。
```cmd
type C:\Windows\System32\Drivers\etc\hosts
```
### 输入序列号
```cmd
----- BEGIN LICENSE -----
TwitterInc
200 User License
EA7E-890007
1D77F72E 390CDD93 4DCBA022 FAF60790
61AA12C0 A37081C5 D0316412 4584D136
94D7F7D4 95BC8C1C 527DA828 560BB037
D1EDDD8C AE7B379F 50C9D69D B35179EF
2FE898C4 8E4277A8 555CE714 E1FB0E43
D5D52613 C3D12E98 BC49967F 7652EED2
9D2D2E61 67610860 6D338B72 5CF95C69
E36B85CC 84991F19 7575D828 470A92AB
------ END LICENSE ------
```
## 其他工具的破解方法
[WinRAR](https://github.com/DoubleLabyrinth/winrar-keygen) [WinRAR 去广告](https://blog.csdn.net/xiangshangbashaonian/article/details/78876813)，去广告这里建议使用第二种方法，或者直接下载其他语言版本的 WinRAR，使用`rarreg.key`注册。
[Navicat](https://github.com/DoubleLabyrinth/navicat-keygen)
[MobaXterm](https://github.com/DoubleLabyrinth/MobaXterm-keygen)
[StarUML](https://blog.csdn.net/sam_shan/article/details/80585240)
## 在 Sublime Text 中写 Markdown 文档
这里主要介绍三个包，**MarkDown Editing**、**OmniMarkupPreviwer**、**TableEditor**，[参考链接](https://www.jianshu.com/p/aa30cc25c91b)

- **MarkDown Editing**：支持 Markdown 语法高亮；支持 Github Favored Markdown 语法；自带 3 个主题。

- **OmniMarkupPreviwer**：实时在浏览器中预览，快捷键如下：
`Ctrl+Alt+O`: 在浏览器中预览
`Ctrl+Alt+X`: 导出作为 html
`Ctrl+Alt+C`: 复制内容作为 html

- **TableEditor**：Markdown 表格编辑插件，具有较好的自适应性，会自动对齐。需要用`ctrl+shift+p`打开这个功能（`Table Editor: Enable for current syntax`），然后就使用 tab 来建表格了。[Table Editor 使用方法](https://segmentfault.com/a/1190000007935021)

如果使用浏览器预览时，出现如下错误：
```
Error: 404 Not Found
Sorry, the requested URL 'http://127.0.0.1:51004/view/31' caused an error:

'buffer_id(31) is not valid (closed or unsupported file format)'

**NOTE:** If you run multiple instances of Sublime Text, you may want to adjust
the `server_port` option in order to get this plugin work again.
```
在 Sublime Text > Preferences > Package Settings > OmniMarkupPreviewer > Settings - User，复制如下内容，[参考链接](https://stackoverflow.com/questions/35798823/omnimarkuppreviewer-404)：
```json
{
    "renderer_options-MarkdownRenderer": {
        "extensions": ["tables", "fenced_code", "codehilite"]
    }
}
```
## 我在用的 Sublime Text 包
A File Icon、 Alignment、 AutoFileName、 Boxy Theme、 BracketHighlighter、 Code Highlighter、 Colorcoder、 ColorPicker、 CovertToUTF8、 Emmet、 Emmet CSS Snippets、 jQuery、 LiveReload、 Markdown Editing、 OmniMarkupPreviewer、 PlianTasks、 PyV8、 SideBarEnhancements、 SublimeCodeIntel、 TableEditor、 Terminal、 View in Browser、 weappSnippet、 zzz A File Icon zzz、SublimeREPL
## 其他 Sublime Text 链接
[Sublime Text3 如何安装、删除及更新插件](https://blog.csdn.net/index_ling/article/details/72967199)
[Sublime Text 3 好用的插件](https://www.jianshu.com/p/b2163b4e8e94)
[实用的 sublime 插件集合 – sublime 推荐必备插件](https://blog.csdn.net/jinhui157/article/details/72887142)
[Sublime Text3+ 常用插件汇总](https://blog.csdn.net/weixin_42171657/article/details/81509901)
[Sublime Text 编辑器 插件 之 "Sublime Alignment" 详解]https://my.oschina.net/shede333/blog/170536
[sublime 自动对齐 Alignment 插件快捷键](https://blog.csdn.net/qdujunjie/article/details/38805323)
[SublimeText3 常用快捷键和优秀插件](https://blog.csdn.net/cddcj/article/details/52524417)------