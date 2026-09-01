(() => {
  const root = document.documentElement;

  const computed = getComputedStyle(root);
  const originalHeaderTop =
    computed.getPropertyValue("--dim-header-top").trim() || "0px";
  const originalStatusBarHeight =
    computed.getPropertyValue("--dim-statusbar-height").trim() || "28px";

  function bannerHeight() {
    return (
      getComputedStyle(root).getPropertyValue("--dod-banner-height").trim() ||
      "28px"
    );
  }

  function adjustLayout() {
    const h = bannerHeight();

    // Top chrome
    root.style.setProperty(
      "--dim-header-top",
      `calc(${originalHeaderTop} + ${h})`
    );

    // Content layout: reserve statusbar + classification banner
    root.style.setProperty(
      "--dim-statusbar-height",
      `calc(${originalStatusBarHeight} + ${h})`
    );

    // Do NOT set .statusbar styles here — CSS owns that
  }

  function whenReady(attempt = 0) {
    const h = getComputedStyle(root)
      .getPropertyValue("--dod-banner-height")
      .trim();
    if (h || attempt > 40) {
      adjustLayout();
      return;
    }
    setTimeout(() => whenReady(attempt + 1), 50);
  }

  whenReady();

  const observer = new MutationObserver(() => {
    clearTimeout(observer._t);
    observer._t = setTimeout(adjustLayout, 40);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();