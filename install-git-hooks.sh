#!/bin/bash
# 安装 Git hooks 脚本

echo "🔧 Installing Git hooks..."

# 确保 git-hooks 目录存在
if [ ! -d ".git/hooks" ]; then
    echo "❌ This doesn't appear to be a Git repository"
    exit 1
fi

# 复制 pre-commit hook
if [ -f "git-hooks/pre-commit" ]; then
    cp git-hooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo "✅ Pre-commit hook installed"
else
    echo "❌ Pre-commit hook file not found"
    exit 1
fi

# 确保重建索引脚本有执行权限
if [ -f "rebuild-content-index.py" ]; then
    chmod +x rebuild-content-index.py
    echo "✅ Content index rebuild script made executable"
else
    echo "❌ Content index rebuild script not found"
    exit 1
fi

echo "🎉 Git hooks installation completed!"
echo ""
echo "Now when you commit changes to content/ directory,"
echo "the JSON index files will be automatically updated."
