/* Vercel serverless function — vangt de statusmeldingen van Stripe op.
   Controleert de handtekening zodat alleen echte Stripe-meldingen worden
   geaccepteerd. Er is geen database gekoppeld: zet in het Stripe-dashboard
   onder Instellingen > E-mails de melding "Succesvolle betalingen" aan zodat
   Joey per e-mail op de hoogte blijft van nieuwe betalingen.
   Vereist STRIPE_WEBHOOK_SECRET in de Vercel-projectinstellingen. */
var crypto = require("crypto");

module.exports = async function handler(req, res) {
  var webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  var signatureHeader = req.headers["stripe-signature"];

  if (!webhookSecret || !signatureHeader) {
    res.status(400).send("Ontbrekende handtekening.");
    return;
  }

  var chunks = [];
  for await (var chunk of req) {
    chunks.push(chunk);
  }
  var rawBody = Buffer.concat(chunks);

  var onderdelen = {};
  signatureHeader.split(",").forEach(function (deel) {
    var scheiding = deel.indexOf("=");
    if (scheiding === -1) return;
    onderdelen[deel.slice(0, scheiding)] = deel.slice(scheiding + 1);
  });

  var timestamp = onderdelen.t;
  var verwachteHandtekening = onderdelen.v1;
  if (!timestamp || !verwachteHandtekening) {
    res.status(400).send("Ongeldige handtekening.");
    return;
  }

  var berekendeHandtekening = crypto
    .createHmac("sha256", webhookSecret)
    .update(timestamp + "." + rawBody.toString("utf8"), "utf8")
    .digest("hex");

  var geldig = false;
  try {
    geldig = crypto.timingSafeEqual(
      Buffer.from(berekendeHandtekening, "hex"),
      Buffer.from(verwachteHandtekening, "hex")
    );
  } catch (fout) {
    geldig = false;
  }

  var vijfMinuten = 5 * 60;
  var binnenTijd = Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)) <= vijfMinuten;

  if (!geldig || !binnenTijd) {
    res.status(400).send("Ongeldige handtekening.");
    return;
  }

  res.status(200).send("OK");
};

module.exports.config = { api: { bodyParser: false } };
