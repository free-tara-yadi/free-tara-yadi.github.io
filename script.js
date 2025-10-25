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
            introAnimation(),
            aboutAnimation(),
            mapAnimation(),
            headerScrollHandler()
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
            
            if (newScreenSize !== this.currentScreenSize) {
                this.currentScreenSize = newScreenSize;
                this.cleanup();
                this.initializeAnimations();
                
                if (newScreenSize === 'mobile') {
                    document.documentElement.style.overflow = 'auto';
                    document.body.style.overflow = 'auto';
                } else {
                    document.documentElement.style.overflow = 'hidden';
                    document.body.style.overflow = 'hidden';
                }
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
    window.addEventListener('load', () => {
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

// 獲取穩定的視窗高度（修復 iOS 地址欄問題）
function getStableHeight() {
    // 在移動設備上使用固定的初始高度
    if (window.innerWidth < 1024) {
        if (!window.stableHeight) {
            window.stableHeight = window.innerHeight;
        }
        return window.stableHeight;
    }
    return window.innerHeight;
}

// Intro 動畫函數
function introAnimation() {
    const isMobile = window.innerWidth < 1024;
    let stickyHeight = getStableHeight() * 5;

    let tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".intro",
            start: "top top",
            end: () => `+=${stickyHeight}px`,
            scrub: isMobile ? 1 : true, // 移動設備增加平滑度
            pin: true,
            pinSpacing: true,
            anticipatePin: 1, // 預測 pin 行為
            refreshPriority: 2,
            invalidateOnRefresh: true,
            // 移動設備專用設定
            ...(isMobile && {
                pinType: "fixed", // 使用 fixed 定位
                pinnedContainer: ".intro", // 明確指定 pin 容器
                fastScrollEnd: true, // 快速滾動時立即結束
                preventOverlaps: true // 防止重疊
            })
        }
    });

    tl.set(".kv-img-wrap", { clipPath: "inset(0% 0% 0% 0%)" });
    tl.set(".condition", { clipPath: "polygon(5% 5%, 95% 5%, 95% 95%, 5% 95%)" });
    tl.set(".intro-reveal", { opacity: 0 });

    tl.to(".fade-out", {
        xPercent: 100,
        duration: 0.3,
        stagger: { amount: 0.06, from: "end" },
        rotate: 20,
    }, 0);

    tl.to(".kv-img-wrap", {
        clipPath: () => {
            if (isMobile) {
                return "inset(15vw 15vw 15vw 15vw)";
            }
            const value = gsap.utils.mapRange(1024, 1440, 42, 38, window.innerWidth);
            return `inset(${value}vw ${value}vw ${value}vw ${value}vw)`;
        },
        ease: "none"
    }, 0);

    tl.to(".kv-img-wrap img", {
        scale: 0.8,
        ease: "none"
    }, 0);

    tl.to(".intro-reveal", {
        opacity: 1,
        ease: "power2.inOut",
        stagger: 0.2,
    }, 0.3);

    tl.fromTo(".condition", {
        clipPath: "polygon(5% 5%, 95% 5%, 95% 95%, 5% 95%)",
        y: "100vh",
    },  {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        y: "0",
        ease: "none",
        duration: 0.5
    });
    
    tl.from(".condition > *", {
        opacity: 0,
        ease: "none",
        duration: 0.5,
        delay: -0.5,
    });

    tl.from(".slide-up", {
        y: "50vh",
        ease: "none",
        stagger: 0.3,
    });

    // Resize 處理（避免在移動設備上頻繁觸發）
    let resizeTimer;
    const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const newIsMobile = window.innerWidth < 1024;
            // 只在桌面設備或屏幕方向改變時才刷新
            if (!newIsMobile || Math.abs(window.innerWidth - window.innerHeight) > 200) {
                stickyHeight = getStableHeight() * 5;
                if (tl.scrollTrigger) {
                    tl.scrollTrigger.refresh();
                }
            }
        }, 250); // 延遲執行
    };
    
    window.addEventListener('resize', handleResize);

    // 返回清理函數
    return () => {
        clearTimeout(resizeTimer);
        if (tl.scrollTrigger) {
            tl.scrollTrigger.kill();
        }
        tl.kill();
        window.removeEventListener('resize', handleResize);
    };
}

