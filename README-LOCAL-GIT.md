# 使用本地 Git 存储库

本项目已配置为支持 Sveltia CMS 的本地 Git 存储库功能。

## 配置说明

当前配置：
- **Backend**: GitHub
- **仓库**: free-tara-yadi/test
- **分支**: main
- **本地服务器**: http://127.0.0.1:8080

## 使用步骤

### 1. 启动本地开发服务器

确保 live-server 正在运行：
```bash
# 如果还没有启动，请启动 live-server
# 确保服务器运行在 http://127.0.0.1:8080
```

### 2. 打开 CMS 管理界面

使用 **Chrome** 或 **Edge** 浏览器（必须使用 Chromium 内核的浏览器）打开：

```
http://127.0.0.1:8080/admin/index.html
```

**注意**：
- 必须使用 Chrome 或 Edge 浏览器
- 不能使用 Safari 或 Firefox
- 可以使用 `localhost` 或 `127.0.0.1`

### 3. 选择本地存储库

1. 在 CMS 界面中，点击 **"Work with Local Repository"** 按钮
2. 选择项目根目录（`/Users/huangning/Documents/Projects/Tara`）
3. 确认选择

### 4. 编辑内容

现在你可以正常使用 CMS 编辑内容：
- 所有更改都会直接保存到本地文件
- 不需要网络连接（除了首次加载）
- 不需要 GitHub 认证

### 5. 查看更改

使用 Git 命令查看更改：
```bash
git diff
```

或使用图形界面工具（如 GitHub Desktop）查看更改。

### 6. 预览网站

在浏览器中打开：
```
http://127.0.0.1:8080
```

查看更改后的效果。

### 7. 提交更改

如果满意更改，使用 Git 提交：
```bash
git add .
git commit -m "更新内容"
git push
```

如果不满意，可以丢弃更改：
```bash
git checkout .
```

## 重要提示

1. **浏览器要求**：必须使用 Chrome 或 Edge 浏览器
2. **Git 操作**：CMS 不会自动执行 Git 操作，需要手动提交和推送
3. **重新加载**：修改配置文件后需要重新加载 CMS 页面
4. **文件系统 API**：此功能依赖浏览器的 File System Access API，仅在支持的浏览器中可用

## 故障排除

### 错误："not a repository root directory"
- 确保项目根目录存在 `.git` 文件夹
- 运行 `git init` 初始化仓库

### 错误："Authentication Aborted"
- 如果使用 OAuth 认证，可能需要调整 Cross-Origin-Opener-Policy
- 本地存储库模式不需要认证，可以忽略此错误

### 无法选择文件夹
- 确保使用 Chrome 或 Edge 浏览器
- 检查浏览器是否支持 File System Access API

## 参考文档

- [Sveltia CMS 本地 Git 存储库文档](https://sveltia-cms.com/docs/guides/local-repository)

