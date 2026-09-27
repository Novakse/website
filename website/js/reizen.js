/* ==========================================================================
   Reizen overview - trip map tabs (reizen.html only)

   Turns the stops on the line into WAI-ARIA tabs with automatic activation:
   - Left/Right arrows move to the previous/next trip (wrapping), Home/End
     to the first/last one; the panel follows focus.
   - Each panel has a stable id (#orsa, #finland, ...). A matching hash on
     load opens that trip; switching updates the hash with replaceState, so
     there is no scroll jump and no extra history entries.
   - In the swipe strip (narrow screens) the chosen stop scrolls into view
     and the edge fades follow the scroll position.
   Without this script all trips stay visible and the stops are plain
   anchor links to the panels.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-trip-map]");
  if (!root) return;

  var rail = root.querySelector(".trip-map__rail");
  var list = root.querySelector(".trip-map__stops");
  if (!rail || !list) return;

  var tabs = [];
  var panels = [];
  Array.prototype.forEach.call(list.querySelectorAll(".trip-map__stop"), function (tab) {
    var id = (tab.getAttribute("href") || "").replace(/^#/, "");
    var panel = id ? document.getElementById(id) : null;
    if (!panel || !tab.id) return;
    tabs.push(tab);
    panels.push(panel);
  });
  if (!tabs.length) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var header = document.querySelector(".site-header");
  var current = -1;

  /* --- ARIA wiring ------------------------------------------------------ */
  list.setAttribute("role", "tablist");
  Array.prototype.forEach.call(list.children, function (item) {
    item.setAttribute("role", "presentation");
  });

  tabs.forEach(function (tab, i) {
    var panel = panels[i];
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panel.id);
    tab.setAttribute("aria-selected", "false");
    tab.setAttribute("tabindex", "-1");
    panel.setAttribute("role", "tabpanel");
    // Keep the panel's own heading as its name ("Orsa") when it has one;
    // the tab's name also holds country and price.
    if (!panel.hasAttribute("aria-labelledby")) panel.setAttribute("aria-labelledby", tab.id);
    // No tabindex on the panel: it always holds links, and a focusable
    // panel would get a focus ring when a deep link (#lulea) targets it.
    panel.hidden = true;
  });

  function indexFromHash() {
    var id = window.location.hash.replace(/^#/, "");
    if (!id) return -1;
    try { id = decodeURIComponent(id); } catch (err) { /* keep raw id */ }
    for (var i = 0; i < panels.length; i++) {
      if (panels[i].id === id) return i;
    }
    return -1;
  }

  /* --- Swipe strip: keep the chosen stop in view, fade the edges -------- */
  function railScrolls() {
    return rail.scrollWidth > rail.clientWidth + 1;
  }

  function syncFades() {
    var max = rail.scrollWidth - rail.clientWidth;
    var scrolls = max > 1;
    root.classList.toggle("has-more-start", scrolls && rail.scrollLeft > 2);
    root.classList.toggle("has-more-end", scrolls && rail.scrollLeft < max - 2);
  }

  function revealStop(index, smooth) {
    if (!railScrolls()) return;
    var item = tabs[index].parentNode;
    var railBox = rail.getBoundingClientRect();
    var itemBox = item.getBoundingClientRect();
    var delta = (itemBox.left + itemBox.width / 2) - (railBox.left + railBox.width / 2);
    var left = Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, rail.scrollLeft + delta));
    if (Math.abs(left - rail.scrollLeft) < 1) return;
    if (typeof rail.scrollTo === "function") {
      rail.scrollTo({ left: left, behavior: smooth && !reducedMotion.matches ? "smooth" : "auto" });
    } else {
      rail.scrollLeft = left;
    }
  }

  /* A jump to a trip (deep link) lands with the line still in view above
     the panel: scroll-margin-top covers the header plus the line. */
  function syncScrollMargin() {
    var panel = panels[current];
    if (!panel) return;
    var headerH = header ? header.offsetHeight : 80;
    var gap = panel.getBoundingClientRect().top - rail.getBoundingClientRect().top;
    root.style.setProperty("--panel-scroll-margin", Math.round(headerH + gap + 8) + "px");
  }

  function scrollToPanel() {
    var panel = panels[current];
    if (!panel) return;
    syncScrollMargin();
    var html = document.documentElement;
    html.style.scrollBehavior = "auto";
    panel.scrollIntoView({ block: "start" });
    html.style.scrollBehavior = "";
  }

  /* --- Selecting a trip --------------------------------------------------- */
  function select(index, opts) {
    opts = opts || {};
    if (index === current) {
      if (opts.focus) tabs[index].focus();
      return;
    }
    current = index;

    tabs.forEach(function (tab, i) {
      var on = i === index;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.setAttribute("tabindex", on ? "0" : "-1");
    });

    var panel = panels[index];
    panels.forEach(function (other, i) {
      if (i !== index) {
        other.hidden = true;
        other.classList.remove("is-entering");
      }
    });

    if (opts.animate && !reducedMotion.matches) {
      panel.classList.add("is-entering");
      panel.hidden = false;
      void panel.offsetWidth; // commit the start state before transitioning
      window.requestAnimationFrame(function () {
        panel.classList.remove("is-entering");
      });
    } else {
      panel.hidden = false;
    }

    if (opts.focus) tabs[index].focus();
    revealStop(index, opts.animate);

    if (opts.updateHash && window.history && window.history.replaceState) {
      try {
        window.history.replaceState(window.history.state, "", "#" + panel.id);
      } catch (err) { /* e.g. file:// in some browsers: ignore */ }
    }
  }

  /* Load a panel's photos as soon as someone points at its stop, so they are
     usually there by the time the panel opens. */
  function warmUp(index) {
    Array.prototype.forEach.call(panels[index].querySelectorAll('img[loading="lazy"]'), function (img) {
      img.loading = "eager";
    });
  }

  /* --- Events ------------------------------------------------------------ */
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function (event) {
      // Keep "open in new tab" and friends working: the href is a real link.
      if (event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(i, { animate: true, updateHash: true });
    });
    tab.addEventListener("pointerenter", function () { warmUp(i); });
  });

  list.addEventListener("keydown", function (event) {
    var i = tabs.indexOf(event.target);
    if (i < 0) return;
    var next = -1;
    switch (event.key) {
      case "ArrowRight": next = (i + 1) % tabs.length; break;
      case "ArrowLeft": next = (i - 1 + tabs.length) % tabs.length; break;
      case "Home": next = 0; break;
      case "End": next = tabs.length - 1; break;
      case " ":
      case "Spacebar":
        next = i; break;
      default: return;
    }
    event.preventDefault();
    select(next, { focus: true, animate: true, updateHash: true });
  });

  var fadeTicking = false;
  rail.addEventListener("scroll", function () {
    if (fadeTicking) return;
    fadeTicking = true;
    window.requestAnimationFrame(function () {
      syncFades();
      fadeTicking = false;
    });
  }, { passive: true });

  window.addEventListener("resize", function () {
    syncFades();
    syncScrollMargin();
  });

  window.addEventListener("hashchange", function () {
    var i = indexFromHash();
    if (i < 0) return;
    select(i, { animate: true });
    scrollToPanel();
  });

  /* --- Start ------------------------------------------------------------- */
  var fromHash = indexFromHash();
  select(fromHash >= 0 ? fromHash : 0);
  root.classList.add("is-ready");
  syncFades();
  syncScrollMargin();

  if (fromHash >= 0) {
    // The panel was hidden while the browser looked for the hash, so jump
    // to it now, and once more after load (fonts and images can still move
    // things) unless the visitor has started scrolling by then.
    var moved = false;
    var markMoved = function () { moved = true; };
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) {
      window.addEventListener(type, markMoved, { passive: true, once: true });
    });
    scrollToPanel();
    window.addEventListener("load", function () {
      if (!moved) scrollToPanel();
    }, { once: true });
  }
})();
