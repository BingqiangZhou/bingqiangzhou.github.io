# Tag Renaming Design

## Summary

Rename all 6 blog tags to be more concise and descriptive. Remove "系列" suffix from all tags, and rename 4 tags to better reflect their content.

## Mapping

| Current Tag | New Tag | Post Count |
|---|---|---|
| `日常小结系列` | `学习笔记` | 16 |
| `日常杂耍系列` | `折腾记录` | 10 |
| `论文阅读笔记系列` | `论文阅读笔记` | 8 |
| `工具资源系列` | `工具分享` | 3 |
| `小学生记叙文系列` | `碎碎念` | 2 |
| `读书笔记系列` | `读书笔记` | 1 |

## Impact

- 37 posts need frontmatter `tags` field updated
- URLs change (e.g., `/tags/日常小结系列/` -> `/tags/学习笔记/`)
- No template/component code changes needed (tags are queried dynamically)

## Implementation

For each post markdown file in `src/content/posts/`:
- Update the `tags` array in YAML frontmatter using the mapping above
