# Sveltia CMS 中文标题和 Slug 解决方案

## 🎯 问题描述

1. **中文标题问题**：Sveltia CMS 默认使用标题作为文件名，中文标题会导致文件名是中文，前端无法正确匹配
2. **管理界面问题**：使用 `identifier_field: slug` 后，CMS 管理界面显示的是 slug 而不是中文标题，不方便管理

## ✅ 解决方案

### 配置修改

我已经修改了 `admin/config.yml` 文件，为所有集合添加了以下配置：

```yaml
collections:
  - name: "news"
    identifier_field: slug  # 使用 slug 作为文件名
    summary: "{{title}}"    # 在管理界面显示中文标题
    fields:
      - { label: "Slug", name: "slug", widget: "string", required: true }
```

### 前端代码更新

更新了所有加载器文件，确保正确处理基于 slug 的文件名：

- `news-loader.js`
- `cms-loader.js` 
- `article-loader.js`

## 🔧 技术实现

### 1. 文件名生成

现在文件名基于 `slug` 字段生成：
- ✅ 文件名：`academic-dream-interrupted.md`
- ✅ URL 友好：只包含英文字母、数字和连字符
- ✅ 前端匹配：可以正确找到对应的文章

### 2. 管理界面显示

使用 `summary: "{{title}}"` 配置：
- ✅ 管理界面显示：中文标题
- ✅ 文件名使用：slug 字段
- ✅ 用户体验：既方便管理又技术正确

### 3. 前端匹配逻辑

更新了前端代码的 slug 处理逻辑：

```javascript
// 使用文件名作为 slug（因为现在文件名就是基于 slug 的）
const fileSlug = file.replace('.md', '');
this.news.push({
    ...frontmatter,
    slug: frontmatter.slug || fileSlug
});
```

## 📝 使用说明

### 创建新文章

1. **在 Sveltia CMS 中**：
   - 输入中文标题：`"Tara张雅笛案件最新进展"`
   - 输入英文 slug：`"tara-case-latest-update"`
   - 保存后文件名：`tara-case-latest-update.md`

2. **管理界面显示**：
   - 列表显示：`"Tara张雅笛案件最新进展"`
   - 实际文件名：`tara-case-latest-update.md`

3. **前端访问**：
   - URL：`article.html?slug=tara-case-latest-update`
   - 正确匹配到文件：`content/news/tara-case-latest-update.md`

## 🎉 效果

### 解决的问题

- ✅ **中文标题兼容**：可以使用中文标题，文件名使用英文 slug
- ✅ **管理界面友好**：CMS 管理界面显示中文标题，便于识别
- ✅ **URL 友好**：所有 URL 使用英文 slug，SEO 友好
- ✅ **前端匹配**：文章页面可以正确找到对应的内容

### 工作流程

1. 📝 **创建文章**：在 CMS 中输入中文标题和英文 slug
2. 💾 **自动保存**：文件名基于 slug 生成，管理界面显示中文标题
3. 🔄 **自动部署**：GitHub Actions 自动更新索引和部署
4. 🌐 **前端访问**：用户通过英文 slug 访问，看到中文标题

## 🔍 验证方法

### 测试步骤

1. **创建测试文章**：
   - 标题：`"测试中文标题"`
   - Slug：`"test-chinese-title"`

2. **检查文件**：
   - 文件名：`test-chinese-title.md`
   - 内容包含中文标题

3. **访问测试**：
   - URL：`article.html?slug=test-chinese-title`
   - 应该正确显示文章内容

### 故障排除

如果遇到问题：

1. **检查 slug 字段**：确保每篇文章都有 slug 字段
2. **检查文件名**：确保文件名与 slug 一致
3. **检查前端代码**：确保加载器正确使用文件名作为 slug
4. **清除缓存**：刷新浏览器缓存

## 📋 注意事项

- **Slug 要求**：slug 字段是必填的，建议使用英文和连字符
- **向后兼容**：现有文章如果没有 slug 字段，会使用文件名作为 slug
- **URL 一致性**：确保所有链接都使用 slug 而不是标题
- **SEO 优化**：英文 slug 对搜索引擎更友好
