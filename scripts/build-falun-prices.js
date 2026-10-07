#!/usr/bin/env node
/* ==========================================================================
   Falun: customer surcharges per group size.

   website/data/falun-prijzen.json is public (the browser fetches it and the
   server reads it), so it may only hold customer prices. What the cabins and
   the rental car cost lives in a private file outside the website and outside
   git:

     brand_assets/purchase-prices/falun-costs.json   (brand_assets/ is ignored)

   This script reads that file and writes the block "groepsToeslag" in the
   public JSON: for every group size from 1 up to personen.max, the amount in
   euros per person

     nacht       a normal night, compared with the price for basisPersonen
     nachtDatum  nights on a specific date that differ from a normal night
     autoPerDag  the rental car, per day

   The numbers are the exact result of the old calculation (cabin share,
   exchange rate, pass-on rule), at full floating point precision, so that
   the prices on screen and at checkout do not change by one cent. The
   browser (js/falun-kalender.js) and the server (api/_falun-prijs.js) only
   add these customer amounts up; neither knows a cost.

   Usage (from the repo root):
     node scripts/build-falun-prices.js            write the block
     node scripts/build-falun-prices.js --check    only check; exit 1 on any
                                                   mismatch
     --costs <file>  (or env NOVAKSE_FALUN_COSTS) another private file

   The words that must never appear in the public file (supplier name, cost
   field names) are read from the private file only: its top-level cost
   fields plus its list "forbiddenPublicTerms". This script holds no such
   list, so it can live in a public repository.

   Without the private file, --check still validates the public block (all
   group sizes present, finite numbers), but skips the forbidden-word check.
   ========================================================================== */
"use strict";

var fs = require("fs");
var path = require("path");
var childProcess = require("child_process");

var REPO = path.resolve(__dirname, "..");
var PUBLIC_FILE = path.join(REPO, "website", "data", "falun-prijzen.json");
var PRIVATE_RELATIVE = path.join("brand_assets", "purchase-prices", "falun-costs.json");
var BLOCK_KEY = "groepsToeslag";
// Key in the private file with extra words that must never be public.
var TERMS_KEY = "forbiddenPublicTerms";

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
  var explicit = argValue("--costs") || process.env.NOVAKSE_FALUN_COSTS || "";
  if (explicit) return fs.existsSync(explicit) ? explicit : "";
  var candidates = [path.join(REPO, PRIVATE_RELATIVE)];
  var main = mainCheckout();
  if (main && path.resolve(main) !== REPO) candidates.push(path.join(main, PRIVATE_RELATIVE));
  for (var i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) return candidates[i];
  }
  return "";
}

function isNumber(value) {
  return typeof value === "number" && isFinite(value);
}

/* Words that must not appear in the public file, taken only from the private
   file: every top-level field name (except notes starting with "_" and the
   list key itself) plus the strings in its forbiddenPublicTerms list. */
function forbiddenTerms(costs) {
  var terms = Object.keys(costs).filter(function (key) {
    return key.charAt(0) !== "_" && key !== TERMS_KEY;
  });
  var extra = Array.isArray(costs[TERMS_KEY]) ? costs[TERMS_KEY] : [];
  extra.forEach(function (term) {
    if (typeof term === "string" && term.trim()) terms.push(term.trim());
  });
  return terms;
}

/* The surcharge rows, calculated exactly like the old browser and server code
   did (same expressions, same order), so every double is bit for bit the
   same as before. */
function buildRows(costs, personenMax) {
  var basePersons = costs.basePersons;
  var cabinMax = costs.cabinMaxPersons || 0;
  var rate = costs.exchangeRateSEK || 1;
  var baseSEK = isNumber(costs.cabinBaseSEK) ? costs.cabinBaseSEK : 0;
  var carPerDay = isNumber(costs.carPerDayEUR) ? costs.carPerDayEUR : 0;
  var passOn = isNumber(costs.passOnShare) ? costs.passOnShare : 1;
  var nights = costs.cabinPerNightSEK || {};

  function perCabin(n) {
    if (!cabinMax || n <= cabinMax) return n;
    return n / Math.ceil(n / cabinMax);
  }
  function damp(difference) {
    return difference > 0 ? difference : difference * passOn;
  }
  function night(n, sek) {
    if (!baseSEK) return 0;
    return damp(sek / rate / perCabin(n) - baseSEK / rate / basePersons);
  }
  function car(n) {
    var whole = carPerDay * 1;
    if (!whole) return 0;
    var base = whole / basePersons;
    return base + damp(whole / perCabin(n) - base);
  }

  var rows = {};
  for (var n = 1; n <= personenMax; n++) {
    var dates = {};
    Object.keys(nights).sort().forEach(function (date) {
      if (isNumber(nights[date])) dates[date] = night(n, nights[date]);
    });
    rows[String(n)] = { nacht: night(n, baseSEK), nachtDatum: dates, autoPerDag: car(n) };
  }
  return rows;
}

