(() => {
  const root = document.documentElement;

  const computed = getComputedStyle(root);
  const originalHeaderTop = computed.getPropertyValue("--dim-header-top").trim() || "0px";
  const originalStatusBarHeight = computed.getPropertyValue("--dim-statusbar-height").trim() || "0px";

  function adjustLayout() {
    const bannerHeight =
      getComputedStyle(root).getPropertyValue("--dod-banner-height").trim() || "28px";

    // Push header down for the top banner
    root.style.setProperty(
      "--dim-header-top",
      `calc(${originalHeaderTop} + ${bannerHeight})`
    );

    // Reserve extra space at the bottom so content doesn't go under the banner
    root.style.setProperty(
      "--dim-statusbar-height",
      `calc(${originalStatusBarHeight} + ${bannerHeight})`
    );

    // Only move the status bar up — do NOT force its height
    document.querySelectorAll(".statusbar").forEach((el) => {
      el.style.bottom = bannerHeight;
      // Clear any previous height override so it keeps its natural size
      el.style.height = "";
    });
  }

  adjustLayout();

  // Re-apply when DbGate rebuilds the UI
  const observer = new MutationObserver(() => {
    clearTimeout(observer._t);
    observer._t = setTimeout(adjustLayout, 40);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
