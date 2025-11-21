#!/bin/bash

# Hugo 构建脚本
echo "开始构建 Hugo 网站..."

# 检查 Hugo 是否安装
if ! command -v hugo &> /dev/null; then
    echo "错误: Hugo 未安装。请先安装 Hugo: brew install hugo"
    exit 1
fi

# 构建网站
hugo --minify

if [ $? -eq 0 ]; then
    echo "✅ Hugo 构建成功！"
    echo "构建输出目录: public/"
else
    echo "❌ Hugo 构建失败！"
    exit 1
fi

