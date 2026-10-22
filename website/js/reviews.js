/* Google reviews on the homepage (#reviews, index.html).
   - Long review texts are cut to a few lines in CSS; this adds a
     "Lees meer" button to the ones that are actually cut.
   - Previous/next buttons for the row of reviews (only shown on screens
     with a mouse, see css/styles.css; on touch screens you swipe).
   Without this script the texts show in full and the row still scrolls. */
(function () {
  var section = document.getElementById("reviews");
  if (!section) return;
  var list = section.querySelector(".reviews__list");
  if (!list) return;

  /* "Lees meer": one button per text, hidden while the text fits. */
  var quotes = Array.prototype.slice.call(section.querySelectorAll(".review__quote"));
  var buttons = quotes.map(function (quote) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "review__more";
    button.textContent = "Lees meer";
    button.setAttribute("aria-expanded", "false");
    button.hidden = true;
    quote.parentNode.insertBefore(button, quote.nextSibling);
    button.addEventListener("click", function () {
      var open = quote.classList.toggle("is-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.textContent = open ? "Lees minder" : "Lees meer";
    });
    return button;
  });
  function checkTexts() {
    quotes.forEach(function (quote, i) {
      if (quote.classList.contains("is-open")) return;
      var text = quote.querySelector("p");
      buttons[i].hidden = !text || text.scrollHeight <= text.clientHeight + 1;
    });
  }

  /* Previous / next: move by one card. */
  var prev = section.querySelector(".reviews__nav--prev");
  var next = section.querySelector(".reviews__nav--next");
  var smooth = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function step() {
    var item = list.querySelector(".reviews__item");
    var gap = parseFloat(window.getComputedStyle(list).columnGap) || 0;
    return item ? item.getBoundingClientRect().width + gap : list.clientWidth;
  }
  function move(direction) {
    list.scrollBy({ left: direction * step(), behavior: smooth ? "smooth" : "auto" });
  }
  function updateNav() {
    if (!prev || !next) return;
    var max = list.scrollWidth - list.clientWidth;
    var scrolls = max > 2;
    prev.hidden = next.hidden = !scrolls;
    prev.disabled = !scrolls || list.scrollLeft <= 2;
    next.disabled = !scrolls || list.scrollLeft >= max - 2;
  }
  if (prev && next) {
    prev.addEventListener("click", function () { move(-1); });
    next.addEventListener("click", function () { move(1); });
    list.addEventListener("scroll", updateNav, { passive: true });
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () { checkTexts(); updateNav(); }, 150);
  });
  checkTexts();
  updateNav();
  /* Line breaks change once the web fonts are in. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { checkTexts(); updateNav(); });
  }
})();
