---
title: "【工具分享】Nvidia 免费 API 注册与使用指南"
published: 2026-04-27
description: "NVIDIA build.nvidia.com 免费 API 完整注册与使用指南，涵盖 80+ 前沿大模型的免费调用方法及代码示例。"
lang: zh
tags: ["工具分享", "折腾记录"]
---

> 最后更新：2026-04-27

## 一、概述

NVIDIA 官方平台 [build.nvidia.com](https://build.nvidia.com) 提供了大量 **Free Endpoint（免费端点）** 模型，注册账号并验证手机号后即可生成 API Key，**免费调用 80+ 个前沿大模型**，无需信用卡，不计 Token 费用。

- **算力来源**：NVIDIA 自家 H100 集群，响应速度快
- **API 兼容性**：OpenAI Compatible（兼容 OpenAI SDK）
- **Base URL**：`https://integrate.api.nvidia.com/v1/`

---

## 二、注册流程（3 分钟完成）

### 第 1 步：注册 NVIDIA 账号

1. 打开官网 👉 [https://build.nvidia.com](https://build.nvidia.com)
2. 点击右上角 **Login**
3. 选择 **Create Account** 注册新账号
4. 支持以下登录方式：
   - 微信 / QQ / Apple / Microsoft 一键登录
   - 邮箱注册（推荐 QQ / Outlook 邮箱）
5. 去邮箱点击激活链接完成注册

### 第 2 步：验证手机号，解锁 API 权限

1. 登录后，页面顶部会出现提示：**Verify your account to unlock API access**
2. 点击 **Verify**，输入手机号（支持 +86 国内手机号）
3. 接收短信验证码并提交
4. ✅ 验证完成，API 调用权限已解锁

### 第 3 步：创建 API Key

1. 点击右上角 **头像** → 下拉菜单选 **API Keys**
2. 点击右上角 **+ Generate API Key**
3. 在弹出的对话框中填写：
   - **Key Name**：自定义名称（如 `my-free-key`）
   - **Expiration**：选择最长 **12 months（1 年）**
4. 点击 **Generate Key**
5. ⚠️ **重要**：Key 只显示一次！立即复制保存（以 `nvapi-` 开头的字符串），关闭弹窗后无法再查看

---

## 三、使用方法

### 3.1 API 基本信息

| 项目 | 值 |
|------|-----|
| API Provider | OpenAI Compatible |
| Base URL | `https://integrate.api.nvidia.com/v1/` |
| API Key | 你申请的 `nvapi-xxx` Key |
| 模型列表 | `https://integrate.api.nvidia.com/v1/models` |

### 3.2 Python 调用示例（使用 OpenAI SDK）

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="nvapi-你的API密钥"
)

response = client.chat.completions.create(
    model="deepseek-ai/deepseek-r1",  # 替换为你要用的模型 ID
    messages=[
        {"role": "user", "content": "你好，请介绍一下你自己"}
    ],
    temperature=0.6,
    max_tokens=1024
)

print(response.choices[0].message.content)
```

### 3.3 cURL 调用示例

```bash
curl -X POST "https://integrate.api.nvidia.com/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nvapi-你的API密钥" \
  -d '{
    "model": "meta/llama-3.3-70b-instruct",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.6,
    "max_tokens": 1024
  }'
```

### 3.4 Node.js 调用示例

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: "nvapi-你的API密钥",
});

const response = await client.chat.completions.create({
  model: "qwen/qwen2.5-7b-instruct",
  messages: [{ role: "user", content: "你好" }],
  temperature: 0.6,
  max_tokens: 1024,
});

console.log(response.choices[0].message.content);
```

---

## 四、免费额度与限制

| 限制项 | 说明 |
|--------|------|
| Token 计费 | **不计费**，无余额限制 |
| 调用次数 | **无上限** |
| 速率限制 | 最多 **40 次/分钟**（约每 1.5 秒一次请求） |
| API Key 有效期 | 最长 **12 个月** |
| 信用卡 | **不需要** |
| 数据隐私 | ⚠️ 平台会记录输入输出用于产品改进，**不要上传敏感数据** |

> 对于个人学习、日常开发、搭建 Agent、跑评测，这个额度完全够用。

---

## 五、可用模型列表

### 5.1 查看所有模型

访问以下 URL 可查看 API 支持的所有模型列表：

