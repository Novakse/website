#!/usr/bin/env node
/* ==========================================================================
   Travel guide ("reisgids"): the owner's tool for the private location data
   and the personal customer links. Messages are in Dutch, for the owner.

   The readable data lives outside git:
     brand_assets/reisgids/reisgids.json   (brand_assets/ is ignored)
   The site only gets an encrypted copy, safe to commit:
     website/api/_reisgids-data.js         (AES-256-GCM)
   The key is REISGIDS_GEHEIM: in website/.env locally, and in the Vercel
   project settings (Production) live. A value in the environment wins over
   website/.env, as in website/dev-server.js.

   Usage (from the repo root):
     node scripts/reisgids.js geheim [--toon]
     node scripts/reisgids.js bouw
     node scripts/reisgids.js link --naam "Familie Jansen" --reis falun,orsa --tot 2027-02-20 [--basis http://localhost:3000]
     node scripts/reisgids.js check <code or link>
   Extra options:
     --env <file>   another .env file (default website/.env)
     --bron <file>  another readable data file for bouw and check
                    (default brand_assets/reisgids/reisgids.json)
     --data <file>  another encrypted data file for bouw, link and check
                    (default website/api/_reisgids-data.js; for tests)

   Not known yet? Write "[INVULLEN ...]" in the text. bouw still builds and
   lists every place where it is left. Live (Vercel production) the API hides
   every journey step with such text; regions and places are NOT hidden.
   ========================================================================== */

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

var ROOT = path.join(__dirname, "..");
var SITE_DIR = path.join(ROOT, "website");
var DEFAULT_ENV = path.join(SITE_DIR, ".env");
var DEFAULT_SOURCE = path.join(ROOT, "brand_assets", "reisgids", "reisgids.json");
var DATA_FILE = path.join(SITE_DIR, "api", "_reisgids-data.js");
var PRODUCTION_BASE = "https://www.novakse.com";

var rc = require(path.join(SITE_DIR, "api", "_reisgids-crypto.js"));

var PLACE_TYPES = ["verblijf", "opstap", "schaatsen", "skien", "langlauf", "husky", "sneeuwscooter", "bezienswaardigheid", "dalahast", "supermarkt", "restaurant", "ziekenhuis", "nooddienst", "vliegveld", "autoverhuur", "boot", "begeleiding", "overig"];
// Own pin drawing for a place (instead of the one of its kind), names in website/reisgids/js/illustraties.js.
var PIN_TYPES = ["pinGondel", "pinKruisski", "pinSlalom", "pinSnowboard", "pinStadshuset", "pinPaleis", "pinGamlaStan", "pinVasa", "pinSkansen"];
var TOP_FIELDS = ["ingetrokken", "regios", "reisverlopen"];
var REGION_FIELDS = ["id", "naam", "reizen", "centrum", "zoom", "plekken", "intro", "ondertitel"];
// "klein": true gives a less important place a small pin (dalahast, supermarkt, restaurant and bezienswaardigheid always have one).
var PLACE_FIELDS = ["id", "soort", "pin", "klein", "naam", "coord", "adres", "info", "tip", "telefoon", "reistijd", "reistijden", "link", "reizen", "banen", "markeringen", "fotos"];
// Photos of a place: { "beeld": "<name in website/images/ without size or extension>", "alt": "...", "focus": "50% 60%", "sfeerbeeld": true }.
// "sfeerbeeld": the photo was not taken at this place. bouw adds the sizes it finds ("breedtes").
// Phone numbers of a place (hospitals): [{ "label": "Centrale van het ziekenhuis", "nummer": "+46 23 49 20 00" }].
// "nummer": international with + (or a short national number such as 112 or 116117); the app makes it a tap-to-call link.
var PHONE_FIELDS = ["label", "nummer"];
var PHONE_PATTERN = /^(\+\d{1,3}[\d ]{5,16}\d|\d{3,6})$/;
var PHONE_MAX = 5;
var PHOTO_FIELDS = ["beeld", "alt", "focus", "sfeerbeeld"];
var PHOTO_FORMATS = ["jpg", "webp", "avif"];
var PHOTO_MAX = 6;
var IMAGES_DIR = path.join(SITE_DIR, "images");
// Driving time from an accommodation of the same region: { "vanaf": "<id of a verblijf>", "duur": "ca. 45 min" }.
var TRAVEL_FIELDS = ["vanaf", "duur"];
var SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Swept ice tracks and the points along them, inside a place.
var TRACK_FIELDS = ["naam", "lengte", "kleur", "lijn"];
var TRACK_COLOURS = ["blauw", "groen", "rood", "oranje", "zwart", "paars"];
var MARKER_FIELDS = ["naam", "soort", "coord", "info"];
var MARKER_TYPES = ["km", "hulpdiensten", "parkeren", "rustplek", "bestemming", "overig"];

// Step-by-step journeys ("reisverlopen"), next to the regions.
var JOURNEY_FIELDS = ["id", "naam", "reizen", "stappen"];
var STEP_FIELDS = ["id", "soort", "titel", "tekst", "lijst", "groepen", "tip", "plekken", "punten", "route", "navigatie"];
var STEP_TYPES = ["paklijst", "vertrek", "vliegveld", "shuttle", "autoverhuur", "rijden", "inchecken", "overig"];
var GROUP_FIELDS = ["titel", "items"];
var POINT_FIELDS = ["naam", "soort", "coord"];
var POINT_TYPES = ["vliegveld", "bushalte", "autoverhuur", "verblijf", "parkeren", "overig"];
var ROUTE_FIELDS = ["modus", "lijn", "afstand", "duur"];
var ROUTE_MODES = ["lopen", "bus", "auto", "vlucht"];
var NAV_FIELDS = ["modus", "naar", "van"];
var NAV_MODES = ["lopen", "auto", "ov"];

// Maximum lengths (characters) and line sizes.
var LIMITS = { title: 80, text: 1200, item: 300, short: 60, trackLength: 40, markerInfo: 300, routePoints: 2000, alt: 200 };

// Options each command accepts; true = a switch without a value.
var COMMAND_OPTIONS = {
  geheim: { env: false, toon: true },
  bouw: { env: false, bron: false, data: false },
  link: { env: false, naam: false, reis: false, tot: false, basis: false, data: false },
  check: { env: false, bron: false, data: false }
};

