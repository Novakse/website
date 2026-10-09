/* Vercel serverless function: returns the price of a group trip with fixed
   dates (groepsreis-orsa, groepsreis-falun).

   The page asks for the amount here, so the screen shows exactly what will be
   charged. Nothing is paid or stored; this only calculates. The real payment
   goes through create-payment.js, which uses the same calculation
   (api/_groepsreis.js with js/groepsreis-prijs.js and data/groepsreizen.json).

   GET  /api/groepsreis-prijs?reis=groepsreis-orsa&personen=4
   POST /api/groepsreis-prijs with the same fields as a JSON body.

   200 { ok: true, reis, naam, plaats, van, tot, dagen, personen,
         perPersoonEur, totaalEur, totaalCenten, omschrijving }
   400 { ok: false, error, fout, code }  (unknown trip, invalid, too few, odd,
                                          too many, or the trip has started)
   500 { ok: false, error, fout, code: "data" }  (price file missing) */

var prijsGroepsreis = require("./_groepsreis.js").prijsGroepsreis;

var TOEGESTANE_ORIGINS = ["https://novakse.com", "https://www.novakse.com", "http://localhost:3000"];

function origineOngeldig(req) {
  var origin = req.headers.origin;
  if (!origin) return false; // no Origin header (e.g. same-origin GET, curl): do not block
  return TOEGESTANE_ORIGINS.indexOf(origin) === -1;
}

/* Query parameters of a GET request. Vercel fills req.query; the local
   dev-server.js does not, so fall back to parsing req.url. A repeated key
   gives an array on Vercel; take the first value so both behave the same.
   Same as leesQuery() in api/reis-prijs.js. */
function leesQuery(req) {
  var bron = req.query;
  if (!bron || typeof bron !== "object" || !Object.keys(bron).length) {
    bron = {};
    try {
      new URL(req.url || "", "http://localhost").searchParams.forEach(function (waarde, sleutel) {
        if (!(sleutel in bron)) bron[sleutel] = waarde;
      });
    } catch (fout) { /* no usable query: the calculation reports it */ }
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
  var groep;
  try {
    groep = prijsGroepsreis({ reis: bron.reis, personen: bron.personen });
  } catch (fout) {
    groep = { ok: false, fout: "De prijs kon niet worden berekend.", code: "data", status: 500 };
  }

  res.setHeader("Cache-Control", "no-store");
  if (!groep.ok) {
    res.status(groep.status || 400).json({ ok: false, error: groep.fout, fout: groep.fout, code: groep.code });
    return;
  }

  var reis = groep.reis;
  var uitkomst = groep.uitkomst;
  res.status(200).json({
    ok: true,
    reis: uitkomst.reis,
    naam: reis.naam,
    plaats: reis.plaats,
    van: reis.van,
    tot: reis.tot,
    dagen: reis.dagen,
    personen: uitkomst.personen,
    perPersoonEur: uitkomst.perPersoonEur,
    totaalEur: uitkomst.totaalEur,
    totaalCenten: uitkomst.totaalCenten,
    omschrijving: groep.omschrijving
  });
};
