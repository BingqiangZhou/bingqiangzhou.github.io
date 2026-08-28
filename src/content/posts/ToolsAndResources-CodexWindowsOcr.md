---
title: 【AI实测】没有多模态的 Codex，居然自己掏出了 Windows 自带 OCR
published: 2026-08-28
description: 让 Codex（GLM-5.3，纯文本模型）做一项需要读图的调研，它没有摆烂说"我看不了图片"，而是自己发现并调用了 Windows 系统自带的中文 OCR（Windows.Media.Ocr）来识别图片——顺便科普这个藏得很深的系统能力。
lang: zh
tags:
  - AI实测
  - 工具分享
  - 折腾记录
---

今天让 Codex 帮我做一项调研，任务里有一部分需要读取图片里的内容。我的第一反应是"坏了"——这台机器上 Codex 跑的是 GLM-5.3 编程套餐，纯文本模型，没有多模态能力，按理说它应该回来问我怎么办，或者干脆摆烂跳过这部分。

结果它两条路都没走。它在终端里平静地输出了一行：

![Codex 输出：Windows 自带中文 OCR 可用，开始识别 17 张榜单图](/assets/images/2026/20260828/codex-windows-ocr.webp)

> Windows 自带中文 OCR 可用，开始识别 17 张榜单图。

然后就把 17 张图全部 OCR 完接着干活了。我是真的被惊到了——不是因为它把活干了，而是它选的这条路径：**Windows 系统自带 OCR（Windows.Media.Ocr）**。我用了这么多年 Windows，根本不知道这玩意儿的存在。

## Codex 是怎么想的

复盘一下这个行为，其实非常"Agent"：

1. **目标导向，而不是能力导向**。它没有把"模型没有视觉"当成任务终点，只是当成一个待解决的工程问题：图里的文字需要进入上下文，那么就找一个本机可用的文字提取工具。
2. **先探测环境，再选工具**。它在动手前先探测了系统里有哪些 OCR 可用（比如 Tesseract 是否安装、Windows OCR 引擎是否存在），发现 Windows OCR 引擎带中文语言包，就直接用它了。
3. **纯文本模型 + 本地工具 = 事实上的多模态**。OCR 把图片"降维"成文本，正好落在文本模型能消费的模态上。对"读图中文字"这类需求，这个组合的效果出乎意料地好。

这也是 Agent 和"聊天机器人"的本质区别：聊天机器人会告诉你"我读不了图"，Agent 会去系统里翻箱倒柜找一个能读图的东西。

## 顺手科普：Windows 真的自带 OCR

`Windows.Media.Ocr` 是 Windows 10/11 内置的 OCR 引擎，通过 WinRT API 暴露，核心类就是 `Windows.Media.Ocr.OcrEngine`。它有几个很关键的特性：

- **完全本地运行**，不联网、不上传图片，隐私和断网场景都友好——这也是 Codex 能在本地直接调它的原因。
- **能力随语言包分发**。引擎本体内置，但"认识哪种语言"取决于系统装了哪些语言包。中文系统装了中文语言包，`OcrEngine` 就能直接识别中文，无需额外配置。
- **免费、无调用限制**，因为根本没有服务端，一切都在你的机器上跑。

### API 的基本形状

用法是三步：拿到引擎 → 把图片转成 `SoftwareBitmap` → 调 `RecognizeAsync`。

```csharp
// C# / WinRT
var engine = OcrEngine.TryCreateFromUserProfileLanguages();   // 按用户语言列表建引擎
// 或 OcrEngine.TryCreateFromLanguage(new Language("zh-CN")); // 指定语言，语言包缺失时返回 null
var bitmap = await SoftwareBitmap.CreateCopyFromBufferAsync(pixelBuffer, BitmapPixelFormat.Bgra8, width, height);
var result = await engine.RecognizeAsync(bitmap);
Console.WriteLine(result.Text);
```

几个容易踩的细节：

- **图片必须先转成 `SoftwareBitmap`**。引擎不直接吃文件路径，需要经过 `BitmapDecoder` 解码再转换，这是最繁琐的一步。
- **尺寸有上限**。`OcrEngine.MaxImageDimension` 静态属性给出了单边像素上限（桌面端通常是 4096），超限会直接失败，需要先缩放。截图一般不会超，但长图经常中招——要么裁开，要么降分辨率。
- **结果带位置但不带版面理解**。`OcrResult.Lines` 给出每行文字及其包围盒坐标，适合"把字读出来"；但它不理解表格、多栏、阅读顺序，复杂版面需要自己按坐标拼。
- **TryCreateFromLanguage 返回 null 而不是抛异常**。语言包没装就是静默失败，这是最常见的坑（Windows Server/LTSC 精简版上尤其常见，可能整个 OCR 功能都不在）。

### 不写代码也能用

日常使用有几个现成入口：

- **PowerShell**：PowerShell 5.1（Windows PowerShell）自带 WinRT 投影，`[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]` 加载类型后直接调用，十几行脚本就能批量 OCR 一个文件夹，无需安装任何东西。PowerShell 7 需要 `.ps1` 里借助 `Microsoft.Windows.SDK.NET.Ref` 包来访问 WinRT。
- **Python**：社区的 `winocr`（`pip install winocr`）封装了 WinRT 绑定，配合 `Pillow` 打开图片，五行代码出结果。
- **让 AI 帮你写**：正如今天所见，把需求丢给 Codex，它自己就能探测、写脚本、跑通整条链路。

### 语言包管理

想确认或补充可识别的语言：

```powershell
# 查看当前可用的 OCR 语言
[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]::AvailableRecognizerLanguages

# 安装新语言（含 OCR 功能），例如日语
Install-Language -Language ja
```

也可以走图形界面：设置 → 时间和语言 → 语言 → 添加语言，OCR 作为可选语言功能（Feature on Demand）随语言包一起装。离线环境可以用 DISM 对着 FOD 镜像装 `.cab`。装完之后 `TryCreateFromLanguage` 就不再返回 null 了。

识别精度方面，它对**截图、印刷体、清晰 UI 文字**相当好（Codex 识别那 17 张榜单图一次通过）；手写体和低分辨率照片就比较一般了——那才是云服务（Azure AI Vision 等）或专业引擎（PaddleOCR、Tesseract）的领地。但对 Agent 的日常场景——读截图、读报错弹窗、读扫描文档——这个藏在系统里的免费引擎，够用了。

## 一点感想

这次经历让我对"模型能力边界"的判断变得谨慎了。**模型的多模态缺失，不等于 Agent 的多模态缺失**——Agent 有 shell、有文件系统、有整个操作系统可以调用，缺什么就去补什么。GLM-5.3 这个纯文本模型配上 Codex 的执行环境，最终交付了需要"看图"的调研结果。

以后再评估"这个模型能不能干这件事"，也许更准确的问法是：**这个 Agent 所在的环境里，有没有干这件事的工具**。
