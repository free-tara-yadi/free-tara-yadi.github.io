#!/usr/bin/env python3
"""
自动重建 content 目录下所有子目录的 JSON 索引文件
扫描所有包含 .md 文件的子目录，自动更新对应的 JSON 索引文件
"""

import os
import json
import sys
from pathlib import Path
from typing import List, Dict

def find_content_directories(content_root: Path) -> List[Path]:
    """查找所有包含 .md 文件的子目录"""
    content_dirs = []
    
    if not content_root.exists():
        print(f"Content directory {content_root} does not exist")
        return content_dirs
    
    # 遍历 content 目录下的所有子目录
    for item in content_root.iterdir():
        if item.is_dir():
            # 检查是否包含 .md 文件
            md_files = list(item.glob('*.md'))
            if md_files:
                content_dirs.append(item)
                print(f"Found content directory: {item.name} ({len(md_files)} .md files)")
    
    return content_dirs

def update_index(directory: Path, index_filename: str = None) -> bool:
    """更新指定目录的索引文件"""
    if not directory.exists():
        print(f"Directory {directory} does not exist")
        return False
    
    # 获取所有 .md 文件
    md_files = sorted([f.name for f in directory.glob('*.md')])
    
    if not md_files:
        print(f"No .md files found in {directory}")
        return False
    
    # 确定索引文件名
    if index_filename is None:
        index_filename = f"{directory.name}.json"
    
    # 写入索引文件
    index_path = directory / index_filename
    
    try:
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(md_files, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Updated {index_path}: {len(md_files)} files")
        return True
    except Exception as e:
        print(f"✗ Error updating {index_path}: {e}")
        return False

def rebuild_all_indices(content_root: str = "content") -> bool:
    """重建所有 content 子目录的索引文件"""
    content_path = Path(content_root)
    
    if not content_path.exists():
        print(f"Content root directory '{content_root}' does not exist")
        return False
    
    print(f"Scanning content directory: {content_path.absolute()}")
    
    # 查找所有包含 .md 文件的子目录
    content_dirs = find_content_directories(content_path)
    
    if not content_dirs:
        print("No content directories found")
        return False
    
    success_count = 0
    total_count = len(content_dirs)
    
    print(f"\nUpdating {total_count} index files...")
    
    for directory in content_dirs:
        if update_index(directory):
            success_count += 1
    
    print(f"\n✓ Successfully updated {success_count}/{total_count} index files")
    
    if success_count == total_count:
        print("All index files updated successfully!")
        return True
    else:
        print(f"Warning: {total_count - success_count} index files failed to update")
        return False

def main():
    """主函数"""
    # 支持命令行参数指定 content 目录
    content_root = sys.argv[1] if len(sys.argv) > 1 else "content"
    
    print("=" * 50)
    print("Content Index Rebuilder")
    print("=" * 50)
    
    success = rebuild_all_indices(content_root)
    
    if success:
        print("\n🎉 All done!")
        sys.exit(0)
    else:
        print("\n❌ Some errors occurred")
        sys.exit(1)

if __name__ == '__main__':
    main()
