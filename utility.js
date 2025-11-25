
class AnimationManager {
    constructor() {
        this.animations = [];
        this.resizeHandler = null;
        this.updateTimeout = null;
    }

    register(cleanupFunction) {
        if (typeof cleanupFunction === 'function') {
            this.animations.push(cleanupFunction);
        }
        return this;
    }

    setResizeHandler(handler) {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        this.resizeHandler = handler;
        window.addEventListener('resize', this.resizeHandler);
        return this;
    }

    setTimeout(callback, delay) {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(callback, delay);
        return this;
    }

    initializeBase() {
        ScrollTrigger.getAll().forEach(st => st.kill());
        return this;
    }

    destroy() {
        ScrollTrigger.getAll().forEach(st => st.kill());

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = null;
        }

        this.animations.forEach(cleanup => {
            if (typeof cleanup === 'function') {
                cleanup();
            }
        });
        this.animations = [];
    }
}

window.animationManager = new AnimationManager();


function lenisInitialize() {
    gsap.registerPlugin(ScrollTrigger);
    
    // Create Lenis instance with scrollTop reset
    const lenis = new Lenis({
        // Add any existing options you have
        // Then add this to ensure it doesn't override your scrollTo command
        smoothWheel: true,
        wheelMultiplier: 1.2,
        infinite: false,
        anchors: true
    });


    window.lenisInstance = lenis;

    const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
    const anchorCleanup = [];

    anchorLinks.forEach((link) => {
        const handler = (event) => {
            const href = link.getAttribute("href");
            if (!href || href === "#" || href === "#0") {
                return;
            }

            // ignore external hashes
            if (!href.startsWith("#")) {
                return;
            }

            const target = document.querySelector(href);
            if (!target) {
                return;
            }

            event.preventDefault();

            const durationAttr = parseFloat(link.getAttribute("data-scroll-duration"));
            const offsetAttr = parseFloat(link.getAttribute("data-scroll-offset"));

            lenis.scrollTo(target, {
                duration: isNaN(durationAttr) ? 1.5 : durationAttr,
                offset: isNaN(offsetAttr) ? 0 : offsetAttr,
                // ease out cubic
                easing: (t) => 1 - Math.pow(1 - t, 3)
            });
        };

        link.addEventListener("click", handler);
        anchorCleanup.push(() => link.removeEventListener("click", handler));
    });

    // Force scroll to top immediately
    lenis.scrollTo(0, { immediate: true });

    // Add this to handle page refresh/reload
    window.history.scrollRestoration = "manual";
    
    lenis.on("scroll", ScrollTrigger.update);

    const tickerCallback = (time) => {
        lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Force browser scroll to top as well
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 返回清理函數
    return () => {
        if (lenis) {
            lenis.destroy();
            gsap.ticker.remove(tickerCallback);
        }

        anchorCleanup.forEach((cleanup) => cleanup());
        window.lenisInstance = undefined;
    };
}





function parallaxEffect() {
    const ctx = gsap.context(() => {
        gsap.utils.toArray("[parallax-y]").forEach((section, i) => {
            const heightDiff = section.offsetHeight - section.parentElement.offsetHeight;

            gsap.fromTo(section, {
                y: -heightDiff
            }, {
                scrollTrigger: {
                    trigger: section,
                    scrub: true
                },
                y: 0,
                ease: "none"
            });
        });
    });

    // 返回清理函數
    return () => {
        ctx.revert();
    };
}

function marqueeAnimation() {
    // 存儲每個 marquee 的當前 tween 和清理資源
    const marqueeData = new Map();

    // 選擇所有的 marquee 元素
    const marquees = document.querySelectorAll('[wb-data="marquee"]');

    if (!marquees.length) {
        return () => { };
    }

    const ctx = gsap.context(() => {
        function setupMarquee(marquee) {
            const duration = parseInt(marquee.getAttribute("duration"), 10) || 5;
            const marqueeContent = marquee.firstElementChild;

            if (!marqueeContent) {
                console.warn('Marquee content element not found');
                return null;
            }

            // 創建並添加克隆元素
            const marqueeContentClone = marqueeContent.cloneNode(true);
            marquee.append(marqueeContentClone);

            function playMarquee() {
                // 獲取當前的 tween 和進度
                const data = marqueeData.get(marquee);
                let progress = data?.tween ? data.tween.progress() : 0;

                // 如果存在之前的動畫，先清除
                if (data?.tween) {
                    data.tween.kill();
                }

                const width = parseInt(
                    getComputedStyle(marqueeContent).getPropertyValue("width"),
                    10
                );
                const gap = parseInt(
                    getComputedStyle(marqueeContent).getPropertyValue("column-gap"),
                    10
                );
                const distanceToTranslate = -1 * (gap + width);

                // 在 context 內創建動畫，自動被 tracking
                const tween = gsap.fromTo(
                    marquee.children,
                    { x: 0 },
                    { x: distanceToTranslate, duration, ease: "none", repeat: -1 }
                );

                tween.progress(progress);

                // 更新存儲的 tween
                if (data) {
                    data.tween = tween;
                } else {
                    marqueeData.set(marquee, { tween, observer: null, clone: marqueeContentClone });
                }

                return tween;
            }

            // 創建 ResizeObserver
            const resizeObserver = new ResizeObserver(() => {
                playMarquee();
            });

            // 更新數據，添加 observer
            const data = marqueeData.get(marquee) || { tween: null, observer: null, clone: marqueeContentClone };
            data.observer = resizeObserver;
            marqueeData.set(marquee, data);

            // 開始觀察
            resizeObserver.observe(marqueeContent);

            // 初始播放
            playMarquee();
        }

        // 設置所有 marquee
        marquees.forEach(setupMarquee);
    });

    // 返回清理函數
    return () => {
        // 清理 GSAP 動畫（context.revert() 會自動清理所有在 context 內創建的動畫）
        ctx.revert();

        // 清理其他資源（ResizeObserver 和克隆元素）
        marqueeData.forEach(({ observer, clone }) => {
            if (observer) {
                observer.disconnect();
            }
            if (clone && clone.parentNode) {
                clone.remove();
            }
        });
        marqueeData.clear();
    };
}








