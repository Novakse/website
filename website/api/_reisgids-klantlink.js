/* Travel guide ("reisgids"): the personal customer link after a paid checkout.
   Helper module, not a route (the leading _ keeps Vercel from serving it).
   Used by api/stripe-webhook.js, so a link is made without the owner's laptop.

   It reads the booked trip and its last day from the Stripe metadata that
   api/create-payment.js puts on a checkout session, and signs the same kind
   of link as `node scripts/reisgids.js link`:
     Falun calendar    reis "Falun", aankomst, dagen (last day = aankomst + dagen - 1)
     group trips       reistype "groepsreis", reis "Groepsreis Orsa", tot
     price calendars   reis "Orsa", "Wellness & schaatsen", ... with van and tot
   A payment link from Joey (no dates), the Sälen day trip and a trip without
   any region or journey in the guide get no link.

   The code id comes from the checkout session id, so a webhook that Stripe
   sends again gives the same link (and the same id to revoke it with).

   The customer gets the link by mail right away, in the language of the
   checkout (metadata.taal, else Dutch). Joey gets a copy with the details
   and the code id. */

var crypto = require("crypto");
var rc = require("./_reisgids-crypto.js");

var BASE = "https://www.novakse.com";
var ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
var DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Display name in metadata.reis -> trip id. Same names as REIS_NAMEN in
// api/create-payment.js (calendar trips) plus Falun.
var TRIP_IDS = { "Falun": "falun", "Lulea": "lulea", "Orsa": "orsa", "Weissensee": "weissensee", "Finland": "finland", "Wellness & schaatsen": "wellness" };
var TRIP_NAMES = { "falun": "Falun", "orsa": "Orsa", "wellness": "Wellness & schaatsen", "groepsreis-falun": "Groepsreis Falun", "groepsreis-orsa": "Groepsreis Orsa", "lulea": "Luleå", "finland": "Finland", "weissensee": "Weissensee", "salen": "Sälen" };
var LANGUAGES = { en: "Engels", de: "Duits", sv: "Zweeds", no: "Noors", fi: "Fins" };
var MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
var LOCALES = { nl: "nl-NL", en: "en-GB", de: "de-DE", sv: "sv-SE", no: "nb-NO", fi: "fi-FI" };
var WHATSAPP = "+31 6 17467643";
// The customer's mail per checkout language. {naam}, {van} and {tot} are filled in.
var CUSTOMER_TEXT = {
  nl: {
    subject: "Je persoonlijke reisgids van Novakse",
    hi: "Hoi {naam},",
    intro: "Bedankt voor je boeking. Hier is je persoonlijke reisgids voor je reis van {van} tot en met {tot}.",
    button: "Open je reisgids",
    personal: "Deze link is persoonlijk en werkt tot en met {tot}.",
    questions: "Vragen? Beantwoord deze mail of stuur een WhatsApp naar " + WHATSAPP + ".",
    bye: "Groet,"
  },
  en: {
    subject: "Your personal Novakse travel guide",
    hi: "Hi {naam},",
    intro: "Thank you for your booking. Here is your personal travel guide for your trip from {van} to {tot}.",
    button: "Open your travel guide",
    personal: "This link is personal and works until {tot}.",
    questions: "Questions? Reply to this email or send a WhatsApp message to " + WHATSAPP + ".",
    bye: "Best regards,"
  },
  de: {
    subject: "Dein persönlicher Reiseführer von Novakse",
    hi: "Hallo {naam},",
    intro: "Danke für deine Buchung. Hier ist dein persönlicher Reiseführer für deine Reise vom {van} bis zum {tot}.",
    button: "Reiseführer öffnen",
    personal: "Dieser Link ist persönlich und funktioniert bis einschließlich {tot}.",
    questions: "Fragen? Antworte auf diese E-Mail oder schick eine WhatsApp-Nachricht an " + WHATSAPP + ".",
    bye: "Viele Grüße,"
  },
  sv: {
    subject: "Din personliga reseguide från Novakse",
    hi: "Hej {naam},",
    intro: "Tack för din bokning. Här är din personliga reseguide för din resa från {van} till och med {tot}.",
    button: "Öppna din reseguide",
    personal: "Länken är personlig och fungerar till och med {tot}.",
    questions: "Frågor? Svara på det här mejlet eller skicka ett WhatsApp-meddelande till " + WHATSAPP + ".",
    bye: "Hälsningar,"
  },
  no: {
    subject: "Din personlige reiseguide fra Novakse",
    hi: "Hei {naam},",
    intro: "Takk for bestillingen. Her er din personlige reiseguide for reisen fra {van} til og med {tot}.",
    button: "Åpne reiseguiden",
    personal: "Lenken er personlig og fungerer til og med {tot}.",
    questions: "Spørsmål? Svar på denne e-posten eller send en WhatsApp-melding til " + WHATSAPP + ".",
    bye: "Hilsen,"
  },
  fi: {
    subject: "Henkilökohtainen Novakse-matkaoppaasi",
    hi: "Hei {naam},",
    intro: "Kiitos varauksestasi. Tässä on henkilökohtainen matkaoppaasi. Matkasi: {van} - {tot}.",
    button: "Avaa matkaopas",
    personal: "Linkki on henkilökohtainen ja toimii {tot} asti.",
    questions: "Kysyttävää? Vastaa tähän sähköpostiin tai lähetä WhatsApp-viesti numeroon " + WHATSAPP + ".",
    bye: "Terveisin,"
  }
};

