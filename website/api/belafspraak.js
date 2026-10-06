/* Vercel serverless function — een aangevraagde belafspraak.

   Joey krijgt het verzoek binnen met dag, tijd en de gegevens van de
   bezoeker; de bezoeker krijgt zelf een bevestiging op het opgegeven
   e-mailadres. Beide mails gaan via Resend.

   Vereist de environment variable RESEND_API_KEY in de Vercel-instellingen,
   net als api/send-aanvraag.js. Het verzendadres moet op het geverifieerde
   domein novakse.com staan, anders weigert Resend de e-mail. */

var NAAR = "schaatsennovakse@outlook.com";
var VAN = process.env.RESEND_FROM_EMAIL || "Novakse website <aanvraag@novakse.com>";
var TELEFOON_JOEY = "+31 6 17467643";
var EMAIL_PATROON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var DATUM_PATROON = /^\d{4}-\d{2}-\d{2}$/;
var TIJD_PATROON = /^\d{2}:\d{2}$/;
var TOEGESTANE_ORIGINS = ["https://novakse.com", "https://www.novakse.com", "http://localhost:3000"];
var WEEKDAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
var MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december"];

var fs = require("fs");
var path = require("path");

/* The planner's own schedule (data/belafspraak.json, the file the page
   reads), so the server only accepts a moment the page could offer: a day
   and time in the week schedule or under "extra", not closed, not taken, in
   the future and not further ahead than the calendar opens. Read on every
   request, like the price files. Returns null when it cannot be read; the
   format checks below still apply then. */
function leesSchema() {
  var kandidaten = [
    path.join(process.cwd(), "website", "data", "belafspraak.json"),
    path.join(process.cwd(), "data", "belafspraak.json"),
    path.join(__dirname, "..", "data", "belafspraak.json")
  ];
  for (var i = 0; i < kandidaten.length; i++) {
    try {
      if (fs.existsSync(kandidaten[i])) return JSON.parse(fs.readFileSync(kandidaten[i], "utf8"));
    } catch (fout) { return null; }
  }
  return null;
}

// "2026-10-05" as a UTC date, or null for a day that does not exist.
function alsDatum(tekst) {
  if (!DATUM_PATROON.test(tekst)) return null;
  var d = tekst.split("-");
  var datum = new Date(Date.UTC(+d[0], +d[1] - 1, +d[2]));
  if (isNaN(datum.getTime()) || datum.getUTCMonth() !== +d[1] - 1 || datum.getUTCDate() !== +d[2]) return null;
  return datum;
}

// How far the Netherlands is ahead of UTC at this moment (summer/winter time).
function nlVerschil(tijdstip) {
  var deel = {};
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam", hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  }).formatToParts(new Date(tijdstip)).forEach(function (p) { deel[p.type] = p.value; });
  var uur = +deel.hour === 24 ? 0 : +deel.hour;
  return Date.UTC(+deel.year, +deel.month - 1, +deel.day, uur, +deel.minute, +deel.second) - tijdstip;
}

// "2026-10-05" + "10:30" in Dutch time -> the real moment in ms. Same
// calculation as tijdstipVan() in js/belafspraak.js.
function tijdstipVan(datumTekst, tijdTekst) {
  var d = datumTekst.split("-");
  var t = tijdTekst.split(":");
  var gok = Date.UTC(+d[0], +d[1] - 1, +d[2], +t[0], +t[1]);
  return gok - nlVerschil(gok - nlVerschil(gok));
}

/* null when the moment is bookable, otherwise the Dutch reason. */
function momentFout(schema, datum, tijd, datumObj) {
  if (!schema || !schema.weekschema) return null;
  var lijst = function (waarde) { return Array.isArray(waarde) ? waarde : []; };
  var moment = datum + " " + tijd;
  var tijden = lijst(schema.weekschema[WEEKDAGEN[datumObj.getUTCDay()]]);
  var extra = lijst(schema.extra).indexOf(moment) !== -1;
  if (tijden.indexOf(tijd) === -1 && !extra) return "Op dat moment belt Joey niet. Kies een ander tijdstip.";
  if (lijst(schema.gesloten).indexOf(datum) !== -1) return "Die dag belt Joey niet. Kies een andere dag.";
  if (lijst(schema.bezet).indexOf(moment) !== -1) return "Dat tijdstip is al bezet. Kies een ander tijdstip.";
  var start = tijdstipVan(datum, tijd);
  if (start <= Date.now()) return "Dat tijdstip is al voorbij. Kies een ander moment.";
  var maxDagen = typeof schema.maxDagenVooruit === "number" ? schema.maxDagenVooruit : 42;
  if (start > Date.now() + (maxDagen + 1) * 86400000) return "Zo ver vooruit kun je nog niet inplannen.";
  return null;
}

function origineOngeldig(req) {
  var origin = req.headers.origin;
  if (!origin) return false; // geen Origin-header (bv. curl/oude browser): niet blokkeren
  return TOEGESTANE_ORIGINS.indexOf(origin) === -1;
}

