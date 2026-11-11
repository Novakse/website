/* Vercel serverless function: receives Stripe's event notifications.
   Checks the signature, so only real Stripe events are accepted. There is no
   database: in the Stripe dashboard, Settings > Emails, "Successful payments"
   keeps Joey informed of new payments by e-mail.

   On a paid checkout for a trip with a travel guide (see
   api/_reisgids-klantlink.js) the customer gets a mail via Resend with the
   personal guide link, and Joey a copy with the details. "Paid" is either
   "checkout.session.completed" with payment_status "paid", or, for a payment
   method that confirms later, "checkout.session.async_payment_succeeded".
   Without REISGIDS_GEHEIM, the guide data or RESEND_API_KEY nothing is mailed
   (logged only). When Resend fails for a reason that can pass (no answer,
   5xx, rate limit, API key) the answer is 500, so Stripe sends the event
   again; the Idempotency-Keys keep Resend from mailing twice within 24 hours.
   A rejected mail (other 4xx) or a broken mail text is only logged: sending
   it again would fail the same way, and Stripe would keep retrying for days.

   Requires STRIPE_WEBHOOK_SECRET in the Vercel project settings, and the
   events "checkout.session.completed" and
   "checkout.session.async_payment_succeeded" on the webhook in the Stripe
   dashboard. */
var crypto = require("crypto");

var NAAR = "schaatsennovakse@outlook.com";
var VAN = process.env.RESEND_FROM_EMAIL || "Novakse website <aanvraag@novakse.com>";

// Stripe events that mean a checkout session has been paid.
var BETAALD_EVENTS = {
  "checkout.session.completed": true,
  "checkout.session.async_payment_succeeded": true
};

/* Resend answers worth trying again later: a wrong or missing API key (Joey
   can fix it while Stripe keeps retrying), timeout, rate limit, server error.
   Any other 4xx means Resend rejects this mail itself. */
function opnieuwProberen(status) {
  return status === 401 || status === 403 || status === 408 || status === 429 || status >= 500;
}

/* Sends one mail via Resend. true when it went out now or before (409: this
   Idempotency-Key was already used), and also when Resend rejects the mail
   for good, because a retry cannot change that. false only for a failure
   that can pass, so Stripe sends the event again. */
async function sendMail(apiKey, mail, idempotencyKey) {
  try {
    var resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(mail)
    });
    if (!resendRes.ok && resendRes.status !== 409) {
      var tijdelijk = opnieuwProberen(resendRes.status);
      console.error("stripe-webhook: Resend answered " + resendRes.status + " for " + idempotencyKey.split("/")[0] +
        (tijdelijk ? ", Stripe will retry" : ", not retried"));
      return !tijdelijk;
    }
    return true;
  } catch (fout) {
    console.error("stripe-webhook: could not reach Resend for " + idempotencyKey.split("/")[0]);
    return false;
  }
}

/* Mails the travel guide link of a paid checkout to the customer, and a copy
   to Joey. Returns false only when a mail could not be sent, so Stripe
   should try again. */
async function mailGuideLink(event) {
  var info, reisgidsLink;
  try {
    // Loaded here, so a missing guide module never breaks the webhook itself.
    var rc = require("./_reisgids-crypto.js");
    reisgidsLink = require("./_reisgids-klantlink.js");
    var secret = String(process.env.REISGIDS_GEHEIM || "").trim();
    var data = reisgidsLink.loadGuide(secret);
    if (!data) {
      console.error("stripe-webhook: reisgids not configured (REISGIDS_GEHEIM or api/_reisgids-data.js), no link made");
      return true;
    }
    info = reisgidsLink.linkForSession(event.data && event.data.object, secret, data, rc.todayInStockholm());
  } catch (fout) {
    console.error("stripe-webhook: reisgids link failed");
    return true;
  }
  if (info.skip) return true;

  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("stripe-webhook: RESEND_API_KEY missing, reisgids link not mailed");
    return true;
  }

  var sessionId = event.data.object.id;
  var toCustomer, toJoey;
  try {
    toCustomer = info.email ? reisgidsLink.mailForCustomer(info) : null;
    toJoey = reisgidsLink.mailForJoey(info, event.livemode === false, !!toCustomer);
  } catch (fout) {
    // A broken mail text stays broken on every retry, so only log it.
    console.error("stripe-webhook: reisgids mail text failed for " + sessionId);
    return true;
  }
  if (toCustomer) {
    var sent = await sendMail(apiKey, {
      from: VAN,
      to: [info.email],
      reply_to: NAAR,
      subject: toCustomer.subject,
      text: toCustomer.text,
      html: toCustomer.html
    }, "reisgids-klant/" + sessionId);
    if (!sent) return false;
  }

  return sendMail(apiKey, {
    from: VAN,
    to: [NAAR],
    reply_to: info.email || undefined,
    subject: toJoey.subject,
    text: toJoey.text,
    html: toJoey.html
  }, "reisgids-joey/" + sessionId);
}

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

  var event = null;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch (fout) {
    event = null;
  }
  if (event && BETAALD_EVENTS[event.type] === true && event.data && event.data.object) {
    if (!(await mailGuideLink(event))) {
      res.status(500).send("Mail niet verstuurd.");
      return;
    }
  }

  res.status(200).send("OK");
};

module.exports.config = { api: { bodyParser: false } };
