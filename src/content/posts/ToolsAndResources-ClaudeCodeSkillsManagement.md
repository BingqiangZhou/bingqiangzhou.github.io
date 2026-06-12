---
title: "【工具分享】Claude Code Skills 管理：上下文影响与禁用方法"
published: 2026-05-10
description: 介绍 Claude Code Skills 对上下文窗口的影响，以及五种禁用和优化 Skills 配置的方法。
lang: zh
tags: [工具分享]
---

随着 Claude Code 项目中安装的 Skills 越来越多，一个很自然的问题出现了：**这么多 Skills 会不会影响上下文窗口？能不能暂时关掉不用的 Skill 而不删除文件？**

答案是：**会影响，而且可以禁用。**

## Skills 如何占用上下文

每次启动 Claude Code 会话时，所有 Skill 的**名称和描述**都会被加载到上下文中。只有当你实际调用某个 Skill 时，它的完整内容才会进入上下文。

| 加载时机 | 加载内容 |
|---|---|
| 会话启动 | Skill 名称 + description + when_to_use |
| 实际调用 `/skill-name` | Skill 的完整内容（SKILL.md） |

几个关键数字：

- 描述总预算约为上下文窗口的 **1%**（默认回退值 8,000 字符）
- 单个 Skill 的 description + when_to_use 上限 **1,536 字符**
- 如果你装了 30+ 个 Skill，描述加起来会占用相当可观的上下文空间

如果你的描述经常被截断，可以通过环境变量 `SLASH_COMMAND_TOOL_CHAR_BUDGET` 调高预算上限。

---

## 五种禁用 Skills 的方式

### 方式一：`skillOverrides`（推荐，最灵活）

在 `.claude/settings.local.json` 中配置：

```json
{
  "skillOverrides": {
    "skills-name-1": "off",
    "skills-name-2": "off"
  }
}
```

四种状态值：

| 值 | Claude 可见 | `/` 菜单可见 | 效果说明 |
|---|---|---|---|
| `"on"` | 名称 + 描述 | 是 | 完全启用（默认） |
| `"name-only"` | 仅名称 | 是 | 节省描述上下文，但仍可发现 |
| `"user-invocable-only"` | 隐藏 | 是 | Claude 不自动触发，用户可手动调用 |
| `"off"` | 完全隐藏 | 否 | 等同于不存在 |

**交互式操作（推荐）**：在 Claude Code 中输入 `/skills`，会打开一个交互式列表，用方向键（`↑` `↓`）选中目标 Skill，按 `Space` 循环切换状态（`on` → `off` → `name-only` → `user-invocable-only` → `on`），按 `Enter` 保存。这种方式会自动写入 `.claude/settings.local.json`，无需手动编辑 JSON 文件。

:::tip
相比手动编辑 JSON，交互式操作的优势在于：
- **不怕语法错误**：不用担心 JSON 格式写错导致整个配置失效
- **即时生效**：保存后立即应用到当前会话
- **所见即所得**：列表中直接显示每个 Skill 的当前状态，一目了然
:::

**手动配置**：也可以直接编辑 `.claude/settings.local.json`，适合批量操作或需要版本管理的场景。

**注意**：`skillOverrides` 对插件类 Skill（如 `example-skills:pdf`）无效，插件需要通过方式四管理。

### 方式二：`disable-model-invocation: true`

在 Skill 的 `SKILL.md` 的 YAML frontmatter 中添加：

```yaml
---
name: my-skill
description: ...
disable-model-invocation: true
---
```

效果：
- Claude **不会自动触发**该 Skill
- Skill 的描述**不占用上下文**
- 用户仍可通过 `/my-skill` 手动调用

适合偶尔手动使用、不需要 AI 自动触发的 Skill。

### 方式三：`user-invocable: false`

在 SKILL.md frontmatter 中添加：

```yaml
---
name: my-skill
description: ...
user-invocable: false
---
```

效果：
- `/` 菜单中**不可见**
- Claude 仍可**自动触发**
- 用户**无法手动调用**

适合后台知识类 Skill，不需要用户直接触发。

### 方式四：禁用整个插件

在 settings 中通过 `enabledPlugins` 关闭整个插件：

```json
{
  "enabledPlugins": {
    "example-skills@anthropic-agent-skills": false,
    "ralph-loop@claude-plugins-official": false
  }
}
```

效果：该插件下的**所有 Skill 一次性全部禁用**。适合完全不用某个插件的场景。

### 方式五：权限拒绝

在 permissions 规则中拒绝特定 Skill：

```
Skill(my-skill-name)
```

效果：Claude 被阻止调用该 Skill，但可能仍在列表中可见。这种方式较少使用。

---

## 实际操作建议

按场景选择最合适的方式：

1. **不常用的项目 Skill** → `skillOverrides` 设为 `"off"`
2. **只手动调用的 Skill** → 在 SKILL.md 加 `disable-model-invocation: true`（最省上下文）
3. **完全不用的插件** → `enabledPlugins` 设为 `false`
4. **想保留但减少上下文占用** → `skillOverrides` 设为 `"name-only"`

### 一个典型的配置示例

```json
// .claude/settings.local.json
{
  "skillOverrides": {
    "my-video-generator": "off",
    "my-slides-maker": "off",
    "my-data-monitor": "name-only",
    "my-caption-tool": "name-only"
  },
  "enabledPlugins": {
    "example-skills@anthropic-agent-skills": false
  }
}
```

---

## 总结

Claude Code 的 Skills 系统在带来便利的同时也会占用上下文。好消息是它提供了从「完全启用」到「完全隐藏」之间的多个粒度的控制手段。根据你的实际使用频率，合理配置 `skillOverrides` 和 `disable-model-invocation`，就能在不删除文件的前提下优化上下文使用。
