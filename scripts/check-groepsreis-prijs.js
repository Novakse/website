#!/usr/bin/env node
/* ==========================================================================
   Check of the group trip price (groepsreis-orsa, groepsreis-falun).

   1. js/groepsreis-prijs.js against api/groepsreis-prijs.js (called with a
      mock req/res) for 0 to 30 persons on both trips: every answer must be
      identical, and only 2, 4, ..., 20 may be bookable.
   2. Invalid choices (1, odd, 22, unknown trip, junk) must give 400.
   3. The activity aliases in data/activiteiten.json give exactly Falun's
      list and prices, and scripts/build-activity-prices.js accepts them and
      would not rewrite them.
   4. api/create-payment.js ignores or refuses a manipulated amount.

   No real Stripe call is ever made: global fetch is replaced by a mock
   before the payment handler runs, and STRIPE_API_KEY is set to a dummy
   value that is never sent anywhere. No payment is created and no key is
   used.

   Usage (from the repo root): node scripts/check-groepsreis-prijs.js
   Exit code 1 on any failure.
   ========================================================================== */
"use strict";

var fs = require("fs");
var path = require("path");

var REPO = path.resolve(__dirname, "..");
var WEBSITE = path.join(REPO, "website");

// ---- Never reach Stripe: mock fetch and a dummy key, set before anything runs.
var stripeCalls = [];
global.fetch = function (url, options) {
  stripeCalls.push({ url: String(url), body: options && options.body ? String(options.body) : "" });
  return Promise.resolve({
    ok: true,
    json: function () { return Promise.resolve({ url: "https://checkout.mock.invalid/session" }); }
  });
};
process.env.STRIPE_API_KEY = "mock-key-not-real";

var Groepsreis = require(path.join(WEBSITE, "js", "groepsreis-prijs.js"));
var ACT = require(path.join(WEBSITE, "js", "activiteiten-prijs.js"));
var prijsHandler = require(path.join(WEBSITE, "api", "groepsreis-prijs.js"));
var betaalHandler = require(path.join(WEBSITE, "api", "create-payment.js"));
var build = require(path.join(REPO, "scripts", "build-activity-prices.js"));

var data = JSON.parse(fs.readFileSync(path.join(WEBSITE, "data", "groepsreizen.json"), "utf8"));
var catText = fs.readFileSync(path.join(WEBSITE, "data", "activiteiten.json"), "utf8");
var cat = JSON.parse(catText);

var failures = [];
var checks = 0;
function check(condition, message) {
  checks++;
  if (!condition) failures.push(message);
}

function mockRes() {
  var res = { statusCode: 200, headers: {}, body: undefined };
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (obj) { res.body = obj; return res; };
  res.setHeader = function (key, value) { res.headers[String(key).toLowerCase()] = value; };
  return res;
}

function vraagPrijs(query, viaUrl) {
  var search = new URLSearchParams(query).toString();
  var req = { method: "GET", headers: {}, url: "/api/groepsreis-prijs?" + search };
  if (!viaUrl) req.query = query; // Vercel fills req.query; dev-server.js does not
  var res = mockRes();
  prijsHandler(req, res);
  return res;
}

async function betaal(body) {
  var req = {
    method: "POST",
    headers: { origin: "https://www.novakse.com", host: "www.novakse.com" },
    body: body
  };
  var res = mockRes();
  var voor = stripeCalls.length;
  await betaalHandler(req, res);
  var call = stripeCalls.length > voor ? stripeCalls[stripeCalls.length - 1] : null;
  return { res: res, stripe: call ? new URLSearchParams(call.body) : null, url: call ? call.url : "" };
}

function reizigers(aantal, geboren) {
  var lijst = [];
  for (var i = 0; i < aantal; i++) {
    lijst.push({ voornamen: "Test" + (i + 1), achternaam: "Reiziger", geboortedatum: geboren || "1980-05-01", nationaliteit: "Nederlandse" });
  }
  return { reizigers: lijst, email: "test@example.invalid", telefoon: "0612345678", voorwaarden: true };
}

