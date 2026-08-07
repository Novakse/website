/* ==========================================================================
   Reisaanvraagformulier (homepage, sectie #aanvraag)

   Verstuurt het formulier via /api/send-aanvraag, die de e-mail rechtstreeks
   naar Joey stuurt. Onderwerp en berichttekst worden opgebouwd uit de labels
   die al in het formulier staan, zodat dit script in elke taalversie werkt
   zonder eigen vertalingen te onderhouden.
   ========================================================================== */
(function () {
  "use strict";

  var form = document.getElementById("requestForm");
  if (!form) return;

  var knop = document.getElementById("aanvraagKnop");
  var foutEl = document.getElementById("aanvraagFout");
  var succesEl = document.getElementById("aanvraagSucces");
  var noteEl = document.getElementById("formNote");
  if (!knop || !foutEl || !succesEl) return;

  var oorspronkelijkeKnopTekst = knop.textContent;

  var eyebrow = form.closest(".request").querySelector(".eyebrow");
  var onderwerpPrefix = eyebrow ? eyebrow.textContent.trim() : "Reisaanvraag";

  function veldWaarde(veld) {
    if (veld.tagName === "SELECT") {
      return veld.options[veld.selectedIndex] ? veld.options[veld.selectedIndex].text.trim() : "";
    }
    return veld.value.trim();
  }

  function bericht() {
    var regels = [];
    form.querySelectorAll(".form-field").forEach(function (veldGroep) {
      var label = veldGroep.querySelector("label");
      var veld = veldGroep.querySelector("input, select, textarea");
      if (!label || !veld) return;
      var waarde = veldWaarde(veld);
      if (!waarde) return;
      regels.push(label.textContent.trim() + ": " + waarde);
    });
    return regels.join("\n");
  }

  form.addEventListener("submit", function (event) {
    if (!form.checkValidity()) return; // native validatiemeldingen laten zien
    event.preventDefault();

    var voornaam = document.getElementById("voornaam").value.trim();
    var achternaam = document.getElementById("achternaam").value.trim();
    var email = document.getElementById("email").value.trim();
    var onderwerp = onderwerpPrefix + (voornaam || achternaam ? " — " + (voornaam + " " + achternaam).trim() : "");

    foutEl.hidden = true;
    knop.disabled = true;
    knop.textContent = oorspronkelijkeKnopTekst + "…";

    fetch("/api/send-aanvraag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onderwerp: onderwerp, bericht: bericht(), email: email })
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
})();
