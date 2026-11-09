/* ==========================================================================
   Group trips with fixed dates: the booking widget.

   Mounts into every [data-groepsreis-widget][data-reis] element, for example
   <div data-groepsreis-widget data-reis="groepsreis-orsa"></div> on
   groepsreis-orsa.html. The page keeps a plain summary next to it
   ([data-groepsreis-fallback]) that works without JavaScript; it is hidden
   only once the widget is fully built. If the data or the price module
   cannot be loaded, nothing is built and that summary simply stays.

   What it shows:
   - the fixed dates (periodeTekst) and the number of days;
   - a persons stepper from minPersonen to maxPersonen, with the price per
     person and the total live from js/groepsreis-prijs.js, the same module
     and the same data/groepsreizen.json the server charges with;
   - "Boeken en betalen" to uitchecken.html?reis=<key>&personen=<n>;
   - "Met 1 persoon? Neem contact op.": a panel with links to
     belafspraak.html, WhatsApp and e-mail, prefilled with one line (trip,
     dates, head count), and to contact.html.

   Languages: the texts follow <html lang> (nl, en, de, sv, no, fi), same
   pattern as the I18N object in js/main.js and js/boeken.js; Dutch is the
   default. On a page in a language folder (en/groepsreis-orsa.html) the
   checkout and the contact page are those of that folder
   (en/uitchecken.html, en/contact.html), dates and amounts are written the
   way that language writes them, and the trip name comes from naamPerTaal
   in data/groepsreizen.json. belafspraak.html only exists in Dutch, so
   that button is left out on the other languages.

   The price module is loaded from js/groepsreis-prijs.js when the page did
   not include it itself. Paths are resolved from this script's own address,
   so the widget also works from a page in a subfolder.
   ========================================================================== */
