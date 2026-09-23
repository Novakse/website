/* ==========================================================================
   Reiszoeker - de balk met bestemming, periode en aantal reizigers

   Dit is bewust geen zoekmachine: Novakse heeft geen live beschikbaarheid.
   De balk verzamelt drie keuzes en brengt de bezoeker naar de pagina van de
   bestemming, op het blok waar hij verder boekt. De keuzes gaan mee in het
   webadres (reis, van, tot, personen), zodat de kalender daar al goed staat.

   Zonder JavaScript blijft het een gewoon GET-formulier met een keuzelijst,
   twee datumvelden en een getalveld; het gaat dan naar boeken.html. Zodra dit
   bestand draait, worden de twee datumvelden verborgen en vervangen door een
   knop met een kalender van twee maanden.

   WAT JOEY BIJWERKT: het seizoen staat in de HTML op het formulier zelf, in
   data-season-start en data-season-end. Hier hoeft niets gewijzigd te worden.
   ========================================================================== */
(function () {
  "use strict";

  var DAY = 86400000;

  var MONTHS = ["januari", "februari", "maart", "april", "mei", "juni",
    "juli", "augustus", "september", "oktober", "november", "december"];
  var SHORT_MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun",
    "jul", "aug", "sep", "okt", "nov", "dec"];
  var DAY_HEADS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

  var T = {
    trigger: "Kies je datums",
    dialogLabel: "Kies je aankomst- en vertrekdag",
    hintStart: "Kies je aankomstdag.",
    hintEnd: "Kies nu je vertrekdag.",
    nights: function (n) { return n + (n === 1 ? " nacht" : " nachten"); },
    prev: "Vorige maand",
    next: "Volgende maand",
    clear: "Selectie wissen",
    apply: "Datums toepassen",
    outside: "Buiten het schaatsseizoen"
  };

  /* --- Datumhulpjes ------------------------------------------------------ */
  function parseDate(text) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text || "")) return null;
    var p = text.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d) ? null : d;
  }
  function toText(date) {
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return date.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
  }
  function sameDay(a, b) { return a && b && a.getTime() === b.getTime(); }
  function addDays(date, n) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + n);
    return d;
  }
  function addMonths(date, n) {
    var d = new Date(date.getFullYear(), date.getMonth() + n, 1);
    return d;
  }
  function monthKey(date) { return date.getFullYear() * 12 + date.getMonth(); }
  function nightsBetween(from, to) { return Math.round((to - from) / DAY); }
  function shortDate(date) { return date.getDate() + " " + SHORT_MONTHS[date.getMonth()]; }
  function longDate(date) { return date.getDate() + " " + MONTHS[date.getMonth()] + " " + date.getFullYear(); }

  /* ======================================================================
     De kalender in de balk
     ====================================================================== */
  function buildCalendar(form, seasonStart, seasonEnd, inputFrom, inputTo, nativeFields) {
    var field = document.createElement("div");
    field.className = "trip-search__field trip-search__field--when";

    var labelId = "tsWhenLabel";
    var valueId = "tsWhenValue";
    field.innerHTML =
      '<span class="trip-search__label" id="' + labelId + '">Wanneer</span>' +
      '<div class="trip-search__control">' +
        '<svg class="trip-search__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/>' +
        '</svg>' +
        '<button type="button" class="trip-search__trigger" aria-haspopup="dialog" aria-expanded="false">' +
          '<span class="trip-search__value" id="' + valueId + '">' + T.trigger + '</span>' +
        '</button>' +
      '</div>' +
      '<div class="trip-cal" role="dialog" aria-modal="false" aria-label="' + T.dialogLabel + '" hidden>' +
        '<div class="trip-cal__nav">' +
          '<button type="button" class="trip-cal__arrow" data-step="-1" aria-label="' + T.prev + '">' +
            '<svg viewBox="0 0 12 18" aria-hidden="true"><path d="M9.5 1L2 9l7.5 8"/></svg>' +
          '</button>' +
          '<div class="trip-cal__titles"></div>' +
          '<button type="button" class="trip-cal__arrow" data-step="1" aria-label="' + T.next + '">' +
            '<svg viewBox="0 0 12 18" aria-hidden="true"><path d="M2.5 1L10 9l-7.5 8"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="trip-cal__months"></div>' +
        '<p class="trip-cal__hint" role="status"></p>' +
        '<div class="trip-cal__foot">' +
          '<button type="button" class="trip-cal__clear">' + T.clear + '</button>' +
          '<button type="button" class="trip-cal__apply">' + T.apply + '</button>' +
        '</div>' +
      '</div>';

    nativeFields[0].parentNode.insertBefore(field, nativeFields[0]);

    var trigger = field.querySelector(".trip-search__trigger");
    var valueText = field.querySelector(".trip-search__value");
    var panel = field.querySelector(".trip-cal");
    var titles = panel.querySelector(".trip-cal__titles");
    var monthsBox = panel.querySelector(".trip-cal__months");
    var hint = panel.querySelector(".trip-cal__hint");
    var clearBtn = panel.querySelector(".trip-cal__clear");
    var applyBtn = panel.querySelector(".trip-cal__apply");
    var arrows = panel.querySelectorAll(".trip-cal__arrow");

    trigger.setAttribute("aria-labelledby", labelId + " " + valueId);

    /* De keuze in de kalender staat los van de keuze in het formulier: pas op
       "Datums toepassen" gaat hij mee. Zo kan de bezoeker rondkijken zonder
       zijn eerdere keuze kwijt te raken. */
    var from = parseDate(inputFrom.value);
    var to = parseDate(inputTo.value);
    var hover = null;
    var firstMonth = new Date(seasonStart.getFullYear(), seasonStart.getMonth(), 1);
    var lastMonth = new Date(seasonEnd.getFullYear(), seasonEnd.getMonth(), 1);
    var view = new Date(firstMonth.getTime());
    var wide = window.matchMedia("(min-width: 52rem)");
    var focusDate = null;

    function monthCount() { return wide.matches ? 2 : 1; }

    function maxView() {
      var back = monthCount() - 1;
      var limit = addMonths(lastMonth, -back);
      return limit < firstMonth ? firstMonth : limit;
    }

    function clampView() {
      if (view < firstMonth) view = new Date(firstMonth.getTime());
      if (view > maxView()) view = maxView();
    }

    function inSeason(date) { return date >= seasonStart && date <= seasonEnd; }

    /* --- Tekenen --------------------------------------------------------- */
    function drawTitles() {
      titles.innerHTML = "";
      for (var i = 0; i < monthCount(); i++) {
        var m = addMonths(view, i);
        var span = document.createElement("span");
        span.className = "trip-cal__title";
        span.textContent = MONTHS[m.getMonth()] + " " + m.getFullYear();
        titles.appendChild(span);
      }
      arrows[0].disabled = view <= firstMonth;
      arrows[1].disabled = view >= maxView();
    }

    /* Bij elk opnieuw tekenen worden de dagknoppen vervangen. Stond de focus op
       een dag, dan zou die verdwijnen; daarom zetten we hem terug. */
    function drawMonths() {
      var hadFocus = monthsBox.contains(document.activeElement);
      monthsBox.innerHTML = "";
      for (var i = 0; i < monthCount(); i++) {
        monthsBox.appendChild(drawMonth(addMonths(view, i)));
      }
      if (hadFocus) focusDay();
    }

    function focusDay() {
      if (!focusDate) return;
      var cell = panel.querySelector('[data-date="' + toText(focusDate) + '"]:not([disabled])');
      if (cell) cell.focus();
    }

    function drawMonth(month) {
      var box = document.createElement("div");
      box.className = "trip-cal__month";

      var grid = document.createElement("div");
      grid.className = "trip-cal__grid";
      DAY_HEADS.forEach(function (name) {
        var head = document.createElement("span");
        head.className = "trip-cal__dayname";
        head.setAttribute("aria-hidden", "true");
        head.textContent = name;
        grid.appendChild(head);
      });

      // Maandag als eerste kolom, zoals in de rest van de site.
      var offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
      for (var gap = 0; gap < offset; gap++) {
        var empty = document.createElement("span");
        empty.className = "trip-cal__cell is-empty";
        grid.appendChild(empty);
      }

      var days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      for (var d = 1; d <= days; d++) {
        grid.appendChild(drawDay(new Date(month.getFullYear(), month.getMonth(), d)));
      }

      box.appendChild(grid);
      return box;
    }

    function drawDay(date) {
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "trip-cal__cell trip-cal__day";
      cell.textContent = date.getDate();
      cell.setAttribute("data-date", toText(date));

      if (!inSeason(date)) {
        cell.disabled = true;
        cell.className += " is-outside";
        cell.setAttribute("aria-label", date.getDate() + " " + MONTHS[date.getMonth()] + ", " + T.outside);
        return cell;
      }

      cell.setAttribute("aria-label", longDate(date));
      var end = to || (from && hover && hover > from ? hover : null);
      if (sameDay(date, from)) { cell.className += " is-from"; cell.setAttribute("aria-pressed", "true"); }
      if (sameDay(date, to)) { cell.className += " is-to"; cell.setAttribute("aria-pressed", "true"); }
      if (from && end && date > from && date < end) cell.className += " is-between";
      if (!to && from && hover && hover > from && date > from && date <= hover) cell.className += " is-preview";

      // Eén dag houdt de tabvolgorde kort: de rest is met de pijltjes bereikbaar.
      cell.tabIndex = sameDay(date, focusDate) ? 0 : -1;
      return cell;
    }

    function drawHint() {
      if (from && to) {
        hint.textContent = longDate(from) + " - " + longDate(to) + " (" + T.nights(nightsBetween(from, to)) + ")";
      } else if (from) {
        hint.textContent = T.hintEnd;
      } else {
        hint.textContent = T.hintStart;
      }
      applyBtn.disabled = !(from && to);
      clearBtn.disabled = !from && !to;
    }

    function draw() {
      clampView();
      if (!focusDate || !inSeason(focusDate)) focusDate = from || seasonStart;
      drawTitles();
      drawMonths();
      drawHint();
    }

    function drawTriggerText() {
      var chosenFrom = parseDate(inputFrom.value);
      var chosenTo = parseDate(inputTo.value);
      if (chosenFrom && chosenTo) {
        valueText.textContent = shortDate(chosenFrom) + " - " + shortDate(chosenTo);
        field.classList.add("has-value");
      } else {
        valueText.textContent = T.trigger;
        field.classList.remove("has-value");
      }
    }

    /* --- Openen en sluiten ------------------------------------------------ */
    function open() {
      from = parseDate(inputFrom.value);
      to = parseDate(inputTo.value);
      hover = null;
      focusDate = from || seasonStart;
      // Begin bij de maand van de gekozen aankomst, anders bij het seizoen.
      view = from ? new Date(from.getFullYear(), from.getMonth(), 1) : new Date(firstMonth.getTime());
      draw();
      panel.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      document.addEventListener("keydown", onEscape, true);
      document.addEventListener("mousedown", onOutside, true);
      var focusCell = panel.querySelector('[data-date="' + toText(focusDate) + '"]:not([disabled])');
      (focusCell || applyBtn).focus();
    }

    function close(giveFocusBack) {
      if (panel.hidden) return;
      panel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      document.removeEventListener("keydown", onEscape, true);
      document.removeEventListener("mousedown", onOutside, true);
      if (giveFocusBack) trigger.focus();
    }

    function onEscape(event) {
      if (event.key === "Escape" || event.key === "Esc") {
        event.stopPropagation();
        close(true);
      }
    }

    function onOutside(event) {
      if (!field.contains(event.target)) close(false);
    }

    /* --- Bediening -------------------------------------------------------- */
    trigger.addEventListener("click", function () {
      if (panel.hidden) open(); else close(true);
    });

    Array.prototype.forEach.call(arrows, function (arrow) {
      arrow.addEventListener("click", function () {
        view = addMonths(view, parseInt(arrow.getAttribute("data-step"), 10));
        draw();
      });
    });

    function pick(date) {
      if (!from || to || date <= from) {
        from = date;
        to = null;
      } else {
        to = date;
      }
      hover = null;
      focusDate = date;
      draw();
      focusDay();
    }

    monthsBox.addEventListener("click", function (event) {
      var cell = event.target.closest(".trip-cal__day");
      if (!cell || cell.disabled) return;
      pick(parseDate(cell.getAttribute("data-date")));
    });

    monthsBox.addEventListener("mouseover", function (event) {
      var cell = event.target.closest(".trip-cal__day");
      if (!cell || cell.disabled || !from || to) return;
      var date = parseDate(cell.getAttribute("data-date"));
      if (sameDay(date, hover)) return;
      hover = date;
      drawMonths();
    });

    monthsBox.addEventListener("mouseleave", function () {
      if (!hover) return;
      hover = null;
      drawMonths();
    });

    /* Met de pijltjestoetsen loop je door de dagen; springt de focus naar een
       andere maand, dan schuift de kalender mee. */
    monthsBox.addEventListener("keydown", function (event) {
      var steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      var cell = event.target.closest(".trip-cal__day");
      if (!cell) return;

      var current = parseDate(cell.getAttribute("data-date"));
      var next = null;

      if (steps[event.key] !== undefined) next = addDays(current, steps[event.key]);
      else if (event.key === "PageUp") next = addMonths(current, -1);
      else if (event.key === "PageDown") next = addMonths(current, 1);
      else if (event.key === "Home") next = seasonStart;
      else if (event.key === "End") next = seasonEnd;
      else return;

      event.preventDefault();
      if (next < seasonStart) next = seasonStart;
      if (next > seasonEnd) next = seasonEnd;
      focusDate = next;

      var key = monthKey(next);
      if (key < monthKey(view) || key > monthKey(addMonths(view, monthCount() - 1))) {
        view = new Date(next.getFullYear(), next.getMonth(), 1);
      }
      draw();
      focusDay();
    });

    clearBtn.addEventListener("click", function () {
      from = null;
      to = null;
      hover = null;
      inputFrom.value = "";
      inputTo.value = "";
      drawTriggerText();
      draw();
    });

    applyBtn.addEventListener("click", function () {
      if (!from || !to) return;
      inputFrom.value = toText(from);
      inputTo.value = toText(to);
      drawTriggerText();
      close(true);
    });

    wide.addEventListener("change", function () {
      if (!panel.hidden) draw();
    });

    drawTriggerText();
  }

  /* ======================================================================
     De balk zelf
     ====================================================================== */
  function setup(form) {
    var destination = form.querySelector('[name="reis"]');
    var inputFrom = form.querySelector('[name="van"]');
    var inputTo = form.querySelector('[name="tot"]');
    var persons = form.querySelector('[name="personen"]');
    var minus = form.querySelector('[data-persons="minus"]');
    var plus = form.querySelector('[data-persons="plus"]');

    var seasonStart = parseDate(form.getAttribute("data-season-start"));
    var seasonEnd = parseDate(form.getAttribute("data-season-end"));

    /* --- De kalender in plaats van de twee datumvelden -------------------- */
    var nativeFields = form.querySelectorAll(".trip-search__field--native");
    if (seasonStart && seasonEnd && inputFrom && inputTo && nativeFields.length) {
      form.classList.add("is-enhanced");
      buildCalendar(form, seasonStart, seasonEnd, inputFrom, inputTo, nativeFields);
    }

    /* --- Aantal reizigers ------------------------------------------------- */
    if (persons) {
      var step = function (direction) {
        var min = parseInt(persons.min, 10) || 1;
        var max = parseInt(persons.max, 10) || 12;
        var value = parseInt(persons.value, 10);
        if (isNaN(value)) value = min;
        persons.value = Math.min(max, Math.max(min, value + direction));
      };
      if (minus) minus.addEventListener("click", function () { step(-1); });
      if (plus) plus.addEventListener("click", function () { step(1); });
    }

    /* --- Versturen --------------------------------------------------------
       De bezoeker gaat naar de pagina van de bestemming, op het blok waar hij
       verder boekt. Welke pagina en welk blok dat is, staat per bestemming in
       data-target op de keuzelijst. Staat daar niets (of is er niets gekozen),
       dan blijft het formulier zijn eigen action volgen: boeken.html.
       --------------------------------------------------------------------- */
    form.addEventListener("submit", function (event) {
      var option = destination && destination.options[destination.selectedIndex];
      var target = option && option.getAttribute("data-target");
      if (!target) return; // gewoon versturen naar boeken.html

      event.preventDefault();

      var query = new URLSearchParams();
      if (destination.value) query.set("reis", destination.value);
      if (inputFrom && inputFrom.value) query.set("van", inputFrom.value);
      if (inputTo && inputTo.value) query.set("tot", inputTo.value);
      if (persons && persons.value) query.set("personen", persons.value);

      // Het anker staat achter het vraagteken, dus dat halen we er los uit.
      var hash = "";
      var hashAt = target.indexOf("#");
      if (hashAt > -1) {
        hash = target.slice(hashAt);
        target = target.slice(0, hashAt);
      }
      window.location.href = target + "?" + query.toString() + hash;
    });
  }

  /* ======================================================================
     De keuzes meenemen op de pagina van de bestemming

     Komt iemand via de reiszoeker binnen, dan staan zijn keuzes in het
     webadres. Ze worden hier twee dingen: een regel in het blok "Data en
     prijs", zodat hij ziet dat ze zijn overgenomen, en een aanvulling op elke
     link naar het aanvraagformulier, zodat hij niets opnieuw hoeft te kiezen.
     ====================================================================== */
  function carryChoices() {
    var params = new URLSearchParams(window.location.search);
    var from = parseDate(params.get("van"));
    var to = parseDate(params.get("tot"));
    var persons = parseInt(params.get("personen"), 10);
    var hasPeriod = from && to && to > from;
    if (!hasPeriod && isNaN(persons)) return;

    // 1. De keuzes achter elke link naar het aanvraagformulier zetten.
    Array.prototype.forEach.call(document.querySelectorAll('a[href*="boeken.html"]'), function (link) {
      var href = link.getAttribute("href");
      var split = href.split("?");
      var query = new URLSearchParams(split[1] || "");
      if (hasPeriod) {
        query.set("van", toText(from));
        query.set("tot", toText(to));
      }
      if (!isNaN(persons)) query.set("personen", String(persons));
      link.setAttribute("href", split[0] + "?" + query.toString());
    });

    // 2. De regel in het blok "Data en prijs".
    var block = document.getElementById("data-en-prijs");
    var actions = block && block.querySelector(".pending__actions");
    if (!actions) return;

    var parts = [];
    if (hasPeriod) {
      parts.push(longDate(from) + " - " + longDate(to) + " (" + T.nights(nightsBetween(from, to)) + ")");
    }
    if (!isNaN(persons)) parts.push(persons + (persons === 1 ? " reiziger" : " reizigers"));

    var line = document.createElement("p");
    line.className = "pending__chosen";
    line.innerHTML = "<strong>Je keuze:</strong> " + parts.join(" &middot; ") +
      ". Die gaat mee naar je aanvraag.";
    actions.parentNode.insertBefore(line, actions);
  }

  Array.prototype.forEach.call(document.querySelectorAll(".trip-search"), setup);
  carryChoices();
})();
