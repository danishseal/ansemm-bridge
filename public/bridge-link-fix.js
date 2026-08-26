(() => {
  const BRIDGE_PATH = "/bridge";

  function normalizeText(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function isBridgeLinkCandidate(el) {
    if (!el) return false;

    // Buttons / link-like elements that literally say "Bridge".
    const text = normalizeText(el.textContent);
    if (/\bbridge\b/i.test(text)) return true;

    // Anchors that point at Squid's bridge app or contain "bridge".
    if (el.tagName === "A") {
      const href = el.getAttribute("href") || "";
      if (/app\.squidrouter\.com/i.test(href)) return true;
      if (/\bbridge\b/i.test(href)) return true;
    }

    return false;
  }

  function rewriteAnchors() {
    document
      .querySelectorAll('a[href*="app.squidrouter.com"],a[href*="bridge"]')
      .forEach((a) => {
        const href = a.getAttribute("href") || "";
        // Force bridge CTAs to stay local.
        if (/app\.squidrouter\.com/i.test(href) || /\bbridge\b/i.test(href)) {
          a.setAttribute("href", BRIDGE_PATH);
          a.removeAttribute("target");
          a.removeAttribute("rel");
        }
      });
  }

  function swapLandingImages() {
    document.querySelectorAll("img").forEach((img) => {
      const className = typeof img.className === "string" ? img.className : "";

      if (
        className.includes("absolute top-0 left-0 w-full h-full object-cover")
      ) {
        img.setAttribute("src", "/new-bg-hero.webp");
        return;
      }

      if (className.includes("w-full !h-auto")) {
        img.setAttribute("src", "/7356fd7d-d9de-4b61-9b9e-6dc63b7e58a4.webp");
        img.style.marginTop = "180px";
        img.style.maxWidth = "980px";
      }
    });
  }

  function onClickCapture(e) {
    const target = e.target;
    const el = target && target.closest ? target.closest('a,button,[role="link"],[role="button"]') : null;
    if (!isBridgeLinkCandidate(el)) return;

    e.preventDefault();
    e.stopPropagation();
    window.location.assign(BRIDGE_PATH);
  }

  document.addEventListener("DOMContentLoaded", () => {
    rewriteAnchors();
    swapLandingImages();
  });
  swapLandingImages();
  document.addEventListener("click", onClickCapture, true);
})();
