/* Vercel serverless function: returns the price of a Lulea, Orsa,
   Weissensee or Finland choice.

   The checkout page asks for the amount here, so the screen shows exactly
   what will be charged. Nothing is paid or stored; this only calculates. The
   real payment goes through create-payment.js, which uses the same
   calculation (api/_reis-prijs.js).

   GET  /api/reis-prijs?reis=orsa&van=2027-01-12&tot=2027-01-16&personen=2&begeleiding=2
   POST /api/reis-prijs with the same fields as a JSON body. */

var berekenReis = require("./_reis-prijs.js").berekenReis;

var TOEGESTANE_ORIGINS = ["https://novakse.com", "https://www.novakse.com", "http://localhost:3000"];

function origineOngeldig(req) {
  var origin = req.headers.origin;
  if (!origin) return false; // no Origin header (e.g. same-origin GET, curl): do not block
  return TOEGESTANE_ORIGINS.indexOf(origin) === -1;
}

/* Query parameters of a GET request. Vercel fills req.query; the local
   dev-server.js does not, so fall back to parsing req.url. A repeated key
   (?reis=a&reis=b) gives an array on Vercel; take the first value so both
   behave the same. */
function leesQuery(req) {
  var bron = req.query;
  if (!bron || typeof bron !== "object" || !Object.keys(bron).length) {
    bron = {};
    try {
      new URL(req.url || "", "http://localhost").searchParams.forEach(function (waarde, sleutel) {
        if (!(sleutel in bron)) bron[sleutel] = waarde;
      });
    } catch (fout) { /* no usable query: berekenReis reports it */ }
  }
  var uit = {};
  Object.keys(bron).forEach(function (sleutel) {
    uit[sleutel] = Array.isArray(bron[sleutel]) ? bron[sleutel][0] : bron[sleutel];
  });
  return uit;
}

module.exports = function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Methode niet toegestaan." });
    return;
  }

  if (origineOngeldig(req)) {
    res.status(403).json({ error: "Niet toegestaan." });
    return;
  }

  var bron = req.method === "GET" ? leesQuery(req) : (req.body || {});
  var keuze = {
    reis: bron.reis,
    van: bron.van,
    tot: bron.tot,
    personen: bron.personen,
    begeleiding: bron.begeleiding
  };

  var uitkomst = berekenReis(keuze);
  res.setHeader("Cache-Control", "no-store");
  if (uitkomst.fout) {
    res.status(400).json({ error: uitkomst.fout, fout: uitkomst.fout });
    return;
  }
  res.status(200).json(uitkomst);
};
