/* ==========================================================================
   Betaalpagina

   Leest reis en bedrag uit het webadres (die zet Joey erin als hij een
   betaallink stuurt, bijvoorbeeld: uitchecken.html?reis=Finland&bedrag=59700).
   Het bedrag staat in hele centen. Bij het doorgaan wordt er een Mollie-
   betaling aangemaakt via /api/create-payment en stuurt de browser door
   naar de betaalomgeving van Mollie.
   ========================================================================== */
(function () {
  "use strict";

  var MAIL = "schaatsennovakse@outlook.com";

  var form = document.getElementById("betaalformulier");
  var inhoud = document.getElementById("checkoutInhoud");
  var geenBedrag = document.getElementById("geenBedrag");
  var reisNaamEl = document.getElementById("reisNaam");
  var omschrijvingEl = document.getElementById("omschrijvingTekst");
  var bedragEl = document.getElementById("bedragTekst");
  var foutEl = document.getElementById("betaalFout");
  var knop = document.getElementById("betaalKnop");
  if (!form) return;

  var params = new URLSearchParams(window.location.search);
  var reis = params.get("reis") || "Novakse reis";
  var bedragCent = parseInt(params.get("bedrag"), 10);

  function euro(cent) {
    return "€" + (cent / 100).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (!bedragCent || bedragCent < 100) {
    inhoud.hidden = true;
    geenBedrag.hidden = false;
    return;
  }

  reisNaamEl.textContent = reis;
  omschrijvingEl.textContent = reis;
  bedragEl.textContent = euro(bedragCent);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    foutEl.hidden = true;
    knop.disabled = true;
    knop.textContent = "Bezig...";

    var gekozen = form.querySelector('input[name="methode"]:checked');
    var methode = gekozen ? gekozen.value : "ideal";

    fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bedrag: bedragCent, omschrijving: reis, methode: methode })
    })
      .then(function (respons) {
        return respons.json().then(function (data) {
          return { ok: respons.ok, data: data };
        });
      })
      .then(function (resultaat) {
        if (!resultaat.ok || !resultaat.data.checkoutUrl) {
          throw new Error((resultaat.data && resultaat.data.error) || "Er ging iets mis.");
        }
        window.location.href = resultaat.data.checkoutUrl;
      })
      .catch(function (fout) {
        foutEl.hidden = false;
        foutEl.textContent = "Betalen lukte niet: " + fout.message + ". Probeer het opnieuw of neem contact op via " + MAIL + ".";
        knop.disabled = false;
        knop.textContent = "Doorgaan naar betalen";
      });
  });
})();