function realDate(value) {
  return typeof value === "string" && DATE_PATTERN.test(value) && rc.isRealDate(value) ? value : "";
}

// "2027-01-10" plus n days, as "YYYY-MM-DD".
function plusDays(date, n) {
  var d = date.split("-");
  return new Date(Date.UTC(+d[0], +d[1] - 1, +d[2] + n)).toISOString().slice(0, 10);
}

// "2027-02-05" -> "5 februari 2027".
function writeDate(date) {
  var d = date.split("-");
  return (+d[2]) + " " + MONTHS[+d[1] - 1] + " " + d[0];
}

/* { reis, van, tot } for a checkout that booked a trip with known dates,
   or null. van is the first day, tot the last day of the trip. */
function tripFromMetadata(m) {
  if (!m || typeof m !== "object") return null;
  var naam = typeof m.reis === "string" ? m.reis.trim() : "";

  if (m.reistype === "groepsreis") {
    var key = naam.toLowerCase().replace(/\s+/g, "-");
    var van = realDate(m.van), tot = realDate(m.tot);
    if (key.indexOf("groepsreis-") !== 0 || rc.TRIPS.indexOf(key) === -1 || !van || !tot) return null;
    return { reis: key, van: van, tot: tot };
  }

  if (naam === "Falun") {
    var aankomst = realDate(m.aankomst);
    var dagen = /^\d{1,3}$/.test(String(m.dagen || "")) ? parseInt(m.dagen, 10) : 0;
    if (!aankomst || dagen < 1) return null;
    return { reis: "falun", van: aankomst, tot: plusDays(aankomst, dagen - 1) };
  }

  if (!Object.prototype.hasOwnProperty.call(TRIP_IDS, naam)) return null;
  var start = realDate(m.van), end = realDate(m.tot);
  if (!start || !end || end < start) return null;
  return { reis: TRIP_IDS[naam], van: start, tot: end };
}

/* The name on the welcome screen: the main booker, else the name Stripe
   collected. "" when neither is usable. */
function customerName(session) {
  var candidates = [
    session.metadata && session.metadata.hoofdboeker,
    session.customer_details && session.customer_details.name
  ];
  for (var i = 0; i < candidates.length; i++) {
    if (typeof candidates[i] !== "string") continue;
    var name = candidates[i].replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, " ")
      .replace(/\s+/g, " ").trim().slice(0, rc.NAME_MAX).trim();
    if (rc.isValidName(name)) return name;
  }
  return "";
}

function customerEmail(session) {
  var candidates = [
    session.metadata && session.metadata.contact_email,
    session.customer_details && session.customer_details.email,
    session.customer_email
  ];
  for (var i = 0; i < candidates.length; i++) {
    if (typeof candidates[i] === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidates[i].trim())) return candidates[i].trim();
  }
  return "";
}

// 8 characters a-z0-9, always the same for one checkout session.
function codeIdFor(sessionId) {
  var bytes = crypto.createHash("sha256").update("novakse-reisgids-checkout-v1:" + sessionId).digest();
  var id = "";
  for (var i = 0; i < 8; i++) id += ID_CHARS.charAt(bytes[i] % ID_CHARS.length);
  return id;
}

/* true when the guide has a region or journey for this trip. */
function guideHasTrip(data, trip) {
  var forTrip = function (item) {
    return item && Array.isArray(item.reizen) && item.reizen.indexOf(trip) !== -1;
  };
  return (Array.isArray(data.regios) && data.regios.some(forTrip)) ||
    (Array.isArray(data.reisverlopen) && data.reisverlopen.some(forTrip));
}

/* The decrypted guide data, or null when the secret or data is missing or
   unreadable. */
function loadGuide(secret) {
  try {
    rc.keysFromSecret(secret);
    var data = rc.decryptJson(require("./_reisgids-data.js"), secret);
    return data && Array.isArray(data.regios) ? data : null;
  } catch (fout) {
    return null;
  }
}

/* Everything for the mail to Joey about one paid checkout session, or
   { skip: "<reason>" } when this booking gets no link. `data` is the
   decrypted guide, `today` "YYYY-MM-DD" in Sweden. */
