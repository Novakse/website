/* Vercel serverless function — verstuurt het reisaanvraagformulier van de
   homepage rechtstreeks als e-mail naar Joey, via Resend.
   Vereist de environment variable RESEND_API_KEY in de Vercel-projectinstellingen.
   Het verzendadres (FROM_EMAIL) moet op een in Resend geverifieerd domein staan
   (novakse.com) — anders weigert Resend de e-mail. */

var NAAR = "schaatsennovakse@outlook.com";
var VAN = process.env.RESEND_FROM_EMAIL || "Novakse website <aanvraag@novakse.com>";
var EMAIL_PATROON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Methode niet toegestaan." });
    return;
  }

  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "E-mail versturen is nog niet ingesteld (RESEND_API_KEY ontbreekt)." });
    return;
  }

  var body = req.body || {};
  var onderwerp = String(body.onderwerp || "Reisaanvraag").slice(0, 200);
  var bericht = String(body.bericht || "").slice(0, 5000).trim();
  var email = String(body.email || "").trim();

  if (!bericht || !EMAIL_PATROON.test(email)) {
    res.status(400).json({ error: "Vul een geldig e-mailadres en bericht in." });
    return;
  }

  try {
    var resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: VAN,
        to: [NAAR],
        reply_to: email,
        subject: onderwerp,
        text: bericht
      })
    });

    if (!resendRes.ok) {
      var foutData = await resendRes.json().catch(function () { return {}; });
      res.status(502).json({ error: (foutData.message) || "Resend gaf een fout terug." });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (fout) {
    res.status(502).json({ error: "Kon geen verbinding maken met de e-mailservice." });
  }
};
