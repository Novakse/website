/* Bank transfer as a payment choice (no Stripe involved).

   Used by api/create-payment.js when the checkout sends
   betaalmethode: "overschrijving". The amount is calculated by the server
   exactly like for a Stripe payment; this file only makes the reference,
   formats the amount and mails Joey and the customer.

   Joey checks his bank for the payment and then sends the customer the
   confirmation himself, so nothing is marked as paid here.

   The account details are the ones shown on contact.html. Keep them in sync.
   The account is held in the name of Novakse (confirmed by Joey 2026-11-07). */

var crypto = require("crypto");

var BANK = { naam: "Novakse", iban: "NL12 BUNQ 2140 1368 45", bic: "BUNQNL2A" };

var NAAR_JOEY = "schaatsennovakse@outlook.com";
var VAN = process.env.RESEND_FROM_EMAIL || "Novakse website <aanvraag@novakse.com>";

// No 0/O/1/I: the customer types this reference into the bank app.
var REFERENTIE_TEKENS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function maakReferentie() {
  var bytes = crypto.randomBytes(6);
  var tekst = "";
  for (var i = 0; i < bytes.length; i++) tekst += REFERENTIE_TEKENS[bytes[i] % REFERENTIE_TEKENS.length];
  return "NVK-" + tekst;
}

var LOCALES = { "": "nl-NL", nl: "nl-NL", en: "en-GB", de: "de-DE", sv: "sv-SE", no: "nb-NO", fi: "fi-FI" };

function bedragTekst(centen, taal) {
  try {
    return new Intl.NumberFormat(LOCALES[taal] || "nl-NL", { style: "currency", currency: "EUR" }).format(centen / 100);
  } catch (fout) {
    return "EUR " + (centen / 100).toFixed(2).replace(".", ",");
  }
}

/* Customer mail texts. {bedrag}, {iban}, {bic}, {referentie}, {reis} are filled in. */
var TEKSTEN = {
  nl: {
    onderwerp: "Je boeking bij Novakse: maak het bedrag over",
    tekst: "Bedankt voor je boeking bij Novakse.\n\n" +
      "Reis: {reis}\n\n" +
      "Maak het totaalbedrag over naar:\n" +
      "Bedrag: {bedrag}\n" +
      "Ten name van: {naam}\n" +
      "IBAN: {iban}\n" +
      "BIC: {bic}\n" +
      "Betalingskenmerk: {referentie}\n\n" +
      "Vermeld het betalingskenmerk bij je overschrijving. Zodra je betaling is binnengekomen, sturen we je een bevestiging.\n\n" +
      "Vragen? Antwoord op deze mail.\n\nNovakse"
  },
  en: {
    onderwerp: "Your Novakse booking: please transfer the amount",
    tekst: "Thank you for your booking with Novakse.\n\n" +
      "Trip: {reis}\n\n" +
      "Please transfer the total amount to:\n" +
      "Amount: {bedrag}\n" +
      "Account holder: {naam}\n" +
      "IBAN: {iban}\n" +
      "BIC: {bic}\n" +
      "Payment reference: {referentie}\n\n" +
      "Please include the payment reference with your transfer. As soon as your payment has arrived, we will send you a confirmation.\n\n" +
      "Questions? Reply to this email.\n\nNovakse"
  },
  de: {
    onderwerp: "Deine Buchung bei Novakse: bitte überweise den Betrag",
    tekst: "Danke für deine Buchung bei Novakse.\n\n" +
      "Reise: {reis}\n\n" +
      "Bitte überweise den Gesamtbetrag an:\n" +
      "Betrag: {bedrag}\n" +
      "Kontoinhaber: {naam}\n" +
      "IBAN: {iban}\n" +
      "BIC: {bic}\n" +
      "Verwendungszweck: {referentie}\n\n" +
      "Gib bei der Überweisung bitte den Verwendungszweck an. Sobald deine Zahlung eingegangen ist, senden wir dir eine Bestätigung.\n\n" +
      "Fragen? Antworte einfach auf diese E-Mail.\n\nNovakse"
  },
  sv: {
    onderwerp: "Din bokning hos Novakse: betala beloppet via banköverföring",
    tekst: "Tack för din bokning hos Novakse.\n\n" +
      "Resa: {reis}\n\n" +
      "Överför det totala beloppet till:\n" +
      "Belopp: {bedrag}\n" +
      "Kontoinnehavare: {naam}\n" +
      "IBAN: {iban}\n" +
      "BIC: {bic}\n" +
      "Betalningsreferens: {referentie}\n\n" +
      "Ange betalningsreferensen vid din överföring. Så snart din betalning har kommit in skickar vi en bekräftelse.\n\n" +
      "Frågor? Svara på det här mejlet.\n\nNovakse"
  },
  no: {
    onderwerp: "Bookingen din hos Novakse: betal beløpet med bankoverføring",
    tekst: "Takk for bookingen hos Novakse.\n\n" +
      "Tur: {reis}\n\n" +
      "Overfør hele beløpet til:\n" +
      "Beløp: {bedrag}\n" +
      "Kontoinnehaver: {naam}\n" +
      "IBAN: {iban}\n" +
      "BIC: {bic}\n" +
      "Betalingsreferanse: {referentie}\n\n" +
      "Oppgi betalingsreferansen ved overføringen. Så snart betalingen er kommet inn, sender vi deg en bekreftelse.\n\n" +
      "Spørsmål? Svar på denne e-posten.\n\nNovakse"
  },
  fi: {
    onderwerp: "Novakse-varauksesi: maksa summa tilisiirrolla",
    tekst: "Kiitos varauksestasi Novaksella.\n\n" +
      "Matka: {reis}\n\n" +
      "Siirrä koko summa tilille:\n" +
      "Summa: {bedrag}\n" +
      "Tilinhaltija: {naam}\n" +
      "IBAN: {iban}\n" +
      "BIC: {bic}\n" +
      "Viite: {referentie}\n\n" +
      "Kirjoita viite tilisiirtoon. Kun maksusi on saapunut, lähetämme sinulle vahvistuksen.\n\n" +
      "Kysyttävää? Vastaa tähän viestiin.\n\nNovakse"
  }
};

