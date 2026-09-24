/* ==========================================================================
   Falun - kalender met de totaalprijs van de gekozen periode

   De bezoeker kiest zelf een aankomstdag en een reisduur (4 of 5 dagen).
   De prijs verschilt per datum, omdat de huisjes niet het hele seizoen
   hetzelfde kosten. Daarnaast kan de bezoeker drie dingen aanvinken die het
   bedrag veranderen: de vlucht zelf regelen, de huurauto zelf regelen en
   begeleiding op het ijs erbij nemen.

   ALLES WAT JOEY BIJWERKT, STAAT IN data/falun-prijzen.json, niet in dit
   bestand. Daar staan het seizoen, de basisprijzen, de toeslag per nacht en
   de opties. Alle zes de taalversies lezen datzelfde bestand, dus je werkt de
   prijzen een keer bij. Hier hoeft niets gewijzigd te worden.

   Hoe de prijs wordt opgebouwd:

     basisprijs van de gekozen duur
     + de toeslag van elke nacht die je boekt (kan ook negatief zijn)
     - 250 als je de vlucht zelf regelt
     - 100 als je de huurauto zelf regelt
     + begeleiding, alleen als de hele reis binnen het begeleidingsvenster valt

   Een verblijf van 4 dagen telt 3 nachten, 5 dagen telt 4 nachten.

   In de kalender zelf staan geen bedragen bij de dagen. Pas als de bezoeker
   een aankomstdag aanklikt, verschijnt de totaalprijs voor de hele groep.

   Gaat er iets mis in het blokje, dan blijft de gewone tekst staan die er
   zonder JavaScript ook al is.
   ========================================================================== */
