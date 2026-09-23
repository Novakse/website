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
  var datumTekst = kort(body.datumTekst, 80) || datum;
  var duur = Math.min(Math.max(parseInt(body.duurMinuten, 10) || 20, 5), 120);

  if (!DATUM_PATROON.test(datum) || !TIJD_PATROON.test(tijd)) {
    res.status(400).json({ error: "Kies eerst een dag en een tijdstip." });
    return;
  }
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
