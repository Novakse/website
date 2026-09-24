/* ==========================================================================
   Belafspraak inplannen

   De bezoeker kiest een dag, daarna een tijdstip, en vult tot slot zijn
   gegevens in. Het verzoek komt per e-mail bij Joey binnen; de bezoeker
   krijgt zelf een bevestiging.

   ALLES WAT JOEY BIJWERKT, STAAT IN data/belafspraak.json, niet in dit
   bestand: de beltijden per weekdag, de duur van een gesprek, hoe ver
   vooruit de kalender open staat en welke momenten al bezet zijn.

   De tijden in dat bestand zijn altijd Nederlandse tijd. Zit de bezoeker in
   een andere tijdzone, dan blijft er dus gewoon "19:00 (Nederlandse tijd)"
   staan; alleen de agenda-afspraak die je kunt downloaden rekent om naar het
   juiste moment.

   Gaat er iets mis, dan blijft de gewone tekst staan die er zonder
   JavaScript ook al is: bellen, appen of mailen.
   ========================================================================== */
(function () {
  "use strict";

  var doos = document.querySelector("[data-belafspraak]");
  if (!doos) return;

  var MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni",
    "juli", "augustus", "september", "oktober", "november", "december"];
  var DAGKOPPEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];
  var WEEKDAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

  var calEl = doos.querySelector("[data-plan-calendar]");
  var slotEl = doos.querySelector("[data-plan-slots]");
  var formEl = doos.querySelector("[data-plan-form]");
  var doneEl = doos.querySelector("[data-plan-done]");
  var fallbackEl = doos.querySelector(".plan__fallback");
  if (!calEl || !slotEl || !formEl) return;

  var config = null;
  var duurMin = 20;
  var vroegste = 0;   // tijdstip in ms: eerder mag niet meer
  var laatsteDag = null;
  var zichtbareMaand = null;  // Date op de 1e van de getoonde maand
  var gekozenDag = null;      // "JJJJ-MM-DD"
  var gekozenTijd = null;     // "UU:MM"

  /* ------------------------------------------------------------------
     Datums en tijden. De sleutels in het JSON-bestand zijn losse dagen
     zonder tijd, dus daar wordt met hele dagen gerekend.
     ------------------------------------------------------------------ */
  function alsTekst(datum) {
    var m = datum.getMonth() + 1;
    var d = datum.getDate();
    return datum.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
  }

  function alsDatum(tekst) {
    var d = String(tekst).split("-");
    return new Date(+d[0], +d[1] - 1, +d[2]);
  }

  function plusDagen(datum, aantal) {
    var nieuw = new Date(datum.getTime());
    nieuw.setDate(nieuw.getDate() + aantal);
    return nieuw;
  }

  /* Hoeveel loopt Nederland op dat moment voor op UTC? Zo blijft 19:00 ook
     19:00 voor een bezoeker die in een andere tijdzone zit, en klopt de
     zomer-/wintertijd vanzelf. */
  function nlVerschil(tijdstip) {
    var opmaak = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Amsterdam", hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
    var deel = {};
    opmaak.formatToParts(new Date(tijdstip)).forEach(function (p) { deel[p.type] = p.value; });
    var uur = +deel.hour === 24 ? 0 : +deel.hour;
    return Date.UTC(+deel.year, +deel.month - 1, +deel.day, uur, +deel.minute, +deel.second) - tijdstip;
  }

  // "2026-09-25" + "19:00" (Nederlandse tijd) -> het echte tijdstip in ms
  function tijdstipVan(datumTekst, tijdTekst) {
    var d = String(datumTekst).split("-");
    var t = String(tijdTekst).split(":");
    var gok = Date.UTC(+d[0], +d[1] - 1, +d[2], +t[0], +t[1]);
    var ms = gok - nlVerschil(gok);
    // Rond de overgang van zomer- naar wintertijd klopt de eerste schatting
    // niet; een tweede ronde zet dat recht.
    return gok - nlVerschil(ms);
  }

  function leesbareDag(datumTekst) {
    var d = alsDatum(datumTekst);
    return WEEKDAGEN[d.getDay()] + " " + d.getDate() + " " + MAANDEN[d.getMonth()];
  }

  /* ------------------------------------------------------------------
     Welke tijden staan er op een dag, en welke daarvan zijn nog vrij?

     Een moment dat al vergeven is blijft gewoon in de rij staan, maar dan
     grijs en niet aanklikbaar. Zo ziet de bezoeker in een oogopslag hoe vol
     de dag zit. Tijden die al te dichtbij zijn vallen wel helemaal weg: daar
     valt niets meer te kiezen.
     ------------------------------------------------------------------ */
  function tijdenOp(datumTekst) {
    if (config.gesloten.indexOf(datumTekst) !== -1) return [];

    var datum = alsDatum(datumTekst);
    if (datum < alsDatum(alsTekst(new Date()))) return [];
    if (datum > laatsteDag) return [];

    var tijden = (config.weekschema[WEEKDAGEN[datum.getDay()]] || []).slice();

    config.extra.forEach(function (moment) {
      var stuk = String(moment).split(" ");
      if (stuk[0] === datumTekst && stuk[1] && tijden.indexOf(stuk[1]) === -1) tijden.push(stuk[1]);
    });

    return tijden
      .filter(function (tijd) { return tijdstipVan(datumTekst, tijd) >= vroegste; })
      .sort()
      .map(function (tijd) {
        return { tijd: tijd, vrij: config.bezet.indexOf(datumTekst + " " + tijd) === -1 };
      });
  }

  function vrijeTijdenOp(datumTekst) {
    return tijdenOp(datumTekst).filter(function (plek) { return plek.vrij; });
  }

  function eersteVrijeDag() {
    var dag = new Date();
    for (var i = 0; i <= config.maxDagenVooruit; i++) {
      var tekst = alsTekst(plusDagen(dag, i));
      if (vrijeTijdenOp(tekst).length) return tekst;
    }
    return null;
  }

  /* ------------------------------------------------------------------
     De kalender tekenen
     ------------------------------------------------------------------ */
  function maandGrens(kant) {
    var grens = kant === "eerste" ? new Date() : laatsteDag;
    return new Date(grens.getFullYear(), grens.getMonth(), 1);
  }

  function tekenKalender() {
    calEl.textContent = "";

    var kop = document.createElement("div");
    kop.className = "plan__cal-head";

    var terug = document.createElement("button");
    terug.type = "button";
    terug.className = "plan__cal-nav";
    terug.innerHTML = '<span aria-hidden="true">&#8249;</span><span class="sr-only">Vorige maand</span>';
    terug.disabled = zichtbareMaand <= maandGrens("eerste");
    terug.addEventListener("click", function () { verschuifMaand(-1); });

    var titel = document.createElement("h3");
    titel.className = "plan__cal-title";
    titel.setAttribute("aria-live", "polite");
    titel.textContent = MAANDEN[zichtbareMaand.getMonth()] + " " + zichtbareMaand.getFullYear();

    var vooruit = document.createElement("button");
    vooruit.type = "button";
    vooruit.className = "plan__cal-nav";
    vooruit.innerHTML = '<span aria-hidden="true">&#8250;</span><span class="sr-only">Volgende maand</span>';
    vooruit.disabled = zichtbareMaand >= maandGrens("laatste");
    vooruit.addEventListener("click", function () { verschuifMaand(1); });

    kop.appendChild(terug);
    kop.appendChild(titel);
    kop.appendChild(vooruit);
    calEl.appendChild(kop);

    var raster = document.createElement("div");
    raster.className = "plan__grid";

    DAGKOPPEN.forEach(function (naam) {
      var cel = document.createElement("span");
      cel.className = "plan__dayname";
      cel.setAttribute("aria-hidden", "true");
      cel.textContent = naam;
      raster.appendChild(cel);
    });

    var eersteVanMaand = new Date(zichtbareMaand.getTime());
    var voorloop = (eersteVanMaand.getDay() + 6) % 7;  // maandag is de eerste kolom
    for (var leeg = 0; leeg < voorloop; leeg++) {
      var leegCel = document.createElement("span");
      leegCel.className = "plan__cell is-leeg";
      leegCel.setAttribute("aria-hidden", "true");
      raster.appendChild(leegCel);
    }

    var dagenInMaand = new Date(zichtbareMaand.getFullYear(), zichtbareMaand.getMonth() + 1, 0).getDate();
    for (var dag = 1; dag <= dagenInMaand; dag++) {
      var datumTekst = alsTekst(new Date(zichtbareMaand.getFullYear(), zichtbareMaand.getMonth(), dag));
      var aantal = vrijeTijdenOp(datumTekst).length;

      if (!aantal) {
        var dicht = document.createElement("span");
        dicht.className = "plan__cell is-dicht";
        dicht.textContent = dag;
        raster.appendChild(dicht);
        continue;
      }

      var knop = document.createElement("button");
      knop.type = "button";
      knop.className = "plan__cell is-vrij" + (datumTekst === gekozenDag ? " is-gekozen" : "");
      knop.textContent = dag;
      knop.setAttribute("data-datum", datumTekst);
      knop.setAttribute("aria-label", leesbareDag(datumTekst) + ", " + aantal +
        (aantal === 1 ? " tijdstip vrij" : " tijdstippen vrij"));
      if (datumTekst === gekozenDag) knop.setAttribute("aria-current", "date");
      knop.addEventListener("click", kiesDag);
      raster.appendChild(knop);
    }

    calEl.appendChild(raster);

    var uitleg = document.createElement("p");
    uitleg.className = "plan__cal-note";
    uitleg.textContent = "Alleen de gemarkeerde dagen zijn vrij. Alle tijden zijn Nederlandse tijd.";
    calEl.appendChild(uitleg);
  }

  function verschuifMaand(richting) {
    zichtbareMaand = new Date(zichtbareMaand.getFullYear(), zichtbareMaand.getMonth() + richting, 1);
    tekenKalender();
    var eersteVrij = calEl.querySelector(".plan__cell.is-vrij");
    if (eersteVrij) eersteVrij.focus();
  }

  /* ------------------------------------------------------------------
     Tijdstippen bij de gekozen dag
     ------------------------------------------------------------------ */
  function kiesDag(event) {
    gekozenDag = event.currentTarget.getAttribute("data-datum");
    gekozenTijd = null;
    tekenKalender();
    tekenTijden();
    verbergFormulier();
  }

  function tekenTijden() {
    slotEl.textContent = "";
    slotEl.hidden = false;

    var kop = document.createElement("h3");
    kop.className = "plan__slots-title";
    kop.textContent = "Hoe laat schikt het op " + leesbareDag(gekozenDag) + "?";
    slotEl.appendChild(kop);

    var rij = document.createElement("div");
    rij.className = "plan__times";

    tijdenOp(gekozenDag).forEach(function (plek) {
      var knop = document.createElement("button");
      knop.type = "button";
      knop.className = "plan__time" + (plek.vrij ? "" : " is-bezet");
      knop.textContent = plek.tijd;

      if (!plek.vrij) {
        knop.disabled = true;
        knop.setAttribute("aria-label", plek.tijd + " Nederlandse tijd, al bezet");
        rij.appendChild(knop);
        return;
      }

      knop.setAttribute("aria-label", plek.tijd + " Nederlandse tijd, " + duurMin + " minuten");
      knop.addEventListener("click", function () { kiesTijd(plek.tijd, knop); });
      rij.appendChild(knop);
    });

    slotEl.appendChild(rij);

    var bezetOpDezeDag = tijdenOp(gekozenDag).some(function (plek) { return !plek.vrij; });

    var note = document.createElement("p");
    note.className = "plan__slots-note";
    note.textContent = "Een gesprek duurt ongeveer " + duurMin + " minuten." +
      (bezetOpDezeDag ? " De grijze tijden zijn al bezet." : "");
    slotEl.appendChild(note);
  }

  function kiesTijd(tijd, knop) {
    gekozenTijd = tijd;
    slotEl.querySelectorAll(".plan__time:not(.is-bezet)").forEach(function (andere) {
      andere.classList.toggle("is-gekozen", andere === knop);
      andere.setAttribute("aria-pressed", andere === knop ? "true" : "false");
    });
    toonFormulier();
  }

  /* ------------------------------------------------------------------
     Het formulier
     ------------------------------------------------------------------ */
  function gekozenMomentTekst() {
    return leesbareDag(gekozenDag) + " om " + gekozenTijd + " (Nederlandse tijd)";
  }

  function toonFormulier() {
    var samenvatting = formEl.querySelector("[data-plan-chosen]");
    if (samenvatting) samenvatting.textContent = gekozenMomentTekst();
    formEl.hidden = false;
    var eersteVeld = formEl.querySelector("input, textarea, select");
    if (eersteVeld) eersteVeld.focus({ preventScroll: true });
    formEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function verbergFormulier() {
    formEl.hidden = true;
  }

  function bestandsnaamVeilig(tekst) {
    return tekst.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  }

  /* Een los agendabestand, zodat de afspraak meteen in de eigen agenda kan. */
  function agendaBestand(datumTekst, tijdTekst) {
    function alsIcsTijd(ms) {
      return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    }
    var start = tijdstipVan(datumTekst, tijdTekst);
    var eind = start + duurMin * 60 * 1000;
    var regels = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Novakse//Belafspraak//NL",
      "BEGIN:VEVENT",
      "UID:" + datumTekst + "-" + tijdTekst.replace(":", "") + "@novakse.com",
      "DTSTAMP:" + alsIcsTijd(Date.now()),
      "DTSTART:" + alsIcsTijd(start),
      "DTEND:" + alsIcsTijd(eind),
      "SUMMARY:Telefonisch overleg met Novakse",
      "DESCRIPTION:Joey belt je op het nummer dat je hebt doorgegeven.",
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    return new Blob([regels.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  }

  function toonBevestiging() {
    if (!doneEl) return;
    var moment = doneEl.querySelector("[data-plan-done-moment]");
    if (moment) moment.textContent = gekozenMomentTekst();

    var agendaLink = doneEl.querySelector("[data-plan-ics]");
    if (agendaLink && window.Blob && window.URL && URL.createObjectURL) {
      agendaLink.href = URL.createObjectURL(agendaBestand(gekozenDag, gekozenTijd));
      agendaLink.download = "belafspraak-novakse-" + bestandsnaamVeilig(gekozenDag + "-" + gekozenTijd) + ".ics";
      agendaLink.hidden = false;
    }

    calEl.hidden = true;
    slotEl.hidden = true;
    formEl.hidden = true;
    doneEl.hidden = false;
    doneEl.focus({ preventScroll: true });
    doneEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function koppelFormulier() {
    var knop = formEl.querySelector('button[type="submit"]');
    var foutEl = formEl.querySelector(".form-status--error");
    if (!knop) return;
    var knopTekst = knop.textContent;

    formEl.addEventListener("submit", function (event) {
      if (!formEl.checkValidity()) return;   // de browser toont zelf de melding
      event.preventDefault();
      if (!gekozenDag || !gekozenTijd) return;

      function veld(naam) {
        var el = formEl.querySelector('[name="' + naam + '"]');
        return el ? el.value.trim() : "";
      }

      if (foutEl) foutEl.hidden = true;
      knop.disabled = true;
      knop.textContent = knopTekst + "…";

      fetch("/api/belafspraak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datum: gekozenDag,
          datumTekst: leesbareDag(gekozenDag),
          tijd: gekozenTijd,
          duurMinuten: duurMin,
          naam: veld("naam"),
          telefoon: veld("telefoon"),
          email: veld("email"),
          onderwerp: veld("onderwerp"),
          toelichting: veld("toelichting"),
          website: veld("website")
        })
      })
        .then(function (respons) {
          return respons.json().then(function (data) { return { ok: respons.ok, data: data }; });
        })
        .then(function (resultaat) {
          if (!resultaat.ok) throw new Error("mislukt");
          knop.textContent = knopTekst;
          toonBevestiging();
        })
        .catch(function () {
          if (foutEl) foutEl.hidden = false;
          knop.disabled = false;
          knop.textContent = knopTekst;
        });
    });
  }

  /* ------------------------------------------------------------------
     Opstarten
     ------------------------------------------------------------------ */
  function start(data) {
    if (!data || !data.weekschema) return;

    config = {
      weekschema: data.weekschema,
      gesloten: data.gesloten || [],
      bezet: data.bezet || [],
      extra: data.extra || [],
      maxDagenVooruit: data.maxDagenVooruit || 42
    };
    duurMin = data.duurMinuten || 20;
    vroegste = Date.now() + (data.minUrenVooraf || 24) * 60 * 60 * 1000;
    laatsteDag = plusDagen(new Date(), config.maxDagenVooruit);

    var eerste = eersteVrijeDag();
    if (!eerste) return;   // niets vrij: de gewone tekst blijft staan

    zichtbareMaand = new Date(alsDatum(eerste).getFullYear(), alsDatum(eerste).getMonth(), 1);
    if (fallbackEl) fallbackEl.hidden = true;
    calEl.hidden = false;
    tekenKalender();
    koppelFormulier();
  }

  var bron = doos.getAttribute("data-belafspraak");
  if (!bron) return;
  fetch(bron)
    .then(function (respons) { return respons.json(); })
    .then(start)
    .catch(function () { /* de gewone tekst in de pagina blijft staan */ });
})();
