/* ==========================================================================
   Lulea, Orsa, Weissensee, Finland and Wellness: the server-side price.

   This module is the only place where the amount for these four trips is
   decided on the server. The calendar in js/main.js ([data-calendar]) shows
   the same amount in the browser; both read the same price file in data/,
   so the rules below are a line-by-line port of that calendar and must stay
   identical to it, to the cent. Change one, change the other.

   The browser only sends the choices (trip, arrival, departure, head count,
   guiding days), never an amount: whatever the browser sends can be edited.

   berekenReis(keuze)
     keuze = { reis: "lulea" | "orsa" | "weissensee" | "finland" | "wellness",
               van: "YYYY-MM-DD",   // arrival day
               tot: "YYYY-MM-DD",   // departure day
               personen: int,       // group size, all ages together
               kinderen: int,       // of which children 2-11 (optional, default 0)
               baby: int,           // of which babies 0-1 (optional, default 0)
               begeleiding: int,    // guiding days, Orsa only (optional)
               vlucht: "zelf" }     // own flight (optional; any other value: flight included)
     returns { bedrag, perPersoon, perKind, perBaby, nachten, dagen,
               personen, volwassenen, kinderen, baby,
               begeleidingDagen, begeleidingBedrag,
               eigenVlucht, vluchtAftrek, omschrijving }
     or      { fout: "Dutch message" }
   bedrag is the whole group in whole euros: the price per person of every
   category times its head count, plus the guiding amount (a group amount).
   perPersoon is the adult price; perKind and perBaby are the prices with the
   reduced flight part (api/_kinderprijs.js, api/_prijsbeleid.js); with an
   own flight they equal the adult price. A group of only adults gives
   exactly the amount it always did. eigenVlucht tells whether the own-flight
   amount (vluchtAftrek, per person) came off.
   ========================================================================== */
var fs = require("fs");
var path = require("path");
var kinderprijs = require("./_kinderprijs.js");

// Whitelist: only these trips can be priced, each with its own price file.
// product is the name on the Stripe payment; without it "Schaatsreis <naam>".
var REIZEN = {
  lulea: { bestand: "lulea-prijzen.json", naam: "Luleå" },
  orsa: { bestand: "orsa-prijzen.json", naam: "Orsa" },
  weissensee: { bestand: "weissensee-prijzen.json", naam: "Weissensee" },
  finland: { bestand: "finland-prijzen.json", naam: "Finland" },
  wellness: { bestand: "wellness-prijzen.json", naam: "Wellness & schaatsen", product: "Wellness & schaatsen" }
};

/* The file is read on every call (it is small), so a running server never
   charges old prices while the calendar already shows new ones. Same as
   api/_falun-prijs.js. */
function laadPrijzen(bestandsnaam) {
  var bestand = path.join(process.cwd(), "website", "data", bestandsnaam);
  if (!fs.existsSync(bestand)) {
    bestand = path.join(process.cwd(), "data", bestandsnaam);
  }
  return JSON.parse(fs.readFileSync(bestand, "utf8"));
}

/* Dates are handled in UTC, so a day is always exactly 86400000 ms. The
   browser uses local dates, but only whole days are compared or counted, so
   the outcome is the same. Like the browser, impossible dates (31 February)
   are rejected instead of rolling over. */
function alsDatum(tekst) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tekst))) return null;
  var d = String(tekst).split("-");
  var datum = new Date(Date.UTC(+d[0], +d[1] - 1, +d[2]));
  if (isNaN(datum.getTime())) return null;
  if (datum.getUTCMonth() !== +d[1] - 1 || datum.getUTCDate() !== +d[2]) return null;
  return datum;
}
function alsTekst(datum) {
  return datum.toISOString().slice(0, 10);
}
function plusDagen(datum, aantal) {
  return new Date(datum.getTime() + aantal * 86400000);
}
function dagenTussen(van, tot) {
  return Math.round((tot - van) / 86400000);
}
var MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december"];
function schrijfDatum(datum) {
  return datum.getUTCDate() + " " + MAANDEN[datum.getUTCMonth()] + " " + datum.getUTCFullYear();
}
function euro(n) {
  return "€" + n.toLocaleString("nl-NL");
}