var DATA_HEADER =
  "/* GENERATED by `node scripts/reisgids.js bouw`. Do not edit by hand.\n" +
  "   Encrypted travel-guide data (AES-256-GCM, key from REISGIDS_GEHEIM).\n" +
  "   The readable source stays outside git; see scripts/reisgids.js. */\n";

/* ---------- small helpers ---------- */

function fail(message) {
  console.error("Fout: " + message);
  process.exit(1);
}

function shown(file) {
  var rel = path.relative(ROOT, file);
  return rel && rel.indexOf("..") !== 0 ? rel : file;
}

function count(n, one, many) {
  return n + " " + (n === 1 ? one : many);
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isInside(file, dir) {
  var rel = path.relative(dir, file);
  return rel === "" || (rel.indexOf("..") !== 0 && !path.isAbsolute(rel));
}

function parseArgs(argv) {
  var command = argv[0] || "";
  var allowed = COMMAND_OPTIONS[command] || {};
  var options = {};
  var positional = [];
  for (var i = 1; i < argv.length; i++) {
    var arg = argv[i];
    if (arg.indexOf("--") !== 0) {
      positional.push(arg);
      continue;
    }
    var eq = arg.indexOf("=");
    var name = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
    if (!Object.prototype.hasOwnProperty.call(allowed, name)) {
      fail("onbekende optie --" + name + " bij \"" + command + "\". Zie: node scripts/reisgids.js");
    }
    var value;
    if (allowed[name]) {
      if (eq !== -1) fail("--" + name + " heeft geen waarde.");
      value = true;
    } else if (eq !== -1) {
      value = arg.slice(eq + 1);
    } else {
      value = argv[i + 1];
      i++;
      if (value === undefined || value.indexOf("--") === 0) fail("--" + name + " heeft een waarde nodig.");
    }
    options[name] = value;
  }
  return { command: command, options: options, positional: positional };
}

function envPath(options) {
  return options.env ? path.resolve(options.env) : DEFAULT_ENV;
}

function sourcePath(options) {
  return options.bron ? path.resolve(options.bron) : DEFAULT_SOURCE;
}

function dataPath(options) {
  if (!options.data) return DATA_FILE;
  if (path.extname(options.data) !== ".js") fail("--data moet een .js-bestand zijn.");
  return path.resolve(options.data);
}

/* The lines of an .env file and where REISGIDS_GEHEIM is, read the same
   way as website/dev-server.js (first occurrence wins, no quotes). */
function readEnv(file) {
  var text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  var result = { exists: text !== null, text: text || "", index: -1, value: "" };
  result.text.split("\n").forEach(function (line, i) {
    var trimmed = line.trim();
    if (!trimmed || trimmed.indexOf("#") === 0 || result.index !== -1) return;
    var eq = trimmed.indexOf("=");
    if (eq === -1) return;
    if (trimmed.slice(0, eq).trim() !== "REISGIDS_GEHEIM") return;
    result.index = i;
    result.value = trimmed.slice(eq + 1).trim();
  });
  return result;
}

/* The secret and where it came from; stops with a clear message when there
   is none or it is unusable. */
function requireSecret(options) {
  var file = envPath(options);
  var secret = String(process.env.REISGIDS_GEHEIM || "").trim();
  var source = "de omgeving (REISGIDS_GEHEIM)";
  if (!secret) {
    secret = readEnv(file).value;
    source = shown(file);
  }
  if (!secret) {
    fail("geen REISGIDS_GEHEIM gevonden in " + shown(file) + ". Maak er eerst een met: node scripts/reisgids.js geheim");
  }
  try {
    rc.keysFromSecret(secret);
  } catch (fout) {
    fail("REISGIDS_GEHEIM uit " + source + " is te kort of ongeldig. Gebruik een geheim van: node scripts/reisgids.js geheim");
  }
  return { secret: secret, source: source };
}

/* The decrypted data from the encrypted data file, or null. */
function readEncryptedData(secret, file) {
  try {
    delete require.cache[require.resolve(file)];
    return rc.decryptJson(require(file), secret);
  } catch (fout) {
    return null;
  }
}

/* Width in pixels from a JPEG's frame header, or 0. */
function jpegWidth(file) {
  var buf;
  try { buf = fs.readFileSync(file); } catch (fout) { return 0; }
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return 0;
  var i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return 0;
    var marker = buf[i + 1];
    if (marker === 0xff) { i++; continue; } // fill byte
    // SOF0-SOF15, except DHT (c4), JPG (c8) and DAC (cc): length, precision, height, width
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return buf.readUInt16BE(i + 7);
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return 0;
}

/* The sizes of a site photo, as on the rest of the site: "<beeld>-480.jpg",
   "-800", ... plus "<beeld>.jpg" as the largest, each also as webp and avif.
   { breedtes: [480, 800, 1200], missing: ["<file>", ...] }; no base jpg = no sizes. */
function photoSizes(beeld) {
  var names;
  try { names = fs.readdirSync(IMAGES_DIR); } catch (fout) { names = []; }
  var base = jpegWidth(path.join(IMAGES_DIR, beeld + ".jpg"));
  if (!base) return { breedtes: [], missing: ["website/images/" + beeld + ".jpg"] };
  var pattern = new RegExp("^" + beeld + "-(\\d+)\\.jpg$");
  var sizes = [];
  names.forEach(function (name) {
    var m = pattern.exec(name);
    if (m && +m[1] < base) sizes.push({ width: +m[1], file: beeld + "-" + m[1] });
  });
  sizes.sort(function (a, b) { return a.width - b.width; });
  sizes.push({ width: base, file: beeld });
  var missing = [];
  sizes.forEach(function (size) {
    PHOTO_FORMATS.forEach(function (format) {
      if (names.indexOf(size.file + "." + format) === -1) missing.push("website/images/" + size.file + "." + format);
    });
  });
  return { breedtes: sizes.map(function (size) { return size.width; }), missing: missing };
}

/* Adds the sizes of every place photo ("breedtes") for the app. */
function addPhotoSizes(clean) {
  clean.regios.forEach(function (regio) {
    regio.plekken.forEach(function (plek) {
      (plek.fotos || []).forEach(function (foto) { foto.breedtes = photoSizes(foto.beeld).breedtes; });
    });
  });
}

/* ---------- validation of reisgids.json ---------- */

function validateGuide(data) {
  var errors = [];
  var warnings = [];
  var ids = {}; // every region, place and journey id -> where it is
  var placeTrips = {}; // place id -> { region: trips of its region, own: its own trips or null }

  function err(where, message) { errors.push(where + ": " + message); }

  function label(base, obj) {
    return base + (obj && typeof obj.id === "string" ? " (" + obj.id + ")" : "");
  }

  function unknownFields(obj, fields, where) {
    Object.keys(obj).forEach(function (key) {
      if (key.charAt(0) === "_") return; // private note, allowed anywhere
      if (fields.indexOf(key) === -1) {
        err(where, "onbekend veld \"" + key + "\" (toegestaan: " + fields.join(", ") + "; privé-notities beginnen met _)");
      }
    });
  }

  function checkId(where, id, seen) {
    if (typeof id !== "string" || !SLUG_PATTERN.test(id)) {
      err(where, "id moet bestaan uit kleine letters, cijfers en streepjes (bijvoorbeeld \"verblijf-falun\")");
    } else if (seen[id]) {
      err(where, "id \"" + id + "\" komt vaker voor (ook bij " + seen[id] + ")");
    } else {
      seen[id] = where;
    }
  }

  function checkText(where, obj, field, required, max) {
    var value = obj[field];
    if (value === undefined) {
      if (required) err(where, "\"" + field + "\" ontbreekt");
      return;
    }
    if (typeof value !== "string" || !value.trim()) {
      err(where, "\"" + field + "\" moet een tekst zijn");
    } else if (max && value.length > max) {
      err(where, "\"" + field + "\" is te lang (" + value.length + " tekens, maximaal " + max + ")");
    }
  }

  // Optional; when present a list with at least one text.
  function checkTextList(where, obj, field, max) {
    var list = obj[field];
    if (list === undefined) return;
    if (!Array.isArray(list) || !list.length) {
      err(where, "\"" + field + "\" moet een lijst met minstens één tekst zijn, bijvoorbeeld [\"...\"]");
      return;
    }
    list.forEach(function (item, k) {
      if (typeof item !== "string" || !item.trim()) {
        err(where, "\"" + field + "\"[" + k + "] moet een tekst zijn");
      } else if (item.length > max) {
        err(where, "\"" + field + "\"[" + k + "] is te lang (" + item.length + " tekens, maximaal " + max + ")");
      }
    });
  }

  function checkChoice(where, obj, field, allowed) {
    if (allowed.indexOf(obj[field]) === -1) {
      err(where, "\"" + field + "\" " + JSON.stringify(obj[field]) + " is niet toegestaan (kies uit: " + allowed.join(", ") + ")");
    }
  }

  function checkTrips(where, list, field) {
    if (!Array.isArray(list) || !list.length) {
      err(where, "\"" + field + "\" moet een lijst met minstens één reis zijn, bijvoorbeeld [\"falun\"]");
      return [];
    }
    var good = [];
    list.forEach(function (trip, i) {
      if (typeof trip !== "string" || rc.TRIPS.indexOf(trip) === -1) {
        err(where, "onbekende reis " + JSON.stringify(trip) + " in \"" + field + "\" (kies uit: " + rc.TRIPS.join(", ") + ")");
      } else if (list.indexOf(trip) !== i) {
        err(where, "reis \"" + trip + "\" staat dubbel in \"" + field + "\"");
      } else {
        good.push(trip);
      }
    });
    return good;
  }

  function isCoord(value) {
    return Array.isArray(value) && value.length === 2 &&
      typeof value[0] === "number" && typeof value[1] === "number" &&
      isFinite(value[0]) && isFinite(value[1]) &&
      value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90;
  }

  // Every destination (Sweden, Finland, Austria) and every Dutch airport has
  // latitude > longitude. The other way round usually means the numbers were
  // copied as "lat, lng" (Google Maps order).
  function looksSwapped(value) { return value[0] > value[1]; }
  var SWAP_HINT = "lijkt omgedraaid; de volgorde is [lengtegraad, breedtegraad], Google Maps geeft juist breedtegraad eerst.";

  function checkCoord(where, field, value) {
    if (!isCoord(value)) {
      err(where, "\"" + field + "\" moet [lengtegraad, breedtegraad] met twee getallen zijn, bijvoorbeeld [15.63, 60.6]");
    } else if (looksSwapped(value)) {
      warnings.push(where + ": \"" + field + "\" " + JSON.stringify(value) + " " + SWAP_HINT);
    }
  }

  function checkLine(where, field, line) {
    if (!Array.isArray(line) || line.length < 2 || line.length > LIMITS.routePoints) {
      err(where, "\"" + field + "\" moet een lijst van 2 tot " + LIMITS.routePoints + " punten [lengtegraad, breedtegraad] zijn");
      return;
    }
    for (var k = 0; k < line.length; k++) {
      if (!isCoord(line[k])) {
        err(where, "\"" + field + "\" punt " + k + " is geen geldig [lengtegraad, breedtegraad] met twee getallen");
        return;
      }
    }
    var swapped = line.filter(looksSwapped).length;
    if (swapped) warnings.push(where + ": \"" + field + "\" (" + swapped + " van de " + line.length + " punten) " + SWAP_HINT);
  }

  // A plain object, or an error and false.
  function isObjectAt(where, value, example) {
    if (isPlainObject(value)) return true;
    err(where, "moet een object " + example + " zijn");
    return false;
  }

  function checkPhones(where, list) {
    if (list === undefined) return;
    if (!Array.isArray(list) || !list.length || list.length > PHONE_MAX) {
      err(where, "\"telefoon\" moet een lijst van 1 tot " + PHONE_MAX + " nummers zijn, bijvoorbeeld [{ \"label\": \"Centrale\", \"nummer\": \"+46 23 49 20 00\" }]");
      return;
    }
    list.forEach(function (item, k) {
      var at = where + " > telefoon[" + k + "]";
      if (!isObjectAt(at, item, "{ \"label\": \"...\", \"nummer\": \"...\" }")) return;
      unknownFields(item, PHONE_FIELDS, at);
      checkText(at, item, "label", true, LIMITS.title);
      if (typeof item.nummer !== "string" || !PHONE_PATTERN.test(item.nummer)) {
        err(at, "\"nummer\" moet internationaal zijn zoals \"+46 23 49 20 00\", of een kort nummer zoals \"112\"");
      }
    });
  }

  function checkTracks(where, banen) {
    if (banen === undefined) return;
    if (!Array.isArray(banen) || !banen.length) {
      err(where, "\"banen\" moet een lijst met minstens één baan zijn");
      return;
    }
    banen.forEach(function (baan, k) {
      var at = where + " > banen[" + k + "]";
      if (!isObjectAt(at, baan, "{ \"naam\", \"kleur\", \"lijn\" }")) return;
      unknownFields(baan, TRACK_FIELDS, at);
      checkText(at, baan, "naam", true, LIMITS.title);
      checkText(at, baan, "lengte", false, LIMITS.trackLength);
      checkChoice(at, baan, "kleur", TRACK_COLOURS);
      checkLine(at, "lijn", baan.lijn);
    });
  }

  function checkMarkers(where, markeringen) {
    if (markeringen === undefined) return;
    if (!Array.isArray(markeringen) || !markeringen.length) {
      err(where, "\"markeringen\" moet een lijst met minstens één markering zijn");
      return;
    }
    markeringen.forEach(function (markering, k) {
      var at = where + " > markeringen[" + k + "]";
      if (!isObjectAt(at, markering, "{ \"naam\", \"soort\", \"coord\" }")) return;
      unknownFields(markering, MARKER_FIELDS, at);
      checkText(at, markering, "naam", true, LIMITS.title);
      checkChoice(at, markering, "soort", MARKER_TYPES);
      checkCoord(at, "coord", markering.coord);
      checkText(at, markering, "info", false, LIMITS.markerInfo);
    });
  }

  function checkTravelTimes(where, reistijden) {
    if (reistijden === undefined) return;
    if (!Array.isArray(reistijden) || !reistijden.length) {
      err(where, "\"reistijden\" moet een lijst zijn, bijvoorbeeld [{ \"vanaf\": \"verblijf-orsa\", \"duur\": \"ca. 45 min\" }]");
      return;
    }
    reistijden.forEach(function (reistijd, k) {
      var at = where + " > reistijden[" + k + "]";
      if (!isObjectAt(at, reistijd, "{ \"vanaf\", \"duur\" }")) return;
      unknownFields(reistijd, TRAVEL_FIELDS, at);
      checkText(at, reistijd, "vanaf", true, 80);
      checkText(at, reistijd, "duur", true, 40);
    });
  }

  function checkPhotos(where, fotos) {
    if (fotos === undefined) return;
    if (!Array.isArray(fotos) || !fotos.length || fotos.length > PHOTO_MAX) {
      err(where, "\"fotos\" moet een lijst met 1 tot " + PHOTO_MAX + " foto's zijn, bijvoorbeeld [{ \"beeld\": \"orsa-cabins-winter\", \"alt\": \"...\" }]");
      return;
    }
    fotos.forEach(function (foto, k) {
      var at = where + " > fotos[" + k + "]";
      if (!isObjectAt(at, foto, "{ \"beeld\", \"alt\" }")) return;
      unknownFields(foto, PHOTO_FIELDS, at);
      checkText(at, foto, "alt", true, LIMITS.alt);
      if (typeof foto.beeld !== "string" || !SLUG_PATTERN.test(foto.beeld)) {
        err(at, "\"beeld\" moet de naam van een foto in website/images/ zijn, zonder maat en extensie (bijvoorbeeld \"orsa-cabins-winter\")");
      } else {
        var missing = photoSizes(foto.beeld).missing;
        if (missing.length) err(at, "foto \"" + foto.beeld + "\" mist " + missing.join(", "));
      }
      if (foto.focus !== undefined && (typeof foto.focus !== "string" || !/^\d{1,3}% \d{1,3}%$/.test(foto.focus))) {
        err(at, "\"focus\" moet zoiets als \"50% 60%\" zijn (links-rechts, boven-onder)");
      }
      if (foto.sfeerbeeld !== undefined && foto.sfeerbeeld !== true) {
        err(at, "\"sfeerbeeld\" mag alleen true zijn (of weglaten)");
      }
    });
  }

  function checkGroups(where, groepen) {
    if (groepen === undefined) return;
    if (!Array.isArray(groepen) || !groepen.length) {
      err(where, "\"groepen\" moet een lijst met minstens één groep zijn, bijvoorbeeld [{ \"titel\": \"Schaatsen\", \"items\": [\"schaatsen\"] }]");
      return;
    }
    groepen.forEach(function (groep, k) {
      var at = where + " > groepen[" + k + "]";
      if (!isObjectAt(at, groep, "{ \"titel\", \"items\" }")) return;
      unknownFields(groep, GROUP_FIELDS, at);
      checkText(at, groep, "titel", true, LIMITS.title);
      if (groep.items === undefined) err(at, "\"items\" ontbreekt");
      else checkTextList(at, groep, "items", LIMITS.item);
    });
  }

  function checkStepPlaces(where, list, journeyTrips) {
    if (list === undefined) return;
    if (!Array.isArray(list) || !list.length) {
      err(where, "\"plekken\" moet een lijst met minstens één plek-id zijn, bijvoorbeeld [\"verblijf-orsa\"]");
      return;
    }
    list.forEach(function (id, k) {
      var place = typeof id === "string" && Object.prototype.hasOwnProperty.call(placeTrips, id) ? placeTrips[id] : null;
      if (!place) {
        err(where, "plek " + JSON.stringify(id) + " in \"plekken\" bestaat in geen enkele regio");
      } else if (list.indexOf(id) !== k) {
        err(where, "plek \"" + id + "\" staat dubbel in \"plekken\"");
      } else if (!overlap(place.region, journeyTrips)) {
        err(where, "plek \"" + id + "\" ligt in een regio zonder de reizen van dit reisverloop (" + journeyTrips.join(", ") + ")");
      } else if (place.own && !overlap(place.own, journeyTrips)) {
        warnings.push(where + ": plek \"" + id + "\" hoort alleen bij " + place.own.join(", ") + ", dus klanten van dit reisverloop zien hem niet.");
      }
    });
  }

  function checkPoints(where, punten) {
    if (punten === undefined) return;
    if (!Array.isArray(punten) || !punten.length) {
      err(where, "\"punten\" moet een lijst met minstens één punt zijn");
      return;
    }
    punten.forEach(function (punt, k) {
      var at = where + " > punten[" + k + "]";
      if (!isObjectAt(at, punt, "{ \"naam\", \"soort\", \"coord\" }")) return;
      unknownFields(punt, POINT_FIELDS, at);
      checkText(at, punt, "naam", true, LIMITS.title);
      checkChoice(at, punt, "soort", POINT_TYPES);
      checkCoord(at, "coord", punt.coord);
    });
  }

  function checkRoute(where, route) {
    if (route === undefined) return;
    var at = where + " > route";
    if (!isObjectAt(at, route, "{ \"modus\", \"lijn\" }")) return;
    unknownFields(route, ROUTE_FIELDS, at);
    checkChoice(at, route, "modus", ROUTE_MODES);
    checkLine(at, "lijn", route.lijn);
    checkText(at, route, "afstand", false, LIMITS.short);
    checkText(at, route, "duur", false, LIMITS.short);
  }

  function checkNavigation(where, nav) {
    if (nav === undefined) return;
    var at = where + " > navigatie";
    if (!isObjectAt(at, nav, "{ \"modus\", \"naar\" }")) return;
    unknownFields(nav, NAV_FIELDS, at);
    checkChoice(at, nav, "modus", NAV_MODES);
    checkCoord(at, "naar", nav.naar);
    if (nav.van !== undefined) checkCoord(at, "van", nav.van);
  }

  if (!isPlainObject(data)) return { errors: ["het bestand moet één object { ... } zijn"], warnings: warnings };
  unknownFields(data, TOP_FIELDS, "bovenaan");

  if (data.ingetrokken !== undefined) {
    if (!Array.isArray(data.ingetrokken)) {
      err("ingetrokken", "moet een lijst zijn, bijvoorbeeld [\"a1b2c3d4\"]");
    } else {
      data.ingetrokken.forEach(function (id, i) {
        if (typeof id !== "string" || !rc.ID_PATTERN.test(id)) {
          err("ingetrokken[" + i + "]", JSON.stringify(id) + " is geen code-id (8 tekens, a-z en 0-9)");
        }
      });
    }
  }

  /* Regions and their places. */
  if (!Array.isArray(data.regios) || !data.regios.length) {
    err("regios", "moet een lijst met minstens één regio zijn");
  } else {
    data.regios.forEach(function (regio, i) {
      var where = label("regios[" + i + "]", regio);
      if (!isObjectAt(where, regio, "{ ... }")) return;
      unknownFields(regio, REGION_FIELDS, where);
      checkId(where, regio.id, ids);
      checkText(where, regio, "naam", true);
      checkText(where, regio, "intro", false);
      checkText(where, regio, "ondertitel", false);
      var regionTrips = checkTrips(where, regio.reizen, "reizen");
      checkCoord(where, "centrum", regio.centrum);
      if (typeof regio.zoom !== "number" || !isFinite(regio.zoom) || regio.zoom < 0 || regio.zoom > 22) {
        err(where, "\"zoom\" moet een getal tussen 0 en 22 zijn, bijvoorbeeld 8.4");
      }
      if (!Array.isArray(regio.plekken)) {
        err(where, "\"plekken\" moet een lijst zijn");
        return;
      }

      regio.plekken.forEach(function (plek, j) {
        var spot = label(where + " > plekken[" + j + "]", plek);
        if (!isObjectAt(spot, plek, "{ ... }")) return;
        unknownFields(plek, PLACE_FIELDS, spot);
        checkId(spot, plek.id, ids);
        checkChoice(spot, plek, "soort", PLACE_TYPES);
        if (plek.pin !== undefined) checkChoice(spot, plek, "pin", PIN_TYPES);
        if (plek.klein !== undefined && plek.klein !== true) err(spot, "\"klein\" moet true zijn, of haal het veld weg");
        checkText(spot, plek, "naam", true);
        checkCoord(spot, "coord", plek.coord);
        ["adres", "info", "tip", "reistijd"].forEach(function (field) { checkText(spot, plek, field, false); });
        if (plek.link !== undefined) {
          var https = false;
          try { https = typeof plek.link === "string" && new URL(plek.link).protocol === "https:"; } catch (fout) { https = false; }
          if (!https) err(spot, "\"link\" moet een volledig https://-adres zijn");
        }
        checkPhones(spot, plek.telefoon);
        checkTracks(spot, plek.banen);
        checkMarkers(spot, plek.markeringen);
        checkTravelTimes(spot, plek.reistijden);
        checkPhotos(spot, plek.fotos);
        (Array.isArray(plek.reistijden) ? plek.reistijden : []).forEach(function (reistijd, k) {
          if (!reistijd || typeof reistijd.vanaf !== "string") return;
          var from = regio.plekken.filter(function (other) { return other && other.id === reistijd.vanaf; })[0];
          if (!from || from.soort !== "verblijf") {
            err(spot + " > reistijden[" + k + "]", "\"vanaf\" moet het id van een verblijf in deze regio zijn");
          }
        });
        var ownTrips = null;
        if (plek.reizen !== undefined) {
          ownTrips = checkTrips(spot, plek.reizen, "reizen");
          ownTrips.forEach(function (trip) {
            if (regionTrips.indexOf(trip) === -1) {
              err(spot, "reis \"" + trip + "\" staat niet bij de regio; voeg hem toe aan de \"reizen\" van de regio of haal hem hier weg");
            }
          });
        }
        if (typeof plek.id === "string" && !Object.prototype.hasOwnProperty.call(placeTrips, plek.id)) {
          placeTrips[plek.id] = { region: regionTrips, own: ownTrips };
        }
      });
    });
  }

  /* Step-by-step journeys (optional). */
  if (data.reisverlopen !== undefined) {
    if (!Array.isArray(data.reisverlopen)) {
      err("reisverlopen", "moet een lijst zijn");
    } else {
      data.reisverlopen.forEach(function (verloop, i) {
        var where = label("reisverlopen[" + i + "]", verloop);
        if (!isObjectAt(where, verloop, "{ ... }")) return;
        unknownFields(verloop, JOURNEY_FIELDS, where);
        checkId(where, verloop.id, ids);
        checkText(where, verloop, "naam", true, LIMITS.title);
        var journeyTrips = checkTrips(where, verloop.reizen, "reizen");
        if (!Array.isArray(verloop.stappen) || !verloop.stappen.length) {
          err(where, "\"stappen\" moet een lijst met minstens één stap zijn");
          return;
        }
        var stepIds = {};
        verloop.stappen.forEach(function (stap, j) {
          var spot = label(where + " > stappen[" + j + "]", stap);
          if (!isObjectAt(spot, stap, "{ ... }")) return;
          unknownFields(stap, STEP_FIELDS, spot);
          checkId(spot, stap.id, stepIds);
          checkChoice(spot, stap, "soort", STEP_TYPES);
          checkText(spot, stap, "titel", true, LIMITS.title);
          checkText(spot, stap, "tekst", false, LIMITS.text);
          checkText(spot, stap, "tip", false, LIMITS.text);
          checkTextList(spot, stap, "lijst", LIMITS.item);
          checkGroups(spot, stap.groepen);
          checkStepPlaces(spot, stap.plekken, journeyTrips);
          checkPoints(spot, stap.punten);
          checkRoute(spot, stap.route);
          checkNavigation(spot, stap.navigatie);
        });
      });
    }
  }

  return { errors: errors, warnings: warnings };
}

function overlap(a, b) {
  return a.some(function (item) { return b.indexOf(item) !== -1; });
}

/* Where "[INVULLEN" text is still in the (stripped) data, as labels:
   journey: journeys and steps (hidden live), other: regions and places
   (not hidden live). */
function findPlaceholders(clean) {
  function fields(obj, skip) {
    return Object.keys(obj).filter(function (key) { return key !== skip && rc.hasPlaceholder(obj[key]); });
  }
  var journey = [];
  var other = [];
  (clean.reisverlopen || []).forEach(function (verloop, i) {
    var where = "reisverlopen[" + i + "] (" + verloop.id + ")";
    var own = fields(verloop, "stappen");
    if (own.length) journey.push(where + ": " + own.join(", ") + " (het hele reisverloop)");
    verloop.stappen.forEach(function (stap, j) {
      var found = fields(stap, "");
      if (found.length) journey.push(where + " > stappen[" + j + "] (" + stap.id + "): " + found.join(", "));
    });
  });
  clean.regios.forEach(function (regio, i) {
    var where = "regios[" + i + "] (" + regio.id + ")";
    var own = fields(regio, "plekken");
    if (own.length) other.push(where + ": " + own.join(", "));
    regio.plekken.forEach(function (plek, j) {
      var found = fields(plek, "");
      if (found.length) other.push(where + " > plekken[" + j + "] (" + plek.id + "): " + found.join(", "));
    });
  });
  return { journey: journey, other: other };
}

/* Where a place name or address, a track or marker name, or a journey
   point name appears literally in text: a list of labels (never the values
   themselves). Values shorter than 4 characters are skipped: they turn up
   in any base64 text by chance and say nothing on their own. */
function findLeaks(text, data) {
  var leaks = [];
  function look(value, where) {
    if (typeof value === "string" && value.trim().length >= 4 && text.indexOf(value.trim()) !== -1) leaks.push(where);
  }
  (data.regios || []).forEach(function (regio, i) {
    (regio.plekken || []).forEach(function (plek, j) {
      look(plek.naam, "regios[" + i + "] > plekken[" + j + "] (" + plek.id + ") naam");
      look(plek.adres, "regios[" + i + "] > plekken[" + j + "] (" + plek.id + ") adres");
      (plek.banen || []).forEach(function (baan, k) {
        look(baan.naam, "regios[" + i + "] > plekken[" + j + "] (" + plek.id + ") > banen[" + k + "] naam");
      });
      (plek.markeringen || []).forEach(function (markering, k) {
        look(markering.naam, "regios[" + i + "] > plekken[" + j + "] (" + plek.id + ") > markeringen[" + k + "] naam");
      });
    });
  });
  (data.reisverlopen || []).forEach(function (verloop, i) {
    (verloop.stappen || []).forEach(function (stap, j) {
      (stap.punten || []).forEach(function (punt, k) {
        look(punt.naam, "reisverlopen[" + i + "] > stappen[" + j + "] > punten[" + k + "] naam");
      });
    });
  });
  if (text.indexOf("\"plekken\"") !== -1 || text.indexOf("\"regios\"") !== -1 || text.indexOf("\"stappen\"") !== -1) {
    leaks.push("leesbare JSON-structuur");
  }
  return leaks;
}

function dataFileText(box) {
  return DATA_HEADER + "module.exports = { v: 1, iv: " + JSON.stringify(box.iv) +
    ", tag: " + JSON.stringify(box.tag) + ", data: " + JSON.stringify(box.data) + " };\n";
}

/* ---------- commands ---------- */

function cmdGeheim(options) {
  var file = envPath(options);
  var env = readEnv(file);

  if (env.value) {
    console.log("Er staat al een REISGIDS_GEHEIM in " + shown(file) + ". Er is niets veranderd.");
    console.log("Een bestaand geheim wordt nooit overschreven: alle verstuurde links horen erbij.");
    if (options.toon) console.log("\nREISGIDS_GEHEIM=" + env.value);
    return;
  }

  var secret = crypto.randomBytes(32).toString("base64url");
  if (env.index !== -1) {
    // An empty "REISGIDS_GEHEIM=" line: fill in only that line.
    var lines = env.text.split("\n");
    var carriage = /\r$/.test(lines[env.index]) ? "\r" : "";
    lines[env.index] = "REISGIDS_GEHEIM=" + secret + carriage;
    fs.writeFileSync(file, lines.join("\n"));
  } else {
    var prefix = env.text && env.text.charAt(env.text.length - 1) !== "\n" ? "\n" : "";
    fs.appendFileSync(file, prefix + "REISGIDS_GEHEIM=" + secret + "\n", { mode: 0o600 });
  }

  console.log("Nieuw geheim gemaakt en opgeslagen in " + shown(file) + " (REISGIDS_GEHEIM).");
  if (options.toon) console.log("\nREISGIDS_GEHEIM=" + secret);
  console.log("");
  console.log("Zet precies dezelfde waarde ook in Vercel, anders werkt de reisgids live niet:");
  console.log("  1. Vercel > het project > Settings > Environment Variables");
  console.log("  2. Naam: REISGIDS_GEHEIM. Waarde: de tekst achter REISGIDS_GEHEIM= in " + shown(file));
  console.log("     (laat hem zien met: node scripts/reisgids.js geheim --toon)");
  console.log("  3. Vink Production aan en sla op.");
  console.log("  4. Deploy daarna opnieuw (Deployments > Redeploy).");
  console.log("");
  console.log("Volgende stap: node scripts/reisgids.js bouw");
  console.log("Verander dit geheim later niet: dan werken alle verstuurde links niet meer.");
}

function cmdBouw(options) {
  var found = requireSecret(options);
  var source = sourcePath(options);

  if (isInside(source, SITE_DIR)) {
    fail(shown(source) + " staat in website/ en zou dan online komen. Zet de leesbare data in brand_assets/reisgids/.");
  }
  if (!fs.existsSync(source)) fail("bestand niet gevonden: " + shown(source));

  var plain;
  try {
    plain = JSON.parse(fs.readFileSync(source, "utf8"));
  } catch (fout) {
    fail(shown(source) + " is geen geldige JSON: " + fout.message);
  }

  var check = validateGuide(plain);
  check.warnings.forEach(function (warning) { console.log("Let op: " + warning); });
  if (check.errors.length) {
    console.error("Fout: " + shown(source) + " klopt nog niet (" + check.errors.length + "):");
    check.errors.forEach(function (error) { console.error("  - " + error); });
    console.error("Er is niets geschreven.");
    process.exit(1);
  }

  // Private "_" notes never leave this Mac, not even encrypted.
  var clean = rc.stripPrivate(plain);
  addPhotoSizes(clean);
  var dataFile = dataPath(options);
  var previous = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, "utf8") : null;

  function undo(message) {
    if (previous === null) {
      try { fs.unlinkSync(dataFile); } catch (fout) { /* already gone */ }
    } else {
      fs.writeFileSync(dataFile, previous);
    }
    console.error("FOUT, NIET COMMITTEN: " + message);
    console.error(shown(dataFile) + " is teruggezet naar de vorige versie.");
    process.exit(1);
  }

  // A short name made of base64 characters (say "Mora") can turn up in the
  // ciphertext by pure chance; a fresh iv makes that disappear. A real leak
  // stays in every attempt.
  var box, written, leaks;
  for (var attempt = 0; attempt < 5; attempt++) {
    box = rc.encryptJson(clean, found.secret);
    fs.writeFileSync(dataFile, dataFileText(box));
    written = fs.readFileSync(dataFile, "utf8");
    leaks = findLeaks(written, plain);
    if (!leaks.length) break;
  }
  if (leaks.length) undo("leesbare gegevens gevonden in het versleutelde bestand: " + leaks.join("; "));
  if (written !== dataFileText(box)) undo("het geschreven bestand is niet wat er geschreven had moeten worden.");

  var back = readEncryptedData(found.secret, dataFile);
  if (!back || JSON.stringify(back) !== JSON.stringify(clean)) undo("het geschreven bestand is niet terug te lezen met dit geheim.");

  var places = 0;
  var journeys = clean.reisverlopen || [];
  console.log("Klaar: " + shown(dataFile) + " is opnieuw gemaakt (versleuteld).");
  console.log("  Bron: " + shown(source));
  console.log("  Geheim uit: " + found.source);
  clean.regios.forEach(function (regio) {
    places += regio.plekken.length;
    console.log("  " + regio.naam + ": " + count(regio.plekken.length, "plek", "plekken") + " (" + regio.reizen.join(", ") + ")");
  });
  journeys.forEach(function (verloop) {
    console.log("  Reisverloop \"" + verloop.naam + "\": " + count(verloop.stappen.length, "stap", "stappen") + " (" + verloop.reizen.join(", ") + ")");
  });
  console.log("  Totaal: " + count(clean.regios.length, "regio", "regio's") + ", " + count(places, "plek", "plekken") + ", " +
    count(journeys.length, "reisverloop", "reisverlopen") + ", " +
    count((clean.ingetrokken || []).length, "ingetrokken code", "ingetrokken codes"));
  console.log("Controle geslaagd: geen plaatsnaam of adres leesbaar in het bestand, en het opent weer met het geheim.");

  var open = findPlaceholders(clean);
  if (open.journey.length) {
    console.log("");
    console.log("Let op: nog niet ingevuld (\"[INVULLEN\") in " + count(open.journey.length, "onderdeel", "onderdelen") + " van een reisverloop:");
    open.journey.forEach(function (item) { console.log("  - " + item); });
    console.log("Live (Vercel production) ziet een klant deze stappen niet. Lokaal (dev-server) wel, als voorbeeld.");
  }
  if (open.other.length) {
    console.log("");
    console.log("Let op: ook nog \"[INVULLEN\" bij regio's of plekken. Die worden live NIET verborgen, klanten zien dit dus wel:");
    open.other.forEach(function (item) { console.log("  - " + item); });
  }
  console.log("");
  console.log("Volgende stap: commit en push " + shown(dataFile) + ". De leesbare reisgids.json blijft alleen op deze Mac.");
}