// Map 動畫函數
function mapAnimation() {
    const isMobile = window.innerWidth < 1024;
    
    let maptl = gsap.timeline({
        scrollTrigger: {
            trigger: ".location",
            start: "top top",
            end: "bottom center",
            scrub: isMobile ? 1 : true,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            refreshPriority: 1,
            invalidateOnRefresh: true,
            ...(isMobile && {
                pinType: "fixed",
                pinnedContainer: ".location",
                fastScrollEnd: true,
                preventOverlaps: true
            })
        }
    });

    maptl.set(".map-wrap", { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" });
    maptl.set(".map-reveal", { opacity: 0 });

    maptl.to(".map-wrap", {
        clipPath: isMobile 
            ? "polygon(20% 10%, 80% 10%, 80% 90%, 20% 90%)"
            : "polygon(30% 15%, 70% 15%, 70% 85%, 30% 85%)",
        ease: "none",
    });

    maptl.to(".map-wrap img", {
        scale: 1.2,
        ease: "none",
    }, 0);

    maptl.to(".map-reveal", {
        opacity: 1,
        ease: "none",
        stagger: { amount: 0.5, from: "end" },
    }, 0);

    // Resize 處理
    let resizeTimer;
    const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const newIsMobile = window.innerWidth < 1024;
            if (!newIsMobile || Math.abs(window.innerWidth - window.innerHeight) > 200) {
                if (maptl.scrollTrigger) {
                    maptl.scrollTrigger.refresh();
                }
            }
        }, 250);
    };
    
    window.addEventListener('resize', handleResize);

    // 返回清理函數
    return () => {
        clearTimeout(resizeTimer);
        if (maptl.scrollTrigger) {
            maptl.scrollTrigger.kill();
        }
        maptl.kill();
        window.removeEventListener('resize', handleResize);
    };
}

// About 動畫函數
function aboutAnimation() {
    const isMobile = window.innerWidth < 1024;
    let stickyHeight2 = getStableHeight() * 5;
    
    let tl2 = gsap.timeline({
        scrollTrigger: {
            trigger: ".about-tara",
            start: "top top",
            end: () => `+=${stickyHeight2}px`,
            scrub: isMobile ? 1 : true,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            refreshPriority: -1,
            invalidateOnRefresh: true,
            ...(isMobile && {
                pinType: "fixed",
                pinnedContainer: ".about-tara",
                fastScrollEnd: true,
                preventOverlaps: true
            })
        }
    });

    tl2.from(".about-content", {
        yPercent: 100,
        ease: "none",
        duration: 4,
    }, 0.2);

    tl2.to(".about-slide-img", {
        opacity: 1,
        ease: "none",
        stagger: 1,
    }, 0.2);

    // Resize 處理
    let resizeTimer;
    const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const newIsMobile = window.innerWidth < 1024;
            if (!newIsMobile || Math.abs(window.innerWidth - window.innerHeight) > 200) {
                stickyHeight2 = getStableHeight() * 5;
                if (tl2.scrollTrigger) {
                    tl2.scrollTrigger.refresh();
                }
            }
        }, 250);
    };
    
    window.addEventListener('resize', handleResize);

    // 返回清理函數
    return () => {
        clearTimeout(resizeTimer);
        if (tl2.scrollTrigger) {
            tl2.scrollTrigger.kill();
        }
        tl2.kill();
        window.removeEventListener('resize', handleResize);
    };
}

// Header 滾動隱藏/顯示功能
function headerScrollHandler() {
    if (window.innerWidth < 1024) {
        return () => {};
    }
    
    const header = document.querySelector('.header-nav');
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateHeader() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY <= 0) {
            header.classList.remove('show');
            lastScrollY = currentScrollY;
            ticking = false;
            return;
        }
        
        if (Math.abs(currentScrollY - lastScrollY) < 5) {
            ticking = false;
            return;
        }

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.classList.remove('show');
        } else if (currentScrollY < lastScrollY && currentScrollY > 0) {
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
        lastScrollY = window.scrollY;
        requestTick();
    }

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
        window.removeEventListener('scroll', requestTick);
        window.removeEventListener('resize', handleResize);
    };
}