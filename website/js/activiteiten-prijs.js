/* ==========================================================================
   Optional activities at checkout (Falun, Wellness and the group trips):
   price calculation.

   The single source of truth for what the extra activities cost. The same
   file runs in two places:
   - in the browser (window.NovakseActiviteiten) on uitchecken.html, so the
     page shows the price live;
   - on the server (require("../js/activiteiten-prijs.js") in
     api/create-payment.js), which recomputes it before creating the Stripe
     session.
   Both read the same data/activiteiten.json, so what is on screen is exactly
   what is charged.

   Layout of the data: <reis>.activiteiten is one flat list of activities.
   A trip may instead be an alias, <reis>: { "gelijkAan": "falun" }: it then
   uses that trip's activities and prices (the group trips use Falun's). Only
   one step: the target must have its own list.
   Each activity has
     tarieven  the price lines of the activity itself (for example one per
               age group). One tariff without a name uses the activity's
               name. An empty list means the activity itself is free.
     huur      optional rental lines that belong to this activity ("Spullen
               huren" on the page). Rental only counts together with the
               activity: when the activity has tariffs, it must book at least
               as many persons as the rental equips (huurPersonen), otherwise
               bereken() refuses the choice. aanvullen() raises the standaard
               tariff so the page sends that count.
   A line is { id, naam?, detail?, eenheid, eur, limiet?, standaard? }.

   Every line has a fixed "eur" amount: the customer price per unit in whole
   euros, written by scripts/build-activity-prices.js from a private price
   file that is not part of the repo or the site. It is turned into cents
   once with Math.round(eur * 100); after that only whole cents are used.
   There is no currency conversion at runtime.

   A line may name a "limiet" (string) or several (array of strings): lines
   that share a limit may together not exceed the highest max() among them.
   A ski package counts for skis, boots and helmet at once.

   API (cat = parsed data/activiteiten.json, reis = "falun" | "wellness" |
   "groepsreis-orsa" | "groepsreis-falun")
     activiteiten(cat, reis) -> the activities of that trip ([] if unknown)
     lijnen(cat, reis)       -> flat list of all price lines (copies), in
                                page order (per activity: tariffs, then
                                rentals), each with added activiteit (id),
                                activiteitNaam, huur (true for a rental),
                                naam (own name, or the activity's) and titel
                                ("<activity> - <line>", or just the activity)
     eenheidTekst(eenheid)   -> "per persoon per dag" | "per persoon" |
                                "per scooter" ("" if unknown)
     max(regel, ctx)         -> highest quantity for one line, ctx =
                                { personen, dagen }: persoonDag gives
                                personen * dagen, persoon and scooter give
                                personen
     centen(regel)           -> price of one unit in whole cents (0 if invalid)
     limietNamen(regel)      -> the shared limit names of a line
     standaardTarief(act)    -> the tariff marked standaard, else the first
                                (null when the activity has no tariffs)
     huurPersonen(act, keuze)-> how many people the chosen rentals of one
                                activity equip: the highest sum over lines
                                that share a limit (a line without a limit
                                counts on its own)
     bereken(cat, reis, keuze, ctx)
                             -> keuze = { id: aantal }. Returns
                                { regels: [{ id, activiteit, activiteitNaam,
                                  huur, naam, detail, titel, productNaam,
                                  eenheidTekst, aantal, centenPerStuk,
                                  centen }], totaalCenten, samenvatting }
                                or { fout: "Dutch message" }. Lines follow the
                                order of the JSON; quantities of 0 are left
                                out. An empty or missing keuze gives
                                { regels: [], totaalCenten: 0,
                                  samenvatting: "" }.
     naarQuery(keuze)        -> "id:2,id2:1" (zeros left out, "" if none)
     uitQuery(tekst)         -> { id: n }, tolerant: junk is ignored
     euro(centen)            -> "€1.234,56", the format of js/uitchecken.js
   ========================================================================== */
