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

var falunData = null;
function falunPrijzen() {
  if (falunData) return falunData;
  var bestand = path.join(process.cwd(), "website", "data", "falun-prijzen.json");
  if (!fs.existsSync(bestand)) {
    bestand = path.join(process.cwd(), "data", "falun-prijzen.json");
  }
  falunData = JSON.parse(fs.readFileSync(bestand, "utf8"));
  return falunData;
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
  if ((data.duur || [4, 5]).indexOf(dagen) === -1) return { fout: "Ongeldige reisduur." };

  var basis = data.basisprijs && data.basisprijs[String(dagen)];
  if (typeof basis !== "number") return { fout: "Ongeldige reisduur." };

  var nachten = dagen - 1;
  if (aankomst < seizoenVan) return { fout: "Die aankomstdag valt buiten het seizoen." };
  if (plusDagen(aankomst, nachten) > seizoenTot) return { fout: "Dat verblijf past niet binnen het seizoen." };

  var bezet = data.bezet || [];
  var toeslagen = data.toeslagPerNacht || {};
  var totaal = basis;

  for (var i = 0; i < nachten; i++) {
    var nacht = plusDagen(aankomst, i);
    for (var b = 0; b < bezet.length; b++) {
      var van = alsDatum(bezet[b].van);
      var tot = alsDatum(bezet[b].tot);
      if (van && tot && nacht >= van && nacht < tot) return { fout: "Die periode is niet meer vrij." };
    }
    var toeslag = toeslagen[alsTekst(nacht)];
    if (typeof toeslag === "number") totaal += toeslag;
  }

  var opties = data.opties || {};
  var omschrijving = "Schaatsreis Falun, " + dagen + " dagen vanaf " + schrijfDatum(aankomst);

  if (keuze.vlucht === "zelf") {
    totaal -= Math.abs(opties.vluchtZelf || 0);
    omschrijving += ", eigen vlucht";
  }
  if (keuze.auto === "zelf") {
    totaal -= Math.abs(opties.huurautoZelf || 0);
    omschrijving += ", eigen vervoer";
  }
  if (keuze.begeleiding === "ja") {
    var beg = opties.begeleiding || {};
    var begVan = alsDatum(beg.van);
    var begTot = alsDatum(beg.tot);
    if (typeof beg.prijs !== "number") return { fout: "Begeleiding is nog niet te boeken." };
    if (!begVan || !begTot || aankomst < begVan || plusDagen(aankomst, nachten) > begTot) {
      return { fout: "Begeleiding kan niet in die periode." };
    }
    totaal += beg.prijs;
    omschrijving += ", met begeleiding";
  }

  if (!(totaal > 0)) return { fout: "Ongeldig bedrag." };
  return { bedrag: totaal, omschrijving: omschrijving };
}

function origineOngeldig(req) {
  var origin = req.headers.origin;
  if (!origin) return false; // geen Origin-header (bv. curl/oude browser): niet blokkeren
  return TOEGESTANE_ORIGINS.indexOf(origin) === -1;
}


module.exports = { berekenFalun: berekenFalun };