function kort(waarde, maximum) {
  return String(waarde == null ? "" : waarde).slice(0, maximum).trim();
}

async function verstuur(apiKey, mail) {
  var respons = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(mail)
  });
  if (!respons.ok) {
    var fout = await respons.json().catch(function () { return {}; });
    throw new Error(fout.message || "Resend gaf een fout terug.");
  }
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

  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "E-mail versturen is nog niet ingesteld (RESEND_API_KEY ontbreekt)." });
    return;
  }

  var body = req.body || {};

  // Honeypot: bots vullen vaak elk veld in, echte bezoekers zien dit veld
  // nooit. Doe alsof het gelukt is, maar verstuur niets.
  if (kort(body.website, 200)) {
    res.status(200).json({ ok: true });
    return;
  }

  var datum = kort(body.datum, 10);
  var tijd = kort(body.tijd, 5);
  var naam = kort(body.naam, 120);
  var telefoon = kort(body.telefoon, 40);
  var email = kort(body.email, 200);
  var onderwerp = kort(body.onderwerp, 120);
  var toelichting = kort(body.toelichting, 2000);

  var datumObj = alsDatum(datum);
  if (!datumObj || !TIJD_PATROON.test(tijd) || +tijd.slice(0, 2) > 23 || +tijd.slice(3) > 59) {
    res.status(400).json({ error: "Kies eerst een dag en een tijdstip." });
    return;
  }

  // Day text and length come from the server, not from the browser, so the
  // e-mails only ever show what the schedule really offers.
  var schema = leesSchema();
  var ongeldig = momentFout(schema, datum, tijd, datumObj);
  if (ongeldig) {
    res.status(400).json({ error: ongeldig });
    return;
  }
  var datumTekst = WEEKDAGEN[datumObj.getUTCDay()] + " " + datumObj.getUTCDate() + " " + MAANDEN[datumObj.getUTCMonth()];
  var duur = schema && typeof schema.duurMinuten === "number" && schema.duurMinuten > 0 ? schema.duurMinuten : 20;
  if (!naam || !telefoon || !EMAIL_PATROON.test(email)) {
    res.status(400).json({ error: "Vul je naam, telefoonnummer en een geldig e-mailadres in." });
    return;
  }

  var moment = datumTekst + " om " + tijd + " (Nederlandse tijd)";

  var naarJoey = [
    "Nieuwe belafspraak aangevraagd.",
    "",
    "Wanneer: " + moment,
    "Duur: " + duur + " minuten",
    "",
    "Naam: " + naam,
    "Telefoon: " + telefoon,
    "E-mail: " + email,
    "Onderwerp: " + (onderwerp || "niet opgegeven"),
    "",
    "Toelichting:",
    toelichting || "(geen)",
    "",
    "De bezoeker heeft zelf al een bevestiging van dit moment gekregen.",
    "Zet het moment in data/belafspraak.json onder \"bezet\" als je wilt dat",
    "niemand anders het nog kan kiezen: \"" + datum + " " + tijd + "\""
  ].join("\n");

  var naarBezoeker = [
    "Hoi " + naam + ",",
    "",
    "Je belafspraak staat genoteerd:",
    "",
    moment,
    "",
    "Joey belt je dan op " + telefoon + ". Het gesprek duurt ongeveer " +
      duur + " minuten en is helemaal vrijblijvend.",
    "",
    onderwerp ? "Je gaf aan dat het gaat over: " + onderwerp + "\n" : null,
    "Komt het toch niet uit, of wil je iets doorgeven? Stuur een berichtje",
    "naar " + NAAR + " of app naar " + TELEFOON_JOEY + ".",
    "",
    "Tot dan!",
    "Joey - Novakse Reizen",
    "https://www.novakse.com"
  ].filter(function (regel) { return regel !== null; }).join("\n");

  try {
    await verstuur(apiKey, {
      from: VAN,
      to: [NAAR],
      reply_to: email,
      subject: "Belafspraak: " + datumTekst + " " + tijd + " - " + naam,
      text: naarJoey
    });
  } catch (fout) {
    res.status(502).json({ error: "Kon de aanvraag niet versturen." });
    return;
  }

  // De aanvraag staat nu bij Joey. Lukt de bevestiging naar de bezoeker niet,
  // dan is dat vervelend maar niet erg genoeg om de aanvraag te laten mislukken.
  try {
    await verstuur(apiKey, {
      from: VAN,
      to: [email],
      reply_to: NAAR,
      subject: "Je belafspraak met Novakse: " + datumTekst + " om " + tijd,
      text: naarBezoeker
    });
  } catch (fout) {
    res.status(200).json({ ok: true, bevestigingVerstuurd: false });
    return;
  }

  res.status(200).json({ ok: true, bevestigingVerstuurd: true });
};
