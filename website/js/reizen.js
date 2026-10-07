/* ==========================================================================
   Reizen overview - trip map carousel (reizen.html only)

   All trips sit side by side in one scroll-snap row (see css/reizen.css), so
   they can always be swiped or scrolled. This script keeps the parts in sync:
   - A stop on the line scrolls the row to its trip; swiping or scrolling the
     row marks the trip that snapped in as current (aria-current).
   - Left/Right arrows move between the stops (Home/End to the first/last).
   - Previous/next buttons and a "1 / 7" counter; the buttons are disabled
     at either end. Phones hide both; the hidden live text stays.
   - Tab only visits the links of the current trip; anything else that gets
     focus inside a trip that is off screen brings that trip into the row.
   - Phones: stops and current trip fit one screen; a text that is too long
     is clamped and, if needed, the facts fold away, behind a "Lees meer"
     button (see below).
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
      var on = i === index;
      panel.classList.toggle("is-current", on);
      // Tab only visits the links of the current trip; without this, tabbing
      // from the buttons into the row lands on the first trip and pulls the
      // row back there. The links stay clickable, and the stops, arrow keys
      // and buttons reach the other trips.
      Array.prototype.forEach.call(panel.querySelectorAll("a[href], button"), function (el) {
        if (on) el.removeAttribute("tabindex");
        else el.setAttribute("tabindex", "-1");
      });
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
    queueLayoutMore();
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

  // Line and row in view, just below the fixed header.
  var MAP_GAP = 8;     // px between the header and the top of the line
  function jumpToMap() {
    var headerH = header ? header.offsetHeight : 0;
    var y = rail.getBoundingClientRect().top + (window.pageYOffset || 0) - headerH - MAP_GAP;
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

  /* --- Phones: one screen ------------------------------------------------
     Below 48rem the stops and every trip, down to its "Bekijk deze reis"
     button, fit on one screen with the line MAP_GAP below the header (where
     jumpToMap puts it). The screen is the small viewport: its height with
     the browser bars shown. Type and spacing never change; each step below
     is only taken when the one before is not enough:
     1. A text that is too long is clamped to the whole lines that still fit
        (at least two), with a "Lees meer" button right after it.
     2. The facts (Soort reis, Verblijf, Data, Prijs) fold away behind the
        same button (the price is on the stop as well), and the text gets
        back the lines that fit again.
     3. The main photos of all trips get lower together (--photo-h;
        css/reizen.css sets the 120px minimum), so the row keeps one photo
        height.
     "Lees meer" shows the whole text and the facts, "Lees minder" hides
     them again. Both stay in the page, in reading order (clamping and
     folding only hide them), and without JavaScript nothing is hidden. The
     plan never depends on what is open, so opening or closing a trip never
     moves the photos. An open trip stays open when the row moves on:
     closing it there would shift the page. See css/reizen.css ("Phones"). */
  var phone = window.matchMedia
    ? window.matchMedia("(max-width: 47.99rem)")
    : { matches: false };
  var portrait = window.matchMedia
    ? window.matchMedia("(orientation: portrait)")
    : { matches: false };
  var more = [];

  // The screen height with the browser bars shown (svh; where svh is not
  // supported, the smaller of vh and the initial containing block). It does
  // not change while a phone's address bar slides in and out, unlike
  // window.innerHeight.
  var probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100vh;height:100svh;height:calc(var(--svh, 1svh) * 100);visibility:hidden;pointer-events:none;";
  document.body.appendChild(probe);

  function screenHeight() {
    var h = probe.offsetHeight || window.innerHeight;
    var client = document.documentElement.clientHeight;
    return client ? Math.min(h, client) : h;
  }

  function setOpen(item, open) {
    item.open = open;
    item.panel.classList.toggle("is-open", open);
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

  // How far each trip's "Bekijk deze reis" button reaches below the screen
  // (negative: room to spare), leaving out the room of a "Lees meer" button
  // that shows. 1px is kept free for the rounding of the scroll position.
  function measureOver(buttonSpace) {
    var headerH = header ? header.offsetHeight : 0;
    var limit = rail.getBoundingClientRect().top + screenHeight() - headerH - MAP_GAP - 1;
    return more.map(function (item) {
      var shown = item.button.hidden ? 0 : buttonSpace;
      return item.cta.getBoundingClientRect().bottom - shown - limit;
    });
  }

  // The whole lines a text keeps to get at least `need` pixels shorter
  // (never fewer than two): { cut: the height to clamp to, saves: the
  // pixels it wins }, or null when every line would stay.
  function clampFor(item, need) {
    var bottoms = lineBottoms(item.text);
    var full = item.text.getBoundingClientRect().height;
    var lines = 0;
    for (var i = 0; i < bottoms.length; i++) {
      if (i >= 2 && Math.ceil(bottoms[i]) > full - need) break;
      lines = i + 1;
    }
    if (!lines || lines >= bottoms.length) return null;
    var cut = Math.ceil(bottoms[lines - 1]);
    return { cut: cut, saves: full - cut };
  }

  // The room the facts take, their top margin included: what folding wins.
  function factsSpace(item) {
    if (!item.facts) return 0;
    var top = parseFloat(window.getComputedStyle(item.facts).marginTop) || 0;
    return item.facts.getBoundingClientRect().height + top;
  }

  // Steps 1 and 2 for a trip that reaches `over` pixels too far, with the
  // button's room added to what has to go: { clamp, fold }, or null when it
  // fits (or nothing helps).
  function planFor(item, over, buttonSpace, factsRoom) {
    if (over <= 0) return null;
    var need = over + buttonSpace;
    var clamp = clampFor(item, need);
    if (clamp && clamp.saves >= need) return { clamp: clamp, fold: false };
    if (factsRoom > 0) {
      need -= factsRoom;
      return { clamp: need > 0 ? clampFor(item, need) : null, fold: true };
    }
    return clamp && clamp.saves > buttonSpace ? { clamp: clamp, fold: false } : null;
  }

  function layoutMore() {
    if (!more.length) return;
    if (!phone.matches) {
      root.classList.remove("has-photo-h");
      more.forEach(function (item) {
        item.panel.classList.remove("is-clamped", "is-folded");
        item.button.hidden = true;
      });
      return;
    }
    // Measure every trip at full size: full text, facts and photos. A
    // button that shows keeps showing while we measure (hiding it would take
    // its focus away); its room is left out of the sum instead: min-height
    // plus the margins.
    root.classList.remove("has-photo-h");
    more.forEach(function (item) { item.panel.classList.remove("is-clamped", "is-folded"); });
    var cs = window.getComputedStyle(more[0].button);
    var buttonSpace = (parseFloat(cs.minHeight) || 0) + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
    var room = more.map(factsSpace);

    // Step 3: how much lower the photos must be for every trip to fit with
    // its text at two lines and its facts folded.
    var over = measureOver(buttonSpace);
    var lower = 0;
    more.forEach(function (item, i) {
      if (over[i] <= 0) return;
      var two = clampFor(item, Infinity);
      var saving = Math.max(0, room[i] + (two ? two.saves : 0) - buttonSpace);
      if (over[i] - saving > lower) lower = over[i] - saving;
    });
    if (lower > 0) {
      var photo = more[0].panel.querySelector(".trip-map__photo--main");
      var full = photo ? photo.getBoundingClientRect().height : 0;
      if (full) {
        root.style.setProperty("--photo-h", Math.floor(full - Math.ceil(lower)) + "px");
        root.classList.add("has-photo-h");
        over = measureOver(buttonSpace);
      }
    }

    // Steps 1 and 2 per trip, with those photos: only as far as needed.
    var plans = more.map(function (item, i) {
      return planFor(item, over[i], buttonSpace, room[i]);
    });
    more.forEach(function (item, i) {
      var plan = plans[i];
      if (!plan) {
        if (item.open) setOpen(item, false);
        item.button.hidden = true;
        return;
      }
      var controls = item.text.id;
      if (plan.clamp) {
        item.text.style.setProperty("--text-max", plan.clamp.cut + "px");
        item.panel.classList.add("is-clamped");
      }
      if (plan.fold) {
        item.panel.classList.add("is-folded");
        controls += " " + item.facts.id;
      }
      item.button.setAttribute("aria-controls", controls);
      item.button.hidden = false;
    });
  }

  panels.forEach(function (panel) {
    var text = panel.querySelector(".trip-map__text");
    var facts = panel.querySelector(".trip-map__facts");
    var cta = panel.querySelector(".trip-map__actions .btn") || panel.querySelector(".trip-map__actions") || panel;
    if (!text) return;
    if (!text.id) text.id = panel.id + "-text";
    if (facts && !facts.id) facts.id = panel.id + "-facts";
    var button = document.createElement("button");
    button.type = "button";
    button.className = "trip-map__more";
    button.setAttribute("aria-controls", text.id);
    button.hidden = true;
    text.parentNode.insertBefore(button, text.nextSibling);
    var item = { panel: panel, text: text, facts: facts, cta: cta, button: button, open: false };
    setOpen(item, false);
    button.addEventListener("click", function () {
      setOpen(item, !item.open);
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
  // Only a real change of the layout counts: the width (clientWidth, which
  // pinch zoom leaves alone), the orientation or the small-viewport height.
  // A phone's address bar sliding in or out fires resize while scrolling
  // and changes window.innerHeight, but none of these: skip those.
  function layoutSize() {
    return document.documentElement.clientWidth + "x" + screenHeight() + (portrait.matches ? "p" : "l");
  }
  var laidOut = layoutSize();
  function onResizeMore() {
    var size = layoutSize();
    if (size === laidOut) return;
    laidOut = size;
    queueLayoutMore();
  }
  window.addEventListener("resize", onResizeMore);
  window.addEventListener("orientationchange", onResizeMore);
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
