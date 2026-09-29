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
   online; step 2 then lets the visitor pick a trip length (with its price
   per person), a departure date and the number of people, and passes that
   choice on in the WhatsApp message and the link to the call planner
   (belafspraak.html). The texts for this are in the data block.

   Links into this page may carry the choice: ?reis=lulea&van=2027-01-10&
   tot=2027-01-14&personen=3&begeleiding=2, or ?reis=wellness&dagen=5. The
   address follows what the visitor picks, so a refresh or the back button
   shows the same choice.

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

  /* Reads a date like "2027-01-16". Anything else (empty, a typo, a day
     that does not exist) gives null, so an Invalid Date never gets through.
     Same check as in main.js. */
  function alsDatum(tekst) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tekst))) return null;
    var d = String(tekst).split("-");
    var datum = new Date(+d[0], +d[1] - 1, +d[2]);
    if (isNaN(datum.getTime())) return null;
    if (datum.getMonth() !== +d[1] - 1 || datum.getDate() !== +d[2]) return null;
    return datum;
  }

  function alsTekst(datum) {
    function twee(n) { return (n < 10 ? "0" : "") + n; }
    return datum.getFullYear() + "-" + twee(datum.getMonth() + 1) + "-" + twee(datum.getDate());
  }

  // A head count written as digits only, 1 or more; anything else is null.
  function alsAantal(tekst) {
    if (!/^\d{1,6}$/.test(String(tekst))) return null;
    var n = parseInt(tekst, 10);
    return n >= 1 ? n : null;
  }

  // Fills the {name} placeholders of a text from the data block.
  function vul(sjabloon, waarden) {
    return String(sjabloon || "").replace(/\{(\w+)\}/g, function (geheel, sleutel) {
      return Object.prototype.hasOwnProperty.call(waarden, sleutel) ? String(waarden[sleutel]) : geheel;
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
    begeleiding: params.get("begeleiding"),
    // Trip length in days, only used by a trip on request (wellness).
    dagen: params.get("dagen")
  };
  var reisSleutel = "";
  var reis = null;

  function schrijfAdres() {
    if (!window.history || !window.history.replaceState) return;
    var nieuw = new URLSearchParams();
    if (reisSleutel) nieuw.set("reis", reisSleutel);
    ["van", "tot", "personen", "begeleiding", "dagen"].forEach(function (sleutel) {
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
  var aanvraagBijwerken = null; // updates address and links of the trip on request
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
    keuze.dagen = info.dagen || null;
  }

  /* A trip without a fixed price, all from the data block. With
     "keuzeTeksten" the visitor picks a trip length (with its price per
     person), a departure date and the number of people; nothing is paid,
     the choice goes into the WhatsApp message and the link to the call
     planner. Without them only the prices per trip length are listed.
     Either way the note on the price and the contact links are shown. */
  function toonAanvraag(gegevens) {
    if (!aanvraagBox) return;
    // Built once per trip, so switching destinations keeps what was picked.
    // Shown again: the web address follows what is on screen here.
    if (aanvraagBox.getAttribute("data-aanvraag-reis") === reisSleutel) {
      if (aanvraagBijwerken) aanvraagBijwerken();
      return;
    }
    aanvraagBox.setAttribute("data-aanvraag-reis", reisSleutel);
    aanvraagBijwerken = null;

    var sleutel = reisSleutel;
    var tk = gegevens.keuzeTeksten && typeof gegevens.keuzeTeksten === "object" ? gegevens.keuzeTeksten : null;
    var duren = (Array.isArray(gegevens.prijzenPerDuur) ? gegevens.prijzenPerDuur : []).filter(function (regel) {
      return regel && regel.label && typeof regel.prijs === "number" && isFinite(regel.prijs);
    });
    var metKeuze = Boolean(tk) && duren.length > 0 && duren.every(function (regel) {
      return typeof regel.dagen === "number" && regel.dagen >= 1 && regel.dagen % 1 === 0;
    });

    var toelichting = gegevens.prijsToelichting
      ? '<p class="' + (metKeuze ? "booking__note" : "booking__period-empty") + '">' + escapeHtml(gegevens.prijsToelichting) + '</p>'
      : "";
    var knoppen = (Array.isArray(gegevens.contact) ? gegevens.contact : []).filter(function (link) {
      return link && link.tekst && link.href;
    }).map(function (link, i) {
      var extern = /^https?:/.test(link.href);
      var soort = metKeuze && (link.metKeuze === "whatsapp" || link.metKeuze === "belafspraak") ? link.metKeuze : "";
      return '<a class="btn ' + (i === 0 ? "btn--dark" : "btn--outline-dark") + '" href="' + escapeHtml(link.href) + '"' +
        (soort ? ' data-met-keuze="' + soort + '"' : '') +
        (extern ? ' target="_blank" rel="noopener"' : '') + '>' + escapeHtml(link.tekst) + '</a>';
    });
    var contact = knoppen.length ? '<div class="booking__contact">' + knoppen.join("") + '</div>' : "";

    if (!metKeuze) {
      var rijen = duren.map(function (regel) {
        return '<li class="booking__rate"><span>' + escapeHtml(regel.label) + '</span><span>' + euro(regel.prijs) + '</span></li>';
      });
      aanvraagBox.innerHTML = toelichting + (rijen.length ? '<ul class="booking__rates">' + rijen.join("") + '</ul>' : "") + contact;
      return;
    }

    function duurMet(dagen) {
      for (var i = 0; i < duren.length; i++) if (duren[i].dagen === dagen) return duren[i];
      return null;
    }
    /* A stay longer than the longest listed length (picked in the calendar
       on the trip page), labelled like the listed ones in the page's
       language: the number in the first label is swapped ("4 dagen" becomes
       "9 dagen"). It has no price. null for any other length. */
    function langereDuur(dagen) {
      var langste = 0;
      duren.forEach(function (regel) { if (regel.dagen > langste) langste = regel.dagen; });
      if (!(dagen > langste && dagen <= 99)) return null;
      var voorbeeld = String(duren[0].label);
      var label = /\d+/.test(voorbeeld) ? voorbeeld.replace(/\d+/, String(dagen)) : dagen + " " + voorbeeld;
      return { dagen: dagen, label: label, prijs: null };
    }
    function prijsPerPersoon(bedrag) {
      return tk.prijsPerPersoon
        ? vul(tk.prijsPerPersoon, { bedrag: Math.round(bedrag).toLocaleString("nl-NL") })
        : euro(bedrag);
    }
    function leesbareDatum(datum) {
      try {
        return datum.toLocaleDateString(document.documentElement.lang || "nl", { day: "numeric", month: "long", year: "numeric" });
      } catch (fout) {
        return alsTekst(datum);
      }
    }

    /* The start values come from the web address. A trip length counts when
       it is one of the listed ones or longer than all of them; without one,
       arrival and departure dates may give it (days = nights + 1). The date
       is never before today. */
    var nu = new Date();
    var vandaag = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate());
    var duur = null;
    if (keuze.dagen === null || keuze.dagen === undefined || keuze.dagen === "") {
      var uitVan = alsDatum(keuze.van);
      var uitTot = alsDatum(keuze.tot);
      if (uitVan && uitTot && uitTot > uitVan) {
        var uitDagen = Math.round((uitTot.getTime() - uitVan.getTime()) / 86400000) + 1;
        // A length that is not in the price list (a longer stay picked in
        // the calendar on the trip page) still goes along as "N dagen",
        // without a price: none of the radio buttons is checked for it.
        duur = duurMet(uitDagen) || langereDuur(uitDagen);
      }
    } else if (/^[1-9]\d?$/.test(String(keuze.dagen))) {
      duur = duurMet(parseInt(keuze.dagen, 10)) || langereDuur(parseInt(keuze.dagen, 10));
    }
    var datum = alsDatum(keuze.van);
    if (datum && datum < vandaag) datum = null;
    var personen = alsAantal(keuze.personen);

    var id = "aanvraag-" + sleutel.replace(/[^a-z0-9-]/gi, "");
    aanvraagBox.innerHTML =
      '<fieldset class="booking__block booking__block--vraag" data-aanvraag-duur>' +
        '<legend class="booking__legend booking__legend--klein">' + escapeHtml(tk.duurVraag || "") + '</legend>' +
        '<div class="booking__extras">' +
          duren.map(function (regel) {
            return '<label class="extra">' +
              '<input type="radio" class="extra__check" name="' + id + '-dagen" value="' + regel.dagen + '"' + (regel === duur ? ' checked' : '') + ' />' +
              '<span class="extra__name">' + escapeHtml(regel.label) + '</span>' +
              '<span class="extra__price">' + escapeHtml(prijsPerPersoon(regel.prijs)) + '</span>' +
            '</label>';
          }).join("") +
        '</div>' +
      '</fieldset>' +
      '<div class="booking__block booking__block--vraag">' +
        '<label class="booking__legend booking__legend--klein" for="' + id + '-datum">' + escapeHtml(tk.datumLabel || "") + '</label>' +
        '<input class="trip-search__input" type="date" id="' + id + '-datum" min="' + alsTekst(vandaag) + '" value="' + (datum ? alsTekst(datum) : "") + '" />' +
      '</div>' +
      '<div class="booking__block booking__block--vraag">' +
        '<label class="booking__legend booking__legend--klein" for="' + id + '-personen">' + escapeHtml(tk.personenLabel || "") + '</label>' +
        '<div class="booking__persons">' +
          '<button type="button" class="booking__step-btn" data-personen-stap="-1" aria-label="' + escapeHtml(tk.personenMinder || "-") + '" aria-controls="' + id + '-personen">−</button>' +
          '<input type="number" id="' + id + '-personen" min="1" step="1" inputmode="numeric" value="' + (personen || "") + '" />' +
          '<button type="button" class="booking__step-btn" data-personen-stap="1" aria-label="' + escapeHtml(tk.personenMeer || "+") + '" aria-controls="' + id + '-personen">+</button>' +
        '</div>' +
      '</div>' +
      '<div aria-live="polite" data-aanvraag-samenvatting></div>' +
      toelichting + contact;

    var duurBlok = aanvraagBox.querySelector("[data-aanvraag-duur]");
    var datumVeld = document.getElementById(id + "-datum");
    var personenVeld = document.getElementById(id + "-personen");
    var minder = aanvraagBox.querySelector('[data-personen-stap="-1"]');
    var meer = aanvraagBox.querySelector('[data-personen-stap="1"]');
    var samenvatting = aanvraagBox.querySelector("[data-aanvraag-samenvatting]");
    var keuzeLinks = Array.prototype.map.call(aanvraagBox.querySelectorAll("[data-met-keuze]"), function (link) {
      return { el: link, soort: link.getAttribute("data-met-keuze"), basis: link.getAttribute("href") };
    });

    /* Summary, links and web address after every change. Parts that are not
       filled in are left out. */
    function werkBij() {
      if (minder) minder.disabled = !personen || personen <= 1;

      var regels = [];
      var delen = [];
      if (duur) {
        regels.push(vul(tk.regelDuur, { duur: duur.label }));
        delen.push(duur.label);
        if (typeof duur.prijs === "number") delen.push(prijsPerPersoon(duur.prijs));
      }
      if (datum) {
        regels.push(vul(tk.regelDatum, { datum: leesbareDatum(datum) }));
        delen.push(vul(tk.vertrek, { datum: leesbareDatum(datum) }));
      }
      if (personen) {
        regels.push(vul(tk.regelPersonen, { n: personen }));
        delen.push(vul(personen === 1 ? tk.persoon : tk.personen, { n: personen }));
      }
      regels = regels.filter(Boolean);
      delen = delen.filter(Boolean);

      if (samenvatting) {
        samenvatting.innerHTML = delen.length
          ? '<p class="booking__rate is-match"><span>' + escapeHtml(delen.join(" · ")) + '</span></p>'
          : "";
      }

      keuzeLinks.forEach(function (link) {
        var basis = link.basis.split("?")[0];
        if (link.soort === "whatsapp") {
          // Nothing picked yet: the general question from the data block.
          link.el.href = regels.length
            ? basis + "?text=" + encodeURIComponent([vul(tk.whatsappBericht, { naam: gegevens.naam })].concat(regels).filter(Boolean).join("\n"))
            : link.basis;
        } else if (link.soort === "belafspraak") {
          var query = [];
          if (tk.belOnderwerp) query.push("onderwerp=" + encodeURIComponent(tk.belOnderwerp));
          var uitleg = [vul(tk.regelReis, { naam: gegevens.naam })].concat(regels).filter(Boolean).join("\n");
          if (uitleg) query.push("toelichting=" + encodeURIComponent(uitleg));
          link.el.href = basis + (query.length ? "?" + query.join("&") : "");
        }
      });

      keuze.dagen = duur ? duur.dagen : null;
      keuze.van = datum ? alsTekst(datum) : null;
      keuze.tot = datum && duur
        ? alsTekst(new Date(datum.getFullYear(), datum.getMonth(), datum.getDate() + duur.dagen - 1))
        : null;
      keuze.personen = personen;
      keuze.begeleiding = null;
      laatsteKeuze[sleutel] = { van: keuze.van, tot: keuze.tot, personen: personen, dagen: keuze.dagen, begeleidingDagen: null };
      if (reisSleutel === sleutel) schrijfAdres();
    }

    if (duurBlok) {
      duurBlok.addEventListener("change", function (gebeurtenis) {
        var knop = gebeurtenis.target;
        if (!knop || knop.name !== id + "-dagen") return;
        duur = duurMet(parseInt(knop.value, 10));
        werkBij();
      });
    }

    if (datumVeld) {
      var leesDatum = function () {
        var gekozen = alsDatum(datumVeld.value);
        datum = gekozen && gekozen >= vandaag ? gekozen : null;
        werkBij();
      };
      datumVeld.addEventListener("input", leesDatum);
      datumVeld.addEventListener("change", leesDatum);
    }

    if (personenVeld && minder && meer) {
      // Typing works too; an invalid number is ignored until the visitor
      // leaves the field, then the last valid one shows again.
      personenVeld.addEventListener("input", function () {
        var waarde = personenVeld.value.trim();
        var nieuw = waarde === "" ? null : alsAantal(waarde);
        if (waarde !== "" && nieuw === null) return;
        if (nieuw === personen) return;
        personen = nieuw;
        werkBij();
      });
      personenVeld.addEventListener("change", function () {
        personenVeld.value = personen ? String(personen) : "";
      });
      [minder, meer].forEach(function (knop) {
        knop.addEventListener("click", function () {
          var stap = parseInt(knop.getAttribute("data-personen-stap"), 10);
          var nieuw = personen ? personen + stap : (stap > 0 ? 1 : null);
          if (!nieuw || nieuw < 1) return;
          personen = nieuw;
          personenVeld.value = String(personen);
          werkBij();
          // At 1 the minus button switches off; keep focus in the stepper.
          if (knop.disabled) meer.focus();
        });
      });
    }

    aanvraagBijwerken = werkBij;
    werkBij();
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
        keuze.dagen = null;
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
