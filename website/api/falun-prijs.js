/* Vercel serverless function — geeft de prijs van een Falun-keuze terug.

   De betaalpagina vraagt hier het bedrag op, zodat op het scherm precies staat
   wat er straks afgeschreven wordt. Er wordt niets betaald of opgeslagen; dit
   rekent alleen. Het echte afrekenen loopt via create-payment.js, dat dezelfde
   berekening gebruikt.

   Naast personen kan de keuze kinderen (2 t/m 11 jaar) en baby (0 en 1 jaar)
   bevatten. Het antwoord geeft dan ook de prijs per kind en per baby; het
   vliegbedrag zelf blijft op de server (api/_prijsbeleid.js). */

var berekenFalun = require("./_falun-prijs.js").berekenFalun;

var TOEGESTANE_ORIGINS = ["https://novakse.com", "https://www.novakse.com", "http://localhost:3000"];

function origineOngeldig(req) {
  var origin = req.headers.origin;
  if (!origin) return false; // geen Origin-header (bv. curl/oude browser): niet blokkeren
  return TOEGESTANE_ORIGINS.indexOf(origin) === -1;
}

module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Methode niet toegestaan." });
    return;
  }

  if (origineOngeldig(req)) {
    res.status(403).json({ error: "Niet toegestaan." });
    return;
  }

  var uitkomst = berekenFalun(req.body || {});
  res.setHeader("Cache-Control", "no-store");
  if (uitkomst.fout) {
    res.status(400).json({ error: uitkomst.fout });
    return;
  }

  res.status(200).json({
    bedrag: uitkomst.bedrag,
    perPersoon: uitkomst.perPersoon,
    perKind: uitkomst.perKind,
    perBaby: uitkomst.perBaby,
    personen: uitkomst.personen,
    volwassenen: uitkomst.volwassenen,
    kinderen: uitkomst.kinderen,
    baby: uitkomst.baby,
    omschrijving: uitkomst.omschrijving
  });
};
