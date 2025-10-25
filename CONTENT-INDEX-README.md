# Content Index Auto-Rebuilder

这个工具可以自动扫描 `content/` 目录下的所有子目录，并为每个包含 `.md` 文件的子目录生成对应的 JSON 索引文件。

## 功能

- 🔍 自动扫描 `content/` 目录下的所有子目录
- 📝 为每个包含 `.md` 文件的子目录生成 JSON 索引
- 🔄 支持 Git hooks 自动更新
- ✅ 错误处理和状态报告

## 文件说明

### 主要脚本

- `rebuild-content-index.py` - 主要的索引重建脚本
- `install-git-hooks.sh` - 安装 Git hooks 的脚本
- `git-hooks/pre-commit` - Git pre-commit hook

### 生成的索引文件

脚本会自动为以下目录生成索引文件：

- `content/news/news.json` - 新闻文章索引
- `content/messages/messages.json` - 消息索引  
- `content/faq/faq.json` - FAQ 索引
- `content/stats/stats.json` - 统计数据索引

## 使用方法

### 手动运行

```bash
# 重建所有索引
python3 rebuild-content-index.py

# 指定不同的 content 目录
python3 rebuild-content-index.py /path/to/content
```

### 自动运行（推荐）

安装 Git hooks 后，每次提交包含 `content/` 目录变更时，索引文件会自动更新：

```bash
# 安装 Git hooks
./install-git-hooks.sh
```

安装后，当你提交包含 content 目录变更的代码时：

1. Git hook 会检测到 content 目录的变更
2. 自动运行索引重建脚本
3. 将更新后的 JSON 文件添加到提交中

## 索引文件格式

每个 JSON 索引文件包含对应目录下所有 `.md` 文件的文件名列表：

```json
[
  "file1.md",
  "file2.md",
  "file3.md"
]
```

## 注意事项

- 脚本会按字母顺序排序文件名
- 只处理 `.md` 文件，忽略其他文件类型
- 索引文件名格式为 `{目录名}.json`
- 如果脚本执行失败，Git 提交会被阻止

## 故障排除

如果遇到问题：

1. 确保 Python 3 已安装
2. 检查脚本是否有执行权限：`chmod +x rebuild-content-index.py`
3. 手动运行脚本查看错误信息
4. 检查 Git hooks 是否正确安装：`ls -la .git/hooks/pre-commit`
