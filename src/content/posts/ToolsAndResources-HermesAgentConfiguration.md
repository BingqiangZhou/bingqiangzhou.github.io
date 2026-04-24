---
title: "【工具分享】Hermes Agent 配置笔记"
published: 2026-04-24
description: "Hermes Agent 官方文档及社区实践笔记，涵盖安装、模型配置、终端后端、网关接入、技能、记忆、工具等核心内容。"
lang: zh
tags: ["工具分享", "学习笔记"]
---

> 本笔记整理自 Hermes Agent 官方文档及社区实践，涵盖安装、模型配置、终端后端、网关接入、技能、记忆、工具等核心内容。

---

## 一、安装

```bash
# Linux / macOS / WSL2 / Android (Termux)
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

Windows 用户需先安装 WSL2 或参考官方 Windows 安装指南。

---

## 二、基础配置向导

首次运行时，执行交互式配置向导：

```bash
hermes setup
```

向导引导完成：
- API 密钥配置
- 默认模型选择
- 基础参数设置
- 性能优化

---

## 三、配置目录结构

所有设置存储在 `~/.hermes/` 目录中：

```
~/.hermes/
├── config.yaml      # 主配置文件（模型、终端、TTS、压缩等）
├── .env             # API 密钥与敏感信息
├── auth.json        # OAuth 凭证
├── SOUL.md          # Agent 身份/人设（系统提示第 1 槽位）
├── memories/        # 持久记忆（MEMORY.md、USER.md）
├── skills/          # Agent 技能库
├── cron/            # 定时任务
├── sessions/        # 网关会话
└── logs/            # 日志
```

---

## 四、配置管理命令

```bash
hermes config                # 查看当前配置
hermes config edit           # 在编辑器中打开 config.yaml
hermes config set KEY VAL    # 设置指定配置项
hermes config check          # 检查缺失配置项
hermes config migrate        # 交互式补全缺失配置项

# 示例
hermes config set model anthropic/claude-opus-4
hermes config set terminal.backend docker
hermes config set OPENROUTER_API_KEY sk-or-...   # 自动保存到 .env
```

> `hermes config set` 会自动将 API 密钥路由到 `.env`，其余保存到 `config.yaml`。

---

## 五、配置优先级

从高到低：

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 | CLI 参数 | `hermes chat --model anthropic/claude-sonnet-4` |
| 2 | `~/.hermes/config.yaml` | 非敏感设置的主配置文件 |
| 3 | `~/.hermes/.env` | 环境变量，**必须**用于敏感信息 |
| 4 | 内置默认值 | 硬编码安全默认值 |

**通用规则**：API 密钥、令牌、密码 → `.env`；模型、终端、工具等 → `config.yaml`。

### 环境变量替换

在 `config.yaml` 中可用 `${VAR_NAME}` 引用环境变量：

```yaml
auxiliary:
  vision:
    api_key: ${GOOGLE_API_KEY}
    base_url: ${CUSTOM_VISION_URL}
```

---

## 六、模型配置

### config.yaml 中的模型设置

```yaml
model:
  provider: "openrouter"          # 可选：auto、openrouter、anthropic、openai 等
  default: "openrouter/free"      # 默认模型
  base_url: ""                    # 自定义 OpenAI 兼容端点（会覆盖 provider）
  api_key: ""                     # base_url 的 API 密钥
  timeout: 120                    # LLM API 调用超时（秒）
```

### .env 中的密钥

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxx
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxx
```

> 当 `config.yaml` 中指定了 `openai/gpt-4o`，Hermes 会自动去 `.env` 里找 `OPENAI_API_KEY`。

### 模型切换命令

```bash
hermes model list                          # 查看可用模型
hermes model set strong_reasoning          # 切换模型
hermes --model strong_reasoning "分析代码"  # 临时使用特定模型
```

### 任务类型与模型匹配

