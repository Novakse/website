/* Vercel serverless function - creates a Stripe Checkout session for the
   "Schaatsdagtocht vanuit Sälen".

   The browser only sends the choices (date, package, group, transfer,
   rentals) and contact details, never an amount. The price is recomputed here
   with js/salen-prijs.js, the same file the page uses, and the prices come
   from data/salen-prijzen.json, the same file the page reads. So what is on
   screen is exactly what is charged.

   Requires the environment variable STRIPE_API_KEY (same as create-payment.js).

   POST body (JSON):
     { name, email, phone, date: "YYYY-MM-DD", package: "half"|"full",
       adults, children, toddlers, transfer: boolean, rentals, shoeSizes }
   Response: 200 { url } or 4xx/5xx { error } (Dutch message). */

var fs = require("fs");
var path = require("path");
var SalenPrice = require("../js/salen-prijs.js");

var TOEGESTANE_ORIGINS = ["https://novakse.com", "https://www.novakse.com", "http://localhost:3000"];
var MAX_BEDRAG_CENTEN = 2000000; // €20.000 - far above a real booking, guards against misuse (e.g. card testing)
var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var CONTACT_MAIL = "schaatsennovakse@outlook.com"; // same address as on schaatsen-salen.html
var PRODUCTIE_BASIS = "https://www.novakse.com";
var MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december"];
var DAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

/* Read on every request, like _falun-prijs.js, so a running server never
   charges old prices while the page already shows new ones. */
function salenPrijzen() {
  var kandidaten = [
    path.join(process.cwd(), "website", "data", "salen-prijzen.json"),
    path.join(process.cwd(), "data", "salen-prijzen.json"),
    path.join(__dirname, "..", "data", "salen-prijzen.json")
  ];
  for (var i = 0; i < kandidaten.length; i++) {
    if (fs.existsSync(kandidaten[i])) {
      return JSON.parse(fs.readFileSync(kandidaten[i], "utf8"));
    }
  }
  throw new Error("salen-prijzen.json not found");
}

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

function origineOngeldig(req) {
  var origin = req.headers.origin;
  if (!origin) return false; // no Origin header (e.g. curl/old browser): do not block
  return TOEGESTANE_ORIGINS.indexOf(origin) === -1;
}

function tekst(waarde, max) {
  return typeof waarde === "string" ? waarde.trim().slice(0, max) : "";
}

// Shoe sizes may arrive as free text or as a list; store them as one line.
function schoenmaten(waarde) {
  if (Array.isArray(waarde)) {
    waarde = waarde
      .map(function (maat) { return String(maat == null ? "" : maat).trim(); })
      .filter(Boolean)
      .join(", ");
  }
  return typeof waarde === "number" ? String(waarde) : tekst(waarde, 450);
}

function euro(bedrag) {
  return "€ " + bedrag.toLocaleString("nl-NL");
}

