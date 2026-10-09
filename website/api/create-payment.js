/* Vercel serverless function — maakt een Stripe Checkout-sessie aan.
   Vereist de environment variable STRIPE_API_KEY in de Vercel-projectinstellingen. */

function toFormParams(waarde, prefix) {
  var params = [];
  Object.keys(waarde).forEach(function (key) {
    var deel = waarde[key];
    var paramKey = prefix ? prefix + "[" + key + "]" : key;
    if (deel === undefined || deel === null) return;
    if (typeof deel === "object") {
      params = params.concat(toFormParams(deel, paramKey));
    } else {
      params.push(encodeURIComponent(paramKey) + "=" + encodeURIComponent(deel));
    }
  });
  return params;
}

var TOEGESTANE_ORIGINS = ["https://novakse.com", "https://www.novakse.com", "http://localhost:3000"];
var MAX_BEDRAG_CENTEN = 2000000; // €20.000 — ruim boven een reële boeking, tegen misbruik (bv. "card testing")
// Amounts the server calculates itself (Falun and the calendar trips) can
// exceed that for a big group on a long stay (20 people, 5 days Lulea is
// already over €22.000). They cannot be tampered with, so they only get
// Stripe's own ceiling for a single payment (€999.999,99).
var MAX_SERVER_BEDRAG_CENTEN = 99999999;

var berekenFalun = require("./_falun-prijs.js").berekenFalun;

// Trips whose price is calculated by api/_reis-prijs.js. The browser sends
// only the choices; the amount always comes from the server.
var REIS_NAMEN = { lulea: "Lulea", orsa: "Orsa", weissensee: "Weissensee", finland: "Finland", wellness: "Wellness & schaatsen" };
// Product name when the description is missing; without an entry it is
// "Schaatsreis <name>". Same as reis.product in api/_reis-prijs.js.
var REIS_PRODUCTEN = { wellness: "Wellness & schaatsen" };

// Base URL for the return pages. Always the fixed production domain, so a
// spoofed Host header can never send a paying visitor elsewhere. Only a local
// development host (localhost / 127.0.0.1) keeps its own base, over http.
// Same as basisUrl() in api/salen-checkout.js.
var PRODUCTIE_BASIS = "https://www.novakse.com";
function basisUrl(req) {
  var host = String(req.headers.host || "");
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return "http://" + host;
  return PRODUCTIE_BASIS;
}

// Age rules for children and babies (api/_kinderprijs.js). Loaded on first
// use, like the trip module below; a payment link from Joey never needs it.
function kinderprijs() {
  return require("./_kinderprijs.js");
}

// Loaded on first use, so a problem in the trip module can never break the
// Falun flow or Joey's payment links.
function berekenReis(keuze) {
  var module;
  try { module = require("./_reis-prijs.js"); } catch (fout) { return { fout: "De prijzen zijn niet beschikbaar." }; }
  return module.berekenReis(keuze);
}

/* Group trips with fixed dates (?reis=groepsreis-orsa / groepsreis-falun),
   priced by api/_groepsreis.js with js/groepsreis-prijs.js and
   data/groepsreizen.json, the same code and file the page uses. Loaded on
   first use, like the trip module above. Every "groepsreis-..." key takes
   this route, so such a booking can never fall through to the generic flow
   that charges the browser amount. */
function isGroepsreis(reisSleutel) {
  return reisSleutel.indexOf("groepsreis-") === 0;
}
function prijsGroepsreis(keuze) {
  var module;
  try { module = require("./_groepsreis.js"); } catch (fout) { return { ok: false, fout: "De prijzen zijn niet beschikbaar.", status: 500 }; }
  return module.prijsGroepsreis(keuze);
}

/* Optional activities at checkout (Falun, Wellness and the group trips
   only). Priced with js/activiteiten-prijs.js and data/activiteiten.json,
   the same code and file uitchecken.html uses, so the page and Stripe always
   agree. Both are loaded
   only when a booking sends activities, so a problem there can never break a
   payment without them. */
function activiteitenCatalogus() {
  var fs = require("fs");
  var path = require("path");
  var kandidaten = [
    path.join(process.cwd(), "website", "data", "activiteiten.json"),
    path.join(process.cwd(), "data", "activiteiten.json"),
    path.join(__dirname, "..", "data", "activiteiten.json")
  ];
  for (var i = 0; i < kandidaten.length; i++) {
    if (fs.existsSync(kandidaten[i])) {
      return JSON.parse(fs.readFileSync(kandidaten[i], "utf8"));
    }
  }
  throw new Error("activiteiten.json not found");
}

