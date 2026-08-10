(() => {

    const root = document.documentElement;

    const computed = getComputedStyle(root);

    const originalHeaderTop = computed
        .getPropertyValue("--dim-header-top")
        .trim();

    const originalStatusBarHeight = computed
        .getPropertyValue("--dim-statusbar-height")
        .trim();

    function adjustLayout() {

        const bannerHeight =
            getComputedStyle(root)
                .getPropertyValue("--dod-banner-height")
                .trim() || "28px";

        //
        // Move all content below the top banner.
        //
        root.style.setProperty(
            "--dim-header-top",
            `calc(${originalHeaderTop} + ${bannerHeight})`
        );

        //
        // Tell DbGate there is more space reserved at the bottom.
        //
        root.style.setProperty(
            "--dim-statusbar-height",
            `calc(${originalStatusBarHeight} + ${bannerHeight})`
        );

        //
        // But keep the actual status bar its original height.
        //
        document.querySelectorAll(".statusbar").forEach(el => {
            el.style.bottom = bannerHeight;
            el.style.height = originalStatusBarHeight;
        });

    }

    adjustLayout();

    new MutationObserver(adjustLayout).observe(document.body, {
        childList: true,
        subtree: true
    });

})();