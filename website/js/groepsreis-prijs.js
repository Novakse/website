/* ==========================================================================
   Group trips with fixed dates (groepsreis-orsa, groepsreis-falun): price.

   The single source of truth for what a group trip costs. The same file runs
   in two places:
   - in the browser (window.NovakseGroepsreis), so the page shows the price
     live;
   - on the server (require("../js/groepsreis-prijs.js") via
     api/_groepsreis.js), used by api/groepsreis-prijs.js and by
     api/create-payment.js, which recomputes the amount before creating the
     Stripe session and ignores any amount the browser sends.
   Both read the same data/groepsreizen.json, so what is on screen is exactly
   what is charged. The file only holds customer prices; never put purchase
   prices or margins in here or in the JSON: both are public.

   Rules: one fixed price per person for the whole trip (whole euros), fixed
   dates, no extra days, adults only (no child price). Online booking goes per
   "stap" persons (2, 4, 6 ...) from minPersonen up to maxPersonen; 1 person
   or an odd number cannot book online (contact). A trip can no longer be
   booked from its arrival day on.

   API (data = parsed data/groepsreizen.json)
     REIZEN                       -> ["groepsreis-orsa", "groepsreis-falun"]
     reis(data, sleutel)          -> the checked trip { sleutel, naam, plaats,
                                     van, tot, dagen, volleDagen,
                                     schaatsdagen, prijsPerPersoon, stap,
                                     minPersonen, maxPersonen,
                                     activiteitenDagen, gidsen }, or null when
                                     the key is unknown or its data is
                                     incomplete or inconsistent
     personenKeuzes(reis)         -> the head counts that can book online,
                                     e.g. [2, 4, ..., 20] ([] for no trip)
     berekenGroepsreis(keuze, data, opties)
                                  -> keuze = { reis: "groepsreis-orsa",
                                               personen: 4 | "4" }
                                     opties = { vandaag: "YYYY-MM-DD" }, only
                                     for tests (default: today in
                                     Europe/Stockholm)
                                     Returns { ok: true, reis, personen,
                                     perPersoonEur, totaalEur, totaalCenten }
                                     or { ok: false, code, reden } with code
                                     "onbekendeReis" | "data" | "ongeldig" |
                                     "teWeinig" | "oneven" | "teVeel" |
                                     "voorbij" and reden a Dutch message.
                                     "teWeinig" and "oneven" are the cases to
                                     send to contact.
     periodeTekst(reis)           -> "donderdag 28 t/m zondag 31 januari 2027"
     omschrijving(reis, uitkomst) -> "Groepsreis Orsa, donderdag 28 t/m
                                     zondag 31 januari 2027 (4 dagen),
                                     4 personen, €1.295 p.p." (the Stripe
                                     description)
     euro(eur)                    -> whole euros as "€1.295" (no locale data,
                                     so browser and server always agree)
     vandaagTekst(nu)             -> today in Europe/Stockholm as "YYYY-MM-DD"
   ========================================================================== */