// Did the browser send any activities? {} and "" count as none.
function heeftActiviteiten(waarde) {
  if (waarde === undefined || waarde === null || waarde === "") return false;
  if (typeof waarde !== "object" || Array.isArray(waarde)) return true; // bereken() refuses it
  return Object.keys(waarde).length > 0;
}

/* Returns null (no activities chosen), { fout, status } or the result of
   bereken() plus query (the validated choice as "id:2,id2:1"). ctx holds the
   head count and days the server calculated for the trip itself. */
function berekenActiviteiten(reis, keuze, ctx) {
  if (!heeftActiviteiten(keuze)) return null;
  var module;
  var catalogus;
  try {
    module = require("../js/activiteiten-prijs.js");
    catalogus = activiteitenCatalogus();
  } catch (fout) {
    return { fout: "De activiteiten zijn nu niet beschikbaar.", status: 500 };
  }
  var uitkomst;
  try {
    uitkomst = module.bereken(catalogus, reis, keuze, ctx);
  } catch (fout) {
    uitkomst = { fout: "De activiteiten konden niet worden berekend." };
  }
  if (!uitkomst || uitkomst.fout) {
    return { fout: (uitkomst && uitkomst.fout) || "De activiteiten konden niet worden berekend.", status: 400 };
  }
  if (!uitkomst.regels.length) return null; // only zeros: nothing to charge
  var gekozen = {};
  uitkomst.regels.forEach(function (regel) { gekozen[regel.id] = regel.aantal; });
  uitkomst.query = module.naarQuery(gekozen);
  uitkomst.euro = module.euro;
  return uitkomst;
}

// Stripe metadata values may be at most 500 characters: split a long
// "id:2,id2:1" list at the commas over activiteiten, activiteiten_2, ...
function activiteitenMetadata(query) {
  var delen = [];
  var huidig = "";
  query.split(",").forEach(function (stuk) {
    if (huidig && (huidig + "," + stuk).length > 500) {
      delen.push(huidig);
      huidig = stuk;
    } else {
      huidig = huidig ? huidig + "," + stuk : stuk;
    }
  });
  if (huidig) delen.push(huidig);
  var uit = {};
  delen.slice(0, 4).forEach(function (deel, index) {
    uit[index ? "activiteiten_" + (index + 1) : "activiteiten"] = deel.slice(0, 500);
  });
  return uit;
}

// Euros (possibly with cents, e.g. 199.5) to a whole number of cents.
function naarCenten(euro) {
  var getal = Number(euro);
  if (!isFinite(getal)) return 0;
  return Math.round(getal * 100);
}

// Short, safe text for Stripe metadata (values may be at most 500 characters).
function kort(waarde, max) {
  if (waarde === undefined || waarde === null || waarde === "") return undefined;
  return String(waarde).slice(0, max || 100);
}
function alleenDatum(waarde) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(waarde)) ? String(waarde) : "";
}
function alleenGetal(waarde) {
  return /^\d{1,3}$/.test(String(waarde)) ? String(parseInt(waarde, 10)) : "";
}

// Query string for the cancel page, so the visitor lands back on
// uitchecken.html with the same choice they came with. Only known keys with
// validated values are copied; empty values are left out.
function queryString(paren) {
  return Object.keys(paren)
    .filter(function (sleutel) { return paren[sleutel]; })
    .map(function (sleutel) { return encodeURIComponent(sleutel) + "=" + encodeURIComponent(paren[sleutel]); })
    .join("&");
}

/* Travel details from the "Reisgegevens" step (js/reisgegevens.js). Every
   trip payment must carry them: travellers for the flight, contact details
   and the accepted terms (required); with a rental car also the main driver
   and the optional credit card and driving licence confirmations. Returns
   { metadata, email } or { fout: "Dutch message" }. The values end up in the
   Stripe metadata (max 500 characters per value, 50 keys in total). */