function linkForSession(session, secret, data, today) {
  if (!session || typeof session !== "object") return { skip: "geen sessie" };
  if (session.payment_status !== "paid") return { skip: "niet betaald" };
  if (typeof session.id !== "string" || !session.id) return { skip: "geen sessie-id" };

  var trip = tripFromMetadata(session.metadata);
  if (!trip) return { skip: "geen reis met datums" };
  if (!guideHasTrip(data, trip.reis)) return { skip: "geen reisgids voor " + trip.reis };
  if (trip.tot < today) return { skip: "reis is al voorbij" };

  var naam = customerName(session);
  if (!naam) return { skip: "geen naam" };

  var id = codeIdFor(session.id);
  var code = rc.signCode({ v: 1, id: id, n: naam, r: [trip.reis], t: trip.tot }, secret);
  var lang = session.metadata && LANGUAGES[session.metadata.taal] ? session.metadata.taal : "nl";
  return {
    id: id,
    naam: naam,
    email: customerEmail(session),
    reis: trip.reis,
    reisNaam: TRIP_NAMES[trip.reis] || trip.reis,
    van: trip.van,
    tot: trip.tot,
    lang: lang,
    link: BASE + "/reisgids/?code=" + encodeURIComponent(code)
  };
}

// "2027-02-05" in the customer's language, e.g. "5. Februar 2027".
function writeDateIn(date, lang) {
  var d = date.split("-");
  return new Intl.DateTimeFormat(LOCALES[lang] || LOCALES.nl, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(+d[0], +d[1] - 1, +d[2])));
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
  });
}

var BUTTON_STYLE = "display:inline-block;padding:12px 22px;border-radius:999px;background:#7a4620;color:#ffffff;text-decoration:none;font-weight:bold";
var BODY_STYLE = "font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1f2a2e";

function fill(text, values) {
  return text.replace(/\{(naam|van|tot)\}/g, function (all, key) { return values[key]; });
}

/* { subject, text, html } for the customer, in the checkout language. */
function mailForCustomer(info) {
  var t = CUSTOMER_TEXT[info.lang] || CUSTOMER_TEXT.nl;
  var values = { naam: info.naam.split(" ")[0], van: writeDateIn(info.van, info.lang), tot: writeDateIn(info.tot, info.lang) };
  var hi = fill(t.hi, values), intro = fill(t.intro, values), personal = fill(t.personal, values);
  var text = [hi, "", intro, "", info.link, "", personal, t.questions, "", t.bye, "Joey", "Novakse"].join("\n");
  var html = "<div style=\"" + BODY_STYLE + "\">" +
    "<p>" + escapeHtml(hi) + "</p>" +
    "<p>" + escapeHtml(intro) + "</p>" +
    "<p style=\"margin:24px 0\"><a href=\"" + escapeHtml(info.link) + "\" style=\"" + BUTTON_STYLE + "\">" + escapeHtml(t.button) + "</a></p>" +
    "<p>" + escapeHtml(personal) + "<br>" + escapeHtml(t.questions) + "</p>" +
    "<p>" + escapeHtml(t.bye) + "<br>Joey<br>Novakse</p>" +
    "</div>";
  return { subject: t.subject, text: text, html: html };
}

/* { subject, text, html } for Joey's copy. `test` marks a Stripe test
   payment, `sent` whether the customer got the link by mail. */
function mailForJoey(info, test, sent) {
  var subject = (test ? "[TEST] " : "") + (sent ? "Reisgids verstuurd naar " : "Reisgids-link (niet verstuurd) voor ") +
    info.naam + " (" + info.reisNaam + ", " + writeDate(info.van) + ")";
  var lines = [
    sent
      ? "De persoonlijke reisgids is automatisch naar de klant gemaild."
      : "Er is geen e-mailadres van de klant: stuur de link zelf door.",
    "",
    "Klant: " + info.naam,
    "E-mail: " + (info.email || "onbekend"),
    "Reis: " + info.reisNaam + ", " + writeDate(info.van) + " t/m " + writeDate(info.tot),
    "Link werkt tot en met: " + writeDate(info.tot)
  ];
  if (info.lang !== "nl") lines.push("Taal van de klant: " + LANGUAGES[info.lang] + " (de mail was in het " + LANGUAGES[info.lang] + ", de reisgids zelf is in het Nederlands)");
  lines.push(
    "",
    "Persoonlijke link van de klant:",
    info.link,
    "",
    "Code-id: " + info.id,
    "Intrekken: zet \"" + info.id + "\" in \"ingetrokken\" in reisgids.json, draai bouw en push."
  );
  if (test) lines.unshift("Dit was een testbetaling in Stripe.", "");

  var html = "<div style=\"" + BODY_STYLE + "\">" +
    lines.map(function (line) {
      if (line === info.link) return "<a href=\"" + escapeHtml(info.link) + "\">Reisgids openen</a>";
      return line ? escapeHtml(line) : "";
    }).join("<br>") +
    "</div>";
  return { subject: subject, text: lines.join("\n"), html: html };
}

module.exports = {
  tripFromMetadata: tripFromMetadata,
  codeIdFor: codeIdFor,
  loadGuide: loadGuide,
  linkForSession: linkForSession,
  mailForCustomer: mailForCustomer,
  mailForJoey: mailForJoey
};
