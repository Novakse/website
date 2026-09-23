/* ==========================================================================
   Betaalpagina

   Er zijn twee manieren waarop je hier terechtkomt.

   1. Via een betaallink die Joey stuurt, bijvoorbeeld
      uitchecken.html?reis=Finland&bedrag=59700. Het bedrag staat in hele
      centen en komt uit de link.

   2. Via de kalender op de Falun-pagina, bijvoorbeeld
      uitchecken.html?reis=Falun&aankomst=2027-01-10&dagen=4&vlucht=zelf.
      Dan staat er geen bedrag in de link: dat wordt opgehaald bij
      /api/falun-prijs. De server rekent het uit, niet de browser, zodat er
      niet met het bedrag te knoeien valt.

   Bij het doorgaan wordt er een Stripe Checkout-sessie aangemaakt via
   /api/create-payment en stuurt de browser door naar de betaalomgeving.
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

  /* De keuzes uit de Falun-kalender. Staat aankomst erin, dan komt het bedrag
     van de server en niet uit het webadres. */
  var falunKeuze = null;
  if (reis === "Falun" && params.get("aankomst")) {
    falunKeuze = {
      reis: "Falun",
      aankomst: params.get("aankomst"),
      dagen: params.get("dagen"),
      vlucht: params.get("vlucht") || "",
      auto: params.get("auto") || "",
      begeleiding: params.get("begeleiding") || ""
    };
  }

  function euro(cent) {
    return "€" + (cent / 100).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function toonNiets() {
    inhoud.hidden = true;
    geenBedrag.hidden = false;
  }

  if (falunKeuze) {
    reisNaamEl.textContent = reis;
    omschrijvingEl.textContent = reis;
    bedragEl.textContent = "...";

    // De standaardtekst gaat over een betaallink van Joey; hier heeft de
    // bezoeker zijn reis zelf in de kalender samengesteld.
    var introEl = document.querySelector(".booking__intro");
    if (introEl) {
      introEl.textContent = "Dit is de reis die je in de kalender hebt samengesteld. Kies hieronder hoe je wilt betalen.";
    }

    fetch("/api/falun-prijs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(falunKeuze)
    })
      .then(function (respons) {
        return respons.json().then(function (data) {
          return { ok: respons.ok, data: data };
        });
      })
      .then(function (resultaat) {
        if (!resultaat.ok || typeof resultaat.data.bedrag !== "number") {
          throw new Error((resultaat.data && resultaat.data.error) || "Er ging iets mis.");
        }
        bedragCent = Math.round(resultaat.data.bedrag * 100);
        omschrijvingEl.textContent = resultaat.data.omschrijving;
        bedragEl.textContent = euro(bedragCent);
      })
      .catch(function () {
        toonNiets();
      });
  } else {
    if (!bedragCent || bedragCent < 100) {
      toonNiets();
      return;
    }

    reisNaamEl.textContent = reis;
    omschrijvingEl.textContent = reis;
    bedragEl.textContent = euro(bedragCent);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    foutEl.hidden = true;
    knop.disabled = true;
    knop.textContent = "Bezig...";

    var gekozen = form.querySelector('input[name="methode"]:checked');
    var methode = gekozen ? gekozen.value : "ideal";

    /* Bij Falun gaan de keuzes mee in plaats van een bedrag: de server rekent
       het daar opnieuw uit. */
    var lading = { bedrag: bedragCent, omschrijving: reis, methode: methode };
    if (falunKeuze) {
      lading = {
        reis: falunKeuze.reis,
        aankomst: falunKeuze.aankomst,
        dagen: falunKeuze.dagen,
        vlucht: falunKeuze.vlucht,
        auto: falunKeuze.auto,
        begeleiding: falunKeuze.begeleiding,
        methode: methode
      };
    }

    fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lading)
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
