#!/usr/bin/env python3
"""
修复 frontmatter 中的 published 字段
将 published: false 转换为 draft: true
将 published: true 移除（Hugo 默认发布）
"""
import os
import re
import sys

def fix_frontmatter(file_path):
    """修复单个文件的 frontmatter"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查是否有 frontmatter
        if not content.startswith('---'):
            return False
        
        # 提取 frontmatter
        frontmatter_match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
        if not frontmatter_match:
            return False
        
        frontmatter = frontmatter_match.group(1)
        body = frontmatter_match.group(2)
        
        # 处理 published 字段
        lines = frontmatter.split('\n')
        new_lines = []
        has_draft = False
        
        for line in lines:
            # 跳过 published 字段
            if re.match(r'^\s*published\s*:', line):
                # 如果 published: false，添加 draft: true
                if 'false' in line.lower():
                    if not has_draft:
                        new_lines.append('draft: true')
                        has_draft = True
                # 如果 published: true，直接跳过（Hugo 默认发布）
                continue
            new_lines.append(line)
        
        new_frontmatter = '\n'.join(new_lines)
        new_content = f'---\n{new_frontmatter}\n---\n{body}'
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True
    except Exception as e:
        print(f"错误处理 {file_path}: {e}", file=sys.stderr)
        return False

def main():
    """主函数"""
    content_dirs = ['content/news', 'content/messages', 'content/faq']
    fixed_count = 0
    
    for content_dir in content_dirs:
        if not os.path.exists(content_dir):
            continue
        
        for filename in os.listdir(content_dir):
            if not filename.endswith('.md'):
                continue
            
            file_path = os.path.join(content_dir, filename)
            if fix_frontmatter(file_path):
                fixed_count += 1
                print(f"已修复: {file_path}")
    
    print(f"\n总共修复了 {fixed_count} 个文件")

if __name__ == '__main__':
    main()

