/* ==========================================================================
   Falun: de prijs uitrekenen.

   Deze module is de enige plek waar het bedrag bepaald wordt. Twee dingen
   gebruiken hem: de betaalpagina, om te laten zien wat je gaat betalen, en
   het aanmaken van de Stripe-sessie, om af te rekenen. Zo kan er geen
   verschil ontstaan tussen wat er op het scherm staat en wat er afgeschreven
   wordt.

   Wat de browser meestuurt is niet te vertrouwen: iemand kan dat aanpassen en
   voor een paar euro afrekenen. Daarom stuurt de browser alleen de keuzes mee
   (aankomstdag, aantal dagen, de vinkjes) en nooit een bedrag.

   De prijzen komen uit data/falun-prijzen.json, hetzelfde bestand dat de
   kalender in de browser leest.
   ========================================================================== */
var fs = require("fs");
var path = require("path");

/* Het bestand wordt elke keer opnieuw gelezen. Dat kost niets - het is een
   paar regels - en het voorkomt dat een draaiende server nog met oude prijzen
   rekent terwijl de kalender in de browser de nieuwe al laat zien. Wat op het
   scherm staat en wat er afgeschreven wordt, moet gelijk zijn. */
function falunPrijzen() {
  var bestand = path.join(process.cwd(), "website", "data", "falun-prijzen.json");
  if (!fs.existsSync(bestand)) {
    bestand = path.join(process.cwd(), "data", "falun-prijzen.json");
  }
  return JSON.parse(fs.readFileSync(bestand, "utf8"));
}

function alsDatum(tekst) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tekst))) return null;
  var d = String(tekst).split("-");
  var uit = new Date(Date.UTC(+d[0], +d[1] - 1, +d[2]));
  return isNaN(uit.getTime()) ? null : uit;
}
function alsTekst(datum) {
  return datum.toISOString().slice(0, 10);
}
var MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december"];
/* Leesbare datum voor de omschrijving. Die staat op de betaalpagina en komt
   ook in Stripe terecht, waar Joey hem terugleest. */
function schrijfDatum(datum) {
  return datum.getUTCDate() + " " + MAANDEN[datum.getUTCMonth()] + " " + datum.getUTCFullYear();
}
function plusDagen(datum, aantal) {
  return new Date(datum.getTime() + aantal * 86400000);
}

/* Shortest trip in days. There is no maximum: the season and the booked
   periods are the only upper limit. Same as js/falun-kalender.js. */
function minimumDagen(data) {
  return typeof data.minimumDagen === "number" && data.minimumDagen > 1 ? data.minimumDagen : 4;
}

/* Base price per person for a trip of this many days. A length listed in
   basisprijs uses that amount; a longer one takes the longest listed length
   below it plus extraDagPerPersoon for every extra day. Returns null when
   no price can be given. Must stay identical to basisprijsVoor() in
   js/falun-kalender.js, or the screen and Stripe disagree. */
function basisprijsVoor(data, dagen) {
  var tabel = data.basisprijs || {};
  if (typeof tabel[String(dagen)] === "number") return tabel[String(dagen)];
  var langste = 0;
  Object.keys(tabel).forEach(function (sleutel) {
    var n = parseInt(sleutel, 10);
    if (n <= dagen && n > langste && typeof tabel[sleutel] === "number") langste = n;
  });
  var extra = data.extraDagPerPersoon;
  if (!langste || typeof extra !== "number") return null;
  return tabel[String(langste)] + (dagen - langste) * extra;
}

