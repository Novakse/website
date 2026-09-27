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
       onKlaar: function (gegevens) {} // called after a valid submit
     });
     stap.gegevens()        // validated data, or null (shows the errors)

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

    if (opties.eigenVlucht && uitleg) {
      uitleg.textContent = "Vul je naam precies zo in als in je paspoort.";
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

    function foutMelding(input) {
      var v = input.validity;
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
