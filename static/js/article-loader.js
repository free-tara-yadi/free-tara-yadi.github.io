// 文章页面加载器
class ArticleLoader {
    constructor() {
        this.news = [];
        this.currentArticle = null;
    }

    // 从 URL 获取 slug
    getSlugFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('slug');
    }

    // 从 URL 获取 ID
    getIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // 根据 slug 或 ID 查找文章
    findArticle() {
        const slug = this.getSlugFromUrl();
        const id = this.getIdFromUrl();

        if (slug) {
            return this.news.find(article => {
                const articleSlug = article.slug || article.title.toLowerCase().replace(/\s+/g, '-');
                return articleSlug === slug;
            });
        }

        if (id) {
            return this.news[parseInt(id) - 1];
        }

        return null;
    }

    // 获取分类标签
    getCategoryLabel(category) {
        const labels = {
            'latest': '最新消息',
            'case': '案件详情',
            'media': '媒体报导',
            'action': '行动倡议',
            'update': '最新动态'
        };
        return labels[category] || category;
    }

    // 获取标签中文名
    getTagLabel(tag) {
        const labels = {
            'tara': 'Tara张雅笛',
            'human-rights': '人权',
            'student': '学生',
            'international': '国际声援',
            'legal': '法律',
            'academic': '学术',
            'tibet': '西藏',
            'detention': '拘留'
        };
        return labels[tag] || tag;
    }

    // 渲染文章标题
    renderTitle(title) {
        const titleElement = document.getElementById('article-title');
        if (titleElement) {
            titleElement.textContent = title;
        }

        // 更新面包屑
        const breadcrumb = document.querySelector('.breadcrumb-current');
        if (breadcrumb) {
            breadcrumb.textContent = title;
        }

        // 更新页面标题
        document.title = `${title} - Free Tara Yadi`;
    }

    // 渲染文章元信息
    renderMeta(article) {
        const dateElement = document.getElementById('article-date');
        if (dateElement) {
            dateElement.textContent = article.date;
        }

        const categoryElement = document.getElementById('article-category');
        if (categoryElement) {
            const link = categoryElement.querySelector('a');
            if (link) {
                link.href = `news.html?cat=${article.category}`;
                link.textContent = this.getCategoryLabel(article.category);
            }
        }
    }

    // 渲染文章图片
    renderImage(image) {
        const imageElement = document.getElementById('article-image');
        if (imageElement && image) {
            imageElement.innerHTML = `<img src="${image}" alt="文章配图">`;
        }
    }

    // 渲染文章内容
    renderBody(body) {
        const bodyElement = document.getElementById('article-body');
        if (bodyElement) {
            bodyElement.innerHTML = body;
        }
    }

    // 渲染文章标签
    renderTags(tags) {
        const tagsElement = document.getElementById('article-tags');
        if (tagsElement && tags && tags.length > 0) {
            tagsElement.innerHTML = tags.map(tag => {
                const label = this.getTagLabel(tag);
                return `
                    <span class="tag" data-tag="${tag}">
                        <a href="news.html?tag=${tag}">${label}</a>
                    </span>
                `;
            }).join('');
        }
    }

    // 渲染文章导航（上一篇/下一篇）
    renderNavigation(currentIndex) {
        const navElement = document.getElementById('article-navigation');
        if (!navElement) return;

        const prevArticle = currentIndex > 0 ? this.news[currentIndex - 1] : null;
        const nextArticle = currentIndex < this.news.length - 1 ? this.news[currentIndex + 1] : null;

        let navHTML = '';

        if (prevArticle) {
            const prevSlug = prevArticle.slug || prevArticle.title.toLowerCase().replace(/\s+/g, '-');
            navHTML += `
                <a href="article.html?slug=${prevSlug}" class="nav-link prev">
                    <span class="nav-label">上一篇</span>
                    <span class="nav-title">${prevArticle.title}</span>
                </a>
            `;
        }

        if (nextArticle) {
            const nextSlug = nextArticle.slug || nextArticle.title.toLowerCase().replace(/\s+/g, '-');
            navHTML += `
                <a href="article.html?slug=${nextSlug}" class="nav-link next">
                    <span class="nav-label">下一篇</span>
                    <span class="nav-title">${nextArticle.title}</span>
                </a>
            `;
        }

        navElement.innerHTML = navHTML;
    }

    // 渲染相关文章
    renderRelatedArticles(currentArticle) {
        const relatedElement = document.getElementById('related-articles');
        if (!relatedElement) return;

        // 获取除当前文章外的其他文章，最多3篇
        const relatedArticles = this.news
            .filter(article => article.title !== currentArticle.title)
            .slice(0, 3);

        if (relatedArticles.length === 0) {
            relatedElement.innerHTML = '<p>暂无相关文章</p>';
            return;
        }

        relatedElement.innerHTML = relatedArticles.map(article => {
            const slug = article.slug || article.title.toLowerCase().replace(/\s+/g, '-');
            return `
                <article class="news-card">
                    <a href="article.html?slug=${slug}" class="news-img">
                        <img src="${article.image || './assets/rock.png'}" alt="相关文章">
                    </a>
                    <h3>${article.title}</h3>
                    <p class="news-date">${article.date}</p>
                </article>
            `;
        }).join('');
    }

    // 渲染分享按钮
    renderShareButtons(article) {
        // 获取当前页面的完整URL
        const currentUrl = window.location.href;
        const encodedUrl = encodeURIComponent(currentUrl);
        const encodedTitle = encodeURIComponent(article.title);

        // Facebook分享链接
        const facebookShareElement = document.getElementById('share-facebook');
        if (facebookShareElement) {
            facebookShareElement.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            facebookShareElement.target = '_blank';
            facebookShareElement.rel = 'noopener noreferrer';
        }

        // X (Twitter) 分享链接
        const xShareElement = document.getElementById('share-x');
        if (xShareElement) {
            xShareElement.href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
            xShareElement.target = '_blank';
            xShareElement.rel = 'noopener noreferrer';
        }
    }

    // 加载并渲染文章
    async loadArticle() {
        // 等待 CMS Loader 初始化完成
        if (!window.cmsLoader || !window.cmsLoader.news || window.cmsLoader.news.length === 0) {
            // 如果 CMS Loader 还没初始化，手动加载新闻
            await this.loadNews();
        } else {
            this.news = window.cmsLoader.news;
        }

        // 查找当前文章
        this.currentArticle = this.findArticle();

        if (!this.currentArticle) {
            this.renderError();
            return;
        }

        // 获取当前文章的索引
        const currentIndex = this.news.indexOf(this.currentArticle);

        // 渲染文章内容
        this.renderTitle(this.currentArticle.title);
        this.renderMeta(this.currentArticle);
        this.renderImage(this.currentArticle.image);
        this.renderBody(this.currentArticle.body);
        this.renderTags(this.currentArticle.tags);
        this.renderNavigation(currentIndex);
        this.renderRelatedArticles(this.currentArticle);
        this.renderShareButtons(this.currentArticle);
    }

    // 加载新闻
    async loadNews() {
        try {
            const indexResponse = await fetch('content/news/news.json');
            if (!indexResponse.ok) {
                console.warn('Failed to load news index');
                return;
            }

            const newsFiles = await indexResponse.json();

            for (const file of newsFiles) {
                try {
                    const response = await fetch(`content/news/${file}`);
                    if (!response.ok) continue;

                    const content = await response.text();
                    const { frontmatter, body } = this.parseFrontmatter(content);

                    // Hugo 使用 draft: true/false
                    if (frontmatter.draft !== true) {
                        // 使用文件名作为 slug（因为现在文件名就是基于 slug 的）
                        const fileSlug = file.replace('.md', '');
                        this.news.push({
                            ...frontmatter,
                            body: this.markdownToHtml(body),
                            slug: frontmatter.slug || fileSlug
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to load content/news/${file}:`, error);
                }
            }

            // 按日期排序
            this.news.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error loading news:', error);
        }
    }

    // 解析 frontmatter
    parseFrontmatter(content) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            return { frontmatter: {}, body: content };
        }

        const frontmatterText = match[1];
        const body = match[2];
        const frontmatter = {};
        const lines = frontmatterText.split('\n');
        let i = 0;

        // 简单解析 YAML frontmatter
        while (i < lines.length) {
            const line = lines[i];
            const colonIndex = line.indexOf(':');
            
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // 检查是否是多行数组格式 (tags:\n  - item1\n  - item2)
                if (value === '' && i + 1 < lines.length && lines[i + 1].trim().startsWith('-')) {
                    const arrayItems = [];
                    i++; // 移动到下一行
                    
                    // 收集所有数组项
                    while (i < lines.length && lines[i].trim().startsWith('-')) {
                        const item = lines[i].trim().substring(1).trim();
                        // 移除引号
                        const cleanItem = item.replace(/^["']|["']$/g, '');
                        arrayItems.push(cleanItem);
                        i++;
                    }
                    
                    frontmatter[key] = arrayItems;
                    continue; // 跳过i++，因为已经在循环中增加了
                }
                
                // 移除引号
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                // 处理内联数组
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(v => v.trim().replace(/["']/g, ''));
                }
                
                // 处理布尔值
                if (value === 'true') value = true;
                if (value === 'false') value = false;
                
                frontmatter[key] = value;
            }
            
            i++;
        }

        return { frontmatter, body };
    }

    // 简单的 Markdown 转 HTML
    markdownToHtml(markdown) {
        let html = markdown;
        
        // 标题
        html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
        html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // 粗体和斜体
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 图片（必须在链接之前处理，因为图片语法类似但以!开头）
        // 处理 ![alt](url) 或 ![alt](url "title") 格式
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
            // 移除 URL 中的 title 部分（引号内的内容）
            const cleanUrl = url.split('"')[0].trim();
            return `<img src="${cleanUrl}" alt="${alt}">`;
        });
        
        // 链接
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // 段落
        html = html.split('\n\n').map(para => {
            if (para.trim() && !para.startsWith('<')) {
                return `<p>${para.trim()}</p>`;
            }
            return para;
        }).join('\n');
        
        return html;
    }

    // 渲染错误信息
    renderError() {
        const titleElement = document.getElementById('article-title');
        if (titleElement) {
            titleElement.textContent = '文章未找到';
        }

        const bodyElement = document.getElementById('article-body');
        if (bodyElement) {
            bodyElement.innerHTML = '<p>抱歉，未找到该文章。</p>';
        }
    }

    // 初始化
    async init() {
        await this.loadArticle();
    }
}

// 等待 DOM 加载完成后初始化
window.addEventListener('DOMContentLoaded', async () => {
    // 等待一小段时间确保 cms-loader 已经初始化
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 如果 cms-loader 存在但还没加载完成，等待它完成
    if (window.cmsLoader && window.cmsLoader.init) {
        await window.cmsLoader.init();
    }
    
    // 初始化 Article Loader
    window.articleLoader = new ArticleLoader();
    await window.articleLoader.init();
});