(function (factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.NovakseGroepsreis = api;
  }
})(function () {
  "use strict";

  // Whitelist: only these trips can be priced and booked.
  var REIZEN = ["groepsreis-orsa", "groepsreis-falun"];
  var MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni",
    "juli", "augustus", "september", "oktober", "november", "december"];
  var WEEKDAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

  function heeft(object, sleutel) {
    return Object.prototype.hasOwnProperty.call(object, sleutel);
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  /* "YYYY-MM-DD" -> Date at UTC midnight, or null. Impossible dates
     (31 February) are rejected instead of rolling over, same as
     api/_reis-prijs.js. */
  function alsDatum(tekst) {
    if (typeof tekst !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(tekst)) return null;
    var d = tekst.split("-");
    var datum = new Date(Date.UTC(+d[0], +d[1] - 1, +d[2]));
    if (isNaN(datum.getTime())) return null;
    if (datum.getUTCMonth() !== +d[1] - 1 || datum.getUTCDate() !== +d[2]) return null;
    return datum;
  }

  // A whole number from the data file, or NaN.
  function heelGetal(waarde) {
    return typeof waarde === "number" && isFinite(waarde) && Math.floor(waarde) === waarde ? waarde : NaN;
  }

  /* Head count from a choice: a whole number, or a string of 1 to 6 digits.
     NaN for anything else ("2.5", "2a", "", true, null). */
  function aantalUit(waarde) {
    if (typeof waarde === "number") {
      return isFinite(waarde) && Math.floor(waarde) === waarde ? waarde : NaN;
    }
    if (typeof waarde === "string" && /^\d{1,6}$/.test(waarde.trim())) return parseInt(waarde, 10);
    return NaN;
  }

  // "groepsreis-orsa" (any case) when whitelisted, otherwise "".
  function reisSleutel(reis) {
    var sleutel = typeof reis === "string" ? reis.trim().toLowerCase() : "";
    return REIZEN.indexOf(sleutel) === -1 ? "" : sleutel;
  }

  /* The trip from the data file, checked. Anything incomplete or
     inconsistent gives null, so a typo in the JSON blocks booking instead of
     charging a wrong amount. */
  function reis(data, sleutel) {
    var key = reisSleutel(sleutel);
    if (!key || !data || typeof data !== "object" || !heeft(data, key)) return null;
    var r = data[key];
    if (!r || typeof r !== "object") return null;

    var van = alsDatum(r.van);
    var tot = alsDatum(r.tot);
    if (!van || !tot || tot <= van) return null;
    var dagen = heelGetal(r.dagen);
    // dagen counts arrival and departure day: 28 to 31 January is 4 days.
    if (dagen !== Math.round((tot - van) / 86400000) + 1) return null;

    var prijs = heelGetal(r.prijsPerPersoon);
    var stap = heelGetal(r.stap);
    var min = heelGetal(r.minPersonen);
    var max = heelGetal(r.maxPersonen);
    var actDagen = heelGetal(r.activiteitenDagen);
    if (!(prijs > 0) || !(stap >= 1) || !(min >= 1) || !(max >= min)) return null;
    if (min % stap !== 0) return null; // the smallest group must itself be bookable
    if (!(actDagen >= 0 && actDagen <= dagen)) return null;
    if (typeof r.naam !== "string" || !r.naam.trim()) return null;

    return {
      sleutel: key,
      naam: r.naam.trim(),
      plaats: typeof r.plaats === "string" ? r.plaats : "",
      van: r.van,
      tot: r.tot,
      dagen: dagen,
      volleDagen: heelGetal(r.volleDagen) >= 0 ? r.volleDagen : null,
      schaatsdagen: heelGetal(r.schaatsdagen) >= 0 ? r.schaatsdagen : null,
      prijsPerPersoon: prijs,
      stap: stap,
      minPersonen: min,
      maxPersonen: max,
      activiteitenDagen: actDagen,
      gidsen: typeof r.gidsen === "string" ? r.gidsen : ""
    };
  }

  function personenKeuzes(r) {
    var uit = [];
    if (!r || !(r.stap >= 1)) return uit;
    for (var n = r.minPersonen; n <= r.maxPersonen; n += r.stap) uit.push(n);
    return uit;
  }

  // Today in Europe/Stockholm as "YYYY-MM-DD" (UTC date as a fallback).
  // Same approach as todayStockholm() in js/salen-prijs.js.
  function vandaagTekst(nu) {
    nu = nu || new Date();
    try {
      var delen = {};
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit"
      }).formatToParts(nu).forEach(function (deel) { delen[deel.type] = deel.value; });
      var tekst = delen.year + "-" + delen.month + "-" + delen.day;
      if (alsDatum(tekst)) return tekst;
    } catch (fout) { /* fall through */ }
    return nu.getUTCFullYear() + "-" + pad2(nu.getUTCMonth() + 1) + "-" + pad2(nu.getUTCDate());
  }

  function weiger(code, reden) {
    return { ok: false, code: code, reden: reden };
  }

  function berekenGroepsreis(keuze, data, opties) {
    keuze = keuze || {};
    var sleutel = reisSleutel(keuze.reis);
    if (!sleutel) return weiger("onbekendeReis", "Onbekende reis.");
    var r = reis(data, sleutel);
    if (!r) return weiger("data", "De gegevens van deze groepsreis zijn niet beschikbaar.");

    var personen = aantalUit(keuze.personen);
    if (isNaN(personen) || personen < 1) return weiger("ongeldig", "Ongeldig aantal personen.");
    if (personen > r.maxPersonen) {
      return weiger("teVeel", "Online aanmelden kan voor maximaal " + r.maxPersonen + " personen.");
    }
    if (personen < r.minPersonen) {
      return weiger("teWeinig", "Online aanmelden kan vanaf " + r.minPersonen + " personen. " +
        "Wil je met " + (personen === 1 ? "1 persoon" : personen + " personen") + " mee? Neem dan contact op.");
    }
    if (personen % r.stap !== 0) {
      return weiger("oneven", "Online aanmelden kan per " + r.stap + " personen. " +
        (r.stap === 2 ? "Voor een oneven aantal" : "Voor een ander aantal") + " kun je contact opnemen.");
    }

    // A trip that has started can no longer be booked. "vandaag" is only
    // for tests; the server never takes it from a request.
    var vandaag = opties && typeof opties.vandaag === "string" && alsDatum(opties.vandaag) ? opties.vandaag : vandaagTekst();
    if (vandaag >= r.van) return weiger("voorbij", "Deze groepsreis is niet meer te boeken.");

    var totaalEur = personen * r.prijsPerPersoon;
    return {
      ok: true,
      reis: sleutel,
      personen: personen,
      perPersoonEur: r.prijsPerPersoon,
      totaalEur: totaalEur,
      totaalCenten: totaalEur * 100
    };
  }

  // "donderdag 28 t/m zondag 31 januari 2027"; month and year are written
  // once when both days share them.
  function periodeTekst(r) {
    var van = r && alsDatum(r.van);
    var tot = r && alsDatum(r.tot);
    if (!van || !tot) return "";
    var zelfdeJaar = van.getUTCFullYear() === tot.getUTCFullYear();
    var zelfdeMaand = zelfdeJaar && van.getUTCMonth() === tot.getUTCMonth();
    var begin = WEEKDAGEN[van.getUTCDay()] + " " + van.getUTCDate() +
      (zelfdeMaand ? "" : " " + MAANDEN[van.getUTCMonth()]) +
      (zelfdeJaar ? "" : " " + van.getUTCFullYear());
    var eind = WEEKDAGEN[tot.getUTCDay()] + " " + tot.getUTCDate() + " " + MAANDEN[tot.getUTCMonth()] + " " + tot.getUTCFullYear();
    return begin + " t/m " + eind;
  }

  // "1.295" style grouping of a whole number.
  function groepeer(n) {
    var tekst = String(n);
    var uit = "";
    while (tekst.length > 3) {
      uit = "." + tekst.slice(-3) + uit;
      tekst = tekst.slice(0, -3);
    }
    return tekst + uit;
  }

  // Whole euros -> "€1.295".
  function euro(eur) {
    var n = typeof eur === "number" && isFinite(eur) ? Math.round(eur) : 0;
    return "€" + (n < 0 ? "-" : "") + groepeer(Math.abs(n));
  }

  function omschrijving(r, uitkomst) {
    if (!r || !uitkomst || !uitkomst.ok) return "";
    return r.naam + ", " + periodeTekst(r) + " (" + r.dagen + " dagen), " +
      uitkomst.personen + (uitkomst.personen === 1 ? " persoon" : " personen") + ", " +
      euro(uitkomst.perPersoonEur) + " p.p.";
  }

  return {
    REIZEN: REIZEN.slice(),
    reis: reis,
    personenKeuzes: personenKeuzes,
    berekenGroepsreis: berekenGroepsreis,
    periodeTekst: periodeTekst,
    omschrijving: omschrijving,
    euro: euro,
    vandaagTekst: vandaagTekst
  };
});
