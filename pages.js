class ScriptManager {
    constructor() {
        this.cleanupFunctions = [];
        this.currentScreenSize = window.innerWidth < 1024 ? 'mobile' : 'desktop';
        // 初始化時禁用滾動（同時設置 html 和 body）
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
    }

    init() {
        this.initializeAnimations();
        this.setupResizeHandler();
        window.scrollTo(0, 0);
    }

    initializeAnimations() {
        const cleanups = [
            lenisInitialize(),
            parallaxEffect(),
            headerScrollHandler()
            // utility.js 的動畫
        ];

        cleanups.forEach(fn => {
            if (typeof fn === 'function') {
                window.animationManager.register(fn);
                this.cleanupFunctions.push(fn);
            }
        });
    }

    setupResizeHandler() {
        this.resizeHandler = () => {
            const newScreenSize = window.innerWidth < 1024 ? 'mobile' : 'desktop';
            
            // 如果屏幕尺寸發生變化（桌面 ↔ 移動），重新初始化
            if (newScreenSize !== this.currentScreenSize) {
                this.currentScreenSize = newScreenSize;
                this.cleanup();
                this.initializeAnimations();
            }
        };
        
        window.addEventListener('resize', this.resizeHandler);
    }

    cleanup() {
        this.cleanupFunctions.forEach(fn => fn());
        this.cleanupFunctions = [];
        window.animationManager.destroy();
        
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
    }
}

// 初始化 ScriptManager
document.addEventListener('DOMContentLoaded', () => {
    // 等待所有樣式和資源載入完成
    window.addEventListener('load', () => {
        // 額外等待一幀確保所有渲染完成
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scriptManager = new ScriptManager();
                window.scriptManager.init();
            });
        });
    });
});

// 頁面卸載時清理
window.addEventListener('beforeunload', () => {
    if (window.scriptManager) {
        window.scriptManager.cleanup();
    }
});



// Header 滾動隱藏/顯示功能
function headerScrollHandler() {
    const header = document.querySelector('.header-nav');
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateHeader() {
        const currentScrollY = window.scrollY;
        
        // 特殊情況：滾動到最上方時必須處理
        if (currentScrollY <= 0) {
            header.classList.remove('show');
            lastScrollY = currentScrollY;
            ticking = false;
            return;
        }
        
        // 如果滾動距離很小，不處理
        if (Math.abs(currentScrollY - lastScrollY) < 5) {
            ticking = false;
            return;
        }

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // 向下滾動且超過100px時隱藏header
            header.classList.remove('show');
        } else if (currentScrollY < lastScrollY && currentScrollY > 0) {
            // 向上滾動且不在最上方時顯示header
            header.classList.add('show');
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }

    function handleResize() {
        // 在resize時重新計算當前滾動位置
        lastScrollY = window.scrollY;
        // 觸發一次header狀態更新
        requestTick();
    }

    // 監聽滾動事件
    window.addEventListener('scroll', requestTick, { passive: true });
    // 監聽resize事件
    window.addEventListener('resize', handleResize, { passive: true });

    // 返回清理函數
    return () => {
        window.removeEventListener('scroll', requestTick);
        window.removeEventListener('resize', handleResize);
    };
}



