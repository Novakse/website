/* ==========================================================================
   Salen day trip: price calculation.

   This is the single source of truth for the price of the "Schaatsdagtocht
   vanuit Sälen". The same file runs in two places:
   - in the browser (window.SalenPrice), so the page shows the price live;
   - on the server (require("../js/salen-prijs.js") in api/salen-checkout.js),
     which recomputes the price before creating the Stripe session.
   Because both use this exact code and the same data/salen-prijzen.json,
   the amount on screen and the amount charged cannot drift apart.

   Never put purchase prices in here or in the JSON: both are public.

   API
     SalenPrice.calc(input, prices)
       input  = { package: "half"|"full", adults, children, toddlers,
                  transfer: boolean, rentals }
       prices = parsed data/salen-prijzen.json
       returns { adultRate, childRate, adultsTotal, childrenTotal,
                 transferTotal, rentalTotal, total }  (whole euros)
       or null when the package or the price data is unknown.
       Counts that are missing, negative or not a number count as 0, so the
       result never contains NaN.

     SalenPrice.validate(input, prices, today)
       returns null when the trip choice is valid, otherwise a Dutch error
       message. Checks date, package, counts, transfer and rentals. It does
       not check contact details or shoe sizes (the server does that).
       today = optional "YYYY-MM-DD" (for tests); defaults to the current
       date in Europe/Stockholm. Dates before today are rejected, today
       itself is allowed.

     SalenPrice.todayStockholm()
       returns the current date in Europe/Stockholm as "YYYY-MM-DD".
   ========================================================================== */
(function (factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.SalenPrice = api;
  }
})(function () {
  "use strict";

  // Non-negative whole number, or 0 for anything else (never NaN).
  function toCount(value) {
    var n = typeof value === "number" ? value : parseInt(value, 10);
    if (!isFinite(n) || n < 0) return 0;
    return Math.floor(n);
  }

  // Strict whole number: a number or a string of digits. Otherwise null.
  function toStrictInt(value) {
    if (typeof value === "number") {
      return isFinite(value) && Math.floor(value) === value ? value : null;
    }
    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
      return parseInt(value, 10);
    }
    return null;
  }

  function getPackage(prices, key) {
    if (!prices || !prices.packages) return null;
    if (key !== "half" && key !== "full") return null;
    var pkg = prices.packages[key];
    return pkg && pkg.adultRates ? pkg : null;
  }

  // Price per adult for a group of this many adults. The highest key that is
  // not larger than the group size applies ("4" = 4 or more).
  function adultRateFor(pkg, adults) {
    var size = Math.max(1, adults);
    var best = null;
    var bestKey = 0;
    Object.keys(pkg.adultRates).forEach(function (key) {
      var k = parseInt(key, 10);
      if (isFinite(k) && k <= size && k > bestKey) {
        bestKey = k;
        best = pkg.adultRates[key];
      }
    });
    return typeof best === "number" ? best : 0;
  }

  function num(value) {
    return typeof value === "number" && isFinite(value) ? value : 0;
  }

  function calc(input, prices) {
    input = input || {};
    var pkg = getPackage(prices, input.package);
    if (!pkg) return null;

    var adults = toCount(input.adults);
    var children = toCount(input.children);
    var toddlers = toCount(input.toddlers);
    var rentals = toCount(input.rentals);

    var adultRate = adultRateFor(pkg, adults);
    var childRate = num(pkg.child);
    var toddlerRate = num(prices.toddler);

    var adultsTotal = adultRate * adults;
    var childrenTotal = childRate * children + toddlerRate * toddlers;
    var transferTotal = input.transfer === true ? num(prices.transferPerAdult) * adults : 0;
    var rentalTotal = num(prices.rentalPerPair) * rentals;

    return {
      adultRate: adultRate,
      childRate: childRate,
      adultsTotal: adultsTotal,
      childrenTotal: childrenTotal,
      transferTotal: transferTotal,
      rentalTotal: rentalTotal,
      total: adultsTotal + childrenTotal + transferTotal + rentalTotal
    };
  }

  // "YYYY-MM-DD" that is a real calendar date, as a UTC Date. Otherwise null.
  function parseDate(text) {
    if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
    var p = text.split("-");
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== text) return null;
    return d;
  }

  function inRange(n, limit, fallbackMin, fallbackMax) {
    var min = limit && typeof limit.min === "number" ? limit.min : fallbackMin;
    var max = limit && typeof limit.max === "number" ? limit.max : fallbackMax;
    return n !== null && n >= min && n <= max;
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  // Current date in Europe/Stockholm as "YYYY-MM-DD". Falls back to the UTC
  // date when the runtime has no time zone data.
  function todayStockholm(now) {
    now = now || new Date();
    try {
      var parts = {};
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit"
      }).formatToParts(now).forEach(function (part) { parts[part.type] = part.value; });
      var text = parts.year + "-" + parts.month + "-" + parts.day;
      if (parseDate(text)) return text;
    } catch (e) { /* fall through */ }
    return now.getUTCFullYear() + "-" + pad2(now.getUTCMonth() + 1) + "-" + pad2(now.getUTCDate());
  }

  function validate(input, prices, today) {
    input = input || {};
    if (!prices || !prices.packages) return "De prijzen zijn niet beschikbaar.";

    var date = parseDate(input.date);
    if (!date) return "Kies een geldige datum.";
    var todayDate = parseDate(today) || parseDate(todayStockholm());
    if (todayDate && date < todayDate) {
      return "Deze datum is al voorbij. Kies een datum vanaf vandaag.";
    }
    var season = prices.season || {};
    var from = parseDate(season.from);
    var to = parseDate(season.to);
    if (!from || !to || date < from || date > to) {
      return "Die datum valt buiten de periode waarin de dagtocht te boeken is.";
    }

    if (!getPackage(prices, input.package)) return "Kies een halve of een hele dag.";

    var limits = prices.limits || {};
    var adults = toStrictInt(input.adults);
    var children = toStrictInt(input.children);
    var toddlers = toStrictInt(input.toddlers);
    if (!inRange(adults, limits.adults, 1, 10)) return "Ongeldig aantal volwassenen.";
    if (!inRange(children, limits.children, 0, 10)) return "Ongeldig aantal kinderen.";
    if (!inRange(toddlers, limits.toddlers, 0, 10)) return "Ongeldig aantal kinderen van 0 t/m 3 jaar.";

    if (typeof input.transfer !== "boolean") return "Geef aan of je vervoer wilt.";

    var rentals = toStrictInt(input.rentals);
    if (rentals === null || rentals < 0 || rentals > adults + children + toddlers) {
      return "Ongeldig aantal huurschaatsen.";
    }
    return null;
  }

  return {
    calc: calc,
    validate: validate,
    todayStockholm: function () { return todayStockholm(); },
    adultRateFor: function (packageKey, adults, prices) {
      var pkg = getPackage(prices, packageKey);
      return pkg ? adultRateFor(pkg, toCount(adults)) : 0;
    }
  };
});