(function () {
  "use strict";

  var I18N = {
    nl: {
      months: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
      dayHeaders: ["ma", "di", "wo", "do", "vr", "za", "zo"],
      durationLegend: "Hoe lang blijf je?",
      personsLegend: "Met hoeveel personen?",
      personsLabel: function (n) { return n + (n === 1 ? " persoon" : " personen"); },
      personsHint: "Jullie slapen samen in een huisje. Hoe voller het huisje, hoe lager de prijs per persoon.",
      days: function (n) { return n + " dagen"; },
      nights: function (n) { return n + (n === 1 ? " nacht" : " nachten"); },
      arrivalLegend: "Wanneer kom je aan?",
      legendAvailable: "Beschikbaar",
      legendBooked: "Al bezet",
      legendChosen: "Jouw keuze",
      legendUncertain: "IJs onzeker",
      uncertainNote: "De dagen met een streepje kun je gewoon boeken, maar in december is het ijs nog het onzekerst.",
      searchKeptDay: "Je aankomstdag hebben we overgenomen. Kies hieronder nog hoe lang je blijft.",
      searchDayGone: "Je gekozen aankomstdag kan niet. Kies hieronder een andere dag.",
      optionsLegend: "Wat wil je zelf regelen?",
      flightSelf: "Ik regel mijn vlucht zelf",
      flightSelfHint: "De heen- en terugvlucht zit anders bij de prijs in",
      carSelf: "Ik regel mijn vervoer naar de accommodatie zelf",
      carSelfHint: "De huurauto zit anders bij de prijs in",
      guiding: "Begeleiding op het ijs",
      guidingLegend: "Wil je begeleiding op het ijs?",
      guidingNone: "Geen",
      guidingDays: function (n) { return n + (n === 1 ? " dag" : " dagen"); },
      guidingExplain: function (bedrag) { return "Joey schaatst mee, met een kampvuur onderweg, lunch en vika\u0027s. " + bedrag + " per dag voor de hele groep, dus hoe meer jullie zijn, hoe minder het per persoon kost."; },
      guidingHint: "Joey schaatst mee, met een kampvuur onderweg, lunch en vika's",
      guidingWindow: function (van, tot) { return "Alleen mogelijk van " + van + " tot en met " + tot; },
      guidingOutside: function (van, tot) { return "Niet mogelijk in de periode die je gekozen hebt. Begeleiding kan van " + van + " tot en met " + tot + "."; },
      guidingPriceUnknown: "Prijs volgt",
      biggerCar: "Grotere huurauto",
      biggerCarHint: "Meer ruimte voor bagage en schaatsen",
      priceOnRequest: "Joey stuurt een voorstel met prijs",
      guidingIncludes: "Inbegrepen: ",
      summaryTitle: "Jouw reis",
      lineTrip: function (dagen) { return "Falun, " + dagen + " dagen"; },
      lineArrival: "Aankomst",
      linePersons: "Personen",
      lineFlight: "Vlucht zelf geregeld",
      lineCar: "Vervoer zelf geregeld",
      lineGuiding: "Begeleiding op het ijs",
      total: "Totaal per persoon",
      totalFor: function (n) { return "Totaal voor " + n + (n === 1 ? " persoon" : " personen"); },
      book: "Boek en reken af",
      chooseFirst: "Kies eerst een aankomstdag.",
      perPerson: "per persoon",
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " tot " + tot; },
      bookedSr: function (wat) { return " " + wat + ", niet beschikbaar"; },
      availableAria: function (datum) { return datum + ", beschikbaar"; },
      tooLate: "In die periode past je verblijf niet meer binnen het seizoen.",
      overlap: "In die periode zit een week die al bezet is."
    },
    en: {
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      dayHeaders: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
      durationLegend: "How long are you staying?",
      personsLegend: "How many people?",
      personsLabel: function (n) { return n + (n === 1 ? " person" : " people"); },
      personsHint: "You share one cabin. The fuller the cabin, the lower the price per person.",
      days: function (n) { return n + " days"; },
      nights: function (n) { return n + (n === 1 ? " night" : " nights"); },
      arrivalLegend: "When do you arrive?",
      legendAvailable: "Available",
      legendBooked: "Booked",
      legendChosen: "Your choice",
      legendUncertain: "Ice uncertain",
      uncertainNote: "You can book the dashed days as normal, but in December the ice is least certain.",
      searchKeptDay: "We kept your arrival day. Choose how long you are staying below.",
      searchDayGone: "Your chosen arrival day is not available. Pick another day below.",
      optionsLegend: "What do you want to arrange yourself?",
      flightSelf: "I'll arrange my own flight",
      flightSelfHint: "Otherwise the return flight is included in the price",
      carSelf: "I'll arrange my own transport to the accommodation",
      carSelfHint: "Otherwise the rental car is included in the price",
      guiding: "Guiding on the ice",
      guidingLegend: "Do you want guiding on the ice?",
      guidingNone: "None",
      guidingDays: function (n) { return n + (n === 1 ? " day" : " days"); },
      guidingExplain: function (bedrag) { return "Joey skates along, with a campfire on the way, lunch and vika\u0027s. " + bedrag + " per day for the whole group, so the more of you there are, the less it costs each."; },
      guidingHint: "Joey skates along, with a campfire on the way, lunch and vika's",
      guidingWindow: function (van, tot) { return "Only available from " + van + " to " + tot; },
      guidingOutside: function (van, tot) { return "Not available in the period you selected. Guiding runs from " + van + " to " + tot + "."; },
      guidingPriceUnknown: "Price to follow",
      biggerCar: "Larger rental car",
      biggerCarHint: "More room for luggage and skates",
      priceOnRequest: "Joey will send a proposal with the price",
      guidingIncludes: "Included: ",
      summaryTitle: "Your trip",
      lineTrip: function (dagen) { return "Falun, " + dagen + " days"; },
      lineArrival: "Arrival",
      linePersons: "People",
      lineFlight: "Own flight",
      lineCar: "Own transport",
      lineGuiding: "Guiding on the ice",
      total: "Total per person",
      totalFor: function (n) { return "Total for " + n + (n === 1 ? " person" : " people"); },
      book: "Book and pay",
      chooseFirst: "Choose an arrival day first.",
      perPerson: "per person",
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " to " + tot; },
      bookedSr: function (wat) { return " " + wat + ", not available"; },
      availableAria: function (datum) { return datum + ", available"; },
      tooLate: "Your stay no longer fits within the season in that period.",
      overlap: "That period includes a week that is already booked."
    },
    de: {
      months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      dayHeaders: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
      durationLegend: "Wie lange bleibst du?",
      personsLegend: "Mit wie vielen Personen?",
      personsLabel: function (n) { return n + (n === 1 ? " Person" : " Personen"); },
      personsHint: "Ihr schlaft zusammen in einer Hütte. Je voller die Hütte, desto niedriger der Preis pro Person.",
      days: function (n) { return n + " Tage"; },
      nights: function (n) { return n + (n === 1 ? " Nacht" : " Nächte"); },
      arrivalLegend: "Wann kommst du an?",
      legendAvailable: "Verfügbar",
      legendBooked: "Belegt",
      legendChosen: "Deine Wahl",
      legendUncertain: "Eis unsicher",
      uncertainNote: "Die gestrichelten Tage kannst du ganz normal buchen, aber im Dezember ist das Eis am unsichersten.",
      searchKeptDay: "Deinen Anreisetag haben wir übernommen. Wähle unten noch, wie lange du bleibst.",
      searchDayGone: "Dein gewählter Anreisetag ist nicht möglich. Wähle unten einen anderen Tag.",
      optionsLegend: "Was möchtest du selbst organisieren?",
      flightSelf: "Ich buche meinen Flug selbst",
      flightSelfHint: "Sonst ist der Hin- und Rückflug im Preis enthalten",
      carSelf: "Ich organisiere meine Anreise zur Unterkunft selbst",
      carSelfHint: "Sonst ist der Mietwagen im Preis enthalten",
      guiding: "Begleitung auf dem Eis",
      guidingLegend: "Möchtest du Begleitung auf dem Eis?",
      guidingNone: "Keine",
      guidingDays: function (n) { return n + (n === 1 ? " Tag" : " Tage"); },
      guidingExplain: function (bedrag) { return "Joey läuft mit, mit Lagerfeuer unterwegs, Mittagessen und Vika\u0027s. " + bedrag + " pro Tag für die ganze Gruppe - je mehr ihr seid, desto weniger kostet es pro Person."; },
      guidingHint: "Joey läuft mit, mit Lagerfeuer unterwegs, Mittagessen und Vika's",
      guidingWindow: function (van, tot) { return "Nur möglich von " + van + " bis " + tot; },
      guidingOutside: function (van, tot) { return "Im gewählten Zeitraum nicht möglich. Begleitung gibt es von " + van + " bis " + tot + "."; },
      guidingPriceUnknown: "Preis folgt",
      biggerCar: "Größerer Mietwagen",
      biggerCarHint: "Mehr Platz für Gepäck und Schlittschuhe",
      priceOnRequest: "Joey schickt dir ein Angebot mit Preis",
      guidingIncludes: "Inbegriffen: ",
      summaryTitle: "Deine Reise",
      lineTrip: function (dagen) { return "Falun, " + dagen + " Tage"; },
      lineArrival: "Ankunft",
      linePersons: "Personen",
      lineFlight: "Flug selbst gebucht",
      lineCar: "Anreise selbst organisiert",
      lineGuiding: "Begleitung auf dem Eis",
      total: "Gesamt pro Person",
      totalFor: function (n) { return "Gesamt für " + n + (n === 1 ? " Person" : " Personen"); },
      book: "Buchen und bezahlen",
      chooseFirst: "Wähle zuerst einen Ankunftstag.",
      perPerson: "pro Person",
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " bis " + tot; },
      bookedSr: function (wat) { return " " + wat + ", nicht verfügbar"; },
      availableAria: function (datum) { return datum + ", verfügbar"; },
      tooLate: "In diesem Zeitraum passt dein Aufenthalt nicht mehr in die Saison.",
      overlap: "In diesem Zeitraum liegt eine Woche, die schon belegt ist."
    },
    sv: {
      months: ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
      dayHeaders: ["mån", "tis", "ons", "tor", "fre", "lör", "sön"],
      durationLegend: "Hur länge stannar du?",
      personsLegend: "Hur många personer?",
      personsLabel: function (n) { return n + (n === 1 ? " person" : " personer"); },
      personsHint: "Ni bor tillsammans i en stuga. Ju fullare stugan är, desto lägre pris per person.",
      days: function (n) { return n + " dagar"; },
      nights: function (n) { return n + (n === 1 ? " natt" : " nätter"); },
      arrivalLegend: "När kommer du?",
      legendAvailable: "Tillgänglig",
      legendBooked: "Bokad",
      legendChosen: "Ditt val",
      legendUncertain: "Isen osäker",
      uncertainNote: "Dagarna med streck går att boka som vanligt, men i december är isen som mest osäker.",
      searchKeptDay: "Vi har behållit din ankomstdag. Välj nedan hur länge du stannar.",
      searchDayGone: "Din valda ankomstdag går inte. Välj en annan dag nedan.",
      optionsLegend: "Vad vill du ordna själv?",
      flightSelf: "Jag ordnar flyget själv",
      flightSelfHint: "Annars ingår tur- och returflyget i priset",
      carSelf: "Jag ordnar transporten till boendet själv",
      carSelfHint: "Annars ingår hyrbilen i priset",
      guiding: "Guidning på isen",
      guidingLegend: "Vill du ha guidning på isen?",
      guidingNone: "Ingen",
      guidingDays: function (n) { return n + (n === 1 ? " dag" : " dagar"); },
      guidingExplain: function (bedrag) { return "Joey åker med, med lägereld på vägen, lunch och vikor. " + bedrag + " per dag för hela gruppen, så ju fler ni är, desto mindre kostar det per person."; },
      guidingHint: "Joey åker med, med lägereld på vägen, lunch och vikor",
      guidingWindow: function (van, tot) { return "Endast möjligt från " + van + " till " + tot; },
      guidingOutside: function (van, tot) { return "Inte möjligt under perioden du valt. Guidning finns från " + van + " till " + tot + "."; },
      guidingPriceUnknown: "Pris kommer",
      biggerCar: "Större hyrbil",
      biggerCarHint: "Mer plats för bagage och skridskor",
      priceOnRequest: "Joey skickar ett förslag med pris",
      guidingIncludes: "Ingår: ",
      summaryTitle: "Din resa",
      lineTrip: function (dagen) { return "Falun, " + dagen + " dagar"; },
      lineArrival: "Ankomst",
      linePersons: "Personer",
      lineFlight: "Eget flyg",
      lineCar: "Egen transport",
      lineGuiding: "Guidning på isen",
      total: "Totalt per person",
      totalFor: function (n) { return "Totalt för " + n + (n === 1 ? " person" : " personer"); },
      book: "Boka och betala",
      chooseFirst: "Välj först en ankomstdag.",
      perPerson: "per person",
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " till " + tot; },
      bookedSr: function (wat) { return " " + wat + ", inte tillgänglig"; },
      availableAria: function (datum) { return datum + ", tillgänglig"; },
      tooLate: "Din vistelse ryms inte längre inom säsongen under den perioden.",
      overlap: "Den perioden innehåller en vecka som redan är bokad."
    },
    no: {
      months: ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"],
      dayHeaders: ["man", "tir", "ons", "tor", "fre", "lør", "søn"],
      durationLegend: "Hvor lenge blir du?",
      personsLegend: "Hvor mange personer?",
      personsLabel: function (n) { return n + (n === 1 ? " person" : " personer"); },
      personsHint: "Dere bor sammen i en hytte. Jo fullere hytta er, desto lavere pris per person.",
      days: function (n) { return n + " dager"; },
      nights: function (n) { return n + (n === 1 ? " natt" : " netter"); },
      arrivalLegend: "Når kommer du?",
      legendAvailable: "Tilgjengelig",
      legendBooked: "Opptatt",
      legendChosen: "Ditt valg",
      legendUncertain: "Isen usikker",
      uncertainNote: "Dagene med strek kan du bestille som vanlig, men i desember er isen mest usikker.",
      searchKeptDay: "Vi har beholdt ankomstdagen din. Velg nedenfor hvor lenge du blir.",
      searchDayGone: "Ankomstdagen du valgte går ikke. Velg en annen dag nedenfor.",
      optionsLegend: "Hva vil du ordne selv?",
      flightSelf: "Jeg ordner flyet selv",
      flightSelfHint: "Ellers er tur-retur-flyet inkludert i prisen",
      carSelf: "Jeg ordner transporten til overnattingsstedet selv",
      carSelfHint: "Ellers er leiebilen inkludert i prisen",
      guiding: "Guiding på isen",
      guidingLegend: "Vil du ha veiledning på isen?",
      guidingNone: "Ingen",
      guidingDays: function (n) { return n + (n === 1 ? " dag" : " dager"); },
      guidingExplain: function (bedrag) { return "Joey blir med, med bål underveis, lunsj og vikaer. " + bedrag + " per dag for hele gruppen, så jo flere dere er, desto mindre koster det per person."; },
      guidingHint: "Joey går med, med bål underveis, lunsj og vikaer",
      guidingWindow: function (van, tot) { return "Bare mulig fra " + van + " til " + tot; },
      guidingOutside: function (van, tot) { return "Ikke mulig i perioden du har valgt. Veiledning finnes fra " + van + " til " + tot + "."; },
      guidingPriceUnknown: "Pris kommer",
      biggerCar: "Større leiebil",
      biggerCarHint: "Mer plass til bagasje og skøyter",
      priceOnRequest: "Joey sender et forslag med pris",
      guidingIncludes: "Inkludert: ",
      summaryTitle: "Turen din",
      lineTrip: function (dagen) { return "Falun, " + dagen + " dager"; },
      lineArrival: "Ankomst",
      linePersons: "Personer",
      lineFlight: "Eget fly",
      lineCar: "Egen transport",
      lineGuiding: "Guiding på isen",
      total: "Totalt per person",
      totalFor: function (n) { return "Totalt for " + n + (n === 1 ? " person" : " personer"); },
      book: "Book og betal",
      chooseFirst: "Velg en ankomstdag først.",
      perPerson: "per person",
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " til " + tot; },
      bookedSr: function (wat) { return " " + wat + ", ikke tilgjengelig"; },
      availableAria: function (datum) { return datum + ", tilgjengelig"; },
      tooLate: "Oppholdet ditt passer ikke lenger inn i sesongen i den perioden.",
      overlap: "Den perioden inneholder en uke som allerede er opptatt."
    },
    fi: {
      months: ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"],
      dayHeaders: ["ma", "ti", "ke", "to", "pe", "la", "su"],
      durationLegend: "Kuinka kauan viivyt?",
      personsLegend: "Kuinka monta henkilöä?",
      personsLabel: function (n) { return n + (n === 1 ? " henkilö" : " henkilöä"); },
      personsHint: "Majoitutte yhdessä mökissä. Mitä täydempi mökki, sitä edullisempi hinta per henkilö.",
      days: function (n) { return n + " päivää"; },
      nights: function (n) { return n + (n === 1 ? " yö" : " yötä"); },
      arrivalLegend: "Milloin saavut?",
      legendAvailable: "Vapaa",
      legendBooked: "Varattu",
      legendChosen: "Valintasi",
      legendUncertain: "Jää epävarma",
      uncertainNote: "Katkoviivalla merkityt päivät voi varata normaalisti, mutta joulukuussa jää on epävarmimmillaan.",
      searchKeptDay: "Säilytimme saapumispäiväsi. Valitse alta, kuinka kauan viivyt.",
      searchDayGone: "Valitsemasi saapumispäivä ei onnistu. Valitse alta toinen päivä.",
      optionsLegend: "Mitä haluat järjestää itse?",
      flightSelf: "Järjestän lentoni itse",
      flightSelfHint: "Muuten meno-paluulento sisältyy hintaan",
      carSelf: "Järjestän kuljetuksen majoitukseen itse",
      carSelfHint: "Muuten vuokra-auto sisältyy hintaan",
      guiding: "Opastus jäällä",
      guidingLegend: "Haluatko opastusta jäällä?",
      guidingNone: "Ei",
      guidingDays: function (n) { return n + (n === 1 ? " päivä" : " päivää"); },
      guidingExplain: function (bedrag) { return "Joey luistelee mukana, nuotio matkan varrella, lounas ja vikat. " + bedrag + " päivässä koko ryhmälle, eli mitä useampi teitä on, sitä vähemmän se maksaa per henkilö."; },
      guidingHint: "Joey luistelee mukana, nuotio matkan varrella, lounas ja vikat",
      guidingWindow: function (van, tot) { return "Mahdollista vain " + van + " - " + tot; },
      guidingOutside: function (van, tot) { return "Ei mahdollista valitsemanasi ajankohtana. Opastusta on saatavilla " + van + " - " + tot + "."; },
      guidingPriceUnknown: "Hinta julkaistaan myöhemmin",
      biggerCar: "Isompi vuokra-auto",
      biggerCarHint: "Enemmän tilaa matkatavaroille ja luistimille",
      priceOnRequest: "Joey lähettää ehdotuksen hintoineen",
      guidingIncludes: "Sisältyy: ",
      summaryTitle: "Matkasi",
      lineTrip: function (dagen) { return "Falun, " + dagen + " päivää"; },
      lineArrival: "Saapuminen",
      linePersons: "Henkilöä",
      lineFlight: "Oma lento",
      lineCar: "Oma kuljetus",
      lineGuiding: "Opastus jäällä",
      total: "Yhteensä / henkilö",
      totalFor: function (n) { return "Yhteensä, " + n + (n === 1 ? " henkilö" : " henkilöä"); },
      book: "Varaa ja maksa",
      chooseFirst: "Valitse ensin saapumispäivä.",
      perPerson: "/ henkilö",
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " - " + tot; },
      bookedSr: function (wat) { return " " + wat + ", ei vapaa"; },
      availableAria: function (datum) { return datum + ", vapaa"; },
      tooLate: "Oleskelusi ei enää mahdu kauteen kyseisenä ajankohtana.",
      overlap: "Kyseiselle ajanjaksolle osuu jo varattu viikko."
    }
  };

  var LANG = (document.documentElement.lang || "nl").slice(0, 2).toLowerCase();
  var T = I18N[LANG] || I18N.nl;

  var box = document.querySelector("[data-falun-calendar]");
  if (!box) return;

  /* Twee manieren waarop dit blokje gebruikt wordt:

     losse kalender  - de hele kaart met het aantal personen, de opties en de
                       samenvatting met een knop om af te rekenen;
     periode-modus   - de kalender staat als stap in het aanvraagformulier op
                       boeken.html. Daar vraagt het formulier zelf al naar het
                       aantal personen en staan de opties bij de details, dus
                       toont de kalender alleen de reisduur en de dagen. Wat de
                       bezoeker kiest, gaat als gebeurtenis terug naar het
                       formulier. Zet aan met data-falun-modus="periode". */
  var periodeModus = box.getAttribute("data-falun-modus") === "periode";

  /* De gegevens komen uit een apart bestand, zodat alle zes de taalversies
     dezelfde prijzen tonen en Joey ze maar op een plek hoeft bij te werken.
     Het pad staat in data-falun-calendar. Staat daar niets, dan wordt het
     blokje in de pagina zelf gelezen (zo werkt de preview). */
  var bronPad = box.getAttribute("data-falun-calendar");
  if (bronPad) {
    fetch(bronPad)
      .then(function (respons) { return respons.json(); })
      .then(function (data) { start(data); })
      .catch(function () { /* de gewone tekst in de pagina blijft staan */ });
    return;
  }

  var blokje = box.querySelector("script.calendar__data");
  if (!blokje) return;
  try { start(JSON.parse(blokje.textContent)); } catch (fout) { return; }

  function start(data) {
  if (!data || !data.seizoenStart || !data.seizoenEind || !data.basisprijs) return;

  /* ------------------------------------------------------------------
     Kleine hulpjes voor datums. Alles rekent in hele dagen, zonder tijd,
     zodat zomertijd geen rare sprongen geeft.
     ------------------------------------------------------------------ */
  function alsDatum(tekst) {
    var d = String(tekst).split("-");
    return new Date(+d[0], +d[1] - 1, +d[2]);
  }
  function alsTekst(datum) {
    function twee(n) { return (n < 10 ? "0" : "") + n; }
    return datum.getFullYear() + "-" + twee(datum.getMonth() + 1) + "-" + twee(datum.getDate());
  }
  function schrijfDatum(datum) {
    return datum.getDate() + " " + T.months[datum.getMonth()] + " " + datum.getFullYear();
  }
  function plusDagen(datum, aantal) {
    var uit = new Date(datum.getTime());
    uit.setDate(uit.getDate() + aantal);
    return uit;
  }
  function euro(bedrag) {
    return "€" + Math.round(bedrag).toLocaleString("nl-NL");
  }

  var seizoenVan = alsDatum(data.seizoenStart);
  var seizoenTot = alsDatum(data.seizoenEind);
  var duren = data.duur && data.duur.length ? data.duur : [4, 5];

  /* De huisjesprijzen komen van Falun Strandby en staan in Zweedse kronen per
     huisje per nacht, precies zoals hun boekingssite ze toont. De basisnacht
     zit al in de pakketprijs; alleen het verschil met die basis telt mee, en
     dat wordt gedeeld door het aantal personen in een huisje en omgerekend
     naar euro's. */
  var huisjes = data.huisjePerNachtSEK || {};
  var basisSEK = typeof data.huisjeBasisSEK === "number" ? data.huisjeBasisSEK : 0;
  var koers = data.wisselkoersSEK || 1;

  var personenKeuze = data.personen || { min: 1, max: 4, standaard: 2 };
  var basisPersonen = data.basisPersonen || 2;
  var autoPerReis = data.autoPerReisEUR || 0;
  var doorgeven = typeof data.kortingDoorgeven === "number" ? data.kortingDoorgeven : 1;

  /* Wordt het duurder dan de basisprijs, dan telt dat helemaal mee. Wordt het
     goedkoper doordat er meer mensen in het huisje slapen, dan wordt maar een
     deel van dat voordeel doorgegeven - de rest blijft marge. */
  function demp(verschil) {
    return verschil > 0 ? verschil : verschil * doorgeven;
  }

  /* Het huisje kost per nacht een bedrag in kronen; dat wordt gedeeld door de
     mensen die erin slapen. Het verschil met de basisnacht bij basisPersonen
     is wat er bij de prijs op of af gaat. */
  function nachtToeslag(datum, personen) {
    if (!basisSEK) return 0;
    var sek = huisjes[alsTekst(datum)];
    if (typeof sek !== "number") sek = basisSEK;
    var werkelijk = sek / koers / personen;
    var basis = basisSEK / koers / basisPersonen;
    return demp(werkelijk - basis);
  }

  /* Wat de huurauto deze reiziger kost. Dat is ook wat eraf gaat als hij hem
     zelf regelt, zodat die twee niet uit elkaar kunnen lopen. */
  function autoDeel(personen) {
    if (!autoPerReis) return 0;
    var basis = autoPerReis / basisPersonen;
    return basis + demp(autoPerReis / personen - basis);
  }
  var opties = data.opties || {};
  var vluchtBedrag = Math.abs(opties.vluchtZelf || 0);
  var groterAuto = opties.groterAuto || null;
  var groterAutoPrijs = groterAuto && typeof groterAuto.prijs === "number" ? groterAuto.prijs : null;
  var begeleiding = opties.begeleiding || null;
  var begeleidingVan = begeleiding && begeleiding.van ? alsDatum(begeleiding.van) : null;
  var begeleidingTot = begeleiding && begeleiding.tot ? alsDatum(begeleiding.tot) : null;
  var begeleidingPerDag = begeleiding && typeof begeleiding.prijsPerDag === "number" ? begeleiding.prijsPerDag : null;
  var begeleidingPerPersoon = !begeleiding || begeleiding.perPersoon !== false;

  var bezet = (data.bezet || []).map(function (blok) {
    return { van: alsDatum(blok.van), tot: alsDatum(blok.tot), wat: blok.wat || T.legendBooked };
  });

  /* Periode waarin het ijs nog onzeker is. Die dagen blijven gewoon te boeken;
     ze krijgen alleen een streepje en een regel uitleg onder de kalender. */
  var onzeker = data.ijsOnzeker && data.ijsOnzeker.van && data.ijsOnzeker.tot
    ? { van: alsDatum(data.ijsOnzeker.van), tot: alsDatum(data.ijsOnzeker.tot) }
    : null;

  function onzekerOp(datum) {
    return !!onzeker && datum >= onzeker.van && datum < onzeker.tot;
  }

  var duur = duren[0];
  var personen = personenKeuze.standaard || 2;

  /* In periode-modus telt het aantal personen uit het formulier. Dat staat in
     data-personen en wordt bijgewerkt zodra de bezoeker het daar verandert. */
  function leesPersonenUitFormulier() {
    var uit = parseInt(box.getAttribute("data-personen"), 10);
    if (isNaN(uit)) return;
    personen = Math.min(personenKeuze.max || 4, Math.max(personenKeuze.min || 1, uit));
  }
  if (periodeModus) leesPersonenUitFormulier();
  var aankomst = null;
  var vluchtZelf = false;
  var autoZelf = false;
  var begeleidingDagen = 0;

  function nachtenVan(dagen) { return dagen - 1; }

  /* Begeleiding kost een bedrag per reisdag. Rekent Joey per groep in plaats
     van per persoon, dan wordt dat bedrag over de deelnemers verdeeld.

     Dit bedrag wordt bewust niet afgerond: bij drie personen loopt een vooraf
     afgerond deelbedrag uit de pas met de server, en dan staat er een euro
     meer of minder op het scherm dan er afgeschreven wordt. */
  function begeleidingKostenRuw(dagenBegeleid, personen) {
    if (begeleidingPerDag === null || !dagenBegeleid) return 0;
    var totaal = begeleidingPerDag * dagenBegeleid;
    return begeleidingPerPersoon ? totaal : totaal / personen;
  }

  /* Alleen om te tonen; in het totaal telt het onafgeronde bedrag mee. */
  function begeleidingKosten(dagenBegeleid, personen) {
    return Math.round(begeleidingKostenRuw(dagenBegeleid, personen));
  }

  function bezetOp(datum) {
    for (var i = 0; i < bezet.length; i++) {
      if (datum >= bezet[i].van && datum < bezet[i].tot) return bezet[i];
    }
    return null;
  }

  /* Een aankomstdag kan alleen als het hele verblijf vrij is en binnen het
     seizoen past. De vertrekdag zelf telt niet als nacht. */
  function kanAankomen(datum, dagen) {
    var nachten = nachtenVan(dagen);
    if (datum < seizoenVan) return false;
    if (plusDagen(datum, nachten) > seizoenTot) return false;
    for (var i = 0; i < nachten; i++) {
      if (bezetOp(plusDagen(datum, i))) return false;
    }
    return true;
  }

  /* De basisprijs plus de toeslag van elke nacht. Een nacht die niet in de
     tabel staat, telt als nul: dan geldt gewoon de basisprijs. */
  function verblijfPrijs(datum, dagen) {
    var basis = data.basisprijs[String(dagen)];
    if (typeof basis !== "number") return null;
    var totaal = basis;
    for (var i = 0; i < nachtenVan(dagen); i++) {
      totaal += nachtToeslag(plusDagen(datum, i), personen);
    }
    totaal += autoDeel(personen) - autoDeel(basisPersonen);
    return totaal;
  }

  function begeleidingKan(datum, dagen) {
    if (!begeleiding || begeleidingPerDag === null) return false;
    if (!begeleidingVan || !begeleidingTot) return false;
    var vertrek = plusDagen(datum, nachtenVan(dagen));
    return datum >= begeleidingVan && vertrek <= begeleidingTot;
  }

  /* Het bedrag dat de bezoeker uiteindelijk betaalt. Dezelfde berekening
     staat serverside in api/_falun-prijs.js; die is leidend. */
  function totaalPrijs() {
    if (!aankomst) return null;
    var totaal = verblijfPrijs(aankomst, duur);
    if (totaal === null) return null;
    if (vluchtZelf) totaal -= vluchtBedrag;
    if (autoZelf) totaal -= autoDeel(personen);
    if (begeleidingDagen && begeleidingKan(aankomst, duur)) totaal += begeleidingKostenRuw(begeleidingDagen, personen);
    return Math.round(totaal);
  }

  /* ------------------------------------------------------------------
     Opbouw van het scherm
     ------------------------------------------------------------------ */
  var duurBox = document.createElement("div");
  duurBox.className = "falun-cal__block";

  var personenBox = document.createElement("div");
  personenBox.className = "falun-cal__block";

  var raster = document.createElement("div");
  raster.className = "calendar__months";

  var legenda = document.createElement("div");
  legenda.className = "calendar__legend";
  legenda.innerHTML =
    '<span class="calendar__legend-item"><span class="calendar__chip is-vrij"></span>' + T.legendAvailable + "</span>" +
    (onzeker ? '<span class="calendar__legend-item"><span class="calendar__chip is-onzeker"></span>' + T.legendUncertain + "</span>" : "") +
    '<span class="calendar__legend-item"><span class="calendar__chip is-bezet"></span>' + T.legendBooked + "</span>" +
    '<span class="calendar__legend-item"><span class="calendar__chip is-gekozen"></span>' + T.legendChosen + "</span>";

  var optieBox = document.createElement("div");
  optieBox.className = "falun-cal__block";

  var begeleidingBox = document.createElement("div");
  begeleidingBox.className = "falun-cal__block";

  var samenvatting = document.createElement("div");
  samenvatting.className = "falun-cal__summary";
  samenvatting.setAttribute("aria-live", "polite");

  box.innerHTML = "";
  box.appendChild(duurBox);
  if (!periodeModus) box.appendChild(personenBox);
  box.appendChild(legenda);
  box.appendChild(raster);
  if (onzeker) {
    var notitie = document.createElement("p");
    notitie.className = "falun-cal__note";
    notitie.textContent = T.uncertainNote;
    box.appendChild(notitie);
  }
  if (!periodeModus) {
    box.appendChild(optieBox);
    box.appendChild(begeleidingBox);
    box.appendChild(samenvatting);
  }

  function tekenDuur() {
    var knoppen = duren.map(function (dagen) {
      var actief = dagen === duur;
      return '<button type="button" class="falun-cal__duur' + (actief ? " is-actief" : "") + '"' +
        ' data-duur="' + dagen + '" aria-pressed="' + (actief ? "true" : "false") + '">' +
        "<span>" + T.days(dagen) + "</span>" +
        '<span class="falun-cal__duur-nachten">' + T.nights(nachtenVan(dagen)) + "</span>" +
        "</button>";
    }).join("");

    duurBox.innerHTML =
      '<p class="falun-cal__legend">' + T.durationLegend + "</p>" +
      '<div class="falun-cal__duren">' + knoppen + "</div>";

    duurBox.querySelectorAll("[data-duur]").forEach(function (knop) {
      knop.addEventListener("click", function () {
        var nieuw = parseInt(knop.getAttribute("data-duur"), 10);
        if (nieuw === duur) return;
        duur = nieuw;
        // De gekozen dag kan bij een langer verblijf niet meer passen.
        if (aankomst && !kanAankomen(aankomst, duur)) aankomst = null;
        if (begeleidingDagen > duur) begeleidingDagen = duur;
        tekenAlles();
      });
    });
  }

  function tekenPersonen() {
    var knoppen = "";
    for (var n = personenKeuze.min || 1; n <= (personenKeuze.max || 4); n++) {
      var actief = n === personen;
      knoppen += '<button type="button" class="falun-cal__duur' + (actief ? " is-actief" : "") + '"' +
        ' data-personen="' + n + '" aria-pressed="' + (actief ? "true" : "false") + '">' +
        "<span>" + T.personsLabel(n) + "</span></button>";
    }

    personenBox.innerHTML =
      '<p class="falun-cal__legend">' + T.personsLegend + "</p>" +
      '<div class="falun-cal__duren">' + knoppen + "</div>" +
      '<p class="falun-cal__note falun-cal__note--inline">' + T.personsHint + "</p>";

    personenBox.querySelectorAll("[data-personen]").forEach(function (knop) {
      knop.addEventListener("click", function () {
        var nieuw = parseInt(knop.getAttribute("data-personen"), 10);
        if (nieuw === personen) return;
        personen = nieuw;
        tekenAlles();
      });
    });
  }

  function tekenRaster() {
    raster.innerHTML = "";
    var maand = new Date(seizoenVan.getFullYear(), seizoenVan.getMonth(), 1);
    var laatste = new Date(seizoenTot.getFullYear(), seizoenTot.getMonth(), 1);

    while (maand <= laatste) {
      var maandBox = document.createElement("div");
      maandBox.className = "calendar__month";

      var titel = document.createElement("p");
      titel.className = "calendar__month-name";
      titel.textContent = T.months[maand.getMonth()] + " " + maand.getFullYear();
      maandBox.appendChild(titel);

      var dagen = document.createElement("div");
      dagen.className = "calendar__grid";

      T.dayHeaders.forEach(function (naam) {
        var kop = document.createElement("span");
        kop.className = "calendar__dayname";
        kop.textContent = naam;
        dagen.appendChild(kop);
      });

      // Maandag is de eerste kolom; getDay() geeft zondag als 0.
      var eerste = new Date(maand.getFullYear(), maand.getMonth(), 1);
      var schuif = (eerste.getDay() + 6) % 7;
      for (var g = 0; g < schuif; g++) {
        var gat = document.createElement("span");
        gat.className = "calendar__cell is-empty";
        dagen.appendChild(gat);
      }

      var dagenInMaand = new Date(maand.getFullYear(), maand.getMonth() + 1, 0).getDate();
      for (var d = 1; d <= dagenInMaand; d++) {
        dagen.appendChild(tekenDag(new Date(maand.getFullYear(), maand.getMonth(), d)));
      }

      maandBox.appendChild(dagen);
      raster.appendChild(maandBox);
      maand = new Date(maand.getFullYear(), maand.getMonth() + 1, 1);
    }
  }

  function tekenDag(datum) {
    var blok = bezetOp(datum);
    var binnenSeizoen = datum >= seizoenVan && datum <= seizoenTot;

    if (!binnenSeizoen || blok || !kanAankomen(datum, duur)) {
      var uit = document.createElement("span");
      uit.className = "calendar__cell " + (blok ? "is-bezet" : "is-buiten");
      uit.innerHTML = '<span class="calendar__daynr">' + datum.getDate() + "</span>";
      if (blok) {
        uit.title = T.bookedTitle(blok.wat, schrijfDatum(blok.van), schrijfDatum(blok.tot));
        var uitleg = document.createElement("span");
        uitleg.className = "sr-only";
        uitleg.textContent = T.bookedSr(blok.wat);
        uit.appendChild(uitleg);
      }
      return uit;
    }

    var knop = document.createElement("button");
    knop.type = "button";
    knop.className = "calendar__cell is-vrij";
    knop.innerHTML =
      '<span class="calendar__daynr">' + datum.getDate() + "</span>";
    knop.setAttribute("aria-label", T.availableAria(schrijfDatum(datum)));
    if (onzekerOp(datum)) knop.classList.add("is-onzeker");

    if (aankomst && datum.getTime() === aankomst.getTime()) {
      knop.classList.add("is-gekozen", "is-start");
    } else if (aankomst) {
      // De nachten na de aankomstdag kleuren mee, zodat de periode zichtbaar is.
      var vertrek = plusDagen(aankomst, nachtenVan(duur));
      if (datum > aankomst && datum <= vertrek) knop.classList.add("is-tussen");
    }

    knop.addEventListener("click", function () {
      aankomst = datum;
      if (begeleidingDagen && !begeleidingKan(aankomst, duur)) begeleidingDagen = 0;
      tekenAlles();
    });
    return knop;
  }

  /* De vinkjes van de losse kalender. Ze komen uit dezelfde optieLijst() als
     die het aanvraagformulier krijgt, zodat de namen en bedragen niet uit
     elkaar kunnen lopen. De grotere huurauto blijft hier weg: die kent
     api/_falun-prijs.js nog niet, en afrekenen moet kloppen met wat de server
     uitrekent. In het aanvraagformulier kan hij wel gekozen worden, want dat
     is een aanvraag en geen betaling. */
  function staatAan(sleutel) {
    if (sleutel === "vlucht") return vluchtZelf;
    if (sleutel === "auto") return autoZelf;
    return false;
  }

  function tekenOpties() {
    var regels = optieLijst().filter(function (optie) {
      // "groter-auto" kent api/_falun-prijs.js nog niet, en begeleiding heeft
      // hieronder een eigen blok waarin je het aantal dagen kiest.
      return optie.sleutel !== "groter-auto" && optie.sleutel !== "begeleiding";
    }).map(function (optie) {
      var bedrag = optie.bedrag === null ? ""
        : optie.teken + " " + euro(optie.bedrag);
      return '<label class="extra' + (optie.uit ? " is-uit" : "") + '">' +
        '<input type="checkbox" class="extra__check" data-optie="' + optie.sleutel + '"' +
          (staatAan(optie.sleutel) ? " checked" : "") + (optie.uit ? " disabled" : "") + " />" +
        '<span class="extra__name">' + optie.naam +
          '<span class="extra__hint">' + optie.toelichting + "</span>" +
        "</span>" +
        '<span class="extra__price">' + bedrag + "</span>" +
      "</label>";
    }).join("");

    optieBox.innerHTML =
      '<p class="falun-cal__legend">' + T.optionsLegend + "</p>" +
      '<div class="booking__extras">' + regels + "</div>";

    optieBox.querySelectorAll("[data-optie]").forEach(function (veld) {
      veld.addEventListener("change", function () {
        var welke = veld.getAttribute("data-optie");
        if (welke === "vlucht") vluchtZelf = veld.checked;
        if (welke === "auto") autoZelf = veld.checked;
        tekenSamenvatting();
      });
    });
  }

  function tekenBegeleiding() {
    if (begeleidingPerDag === null) { begeleidingBox.innerHTML = ""; return; }

    var mag = aankomst ? begeleidingKan(aankomst, duur) : false;
    if (!mag) {
      // Buiten de periode waarin Joey meegaat: laat zien tot wanneer het kan.
      begeleidingBox.innerHTML =
        '<p class="falun-cal__legend">' + T.guidingLegend + "</p>" +
        '<p class="falun-cal__note falun-cal__note--inline">' +
          (aankomst ? T.guidingOutside(schrijfDatum(begeleidingVan), schrijfDatum(begeleidingTot))
                  : T.guidingWindow(schrijfDatum(begeleidingVan), schrijfDatum(begeleidingTot))) +
        "</p>";
      return;
    }

    var knoppen = "";
    for (var n = 0; n <= duur; n++) {
      var actief = n === begeleidingDagen;
      var prijs = n === 0 ? "" : '<span class="falun-cal__duur-nachten">+ ' + euro(begeleidingKosten(n, personen)) + "</span>";
      knoppen += '<button type="button" class="falun-cal__duur' + (actief ? " is-actief" : "") + '"' +
        ' data-begeleiding="' + n + '" aria-pressed="' + (actief ? "true" : "false") + '">' +
        "<span>" + (n === 0 ? T.guidingNone : T.guidingDays(n)) + "</span>" + prijs + "</button>";
    }

    begeleidingBox.innerHTML =
      '<p class="falun-cal__legend">' + T.guidingLegend + "</p>" +
      '<div class="falun-cal__duren">' + knoppen + "</div>" +
      '<p class="falun-cal__note falun-cal__note--inline">' + T.guidingExplain(euro(begeleidingPerDag)) + "</p>";

    begeleidingBox.querySelectorAll("[data-begeleiding]").forEach(function (knop) {
      knop.addEventListener("click", function () {
        var n = parseInt(knop.getAttribute("data-begeleiding"), 10);
        if (n === begeleidingDagen) return;
        begeleidingDagen = n;
        tekenBegeleiding();
        tekenSamenvatting();
      });
    });
  }

  function tekenSamenvatting() {
    if (!aankomst) {
      samenvatting.innerHTML = '<p class="falun-cal__hint">' + T.chooseFirst + "</p>";
      return;
    }

    var verblijf = verblijfPrijs(aankomst, duur);
    var perPersoon = totaalPrijs();
    // Alle bedragen hierboven zijn per persoon; afgerekend wordt voor de hele
    // groep. Zelfde rekenwijze als api/_falun-prijs.js: eerst per persoon
    // afronden, dan vermenigvuldigen.
    var totaal = perPersoon * personen;
    var vertrek = plusDagen(aankomst, nachtenVan(duur));

    var regels =
      "<dt>" + T.lineTrip(duur) + "</dt><dd>" + euro(verblijf) + "</dd>" +
      "<dt>" + T.lineArrival + "</dt><dd>" + schrijfDatum(aankomst) + "</dd>" +
      "<dt>" + T.linePersons + "</dt><dd>" + T.personsLabel(personen) + "</dd>";
    if (vluchtZelf) regels += "<dt>" + T.lineFlight + "</dt><dd>- " + euro(vluchtBedrag) + "</dd>";
    if (autoZelf) regels += "<dt>" + T.lineCar + "</dt><dd>- " + euro(autoDeel(personen)) + "</dd>";
    if (begeleidingDagen && begeleidingKan(aankomst, duur)) {
      regels += "<dt>" + T.lineGuiding + " (" + T.guidingDays(begeleidingDagen) + ")</dt><dd>+ " +
        euro(begeleidingKosten(begeleidingDagen, personen)) + "</dd>";
    }

    // Wat er naar de betaalpagina meegaat. Het bedrag wordt daar opnieuw
    // uitgerekend; deze regels zijn er zodat de bezoeker ziet waarvoor hij
    // betaalt en Joey het in Stripe terugleest.
    var params = new URLSearchParams();
    params.set("reis", "Falun");
    params.set("aankomst", alsTekst(aankomst));
    params.set("dagen", String(duur));
    params.set("personen", String(personen));
    if (vluchtZelf) params.set("vlucht", "zelf");
    if (autoZelf) params.set("auto", "zelf");
    if (begeleidingDagen && begeleidingKan(aankomst, duur)) params.set("begeleiding", String(begeleidingDagen));

    samenvatting.innerHTML =
      '<p class="falun-cal__summary-title">' + T.summaryTitle + "</p>" +
      '<dl class="booking__lines">' + regels +
        (personen > 1 ? "<dt>" + T.total + "</dt><dd>" + euro(perPersoon) + "</dd>" : "") +
      "</dl>" +
      '<div class="booking__total"><span>' + T.totalFor(personen) + "</span><strong>" + euro(totaal) + "</strong></div>" +
      '<p class="falun-cal__period">' + schrijfDatum(aankomst) + " - " + schrijfDatum(vertrek) + "</p>" +
      '<a class="btn btn--dark falun-cal__book" href="' +
        (box.getAttribute("data-betaalpagina") || data.betaalpagina || "uitchecken.html") +
        "?" + params.toString() + '">' +
        T.book + "</a>";
  }

  /* --- Terugkoppeling naar het aanvraagformulier -------------------------
     De kalender weet wat een dag kost en wat de opties kosten; het formulier
     weet wie er meegaat en wat er verder gekozen is. Daarom stuurt de kalender
     zijn uitkomst door in plaats van dat het formulier de prijzen nog eens
     zelf uitrekent. Alle bedragen zijn per persoon.
     ---------------------------------------------------------------------- */
  function optieLijst() {
    var mag = aankomst ? begeleidingKan(aankomst, duur) : false;
    var lijst = [];

    if (groterAuto) {
      lijst.push({
        sleutel: "groter-auto",
        naam: T.biggerCar,
        toelichting: groterAutoPrijs === null ? T.priceOnRequest : T.biggerCarHint,
        teken: "+",
        bedrag: groterAutoPrijs
      });
    }

    lijst.push({
      sleutel: "vlucht",
      naam: T.flightSelf,
      toelichting: T.flightSelfHint,
      teken: "-",
      bedrag: vluchtBedrag
    });

    lijst.push({
      sleutel: "auto",
      naam: T.carSelf,
      toelichting: T.carSelfHint,
      teken: "-",
      bedrag: Math.round(autoDeel(personen))
    });

    if (begeleiding) {
      var hint = T.guidingHint;
      if (begeleidingPerDag === null) {
        hint = T.guidingPriceUnknown;
      } else if (!mag && begeleidingVan && begeleidingTot) {
        hint = aankomst ? T.guidingOutside(schrijfDatum(begeleidingVan), schrijfDatum(begeleidingTot))
                        : T.guidingWindow(schrijfDatum(begeleidingVan), schrijfDatum(begeleidingTot));
      }
      lijst.push({
        sleutel: "begeleiding",
        naam: T.guiding,
        toelichting: hint,
        inbegrepen: begeleiding.inbegrepen || [],
        inbegrepenLabel: T.guidingIncludes,
        teken: "+",
        dagen: begeleidingDagen,
        bedrag: begeleidingPerDag === null ? null : begeleidingKosten(begeleidingDagen || duur, personen),
        uit: !mag
      });
    }

    return lijst;
  }

  function meldPeriode() {
    if (!periodeModus) return;
    var vertrek = aankomst ? plusDagen(aankomst, nachtenVan(duur)) : null;
    var bericht = {
      van: aankomst ? alsTekst(aankomst) : null,
      tot: vertrek ? alsTekst(vertrek) : null,
      dagen: duur,
      nachten: nachtenVan(duur),
      // Op hele euro's, net als het bedrag dat in de kalender bij de dag staat.
      verblijf: aankomst ? Math.round(verblijfPrijs(aankomst, duur)) : null,
      personenMin: personenKeuze.min || 1,
      personenMax: personenKeuze.max || 4,
      opties: optieLijst()
    };
    box.dispatchEvent(new CustomEvent("novakse:periode", { detail: bericht, bubbles: true }));
  }

  // Verandert het aantal personen in het formulier, dan kloppen de dagprijzen
  // niet meer; het formulier laat dat hiermee weten.
  box.addEventListener("novakse:herteken", function () {
    leesPersonenUitFormulier();
    tekenAlles();
  });

  function tekenAlles() {
    tekenDuur();
    if (!periodeModus) tekenPersonen();
    tekenRaster();
    if (!periodeModus) {
      tekenOpties();
      tekenBegeleiding();
      tekenSamenvatting();
    }
    meldPeriode();
  }

  /* In periode-modus mag het formulier een periode meegeven die uit het
     webadres komt, zodat een gedeelde link dezelfde dagen laat zien. Past die
     niet binnen het seizoen of de vrije dagen, dan staat er nog geen dag
     gekozen.

     Op de reispagina zelf komt die wens uit de reiszoeker op de home- en
     reizenpagina: die zet van, tot en personen in het webadres. Falun boek je
     voor 4 of 5 dagen; vroeg iemand om een andere lengte, dan houden we wel
     zijn aankomstdag aan en zegt een regel erboven hoe het zit. */
  function uitZoeker() {
    var zoek = new URLSearchParams(window.location.search);
    var van = zoek.get("van") || "";
    var tot = zoek.get("tot") || "";
    var wens = { dag: null, dagen: NaN };

    var aantal = parseInt(zoek.get("personen"), 10);
    if (!isNaN(aantal)) {
      personen = Math.min(personenKeuze.max || 4, Math.max(personenKeuze.min || 1, aantal));
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(van)) return wens;
    wens.dag = alsDatum(van);
    if (/^\d{4}-\d{2}-\d{2}$/.test(tot)) {
      var nachten = Math.round((alsDatum(tot) - wens.dag) / 86400000);
      if (nachten > 0) wens.dagen = nachten + 1;
    }
    return wens;
  }

  var wens = periodeModus ? null : uitZoeker();

  var gevraagdeDuur = periodeModus ? parseInt(box.getAttribute("data-dagen"), 10) : wens.dagen;
  if (duren.indexOf(gevraagdeDuur) !== -1) duur = gevraagdeDuur;

  var gevraagdeDag = null;
  if (periodeModus) {
    var uitAdres = box.getAttribute("data-aankomst");
    if (uitAdres && /^\d{4}-\d{2}-\d{2}$/.test(uitAdres)) gevraagdeDag = alsDatum(uitAdres);
  } else {
    gevraagdeDag = wens.dag;
  }

  // Er staat geen dag vooraf klaar: de totaalprijs verschijnt pas als de
  // bezoeker zelf een aankomstdag kiest.
  aankomst = (gevraagdeDag && kanAankomen(gevraagdeDag, duur)) ? gevraagdeDag : null;

  // De regel boven de kalender: alleen als er echt een wens meekwam die we
  // niet helemaal konden inwilligen.
  if (gevraagdeDag && !periodeModus) {
    var melding = "";
    if (aankomst !== gevraagdeDag) melding = T.searchDayGone;
    else if (duren.indexOf(wens.dagen) === -1) melding = T.searchKeptDay;
    if (melding) {
      var regel = document.createElement("p");
      regel.className = "falun-cal__note falun-cal__note--search";
      regel.textContent = melding;
      box.insertBefore(regel, box.firstChild);
    }
  }

  tekenAlles();
  }
})();
