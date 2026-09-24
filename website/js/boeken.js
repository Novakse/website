/* ==========================================================================
   Aanvraagpagina

   Leest de gekozen periode uit het webadres (die zet de kalender erin),
   rekent de indicatieprijs uit terwijl je invult, en zet de aanvraag klaar
   als e-mail of als WhatsApp-bericht.

   De prijzen en activiteiten staan in het blokje <script id="boekingsdata">
   boven in boeken.html. Hier hoeft niets gewijzigd te worden.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Vertalingen voor teksten die door boeken.js zelf op het scherm
     worden gezet (de aanvraaginhoud zelf komt uit het JSON-blokje in de
     pagina, dat staat al in de juiste taal).
     ------------------------------------------------------------------ */
  var I18N = {
    nl: {
      locale: "nl-NL",
      noEstimate: "Nog geen prijsindicatie voor deze reis.",
      chooseDestination: "Waar wil je heen?",
      chooseDestinationNote: "Kies eerst een bestemming. De stappen hieronder passen zich daarop aan.",
      groupSelf: "Zelf te boeken",
      groupGuided: "Begeleid of op maat",
      freePeriodHint: "Je kiest zelf je periode",
      fixedDatesHint: "Vaste reisdata",
      onRequestHint: "Prijs op aanvraag",
      fromPerPersonPerDay: function (bedrag) { return "vanaf " + bedrag + " p.p. per dag"; },
      allTripsLabel: "Alle reizen",
      chooseDestinationFirst: "Kies eerst een bestemming.",
      months: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
      nightsLabel: function (n) { return n + (n === 1 ? " nacht" : " nachten"); },
      personsLabel: function (n) { return n + (n === 1 ? " persoon" : " personen"); },
      stayDefault: "Verblijf",
      perPersonPerDay: " p.p. per dag",
      fromPerPersonPerNight: function (bedrag) { return "vanaf " + bedrag + " p.p.p.n."; },
      chooseCalendarPeriod: "Kies een periode in de kalender",
      viewDatesFor: function (naam) { return "Bekijk de reisdata van " + naam; },
      viewTripPage: function (naam) { return "Bekijk de reispagina van " + naam; },
      calendarLabel: "Kalender",
      datesAndPriceLabel: "Data en prijs",
      fixedDatesNote: "Deze reis heeft vaste vertrekdata. Zet in je opmerking welke periode je op het oog hebt, dan laat Joey weten wat er mogelijk is.",
      priceOnRequestNote: "Prijs en definitieve data staan voor deze reis nog niet vast. Zet in je opmerking welke periode je op het oog hebt, dan stelt Joey een passend voorstel op maat.",
      noExtrasYet: "Voor deze reis staan de extra activiteiten nog niet vast. Zet in je opmerking waar je belangstelling voor hebt.",
      chooseFirst: "Kies eerst een periode in de kalender.",
      fillIn: function (lijst) { return "Vul nog even " + lijst.join(" en ") + " in."; },
      yourName: "je naam",
      yourEmail: "je e-mailadres",
      requestFor: function (naam) { return "Aanvraag " + naam; },
      periodLabel: "Periode: ",
      periodTo: " tot ",
      periodNotChosen: "nog niet gekozen",
      personsLabel2: "Aantal personen: ",
      extraActivitiesLabel: "Extra activiteiten: ",
      optionsLabel: "Opties: ",
      perPersonTotal: " p.p.",
      none: "geen",
      totalEstimate: "Indicatie totaal: ",
      nameLabel: "Naam: ",
      emailLabel: "E-mail: ",
      phoneLabel: "Telefoon: ",
      remarksLabel: "Opmerkingen:"
    },
    en: {
      locale: "en-GB",
      noEstimate: "No price estimate for this trip yet.",
      chooseDestination: "Where do you want to go?",
      chooseDestinationNote: "Choose a destination first. The steps below adapt to your choice.",
      groupSelf: "Book it yourself",
      groupGuided: "Guided or tailor-made",
      freePeriodHint: "You choose your own dates",
      fixedDatesHint: "Fixed travel dates",
      onRequestHint: "Price on request",
      fromPerPersonPerDay: function (bedrag) { return "from " + bedrag + " pp/day"; },
      allTripsLabel: "All trips",
      chooseDestinationFirst: "Choose a destination first.",
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      nightsLabel: function (n) { return n + (n === 1 ? " night" : " nights"); },
      personsLabel: function (n) { return n + (n === 1 ? " person" : " people"); },
      stayDefault: "Stay",
      perPersonPerDay: " pp/day",
      fromPerPersonPerNight: function (bedrag) { return "from " + bedrag + " pp/night"; },
      chooseCalendarPeriod: "Choose a period in the calendar",
      viewDatesFor: function (naam) { return "View travel dates for " + naam; },
      viewTripPage: function (naam) { return "View the trip page for " + naam; },
      calendarLabel: "Calendar",
      datesAndPriceLabel: "Dates and price",
      fixedDatesNote: "This trip has fixed departure dates. Mention in your message which period you have in mind, and Joey will let you know what's possible.",
      priceOnRequestNote: "The price and final dates for this trip haven't been fixed yet. Mention in your message which period you have in mind, and Joey will put together a tailored proposal.",
      noExtrasYet: "The extra activities for this trip haven't been finalised yet. Mention in your message what you're interested in.",
      chooseFirst: "Choose a period in the calendar first.",
      fillIn: function (lijst) { return "Please fill in " + lijst.join(" and ") + "."; },
      yourName: "your name",
      yourEmail: "your email address",
      requestFor: function (naam) { return "Request " + naam; },
      periodLabel: "Period: ",
      periodTo: " to ",
      periodNotChosen: "not yet chosen",
      personsLabel2: "Number of people: ",
      extraActivitiesLabel: "Extra activities: ",
      optionsLabel: "Options: ",
      perPersonTotal: " pp",
      none: "none",
      totalEstimate: "Estimated total: ",
      nameLabel: "Name: ",
      emailLabel: "Email: ",
      phoneLabel: "Phone: ",
      remarksLabel: "Remarks:"
    },
    sv: {
      locale: "sv-SE",
      noEstimate: "Ingen prisuppskattning för den här resan än.",
      chooseDestination: "Vart vill du åka?",
      chooseDestinationNote: "Välj först en destination. Stegen nedan anpassas efter ditt val.",
      groupSelf: "Boka själv",
      groupGuided: "Guidad eller skräddarsydd",
      freePeriodHint: "Du väljer själv din period",
      fixedDatesHint: "Fasta resedatum",
      onRequestHint: "Pris på förfrågan",
      fromPerPersonPerDay: function (bedrag) { return "från " + bedrag + " p.p./dag"; },
      allTripsLabel: "Alla resor",
      chooseDestinationFirst: "Välj först en destination.",
      months: ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
      nightsLabel: function (n) { return n + (n === 1 ? " natt" : " nätter"); },
      personsLabel: function (n) { return n + (n === 1 ? " person" : " personer"); },
      stayDefault: "Boende",
      perPersonPerDay: " p.p./dag",
      fromPerPersonPerNight: function (bedrag) { return "från " + bedrag + " p.p./natt"; },
      chooseCalendarPeriod: "Välj en period i kalendern",
      viewDatesFor: function (naam) { return "Se resedatum för " + naam; },
      viewTripPage: function (naam) { return "Se resesidan för " + naam; },
      calendarLabel: "Kalender",
      datesAndPriceLabel: "Datum och pris",
      fixedDatesNote: "Den här resan har fasta avresedatum. Skriv i ditt meddelande vilken period du har i åtanke, så återkommer Joey med vad som är möjligt.",
      priceOnRequestNote: "Pris och slutgiltiga datum är ännu inte fastställda för den här resan. Skriv i ditt meddelande vilken period du har i åtanke, så tar Joey fram ett förslag som passar.",
      noExtrasYet: "De extra aktiviteterna för den här resan är inte fastställda än. Skriv i ditt meddelande vad du är intresserad av.",
      chooseFirst: "Välj först en period i kalendern.",
      fillIn: function (lijst) { return "Fyll i " + lijst.join(" och ") + "."; },
      yourName: "ditt namn",
      yourEmail: "din e-postadress",
      requestFor: function (naam) { return "Förfrågan " + naam; },
      periodLabel: "Period: ",
      periodTo: " till ",
      periodNotChosen: "inte vald än",
      personsLabel2: "Antal personer: ",
      extraActivitiesLabel: "Extra aktiviteter: ",
      optionsLabel: "Alternativ: ",
      perPersonTotal: " p.p.",
      none: "inga",
      totalEstimate: "Uppskattad totalsumma: ",
      nameLabel: "Namn: ",
      emailLabel: "E-post: ",
      phoneLabel: "Telefon: ",
      remarksLabel: "Kommentarer:"
    },
    de: {
      locale: "de-DE",
      noEstimate: "Für diese Reise gibt es noch keine Preisangabe.",
      chooseDestination: "Wohin möchtest du?",
      chooseDestinationNote: "Wähle zuerst ein Ziel. Die Schritte darunter richten sich danach.",
      groupSelf: "Selbst buchen",
      groupGuided: "Begleitet oder maßgeschneidert",
      freePeriodHint: "Du wählst deinen Zeitraum selbst",
      fixedDatesHint: "Feste Reisetermine",
      onRequestHint: "Preis auf Anfrage",
      fromPerPersonPerDay: function (bedrag) { return "ab " + bedrag + " p.P./Tag"; },
      allTripsLabel: "Alle Reisen",
      chooseDestinationFirst: "Wähle zuerst ein Ziel.",
      months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      nightsLabel: function (n) { return n + (n === 1 ? " Nacht" : " Nächte"); },
      personsLabel: function (n) { return n + (n === 1 ? " Person" : " Personen"); },
      stayDefault: "Aufenthalt",
      perPersonPerDay: " p.P./Tag",
      fromPerPersonPerNight: function (bedrag) { return "ab " + bedrag + " p.P./Nacht"; },
      chooseCalendarPeriod: "Wähle einen Zeitraum im Kalender",
      viewDatesFor: function (naam) { return "Reisedaten für " + naam + " ansehen"; },
      viewTripPage: function (naam) { return "Reiseseite von " + naam + " ansehen"; },
      calendarLabel: "Kalender",
      datesAndPriceLabel: "Termine und Preis",
      fixedDatesNote: "Diese Reise hat feste Abreisetermine. Schreib in deiner Nachricht, welchen Zeitraum du im Blick hast, dann lässt Joey dich wissen, was möglich ist.",
      priceOnRequestNote: "Preis und endgültige Termine stehen für diese Reise noch nicht fest. Schreib in deiner Nachricht, welchen Zeitraum du im Blick hast, dann erstellt Joey ein passendes Angebot.",
      noExtrasYet: "Die Zusatzaktivitäten für diese Reise stehen noch nicht fest. Schreib in deiner Nachricht, wofür du dich interessierst.",
      chooseFirst: "Wähle zuerst einen Zeitraum im Kalender.",
      fillIn: function (lijst) { return "Bitte trage noch " + lijst.join(" und ") + " ein."; },
      yourName: "deinen Namen",
      yourEmail: "deine E-Mail-Adresse",
      requestFor: function (naam) { return "Anfrage " + naam; },
      periodLabel: "Zeitraum: ",
      periodTo: " bis ",
      periodNotChosen: "noch nicht gewählt",
      personsLabel2: "Anzahl Personen: ",
      extraActivitiesLabel: "Zusatzaktivitäten: ",
      optionsLabel: "Optionen: ",
      perPersonTotal: " p.P.",
      none: "keine",
      totalEstimate: "Geschätzte Gesamtsumme: ",
      nameLabel: "Name: ",
      emailLabel: "E-Mail: ",
      phoneLabel: "Telefon: ",
      remarksLabel: "Anmerkungen:"
    },
    no: {
      locale: "nb-NO",
      noEstimate: "Ingen prisanslag for denne turen ennå.",
      chooseDestination: "Hvor vil du reise?",
      chooseDestinationNote: "Velg først et reisemål. Stegene under tilpasser seg valget ditt.",
      groupSelf: "Book selv",
      groupGuided: "Med guide eller skreddersydd",
      freePeriodHint: "Du velger perioden selv",
      fixedDatesHint: "Faste reisedatoer",
      onRequestHint: "Pris på forespørsel",
      fromPerPersonPerDay: function (bedrag) { return "fra " + bedrag + " pr. person/dag"; },
      allTripsLabel: "Alle turer",
      chooseDestinationFirst: "Velg først et reisemål.",
      months: ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"],
      nightsLabel: function (n) { return n + (n === 1 ? " natt" : " netter"); },
      personsLabel: function (n) { return n + (n === 1 ? " person" : " personer"); },
      stayDefault: "Opphold",
      perPersonPerDay: " pr. person/dag",
      fromPerPersonPerNight: function (bedrag) { return "fra " + bedrag + " pr. person/natt"; },
      chooseCalendarPeriod: "Velg en periode i kalenderen",
      viewDatesFor: function (naam) { return "Se reisedatoer for " + naam; },
      viewTripPage: function (naam) { return "Se reisesiden for " + naam; },
      calendarLabel: "Kalender",
      datesAndPriceLabel: "Datoer og pris",
      fixedDatesNote: "Denne reisen har faste avreisedatoer. Skriv i meldingen din hvilken periode du har i tankene, så gir Joey beskjed om hva som er mulig.",
      priceOnRequestNote: "Pris og endelige datoer er ennå ikke fastsatt for denne reisen. Skriv i meldingen din hvilken periode du har i tankene, så lager Joey et forslag som passer.",
      noExtrasYet: "De ekstra aktivitetene for denne reisen er ikke fastsatt ennå. Skriv i meldingen din hva du er interessert i.",
      chooseFirst: "Velg først en periode i kalenderen.",
      fillIn: function (lijst) { return "Fyll inn " + lijst.join(" og ") + "."; },
      yourName: "navnet ditt",
      yourEmail: "e-postadressen din",
      requestFor: function (naam) { return "Forespørsel " + naam; },
      periodLabel: "Periode: ",
      periodTo: " til ",
      periodNotChosen: "ikke valgt ennå",
      personsLabel2: "Antall personer: ",
      extraActivitiesLabel: "Ekstra aktiviteter: ",
      optionsLabel: "Alternativer: ",
      perPersonTotal: " pr. person",
      none: "ingen",
      totalEstimate: "Estimert totalt: ",
      nameLabel: "Navn: ",
      emailLabel: "E-post: ",
      phoneLabel: "Telefon: ",
      remarksLabel: "Merknader:"
    },
    fi: {
      locale: "fi-FI",
      noEstimate: "Tälle matkalle ei ole vielä hinta-arviota.",
      chooseDestination: "Minne haluat matkustaa?",
      chooseDestinationNote: "Valitse ensin kohde. Alla olevat vaiheet mukautuvat valintaasi.",
      groupSelf: "Varaa itse",
      groupGuided: "Opastettu tai räätälöity",
      freePeriodHint: "Valitset ajankohdan itse",
      fixedDatesHint: "Kiinteät matkapäivät",
      onRequestHint: "Hinta pyynnöstä",
      fromPerPersonPerDay: function (bedrag) { return "alkaen " + bedrag + " hlö/vrk"; },
      allTripsLabel: "Kaikki matkat",
      chooseDestinationFirst: "Valitse ensin kohde.",
      months: ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"],
      nightsLabel: function (n) { return n + (n === 1 ? " yö" : " yötä"); },
      personsLabel: function (n) { return n + (n === 1 ? " henkilö" : " henkilöä"); },
      stayDefault: "Majoitus",
      perPersonPerDay: " hlö/vrk",
      fromPerPersonPerNight: function (bedrag) { return "alkaen " + bedrag + " hlö/yö"; },
      chooseCalendarPeriod: "Valitse ajanjakso kalenterista",
      viewDatesFor: function (naam) { return "Katso matkapäivät: " + naam; },
      viewTripPage: function (naam) { return "Katso matkan sivu: " + naam; },
      calendarLabel: "Kalenteri",
      datesAndPriceLabel: "Päivämäärät ja hinta",
      fixedDatesNote: "Tällä matkalla on kiinteät lähtöpäivät. Kerro viestissäsi, mikä ajanjakso sinulla on mielessä, niin Joey kertoo mikä on mahdollista.",
      priceOnRequestNote: "Tämän matkan hinta ja lopulliset päivämäärät eivät ole vielä varmistuneet. Kerro viestissäsi, mikä ajanjakso sinulla on mielessä, niin Joey tekee sinulle sopivan ehdotuksen.",
      noExtrasYet: "Tämän matkan lisäaktiviteetit eivät ole vielä varmistuneet. Kerro viestissäsi, mistä olet kiinnostunut.",
      chooseFirst: "Valitse ensin ajanjakso kalenterista.",
      fillIn: function (lijst) { return "Täytä vielä " + lijst.join(" ja ") + "."; },
      yourName: "nimesi",
      yourEmail: "sähköpostiosoitteesi",
      requestFor: function (naam) { return "Varauspyyntö " + naam; },
      periodLabel: "Ajanjakso: ",
      periodTo: " – ",
      periodNotChosen: "ei vielä valittu",
      personsLabel2: "Henkilömäärä: ",
      extraActivitiesLabel: "Lisäaktiviteetit: ",
      optionsLabel: "Vaihtoehdot: ",
      perPersonTotal: " / hlö",
      none: "ei mitään",
      totalEstimate: "Arvioitu kokonaishinta: ",
      nameLabel: "Nimi: ",
      emailLabel: "Sähköposti: ",
      phoneLabel: "Puhelin: ",
      remarksLabel: "Huomiot:"
    }
  };
  var LANG = (document.documentElement.lang || "nl").slice(0, 2).toLowerCase();
  var T = I18N[LANG] || I18N.nl;

  var MAANDEN = T.months;
  var MAIL = "schaatsennovakse@outlook.com";
  var WHATSAPP = "31617467643";

  var bron = document.getElementById("boekingsdata");
  var formulier = document.getElementById("boekingsformulier");
  if (!bron || !formulier) return;

  var data;
  try { data = JSON.parse(bron.textContent); } catch (fout) { return; }

  var alleReizen = data.reizen || {};
  var params = new URLSearchParams(window.location.search);

  /* --- Wat er per bestemming wisselt -------------------------------------
     Zolang er geen bestemming gekozen is, blijft reis leeg en staat alleen
     de eerste stap open. Kiest iemand een bestemming, dan vult kiesReis()
     alle volgende stappen met de gegevens van die reis.
     ---------------------------------------------------------------------- */
  var reisSleutel = "";
  var reis = null;
  var extras = [];
  var varianten = [];
  var vragen = [];
  var maxPersonen = 12;
  var minPersonen = 1;
  var opslag = 0;
  var van = null;
  var tot = null;
  var nachten = 0;

  function alsDatum(tekst) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tekst || "")) return null;
    var d = tekst.split("-");
    var datum = new Date(+d[0], +d[1] - 1, +d[2]);
    return isNaN(datum) ? null : datum;
  }
  function alsTekst(datum) {
    var maand = datum.getMonth() + 1;
    var dag = datum.getDate();
    return datum.getFullYear() + "-" + (maand < 10 ? "0" : "") + maand + "-" + (dag < 10 ? "0" : "") + dag;
  }
  function schrijfDatum(datum) {
    return datum.getDate() + " " + MAANDEN[datum.getMonth()] + " " + datum.getFullYear();
  }
  function euro(bedrag) {
    return "€" + Math.round(bedrag).toLocaleString(T.locale);
  }
  // Opties halen iets van de prijs af of tellen erbij op. Het teken staat
  // los voor het bedrag, zodat er geen "€-100" op het scherm komt.
  function euroMetTeken(bedrag, teken) {
    return (teken === "-" ? "- " : "+ ") + euro(Math.abs(bedrag));
  }

  /* --- De onderdelen van het formulier ---------------------------------- */
  var keuzeBox = document.getElementById("reisKeuze");
  var reisNaam = document.getElementById("reisNaam");
  var voorbeeld = document.getElementById("boekingVoorbeeld");
  var terugLink = document.getElementById("terugNaarReis");
  var headerKalender = document.getElementById("headerKalender");
  var periodeBox = document.getElementById("periodeBox");
  var personenVeld = document.getElementById("personen");
  var vragenBox = document.getElementById("vragenBlokken");
  var variantBox = document.getElementById("variantBox");
  var variantBlok = document.getElementById("variantBlok");
  var extrasBox = document.getElementById("extrasBox");
  var extrasBlok = document.getElementById("extrasBlok");
  var detailsBlok = document.getElementById("detailsBlok");
  var optiesBlok = document.getElementById("optiesBlok");
  var optiesBox = document.getElementById("optiesBox");
  var kalenderBox = document.getElementById("kalenderBox");
  var regelsBox = document.getElementById("overzichtRegels");
  var totaalBox = document.getElementById("totaalBedrag");
  var whatsappKnop = document.getElementById("whatsappKnop");
  var actiesBox = formulier.querySelector(".booking__actions");
  var foutmelding = document.getElementById("formulierFout");
  var vervolgBlokken = ["personenBlok", "periodeBlok", "detailsBlok", "gegevensBlok"];

  /* --- Periode uit het webadres halen ------------------------------------
     De kalender op de reispagina zet de gekozen periode in het webadres.
     ---------------------------------------------------------------------- */
  function leesPeriode() {
    van = alsDatum(params.get("van"));
    tot = alsDatum(params.get("tot"));
    nachten = (van && tot && tot > van) ? Math.round((tot - van) / 86400000) : 0;
    if (!nachten) { van = null; tot = null; }
  }

  /* --- Stap 1: de bestemming ---------------------------------------------
     De reizen die iemand zelf kan boeken staan bovenaan; de begeleide
     reizen en de reizen op maat daaronder. Welke reis waar staat, bepaalt
     "zelfTeBoeken" in het gegevensblokje van de pagina.
     ---------------------------------------------------------------------- */
  function reisHint(gegevens) {
    if (gegevens.prijsOpAanvraag) return T.onRequestHint;
    return gegevens.periodeVrij ? T.freePeriodHint : T.fixedDatesHint;
  }

  function reisVanafPrijs(gegevens) {
    return gegevens.prijsPerPersoonPerDag
      ? T.fromPerPersonPerDay(euro(gegevens.prijsPerPersoonPerDag))
      : "";
  }

  function bouwReiskeuze() {
    if (!keuzeBox) return;
    var sleutels = Object.keys(alleReizen);
    var groepen = [
      { kop: T.groupSelf, lijst: sleutels.filter(function (s) { return alleReizen[s].zelfTeBoeken; }) },
      { kop: T.groupGuided, lijst: sleutels.filter(function (s) { return !alleReizen[s].zelfTeBoeken; }) }
    ];

    keuzeBox.innerHTML = "";
    groepen.forEach(function (groep) {
      if (!groep.lijst.length) return;

      var blok = document.createElement("div");
      blok.className = "booking__groep";

      var kop = document.createElement("p");
      kop.className = "booking__groep-kop";
      kop.textContent = groep.kop;
      blok.appendChild(kop);

      var lijst = document.createElement("div");
      lijst.className = "booking__extras";
      groep.lijst.forEach(function (sleutel) {
        var gegevens = alleReizen[sleutel];
        var rij = document.createElement("label");
        rij.className = "extra extra--reis";
        rij.innerHTML =
          '<input type="radio" name="reis" class="extra__check" value="' + sleutel + '" />' +
          '<span class="extra__name">' + gegevens.naam +
            '<span class="extra__hint">' + reisHint(gegevens) + '</span>' +
          '</span>' +
          '<span class="extra__price">' + reisVanafPrijs(gegevens) + '</span>';
        lijst.appendChild(rij);
      });

      blok.appendChild(lijst);
      keuzeBox.appendChild(blok);
    });

    keuzeBox.addEventListener("change", function (gebeurtenis) {
      var knop = gebeurtenis.target;
      if (!knop || knop.name !== "reis") return;
      kiesReis(knop.value, true);
    });
  }

  function vinkReisAan() {
    if (!keuzeBox) return;
    var knop = keuzeBox.querySelector('input[name="reis"][value="' + reisSleutel + '"]');
    if (knop) knop.checked = true;
  }

  /* --- De teksten en verwijzingen die bij de reis horen ------------------ */
  function toonReisTeksten() {
    if (reisNaam) reisNaam.textContent = reis.naam;

    // Reizen zonder vaste prijs (zoals Weissensee en Luleå) hebben geen
    // voorbeeldprijs om te tonen.
    if (voorbeeld) {
      var tekst = reis.prijsOpAanvraag ? "" : (reis.voorbeeld || "");
      voorbeeld.textContent = tekst;
      voorbeeld.hidden = !tekst;
    }

    if (terugLink) {
      terugLink.hidden = false;
      terugLink.href = reisSleutel + ".html" + (reis.periodeVrij ? "#prijzen" : "");
      terugLink.textContent = reis.prijsOpAanvraag
        ? T.viewTripPage(reis.naam.split(/ [—-] |, /)[0])
        : reis.periodeVrij
          ? T.chooseCalendarPeriod
          : T.viewDatesFor(reis.naam.split(/ [—-] |, /)[0]);
    }

    // De "Kalender"-knop in de koptekst gaat mee met de reis die open staat.
    if (headerKalender) {
      headerKalender.href = reisSleutel + ".html" + (reis.periodeVrij ? "#prijzen" : "");
      headerKalender.textContent = reis.periodeVrij ? T.calendarLabel : T.datesAndPriceLabel;
    }

    toonPeriode();
  }

  /* Wat er onder stap 3 staat. Bij een reis met een kalender op deze pagina
     is dat de bevestiging van de dag die iemand net aanklikte; bij de andere
     reizen de uitleg waarom er hier nog geen datum staat. */
  function toonPeriode() {
    if (!periodeBox || !reis) return;

    // Staat de kalender hier in de pagina, dan wijst de link naar de
    // reispagina niets nuttigs meer aan.
    if (terugLink) terugLink.hidden = Boolean(reis.kalender);

    if (nachten) {
      periodeBox.innerHTML =
        '<p class="booking__period-dates">' + schrijfDatum(van) + ' – ' + schrijfDatum(tot) + '</p>' +
        '<p class="booking__period-nights">' + T.nightsLabel(nachten) + '</p>';
    } else if (reis.prijsOpAanvraag) {
      periodeBox.innerHTML = '<p class="booking__period-empty">' + T.priceOnRequestNote + '</p>';
    } else if (!reis.periodeVrij) {
      periodeBox.innerHTML = '<p class="booking__period-empty">' + T.fixedDatesNote + '</p>';
    } else {
      periodeBox.innerHTML = '<p class="booking__period-empty">' + T.chooseFirst + '</p>';
    }
  }

  /* --- De kalender in stap 3 ---------------------------------------------
     Een reis met een kalenderbestand laat de bezoeker hier zelf zijn
     aankomstdag kiezen, met de prijs per dag erbij. Het rekenwerk doet
     js/falun-kalender.js, die de prijzen uit dat bestand leest en zijn
     uitkomst hier doorgeeft. Zo wordt de prijs op een plek uitgerekend.
     ---------------------------------------------------------------------- */
  var kalenderInfo = null;
  var kalenderGeladen = false;

  /* --- Prijstabel per periode (Finland) ----------------------------------
     Een reis met een prijstabel haalt zijn bedragen uit hetzelfde bestand
     als de kalender op de reispagina (js/main.js). De rekenwijze hieronder
     is daar een kopie van: pas je de een aan, pas dan de ander mee aan.
     ---------------------------------------------------------------------- */
  var prijstabel = null;
  var prijstabelPad = null;

  function laadPrijstabel() {
    var pad = reis && reis.prijstabel;
    if (!pad) { prijstabel = null; prijstabelPad = null; return; }
    if (pad === prijstabelPad) return;
    prijstabelPad = pad;
    prijstabel = null;
    fetch(mapVoor() + pad).then(function (antwoord) {
      return antwoord.ok ? antwoord.json() : null;
    }).then(function (data) {
      // Is er inmiddels een andere reis gekozen, dan hoort dit er niet meer bij.
      if (!data || pad !== prijstabelPad) return;
      prijstabel = data;
      ververs();
    })["catch"](function () { /* dan blijft het bij "nog geen prijsindicatie" */ });
  }

  function tariefOp(datum) {
    var lijst = (prijstabel && prijstabel.periodes) || [];
    for (var i = 0; i < lijst.length; i++) {
      var begin = alsDatum(lijst[i].van);
      var eind = alsDatum(lijst[i].tot);
      if (begin && eind && datum >= begin && datum < eind) return lijst[i].tarief;
    }
    return null;
  }

  function tabelPrijsPerPersoon(aankomst, aantalNachten) {
    var tabel = prijstabel && prijstabel.prijsPerPersoon;
    if (!tabel) return 0;
    var tarief = tariefOp(aankomst);
    var rij = tarief ? tabel[tarief] : null;
    if (!rij) return 0;
    if (typeof rij[String(aantalNachten)] === "number") return rij[String(aantalNachten)];

    var langste = 0;
    Object.keys(rij).forEach(function (sleutel) {
      var n = parseInt(sleutel, 10);
      if (n > langste && typeof rij[sleutel] === "number") langste = n;
    });
    if (!langste || aantalNachten < langste) return 0;

    var extra = (prijstabel.extraNachtPerPersoon || {})[tarief] || 0;
    if (!extra) return 0;
    return rij[String(langste)] + (aantalNachten - langste) * extra;
  }

  // "" op de Nederlandse site, "../" in de taalmappen. De paden in het
  // gegevensblokje gaan uit van de hoofdmap.
  function mapVoor() {
    var eigen = document.querySelector('script[src$="js/boeken.js"]');
    var src = eigen ? eigen.getAttribute("src") : "";
    return src.replace(/js\/boeken\.js$/, "");
  }

  function toonKalender() {
    if (!kalenderBox) return;
    var pad = reis && reis.kalender;
    if (!pad) {
      kalenderBox.hidden = true;
      kalenderInfo = null;
      return;
    }

    kalenderBox.hidden = false;
    kalenderBox.setAttribute("data-personen", personen());
    if (van) kalenderBox.setAttribute("data-aankomst", alsTekst(van));
    if (nachten) kalenderBox.setAttribute("data-dagen", nachten + 1);

    if (kalenderGeladen) {
      // De kalender staat er al; hij hoeft alleen opnieuw getekend te worden
      // omdat de dagprijzen van het aantal personen afhangen.
      kalenderBox.dispatchEvent(new CustomEvent("novakse:herteken"));
      return;
    }
    kalenderGeladen = true;
    kalenderBox.setAttribute("data-falun-calendar", mapVoor() + pad);
    var script = document.createElement("script");
    script.src = mapVoor() + "js/falun-kalender.js";
    document.body.appendChild(script);
  }

  if (kalenderBox) {
    kalenderBox.addEventListener("novakse:periode", function (gebeurtenis) {
      kalenderInfo = gebeurtenis.detail || null;
      if (!kalenderInfo) return;

      if (kalenderInfo.van && kalenderInfo.tot) {
        van = alsDatum(kalenderInfo.van);
        tot = alsDatum(kalenderInfo.tot);
        nachten = kalenderInfo.nachten;
      }
      // Een huisje heeft een eigen maximum; dat gaat voor op het maximum
      // van de reis zelf.
      minPersonen = kalenderInfo.personenMin || minPersonen;
      maxPersonen = kalenderInfo.personenMax || maxPersonen;
      stelPersonenIn();

      toonPeriode();
      bouwOpties();
      onthoudInAdres();
      ververs();
    });
  }

  /* --- Welke stappen open staan ------------------------------------------ */
  function toonStappen(aan) {
    vervolgBlokken.forEach(function (id) {
      var blok = document.getElementById(id);
      if (blok) blok.hidden = !aan;
    });
    // Binnen stap 4 valt weg wat deze reis niet heeft.
    if (vragenBox) vragenBox.hidden = !aan || !vragen.length;
    if (variantBlok) variantBlok.hidden = !aan || !varianten.length;
    if (optiesBlok) optiesBlok.hidden = !aan || !alleOpties().length;
    if (actiesBox) actiesBox.hidden = !aan;
    if (detailsBlok) detailsBlok.hidden = !aan;
  }

  // Stappen doorlopend nummeren; blokken die voor deze reis niet gelden,
  // vallen weg en mogen geen gat in de nummering achterlaten.
  function nummerStappen() {
    var stapNr = 0;
    formulier.querySelectorAll(".booking__block").forEach(function (blok) {
      if (blok.hidden) return;
      var bolletje = blok.querySelector(".booking__step");
      if (!bolletje) return;
      stapNr++;
      bolletje.textContent = stapNr;
    });
  }

  /* --- Aantal personen -------------------------------------------------- */
  function stelPersonenIn() {
    personenVeld.max = maxPersonen;
    personenVeld.min = minPersonen;
    if (parseInt(personenVeld.value, 10) < minPersonen) personenVeld.value = minPersonen;
    if (parseInt(personenVeld.value, 10) > maxPersonen) personenVeld.value = maxPersonen;
  }

  function personen() {
    var aantal = parseInt(personenVeld.value, 10);
    if (isNaN(aantal) || aantal < minPersonen) aantal = minPersonen;
    if (aantal > maxPersonen) aantal = maxPersonen;
    return aantal;
  }

  // De dagprijzen in de kalender hangen af van hoeveel mensen er in het
  // huisje slapen, dus die wordt opnieuw getekend zodra dit verandert.
  function personenGewijzigd() {
    toonKalender();
    ververs();
  }

  document.getElementById("minderPersonen").addEventListener("click", function () {
    personenVeld.value = Math.max(minPersonen, personen() - 1);
    personenGewijzigd();
  });
  document.getElementById("meerPersonen").addEventListener("click", function () {
    personenVeld.value = Math.min(maxPersonen, personen() + 1);
    personenGewijzigd();
  });
  personenVeld.addEventListener("input", personenGewijzigd);

  /* --- Keuzevragen (vervoer, verzekering, eigen groep, materiaal) --------
     Elke vraag staat in het gegevensblokje van de reis. Een optie mag een
     prijs hebben; die telt dan per persoon mee in het totaal.
     ---------------------------------------------------------------------- */
  function bouwVragen() {
    if (!vragenBox) return;
    vragenBox.innerHTML = "";
    vragen.forEach(function (vraag, nr) {
      var blok = document.createElement("fieldset");
      blok.className = "booking__block booking__block--vraag";

      var kop = document.createElement("legend");
      kop.className = "booking__legend booking__legend--klein";
      kop.textContent = vraag.vraag;
      blok.appendChild(kop);

      var lijst = document.createElement("div");
      lijst.className = "booking__extras";

      (vraag.opties || []).forEach(function (optie, i) {
        var rij = document.createElement("label");
        rij.className = "extra";
        rij.innerHTML =
          '<input type="radio" name="vraag-' + vraag.sleutel + '" class="extra__check vraag__check"' +
            ' data-vraag="' + nr + '" value="' + i + '"' + (i === 0 ? " checked" : "") + ' />' +
          '<span class="extra__name">' + optie.naam +
            (optie.toelichting ? '<span class="extra__hint">' + optie.toelichting + '</span>' : '') +
          '</span>' +
          '<span class="extra__price">' + (optie.prijs ? euro(optie.prijs) : "") + '</span>';
        lijst.appendChild(rij);
      });

      blok.appendChild(lijst);
      vragenBox.appendChild(blok);
    });
  }
  if (vragenBox) vragenBox.addEventListener("change", ververs);

  function antwoorden() {
    var uit = [];
    vragen.forEach(function (vraag) {
      var gekozen = document.querySelector('input[name="vraag-' + vraag.sleutel + '"]:checked');
      if (!gekozen) return;
      var optie = (vraag.opties || [])[+gekozen.value];
      if (optie) uit.push({ vraag: vraag.vraag, antwoord: optie.naam, prijs: optie.prijs || 0 });
    });
    return uit;
  }

  /* --- Keuze tussen de varianten (wel of geen materiaalhuur) ------------- */
  function bouwVarianten() {
    if (!variantBox) return;
    variantBox.innerHTML = "";
    varianten.forEach(function (variant, i) {
      var rij = document.createElement("label");
      rij.className = "extra";
      rij.innerHTML =
        '<input type="radio" name="variant" class="extra__check" value="' + variant.sleutel + '"' +
          (i === 0 ? " checked" : "") + ' />' +
        '<span class="extra__name">' + variant.naam +
          (variant.toelichting ? '<span class="extra__hint">' + variant.toelichting + '</span>' : '') +
        '</span>' +
        '<span class="extra__price">' + T.fromPerPersonPerNight(euro(staffelprijs(variant, 7) + opslag)) + '</span>';
      variantBox.appendChild(rij);
    });
  }
  if (variantBox) variantBox.addEventListener("change", ververs);

  /* --- Opties bij de gekozen bestemming -----------------------------------
     Dit zijn de keuzes die aan de bestemming vastzitten: een grotere
     huurauto, de vlucht of het vervoer zelf regelen, begeleiding op het ijs.
     Bij een reis met een kalender komen ze daarvandaan, inclusief de
     bedragen. Een reis zonder kalender kan ze in het gegevensblokje van de
     pagina zetten onder "opties", in dezelfde vorm.
     ---------------------------------------------------------------------- */
  function alleOpties() {
    if (kalenderInfo && kalenderInfo.opties) return kalenderInfo.opties;
    return (reis && reis.opties) || [];
  }

  function bouwOpties() {
    if (!optiesBox) return;
    var lijst = alleOpties();

    // Wat al aangevinkt stond, blijft staan als de lijst opnieuw getekend
    // wordt doordat de dagkeuze of het aantal personen verandert.
    var stond = {};
    optiesBox.querySelectorAll(".extra__check:checked").forEach(function (vak) {
      stond[vak.value] = true;
    });

    optiesBox.innerHTML = "";
    lijst.forEach(function (optie) {
      var hint = optie.toelichting || "";
      if (optie.inbegrepen && optie.inbegrepen.length) {
        hint += (hint ? "<br />" : "") +
          (optie.inbegrepenLabel || "") + optie.inbegrepen.join(", ");
      }
      var rij = document.createElement("label");
      rij.className = "extra" + (optie.uit ? " is-uit" : "");
      rij.innerHTML =
        '<input type="checkbox" class="extra__check" value="' + optie.sleutel + '"' +
          (stond[optie.sleutel] && !optie.uit ? " checked" : "") +
          (optie.uit ? " disabled" : "") + ' />' +
        '<span class="extra__name">' + optie.naam +
          (hint ? '<span class="extra__hint">' + hint + '</span>' : '') +
        '</span>' +
        '<span class="extra__price">' +
          (typeof optie.bedrag === "number" && optie.bedrag
            ? euroMetTeken(optie.bedrag, optie.teken) : "") +
        '</span>';
      optiesBox.appendChild(rij);
    });

    if (optiesBlok) optiesBlok.hidden = !lijst.length;
  }
  if (optiesBox) optiesBox.addEventListener("change", ververs);

  function gekozenOpties() {
    if (!optiesBox) return [];
    var perSleutel = {};
    alleOpties().forEach(function (optie) { perSleutel[optie.sleutel] = optie; });

    var lijst = [];
    optiesBox.querySelectorAll(".extra__check:checked").forEach(function (vak) {
      if (perSleutel[vak.value]) lijst.push(perSleutel[vak.value]);
    });
    return lijst;
  }

  /* --- Extra activiteiten ----------------------------------------------- */
  function bouwExtras() {
    extrasBox.innerHTML = "";
    extras.forEach(function (extra, i) {
      var rij = document.createElement("label");
      rij.className = "extra";
      rij.innerHTML =
        '<input type="checkbox" class="extra__check" value="' + i + '" />' +
        '<span class="extra__name">' + extra.naam +
          (extra.toelichting ? '<span class="extra__hint">' + extra.toelichting + '</span>' : '') +
        '</span>' +
        '<span class="extra__price">' + euro(extra.prijs) + '</span>';
      extrasBox.appendChild(rij);
    });

    if (!extras.length) {
      extrasBox.innerHTML = '<p class="booking__note">' + T.noExtrasYet + '</p>';
    } else if (data.weerbericht) {
      var waarschuwing = document.createElement("p");
      waarschuwing.className = "booking__note";
      waarschuwing.textContent = data.weerbericht;
      extrasBox.appendChild(waarschuwing);
    }
  }
  extrasBox.addEventListener("change", ververs);

  function gekozenExtras() {
    var lijst = [];
    extrasBox.querySelectorAll(".extra__check:checked").forEach(function (vak) {
      lijst.push(extras[+vak.value]);
    });
    return lijst;
  }

  /* --- Wat kost een nacht -----------------------------------------------
     De prijs per nacht hangt af van hoe lang je blijft (de staffel) en of de
     nacht in het hoogseizoen valt. Daar komt de eigen opslag bovenop.
     ---------------------------------------------------------------------- */
  function staffelprijs(variant, aantalNachten) {
    var trappen = (variant && variant.staffel) || [];
    var gekozen = null;
    trappen.forEach(function (trap) {
      if (aantalNachten >= trap.vanaf) gekozen = trap;
    });
    if (!gekozen && trappen.length) gekozen = trappen[0];
    return gekozen ? gekozen.prijs : 0;
  }

  function hoogseizoenNachten(vanDatum, aantalNachten) {
    var piek = reis && reis.hoogseizoen;
    if (!piek || !piek.van || !piek.tot) return 0;
    var piekVan = alsDatum(piek.van);
    var piekTot = alsDatum(piek.tot);
    if (!piekVan || !piekTot) return 0;

    var aantal = 0;
    var loop = new Date(vanDatum.getTime());
    for (var i = 0; i < aantalNachten; i++) {
      if (loop >= piekVan && loop < piekTot) aantal++;
      loop.setDate(loop.getDate() + 1);
    }
    return aantal;
  }

  function huidigeVariant() {
    if (!varianten.length) return null;
    var gekozen = document.querySelector('input[name="variant"]:checked');
    var sleutel = gekozen ? gekozen.value : varianten[0].sleutel;
    for (var i = 0; i < varianten.length; i++) {
      if (varianten[i].sleutel === sleutel) return varianten[i];
    }
    return varianten[0];
  }

  /* --- Overzicht en totaal ---------------------------------------------- */
  function ververs() {
    if (!reis) {
      regelsBox.innerHTML = '<p class="booking__empty">' + T.chooseDestinationFirst + '</p>';
      totaalBox.textContent = "-";
      whatsappKnop.href = "https://wa.me/" + WHATSAPP;
      return;
    }

    var aantal = personen();
    var regels = [];
    var totaal = 0;

    var variant = huidigeVariant();

    // Heeft de reis varianten, dan bepaalt de staffel de prijs; anders geldt
    // een vaste dagprijs. Staat er nog geen prijs bij de reis, dan valt er
    // niets uit te rekenen en blijft het overzicht leeg.
    var perDag = (varianten.length ? staffelprijs(variant, nachten)
                                   : (reis.prijsPerPersoonPerDag || 0)) + opslag;

    // Heeft de reis een kalender, dan komt de verblijfprijs daarvandaan: die
    // hangt per dag af van wat het huisje die nacht kost.
    var uitKalender = kalenderInfo && typeof kalenderInfo.verblijf === "number"
      ? kalenderInfo.verblijf : null;

    // Heeft de reis een prijstabel, dan komt de verblijfprijs daarvandaan.
    // De bedragen gaan uit van twee personen in een huisje. Met minder mensen
    // zou de indicatie te laag uitvallen, dus dan geven we er geen; met meer
    // mensen valt hij hooguit iets te hoog uit en stuurt Joey het precieze
    // bedrag.
    if (uitKalender === null && prijstabel && van && nachten &&
        aantal >= (prijstabel.basisPersonen || 1)) {
      var uitTabel = Math.round(tabelPrijsPerPersoon(van, nachten));
      if (uitTabel) uitKalender = uitTabel;
    }

    if (nachten && uitKalender) {
      var pakket = uitKalender * aantal;
      totaal += pakket;
      regels.push({
        naam: T.nightsLabel(nachten) + " × " + T.personsLabel(aantal) +
              " (" + euro(uitKalender) + T.perPersonTotal + ")",
        bedrag: pakket
      });
    } else if (nachten && perDag) {
      var verblijf = nachten * aantal * perDag;
      totaal += verblijf;
      regels.push({
        naam: (variant ? variant.naam : T.stayDefault) + ", " + T.nightsLabel(nachten) +
              " × " + T.personsLabel(aantal) +
              " (" + euro(perDag) + T.perPersonPerDay + ")",
        bedrag: verblijf
      });

      var piekNachten = hoogseizoenNachten(van, nachten);
      if (piekNachten && reis.hoogseizoen.toeslagPerPersoonPerNacht) {
        var toeslag = piekNachten * aantal * reis.hoogseizoen.toeslagPerPersoonPerNacht;
        totaal += toeslag;
        regels.push({
          naam: reis.hoogseizoen.naam + ", " + T.nightsLabel(piekNachten),
          bedrag: toeslag
        });
      }
    }

    antwoorden().forEach(function (keuze) {
      if (!keuze.prijs) return;
      var bedrag = keuze.prijs * aantal;
      totaal += bedrag;
      regels.push({ naam: keuze.antwoord + " × " + aantal, bedrag: bedrag });
    });

    // Opties zonder bedrag (Joey doet er een voorstel voor) komen wel in de
    // aanvraag terecht, maar veranderen het totaal niet.
    gekozenOpties().forEach(function (optie) {
      if (typeof optie.bedrag !== "number" || !optie.bedrag) return;
      var bedrag = optie.bedrag * aantal * (optie.teken === "-" ? -1 : 1);
      totaal += bedrag;
      regels.push({ naam: optie.naam + " × " + aantal, bedrag: bedrag });
    });

    gekozenExtras().forEach(function (extra) {
      var bedrag = extra.prijs * aantal;
      totaal += bedrag;
      regels.push({ naam: extra.naam + " × " + aantal, bedrag: bedrag });
    });

    regelsBox.innerHTML = "";
    if (!regels.length) {
      // Alleen wie nog een periode moet kiezen, krijgt die hint; in alle
      // andere gevallen valt er simpelweg nog niets te rekenen.
      regelsBox.innerHTML = '<p class="booking__empty">' +
        ((!nachten && reis.periodeVrij) ? T.chooseFirst : T.noEstimate) + '</p>';
    }
    regels.forEach(function (regel) {
      var naam = document.createElement("dt");
      naam.textContent = regel.naam;
      var bedrag = document.createElement("dd");
      bedrag.textContent = regel.bedrag < 0
        ? euroMetTeken(regel.bedrag, "-") : euro(regel.bedrag);
      regelsBox.appendChild(naam);
      regelsBox.appendChild(bedrag);
    });

    // Een totaal tonen we alleen als het verblijf zelf een prijs heeft.
    // Losse activiteiten optellen zou als reissom gelezen kunnen worden.
    var heeftTotaal = Boolean(nachten && (perDag || uitKalender));
    totaalBox.textContent = heeftTotaal ? euro(totaal) : "-";
    whatsappKnop.href = "https://wa.me/" + WHATSAPP + "?text=" +
      encodeURIComponent(bericht(heeftTotaal ? euro(totaal) : ""));
  }

  /* --- Het bericht dat verstuurd wordt ---------------------------------- */
  function bericht(totaalTekst) {
    var aantal = personen();
    var regels = [T.requestFor(reis.naam), ""];

    if (nachten) {
      regels.push(T.periodLabel + schrijfDatum(van) + T.periodTo + schrijfDatum(tot) +
                  " (" + T.nightsLabel(nachten) + ")");
    } else {
      regels.push(T.periodLabel + T.periodNotChosen);
    }
    regels.push(T.personsLabel2 + aantal);

    antwoorden().forEach(function (keuze) {
      regels.push(keuze.vraag + " " + keuze.antwoord);
    });

    var gekozen = gekozenOpties();
    if (gekozen.length) {
      regels.push(T.optionsLabel + gekozen.map(function (optie) {
        return optie.naam;
      }).join(", "));
    }

    var lijst = gekozenExtras();
    regels.push(T.extraActivitiesLabel + (lijst.length
      ? lijst.map(function (e) { return e.naam; }).join(", ")
      : T.none));

    if (totaalTekst) regels.push(T.totalEstimate + totaalTekst);

    regels.push("");
    regels.push(T.nameLabel + (document.getElementById("naam").value || "-"));
    regels.push(T.emailLabel + (document.getElementById("email").value || "-"));
    regels.push(T.phoneLabel + (document.getElementById("telefoon").value || "-"));

    var opmerking = document.getElementById("opmerkingen").value.trim();
    if (opmerking) {
      regels.push("");
      regels.push(T.remarksLabel);
      regels.push(opmerking);
    }
    return regels.join("\n");
  }

  /* --- Versturen als e-mail --------------------------------------------- */
  formulier.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!reis) {
      foutmelding.hidden = false;
      foutmelding.textContent = T.chooseDestinationFirst;
      return;
    }

    var naam = document.getElementById("naam");
    var email = document.getElementById("email");
    var ontbreekt = [];
    if (!naam.value.trim()) ontbreekt.push(T.yourName);
    if (!email.value.trim()) ontbreekt.push(T.yourEmail);

    if (ontbreekt.length) {
      foutmelding.hidden = false;
      foutmelding.textContent = T.fillIn(ontbreekt);
      (ontbreekt[0] === T.yourName ? naam : email).focus();
      return;
    }
    if (!nachten && !reis.prijsOpAanvraag && reis.periodeVrij) {
      foutmelding.hidden = false;
      foutmelding.textContent = T.chooseFirst;
      return;
    }

    foutmelding.hidden = true;
    var totaal = totaalBox.textContent === "-" ? "" : totaalBox.textContent;
    window.location.href = "mailto:" + MAIL +
      "?subject=" + encodeURIComponent(T.requestFor(reis.naam)) +
      "&body=" + encodeURIComponent(bericht(totaal));
  });

  /* --- Onthouden wat er is ingevuld --------------------------------------
     Gaat iemand terug naar de kalender om de periode te wijzigen, dan staat
     alles bij terugkomst nog ingevuld. Het blijft in de browser van de
     bezoeker; er gaat niets naar buiten. Elke reis heeft zijn eigen plekje,
     zodat het wisselen van bestemming niets door elkaar haalt.
     ---------------------------------------------------------------------- */
  var TEKSTVELDEN = ["naam", "email", "telefoon", "opmerkingen"];

  function bewaarSleutel() {
    return "novakse-aanvraag-" + reisSleutel;
  }

  function bewaar() {
    if (!reisSleutel) return;
    var staat = { personen: personenVeld.value, keuzes: {}, extras: [], velden: {} };
    formulier.querySelectorAll('input[type="radio"]:checked').forEach(function (knop) {
      if (knop.name === "reis") return;
      staat.keuzes[knop.name] = knop.value;
    });
    extrasBox.querySelectorAll('input[type="checkbox"]:checked').forEach(function (vak) {
      staat.extras.push(vak.value);
    });
    staat.opties = [];
    if (optiesBox) {
      optiesBox.querySelectorAll('input[type="checkbox"]:checked').forEach(function (vak) {
        staat.opties.push(vak.value);
      });
    }
    TEKSTVELDEN.forEach(function (id) {
      var veld = document.getElementById(id);
      if (veld) staat.velden[id] = veld.value;
    });
    try { window.sessionStorage.setItem(bewaarSleutel(), JSON.stringify(staat)); } catch (fout) { /* privémodus */ }
  }

  function herstel() {
    var ruw;
    try { ruw = window.sessionStorage.getItem(bewaarSleutel()); } catch (fout) { return; }
    if (!ruw) return;
    var staat;
    try { staat = JSON.parse(ruw); } catch (fout) { return; }

    if (staat.personen) personenVeld.value = staat.personen;
    Object.keys(staat.keuzes || {}).forEach(function (naam) {
      var knop = formulier.querySelector(
        'input[name="' + naam + '"][value="' + staat.keuzes[naam] + '"]');
      if (knop) knop.checked = true;
    });
    (staat.extras || []).forEach(function (waarde) {
      var vak = extrasBox.querySelector('input[type="checkbox"][value="' + waarde + '"]');
      if (vak) vak.checked = true;
    });
    (staat.opties || []).forEach(function (waarde) {
      var vak = optiesBox &&
        optiesBox.querySelector('input[type="checkbox"][value="' + waarde + '"]:not([disabled])');
      if (vak) vak.checked = true;
    });
    Object.keys(staat.velden || {}).forEach(function (id) {
      var veld = document.getElementById(id);
      if (veld && staat.velden[id]) veld.value = staat.velden[id];
    });
    stelPersonenIn();
  }

  TEKSTVELDEN.forEach(function (id) {
    var veld = document.getElementById(id);
    if (veld) veld.addEventListener("input", bewaar);
  });
  formulier.addEventListener("change", bewaar);

  /* --- Een bestemming kiezen ---------------------------------------------
     handmatig = iemand klikt de reis hier aan. De periode hoort bij de
     kalender van de vorige reis en vervalt dan; het webadres gaat mee, zodat
     verversen of terugkomen dezelfde reis laat zien.
     ---------------------------------------------------------------------- */
  function kiesReis(sleutel, handmatig) {
    if (!alleReizen[sleutel]) return;

    var vorige = reisSleutel;
    reisSleutel = sleutel;
    reis = alleReizen[sleutel];
    extras = reis.extras || [];
    varianten = reis.varianten || [];
    vragen = reis.vragen || [];
    maxPersonen = reis.maxPersonen || 12;
    minPersonen = reis.minimumPersonen || 1;
    opslag = reis.opslagPerPersoonPerNacht || 0;
    laadPrijstabel();

    if (handmatig) {
      // Wisselt iemand van reis, dan hoort de periode bij de kalender van de
      // vorige reis en vervalt hij. Bij de eerste keuze blijft een periode
      // die uit het webadres kwam wel staan.
      if (vorige && vorige !== sleutel) {
        van = null;
        tot = null;
        nachten = 0;
      }
      onthoudInAdres();
      foutmelding.hidden = true;
    }

    vinkReisAan();
    toonReisTeksten();
    bouwVragen();
    bouwVarianten();
    bouwExtras();
    stelPersonenIn();
    toonKalender();
    bouwOpties();
    toonStappen(true);
    herstel();
    nummerStappen();
    ververs();
  }

  function onthoudInAdres() {
    if (!window.history || !window.history.replaceState) return;
    var nieuw = new URLSearchParams();
    nieuw.set("reis", reisSleutel);
    if (van && tot) {
      nieuw.set("van", alsTekst(van));
      nieuw.set("tot", alsTekst(tot));
    }
    try {
      window.history.replaceState(null, "", window.location.pathname + "?" + nieuw.toString());
    } catch (fout) { /* oudere browser */ }
  }

  /* --- Opstarten --------------------------------------------------------- */
  bouwReiskeuze();
  leesPeriode();

  var uitAdres = (params.get("reis") || "").toLowerCase();
  if (alleReizen[uitAdres]) {
    kiesReis(uitAdres, false);
  } else if (data.standaard && alleReizen[data.standaard]) {
    kiesReis(data.standaard, false);
  } else {
    // Nog geen bestemming: alleen de eerste stap staat open.
    if (voorbeeld) voorbeeld.hidden = true;
    if (terugLink) terugLink.hidden = true;
    if (headerKalender) {
      headerKalender.href = "reizen.html";
      headerKalender.textContent = T.allTripsLabel;
    }
    toonStappen(false);
    nummerStappen();
    ververs();
  }

  /* --- Aantal personen uit het webadres ----------------------------------
     De reiszoeker op de home- en reizenpagina geeft het aantal reizigers mee.
     Dit gebeurt na kiesReis(), zodat het binnen het minimum en maximum van de
     gekozen reis valt en voorrang heeft op een eerder bewaarde keuze.
     ---------------------------------------------------------------------- */
  var personenUitAdres = parseInt(params.get("personen"), 10);
  if (!isNaN(personenUitAdres)) {
    personenVeld.value = Math.min(maxPersonen, Math.max(minPersonen, personenUitAdres));
    // Via personenGewijzigd(), zodat de kalender meteen de dagprijzen voor dit
    // aantal personen laat zien.
    personenGewijzigd();
  }
})();
