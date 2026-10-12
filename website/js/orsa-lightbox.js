/* ==========================================================================
   Orsa - photo lightbox for the cabin mosaic (#huisjes, orsa.html in all
   languages)

   Every photo inside [data-lightbox] is wrapped in a real <button>; it opens
   that photo larger in a modal <dialog>. Without this script (or without
   <dialog> support) the mosaic stays exactly as it is, only not clickable.
   - The large photo is the biggest file already listed in each <picture>
     (avif/webp/jpg, about 630px wide, never scaled up). It is only fetched
     when the dialog shows it.
   - Keyboard: Left/Right step through the photos (Home/End: first/last),
     Escape closes, Tab stays inside the dialog. Focus moves to the close
     button on open and back to the photo on screen when it closes.
   - A click or tap next to the photo closes; swipe left/right on touch.
   - No visible captions (on purpose): the alt text of each photo is reused
     in the dialog, in the button label and in a hidden live message.
   - Texts come from data-label-* on [data-lightbox], so every language page
     sets its own; a missing attribute falls back to the Dutch text:
       data-label-open   button label, followed by ": " + alt text
                         ("Vergroot foto")
       data-label-close  close button ("Sluiten")
       data-label-prev   previous button ("Vorige foto")
       data-label-next   next button ("Volgende foto")
       data-label-count  position for screen readers, with {n} and {total}
                         ("Foto {n} van {total}")
     The dialog is named after the section heading.
   Styles: "Lightbox" in css/orsa.css.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-lightbox]");
  if (!root) return;
  if (typeof HTMLDialogElement !== "function" || typeof HTMLDialogElement.prototype.showModal !== "function") return;

  var pictures = Array.prototype.slice.call(root.querySelectorAll("picture"));
  if (!pictures.length) return;

  /* --- Texts -------------------------------------------------------------- */
  function text(key, fallback) {
    var value = root.getAttribute("data-label-" + key);
    return value ? value : fallback;
  }
  var TEXT = {
    open: text("open", "Vergroot foto"),
    close: text("close", "Sluiten"),
    prev: text("prev", "Vorige foto"),
    next: text("next", "Volgende foto"),
    count: text("count", "Foto {n} van {total}")
  };

  function svg(path) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
      '<path d="' + path + '" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  var ICON = {
    zoom: svg("M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5"),
    close: svg("M6 6l12 12M18 6L6 18"),
    prev: svg("M15 5l-7 7 7 7"),
    next: svg("M9 5l7 7-7 7")
  };

  var motion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function calm() { return !!(motion && motion.matches); }

  // The largest candidate of a srcset ("a-480.jpg 480w, a.jpg 633w" -> "a.jpg").
  function largest(srcset, fallback) {
    var best = null;
    (srcset || "").split(",").forEach(function (part) {
      var bits = part.trim().split(/\s+/);
      if (!bits[0]) return;
      var width = parseInt(bits[1], 10) || 0;
      if (!best || width > best.width) best = { url: bits[0], width: width };
    });
    return best ? best.url : fallback;
  }

  /* --- Photos: wrap each <picture> in a button ---------------------------- */
  var photos = pictures.map(function (picture, index) {
    var img = picture.querySelector("img");
    var alt = img ? img.getAttribute("alt") || "" : "";
    var sources = Array.prototype.map.call(picture.querySelectorAll("source"), function (source) {
      return { type: source.getAttribute("type"), url: largest(source.getAttribute("srcset"), "") };
    }).filter(function (source) { return source.url; });

    var button = document.createElement("button");
    button.type = "button";
    button.className = "lightbox-trigger";
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-label", alt ? TEXT.open + ": " + alt : TEXT.open);
    picture.parentNode.insertBefore(button, picture);
    button.appendChild(picture);
    button.insertAdjacentHTML("beforeend", '<span class="lightbox-trigger__hint" aria-hidden="true">' + ICON.zoom + "</span>");
    button.addEventListener("click", function () { open(index); });

    return {
      button: button,
      alt: alt,
      sources: sources,
      src: img ? largest(img.getAttribute("srcset"), img.getAttribute("src")) : "",
      width: img ? img.getAttribute("width") : null,
      height: img ? img.getAttribute("height") : null
    };
  });
  var total = photos.length;

  /* --- The dialog --------------------------------------------------------- */
  var section = root.closest("[aria-labelledby]");
  var heading = section ? document.getElementById(section.getAttribute("aria-labelledby")) : null;

  var dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("tabindex", "-1"); // a click on an empty spot keeps focus inside
  if (heading) dialog.setAttribute("aria-label", heading.textContent.trim());
  dialog.innerHTML =
    '<div class="lightbox__bar">' +
      '<p class="lightbox__count" aria-hidden="true"></p>' +
      '<button type="button" class="lightbox__btn lightbox__btn--close">' + ICON.close + "</button>" +
    "</div>" +
    '<div class="lightbox__stage"></div>' +
    '<button type="button" class="lightbox__btn lightbox__btn--prev">' + ICON.prev + "</button>" +
    '<button type="button" class="lightbox__btn lightbox__btn--next">' + ICON.next + "</button>" +
    '<p class="lightbox__live sr-only" aria-live="polite"></p>';
  document.body.appendChild(dialog);

  var stage = dialog.querySelector(".lightbox__stage");
  var count = dialog.querySelector(".lightbox__count");
  var live = dialog.querySelector(".lightbox__live");
  var closeBtn = dialog.querySelector(".lightbox__btn--close");
  var prevBtn = dialog.querySelector(".lightbox__btn--prev");
  var nextBtn = dialog.querySelector(".lightbox__btn--next");
  closeBtn.setAttribute("aria-label", TEXT.close);
  prevBtn.setAttribute("aria-label", TEXT.prev);
  nextBtn.setAttribute("aria-label", TEXT.next);

  var current = 0;
  var token = 0;
  var closing = false;

  /* Shows photo `index` (wraps around). `step` (-1, 0, 1) sets the side the
     photo slides in from. The <picture> is built here, so the large file is
     only requested now; sources go in before the src, so avif/webp win. */
  function show(index, step) {
    current = (index + total) % total;
    var photo = photos[current];
    var mine = ++token;

    var picture = document.createElement("picture");
    photo.sources.forEach(function (item) {
      var source = document.createElement("source");
      if (item.type) source.type = item.type;
      source.srcset = item.url;
      picture.appendChild(source);
    });
    var img = document.createElement("img");
    img.className = "lightbox__img is-loading";
    img.alt = photo.alt;
    if (photo.width) img.setAttribute("width", photo.width);
    if (photo.height) img.setAttribute("height", photo.height);
    img.decoding = "async";
    img.style.setProperty("--lightbox-step", String(step || 0));
    picture.appendChild(img);

    function ready() {
      if (mine !== token) return;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { img.classList.remove("is-loading"); });
      });
    }
    img.addEventListener("load", ready);
    img.addEventListener("error", ready);
    img.src = photo.src;

    stage.textContent = "";
    stage.appendChild(picture);

    count.textContent = (current + 1) + " / " + total;
    live.textContent = TEXT.count.replace("{n}", current + 1).replace("{total}", total) +
      (photo.alt ? ": " + photo.alt : "");
  }

  function open(index) {
    if (dialog.open) return;
    closing = false;
    show(index, 0);
    document.documentElement.classList.add("lightbox-open");
    dialog.showModal();
    closeBtn.focus();
    void dialog.offsetWidth; // start from the closed state, so the fade runs
    dialog.classList.add("is-open");
  }

  // Fades out, then closes; the "close" event below tidies up.
  function close() {
    if (!dialog.open || closing) return;
    closing = true;
    dialog.classList.remove("is-open");
    if (calm()) { dialog.close(); return; }
    var done = false;
    function end(event) {
      if (done || (event && event.target !== dialog)) return;
      done = true;
      dialog.removeEventListener("transitionend", end);
      if (dialog.open) dialog.close();
    }
    dialog.addEventListener("transitionend", end);
    window.setTimeout(end, 400);
  }

  dialog.addEventListener("close", function () {
    closing = false;
    token++;
    dialog.classList.remove("is-open");
    document.documentElement.classList.remove("lightbox-open");
    stage.textContent = "";
    live.textContent = "";
    photos[current].button.focus();
  });

  // Escape: the browser's own cancel would close at once; fade out instead.
  dialog.addEventListener("cancel", function (event) {
    event.preventDefault();
    close();
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", function () { if (!closing) show(current - 1, -1); });
  nextBtn.addEventListener("click", function () { if (!closing) show(current + 1, 1); });

  // A click next to the photo (not on it, not on a button) closes.
  dialog.addEventListener("click", function (event) {
    if (closing || event.target.closest("button, img")) return;
    close();
  });

  /* --- Keyboard ----------------------------------------------------------- */
  function trapTab(event) {
    var items = [closeBtn, prevBtn, nextBtn].filter(function (el) { return el.getClientRects().length > 0; });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    var active = document.activeElement;
    var inside = items.indexOf(active) !== -1;
    if (event.shiftKey && (active === first || !inside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !inside)) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener("keydown", function (event) {
    if (!dialog.open) return;
    if (event.key === "Tab") { trapTab(event); return; }
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (closing || event.altKey || event.ctrlKey || event.metaKey) return;
    var to = null;
    var step = 0;
    if (event.key === "ArrowLeft") { to = current - 1; step = -1; }
    else if (event.key === "ArrowRight") { to = current + 1; step = 1; }
    else if (event.key === "Home") { to = 0; step = -1; }
    else if (event.key === "End") { to = total - 1; step = 1; }
    if (to === null) return;
    event.preventDefault();
    show(to, step);
  });

  /* --- Swipe -------------------------------------------------------------- */
  var touch = null;
  dialog.addEventListener("touchstart", function (event) {
    var zoomed = window.visualViewport && window.visualViewport.scale > 1.01;
    touch = event.touches.length === 1 && !zoomed
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
      : null;
  }, { passive: true });
  dialog.addEventListener("touchend", function (event) {
    if (!touch || closing) return;
    var point = event.changedTouches[0];
    var dx = point.clientX - touch.x;
    var dy = point.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    show(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  }, { passive: true });
})();
