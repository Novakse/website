/* ==========================================================================
   Reizen overview - trip map carousel (reizen.html only)

   All trips sit side by side in one scroll-snap row (see css/reizen.css), so
   they can always be swiped or scrolled. This script keeps the parts in sync:
   - A stop on the line scrolls the row to its trip; swiping or scrolling the
     row marks the trip that snapped in as current (aria-current).
   - Left/Right arrows move between the stops (Home/End to the first/last).
   - Previous/next buttons and a "1 / 7" counter; the buttons are disabled
     at either end.
   - Tabbing into a trip that is off screen brings it into the row.
   - Phones: a trip text that does not fit one screen is clamped, with a
     "Lees meer" button (see below).
   - Each panel has a stable id (#orsa, #finland, ...). A matching hash on
     load opens that trip with the line in view below the header; once a new
     trip settles, the hash follows with replaceState (no scroll jump and no
     extra history entries).
   Without this script the row still swipes and the stops are plain anchor
   links to the panels.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-trip-map]");
  if (!root) return;

  var rail = root.querySelector(".trip-map__rail");
  var list = root.querySelector(".trip-map__stops");
  var row = root.querySelector(".trip-map__panels");
  if (!rail || !list || !row) return;

  var stops = [];
  var panels = [];
  Array.prototype.forEach.call(list.querySelectorAll(".trip-map__stop"), function (stop) {
    var id = (stop.getAttribute("href") || "").replace(/^#/, "");
    var panel = id ? document.getElementById(id) : null;
    if (!panel || !row.contains(panel)) return;
    stops.push(stop);
    panels.push(panel);
  });
  var count = panels.length;
  if (!count) return;

  var controls = root.querySelector(".trip-map__controls");
  var prevBtn = controls ? controls.querySelector("[data-trip-prev]") : null;
  var nextBtn = controls ? controls.querySelector("[data-trip-next]") : null;
  var countNow = controls ? controls.querySelector(".trip-map__count-now") : null;
  var countTotal = controls ? controls.querySelector(".trip-map__count-total") : null;
  var countLive = controls ? controls.querySelector(".trip-map__count-live") : null;

  var reducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };
  var header = document.querySelector(".site-header");

  var current = -1;    // trip marked as current
  var pending = -1;    // trip a scroll started by this script is heading to
  var committed = -1;  // trip last written to the hash and the live region
  var settleTimer = 0;
  var pendingTimer = 0;
  var names = [];

  /* --- ARIA: a carousel with one group ("dia") per trip ------------------ */
  root.setAttribute("aria-roledescription", "carousel");
  if (!root.hasAttribute("aria-label") && !root.hasAttribute("aria-labelledby")) {
    root.setAttribute("aria-label", list.getAttribute("aria-label") || "Kies een reis");
  }
  panels.forEach(function (panel, i) {
    var title = panel.querySelector(".trip-map__title");
    var nameEl = title || stops[i].querySelector(".trip-map__name") || stops[i];
    names[i] = nameEl.textContent.replace(/\s+/g, " ").trim();
    panel.setAttribute("role", "group");
    panel.setAttribute("aria-roledescription", "dia");
    panel.removeAttribute("aria-labelledby");
    panel.setAttribute("aria-label", label(i));
    stops[i].setAttribute("aria-controls", panel.id);
  });

  function label(i) {
    return names[i] + ", " + (i + 1) + " van " + count;
  }

  function indexFromHash() {
    var id = window.location.hash.replace(/^#/, "");
    if (!id) return -1;
    try { id = decodeURIComponent(id); } catch (err) { /* keep raw id */ }
    for (var i = 0; i < count; i++) {
      if (panels[i].id === id) return i;
    }
    return -1;
  }

  function panelIndexOf(node) {
    for (var i = 0; i < count; i++) {
      if (panels[i].contains(node)) return i;
    }
    return -1;
  }

  /* --- Row geometry ------------------------------------------------------ */
  function maxScroll() {
    return Math.max(0, row.scrollWidth - row.clientWidth);
  }

  // The first trip is lined up at scrollLeft 0, so a trip's snap position is
  // its distance from the first one (clamped to what the row can scroll).
  function targetFor(i) {
    var left = panels[i].getBoundingClientRect().left - panels[0].getBoundingClientRect().left;
    return Math.max(0, Math.min(maxScroll(), Math.round(left)));
  }

  // The trip whose snap position is closest to where the row is now. On a
  // tie (only possible at the very end) the later trip wins.
  function nearest() {
    var x = row.scrollLeft;
    var best = 0;
    var bestDistance = Infinity;
    for (var i = 0; i < count; i++) {
      var distance = Math.abs(targetFor(i) - x);
      if (distance <= bestDistance) {
        best = i;
        bestDistance = distance;
      }
    }
    return best;
  }

  function scrollRow(left, smooth) {
    if (typeof row.scrollTo === "function") {
      try {
        row.scrollTo({ left: left, behavior: smooth ? "smooth" : "auto" });
        return;
      } catch (err) { /* old browsers: fall through */ }
    }
    row.scrollLeft = left;
  }

  /* --- Swipe strip of stops: keep the current stop in view -------------- */
  function syncFades() {
    var max = rail.scrollWidth - rail.clientWidth;
    var scrolls = max > 1;
    root.classList.toggle("has-more-start", scrolls && rail.scrollLeft > 2);
    root.classList.toggle("has-more-end", scrolls && rail.scrollLeft < max - 2);
  }

  // Scrolls the strip itself (never the page), so the page does not move
  // vertically while the row is being swiped.
  function revealStop(index, smooth) {
    var max = rail.scrollWidth - rail.clientWidth;
    if (max <= 1) return;
    var item = stops[index].parentNode;
    var railBox = rail.getBoundingClientRect();
    var itemBox = item.getBoundingClientRect();
    var delta = (itemBox.left + itemBox.width / 2) - (railBox.left + railBox.width / 2);
    var left = Math.max(0, Math.min(max, rail.scrollLeft + delta));
    if (Math.abs(left - rail.scrollLeft) < 1) return;
    if (typeof rail.scrollTo === "function") {
      try {
        rail.scrollTo({ left: left, behavior: smooth && !reducedMotion.matches ? "smooth" : "auto" });
        return;
      } catch (err) { /* fall through */ }
    }
    rail.scrollLeft = left;
  }

  /* Load a trip's photos a little ahead of time (they are lazy). */
  function warmUp(index) {
    if (index < 0 || index >= count) return;
    Array.prototype.forEach.call(panels[index].querySelectorAll('img[loading="lazy"]'), function (img) {
      img.loading = "eager";
    });
  }

  /* --- Current trip ------------------------------------------------------ */
  function setDisabled(button, off, other) {
    if (!button || button.disabled === off) return;
    // A button that gets disabled while focused would drop focus to the
    // page; hand it to the other button instead.
    if (off && document.activeElement === button && other && !other.disabled) other.focus();
    button.disabled = off;
  }

  function syncButtons() {
    var at = pending >= 0 ? pending : current;
    setDisabled(prevBtn, at <= 0, nextBtn);
    setDisabled(nextBtn, at >= count - 1, prevBtn);
  }

  function setCurrent(index, smoothStrip) {
    if (index === current) return;
    current = index;
    stops.forEach(function (stop, i) {
      var on = i === index;
      if (on) stop.setAttribute("aria-current", "true");
      else stop.removeAttribute("aria-current");
      stop.setAttribute("tabindex", on ? "0" : "-1");
    });
    panels.forEach(function (panel, i) {
      panel.classList.toggle("is-current", i === index);
    });
    if (countNow) countNow.textContent = String(index + 1);
    syncButtons();
    revealStop(index, smoothStrip !== false);
    warmUp(index);
    warmUp(index + 1);
    warmUp(index - 1);
  }

  // Once a trip has settled: hash and screen reader announcement.
  function commit() {
    if (current === committed) return;
    committed = current;
    if (countLive) countLive.textContent = label(current);
    if (window.history && window.history.replaceState) {
      try {
        window.history.replaceState(window.history.state, "", "#" + panels[current].id);
      } catch (err) { /* e.g. file:// in some browsers: ignore */ }
    }
  }

  function settle() {
    window.clearTimeout(settleTimer);
    window.clearTimeout(pendingTimer);
    pending = -1;
    setCurrent(nearest());
    syncButtons();
    commit();
  }

  // Scroll the row to a trip. The trip is marked current straight away, and
  // the trips passed on the way are ignored until the row settles.
  function go(index, smooth) {
    index = Math.max(0, Math.min(count - 1, index));
    var left = targetFor(index);
    var animate = smooth !== false && !reducedMotion.matches;
    setCurrent(index);
    if (Math.abs(row.scrollLeft - left) < 1) {
      pending = -1;
      syncButtons();
      commit();
      return;
    }
    pending = index;
    syncButtons();
    window.clearTimeout(pendingTimer);
    pendingTimer = window.setTimeout(settle, animate ? 1500 : 250);
    scrollRow(left, animate);
  }

  /* --- Events ------------------------------------------------------------ */
  stops.forEach(function (stop, i) {
    stop.addEventListener("click", function (event) {
      // Keep "open in new tab" and friends working: the href is a real link.
      if (event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      go(i);
    });
    stop.addEventListener("pointerenter", function () { warmUp(i); });
  });

  list.addEventListener("keydown", function (event) {
    var i = stops.indexOf(event.target);
    if (i < 0) return;
    var next;
    switch (event.key) {
      case "ArrowRight":
      case "Right":
        next = Math.min(count - 1, i + 1); break;
      case "ArrowLeft":
      case "Left":
        next = Math.max(0, i - 1); break;
      case "Home": next = 0; break;
      case "End": next = count - 1; break;
      default: return;
    }
    event.preventDefault();
    try { stops[next].focus({ preventScroll: true }); } catch (err) { stops[next].focus(); }
    go(next);
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      go((pending >= 0 ? pending : current) - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      go((pending >= 0 ? pending : current) + 1);
    });
  }

  // Keyboard focus that lands in another trip (Tab into its links) brings
  // that trip into the row. Focus that comes from a mouse press or tap is
  // left alone: the browser focuses a link on mousedown, and scrolling the
  // row then would pull the link away before mouseup, so the click (e.g.
  // "Bekijk deze reis" on the peeking trip) would get lost.
  // The flag only lives for the press itself: the focus that a press causes
  // happens in the same task as its mousedown.
  var pointerFocus = false;
  var pointerTimer = 0;
  function markPointer() {
    pointerFocus = true;
    window.clearTimeout(pointerTimer);
    pointerTimer = window.setTimeout(function () { pointerFocus = false; }, 0);
  }
  row.addEventListener("pointerdown", markPointer, { passive: true });
  row.addEventListener("mousedown", markPointer, { passive: true });

  row.addEventListener("focusin", function (event) {
    if (pointerFocus) return;
    var i = panelIndexOf(event.target);
    if (i < 0 || i === (pending >= 0 ? pending : current)) return;
    go(i);
  });

  // Tapping the peeking trip (anywhere but a link) brings it in.
  row.addEventListener("click", function (event) {
    var i = panelIndexOf(event.target);
    if (i < 0 || i === current) return;
    if (event.target.closest && event.target.closest("a, button")) return;
    go(i);
  });

  var rowTicking = false;
  row.addEventListener("scroll", function () {
    if (!rowTicking) {
      rowTicking = true;
      window.requestAnimationFrame(function () {
        rowTicking = false;
        if (pending < 0) setCurrent(nearest());
      });
    }
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, 160);
  }, { passive: true });
  row.addEventListener("scrollend", settle);

  var railTicking = false;
  rail.addEventListener("scroll", function () {
    if (railTicking) return;
    railTicking = true;
    window.requestAnimationFrame(function () {
      syncFades();
      railTicking = false;
    });
  }, { passive: true });

  // After a width change the trips are resized: line the current one up
  // again. Height-only changes (mobile address bar) are ignored.
  var lastWidth = window.innerWidth;
  var resizeTicking = false;
  window.addEventListener("resize", function () {
    if (resizeTicking) return;
    resizeTicking = true;
    window.requestAnimationFrame(function () {
      resizeTicking = false;
      syncFades();
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      var at = pending >= 0 ? pending : current;
      pending = at;
      window.clearTimeout(pendingTimer);
      pendingTimer = window.setTimeout(settle, 250);
      scrollRow(targetFor(at), false);
      revealStop(at, false);
    });
  });

  // The top of the line right below the fixed header: the map (line, row
  // and controls) is sized to fill exactly the rest of the screen.
  function jumpToMap() {
    var headerH = header ? header.offsetHeight : 0;
    var y = rail.getBoundingClientRect().top + (window.pageYOffset || 0) - headerH;
    var html = document.documentElement;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, Math.max(0, Math.round(y)));
    html.style.scrollBehavior = "";
  }

  window.addEventListener("hashchange", function () {
    var i = indexFromHash();
    if (i < 0) return;
    go(i, false);
    jumpToMap();
  });

  /* --- Phones: "Lees meer" ------------------------------------------------
     Below 48rem every trip fills one screen. A text that is too long for it
     is clamped to the whole lines that still fit (at least two), with a
     "Lees meer" button right after it; "Lees minder" closes it again. The
     full text always stays in the page (the clamp only hides the overflow).
     An open text stays open when the row moves on to another trip: closing
     it there would shift the page. See css/reizen.css (.trip-map__more). */
  var phone = window.matchMedia
    ? window.matchMedia("(max-width: 47.99rem)")
    : { matches: false };
  var more = [];

  function setOpen(item, open) {
    item.open = open;
    item.button.setAttribute("aria-expanded", open ? "true" : "false");
    item.button.textContent = open ? "Lees minder" : "Lees meer";
  }

  // The bottom of every line of a text, measured from the top of the text.
  function lineBottoms(text) {
    var top = text.getBoundingClientRect().top;
    var lineH = parseFloat(window.getComputedStyle(text).lineHeight) || 0;
    var bottoms = [];
    var walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT, null);
    var range = document.createRange();
    var node;
    while ((node = walker.nextNode())) {
      if (!/\S/.test(node.nodeValue)) continue;
      range.selectNodeContents(node);
      Array.prototype.forEach.call(range.getClientRects(), function (r) {
        if (!r.width) return;
        // A line box is lineH high, centred on the glyphs.
        var bottom = (r.top + r.bottom) / 2 + lineH / 2 - top;
        var last = bottoms[bottoms.length - 1];
        if (last === undefined || bottom > last + 2) bottoms.push(bottom);
      });
    }
    return bottoms;
  }

  function layoutMore() {
    if (!more.length) return;
    if (!phone.matches) {
      more.forEach(function (item) {
        item.panel.classList.remove("is-clamped");
        item.button.hidden = true;
      });
      return;
    }
    // Measure every trip with its full text. A button that shows keeps
    // showing while we measure (hiding it would take its focus away); its
    // room is left out of the sum instead: min-height plus the margins.
    more.forEach(function (item) { item.panel.classList.remove("is-clamped"); });
    var cs = window.getComputedStyle(more[0].button);
    var buttonSpace = (parseFloat(cs.minHeight) || 0) + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);

    // A trip may reach into the row's bottom padding: it is still on screen.
    var slack = parseFloat(window.getComputedStyle(row).paddingBottom) || 0;

    // Reads first...
    var plans = more.map(function (item) {
      var budget = parseFloat(window.getComputedStyle(item.panel).minHeight) || 0;
      var shown = item.button.hidden ? 0 : buttonSpace;
      var over = item.panel.getBoundingClientRect().height - shown - budget - slack;
      if (over <= 0.5) return null;
      var bottoms = lineBottoms(item.text);
      var allowed = item.text.getBoundingClientRect().height - over - buttonSpace;
      var lines = 0;
      for (var i = 0; i < bottoms.length; i++) {
        if (i >= 2 && bottoms[i] > allowed + 0.5) break;
        lines = i + 1;
      }
      // Clamping only helps when it hides at least one line.
      if (lines >= bottoms.length) return null;
      return Math.ceil(bottoms[lines - 1]);
    });

    // ...then writes.
    more.forEach(function (item, i) {
      var cut = plans[i];
      if (cut === null) {
        if (item.open) setOpen(item, false);
        item.button.hidden = true;
        return;
      }
      item.button.hidden = false;
      if (item.open) return;
      item.text.style.setProperty("--text-max", cut + "px");
      item.panel.classList.add("is-clamped");
    });
  }

  panels.forEach(function (panel) {
    var text = panel.querySelector(".trip-map__text");
    if (!text) return;
    if (!text.id) text.id = panel.id + "-text";
    var button = document.createElement("button");
    button.type = "button";
    button.className = "trip-map__more";
    button.setAttribute("aria-controls", text.id);
    button.hidden = true;
    text.parentNode.insertBefore(button, text.nextSibling);
    var item = { panel: panel, text: text, button: button, open: false };
    setOpen(item, false);
    button.addEventListener("click", function () {
      setOpen(item, !item.open);
      layoutMore();
      // Closed again: back to the one-screen map if the page was scrolled
      // into it. The button keeps focus.
      if (!item.open && header && rail.getBoundingClientRect().top < header.offsetHeight - 1) {
        jumpToMap();
      }
    });
    more.push(item);
  });

  var moreTicking = false;
  function queueLayoutMore() {
    if (moreTicking) return;
    moreTicking = true;
    window.requestAnimationFrame(function () {
      moreTicking = false;
      layoutMore();
    });
  }
  window.addEventListener("resize", queueLayoutMore);
  window.addEventListener("orientationchange", queueLayoutMore);
  window.addEventListener("load", queueLayoutMore, { once: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueLayoutMore);

  /* --- Start ------------------------------------------------------------- */
  var fromHash = indexFromHash();
  var start = fromHash >= 0 ? fromHash : 0;

  if (countTotal) countTotal.textContent = String(count);
  root.classList.add("is-ready");
  setCurrent(start, false);
  committed = start;
  if (countLive) {
    // Fill the live region first and only then make it live, so the page
    // load itself is not announced.
    countLive.textContent = label(start);
    countLive.setAttribute("aria-live", "polite");
    countLive.setAttribute("aria-atomic", "true");
  }
  syncFades();
  layoutMore();

  if (fromHash >= 0) {
    // Jump straight to the trip, and once more after load (fonts and images
    // can still move things) unless the visitor has started scrolling.
    var moved = false;
    var markMoved = function () { moved = true; };
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) {
      window.addEventListener(type, markMoved, { passive: true, once: true });
    });
    var place = function () {
      scrollRow(targetFor(start), false);
      revealStop(start, false);
      jumpToMap();
    };
    place();
    window.addEventListener("load", function () {
      if (!moved) place();
    }, { once: true });
  }
})();
