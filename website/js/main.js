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
      hintEnd: function (aankomst, min) { return "Aankomst op " + aankomst + ". Kies nu je vertrekdag - minimaal " + min + " nachten."; },
      reset: "Opnieuw kiezen",
      chosenLabel: "Jouw periode",
      nightsLabel: function (n) { return n + (n === 1 ? " nacht" : " nachten"); },
      continueBtn: "Verder met de aanvraag",
      defaultBooked: "Bezet",
      availableAria: function (datum) { return datum + ", beschikbaar"; },
      totalLabel: function (totaal) { return "Totaal €" + totaal + " per persoon"; },
      groupTotalLabel: function (totaal, n, pp) { return "Totaal €" + totaal + " voor " + n + " personen (€" + pp + " p.p.)"; },
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " tot " + tot; },
      bookedSr: function (wat) { return " " + wat + ", niet beschikbaar"; },
      warnMinNights: function (min) { return "Een verblijf duurt minimaal " + min + " nachten. Kies een latere vertrekdag."; },
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
      guidingLine: "Begeleiding op het ijs",
      legendPricier: "Duurdere nacht",
      pricierNote: "Een stipje betekent dat de nacht die op die dag begint duurder is. Daarvoor komt er per persoon een toeslag bij, die al in het totaal zit.",
      pricierAria: function (bedrag) { return "duurdere nacht, toeslag " + bedrag + " p.p."; },
      pricierLine: function (bedrag, n) { return "Inclusief " + bedrag + " p.p. toeslag voor " + n + (n === 1 ? " duurdere nacht" : " duurdere nachten"); },
      bookPayBtn: "Boeken en betalen",
      personsLegend: "Met hoeveel personen?",
      personsFewer: "Eén persoon minder",
      personsMore: "Eén persoon meer"
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
      hintEnd: function (arrival, min) { return "Arrival on " + arrival + ". Now choose your departure day - minimum " + min + " nights."; },
      reset: "Start over",
      chosenLabel: "Your period",
      nightsLabel: function (n) { return n + (n === 1 ? " night" : " nights"); },
      continueBtn: "Continue to request",
      defaultBooked: "Booked",
      availableAria: function (date) { return date + ", available"; },
      totalLabel: function (totaal) { return "Total €" + totaal + " per person"; },
      groupTotalLabel: function (total, n, pp) { return "Total €" + total + " for " + n + " people (€" + pp + " per person)"; },
      bookedTitle: function (what, from, to) { return what + ": " + from + " to " + to; },
      bookedSr: function (what) { return " " + what + ", not available"; },
      warnMinNights: function (min) { return "A stay is at least " + min + " nights. Choose a later departure day."; },
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
      guidingLine: "Guiding on the ice",
      legendPricier: "Higher-priced night",
      pricierNote: "A dot means the night that starts on that day costs more. A surcharge per person is added for it, already included in the total.",
      pricierAria: function (amount) { return "higher-priced night, surcharge " + amount + " per person"; },
      pricierLine: function (amount, n) { return "Includes " + amount + " per person surcharge for " + n + (n === 1 ? " higher-priced night" : " higher-priced nights"); },
      bookPayBtn: "Book and pay",
      personsLegend: "How many people?",
      personsFewer: "One person fewer",
      personsMore: "One person more"
    },
    sv: {
      months: ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
      dayHeaders: ["mån", "tis", "ons", "tor", "fre", "lör", "sön"],
      prevMonth: "Föregående månad",
      nextMonth: "Nästa månad",
      pauseAria: "Pausa bildspelet",
      playAria: "Spela bildspelet",
      legendAvailable: "Tillgänglig",
      legendBooked: "Redan bokad",
      legendChosen: "Ditt val",
      hintStart: "Klicka på din ankomstdag och sedan på din avresedag.",
      hintEnd: function (ankomst, min) { return "Ankomst " + ankomst + ". Välj nu din avresedag - minst " + min + " nätter."; },
      reset: "Välj igen",
      chosenLabel: "Din period",
      nightsLabel: function (n) { return n + (n === 1 ? " natt" : " nätter"); },
      continueBtn: "Gå vidare till förfrågan",
      defaultBooked: "Bokad",
      availableAria: function (datum) { return datum + ", tillgänglig"; },
      totalLabel: function (total) { return "Totalt €" + total + " per person"; },
      groupTotalLabel: function (total, n, pp) { return "Totalt €" + total + " för " + n + " personer (€" + pp + " per person)"; },
      bookedTitle: function (vad, fran, till) { return vad + ": " + fran + " till " + till; },
      bookedSr: function (vad) { return " " + vad + ", inte tillgänglig"; },
      warnMinNights: function (min) { return "En vistelse är minst " + min + " nätter. Välj en senare avresedag."; },
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
      guidingLine: "Guidning på isen",
      legendPricier: "Dyrare natt",
      pricierNote: "En prick betyder att natten som börjar den dagen är dyrare. Då tillkommer ett tillägg per person, som redan ingår i totalen.",
      pricierAria: function (belopp) { return "dyrare natt, tillägg " + belopp + " per person"; },
      pricierLine: function (belopp, n) { return "Inklusive " + belopp + " per person i tillägg för " + n + (n === 1 ? " dyrare natt" : " dyrare nätter"); },
      bookPayBtn: "Boka och betala",
      personsLegend: "Hur många personer?",
      personsFewer: "En person färre",
      personsMore: "En person fler"
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
      hintEnd: function (ankunft, min) { return "Ankunft am " + ankunft + ". Wähle jetzt deinen Abreisetag - mindestens " + min + " Nächte."; },
      reset: "Neu wählen",
      chosenLabel: "Dein Zeitraum",
      nightsLabel: function (n) { return n + (n === 1 ? " Nacht" : " Nächte"); },
      continueBtn: "Weiter zur Anfrage",
      defaultBooked: "Belegt",
      availableAria: function (datum) { return datum + ", verfügbar"; },
      totalLabel: function (gesamt) { return "Gesamt €" + gesamt + " pro Person"; },
      groupTotalLabel: function (gesamt, n, pp) { return "Gesamt €" + gesamt + " für " + n + " Personen (€" + pp + " pro Person)"; },
      bookedTitle: function (was, von, bis) { return was + ": " + von + " bis " + bis; },
      bookedSr: function (was) { return " " + was + ", nicht verfügbar"; },
      warnMinNights: function (min) { return "Ein Aufenthalt dauert mindestens " + min + " Nächte. Wähle einen späteren Abreisetag."; },
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
      guidingLine: "Begleitung auf dem Eis",
      legendPricier: "Teurere Nacht",
      pricierNote: "Ein Punkt bedeutet, dass die Nacht, die an diesem Tag beginnt, teurer ist. Dafür kommt pro Person ein Aufschlag hinzu, der schon im Gesamtpreis enthalten ist.",
      pricierAria: function (betrag) { return "teurere Nacht, Aufschlag " + betrag + " pro Person"; },
      pricierLine: function (betrag, n) { return "Inklusive " + betrag + " pro Person Aufschlag für " + n + (n === 1 ? " teurere Nacht" : " teurere Nächte"); },
      bookPayBtn: "Buchen und bezahlen",
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
      hintEnd: function (ankomst, min) { return "Ankomst " + ankomst + ". Velg nå avreisedagen din - minst " + min + " netter."; },
      reset: "Velg på nytt",
      chosenLabel: "Din periode",
      nightsLabel: function (n) { return n + (n === 1 ? " natt" : " netter"); },
      continueBtn: "Gå videre til forespørsel",
      defaultBooked: "Booket",
      availableAria: function (dato) { return dato + ", tilgjengelig"; },
      totalLabel: function (total) { return "Totalt €" + total + " per person"; },
      groupTotalLabel: function (total, n, pp) { return "Totalt €" + total + " for " + n + " personer (€" + pp + " per person)"; },
      bookedTitle: function (hva, fra, til) { return hva + ": " + fra + " til " + til; },
      bookedSr: function (hva) { return " " + hva + ", ikke tilgjengelig"; },
      warnMinNights: function (min) { return "Et opphold varer minst " + min + " netter. Velg en senere avreisedag."; },
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
      guidingLine: "Veiledning på isen",
      legendPricier: "Dyrere natt",
      pricierNote: "En prikk betyr at natten som begynner den dagen, er dyrere. Da kommer det et tillegg per person, som allerede er med i totalen.",
      pricierAria: function (belop) { return "dyrere natt, tillegg " + belop + " per person"; },
      pricierLine: function (belop, n) { return "Inkludert " + belop + " per person i tillegg for " + n + (n === 1 ? " dyrere natt" : " dyrere netter"); },
      bookPayBtn: "Book og betal",
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
      hintEnd: function (saapuminen, min) { return "Saapuminen " + saapuminen + ". Valitse nyt lähtöpäivä - vähintään " + min + " yötä."; },
      reset: "Valitse uudelleen",
      chosenLabel: "Valittu ajanjakso",
      nightsLabel: function (n) { return n + (n === 1 ? " yö" : " yötä"); },
      continueBtn: "Jatka varauspyyntöön",
      defaultBooked: "Varattu",
      availableAria: function (pvm) { return pvm + ", vapaa"; },
      totalLabel: function (yhteensa) { return "Yhteensä €" + yhteensa + " / henkilö"; },
      groupTotalLabel: function (yhteensa, n, pp) { return "Yhteensä €" + yhteensa + ", " + n + " henkilöä (€" + pp + " / henkilö)"; },
      bookedTitle: function (mika, alkaen, saakka) { return mika + ": " + alkaen + " – " + saakka; },
      bookedSr: function (mika) { return " " + mika + ", ei vapaa"; },
      warnMinNights: function (min) { return "Vähimmäisoleskelu on " + min + " yötä. Valitse myöhäisempi lähtöpäivä."; },
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
      guidingLine: "Opastus jäällä",
      legendPricier: "Kalliimpi yö",
      pricierNote: "Piste tarkoittaa, että sinä päivänä alkava yö on kalliimpi. Siitä tulee lisämaksu per henkilö, joka sisältyy jo kokonaishintaan.",
      pricierAria: function (summa) { return "kalliimpi yö, lisämaksu " + summa + " / henkilö"; },
      pricierLine: function (summa, n) { return "Sisältää " + summa + " / henkilö lisämaksua " + n + " kalliimmasta yöstä"; },
      bookPayBtn: "Varaa ja maksa",
      personsLegend: "Kuinka monta henkilöä?",
      personsFewer: "Yksi henkilö vähemmän",
      personsMore: "Yksi henkilö enemmän"
    }
  };
  var LANG = (document.documentElement.lang || "nl").slice(0, 2).toLowerCase();
  var T = I18N[LANG] || I18N.nl;

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

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    closeLangSwitch();
    syncHeader();
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.contains("is-open");
      if (isOpen) {
        closeNav();
      } else {
        nav.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
        syncHeader();
      }
    });

    if (closeBtn) closeBtn.addEventListener("click", closeNav);

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });

    window.matchMedia("(min-width: 72rem)").addEventListener("change", function (e) {
      if (e.matches) closeNav();
    });

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
      if (event.key === "Escape") closeLangSwitch();
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
    var vh = window.innerHeight;

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
        dots[current].classList.remove("is-active");
        dots[current].removeAttribute("aria-current");

        current = next;
        slides[current].classList.add("is-active");
        dots[current].classList.add("is-active");
        dots[current].setAttribute("aria-current", "true");

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
    return datum;
  }
  function alsTekst(datum) {
    function twee(n) { return (n < 10 ? "0" : "") + n; }
    return datum.getFullYear() + "-" + twee(datum.getMonth() + 1) + "-" + twee(datum.getDate());
  }
  function schrijfDatum(datum) {
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

  /* Dezelfde kalender, maar dan als stap in het aanvraagformulier
     (boeken.html, via js/boeken.js). Er staat dan geen knop "Verder met de
     aanvraag" onder: wat de bezoeker kiest, gaat meteen naar het formulier.

       NovakseReiskalender.start(box, pad, {
         van: "2027-01-10", tot: "2027-01-14",  // optional starting period
         personen: function () { return 2; },   // head count from the form
         onKies: function (info) { ... }         // called on every change
       })

     info = { van, tot, nachten, verblijf (per person, whole euros, or null),
              basisPersonen, begeleidingDagen, begeleidingBedrag (whole
              group), begeleidingLabel }. opties.begeleidingDagen presets the
     guiding days (only with guiding in the price file). The handle it returns has herteken(), to call
     when the head count in the form changes. */
  window.NovakseReiskalender = {
    start: function (box, pad, opties) {
      var handvat = { herteken: function () {} };
      var data = {};
      laadPrijzen(pad, data, function () {
        var gebouwd = bouwKalender(box, data, opties || {});
        if (gebouwd) handvat.herteken = gebouwd.herteken;
      });
      return handvat;
    }
  };

  // Give every guiding block and persons field its own id.
  var begeleidingTeller = 0;
  var personenTeller = 0;

  function bouwKalender(box, data, opties) {
    if (!data.seizoenStart || !data.seizoenEind) return;
    var ingebed = Boolean(opties && typeof opties.onKies === "function");

    var seizoenVan = alsDatum(data.seizoenStart);
    var seizoenTot = alsDatum(data.seizoenEind);
    // Staat er een onleesbare of omgekeerde periode in het blokje, dan blijft
    // de gewone tekst staan die er zonder JavaScript ook al is.
    if (!seizoenVan || !seizoenTot || seizoenTot <= seizoenVan) return;

    var minNachten = data.minimumNachten || 1;
    var dagprijs = data.prijsPerPersoonPerDag || 0;

    /* Pay online ("afrekenen": true in the price file). On the trip page the
       calendar then gets a persons stepper and a "Book and pay" link to
       uitchecken.html instead of the button to the request form. The
       embedded calendar in boeken.html is not affected. */
    var afrekenen = !ingebed && data.afrekenen === true;
    var personenKeuze = data.personen || {};
    var personenMin = Math.max(1, parseInt(personenKeuze.min, 10) || 1);
    var personenMax = Math.max(personenMin, parseInt(personenKeuze.max, 10) || 20);
    function binnenPersonen(n) {
      return Math.min(personenMax, Math.max(personenMin, n));
    }
    var personen = binnenPersonen(2);

    /* Group pricing ("groepsKorting.perPersoonPerNacht" in the price file):
       euros per person per night relative to 2 persons, keyed by group size.
       Negative is a discount; a missing size counts as 0. The server
       (api/create-payment.js) uses exactly the same rule. */
    function groepsKortingPerNacht(aantal) {
      var lijst = data.groepsKorting && data.groepsKorting.perPersoonPerNacht;
      var waarde = lijst ? lijst[String(aantal)] : 0;
      return typeof waarde === "number" && isFinite(waarde) ? waarde : 0;
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
      return "€" + (c / 100).toLocaleString("nl-NL", {
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
      var aantal = parseInt(new URLSearchParams(window.location.search).get("personen"), 10);
      return isNaN(aantal) ? 0 : aantal;
    })();
    // A head count from the trip finder presets the persons stepper.
    if (afrekenen && reizigersUitAdres > 0) personen = binnenPersonen(reizigersUitAdres);

    /* What the visitor pays when paying online, in whole euros: the price
       per person (as shown today, plus the group price per night) times the
       group, plus guiding for the whole group. 0 when there is no price. */
    function betaalBedragen(aankomst, nachten) {
      var basis = heleEuros(prijsPerPersoon(aankomst, nachten));
      if (!basis) return { perPersoon: 0, totaal: 0 };
      var perPersoon = basis + groepsKortingPerNacht(personen) * nachten;
      if (!(perPersoon > 0)) return { perPersoon: 0, totaal: 0 };
      return {
        perPersoon: perPersoon,
        totaal: perPersoon * personen + begeleidingGroep(gekozenBegeleiding(), personen)
      };
    }

    /* De prijzen gelden per persoon. Kwam het aantal reizigers uit de
       reiszoeker mee, dan staat het totaal voor de hele groep erbij, net als
       in het aanvraagformulier. */
    function prijsTekst(perPersoon) {
      function bedrag(n) { return n.toLocaleString("nl-NL"); }
      // Guiding is a group amount; it is added to the group total and only
      // the per-person figure shown next to it is rounded.
      var begeleid = gekozenBegeleiding();
      if (ingebed) {
        // In the form the head count comes from the form itself. The prices
        // assume basisPersonen per cabin; with fewer people the form gives no
        // estimate, so the calendar shows none either.
        var aantal = opties.personen ? opties.personen() : 1;
        if (aantal < (data.basisPersonen || 1)) return "";
        var groepIngebed = perPersoon * aantal + begeleidingGroep(begeleid, aantal);
        return aantal > 1
          ? T.groupTotalLabel(bedrag(groepIngebed), aantal, bedrag(Math.round(groepIngebed / aantal)))
          : T.totalLabel(groepIngebed);
      }
      // Without a head count in the web address, guiding is priced for
      // basisPersonen (the number the prices assume), and the line says so.
      var groepsgrootte = reizigersUitAdres > 1 ? reizigersUitAdres : (begeleid ? reizigers() : 1);
      var groep = perPersoon * groepsgrootte + begeleidingGroep(begeleid, groepsgrootte);
      if (groepsgrootte > 1) {
        return T.groupTotalLabel(bedrag(groep), groepsgrootte, bedrag(Math.round(groep / groepsgrootte)));
      }
      return T.totalLabel(groep);
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

    // Head count for the guiding price: the form's, the trip finder's, or
    // else basisPersonen.
    function reizigers() {
      if (ingebed) return opties.personen ? opties.personen() : 1;
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

    /* Persons stepper (only when paying online): minus, a number field and
       plus, the same control as in the Falun calendar and on boeken.html.
       It is built once, so keyboard focus stays on the button being used;
       tekenPersonen() only updates the value and the buttons. */
    var personenVeld = null;
    var personenMinder = null;
    var personenMeer = null;
    if (afrekenen) {
      var personenId = "calendarPersons" + (++personenTeller);
      var personenBox = document.createElement("div");
      personenBox.className = "falun-cal__block calendar__persons";
      personenBox.innerHTML =
        '<label class="falun-cal__legend" for="' + personenId + '">' + T.personsLegend + '</label>' +
        '<div class="booking__persons">' +
          '<button type="button" class="booking__step-btn" data-personen-stap="-1" aria-label="' + T.personsFewer + '" aria-controls="' + personenId + '">−</button>' +
          '<input type="number" id="' + personenId + '" min="' + personenMin + '" max="' + personenMax + '" step="1" inputmode="numeric" value="' + personen + '" />' +
          '<button type="button" class="booking__step-btn" data-personen-stap="1" aria-label="' + T.personsMore + '" aria-controls="' + personenId + '">+</button>' +
        '</div>';
      box.appendChild(personenBox);
      personenVeld = personenBox.querySelector("input");
      personenMinder = personenBox.querySelector('[data-personen-stap="-1"]');
      personenMeer = personenBox.querySelector('[data-personen-stap="1"]');

      [personenMinder, personenMeer].forEach(function (knop) {
        knop.addEventListener("click", function () {
          var nieuw = binnenPersonen(personen + parseInt(knop.getAttribute("data-personen-stap"), 10));
          if (nieuw === personen) return;
          personen = nieuw;
          toonBalk();
          // At the end of the range this button switches off; keep focus
          // in the stepper on the other button.
          if (knop.disabled) (knop === personenMinder ? personenMeer : personenMinder).focus();
        });
      });
      // Typing works too; an empty or invalid field is ignored until the
      // visitor leaves it, then the last valid number shows again.
      personenVeld.addEventListener("input", function () {
        var uit = parseInt(personenVeld.value, 10);
        if (isNaN(uit)) return;
        var nieuw = binnenPersonen(uit);
        if (nieuw === personen) return;
        personen = nieuw;
        toonBalk();
      });
      personenVeld.addEventListener("change", function () {
        personenVeld.value = personen;
      });
    }
    function tekenPersonen() {
      if (!personenVeld) return;
      if (parseInt(personenVeld.value, 10) !== personen) personenVeld.value = personen;
      personenMinder.disabled = personen <= personenMin;
      personenMeer.disabled = personen >= personenMax;
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

    function euroTekst(n) { return "€" + n.toLocaleString("nl-NL"); }

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

    /* In the form: pass the current choice on. Only a complete period
       counts; while the departure day is still open, the form has none. */
    function meld() {
      if (!ingebed) return;
      var klaar = Boolean(keuzeVan && keuzeTot);
      var nachten = klaar ? dagenTussen(keuzeVan, keuzeTot) : 0;
      var perPersoon = klaar ? heleEuros(prijsPerPersoon(keuzeVan, nachten)) : 0;
      var begeleid = klaar ? gekozenBegeleiding() : 0;
      opties.onKies({
        // Guiding (only with a guiding block in the price file): days, the
        // amount for the whole group and a line for the request.
        begeleidingDagen: begeleid,
        begeleidingBedrag: begeleidingGroep(begeleid, reizigers()),
        begeleidingLabel: begeleid ? T.guidingLine + " (" + T.guidingDays(begeleid) + ")" : "",
        van: klaar ? alsTekst(keuzeVan) : null,
        tot: klaar ? alsTekst(keuzeTot) : null,
        nachten: nachten,
        verblijf: perPersoon || null,
        basisPersonen: data.basisPersonen || 1
      });
    }

    function toonBalk() {
      // A new complete period: guiding days fit the trip, or drop to 0
      // when guiding is not possible in that period.
      if (begeleiding && keuzeVan && keuzeTot) {
        begeleidingDagen = gekozenBegeleiding();
      }
      tekenPersonen();
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
        if (gekozenBegeleiding()) params.set("begeleiding", String(gekozenBegeleiding()));
        return '<a class="btn btn--dark calendar__pay" href="' + mapVoorKalender() + 'uitchecken.html?' +
          params.toString().replace(/&/g, "&amp;") + '">' + T.bookPayBtn + '</a>';
      }
      // A head count from the trip finder (or the stepper) stays with the
      // request when someone picks another period here.
      var aantal = afrekenen ? personen : reizigersUitAdres;
      if (aantal) params.set("personen", String(aantal));
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
        balk.innerHTML = '<p class="calendar__hint">' + T.hintEnd(schrijfDatum(keuzeVan), minNachten) + '</p>' +
          '<button type="button" class="calendar__reset">' + T.reset + '</button>';
        return;
      }
      var nachten = dagenTussen(keuzeVan, keuzeTot);
      var totaal = heleEuros(prijsPerPersoon(keuzeVan, nachten));
      var prijsRegel = "";
      if (afrekenen) {
        // Paying online: per person and total for the chosen group, the
        // same amounts the payment page charges.
        var bedragen = betaalBedragen(keuzeVan, nachten);
        if (bedragen.totaal) {
          prijsRegel = personen > 1
            ? T.groupTotalLabel(bedragen.totaal.toLocaleString("nl-NL"), personen,
                Math.round(bedragen.totaal / personen).toLocaleString("nl-NL"))
            : T.totalLabel(bedragen.totaal.toLocaleString("nl-NL"));
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
          '<span class="calendar__chosen-nights">' + T.nightsLabel(nachten) + '</span>' +
          (prijsRegel ? '<span class="calendar__chosen-price">' + prijsRegel + '</span>' : '') +
          toeslagRegel +
        '</div>' +
        '<div class="calendar__bar-actions">' +
          '<button type="button" class="calendar__reset">' + T.reset + '</button>' +
          // In the form the choice goes straight into the request, so there
          // is no button to the request page here.
          (ingebed ? '' : knopHtml(nachten)) +
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
          uitleg.textContent = T.bookedSr(blok.wat);
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
        balk.innerHTML = '<p class="calendar__hint">' + T.warnMinNights(minNachten) + '</p>' +
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
       de kalender gewoon leeg en kiest hij zelf. In het aanvraagformulier
       geeft het formulier de periode zelf mee. */
    (function () {
      var params = new URLSearchParams(window.location.search);
      var uitVan = alsDatum(ingebed ? opties.van : params.get("van"));
      var uitTot = alsDatum(ingebed ? opties.tot : params.get("tot"));
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
      var begeleidingUitAdres = parseInt(ingebed
        ? opties.begeleidingDagen
        : new URLSearchParams(window.location.search).get("begeleiding"), 10);
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

    // herteken: the head count in the form changed, so the price line in
    // the bar (and what the form gets) is redrawn.
    return { herteken: toonBalk };
  }

  /* ------------------------------------------------------------------
     Collage bij het persoonlijke verhaal: elke foto schuift tijdens het
     scrollen een klein stukje mee in een eigen tempo. De afstand staat per
     foto in data-speed (in pixels over de hele doorloop). Er wordt alleen een
     transform gezet, en alleen zolang de collage in beeld is.
     ------------------------------------------------------------------ */
  var collage = document.querySelector("[data-collage]");

  if (collage && !reducedMotion.matches) {
    var collageItems = collage.querySelectorAll(".collage__item");

    var syncCollage = function () {
      var rect = collage.getBoundingClientRect();
      var vh = window.innerHeight;

      // Niets uitrekenen zolang de collage ver buiten beeld is.
      if (rect.bottom < -vh || rect.top > vh * 2) return;

      // -1 net onder het scherm, +1 net erboven; 0 als de collage in het midden staat
      var progress = ((vh - rect.top) / (vh + rect.height)) * 2 - 1;
      progress = Math.min(1, Math.max(-1, progress));

      // Op een smal scherm is dezelfde verschuiving verhoudingsgewijs veel
      // groter, dus daar wordt de afstand teruggeschroefd.
      var scale = Math.max(0.45, Math.min(1, window.innerWidth / 1100));

      // De onderste twee foto's lopen sneller dan de grote bovenste (zie
      // data-speed in de HTML): daardoor kruipen ze tijdens het scrollen
      // naar elkaar toe. De afstand is bewust groot — dat is het effect.
      collageItems.forEach(function (item) {
        var speed = parseFloat(item.dataset.speed) || 0;
        item.style.setProperty(
          "--collage-shift",
          (progress * speed * scale).toFixed(1) + "px"
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
    (function follow() {
      ringX += (mouseX - ringX) * 0.32;
      ringY += (mouseY - ringY) * 0.32;
      dotX += (mouseX - dotX) * 0.055;
      dotY += (mouseY - dotY) * 0.055;
      ring.style.transform = "translate3d(" + ringX + "px," + ringY + "px,0)";
      dot.style.transform = "translate3d(" + dotX + "px," + dotY + "px,0)";
      window.requestAnimationFrame(follow);
    })();

    // Ring wordt groter boven klikbare dingen
    document.querySelectorAll("a, button, summary, [role='button'], input, select, textarea")
      .forEach(function (el) {
        el.addEventListener("mouseenter", function () { ring.classList.add("is-active"); });
        el.addEventListener("mouseleave", function () { ring.classList.remove("is-active"); });
      });
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
     Leesrust: de pagina komt na het scrollen zachtjes tot stilstand bij een
     kop, zodat je van kop naar kop leest in plaats van er middenin te blijven
     hangen. Ligt er geen kop in de buurt, dan blijft de pagina staan waar je
     stopte - er wordt dus nooit een heel eind gesprongen.

     Bewust geen CSS scroll-snap: dat vecht met de vloeiende scroll van de
     browser en met de vaartafloop van een trackpad, wat gehaper geeft. Hier
     gebeurt er tijdens het scrollen niets. Pas als je echt stilstaat en er al
     een kop dichtbij staat, schuift de pagina dat laatste stukje bij.
     Elke muis-, toets- of scrollbeweging breekt dat direct af.
     ------------------------------------------------------------------ */
  var settleMedia = window.matchMedia("(min-width: 48rem) and (pointer: fine)");

  if (!reducedMotion.matches && settleMedia.matches) {
    var SETTLE_IDLE = 180;     // ms stilstand voordat we bijsturen
    var SETTLE_RANGE = 0.2;    // deel van het scherm waarbinnen we bijsturen
    var SETTLE_MIN = 6;        // px, kleiner verschil laten we staan
    var SETTLE_MAX_MS = 480;

    // Hoogte van de vaste balk; valt terug op 5rem als de balk er niet is.
    var headerOffset = function () {
      return header ? header.offsetHeight : 80;
    };

    var settleTimer = null;
    var settleFrame = null;
    var settleActive = false;

    var stopSettle = function () {
      if (settleFrame !== null) window.cancelAnimationFrame(settleFrame);
      settleFrame = null;
      settleActive = false;
      // De vloeiende scroll van de browser weer aan de stylesheet overlaten.
      document.documentElement.style.scrollBehavior = "";
    };

    var maxScrollY = function () {
      return Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
    };

    // De rustpunten van de pagina: de koppen. Je leest zo van kop naar kop.
    // Heeft een sectie geen eigen kop (bijvoorbeeld de openingsfoto), dan
    // telt de bovenkant van die sectie, zodat er geen blok wordt overgeslagen.
    var settlePoints = function () {
      var y = window.scrollY;
      var vh = window.innerHeight;
      var offset = headerOffset();
      var air = Math.min(48, Math.round(vh * 0.05)); // beetje lucht boven de kop
      var points = [];

      document.querySelectorAll("main > section").forEach(function (section) {
        var found = false;

        section.querySelectorAll("h1, h2").forEach(function (heading) {
          // Verborgen koppen (dichtgeklapt, andere taal) tellen niet mee.
          if (!heading.getClientRects().length) return;
          points.push(Math.round(y + heading.getBoundingClientRect().top - offset - air));
          found = true;
        });

        if (!found) {
          points.push(Math.round(y + section.getBoundingClientRect().top - offset));
        }
      });

      points.sort(function (a, b) { return a - b; });

      // Koppen die vlak bij elkaar staan - twee kolommen naast elkaar, of een
      // kop direct onder een tussenkop - leveren samen één rustpunt op.
      var minGap = Math.max(140, vh * 0.35);
      var spread = [];

      points.forEach(function (point) {
        if (!spread.length || point - spread[spread.length - 1] >= minGap) {
          spread.push(point);
        }
      });

      return spread;
    };

    // Het dichtstbijzijnde rustpunt, gemeten vanaf de huidige scrollpositie.
    var nearestPoint = function (y) {
      var best = null;
      var bestGap = Infinity;

      settlePoints().forEach(function (point) {
        var gap = Math.abs(point - y);
        if (gap < bestGap) {
          bestGap = gap;
          best = point;
        }
      });

      return best;
    };

    var runSettle = function (from, to) {
      var distance = to - from;
      var duration = Math.min(SETTLE_MAX_MS, 200 + Math.abs(distance) * 1.1);
      var start = null;

      // De eigen animatie zet de scrollpositie per frame; de vloeiende scroll
      // van de browser moet daar even uit, anders animeren er twee dingen.
      document.documentElement.style.scrollBehavior = "auto";

      settleActive = true;

      var step = function (now) {
        if (start === null) start = now;

        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3); // easeOutCubic: rustig uitlopen
        var y = Math.round(from + distance * eased);

        window.scrollTo(0, y);

        if (t < 1 && settleActive) {
          settleFrame = window.requestAnimationFrame(step);
          return;
        }

        stopSettle();
      };

      settleFrame = window.requestAnimationFrame(step);
    };

    var settle = function () {
      if (settleActive) return;

      var y = window.scrollY;
      var limit = maxScrollY();

      // Boven- en onderkant van de pagina laten we met rust.
      if (y <= 4 || y >= limit - 4) return;

      var target = nearestPoint(y);
      if (target === null) return;

      target = Math.max(0, Math.min(limit, target));

      var delta = Math.abs(target - y);
      if (delta < SETTLE_MIN || delta > window.innerHeight * SETTLE_RANGE) return;

      runSettle(y, target);
    };

    window.addEventListener("scroll", function () {
      // Tijdens de eigen animatie komen de scroll-events van onszelf.
      if (settleActive) return;

      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, SETTLE_IDLE);
    }, { passive: true });

    // Elke eigen beweging van de bezoeker gaat voor: de wachttijd wordt
    // opnieuw ingesteld en een lopende bijstuur-animatie stopt meteen.
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (type) {
      window.addEventListener(type, function () {
        if (settleTimer) window.clearTimeout(settleTimer);
        if (settleActive) stopSettle();
      }, { passive: true });
    });
  }

})();
