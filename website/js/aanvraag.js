/* ==========================================================================
   Aanvraag- en contactformulieren (homepage, contact, schaatslessen,
   schaatsonderhoud)

   Verstuurt elk herkend formulier via /api/send-aanvraag, die de e-mail
   rechtstreeks naar Joey stuurt. Onderwerp en berichttekst worden opgebouwd
   uit de labels die al in het formulier staan, zodat dit script in elke
   taalversie werkt zonder eigen vertalingen te onderhouden.
   ========================================================================== */
(function () {
  "use strict";

  var FORMULIER_IDS = ["requestForm", "lessonRequestForm", "contactForm", "onderhoudForm"];

  function veldWaarde(veld) {
    if (veld.tagName === "SELECT") {
      return veld.options[veld.selectedIndex] ? veld.options[veld.selectedIndex].text.trim() : "";
    }
    return veld.value.trim();
  }

  // Twee opmaakvarianten komen voor: een los <label for="id"> naast het veld,
  // of een <label> die het veld met een <span> als tekst omsluit.
  function veldLabel(veldGroep, veld) {
    if (veld.id) {
      var expliciet = veldGroep.querySelector('label[for="' + veld.id + '"]');
      if (expliciet) return expliciet.textContent.trim();
    }
    var label = veldGroep.tagName === "LABEL" ? veldGroep : veldGroep.querySelector("label");
    if (!label) return "";
    var span = label.querySelector("span");
    return (span ? span.textContent : label.textContent).trim();
  }

  function onderwerpVoor(form) {
    var sectie = form.closest(".request");
    var eyebrow = sectie && sectie.querySelector(".eyebrow");
    if (eyebrow) return eyebrow.textContent.trim();
    return document.title.split(" — ")[0].split(" | ")[0].trim();
  }

  function berichtVoor(form) {
    var regels = [];
    form.querySelectorAll(".form-field").forEach(function (veldGroep) {
      var veld = veldGroep.querySelector("input, select, textarea");
      if (!veld) return;
      var label = veldLabel(veldGroep, veld);
      var waarde = veldWaarde(veld);
      if (!label || !waarde) return;
      regels.push(label + ": " + waarde);
    });
    return regels.join("\n");
  }

  function naamUitFormulier(form) {
    var delen = ["voornaam", "naam", "achternaam"]
      .map(function (naam) { return form.querySelector('[name="' + naam + '"]'); })
      .filter(Boolean)
      .map(function (veld) { return veld.value.trim(); })
      .filter(Boolean);
    return delen.join(" ");
  }

  function koppel(form) {
    var knop = form.querySelector('button[type="submit"]');
    var foutEl = form.querySelector(".form-status--error");
    var succesEl = form.querySelector(".form-status--success");
    var noteEl = form.querySelector(".form-note");
    if (!knop || !foutEl || !succesEl) return;

    var oorspronkelijkeKnopTekst = knop.textContent;

    form.addEventListener("submit", function (event) {
      if (!form.checkValidity()) return; // native validatiemeldingen laten zien
      event.preventDefault();

      var emailVeld = form.querySelector('input[type="email"]');
      var email = emailVeld ? emailVeld.value.trim() : "";
      var naam = naamUitFormulier(form);
      var onderwerp = onderwerpVoor(form) + (naam ? " — " + naam : "");
      var hpVeld = form.querySelector('input[name="website"]');

      foutEl.hidden = true;
      knop.disabled = true;
      knop.textContent = oorspronkelijkeKnopTekst + "…";

      fetch("/api/send-aanvraag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onderwerp: onderwerp,
          bericht: berichtVoor(form),
          email: email,
          website: hpVeld ? hpVeld.value : ""
        })
      })
        .then(function (respons) {
          return respons.json().then(function (data) {
            return { ok: respons.ok, data: data };
          });
        })
        .then(function (resultaat) {
          if (!resultaat.ok) {
            throw new Error((resultaat.data && resultaat.data.error) || "Er ging iets mis.");
          }
          knop.textContent = oorspronkelijkeKnopTekst;
          if (noteEl) noteEl.hidden = true;
          succesEl.hidden = false;
        })
        .catch(function () {
          // De foutmelding staat al vertaald in de pagina zelf (zie form-status--error).
          foutEl.hidden = false;
          knop.disabled = false;
          knop.textContent = oorspronkelijkeKnopTekst;
        });
    });
  }

  FORMULIER_IDS.forEach(function (id) {
    var form = document.getElementById(id);
    if (form) koppel(form);
  });
})();
