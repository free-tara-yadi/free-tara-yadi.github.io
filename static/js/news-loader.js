// 新闻列表加载器
class NewsLoader {
    constructor() {
        this.news = [];
        this.filteredNews = [];
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.filters = {
            category: '',
            tag: '',
            date: ''
        };
    }

    // 加载新闻数据
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
            this.filteredNews = [...this.news];
            
            this.renderNewsList();
            this.updatePagination();
        } catch (error) {
            console.error('Error loading news:', error);
        }
    }

    // 生成文章slug
    generateSlug(title) {
        return title.toLowerCase().replace(/\s+/g, '-');
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
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // 粗体和斜体
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 图片（必须在链接之前处理，因为图片语法类似但以!开头）
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
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

    // 获取分类标签
    getCategoryLabel(category) {
        const labels = {
            'latest': '最新消息',
            'media': '媒体报导',
            'action': '行动倡议',
            'update': '案件进展'
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

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 应用筛选
    applyFilters() {
        this.filteredNews = this.news.filter(article => {
            // 分类筛选
            if (this.filters.category && article.category !== this.filters.category) {
                return false;
            }

            // 标签筛选
            if (this.filters.tag && (!article.tags || !article.tags.includes(this.filters.tag))) {
                return false;
            }

            // 日期筛选
            if (this.filters.date) {
                const articleDate = new Date(article.date);
                const now = new Date();
                let cutoffDate;

                switch (this.filters.date) {
                    case 'week':
                        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'month':
                        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    case 'quarter':
                        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                        break;
                    case 'year':
                        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                        break;
                }

                if (cutoffDate && articleDate < cutoffDate) {
                    return false;
                }
            }

            return true;
        });

        this.currentPage = 1;
        this.renderNewsList();
        this.updatePagination();
    }

    // 渲染新闻列表
    renderNewsList() {
        const newsListing = document.querySelector('.news-listing');
        if (!newsListing) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const articlesToShow = this.filteredNews.slice(startIndex, endIndex);

        if (articlesToShow.length === 0) {
            newsListing.innerHTML = '<div class="no-articles">暂无文章</div>';
            return;
        }

        newsListing.innerHTML = articlesToShow.map(article => {
            const excerpt = article.excerpt || this.getExcerptFromBody(article.body);
            
            return `
                <div class="news-card">
                    <a href="article.html?slug=${article.slug}" class="news-img">
                        <img src="${article.image || './assets/rock.png'}" alt="${article.title}">
                    </a>
                    <div class="news-item-meta">
                            <span class="news-category">
                                <button class="filter-link" data-category="${article.category}">${this.getCategoryLabel(article.category)}</button>
                            </span>
                            <span class="news-date">${article.date}</span>
                    </div>
                    <h3>${article.title}</h3>
                    <p class="news-item-excerpt">${excerpt}</p>
                    <div class="news-item-tags">
                            ${article.tags ? article.tags.map(tag => `
                                <span class="tag">
                                    <button class="filter-link" data-tag="${tag}">${this.getTagLabel(tag)}</button>
                                </span>

                            `).join('') : ''}
                    </div>
                </div>
            `;
        }).join('');

        // 为分类和标签按钮添加事件监听
        const filterLinks = newsListing.querySelectorAll('.filter-link');
        filterLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.getAttribute('data-category');
                const tag = link.getAttribute('data-tag');
                
                if (category !== null) {
                    // 设置分类过滤
                    this.filters.category = category;
                    this.setActiveTab(category);
                    
                    // 更新 URL
                    const url = new URL(window.location);
                    if (category) {
                        url.searchParams.set('cat', category);
                    } else {
                        url.searchParams.delete('cat');
                    }
                    window.history.pushState({}, '', url);
                } else if (tag !== null) {
                    // 设置标签过滤
                    this.filters.tag = tag;
                    const tagFilter = document.getElementById('tag-filter');
                    if (tagFilter) {
                        tagFilter.value = tag;
                    }
                    
                    // 更新 URL
                    const url = new URL(window.location);
                    url.searchParams.set('tag', tag);
                    window.history.pushState({}, '', url);
                }
                
                this.applyFilters();
            });
        });
    }

    // 从正文中提取摘要
    getExcerptFromBody(body) {
        // 移除HTML标签
        const textContent = body.replace(/<[^>]*>/g, '');
        // 取前150个字符
        return textContent.length > 150 ? textContent.substring(0, 150) + '...' : textContent;
    }

    // 更新分页
    updatePagination() {
        const totalPages = Math.ceil(this.filteredNews.length / this.itemsPerPage);
        const pagination = document.querySelector('.pagination');
        
        if (!pagination) return;

        const currentSpan = pagination.querySelector('.pagination-current');
        const prevLink = pagination.querySelector('.pagination-link.prev');
        const nextLink = pagination.querySelector('.pagination-link.next');

        if (currentSpan) {
            currentSpan.textContent = `${this.currentPage} / ${totalPages}`;
        }

        // 更新上一页链接
        if (prevLink) {
            if (this.currentPage > 1) {
                prevLink.style.display = 'inline';
                prevLink.onclick = (e) => {
                    e.preventDefault();
                    this.currentPage--;
                    this.renderNewsList();
                    this.updatePagination();
                };
            } else {
                prevLink.style.display = 'none';
            }
        }

        // 更新下一页链接
        if (nextLink) {
            if (this.currentPage < totalPages) {
                nextLink.style.display = 'inline';
                nextLink.onclick = (e) => {
                    e.preventDefault();
                    this.currentPage++;
                    this.renderNewsList();
                    this.updatePagination();
                };
            } else {
                nextLink.style.display = 'none';
            }
        }
    }

    // 初始化筛选器事件
    initFilters() {
        // 初始化 category tabs
        const tabLinks = document.querySelectorAll('.news-tabs .tab-link');
        tabLinks.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const category = tab.getAttribute('data-category') || '';
                this.filters.category = category;
                this.setActiveTab(category);
                this.applyFilters();
                
                // 更新 URL 但不跳转页面
                const url = new URL(window.location);
                if (category) {
                    url.searchParams.set('cat', category);
                } else {
                    url.searchParams.delete('cat');
                }
                window.history.pushState({}, '', url);
            });
        });

        const categoryFilter = document.getElementById('category-filter');
        const tagFilter = document.getElementById('tag-filter');
        const dateFilter = document.getElementById('date-filter');

        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.setActiveTab(e.target.value || '');
                this.applyFilters();
            });
        }

        if (tagFilter) {
            tagFilter.addEventListener('change', (e) => {
                this.filters.tag = e.target.value;
                this.applyFilters();
                
                // 更新 URL
                const url = new URL(window.location);
                if (e.target.value) {
                    url.searchParams.set('tag', e.target.value);
                } else {
                    url.searchParams.delete('tag');
                }
                window.history.pushState({}, '', url);
            });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.filters.date = e.target.value;
                this.applyFilters();
                
                // 更新 URL
                const url = new URL(window.location);
                if (e.target.value) {
                    url.searchParams.set('date', e.target.value);
                } else {
                    url.searchParams.delete('date');
                }
                window.history.pushState({}, '', url);
            });
        }
    }

    // 从 URL 读取参数并设置筛选器
    initFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const tag = urlParams.get('tag');
        const cat = urlParams.get('cat');
        const date = urlParams.get('date');

        if (tag) {
            this.filters.tag = tag;
            const tagFilter = document.getElementById('tag-filter');
            if (tagFilter) {
                tagFilter.value = tag;
            }
        }

        if (cat) {
            this.filters.category = cat;
            const categoryFilter = document.getElementById('category-filter');
            if (categoryFilter) {
                categoryFilter.value = cat;
            }
        }

        if (date) {
            this.filters.date = date;
            const dateFilter = document.getElementById('date-filter');
            if (dateFilter) {
                dateFilter.value = date;
            }
        }

        // 设置active tab
        this.setActiveTab(cat);

        // 如果有 URL 参数，应用筛选器
        if (tag || cat || date) {
            this.applyFilters();
        }
    }

    // 设置active tab
    setActiveTab(category) {
        const tabLinks = document.querySelectorAll('.news-tabs .tab-link');
        
        // 移除所有active类
        tabLinks.forEach(link => {
            link.classList.remove('active');
        });

        // 根据category参数设置对应的tab为active
        const activeTab = document.querySelector(`.news-tabs .tab-link[data-category="${category || ''}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    // 初始化
    async init() {
        await this.loadNews();
        this.initFromUrl();
        this.initFilters();
    }
}

// 等待 DOM 加载完成后初始化
window.addEventListener('DOMContentLoaded', async () => {
    window.newsLoader = new NewsLoader();
    await window.newsLoader.init();
});