function schrijfDatum(iso) {
  var p = iso.split("-");
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  return DAGEN[d.getUTCDay()] + " " + d.getUTCDate() + " " + MAANDEN[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

function meervoud(aantal, enkel, meer) {
  return aantal + " " + (aantal === 1 ? enkel : meer);
}

function regel(naam, bedragEuro, omschrijving) {
  var item = {
    quantity: 1,
    price_data: {
      currency: "eur",
      unit_amount: bedragEuro * 100,
      product_data: { name: naam.slice(0, 250) }
    }
  };
  if (omschrijving) item.price_data.product_data.description = omschrijving.slice(0, 500);
  return item;
}

// Base URL for the return pages. Always the fixed production domain, so a
// spoofed Host header can never send a paying visitor elsewhere. Only a local
// development host (localhost / 127.0.0.1) keeps its own base, over http.
function basisUrl(req) {
  var host = String(req.headers.host || "");
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return "http://" + host;
  return PRODUCTIE_BASIS;
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

  var body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({ error: "Ongeldige aanvraag." });
    return;
  }

  var naam = tekst(body.name, 120);
  var email = tekst(body.email, 200);
  var telefoon = tekst(body.phone, 40);
  if (!naam) { res.status(400).json({ error: "Vul je naam in." }); return; }
  if (!email) { res.status(400).json({ error: "Vul je e-mailadres in." }); return; }
  if (!EMAIL_PATTERN.test(email)) { res.status(400).json({ error: "Vul een geldig e-mailadres in." }); return; }
  if (!telefoon) { res.status(400).json({ error: "Vul je telefoonnummer in." }); return; }

  var prijzen;
  try {
    prijzen = salenPrijzen();
  } catch (fout) {
    res.status(500).json({ error: "De prijzen zijn niet beschikbaar." });
    return;
  }

  var keuze = {
    date: body.date,
    package: body.package,
    adults: body.adults,
    children: body.children,
    toddlers: body.toddlers,
    transfer: body.transfer,
    rentals: body.rentals
  };
  var ongeldig = SalenPrice.validate(keuze, prijzen);
  if (ongeldig) {
    res.status(400).json({ error: ongeldig });
    return;
  }

  // validate() has confirmed these are whole numbers within range.
  var volwassenen = parseInt(keuze.adults, 10);
  var kinderen = parseInt(keuze.children, 10);
  var peuters = parseInt(keuze.toddlers, 10);
  var huur = parseInt(keuze.rentals, 10);

  var maten = schoenmaten(body.shoeSizes);
  if (huur > 0 && !maten) {
    res.status(400).json({ error: "Vul de schoenmaten in voor de huurschaatsen." });
    return;
  }

  // Any amount the browser might send is ignored: only this counts.
  var prijs = SalenPrice.calc({
    package: keuze.package,
    adults: volwassenen,
    children: kinderen,
    toddlers: peuters,
    transfer: keuze.transfer,
    rentals: huur
  }, prijzen);

  if (!prijs || !(prijs.total > 0) || prijs.total * 100 > MAX_BEDRAG_CENTEN) {
    res.status(400).json({ error: "Ongeldig bedrag." });
    return;
  }

  var apiKey = process.env.STRIPE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Stripe is nog niet ingesteld (STRIPE_API_KEY ontbreekt)." });
    return;
  }

  var pakket = prijzen.packages[keuze.package].label || (keuze.package === "full" ? "Hele dag" : "Halve dag");
  var datumTekst = schrijfDatum(keuze.date);
  var groep = [meervoud(volwassenen, "volwassene", "volwassenen")];
  if (kinderen) groep.push(meervoud(kinderen, "kind", "kinderen") + " (4 t/m 12 jaar)");
  if (peuters) groep.push(meervoud(peuters, "kind", "kinderen") + " van 0 t/m 3 jaar (gratis)");
  var samenvatting = "Schaatsdagtocht vanuit Sälen, " + pakket.toLowerCase() + ", " + datumTekst +
    ", " + groep.join(", ") + (keuze.transfer ? ", met vervoer" : ", zonder vervoer") +
    (huur ? ", " + huur + " paar huurschaatsen" : "");

  var regels = [
    regel(
      pakket + " - " + meervoud(volwassenen, "volwassene", "volwassenen") + " × " + euro(prijs.adultRate),
      prijs.adultsTotal,
      "Schaatsdagtocht vanuit Sälen, " + datumTekst + ". Groep: " + groep.join(", ") + "."
    )
  ];
  if (kinderen && prijs.childrenTotal > 0) {
    regels.push(regel(
      "Kinderen 4 t/m 12 jaar - " + meervoud(kinderen, "kind", "kinderen") + " × " + euro(prijs.childRate),
      prijs.childrenTotal
    ));
  }
  if (prijs.transferTotal > 0) {
    regels.push(regel(
      "Vervoer - " + meervoud(volwassenen, "volwassene", "volwassenen") + " × " + euro(prijs.transferTotal / volwassenen),
      prijs.transferTotal
    ));
  }
  if (prijs.rentalTotal > 0) {
    regels.push(regel(
      "Schaatsverhuur - " + huur + " paar × " + euro(prijs.rentalTotal / huur),
      prijs.rentalTotal,
      "Schoenmaten: " + maten
    ));
  }

  // Everything Joey needs to prepare the day, visible in the Stripe dashboard
  // on both the checkout session and the payment. Stripe metadata values are
  // strings of at most 500 characters.
  var metadata = {
    product: "salen-dagtocht",
    datum: keuze.date,
    pakket: pakket,
    volwassenen: String(volwassenen),
    kinderen_4_12: String(kinderen),
    kinderen_0_3: String(peuters),
    vervoer: keuze.transfer ? "ja" : "nee",
    huurschaatsen: String(huur),
    schoenmaten: huur ? maten.slice(0, 500) : undefined, // left out when nothing is rented
    naam: naam,
    email: email,
    telefoon: telefoon,
    totaal_eur: String(prijs.total)
  };

  var basis = basisUrl(req);
  var sessieData = {
    mode: "payment",
    locale: "nl",
    customer_email: email,
    line_items: regels,
    metadata: metadata,
    payment_intent_data: {
      description: samenvatting.slice(0, 1000),
      metadata: metadata
    },
    success_url: basis + "/schaatsen-salen.html?betaling=gelukt&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: basis + "/schaatsen-salen.html?betaling=geannuleerd"
  };

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
    if (!stripeRes.ok || !data.url) {
      // Stripe's own error text is for us, not for the visitor.
      console.error("salen-checkout: Stripe error", stripeRes.status, data && data.error ? data.error : data);
      res.status(502).json({
        error: "Het afrekenen kon nu niet worden gestart. Probeer het later opnieuw of neem contact op via " + CONTACT_MAIL + "."
      });
      return;
    }

    res.status(200).json({ url: data.url });
  } catch (fout) {
    console.error("salen-checkout: Stripe request failed", fout);
    res.status(502).json({ error: "Kon geen verbinding maken met Stripe." });
  }
};
