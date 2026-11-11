/* Vercel serverless function: the private travel guide ("reisgids").

   A customer who booked a trip gets a personal link
   (https://www.novakse.com/reisgids/?code=...). The page sends that code
   here as POST with JSON { "code": "..." } and gets back only the regions,
   places and step-by-step journeys ("reisverlopen") of the booked trips.

   The location data is in git only in encrypted form (api/_reisgids-data.js,
   made by `node scripts/reisgids.js bouw`). The key is the environment
   variable REISGIDS_GEHEIM in the Vercel project settings.

   What a customer gets, always in file order and without "_" keys:
     regios        regions whose "reizen" overlap the booked trips, each with
                   only the places without "reizen" or with an overlapping one
                   (places come with all their fields, such as the swept
                   tracks "banen" and their "markeringen")
     reisverlopen  journeys whose "reizen" overlap the booked trips. A step's
                   "plekken" only keeps ids of places in the regios above.
   Placeholders: owner text not known yet contains "[INVULLEN". On Vercel
   production (VERCEL_ENV === "production") every step with such text is
   dropped, and a journey whose own fields have it is dropped whole, so no
   customer ever sees one; locally they stay, so the owner can preview
   them. A journey left without steps is omitted.

   Answers (always Cache-Control: no-store and X-Robots-Tag: noindex):
     200 { klant: { naam, tot, id }, regios: [...], reisverlopen: [...] }
     401 { fout: "ongeldig" }          code missing, damaged or tampered with
     403 { fout: "ingetrokken" }       code id is listed in "ingetrokken"
     405 { fout: "methode" }           anything but POST
     410 { fout: "verlopen", tot }     today (Swedish date) is after the last day
     503 { fout: "niet-ingesteld" }    secret or data missing or unreadable */

var reisgidsCrypto = require("./_reisgids-crypto.js");

// Decrypted data after the first successful request: { secret, data }.
var cache = null;

/* The decrypted guide data, or null when it is missing or cannot be
   opened with this secret. */
function loadGuideData(secret) {
  if (cache && cache.secret === secret) return cache.data;
  var box;
  try {
    // Fresh read on a cold cache, so the local dev server sees a new build
    // without a restart. On Vercel this only happens once per instance.
    delete require.cache[require.resolve("./_reisgids-data.js")];
    box = require("./_reisgids-data.js");
  } catch (fout) {
    return null;
  }
  var data;
  try {
    data = reisgidsCrypto.decryptJson(box, secret);
  } catch (fout) {
    return null;
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.regios)) return null;
  if (data.ingetrokken !== undefined && !Array.isArray(data.ingetrokken)) return null;
  if (data.reisverlopen !== undefined && !Array.isArray(data.reisverlopen)) return null;
  cache = { secret: secret, data: data };
  return data;
}

/* The code from the JSON body, or "" when there is none. */
function readCode(req) {
  var body;
  try {
    body = req.body; // Vercel throws here on invalid JSON
  } catch (fout) {
    return "";
  }
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (fout) { return ""; }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return "";
  return typeof body.code === "string" ? body.code.trim() : "";
}

function overlaps(list, trips) {
  return Array.isArray(list) && list.some(function (trip) { return trips.indexOf(trip) !== -1; });
}

/* Regions for the booked trips, in file order, each with only the places
   for those trips (a place without "reizen" belongs to every trip of its
   region). Private "_" keys never leave this function. */
function regionsFor(data, trips) {
  return data.regios.filter(function (regio) {
    return regio && typeof regio === "object" && overlaps(regio.reizen, trips);
  }).map(function (regio) {
    var places = Array.isArray(regio.plekken) ? regio.plekken : [];
    var copy = strippedWithout(regio, "plekken");
    copy.plekken = places.filter(function (plek) {
      return plek && typeof plek === "object" && (plek.reizen === undefined || overlaps(plek.reizen, trips));
    }).map(reisgidsCrypto.stripPrivate);
    return copy;
  });
}

/* Copy of obj without the key `skip`, with "_" keys stripped. */
function strippedWithout(obj, skip) {
  var copy = {};
  Object.keys(obj).forEach(function (key) {
    if (key !== skip) copy[key] = obj[key];
  });
  return reisgidsCrypto.stripPrivate(copy);
}

/* Journeys for the booked trips, in file order. `regions` is the regionsFor()
   result: a step's "plekken" keeps only ids the customer actually gets.
   With hidePlaceholders, steps holding "[INVULLEN" text are dropped. */
function journeysFor(data, trips, regions, hidePlaceholders) {
  var visible = Object.create(null);
  regions.forEach(function (regio) {
    regio.plekken.forEach(function (plek) { visible[plek.id] = true; });
  });

  var journeys = [];
  (Array.isArray(data.reisverlopen) ? data.reisverlopen : []).forEach(function (verloop) {
    if (!verloop || typeof verloop !== "object" || !overlaps(verloop.reizen, trips)) return;
    var copy = strippedWithout(verloop, "stappen");
    if (hidePlaceholders && reisgidsCrypto.hasPlaceholder(copy)) return;

    copy.stappen = (Array.isArray(verloop.stappen) ? verloop.stappen : []).filter(function (stap) {
      return stap && typeof stap === "object";
    }).map(reisgidsCrypto.stripPrivate).filter(function (stap) {
      return !(hidePlaceholders && reisgidsCrypto.hasPlaceholder(stap));
    }).map(function (stap) {
      if (Array.isArray(stap.plekken)) {
        stap.plekken = stap.plekken.filter(function (id) { return visible[id] === true; });
        if (!stap.plekken.length) delete stap.plekken;
      }
      return stap;
    });

    if (copy.stappen.length) journeys.push(copy);
  });
  return journeys;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ fout: "methode" });
    return;
  }

  try {
    var secret = String(process.env.REISGIDS_GEHEIM || "").trim();
    var data = null;
    try {
      reisgidsCrypto.keysFromSecret(secret);
      data = loadGuideData(secret);
    } catch (fout) {
      data = null;
    }
    if (!data) {
      console.error("reisgids: not configured (REISGIDS_GEHEIM or api/_reisgids-data.js missing or unreadable)");
      res.status(503).json({ fout: "niet-ingesteld" });
      return;
    }

    var klant = reisgidsCrypto.verifyCode(readCode(req), secret);
    if (!klant) {
      res.status(401).json({ fout: "ongeldig" });
      return;
    }

    var ingetrokken = Array.isArray(data.ingetrokken) ? data.ingetrokken : [];
    if (ingetrokken.indexOf(klant.id) !== -1) {
      res.status(403).json({ fout: "ingetrokken" });
      return;
    }

    if (reisgidsCrypto.todayInStockholm() > klant.t) {
      res.status(410).json({ fout: "verlopen", tot: klant.t });
      return;
    }

    var regios = regionsFor(data, klant.r);
    var production = process.env.VERCEL_ENV === "production";
    res.status(200).json({
      klant: { naam: klant.n, tot: klant.t, id: klant.id },
      regios: regios,
      reisverlopen: journeysFor(data, klant.r, regios, production)
    });
  } catch (fout) {
    console.error("reisgids: unexpected error");
    res.status(500).json({ fout: "serverfout" });
  }
};
