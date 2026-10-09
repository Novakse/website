#!/usr/bin/env node
/* ==========================================================================
   Customer prices of the optional activities at checkout.

   website/data/activiteiten.json is public (the browser fetches it, and the
   GitHub repo is public too), so it may only hold customer prices. The
   purchase prices and the markup live in a private file outside the website
   and outside git:

     brand_assets/purchase-prices/activities.json   (brand_assets/ is ignored)

   This script reads that file and writes the customer price of every line
   into the public JSON:

     eur = purchase price + markupPercent, rounded UP to a whole euro

   computed in whole cents, so there is no floating point rounding. Texts,
   the order of the activities and limits in the public JSON stay as they
   are; only "eur" is written (and a stray "sek" removed).

   Public layout: <trip>.activiteiten is one flat list of activities. Each
   activity has "tarieven" (the price lines of the activity itself, for
   example per age group; may be empty when the activity is free) and
   optionally "huur" (rental lines shown under that activity).

   Other top-level keys (except "_opmerking") must be aliases such as
   "groepsreis-orsa": { "gelijkAan": "falun" }: they use that trip's list and
   prices, hold no lines of their own and are never written here, only
   checked.

   A purchase record with "offered": false is kept in the private file for
   reference but is not sold: it must not appear on the site, and it is
   never written to the public JSON.

   Usage (from the repo root):
     node scripts/build-activity-prices.js            write the prices
     node scripts/build-activity-prices.js --check    only check; exit 1 on
                                                      any mismatch
     --purchase <file>  (or env NOVAKSE_PURCHASE_PRICES) another private file

   Without the private file, --check still checks the public JSON itself
   (whole euros, no SEK or purchase fields, valid activities and limits).
   The browser (uitchecken.html) and the server (api/create-payment.js) both
   price with js/activiteiten-prijs.js on the public JSON, so they always
   charge exactly what this script wrote.
   ========================================================================== */
"use strict";

var fs = require("fs");
var path = require("path");
var childProcess = require("child_process");

var REPO = path.resolve(__dirname, "..");
var PUBLIC_FILE = path.join(REPO, "website", "data", "activiteiten.json");
var PRIVATE_RELATIVE = path.join("brand_assets", "purchase-prices", "activities.json");
var TRIPS = ["falun", "wellness"];
// Fields that must never appear on a line in the public file.
var FORBIDDEN_FIELDS = ["sek", "purchaseEur", "purchase", "inkoop", "inkoopEur", "markup", "markupPercent", "opslag", "offered", "source", "label"];
// Fields of the old layout (groups with sections); they must be gone.
var OLD_FIELDS = ["groepen", "secties", "sectie", "regels", "info"];
var UNITS = ["persoonDag", "persoon", "scooter"];
var ID_PATTERN = /^[a-z0-9-]{1,40}$/;

function argValue(name) {
  var index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] || "";
}

// The main checkout when this runs in a git worktree (brand_assets/ is not
// shared between worktrees), otherwise "".
function mainCheckout() {
  try {
    var common = childProcess.execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
      cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    return common ? path.dirname(common) : "";
  } catch (error) {
    return "";
  }
}

function findPrivateFile() {
  var explicit = argValue("--purchase") || process.env.NOVAKSE_PURCHASE_PRICES || "";
  if (explicit) return fs.existsSync(explicit) ? explicit : "";
  var candidates = [path.join(REPO, PRIVATE_RELATIVE)];
  var main = mainCheckout();
  if (main && path.resolve(main) !== REPO) candidates.push(path.join(main, PRIVATE_RELATIVE));
  for (var i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) return candidates[i];
  }
  return "";
}

// Purchase euros -> whole cents. Refuses anything that is not a positive
// amount with at most two decimals.
function toCents(eur) {
  if (typeof eur !== "number" || !isFinite(eur) || eur <= 0) return null;
  var cents = Math.round(eur * 100);
  return Math.abs(cents - eur * 100) < 1e-6 ? cents : null;
}

// Customer price in whole euros: purchase + markup, rounded up. Integer
// arithmetic: cents * (100 + markup) is the sale price in 1/10000 euro.
function salePrice(purchaseEur, markupPercent) {
  var cents = toCents(purchaseEur);
  if (cents === null) return null;
  var numerator = cents * (100 + markupPercent);
  return Math.floor((numerator + 9999) / 10000);
}

function activitiesOf(catalogue, trip) {
  var section = catalogue[trip];
  return section && Array.isArray(section.activiteiten) ? section.activiteiten : [];
}

// Every priced line of a trip: the tariffs of each activity, then its rentals.
function eachLine(catalogue, callback) {
  TRIPS.forEach(function (trip) {
    activitiesOf(catalogue, trip).forEach(function (activity) {
      ["tarieven", "huur"].forEach(function (kind) {
        (activity && Array.isArray(activity[kind]) ? activity[kind] : []).forEach(function (line) {
          callback(trip, activity, line, kind);
        });
      });
    });
  });
}

