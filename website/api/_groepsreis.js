/* ==========================================================================
   Group trips (groepsreis-orsa, groepsreis-falun): the server side.

   Loads data/groepsreizen.json and prices a choice with js/groepsreis-prijs.js,
   the same file and the same data the page uses. Used by
   api/groepsreis-prijs.js (shows the price) and api/create-payment.js
   (charges it), so the amount on screen and the amount charged can never
   disagree. Files starting with "_" are not served as an endpoint.

   prijsGroepsreis(keuze)
     keuze = { reis: "groepsreis-orsa" | "groepsreis-falun", personen }
     returns { ok: true, uitkomst, reis, omschrijving }
             (uitkomst = berekenGroepsreis(), reis = the checked trip,
             omschrijving = the Stripe description)
     or      { ok: false, fout: "Dutch message", code, status: 400 | 500 }
   ========================================================================== */
var fs = require("fs");
var path = require("path");
var Groepsreis = require("../js/groepsreis-prijs.js");

/* Read on every call (it is small), so a running server never charges old
   prices while the page already shows new ones. Same as api/_reis-prijs.js. */
function laadGroepsreizen() {
  var kandidaten = [
    path.join(process.cwd(), "website", "data", "groepsreizen.json"),
    path.join(process.cwd(), "data", "groepsreizen.json"),
    path.join(__dirname, "..", "data", "groepsreizen.json")
  ];
  for (var i = 0; i < kandidaten.length; i++) {
    if (fs.existsSync(kandidaten[i])) {
      return JSON.parse(fs.readFileSync(kandidaten[i], "utf8"));
    }
  }
  throw new Error("groepsreizen.json not found");
}

function prijsGroepsreis(keuze) {
  var data;
  try { data = laadGroepsreizen(); } catch (fout) {
    return { ok: false, fout: "De prijzen zijn niet beschikbaar.", code: "data", status: 500 };
  }
  var uitkomst = Groepsreis.berekenGroepsreis({ reis: keuze && keuze.reis, personen: keuze && keuze.personen }, data);
  if (!uitkomst.ok) return { ok: false, fout: uitkomst.reden, code: uitkomst.code, status: 400 };
  var reis = Groepsreis.reis(data, uitkomst.reis);
  return {
    ok: true,
    uitkomst: uitkomst,
    reis: reis,
    omschrijving: Groepsreis.omschrijving(reis, uitkomst)
  };
}

module.exports = { laadGroepsreizen: laadGroepsreizen, prijsGroepsreis: prijsGroepsreis };