(function (factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.NovakseActiviteiten = api;
  }
})(function () {
  "use strict";

  var REIZEN = ["falun", "wellness", "groepsreis-orsa", "groepsreis-falun"];
  var MAX_SLEUTELS = 40; // most activity ids one choice may name
  var ID_PATROON = /^[a-z0-9-]{1,40}$/;
  var EENHEID_TEKST = {
    persoonDag: "per persoon per dag",
    persoon: "per persoon",
    scooter: "per scooter"
  };

  function heeft(object, sleutel) {
    return Object.prototype.hasOwnProperty.call(object, sleutel);
  }

  // A key from REIZEN (any case), otherwise "".
  function reisSleutel(reis) {
    var sleutel = String(reis === undefined || reis === null ? "" : reis).toLowerCase();
    return REIZEN.indexOf(sleutel) === -1 ? "" : sleutel;
  }

  // The part of the catalogue with the trip's own list. An alias
  // ({ gelijkAan: "falun" }) resolves to its target, one step only, and only
  // to a whitelisted trip that is not an alias itself; anything else is null.
  function deelVan(cat, sleutel) {
    if (!sleutel || !cat || typeof cat !== "object" || !heeft(cat, sleutel)) return null;
    var deel = cat[sleutel];
    if (deel && typeof deel === "object" && heeft(deel, "gelijkAan")) {
      var doel = reisSleutel(deel.gelijkAan);
      if (!doel || doel === sleutel || !heeft(cat, doel)) return null;
      deel = cat[doel];
      if (deel && typeof deel === "object" && heeft(deel, "gelijkAan")) return null;
    }
    return deel && typeof deel === "object" && Array.isArray(deel.activiteiten) ? deel : null;
  }

  function activiteiten(cat, reis) {
    var deel = deelVan(cat, reisSleutel(reis));
    if (!deel) return [];
    return deel.activiteiten.filter(function (act) {
      return act && typeof act === "object" && typeof act.id === "string";
    });
  }

  function lijst(waarde) {
    return Array.isArray(waarde) ? waarde.filter(function (regel) {
      return regel && typeof regel === "object" && typeof regel.id === "string";
    }) : [];
  }

  function tarieven(act) { return lijst(act && act.tarieven); }
  function huurRegels(act) { return lijst(act && act.huur); }

  // A copy of one price line with its activity attached.
  function kopie(regel, act, isHuur) {
    var uit = {};
    Object.keys(regel).forEach(function (veld) { uit[veld] = regel[veld]; });
    var eigenNaam = typeof regel.naam === "string" && regel.naam ? regel.naam : "";
    uit.activiteit = act.id;
    uit.activiteitNaam = act.naam;
    uit.huur = isHuur;
    uit.naam = eigenNaam || act.naam;
    uit.titel = eigenNaam ? act.naam + " - " + eigenNaam : act.naam;
    return uit;
  }

  function lijnen(cat, reis) {
    var uit = [];
    activiteiten(cat, reis).forEach(function (act) {
      tarieven(act).forEach(function (regel) { uit.push(kopie(regel, act, false)); });
      huurRegels(act).forEach(function (regel) { uit.push(kopie(regel, act, true)); });
    });
    return uit;
  }

  function eenheidTekst(eenheid) {
    return typeof eenheid === "string" && heeft(EENHEID_TEKST, eenheid) ? EENHEID_TEKST[eenheid] : "";
  }

  // Head count / days from ctx: a whole number >= 0, anything else is 0.
  function telling(waarde) {
    var n = typeof waarde === "number" ? waarde
      : typeof waarde === "string" && /^\d{1,4}$/.test(waarde.trim()) ? parseInt(waarde, 10) : NaN;
    return isFinite(n) && n >= 0 && Math.floor(n) === n ? n : 0;
  }

  function max(regel, ctx) {
    ctx = ctx || {};
    var personen = telling(ctx.personen);
    var dagen = telling(ctx.dagen);
    var eenheid = regel && regel.eenheid;
    if (eenheid === "persoonDag") return personen * dagen;
    if (eenheid === "persoon" || eenheid === "scooter") return personen;
    return 0;
  }

  // Quantity from a choice: a whole number, or a string of digits. null for
  // anything else ("2.5", "2a", true, NaN). Negative numbers stay negative so
  // the caller can refuse them.
  function aantalUit(waarde) {
    if (typeof waarde === "number") {
      return isFinite(waarde) && Math.floor(waarde) === waarde && Math.abs(waarde) <= 1e6 ? waarde : null;
    }
    if (typeof waarde === "string" && /^\d{1,6}$/.test(waarde.trim())) return parseInt(waarde, 10);
    return null;
  }

  // Euro amount from the JSON -> whole cents; 0 for anything not positive.
  function centen(regel) {
    var eur = regel && regel.eur;
    if (typeof eur !== "number" || !isFinite(eur) || eur <= 0) return 0;
    return Math.round(eur * 100);
  }

  // The shared limits of a line: "limiet" as one string or an array of
  // strings; anything else is ignored. Each name counts once.
  function limietNamen(regel) {
    var waarde = regel && regel.limiet;
    var namen = Array.isArray(waarde) ? waarde : [waarde];
    return namen.filter(function (naam, index) {
      return typeof naam === "string" && naam !== "" && namen.indexOf(naam) === index;
    });
  }

  function standaardTarief(act) {
    var alle = tarieven(act);
    for (var i = 0; i < alle.length; i++) {
      if (alle[i].standaard === true) return alle[i];
    }
    return alle[0] || null;
  }

  // Quantity of one id in a choice, 0 for anything not a positive number.
  function gekozen(keuze, id) {
    var n = keuze && heeft(keuze, id) ? aantalUit(keuze[id]) : 0;
    return n > 0 ? n : 0;
  }

  function huurPersonen(act, keuze) {
    var sommen = Object.create(null);
    var hoogste = 0;
    huurRegels(act).forEach(function (regel) {
      var aantal = gekozen(keuze, regel.id);
      if (!aantal) return;
      var namen = limietNamen(regel);
      if (!namen.length) namen = ["#" + regel.id];
      namen.forEach(function (naam) {
        sommen[naam] = (sommen[naam] || 0) + aantal;
        if (sommen[naam] > hoogste) hoogste = sommen[naam];
      });
    });
    return hoogste;
  }

  // How many people the chosen tariffs of one activity book (sum of its
  // tariff quantities, in the same units as the rentals).
  function activiteitPersonen(act, keuze) {
    return tarieven(act).reduce(function (som, regel) {
      return som + gekozen(keuze, regel.id);
    }, 0);
  }

  /* The choice as the page sends it: when rental needs more people than the
     activity has, the standaard tariff goes up by the difference, so the
     activity row shows the same number of persons. Lines already chosen are
     never lowered. Does not check the caps; bereken() does. */
  function aanvullen(cat, reis, keuze, ctx) {
    var uit = Object.create(null);
    Object.keys(keuze || {}).forEach(function (id) { uit[id] = keuze[id]; });
    activiteiten(cat, reis).forEach(function (act) {
      if (!tarieven(act).length || !huurRegels(act).length) return;
      var gehuurd = huurPersonen(act, uit);
      var geboekt = activiteitPersonen(act, uit);
      var standaard = standaardTarief(act);
      if (!standaard || gehuurd <= geboekt) return;
      uit[standaard.id] = gekozen(uit, standaard.id) + (gehuurd - geboekt);
    });
    return uit;
  }

  // "Ski-pakket Beginner" or "Huskytocht met lunch": the name of the line.
  function leesbareNaam(regel) {
    return regel.huur ? regel.naam : regel.titel;
  }

  function productNaam(regel) {
    return (regel.huur ? "Huur: " : "Activiteit: ") + regel.titel + " (" + eenheidTekst(regel.eenheid) + ")";
  }

  function leeg() {
    return { regels: [], totaalCenten: 0, samenvatting: "" };
  }

  function bereken(cat, reis, keuze, ctx) {
    if (keuze === undefined || keuze === null) return leeg();
    if (typeof keuze !== "object" || Array.isArray(keuze)) {
      return { fout: "Ongeldige keuze voor de activiteiten." };
    }
    var sleutels = Object.keys(keuze);
    if (!sleutels.length) return leeg();
    if (sleutels.length > MAX_SLEUTELS) return { fout: "Te veel activiteiten gekozen." };

    var alle = lijnen(cat, reis);
    if (!alle.length) return { fout: "Bij deze reis zijn geen activiteiten te boeken." };

    var perId = Object.create(null);
    alle.forEach(function (regel) { perId[regel.id] = regel; });

    // Every named line must exist and have a valid quantity within its max.
    var aantallen = Object.create(null);
    for (var i = 0; i < sleutels.length; i++) {
      var id = sleutels[i];
      var regel = heeft(perId, id) ? perId[id] : null;
      if (!regel) return { fout: "Onbekende activiteit gekozen. Laad de pagina opnieuw." };
      var aantal = aantalUit(keuze[id]);
      if (aantal === null || aantal < 0) {
        return { fout: "Ongeldig aantal bij " + leesbareNaam(regel) + "." };
      }
      var hoogste = max(regel, ctx);
      if (aantal > hoogste) {
        return { fout: "Te veel gekozen bij " + leesbareNaam(regel) + ": maximaal " + hoogste + "." };
      }
      aantallen[id] = aantal;
    }

    // Lines with the same "limiet" share one cap (for example one ski pass
    // per person per day, whatever the age group; a ski package counts for
    // skis, boots and helmet).
    var limieten = Object.create(null);
    var volgorde = [];
    alle.forEach(function (lijn) {
      limietNamen(lijn).forEach(function (naam) {
        var limiet = limieten[naam];
        if (!limiet) {
          limiet = limieten[naam] = { som: 0, max: 0, namen: [], titel: lijn.activiteitNaam };
          volgorde.push(naam);
        }
        limiet.max = Math.max(limiet.max, max(lijn, ctx));
        if (limiet.namen.indexOf(lijn.naam) === -1) limiet.namen.push(lijn.naam);
        limiet.som += aantallen[lijn.id] || 0;
      });
    });
    for (var j = 0; j < volgorde.length; j++) {
      var gedeeld = limieten[volgorde[j]];
      if (gedeeld.som > gedeeld.max) {
        return {
          fout: "Te veel gekozen bij " + gedeeld.titel + " (" + gedeeld.namen.join(" / ") + "): samen maximaal " + gedeeld.max + "."
        };
      }
    }

    // Rental belongs to its activity: the people who rent equipment must
    // also be booked on the activity itself (same number of persons). A
    // free activity (no tariffs) has no count to check.
    var acts = activiteiten(cat, reis);
    for (var a = 0; a < acts.length; a++) {
      var act = acts[a];
      if (!tarieven(act).length) continue;
      var gehuurd = huurPersonen(act, aantallen);
      var geboekt = activiteitPersonen(act, aantallen);
      if (gehuurd > geboekt) {
        return {
          fout: geboekt
            ? "Spullen huren bij " + act.naam + ": kies evenveel personen bij de activiteit zelf (nu " + geboekt + ", huur " + gehuurd + ")."
            : "Spullen huren bij " + act.naam + " kan alleen samen met de activiteit zelf. Kies ook " + act.naam + "."
        };
      }
    }

    var regels = [];
    var totaal = 0;
    for (var k = 0; k < alle.length; k++) {
      var lijn = alle[k];
      var stuks = aantallen[lijn.id];
      if (!stuks) continue;
      var perStuk = centen(lijn);
      if (!perStuk) return { fout: "De prijzen van de activiteiten zijn niet beschikbaar." };
      regels.push({
        id: lijn.id,
        activiteit: lijn.activiteit,
        activiteitNaam: lijn.activiteitNaam,
        huur: lijn.huur,
        naam: lijn.naam,
        detail: typeof lijn.detail === "string" ? lijn.detail : "",
        titel: lijn.titel,
        productNaam: productNaam(lijn),
        eenheidTekst: eenheidTekst(lijn.eenheid),
        aantal: stuks,
        centenPerStuk: perStuk,
        centen: perStuk * stuks
      });
      totaal += perStuk * stuks;
    }
    if (!isFinite(totaal) || Math.floor(totaal) !== totaal) {
      return { fout: "De prijzen van de activiteiten zijn niet beschikbaar." };
    }

    return {
      regels: regels,
      totaalCenten: totaal,
      samenvatting: regels.map(function (regel) {
        return regel.aantal + "x " + (regel.huur ? "huur " : "") + regel.titel + " (" + regel.eenheidTekst + ")";
      }).join(", ")
    };
  }

  function naarQuery(keuze) {
    if (!keuze || typeof keuze !== "object" || Array.isArray(keuze)) return "";
    return Object.keys(keuze)
      .filter(function (id) { return ID_PATROON.test(id); })
      .map(function (id) { return [id, aantalUit(keuze[id])]; })
      .filter(function (paar) { return paar[1] > 0; })
      .map(function (paar) { return paar[0] + ":" + paar[1]; })
      .join(",");
  }

  function uitQuery(tekst) {
    var uit = {};
    if (typeof tekst !== "string") return uit;
    var aantal = 0;
    tekst.split(",").forEach(function (deel) {
      var match = /^\s*([a-z0-9-]{1,40})\s*:\s*(\d{1,4})\s*$/.exec(deel);
      if (!match) return;
      var n = parseInt(match[2], 10);
      if (!(n > 0)) return;
      if (!heeft(uit, match[1])) {
        if (aantal >= MAX_SLEUTELS) return;
        aantal++;
      }
      uit[match[1]] = n;
    });
    return uit;
  }

  // "1.234" style grouping of a whole number.
  function groepeer(n) {
    var tekst = String(n);
    var uit = "";
    while (tekst.length > 3) {
      uit = "." + tekst.slice(-3) + uit;
      tekst = tekst.slice(0, -3);
    }
    return tekst + uit;
  }

  // Cents -> "€1.234,56", exactly like euro() in js/uitchecken.js (which uses
  // toLocaleString("nl-NL") with two decimals), but without depending on the
  // runtime's locale data, so browser and server always agree.
  function euro(centenBedrag) {
    var c = typeof centenBedrag === "number" && isFinite(centenBedrag) ? Math.round(centenBedrag) : 0;
    var min = c < 0;
    if (min) c = -c;
    var rest = c % 100;
    return "€" + (min ? "-" : "") + groepeer(Math.floor(c / 100)) + "," + (rest < 10 ? "0" : "") + rest;
  }

  return {
    activiteiten: activiteiten,
    lijnen: lijnen,
    eenheidTekst: eenheidTekst,
    max: max,
    centen: centen,
    limietNamen: limietNamen,
    standaardTarief: standaardTarief,
    huurPersonen: huurPersonen,
    activiteitPersonen: activiteitPersonen,
    aanvullen: aanvullen,
    bereken: bereken,
    naarQuery: naarQuery,
    uitQuery: uitQuery,
    euro: euro
  };
});
