---
title: 【日常杂耍】监控实验室GPU使用情况，有空闲GPU发送邮件提醒
tags: [日常杂耍系列]
---

又有一段时间没有记录总结了，马上要开学了，这次记录一下监控实验室GPU使用情况，有空闲GPU发送邮件提醒的代码。

<!--more-->

前一段时间跑代码，而跑代码的人比较多，然后资源有限，需要抢占先机才行，然后就写了这段代码。

## 主要思路

执行命令行`nvidia-smi -q -x`，获取到命令行输出，解析xml，获取到GPU使用情况，判断是否有空闲GPU，发送邮件。

## 主要代码

下面主要给出执行命令行，以及解析返回结果代码，发送邮件仅给出之前的的一篇博客作为参考，[参考:【日常杂耍】定时获取成绩，新出一门成绩使用邮件提醒](https://bingqiangzhou.github.io/2020/06/22/DailyJungle-SMTP-SeleniumWithHeadlessBroswer.html#2发送邮件)。

NVIDIA-SMI相关命令，参考[NVIDIA-SMI系列命令总结](https://www.cnblogs.com/omgasw/p/10218180.html)。

解析xml，参考[python 官方文档 xml.etree.ElementTree -- The ElementTree XML API](https://docs.python.org/3/library/xml.etree.elementtree.html)

获取进程相关信息的包[psutil (python system and process utilities)](https://psutil.readthedocs.io/en/latest/)。

```python
# references:
#     https://www.cnblogs.com/omgasw/p/10218180.html
#     https://docs.python.org/3/library/xml.etree.elementtree.html
#     https://psutil.readthedocs.io/en/latest/

import os
import psutil
import xml.etree.ElementTree as ET
import time
from pprint import pprint
from datetime import timedelta, datetime

def execute_command(command_str):
    p = os.popen(command_str)
    text = p.read()
    p.close()
    return text

# command_str = 'nvidia-smi dmon -c 1'
# pwr：功耗，temp：温度，sm：流处理器，mem：显存，enc：编码资源，dec：解码资源，mclk：显存频率，pclk：处理器频率
# # gpu   pwr  temp    sm   mem   enc   dec  mclk  pclk
# Idx     W     C     %     %     %     %   MHz   MHz
#     0   112    87    19     7     0     0  5005  1480
#     1   177    83    78     8     0     0  5005  1809
#     2    93    81    31    10     0     0  5005  1809
#     3   150    83    93    54     0     0  5005  1784

def get_process_info(pid):
    p = psutil.Process(pid)
#     print(p.as_dict())
    return p.as_dict()

def get_gpu_info():
    command_str = 'nvidia-smi -q -x'
    # 查询所有GPU的当前详细信息并将查询的信息以xml的形式输出
    gpus_info_dict = {}
    text = execute_command(command_str)
    root = ET.fromstring(text)
    for i, gpu_info in enumerate(root.findall('gpu')):
        gpu_info_dict = {}
        gpu_name = gpu_info.find('product_name').text
        fb_memory_usage = gpu_info.find('fb_memory_usage')
        total = fb_memory_usage.find('total').text
        used = fb_memory_usage.find('used').text
        free = fb_memory_usage.find('free').text
        rate = int(used.split(' ')[0]) / int(total.split(' ')[0])
        gpu_info_dict.update({'gpu name': gpu_name})
        gpu_info_dict.update({'memory usage':{'total': total, 'used': used, 'free': free}})
        gpu_info_dict.update({'gpu utilization':rate})

        processes = gpu_info.find('processes')
        processes_dict = {}
        for process_info in processes.findall('process_info'):
            pid = process_info.find('pid').text
            infos = get_process_info(int(pid))
            create_time = infos['create_time']
            current_time = time.time()
            time_difference = time.gmtime(current_time - create_time)
            run_time = f'{time_difference.tm_hour}h,{time_difference.tm_min}m,{time_difference.tm_sec}s'
            cmd_line = ' '.join(infos['cmdline'])
            processes_dict.update({'pid': pid, 'user name':infos['username'], 'cwd':infos['cwd'], 'cmd line':cmd_line, 'run time': run_time})
        gpus_info_dict.update({f'gpu:{i}':{'gpu info': gpu_info_dict, 'processes': processes_dict}})
    return gpus_info_dict

pprint(get_gpu_info())
```
