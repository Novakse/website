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
      months: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
      nightsLabel: function (n) { return n + (n === 1 ? " nacht" : " nachten"); },
      personsLabel: function (n) { return n + (n === 1 ? " persoon" : " personen"); },
      stayDefault: "Verblijf",
      perPersonPerDay: " p.p. per dag",
      fromPerPersonPerNight: function (bedrag) { return "vanaf " + bedrag + " p.p.p.n."; },
      chooseCalendarPeriod: "Kies een periode in de kalender",
      viewDatesFor: function (naam) { return "Bekijk de reisdata van " + naam; },
      viewTripPage: function (naam) { return "Bekijk de reispagina van " + naam; },
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
      none: "geen",
      totalEstimate: "Indicatie totaal: ",
      nameLabel: "Naam: ",
      emailLabel: "E-mail: ",
      phoneLabel: "Telefoon: ",
      remarksLabel: "Opmerkingen:"
    },
    en: {
      locale: "en-GB",
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      nightsLabel: function (n) { return n + (n === 1 ? " night" : " nights"); },
      personsLabel: function (n) { return n + (n === 1 ? " person" : " people"); },
      stayDefault: "Stay",
      perPersonPerDay: " pp/day",
      fromPerPersonPerNight: function (bedrag) { return "from " + bedrag + " pp/night"; },
      chooseCalendarPeriod: "Choose a period in the calendar",
      viewDatesFor: function (naam) { return "View travel dates for " + naam; },
      fixedDatesNote: "This trip has fixed departure dates. Mention in your message which period you have in mind, and Joey will let you know what's possible.",
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
      none: "none",
      totalEstimate: "Estimated total: ",
      nameLabel: "Name: ",
      emailLabel: "Email: ",
      phoneLabel: "Phone: ",
      remarksLabel: "Remarks:"
    },
    sv: {
      locale: "sv-SE",
      months: ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
      nightsLabel: function (n) { return n + (n === 1 ? " natt" : " nätter"); },
      personsLabel: function (n) { return n + (n === 1 ? " person" : " personer"); },
      stayDefault: "Boende",
      perPersonPerDay: " p.p./dag",
      fromPerPersonPerNight: function (bedrag) { return "från " + bedrag + " p.p./natt"; },
      chooseCalendarPeriod: "Välj en period i kalendern",
      viewDatesFor: function (naam) { return "Se resedatum för " + naam; },
      fixedDatesNote: "Den här resan har fasta avresedatum. Skriv i ditt meddelande vilken period du har i åtanke, så återkommer Joey med vad som är möjligt.",
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
      none: "inga",
      totalEstimate: "Uppskattad totalsumma: ",
      nameLabel: "Namn: ",
      emailLabel: "E-post: ",
      phoneLabel: "Telefon: ",
      remarksLabel: "Kommentarer:"
    },
    de: {
      locale: "de-DE",
      months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      nightsLabel: function (n) { return n + (n === 1 ? " Nacht" : " Nächte"); },
      personsLabel: function (n) { return n + (n === 1 ? " Person" : " Personen"); },
      stayDefault: "Aufenthalt",
      perPersonPerDay: " p.P./Tag",
      fromPerPersonPerNight: function (bedrag) { return "ab " + bedrag + " p.P./Nacht"; },
      chooseCalendarPeriod: "Wähle einen Zeitraum im Kalender",
      viewDatesFor: function (naam) { return "Reisedaten für " + naam + " ansehen"; },
      fixedDatesNote: "Diese Reise hat feste Abreisetermine. Schreib in deiner Nachricht, welchen Zeitraum du im Blick hast, dann lässt Joey dich wissen, was möglich ist.",
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
      none: "keine",
      totalEstimate: "Geschätzte Gesamtsumme: ",
      nameLabel: "Name: ",
      emailLabel: "E-Mail: ",
      phoneLabel: "Telefon: ",
      remarksLabel: "Anmerkungen:"
    },
    no: {
      locale: "nb-NO",
      months: ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"],
      nightsLabel: function (n) { return n + (n === 1 ? " natt" : " netter"); },
      personsLabel: function (n) { return n + (n === 1 ? " person" : " personer"); },
      stayDefault: "Opphold",
      perPersonPerDay: " pr. person/dag",
      fromPerPersonPerNight: function (bedrag) { return "fra " + bedrag + " pr. person/natt"; },
      chooseCalendarPeriod: "Velg en periode i kalenderen",
      viewDatesFor: function (naam) { return "Se reisedatoer for " + naam; },
      fixedDatesNote: "Denne reisen har faste avreisedatoer. Skriv i meldingen din hvilken periode du har i tankene, så gir Joey beskjed om hva som er mulig.",
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
      none: "ingen",
      totalEstimate: "Estimert totalt: ",
      nameLabel: "Navn: ",
      emailLabel: "E-post: ",
      phoneLabel: "Telefon: ",
      remarksLabel: "Merknader:"
    },
    fi: {
      locale: "fi-FI",
      months: ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"],
      nightsLabel: function (n) { return n + (n === 1 ? " yö" : " yötä"); },
      personsLabel: function (n) { return n + (n === 1 ? " henkilö" : " henkilöä"); },
      stayDefault: "Majoitus",
      perPersonPerDay: " hlö/vrk",
      fromPerPersonPerNight: function (bedrag) { return "alkaen " + bedrag + " hlö/yö"; },
      chooseCalendarPeriod: "Valitse ajanjakso kalenterista",
      viewDatesFor: function (naam) { return "Katso matkapäivät: " + naam; },
      fixedDatesNote: "Tällä matkalla on kiinteät lähtöpäivät. Kerro viestissäsi, mikä ajanjakso sinulla on mielessä, niin Joey kertoo mikä on mahdollista.",
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

  // Welke reis: staat in het webadres, anders de standaardreis
  var params = new URLSearchParams(window.location.search);
  var reisSleutel = (params.get("reis") || data.standaard || "").toLowerCase();
  var reis = (data.reizen || {})[reisSleutel];
  if (!reis) {
    reisSleutel = data.standaard;
    reis = (data.reizen || {})[reisSleutel];
  }
  if (!reis) return;

  var extras = reis.extras || [];
  var varianten = reis.varianten || [];
  var maxPersonen = reis.maxPersonen || 12;
  var minPersonen = reis.minimumPersonen || 1;
  var opslag = reis.opslagPerPersoonPerNacht || 0;

  function alsDatum(tekst) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tekst || "")) return null;
    var d = tekst.split("-");
    var datum = new Date(+d[0], +d[1] - 1, +d[2]);
    return isNaN(datum) ? null : datum;
  }
  function schrijfDatum(datum) {
    return datum.getDate() + " " + MAANDEN[datum.getMonth()] + " " + datum.getFullYear();
  }
  function euro(bedrag) {
    return "€" + bedrag.toLocaleString(T.locale);
  }

  /* --- Periode uit het webadres halen ---------------------------------- */
  var van = alsDatum(params.get("van"));
  var tot = alsDatum(params.get("tot"));
  var nachten = (van && tot && tot > van) ? Math.round((tot - van) / 86400000) : 0;
  if (!nachten) { van = null; tot = null; }

  var reisNaam = document.getElementById("reisNaam");
  if (reisNaam) reisNaam.textContent = reis.naam;

  // Reizen zonder vaste prijs/data (zoals Weissensee en Luleå) hebben geen
  // voorbeeldprijs en geen kalender- of reisdatapagina om naar terug te linken.
  var voorbeeld = document.getElementById("boekingVoorbeeld");
  if (voorbeeld && reis.prijsOpAanvraag) voorbeeld.hidden = true;

  var terugLink = document.getElementById("terugNaarReis");
  if (terugLink) {
    terugLink.href = reisSleutel + ".html" + (reis.periodeVrij ? "#prijzen" : "");
    terugLink.textContent = reis.prijsOpAanvraag
      ? T.viewTripPage(reis.naam.split(" —")[0])
      : reis.periodeVrij
        ? T.chooseCalendarPeriod
        : T.viewDatesFor(reis.naam.split(" —")[0]);
  }

  var periodeBox = document.getElementById("periodeBox");
  if (nachten) {
    periodeBox.innerHTML =
      '<p class="booking__period-dates">' + schrijfDatum(van) + ' – ' + schrijfDatum(tot) + '</p>' +
      '<p class="booking__period-nights">' + T.nightsLabel(nachten) + '</p>';
  } else if (reis.prijsOpAanvraag) {
    periodeBox.innerHTML =
      '<p class="booking__period-empty">' + T.priceOnRequestNote + '</p>';
  } else if (!reis.periodeVrij) {
    periodeBox.innerHTML =
      '<p class="booking__period-empty">' + T.fixedDatesNote + '</p>';
  }

  /* --- Aantal personen -------------------------------------------------- */
  var personenVeld = document.getElementById("personen");
  personenVeld.max = maxPersonen;
  personenVeld.min = minPersonen;
  if (parseInt(personenVeld.value, 10) < minPersonen) personenVeld.value = minPersonen;

  function personen() {
    var aantal = parseInt(personenVeld.value, 10);
    if (isNaN(aantal) || aantal < minPersonen) aantal = minPersonen;
    if (aantal > maxPersonen) aantal = maxPersonen;
    return aantal;
  }

  document.getElementById("minderPersonen").addEventListener("click", function () {
    personenVeld.value = Math.max(minPersonen, personen() - 1);
    ververs();
  });
  document.getElementById("meerPersonen").addEventListener("click", function () {
    personenVeld.value = Math.min(maxPersonen, personen() + 1);
    ververs();
  });
  personenVeld.addEventListener("input", ververs);

  /* --- Keuzevragen (vervoer, verzekering, eigen groep, materiaal) --------
     Elke vraag staat in het gegevensblokje van de reis. Een optie mag een
     prijs hebben; die telt dan per persoon mee in het totaal.
     ---------------------------------------------------------------------- */
  var vragen = reis.vragen || [];
  var vragenBox = document.getElementById("vragenBlokken");

  if (vragen.length && vragenBox) {
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
    vragenBox.addEventListener("change", ververs);
  }

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
  var variantBox = document.getElementById("variantBox");
  var variantBlok = document.getElementById("variantBlok");

  if (varianten.length && variantBox) {
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
    variantBox.addEventListener("change", ververs);
  } else if (variantBlok) {
    variantBlok.hidden = true;
  }

  /* --- Extra activiteiten ----------------------------------------------- */
  var extrasBox = document.getElementById("extrasBox");
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
    var piek = reis.hoogseizoen;
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
  var regelsBox = document.getElementById("overzichtRegels");
  var totaalBox = document.getElementById("totaalBedrag");
  var whatsappKnop = document.getElementById("whatsappKnop");

  function ververs() {
    var aantal = personen();
    var regels = [];
    var totaal = 0;

    var variant = huidigeVariant();

    if (nachten) {
      // Heeft de reis varianten, dan bepaalt de staffel de prijs; anders geldt
      // een vaste dagprijs.
      var perDag = (varianten.length ? staffelprijs(variant, nachten)
                                     : (reis.prijsPerPersoonPerDag || 0)) + opslag;
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

    gekozenExtras().forEach(function (extra) {
      var bedrag = extra.prijs * aantal;
      totaal += bedrag;
      regels.push({ naam: extra.naam + " × " + aantal, bedrag: bedrag });
    });

    regelsBox.innerHTML = "";
    if (!regels.length) {
      regelsBox.innerHTML = '<p class="booking__empty">' + T.chooseFirst + '</p>';
    }
    regels.forEach(function (regel) {
      var naam = document.createElement("dt");
      naam.textContent = regel.naam;
      var bedrag = document.createElement("dd");
      bedrag.textContent = euro(regel.bedrag);
      regelsBox.appendChild(naam);
      regelsBox.appendChild(bedrag);
    });

    totaalBox.textContent = nachten ? euro(totaal) : "—";
    whatsappKnop.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(bericht(totaal));
  }

  /* --- Het bericht dat verstuurd wordt ---------------------------------- */
  function bericht(totaal) {
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

    var lijst = gekozenExtras();
    regels.push(T.extraActivitiesLabel + (lijst.length
      ? lijst.map(function (e) { return e.naam; }).join(", ")
      : T.none));

    if (nachten) regels.push(T.totalEstimate + euro(totaal));

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
  var foutmelding = document.getElementById("formulierFout");

  formulier.addEventListener("submit", function (event) {
    event.preventDefault();

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
    if (!nachten && !reis.prijsOpAanvraag) {
      foutmelding.hidden = false;
      foutmelding.textContent = T.chooseFirst;
      return;
    }

    foutmelding.hidden = true;
    var totaal = totaalBox.textContent;
    window.location.href = "mailto:" + MAIL +
      "?subject=" + encodeURIComponent(T.requestFor(reis.naam)) +
      "&body=" + encodeURIComponent(bericht(totaal));
  });

  /* --- Onthouden wat er is ingevuld --------------------------------------
     Gaat iemand terug naar de kalender om de periode te wijzigen, dan staat
     alles bij terugkomst nog ingevuld. Het blijft in de browser van de
     bezoeker; er gaat niets naar buiten.
     ---------------------------------------------------------------------- */
  var SLEUTEL = "novakse-aanvraag-" + reisSleutel;
  var TEKSTVELDEN = ["naam", "email", "telefoon", "opmerkingen"];

  function bewaar() {
    var staat = { personen: personenVeld.value, keuzes: {}, extras: [], velden: {} };
    formulier.querySelectorAll('input[type="radio"]:checked').forEach(function (knop) {
      staat.keuzes[knop.name] = knop.value;
    });
    extrasBox.querySelectorAll('input[type="checkbox"]:checked').forEach(function (vak) {
      staat.extras.push(vak.value);
    });
    TEKSTVELDEN.forEach(function (id) {
      var veld = document.getElementById(id);
      if (veld) staat.velden[id] = veld.value;
    });
    try { window.sessionStorage.setItem(SLEUTEL, JSON.stringify(staat)); } catch (fout) { /* privémodus */ }
  }

  function herstel() {
    var ruw;
    try { ruw = window.sessionStorage.getItem(SLEUTEL); } catch (fout) { return; }
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
    Object.keys(staat.velden || {}).forEach(function (id) {
      var veld = document.getElementById(id);
      if (veld && staat.velden[id]) veld.value = staat.velden[id];
    });
  }

  TEKSTVELDEN.forEach(function (id) {
    var veld = document.getElementById(id);
    if (veld) veld.addEventListener("input", bewaar);
  });
  formulier.addEventListener("change", bewaar);

  // Stappen doorlopend nummeren; blokken die voor deze reis niet gelden,
  // vallen weg en mogen geen gat in de nummering achterlaten.
  var stapNr = 0;
  formulier.querySelectorAll(".booking__block").forEach(function (blok) {
    if (blok.hidden) return;
    var bolletje = blok.querySelector(".booking__step");
    if (!bolletje) return;
    stapNr++;
    bolletje.textContent = stapNr;
  });

  herstel();
  ververs();
})();
