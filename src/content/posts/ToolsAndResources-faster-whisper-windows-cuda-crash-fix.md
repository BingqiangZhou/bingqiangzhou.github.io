---
title: "【实践记录】解决 faster-whisper Windows+CUDA 转录完成后进程崩溃（0xC0000409）"
published: 2026-05-19
description: "faster-whisper 在 Windows+CUDA 环境下转录完成后进程以 0xC0000409 (STATUS_STACK_BUFFER_OVERRUN) 退出。根因是 CTranslate2 的 CUDA async allocator 在模型清理时导致 C++ 层内存损坏。记录问题定位过程和三种解决方案。"
lang: zh
tags: ["实践记录", "工具分享"]
---

## 问题现象

使用 `faster-whisper` 在 Windows + NVIDIA GPU 上转录音频时，转录过程正常完成，所有 segment 都正确输出，但进程随后以退出码 **3221226505（0xC0000409 = STATUS_STACK_BUFFER_OVERRUN）** 崩溃，输出文件未生成。

关键特征：

- 转录本身完全正常，所有 segment 都处理完毕
- 崩溃发生在转录循环结束后、`return` 语句或模型清理阶段
- Python `try/except` **无法捕获**（C++ 层崩溃，不是 Python 异常）
- 不产生任何 Python traceback
- Windows 事件查看器中显示 `ucrtbase.dll` 异常，异常码 `0xC0000409`
- CPU 模式下不会出现此问题

## 根因分析

这是 **CTranslate2 的已知 bug**，在 Windows + CUDA 环境下模型清理时触发。

### 问题链路

```
转录完成 → for segment in segments 结束 → with 块退出 → _cleanup_model() → CTranslate2 CUDA 清理 → 崩溃
```

CTranslate2 使用 CUDA async allocator 管理 GPU 内存。在模型卸载时，该 allocator 的清理逻辑与 Windows 的内存管理机制冲突，导致栈缓冲区溢出。崩溃发生在 C++ 层，Python 的异常处理机制完全无法介入。

### 影响范围

- 仅影响 **Windows + CUDA** 组合，Linux 和 macOS 不受影响
- 与音频长度有关：长音频（>30 分钟）更容易触发，因为更多 segment 意味着更高的 temperature fallback 概率
- 与 CUDA/cuDNN 版本相关，但没有任何组合能完全避免

### 相关 GitHub Issues