// Accepts 3 or "3", nothing else (no "3.5", "3abc", "").
function alsGetal(waarde) {
  if (typeof waarde === "number") return Number.isInteger(waarde) ? waarde : NaN;
  return /^\d+$/.test(String(waarde)) ? parseInt(waarde, 10) : NaN;
}

/* The own-flight amount per person in whole euros (opties.vluchtZelf in the
   price file), or 0 when the trip does not offer it or the value is not a
   positive number. Same check as vluchtBedrag in js/main.js. */
function vluchtZelfBedrag(data) {
  var waarde = data && data.opties && data.opties.vluchtZelf;
  if (typeof waarde !== "number" || !isFinite(waarde) || waarde <= 0) return 0;
  return Math.round(waarde);
}

function berekenReis(keuze) {
  keuze = keuze || {};
  var reis = typeof keuze.reis === "string" && Object.prototype.hasOwnProperty.call(REIZEN, keuze.reis)
    ? REIZEN[keuze.reis] : null;
  if (!reis) return { fout: "Onbekende reis." };

  var data;
  try { data = laadPrijzen(reis.bestand); } catch (fout) { return { fout: "De prijzen zijn niet beschikbaar." }; }
  if (data.afrekenen !== true) return { fout: "Deze reis is nog niet online te betalen." };

  // main.js bouwKalender(): season, shortest stay.
  var seizoenVan = alsDatum(data.seizoenStart);
  var seizoenTot = alsDatum(data.seizoenEind);
  if (!seizoenVan || !seizoenTot || seizoenTot <= seizoenVan) {
    return { fout: "Voor " + reis.naam + " staan de data nog niet vast." };
  }
  var minNachten = data.minimumNachten || 1;

  var van = alsDatum(keuze.van);
  var tot = alsDatum(keuze.tot);
  if (!van || !tot) return { fout: "Ongeldige datum." };
  if (tot <= van) return { fout: "De vertrekdag moet na de aankomstdag liggen." };
  var nachten = dagenTussen(van, tot);
  var dagen = nachten + 1;

  // main.js maakDag(): only days inside the season can be picked, so arrival
  // and departure both lie between seizoenStart and seizoenEind.
  if (van < seizoenVan || van > seizoenTot) return { fout: "Die aankomstdag valt buiten het seizoen." };
  if (tot > seizoenTot) return { fout: "Dat verblijf past niet binnen het seizoen." };

  // main.js kiesDag(): at least minimumNachten nights, no maximum.
  if (nachten < minNachten) {
    return { fout: "Kies minstens " + (minNachten + 1) + " dagen." };
  }

  // main.js bezet / bezetTussen(): no night from arrival up to (not
  // including) departure may fall in a booked period. Broken periods are
  // skipped, as in the browser.
  var bezet = (data.bezet || []).map(function (blok) {
    return { van: alsDatum(blok && blok.van), tot: alsDatum(blok && blok.tot) };
  }).filter(function (blok) {
    return blok.van && blok.tot && blok.tot > blok.van;
  });
  for (var i = 0; i < nachten; i++) {
    var nacht = plusDagen(van, i);
    for (var b = 0; b < bezet.length; b++) {
      if (nacht >= bezet[b].van && nacht < bezet[b].tot) return { fout: "Die periode is niet meer vrij." };
    }
  }

  // Head count: data.personen min/max (1 to 20).
  var keuzePersonen = data.personen || {};
  var personenMin = Math.max(1, parseInt(keuzePersonen.min, 10) || 1);
  var personenMax = Math.max(personenMin, parseInt(keuzePersonen.max, 10) || 20);
  var personen = alsGetal(keuze.personen);
  if (!(personen >= personenMin && personen <= personenMax)) return { fout: "Ongeldig aantal personen." };

  // main.js magBetalen(): optional betaalPersonen, the group sizes that can
  // book and pay online (wellness: only 2). Any other size is a request.
  var betaalKeuze = data.betaalPersonen && typeof data.betaalPersonen === "object" ? data.betaalPersonen : null;
  if (betaalKeuze) {
    var betaalMin = parseInt(betaalKeuze.min, 10) || personenMin;
    var betaalMax = parseInt(betaalKeuze.max, 10) || personenMax;
    if (personen < betaalMin || personen > betaalMax) {
      var groep = betaalMin === betaalMax
        ? betaalMin + (betaalMin === 1 ? " persoon" : " personen")
        : betaalMin + " tot en met " + betaalMax + " personen";
      return { fout: "Online boeken kan voor " + reis.naam + " alleen met " + groep + ". Vraag de reis aan voor een andere groep." };
    }
  }

  // Adults (12+), children (2-11) and babies (0-1); at least one adult.
  var aantallen = kinderprijs.leesAantallen(keuze, personen);
  if (aantallen.fout) return { fout: aantallen.fout };

  // main.js toeslagCenten: surcharge per person per night, in cents.
  var toeslagCenten = {};
  (Array.isArray(data.toeslagen) ? data.toeslagen : []).forEach(function (regel) {
    var centen = regel && typeof regel.bedrag === "number" ? Math.round(regel.bedrag * 100) : 0;
    if (!(centen > 0) || !Array.isArray(regel.nachten)) return;
    regel.nachten.forEach(function (n) {
      var datum = alsDatum(n);
      if (datum) toeslagCenten[alsTekst(datum)] = centen;
    });
  });
  var heeftToeslagen = Object.keys(toeslagCenten).length > 0;
  function toeslagVoor(aankomst, aantal) {
    var som = 0;
    for (var t = 0; t < aantal; t++) som += toeslagCenten[alsTekst(plusDagen(aankomst, t))] || 0;
    return som;
  }

  // main.js tariefOp(): the arrival day sets the tariff for the whole stay.
  function tariefOp(datum) {
    var lijst = data.periodes || [];
    for (var p = 0; p < lijst.length; p++) {
      var pVan = alsDatum(lijst[p].van);
      var pTot = alsDatum(lijst[p].tot);
      if (pVan && pTot && datum >= pVan && datum < pTot) return lijst[p].tarief;
    }
    return null;
  }

  // main.js basisPrijsPerPersoon(): table amount for this many nights, or the
  // longest listed stay plus extraNachtPerPersoon for every night above it.
  // Own transport (eigenVervoer) is not supported: every trip is a package.
  function basisPrijsPerPersoon(aankomst, aantal) {
    var tabel = data.prijsPerPersoon;
    var dagprijs = data.prijsPerPersoonPerDag || 0;
    if (!tabel) return dagprijs ? aantal * dagprijs : 0;

    var tarief = tariefOp(aankomst);
    var rij = tarief ? tabel[tarief] : null;
    if (!rij) return 0;
    if (typeof rij[String(aantal)] === "number") return rij[String(aantal)];

    var langste = 0;
    Object.keys(rij).forEach(function (sleutel) {
      var n = parseInt(sleutel, 10);
      if (n > langste && typeof rij[sleutel] === "number") langste = n;
    });
    if (!langste || aantal < langste) return 0;

    var extra = (data.extraNachtPerPersoon || {})[tarief] || 0;
    if (!extra) return 0;
    return rij[String(langste)] + (aantal - langste) * extra;
  }

  // main.js prijsPerPersoon() + heleEuros(): surcharges only on top of a real
  // price; with surcharges always rounded up (after rounding to cents to drop
  // float noise), otherwise normal rounding.
  var basis = basisPrijsPerPersoon(van, nachten);
  if (!basis) return { fout: "Voor die periode is er geen vaste prijs." };
  var metToeslag = heeftToeslagen ? basis + toeslagVoor(van, nachten) / 100 : basis;
  var heleEuros = heeftToeslagen ? Math.ceil(Math.round(metToeslag * 100) / 100) : Math.round(metToeslag);

  // Group size: groepsKorting.perPersoonPerNacht[personen] euros per person
  // per night on top (negative is a discount; a missing size counts as 0).
  var kortingLijst = data.groepsKorting && data.groepsKorting.perPersoonPerNacht;
  // Babies (0-1) do not count towards the group size for this discount:
  // adults and children only. They still count as travellers everywhere else.
  var korting = kortingLijst ? kortingLijst[String(personen - aantallen.baby)] : 0;
  if (typeof korting !== "number" || !isFinite(korting)) korting = 0;

  // main.js vluchtAftrek(): "I'll arrange my own flight" (opties.vluchtZelf in
  // the price file, as in data/falun-prijzen.json) takes a fixed amount per
  // person off, after the group price. Only the value "zelf" counts; without
  // it the flight stays in the price exactly as before. A trip without a
  // valid amount refuses it rather than charging a flight the visitor
  // believes they arrange themselves.
  var eigenVlucht = keuze.vlucht === "zelf";
  var vluchtBedrag = vluchtZelfBedrag(data);
  if (eigenVlucht && !vluchtBedrag) return { fout: "Bij deze reis kun je de vlucht niet zelf regelen." };
  var vluchtAftrek = eigenVlucht ? vluchtBedrag : 0;

  var perPersoon = heleEuros + korting * nachten - vluchtAftrek;
  if (!(perPersoon > 0)) return { fout: "Ongeldig bedrag." };

  // main.js begeleidingKan() / begeleidingGroep(): guiding (Orsa) is a group
  // amount per day, (prijsPerDag + prijsPerDagExtraPersoon * (personen - 1)),
  // and only possible when the whole trip lies inside its van/tot window.
  var begeleiding = (data.begeleiding && typeof data.begeleiding.prijsPerDag === "number")
    ? data.begeleiding : null;
  var begeleidingDagen = 0;
  var begeleidingBedrag = 0;
  if (keuze.begeleiding !== undefined && keuze.begeleiding !== null && keuze.begeleiding !== "") {
    begeleidingDagen = alsGetal(keuze.begeleiding);
    if (isNaN(begeleidingDagen)) return { fout: "Ongeldig aantal dagen begeleiding." };
  }
  if (begeleidingDagen > 0) {
    if (!begeleiding) return { fout: "Begeleiding is bij deze reis niet te boeken." };
    var begVan = alsDatum(begeleiding.van);
    var begTot = alsDatum(begeleiding.tot);
    if ((begVan && van < begVan) || (begTot && tot > begTot)) {
      return { fout: "Begeleiding kan niet in die periode." };
    }
    if (begeleidingDagen > dagen) return { fout: "Zoveel dagen begeleiding passen niet in de reis." };
    begeleidingBedrag = (begeleiding.prijsPerDag + (begeleiding.prijsPerDagExtraPersoon || 0) * (personen - 1)) *
      begeleidingDagen;
  }

  // Only the flight part is lower for children and babies; the group
  // discount, surcharges and guiding above stay as they are. With an own
  // flight there is no flight in the package, so nothing is left to discount
  // and everyone pays the adult price (same as api/_falun-prijs.js).
  var prijzen = kinderprijs.prijzenPerCategorie(keuze.reis, perPersoon, { zonderVlucht: eigenVlucht });
  var bedrag = kinderprijs.groepsPrijs(aantallen, prijzen) + begeleidingBedrag;

  var omschrijving = (reis.product || "Schaatsreis " + reis.naam) + ", " + schrijfDatum(van) + " tot " + schrijfDatum(tot) +
    " (" + dagen + (dagen === 1 ? " dag" : " dagen") + "), " + personen + (personen === 1 ? " persoon" : " personen") +
    kinderprijs.omschrijvingDeel(aantallen) +
    (eigenVlucht ? ", eigen vlucht" : "") +
    ", " + (aantallen.kinderen + aantallen.baby > 0 ? "volwassene " : "") + euro(perPersoon) + " p.p.";
  if (aantallen.kinderen > 0) omschrijving += ", kind " + euro(prijzen.kind) + " p.p.";
  if (aantallen.baby > 0) omschrijving += ", baby " + euro(prijzen.baby) + " p.p.";
  if (begeleidingDagen > 0) {
    omschrijving += ", met " + begeleidingDagen + (begeleidingDagen === 1 ? " dag" : " dagen") +
      " begeleiding (" + euro(begeleidingBedrag) + ")";
  }

  return {
    bedrag: bedrag,
    perPersoon: perPersoon,
    perKind: prijzen.kind,
    perBaby: prijzen.baby,
    nachten: nachten,
    dagen: dagen,
    personen: personen,
    volwassenen: aantallen.volwassenen,
    kinderen: aantallen.kinderen,
    baby: aantallen.baby,
    begeleidingDagen: begeleidingDagen,
    begeleidingBedrag: begeleidingBedrag,
    eigenVlucht: eigenVlucht,
    vluchtAftrek: vluchtAftrek,
    omschrijving: omschrijving
  };
}

module.exports = { berekenReis: berekenReis, REIZEN: Object.keys(REIZEN) };
