/* ==========================================================================
   Offerteaanvraag — één vraag per scherm (offerte.html)

   De inhoud van alle stappen staat in het JSON-blok in de pagina zelf; dit
   script rendert steeds één stap, houdt de antwoorden bij en laat het
   aanvraagdocument in de balk bovenin meegroeien. Versturen gaat via
   /api/send-aanvraag, dezelfde route als de andere formulieren.
   ========================================================================== */
(function () {
  "use strict";

  var databron = document.getElementById("offertedata");
  var speelveld = document.getElementById("oqStage");
  if (!databron || !speelveld) return;

  var data;
  try {
    data = JSON.parse(databron.textContent);
  } catch (fout) {
    return; // onjuiste JSON: de pagina blijft leeg in plaats van half te werken
  }

  var T = data.teksten || {};
  var BESTEMMINGEN = data.bestemmingen || [];
  var STAPPEN = data.stappen || [];
  var BEWAARSLEUTEL = "novakse-offerte";
  var EMAIL_PATROON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var chipsBox = document.getElementById("oqChips");
  var docPaneel = document.getElementById("oqDoc");
  var docKnop = document.getElementById("oqToggle");
  var docRegels = document.getElementById("oqLines");
  var docTeller = document.getElementById("oqCount");
  var docSom = document.getElementById("oqSum");
  var docSomBedrag = document.getElementById("oqSumValue");
  var voortgang = document.getElementById("oqProgress");
  var achtergrond = document.getElementById("oqBg");
  var bgAvif = document.getElementById("oqBgAvif");
  var bgWebp = document.getElementById("oqBgWebp");
  var bgImg = document.getElementById("oqBgImg");

  var antwoorden = {};
  var huidig = "start";
  var rustigeBeweging = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Kleine hulpjes ------------------------------------------------------ */
  function maak(tag, klasse, tekst) {
    var el = document.createElement(tag);
    if (klasse) el.className = klasse;
    if (tekst != null) el.textContent = tekst;
    return el;
  }

  function vinkje() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "11");
    svg.setAttribute("height", "9");
    svg.setAttribute("viewBox", "0 0 11 9");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var pad = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pad.setAttribute("d", "M1 4.6L4 7.6 10 1.4");
    pad.setAttribute("fill", "none");
    pad.setAttribute("stroke", "#050d08");
    pad.setAttribute("stroke-width", "1.8");
    pad.setAttribute("stroke-linecap", "round");
    pad.setAttribute("stroke-linejoin", "round");
    svg.appendChild(pad);
    return svg;
  }

  function pijl() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "15");
    svg.setAttribute("height", "10");
    svg.setAttribute("viewBox", "0 0 15 10");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var pad = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pad.setAttribute("d", "M0 5h13M9 1l4 4-4 4");
    pad.setAttribute("fill", "none");
    pad.setAttribute("stroke", "currentColor");
    pad.setAttribute("stroke-width", "1.6");
    pad.setAttribute("stroke-linecap", "round");
    pad.setAttribute("stroke-linejoin", "round");
    svg.appendChild(pad);
    return svg;
  }

  function euro(bedrag) {
    return "€" + String(bedrag);
  }

  function bestemmingVan(sleutel) {
    for (var i = 0; i < BESTEMMINGEN.length; i++) {
      if (BESTEMMINGEN[i].sleutel === sleutel) return BESTEMMINGEN[i];
    }
    return null;
  }

  function gekozenBestemming() {
    var keuze = antwoorden.bestemming;
    return keuze ? bestemmingVan(keuze.sleutel) : null;
  }

  /* Wisselt iemand van bestemming, dan kan een eerder antwoord daar niet meer
     kloppen: 10 dagen kan wel in Finland maar niet in Falun. Zo'n antwoord
     vervalt, zodat de bezoeker die vraag opnieuw krijgt. */
  function wisAntwoordenBuitenGrens(plek) {
    STAPPEN.forEach(function (stap) {
      if (!stap.grenzenUitBestemming) return;
      var antwoord = antwoorden[stap.sleutel];
      if (!antwoord || typeof antwoord.getal !== "number") return;

      var grenzen = (plek && plek[stap.grenzenUitBestemming]) || null;
      var min = (grenzen && grenzen.min) || stap.min || 1;
      var max = (grenzen && grenzen.max) || stap.max || 12;
      var meerLabel = grenzen && "meerLabel" in grenzen ? grenzen.meerLabel : stap.meerLabel;

      // 0 staat voor de "meer dan"-knop; die vervalt als hij er niet meer is.
      var ongeldig = antwoord.getal === 0 ? !meerLabel : (antwoord.getal < min || antwoord.getal > max);
      if (ongeldig) delete antwoorden[stap.sleutel];
    });
  }

  /* --- De route door de stappen -------------------------------------------
     Stappen die niet van toepassing zijn (extra's bij een bestemming zonder
     activiteiten) vallen vanzelf uit de route.
     ------------------------------------------------------------------------ */
  function route() {
    var plek = gekozenBestemming();
    var lijst = [{ sleutel: "start", soort: "start" }];
    STAPPEN.forEach(function (stap) {
      if (stap.soort === "extras") {
        if (!plek || !(plek.extras || []).length) return;
      }
      lijst.push(stap);
    });
    lijst.push({ sleutel: "bedankt", soort: "bedankt" });
    return lijst;
  }

  function stapVan(sleutel) {
    var lijst = route();
    for (var i = 0; i < lijst.length; i++) {
      if (lijst[i].sleutel === sleutel) return lijst[i];
    }
    return lijst[0];
  }

  function positie(sleutel) {
    var lijst = route();
    for (var i = 0; i < lijst.length; i++) {
      if (lijst[i].sleutel === sleutel) return i;
    }
    return 0;
  }

  function buur(richting) {
    var lijst = route();
    var i = positie(huidig) + richting;
    if (i < 0) i = 0;
    if (i > lijst.length - 1) i = lijst.length - 1;
    return lijst[i].sleutel;
  }

  /* --- Bewaren over een herlaadbeurt heen ---------------------------------- */
  function bewaar() {
    try {
      window.sessionStorage.setItem(BEWAARSLEUTEL, JSON.stringify(antwoorden));
    } catch (fout) { /* privémodus: dan niet bewaren */ }
  }

  function haalOp() {
    try {
      var rauw = window.sessionStorage.getItem(BEWAARSLEUTEL);
      if (rauw) antwoorden = JSON.parse(rauw) || {};
    } catch (fout) { antwoorden = {}; }
  }

  function wisBewaard() {
    try { window.sessionStorage.removeItem(BEWAARSLEUTEL); } catch (fout) { /* niets */ }
  }

  /* ==========================================================================
     Het document in de balk
     ========================================================================== */
  function beantwoordeStappen() {
    return route().filter(function (stap) {
      return stap.label && antwoorden[stap.sleutel];
    });
  }

  function extrasTotaal() {
    var keuze = antwoorden.extras;
    return keuze && keuze.prijs ? keuze.prijs : 0;
  }

  function verversDocument() {
    var gevuld = beantwoordeStappen();

    docTeller.textContent = String(gevuld.length);

    // Chips: het document in het klein, altijd in beeld.
    chipsBox.textContent = "";
    gevuld.forEach(function (stap) {
      var chip = maak("button", "oq-chip");
      chip.type = "button";
      chip.appendChild(maak("span", "oq-chip__label", stap.label));
      chip.appendChild(maak("span", null, antwoorden[stap.sleutel].kort || antwoorden[stap.sleutel].waarde));
      chip.setAttribute("aria-label", stap.label + ": " + antwoorden[stap.sleutel].waarde + ". Aanpassen.");
      chip.addEventListener("click", function () { ga(stap.sleutel, -1); });
      chipsBox.appendChild(chip);
    });
    chipsBox.scrollLeft = chipsBox.scrollWidth;

    // Het uitgeklapte document met alle regels.
    docRegels.textContent = "";
    if (!gevuld.length) {
      docRegels.appendChild(maak("p", "oq-doc__empty", "Je hebt nog niets gekozen. Zodra je antwoordt, verschijnt het hier."));
    }
    gevuld.forEach(function (stap) {
      var antwoord = antwoorden[stap.sleutel];
      var regel = maak("div", "oq-doc__line");
      regel.appendChild(maak("dt", "oq-doc__term", stap.label));
      var waarde = maak("dd", "oq-doc__value", antwoord.waarde);
      if (antwoord.onder) waarde.appendChild(maak("span", null, antwoord.onder));
      regel.appendChild(waarde);
      var wijzig = maak("button", "oq-doc__edit", "Aanpassen");
      wijzig.type = "button";
      wijzig.setAttribute("aria-label", stap.label + " aanpassen");
      wijzig.addEventListener("click", function () {
        sluitDocument();
        ga(stap.sleutel, -1);
      });
      regel.appendChild(wijzig);
      docRegels.appendChild(regel);
    });

    var totaal = extrasTotaal();
    docSom.hidden = totaal <= 0;
    docSomBedrag.textContent = totaal > 0 ? euro(totaal) : "-";

    // Voortgang: hoe ver je in de route bent.
    var lijst = route();
    var deel = Math.round((positie(huidig) / (lijst.length - 1)) * 100);
    voortgang.style.width = deel + "%";
    voortgang.setAttribute("aria-valuenow", String(deel));
  }

  function sluitDocument() {
    docPaneel.hidden = true;
    docKnop.setAttribute("aria-expanded", "false");
  }

  docKnop.addEventListener("click", function () {
    var open = docKnop.getAttribute("aria-expanded") === "true";
    docPaneel.hidden = open;
    docKnop.setAttribute("aria-expanded", open ? "false" : "true");
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && docKnop.getAttribute("aria-expanded") === "true") sluitDocument();
  });

  /* --- Achtergrondfoto volgt de bestemming --------------------------------- */
  function zetAchtergrond(basis, alt) {
    if (!basis) return;
    if (bgImg.getAttribute("data-basis") === basis) return;
    bgImg.setAttribute("data-basis", basis);
    achtergrond.classList.remove("is-ready");
    var nieuw = new Image();
    nieuw.onload = function () {
      bgAvif.srcset = "images/" + basis + ".avif";
      bgWebp.srcset = "images/" + basis + ".webp";
      bgImg.src = "images/" + basis + ".jpg";
      bgImg.alt = alt || "";
      achtergrond.classList.add("is-ready");
    };
    nieuw.onerror = function () { achtergrond.classList.add("is-ready"); };
    nieuw.src = "images/" + basis + ".jpg";
  }

  /* ==========================================================================
     Stap tekenen
     ========================================================================== */
  function kop(stap, nummer, totaal, onderAnders) {
    var head = maak("div", "oq-step__head");
    if (nummer) head.appendChild(maak("span", "oq-step__count", "Vraag " + nummer + " van " + totaal));
    var titel = maak("h1", "oq-step__title", stap.vraag);
    titel.tabIndex = -1;
    head.appendChild(titel);
    var onder = onderAnders || stap.onder;
    if (onder) head.appendChild(maak("p", "oq-step__sub", onder));
    return head;
  }

  function voet(opties) {
    var rij = maak("div", "oq-foot");
    if (opties.verder) rij.appendChild(opties.verder);
    if (opties.terug !== false) {
      var terug = maak("button", "oq-back", T.terugKnop || "Terug");
      terug.type = "button";
      terug.addEventListener("click", function () { ga(buur(-1), -1); });
      rij.appendChild(terug);
    }
    if (opties.overslaan) rij.appendChild(opties.overslaan);
    return rij;
  }

  function verderKnop(tekst) {
    var knop = maak("button", "oq-next");
    knop.type = "button";
    knop.appendChild(maak("span", null, tekst || T.verderKnop || "Verder"));
    knop.appendChild(pijl());
    return knop;
  }

  // Eén klik = antwoord opslaan en doorlopen. De korte pauze laat de
  // bezoeker zien dat de keuze is aangekomen.
  function bevestig(stap, antwoord, knop) {
    antwoorden[stap.sleutel] = antwoord;
    bewaar();
    if (knop) knop.classList.add("is-chosen");
    verversDocument();
    window.setTimeout(function () { ga(buur(1), 1); }, rustigeBeweging ? 60 : 320);
  }

  function tekenStart() {
    var blok = maak("div", "oq-intro");
    blok.appendChild(maak("p", "oq-intro__eyebrow", T.startEyebrow || "Offerte aanvragen"));
    var titel = maak("h1", "oq-intro__title", T.startTitel || "");
    titel.tabIndex = -1;
    blok.appendChild(titel);
    blok.appendChild(maak("p", "oq-intro__text", T.startTekst || ""));

    var punten = maak("ul", "oq-intro__points");
    (T.startPunten || []).forEach(function (punt) { punten.appendChild(maak("li", null, punt)); });
    blok.appendChild(punten);

    var knop = verderKnop(T.startKnop || "Beginnen");
    knop.addEventListener("click", function () { ga(buur(1), 1); });
    var rij = maak("div", "oq-foot");
    rij.appendChild(knop);
    var terug = maak("a", "oq-back", "Terug naar de reizen");
    terug.href = "reizen.html";
    rij.appendChild(terug);
    blok.appendChild(rij);
    return blok;
  }

  function tekenBestemming(stap, nummer, totaal) {
    var blok = maak("section", "oq-step-body");
    blok.appendChild(kop(stap, nummer, totaal));

    var rooster = maak("div", "oq-places");
    BESTEMMINGEN.forEach(function (plek) {
      var kaart = maak("button", "oq-place" + (plek.foto ? "" : " oq-place--plain"));
      kaart.type = "button";
      if (antwoorden.bestemming && antwoorden.bestemming.sleutel === plek.sleutel) kaart.classList.add("is-chosen");

      if (plek.foto) {
        var media = maak("div", "oq-place__media");
        var picture = document.createElement("picture");
        var avif = document.createElement("source");
        avif.type = "image/avif";
        avif.srcset = "images/" + plek.foto + "-480.avif 480w, images/" + plek.foto + "-800.avif 800w";
        avif.sizes = "(min-width: 48rem) 20rem, 100vw";
        var webp = document.createElement("source");
        webp.type = "image/webp";
        webp.srcset = "images/" + plek.foto + "-480.webp 480w, images/" + plek.foto + "-800.webp 800w";
        webp.sizes = "(min-width: 48rem) 20rem, 100vw";
        var img = document.createElement("img");
        img.src = "images/" + plek.foto + "-800.jpg";
        img.srcset = "images/" + plek.foto + "-480.jpg 480w, images/" + plek.foto + "-800.jpg 800w";
        img.sizes = "(min-width: 48rem) 20rem, 100vw";
        img.alt = "";
        img.loading = "lazy";
        img.width = 800;
        img.height = 600;
        picture.appendChild(avif);
        picture.appendChild(webp);
        picture.appendChild(img);
        media.appendChild(picture);
        kaart.appendChild(media);
      }

      kaart.appendChild(maak("span", "oq-place__region", plek.regio));
      kaart.appendChild(maak("span", "oq-place__name", plek.naam));
      if (plek.kort) kaart.appendChild(maak("span", "oq-place__note", plek.kort));

      kaart.addEventListener("click", function () {
        zetAchtergrond(plek.foto, plek.alt);
        // Extra's horen bij één bestemming: bij een andere keuze vervallen ze,
        // net als antwoorden die buiten de grenzen van de nieuwe reis vallen.
        if (!antwoorden.bestemming || antwoorden.bestemming.sleutel !== plek.sleutel) {
          delete antwoorden.extras;
          wisAntwoordenBuitenGrens(plek);
        }
        bevestig(stap, {
          sleutel: plek.sleutel,
          waarde: plek.naam + (plek.regio ? ", " + plek.regio : ""),
          kort: plek.naam
        }, kaart);
      });

      rooster.appendChild(kaart);
    });

    blok.appendChild(rooster);
    blok.appendChild(voet({ terug: true }));
    return blok;
  }

  function tekenAantal(stap, nummer, totaal) {
    var plek = gekozenBestemming();

    // Sommige bestemmingen hebben een eigen grens, bijvoorbeeld Falun met een
    // pakketreis van vast 4 of 5 dagen.
    var grenzen = (stap.grenzenUitBestemming && plek && plek[stap.grenzenUitBestemming]) || null;

    var blok = maak("section", "oq-step-body");
    blok.appendChild(kop(stap, nummer, totaal, grenzen && grenzen.onder));

    var enkel = stap.eenheid || "persoon";
    var meervoud = stap.eenheidMeervoud || "personen";
    var kortEenheid = stap.kortEenheid || meervoud;

    // Bij een huisje en een huurauto voor vier personen legt deze zin uit
    // waarom de prijs per vier weer een stap omhoog gaat.
    if (stap.perVierTekst && plek && plek.perVierPersonen) {
      blok.appendChild(maak("p", "oq-callout", stap.perVierTekst));
    }

    var rij = maak("div", "oq-numbers");
    var min = (grenzen && grenzen.min) || stap.min || 1;
    var max = (grenzen && grenzen.max) || stap.max || 12;
    var meerLabel = grenzen && "meerLabel" in grenzen ? grenzen.meerLabel : stap.meerLabel;
    var gekozen = antwoorden[stap.sleutel] ? antwoorden[stap.sleutel].getal : null;

    function tekstVoor(aantal) {
      return aantal + " " + (aantal === 1 ? enkel : meervoud);
    }

    for (var n = min; n <= max; n++) {
      (function (aantal) {
        var solo = aantal === 1 && stap.soloLabel;
        var knop = maak("button", "oq-number" + (solo ? " oq-number--wide" : ""), solo ? stap.soloLabel : String(aantal));
        knop.type = "button";
        knop.setAttribute("aria-label", tekstVoor(aantal));
        if (gekozen === aantal) knop.classList.add("is-chosen");
        knop.addEventListener("click", function () {
          bevestig(stap, {
            getal: aantal,
            waarde: tekstVoor(aantal),
            kort: aantal + " " + kortEenheid
          }, knop);
        });
        rij.appendChild(knop);
      })(n);
    }

    // Er is geen bovengrens: wie meer nodig heeft, kiest deze knop en Joey
    // vraagt het precieze aantal na.
    if (meerLabel) {
      var meer = maak("button", "oq-number oq-number--wide", meerLabel);
      meer.type = "button";
      if (gekozen === 0) meer.classList.add("is-chosen");
      meer.addEventListener("click", function () {
        bevestig(stap, { getal: 0, waarde: meerLabel, kort: meerLabel }, meer);
      });
      rij.appendChild(meer);
    }

    blok.appendChild(rij);
    blok.appendChild(voet({ terug: true }));
    return blok;
  }

  function tekenKeuze(stap, nummer, totaal) {
    var blok = maak("section", "oq-step-body");
    blok.appendChild(kop(stap, nummer, totaal));

    var opties = stap.opties || [];
    var rooster = maak("div", "oq-options" + (opties.length > 3 ? " oq-options--two" : ""));

    opties.forEach(function (optie) {
      var knop = maak("button", "oq-option");
      knop.type = "button";
      if (antwoorden[stap.sleutel] && antwoorden[stap.sleutel].waarde === optie.naam) knop.classList.add("is-chosen");

      var tick = maak("span", "oq-option__tick");
      tick.appendChild(vinkje());
      knop.appendChild(tick);

      var body = maak("span", "oq-option__body");
      body.appendChild(maak("span", "oq-option__name", optie.naam));
      if (optie.toelichting) body.appendChild(maak("span", "oq-option__note", optie.toelichting));
      knop.appendChild(body);

      knop.addEventListener("click", function () {
        bevestig(stap, { waarde: optie.naam, onder: optie.toelichting || "" }, knop);
      });
      rooster.appendChild(knop);
    });

    blok.appendChild(rooster);
    blok.appendChild(voet({ terug: true }));
    return blok;
  }

  function tekenExtras(stap, nummer, totaal) {
    var plek = gekozenBestemming();
    var lijst = plek ? (plek.extras || []) : [];
    var blok = maak("section", "oq-step-body");
    blok.appendChild(kop(stap, nummer, totaal));

    var bewaard = antwoorden[stap.sleutel];
    var gekozen = bewaard && bewaard.namen ? bewaard.namen.slice() : [];

    var rooster = maak("div", "oq-options");
    var knoppen = [];

    lijst.forEach(function (extra) {
      var knop = maak("button", "oq-option");
      knop.type = "button";
      knop.setAttribute("aria-pressed", gekozen.indexOf(extra.naam) !== -1 ? "true" : "false");

      var tick = maak("span", "oq-option__tick");
      tick.appendChild(vinkje());
      knop.appendChild(tick);

      var body = maak("span", "oq-option__body");
      body.appendChild(maak("span", "oq-option__name", extra.naam));
      if (extra.toelichting) body.appendChild(maak("span", "oq-option__note", extra.toelichting));
      knop.appendChild(body);
      knop.appendChild(maak("span", "oq-option__price", euro(extra.prijs)));

      knop.addEventListener("click", function () {
        var aan = knop.getAttribute("aria-pressed") === "true";
        knop.setAttribute("aria-pressed", aan ? "false" : "true");
        var plaats = gekozen.indexOf(extra.naam);
        if (aan && plaats !== -1) gekozen.splice(plaats, 1);
        if (!aan && plaats === -1) gekozen.push(extra.naam);
        werkExtrasBij();
      });

      knoppen.push(knop);
      rooster.appendChild(knop);
    });

    blok.appendChild(rooster);

    var tussenstand = maak("p", "oq-hint");
    blok.appendChild(tussenstand);

    function prijsVan(namen) {
      return lijst.reduce(function (som, extra) {
        return som + (namen.indexOf(extra.naam) !== -1 ? (extra.prijs || 0) : 0);
      }, 0);
    }

    function werkExtrasBij() {
      var prijs = prijsVan(gekozen);
      tussenstand.textContent = gekozen.length
        ? gekozen.length + (gekozen.length === 1 ? " activiteit gekozen - " : " activiteiten gekozen - ") + euro(prijs) + " per persoon"
        : "Nog niets gekozen.";
      antwoorden[stap.sleutel] = gekozen.length
        ? { namen: gekozen.slice(), waarde: gekozen.join(", "), onder: euro(prijs) + " per persoon", kort: gekozen.length + "×", prijs: prijs }
        : null;
      if (!antwoorden[stap.sleutel]) delete antwoorden[stap.sleutel];
      bewaar();
      verversDocument();
    }
    werkExtrasBij();

    var verder = verderKnop();
    verder.addEventListener("click", function () { ga(buur(1), 1); });

    var geen = maak("button", "oq-skip", stap.leegLabel || "Overslaan");
    geen.type = "button";
    geen.addEventListener("click", function () {
      gekozen = [];
      knoppen.forEach(function (knop) { knop.setAttribute("aria-pressed", "false"); });
      werkExtrasBij();
      ga(buur(1), 1);
    });

    blok.appendChild(voet({ verder: verder, terug: true, overslaan: geen }));
    return blok;
  }

  function tekenTekst(stap, nummer, totaal) {
    var blok = maak("section", "oq-step-body");
    blok.appendChild(kop(stap, nummer, totaal));

    var veld = maak("label", "oq-field");
    veld.appendChild(maak("span", null, stap.label));
    var invoer = document.createElement("textarea");
    invoer.rows = 5;
    invoer.placeholder = stap.placeholder || "";
    invoer.value = antwoorden[stap.sleutel] ? antwoorden[stap.sleutel].waarde : "";
    veld.appendChild(invoer);
    blok.appendChild(veld);

    function opslaan() {
      var tekst = invoer.value.trim();
      if (tekst) {
        antwoorden[stap.sleutel] = { waarde: tekst, kort: "Toegevoegd" };
      } else {
        delete antwoorden[stap.sleutel];
      }
      bewaar();
      verversDocument();
    }

    invoer.addEventListener("input", opslaan);

    var verder = verderKnop();
    verder.addEventListener("click", function () { opslaan(); ga(buur(1), 1); });

    var over = maak("button", "oq-skip", "Overslaan");
    over.type = "button";
    over.addEventListener("click", function () {
      invoer.value = "";
      opslaan();
      ga(buur(1), 1);
    });

    blok.appendChild(voet({ verder: verder, terug: true, overslaan: stap.overslaan ? over : null }));
    return blok;
  }

  function tekenGegevens(stap, nummer, totaal) {
    var blok = maak("section", "oq-step-body");
    blok.appendChild(kop(stap, nummer, totaal));

    // Een echt formulier: zo werken automatisch invullen en de entertoets.
    var formulier = document.createElement("form");
    formulier.noValidate = true;

    var bewaardeGegevens = antwoorden[stap.sleutel] ? antwoorden[stap.sleutel].velden : {};
    var velden = {};
    var rooster = maak("div", "oq-grid");

    [
      { naam: "voornaam", label: "Voornaam", type: "text", autocomplete: "given-name" },
      { naam: "achternaam", label: "Achternaam", type: "text", autocomplete: "family-name" },
      { naam: "email", label: "E-mailadres", type: "email", autocomplete: "email", breed: true },
      { naam: "telefoon", label: "Telefoon (mag leeg blijven)", type: "tel", autocomplete: "tel", breed: true }
    ].forEach(function (opzet) {
      var veld = maak("label", "oq-field" + (opzet.breed ? " oq-field--wide" : ""));
      veld.appendChild(maak("span", null, opzet.label));
      var invoer = document.createElement("input");
      invoer.type = opzet.type;
      invoer.name = opzet.naam;
      invoer.autocomplete = opzet.autocomplete;
      invoer.value = (bewaardeGegevens && bewaardeGegevens[opzet.naam]) || "";
      veld.appendChild(invoer);
      velden[opzet.naam] = invoer;
      rooster.appendChild(veld);
    });

    formulier.appendChild(rooster);

    // Honeypot: onzichtbaar voor bezoekers, bots vullen hem wel in.
    var lokveld = maak("div", "hp-field");
    lokveld.setAttribute("aria-hidden", "true");
    var lok = document.createElement("input");
    lok.type = "text";
    lok.name = "website";
    lok.tabIndex = -1;
    lok.autocomplete = "off";
    lokveld.appendChild(lok);
    formulier.appendChild(lokveld);

    var melding = maak("p", "oq-error");
    melding.setAttribute("role", "alert");
    melding.hidden = true;
    formulier.appendChild(melding);

    var kleineLetters = maak("p", "oq-hint", "Je gegevens gaan rechtstreeks naar Joey en worden niet voor iets anders gebruikt. Zie de ");
    var privacy = maak("a", null, "privacyverklaring");
    privacy.href = "privacyverklaring.html";
    privacy.style.textDecoration = "underline";
    kleineLetters.appendChild(privacy);
    kleineLetters.appendChild(document.createTextNode("."));
    formulier.appendChild(kleineLetters);

    var verstuur = verderKnop(T.verstuurKnop || "Aanvraag versturen");
    verstuur.type = "submit";

    formulier.addEventListener("submit", function (gebeurtenis) {
      gebeurtenis.preventDefault();
      var voornaam = velden.voornaam.value.trim();
      var email = velden.email.value.trim();

      if (!voornaam) {
        melding.textContent = "Vul je voornaam in, dan weet Joey wie hij terugmailt.";
        melding.hidden = false;
        velden.voornaam.focus();
        return;
      }
      if (!EMAIL_PATROON.test(email)) {
        melding.textContent = "Vul een geldig e-mailadres in, anders komt de offerte niet aan.";
        melding.hidden = false;
        velden.email.focus();
        return;
      }

      melding.hidden = true;
      antwoorden[stap.sleutel] = {
        velden: {
          voornaam: voornaam,
          achternaam: velden.achternaam.value.trim(),
          email: email,
          telefoon: velden.telefoon.value.trim()
        },
        waarde: [voornaam, velden.achternaam.value.trim()].filter(Boolean).join(" ") + " - " + email,
        kort: voornaam
      };
      bewaar();
      verversDocument();
      verstuurAanvraag(verstuur, melding, lok.value);
    });

    formulier.appendChild(voet({ verder: verstuur, terug: true }));
    blok.appendChild(formulier);
    return blok;
  }

  function tekenBedankt() {
    var blok = maak("section", "oq-done");
    var merk = maak("div", "oq-done__mark");
    merk.appendChild(vinkje());
    blok.appendChild(merk);

    var titel = maak("h1", "oq-intro__title", T.dankTitel || "Verstuurd");
    titel.tabIndex = -1;
    blok.appendChild(titel);
    blok.appendChild(maak("p", "oq-intro__text", T.dankTekst || ""));

    var links = maak("div", "oq-done__links");
    var appje = maak("a", "oq-done__link", "Stuur een appje");
    appje.href = "https://wa.me/31617467643";
    appje.target = "_blank";
    appje.rel = "noopener";
    links.appendChild(appje);

    var bellen = maak("a", "oq-done__link", "+31 6 17467643");
    bellen.href = "tel:+31617467643";
    links.appendChild(bellen);

    var reizen = maak("a", "oq-done__link", "Terug naar de reizen");
    reizen.href = "reizen.html";
    links.appendChild(reizen);

    blok.appendChild(links);
    return blok;
  }

  /* ==========================================================================
     Versturen
     ========================================================================== */
  function berichtTekst() {
    var regels = [];
    route().forEach(function (stap) {
      if (!stap.label) return;
      var antwoord = antwoorden[stap.sleutel];
      if (!antwoord) return;
      if (stap.soort === "gegevens") {
        var v = antwoord.velden || {};
        regels.push("Naam: " + [v.voornaam, v.achternaam].filter(Boolean).join(" "));
        regels.push("E-mail: " + v.email);
        if (v.telefoon) regels.push("Telefoon: " + v.telefoon);
        return;
      }
      regels.push(stap.label + ": " + antwoord.waarde + (antwoord.onder ? " (" + antwoord.onder + ")" : ""));
    });
    regels.push("");
    regels.push("Verstuurd via de offertepagina op novakse.com.");
    return regels.join("\n");
  }

  function verstuurAanvraag(knop, melding, lokwaarde) {
    var gegevens = antwoorden.gegevens ? antwoorden.gegevens.velden : {};
    var naam = [gegevens.voornaam, gegevens.achternaam].filter(Boolean).join(" ");
    var plek = gekozenBestemming();

    knop.disabled = true;
    knop.firstChild.textContent = (T.verstuurKnop || "Aanvraag versturen") + "…";

    fetch("/api/send-aanvraag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onderwerp: "Offerteaanvraag" + (plek ? " " + plek.naam : "") + (naam ? " - " + naam : ""),
        bericht: berichtTekst(),
        email: gegevens.email,
        website: lokwaarde || ""
      })
    })
      .then(function (respons) {
        return respons.json().then(function (data) { return { ok: respons.ok, data: data }; });
      })
      .then(function (resultaat) {
        if (!resultaat.ok) throw new Error("mislukt");
        wisBewaard();
        ga("bedankt", 1);
      })
      .catch(function () {
        melding.textContent = T.foutTekst || "Het versturen lukte niet.";
        melding.hidden = false;
        knop.disabled = false;
        knop.firstChild.textContent = T.verstuurKnop || "Aanvraag versturen";
      });
  }

  /* ==========================================================================
     Navigeren tussen stappen
     ========================================================================== */
  function teken(sleutel) {
    var stap = stapVan(sleutel);
    var lijst = route();
    var vragen = lijst.filter(function (s) { return s.label; });
    var nummer = 0;
    vragen.forEach(function (s, i) { if (s.sleutel === stap.sleutel) nummer = i + 1; });

    var blok;
    if (stap.soort === "start") blok = tekenStart();
    else if (stap.soort === "bedankt") blok = tekenBedankt();
    else if (stap.soort === "bestemming") blok = tekenBestemming(stap, nummer, vragen.length);
    else if (stap.soort === "aantal") blok = tekenAantal(stap, nummer, vragen.length);
    else if (stap.soort === "extras") blok = tekenExtras(stap, nummer, vragen.length);
    else if (stap.soort === "tekst") blok = tekenTekst(stap, nummer, vragen.length);
    else if (stap.soort === "gegevens") blok = tekenGegevens(stap, nummer, vragen.length);
    else blok = tekenKeuze(stap, nummer, vragen.length);

    blok.classList.add("oq-step");
    return blok;
  }

  function ga(sleutel, richting) {
    if (sleutel === huidig) return;
    var oud = speelveld.firstElementChild;
    huidig = sleutel;

    function zetNeer() {
      speelveld.textContent = "";
      var nieuw = teken(sleutel);
      if (richting < 0) nieuw.classList.add("is-back");
      speelveld.appendChild(nieuw);
      verversDocument();
      onthoudInAdres();
      window.scrollTo({ top: 0, behavior: rustigeBeweging ? "auto" : "smooth" });
      var kop = nieuw.querySelector("[tabindex='-1']");
      if (kop) {
        try { kop.focus({ preventScroll: true }); } catch (fout) { kop.focus(); }
      }
    }

    if (oud && !rustigeBeweging) {
      oud.classList.add("is-leaving");
      window.setTimeout(zetNeer, 200);
    } else {
      zetNeer();
    }
  }

  function onthoudInAdres() {
    if (!window.history || !window.history.pushState) return;
    var adres = window.location.pathname + (huidig === "start" ? "" : "?stap=" + huidig);
    try {
      if (window.history.state && window.history.state.stap === huidig) return;
      // De eerste stap vervangt de bestaande regel in de geschiedenis, zodat
      // "terug" in de browser meteen de vorige pagina is en geen lege stap.
      if (!window.history.state) window.history.replaceState({ stap: huidig }, "", adres);
      else window.history.pushState({ stap: huidig }, "", adres);
    } catch (fout) { /* oudere browser */ }
  }

  window.addEventListener("popstate", function (gebeurtenis) {
    var sleutel = (gebeurtenis.state && gebeurtenis.state.stap) || "start";
    if (sleutel === huidig) return;
    var richting = positie(sleutel) < positie(huidig) ? -1 : 1;
    huidig = null;
    ga(sleutel, richting);
  });

  /* --- Opstarten ----------------------------------------------------------- */
  haalOp();

  var params = new URLSearchParams(window.location.search);
  var start = params.get("stap") || "start";
  if (start === "bedankt") start = "start"; // nooit op het slotscherm binnenkomen
  // Wie een gedeelde link midden in de route opent en nog niets heeft
  // ingevuld, begint gewoon vooraan. Na een herlaadbeurt staan de antwoorden
  // nog in sessionStorage en blijft de stap wel staan.
  if (!Object.keys(antwoorden).length) start = "start";

  // Komt iemand binnen met een bestemming in het webadres (bijvoorbeeld vanaf
  // een reispagina), dan staat die keuze meteen goed.
  var reisUitAdres = (params.get("reis") || "").toLowerCase();
  var plekUitAdres = bestemmingVan(reisUitAdres);
  if (plekUitAdres) {
    antwoorden.bestemming = {
      sleutel: plekUitAdres.sleutel,
      waarde: plekUitAdres.naam + (plekUitAdres.regio ? ", " + plekUitAdres.regio : ""),
      kort: plekUitAdres.naam
    };
    bewaar();
  }

  var beginPlek = gekozenBestemming();
  if (beginPlek && beginPlek.foto) zetAchtergrond(beginPlek.foto, beginPlek.alt);
  else achtergrond.classList.add("is-ready");

  huidig = null;
  ga(stapVan(start).sleutel, 1);
})();
