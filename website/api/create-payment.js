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
  var bedrag = parseInt(body.bedrag, 10); // bedrag in centen
  var omschrijving = String(body.omschrijving || "Novakse reis").slice(0, 255);

  if (!bedrag || bedrag < 100 || bedrag > MAX_BEDRAG_CENTEN) {
    res.status(400).json({ error: "Ongeldig bedrag." });
    return;
  }

  var origin = "https://" + req.headers.host;

  var sessieData = {
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: bedrag,
          product_data: { name: omschrijving }
        }
      }
    ],
    success_url: origin + "/betaling-verwerkt.html",
    cancel_url: origin + "/uitchecken.html"
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
    if (!stripeRes.ok) {
      res.status(502).json({ error: (data.error && data.error.message) || "Stripe gaf een fout terug." });
      return;
    }

    res.status(200).json({ checkoutUrl: data.url });
  } catch (fout) {
    res.status(502).json({ error: "Kon geen verbinding maken met Stripe." });
  }
};
