/* ==========================================================================
   Reizen overview (reizen.html): the trip deck.

   The top panel (heading, rating, photo, trip search), every package trip
   as a glass block in a grid and the group trips below them (styles in the
   <style data-deck-css> block of reizen.html; the top panel's entrance is
   plain CSS, so it plays without waiting for this script). This script:
   1. folds each block to its first paragraph and two facts, and lets
      "Lees meer" (or a click on the photo) open the whole trip in a sheet;
   2. adds the motion: blocks rise in row by row while their photo is swept
      free, the prices roll into place like a counter and a glint of light
      slides over the glass; blocks tilt towards the mouse; the group trips'
      dates flip in like a desk calendar; the photo flies from the block
      into the sheet and back; on laptops the top photo drifts slowly.

   Motion uses GSAP + ScrollTrigger (js/vendor) and follows
   MOTION-GUIDELINES.md: transform and opacity only, no scroll-linked motion
   on phones, nothing at all with prefers-reduced-motion. Without GSAP the
   blocks and the sheet still work, just without motion. Without this script
   every block shows its full text and facts.
   ========================================================================== */
(function () {
  "use strict";

  var deck = document.querySelector("section[data-trip-deck]");
  if (!deck) return;

  var root = document.documentElement;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var wideSheet = window.matchMedia("(min-width: 56rem)");
  var motionOK = !!(gsap && ScrollTrigger) && !reducedMotion.matches;

  // The CSS keeps the blocks hidden until one of these classes is set.
  root.classList.add(motionOK ? "deck-motion" : "deck-still");

  var sheet = document.getElementById("tripSheet");
  // No <dialog> support: keep the full blocks, as without JavaScript.
  if (!sheet || typeof sheet.showModal !== "function") return;

  var cards = Array.prototype.slice.call(deck.querySelectorAll(".deck-card"));
  var forEach = Array.prototype.forEach;

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

  var animated = [];
  try {
    setupMotion();
  } catch (error) {
    // Something went wrong: show everything as it is, without motion.
    motionOK = false;
    root.classList.remove("deck-motion");
    root.classList.add("deck-still");
    forEach.call(deck.querySelectorAll(".deck-card__curtain"), function (el) {
      el.parentNode.removeChild(el);
    });
    try { gsap.set(animated, { clearProps: "opacity,transform" }); } catch (ignore) {}
  }

  function setupMotion() {
    gsap.registerPlugin(ScrollTrigger);

    // Blocks in the same row come in one after the other.
    var columnOf = {};
    forEach.call(deck.querySelectorAll(".trip-deck__item"), function (item) {
      var block = item.firstElementChild;
      if (!block) return;
      var top = Math.round(item.getBoundingClientRect().top + window.pageYOffset);
      columnOf[top] = columnOf[top] === undefined ? 0 : columnOf[top] + 1;
      var delay = columnOf[top] * 0.12;
      animated.push(block);
      onFirstView(block, function (passed) {
        var wait = passed ? 0 : delay;
        return block.classList.contains("deck-card") ? revealCard(block, wait) : revealNote(block, wait);
      });
    });

    var group = deck.querySelector(".deck-group");
    if (group) {
      animated.push(group);
      onFirstView(group, function () { return revealGroup(group); });
    }

    if (finePointer.matches) {
      cards.forEach(tilt);
      forEach.call(deck.querySelectorAll(".group-ticket__shell"), function (shell) {
        var band = addSheen(shell);
        shell.addEventListener("pointerenter", function (event) {
          if (event.pointerType === "mouse" && !gsap.isTweening(band)) glint(band);
        });
      });
    }

    // Laptops and desktops only: the top photo drifts down a little inside
    // its frame as the page scrolls, and the deck's backdrop slowly settles
    // (scrubbed, one element each). Not on phones, where scroll-linked
    // motion made scrolling stutter before.
    gsap.matchMedia().add("(min-width: 64rem) and (hover: hover) and (pointer: fine)", function () {
      var topPhoto = deck.querySelector(".deck-top__photo picture");
      if (topPhoto) {
        gsap.fromTo(topPhoto, { yPercent: 0 }, {
          yPercent: 7,
          ease: "none",
          scrollTrigger: { trigger: topPhoto.parentNode, start: "clamp(top bottom)", end: "bottom top", scrub: 0.6 }
        });
      }
      var backdrop = deck.querySelector(".trip-deck__backdrop img");
      if (backdrop) {
        gsap.fromTo(backdrop, { scale: 1.22 }, {
          scale: 1.04,
          ease: "none",
          scrollTrigger: { trigger: deck, start: "top bottom", end: "bottom top", scrub: 0.6 }
        });
      }
    });
  }

  // Runs `play` once, when the element first comes into view. Elements that
  // are already in view, or already scrolled past (a link to a trip further
  // down), play straight away; scrolled-past ones jump to the end.
  function onFirstView(el, play) {
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      var passed = rect.bottom < 0;
      var animation = play(passed);
      if (passed && animation) animation.progress(1);
      return;
    }
    ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: function () { play(false); }
    });
  }

  // A slanted band of light inside `host`; glint() slides it across.
  function addSheen(host) {
    var clip = document.createElement("span");
    clip.className = "deck-sheen";
    clip.setAttribute("aria-hidden", "true");
    var band = document.createElement("span");
    clip.appendChild(band);
    host.appendChild(clip);
    gsap.set(band, { xPercent: -160, skewX: -14 });
    return band;
  }

  function glint(band, tl, at) {
    var from = { xPercent: -160 };
    var to = { xPercent: 330, duration: 1.1, ease: "power1.inOut" };
    if (tl) tl.fromTo(band, from, to, at);
    else gsap.fromTo(band, from, to);
  }

  // Replaces the digits in `el` with rolling reels (0 to 9, twice). The
  // real text stays for screen readers and comes back once they land.
  function makeCounter(el) {
    var reels = [];
    var swaps = [];
    var nodes = [];
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
      var node = walker.currentNode;
      var inSmall = node.parentNode && node.parentNode.closest && node.parentNode.closest("small");
      if (/\d/.test(node.nodeValue) && !inSmall) nodes.push(node);
    }
    nodes.forEach(function (node) {
      var original = node.nodeValue;
      var text = original.trim();
      var counter = document.createElement("span");
      counter.className = "odo";
      var said = document.createElement("span");
      said.className = "sr-only";
      said.textContent = text;
      var face = document.createElement("span");
      face.className = "odo__face";
      face.setAttribute("aria-hidden", "true");
      text.split("").forEach(function (ch) {
        if (/\d/.test(ch)) {
          var win = document.createElement("span");
          win.className = "odo__digit";
          var reel = document.createElement("span");
          reel.className = "odo__reel";
          for (var i = 0; i < 20; i++) {
            var digit = document.createElement("span");
            digit.textContent = String(i % 10);
            reel.appendChild(digit);
          }
          win.appendChild(reel);
          face.appendChild(win);
          reels.push({ reel: reel, digit: Number(ch) });
        } else {
          var char = document.createElement("span");
          char.className = "odo__char";
          char.textContent = ch === " " ? " " : ch;
          face.appendChild(char);
        }
      });
      counter.appendChild(said);
      counter.appendChild(face);
      node.parentNode.replaceChild(counter, node);
      swaps.push([counter, document.createTextNode(original)]);
    });
    return {
      roll: function (tl, at) {
        reels.forEach(function (item, index) {
          tl.fromTo(item.reel, { yPercent: 0 },
            { yPercent: -(10 + item.digit) * 5, duration: 1.1, ease: "power2.out" }, at + index * 0.08);
        });
      },
      restore: function () {
        swaps.forEach(function (pair) {
          if (pair[0].parentNode) pair[0].parentNode.replaceChild(pair[1], pair[0]);
        });
      }
    };
  }

  // A block rises in with a slight backwards tilt, the photo is swept free
  // from left to right (like snow off the ice) while it zooms out, the
  // labels and text follow, the price rolls into place and a glint of light
  // slides over the glass.
  function revealCard(card, delay) {
    var shell = card.querySelector(".deck-card__shell");
    var photo = card.querySelector(".deck-card__photo");
    var picture = photo && photo.querySelector("picture");
    var price = card.querySelector(".deck-card__price");
    var pills = card.querySelectorAll(".deck-card__incl, .deck-card__price, .deck-card__zoom");
    var bits = card.querySelectorAll(".deck-card__region, .deck-card__title, .deck-card__text, .deck-card__more, .deck-card__facts > div, .deck-card__actions");
    var curtain = null;
    if (photo) {
      curtain = document.createElement("span");
      curtain.className = "deck-card__curtain";
      curtain.setAttribute("aria-hidden", "true");
      photo.appendChild(curtain);
    }
    var counter = price ? makeCounter(price) : null;
    var band = shell ? sheenOf(card, shell) : null;

    var tl = gsap.timeline({
      delay: delay,
      defaults: { ease: "power2.out" },
      onComplete: function () {
        if (curtain && curtain.parentNode) curtain.parentNode.removeChild(curtain);
        if (counter) counter.restore();
      }
    });
    tl.fromTo(card,
      { opacity: 0, y: 80, rotationX: 16, scale: 0.95, transformPerspective: 1200, transformOrigin: "50% 100%" },
      { opacity: 1, y: 0, rotationX: 0, scale: 1, duration: 1.1, clearProps: "transform" }, 0);
    if (curtain) tl.fromTo(curtain, { xPercent: 0 }, { xPercent: 100, duration: 1.1, ease: "power1.inOut" }, 0.2);
    if (picture) tl.fromTo(picture, { scale: 1.22 }, { scale: 1, duration: 1.1 }, 0.2);
    tl.fromTo(bits, { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, clearProps: "opacity,transform" }, 0.35);
    tl.fromTo(pills, { opacity: 0, y: 10, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.06, clearProps: "opacity,transform" }, 0.7);
    if (counter) counter.roll(tl, 0.75);
    if (band) glint(band, tl, 1.1);
    return tl;
  }

  // One sheen per block, shared by the entrance and the hover.
  function sheenOf(card, shell) {
    if (!card.deckSheen) card.deckSheen = addSheen(shell);
    return card.deckSheen;
  }

  function revealNote(note, delay) {
    var band = addSheen(note);
    var tl = gsap.timeline({ delay: delay, defaults: { ease: "power2.out" } });
    tl.fromTo(note, { opacity: 0, y: 80, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1.1, clearProps: "transform" }, 0)
      .fromTo(note.querySelector("p"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, clearProps: "opacity,transform" }, 0.4);
    glint(band, tl, 0.9);
    return tl;
  }

  // The dark panel rises in, then its tickets; the dates flip down like a
  // desk calendar and the price rolls into place.
  function revealGroup(group) {
    var headBits = group.querySelectorAll(".deck-group__head > *");
    var tickets = Array.prototype.slice.call(group.querySelectorAll(".group-ticket"));
    var restores = [];
    var tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: function () { restores.forEach(function (restore) { restore(); }); }
    });
    tl.fromTo(group, { opacity: 0, y: 60, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 1.1, clearProps: "transform" }, 0)
      .fromTo(headBits, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, clearProps: "opacity,transform" }, 0.2)
      .fromTo(tickets, { opacity: 0, y: 48, rotationX: 10, transformPerspective: 1000, transformOrigin: "50% 100%" },
        { opacity: 1, y: 0, rotationX: 0, duration: 1.1, stagger: 0.14, clearProps: "opacity,transform" }, 0.25);
    tickets.forEach(function (ticket, index) {
      var at = 0.7 + index * 0.14;
      tl.fromTo(ticket.querySelectorAll(".date-chip"),
        { opacity: 0, rotationX: -90, transformPerspective: 400, transformOrigin: "50% 0%" },
        { opacity: 1, rotationX: 0, duration: 0.6, stagger: 0.12, clearProps: "opacity,transform" }, at);
      var amount = ticket.querySelector(".group-ticket__amount");
      if (amount) {
        var counter = makeCounter(amount);
        counter.roll(tl, at + 0.1);
        restores.push(counter.restore);
      }
    });
    return tl;
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
      if (!gsap.isTweening(band)) glint(band);
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
