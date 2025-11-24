class ScriptManager {
    constructor() {
        this.cleanupFunctions = [];
    }

    init() {
        this.initializeAnimations();
        this.setupResizeHandler();
        window.scrollTo(0, 0);
    }

    initializeAnimations() {
        const cleanups = [
            preloader(),
            lenisInitialize(),
            parallaxEffect(),
            introAnimation(),
            aboutAnimation(),
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
        let resizeTimer = null;
        
        resizeTimer = setTimeout(() => {
            this.cleanup();
            this.initializeAnimations();

        }, 100);
        
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
    const initializeScriptManager = () => {
        // 检查 window.load 是否已经完成
        if (document.readyState === 'complete') {
            // 页面已经加载完成，直接执行
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    window.scriptManager = new ScriptManager();
                    window.scriptManager.init();
                });
            });
        } else {
            // 等待所有樣式和資源載入完成
            window.addEventListener('load', () => {
                // 額外等待一幀確保所有渲染完成
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        window.scriptManager = new ScriptManager();
                        window.scriptManager.init();
                    });
                });
            }, { once: true });
        }
    };
    
    // 直接执行初始化，不再等待 cms-loader
    initializeScriptManager();
});

// 頁面卸載時清理
window.addEventListener('beforeunload', () => {
    if (window.scriptManager) {
        window.scriptManager.cleanup();
    }
});



function preloader() {

    const ctx = gsap.context(() => {
        const tl = gsap.timeline();
        tl.to("body", {
            autoAlpha: 1,
            ease: "power2.out",
        });

        tl.to("main", {
            opacity: 1,
            ease: "power2.out",
        });

    });
    return () => ctx.revert();

}

// Intro 動畫函數
function introAnimation() {
    // 創建 GSAP Context
    const ctx = gsap.context(() => {

        const mm = gsap.matchMedia();
        
        mm.add("(min-width: 769px)", () => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".js-intro",
                    start: "top top",
                    end: "bottom center",
                    scrub: true,
                    refreshPriority: 2,
                    invalidateOnRefresh: true
                }
            });
    
            tl.set(".kv-img-wrap", { width: "100vw" });
            tl.set(".fade-out", { filter: "brightness(1)" });
            tl.set(".intro-reveal", { opacity: 0 });
            tl.set(".map-img", { filter: "brightness(0.3)" });
            tl.to(".fade-out", {
                opacity: 0,
                duration: 0.3,
                filter: "brightness(0.3)",
                ease: "power3.out",
            }, 0);

            tl.to(".lines-wrap div", {
                yPercent: 100,
                duration: 0.3,
                ease: "power3.out",
            }, 0);

            tl.to(".intro-reveal", {
                opacity: 1,
                ease: "power2.inOut",
                duration: 0.2
            }, 0);
    

            tl.to(".kv-img-wrap", {
                width: "50vw",
                ease: "none",
                duration: 0.2
            },0);

            tl.to(".main-img", {
                scale: 1.6,
                ease: "none",
                duration: 0.2
            },0);


            tl.to(".map-img", {
                opacity: 1,
                ease: "power2.inOut",
                duration: 0.2
            },0.5);

            tl.to(".map-img", {
                scale: 1.6,
                ease: "none",
                duration: 0.2,
                filter: "brightness(0.5)"
            });
            
    
    

    

        });

        mm.add("(max-width: 768px)", () => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".js-intro",
                    start: "top top",
                    end: "bottom center",
                    scrub: true,
                    refreshPriority: 2,
                    invalidateOnRefresh: true
                }
            });
    
            tl.set(".kv-img-wrap", { width: "100vw" });

            tl.to(".intro-reveal", {
                opacity: 1,
                ease: "power2.inOut",
                duration: 0.2
            },0);




            tl.to(".map-img", {
                opacity: 1,
                ease: "power2.inOut",
                duration: 0.2
            },0.5);



        });

        
    });

    // 返回清理函數
    return () => ctx.revert();
}



// About 動畫函數
function aboutAnimation() {
    // 創建 GSAP Context
    const ctx = gsap.context(() => {
        const tl2 = gsap.timeline({
            scrollTrigger: {
                trigger: ".js-about",
                start: "top top",
                end: "bottom bottom",
                scrub: true,
                invalidateOnRefresh: true
            }
        });

        tl2.to(".about-slide-img", {
            opacity: 1,
            ease: "none",
            stagger: 1,
        }, 0.2);
    });

    // 返回清理函數
    return () => ctx.revert();
}


 

// Header 滾動隱藏/顯示功能
function headerScrollHandler() {
    // 檢查屏幕寬度，小於 1024px 時禁用 header 滾動處理
    if (window.innerWidth < 768) {
        // 在移動設備上，返回空的清理函數
        return () => {};
    }
    
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