var MAX_REIZIGERS = 20;
var EMAIL_PATROON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function tekstVeld(waarde, max) {
  var tekst = typeof waarde === "string" ? waarde.replace(/\s+/g, " ").trim() : "";
  return tekst.length && tekst.length <= max ? tekst : "";
}
function geboortedatum(waarde) {
  var tekst = alleenDatum(waarde);
  if (!tekst) return "";
  var d = tekst.split("-");
  var datum = new Date(Date.UTC(+d[0], +d[1] - 1, +d[2]));
  if (isNaN(datum.getTime()) || datum.getUTCDate() !== +d[2]) return "";
  if (datum.getTime() > Date.now() || +d[0] < 1900) return "";
  return tekst;
}
/* leeftijdsControle (calendar bookings only) = { datum, volwassenen, kinderen,
   baby }: the outbound day and the head count the server priced. The dates of
   birth must give exactly that split (age on the outbound day), so a date of
   birth can never silently change the price: a mismatch is refused and the
   visitor corrects the head count in the calendar. At least one traveller,
   and the main driver, must be 21 or older.
   groepsreis (true for a group trip): adults only and no calendar, so the
   age message says that instead; there is no own transport to record. */
function leesReisgegevens(gegevens, verwachtAantal, metAuto, leeftijdsControle, groepsreis) {
  var ontbreekt = { fout: "Vul eerst de reisgegevens volledig in." };
  if (!gegevens || typeof gegevens !== "object") return ontbreekt;

  var lijst = Array.isArray(gegevens.reizigers) ? gegevens.reizigers : [];
  if (!lijst.length || lijst.length > MAX_REIZIGERS) return ontbreekt;
  if (verwachtAantal && lijst.length !== verwachtAantal) {
    return { fout: "Het aantal reizigers klopt niet met je boeking." };
  }

  var metadata = {};
  var namen = [];
  var leeftijden = []; // whole years on the outbound day (calendar bookings)
  var telling = { volwassene: 0, kind: 0, baby: 0 };
  for (var i = 0; i < lijst.length; i++) {
    var r = lijst[i] || {};
    var voornamen = tekstVeld(r.voornamen, 100);
    var achternaam = tekstVeld(r.achternaam, 100);
    var geboren = geboortedatum(r.geboortedatum);
    var nationaliteit = tekstVeld(r.nationaliteit, 60);
    if (!voornamen || !achternaam || !geboren || !nationaliteit) return ontbreekt;
    namen.push(voornamen + " " + achternaam);
    var categorie = "";
    if (leeftijdsControle) {
      var jaren = kinderprijs().leeftijdOp(geboren, leeftijdsControle.datum);
      categorie = kinderprijs().categorieVoorLeeftijd(jaren);
      leeftijden.push(jaren);
      if (categorie) telling[categorie]++;
    }
    metadata["reiziger_" + (i + 1)] = voornamen + " " + achternaam + " | geb. " + geboren + " | " + nationaliteit +
      (categorie ? " | " + categorie : "");
  }

  if (leeftijdsControle) {
    if (telling.volwassene !== leeftijdsControle.volwassenen || telling.kind !== leeftijdsControle.kinderen ||
        telling.baby !== leeftijdsControle.baby) {
      if (groepsreis) {
        return { fout: "Deze groepsreis is alleen voor volwassenen: iedere reiziger moet op de dag van aankomst " +
          "12 jaar of ouder zijn. Controleer de geboortedata." };
      }
      return { fout: "De geboortedata passen niet bij het aantal volwassenen, kinderen en baby's in je boeking. " +
        "De leeftijd telt op de dag van aankomst: volwassene vanaf 12 jaar, kind van 2 t/m 11 jaar, baby van 0 en 1 jaar. " +
        "Pas het aantal aan in de kalender of controleer de geboortedatum." };
    }
    var minimum = kinderprijs().MIN_LEEFTIJD_BESTUURDER;
    if (!leeftijden.some(function (jaren) { return jaren >= minimum; })) {
      return { fout: "Minstens een reiziger moet " + minimum + " jaar of ouder zijn op de dag van aankomst." };
    }
  }

  var email = tekstVeld(gegevens.email, 200);
  var telefoon = tekstVeld(gegevens.telefoon, 40);
  if (!email || !EMAIL_PATROON.test(email) || !telefoon) return ontbreekt;
  if (gegevens.voorwaarden !== true) return { fout: "Ga eerst akkoord met de algemene voorwaarden." };

  metadata.contact_email = email;
  metadata.contact_telefoon = telefoon;
  metadata.voorwaarden_akkoord = "ja";

  if (metAuto) {
    var bestuurder = parseInt(gegevens.hoofdbestuurder, 10);
    if (!(bestuurder >= 1 && bestuurder <= lijst.length)) return ontbreekt;
    if (leeftijdsControle && !(leeftijden[bestuurder - 1] >= kinderprijs().MIN_LEEFTIJD_BESTUURDER)) {
      return { fout: "De hoofdbestuurder moet " + kinderprijs().MIN_LEEFTIJD_BESTUURDER + " jaar of ouder zijn op de dag van aankomst." };
    }
    metadata.hoofdbestuurder = namen[bestuurder - 1] + " | geb. " + geboortedatum(lijst[bestuurder - 1].geboortedatum);
    // Optional confirmations: recorded, but they do not block payment.
    metadata.creditcard_bevestigd = gegevens.creditcard === true ? "ja" : "nee";
    metadata.rijbewijs_bevestigd = gegevens.rijbewijs === true ? "ja" : "nee";
  } else if (!groepsreis) {
    metadata.huurauto = "eigen vervoer";
  }

  return { metadata: metadata, email: email };
}

