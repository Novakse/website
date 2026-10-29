/* ==========================================================================
   Reizen overview (reizen.html): the trip deck.

   The top panel (heading, rating, photo, trip search), every package trip
   as a glass block in a grid and the group trips below them (styles in the
   <style data-deck-css> block of reizen.html; the top panel's entrance is
   plain CSS, so it plays without waiting for this script). This script:
   1. folds each block to its first paragraph and two facts, and lets
      "Lees meer" (or a click on the photo) open the whole trip in a sheet;
   2. adds the motion: blocks rise in row by row, their photo is swept free
      once it is in view and a glint of light slides over the glass; blocks
      tilt towards the mouse; the group trips' dates flip in like a desk
      calendar; the photo flies from the block into the sheet and back.

   Motion uses GSAP (js/vendor/gsap.min.js) and follows MOTION-GUIDELINES.md:
   transform and opacity only, 2D only for entrances, nothing tied to the
   scroll position, nothing at all with prefers-reduced-motion. When a part
   starts is decided by IntersectionObservers (checked again once scrolling
   stops), so nothing is measured while scrolling. Every block always ends
   up in view: without GSAP the blocks and the sheet still work, just
   without motion. Without this script every block shows its full text and
   facts.
   ========================================================================== */
(function () {
  "use strict";

  var deck = document.querySelector("section[data-trip-deck]");
  if (!deck) return;

  var root = document.documentElement;
  var gsap = window.gsap;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var wideSheet = window.matchMedia("(min-width: 56rem)");
  var cards = Array.prototype.slice.call(deck.querySelectorAll(".deck-card"));
  var forEach = Array.prototype.forEach;
  var motionOK = !!gsap && "IntersectionObserver" in window && !reducedMotion.matches;

  // The CSS keeps the blocks hidden until "deck-motion" (set only once the
  // motion in section 3 is ready) or "deck-still" is set, and shows them
  // after 3 seconds if neither comes. A script that arrives after those 3
  // seconds finds the blocks already in view: they stay that way.
  if (motionOK && cards.length && getComputedStyle(cards[0]).opacity === "1") motionOK = false;
  if (!motionOK) root.classList.add("deck-still");

  var sheet = document.getElementById("tripSheet");
  // No <dialog> support: keep the full blocks, as without JavaScript.
  if (!sheet || typeof sheet.showModal !== "function") {
    root.classList.add("deck-still");
    return;
  }

  /* ------------------------------------------------------------------
     1. Fold the blocks and wire up the sheet
     ------------------------------------------------------------------ */
  var panel = sheet.querySelector(".trip-sheet__panel");
  var scrim = sheet.querySelector(".trip-sheet__scrim");
  var media = sheet.querySelector(".trip-sheet__media");
  var mainSlot = sheet.querySelector(".trip-sheet__photo--main");
  var regionEl = sheet.querySelector(".trip-sheet__region");
  var titleEl = sheet.querySelector(".trip-sheet__title");
  var textEl = sheet.querySelector(".trip-sheet__text");
  var factsEl = sheet.querySelector(".trip-sheet__facts");
  var actionsEl = sheet.querySelector(".trip-sheet__actions");

  // The sheet shows the photo larger than the block does.
  var SHEET_SIZES = "(min-width: 70rem) 36rem, (min-width: 56rem) 52vw, 100vw";

  var current = null;   // { card, trigger } while the sheet is open
  var timeline = null;  // the running open or close animation
  var flyer = null;     // the photo flying between block and sheet
  var closing = false;
  var openCount = 0;    // so a late callback never touches a newer sheet

  deck.classList.add("is-ready");

  cards.forEach(function (card) {
    var more = card.querySelector(".deck-card__more");
    var photoArea = card.querySelector(".deck-card__media");
    if (!more) return;
    more.hidden = false;
    more.addEventListener("click", function () { openSheet(card, more); });
    // Mouse shortcut; keyboard and screen readers use "Lees meer".
    if (photoArea) photoArea.addEventListener("click", function () { openSheet(card, more); });
  });

  forEach.call(sheet.querySelectorAll("[data-sheet-close]"), function (el) {
    el.addEventListener("click", closeSheet);
  });
  // Escape: animate out instead of the instant close.
  sheet.addEventListener("cancel", function (event) {
    event.preventDefault();
    closeSheet();
  });
  // Closed some other way (the browser can force it): tidy up.
  sheet.addEventListener("close", function () {
    if (sheet.open) return;
    if (timeline) timeline.kill();
    removeFlyer();
    cleanup();
  });

  function copyChildren(from, to) {
    to.textContent = "";
    if (!from) return;
    forEach.call(from.children, function (child) {
      to.appendChild(child.cloneNode(true));
    });
  }

  function textOf(card, selector) {
    var el = card.querySelector(selector);
    return el ? el.textContent.trim() : "";
  }

  function fill(card) {
    var accent = card.style.getPropertyValue("--accent");
    if (accent) sheet.style.setProperty("--accent", accent);
    else sheet.style.removeProperty("--accent");

    mainSlot.textContent = "";
    var picture = card.querySelector(".deck-card__photo picture");
    if (picture) {
      var copy = picture.cloneNode(true);
      copy.removeAttribute("style");
      forEach.call(copy.querySelectorAll("source, img"), function (el) {
        if (el.hasAttribute("sizes")) el.setAttribute("sizes", SHEET_SIZES);
        el.removeAttribute("loading");
      });
      mainSlot.appendChild(copy);
    }

    forEach.call(media.querySelectorAll(".trip-sheet__photo--thumb"), function (el) {
      el.parentNode.removeChild(el);
    });
    var gallery = card.querySelector("template.deck-card__gallery");
    if (gallery && gallery.content) media.appendChild(gallery.content.cloneNode(true));

    regionEl.textContent = textOf(card, ".deck-card__region");
    titleEl.textContent = textOf(card, ".deck-card__title");
    copyChildren(card.querySelector(".deck-card__text"), textEl);
    copyChildren(card.querySelector(".deck-card__facts"), factsEl);
    copyChildren(card.querySelector(".deck-card__actions"), actionsEl);
    panel.scrollTop = 0;
  }

  function lockScroll() {
    var gutter = Math.max(0, window.innerWidth - root.clientWidth);
    root.style.setProperty("--sheet-gutter", gutter + "px");
    root.classList.add("sheet-open");
  }

  function unlockScroll() {
    root.classList.remove("sheet-open");
    root.style.removeProperty("--sheet-gutter");
  }

  function openSheet(card, trigger) {
    if (sheet.open || closing) return;
    openCount += 1;
    current = { card: card, trigger: trigger };
    fill(card);
    lockScroll();
    sheet.showModal();
    if (motionOK) animateOpen(card, openCount);
  }

  function closeSheet() {
    if (!sheet.open || closing) return;
    closing = true;
    openCount += 1;
    if (timeline) timeline.kill();
    removeFlyer();
    if (!motionOK || !current) {
      finishClose();
      return;
    }
    var id = openCount;
    animateClose(current.card, id);
    // Never leave the page locked behind the sheet if the animation is
    // held up.
    window.setTimeout(function () {
      if (closing && id === openCount) finishClose();
    }, 1500);
  }

  function finishClose() {
    if (timeline) timeline.kill();
    removeFlyer();
    if (sheet.open) sheet.close();
    cleanup();
  }

  // Safe to call more than once.
  function cleanup() {
    unlockScroll();
    if (current) {
      var photo = current.card.querySelector(".deck-card__photo");
      var trigger = current.trigger;
      current = null;
      if (photo) photo.style.opacity = "";
      if (trigger && document.contains(trigger)) {
        try { trigger.focus({ preventScroll: true }); } catch (error) { trigger.focus(); }
      }
    }
    if (gsap) gsap.set([panel, scrim, mainSlot], { clearProps: "opacity,transform" });
    closing = false;
  }

  /* ------------------------------------------------------------------
     2. Sheet motion: the photo flies between block and sheet
     ------------------------------------------------------------------ */
  function makeFlyer(img, rect) {
    var box = document.createElement("div");
    box.className = "trip-sheet__flyer";
    box.setAttribute("aria-hidden", "true");
    box.style.left = rect.left + "px";
    box.style.top = rect.top + "px";
    box.style.width = rect.width + "px";
    box.style.height = rect.height + "px";
    if (img && (img.currentSrc || img.src)) {
      var copy = document.createElement("img");
      copy.alt = "";
      copy.src = img.currentSrc || img.src;
      copy.className = img.className;
      copy.style.cssText = img.style.cssText;
      box.appendChild(copy);
    }
    // Inside the dialog, so it sits in the top layer above the page.
    sheet.appendChild(box);
    return box;
  }

  function removeFlyer() {
    if (flyer && flyer.parentNode) flyer.parentNode.removeChild(flyer);
    flyer = null;
  }

  // Transform that puts a box sized `to` exactly over the box `from`.
  function flipFrom(from, to) {
    return {
      x: from.left - to.left,
      y: from.top - to.top,
      scaleX: from.width / to.width,
      scaleY: from.height / to.height
    };
  }

  function animateOpen(card, id) {
    var photo = card.querySelector(".deck-card__photo");
    var phone = !wideSheet.matches;
    var from = photo.getBoundingClientRect();
    var to = mainSlot.getBoundingClientRect();
    var words = splitWords(titleEl);
    var pieces = sheet.querySelectorAll(".trip-sheet__region, .trip-sheet__text > *, .trip-sheet__actions");
    var tiles = sheet.querySelectorAll(".trip-sheet__facts > div");
    var thumbs = sheet.querySelectorAll(".trip-sheet__photo--thumb");

    flyer = makeFlyer(photo.querySelector("img"), to);
    gsap.set(photo, { opacity: 0 });
    gsap.set(mainSlot, { opacity: 0 });

    timeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: function () { land(id); }
    });
    timeline
      .fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0)
      .fromTo(panel,
        phone ? { yPercent: 100 } : { opacity: 0, y: 40, scale: 0.97 },
        phone ? { yPercent: 0, duration: 0.6 } : { opacity: 1, y: 0, scale: 1, duration: 0.6 }, 0)
      .fromTo(flyer, flipFrom(from, to), { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.6 }, 0)
      .fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 0.6, stagger: 0.06, clearProps: "transform" }, 0.2)
      .fromTo(pieces, { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, clearProps: "opacity,transform" }, 0.25)
      .fromTo(tiles, { opacity: 0, y: 12, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.04, clearProps: "opacity,transform" }, 0.4)
      .fromTo(thumbs, { opacity: 0, x: 40, rotation: 2 },
        { opacity: 1, x: 0, rotation: 0, duration: 0.6, stagger: 0.08, clearProps: "opacity,transform" }, 0.3);
  }

  // Once the flyer has landed: show the sheet's own (sharper) photo as soon
  // as it is decoded, then fade the flyer away on top of it.
  function land(id) {
    var img = mainSlot.querySelector("img");
    var shown = false;
    function show() {
      if (shown || id !== openCount || !sheet.open) return;
      shown = true;
      gsap.set(mainSlot, { opacity: 1 });
      var landed = flyer;
      flyer = null;
      if (landed) {
        gsap.to(landed, {
          opacity: 0,
          duration: 0.25,
          onComplete: function () { if (landed.parentNode) landed.parentNode.removeChild(landed); }
        });
      }
    }
    if (img && img.decode) img.decode().then(show, show);
    window.setTimeout(show, img && img.decode ? 800 : 0);
  }

  function animateClose(card, id) {
    var photo = card.querySelector(".deck-card__photo");
    var phone = !wideSheet.matches;
    var from = mainSlot.getBoundingClientRect();
    var to = photo.getBoundingClientRect();
    var sheetImg = mainSlot.querySelector("img");
    var cardImg = photo.querySelector("img");

    flyer = makeFlyer(sheetImg && sheetImg.complete && sheetImg.currentSrc ? sheetImg : cardImg, from);
    gsap.set(mainSlot, { opacity: 0 });

    timeline = gsap.timeline({
      defaults: { ease: "power1.inOut" },
      onComplete: function () { if (id === openCount) finishClose(); }
    });
    timeline
      .to(flyer, {
        x: to.left - from.left,
        y: to.top - from.top,
        scaleX: to.width / from.width,
        scaleY: to.height / from.height,
        duration: 0.6
      }, 0)
      .to(panel, phone ? { yPercent: 100, duration: 0.6 } : { opacity: 0, y: 30, scale: 0.98, duration: 0.6 }, 0)
      .to(scrim, { opacity: 0, duration: 0.6 }, 0);
  }

  // Wraps every word of `el` in a mask, so it can slide up into view.
  function splitWords(el) {
    var words = [];
    var parts = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    parts.forEach(function (part, index) {
      if (index) el.appendChild(document.createTextNode(" "));
      var mask = document.createElement("span");
      mask.className = "trip-deck__word";
      var word = document.createElement("span");
      word.textContent = part;
      mask.appendChild(word);
      el.appendChild(mask);
      words.push(word);
    });
    return words;
  }

  /* ------------------------------------------------------------------
     3. Deck motion
     ------------------------------------------------------------------ */
  if (!motionOK) return;

  // After a long frame (images decoding while the page loads) carry on
  // where the motion was instead of jumping ahead: no visible skips.
  gsap.ticker.lagSmoothing(120, 16);

  // One IntersectionObserver per trigger line (see playAt).
  var watchers = {};
  var catchUpTimer = 0;
  var catchUpOnScreen = false;
  var reshaped = null;

  try {
    setupMotion();
    root.classList.add("deck-motion");
    window.addEventListener("scroll", catchUpSoon, { passive: true });
    window.addEventListener("resize", catchUpSoon);
    // The page can still change shape after it has loaded (the main
    // stylesheet does not hold the page up): check again when it does.
    if ("ResizeObserver" in window) {
      reshaped = new ResizeObserver(function () { catchUpSoon(true); });
      reshaped.observe(deck);
    }
    if (document.readyState === "complete") catchUp(true);
    else window.addEventListener("load", function () { catchUp(true); });
  } catch (error) {
    // Something went wrong: show everything as it is, without motion.
    if (window.console) console.error(error);
    motionOK = false;
    Object.keys(watchers).forEach(function (line) { watchers[line].observer.disconnect(); });
    root.classList.remove("deck-motion");
    root.classList.add("deck-still");
    forEach.call(deck.querySelectorAll(".deck-card__curtain, .deck-sheen"), function (el) {
      el.parentNode.removeChild(el);
    });
    try {
      gsap.set(deck.querySelectorAll(".deck-card, .deck-card *, .deck-note, .deck-note *, .deck-group, .deck-group *"),
        { clearProps: "opacity,transform" });
    } catch (ignore) {}
  }

  // All measuring happens first, in one go, before anything is changed:
  // reading layout after writing styles would make the browser lay out the
  // page again and again while it loads.
  function setupMotion() {
    var items = deck.querySelectorAll(".trip-deck__item");
    var group = deck.querySelector(".deck-group");
    var tickets = group ? group.querySelectorAll(".group-ticket") : [];
    var itemColumns = columnsOf(items);
    var ticketColumns = columnsOf(tickets);

    // Blocks in the same row come in one after the other.
    forEach.call(items, function (item, index) {
      var block = item.firstElementChild;
      if (!block) return;
      var offset = itemColumns[index] * 0.08;
      if (block.classList.contains("deck-card")) prepareCard(block, offset);
      else prepareNote(block, offset);
    });
    if (group) prepareGroup(group, tickets, ticketColumns);

    if (finePointer.matches) {
      cards.forEach(tilt);
      forEach.call(deck.querySelectorAll(".group-ticket__shell"), function (shell) {
        var band = addSheen(shell);
        shell.addEventListener("pointerenter", function (event) {
          if (event.pointerType === "mouse") glint(band);
        });
      });
    }
  }

  // Column of each element within its row (same top = same row).
  function columnsOf(els) {
    var seen = {};
    return Array.prototype.map.call(els, function (el) {
      var top = Math.round(el.getBoundingClientRect().top + window.pageYOffset);
      seen[top] = seen[top] === undefined ? 0 : seen[top] + 1;
      return seen[top];
    });
  }

  // Plays the paused `animation` once, when `el` reaches `line` (in % from
  // the top of the screen), so every part moves while it is actually in
  // view instead of while it is still below the screen. What is already on
  // screen when the page opens plays straight away; what is already
  // scrolled past (a link to a trip further down) jumps to the end.
  // `before` (optional) runs first and calls back when the part may start.
  function playAt(el, line, animation, before) {
    var watch = watchers[line];
    if (!watch) {
      watch = watchers[line] = { line: line, parts: new Map() };
      watch.observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var part = watch.parts.get(entry.target);
          if (!part) return;
          var rect = entry.boundingClientRect;
          var firstLook = !part.seen;
          part.seen = true;
          var passed = rect.bottom < 0;
          if (!passed && !entry.isIntersecting && !(firstLook && rect.top < window.innerHeight)) return;
          start(watch, entry.target, passed);
        });
      }, { rootMargin: "0px 0px -" + (100 - line) + "% 0px" });
    }
    watch.parts.set(el, { animation: animation, before: before, seen: false });
    watch.observer.observe(el);
  }

  // Plays the part of `el` (or jumps it to the end when it is scrolled
  // past) and stops watching it. Whatever holds the motion up, the part is
  // fully shown a few seconds later.
  function start(watch, el, passed) {
    var part = watch.parts.get(el);
    if (!part) return;
    watch.parts.delete(el);
    watch.observer.unobserve(el);
    var animation = part.animation;
    if (passed) {
      animation.progress(1);
      return;
    }
    function go() {
      animation.play();
      window.setTimeout(function () {
        if (animation.progress() < 1) animation.progress(1);
      }, 4000);
    }
    if (part.before) part.before(go);
    else go();
  }

  // Safety net for the observers, which can miss a part: when the page
  // jumps straight past it, or when the layout moves after the page opened
  // (stylesheets, fonts and photos arriving). So after a resize and
  // whenever scrolling stops, every part that is past its line plays and
  // every part scrolled past jumps to the end; once the page has loaded or
  // changed shape, everything on screen plays, as on opening. Nothing is
  // measured while the page moves.
  function catchUp(onScreen) {
    var height = window.innerHeight;
    var due = [];
    var waiting = 0;
    Object.keys(watchers).forEach(function (line) {
      var watch = watchers[line];
      var limit = onScreen ? height : height * watch.line / 100;
      watch.parts.forEach(function (part, el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < limit) due.push([watch, el, rect.bottom < 0]);
        else waiting += 1;
      });
    });
    // Measured everything first, now change things.
    due.forEach(function (item) { start(item[0], item[1], item[2]); });
    if (!waiting) {
      window.removeEventListener("scroll", catchUpSoon);
      window.removeEventListener("resize", catchUpSoon);
      if (reshaped) reshaped.disconnect();
    }
  }

  // `onScreen` is true when the page changed shape.
  function catchUpSoon(onScreen) {
    if (onScreen === true) catchUpOnScreen = true;
    window.clearTimeout(catchUpTimer);
    catchUpTimer = window.setTimeout(function () {
      var all = catchUpOnScreen;
      catchUpOnScreen = false;
      catchUp(all);
    }, 200);
  }

  // Calls `go` once `img` is decoded, so a photo never moves while the
  // browser is still busy drawing it; after a short wait it goes anyway.
  function whenDecoded(img, go) {
    var done = false;
    function once() {
      if (done) return;
      done = true;
      go();
    }
    if (img && img.decode) img.decode().then(once, once);
    else once();
    window.setTimeout(once, 600);
  }

  // A slanted band of light inside `host`, hidden until glint() slides it
  // across. It always ends well past the right edge and is hidden again,
  // so it can never stay behind on the glass.
  function addSheen(host) {
    var clip = document.createElement("span");
    clip.className = "deck-sheen";
    clip.setAttribute("aria-hidden", "true");
    var band = document.createElement("span");
    clip.appendChild(band);
    host.appendChild(clip);
    gsap.set(band, { xPercent: -120, autoAlpha: 0 });
    return band;
  }

  function glint(band, tl, at) {
    var from = { xPercent: -120, autoAlpha: 1 };
    var to = {
      xPercent: 300,
      duration: 0.9,
      ease: "power1.inOut",
      onComplete: function () { gsap.set(band, { xPercent: -120, autoAlpha: 0 }); }
    };
    if (tl) {
      // Stays hidden until this point of the timeline is reached.
      to.immediateRender = false;
      tl.fromTo(band, from, to, at);
    } else if (!gsap.isTweening(band)) {
      gsap.fromTo(band, from, to);
    }
  }

  // One sheen per block, shared by the entrance and the hover.
  function sheenOf(card, shell) {
    if (!card.deckSheen) card.deckSheen = addSheen(shell);
    return card.deckSheen;
  }

  // A block in three parts, each when it is in view:
  // 1. the block rises in as it reaches the screen, its photo still under a
  //    layer of snow;
  // 2. once the photo is well in view (and decoded) it is swept free from
  //    left to right, like snow off the ice, while it settles, and the
  //    labels with the price appear;
  // 3. the text follows as it comes into view, ending with a glint of light
  //    over the glass.
  // `offset` staggers the blocks of one row.
  function prepareCard(card, offset) {
    var shell = card.querySelector(".deck-card__shell");
    var photo = card.querySelector(".deck-card__photo");
    var body = card.querySelector(".deck-card__body");
    var picture = photo && photo.querySelector("picture");
    var img = photo && photo.querySelector("img");
    var pills = card.querySelectorAll(".deck-card__incl, .deck-card__price, .deck-card__zoom");
    var bits = card.querySelectorAll(".deck-card__region, .deck-card__title, .deck-card__text, .deck-card__more, .deck-card__facts > div, .deck-card__actions");
    var curtain = null;
    if (photo) {
      curtain = document.createElement("span");
      curtain.className = "deck-card__curtain";
      curtain.setAttribute("aria-hidden", "true");
      photo.appendChild(curtain);
    }
    var band = shell ? sheenOf(card, shell) : null;

    var rise = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
    rise.fromTo(card, { opacity: 0, y: 48, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, clearProps: "transform" }, offset);

    var sweep = gsap.timeline({
      paused: true,
      defaults: { ease: "power2.out" },
      onComplete: function () {
        if (curtain && curtain.parentNode) curtain.parentNode.removeChild(curtain);
      }
    });
    if (curtain) sweep.fromTo(curtain, { xPercent: 0 }, { xPercent: 100, duration: 0.6, ease: "power1.inOut" }, offset);
    if (picture) sweep.fromTo(picture, { scale: 1.1 }, { scale: 1, duration: 1.1 }, offset);
    sweep.fromTo(pills, { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, clearProps: "opacity,transform" }, offset + 0.3);

    var text = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
    text.fromTo(bits, { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, clearProps: "opacity,transform" }, offset);
    if (band) glint(band, text, offset + 0.35);

    playAt(card, 92, rise);
    playAt(photo || card, 72, sweep, function (go) { whenDecoded(img, go); });
    playAt(body || card, 88, text);
  }

  // The intro tile rises in with its row; its text (at the bottom of the
  // tile) follows when it is in view.
  function prepareNote(note, offset) {
    var words = note.querySelector("p");
    var band = addSheen(note);
    var rise = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
    rise.fromTo(note, { opacity: 0, y: 48, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, clearProps: "transform" }, offset);
    var text = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
    text.fromTo(words, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, clearProps: "opacity,transform" }, offset);
    glint(band, text, offset + 0.35);
    playAt(note, 92, rise);
    playAt(words || note, 85, text);
  }

  // The dark panel rises in as it reaches the screen. Each ticket follows
  // when it comes into view, and once its dates are well in view they flip
  // down like a desk calendar.
  function prepareGroup(group, tickets, columns) {
    var headBits = group.querySelectorAll(".deck-group__head > *");
    var panelRise = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
    panelRise
      .fromTo(group, { opacity: 0, y: 40, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, clearProps: "transform" }, 0)
      .fromTo(headBits, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, clearProps: "opacity,transform" }, 0.1);
    playAt(group, 92, panelRise);

    forEach.call(tickets, function (ticket, index) {
      var offset = columns[index] * 0.1;
      var dates = ticket.querySelector(".group-ticket__dates");

      var rise = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
      rise.fromTo(ticket, { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.6, clearProps: "opacity,transform" }, 0.15 + offset);

      var flip = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
      flip.fromTo(ticket.querySelectorAll(".date-chip"),
        { opacity: 0, rotationX: -90, transformPerspective: 400, transformOrigin: "50% 0%" },
        { opacity: 1, rotationX: 0, duration: 0.6, stagger: 0.1, clearProps: "opacity,transform" }, offset);

      playAt(ticket, 92, rise);
      playAt(dates || ticket, 80, flip);
    });
  }

  // Mouse only: the block leans towards the pointer, lifts a little, the
  // photo shifts the other way, a soft light follows the pointer and a
  // glint slides over the glass.
  function tilt(card) {
    var shell = card.querySelector(".deck-card__shell");
    var picture = card.querySelector(".deck-card__photo picture");
    if (!shell) return;

    var glare = document.createElement("span");
    glare.className = "deck-card__glare";
    glare.setAttribute("aria-hidden", "true");
    var spot = document.createElement("span");
    glare.appendChild(spot);
    shell.appendChild(glare);
    var band = sheenOf(card, shell);

    gsap.set(shell, { transformPerspective: 1000 });
    var ease = { duration: 0.6, ease: "power2.out" };
    var fast = { duration: 0.25, ease: "power2.out" };
    var rotateX = gsap.quickTo(shell, "rotationX", ease);
    var rotateY = gsap.quickTo(shell, "rotationY", ease);
    var lift = gsap.quickTo(shell, "y", ease);
    var spotX = gsap.quickTo(spot, "x", fast);
    var spotY = gsap.quickTo(spot, "y", fast);
    var photoX = picture ? gsap.quickTo(picture, "x", ease) : null;
    var photoY = picture ? gsap.quickTo(picture, "y", ease) : null;

    card.addEventListener("pointerenter", function (event) {
      if (event.pointerType !== "mouse") return;
      lift(-6);
      gsap.to(glare, { opacity: 1, duration: 0.25, overwrite: true });
      glint(band);
    });
    card.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse") return;
      // The block itself is never transformed after its entrance, so its
      // box is the untilted shape.
      var rect = card.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      var px = x / rect.width - 0.5;
      var py = y / rect.height - 0.5;
      rotateY(px * 6);
      rotateX(py * -5);
      spotX(x);
      spotY(y);
      if (photoX) {
        photoX(px * -8);
        photoY(py * -6);
      }
    });
    card.addEventListener("pointerleave", function () {
      rotateX(0);
      rotateY(0);
      lift(0);
      if (photoX) {
        photoX(0);
        photoY(0);
      }
      gsap.to(glare, { opacity: 0, duration: 0.6, overwrite: true });
    });
  }
})();
