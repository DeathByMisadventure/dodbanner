(async () => {

  // Built-in defaults in case any files are missing.
  const defaultLevels = {
    UNCLASSIFIED: {
      text: "UNCLASSIFIED",
      backgroundColor: "#007A33",
      textColor: "#FFFFFF"
    }
  };

  const defaultOptions = {
    showTopBanner: true,
    showBottomBanner: true,
    bannerHeight: "28px",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "18px",
    fontWeight: "bold",
    zIndex: 99999,
    application: "",
    appendApplication: false
  };

  // Determine the directory banner.js was loaded from.
  const bannerBase = new URL(".", document.currentScript.src).pathname;

  // Helper to build URLs.
  function bannerUrl(file) {
      return bannerBase + file;
  }

  async function fetchJson(url, fallback) {
    try {
      const r = await fetch(bannerUrl(url), { cache: "no-store" });
      if (!r.ok) {
        return fallback;
      }
      return await r.json();
    } catch {
      console.warn(`Unable to load ${url}`);
      return fallback;
    }
  }

  async function fetchClassification() {
    try {
      const r = await fetch(bannerUrl("banner-classification"), {
        cache: "no-store"
      });
      if (!r.ok) {
        return {
          classification: "UNCLASSIFIED",
          caveat: ""
        };
      }
      const lines = (await r.text())
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);
      return {
        classification: (lines[0] || "UNCLASSIFIED").toUpperCase(),
        caveat: lines.slice(1).join(" // ")
      };
    } catch {
      return {
        classification: "UNCLASSIFIED",
        caveat: ""
      };
    }
  }

  const [
    levelsFile,
    options,
    classification
  ] = await Promise.all([
    fetchJson("banner-levels.json", { levels: defaultLevels }),
    fetchJson("banner-options.json", defaultOptions),
    fetchClassification()
  ]);

  const levels = levelsFile.levels ?? defaultLevels;
  const level =
    levels[classification.classification] ??
    defaultLevels.UNCLASSIFIED;

  // Expose configuration to CSS
  document.documentElement.style.setProperty(
    "--dod-banner-height",
    options.bannerHeight
  );
  document.documentElement.style.setProperty(
    "--dod-banner-bg",
    level.backgroundColor
  );
  document.documentElement.style.setProperty(
    "--dod-banner-fg",
    level.textColor
  );
  document.documentElement.style.setProperty(
    "--dod-banner-font-family",
    options.fontFamily
  );
  document.documentElement.style.setProperty(
    "--dod-banner-font-size",
    options.fontSize
  );
  document.documentElement.style.setProperty(
    "--dod-banner-font-weight",
    options.fontWeight
  );
  document.documentElement.style.setProperty(
    "--dod-banner-zindex",
    options.zIndex.toString()
  );

  function createBanner(position) {
    const banner = document.createElement("div");
    banner.className = `dod-banner ${position}`;
    let text = level.text;
    if (classification.caveat) {
      text += " // " + classification.caveat;
    }
    if (options.appendApplication && options.application) {
      text += " - " + options.application;
    }
    banner.textContent = text;
    document.body.appendChild(banner);
  }
  if (options.showTopBanner) {
    createBanner("top");
  }
  if (options.showBottomBanner) {
    createBanner("bottom");
  }
  document.body.setAttribute("data-banner-enabled", "");
})();