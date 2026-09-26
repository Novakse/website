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
var REIS_NAMEN = { lulea: "Lulea", orsa: "Orsa", weissensee: "Weissensee", finland: "Finland" };

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

// Loaded on first use, so a problem in the trip module can never break the
// Falun flow or Joey's payment links.
function berekenReis(keuze) {
  var module;
  try { module = require("./_reis-prijs.js"); } catch (fout) { return { fout: "De prijzen zijn niet beschikbaar." }; }
  return module.berekenReis(keuze);
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
  var metadata; // only for trip payments
  var serverBerekend = false; // true when the amount comes from a price file
  var terugQuery = ""; // query string for the cancel URL
  var reisSleutel = String(body.reis || "").toLowerCase();

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

    var falunOpties = [];
    if (body.vlucht === "zelf") falunOpties.push("eigen vlucht");
    if (body.auto === "zelf") falunOpties.push("eigen vervoer");
    if (alleenGetal(body.begeleiding) > 0) falunOpties.push("begeleiding " + alleenGetal(body.begeleiding) + " dagen");
    metadata = {
      reis: "Falun",
      aankomst: kort(alleenDatum(body.aankomst)),
      dagen: kort(alleenGetal(body.dagen)),
      personen: kort(alleenGetal(body.personen)),
      opties: kort(falunOpties.join(", "), 200),
      per_persoon_eur: kort(falun.perPersoon),
      totaal_eur: kort(falun.bedrag)
    };
    terugQuery = queryString({
      reis: "Falun",
      aankomst: alleenDatum(body.aankomst),
      dagen: alleenGetal(body.dagen),
      personen: alleenGetal(body.personen),
      vlucht: body.vlucht === "zelf" ? "zelf" : "",
      auto: body.auto === "zelf" ? "zelf" : "",
      begeleiding: alleenGetal(body.begeleiding)
    });
  } else if (REIS_NAMEN.hasOwnProperty(reisSleutel) && body.van) {
    // Lulea, Orsa, Weissensee, Finland from a price calendar: the browser
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
      begeleiding: typeof body.begeleiding === "number" ? body.begeleiding : String(body.begeleiding || "")
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
    // The description already starts with "Schaatsreis <trip>".
    productNaam = omschrijving || ("Schaatsreis " + naam);

    metadata = {
      reis: naam,
      van: kort(alleenDatum(body.van)),
      tot: kort(alleenDatum(body.tot)),
      nachten: kort(reisPrijs.nachten),
      personen: kort(reisPrijs.personen),
      opties: reisPrijs.begeleidingDagen > 0 ? kort("begeleiding " + reisPrijs.begeleidingDagen + " dagen") : undefined,
      per_persoon_eur: kort(reisPrijs.perPersoon),
      totaal_eur: kort(reisPrijs.bedrag)
    };
    terugQuery = queryString({
      reis: reisSleutel, // whitelisted key, as used by uitchecken.html
      van: alleenDatum(body.van),
      tot: alleenDatum(body.tot),
      personen: String(reisPrijs.personen),
      begeleiding: reisPrijs.begeleidingDagen > 0 ? String(reisPrijs.begeleidingDagen) : ""
    });
  } else {
    bedrag = parseInt(body.bedrag, 10); // bedrag in centen
    omschrijving = String(body.omschrijving || "Novakse reis").slice(0, 255);
    productNaam = omschrijving;
  }

  var maxBedrag = serverBerekend ? MAX_SERVER_BEDRAG_CENTEN : MAX_BEDRAG_CENTEN;
  if (!bedrag || bedrag < 100 || bedrag > maxBedrag) {
    res.status(400).json({ error: "Ongeldig bedrag." });
    return;
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
    cancel_url: basis + "/uitchecken.html" + (terugQuery ? "?" + terugQuery : "")
  };

  // Trip details visible in the Stripe dashboard, on both the session and
  // the payment. undefined values are skipped by toFormParams().
  if (metadata) {
    sessieData.metadata = metadata;
    sessieData.payment_intent_data = { metadata: metadata };
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