| 任务类型 | 推荐模型 | 配置要点 |
|----------|----------|----------|
| 代码开发 | 强推理模型 | 深度思考，准确执行 |
| 日常对话 | 通用模型 | 自然流畅，响应快速 |
| 批量处理 | 成本敏感模型 | 经济高效，满足需求 |
| 创意写作 | 通用模型 | 创意丰富，表达自然 |
| 技术分析 | 强推理模型 | 逻辑严谨，分析深入 |

---

## 七、终端后端配置

Hermes 支持 **6 种终端后端**，决定 Agent 的 shell 命令实际执行位置：

```yaml
terminal:
  backend: local        # 可选：local | docker | ssh | modal | daytona | singularity
  cwd: "."              # 工作目录
  timeout: 180          # 每条命令超时（秒）
  persistent_shell: true # 持久化 Shell（SSH 默认开启）
```

### 后端对比

| 后端 | 执行位置 | 隔离级别 | 适用场景 |
|------|----------|----------|----------|
| **local** | 本机 | 无 | 开发、个人使用 |
| **docker** | Docker 容器 | 完全隔离 | 安全沙箱、CI/CD |
| **ssh** | 远程服务器 | 网络边界 | 远程开发 |
| **modal** | Modal 云沙箱 | 完全隔离 | 临时云计算 |
| **daytona** | Daytona 工作区 | 完全隔离 | 云开发环境 |
| **singularity** | Singularity 容器 | 命名空间 | HPC 集群 |

### Docker 后端示例

```yaml
terminal:
  backend: docker
  docker_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  docker_mount_cwd_to_workspace: false
  docker_forward_env:
    - "GITHUB_TOKEN"
  docker_volumes:
    - "/home/user/projects:/workspace/projects"
    - "/home/user/data:/data:ro"
  container_cpu: 1
  container_memory: 5120
  container_persistent: true
```

### SSH 后端

需在 `.env` 中设置：

```bash
TERMINAL_SSH_HOST=my-server.example.com
TERMINAL_SSH_USER=ubuntu
TERMINAL_SSH_PORT=22              # 可选，默认 22
TERMINAL_SSH_KEY=/path/to/key     # 可选
```

---

## 八、网关接入（一键配置）

### 核心原理

Hermes Agent 的 `gateway` 模块充当智能消息路由器：

```
用户消息（飞书/微信/企微/钉钉...）
        ↓
   Hermes Gateway（统一接收 → 路由 → 回复）
        ↓
   Hermes Agent 核心（LLM 处理 + 工具调用 + 记忆检索）
        ↓
   Gateway 将回复发送回对应平台
```

所有平台共享同一套持久记忆和技能库，跨平台体验一致。

### 支持的平台（14+）

| 平台 | 类型 | 说明 |
|------|------|------|
| Telegram | 即时通讯 | 支持文字、语音、图片、文件、群组 |
| Discord | 即时通讯 | 支持文字、语音频道 |
| Slack | 团队协作 | 工作区 Bot，适合企业 |
| WhatsApp | 即时通讯 | 通过 WhatsApp Web 桥接 |
| Signal | 即时通讯 | 加密通讯平台 |
| SMS (Twilio) | 短信 | 通过 Twilio 收发短信 |
| Email | 邮件 | SMTP/IMAP 收发邮件 |
| Home Assistant | 智能家居 | 语音助手集成 |
| Mattermost | 团队协作 | 开源团队聊天 |
| Matrix | 去中心化 | 开放协议 |
| 钉钉 | 企业协作 | 阿里钉钉机器人 |
| 飞书 / Lark | 企业协作 | 字节跳动飞书机器人 |
| 企业微信 | 企业协作 | 腾讯企业微信机器人 |
| Open WebUI | Web 界面 | 浏览器 Web UI |
| Webhooks | 开发者 | 接收外部事件 |

### 一键接入流程

```bash
# 第一步：交互式配置向导（选平台、填 Token）
hermes gateway setup

# 第二步：安装为后台服务（开机自启）
hermes gateway install

# 第三步：启动网关
hermes gateway start
```

