/* ==========================================================================
   Reisgegevens: the step between booking and payment (uitchecken.html)

   Every trip pays through uitchecken.html, so this step lives here once and
   applies to all of them. It collects what Joey needs to book the flight and
   the rental car:
     - per traveller: first name(s) and last name as in the passport, date of
       birth, nationality and (with a rental car) an optional tick for
       whether they also drive
     - contact: e-mail address and phone number
     - rental car: the main driver (one of the travellers)
     - confirmations: the general terms (required), and when the trip
       includes a rental car the credit card and driving licence (optional,
       on the owner's request they do not block payment)

   Usage (from js/uitchecken.js):
     var stap = NovakseReisgegevens.init({
       form: element,       // #reisgegevensFormulier
       personen: 2,         // head count from the booking, or 0 if unknown
       metAuto: true,       // false when the traveller arranges own transport
       eigenVlucht: false,  // true when the traveller books their own flight
       kinderen: 1,         // of personen: children 2-11 (optional)
       baby: 0,             // of personen: babies 0-1 (optional)
       uitreisdatum: "2027-01-10", // arrival day; ages count on this day
       alleenVolwassenen: false, // true for a group trip: adults only, so
                            // the age message does not mention the calendar
       onKlaar: function (gegevens) {} // called after a valid submit
     });
     stap.gegevens()        // validated data, or null (shows the errors)

   The first traveller is always the "hoofdboeker" (main booker/contact), so
   their block also asks for contact e-mail, phone and address, next to the
   per-traveller details used for the flight. This gives Joey one clear
   contact point without asking the same person to fill in their own name
   twice.

   Ages. With a head count and an arrival day the travellers are listed as
   adults (12 and older) first, then children (2-11), then babies (0-1), as
   booked in the calendar. A date of birth must give that category on the
   arrival day, and at least one traveller (and the main driver) must be 21 or
   older. The server (api/create-payment.js) checks exactly the same, so a date
   of birth can never change the price on its own: a mismatch is refused and
   the visitor corrects the head count in the calendar.

   What is typed is kept in sessionStorage for this tab only, so a visitor who
   cancels at Stripe and comes back does not have to type it all again.

   Texts follow the page language (<html lang>): the checkout also lives in
   en/, de/, sv/, no/ and fi/. A text that is not translated falls back to
   the Dutch one; Dutch is exactly as before.
   ========================================================================== */
