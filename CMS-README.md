# CMS 使用说明

## 添加新内容后的操作

使用 CMS 添加新的新闻或留言后，需要运行以下命令更新索引文件：

```bash
python3 update-index.py
```

这个脚本会自动扫描 `content/news` 和 `content/messages` 目录，更新索引文件。

## 内容格式

### 留言格式

留言文件应该遵循以下格式：

```markdown
---
author: "作者名"
date: "2025-10-24"
published: true
---

Tara

正文内容...

作者名
```

注意：
- `author` 和 `date` 字段需要使用引号
- 内容放在 frontmatter 之后
- 开头添加 "Tara" 称呼
- 结尾添加作者签名

### 新闻格式

新闻文件格式：

```markdown
---
title: "标题"
date: "2025-10-24"
category: "latest"
tags: ["tag1", "tag2"]
excerpt: "摘要"
image: "/assets/image.jpg"
published: true
---

正文内容...
```

## 文件结构

- `content/news/` - 新闻文章
- `content/messages/` - 留言
- `content/news/news.json` - 新闻索引文件
- `content/messages/messages.json` - 留言索引文件