function cmdLink(options) {
  var errors = [];

  var naam = typeof options.naam === "string" ? options.naam.trim() : "";
  if (!naam) errors.push("--naam ontbreekt, bijvoorbeeld --naam \"Familie Jansen\"");
  else if (naam.length > rc.NAME_MAX) errors.push("de naam is te lang (" + naam.length + " tekens, maximaal " + rc.NAME_MAX + ")");
  else if (!rc.isValidName(naam)) errors.push("de naam bevat tekens die niet mogen (zoals een enter of tab)");

  var trips = [];
  if (typeof options.reis !== "string" || !options.reis.trim()) {
    errors.push("--reis ontbreekt, bijvoorbeeld --reis falun of --reis falun,orsa");
  } else {
    options.reis.split(",").forEach(function (part) {
      var trip = part.trim().toLowerCase();
      if (!trip) return;
      if (rc.TRIPS.indexOf(trip) === -1) errors.push("onbekende reis \"" + trip + "\" (kies uit: " + rc.TRIPS.join(", ") + ")");
      else if (trips.indexOf(trip) === -1) trips.push(trip);
    });
    if (!trips.length && !errors.length) errors.push("--reis bevat geen reis");
  }

  var tot = typeof options.tot === "string" ? options.tot.trim() : "";
  var today = rc.todayInStockholm();
  if (!tot) errors.push("--tot ontbreekt: de laatste dag dat de link werkt, bijvoorbeeld --tot 2027-02-20");
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(tot)) errors.push("--tot \"" + tot + "\" heeft niet de vorm JJJJ-MM-DD, bijvoorbeeld 2027-02-20");
  else if (!rc.isRealDate(tot)) errors.push("--tot " + tot + " bestaat niet als datum");
  else if (tot < today) errors.push("--tot " + tot + " ligt in het verleden (vandaag is " + today + " in Zweden)");

  var base = PRODUCTION_BASE;
  if (options.basis !== undefined) {
    var url = null;
    try { url = new URL(String(options.basis)); } catch (fout) { url = null; }
    if (!url || (url.protocol !== "https:" && url.protocol !== "http:") || url.search || url.hash) {
      errors.push("--basis moet een adres zijn zoals http://localhost:3000");
    } else {
      base = url.origin + url.pathname.replace(/\/+$/, "");
    }
  }

  if (errors.length) {
    console.error("Fout: de link is niet gemaakt:");
    errors.forEach(function (error) { console.error("  - " + error); });
    process.exit(1);
  }

  var found = requireSecret(options);
  var id = rc.newCodeId();
  var code = rc.signCode({ v: 1, id: id, n: naam, r: trips, t: tot }, found.secret);

  console.log("Link voor " + naam + " (" + trips.join(", ") + "), geldig tot en met " + tot + ":");
  console.log("");
  console.log(base + "/reisgids/?code=" + encodeURIComponent(code));
  console.log("");
  console.log("Code-id: " + id);
  console.log("Bewaar dit id. Intrekken: zet \"" + id + "\" in \"ingetrokken\" in reisgids.json, draai bouw en push.");

  var dataFile = dataPath(options);
  var data = readEncryptedData(found.secret, dataFile);
  var forTrips = function (item) {
    return Array.isArray(item.reizen) && item.reizen.some(function (trip) { return trips.indexOf(trip) !== -1; });
  };
  if (!data) {
    console.log("Let op: er is nog geen leesbare versleutelde data (" + shown(dataFile) + "). Draai: node scripts/reisgids.js bouw");
  } else if (!(data.regios || []).some(forTrips) && !(data.reisverlopen || []).some(forTrips)) {
    console.log("Let op: voor " + trips.join(", ") + " staat nog geen regio of reisverloop in de reisgids. De klant ziet dan een lege gids.");
  }
}

