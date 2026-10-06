/* ==========================================================================
   Reisgegevens: the step between booking and payment (uitchecken.html)

   Every trip pays through uitchecken.html, so this step lives here once and
   applies to all of them. It collects what Joey needs to book the flight and
   the rental car:
     - per traveller: first name(s) and last name as in the passport, date of
       birth and nationality
     - contact: e-mail address and phone number
     - rental car: the main driver (one of the travellers)
     - confirmations: the general terms (required), and when the trip
       includes a rental car the credit card and driving licence (optional,
       on the owner's request they do not block payment)

   Usage (from js/uitchecken.js):
     var stap = NovakseReisgegevens.init({
       form: element,       // #reisgegevensFormulier
       personen: 2,         // head count from the booking, or 0 if unknown
       metAuto: true,       // false when the traveller arranges own transport
       eigenVlucht: false,  // true when the traveller books their own flight
       kinderen: 1,         // of personen: children 2-11 (optional)
       baby: 0,             // of personen: babies 0-1 (optional)
       uitreisdatum: "2027-01-10", // arrival day; ages count on this day
       onKlaar: function (gegevens) {} // called after a valid submit
     });
     stap.gegevens()        // validated data, or null (shows the errors)

   Ages. With a head count and an arrival day the travellers are listed as
   adults (12 and older) first, then children (2-11), then babies (0-1), as
   booked in the calendar. A date of birth must give that category on the
   arrival day, and at least one traveller (and the main driver) must be 21 or
   older. The server (api/create-payment.js) checks exactly the same, so a date
   of birth can never change the price on its own: a mismatch is refused and
   the visitor corrects the head count in the calendar.

   What is typed is kept in sessionStorage for this tab only, so a visitor who
   cancels at Stripe and comes back does not have to type it all again.
   ========================================================================== */