function formatBlock(rows) {
  var lines = ['  "' + BLOCK_KEY + '": {'];
  var keys = Object.keys(rows);
  keys.forEach(function (key, index) {
    var row = rows[key];
    var dates = Object.keys(row.nachtDatum).map(function (date) {
      return JSON.stringify(date) + ": " + JSON.stringify(row.nachtDatum[date]);
    }).join(", ");
    lines.push('    "' + key + '": { "nacht": ' + JSON.stringify(row.nacht) +
      ', "nachtDatum": {' + (dates ? " " + dates + " " : "") + '}' +
      ', "autoPerDag": ' + JSON.stringify(row.autoPerDag) + " }" + (index < keys.length - 1 ? "," : ""));
  });
  lines.push("  }");
  return lines;
}

// Line range [start, end] of the block in the public file text, or null.
function findBlock(lines) {
  var start = -1;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('  "' + BLOCK_KEY + '": {') === 0) { start = i; break; }
  }
  if (start === -1) return null;
  for (var j = start + 1; j < lines.length; j++) {
    if (/^  \},?\s*$/.test(lines[j])) return { start: start, end: j, comma: /,\s*$/.test(lines[j]) };
  }
  return null;
}

function checkPublic(data, text, terms) {
  var problems = [];
  var max = data.personen && data.personen.max;
  var base = data.basisPersonen;
  if (!isNumber(max) || !isNumber(base)) problems.push("personen.max or basisPersonen missing");
  var block = data[BLOCK_KEY];
  if (!block || typeof block !== "object") {
    problems.push("no " + BLOCK_KEY);
    return problems;
  }
  for (var n = 1; n <= max; n++) {
    var row = block[String(n)];
    if (!row) { problems.push("group size " + n + " missing"); continue; }
    if (!isNumber(row.nacht)) problems.push(n + ": nacht is not a number");
    if (!isNumber(row.autoPerDag)) problems.push(n + ": autoPerDag is not a number");
    if (!row.nachtDatum || typeof row.nachtDatum !== "object") problems.push(n + ": nachtDatum missing");
    else Object.keys(row.nachtDatum).forEach(function (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isNumber(row.nachtDatum[date])) problems.push(n + ": bad nachtDatum " + date);
    });
  }
  var baseRow = block[String(base)];
  if (baseRow && (baseRow.nacht !== 0)) problems.push("basisPersonen row: nacht should be 0, is " + baseRow.nacht);
  var lower = text.toLowerCase();
  (terms || []).forEach(function (term) {
    if (lower.indexOf(term.toLowerCase()) !== -1) problems.push("forbidden word in the public file: " + term);
  });
  return problems;
}

function main() {
  var checkOnly = process.argv.indexOf("--check") !== -1;
  var text = fs.readFileSync(PUBLIC_FILE, "utf8");
  var data = JSON.parse(text);
  var costsFile = findPrivateFile();
  var costs = costsFile ? JSON.parse(fs.readFileSync(costsFile, "utf8")) : null;
  var terms = costs ? forbiddenTerms(costs) : [];
  var problems = checkPublic(data, text, terms);

  if (!costs) {
    console.log("Private cost file not found (" + PRIVATE_RELATIVE + "); only the public block was checked, no forbidden-word check.");
    if (!checkOnly) { console.error("Nothing written."); process.exit(1); }
  } else {
    var max = data.personen && data.personen.max;
    if (!isNumber(max) || !isNumber(costs.basePersons) || costs.basePersons !== data.basisPersonen) {
      problems.push("basePersons of the private file must equal basisPersonen of the public file");
    } else {
      var rows = buildRows(costs, max);
      var wanted = formatBlock(rows);
      var lines = text.split("\n");
      var range = findBlock(lines);
      if (!range) {
        problems.push('no "' + BLOCK_KEY + '" block in the public file to write into');
      } else {
        var current = lines.slice(range.start, range.end + 1);
        var next = wanted.slice();
        if (range.comma) next[next.length - 1] += ",";
        if (current.join("\n") !== next.join("\n")) {
          if (checkOnly) {
            problems.push("the public " + BLOCK_KEY + " block differs from the private costs; run the script without --check");
          } else {
            lines.splice.apply(lines, [range.start, current.length].concat(next));
            fs.writeFileSync(PUBLIC_FILE, lines.join("\n"));
            console.log("Wrote " + BLOCK_KEY + " for 1 to " + max + " people.");
            // Re-check the written file.
            var written = fs.readFileSync(PUBLIC_FILE, "utf8");
            problems = checkPublic(JSON.parse(written), written, terms);
          }
        } else if (!checkOnly) {
          console.log(BLOCK_KEY + " is already up to date.");
        }
      }
    }
  }

  if (problems.length) {
    problems.forEach(function (p) { console.error("PROBLEM: " + p); });
    process.exit(1);
  }
  console.log("OK");
}

main();
