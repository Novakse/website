/* Google reviews on the homepage (#reviews, index.html).
   Long review texts are cut to four lines in CSS; this adds a "Lees meer"
   button to the ones that are actually cut. Without this script the texts
   show in full. */
(function () {
  var section = document.getElementById("reviews");
  if (!section) return;

  /* One button per text, hidden while the text fits. */
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

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(checkTexts, 150);
  });
  checkTexts();
  /* Line breaks change once the web fonts are in. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(checkTexts);
})();
