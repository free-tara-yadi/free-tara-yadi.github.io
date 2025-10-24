// CMS 内容加载器
class CMSLoader {
    constructor() {
        this.news = [];
        this.messages = [];
        this.about = [];
        this.faq = [];
        this.home = null;
    }


    
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
                
                // 检查是否是多行文本值（以 |- 或 | 开头）
                if (value === '|-' || value === '|') {
                    const textLines = [];
                    i++; // 移动到下一行
                    
                    // 收集所有文本行，直到遇到下一个键或结束
                    while (i < lines.length) {
                        const nextLine = lines[i];
                        // 如果下一行是新的键值对，停止收集
                        if (nextLine.includes(':') && !nextLine.startsWith(' ')) {
                            break;
                        }
                        textLines.push(nextLine);
                        i++;
                    }
                    
                    frontmatter[key] = textLines.join('\n').trim();
                    continue; // 跳过i++，因为已经在循环中增加了
                }
                
                // 如果value为空且下一行不是键值对，可能是多行文本
                if (value === '' && i + 1 < lines.length && !lines[i + 1].includes(':')) {
                    const textLines = [];
                    i++; // 移动到下一行
                    
                    // 收集所有文本行，直到遇到下一个键或结束
                    while (i < lines.length) {
                        const nextLine = lines[i];
                        // 如果下一行是新的键值对，停止收集
                        if (nextLine.includes(':') && !nextLine.startsWith(' ')) {
                            break;
                        }
                        textLines.push(nextLine);
                        i++;
                    }
                    
                    frontmatter[key] = textLines.join('\n').trim();
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
                
                // 处理数字
                if (!isNaN(value) && value !== '') {
                    value = Number(value);
                }
                
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

    // 加载新闻
    async loadNews() {
        try {
            // 加载新闻文件列表
            const indexResponse = await fetch('./content/news/news.json');
            if (!indexResponse.ok) {
                console.warn('Failed to load news index');
                return [];
            }
            
            const newsFiles = await indexResponse.json();
            
            for (const file of newsFiles) {
                try {
                    const response = await fetch(`./content/news/${file}`);
                    if (!response.ok) continue;
                    
                    const content = await response.text();
                    const { frontmatter, body } = this.parseFrontmatter(content);
                    
                    if (frontmatter.published !== false) {
                        this.news.push({
                            ...frontmatter,
                            body: this.markdownToHtml(body)
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to load content/news/${file}:`, error);
                }
            }

            // 按日期排序
            this.news.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            return this.news;
        } catch (error) {
            console.error('Error loading news:', error);
            return [];
        }
    }

    // 加载留言
    async loadMessages() {
        try {
            // 加载消息文件列表
            const indexResponse = await fetch('./content/messages/messages.json');
            if (!indexResponse.ok) {
                console.warn('Failed to load messages index');
                return [];
            }
            
            const messageFiles = await indexResponse.json();
            
            for (const file of messageFiles) {
                try {
                    const response = await fetch(`./content/messages/${file}`);
                    if (!response.ok) continue;
                    
                    const content = await response.text();
                    const { frontmatter, body } = this.parseFrontmatter(content);
                    
                    if (frontmatter.published !== false) {
                        this.messages.push({
                            ...frontmatter,
                            content: body.trim()
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to load content/messages/${file}:`, error);
                }
            }

            // 按日期排序
            this.messages.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            return this.messages;
        } catch (error) {
            console.error('Error loading messages:', error);
            return [];
        }
    }

    // 加载关于页面内容
    async loadAbout() {
        try {
            // 从home.yaml文件中加载about数据
            const response = await fetch('./content/home.yaml');
            if (!response.ok) {
                console.warn('Failed to load home.yaml');
                return [];
            }
            
            const yamlContent = await response.text();
            
            // 清空现有的about数据
            this.about = [];
            
            // 按行解析
            const lines = yamlContent.split('\n');
            let currentItem = null;
            let inMultilineContent = false;
            let multilineContent = '';
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmedLine = line.trim();
                
                // 检测新的about项目开始
                if (trimmedLine.startsWith('- about_title:')) {
                    // 保存前一个项目
                    if (currentItem) {
                        this.about.push(currentItem);
                    }
                    
                    // 开始新项目
                    const title = trimmedLine.replace('- about_title:', '').trim();
                    currentItem = {
                        title: title,
                        content: ''
                    };
                    inMultilineContent = false;
                    multilineContent = '';
                }
                // 检测about_content
                else if (trimmedLine.startsWith('about_content:') && currentItem) {
                    const content = trimmedLine.replace('about_content:', '').trim();
                    
                    // 检查是否是多行内容
                    if (content === '|-') {
                        inMultilineContent = true;
                        multilineContent = '';
                    } else {
                        currentItem.content = content;
                    }
                }
                // 处理多行内容
                else if (inMultilineContent && line.startsWith('      ') && currentItem) {
                    multilineContent += line.substring(6) + '\n';
                }
                // 多行内容结束
                else if (inMultilineContent && !line.startsWith('      ') && !line.startsWith('  ') && trimmedLine !== '') {
                    currentItem.content = multilineContent.trim();
                    inMultilineContent = false;
                }
            }
            
            // 保存最后一个项目
            if (currentItem) {
                if (inMultilineContent) {
                    currentItem.content = multilineContent.trim();
                }
                this.about.push(currentItem);
            }
            
            // 将内容转换为HTML
            this.about.forEach(item => {
                item.content = this.markdownToHtml(item.content);
            });
            
            return this.about;
        } catch (error) {
            console.error('Error loading about:', error);
            return [];
        }
    }

    // 加载FAQ
    async loadFAQ() {
        try {
            // 加载FAQ文件列表
            const indexResponse = await fetch('./content/faq/faq.json');
            if (!indexResponse.ok) {
                console.warn('Failed to load FAQ index');
                return [];
            }
            
            const faqFiles = await indexResponse.json();
            
            for (const file of faqFiles) {
                try {
                    const response = await fetch(`./content/faq/${file}`);
                    if (!response.ok) continue;
                    
                    const content = await response.text();
                    const { frontmatter, body } = this.parseFrontmatter(content);
                    
                    if (frontmatter.published !== false) {
                        this.faq.push({
                            ...frontmatter,
                            answer: frontmatter.answer || body.trim()
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to load content/faq/${file}:`, error);
                }
            }

            // 按order字段排序
            this.faq.sort((a, b) => (a.order || 0) - (b.order || 0));
            
            return this.faq;
        } catch (error) {
            console.error('Error loading FAQ:', error);
            return [];
        }
    }

    // 加载首页配置
    async loadHome() {
        try {
            const response = await fetch('./content/home.yaml');
            if (!response.ok) {
                console.warn('Failed to load home config');
                return null;
            }
            
            const content = await response.text();
            
            // 尝试解析frontmatter格式
            let frontmatter = {};
            const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
            const match = content.match(frontmatterRegex);
            
            if (match) {
                // 有frontmatter分隔符，使用parseFrontmatter
                const result = this.parseFrontmatter(content);
                frontmatter = result.frontmatter;
            } else {
                // 没有frontmatter分隔符，直接解析YAML内容
                const lines = content.split('\n');
                lines.forEach(line => {
                    const colonIndex = line.indexOf(':');
                    if (colonIndex > 0) {
                        const key = line.substring(0, colonIndex).trim();
                        let value = line.substring(colonIndex + 1).trim();
                        
                        // 移除引号
                        if ((value.startsWith('"') && value.endsWith('"')) || 
                            (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.slice(1, -1);
                        }
                        
                        // 处理布尔值
                        if (value === 'true') value = true;
                        if (value === 'false') value = false;
                        
                        // 处理数字
                        if (!isNaN(value) && value !== '') {
                            value = Number(value);
                        }
                        
                        frontmatter[key] = value;
                    }
                });
            }
            
            this.home = frontmatter;
            return frontmatter;
        } catch (error) {
            console.error('Error loading home config:', error);
            return null;
        }
    }

    // 渲染新闻
    renderNews(container, category = '') {
        if (!container) return;
        
        // 根据分类筛选新闻
        let filteredNews = this.news;
        if (category) {
            filteredNews = this.news.filter(item => item.category === category);
        }
        
        const newsToShow = filteredNews.slice(0, 4); // 显示前4条
        
        if (newsToShow.length === 0) {
            container.innerHTML = '<p>暂无新闻</p>';
            return;
        }

        container.innerHTML = newsToShow.map(item => {
            const slug = item.slug || item.title.toLowerCase().replace(/\s+/g, '-');
            return `
            <a class="news-card" href="article.html?slug=${slug}">
                <div class="news-img">
                ${item.image ? `<img src="${item.image}" alt="${item.title}">` : ''}
                </div>
                <h3>${item.title}</h3>
                <span class="news-date">${item.date}</span>
                <p>${item.excerpt}</p>
            </a>
        `;
        }).join('');
    }

    // 渲染留言
    renderMessages(container) {
        if (!container) return;
        
        const messagesToShow = this.messages.slice(0, 3); // 只显示前3条
        
        if (messagesToShow.length === 0) {
            container.innerHTML = '<p>暂无留言</p>';
            return;
        }

        container.innerHTML = messagesToShow.map(item => {
            // 处理换行，将多个换行转换为 <br>
            const formattedContent = item.content
                .split('\n')
                .filter(line => line.trim()) // 移除空行
                .map(line => `<span>${line.trim()}</span>`)
                .join('<br>');
            
            return `
                <div class="message-card">
                    <p>${formattedContent}</p>
                </div>
            `;
        }).join('');
    }

    // 渲染关于页面内容
    renderAbout(container) {
        if (!container) return;
        
        if (this.about.length === 0) {
            container.innerHTML = '<p>暂无关于内容</p>';
            return;
        }

        container.innerHTML = this.about.map(item => {
            return `
                <div class="slide-wrap">
                    <h3>${item.title}</h3>
                    <p>${item.content}</p>
                </div>
            `;
        }).join('');
    }

    // 渲染FAQ
    renderFAQ(container) {
        if (!container) return;
        
        if (this.faq.length === 0) {
            container.innerHTML = '<p>暂无FAQ内容</p>';
            return;
        }

        container.innerHTML = this.faq.map((item, index) => {
            const questionId = `q${item.order || (index + 1)}`;
            const isFirst = index === 0;
            
            return `
                <div class="tab">
                    <input type="checkbox" name="accordion-1" id="${questionId}" ${isFirst ? 'checked' : ''}>
                    <label for="${questionId}" class="tab__label">${item.title}</label>
                    <div class="tab__content">
                        <p>${item.answer}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染最新新闻到首页
    renderLatestNews() {
        const latestNewsElement = document.getElementById('latest-news-text');
        const latestNewsLink = document.getElementById('latest-news-link');
        
        if (this.news.length === 0) return;
        
        // 如果有指定slug，尝试找到匹配的文章
        let selectedNews = null;
        if (this.home && this.home.latest_news_slug) {
            selectedNews = this.news.find(item => item.slug == this.home.latest_news_slug);
        }
        
        // 如果没有找到指定文章或未指定，使用最新的文章
        if (!selectedNews) {
            selectedNews = this.news[0];
        }
        
        if (latestNewsElement) {
            latestNewsElement.textContent = selectedNews.excerpt;
        }
        if (latestNewsLink) {
            const slug = selectedNews.slug || selectedNews.title.toLowerCase().replace(/\s+/g, '-');
            latestNewsLink.href = `article.html?slug=${slug}`;
        }
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

    // 初始化新闻标签切换
    initNewsTabs() {
        const tabLinks = document.querySelectorAll('.news-tab .tab-link');
        const newsContainer = document.getElementById('news-container');
        
        if (!tabLinks.length || !newsContainer) return;
        
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 移除所有active类
                tabLinks.forEach(tab => tab.classList.remove('active'));
                
                // 添加active类到当前点击的标签
                link.classList.add('active');
                
                // 获取分类
                const category = link.getAttribute('data-category') || '';
                
                // 重新渲染新闻
                this.renderNews(newsContainer, category);
            });
        });
    }

    // 初始化
    async init() {
        await Promise.all([
            this.loadNews(),
            this.loadMessages(),
            this.loadAbout(),
            this.loadFAQ(),
            this.loadHome()
        ]);

        // 渲染内容
        this.renderNews(document.getElementById('news-container'));
        this.renderMessages(document.getElementById('messages-container'));
        this.renderAbout(document.getElementById('about-container'));
        this.renderFAQ(document.getElementById('faq-container'));
        this.renderLatestNews();
        
        // 初始化新闻标签切换
        this.initNewsTabs();
    }
}

// 全局初始化
window.addEventListener('DOMContentLoaded', () => {
    window.cmsLoader = new CMSLoader();
    window.cmsLoader.init();
});
