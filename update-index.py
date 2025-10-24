#!/usr/bin/env python3
"""
更新内容索引文件
扫描 content/news 和 content/messages 目录，自动更新索引文件
"""

import os
import json
from pathlib import Path

def update_index(directory, index_file):
    """更新指定目录的索引文件"""
    content_dir = Path(directory)
    
    if not content_dir.exists():
        print(f"Directory {directory} does not exist")
        return
    
    # 获取所有 .md 文件
    md_files = sorted([f.name for f in content_dir.glob('*.md')])
    
    # 排除索引文件
    md_files = [f for f in md_files if f != 'index.md']
    
    # 写入索引文件
    index_path = Path(index_file)
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(md_files, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {index_file}: {len(md_files)} files")

if __name__ == '__main__':
    # 更新 news 索引
    update_index('content/news', 'content/news/news.json')
    
    # 更新 messages 索引
    update_index('content/messages', 'content/messages/messages.json')
    
    print("All index files updated successfully!")