> `hermes gateway setup` 运行后会出现交互式向导，选择平台并按提示输入 Token/凭证，所有凭证自动保存到 `~/.hermes/.env`。飞书甚至支持扫码创建，扫一下二维码就自动完成应用创建 + 凭证保存。

### 用户配对审批（关键！）

Hermes 网关采用**默认拒绝**安全策略。启动网关后，当未知用户首次向机器人发消息时，会收到一个**一次性配对码**，例如：

> 配对码：`XKGH5N7P`

在服务器终端执行审批：

```bash
hermes pairing approve <平台名> <配对码>

# 示例
hermes pairing approve weixin E6JNGBCX
hermes pairing approve telegram XKGH5N7P
hermes pairing approve wecom XXXXXXXX
hermes pairing approve feishu ABCD1234
```

### 网关管理命令

| 命令 | 说明 |
|------|------|
| `hermes gateway setup` | 交互式配置向导 |
| `hermes gateway install` | 安装为用户级系统服务 |
| `hermes gateway install --system` | 安装为系统级服务（需 sudo） |
| `hermes gateway start` | 启动网关 |
| `hermes gateway stop` | 停止网关 |
| `hermes gateway status` | 查看运行状态 |

### 配对管理命令

| 命令 | 说明 |
|------|------|
| `hermes pairing approve <平台> <配对码>` | 批准用户配对请求 |
| `hermes pairing list` | 查看待处理和已批准的用户 |
| `hermes pairing revoke <用户ID>` | 撤销已授权用户 |

### 聊天内置命令（所有平台通用）

在任意平台的聊天窗口中直接发送：

| 命令 | 说明 |
|------|------|
| `/new` | 新建对话（清除上下文） |
| `/reset` | 重置当前会话 |
| `/model` | 切换 AI 模型 |
| `/voice` | 开关语音回复 |
| `/background` | 将当前任务转为后台执行 |
| `/reload-mcp` | 重新加载 MCP 服务器配置 |
| `/help` | 显示所有命令 |

### 完整接入流程图

```
hermes gateway setup                          ← 选平台、填 Token
        ↓
hermes gateway install                        ← 安装为后台服务
        ↓
hermes gateway start                          ← 启动网关
        ↓
用户在平台发消息 → 收到配对码
        ↓
hermes pairing approve <平台> <配对码>        ← 审批授权
        ↓
✅ 接入完成，可以正常对话
```

---

## 九、各平台接入要点

> 所有平台均通过 `hermes gateway setup` 一键接入，向导会自动引导完成配置和凭证保存。以下仅补充各平台特有的注意事项。

### 飞书（Feishu / Lark）

- 支持**扫码创建**：选择 Feishu / Lark 后直接用飞书 App 扫码，自动完成应用创建 + 凭证保存
- 国内版 Domain 填 `feishu`，国际版（Lark）填 `lark`
- 连接模式推荐选择 `websocket`（无需公网 IP）
- 私聊响应每条消息；群聊仅响应 @提及；共享群聊默认会话隔离

### 微信（个人微信 Weixin）

- 通过腾讯 iLink Bot API 连接**个人微信账号**（企业微信请选 WeCom）
- 选择 Weixin 后终端显示二维码，用微信扫码确认即可
- 需提前安装依赖：`pip install aiohttp cryptography`
- 群聊策略默认 `disabled`（个人微信可能加入很多群，有意为之）
- 支持媒体自动加解密（AES-128-ECB）、输入状态指示、Markdown 自动降级

### 企业微信（WeCom）

