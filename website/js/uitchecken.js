/* ==========================================================================
   Betaalpagina

   Er zijn twee manieren waarop je hier terechtkomt.

   1. Via een betaallink die Joey stuurt, bijvoorbeeld
      uitchecken.html?reis=Finland&bedrag=59700. Het bedrag staat in hele
      centen en komt uit de link.

   2. Via de kalender op de Falun-pagina, bijvoorbeeld
      uitchecken.html?reis=Falun&aankomst=2027-01-10&dagen=4&vlucht=zelf.
      Dan staat er geen bedrag in de link: dat wordt opgehaald bij
      /api/falun-prijs. De server rekent het uit, niet de browser, zodat er
      niet met het bedrag te knoeien valt.

   3. Via de kalender op de pagina van Luleå, Orsa, de Weissensee, Finland of
      Wellness & schaatsen, bijvoorbeeld
      uitchecken.html?reis=lulea&van=2027-01-10&tot=2027-01-14&personen=2
      (met &vlucht=zelf als de bezoeker zijn vlucht zelf regelt, en bij
      Finland &materiaal=ja voor gehuurd schaatsmateriaal).
      Ook hier staat geen bedrag in de link: dat komt van /api/reis-prijs, en
      /api/create-payment rekent het bij het betalen opnieuw uit.

   4. Via the booking widget of a group trip with fixed dates (js/groepsreis.js),
      for example uitchecken.html?reis=groepsreis-orsa&personen=4. The price
      comes from /api/groepsreis-prijs (js/groepsreis-prijs.js with
      data/groepsreizen.json) and /api/create-payment calculates it again.
      Adults only (12 and older on the arrival day), no rental car choice.

   Before paying, every trip goes through the "Reisgegevens" step
   (js/reisgegevens.js): travellers for the flight, contact details and
   address, who the main booker is, the main driver of the rental car and
   the required confirmations. Once that form is valid, the same click sends
   the details straight to /api/create-payment,
   which checks them again, and on to Stripe (the methods offered there are
   set in the Stripe Dashboard), or, when the customer chose bank transfer,
   mails Joey and the customer.

   Falun, Wellness & schaatsen and the group trips also get the optional block
   "Activiteiten bijboeken" (see startActiviteiten below); those activities
   are paid in the same checkout.

   Bij het doorgaan wordt er een Stripe Checkout-sessie aangemaakt via
   /api/create-payment en stuurt de browser door naar de betaalomgeving.

   The same page exists in the language folders (en/, de/, sv/, no/, fi/
   uitchecken.html). There the texts come from I18N below, links stay in
   that folder, and the payment request carries taal, so Stripe sends the
   visitor back to the page in the same language.
   ========================================================================== */
