/* ==========================================================================
   Booking page (boeken.html)

   Step 1: the visitor picks a destination. Step 2: the calendar of that
   trip, the same one as on its trip page, with the persons stepper, the
   options, the price for the whole group and the "Book and pay" link to
   uitchecken.html. Prices are never calculated here:

     Falun                          js/falun-kalender.js (data/falun-prijzen.json)
     Lulea, Orsa, Weissensee,       js/main.js, NovakseReiskalender
     Finland                        (data/<trip>-prijzen.json)

   The server recalculates the amount from the same price files
   (api/_falun-prijs.js, api/_reis-prijs.js) before anything is charged.

   A trip without a fixed price ("prijsOpAanvraag", wellness) cannot be paid
   online; step 2 then shows its prices per trip length and the ways to
   contact Joey that are listed with it in the data block.

   Links into this page may carry the choice: ?reis=lulea&van=2027-01-10&
   tot=2027-01-14&personen=3&begeleiding=2. The address follows what the
   visitor picks, so a refresh or the back button shows the same choice.

   The destinations and their price files are in <script id="boekingsdata">
   in boeken.html.
   ========================================================================== */
(function () {
  "use strict";

  /* Texts this script puts on the screen. Destination names and the texts
     of a trip on request come from the data block, which is already in the
     page's language. */
  var I18N = {
    nl: {
      bookPayHint: "Kies je periode en betaal online",
      onRequestHint: "Prijs op aanvraag",
      stepCalendar: "Je periode en met hoeveel personen",
      allTripsLabel: "Alle reizen",
      calendarLabel: "Kalender",
      viewTripPage: function (naam) { return "Bekijk de reispagina van " + naam; }
    },
    en: {
      bookPayHint: "Choose your dates and pay online",
      onRequestHint: "Price on request",
      stepCalendar: "Your dates and number of people",
      allTripsLabel: "All trips",
      calendarLabel: "Calendar",
      viewTripPage: function (naam) { return "View the trip page for " + naam; }
    },
    sv: {
      bookPayHint: "Välj period och betala online",
      onRequestHint: "Pris på förfrågan",
      stepCalendar: "Din period och antal personer",
      allTripsLabel: "Alla resor",
      calendarLabel: "Kalender",
      viewTripPage: function (naam) { return "Se resesidan för " + naam; }
    },
    de: {
      bookPayHint: "Zeitraum wählen und online bezahlen",
      onRequestHint: "Preis auf Anfrage",
      stepCalendar: "Dein Zeitraum und die Anzahl Personen",
      allTripsLabel: "Alle Reisen",
      calendarLabel: "Kalender",
      viewTripPage: function (naam) { return "Reiseseite von " + naam + " ansehen"; }
    },
    no: {
      bookPayHint: "Velg periode og betal på nett",
      onRequestHint: "Pris på forespørsel",
      stepCalendar: "Din periode og antall personer",
      allTripsLabel: "Alle turer",
      calendarLabel: "Kalender",
      viewTripPage: function (naam) { return "Se reisesiden for " + naam; }
    },
    fi: {
      bookPayHint: "Valitse ajankohta ja maksa verkossa",
      onRequestHint: "Hinta pyynnöstä",
      stepCalendar: "Ajankohta ja henkilömäärä",
      allTripsLabel: "Kaikki matkat",
      calendarLabel: "Kalenteri",
      viewTripPage: function (naam) { return "Katso matkan sivu: " + naam; }
    }
  };
  var LANG = (document.documentElement.lang || "nl").slice(0, 2).toLowerCase();
  var T = I18N[LANG] || I18N.nl;

  var bron = document.getElementById("boekingsdata");
  var keuzeBox = document.getElementById("reisKeuze");
  var periodeBlok = document.getElementById("periodeBlok");
  var kalenderPlek = document.getElementById("kalenderPlek");
  if (!bron || !keuzeBox || !periodeBlok || !kalenderPlek) return;

  var data;
  try { data = JSON.parse(bron.textContent); } catch (fout) { return; }
  var alleReizen = (data && data.reizen) || {};

  var reisNaam = document.getElementById("reisNaam");
  var stapTitel = document.getElementById("periodeTitel");
  var aanvraagBox = document.getElementById("aanvraagBox");
  var reisLink = document.getElementById("naarReispagina");
  var headerKalender = document.getElementById("headerKalender");
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // "" on the Dutch site, "../" in the language folders. Paths in the data
  // block start from the site root.
  function mapVoor() {
    var eigen = document.querySelector('script[src$="js/boeken.js"]');
    var src = eigen ? eigen.getAttribute("src") : "";
    return src.replace(/js\/boeken\.js$/, "");
  }

  // Amounts in the same format as the calendars in every language: "€1.395".
  function euro(bedrag) {
    return "€" + Math.round(bedrag).toLocaleString("nl-NL");
  }

  function escapeHtml(tekst) {
    return String(tekst).replace(/[&<>"']/g, function (teken) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[teken];
    });
  }

  // A trip that can be booked and paid here has a price calendar.
  function isTeBoeken(reis) {
    return Boolean(reis && !reis.prijsOpAanvraag && (reis.kalender || reis.prijstabel));
  }

  function korteNaam(reis) {
    return String(reis.naam || "").split(/ [—-] |, /)[0];
  }

  /* --- The choice so far --------------------------------------------------
     Starts from the web address; a calendar reports every change. Dates and
     guiding belong to one trip and are dropped when the visitor switches;
     the head count stays. */
  var params = new URLSearchParams(window.location.search);
  var keuze = {
    van: params.get("van"),
    tot: params.get("tot"),
    personen: params.get("personen"),
    begeleiding: params.get("begeleiding")
  };
  var reisSleutel = "";
  var reis = null;

  function schrijfAdres() {
    if (!window.history || !window.history.replaceState) return;
    var nieuw = new URLSearchParams();
    if (reisSleutel) nieuw.set("reis", reisSleutel);
    ["van", "tot", "personen", "begeleiding"].forEach(function (sleutel) {
      var waarde = keuze[sleutel];
      if (waarde !== null && waarde !== undefined && waarde !== "" && waarde !== 0) nieuw.set(sleutel, String(waarde));
    });
    var query = nieuw.toString();
    try {
      window.history.replaceState(null, "", window.location.pathname + (query ? "?" + query : "") + window.location.hash);
    } catch (fout) { /* older browser */ }
  }

  /* --- Step 1: the destination -------------------------------------------
     Trips that can be booked online first, trips on request after them. */
  function reisHint(gegevens) {
    return isTeBoeken(gegevens) ? T.bookPayHint : T.onRequestHint;
  }

  function bouwReiskeuze() {
    var sleutels = Object.keys(alleReizen);
    var volgorde = sleutels.filter(function (s) { return isTeBoeken(alleReizen[s]); })
      .concat(sleutels.filter(function (s) { return !isTeBoeken(alleReizen[s]); }));

    var lijst = document.createElement("div");
    lijst.className = "booking__extras";
    volgorde.forEach(function (sleutel) {
      var gegevens = alleReizen[sleutel];
      var rij = document.createElement("label");
      rij.className = "extra extra--reis";
      rij.innerHTML =
        '<input type="radio" name="reis" class="extra__check" value="' + escapeHtml(sleutel) + '" />' +
        '<span class="extra__name">' + escapeHtml(gegevens.naam) +
          '<span class="extra__hint">' + escapeHtml(reisHint(gegevens)) + '</span>' +
        '</span>' +
        '<span class="extra__price">' + escapeHtml(gegevens.prijsLabel || "") + '</span>';
      lijst.appendChild(rij);
    });
    keuzeBox.innerHTML = "";
    keuzeBox.appendChild(lijst);

    keuzeBox.addEventListener("change", function (gebeurtenis) {
      var knop = gebeurtenis.target;
      if (knop && knop.name === "reis") kiesReis(knop.value, true);
    });
  }

  /* --- Step 2: the calendar of the trip ----------------------------------
     Every trip gets its own box, built the first time it is chosen, so
     switching back and forth keeps what was picked in each calendar. */
  var kalenders = {};
  var laatsteKeuze = {};

  function kalenderVoor(sleutel) {
    if (kalenders[sleutel]) return kalenders[sleutel];
    var gegevens = alleReizen[sleutel];
    var box = document.createElement("div");
    box.setAttribute("data-boek-reis", sleutel);
    // Until the calendar has loaded (or when it cannot load) there is a
    // link to the trip page, where the same calendar is.
    box.innerHTML = '<p class="calendar__fallback"><a class="link-arrow" href="' + escapeHtml(sleutel) + '.html">' +
      escapeHtml(T.viewTripPage(korteNaam(gegevens))) + '</a></p>';
    kalenderPlek.appendChild(box);
    kalenders[sleutel] = box;

    if (gegevens.kalender) {
      // Falun: the full calendar from falun.html (persons, options,
      // guiding, summary and the link to the payment page). It reads the
      // arrival, departure and head count from the web address, which
      // schrijfAdres() has just set.
      box.className = "falun-cal booking__calendar";
      box.setAttribute("data-falun-calendar", mapVoor() + gegevens.kalender);
      box.setAttribute("data-betaalpagina", mapVoor() + "uitchecken.html");
      var script = document.createElement("script");
      script.src = mapVoor() + "js/falun-kalender.js";
      document.body.appendChild(script);
    } else if (window.NovakseReiskalender) {
      box.className = "calendar booking__calendar";
      window.NovakseReiskalender.start(box, mapVoor() + gegevens.prijstabel, {
        reis: sleutel,
        van: keuze.van,
        tot: keuze.tot,
        personen: keuze.personen,
        begeleidingDagen: keuze.begeleiding,
        onWijzig: function (info) {
          laatsteKeuze[sleutel] = info;
          // Another trip may be open by now; its address stays as it is.
          if (reisSleutel !== sleutel) return;
          neemKeuzeOver(info);
          schrijfAdres();
        }
      });
    }
    return box;
  }

  function neemKeuzeOver(info) {
    keuze.van = info.van;
    keuze.tot = info.tot;
    if (info.personen) keuze.personen = info.personen;
    keuze.begeleiding = info.begeleidingDagen || null;
  }

  /* A trip without a fixed price: its prices per trip length, the note
     that goes with them and the contact links, all from the data block. */
  function toonAanvraag(gegevens) {
    if (!aanvraagBox) return;
    var html = "";
    if (gegevens.prijsToelichting) {
      html += '<p class="booking__period-empty">' + escapeHtml(gegevens.prijsToelichting) + '</p>';
    }
    var rijen = (Array.isArray(gegevens.prijzenPerDuur) ? gegevens.prijzenPerDuur : []).filter(function (regel) {
      return regel && regel.label && typeof regel.prijs === "number" && isFinite(regel.prijs);
    }).map(function (regel) {
      return '<li class="booking__rate"><span>' + escapeHtml(regel.label) + '</span><span>' + euro(regel.prijs) + '</span></li>';
    });
    if (rijen.length) html += '<ul class="booking__rates">' + rijen.join("") + '</ul>';

    var knoppen = (Array.isArray(gegevens.contact) ? gegevens.contact : []).filter(function (link) {
      return link && link.tekst && link.href;
    }).map(function (link, i) {
      var extern = /^https?:/.test(link.href);
      return '<a class="btn ' + (i === 0 ? "btn--dark" : "btn--outline-dark") + '" href="' + escapeHtml(link.href) + '"' +
        (extern ? ' target="_blank" rel="noopener"' : '') + '>' + escapeHtml(link.tekst) + '</a>';
    });
    if (knoppen.length) html += '<div class="booking__contact">' + knoppen.join("") + '</div>';

    aanvraagBox.innerHTML = html;
  }

  /* --- Choosing a destination --------------------------------------------
     handmatig: the visitor clicked it here (not from the web address). */
  function kiesReis(sleutel, handmatig) {
    if (!alleReizen[sleutel]) return;
    var vorige = reisSleutel;
    reisSleutel = sleutel;
    reis = alleReizen[sleutel];

    if (handmatig && vorige && vorige !== sleutel) {
      if (laatsteKeuze[sleutel]) {
        neemKeuzeOver(laatsteKeuze[sleutel]);
      } else {
        keuze.van = null;
        keuze.tot = null;
        keuze.begeleiding = null;
      }
    }
    schrijfAdres();

    var knop = keuzeBox.querySelector('input[name="reis"][value="' + sleutel + '"]');
    if (knop) knop.checked = true;
    if (reisNaam) reisNaam.textContent = reis.naam;

    var teBoeken = isTeBoeken(reis);
    if (stapTitel) stapTitel.textContent = teBoeken ? T.stepCalendar : T.onRequestHint;
    Object.keys(kalenders).forEach(function (s) { kalenders[s].hidden = s !== sleutel; });
    if (teBoeken) {
      kalenderVoor(sleutel).hidden = false;
      if (aanvraagBox) aanvraagBox.hidden = true;
    } else {
      toonAanvraag(reis);
      if (aanvraagBox) aanvraagBox.hidden = false;
    }

    if (reisLink) {
      reisLink.href = sleutel + ".html";
      reisLink.textContent = T.viewTripPage(korteNaam(reis));
      reisLink.hidden = teBoeken;
    }
    if (headerKalender) {
      headerKalender.href = "#periodeBlok";
      headerKalender.textContent = teBoeken ? T.calendarLabel : T.onRequestHint;
    }
    periodeBlok.hidden = false;

    // On a phone the calendar opens below the list, out of sight: bring the
    // start of step 2 into view when the visitor picks a destination here.
    if (handmatig && periodeBlok.getBoundingClientRect().top > window.innerHeight * 0.8) {
      periodeBlok.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }

  /* --- Start --------------------------------------------------------------- */
  bouwReiskeuze();

  var uitAdres = (params.get("reis") || "").toLowerCase();
  if (alleReizen[uitAdres]) {
    kiesReis(uitAdres, false);
  } else if (data.standaard && alleReizen[data.standaard]) {
    kiesReis(data.standaard, false);
  } else {
    // No destination yet: only step 1 is open.
    periodeBlok.hidden = true;
    if (headerKalender) {
      headerKalender.href = "reizen.html";
      headerKalender.textContent = T.allTripsLabel;
    }
  }
})();
