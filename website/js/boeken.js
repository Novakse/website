/* ==========================================================================
   Aanvraagpagina

   Leest de gekozen periode uit het webadres (die zet de kalender erin),
   rekent de indicatieprijs uit terwijl je invult, en zet de aanvraag klaar
   als e-mail of als WhatsApp-bericht.

   De prijzen en activiteiten staan in het blokje <script id="boekingsdata">
   boven in boeken.html. Hier hoeft niets gewijzigd te worden.
   ========================================================================== */
(function () {
  "use strict";

  var MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli",
                 "augustus", "september", "oktober", "november", "december"];
  var MAIL = "schaatsennovakse@outlook.com";
  var WHATSAPP = "31617467643";

  var bron = document.getElementById("boekingsdata");
  var formulier = document.getElementById("boekingsformulier");
  if (!bron || !formulier) return;

  var data;
  try { data = JSON.parse(bron.textContent); } catch (fout) { return; }

  // Welke reis: staat in het webadres, anders de standaardreis
  var params = new URLSearchParams(window.location.search);
  var reisSleutel = (params.get("reis") || data.standaard || "").toLowerCase();
  var reis = (data.reizen || {})[reisSleutel];
  if (!reis) {
    reisSleutel = data.standaard;
    reis = (data.reizen || {})[reisSleutel];
  }
  if (!reis) return;

  var extras = reis.extras || [];
  var varianten = reis.varianten || [];
  var maxPersonen = reis.maxPersonen || 12;
  var minPersonen = reis.minimumPersonen || 1;
  var opslag = reis.opslagPerPersoonPerNacht || 0;

  function alsDatum(tekst) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tekst || "")) return null;
    var d = tekst.split("-");
    var datum = new Date(+d[0], +d[1] - 1, +d[2]);
    return isNaN(datum) ? null : datum;
  }
  function schrijfDatum(datum) {
    return datum.getDate() + " " + MAANDEN[datum.getMonth()] + " " + datum.getFullYear();
  }
  function euro(bedrag) {
    return "€" + bedrag.toLocaleString("nl-NL");
  }

  /* --- Periode uit het webadres halen ---------------------------------- */
  var van = alsDatum(params.get("van"));
  var tot = alsDatum(params.get("tot"));
  var nachten = (van && tot && tot > van) ? Math.round((tot - van) / 86400000) : 0;
  if (!nachten) { van = null; tot = null; }

  var reisNaam = document.getElementById("reisNaam");
  if (reisNaam) reisNaam.textContent = reis.naam;

  var terugLink = document.getElementById("terugNaarReis");
  if (terugLink) {
    terugLink.href = reisSleutel + ".html" + (reis.periodeVrij ? "#prijzen" : "");
    terugLink.textContent = reis.periodeVrij
      ? "Kies een periode in de kalender"
      : "Bekijk de reisdata van " + reis.naam.split(" —")[0];
  }

  var periodeBox = document.getElementById("periodeBox");
  if (nachten) {
    periodeBox.innerHTML =
      '<p class="booking__period-dates">' + schrijfDatum(van) + ' – ' + schrijfDatum(tot) + '</p>' +
      '<p class="booking__period-nights">' + nachten + (nachten === 1 ? " nacht" : " nachten") + '</p>';
  } else if (!reis.periodeVrij) {
    periodeBox.innerHTML =
      '<p class="booking__period-empty">Deze reis heeft vaste vertrekdata. Zet in je opmerking welke periode je op het oog hebt, dan laat Joey weten wat er mogelijk is.</p>';
  }

  /* --- Aantal personen -------------------------------------------------- */
  var personenVeld = document.getElementById("personen");
  personenVeld.max = maxPersonen;
  personenVeld.min = minPersonen;
  if (parseInt(personenVeld.value, 10) < minPersonen) personenVeld.value = minPersonen;

  function personen() {
    var aantal = parseInt(personenVeld.value, 10);
    if (isNaN(aantal) || aantal < minPersonen) aantal = minPersonen;
    if (aantal > maxPersonen) aantal = maxPersonen;
    return aantal;
  }

  document.getElementById("minderPersonen").addEventListener("click", function () {
    personenVeld.value = Math.max(minPersonen, personen() - 1);
    ververs();
  });
  document.getElementById("meerPersonen").addEventListener("click", function () {
    personenVeld.value = Math.min(maxPersonen, personen() + 1);
    ververs();
  });
  personenVeld.addEventListener("input", ververs);

  /* --- Keuzevragen (vervoer, verzekering, eigen groep, materiaal) --------
     Elke vraag staat in het gegevensblokje van de reis. Een optie mag een
     prijs hebben; die telt dan per persoon mee in het totaal.
     ---------------------------------------------------------------------- */
  var vragen = reis.vragen || [];
  var vragenBox = document.getElementById("vragenBlokken");

  if (vragen.length && vragenBox) {
    vragen.forEach(function (vraag, nr) {
      var blok = document.createElement("fieldset");
      blok.className = "booking__block booking__block--vraag";

      var kop = document.createElement("legend");
      kop.className = "booking__legend booking__legend--klein";
      kop.textContent = vraag.vraag;
      blok.appendChild(kop);

      var lijst = document.createElement("div");
      lijst.className = "booking__extras";

      (vraag.opties || []).forEach(function (optie, i) {
        var rij = document.createElement("label");
        rij.className = "extra";
        rij.innerHTML =
          '<input type="radio" name="vraag-' + vraag.sleutel + '" class="extra__check vraag__check"' +
            ' data-vraag="' + nr + '" value="' + i + '"' + (i === 0 ? " checked" : "") + ' />' +
          '<span class="extra__name">' + optie.naam +
            (optie.toelichting ? '<span class="extra__hint">' + optie.toelichting + '</span>' : '') +
          '</span>' +
          '<span class="extra__price">' + (optie.prijs ? euro(optie.prijs) : "") + '</span>';
        lijst.appendChild(rij);
      });

      blok.appendChild(lijst);
      vragenBox.appendChild(blok);
    });
    vragenBox.addEventListener("change", ververs);
  }

  function antwoorden() {
    var uit = [];
    vragen.forEach(function (vraag) {
      var gekozen = document.querySelector('input[name="vraag-' + vraag.sleutel + '"]:checked');
      if (!gekozen) return;
      var optie = (vraag.opties || [])[+gekozen.value];
      if (optie) uit.push({ vraag: vraag.vraag, antwoord: optie.naam, prijs: optie.prijs || 0 });
    });
    return uit;
  }

  /* --- Keuze tussen de varianten (wel of geen materiaalhuur) ------------- */
  var variantBox = document.getElementById("variantBox");
  var variantBlok = document.getElementById("variantBlok");

  if (varianten.length && variantBox) {
    varianten.forEach(function (variant, i) {
      var rij = document.createElement("label");
      rij.className = "extra";
      rij.innerHTML =
        '<input type="radio" name="variant" class="extra__check" value="' + variant.sleutel + '"' +
          (i === 0 ? " checked" : "") + ' />' +
        '<span class="extra__name">' + variant.naam +
          (variant.toelichting ? '<span class="extra__hint">' + variant.toelichting + '</span>' : '') +
        '</span>' +
        '<span class="extra__price">vanaf ' + euro(staffelprijs(variant, 7) + opslag) + ' p.p.p.n.</span>';
      variantBox.appendChild(rij);
    });
    variantBox.addEventListener("change", ververs);
  } else if (variantBlok) {
    variantBlok.hidden = true;
  }

  /* --- Extra activiteiten ----------------------------------------------- */
  var extrasBox = document.getElementById("extrasBox");
  extras.forEach(function (extra, i) {
    var rij = document.createElement("label");
    rij.className = "extra";
    rij.innerHTML =
      '<input type="checkbox" class="extra__check" value="' + i + '" />' +
      '<span class="extra__name">' + extra.naam +
        (extra.toelichting ? '<span class="extra__hint">' + extra.toelichting + '</span>' : '') +
      '</span>' +
      '<span class="extra__price">' + euro(extra.prijs) + '</span>';
    extrasBox.appendChild(rij);
  });

  if (!extras.length) {
    extrasBox.innerHTML = '<p class="booking__note">Voor deze reis staan de extra activiteiten nog niet vast. Zet in je opmerking waar je belangstelling voor hebt.</p>';
  } else if (data.weerbericht) {
    var waarschuwing = document.createElement("p");
    waarschuwing.className = "booking__note";
    waarschuwing.textContent = data.weerbericht;
    extrasBox.appendChild(waarschuwing);
  }
  extrasBox.addEventListener("change", ververs);

  function gekozenExtras() {
    var lijst = [];
    extrasBox.querySelectorAll(".extra__check:checked").forEach(function (vak) {
      lijst.push(extras[+vak.value]);
    });
    return lijst;
  }

  /* --- Wat kost een nacht -----------------------------------------------
     De prijs per nacht hangt af van hoe lang je blijft (de staffel) en of de
     nacht in het hoogseizoen valt. Daar komt de eigen opslag bovenop.
     ---------------------------------------------------------------------- */
  function staffelprijs(variant, aantalNachten) {
    var trappen = (variant && variant.staffel) || [];
    var gekozen = null;
    trappen.forEach(function (trap) {
      if (aantalNachten >= trap.vanaf) gekozen = trap;
    });
    if (!gekozen && trappen.length) gekozen = trappen[0];
    return gekozen ? gekozen.prijs : 0;
  }

  function hoogseizoenNachten(vanDatum, aantalNachten) {
    var piek = reis.hoogseizoen;
    if (!piek || !piek.van || !piek.tot) return 0;
    var piekVan = alsDatum(piek.van);
    var piekTot = alsDatum(piek.tot);
    if (!piekVan || !piekTot) return 0;

    var aantal = 0;
    var loop = new Date(vanDatum.getTime());
    for (var i = 0; i < aantalNachten; i++) {
      if (loop >= piekVan && loop < piekTot) aantal++;
      loop.setDate(loop.getDate() + 1);
    }
    return aantal;
  }

  function huidigeVariant() {
    if (!varianten.length) return null;
    var gekozen = document.querySelector('input[name="variant"]:checked');
    var sleutel = gekozen ? gekozen.value : varianten[0].sleutel;
    for (var i = 0; i < varianten.length; i++) {
      if (varianten[i].sleutel === sleutel) return varianten[i];
    }
    return varianten[0];
  }

  /* --- Overzicht en totaal ---------------------------------------------- */
  var regelsBox = document.getElementById("overzichtRegels");
  var totaalBox = document.getElementById("totaalBedrag");
  var whatsappKnop = document.getElementById("whatsappKnop");

  function ververs() {
    var aantal = personen();
    var regels = [];
    var totaal = 0;

    var variant = huidigeVariant();

    if (nachten) {
      // Heeft de reis varianten, dan bepaalt de staffel de prijs; anders geldt
      // een vaste dagprijs.
      var perDag = (varianten.length ? staffelprijs(variant, nachten)
                                     : (reis.prijsPerPersoonPerDag || 0)) + opslag;
      var verblijf = nachten * aantal * perDag;
      totaal += verblijf;
      regels.push({
        naam: (variant ? variant.naam : "Verblijf") + ", " + nachten +
              (nachten === 1 ? " nacht" : " nachten") + " × " + aantal +
              (aantal === 1 ? " persoon" : " personen") +
              " (" + euro(perDag) + " p.p. per dag)",
        bedrag: verblijf
      });

      var piekNachten = hoogseizoenNachten(van, nachten);
      if (piekNachten && reis.hoogseizoen.toeslagPerPersoonPerNacht) {
        var toeslag = piekNachten * aantal * reis.hoogseizoen.toeslagPerPersoonPerNacht;
        totaal += toeslag;
        regels.push({
          naam: reis.hoogseizoen.naam + ", " + piekNachten +
                (piekNachten === 1 ? " nacht" : " nachten"),
          bedrag: toeslag
        });
      }
    }

    antwoorden().forEach(function (keuze) {
      if (!keuze.prijs) return;
      var bedrag = keuze.prijs * aantal;
      totaal += bedrag;
      regels.push({ naam: keuze.antwoord + " × " + aantal, bedrag: bedrag });
    });

    gekozenExtras().forEach(function (extra) {
      var bedrag = extra.prijs * aantal;
      totaal += bedrag;
      regels.push({ naam: extra.naam + " × " + aantal, bedrag: bedrag });
    });

    regelsBox.innerHTML = "";
    if (!regels.length) {
      regelsBox.innerHTML = '<p class="booking__empty">Kies eerst een periode in de kalender.</p>';
    }
    regels.forEach(function (regel) {
      var naam = document.createElement("dt");
      naam.textContent = regel.naam;
      var bedrag = document.createElement("dd");
      bedrag.textContent = euro(regel.bedrag);
      regelsBox.appendChild(naam);
      regelsBox.appendChild(bedrag);
    });

    totaalBox.textContent = nachten ? euro(totaal) : "—";
    whatsappKnop.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(bericht(totaal));
  }

  /* --- Het bericht dat verstuurd wordt ---------------------------------- */
  function bericht(totaal) {
    var aantal = personen();
    var regels = ["Aanvraag " + reis.naam, ""];

    if (nachten) {
      regels.push("Periode: " + schrijfDatum(van) + " tot " + schrijfDatum(tot) +
                  " (" + nachten + (nachten === 1 ? " nacht" : " nachten") + ")");
    } else {
      regels.push("Periode: nog niet gekozen");
    }
    regels.push("Aantal personen: " + aantal);

    antwoorden().forEach(function (keuze) {
      regels.push(keuze.vraag + " " + keuze.antwoord);
    });

    var lijst = gekozenExtras();
    regels.push("Extra activiteiten: " + (lijst.length
      ? lijst.map(function (e) { return e.naam; }).join(", ")
      : "geen"));

    if (nachten) regels.push("Indicatie totaal: " + euro(totaal));

    regels.push("");
    regels.push("Naam: " + (document.getElementById("naam").value || "-"));
    regels.push("E-mail: " + (document.getElementById("email").value || "-"));
    regels.push("Telefoon: " + (document.getElementById("telefoon").value || "-"));

    var opmerking = document.getElementById("opmerkingen").value.trim();
    if (opmerking) {
      regels.push("");
      regels.push("Opmerkingen:");
      regels.push(opmerking);
    }
    return regels.join("\n");
  }

  /* --- Versturen als e-mail --------------------------------------------- */
  var foutmelding = document.getElementById("formulierFout");

  formulier.addEventListener("submit", function (event) {
    event.preventDefault();

    var naam = document.getElementById("naam");
    var email = document.getElementById("email");
    var ontbreekt = [];
    if (!naam.value.trim()) ontbreekt.push("je naam");
    if (!email.value.trim()) ontbreekt.push("je e-mailadres");

    if (ontbreekt.length) {
      foutmelding.hidden = false;
      foutmelding.textContent = "Vul nog even " + ontbreekt.join(" en ") + " in.";
      (ontbreekt[0] === "je naam" ? naam : email).focus();
      return;
    }
    if (!nachten) {
      foutmelding.hidden = false;
      foutmelding.textContent = "Kies eerst een periode in de kalender.";
      return;
    }

    foutmelding.hidden = true;
    var totaal = totaalBox.textContent;
    window.location.href = "mailto:" + MAIL +
      "?subject=" + encodeURIComponent("Aanvraag " + reis.naam) +
      "&body=" + encodeURIComponent(bericht(totaal));
  });

  /* --- Onthouden wat er is ingevuld --------------------------------------
     Gaat iemand terug naar de kalender om de periode te wijzigen, dan staat
     alles bij terugkomst nog ingevuld. Het blijft in de browser van de
     bezoeker; er gaat niets naar buiten.
     ---------------------------------------------------------------------- */
  var SLEUTEL = "novakse-aanvraag-" + reisSleutel;
  var TEKSTVELDEN = ["naam", "email", "telefoon", "opmerkingen"];

  function bewaar() {
    var staat = { personen: personenVeld.value, keuzes: {}, extras: [], velden: {} };
    formulier.querySelectorAll('input[type="radio"]:checked').forEach(function (knop) {
      staat.keuzes[knop.name] = knop.value;
    });
    extrasBox.querySelectorAll('input[type="checkbox"]:checked').forEach(function (vak) {
      staat.extras.push(vak.value);
    });
    TEKSTVELDEN.forEach(function (id) {
      var veld = document.getElementById(id);
      if (veld) staat.velden[id] = veld.value;
    });
    try { window.sessionStorage.setItem(SLEUTEL, JSON.stringify(staat)); } catch (fout) { /* privémodus */ }
  }

  function herstel() {
    var ruw;
    try { ruw = window.sessionStorage.getItem(SLEUTEL); } catch (fout) { return; }
    if (!ruw) return;
    var staat;
    try { staat = JSON.parse(ruw); } catch (fout) { return; }

    if (staat.personen) personenVeld.value = staat.personen;
    Object.keys(staat.keuzes || {}).forEach(function (naam) {
      var knop = formulier.querySelector(
        'input[name="' + naam + '"][value="' + staat.keuzes[naam] + '"]');
      if (knop) knop.checked = true;
    });
    (staat.extras || []).forEach(function (waarde) {
      var vak = extrasBox.querySelector('input[type="checkbox"][value="' + waarde + '"]');
      if (vak) vak.checked = true;
    });
    Object.keys(staat.velden || {}).forEach(function (id) {
      var veld = document.getElementById(id);
      if (veld && staat.velden[id]) veld.value = staat.velden[id];
    });
  }

  TEKSTVELDEN.forEach(function (id) {
    var veld = document.getElementById(id);
    if (veld) veld.addEventListener("input", bewaar);
  });
  formulier.addEventListener("change", bewaar);

  // Stappen doorlopend nummeren; blokken die voor deze reis niet gelden,
  // vallen weg en mogen geen gat in de nummering achterlaten.
  var stapNr = 0;
  formulier.querySelectorAll(".booking__block").forEach(function (blok) {
    if (blok.hidden) return;
    var bolletje = blok.querySelector(".booking__step");
    if (!bolletje) return;
    stapNr++;
    bolletje.textContent = stapNr;
  });

  herstel();
  ververs();
})();