(function () {
  "use strict";

  var MAIL = "schaatsennovakse@outlook.com";

  /* ---- Language ------------------------------------------------------
     The checkout also lives in the language folders (en/uitchecken.html,
     de/, sv/, no/, fi/). Every text this script puts on screen comes from
     I18N, chosen by <html lang>; a text that is not translated falls back
     to the Dutch one, and Dutch (the root) is exactly as before. Messages
     from the server are Dutch: on the other pages they are replaced by a
     translated message (see VERTAALD). Amounts and dates follow the page
     language, as in main.js. */
  var LANG = (document.documentElement.lang || "nl").slice(0, 2).toLowerCase();
  // Only these folders have their own checkout; anything else is Dutch.
  var TALEN = ["en", "de", "sv", "no", "fi"];
  var VERTAALD = TALEN.indexOf(LANG) !== -1;
  if (!VERTAALD) LANG = "nl";

  var I18N = {
    nl: {
      defaultTrip: "Novakse reis",
      tripNames: { falun: "Falun", lulea: "Luleå", orsa: "Orsa", weissensee: "Weissensee", finland: "Finland", wellness: "Wellness & schaatsen" },
      groupTrip: "Groepsreis",
      groupTripNames: {},
      tripError: function (detail, mail) {
        return "We konden de prijs van deze reis nu niet ophalen" + (detail ? " (" + detail + ")" : "") +
          ". Ga terug naar de kalender en kies je reis opnieuw, of neem contact op via " + mail + ".";
      },
      backTo: function (naam) { return "Terug naar " + naam; },
      backToTrips: "Terug naar de reizen",
      groupIncomplete: "Deze link naar een groepsreis is niet compleet. ",
      groupPriceFailed: "We konden de prijs van deze groepsreis nu niet ophalen. ",
      groupNotOnline: "Online aanmelden kan niet voor dit aantal personen. ",
      groupPast: "Deze groepsreis is niet meer te boeken. ",
      groupRetry: function (mail) { return "Kies je groepsreis en het aantal personen opnieuw, of neem contact op via " + mail + "."; },
      backToGroupTrips: "Terug naar de groepsreizen",
      backToGroupTrip: "Terug naar de groepsreis",
      contactUs: "Neem contact op",
      fewerOf: function (naam) { return "Eén minder: " + naam; },
      moreOf: function (naam) { return "Eén meer: " + naam; },
      from: function (bedrag) { return "vanaf " + bedrag; },
      rentGear: "Spullen huren",
      personsCount: function (n) { return n + " personen"; },
      together: function (bedrag) { return "Samen " + bedrag; },
      tripPrice: "Reissom",
      activities: "Activiteiten",
      rentPrefix: "huur ",
      total: "Totaal",
      introCalendar: "Dit is de reis die je in de kalender hebt samengesteld. Vul de reisgegevens in en ga daarna direct door naar betalen.",
      introGroup: "Dit is de groepsreis die je hebt gekozen. Iedere reiziger is op de dag van aankomst 12 jaar of ouder. " +
        "Vul de reisgegevens in en ga daarna direct door naar betalen.",
      lineTrip: "Reis",
      lineArrival: "Aankomst",
      lineDeparture: "Vertrek",
      lineDays: "Dagen",
      linePersons: "Personen",
      lineAdults: "Volwassenen (12 jaar en ouder)",
      lineChildren: "Kinderen (2 t/m 11 jaar)",
      lineBabies: "Baby's (0 en 1 jaar)",
      lineGuiding: "Begeleiding",
      days: function (n) { return n + (n === 1 ? " dag" : " dagen"); },
      lineFlight: "Vlucht zelf geregeld",
      lineCar: "Vervoer zelf geregeld",
      lineGear: "Materiaal gehuurd",
      yes: "Ja",
      minusPerPerson: function (bedrag) { return "- " + bedrag + " p.p."; },
      perAdult: "Per volwassene",
      perPerson: "Per persoon",
      perChild: "Per kind",
      perBaby: "Per baby",
      payBtn: "Doorgaan naar betalen",
      methodLegend: "Hoe wil je betalen?",
      methodOnline: "Online betalen",
      methodOnlineHint: "Via de beveiligde betaalomgeving van Stripe. Je kiest daar hoe je betaalt.",
      methodTransfer: "Bankoverschrijving",
      methodTransferHint: "Je maakt het bedrag zelf over. Zodra je betaling is binnengekomen, sturen we je een bevestiging.",
      transferBtn: "Doorgaan met bankoverschrijving",
      noteOnline: "Je wordt doorgestuurd naar de beveiligde betaalomgeving van Stripe.",
      noteTransfer: "Je ziet daarna het rekeningnummer en je betalingskenmerk.",
      transferTitle: "Maak het bedrag over",
      transferIntro: "We hebben je boeking ontvangen. Maak het totaalbedrag over naar het rekeningnummer hieronder. Zodra je betaling is binnengekomen, sturen we je een bevestiging.",
      transferAmount: "Bedrag",
      transferHolder: "Ten name van",
      transferIban: "IBAN",
      transferBic: "BIC",
      transferRef: "Betalingskenmerk",
      transferRefHint: "Vermeld dit betalingskenmerk bij je overschrijving.",
      transferMailed: function (email) { return "We hebben deze gegevens ook gemaild naar " + email + "."; },
      transferMailFailed: "Bewaar deze gegevens, de mail kon niet worden verstuurd.",
      transferNotMailed: "Bewaar deze gegevens goed, je krijgt ze niet per mail.",
      busy: "Bezig...",
      somethingWrong: "Er ging iets mis.",
      priceChanged: "Het bedrag klopt niet meer met je keuze. Laad de pagina opnieuw en controleer het bedrag.",
      payFailed: function (reden, mail) { return "Betalen lukte niet: " + reden + ". Probeer het opnieuw of neem contact op via " + mail + "."; },
      payFailedServer: function (mail) { return "Betalen lukte niet. Probeer het opnieuw of neem contact op via " + mail + "."; },
      noConnection: "er kon geen verbinding worden gemaakt",
      falunDescription: null
    },
    en: {
      defaultTrip: "Novakse trip",
      tripNames: { falun: "Falun", lulea: "Luleå", orsa: "Orsa", weissensee: "Weissensee", finland: "Finland", wellness: "Wellness & skating" },
      groupTrip: "Group trip",
      groupTripNames: { "groepsreis-orsa": "Group trip Orsa", "groepsreis-falun": "Group trip Falun" },
      tripError: function (detail, mail) {
        return "We could not retrieve the price of this trip right now. Go back to the calendar and choose your trip again, or contact us at " + mail + ".";
      },
      backTo: function (naam) { return "Back to " + naam; },
      backToTrips: "Back to the trips",
      groupIncomplete: "This link to a group trip is not complete. ",
      groupPriceFailed: "We could not retrieve the price of this group trip right now. ",
      groupNotOnline: "Online booking is not possible for this number of people. ",
      groupPast: "This group trip can no longer be booked. ",
      groupRetry: function (mail) { return "Choose your group trip and the number of people again, or contact us at " + mail + "."; },
      backToGroupTrips: "Back to the trips",
      backToGroupTrip: "Back to the group trip",
      contactUs: "Get in touch",
      fewerOf: function (naam) { return "One fewer: " + naam; },
      moreOf: function (naam) { return "One more: " + naam; },
      from: function (bedrag) { return "from " + bedrag; },
      rentGear: "Rent equipment",
      personsCount: function (n) { return n + (n === 1 ? " person" : " people"); },
      together: function (bedrag) { return "Together " + bedrag; },
      tripPrice: "Trip price",
      activities: "Activities",
      rentPrefix: "rental ",
      total: "Total",
      introCalendar: "This is the trip you put together in the calendar. Fill in the travel details and then go straight on to payment.",
      introGroup: "This is the group trip you have chosen. Every traveller is 12 or older on the day of arrival. " +
        "Fill in the travel details and then go straight on to payment.",
      lineTrip: "Trip",
      lineArrival: "Arrival",
      lineDeparture: "Departure",
      lineDays: "Days",
      linePersons: "People",
      lineAdults: "Adults (12 years and older)",
      lineChildren: "Children (2 to 11 years)",
      lineBabies: "Babies (0 and 1 years)",
      lineGuiding: "Guiding",
      days: function (n) { return n + (n === 1 ? " day" : " days"); },
      lineFlight: "Own flight",
      lineCar: "Own transport",
      lineGear: "Equipment rented",
      yes: "Yes",
      minusPerPerson: function (bedrag) { return "- " + bedrag + " per person"; },
      perAdult: "Per adult",
      perPerson: "Per person",
      perChild: "Per child",
      perBaby: "Per baby",
      payBtn: "Continue to payment",
      methodLegend: "How would you like to pay?",
      methodOnline: "Pay online",
      methodOnlineHint: "Via Stripe's secure payment page. You choose how to pay there.",
      methodTransfer: "Bank transfer",
      methodTransferHint: "You transfer the amount yourself. As soon as your payment has arrived, we will send you a confirmation.",
      transferBtn: "Continue with bank transfer",
      noteOnline: "You will be sent to Stripe's secure payment page.",
      noteTransfer: "You will then see the account number and your payment reference.",
      transferTitle: "Transfer the amount",
      transferIntro: "We have received your booking. Please transfer the total amount to the account below. As soon as your payment has arrived, we will send you a confirmation.",
      transferAmount: "Amount",
      transferHolder: "Account holder",
      transferIban: "IBAN",
      transferBic: "BIC",
      transferRef: "Payment reference",
      transferRefHint: "Include this payment reference with your transfer.",
      transferMailed: function (email) { return "We have also emailed these details to " + email + "."; },
      transferMailFailed: "Please save these details, the email could not be sent.",
      transferNotMailed: "Please save these details, you will not receive them by email.",
      busy: "Please wait...",
      priceChanged: "The price has changed. Reload the page and check the amount.",
      payFailed: function (reden, mail) { return "Payment did not work: " + reden + ". Try again or contact us at " + mail + "."; },
      payFailedServer: function (mail) { return "Payment did not work. Try again or contact us at " + mail + "."; },
      noConnection: "no connection could be made",
      falunDescription: function (d) {
        var tekst = "Skating trip Falun, " + d.dagen + " days from " + d.datum + ", " + d.personen + (d.personen === 1 ? " person" : " people");
        var delen = [];
        if (d.kinderen > 0) delen.push(d.kinderen + (d.kinderen === 1 ? " child" : " children") + " (2 to 11 years)");
        if (d.baby > 0) delen.push(d.baby + (d.baby === 1 ? " baby" : " babies") + " (0 and 1 years)");
        if (delen.length) tekst += ", of whom " + delen.join(" and ");
        if (d.eigenVlucht) tekst += ", own flight";
        if (d.eigenVervoer) tekst += ", own transport";
        if (d.eigenVerzekering) tekst += ", rental car insurance";
        if (d.begeleiding > 0) tekst += ", with " + d.begeleiding + (d.begeleiding === 1 ? " day" : " days") + " of guiding";
        tekst += ", " + (delen.length ? "adult " : "") + d.perPersoon + " per person";
        if (d.kinderen > 0 && d.perKind) tekst += ", child " + d.perKind + " per person";
        if (d.baby > 0 && d.perBaby) tekst += ", baby " + d.perBaby + " per person";
        return tekst;
      }
    },
    de: {
      defaultTrip: "Novakse-Reise",
      tripNames: { falun: "Falun", lulea: "Luleå", orsa: "Orsa", weissensee: "Weissensee", finland: "Finnland", wellness: "Wellness & Eislaufen" },
      groupTrip: "Gruppenreise",
      groupTripNames: { "groepsreis-orsa": "Gruppenreise Orsa", "groepsreis-falun": "Gruppenreise Falun" },
      tripError: function (detail, mail) {
        return "Wir konnten den Preis dieser Reise gerade nicht abrufen. Geh zurück zum Kalender und wähle deine Reise erneut, oder kontaktiere uns unter " + mail + ".";
      },
      backTo: function (naam) { return "Zurück nach " + naam; },
      backToTrips: "Zurück zu den Reisen",
      groupIncomplete: "Dieser Link zu einer Gruppenreise ist nicht vollständig. ",
      groupPriceFailed: "Wir konnten den Preis dieser Gruppenreise gerade nicht abrufen. ",
      groupNotOnline: "Für diese Personenzahl ist eine Online-Anmeldung nicht möglich. ",
      groupPast: "Diese Gruppenreise kann nicht mehr gebucht werden. ",
      groupRetry: function (mail) { return "Wähle deine Gruppenreise und die Personenzahl erneut, oder kontaktiere uns unter " + mail + "."; },
      backToGroupTrips: "Zurück zu den Reisen",
      backToGroupTrip: "Zurück zur Gruppenreise",
      contactUs: "Nimm Kontakt auf",
      fewerOf: function (naam) { return "Weniger: " + naam; },
      moreOf: function (naam) { return "Mehr: " + naam; },
      from: function (bedrag) { return "ab " + bedrag; },
      rentGear: "Ausrüstung mieten",
      personsCount: function (n) { return n + (n === 1 ? " Person" : " Personen"); },
      together: function (bedrag) { return "Zusammen " + bedrag; },
      tripPrice: "Reisepreis",
      activities: "Aktivitäten",
      rentPrefix: "Miete ",
      total: "Gesamt",
      introCalendar: "Das ist die Reise, die du im Kalender zusammengestellt hast. Fülle die Reisedaten aus und geh danach direkt weiter zur Zahlung.",
      introGroup: "Das ist die Gruppenreise, die du gewählt hast. Alle Reisenden sind am Anreisetag 12 Jahre oder älter. " +
        "Fülle die Reisedaten aus und geh danach direkt weiter zur Zahlung.",
      lineTrip: "Reise",
      lineArrival: "Ankunft",
      lineDeparture: "Abreise",
      lineDays: "Tage",
      linePersons: "Personen",
      lineAdults: "Erwachsene (ab 12 Jahren)",
      lineChildren: "Kinder (2 bis 11 Jahre)",
      lineBabies: "Babys (0 und 1 Jahr)",
      lineGuiding: "Begleitung",
      days: function (n) { return n + (n === 1 ? " Tag" : " Tage"); },
      lineFlight: "Flug selbst gebucht",
      lineCar: "Transport selbst organisiert",
      lineGear: "Ausrüstung gemietet",
      yes: "Ja",
      minusPerPerson: function (bedrag) { return "- " + bedrag + " pro Person"; },
      perAdult: "Pro Erwachsenen",
      perPerson: "Pro Person",
      perChild: "Pro Kind",
      perBaby: "Pro Baby",
      payBtn: "Weiter zur Zahlung",
      methodLegend: "Wie möchtest du bezahlen?",
      methodOnline: "Online bezahlen",
      methodOnlineHint: "Über die sichere Zahlungsseite von Stripe. Dort wählst du, wie du bezahlst.",
      methodTransfer: "Überweisung",
      methodTransferHint: "Du überweist den Betrag selbst. Sobald deine Zahlung eingegangen ist, senden wir dir eine Bestätigung.",
      transferBtn: "Weiter mit Überweisung",
      noteOnline: "Du wirst zur sicheren Zahlungsseite von Stripe weitergeleitet.",
      noteTransfer: "Danach siehst du die Kontonummer und deinen Verwendungszweck.",
      transferTitle: "Überweise den Betrag",
      transferIntro: "Wir haben deine Buchung erhalten. Überweise den Gesamtbetrag auf das Konto unten. Sobald deine Zahlung eingegangen ist, senden wir dir eine Bestätigung.",
      transferAmount: "Betrag",
      transferHolder: "Kontoinhaber",
      transferIban: "IBAN",
      transferBic: "BIC",
      transferRef: "Verwendungszweck",
      transferRefHint: "Gib bei der Überweisung diesen Verwendungszweck an.",
      transferMailed: function (email) { return "Wir haben dir diese Angaben auch an " + email + " gemailt."; },
      transferMailFailed: "Bitte speichere diese Angaben, die E-Mail konnte nicht gesendet werden.",
      transferNotMailed: "Bitte speichere diese Angaben, du bekommst sie nicht per E-Mail.",
      busy: "Bitte warten...",
      priceChanged: "Der Preis hat sich geändert. Lade die Seite neu und prüfe den Betrag.",
      payFailed: function (reden, mail) { return "Die Zahlung hat nicht geklappt: " + reden + ". Versuche es erneut oder kontaktiere uns unter " + mail + "."; },
      payFailedServer: function (mail) { return "Die Zahlung hat nicht geklappt. Versuche es erneut oder kontaktiere uns unter " + mail + "."; },
      noConnection: "es konnte keine Verbindung hergestellt werden",
      falunDescription: function (d) {
        var tekst = "Schlittschuhreise Falun, " + d.dagen + " Tage ab " + d.datum + ", " + d.personen + (d.personen === 1 ? " Person" : " Personen");
        var delen = [];
        if (d.kinderen > 0) delen.push(d.kinderen + (d.kinderen === 1 ? " Kind" : " Kinder") + " (2 bis 11 Jahre)");
        if (d.baby > 0) delen.push(d.baby + (d.baby === 1 ? " Baby" : " Babys") + " (0 und 1 Jahr)");
        if (delen.length) tekst += ", davon " + delen.join(" und ");
        if (d.eigenVlucht) tekst += ", Flug selbst gebucht";
        if (d.eigenVervoer) tekst += ", Transport selbst organisiert";
        if (d.eigenVerzekering) tekst += ", Mietwagenversicherung";
        if (d.begeleiding > 0) tekst += ", mit " + d.begeleiding + (d.begeleiding === 1 ? " Tag" : " Tagen") + " Begleitung";
        tekst += ", " + (delen.length ? "Erwachsene " : "") + d.perPersoon + " pro Person";
        if (d.kinderen > 0 && d.perKind) tekst += ", Kind " + d.perKind + " pro Person";
        if (d.baby > 0 && d.perBaby) tekst += ", Baby " + d.perBaby + " pro Person";
        return tekst;
      }
    },
    sv: {
      defaultTrip: "Novakse-resa",
      tripNames: { falun: "Falun", lulea: "Luleå", orsa: "Orsa", weissensee: "Weissensee", finland: "Finland", wellness: "Wellness & skridskor" },
      groupTrip: "Gruppresa",
      groupTripNames: { "groepsreis-orsa": "Gruppresa Orsa", "groepsreis-falun": "Gruppresa Falun" },
      tripError: function (detail, mail) {
        return "Vi kunde inte hämta priset för den här resan just nu. Gå tillbaka till kalendern och välj din resa igen, eller kontakta oss på " + mail + ".";
      },
      backTo: function (naam) { return "Tillbaka till " + naam; },
      backToTrips: "Tillbaka till resorna",
      groupIncomplete: "Den här länken till en gruppresa är inte komplett. ",
      groupPriceFailed: "Vi kunde inte hämta priset för den här gruppresan just nu. ",
      groupNotOnline: "Det går inte att anmäla sig online för det här antalet personer. ",
      groupPast: "Den här gruppresan går inte längre att boka. ",
      groupRetry: function (mail) { return "Välj din gruppresa och antalet personer igen, eller kontakta oss på " + mail + "."; },
      backToGroupTrips: "Tillbaka till resorna",
      backToGroupTrip: "Tillbaka till gruppresan",
      contactUs: "Hör av dig",
      fewerOf: function (naam) { return "Färre: " + naam; },
      moreOf: function (naam) { return "Fler: " + naam; },
      from: function (bedrag) { return "från " + bedrag; },
      rentGear: "Hyr utrustning",
      personsCount: function (n) { return n + (n === 1 ? " person" : " personer"); },
      together: function (bedrag) { return "Totalt " + bedrag; },
      tripPrice: "Resans pris",
      activities: "Aktiviteter",
      rentPrefix: "hyra ",
      total: "Totalt",
      introCalendar: "Det här är resan du har satt ihop i kalendern. Fyll i reseuppgifterna och gå sedan direkt vidare till betalningen.",
      introGroup: "Det här är gruppresan du har valt. Alla resenärer är 12 år eller äldre på ankomstdagen. " +
        "Fyll i reseuppgifterna och gå sedan direkt vidare till betalningen.",
      lineTrip: "Resa",
      lineArrival: "Ankomst",
      lineDeparture: "Avresa",
      lineDays: "Dagar",
      linePersons: "Personer",
      lineAdults: "Vuxna (12 år och äldre)",
      lineChildren: "Barn (2 till 11 år)",
      lineBabies: "Bebisar (0 och 1 år)",
      lineGuiding: "Guidning",
      days: function (n) { return n + (n === 1 ? " dag" : " dagar"); },
      lineFlight: "Eget flyg",
      lineCar: "Egen transport",
      lineGear: "Utrustning hyrd",
      yes: "Ja",
      minusPerPerson: function (bedrag) { return "- " + bedrag + " per person"; },
      perAdult: "Per vuxen",
      perPerson: "Per person",
      perChild: "Per barn",
      perBaby: "Per bebis",
      payBtn: "Gå vidare till betalning",
      methodLegend: "Hur vill du betala?",
      methodOnline: "Betala online",
      methodOnlineHint: "Via Stripes säkra betalningssida. Där väljer du hur du betalar.",
      methodTransfer: "Banköverföring",
      methodTransferHint: "Du överför beloppet själv. Så snart din betalning har kommit in skickar vi en bekräftelse.",
      transferBtn: "Fortsätt med banköverföring",
      noteOnline: "Du skickas vidare till Stripes säkra betalningssida.",
      noteTransfer: "Därefter ser du kontonumret och din betalningsreferens.",
      transferTitle: "Överför beloppet",
      transferIntro: "Vi har tagit emot din bokning. Överför det totala beloppet till kontot nedan. Så snart din betalning har kommit in skickar vi en bekräftelse.",
      transferAmount: "Belopp",
      transferHolder: "Kontoinnehavare",
      transferIban: "IBAN",
      transferBic: "BIC",
      transferRef: "Betalningsreferens",
      transferRefHint: "Ange betalningsreferensen vid din överföring.",
      transferMailed: function (email) { return "Vi har också mejlat uppgifterna till " + email + "."; },
      transferMailFailed: "Spara uppgifterna, mejlet kunde inte skickas.",
      transferNotMailed: "Spara uppgifterna, du får dem inte via mejl.",
      busy: "Vänta...",
      priceChanged: "Priset har ändrats. Ladda om sidan och kontrollera beloppet.",
      payFailed: function (reden, mail) { return "Betalningen gick inte igenom: " + reden + ". Försök igen eller kontakta oss på " + mail + "."; },
      payFailedServer: function (mail) { return "Betalningen gick inte igenom. Försök igen eller kontakta oss på " + mail + "."; },
      noConnection: "det gick inte att skapa en anslutning",
      falunDescription: function (d) {
        var tekst = "Skridskoresa Falun, " + d.dagen + " dagar från " + d.datum + ", " + d.personen + (d.personen === 1 ? " person" : " personer");
        var delen = [];
        if (d.kinderen > 0) delen.push(d.kinderen + " barn (2 till 11 år)");
        if (d.baby > 0) delen.push(d.baby + (d.baby === 1 ? " bebis" : " bebisar") + " (0 och 1 år)");
        if (delen.length) tekst += ", varav " + delen.join(" och ");
        if (d.eigenVlucht) tekst += ", eget flyg";
        if (d.eigenVervoer) tekst += ", egen transport";
        if (d.eigenVerzekering) tekst += ", hyrbilsförsäkring";
        if (d.begeleiding > 0) tekst += ", med " + d.begeleiding + (d.begeleiding === 1 ? " dags" : " dagars") + " guidning";
        tekst += ", " + (delen.length ? "vuxen " : "") + d.perPersoon + " per person";
        if (d.kinderen > 0 && d.perKind) tekst += ", barn " + d.perKind + " per person";
        if (d.baby > 0 && d.perBaby) tekst += ", bebis " + d.perBaby + " per person";
        return tekst;
      }
    },
    no: {
      defaultTrip: "Novakse-tur",
      tripNames: { falun: "Falun", lulea: "Luleå", orsa: "Orsa", weissensee: "Weissensee", finland: "Finland", wellness: "Wellness & skøyter" },
      groupTrip: "Gruppetur",
      groupTripNames: { "groepsreis-orsa": "Gruppetur Orsa", "groepsreis-falun": "Gruppetur Falun" },
      tripError: function (detail, mail) {
        return "Vi kunne ikke hente prisen for denne turen akkurat nå. Gå tilbake til kalenderen og velg turen din på nytt, eller kontakt oss på " + mail + ".";
      },
      backTo: function (naam) { return "Tilbake til " + naam; },
      backToTrips: "Tilbake til turene",
      groupIncomplete: "Denne lenken til en gruppetur er ikke fullstendig. ",
      groupPriceFailed: "Vi kunne ikke hente prisen for denne gruppeturen akkurat nå. ",
      groupNotOnline: "Det er ikke mulig å melde seg på online for dette antallet personer. ",
      groupPast: "Denne gruppeturen kan ikke lenger bestilles. ",
      groupRetry: function (mail) { return "Velg gruppeturen og antall personer på nytt, eller kontakt oss på " + mail + "."; },
      backToGroupTrips: "Tilbake til turene",
      backToGroupTrip: "Tilbake til gruppeturen",
      contactUs: "Ta kontakt",
      fewerOf: function (naam) { return "Færre: " + naam; },
      moreOf: function (naam) { return "Flere: " + naam; },
      from: function (bedrag) { return "fra " + bedrag; },
      rentGear: "Lei utstyr",
      personsCount: function (n) { return n + (n === 1 ? " person" : " personer"); },
      together: function (bedrag) { return "Til sammen " + bedrag; },
      tripPrice: "Turens pris",
      activities: "Aktiviteter",
      rentPrefix: "leie ",
      total: "Totalt",
      introCalendar: "Dette er turen du har satt sammen i kalenderen. Fyll inn reiseopplysningene og gå deretter rett videre til betaling.",
      introGroup: "Dette er gruppeturen du har valgt. Alle reisende er 12 år eller eldre på ankomstdagen. " +
        "Fyll inn reiseopplysningene og gå deretter rett videre til betaling.",
      lineTrip: "Tur",
      lineArrival: "Ankomst",
      lineDeparture: "Avreise",
      lineDays: "Dager",
      linePersons: "Personer",
      lineAdults: "Voksne (12 år og eldre)",
      lineChildren: "Barn (2 til 11 år)",
      lineBabies: "Babyer (0 og 1 år)",
      lineGuiding: "Veiledning",
      days: function (n) { return n + (n === 1 ? " dag" : " dager"); },
      lineFlight: "Eget fly",
      lineCar: "Egen transport",
      lineGear: "Utstyr leid",
      yes: "Ja",
      minusPerPerson: function (bedrag) { return "- " + bedrag + " per person"; },
      perAdult: "Per voksen",
      perPerson: "Per person",
      perChild: "Per barn",
      perBaby: "Per baby",
      payBtn: "Gå videre til betaling",
      methodLegend: "Hvordan vil du betale?",
      methodOnline: "Betal på nett",
      methodOnlineHint: "Via Stripes sikre betalingsside. Der velger du hvordan du betaler.",
      methodTransfer: "Bankoverføring",
      methodTransferHint: "Du overfører beløpet selv. Så snart betalingen er kommet inn, sender vi deg en bekreftelse.",
      transferBtn: "Fortsett med bankoverføring",
      noteOnline: "Du blir sendt videre til Stripes sikre betalingsside.",
      noteTransfer: "Deretter ser du kontonummeret og betalingsreferansen din.",
      transferTitle: "Overfør beløpet",
      transferIntro: "Vi har mottatt bookingen din. Overfør hele beløpet til kontoen under. Så snart betalingen er kommet inn, sender vi deg en bekreftelse.",
      transferAmount: "Beløp",
      transferHolder: "Kontoinnehaver",
      transferIban: "IBAN",
      transferBic: "BIC",
      transferRef: "Betalingsreferanse",
      transferRefHint: "Oppgi denne betalingsreferansen ved overføringen.",
      transferMailed: function (email) { return "Vi har også sendt opplysningene til " + email + " på e-post."; },
      transferMailFailed: "Ta vare på opplysningene, e-posten kunne ikke sendes.",
      transferNotMailed: "Ta vare på opplysningene, du får dem ikke på e-post.",
      busy: "Vent litt...",
      priceChanged: "Prisen er endret. Last inn siden på nytt og kontroller beløpet.",
      payFailed: function (reden, mail) { return "Betalingen gikk ikke: " + reden + ". Prøv igjen eller kontakt oss på " + mail + "."; },
      payFailedServer: function (mail) { return "Betalingen gikk ikke. Prøv igjen eller kontakt oss på " + mail + "."; },
      noConnection: "det kunne ikke opprettes forbindelse",
      falunDescription: function (d) {
        var tekst = "Skøytetur Falun, " + d.dagen + " dager fra " + d.datum + ", " + d.personen + (d.personen === 1 ? " person" : " personer");
        var delen = [];
        if (d.kinderen > 0) delen.push(d.kinderen + " barn (2 til 11 år)");
        if (d.baby > 0) delen.push(d.baby + (d.baby === 1 ? " baby" : " babyer") + " (0 og 1 år)");
        if (delen.length) tekst += ", hvorav " + delen.join(" og ");
        if (d.eigenVlucht) tekst += ", eget fly";
        if (d.eigenVervoer) tekst += ", egen transport";
        if (d.eigenVerzekering) tekst += ", forsikring leiebil";
        if (d.begeleiding > 0) tekst += ", med " + d.begeleiding + (d.begeleiding === 1 ? " dag" : " dager") + " veiledning";
        tekst += ", " + (delen.length ? "voksen " : "") + d.perPersoon + " per person";
        if (d.kinderen > 0 && d.perKind) tekst += ", barn " + d.perKind + " per person";
        if (d.baby > 0 && d.perBaby) tekst += ", baby " + d.perBaby + " per person";
        return tekst;
      }
    },
    fi: {
      defaultTrip: "Novakse-matka",
      tripNames: { falun: "Falun", lulea: "Luleå", orsa: "Orsa", weissensee: "Weissensee", finland: "Suomi", wellness: "Wellness & luistelu" },
      groupTrip: "Ryhmämatka",
      groupTripNames: { "groepsreis-orsa": "Ryhmämatka Orsaan", "groepsreis-falun": "Ryhmämatka Faluniin" },
      tripError: function (detail, mail) {
        return "Emme saaneet haettua tämän matkan hintaa juuri nyt. Palaa kalenteriin ja valitse matkasi uudelleen, tai ota yhteyttä osoitteeseen " + mail + ".";
      },
      backTo: function (naam) { return "Takaisin: " + naam; },
      backToTrips: "Takaisin matkoihin",
      groupIncomplete: "Tämä ryhmämatkan linkki ei ole täydellinen. ",
      groupPriceFailed: "Emme saaneet haettua tämän ryhmämatkan hintaa juuri nyt. ",
      groupNotOnline: "Verkossa ilmoittautuminen ei ole mahdollista tälle henkilömäärälle. ",
      groupPast: "Tätä ryhmämatkaa ei voi enää varata. ",
      groupRetry: function (mail) { return "Valitse ryhmämatka ja henkilömäärä uudelleen, tai ota yhteyttä osoitteeseen " + mail + "."; },
      backToGroupTrips: "Takaisin matkoihin",
      backToGroupTrip: "Takaisin ryhmämatkaan",
      contactUs: "Ota yhteyttä",
      fewerOf: function (naam) { return "Vähemmän: " + naam; },
      moreOf: function (naam) { return "Lisää: " + naam; },
      from: function (bedrag) { return "alkaen " + bedrag; },
      rentGear: "Vuokraa varusteet",
      personsCount: function (n) { return n + (n === 1 ? " henkilö" : " henkilöä"); },
      together: function (bedrag) { return "Yhteensä " + bedrag; },
      tripPrice: "Matkan hinta",
      activities: "Aktiviteetit",
      rentPrefix: "vuokra: ",
      total: "Yhteensä",
      introCalendar: "Tämä on matka, jonka koostit kalenterissa. Täytä matkatiedot ja siirry sen jälkeen suoraan maksamaan.",
      introGroup: "Tämä on valitsemasi ryhmämatka. Jokainen matkustaja on saapumispäivänä vähintään 12-vuotias. " +
        "Täytä matkatiedot ja siirry sen jälkeen suoraan maksamaan.",
      lineTrip: "Matka",
      lineArrival: "Saapuminen",
      lineDeparture: "Lähtö",
      lineDays: "Päivää",
      linePersons: "Henkilöä",
      lineAdults: "Aikuiset (12-vuotiaat ja vanhemmat)",
      lineChildren: "Lapset (2-11-vuotiaat)",
      lineBabies: "Vauvat (0-1-vuotiaat)",
      lineGuiding: "Opastus",
      days: function (n) { return n + (n === 1 ? " päivä" : " päivää"); },
      lineFlight: "Oma lento",
      lineCar: "Oma kuljetus",
      lineGear: "Varusteet vuokrattu",
      yes: "Kyllä",
      minusPerPerson: function (bedrag) { return "- " + bedrag + " / henkilö"; },
      perAdult: "Hinta / aikuinen",
      perPerson: "Hinta / henkilö",
      perChild: "Hinta / lapsi",
      perBaby: "Hinta / vauva",
      payBtn: "Jatka maksamaan",
      methodLegend: "Miten haluat maksaa?",
      methodOnline: "Maksa verkossa",
      methodOnlineHint: "Stripen turvallisen maksusivun kautta. Siellä valitset, miten maksat.",
      methodTransfer: "Tilisiirto",
      methodTransferHint: "Siirrät summan itse. Kun maksusi on saapunut, lähetämme sinulle vahvistuksen.",
      transferBtn: "Jatka tilisiirrolla",
      noteOnline: "Sinut ohjataan Stripen turvalliselle maksusivulle.",
      noteTransfer: "Sen jälkeen näet tilinumeron ja viitteen.",
      transferTitle: "Siirrä summa",
      transferIntro: "Olemme vastaanottaneet varauksesi. Siirrä koko summa alla olevalle tilille. Kun maksusi on saapunut, lähetämme sinulle vahvistuksen.",
      transferAmount: "Summa",
      transferHolder: "Tilinhaltija",
      transferIban: "IBAN",
      transferBic: "BIC",
      transferRef: "Viite",
      transferRefHint: "Kirjoita tämä viite tilisiirtoon.",
      transferMailed: function (email) { return "Lähetimme tiedot myös sähköpostiin " + email + "."; },
      transferMailFailed: "Tallenna tiedot, sähköpostia ei voitu lähettää.",
      transferNotMailed: "Tallenna tiedot, et saa niitä sähköpostiin.",
      busy: "Hetki...",
      priceChanged: "Hinta on muuttunut. Lataa sivu uudelleen ja tarkista summa.",
      payFailed: function (reden, mail) { return "Maksu ei onnistunut: " + reden + ". Yritä uudelleen tai ota yhteyttä osoitteeseen " + mail + "."; },
      payFailedServer: function (mail) { return "Maksu ei onnistunut. Yritä uudelleen tai ota yhteyttä osoitteeseen " + mail + "."; },
      noConnection: "yhteyttä ei saatu muodostettua",
      falunDescription: function (d) {
        var tekst = "Luistelumatka Falun, " + d.dagen + " päivää " + d.datum + " alkaen, " + d.personen + (d.personen === 1 ? " henkilö" : " henkilöä");
        var delen = [];
        if (d.kinderen > 0) delen.push(d.kinderen + (d.kinderen === 1 ? " lapsi" : " lasta") + " (2-11-vuotiaat)");
        if (d.baby > 0) delen.push(d.baby + (d.baby === 1 ? " vauva" : " vauvaa") + " (0-1-vuotiaat)");
        if (delen.length) tekst += ", joista " + delen.join(" ja ");
        if (d.eigenVlucht) tekst += ", oma lento";
        if (d.eigenVervoer) tekst += ", oma kuljetus";
        if (d.eigenVerzekering) tekst += ", vuokra-auton vakuutus";
        if (d.begeleiding > 0) tekst += ", opastus " + d.begeleiding + (d.begeleiding === 1 ? " päivä" : " päivää");
        tekst += ", " + (delen.length ? "aikuinen " : "") + d.perPersoon + " / henkilö";
        if (d.kinderen > 0 && d.perKind) tekst += ", lapsi " + d.perKind + " / henkilö";
        if (d.baby > 0 && d.perBaby) tekst += ", vauva " + d.perBaby + " / henkilö";
        return tekst;
      }
    }
  };
  var T = I18N[LANG];
  // A text that is not translated (yet) falls back to the Dutch one.
  Object.keys(I18N.nl).forEach(function (sleutel) {
    if (!(sleutel in T)) T[sleutel] = I18N.nl[sleutel];
  });

  var LOCALE = { nl: "nl-NL", en: "en-GB", de: "de-DE", sv: "sv-SE", no: "nb-NO", fi: "fi-FI" }[LANG];
  function getal(n, opties) {
    try { return n.toLocaleString(LOCALE, opties); } catch (fout) { return n.toLocaleString("nl-NL", opties); }
  }

  /* "" on the Dutch site, "../" in the language folders: the folder of
     js/uitchecken.js, so data files and scripts load from the site root. */
  var MAP = (function () {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var treffer = /^(.*?)js\/uitchecken\.js(\?.*)?$/.exec(scripts[i].getAttribute("src") || "");
      if (treffer) return treffer[1];
    }
    return "";
  })();

  var inhoud = document.getElementById("checkoutInhoud");
  var geenBedrag = document.getElementById("geenBedrag");
  var reisNaamEl = document.getElementById("reisNaam");
  var omschrijvingEl = document.getElementById("omschrijvingTekst");
  var bedragEl = document.getElementById("bedragTekst");
  var foutEl = document.getElementById("betaalFout");
  var knop = document.getElementById("betaalKnop");
  var gegevensForm = document.getElementById("reisgegevensFormulier");
  var stappen = document.getElementById("checkoutStappen");
  if (!gegevensForm || !knop) return;

  var params = new URLSearchParams(window.location.search);
  // reis goes to the server as it is ("Novakse reis" without a name, as
  // before); reisTekst is what the page shows.
  var reis = params.get("reis") || "Novakse reis";
  var reisTekst = params.get("reis") || T.defaultTrip;
  var bedragCent = parseInt(params.get("bedrag"), 10);

  /* De keuzes uit de Falun-kalender. Staat aankomst erin, dan komt het bedrag
     van de server en niet uit het webadres. */
  var falunKeuze = null;
  if (reis === "Falun" && params.get("aankomst")) {
    falunKeuze = {
      reis: "Falun",
      aankomst: params.get("aankomst"),
      dagen: params.get("dagen"),
      personen: params.get("personen"),
      kinderen: params.get("kinderen") || "",
      baby: params.get("baby") || "",
      vlucht: params.get("vlucht") || "",
      auto: params.get("auto") || "",
      verzekering: params.get("verzekering") || "",
      begeleiding: params.get("begeleiding") || ""
    };
  }

  // Where a Falun booking came from, for the "back to the calendar" link.
  var FALUN_INFO = { naam: T.tripNames.falun, pagina: "falun.html" };

  /* A whole number written as digits only ("3"), or "" for an empty value.
     Anything else ("3abc", "-1", "2.5") gives null: the server refuses it
     too, so the page must not show a price for it. */
  function alsAantalTekst(waarde) {
    if (waarde === null || waarde === undefined || waarde === "") return "";
    return /^\d{1,3}$/.test(waarde) ? String(parseInt(waarde, 10)) : null;
  }

  /* Children (2-11) and babies (0-1) are part of personen. Returns
     { kinderen, baby } as whole numbers, or null when a value is not a plain
     number or would leave no adult (12 and older). The server checks the same
     and sets the price; this only keeps the page from showing a price for a
     link the server would refuse. */
  function leesKinderen(keuze, personen) {
    var k = alsAantalTekst(keuze.kinderen);
    var b = alsAantalTekst(keuze.baby);
    if (k === null || b === null) return null;
    var kinderen = k ? parseInt(k, 10) : 0;
    var baby = b ? parseInt(b, 10) : 0;
    if (personen - kinderen - baby < 1) return null;
    return { kinderen: kinderen, baby: baby };
  }

  /* Trips booked through their own price calendar (van/tot/personen). The key
     is the value of ?reis=; the page is where the visitor came from.
     zonderEigenVlucht: package only, no "I'll arrange my own flight" (no
     opties.vluchtZelf in its price file). An old link with vlucht=zelf is
     ignored, so the page shows the package price the server charges. */
  var KALENDER_REIZEN = {
    lulea: { naam: T.tripNames.lulea, pagina: "lulea.html" },
    orsa: { naam: T.tripNames.orsa, pagina: "orsa.html", begeleiding: true },
    weissensee: { naam: T.tripNames.weissensee, pagina: "weissensee.html", zonderEigenVlucht: true, zonderEigenAuto: true },
    finland: { naam: T.tripNames.finland, pagina: "finland.html", materiaal: true },
    // The trip page only exists in Dutch and Swedish; elsewhere the "back"
    // button goes to the trips overview of that language (see terugLink).
    wellness: { naam: T.tripNames.wellness, pagina: "wellness.html", talen: ["nl", "sv"] }
  };

  /* A calendar link always carries van; a payment link from Joey
     (?reis=Finland&bedrag=...) does not, so that one keeps working as before. */
  var reisKeuze = null;
  var reisSleutel = reis.toLowerCase();
  if (!falunKeuze && KALENDER_REIZEN.hasOwnProperty(reisSleutel) && params.get("van")) {
    var reisInfo = KALENDER_REIZEN[reisSleutel];
    reisKeuze = {
      reis: reisSleutel,
      van: params.get("van") || "",
      tot: params.get("tot") || "",
      personen: params.get("personen") || "",
      kinderen: params.get("kinderen") || "",
      baby: params.get("baby") || "",
      begeleiding: reisInfo.begeleiding ? params.get("begeleiding") || "" : "",
      // Own flight from the calendar checkbox; only "zelf" counts.
      vlucht: !reisInfo.zonderEigenVlucht && params.get("vlucht") === "zelf" ? "zelf" : "",
      // Own transport from the calendar checkbox; only "zelf" counts.
      auto: !reisInfo.zonderEigenAuto && params.get("auto") === "zelf" ? "zelf" : "",
      // Gear rental from the calendar checkbox (Finland); only "ja" counts.
      materiaal: reisInfo.materiaal && params.get("materiaal") === "ja" ? "ja" : ""
    };
  }

  /* Group trips with fixed dates (?reis=groepsreis-orsa&personen=4). Every
     "groepsreis-..." key takes this route, as in api/create-payment.js, so an
     unknown or incomplete link gets the group trip message and never the
     payment-link flow. The server checks the head count; van (the arrival
     day) comes from its answer. */
  var groepKeuze = null;
  if (!falunKeuze && !reisKeuze && reisSleutel.indexOf("groepsreis-") === 0) {
    groepKeuze = { reis: reisSleutel, personen: 0, van: "" };
  }

  function euro(cent) {
    return "€" + getal(cent / 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function toonNiets() {
    inhoud.hidden = true;
    if (stappen) stappen.hidden = true;
    geenBedrag.hidden = false;
  }

  var DATUM_PATROON = /^\d{4}-\d{2}-\d{2}$/;

  // "2027-01-10" -> "10 januari 2027". Returns "" for anything that is not a
  // real date, so the page never shows "Invalid Date".
  function datumTekst(iso) {
    if (!DATUM_PATROON.test(iso)) return "";
    var datum = new Date(iso + "T12:00:00Z");
    if (isNaN(datum.getTime())) return "";
    try {
      return datum.toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    } catch (fout) {
      return datum.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    }
  }

  /* The "back" button of a calendar trip: its own page in this language,
     or the trips overview when that page does not exist in this language. */
  function terugLink(info) {
    if (info.talen && info.talen.indexOf(LANG) === -1) return { href: "reizen.html", tekst: T.backToTrips };
    return { href: info.pagina, tekst: T.backTo(info.naam) };
  }

  /* The calendar trips get their own error: no payment link from Joey is
     involved, so point back to the trip page instead. */
  function toonReisFout(info, detail) {
    geenBedrag.textContent = "";

    var tekst = document.createElement("p");
    tekst.className = "booking__note";
    // The server's message is Dutch: only the Dutch page shows it.
    tekst.textContent = T.tripError(detail && !VERTAALD ? detail.replace(/[.\s]+$/, "") : "", MAIL);

    tekst.style.marginBottom = "1.25rem"; // room between the text and the button

    var link = terugLink(info);
    var terug = document.createElement("a");
    terug.className = "btn btn--outline-dark";
    terug.href = link.href;
    terug.textContent = link.tekst;

    geenBedrag.appendChild(tekst);
    geenBedrag.appendChild(terug);

    // "Choose how you want to pay" makes no sense without a price.
    var intro = document.querySelector(".booking__intro");
    if (intro) intro.hidden = true;
    toonNiets();
  }

  /* A group trip link that cannot be paid: incomplete, an odd head count,
     an unknown trip, or no price from the server. Back to the group trips
     on reizen.html; for a head count that cannot book online also contact.
     detail: the server's own message, if any; geenLink: true when the link
     itself is incomplete (nothing was asked from the server). */
  var GROEPSREIS_CONTACT_CODES = ["teWeinig", "oneven", "teVeel"];
  // Group trips that have their own page in every language folder.
  var GROEPSREIS_PAGINAS = ["groepsreis-orsa", "groepsreis-falun"];
  function toonGroepsreisFout(detail, code, geenLink) {
    geenBedrag.textContent = "";

    // The server's message is Dutch: in a language folder the error code
    // picks a translated message instead.
    var vertaaldDetail = "";
    if (VERTAALD) {
      detail = "";
      vertaaldDetail = GROEPSREIS_CONTACT_CODES.indexOf(code) !== -1 ? T.groupNotOnline
        : (code === "voorbij" ? T.groupPast : "");
    }
    var tekst = document.createElement("p");
    tekst.className = "booking__note";
    tekst.textContent = (detail
      ? detail.replace(/[.\s]+$/, "") + ". "
      : (geenLink ? T.groupIncomplete : (vertaaldDetail || T.groupPriceFailed))) +
      T.groupRetry(MAIL);
    tekst.style.marginBottom = "1.25rem"; // room between the text and the buttons
    geenBedrag.appendChild(tekst);

    var knoppen = document.createElement("div");
    knoppen.style.display = "flex";
    knoppen.style.flexWrap = "wrap";
    knoppen.style.gap = "0.75rem";
    var terug = document.createElement("a");
    terug.className = "btn btn--outline-dark";
    if (VERTAALD && groepKeuze && GROEPSREIS_PAGINAS.indexOf(groepKeuze.reis) !== -1) {
      // In a language folder: back to the page of this group trip.
      terug.href = groepKeuze.reis + ".html";
      terug.textContent = T.backToGroupTrip;
    } else {
      terug.href = VERTAALD ? "reizen.html" : "reizen.html#groepsreizen";
      terug.textContent = T.backToGroupTrips;
    }
    knoppen.appendChild(terug);
    if (GROEPSREIS_CONTACT_CODES.indexOf(code) !== -1) {
      var contact = document.createElement("a");
      contact.className = "btn btn--dark";
      contact.href = "contact.html";
      contact.textContent = T.contactUs;
      knoppen.appendChild(contact);
    }
    geenBedrag.appendChild(knoppen);

    var intro = document.querySelector(".booking__intro");
    if (intro) intro.hidden = true;
    toonNiets();
  }

  /* The number of days activities count over for a group trip
     (activiteitenDagen in data/groepsreizen.json), read with the same module
     the server uses (js/groepsreis-prijs.js, loaded here only for a group
     trip). 0 when anything is missing: the optional activities block then
     stays away and the trip itself can still be paid. */
  function groepsreisActiviteitenDagen(sleutel) {
    var module = window.NovakseGroepsreis
      ? Promise.resolve(window.NovakseGroepsreis)
      : new Promise(function (resolve) {
          var el = document.createElement("script");
          el.src = MAP + "js/groepsreis-prijs.js";
          el.onload = function () { resolve(window.NovakseGroepsreis || null); };
          el.onerror = function () { resolve(null); };
          document.head.appendChild(el);
        });
    var data = fetch(MAP + "data/groepsreizen.json")
      .then(function (respons) { return respons.ok ? respons.json() : null; })
      .catch(function () { return null; });
    return Promise.all([module, data]).then(function (delen) {
      var reisData = delen[0] && delen[1] ? delen[0].reis(delen[1], sleutel) : null;
      return reisData && reisData.activiteitenDagen >= 1 ? reisData.activiteitenDagen : 0;
    }).catch(function () { return 0; });
  }

  // Summary lines above the total, in the same style as the Falun calendar.
  function toonReisRegels(regels) {
    var lijst = document.createElement("dl");
    lijst.className = "booking__lines";
    regels.forEach(function (regel) {
      var dt = document.createElement("dt");
      dt.textContent = regel[0];
      var dd = document.createElement("dd");
      dd.textContent = regel[1];
      lijst.appendChild(dt);
      lijst.appendChild(dd);
    });
    lijst.style.marginTop = "0";

    // Above the (still hidden) activities block, so the order stays: trip,
    // optional activities, total.
    var totaal = bedragEl.parentNode;
    totaal.parentNode.insertBefore(lijst, actBlok || totaal);
    totaal.classList.remove("booking__total--standalone");
  }

  /* ---- Activiteiten bijboeken (optional; Falun and Wellness only) ------
     One plain list under the trip: each activity with its price lines (one
     stepper per line). An activity with rentals has a "Spullen huren" button
     under it that shows those rentals. Rentals count only together with the
     same number of persons on the activity: the page raises the standaard
     tariff for that (ACT.aanvullen) and the server checks it (bereken).
     The catalogue is data/activiteiten.json; all prices and caps come from
     js/activiteiten-prijs.js (window.NovakseActiviteiten), which the server
     uses as well. The block only appears once the trip price is known, and
     shows every activity right away, each as its own checkbox (see
     tekenLijst/wijzigActAan): nothing has its own master switch any more, an
     unticked activity simply adds nothing. The choice is kept in ?act=
     (e.g. act=husky-lunchtocht:2), so a reload keeps it. ---- */
  var ACT = window.NovakseActiviteiten;
  var actBlok = document.getElementById("activiteitenBlok");
  var actLijst = document.getElementById("activiteitenLijst");
  var actOverzicht = document.getElementById("activiteitenOverzicht");
  var actKlaar = Boolean(ACT && actBlok && actLijst && actOverzicht);

  // Filled once the block is shown; null means: no activities on this page.
  var activiteiten = null;

  // Only these trips offer activities, so only they load the catalogue.
  // A group trip uses its own key ("groepsreis-orsa"), an alias of Falun's
  // list in data/activiteiten.json. Orsa has its own list, priced by hand
  // (see activiteiten.json's _opmerking) rather than Falun's.
  var actSoort = falunKeuze ? "falun" : (reisKeuze && (reisKeuze.reis === "wellness" || reisKeuze.reis === "orsa") ? reisKeuze.reis : (groepKeuze ? groepKeuze.reis : ""));
  var actCatalogus = actKlaar && actSoort
    ? fetch(MAP + "data/activiteiten.json")
        .then(function (respons) { return respons.ok ? respons.json() : null; })
        // In a language folder the texts on screen come from the
        // translations in the same file; prices and ids stay as they are.
        .then(function (cat) { return cat && VERTAALD && typeof ACT.vertaal === "function" ? ACT.vertaal(cat, LANG) : cat; })
        .catch(function () { return null; })
    : null;

  function kopieKeuze(keuze) {
    var uit = {};
    Object.keys(keuze).forEach(function (id) { if (keuze[id] > 0) uit[id] = keuze[id]; });
    return uit;
  }

  function actBereken(keuze) {
    var uitkomst = ACT.bereken(activiteiten.cat, activiteiten.soort, keuze, activiteiten.ctx);
    return uitkomst && !uitkomst.fout ? uitkomst : null;
  }

  /* The choice after one step (+1 or -1) on one line, or null when that step
     is not allowed: above a cap, below the persons a rental needs, or below
     zero. A plus on a rental raises the standaard tariff of its activity. */
  function stapKeuze(id, stap) {
    var aantal = activiteiten.keuze[id] || 0;
    if (!activiteiten.regels[id] || aantal + stap < 0) return null;
    var nieuw = kopieKeuze(activiteiten.keuze);
    nieuw[id] = aantal + stap;
    if (!nieuw[id]) delete nieuw[id];
    if (stap > 0) nieuw = ACT.aanvullen(activiteiten.cat, activiteiten.soort, nieuw, activiteiten.ctx);
    return actBereken(nieuw) ? nieuw : null;
  }

  function maak(tag, klasse, tekst) {
    var el = document.createElement(tag);
    if (klasse) el.className = klasse;
    if (tekst !== undefined) el.textContent = tekst;
    return el;
  }

  function maakStepKnop(teken, label, id, stap) {
    var knopEl = maak("button", "act-stepper__knop");
    knopEl.type = "button";
    knopEl.setAttribute("aria-label", label);
    knopEl.innerHTML = '<span aria-hidden="true">' + teken + "</span>";
    knopEl.addEventListener("click", function () { wijzigActiviteit(id, stap); });
    return knopEl;
  }

  // One price line with its stepper. metNaam: show the line's own name (a
  // single unnamed tariff is priced under the activity's name above it).
  function regelRij(lijn, metNaam) {
    var rij = maak("li", "act-regel");

    var tekst = maak("div", "act-regel__tekst");
    if (metNaam) tekst.appendChild(maak("p", "act-regel__naam", lijn.naam));
    if (lijn.detail) tekst.appendChild(maak("p", "act-regel__detail", lijn.detail));
    rij.appendChild(tekst);

    var prijs = maak("p", "act-regel__prijs");
    prijs.appendChild(maak("span", "act-regel__bedrag", ACT.euro(ACT.centen(lijn))));
    prijs.appendChild(maak("span", "act-regel__eenheid", ACT.eenheidTekst(lijn.eenheid)));
    var samen = maak("span", "act-regel__samen");
    samen.hidden = true;
    prijs.appendChild(samen);
    rij.appendChild(prijs);

    var stepper = maak("div", "act-stepper");
    stepper.setAttribute("role", "group");
    stepper.setAttribute("aria-label", lijn.titel + ", " + ACT.eenheidTekst(lijn.eenheid));
    var min = maakStepKnop("&minus;", T.fewerOf(lijn.titel), lijn.id, -1);
    var waarde = maak("span", "act-stepper__waarde", "0");
    waarde.setAttribute("aria-live", "polite");
    var plus = maakStepKnop("+", T.moreOf(lijn.titel), lijn.id, 1);
    stepper.appendChild(min);
    stepper.appendChild(waarde);
    stepper.appendChild(plus);
    rij.appendChild(stepper);

    activiteiten.velden[lijn.id] = { rij: rij, min: min, plus: plus, waarde: waarde, samen: samen };
    return rij;
  }

  function toggleHuur(id) {
    activiteiten.open[id] = !activiteiten.open[id];
    tekenActiviteiten();
  }

  // The lowest price of an activity's own lines (its tariffs, or its rentals
  // when it has none, i.e. a free activity), for the "vanaf €…" hint on its
  // checkbox. "" when there is nothing priced (should not happen).
  function vanafPrijs(act) {
    var lijnen = ((act.tarieven && act.tarieven.length) ? act.tarieven : (act.huur || []))
      .map(function (regel) { return activiteiten.regels[regel.id]; }).filter(Boolean);
    if (!lijnen.length) return "";
    var laagste = Math.min.apply(null, lijnen.map(ACT.centen));
    return T.from(ACT.euro(laagste));
  }

  // One activity's own choices: its tariffs, the "gratis" note and the
  // rental button/panel. Hidden until the activity's own checkbox is ticked.
  function actInhoud(act) {
    var inhoud = maak("div", "act-item__inhoud");
    inhoud.hidden = true;

    var eigen = (act.tarieven || []).map(function (t) { return activiteiten.regels[t.id]; }).filter(Boolean);
    if (eigen.length) {
      var lijstEigen = maak("ul", "act-item__regels");
      eigen.forEach(function (lijn) {
        // A single unnamed tariff has no line name of its own: the activity's
        // name above it is enough.
        var metNaam = eigen.length > 1 || lijn.naam !== act.naam;
        lijstEigen.appendChild(regelRij(lijn, metNaam));
      });
      inhoud.appendChild(lijstEigen);
    } else {
      // Free activity: the rentals below it set the number of persons.
      var aantal = maak("p", "act-item__aantal");
      aantal.hidden = true;
      inhoud.appendChild(aantal);
      activiteiten.aantalEls[act.id] = aantal;
    }
    if (act.gratis) inhoud.appendChild(maak("p", "act-item__gratis", act.gratis));

    var huur = (act.huur || []).map(function (h) { return activiteiten.regels[h.id]; }).filter(Boolean);
    if (huur.length) {
      var paneelId = "huur-" + act.id;
      var knop = maak("button", "act-item__huurknop", T.rentGear);
      knop.type = "button";
      knop.setAttribute("aria-controls", paneelId);
      knop.setAttribute("aria-expanded", "false");
      var paneel = maak("div", "act-item__huur");
      paneel.id = paneelId;
      paneel.hidden = true;
      var lijstHuur = maak("ul", "act-item__regels");
      huur.forEach(function (lijn) { lijstHuur.appendChild(regelRij(lijn, true)); });
      paneel.appendChild(lijstHuur);
      knop.addEventListener("click", function () { toggleHuur(act.id); });
      inhoud.appendChild(knop);
      inhoud.appendChild(paneel);
      activiteiten.huur[act.id] = { knop: knop, paneel: paneel };
    }
    return inhoud;
  }

  // The list: one item per activity, in the order of the JSON. Each starts
  // as a single checkbox (name, detail, "vanaf €…"); ticking it reveals that
  // activity's own choices (age tariffs, rentals) below it.
  function tekenLijst() {
    actLijst.textContent = "";
    activiteiten.acts.forEach(function (act) {
      var item = maak("li", "act-item");

      var vinkje = maak("label", "extra act-item__vinkje");
      var check = maak("input");
      check.type = "checkbox";
      check.className = "extra__check";
      var naam = maak("span", "extra__name", act.naam);
      if (act.detail) naam.appendChild(maak("span", "extra__hint", act.detail));
      vinkje.appendChild(check);
      vinkje.appendChild(naam);
      var prijs = vanafPrijs(act);
      if (prijs) vinkje.appendChild(maak("span", "extra__price", prijs));
      check.addEventListener("change", function () { wijzigActAan(act.id, check.checked); });
      item.appendChild(vinkje);
      activiteiten.vinkjes[act.id] = { checkbox: check, inhoud: null };

      var inhoud = actInhoud(act);
      activiteiten.vinkjes[act.id].inhoud = inhoud;
      item.appendChild(inhoud);

      actLijst.appendChild(item);
    });
  }

  // Ticking an activity's own checkbox off clears every line it chose (so
  // nothing stays charged while hidden) and closes its rental panel; ticking
  // it on just reveals its choices, still all at 0 until the visitor picks a
  // quantity.
  function wijzigActAan(id, aan) {
    activiteiten.actAan[id] = aan;
    if (!aan) {
      var act = activiteiten.acts.filter(function (a) { return a.id === id; })[0];
      var nieuw = kopieKeuze(activiteiten.keuze);
      (act ? (act.tarieven || []).concat(act.huur || []) : []).forEach(function (lijn) { delete nieuw[lijn.id]; });
      activiteiten.keuze = actBereken(nieuw) ? nieuw : {};
      activiteiten.open[id] = false;
    }
    tekenActiviteiten();
  }

  // The choice that counts: every line at a quantity above 0 (an unticked
  // activity has none, see wijzigActAan).
  function geldendeKeuze() {
    return kopieKeuze(activiteiten.keuze);
  }

  // Keep the choice in the address, so a reload shows the same choice.
  function bewaarInAdres() {
    if (!window.history || !window.history.replaceState) return;
    var zoek = new URLSearchParams(window.location.search);
    var tekst = ACT.naarQuery(geldendeKeuze());
    if (tekst) zoek.set("act", tekst);
    else zoek.delete("act");
    var query = zoek.toString().replace(/%3A/gi, ":").replace(/%2C/gi, ",");
    try {
      window.history.replaceState(window.history.state, "", window.location.pathname + (query ? "?" + query : "") + window.location.hash);
    } catch (fout) { /* the choice still counts, it just is not in the address */ }
  }

  function tekenActiviteiten() {
    if (!actBereken(activiteiten.keuze)) { // should not happen: every change is checked first
      activiteiten.keuze = {};
    }
    var uitkomst = actBereken(geldendeKeuze()) || { regels: [], totaalCenten: 0 };
    activiteiten.uitkomst = uitkomst;

    Object.keys(activiteiten.vinkjes).forEach(function (id) {
      var vinkje = activiteiten.vinkjes[id];
      var aan = Boolean(activiteiten.actAan[id]);
      if (vinkje.checkbox.checked !== aan) vinkje.checkbox.checked = aan;
      vinkje.inhoud.hidden = !aan;
    });

    Object.keys(activiteiten.velden).forEach(function (id) {
      var veld = activiteiten.velden[id];
      var aantal = activiteiten.keuze[id] || 0;
      veld.waarde.textContent = String(aantal);
      veld.min.setAttribute("aria-disabled", stapKeuze(id, -1) ? "false" : "true");
      veld.plus.setAttribute("aria-disabled", stapKeuze(id, 1) ? "false" : "true");
      veld.rij.classList.toggle("is-gekozen", aantal > 0);
      veld.samen.hidden = true;
    });

    // Free activities show the number of persons their rentals set.
    Object.keys(activiteiten.aantalEls).forEach(function (id) {
      var el = activiteiten.aantalEls[id];
      var act = activiteiten.acts.filter(function (a) { return a.id === id; })[0];
      var personen = act ? ACT.huurPersonen(act, activiteiten.keuze) : 0;
      el.textContent = T.personsCount(personen);
      el.hidden = !personen;
    });

    Object.keys(activiteiten.huur).forEach(function (id) {
      var open = Boolean(activiteiten.open[id]);
      activiteiten.huur[id].knop.setAttribute("aria-expanded", open ? "true" : "false");
      activiteiten.huur[id].paneel.hidden = !open;
    });

    // Summary: trip, activities and every chosen line, then the total.
    actOverzicht.textContent = "";
    var gekozen = (uitkomst.regels || []).filter(function (regel) { return regel.aantal > 0; });
    gekozen.forEach(function (regel) {
      var veld = activiteiten.velden[regel.id];
      if (veld) {
        veld.samen.textContent = T.together(ACT.euro(regel.centen));
        veld.samen.hidden = false;
      }
    });
    var actCent = Math.round(uitkomst.totaalCenten) || 0;
    if (actCent > 0) {
      var regels = [[T.tripPrice, euro(bedragCent), ""], [T.activities, ACT.euro(actCent), "activiteiten__subtotaal"]];
      gekozen.forEach(function (regel) {
        regels.push([regel.aantal + " × " + (regel.huur ? T.rentPrefix : "") + regel.titel, ACT.euro(regel.centen), "activiteiten__detailregel"]);
      });
      regels.forEach(function (regel) {
        actOverzicht.appendChild(maak("dt", regel[2], regel[0]));
        actOverzicht.appendChild(maak("dd", regel[2], regel[1]));
      });
    }
    actOverzicht.hidden = actCent <= 0;

    omschrijvingEl.textContent = T.total;
    bedragEl.textContent = euro(bedragCent + actCent);
    bewaarInAdres();
  }

  function wijzigActiviteit(id, stap) {
    var nieuw = stapKeuze(id, stap);
    if (!nieuw) return;
    activiteiten.keuze = nieuw;
    tekenActiviteiten();
  }

  // ?act= from the address: unknown ids and quantities that do not fit are
  // dropped without a message.
  function keuzeUitAdres() {
    var ruw = params.get("act");
    if (!ruw) return {};
    var gelezen = ACT.uitQuery(ruw) || {};
    var voor = {};
    Object.keys(gelezen).forEach(function (id) {
      if (Object.prototype.hasOwnProperty.call(activiteiten.regels, id) && gelezen[id] > 0) voor[id] = gelezen[id];
    });
    var nieuw = ACT.aanvullen(activiteiten.cat, activiteiten.soort, voor, activiteiten.ctx);
    return actBereken(nieuw) ? kopieKeuze(nieuw) : {};
  }

  /* Called once the trip price is known. soort: "falun", "wellness" or a
     group trip key; ctx: { personen, dagen } of the trip; reisTekst: Falun's description,
     shown above the block because the total now carries the label "Totaal". */
  function startActiviteiten(soort, ctx, reisTekst) {
    if (!actCatalogus || soort !== actSoort) return;
    if (!(ctx.personen >= 1) || !(ctx.dagen >= 1)) return;
    actCatalogus.then(function (cat) {
      if (!cat || !(bedragCent > 0)) return;
      var totaal = bedragEl.parentNode;
      var wasLos = totaal.classList.contains("booking__total--standalone");
      var labelVoor = omschrijvingEl.textContent;
      var reisRegel = null;
      try {
        var acts = ACT.activiteiten(cat, soort) || [];
        if (!acts.length) return;

        activiteiten = {
          cat: cat, soort: soort, ctx: ctx, acts: acts, regels: {}, velden: {}, huur: {}, vinkjes: {},
          aantalEls: {}, open: {}, actAan: {}, keuze: {}, uitkomst: null
        };
        (ACT.lijnen(cat, soort) || []).forEach(function (lijn) { activiteiten.regels[lijn.id] = lijn; });
        if (!actBereken({})) throw new Error("catalogus");
        tekenLijst();
        activiteiten.keuze = keuzeUitAdres();
        // A choice from ?act= opens its rentals and its own card (actAan),
        // so the choice is visible.
        acts.forEach(function (act) {
          var gehuurd = (act.huur || []).some(function (h) { return activiteiten.keuze[h.id] > 0; });
          if (gehuurd) activiteiten.open[act.id] = true;
          var gekozenAct = (act.tarieven || []).concat(act.huur || []).some(function (l) { return activiteiten.keuze[l.id] > 0; });
          if (gekozenAct) activiteiten.actAan[act.id] = true;
        });

        if (reisTekst) {
          reisRegel = maak("p", "activiteiten__reis", reisTekst);
          actBlok.parentNode.insertBefore(reisRegel, actBlok);
        }
        totaal.classList.remove("booking__total--standalone");
        actBlok.hidden = false;
        tekenActiviteiten();
      } catch (fout) {
        // A broken catalogue only hides this optional block; the trip itself
        // can still be paid exactly as before.
        activiteiten = null;
        actBlok.hidden = true;
        actLijst.textContent = "";
        actOverzicht.hidden = true;
        if (reisRegel) reisRegel.parentNode.removeChild(reisRegel);
        totaal.classList.toggle("booking__total--standalone", wasLos);
        omschrijvingEl.textContent = labelVoor;
        bedragEl.textContent = euro(bedragCent);
      }
    });
  }

  /* The description of a Falun booking in a language folder. The server's
     own description is Dutch ("Schaatsreis Falun, 4 dagen vanaf ..."); this
     says the same in the page language, from the validated choice and the
     amounts in the server's answer. Display only: Stripe keeps the Dutch
     one. */
  function falunOmschrijving(data) {
    function prijs(n) { return typeof n === "number" && isFinite(n) && n > 0 ? "€" + getal(n) : ""; }
    var personen = typeof data.personen === "number" ? data.personen : parseInt(falunKeuze.personen, 10);
    var tekst = T.falunDescription ? T.falunDescription({
      dagen: parseInt(falunKeuze.dagen, 10),
      datum: datumTekst(falunKeuze.aankomst),
      personen: personen,
      kinderen: typeof data.kinderen === "number" ? data.kinderen : parseInt(falunKeuze.kinderen, 10) || 0,
      baby: typeof data.baby === "number" ? data.baby : parseInt(falunKeuze.baby, 10) || 0,
      eigenVlucht: falunKeuze.vlucht === "zelf",
      eigenVervoer: falunKeuze.auto === "zelf",
      eigenVerzekering: falunKeuze.verzekering === "ja" && falunKeuze.auto !== "zelf",
      begeleiding: parseInt(falunKeuze.begeleiding, 10) || 0,
      perPersoon: prijs(data.perPersoon),
      perKind: prijs(data.perKind),
      perBaby: prijs(data.perBaby)
    }) : "";
    return tekst || reisTekst;
  }

  if (falunKeuze) {
    reisNaamEl.textContent = reis;
    omschrijvingEl.textContent = reis;
    bedragEl.textContent = "...";

    // The Falun calendar always sends a head count; a link without a valid
    // one cannot be paid (the travel details step needs that number).
    var falunPersonen = alsAantalTekst(falunKeuze.personen);
    var falunBegeleiding = alsAantalTekst(falunKeuze.begeleiding);
    var falunKinderen = falunPersonen ? leesKinderen(falunKeuze, parseInt(falunPersonen, 10)) : null;
    var falunGeldig = Boolean(falunPersonen) && falunBegeleiding !== null && Boolean(datumTekst(falunKeuze.aankomst)) && Boolean(falunKinderen);
    if (falunGeldig) {
      falunKeuze.personen = falunPersonen;
      falunKeuze.begeleiding = falunBegeleiding;
      // What is shown is exactly what create-payment receives.
      falunKeuze.kinderen = falunKinderen.kinderen ? String(falunKinderen.kinderen) : "";
      falunKeuze.baby = falunKinderen.baby ? String(falunKinderen.baby) : "";
    }

    // De standaardtekst gaat over een betaallink van Joey; hier heeft de
    // bezoeker zijn reis zelf in de kalender samengesteld.
    var introEl = document.querySelector(".booking__intro");
    if (introEl) {
      introEl.textContent = T.introCalendar;
    }

    if (!falunGeldig) {
      toonReisFout(FALUN_INFO, "");
    } else {
      fetch("/api/falun-prijs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(falunKeuze)
      })
        .then(function (respons) {
          return respons.json().catch(function () { return {}; }).then(function (data) {
            return { ok: respons.ok, data: data || {} };
          });
        })
        .then(function (resultaat) {
          var data = resultaat.data;
          if (!resultaat.ok || typeof data.bedrag !== "number" || !isFinite(data.bedrag) || data.bedrag <= 0) {
            var fout = new Error("quote");
            fout.detail = typeof data.error === "string" ? data.error : "";
            throw fout;
          }
          bedragCent = Math.round(data.bedrag * 100);
          var falunTekst = VERTAALD ? falunOmschrijving(data) : (data.omschrijving || reis);
          omschrijvingEl.textContent = falunTekst;
          bedragEl.textContent = euro(bedragCent);
          startActiviteiten("falun", {
            personen: parseInt(falunKeuze.personen, 10),
            dagen: parseInt(falunKeuze.dagen, 10)
          }, falunTekst);
        })
        .catch(function (fout) {
          // Same message as the other calendar trips: back to the calendar,
          // not "ask Joey for a new link" (there is no link from Joey here).
          toonReisFout(FALUN_INFO, (fout && fout.detail) || "");
        });
    }
  } else if (reisKeuze) {
    var info = KALENDER_REIZEN[reisKeuze.reis];
    reisNaamEl.textContent = info.naam;
    omschrijvingEl.textContent = T.total;
    bedragEl.textContent = "...";

    var introTekst = document.querySelector(".booking__intro");
    if (introTekst) {
      introTekst.textContent = T.introCalendar;
    }

    var personenTekst = alsAantalTekst(reisKeuze.personen);
    var begeleidingTekst = alsAantalTekst(reisKeuze.begeleiding);
    var personenAantal = personenTekst ? parseInt(personenTekst, 10) : 0;
    var begeleidingDagen = begeleidingTekst ? parseInt(begeleidingTekst, 10) : 0;
    var kinderenKeuze = personenAantal >= 1 ? leesKinderen(reisKeuze, personenAantal) : null;
    // What is shown is exactly what create-payment receives.
    reisKeuze.personen = personenTekst || "";
    reisKeuze.begeleiding = begeleidingDagen > 0 ? String(begeleidingDagen) : "";
    reisKeuze.kinderen = kinderenKeuze && kinderenKeuze.kinderen ? String(kinderenKeuze.kinderen) : "";
    reisKeuze.baby = kinderenKeuze && kinderenKeuze.baby ? String(kinderenKeuze.baby) : "";

    if (!datumTekst(reisKeuze.van) || !datumTekst(reisKeuze.tot) || !(personenAantal >= 1) || begeleidingTekst === null || !kinderenKeuze) {
      toonReisFout(info, "");
    } else {
      var vraag = new URLSearchParams({
        reis: reisKeuze.reis,
        van: reisKeuze.van,
        tot: reisKeuze.tot,
        personen: String(personenAantal)
      });
      if (reisKeuze.kinderen) vraag.set("kinderen", reisKeuze.kinderen);
      if (reisKeuze.baby) vraag.set("baby", reisKeuze.baby);
      if (begeleidingDagen > 0) vraag.set("begeleiding", String(begeleidingDagen));
      if (reisKeuze.vlucht) vraag.set("vlucht", "zelf");
      if (reisKeuze.auto) vraag.set("auto", "zelf");
      if (reisKeuze.materiaal) vraag.set("materiaal", "ja");

      fetch("/api/reis-prijs?" + vraag.toString())
        .then(function (respons) {
          return respons.json().then(function (data) {
            return { ok: respons.ok, data: data || {} };
          });
        })
        .then(function (resultaat) {
          var data = resultaat.data;
          if (!resultaat.ok || data.fout || typeof data.bedrag !== "number" || !isFinite(data.bedrag) || data.bedrag <= 0) {
            var fout = new Error("quote");
            fout.detail = typeof data.fout === "string" ? data.fout : "";
            throw fout;
          }
          bedragCent = Math.round(data.bedrag * 100);

          var regels = [
            [T.lineTrip, info.naam],
            [T.lineArrival, datumTekst(reisKeuze.van)],
            [T.lineDeparture, datumTekst(reisKeuze.tot)]
          ];
          // Trip length in days (arrival and departure day both count).
          if (typeof data.nachten === "number" && data.nachten > 0) {
            regels.push([T.lineDays, String(data.nachten + 1)]);
          }
          regels.push([T.linePersons, String(personenAantal)]);
          // With children or babies: how many of each, and the price per person
          // of every category (the server's answer).
          if (kinderenKeuze.kinderen + kinderenKeuze.baby > 0) {
            var cat = function (n, tekst) { return n > 0 ? [[tekst, String(n)]] : []; };
            regels = regels.concat(
              cat(personenAantal - kinderenKeuze.kinderen - kinderenKeuze.baby, T.lineAdults),
              cat(kinderenKeuze.kinderen, T.lineChildren),
              cat(kinderenKeuze.baby, T.lineBabies)
            );
          }
          if (begeleidingDagen > 0) {
            var begeleidingBedrag = typeof data.begeleidingBedrag === "number" && isFinite(data.begeleidingBedrag) && data.begeleidingBedrag > 0
              ? " (" + euro(Math.round(data.begeleidingBedrag * 100)) + ")" : "";
            regels.push([T.lineGuiding, T.days(begeleidingDagen) + begeleidingBedrag]);
          }
          // Own flight, as the server confirmed it (same line as in the
          // calendar), with the amount per person that came off.
          if (data.eigenVlucht === true) {
            var vluchtAftrek = typeof data.vluchtAftrek === "number" && isFinite(data.vluchtAftrek) && data.vluchtAftrek > 0
              ? T.minusPerPerson(euro(Math.round(data.vluchtAftrek * 100))) : T.yes;
            regels.push([T.lineFlight, vluchtAftrek]);
          }
          // Own transport, as the server confirmed it, with the amount per
          // person that came off (one car's price per day, shared by the group).
          if (data.eigenAuto === true) {
            var autoAftrek = typeof data.autoAftrek === "number" && isFinite(data.autoAftrek) && data.autoAftrek > 0
              ? T.minusPerPerson(euro(Math.round(data.autoAftrek * 100))) : T.yes;
            regels.push([T.lineCar, autoAftrek]);
          }
          // Gear rental (Finland), as the server confirmed it, with the
          // group amount that came on top.
          if (data.materiaalGehuurd === true) {
            var materiaalBedrag = typeof data.materiaalBedrag === "number" && isFinite(data.materiaalBedrag) && data.materiaalBedrag > 0
              ? " (" + euro(Math.round(data.materiaalBedrag * 100)) + ")" : "";
            regels.push([T.lineGear, T.yes + materiaalBedrag]);
          }
          if (typeof data.perPersoon === "number" && isFinite(data.perPersoon) && data.perPersoon > 0) {
            var metKinderen = kinderenKeuze.kinderen + kinderenKeuze.baby > 0;
            regels.push([metKinderen ? T.perAdult : T.perPerson, euro(Math.round(data.perPersoon * 100))]);
            if (kinderenKeuze.kinderen > 0 && typeof data.perKind === "number" && isFinite(data.perKind)) {
              regels.push([T.perChild, euro(Math.round(data.perKind * 100))]);
            }
            if (kinderenKeuze.baby > 0 && typeof data.perBaby === "number" && isFinite(data.perBaby)) {
              regels.push([T.perBaby, euro(Math.round(data.perBaby * 100))]);
            }
          }
          toonReisRegels(regels);

          bedragEl.textContent = euro(bedragCent);
          if (reisKeuze.reis === "wellness" || reisKeuze.reis === "orsa") {
            startActiviteiten(reisKeuze.reis, {
              personen: personenAantal,
              dagen: typeof data.dagen === "number" && isFinite(data.dagen) ? data.dagen : 0
            }, "");
          }
        })
        .catch(function (fout) {
          toonReisFout(info, (fout && fout.detail) || "");
        });
    }
  } else if (groepKeuze) {
    reisNaamEl.textContent = T.groupTrip;
    omschrijvingEl.textContent = T.total;
    bedragEl.textContent = "...";
    // The travel details need the arrival day, which comes with the price:
    // the form appears together with the price (see below).
    gegevensForm.hidden = true;

    var groepIntro = document.querySelector(".booking__intro");
    if (groepIntro) {
      groepIntro.textContent = T.introGroup;
    }

    // Digits only (the server checks the rest: even, 2 to 20, the trip).
    var groepPersonenTekst = params.get("personen") || "";
    var groepPersonen = /^\d{1,3}$/.test(groepPersonenTekst) ? parseInt(groepPersonenTekst, 10) : 0;
    if (!(groepPersonen >= 1)) {
      toonGroepsreisFout("", "", true);
      return;
    }

    fetch("/api/groepsreis-prijs?" + new URLSearchParams({ reis: groepKeuze.reis, personen: String(groepPersonen) }).toString())
      .then(function (respons) {
        return respons.json().catch(function () { return {}; }).then(function (data) {
          return { ok: respons.ok, data: data || {} };
        });
      })
      .then(function (resultaat) {
        var data = resultaat.data;
        function getal(waarde) { return typeof waarde === "number" && isFinite(waarde) && waarde > 0; }
        // Every value that is shown must be there, so the page never shows
        // NaN, undefined or an empty line.
        var geldig = resultaat.ok && data.ok === true && data.reis === groepKeuze.reis &&
          data.personen === groepPersonen && getal(data.totaalCenten) && getal(data.perPersoonEur) &&
          getal(data.dagen) && typeof data.naam === "string" && data.naam.trim() !== "" &&
          datumTekst(data.van) !== "" && datumTekst(data.tot) !== "";
        if (!geldig) {
          var fout = new Error("quote");
          fout.detail = typeof data.fout === "string" ? data.fout : "";
          fout.code = typeof data.code === "string" ? data.code : "";
          throw fout;
        }
        bedragCent = Math.round(data.totaalCenten);
        groepKeuze.personen = groepPersonen;
        groepKeuze.van = data.van;

        // The server's name is Dutch ("Groepsreis Orsa"); a language folder
        // shows its own name for a known trip.
        var groepNaam = Object.prototype.hasOwnProperty.call(T.groupTripNames, groepKeuze.reis)
          ? T.groupTripNames[groepKeuze.reis] : data.naam;
        reisNaamEl.textContent = groepNaam;
        toonReisRegels([
          [T.lineTrip, groepNaam],
          [T.lineArrival, datumTekst(data.van)],
          [T.lineDeparture, datumTekst(data.tot)],
          [T.lineDays, String(data.dagen)],
          [T.linePersons, String(groepPersonen)],
          [T.perPerson, euro(Math.round(data.perPersoonEur * 100))]
        ]);
        bedragEl.textContent = euro(bedragCent);

        startReisgegevens();
        gegevensForm.hidden = false;

        // Optional activities (Falun's list), counted over activiteitenDagen.
        groepsreisActiviteitenDagen(groepKeuze.reis).then(function (dagen) {
          if (dagen >= 1) startActiviteiten(groepKeuze.reis, { personen: groepPersonen, dagen: dagen }, "");
        });
      })
      .catch(function (fout) {
        toonGroepsreisFout((fout && fout.detail) || "", (fout && fout.code) || "", false);
      });
  } else {
    if (!bedragCent || bedragCent < 100) {
      toonNiets();
      return;
    }

    reisNaamEl.textContent = reisTekst;
    omschrijvingEl.textContent = reisTekst;
    bedragEl.textContent = euro(bedragCent);
  }

  /* ---- Step 2 (Reisgegevens), then straight to Stripe ---------------- */
  var stapGegevensEl = document.getElementById("stapGegevens");
  var reisgegevens = null; // set once the details form is valid

  // Head count from the booking; a payment link from Joey has none.
  var bekendePersonen = parseInt((falunKeuze || reisKeuze || {}).personen, 10) || 0;
  var bekendeKeuze = falunKeuze || reisKeuze || {};
  // The arrival day: ages count on this day (children 2-11, babies 0-1).
  var uitreisdatum = falunKeuze ? falunKeuze.aankomst : (reisKeuze ? reisKeuze.van : "");

  function naReisgegevens(gegevens) {
    reisgegevens = gegevens;
    foutEl.hidden = true;
    gaNaarBetalen();
  }

  /* The details step. A group trip starts it once its price, and with it
     the arrival day, is known (see the groepKeuze branch above): adults
     only, no rental car. Every other trip starts it right away. */
  var reisgegevensStap = null;
  function startReisgegevens() {
    if (reisgegevensStap) return;
    reisgegevensStap = window.NovakseReisgegevens.init(groepKeuze ? {
      form: gegevensForm,
      personen: groepKeuze.personen,
      kinderen: 0,
      baby: 0,
      uitreisdatum: groepKeuze.van,
      metAuto: false,
      eigenVlucht: false,
      alleenVolwassenen: true,
      onKlaar: naReisgegevens
    } : {
      form: gegevensForm,
      personen: bekendePersonen,
      kinderen: parseInt(bekendeKeuze.kinderen, 10) || 0,
      baby: parseInt(bekendeKeuze.baby, 10) || 0,
      uitreisdatum: uitreisdatum || "",
      // Falun and the other calendar trips can all be booked with own
      // transport and/or an own flight.
      metAuto: !((falunKeuze && falunKeuze.auto === "zelf") || (reisKeuze && reisKeuze.auto === "zelf")),
      eigenVlucht: !!((falunKeuze && falunKeuze.vlucht === "zelf") || (reisKeuze && reisKeuze.vlucht === "zelf")),
      onKlaar: naReisgegevens
    });
  }
  if (!groepKeuze) startReisgegevens();

  /* ---- Payment choice: online (Stripe) or bank transfer ---------------
     Two radios in front of the pay button. Customers in sv/no/fi start on
     bank transfer: the online methods only work for a few countries. */
  var noteEl = document.getElementById("betaalNotitie");
  var methodeStart = (LANG === "sv" || LANG === "no" || LANG === "fi") ? "overschrijving" : "online";

  function maakMethode(waarde, titel, hint) {
    var label = document.createElement("label");
    label.className = "extra";
    var input = document.createElement("input");
    input.type = "radio";
    input.name = "betaalmethode";
    input.value = waarde;
    input.className = "extra__check";
    input.checked = waarde === methodeStart;
    input.addEventListener("change", werkKnopBij);
    var naam = document.createElement("span");
    naam.className = "extra__name";
    var kop = document.createElement("span");
    kop.textContent = titel;
    var uitleg = document.createElement("span");
    uitleg.className = "booking__note";
    uitleg.textContent = hint;
    naam.appendChild(kop);
    naam.appendChild(uitleg);
    label.appendChild(input);
    label.appendChild(naam);
    return label;
  }

  function gekozenMethode() {
    var gekozen = gegevensForm.querySelector('input[name="betaalmethode"]:checked');
    return gekozen && gekozen.value === "overschrijving" ? "overschrijving" : "online";
  }

  function knopTekst() {
    return gekozenMethode() === "overschrijving" ? T.transferBtn : T.payBtn;
  }

  function werkKnopBij() {
    if (!knop.disabled) knop.textContent = knopTekst();
    if (noteEl) noteEl.textContent = gekozenMethode() === "overschrijving" ? T.noteTransfer : T.noteOnline;
  }

  (function () {
    var veld = document.createElement("fieldset");
    veld.className = "booking__block";
    veld.id = "betaalmethodeBlok";
    var legende = document.createElement("legend");
    legende.className = "booking__legend";
    legende.textContent = T.methodLegend;
    var lijst = document.createElement("div");
    lijst.className = "booking__extras";
    lijst.appendChild(maakMethode("online", T.methodOnline, T.methodOnlineHint));
    lijst.appendChild(maakMethode("overschrijving", T.methodTransfer, T.methodTransferHint));
    veld.appendChild(legende);
    veld.appendChild(lijst);
    knop.parentNode.insertBefore(veld, knop);
    werkKnopBij();
  })();

  /* Bank transfer chosen: no Stripe. The server mailed Joey and the customer;
     here the customer sees the account details and the payment reference. */
  function toonOverschrijving(o) {
    var intro = document.querySelector(".booking__intro");
    if (intro) intro.hidden = true;
    if (stappen) stappen.hidden = true;
    inhoud.hidden = true;

    var titel = document.getElementById("checkoutTitel");
    if (titel) {
      titel.textContent = T.transferTitle;
      titel.setAttribute("tabindex", "-1");
    }

    var blok = document.createElement("section");
    blok.className = "booking__block";
    blok.id = "overschrijvingBlok";
    blok.style.maxWidth = "34rem"; // label and value stay close together on a wide screen
    if (titel) blok.setAttribute("aria-labelledby", "checkoutTitel");

    var uitleg = document.createElement("p");
    uitleg.className = "booking__intro";
    uitleg.textContent = T.transferIntro;
    blok.appendChild(uitleg);

    var lijst = document.createElement("dl");
    lijst.className = "booking__lines";
    [
      [T.transferAmount, euro(o.bedragCenten)],
      [T.transferHolder, o.naam],
      [T.transferIban, o.iban],
      [T.transferBic, o.bic],
      [T.transferRef, o.referentie]
    ].forEach(function (regel) {
      var dt = document.createElement("dt");
      dt.textContent = regel[0];
      var dd = document.createElement("dd");
      var sterk = document.createElement("strong");
      sterk.textContent = regel[1];
      dd.appendChild(sterk);
      lijst.appendChild(dt);
      lijst.appendChild(dd);
    });
    blok.appendChild(lijst);

    var refTekst = document.createElement("p");
    refTekst.className = "booking__note";
    refTekst.textContent = T.transferRefHint;
    blok.appendChild(refTekst);

    var mailTekst = document.createElement("p");
    mailTekst.className = "booking__note";
    // klantMailOvergeslagen: a payment link with a free amount, where the
    // server deliberately mails only Joey (see api/create-payment.js).
    mailTekst.textContent = o.klantMail ? T.transferMailed(o.email || "")
      : o.klantMailOvergeslagen ? T.transferNotMailed : T.transferMailFailed;
    blok.appendChild(mailTekst);

    inhoud.parentNode.insertBefore(blok, inhoud);
    if (titel) {
      titel.scrollIntoView({ block: "start" });
      titel.focus({ preventScroll: true });
    }
  }

  stapGegevensEl.classList.add("is-current");

  /* Back from Stripe with the browser's back button: the page may come out
     of the back/forward cache with the button still on "Bezig...". */
  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    knop.disabled = false;
    knop.textContent = knopTekst();
  });

  function gaNaarBetalen() {
    if (knop.disabled) return; // already on its way to Stripe

    foutEl.hidden = true;
    knop.disabled = true;
    knop.textContent = T.busy;
    var overschrijving = gekozenMethode() === "overschrijving";

    /* Bij Falun gaan de keuzes mee in plaats van een bedrag: de server rekent
       het daar opnieuw uit. De betaalmethode gaat alleen mee bij bankoverschrijving
       (betaalmethode: "overschrijving"); anders gaat het naar Stripe. */
    var lading = { bedrag: bedragCent, omschrijving: reis };
    if (falunKeuze) {
      lading = {
        reis: falunKeuze.reis,
        aankomst: falunKeuze.aankomst,
        dagen: falunKeuze.dagen,
        personen: falunKeuze.personen,
        kinderen: falunKeuze.kinderen,
        baby: falunKeuze.baby,
        vlucht: falunKeuze.vlucht,
        auto: falunKeuze.auto,
        verzekering: falunKeuze.verzekering,
        begeleiding: falunKeuze.begeleiding
      };
    } else if (reisKeuze) {
      lading = {
        reis: reisKeuze.reis,
        van: reisKeuze.van,
        tot: reisKeuze.tot,
        personen: reisKeuze.personen,
        kinderen: reisKeuze.kinderen,
        baby: reisKeuze.baby,
        begeleiding: reisKeuze.begeleiding,
        vlucht: reisKeuze.vlucht,
        auto: reisKeuze.auto,
        materiaal: reisKeuze.materiaal
      };
    } else if (groepKeuze) {
      // Only the trip and the head count: the server sets the amount.
      lading = {
        reis: groepKeuze.reis,
        personen: groepKeuze.personen
      };
    }
    lading.reisgegevens = reisgegevens;
    // A checkout in a language folder: Stripe sends the visitor back to the
    // page in that language, and Joey sees the language in Stripe.
    if (VERTAALD) lading.taal = LANG;

    /* Open the tab now, still inside the click, so the browser treats it as
       user-initiated. It gets its real address once the server responds. */
    // Bank transfer opens no payment tab.
    var betaalVenster = overschrijving ? null : window.open("", "_blank");

    /* Chosen activities go along as ids and quantities; the server prices
       them again. verwachtCenten is the total on screen, so the server can
       refuse (409) when its own total differs. With no activity ticked
       neither is sent: the request is the same as a trip without the block. */
    if (activiteiten && activiteiten.uitkomst && activiteiten.uitkomst.totaalCenten > 0) {
      lading.activiteiten = geldendeKeuze();
      lading.verwachtCenten = Math.round(bedragCent + (Math.round(activiteiten.uitkomst.totaalCenten) || 0));
    } else if ((falunKeuze || reisKeuze || groepKeuze) && bedragCent > 0) {
      // A calendar booking always sends the total on screen, so the server
      // refuses (409) when its own calculation differs.
      lading.verwachtCenten = Math.round(bedragCent);
    }

    if (overschrijving) lading.betaalmethode = "overschrijving";

    fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lading)
    })
      .then(function (respons) {
        return respons.json().catch(function () { return {}; }).then(function (data) {
          return { ok: respons.ok, status: respons.status, data: data || {} };
        });
      })
      .then(function (resultaat) {
        var data = resultaat.data || {};
        var melding = typeof data.error === "string" && data.error ? data.error
          : (typeof data.fout === "string" ? data.fout : "");
        if (resultaat.status === 409) {
          // The amount or the activities no longer match what the server
          // calculates: show its own message.
          var conflict = new Error(melding);
          conflict.conflict = true;
          throw conflict;
        }
        if (!resultaat.ok || !(overschrijving ? data.overschrijving : data.checkoutUrl)) {
          var serverFout = new Error(melding || T.somethingWrong);
          serverFout.server = true;
          throw serverFout;
        }
        if (overschrijving) {
          toonOverschrijving(data.overschrijving);
          return;
        }
        if (betaalVenster && !betaalVenster.closed) {
          betaalVenster.location.href = data.checkoutUrl;
        } else {
          // Popup blocked: fall back to the same tab.
          window.location.href = data.checkoutUrl;
        }
        knop.disabled = false;
        knop.textContent = knopTekst();
      })
      .catch(function (fout) {
        if (betaalVenster && !betaalVenster.closed) betaalVenster.close();
        foutEl.hidden = false;
        if (fout && fout.conflict) {
          // The server's message is Dutch: a language folder shows its own.
          foutEl.textContent = (!VERTAALD && fout.message) || T.priceChanged;
          knop.disabled = false;
          knop.textContent = knopTekst();
          return;
        }
        if (VERTAALD) {
          // No Dutch server message here: a general message when the
          // server refused, the connection message when it was not reached.
          foutEl.textContent = fout && fout.server ? T.payFailedServer(MAIL) : T.payFailed(T.noConnection, MAIL);
        } else {
          var reden = fout && fout.message && fout.message !== "Failed to fetch"
            ? fout.message.replace(/[.\s]+$/, "") : T.noConnection;
          foutEl.textContent = T.payFailed(reden, MAIL);
        }
        knop.disabled = false;
        knop.textContent = knopTekst();
      });
  }
})();