/* Geeft het bedrag in hele euro's terug, of een tekst waarom het niet kan. */
function berekenFalun(keuze) {
  var data;
  try { data = falunPrijzen(); } catch (fout) { return { fout: "De prijzen zijn niet beschikbaar." }; }

  if (!data.seizoenStart || !data.seizoenEind) return { fout: "Voor Falun staan de data nog niet vast." };

  var seizoenVan = alsDatum(data.seizoenStart);
  var seizoenTot = alsDatum(data.seizoenEind);
  var aankomst = alsDatum(keuze.aankomst);
  var dagen = parseInt(keuze.dagen, 10);

  if (!aankomst || !seizoenVan || !seizoenTot) return { fout: "Ongeldige datum." };
  if (!/^\d+$/.test(String(keuze.dagen)) || dagen < minimumDagen(data)) return { fout: "Ongeldige reisduur." };

  var basis = basisprijsVoor(data, dagen);
  if (basis === null) return { fout: "Ongeldige reisduur." };

  var nachten = dagen - 1;
  if (aankomst < seizoenVan) return { fout: "Die aankomstdag valt buiten het seizoen." };
  if (plusDagen(aankomst, nachten) > seizoenTot) return { fout: "Dat verblijf past niet binnen het seizoen." };

  var bezet = data.bezet || [];
  var huisjes = data.huisjePerNachtSEK || {};
  var basisSEK = typeof data.huisjeBasisSEK === "number" ? data.huisjeBasisSEK : 0;
  var koers = data.wisselkoersSEK || 1;

  var keuze2 = data.personen || { min: 1, max: 4 };
  var basisPersonen = data.basisPersonen || 2;
  var autoPerDag = typeof data.autoPerDagEUR === "number" ? data.autoPerDagEUR : 0;
  var autoInBasisDagen = typeof data.autoInBasisprijsDagen === "number" ? data.autoInBasisprijsDagen : 0;
  var doorgeven = typeof data.kortingDoorgeven === "number" ? data.kortingDoorgeven : 1;
  var huisjeMax = data.huisjeMaxPersonen || 0;

  var personen = parseInt(keuze.personen, 10) || basisPersonen;
  if (personen < (keuze2.min || 1) || personen > (keuze2.max || 4)) {
    return { fout: "Ongeldig aantal personen." };
  }

  // Zelfde rekenwijze als in js/falun-kalender.js. Een besparing doordat er
  // meer mensen in het huisje slapen, wordt maar deels doorgegeven.
  function demp(verschil) {
    return verschil > 0 ? verschil : verschil * doorgeven;
  }
  // A cabin (and its rental car) holds at most huisjeMax people; a bigger
  // group is spread over as few cabins as possible (6 people = 2 cabins of 3).
  // Same as perHuisje() in js/falun-kalender.js.
  function perHuisje(n) {
    if (!huisjeMax || n <= huisjeMax) return n;
    return n / Math.ceil(n / huisjeMax);
  }
  // Rental car share per person for a trip of this many days. The car costs
  // autoPerDag per day and is shared by the people in one cabin. Same as
  // autoDeel() in js/falun-kalender.js.
  function autoDeel(n, aantalDagen) {
    var auto = autoPerDag * aantalDagen;
    if (!auto) return 0;
    var b = auto / basisPersonen;
    return b + demp(auto / perHuisje(n) - b);
  }
  // The car share that basisprijs already contains (autoInBasisprijsDagen
  // days at basisPersonen). It is taken out and the car for the real trip
  // length is added, so the car never counts twice.
  var autoInBasis = autoPerDag * autoInBasisDagen / basisPersonen;

  var totaal = basis;

  for (var i = 0; i < nachten; i++) {
    var nacht = plusDagen(aankomst, i);
    for (var b2 = 0; b2 < bezet.length; b2++) {
      var van = alsDatum(bezet[b2].van);
      var tot = alsDatum(bezet[b2].tot);
      if (van && tot && nacht >= van && nacht < tot) return { fout: "Die periode is niet meer vrij." };
    }
    if (basisSEK) {
      var sek = huisjes[alsTekst(nacht)];
      if (typeof sek !== "number") sek = basisSEK;
      totaal += demp(sek / koers / perHuisje(personen) - basisSEK / koers / basisPersonen);
    }
  }

  totaal += autoDeel(personen, dagen) - autoInBasis;

  var opties = data.opties || {};
  var omschrijving = "Schaatsreis Falun, " + dagen + " dagen vanaf " + schrijfDatum(aankomst) +
    ", " + personen + (personen === 1 ? " persoon" : " personen");

  if (keuze.vlucht === "zelf") {
    totaal -= Math.abs(opties.vluchtZelf || 0);
    omschrijving += ", eigen vlucht";
  }
  if (keuze.auto === "zelf") {
    totaal -= autoDeel(personen, dagen);
    omschrijving += ", eigen vervoer";
  }
  var begDagen = parseInt(keuze.begeleiding, 10);
  if (begDagen > 0) {
    var beg = opties.begeleiding || {};
    var begVan = alsDatum(beg.van);
    var begTot = alsDatum(beg.tot);
    if (typeof beg.prijsPerDag !== "number") return { fout: "Begeleiding is nog niet te boeken." };
    if (!begVan || !begTot || aankomst < begVan || plusDagen(aankomst, nachten) > begTot) {
      return { fout: "Begeleiding kan niet in die periode." };
    }
    // Zelfde rekenwijze als in js/falun-kalender.js: per reisdag, en gedeeld
    // over de groep als het niet per persoon gerekend wordt. Het dagbedrag
    // hangt af van de groep: prijsPerDag voor 1 persoon, plus
    // prijsPerDagExtraPersoon voor elke persoon meer.
    if (begDagen > dagen) return { fout: "Zoveel dagen begeleiding passen niet in de reis." };
    var begExtra = typeof beg.prijsPerDagExtraPersoon === "number" ? beg.prijsPerDagExtraPersoon : 0;
    var begPerDag = beg.prijsPerDag + begExtra * (personen - 1);
    var begTotaal = begPerDag * begDagen;
    totaal += beg.perPersoon === false ? begTotaal / personen : begTotaal;
    omschrijving += ", met " + begDagen + (begDagen === 1 ? " dag" : " dagen") + " begeleiding";
  }

  // Alles hierboven is per persoon. Afgerekend wordt voor de hele groep:
  // eerst per persoon afronden, dan vermenigvuldigen, net als de kalender.
  var perPersoon = Math.round(totaal);
  if (!(perPersoon > 0)) return { fout: "Ongeldig bedrag." };
  omschrijving += ", €" + perPersoon.toLocaleString("nl-NL") + " p.p.";
  return { bedrag: perPersoon * personen, perPersoon: perPersoon, omschrijving: omschrijving };
}

function origineOngeldig(req) {
  var origin = req.headers.origin;
  if (!origin) return false; // geen Origin-header (bv. curl/oude browser): niet blokkeren
  return TOEGESTANE_ORIGINS.indexOf(origin) === -1;
}


module.exports = { berekenFalun: berekenFalun };