async function stuurMail(resendKey, mail) {
  try {
    var respons = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + resendKey, "Content-Type": "application/json" },
      body: JSON.stringify(mail),
      signal: AbortSignal.timeout(6000)
    });
    if (!respons.ok) console.error("Overschrijvingsmail mislukt: " + respons.status);
    return respons.ok;
  } catch (fout) {
    console.error("Overschrijvingsmail mislukt: " + fout.message);
    return false;
  }
}

/* Mails Joey (details, he needs these) and the customer (account details).
   Returns { joey, klant, klantOvergeslagen }: the booking only counts when
   joey is true. With klantMailen: false (a payment link with a free amount)
   only Joey is mailed and klantOvergeslagen is true.
   Awaited by the caller: a serverless function may be frozen after the
   response. */
async function stuurOverschrijvingMails(opties) {
  var resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("Overschrijvingsmail mislukt: RESEND_API_KEY ontbreekt");
    return { joey: false, klant: false };
  }
  var taal = opties.taal || "";
  var bedrag = bedragTekst(opties.bedragCenten, taal);
  var klantMailen = opties.klantMailen !== false;

  var regels = [
    "Een klant heeft gekozen voor bankoverschrijving. De betaling is nog NIET binnen.",
    "Controleer je bank op dit betalingskenmerk en stuur daarna de bevestiging aan de klant.",
    ""
  ];
  if (!klantMailen) {
    regels.push(
      "LET OP: dit komt van een betaallink met een vrij bedrag. Reis en bedrag komen uit de link, niet uit een prijsbestand. Controleer of ze kloppen met wat je de klant hebt gestuurd.",
      "De klant heeft hiervan geen mail gekregen. Het rekeningnummer en het betalingskenmerk stonden alleen op zijn scherm.",
      ""
    );
  }
  regels.push(
    "Betalingskenmerk: " + opties.referentie,
    "Reis: " + opties.productNaam,
    "Bedrag: " + bedragTekst(opties.bedragCenten, ""),
    "E-mail klant: " + opties.email,
    ""
  );
  Object.keys(opties.metadata || {}).forEach(function (sleutel) {
    regels.push(sleutel + ": " + opties.metadata[sleutel]);
  });

  var joey = await stuurMail(resendKey, {
    from: VAN,
    to: [NAAR_JOEY],
    reply_to: opties.email,
    subject: "Bankoverschrijving, wacht op betaling: " + String(opties.productNaam).slice(0, 100) + " (" + opties.referentie + ")",
    text: regels.join("\n")
  });

  // The customer only gets the account details when Joey has the booking:
  // otherwise the page shows an error and the customer would hold a
  // reference nobody knows about.
  if (!joey) return { joey: false, klant: false };

  // Free amount: no customer mail, see api/create-payment.js.
  if (!klantMailen) return { joey: true, klant: false, klantOvergeslagen: true };

  var t = TEKSTEN[taal] || TEKSTEN.nl;
  var vul = { bedrag: bedrag, naam: BANK.naam, iban: BANK.iban, bic: BANK.bic, referentie: opties.referentie, reis: opties.productNaam };
  var klantTekst = t.tekst.replace(/\{(\w+)\}/g, function (hele, sleutel) {
    return Object.prototype.hasOwnProperty.call(vul, sleutel) ? vul[sleutel] : hele;
  });
  var klant = await stuurMail(resendKey, {
    from: VAN,
    to: [opties.email],
    reply_to: NAAR_JOEY,
    subject: t.onderwerp,
    text: klantTekst
  });

  return { joey: joey, klant: klant };
}

module.exports = { BANK: BANK, NAAR_JOEY: NAAR_JOEY, maakReferentie: maakReferentie, stuurOverschrijvingMails: stuurOverschrijvingMails };