function origineOngeldig(req) {
  var origin = req.headers.origin;
  if (!origin) return false; // geen Origin-header (bv. curl/oude browser): niet blokkeren
  return TOEGESTANE_ORIGINS.indexOf(origin) === -1;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Methode niet toegestaan." });
    return;
  }

  if (origineOngeldig(req)) {
    res.status(403).json({ error: "Niet toegestaan." });
    return;
  }

  var apiKey = process.env.STRIPE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Stripe is nog niet ingesteld (STRIPE_API_KEY ontbreekt)." });
    return;
  }

  var body = req.body || {};
  var bedrag; // in cents
  var omschrijving;
  var productNaam;
  var metadata; // trip details; always set once the travel details are added
  var serverBerekend = false; // true when the amount comes from a price file
  var terugQuery = ""; // query string for the cancel URL
  var terugPagina = "/uitchecken.html"; // page for the cancel URL
  var reisSleutel = String(body.reis || "").toLowerCase();
  var groepsreis = isGroepsreis(reisSleutel);
  var activiteiten = null; // chosen activities (Falun, Wellness and the group trips only)
  var leeftijdsControle = null; // outbound day and head count split, set for calendar bookings

  // Activities can only be added to a Falun or Wellness calendar booking or
  // a group trip (which uses Falun's list, see data/activiteiten.json).
  var metActiviteiten = (body.reis === "Falun" && body.aankomst) || (reisSleutel === "wellness" && body.van) || groepsreis;
  if (!metActiviteiten && heeftActiviteiten(body.activiteiten)) {
    res.status(400).json({ error: "Bij deze reis zijn geen activiteiten te boeken." });
    return;
  }

  if (body.reis === "Falun" && body.aankomst) {
    // Het bedrag dat de browser meestuurt wordt hier genegeerd.
    var falun = berekenFalun(body);
    if (falun.fout) {
      res.status(400).json({ error: falun.fout });
      return;
    }
    bedrag = naarCenten(falun.bedrag);
    serverBerekend = true;
    omschrijving = falun.omschrijving.slice(0, 255);
    productNaam = omschrijving;

    activiteiten = berekenActiviteiten("falun", body.activiteiten, { personen: falun.personen, dagen: falun.dagen });
    if (activiteiten && activiteiten.fout) {
      res.status(activiteiten.status).json({ error: activiteiten.fout });
      return;
    }

    // Metadata and the cancel link use the values berekenFalun() validated,
    // so they always match what is charged.
    var falunOpties = [];
    if (body.vlucht === "zelf") falunOpties.push("eigen vlucht");
    if (body.auto === "zelf") falunOpties.push("eigen vervoer");
    if (falun.begeleidingDagen > 0) falunOpties.push("begeleiding " + falun.begeleidingDagen + " dagen");
    metadata = {
      reis: "Falun",
      aankomst: kort(alleenDatum(body.aankomst)),
      dagen: kort(falun.dagen),
      personen: kort(falun.personen),
      volwassenen: kort(falun.volwassenen),
      kinderen: falun.kinderen > 0 ? kort(falun.kinderen) : undefined,
      baby: falun.baby > 0 ? kort(falun.baby) : undefined,
      opties: kort(falunOpties.join(", "), 200),
      per_persoon_eur: kort(falun.perPersoon),
      per_kind_eur: falun.kinderen > 0 ? kort(falun.perKind) : undefined,
      per_baby_eur: falun.baby > 0 ? kort(falun.perBaby) : undefined,
      totaal_eur: kort(falun.bedrag)
    };
    leeftijdsControle = {
      datum: alleenDatum(body.aankomst),
      volwassenen: falun.volwassenen,
      kinderen: falun.kinderen,
      baby: falun.baby
    };
    terugQuery = queryString({
      reis: "Falun",
      aankomst: alleenDatum(body.aankomst),
      dagen: String(falun.dagen),
      personen: String(falun.personen),
      kinderen: falun.kinderen > 0 ? String(falun.kinderen) : "",
      baby: falun.baby > 0 ? String(falun.baby) : "",
      vlucht: body.vlucht === "zelf" ? "zelf" : "",
      auto: body.auto === "zelf" ? "zelf" : "",
      begeleiding: falun.begeleidingDagen > 0 ? String(falun.begeleidingDagen) : "",
      act: activiteiten ? activiteiten.query : ""
    });
  } else if (groepsreis) {
    // Group trip with fixed dates: only the trip and the head count come from
    // the browser; the amount is calculated here and the browser amount is
    // ignored. Raw head count: only whole numbers are accepted.
    var groep;
    try {
      groep = prijsGroepsreis({
        reis: reisSleutel,
        personen: typeof body.personen === "number" ? body.personen : String(body.personen || "")
      });
    } catch (fout) {
      groep = { ok: false, fout: "De prijs kon niet worden berekend.", status: 500 };
    }
    if (!groep || !groep.ok) {
      res.status((groep && groep.status) || 400).json({ error: (groep && groep.fout) || "De prijs kon niet worden berekend." });
      return;
    }

    var groepReis = groep.reis;
    var groepPrijs = groep.uitkomst;
    bedrag = groepPrijs.totaalCenten;
    serverBerekend = true;
    omschrijving = groep.omschrijving.slice(0, 255);
    productNaam = omschrijving;

    // Activities per person per day count over activiteitenDagen (the whole
    // trip, as with Falun). The alias in data/activiteiten.json gives Falun's
    // list and prices.
    activiteiten = berekenActiviteiten(groepPrijs.reis, body.activiteiten,
      { personen: groepPrijs.personen, dagen: groepReis.activiteitenDagen });
    if (activiteiten && activiteiten.fout) {
      res.status(activiteiten.status).json({ error: activiteiten.fout });
      return;
    }

    // Metadata and the cancel link use what the calculation validated.
    // The number of travellers in the travel details is capped at
    // MAX_REIZIGERS (20): raise that too before maxPersonen goes above it.
    metadata = {
      reis: groepReis.naam,
      reistype: "groepsreis",
      van: kort(groepReis.van),
      tot: kort(groepReis.tot),
      dagen: kort(groepReis.dagen),
      personen: kort(groepPrijs.personen),
      per_persoon_eur: kort(groepPrijs.perPersoonEur),
      totaal_eur: kort(groepPrijs.totaalEur)
    };
    // Adults only (12 and older on the arrival day), no child price.
    leeftijdsControle = {
      datum: groepReis.van,
      volwassenen: groepPrijs.personen,
      kinderen: 0,
      baby: 0
    };
    terugPagina = "/" + groepPrijs.reis + ".html"; // whitelisted key
    terugQuery = queryString({
      personen: String(groepPrijs.personen),
      act: activiteiten ? activiteiten.query : ""
    });
  } else if (REIS_NAMEN.hasOwnProperty(reisSleutel) && body.van) {
    // Lulea, Orsa, Weissensee, Finland, Wellness from a price calendar: the browser
    // amount is ignored, the server calculates the full group price from the
    // choices. Without "van" it is one of Joey's payment links and falls
    // through to the generic flow below, just like Falun without "aankomst".
    // Raw values: berekenReis() accepts only whole numbers ("3", not "3abc")
    // and real dates, so what is charged is exactly what was validated.
    var keuze = {
      reis: reisSleutel,
      van: String(body.van || ""),
      tot: String(body.tot || ""),
      personen: typeof body.personen === "number" ? body.personen : String(body.personen || ""),
      kinderen: typeof body.kinderen === "number" ? body.kinderen : String(body.kinderen || ""),
      baby: typeof body.baby === "number" ? body.baby : String(body.baby || ""),
      begeleiding: typeof body.begeleiding === "number" ? body.begeleiding : String(body.begeleiding || ""),
      // Own flight: only "zelf" counts, as in the Falun flow above.
      vlucht: body.vlucht === "zelf" ? "zelf" : ""
    };

    var reisPrijs;
    try {
      reisPrijs = berekenReis(keuze);
    } catch (fout) {
      reisPrijs = { fout: "De prijs kon niet worden berekend." };
    }
    if (!reisPrijs || reisPrijs.fout) {
      res.status(400).json({ error: (reisPrijs && reisPrijs.fout) || "De prijs kon niet worden berekend." });
      return;
    }

    var naam = REIS_NAMEN[reisSleutel];
    bedrag = naarCenten(reisPrijs.bedrag);
    serverBerekend = true;
    omschrijving = String(reisPrijs.omschrijving || "").slice(0, 255);
    // The description already starts with the product name ("Schaatsreis
    // <trip>", or the trip's own product name such as "Wellness & schaatsen").
    productNaam = omschrijving || (REIS_PRODUCTEN[reisSleutel] || ("Schaatsreis " + naam));

    if (reisSleutel === "wellness") {
      activiteiten = berekenActiviteiten("wellness", body.activiteiten, { personen: reisPrijs.personen, dagen: reisPrijs.dagen });
      if (activiteiten && activiteiten.fout) {
        res.status(activiteiten.status).json({ error: activiteiten.fout });
        return;
      }
    }

    // Metadata and the cancel link use what berekenReis() validated, so they
    // always match what is charged.
    var reisOpties = [];
    if (reisPrijs.eigenVlucht) reisOpties.push("eigen vlucht");
    if (reisPrijs.begeleidingDagen > 0) reisOpties.push("begeleiding " + reisPrijs.begeleidingDagen + " dagen");
    metadata = {
      reis: naam,
      van: kort(alleenDatum(body.van)),
      tot: kort(alleenDatum(body.tot)),
      nachten: kort(reisPrijs.nachten),
      personen: kort(reisPrijs.personen),
      volwassenen: kort(reisPrijs.volwassenen),
      kinderen: reisPrijs.kinderen > 0 ? kort(reisPrijs.kinderen) : undefined,
      baby: reisPrijs.baby > 0 ? kort(reisPrijs.baby) : undefined,
      opties: reisOpties.length ? kort(reisOpties.join(", "), 200) : undefined,
      per_persoon_eur: kort(reisPrijs.perPersoon),
      per_kind_eur: reisPrijs.kinderen > 0 ? kort(reisPrijs.perKind) : undefined,
      per_baby_eur: reisPrijs.baby > 0 ? kort(reisPrijs.perBaby) : undefined,
      totaal_eur: kort(reisPrijs.bedrag)
    };
    leeftijdsControle = {
      datum: alleenDatum(body.van),
      volwassenen: reisPrijs.volwassenen,
      kinderen: reisPrijs.kinderen,
      baby: reisPrijs.baby
    };
    terugQuery = queryString({
      reis: reisSleutel, // whitelisted key, as used by uitchecken.html
      van: alleenDatum(body.van),
      tot: alleenDatum(body.tot),
      personen: String(reisPrijs.personen),
      kinderen: reisPrijs.kinderen > 0 ? String(reisPrijs.kinderen) : "",
      baby: reisPrijs.baby > 0 ? String(reisPrijs.baby) : "",
      begeleiding: reisPrijs.begeleidingDagen > 0 ? String(reisPrijs.begeleidingDagen) : "",
      vlucht: reisPrijs.eigenVlucht ? "zelf" : "",
      act: activiteiten ? activiteiten.query : ""
    });
  } else {
    bedrag = parseInt(body.bedrag, 10); // bedrag in centen
    omschrijving = String(body.omschrijving || "Novakse reis").slice(0, 255);
    productNaam = omschrijving;
  }

  // bedrag is the trip; the activities come on top as their own lines.
  var activiteitenCenten = activiteiten ? activiteiten.totaalCenten : 0;
  var maxBedrag = serverBerekend ? MAX_SERVER_BEDRAG_CENTEN : MAX_BEDRAG_CENTEN;
  if (!bedrag || bedrag < 100 || bedrag + activiteitenCenten > maxBedrag) {
    res.status(400).json({ error: "Ongeldig bedrag." });
    return;
  }

  // The page sends the total it showed. If that is not what would be
  // charged now (prices changed while the page was open), stop here.
  if (body.verwachtCenten !== undefined && body.verwachtCenten !== null && body.verwachtCenten !== "") {
    var verwacht = typeof body.verwachtCenten === "number" ? body.verwachtCenten
      : /^\d{1,9}$/.test(String(body.verwachtCenten)) ? parseInt(body.verwachtCenten, 10) : NaN;
    if (verwacht !== bedrag + activiteitenCenten) {
      res.status(409).json({ error: "De prijs is gewijzigd, laad de pagina opnieuw." });
      return;
    }
  }

  // Travel details: a calendar booking must name exactly the booked head
  // count; a payment link from Joey carries no head count. Falun with own
  // transport has no rental car; a group trip has no car choice and asks no
  // main driver.
  // metadata.personen is the server-validated head count (Falun, the
  // calendar trips and the group trips alike).
  var verwachtAantal = metadata && metadata.personen ? parseInt(metadata.personen, 10) || 0 : 0;
  var metAuto = !groepsreis && !(body.reis === "Falun" && body.aankomst && body.auto === "zelf");
  var reisgegevens;
  try {
    reisgegevens = leesReisgegevens(body.reisgegevens, verwachtAantal, metAuto, leeftijdsControle, groepsreis);
  } catch (fout) {
    reisgegevens = { fout: "De reisgegevens konden niet worden gecontroleerd." };
  }
  if (reisgegevens.fout) {
    res.status(400).json({ error: reisgegevens.fout });
    return;
  }
  if (!metadata) metadata = { reis: kort(omschrijving) };
  Object.keys(reisgegevens.metadata).forEach(function (sleutel) {
    metadata[sleutel] = kort(reisgegevens.metadata[sleutel], 500);
  });
  // The chosen activities as "id:aantal" (at most 4 keys, well under
  // Stripe's 50) and their total, e.g. "1.234,56".
  if (activiteiten) {
    var actMetadata = activiteitenMetadata(activiteiten.query);
    Object.keys(actMetadata).forEach(function (sleutel) { metadata[sleutel] = actMetadata[sleutel]; });
    metadata.activiteiten_eur = activiteiten.euro(activiteitenCenten).replace("€", "");
  }

  var basis = basisUrl(req);

  var sessieData = {
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: bedrag,
          product_data: { name: productNaam }
        }
      }
    ],
    success_url: basis + "/betaling-verwerkt.html",
    cancel_url: basis + terugPagina + (terugQuery ? "?" + terugQuery : ""),
    customer_email: reisgegevens.email
  };

  // Trip and travel details visible in the Stripe dashboard, on both the
  // session and the payment. undefined values are skipped by toFormParams().
  if (metadata) {
    sessieData.metadata = metadata;
    sessieData.payment_intent_data = { metadata: metadata };
  }

  // One line per activity or rental after the trip. quantity x unit_amount
  // is exactly the line's cents from bereken(). The name is the one from
  // bereken() (activity name, line name, unit): no place or provider names.
  if (activiteiten) {
    activiteiten.regels.forEach(function (regel) {
      sessieData.line_items.push({
        quantity: regel.aantal,
        price_data: {
          currency: "eur",
          unit_amount: regel.centenPerStuk,
          product_data: { name: regel.productNaam.slice(0, 250) }
        }
      });
    });
    sessieData.payment_intent_data.description = (productNaam.replace(/[.\s]+$/, "") + ". Activiteiten: " + activiteiten.samenvatting).slice(0, 1000);
  }

  try {
    var stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: toFormParams(sessieData).join("&")
    });

    var data = await stripeRes.json();
    if (!stripeRes.ok) {
      res.status(502).json({ error: (data.error && data.error.message) || "Stripe gaf een fout terug." });
      return;
    }

    res.status(200).json({ checkoutUrl: data.url });
  } catch (fout) {
    res.status(502).json({ error: "Kon geen verbinding maken met Stripe." });
  }
};
