/* Vercel serverless function — maakt een Mollie-betaling aan.
   Vereist de environment variable MOLLIE_API_KEY in de Vercel-projectinstellingen. */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Methode niet toegestaan." });
    return;
  }

  var apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Mollie is nog niet ingesteld (MOLLIE_API_KEY ontbreekt)." });
    return;
  }

  var body = req.body || {};
  var bedrag = parseInt(body.bedrag, 10); // bedrag in centen
  var omschrijving = String(body.omschrijving || "Novakse reis").slice(0, 255);
  var methode = body.methode === "creditcard" ? "creditcard" : "ideal";

  if (!bedrag || bedrag < 100) {
    res.status(400).json({ error: "Ongeldig bedrag." });
    return;
  }

  var origin = "https://" + req.headers.host;

  try {
    var mollieRes = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: { currency: "EUR", value: (bedrag / 100).toFixed(2) },
        description: omschrijving,
        method: methode,
        redirectUrl: origin + "/betaling-verwerkt.html",
        webhookUrl: origin + "/api/mollie-webhook"
      })
    });

    var data = await mollieRes.json();
    if (!mollieRes.ok) {
      res.status(502).json({ error: (data && data.detail) || "Mollie gaf een fout terug." });
      return;
    }

    res.status(200).json({ checkoutUrl: data._links.checkout.href });
  } catch (fout) {
    res.status(502).json({ error: "Kon geen verbinding maken met Mollie." });
  }
};
