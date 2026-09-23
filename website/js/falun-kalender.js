/* ==========================================================================
   Falun - kalender met prijs per aankomstdag

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

   Zodra de kalender opengaat, staat de goedkoopste aankomstdag al
   voorgeselecteerd. Zo ziet de bezoeker meteen de vanaf-prijs waar de rest
   van de pagina over spreekt.

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
      days: function (n) { return n + " dagen"; },
      nights: function (n) { return n + (n === 1 ? " nacht" : " nachten"); },
      arrivalLegend: "Wanneer kom je aan?",
      hint: "Klik de dag aan waarop je aankomt. De prijs staat bij de dag.",
      legendAvailable: "Beschikbaar",
      legendBooked: "Al bezet",
      legendChosen: "Jouw keuze",
      optionsLegend: "Wat wil je zelf regelen?",
      flightSelf: "Ik regel mijn vlucht zelf",
      flightSelfHint: "De heen- en terugvlucht zit anders bij de prijs in",
      carSelf: "Ik regel mijn vervoer naar de accommodatie zelf",
      carSelfHint: "De huurauto zit anders bij de prijs in",
      guiding: "Begeleiding op het ijs",
      guidingHint: "Joey schaatst mee, met een kampvuur onderweg, lunch en vika's",
      guidingWindow: function (van, tot) { return "Alleen mogelijk van " + van + " tot en met " + tot; },
      guidingOutside: "Niet mogelijk in de periode die je gekozen hebt",
      guidingPriceUnknown: "Prijs volgt",
      summaryTitle: "Jouw reis",
      lineTrip: function (dagen) { return "Falun, " + dagen + " dagen"; },
      lineArrival: "Aankomst",
      lineFlight: "Vlucht zelf geregeld",
      lineCar: "Vervoer zelf geregeld",
      lineGuiding: "Begeleiding op het ijs",
      total: "Totaal per persoon",
      book: "Boek en reken af",
      chooseFirst: "Kies eerst een aankomstdag.",
      perPerson: "per persoon",
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " tot " + tot; },
      bookedSr: function (wat) { return " " + wat + ", niet beschikbaar"; },
      availableAria: function (datum, prijs) { return datum + ", beschikbaar, " + prijs + " per persoon"; },
      tooLate: "In die periode past je verblijf niet meer binnen het seizoen.",
      overlap: "In die periode zit een week die al bezet is."
    },
    en: {
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      dayHeaders: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
      durationLegend: "How long are you staying?",
      days: function (n) { return n + " days"; },
      nights: function (n) { return n + (n === 1 ? " night" : " nights"); },
      arrivalLegend: "When do you arrive?",
      hint: "Click the day you arrive. The price is shown on the day.",
      legendAvailable: "Available",
      legendBooked: "Booked",
      legendChosen: "Your choice",
      optionsLegend: "What do you want to arrange yourself?",
      flightSelf: "I'll arrange my own flight",
      flightSelfHint: "Otherwise the return flight is included in the price",
      carSelf: "I'll arrange my own transport to the accommodation",
      carSelfHint: "Otherwise the rental car is included in the price",
      guiding: "Guiding on the ice",
      guidingHint: "Joey skates along, with a campfire on the way, lunch and vika's",
      guidingWindow: function (van, tot) { return "Only available from " + van + " to " + tot; },
      guidingOutside: "Not available in the period you selected",
      guidingPriceUnknown: "Price to follow",
      summaryTitle: "Your trip",
      lineTrip: function (dagen) { return "Falun, " + dagen + " days"; },
      lineArrival: "Arrival",
      lineFlight: "Own flight",
      lineCar: "Own transport",
      lineGuiding: "Guiding on the ice",
      total: "Total per person",
      book: "Book and pay",
      chooseFirst: "Choose an arrival day first.",
      perPerson: "per person",
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " to " + tot; },
      bookedSr: function (wat) { return " " + wat + ", not available"; },
      availableAria: function (datum, prijs) { return datum + ", available, " + prijs + " per person"; },
      tooLate: "Your stay no longer fits within the season in that period.",
      overlap: "That period includes a week that is already booked."
    },
    de: {
      months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      dayHeaders: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
      durationLegend: "Wie lange bleibst du?",
      days: function (n) { return n + " Tage"; },
      nights: function (n) { return n + (n === 1 ? " Nacht" : " Nächte"); },
      arrivalLegend: "Wann kommst du an?",
      hint: "Klicke deinen Ankunftstag an. Der Preis steht beim Tag.",
      legendAvailable: "Verfügbar",
      legendBooked: "Belegt",
      legendChosen: "Deine Wahl",
      optionsLegend: "Was möchtest du selbst organisieren?",
      flightSelf: "Ich buche meinen Flug selbst",
      flightSelfHint: "Sonst ist der Hin- und Rückflug im Preis enthalten",
      carSelf: "Ich organisiere meine Anreise zur Unterkunft selbst",
      carSelfHint: "Sonst ist der Mietwagen im Preis enthalten",
      guiding: "Begleitung auf dem Eis",
      guidingHint: "Joey läuft mit, mit Lagerfeuer unterwegs, Mittagessen und Vika's",
      guidingWindow: function (van, tot) { return "Nur möglich von " + van + " bis " + tot; },
      guidingOutside: "Im gewählten Zeitraum nicht möglich",
      guidingPriceUnknown: "Preis folgt",
      summaryTitle: "Deine Reise",
      lineTrip: function (dagen) { return "Falun, " + dagen + " Tage"; },
      lineArrival: "Ankunft",
      lineFlight: "Flug selbst gebucht",
      lineCar: "Anreise selbst organisiert",
      lineGuiding: "Begleitung auf dem Eis",
      total: "Gesamt pro Person",
      book: "Buchen und bezahlen",
      chooseFirst: "Wähle zuerst einen Ankunftstag.",
      perPerson: "pro Person",
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " bis " + tot; },
      bookedSr: function (wat) { return " " + wat + ", nicht verfügbar"; },
      availableAria: function (datum, prijs) { return datum + ", verfügbar, " + prijs + " pro Person"; },
      tooLate: "In diesem Zeitraum passt dein Aufenthalt nicht mehr in die Saison.",
      overlap: "In diesem Zeitraum liegt eine Woche, die schon belegt ist."
    },
    sv: {
      months: ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
      dayHeaders: ["mån", "tis", "ons", "tor", "fre", "lör", "sön"],
      durationLegend: "Hur länge stannar du?",
      days: function (n) { return n + " dagar"; },
      nights: function (n) { return n + (n === 1 ? " natt" : " nätter"); },
      arrivalLegend: "När kommer du?",
      hint: "Klicka på dagen du anländer. Priset står vid dagen.",
      legendAvailable: "Tillgänglig",
      legendBooked: "Bokad",
      legendChosen: "Ditt val",
      optionsLegend: "Vad vill du ordna själv?",
      flightSelf: "Jag ordnar flyget själv",
      flightSelfHint: "Annars ingår tur- och returflyget i priset",
      carSelf: "Jag ordnar transporten till boendet själv",
      carSelfHint: "Annars ingår hyrbilen i priset",
      guiding: "Guidning på isen",
      guidingHint: "Joey åker med, med lägereld på vägen, lunch och vikor",
      guidingWindow: function (van, tot) { return "Endast möjligt från " + van + " till " + tot; },
      guidingOutside: "Inte möjligt under perioden du valt",
      guidingPriceUnknown: "Pris kommer",
      summaryTitle: "Din resa",
      lineTrip: function (dagen) { return "Falun, " + dagen + " dagar"; },
      lineArrival: "Ankomst",
      lineFlight: "Eget flyg",
      lineCar: "Egen transport",
      lineGuiding: "Guidning på isen",
      total: "Totalt per person",
      book: "Boka och betala",
      chooseFirst: "Välj först en ankomstdag.",
      perPerson: "per person",
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " till " + tot; },
      bookedSr: function (wat) { return " " + wat + ", inte tillgänglig"; },
      availableAria: function (datum, prijs) { return datum + ", tillgänglig, " + prijs + " per person"; },
      tooLate: "Din vistelse ryms inte längre inom säsongen under den perioden.",
      overlap: "Den perioden innehåller en vecka som redan är bokad."
    },
    no: {
      months: ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"],
      dayHeaders: ["man", "tir", "ons", "tor", "fre", "lør", "søn"],
      durationLegend: "Hvor lenge blir du?",
      days: function (n) { return n + " dager"; },
      nights: function (n) { return n + (n === 1 ? " natt" : " netter"); },
      arrivalLegend: "Når kommer du?",
      hint: "Klikk på dagen du ankommer. Prisen står ved dagen.",
      legendAvailable: "Tilgjengelig",
      legendBooked: "Opptatt",
      legendChosen: "Ditt valg",
      optionsLegend: "Hva vil du ordne selv?",
      flightSelf: "Jeg ordner flyet selv",
      flightSelfHint: "Ellers er tur-retur-flyet inkludert i prisen",
      carSelf: "Jeg ordner transporten til overnattingsstedet selv",
      carSelfHint: "Ellers er leiebilen inkludert i prisen",
      guiding: "Guiding på isen",
      guidingHint: "Joey går med, med bål underveis, lunsj og vikaer",
      guidingWindow: function (van, tot) { return "Bare mulig fra " + van + " til " + tot; },
      guidingOutside: "Ikke mulig i perioden du har valgt",
      guidingPriceUnknown: "Pris kommer",
      summaryTitle: "Turen din",
      lineTrip: function (dagen) { return "Falun, " + dagen + " dager"; },
      lineArrival: "Ankomst",
      lineFlight: "Eget fly",
      lineCar: "Egen transport",
      lineGuiding: "Guiding på isen",
      total: "Totalt per person",
      book: "Book og betal",
      chooseFirst: "Velg en ankomstdag først.",
      perPerson: "per person",
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " til " + tot; },
      bookedSr: function (wat) { return " " + wat + ", ikke tilgjengelig"; },
      availableAria: function (datum, prijs) { return datum + ", tilgjengelig, " + prijs + " per person"; },
      tooLate: "Oppholdet ditt passer ikke lenger inn i sesongen i den perioden.",
      overlap: "Den perioden inneholder en uke som allerede er opptatt."
    },
    fi: {
      months: ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"],
      dayHeaders: ["ma", "ti", "ke", "to", "pe", "la", "su"],
      durationLegend: "Kuinka kauan viivyt?",
      days: function (n) { return n + " päivää"; },
      nights: function (n) { return n + (n === 1 ? " yö" : " yötä"); },
      arrivalLegend: "Milloin saavut?",
      hint: "Napsauta saapumispäivääsi. Hinta näkyy päivän kohdalla.",
      legendAvailable: "Vapaa",
      legendBooked: "Varattu",
      legendChosen: "Valintasi",
      optionsLegend: "Mitä haluat järjestää itse?",
      flightSelf: "Järjestän lentoni itse",
      flightSelfHint: "Muuten meno-paluulento sisältyy hintaan",
      carSelf: "Järjestän kuljetuksen majoitukseen itse",
      carSelfHint: "Muuten vuokra-auto sisältyy hintaan",
      guiding: "Opastus jäällä",
      guidingHint: "Joey luistelee mukana, nuotio matkan varrella, lounas ja vikat",
      guidingWindow: function (van, tot) { return "Mahdollista vain " + van + " - " + tot; },
      guidingOutside: "Ei mahdollista valitsemanasi ajankohtana",
      guidingPriceUnknown: "Hinta julkaistaan myöhemmin",
      summaryTitle: "Matkasi",
      lineTrip: function (dagen) { return "Falun, " + dagen + " päivää"; },
      lineArrival: "Saapuminen",
      lineFlight: "Oma lento",
      lineCar: "Oma kuljetus",
      lineGuiding: "Opastus jäällä",
      total: "Yhteensä / henkilö",
      book: "Varaa ja maksa",
      chooseFirst: "Valitse ensin saapumispäivä.",
      perPerson: "/ henkilö",
      bookedTitle: function (wat, van, tot) { return wat + ": " + van + " - " + tot; },
      bookedSr: function (wat) { return " " + wat + ", ei vapaa"; },
      availableAria: function (datum, prijs) { return datum + ", vapaa, " + prijs + " / henkilö"; },
      tooLate: "Oleskelusi ei enää mahdu kauteen kyseisenä ajankohtana.",
      overlap: "Kyseiselle ajanjaksolle osuu jo varattu viikko."
    }
  };

  var LANG = (document.documentElement.lang || "nl").slice(0, 2).toLowerCase();
  var T = I18N[LANG] || I18N.nl;

  var box = document.querySelector("[data-falun-calendar]");
  if (!box) return;

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
  var toeslagen = data.toeslagPerNacht || {};
  var opties = data.opties || {};
  var vluchtBedrag = Math.abs(opties.vluchtZelf || 0);
  var autoBedrag = Math.abs(opties.huurautoZelf || 0);
  var begeleiding = opties.begeleiding || null;
  var begeleidingVan = begeleiding && begeleiding.van ? alsDatum(begeleiding.van) : null;
  var begeleidingTot = begeleiding && begeleiding.tot ? alsDatum(begeleiding.tot) : null;
  var begeleidingPrijs = begeleiding && typeof begeleiding.prijs === "number" ? begeleiding.prijs : null;

  var bezet = (data.bezet || []).map(function (blok) {
    return { van: alsDatum(blok.van), tot: alsDatum(blok.tot), wat: blok.wat || T.legendBooked };
  });

  var duur = duren[0];
  var aankomst = null;
  var vluchtZelf = false;
  var autoZelf = false;
  var begeleidingAan = false;

  function nachtenVan(dagen) { return dagen - 1; }

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
      var sleutel = alsTekst(plusDagen(datum, i));
      if (typeof toeslagen[sleutel] === "number") totaal += toeslagen[sleutel];
    }
    return totaal;
  }

  function begeleidingKan(datum, dagen) {
    if (!begeleiding || begeleidingPrijs === null) return false;
    if (!begeleidingVan || !begeleidingTot) return false;
    var vertrek = plusDagen(datum, nachtenVan(dagen));
    return datum >= begeleidingVan && vertrek <= begeleidingTot;
  }

  /* Het bedrag dat de bezoeker uiteindelijk betaalt. Dezelfde berekening
     staat serverside in api/create-payment.js; die is leidend. */
  function totaalPrijs() {
    if (!aankomst) return null;
    var totaal = verblijfPrijs(aankomst, duur);
    if (totaal === null) return null;
    if (vluchtZelf) totaal -= vluchtBedrag;
    if (autoZelf) totaal -= autoBedrag;
    if (begeleidingAan && begeleidingKan(aankomst, duur)) totaal += begeleidingPrijs;
    return totaal;
  }

  /* De goedkoopste aankomstdag van het seizoen. Die staat voorgeselecteerd
     zodra de kalender opengaat, zodat de vanaf-prijs meteen in beeld staat. */
  function goedkoopsteDag(dagen) {
    var beste = null;
    var besteBedrag = null;
    var loop = new Date(seizoenVan.getTime());
    while (loop <= seizoenTot) {
      if (kanAankomen(loop, dagen)) {
        var bedrag = verblijfPrijs(loop, dagen);
        if (bedrag !== null && (besteBedrag === null || bedrag < besteBedrag)) {
          besteBedrag = bedrag;
          beste = new Date(loop.getTime());
        }
      }
      loop = plusDagen(loop, 1);
    }
    return beste;
  }

  /* ------------------------------------------------------------------
     Opbouw van het scherm
     ------------------------------------------------------------------ */
  var duurBox = document.createElement("div");
  duurBox.className = "falun-cal__block";

  var raster = document.createElement("div");
  raster.className = "calendar__months";

  var legenda = document.createElement("div");
  legenda.className = "calendar__legend";
  legenda.innerHTML =
    '<span class="calendar__legend-item"><span class="calendar__chip is-vrij"></span>' + T.legendAvailable + "</span>" +
    '<span class="calendar__legend-item"><span class="calendar__chip is-bezet"></span>' + T.legendBooked + "</span>" +
    '<span class="calendar__legend-item"><span class="calendar__chip is-gekozen"></span>' + T.legendChosen + "</span>";

  var optieBox = document.createElement("div");
  optieBox.className = "falun-cal__block";

  var samenvatting = document.createElement("div");
  samenvatting.className = "falun-cal__summary";
  samenvatting.setAttribute("aria-live", "polite");

  box.innerHTML = "";
  box.appendChild(duurBox);
  box.appendChild(legenda);
  box.appendChild(raster);
  box.appendChild(optieBox);
  box.appendChild(samenvatting);

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
        if (!aankomst) aankomst = goedkoopsteDag(duur);
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

    var bedrag = verblijfPrijs(datum, duur);
    var knop = document.createElement("button");
    knop.type = "button";
    knop.className = "calendar__cell is-vrij falun-cal__cell";
    knop.innerHTML =
      '<span class="calendar__daynr">' + datum.getDate() + "</span>" +
      (bedrag === null ? "" : '<span class="falun-cal__dagprijs">' + euro(bedrag) + "</span>");
    knop.setAttribute("aria-label", T.availableAria(schrijfDatum(datum), bedrag === null ? "" : euro(bedrag)));

    if (aankomst && datum.getTime() === aankomst.getTime()) {
      knop.classList.add("is-gekozen", "is-start");
    } else if (aankomst) {
      // De nachten na de aankomstdag kleuren mee, zodat de periode zichtbaar is.
      var vertrek = plusDagen(aankomst, nachtenVan(duur));
      if (datum > aankomst && datum <= vertrek) knop.classList.add("is-tussen");
    }

    knop.addEventListener("click", function () {
      aankomst = datum;
      if (begeleidingAan && !begeleidingKan(aankomst, duur)) begeleidingAan = false;
      tekenAlles();
    });
    return knop;
  }

  function tekenOpties() {
    var begeleidingMag = aankomst ? begeleidingKan(aankomst, duur) : false;
    var begeleidingHint = T.guidingHint;
    if (begeleidingPrijs === null) {
      begeleidingHint = T.guidingPriceUnknown;
    } else if (!begeleidingMag && begeleidingVan && begeleidingTot) {
      begeleidingHint = aankomst
        ? T.guidingOutside
        : T.guidingWindow(schrijfDatum(begeleidingVan), schrijfDatum(begeleidingTot));
    }

    var regels =
      '<label class="extra">' +
        '<input type="checkbox" class="extra__check" data-optie="vlucht"' + (vluchtZelf ? " checked" : "") + " />" +
        '<span class="extra__name">' + T.flightSelf +
          '<span class="extra__hint">' + T.flightSelfHint + "</span>" +
        "</span>" +
        '<span class="extra__price">- ' + euro(vluchtBedrag) + "</span>" +
      "</label>" +
      '<label class="extra">' +
        '<input type="checkbox" class="extra__check" data-optie="auto"' + (autoZelf ? " checked" : "") + " />" +
        '<span class="extra__name">' + T.carSelf +
          '<span class="extra__hint">' + T.carSelfHint + "</span>" +
        "</span>" +
        '<span class="extra__price">- ' + euro(autoBedrag) + "</span>" +
      "</label>";

    if (begeleiding) {
      regels +=
        '<label class="extra' + (begeleidingMag ? "" : " is-uit") + '">' +
          '<input type="checkbox" class="extra__check" data-optie="begeleiding"' +
            (begeleidingAan ? " checked" : "") + (begeleidingMag ? "" : " disabled") + " />" +
          '<span class="extra__name">' + T.guiding +
            '<span class="extra__hint">' + begeleidingHint + "</span>" +
          "</span>" +
          '<span class="extra__price">' +
            (begeleidingPrijs === null ? "" : "+ " + euro(begeleidingPrijs)) +
          "</span>" +
        "</label>";
    }

    optieBox.innerHTML =
      '<p class="falun-cal__legend">' + T.optionsLegend + "</p>" +
      '<div class="booking__extras">' + regels + "</div>";

    optieBox.querySelectorAll("[data-optie]").forEach(function (veld) {
      veld.addEventListener("change", function () {
        var welke = veld.getAttribute("data-optie");
        if (welke === "vlucht") vluchtZelf = veld.checked;
        if (welke === "auto") autoZelf = veld.checked;
        if (welke === "begeleiding") begeleidingAan = veld.checked;
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
    var totaal = totaalPrijs();
    var vertrek = plusDagen(aankomst, nachtenVan(duur));

    var regels =
      "<dt>" + T.lineTrip(duur) + "</dt><dd>" + euro(verblijf) + "</dd>" +
      "<dt>" + T.lineArrival + "</dt><dd>" + schrijfDatum(aankomst) + "</dd>";
    if (vluchtZelf) regels += "<dt>" + T.lineFlight + "</dt><dd>- " + euro(vluchtBedrag) + "</dd>";
    if (autoZelf) regels += "<dt>" + T.lineCar + "</dt><dd>- " + euro(autoBedrag) + "</dd>";
    if (begeleidingAan && begeleidingKan(aankomst, duur)) {
      regels += "<dt>" + T.lineGuiding + "</dt><dd>+ " + euro(begeleidingPrijs) + "</dd>";
    }

    // Wat er naar de betaalpagina meegaat. Het bedrag wordt daar opnieuw
    // uitgerekend; deze regels zijn er zodat de bezoeker ziet waarvoor hij
    // betaalt en Joey het in Stripe terugleest.
    var params = new URLSearchParams();
    params.set("reis", "Falun");
    params.set("aankomst", alsTekst(aankomst));
    params.set("dagen", String(duur));
    if (vluchtZelf) params.set("vlucht", "zelf");
    if (autoZelf) params.set("auto", "zelf");
    if (begeleidingAan && begeleidingKan(aankomst, duur)) params.set("begeleiding", "ja");

    samenvatting.innerHTML =
      '<p class="falun-cal__summary-title">' + T.summaryTitle + "</p>" +
      '<dl class="booking__lines">' + regels + "</dl>" +
      '<div class="booking__total"><span>' + T.total + "</span><strong>" + euro(totaal) + "</strong></div>" +
      '<p class="falun-cal__period">' + schrijfDatum(aankomst) + " - " + schrijfDatum(vertrek) + "</p>" +
      '<a class="btn btn--dark falun-cal__book" href="' + (data.betaalpagina || "uitchecken.html") + "?" + params.toString() + '">' +
        T.book + "</a>";
  }

  function tekenAlles() {
    tekenDuur();
    tekenRaster();
    tekenOpties();
    tekenSamenvatting();
  }

    aankomst = goedkoopsteDag(duur);
    tekenAlles();
  }
})();