(function () {
  "use strict";

  var OPSLAG_SLEUTEL = "novakse-reisgegevens";
  var MAX_REIZIGERS = 20;
  var EMAIL_PATROON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function vandaagIso() {
    var nu = new Date();
    var maand = String(nu.getMonth() + 1).padStart(2, "0");
    var dag = String(nu.getDate()).padStart(2, "0");
    return nu.getFullYear() + "-" + maand + "-" + dag;
  }

  var MIN_LEEFTIJD_BESTUURDER = 21;

  // Whole years between a date of birth and a day (both "YYYY-MM-DD"); NaN
  // when either is not a real date. Same rule as api/_kinderprijs.js.
  function leeftijdOp(geboortedatum, dag) {
    var g = /^(\d{4})-(\d{2})-(\d{2})$/.exec(geboortedatum || "");
    var d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dag || "");
    if (!g || !d) return NaN;
    var jaren = +d[1] - +g[1];
    if (+d[2] < +g[2] || (+d[2] === +g[2] && +d[3] < +g[3])) jaren--;
    return jaren;
  }
  function categorieVoorLeeftijd(jaren) {
    if (!(jaren >= 0)) return "";
    if (jaren <= 1) return "baby";
    if (jaren <= 11) return "kind";
    return "volwassene";
  }

  var LANG = (document.documentElement.lang || "nl").slice(0, 2).toLowerCase();
  var I18N = {
    nl: {
      categories: {
        volwassene: { naam: "volwassene", leeftijd: "12 jaar of ouder" },
        kind: { naam: "kind", leeftijd: "2 t/m 11 jaar" },
        baby: { naam: "baby", leeftijd: "0 of 1 jaar" }
      },
      passportOnly: "Vul je naam precies zo in als in je paspoort.",
      noteCar: "Met deze gegevens boekt Joey je huurauto. Velden met een * zijn verplicht.",
      noteTrip: "Met deze gegevens boekt Joey je reis. Velden met een * zijn verplicht.",
      noteFlight: "Met deze gegevens boekt Joey je vlucht. Velden met een * zijn verplicht.",
      traveller: function (i) { return "Reiziger " + i; },
      mainBooker: "Hoofdboeker",
      firstNames: "Voornaam of voornamen (zoals in paspoort)",
      lastName: "Achternaam (zoals in paspoort)",
      birthDate: "Geboortedatum",
      nationality: "Nationaliteit",
      email: "E-mailadres",
      telefoon: "Telefoonnummer",
      straat: "Straat en huisnummer",
      postcode: "Postcode",
      plaats: "Plaats",
      land: "Land",
      chooseTraveller: "Kies een reiziger",
      travellerCanDrive: "Extra huurauto bestuurder",
      driverFee: "+ €13",
      errGroupAge: function (datum) {
        return "Deze groepsreis is alleen voor volwassenen: iedere reiziger moet op de dag van aankomst" +
          (datum ? " (" + datum + ")" : "") + " 12 jaar of ouder zijn. Controleer de geboortedatum.";
      },
      errCategory: function (soort, datum) {
        var tekst = this.categories[soort];
        return "Je boekte een " + tekst.naam + " (" + tekst.leeftijd + " op de dag van aankomst" +
          (datum ? ", " + datum : "") + "). Deze geboortedatum past daar niet bij. " +
          "Controleer de datum, of pas het aantal volwassenen, kinderen en baby's aan in de kalender.";
      },
      errDriverAge: function (min) { return "De hoofdbestuurder moet " + min + " jaar of ouder zijn op de dag van aankomst. Kies een andere reiziger."; },
      errTerms: "Ga akkoord met de algemene voorwaarden om verder te gaan.",
      errDriver: "Kies wie de hoofdbestuurder is.",
      errBirthMissing: "Vul de geboortedatum in.",
      errRequired: "Vul dit veld in.",
      errEmail: "Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.",
      errBirthPast: "Vul een geboortedatum in het verleden in.",
      errCount: function (max) { return "Kies 1 tot en met " + max + " reizigers."; },
      errCheck: "Controleer dit veld.",
      errMinAge: function (min, metAuto) {
        return "Minstens een reiziger moet " + min + " jaar of ouder zijn op de dag van aankomst" +
          (metAuto ? " (nodig voor de huurauto)" : "") + ". Controleer de geboortedata.";
      },
      errSummary: function (n) {
        return n === 1
          ? "Er is nog 1 veld dat niet klopt of ontbreekt. Kijk het even na."
          : "Er zijn nog " + n + " velden die niet kloppen of ontbreken. Kijk ze even na.";
      }
    },
    en: {
      categories: {
        volwassene: { naam: "adult", leeftijd: "12 years or older" },
        kind: { naam: "child", leeftijd: "2 to 11 years" },
        baby: { naam: "baby", leeftijd: "0 or 1 years" }
      },
      passportOnly: "Fill in your name exactly as it appears in your passport.",
      noteCar: "Joey uses these details to book your rental car. Fields marked * are required.",
      noteTrip: "Joey uses these details to book your trip. Fields marked * are required.",
      noteFlight: "Joey uses these details to book your flight. Fields marked * are required.",
      traveller: function (i) { return "Traveller " + i; },
      mainBooker: "Main booker",
      firstNames: "First name or names (as in passport)",
      lastName: "Last name (as in passport)",
      birthDate: "Date of birth",
      nationality: "Nationality",
      email: "Email address",
      telefoon: "Phone number",
      straat: "Street and house number",
      postcode: "Postcode",
      plaats: "City",
      land: "Country",
      chooseTraveller: "Choose a traveller",
      travellerCanDrive: "Extra rental car driver",
      driverFee: "+ €13",
      errGroupAge: function (datum) {
        return "This group trip is for adults only: every traveller must be 12 or older on the day of arrival" +
          (datum ? " (" + datum + ")" : "") + ". Check the date of birth.";
      },
      errCategory: function (soort, datum) {
        var tekst = this.categories[soort];
        return "You booked " + (soort === "volwassene" ? "an " : "a ") + tekst.naam + " (" + tekst.leeftijd + " on the day of arrival" +
          (datum ? ", " + datum : "") + "). This date of birth does not match. " +
          "Check the date, or change the number of adults, children and babies in the calendar.";
      },
      errDriverAge: function (min) { return "The main driver must be " + min + " or older on the day of arrival. Choose another traveller."; },
      errTerms: "Agree to the terms and conditions to continue.",
      errDriver: "Choose who the main driver is.",
      errBirthMissing: "Fill in the date of birth.",
      errRequired: "Fill in this field.",
      errEmail: "Fill in a valid email address, for example name@example.com.",
      errBirthPast: "Fill in a date of birth in the past.",
      errCount: function (max) { return "Choose 1 to " + max + " travellers."; },
      errCheck: "Check this field.",
      errMinAge: function (min, metAuto) {
        return "At least one traveller must be " + min + " or older on the day of arrival" +
          (metAuto ? " (needed for the rental car)" : "") + ". Check the dates of birth.";
      },
      errSummary: function (n) {
        return n === 1
          ? "There is still 1 field that is incorrect or missing. Please check it."
          : "There are still " + n + " fields that are incorrect or missing. Please check them.";
      }
    },
    de: {
      categories: {
        volwassene: { naam: "Erwachsene", leeftijd: "12 Jahre oder älter" },
        kind: { naam: "Kind", leeftijd: "2 bis 11 Jahre" },
        baby: { naam: "Baby", leeftijd: "0 oder 1 Jahr" }
      },
      passportOnly: "Gib deinen Namen genau so ein wie in deinem Reisepass.",
      noteCar: "Mit diesen Angaben bucht Joey deinen Mietwagen. Felder mit * sind Pflichtfelder.",
      noteTrip: "Mit diesen Angaben bucht Joey deine Reise. Felder mit * sind Pflichtfelder.",
      noteFlight: "Mit diesen Angaben bucht Joey deinen Flug. Felder mit * sind Pflichtfelder.",
      traveller: function (i) { return "Reisende Person " + i; },
      mainBooker: "Hauptansprechperson",
      firstNames: "Vorname oder Vornamen (wie im Reisepass)",
      lastName: "Nachname (wie im Reisepass)",
      birthDate: "Geburtsdatum",
      nationality: "Staatsangehörigkeit",
      email: "E-Mail-Adresse",
      telefoon: "Telefonnummer",
      straat: "Straße und Hausnummer",
      postcode: "Postleitzahl",
      plaats: "Ort",
      land: "Land",
      chooseTraveller: "Wähle eine reisende Person",
      travellerCanDrive: "Zusätzlicher Mietwagenfahrer",
      driverFee: "+ 13 €",
      errGroupAge: function (datum) {
        return "Diese Gruppenreise ist nur für Erwachsene: Alle Reisenden müssen am Anreisetag" +
          (datum ? " (" + datum + ")" : "") + " 12 Jahre oder älter sein. Prüfe das Geburtsdatum.";
      },
      errCategory: function (soort, datum) {
        var tekst = this.categories[soort];
        return "Gebucht als: " + tekst.naam + " (" + tekst.leeftijd + " am Anreisetag" +
          (datum ? ", " + datum : "") + "). Dieses Geburtsdatum passt nicht dazu. " +
          "Prüfe das Datum oder ändere die Anzahl der Erwachsenen, Kinder und Babys im Kalender.";
      },
      errDriverAge: function (min) { return "Der Hauptfahrer muss am Anreisetag " + min + " Jahre oder älter sein. Wähle eine andere reisende Person."; },
      errTerms: "Stimme den Allgemeinen Geschäftsbedingungen zu, um fortzufahren.",
      errDriver: "Wähle, wer der Hauptfahrer ist.",
      errBirthMissing: "Gib das Geburtsdatum ein.",
      errRequired: "Fülle dieses Feld aus.",
      errEmail: "Gib eine gültige E-Mail-Adresse ein, zum Beispiel name@beispiel.de.",
      errBirthPast: "Gib ein Geburtsdatum in der Vergangenheit ein.",
      errCount: function (max) { return "Wähle 1 bis " + max + " Reisende."; },
      errCheck: "Prüfe dieses Feld.",
      errMinAge: function (min, metAuto) {
        return "Mindestens eine reisende Person muss am Anreisetag " + min + " Jahre oder älter sein" +
          (metAuto ? " (nötig für den Mietwagen)" : "") + ". Prüfe die Geburtsdaten.";
      },
      errSummary: function (n) {
        return n === 1
          ? "1 Feld ist noch nicht richtig ausgefüllt oder fehlt. Bitte prüfe es."
          : n + " Felder sind noch nicht richtig ausgefüllt oder fehlen. Bitte prüfe sie.";
      }
    },
    sv: {
      categories: {
        volwassene: { naam: "vuxen", leeftijd: "12 år eller äldre" },
        kind: { naam: "barn", leeftijd: "2 till 11 år" },
        baby: { naam: "bebis", leeftijd: "0 eller 1 år" }
      },
      passportOnly: "Fyll i ditt namn exakt som i passet.",
      noteCar: "Med de här uppgifterna bokar Joey din hyrbil. Fält med * är obligatoriska.",
      noteTrip: "Med de här uppgifterna bokar Joey din resa. Fält med * är obligatoriska.",
      noteFlight: "Med de här uppgifterna bokar Joey ditt flyg. Fält med * är obligatoriska.",
      traveller: function (i) { return "Resenär " + i; },
      mainBooker: "Huvudkontakt",
      firstNames: "Förnamn (som i passet)",
      lastName: "Efternamn (som i passet)",
      birthDate: "Födelsedatum",
      nationality: "Nationalitet",
      email: "E-postadress",
      telefoon: "Telefonnummer",
      straat: "Gatuadress",
      postcode: "Postnummer",
      plaats: "Ort",
      land: "Land",
      chooseTraveller: "Välj en resenär",
      travellerCanDrive: "Extra hyrbilsförare",
      driverFee: "+ 13 €",
      errGroupAge: function (datum) {
        return "Den här gruppresan är bara för vuxna: alla resenärer måste vara 12 år eller äldre på ankomstdagen" +
          (datum ? " (" + datum + ")" : "") + ". Kontrollera födelsedatumet.";
      },
      errCategory: function (soort, datum) {
        var tekst = this.categories[soort];
        return "Du bokade den här resenären som " + tekst.naam + " (" + tekst.leeftijd + " på ankomstdagen" +
          (datum ? ", " + datum : "") + "). Det här födelsedatumet stämmer inte med det. " +
          "Kontrollera datumet, eller ändra antalet vuxna, barn och bebisar i kalendern.";
      },
      errDriverAge: function (min) { return "Huvudföraren måste vara " + min + " år eller äldre på ankomstdagen. Välj en annan resenär."; },
      errTerms: "Godkänn de allmänna villkoren för att gå vidare.",
      errDriver: "Välj vem som är huvudförare.",
      errBirthMissing: "Fyll i födelsedatumet.",
      errRequired: "Fyll i det här fältet.",
      errEmail: "Fyll i en giltig e-postadress, till exempel namn@exempel.se.",
      errBirthPast: "Fyll i ett födelsedatum som har passerat.",
      errCount: function (max) { return "Välj 1 till " + max + " resenärer."; },
      errCheck: "Kontrollera det här fältet.",
      errMinAge: function (min, metAuto) {
        return "Minst en resenär måste vara " + min + " år eller äldre på ankomstdagen" +
          (metAuto ? " (krävs för hyrbilen)" : "") + ". Kontrollera födelsedatumen.";
      },
      errSummary: function (n) {
        return n === 1
          ? "Det finns fortfarande 1 fält som är fel eller saknas. Kontrollera det."
          : "Det finns fortfarande " + n + " fält som är fel eller saknas. Kontrollera dem.";
      }
    },
    no: {
      categories: {
        volwassene: { naam: "voksen", leeftijd: "12 år eller eldre" },
        kind: { naam: "barn", leeftijd: "2 til 11 år" },
        baby: { naam: "baby", leeftijd: "0 eller 1 år" }
      },
      passportOnly: "Fyll inn navnet ditt nøyaktig slik det står i passet.",
      noteCar: "Med disse opplysningene bestiller Joey leiebilen din. Felt med * er obligatoriske.",
      noteTrip: "Med disse opplysningene bestiller Joey turen din. Felt med * er obligatoriske.",
      noteFlight: "Med disse opplysningene bestiller Joey flyet ditt. Felt med * er obligatoriske.",
      traveller: function (i) { return "Reisende " + i; },
      mainBooker: "Hovedkontakt",
      firstNames: "Fornavn (som i passet)",
      lastName: "Etternavn (som i passet)",
      birthDate: "Fødselsdato",
      nationality: "Nasjonalitet",
      email: "E-postadresse",
      telefoon: "Telefonnummer",
      straat: "Gateadresse",
      postcode: "Postnummer",
      plaats: "By",
      land: "Land",
      chooseTraveller: "Velg en reisende",
      travellerCanDrive: "Ekstra leiebilsjåfør",
      driverFee: "+ 13 €",
      errGroupAge: function (datum) {
        return "Denne gruppeturen er bare for voksne: alle reisende må være 12 år eller eldre på ankomstdagen" +
          (datum ? " (" + datum + ")" : "") + ". Kontroller fødselsdatoen.";
      },
      errCategory: function (soort, datum) {
        var tekst = this.categories[soort];
        return "Du bestilte denne reisende som " + tekst.naam + " (" + tekst.leeftijd + " på ankomstdagen" +
          (datum ? ", " + datum : "") + "). Denne fødselsdatoen passer ikke med det. " +
          "Kontroller datoen, eller endre antall voksne, barn og babyer i kalenderen.";
      },
      errDriverAge: function (min) { return "Hovedføreren må være " + min + " år eller eldre på ankomstdagen. Velg en annen reisende."; },
      errTerms: "Godta de generelle vilkårene for å gå videre.",
      errDriver: "Velg hvem som er hovedfører.",
      errBirthMissing: "Fyll inn fødselsdatoen.",
      errRequired: "Fyll inn dette feltet.",
      errEmail: "Fyll inn en gyldig e-postadresse, for eksempel navn@eksempel.no.",
      errBirthPast: "Fyll inn en fødselsdato som har vært.",
      errCount: function (max) { return "Velg 1 til " + max + " reisende."; },
      errCheck: "Kontroller dette feltet.",
      errMinAge: function (min, metAuto) {
        return "Minst én reisende må være " + min + " år eller eldre på ankomstdagen" +
          (metAuto ? " (nødvendig for leiebilen)" : "") + ". Kontroller fødselsdatoene.";
      },
      errSummary: function (n) {
        return n === 1
          ? "Det er fortsatt 1 felt som er feil eller mangler. Kontroller det."
          : "Det er fortsatt " + n + " felt som er feil eller mangler. Kontroller dem.";
      }
    },
    fi: {
      categories: {
        volwassene: { naam: "aikuinen", leeftijd: "vähintään 12-vuotias" },
        kind: { naam: "lapsi", leeftijd: "2-11-vuotias" },
        baby: { naam: "vauva", leeftijd: "0-1-vuotias" }
      },
      passportOnly: "Kirjoita nimesi täsmälleen niin kuin se on passissasi.",
      noteCar: "Näillä tiedoilla Joey varaa vuokra-autosi. Tähdellä * merkityt kentät ovat pakollisia.",
      noteTrip: "Näillä tiedoilla Joey varaa matkasi. Tähdellä * merkityt kentät ovat pakollisia.",
      noteFlight: "Näillä tiedoilla Joey varaa lentosi. Tähdellä * merkityt kentät ovat pakollisia.",
      traveller: function (i) { return "Matkustaja " + i; },
      mainBooker: "Yhteyshenkilö",
      firstNames: "Etunimi tai etunimet (kuten passissa)",
      lastName: "Sukunimi (kuten passissa)",
      birthDate: "Syntymäaika",
      nationality: "Kansalaisuus",
      email: "Sähköpostiosoite",
      telefoon: "Puhelinnumero",
      straat: "Katuosoite",
      postcode: "Postinumero",
      plaats: "Kaupunki",
      land: "Maa",
      chooseTraveller: "Valitse matkustaja",
      travellerCanDrive: "Ylimääräinen vuokra-auton kuljettaja",
      driverFee: "+ 13 €",
      errGroupAge: function (datum) {
        return "Tämä ryhmämatka on vain aikuisille: jokaisen matkustajan on oltava saapumispäivänä" +
          (datum ? " (" + datum + ")" : "") + " vähintään 12-vuotias. Tarkista syntymäaika.";
      },
      errCategory: function (soort, datum) {
        var tekst = this.categories[soort];
        return "Varattu: " + tekst.naam + " (" + tekst.leeftijd + " saapumispäivänä" +
          (datum ? ", " + datum : "") + "). Tämä syntymäaika ei sovi siihen. " +
          "Tarkista päivämäärä tai muuta aikuisten, lasten ja vauvojen määrää kalenterissa.";
      },
      errDriverAge: function (min) { return "Pääkuljettajan on oltava saapumispäivänä vähintään " + min + "-vuotias. Valitse toinen matkustaja."; },
      errTerms: "Hyväksy yleiset ehdot jatkaaksesi.",
      errDriver: "Valitse, kuka on pääkuljettaja.",
      errBirthMissing: "Anna syntymäaika.",
      errRequired: "Täytä tämä kenttä.",
      errEmail: "Anna kelvollinen sähköpostiosoite, esimerkiksi nimi@esimerkki.fi.",
      errBirthPast: "Anna menneisyydessä oleva syntymäaika.",
      errCount: function (max) { return "Valitse 1-" + max + " matkustajaa."; },
      errCheck: "Tarkista tämä kenttä.",
      errMinAge: function (min, metAuto) {
        return "Vähintään yhden matkustajan on oltava saapumispäivänä vähintään " + min + "-vuotias" +
          (metAuto ? " (vaaditaan vuokra-autoa varten)" : "") + ". Tarkista syntymäajat.";
      },
      errSummary: function (n) {
        return n === 1
          ? "1 kenttä on vielä virheellinen tai puuttuu. Tarkista se."
          : n + " kenttää on vielä virheellisiä tai puuttuu. Tarkista ne.";
      }
    }
  };
  var T = I18N[LANG] || I18N.nl;
  // A text that is not translated (yet) falls back to the Dutch one.
  Object.keys(I18N.nl).forEach(function (sleutel) {
    if (!(sleutel in T)) T[sleutel] = I18N.nl[sleutel];
  });
  var LOCALE = { nl: "nl-NL", en: "en-GB", de: "de-DE", sv: "sv-SE", no: "nb-NO", fi: "fi-FI" }[LANG] || "nl-NL";
  var CATEGORIE_TEKST = T.categories;

  function leesOpslag() {
    try {
      var tekst = window.sessionStorage.getItem(OPSLAG_SLEUTEL);
      return tekst ? JSON.parse(tekst) || {} : {};
    } catch (fout) {
      return {};
    }
  }

  function schrijfOpslag(waarde) {
    try {
      window.sessionStorage.setItem(OPSLAG_SLEUTEL, JSON.stringify(waarde));
    } catch (fout) {
      /* Private window or storage blocked: the form works without it. */
    }
  }

  function maakVeld(opties) {
    var veld = document.createElement("div");
    veld.className = "form-field";

    var label = document.createElement("label");
    label.setAttribute("for", opties.id);
    label.textContent = opties.label + " *";

    var input = document.createElement("input");
    input.type = opties.type || "text";
    input.id = opties.id;
    input.name = opties.id;
    input.required = true;
    if (opties.autocomplete) input.setAttribute("autocomplete", opties.autocomplete);
    if (opties.max) input.max = opties.max;
    if (opties.maxLength) input.maxLength = opties.maxLength;

    var fout = document.createElement("p");
    fout.className = "field-error";
    fout.id = opties.id + "Fout";
    fout.hidden = true;
    input.setAttribute("aria-describedby", fout.id);

    veld.appendChild(label);
    veld.appendChild(input);
    veld.appendChild(fout);
    return veld;
  }

  // Optional checkbox per traveller: do they also drive the rental car?
  // Not required, so it never blocks payment; independent of who is the
  // main driver (#hoofdbestuurder). One rental car seats up to 4, so a
  // group of 5 or more needs a second car and so a second free driver;
  // gratisAantal is 2 for those groups, 1 otherwise. Every traveller
  // beyond that free count shows the extra driver fee.
  function maakBestuurderVeld(i, gratisAantal) {
    var wrap = document.createElement("div");
    wrap.className = "booking__extras";
    var check = document.createElement("div");
    check.className = "checkout-check";
    var label = document.createElement("label");
    label.className = "extra";
    var input = document.createElement("input");
    input.type = "checkbox";
    input.className = "extra__check";
    input.id = "reiziger" + i + "Bestuurder";
    input.name = input.id;
    var span = document.createElement("span");
    span.className = "extra__name";
    span.textContent = T.travellerCanDrive;
    label.appendChild(input);
    label.appendChild(span);
    if (i > gratisAantal) {
      var prijs = document.createElement("span");
      prijs.className = "extra__price";
      prijs.textContent = T.driverFee;
      label.appendChild(prijs);
    }
    check.appendChild(label);
    wrap.appendChild(check);
    return wrap;
  }

  function init(opties) {
    var form = opties.form;
    var lijst = form.querySelector("#reizigersLijst");
    var aantalVeld = form.querySelector("#aantalVeld");
    var aantalInput = form.querySelector("#aantalReizigers");
    var autoBlok = form.querySelector("#autoBlok");
    var bestuurderSelect = form.querySelector("#hoofdbestuurder");
    var uitleg = form.querySelector("#reizigersUitleg");
    var foutSamenvatting = form.querySelector("#gegevensFout");
    var opgeslagen = leesOpslag();
    var metAuto = opties.metAuto !== false;
    var vastAantal = opties.personen >= 1 ? Math.min(opties.personen, MAX_REIZIGERS) : 0;
    var vandaag = vandaagIso();

    /* Ages are only checked for a booking with a known head count and
       arrival day (every calendar trip); a payment link from Joey has none. */
    var uitreisdatum = /^\d{4}-\d{2}-\d{2}$/.test(opties.uitreisdatum || "") ? opties.uitreisdatum : "";
    var aantalKinderen = Math.max(0, parseInt(opties.kinderen, 10) || 0);
    var aantalBaby = Math.max(0, parseInt(opties.baby, 10) || 0);
    var metLeeftijden = Boolean(vastAantal && uitreisdatum);
    var aantalVolwassenen = Math.max(0, vastAantal - aantalKinderen - aantalBaby);
    var uitreisTekst = "";
    if (uitreisdatum) {
      try {
        uitreisTekst = new Date(uitreisdatum + "T12:00:00Z").toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
      } catch (fout) { uitreisTekst = uitreisdatum; }
    }
    // Which category traveller i (1-based) was booked as.
    function geboektAls(i) {
      if (i <= aantalVolwassenen) return "volwassene";
      return i <= aantalVolwassenen + aantalKinderen ? "kind" : "baby";
    }

    if (opties.eigenVlucht && uitleg) {
      uitleg.textContent = T.passportOnly;
    }

    /* The line under the heading says what Joey books with these details.
       With an own flight (or own transport) that part is left out, so the
       page never says Joey books a flight the traveller arranges. */
    var kopNotitie = form.querySelector(".checkout-kop__note");
    if (kopNotitie && (opties.eigenVlucht || !metAuto)) {
      kopNotitie.textContent = opties.eigenVlucht ? (metAuto ? T.noteCar : T.noteTrip) : T.noteFlight;
    }

    /* Without a rental car the car block and its confirmations disappear;
       disabled fields are skipped by the browser and by the checks below. */
    if (!metAuto) {
      autoBlok.hidden = true;
      bestuurderSelect.disabled = true;
      form.querySelectorAll("[data-alleen-auto]").forEach(function (blok) {
        blok.hidden = true;
        blok.querySelectorAll("input").forEach(function (input) { input.disabled = true; });
      });
    }

    /* Head count: fixed when it came from the booking, otherwise asked here
       (a payment link from Joey carries only an amount). */
    if (vastAantal) {
      aantalVeld.hidden = true;
      aantalInput.disabled = true;
    } else {
      aantalVeld.hidden = false;
      var eerder = parseInt(opgeslagen.aantal, 10);
      if (eerder >= 1 && eerder <= MAX_REIZIGERS) aantalInput.value = String(eerder);
    }

    function aantal() {
      if (vastAantal) return vastAantal;
      var getal = parseInt(aantalInput.value, 10);
      if (!(getal >= 1)) return 1;
      return Math.min(getal, MAX_REIZIGERS);
    }

    // Values typed so far, keyed by field id, so re-rendering keeps them.
    var waarden = opgeslagen.velden || {};

    function bewaarReizigerInput(input) {
      waarden[input.id] = input.type === "checkbox" ? input.checked : input.value;
    }

    function renderReizigers() {
      form.querySelectorAll("#reizigersLijst input").forEach(bewaarReizigerInput);
      lijst.textContent = "";

      var totaalReizigers = aantal();
      var gratisBestuurders = totaalReizigers > 4 ? 2 : 1;
      for (var i = 1; i <= totaalReizigers; i++) {
        var blok = document.createElement("fieldset");
        blok.className = "checkout-reiziger";
        var legend = document.createElement("legend");
        legend.className = "booking__legend booking__legend--klein";
        legend.textContent = i === 1 ? T.mainBooker : T.traveller(i);
        if (metLeeftijden && aantalKinderen + aantalBaby > 0) {
          var soort = CATEGORIE_TEKST[geboektAls(i)];
          legend.textContent += " (" + soort.naam + ", " + soort.leeftijd + ")";
        }
        blok.appendChild(legend);

        var grid = document.createElement("div");
        grid.className = "form-grid";
        var veldLijst = [
          { id: "reiziger" + i + "Voornamen", label: T.firstNames, autocomplete: i === 1 ? "given-name" : "off", maxLength: 100 },
          { id: "reiziger" + i + "Achternaam", label: T.lastName, autocomplete: i === 1 ? "family-name" : "off", maxLength: 100 },
          { id: "reiziger" + i + "Geboortedatum", label: T.birthDate, type: "date", autocomplete: i === 1 ? "bday" : "off", max: vandaag },
          { id: "reiziger" + i + "Nationaliteit", label: T.nationality, autocomplete: "off", maxLength: 60 }
        ];
        // The first traveller is the hoofdboeker, so Joey's contact point
        // and address are collected here, next to their own name.
        if (i === 1) {
          veldLijst.push(
            { id: "contactEmail", label: T.email, type: "email", autocomplete: "email" },
            { id: "contactTelefoon", label: T.telefoon, type: "tel", autocomplete: "tel" },
            { id: "contactStraat", label: T.straat, autocomplete: "street-address" },
            { id: "contactPostcode", label: T.postcode, autocomplete: "postal-code" },
            { id: "contactPlaats", label: T.plaats, autocomplete: "address-level2" },
            { id: "contactLand", label: T.land, autocomplete: "country-name" }
          );
        }
        veldLijst.forEach(function (veldOpties) {
          var veld = maakVeld(veldOpties);
          var input = veld.querySelector("input");
          if (waarden[veldOpties.id]) input.value = waarden[veldOpties.id];
          if (metLeeftijden && veldOpties.type === "date") input.setAttribute("data-geboekt-als", geboektAls(i));
          grid.appendChild(veld);
        });
        blok.appendChild(grid);
        if (metAuto) {
          var bestuurderVeld = maakBestuurderVeld(i, gratisBestuurders);
          var bestuurderInput = bestuurderVeld.querySelector("input");
          if (waarden[bestuurderInput.id]) bestuurderInput.checked = true;
          blok.appendChild(bestuurderVeld);
        }
        lijst.appendChild(blok);
      }
      vulBestuurders();
    }

    function reizigerNaam(i) {
      var voor = form.querySelector("#reiziger" + i + "Voornamen");
      var achter = form.querySelector("#reiziger" + i + "Achternaam");
      var naam = ((voor ? voor.value : "") + " " + (achter ? achter.value : "")).trim();
      return naam || T.traveller(i);
    }

    // The main driver list follows the traveller names as they are typed.
    function vulKeuzeLijst(select, opgeslagenWaarde) {
      var gekozen = select.value || opgeslagenWaarde || "";
      select.textContent = "";
      var leeg = document.createElement("option");
      leeg.value = "";
      leeg.textContent = T.chooseTraveller;
      select.appendChild(leeg);
      for (var i = 1; i <= aantal(); i++) {
        var optie = document.createElement("option");
        optie.value = String(i);
        optie.textContent = reizigerNaam(i);
        select.appendChild(optie);
      }
      if (aantal() === 1) gekozen = "1";
      if (parseInt(gekozen, 10) <= aantal()) select.value = gekozen;
    }
    function vulBestuurders() {
      if (metAuto) vulKeuzeLijst(bestuurderSelect, opgeslagen.bestuurder);
    }

    function bewaar() {
      form.querySelectorAll("#reizigersLijst input").forEach(bewaarReizigerInput);
      schrijfOpslag({
        aantal: vastAantal ? "" : aantalInput.value,
        velden: waarden,
        bestuurder: metAuto ? bestuurderSelect.value : ""
      });
    }

    // The age on the arrival day of a date of birth field, or NaN.
    function leeftijdVan(input) {
      return leeftijdOp(input.value, uitreisdatum);
    }
    // Does this date of birth give the category it was booked as?
    function leeftijdKlopt(input) {
      var verwacht = input.getAttribute("data-geboekt-als");
      if (!verwacht || !input.value) return true;
      return categorieVoorLeeftijd(leeftijdVan(input)) === verwacht;
    }
    // The main driver must be old enough to rent the car.
    function bestuurderOudGenoeg() {
      if (!metLeeftijden || !metAuto) return true;
      var nr = parseInt(bestuurderSelect.value, 10);
      var veld = nr >= 1 ? form.querySelector("#reiziger" + nr + "Geboortedatum") : null;
      if (!veld || !veld.value) return true;
      return leeftijdVan(veld) >= MIN_LEEFTIJD_BESTUURDER;
    }

    function foutMelding(input) {
      var v = input.validity;
      if (input.getAttribute("data-geboekt-als") && input.value && !leeftijdKlopt(input)) {
        // Same rule as the server (api/create-payment.js) for a group trip.
        if (opties.alleenVolwassenen) return T.errGroupAge(uitreisTekst);
        return T.errCategory(input.getAttribute("data-geboekt-als"), uitreisTekst);
      }
      if (input === bestuurderSelect && input.value && !bestuurderOudGenoeg()) {
        return T.errDriverAge(MIN_LEEFTIJD_BESTUURDER);
      }
      // Only the general terms checkbox is required.
      if (input.type === "checkbox") return T.errTerms;
      if (input.tagName === "SELECT") return T.errDriver;
      if (v.valueMissing || !input.value.trim()) {
        if (input.type === "date") return T.errBirthMissing;
        return T.errRequired;
      }
      if (input.type === "email" && (v.typeMismatch || !EMAIL_PATROON.test(input.value.trim()))) {
        return T.errEmail;
      }
      if (input.type === "date") return T.errBirthPast;
      if (input.id === "aantalReizigers") return T.errCount(MAX_REIZIGERS);
      return T.errCheck;
    }

    function isGeldig(input) {
      if (!input.checkValidity()) return false;
      if (input.type === "checkbox") return true;
      if (input.tagName !== "SELECT" && !input.value.trim()) return false;
      if (input.type === "email" && !EMAIL_PATROON.test(input.value.trim())) return false;
      if (input.type === "date" && input.value > vandaag) return false;
      if (input.type === "date" && !leeftijdKlopt(input)) return false;
      if (input === bestuurderSelect && !bestuurderOudGenoeg()) return false;
      return true;
    }

    function toonVeldFout(input, tekst) {
      var fout = document.getElementById(input.id + "Fout");
      if (tekst) {
        input.setAttribute("aria-invalid", "true");
        if (fout) { fout.textContent = tekst; fout.hidden = false; }
      } else {
        input.removeAttribute("aria-invalid");
        if (fout) { fout.textContent = ""; fout.hidden = true; }
      }
    }

    function velden() {
      return Array.prototype.filter.call(
        form.querySelectorAll("input, select"),
        function (el) { return !el.disabled && el.required; }
      );
    }

    // Validates everything, shows the errors and returns the first bad field.
    function controleer() {
      var eersteFout = null;
      var aantalFouten = 0;
      velden().forEach(function (input) {
        if (isGeldig(input)) {
          toonVeldFout(input, "");
        } else {
          toonVeldFout(input, foutMelding(input));
          aantalFouten++;
          if (!eersteFout) eersteFout = input;
        }
      });
      // At least one traveller of 21 or older (rental car), once every field is fine.
      if (!aantalFouten && metLeeftijden) {
        var heeftOudere = false;
        for (var r = 1; r <= aantal(); r++) {
          var geboorte = form.querySelector("#reiziger" + r + "Geboortedatum");
          if (geboorte && leeftijdVan(geboorte) >= MIN_LEEFTIJD_BESTUURDER) heeftOudere = true;
        }
        if (!heeftOudere) {
          foutSamenvatting.textContent = T.errMinAge(MIN_LEEFTIJD_BESTUURDER, metAuto);
          foutSamenvatting.hidden = false;
          return form.querySelector("#reiziger1Geboortedatum");
        }
      }
      if (aantalFouten) {
        foutSamenvatting.textContent = T.errSummary(aantalFouten);
        foutSamenvatting.hidden = false;
      } else {
        foutSamenvatting.hidden = true;
        foutSamenvatting.textContent = "";
      }
      return eersteFout;
    }

    function verzamel() {
      var reizigers = [];
      for (var i = 1; i <= aantal(); i++) {
        var bestuurderCheck = form.querySelector("#reiziger" + i + "Bestuurder");
        reizigers.push({
          voornamen: form.querySelector("#reiziger" + i + "Voornamen").value.trim(),
          achternaam: form.querySelector("#reiziger" + i + "Achternaam").value.trim(),
          geboortedatum: form.querySelector("#reiziger" + i + "Geboortedatum").value,
          nationaliteit: form.querySelector("#reiziger" + i + "Nationaliteit").value.trim(),
          bestuurder: metAuto && !!(bestuurderCheck && bestuurderCheck.checked)
        });
      }
      return {
        reizigers: reizigers,
        email: form.querySelector("#contactEmail").value.trim(),
        telefoon: form.querySelector("#contactTelefoon").value.trim(),
        adres: {
          straat: form.querySelector("#contactStraat").value.trim(),
          postcode: form.querySelector("#contactPostcode").value.trim(),
          plaats: form.querySelector("#contactPlaats").value.trim(),
          land: form.querySelector("#contactLand").value.trim()
        },
        hoofdboeker: 1,
        huurauto: metAuto,
        hoofdbestuurder: metAuto ? parseInt(bestuurderSelect.value, 10) : null,
        voorwaarden: form.querySelector("#akkoordVoorwaarden").checked,
        creditcard: metAuto ? form.querySelector("#akkoordCreditcard").checked : false,
        rijbewijs: metAuto ? form.querySelector("#akkoordRijbewijs").checked : false
      };
    }

    // Contact details are now part of the hoofdboeker's traveller fields, so
    // renderReizigers() restores them from `waarden` like any other field.
    renderReizigers();

    if (!vastAantal) {
      aantalInput.addEventListener("change", function () {
        if (isGeldig(aantalInput)) {
          toonVeldFout(aantalInput, "");
          renderReizigers();
        } else {
          toonVeldFout(aantalInput, foutMelding(aantalInput));
        }
        bewaar();
      });
      // The number field has its own error element.
      aantalInput.setAttribute("aria-describedby", "aantalReizigersFout");
      if (!document.getElementById("aantalReizigersFout")) {
        var aantalFout = document.createElement("p");
        aantalFout.className = "field-error";
        aantalFout.id = "aantalReizigersFout";
        aantalFout.hidden = true;
        aantalVeld.appendChild(aantalFout);
      }
    }

    form.addEventListener("input", function (event) {
      var doel = event.target;
      if (/Voornamen$|Achternaam$/.test(doel.id)) vulBestuurders();
      bewaar();
    });

    // Once a field has shown an error, clear it as soon as it is fixed.
    form.addEventListener("change", function (event) {
      var doel = event.target;
      if (doel.getAttribute("aria-invalid") === "true" && isGeldig(doel)) toonVeldFout(doel, "");
      // A date of birth that does not give the booked category (or a driver
      // who is too young) is reported straight away, not only on submit.
      if (metLeeftijden && ((doel.type === "date" && doel.getAttribute("data-geboekt-als")) || doel === bestuurderSelect) &&
          doel.value && !isGeldig(doel)) {
        toonVeldFout(doel, foutMelding(doel));
      }
      // Changing a date of birth can also settle the driver choice.
      if (metLeeftijden && metAuto && doel.type === "date" && bestuurderSelect.getAttribute("aria-invalid") === "true" && isGeldig(bestuurderSelect)) {
        toonVeldFout(bestuurderSelect, "");
      }
      bewaar();
    });
    form.addEventListener("focusout", function (event) {
      var doel = event.target;
      if (doel.getAttribute("aria-invalid") === "true" && isGeldig(doel)) toonVeldFout(doel, "");
    });

    function gegevens() {
      var eersteFout = controleer();
      if (eersteFout) {
        eersteFout.focus();
        return null;
      }
      return verzamel();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var resultaat = gegevens();
      if (resultaat && typeof opties.onKlaar === "function") opties.onKlaar(resultaat);
    });

    return { gegevens: gegevens };
  }

  window.NovakseReisgegevens = { init: init };
})();