(function () {
  "use strict";

  var OPSLAG_SLEUTEL = "novakse-reisgegevens";
  var MAX_REIZIGERS = 20;
  var EMAIL_PATROON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function vandaagIso() {
    var nu = new Date();
    var maand = String(nu.getMonth() + 1).padStart(2, "0");
    var dag = String(nu.getDate()).padStart(2, "0");
    return nu.getFullYear() + "-" + maand + "-" + dag;
  }

  var MIN_LEEFTIJD_BESTUURDER = 21;

  // Whole years between a date of birth and a day (both "YYYY-MM-DD"); NaN
  // when either is not a real date. Same rule as api/_kinderprijs.js.
  function leeftijdOp(geboortedatum, dag) {
    var g = /^(\d{4})-(\d{2})-(\d{2})$/.exec(geboortedatum || "");
    var d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dag || "");
    if (!g || !d) return NaN;
    var jaren = +d[1] - +g[1];
    if (+d[2] < +g[2] || (+d[2] === +g[2] && +d[3] < +g[3])) jaren--;
    return jaren;
  }
  function categorieVoorLeeftijd(jaren) {
    if (!(jaren >= 0)) return "";
    if (jaren <= 1) return "baby";
    if (jaren <= 11) return "kind";
    return "volwassene";
  }
  var CATEGORIE_TEKST = {
    volwassene: { naam: "volwassene", leeftijd: "12 jaar of ouder" },
    kind: { naam: "kind", leeftijd: "2 t/m 11 jaar" },
    baby: { naam: "baby", leeftijd: "0 of 1 jaar" }
  };

  function leesOpslag() {
    try {
      var tekst = window.sessionStorage.getItem(OPSLAG_SLEUTEL);
      return tekst ? JSON.parse(tekst) || {} : {};
    } catch (fout) {
      return {};
    }
  }

  function schrijfOpslag(waarde) {
    try {
      window.sessionStorage.setItem(OPSLAG_SLEUTEL, JSON.stringify(waarde));
    } catch (fout) {
      /* Private window or storage blocked: the form works without it. */
    }
  }

  function maakVeld(opties) {
    var veld = document.createElement("div");
    veld.className = "form-field";

    var label = document.createElement("label");
    label.setAttribute("for", opties.id);
    label.textContent = opties.label + " *";

    var input = document.createElement("input");
    input.type = opties.type || "text";
    input.id = opties.id;
    input.name = opties.id;
    input.required = true;
    if (opties.autocomplete) input.setAttribute("autocomplete", opties.autocomplete);
    if (opties.max) input.max = opties.max;
    if (opties.maxLength) input.maxLength = opties.maxLength;

    var fout = document.createElement("p");
    fout.className = "field-error";
    fout.id = opties.id + "Fout";
    fout.hidden = true;
    input.setAttribute("aria-describedby", fout.id);

    veld.appendChild(label);
    veld.appendChild(input);
    veld.appendChild(fout);
    return veld;
  }

  function init(opties) {
    var form = opties.form;
    var lijst = form.querySelector("#reizigersLijst");
    var aantalVeld = form.querySelector("#aantalVeld");
    var aantalInput = form.querySelector("#aantalReizigers");
    var autoBlok = form.querySelector("#autoBlok");
    var bestuurderSelect = form.querySelector("#hoofdbestuurder");
    var uitleg = form.querySelector("#reizigersUitleg");
    var foutSamenvatting = form.querySelector("#gegevensFout");
    var opgeslagen = leesOpslag();
    var metAuto = opties.metAuto !== false;
    var vastAantal = opties.personen >= 1 ? Math.min(opties.personen, MAX_REIZIGERS) : 0;
    var vandaag = vandaagIso();

    /* Ages are only checked for a booking with a known head count and
       arrival day (every calendar trip); a payment link from Joey has none. */
    var uitreisdatum = /^\d{4}-\d{2}-\d{2}$/.test(opties.uitreisdatum || "") ? opties.uitreisdatum : "";
    var aantalKinderen = Math.max(0, parseInt(opties.kinderen, 10) || 0);
    var aantalBaby = Math.max(0, parseInt(opties.baby, 10) || 0);
    var metLeeftijden = Boolean(vastAantal && uitreisdatum);
    var aantalVolwassenen = Math.max(0, vastAantal - aantalKinderen - aantalBaby);
    var uitreisTekst = "";
    if (uitreisdatum) {
      try {
        uitreisTekst = new Date(uitreisdatum + "T12:00:00Z").toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
      } catch (fout) { uitreisTekst = uitreisdatum; }
    }
    // Which category traveller i (1-based) was booked as.
    function geboektAls(i) {
      if (i <= aantalVolwassenen) return "volwassene";
      return i <= aantalVolwassenen + aantalKinderen ? "kind" : "baby";
    }

    if (opties.eigenVlucht && uitleg) {
      uitleg.textContent = "Vul je naam precies zo in als in je paspoort.";
    }

    /* The line under the heading says what Joey books with these details.
       With an own flight (or own transport) that part is left out, so the
       page never says Joey books a flight the traveller arranges. */
    var kopNotitie = form.querySelector(".checkout-kop__note");
    if (kopNotitie && (opties.eigenVlucht || !metAuto)) {
      var watJoeyBoekt = opties.eigenVlucht ? (metAuto ? "je huurauto" : "je reis") : "je vlucht";
      kopNotitie.textContent = "Met deze gegevens boekt Joey " + watJoeyBoekt + ". Velden met een * zijn verplicht.";
    }

    /* Without a rental car the car block and its confirmations disappear;
       disabled fields are skipped by the browser and by the checks below. */
    if (!metAuto) {
      autoBlok.hidden = true;
      bestuurderSelect.disabled = true;
      form.querySelectorAll("[data-alleen-auto]").forEach(function (blok) {
        blok.hidden = true;
        blok.querySelectorAll("input").forEach(function (input) { input.disabled = true; });
      });
    }

    /* Head count: fixed when it came from the booking, otherwise asked here
       (a payment link from Joey carries only an amount). */
    if (vastAantal) {
      aantalVeld.hidden = true;
      aantalInput.disabled = true;
    } else {
      aantalVeld.hidden = false;
      var eerder = parseInt(opgeslagen.aantal, 10);
      if (eerder >= 1 && eerder <= MAX_REIZIGERS) aantalInput.value = String(eerder);
    }

    function aantal() {
      if (vastAantal) return vastAantal;
      var getal = parseInt(aantalInput.value, 10);
      if (!(getal >= 1)) return 1;
      return Math.min(getal, MAX_REIZIGERS);
    }

    // Values typed so far, keyed by field id, so re-rendering keeps them.
    var waarden = opgeslagen.velden || {};

    function renderReizigers() {
      form.querySelectorAll("#reizigersLijst input").forEach(function (input) {
        waarden[input.id] = input.value;
      });
      lijst.textContent = "";

      for (var i = 1; i <= aantal(); i++) {
        var blok = document.createElement("fieldset");
        blok.className = "checkout-reiziger";
        var legend = document.createElement("legend");
        legend.className = "booking__legend booking__legend--klein";
        legend.textContent = "Reiziger " + i;
        if (metLeeftijden && aantalKinderen + aantalBaby > 0) {
          var soort = CATEGORIE_TEKST[geboektAls(i)];
          legend.textContent += " (" + soort.naam + ", " + soort.leeftijd + ")";
        }
        blok.appendChild(legend);

        var grid = document.createElement("div");
        grid.className = "form-grid";
        [
          { id: "reiziger" + i + "Voornamen", label: "Voornaam of voornamen (zoals in paspoort)", autocomplete: i === 1 ? "given-name" : "off", maxLength: 100 },
          { id: "reiziger" + i + "Achternaam", label: "Achternaam (zoals in paspoort)", autocomplete: i === 1 ? "family-name" : "off", maxLength: 100 },
          { id: "reiziger" + i + "Geboortedatum", label: "Geboortedatum", type: "date", autocomplete: i === 1 ? "bday" : "off", max: vandaag },
          { id: "reiziger" + i + "Nationaliteit", label: "Nationaliteit", autocomplete: "off", maxLength: 60 }
        ].forEach(function (veldOpties) {
          var veld = maakVeld(veldOpties);
          var input = veld.querySelector("input");
          if (waarden[veldOpties.id]) input.value = waarden[veldOpties.id];
          if (metLeeftijden && veldOpties.type === "date") input.setAttribute("data-geboekt-als", geboektAls(i));
          grid.appendChild(veld);
        });
        blok.appendChild(grid);
        lijst.appendChild(blok);
      }
      vulBestuurders();
    }

    function reizigerNaam(i) {
      var voor = form.querySelector("#reiziger" + i + "Voornamen");
      var achter = form.querySelector("#reiziger" + i + "Achternaam");
      var naam = ((voor ? voor.value : "") + " " + (achter ? achter.value : "")).trim();
      return naam || "Reiziger " + i;
    }

    // The main driver list follows the traveller names as they are typed.
    function vulBestuurders() {
      if (!metAuto) return;
      var gekozen = bestuurderSelect.value || opgeslagen.bestuurder || "";
      bestuurderSelect.textContent = "";
      var leeg = document.createElement("option");
      leeg.value = "";
      leeg.textContent = "Kies een reiziger";
      bestuurderSelect.appendChild(leeg);
      for (var i = 1; i <= aantal(); i++) {
        var optie = document.createElement("option");
        optie.value = String(i);
        optie.textContent = reizigerNaam(i);
        bestuurderSelect.appendChild(optie);
      }
      // A single traveller is always the driver.
      if (aantal() === 1) gekozen = "1";
      if (parseInt(gekozen, 10) <= aantal()) bestuurderSelect.value = gekozen;
    }

    function bewaar() {
      form.querySelectorAll("#reizigersLijst input").forEach(function (input) {
        waarden[input.id] = input.value;
      });
      schrijfOpslag({
        aantal: vastAantal ? "" : aantalInput.value,
        velden: waarden,
        email: form.querySelector("#contactEmail").value,
        telefoon: form.querySelector("#contactTelefoon").value,
        bestuurder: metAuto ? bestuurderSelect.value : ""
      });
    }

    // The age on the arrival day of a date of birth field, or NaN.
    function leeftijdVan(input) {
      return leeftijdOp(input.value, uitreisdatum);
    }
    // Does this date of birth give the category it was booked as?
    function leeftijdKlopt(input) {
      var verwacht = input.getAttribute("data-geboekt-als");
      if (!verwacht || !input.value) return true;
      return categorieVoorLeeftijd(leeftijdVan(input)) === verwacht;
    }
    // The main driver must be old enough to rent the car.
    function bestuurderOudGenoeg() {
      if (!metLeeftijden || !metAuto) return true;
      var nr = parseInt(bestuurderSelect.value, 10);
      var veld = nr >= 1 ? form.querySelector("#reiziger" + nr + "Geboortedatum") : null;
      if (!veld || !veld.value) return true;
      return leeftijdVan(veld) >= MIN_LEEFTIJD_BESTUURDER;
    }

    function foutMelding(input) {
      var v = input.validity;
      if (input.getAttribute("data-geboekt-als") && input.value && !leeftijdKlopt(input)) {
        var soort = CATEGORIE_TEKST[input.getAttribute("data-geboekt-als")];
        return "Je boekte een " + soort.naam + " (" + soort.leeftijd + " op de dag van aankomst" +
          (uitreisTekst ? ", " + uitreisTekst : "") + "). Deze geboortedatum past daar niet bij. " +
          "Controleer de datum, of pas het aantal volwassenen, kinderen en baby's aan in de kalender.";
      }
      if (input.tagName === "SELECT" && input.value && !bestuurderOudGenoeg()) {
        return "De hoofdbestuurder moet " + MIN_LEEFTIJD_BESTUURDER + " jaar of ouder zijn op de dag van aankomst. Kies een andere reiziger.";
      }
      // Only the general terms checkbox is required.
      if (input.type === "checkbox") return "Ga akkoord met de algemene voorwaarden om verder te gaan.";
      if (input.tagName === "SELECT") return "Kies wie de hoofdbestuurder is.";
      if (v.valueMissing || !input.value.trim()) {
        if (input.type === "date") return "Vul de geboortedatum in.";
        return "Vul dit veld in.";
      }
      if (input.type === "email" && (v.typeMismatch || !EMAIL_PATROON.test(input.value.trim()))) {
        return "Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.";
      }
      if (input.type === "date") return "Vul een geboortedatum in het verleden in.";
      if (input.id === "aantalReizigers") return "Kies 1 tot en met " + MAX_REIZIGERS + " reizigers.";
      return "Controleer dit veld.";
    }

    function isGeldig(input) {
      if (!input.checkValidity()) return false;
      if (input.type === "checkbox") return true;
      if (input.tagName !== "SELECT" && !input.value.trim()) return false;
      if (input.type === "email" && !EMAIL_PATROON.test(input.value.trim())) return false;
      if (input.type === "date" && input.value > vandaag) return false;
      if (input.type === "date" && !leeftijdKlopt(input)) return false;
      if (input.tagName === "SELECT" && !bestuurderOudGenoeg()) return false;
      return true;
    }

    function toonVeldFout(input, tekst) {
      var fout = document.getElementById(input.id + "Fout");
      if (tekst) {
        input.setAttribute("aria-invalid", "true");
        if (fout) { fout.textContent = tekst; fout.hidden = false; }
      } else {
        input.removeAttribute("aria-invalid");
        if (fout) { fout.textContent = ""; fout.hidden = true; }
      }
    }

    function velden() {
      return Array.prototype.filter.call(
        form.querySelectorAll("input, select"),
        function (el) { return !el.disabled && el.required; }
      );
    }

    // Validates everything, shows the errors and returns the first bad field.
    function controleer() {
      var eersteFout = null;
      var aantalFouten = 0;
      velden().forEach(function (input) {
        if (isGeldig(input)) {
          toonVeldFout(input, "");
        } else {
          toonVeldFout(input, foutMelding(input));
          aantalFouten++;
          if (!eersteFout) eersteFout = input;
        }
      });
      // At least one traveller of 21 or older (rental car), once every field is fine.
      if (!aantalFouten && metLeeftijden) {
        var heeftOudere = false;
        for (var r = 1; r <= aantal(); r++) {
          var geboorte = form.querySelector("#reiziger" + r + "Geboortedatum");
          if (geboorte && leeftijdVan(geboorte) >= MIN_LEEFTIJD_BESTUURDER) heeftOudere = true;
        }
        if (!heeftOudere) {
          foutSamenvatting.textContent = "Minstens een reiziger moet " + MIN_LEEFTIJD_BESTUURDER +
            " jaar of ouder zijn op de dag van aankomst" + (metAuto ? " (nodig voor de huurauto)" : "") + ". Controleer de geboortedata.";
          foutSamenvatting.hidden = false;
          return form.querySelector("#reiziger1Geboortedatum");
        }
      }
      if (aantalFouten) {
        foutSamenvatting.textContent = aantalFouten === 1
          ? "Er is nog 1 veld dat niet klopt of ontbreekt. Kijk het even na."
          : "Er zijn nog " + aantalFouten + " velden die niet kloppen of ontbreken. Kijk ze even na.";
        foutSamenvatting.hidden = false;
      } else {
        foutSamenvatting.hidden = true;
        foutSamenvatting.textContent = "";
      }
      return eersteFout;
    }

    function verzamel() {
      var reizigers = [];
      for (var i = 1; i <= aantal(); i++) {
        reizigers.push({
          voornamen: form.querySelector("#reiziger" + i + "Voornamen").value.trim(),
          achternaam: form.querySelector("#reiziger" + i + "Achternaam").value.trim(),
          geboortedatum: form.querySelector("#reiziger" + i + "Geboortedatum").value,
          nationaliteit: form.querySelector("#reiziger" + i + "Nationaliteit").value.trim()
        });
      }
      return {
        reizigers: reizigers,
        email: form.querySelector("#contactEmail").value.trim(),
        telefoon: form.querySelector("#contactTelefoon").value.trim(),
        huurauto: metAuto,
        hoofdbestuurder: metAuto ? parseInt(bestuurderSelect.value, 10) : null,
        voorwaarden: form.querySelector("#akkoordVoorwaarden").checked,
        creditcard: metAuto ? form.querySelector("#akkoordCreditcard").checked : false,
        rijbewijs: metAuto ? form.querySelector("#akkoordRijbewijs").checked : false
      };
    }

    // Restore contact details; the confirmations are always ticked afresh.
    if (opgeslagen.email) form.querySelector("#contactEmail").value = opgeslagen.email;
    if (opgeslagen.telefoon) form.querySelector("#contactTelefoon").value = opgeslagen.telefoon;

    renderReizigers();

    if (!vastAantal) {
      aantalInput.addEventListener("change", function () {
        if (isGeldig(aantalInput)) {
          toonVeldFout(aantalInput, "");
          renderReizigers();
        } else {
          toonVeldFout(aantalInput, foutMelding(aantalInput));
        }
        bewaar();
      });
      // The number field has its own error element.
      aantalInput.setAttribute("aria-describedby", "aantalReizigersFout");
      if (!document.getElementById("aantalReizigersFout")) {
        var aantalFout = document.createElement("p");
        aantalFout.className = "field-error";
        aantalFout.id = "aantalReizigersFout";
        aantalFout.hidden = true;
        aantalVeld.appendChild(aantalFout);
      }
    }

    form.addEventListener("input", function (event) {
      var doel = event.target;
      if (/Voornamen$|Achternaam$/.test(doel.id)) vulBestuurders();
      bewaar();
    });

    // Once a field has shown an error, clear it as soon as it is fixed.
    form.addEventListener("change", function (event) {
      var doel = event.target;
      if (doel.getAttribute("aria-invalid") === "true" && isGeldig(doel)) toonVeldFout(doel, "");
      // A date of birth that does not give the booked category (or a driver
      // who is too young) is reported straight away, not only on submit.
      if (metLeeftijden && ((doel.type === "date" && doel.getAttribute("data-geboekt-als")) || doel === bestuurderSelect) &&
          doel.value && !isGeldig(doel)) {
        toonVeldFout(doel, foutMelding(doel));
      }
      // Changing a date of birth can also settle the driver choice.
      if (metLeeftijden && metAuto && doel.type === "date" && bestuurderSelect.getAttribute("aria-invalid") === "true" && isGeldig(bestuurderSelect)) {
        toonVeldFout(bestuurderSelect, "");
      }
      bewaar();
    });
    form.addEventListener("focusout", function (event) {
      var doel = event.target;
      if (doel.getAttribute("aria-invalid") === "true" && isGeldig(doel)) toonVeldFout(doel, "");
    });

    function gegevens() {
      var eersteFout = controleer();
      if (eersteFout) {
        eersteFout.focus();
        return null;
      }
      return verzamel();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var resultaat = gegevens();
      if (resultaat && typeof opties.onKlaar === "function") opties.onKlaar(resultaat);
    });

    return { gegevens: gegevens };
  }

  window.NovakseReisgegevens = { init: init };
})();