async function main() {
  var reizen = Groepsreis.REIZEN;
  check(reizen.length === 2 && reizen.indexOf("groepsreis-orsa") !== -1 && reizen.indexOf("groepsreis-falun") !== -1,
    "REIZEN must be groepsreis-orsa and groepsreis-falun");

  // ---- 1. Module vs API, 0..30 persons --------------------------------------
  var verschillen = 0;
  var geboekt = 0;
  reizen.forEach(function (sleutel) {
    var reis = Groepsreis.reis(data, sleutel);
    check(reis !== null, sleutel + ": data incomplete or inconsistent");
    if (!reis) return;
    check(reis.maxPersonen <= 20, sleutel + ": maxPersonen above 20 also needs MAX_REIZIGERS in create-payment.js");
    for (var p = 0; p <= 30; p++) {
      var mod = Groepsreis.berekenGroepsreis({ reis: sleutel, personen: p }, data);
      var api = vraagPrijs({ reis: sleutel, personen: String(p) });
      var verwachtOk = p >= reis.minPersonen && p <= reis.maxPersonen && p % reis.stap === 0;
      var gelijk;
      if (mod.ok) {
        gelijk = api.statusCode === 200 && api.body.ok === true && api.body.reis === mod.reis &&
          api.body.personen === mod.personen && api.body.perPersoonEur === mod.perPersoonEur &&
          api.body.totaalEur === mod.totaalEur && api.body.totaalCenten === mod.totaalCenten &&
          api.body.van === reis.van && api.body.tot === reis.tot && api.body.dagen === reis.dagen &&
          api.body.naam === reis.naam &&
          api.body.omschrijving === Groepsreis.omschrijving(reis, mod);
        check(mod.totaalEur === p * reis.prijsPerPersoon && mod.totaalCenten === p * reis.prijsPerPersoon * 100,
          sleutel + " " + p + ": wrong total");
        geboekt++;
      } else {
        gelijk = api.statusCode === 400 && api.body.ok === false && api.body.error === mod.reden && api.body.code === mod.code;
      }
      if (!gelijk) {
        verschillen++;
        failures.push(sleutel + " " + p + " personen: module " + JSON.stringify(mod) + " vs API " + api.statusCode + " " + JSON.stringify(api.body));
      }
      check(mod.ok === verwachtOk, sleutel + " " + p + ": bookable should be " + verwachtOk);
      check(api.headers["cache-control"] === "no-store", sleutel + " " + p + ": Cache-Control no-store missing");
    }
  });
  console.log("1. Module vs API, 0-30 personen, 2 reizen: " + verschillen + " verschillen (" + geboekt + " boekbare aantallen).");

  // The dev-server path (no req.query, only req.url) gives the same answer.
  var viaUrl = vraagPrijs({ reis: "groepsreis-orsa", personen: "4" }, true);
  check(viaUrl.statusCode === 200 && viaUrl.body.totaalCenten === 518000, "GET via req.url only should give 518000 cents");
  var voorbeeld = vraagPrijs({ reis: "groepsreis-orsa", personen: "4" });
  console.log("   Voorbeeld 200: " + JSON.stringify(voorbeeld.body));

  // ---- 2. Invalid choices give 400 ------------------------------------------
  var ongeldig = [
    ["groepsreis-orsa", "1", "teWeinig"],
    ["groepsreis-orsa", "3", "oneven"],
    ["groepsreis-falun", "7", "oneven"],
    ["groepsreis-orsa", "22", "teVeel"],
    ["groepsreis-falun", "21", "teVeel"],
    ["groepsreis-xyz", "4", "onbekendeReis"],
    ["orsa", "4", "onbekendeReis"],
    ["", "4", "onbekendeReis"],
    ["groepsreis-orsa", "2.5", "ongeldig"],
    ["groepsreis-orsa", "abc", "ongeldig"],
    ["groepsreis-orsa", "-2", "ongeldig"],
    ["groepsreis-orsa", "", "ongeldig"]
  ];
  ongeldig.forEach(function (geval) {
    var res = vraagPrijs({ reis: geval[0], personen: geval[1] });
    check(res.statusCode === 400 && res.body.code === geval[2],
      "reis=" + geval[0] + " personen=" + geval[1] + ": expected 400 " + geval[2] + ", got " + res.statusCode + " " + JSON.stringify(res.body));
  });
  var methode = mockRes();
  prijsHandler({ method: "PUT", headers: {}, query: {} }, methode);
  check(methode.statusCode === 405, "PUT should give 405");
  console.log("2. Ongeldige keuzes: " + ongeldig.length + " gevallen getest (400 met code), voorbeeld 1 persoon: " +
    JSON.stringify(vraagPrijs({ reis: "groepsreis-orsa", personen: "1" }).body.error));

  // A trip that has started cannot be booked (vandaag only for tests).
  check(Groepsreis.berekenGroepsreis({ reis: "groepsreis-orsa", personen: 2 }, data, { vandaag: "2027-01-27" }).ok === true,
    "groepsreis-orsa should be bookable on 2027-01-27");
  check(Groepsreis.berekenGroepsreis({ reis: "groepsreis-orsa", personen: 2 }, data, { vandaag: "2027-01-28" }).code === "voorbij",
    "groepsreis-orsa should be closed on its arrival day");
  // Broken data blocks booking instead of charging a wrong amount.
  var kapot = JSON.parse(JSON.stringify(data));
  kapot["groepsreis-orsa"].tot = "2027-02-01"; // 5 days, but dagen says 4
  check(Groepsreis.berekenGroepsreis({ reis: "groepsreis-orsa", personen: 2 }, kapot).code === "data",
    "inconsistent dates should be refused");
  check(Groepsreis.periodeTekst(Groepsreis.reis(data, "groepsreis-orsa")) === "donderdag 28 t/m zondag 31 januari 2027",
    "periode text Orsa");
  check(Groepsreis.periodeTekst(Groepsreis.reis(data, "groepsreis-falun")) === "donderdag 4 t/m zondag 7 februari 2027",
    "periode text Falun");

  // ---- 3. Activity aliases ---------------------------------------------------
  var falunLijnen = JSON.stringify(ACT.lijnen(cat, "falun"));
  reizen.forEach(function (sleutel) {
    check(ACT.lijnen(cat, sleutel).length > 0 && JSON.stringify(ACT.lijnen(cat, sleutel)) === falunLijnen,
      sleutel + ": activities must equal Falun's");
  });
  check(ACT.lijnen(cat, "wellness").length > 0 && JSON.stringify(ACT.lijnen(cat, "wellness")) !== falunLijnen,
    "wellness must keep its own list");
  check(ACT.lijnen(cat, "groepsreis-xyz").length === 0, "unknown trip must have no activities");
  var lus = { a: 1, "groepsreis-orsa": { gelijkAan: "groepsreis-falun" }, "groepsreis-falun": { gelijkAan: "falun" }, falun: cat.falun };
  check(ACT.lijnen(lus, "groepsreis-orsa").length === 0, "an alias to an alias must give no activities");
  var problemen = build.checkPublic(cat);
  check(problemen.length === 0, "build-activity-prices checkPublic: " + problemen.join("; "));
  check(build.format(cat, 0) + "\n" === catText, "build-activity-prices would rewrite activiteiten.json (layout differs)");
  var fout = JSON.parse(catText);
  fout["groepsreis-orsa"] = { gelijkAan: "orsa" };
  check(build.checkPublic(fout).length === 1, "a broken alias must be reported by checkPublic");
  console.log("3. Activiteiten: aliassen geven de Falun-lijst; build-activity-prices accepteert ze en herschrijft niets.");

  // ---- 4. create-payment ignores or refuses a manipulated amount ------------
  var r;
  r = await betaal({ reis: "groepsreis-orsa", personen: 4, bedrag: 100, verwachtCenten: 100, reisgegevens: reizigers(4) });
  check(r.res.statusCode === 409 && !r.stripe, "tampered verwachtCenten should give 409 without a Stripe call, got " + r.res.statusCode);
  console.log("4a. Bedrag 1 euro + verwachtCenten 100: " + r.res.statusCode + " " + JSON.stringify(r.res.body) + (r.stripe ? " (Stripe aangeroepen!)" : " (geen Stripe-aanroep)"));

  r = await betaal({ reis: "groepsreis-orsa", personen: "4", bedrag: 100, omschrijving: "Goedkoop", reisgegevens: reizigers(4) });
  var s = r.stripe;
  var verwachteOmschrijving = "Groepsreis Orsa, donderdag 28 t/m zondag 31 januari 2027 (4 dagen), 4 personen, €1.295 p.p.";
  check(r.res.statusCode === 200 && s, "manipulated bedrag without verwachtCenten should still be priced by the server");
  if (s) {
    check(r.url === "https://api.stripe.com/v1/checkout/sessions", "mock fetch URL");
    check(s.get("line_items[0][price_data][unit_amount]") === "518000", "unit_amount should be 518000, is " + s.get("line_items[0][price_data][unit_amount]"));
    check(s.get("line_items[0][quantity]") === "1", "quantity 1");
    check(s.get("line_items[1][quantity]") === null, "no extra line items without activities");
    check(s.get("line_items[0][price_data][product_data][name]") === verwachteOmschrijving, "product name: " + s.get("line_items[0][price_data][product_data][name]"));
    var verwachtMeta = { reis: "Groepsreis Orsa", reistype: "groepsreis", van: "2027-01-28", tot: "2027-01-31", dagen: "4", personen: "4", totaal_eur: "5180", per_persoon_eur: "1295" };
    Object.keys(verwachtMeta).forEach(function (k) {
      check(s.get("metadata[" + k + "]") === verwachtMeta[k], "metadata " + k + " = " + s.get("metadata[" + k + "]"));
      check(s.get("payment_intent_data[metadata][" + k + "]") === verwachtMeta[k], "payment metadata " + k);
    });
    check(s.get("metadata[huurauto]") === null && s.get("metadata[hoofdbestuurder]") === null, "no car fields for a group trip");
    check(s.get("metadata[reiziger_4]") !== null && s.get("metadata[contact_email]") === "test@example.invalid", "travel details in metadata");
    check(s.get("cancel_url") === "https://www.novakse.com/groepsreis-orsa.html?personen=4", "cancel_url: " + s.get("cancel_url"));
    check(s.get("success_url") === "https://www.novakse.com/betaling-verwerkt.html", "success_url");
    console.log("4b. Bedrag 1 euro zonder verwachtCenten: " + r.res.statusCode + ", server rekent " + s.get("line_items[0][price_data][unit_amount]") +
      " cent; omschrijving \"" + s.get("line_items[0][price_data][product_data][name]") + "\"; cancel_url " + s.get("cancel_url"));
  }

  r = await betaal({ reis: "groepsreis-orsa", personen: 4, verwachtCenten: 518000, reisgegevens: reizigers(4) });
  check(r.res.statusCode === 200 && r.stripe, "correct verwachtCenten should pass");

  r = await betaal({ reis: "groepsreis-falun", personen: 20, verwachtCenten: 2590000, reisgegevens: reizigers(20) });
  check(r.res.statusCode === 200 && r.stripe && r.stripe.get("line_items[0][price_data][unit_amount]") === "2590000",
    "20 persons Falun should charge 2590000 cents, got " + r.res.statusCode + " " + JSON.stringify(r.res.body));
  if (r.stripe) {
    check(r.stripe.get("cancel_url") === "https://www.novakse.com/groepsreis-falun.html?personen=20", "cancel_url Falun");
    check(r.stripe.get("line_items[0][price_data][product_data][name]") ===
      "Groepsreis Falun, donderdag 4 t/m zondag 7 februari 2027 (4 dagen), 20 personen, €1.295 p.p.", "product name Falun");
  }

  var geweigerd = [
    [{ reis: "groepsreis-orsa", personen: 3, bedrag: 388500, reisgegevens: reizigers(3) }, 400, "oneven"],
    [{ reis: "groepsreis-orsa", personen: 1, bedrag: 129500, reisgegevens: reizigers(1) }, 400, "1 persoon"],
    [{ reis: "groepsreis-orsa", personen: 22, bedrag: 2849000, reisgegevens: reizigers(20) }, 400, "22 personen"],
    [{ reis: "groepsreis-xyz", personen: 4, bedrag: 100, reisgegevens: reizigers(4) }, 400, "onbekende groepsreis"],
    [{ reis: "groepsreis-orsa", personen: "4abc", bedrag: 100, reisgegevens: reizigers(4) }, 400, "personen 4abc"],
    [{ reis: "groepsreis-orsa", personen: 4, reisgegevens: reizigers(3) }, 400, "3 reizigers bij 4 personen"],
    [{ reis: "groepsreis-orsa", personen: 2, reisgegevens: reizigers(2, "2020-03-01") }, 400, "kind van 6"],
    [{ reis: "groepsreis-orsa", personen: 4, activiteiten: { "skipas-volw": 17 }, reisgegevens: reizigers(4) }, 400, "17 skipasdagen (max 4 x 4)"],
    [{ reis: "groepsreis-orsa", personen: 4, activiteiten: { "liftpas-volw": 1 }, reisgegevens: reizigers(4) }, 400, "wellness-activiteit"]
  ];
  for (var i = 0; i < geweigerd.length; i++) {
    var geval = geweigerd[i];
    r = await betaal(geval[0]);
    check(r.res.statusCode === geval[1] && !r.stripe, "create-payment " + geval[2] + ": expected " + geval[1] + " without Stripe call, got " + r.res.statusCode + " " + JSON.stringify(r.res.body));
    check(!/kalender/i.test(String(r.res.body && r.res.body.error)), "create-payment " + geval[2] + ": message mentions the calendar");
  }
  r = await betaal({ reis: "groepsreis-orsa", personen: 2, reisgegevens: reizigers(2, "2020-03-01") });
  console.log("4c. Geweigerd zonder Stripe-aanroep: " + geweigerd.length + " gevallen; melding bij een kind: " + JSON.stringify(r.res.body.error));

  // Activities via the alias: Falun prices, extra Stripe lines, total checked.
  var actKeuze = { "husky-lunchtocht": 4, "skipas-volw": 16 };
  var actTotaal = 518000 + 4 * 12400 + 16 * 6000;
  r = await betaal({ reis: "groepsreis-orsa", personen: 4, activiteiten: actKeuze, verwachtCenten: actTotaal, reisgegevens: reizigers(4) });
  check(r.res.statusCode === 200 && r.stripe, "activities via alias should pass with verwachtCenten " + actTotaal + ", got " + r.res.statusCode + " " + JSON.stringify(r.res.body));
  if (r.stripe) {
    var som = 0;
    for (var n = 0; r.stripe.get("line_items[" + n + "][quantity]") !== null; n++) {
      som += parseInt(r.stripe.get("line_items[" + n + "][quantity]"), 10) * parseInt(r.stripe.get("line_items[" + n + "][price_data][unit_amount]"), 10);
    }
    check(som === actTotaal, "sum of Stripe lines " + som + " should be " + actTotaal);
    check(r.stripe.get("metadata[activiteiten]") === "skipas-volw:16,husky-lunchtocht:4", "metadata activiteiten: " + r.stripe.get("metadata[activiteiten]"));
    check(r.stripe.get("cancel_url") === "https://www.novakse.com/groepsreis-orsa.html?personen=4&act=skipas-volw%3A16%2Chusky-lunchtocht%3A4", "cancel_url with act: " + r.stripe.get("cancel_url"));
    console.log("4d. Met activiteiten (alias Falun): " + n + " Stripe-regels, samen " + som + " cent, cancel_url " + r.stripe.get("cancel_url"));
  }

  // Regression: a payment link from Joey still uses the generic flow (with a
  // rental car, so a main driver is required, as before).
  var linkGegevens = reizigers(1);
  linkGegevens.hoofdbestuurder = 1;
  r = await betaal({ reis: "Finland", bedrag: 59700, omschrijving: "Betaallink test", reisgegevens: linkGegevens });
  check(r.res.statusCode === 200 && r.stripe && r.stripe.get("line_items[0][price_data][unit_amount]") === "59700" &&
    r.stripe.get("cancel_url") === "https://www.novakse.com/uitchecken.html", "generic payment link flow changed: " + r.res.statusCode + " " + JSON.stringify(r.res.body));
  // Regression: activities on a trip that has none are still refused.
  r = await betaal({ reis: "Finland", bedrag: 59700, activiteiten: { "husky-lunchtocht": 1 }, reisgegevens: reizigers(1) });
  check(r.res.statusCode === 400 && !r.stripe, "activities on a payment link should still be refused");

  check(stripeCalls.every(function (call) { return call.url === "https://api.stripe.com/v1/checkout/sessions"; }), "unexpected fetch URL");
  console.log("   Alle Stripe-aanroepen gingen naar de mock (" + stripeCalls.length + "x), geen echte betaling.");

  console.log("");
  if (failures.length) {
    console.error(failures.length + " fout(en) van " + checks + " controles:");
    failures.forEach(function (f) { console.error(" - " + f); });
    process.exit(1);
  }
  console.log("OK: " + checks + " controles, 0 fouten.");
}

main().catch(function (fout) {
  console.error(fout && fout.stack || fout);
  process.exit(1);
});