- 需先在[企业微信管理后台](https://work.weixin.qq.com/wework_admin/frame)创建 **AI Bot**，获取 Bot ID 和 Secret
- 选择 WeCom 后输入 Bot ID 和 Secret 即可
- 需安装依赖：`pip install aiohttp httpx cryptography`
- 通过 WebSocket 连接，无需公网端点
- 群聊策略默认 `open`

### 其他平台

- **Telegram**：通过 @BotFather 创建 Bot 获取 Token
- **Discord**：在 Discord Developer Portal 创建 Bot 获取 Token
- **钉钉**：在钉钉开放平台创建企业内部应用获取 AppKey/AppSecret
- **Slack**：在 Slack API 创建 App 获取 Bot Token

> 无论哪个平台，接入后都需要完成**用户配对审批**（见第八章）才能正常对话。

---

## 十、技能（Skills）管理

技能是可复用的任务方法包，存储在 `~/.hermes/skills/`。

```bash
hermes skill list              # 查看所有技能
hermes skill show code_review  # 查看技能详情
hermes skill update code_review # 更新技能
hermes skill remove outdated   # 删除过时技能
```

---

## 十一、记忆系统

记忆文件位于 `~/.hermes/memories/`，包含 `MEMORY.md` 和 `USER.md`。

```bash
hermes learn --type preference --key "language" --value "中文"
hermes recall --key "language"
hermes search --query "代码风格"
hermes memory list
hermes forget --key "old_project"
```

---

## 十二、工具管理

```bash
hermes tools list                        # 查看所有工具
hermes tools enable file_operations      # 启用工具
hermes tools disable web_scraping        # 禁用工具
hermes tools status                      # 查看工具状态
```

---

## 十三、MCP 集成

```bash
hermes mcp add weather --url http://localhost:8080   # 添加 MCP 服务器
hermes mcp list                                       # 查看列表
hermes mcp test weather                               # 测试连接
```

---

## 十四、人设定制（SOUL.md）

编辑 `~/.hermes/SOUL.md` 定义 Agent 身份：

```markdown
## 基本身份
- 名称: Hermes助手
- 角色: 专业AI助手
- 风格: 专业但友好

## 说话风格
- 语言: 中文为主
- 语气: 专业但不过于正式

## 行为规则
- 高风险操作前必须确认
- 始终优先考虑安全性
```

---

## 十五、人类延迟（消息平台）

```yaml
human_delay:
  mode: "off"       # 可选：off | natural | custom
  min_ms: 800       # 最小延迟（custom 模式）
  max_ms: 2500      # 最大延迟（custom 模式）
```

---

## 十六、故障排除

```bash
hermes config validate    # 检查配置语法
hermes config reset       # 重置错误配置
hermes doctor             # 综合诊断
hermes status             # 查看系统状态
hermes cache clear        # 清理缓存
```

| 常见问题 | 解决方法 |
|---------|---------|
| 飞书机器人不回复 | 检查事件订阅是否勾选 `im.message.receive_v1` |
| 飞书卡片按钮报错 200340 | 需订阅 `card.action.trigger` + 启用互动卡片 |
| 微信 `aiohttp and cryptography required` | `pip install aiohttp cryptography` |
| 微信会话过期 (errcode=-14) | 重新运行 `hermes gateway setup` 扫码 |
| 企业微信 `invalid secret` | 验证 Bot ID 和 Secret 是否匹配 |
| 群聊中 Agent 不响应 | 检查 `group_policy` 和 `allowed_users` 配置 |
| Docker 后端失败 | 运行 `docker version` 验证，或切回 `local` |
| SSH 后端失败 | 确认 `TERMINAL_SSH_HOST` 和 `TERMINAL_SSH_USER` 已设置 |

---

## 参考链接

- [Hermes Agent 中文文档](https://hermesagent.org.cn/docs/user-guide/configuration)
- [飞书 / Lark 设置](https://hermes-doc.aigc.green/user-guide/messaging/feishu)
- [微信设置](https://hermes-doc.aigc.green/user-guide/messaging/weixin)
- [企业微信设置](https://hermes-doc.aigc.green/user-guide/messaging/wecom)
- [消息网关概览](https://hermes.xaapi.ai/messaging/overview)
- [GitHub 仓库](https://github.com/NousResearch/hermes-agent)