function isText(value) {
  return typeof value === "string" && value.trim() !== "";
}

// Checks of the public file on its own. Returns a list of problems.
function checkPublic(catalogue) {
  var problems = [];
  // Aliases: only { "gelijkAan": <one of TRIPS> }, nothing else.
  Object.keys(catalogue).forEach(function (key) {
    if (key.charAt(0) === "_" || TRIPS.indexOf(key) !== -1) return;
    var alias = catalogue[key];
    var fields = alias && typeof alias === "object" && !Array.isArray(alias) ? Object.keys(alias) : [];
    if (!ID_PATTERN.test(key) || fields.length !== 1 || fields[0] !== "gelijkAan" || TRIPS.indexOf(alias.gelijkAan) === -1) {
      problems.push(key + ": unknown trip; an alias holds only \"gelijkAan\": one of " + TRIPS.join(", "));
    }
  });
  TRIPS.forEach(function (trip) {
    var section = catalogue[trip];
    if (!section || !Array.isArray(section.activiteiten) || !section.activiteiten.length) {
      problems.push(trip + ": no activiteiten");
      return;
    }
    Object.keys(section).forEach(function (field) {
      if (OLD_FIELDS.indexOf(field) !== -1) problems.push(trip + ": old field \"" + field + "\"");
    });
    var activityIds = Object.create(null);
    var lineIds = Object.create(null);
    section.activiteiten.forEach(function (activity, index) {
      var here = trip + "/" + (activity && activity.id ? activity.id : "#" + index);
      if (!activity || typeof activity !== "object") {
        problems.push(here + ": not an object");
        return;
      }
      if (!(typeof activity.id === "string" && ID_PATTERN.test(activity.id))) problems.push(here + ": invalid id");
      if (activityIds[activity.id]) problems.push(here + ": duplicate activity id");
      activityIds[activity.id] = true;
      if (!isText(activity.naam)) problems.push(here + ": naam missing");
      ["detail", "gratis", "huurInfo"].forEach(function (field) {
        if (activity[field] !== undefined && !isText(activity[field])) problems.push(here + ": " + field + " must be text");
      });
      Object.keys(activity).forEach(function (field) {
        if (OLD_FIELDS.indexOf(field) !== -1) problems.push(here + ": old field \"" + field + "\"");
        if (FORBIDDEN_FIELDS.indexOf(field) !== -1) problems.push(here + ": field \"" + field + "\" may not be public");
      });
      var tariffs = activity.tarieven;
      var rentals = activity.huur === undefined ? [] : activity.huur;
      if (!Array.isArray(tariffs)) problems.push(here + ": tarieven must be a list (may be empty)");
      if (!Array.isArray(rentals)) problems.push(here + ": huur must be a list");
      tariffs = Array.isArray(tariffs) ? tariffs : [];
      rentals = Array.isArray(rentals) ? rentals : [];
      if (!tariffs.length && !rentals.length) problems.push(here + ": nothing to book");
      if (activity.huurInfo !== undefined && !rentals.length) problems.push(here + ": huurInfo without huur");
      var defaults = tariffs.filter(function (line) { return line && line.standaard === true; }).length;
      if (defaults > 1) problems.push(here + ": more than one standaard tariff");

      [["tarieven", tariffs], ["huur", rentals]].forEach(function (pair) {
        pair[1].forEach(function (line) {
          var where = here + "/" + pair[0] + "/" + (line && line.id);
          if (!line || typeof line !== "object") {
            problems.push(where + ": not an object");
            return;
          }
          if (!(typeof line.id === "string" && ID_PATTERN.test(line.id))) problems.push(where + ": invalid id");
          if (lineIds[line.id]) problems.push(where + ": duplicate id");
          lineIds[line.id] = true;
          if (!(typeof line.eur === "number" && line.eur > 0 && Math.floor(line.eur) === line.eur)) {
            problems.push(where + ": eur must be a whole number of euros above 0 (is " + line.eur + ")");
          }
          if (UNITS.indexOf(line.eenheid) === -1) problems.push(where + ": unknown eenheid \"" + line.eenheid + "\"");
          // A rental, or one of several tariffs, needs its own name; the
          // single tariff of an activity may use the activity's name.
          var needsName = pair[0] === "huur" || tariffs.length > 1;
          if (line.naam !== undefined ? !isText(line.naam) : needsName) problems.push(where + ": naam missing");
          if (line.detail !== undefined && !isText(line.detail)) problems.push(where + ": detail must be text");
          if (line.standaard !== undefined && (pair[0] !== "tarieven" || line.standaard !== true)) {
            problems.push(where + ": standaard is only for one tariff (true)");
          }
          Object.keys(line).forEach(function (field) {
            if (FORBIDDEN_FIELDS.indexOf(field) !== -1) problems.push(where + ": field \"" + field + "\" may not be public");
            if (OLD_FIELDS.indexOf(field) !== -1) problems.push(where + ": old field \"" + field + "\"");
          });
          var limits = Array.isArray(line.limiet) ? line.limiet : (line.limiet === undefined ? [] : [line.limiet]);
          limits.forEach(function (limit) {
            if (typeof limit !== "string" || !limit) problems.push(where + ": invalid limiet");
          });
        });
      });
    });
  });
  return problems;
}