(function () {
  "use strict";

  var MAIL = "schaatsennovakse@outlook.com";
  var WHATSAPP = "31617467643";
  // Exactly one of the options on belafspraak.html (js/belafspraak.js only
  // accepts an exact match).
  var BELAFSPRAAK_ONDERWERP = "Een schaatsreis";

  /* Texts this script puts on the screen. "period" writes the fixed dates
     from two days { wd: 0-6 (Sunday first), d, m: 0-11, y }; Dutch uses
     periodeTekst() from js/groepsreis-prijs.js instead, so the Dutch page
     shows exactly what it showed before. "callButton" is empty where
     belafspraak.html does not exist. */
  var I18N = {
    nl: {
      fixedDates: "Vaste data",
      meta: function (dagen, prijs) { return dagen + " dagen, " + prijs + " per persoon"; },
      otherDays: "Andere dagen kan in overleg, het vervoer plannen we dan anders.",
      closed: "", // the reason from js/groepsreis-prijs.js (already Dutch)
      contactUs: "Neem contact op",
      personsLabel: "Aantal personen",
      range: function (min, max) { return "Boeken kan van " + min + " tot en met " + max + " personen. Je gaat niet alleen."; },
      fewer: "1 persoon minder",
      more: "1 persoon meer",
      perPerson: "Per persoon",
      total: "Totaal",
      totalFor: function (personen) { return "voor " + personen; },
      persons: function (n) { return n + (n === 1 ? " persoon" : " personen"); },
      bookPay: "Boeken en betalen",
      payNote: "Hierna vul je de reisgegevens in en betaal je via Stripe.",
      soloToggle: "Met 1 persoon? Neem contact op.",
      soloIntro: "Online boeken kan niet alleen. Ga je met 1 persoon? Neem dan contact op.",
      howMany: "Met hoeveel personen?",
      lineLabel: "Dit staat al in je bericht:",
      callButton: "Plan een belafspraak",
      callNote: function (regel) { return "Ik wil graag mee met de " + regel + "."; },
      whatsapp: "Stuur een WhatsApp",
      newTab: " (opent in een nieuw tabblad)",
      mail: "Mail Joey",
      contactPage: "Naar de contactpagina",
      message: function (regel) { return "Hoi Joey, ik wil graag mee met de " + regel + "."; },
      mailSubject: function (naam, personen) { return "Aanmelding " + naam + ", " + personen; },
      tripName: function (plaats) { return "Groepsreis " + plaats; },
      period: null
    },
    en: {
      fixedDates: "Fixed dates",
      meta: function (dagen, prijs) { return dagen + " days, " + prijs + " per person"; },
      otherDays: "Other days are possible by arrangement, and we then plan the transport differently.",
      closed: "This group trip can no longer be booked.",
      contactUs: "Get in touch",
      personsLabel: "Number of people",
      range: function (min, max) { return "You can book for " + min + " to " + max + " people. You don't travel alone."; },
      fewer: "One person fewer",
      more: "One person more",
      perPerson: "Per person",
      total: "Total",
      totalFor: function (personen) { return "for " + personen; },
      persons: function (n) { return n + (n === 1 ? " person" : " people"); },
      bookPay: "Book and pay",
      payNote: "Next, you fill in the travel details and pay via Stripe.",
      soloToggle: "Just 1 person? Get in touch.",
      soloIntro: "You can't book online on your own. Going as 1 person? Then get in touch.",
      howMany: "How many people?",
      lineLabel: "Already in your message:",
      callButton: "",
      whatsapp: "Send a WhatsApp",
      newTab: " (opens in a new tab)",
      mail: "Email Joey",
      contactPage: "Go to the contact page",
      message: function (regel) { return "Hi Joey, I'd like to join this trip: " + regel + "."; },
      mailSubject: function (naam, personen) { return "Sign-up for " + naam + ", " + personen; },
      tripName: function (plaats) { return "Group trip " + plaats; },
      period: function (a, b, zelfdeMaand, zelfdeJaar) {
        var W = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var M = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return W[a.wd] + " " + a.d + (zelfdeMaand ? "" : " " + M[a.m]) + (zelfdeJaar ? "" : " " + a.y) +
          " to " + W[b.wd] + " " + b.d + " " + M[b.m] + " " + b.y;
      }
    },
    de: {
      fixedDates: "Feste Termine",
      meta: function (dagen, prijs) { return dagen + " Tage, " + prijs + " pro Person"; },
      otherDays: "Andere Tage sind nach Absprache möglich, den Transport planen wir dann anders.",
      closed: "Diese Gruppenreise ist nicht mehr buchbar.",
      contactUs: "Nimm Kontakt auf",
      personsLabel: "Anzahl Personen",
      range: function (min, max) { return "Buchbar für " + min + " bis " + max + " Personen. Du reist nicht allein."; },
      fewer: "Eine Person weniger",
      more: "Eine Person mehr",
      perPerson: "Pro Person",
      total: "Gesamt",
      totalFor: function (personen) { return "für " + personen; },
      persons: function (n) { return n + (n === 1 ? " Person" : " Personen"); },
      bookPay: "Buchen und bezahlen",
      payNote: "Danach gibst du die Reisedaten ein und bezahlst über Stripe.",
      soloToggle: "Mit 1 Person? Nimm Kontakt auf.",
      soloIntro: "Allein kannst du nicht online buchen. Reist du mit 1 Person? Dann nimm Kontakt auf.",
      howMany: "Mit wie vielen Personen?",
      lineLabel: "Das steht schon in deiner Nachricht:",
      callButton: "",
      whatsapp: "Schick eine WhatsApp",
      newTab: " (öffnet in einem neuen Tab)",
      mail: "E-Mail an Joey",
      contactPage: "Zur Kontaktseite",
      message: function (regel) { return "Hallo Joey, ich möchte gern bei dieser Reise mitfahren: " + regel + "."; },
      mailSubject: function (naam, personen) { return "Anmeldung " + naam + ", " + personen; },
      tripName: function (plaats) { return "Gruppenreise " + plaats; },
      period: function (a, b, zelfdeMaand, zelfdeJaar) {
        var W = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
        var M = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        return W[a.wd] + ", " + a.d + "." + (zelfdeMaand ? "" : " " + M[a.m]) + (zelfdeJaar ? "" : " " + a.y) +
          " bis " + W[b.wd] + ", " + b.d + ". " + M[b.m] + " " + b.y;
      }
    },
    sv: {
      fixedDates: "Fasta datum",
      meta: function (dagen, prijs) { return dagen + " dagar, " + prijs + " per person"; },
      otherDays: "Andra dagar går att ordna efter överenskommelse, då planerar vi transporten annorlunda.",
      closed: "Den här gruppresan går inte längre att boka.",
      contactUs: "Hör av dig",
      personsLabel: "Antal personer",
      range: function (min, max) { return "Du kan boka för " + min + " till " + max + " personer. Du reser inte ensam."; },
      fewer: "En person färre",
      more: "En person fler",
      perPerson: "Per person",
      total: "Totalt",
      totalFor: function (personen) { return "för " + personen; },
      persons: function (n) { return n + (n === 1 ? " person" : " personer"); },
      bookPay: "Boka och betala",
      payNote: "Därefter fyller du i resuppgifterna och betalar via Stripe.",
      soloToggle: "Med 1 person? Hör av dig.",
      soloIntro: "Det går inte att boka online för en person. Reser du som 1 person? Hör då av dig.",
      howMany: "Hur många personer?",
      lineLabel: "Det här står redan i ditt meddelande:",
      callButton: "",
      whatsapp: "Skicka ett WhatsApp-meddelande",
      newTab: " (öppnas i en ny flik)",
      mail: "Mejla Joey",
      contactPage: "Till kontaktsidan",
      message: function (regel) { return "Hej Joey, jag vill gärna följa med på den här resan: " + regel + "."; },
      mailSubject: function (naam, personen) { return "Anmälan " + naam + ", " + personen; },
      tripName: function (plaats) { return "Gruppresa " + plaats; },
      period: function (a, b, zelfdeMaand, zelfdeJaar) {
        var W = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
        var M = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
        return W[a.wd] + " " + a.d + (zelfdeMaand ? "" : " " + M[a.m]) + (zelfdeJaar ? "" : " " + a.y) +
          " till " + W[b.wd] + " " + b.d + " " + M[b.m] + " " + b.y;
      }
    },
    no: {
      fixedDates: "Faste datoer",
      meta: function (dagen, prijs) { return dagen + " dager, " + prijs + " per person"; },
      otherDays: "Andre dager er mulig etter avtale, da planlegger vi transporten annerledes.",
      closed: "Denne gruppeturen kan ikke lenger bestilles.",
      contactUs: "Ta kontakt",
      personsLabel: "Antall personer",
      range: function (min, max) { return "Du kan bestille for " + min + " til " + max + " personer. Du reiser ikke alene."; },
      fewer: "Én person færre",
      more: "Én person flere",
      perPerson: "Per person",
      total: "Totalt",
      totalFor: function (personen) { return "for " + personen; },
      persons: function (n) { return n + (n === 1 ? " person" : " personer"); },
      bookPay: "Book og betal",
      payNote: "Deretter fyller du inn reiseopplysningene og betaler via Stripe.",
      soloToggle: "Med 1 person? Ta kontakt.",
      soloIntro: "Du kan ikke bestille på nett alene. Reiser du som 1 person? Ta da kontakt.",
      howMany: "Hvor mange personer?",
      lineLabel: "Dette står allerede i meldingen din:",
      callButton: "",
      whatsapp: "Send en WhatsApp-melding",
      newTab: " (åpnes i en ny fane)",
      mail: "Send e-post til Joey",
      contactPage: "Til kontaktsiden",
      message: function (regel) { return "Hei Joey, jeg vil gjerne bli med på denne turen: " + regel + "."; },
      mailSubject: function (naam, personen) { return "Påmelding " + naam + ", " + personen; },
      tripName: function (plaats) { return "Gruppetur " + plaats; },
      period: function (a, b, zelfdeMaand, zelfdeJaar) {
        var W = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
        var M = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
        return W[a.wd] + " " + a.d + "." + (zelfdeMaand ? "" : " " + M[a.m]) + (zelfdeJaar ? "" : " " + a.y) +
          " til " + W[b.wd] + " " + b.d + ". " + M[b.m] + " " + b.y;
      }
    },
    fi: {
      fixedDates: "Kiinteät päivämäärät",
      meta: function (dagen, prijs) { return dagen + " päivää, " + prijs + " / henkilö"; },
      otherDays: "Muut päivät ovat mahdollisia sopimuksen mukaan, ja suunnittelemme kuljetukset silloin toisin.",
      closed: "Tätä ryhmämatkaa ei voi enää varata.",
      contactUs: "Ota yhteyttä",
      personsLabel: "Henkilömäärä",
      range: function (min, max) { return "Varata voi " + min + "-" + max + " henkilölle. Et matkusta yksin."; },
      fewer: "Yksi henkilö vähemmän",
      more: "Yksi henkilö enemmän",
      perPerson: "Per henkilö",
      total: "Yhteensä",
      totalFor: function (personen, n) { return n + " henkilölle"; },
      persons: function (n) { return n + (n === 1 ? " henkilö" : " henkilöä"); },
      bookPay: "Varaa ja maksa",
      payNote: "Sen jälkeen täytät matkatiedot ja maksat Stripen kautta.",
      soloToggle: "Yksi henkilö? Ota yhteyttä.",
      soloIntro: "Yksin ei voi varata verkossa. Matkustatko yksin? Ota silloin yhteyttä.",
      howMany: "Kuinka monta henkilöä?",
      lineLabel: "Tämä on jo viestissäsi:",
      callButton: "",
      whatsapp: "Lähetä WhatsApp-viesti",
      newTab: " (avautuu uuteen välilehteen)",
      mail: "Lähetä sähköpostia Joeylle",
      contactPage: "Yhteystietosivulle",
      message: function (regel) { return "Hei Joey, haluaisin lähteä mukaan tälle matkalle: " + regel + "."; },
      mailSubject: function (naam, personen) { return "Ilmoittautuminen: " + naam + ", " + personen; },
      tripName: function (plaats) { return "Ryhmämatka " + plaats; },
      // "torstaista 28. sunnuntaihin 31. tammikuuta 2027": from (elative)
      // and to (illative), month in the partitive.
      period: function (a, b, zelfdeMaand, zelfdeJaar) {
        var VAN = ["sunnuntaista", "maanantaista", "tiistaista", "keskiviikosta", "torstaista", "perjantaista", "lauantaista"];
        var TOT = ["sunnuntaihin", "maanantaihin", "tiistaihin", "keskiviikkoon", "torstaihin", "perjantaihin", "lauantaihin"];
        var M = ["tammikuuta", "helmikuuta", "maaliskuuta", "huhtikuuta", "toukokuuta", "kesäkuuta", "heinäkuuta", "elokuuta", "syyskuuta", "lokakuuta", "marraskuuta", "joulukuuta"];
        return VAN[a.wd] + " " + a.d + "." + (zelfdeMaand ? "" : " " + M[a.m]) + (zelfdeJaar ? "" : " " + a.y) +
          " " + TOT[b.wd] + " " + b.d + ". " + M[b.m] + " " + b.y;
      }
    }
  };
  var LANG = (document.documentElement.lang || "nl").slice(0, 2).toLowerCase();
  if (LANG === "nb" || LANG === "nn") LANG = "no";
  if (!I18N[LANG]) LANG = "nl";
  var T = I18N[LANG];
  // A text that is not translated (yet) falls back to the Dutch one.
  Object.keys(I18N.nl).forEach(function (sleutel) {
    if (!(sleutel in T)) T[sleutel] = I18N.nl[sleutel];
  });
  // Where the checkout and the contact page of this language live, from the
  // site root: "" for Dutch, "en/" etc. for the language folders.
  var TAALMAP = LANG === "nl" ? "" : LANG + "/";
  // Amounts on screen follow the page language, as in js/main.js and
  // js/boeken.js: "€1,295", "€1.295", "€1 295". Display only: links and the
  // server keep plain numbers.
  var LOCALE = { en: "en-GB", de: "de-DE", sv: "sv-SE", no: "nb-NO", fi: "fi-FI" }[LANG] || "";

  var mounts = document.querySelectorAll("[data-groepsreis-widget][data-reis]");
  if (!mounts.length || !window.fetch || !window.Promise) return;

  // The site root ("/"), taken from this script's address (.../js/groepsreis.js).
  var root = "/";
  try {
    var eigen = document.currentScript && document.currentScript.src;
    if (eigen) root = new URL("../", eigen).pathname;
  } catch (fout) { /* keep "/" */ }

  function laadModule() {
    if (window.NovakseGroepsreis) return Promise.resolve(window.NovakseGroepsreis);
    return new Promise(function (resolve, reject) {
      var el = document.createElement("script");
      el.src = root + "js/groepsreis-prijs.js";
      el.async = true;
      el.onload = function () {
        if (window.NovakseGroepsreis) resolve(window.NovakseGroepsreis);
        else reject(new Error("module"));
      };
      el.onerror = function () { reject(new Error("module")); };
      document.head.appendChild(el);
    });
  }

  function laadData() {
    return fetch(root + "data/groepsreizen.json").then(function (respons) {
      if (!respons.ok) throw new Error("data");
      return respons.json();
    });
  }

  function maak(tag, klasse, tekst) {
    var el = document.createElement(tag);
    if (klasse) el.className = klasse;
    if (tekst !== undefined) el.textContent = tekst;
    return el;
  }

  function personenTekst(n) {
    return T.persons(n);
  }

  // Whole euros in the page language. Dutch keeps euro() from the price
  // module ("€1.295"), exactly as before.
  // Swedish and Finnish put the euro sign after the amount ("1 295 €"), the
  // same way the texts on those pages write it.
  var EURO_ACHTER = LANG === "sv" || LANG === "fi";
  function bedrag(G, eur) {
    if (!LOCALE) return G.euro(eur);
    var n = typeof eur === "number" && isFinite(eur) ? Math.round(eur) : 0;
    try {
      var getal = n.toLocaleString(LOCALE);
      return EURO_ACHTER ? getal + " €" : "€" + getal;
    } catch (fout) { return G.euro(eur); }
  }

  // "YYYY-MM-DD" -> { wd, d, m, y } (UTC, so no time zone can shift the day).
  function dag(tekst) {
    var delen = String(tekst).split("-");
    var datum = new Date(Date.UTC(+delen[0], +delen[1] - 1, +delen[2]));
    return { wd: datum.getUTCDay(), d: datum.getUTCDate(), m: datum.getUTCMonth(), y: datum.getUTCFullYear() };
  }

  // The fixed dates in the page language. reis.van and reis.tot are already
  // checked by the price module (G.reis); Dutch uses its periodeTekst().
  function periodeVoor(G, reis) {
    if (!T.period) return G.periodeTekst(reis);
    var a = dag(reis.van);
    var b = dag(reis.tot);
    var zelfdeJaar = a.y === b.y;
    return T.period(a, b, zelfdeJaar && a.m === b.m, zelfdeJaar);
  }

  // The trip name in the page language: naamPerTaal in
  // data/groepsreizen.json, else "Group trip <place>". Dutch keeps "naam".
  function naamVoor(data, reis) {
    if (LANG === "nl") return reis.naam;
    var bron = data && data[reis.sleutel];
    var namen = bron && bron.naamPerTaal;
    var naam = namen && typeof namen[LANG] === "string" ? namen[LANG].trim() : "";
    return naam || T.tripName(reis.plaats || reis.naam);
  }

  // A head count from the address (?personen=4), as a number, or 0.
  function personenUitAdres() {
    try {
      var waarde = new URLSearchParams(window.location.search).get("personen") || "";
      return /^\d{1,2}$/.test(waarde) ? parseInt(waarde, 10) : 0;
    } catch (fout) {
      return 0;
    }
  }

  // Chosen activities coming back from Stripe's cancel link (?act=...), passed
  // on unchanged; uitchecken.js checks them again and drops what does not fit.
  function actUitAdres() {
    try {
      var waarde = new URLSearchParams(window.location.search).get("act") || "";
      return /^[a-z0-9:,-]{1,300}$/.test(waarde) ? waarde : "";
    } catch (fout) {
      return "";
    }
  }

  // The thin swept-ice line used across the site, under the dates.
  function baanlijn() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "grw__lane");
    svg.setAttribute("viewBox", "0 0 400 24");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var pad = document.createElementNS(ns, "path");
    pad.setAttribute("d", "M0,12 C100,2 160,22 260,10 C310,4 350,16 400,8");
    svg.appendChild(pad);
    return svg;
  }

  function bouw(mount, G, data) {
    var reis = G.reis(data, mount.getAttribute("data-reis"));
    if (!reis) return false;
    var keuzes = G.personenKeuzes(reis);
    if (!keuzes.length) return false;
    if (!G.periodeTekst(reis)) return false;
    var periode = periodeVoor(G, reis);
    if (!periode) return false;
    var naam = naamVoor(data, reis);

    // Can this trip still be booked? Anything other than "too late" means
    // the data is wrong: keep the page's own summary instead.
    var proef = G.berekenGroepsreis({ reis: reis.sleutel, personen: keuzes[0] }, data);
    var voorbij = !proef.ok && proef.code === "voorbij";
    if (!proef.ok && !voorbij) return false;

    // Head counts that cannot book online (just 1: you cannot go alone).
    var anders = [];
    for (var n = 1; n < reis.maxPersonen; n++) {
      if (keuzes.indexOf(n) === -1) anders.push(n);
    }

    var id = "grw-" + reis.sleutel;
    var uitAdres = personenUitAdres();
    var act = actUitAdres();
    var index = Math.max(0, keuzes.indexOf(uitAdres));

    var widget = document.createDocumentFragment();

    /* ---- Dates ---------------------------------------------------------- */
    var kop = maak("div", "grw__head");
    kop.appendChild(maak("p", "grw__eyebrow", T.fixedDates));
    kop.appendChild(maak("p", "grw__date", periode));
    kop.appendChild(baanlijn());
    kop.appendChild(maak("p", "grw__meta", T.meta(reis.dagen, bedrag(G, reis.prijsPerPersoon))));
    kop.appendChild(maak("p", "grw__hint", T.otherDays));
    widget.appendChild(kop);

    var stepper = null;

    if (voorbij) {
      var dicht = maak("div", "grw__closed");
      dicht.appendChild(maak("p", "grw__closed-text", T.closed || proef.reden));
      var contactLink = maak("a", "btn btn--outline-dark", T.contactUs);
      contactLink.href = root + TAALMAP + "contact.html";
      dicht.appendChild(contactLink);
      widget.appendChild(dicht);
    } else {
      var main = maak("div", "grw__main");

      /* ---- Persons stepper --------------------------------------------- */
      var info = maak("div", "grw__info");
      var personen = maak("div", "grw__persons");
      personen.setAttribute("role", "group");
      personen.setAttribute("aria-labelledby", id + "-label");
      var tekst = maak("div", "grw__persons-text");
      var label = maak("p", "grw__label", T.personsLabel);
      label.id = id + "-label";
      var hint = maak("p", "grw__hint", T.range(keuzes[0], keuzes[keuzes.length - 1]));
      hint.id = id + "-hint";
      tekst.appendChild(label);
      tekst.appendChild(hint);
      personen.appendChild(tekst);

      var knoppen = maak("div", "grw__stepper");
      var min = maak("button", "grw__step");
      min.type = "button";
      min.setAttribute("aria-label", T.fewer);
      min.setAttribute("aria-describedby", id + "-hint");
      min.innerHTML = '<span aria-hidden="true">&minus;</span>';
      var waarde = maak("span", "grw__count");
      waarde.id = id + "-aantal";
      var plus = maak("button", "grw__step");
      plus.type = "button";
      plus.setAttribute("aria-label", T.more);
      plus.setAttribute("aria-describedby", id + "-hint");
      plus.innerHTML = '<span aria-hidden="true">+</span>';
      knoppen.appendChild(min);
      knoppen.appendChild(waarde);
      knoppen.appendChild(plus);
      personen.appendChild(knoppen);
      info.appendChild(personen);
      main.appendChild(info);

      /* ---- Price and the booking button ------------------------------- */
      var afrekenen = maak("div", "grw__checkout");
      var som = maak("dl", "grw__sum");
      var rijPP = maak("div", "grw__row");
      rijPP.appendChild(maak("dt", "", T.perPerson));
      var ppEl = maak("dd", "");
      rijPP.appendChild(ppEl);
      som.appendChild(rijPP);
      // One live region: the head count and the total are read out together.
      var rijTotaal = maak("div", "grw__row grw__row--total");
      rijTotaal.setAttribute("aria-live", "polite");
      rijTotaal.setAttribute("aria-atomic", "true");
      var totaalLabel = maak("dt", "", T.total);
      var totaalVoor = maak("span", "grw__total-for");
      totaalLabel.appendChild(document.createTextNode(" "));
      totaalLabel.appendChild(totaalVoor);
      var totaalEl = maak("dd", "grw__total");
      rijTotaal.appendChild(totaalLabel);
      rijTotaal.appendChild(totaalEl);
      som.appendChild(rijTotaal);
      afrekenen.appendChild(som);

      var boek = maak("a", "btn btn--dark grw__cta", T.bookPay);
      afrekenen.appendChild(boek);
      afrekenen.appendChild(maak("p", "grw__note", T.payNote));
      main.appendChild(afrekenen);
      widget.appendChild(main);

      stepper = { min: min, plus: plus, waarde: waarde, pp: ppEl, totaal: totaalEl, totaalVoor: totaalVoor, boek: boek };
    }

    /* ---- 1 person: contact ---------------------------------------------- */
    var contact = null;
    if (!voorbij && anders.length) {
      var ander = maak("div", "grw__other");
      var toggle = maak("button", "grw__toggle", T.soloToggle);
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", id + "-contact");
      ander.appendChild(toggle);

      var paneel = maak("div", "grw__contact");
      paneel.id = id + "-contact";
      paneel.hidden = true;
      paneel.appendChild(maak("p", "grw__contact-intro", T.soloIntro));

      var veld = maak("div", "grw__field");
      var selectId = id + "-anders";
      var selectLabel = maak("label", "grw__label", T.howMany);
      selectLabel.setAttribute("for", selectId);
      var select = maak("select", "grw__select");
      select.id = selectId;
      anders.forEach(function (aantal) {
        var optie = maak("option", "", personenTekst(aantal));
        optie.value = String(aantal);
        select.appendChild(optie);
      });
      veld.appendChild(selectLabel);
      veld.appendChild(select);
      paneel.appendChild(veld);

      var regelBlok = maak("div", "grw__line");
      regelBlok.appendChild(maak("p", "grw__line-label", T.lineLabel));
      var regelEl = maak("p", "grw__line-text");
      regelBlok.appendChild(regelEl);
      paneel.appendChild(regelBlok);

      var links = maak("div", "grw__links");
      // belafspraak.html only exists in Dutch: no call button elsewhere.
      var bel = T.callButton ? maak("a", "btn btn--dark", T.callButton) : null;
      // Without the call button, WhatsApp becomes the main (dark) button.
      var app = maak("a", bel ? "btn btn--outline-dark" : "btn btn--dark", T.whatsapp);
      app.target = "_blank";
      app.rel = "noopener";
      app.appendChild(maak("span", "sr-only", T.newTab));
      var mail = maak("a", "link-arrow", T.mail);
      var pagina = maak("a", "link-arrow", T.contactPage);
      pagina.href = root + TAALMAP + "contact.html";
      if (bel) links.appendChild(bel);
      links.appendChild(app);
      links.appendChild(mail);
      links.appendChild(pagina);
      paneel.appendChild(links);
      ander.appendChild(paneel);
      widget.appendChild(ander);

      contact = { toggle: toggle, paneel: paneel, select: select, regel: regelEl, bel: bel, app: app, mail: mail };
    }

    /* ---- Updating ------------------------------------------------------- */
    function tekenStepper(animeer) {
      var aantal = keuzes[index];
      var uitkomst = G.berekenGroepsreis({ reis: reis.sleutel, personen: aantal }, data);
      stepper.waarde.textContent = String(aantal);
      stepper.min.setAttribute("aria-disabled", index <= 0 ? "true" : "false");
      stepper.plus.setAttribute("aria-disabled", index >= keuzes.length - 1 ? "true" : "false");
      stepper.totaalVoor.textContent = T.totalFor(personenTekst(aantal), aantal);
      if (uitkomst.ok) {
        stepper.pp.textContent = bedrag(G, uitkomst.perPersoonEur);
        stepper.totaal.textContent = bedrag(G, uitkomst.totaalEur);
        // The checkout in the page's language (en/uitchecken.html, ...).
        stepper.boek.href = root + TAALMAP + "uitchecken.html?reis=" + encodeURIComponent(reis.sleutel) +
          "&personen=" + uitkomst.personen + (act ? "&act=" + act : "");
        stepper.boek.removeAttribute("aria-disabled");
      } else {
        // Should not happen (every step is a valid choice); never link to a
        // checkout the server would refuse.
        stepper.pp.textContent = bedrag(G, reis.prijsPerPersoon);
        stepper.totaal.textContent = "-";
        stepper.boek.removeAttribute("href");
        stepper.boek.setAttribute("aria-disabled", "true");
      }
      if (animeer) {
        // Restart the short "tick" on the new total (transform and opacity only).
        stepper.totaal.classList.remove("is-tick");
        void stepper.totaal.offsetWidth;
        stepper.totaal.classList.add("is-tick");
      }
    }

    function stap(richting) {
      var nieuw = index + richting;
      if (nieuw < 0 || nieuw > keuzes.length - 1) return;
      index = nieuw;
      tekenStepper(true);
    }

    function tekenContact() {
      var aantal = parseInt(contact.select.value, 10) || anders[0];
      var regel = naam + ", " + periode + ", " + personenTekst(aantal);
      contact.regel.textContent = regel;
      var bericht = T.message(regel);
      if (contact.bel) {
        contact.bel.href = root + "belafspraak.html?" + new URLSearchParams({
          onderwerp: BELAFSPRAAK_ONDERWERP,
          toelichting: T.callNote(regel)
        }).toString();
      }
      contact.app.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(bericht);
      contact.mail.href = "mailto:" + MAIL +
        "?subject=" + encodeURIComponent(T.mailSubject(naam, personenTekst(aantal))) +
        "&body=" + encodeURIComponent(bericht + "\n\n");
    }

    function zetContact(open) {
      contact.paneel.hidden = !open;
      contact.toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    if (stepper) {
      stepper.min.addEventListener("click", function () { stap(-1); });
      stepper.plus.addEventListener("click", function () { stap(1); });
      // The link stays focusable while disabled; never follow it then.
      stepper.boek.addEventListener("click", function (event) {
        if (stepper.boek.getAttribute("aria-disabled") === "true") event.preventDefault();
      });
      tekenStepper(false);
    }

    if (contact) {
      contact.toggle.addEventListener("click", function () {
        zetContact(contact.paneel.hidden);
      });
      contact.select.addEventListener("change", tekenContact);
      // Back from a link with an odd head count (?personen=3): open the
      // contact panel with that number already chosen.
      if (anders.indexOf(uitAdres) !== -1) {
        contact.select.value = String(uitAdres);
        zetContact(true);
      }
      tekenContact();
    }

    /* ---- Swap the page's plain summary for the widget ------------------- */
    mount.textContent = "";
    mount.classList.add("grw");
    if (voorbij) mount.classList.add("grw--closed");
    mount.appendChild(widget);

    var bereik = mount.closest("section") || mount.parentNode;
    var fallback = bereik ? bereik.querySelector("[data-groepsreis-fallback]") : null;
    if (fallback) fallback.hidden = true;
    return true;
  }

  Promise.all([laadModule(), laadData()])
    .then(function (resultaat) {
      var G = resultaat[0];
      var data = resultaat[1];
      Array.prototype.forEach.call(mounts, function (mount) {
        try {
          bouw(mount, G, data);
        } catch (fout) {
          // Something unexpected: leave the page's own summary in place.
          mount.textContent = "";
          mount.classList.remove("grw", "grw--closed");
        }
      });
    })
    .catch(function () {
      /* Data or price module not available: the page's summary stays. */
    });
})();
