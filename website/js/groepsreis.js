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
   - a persons stepper in steps of "stap" (2, 4, ... 20), with the price per
     person and the total live from js/groepsreis-prijs.js, the same module
     and the same data/groepsreizen.json the server charges with;
   - "Boeken en betalen" to uitchecken.html?reis=<key>&personen=<n>;
   - "Met 1 persoon of een oneven aantal? Neem contact op.": a panel with
     links to belafspraak.html, WhatsApp and e-mail, prefilled with one line
     (trip, dates, head count), and to contact.html.

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
    return n + (n === 1 ? " persoon" : " personen");
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
    var periode = G.periodeTekst(reis);
    if (!periode) return false;

    // Can this trip still be booked? Anything other than "too late" means
    // the data is wrong: keep the page's own summary instead.
    var proef = G.berekenGroepsreis({ reis: reis.sleutel, personen: keuzes[0] }, data);
    var voorbij = !proef.ok && proef.code === "voorbij";
    if (!proef.ok && !voorbij) return false;

    // Head counts that cannot book online (1, 3, 5 ... below the maximum).
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
    kop.appendChild(maak("p", "grw__eyebrow", "Vaste data"));
    kop.appendChild(maak("p", "grw__date", periode));
    kop.appendChild(baanlijn());
    kop.appendChild(maak("p", "grw__meta", reis.dagen + " dagen, " + G.euro(reis.prijsPerPersoon) + " per persoon"));
    widget.appendChild(kop);

    var stepper = null;

    if (voorbij) {
      var dicht = maak("div", "grw__closed");
      dicht.appendChild(maak("p", "grw__closed-text", proef.reden));
      var contactLink = maak("a", "btn btn--outline-dark", "Neem contact op");
      contactLink.href = root + "contact.html";
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
      var label = maak("p", "grw__label", "Aantal personen");
      label.id = id + "-label";
      var hint = maak("p", "grw__hint",
        "Boeken kan per " + reis.stap + " personen, van " + keuzes[0] + " tot en met " + keuzes[keuzes.length - 1] + ".");
      hint.id = id + "-hint";
      tekst.appendChild(label);
      tekst.appendChild(hint);
      personen.appendChild(tekst);

      var knoppen = maak("div", "grw__stepper");
      var min = maak("button", "grw__step");
      min.type = "button";
      min.setAttribute("aria-label", reis.stap + " personen minder");
      min.setAttribute("aria-describedby", id + "-hint");
      min.innerHTML = '<span aria-hidden="true">&minus;</span>';
      var waarde = maak("span", "grw__count");
      waarde.id = id + "-aantal";
      var plus = maak("button", "grw__step");
      plus.type = "button";
      plus.setAttribute("aria-label", reis.stap + " personen meer");
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
      rijPP.appendChild(maak("dt", "", "Per persoon"));
      var ppEl = maak("dd", "");
      rijPP.appendChild(ppEl);
      som.appendChild(rijPP);
      // One live region: the head count and the total are read out together.
      var rijTotaal = maak("div", "grw__row grw__row--total");
      rijTotaal.setAttribute("aria-live", "polite");
      rijTotaal.setAttribute("aria-atomic", "true");
      var totaalLabel = maak("dt", "", "Totaal");
      var totaalVoor = maak("span", "grw__total-for");
      totaalLabel.appendChild(document.createTextNode(" "));
      totaalLabel.appendChild(totaalVoor);
      var totaalEl = maak("dd", "grw__total");
      rijTotaal.appendChild(totaalLabel);
      rijTotaal.appendChild(totaalEl);
      som.appendChild(rijTotaal);
      afrekenen.appendChild(som);

      var boek = maak("a", "btn btn--dark grw__cta", "Boeken en betalen");
      afrekenen.appendChild(boek);
      afrekenen.appendChild(maak("p", "grw__note", "Hierna vul je de reisgegevens in en betaal je via Stripe."));
      main.appendChild(afrekenen);
      widget.appendChild(main);

      stepper = { min: min, plus: plus, waarde: waarde, pp: ppEl, totaal: totaalEl, totaalVoor: totaalVoor, boek: boek };
    }

    /* ---- 1 person or an odd number: contact ---------------------------- */
    var contact = null;
    if (!voorbij && anders.length) {
      var ander = maak("div", "grw__other");
      var toggle = maak("button", "grw__toggle", "Met 1 persoon of een oneven aantal? Neem contact op.");
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", id + "-contact");
      ander.appendChild(toggle);

      var paneel = maak("div", "grw__contact");
      paneel.id = id + "-contact";
      paneel.hidden = true;
      paneel.appendChild(maak("p", "grw__contact-intro",
        "Online boeken kan per " + reis.stap + " personen. Ga je met 1 persoon of een oneven aantal? Neem dan contact op."));

      var veld = maak("div", "grw__field");
      var selectId = id + "-anders";
      var selectLabel = maak("label", "grw__label", "Met hoeveel personen?");
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
      regelBlok.appendChild(maak("p", "grw__line-label", "Dit staat al in je bericht:"));
      var regelEl = maak("p", "grw__line-text");
      regelBlok.appendChild(regelEl);
      paneel.appendChild(regelBlok);

      var links = maak("div", "grw__links");
      var bel = maak("a", "btn btn--dark", "Plan een belafspraak");
      var app = maak("a", "btn btn--outline-dark", "Stuur een WhatsApp");
      app.target = "_blank";
      app.rel = "noopener";
      app.appendChild(maak("span", "sr-only", " (opent in een nieuw tabblad)"));
      var mail = maak("a", "link-arrow", "Mail Joey");
      var pagina = maak("a", "link-arrow", "Naar de contactpagina");
      pagina.href = root + "contact.html";
      links.appendChild(bel);
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
      stepper.totaalVoor.textContent = "voor " + personenTekst(aantal);
      if (uitkomst.ok) {
        stepper.pp.textContent = G.euro(uitkomst.perPersoonEur);
        stepper.totaal.textContent = G.euro(uitkomst.totaalEur);
        stepper.boek.href = root + "uitchecken.html?reis=" + encodeURIComponent(reis.sleutel) +
          "&personen=" + uitkomst.personen + (act ? "&act=" + act : "");
        stepper.boek.removeAttribute("aria-disabled");
      } else {
        // Should not happen (every step is a valid choice); never link to a
        // checkout the server would refuse.
        stepper.pp.textContent = G.euro(reis.prijsPerPersoon);
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
      var regel = reis.naam + ", " + periode + ", " + personenTekst(aantal);
      contact.regel.textContent = regel;
      var bericht = "Hoi Joey, ik wil graag mee met de " + regel + ".";
      contact.bel.href = root + "belafspraak.html?" + new URLSearchParams({
        onderwerp: BELAFSPRAAK_ONDERWERP,
        toelichting: "Ik wil graag mee met de " + regel + "."
      }).toString();
      contact.app.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(bericht);
      contact.mail.href = "mailto:" + MAIL +
        "?subject=" + encodeURIComponent("Aanmelding " + reis.naam + ", " + personenTekst(aantal)) +
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
