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

   3. Via de kalender op de pagina van Luleå, Orsa, de Weissensee of Finland,
      bijvoorbeeld
      uitchecken.html?reis=lulea&van=2027-01-10&tot=2027-01-14&personen=2.
      Ook hier staat geen bedrag in de link: dat komt van /api/reis-prijs, en
      /api/create-payment rekent het bij het betalen opnieuw uit.

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
      personen: params.get("personen"),
      vlucht: params.get("vlucht") || "",
      auto: params.get("auto") || "",
      begeleiding: params.get("begeleiding") || ""
    };
  }

  /* Trips booked through their own price calendar (van/tot/personen). The key
     is the value of ?reis=; the page is where the visitor came from. */
  var KALENDER_REIZEN = {
    lulea: { naam: "Luleå", pagina: "lulea.html" },
    orsa: { naam: "Orsa", pagina: "orsa.html", begeleiding: true },
    weissensee: { naam: "Weissensee", pagina: "weissensee.html" },
    finland: { naam: "Finland", pagina: "finland.html" }
  };

  /* A calendar link always carries van; a payment link from Joey
     (?reis=Finland&bedrag=...) does not, so that one keeps working as before. */
  var reisKeuze = null;
  var reisSleutel = reis.toLowerCase();
  if (!falunKeuze && KALENDER_REIZEN.hasOwnProperty(reisSleutel) && params.get("van")) {
    var reisInfo = KALENDER_REIZEN[reisSleutel];
    reisKeuze = {
      reis: reisSleutel,
      van: params.get("van") || "",
      tot: params.get("tot") || "",
      personen: params.get("personen") || "",
      begeleiding: reisInfo.begeleiding ? params.get("begeleiding") || "" : ""
    };
  }

  function euro(cent) {
    return "€" + (cent / 100).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function toonNiets() {
    inhoud.hidden = true;
    geenBedrag.hidden = false;
  }

  var DATUM_PATROON = /^\d{4}-\d{2}-\d{2}$/;

  // "2027-01-10" -> "10 januari 2027". Returns "" for anything that is not a
  // real date, so the page never shows "Invalid Date".
  function datumTekst(iso) {
    if (!DATUM_PATROON.test(iso)) return "";
    var datum = new Date(iso + "T12:00:00Z");
    if (isNaN(datum.getTime())) return "";
    return datum.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  }

  function aantalTekst(aantal, enkelvoud, meervoud) {
    return aantal + " " + (aantal === 1 ? enkelvoud : meervoud);
  }

  /* The calendar trips get their own error: no payment link from Joey is
     involved, so point back to the trip page instead. */
  function toonReisFout(info, detail) {
    geenBedrag.textContent = "";

    var tekst = document.createElement("p");
    tekst.className = "booking__note";
    tekst.textContent = "We konden de prijs van deze reis nu niet ophalen" +
      (detail ? " (" + detail.replace(/[.\s]+$/, "") + ")" : "") +
      ". Ga terug naar de kalender en kies je reis opnieuw, of neem contact op via " + MAIL + ".";

    var terug = document.createElement("a");
    terug.className = "btn btn--outline-dark";
    terug.href = info.pagina;
    terug.textContent = "Terug naar " + info.naam;

    geenBedrag.appendChild(tekst);
    geenBedrag.appendChild(terug);

    // "Choose how you want to pay" makes no sense without a price.
    var intro = document.querySelector(".booking__intro");
    if (intro) intro.hidden = true;
    toonNiets();
  }

  // Summary lines above the total, in the same style as the Falun calendar.
  function toonReisRegels(regels) {
    var lijst = document.createElement("dl");
    lijst.className = "booking__lines";
    regels.forEach(function (regel) {
      var dt = document.createElement("dt");
      dt.textContent = regel[0];
      var dd = document.createElement("dd");
      dd.textContent = regel[1];
      lijst.appendChild(dt);
      lijst.appendChild(dd);
    });
    lijst.style.marginTop = "0";

    var totaal = bedragEl.parentNode;
    totaal.parentNode.insertBefore(lijst, totaal);
    totaal.classList.remove("booking__total--standalone");
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
  } else if (reisKeuze) {
    var info = KALENDER_REIZEN[reisKeuze.reis];
    reisNaamEl.textContent = info.naam;
    omschrijvingEl.textContent = "Totaal";
    bedragEl.textContent = "...";

    var introTekst = document.querySelector(".booking__intro");
    if (introTekst) {
      introTekst.textContent = "Dit is de reis die je in de kalender hebt samengesteld. Kies hieronder hoe je wilt betalen.";
    }

    var personenAantal = parseInt(reisKeuze.personen, 10);
    var begeleidingDagen = parseInt(reisKeuze.begeleiding, 10) || 0;

    if (!datumTekst(reisKeuze.van) || !datumTekst(reisKeuze.tot) || !(personenAantal >= 1)) {
      toonReisFout(info, "");
    } else {
      var vraag = new URLSearchParams({
        reis: reisKeuze.reis,
        van: reisKeuze.van,
        tot: reisKeuze.tot,
        personen: String(personenAantal)
      });
      if (begeleidingDagen > 0) vraag.set("begeleiding", String(begeleidingDagen));

      fetch("/api/reis-prijs?" + vraag.toString())
        .then(function (respons) {
          return respons.json().then(function (data) {
            return { ok: respons.ok, data: data || {} };
          });
        })
        .then(function (resultaat) {
          var data = resultaat.data;
          if (!resultaat.ok || data.fout || typeof data.bedrag !== "number" || !isFinite(data.bedrag) || data.bedrag <= 0) {
            var fout = new Error("quote");
            fout.detail = typeof data.fout === "string" ? data.fout : "";
            throw fout;
          }
          bedragCent = Math.round(data.bedrag * 100);

          var regels = [
            ["Reis", info.naam],
            ["Aankomst", datumTekst(reisKeuze.van)],
            ["Vertrek", datumTekst(reisKeuze.tot)]
          ];
          if (typeof data.nachten === "number" && data.nachten > 0) {
            regels.push(["Nachten", String(data.nachten)]);
          }
          regels.push(["Personen", String(personenAantal)]);
          if (begeleidingDagen > 0) {
            regels.push(["Begeleiding", aantalTekst(begeleidingDagen, "dag", "dagen")]);
          }
          if (typeof data.perPersoon === "number" && isFinite(data.perPersoon) && data.perPersoon > 0) {
            regels.push(["Per persoon", euro(Math.round(data.perPersoon * 100))]);
          }
          toonReisRegels(regels);

          bedragEl.textContent = euro(bedragCent);
        })
        .catch(function (fout) {
          toonReisFout(info, (fout && fout.detail) || "");
        });
    }
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
        personen: falunKeuze.personen,
        vlucht: falunKeuze.vlucht,
        auto: falunKeuze.auto,
        begeleiding: falunKeuze.begeleiding,
        methode: methode
      };
    } else if (reisKeuze) {
      lading = {
        reis: reisKeuze.reis,
        van: reisKeuze.van,
        tot: reisKeuze.tot,
        personen: reisKeuze.personen,
        begeleiding: reisKeuze.begeleiding,
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
        foutEl.textContent = "Betalen lukte niet: " + fout.message.replace(/[.\s]+$/, "") + ". Probeer het opnieuw of neem contact op via " + MAIL + ".";
        knop.disabled = false;
        knop.textContent = "Doorgaan naar betalen";
      });
  });
})();
