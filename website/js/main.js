(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Vertalingen voor teksten die door JS worden gegenereerd (kalender,
     diavoorstelling). De rest van de pagina staat al vertaald in de HTML;
     dit zijn alleen de stukjes die main.js zelf op het scherm zet.
     ------------------------------------------------------------------ */
  var I18N = {
    nl: {
      months: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
      dayHeaders: ["ma", "di", "wo", "do", "vr", "za", "zo"],
      prevMonth: "Vorige maand",
      nextMonth: "Volgende maand",
      pauseAria: "Diavoorstelling pauzeren",
      playAria: "Diavoorstelling afspelen",
      legendAvailable: "Beschikbaar",
      legendBooked: "Al bezet",
      legendChosen: "Jouw keuze",
      hintStart: "Klik je aankomstdag aan, en daarna je vertrekdag.",
      hintEnd: function (aankomst, min) { return "Aankomst op " + aankomst + ". Kies nu je vertrekdag - minimaal " + min + " dagen."; },
      reset: "Opnieuw kiezen",
      chosenLabel: "Jouw periode",
      daysLabel: function (n) { return n + (n === 1 ? " dag" : " dagen"); },
      continueBtn: "Verder met de aanvraag",
      defaultBooked: "Bezet",
      availableAria: function (datum) { return datum + ", beschikbaar"; },
      totalLabel: function (totaal) { return "Totaal €" + totaal + " per persoon"; },
      groupTotalLabel: function (totaal, n, pp) { return "Totaal €" + pp + " per persoon (€" + totaal + " voor " + n + " personen)"; },
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " tot " + tot; },
      bookedSr: function (wat) { return " " + wat + ", niet beschikbaar"; },
      warnMinDays: function (min) { return "Een verblijf duurt minimaal " + min + " dagen. Kies een latere vertrekdag."; },
      warnOverlap: "In die periode zit een week die al bezet is. Kies een periode ervoor of erna.",
      legendUncertain: "IJs onzeker",
      uncertainNote: "De dagen met een streepje kun je gewoon boeken, maar in december is het ijs nog het onzekerst.",
      guidingLegend: "Wil je begeleiding op het ijs?",
      guidingNone: "Geen",
      guidingFewer: "Eén dag begeleiding minder",
      guidingMore: "Eén dag begeleiding meer",
      guidingDays: function (n) { return n + (n === 1 ? " dag" : " dagen"); },
      guidingPrice: function (bedrag, extra) { return bedrag + " per dag voor 1 persoon, + " + extra + " per dag voor elke extra persoon, dus hoe meer jullie zijn, hoe minder het per persoon kost."; },
      guidingWindow: function (van, tot) { return "Begeleiding kan van " + van + " tot en met " + tot + ". Kies eerst je periode."; },
      guidingOutside: function (van, tot) { return "Niet mogelijk in de periode die je gekozen hebt. Begeleiding kan van " + van + " tot en met " + tot + "."; },
      legendPricier: "Duurdere nacht",
      pricierNote: "Een stipje betekent dat de nacht die op die dag begint duurder is. Daarvoor komt er per persoon een toeslag bij, die al in het totaal zit.",
      pricierAria: function (bedrag) { return "duurdere nacht, toeslag " + bedrag + " p.p."; },
      pricierLine: function (bedrag, n) { return "Inclusief " + bedrag + " p.p. toeslag voor " + n + (n === 1 ? " duurdere nacht" : " duurdere nachten"); },
      bookPayBtn: "Boeken en betalen",
      // Own flight: the same texts as in js/falun-kalender.js.
      optionsLegend: "Wat wil je zelf regelen?",
      flightSelf: "Ik regel mijn vlucht zelf",
      flightSelfHint: "De heen- en terugvlucht zit anders bij de prijs in",
      lineFlight: "Vlucht zelf geregeld",
      childFlightSelfNote: "Regel je je vlucht zelf, dan vervalt de lagere prijs voor kinderen en baby's: er is dan geen vliegdeel meer om te verlagen.",
      adultsLabel: "Volwassenen",
      adultsAge: "12 jaar en ouder",
      childrenLabel: "Kinderen",
      childrenAge: "2 t/m 11 jaar",
      babiesLabel: "Baby's",
      babiesAge: "0 en 1 jaar",
      fewerOf: function (naam) { return "Eén minder: " + naam; },
      moreOf: function (naam) { return "Eén meer: " + naam; },
      perPersonPrice: function (bedrag) { return "€" + bedrag + " p.p."; },
      categoryLine: function (naam, n, prijs) { return naam + " (" + n + "): " + prijs; },
      groupTotalMixed: function (totaal, n) { return "Totaal €" + totaal + " voor " + n + " personen"; },
      childNote: "Kinderen en baby's betalen een lagere prijs voor het vliegdeel van het pakket. De rest van de reis kost voor iedereen hetzelfde. De leeftijd telt op de dag van aankomst.",
      ageRuleNote: "Minstens één reiziger moet 21 jaar of ouder zijn.",
      priceLoading: "Prijs wordt berekend...",
      priceUnavailable: "We konden de prijs met kinderen nu niet laten zien. Het totaal zie je op de volgende stap.",
      personsLegend: "Met hoeveel personen?",
      personsFewer: "Eén persoon minder",
      personsMore: "Eén persoon meer",
      durationsLegend: "Hoe lang wil je blijven?",
      durationDays: function (n) { return n + (n === 1 ? " dag" : " dagen"); },
      durationAria: function (n, bedrag) { return n + (n === 1 ? " dag" : " dagen") + (bedrag ? ", " + bedrag + " per persoon" : ""); },
      durationsLonger: "Langer blijven kan ook: klik dan in de kalender op je vertrekdag.",
      payPersonsNote: function (min, max) {
        var groep = min === max ? min + (min === 1 ? " persoon" : " personen") : min + " tot en met " + max + " personen";
        return "Online boeken kan voor " + groep + ". Met een andere groep vraag je de reis aan.";
      }
    },
    en: {
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      dayHeaders: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
      prevMonth: "Previous month",
      nextMonth: "Next month",
      pauseAria: "Pause slideshow",
      playAria: "Play slideshow",
      legendAvailable: "Available",
      legendBooked: "Already booked",
      legendChosen: "Your selection",
      hintStart: "Click your arrival day, then your departure day.",
      hintEnd: function (arrival, min) { return "Arrival on " + arrival + ". Now choose your departure day - minimum " + min + " days."; },
      reset: "Start over",
      chosenLabel: "Your period",
      daysLabel: function (n) { return n + (n === 1 ? " day" : " days"); },
      continueBtn: "Continue to request",
      defaultBooked: "Booked",
      availableAria: function (date) { return date + ", available"; },
      totalLabel: function (totaal) { return "Total €" + totaal + " per person"; },
      groupTotalLabel: function (total, n, pp) { return "Total €" + pp + " per person (€" + total + " for " + n + " people)"; },
      bookedTitle: function (what, from, to) { return what + ": " + from + " to " + to; },
      bookedSr: function (what) { return " " + what + ", not available"; },
      warnMinDays: function (min) { return "A stay is at least " + min + " days. Choose a later departure day."; },
      warnOverlap: "That period includes a week that's already booked. Choose a period before or after.",
      legendUncertain: "Ice uncertain",
      uncertainNote: "You can book the dashed days as normal, but in December the ice is least certain.",
      guidingLegend: "Do you want guiding on the ice?",
      guidingNone: "None",
      guidingFewer: "One day less guiding",
      guidingMore: "One day more guiding",
      guidingDays: function (n) { return n + (n === 1 ? " day" : " days"); },
      guidingPrice: function (amount, extra) { return amount + " per day for 1 person, + " + extra + " per day for each additional person, so the more of you there are, the less it costs each."; },
      guidingWindow: function (from, to) { return "Guiding is available from " + from + " to " + to + ". Choose your period first."; },
      guidingOutside: function (from, to) { return "Not available in the period you selected. Guiding runs from " + from + " to " + to + "."; },
      legendPricier: "Higher-priced night",
      pricierNote: "A dot means the night that starts on that day costs more. A surcharge per person is added for it, already included in the total.",
      pricierAria: function (amount) { return "higher-priced night, surcharge " + amount + " per person"; },
      pricierLine: function (amount, n) { return "Includes " + amount + " per person surcharge for " + n + (n === 1 ? " higher-priced night" : " higher-priced nights"); },
      bookPayBtn: "Book and pay",
      optionsLegend: "What do you want to arrange yourself?",
      flightSelf: "I'll arrange my own flight",
      flightSelfHint: "Otherwise the return flight is included in the price",
      lineFlight: "Own flight",
      childFlightSelfNote: "If you arrange your own flight, the lower price for children and babies no longer applies: there is no flight part left to reduce.",
      adultsLabel: "Adults",
      adultsAge: "12 years and older",
      childrenLabel: "Children",
      childrenAge: "2 to 11 years",
      babiesLabel: "Babies",
      babiesAge: "0 and 1 years",
      fewerOf: function (naam) { return "One fewer: " + naam; },
      moreOf: function (naam) { return "One more: " + naam; },
      perPersonPrice: function (bedrag) { return "€" + bedrag + " per person"; },
      categoryLine: function (naam, n, prijs) { return naam + " (" + n + "): " + prijs; },
      groupTotalMixed: function (totaal, n) { return "Total €" + totaal + " for " + n + " people"; },
      childNote: "Children and babies pay a lower price for the flight part of the package. The rest of the trip costs the same for everyone. Age counts on the day of arrival.",
      ageRuleNote: "At least one traveller must be 21 or older.",
      priceLoading: "Calculating price...",
      priceUnavailable: "We could not show the price with children right now. You will see the total in the next step.",
      personsLegend: "How many people?",
      personsFewer: "One person fewer",
      personsMore: "One person more",
      durationsLegend: "How long would you like to stay?",
      durationDays: function (n) { return n + (n === 1 ? " day" : " days"); },
      durationAria: function (n, amount) { return n + (n === 1 ? " day" : " days") + (amount ? ", " + amount + " per person" : ""); },
      durationsLonger: "Staying longer is possible too: click your departure day in the calendar.",
      payPersonsNote: function (min, max) {
        var group = min === max ? min + (min === 1 ? " person" : " people") : min + " to " + max + " people";
        return "Online booking is possible for " + group + ". For a different group, send us a request.";
      }
    },
    sv: {
      months: ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
      dayHeaders: ["mån", "tis", "ons", "tor", "fre", "lör", "sön"],
      prevMonth: "Föregående månad",
      nextMonth: "Nästa månad",
      pauseAria: "Pausa bildspelet",
      playAria: "Spela upp bildspelet",
      legendAvailable: "Tillgänglig",
      legendBooked: "Redan bokad",
      legendChosen: "Ditt val",
      hintStart: "Klicka på din ankomstdag och sedan på din avresedag.",
      hintEnd: function (ankomst, min) { return "Ankomst " + ankomst + ". Välj nu din avresedag - minst " + min + " dagar."; },
      reset: "Välj igen",
      chosenLabel: "Din period",
      daysLabel: function (n) { return n + (n === 1 ? " dag" : " dagar"); },
      continueBtn: "Gå vidare till förfrågan",
      defaultBooked: "Bokad",
      availableAria: function (datum) { return datum + ", tillgänglig"; },
      totalLabel: function (total) { return "Totalt €" + total + " per person"; },
      groupTotalLabel: function (total, n, pp) { return "Totalt €" + pp + " per person (€" + total + " för " + n + " personer)"; },
      bookedTitle: function (vad, fran, till) { return vad + ": " + fran + " till " + till; },
      bookedSr: function (vad) { return " " + vad + ", inte tillgänglig"; },
      warnMinDays: function (min) { return "En vistelse är minst " + min + " dagar. Välj en senare avresedag."; },
      warnOverlap: "Den perioden omfattar en vecka som redan är bokad. Välj en period före eller efter.",
      legendUncertain: "Isen osäker",
      uncertainNote: "Dagarna med streck går att boka som vanligt, men i december är isen som mest osäker.",
      guidingLegend: "Vill du ha guidning på isen?",
      guidingNone: "Ingen",
      guidingFewer: "En dag mindre guidning",
      guidingMore: "En dag mer guidning",
      guidingDays: function (n) { return n + (n === 1 ? " dag" : " dagar"); },
      guidingPrice: function (belopp, extra) { return belopp + " per dag för 1 person, + " + extra + " per dag för varje extra person, så ju fler ni är, desto mindre kostar det per person."; },
      guidingWindow: function (fran, till) { return "Guidning finns från " + fran + " till " + till + ". Välj först din period."; },
      guidingOutside: function (fran, till) { return "Inte möjligt under perioden du valt. Guidning finns från " + fran + " till " + till + "."; },
      legendPricier: "Dyrare natt",
      pricierNote: "En prick betyder att natten som börjar den dagen är dyrare. Då tillkommer ett tillägg per person, som redan ingår i totalen.",
      pricierAria: function (belopp) { return "dyrare natt, tillägg " + belopp + " per person"; },
      pricierLine: function (belopp, n) { return "Inklusive " + belopp + " per person i tillägg för " + n + (n === 1 ? " dyrare natt" : " dyrare nätter"); },
      bookPayBtn: "Boka och betala",
      optionsLegend: "Vad vill du ordna själv?",
      flightSelf: "Jag ordnar flyget själv",
      flightSelfHint: "Annars ingår tur- och returflyget i priset",
      lineFlight: "Eget flyg",
      childFlightSelfNote: "Ordnar du flyget själv gäller inte längre det lägre priset för barn och bebisar: då finns ingen flygdel kvar att sänka.",
      adultsLabel: "Vuxna",
      adultsAge: "12 år och äldre",
      childrenLabel: "Barn",
      childrenAge: "2 till 11 år",
      babiesLabel: "Bebisar",
      babiesAge: "0 och 1 år",
      fewerOf: function (naam) { return "Färre: " + naam; },
      moreOf: function (naam) { return "Fler: " + naam; },
      perPersonPrice: function (bedrag) { return "€" + bedrag + " per person"; },
      categoryLine: function (naam, n, prijs) { return naam + " (" + n + "): " + prijs; },
      groupTotalMixed: function (totaal, n) { return "Totalt €" + totaal + " för " + n + " personer"; },
      childNote: "Barn och bebisar betalar ett lägre pris för flygdelen av paketet. Resten av resan kostar lika mycket för alla. Åldern räknas på ankomstdagen.",
      ageRuleNote: "Minst en resenär måste vara 21 år eller äldre.",
      priceLoading: "Priset beräknas...",
      priceUnavailable: "Vi kunde inte visa priset med barn just nu. Totalen ser du i nästa steg.",
      personsLegend: "Hur många personer?",
      personsFewer: "En person färre",
      personsMore: "En person fler",
      durationsLegend: "Hur länge vill du stanna?",
      durationDays: function (n) { return n + (n === 1 ? " dag" : " dagar"); },
      durationAria: function (n, belopp) { return n + (n === 1 ? " dag" : " dagar") + (belopp ? ", " + belopp + " per person" : ""); },
      durationsLonger: "Du kan också stanna längre: klicka då på din avresedag i kalendern.",
      payPersonsNote: function (min, max) {
        var grupp = min === max ? min + (min === 1 ? " person" : " personer") : min + " till " + max + " personer";
        return "Du kan boka online för " + grupp + ". För andra gruppstorlekar skickar du en förfrågan om resan.";
      }
    },
    de: {
      months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      dayHeaders: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
      prevMonth: "Vorheriger Monat",
      nextMonth: "Nächster Monat",
      pauseAria: "Diashow pausieren",
      playAria: "Diashow abspielen",
      legendAvailable: "Verfügbar",
      legendBooked: "Bereits belegt",
      legendChosen: "Deine Auswahl",
      hintStart: "Klicke deinen Ankunftstag an, danach deinen Abreisetag.",
      hintEnd: function (ankunft, min) { return "Ankunft am " + ankunft + ". Wähle jetzt deinen Abreisetag - mindestens " + min + " Tage."; },
      reset: "Neu wählen",
      chosenLabel: "Dein Zeitraum",
      daysLabel: function (n) { return n + (n === 1 ? " Tag" : " Tage"); },
      continueBtn: "Weiter zur Anfrage",
      defaultBooked: "Belegt",
      availableAria: function (datum) { return datum + ", verfügbar"; },
      totalLabel: function (gesamt) { return "Gesamt €" + gesamt + " pro Person"; },
      groupTotalLabel: function (gesamt, n, pp) { return "Gesamt €" + pp + " pro Person (€" + gesamt + " für " + n + " Personen)"; },
      bookedTitle: function (was, von, bis) { return was + ": " + von + " bis " + bis; },
      bookedSr: function (was) { return " " + was + ", nicht verfügbar"; },
      warnMinDays: function (min) { return "Ein Aufenthalt dauert mindestens " + min + " Tage. Wähle einen späteren Abreisetag."; },
      warnOverlap: "In diesem Zeitraum liegt eine Woche, die bereits belegt ist. Wähle einen Zeitraum davor oder danach.",
      legendUncertain: "Eis unsicher",
      uncertainNote: "Die gestrichelten Tage kannst du ganz normal buchen, aber im Dezember ist das Eis am unsichersten.",
      guidingLegend: "Möchtest du Begleitung auf dem Eis?",
      guidingNone: "Keine",
      guidingFewer: "Einen Tag weniger Begleitung",
      guidingMore: "Einen Tag mehr Begleitung",
      guidingDays: function (n) { return n + (n === 1 ? " Tag" : " Tage"); },
      guidingPrice: function (betrag, extra) { return betrag + " pro Tag für 1 Person, + " + extra + " pro Tag für jede weitere Person - je mehr ihr seid, desto weniger kostet es pro Person."; },
      guidingWindow: function (von, bis) { return "Begleitung gibt es von " + von + " bis " + bis + ". Wähle zuerst deinen Zeitraum."; },
      guidingOutside: function (von, bis) { return "Im gewählten Zeitraum nicht möglich. Begleitung gibt es von " + von + " bis " + bis + "."; },
      legendPricier: "Teurere Nacht",
      pricierNote: "Ein Punkt bedeutet, dass die Nacht, die an diesem Tag beginnt, teurer ist. Dafür kommt pro Person ein Aufschlag hinzu, der schon im Gesamtpreis enthalten ist.",
      pricierAria: function (betrag) { return "teurere Nacht, Aufschlag " + betrag + " pro Person"; },
      pricierLine: function (betrag, n) { return "Inklusive " + betrag + " pro Person Aufschlag für " + n + (n === 1 ? " teurere Nacht" : " teurere Nächte"); },
      bookPayBtn: "Buchen und bezahlen",
      optionsLegend: "Was möchtest du selbst organisieren?",
      flightSelf: "Ich buche meinen Flug selbst",
      flightSelfHint: "Sonst ist der Hin- und Rückflug im Preis enthalten",
      lineFlight: "Flug selbst gebucht",
      childFlightSelfNote: "Wenn du deinen Flug selbst buchst, entfällt der niedrigere Preis für Kinder und Babys: Es gibt dann keinen Flugteil mehr, der günstiger sein könnte.",
      adultsLabel: "Erwachsene",
      adultsAge: "ab 12 Jahren",
      childrenLabel: "Kinder",
      childrenAge: "2 bis 11 Jahre",
      babiesLabel: "Babys",
      babiesAge: "0 und 1 Jahr",
      fewerOf: function (naam) { return "Weniger: " + naam; },
      moreOf: function (naam) { return "Mehr: " + naam; },
      perPersonPrice: function (bedrag) { return "€" + bedrag + " pro Person"; },
      categoryLine: function (naam, n, prijs) { return naam + " (" + n + "): " + prijs; },
      groupTotalMixed: function (totaal, n) { return "Gesamt €" + totaal + " für " + n + " Personen"; },
      childNote: "Kinder und Babys zahlen für den Flugteil des Pakets weniger. Der Rest der Reise kostet für alle gleich viel. Das Alter zählt am Anreisetag.",
      ageRuleNote: "Mindestens eine reisende Person muss 21 Jahre oder älter sein.",
      priceLoading: "Preis wird berechnet...",
      priceUnavailable: "Den Preis mit Kindern können wir gerade nicht anzeigen. Den Gesamtpreis siehst du im nächsten Schritt.",
      personsLegend: "Mit wie vielen Personen?",
      personsFewer: "Eine Person weniger",
      personsMore: "Eine Person mehr"
    },
    no: {
      months: ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"],
      dayHeaders: ["man", "tir", "ons", "tor", "fre", "lør", "søn"],
      prevMonth: "Forrige måned",
      nextMonth: "Neste måned",
      pauseAria: "Sett lysbildefremvisning på pause",
      playAria: "Spill av lysbildefremvisning",
      legendAvailable: "Tilgjengelig",
      legendBooked: "Allerede booket",
      legendChosen: "Ditt valg",
      hintStart: "Klikk på ankomstdagen din, og deretter avreisedagen.",
      hintEnd: function (ankomst, min) { return "Ankomst " + ankomst + ". Velg nå avreisedagen din - minst " + min + " dager."; },
      reset: "Velg på nytt",
      chosenLabel: "Din periode",
      daysLabel: function (n) { return n + (n === 1 ? " dag" : " dager"); },
      continueBtn: "Gå videre til forespørsel",
      defaultBooked: "Booket",
      availableAria: function (dato) { return dato + ", tilgjengelig"; },
      totalLabel: function (total) { return "Totalt €" + total + " per person"; },
      groupTotalLabel: function (total, n, pp) { return "Totalt €" + pp + " per person (€" + total + " for " + n + " personer)"; },
      bookedTitle: function (hva, fra, til) { return hva + ": " + fra + " til " + til; },
      bookedSr: function (hva) { return " " + hva + ", ikke tilgjengelig"; },
      warnMinDays: function (min) { return "Et opphold varer minst " + min + " dager. Velg en senere avreisedag."; },
      warnOverlap: "I den perioden ligger det en uke som allerede er booket. Velg en periode før eller etter.",
      legendUncertain: "Isen usikker",
      uncertainNote: "Dagene med strek kan du bestille som vanlig, men i desember er isen mest usikker.",
      guidingLegend: "Vil du ha veiledning på isen?",
      guidingNone: "Ingen",
      guidingFewer: "Én dag mindre veiledning",
      guidingMore: "Én dag mer veiledning",
      guidingDays: function (n) { return n + (n === 1 ? " dag" : " dager"); },
      guidingPrice: function (belop, extra) { return belop + " per dag for 1 person, + " + extra + " per dag for hver ekstra person, så jo flere dere er, desto mindre koster det per person."; },
      guidingWindow: function (fra, til) { return "Veiledning finnes fra " + fra + " til " + til + ". Velg først perioden din."; },
      guidingOutside: function (fra, til) { return "Ikke mulig i perioden du har valgt. Veiledning finnes fra " + fra + " til " + til + "."; },
      legendPricier: "Dyrere natt",
      pricierNote: "En prikk betyr at natten som begynner den dagen, er dyrere. Da kommer det et tillegg per person, som allerede er med i totalen.",
      pricierAria: function (belop) { return "dyrere natt, tillegg " + belop + " per person"; },
      pricierLine: function (belop, n) { return "Inkludert " + belop + " per person i tillegg for " + n + (n === 1 ? " dyrere natt" : " dyrere netter"); },
      bookPayBtn: "Book og betal",
      optionsLegend: "Hva vil du ordne selv?",
      flightSelf: "Jeg ordner flyet selv",
      flightSelfHint: "Ellers er tur-retur-flyet inkludert i prisen",
      lineFlight: "Eget fly",
      childFlightSelfNote: "Ordner du flyet selv, gjelder ikke lenger den lavere prisen for barn og babyer: da er det ingen flydel igjen å redusere.",
      adultsLabel: "Voksne",
      adultsAge: "12 år og eldre",
      childrenLabel: "Barn",
      childrenAge: "2 til 11 år",
      babiesLabel: "Babyer",
      babiesAge: "0 og 1 år",
      fewerOf: function (naam) { return "Færre: " + naam; },
      moreOf: function (naam) { return "Flere: " + naam; },
      perPersonPrice: function (bedrag) { return "€" + bedrag + " per person"; },
      categoryLine: function (naam, n, prijs) { return naam + " (" + n + "): " + prijs; },
      groupTotalMixed: function (totaal, n) { return "Totalt €" + totaal + " for " + n + " personer"; },
      childNote: "Barn og babyer betaler en lavere pris for flydelen av pakken. Resten av reisen koster det samme for alle. Alderen regnes på ankomstdagen.",
      ageRuleNote: "Minst én reisende må være 21 år eller eldre.",
      priceLoading: "Prisen beregnes...",
      priceUnavailable: "Vi kunne ikke vise prisen med barn akkurat nå. Totalen ser du i neste steg.",
      personsLegend: "Hvor mange personer?",
      personsFewer: "Én person færre",
      personsMore: "Én person flere"
    },
    fi: {
      months: ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"],
      dayHeaders: ["ma", "ti", "ke", "to", "pe", "la", "su"],
      prevMonth: "Edellinen kuukausi",
      nextMonth: "Seuraava kuukausi",
      pauseAria: "Pysäytä diaesitys",
      playAria: "Käynnistä diaesitys",
      legendAvailable: "Vapaa",
      legendBooked: "Jo varattu",
      legendChosen: "Valintasi",
      hintStart: "Valitse ensin saapumispäivä ja sitten lähtöpäivä.",
      hintEnd: function (saapuminen, min) { return "Saapuminen " + saapuminen + ". Valitse nyt lähtöpäivä - vähintään " + min + " päivää."; },
      reset: "Valitse uudelleen",
      chosenLabel: "Valittu ajanjakso",
      daysLabel: function (n) { return n + (n === 1 ? " päivä" : " päivää"); },
      continueBtn: "Jatka varauspyyntöön",
      defaultBooked: "Varattu",
      availableAria: function (pvm) { return pvm + ", vapaa"; },
      totalLabel: function (yhteensa) { return "Yhteensä €" + yhteensa + " / henkilö"; },
      groupTotalLabel: function (yhteensa, n, pp) { return "Yhteensä €" + pp + " / henkilö (€" + yhteensa + ", " + n + " henkilöä)"; },
      bookedTitle: function (mika, alkaen, saakka) { return mika + ": " + alkaen + " – " + saakka; },
      bookedSr: function (mika) { return " " + mika + ", ei vapaa"; },
      warnMinDays: function (min) { return "Vähimmäisoleskelu on " + min + " päivää. Valitse myöhäisempi lähtöpäivä."; },
      warnOverlap: "Kyseiselle ajanjaksolle osuu jo varattu viikko. Valitse ajanjakso ennen tai jälkeen.",
      legendUncertain: "Jää epävarma",
      uncertainNote: "Katkoviivalla merkityt päivät voi varata normaalisti, mutta joulukuussa jää on epävarmimmillaan.",
      guidingLegend: "Haluatko opastusta jäällä?",
      guidingNone: "Ei",
      guidingFewer: "Yksi opastuspäivä vähemmän",
      guidingMore: "Yksi opastuspäivä enemmän",
      guidingDays: function (n) { return n + (n === 1 ? " päivä" : " päivää"); },
      guidingPrice: function (summa, lisa) { return summa + " päivässä 1 hengelle, + " + lisa + " päivässä jokaisesta lisähenkilöstä, eli mitä useampi teitä on, sitä vähemmän se maksaa per henkilö."; },
      guidingWindow: function (alkaen, saakka) { return "Opastusta on saatavilla " + alkaen + " - " + saakka + ". Valitse ensin ajanjakso."; },
      guidingOutside: function (alkaen, saakka) { return "Ei mahdollista valitsemanasi ajankohtana. Opastusta on saatavilla " + alkaen + " - " + saakka + "."; },
      legendPricier: "Kalliimpi yö",
      pricierNote: "Piste tarkoittaa, että sinä päivänä alkava yö on kalliimpi. Siitä tulee lisämaksu per henkilö, joka sisältyy jo kokonaishintaan.",
      pricierAria: function (summa) { return "kalliimpi yö, lisämaksu " + summa + " / henkilö"; },
      pricierLine: function (summa, n) { return "Sisältää " + summa + " / henkilö lisämaksua " + n + " kalliimmasta yöstä"; },
      bookPayBtn: "Varaa ja maksa",
      optionsLegend: "Mitä haluat järjestää itse?",
      flightSelf: "Järjestän lentoni itse",
      flightSelfHint: "Muuten meno-paluulento sisältyy hintaan",
      lineFlight: "Oma lento",
      childFlightSelfNote: "Jos järjestät lentosi itse, lasten ja vauvojen alempi hinta ei enää päde: silloin ei ole lentoosuutta, jota voisi alentaa.",
      adultsLabel: "Aikuiset",
      adultsAge: "12-vuotiaat ja vanhemmat",
      childrenLabel: "Lapset",
      childrenAge: "2-11-vuotiaat",
      babiesLabel: "Vauvat",
      babiesAge: "0-1-vuotiaat",
      fewerOf: function (naam) { return "Vähemmän: " + naam; },
      moreOf: function (naam) { return "Lisää: " + naam; },
      perPersonPrice: function (bedrag) { return "€" + bedrag + " / henkilö"; },
      categoryLine: function (naam, n, prijs) { return naam + " (" + n + "): " + prijs; },
      groupTotalMixed: function (totaal, n) { return "Yhteensä €" + totaal + ", " + n + " henkilöä"; },
      childNote: "Lapset ja vauvat maksavat paketin lentoosuudesta alemman hinnan. Muu matka maksaa kaikille saman. Ikä lasketaan saapumispäivänä.",
      ageRuleNote: "Vähintään yhden matkustajan on oltava 21-vuotias tai vanhempi.",
      priceLoading: "Hintaa lasketaan...",
      priceUnavailable: "Lasten kanssa hintaa ei voitu nyt näyttää. Kokonaishinnan näet seuraavassa vaiheessa.",
      personsLegend: "Kuinka monta henkilöä?",
      personsFewer: "Yksi henkilö vähemmän",
      personsMore: "Yksi henkilö enemmän"
    }
  };
  var LANG = (document.documentElement.lang || "nl").slice(0, 2).toLowerCase();
  var T = I18N[LANG] || I18N.nl;
  // A text that is not translated (yet) falls back to the Dutch one.
  Object.keys(I18N.nl).forEach(function (sleutel) {
    if (!(sleutel in T)) T[sleutel] = I18N.nl[sleutel];
  });

  /* Dates and amounts on screen follow the page language: "1.990" / "1,990"
     / "1 990", "2 februari" / "2. Februar" / "2. helmikuuta". Display only:
     amounts sent to the booking and payment pages stay plain numbers. */
  var LOCALE = { nl: "nl-NL", en: "en-GB", de: "de-DE", sv: "sv-SE", no: "nb-NO", fi: "fi-FI" }[LANG] || "nl-NL";
  function getal(n, opties) {
    try { return n.toLocaleString(LOCALE, opties); } catch (fout) { return n.toLocaleString("nl-NL", opties); }
  }

  /* ------------------------------------------------------------------
     Elfsight widgets (reviews, Instagram) get their height reserved in CSS
     so the page does not jump when they load. If the Elfsight script cannot
     load (blocked by an ad blocker, offline), that reserve would stay empty:
     .no-elfsight drops it again. Error events do not bubble, so listen in
     the capture phase; main.js runs before the async script tag is parsed.
     ------------------------------------------------------------------ */
  window.addEventListener("error", function (event) {
    var el = event.target;
    if (el && el.tagName === "SCRIPT" && /elfsight/i.test(el.src || "")) {
      document.documentElement.classList.add("no-elfsight");
    }
  }, true);

  /* Elfsight's lazy mode (data-elfsight-app-lazy) boots a widget on the
     visitor's first scroll or touch, wherever the widget is. On the homepage
     that meant about a second of Elfsight script (long tasks of 170-480 ms
     on a phone) right when the visitor starts scrolling down from the top,
     so the page stuttered. Instead the widget is taken out of the page until
     it comes within 3 screens of the viewport (far enough ahead for Elfsight
     to finish, including its own 1 s delay, before the widget scrolls in),
     and is then put back at the first pause in scrolling, so that work does
     not land in the middle of a scroll either. Once the widget itself is on
     screen it goes back straight away. Elfsight's own MutationObserver picks
     it up from there. A placeholder keeps the reserved height (see
     .insta-follow in css/styles.css). This runs before Elfsight's async
     platform.js, so Elfsight never sees the widget early. */
  if ("IntersectionObserver" in window) {
    Array.prototype.forEach.call(
      document.querySelectorAll('[class^="elfsight-app-"][data-elfsight-app-lazy]'),
      function (widget) {
        var placeholder = document.createElement("div");
        placeholder.setAttribute("data-elfsight-deferred", "");
        widget.parentNode.replaceChild(placeholder, widget);

        var pauseTimer = null;
        var observers = [];
        var restore = function () {
          if (!placeholder.parentNode) return;
          observers.forEach(function (observer) { observer.disconnect(); });
          window.clearTimeout(pauseTimer);
          window.removeEventListener("scroll", waitForPause);
          placeholder.parentNode.replaceChild(widget, placeholder);
        };
        var waitForPause = function () {
          window.clearTimeout(pauseTimer);
          pauseTimer = window.setTimeout(restore, 250);
        };
        var watch = function (margin, onEnter) {
          var observer = new IntersectionObserver(function (entries) {
            if (entries.some(function (entry) { return entry.isIntersecting; })) onEnter();
          }, { rootMargin: margin });
          observer.observe(placeholder);
          observers.push(observer);
        };

        watch("300% 0px 300% 0px", function () {
          observers[0].disconnect();
          window.addEventListener("scroll", waitForPause, { passive: true });
          waitForPause();
        });
        watch("0px", restore);
      }
    );
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  var toggle = document.getElementById("navToggle");
  var closeBtn = document.getElementById("navClose");
  var nav = document.getElementById("mainNav");
  var header = document.querySelector(".site-header");

  /* ------------------------------------------------------------------
     Donker blok: kleurt pas om zodra het scherm volledig op deze sectie zit,
     dus wanneer de bovenrand voorbij de bovenkant van het scherm is en de
     sectie het beeld nog grotendeels vult. Zodra de sectie uit beeld raakt,
     valt hij terug op wit, zodat de omslag opnieuw afspeelt als je er weer
     langs scrolt. Zonder een thema dat hier styling voor heeft, doet deze
     klasse niets.
     Staat vóór de header-sync hieronder: syncHeader leest is-snapped, dus
     moet zowel bij page-load als bij elk scroll-event ná syncSnap draaien
     (registratie- en aanroepvolgorde bepalen de rAF-volgorde binnen een
     frame), anders loopt de balk een frame achter of start hij fout.
     ------------------------------------------------------------------ */
  var snapSection = document.querySelector(".why");

  if (snapSection) {
    var snapTicking = false;

    var syncSnap = function () {
      var rect = snapSection.getBoundingClientRect();
      var vh = window.innerHeight;

      // Terug naar wit gebeurt pas als de sectie volledig buiten beeld is —
      // boven- of onderlangs. Zo zie je die omslag nooit gebeuren.
      if (rect.bottom <= 0 || rect.top >= vh) {
        snapSection.classList.remove("is-snapped");
        return;
      }

      // Naar groen zodra de sectie het scherm vult. Is de sectie zelf korter
      // dan het scherm, dan telt of hij vrijwel helemaal in beeld staat.
      var zichtbaar = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      if (zichtbaar >= vh * 0.6 || zichtbaar >= rect.height * 0.8) {
        snapSection.classList.add("is-snapped");
      }
      // Zit hij daartussenin? Dan blijft staan wat er staat.
    };

    window.addEventListener("scroll", function () {
      if (snapTicking) return;
      snapTicking = true;
      window.requestAnimationFrame(function () {
        syncSnap();
        snapTicking = false;
      });
    }, { passive: true });

    window.addEventListener("resize", syncSnap);
    syncSnap();
  }

  /* ------------------------------------------------------------------
     Header: altijd doorzichtig, geen witte balk. De tekst en het logo
     wisselen automatisch tussen wit en donker, op basis van wat er op
     dat moment achter de balk zit (foto/donkere sectie = wit, lichte
     sectie = donker). De schaduwrand boven de openingsfoto is er alleen
     zolang die foto ook echt achter de balk zit.
     ------------------------------------------------------------------ */
  var heroEl = document.querySelector(".opener, .page-hero");
  /* Op de homepage staat het beeldmerk groot in het openingsscherm. Zolang
     dat grote logo nog in beeld is, blijft het kleine logo in de balk weg;
     het verschijnt pas rustig zodra er voorbij het grote logo is gescrold. */
  var openerMark = document.querySelector(".opener__mark");
  var darkZoneEls = Array.prototype.slice.call(
    document.querySelectorAll(".opener, .page-hero, .factbar, .why, .layered, .choice")
  );

  function overlapsHeaderBand(el) {
    var band = header.offsetHeight;
    var rect = el.getBoundingClientRect();
    return rect.top < band && rect.bottom > 0;
  }

  function syncHeader() {
    if (!header) return;

    header.classList.toggle("site-header--scrolled", window.scrollY > 4);

    if (openerMark) {
      var markPassed = openerMark.getBoundingClientRect().bottom <= header.offsetHeight;
      header.classList.toggle("site-header--logo-shown", markPassed);
    }

    header.classList.toggle("site-header--over-hero", !!heroEl && overlapsHeaderBand(heroEl));

    var onDark = darkZoneEls.some(function (el) {
      if (el.classList.contains("why")) {
        // De "why"-sectie is pas echt donker zodra hij is omgeslagen naar
        // groen (is-snapped, zie syncSnap hierboven). Zolang dat zo is
        // en de balk er nog overheen staat, blijft de balk donker — ook
        // verderop in een lange sectie, waar maar een klein stukje nog in
        // de balk-band valt.
        return el.classList.contains("is-snapped") && overlapsHeaderBand(el);
      }
      return overlapsHeaderBand(el);
    });
    header.classList.toggle("site-header--on-light", !onDark);
  }

  if (header) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        syncHeader();
        ticking = false;
      });
    }, { passive: true });
    window.addEventListener("resize", syncHeader);
    syncHeader();
  }

  /* returnFocus: after closing with Esc or the close button, keyboard focus
     goes back to the menu button (the open menu covered it). */
  function closeNav(returnFocus) {
    if (!nav || !toggle) return;
    var wasOpen = nav.classList.contains("is-open");
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    closeLangSwitch();
    syncHeader();
    if (wasOpen && returnFocus === true) toggle.focus();
  }

  // Focusable items of the open menu, in tab order (skips the hidden
  // language list while it is folded in).
  function navFocusables() {
    return Array.prototype.filter.call(
      nav.querySelectorAll("a[href], button:not([disabled])"),
      function (el) {
        return el.getClientRects().length > 0 && window.getComputedStyle(el).visibility === "visible";
      }
    );
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.contains("is-open");
      if (isOpen) {
        closeNav(true);
      } else {
        nav.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
        syncHeader();
        // The open menu covers the page and the menu button: move focus
        // into it, so keyboard and screen reader users start there.
        var first = closeBtn || navFocusables()[0];
        if (first) first.focus();
      }
    });

    if (closeBtn) closeBtn.addEventListener("click", function () { closeNav(true); });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { closeNav(); });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !nav.classList.contains("is-open")) return;
      // An open language list closes first (see below); Esc again closes the menu.
      if (langSwitch && langSwitch.classList.contains("is-open")) return;
      closeNav(true);
    });

    // Keep Tab inside the open menu: the page behind it is covered, so focus
    // must not wander off onto links that cannot be seen.
    nav.addEventListener("keydown", function (event) {
      if (event.key !== "Tab" || !nav.classList.contains("is-open")) return;
      var items = navFocusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    var wideScreen = window.matchMedia("(min-width: 72rem)");
    var onWideScreen = function (e) {
      if (e.matches) closeNav();
    };
    // Safari before 14 only knows addListener on a media query list.
    if (wideScreen.addEventListener) {
      wideScreen.addEventListener("change", onWideScreen);
    } else if (wideScreen.addListener) {
      wideScreen.addListener(onWideScreen);
    }

    // Bij terugkeer vanuit de bfcache (bv. via de terug-knop) herstelt de
    // browser de pagina precies zoals hij was toen je wegnavigeerde, zonder
    // dat main.js opnieuw draait. Stond het menu toen nog open, dan blijft
    // het dat ook nu — alsof het vanzelf openklapt bij het laden. Forceer
    // daarom een schone, gesloten staat bij elke bfcache-restore.
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) closeNav();
    });
  }

  /* ------------------------------------------------------------------
     Taalkiezer: toont alleen de actieve taal; klik op de knop opent een
     uitklapmenu met de overige talen.
     ------------------------------------------------------------------ */
  var langSwitch = document.querySelector(".lang-switch");
  var langToggle = langSwitch && langSwitch.querySelector(".lang-switch__toggle");

  function closeLangSwitch() {
    if (!langSwitch || !langToggle) return;
    langSwitch.classList.remove("is-open");
    langToggle.setAttribute("aria-expanded", "false");
  }

  if (langSwitch && langToggle) {
    langToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var isOpen = langSwitch.classList.toggle("is-open");
      langToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", function (event) {
      if (!langSwitch.contains(event.target)) closeLangSwitch();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !langSwitch.classList.contains("is-open")) return;
      // Focus on one of the (now hidden) languages goes back to the button.
      var focusInside = langSwitch.contains(document.activeElement);
      closeLangSwitch();
      if (focusInside) langToggle.focus();
    });

    // Tabbing out of the language list folds it in again. Only when focus
    // really lands elsewhere; a click on a language keeps it open.
    langSwitch.addEventListener("focusout", function (event) {
      if (event.relatedTarget && !langSwitch.contains(event.relatedTarget)) closeLangSwitch();
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveal — runs once per element, opacity + transform only.
     Without JS the .js class is absent, so content stays visible.
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal, .stagger");
  if (revealEls.length && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ------------------------------------------------------------------
     Tekst die meekleurt met het scrollen: woorden staan gedimd en worden
     woord voor woord vol zodra je verder scrolt. Werkt via opacity, dus
     zowel op donkere als op lichte vlakken.
     ------------------------------------------------------------------ */
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var wordBlocks = [];

  // Viewport height for the scroll-linked effects below (words, collage).
  // On phones window.innerHeight grows and shrinks whenever the address bar
  // slides out or back in (typically when the scroll direction reverses),
  // which made these effects jump on the resize event. The root element's
  // clientHeight stays the same while the address bar moves.
  function stableViewportHeight() {
    return document.documentElement.clientHeight || window.innerHeight;
  }

  document.querySelectorAll("[data-reveal-words]").forEach(function (el) {
    var parts = el.textContent.split(/(\s+)/);
    el.textContent = "";
    var spans = [];
    parts.forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        el.appendChild(document.createTextNode(part));
        return;
      }
      var span = document.createElement("span");
      span.className = "rw";
      span.textContent = part;
      el.appendChild(span);
      spans.push(span);
    });
    if (spans.length) wordBlocks.push({ el: el, spans: spans });
  });

  function syncWords() {
    var vh = stableViewportHeight();

    // Eerst alles meten, daarna pas schrijven. Door lezen en schrijven niet af
    // te wisselen hoeft de browser de pagina niet telkens opnieuw te berekenen,
    // en blijft het scrollen soepel.
    var work = wordBlocks.map(function (block) {
      var rect = block.el.getBoundingClientRect();
      // 0 = nog niet begonnen, 1 = volledig doorgekleurd
      var progress = (vh * 0.85 - rect.top) / (vh * 0.55);
      return {
        block: block,
        progress: Math.min(1, Math.max(0, progress)),
        offscreen: rect.bottom < -vh || rect.top > vh * 1.5
      };
    });

    work.forEach(function (item) {
      var block = item.block;

      // Ver buiten beeld, of niets veranderd sinds de vorige keer? Overslaan.
      if (item.offscreen) return;
      if (block.progress !== undefined && Math.abs(block.progress - item.progress) < 0.004) return;
      block.progress = item.progress;

      // Alle woorden starten binnen de eerste 70% van de voortgang, zodat ook
      // het laatste woord volledig doorkleurt voordat de voortgang op 1 staat.
      var total = block.spans.length;
      block.spans.forEach(function (el, i) {
        var start = (i / total) * 0.7;
        var value = (item.progress - start) / 0.3;
        el.style.opacity = Math.min(1, Math.max(0.26, value));
      });
    });
  }

  if (wordBlocks.length) {
    if (reducedMotion.matches) {
      wordBlocks.forEach(function (b) {
        b.spans.forEach(function (s) { s.style.opacity = 1; });
      });
    } else {
      var wordTicking = false;
      window.addEventListener("scroll", function () {
        if (wordTicking) return;
        wordTicking = true;
        window.requestAnimationFrame(function () {
          syncWords();
          wordTicking = false;
        });
      }, { passive: true });
      window.addEventListener("resize", syncWords);
      syncWords();
    }
  }

  /* ------------------------------------------------------------------
     Openingsvideo: bij het naadloos herstarten van de loop toont de
     browser heel even het verkeerde frame (bekend `loop`-euvel bij
     H.264-video). Een korte opacity-dip rond het herstartmoment
     verbergt die flits.
     ------------------------------------------------------------------ */
  var heroVideo = document.querySelector(".opener__video");
  if (heroVideo) {
    /* De opening is een liggende 16:9-video. Op een staand telefoonscherm
       vergroot `object-fit: cover` die ruim twee keer uit, waardoor hij daar
       onscherp oogt terwijl hij op een breed scherm juist scherp is. Op smalle,
       staande schermen laden we daarom een staande uitsnede uit hetzelfde
       4K-origineel; het beeldkader op het scherm blijft precies gelijk. */
    var tallScreen = window.matchMedia("(max-aspect-ratio: 4/5)");
    var chooseHeroSource = function () {
      var kind = tallScreen.matches ? "tall" : "wide";
      if (heroVideo.dataset.active === kind) return;
      heroVideo.dataset.active = kind;
      var poster = kind === "tall" ? heroVideo.dataset.posterTall : heroVideo.dataset.posterWide;
      var src = kind === "tall" ? heroVideo.dataset.srcTall : heroVideo.dataset.srcWide;
      if (poster) heroVideo.poster = poster;
      if (src) {
        heroVideo.src = src;
        heroVideo.load();
      }
    };
    chooseHeroSource();
    if (tallScreen.addEventListener) {
      tallScreen.addEventListener("change", chooseHeroSource);
    } else if (tallScreen.addListener) {
      tallScreen.addListener(chooseHeroSource);
    }

    var LOOP_FADE_S = 0.26;
    heroVideo.addEventListener("timeupdate", function () {
      if (heroVideo.duration && heroVideo.duration - heroVideo.currentTime < LOOP_FADE_S) {
        heroVideo.classList.add("opener__video--loop-fade");
      }
    });
    heroVideo.addEventListener("seeked", function () {
      if (heroVideo.currentTime < LOOP_FADE_S) {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            heroVideo.classList.remove("opener__video--loop-fade");
          });
        });
      }
    });

    /* De opening speelt automatisch en eindeloos door. Bezoekers die minder
       beweging willen krijgen een stilstaand beeld: de CSS-mediaquery raakt
       videoafspelen niet, dus dat moet hier. */
    var applyVideoMotion = function () {
      if (reducedMotion.matches) {
        heroVideo.removeAttribute("autoplay");
        heroVideo.loop = false;
        heroVideo.pause();
        heroVideo.currentTime = 0;
      } else if (heroVideo.paused) {
        heroVideo.loop = true;
        var speelt = heroVideo.play();
        if (speelt && speelt.catch) speelt.catch(function () {});
      }
    };
    applyVideoMotion();
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener("change", applyVideoMotion);
    } else if (reducedMotion.addListener) {
      reducedMotion.addListener(applyVideoMotion);
    }
  }

  /* ------------------------------------------------------------------
     Openingsfoto's: een rustige diavoorstelling.

     - Elke foto blijft SLIDE_MS staan en vloeit daarna over in de volgende.
     - Bezoekers kunnen zelf doorklikken met de pijlen of de streepjes.
     - Er is een pauzeknop; wie zelf klikt, krijgt de volle wachttijd opnieuw.
     - Bij voorkeur voor minder beweging staat de voorstelling stil; klikken
       blijft dan gewoon werken.
     - Alleen de eerste foto laadt met de pagina mee; de rest volgt daarna,
       zodat de site snel blijft openen.
     ------------------------------------------------------------------ */
  var SLIDE_MS = 5000;   // hoe lang een foto blijft staan

  var slidesBox = document.getElementById("openerSlides");
  var dotsBox = document.getElementById("openerDots");

  if (slidesBox && dotsBox) {
    var slides = slidesBox.querySelectorAll(".opener__bg");
    var dots = dotsBox.querySelectorAll(".opener__dot");
    var prevBtn = document.getElementById("openerPrev");
    var nextBtn = document.getElementById("openerNext");
    var pauseBtn = document.getElementById("openerPause");
    var controls = slidesBox.parentNode.querySelector(".opener__controls");

    if (slides.length < 2) {
      if (controls) controls.style.display = "none";
    } else {
      var current = 0;
      var timer = null;
      var stoppedByUser = false;   // pauzeknop ingedrukt
      var inView = true;           // openingsfoto nog in beeld
      var autoplay = !reducedMotion.matches;

      dotsBox.style.setProperty("--opener-ms", SLIDE_MS + "ms");

      var loadSlide = function (index) {
        var img = slides[index];
        if (img && img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
      };

      var stopTimer = function () {
        if (timer) { window.clearTimeout(timer); timer = null; }
      };

      var startTimer = function () {
        stopTimer();
        if (!autoplay || stoppedByUser || !inView) {
          dotsBox.classList.remove("is-playing");
          return;
        }
        // De klasse opnieuw zetten laat het streepje weer vanaf nul vollopen.
        dotsBox.classList.remove("is-playing");
        void dotsBox.offsetWidth;
        dotsBox.classList.add("is-playing");
        timer = window.setTimeout(function () { show(current + 1); }, SLIDE_MS);
      };

      var show = function (index) {
        var next = (index + slides.length) % slides.length;
        loadSlide(next);
        loadSlide((next + 1) % slides.length);

        slides[current].classList.remove("is-active");
        // A missing dot (fewer dots than photos) must not stop the slideshow.
        if (dots[current]) {
          dots[current].classList.remove("is-active");
          dots[current].removeAttribute("aria-current");
        }

        current = next;
        slides[current].classList.add("is-active");
        if (dots[current]) {
          dots[current].classList.add("is-active");
          dots[current].setAttribute("aria-current", "true");
        }

        startTimer();
      };

      // Zelf doorklikken: de wachttijd begint daarna opnieuw.
      if (nextBtn) nextBtn.addEventListener("click", function () { show(current + 1); });
      if (prevBtn) prevBtn.addEventListener("click", function () { show(current - 1); });

      dots.forEach(function (dot, i) {
        dot.addEventListener("click", function () {
          if (i !== current) show(i);
        });
      });

      if (pauseBtn) {
        if (!autoplay) {
          pauseBtn.style.display = "none";
        } else {
          pauseBtn.addEventListener("click", function () {
            stoppedByUser = !stoppedByUser;
            pauseBtn.classList.toggle("is-paused", stoppedByUser);
            pauseBtn.setAttribute(
              "aria-label",
              stoppedByUser ? T.playAria : T.pauseAria
            );
            dotsBox.classList.toggle("is-paused", stoppedByUser);
            if (stoppedByUser) { stopTimer(); } else { startTimer(); }
          });
        }
      }

      // Pijltjestoetsen werken zodra de aandacht in de openingssectie ligt.
      var opener = slidesBox.closest(".opener");
      if (opener) {
        opener.addEventListener("keydown", function (event) {
          if (event.key === "ArrowRight") { event.preventDefault(); show(current + 1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); show(current - 1); }
        });
      }

      // Vegen op een telefoon
      var touchX = null;
      slidesBox.addEventListener("touchstart", function (event) {
        touchX = event.changedTouches[0].clientX;
      }, { passive: true });
      slidesBox.addEventListener("touchend", function (event) {
        if (touchX === null) return;
        var delta = event.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(delta) > 45) show(current + (delta < 0 ? 1 : -1));
      }, { passive: true });

      // Niets laten draaien als de foto niet in beeld staat of het tabblad weg is.
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { stopTimer(); } else { startTimer(); }
      });

      if ("IntersectionObserver" in window && opener) {
        new IntersectionObserver(function (entries) {
          inView = entries[0].isIntersecting;
          if (inView) { startTimer(); } else { stopTimer(); }
        }, { threshold: 0.15 }).observe(opener);
      }

      // De overige foto's pas ophalen als de pagina verder klaar is.
      window.addEventListener("load", function () {
        for (var i = 1; i < slides.length; i++) loadSlide(i);
      });

      startTimer();
    }
  }

  /* ------------------------------------------------------------------
     Reiskalender waarin de bezoeker zelf een periode kiest.

     De gegevens staan als lijstje boven in de pagina zelf, in een blokje
     <script type="application/json">. Daarin staat wanneer het seizoen loopt,
     wat een nacht per persoon kost, hoeveel nachten je minimaal boekt en welke
     periodes al bezet zijn. Wie iets wijzigt, hoeft alleen dat lijstje aan te
     passen - hier verandert niets.

     De dagprijs staat niet in de losse dagen. Pas als er een aankomst- en een
     vertrekdag gekozen zijn, verschijnt onderaan het totaalbedrag per persoon
     (aantal nachten x dagprijs).

     Bezette periodes kun je niet aanklikken en je kunt er ook niet overheen
     selecteren. Zodra er een geldige periode staat, verschijnt onderaan een
     knop naar de aanvraagpagina; de gekozen datums gaan als webadres mee.

     Gaat er iets mis in het lijstje, dan blijft de gewone tekst staan die er
     zonder JavaScript ook al is.
     ------------------------------------------------------------------ */
  var MAANDEN = T.months;
  var DAGKOPPEN = T.dayHeaders;

  /* Leest een datum als "2027-01-16". Alles wat die vorm niet heeft - een leeg
     webadres, een typefout, een dag die niet bestaat - geeft null terug. Zo
     komt er nooit een kapotte datum in de kalender of op het scherm. */
  function alsDatum(tekst) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tekst))) return null;
    var d = String(tekst).split("-");
    var datum = new Date(+d[0], +d[1] - 1, +d[2]);
    if (isNaN(datum.getTime())) return null;
    // Vangt 31 februari en dergelijke: die rolt stilletjes door naar de maand erna.
    if (datum.getMonth() !== +d[1] - 1 || datum.getDate() !== +d[2]) return null;
    // new Date() reads the years 0-99 as 1900-1999; such a year is a typo here.
    if (datum.getFullYear() !== +d[0]) return null;
    return datum;
  }
  function alsTekst(datum) {
    function twee(n) { return (n < 10 ? "0" : "") + n; }
    return datum.getFullYear() + "-" + twee(datum.getMonth() + 1) + "-" + twee(datum.getDate());
  }
  var datumFormaat = null;
  try {
    datumFormaat = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric" });
  } catch (fout) { /* old browser: the plain form below */ }
  function schrijfDatum(datum) {
    if (datumFormaat) return datumFormaat.format(datum);
    return datum.getDate() + " " + MAANDEN[datum.getMonth()] + " " + datum.getFullYear();
  }
  function dagenTussen(van, tot) {
    return Math.round((tot - van) / 86400000);
  }

  /* "" op de Nederlandse site, "../" in de taalmappen. De paden in het
     gegevensblokje gaan uit van de hoofdmap. */
  function mapVoorKalender() {
    var eigen = document.querySelector('script[src$="js/main.js"]');
    var src = eigen ? eigen.getAttribute("src") : "";
    return src.replace(/js\/main\.js$/, "");
  }

  /* Haalt het prijzenbestand op en neemt de gegevens over in data. De regels
     die met // beginnen zijn uitleg voor wie het bestand bijwerkt; die horen
     niet in de gegevens thuis. Lukt het ophalen niet, dan gebeurt er niets
     en blijft de gewone tekst staan die er zonder JavaScript ook al is. */
  function laadPrijzen(pad, data, klaar) {
    fetch(pad).then(function (antwoord) {
      return antwoord.ok ? antwoord.json() : null;
    }).then(function (uitBestand) {
      if (!uitBestand) return;
      Object.keys(uitBestand).forEach(function (sleutel) {
        if (sleutel.indexOf("//") !== 0) data[sleutel] = uitBestand[sleutel];
      });
      klaar();
    })["catch"](function () { /* gewone tekst blijft staan */ });
  }

  document.querySelectorAll("[data-calendar]").forEach(function (box) {
    var bron = box.querySelector("script.calendar__data");
    if (!bron) return;

    var data;
    try { data = JSON.parse(bron.textContent); } catch (fout) { return; }
    if (!data) return;

    /* Staat er een prijzenbestand bij, dan komen het seizoen, het kortste
       verblijf, de bezette weken en de prijzen daarvandaan. Zo staan ze op
       een plek in plaats van zes keer in de taalversies. */
    if (typeof data.prijzen === "string" && data.prijzen) {
      laadPrijzen(mapVoorKalender() + data.prijzen, data, function () {
        bouwKalender(box, data);
      });
      return;
    }

    bouwKalender(box, data);
  });

  /* The same calendar as a step on the booking page (boeken.html, via
     js/boeken.js). It works exactly as on the trip page: persons stepper,
     guiding, the price for the group and the "Book and pay" link to
     uitchecken.html, so both pages always show the same amount. Only the
     starting choice comes from opties instead of the web address, and
     onWijzig hears about every change so the page can keep its address in
     step.

       NovakseReiskalender.start(box, pad, {
         reis: "lulea",                          // ?reis= for uitchecken.html
         van: "2027-01-10", tot: "2027-01-14",   // optional starting period
         personen: "3", begeleidingDagen: "2",   // optional
         vlucht: "zelf",                         // optional: own flight ticked
         onWijzig: function (keuze) { ... }      // { van, tot, personen, begeleidingDagen, vlucht }
       }) */
  window.NovakseReiskalender = {
    start: function (box, pad, opties) {
      opties = opties || {};
      var data = {};
      laadPrijzen(pad, data, function () {
        if (opties.reis) data.reis = opties.reis;
        bouwKalender(box, data, opties);
      });
    }
  };

  // Give every guiding block and persons field its own id.
  var begeleidingTeller = 0;
  var personenTeller = 0;
  var duurTeller = 0;
  var vluchtTeller = 0;

  function bouwKalender(box, data, opties) {
    if (!data.seizoenStart || !data.seizoenEind) return;
    // On the booking page (boeken.html) the starting choice comes from opties;
    // on the trip page from the web address (trip finder, shared links).
    var opBoekpagina = Boolean(opties);
    var adres = new URLSearchParams(window.location.search);
    var vooraf = opBoekpagina
      ? { van: opties.van, tot: opties.tot, personen: opties.personen, kinderen: opties.kinderen, baby: opties.baby, begeleiding: opties.begeleidingDagen, vlucht: opties.vlucht }
      : { van: adres.get("van"), tot: adres.get("tot"), personen: adres.get("personen"), kinderen: adres.get("kinderen"), baby: adres.get("baby"), begeleiding: adres.get("begeleiding"), vlucht: adres.get("vlucht") };

    var seizoenVan = alsDatum(data.seizoenStart);
    var seizoenTot = alsDatum(data.seizoenEind);
    // Staat er een onleesbare of omgekeerde periode in het blokje, dan blijft
    // de gewone tekst staan die er zonder JavaScript ook al is.
    if (!seizoenVan || !seizoenTot || seizoenTot <= seizoenVan) return;

    var minNachten = data.minimumNachten || 1;
    var dagprijs = data.prijsPerPersoonPerDag || 0;

    /* Pay online ("afrekenen": true in the price file). The calendar then
       gets a persons stepper and a "Book and pay" link to uitchecken.html
       instead of the button to the request form, on the trip page and on
       the booking page alike. */
    var afrekenen = data.afrekenen === true;
    var personenKeuze = data.personen || {};
    var personenMin = Math.max(1, parseInt(personenKeuze.min, 10) || 1);
    var personenMax = Math.max(personenMin, parseInt(personenKeuze.max, 10) || 20);
    function binnenPersonen(n) {
      return Math.min(personenMax, Math.max(personenMin, n));
    }
    var personen = binnenPersonen(2); // everyone together: adults, children and babies
    /* Children (2 to 11) and babies (0 and 1) are counted inside "personen".
       Everyone else is an adult (12 and older), and at least one adult is
       always there. Only the flight part of the package costs less for a
       child or a baby; the server (api/_kinderprijs.js) knows how much and
       sends the price per person back. The amount itself never reaches this
       file. */
    var kinderen = 0;
    var baby = 0;
    function volwassenen() { return personen - kinderen - baby; }
    // Sets the three counts when they fit (at least 1 adult, personenMin to
    // personenMax in total). Returns true when something changed.
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

    /* Optional ("betaalPersonen" in the price file, e.g. wellness): the group
       sizes that can book and pay online. For any other size there is no
       amount to pay, so the calendar shows the link to the request form
       instead, with a short note. The server (api/_reis-prijs.js) refuses
       the same sizes. Without it every size from "personen" can pay. */
    var betaalKeuze = data.betaalPersonen && typeof data.betaalPersonen === "object" ? data.betaalPersonen : null;
    var betaalMin = betaalKeuze ? (parseInt(betaalKeuze.min, 10) || personenMin) : personenMin;
    var betaalMax = betaalKeuze ? (parseInt(betaalKeuze.max, 10) || personenMax) : personenMax;
    function magBetalen(aantal) {
      return !betaalKeuze || (aantal >= betaalMin && aantal <= betaalMax);
    }

    /* Group pricing ("groepsKorting.perPersoonPerNacht" in the price file):
       euros per person per night relative to 2 persons, keyed by group size.
       Negative is a discount; a missing size counts as 0. The server
       (api/create-payment.js) uses exactly the same rule. */
    // The size passed in is adults plus children: babies (0-1) do not count
    // towards the group size here (api/_reis-prijs.js does the same).
    function groepsKortingPerNacht(aantal) {
      var lijst = data.groepsKorting && data.groepsKorting.perPersoonPerNacht;
      var waarde = lijst ? lijst[String(aantal)] : 0;
      return typeof waarde === "number" && isFinite(waarde) ? waarde : 0;
    }

    /* Optional ("opties.vluchtZelf" in the price file, same as in
       data/falun-prijzen.json): when paying online the visitor can tick "I'll
       arrange my own flight". That fixed amount per person then comes off,
       after the group price per night, and children and babies pay the adult
       price (the server's answer in haalKinderPrijzen says so). Only a
       positive number counts; otherwise there is no checkbox and the flight
       stays in the price as always. api/_reis-prijs.js applies exactly the
       same rule, so the amount on screen is the amount charged. */
    var vluchtBedrag = (function () {
      var waarde = data.opties && data.opties.vluchtZelf;
      return typeof waarde === "number" && isFinite(waarde) && waarde > 0 ? Math.round(waarde) : 0;
    })();
    var metVluchtKeuze = afrekenen && vluchtBedrag > 0;
    // A link or the booking page may bring it along ticked: only vlucht=zelf counts.
    var vluchtZelf = metVluchtKeuze && vooraf.vlucht === "zelf";
    // The amount per person that comes off now; 0 without the tick.
    function vluchtAftrek() {
      return metVluchtKeuze && vluchtZelf ? vluchtBedrag : 0;
    }

    /* Optional: days with uncertain ice ("ijsOnzeker" in the price file, e.g.
       Orsa). They stay bookable but get a dashed line, a legend chip and a
       note. tot is the first day that no longer counts. */
    var onzeker = (data.ijsOnzeker && alsDatum(data.ijsOnzeker.van) && alsDatum(data.ijsOnzeker.tot))
      ? { van: alsDatum(data.ijsOnzeker.van), tot: alsDatum(data.ijsOnzeker.tot) } : null;
    function onzekerOp(datum) {
      return Boolean(onzeker) && datum >= onzeker.van && datum < onzeker.tot;
    }

    /* Optional: nights that cost more ("toeslagen" in the price file, e.g.
       Lulea). Each entry has an amount per person per night (euros) and the
       dates of the nights it applies to. A night is the date
       it starts on: a stay from the 1st to the 4th has the nights of the 1st,
       2nd and 3rd. Amounts are kept in cents so any cents add up exactly. Broken
       dates or amounts are skipped, so the rest of the calendar keeps working. */
    var toeslagCenten = {};
    (Array.isArray(data.toeslagen) ? data.toeslagen : []).forEach(function (regel) {
      var centen = regel && typeof regel.bedrag === "number" ? Math.round(regel.bedrag * 100) : 0;
      if (!(centen > 0) || !Array.isArray(regel.nachten)) return;
      regel.nachten.forEach(function (nacht) {
        var datum = alsDatum(nacht);
        if (datum) toeslagCenten[alsTekst(datum)] = centen;
      });
    });
    var heeftToeslagen = Object.keys(toeslagCenten).length > 0;
    function toeslagOp(datum) {
      return toeslagCenten[alsTekst(datum)] || 0;
    }
    // Surcharge per person for a stay, in cents, plus how many nights count.
    function toeslagVoor(aankomst, nachten) {
      var som = { centen: 0, nachten: 0 };
      var loop = new Date(aankomst.getTime());
      for (var i = 0; i < nachten; i++) {
        var c = toeslagOp(loop);
        if (c) { som.centen += c; som.nachten++; }
        loop.setDate(loop.getDate() + 1);
      }
      return som;
    }
    function centenTekst(c) {
      return "€" + getal(c / 100, {
        minimumFractionDigits: c % 100 ? 2 : 0,
        maximumFractionDigits: 2
      });
    }

    /* Optional: guiding on the ice ("begeleiding" in the price file, e.g.
       Orsa). Per day it costs prijsPerDag for 1 person plus
       prijsPerDagExtraPersoon for every extra person, for the whole group.
       The visitor picks 0 up to the number of trip days with a stepper. With
       van/tot in the file it is only possible when the whole trip falls in
       that window (tot = last departure day, as in the Falun calendar). */
    var begeleiding = (data.begeleiding && typeof data.begeleiding.prijsPerDag === "number")
      ? data.begeleiding : null;
    var begeleidingVan = begeleiding ? alsDatum(begeleiding.van) : null;
    var begeleidingTot = begeleiding ? alsDatum(begeleiding.tot) : null;
    var begeleidingDagen = 0;
    function tekstInTaal(waarde) {
      if (waarde && typeof waarde === "object") return waarde[LANG] || waarde.nl || "";
      return waarde ? String(waarde) : "";
    }

    /* In welke periode van de leverancier de aankomstdag valt. De aankomstdag
       bepaalt het tarief voor het hele verblijf, net als in hun eigen
       prijslijst. Valt hij buiten alle periodes, dan komt er geen prijs in
       beeld en blijft het bij een aanvraag. */
    function tariefOp(datum) {
      var lijst = data.periodes || [];
      for (var i = 0; i < lijst.length; i++) {
        var van = alsDatum(lijst[i].van);
        var tot = alsDatum(lijst[i].tot);
        if (van && tot && datum >= van && datum < tot) return lijst[i].tarief;
      }
      return null;
    }

    /* Wat het verblijf per persoon kost. Staat er een prijstabel, dan geldt
       het bedrag dat bij dit tarief en dit aantal nachten hoort; blijft
       iemand langer dan de tabel gaat, dan telt elke nacht daarboven het
       losse nachttarief mee. Is er geen tabel, dan geldt de oude dagprijs. */
    function prijsPerPersoon(aankomst, nachten) {
      var basis = basisPrijsPerPersoon(aankomst, nachten);
      // Surcharges only go on top of a real price; without one there is none.
      if (!basis || !heeftToeslagen) return basis;
      return basis + toeslagVoor(aankomst, nachten).centen / 100;
    }
    /* Whole euros per person for the bar and the request form, so both show
       the same amount. With surcharges the total is always rounded up (the
       price file may hold cents); other calendars keep normal rounding. The
       inner round to cents removes float noise before rounding up. */
    function heleEuros(bedrag) {
      if (!heeftToeslagen) return Math.round(bedrag);
      return Math.ceil(Math.round(bedrag * 100) / 100);
    }
    function basisPrijsPerPersoon(aankomst, nachten) {
      var tabel = data.prijsPerPersoon;
      if (!tabel) return dagprijs ? nachten * dagprijs : 0;

      var tarief = tariefOp(aankomst);
      var rij = tarief ? tabel[tarief] : null;
      if (!rij) return 0;
      if (typeof rij[String(nachten)] === "number") return rij[String(nachten)];

      var langste = 0;
      Object.keys(rij).forEach(function (sleutel) {
        var n = parseInt(sleutel, 10);
        if (n > langste && typeof rij[sleutel] === "number") langste = n;
      });
      if (!langste || nachten < langste) return 0;

      var extra = (data.extraNachtPerPersoon || {})[tarief] || 0;
      if (!extra) return 0;
      return rij[String(langste)] + (nachten - langste) * extra;
    }
    /* Staat het prijzenbestand voor alle talen tegelijk, dan mag het label bij
       een bezette week een blokje per taal zijn in plaats van een losse regel.
       Ontbreekt de taal, dan valt hij terug op het Nederlands en anders op het
       gewone woord "Bezet". */
    function labelVoor(wat) {
      if (wat && typeof wat === "object") return wat[LANG] || wat.nl || T.defaultBooked;
      return wat || T.defaultBooked;
    }

    var bezet = (data.bezet || []).map(function (blok) {
      return { van: alsDatum(blok.van), tot: alsDatum(blok.tot), wat: labelVoor(blok.wat) };
    }).filter(function (blok) {
      // Een bezette periode met een kapotte datum laten we liever weg dan dat
      // hij de hele kalender onbruikbaar maakt.
      return blok.van && blok.tot && blok.tot > blok.van;
    });

    var keuzeVan = null;
    var keuzeTot = null;

    var reizigersUitAdres = (function () {
      var aantal = parseInt(vooraf.personen, 10);
      return isNaN(aantal) ? 0 : aantal;
    })();
    // A head count from the trip finder presets the persons stepper.
    if (afrekenen && reizigersUitAdres > 0) personen = binnenPersonen(reizigersUitAdres);
    // Children and babies from the address (digits only), never more than
    // leaves one adult.
    function aantalUitAdres(waarde) {
      return /^\d{1,3}$/.test(String(waarde === null || waarde === undefined ? "" : waarde)) ? parseInt(waarde, 10) : 0;
    }
    if (afrekenen) {
      kinderen = Math.min(aantalUitAdres(vooraf.kinderen), personen - 1);
      baby = Math.min(aantalUitAdres(vooraf.baby), personen - 1 - kinderen);
    }

    /* What the visitor pays when paying online, in whole euros: the price
       per person (as shown today, plus the group price per night) times the
       group, plus guiding for the whole group. 0 when there is no price. */
    function betaalBedragen(aankomst, nachten) {
      if (!magBetalen(personen)) return { perPersoon: 0, totaal: 0 };
      var basis = heleEuros(prijsPerPersoon(aankomst, nachten));
      if (!basis) return { perPersoon: 0, totaal: 0 };
      var perPersoon = basis + groepsKortingPerNacht(personen - baby) * nachten - vluchtAftrek();
      if (!(perPersoon > 0)) return { perPersoon: 0, totaal: 0 };
      return {
        perPersoon: perPersoon,
        totaal: perPersoon * personen + begeleidingGroep(gekozenBegeleiding(), personen)
      };
    }

    /* Prices for children and babies. The amount of the flight is a server
       secret, so the browser asks /api/reis-prijs for the price per person of
       every category (and the group total when there are children or
       babies). The adult price above stays calculated here as before. The
       answers are kept per choice, so changing nothing asks nothing. */
    var kinderPrijzen = {};
    function kinderSleutel() {
      return [data.reis, alsTekst(keuzeVan), alsTekst(keuzeTot), personen, kinderen, baby, gekozenBegeleiding(),
        vluchtAftrek() ? "zelf" : ""].join("|");
    }
    // The stored answer for the choice on screen: { status, data } or null.
    function kinderAntwoord() {
      if (!afrekenen || !keuzeVan || !keuzeTot) return null;
      return kinderPrijzen[kinderSleutel()] || null;
    }
    function haalKinderPrijzen() {
      if (!afrekenen || !data.reis || !keuzeVan || !keuzeTot || !magBetalen(personen)) return;
      var nachten = dagenTussen(keuzeVan, keuzeTot);
      if (!betaalBedragen(keuzeVan, nachten).totaal) return;
      var sleutel = kinderSleutel();
      if (kinderPrijzen[sleutel]) return;
      kinderPrijzen[sleutel] = { status: "bezig" };

      var vraag = new URLSearchParams({
        reis: data.reis,
        van: alsTekst(keuzeVan),
        tot: alsTekst(keuzeTot),
        personen: String(personen),
        kinderen: String(kinderen),
        baby: String(baby)
      });
      if (gekozenBegeleiding()) vraag.set("begeleiding", String(gekozenBegeleiding()));
      if (vluchtAftrek()) vraag.set("vlucht", "zelf");

      fetch("/api/reis-prijs?" + vraag.toString())
        .then(function (antwoord) {
          return antwoord.json().then(function (uit) { return { ok: antwoord.ok, data: uit || {} }; });
        })
        .then(function (resultaat) {
          var uit = resultaat.data;
          var geldig = resultaat.ok && typeof uit.bedrag === "number" && isFinite(uit.bedrag) && uit.bedrag > 0 &&
            typeof uit.perKind === "number" && isFinite(uit.perKind) && typeof uit.perBaby === "number" && isFinite(uit.perBaby);
          kinderPrijzen[sleutel] = geldig ? { status: "klaar", data: uit } : { status: "fout" };
        })
        ["catch"](function () { kinderPrijzen[sleutel] = { status: "fout" }; })
        .then(function () {
          // Only redraw when the answer is for the choice that is on screen now.
          if (keuzeVan && keuzeTot && sleutel === kinderSleutel()) { tekenPersonen(); tekenBalk(); }
        });
    }

    /* De prijzen gelden per persoon. Kwam het aantal reizigers uit de
       reiszoeker mee, dan staat het totaal voor de hele groep erbij, net als
       in het aanvraagformulier. */
    function prijsTekst(perPersoon) {
      function bedrag(n) { return getal(n); }
      // Guiding is a group amount; it is added to the group total and only
      // the per-person figure shown next to it is rounded.
      var begeleid = gekozenBegeleiding();
      // Without a head count in the web address, guiding is priced for
      // basisPersonen (the number the prices assume), and the line says so.
      var groepsgrootte = reizigersUitAdres > 1 ? reizigersUitAdres : (begeleid ? reizigers() : 1);
      var groep = perPersoon * groepsgrootte + begeleidingGroep(begeleid, groepsgrootte);
      if (groepsgrootte > 1) {
        return T.groupTotalLabel(bedrag(groep), groepsgrootte, bedrag(Math.round(groep / groepsgrootte)));
      }
      return T.totalLabel(bedrag(groep));
    }

    // Trip days: arrival and departure day both count (3 nights is 4 days).
    function reisDagen() {
      return keuzeVan && keuzeTot ? dagenTussen(keuzeVan, keuzeTot) + 1 : 0;
    }

    // Guiding needs a complete period that lies inside its window (if any).
    function begeleidingKan() {
      if (!begeleiding || !keuzeVan || !keuzeTot) return false;
      if (begeleidingVan && keuzeVan < begeleidingVan) return false;
      if (begeleidingTot && keuzeTot > begeleidingTot) return false;
      return true;
    }

    function gekozenBegeleiding() {
      return begeleidingKan() ? Math.min(begeleidingDagen, reisDagen()) : 0;
    }

    // Guiding for the whole group, in whole euros: per day prijsPerDag for
    // 1 person plus prijsPerDagExtraPersoon for every extra person.
    function begeleidingGroep(dagen, aantal) {
      if (!begeleiding || !dagen || aantal < 1) return 0;
      return (begeleiding.prijsPerDag + (begeleiding.prijsPerDagExtraPersoon || 0) * (aantal - 1)) * dagen;
    }

    // Head count for the guiding price: the stepper's, the trip finder's, or
    // else basisPersonen.
    function reizigers() {
      if (afrekenen) return personen;
      return reizigersUitAdres > 0 ? reizigersUitAdres : (data.basisPersonen || 1);
    }

    function bezetOp(datum) {
      for (var i = 0; i < bezet.length; i++) {
        if (datum >= bezet[i].van && datum < bezet[i].tot) return bezet[i];
      }
      return null;
    }

    function bezetTussen(van, tot) {
      var loop = new Date(van.getTime());
      while (loop < tot) {
        if (bezetOp(loop)) return true;
        loop.setDate(loop.getDate() + 1);
      }
      return false;
    }

    var raster = document.createElement("div");
    raster.className = "calendar__months";
    var balk = document.createElement("div");
    balk.className = "calendar__bar";
    balk.setAttribute("aria-live", "polite");

    var legenda = document.createElement("div");
    legenda.className = "calendar__legend";
    legenda.innerHTML =
      '<span class="calendar__legend-item"><span class="calendar__chip is-vrij"></span>' + T.legendAvailable + '</span>' +
      (onzeker ? '<span class="calendar__legend-item"><span class="calendar__chip is-onzeker"></span>' + T.legendUncertain + '</span>' : '') +
      (heeftToeslagen ? '<span class="calendar__legend-item"><span class="calendar__chip is-duurder"></span>' + T.legendPricier + '</span>' : '') +
      '<span class="calendar__legend-item"><span class="calendar__chip is-bezet"></span>' + T.legendBooked + '</span>' +
      '<span class="calendar__legend-item"><span class="calendar__chip is-gekozen"></span>' + T.legendChosen + '</span>';

    box.innerHTML = "";
    box.appendChild(legenda);

    box.appendChild(raster);

    if (onzeker) {
      var onzekerUitleg = document.createElement("p");
      onzekerUitleg.className = "falun-cal__note falun-cal__note--inline";
      onzekerUitleg.textContent = T.uncertainNote;
      box.appendChild(onzekerUitleg);
    }

    if (heeftToeslagen) {
      var toeslagUitleg = document.createElement("p");
      toeslagUitleg.className = "falun-cal__note falun-cal__note--inline";
      toeslagUitleg.textContent = T.pricierNote;
      box.appendChild(toeslagUitleg);
    }

    /* Optional ("duurKnoppen" in the price file, e.g. wellness): once the
       arrival day is picked, one button per trip length (in days) with its
       price per person. A button sets the departure day. A length that would
       run past the season or into a booked period is switched off. Longer
       stays are still picked by clicking the departure day; there is no
       maximum. Built once and updated in place (tekenDuren), so keyboard
       focus stays on the button being used. */
    var duurLijst = (Array.isArray(data.duurKnoppen) ? data.duurKnoppen : []).filter(function (dagen, i, lijst) {
      return typeof dagen === "number" && dagen % 1 === 0 && dagen - 1 >= minNachten && lijst.indexOf(dagen) === i;
    });
    var duurBox = null;
    var duurHint = null;
    if (duurLijst.length) {
      var duurId = "calendarDurations" + (++duurTeller);
      duurBox = document.createElement("div");
      duurBox.className = "falun-cal__block calendar__durations";
      duurBox.hidden = true;
      duurBox.innerHTML =
        '<p class="falun-cal__legend" id="' + duurId + '">' + T.durationsLegend + '</p>' +
        '<div class="calendar__duration-list" role="group" aria-labelledby="' + duurId + '">' +
          duurLijst.map(function (dagen) {
            return '<button type="button" class="calendar__duration" data-dagen="' + dagen + '" aria-pressed="false">' +
              '<span class="calendar__duration-days">' + T.durationDays(dagen) + '</span>' +
              '<span class="calendar__duration-price"></span>' +
            '</button>';
          }).join("") +
        '</div>' +
        '<p class="falun-cal__note falun-cal__note--inline calendar__duration-hint">' + T.durationsLonger + '</p>';
      box.appendChild(duurBox);
      duurHint = duurBox.querySelector(".calendar__duration-hint");

      Array.prototype.forEach.call(duurBox.querySelectorAll(".calendar__duration"), function (knop) {
        knop.addEventListener("click", function () {
          var dagen = parseInt(knop.getAttribute("data-dagen"), 10);
          if (!keuzeVan || !duurKan(dagen)) return;
          keuzeTot = vertrekNa(dagen);
          tekenRaster();
          toonBalk();
        });
      });
    }
    // Departure day for a stay of this many days from the arrival day.
    function vertrekNa(dagen) {
      return new Date(keuzeVan.getFullYear(), keuzeVan.getMonth(), keuzeVan.getDate() + dagen - 1);
    }
    // Same rules as picking the departure day in the grid (kiesDag).
    function duurKan(dagen) {
      var tot = vertrekNa(dagen);
      return dagen - 1 >= minNachten && tot <= seizoenTot && !bezetTussen(keuzeVan, tot);
    }
    // Price per person for that length, as the bar would show it.
    // No price for a group size that cannot pay online (betaalPersonen):
    // the listed prices are for that group only, the bar shows none either.
    function duurPrijs(dagen) {
      if (afrekenen && !magBetalen(personen)) return 0;
      var nachten = dagen - 1;
      var basis = heleEuros(prijsPerPersoon(keuzeVan, nachten));
      if (!basis) return 0;
      var perPersoon = afrekenen ? basis + groepsKortingPerNacht(personen - baby) * nachten - vluchtAftrek() : basis;
      return perPersoon > 0 ? perPersoon : 0;
    }
    function tekenDuren() {
      if (!duurBox) return;
      duurBox.hidden = !keuzeVan;
      if (!keuzeVan) return;
      var gekozen = keuzeTot ? reisDagen() : 0;
      Array.prototype.forEach.call(duurBox.querySelectorAll(".calendar__duration"), function (knop) {
        var dagen = parseInt(knop.getAttribute("data-dagen"), 10);
        var prijs = duurPrijs(dagen);
        var prijsTekst = prijs ? "€" + getal(prijs) : "";
        knop.querySelector(".calendar__duration-price").textContent = prijsTekst ? prijsTekst + " p.p." : "";
        knop.setAttribute("aria-label", T.durationAria(dagen, prijsTekst));
        knop.disabled = !duurKan(dagen);
        knop.setAttribute("aria-pressed", gekozen === dagen ? "true" : "false");
        knop.classList.toggle("is-actief", gekozen === dagen);
      });
      // Clicking a day after a complete period starts a new arrival, so the
      // tip about picking the departure day only shows while choosing it.
      if (duurHint) duurHint.hidden = Boolean(keuzeTot);
    }

    /* Persons (only when paying online): one stepper per category, each
       with minus, a number field and plus, the same control as in the Falun
       calendar and on boeken.html. Adults are 12 and older, children 2 to
       11, babies 0 and 1 (the age on the day of arrival). Every row shows
       its own price per person once a period is chosen. It is built once,
       so keyboard focus stays on the button being used; tekenPersonen()
       only updates the values, the buttons and the prices. */
    var personenRijen = [];
    if (afrekenen) {
      var personenId = "calendarPersons" + (++personenTeller);
      var personenBox = document.createElement("div");
      personenBox.className = "falun-cal__block calendar__persons";
      var soorten = [
        { sleutel: "volw", naam: T.adultsLabel, leeftijd: T.adultsAge, id: personenId },
        { sleutel: "kind", naam: T.childrenLabel, leeftijd: T.childrenAge, id: personenId + "-kind" },
        { sleutel: "baby", naam: T.babiesLabel, leeftijd: T.babiesAge, id: personenId + "-baby" }
      ];
      personenBox.innerHTML =
        '<p class="falun-cal__legend calendar__persons-legend" id="' + personenId + '-legend">' + T.personsLegend + '</p>' +
        '<div class="calendar__persons-rows" role="group" aria-labelledby="' + personenId + '-legend">' +
          soorten.map(function (soort) {
            var meerMinder = { min: T.fewerOf(soort.naam), plus: T.moreOf(soort.naam) };
            return '<div class="calendar__person-row" data-soort="' + soort.sleutel + '">' +
              '<div class="calendar__person-text">' +
                '<label class="calendar__person-name" for="' + soort.id + '">' + soort.naam + '</label>' +
                '<span class="calendar__person-age" id="' + soort.id + '-info">' + soort.leeftijd + '</span>' +
                '<span class="calendar__person-price" aria-live="polite"></span>' +
              '</div>' +
              '<div class="booking__persons">' +
                '<button type="button" class="booking__step-btn" data-personen-stap="-1" aria-label="' + meerMinder.min + '" aria-controls="' + soort.id + '">−</button>' +
                '<input type="number" id="' + soort.id + '" min="' + (soort.sleutel === "volw" ? Math.max(1, personenMin) : 0) + '" max="' + personenMax + '" step="1" inputmode="numeric" value="0" aria-describedby="' + soort.id + '-info" />' +
                '<button type="button" class="booking__step-btn" data-personen-stap="1" aria-label="' + meerMinder.plus + '" aria-controls="' + soort.id + '">+</button>' +
              '</div>' +
            '</div>';
          }).join("") +
        '</div>' +
        '<p class="falun-cal__note falun-cal__note--inline">' + T.childNote + ' ' + T.ageRuleNote + '</p>';
      box.appendChild(personenBox);

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
    }
    function aantalVan(sleutel) {
      return sleutel === "volw" ? volwassenen() : sleutel === "kind" ? kinderen : baby;
    }
    // The other two categories together, and the lowest and highest count
    // this category may have so that the group stays within range.
    function andereAantallen(sleutel) {
      return personen - aantalVan(sleutel);
    }
    function ondergrens(sleutel) {
      return Math.max(sleutel === "volw" ? 1 : 0, personenMin - andereAantallen(sleutel));
    }
    function bovengrens(sleutel) {
      return personenMax - andereAantallen(sleutel);
    }
    // Moves one category to a new count (clamped); true when something changed.
    function zetSoort(sleutel, waarde) {
      var nieuw = Math.min(bovengrens(sleutel), Math.max(ondergrens(sleutel), waarde));
      var v = volwassenen(), k = kinderen, b = baby;
      if (sleutel === "volw") v = nieuw; else if (sleutel === "kind") k = nieuw; else b = nieuw;
      return zetAantallen(v, k, b);
    }
    personenRijen.forEach(function (rij) {
      [rij.minder, rij.meer].forEach(function (knop) {
        knop.addEventListener("click", function () {
          var stap = parseInt(knop.getAttribute("data-personen-stap"), 10);
          /* A trip that can only be paid online for a fixed group size
             (betaalPersonen, wellness: 2 people): at that size a plus swaps
             one person for another category instead of growing the group, so
             "1 adult and 1 child" is one click away. A group of another size
             is still possible (it becomes a request), by going past it. */
          var wissel = null;
          if (stap > 0 && betaalKeuze && betaalMin === betaalMax && personen === betaalMax) {
            if (rij.sleutel !== "volw" && volwassenen() > 1) wissel = [volwassenen() - 1, kinderen + (rij.sleutel === "kind" ? 1 : 0), baby + (rij.sleutel === "baby" ? 1 : 0)];
            if (rij.sleutel === "volw" && kinderen + baby > 0) wissel = [volwassenen() + 1, kinderen > 0 ? kinderen - 1 : kinderen, kinderen > 0 ? baby : baby - 1];
          }
          if (wissel ? !zetAantallen(wissel[0], wissel[1], wissel[2]) : !zetSoort(rij.sleutel, aantalVan(rij.sleutel) + stap)) return;
          toonBalk();
          // At the end of the range this button switches off; keep focus
          // in the stepper on the other button.
          if (knop.disabled) (knop === rij.minder ? rij.meer : rij.minder).focus();
        });
      });
      // Typing works too; an empty or invalid field is ignored until the
      // visitor leaves it, then the last valid number shows again.
      rij.veld.addEventListener("input", function () {
        var uit = parseInt(rij.veld.value, 10);
        if (isNaN(uit)) return;
        if (zetSoort(rij.sleutel, uit)) toonBalk();
      });
      rij.veld.addEventListener("change", function () {
        rij.veld.value = aantalVan(rij.sleutel);
      });
    });
    /* The price per person of a category, as text, once the period is
       chosen: adults from the calendar's own calculation, children and
       babies from the server's answer. Empty while unknown. */
    function categoriePrijsTekst(sleutel) {
      if (!keuzeVan || !keuzeTot || !magBetalen(personen)) return "";
      var basis = betaalBedragen(keuzeVan, dagenTussen(keuzeVan, keuzeTot));
      if (!basis.totaal) return "";
      if (sleutel === "volw") return T.perPersonPrice(getal(basis.perPersoon));
      var antwoord = kinderAntwoord();
      if (!antwoord || antwoord.status !== "klaar") return "";
      return T.perPersonPrice(getal(sleutel === "kind" ? antwoord.data.perKind : antwoord.data.perBaby));
    }
    function tekenPersonen() {
      personenRijen.forEach(function (rij) {
        var n = aantalVan(rij.sleutel);
        if (parseInt(rij.veld.value, 10) !== n) rij.veld.value = n;
        rij.minder.disabled = n <= ondergrens(rij.sleutel);
        rij.meer.disabled = n >= bovengrens(rij.sleutel);
        rij.prijs.textContent = categoriePrijsTekst(rij.sleutel);
      });
    }

    /* Own flight (only when paying online and the price file has
       opties.vluchtZelf): one checkbox row with the same markup and classes
       as the options in the Falun calendar (js/falun-kalender.js), so the
       booking styles apply. Built once; tekenVlucht() only updates it, so
       keyboard focus stays on the checkbox. */
    var vluchtBox = null;
    var vluchtVeld = null;
    if (metVluchtKeuze) {
      var vluchtId = "calendarFlight" + (++vluchtTeller);
      vluchtBox = document.createElement("div");
      vluchtBox.className = "falun-cal__block calendar__flight";
      vluchtBox.innerHTML =
        '<p class="falun-cal__legend" id="' + vluchtId + '">' + T.optionsLegend + '</p>' +
        '<div class="booking__extras" role="group" aria-labelledby="' + vluchtId + '">' +
          '<label class="extra">' +
            '<input type="checkbox" class="extra__check" data-optie="vlucht"' + (vluchtZelf ? ' checked' : '') + ' />' +
            '<span class="extra__name">' + T.flightSelf +
              '<span class="extra__hint">' + T.flightSelfHint + '</span>' +
            '</span>' +
            '<span class="extra__price">- ' + euroTekst(vluchtBedrag) + '</span>' +
          '</label>' +
        '</div>';
      box.appendChild(vluchtBox);
      vluchtVeld = vluchtBox.querySelector("input");
      vluchtVeld.addEventListener("change", function () {
        vluchtZelf = vluchtVeld.checked;
        toonBalk();
      });
    }
    // A group size that cannot pay online (betaalPersonen) has no price for
    // the tick to change, so the row is hidden then.
    function tekenVlucht() {
      if (!vluchtBox) return;
      vluchtBox.hidden = !magBetalen(personen);
      if (vluchtVeld.checked !== vluchtZelf) vluchtVeld.checked = vluchtZelf;
    }

    // Guiding stepper (only when the price file offers guiding).
    var begeleidingBox = null;
    var begeleidingStaat = "";
    var begeleidingId = "calendarGuiding" + (++begeleidingTeller);
    if (begeleiding) {
      begeleidingBox = document.createElement("div");
      begeleidingBox.className = "falun-cal__block calendar__guiding";
      box.appendChild(begeleidingBox);
    }

    box.appendChild(balk);

    function euroTekst(n) { return "€" + getal(n); }

    /* The guiding block. It is only rebuilt when its state changes (no
       period yet, period outside the window, stepper); otherwise the
       stepper values are updated in place, so keyboard focus stays put. */
    function tekenBegeleiding() {
      if (!begeleidingBox) return;
      var staat = begeleidingKan() ? "stepper" : (keuzeVan && keuzeTot ? "buiten" : "leeg");

      if (staat !== begeleidingStaat) {
        begeleidingStaat = staat;
        var venster = begeleidingVan && begeleidingTot;
        var notitie = "";
        if (venster && staat === "buiten") notitie = T.guidingOutside(schrijfDatum(begeleidingVan), schrijfDatum(begeleidingTot));
        if (venster && staat === "leeg") notitie = T.guidingWindow(schrijfDatum(begeleidingVan), schrijfDatum(begeleidingTot));
        begeleidingBox.innerHTML =
          '<p class="falun-cal__legend" id="' + begeleidingId + '">' + T.guidingLegend + '</p>' +
          (staat === "stepper"
            ? '<div class="falun-cal__stepper" role="group" aria-labelledby="' + begeleidingId + '">' +
                '<button type="button" class="booking__step-btn" data-begeleiding-stap="-1" aria-label="' + T.guidingFewer + '">−</button>' +
                '<span class="falun-cal__stepper-out" aria-live="polite" aria-atomic="true">' +
                  '<span class="falun-cal__stepper-value"></span>' +
                  '<span class="falun-cal__stepper-price"></span>' +
                '</span>' +
                '<button type="button" class="booking__step-btn" data-begeleiding-stap="1" aria-label="' + T.guidingMore + '">+</button>' +
              '</div>'
            : '') +
          (notitie ? '<p class="falun-cal__note falun-cal__note--inline">' + notitie + '</p>' : '') +
          '<p class="falun-cal__note falun-cal__note--inline">' +
            T.guidingPrice(euroTekst(begeleiding.prijsPerDag), euroTekst(begeleiding.prijsPerDagExtraPersoon || 0)) + '</p>';

        if (staat === "stepper") {
          var minder = begeleidingBox.querySelector('[data-begeleiding-stap="-1"]');
          var meer = begeleidingBox.querySelector('[data-begeleiding-stap="1"]');
          [minder, meer].forEach(function (knop) {
            knop.addEventListener("click", function () {
              var stap = parseInt(knop.getAttribute("data-begeleiding-stap"), 10);
              var n = Math.min(reisDagen(), Math.max(0, gekozenBegeleiding() + stap));
              if (n === gekozenBegeleiding()) return;
              begeleidingDagen = n;
              toonBalk();
              // At the end of the range this button switches off; keep
              // keyboard focus in the stepper on the other button.
              if (knop.disabled) (knop === minder ? meer : minder).focus();
            });
          });
        }
      }

      if (staat === "stepper") {
        var dagen = gekozenBegeleiding();
        begeleidingBox.querySelector(".falun-cal__stepper-value").textContent =
          dagen === 0 ? T.guidingNone : T.guidingDays(dagen);
        begeleidingBox.querySelector(".falun-cal__stepper-price").textContent =
          dagen === 0 ? "" : "+ " + euroTekst(begeleidingGroep(dagen, reizigers()));
        begeleidingBox.querySelector('[data-begeleiding-stap="-1"]').disabled = dagen <= 0;
        begeleidingBox.querySelector('[data-begeleiding-stap="1"]').disabled = dagen >= reisDagen();
      }
    }

    /* On the booking page: tell the page what is chosen now, so it can keep
       its web address in step (a refresh or the back button then shows the
       same choice). Only a complete period counts. */
    function meld() {
      if (!opBoekpagina || typeof opties.onWijzig !== "function") return;
      var klaar = Boolean(keuzeVan && keuzeTot);
      opties.onWijzig({
        van: klaar ? alsTekst(keuzeVan) : null,
        tot: klaar ? alsTekst(keuzeTot) : null,
        personen: afrekenen ? personen : null,
        kinderen: afrekenen ? kinderen : 0,
        baby: afrekenen ? baby : 0,
        begeleidingDagen: klaar ? gekozenBegeleiding() : 0,
        vlucht: vluchtAftrek() ? "zelf" : ""
      });
    }

    function toonBalk() {
      // A new complete period: guiding days fit the trip, or drop to 0
      // when guiding is not possible in that period.
      if (begeleiding && keuzeVan && keuzeTot) {
        begeleidingDagen = gekozenBegeleiding();
      }
      haalKinderPrijzen();
      tekenPersonen();
      tekenDuren();
      tekenVlucht();
      tekenBegeleiding();
      tekenBalk();
      koppelReset();
      meld();
    }

    /* The link under the calendar on the trip page. Paying online: straight
       to uitchecken.html (in the root, also from the language folders),
       which recalculates the amount on the server. Otherwise, or when this
       period has no price, the request form as before. */
    function knopHtml(nachten) {
      var params = new URLSearchParams();
      if (data.reis) params.set("reis", data.reis);
      params.set("van", alsTekst(keuzeVan));
      params.set("tot", alsTekst(keuzeTot));
      if (afrekenen && betaalBedragen(keuzeVan, nachten).totaal > 0) {
        params.set("personen", String(personen));
        if (kinderen) params.set("kinderen", String(kinderen));
        if (baby) params.set("baby", String(baby));
        if (gekozenBegeleiding()) params.set("begeleiding", String(gekozenBegeleiding()));
        if (vluchtAftrek()) params.set("vlucht", "zelf");
        return '<a class="btn btn--dark calendar__pay" href="' + mapVoorKalender() + 'uitchecken.html?' +
          params.toString().replace(/&/g, "&amp;") + '">' + T.bookPayBtn + '</a>';
      }
      // The booking page takes no requests; there the calendar is the form.
      if (opBoekpagina) return "";
      // A head count from the trip finder (or the stepper) stays with the
      // request when someone picks another period here.
      var aantal = afrekenen ? personen : reizigersUitAdres;
      if (aantal) params.set("personen", String(aantal));
      if (afrekenen && kinderen) params.set("kinderen", String(kinderen));
      if (afrekenen && baby) params.set("baby", String(baby));
      if (gekozenBegeleiding()) params.set("begeleiding", String(gekozenBegeleiding()));
      return '<a class="btn btn--dark" href="boeken.html?' +
        params.toString().replace(/&/g, "&amp;") + '">' + T.continueBtn + '</a>';
    }

    function tekenBalk() {
      if (!keuzeVan) {
        balk.className = "calendar__bar";
        balk.innerHTML = '<p class="calendar__hint">' + T.hintStart + '</p>';
        return;
      }
      if (!keuzeTot) {
        balk.className = "calendar__bar is-busy";
        balk.innerHTML = '<p class="calendar__hint">' + T.hintEnd(schrijfDatum(keuzeVan), minNachten + 1) + '</p>' +
          '<button type="button" class="calendar__reset">' + T.reset + '</button>';
        return;
      }
      var nachten = dagenTussen(keuzeVan, keuzeTot);
      var totaal = heleEuros(prijsPerPersoon(keuzeVan, nachten));
      var prijsRegel = "";
      var categorieRegels = ""; // one line per category when there are children or babies
      var vluchtRegel = ""; // own flight ticked: the amount per person that came off
      // A group size that cannot pay online (betaalPersonen): say why the
      // request button shows instead of the total.
      var betaalNotitie = afrekenen && !magBetalen(personen)
        ? '<span class="calendar__chosen-nights calendar__chosen-note">' + T.payPersonsNote(betaalMin, betaalMax) + '</span>'
        : "";
      if (afrekenen) {
        // Paying online: per person and total for the chosen group, the
        // same amounts the payment page charges.
        var bedragen = betaalBedragen(keuzeVan, nachten);
        if (bedragen.totaal && vluchtAftrek()) {
          vluchtRegel = '<span class="calendar__chosen-nights">' + T.lineFlight + ': - ' + T.perPersonPrice(getal(vluchtAftrek())) + '</span>';
          // Same note as the Falun calendar: with an own flight there is no
          // lower price for children and babies.
          if (kinderen + baby > 0) {
            vluchtRegel += '<span class="calendar__chosen-nights calendar__chosen-note">' + T.childFlightSelfNote + '</span>';
          }
        }
        if (bedragen.totaal && kinderen + baby > 0) {
          // With children or babies the total comes from the server, which
          // knows their price. Until it answers (or when it cannot) there is
          // no total to show, only a short text; the payment page still
          // shows the exact amount.
          var antwoord = kinderAntwoord();
          if (antwoord && antwoord.status === "klaar") {
            var uitKind = antwoord.data;
            prijsRegel = T.groupTotalMixed(getal(uitKind.bedrag), personen);
            categorieRegels = [[T.adultsLabel, volwassenen(), uitKind.perPersoon]];
            if (kinderen) categorieRegels.push([T.childrenLabel, kinderen, uitKind.perKind]);
            if (baby) categorieRegels.push([T.babiesLabel, baby, uitKind.perBaby]);
            categorieRegels = categorieRegels.map(function (regel) {
              return '<span class="calendar__chosen-nights">' + T.categoryLine(regel[0], regel[1], T.perPersonPrice(getal(regel[2]))) + '</span>';
            }).join("");
          } else {
            prijsRegel = antwoord && antwoord.status === "fout" ? "" : T.priceLoading;
            if (antwoord && antwoord.status === "fout") {
              categorieRegels = '<span class="calendar__chosen-nights calendar__chosen-note">' + T.priceUnavailable + '</span>';
            }
          }
        } else if (bedragen.totaal) {
          prijsRegel = personen > 1
            ? T.groupTotalLabel(getal(bedragen.totaal), personen,
                getal(Math.round(bedragen.totaal / personen)))
            : T.totalLabel(getal(bedragen.totaal));
        }
      } else if (totaal) {
        prijsRegel = prijsTekst(totaal);
      }
      var toeslag = totaal && heeftToeslagen ? toeslagVoor(keuzeVan, nachten) : null;
      var toeslagRegel = toeslag && toeslag.centen
        ? '<span class="calendar__chosen-nights">' + T.pricierLine(centenTekst(toeslag.centen), toeslag.nachten) + '</span>'
        : "";
      balk.className = "calendar__bar is-done";
      balk.innerHTML =
        '<div class="calendar__chosen">' +
          '<span class="calendar__chosen-label">' + T.chosenLabel + '</span>' +
          '<span class="calendar__chosen-dates">' + schrijfDatum(keuzeVan) + ' – ' + schrijfDatum(keuzeTot) + '</span>' +
          '<span class="calendar__chosen-nights">' + T.daysLabel(nachten + 1) + '</span>' +
          (prijsRegel ? '<span class="calendar__chosen-price">' + prijsRegel + '</span>' : '') +
          categorieRegels +
          vluchtRegel +
          toeslagRegel +
          betaalNotitie +
        '</div>' +
        '<div class="calendar__bar-actions">' +
          '<button type="button" class="calendar__reset">' + T.reset + '</button>' +
          knopHtml(nachten) +
        '</div>';
    }

    /* De kalender toont een maand tegelijk; met de pijltjes klik je door het
       seizoen. Verder dan de eerste en laatste seizoensmaand gaat het niet. */
    var eersteMaand = new Date(seizoenVan.getFullYear(), seizoenVan.getMonth(), 1);
    var laatsteMaand = new Date(seizoenTot.getFullYear(), seizoenTot.getMonth(), 1);
    var zichtbareMaand = eersteMaand;

    function maakPijl(stap, label) {
      var knop = document.createElement("button");
      knop.type = "button";
      knop.className = "calendar__month-nav";
      knop.innerHTML = '<span aria-hidden="true">' + (stap < 0 ? "&#8249;" : "&#8250;") + '</span>' +
        '<span class="sr-only">' + label + '</span>';
      knop.disabled = stap < 0 ? zichtbareMaand <= eersteMaand : zichtbareMaand >= laatsteMaand;
      knop.addEventListener("click", function () {
        zichtbareMaand = new Date(zichtbareMaand.getFullYear(), zichtbareMaand.getMonth() + stap, 1);
        tekenRaster(stap);
      });
      return knop;
    }

    function tekenRaster(focusOp) {
      raster.innerHTML = "";
      var jaar = zichtbareMaand.getFullYear();
      var nr = zichtbareMaand.getMonth();

      var kop = document.createElement("div");
      kop.className = "calendar__month-head";
      var terug = maakPijl(-1, T.prevMonth);
      var titel = document.createElement("h3");
      titel.className = "calendar__month-title";
      titel.setAttribute("aria-live", "polite");
      titel.textContent = MAANDEN[nr] + " " + jaar;
      var vooruit = maakPijl(1, T.nextMonth);
      kop.appendChild(terug);
      kop.appendChild(titel);
      kop.appendChild(vooruit);
      raster.appendChild(kop);

      var maandBox = document.createElement("div");
      maandBox.className = "calendar__month";

      var dagen = document.createElement("div");
      dagen.className = "calendar__grid";
      DAGKOPPEN.forEach(function (naam) {
        var kop = document.createElement("span");
        kop.className = "calendar__dayname";
        kop.setAttribute("aria-hidden", "true");
        kop.textContent = naam;
        dagen.appendChild(kop);
      });

      var start = (new Date(jaar, nr, 1).getDay() + 6) % 7;
      for (var leeg = 0; leeg < start; leeg++) {
        var gat = document.createElement("span");
        gat.className = "calendar__cell is-empty";
        dagen.appendChild(gat);
      }

      var aantal = new Date(jaar, nr + 1, 0).getDate();
      for (var d = 1; d <= aantal; d++) {
        dagen.appendChild(maakDag(new Date(jaar, nr, d)));
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

    function maakDag(datum) {
      var buitenSeizoen = datum < seizoenVan || datum > seizoenTot;
      var blok = bezetOp(datum);

      if (buitenSeizoen || blok) {
        var uit = document.createElement("span");
        uit.className = "calendar__cell " + (blok ? "is-bezet" : "is-buiten");
        uit.textContent = datum.getDate();
        if (blok) {
          uit.title = T.bookedTitle(blok.wat, schrijfDatum(blok.van), schrijfDatum(blok.tot));
          var uitleg = document.createElement("span");
          uitleg.className = "sr-only";
          // A label that already says "not available" is not followed by the
          // same words again ("Niet beschikbaar, niet beschikbaar").
          var srZin = T.bookedSr("").replace(/^[\s,]+/, "").toLowerCase();
          uitleg.textContent = srZin && blok.wat.toLowerCase().indexOf(srZin) !== -1
            ? " " + blok.wat
            : T.bookedSr(blok.wat);
          uit.appendChild(uitleg);
        }
        return uit;
      }

      var knop = document.createElement("button");
      knop.type = "button";
      knop.className = "calendar__cell is-vrij";
      knop.innerHTML = '<span class="calendar__daynr">' + datum.getDate() + "</span>";
      knop.setAttribute("aria-label", T.availableAria(schrijfDatum(datum)));
      if (onzekerOp(datum)) {
        knop.classList.add("is-onzeker");
        knop.setAttribute("aria-label", T.availableAria(schrijfDatum(datum)) + ", " + T.legendUncertain);
      }
      var toeslagDag = toeslagOp(datum);
      if (toeslagDag) {
        knop.classList.add("is-duurder");
        var toeslagAria = T.pricierAria(centenTekst(toeslagDag));
        knop.setAttribute("aria-label", knop.getAttribute("aria-label") + ", " + toeslagAria);
        knop.title = toeslagAria.charAt(0).toUpperCase() + toeslagAria.slice(1);
      }
      knop.setAttribute("data-datum", alsTekst(datum));

      if (keuzeVan && datum.getTime() === keuzeVan.getTime()) {
        knop.classList.add("is-gekozen", "is-start");
        knop.setAttribute("aria-pressed", "true");
      }
      if (keuzeTot && datum.getTime() === keuzeTot.getTime()) {
        knop.classList.add("is-gekozen", "is-eind");
        knop.setAttribute("aria-pressed", "true");
      }
      if (keuzeVan && keuzeTot && datum > keuzeVan && datum < keuzeTot) {
        knop.classList.add("is-tussen");
      }

      knop.addEventListener("click", function () { kiesDag(datum); });
      return knop;
    }

    function kiesDag(datum) {
      if (!keuzeVan || keuzeTot) {
        keuzeVan = datum;
        keuzeTot = null;
      } else if (datum <= keuzeVan) {
        keuzeVan = datum;
      } else if (dagenTussen(keuzeVan, datum) < minNachten) {
        balk.className = "calendar__bar is-warn";
        balk.innerHTML = '<p class="calendar__hint">' + T.warnMinDays(minNachten + 1) + '</p>' +
          '<button type="button" class="calendar__reset">' + T.reset + '</button>';
        koppelReset();
        return;
      } else if (bezetTussen(keuzeVan, datum)) {
        balk.className = "calendar__bar is-warn";
        balk.innerHTML = '<p class="calendar__hint">' + T.warnOverlap + '</p>' +
          '<button type="button" class="calendar__reset">' + T.reset + '</button>';
        koppelReset();
        return;
      } else {
        keuzeTot = datum;
      }
      tekenRaster();
      toonBalk();
      // The grid was redrawn; keep keyboard focus on the day just picked.
      var zelfde = raster.querySelector('[data-datum="' + alsTekst(datum) + '"]');
      if (zelfde) zelfde.focus();
    }

    function koppelReset() {
      var knop = balk.querySelector(".calendar__reset");
      if (!knop) return;
      knop.addEventListener("click", function () {
        keuzeVan = null;
        keuzeTot = null;
        tekenRaster();
        toonBalk();
        // The reset button is gone now; move focus back into the calendar.
        var eerste = raster.querySelector("button.calendar__cell");
        if (eerste) eerste.focus();
      });
    }

    /* Komt de bezoeker via de reiszoeker binnen, dan staat zijn periode in het
       webadres. Die nemen we hier over, zodat de kalender meteen goed staat.
       Past de periode niet (te kort of over een bezette week heen), dan blijft
       de kalender gewoon leeg en kiest hij zelf. Op de boekingspagina geeft
       die pagina de periode zelf mee. */
    (function () {
      var uitVan = alsDatum(vooraf.van);
      var uitTot = alsDatum(vooraf.tot);
      if (!uitVan || !uitTot || uitTot <= uitVan) return;
      if (uitVan < seizoenVan || uitTot > seizoenTot) return;
      if (dagenTussen(uitVan, uitTot) < minNachten) return;
      if (bezetOp(uitVan) || bezetTussen(uitVan, uitTot)) return;
      keuzeVan = uitVan;
      keuzeTot = uitTot;
    })();

    // Guiding days can come along the same way (begeleiding=2). toonBalk()
    // fits them to the chosen period.
    if (begeleiding) {
      var begeleidingUitAdres = parseInt(vooraf.begeleiding, 10);
      if (!isNaN(begeleidingUitAdres) && begeleidingUitAdres > 0) begeleidingDagen = begeleidingUitAdres;
    }

    // Staat er al een periode, dan opent de kalender in de maand van de
    // aankomstdag; anders in de eerste maand met een vrije dag.
    zichtbareMaand = (function () {
      if (keuzeVan) return new Date(keuzeVan.getFullYear(), keuzeVan.getMonth(), 1);
      var loop = new Date(seizoenVan.getTime());
      while (loop <= seizoenTot) {
        if (!bezetOp(loop)) return new Date(loop.getFullYear(), loop.getMonth(), 1);
        loop.setDate(loop.getDate() + 1);
      }
      return eersteMaand;
    })();

    tekenRaster();
    toonBalk();
  }

  /* ------------------------------------------------------------------
     Collage bij het persoonlijke verhaal: elke foto schuift tijdens het
     scrollen een klein stukje mee in een eigen tempo. Er wordt alleen een
     transform gezet, en alleen zolang de collage in beeld is.
     data-speed in the HTML only sets the relative pace of each photo; the
     fastest photo moves at most COLLAGE_TRAVEL px over the whole pass (on a
     wide screen), so the motion can never pull the composition apart or
     push a photo into the caption, whatever data-speed says.
     ------------------------------------------------------------------ */
  var collage = document.querySelector("[data-collage]");
  var COLLAGE_TRAVEL = 40;

  if (collage && !reducedMotion.matches) {
    var collageItems = collage.querySelectorAll(".collage__item");
    var collageMaxSpeed = 0;
    collageItems.forEach(function (item) {
      collageMaxSpeed = Math.max(collageMaxSpeed, Math.abs(parseFloat(item.dataset.speed) || 0));
    });

    var syncCollage = function () {
      var rect = collage.getBoundingClientRect();
      var vh = stableViewportHeight();

      // Niets uitrekenen zolang de collage ver buiten beeld is.
      if (rect.bottom < -vh || rect.top > vh * 2) return;

      // -1 net onder het scherm, +1 net erboven; 0 als de collage in het midden staat
      var progress = ((vh - rect.top) / (vh + rect.height)) * 2 - 1;
      progress = Math.min(1, Math.max(-1, progress));

      // Op een smal scherm is dezelfde verschuiving verhoudingsgewijs veel
      // groter, dus daar wordt de afstand teruggeschroefd.
      var scale = Math.max(0.45, Math.min(1, window.innerWidth / 1100));

      // The two small photos move a little faster than the large one (see
      // data-speed in the HTML), so they creep over it while scrolling.
      collageItems.forEach(function (item) {
        var speed = parseFloat(item.dataset.speed) || 0;
        var travel = collageMaxSpeed ? (speed / collageMaxSpeed) * COLLAGE_TRAVEL : 0;
        item.style.setProperty(
          "--collage-shift",
          (progress * travel * scale).toFixed(1) + "px"
        );
      });
    };

    var collageTicking = false;
    window.addEventListener("scroll", function () {
      if (collageTicking) return;
      collageTicking = true;
      window.requestAnimationFrame(function () {
        syncCollage();
        collageTicking = false;
      });
    }, { passive: true });
    window.addEventListener("resize", syncCollage);

    syncCollage();
  }

  /* ------------------------------------------------------------------
     Muisvolger: een ring die de muis volgt en een stipje dat er iets
     achteraan loopt. Sta je stil, dan haalt het stipje de ring weer in.
     Alleen op apparaten met een echte muisaanwijzer.
     ------------------------------------------------------------------ */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (finePointer.matches && !reducedMotion.matches) {
    var ring = document.createElement("div");
    ring.className = "cursor-ring";
    var dot = document.createElement("div");
    dot.className = "cursor-dot";
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    var ringX = mouseX, ringY = mouseY;
    var dotX = mouseX, dotY = mouseY;
    var visible = false;

    document.addEventListener("mousemove", function (event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (!visible) {
        visible = true;
        ringX = dotX = mouseX;
        ringY = dotY = mouseY;
        ring.classList.add("is-visible");
        dot.classList.add("is-visible");
      }
    }, { passive: true });

    document.addEventListener("mouseleave", function () {
      visible = false;
      ring.classList.remove("is-visible");
      dot.classList.remove("is-visible");
    });

    // Ring volgt snel, het stipje duidelijk trager — daardoor loopt het er
    // zichtbaar achteraan tijdens beweging en komt het bij stilstand weer samen.
    // The loop only runs while the ring or the dot still has to catch up
    // with the mouse; once both have arrived it stops until the next
    // mousemove, instead of drawing every frame while nothing moves.
    var following = false;
    var follow = function () {
      ringX += (mouseX - ringX) * 0.32;
      ringY += (mouseY - ringY) * 0.32;
      dotX += (mouseX - dotX) * 0.055;
      dotY += (mouseY - dotY) * 0.055;
      ring.style.transform = "translate3d(" + ringX + "px," + ringY + "px,0)";
      dot.style.transform = "translate3d(" + dotX + "px," + dotY + "px,0)";
      if (Math.abs(mouseX - dotX) + Math.abs(mouseY - dotY) > 0.1) {
        window.requestAnimationFrame(follow);
      } else {
        following = false;
      }
    };
    document.addEventListener("mousemove", function () {
      if (following) return;
      following = true;
      window.requestAnimationFrame(follow);
    }, { passive: true });

    // Ring wordt groter boven klikbare dingen. One listener on the document,
    // so controls that are built later (calendar days, steppers) count too.
    var CLICKABLE = "a, button, summary, [role='button'], input, select, textarea";
    document.addEventListener("mouseover", function (event) {
      var target = event.target;
      ring.classList.toggle("is-active", Boolean(target && target.closest && target.closest(CLICKABLE)));
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Trip carousel: horizontal scroll progress bar
     ------------------------------------------------------------------ */
  var scroller = document.getElementById("tripScroll");
  var bar = document.getElementById("tripProgress");

  if (scroller && bar) {
    var updateProgress = function () {
      var max = scroller.scrollWidth - scroller.clientWidth;
      var pct = max > 0 ? (scroller.scrollLeft / max) * 100 : 0;
      bar.style.width = Math.max(18, pct) + "%";
    };
    scroller.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  /* ------------------------------------------------------------------
     Trip carousel: markeer de kaart die net gesnapt is als "is-current"
     zodat die subtiel groter/helderder toont dan de rest (zie styles.css).
     ------------------------------------------------------------------ */
  if (scroller && "IntersectionObserver" in window) {
    var tripCards = scroller.querySelectorAll(".trip-card");
    if (tripCards.length) {
      scroller.classList.add("is-tracking");
      var currentCard = null;
      var visibleRatios = new Map();

      var markCurrent = function (card) {
        if (card === currentCard) return;
        if (currentCard) currentCard.classList.remove("is-current");
        card.classList.add("is-current");
        currentCard = card;
      };

      var cardObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            visibleRatios.set(entry.target, entry.intersectionRatio);
          });
          var bestCard = null;
          var bestRatio = 0;
          visibleRatios.forEach(function (ratio, card) {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestCard = card;
            }
          });
          if (bestCard) markCurrent(bestCard);
        },
        { root: scroller, threshold: [0, 0.25, 0.5, 0.6, 0.75, 0.9, 1] }
      );

      tripCards.forEach(function (card) { cardObserver.observe(card); });
    }
  }

  /* ------------------------------------------------------------------
     Dagprogramma: balkje dat meeloopt met het zijwaarts scrollen
     ------------------------------------------------------------------ */
  document.querySelectorAll("[data-dayscroll]").forEach(function (baan) {
    var balk = baan.parentNode.querySelector(".days__progress-bar");
    if (!balk) return;
    var bijwerken = function () {
      var max = baan.scrollWidth - baan.clientWidth;
      var deel = max > 0 ? (baan.scrollLeft / max) * 100 : 0;
      balk.style.width = Math.max(20, deel) + "%";
    };
    baan.addEventListener("scroll", bijwerken, { passive: true });
    window.addEventListener("resize", bijwerken);
    bijwerken();
  });

  /* ------------------------------------------------------------------
     Trip cards: photo gallery — tap or click cycles to the next photo
     ------------------------------------------------------------------ */
  document.querySelectorAll("[data-gallery]").forEach(function (media) {
    var images = media.querySelectorAll("img");
    var dots = media.querySelectorAll(".trip-card__dots span");
    if (images.length < 2) return;

    var index = 0;

    function showNext() {
      images[index].classList.remove("is-active");
      if (dots[index]) dots[index].classList.remove("is-active");
      index = (index + 1) % images.length;
      images[index].classList.add("is-active");
      if (dots[index]) dots[index].classList.add("is-active");
    }

    media.addEventListener("click", showNext);
    media.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showNext();
      }
    });
  });

  /* ------------------------------------------------------------------
     Smooth in-page scrolling, only after the visitor has interacted.
     With `scroll-behavior: smooth` on <html> from the start, the browser
     also animates its own scroll restoration (reload, back button) and the
     jump to a #fragment while the page loads: the page appears at one spot
     and then glides to another. So the smooth behaviour is switched on at
     the first pointer or key press, which still comes before the click on
     an in-page link. See html.smooth-scroll in css/styles.css.

     (The former "reading rest" that auto-scrolled the page to the nearest
     heading 180 ms after scrolling stopped has been removed: it moved the
     page on its own after every scroll and made it jerk.)
     ------------------------------------------------------------------ */
  if (!reducedMotion.matches) {
    var enableSmoothScroll = function () {
      document.documentElement.classList.add("smooth-scroll");
      window.removeEventListener("pointerdown", enableSmoothScroll, true);
      window.removeEventListener("keydown", enableSmoothScroll, true);
    };
    window.addEventListener("pointerdown", enableSmoothScroll, true);
    window.addEventListener("keydown", enableSmoothScroll, true);
  }

})();