| Issue | 说明 |
|-------|------|
| [SYSTRAN/faster-whisper#71](https://github.com/SYSTRAN/faster-whisper/issues/71) | 2023年3月首次报告，至今仍 open |
| [SYSTRAN/faster-whisper#1293](https://github.com/SYSTRAN/faster-whisper/issues/1293) | 2025年4月，详细版本对比测试 |
| [OpenNMT/CTranslate2#1782](https://github.com/OpenNMT/CTranslate2/issues/1782) | CTranslate2 侧的崩溃报告 |

## 解决方案

### 方案一：设置 CUDA Allocator 环境变量（推荐）

**原理**：将 CUDA 内存分配器从默认的 `cuda_malloc_async` 切换为 `cub_caching`，避开有 bug 的 allocator 路径。

**做法**：在 `import faster_whisper` **之前**设置环境变量：

```python
import os
import sys

# 必须在 import faster_whisper 之前设置
if sys.platform == "win32":
    os.environ.setdefault("CT2_CUDA_ALLOCATOR", "cub_caching")

from faster_whisper import WhisperModel
```

或者在命令行中设置：

```bash
# Linux/macOS
CT2_CUDA_ALLOCATOR=cub_caching python transcribe.py

# Windows CMD
set CT2_CUDA_ALLOCATOR=cub_caching
python transcribe.py

# Windows PowerShell
$env:CT2_CUDA_ALLOCATOR="cub_caching"
python transcribe.py
```

**优点**：最简单，一行代码搞定，不影响转录质量
**来源**：2026年4月由 [@ia319](https://github.com/SYSTRAN/faster-whisper/issues/71#issuecomment-2826547563) 发现并报告

### 方案二：子进程隔离

**原理**：在独立子进程中运行转录，崩溃只杀死子进程，主进程不受影响。转录结果通过文件传递。

```python
import subprocess
import sys

def transcribe_in_subprocess(audio_path, output_path, metadata_path):
    result = subprocess.run(
        [
            sys.executable, "-u",
            "transcribe-faster-whisper.py",
            audio_path,
            "--output", output_path,
            "--metadata", metadata_path,
            "--model", "large-v3-turbo",
            "--lang", "zh",
            "--force",
        ],
        timeout=600,
    )
    # 即使 exit code 非 0，只要输出文件存在就算成功
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        return True
    return result.returncode == 0
```

**优点**：彻底隔离崩溃，主进程 100% 安全
**缺点**：子进程间通信只能通过文件，代码复杂度增加
**来源**：社区最常见的 workaround，见 [issue #71 评论](https://github.com/SYSTRAN/faster-whisper/issues/71#issuecomment-1526144389)

### 方案三：Checkpoint 保底（辅助方案）

**原理**：在转录循环结束后、模型清理前，先将结果写入文件。即使后续清理崩溃，数据已保存。

```python
from faster_whisper import WhisperModel

model = WhisperModel("large-v3-turbo", device="cuda", compute_type="auto")
segments, info = model.transcribe("audio.m4a", language="zh", word_timestamps=True)

captions = []
for segment in segments:
    text = segment.text.strip()
    if not text:
        continue
    captions.append({
        "text": text,
        "startMs": int(segment.start * 1000),
        "endMs": int(segment.end * 1000),
        "words": [{"word": w.word, "startMs": int(w.start * 1000), "endMs": int(w.end * 1000)} for w in segment.words] if segment.words else None,
    })

# 关键：在模型清理前保存结果！
import json
with open("captions.json", "w", encoding="utf-8") as f:
    json.dump(captions, f, ensure_ascii=False, indent=2)
print(f"Saved {len(captions)} captions before model cleanup")

# 之后的清理可能崩溃，但数据已经保存了
# del model  # 这一步可能触发崩溃
```

**优点**：与方案一/二组合使用，提供额外保障
**缺点**：单独使用不治本，进程仍会崩溃

## 我的最终方案

组合方案一 + 方案三：

```python
import os
import sys

# 方案一：避开有 bug 的 CUDA allocator
if sys.platform == "win32":
    os.environ.setdefault("CT2_CUDA_ALLOCATOR", "cub_caching")

from faster_whisper import WhisperModel
import json

def transcribe_with_checkpoint(audio_path, output_path):
    model = WhisperModel("large-v3-turbo", device="cuda", compute_type="auto")
    segments, info = model.transcribe(audio_path, language="zh", word_timestamps=True)

    captions = []
    for seg in segments:
        if seg.text.strip():
            captions.append({"text": seg.text.strip(), "startMs": int(seg.start * 1000), "endMs": int(seg.end * 1000)})

    # 方案三：checkpoint - 在模型清理前保存
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(captions, f, ensure_ascii=False, indent=2)
    print(f"Checkpoint saved: {len(captions)} captions")

    # 现在可以安全清理了（方案一已防止崩溃）
    del model
    return captions, info
```

## 验证结果

在我的环境（Windows 11, Intel i5-13500H, RTX 4050 Laptop GPU, CUDA 12.x）下测试 98 分钟播客音频：

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 退出码 | 3221226505 (0xC0000409) | 0 |
| 输出文件 | 未生成 | 正常生成 |
| 转录质量 | N/A | 无变化 |
| 转录速度 | N/A | 无变化 |

方案一加一行代码，零副作用，彻底解决了这个困扰社区多年的问题。

关于两种 Pipeline 的性能对比（转录速度、完整性、词级时间戳质量），详见 [faster-whisper WhisperModel vs BatchedInferencePipeline 性能对比](/posts/toolsandresources-faster-whisper-pipeline-comparison/)。
