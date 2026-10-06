/* ==========================================================================
   Falun - kalender met de totaalprijs van de gekozen periode

   De bezoeker klikt in de kalender een aankomstdag en daarna een vertrekdag
   aan. De reisduur volgt uit die twee dagen. Iedere vertrekdag vanaf
   minimumDagen (data/falun-prijzen.json, nu 4 dagen) na aankomst is te
   kiezen; een maximum is er niet, alleen het seizoen en de bezette weken.
   De prijs verschilt per datum, omdat de huisjes niet het hele seizoen
   hetzelfde kosten. Daarnaast kan de bezoeker drie dingen aanvinken die het
   bedrag veranderen: de vlucht zelf regelen, de huurauto zelf regelen en
   begeleiding op het ijs erbij nemen.

   ALLES WAT JOEY BIJWERKT, STAAT IN data/falun-prijzen.json, niet in dit
   bestand. Daar staan het seizoen, de basisprijzen, de toeslag per nacht en
   de opties. Alle zes de taalversies lezen datzelfde bestand, dus je werkt de
   prijzen een keer bij. Hier hoeft niets gewijzigd te worden.

   Hoe de prijs wordt opgebouwd:

     basisprijs van de gekozen duur (langer dan in de tabel staat: de langste
       duur uit de tabel + extraDagPerPersoon voor elke dag extra)
     + de toeslag van elke nacht die je boekt (kan ook negatief zijn)
     - 250 als je de vlucht zelf regelt
     + de huurauto voor het echte aantal dagen (autoPerDagEUR), min het deel
       dat al in de basisprijs zit (autoInBasisprijsDagen)
     - het eigen deel van de huurauto als je je vervoer zelf regelt
     + begeleiding, alleen als de hele reis binnen het begeleidingsvenster valt
       (staat uit zolang begeleiding.prijsPerDag null is)

   Een verblijf van 4 dagen telt 3 nachten, 5 dagen telt 4 nachten, enzovoort.

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
      prevMonth: "Vorige maand",
      nextMonth: "Volgende maand",
      adultsLabel: "Volwassenen",
      adultsAge: "12 jaar en ouder",
      childrenLabel: "Kinderen",
      childrenAge: "2 t/m 11 jaar",
      babiesLabel: "Baby's",
      babiesAge: "0 en 1 jaar",
      fewerOf: function (naam) { return "Eén minder: " + naam; },
      moreOf: function (naam) { return "Eén meer: " + naam; },
      perPersonPrice: function (bedrag) { return "€" + bedrag + " p.p."; },
      categoryLine: function (naam, n) { return naam + " (" + n + ")"; },
      childNote: "Kinderen en baby's betalen een lagere prijs voor het vliegdeel van het pakket. De rest van de reis kost voor iedereen hetzelfde. De leeftijd telt op de dag van aankomst.",
      ageRuleNote: "Minstens één reiziger moet 21 jaar of ouder zijn.",
      childFlightSelfNote: "Regel je je vlucht zelf, dan vervalt de lagere prijs voor kinderen en baby's: er is dan geen vliegdeel meer om te verlagen.",
      priceLoading: "Prijs wordt berekend...",
      priceUnavailable: "We konden de prijs met kinderen nu niet laten zien. Het totaal zie je op de volgende stap.",
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
      guidingFewer: "Eén dag begeleiding minder",
      guidingMore: "Eén dag begeleiding meer",
      guidingDays: function (n) { return n + (n === 1 ? " dag" : " dagen"); },
      guidingExplain: function (bedrag, extra) { return "Joey schaatst mee, met een kampvuur onderweg, lunch en fika\u0027s. " + bedrag + " per dag voor 1 persoon, + " + extra + " per dag voor elke extra persoon, dus hoe meer jullie zijn, hoe minder het per persoon kost."; },
      guidingHint: "Joey schaatst mee, met een kampvuur onderweg, lunch en fika's",
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
      groupAmount: function (bedrag, n) { return bedrag + " voor " + n + " personen"; },
      book: "Boek en reken af",
      chooseFirst: "Kies eerst een aankomstdag.",
      chooseDeparture: "Kies nu in de kalender je vertrekdag.",
      personsFewer: "Eén persoon minder",
      personsMore: "Eén persoon meer",
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
      prevMonth: "Previous month",
      nextMonth: "Next month",
      adultsLabel: "Adults",
      adultsAge: "12 years and older",
      childrenLabel: "Children",
      childrenAge: "2 to 11 years",
      babiesLabel: "Babies",
      babiesAge: "0 and 1 years",
      fewerOf: function (naam) { return "One fewer: " + naam; },
      moreOf: function (naam) { return "One more: " + naam; },
      perPersonPrice: function (bedrag) { return "€" + bedrag + " per person"; },
      categoryLine: function (naam, n) { return naam + " (" + n + ")"; },
      childNote: "Children and babies pay a lower price for the flight part of the package. The rest of the trip costs the same for everyone. Age counts on the day of arrival.",
      ageRuleNote: "At least one traveller must be 21 or older.",
      childFlightSelfNote: "If you arrange your own flight, the lower price for children and babies no longer applies: there is no flight part left to reduce.",
      priceLoading: "Calculating price...",
      priceUnavailable: "We could not show the price with children right now. You will see the total in the next step.",
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
      guidingFewer: "One day less guiding",
      guidingMore: "One day more guiding",
      guidingDays: function (n) { return n + (n === 1 ? " day" : " days"); },
      guidingExplain: function (bedrag, extra) { return "Joey skates along, with a campfire on the way, lunch and fika breaks. " + bedrag + " per day for 1 person, + " + extra + " per day for each additional person, so the more of you there are, the less it costs each."; },
      guidingHint: "Joey skates along, with a campfire on the way, lunch and fika breaks",
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
      groupAmount: function (amount, n) { return amount + " for " + n + " people"; },
      book: "Book and pay",
      chooseFirst: "Choose an arrival day first.",
      chooseDeparture: "Now choose your departure day in the calendar.",
      personsFewer: "One person fewer",
      personsMore: "One person more",
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
      prevMonth: "Vorheriger Monat",
      nextMonth: "Nächster Monat",
      adultsLabel: "Erwachsene",
      adultsAge: "ab 12 Jahren",
      childrenLabel: "Kinder",
      childrenAge: "2 bis 11 Jahre",
      babiesLabel: "Babys",
      babiesAge: "0 und 1 Jahr",
      fewerOf: function (naam) { return "Weniger: " + naam; },
      moreOf: function (naam) { return "Mehr: " + naam; },
      perPersonPrice: function (bedrag) { return "€" + bedrag + " pro Person"; },
      categoryLine: function (naam, n) { return naam + " (" + n + ")"; },
      childNote: "Kinder und Babys zahlen für den Flugteil des Pakets weniger. Der Rest der Reise kostet für alle gleich viel. Das Alter zählt am Anreisetag.",
      ageRuleNote: "Mindestens eine reisende Person muss 21 Jahre oder älter sein.",
      childFlightSelfNote: "Wenn du deinen Flug selbst buchst, entfällt der niedrigere Preis für Kinder und Babys: Es gibt dann keinen Flugteil mehr, der günstiger sein könnte.",
      priceLoading: "Preis wird berechnet...",
      priceUnavailable: "Den Preis mit Kindern können wir gerade nicht anzeigen. Den Gesamtpreis siehst du im nächsten Schritt.",
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
      guidingFewer: "Einen Tag weniger Begleitung",
      guidingMore: "Einen Tag mehr Begleitung",
      guidingDays: function (n) { return n + (n === 1 ? " Tag" : " Tage"); },
      guidingExplain: function (bedrag, extra) { return "Joey läuft mit, mit Lagerfeuer unterwegs, Mittagessen und Fika-Pausen. " + bedrag + " pro Tag für 1 Person, + " + extra + " pro Tag für jede weitere Person - je mehr ihr seid, desto weniger kostet es pro Person."; },
      guidingHint: "Joey läuft mit, mit Lagerfeuer unterwegs, Mittagessen und Fika-Pausen",
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
      groupAmount: function (betrag, n) { return betrag + " für " + n + " Personen"; },
      book: "Buchen und bezahlen",
      chooseFirst: "Wähle zuerst einen Ankunftstag.",
      chooseDeparture: "Wähle jetzt im Kalender deinen Abreisetag.",
      personsFewer: "Eine Person weniger",
      personsMore: "Eine Person mehr",
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
      prevMonth: "Föregående månad",
      nextMonth: "Nästa månad",
      adultsLabel: "Vuxna",
      adultsAge: "12 år och äldre",
      childrenLabel: "Barn",
      childrenAge: "2 till 11 år",
      babiesLabel: "Bebisar",
      babiesAge: "0 och 1 år",
      fewerOf: function (naam) { return "Färre: " + naam; },
      moreOf: function (naam) { return "Fler: " + naam; },
      perPersonPrice: function (bedrag) { return "€" + bedrag + " per person"; },
      categoryLine: function (naam, n) { return naam + " (" + n + ")"; },
      childNote: "Barn och bebisar betalar ett lägre pris för flygdelen av paketet. Resten av resan kostar lika mycket för alla. Åldern räknas på ankomstdagen.",
      ageRuleNote: "Minst en resenär måste vara 21 år eller äldre.",
      childFlightSelfNote: "Ordnar du flyget själv gäller inte längre det lägre priset för barn och bebisar: då finns ingen flygdel kvar att sänka.",
      priceLoading: "Priset beräknas...",
      priceUnavailable: "Vi kunde inte visa priset med barn just nu. Totalen ser du i nästa steg.",
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
      guidingFewer: "En dag mindre guidning",
      guidingMore: "En dag mer guidning",
      guidingDays: function (n) { return n + (n === 1 ? " dag" : " dagar"); },
      guidingExplain: function (bedrag, extra) { return "Joey åker med, med lägereld på vägen, lunch och fika. " + bedrag + " per dag för 1 person, + " + extra + " per dag för varje extra person, så ju fler ni är, desto mindre kostar det per person."; },
      guidingHint: "Joey åker med, med lägereld på vägen, lunch och fika",
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
      groupAmount: function (belopp, n) { return belopp + " för " + n + " personer"; },
      book: "Boka och betala",
      chooseFirst: "Välj först en ankomstdag.",
      chooseDeparture: "Välj nu din avresedag i kalendern.",
      personsFewer: "En person färre",
      personsMore: "En person fler",
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
      prevMonth: "Forrige måned",
      nextMonth: "Neste måned",
      adultsLabel: "Voksne",
      adultsAge: "12 år og eldre",
      childrenLabel: "Barn",
      childrenAge: "2 til 11 år",
      babiesLabel: "Babyer",
      babiesAge: "0 og 1 år",
      fewerOf: function (naam) { return "Færre: " + naam; },
      moreOf: function (naam) { return "Flere: " + naam; },
      perPersonPrice: function (bedrag) { return "€" + bedrag + " per person"; },
      categoryLine: function (naam, n) { return naam + " (" + n + ")"; },
      childNote: "Barn og babyer betaler en lavere pris for flydelen av pakken. Resten av reisen koster det samme for alle. Alderen regnes på ankomstdagen.",
      ageRuleNote: "Minst én reisende må være 21 år eller eldre.",
      childFlightSelfNote: "Ordner du flyet selv, gjelder ikke lenger den lavere prisen for barn og babyer: da er det ingen flydel igjen å redusere.",
      priceLoading: "Prisen beregnes...",
      priceUnavailable: "Vi kunne ikke vise prisen med barn akkurat nå. Totalen ser du i neste steg.",
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
      guidingFewer: "Én dag mindre guiding",
      guidingMore: "Én dag mer guiding",
      guidingDays: function (n) { return n + (n === 1 ? " dag" : " dager"); },
      guidingExplain: function (bedrag, extra) { return "Joey blir med, med bål underveis, lunsj og fika. " + bedrag + " per dag for 1 person, + " + extra + " per dag for hver ekstra person, så jo flere dere er, desto mindre koster det per person."; },
      guidingHint: "Joey blir med, med bål underveis, lunsj og fika",
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
      groupAmount: function (belop, n) { return belop + " for " + n + " personer"; },
      book: "Book og betal",
      chooseFirst: "Velg en ankomstdag først.",
      chooseDeparture: "Velg nå avreisedagen din i kalenderen.",
      personsFewer: "Én person færre",
      personsMore: "Én person flere",
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
      prevMonth: "Edellinen kuukausi",
      nextMonth: "Seuraava kuukausi",
      adultsLabel: "Aikuiset",
      adultsAge: "12-vuotiaat ja vanhemmat",
      childrenLabel: "Lapset",
      childrenAge: "2-11-vuotiaat",
      babiesLabel: "Vauvat",
      babiesAge: "0-1-vuotiaat",
      fewerOf: function (naam) { return "Vähemmän: " + naam; },
      moreOf: function (naam) { return "Lisää: " + naam; },
      perPersonPrice: function (bedrag) { return "€" + bedrag + " / henkilö"; },
      categoryLine: function (naam, n) { return naam + " (" + n + ")"; },
      childNote: "Lapset ja vauvat maksavat paketin lentoosuudesta alemman hinnan. Muu matka maksaa kaikille saman. Ikä lasketaan saapumispäivänä.",
      ageRuleNote: "Vähintään yhden matkustajan on oltava 21-vuotias tai vanhempi.",
      childFlightSelfNote: "Jos järjestät lentosi itse, lasten ja vauvojen alempi hinta ei enää päde: silloin ei ole lentoosuutta, jota voisi alentaa.",
      priceLoading: "Hintaa lasketaan...",
      priceUnavailable: "Lasten kanssa hintaa ei voitu nyt näyttää. Kokonaishinnan näet seuraavassa vaiheessa.",
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
      guidingFewer: "Yksi opastuspäivä vähemmän",
      guidingMore: "Yksi opastuspäivä enemmän",
      guidingDays: function (n) { return n + (n === 1 ? " päivä" : " päivää"); },
      guidingExplain: function (bedrag, extra) { return "Joey luistelee mukana, nuotio matkan varrella, lounas ja fika-tauot. " + bedrag + " päivässä 1 hengelle, + " + extra + " päivässä jokaisesta lisähenkilöstä, eli mitä useampi teitä on, sitä vähemmän se maksaa per henkilö."; },
      guidingHint: "Joey luistelee mukana, nuotio matkan varrella, lounas ja fika-tauot",
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
      groupAmount: function (summa, n) { return summa + ", " + n + " henkilöä"; },
      book: "Varaa ja maksa",
      chooseFirst: "Valitse ensin saapumispäivä.",
      chooseDeparture: "Valitse nyt kalenterista lähtöpäiväsi.",
      personsFewer: "Yksi henkilö vähemmän",
      personsMore: "Yksi henkilö enemmän",
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

  /* Dates and amounts on screen follow the page language, as in main.js:
     "1.040" / "1,040" / "1 040", "2 februari" / "2. Februar" / "2. helmikuuta".
     Display only: the checkout link keeps plain numbers and ISO dates. */
  var LOCALE = { nl: "nl-NL", en: "en-GB", de: "de-DE", sv: "sv-SE", no: "nb-NO", fi: "fi-FI" }[LANG] || "nl-NL";
  function getal(n, opties) {
    try { return n.toLocaleString(LOCALE, opties); } catch (fout) { return n.toLocaleString("nl-NL", opties); }
  }
  var datumFormaat = null;
  try {
    datumFormaat = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric" });
  } catch (fout) { /* old browser: the plain form in schrijfDatum */ }

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
  /* Reads "2027-01-16". Anything else, or a day that does not exist
     (31 February), gives null instead of rolling over into the next month;
     the web address can hold anything. Same check as in main.js. */
  function alsDatum(tekst) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tekst))) return null;
    var d = String(tekst).split("-");
    var datum = new Date(+d[0], +d[1] - 1, +d[2]);
    if (isNaN(datum.getTime())) return null;
    if (datum.getMonth() !== +d[1] - 1 || datum.getDate() !== +d[2]) return null;
    return datum;
  }
  function alsTekst(datum) {
    function twee(n) { return (n < 10 ? "0" : "") + n; }
    return datum.getFullYear() + "-" + twee(datum.getMonth() + 1) + "-" + twee(datum.getDate());
  }
  function schrijfDatum(datum) {
    if (datumFormaat) return datumFormaat.format(datum);
    return datum.getDate() + " " + T.months[datum.getMonth()] + " " + datum.getFullYear();
  }
  function plusDagen(datum, aantal) {
    var uit = new Date(datum.getTime());
    uit.setDate(uit.getDate() + aantal);
    return uit;
  }
  function euro(bedrag) {
    return "€" + getal(Math.round(bedrag));
  }

  var seizoenVan = alsDatum(data.seizoenStart);
  var seizoenTot = alsDatum(data.seizoenEind);
  // An unreadable or reversed season: the plain text on the page stays.
  if (!seizoenVan || !seizoenTot || seizoenTot <= seizoenVan) return;
  /* Shortest trip in days; there is no maximum. Same as minimumDagen() in
     api/_falun-prijs.js. */
  var minDagen = typeof data.minimumDagen === "number" && data.minimumDagen > 1 ? data.minimumDagen : 4;

  /* Base price per person for a trip of this many days. A length listed in
     basisprijs uses that amount; a longer one takes the longest listed length
     below it plus extraDagPerPersoon for every extra day. Must stay identical
     to basisprijsVoor() in api/_falun-prijs.js: that one is charged. */
  function basisprijsVoor(dagen) {
    var tabel = data.basisprijs || {};
    if (typeof tabel[String(dagen)] === "number") return tabel[String(dagen)];
    var langste = 0;
    Object.keys(tabel).forEach(function (sleutel) {
      var n = parseInt(sleutel, 10);
      if (n <= dagen && n > langste && typeof tabel[sleutel] === "number") langste = n;
    });
    var extra = data.extraDagPerPersoon;
    if (!langste || typeof extra !== "number") return null;
    return tabel[String(langste)] + (dagen - langste) * extra;
  }

  /* De huisjesprijzen komen van Falun Strandby en staan in Zweedse kronen per
     huisje per nacht, precies zoals hun boekingssite ze toont. De basisnacht
     zit al in de pakketprijs; alleen het verschil met die basis telt mee, en
     dat wordt gedeeld door het aantal personen in een huisje en omgerekend
     naar euro's. */
  var huisjes = data.huisjePerNachtSEK || {};
  var basisSEK = typeof data.huisjeBasisSEK === "number" ? data.huisjeBasisSEK : 0;
  var koers = data.wisselkoersSEK || 1;

  var personenKeuze = data.personen || { min: 1, max: 4, standaard: 2 };
  var personenMin = personenKeuze.min || 1;
  var personenMax = personenKeuze.max || 4;
  var basisPersonen = data.basisPersonen || 2;
  var huisjeMax = data.huisjeMaxPersonen || 0;

  /* A cabin (and its rental car) holds at most huisjeMax people. A bigger
     group is spread over as few cabins as possible, so the cabin and car
     share is calculated per cabin: 6 people = 2 cabins of 3. Same logic as
     api/_falun-prijs.js. */
  function perHuisje(n) {
    if (!huisjeMax || n <= huisjeMax) return n;
    return n / Math.ceil(n / huisjeMax);
  }
  var autoPerDag = typeof data.autoPerDagEUR === "number" ? data.autoPerDagEUR : 0;
  var autoInBasisDagen = typeof data.autoInBasisprijsDagen === "number" ? data.autoInBasisprijsDagen : 0;
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
    var werkelijk = sek / koers / perHuisje(personen);
    var basis = basisSEK / koers / basisPersonen;
    return demp(werkelijk - basis);
  }

  /* Wat de huurauto deze reiziger kost. Dat is ook wat eraf gaat als hij hem
     zelf regelt, zodat die twee niet uit elkaar kunnen lopen. */
  function autoDeel(personen, dagen) {
    var auto = autoPerDag * dagen;
    if (!auto) return 0;
    var basis = auto / basisPersonen;
    return basis + demp(auto / perHuisje(personen) - basis);
  }
  /* The car share that basisprijs already contains (autoInBasisprijsDagen
     days at basisPersonen). It is taken out and the car for the real trip
     length is added, so the car never counts twice. Same as
     api/_falun-prijs.js. */
  var autoInBasis = autoPerDag * autoInBasisDagen / basisPersonen;
  var opties = data.opties || {};
  var vluchtBedrag = Math.abs(opties.vluchtZelf || 0);
  var groterAuto = opties.groterAuto || null;
  var groterAutoPrijs = groterAuto && typeof groterAuto.prijs === "number" ? groterAuto.prijs : null;
  var begeleiding = opties.begeleiding || null;
  var begeleidingVan = begeleiding && begeleiding.van ? alsDatum(begeleiding.van) : null;
  var begeleidingTot = begeleiding && begeleiding.tot ? alsDatum(begeleiding.tot) : null;
  var begeleidingPerDag = begeleiding && typeof begeleiding.prijsPerDag === "number" ? begeleiding.prijsPerDag : null;
  var begeleidingExtraPersoon = begeleiding && typeof begeleiding.prijsPerDagExtraPersoon === "number" ? begeleiding.prijsPerDagExtraPersoon : 0;
  var begeleidingPerPersoon = !begeleiding || begeleiding.perPersoon !== false;

  /* The label of a booked period may be one line or a block per language
     ({"nl": ..., "en": ...}), as in the other price files. A missing
     language falls back to Dutch, then to the plain "booked" word. A period
     with a broken date is left out rather than breaking the calendar. */
  function labelVoor(wat) {
    if (wat && typeof wat === "object") return wat[LANG] || wat.nl || T.legendBooked;
    return wat || T.legendBooked;
  }
  var bezet = (data.bezet || []).map(function (blok) {
    return { van: alsDatum(blok && blok.van), tot: alsDatum(blok && blok.tot), wat: labelVoor(blok && blok.wat) };
  }).filter(function (blok) {
    return blok.van && blok.tot && blok.tot > blok.van;
  });

  /* Periode waarin het ijs nog onzeker is. Die dagen blijven gewoon te boeken;
     ze krijgen alleen een streepje en een regel uitleg onder de kalender. */
  var onzeker = data.ijsOnzeker && alsDatum(data.ijsOnzeker.van) && alsDatum(data.ijsOnzeker.tot)
    ? { van: alsDatum(data.ijsOnzeker.van), tot: alsDatum(data.ijsOnzeker.tot) }
    : null;

  function onzekerOp(datum) {
    return !!onzeker && datum >= onzeker.van && datum < onzeker.tot;
  }

  /* Trip length in days. It follows from the arrival and departure day the
     visitor clicks in the calendar; null until a departure day is chosen. */
  var duur = null;
  var personen = personenKeuze.standaard || 2; // everyone together: adults, children and babies

  function binnenPersonen(n) {
    return Math.min(personenMax, Math.max(personenMin, n));
  }

  /* Children (2 to 11) and babies (0 and 1) are counted inside "personen";
     everyone else is an adult (12 and older) and at least one adult always
     goes. Only the flight part of the package costs less for them. The flight
     amount is a server secret (api/_prijsbeleid.js): the price per person of
     a child and a baby comes from /api/falun-prijs, the adult price is still
     calculated here. */
  var kinderen = 0;
  var baby = 0;
  function volwassenen() { return personen - kinderen - baby; }
  // Sets the three counts when they fit; true when something changed.
  function zetAantallen(v, k, b) {
    if (v < 1 || k < 0 || b < 0) return false;
    var totaal = v + k + b;
    if (totaal < personenMin || totaal > personenMax) return false;
    if (v === volwassenen() && k === kinderen && b === baby) return false;
    kinderen = k;
    baby = b;
    personen = totaal;
    return true;
  }
  function aantalVan(sleutel) {
    return sleutel === "volw" ? volwassenen() : sleutel === "kind" ? kinderen : baby;
  }
  function andereAantallen(sleutel) { return personen - aantalVan(sleutel); }
  function ondergrens(sleutel) {
    return Math.max(sleutel === "volw" ? 1 : 0, personenMin - andereAantallen(sleutel));
  }
  function bovengrens(sleutel) { return personenMax - andereAantallen(sleutel); }
  function zetSoort(sleutel, waarde) {
    var nieuw = Math.min(bovengrens(sleutel), Math.max(ondergrens(sleutel), waarde));
    var v = volwassenen(), k = kinderen, b = baby;
    if (sleutel === "volw") v = nieuw; else if (sleutel === "kind") k = nieuw; else b = nieuw;
    return zetAantallen(v, k, b);
  }

  /* In periode-modus telt het aantal personen uit het formulier. Dat staat in
     data-personen en wordt bijgewerkt zodra de bezoeker het daar verandert. */
  function leesPersonenUitFormulier() {
    var uit = parseInt(box.getAttribute("data-personen"), 10);
    if (isNaN(uit)) return;
    personen = binnenPersonen(uit);
    kinderen = 0;
    baby = 0;
  }
  if (periodeModus) leesPersonenUitFormulier();
  var aankomst = null;
  var vluchtZelf = false;
  var autoZelf = false;
  var begeleidingDagen = 0;

  function nachtenVan(dagen) { return dagen - 1; }

  /* Begeleiding kost een bedrag per reisdag. Rekent Joey per groep in plaats
     van per persoon, dan wordt dat bedrag over de deelnemers verdeeld. Het
     dagbedrag hangt af van de groep: prijsPerDag voor 1 persoon, plus
     prijsPerDagExtraPersoon voor elke persoon meer. Zelfde als
     api/_falun-prijs.js.

     Dit bedrag wordt bewust niet afgerond: bij drie personen loopt een vooraf
     afgerond deelbedrag uit de pas met de server, en dan staat er een euro
     meer of minder op het scherm dan er afgeschreven wordt. */
  function begeleidingKostenRuw(dagenBegeleid, personen) {
    if (begeleidingPerDag === null || !dagenBegeleid) return 0;
    var perDag = begeleidingPerDag + begeleidingExtraPersoon * (personen - 1);
    var totaal = perDag * dagenBegeleid;
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

  // A day is clickable as arrival when at least the shortest trip fits.
  function kanAankomenOoit(datum) {
    return kanAankomen(datum, minDagen);
  }

  /* Trip length (in days) that ends on this date for the chosen arrival day,
     or 0 when the date is not a possible departure day. Any length from
     minDagen up works, as long as the whole stay is free and in season. */
  function duurTotVertrek(datum) {
    if (!aankomst) return 0;
    var dagen = Math.round((datum - aankomst) / 86400000) + 1;
    if (dagen < minDagen || basisprijsVoor(dagen) === null) return 0;
    return kanAankomen(aankomst, dagen) ? dagen : 0;
  }

  // Arrival and departure are both chosen.
  function periodeKlaar() {
    return !!aankomst && duur !== null;
  }

  /* De basisprijs plus de toeslag van elke nacht. Een nacht die niet in de
     tabel staat, telt als nul: dan geldt gewoon de basisprijs. */
  function verblijfPrijs(datum, dagen) {
    var basis = basisprijsVoor(dagen);
    if (basis === null) return null;
    var totaal = basis;
    for (var i = 0; i < nachtenVan(dagen); i++) {
      totaal += nachtToeslag(plusDagen(datum, i), personen);
    }
    totaal += autoDeel(personen, dagen) - autoInBasis;
    return totaal;
  }

  function begeleidingKan(datum, dagen) {
    if (!datum || !dagen) return false;
    if (!begeleiding || begeleidingPerDag === null) return false;
    if (!begeleidingVan || !begeleidingTot) return false;
    var vertrek = plusDagen(datum, nachtenVan(dagen));
    return datum >= begeleidingVan && vertrek <= begeleidingTot;
  }

  /* Het bedrag dat de bezoeker uiteindelijk betaalt. Dezelfde berekening
     staat serverside in api/_falun-prijs.js; die is leidend. */
  function totaalPrijs() {
    if (!periodeKlaar()) return null;
    var totaal = verblijfPrijs(aankomst, duur);
    if (totaal === null) return null;
    if (vluchtZelf) totaal -= vluchtBedrag;
    if (autoZelf) totaal -= autoDeel(personen, duur);
    if (begeleidingDagen && begeleidingKan(aankomst, duur)) totaal += begeleidingKostenRuw(begeleidingDagen, personen);
    return Math.round(totaal);
  }

  /* ------------------------------------------------------------------
     Opbouw van het scherm
     ------------------------------------------------------------------ */
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
  if (!periodeModus) box.appendChild(personenBox);
  box.appendChild(legenda);
  box.appendChild(raster);
  if (onzeker) {
    var notitie = document.createElement("p");
    notitie.className = "falun-cal__note";
    notitie.textContent = T.uncertainNote;
    box.appendChild(notitie);
  }
  // In period mode there is no summary box, so the "now pick a departure day"
  // hint goes right under the calendar.
  var vertrekHint = null;
  if (periodeModus) {
    vertrekHint = document.createElement("p");
    vertrekHint.className = "falun-cal__hint";
    vertrekHint.setAttribute("aria-live", "polite");
    box.appendChild(vertrekHint);
  }
  if (!periodeModus) {
    box.appendChild(optieBox);
    box.appendChild(begeleidingBox);
    box.appendChild(samenvatting);
  }

  /* Number of people: one stepper per category (adults, children, babies),
     each with minus, a number field and plus, the same control as on
     boeken.html. Every row shows its price per person once a period is
     chosen. It is built once so the focus stays on the button the visitor is
     pressing; tekenPersonen() only updates the values and the prices. */
  var personenRijen = [];

  function bouwPersonen() {
    var soorten = [
      { sleutel: "volw", naam: T.adultsLabel, leeftijd: T.adultsAge, id: "falunPersonen" },
      { sleutel: "kind", naam: T.childrenLabel, leeftijd: T.childrenAge, id: "falunPersonenKind" },
      { sleutel: "baby", naam: T.babiesLabel, leeftijd: T.babiesAge, id: "falunPersonenBaby" }
    ];
    personenBox.innerHTML =
      '<p class="falun-cal__legend" id="falunPersonenLegend">' + T.personsLegend + "</p>" +
      '<div class="calendar__persons-rows" role="group" aria-labelledby="falunPersonenLegend">' +
        soorten.map(function (soort) {
          return '<div class="calendar__person-row" data-soort="' + soort.sleutel + '">' +
            '<div class="calendar__person-text">' +
              '<label class="calendar__person-name" for="' + soort.id + '">' + soort.naam + "</label>" +
              '<span class="calendar__person-age" id="' + soort.id + 'Info">' + soort.leeftijd + "</span>" +
              '<span class="calendar__person-price" aria-live="polite"></span>' +
            "</div>" +
            '<div class="booking__persons">' +
              '<button type="button" class="booking__step-btn" data-personen-stap="-1" aria-label="' + T.fewerOf(soort.naam) + '" aria-controls="' + soort.id + '">−</button>' +
              '<input type="number" id="' + soort.id + '" min="' + (soort.sleutel === "volw" ? Math.max(1, personenMin) : 0) + '" max="' + personenMax + '" step="1" inputmode="numeric" value="0" aria-describedby="' + soort.id + 'Info" />' +
              '<button type="button" class="booking__step-btn" data-personen-stap="1" aria-label="' + T.moreOf(soort.naam) + '" aria-controls="' + soort.id + '">+</button>' +
            "</div>" +
          "</div>";
        }).join("") +
      "</div>" +
      '<p class="falun-cal__note falun-cal__note--inline">' + T.personsHint + "</p>" +
      '<p class="falun-cal__note falun-cal__note--inline">' + T.childNote + " " + T.ageRuleNote + "</p>";

    personenRijen = soorten.map(function (soort) {
      var rij = personenBox.querySelector('[data-soort="' + soort.sleutel + '"]');
      return {
        sleutel: soort.sleutel,
        veld: rij.querySelector("input"),
        minder: rij.querySelector('[data-personen-stap="-1"]'),
        meer: rij.querySelector('[data-personen-stap="1"]'),
        prijs: rij.querySelector(".calendar__person-price")
      };
    });

    personenRijen.forEach(function (rij) {
      [rij.minder, rij.meer].forEach(function (knop) {
        knop.addEventListener("click", function () {
          var stap = parseInt(knop.getAttribute("data-personen-stap"), 10);
          if (!zetSoort(rij.sleutel, aantalVan(rij.sleutel) + stap)) return;
          tekenAlles();
          // At the end of the range this button switches off; keep focus in
          // the stepper on the other button.
          if (knop.disabled) (knop === rij.minder ? rij.meer : rij.minder).focus();
        });
      });
      // Typing a number works too; an empty or invalid field is ignored until
      // the visitor leaves it, then the last valid number is shown again.
      rij.veld.addEventListener("input", function () {
        var uit = parseInt(rij.veld.value, 10);
        if (isNaN(uit)) return;
        if (zetSoort(rij.sleutel, uit)) tekenAlles();
      });
      rij.veld.addEventListener("change", function () {
        rij.veld.value = aantalVan(rij.sleutel);
      });
    });
  }

  /* The price per person of a category as text: the adult price from the
     calendar's own calculation, children and babies from the server's
     answer. Empty while the period is incomplete or the answer is not in. */
  function categoriePrijsTekst(sleutel) {
    if (!periodeKlaar()) return "";
    var perPersoon = totaalPrijs();
    if (perPersoon === null) return "";
    if (sleutel === "volw") return T.perPersonPrice(getal(perPersoon));
    var antwoord = kinderAntwoord();
    if (!antwoord || antwoord.status !== "klaar") return "";
    return T.perPersonPrice(getal(sleutel === "kind" ? antwoord.data.perKind : antwoord.data.perBaby));
  }

  function tekenPersonen() {
    if (!personenRijen.length) bouwPersonen();
    personenRijen.forEach(function (rij) {
      var n = aantalVan(rij.sleutel);
      if (parseInt(rij.veld.value, 10) !== n) rij.veld.value = n;
      rij.minder.disabled = n <= ondergrens(rij.sleutel);
      rij.meer.disabled = n >= bovengrens(rij.sleutel);
      rij.prijs.textContent = categoriePrijsTekst(rij.sleutel);
    });
  }

  /* Price per person of a child and a baby, and the group total, from
     /api/falun-prijs. The answers are kept per choice, so nothing is asked
     twice. status: "bezig", "klaar" ({ data }) or "fout". */
  var kinderPrijzen = {};
  function kinderSleutel() {
    return [alsTekst(aankomst), duur, personen, kinderen, baby, vluchtZelf ? 1 : 0, autoZelf ? 1 : 0,
      begeleidingDagen && begeleidingKan(aankomst, duur) ? begeleidingDagen : 0].join("|");
  }
  function kinderAntwoord() {
    if (periodeModus || !periodeKlaar()) return null;
    return kinderPrijzen[kinderSleutel()] || null;
  }
  function haalKinderPrijzen() {
    if (periodeModus || !periodeKlaar() || totaalPrijs() === null) return;
    var sleutel = kinderSleutel();
    if (kinderPrijzen[sleutel]) return;
    kinderPrijzen[sleutel] = { status: "bezig" };

    var lading = {
      reis: "Falun",
      aankomst: alsTekst(aankomst),
      dagen: String(duur),
      personen: String(personen),
      kinderen: String(kinderen),
      baby: String(baby),
      vlucht: vluchtZelf ? "zelf" : "",
      auto: autoZelf ? "zelf" : "",
      begeleiding: begeleidingDagen && begeleidingKan(aankomst, duur) ? String(begeleidingDagen) : ""
    };
    fetch("/api/falun-prijs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lading)
    })
      .then(function (respons) {
        return respons.json().then(function (uit) { return { ok: respons.ok, data: uit || {} }; });
      })
      .then(function (resultaat) {
        var uit = resultaat.data;
        var geldig = resultaat.ok && typeof uit.bedrag === "number" && isFinite(uit.bedrag) && uit.bedrag > 0 &&
          typeof uit.perKind === "number" && isFinite(uit.perKind) && typeof uit.perBaby === "number" && isFinite(uit.perBaby);
        kinderPrijzen[sleutel] = geldig ? { status: "klaar", data: uit } : { status: "fout" };
      })
      ["catch"](function () { kinderPrijzen[sleutel] = { status: "fout" }; })
      .then(function () {
        // Only redraw when the answer is for the choice on screen now.
        if (periodeKlaar() && sleutel === kinderSleutel()) { tekenPersonen(); tekenSamenvatting(); }
      });
  }

  /* De kalender toont een maand tegelijk; met de pijltjes klik je door het
     seizoen. Verder dan de eerste en laatste seizoensmaand gaat het niet. */
  var eersteMaand = new Date(seizoenVan.getFullYear(), seizoenVan.getMonth(), 1);
  var laatsteMaand = new Date(seizoenTot.getFullYear(), seizoenTot.getMonth(), 1);
  var zichtbareMaand = eersteMaand;

  function maandVan(datum) {
    return new Date(datum.getFullYear(), datum.getMonth(), 1);
  }

  /* De maand waarmee de kalender opent: die van de gekozen dag, of anders de
     eerste maand waarin je nog kunt aankomen. */
  function startMaand() {
    if (aankomst) return maandVan(aankomst);
    var loop = new Date(seizoenVan.getTime());
    while (loop <= seizoenTot) {
      if (!bezetOp(loop) && kanAankomenOoit(loop)) return maandVan(loop);
      loop = plusDagen(loop, 1);
    }
    return eersteMaand;
  }

  function tekenRaster(focusOp) {
    raster.innerHTML = "";
    var maand = zichtbareMaand;

    var kop = document.createElement("div");
    kop.className = "calendar__month-head";

    var terug = document.createElement("button");
    terug.type = "button";
    terug.className = "calendar__month-nav";
    terug.setAttribute("data-maand-stap", "-1");
    terug.innerHTML = '<span aria-hidden="true">&#8249;</span><span class="sr-only">' + T.prevMonth + "</span>";
    terug.disabled = maand <= eersteMaand;

    var titel = document.createElement("p");
    titel.className = "calendar__month-title";
    titel.setAttribute("aria-live", "polite");
    titel.textContent = T.months[maand.getMonth()] + " " + maand.getFullYear();

    var vooruit = document.createElement("button");
    vooruit.type = "button";
    vooruit.className = "calendar__month-nav";
    vooruit.setAttribute("data-maand-stap", "1");
    vooruit.innerHTML = '<span aria-hidden="true">&#8250;</span><span class="sr-only">' + T.nextMonth + "</span>";
    vooruit.disabled = maand >= laatsteMaand;

    [terug, vooruit].forEach(function (knop) {
      knop.addEventListener("click", function () {
        var stap = parseInt(knop.getAttribute("data-maand-stap"), 10);
        zichtbareMaand = new Date(maand.getFullYear(), maand.getMonth() + stap, 1);
        tekenRaster(stap);
      });
    });

    kop.appendChild(terug);
    kop.appendChild(titel);
    kop.appendChild(vooruit);
    raster.appendChild(kop);

    var maandBox = document.createElement("div");
    maandBox.className = "calendar__month";

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

    // Na het doorklikken blijft de focus op het pijltje, zodat je met het
    // toetsenbord verder kunt klikken. Is dat pijltje nu uit, dan het andere.
    if (focusOp) {
      var doel = focusOp < 0 ? terug : vooruit;
      (doel.disabled ? (focusOp < 0 ? vooruit : terug) : doel).focus();
    }
  }

  function tekenDag(datum) {
    var blok = bezetOp(datum);
    var binnenSeizoen = datum >= seizoenVan && datum <= seizoenTot;

    // First click picks the arrival day, the second one the departure day.
    // Only departure days that give an allowed trip length count.
    var kanStart = binnenSeizoen && !blok && kanAankomenOoit(datum);
    var vertrekDuur = duurTotVertrek(datum);
    var isVertrek = periodeKlaar() && vertrekDuur === duur;
    var isOptie = !!aankomst && duur === null && vertrekDuur > 0;

    if (!kanStart && !vertrekDuur) {
      var uit = document.createElement("span");
      uit.className = "calendar__cell " + (blok ? "is-bezet" : "is-buiten");
      uit.innerHTML = '<span class="calendar__daynr">' + datum.getDate() + "</span>";
      if (blok) {
        uit.title = T.bookedTitle(blok.wat, schrijfDatum(blok.van), schrijfDatum(blok.tot));
        var uitleg = document.createElement("span");
        uitleg.className = "sr-only";
        // A label that already says "not available" is not followed by the
        // same words again ("Niet beschikbaar, niet beschikbaar"), as in main.js.
        var srZin = T.bookedSr("").replace(/^[\s,]+/, "").toLowerCase();
        uitleg.textContent = srZin && String(blok.wat).toLowerCase().indexOf(srZin) !== -1
          ? " " + blok.wat
          : T.bookedSr(blok.wat);
        uit.appendChild(uitleg);
      }
      return uit;
    }

    var knop = document.createElement("button");
    knop.type = "button";
    knop.className = "calendar__cell is-vrij";
    knop.innerHTML =
      '<span class="calendar__daynr">' + datum.getDate() + "</span>";
    knop.setAttribute("data-datum", alsTekst(datum));
    // A possible departure day also says how long the trip would be.
    knop.setAttribute("aria-label", vertrekDuur
      ? T.availableAria(schrijfDatum(datum)) + ", " + T.days(vertrekDuur)
      : T.availableAria(schrijfDatum(datum)));
    if (isOptie) knop.title = T.lineTrip(vertrekDuur);
    if (onzekerOp(datum)) knop.classList.add("is-onzeker");

    var isAankomst = !!aankomst && datum.getTime() === aankomst.getTime();
    if (isAankomst) {
      knop.classList.add("is-gekozen", "is-start");
    } else if (isVertrek) {
      knop.classList.add("is-gekozen", "is-eind");
    } else if (periodeKlaar()) {
      // De nachten na de aankomstdag kleuren mee, zodat de periode zichtbaar is.
      var vertrek = plusDagen(aankomst, nachtenVan(duur));
      if (datum > aankomst && datum < vertrek) knop.classList.add("is-tussen");
    } else if (isOptie) {
      knop.classList.add("is-vertrekoptie");
    }
    if (isAankomst || isVertrek) knop.setAttribute("aria-pressed", "true");

    knop.addEventListener("click", function () {
      if (vertrekDuur && (duur === null || !kanStart)) {
        duur = vertrekDuur;
      } else if (kanStart) {
        aankomst = datum;
        duur = null;
      } else {
        return;
      }
      // Guiding days are kept while the visitor picks a new period, then
      // clamped to the new trip length (or cleared when guiding is not
      // possible in that period).
      if (periodeKlaar()) {
        if (!begeleidingKan(aankomst, duur)) begeleidingDagen = 0;
        else if (begeleidingDagen > duur) begeleidingDagen = duur;
      }
      tekenAlles();
      // Keep keyboard focus on the day that was just clicked.
      var zelfde = raster.querySelector('[data-datum="' + alsTekst(datum) + '"]');
      if (zelfde) zelfde.focus();
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
    // Guiding can only be booked inside its van/tot window (the server
    // refuses it without one), so without a readable window it is not shown.
    if (begeleidingPerDag === null || !begeleidingVan || !begeleidingTot) { begeleidingBox.innerHTML = ""; return; }

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

    /* A stepper instead of one button per day: minus, the number of guiding
       days with its price, plus. Range 0 to the trip length; the click
       handler in tekenDag() clamps the value when the trip gets shorter. */
    begeleidingBox.innerHTML =
      '<p class="falun-cal__legend" id="falunBegeleidingLabel">' + T.guidingLegend + "</p>" +
      '<div class="falun-cal__stepper" role="group" aria-labelledby="falunBegeleidingLabel">' +
        '<button type="button" class="booking__step-btn" data-begeleiding-stap="-1" aria-label="' + T.guidingFewer + '">\u2212</button>' +
        '<span class="falun-cal__stepper-out" aria-live="polite" aria-atomic="true">' +
          '<span class="falun-cal__stepper-value"></span>' +
          '<span class="falun-cal__stepper-price"></span>' +
        "</span>" +
        '<button type="button" class="booking__step-btn" data-begeleiding-stap="1" aria-label="' + T.guidingMore + '">+</button>' +
      "</div>" +
      '<p class="falun-cal__note falun-cal__note--inline">' + T.guidingExplain(euro(begeleidingPerDag), euro(begeleidingExtraPersoon)) + "</p>";

    var minder = begeleidingBox.querySelector('[data-begeleiding-stap="-1"]');
    var meer = begeleidingBox.querySelector('[data-begeleiding-stap="1"]');
    var waarde = begeleidingBox.querySelector(".falun-cal__stepper-value");
    var prijs = begeleidingBox.querySelector(".falun-cal__stepper-price");

    // Updates the value in place, so the live region is announced and the
    // focus stays on the button that was pressed.
    function zetWaarde() {
      waarde.textContent = begeleidingDagen === 0 ? T.guidingNone : T.guidingDays(begeleidingDagen);
      prijs.textContent = begeleidingDagen === 0 ? "" : "+ " + euro(begeleidingKosten(begeleidingDagen, personen));
      minder.disabled = begeleidingDagen <= 0;
      meer.disabled = begeleidingDagen >= duur;
    }
    zetWaarde();

    [minder, meer].forEach(function (knop) {
      knop.addEventListener("click", function () {
        var n = Math.min(duur, Math.max(0, begeleidingDagen + parseInt(knop.getAttribute("data-begeleiding-stap"), 10)));
        if (n === begeleidingDagen) return;
        begeleidingDagen = n;
        zetWaarde();
        // At the end of the range this button switches off; keep keyboard
        // focus in the stepper by moving it to the other button.
        if (knop.disabled) (knop === minder ? meer : minder).focus();
        tekenSamenvatting();
      });
    });
  }

  function tekenSamenvatting() {
    if (!periodeKlaar()) {
      samenvatting.innerHTML = '<p class="falun-cal__hint">' + (aankomst ? T.chooseDeparture : T.chooseFirst) + "</p>";
      return;
    }

    haalKinderPrijzen();
    tekenPersonen();

    var verblijf = verblijfPrijs(aankomst, duur);
    var perPersoon = totaalPrijs();
    // Alle bedragen hierboven zijn per persoon; afgerekend wordt voor de hele
    // groep. Zelfde rekenwijze als api/_falun-prijs.js: eerst per persoon
    // afronden, dan vermenigvuldigen.
    var totaal = perPersoon * personen;
    // With children or babies the total comes from the server, which knows
    // their price: nothing is shown until it answers.
    var metKinderen = kinderen + baby > 0;
    var antwoord = metKinderen ? kinderAntwoord() : null;
    var totaalTekst = euro(totaal);
    var kinderRegels = "";
    var kinderNotitie = "";
    if (metKinderen) {
      if (antwoord && antwoord.status === "klaar") {
        totaalTekst = euro(antwoord.data.bedrag);
        kinderRegels = "<dt>" + T.categoryLine(T.adultsLabel, volwassenen()) + "</dt><dd>" + T.perPersonPrice(getal(antwoord.data.perPersoon)) + "</dd>";
        if (kinderen) kinderRegels += "<dt>" + T.categoryLine(T.childrenLabel, kinderen) + "</dt><dd>" + T.perPersonPrice(getal(antwoord.data.perKind)) + "</dd>";
        if (baby) kinderRegels += "<dt>" + T.categoryLine(T.babiesLabel, baby) + "</dt><dd>" + T.perPersonPrice(getal(antwoord.data.perBaby)) + "</dd>";
      } else if (antwoord && antwoord.status === "fout") {
        totaalTekst = "-";
        kinderNotitie = '<p class="falun-cal__note falun-cal__note--inline">' + T.priceUnavailable + "</p>";
      } else {
        totaalTekst = T.priceLoading;
      }
      if (vluchtZelf) kinderNotitie += '<p class="falun-cal__note falun-cal__note--inline">' + T.childFlightSelfNote + "</p>";
    }
    var vertrek = plusDagen(aankomst, nachtenVan(duur));

    var regels =
      "<dt>" + T.lineTrip(duur) + "</dt><dd>" + euro(verblijf) + "</dd>" +
      "<dt>" + T.lineArrival + "</dt><dd>" + schrijfDatum(aankomst) + "</dd>" +
      "<dt>" + T.linePersons + "</dt><dd>" + T.personsLabel(personen) + "</dd>";
    if (vluchtZelf) regels += "<dt>" + T.lineFlight + "</dt><dd>- " + euro(vluchtBedrag) + "</dd>";
    if (autoZelf) regels += "<dt>" + T.lineCar + "</dt><dd>- " + euro(autoDeel(personen, duur)) + "</dd>";
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
    if (kinderen) params.set("kinderen", String(kinderen));
    if (baby) params.set("baby", String(baby));
    if (vluchtZelf) params.set("vlucht", "zelf");
    if (autoZelf) params.set("auto", "zelf");
    if (begeleidingDagen && begeleidingKan(aankomst, duur)) params.set("begeleiding", String(begeleidingDagen));

    // The price per person comes first; for a group the total for everyone
    // follows in brackets. Display only: the amounts are the same as before.
    var totaalRegel = personen > 1
      ? '<div class="booking__total"><span>' + T.total + "</span><strong>" + euro(perPersoon) + "</strong></div>" +
        '<p class="falun-cal__group-total">(' + T.groupAmount(euro(totaal), personen) + ")</p>"
      : '<div class="booking__total"><span>' + T.totalFor(personen) + "</span><strong>" + euro(totaal) + "</strong></div>";
    // With children or babies the price per person differs per category, so
    // the lines above list each one and the total is the group amount.
    if (metKinderen) {
      totaalRegel = '<div class="booking__total"><span>' + T.totalFor(personen) + "</span><strong>" + totaalTekst + "</strong></div>" +
        kinderNotitie;
    }

    samenvatting.innerHTML =
      '<p class="falun-cal__summary-title">' + T.summaryTitle + "</p>" +
      '<dl class="booking__lines">' + regels + (metKinderen ? kinderRegels : "") + "</dl>" +
      totaalRegel +
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
      // Before a period is chosen this shows the car share of the shortest
      // trip; it follows the chosen trip length as soon as there is one.
      bedrag: Math.round(autoDeel(personen, duur || minDagen))
    });

    // prijsPerDag null in data/falun-prijzen.json means guidance is switched
    // off entirely: not shown here, not in the form, not charged.
    if (begeleiding && begeleidingPerDag !== null) {
      var hint = T.guidingHint;
      if (!mag && begeleidingVan && begeleidingTot) {
        hint = aankomst ? T.guidingOutside(schrijfDatum(begeleidingVan), schrijfDatum(begeleidingTot))
                        : T.guidingWindow(schrijfDatum(begeleidingVan), schrijfDatum(begeleidingTot));
      }
      lijst.push({
        sleutel: "begeleiding",
        naam: T.guiding,
        toelichting: hint,
        // Translated list when the data file has one for this language,
        // otherwise the Dutch list.
        inbegrepen: (begeleiding.inbegrepenPerTaal && begeleiding.inbegrepenPerTaal[LANG]) || begeleiding.inbegrepen || [],
        inbegrepenLabel: T.guidingIncludes,
        teken: "+",
        dagen: begeleidingDagen,
        bedrag: begeleidingKosten(begeleidingDagen || duur, personen),
        uit: !mag
      });
    }

    return lijst;
  }

  function meldPeriode() {
    if (!periodeModus) return;
    // Only a complete period (arrival and departure) is passed on; while the
    // visitor still has to pick a departure day, the form gets no period.
    var klaar = periodeKlaar();
    var vertrek = klaar ? plusDagen(aankomst, nachtenVan(duur)) : null;
    var bericht = {
      van: klaar ? alsTekst(aankomst) : null,
      tot: klaar ? alsTekst(vertrek) : null,
      dagen: klaar ? duur : null,
      nachten: klaar ? nachtenVan(duur) : 0,
      // Op hele euro's, net als het bedrag dat in de kalender bij de dag staat.
      verblijf: klaar ? Math.round(verblijfPrijs(aankomst, duur)) : null,
      personenMin: personenMin,
      personenMax: personenMax,
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
    if (!periodeModus) tekenPersonen();
    tekenRaster();
    if (vertrekHint) vertrekHint.textContent = aankomst && duur === null ? T.chooseDeparture : "";
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
     voor minimaal minDagen dagen; vroeg iemand om een kortere of een niet
     passende lengte, dan houden we wel zijn aankomstdag aan en zegt een regel
     erboven hoe het zit. */
  function uitZoeker() {
    var zoek = new URLSearchParams(window.location.search);
    var van = zoek.get("van") || "";
    var tot = zoek.get("tot") || "";
    var wens = { dag: null, dagen: NaN };

    // Digits only: "3abc" or "-2" in the web address is ignored.
    var aantalTekst = zoek.get("personen") || "";
    var aantal = /^\d{1,3}$/.test(aantalTekst) ? parseInt(aantalTekst, 10) : NaN;
    if (!isNaN(aantal)) {
      personen = binnenPersonen(aantal);
    }
    // Children and babies from the address (digits only), never more than
    // leaves one adult.
    function uitAdres(naam) {
      var tekst = zoek.get(naam) || "";
      return /^\d{1,3}$/.test(tekst) ? parseInt(tekst, 10) : 0;
    }
    kinderen = Math.min(uitAdres("kinderen"), personen - 1);
    baby = Math.min(uitAdres("baby"), personen - 1 - kinderen);

    wens.dag = alsDatum(van);
    if (!wens.dag) return wens;
    var totDatum = alsDatum(tot);
    if (totDatum) {
      var nachten = Math.round((totDatum - wens.dag) / 86400000);
      if (nachten > 0) wens.dagen = nachten + 1;
    }
    return wens;
  }

  var wens = periodeModus ? null : uitZoeker();

  var gevraagdeDuur = periodeModus ? parseInt(box.getAttribute("data-dagen"), 10) : wens.dagen;
  if (gevraagdeDuur >= minDagen && basisprijsVoor(gevraagdeDuur) !== null) duur = gevraagdeDuur;

  var gevraagdeDag = null;
  if (periodeModus) {
    var uitAdres = box.getAttribute("data-aankomst");
    gevraagdeDag = alsDatum(uitAdres);
  } else {
    gevraagdeDag = wens.dag;
  }

  // Er staat geen dag vooraf klaar: de totaalprijs verschijnt pas als de
  // bezoeker zelf een aankomstdag kiest. Fits the requested day but not the
  // requested length, then keep the day and let the visitor pick a departure.
  aankomst = null;
  if (gevraagdeDag && duur !== null && kanAankomen(gevraagdeDag, duur)) {
    aankomst = gevraagdeDag;
  } else if (gevraagdeDag && kanAankomenOoit(gevraagdeDag)) {
    aankomst = gevraagdeDag;
    duur = null;
  } else {
    duur = null;
  }

  // De regel boven de kalender: alleen als er echt een wens meekwam die we
  // niet helemaal konden inwilligen.
  if (gevraagdeDag && !periodeModus) {
    var melding = "";
    if (aankomst !== gevraagdeDag) melding = T.searchDayGone;
    else if (duur === null) melding = T.searchKeptDay;
    if (melding) {
      var regel = document.createElement("p");
      regel.className = "falun-cal__note falun-cal__note--search";
      regel.textContent = melding;
      box.insertBefore(regel, box.firstChild);
    }
  }

  // Kon de gevraagde dag niet, dan opent de kalender toch in die maand, zodat
  // de bezoeker meteen de dagen eromheen ziet.
  zichtbareMaand = startMaand();
  if (!aankomst && gevraagdeDag) {
    var gevraagdeMaand = maandVan(gevraagdeDag);
    if (gevraagdeMaand >= eersteMaand && gevraagdeMaand <= laatsteMaand) zichtbareMaand = gevraagdeMaand;
  }

  tekenAlles();
  }
})();
