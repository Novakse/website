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

   3. Via de kalender op de pagina van Luleå, Orsa, de Weissensee, Finland of
      Wellness & schaatsen, bijvoorbeeld
      uitchecken.html?reis=lulea&van=2027-01-10&tot=2027-01-14&personen=2
      (met &vlucht=zelf als de bezoeker zijn vlucht zelf regelt).
      Ook hier staat geen bedrag in de link: dat komt van /api/reis-prijs, en
      /api/create-payment rekent het bij het betalen opnieuw uit.

   Before paying, every trip goes through the "Reisgegevens" step
   (js/reisgegevens.js): travellers for the flight, contact details, the main
   driver of the rental car and the required confirmations. Only once that
   form is valid does the payment form appear, and the details are sent along
   to /api/create-payment, which checks them again.

   Falun and Wellness & schaatsen also get the optional block "Activiteiten
   bijboeken" (see startActiviteiten below); those activities are paid in the
   same checkout.

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
  var gegevensForm = document.getElementById("reisgegevensFormulier");
  var stappen = document.getElementById("checkoutStappen");
  if (!form || !gegevensForm) return;

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
      kinderen: params.get("kinderen") || "",
      baby: params.get("baby") || "",
      vlucht: params.get("vlucht") || "",
      auto: params.get("auto") || "",
      begeleiding: params.get("begeleiding") || ""
    };
  }

  // Where a Falun booking came from, for the "back to the calendar" link.
  var FALUN_INFO = { naam: "Falun", pagina: "falun.html" };

  /* A whole number written as digits only ("3"), or "" for an empty value.
     Anything else ("3abc", "-1", "2.5") gives null: the server refuses it
     too, so the page must not show a price for it. */
  function alsAantalTekst(waarde) {
    if (waarde === null || waarde === undefined || waarde === "") return "";
    return /^\d{1,3}$/.test(waarde) ? String(parseInt(waarde, 10)) : null;
  }

  /* Children (2-11) and babies (0-1) are part of personen. Returns
     { kinderen, baby } as whole numbers, or null when a value is not a plain
     number or would leave no adult (12 and older). The server checks the same
     and sets the price; this only keeps the page from showing a price for a
     link the server would refuse. */
  function leesKinderen(keuze, personen) {
    var k = alsAantalTekst(keuze.kinderen);
    var b = alsAantalTekst(keuze.baby);
    if (k === null || b === null) return null;
    var kinderen = k ? parseInt(k, 10) : 0;
    var baby = b ? parseInt(b, 10) : 0;
    if (personen - kinderen - baby < 1) return null;
    return { kinderen: kinderen, baby: baby };
  }

  /* Trips booked through their own price calendar (van/tot/personen). The key
     is the value of ?reis=; the page is where the visitor came from. */
  var KALENDER_REIZEN = {
    lulea: { naam: "Luleå", pagina: "lulea.html" },
    orsa: { naam: "Orsa", pagina: "orsa.html", begeleiding: true },
    weissensee: { naam: "Weissensee", pagina: "weissensee.html" },
    finland: { naam: "Finland", pagina: "finland.html" },
    wellness: { naam: "Wellness & schaatsen", pagina: "wellness.html" }
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
      kinderen: params.get("kinderen") || "",
      baby: params.get("baby") || "",
      begeleiding: reisInfo.begeleiding ? params.get("begeleiding") || "" : "",
      // Own flight from the calendar checkbox; only "zelf" counts.
      vlucht: params.get("vlucht") === "zelf" ? "zelf" : ""
    };
  }

  function euro(cent) {
    return "€" + (cent / 100).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function toonNiets() {
    inhoud.hidden = true;
    if (stappen) stappen.hidden = true;
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

    tekst.style.marginBottom = "1.25rem"; // room between the text and the button

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

    // Above the (still hidden) activities block, so the order stays: trip,
    // optional activities, total.
    var totaal = bedragEl.parentNode;
    totaal.parentNode.insertBefore(lijst, actBlok || totaal);
    totaal.classList.remove("booking__total--standalone");
  }

  /* ---- Activiteiten bijboeken (optional; Falun and Wellness only) ------
     One plain list under the trip: each activity with its price lines (one
     stepper per line). An activity with rentals has a "Spullen huren" button
     under it that shows those rentals. Rentals count only together with the
     same number of persons on the activity: the page raises the standaard
     tariff for that (ACT.aanvullen) and the server checks it (bereken).
     The catalogue is data/activiteiten.json; all prices and caps come from
     js/activiteiten-prijs.js (window.NovakseActiviteiten), which the server
     uses as well. The block only appears once the trip price is known.
     The checkbox ("Ik wil huurspullen of activiteiten bijboeken") is the
     outer switch. Unticked, nothing is added to the total or sent; the
     choices made so far come back when it is ticked again. The choice is
     kept in ?act= (e.g. act=husky-lunchtocht:2), so a reload keeps it. ---- */
  var ACT = window.NovakseActiviteiten;
  var actBlok = document.getElementById("activiteitenBlok");
  var actAan = document.getElementById("activiteitenAan");
  var actPaneel = document.getElementById("activiteitenPaneel");
  var actLijst = document.getElementById("activiteitenLijst");
  var actTelling = document.getElementById("activiteitenTelling");
  var actOverzicht = document.getElementById("activiteitenOverzicht");
  var actKlaar = Boolean(ACT && actBlok && actAan && actPaneel && actLijst && actTelling && actOverzicht);

  // Filled once the block is shown; null means: no activities on this page.
  var activiteiten = null;

  // Only these trips offer activities, so only they load the catalogue.
  var actSoort = falunKeuze ? "falun" : (reisKeuze && reisKeuze.reis === "wellness" ? "wellness" : "");
  var actCatalogus = actKlaar && actSoort
    ? fetch("data/activiteiten.json")
        .then(function (respons) { return respons.ok ? respons.json() : null; })
        .catch(function () { return null; })
    : null;

  function kopieKeuze(keuze) {
    var uit = {};
    Object.keys(keuze).forEach(function (id) { if (keuze[id] > 0) uit[id] = keuze[id]; });
    return uit;
  }

  function actBereken(keuze) {
    var uitkomst = ACT.bereken(activiteiten.cat, activiteiten.soort, keuze, activiteiten.ctx);
    return uitkomst && !uitkomst.fout ? uitkomst : null;
  }

  /* The choice after one step (+1 or -1) on one line, or null when that step
     is not allowed: above a cap, below the persons a rental needs, or below
     zero. A plus on a rental raises the standaard tariff of its activity. */
  function stapKeuze(id, stap) {
    var aantal = activiteiten.keuze[id] || 0;
    if (!activiteiten.regels[id] || aantal + stap < 0) return null;
    var nieuw = kopieKeuze(activiteiten.keuze);
    nieuw[id] = aantal + stap;
    if (!nieuw[id]) delete nieuw[id];
    if (stap > 0) nieuw = ACT.aanvullen(activiteiten.cat, activiteiten.soort, nieuw, activiteiten.ctx);
    return actBereken(nieuw) ? nieuw : null;
  }

  function maak(tag, klasse, tekst) {
    var el = document.createElement(tag);
    if (klasse) el.className = klasse;
    if (tekst !== undefined) el.textContent = tekst;
    return el;
  }

  function maakStepKnop(teken, label, id, stap) {
    var knopEl = maak("button", "act-stepper__knop");
    knopEl.type = "button";
    knopEl.setAttribute("aria-label", label);
    knopEl.innerHTML = '<span aria-hidden="true">' + teken + "</span>";
    knopEl.addEventListener("click", function () { wijzigActiviteit(id, stap); });
    return knopEl;
  }

  // One price line with its stepper. metNaam: show the line's own name (a
  // single unnamed tariff is priced under the activity's name above it).
  function regelRij(lijn, metNaam) {
    var rij = maak("li", "act-regel");

    var tekst = maak("div", "act-regel__tekst");
    if (metNaam) tekst.appendChild(maak("p", "act-regel__naam", lijn.naam));
    if (lijn.detail) tekst.appendChild(maak("p", "act-regel__detail", lijn.detail));
    rij.appendChild(tekst);

    var prijs = maak("p", "act-regel__prijs");
    prijs.appendChild(maak("span", "act-regel__bedrag", ACT.euro(ACT.centen(lijn))));
    prijs.appendChild(maak("span", "act-regel__eenheid", ACT.eenheidTekst(lijn.eenheid)));
    var samen = maak("span", "act-regel__samen");
    samen.hidden = true;
    prijs.appendChild(samen);
    rij.appendChild(prijs);

    var stepper = maak("div", "act-stepper");
    stepper.setAttribute("role", "group");
    stepper.setAttribute("aria-label", lijn.titel + ", " + ACT.eenheidTekst(lijn.eenheid));
    var min = maakStepKnop("&minus;", "Eén minder: " + lijn.titel, lijn.id, -1);
    var waarde = maak("span", "act-stepper__waarde", "0");
    waarde.setAttribute("aria-live", "polite");
    var plus = maakStepKnop("+", "Eén meer: " + lijn.titel, lijn.id, 1);
    stepper.appendChild(min);
    stepper.appendChild(waarde);
    stepper.appendChild(plus);
    rij.appendChild(stepper);

    activiteiten.velden[lijn.id] = { rij: rij, min: min, plus: plus, waarde: waarde, samen: samen };
    return rij;
  }

  function toggleHuur(id) {
    activiteiten.open[id] = !activiteiten.open[id];
    tekenActiviteiten();
  }

  // The list: one item per activity, in the order of the JSON.
  function tekenLijst() {
    actLijst.textContent = "";
    activiteiten.acts.forEach(function (act) {
      var item = maak("li", "act-item");
      var kop = maak("div", "act-item__kop");
      kop.appendChild(maak("p", "act-item__naam", act.naam));
      if (act.detail) kop.appendChild(maak("p", "act-item__detail", act.detail));
      item.appendChild(kop);

      var eigen = (act.tarieven || []).map(function (t) { return activiteiten.regels[t.id]; }).filter(Boolean);
      if (eigen.length) {
        var lijstEigen = maak("ul", "act-item__regels");
        eigen.forEach(function (lijn) {
          // A single unnamed tariff has no line name of its own: the activity's
          // name above it is enough.
          var metNaam = eigen.length > 1 || lijn.naam !== act.naam;
          lijstEigen.appendChild(regelRij(lijn, metNaam));
        });
        item.appendChild(lijstEigen);
      } else {
        // Free activity: the rentals below it set the number of persons.
        var aantal = maak("p", "act-item__aantal");
        aantal.hidden = true;
        item.appendChild(aantal);
        activiteiten.aantalEls[act.id] = aantal;
      }
      if (act.gratis) item.appendChild(maak("p", "act-item__gratis", act.gratis));

      var huur = (act.huur || []).map(function (h) { return activiteiten.regels[h.id]; }).filter(Boolean);
      if (huur.length) {
        var paneelId = "huur-" + act.id;
        var knop = maak("button", "act-item__huurknop", "Spullen huren");
        knop.type = "button";
        knop.setAttribute("aria-controls", paneelId);
        knop.setAttribute("aria-expanded", "false");
        var paneel = maak("div", "act-item__huur");
        paneel.id = paneelId;
        paneel.hidden = true;
        var lijstHuur = maak("ul", "act-item__regels");
        huur.forEach(function (lijn) { lijstHuur.appendChild(regelRij(lijn, true)); });
        paneel.appendChild(lijstHuur);
        knop.addEventListener("click", function () { toggleHuur(act.id); });
        item.appendChild(knop);
        item.appendChild(paneel);
        activiteiten.huur[act.id] = { knop: knop, paneel: paneel };
      }
      actLijst.appendChild(item);
    });
  }

  // The choice that counts: nothing while the checkbox is unticked.
  function geldendeKeuze() {
    return activiteiten.aan ? kopieKeuze(activiteiten.keuze) : {};
  }

  // Keep the choice in the address, so a reload shows the same choice.
  function bewaarInAdres() {
    if (!window.history || !window.history.replaceState) return;
    var zoek = new URLSearchParams(window.location.search);
    var tekst = ACT.naarQuery(geldendeKeuze());
    if (tekst) zoek.set("act", tekst);
    else zoek.delete("act");
    var query = zoek.toString().replace(/%3A/gi, ":").replace(/%2C/gi, ",");
    try {
      window.history.replaceState(window.history.state, "", window.location.pathname + (query ? "?" + query : "") + window.location.hash);
    } catch (fout) { /* the choice still counts, it just is not in the address */ }
  }

  function tekenActiviteiten() {
    if (!actBereken(activiteiten.keuze)) { // should not happen: every change is checked first
      activiteiten.keuze = {};
    }
    // Unticked, the steppers keep their numbers but nothing is charged.
    var uitkomst = actBereken(geldendeKeuze()) || { regels: [], totaalCenten: 0 };
    activiteiten.uitkomst = uitkomst;

    actAan.checked = activiteiten.aan;
    actAan.setAttribute("aria-expanded", activiteiten.aan ? "true" : "false");
    actPaneel.hidden = !activiteiten.aan;

    Object.keys(activiteiten.velden).forEach(function (id) {
      var veld = activiteiten.velden[id];
      var aantal = activiteiten.keuze[id] || 0;
      veld.waarde.textContent = String(aantal);
      veld.min.setAttribute("aria-disabled", stapKeuze(id, -1) ? "false" : "true");
      veld.plus.setAttribute("aria-disabled", stapKeuze(id, 1) ? "false" : "true");
      veld.rij.classList.toggle("is-gekozen", aantal > 0);
      veld.samen.hidden = true;
    });

    // Free activities show the number of persons their rentals set.
    Object.keys(activiteiten.aantalEls).forEach(function (id) {
      var el = activiteiten.aantalEls[id];
      var act = activiteiten.acts.filter(function (a) { return a.id === id; })[0];
      var personen = act ? ACT.huurPersonen(act, activiteiten.keuze) : 0;
      el.textContent = personen + " personen";
      el.hidden = !personen;
    });

    Object.keys(activiteiten.huur).forEach(function (id) {
      var open = Boolean(activiteiten.open[id]);
      activiteiten.huur[id].knop.setAttribute("aria-expanded", open ? "true" : "false");
      activiteiten.huur[id].paneel.hidden = !open;
    });

    // Summary: trip, activities and every chosen line, then the total.
    actOverzicht.textContent = "";
    var gekozen = (uitkomst.regels || []).filter(function (regel) { return regel.aantal > 0; });
    gekozen.forEach(function (regel) {
      var veld = activiteiten.velden[regel.id];
      if (veld) {
        veld.samen.textContent = "Samen " + ACT.euro(regel.centen);
        veld.samen.hidden = false;
      }
    });
    var actCent = Math.round(uitkomst.totaalCenten) || 0;
    if (actCent > 0) {
      var regels = [["Reissom", euro(bedragCent), ""], ["Activiteiten", ACT.euro(actCent), "activiteiten__subtotaal"]];
      gekozen.forEach(function (regel) {
        regels.push([regel.aantal + " × " + (regel.huur ? "huur " : "") + regel.titel, ACT.euro(regel.centen), "activiteiten__detailregel"]);
      });
      regels.forEach(function (regel) {
        actOverzicht.appendChild(maak("dt", regel[2], regel[0]));
        actOverzicht.appendChild(maak("dd", regel[2], regel[1]));
      });
    }
    actOverzicht.hidden = actCent <= 0;

    // The count under the checkbox; empty (and so no description) when unticked.
    actTelling.textContent = !activiteiten.aan ? "" : gekozen.length ? gekozen.length + " gekozen" : "Nog niets gekozen";
    actTelling.hidden = !activiteiten.aan;
    actTelling.classList.toggle("is-gekozen", gekozen.length > 0);

    omschrijvingEl.textContent = "Totaal";
    bedragEl.textContent = euro(bedragCent + actCent);
    bewaarInAdres();
  }

  function wijzigActiviteit(id, stap) {
    var nieuw = stapKeuze(id, stap);
    if (!nieuw) return;
    activiteiten.keuze = nieuw;
    tekenActiviteiten();
  }

  // ?act= from the address: unknown ids and quantities that do not fit are
  // dropped without a message.
  function keuzeUitAdres() {
    var ruw = params.get("act");
    if (!ruw) return {};
    var gelezen = ACT.uitQuery(ruw) || {};
    var voor = {};
    Object.keys(gelezen).forEach(function (id) {
      if (Object.prototype.hasOwnProperty.call(activiteiten.regels, id) && gelezen[id] > 0) voor[id] = gelezen[id];
    });
    var nieuw = ACT.aanvullen(activiteiten.cat, activiteiten.soort, voor, activiteiten.ctx);
    return actBereken(nieuw) ? kopieKeuze(nieuw) : {};
  }

  /* Called once the trip price is known. soort: "falun" or "wellness";
     ctx: { personen, dagen } of the trip; reisTekst: Falun's description,
     shown above the block because the total now carries the label "Totaal". */
  function startActiviteiten(soort, ctx, reisTekst) {
    if (!actCatalogus || soort !== actSoort) return;
    if (!(ctx.personen >= 1) || !(ctx.dagen >= 1)) return;
    actCatalogus.then(function (cat) {
      if (!cat || !(bedragCent > 0)) return;
      var totaal = bedragEl.parentNode;
      var wasLos = totaal.classList.contains("booking__total--standalone");
      var labelVoor = omschrijvingEl.textContent;
      var reisRegel = null;
      try {
        var acts = ACT.activiteiten(cat, soort) || [];
        if (!acts.length) return;

        activiteiten = {
          cat: cat, soort: soort, ctx: ctx, acts: acts, regels: {}, velden: {}, huur: {},
          aantalEls: {}, open: {}, aan: false, keuze: {}, uitkomst: null
        };
        (ACT.lijnen(cat, soort) || []).forEach(function (lijn) { activiteiten.regels[lijn.id] = lijn; });
        if (!actBereken({})) throw new Error("catalogus");
        tekenLijst();
        activiteiten.keuze = keuzeUitAdres();
        // A choice from ?act= ticks the checkbox and opens its rentals.
        activiteiten.aan = Object.keys(activiteiten.keuze).length > 0;
        acts.forEach(function (act) {
          var gehuurd = (act.huur || []).some(function (h) { return activiteiten.keuze[h.id] > 0; });
          if (gehuurd) activiteiten.open[act.id] = true;
        });

        if (reisTekst) {
          reisRegel = maak("p", "activiteiten__reis", reisTekst);
          actBlok.parentNode.insertBefore(reisRegel, actBlok);
        }
        totaal.classList.remove("booking__total--standalone");
        actBlok.hidden = false;
        tekenActiviteiten();
      } catch (fout) {
        // A broken catalogue only hides this optional block; the trip itself
        // can still be paid exactly as before.
        activiteiten = null;
        actBlok.hidden = true;
        actAan.checked = false;
        actAan.setAttribute("aria-expanded", "false");
        actPaneel.hidden = true;
        actLijst.textContent = "";
        actOverzicht.hidden = true;
        if (reisRegel) reisRegel.parentNode.removeChild(reisRegel);
        totaal.classList.toggle("booking__total--standalone", wasLos);
        omschrijvingEl.textContent = labelVoor;
        bedragEl.textContent = euro(bedragCent);
      }
    });
  }

  if (actKlaar) {
    actAan.addEventListener("change", function () {
      if (!activiteiten) return;
      activiteiten.aan = actAan.checked;
      tekenActiviteiten();
    });
  }

  if (falunKeuze) {
    reisNaamEl.textContent = reis;
    omschrijvingEl.textContent = reis;
    bedragEl.textContent = "...";

    // The Falun calendar always sends a head count; a link without a valid
    // one cannot be paid (the travel details step needs that number).
    var falunPersonen = alsAantalTekst(falunKeuze.personen);
    var falunBegeleiding = alsAantalTekst(falunKeuze.begeleiding);
    var falunKinderen = falunPersonen ? leesKinderen(falunKeuze, parseInt(falunPersonen, 10)) : null;
    var falunGeldig = Boolean(falunPersonen) && falunBegeleiding !== null && Boolean(datumTekst(falunKeuze.aankomst)) && Boolean(falunKinderen);
    if (falunGeldig) {
      falunKeuze.personen = falunPersonen;
      falunKeuze.begeleiding = falunBegeleiding;
      // What is shown is exactly what create-payment receives.
      falunKeuze.kinderen = falunKinderen.kinderen ? String(falunKinderen.kinderen) : "";
      falunKeuze.baby = falunKinderen.baby ? String(falunKinderen.baby) : "";
    }

    // De standaardtekst gaat over een betaallink van Joey; hier heeft de
    // bezoeker zijn reis zelf in de kalender samengesteld.
    var introEl = document.querySelector(".booking__intro");
    if (introEl) {
      introEl.textContent = "Dit is de reis die je in de kalender hebt samengesteld. Vul eerst de reisgegevens in, daarna kies je hoe je wilt betalen.";
    }

    if (!falunGeldig) {
      toonReisFout(FALUN_INFO, "");
    } else {
      fetch("/api/falun-prijs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(falunKeuze)
      })
        .then(function (respons) {
          return respons.json().catch(function () { return {}; }).then(function (data) {
            return { ok: respons.ok, data: data || {} };
          });
        })
        .then(function (resultaat) {
          var data = resultaat.data;
          if (!resultaat.ok || typeof data.bedrag !== "number" || !isFinite(data.bedrag) || data.bedrag <= 0) {
            var fout = new Error("quote");
            fout.detail = typeof data.error === "string" ? data.error : "";
            throw fout;
          }
          bedragCent = Math.round(data.bedrag * 100);
          omschrijvingEl.textContent = data.omschrijving || reis;
          bedragEl.textContent = euro(bedragCent);
          startActiviteiten("falun", {
            personen: parseInt(falunKeuze.personen, 10),
            dagen: parseInt(falunKeuze.dagen, 10)
          }, data.omschrijving || reis);
        })
        .catch(function (fout) {
          // Same message as the other calendar trips: back to the calendar,
          // not "ask Joey for a new link" (there is no link from Joey here).
          toonReisFout(FALUN_INFO, (fout && fout.detail) || "");
        });
    }
  } else if (reisKeuze) {
    var info = KALENDER_REIZEN[reisKeuze.reis];
    reisNaamEl.textContent = info.naam;
    omschrijvingEl.textContent = "Totaal";
    bedragEl.textContent = "...";

    var introTekst = document.querySelector(".booking__intro");
    if (introTekst) {
      introTekst.textContent = "Dit is de reis die je in de kalender hebt samengesteld. Vul eerst de reisgegevens in, daarna kies je hoe je wilt betalen.";
    }

    var personenTekst = alsAantalTekst(reisKeuze.personen);
    var begeleidingTekst = alsAantalTekst(reisKeuze.begeleiding);
    var personenAantal = personenTekst ? parseInt(personenTekst, 10) : 0;
    var begeleidingDagen = begeleidingTekst ? parseInt(begeleidingTekst, 10) : 0;
    var kinderenKeuze = personenAantal >= 1 ? leesKinderen(reisKeuze, personenAantal) : null;
    // What is shown is exactly what create-payment receives.
    reisKeuze.personen = personenTekst || "";
    reisKeuze.begeleiding = begeleidingDagen > 0 ? String(begeleidingDagen) : "";
    reisKeuze.kinderen = kinderenKeuze && kinderenKeuze.kinderen ? String(kinderenKeuze.kinderen) : "";
    reisKeuze.baby = kinderenKeuze && kinderenKeuze.baby ? String(kinderenKeuze.baby) : "";

    if (!datumTekst(reisKeuze.van) || !datumTekst(reisKeuze.tot) || !(personenAantal >= 1) || begeleidingTekst === null || !kinderenKeuze) {
      toonReisFout(info, "");
    } else {
      var vraag = new URLSearchParams({
        reis: reisKeuze.reis,
        van: reisKeuze.van,
        tot: reisKeuze.tot,
        personen: String(personenAantal)
      });
      if (reisKeuze.kinderen) vraag.set("kinderen", reisKeuze.kinderen);
      if (reisKeuze.baby) vraag.set("baby", reisKeuze.baby);
      if (begeleidingDagen > 0) vraag.set("begeleiding", String(begeleidingDagen));
      if (reisKeuze.vlucht) vraag.set("vlucht", "zelf");

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
          // Trip length in days (arrival and departure day both count).
          if (typeof data.nachten === "number" && data.nachten > 0) {
            regels.push(["Dagen", String(data.nachten + 1)]);
          }
          regels.push(["Personen", String(personenAantal)]);
          // With children or babies: how many of each, and the price per person
          // of every category (the server's answer).
          if (kinderenKeuze.kinderen + kinderenKeuze.baby > 0) {
            var cat = function (n, tekst) { return n > 0 ? [[tekst, String(n)]] : []; };
            regels = regels.concat(
              cat(personenAantal - kinderenKeuze.kinderen - kinderenKeuze.baby, "Volwassenen (12 jaar en ouder)"),
              cat(kinderenKeuze.kinderen, "Kinderen (2 t/m 11 jaar)"),
              cat(kinderenKeuze.baby, "Baby's (0 en 1 jaar)")
            );
          }
          if (begeleidingDagen > 0) {
            var begeleidingBedrag = typeof data.begeleidingBedrag === "number" && isFinite(data.begeleidingBedrag) && data.begeleidingBedrag > 0
              ? " (" + euro(Math.round(data.begeleidingBedrag * 100)) + ")" : "";
            regels.push(["Begeleiding", aantalTekst(begeleidingDagen, "dag", "dagen") + begeleidingBedrag]);
          }
          // Own flight, as the server confirmed it (same line as in the
          // calendar), with the amount per person that came off.
          if (data.eigenVlucht === true) {
            var vluchtAftrek = typeof data.vluchtAftrek === "number" && isFinite(data.vluchtAftrek) && data.vluchtAftrek > 0
              ? "- " + euro(Math.round(data.vluchtAftrek * 100)) + " p.p." : "Ja";
            regels.push(["Vlucht zelf geregeld", vluchtAftrek]);
          }
          if (typeof data.perPersoon === "number" && isFinite(data.perPersoon) && data.perPersoon > 0) {
            var metKinderen = kinderenKeuze.kinderen + kinderenKeuze.baby > 0;
            regels.push([metKinderen ? "Per volwassene" : "Per persoon", euro(Math.round(data.perPersoon * 100))]);
            if (kinderenKeuze.kinderen > 0 && typeof data.perKind === "number" && isFinite(data.perKind)) {
              regels.push(["Per kind", euro(Math.round(data.perKind * 100))]);
            }
            if (kinderenKeuze.baby > 0 && typeof data.perBaby === "number" && isFinite(data.perBaby)) {
              regels.push(["Per baby", euro(Math.round(data.perBaby * 100))]);
            }
          }
          toonReisRegels(regels);

          bedragEl.textContent = euro(bedragCent);
          if (reisKeuze.reis === "wellness") {
            startActiviteiten("wellness", {
              personen: personenAantal,
              dagen: typeof data.dagen === "number" && isFinite(data.dagen) ? data.dagen : 0
            }, "");
          }
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

  /* ---- Step 2 (Reisgegevens) and step 3 (Betalen) ------------------- */
  var stapGegevensEl = document.getElementById("stapGegevens");
  var stapBetalenEl = document.getElementById("stapBetalen");
  var reisgegevens = null; // set once the details form is valid

  function toonStap(nummer) {
    var betalen = nummer === 3;
    gegevensForm.hidden = betalen;
    form.hidden = !betalen;
    stapGegevensEl.classList.toggle("is-done", betalen);
    stapGegevensEl.classList.toggle("is-current", !betalen);
    stapBetalenEl.classList.toggle("is-current", betalen);
    if (betalen) {
      stapGegevensEl.removeAttribute("aria-current");
      stapBetalenEl.setAttribute("aria-current", "step");
    } else {
      stapBetalenEl.removeAttribute("aria-current");
      stapGegevensEl.setAttribute("aria-current", "step");
    }
    // Move focus to the new step's heading so keyboard and screen reader
    // users land at the start of it.
    var kop = document.getElementById(betalen ? "betalenKop" : "reisgegevensKop");
    if (kop) {
      kop.focus({ preventScroll: true });
      kop.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  // Head count from the booking; a payment link from Joey has none.
  var bekendePersonen = parseInt((falunKeuze || reisKeuze || {}).personen, 10) || 0;
  var bekendeKeuze = falunKeuze || reisKeuze || {};
  // The arrival day: ages count on this day (children 2-11, babies 0-1).
  var uitreisdatum = falunKeuze ? falunKeuze.aankomst : (reisKeuze ? reisKeuze.van : "");

  var reisgegevensStap = window.NovakseReisgegevens.init({
    form: gegevensForm,
    personen: bekendePersonen,
    kinderen: parseInt(bekendeKeuze.kinderen, 10) || 0,
    baby: parseInt(bekendeKeuze.baby, 10) || 0,
    uitreisdatum: uitreisdatum || "",
    // Falun can be booked with own transport and/or an own flight; the other
    // calendar trips with an own flight.
    metAuto: !(falunKeuze && falunKeuze.auto === "zelf"),
    eigenVlucht: !!((falunKeuze && falunKeuze.vlucht === "zelf") || (reisKeuze && reisKeuze.vlucht === "zelf")),
    onKlaar: function (gegevens) {
      reisgegevens = gegevens;
      foutEl.hidden = true;
      toonStap(3);
    }
  });

  stapGegevensEl.classList.add("is-current");

  document.getElementById("terugNaarGegevens").addEventListener("click", function () {
    toonStap(2);
  });

  /* Back from Stripe with the browser's back button: the page may come out
     of the back/forward cache with the button still on "Bezig...". */
  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    knop.disabled = false;
    knop.textContent = "Doorgaan naar betalen";
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (knop.disabled) return; // already on its way to Stripe

    // Payment is only possible with valid travel details.
    if (!reisgegevens) {
      toonStap(2);
      reisgegevensStap.gegevens();
      return;
    }

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
        kinderen: falunKeuze.kinderen,
        baby: falunKeuze.baby,
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
        kinderen: reisKeuze.kinderen,
        baby: reisKeuze.baby,
        begeleiding: reisKeuze.begeleiding,
        vlucht: reisKeuze.vlucht,
        methode: methode
      };
    }
    lading.reisgegevens = reisgegevens;

    /* Chosen activities go along as ids and quantities; the server prices
       them again. verwachtCenten is the total on screen, so the server can
       refuse (409) when its own total differs. With the checkbox unticked
       neither is sent: the request is the same as a trip without the block. */
    if (activiteiten && activiteiten.aan && activiteiten.uitkomst) {
      lading.activiteiten = geldendeKeuze();
      lading.verwachtCenten = Math.round(bedragCent + (Math.round(activiteiten.uitkomst.totaalCenten) || 0));
    } else if ((falunKeuze || reisKeuze) && bedragCent > 0) {
      // A calendar booking always sends the total on screen, so the server
      // refuses (409) when its own calculation differs.
      lading.verwachtCenten = Math.round(bedragCent);
    }

    fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lading)
    })
      .then(function (respons) {
        return respons.json().catch(function () { return {}; }).then(function (data) {
          return { ok: respons.ok, status: respons.status, data: data || {} };
        });
      })
      .then(function (resultaat) {
        var data = resultaat.data || {};
        var melding = typeof data.error === "string" && data.error ? data.error
          : (typeof data.fout === "string" ? data.fout : "");
        if (resultaat.status === 409) {
          // The amount or the activities no longer match what the server
          // calculates: show its own message.
          var conflict = new Error(melding);
          conflict.conflict = true;
          throw conflict;
        }
        if (!resultaat.ok || !data.checkoutUrl) {
          throw new Error(melding || "Er ging iets mis.");
        }
        window.location.href = data.checkoutUrl;
      })
      .catch(function (fout) {
        foutEl.hidden = false;
        if (fout && fout.conflict) {
          foutEl.textContent = fout.message ||
            "Het bedrag klopt niet meer met je keuze. Laad de pagina opnieuw en controleer het bedrag.";
          knop.disabled = false;
          knop.textContent = "Doorgaan naar betalen";
          return;
        }
        var reden = fout && fout.message && fout.message !== "Failed to fetch"
          ? fout.message.replace(/[.\s]+$/, "") : "er kon geen verbinding worden gemaakt";
        foutEl.textContent = "Betalen lukte niet: " + reden + ". Probeer het opnieuw of neem contact op via " + MAIL + ".";
        knop.disabled = false;
        knop.textContent = "Doorgaan naar betalen";
      });
  });
})();
