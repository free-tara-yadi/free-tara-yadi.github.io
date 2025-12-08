// 文章頁面加載器
class ArticleLoader {
    constructor() {
        this.news = [];
        this.currentArticle = null;
        this.markedLoaded = false;
    }

    // 加載 marked.js CDN
    async loadMarked() {
        if (this.markedLoaded || window.marked) {
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
            script.onload = () => {
                this.markedLoaded = true;
                // 配置 marked 選項
                if (window.marked) {
                    marked.setOptions({
                        breaks: true, // 改為 false，保持標準 Markdown 換行處理
                        gfm: true,
                        pedantic: false
                    });
                }
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 從 URL 獲取 slug
    getSlugFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('slug');
    }

    // 從 URL 獲取 ID
    getIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // 根據 slug 或 ID 查找文章
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

    // 獲取分類標籤
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

    // 獲取標籤中文名
    getTagLabel(tag) {
        const labels = {
            'government-officials': '政府人员发言',
            'NGO': 'NGO',
            'student-organizations': '学生组织',
            'overseas-Chinese-community': '海外华语社群',
            'legal': '法律',
            'popular-science': '科普',
            'UK': '英国',
            'USA': '美国',
            'France': '法国',
            'Netherlands': '荷兰',
            'Germany': '德国',
            'Italy': '意大利',
            'Australia': '澳大利亚',
            'Taiwan': '台湾',
            'Hong Kong': '香港',
            'independent-journalists': '独立记者',
            'overseas-Chinese-media': '海外华语媒体',
            'overseas-Tibetan-media': '海外藏人媒体',
            'Asian-media': '亚洲媒体'
        };
        return labels[tag] || tag;
    }

    // 渲染文章標題
    renderTitle(title) {
        const titleElement = document.getElementById('article-title');
        if (titleElement) {
            titleElement.textContent = title;
        }

        // 更新麵包屑
        const breadcrumb = document.querySelector('.breadcrumb-current');
        if (breadcrumb) {
            breadcrumb.textContent = title;
        }

        // 更新頁面標題
        document.title = `${title} | Free Tara Yadi`;
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

    // 渲染文章圖片
    renderImage(image) {
        const imageElement = document.getElementById('article-image');
        if (imageElement && image) {
            imageElement.innerHTML = `<img src="${image}" alt="文章配圖">`;
        }
    }

    // 渲染文章內容 - 使用 marked.js
    renderBody(body) {
        const bodyElement = document.getElementById('article-body');
        if (bodyElement && window.marked) {
            try {
                const html = marked.parse(body);
                bodyElement.innerHTML = html;
            } catch (error) {
                console.error('Error rendering markdown:', error);
                bodyElement.innerHTML = `<p>${body}</p>`;
            }
        }
    }

    // 渲染文章標籤
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

    // 渲染文章導航(上一篇/下一篇)
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

    // 渲染相關文章
    renderRelatedArticles(currentArticle) {
        const relatedElement = document.getElementById('related-articles');
        if (!relatedElement) return;

        // 獲取除當前文章外的其他文章,最多3篇
        const relatedArticles = this.news
            .filter(article => article.title !== currentArticle.title)
            .slice(0, 3);

        if (relatedArticles.length === 0) {
            relatedElement.innerHTML = '<p>暫無相關文章</p>';
            return;
        }

        relatedElement.innerHTML = relatedArticles.map(article => {
            const slug = article.slug || article.title.toLowerCase().replace(/\s+/g, '-');
            return `
                <article class="news-card">
                    <a href="article.html?slug=${slug}" class="news-img">
                        <img src="${article.image || './assets/rock.png'}" alt="相關文章">
                    </a>
                    <h3>${article.title}</h3>
                    <p class="news-date">${article.date}</p>
                </article>
            `;
        }).join('');
    }

    // 渲染分享按鈕
    renderShareButtons(article) {
        // 獲取當前頁面的完整URL
        const currentUrl = window.location.href;
        const encodedUrl = encodeURIComponent(currentUrl);
        const encodedTitle = encodeURIComponent(article.title);

        // Facebook分享鏈接
        const facebookShareElement = document.getElementById('share-facebook');
        if (facebookShareElement) {
            facebookShareElement.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            facebookShareElement.target = '_blank';
            facebookShareElement.rel = 'noopener noreferrer';
        }

        // X (Twitter) 分享鏈接
        const xShareElement = document.getElementById('share-x');
        if (xShareElement) {
            xShareElement.href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
            xShareElement.target = '_blank';
            xShareElement.rel = 'noopener noreferrer';
        }
    }

    // 加載並渲染文章
    async loadArticle() {
        // 先加載 marked.js
        await this.loadMarked();

        // 等待 CMS Loader 初始化完成
        if (!window.cmsLoader || !window.cmsLoader.news || window.cmsLoader.news.length === 0) {
            // 如果 CMS Loader 還沒初始化,手動加載新聞
            await this.loadNews();
        } else {
            this.news = window.cmsLoader.news;
        }

        // 查找當前文章
        this.currentArticle = this.findArticle();

        if (!this.currentArticle) {
            this.renderError();
            return;
        }

        // 獲取當前文章的索引
        const currentIndex = this.news.indexOf(this.currentArticle);

        // 渲染文章內容
        this.renderTitle(this.currentArticle.title);
        this.renderMeta(this.currentArticle);
        this.renderImage(this.currentArticle.image);
        this.renderBody(this.currentArticle.body);
        this.renderTags(this.currentArticle.tags);
        this.renderNavigation(currentIndex);
        this.renderRelatedArticles(this.currentArticle);
        this.renderShareButtons(this.currentArticle);
    }

    // 加載新聞
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

                    if (frontmatter.published !== false) {
                        // 使用文件名作為 slug(因為現在文件名就是基於 slug 的)
                        const fileSlug = file.replace('.md', '');
                        this.news.push({
                            ...frontmatter,
                            body: body, // 保持原始 markdown 格式
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

        // 簡單解析 YAML frontmatter
        while (i < lines.length) {
            const line = lines[i];
            const colonIndex = line.indexOf(':');
            
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // 檢查是否是多行數組格式 (tags:\n  - item1\n  - item2)
                if (value === '' && i + 1 < lines.length && lines[i + 1].trim().startsWith('-')) {
                    const arrayItems = [];
                    i++; // 移動到下一行
                    
                    // 收集所有數組項
                    while (i < lines.length && lines[i].trim().startsWith('-')) {
                        const item = lines[i].trim().substring(1).trim();
                        // 移除引號
                        const cleanItem = item.replace(/^["']|["']$/g, '');
                        arrayItems.push(cleanItem);
                        i++;
                    }
                    
                    frontmatter[key] = arrayItems;
                    continue; // 跳過i++,因為已經在循環中增加了
                }
                
                // 移除引號
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                // 處理內聯數組
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(v => v.trim().replace(/["']/g, ''));
                }
                
                // 處理布爾值
                if (value === 'true') value = true;
                if (value === 'false') value = false;
                
                frontmatter[key] = value;
            }
            
            i++;
        }

        return { frontmatter, body };
    }

    // 渲染錯誤信息
    renderError() {
        const titleElement = document.getElementById('article-title');
        if (titleElement) {
            titleElement.textContent = '文章未找到';
        }

        const bodyElement = document.getElementById('article-body');
        if (bodyElement) {
            bodyElement.innerHTML = '<p>抱歉,未找到該文章。</p>';
        }
    }

    // 初始化
    async init() {
        await this.loadArticle();
    }
}

// 等待 DOM 加載完成後初始化
window.addEventListener('DOMContentLoaded', async () => {
    // 等待一小段時間確保 cms-loader 已經初始化
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 如果 cms-loader 存在但還沒加載完成,等待它完成
    if (window.cmsLoader && window.cmsLoader.init) {
        await window.cmsLoader.init();
    }
    
    // 初始化 Article Loader
    window.articleLoader = new ArticleLoader();
    await window.articleLoader.init();
});