```
GET https://integrate.api.nvidia.com/v1/models
```

返回格式为 OpenAI 兼容的 JSON，包含 `id`、`object`、`created`、`owned_by` 字段。

### 5.2 热门免费模型（Free Endpoint）

以下为部分热门免费模型，完整列表可在 [build.nvidia.com/models](https://build.nvidia.com/models) 筛选 "Free Endpoint" 查看。

#### 🔥 大语言模型（LLM）

| 模型 ID | 提供商 | 说明 |
|---------|--------|------|
| `deepseek-ai/deepseek-r1` | DeepSeek AI | DeepSeek R1 推理模型 |
| `deepseek-ai/deepseek-v4-flash` | DeepSeek AI | 284B MoE，1M 上下文，快速编码 |
| `deepseek-ai/deepseek-v4-pro` | DeepSeek AI | 1M 上下文窗口，编码优化 |
| `meta/llama-3.3-70b-instruct` | Meta | Llama 3.3 70B 指令微调 |
| `meta/llama-3.1-405b-instruct` | Meta | Llama 3.1 405B 旗舰模型 |
| `meta/llama-4-maverick-17b-128e-instruct` | Meta | Llama 4 Maverick MoE |
| `meta/llama-4-scout-17b-16e-instruct` | Meta | Llama 4 Scout MoE |
| `mistralai/mistral-large-2-instruct` | Mistral AI | Mistral Large 2 |
| `mistralai/mixtral-8x22b-instruct-v0.1` | Mistral AI | Mixtral 8x22B MoE |
| `qwen/qwen2.5-7b-instruct` | Qwen | Qwen 2.5 7B |
| `qwen/qwq-32b` | Qwen | QwQ 32B 推理模型 |
| `minimaxai/minimax-m2.7` | MiniMax | 230B 参数，编码/推理/办公 |
| `z-ai/glm-4.7` | Z.ai | GLM-4.7 多语言智能体 |
| `nvidia/llama-3.1-nemotron-ultra-253b-v1` | NVIDIA | Nemotron Ultra 253B |
| `nvidia/nemotron-4-340b-instruct` | NVIDIA | Nemotron 4 340B |
| `nvidia/llama-3.3-nemotron-super-49b-v1` | NVIDIA | Nemotron Super 49B |
| `google/gemma-3-27b-it` | Google | Gemma 3 27B |
| `microsoft/phi-4-mini-instruct` | Microsoft | Phi-4 Mini |
| `microsoft/phi-4-multimodal-instruct` | Microsoft | Phi-4 多模态 |
| `ibm/granite-3.0-8b-instruct` | IBM | Granite 3.0 8B |

#### 🖼️ 多模态 / 视觉模型

| 模型 ID | 提供商 | 说明 |
|---------|--------|------|
| `meta/llama-3.2-90b-vision-instruct` | Meta | Llama 3.2 90B 视觉 |
| `meta/llama-3.2-11b-vision-instruct` | Meta | Llama 3.2 11B 视觉 |
| `microsoft/phi-3.5-vision-instruct` | Microsoft | Phi-3.5 视觉 |
| `nvidia/vila` | NVIDIA | VILA 视觉语言模型 |
| `nvidia/neva-22b` | NVIDIA | NeVA 22B 视觉模型 |
| `adept/fuyu-8b` | Adept | Fuyu-8B 多模态 |

#### 💻 代码模型

| 模型 ID | 提供商 | 说明 |
|---------|--------|------|
| `deepseek-ai/deepseek-coder-6.7b-instruct` | DeepSeek AI | DeepSeek Coder 6.7B |
| `qwen/qwen2.5-coder-32b-instruct` | Qwen | Qwen 2.5 Coder 32B |
| `mistralai/codestral-22b-instruct-v0.1` | Mistral AI | Codestral 22B |
| `bigcode/starcoder2-15b` | BigCode | StarCoder2 15B |
| `google/codegemma-7b` | Google | CodeGemma 7B |

#### 🔍 嵌入 / 检索模型

| 模型 ID | 提供商 | 说明 |
|---------|--------|------|
| `baai/bge-m3` | BAAI | BGE-M3 多功能嵌入 |
| `nvidia/nv-embed-v1` | NVIDIA | NV-Embed V1 |
| `nvidia/nv-embedqa-e5-v5` | NVIDIA | NV-EmbedQA E5 V5 |
| `snowflake/arctic-embed-l` | Snowflake | Arctic Embed L |

#### 🛡️ 安全 / 护栏模型

| 模型 ID | 提供商 | 说明 |
|---------|--------|------|
| `nvidia/llama-3.1-nemoguard-8b-content-safety` | NVIDIA | 内容安全检测 |
| `nvidia/llama-3.1-nemoguard-8b-topic-control` | NVIDIA | 主题控制 |
| `nvidia/nemotron-3-content-safety` | NVIDIA | 多语言多模态内容安全 |
| `google/shieldgemma-9b` | Google | ShieldGemma 9B |

### 5.3 API 返回的完整模型列表

通过 `GET https://integrate.api.nvidia.com/v1/models` 获取到的所有模型 ID（共 130+ 个）：

```
01-ai/yi-large
abacusai/dracarys-llama-3.1-70b-instruct
adept/fuyu-8b
ai21labs/jamba-1.5-large-instruct
ai21labs/jamba-1.5-mini-instruct
aisingapore/sea-lion-7b-instruct
baai/bge-m3
baichuan-inc/baichuan2-13b-chat
bigcode/starcoder2-15b
bigcode/starcoder2-7b
databricks/dbrx-instruct
deepseek-ai/deepseek-coder-6.7b-instruct
deepseek-ai/deepseek-r1
deepseek-ai/deepseek-r1-distill-llama-8b
deepseek-ai/deepseek-r1-distill-qwen-14b
deepseek-ai/deepseek-r1-distill-qwen-32b
deepseek-ai/deepseek-r1-distill-qwen-7b
google/codegemma-1.1-7b
google/codegemma-7b
google/deplot
google/gemma-2-27b-it
google/gemma-2-2b-it
google/gemma-2-9b-it
google/gemma-2b
google/gemma-3-12b-it
google/gemma-3-1b-it
google/gemma-3-27b-it
google/gemma-3-4b-it
google/gemma-7b
google/paligemma
google/recurrentgemma-2b
google/shieldgemma-9b
ibm/granite-3.0-3b-a800m-instruct
ibm/granite-3.0-8b-instruct
ibm/granite-34b-code-instruct
ibm/granite-8b-code-instruct
ibm/granite-guardian-3.0-8b
igenius/colosseum_355b_instruct_16k
igenius/italia_10b_instruct_16k
institute-of-science-tokyo/llama-3.1-swallow-70b-instruct-v0.1
institute-of-science-tokyo/llama-3.1-swallow-8b-instruct-v0.1
mediatek/breeze-7b-instruct
meta/codellama-70b
meta/llama-3.1-405b-instruct
meta/llama-3.1-70b-instruct
meta/llama-3.1-8b-instruct
meta/llama-3.2-11b-vision-instruct
meta/llama-3.2-1b-instruct
meta/llama-3.2-3b-instruct
meta/llama-3.2-90b-vision-instruct
meta/llama-3.3-70b-instruct
meta/llama-4-maverick-17b-128e-instruct
meta/llama-4-scout-17b-16e-instruct
meta/llama2-70b
meta/llama3-70b-instruct
meta/llama3-8b-instruct
microsoft/kosmos-2
microsoft/phi-3-medium-128k-instruct
microsoft/phi-3-medium-4k-instruct
microsoft/phi-3-mini-128k-instruct
microsoft/phi-3-mini-4k-instruct
microsoft/phi-3-small-128k-instruct
microsoft/phi-3-small-8k-instruct
microsoft/phi-3-vision-128k-instruct
microsoft/phi-3.5-mini-instruct
microsoft/phi-3.5-moe-instruct
microsoft/phi-3.5-vision-instruct
microsoft/phi-4-mini-instruct
microsoft/phi-4-multimodal-instruct
mistralai/codestral-22b-instruct-v0.1
mistralai/mamba-codestral-7b-v0.1
mistralai/mathstral-7b-v0.1
mistralai/mistral-7b-instruct-v0.2
mistralai/mistral-7b-instruct-v0.3
mistralai/mistral-large
mistralai/mistral-large-2-instruct
mistralai/mistral-medium-3-instruct
mistralai/mistral-small-24b-instruct
mistralai/mistral-small-3.1-24b-instruct-2503
mistralai/mixtral-8x22b-instruct-v0.1
mistralai/mixtral-8x22b-v0.1
mistralai/mixtral-8x7b-instruct-v0.1
nv-mistralai/mistral-nemo-12b-instruct
nvidia/embed-qa-4
nvidia/llama-3.1-nemoguard-8b-content-safety
nvidia/llama-3.1-nemoguard-8b-topic-control
nvidia/llama-3.1-nemotron-51b-instruct
nvidia/llama-3.1-nemotron-70b-instruct
nvidia/llama-3.1-nemotron-70b-reward
nvidia/llama-3.1-nemotron-nano-8b-v1
nvidia/llama-3.1-nemotron-ultra-253b-v1
nvidia/llama-3.2-nv-embedqa-1b-v1
nvidia/llama-3.2-nv-embedqa-1b-v2
nvidia/llama-3.3-nemotron-super-49b-v1
nvidia/llama3-chatqa-1.5-70b
nvidia/llama3-chatqa-1.5-8b
nvidia/mistral-nemo-minitron-8b-8k-instruct
nvidia/mistral-nemo-minitron-8b-base
nvidia/nemoretriever-parse
nvidia/nemotron-4-340b-instruct
nvidia/nemotron-4-340b-reward
nvidia/nemotron-4-mini-hindi-4b-instruct
nvidia/nemotron-mini-4b-instruct
nvidia/neva-22b
nvidia/nv-embed-v1
nvidia/nv-embedcode-7b-v1
nvidia/nv-embedqa-e5-v5
nvidia/nv-embedqa-mistral-7b-v2
nvidia/nvclip
nvidia/usdcode-llama-3.1-70b-instruct
nvidia/vila
nvquery/meta/llama-3.3-70b-instruct
qwen/qwen2-7b-instruct
qwen/qwen2.5-7b-instruct
qwen/qwen2.5-coder-32b-instruct
qwen/qwen2.5-coder-7b-instruct
qwen/qwq-32b
rakuten/rakutenai-7b-chat
rakuten/rakutenai-7b-instruct
snowflake/arctic-embed-l
thudm/chatglm3-6b
tiiuae/falcon3-7b-instruct
tokyotech-llm/llama-3-swallow-70b-instruct-v0.1
upstage/solar-10.7b-instruct
writer/palmyra-creative-122b
writer/palmyra-fin-70b-32k
writer/palmyra-med-70b
writer/palmyra-med-70b-32k
yentinglin/llama-3-taiwan-70b-instruct
zyphra/zamba2-7b-instruct
```

> **注意**：API 端点返回的模型列表与 build.nvidia.com 网页上的模型列表可能不完全一致。网页端有更多新模型（如 `deepseek-v4-flash`、`minimax-m2.7`、`glm-4.7` 等），建议以网页端为准。

---

## 六、适用场景

| 角色 | 推荐理由 |
|------|----------|
| 独立开发者 | 做 Agent、Coding Copilot，省下 API 费用 |
| 学生 / AI 自学者 | 免费 RAG / 微调评估 / 多模型对比实验 |
| 产品经理 | 一把 Key 横评 DeepSeek、Kimi、MiniMax、GLM |
| 模型爱好者 | 第一时间免费试用最新发布的前沿模型 |

---

## 七、注意事项

1. **API Key 安全**：切勿将 Key 提交到 Git 仓库，建议使用环境变量管理
2. **数据隐私**：平台会记录输入输出用于产品改进，**不要上传敏感数据或个人隐私**
3. **免费政策可能调整**：建议尽早注册获取 Key，锁定 12 个月有效期
4. **速率限制**：40 次/分钟，不适合高并发生产环境
5. **仅限非商业用途**：部分模型标注 "Non-Commercial Use Only"，商用需购买订阅

---

## 八、相关链接

- 🔗 NVIDIA Build 平台：[https://build.nvidia.com](https://build.nvidia.com)
- 🔗 模型列表页：[https://build.nvidia.com/models](https://build.nvidia.com/models)
- 🔗 API 模型列表端点：`https://integrate.api.nvidia.com/v1/models`
- 🔗 API 文档：[https://docs.api.nvidia.com/nim](https://docs.api.nvidia.com/nim)
- 🔗 NVIDIA 开发者计划：[https://developer.nvidia.com](https://developer.nvidia.com)