/* The code from a full link or a bare code. */
function codeFrom(input) {
  var match = /[?&]code=([^&#\s]*)/.exec(input);
  if (!match) return input.trim();
  try { return decodeURIComponent(match[1]).trim(); } catch (fout) { return match[1].trim(); }
}

/* What a code claims, without checking the signature (for display only). */
function claimedPayload(code) {
  try {
    var part = code.split(".")[0];
    var payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    return isPlainObject(payload) ? payload : null;
  } catch (fout) {
    return null;
  }
}

function cmdCheck(positional, options) {
  if (positional.length !== 1 || !positional[0].trim()) {
    fail("geef precies één code of link mee: node scripts/reisgids.js check \"<code of link>\"");
  }
  var code = codeFrom(positional[0]);
  var found = requireSecret(options);
  var payload = rc.verifyCode(code, found.secret);

  if (!payload) {
    var claimed = claimedPayload(code);
    if (claimed) {
      console.log("Naam:        " + String(claimed.n) + "   (niet te vertrouwen)");
      console.log("Reizen:      " + (Array.isArray(claimed.r) ? claimed.r.join(", ") : String(claimed.r)));
      console.log("Laatste dag: " + String(claimed.t));
      console.log("Code-id:     " + String(claimed.id));
    }
    console.log("Status:      ONGELDIG. De code is beschadigd of aangepast, of hoort bij een ander geheim.");
    process.exitCode = 1;
    return;
  }

  console.log("Naam:        " + payload.n);
  console.log("Reizen:      " + payload.r.join(", "));
  console.log("Laatste dag: " + payload.t);
  console.log("Code-id:     " + payload.id);

  var data = readEncryptedData(found.secret, dataPath(options));
  var revoked = !!data && Array.isArray(data.ingetrokken) && data.ingetrokken.indexOf(payload.id) !== -1;
  var expired = rc.todayInStockholm() > payload.t;

  if (revoked) {
    console.log("Status:      INGETROKKEN" + (expired ? " (en ook verlopen)" : "") + ". De klant ziet de gids niet meer.");
  } else if (expired) {
    console.log("Status:      VERLOPEN. De laatste dag was " + payload.t + ".");
  } else {
    console.log("Status:      GELDIG, tot en met " + payload.t + ".");
  }

  if (!data) {
    console.log("Let op: de versleutelde data is niet te lezen, dus intrekken is niet gecontroleerd. Draai: node scripts/reisgids.js bouw");
  } else {
    var source = sourcePath(options);
    var plain = null;
    try { plain = JSON.parse(fs.readFileSync(source, "utf8")); } catch (fout) { plain = null; }
    if (plain && Array.isArray(plain.ingetrokken)) {
      var revokedInSource = plain.ingetrokken.indexOf(payload.id) !== -1;
      if (revokedInSource && !revoked) {
        console.log("Let op: in reisgids.json staat deze code als ingetrokken, maar nog niet in de versleutelde data. Draai bouw en push.");
      } else if (!revokedInSource && revoked) {
        console.log("Let op: deze code staat niet meer als ingetrokken in reisgids.json. Draai bouw en push om dat door te voeren.");
      }
    }
  }
  if (revoked || expired) process.exitCode = 1;
}

function usage() {
  console.log("Reisgids: privé-locaties en persoonlijke links voor klanten.");
  console.log("");
  console.log("  node scripts/reisgids.js geheim");
  console.log("      maak het geheim aan (eenmalig; --toon laat het zien voor Vercel)");
  console.log("  node scripts/reisgids.js bouw");
  console.log("      versleutel brand_assets/reisgids/reisgids.json naar website/api/_reisgids-data.js");
  console.log("  node scripts/reisgids.js link --naam \"Familie Jansen\" --reis falun,orsa --tot 2027-02-20");
  console.log("      maak een persoonlijke link (--basis http://localhost:3000 voor lokaal testen)");
  console.log("  node scripts/reisgids.js check \"<code of link>\"");
  console.log("      controleer een code of link");
  console.log("");
  console.log("Reizen: " + rc.TRIPS.join(", "));
}

function main(argv) {
  if (!argv.length || argv[0] === "help" || argv[0] === "--help" || argv[0] === "-h") {
    usage();
    return;
  }
  if (!COMMAND_OPTIONS[argv[0]]) {
    console.error("Fout: onbekende opdracht \"" + argv[0] + "\".\n");
    usage();
    process.exit(1);
  }
  var args = parseArgs(argv);
  if (args.command !== "check" && args.positional.length) {
    fail("onverwacht: \"" + args.positional.join(" ") + "\". Zet waarden achter een optie, bijvoorbeeld --naam \"Familie Jansen\".");
  }
  if (args.command === "geheim") cmdGeheim(args.options);
  else if (args.command === "bouw") cmdBouw(args.options);
  else if (args.command === "link") cmdLink(args.options);
  else cmdCheck(args.positional, args.options);
}

if (require.main === module) {
  main(process.argv.slice(2));
} else {
  module.exports = {
    validateGuide: validateGuide, findLeaks: findLeaks, findPlaceholders: findPlaceholders,
    codeFrom: codeFrom, dataFileText: dataFileText
  };
}