/* ---- Output in the same layout as the hand-written file: two spaces, one
   line per price line (tarieven, huur), a blank line between the top-level
   keys. ------------------------------------------------------------------- */
function inline(value) {
  if (Array.isArray(value)) return "[" + value.map(inline).join(", ") + "]";
  if (value && typeof value === "object") {
    return "{ " + Object.keys(value).map(function (key) {
      return JSON.stringify(key) + ": " + inline(value[key]);
    }).join(", ") + " }";
  }
  return JSON.stringify(value);
}

function format(value, indent, key) {
  var pad = "  ".repeat(indent);
  var inner = "  ".repeat(indent + 1);
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    var oneLine = key === "tarieven" || key === "huur";
    return "[\n" + value.map(function (item) {
      return inner + (oneLine ? inline(item) : format(item, indent + 1));
    }).join(",\n") + "\n" + pad + "]";
  }
  if (value && typeof value === "object") {
    var keys = Object.keys(value);
    if (!keys.length) return "{}";
    var separator = indent === 0 ? ",\n\n" : ",\n";
    return "{\n" + keys.map(function (k) {
      return inner + JSON.stringify(k) + ": " + format(value[k], indent + 1, k);
    }).join(separator) + "\n" + pad + "}";
  }
  return JSON.stringify(value);
}

function main() {
  var checkOnly = process.argv.indexOf("--check") !== -1;
  var publicText = fs.readFileSync(PUBLIC_FILE, "utf8");
  var catalogue = JSON.parse(publicText);
  var problems = [];
  var skipped = []; // private records marked "offered": false

  var privateFile = findPrivateFile();
  if (!privateFile) {
    if (!checkOnly) {
      console.error("Private purchase prices not found (" + PRIVATE_RELATIVE + "). Nothing written.");
      process.exit(1);
    }
    console.warn("Note: private purchase prices not found; only the public file is checked.");
  } else {
    var purchase = JSON.parse(fs.readFileSync(privateFile, "utf8"));
    var markup = purchase.markupPercent;
    if (!(typeof markup === "number" && isFinite(markup) && markup >= 0 && Math.floor(markup) === markup)) {
      console.error("markupPercent in the private file must be a whole number.");
      process.exit(1);
    }
    var used = Object.create(null);
    eachLine(catalogue, function (trip, activity, line) {
      var where = trip + "/" + activity.id + "/" + line.id;
      var entry = purchase[trip] && Object.prototype.hasOwnProperty.call(purchase[trip], line.id) ? purchase[trip][line.id] : null;
      used[trip + "/" + line.id] = true;
      if (!entry) {
        problems.push(where + ": no purchase price in the private file");
        return;
      }
      if (entry.offered === false) {
        problems.push(where + ": marked \"offered\": false in the private file, remove it from the site");
        return;
      }
      var sale = salePrice(entry.purchaseEur, markup);
      if (sale === null) {
        problems.push(where + ": invalid purchaseEur " + entry.purchaseEur);
        return;
      }
      if (checkOnly) {
        if (line.eur !== sale) problems.push(where + ": eur is " + line.eur + ", should be " + sale);
      } else {
        line.eur = sale;
        delete line.sek;
      }
    });
    // Records marked "offered": false are kept for reference only.
    TRIPS.forEach(function (trip) {
      Object.keys(purchase[trip] || {}).forEach(function (id) {
        var record = purchase[trip][id];
        if (record && record.offered === false) {
          skipped.push(trip + "/" + id);
          return;
        }
        if (record && record.offered !== undefined && record.offered !== true) {
          problems.push(trip + "/" + id + ": offered must be true or false");
        }
        if (!used[trip + "/" + id]) problems.push(trip + "/" + id + ": in the private file but not on the site");
      });
    });
  }

  problems = problems.concat(checkPublic(catalogue));
  if (problems.length) {
    console.error(problems.join("\n"));
    console.error(problems.length + " problem(s)." + (checkOnly ? "" : " Nothing written."));
    process.exit(1);
  }

  if (skipped.length) console.log("Not offered (kept private, not on the site): " + skipped.join(", "));
  if (checkOnly) {
    console.log("OK: website/data/activiteiten.json matches" + (privateFile ? " the purchase prices." : " its own rules."));
    return;
  }
  var output = format(catalogue, 0) + "\n";
  if (output === publicText) {
    console.log("website/data/activiteiten.json is already up to date.");
  } else {
    fs.writeFileSync(PUBLIC_FILE, output);
    console.log("Wrote website/data/activiteiten.json.");
  }
}

module.exports = { salePrice: salePrice, checkPublic: checkPublic, format: format, eachLine: eachLine };

if (require.main === module) main();
